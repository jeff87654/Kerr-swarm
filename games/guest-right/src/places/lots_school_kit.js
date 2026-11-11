// Shared parts for the children's lots of the Low decks (the school, the play hall, the cradle arcade, the naming rooms):
// a local frame that works in (p, q) whatever side the front is on, a glazed front with a porch, children's drawings and
// numbers drawn as geometry (no text), and a few props of our own.
import { orient } from '../city/lots.js';
import { floor, ceiling, wall, lamp } from '../world/kit.js';
import { shopfront } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { doorFrame } from '../world/doors.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';

export const KIDS = ['#e2553a', '#e9b23c', '#2f7f86', '#2f3f7a', '#7cab4e', '#8a4a6a', '#d9534f', '#5fb3b3', '#f08a4b'];
export const SKIN = ['#c48a62', '#8a5a3c', '#e0b08a', '#5a3a28', '#a8714a', '#d9a27a'];

// Pick one of four (or more) alternatives by the lot's seed, so two blocks' minders do not say the same thing.
export function alt(r, list) { return list[r.i(0, list.length - 1)]; }
export function qp(params) { if (!params) return params; const o = {}; for (const k in params) { const v = params[k]; o[k] = typeof v === 'number' && k !== 'seed' ? (Math.abs(v) >= 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100) : v; } return o; }

// ---------------------------------------------------------------------------------------------------------------
// The local frame: p along the front from its low end, q inward from the front line.
// ---------------------------------------------------------------------------------------------------------------
export function local(s, lot) {
  const o = orient(lot), f = lot.front, g = s.g;
  const Pv = f === 'n' || f === 's' ? [1, 0] : [0, 1];
  const Qv = f === 'n' ? [0, 1] : f === 's' ? [0, -1] : f === 'w' ? [1, 0] : [-1, 0];
  const L = Object.assign({}, o);
  L.s = s; L.g = g; L.lot = lot; L.Pv = Pv; L.Qv = Qv;
  L.xz = (p, q) => o.P(p, q);
  // a prop's yaw (front toward +z at 0) that faces local direction (dp, dq)
  L.yaw = (dp, dq) => Math.atan2(dp * Pv[0] + dq * Qv[0], dp * Pv[1] + dq * Qv[1]);
  // the player's yaw (0 looks toward -z) looking along (dp, dq)
  L.look = (dp, dq) => Math.atan2(dp * Pv[0] + dq * Qv[0], -(dp * Pv[1] + dq * Qv[1]));
  // a world face letter for the local direction (dp, dq)
  L.face = (dp, dq) => { const wx = dp * Pv[0] + dq * Qv[0], wz = dp * Pv[1] + dq * Qv[1]; return Math.abs(wx) > Math.abs(wz) ? (wx > 0 ? 'X' : 'x') : (wz > 0 ? 'Z' : 'z'); };
  // the local direction of world +x (spinward)
  L.spin = (() => { const dp = Pv[0], dq = Qv[0]; return [dp, dq]; })();
  L.bx = (p0, q0, y0, p1, q1, y1, opts) => { const b = o.box(p0, q0, p1, q1); g.box(b[0], y0, b[1], b[2], y1, b[3], opts); };
  L.solid = (p0, q0, y0, p1, q1, y1) => { const b = o.box(p0, q0, p1, q1); s.solid(b[0], y0, b[1], b[2], y1, b[3]); };
  L.block = (p0, q0, y0, p1, q1, y1, mat, tint, opts) => { g.mat(mat, tint, opts && opts.m); L.bx(p0, q0, y0, p1, q1, y1, opts); };
  L.clip = (p0, q0, p1, q1, y1, pad) => { const b = o.box(p0, q0, p1, q1), d = pad === undefined ? 0.06 : pad; return [b[0] - d, -0.2, b[1] - d, b[2] + d, (y1 || 3.3) + 0.15, b[3] + d]; };
  L.floor = (p0, q0, p1, q1, y, mat, tint, opt) => { const b = o.box(p0, q0, p1, q1); floor(s, b[0], b[1], b[2], b[3], y, mat, tint, opt); };
  L.ceil = (p0, q0, p1, q1, y, mat, tint) => { const b = o.box(p0, q0, p1, q1); ceiling(s, b[0], b[1], b[2], b[3], y, mat, tint); };
  // a wall along p at depth q, from p0 to p1 (openings' `at` measured from p0). o2.deep / o2.shallow: the tints of its two faces.
  L.wallQ = (q, p0, p1, h, o2 = {}) => {
    const a = o.P(p0, q), b = o.P(p1, q), deepIsA = Qv[0] + Qv[1] > 0;
    const op = Object.assign({}, o2); delete op.deep; delete op.shallow;
    if (o2.deep || o2.shallow) { op.tintA = deepIsA ? (o2.deep || o2.tint) : (o2.shallow || o2.tint); op.tintB = deepIsA ? (o2.shallow || o2.tint) : (o2.deep || o2.tint); }
    wall(s, a[0], a[1], b[0], b[1], 0, h, op);
  };
  // a wall across, at p, from q0 to q1 (openings measured from q0). o2.hi / o2.lo: the faces toward higher and lower p.
  L.wallP = (p, q0, q1, h, o2 = {}) => {
    const a = o.P(p, q0), b = o.P(p, q1);
    const op = Object.assign({}, o2); delete op.hi; delete op.lo;
    if (o2.hi || o2.lo) { op.tintA = o2.hi || o2.tint; op.tintB = o2.lo || o2.tint; }
    wall(s, a[0], a[1], b[0], b[1], 0, h, op);
  };
  // props are cached for ever by their parameters, so sizes are rounded: a hundred blocks then share a handful of shapes
  L.prop = (name, p, q, y, yaw, params, opts) => { const a = o.P(p, q); return prop(s, name, a[0], y, a[1], yaw, qp(params), opts); };
  L.spot = (type, p, q, y, yaw, opts) => { const a = o.P(p, q); return s.spot(type, a[0], y, a[1], yaw, opts); };
  L.lamp = (kind, p, q, y, opts = {}) => { const a = o.P(p, q); const op = Object.assign({}, opts); if (op.toPQ) { const b = o.P(op.toPQ[0], op.toPQ[1]); op.to = [b[0], op.toPQ[2], b[1]]; delete op.toPQ; } return lamp(s, kind, a[0], y, a[1], op); };
  L.path = (pts, opts) => s.path(pts.map((pq) => o.P(pq[0], pq[1])), opts);
  L.act = (p, q, y, radius, prompt, onUse, extra) => { const a = o.P(p, q); return s.interact(Object.assign({ x: a[0], y, z: a[1], radius, prompt, onUse }, extra)); };
  L.sign = (spec, p, q, y, dp, dq, opts) => { const a = o.P(p, q); return sign(s, spec, a[0], y, a[1], Object.assign({ face: L.face(dp, dq) }, opts)); };
  L.frame = (p, q, w, h, along, opts) => { const a = o.P(p, q); const ax = (along === 'p') === (Pv[0] !== 0) ? 'x' : 'z'; return doorFrame(s, a[0], 0, a[1], w, h, ax, opts); };
  // A flat drawing surface on a wall: axis 'q' = a wall at q = c (u runs along p), 'p' = a wall at p = c (u runs along q).
  // sgn: the side it faces (+1 toward higher q or p). rect(u0, v0, u1, v1, d0, d1, opts): a box standing off the wall from d0 to d1.
  L.onWall = (axis, c, sgn) => {
    const front = axis === 'q' ? L.face(0, sgn) : L.face(sgn, 0);
    const rect = (u0, v0, u1, v1, d0, d1, opts) => { if (axis === 'q') L.bx(u0, c + sgn * d0, v0, u1, c + sgn * d1, v1, opts); else L.bx(c + sgn * d0, u0, v0, c + sgn * d1, u1, v1, opts); };
    rect.front = front;
    // does +u run to the right of somebody standing in front of this face and looking at it
    { const nx = axis === 'q' ? sgn * Qv[0] : sgn * Pv[0], nz = axis === 'q' ? sgn * Qv[1] : sgn * Pv[1], ux = axis === 'q' ? Pv[0] : Qv[0], uz = axis === 'q' ? Pv[1] : Qv[1]; rect.ltr = ux * nz - uz * nx > 0; }
    rect.flat = (u0, v0, u1, v1, d) => rect(u0, v0, u1, v1, d, d + 0.004, { faces: front });
    return rect;
  };
  return L;
}

