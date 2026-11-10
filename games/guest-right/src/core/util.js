// Small shared helpers: numbers, random, noise, colour, events.

export const TAU = Math.PI * 2;

export function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
export function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function invLerp(a, b, x) { return (x - a) / (b - a); }
export function remap(x, a, b, c, d) { return c + (d - c) * clamp01((x - a) / (b - a)); }
export function smoothstep(a, b, x) { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
export function smoother(t) { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); }
// Frame-rate independent approach of a toward b: rate is "fraction closed per second" style (higher = snappier).
export function damp(a, b, rate, dt) { return b + (a - b) * Math.exp(-rate * dt); }
export function wrapPi(a) { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; }
export function dampAngle(a, b, rate, dt) { return a + wrapPi(b - a) * (1 - Math.exp(-rate * dt)); }
export function sign(x) { return x < 0 ? -1 : 1; }
export function fract(x) { return x - Math.floor(x); }
export function mod(x, m) { return ((x % m) + m) % m; }

// ---------- seeded random ----------
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function hash2i(x, y, seed) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((seed | 0) + 1, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export class Rng {
  constructor(seed) { this.s = (typeof seed === 'string' ? hashStr(seed) : (seed >>> 0)) || 1; }
  next() { // mulberry32
    let t = (this.s += 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  f(a = 0, b = 1) { return a + (b - a) * this.next(); }
  i(a, b) { return Math.floor(this.f(a, b + 1)); }       // inclusive
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  sign() { return this.next() < 0.5 ? -1 : 1; }
  gauss() { return (this.next() + this.next() + this.next() + this.next() - 2) / 2; } // ~N(0, 0.29)
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  fork(tag) { return new Rng((this.s ^ hashStr(String(tag))) >>> 0); }
}

// ---------- value noise (2D / 3D), smooth, in [0,1] ----------
function h3(x, y, z) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function noise2(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y); let fx = x - xi, fy = y - yi;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = h3(xi, yi, seed), b = h3(xi + 1, yi, seed), c = h3(xi, yi + 1, seed), d = h3(xi + 1, yi + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
export function fbm2(x, y, oct = 4, seed = 0) {
  let s = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { s += a * noise2(x, y, seed + i * 17); n += a; x *= 2.03; y *= 2.03; a *= 0.5; }
  return s / n;
}

// ---------- colour ----------
// '#rrggbb' or [r,g,b] 0..1 sRGB -> [r,g,b] sRGB bytes
export function rgb8(c) {
  if (typeof c === 'string') {
    let h = c.charAt(0) === '#' ? c.slice(1) : c;
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  if (Array.isArray(c)) return [Math.round(clamp01(c[0]) * 255), Math.round(clamp01(c[1]) * 255), Math.round(clamp01(c[2]) * 255)];
  return [255, 255, 255];
}
export function srgbToLin(v) { return Math.pow(v, 2.2); }
export function hexLin(c) { const b = rgb8(c); return [srgbToLin(b[0] / 255), srgbToLin(b[1] / 255), srgbToLin(b[2] / 255)]; }
export function toHex(r, g, b) { return '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
export function mixHex(a, b, t) { const A = rgb8(a), B = rgb8(b); return toHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
export function shadeHex(c, k) { const A = rgb8(c); return toHex(A[0] * k, A[1] * k, A[2] * k); }   // k<1 darker, >1 lighter
export function hsl(h, s, l) { // h in turns, s,l 0..1 -> hex
  const f = (n) => { const k = (n + h * 12) % 12; const a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
// Colour temperature in kelvin -> linear rgb (approximate, normalised so green ~1)
export function kelvin(K) {
  const t = K / 100; let r, g, b;
  if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
  else { r = 329.7 * Math.pow(t - 60, -0.1332); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; }
  const L = [srgbToLin(clamp(r, 0, 255) / 255), srgbToLin(clamp(g, 0, 255) / 255), srgbToLin(clamp(b, 0, 255) / 255)];
  const m = Math.max(L[0], L[1], L[2]);
  return [L[0] / m, L[1] / m, L[2] / m];
}

// ---------- tiny event bus ----------
export class Events {
  constructor() { this.m = new Map(); }
  on(name, fn) { let a = this.m.get(name); if (!a) this.m.set(name, a = []); a.push(fn); return () => this.off(name, fn); }
  off(name, fn) { const a = this.m.get(name); if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } }
  emit(name, data) {
    const a = this.m.get(name); if (!a) return;
    for (const fn of a.slice()) { try { fn(data); } catch (e) { console.error('[events] ' + name, e); } }
  }
}

export function fmtKwh(v) { return (Math.round(v * 100) / 100).toFixed(2); }
export function pad2(n) { return (n < 10 ? '0' : '') + n; }
