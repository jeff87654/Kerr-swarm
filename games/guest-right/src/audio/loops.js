// Loops: continuous sound sources built from long seamless buffers, slow random drifts
// and scheduled events, so nothing audibly repeats. Also the shared toolkit beds use.

import { rng, rrange, clamp, samples, white, pink, brown, Biquad, lowpass, highpass, bandpass, onePole, dcBlock, normalize, scale, fade, loopify, addSine, TAU } from './dsp.js';
import { renderTalker } from './voice.js';
import { renderStep, SFX } from './sfx.js';
import { createCue } from './music.js';

const LOW_SR = 24000;

// ------------------------------------------------------------ instance toolkit

// One running sound: owns its sources, drifting parameters, event streams and sub-instances.
export class Inst {
  constructor(eng, out) {
    this.eng = eng; this.ctx = eng.ctx; this.out = out;
    this.srcs = []; this.drifts = []; this.evs = []; this.subs = [];
    this.stopT = Infinity; this.onSet = null;
  }
  gain(v, dest) {
    const g = this.ctx.createGain(); g.gain.value = v;
    if (dest) g.connect(dest);
    return g;
  }
  pan(p, dest) {
    const s = this.ctx.createStereoPanner(); s.pan.value = clamp(p, -1, 1);
    if (dest) s.connect(dest);
    return s;
  }
  filter(type, f, q, dest) {
    const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7;
    if (dest) b.connect(dest);
    return b;
  }
  // a looping buffer, started at a random point
  loopBuf(buf, dest, rate) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf; s.loop = true; s.playbackRate.value = rate || 1;
    s.connect(dest || this.out);
    s.start(this.ctx.currentTime, this.eng.rnd() * buf.duration);
    this.srcs.push(s);
    return s;
  }
  osc(wave, freq, dest) {
    const o = this.ctx.createOscillator();
    if (wave === 'sine') o.type = 'sine'; else o.setPeriodicWave(this.eng.wave(wave));
    o.frequency.value = freq;
    o.connect(dest || this.out);
    o.start(this.ctx.currentTime);
    this.srcs.push(o);
    return o;
  }
  // param wanders between lo and hi, re-aimed every a..b seconds with time constant tc
  drift(param, lo, hi, a, b, tc) {
    this.drifts.push({ param, lo, hi, a, b, tc: tc || (a + b) / 4, next: this.ctx.currentTime });
  }
  // random events at `rate` per second (Poisson); fire(t) schedules them
  every(rate, fire, delay) {
    const e = { rate, fire, next: this.ctx.currentTime + (delay === undefined ? this.wait(rate) * this.eng.rnd() : delay) };
    this.evs.push(e);
    return e;
  }
  wait(rate) { return -Math.log(1 - this.eng.rnd() * 0.999) / Math.max(1e-4, rate); }
  sub(inst) { this.subs.push(inst); return inst; }
  // a one-shot buffer at time t. o: { gain, pan, rate, lp, dest }
  shot(buf, t, o) {
    if (!buf || t >= this.stopT) return;
    const ctx = this.ctx;
    const s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = o.rate || 1;
    const g = ctx.createGain(); g.gain.value = o.gain;
    let head = s;
    if (o.lp && o.lp < 18000) { const f = this.filter('lowpass', o.lp, 0.5); s.connect(f); head = f; }
    head.connect(g);
    if (o.pan !== undefined) { const p = this.pan(o.pan, o.dest || this.out); g.connect(p); } else g.connect(o.dest || this.out);
    s.start(t);
  }
  // a one-shot from the effects set, at its own designed level times o.gain
  sfx(name, t, o) {
    const d = SFX[name];
    if (!d) return;
    o.gain = (o.gain === undefined ? 1 : o.gain) * d.gain;
    this.shot(this.eng.sfx(name), t, o);
  }
  set(o, t) { if (this.onSet) this.onSet(o, t); }
  tick(now, horizon) {
    const rnd = this.eng.rnd;
    for (let i = 0; i < this.drifts.length; i++) {
      const d = this.drifts[i];
      while (d.next < horizon) {
        d.param.setTargetAtTime(d.lo + (d.hi - d.lo) * rnd(), Math.max(d.next, now), d.tc);
        d.next += d.a + (d.b - d.a) * rnd();
      }
    }
    for (let i = 0; i < this.evs.length; i++) {
      const e = this.evs[i];
      while (e.next < horizon) {
        if (e.next >= now - 0.05 && e.next < this.stopT && e.rate > 0) e.fire(Math.max(e.next, now));
        e.next += e.reg ? (1 + (rnd() - 0.5) * e.reg) / e.rate : this.wait(e.rate);
      }
    }
    for (let i = 0; i < this.subs.length; i++) { const s = this.subs[i]; if (s && s.tick) s.tick(now, horizon); }
  }
  stop(t) {
    this.stopT = t;
    for (const s of this.srcs) { try { s.stop(t); } catch (e) { /* already stopped */ } }
    for (const s of this.subs) { try { if (s && s.stop) s.stop(t); } catch (e) { /* ignore */ } }
  }
}

