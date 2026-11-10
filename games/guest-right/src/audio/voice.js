// Dialogue babble and walla talkers.
// Heliox keeps a voice's pitch but lifts its formants (the throat's resonances) by up to
// about 1.8 times: voices come out bright, thin-edged and clear. The babble is built to be
// quiet, rounded and varied, so a long conversation stays pleasant.

import { clamp, hash, TAU } from './dsp.js';

export const TIMBRES = ['warm', 'bright', 'low', 'child', 'elder'];

// adult formants F1, F2, F3 (Hz) in air
const VOWELS = {
  a: [730, 1090, 2440],
  e: [530, 1840, 2480],
  i: [300, 2200, 2900],
  o: [500, 900, 2400],
  u: [340, 870, 2250],
  y: [480, 1450, 2500],   // a neutral, schwa-like vowel
};
const VLIST = ['a', 'e', 'i', 'o', 'u', 'y'];
const HELIOX = [1.5, 1.75, 1.8];

// f0 (Hz), form (extra formant multiplier), g (formant gains), body (low path), lp, breath, wave
const TIMBRE = {
  warm: { f0: 185, form: 1.0, g: [0.8, 0.85, 0.3], body: 0.08, lp: 5000, breath: 0, wave: 'glottal', peak: 1.0 },
  bright: { f0: 230, form: 1.04, g: [0.8, 0.95, 0.45], body: 0.05, lp: 6000, breath: 0, wave: 'glottal', peak: 1.0 },
  low: { f0: 110, form: 0.92, g: [0.85, 0.75, 0.24], body: 0.12, lp: 4400, breath: 0, wave: 'glottal', peak: 1.0 },
  child: { f0: 300, form: 1.15, g: [0.8, 0.9, 0.35], body: 0.05, lp: 6000, breath: 0, wave: 'glottal', peak: 1.0 },
  elder: { f0: 165, form: 0.97, g: [0.8, 0.8, 0.26], body: 0.08, lp: 4800, breath: 0.5, wave: 'glottal', peak: 0.9, jitter: 0.03, trem: 0.25 },
};

const PLOSIVE = 'pbtdkgcq';
const FRICATIVE = 'sfhzxvjç';
const SOFT = 'mnlrw';
const LETTER = /\p{L}/u;

