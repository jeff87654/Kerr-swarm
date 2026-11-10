// One-shot recipes: every sound effect and UI sound, rendered offline into Float32Arrays
// (mono, or [L, R] for diffuse sounds), normalised to peak 1. The engine caches `variants`
// renders of each, plays them at `gain` and sends `send` of them to the room reverb.
// The air is heliox: transients are bright and clean, bodies resonate a little higher,
// and voices keep their pitch while their formants rise.

import { TAU, rrange, pick, clamp, samples, white, Biquad, lowpass, highpass, dcBlock, normalize, fade, mix, addNoise, ks, glottal } from './dsp.js';
import { glideSine, addMode, ratioModes, thump, tick, shapedNoise, flutterEnv, bell01, hann, expDecay, renderStepSound } from './steps.js';

// ---------------------------------------------------------------- shared helpers

function B(sr, s) { return new Float32Array(samples(sr, s)); }

// Finish a render: no DC, no clicks at either end, peak 1.
function fin(b, sr, fout) {
  if (Array.isArray(b)) {
    for (const ch of b) { dcBlock(ch); fade(ch, sr, 0.001, fout || 0.006); }
    return normalize(b, 1);
  }
  dcBlock(b);
  fade(b, sr, 0.001, fout || 0.006);
  return normalize(b, 1);
}

// Add src read at a fractional rate (linear interpolation) into dst at an offset.
function addAtRate(dst, src, offset, gain, rate) {
  const last = src.length - 1, n = dst.length;
  let p = 0;
  for (let i = offset | 0; i < n; i++) {
    const k = p | 0;
    if (k >= last) break;
    const a = src[k];
    dst[i] += (a + (src[k + 1] - a) * (p - k)) * gain;
    p += rate;
  }
  return dst;
}

// modes: [[freq, amp, decay], ...]
function modes(b, sr, t0, list, attack) {
  for (let i = 0; i < list.length; i++) { const m = list[i]; addMode(b, sr, t0, m[0], m[1], m[2], attack); }
  return b;
}

// Upward bubble chirps (water): count bubbles between t0 and t1.
function bubbles(b, sr, t0, t1, count, amp, rnd, fLo, fHi) {
  for (let i = 0; i < count; i++) {
    const t = rrange(rnd, t0, t1);
    const f = rrange(rnd, fLo || 500, fHi || 1800);
    const d = rrange(rnd, 0.012, 0.035);
    glideSine(b, sr, t, f, amp * rrange(rnd, 0.3, 1), d, f * rrange(rnd, 1.5, 2.4), d * 0.8, 0.001);
  }
  return b;
}

// ---------------------------------------------------------------- voices (heliox formants)

const VOWELS = {
  a: [730, 1090, 2440], e: [530, 1840, 2480], i: [300, 2200, 3000],
  o: [570, 840, 2410], u: [320, 870, 2240], ae: [660, 1720, 2410],
};
const HELIOX = [1.5, 1.7, 1.75];
const FQ = [4.5, 7, 9];
const FG = [1, 0.55, 0.28];

function formant(src, sr, vowel, shift) {
  const F = VOWELS[vowel] || VOWELS.a;
  const out = new Float32Array(src.length);
  for (let k = 0; k < 3; k++) {
    const b = src.slice();
    new Biquad('bandpass', F[k] * HELIOX[k] * (shift || 1), FQ[k], sr).run(b);
    mix(out, b, 0, FG[k] * (1 + FQ[k] * 0.15));
  }
  return out;
}

// One sung or shouted voice: f0fn(t) pitch, envFn(x) amplitude, vowel, breath 0..1.
function voiceLine(sr, rnd, dur, f0fn, envFn, vowel, shift, breath) {
  const g = glottal(sr, dur, f0fn, 1100);
  const n = g.length;
  if (breath) {
    const nz = white(n, rnd);
    highpass(nz, sr, 900);
    for (let i = 0; i < n; i++) g[i] += nz[i] * breath * 0.35;
  }
  const out = formant(g, sr, vowel, shift);
  const blk = 64;
  for (let i = 0; i < n; i += blk) {
    const e = envFn(i / n);
    const m = Math.min(blk, n - i);
    for (let k = 0; k < m; k++) out[i + k] *= e;
  }
  return out;
}

// ---------------------------------------------------------------- effect recipes

function door(sr, rnd) {
  const b = B(sr, 1.0);
  // latch
  modes(b, sr, 0.0, [[rrange(rnd, 2600, 3000), 0.25, 0.03], [rrange(rnd, 4100, 4500), 0.15, 0.02], [1480, 0.1, 0.04]]);
  tick(b, sr, 0, 0.4, rnd, 3500, 1.2, 0.004);
  // swing: air past the door
  shapedNoise(b, sr, 0.04, 0.32, 0.08, rnd, (x) => hann(x), 'bandpass', (t) => 500 + t * 2500, 1.2);
  // closing thump into the frame
  const tc = rrange(rnd, 0.33, 0.4);
  thump(b, sr, tc, rrange(rnd, 110, 130), 70, 0.9, 0.07);
  ratioModes(b, sr, tc, rrange(rnd, 170, 200), [[1, 0.5, 0.12], [1.83, 0.35, 0.08], [3.1, 0.25, 0.05], [5.2, 0.12, 0.03]], 1, 1, 0.001, rnd);
  tick(b, sr, tc, 0.5, rnd, 1400, 0.8, 0.012);
  // latch catches
  modes(b, sr, tc + 0.018, [[rrange(rnd, 2700, 3100), 0.18, 0.025], [4300, 0.1, 0.02]]);
  return fin(b, sr, 0.05);
}

function doorSlide(sr, rnd) {
  const b = B(sr, 1.0);
  shapedNoise(b, sr, 0, 0.12, 0.25, rnd, expDecay(4), 'highpass', 2500, 0.7);           // seal hiss
  const fe = flutterEnv(rnd, 60, 0.6, 0.5, (x) => bell01(x, 0.15, 0.85));
  shapedNoise(b, sr, 0.03, 0.62, 0.7, rnd, fe, 'lowpass', 700, 0.9, 'pink');              // rollers
  shapedNoise(b, sr, 0.03, 0.62, 0.15, rnd, fe, 'bandpass', 2200, 2);
  thump(b, sr, 0.64, 95, 70, 0.4, 0.06);
  ratioModes(b, sr, 0.64, 340, [[1, 0.2, 0.08], [2.4, 0.12, 0.05]], 1, 1, 0.002, rnd);
  return fin(b, sr, 0.06);
}