// level and air absorption for a scattered event at distance d (m)
export function distGain(d) { return Math.min(1, 4 / Math.max(1, d)); }
export function distLp(d) { return d > 12 ? clamp(20000 / (1 + d / 18), 500, 20000) : 0; }

// ------------------------------------------------------------ cached renders

const TALK = new Map();
function talkerData(kind, i) {
  const k = kind + i;
  let d = TALK.get(k);
  if (!d) { d = renderTalker(LOW_SR, rng(1009 + i * 7919 + kind.length * 31), kind).data; TALK.set(k, d); }
  return d;
}
export function talker(eng, kind, i) {
  return eng.buffer('walla:' + kind + i, 1, () => ({ sr: LOW_SR, data: talkerData(kind, i) }));
}
const CROWD = [['man', 0], ['woman', 0], ['man', 1], ['woman', 1], ['elder', 0], ['child', 0]];

// A dense crowd: every talker several times over, at different offsets and speeds, wide stereo.
function denseRender(rnd) {
  const sr = LOW_SR, n = sr * 14;
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let k = 0; k < 16; k++) {
    const [kind, i] = CROWD[k % CROWD.length];
    const src = talkerData(kind, i);
    const rate = 0.93 + rnd() * 0.14;
    const off = Math.floor(rnd() * src.length);
    const pan = rnd();
    const gl = Math.sqrt(1 - pan), gr = Math.sqrt(pan);
    const far = 0.5 + rnd() * 0.5;
    let p = off;
    const m1 = src.length - 1;
    const kl = gl * far, kr = gr * far;
    for (let j = 0; j < n; j++) {
      if (p >= m1) p -= m1;
      const q = p | 0, f = p - q;
      const a = src[q];
      const v = a + (src[q + 1] - a) * f;
      L[j] += v * kl; R[j] += v * kr;
      p += rate;
    }
  }
  for (const ch of [L, R]) { lowpass(ch, sr, 4800, 0.6); highpass(ch, sr, 160, 0.6); }
  const out = [loopify(L, sr, 0.8), loopify(R, sr, 0.8)];
  normalize(out, 0.7);
  // a crowd is many small voices: soften the rare peaks where several coincide
  for (const ch of out) {
    for (let i = 0; i < ch.length; i++) {
      const v = ch[i], a = v < 0 ? -v : v;
      if (a > 0.2) ch[i] = (v < 0 ? -1 : 1) * (0.2 + 0.2 * Math.tanh((a - 0.2) / 0.2));
    }
  }
  return { sr, data: out };
}
export function dense(eng) { return eng.buffer('walla:dense', 1, (sr, r) => denseRender(r)); }

// noise beds: seconds, colour, shaping at LOW_SR for dark sounds or full rate for bright ones
function bed(key, eng, seconds, kind, shape, full) {
  return eng.buffer('bed:' + key, 1, (sr, r) => {
    const s = full ? sr : LOW_SR;
    const n = samples(s, seconds + 0.6);
    let b = kind === 'brown' ? brown(n, r) : kind === 'pink' ? pink(n, r) : white(n, r);
    shape(b, s, r);
    b = loopify(dcBlock(b), s, 0.6);
    normalize(b, 0.9);
    return { sr: s, data: b };
  });
}

