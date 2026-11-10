// Music instruments, all synthesised with built-in Web Audio nodes and cached
// JS-rendered buffers. Tuned for heliox: bright, clean attacks, glassy winds.
//
// createInstruments(eng, outs) -> { flute, pluck, strum, pad, drum, bell, choir(cfg), drone() }
// outs: { flute, pluck, pad, drum, bell, choir, drone } AudioNodes (a cue's submixes).

import { ks, mtof, clamp, samples, white, Biquad, normalize, fade, dcBlock, TAU } from './dsp.js';

// ---------------------------------------------------------------- buffer rendering

// A decaying sinusoid by complex rotation: cheap, no per-sample transcendental calls.
function ring(buf, sr, t0, f, amp, decay) {
  if (f >= sr * 0.45) return;
  const s = Math.floor(t0 * sr);
  const w = TAU * f / sr, r = Math.exp(-1 / (decay * sr));
  const c = Math.cos(w) * r, sn = Math.sin(w) * r;
  let x = amp, y = 0;
  const end = Math.min(buf.length, s + Math.floor(decay * sr * 7));
  for (let i = s; i < end; i++) { buf[i] += y; const nx = x * c - y * sn; y = x * sn + y * c; x = nx; }
}

// A sine thump gliding from f0 to f1.
function thump(buf, sr, t0, f0, f1, glide, amp, decay) {
  const s = Math.floor(t0 * sr), kg = Math.exp(-1 / (glide * sr)), kd = Math.exp(-1 / (decay * sr));
  let g = 1, a = amp, ph = 0;
  const end = Math.min(buf.length, s + Math.floor(decay * sr * 7));
  for (let i = s; i < end; i++) { ph += TAU * (f1 + (f0 - f1) * g) / sr; buf[i] += Math.sin(ph) * a; g *= kg; a *= kd; }
}

function hit(buf, sr, t0, amp, rnd, type, f, q, decay) {
  const s = Math.floor(t0 * sr);
  const n = Math.min(buf.length - s, Math.floor(decay * sr * 7));
  if (n <= 0) return;
  const nb = white(n, rnd);
  new Biquad(type, f, q, sr).run(nb);
  const k = Math.exp(-1 / (decay * sr));
  let g = amp * (type === 'bandpass' ? 1 + Math.sqrt(q) : 1);
  const att = Math.floor(sr * 0.0007);
  for (let i = 0; i < n; i++) { buf[s + i] += nb[i] * g * (i < att ? i / att : 1); g *= k; }
}

function finish(b, sr) { dcBlock(b); fade(b, sr, 0.0005, 0.01); return normalize(b, 1); }

const DRUMS = {
  // hand drum, open low stroke
  dum: (sr, r, j) => { const b = new Float32Array(samples(sr, 0.7)); thump(b, sr, 0, 140 * j, 84 * j, 0.03, 1, 0.2); ring(b, sr, 0, 201 * j, 0.22, 0.12); ring(b, sr, 0, 309 * j, 0.1, 0.07); hit(b, sr, 0, 0.3, r, 'lowpass', 1500, 0.7, 0.01); return finish(b, sr); },
  // rim slap
  tek: (sr, r, j) => { const b = new Float32Array(samples(sr, 0.35)); hit(b, sr, 0, 0.9, r, 'bandpass', 3100 * j, 1.1, 0.026); ring(b, sr, 0, 650 * j, 0.4, 0.06); ring(b, sr, 0, 990 * j, 0.25, 0.045); ring(b, sr, 0, 1470 * j, 0.15, 0.03); thump(b, sr, 0, 420, 320, 0.02, 0.25, 0.03); return finish(b, sr); },
  // muted ghost
  ka: (sr, r, j) => { const b = new Float32Array(samples(sr, 0.2)); hit(b, sr, 0, 1, r, 'bandpass', 1900 * j, 1.4, 0.015); ring(b, sr, 0, 520 * j, 0.25, 0.025); return finish(b, sr); },
  // frame drum, centre stroke: deep and long, the reel's hang
  boom: (sr, r, j) => { const b = new Float32Array(samples(sr, 1.6)); thump(b, sr, 0, 84 * j, 57 * j, 0.06, 1, 0.55); ring(b, sr, 0, 122 * j, 0.2, 0.38); ring(b, sr, 0, 178 * j, 0.1, 0.26); ring(b, sr, 0, 243 * j, 0.05, 0.18); hit(b, sr, 0, 0.3, r, 'lowpass', 650, 0.6, 0.025); return finish(b, sr); },
  // frame drum, edge tap
  frame: (sr, r, j) => { const b = new Float32Array(samples(sr, 0.6)); ring(b, sr, 0, 336 * j, 0.55, 0.15); ring(b, sr, 0, 517 * j, 0.4, 0.11); ring(b, sr, 0, 748 * j, 0.25, 0.08); ring(b, sr, 0, 1063 * j, 0.15, 0.05); hit(b, sr, 0, 0.45, r, 'bandpass', 2400, 1, 0.018); thump(b, sr, 0, 185, 150, 0.03, 0.25, 0.08); return finish(b, sr); },
};
const DRUM_GAIN = { dum: 0.85, tek: 0.5, ka: 0.28, boom: 1, frame: 0.5 };