function shutter(sr, rnd) {
  const b = B(sr, 1.5);
  const dur = rrange(rnd, 0.9, 1.1);
  const rate = rrange(rnd, 22, 28);
  for (let t = 0.02; t < dur; t += (1 / rate) * rrange(rnd, 0.85, 1.15)) {
    const a = 0.25 + 0.2 * rnd();
    ratioModes(b, sr, t, rrange(rnd, 900, 1100), [[1, a, 0.03], [2.3, a * 0.6, 0.02], [4.1, a * 0.4, 0.015]], 1, 1, 0.0005, null);
    tick(b, sr, t, a * 0.6, rnd, 2500, 0.8, 0.003);
  }
  shapedNoise(b, sr, 0, dur, 0.25, rnd, (x) => bell01(x, 0.1, 0.9), 'lowpass', 500, 0.8, 'pink');
  thump(b, sr, dur, 100, 60, 0.8, 0.09);
  ratioModes(b, sr, dur, 210, [[1, 0.5, 0.25], [2.7, 0.3, 0.15], [5.3, 0.2, 0.08]], 1, 1, 0.001, rnd);
  return fin(b, sr, 0.05);
}

function knock(sr, rnd) {
  const b = B(sr, 0.65);
  const k = 2 + (rnd() < 0.6 ? 1 : 0);
  for (let i = 0; i < k; i++) {
    const t = 0.005 + i * rrange(rnd, 0.15, 0.2);
    const a = i === k - 1 ? 0.85 : 1;
    thump(b, sr, t, rrange(rnd, 170, 200), 130, 0.6 * a, 0.035);
    ratioModes(b, sr, t, rrange(rnd, 380, 430), [[1, 0.5, 0.06], [1.9, 0.3, 0.04], [3.05, 0.2, 0.025]], a, 1, 0.0005, rnd);
    tick(b, sr, t, 0.5 * a, rnd, 2200, 0.9, 0.003);
  }
  return fin(b, sr, 0.05);
}

const LID = [[1, 0.5, 0.45], [1.62, 0.4, 0.32], [2.31, 0.3, 0.22], [3.08, 0.2, 0.15], [4.17, 0.12, 0.1], [5.4, 0.08, 0.06]];

function lidUp(sr, rnd) {
  const b = B(sr, 1.2);
  const f = rrange(rnd, 620, 780);
  // rim scrapes off the dish: soft excitation, then the free lid rings
  shapedNoise(b, sr, 0, 0.08, 0.25, rnd, expDecay(5), 'bandpass', 3200, 1.5);
  ratioModes(b, sr, 0.01, f, LID, 0.35, 1, 0.006, rnd);
  // steam leaves: heliox carries the heat off fast
  shapedNoise(b, sr, 0.03, 0.9, 0.14, rnd, (x) => bell01(x, 0.08, 0.92) * (0.7 + 0.3 * Math.sin(x * 23)), 'highpass', 3000, 0.7);
  return fin(b, sr, 0.1);
}

function lidDown(sr, rnd) {
  const b = B(sr, 1.0);
  const f = rrange(rnd, 620, 780);
  let t = 0.003, a = 1;
  const bounces = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < bounces; i++) {
    tick(b, sr, t, 0.6 * a, rnd, 4200, 1, 0.003);
    ratioModes(b, sr, t, f * (1 + i * 0.01), LID, 0.4 * a, i === 0 ? 0.6 : 0.4, 0.0005, rnd);
    t += rrange(rnd, 0.025, 0.045) * (1 - i * 0.2);
    a *= 0.45;
  }
  thump(b, sr, 0.003, 220, 160, 0.25, 0.03);
  return fin(b, sr, 0.08);
}

function cup(sr, rnd) {
  const b = B(sr, 0.5);
  const f = rrange(rnd, 1750, 2400);
  ratioModes(b, sr, 0.002, f, [[1, 0.5, 0.12], [2.32, 0.35, 0.07], [3.9, 0.22, 0.045], [5.25, 0.12, 0.03]], 1, 1, 0.0003, rnd);
  thump(b, sr, 0.002, 280, 200, 0.35, 0.025);
  tick(b, sr, 0.002, 0.4, rnd, 5000, 1.2, 0.002);
  if (rnd() < 0.5) ratioModes(b, sr, 0.03, f * 1.01, [[1, 0.2, 0.08], [2.32, 0.12, 0.05]], 1, 1, 0.0003, rnd);
  return fin(b, sr, 0.05);
}

function plate(sr, rnd) {
  const b = B(sr, 0.8);
  const f = rrange(rnd, 900, 1300);
  const P = [[1, 0.5, 0.28], [1.59, 0.4, 0.2], [2.41, 0.3, 0.13], [3.63, 0.18, 0.08], [4.92, 0.1, 0.05]];
  ratioModes(b, sr, 0.002, f, P, 1, 1, 0.0003, rnd);
  ratioModes(b, sr, 0.002 + rrange(rnd, 0.012, 0.022), f * 1.003, P, 0.4, 0.6, 0.0003, rnd);
  thump(b, sr, 0.002, 200, 140, 0.4, 0.03);
  tick(b, sr, 0.002, 0.4, rnd, 4000, 1, 0.003);
  return fin(b, sr, 0.06);
}

function cutlery(sr, rnd) {
  const b = B(sr, 0.5);
  const n = 2 + Math.floor(rnd() * 2);
  let t = 0.002;
  for (let i = 0; i < n; i++) {
    const a = i ? rrange(rnd, 0.3, 0.6) : 1;
    ratioModes(b, sr, t, rrange(rnd, 3000, 3600), [[1, 0.4, 0.12], [1.72, 0.3, 0.08], [2.4, 0.2, 0.05]], a, 1, 0.0002, rnd);
    ratioModes(b, sr, t, rrange(rnd, 1100, 1400), [[1, 0.15, 0.09]], a, 1, 0.0002, rnd);
    tick(b, sr, t, 0.3 * a, rnd, 6000, 1, 0.0015);
    t += rrange(rnd, 0.03, 0.09);
  }
  return fin(b, sr, 0.05);
}

function pour(sr, rnd) {
  const dur = rrange(rnd, 1.2, 1.5);
  const L = B(sr, dur + 0.2), R = B(sr, dur + 0.2);
  const f0 = rrange(rnd, 500, 650), f1 = f0 * rrange(rnd, 2.6, 3.2);
  const env = (x) => bell01(x, 0.06, 0.94) * (0.8 + 0.2 * Math.sin(x * 40));
  // the stream's resonance rises as the vessel fills (shared, centred)
  const body = B(sr, dur + 0.2);
  shapedNoise(body, sr, 0, dur, 1.2, rnd, env, 'bandpass', (t) => f0 * Math.pow(f1 / f0, Math.min(1, t / dur)), 6);
  mix(L, body, 0, 1); mix(R, body, 0, 1);
  shapedNoise(L, sr, 0, dur, 0.05, rnd, env, 'highpass', 4000, 0.7);
  shapedNoise(R, sr, 0, dur, 0.05, rnd, env, 'highpass', 4000, 0.7);
  bubbles(L, sr, 0.05, dur, 16, 0.2, rnd, 700, 2000);
  bubbles(R, sr, 0.05, dur, 16, 0.2, rnd, 700, 2000);
  return fin([L, R], sr, 0.1);
}

