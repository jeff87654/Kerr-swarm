// Footsteps per surface, plus the small rendering helpers the one-shot recipes share.
// Pure JS into Float32Arrays; imports only dsp.js.

import { TAU, rrange, clamp, samples, white, pink, brown, filter, sweep, dcBlock, normalize, fade, mix, addNoise } from './dsp.js';

// ---------------------------------------------------------------- helpers

// Add a damped sinusoid with a two-pole resonator (no trig per sample).
// y[n] = amp * r^n * sin(w n): starts from zero, so no click.
export function addMode(b, sr, t0, f, amp, decay, attack) {
  if (!(f > 0) || f >= sr * 0.45 || amp === 0) return b;
  const s = Math.floor(t0 * sr);
  const w = TAU * f / sr, r = Math.exp(-1 / Math.max(1, decay * sr));
  const c = 2 * r * Math.cos(w), r2 = r * r;
  const end = Math.min(b.length, s + Math.floor(decay * sr * 9.5));
  const att = Math.max(1, Math.floor((attack || 0.0005) * sr));
  let y1 = 0, y2 = 0, y = 0;
  for (let i = s, j = 0; i < end; i++, j++) {
    if (j === 0) y = 0;
    else if (j === 1) y = amp * r * Math.sin(w);
    else y = c * y1 - r2 * y2;
    y2 = y1; y1 = y;
    if (i >= 0) b[i] += j < att ? y * (j / att) : y;
  }
  return b;
}

// Scaled mode set from ratios: [[ratio, amp, decay], ...]
export function ratioModes(b, sr, t0, base, ratios, amp, dscale, attack, rnd) {
  for (let i = 0; i < ratios.length; i++) {
    const r = ratios[i];
    const jit = rnd ? 1 + (rnd() - 0.5) * 0.012 : 1;
    addMode(b, sr, t0, base * r[0] * jit, amp * r[1], r[2] * (dscale || 1), attack);
  }
  return b;
}

// A decaying sine whose pitch glides exponentially from f toward f1 (fast: one sin per sample).
export function glideSine(b, sr, t0, f, amp, decay, f1, glide, attack, phase) {
  const s = Math.floor(t0 * sr);
  const end = Math.min(b.length, s + Math.floor(decay * sr * 7));
  const kd = Math.exp(-1 / Math.max(1, decay * sr));
  const kg = Math.exp(-1 / Math.max(1, (glide || 0.05) * sr));
  const att = Math.max(1, Math.floor((attack || 0.002) * sr));
  const to = f1 === undefined ? f : f1, w = TAU / sr;
  let e = 1, g = amp, ph = phase || 0;
  for (let i = s, j = 0; i < end; i++, j++) {
    ph += w * (to + (f - to) * e);
    e *= kg;
    const y = Math.sin(ph) * g;
    if (i >= 0) b[i] += j < att ? y * (j / att) : y;
    if (j >= att) g *= kd;
  }
  return b;
}

// A low thump with a downward pitch glide.
export function thump(b, sr, t0, f0, f1, amp, decay, attack) {
  return glideSine(b, sr, t0, f0, amp, decay, f1, decay * 0.6, attack || 0.002);
}

// A short filtered noise click.
export function tick(b, sr, t0, amp, rnd, f, q, decay, type) {
  const d = decay || 0.004;
  return addNoise(b, sr, t0, amp, rnd, { type: type || 'bandpass', f, q: q || 1, decay: d, dur: d * 8 + 0.002 });
}

// Noise shaped by envFn(x 0..1) and a filter (fixed Hz, or a function of seconds).
export function shapedNoise(b, sr, t0, dur, amp, rnd, envFn, type, f, q, kind) {
  const n = samples(sr, dur);
  const nb = kind === 'pink' ? pink(n, rnd) : kind === 'brown' ? brown(n, rnd) : white(n, rnd);
  if (typeof f === 'function') sweep(nb, sr, type || 'bandpass', f, q || 1);
  else if (f) filter(nb, sr, type || 'bandpass', f, q || 1);
  const blk = 64;
  for (let i = 0; i < n; i += blk) {
    const e0 = envFn(i / n), e1 = envFn(Math.min(1, (i + blk) / n));
    const m = Math.min(blk, n - i);
    for (let k = 0; k < m; k++) nb[i + k] *= e0 + (e1 - e0) * (k / blk);
  }
  return mix(b, nb, Math.floor(t0 * sr), amp);
}

