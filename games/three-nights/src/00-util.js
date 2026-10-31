/* ---------- Utilities: hashing, seeded randomness, formatting, slots ---------- */
"use strict";

// 32-bit integer hash of any number of integers (murmur-style mixing).
function hash32() {
  let h = 0x9e3779b9 | 0;
  for (let i = 0; i < arguments.length; i++) {
    let k = arguments[i];
    if (typeof k === "string") k = strHash(k);
    k = Math.imul(k | 0, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = (Math.imul(h, 5) + 0xe6546b64) | 0;
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function strHash(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

// mulberry32 seeded generator with helpers
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
  r.shuffle = (arr) => {
    const a2 = arr.slice();
    for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a2[i]; a2[i] = a2[j]; a2[j] = t; }
    return a2;
  };
  r.sample = (arr, n) => r.shuffle(arr).slice(0, n);
  r.weighted = (pairs) => { // [[item, weight], ...]
    let tot = 0; for (const p of pairs) tot += p[1];
    let x = r() * tot;
    for (const p of pairs) { x -= p[1]; if (x <= 0) return p[0]; }
    return pairs[pairs.length - 1][0];
  };
  return r;
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function fmtInt(n) { return Math.round(n).toLocaleString("en-GB"); }
function fmtKwh(k) {
  if (k === 0) return "0";
  if (Math.abs(k) < 1) return k.toFixed(2).replace(/0$/, "");
  if (Math.abs(k) < 10) return k.toFixed(1).replace(/\.0$/, "");
  return Math.round(k).toLocaleString("en-GB");
}
function fmtSec(s) {
  if (s < 1) return s.toFixed(2) + " s";
  if (s < 100) return s.toFixed(1) + " s";
  return Math.round(s) + " s";
}
function pad2(n) { return (n < 10 ? "0" : "") + n; }
function fmtClock(mins) { // minutes since midnight
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  return pad2(Math.floor(m / 60)) + ":" + pad2(m % 60);
}
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function aOrAn(word) { return /^[aeiou]/i.test(word) ? "an" : "a"; }

// Fill {slot} placeholders. ctx maps slot -> string or function(rng) -> string.
function fillSlots(text, ctx, rng) {
  return text.replace(/\{([a-z0-9]+)\}/g, (m, k) => {
    const v = ctx[k];
    if (v === undefined || v === null) return m;
    return typeof v === "function" ? v(rng) : String(v);
  });
}

// Choose from a pool with a kinds filter `k` (array). kinds: e.g. ["open","hall","any"].
function kindOk(item, kinds) {
  const k = item.k;
  if (!k || !k.length) return true;
  for (const x of k) if (x === "any" || kinds.indexOf(x) >= 0) return true;
  return false;
}
function poolFor(arr, kinds) { return arr.filter((it) => kindOk(it, kinds)); }

// Small LRU cache
function makeCache(limit) {
  const m = new Map();
  return {
    get(k) { if (!m.has(k)) return undefined; const v = m.get(k); m.delete(k); m.set(k, v); return v; },
    set(k, v) { m.set(k, v); if (m.size > limit) m.delete(m.keys().next().value); return v; },
  };
}

function storageGet(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
function storageSet(key, val) { try { window.localStorage.setItem(key, val); return true; } catch (e) { return false; } }
function storageDel(key) { try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ } }

const prefersReducedMotion = (() => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
})();