function sip(sr, rnd) {
  const b = B(sr, 0.4);
  const fe = flutterEnv(rnd, 90, 0.22, 0.8, (x) => bell01(x, 0.2, 0.8));
  shapedNoise(b, sr, 0, 0.22, 1.6, rnd, fe, 'bandpass', (t) => 1600 + t * 4000, 2.5);
  thump(b, sr, 0.27, 160, 110, 0.1, 0.03);
  return fin(b, sr, 0.04);
}

function chop(sr, rnd) {
  const b = B(sr, 0.35);
  tick(b, sr, 0.002, 0.7, rnd, 4500, 0.7, 0.004);
  thump(b, sr, 0.004, 150, 100, 0.7, 0.04);
  ratioModes(b, sr, 0.004, rrange(rnd, 210, 240), [[1, 0.4, 0.07], [2.2, 0.3, 0.04], [3.7, 0.15, 0.025]], 1, 1, 0.0005, rnd);
  return fin(b, sr, 0.04);
}

function ladle(sr, rnd) {
  const b = B(sr, 0.9);
  const fe = flutterEnv(rnd, 50, 0.3, 0.7, (x) => bell01(x, 0.2, 0.8));
  shapedNoise(b, sr, 0, 0.3, 0.35, rnd, fe, 'bandpass', 2200, 2);
  ratioModes(b, sr, 0.01, rrange(rnd, 400, 450), [[1, 0.3, 0.4], [2.35, 0.2, 0.25], [4.1, 0.15, 0.15]], 1, 1, 0.01, rnd);
  shapedNoise(b, sr, 0.08, 0.5, 0.35, rnd, flutterEnv(rnd, 20, 0.5, 0.6, (x) => bell01(x, 0.2, 0.8)), 'lowpass', (t) => 900 - t * 800, 1.5);
  bubbles(b, sr, 0.1, 0.5, 6, 0.12, rnd, 400, 900);
  tick(b, sr, 0.35, 0.3, rnd, 3000, 2, 0.004);
  ratioModes(b, sr, 0.35, rrange(rnd, 400, 450), [[1, 0.2, 0.3], [2.35, 0.15, 0.2]], 1, 1, 0.0005, rnd);
  return fin(b, sr, 0.08);
}

// The Ledger's steel bell: a big tuned bell with hum, prime, tierce, quint and nominal.
function bell(sr, rnd) {
  const b = B(sr, 5.5);
  const f = rrange(rnd, 205, 215);
  const P = [[0.5, 0.55, 4.8], [1.0, 0.6, 3.6], [1.19, 0.45, 3.0], [1.5, 0.3, 2.2], [2.0, 0.5, 2.6], [2.51, 0.22, 1.6], [2.99, 0.18, 1.3], [4.07, 0.1, 0.8], [5.2, 0.06, 0.5]];
  for (const p of P) {
    addMode(b, sr, 0, f * p[0], p[1], p[2], 0.002);
    addMode(b, sr, 0, f * p[0] * 1.0021, p[1] * 0.5, p[2] * 0.9, 0.002); // doublet: slow beating
  }
  tick(b, sr, 0, 0.5, rnd, 2500, 0.6, 0.006);
  thump(b, sr, 0, 160, 120, 0.3, 0.05);
  return fin(b, sr, 0.4);
}

// A lift arriving: a soft two-note chime.
function chime(sr, rnd) {
  const b = B(sr, 1.8);
  const pairs = [[880, 659.26], [783.99, 587.33], [880, 698.46]];
  const pr = pick(rnd, pairs);
  const C = [[1, 0.6, 1.0], [3.0, 0.08, 0.35], [4.07, 0.05, 0.2], [2.0, 0.1, 0.6]];
  ratioModes(b, sr, 0.002, pr[0], C, 1, 1, 0.004, rnd);
  ratioModes(b, sr, 0.36, pr[1], C, 0.9, 1.2, 0.004, rnd);
  return fin(b, sr, 0.2);
}

function motorSweep(b, sr, t0, dur, f0, f1, amp, envFn, rnd) {
  const n = samples(sr, dur), s = Math.floor(t0 * sr);
  let ph = 0, ph2 = 0;
  for (let i = 0; i < n && s + i < b.length; i++) {
    const x = i / n;
    const f = f0 + (f1 - f0) * (x * x * (3 - 2 * x));
    ph += TAU * f / sr; ph2 += TAU * f * 2.01 / sr;
    b[s + i] += (Math.sin(ph) * 0.7 + Math.sin(ph2) * 0.25 + Math.sin(ph * 3) * 0.08) * amp * envFn(x);
  }
  shapedNoise(b, sr, t0, dur, amp * 0.6, rnd, envFn, 'bandpass', (t) => 300 + (f0 + (f1 - f0) * Math.min(1, t / dur)) * 1.5, 1.2, 'pink');
  return b;
}

function cabGo(sr, rnd) {
  const b = B(sr, 1.8);
  thump(b, sr, 0.005, 120, 80, 0.45, 0.06);
  ratioModes(b, sr, 0.005, 300, [[1, 0.2, 0.1], [2.6, 0.12, 0.06]], 1, 1, 0.001, rnd);
  motorSweep(b, sr, 0.08, 1.6, rrange(rnd, 170, 200), rrange(rnd, 800, 950), 0.3, (x) => bell01(x, 0.35, 0.65), rnd);
  return fin(b, sr, 0.1);
}

function cabStop(sr, rnd) {
  const b = B(sr, 1.9);
  motorSweep(b, sr, 0, 1.3, rrange(rnd, 800, 950), rrange(rnd, 140, 170), 0.3, (x) => bell01(x, 0.2, 0.8), rnd);
  thump(b, sr, 1.28, 110, 75, 0.5, 0.07);
  ratioModes(b, sr, 1.28, 280, [[1, 0.25, 0.12], [2.4, 0.15, 0.07]], 1, 1, 0.001, rnd);
  shapedNoise(b, sr, 1.32, 0.45, 0.08, rnd, expDecay(6), 'highpass', 2500, 0.7);
  return fin(b, sr, 0.08);
}

function berthDoor(sr, rnd) {
  const b = B(sr, 1.0);
  shapedNoise(b, sr, 0, 0.35, 0.35, rnd, expDecay(7), 'bandpass', 3200, 1.2);
  const fe = flutterEnv(rnd, 50, 0.45, 0.4, (x) => bell01(x, 0.2, 0.8));
  shapedNoise(b, sr, 0.05, 0.45, 0.4, rnd, fe, 'lowpass', 800, 1, 'pink');
  motorSweep(b, sr, 0.05, 0.45, 300, 420, 0.05, (x) => bell01(x, 0.2, 0.8), rnd);
  thump(b, sr, 0.52, 100, 70, 0.5, 0.06);
  ratioModes(b, sr, 0.52, 360, [[1, 0.2, 0.09], [2.2, 0.12, 0.05]], 1, 1, 0.001, rnd);
  return fin(b, sr, 0.06);
}