function renderBell(sr, rnd, m) {
  const f = mtof(m);
  const ds = Math.sqrt(clamp(880 / f, 0.5, 1.8));
  const b = new Float32Array(samples(sr, 3.2 * ds + 0.3));
  const P = [[1, 1, 2.6], [2, 0.42, 1.6], [3, 0.24, 1.0], [4.2, 0.12, 0.6], [5.4, 0.06, 0.4]];
  for (const [ratio, a, d] of P) {
    ring(b, sr, 0, f * ratio, a, d * ds);
    ring(b, sr, 0, f * ratio * 1.0011 + 0.35, a * 0.5, d * ds * 0.9);   // the doublet that shimmers
  }
  hit(b, sr, 0, 0.06, rnd, 'bandpass', Math.min(f * 4, 12000), 2, 0.004);
  return finish(b, sr);
}

function plucDur(m) { return clamp(2.6 - (m - 40) * 0.032, 1.1, 2.6); }
const KS_SR = 32000;   // plucks carry little above 12 kHz; a lower rate keeps the cache small

// Cached buffers, shared by the instruments and the warm-up.
function ksBuf(eng, m, dark) {
  return eng.buffer('ks:' + m + (dark ? 'd' : ''), dark ? 1 : 2,
    (sr, r) => ({ sr: KS_SR, data: ks(KS_SR, mtof(m), plucDur(m), { bright: dark ? 0.25 : 0.55, pick: 0.13 + 0.1 * r() }, r) }));
}
function drumBuf(eng, k) { return eng.buffer('drum:' + k, 4, (sr, r) => DRUMS[k](sr, r, 1 + (r() - 0.5) * 0.05)); }
function bellBuf(eng, m) { return eng.buffer('bell:' + m, 1, (sr, r) => renderBell(sr, r, m)); }

// Jobs that render the buffers the music uses most, for idle moments.
export function musicWarmJobs(eng) {
  const jobs = [];
  for (const k in DRUMS) for (let v = 0; v < 6; v++) jobs.push(() => drumBuf(eng, k));
  // the cues live in D Dorian and G major: warm those pitch classes (others render on first use)
  const PCS = [0, 2, 4, 5, 6, 7, 9, 11];
  for (let m = 38; m <= 86; m++) {
    if (PCS.indexOf(m % 12) < 0) continue;
    for (let v = 0; v < 3; v++) jobs.push(() => ksBuf(eng, m, false));
    if (m <= 64) jobs.push(() => ksBuf(eng, m, true));
  }
  for (let m = 74; m <= 96; m++) jobs.push(() => bellBuf(eng, m));   // every bell the cues can choose
  return jobs;
}

// ---------------------------------------------------------------- choir formants

// Heliox lifts the throat's resonances: F1 by ~1.45, upper formants by ~1.7. [Hz, Q, gain]
const VOWELS = {
  ah: [[1100, 6, 1], [1900, 8, 0.55], [4500, 10, 0.22], [6000, 10, 0.1]],
  oo: [[520, 5, 1], [1300, 7, 0.3], [4000, 10, 0.07], [5600, 10, 0.04]],
  ee: [[450, 5, 0.9], [3700, 9, 0.45], [5000, 10, 0.3], [6200, 10, 0.12]],
};

// ---------------------------------------------------------------- instruments