// boiling pots: bubble chirps over a low roll
function simmerRender(sr, r) {
  const s = LOW_SR, n = samples(s, 9.7);
  const b = brown(n, r);
  lowpass(b, s, 260); scale(b, 0.35);
  let t = 0;
  while (t < 9.5) {
    const f = rrange(r, 260, 900), d = rrange(r, 0.008, 0.025);
    addSine(b, s, t, f, rrange(r, 0.15, 0.5), d, { f1: f * rrange(r, 1.5, 2.4), glide: d * 0.8, attack: 0.002 });
    t += -Math.log(1 - r() * 0.99) / 28;
  }
  return { sr: s, data: normalize(loopify(dcBlock(b), s, 0.3), 0.9) };
}

function crackleRender(sr, r) {
  const n = samples(sr, 7.3);
  const b = white(n, r);
  bandpass(b, sr, 5200, 0.6); scale(b, 0.15);
  // pops
  const pops = new Float32Array(n);
  for (let i = 0; i < 2600; i++) {
    const k = Math.floor(r() * (n - 200)), a = Math.pow(r(), 3) * (r() < 0.5 ? -1 : 1);
    for (let j = 0; j < 40; j++) pops[k + j] += a * Math.exp(-j / 5) * (j % 2 ? -1 : 1);
  }
  highpass(pops, sr, 2500);
  for (let i = 0; i < n; i++) b[i] += pops[i];
  return normalize(loopify(dcBlock(b), sr, 0.3), 0.9);
}

function dropletsRender(sr, r, rate, lo, hi, secs) {
  const n = samples(sr, secs);
  const b = white(n, r);
  bandpass(b, sr, 2600, 0.5);
  // gentle flutter of the water body
  let g = 0.6, tg = 0.6;
  for (let i = 0; i < n; i++) { if (i % 800 === 0) tg = 0.4 + r() * 0.6; g += (tg - g) * 0.002; b[i] *= g * 0.5; }
  let t = 0;
  while (t < secs - 0.2) {
    const f = rrange(r, lo, hi), d = rrange(r, 0.01, 0.04);
    addSine(b, sr, t, f, rrange(r, 0.05, 0.3), d, { f1: f * 1.3, glide: 0.02, attack: 0.001 });
    t += -Math.log(1 - r() * 0.99) / rate;
  }
  return normalize(loopify(dcBlock(b), sr, 0.3), 0.9);
}

// one wave folding over on stone: a swell of filtered noise with a few bubbles
function lapRender(sr, r) {
  const s = LOW_SR, n = samples(s, 1.6);
  const b = pink(n, r);
  const f0 = rrange(r, 350, 700);
  const bq = new Biquad('bandpass', f0, 0.8, s);
  for (let i = 0; i < n; i += 32) { const t = i / s; bq.set('bandpass', f0 * (1 + 1.4 * Math.min(1, t / 0.35)), 0.8); bq.run(b, i, Math.min(n, i + 32)); }
  const up = rrange(r, 0.15, 0.3);
  for (let i = 0; i < n; i++) { const t = i / s; b[i] *= t < up ? Math.pow(t / up, 2) : Math.exp(-(t - up) / 0.35); }
  for (let k = 0; k < 6; k++) { const t = up + r() * 0.6, f = rrange(r, 600, 1500); addSine(b, s, t, f, 0.12, 0.02, { f1: f * 1.6, glide: 0.015 }); }
  return { sr: s, data: normalize(fade(dcBlock(b), s, 0.005, 0.05), 1) };
}

// a taut kite line singing in moving air
function kiteRender(sr, r) {
  const s = LOW_SR, n = samples(s, 7);
  const b = new Float32Array(n);
  const f = rrange(r, 480, 820);
  let ph = 0, ph2 = 0;
  const v1 = rrange(r, 0.2, 0.5);
  for (let i = 0; i < n; i++) {
    const t = i / s;
    const fr = f * (1 + 0.012 * Math.sin(TAU * v1 * t) + 0.004 * Math.sin(TAU * 3.1 * t));
    ph += TAU * fr / s; ph2 += TAU * fr * 2 / s;
    const env = Math.sin(Math.PI * t / 7) * (0.6 + 0.4 * Math.sin(TAU * 0.37 * t + 1));
    b[i] = (Math.sin(ph) + 0.25 * Math.sin(ph2)) * env * env;
  }
  return { sr: s, data: normalize(b, 1) };
}

