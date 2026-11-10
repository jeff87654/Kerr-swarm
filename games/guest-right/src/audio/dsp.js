// Offline DSP helpers. Everything here renders into plain Float32Arrays in JS,
// with no Web Audio dependency, so recipes can be rendered (and tested) anywhere.
// The engine turns the arrays into cached AudioBuffers.

export const TAU = Math.PI * 2;

// Small fast seeded generator (mulberry32). Returns floats in [0, 1).
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rrange(rnd, a, b) { return a + (b - a) * rnd(); }
export function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length) % arr.length]; }
export function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
export function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
export function dbToGain(db) { return Math.pow(10, db / 20); }
export function smoothstep(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
export function samples(sr, s) { return Math.max(1, Math.floor(sr * s)); }

// Hash a string to a 32-bit seed.
export function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

// ---------------------------------------------------------------- noise

export function white(n, rnd) {
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = rnd() * 2 - 1;
  return b;
}

// Pink noise (Paul Kellet's economy filter), roughly unit peak.
export function pink(n, rnd) {
  const b = new Float32Array(n);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < n; i++) {
    const w = rnd() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.0990460;
    b1 = 0.96300 * b1 + w * 0.2965164;
    b2 = 0.57000 * b2 + w * 1.0526913;
    b[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
  }
  return b;
}

// Brown (red) noise: leaky integrated white, normalised.
export function brown(n, rnd) {
  const b = new Float32Array(n);
  let y = 0;
  for (let i = 0; i < n; i++) {
    y = 0.998 * y + (rnd() * 2 - 1) * 0.06;
    b[i] = y;
  }
  return normalize(dcBlock(b), 0.9);
}

// ---------------------------------------------------------------- filters

// RBJ cookbook biquad, transposed direct form II. Runs in place on arrays.
export class Biquad {
  constructor(type, f, q, sr, gainDb) {
    this.sr = sr; this.z1 = 0; this.z2 = 0;
    this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0;
    this.set(type, f, q, gainDb || 0);
  }
  set(type, f, q, gainDb) {
    const sr = this.sr;
    f = clamp(f, 5, sr * 0.49);
    q = Math.max(0.05, q || 0.707);
    const w0 = TAU * f / sr, c = Math.cos(w0), s = Math.sin(w0);
    const alpha = s / (2 * q);
    const A = Math.pow(10, (gainDb || 0) / 40);
    let b0, b1, b2, a0, a1, a2;
    switch (type) {
      case 'highpass': b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; a0 = 1 + alpha; a1 = -2 * c; a2 = 1 - alpha; break;
      case 'bandpass': b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * c; a2 = 1 - alpha; break;
      case 'notch': b0 = 1; b1 = -2 * c; b2 = 1; a0 = 1 + alpha; a1 = -2 * c; a2 = 1 - alpha; break;
      case 'allpass': b0 = 1 - alpha; b1 = -2 * c; b2 = 1 + alpha; a0 = 1 + alpha; a1 = -2 * c; a2 = 1 - alpha; break;
      case 'peaking': b0 = 1 + alpha * A; b1 = -2 * c; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * c; a2 = 1 - alpha / A; break;
      case 'lowshelf': {
        const sq = 2 * Math.sqrt(A) * (s / 2) * Math.SQRT2;
        b0 = A * ((A + 1) - (A - 1) * c + sq); b1 = 2 * A * ((A - 1) - (A + 1) * c); b2 = A * ((A + 1) - (A - 1) * c - sq);
        a0 = (A + 1) + (A - 1) * c + sq; a1 = -2 * ((A - 1) + (A + 1) * c); a2 = (A + 1) + (A - 1) * c - sq; break;
      }
      case 'highshelf': {
        const sq = 2 * Math.sqrt(A) * (s / 2) * Math.SQRT2;
        b0 = A * ((A + 1) + (A - 1) * c + sq); b1 = -2 * A * ((A - 1) + (A + 1) * c); b2 = A * ((A + 1) + (A - 1) * c - sq);
        a0 = (A + 1) - (A - 1) * c + sq; a1 = 2 * ((A - 1) - (A + 1) * c); a2 = (A + 1) - (A - 1) * c - sq; break;
      }
      default: // lowpass
        b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + alpha; a1 = -2 * c; a2 = 1 - alpha;
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
    return this;
  }
  tick(x) {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }
  run(buf, i0, i1) {
    const e = i1 === undefined ? buf.length : i1;
    let z1 = this.z1, z2 = this.z2;
    const b0 = this.b0, b1 = this.b1, b2 = this.b2, a1 = this.a1, a2 = this.a2;
    for (let i = i0 || 0; i < e; i++) {
      const x = buf[i];
      const y = b0 * x + z1;
      z1 = b1 * x - a1 * y + z2;
      z2 = b2 * x - a2 * y;
      buf[i] = y;
    }
    this.z1 = z1; this.z2 = z2;
    return buf;
  }
}

export function filter(buf, sr, type, f, q, gainDb) { return new Biquad(type, f, q, sr, gainDb).run(buf); }
export function lowpass(buf, sr, f, q) { return filter(buf, sr, 'lowpass', f, q || 0.707); }
export function highpass(buf, sr, f, q) { return filter(buf, sr, 'highpass', f, q || 0.707); }
export function bandpass(buf, sr, f, q) { return filter(buf, sr, 'bandpass', f, q || 1); }

// One-pole low or high pass (6 dB/oct), in place.
export function onePole(buf, sr, f, high) {
  const a = Math.exp(-TAU * f / sr);
  let y = 0;
  for (let i = 0; i < buf.length; i++) {
    y = (1 - a) * buf[i] + a * y;
    buf[i] = high ? buf[i] - y : y;
  }
  return buf;
}

export function dcBlock(buf) {
  let x1 = 0, y1 = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    const y = x - x1 + 0.995 * y1;
    x1 = x; y1 = y; buf[i] = y;
  }
  return buf;
}

// Filter whose cutoff follows a function of time: fn(t) -> Hz. Coefficients update every 32 samples.
export function sweep(buf, sr, type, fn, q, i0, i1) {
  const bq = new Biquad(type, fn(0), q, sr);
  const s = i0 || 0, e = i1 === undefined ? buf.length : i1;
  for (let i = s; i < e; i += 32) {
    bq.set(type, fn((i - s) / sr), q, 0);
    bq.run(buf, i, Math.min(e, i + 32));
  }
  return buf;
}

// ---------------------------------------------------------------- shaping

export function normalize(buf, peak) {
  const p = peak === undefined ? 1 : peak;
  if (Array.isArray(buf)) {
    let m = 0;
    for (const ch of buf) for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > m) m = a; }
    if (m > 1e-9) for (const ch of buf) for (let i = 0; i < ch.length; i++) ch[i] *= p / m;
    return buf;
  }
  let m = 0;
  for (let i = 0; i < buf.length; i++) { const a = Math.abs(buf[i]); if (a > m) m = a; }
  if (m > 1e-9) { const g = p / m; for (let i = 0; i < buf.length; i++) buf[i] *= g; }
  return buf;
}

