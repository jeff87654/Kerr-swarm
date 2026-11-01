/* ---------- small helpers ---------- */
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* 32-bit hash of any number of ints or strings (FNV-1a, then a final mix). */
function hash32(...parts) {
  let h = 0x811c9dc5;
  for (const p of parts) {
    const s = typeof p === "number" ? String(p | 0) + ":" : String(p) + "|";
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/* mulberry32: a small seeded generator returning floats in [0, 1). */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];

function pickN(r, arr, n) {
  const out = [];
  const used = new Set();
  let guard = 0;
  while (out.length < Math.min(n, arr.length) && guard++ < 50) {
    const i = Math.floor(r() * arr.length) % arr.length;
    if (!used.has(i)) { used.add(i); out.push(arr[i]); }
  }
  return out;
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

function fmtInt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtDur(sec) {
  sec = Math.max(0, Math.round(sec));
  if (sec < 60) return sec + " s";
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return s ? `${m} min ${s} s` : `${m} min`;
  const h = Math.floor(m / 60), mm = m % 60;
  return mm ? `${h} h ${mm} min` : `${h} h`;
}

function fmtDist(m) {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;
}

function fmtG(g) { return g.toFixed(2) + " g"; }

function fmtClock(min) {
  min = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function storeGet(k, dflt) {
  try { const v = localStorage.getItem(k); return v == null ? dflt : JSON.parse(v); } catch (e) { return dflt; }
}
function storeSet(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage may be blocked */ }
}

const reduceMotion = () => {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
};