// breathing near the ear: in, then out
function breathRender(sr, r, out) {
  const s = LOW_SR, d = out ? 1.7 : 1.3, n = samples(s, d);
  const b = pink(n, r);
  bandpass(b, s, out ? 900 : 1500, 0.7);
  for (let i = 0; i < n; i++) { const t = i / d / s; b[i] *= out ? Math.pow(Math.sin(Math.PI * Math.pow(t, 0.6)), 2) : Math.pow(Math.sin(Math.PI * Math.pow(t, 1.4)), 2); }
  return { sr: s, data: normalize(b, 1) };
}

// a gimbal or panel creak: stick-slip pulses through a resonance
function creakRender(sr, r) {
  const s = LOW_SR, d = rrange(r, 0.3, 0.6), n = samples(s, d);
  const b = new Float32Array(n);
  let t = 0, rate = rrange(r, 25, 60);
  while (t < d - 0.02) { const i = Math.floor(t * s); b[i] += rrange(r, 0.5, 1); t += 1 / rate; rate *= rrange(r, 0.98, 1.04); }
  const f = rrange(r, 500, 1100);
  const x = new Float32Array(n); x.set(b);
  bandpass(x, s, f, 9); bandpass(b, s, f * 2.3, 7);
  for (let i = 0; i < n; i++) x[i] += b[i] * 0.5;
  return { sr: s, data: normalize(fade(x, s, 0.02, 0.06), 1) };
}

function dripRender(sr, r) {
  const n = samples(sr, 0.12), b = new Float32Array(n);
  const f = rrange(r, 1200, 2600);
  addSine(b, sr, 0.002, f, 1, 0.018, { f1: f * 1.8, glide: 0.012, attack: 0.001 });
  return normalize(b, 1);
}

// one step of someone else, from the engine's footstep set (shared cache keys)
export function stepBuf(eng, surface) {
  const bucket = 2;
  return eng.buffer('step:' + surface + ':' + bucket, 4, (sr, r) => renderStep(sr, r, surface, 0.65, false));
}

export function simmerBuf(eng) { return eng.buffer('bed:simmer', 1, simmerRender); }
export function lapBuf(eng) { return eng.buffer('bed:lap', 5, lapRender); }
export function kiteBuf(eng) { return eng.buffer('bed:kite', 3, kiteRender); }
export function breathBuf(eng, out) { return eng.buffer('bed:breath' + (out ? 'out' : 'in'), 3, (sr, r) => breathRender(sr, r, out)); }
export function creakBuf(eng) { return eng.buffer('bed:creak', 5, creakRender); }
export function dripBuf(eng) { return eng.buffer('bed:drip', 5, dripRender); }

// ------------------------------------------------------------ loop creators

export function crowdSize(param) { return 2 * Math.pow(200, clamp(param, 0, 1)); }

export function murmur(eng, out, opts) {
  const I = new Inst(eng, out);
  const ctx = I.ctx, rnd = eng.rnd;
  const near = [];
  for (let k = 0; k < CROWD.length; k++) {
    const g = I.gain(0, I.pan((rnd() - 0.5) * 1.4, out));
    I.loopBuf(talker(eng, CROWD[k][0], CROWD[k][1]), g, 0.92 + rnd() * 0.16);
    near.push(g);
  }
  const dg = I.gain(0, out);
  const dd = I.gain(1, dg);
  I.loopBuf(dense(eng), dd, 0.97 + rnd() * 0.06);
  I.drift(dd.gain, 0.8, 1.15, 2, 6, 1.5);
  let n = 2;
  const apply = (param, t, tc) => {
    n = crowdSize(param);
    const fadeNear = clamp(1 - (n - 6) / 80, 0.3, 1);
    for (let k = 0; k < near.length; k++) {
      const w = clamp(n - k, 0, 1) * fadeNear * (k < 2 ? 1 : 0.85);
      near[k].gain.setTargetAtTime(0.32 * w, t, tc);
    }
    dg.gain.setTargetAtTime(0.26 * Math.max(0, Math.pow(n, 0.24) - 1.15), t, tc);
  };
  apply(opts.param === undefined ? 0.5 : opts.param, ctx.currentTime, 0.05);
  I.onSet = (o, t) => { if (typeof o.param === 'number') apply(o.param, t, 0.6); };
  // the odd laugh somewhere in a crowd
  I.every(0.05, (t) => { if (n > 8) I.sfx('laugh', t, { gain: 0.5 * Math.min(1, n / 60), pan: (rnd() - 0.5) * 1.6, lp: 3500, rate: 0.9 + rnd() * 0.25 }); });
  return I;
}