function heavyClank(b, sr, t, rnd, amp, base) {
  thump(b, sr, t, 70, 42, amp, 0.18);
  ratioModes(b, sr, t, base, [[1, 0.4, 0.45], [2.36, 0.35, 0.3], [4.36, 0.25, 0.18], [8.2, 0.15, 0.08]], amp, 1, 0.0008, rnd);
  tick(b, sr, t, amp * 0.6, rnd, 1800, 0.7, 0.008);
}

function glideRelease(sr, rnd) {
  const b = B(sr, 2.4);
  heavyClank(b, sr, 0.01, rnd, 1, rrange(rnd, 135, 150));
  modes(b, sr, 0.06, [[rrange(rnd, 1900, 2100), 0.08, 0.15], [3100, 0.05, 0.1]]);
  // hydraulic sigh, falling away
  shapedNoise(b, sr, 0.08, 1.9, 0.35, rnd, (x) => bell01(x, 0.05, 0.95), 'lowpass', (t) => 2400 * Math.exp(-t * 1.6) + 200, 1.1, 'pink');
  // the cradle arm swings back
  glideSine(b, sr, 0.15, 95, 0.12, 0.9, 60, 0.8, 0.1);
  return fin(b, sr, 0.3);
}

function glideCatch(sr, rnd) {
  const b = B(sr, 2.8);
  thump(b, sr, 0.01, 55, 33, 1, 0.35, 0.006);
  heavyClank(b, sr, 0.03, rnd, 0.6, rrange(rnd, 120, 135));
  // load comes on over a second or two: rumble swells and eases
  shapedNoise(b, sr, 0.02, 2.2, 0.55, rnd, (x) => bell01(x, 0.25, 0.75), 'lowpass', 220, 0.9, 'brown');
  // the arm groans a little
  glideSine(b, sr, 0.15, 92, 0.12, 1.4, 72, 1.0, 0.2);
  glideSine(b, sr, 0.15, 92 * 2.03, 0.05, 1.0, 72 * 2.03, 1.0, 0.2);
  shapedNoise(b, sr, 0.4, 1.8, 0.25, rnd, (x) => bell01(x, 0.1, 0.9), 'bandpass', (t) => 1600 - t * 500, 0.8, 'pink');
  heavyClank(b, sr, rrange(rnd, 2.0, 2.15), rnd, 0.35, 220);
  return fin(b, sr, 0.25);
}

function clunk(sr, rnd) {
  const b = B(sr, 0.7);
  thump(b, sr, 0.003, rrange(rnd, 100, 125), 70, 0.9, 0.08);
  ratioModes(b, sr, 0.003, rrange(rnd, 250, 290), [[1, 0.4, 0.15], [2.1, 0.3, 0.09], [3.5, 0.2, 0.05]], 1, 1, 0.0008, rnd);
  tick(b, sr, 0.003, 0.4, rnd, 1600, 0.8, 0.006);
  return fin(b, sr, 0.06);
}

function hatch(sr, rnd) {
  const b = B(sr, 1.2);
  modes(b, sr, 0.0, [[rrange(rnd, 2100, 2400), 0.2, 0.05], [3500, 0.1, 0.03]]);
  tick(b, sr, 0.0, 0.4, rnd, 3000, 1, 0.004);
  shapedNoise(b, sr, 0.03, 0.25, 0.3, rnd, expDecay(6), 'highpass', 2000, 0.7);
  const fe = flutterEnv(rnd, 30, 0.5, 0.5, (x) => bell01(x, 0.3, 0.7));
  shapedNoise(b, sr, 0.1, 0.5, 0.2, rnd, fe, 'bandpass', 900, 3);
  const tc = rrange(rnd, 0.62, 0.7);
  thump(b, sr, tc, 90, 55, 0.9, 0.1);
  ratioModes(b, sr, tc, rrange(rnd, 180, 210), [[1, 0.4, 0.3], [2.5, 0.3, 0.18], [4.4, 0.18, 0.1]], 1, 1, 0.0008, rnd);
  return fin(b, sr, 0.08);
}

function splash(sr, rnd) {
  const b = B(sr, 1.4);
  shapedNoise(b, sr, 0, 0.9, 0.9, rnd, (x) => Math.exp(-x * 5) * (x < 0.01 ? x * 100 : 1), 'lowpass', (t) => 7000 * Math.exp(-t * 3) + 500, 0.8);
  thump(b, sr, 0, 120, 60, 0.5, 0.08);
  bubbles(b, sr, 0.03, 0.7, 30, 0.25, rnd, 400, 1600);
  bubbles(b, sr, 0.4, 1.2, 10, 0.12, rnd, 1500, 3000); // droplets falling back
  return fin(b, sr, 0.12);
}

function dive(sr, rnd) {
  const b = B(sr, 1.3);
  tick(b, sr, 0, 0.7, rnd, 3000, 0.8, 0.008);
  glideSine(b, sr, 0.003, 260, 0.6, 0.08, 90, 0.04);
  shapedNoise(b, sr, 0.005, 0.5, 0.5, rnd, expDecay(7), 'lowpass', (t) => 4000 * Math.exp(-t * 6) + 300, 0.9);
  bubbles(b, sr, 0.04, 1.0, 40, 0.22, rnd, 350, 1300);
  return fin(b, sr, 0.15);
}

function ballThrow(sr, rnd) {
  const b = B(sr, 0.4);
  shapedNoise(b, sr, 0, 0.3, 1, rnd, (x) => hann(x), 'bandpass', (t) => 700 + t * 4000, 1.6, 'pink');
  shapedNoise(b, sr, 0, 0.12, 0.3, rnd, expDecay(8), 'bandpass', 1400, 1.5);
  return fin(b, sr, 0.04);
}

function ballRing(b, sr, t, rnd, amp) {
  thump(b, sr, t, rrange(rnd, 135, 155), 100, amp, 0.05);
  addMode(b, sr, t, rrange(rnd, 1000, 1200), amp * 0.18, 0.1, 0.001); // air inside, heliox-high
  addMode(b, sr, t, rrange(rnd, 1650, 1800), amp * 0.08, 0.06, 0.001);
  tick(b, sr, t, amp * 0.5, rnd, 1800, 0.9, 0.003);
}

function ballBounce(sr, rnd) {
  const b = B(sr, 0.45);
  ballRing(b, sr, 0.003, rnd, 1);
  return fin(b, sr, 0.04);
}