export function rms(buf) {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / Math.max(1, buf.length));
}

export function scale(buf, g) { for (let i = 0; i < buf.length; i++) buf[i] *= g; return buf; }

// Linear fade in and out (seconds).
export function fade(buf, sr, fin, fout) {
  const n = buf.length;
  const a = Math.min(n, Math.floor(sr * (fin || 0))), b = Math.min(n, Math.floor(sr * (fout || 0)));
  for (let i = 0; i < a; i++) buf[i] *= i / a;
  for (let i = 0; i < b; i++) buf[n - 1 - i] *= i / b;
  return buf;
}

// Multiply by an attack/exponential-decay envelope starting at t0.
export function envAD(buf, sr, t0, attack, decay) {
  const s = Math.floor(t0 * sr), a = Math.max(1, Math.floor(attack * sr));
  const k = Math.exp(-1 / Math.max(1, decay * sr));
  let g = 1;
  for (let i = 0; i < buf.length; i++) {
    if (i < s) { buf[i] = 0; continue; }
    const j = i - s;
    if (j < a) buf[i] *= j / a;
    else { g *= k; buf[i] *= g; }
  }
  return buf;
}

// Mix src into dst at a sample offset with a gain.
export function mix(dst, src, offset, gain) {
  const g = gain === undefined ? 1 : gain;
  const o = Math.floor(offset || 0);
  const e = Math.min(dst.length, o + src.length);
  for (let i = Math.max(0, o); i < e; i++) dst[i] += src[i - o] * g;
  return dst;
}

// Read src at a fractional rate (linear interpolation) and add into dst.
export function mixResampled(dst, src, offset, gain, rate) {
  const o = Math.floor(offset || 0);
  let p = 0;
  for (let i = Math.max(0, o); i < dst.length; i++) {
    const k = Math.floor(p);
    if (k + 1 >= src.length) break;
    const f = p - k;
    dst[i] += (src[k] * (1 - f) + src[k + 1] * f) * gain;
    p += rate;
  }
  return dst;
}

// Gentle saturation for warmth.
export function soft(buf, drive) {
  const d = drive || 1, n = Math.tanh(d);
  for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * d) / n;
  return buf;
}

// Make a buffer loop seamlessly: crossfade its last xf seconds into its start
// (equal power). The result is shorter by the crossfade.
export function loopify(buf, sr, xf) {
  const x = Math.min(Math.floor(sr * xf), Math.floor(buf.length / 3));
  const n = buf.length - x;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = buf[i];
  for (let i = 0; i < x; i++) {
    const t = i / x;
    out[i] = buf[i] * Math.sin(t * Math.PI / 2) + buf[n + i] * Math.cos(t * Math.PI / 2);
  }
  return out;
}