export function kids(eng, out, opts) {
  const I = new Inst(eng, out);
  const rnd = eng.rnd;
  const g = [];
  for (let k = 0; k < 3; k++) {
    const gg = I.gain(0, I.pan((rnd() - 0.5) * 1.6, out));
    I.loopBuf(talker(eng, 'kids', k), gg, 0.94 + rnd() * 0.12);
    g.push(gg);
  }
  const lv = I.gain(1, out);
  const apply = (p, t, tc) => { for (let k = 0; k < 3; k++) g[k].gain.setTargetAtTime(0.38 * clamp(p * 3 + 1 - k, 0, 1), t, tc); };
  apply(opts.param === undefined ? 0.5 : opts.param, I.ctx.currentTime, 0.05);
  I.onSet = (o, t) => { if (typeof o.param === 'number') apply(o.param, t, 0.5); };
  I.every(0.12, (t) => I.sfx('laugh', t, { gain: 0.8, pan: (rnd() - 0.5) * 1.6, rate: 1.35 + rnd() * 0.2, dest: lv }));
  return I;
}

export function kitchen(eng, out) {
  const I = new Inst(eng, out);
  const rnd = eng.rnd;
  const pot = I.gain(0.35, out);
  I.loopBuf(simmerBuf(eng), pot, 0.95 + rnd() * 0.1);
  I.drift(pot.gain, 0.25, 0.42, 3, 8, 2);
  const hiss = I.gain(0.04, out);
  I.loopBuf(eng.noise(), I.filter('highpass', 3800, 0.6, I.filter('lowpass', 9000, 0.5, hiss)), 0.97 + rnd() * 0.06);
  I.drift(hiss.gain, 0.015, 0.06, 2, 6, 1.5);
  // knife: a run of chops
  I.every(1 / 9, (t) => {
    const k = 4 + Math.floor(rnd() * 8), dt = 0.17 + rnd() * 0.06, p = (rnd() - 0.5) * 0.8;
    for (let i = 0; i < k; i++) I.sfx('chop', t + i * dt * (0.9 + rnd() * 0.2), { gain: 1.0 * (0.8 + rnd() * 0.3), pan: p, rate: 0.97 + rnd() * 0.06 });
  });
  I.every(1 / 12, (t) => I.sfx('lid-down', t, { gain: 0.5, pan: (rnd() - 0.5), rate: 1 + (rnd() - 0.5) * 0.1 }));
  I.every(1 / 14, (t) => I.sfx('ladle', t, { gain: 0.6, pan: (rnd() - 0.5) }));
  I.every(1 / 16, (t) => I.sfx('plate', t, { gain: 0.5, pan: (rnd() - 0.5) }));
  return I;
}

export function sizzle(eng, out, opts) {
  const I = new Inst(eng, out);
  const g = I.gain(0.5, out);
  const d = I.gain(1, g);
  I.loopBuf(eng.buffer('bed:crackle', 1, crackleRender), d, 0.96 + eng.rnd() * 0.08);
  I.drift(d.gain, 0.75, 1.1, 0.4, 1.5, 0.3);
  const apply = (p, t) => g.gain.setTargetAtTime(0.8 + 1.0 * clamp(p, 0, 1), t, 0.3);
  apply(opts.param === undefined ? 0.5 : opts.param, I.ctx.currentTime);
  I.onSet = (o, t) => { if (typeof o.param === 'number') apply(o.param, t); };
  return I;
}

export function steam(eng, out) {
  const I = new Inst(eng, out);
  const g = I.gain(0.16, out);
  const bp = I.filter('bandpass', 4000, 0.6, g);
  const src = I.loopBuf(eng.noise(), bp, 1);
  I.drift(bp.frequency, 2800, 6000, 1.5, 5, 1.2);
  I.drift(g.gain, 0.09, 0.22, 1, 4, 0.8);
  I.drift(src.playbackRate, 0.96, 1.04, 2, 5, 1);
  return I;
}