export function createVoice(eng, dry, wet) {
  const ctx = eng.ctx;
  const bus = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 5200; lp.Q.value = 0.5;
  bus.connect(lp); lp.connect(dry);
  if (wet) { const w = ctx.createGain(); w.gain.value = 0.3; lp.connect(w); w.connect(wet); }
  const states = new Map();
  const rnd = eng.rnd;

  function say(profile, ch, t) {
    if (!ch || ch.length === 0) return;
    const c = ch.toLowerCase();
    if (!LETTER.test(c)) return;
    const tname = TIMBRE[profile.timbre] ? profile.timbre : 'warm';
    const T = TIMBRE[tname];
    const speed = clamp(profile.speed || 1, 0.4, 2.5);
    const pitch = clamp(profile.pitch || 1, 0.4, 2.5);
    const key = tname + '|' + pitch;
    let S = states.get(key);
    if (!S) { S = { last: -1, walk: 0, run: 0, n: 0 }; states.set(key, S); }
    if (S.last >= 0 && t - S.last < 0.07 / speed && t >= S.last) return;
    if (S.last < 0 || t - S.last > 0.6) { S.run = 0; S.walk = (rnd() - 0.3) * 2; }
    S.last = t; S.run++; S.n++;

    // pitch: a random walk in semitones pulled back to the centre, falling gently across a run
    S.walk = S.walk * 0.8 + (rnd() - 0.5) * 2.8;
    const decl = -Math.min(2.4, S.run * 0.11);
    const semi = clamp(S.walk + decl, -5, 5);
    let f0 = T.f0 * pitch * Math.pow(2, semi / 12);
    if (T.jitter) f0 *= 1 + (rnd() - 0.5) * T.jitter;

    // vowel from the letter; consonants pick one by hash so the same text sounds alike
    let v;
    if ('aeiou'.indexOf(c) >= 0) v = c;
    else if (c === 'y') v = 'i';
    else if (c.charCodeAt(0) > 127) v = 'e';
    else v = VLIST[(hash(c) + (S.n & 1)) % VLIST.length];
    const isPlosive = PLOSIVE.indexOf(c) >= 0, isFric = FRICATIVE.indexOf(c) >= 0, isSoft = SOFT.indexOf(c) >= 0;

    const dur = (0.075 + rnd() * 0.035) / speed;
    const onset = isPlosive ? 0.012 : isFric ? 0.024 : 0;
    const t0 = t + onset;
    let peak = 1.0 * T.peak * T.g[0] * (0.8 + rnd() * 0.3) * (isSoft ? 0.85 : 1);
    if (T.trem) peak *= 1 + T.trem * Math.sin(TAU * 5.5 * t);
    if (S.run === 1) peak *= 1.1;

    const osc = ctx.createOscillator();
    osc.setPeriodicWave(eng.wave(T.wave));
    const u1 = (rnd() - 0.5) * 0.04, u2 = (rnd() - 0.6) * 0.06;
    osc.frequency.setValueAtTime(f0 * (1 + u1), t0);
    osc.frequency.exponentialRampToValueAtTime(f0 * (1 + u2), t0 + dur);

    const env = ctx.createGain();
    const att = isSoft ? 0.016 : 0.008;
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(peak, t0 + att);
    env.gain.setTargetAtTime(0, t0 + att + dur * 0.35, dur * 0.26);
    osc.connect(env);

    const F = VOWELS[v];
    const fm = T.form;
    const bp1 = ctx.createBiquadFilter(); bp1.type = 'bandpass'; bp1.frequency.value = F[0] * HELIOX[0] * fm; bp1.Q.value = 4;
    const bp2 = ctx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = F[1] * HELIOX[1] * fm; bp2.Q.value = 5;
    const bp3 = ctx.createBiquadFilter(); bp3.type = 'bandpass'; bp3.frequency.value = F[2] * HELIOX[2] * fm; bp3.Q.value = 6;
    const g2 = ctx.createGain(); g2.gain.value = T.g[1] / T.g[0];
    const g3 = ctx.createGain(); g3.gain.value = T.g[2] / T.g[0];
    const body = ctx.createBiquadFilter(); body.type = 'lowpass'; body.frequency.value = 650; body.Q.value = 0.6;
    const gb = ctx.createGain(); gb.gain.value = T.body / T.g[0];
    env.connect(bp1); env.connect(bp2); env.connect(bp3); env.connect(body);
    bp1.connect(bus); bp2.connect(g2); g2.connect(bus); bp3.connect(g3); g3.connect(bus); body.connect(gb); gb.connect(bus);

    const end = t0 + dur + 0.13;
    osc.start(t0); osc.stop(end);

    // breath for the elder voice: noise through the same formants
    if (T.breath) {
      const n = ctx.createBufferSource(); n.buffer = eng.noise();
      const ng = ctx.createGain(); ng.gain.value = T.breath;
      n.connect(ng); ng.connect(env);
      n.start(t0, rnd() * 2.5); n.stop(end);
    }

    // consonant onset: a tick for plosives, a short hiss for fricatives
    if (isPlosive || isFric) {
      const n = ctx.createBufferSource(); n.buffer = eng.noise();
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = isPlosive ? 3200 : 4800; hp.Q.value = 0.7;
      const ng = ctx.createGain();
      const a = peak * (isPlosive ? 0.35 : 0.16);
      const d = isPlosive ? 0.008 : 0.03;
      ng.gain.setValueAtTime(0, t);
      ng.gain.linearRampToValueAtTime(a, t + (isPlosive ? 0.001 : 0.01));
      ng.gain.linearRampToValueAtTime(0, t + d + 0.004);
      n.connect(hp); hp.connect(ng); ng.connect(bus);
      n.start(t, rnd() * 2.5); n.stop(t + d + 0.01);
    }
    lp.frequency.setTargetAtTime(T.lp, t, 0.01);
  }

  return { say };
}

// ------------------------------------------------------------ walla talkers (offline)

