// Music cues: the composers in score.js write sections of plain events ahead of
// time; tick() turns only the events inside the lookahead window into audio nodes.
//
//   export const CUES = { id: { positional, tempo, mode, form } }
//   export function createCue(eng, id, out, params) -> { tick(now, horizon), param(name, value, t), stop(t), done(now) }
//     out: a GainNode (stereo); params: the live musicParam map. done(now) is true once a cue that ends has finished.

import { createInstruments, musicWarmJobs } from './instruments.js';
import { makeComposer } from './score.js';
import { rng, clamp, smoothstep } from './dsp.js';

export const CUES = {
  title: { positional: false, tempo: 72, mode: 'D Dorian', form: 'drone intro, then weighted sections: flute theme, pluck theme with flute descant, B tune, breathing pads and bells' },
  arrival: { positional: false, tempo: 92, mode: 'D Dorian', form: 'pluck ostinato intro, theme on flute, B tune, theme sung by the choir under a flute counterline, interludes' },
  'court-evening': { positional: true, tempo: 108, mode: 'G major and D Dorian', form: 'a band rotating Ladle Row, the theme in dance dress and the reel in 4/4 (A A B B A), pauses and count-ins between tunes' },
  busker: { positional: true, tempo: 76, mode: 'D Dorian', form: 'one flute: phrases from the theme and B tune, ornamented, rubato, with breaths' },
  choir: { positional: true, tempo: 66, mode: 'D Dorian', form: 'a rehearsal: tuning chord, passages sung, stopped, repeated, then run through' },
  dawn: { positional: false, tempo: 56, mode: 'D Phrygian dark to D Dorian rose to D Lydian gold', form: 'per-bar, driven by progress; the theme stated plainly at 0.66, again in D major in the gold' },
  feast: { positional: false, tempo: 112, mode: 'G major', form: 'tunes twice through with a second flute in consort, the odd breakdown' },
  reel: { positional: true, tempo: 84, mode: 'D Dorian, 6/8', form: 'A A B B strains with variations, interludes of drum and drone' },
  'long-flight': { positional: false, tempo: 60, mode: 'D, chromatic mediants', form: 'choir cycles: mediant progression, the theme in augmentation over a coloured reharmonisation, breathing sections' },
  'card-home': { positional: false, tempo: 66, mode: 'D Dorian, ending on D major', form: 'theme on plucked strings, theme on flute, a final chord and bell; ends' },
};

const INSTS = ['flute', 'pluck', 'pad', 'drum', 'bell', 'choir', 'drone'];
const MIX = {
  base: { flute: 0.26, pluck: 0.6, pad: 0.24, drum: 0.3, bell: 0.32, choir: 0.22, drone: 0.03 },
  title: {},
  arrival: {},
  'court-evening': { flute: 0.3, pluck: 0.55, drum: 0.3 },
  busker: { flute: 0.27 },
  choir: { choir: 0.3, drum: 0.2 },
  dawn: { pad: 0.2, drone: 0.045, choir: 0.32 },
  feast: { drum: 0.28, pluck: 0.5 },
  reel: { flute: 0.3, drum: 0.24, pluck: 0.55 },
  'long-flight': { choir: 0.3, drone: 0.03, drum: 0.3 },
  'card-home': { pluck: 0.6, flute: 0.42, bell: 0.36 },
};
const PAN = { flute: 0.16, pluck: -0.22, pad: 0, drum: 0.08, bell: 0.28, choir: 0, drone: 0 };
const CHOIR = {
  arrival: { parts: 3, voices: 3, vowel: 'ah' },
  dawn: { parts: 3, voices: 3, vowel: 'oo', detune: 8 },
  choir: { parts: 4, voices: 3, vowel: 'ah', detune: 6 },
  'long-flight': { parts: 6, voices: 3, vowel: 'ah', detune: 9 },
};

// Layer levels from params, applied smoothly the moment a param changes.
function layers(id, params) {
  const L = { flute: 1, pluck: 1, pad: 1, drum: 1, bell: 1, choir: 1, drone: 1, padCut: 20000 };
  if (id === 'dawn') {
    const p = clamp(+params.progress || 0, 0, 1);
    L.drone = 1 - 0.55 * p;
    L.pad = 0.85 + 0.15 * p;
    L.pluck = smoothstep(0.3, 0.55, p);
    L.bell = smoothstep(0.26, 0.6, p);
    L.choir = smoothstep(0.45, 0.75, p);
    L.padCut = 380 + 4200 * Math.pow(p, 1.6);
  }
  if (typeof params.intensity === 'number') {
    const i = clamp(params.intensity, 0, 1);
    L.drum *= 0.45 + 0.55 * i;
    L.bell *= 0.7 + 0.3 * i;
    L.pluck *= 0.8 + 0.2 * i;
  }
  // musicParam('solo', 'choir') hears one layer alone (for balancing on the dev page)
  if (typeof params.solo === 'string' && INSTS.indexOf(params.solo) >= 0) for (const k of INSTS) if (k !== params.solo) L[k] = 0;
  return L;
}