export function waterLap(eng, out) {
  const I = new Inst(eng, out);
  const rnd = eng.rnd;
  const wash = I.gain(0.05, out);
  I.loopBuf(bed('wash', eng, 11.3, 'pink', (b, s) => { lowpass(b, s, 700); highpass(b, s, 90); }), wash, 1);
  I.drift(wash.gain, 0.03, 0.07, 3, 8, 2);
  I.every(0.55, (t) => I.shot(lapBuf(eng), t, { gain: 0.16 + rnd() * 0.14, pan: (rnd() - 0.5) * 1.2, rate: 0.85 + rnd() * 0.3 }), 0.1);
  return I;
}

export function fountain(eng, out) {
  const I = new Inst(eng, out);
  const g = I.gain(0.32, out);
  I.loopBuf(eng.buffer('bed:fountain', 1, (sr, r) => ({ sr: LOW_SR, data: dropletsRender(LOW_SR, r, 45, 1400, 4200, 8.3) })), g, 1);
  I.drift(g.gain, 0.26, 0.36, 1, 4, 1);
  return I;
}

export function shower(eng, out) {
  const I = new Inst(eng, out);
  const g = I.gain(0.3, out);
  const src = I.loopBuf(bed('shower', eng, 7.1, 'white', (b, s, r) => {
    bandpass(b, s, 4200, 0.5);
    let a = 0.7, ta = 0.7;
    for (let i = 0; i < b.length; i++) { if (i % 400 === 0) ta = 0.5 + r() * 0.5; a += (ta - a) * 0.01; b[i] *= a; }
  }, true), g, 1);
  I.drift(src.playbackRate, 0.97, 1.03, 2, 5, 1);
  return I;
}

export function cabHum(eng, out, opts) {
  const I = new Inst(eng, out);
  const rnd = eng.rnd;
  const mg = I.gain(0.03, I.filter('lowpass', 1400, 0.5, out));
  const motor = I.osc('soft', 138, mg);
  const wg = I.gain(0.006, out);
  const whine = I.osc('sine', 1850, wg);
  const ag = I.gain(0.05, out);
  I.loopBuf(bed('cabair', eng, 9.1, 'pink', (b, s) => { lowpass(b, s, 900); highpass(b, s, 60); }), ag, 1);
  I.drift(ag.gain, 0.035, 0.06, 2, 5, 1.5);
  I.drift(wg.gain, 0.003, 0.008, 2, 5, 1.5);
  const apply = (p, t) => {
    const k = clamp(p || 1, 0.3, 3);
    motor.frequency.setTargetAtTime(138 * k, t, 0.4);
    whine.frequency.setTargetAtTime(1850 * k, t, 0.4);
  };
  apply(opts.pitch, I.ctx.currentTime);
  I.onSet = (o, t) => { if (typeof o.pitch === 'number') apply(o.pitch, t); };
  return I;
}

export function platform(eng, out) {
  const I = new Inst(eng, out);
  const rnd = eng.rnd;
  const hg = I.gain(0.05, out);
  I.osc('soft', 50, hg);           // one tone and its harmonics: no slow beating
  I.drift(hg.gain, 0.035, 0.055, 3, 9, 3);
  const rg = I.gain(0.18, out);
  I.loopBuf(bed('rumble', eng, 13.1, 'brown', (b, s) => { lowpass(b, s, 220); highpass(b, s, 30); }), rg, 1);
  const ag = I.gain(0.08, out);
  I.loopBuf(bed('ductair', eng, 10.7, 'pink', (b, s) => { bandpass(b, s, 700, 0.5); }), ag, 1);
  I.drift(ag.gain, 0.05, 0.1, 2, 6, 2);
  // a far pump stroke, nearly regular
  const thud = I.gain(1, I.filter('lowpass', 500, 0.5, out));
  const pump = I.every(1 / 2.3, (t) => {
    I.sfx('clunk', t, { gain: 0.4, rate: 0.6, dest: thud });
    I.sfx('clunk', t + 0.32, { gain: 0.22, rate: 0.55, dest: thud });
  }, 0.4);
  pump.reg = 0.12;
  I.every(1 / 14, (t) => I.sfx('clunk', t, { gain: 0.3, pan: (rnd() - 0.5) * 1.6, lp: 1500, rate: 0.8 + rnd() * 0.3 }));
  return I;
}