// ---------------------------------------------------------------------------------------------------------------
// The front: a plastered street face with a plinth, a cornice, the house colours, a porch set back with a glazed front
// and a lit name over it, windows with children's drawings stuck in them.
// o: { name, sub, pal: { face, plinth, trim, accent, porchFloor }, porchW, porchD, windows: [[p0, p1]...], seed, stripe: [colours], lanterns }
// Returns { doorP, porch: [p0, p1], qIn (the line the inner face stands on) }.
// ---------------------------------------------------------------------------------------------------------------
export const QF = 0.24;            // the front wall's centre line
export async function front(L, o, tick) {
  const s = L.s, g = L.g, W = L.W, pal = o.pal, H = 3.2, r = new Rng(o.seed || 1);
  const pw = o.porchW, pp0 = o.porchAt === undefined ? (W - pw) / 2 : o.porchAt, pp1 = pp0 + pw, pd = o.porchD || 1.9;
  const wins = o.windows || [];
  const openings = [{ at: pp0, w: pw, h: 2.62 }].concat(wins.map((w) => ({ at: w[0], w: w[1] - w[0], sill: w[2] || 0.72, h: (w[3] || 2.3) - (w[2] || 0.72) })));
  L.wallQ(QF, 0, W, H, { deep: pal.inner || '#efe3c8', shallow: pal.face, dado: { h: 0.62, mat: 'tile', tint: pal.plinth }, openings });
  // the street face: a cornice, a band of colours, piers between the bays, sills and heads on every window
  s.structure(() => {
    const q0 = 0.02, q1 = QF - 0.08;
    g.mat('wood', shadeHex(pal.trim, 0.8)); L.bx(0, q0, 3.04, W, q1, 3.2, { bevel: 0.01 });
    const st = o.stripe || KIDS;
    for (let p = 0, k = 0; p < W - 0.01; p += 1.2, k++) { g.mat('paint', st[k % st.length]); L.bx(p, q0 + 0.02, 2.9, Math.min(W, p + 1.2), q1, 3.04); }
    g.mat('paint', pal.trim);
    const piers = [0, W - 0.5].concat(o.piers || []);
    for (const p of piers) L.bx(p, q0, 0, p + 0.5, q1, 2.9, { bevel: 0.012 });
    for (const w of wins) {
      const y0 = w[2] || 0.72, y1 = w[3] || 2.3;
      L.bx(w[0] - 0.1, q0 - 0.02, y0 - 0.08, w[1] + 0.1, q1, y0, { bevel: 0.01 });
      L.bx(w[0] - 0.1, q0, y1, w[1] + 0.1, q1, y1 + 0.1, { bevel: 0.008 });
      const n = Math.max(1, Math.round((w[1] - w[0]) / 1.3));
      for (let i = 1; i < n; i++) { const p = w[0] + (w[1] - w[0]) * i / n; L.bx(p - 0.035, QF - 0.12, y0, p + 0.035, QF - 0.04, y1); }
      L.bx(w[0], QF - 0.12, y0 + (y1 - y0) * 0.62 - 0.03, w[1], QF - 0.04, y0 + (y1 - y0) * 0.62 + 0.03);
    }
    // the porch's own frame: a deep lintel over its mouth
    g.mat('paint', shadeHex(pal.trim, 0.85)); L.bx(pp0 - 0.12, 0.04, 2.62, pp1 + 0.12, QF + 0.1, 3.0, { bevel: 0.012 });
  });
  for (const w of wins) { const a = L.xz(w[0], QF), b = L.xz(w[1], QF); s.glass(a[0], w[2] || 0.72, a[1], b[0], w[3] || 2.3, b[1], { opacity: 0.12 }); }
  // hand prints along the dado, in every colour, at the height of the children who made them
  s.deco(() => {
    const wf = L.onWall('q', QF - 0.08, -1);
    for (let p = 0.6; p < W - 0.6; p += r.f(0.3, 0.7)) {
      if (p > pp0 - 0.2 && p < pp1 + 0.2) continue;
      const y = r.f(0.18, 0.5), sz = r.f(0.06, 0.09); g.mat('paint', r.pick(KIDS));
      wf.flat(p - sz * 0.5, y - sz * 0.6, p + sz * 0.5, y + sz * 0.4, 0);
      for (let k = 0; k < 4; k++) wf.flat(p - sz * 0.48 + k * sz * 0.27, y + sz * 0.4, p - sz * 0.48 + k * sz * 0.27 + sz * 0.15, y + sz * (0.85 + (k === 1 || k === 2 ? 0.15 : 0)), 0);
    }
  });
  if (tick) await tick();
  // the porch: side returns, a tiled floor, a ceiling, the glazed inner front with its doors
  const qi = QF + pd;
  L.wallP(pp0, QF + 0.08, qi, H, { tint: pal.face, dado: { h: 0.62, mat: 'tile', tint: pal.plinth } });
  L.wallP(pp1, QF + 0.08, qi, H, { tint: pal.face, dado: { h: 0.62, mat: 'tile', tint: pal.plinth } });
  L.floor(pp0, 0, pp1, qi, 0, 'pattern', pal.porchFloor || '#cf8f62');
  L.ceil(pp0 + 0.08, QF, pp1 - 0.08, qi, 2.62, 'wood', shadeHex(pal.trim, 1.3));
  const c = L.lot.front === 'n' ? L.lot.z0 + qi : L.lot.front === 's' ? L.lot.z1 - qi : L.lot.front === 'w' ? L.lot.x0 + qi : L.lot.x1 - qi;
  const dw = Math.min(2.0, pw - 1.2), dAt = (pw - 0.16 - dw) / 2;
  shopfront(s, { side: L.lot.front, a0: L.a0 + pp0 + 0.08, a1: L.a0 + pp1 - 0.08, c, y: 0, h: 2.62, fasciaH: 0.3, palette: { frame: pal.trim, plinth: pal.plinth }, door: { kind: 'slide', at: dAt, w: dw, tint: pal.accent }, awning: false, lights: false, plinth: 0.4 });
  if (tick) await tick();
  // the name over the porch
  const nm = L.xz(pw / 2 + pp0, 0.025);
  sign(s, { kind: 'fascia', text: o.name, sub: o.sub, palette: o.signPal || [pal.trim, '#f6ecd6', pal.accent] }, nm[0], 2.81, nm[1], { face: L.face(0, -1), w: Math.min(pw + 0.1, 6.4), h: 0.36, glow: 0.9, board: false });
  // lanterns in the porch
  const clip = L.clip(pp0, -0.6, pp1, qi + 0.3, 2.7);
  const lc = o.lanterns || [pal.accent];
  const nl = Math.max(1, Math.min(2, Math.round(pw / 3.2)));
  for (let i = 0; i < nl; i++) L.lamp('lantern', pp0 + pw * (i + 0.5) / nl, QF + pd * 0.5, 2.2, { tint: lc[i % lc.length], clip, power: 0.75, drop: 0.35 });
  return { doorP: pp0 + pw / 2, porch: [pp0, pp1], qIn: qi, clipPorch: clip };
}