function ballCatch(sr, rnd) {
  const b = B(sr, 0.35);
  tick(b, sr, 0.002, 0.9, rnd, 1200, 0.8, 0.008);
  ballRing(b, sr, 0.004, rnd, 0.5);
  shapedNoise(b, sr, 0.02, 0.08, 0.15, rnd, expDecay(5), 'bandpass', 2200, 1);
  return fin(b, sr, 0.04);
}

function kiteSnap(sr, rnd) {
  const b = B(sr, 0.9);
  tick(b, sr, 0.002, 1, rnd, 2200, 0.7, 0.008);
  tick(b, sr, rrange(rnd, 0.02, 0.035), 0.6, rnd, 1600, 0.7, 0.01);
  const f = rrange(rnd, 480, 560);
  addMode(b, sr, 0.004, f, 0.35, 0.3, 0.002);
  addMode(b, sr, 0.004, f * 2.003, 0.15, 0.2, 0.002);
  addMode(b, sr, 0.004, f * 3.01, 0.08, 0.12, 0.002);
  const fe = flutterEnv(rnd, 40, 0.3, 0.8, expDecay(5));
  shapedNoise(b, sr, 0.03, 0.3, 0.25, rnd, fe, 'bandpass', 900, 1.5);
  return fin(b, sr, 0.06);
}

function cheer(sr, rnd) {
  const dur = rrange(rnd, 2.3, 2.6);
  const L = B(sr, dur + 0.4), R = B(sr, dur + 0.4);
  const vsr = sr / 4; // voices are rendered and mixed at a quarter of the rate, then read back up
  const lowL = B(vsr, dur + 0.4), lowR = B(vsr, dur + 0.4);
  const vs = ['a', 'ae', 'e', 'o'];
  for (let v = 0; v < 4; v++) {
    const f0 = rrange(rnd, 120, 300);
    const rise = rrange(rnd, 1.15, 1.45);
    const vd = dur * rrange(rnd, 0.75, 0.95);
    const vib = rrange(rnd, 4.5, 6.5), ph = rnd() * TAU;
    const line = voiceLine(vsr, rnd, vd, (t) => {
      const x = t / vd;
      const c = x < 0.25 ? 1 + (rise - 1) * (x / 0.25) : x < 0.75 ? rise : rise - (rise - 0.9) * ((x - 0.75) / 0.25);
      return f0 * c * (1 + 0.012 * Math.sin(TAU * vib * t + ph));
    }, (x) => bell01(x, 0.12, 0.88), vs[v], rrange(rnd, 0.95, 1.1), 0.25);
    for (let k = 0; k < 3; k++) {
      const pan = rnd();
      const off = samples(vsr, rrange(rnd, 0, 0.3));
      const rate = rrange(rnd, 0.93, 1.07);
      const g = rrange(rnd, 0.5, 1);
      addAtRate(lowL, line, off, g * Math.cos(pan * Math.PI / 2), rate);
      addAtRate(lowR, line, off, g * Math.sin(pan * Math.PI / 2), rate);
    }
  }
  addAtRate(L, lowL, 0, 1, 1 / 4);
  addAtRate(R, lowR, 0, 1, 1 / 4);
  lowpass(L, sr, 5500); lowpass(R, sr, 5500);
  // the rest of the crowd as breathy noise in the vocal band: one buffer, reversed for the right
  const nb = B(sr, dur);
  shapedNoise(nb, sr, 0, dur, 0.25, rnd, () => 1, 'bandpass', 1800, 0.8, 'pink');
  const n = nb.length;
  for (let i = 0; i < n; i++) {
    const e = bell01(i / n, 0.15, 0.85);
    L[i] += nb[i] * e; R[i] += nb[n - 1 - i] * e;
  }
  // a few claps
  for (let c = 0; c < 2; c++) {
    const ch = c ? R : L;
    const k = 12 + Math.floor(rnd() * 8);
    for (let i = 0; i < k; i++) addNoise(ch, sr, rrange(rnd, 0.3, dur), rrange(rnd, 0.12, 0.35), rnd, { type: 'bandpass', f: rrange(rnd, 1100, 2400), q: 1.8, decay: 0.006, dur: 0.035 });
  }
  return fin([L, R], sr, 0.3);
}

function laugh(sr, rnd) {
  const n = 4 + Math.floor(rnd() * 4);
  const f0 = rrange(rnd, 150, 310);
  const step = rrange(rnd, 0.13, 0.17);
  const dur = n * step + 0.25;
  const g = glottal(sr, dur, (t) => f0 * (1.25 - 0.35 * (t / dur)) * (1 + 0.04 * Math.sin(TAU * 7 * t)), 1300);
  const nz = white(g.length, rnd);
  highpass(nz, sr, 1000);
  const voiced = formant(g, sr, rnd() < 0.5 ? 'a' : 'ae', rrange(rnd, 0.95, 1.12));
  const asp = formant(nz, sr, 'a', 1.1);
  const out = new Float32Array(g.length);
  for (let p = 0; p < n; p++) {
    const s = Math.floor((0.01 + p * step * rrange(rnd, 0.9, 1.1)) * sr);
    const len = Math.floor(step * 0.7 * sr), h = Math.floor(0.025 * sr);
    const a = 1 - p / (n + 2);
    for (let i = 0; i < len + h && s + i < out.length; i++) {
      const eh = i < h ? Math.sin(Math.PI * i / h) : 0;               // the 'h'
      const j = i - h * 0.6;
      const ev = j < 0 ? 0 : j < 0.01 * sr ? j / (0.01 * sr) : Math.exp(-(j - 0.01 * sr) / (0.06 * sr));
      out[s + i] += (asp[s + i] * eh * 0.7 + voiced[s + i] * ev) * a;
    }
  }
  return fin(out, sr, 0.05);
}

// Hand claps, Poisson in time: raw decaying noise spikes written into three band groups,
// each filtered once (1.1, 1.6 and 2.3 kHz), then mixed in.
function claps(b, sr, rnd, t0, t1, rate, amp, envFn, bands) {
  const nb = bands || 3, o = Math.floor(t0 * sr), len0 = Math.min(b.length, Math.floor((t1 + 0.05) * sr)) - o;
  const groups = [];
  for (let i = 0; i < nb; i++) groups.push(new Float32Array(Math.max(1, len0)));
  const span = t1 - t0;
  let t = t0;
  while (t < t1) {
    t += -Math.log(1 - rnd() * 0.999) / rate;
    if (t >= t1) break;
    const e = envFn ? envFn((t - t0) / span) : 1;
    if (e < 0.02) continue;
    const g = groups[Math.floor(rnd() * nb) % nb];
    const s = Math.floor(t * sr) - o, len = Math.floor(0.03 * sr);
    const k = Math.exp(-1 / (rrange(rnd, 0.004, 0.009) * sr));
    let a = amp * e * rrange(rnd, 0.4, 1);
    for (let i = 0; i < len && s + i < g.length; i++) { g[s + i] += (rnd() * 2 - 1) * a; a *= k; }
  }
  const F = nb === 1 ? [1600] : [1100, 1600, 2300];
  for (let i = 0; i < nb; i++) { new Biquad('bandpass', F[i], nb === 1 ? 1 : 1.6, sr).run(groups[i]); mix(b, groups[i], o, 1.6); }
  return b;
}