export function air(eng, out) {
  const I = new Inst(eng, out);
  const g = I.gain(0.07, out);
  const lp = I.filter('lowpass', 260, 0.6, g);
  I.loopBuf(bed('air', eng, 13.7, 'brown', (b, s) => { lowpass(b, s, 600); highpass(b, s, 35); }), lp, 1);
  I.drift(lp.frequency, 180, 380, 4, 10, 3);
  I.drift(g.gain, 0.055, 0.08, 4, 10, 3);
  const dg = I.gain(0.01, out);
  I.loopBuf(bed('duct', eng, 11.9, 'pink', (b, s) => { bandpass(b, s, 480, 0.8); }), dg, 1);
  I.drift(dg.gain, 0.005, 0.012, 3, 9, 3);
  return I;
}

export function wind(eng, out, opts) {
  const I = new Inst(eng, out);
  const rnd = eng.rnd;
  const g = I.gain(0, out);
  const buf = I.gain(1, g);
  const bp = I.filter('bandpass', 400, 0.6, buf);
  const src = I.loopBuf(eng.noise(), bp, 1);
  const hg = I.gain(0, out);
  I.loopBuf(eng.noise(), I.filter('highpass', 3500, 0.5, hg), 1.01);
  let p = 0.5;
  const apply = (v, t, tc) => {
    p = clamp(v, 0, 1);
    g.gain.setTargetAtTime(0.03 + 0.4 * Math.pow(p, 1.5), t, tc);
    bp.frequency.setTargetAtTime(280 + 1600 * p, t, tc);
    hg.gain.setTargetAtTime(0.05 * Math.max(0, p - 0.4), t, tc);
  };
  apply(opts.param === undefined ? 0.5 : opts.param, I.ctx.currentTime, 0.05);
  I.onSet = (o, t) => { if (typeof o.param === 'number') apply(o.param, t, 0.2); };
  I.drift(src.playbackRate, 0.95, 1.05, 1, 3, 0.8);
  // buffeting grows with speed
  I.every(6, (t) => { buf.gain.setTargetAtTime(1 - p * 0.6 * rnd(), t, 0.04 + 0.08 * rnd()); });
  return I;
}

// the block choir rehearsing, from the music module
export function choirLoop(eng, out) {
  let cue = null;
  try { cue = createCue(eng, 'choir', out, {}); } catch (e) { eng.warn('choir loop: ' + e.message); }
  return {
    set() {},
    tick(now, h) { if (cue && cue.tick) cue.tick(now, h); },
    stop(t) { if (cue && cue.stop) cue.stop(t); },
  };
}

export function tide(eng, out) {
  const I = new Inst(eng, out);
  const g = I.gain(0.18, out);
  const lp = I.filter('lowpass', 500, 0.6, g);
  I.loopBuf(bed('tide', eng, 11.3, 'brown', (b, s) => { lowpass(b, s, 900); highpass(b, s, 40); }), lp, 1);
  I.drift(g.gain, 0.1, 0.25, 3, 7, 1.8);
  I.drift(lp.frequency, 300, 900, 3, 7, 1.8);
  const rg = I.gain(0.06, out);
  I.loopBuf(bed('rush', eng, 8.9, 'pink', (b, s) => { bandpass(b, s, 1200, 0.5); }), rg, 1);
  I.drift(rg.gain, 0.03, 0.09, 3, 7, 1.8);
  return I;
}

export function humLamp(eng, out) {
  const I = new Inst(eng, out);
  const g = I.gain(0.012, out);
  I.osc('soft', 100, g);
  I.drift(g.gain, 0.009, 0.014, 3, 8, 2);
  const w = I.gain(0.0007, out);
  I.osc('sine', 7600 + eng.rnd() * 900, w);
  return I;
}

// ------------------------------------------------------------ helpers beds use

// someone walking past: a few steps with the pan sliding
export function walker(I, surface, t, d, gainK) {
  const eng = I.eng, rnd = eng.rnd;
  const k = 3 + Math.floor(rnd() * 6), dt = 0.48 + rnd() * 0.12;
  const p0 = (rnd() - 0.5) * 2, p1 = clamp(p0 + (rnd() - 0.5) * 1.2, -1, 1);
  const g = 0.3 * distGain(d) * (gainK || 1);
  const lp = distLp(d) || 9000;
  for (let i = 0; i < k; i++) {
    I.shot(stepBuf(eng, surface), t + i * dt * (0.95 + rnd() * 0.1), { gain: g * (0.75 + rnd() * 0.4), pan: p0 + (p1 - p0) * i / k, lp, rate: 0.95 + rnd() * 0.1 });
  }
}