// ---------------------------------------------------------------------------------------------------------------
// Children's drawings, made of shapes: the Hollow with the far bank upside down, a table of aunts, a cab in its shaft,
// the River as somebody's aunt described it, the long table, the apple with its star, a drum and its spokes.
// wf: a wall surface from L.onWall; (u, v): the drawing's bottom-left; w, h its size.
// ---------------------------------------------------------------------------------------------------------------
const PAPER = ['#fbf3e0', '#fdeee4', '#eef4f2', '#f7f1dc', '#f1f6e6', '#eef0fa', '#fff6e8'];
export function drawing(g, wf, u, v, w, h, seed, kindIn) {
  const r = new Rng(seed), kind = kindIn === undefined ? r.i(0, 7) : kindIn;
  const dark = kind === 3 && r.chance(0.6);
  g.mat('paper', dark ? '#1d1730' : r.pick(PAPER), { rough: 0.2 });
  wf(u, v, u + w, v + h, 0, 0.006, { faces: wf.front });
  const D = 0.007; const F = (a, b, c, d, col) => { g.mat('paint', col, { rough: 0.25 }); wf.flat(u + a * w, v + b * h, u + c * w, v + d * h, D); };
  const fig = (x, y, sz, col) => { F(x - 0.04 * sz, y + 0.5 * sz, x + 0.04 * sz, y + 0.62 * sz, r.pick(SKIN)); F(x - 0.035 * sz, y + 0.18 * sz, x + 0.035 * sz, y + 0.5 * sz, col); F(x - 0.03 * sz, y, x - 0.012 * sz, y + 0.2 * sz, '#3a3a44'); F(x + 0.012 * sz, y, x + 0.03 * sz, y + 0.2 * sz, '#3a3a44'); F(x - 0.09 * sz, y + 0.42 * sz, x + 0.09 * sz, y + 0.46 * sz, col); };
  if (kind === 0) {           // the Hollow: green below curving up both sides, the sunline, the far bank overhead with its trees hanging down
    F(0.04, 0.06, 0.96, 0.22, '#7cb55a'); F(0.04, 0.22, 0.16, 0.34, '#7cb55a'); F(0.84, 0.22, 0.96, 0.34, '#7cb55a');
    F(0.04, 0.8, 0.96, 0.94, '#7cb55a'); F(0.5, 0.12, 0.72, 0.18, '#3f8fc8');
    F(0.04, 0.5, 0.96, 0.54, '#f4c430');
    for (let i = 0; i < 4; i++) { const x = 0.2 + i * 0.18; F(x - 0.01, 0.22, x + 0.01, 0.3, '#6b4a2f'); F(x - 0.04, 0.3, x + 0.04, 0.38, '#3f7a3a'); F(x - 0.01, 0.72, x + 0.01, 0.8, '#6b4a2f'); F(x - 0.04, 0.64, x + 0.04, 0.72, '#3f7a3a'); }
  } else if (kind === 1 || kind === 6) {    // the child and the table: parents and aunts in a row holding hands
    const n = 4 + r.i(0, 2);
    for (let i = 0; i < n; i++) { const x = 0.14 + 0.72 * i / (n - 1); fig(x, 0.14, i === 0 && kind === 6 ? 0.6 : 0.95, KIDS[(i * 3 + seed) % KIDS.length]); if (i < n - 1) F(x + 0.06, 0.53, x + 0.72 / (n - 1) - 0.06, 0.55, '#c48a62'); }
    F(0.08, 0.86, 0.92, 0.89, '#f4c430');
  } else if (kind === 2) {    // a cab in its shaft, going to see somebody's gran
    F(0.34, 0.04, 0.66, 0.96, '#9aa6a8'); F(0.37, 0.34, 0.63, 0.7, r.pick(['#e2553a', '#2f7f86', '#e9b23c']));
    F(0.41, 0.5, 0.59, 0.64, '#cfe8ee'); F(0.44, 0.52, 0.48, 0.58, r.pick(SKIN)); F(0.52, 0.52, 0.56, 0.58, r.pick(SKIN)); F(0.495, 0.7, 0.505, 0.96, '#3a3a44');
  } else if (kind === 3) {    // the River, as somebody's aunt described it: a band of lights right across
    if (!dark) F(0.04, 0.12, 0.96, 0.86, '#2a2236');
    for (let i = 0; i < 30; i++) { const x = r.f(0.08, 0.92), y = 0.5 + (x - 0.5) * 0.4 + r.f(-0.14, 0.14), d = r.f(0.008, 0.02); F(x - d, y - d * w / h, x + d, y + d * w / h, r.chance(0.2) ? '#f2a05a' : '#f4e6b0'); }
  } else if (kind === 4) {    // the long table curving up at both ends, everybody at it
    for (let i = 0; i < 8; i++) { const t = i / 7, x = 0.08 + 0.84 * t, y = 0.36 + 0.5 * (t - 0.5) * (t - 0.5); F(x - 0.05, y - 0.03, x + 0.06, y, '#8a5a3c'); F(x - 0.025, y + 0.02, x + 0.025, y + 0.08, r.pick(SKIN)); F(x - 0.03, y - 0.0, x + 0.03, y + 0.02, KIDS[i % KIDS.length]); }
    F(0.3, 0.8, 0.7, 0.86, '#e2553a');
  } else if (kind === 5) {    // an apple cut crosswise, with the star of seeds
    F(0.26, 0.16, 0.74, 0.84, '#d9534f'); F(0.3, 0.2, 0.7, 0.8, '#f3e7c0');
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5, x = 0.5 + Math.cos(a) * 0.1, y = 0.5 - Math.sin(a) * 0.1 * w / h; F(x - 0.025, y - 0.025, x + 0.025, y + 0.025, '#6b4a2f'); }
  } else {                    // the drum: a ring of floor, spokes, the sunline down its middle, a tiny person standing on the inside
    const n = 10;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = 0.5 + Math.cos(a) * 0.36, y = 0.5 + Math.sin(a) * 0.36 * w / h * 0.9; F(x - 0.05, y - 0.05, x + 0.05, y + 0.05, '#7cb55a'); }
    F(0.47, 0.47, 0.53, 0.53, '#f4c430'); fig(0.5, 0.06, 0.4, '#e2553a');
  }
}