// Random flutter gate for cloth and grit: returns x(0..1) -> 0..1, times shape(x).
export function flutterEnv(rnd, rate, dur, depth, shape) {
  const steps = Math.max(3, Math.ceil(rate * dur) + 2);
  const v = new Float32Array(steps);
  for (let i = 0; i < steps; i++) v[i] = 1 - depth * rnd();
  return (x) => {
    const p = clamp(x, 0, 1) * (steps - 2), k = Math.floor(p), f = p - k;
    return (v[k] + (v[k + 1] - v[k]) * f) * shape(x);
  };
}

export function bell01(x, a, d) { return x < a ? x / a : Math.max(0, 1 - (x - a) / d); }
export function hann(x) { return 0.5 - 0.5 * Math.cos(TAU * clamp(x, 0, 1)); }
export function expDecay(k) { return (x) => Math.exp(-k * x); }

// ---------------------------------------------------------------- footsteps

// Per surface: thump strength, scuff band, and the texture layer.
const SURF = {
  tile:   { th: 0.5, sf: 3500, sq: 0.9, sa: 0.25 },
  wood:   { th: 0.7, sf: 1400, sq: 0.8, sa: 0.25 },
  stone:  { th: 0.8, sf: 2200, sq: 0.8, sa: 0.25 },
  metal:  { th: 0.45, sf: 3000, sq: 1, sa: 0.2 },
  felt:   { th: 0.6, sf: 900, sq: 0.7, sa: 0.3 },
  carpet: { th: 0.55, sf: 1600, sq: 0.7, sa: 0.3 },
  grass:  { th: 0.35, sf: 4000, sq: 0.7, sa: 0.5 },
  gravel: { th: 0.4, sf: 3500, sq: 0.8, sa: 0.4 },
  sand:   { th: 0.4, sf: 2500, sq: 0.6, sa: 0.55 },
  water:  { th: 0.3, sf: 1200, sq: 0.7, sa: 0.3 },
};