// Render plucks, drums and bells in idle moments (realtime contexts only), so a cue's
// first bars never wait for buffers. Safe to call more than once.
const warmedContexts = new WeakSet();
export function warmMusic(eng) {
  if (eng.offline || warmedContexts.has(eng.ctx) || typeof setTimeout === 'undefined') return;
  warmedContexts.add(eng.ctx);
  const jobs = musicWarmJobs(eng);
  let i = 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const run = () => {
    const t0 = now();
    while (i < jobs.length && now() - t0 < 4) { try { jobs[i](); } catch (e) { i = jobs.length; break; } i++; }
    if (i < jobs.length) setTimeout(run, 30);
  };
  setTimeout(run, 50);
}

export function createCue(eng, id, out, params) {
  const ctx = eng.ctx;
  warmMusic(eng);
  const P = params || {};
  const rnd = rng(Math.floor(eng.rnd() * 4294967295) + 1);
  const comp = makeComposer(id, rnd, P);
  const mix = Object.assign({}, MIX.base, MIX[id] || {});

  // submixes: level -> layer (param driven) -> pan -> out
  const subs = {}, layer = {};
  let padLP = null;
  for (const k of INSTS) {
    const g = ctx.createGain(); g.gain.value = mix[k];
    const l = ctx.createGain();
    let head = g;
    if (k === 'pad') {
      padLP = ctx.createBiquadFilter(); padLP.type = 'lowpass'; padLP.Q.value = 0.5; padLP.frequency.value = 20000;
      g.connect(padLP); head = padLP;
    }
    head.connect(l);
    if (ctx.createStereoPanner && PAN[k]) { const p = ctx.createStereoPanner(); p.pan.value = PAN[k]; l.connect(p); p.connect(out); }
    else l.connect(out);
    subs[k] = g; layer[k] = l;
  }
  const ins = createInstruments(eng, subs);
  let choir = null, drone = null;

  function applyLayers(t, tc) {
    const L = layers(id, P);
    for (const k of INSTS) {
      if (tc) layer[k].gain.setTargetAtTime(L[k], t, tc); else layer[k].gain.setValueAtTime(L[k], t);
    }
    if (tc) padLP.frequency.setTargetAtTime(L.padCut, t, tc); else padLP.frequency.setValueAtTime(L.padCut, t);
  }
  applyLayers(ctx.currentTime, 0);

  let cursor = ctx.currentTime + 0.12;
  let queue = [], qi = 0;
  let stopped = false, ended = false, endAt = Infinity;

  function play(e) {
    const hum = e.i !== 'choir' && e.i !== 'pad' && e.i !== 'drone' && e.i !== 'vowel';
    const t = hum ? e.t + (rnd() - 0.5) * 0.01 : e.t;
    const v = e.v * (hum ? 1 + (rnd() - 0.5) * 0.12 : 1);
    switch (e.i) {
      case 'flute': ins.flute(t, e.m, e.d, v, e.x); break;
      case 'pluck': ins.pluck(t, e.m, v, e.x); break;
      case 'strum': ins.strum(t, e.m, v, e.x); break;
      case 'pad': ins.pad(t, e.m, e.d, v, e.x); break;
      case 'drum': ins.drum(t, e.x, v); break;
      case 'bell': ins.bell(t, e.m, v); break;
      case 'choir':
        if (!choir) choir = ins.choir(CHOIR[id] || { parts: 3, voices: 3 });
        choir.note(t, e.x.p, e.m, e.d, v, e.x);
        break;
      case 'vowel':
        if (!choir) choir = ins.choir(CHOIR[id] || { parts: 3, voices: 3 });
        choir.vowel(t, e.x, e.d);
        break;
      case 'drone':
        if (!drone) drone = ins.drone();
        drone.set(t, e.m, v, e.d);
        break;
      default: break;
    }
  }

  return {
    tick(now, horizon) {
      if (stopped) return;
      if (cursor < now) cursor = now + 0.05;      // we were starved: pick up from here
      let guard = 0;
      while (!ended && cursor < horizon + 0.5 && guard++ < 8) {
        const s = comp.next();
        s.ev.sort((a, b) => a.t - b.t);
        for (let k = 0; k < s.ev.length; k++) {
          const e = s.ev[k];
          e.t += cursor;
          // a section may let a phrase run on into the next: keep the queue in time order
          let j = queue.length;
          queue.push(e);
          while (j > qi && queue[j - 1].t > e.t) { queue[j] = queue[j - 1]; j--; }
          queue[j] = e;
        }
        cursor += Math.max(0.25, s.beats * s.spb);
        if (s.end) { ended = true; endAt = cursor + (s.tail || 0); }
      }
      while (qi < queue.length && queue[qi].t < horizon) {
        const e = queue[qi++];
        if (e.t < now) { if (now - e.t > 0.25 && e.i !== 'choir' && e.i !== 'drone' && e.i !== 'vowel') continue; e.t = now + 0.005; }
        try { play(e); } catch (err) { eng.warn('music ' + id + ': ' + err.message); }
      }
      if (qi > 256) { queue = queue.slice(qi); qi = 0; }
    },
    param(name, value, t) {
      P[name] = value;
      applyLayers(t === undefined ? ctx.currentTime : t, 0.5);
    },
    stop(t) {
      stopped = true;
      const at = t === undefined ? ctx.currentTime : t;
      if (choir) choir.stop(at);
      if (drone) drone.stop(at);
    },
    done(now) { return ended && now > endAt; },
    get id() { return id; },
  };
}