// ---------------------------------------------------------------- synthesis

// Add a decaying sine starting at t0. opts: f1 (glide target Hz), glide (s), attack (s), phase.
// The glide is an exponential approach from f to f1; the tail stops at -60 dB.
export function addSine(buf, sr, t0, f, amp, decay, opts) {
  const o = opts || {};
  const s = Math.floor(t0 * sr);
  const att = Math.max(1, Math.floor((o.attack || 0.001) * sr));
  const k = Math.exp(-1 / Math.max(1, decay * sr));
  const f1 = o.f1 === undefined ? f : o.f1;
  const kg = Math.exp(-1 / Math.max(1, (o.glide || 0.05) * sr));
  const w = TAU / sr;
  let ph = o.phase || 0, g = amp, gd = f - f1;
  const end = Math.min(buf.length, s + att + Math.floor(decay * sr * 7));
  for (let i = s; i < end; i++) {
    const j = i - s;
    ph += w * (f1 + gd);
    gd *= kg;
    if (i < 0) continue;
    if (j < att) buf[i] += Math.sin(ph) * g * (j / att);
    else { buf[i] += Math.sin(ph) * g; g *= k; }
  }
  return buf;
}

// Modal synthesis: modes = [[freq, amp, decaySeconds], ...]
export function addModes(buf, sr, t0, modes, opts) {
  for (const m of modes) addSine(buf, sr, t0, m[0], m[1], m[2], opts);
  return buf;
}

// Add a filtered noise burst. o: { type, f, q, attack, decay, dur, f1 (sweep end) }
export function addNoise(buf, sr, t0, amp, rnd, o) {
  const dur = o.dur || (o.decay || 0.05) * 7;
  const n = samples(sr, dur);
  const nb = white(n, rnd);
  if (o.f !== undefined) {
    if (o.f1 !== undefined) {
      const f0 = o.f, f1 = o.f1;
      sweep(nb, sr, o.type || 'bandpass', (t) => f0 * Math.pow(f1 / f0, Math.min(1, t / dur)), o.q || 1);
    } else filter(nb, sr, o.type || 'bandpass', o.f, o.q || 1);
    if (o.type === 'bandpass' || !o.type) scale(nb, 1 + Math.sqrt(o.q || 1) * 0.5);
  }
  envAD(nb, sr, 0, o.attack || 0.001, o.decay || 0.05);
  return mix(buf, nb, Math.floor(t0 * sr), amp);
}

// Karplus-Strong plucked string with fractional tuning and a pick-position comb.
// opts: { decay (T60 s at this pitch), bright (0..1), pick (0..0.5), body (bool) }
export function ks(sr, freq, dur, opts, rnd) {
  const o = opts || {};
  const n = samples(sr, dur);
  const out = new Float32Array(n);
  const bright = clamp(o.bright === undefined ? 0.5 : o.bright, 0, 1);
  const st = 0.5 - 0.42 * bright;           // loop filter blend: 0.5 is darkest
  const N = sr / freq;
  let L = Math.floor(N - st);
  let d = N - L - st;
  if (d < 0.15) { L -= 1; d += 1; }
  const C = (1 - d) / (1 + d);
  const t60 = o.decay || (1.2 + 160 / freq);
  const loss = Math.pow(10, -3 / (t60 * freq));
  // excitation: lowpassed noise burst of one period, combed by pick position
  const exc = white(L + 2, rnd);
  onePole(exc, sr, 1200 + 9000 * bright);
  const P = Math.max(1, Math.floor((o.pick || 0.18) * L));
  for (let i = exc.length - 1; i >= P; i--) exc[i] -= exc[i - P] * 0.9;
  let apx = 0, apy = 0;
  for (let i = 0; i < n; i++) {
    const a = i - L >= 0 ? out[i - L] : 0;
    const b = i - L - 1 >= 0 ? out[i - L - 1] : 0;
    const lp = ((1 - st) * a + st * b) * loss;
    const ap = C * lp + apx - C * apy;
    apx = lp; apy = ap;
    out[i] = (i < exc.length ? exc[i] : 0) + ap;
  }
  dcBlock(out);
  if (o.body !== false) {
    new Biquad('peaking', 190, 1.4, sr, 4).run(out);
    new Biquad('peaking', 430, 1.8, sr, 2.5).run(out);
    new Biquad('highshelf', 3500, 0.7, sr, -2 + 4 * bright).run(out);
  }
  fade(out, sr, 0.0015, Math.min(0.08, dur * 0.2));
  return normalize(out, 1);
}