// Numbers made of segments, lit: a timing board's digits. (u, v) the bottom-left of the digit, size h tall.
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
// (u, v): where the reading starts (the viewer's left) and the bottom of the digits, h tall. Reads left to right whichever
// way the wall's u runs.
export function digits(g, wf, text, u, v, h, col, glow) {
  const w = h * 0.55, t = h * 0.12; let x = 0;
  const F = (a, b, y0, y1) => { if (wf.ltr) wf.flat(u + a, y0, u + b, y1, 0.02); else wf.flat(u - b, y0, u - a, y1, 0.02); };
  g.mat('diffuser', col, { emissive: glow || 2.2, lamp: true });
  for (const ch of String(text)) {
    if (ch === '.' || ch === ':') { F(x, x + t, v, v + t); if (ch === ':') F(x, x + t, v + h * 0.6, v + h * 0.6 + t); x += t * 2.2; continue; }
    if (ch === ' ') { x += w * 0.7; continue; }
    const sg = SEG[ch] || '', H2 = h / 2;
    if (sg.includes('a')) F(x + t, x + w - t, v + h - t, v + h);
    if (sg.includes('g')) F(x + t, x + w - t, v + H2 - t / 2, v + H2 + t / 2);
    if (sg.includes('d')) F(x + t, x + w - t, v, v + t);
    if (sg.includes('f')) F(x, x + t, v + H2 + t / 2, v + h - t);
    if (sg.includes('b')) F(x + w - t, x + w, v + H2 + t / 2, v + h - t);
    if (sg.includes('e')) F(x, x + t, v + t, v + H2 - t / 2);
    if (sg.includes('c')) F(x + w - t, x + w, v + t, v + H2 - t / 2);
    x += w + t * 1.6;
  }
  return x;
}

// Felt banners hung under a high ceiling (heliox rings in a bare hall; good rooms hang felt).
export function banners(L, p0, p1, q, y, n, cols, drop) {
  const g = L.g;
  for (let i = 0; i < n; i++) {
    const p = p0 + (p1 - p0) * (i + 0.5) / n, a = L.xz(p - 0.7, q), b = L.xz(p + 0.7, q);
    g.mat('felt', cols[i % cols.length], { sway: 0.2 });
    g.sheet([a[0], y, a[1]], [b[0], y, b[1]], [b[0], y - drop, b[1]], [a[0], y - drop, a[1]], { nu: 2, nv: 2, sag: 0.02 });
    g.mat('wood', '#5b4636'); g.tube([[a[0], y + 0.02, a[1]], [b[0], y + 0.02, b[1]]], 0.02, { segs: 5 });
  }
}