// a scattered one-shot at a random distance in [d0, d1]
export function scatter(I, name, t, d0, d1, gainK, rate) {
  const eng = I.eng, rnd = eng.rnd;
  const d = d0 + (d1 - d0) * rnd();
  const lp = distLp(d);
  I.sfx(name, t, { gain: (gainK || 1) * distGain(d) * (0.7 + rnd() * 0.5), pan: (rnd() - 0.5) * 1.8, lp: lp || undefined, rate: (rate || 1) * (0.94 + rnd() * 0.12) });
}

// a loud thing far off, and 9.7 s later its faint, smeared echo off the far bank
export function farEcho(I, name, t, gain, rate) {
  const rnd = I.eng.rnd, p = (rnd() - 0.5) * 1.4;
  const buf = I.eng.sfx(name);
  gain *= SFX[name] ? SFX[name].gain : 0.2;
  I.shot(buf, t, { gain, pan: p, lp: 2600, rate });
  for (let k = 0; k < 3; k++) {
    I.shot(buf, t + 9.7 + k * 0.08 + rnd() * 0.04, { gain: gain * 0.13, pan: -p * 0.3 + (rnd() - 0.5) * 0.6, lp: 900, rate: rate * (1 + (k - 1) * 0.006) });
  }
}

// far diegetic music from a cue, through a lowpass. Switches itself on and off when `duty` < 1.
export function farMusic(I, id, level, lp, duty) {
  const eng = I.eng, ctx = I.ctx, rnd = eng.rnd;
  const g = I.gain(0, I.filter('lowpass', lp, 0.5, I.out));
  const M = { cue: null, on: false, next: ctx.currentTime + (duty >= 1 ? 0 : 3 + rnd() * 20) };
  const start = (t) => {
    try { M.cue = createCue(eng, id, g, {}); } catch (e) { eng.warn('far music ' + id + ': ' + e.message); M.cue = null; }
    g.gain.cancelScheduledValues(t);
    g.gain.setTargetAtTime(level, t, 1.5);
    M.on = true;
    M.next = duty >= 1 ? Infinity : t + 60 + rnd() * 70;
  };
  const end = (t) => {
    g.gain.setTargetAtTime(0, t, 1.2);
    const c = M.cue;
    if (c && c.stop) { try { c.stop(t + 6); } catch (e) { /* ignore */ } }
    M.old = c; M.oldEnd = t + 6;
    M.cue = null; M.on = false;
    M.next = t + 40 + rnd() * 60;
  };
  I.sub({
    tick(now, h) {
      if (now >= M.next) { if (M.on) end(now); else start(now); }
      if (M.cue && M.cue.tick) M.cue.tick(now, h);
      if (M.old && now < M.oldEnd && M.old.tick) M.old.tick(now, Math.min(h, M.oldEnd));
      if (M.cue && M.cue.done && M.cue.done(now)) end(now);
    },
    stop(t) { if (M.cue && M.cue.stop) { try { M.cue.stop(t); } catch (e) { /* ignore */ } } },
  });
}

// a deep structural rumble (inside a glide car, under a platform)
export function rumble(eng, out) {
  const I = new Inst(eng, out);
  const g = I.gain(0.4, out);
  I.loopBuf(bed('rumble', eng, 13.1, 'brown', (b, s) => { lowpass(b, s, 220); highpass(b, s, 30); }), g, 1);
  I.drift(g.gain, 0.3, 0.45, 3, 8, 2);
  return I;
}

// render the walla set ahead of time (each job is one talker or the dense crowd)
export function wallaJobs(eng) {
  const jobs = CROWD.map((c) => () => talker(eng, c[0], c[1]));
  for (let i = 0; i < 3; i++) jobs.push(() => talker(eng, 'kids', i));
  jobs.push(() => dense(eng));
  // the small event buffers the beds scatter, every variant
  const each = (n, f) => { for (let i = 0; i < n; i++) jobs.push(f); };
  each(1, () => simmerBuf(eng)); each(5, () => lapBuf(eng)); each(3, () => kiteBuf(eng));
  each(3, () => breathBuf(eng, false)); each(3, () => breathBuf(eng, true)); each(5, () => creakBuf(eng)); each(5, () => dripBuf(eng));
  return jobs;
}