// f0, fm (formant mult), swing (pitch range), breath, kids (shouts and giggles)
const TALKERS = {
  man: { f0: 112, fm: 1.0, swing: 1, breath: 0.03 },
  woman: { f0: 205, fm: 1.12, swing: 1, breath: 0.04 },
  child: { f0: 285, fm: 1.25, swing: 1.3, breath: 0.05 },
  elder: { f0: 150, fm: 1.03, swing: 0.8, breath: 0.18, jitter: 0.02 },
  kids: { f0: 315, fm: 1.26, swing: 2, breath: 0.06, kids: true },
};

// One talker, ~12 s at 24 kHz, starting and ending in silence so it loops cleanly.
export function renderTalker(sr0, rnd, kind) {
  const sr = 24000, dur = 12;
  const K = TALKERS[kind] || TALKERS.woman;
  const n = sr * dur, B = 32, nb = Math.ceil(n / B);
  const cf0 = new Float32Array(nb), c1 = new Float32Array(nb), c2 = new Float32Array(nb), c3 = new Float32Array(nb);
  const cV = new Float32Array(nb), cN = new Float32Array(nb);
  const bt = B / sr;
  const blk = (s) => Math.min(nb - 1, Math.max(0, Math.floor(s / bt)));

  function syllable(t, sd, vowel, f, fEnd, amp, cons, unvoiced) {
    const F = VOWELS[vowel];
    const a = blk(t), m = blk(t + cons), e = blk(t + sd);
    for (let b = a; b < m; b++) { cN[b] = unvoiced ? 0.22 : 0.08; cV[b] = unvoiced ? 0 : amp * 0.3; cf0[b] = f; }
    const len = Math.max(1, e - m);
    for (let b = m; b < e; b++) {
      const x = (b - m) / len, tt = (b - m) * bt;
      const env = Math.min(1, tt / 0.015) * Math.min(1, (e - b) * bt / 0.03);
      cV[b] = amp * env;
      cN[b] = 0;
      cf0[b] = f + (fEnd - f) * x;
      c1[b] = F[0] * HELIOX[0] * K.fm; c2[b] = F[1] * HELIOX[1] * K.fm; c3[b] = F[2] * HELIOX[2] * K.fm;
    }
  }

  let t = 0.2 + rnd() * 0.6;
  while (t < dur - 0.8) {
    const r = rnd();
    const base = K.f0 * (0.9 + rnd() * 0.2);
    if (K.kids && r < 0.12) {
      // a held calling vowel, up then down
      const sd = 0.4 + rnd() * 0.4;
      if (t + sd > dur - 0.5) break;
      const v = rnd() < 0.5 ? 'a' : 'e';
      syllable(t, sd * 0.5, v, base * 1.2, base * 1.65, 1.5, 0.02, false);
      syllable(t + sd * 0.5, sd * 0.5, v, base * 1.65, base * 1.15, 1.4, 0, false);
      t += sd + 0.3 + rnd() * 0.8;
      continue;
    }
    if (K.kids && r < 0.24) {
      // a giggle
      const k = 4 + Math.floor(rnd() * 4);
      let f = base * 1.6;
      for (let i = 0; i < k && t < dur - 0.6; i++) {
        syllable(t, 0.07, 'i', f, f * 0.95, 0.9, 0.025, true);
        t += 0.11 + rnd() * 0.03; f *= 0.94;
      }
      t += 0.4 + rnd() * 1.0;
      continue;
    }
    const syl = 4 + Math.floor(rnd() * 11);
    const accent = Math.floor(rnd() * syl);
    for (let s = 0; s < syl; s++) {
      const sd = 0.09 + rnd() * 0.13;
      if (t + sd > dur - 0.5) break;
      const pos = s / syl;
      let f = base * (1.12 - 0.24 * pos) * (1 + (rnd() - 0.5) * 0.1 * K.swing);
      if (s === accent) f *= 1 + 0.12 * K.swing;
      const cons = rnd() < 0.7 ? 0.02 + rnd() * 0.04 : 0;
      syllable(t, sd, VLIST[Math.floor(rnd() * VLIST.length)], f, f * (0.96 + rnd() * 0.06), s === accent ? 1.25 : 0.85 + rnd() * 0.3, cons, rnd() < 0.5);
      t += sd + (rnd() < 0.15 ? 0.03 + rnd() * 0.05 : 0);
    }
    t += 0.3 + rnd() * 1.2;
  }

  // hold formants and pitch through gaps, then smooth the controls
  let p1 = 1000, p2 = 1800, p3 = 4300, pf = K.f0;
  for (let b = 0; b < nb; b++) {
    if (c1[b] > 0) { p1 = c1[b]; p2 = c2[b]; p3 = c3[b]; } else { c1[b] = p1; c2[b] = p2; c3[b] = p3; }
    if (cf0[b] > 0) pf = cf0[b]; else cf0[b] = pf;
  }
  const sm = (arr, tc) => { const a = Math.exp(-bt / tc); let y = arr[0]; for (let b = 0; b < nb; b++) { y = a * y + (1 - a) * arr[b]; arr[b] = y; } };
  sm(c1, 0.025); sm(c2, 0.03); sm(c3, 0.03); sm(cf0, 0.03); sm(cV, 0.005); sm(cN, 0.004);

  const out = new Float32Array(n);
  // three bandpass states
  let x1a = 0, x2a = 0, y1a = 0, y2a = 0, x1b = 0, x2b = 0, y1b = 0, y2b = 0, x1c = 0, x2c = 0, y1c = 0, y2c = 0;
  let ph = 0, tilt = 0, prevN = 0, body = 0;
  const ta = Math.exp(-TAU * 900 / sr), ba = Math.exp(-TAU * 500 / sr);
  const jit = K.jitter || 0.006;
  let seed = Math.floor(rnd() * 4294967295) >>> 0;
  for (let b = 0; b < nb; b++) {
    const coef = (f, q) => {
      const w = TAU * Math.min(f, sr * 0.45) / sr, al = Math.sin(w) / (2 * q), a0 = 1 + al;
      return [al / a0, -2 * Math.cos(w) / a0, (1 - al) / a0];
    };
    const A = coef(c1[b], 3.5), Bc = coef(c2[b], 5), C = coef(c3[b], 6);
    const V = cV[b], N = cN[b];
    const f0 = cf0[b] * (1 + (rnd() - 0.5) * jit);
    const dt = f0 / sr;
    const i1 = Math.min(n, (b + 1) * B);
    for (let i = b * B; i < i1; i++) {
      ph += dt; if (ph >= 1) ph -= 1;
      let s = 2 * ph - 1;
      if (ph < dt) { const q = ph / dt; s -= q + q - q * q - 1; } else if (ph > 1 - dt) { const q = (ph - 1) / dt; s -= q * q + q + q + 1; }
      tilt = (1 - ta) * -s + ta * tilt;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const w = seed / 2147483648 - 1;
      const x = tilt * V * 2 + w * (N + V * K.breath);
      let y = A[0] * x - A[0] * x2a - A[1] * y1a - A[2] * y2a; x2a = x1a; x1a = x; y2a = y1a; y1a = y;
      const ya = y;
      y = Bc[0] * x - Bc[0] * x2b - Bc[1] * y1b - Bc[2] * y2b; x2b = x1b; x1b = x; y2b = y1b; y1b = y;
      const yb = y;
      y = C[0] * x - C[0] * x2c - C[1] * y1c - C[2] * y2c; x2c = x1c; x1c = x; y2c = y1c; y1c = y;
      body = (1 - ba) * tilt * V + ba * body;
      out[i] = ya + yb * 0.75 + y * 0.35 + body * 0.15 + (w - prevN) * N * 0.3;
      prevN = w;
    }
  }
  // level: a fixed RMS so talkers mix evenly, with the peaks kept in range
  let s2 = 0, pk = 0;
  for (let i = 0; i < n; i++) { const v = out[i]; s2 += v * v; const a = v < 0 ? -v : v; if (a > pk) pk = a; }
  let g = 0.1 / Math.sqrt(s2 / n + 1e-12);
  if (pk * g > 0.95) g = 0.95 / pk;
  for (let i = 0; i < n; i++) out[i] *= g;
  return { sr, data: out };
}