function texture(b, sr, rnd, surface, t, a, w) {
  switch (surface) {
    case 'tile':
      tick(b, sr, t, 0.9 * a, rnd, rrange(rnd, 3200, 4200), 1, 0.005);
      addMode(b, sr, t, rrange(rnd, 2500, 2800), 0.12 * a, 0.03, 0.0005);
      addMode(b, sr, t, rrange(rnd, 4000, 4400), 0.07 * a, 0.02, 0.0005);
      break;
    case 'wood':
      ratioModes(b, sr, t, rrange(rnd, 230, 270), [[1, 0.45, 0.06], [2.15, 0.25, 0.04], [3.6, 0.15, 0.025]], a, 1, 0.0008, rnd);
      tick(b, sr, t, 0.5 * a, rnd, 1200, 0.8, 0.01);
      break;
    case 'stone':
      tick(b, sr, t, 0.8 * a, rnd, rrange(rnd, 1600, 2100), 0.8, 0.008);
      break;
    case 'metal':
      ratioModes(b, sr, t, rrange(rnd, 500, 560), [[1, 0.3, 0.22], [2.6, 0.22, 0.14], [4.4, 0.15, 0.09], [6.6, 0.08, 0.06]], a, 1, 0.0005, rnd);
      tick(b, sr, t, 0.6 * a, rnd, 3000, 1, 0.004);
      break;
    case 'felt':
      addNoise(b, sr, t, 0.6 * a, rnd, { type: 'lowpass', f: 800, q: 0.7, decay: 0.025, attack: 0.004, dur: 0.15 });
      break;
    case 'carpet':
      addNoise(b, sr, t, 0.6 * a, rnd, { type: 'lowpass', f: 1400, q: 0.7, decay: 0.02, attack: 0.003, dur: 0.12 });
      addNoise(b, sr, t, 0.12 * a, rnd, { type: 'highpass', f: 3500, q: 0.7, decay: 0.03, dur: 0.15 });
      break;
    case 'grass': {
      const d = 0.1 + 0.08 * (1 - w);
      shapedNoise(b, sr, t, d, 0.9 * a, rnd, flutterEnv(rnd, 300, d, 0.85, (x) => bell01(x, 0.15, 0.85)), 'bandpass', rrange(rnd, 3200, 4800), 0.6);
      break;
    }
    case 'gravel': {
      const n = Math.floor(rrange(rnd, 25, 55) * (0.6 + 0.4 * w));
      const span = 0.06 + 0.08 * (1 - w);
      for (let i = 0; i < n; i++) {
        const tt = t + Math.pow(rnd(), 1.6) * span;
        tick(b, sr, tt, a * rrange(rnd, 0.2, 0.7), rnd, rrange(rnd, 2000, 6000), 1.5, rrange(rnd, 0.0008, 0.0025));
      }
      break;
    }
    case 'sand': {
      const d = 0.07 + 0.08 * (1 - w);
      shapedNoise(b, sr, t, d, 0.7 * a, rnd, flutterEnv(rnd, 500, d, 0.7, (x) => bell01(x, 0.1, 0.9)), 'bandpass', rrange(rnd, 2000, 3000), 0.5);
      break;
    }
    case 'water': {
      shapedNoise(b, sr, t, 0.2, 0.8 * a, rnd, (x) => Math.exp(-x * 5) * Math.min(1, x * 40), 'lowpass', (tt) => 4500 * Math.exp(-tt * 12) + 700, 0.8);
      const k = 2 + Math.floor(rnd() * 3);
      for (let i = 0; i < k; i++) {
        const f = rrange(rnd, 600, 1500), d = rrange(rnd, 0.015, 0.03);
        glideSine(b, sr, t + rrange(rnd, 0.01, 0.15), f, 0.2 * a, d, f * 1.9, d * 0.8, 0.001);
      }
      shapedNoise(b, sr, t + 0.08, 0.25, 0.25 * a, rnd, (x) => Math.sin(Math.PI * x), 'lowpass', 900, 1, 'pink');
      break;
    }
    default:
      tick(b, sr, t, 0.6 * a, rnd, 2000, 0.8, 0.008);
  }
}

// One footstep. weight 0..1 is how heavy the step is (from g); land=true is a landing.
export function renderStepSound(sr, rnd, surface, weight, land) {
  const S = SURF[surface] || SURF.stone;
  const w = clamp(weight === undefined ? 1 : weight, 0, 1);
  const len = land ? 0.55 : 0.38;
  const b = new Float32Array(samples(sr, len));
  const t0 = 0.003;
  // heel thump: lighter steps thump less
  const th = S.th * (land ? 1.4 : 0.25 + 0.75 * w);
  const f0 = land ? rrange(rnd, 75, 95) : rrange(rnd, 95, 125);
  glideSine(b, sr, t0, f0, th, land ? 0.11 + 0.05 * w : 0.035 + 0.02 * w, f0 * 0.55, 0.04, 0.002);
  // scuff: longer and relatively stronger at low weight (feet drift in low g)
  const sd = 0.04 + 0.16 * (1 - w) + (land ? 0.05 : 0);
  const sa = S.sa * (0.5 + 0.9 * (1 - w)) * (land ? 1.2 : 1);
  shapedNoise(b, sr, t0, sd, sa, rnd, (x) => bell01(x, 0.15 + 0.2 * (1 - w), 0.85 - 0.2 * (1 - w)), 'bandpass', S.sf * rrange(rnd, 0.85, 1.15), S.sq);
  // the surface itself: heel, then (sometimes) toe
  const ta = land ? 1.3 : 0.45 + 0.55 * w;
  texture(b, sr, rnd, surface, t0, ta, w);
  if (!land && rnd() < 0.7) texture(b, sr, rnd, surface, t0 + rrange(rnd, 0.035, 0.06) + 0.04 * (1 - w), ta * rrange(rnd, 0.25, 0.45), w);
  dcBlock(b);
  fade(b, sr, 0.001, 0.02);
  return normalize(b, 1);
}
