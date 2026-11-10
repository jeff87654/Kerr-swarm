// Guest-Right audio engine. Everything is synthesised: no samples, no files.
// One AudioContext, created on unlock (or injected for offline rendering).
//
//   master -> compressor -> soft clip -> destination
//   buses music, sfx, voice, amb: dry -> duck -> vol -> master
//                                 wet -> duck -> vol -> room reverb -> master
//   score music also feeds a fixed score reverb.
//
// Positions arrive in listener space (x right, y up, -z ahead), polled in update.

import { SFX, UI_SFX, SURFACES, renderStep } from './sfx.js';
import { rng, clamp, hash } from './dsp.js';
import { createReverb, ROOM_IDS } from './reverb.js';
import { createVoice, TIMBRES } from './voice.js';
import { LOOPS, BED_IDS, createBed, bedWarmJobs } from './beds.js';
import { CUES, createCue, warmMusic } from './music.js';

const BUS_NAMES = ['music', 'sfx', 'voice', 'amb'];
const MAX_VOICES = 40;
const MAX_LOOPS = 24;
const LOOKAHEAD = 0.3;
const DEFAULT_RADIUS = 1.5;
const WET = 0.6;              // reverb send at the reference distance
const SCORE_SEND = 0.4;       // non-positional music into the score reverb

// Buffers are context-independent; cache them for the life of the page, per sample rate.
const BUFFERS = new Map();

function makeAudioBuffer(ctx, data, sr) {
  const chans = Array.isArray(data) ? data : [data];
  const len = Math.max(1, chans[0].length);
  let b;
  try { b = new AudioBuffer({ length: len, numberOfChannels: chans.length, sampleRate: sr }); }
  catch (e) { b = ctx.createBuffer(chans.length, len, sr); }
  for (let c = 0; c < chans.length; c++) {
    const ch = chans[c] instanceof Float32Array ? chans[c] : Float32Array.from(chans[c]);
    b.copyToChannel(ch, c);
  }
  return b;
}

// Wavetables for oscillators (harmonic amplitudes, index 1 = fundamental).
const WAVES = {
  flute: [0, 1, 0.12, 0.09, 0.035, 0.02, 0.01, 0.005],
  soft: [0, 1, 0.22, 0.08, 0.04, 0.02],
  sine: [0, 1],
};
function waveTable(name) {
  if (WAVES[name]) return WAVES[name];
  const h = [0];
  if (name === 'glottal') for (let n = 1; n <= 48; n++) h.push(Math.pow(n, -1.15));
  else if (name === 'warm') for (let n = 1; n <= 24; n++) h.push(Math.pow(n, -1.6) * (n % 2 ? 1 : 0.7));
  else if (name === 'saw') for (let n = 1; n <= 32; n++) h.push(1 / n);
  else if (name === 'reed') for (let n = 1; n <= 24; n++) h.push((n % 2 ? 1 : 0.35) / n);
  else h.push(1);
  WAVES[name] = h;
  return h;
}