function applause(sr, rnd) {
  const dur = rrange(rnd, 3.2, 3.8);
  const L = B(sr, dur + 0.2), R = B(sr, dur + 0.2);
  const env = (x) => (x < 0.08 ? x / 0.08 : x < 0.6 ? 1 : Math.pow(1 - (x - 0.6) / 0.4, 1.6));
  claps(L, sr, rnd, 0, dur, rrange(rnd, 45, 70), 0.8, env);
  claps(R, sr, rnd, 0, dur, rrange(rnd, 45, 70), 0.8, env);
  return fin([L, R], sr, 0.15);
}

function brush(sr, rnd) {
  const b = B(sr, 0.7);
  const strokes = 1 + (rnd() < 0.5 ? 1 : 0);
  for (let s = 0; s < strokes; s++) {
    const t = s * rrange(rnd, 0.28, 0.34);
    const fe = flutterEnv(rnd, 120, 0.28, 0.5, (x) => bell01(x, 0.3, 0.7));
    shapedNoise(b, sr, t, 0.28, 1, rnd, fe, 'bandpass', (q) => 3000 + q * 6000, 0.9);
  }
  return fin(b, sr, 0.04);
}

function paper(sr, rnd) {
  const b = B(sr, 0.55);
  const n = 10 + Math.floor(rnd() * 10);
  for (let i = 0; i < n; i++) {
    const t = Math.pow(rnd(), 1.3) * 0.42;
    addNoise(b, sr, t, rrange(rnd, 0.2, 1), rnd, { type: 'bandpass', f: rrange(rnd, 2500, 6000), q: 0.6, decay: rrange(rnd, 0.004, 0.02), dur: 0.08 });
  }
  shapedNoise(b, sr, 0, 0.45, 0.2, rnd, (x) => bell01(x, 0.2, 0.8), 'bandpass', 4000, 0.7);
  return fin(b, sr, 0.04);
}

function book(sr, rnd) {
  const b = B(sr, 0.6);
  const fe = flutterEnv(rnd, 60, 0.15, 0.8, (x) => bell01(x, 0.5, 0.5));
  shapedNoise(b, sr, 0, 0.15, 0.25, rnd, fe, 'highpass', 2500, 0.7);
  const t = rrange(rnd, 0.14, 0.18);
  thump(b, sr, t, rrange(rnd, 125, 145), 90, 1, 0.06);
  addNoise(b, sr, t, 0.6, rnd, { type: 'lowpass', f: 1600, q: 0.7, decay: 0.015, dur: 0.1 });
  ratioModes(b, sr, t, 330, [[1, 0.15, 0.05], [2.3, 0.08, 0.03]], 1, 1, 0.001, rnd);
  return fin(b, sr, 0.04);
}

function chalk(sr, rnd) {
  const b = B(sr, 0.8);
  let t = 0.002;
  const strokes = 2 + Math.floor(rnd() * 3);
  for (let s = 0; s < strokes; s++) {
    const d = rrange(rnd, 0.08, 0.18);
    tick(b, sr, t, 0.6, rnd, 2500, 1, 0.003);
    const fe = flutterEnv(rnd, 400, d, 0.9, (x) => bell01(x, 0.1, 0.9));
    shapedNoise(b, sr, t, d, 0.6, rnd, fe, 'bandpass', rrange(rnd, 2600, 3600), 2);
    t += d + rrange(rnd, 0.02, 0.06);
    if (t > 0.7) break;
  }
  return fin(b, sr, 0.04);
}

function scissors(sr, rnd) {
  const b = B(sr, 0.5);
  for (let s = 0; s < 2; s++) {
    const t = 0.003 + s * rrange(rnd, 0.17, 0.22);
    shapedNoise(b, sr, t, 0.05, 0.5, rnd, (x) => bell01(x, 0.7, 0.3), 'bandpass', 4500, 2);
    modes(b, sr, t + 0.05, [[rrange(rnd, 4800, 5400), 0.3, 0.03], [7200, 0.15, 0.02], [2600, 0.1, 0.03]], 0.0003);
    tick(b, sr, t + 0.05, 0.4, rnd, 5000, 1, 0.002);
  }
  return fin(b, sr, 0.04);
}

// Soft two-tone: a sine with a little second harmonic and a gentle attack.
function softTone(b, sr, t, f, amp, decay, att) {
  addMode(b, sr, t, f, amp, decay, att || 0.006);
  addMode(b, sr, t, f * 2.001, amp * 0.18, decay * 0.5, att || 0.006);
  addMode(b, sr, t, f * 3.0, amp * 0.04, decay * 0.3, att || 0.006);
}

function coin(sr, rnd) {
  const b = B(sr, 1.0);
  const roots = [[587.33, 880], [659.26, 987.77], [587.33, 783.99]];
  const r = pick(rnd, roots);
  tick(b, sr, 0.002, 0.15, rnd, 3000, 1, 0.002);
  softTone(b, sr, 0.004, r[0], 0.5, 0.35, 0.006);
  softTone(b, sr, 0.09, r[1], 0.45, 0.45, 0.006);
  return fin(b, sr, 0.15);
}

function lampClick(sr, rnd) {
  const b = B(sr, 0.15);
  tick(b, sr, 0.001, 0.8, rnd, 3200, 0.8, 0.002);
  modes(b, sr, 0.001, [[rrange(rnd, 2100, 2400), 0.2, 0.012], [rrange(rnd, 3600, 3900), 0.12, 0.008]], 0.0003);
  thump(b, sr, 0.001, 260, 200, 0.15, 0.012);
  tick(b, sr, 0.02, 0.25, rnd, 2600, 1, 0.002);
  return fin(b, sr, 0.02);
}

function cloth(b, sr, t, dur, amp, rnd, f, rate) {
  const fe = flutterEnv(rnd, rate, dur, 0.85, (x) => bell01(x, 0.25, 0.75));
  shapedNoise(b, sr, t, dur, amp, rnd, fe, 'bandpass', f, 1.2);
  shapedNoise(b, sr, t, dur, amp * 0.15, rnd, fe, 'highpass', 2500, 0.7);
}

function sleeveFlap(sr, rnd) {
  const b = B(sr, 0.6);
  cloth(b, sr, 0, rrange(rnd, 0.3, 0.45), 1, rnd, rrange(rnd, 450, 800), rrange(rnd, 25, 40));
  shapedNoise(b, sr, 0, 0.4, 0.4, rnd, (x) => hann(x), 'bandpass', (t) => 300 + t * 1500, 1, 'pink');
  return fin(b, sr, 0.05);
}