// Coat pegs at three heights along a wall, with coats and satchels where the children left them.
// wf from L.onWall; rows along u from u0 to u1. Returns nothing; draws the rails and stamps the props.
export function pegs(L, axis, c, sgn, u0, u1, seed) {
  const g = L.g, s = L.s, r = new Rng(seed), wf = L.onWall(axis, c, sgn);
  s.structure(() => {
    g.mat('wood', '#8a5a34', { rough: -0.05 });
    for (const y of [0.95, 1.32, 1.7]) wf(u0, y - 0.05, u1, y + 0.05, 0, 0.03, { bevel: 0.006 });
    g.mat('wood', '#a8794f'); wf(u0, 0.28, u1, 0.33, 0, 0.36, { bevel: 0.01 });
    for (let u = u0 + 0.2; u < u1 - 0.1; u += 0.9) wf(u - 0.03, 0, u + 0.03, 0.28, 0.02, 0.34);
  });
  { const a = axis === 'q' ? L.xz(u0, c) : L.xz(c, u0), b = axis === 'q' ? L.xz(u1, c + sgn * 0.36) : L.xz(c + sgn * 0.36, u1); s.solid(Math.min(a[0], b[0]), 0, Math.min(a[1], b[1]), Math.max(a[0], b[0]), 0.33, Math.max(a[1], b[1])); }
  const yaw = axis === 'q' ? L.yaw(0, sgn) : L.yaw(sgn, 0);
  const lin = ['#e9b23c', '#e2553a', '#f6ecd6', '#7cab4e', '#d4878a', '#2f7f86'];
  const rails = [[1.7, 0.62], [1.32, 0.52], [0.95, 0.4]];
  s.deco(() => {
    for (const rl of rails) {
      for (let u = u0 + 0.25 + r.f(0, 0.2); u < u1 - 0.2; u += r.f(0.34, 0.7)) {
        if (r.chance(0.3)) continue;
        const at = axis === 'q' ? L.xz(u, c + sgn * 0.08) : L.xz(c + sgn * 0.08, u);
        const ci = r.i(0, KIDS.length - 1);
        g.at(at[0], rl[0], at[1], yaw);
        if (r.chance(0.72)) coatGeo(g, { a: KIDS[ci], lining: lin[ci % lin.length], len: rl[1], hood: ci % 2 === 0, patch: ci % 3 === 0 ? KIDS[(ci + 4) % KIDS.length] : null });
        else satchelGeo(g, { a: ['#8a5634', '#2f3f7a', '#7a2f2a', '#3d5a3a', '#c08a52'][ci % 5], badge: ci % 2 ? KIDS[ci] : null });
        g.pop();
      }
    }
  });
  // shoes under the bench
  s.detail(() => {
    for (let u = u0 + 0.2; u < u1 - 0.2; u += r.f(0.25, 0.5)) {
      if (r.chance(0.4)) continue;
      const col = r.pick(KIDS), d = r.f(0.08, 0.2);
      g.mat('weave', col); wf(u, 0, u + 0.07, 0.06, d, d + 0.15); wf(u + 0.09, 0, u + 0.16, 0.06, d, d + 0.15);
    }
  });
}