export function createAudio(game, options) {
  const opts = options || {};
  const settings = game && game.settings;
  let ctx = null;
  let offline = false;
  let ready = false;
  let eng = null;
  let master = null, comp = null, shaper = null, preShaper = null;
  let reverb = null, scoreConv = null, scoreRet = null;
  let voiceSynth = null;
  const bus = {};
  const vols = { master: 1, music: 1, sfx: 1, voice: 1, ambience: 1 };
  const rnd = opts.seed ? rng(opts.seed) : Math.random;

  // one-shot voice slots, reused
  const voices = [];
  for (let i = 0; i < MAX_VOICES; i++) voices.push({ active: false, src: null, gain: null, end: 0, start: 0, level: 0 });

  const loops = [];            // live loop records
  const fading = [];           // beds and cues that are fading out but still ticking: { inst, stopAt }
  const garbage = [];          // { t, nodes: [] } disconnect after t
  let bed = null;              // { id, out, inst }
  let cue = null;              // { id, out, inst, panner, lp, wet, posFn }
  let wantBed = 'none', wantBedFade = 2;
  let wantRoom = 'none';
  let wantMusic = null;        // { id, o }
  const params = {};           // music params, live
  let lastTick = -1;
  let timer = null;
  let warnOnce = {};
  let duckUntil = 0;
  let warmed = false;
  const slowWarm = [];
  let prof = null;             // debug: worst tick time per source, when enabled

  readSettings();
  if (game && game.events && game.events.on) {
    const onSet = () => { readSettings(); applyVolumes(0.1); };
    try { game.events.on('settings', onSet); game.events.on('settings:change', onSet); } catch (e) { /* optional */ }
  }

  if (opts.context) init(opts.context);

  function readSettings() {
    if (!settings || !settings.get) return;
    const g = (k, d) => { const v = settings.get(k); return typeof v === 'number' ? clamp(v, 0, 1) : d; };
    vols.master = g('volMaster', vols.master); vols.music = g('volMusic', vols.music);
    vols.sfx = g('volSfx', vols.sfx); vols.voice = g('volVoice', vols.voice); vols.ambience = g('volAmbience', vols.ambience);
  }

  // ------------------------------------------------------------ setup

  function init(context) {
    ctx = context;
    offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const sr = ctx.sampleRate;

    master = ctx.createGain();
    if (opts.limiter === false) {
      master.connect(ctx.destination);
    } else {
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -5; comp.knee.value = 4; comp.ratio.value = 10;
      comp.attack.value = 0.003; comp.release.value = 0.22;
      preShaper = ctx.createGain(); preShaper.gain.value = 1 / 1.5;
      shaper = ctx.createWaveShaper();
      const n = 2048, curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1) * 2 - 1) * 1.5, a = Math.abs(x);
        const y = a < 0.8 ? a : 0.8 + 0.19 * Math.tanh((a - 0.8) / 0.19);
        curve[i] = Math.sign(x) * y;
      }
      shaper.curve = curve;
      master.connect(comp); comp.connect(preShaper); preShaper.connect(shaper); shaper.connect(ctx.destination);
    }

    const roomIn = ctx.createGain();
    const roomOut = ctx.createGain();
    roomOut.connect(master);

    for (const name of BUS_NAMES) {
      const b = {
        dry: ctx.createGain(), wet: ctx.createGain(),
        duck: ctx.createGain(), wduck: ctx.createGain(),
        vol: ctx.createGain(), wvol: ctx.createGain(),
      };
      b.dry.connect(b.duck); b.duck.connect(b.vol); b.vol.connect(master);
      b.wet.connect(b.wduck); b.wduck.connect(b.wvol); b.wvol.connect(roomIn);
      bus[name] = b;
    }

    eng = {
      ctx, sr, rnd, offline,
      buffer: getBuffer,
      sfx: sfxBuffer,
      noise: () => getBuffer('noise:white', 1, noiseRender),
      wave: getWave,
      bus: (name) => bus[name],
      warn,
    };

    reverb = createReverb(eng, roomIn, roomOut);

    // score reverb, fed by non-positional music
    scoreConv = ctx.createConvolver();
    scoreConv.normalize = false;
    scoreConv.buffer = reverb.scoreIR();
    scoreRet = ctx.createGain(); scoreRet.gain.value = 1;
    scoreConv.connect(scoreRet); scoreRet.connect(bus.music.dry);

    voiceSynth = createVoice(eng, bus.voice.dry, bus.voice.wet);

    applyVolumes(0);
    ready = true;
    if (!offline) {
      timer = setInterval(tick, 50);
      scheduleWarm();
    }
    // apply what was asked for before the context existed
    reverb.set(wantRoom, 0.01);
    if (wantBed !== 'none') startBed(wantBed, 0.5);
    if (wantMusic) startMusic(wantMusic.id, wantMusic.o);
    for (const L of loops) if (!L.started) startLoop(L);
  }

  function noiseRender(sr) {
    const r = rng(99), n = Math.floor(sr * 3), b = new Float32Array(n);
    for (let i = 0; i < n; i++) b[i] = r() * 2 - 1;
    return b;
  }

  // key: cache key. variants: how many renders to keep. render(sr, rnd) -> Float32Array | [L, R] | { sr, data }
  function getBuffer(key, variants, render) {
    const sr = ctx.sampleRate;
    const k = key + '@' + sr;
    let e = BUFFERS.get(k);
    if (!e) { e = { list: [], last: -1 }; BUFFERS.set(k, e); }
    const want = Math.max(1, variants || 1);
    if (e.list.length < want) {
      const r = rng(hash(key) + e.list.length * 7919 + 1);
      let out = render(sr, r);
      let bsr = sr;
      if (out && out.data) { bsr = out.sr; out = out.data; }
      e.list.push(makeAudioBuffer(ctx, out, bsr));
      e.last = e.list.length - 1;
      return e.list[e.last];
    }
    let i = Math.floor(rnd() * e.list.length);
    if (e.list.length > 1 && i === e.last) i = (i + 1) % e.list.length;
    e.last = i;
    return e.list[i];
  }

  function sfxBuffer(name) {
    const d = SFX[name] || UI_SFX[name];
    if (!d) return null;
    return getBuffer((SFX[name] ? 'sfx:' : 'ui:') + name, d.variants || 3, d.render);
  }

  const waves = new Map();
  function getWave(name) {
    let w = waves.get(name);
    if (!w) {
      const h = waveTable(name);
      const real = new Float32Array(h.length), imag = new Float32Array(h.length);
      for (let i = 1; i < h.length; i++) imag[i] = h[i];
      w = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
      waves.set(name, w);
    }
    return w;
  }

  function warn(msg) {
    if (warnOnce[msg]) return;
    warnOnce[msg] = true;
    if (typeof console !== 'undefined') console.warn('[audio] ' + msg);
  }

  // Render the common buffers in idle moments so first use never hitches.
  function scheduleWarm() {
    const jobs = [];
    for (const id of ROOM_IDS) if (id !== 'none') jobs.push(() => reverb.warm(id));
    jobs.push(() => reverb.warm('smear'));
    for (const name in UI_SFX) for (let v = 0; v < (UI_SFX[name].variants || 3); v++) jobs.push(() => sfxBuffer(name));
    try { for (const j of bedWarmJobs(eng)) jobs.push(j); } catch (e) { warn('warm beds: ' + e.message); }
    jobs.push(() => warmMusic(eng));
    for (const s of SURFACES) for (let w = 0; w < 4; w++) for (let v = 0; v < 4; v++) jobs.push(() => stepBuffer(s, w, false));
    for (const s of SURFACES) for (let v = 0; v < 3; v++) jobs.push(() => stepBuffer(s, 3, true));
    for (const name in SFX) for (let v = 0; v < (SFX[name].variants || 3); v++) jobs.push(() => sfxBuffer(name));
    let i = 0;
    const run = () => {
      const t0 = performance.now();
      while (i < jobs.length && performance.now() - t0 < 6) {
        const j0 = performance.now();
        try { jobs[i](); } catch (e) { warn('warm: ' + e.message); }
        const d = performance.now() - j0;
        if (d > 30) slowWarm.push(i + ': ' + d.toFixed(0) + ' ms');
        i++;
      }
      if (i < jobs.length) setTimeout(run, 40);
      else warmed = true;
    };
    setTimeout(run, 200);
  }

  // ------------------------------------------------------------ volumes and ducking

  function curve(v) { return v * v; }

  function applyVolumes(tc) {
    if (!ready && !master) return;
    const t = ctx.currentTime, k = Math.max(0.005, tc === undefined ? 0.08 : tc);
    master.gain.setTargetAtTime(curve(vols.master), t, k);
    const map = { music: vols.music, sfx: vols.sfx, voice: vols.voice, amb: vols.ambience };
    for (const name of BUS_NAMES) {
      const g = curve(map[name]);
      bus[name].vol.gain.setTargetAtTime(g, t, k);
      bus[name].wvol.gain.setTargetAtTime(g, t, k);
    }
  }

  function setVolumes(v) {
    if (!v) return;
    for (const k of ['master', 'music', 'sfx', 'voice', 'ambience']) if (typeof v[k] === 'number') vols[k] = clamp(v[k], 0, 1);
    if (ctx) applyVolumes(0.08);
  }

  function duck(amount, seconds) {
    if (!ctx) return;
    const a = clamp(amount || 0, 0, 1);
    const t = ctx.currentTime;
    for (const name of ['music', 'amb']) {
      const b = bus[name];
      for (const g of [b.duck.gain, b.wduck.gain]) {
        g.cancelScheduledValues(t);
        g.setValueAtTime(g.value, t);
        g.setTargetAtTime(1 - a * (name === 'music' ? 0.75 : 0.55), t, 0.12);
        if (seconds > 0) g.setTargetAtTime(1, t + seconds, 0.35);
      }
    }
    duckUntil = seconds > 0 ? t + seconds : 0;
  }

  // ------------------------------------------------------------ space

  function makePanner(radius) {
    const p = ctx.createPanner();
    p.panningModel = opts.panning || 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = radius;
    p.rolloffFactor = 1;
    p.maxDistance = 20000;
    p.coneInnerAngle = 360;
    return p;
  }

  function placePanner(p, x, y, z, t, smooth) {
    if (p.positionX) {
      if (smooth) { p.positionX.setTargetAtTime(x, t, 0.04); p.positionY.setTargetAtTime(y, t, 0.04); p.positionZ.setTargetAtTime(z, t, 0.04); }
      else { p.positionX.setValueAtTime(x, t); p.positionY.setValueAtTime(y, t); p.positionZ.setValueAtTime(z, t); }
    } else p.setPosition(x, y, z);
  }

  // distance laws: air absorption and how much more of a far sound reaches us via the room
  function lpFor(d) { return clamp(20000 / (1 + d / 30), 900, 20000); }
  function wetFor(d, radius, send) { return WET * send * radius / (radius + 0.25 * Math.max(0, d - radius)); }

  // ------------------------------------------------------------ one-shots

  function grabSlot(now) {
    let best = -1, bestScore = Infinity;
    for (let i = 0; i < MAX_VOICES; i++) {
      const v = voices[i];
      if (!v.active || now > v.end) { if (v.active) v.active = false; return v; }
      const remain = (v.end - now) / Math.max(0.01, v.end - v.start);
      const score = v.level * (0.25 + remain);
      if (score < bestScore) { bestScore = score; best = i; }
    }
    const v = voices[best];
    try {
      v.gain.gain.cancelScheduledValues(now);
      v.gain.gain.setValueAtTime(v.gain.gain.value, now);
      v.gain.gain.linearRampToValueAtTime(0, now + 0.015);
      v.src.stop(now + 0.02);
    } catch (e) { /* already stopped */ }
    v.active = false;
    return v;
  }

  // Play a buffer as a voice. o: { pos, vol, rate, delay, send, bus, radius }
  function playBuffer(buf, o) {
    if (!buf) return;
    const now = ctx.currentTime;
    const t = now + Math.max(0, o.delay || 0) + 0.002;
    const slot = grabSlot(now);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const rate = o.rate || 1;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    const level = Math.max(0, o.vol);
    g.gain.value = level;
    const b = bus[o.bus || 'sfx'];
    const send = o.send === undefined ? 1 : o.send;
    let head = src;
    if (o.pos) {
      const x = o.pos[0] || 0, y = o.pos[1] || 0, z = o.pos[2] || 0;
      const d = Math.sqrt(x * x + y * y + z * z);
      const radius = o.radius || DEFAULT_RADIUS;
      if (d > 8) {
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = lpFor(d); lp.Q.value = 0.5;
        src.connect(lp); head = lp;
      }
      head.connect(g);
      const p = makePanner(radius);
      placePanner(p, x, y, z, now, false);
      g.connect(p); p.connect(b.dry);
      if (send > 0) {
        const w = ctx.createGain(); w.gain.value = wetFor(d, radius, send);
        g.connect(w); w.connect(b.wet);
      }
    } else {
      src.connect(g); g.connect(b.dry);
      if (send > 0) {
        const w = ctx.createGain(); w.gain.value = WET * send;
        g.connect(w); w.connect(b.wet);
      }
    }
    src.start(t);
    slot.active = true; slot.src = src; slot.gain = g; slot.level = level;
    slot.start = t; slot.end = t + buf.duration / rate + 0.05;
  }

  function play(name, o) {
    if (!ready) return;
    const d = SFX[name];
    if (!d) { warn('unknown sound ' + name); return; }
    const p = o || {};
    const buf = sfxBuffer(name);
    const pitch = (p.pitch || 1) * (1 + (rnd() - 0.5) * 0.06);
    const vol = d.gain * (p.vol === undefined ? 1 : p.vol) * (1 + (rnd() - 0.5) * 0.24);
    playBuffer(buf, { pos: p.pos, vol, rate: pitch, delay: p.delay, send: d.send === undefined ? 1 : d.send, bus: 'sfx', radius: p.radius });
  }

  function ui(name) {
    if (!ready) return;
    const d = UI_SFX[name];
    if (!d) { warn('unknown ui sound ' + name); return; }
    playBuffer(sfxBuffer(name), { vol: d.gain * (1 + (rnd() - 0.5) * 0.1), rate: 1 + (rnd() - 0.5) * 0.02, send: 0, bus: 'sfx' });
  }

  function stepBuffer(surface, bucket, land) {
    const w = [0.08, 0.35, 0.65, 1][bucket];
    return getBuffer('step:' + surface + ':' + bucket + (land ? ':land' : ''), land ? 3 : 4,
      (sr, r) => renderStep(sr, r, surface, w, !!land));
  }

  function footstep(surface, o) {
    if (!ready) return;
    const p = o || {};
    const s = SURFACES.indexOf(surface) >= 0 ? surface : 'stone';
    const g = clamp(p.g === undefined ? 1 : p.g, 0.03, 1);
    const w = Math.pow((g - 0.03) / 0.97, 0.7);
    const bucket = w < 0.2 ? 0 : w < 0.5 ? 1 : w < 0.8 ? 2 : 3;
    const speed = clamp((p.speed || 1.4) / 4, 0.2, 1.6);
    const buf = stepBuffer(s, bucket, !!p.land);
    let vol = p.land ? (0.12 + 0.22 * w) : (0.06 + 0.12 * w) * (0.75 + 0.3 * speed);
    vol *= 1 + (rnd() - 0.5) * 0.3;
    const rate = (p.land ? 1 : 0.92 + 0.08 * w) * (1 + (rnd() - 0.5) * 0.08);
    // your own feet: a touch below and in front, so the panner keeps them centred
    playBuffer(buf, { vol, rate, send: 0.6, bus: 'sfx' });
  }

  function voice(profile, ch) {
    if (!ready || !voiceSynth) return;
    voiceSynth.say(profile || {}, ch === undefined ? 'a' : String(ch), ctx.currentTime + 0.005);
  }

  // ------------------------------------------------------------ loops

  function loop(name, o) {
    const p = o || {};
    const def = LOOPS[name];
    const L = {
      name, def, started: false, stopped: false,
      vol: p.vol === undefined ? 1 : p.vol, radius: p.radius || 4, param: p.param === undefined ? 0.5 : p.param, pitch: 1,
      posFn: typeof p.pos === 'function' ? p.pos : null, pos: Array.isArray(p.pos) ? p.pos : null,
      out: null, gain: null, panner: null, lp: null, wet: null, inst: null,
    };
    const handle = {
      stop(fade) { stopLoop(L, fade === undefined ? 0.5 : fade); },
      set(s) {
        if (!s) return;
        if (typeof s.vol === 'number') L.vol = s.vol;
        if (typeof s.pitch === 'number') L.pitch = s.pitch;
        if (typeof s.param === 'number') L.param = s.param;
        if (L.started && !L.stopped) {
          const t = ctx.currentTime;
          L.gain.gain.setTargetAtTime(L.vol * (def.gain || 1), t, 0.05);
          if (L.inst.set) L.inst.set({ param: L.param, pitch: L.pitch }, t);
        }
      },
      get name() { return name; },
    };
    if (!def) { warn('unknown loop ' + name); L.stopped = true; return handle; }
    if (loops.length >= MAX_LOOPS) {
      // the oldest loop gives way
      stopLoop(loops[0], 0.3);
    }
    loops.push(L);
    if (ready) startLoop(L);
    return handle;
  }

  function startLoop(L) {
    if (L.started || L.stopped) return;
    const t = ctx.currentTime;
    const def = L.def;
    const b = bus[def.bus || 'sfx'];
    L.out = ctx.createGain();
    L.gain = ctx.createGain();
    L.gain.gain.setValueAtTime(0, t);
    L.gain.gain.setTargetAtTime(L.vol * (def.gain || 1), t, 0.08);
    L.out.connect(L.gain);
    const send = def.send === undefined ? 0.8 : def.send;
    const positional = !!(L.posFn || L.pos);
    if (positional) {
      L.lp = ctx.createBiquadFilter(); L.lp.type = 'lowpass'; L.lp.Q.value = 0.5; L.lp.frequency.value = 20000;
      L.panner = makePanner(L.radius);
      L.gain.connect(L.lp); L.lp.connect(L.panner); L.panner.connect(b.dry);
      L.wet = ctx.createGain(); L.wet.gain.value = 0;
      L.gain.connect(L.wet); L.wet.connect(b.wet);
      L.send = send;
      placeLoop(L, t, false);
    } else {
      L.gain.connect(b.dry);
      L.wet = ctx.createGain(); L.wet.gain.value = WET * send;
      L.gain.connect(L.wet); L.wet.connect(b.wet);
    }
    try {
      L.inst = def.create(eng, L.out, { param: L.param, pitch: L.pitch });
    } catch (e) {
      warn('loop ' + L.name + ': ' + e.message);
      L.inst = { stop() {} };
    }
    L.started = true;
  }

  function placeLoop(L, t, smooth) {
    const p = L.posFn ? L.posFn() : L.pos;
    if (!p) return;
    const x = p[0] || 0, y = p[1] || 0, z = p[2] || 0;
    const d = Math.sqrt(x * x + y * y + z * z);
    placePanner(L.panner, x, y, z, t, smooth);
    if (smooth) {
      L.lp.frequency.setTargetAtTime(lpFor(d), t, 0.1);
      L.wet.gain.setTargetAtTime(wetFor(d, L.radius, L.send), t, 0.1);
    } else {
      L.lp.frequency.setValueAtTime(lpFor(d), t);
      L.wet.gain.setValueAtTime(wetFor(d, L.radius, L.send), t);
    }
  }

  function stopLoop(L, fade) {
    if (L.stopped) return;
    L.stopped = true;
    const i = loops.indexOf(L);
    if (i >= 0) loops.splice(i, 1);
    if (!L.started) return;
    const t = ctx.currentTime, f = Math.max(0.02, fade);
    L.gain.gain.cancelScheduledValues(t);
    L.gain.gain.setValueAtTime(L.gain.gain.value, t);
    L.gain.gain.linearRampToValueAtTime(0, t + f);
    try { if (L.inst.stop) L.inst.stop(t + f + 0.05); } catch (e) { /* ignore */ }
    garbage.push({ t: t + f + 0.2, nodes: [L.out, L.gain, L.lp, L.panner, L.wet] });
  }

  // ------------------------------------------------------------ ambience beds

  function ambience(id, o) {
    const f = o && typeof o.fade === 'number' ? o.fade : 2;
    const want = BED_IDS.indexOf(id) >= 0 ? id : 'none';
    if (id && id !== 'none' && want === 'none') warn('unknown ambience ' + id);
    if (want === wantBed && (!ready || (bed && bed.id === want) || (!bed && want === 'none'))) return;
    wantBed = want; wantBedFade = f;
    if (ready) startBed(want, f);
  }

  function startBed(id, f) {
    const t = ctx.currentTime;
    if (bed) {
      const old = bed;
      old.out.gain.cancelScheduledValues(t);
      old.out.gain.setValueAtTime(old.out.gain.value, t);
      old.out.gain.linearRampToValueAtTime(0, t + f);
      fading.push({ inst: old.inst, stopAt: t + f + 0.05 });
      try { if (old.inst.stop) old.inst.stop(t + f + 0.05); } catch (e) { /* ignore */ }
      garbage.push({ t: t + f + 0.3, nodes: [old.out, old.wet] });
      bed = null;
    }
    if (id === 'none') return;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(1, t + Math.max(0.05, f));
    out.connect(bus.amb.dry);
    const wet = ctx.createGain(); wet.gain.value = WET * 0.5;
    out.connect(wet); wet.connect(bus.amb.wet);
    let inst;
    try { inst = createBed(eng, id, out); } catch (e) { warn('bed ' + id + ': ' + e.message); inst = { stop() {} }; }
    bed = { id, out, wet, inst };
  }

  function room(id) {
    wantRoom = ROOM_IDS.indexOf(id) >= 0 ? id : 'none';
    if (ready) reverb.set(wantRoom, 1);
  }

  // ------------------------------------------------------------ music

  function music(id, o) {
    const p = o || {};
    if (id && !CUES[id]) { warn('unknown cue ' + id); return; }
    wantMusic = id ? { id, o: p } : null;
    if (!ready) return;
    if (!id) { stopMusic(p.fade === undefined ? 2.5 : p.fade); return; }
    startMusic(id, p);
  }

  function stopMusic(f) {
    if (!cue) return;
    const t = ctx.currentTime, old = cue;
    old.out.gain.cancelScheduledValues(t);
    old.out.gain.setValueAtTime(old.out.gain.value, t);
    old.out.gain.linearRampToValueAtTime(0, t + Math.max(0.05, f));
    fading.push({ inst: old.inst, stopAt: t + f + 0.05 });
    try { if (old.inst.stop) old.inst.stop(t + f + 0.05); } catch (e) { /* ignore */ }
    garbage.push({ t: t + f + 4, nodes: [old.out, old.gain, old.panner, old.lp, old.wet, old.score] });
    cue = null;
  }

  function startMusic(id, p) {
    const positional = !!p.pos;
    const vol = p.vol === undefined ? 1 : p.vol;
    const f = p.fade === undefined ? 2.5 : p.fade;
    if (cue && cue.id === id && cue.positional === positional) {
      cue.gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.3);
      cue.posFn = typeof p.pos === 'function' ? p.pos : null;
      cue.pos = Array.isArray(p.pos) ? p.pos : null;
      return;
    }
    stopMusic(f);
    const t = ctx.currentTime;
    const c = { id, positional, out: ctx.createGain(), gain: ctx.createGain(), panner: null, lp: null, wet: null, score: null,
      posFn: typeof p.pos === 'function' ? p.pos : null, pos: Array.isArray(p.pos) ? p.pos : null, radius: p.radius || 6, send: 0.9, inst: null };
    c.out.gain.setValueAtTime(0, t);
    c.out.gain.linearRampToValueAtTime(1, t + Math.max(0.05, f));
    c.gain.gain.value = vol;
    c.gain.connect(c.out);
    const b = bus.music;
    if (positional) {
      c.lp = ctx.createBiquadFilter(); c.lp.type = 'lowpass'; c.lp.Q.value = 0.5;
      c.panner = makePanner(c.radius);
      c.out.connect(c.lp); c.lp.connect(c.panner); c.panner.connect(b.dry);
      c.wet = ctx.createGain(); c.out.connect(c.wet); c.wet.connect(b.wet);
      placeLoop(c, t, false);
    } else {
      c.out.connect(b.dry);
      c.score = ctx.createGain(); c.score.gain.value = SCORE_SEND;
      c.out.connect(c.score); c.score.connect(scoreConv);
    }
    try {
      c.inst = createCue(eng, id, c.gain, params);
    } catch (e) {
      warn('cue ' + id + ': ' + e.message);
      c.inst = { stop() {}, done() { return true; } };
    }
    cue = c;
  }

  function musicParam(name, value) {
    params[name] = value;
    if (ready && cue && cue.inst.param) {
      try { cue.inst.param(name, value, ctx.currentTime); } catch (e) { warn('param: ' + e.message); }
    }
  }

  // ------------------------------------------------------------ scheduler

  function tick() {
    if (!ready) return;
    const now = ctx.currentTime;
    // when ticks come late (a slow frame, a background tab) look further ahead
    const gap = lastTick < 0 ? 0 : now - lastTick;
    const ahead = Math.min(2.5, Math.max(LOOKAHEAD, gap * 1.6));
    lastTick = now;
    const horizon = now + ahead;
    for (let i = 0; i < loops.length; i++) {
      const L = loops[i];
      if (L.started && L.inst.tick) safeTick(L.inst, now, horizon, 'loop:' + L.name);
    }
    if (bed && bed.inst.tick) safeTick(bed.inst, now, horizon, 'bed:' + bed.id);
    if (cue) {
      if (cue.inst.tick) safeTick(cue.inst, now, horizon, 'cue:' + cue.id);
      if (cue.inst.done && cue.inst.done(now)) {
        const id = cue.id;
        stopMusic(0.5);
        wantMusic = null;
        if (game && game.events && game.events.emit) { try { game.events.emit('audio:music-end', id); } catch (e) { /* ignore */ } }
      }
    }
    for (let i = fading.length - 1; i >= 0; i--) {
      const F = fading[i];
      if (now > F.stopAt) { fading[i] = fading[fading.length - 1]; fading.pop(); continue; }
      if (F.inst.tick) safeTick(F.inst, now, Math.min(horizon, F.stopAt));
    }
  }

  function safeTick(inst, now, horizon, label) {
    const t0 = prof ? performance.now() : 0;
    try { inst.tick(now, horizon); } catch (e) { warn('tick: ' + e.message); inst.tick = null; }
    if (prof) { const d = performance.now() - t0; const k = label || 'other'; if (!(prof[k] >= d)) prof[k] = d; }
  }

  function update(dt) {
    if (!ready) return;
    const now = ctx.currentTime;
    if (offline || lastTick < 0 || now - lastTick > 0.02) tick();
    for (let i = 0; i < loops.length; i++) {
      const L = loops[i];
      if (L.started && L.posFn) placeLoop(L, now, true);
    }
    if (cue && cue.posFn) placeLoop(cue, now, true);
    for (let i = 0; i < MAX_VOICES; i++) {
      const v = voices[i];
      if (v.active && now > v.end) { v.active = false; v.src = null; v.gain = null; }
    }
    for (let i = garbage.length - 1; i >= 0; i--) {
      const G = garbage[i];
      if (now > G.t) {
        for (let k = 0; k < G.nodes.length; k++) { const n = G.nodes[k]; if (n) { try { n.disconnect(); } catch (e) { /* ignore */ } } }
        garbage[i] = garbage[garbage.length - 1]; garbage.pop();
      }
    }
    reverb.update(now);
  }

  // ------------------------------------------------------------ unlock

  function unlock() {
    if (!ctx) {
      const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return;
      try { init(new AC({ latencyHint: 'interactive' })); } catch (e) { warn('no audio: ' + e.message); return; }
    }
    if (!offline && ctx.state !== 'running' && ctx.resume) ctx.resume().catch(() => {});
  }

  function activeVoices() {
    let n = 0;
    const now = ctx ? ctx.currentTime : 0;
    for (let i = 0; i < MAX_VOICES; i++) if (voices[i].active && now <= voices[i].end) n++;
    return n;
  }

  return {
    unlock, update, play, loop, ambience, reverb: room, music, musicParam, voice, footstep, ui, setVolumes, duck,
    names: Object.keys(SFX).concat(Object.keys(LOOPS)),
    lists: {
      sfx: Object.keys(SFX), loops: Object.keys(LOOPS), beds: BED_IDS.slice(), reverbs: ROOM_IDS.slice(),
      cues: Object.keys(CUES), ui: Object.keys(UI_SFX), surfaces: SURFACES.slice(), timbres: TIMBRES.slice(),
    },
    get context() { return ctx; },
    get ready() { return ready; },
    debug: {
      activeVoices, loops: () => loops.length, bed: () => (bed ? bed.id : 'none'), cue: () => (cue ? cue.id : null),
      room: () => (reverb ? reverb.id : 'none'), ducking: () => (ctx ? ctx.currentTime < duckUntil : false), tick,
      eng: () => eng, master: () => master, warmed: () => warmed, slowWarm: () => slowWarm.slice(),
      profile: (on) => { if (on) prof = {}; const p = prof; if (on === false) prof = null; return p; },
    },
    dispose() { if (timer) clearInterval(timer); timer = null; },
  };
}