function whoosh(sr, rnd) {
  const dur = rrange(rnd, 0.5, 0.7);
  const b = B(sr, dur + 0.05);
  const peak = rrange(rnd, 0.4, 0.6);
  shapedNoise(b, sr, 0, dur, 1, rnd, (x) => Math.pow(bell01(x, peak, 1 - peak), 1.6), 'bandpass',
    (t) => { const x = t / dur; return 300 + 1300 * Math.sin(Math.PI * clamp(x, 0, 1)); }, 1.3, 'pink');
  return fin(b, sr, 0.03);
}

function landBody(sr, rnd) {
  const b = B(sr, 0.6);
  thump(b, sr, 0.003, rrange(rnd, 85, 100), 48, 1, 0.12, 0.003);
  addNoise(b, sr, 0.003, 0.4, rnd, { type: 'lowpass', f: 1200, q: 0.7, decay: 0.03, dur: 0.15 });
  cloth(b, sr, 0.0, 0.18, 0.25, rnd, 700, 35);
  return fin(b, sr, 0.05);
}

function fluteNote(sr, rnd) {
  const dur = 1.25;
  const b = B(sr, dur + 0.1);
  const f = 587.33; // D5; the engine shifts pitch
  const n = samples(sr, dur);
  const vib = rrange(rnd, 4.6, 5.4), ph0 = rnd() * TAU;
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const vd = Math.min(1, Math.max(0, (t - 0.25) / 0.4)) * 0.0045;
    ph += TAU * f * (1 + vd * Math.sin(TAU * vib * t + ph0)) / sr;
    const e = t < 0.09 ? t / 0.09 : t > dur - 0.25 ? Math.max(0, (dur - t) / 0.25) : 1 - 0.1 * (t / dur);
    b[i] += (Math.sin(ph) + 0.1 * Math.sin(2 * ph) + 0.06 * Math.sin(3 * ph) + 0.015 * Math.sin(5 * ph)) * e * 0.8;
  }
  // tuned breath and a chiff
  shapedNoise(b, sr, 0, dur, 0.18, rnd, (x) => (x < 0.07 ? x / 0.07 : 1) * (x > 0.8 ? (1 - x) / 0.2 : 1), 'bandpass', f, 6);
  shapedNoise(b, sr, 0, dur, 0.035, rnd, (x) => (x > 0.8 ? (1 - x) / 0.2 : 1), 'highpass', 4000, 0.7);
  addNoise(b, sr, 0, 0.15, rnd, { type: 'bandpass', f: f * 2, q: 3, decay: 0.02, attack: 0.008, dur: 0.12 });
  return fin(b, sr, 0.05);
}

function pluck(sr, rnd) {
  const b = ks(sr, 293.66 * (1 + (rnd() - 0.5) * 0.002), 1.8, { bright: rrange(rnd, 0.45, 0.65), pick: rrange(rnd, 0.12, 0.22) }, rnd);
  return fin(b, sr, 0.1);
}

function drumTap(sr, rnd) {
  const b = B(sr, 0.6);
  const f = rrange(rnd, 190, 215);
  thump(b, sr, 0.002, f * 0.9, f * 0.65, 0.9, 0.11);
  ratioModes(b, sr, 0.002, f, [[1.59, 0.25, 0.09], [2.14, 0.2, 0.07], [2.3, 0.15, 0.06], [2.65, 0.1, 0.05]], 1, 1, 0.0008, rnd);
  tick(b, sr, 0.002, 0.45, rnd, 2400, 0.8, 0.005);
  return fin(b, sr, 0.05);
}

function gong(sr, rnd) {
  const b = B(sr, 5.0);
  const f = rrange(rnd, 105, 118);
  const G = [[1, 0.6, 4.2], [1.47, 0.45, 3.4], [2.09, 0.4, 2.9], [2.56, 0.3, 2.4], [2.81, 0.28, 2.2], [3.42, 0.2, 1.7], [4.1, 0.14, 1.3], [5.03, 0.09, 0.9], [6.2, 0.05, 0.6]];
  for (const g of G) {
    const ff = f * g[0] * (1 + (rnd() - 0.5) * 0.01);
    addMode(b, sr, 0.003, ff, g[1], g[2], 0.008);
    addMode(b, sr, 0.003, ff * 1.0035, g[1] * 0.4, g[2] * 0.8, 0.02);
  }
  thump(b, sr, 0.002, 80, 60, 0.5, 0.12, 0.004);
  addNoise(b, sr, 0.002, 0.25, rnd, { type: 'lowpass', f: 1500, q: 0.7, decay: 0.03, dur: 0.2 });
  return fin(b, sr, 0.5);
}

// ---------------------------------------------------------------- UI recipes

function uiClick(sr, rnd) {
  const b = B(sr, 0.06);
  modes(b, sr, 0.001, [[rrange(rnd, 1700, 1900), 0.4, 0.012], [rrange(rnd, 3000, 3300), 0.2, 0.007]], 0.0004);
  tick(b, sr, 0.001, 0.3, rnd, 4000, 1, 0.0015);
  return fin(b, sr, 0.01);
}

function uiHover(sr, rnd) {
  const b = B(sr, 0.08);
  addMode(b, sr, 0.001, rrange(rnd, 1350, 1450), 0.5, 0.02, 0.004);
  addNoise(b, sr, 0.001, 0.08, rnd, { type: 'bandpass', f: 3000, q: 1, decay: 0.006, dur: 0.03 });
  return fin(b, sr, 0.02);
}

function swish(b, sr, rnd, dur, up, amp) {
  shapedNoise(b, sr, 0, dur, amp, rnd, (x) => hann(x), 'bandpass', (t) => (up ? 1200 + t / dur * 2400 : 3600 - t / dur * 2400), 1.2, 'pink');
}

function uiOpen(sr, rnd) {
  const b = B(sr, 0.7);
  swish(b, sr, rnd, 0.18, true, 0.6);
  softTone(b, sr, 0.03, 880, 0.35, 0.22, 0.01);
  softTone(b, sr, 0.1, 1174.66, 0.3, 0.3, 0.01);
  return fin(b, sr, 0.08);
}

function uiClose(sr, rnd) {
  const b = B(sr, 0.65);
  swish(b, sr, rnd, 0.16, false, 0.6);
  softTone(b, sr, 0.03, 1174.66, 0.3, 0.2, 0.01);
  softTone(b, sr, 0.1, 880, 0.3, 0.25, 0.01);
  return fin(b, sr, 0.08);
}