export function createInstruments(eng, outs) {
  const ctx = eng.ctx;
  const rnd = eng.rnd;

  function stopAll(nodes, t) { for (const n of nodes) { try { n.stop(t); } catch (e) { /* not started */ } } }

  // Heliox flute: a long pipe at an ordinary pitch, so a glassy tone with breath in it.
  // o: { att, rel, breath, vib }
  function flute(t, m, d, v, o) {
    const x = o || {};
    const f = mtof(m);
    const att = Math.min(x.att || (0.06 + 0.05 * rnd()), d * 0.5);
    const rel = x.rel || 0.16;
    const osc = ctx.createOscillator();
    osc.setPeriodicWave(eng.wave('flute'));
    osc.frequency.setValueAtTime(f * 0.993, t);
    osc.frequency.setTargetAtTime(f, t, 0.025);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(v * 0.5, t + att);
    if (d > 1) env.gain.setTargetAtTime(v * 0.54, t + att, d * 0.3);
    env.gain.setTargetAtTime(0, t + d, rel / 3);
    const end = t + d + rel * 3 + 0.05;
    const nodes = [osc];
    osc.connect(env);
    // breath: noise tuned to the note, plus a little high air that carries the chiff
    const ns = ctx.createBufferSource();
    ns.buffer = eng.noise(); ns.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 9;
    const bg = ctx.createGain(); bg.gain.value = (x.breath || 1) * 2.6;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4200;
    const air = ctx.createGain();
    air.gain.setValueAtTime(0, t);
    air.gain.linearRampToValueAtTime(0.16, t + 0.012);
    air.gain.setTargetAtTime(0.028 * (x.breath || 1), t + 0.02, 0.04);
    ns.connect(bp); bp.connect(bg); bg.connect(env);
    ns.connect(hp); hp.connect(air); air.connect(env);
    nodes.push(ns);
    // slow vibrato that arrives once the note has settled
    if (d > 0.45 && x.vib !== 0) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 4.7 + rnd() * 0.7;
      const lg = ctx.createGain();
      lg.gain.setValueAtTime(0, t);
      lg.gain.setValueAtTime(0, t + 0.22);
      lg.gain.linearRampToValueAtTime(f * 0.0045 * (x.vib || 1), t + Math.min(d, 0.8));
      lfo.connect(lg); lg.connect(osc.frequency);
      nodes.push(lfo);
      lfo.start(t);
    }
    env.connect(outs.flute);
    osc.start(t);
    ns.start(t, rnd() * 2.5);
    stopAll(nodes, end);
  }

  // Plucked string. o: { mute (s, damp after this), dark }
  function pluck(t, m, v, o) {
    const x = o || {};
    const buf = ksBuf(eng, m, !!x.dark);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = v;
    src.connect(g); g.connect(outs.pluck);
    src.start(t);
    if (x.mute) { g.gain.setTargetAtTime(0, t + x.mute, 0.06); src.stop(t + x.mute + 0.5); }
  }

  // A strum: low to high (or high to low when o.up), a few ms apart.
  function strum(t, notes, v, o) {
    const x = o || {};
    const sp = x.spread || 0.016;
    const n = notes.length;
    for (let i = 0; i < n; i++) {
      const k = x.up ? n - 1 - i : i;
      pluck(t + i * sp * (0.8 + 0.4 * rnd()), notes[k], v * (x.up ? 0.75 : 1) * (0.85 + 0.15 * (k / Math.max(1, n - 1))), x);
    }
  }

  // Bowed pad: detuned pairs into a lowpass that opens with the bow. o: { att, rel, cut }
  function pad(t, notes, d, v, o) {
    const x = o || {};
    const att = x.att || 1.2, rel = x.rel || 1.8, cut = x.cut || 1800;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(cut * 0.4, t);
    lp.frequency.linearRampToValueAtTime(cut, t + att * 1.3);
    lp.frequency.setTargetAtTime(cut * 0.75, t + att * 1.3, Math.max(0.5, d * 0.4));
    const env = ctx.createGain();
    const level = v * 0.32 / Math.sqrt(notes.length);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(level, t + att);
    env.gain.setTargetAtTime(0, t + Math.max(att, d), rel / 3);
    const end = t + Math.max(att, d) + rel * 3;
    const wave = eng.wave('warm');
    for (const m of notes) {
      const f = mtof(m);
      for (let k = 0; k < 2; k++) {
        const o2 = ctx.createOscillator();
        o2.setPeriodicWave(wave);
        o2.frequency.value = f;
        o2.detune.value = (k ? 1 : -1) * (4 + rnd() * 4);
        o2.connect(lp);
        o2.start(t); o2.stop(end);
      }
    }
    lp.connect(env); env.connect(outs.pad);
  }

  function drum(t, kind, v) {
    const k = DRUMS[kind] ? kind : 'frame';
    const buf = drumBuf(eng, k);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 1 + (rnd() - 0.5) * 0.03;
    const g = ctx.createGain();
    g.gain.value = v * DRUM_GAIN[k];
    src.connect(g); g.connect(outs.drum);
    src.start(t);
  }

  function bell(t, m, v) {
    const buf = bellBuf(eng, m);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = v;
    src.connect(g); g.connect(outs.bell);
    src.start(t);
  }

  // Choir: persistent voices. cfg: { parts, voices, vowel, detune }
  function choir(cfg) {
    const c = cfg || {};
    const P = c.parts || 4, V = c.voices || 3;
    const t0 = ctx.currentTime;
    const vin = ctx.createGain();
    const outG = ctx.createGain(); outG.gain.value = 0.55;
    outG.connect(outs.choir);
    const banks = {};
    for (const name in VOWELS) {
      const bg = ctx.createGain();
      bg.gain.value = name === (c.vowel || 'ah') ? 1 : 0;
      for (const [f, q, a] of VOWELS[name]) {
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
        const fg = ctx.createGain(); fg.gain.value = a;
        vin.connect(bp); bp.connect(fg); fg.connect(bg);
      }
      bg.connect(outG);
      banks[name] = bg;
    }
    // the fundamental, which high voices keep whatever the vowel
    const body = ctx.createBiquadFilter(); body.type = 'lowpass'; body.frequency.value = 1500; body.Q.value = 0.5;
    const bodyG = ctx.createGain(); bodyG.gain.value = 0.22;
    vin.connect(body); body.connect(bodyG); bodyG.connect(outG);

    const sources = [];
    const parts = [];
    const wave = eng.wave('glottal');
    for (let p = 0; p < P; p++) {
      const pg = ctx.createGain(); pg.gain.value = 0;
      pg.connect(vin);
      const ns = ctx.createBufferSource(); ns.buffer = eng.noise(); ns.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2200;
      const ng = ctx.createGain(); ng.gain.value = 0.05;
      ns.connect(hp); hp.connect(ng); ng.connect(pg);
      ns.start(t0, rnd() * 2.5);
      sources.push(ns);
      const oscs = [];
      for (let v = 0; v < V; v++) {
        const o = ctx.createOscillator();
        o.setPeriodicWave(wave);
        o.frequency.value = 220;
        o.detune.value = (v - (V - 1) / 2) * (c.detune || 7) + (rnd() - 0.5) * 5;
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 4.4 + rnd() * 1.3;
        const lg = ctx.createGain(); lg.gain.value = 11 + rnd() * 9;     // vibrato depth in cents
        lfo.connect(lg); lg.connect(o.detune);
        o.connect(pg);
        const st = t0 + rnd() * 0.2;
        o.start(st); lfo.start(st);
        sources.push(o, lfo);
        oscs.push(o);
      }
      parts.push({ g: pg, oscs, releasedAt: -1, scale: 1 / Math.sqrt(V) });
    }
    return {
      // x: { tie (the next note follows legato), att, rel, glide }
      note(t, p, m, d, v, x) {
        const P2 = parts[p % parts.length];
        const o = x || {};
        const f = mtof(m);
        const fresh = t >= P2.releasedAt;
        for (const osc of P2.oscs) {
          if (fresh) { osc.frequency.cancelScheduledValues(t); osc.frequency.setValueAtTime(f, t); }
          else osc.frequency.setTargetAtTime(f, t, (o.glide || 0.12) / 3);
        }
        const g = P2.g.gain;
        g.cancelScheduledValues(t);
        g.setTargetAtTime(v * P2.scale, t, (fresh ? o.att || 0.35 : 0.12) / 3);
        if (o.tie) P2.releasedAt = Infinity;
        else {
          const rel = o.rel || 0.7;
          g.setTargetAtTime(0, t + d, rel / 3);
          P2.releasedAt = t + d + rel * 1.2;
        }
      },
      vowel(t, name, time) {
        for (const k in banks) banks[k].gain.setTargetAtTime(k === name ? 1 : 0, t, Math.max(0.05, time / 3));
      },
      stop(t) { stopAll(sources, t + 0.05); },
    };
  }

  // Low drone: root, fifth and octave in just intonation, through a slowly drifting lowpass.
  function drone() {
    const t0 = ctx.currentTime;
    const env = ctx.createGain(); env.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.7;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.043;
    const lg = ctx.createGain(); lg.gain.value = 160;
    lfo.connect(lg); lg.connect(lp.frequency);
    lp.connect(env); env.connect(outs.drone);
    const ratios = [1, 1.5, 2], levels = [1, 0.5, 0.22];
    const oscs = [];
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      o.setPeriodicWave(eng.wave('soft'));
      o.frequency.value = 73.4 * ratios[i];
      o.detune.value = i === 2 ? 3 : 0;
      const g = ctx.createGain(); g.gain.value = levels[i];
      o.connect(g); g.connect(lp);
      o.start(t0);
      oscs.push(o);
    }
    lfo.start(t0);
    let started = false;
    return {
      set(t, root, v, glide) {
        const f = mtof(root);
        for (let i = 0; i < 3; i++) {
          if (!started) oscs[i].frequency.setValueAtTime(f * ratios[i], t);
          else oscs[i].frequency.setTargetAtTime(f * ratios[i], t, Math.max(0.05, (glide || 2) / 3));
        }
        started = true;
        env.gain.setTargetAtTime(v, t, 1.2);
      },
      stop(t) { stopAll(oscs.concat([lfo]), t + 0.05); },
    };
  }

  return { flute, pluck, strum, pad, drum, bell, choir, drone };
}