// A glottal-ish band-limited pulse train at a varying pitch, rendered by additive
// polyBLEP sawtooth then tilted. fnHz(t) gives the pitch at time t.
export function glottal(sr, dur, fnHz, tilt) {
  const n = samples(sr, dur);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const f = fnHz(i / sr);
    const dt = f / sr;
    ph += dt;
    if (ph >= 1) ph -= 1;
    let v = 2 * ph - 1;
    // polyBLEP correction
    if (ph < dt) { const t = ph / dt; v -= t + t - t * t - 1; }
    else if (ph > 1 - dt) { const t = (ph - 1) / dt; v -= t * t + t + t + 1; }
    out[i] = -v;
  }
  onePole(out, sr, tilt || 900);
  return dcBlock(out);
}

// Seamless looping noise bed shaped by filters. kind: 'white' | 'pink' | 'brown'
export function noiseBed(sr, seconds, kind, rnd, shape) {
  const n = samples(sr, seconds + 0.5);
  let b = kind === 'brown' ? brown(n, rnd) : kind === 'pink' ? pink(n, rnd) : white(n, rnd);
  if (shape) shape(b);
  b = loopify(b, sr, 0.5);
  return normalize(b, 0.9);
}

// ---------------------------------------------------------------- reverb impulse responses

// spec: { rt, pre, er (count), erSpan (s), slap: [[t, amp], ...], low (rt multiplier below 300 Hz),
//         high (rt multiplier above 4 kHz), bright (0..1 tilt), attack (s), length (s), modes: [[f, amp, decay]] }
export function impulse(sr, spec, seed) {
  const rnd = rng(seed || 7);
  const len = spec.length || Math.min(6, spec.rt * 1.4 + 0.1);
  const n = samples(sr, len);
  const chans = [new Float32Array(n), new Float32Array(n)];
  const pre = spec.pre || 0.008;
  for (let c = 0; c < 2; c++) {
    const out = chans[c];
    // late tail in three bands with different decay times, split from one noise source
    const nb = new Float32Array(n);
    let seed = (Math.floor(rnd() * 4294967295) >>> 0) || 1;
    for (let i = 0; i < n; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; nb[i] = seed / 2147483648 - 1; }
    const lo = Float32Array.from(nb), hi = Float32Array.from(nb);
    lowpass(lo, sr, 300); highpass(hi, sr, 4000);
    const kL = Math.exp(-6.9078 / Math.max(1, spec.rt * (spec.low || 1.15) * sr));
    const kM = Math.exp(-6.9078 / Math.max(1, spec.rt * sr));
    const kH = Math.exp(-6.9078 / Math.max(1, spec.rt * (spec.high || 0.6) * sr));
    const hg = 0.5 + (spec.bright || 0.5);
    const s0 = Math.floor(pre * sr), att = Math.max(1, Math.floor((spec.attack || 0.02) * sr));
    let gL = 1.4, gM = 1, gH = hg;
    for (let i = s0; i < n; i++) {
      const j = i - s0;
      const e = j < att ? j / att : 1;
      const l = lo[i], h = hi[i], m = nb[i] - l - h;
      out[i] += e * (l * gL + m * gM + h * gH);
      gL *= kL; gM *= kM; gH *= kH;
    }
    // early reflections
    const er = spec.er || 10, span = spec.erSpan || 0.05;
    for (let k = 0; k < er; k++) {
      const t = pre * 0.5 + Math.pow(rnd(), 1.3) * span;
      const a = (0.9 - 0.6 * (t / (span + pre))) * (rnd() < 0.5 ? -1 : 1) * rrange(rnd, 0.5, 1) * (spec.erAmp || 1.6);
      const i = Math.floor(t * sr);
      if (i + 2 < n) { out[i] += a; out[i + 1] += a * 0.5; out[i + 2] += a * 0.2; }
    }
    // discrete slaps (flutter between parallel walls)
    if (spec.slap) for (const [t, a] of spec.slap) {
      const i = Math.floor((t + (c ? 0.0017 : 0)) * sr);
      for (let j = 0; j < 40 && i + j < n; j++) out[i + j] += a * 3 * Math.exp(-j / 6) * (j % 2 ? -0.4 : 1);
    }
    if (spec.modes) for (const m of spec.modes) addSine(out, sr, pre, m[0] * (c ? 1.003 : 1), m[1], m[2], { attack: 0.05, phase: rnd() * TAU });
    if (spec.dark) lowpass(out, sr, spec.dark);
    fade(out, sr, 0, Math.min(0.3, len * 0.3));
  }
  // normalise energy so wet levels are comparable between rooms
  let e = 0;
  for (const ch of chans) for (let i = 0; i < n; i++) e += ch[i] * ch[i];
  const g = 1 / Math.sqrt(e / 2 + 1e-9) * 0.9;
  for (const ch of chans) scale(ch, g);
  return chans;
}
