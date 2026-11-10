/* ---------- Utilities: seeded randomness, easing, formatting, storage ---------- */
"use strict";

const TAU = Math.PI * 2;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const unlerp = (a, b, x) => (x - a) / (b - a);
// smooth(a, b, x): 0 below a, 1 above b, eased between
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeIn = (t) => Math.pow(clamp(t, 0, 1), 3);
const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
// a bounce that overshoots a little and settles (for things that pop in)
const easeBack = (t) => { t = clamp(t, 0, 1); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const dist = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);
// move a toward b by at most d
const approach = (a, b, d) => (a < b ? Math.min(b, a + d) : Math.max(b, a - d));
// shortest signed angle from a to b
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

function strHash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

// mulberry32 seeded generator with helpers (same shape as the other Kerr projects)
function makeRng(seed) {
  let a = seed >>> 0;
  const r = function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.sign = () => (r() < 0.5 ? -1 : 1);
  // roughly normal, mean 0, sd 1
  r.gauss = () => (r() + r() + r() + r() + r() + r() - 3) * 1.414;
  r.shuffle = (arr) => {
    const a2 = arr.slice();
    for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a2[i]; a2[i] = a2[j]; a2[j] = t; }
    return a2;
  };
  r.sample = (arr, n) => r.shuffle(arr).slice(0, n);
  return r;
}

function pad2(n) { return (n < 10 ? "0" : "") + n; }
// seconds -> "m:ss"
function fmtMinSec(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + pad2(s % 60); }
// seconds -> "12.3"
function fmtTenths(s) { return (Math.round(s * 10) / 10).toFixed(1); }
// minutes since midnight -> "06:30"
function fmtClock(mins) { const m = ((Math.round(mins) % 1440) + 1440) % 1440; return pad2(Math.floor(m / 60)) + ":" + pad2(m % 60); }
// weight as a fraction of rim weight -> "0.73 g"
function fmtG(f) { return f.toFixed(2) + " g"; }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
const NUM_WORDS = ["none", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
function numWord(n) { return NUM_WORDS[n] || String(n); }

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function storageGet(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
function storageSet(key, val) { try { window.localStorage.setItem(key, val); return true; } catch (e) { return false; } }

const REDUCED_MOTION = (() => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
})();

// Query parameters, for local testing only (an artifact link carries none).
const QUERY = (() => {
  const q = {};
  try { new URLSearchParams(window.location.search).forEach((v, k) => { q[k] = v; }); } catch (e) { /* none */ }
  return q;
})();