// A slate on a wall with a lesson chalked on it in shapes (a drawing of the drum, a column of figures, an arrow).
export function slate(L, axis, c, sgn, u, w, seed, lessonKind) {
  const g = L.g, r = new Rng(seed), wf = L.onWall(axis, c, sgn);
  L.s.structure(() => {
    g.mat('wood', '#6b4a2f'); wf(u - 0.06, 0.86, u + w + 0.06, 2.24, 0, 0.04, { bevel: 0.01 });
    g.mat('slate', '#1f2624', { rough: 0.2 }); wf(u, 0.92, u + w, 2.18, 0.04, 0.05);
    g.mat('wood', '#6b4a2f'); wf(u - 0.04, 0.88, u + w + 0.04, 0.93, 0.04, 0.12, { bevel: 0.006 });
  });
  L.s.deco(() => {
    const ch = (a, b, cc, d, col) => { g.mat('plain', col || '#e8e2d0', { rough: 0.6 }); wf.flat(u + a * w, 0.92 + b * 1.26, u + cc * w, 0.92 + d * 1.26, 0.052); };
    // lines of writing, as strokes
    for (let i = 0; i < 6; i++) { const y = 0.86 - i * 0.1; let x = 0.05; while (x < 0.5) { const l = r.f(0.03, 0.1); ch(x, y, x + l, y + 0.018, i === 0 ? '#f6d27a' : undefined); x += l + 0.02; } }
    if (lessonKind === 0) {        // the drum, with the floor running ahead of a dropped ball
      for (let i = 0; i < 16; i++) { const a = Math.PI * 1.15 + i / 15 * Math.PI * 0.7, x = 0.76 + Math.cos(a) * 0.2, y = 0.62 + Math.sin(a) * 0.46; ch(x - 0.008, y - 0.012, x + 0.008, y + 0.012); }
      ch(0.755, 0.6, 0.765, 0.84, '#f6d27a'); ch(0.7, 0.18, 0.76, 0.2, '#f2a48f');
    } else if (lessonKind === 1) { // a throw breaking: straight along the axis, diving spinward, sailing anti
      for (let i = 0; i < 10; i++) { const t = i / 9; ch(0.58 + t * 0.36, 0.5, 0.6 + t * 0.36, 0.52); ch(0.58 + t * 0.36, 0.5 - t * t * 0.3, 0.6 + t * 0.36, 0.52 - t * t * 0.3, '#f2a48f'); ch(0.58 + t * 0.36, 0.5 + t * t * 0.3, 0.6 + t * 0.36, 0.52 + t * t * 0.3, '#a9d8c8'); }
    } else {                       // a column of sums and a scale's dial
      for (let i = 0; i < 5; i++) { let x = 0.6; for (let k = 0; k < 4; k++) { ch(x, 0.75 - i * 0.12, x + 0.04, 0.8 - i * 0.12); x += 0.06; } }
      ch(0.6, 0.18, 0.92, 0.2, '#f6d27a');
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------
// A pram: a deep tub on four wheels with a folding hood and a push bar. p: { c, hood, lining }
defineProp('lots-school.pram', (g, p) => {
  const c = p.c || '#2f3f7a';
  g.mat('cast', '#3a3a40', { rough: -0.1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.push(); g.move(sx * 0.24, 0.13, sz * 0.3); g.rotZ(Math.PI / 2); g.cyl(0, -0.02, 0, 0.13, 0.04, { segs: 12 }); g.pop(); }
  for (const sx of [-1, 1]) g.tube([[sx * 0.24, 0.13, -0.3], [sx * 0.2, 0.42, 0], [sx * 0.24, 0.13, 0.3]], 0.012, { segs: 5 });
  g.tube([[-0.2, 0.42, 0.25], [-0.22, 0.95, 0.55], [0.22, 0.95, 0.55], [0.2, 0.42, 0.25]], 0.014, { segs: 5 });
  g.mat('weave', c); g.box(-0.22, 0.42, -0.36, 0.22, 0.78, 0.3, { bevel: 0.07 });
  g.mat('weave', p.lining || '#f1ead8'); g.box(-0.18, 0.74, -0.12, 0.18, 0.8, 0.26, { bevel: 0.03 });
  if (p.hood !== false) { g.mat('weave', shadeHex(c, 0.85)); g.ball(0, 0.78, -0.2, 0.23, 0.26, 0.2, { segs: 12, rings: 6, bottom: 0 }); }
  return { solid: [[-0.25, 0, -0.38, 0.25, 0.8, 0.4]] };
});
// A baby scale: a stand, a dished tray, a round dial. p: { c }
defineProp('lots-school.scale', (g, p) => {
  g.mat('paint', p.c || '#e9e2d0'); g.box(-0.16, 0, -0.14, 0.16, 0.12, 0.14, { bevel: 0.02 });
  g.mat('brushed', '#b9b4aa'); g.lathe(0, 0, [[0.05, 0.12], [0.2, 0.14], [0.28, 0.2], [0.27, 0.21], [0.19, 0.155], [0, 0.15]], { segs: 18 });
  g.mat('paint', p.c || '#e9e2d0'); g.push(); g.move(0, 0.07, 0.145); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.06, 0.01, { segs: 16 }); g.pop();
  g.mat('plain', '#2a2622'); g.box(-0.003, 0.07, 0.156, 0.003, 0.115, 0.158);
  return { cast: false };
});
// A soft mat, folded or flat. p: { c, w, d, h }
defineProp('lots-school.mat', (g, p) => {
  const w = p.w || 1.8, d = p.d || 1.0, h = p.h || 0.12;
  g.mat('weave', p.c || '#2f7f86'); g.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, { bevel: Math.min(0.04, h * 0.4) });
  g.mat('weave', shadeHex(p.c || '#2f7f86', 0.75)); for (let x = -w / 2 + w / 3; x < w / 2 - 0.05; x += w / 3) g.box(x - 0.01, h - 0.004, -d / 2 + 0.02, x + 0.01, h + 0.002, d / 2 - 0.02);
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], cast: false, surf: 'felt' };
});
// A climbing rope from a hook at height h, with knots. p: { h, c }
defineProp('lots-school.rope', (g, p) => {
  const h = p.h || 6;
  g.mat('cast', '#3a3a40'); g.box(-0.06, h - 0.06, -0.06, 0.06, h, 0.06);
  g.mat('weave', p.c || '#d8c49a', { sway: 0.15 });
  g.tube([[0, h, 0], [0.01, h * 0.5, 0.01], [0.03, 0.25, 0.02]], 0.034, { segs: 7 });
  g.mat('weave', p.band || '#e2553a'); for (let y = 0.9; y < h - 0.6; y += 1.1) g.tube([[0.006 + 0.02 * (1 - y / h), y, 0.01], [0.006 + 0.02 * (1 - y / h), y + 0.12, 0.01]], 0.037, { segs: 7 });
  g.mat('weave', p.c || '#d8c49a'); for (let y = 0.6; y < h - 0.6; y += 0.55) g.ball(0.01 + 0.02 * (1 - y / h), y, 0.01, 0.065, 0.075, 0.065, { segs: 8, rings: 5 });
  return { cast: false, tier: 's' };
});
// A height chart: a long painted board with bands, for measuring the small at their own deck's weight.
defineProp('lots-school.chart', (g, p) => {
  g.mat('wood', p.wood || '#e9dcc0'); g.box(-0.16, 0.3, 0, 0.16, 1.5, 0.02, { bevel: 0.006 });
  const cols = KIDS;
  for (let i = 0; i < 12; i++) { g.mat('paint', cols[i % cols.length]); g.box(-0.16, 0.3 + i * 0.1, 0.02, i % 2 ? -0.02 : 0.06, 0.3 + i * 0.1 + 0.01, 0.023); }
  return { cast: false };
});
// A lending shelf's fold: a stack of folded small clothes. p: { seed, n }
defineProp('lots-school.folds', (g, p) => {
  const r = new Rng(p.seed || 3); let y = 0;
  for (let i = 0; i < (p.n || 4); i++) { const h = r.f(0.025, 0.045); g.mat('weave', r.pick(KIDS.concat(['#f1ead8', '#d9c7a6']))); g.box(-0.13 + r.f(-0.01, 0.01), y, -0.1, 0.13 + r.f(-0.01, 0.01), y + h, 0.1, { bevel: 0.012 }); y += h; }
  return { cast: false };
});
// A low sideboard with doors. p: { w, c, top }
defineProp('lots-school.sideboard', (g, p) => {
  const w = p.w || 1.8, d = 0.48, h = 0.86, c = p.c || '#5a3a26';
  g.mat('wood', c); g.box(-w / 2, 0.1, -d / 2, w / 2, h - 0.04, d / 2, { bevel: 0.01, aoBottom: 0.6 });
  g.mat('wood', shadeHex(c, 0.7)); g.box(-w / 2 + 0.04, 0, -d / 2 + 0.05, w / 2 - 0.04, 0.1, d / 2 - 0.05);
  const n = Math.max(2, Math.round(w / 0.5));
  g.mat('wood', shadeHex(c, 1.2)); for (let i = 0; i < n; i++) { const x0 = -w / 2 + 0.05 + i * (w - 0.1) / n + 0.02, x1 = -w / 2 + 0.05 + (i + 1) * (w - 0.1) / n - 0.02; g.box(x0, 0.16, d / 2, x1, h - 0.1, d / 2 + 0.012, { bevel: 0.006 }); }
  g.mat('cast', '#c8a45a'); for (let i = 0; i < n; i++) { const x = -w / 2 + 0.05 + (i + 0.5) * (w - 0.1) / n; g.ball(x, 0.5, d / 2 + 0.025, 0.014, 0.014, 0.014, { segs: 6, rings: 4 }); }
  g.mat('wood', p.top || shadeHex(c, 1.35), { rough: -0.1 }); g.box(-w / 2 - 0.02, h - 0.04, -d / 2 - 0.01, w / 2 + 0.02, h, d / 2 + 0.02, { bevel: 0.01 });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});
// A lectern with a big book open on it. p: { wood, cloth }
defineProp('lots-school.lectern', (g, p) => {
  const wood = p.wood || '#6b4a2f';
  g.mat('wood', wood); g.box(-0.22, 0, -0.2, 0.22, 0.05, 0.2, { bevel: 0.01 }); g.box(-0.08, 0.05, -0.08, 0.08, 0.95, 0.08, { bevel: 0.01 });
  g.push(); g.move(0, 1.02, 0); g.rotX(0.35); g.box(-0.3, -0.04, -0.22, 0.3, 0.0, 0.22, { bevel: 0.01 });
  g.mat('weave', p.cloth || '#7a2f2a'); g.box(-0.27, 0.0, -0.19, 0.27, 0.03, 0.19, { bevel: 0.006 });
  g.mat('paper', '#f6efdc'); g.box(-0.25, 0.03, -0.17, -0.01, 0.05, 0.17, { bevel: 0.004 }); g.box(0.01, 0.03, -0.17, 0.25, 0.05, 0.17, { bevel: 0.004 });
  g.mat('plain', '#4a4038'); for (let i = 0; i < 9; i++) { g.box(-0.22, 0.051, -0.14 + i * 0.033, -0.04 - (i % 3) * 0.03, 0.052, -0.135 + i * 0.033); g.box(0.04, 0.051, -0.14 + i * 0.033, 0.22 - (i % 4) * 0.025, 0.052, -0.135 + i * 0.033); }
  g.mat('weave', '#c9962e'); g.box(-0.005, 0.03, -0.17, 0.005, 0.055, 0.25);
  g.pop();
  return { posts: [[0, 0, 0.18, 0, 1.1]], tier: 's' };
});
// Lean furniture for rooms full of children (the block builds while you walk, so every triangle counts).
// A double desk for two: a lid top, end frames, a shelf with two books. p: { top, frame, h, book }
function deskGeo(g, p) {
  const w = 1.15, d = 0.44, h = p.h || 0.66, top = p.top || '#b8875a';
  g.mat('wood', top, { rough: -0.06 }); g.box(-w / 2, h - 0.03, -d / 2, w / 2, h, d / 2, { bevel: 0.01 });
  g.mat('wood', shadeHex(top, 0.8)); g.box(-w / 2 + 0.03, h - 0.002, -d / 2 + 0.06, w / 2 - 0.03, h + 0.001, -d / 2 + 0.07, { faces: 'Y' });
  g.mat('paint', p.frame || '#2f7f86', { rough: -0.1 });
  for (const sx of [-1, 1]) { const x = sx * (w / 2 - 0.05); g.box(x - 0.018, 0, -d / 2 + 0.03, x + 0.018, h - 0.03, -d / 2 + 0.066, { faces: 'xXzZ' }); g.box(x - 0.018, 0, d / 2 - 0.066, x + 0.018, h - 0.03, d / 2 - 0.03, { faces: 'xXzZ' }); g.box(x - 0.02, 0, -d / 2 + 0.02, x + 0.02, 0.03, d / 2 - 0.02, { faces: 'xXzZY' }); }
  g.mat('wood', shadeHex(top, 0.9)); g.box(-w / 2 + 0.05, h - 0.17, -d / 2 + 0.04, w / 2 - 0.05, h - 0.155, d / 2 - 0.1, { faces: 'yYZ' });
  g.mat('paper', p.book || '#7a2f2a'); g.box(-0.4, h - 0.155, -0.12, -0.18, h - 0.125, 0.08, { faces: 'YZxX' }); g.mat('paper', '#2f4f6f'); g.box(0.15, h - 0.155, -0.1, 0.36, h - 0.13, 0.09, { faces: 'YZxX' });
  return [-w / 2, 0.25, -d / 2, w / 2, h, d / 2];
}
defineProp('lots-school.desk', (g, p) => ({ solid: [deskGeo(g, p)], tier: 's' }));
// A desk with its two chairs, in one: the children sit on the +z side facing -z. p: desk's, plus { c1, c2, ch }
defineProp('lots-school.deskset', (g, p) => {
  const b = deskGeo(g, p), ch = p.ch || 0.42, spots = [];
  for (const [x, c] of [[-0.29, p.c1], [0.29, p.c2]]) { g.push(); g.move(x, 0, 0.42); g.rotY(Math.PI); chairGeo(g, { c, frame: p.cf, h: ch }); g.pop(); spots.push({ type: 'sit', x, y: ch + 0.006, z: 0.4, yaw: Math.PI, low: ch < 0.38 }); }
  return { solid: [b], posts: [[-0.29, 0.42, 0.2, 0, ch], [0.29, 0.42, 0.2, 0, ch]], spots, tier: 's' };
});
// A child's chair: a ply seat and back on four painted legs. p: { c, frame, h }
function chairGeo(g, p) {
  const h = p.h || 0.42, k = h / 0.42;
  g.mat('paint', p.frame || '#3a3a3a', { rough: -0.1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.16 - 0.013, 0, sz * 0.16 - 0.013, sx * 0.16 + 0.013, h - 0.02, sz * 0.16 + 0.013, { faces: 'xXzZ' });
  for (const sx of [-1, 1]) g.box(sx * 0.16 - 0.012, h - 0.02, -0.18, sx * 0.16 + 0.012, h + 0.34 * k, -0.155, { faces: 'xXzZ' });
  g.mat('wood', p.c || '#e2553a', { rough: -0.12 }); g.box(-0.19, h - 0.02, -0.18, 0.19, h + 0.006, 0.18, { bevel: 0.01 });
  g.push(); g.move(0, h + 0.25 * k, -0.19); g.rotX(-0.1); g.box(-0.18, -0.08, -0.012, 0.18, 0.08, 0.012); g.pop();
}
defineProp('lots-school.chair', (g, p) => { chairGeo(g, p); const h = p.h || 0.42; return { posts: [[0, 0, 0.2, 0, h]], spots: [{ type: 'sit', x: 0, y: h + 0.006, z: 0.02, yaw: 0, low: h < 0.38 }] }; });
// A coat hung from a peg at the origin. p: { a, lining, len, hood, patch }
function coatGeo(g, p) {
  const L = p.len || 0.6, a = p.a || '#2f3f7a';
  g.mat('weave', a); g.sheet([-0.07, -0.02, 0.05], [0.07, -0.02, 0.05], [0.17, -L, 0.08], [-0.17, -L, 0.08], { nu: 2, nv: 2, ripple: 0.015, rippleN: 2 });
  g.box(-0.2, -L * 0.62, 0.03, -0.12, -0.08, 0.09, { faces: 'xXZ' }); g.box(0.12, -L * 0.62, 0.03, 0.2, -0.08, 0.09, { faces: 'xXZ' });
  g.mat('weave', p.lining || '#e9b23c'); g.box(-0.17, -L - 0.004, 0.03, 0.17, -L + 0.03, 0.084, { faces: 'yZ' });
  if (p.hood) { g.mat('weave', a); g.ball(0, -0.06, 0.06, 0.09, 0.08, 0.05, { segs: 6, rings: 3 }); }
  if (p.patch) { g.mat('weave', p.patch); g.box(0.03, -L * 0.6, 0.084, 0.11, -L * 0.45, 0.088, { faces: 'Z' }); }
}
defineProp('lots-school.coat', (g, p) => { coatGeo(g, p); return { cast: false }; });
// A satchel hung by its strap from a peg at the origin. p: { a, badge }
function satchelGeo(g, p) {
  g.mat('weave', p.a || '#8a5634'); g.box(-0.14, -0.42, 0.02, 0.14, -0.2, 0.1, { faces: 'xXyZ' });
  g.mat('weave', shadeHex(p.a || '#8a5634', 0.8)); g.box(-0.145, -0.31, 0.098, 0.145, -0.195, 0.108, { faces: 'xXyYZ' });
  g.box(-0.11, -0.2, 0.035, -0.095, 0, 0.045, { faces: 'xXZ' }); g.box(0.095, -0.2, 0.035, 0.11, 0, 0.045, { faces: 'xXZ' });
  if (p.badge) { g.mat('paint', p.badge); g.box(0.05, -0.38, 0.1, 0.1, -0.33, 0.104, { faces: 'Z' }); }
}
// A row of books on a shelf against a wall (wall surface from L.onWall's coordinates). Four to eight triangles a book.
const BOOKC = ['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f', '#5b4060', '#a0522d', '#2b3a4a', '#6e2f3f', '#c9a96a', '#40504a', '#d9534f', '#e9b23c', '#2f7f86'];
export function bookRow(L, axis, c, sgn, u0, u1, y, seed, hmax) {
  const g = L.g, r = new Rng(seed), wf = L.onWall(axis, c, sgn), hm = hmax || 0.26;
  const sides = ((axis === 'q') === L.alongX) ? 'xX' : 'zZ';
  let u = u0 + 0.01;
  while (u < u1 - 0.03) {
    if (r.chance(0.05)) { u += r.f(0.04, 0.1); continue; }
    const t = r.f(0.018, 0.05), h = hm * r.f(0.6, 1), d = r.f(0.15, 0.22);
    if (u + t > u1) break;
    g.mat('paper', mixHex(r.pick(BOOKC), '#e8dcc4', r.f(0, 0.25)), { rough: r.f(-0.1, 0.15) });
    wf(u, y, u + t, y + h, 0.02, 0.02 + d, { faces: wf.front + 'Y' + sides });
    u += t + 0.002;
  }
}
// Wall bars: wooden rungs between painted uprights, against a wall, for children to climb. (u0..u1 along the wall.)
export function wallBars(L, axis, c, sgn, u0, u1, h, col) {
  const g = L.g, wf = L.onWall(axis, c, sgn), n = Math.max(1, Math.round((u1 - u0) / 0.9));
  L.s.furniture(() => {
    g.mat('paint', col || '#2f7f86', { rough: -0.1 });
    for (let i = 0; i <= n; i++) { const u = u0 + (u1 - u0) * i / n; wf(u - 0.035, 0, u + 0.035, h, 0.02, 0.16); }
    g.mat('wood', '#d8b07c', { rough: -0.1 });
    for (let y = 0.2; y < h - 0.05; y += 0.16) wf(u0, y - 0.018, u1, y + 0.018, 0.07, 0.11);
  });
  const a = axis === 'q' ? L.xz(u0, c) : L.xz(c, u0), b = axis === 'q' ? L.xz(u1, c + sgn * 0.17) : L.xz(c + sgn * 0.17, u1);
  L.s.solid(Math.min(a[0], b[0]), 0, Math.min(a[1], b[1]), Math.max(a[0], b[0]), h, Math.max(a[1], b[1]));
}
// A smooth arch in the plane p = pc, spanning q0..q1, springing at ys, its top flat at yt, th thick: two faces and a soffit.
export function arch(L, pc, q0, q1, ys, yt, th, mat, tint) {
  const g = L.g, n = 14, half = (q1 - q0) / 2, rise = Math.min(half, yt - ys - 0.12), qm = (q0 + q1) / 2;
  const pt = (i) => { const a = Math.PI * i / n; return [qm - Math.cos(a) * half, ys + Math.sin(a) * rise]; };
  L.s.structure(() => {
    g.mat(mat, tint);
    for (const dp of [-th / 2, th / 2]) for (let i = 0; i < n; i++) {
      const a = pt(i), b = pt(i + 1), A = L.xz(pc + dp, a[0]), B = L.xz(pc + dp, b[0]);
      g.quad([A[0], a[1], A[1]], [B[0], b[1], B[1]], [B[0], yt, B[1]], [A[0], yt, A[1]], { double: true });
    }
    for (let i = 0; i < n; i++) {
      const a = pt(i), b = pt(i + 1), A0 = L.xz(pc - th / 2, a[0]), A1 = L.xz(pc + th / 2, a[0]), B0 = L.xz(pc - th / 2, b[0]), B1 = L.xz(pc + th / 2, b[0]);
      g.quad([A0[0], a[1], A0[1]], [A1[0], a[1], A1[1]], [B1[0], b[1], B1[1]], [B0[0], b[1], B0[1]], { double: true });
    }
  });
}
export const kitReady = true;