function uiPage(sr, rnd) {
  const b = B(sr, 0.35);
  const fe = flutterEnv(rnd, 80, 0.22, 0.6, (x) => bell01(x, 0.6, 0.4));
  shapedNoise(b, sr, 0, 0.22, 0.8, rnd, fe, 'bandpass', (t) => 2000 + t * 8000, 0.9);
  addNoise(b, sr, 0.21, 0.4, rnd, { type: 'bandpass', f: 1500, q: 0.8, decay: 0.008, dur: 0.05 });
  return fin(b, sr, 0.03);
}

function uiCoin(sr, rnd) {
  const b = B(sr, 0.6);
  softTone(b, sr, 0.002, 1318.51, 0.4, 0.2, 0.004);
  softTone(b, sr, 0.07, 1760, 0.35, 0.28, 0.004);
  return fin(b, sr, 0.1);
}

function uiDeny(sr, rnd) {
  const b = B(sr, 0.3);
  for (let i = 0; i < 2; i++) {
    const t = 0.003 + i * 0.09;
    thump(b, sr, t, 190, 150, i ? 0.7 : 1, 0.05, 0.003);
    addNoise(b, sr, t, 0.15, rnd, { type: 'lowpass', f: 800, q: 0.7, decay: 0.01, dur: 0.05 });
  }
  return fin(b, sr, 0.03);
}

function smallBell(b, sr, t, f, amp, rnd) {
  addMode(b, sr, t, f, amp, 0.7, 0.002);
  addMode(b, sr, t, f * 1.0018, amp * 0.4, 0.6, 0.002);
  addMode(b, sr, t, f * 2.0, amp * 0.2, 0.35, 0.002);
  addMode(b, sr, t, f * 3.0, amp * 0.08, 0.2, 0.002);
  addMode(b, sr, t, f * 4.18, amp * 0.03, 0.12, 0.002);
}

function uiThread(sr, rnd) {
  const b = B(sr, 1.3);
  const N = [587.33, 698.46, 880];
  N.forEach((f, i) => smallBell(b, sr, 0.003 + i * 0.11, f, i === 2 ? 0.5 : 0.4, rnd));
  return fin(b, sr, 0.2);
}

function uiFound(sr, rnd) {
  const b = B(sr, 2.0);
  const N = [440, 587.33, 698.46, 880];
  N.forEach((f, i) => smallBell(b, sr, 0.003 + i * 0.13, f, 0.38, rnd));
  // warm shimmer underneath: a soft D chord swell
  const n = samples(sr, 1.6), s = samples(sr, 0.05);
  const fs = [293.66, 440, 587.33];
  for (let k = 0; k < fs.length; k++) {
    let ph = rnd() * TAU, ph2 = rnd() * TAU;
    const w = TAU * fs[k] / sr, w2 = TAU * fs[k] * 1.003 / sr;
    for (let i = 0; i < n && s + i < b.length; i++) {
      ph += w; ph2 += w2;
      const x = i / n;
      const e = x < 0.3 ? x / 0.3 : Math.pow(1 - (x - 0.3) / 0.7, 2);
      b[s + i] += (Math.sin(ph) + Math.sin(ph2)) * 0.06 * e;
    }
  }
  return fin(b, sr, 0.3);
}

// ---------------------------------------------------------------- tables

function R(gain, variants, send, render) { return { gain, variants, send, render }; }

export const SFX = {
  'door': R(0.32, 3, 1.0, door),
  'door-slide': R(0.26, 3, 0.9, doorSlide),
  'shutter': R(0.32, 2, 1.0, shutter),
  'knock': R(0.28, 3, 0.9, knock),
  'lid-up': R(0.2, 3, 0.8, lidUp),
  'lid-down': R(0.24, 4, 0.8, lidDown),
  'cup': R(0.18, 4, 0.7, cup),
  'plate': R(0.22, 4, 0.8, plate),
  'cutlery': R(0.15, 4, 0.7, cutlery),
  'pour': R(0.18, 3, 0.6, pour),
  'sip': R(0.08, 3, 0.3, sip),
  'chop': R(0.22, 4, 0.7, chop),
  'ladle': R(0.2, 3, 0.8, ladle),
  'bell': R(0.34, 2, 1.2, bell),
  'chime': R(0.18, 3, 1.0, chime),
  'cab-go': R(0.25, 2, 0.6, cabGo),
  'cab-stop': R(0.25, 2, 0.6, cabStop),
  'berth-door': R(0.25, 3, 0.8, berthDoor),
  'glide-release': R(0.32, 2, 1.0, glideRelease),
  'glide-catch': R(0.34, 2, 1.0, glideCatch),
  'clunk': R(0.26, 3, 0.9, clunk),
  'hatch': R(0.28, 3, 0.9, hatch),
  'splash': R(0.32, 3, 1.0, splash),
  'dive': R(0.3, 3, 1.0, dive),
  'ball-throw': R(0.12, 3, 0.5, ballThrow),
  'ball-bounce': R(0.24, 4, 0.9, ballBounce),
  'ball-catch': R(0.2, 3, 0.7, ballCatch),
  'kite-snap': R(0.18, 3, 0.6, kiteSnap),
  'cheer': R(0.3, 2, 1.0, cheer),
  'laugh': R(0.2, 4, 0.8, laugh),
  'applause': R(0.3, 2, 1.0, applause),
  'brush': R(0.1, 3, 0.5, brush),
  'paper': R(0.09, 4, 0.4, paper),
  'book': R(0.2, 3, 0.6, book),
  'chalk': R(0.08, 3, 0.5, chalk),
  'scissors': R(0.12, 3, 0.5, scissors),
  'coin': R(0.15, 3, 0.4, coin),
  'lamp-click': R(0.12, 3, 0.5, lampClick),
  'sleeve-flap': R(0.2, 4, 0.4, sleeveFlap),
  'whoosh': R(0.2, 3, 0.5, whoosh),
  'land': R(0.3, 3, 0.7, landBody),
  'flute-note': R(0.2, 3, 1.0, fluteNote),
  'pluck': R(0.22, 3, 0.9, pluck),
  'drum-tap': R(0.24, 4, 0.9, drumTap),
  'gong': R(0.32, 2, 1.2, gong),
};

export const UI_SFX = {
  click: R(0.1, 4, 0, uiClick),
  hover: R(0.06, 3, 0, uiHover),
  open: R(0.12, 2, 0, uiOpen),
  close: R(0.11, 2, 0, uiClose),
  page: R(0.1, 3, 0, uiPage),
  coin: R(0.12, 2, 0, uiCoin),
  deny: R(0.14, 2, 0, uiDeny),
  thread: R(0.14, 2, 0, uiThread),
  found: R(0.16, 2, 0, uiFound),
};

export const SURFACES = ['tile', 'wood', 'stone', 'metal', 'felt', 'carpet', 'grass', 'gravel', 'sand', 'water'];

// A footstep on a surface. weight 0..1 (low g is light: softer, scuffier, a longer smear).
export function renderStep(sr, rnd, surface, weight, land) {
  return renderStepSound(sr, rnd, surface, weight, land);
}
