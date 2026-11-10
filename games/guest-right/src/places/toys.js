// The toy library on Ladle Row: low shelves and bright bins of toys lent free and mended between borrowers, a play mat
// with a wooden model drum that opens, a mending bench under a warm lamp, kites on the ceiling and a height chart in g.
import * as THREE from 'three';
import { wall, lamp, warm } from '../world/kit.js';
import { room, shopfront } from '../world/kit2.js';
import { prop, defineProp, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { doorFrame } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import { Rng, shadeHex } from '../core/util.js';
import { SIGNS } from '../content/signs.js';
import { MENUS } from '../content/menus.js';
import { dynMesh, every, talk, found, give, bookRow } from './studio_parts.js';

const PAL = { teal: '#2f8a85', coral: '#e8705a', saffron: '#e9b23c', leaf: '#7cab4e', indigo: '#3b4f8f', plum: '#8a4a6a', cream: '#f4ead2', plaster: '#f0dcbc', wood: '#d2ab7a', dark: '#6b4a2f' };
const BRIGHT = [PAL.teal, PAL.coral, PAL.saffron, PAL.leaf, PAL.indigo, '#d9534f', '#5fb3b3', PAL.plum];
const TRIM = [PAL.cream, '#f2d16b', '#e9e2d0', '#26306b'];
const SKIN = ['#c48a62', '#8a5a3c', '#e0b08a', '#5a3a28'];
const HAIR = ['#2a1c14', '#7a4a22', '#d8c08a', '#1b1512'];

// ---------------------------------------------------------------------------------------------------------------
// Toys. Small, real, every one a little worn. Fronts toward +z.
// ---------------------------------------------------------------------------------------------------------------

// A wooden cab: a cabin hung on two pins in a brass yoke, so it swings level when you tip it.
defineProp('toys.cab', (g, p) => {
  g.mat('wood', p.base || '#9a7048'); g.box(-0.1, 0, -0.045, 0.1, 0.014, 0.045, { bevel: 0.004 });
  g.mat('cast', '#b8924c');
  for (const sx of [-1, 1]) { g.tube([[sx * 0.092, 0.014, -0.032], [sx * 0.092, 0.104, 0], [sx * 0.092, 0.014, 0.032]], 0.0045, { segs: 5 }); g.tube([[sx * 0.093, 0.1, 0], [sx * 0.074, 0.1, 0]], 0.006, { segs: 6 }); }
  g.push(); g.move(0, 0.1, 0); g.rotX(p.tilt || 0);
  g.mat('paint', p.body || PAL.coral); g.box(-0.074, -0.078, -0.042, 0.074, 0.018, 0.042, { bevel: 0.009 });
  g.mat('paint', p.trim || PAL.cream); g.box(-0.077, 0.016, -0.045, 0.077, 0.028, 0.045, { bevel: 0.004 });
  g.mat('plain', '#26323a', { rough: -0.3 }); g.box(-0.06, -0.034, -0.0435, 0.06, 0.006, 0.0435, { faces: 'zZ' }); g.box(-0.0755, -0.034, -0.028, 0.0755, 0.006, 0.028, { faces: 'xX' });
  g.pop();
  return { cast: false };
});

// A spinning top. A top is a drum: a little painted cylinder on a point, with a spindle to twist.
function drawTop(g, a, b) {
  g.mat('wood', '#c99a62'); g.lathe(0, 0, [[0, 0], [0.01, 0.006], [0.033, 0.021]], { segs: 12, capBottom: false, capTop: false });
  g.mat('paint', a); g.lathe(0, 0, [[0.033, 0.021], [0.045, 0.025], [0.046, 0.052], [0.039, 0.058], [0.0, 0.059]], { segs: 14, capBottom: false });
  g.mat('paint', b); g.lathe(0, 0, [[0.0465, 0.033], [0.0465, 0.043]], { segs: 14, capBottom: false, capTop: false });
  g.lathe(0, 0, [[0.03, 0.0592], [0.022, 0.0592]], { segs: 14, capBottom: false, capTop: false });
  g.mat('wood', '#8a6240'); g.cyl(0, 0.058, 0, 0.006, 0.036, { segs: 6 }); g.ball(0, 0.094, 0, 0.008, 0.006, 0.008, { segs: 6, rings: 4 });
}
defineProp('toys.top', (g, p) => { drawTop(g, p.a || PAL.coral, p.b || PAL.cream); return { cast: false }; });

// A doll in a relined coat, with a shown patch. p: { coat, lining, patch, skin, hair, sit }
defineProp('toys.doll', (g, p) => {
  const oy = p.sit ? -0.075 : 0;
  g.mat('weave', p.legs || '#3a3a44');
  if (p.sit) for (const sx of [-1, 1]) g.tube([[sx * 0.019, 0.012, 0.0], [sx * 0.021, 0.012, 0.1]], 0.011, { segs: 5 });
  else for (const sx of [-1, 1]) g.tube([[sx * 0.02, 0, 0], [sx * 0.018, 0.09, 0]], 0.011, { segs: 5 });
  g.mat('leather', '#3a2a20'); for (const sx of [-1, 1]) g.ball(sx * 0.02, p.sit ? 0.012 : 0.008, p.sit ? 0.105 : 0.008, 0.013, 0.011, 0.016, { segs: 6, rings: 4 });
  g.push(); g.move(0, oy, 0);
  g.mat('weave', p.coat || PAL.teal); g.lathe(0, 0, [[0.05, 0.08], [0.046, 0.13], [0.036, 0.2], [0.03, 0.218], [0, 0.222]], { segs: 10, capBottom: true });
  g.mat('weave', p.lining || PAL.saffron); g.lathe(0, 0, [[0.0505, 0.078], [0.0505, 0.088]], { segs: 10, capBottom: false, capTop: false });
  g.mat('weave', p.patch || PAL.coral); g.box(-0.016, 0.115, 0.038, 0.014, 0.145, 0.047);
  g.mat('weave', p.coat || PAL.teal); for (const sx of [-1, 1]) g.tube([[sx * 0.03, 0.205, 0], [sx * 0.05, 0.16, 0.012], [sx * 0.052, 0.125, 0.02]], 0.011, { segs: 5 });
  g.mat('plain', p.skin || SKIN[0]); for (const sx of [-1, 1]) g.ball(sx * 0.052, 0.118, 0.022, 0.011, 0.011, 0.011, { segs: 6, rings: 4 });
  g.ball(0, 0.252, 0, 0.032, 0.033, 0.031, { segs: 10, rings: 7 });
  g.mat('knit', p.hair || HAIR[0]); g.ball(0, 0.256, -0.004, 0.035, 0.034, 0.034, { segs: 10, rings: 5, bottom: -0.05 }); g.ball(0, 0.28, -0.03, 0.017, 0.017, 0.017, { segs: 6, rings: 4 });
  g.mat('plain', '#1e1a18'); for (const sx of [-1, 1]) g.ball(sx * 0.011, 0.256, 0.029, 0.004, 0.004, 0.003, { segs: 4, rings: 3 });
  g.pop();
  return { cast: false };
});

// A stack of painted blocks. p: { seed, n }
defineProp('toys.blocks', (g, p) => {
  const r = new Rng(p.seed || 1); let y = 0; const n = p.n || 4;
  for (let i = 0; i < n; i++) {
    const s = 0.048, c = r.pick(BRIGHT); g.push(); g.move(r.f(-0.006, 0.006), y, r.f(-0.006, 0.006)); g.rotY(r.f(-0.35, 0.35));
    g.mat('paint', c); g.box(-s / 2, 0, -s / 2, s / 2, s, s / 2, { bevel: 0.004 });
    g.mat('paint', r.pick(TRIM)); g.box(-0.013, 0.011, s / 2, 0.013, 0.037, s / 2 + 0.002, { faces: 'Z' }); g.box(s / 2, 0.011, -0.013, s / 2 + 0.002, 0.037, 0.013, { faces: 'X' });
    g.pop(); y += s;
  }
  return { cast: false };
});

// A spinball: soft, scuffed, two bands round it and a mend on one side. p: { a, b, r }
defineProp('toys.ball', (g, p) => {
  const r = p.r || 0.06;
  g.mat('leather', p.a || PAL.coral, { rough: 0.1 }); g.ball(0, r, 0, r, r, r, { segs: 12, rings: 9 });
  g.mat('leather', p.b || PAL.cream); const ring = [], ring2 = [];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ring.push([Math.cos(a) * r * 1.01, r, Math.sin(a) * r * 1.01]); ring2.push([0, r + Math.cos(a) * r * 1.01, Math.sin(a) * r * 1.01]); }
  g.tube(ring, r * 0.07, { segs: 4, closed: true }); g.tube(ring2, r * 0.07, { segs: 4, closed: true });
  g.mat('felt', p.c || PAL.saffron); g.ball(r * 0.62, r * 1.45, r * 0.42, r * 0.28, r * 0.28, r * 0.14, { segs: 6, rings: 3 });
  return { cast: false };
});

// A kite hung from the ceiling on a thread, leaning back, with a patch and a ribbon tail. p: { a, b, patch, up, tail }
defineProp('toys.kite', (g, p) => {
  const lean = -0.38, cl = Math.cos(lean), sl = Math.sin(lean);
  g.push(); g.rotX(lean);
  const T = [0, 0.3, 0], L = [-0.24, 0.05, 0], R = [0.24, 0.05, 0], B = [0, -0.42, 0], C = [0, 0.05, 0];
  g.mat('weave', p.a || PAL.coral); g.quad(T, L, C, C, { double: true }); g.quad(C, B, R, R, { double: true });
  g.mat('weave', p.b || PAL.saffron); g.quad(T, C, R, R, { double: true }); g.quad(L, B, C, C, { double: true });
  g.mat('weave', p.patch || PAL.teal); g.quad([-0.14, -0.02, 0.004], [-0.04, -0.02, 0.004], [-0.04, 0.07, 0.004], [-0.14, 0.07, 0.004], { double: true });
  g.mat('wood', '#8a6240'); g.tube([[0, 0.3, -0.006], [0, -0.42, -0.006]], 0.0045, { segs: 4 }); g.tube([[-0.24, 0.05, -0.006], [0.24, 0.05, -0.006]], 0.0045, { segs: 4 });
  // the tail: a cord with bows
  const tail = []; const n = 9, len = p.tail || 0.9;
  for (let i = 0; i <= n; i++) { const t = i / n; tail.push([Math.sin(t * 5.2) * 0.06 * t, -0.42 - t * len * cl, t * len * 0.25]); }
  g.mat('weave', '#d8cdb8'); g.tube(tail, 0.002, { segs: 3, caps: false });
  for (let i = 1; i <= n; i += 2) { const q = tail[i]; g.mat('weave', i % 4 === 1 ? (p.a || PAL.coral) : (p.patch || PAL.teal)); g.quad([q[0], q[1], q[2]], [q[0] - 0.045, q[1] + 0.025, q[2]], [q[0] - 0.045, q[1] - 0.025, q[2]], [q[0] - 0.045, q[1] - 0.025, q[2]], { double: true }); g.quad([q[0], q[1], q[2]], [q[0] + 0.045, q[1] - 0.025, q[2]], [q[0] + 0.045, q[1] + 0.025, q[2]], [q[0] + 0.045, q[1] + 0.025, q[2]], { double: true }); }
  g.pop();
  const ty = 0.3 * cl, tz = 0.3 * sl;
  g.mat('weave', '#e9e2d0'); g.tube([[0, ty, tz], [0, p.up || 0.9, tz]], 0.0018, { segs: 3, caps: false });
  return { cast: false, tier: 's' };
});

// A little hand drum with a zigzag cord. p: { a }
defineProp('toys.drum', (g, p) => {
  g.mat('paint', p.a || PAL.indigo); g.lathe(0, 0, [[0.06, 0], [0.066, 0.01], [0.066, 0.062], [0.062, 0.07]], { segs: 14, capTop: false });
  g.mat('paper', '#efe2c4', { rough: -0.1 }); g.lathe(0, 0, [[0.066, 0.07], [0, 0.071]], { segs: 14, capBottom: false });
  g.mat('weave', '#e9d9b0'); const z = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; z.push([Math.cos(a) * 0.068, i % 2 ? 0.014 : 0.06, Math.sin(a) * 0.068]); }
  g.tube(z, 0.0025, { segs: 3, closed: true });
  return { cast: false };
});

// A glide car: a fat capsule with a window band, on its own wooden cradle. p: { a }
defineProp('toys.glide', (g, p) => {
  if (!p.hang) g.mat('wood', '#a07a50'); if (!p.hang) for (const sx of [-1, 1]) g.box(sx * 0.05 - 0.012, 0, -0.03, sx * 0.05 + 0.012, 0.02, 0.03, { bevel: 0.003 });
  g.mat('paint', p.a || PAL.saffron); g.ball(0, 0.052, 0, 0.1, 0.036, 0.04, { segs: 12, rings: 7 });
  g.mat('plain', '#26323a', { rough: -0.3 }); g.ball(0.015, 0.06, 0, 0.07, 0.024, 0.041, { segs: 10, rings: 5, bottom: 0.1 });
  g.mat('paint', PAL.cream); g.ball(-0.097, 0.052, 0, 0.012, 0.012, 0.012, { segs: 6, rings: 4 });
  return { cast: false };
});

// A long whistle, pitched for heliox: twice the length you expect. Lies along x. p: { a }
defineProp('toys.whistle', (g, p) => {
  const L = 0.56, r = 0.013;
  g.mat('wood', p.a || '#b8864a', { rough: -0.1 }); g.tube([[-L / 2, r, 0], [L / 2, r, 0]], r, { segs: 8 });
  g.mat('paint', PAL.coral); g.tube([[-L / 2 - 0.03, r, 0], [-L / 2 + 0.002, r, 0]], r * 0.8, { segs: 8 });
  g.mat('plain', '#2a2018'); for (let i = 0; i < 6; i++) g.box(-0.05 + i * 0.045, r * 1.9, -0.004, -0.042 + i * 0.045, r * 2.02, 0.004, { faces: 'Y' });
  return { cast: false };
});

// A wing-sleeved figure, arms out, cloth wings from wrist to hip. p: { a, b, skin }
defineProp('toys.figure', (g, p) => {
  g.mat('weave', '#3a3a44'); for (const sx of [-1, 1]) g.tube([[sx * 0.012, 0.0, 0], [sx * 0.014, 0.07, 0]], 0.008, { segs: 4 });
  g.mat('weave', p.a || PAL.indigo); g.lathe(0, 0, [[0.024, 0.065], [0.026, 0.11], [0.018, 0.15], [0, 0.152]], { segs: 8 });
  for (const sx of [-1, 1]) g.tube([[sx * 0.018, 0.142, 0], [sx * 0.07, 0.15, 0], [sx * 0.11, 0.158, 0]], 0.006, { segs: 4 });
  g.mat('weave', p.b || PAL.saffron); for (const sx of [-1, 1]) { if (sx > 0) g.quad([0.02, 0.08, 0], [0.11, 0.155, 0], [0.02, 0.145, 0], [0.02, 0.145, 0], { double: true }); else g.quad([-0.02, 0.08, 0], [-0.02, 0.145, 0], [-0.11, 0.155, 0], [-0.11, 0.155, 0], { double: true }); }
  g.mat('plain', p.skin || SKIN[1]); g.ball(0, 0.17, 0, 0.019, 0.02, 0.019, { segs: 8, rings: 5 });
  return { cast: false };
});

// A puzzle box with its picture on the lid (three colour bands: a dawn, of course). p: { a, b, c }
defineProp('toys.puzzle', (g, p) => {
  g.mat('paper', p.box || '#e9dfc9'); g.box(-0.15, 0, -0.11, 0.15, 0.045, 0.11, { bevel: 0.004 });
  const cols = [p.a || '#5b4060', p.b || '#d4878a', p.c || '#d6a640'];
  for (let i = 0; i < 3; i++) { g.mat('paper', cols[i]); g.box(-0.13, 0.045, -0.09 + i * 0.06, 0.13, 0.047, -0.03 + i * 0.06, { faces: 'Y' }); }
  return { cast: false };
});

// A bright open bin with toys heaped in it. p: { col, fill: 'balls' | 'blocks' | 'cabs' | 'mixed', seed }
defineProp('toys.bin', (g, p) => {
  const w = 0.38, d = 0.3, h = 0.2, t = 0.012, r = new Rng(p.seed || 3);
  g.mat('paint', p.col || PAL.teal, { rough: -0.1 });
  g.box(-w / 2, 0, -d / 2, w / 2, t, d / 2); g.box(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + t, { bevel: 0.004 }); g.box(-w / 2, 0, d / 2 - t, w / 2, h * 0.8, d / 2, { bevel: 0.004 });
  g.box(-w / 2, 0, -d / 2, -w / 2 + t, h, d / 2, { bevel: 0.004 }); g.box(w / 2 - t, 0, -d / 2, w / 2, h, d / 2, { bevel: 0.004 });
  g.mat('paint', shadeHex(p.col || PAL.teal, 0.75)); g.box(-0.05, h * 0.6, -d / 2 - 0.004, 0.05, h * 0.72, -d / 2, { faces: 'z' });
  const fill = p.fill || 'mixed';
  for (let i = 0; i < 9; i++) {
    const x = r.f(-w / 2 + 0.06, w / 2 - 0.06), z = r.f(-d / 2 + 0.06, d / 2 - 0.06), y = h * r.f(0.55, 0.8);
    const k = fill === 'mixed' ? r.pick(['balls', 'blocks', 'cabs']) : fill;
    g.mat(k === 'balls' ? 'leather' : 'paint', r.pick(BRIGHT));
    if (k === 'balls') g.ball(x, y, z, 0.045, 0.045, 0.045, { segs: 8, rings: 5 });
    else if (k === 'blocks') { g.push(); g.move(x, y, z); g.rotY(r.f(0, 3)); g.rotX(r.f(-0.4, 0.4)); g.box(-0.024, -0.024, -0.024, 0.024, 0.024, 0.024, { bevel: 0.004 }); g.pop(); }
    else { g.push(); g.move(x, y, z); g.rotY(r.f(0, 3)); g.box(-0.06, -0.03, -0.035, 0.06, 0.03, 0.035, { bevel: 0.008 }); g.mat('plain', '#26323a'); g.box(-0.045, 0.0, -0.036, 0.045, 0.022, 0.036, { faces: 'zZ' }); g.pop(); }
  }
  return { cast: false };
});

// A child's chair. p: { col, seat }
defineProp('toys.chair', (g, p) => {
  const c = p.col || PAL.coral, sh = 0.3;
  g.mat('paint', c, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.12, 0, sz * 0.12], [sx * 0.115, sh - 0.02, sz * 0.115]], 0.013, { segs: 5 });
  for (const sx of [-1, 1]) g.tube([[sx * 0.115, sh, -0.12], [sx * 0.12, 0.58, -0.14]], 0.013, { segs: 5 });
  g.box(-0.13, 0.46, -0.15, 0.13, 0.55, -0.125, { bevel: 0.008 });
  g.mat('wood', p.seat || '#d8b080'); g.box(-0.145, sh - 0.025, -0.14, 0.145, sh, 0.145, { bevel: 0.008 });
  return { posts: [[0, 0, 0.15, 0, 0.58]], spots: [{ type: 'sit', x: 0, y: sh, z: 0.02, yaw: 0, low: true, tags: ['small', 'kids'] }] };
});

// A child's table: round on a pedestal, or long on four legs. p: { round, w, d, top, legs }
defineProp('toys.table', (g, p) => {
  const h = 0.5, top = p.top || PAL.saffron, legs = p.legs || '#e9e2d0';
  if (p.round) {
    g.mat('paint', top, { rough: -0.1 }); g.lathe(0, 0, [[0, h - 0.03], [0.37, h - 0.03], [0.38, h - 0.015], [0.37, h], [0, h]], { segs: 22 });
    g.mat('paint', legs); g.lathe(0, 0, [[0.2, 0], [0.18, 0.025], [0.05, 0.05], [0.04, h - 0.05], [0.1, h - 0.03]], { segs: 12 });
    return { posts: [[0, 0, 0.36, 0, h]], surf: 'wood' };
  }
  const w = p.w || 0.9, d = p.d || 0.5;
  g.mat('paint', top, { rough: -0.1 }); g.box(-w / 2, h - 0.03, -d / 2, w / 2, h, d / 2, { bevel: 0.01 });
  g.mat('paint', legs); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05)], [sx * (w / 2 - 0.05), h - 0.03, sz * (d / 2 - 0.05)]], 0.018, { segs: 6 });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], surf: 'wood' };
});

// The toys that fill a shelf: prop name, width along the shelf, and parameters from a seeded random.
const TOY = {
  cab: { name: 'toys.cab', w: 0.21, p: (r) => ({ body: r.pick(BRIGHT), trim: r.pick(TRIM) }) },
  top: { name: 'toys.top', w: 0.1, p: (r) => ({ a: r.pick(BRIGHT), b: r.pick(TRIM) }) },
  doll: { name: 'toys.doll', w: 0.13, p: (r) => ({ coat: r.pick(BRIGHT), lining: r.pick(TRIM), patch: r.pick(BRIGHT), skin: r.pick(SKIN), hair: r.pick(HAIR), sit: true }) },
  blocks: { name: 'toys.blocks', w: 0.07, p: (r) => ({ seed: r.i(1, 6), n: r.i(2, 4) }) },
  ball: { name: 'toys.ball', w: 0.13, p: (r) => ({ a: r.pick(BRIGHT), b: r.pick(TRIM) }) },
  drum: { name: 'toys.drum', w: 0.15, p: (r) => ({ a: r.pick(BRIGHT) }) },
  glide: { name: 'toys.glide', w: 0.22, p: (r) => ({ a: r.pick(BRIGHT) }) },
  figure: { name: 'toys.figure', w: 0.23, p: (r) => ({ a: r.pick(BRIGHT), b: r.pick(BRIGHT), skin: r.pick(SKIN) }) },
  puzzle: { name: 'toys.puzzle', w: 0.31, p: (r) => ({ box: r.pick(['#e9dfc9', '#cfe0d8', '#f2d6c8']) }) },
};
const YAW = { Z: 0, z: Math.PI, X: Math.PI / 2, x: -Math.PI / 2 };

// A row of toys on a shelf. `c` is the back of the shelf, `face` the way the toys look ('X' = toward +x, ...).
function toyRow(s, r, kinds, a0, a1, y, c, face, o = {}) {
  const out = face === 'Z' || face === 'X' ? 1 : -1, alongX = face === 'z' || face === 'Z', yaw = YAW[face];
  let a = a0 + 0.03;
  while (a < a1 - 0.05) {
    const k = TOY[r.pick(kinds)]; const w = k.w;
    if (a + w > a1 - 0.02) break;
    const m = a + w / 2, d = c + out * (o.inset || 0.13);
    prop(s, k.name, alongX ? m : d, y, alongX ? d : m, yaw + r.f(-0.3, 0.3), k.p(r), { noCollide: true, cast: false });
    a += w + r.f(0.02, 0.09);
  }
}

// The wooden model drum: a cylinder along x, cut open so you can see the decks in rings and the green Hollow inside.
// phi is the angle round the axis: 0 at the bottom, growing toward +z. Draws [p0, p1].
function drumShell(g, cx, cy, cz, L, R, p0, p1, o = {}) {
  const P = (r, ph, x) => [x, cy - r * Math.cos(ph), cz + r * Math.sin(ph)];
  const x0 = cx - L / 2, x1 = cx + L / 2, rin = o.rin || R - 0.05, n = Math.max(3, Math.ceil((p1 - p0) / 0.22));
  for (let i = 0; i < n; i++) {
    const a = p0 + (p1 - p0) * i / n, b = p0 + (p1 - p0) * (i + 1) / n;
    g.mat('wood', o.outer || '#c08850', { rough: -0.05 }); g.quad(P(R, a, x0), P(R, a, x1), P(R, b, x1), P(R, b, x0));
    g.mat(o.innerMat || 'grass', o.inner || '#ffffff'); g.quad(P(rin, a, x0), P(rin, b, x0), P(rin, b, x1), P(rin, a, x1));
  }
  // the cut faces: decks in painted rings
  const bands = o.bands || ['#e9dcc0', PAL.teal, '#e9dcc0', PAL.coral, '#e9dcc0', PAL.saffron];
  for (const ph of [p0, p1]) {
    for (let k = 0; k < bands.length; k++) {
      const ra = rin + (R - rin) * k / bands.length, rb = rin + (R - rin) * (k + 1) / bands.length;
      g.mat('paint', bands[k]);
      if (ph === p0) g.quad(P(ra, ph, x0), P(ra, ph, x1), P(rb, ph, x1), P(rb, ph, x0)); else g.quad(P(ra, ph, x0), P(rb, ph, x0), P(rb, ph, x1), P(ra, ph, x1));
    }
  }
  // end caps: wooden sectors, the end walls, with two terrace rings stepping toward the axis
  if (o.caps !== false) {
    for (const [x, sg] of [[x0, -1], [x1, 1]]) {
      for (let i = 0; i < n; i++) {
        const a = p0 + (p1 - p0) * i / n, b = p0 + (p1 - p0) * (i + 1) / n, c = [x, cy, cz];
        g.mat('wood', o.cap || '#b07a48');
        if (sg > 0) { g.quad(c, P(R, a, x), P(R, b, x), P(R, b, x)); g.quad(c, P(R, b, x), P(R, a, x), P(R, a, x)); }
        else { g.quad(c, P(R, b, x), P(R, a, x), P(R, a, x)); g.quad(c, P(R, a, x), P(R, b, x), P(R, b, x)); }
        g.mat('paint', '#efe2c4');
        for (const rr of [rin * 0.78, rin * 0.56]) { const xi = x - sg * 0.006; g.quad(P(rr, a, xi), P(rr + 0.012, a, xi), P(rr + 0.012, b, xi), P(rr, b, xi), { double: true }); }
      }
    }
  }
}

export const place = {
  id: 'toys', name: 'The toy library', order: 52,
  build(game) {
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('toys', f);
    const g = s.g, H = 3.2, r = new Rng('toys');
    const C = [29.95, -0.2, 3.95, 40.05, H + 0.15, 14.05];
    const CS = [29.95, -0.2, 1.2, 40.05, H + 0.15, 14.05];          // lamps that spill out of the window onto the avenue

    // ---------------- shell ----------------
    room(s, { x0: 30, z0: 4, x1: 40, z1: 14, y: 0, h: H, floor: ['planks', '#c9a273'], ceil: ['paint', '#f3e9d6'],
      wall: { tint: PAL.plaster, dado: { h: 0.92, mat: 'flute', tint: PAL.teal }, skirt: '#7a5233' }, open: { n: false },
      glow: { sky: '#ffe6c4', ground: '#d9b48a', power: 0.34 } });
    // a painted band at the top of the dado, and a picture rail
    s.deco(() => {
      g.mat('paint', PAL.saffron);
      g.box(30.16, 0.92, 4.16, 30.2, 0.98, 13.84); g.box(39.8, 0.92, 4.16, 39.84, 0.98, 13.84); g.box(30.16, 0.92, 13.8, 39.84, 0.98, 13.84);
      g.mat('wood', '#8a6240'); g.box(30.16, 2.62, 4.16, 30.2, 2.66, 13.84); g.box(39.8, 2.62, 4.16, 39.84, 2.66, 13.84); g.box(30.16, 2.62, 13.8, 39.84, 2.66, 13.84);
    });
    // the pier beside the door, which carries the height chart inside and the notice outside
    wall(s, 30.16, 4.08, 31.0, 4.08, 0, H, { tintA: PAL.plaster, tintB: PAL.coral, dado: { h: 0.92, mat: 'flute', tint: PAL.teal } });
    const front = shopfront(s, { side: 'n', a0: 31.0, a1: 40, c: 4.08, y: 0, h: H, fascia: SIGNS['toys.fascia'], glow: 0.5,
      palette: { frame: '#2a6f6b', plinth: PAL.coral, awning: [PAL.saffron, PAL.cream, PAL.teal, PAL.cream] },
      door: { at: 0.15, w: 1.1, kind: 'hinge', style: 'panel', tint: '#2a6f6b' }, awning: { depth: 1.0 } });
    doorFrame(s, (front.d0 + front.d1) / 2, 0, 4.16, front.d1 - front.d0, 2.15, 'x', { tint: '#e9b23c', depth: 0.1, f: 0.06 });
    // ceiling: three beams and a teal duct along the back
    s.structure(() => {
      g.mat('wood', '#c9a070');
      for (const x of [31.9, 34.9, 37.9]) g.box(x - 0.07, H - 0.2, 4.16, x + 0.07, H, 13.84, { bevel: 0.01 });
      g.mat('paint', PAL.teal); g.tube([[30.16, 2.9, 13.35], [39.84, 2.9, 13.35]], 0.13, { segs: 12 });
      for (const x of [31, 33.5, 36, 38.5]) { g.mat('cast', '#7a6a58'); g.box(x - 0.02, 3.03, 13.3, x + 0.02, H, 13.4); g.lathe(x, 13.35, [[0.14, 2.88], [0.14, 2.92]], { segs: 12, capBottom: false, capTop: false }); }
      g.mat('cast', '#6a5e52'); g.tube([[30.3, 3.1, 4.4], [39.7, 3.1, 4.4]], 0.018, { segs: 6 });      // a conduit along the front
    });

    // ---------------- built-in: the window display, the desk, the card cabinet, the bench ----------------
    // The window platform: a long low stage inside the glass, painted saffron, with a pale wood top.
    s.furniture(() => {
      g.mat('paint', PAL.saffron); g.box(32.45, 0, 4.2, 39.76, 0.47, 4.8, { aoBottom: 0.6 });
      g.mat('paint', shadeHex(PAL.saffron, 0.8)); for (let x = 32.7; x < 39.6; x += 0.9) g.box(x, 0.08, 4.8, x + 0.7, 0.38, 4.81, { bevel: 0.006 });
      g.mat('wood', '#dcb88a', { rough: -0.1 }); g.box(32.42, 0.47, 4.17, 39.79, 0.51, 4.83, { bevel: 0.01 });
    });
    // a second, higher step at the back of it, so the toys can be seen from the avenue over the plinth
    s.furniture(() => { g.mat('paint', PAL.teal); g.box(32.45, 0.51, 4.55, 39.76, 0.8, 4.81, { aoBottom: 0.7 }); g.mat('wood', '#dcb88a', { rough: -0.1 }); g.box(32.43, 0.8, 4.53, 39.78, 0.83, 4.83, { bevel: 0.008 }); });
    s.solid(32.42, 0, 4.17, 39.79, 0.51, 4.83); s.solid(32.42, 0.51, 4.53, 39.79, 0.83, 4.83);
    // the borrowing desk
    prop(s, 'counter', 38.15, 0, 7.4, -Math.PI / 2, { w: 2.0, d: 0.62, h: 0.9, body: PAL.coral, top: '#d2ab7a' }, { noSpots: true });
    // the card cabinet behind it: a grid of little drawers with brass pulls and paper labels
    s.furniture(() => {
      g.mat('wood', '#8a6240'); g.box(39.42, 0, 6.45, 39.84, 1.25, 8.35, { bevel: 0.012 });
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
        const z0 = 6.5 + i * 0.305, y0 = 0.08 + j * 0.29;
        g.mat('wood', j % 2 ? '#a77a50' : '#9a6e46'); g.box(39.4, y0, z0 + 0.012, 39.43, y0 + 0.27, z0 + 0.29, { bevel: 0.004 });
        g.mat('paper', '#efe6d2'); g.box(39.395, y0 + 0.17, z0 + 0.09, 39.4, y0 + 0.22, z0 + 0.21, { faces: 'x' });
        g.mat('cast', '#c8a45a'); g.box(39.38, y0 + 0.09, z0 + 0.12, 39.4, y0 + 0.12, z0 + 0.18, { bevel: 0.004 });
      }
    });
    s.solid(39.42, 0, 6.45, 39.84, 1.25, 8.35);
    // on the desk: the card index box with a drawer pulled out, a stamp and its pad, the loan book, a lidded cup, a returned cab with a tag
    s.detail(() => {
      g.mat('wood', '#7a5233'); g.box(37.95, 0.9, 6.5, 38.35, 1.1, 6.95, { bevel: 0.008 });
      g.mat('wood', '#9a6e46'); for (let i = 0; i < 2; i++) g.box(37.93, 0.92 + i * 0.09, 6.53, 37.95, 0.99 + i * 0.09, 6.92, { bevel: 0.003 });
      g.mat('wood', '#9a6e46'); g.box(37.7, 0.92, 6.56, 37.95, 0.99, 6.9, { bevel: 0.003 });        // the drawer, pulled out
      g.mat('paper', '#f4ecd8'); for (let i = 0; i < 9; i++) g.box(37.72 + i * 0.024, 0.93, 6.6, 37.725 + i * 0.024, 1.03 - (i % 3) * 0.01, 6.86);
      g.mat('paper', PAL.coral); g.box(37.86, 0.93, 6.6, 37.865, 1.05, 6.86);
      g.mat('cast', '#c8a45a'); g.box(37.92, 0.94, 6.7, 37.93, 0.96, 6.76);
      // stamp and pad
      g.mat('weave', '#26306b'); g.box(38.0, 0.9, 7.08, 38.16, 0.915, 7.2, { bevel: 0.003 });
      g.mat('wood', '#5b3a24'); g.lathe(38.25, 7.14, [[0.025, 0.9], [0.025, 0.93], [0.012, 0.94], [0.012, 0.99], [0.02, 1.0], [0.02, 1.03], [0, 1.035]], { segs: 10 });
      // the loan book, open
      g.mat('leather', '#3b4f8f'); g.box(37.92, 0.9, 7.35, 38.32, 0.91, 7.85, { bevel: 0.003 });
      g.mat('paper', '#f4ecd8'); g.box(37.94, 0.91, 7.37, 38.3, 0.925, 7.6, { bevel: 0.003 }); g.box(37.94, 0.91, 7.61, 38.3, 0.925, 7.83, { bevel: 0.003 });
      g.mat('plain', '#5a5048'); for (let i = 0; i < 7; i++) { g.box(37.98 + i * 0.04, 0.926, 7.4, 37.99 + i * 0.04, 0.927, 7.57, { faces: 'Y' }); g.box(37.98 + i * 0.04, 0.926, 7.64, 37.99 + i * 0.04, 0.927, 7.8, { faces: 'Y' }); }
      // a desk lamp: a teal enamel shade on a jointed arm
      g.mat('cast', '#2a6f6b'); g.cyl(38.3, 0.9, 8.15, 0.07, 0.025, { segs: 12 }); g.tube([[38.3, 0.92, 8.15], [38.28, 1.22, 8.05], [38.05, 1.38, 7.95]], 0.008, { segs: 5 });
      g.lathe(38.0, 7.93, [[0.08, 1.24], [0.06, 1.3], [0.025, 1.36], [0.02, 1.4]], { segs: 12, capBottom: false });
    });
    prop(s, 'cup', 38.25, 0.9, 6.35, 0, { glaze: PAL.teal, lid: PAL.cream });
    prop(s, 'toys.cab', 38.1, 0.9, 8.05, -1.2, { body: PAL.leaf, trim: PAL.cream, tilt: 0.25 }, { noCollide: true });
    s.deco(() => { g.mat('paper', '#f2e6c4'); g.quad([38.04, 0.95, 8.12], [38.04, 0.95, 8.2], [38.0, 0.88, 8.22], [38.0, 0.88, 8.14], { double: true }); });
    // on top of the cabinet: returns waiting their turn on the bench, each with a paper tag
    toyRow(s, r.fork('ret'), ['cab', 'doll', 'drum', 'glide'], 6.5, 8.3, 1.25, 39.84, 'x', { inset: 0.18 });
    // basket of spinballs by the door
    s.furniture(() => {
      g.mat('cane', '#c9a46a'); g.lathe(39.15, 5.4, [[0.2, 0], [0.24, 0.05], [0.27, 0.35], [0.28, 0.38], [0.255, 0.38], [0.24, 0.1], [0, 0.08]], { segs: 18 });
      g.mat('wood', '#7a5233'); g.tube([[39.15 - 0.27, 0.36, 5.4], [39.15 - 0.2, 0.62, 5.4], [39.15 + 0.2, 0.62, 5.4], [39.15 + 0.27, 0.36, 5.4]], 0.012, { segs: 6 });
    });
    s.post(39.15, 5.4, 0.28, 0, 0.62);
    for (let i = 0; i < 7; i++) { const a = i * 2.4, rr = i ? 0.13 : 0; prop(s, 'toys.ball', 39.15 + Math.cos(a) * rr, 0.24 + (i % 3) * 0.04, 5.4 + Math.sin(a) * rr, a, { a: BRIGHT[i % BRIGHT.length], b: TRIM[i % 3] }, { noCollide: true }); }
    sign(s, { kind: 'label', text: 'Spinballs', lines: ['take one, bring it back'] }, 39.15, 0.5, 5.12, { face: 'z', w: 0.34, h: 0.1 });

    // The mending bench along the back wall, under its own warm lamp.
    s.furniture(() => {
      g.mat('wood', '#b98a58', { rough: -0.08 }); g.box(35.4, 0.86, 13.18, 39.6, 0.92, 13.84, { bevel: 0.012 });
      g.mat('wood', '#7a5233'); for (const x of [35.5, 37.5, 39.5]) g.box(x - 0.04, 0, 13.25, x + 0.04, 0.86, 13.8, { bevel: 0.006 });
      g.mat('wood', '#9a6e46'); g.box(35.45, 0.18, 13.3, 39.55, 0.21, 13.82);
      g.mat('paint', '#a8895c'); g.box(35.5, 1.1, 13.82, 39.5, 2.06, 13.84, { faces: 'z' });                  // the tool board: pegboard on a dark backing
      g.mat('grille', '#dcc79c'); g.quad([35.5, 1.1, 13.81], [39.5, 1.1, 13.81], [39.5, 2.06, 13.81], [35.5, 2.06, 13.81], { double: true });
      g.mat('wood', '#8a6240'); g.box(35.45, 1.06, 13.79, 39.55, 1.1, 13.84); g.box(35.45, 2.06, 13.79, 39.55, 2.1, 13.84);
      g.mat('wood', '#b98a58'); g.box(35.5, 2.18, 13.6, 39.5, 2.21, 13.84, { bevel: 0.006 });                   // the glue shelf
    });
    s.solid(35.4, 0, 13.18, 39.6, 0.92, 13.84);
    prop(s, 'crate', 36.3, 0.21, 13.55, 0, { w: 0.55, h: 0.3, d: 0.4, wood: '#c0965e' });
    prop(s, 'crate', 38.6, 0.21, 13.55, 0, { w: 0.55, h: 0.3, d: 0.4, wood: '#a88052' });
    prop(s, 'stool', 37.4, 0, 12.75, 0, { h: 0.62, wood: '#8a6240' });
    s.detail(() => {
      // tiny clamps on pegs, scissors, brushes, spools of bright thread
      for (let i = 0; i < 8; i++) {
        const x = 35.7 + i * 0.13, y = 1.75; g.mat('cast', i % 2 ? '#b03a2e' : '#c8a45a');
        g.tube([[x, y, 13.8], [x, y, 13.76], [x, y - 0.12, 13.76], [x + 0.05, y - 0.12, 13.76]], 0.006, { segs: 4 });
        g.mat('wood', '#5b3a24'); g.tube([[x + 0.05, y - 0.12, 13.76], [x + 0.05, y - 0.04, 13.76]], 0.008, { segs: 5 });
      }
      for (let i = 0; i < 9; i++) { const x = 37.0 + i * 0.12; g.mat('cast', '#7a6a58'); g.tube([[x, 1.55, 13.84], [x, 1.55, 13.76]], 0.004, { segs: 4 }); g.mat('weave', BRIGHT[i % BRIGHT.length]); g.cyl(x, 1.48, 13.76 - 0.002, 0.022, 0.06, { segs: 8 }); }
      g.mat('cast', '#9a9288'); g.tube([[38.3, 1.9, 13.78], [38.42, 1.72, 13.78], [38.36, 1.62, 13.78]], 0.006, { segs: 4 }); g.tube([[38.42, 1.9, 13.78], [38.3, 1.72, 13.78], [38.36, 1.62, 13.78]], 0.006, { segs: 4 });
      for (let i = 0; i < 5; i++) { const x = 38.7 + i * 0.13; g.mat('wood', '#c9a070'); g.tube([[x, 1.35, 13.78], [x, 1.62, 13.78]], 0.007, { segs: 4 }); g.mat('weave', '#3a2a20'); g.cyl(x, 1.62, 13.78, 0.012, 0.05, { segs: 6, r1: 0.006 }); }
      // glue pots and jars on the shelf
      for (let i = 0; i < 9; i++) {
        const x = 35.65 + i * 0.42; g.mat('glaze', [PAL.teal, '#e9e1cf', PAL.coral, '#8a5a3c'][i % 4]);
        g.lathe(x, 13.72, [[0, 2.21], [0.05, 2.21], [0.055, 2.3], [0.045, 2.33], [0.048, 2.35], [0, 2.35]], { segs: 10 });
        if (i % 2) { g.mat('wood', '#c9a070'); g.tube([[x, 2.3, 13.72], [x + 0.02, 2.48, 13.7]], 0.005, { segs: 4 }); }
      }
      // on the bench: the wooden cab with its cabin out of the yoke, a doll on her ninth mend with an arm off, a kite stick in a clamp
      g.mat('weave', '#e9e2d0'); g.box(36.3, 0.92, 13.3, 37.1, 0.925, 13.7);                                   // a cloth to work on
      g.mat('cast', '#c8a45a'); g.tube([[36.48, 0.94, 13.5], [36.48, 1.02, 13.5]], 0.005, { segs: 4 }); g.tube([[36.66, 0.94, 13.5], [36.66, 1.02, 13.5]], 0.005, { segs: 4 });
      g.mat('wood', '#9a7048'); g.box(36.47, 0.925, 13.45, 36.67, 0.94, 13.55, { bevel: 0.004 });
      g.push(); g.move(36.9, 0.965, 13.5); g.rotZ(1.45); g.mat('paint', '#3b4f8f'); g.box(-0.04, -0.074, -0.042, 0.04, 0.074, 0.042, { bevel: 0.009 }); g.mat('plain', '#26323a'); g.box(-0.035, -0.06, -0.0435, 0.004, 0.06, 0.0435, { faces: 'zZ' }); g.pop();
      g.mat('cast', '#8a8278'); for (const x of [36.38, 36.5]) g.box(x, 0.925, 13.68, x + 0.07, 0.928, 13.7);
      // the lamp: an enamel shade on a cord from the duct
      g.mat('weave', '#2a2420'); g.tube([[37.5, 2.77, 13.4], [37.5, 1.72, 13.4]], 0.005, { segs: 4, caps: false });
      g.mat('cast', '#2f6f4a'); g.lathe(37.5, 13.4, [[0.2, 1.55], [0.16, 1.6], [0.08, 1.68], [0.04, 1.72]], { segs: 16, capBottom: false });
      g.mat('diffuser', '#ffd9a0', { emissive: 4, lamp: true }); g.ball(37.5, 1.58, 13.4, 0.05, 0.05, 0.05, { segs: 8, rings: 5 });
    });
    prop(s, 'toys.doll', 37.9, 0.92, 13.45, 0.3, { coat: PAL.plum, lining: PAL.saffron, patch: PAL.leaf, skin: SKIN[2], hair: HAIR[1], sit: true }, { noCollide: true });
    s.detail(() => { g.mat('weave', PAL.plum); g.tube([[38.12, 0.935, 13.42], [38.24, 0.935, 13.36]], 0.011, { segs: 5 }); g.mat('plain', SKIN[2]); g.ball(38.25, 0.935, 13.355, 0.011, 0.011, 0.011, { segs: 6, rings: 4 }); });
    prop(s, 'crock', 38.6, 0.92, 13.55, 0, { glaze: '#e9e1cf', h: 0.14, r: 0.06 });
    prop(s, 'crock', 35.8, 0.92, 13.6, 0, { glaze: PAL.teal, h: 0.12, r: 0.05 });
    // a kite with a new stick being glued in, held by two clamps; a box of paper tags; a tray of pins
    s.detail(() => {
      g.push(); g.move(35.85, 0.93, 13.38); g.rotY(-0.15); g.rotX(-Math.PI / 2);
      g.mat('weave', PAL.coral); g.quad([0, 0.3, 0], [-0.22, 0.05, 0], [0, 0.05, 0], [0, 0.05, 0], { double: true }); g.quad([0, 0.05, 0], [0, -0.38, 0], [0.22, 0.05, 0], [0.22, 0.05, 0], { double: true });
      g.mat('weave', PAL.cream); g.quad([0, 0.3, 0], [0, 0.05, 0], [0.22, 0.05, 0], [0.22, 0.05, 0], { double: true }); g.quad([-0.22, 0.05, 0], [0, -0.38, 0], [0, 0.05, 0], [0, 0.05, 0], { double: true });
      g.mat('wood', '#e0c08a'); g.tube([[0, 0.3, -0.006], [0, -0.38, -0.006]], 0.005, { segs: 4 });
      g.mat('cast', '#b03a2e'); for (const yy of [0.15, -0.15]) g.box(-0.02, yy - 0.012, -0.03, 0.02, yy + 0.012, 0.02);
      g.pop();
      g.mat('wood', '#c9a070'); g.box(38.95, 0.92, 13.5, 39.25, 1.0, 13.72, { bevel: 0.004 });
      g.mat('paper', '#f2e6c4'); for (let i = 0; i < 8; i++) g.box(38.98 + i * 0.033, 0.95, 13.53, 38.995 + i * 0.033, 1.04 - (i % 3) * 0.01, 13.69);
      g.mat('brushed', '#8a8278'); g.cyl(39.35, 0.92, 13.3, 0.06, 0.02, { segs: 10 });
      // a magnifier on an arm, clamped to the bench edge
      g.mat('cast', '#3a4a45'); g.box(36.0, 0.86, 13.18, 36.06, 0.95, 13.22); g.tube([[36.03, 0.95, 13.2], [36.03, 1.25, 13.25], [36.25, 1.32, 13.3]], 0.008, { segs: 5 });
      g.lathe(36.3, 13.3, [[0.065, 1.29], [0.065, 1.31]], { segs: 14, capBottom: false, capTop: false });
      g.mat('diffuser', '#e8f2f0', { rough: -0.4 }); g.cyl(36.3, 1.295, 13.3, 0.06, 0.01, { segs: 14 });
    });
    prop(s, 'toys.whistle', 39.0, 0.92, 13.35, 0.2, { a: '#b8864a' }, { noCollide: true });

    // ---------------- shelves round the walls ----------------
    // West wall: five low units (front toward +x), each with its own sort of toy, and taller things on top.
    const binFill = ['balls', 'blocks', 'cabs', 'mixed', 'balls', 'cabs'], binLabel = { balls: 'Balls', blocks: 'Blocks', cabs: 'Cabs and cars', mixed: 'Bits' };
    const westKinds =[['cab', 'glide'], ['doll', 'figure'], ['top', 'drum', 'blocks'], ['ball', 'blocks', 'top'], ['puzzle', 'drum', 'cab']];
    for (let i = 0; i < 5; i++) {
      const z = 5.65 + i * 1.2;
      prop(s, 'shelving', 30.34, 0, z, Math.PI / 2, { w: 1.2, h: 1.05, d: 0.36, shelves: 2, wood: '#d2ab7a' });
      if (i % 2 === 0) { for (let k = -1; k <= 1; k++) { const zz = z + k * 0.39, n = i * 3 + k + 1, fill = binFill[(n + 1) % binFill.length]; prop(s, 'toys.bin', 30.34, 0.105, zz, Math.PI / 2, { col: BRIGHT[(n * 5 + 1) % BRIGHT.length], fill, seed: n % 4 }, { noCollide: true, cast: false }); s.deco(() => { g.mat('paper', '#f4ecd8'); g.box(30.492, 0.205, zz - 0.09, 30.497, 0.265, zz + 0.09, { faces: 'X' }); }); sign(s, { kind: 'label', text: binLabel[fill] }, 30.5, 0.235, zz, { face: 'X', w: 0.17, h: 0.05 }); } }
      else toyRow(s, r.fork('w' + i), westKinds[i], z - 0.58, z + 0.58, 0.105, 30.16, 'X', { inset: 0.15 });
      toyRow(s, r.fork('v' + i), westKinds[(i + 2) % 5], z - 0.58, z + 0.58, 0.575, 30.16, 'X', { inset: 0.15 });
    }
    // on top of the west units: a plant under the lamp, a stack of puzzles, model drums for lending, a whistle
    prop(s, 'plant', 30.36, 1.045, 7.3, 0, { kind: 'broad', size: 0.7, pot: PAL.coral });
    prop(s, 'plant', 30.36, 1.045, 10.6, 0, { kind: 'fern', size: 0.6, pot: PAL.teal });
    for (let i = 0; i < 3; i++) prop(s, 'toys.puzzle', 30.36, 1.045 + i * 0.047, 5.5, Math.PI / 2 + i * 0.12, { box: ['#e9dfc9', '#cfe0d8', '#f2d6c8'][i], a: BRIGHT[i], b: '#d4878a', c: '#d6a640' }, { noCollide: true });
    prop(s, 'toys.whistle', 30.38, 1.045, 8.6, Math.PI / 2, { a: '#9a6e46' }, { noCollide: true });
    prop(s, 'toys.drum', 30.36, 1.045, 9.5, 0, { a: PAL.coral }, { noCollide: true });
    prop(s, 'toys.top', 30.4, 1.045, 6.3, 0, { a: PAL.teal, b: PAL.saffron }, { noCollide: true });
    prop(s, 'toys.top', 30.33, 1.045, 6.45, 0, { a: PAL.saffron, b: '#26306b' }, { noCollide: true });
    // a high narrow shelf above them for the wing-sleeved figures, and pegs for the long whistles
    s.furniture(() => { g.mat('wood', '#b98a58'); g.box(30.16, 1.9, 5.0, 30.36, 1.93, 11.0, { bevel: 0.006 }); g.mat('cast', '#8a6d3b'); for (let z = 5.3; z < 11; z += 1.2) g.box(30.16, 1.84, z - 0.01, 30.32, 1.9, z + 0.01); });
    for (let i = 0; i < 9; i++) prop(s, 'toys.figure', 30.27, 1.93, 5.35 + i * 0.64, Math.PI / 2 + (i % 2 ? 0.2 : -0.2), { a: BRIGHT[i % BRIGHT.length], b: BRIGHT[(i + 3) % BRIGHT.length], skin: SKIN[i % 4] }, { noCollide: true });
    s.detail(() => {
      for (let i = 0; i < 6; i++) { const z = 5.6 + i * 0.18; g.mat('wood', ['#b8864a', '#9a6e46', '#c9a070'][i % 3]); g.tube([[30.22, 2.5, z], [30.22, 1.97, z]], 0.012, { segs: 6 }); g.mat('paint', BRIGHT[i]); g.tube([[30.22, 2.53, z], [30.22, 2.49, z]], 0.011, { segs: 6 }); }
    });
    // East wall: three units of bright bins (front toward -x), labelled.
    for (let i = 0; i < 3; i++) {
      const z = 9.65 + i * 1.3;
      prop(s, 'shelving', 39.64, 0, z, -Math.PI / 2, { w: 1.3, h: 0.95, d: 0.4, shelves: 2, wood: '#d2ab7a', back: true });
      for (let row = 0; row < 2; row++) for (let k = -1; k <= 1; k++) {
        const y = row ? 0.525 : 0.105, zz = z + k * 0.41, n = i * 6 + row * 3 + k + 1, fill = binFill[n % binFill.length];
        prop(s, 'toys.bin', 39.64, y, zz, -Math.PI / 2, { col: BRIGHT[(n * 3) % BRIGHT.length], fill, seed: n % 4 }, { noCollide: true, cast: false });
        s.deco(() => { g.mat('paper', '#f4ecd8'); g.box(39.483, y + 0.1, zz - 0.09, 39.488, y + 0.16, zz + 0.09, { faces: 'x' }); });
        sign(s, { kind: 'label', text: binLabel[fill] }, 39.478, y + 0.13, zz, { face: 'x', w: 0.17, h: 0.05 });
      }
    }
    toyRow(s, r.fork('etop'), ['puzzle', 'drum', 'glide', 'cab'], 9.05, 12.85, 0.945, 39.84, 'x', { inset: 0.2 });
    prop(s, 'plant', 39.62, 0.945, 12.65, 0, { kind: 'flower', size: 0.55, pot: PAL.saffron });
    // Back wall, west half: four tall units of picture books, puzzles and dolls (front toward -z).
    for (let i = 0; i < 4; i++) {
      const x = 30.85 + i * 1.2;
      prop(s, 'shelving', x, 0, 13.68, Math.PI, { w: 1.2, h: 1.8, d: 0.32, shelves: 4, wood: '#d2ab7a' });
      const ys = [0.105, 0.5275, 0.95, 1.3725, 1.795];
      for (let k = 0; k < 4; k++) {
        const y = ys[k], mode = (i + k) % 4;
        if (mode === 0) { s.detail(() => bookRow(g, x - 0.57, x + 0.57, y, 13.83, 'z', { hmax: 0.32, depth: 0.22, seed: i * 7 + k, cols: ['#e8705a', '#2f8a85', '#e9b23c', '#7cab4e', '#3b4f8f', '#d9534f', '#f2d16b', '#8a4a6a'] })); }
        else if (mode === 1) { for (let j = 0; j < 3; j++) for (let q = 0; q < 2 + (j % 2); q++) prop(s, 'toys.puzzle', x - 0.38 + j * 0.38, y + q * 0.047, 13.66, Math.PI + r.f(-0.1, 0.1), { box: ['#e9dfc9', '#cfe0d8', '#f2d6c8'][(j + q) % 3], a: BRIGHT[(i + j + q) % 8], b: '#d4878a', c: '#d6a640' }, { noCollide: true }); }
        else toyRow(s, r.fork('b' + i + k), mode === 2 ? ['doll', 'doll', 'figure'] : ['drum', 'top', 'blocks', 'cab'], x - 0.58, x + 0.58, y, 13.84, 'z', { inset: 0.14 });
      }
      toyRow(s, r.fork('btop' + i), ['drum', 'glide', 'puzzle'], x - 0.58, x + 0.58, 1.795, 13.84, 'z', { inset: 0.14 });
    }

    // ---------------- the play mat, the model drum, the top's dish ----------------
    s.detail(() => {
      g.mat('motif', PAL.teal); g.box(33.3, 0.004, 8.6, 36.7, 0.016, 11.8, { faces: 'YxXzZ' });
      g.mat('weave', PAL.saffron); g.box(33.3, 0.004, 8.6, 36.7, 0.019, 8.72, { faces: 'Y' }); g.box(33.3, 0.004, 11.68, 36.7, 0.019, 11.8, { faces: 'Y' });
      g.box(33.3, 0.004, 8.6, 33.42, 0.019, 11.8, { faces: 'Y' }); g.box(36.58, 0.004, 8.6, 36.7, 0.019, 11.8, { faces: 'Y' });
      g.mat('weave', PAL.coral); g.box(35.6, 0.004, 9.0, 36.1, 0.021, 9.45, { faces: 'Y' });              // a mend in the mat, shown
    }, 0);
    // the model drum: lies along x on two cradles, open toward the front so you can see the decks and the green Hollow
    const MD = { cx: 35.2, cz: 10.4, L: 1.2, R: 0.33 }; MD.cy = 0.1 + MD.R;
    const OPEN0 = -0.75, OPEN1 = 3.35;
    s.furniture(() => {
      g.mat('wood', '#7a5233'); for (const sx of [-1, 1]) { const x = MD.cx + sx * (MD.L / 2 - 0.12); g.box(x - 0.035, 0.012, MD.cz - 0.17, x + 0.035, 0.16, MD.cz + 0.17, { bevel: 0.01 }); }
      drumShell(g, MD.cx, MD.cy, MD.cz, MD.L, MD.R, OPEN0, OPEN1, { rin: MD.R - 0.05, innerMat: 'paint', inner: '#8cbf5a' });
      // lake, lawns and orchards on the inside (trees grow toward the axis)
      const P = (rr, ph, x) => [x, MD.cy - rr * Math.cos(ph), MD.cz + rr * Math.sin(ph)], rin = MD.R - 0.052;
      const patch = (ph0, ph1, xa, xb, col, mat) => { g.mat(mat || 'plain', col, { rough: mat ? 0 : -0.35 }); const n = 4; for (let i = 0; i < n; i++) { const a = ph0 + (ph1 - ph0) * i / n, b = ph0 + (ph1 - ph0) * (i + 1) / n; g.quad(P(rin, a, xa), P(rin, b, xa), P(rin, b, xb), P(rin, a, xb)); } };
      patch(-0.35, 0.3, MD.cx - 0.2, MD.cx + 0.08, '#3d7fa6');
      patch(0.5, 1.2, MD.cx - 0.3, MD.cx + 0.3, '#a8cf6a', 'paint');
      patch(2.6, 3.2, MD.cx - 0.25, MD.cx + 0.15, '#3d7fa6');
      g.mat('paint', '#3f7a3a');
      for (let i = 0; i < 40; i++) { const ph = r.f(1.3, 3.2), x = r.f(MD.cx - 0.36, MD.cx + 0.36); const q = P(rin - 0.012, ph, x); g.ball(q[0], q[1], q[2], 0.018, 0.018, 0.018, { segs: 5, rings: 3 }); }
      // the sunline down the axis, short of each end wall, and the brass pins it turns on
      g.mat('cast', '#c8a45a'); g.tube([[MD.cx - MD.L / 2 - 0.05, MD.cy, MD.cz], [MD.cx - MD.L / 2 + 0.06, MD.cy, MD.cz]], 0.008, { segs: 6 }); g.tube([[MD.cx + MD.L / 2 - 0.06, MD.cy, MD.cz], [MD.cx + MD.L / 2 + 0.05, MD.cy, MD.cz]], 0.008, { segs: 6 });
      g.mat('diffuser', '#fff1cc', { emissive: 3 }); g.tube([[MD.cx - MD.L / 2 + 0.1, MD.cy, MD.cz], [MD.cx + MD.L / 2 - 0.1, MD.cy, MD.cz]], 0.004, { segs: 5 });
    });
    s.solid(MD.cx - MD.L / 2 - 0.05, 0, MD.cz - MD.R, MD.cx + MD.L / 2 + 0.05, MD.cy + MD.R, MD.cz + MD.R);
    // the lid: the cut-away piece, either lying open beside the drum or closed over it
    const lidOpen = dynMesh(s, [MD.cx, 0.1, MD.cz + 0.78], (q) => drumShell(q, MD.cx, MD.R + 0.012, MD.cz + 0.78, MD.L, MD.R, -1.09, 1.09, { rin: MD.R - 0.016, inner: '#e9dcc0', innerMat: 'paint', caps: false, bands: ['#e9dcc0', PAL.teal, PAL.coral] }), { radius: 0.8 });
    const lidShut = dynMesh(s, [MD.cx, MD.cy, MD.cz], (q) => drumShell(q, MD.cx, MD.cy, MD.cz, MD.L, MD.R, OPEN1, Math.PI * 2 + OPEN0, { rin: MD.R - 0.016, inner: '#e9dcc0', innerMat: 'paint', bands: ['#e9dcc0', PAL.teal, PAL.coral] }), { radius: 0.8, hidden: true });
    // the top's dish, and the top that spins in it
    const TD = [34.0, 0, 9.35];
    s.detail(() => { g.mat('wood', '#c9925a', { rough: -0.1 }); g.lathe(TD[0], TD[2], [[0.0, 0.016], [0.17, 0.016], [0.2, 0.055], [0.19, 0.062], [0.16, 0.038], [0.0, 0.034]], { segs: 22, capBottom: false, capTop: false }); });
    const topMesh = dynMesh(s, [TD[0], 0.034, TD[2]], (q) => { q.push(); q.move(TD[0], 0.034, TD[2]); drawTop(q, PAL.coral, PAL.cream); q.pop(); }, { radius: 0.3 });
    const spin = { t: 0, ang: 0, w: 0, tilt: 0.42, prec: 0.6, dirty: true };
    const M1 = new THREE.Matrix4(), M2 = new THREE.Matrix4(), AX = new THREE.Vector3();
    every(s, (dt) => {
      if (spin.t > 0) {
        spin.t = Math.max(0, spin.t - dt); const k = spin.t / 7;            // 1 at the start, 0 when it falls
        spin.w = 6 + 50 * k; spin.ang += spin.w * dt; spin.prec += (1.5 + 5 * (1 - k)) * dt;
        spin.tilt = k > 0.12 ? 0.02 + 0.2 * (1 - k) * (1 - k) : 0.42 - (0.42 - 0.2) * (k / 0.12);
        spin.dirty = true;
      }
      if (!spin.dirty || !topMesh) return;
      spin.dirty = false;
      AX.set(Math.cos(spin.prec), 0, Math.sin(spin.prec));
      M1.makeRotationAxis(AX, spin.tilt).multiply(M2.makeRotationY(spin.ang));
      const e = topMesh.matrixWorld.elements, m = M1.elements;
      for (const i of [0, 1, 2, 4, 5, 6, 8, 9, 10]) e[i] = m[i];
    });

    // a striped rug inside the door, where coats and bags get dropped
    prop(s, 'rug', 34.5, 0, 5.95, 0, { w: 2.4, d: 1.0, a: PAL.coral, b: PAL.saffron, mat: 'stripe' });
    s.detail(() => { g.mat('rush', '#c9a46a'); g.box(31.15, 0.0, 4.2, 32.25, 0.012, 4.95, { faces: 'YxXzZ' }); });
    // things left on the mat
    prop(s, 'toys.blocks', 33.75, 0.016, 11.25, 0.3, { seed: 2, n: 5 }, { noCollide: true });
    prop(s, 'toys.blocks', 33.9, 0.016, 11.4, 1.1, { seed: 5, n: 2 }, { noCollide: true });
    prop(s, 'toys.blocks', 33.62, 0.016, 11.45, 0.6, { seed: 4, n: 1 }, { noCollide: true });
    prop(s, 'toys.cab', 36.2, 0.016, 9.3, -0.6, { body: PAL.saffron, trim: '#26306b', tilt: -0.2 }, { noCollide: true });
    prop(s, 'toys.ball', 36.25, 0.016, 11.35, 0.4, { a: PAL.teal, b: PAL.cream }, { noCollide: true });
    prop(s, 'toys.doll', 34.65, 0.016, 9.0, 2.6, { coat: PAL.coral, lining: PAL.teal, patch: PAL.saffron, skin: SKIN[3], hair: HAIR[3], sit: true }, { noCollide: true });
    prop(s, 'toys.glide', 33.75, 0.016, 10.15, 0.9, { a: PAL.indigo }, { noCollide: true });
    prop(s, 'toys.drum', 36.35, 0.016, 10.2, 0, { a: PAL.saffron }, { noCollide: true });

    // ---------------- small tables and chairs ----------------
    prop(s, 'toys.table', 32.15, 0, 12.3, 0, { round: true, top: PAL.leaf });
    const chairs = [[32.15, 11.68, 0, PAL.coral], [32.77, 12.3, -Math.PI / 2, PAL.saffron], [32.15, 12.92, Math.PI, PAL.teal], [31.53, 12.3, Math.PI / 2, PAL.indigo]];
    for (const c of chairs) prop(s, 'toys.chair', c[0], 0, c[1], c[2], { col: c[3] });
    prop(s, 'toys.puzzle', 32.1, 0.5, 12.25, 0.4, { box: '#cfe0d8', a: '#5b4060', b: '#d4878a', c: '#d6a640' }, { noCollide: true });
    s.detail(() => { const rr = new Rng(9); for (let i = 0; i < 14; i++) { g.mat('paper', rr.pick(['#5b4060', '#d4878a', '#d6a640', '#e9dfc9'])); const x = 32.15 + rr.f(-0.28, 0.28), z = 12.3 + rr.f(-0.28, 0.28); g.box(x - 0.025, 0.5, z - 0.025, x + 0.025, 0.505, z + 0.025); } });
    prop(s, 'toys.table', 32.1, 0, 8.75, 0, { w: 0.9, d: 0.5, top: PAL.coral, legs: PAL.cream });
    prop(s, 'toys.chair', 31.85, 0, 8.22, 0, { col: PAL.teal }); prop(s, 'toys.chair', 32.4, 0, 9.28, Math.PI, { col: PAL.saffron });
    prop(s, 'toys.top', 31.9, 0.5, 8.7, 0, { a: PAL.indigo, b: PAL.saffron }, { noCollide: true });
    prop(s, 'toys.cab', 32.3, 0.5, 8.78, 0.4, { body: PAL.teal, trim: PAL.cream, tilt: 0.1 }, { noCollide: true });

    // ---------------- the picture-book trough in the middle of the floor ----------------
    // A low double-sided box of picture books, face up, and on its stand an open book of the Hours' animal names.
    const PB = { x0: 33.9, x1: 35.7, z0: 7.15, z1: 7.65, h: 0.6 };
    s.furniture(() => {
      g.mat('paint', PAL.indigo); g.box(PB.x0, 0, PB.z0, PB.x1, PB.h, PB.z1, { bevel: 0.012, aoBottom: 0.6, faces: 'xXzZy' });
      g.mat('paint', PAL.leaf); g.box(PB.x0 - 0.01, PB.h - 0.03, PB.z0 - 0.01, PB.x1 + 0.01, PB.h, PB.z1 + 0.01, { bevel: 0.006, faces: 'xXzZ' });
      g.mat('paint', shadeHex(PAL.indigo, 0.6)); g.box(PB.x0 + 0.03, PB.h - 0.25, PB.z0 + 0.03, PB.x1 - 0.03, PB.h - 0.24, PB.z1 - 0.03, { faces: 'Y' });
      g.mat('paint', PAL.saffron); for (const x of [PB.x0 + 0.6, PB.x0 + 1.2]) g.box(x - 0.01, PB.h - 0.26, PB.z0 + 0.03, x + 0.01, PB.h + 0.02, PB.z1 - 0.03);
      g.mat('wood', '#b98a58'); g.box(34.68, PB.h, 7.32, 34.92, PB.h + 0.2, 7.36, { bevel: 0.004 });
    });
    s.solid(PB.x0, 0, PB.z0, PB.x1, PB.h, PB.z1);
    s.detail(() => {
      // picture books leaning in two rows, covers up, facing each way
      const rb = new Rng(11), cols = [PAL.coral, PAL.teal, PAL.saffron, PAL.leaf, '#f2d16b', PAL.plum, '#5fb3b3', '#d9534f'];
      for (const side of [-1, 1]) for (let i = 0; i < 18; i++) {
        const x = PB.x0 + 0.08 + i * 0.094 + rb.f(-0.01, 0.01); if (Math.abs(x - 34.8) < 0.16) continue;
        const zc = side < 0 ? PB.z0 + 0.12 : PB.z1 - 0.12, w = rb.f(0.17, 0.24), hh = rb.f(0.2, 0.26);
        g.push(); g.move(x, PB.h - 0.24, zc); g.rotX(side * (0.55 + rb.f(-0.08, 0.08)));
        g.mat('paper', rb.pick(cols)); g.box(-w / 2, 0, -0.006, w / 2, hh, 0.006, { bevel: 0.002 });
        g.mat('paper', rb.pick(['#f4ecd8', '#26306b', '#f2d16b'])); g.box(-w * 0.3, hh * 0.45, side * 0.006 - 0.001, w * 0.3, hh * 0.8, side * 0.006 + 0.001, { faces: side > 0 ? 'z' : 'Z' });
        g.pop();
      }
      // the open book on its stand, tipped toward the room's front: a long-eared animal drawn from a name
      g.push(); g.move(34.8, PB.h + 0.05, 7.3); g.rotX(-0.55);
      g.mat('leather', PAL.coral); g.box(-0.2, -0.004, -0.005, 0.2, 0.26, 0.0);
      g.mat('paper', '#f6efdc'); g.box(-0.19, 0.0, -0.012, -0.004, 0.25, -0.005); g.box(0.004, 0.0, -0.012, 0.19, 0.25, -0.005);
      g.mat('paper', '#9a6e46'); g.ball(0.1, 0.09, -0.013, 0.05, 0.032, 0.002, { segs: 10, rings: 4 }); g.ball(0.145, 0.115, -0.013, 0.022, 0.02, 0.002, { segs: 8, rings: 3 });
      g.box(0.14, 0.13, -0.014, 0.148, 0.21, -0.012); g.box(0.152, 0.13, -0.014, 0.16, 0.2, -0.012);
      g.mat('paper', '#7cab4e'); g.box(0.03, 0.04, -0.014, 0.18, 0.05, -0.012);
      g.mat('plain', '#5a5048'); for (let i = 0; i < 6; i++) g.box(-0.17, 0.2 - i * 0.03, -0.0135, -0.03 - (i % 2) * 0.04, 0.204 - i * 0.03, -0.0125);
      g.pop();
    });

    // ---------------- children's drawings pinned up, and a glide-car mobile ----------------
    s.deco(() => {
      const rd = new Rng(21); const cols = [PAL.coral, PAL.teal, PAL.saffron, PAL.leaf, PAL.indigo, PAL.plum, '#d9534f'];
      const card = (axis, u, y, c, sgn, w, h) => {
        const tilt = rd.f(-0.06, 0.06), paper = rd.pick(['#fffaf0', '#fbefd6', '#e6f4f6', '#fde4da', '#f3f7d8']);
        const Q = (du, dy, off) => { const uu = u + du * Math.cos(tilt) - dy * Math.sin(tilt), yy = y + du * Math.sin(tilt) + dy * Math.cos(tilt); return axis === 'x' ? [c + sgn * off, yy, uu] : [uu, yy, c + sgn * off]; };
        const quad = (u0, y0, u1, y1, off) => { const a = Q(u0, y0, off), b = Q(u1, y0, off), cc = Q(u1, y1, off), d = Q(u0, y1, off); g.quad(a, b, cc, d, { double: true }); };
        g.mat('paper', paper); quad(-w / 2, -h / 2, w / 2, h / 2, 0.004);
        // a crayon drawing: a drum, a kite or a person, in two or three blocks of colour
        const k = rd.i(0, 2); g.mat('paper', rd.pick(cols));
        if (k === 0) { quad(-w * 0.3, -h * 0.15, w * 0.3, h * 0.15, 0.006); g.mat('paper', rd.pick(cols)); quad(-w * 0.36, -h * 0.03, w * 0.36, h * 0.03, 0.007); }
        else if (k === 1) { quad(-w * 0.12, -h * 0.05, w * 0.12, h * 0.32, 0.006); g.mat('paper', rd.pick(cols)); quad(-w * 0.02, -h * 0.4, w * 0.02, -h * 0.05, 0.007); }
        else { quad(-w * 0.08, -h * 0.25, w * 0.08, h * 0.12, 0.006); g.mat('paper', rd.pick(cols)); quad(-w * 0.32, h * 0.0, w * 0.32, h * 0.06, 0.007); quad(-w * 0.07, h * 0.16, w * 0.07, h * 0.3, 0.007); }
        g.mat('paint', rd.pick(['#b03a2e', '#2a6f6b', '#c8a45a'])); quad(-0.008, h / 2 - 0.03, 0.008, h / 2 - 0.014, 0.009);
      };
      // east wall, round the chalkboard
      for (let i = 0; i < 16; i++) { const z = 9.1 + (i % 8) * 0.48 + rd.f(-0.06, 0.06), y = i < 8 ? 2.36 : 1.62; if (Math.abs(z - 10.95) < 0.5 && y < 2) continue; card('x', z, y + rd.f(-0.05, 0.05), 39.84, -1, rd.f(0.27, 0.33), rd.f(0.32, 0.38)); }
      // back wall, over the tall shelves
      for (let i = 0; i < 10; i++) card('z', 30.5 + i * 0.47 + rd.f(-0.05, 0.05), 2.3 + rd.f(-0.04, 0.04), 13.84, -1, rd.f(0.28, 0.34), rd.f(0.3, 0.36));
      // the pier's street face, above the notice
      for (let i = 0; i < 2; i++) card('z', 30.3 + i * 0.42, 2.12, 4.0, -1, 0.26, 0.3);
    });
    prop(s, 'toys.kite', 31.6, 2.5, 7.4, 0.9, { a: PAL.indigo, b: PAL.saffron, patch: PAL.coral, up: H - 2.5 - 0.17, tail: 0.6 }, { noCollide: true });
    prop(s, 'toys.kite', 38.5, 2.45, 8.6, -0.3, { a: PAL.coral, b: PAL.cream, patch: PAL.leaf, up: H - 2.45 - 0.17, tail: 0.7 }, { noCollide: true });
    const MOB = [33.6, 2.55, 5.6];
    s.detail(() => {
      const [mx, my, mz] = MOB;
      g.mat('weave', '#e9e2d0'); g.tube([[mx, H - 0.2, mz], [mx, my, mz]], 0.0018, { segs: 3, caps: false });
      g.mat('wood', '#8a6240'); g.tube([[mx - 0.45, my, mz], [mx + 0.45, my, mz]], 0.006, { segs: 4 }); g.tube([[mx, my - 0.3, mz - 0.35], [mx, my - 0.3, mz + 0.35]], 0.005, { segs: 4 });
      g.mat('weave', '#e9e2d0'); g.tube([[mx, my, mz], [mx, my - 0.3, mz]], 0.0015, { segs: 3, caps: false });
      for (const q of [[mx - 0.44, my, mz, 0.22], [mx + 0.44, my, mz, 0.3], [mx, my - 0.3, mz - 0.34, 0.2], [mx, my - 0.3, mz + 0.34, 0.26]]) g.tube([[q[0], q[1], q[2]], [q[0], q[1] - q[3], q[2]]], 0.0015, { segs: 3, caps: false });
    });
    for (const q of [[MOB[0] - 0.44, MOB[1] - 0.22 - 0.09, MOB[2], 0.4, PAL.coral], [MOB[0] + 0.44, MOB[1] - 0.3 - 0.09, MOB[2], -0.5, PAL.teal], [MOB[0], MOB[1] - 0.5 - 0.09, MOB[2] - 0.34, 1.6, PAL.saffron], [MOB[0], MOB[1] - 0.56 - 0.09, MOB[2] + 0.34, 2.2, PAL.leaf]]) prop(s, 'toys.glide', q[0], q[1], q[2], q[3], { a: q[4], hang: true }, { noCollide: true });

    // ---------------- the window display ----------------
    const disp = [['toys.cab', 32.9, 0.3, { body: PAL.coral, trim: PAL.cream }], ['toys.top', 33.35, 0, { a: PAL.saffron, b: PAL.teal }], ['toys.doll', 33.8, 0.2, { coat: PAL.teal, lining: PAL.saffron, patch: PAL.coral, skin: SKIN[1], hair: HAIR[0], sit: true }],
      ['toys.blocks', 34.3, 0.4, { seed: 3, n: 6 }], ['toys.glide', 34.8, -0.3, { a: PAL.leaf }], ['toys.drum', 35.35, 0, { a: PAL.coral }], ['toys.figure', 35.8, 0, { a: PAL.indigo, b: PAL.saffron, skin: SKIN[2] }],
      ['toys.ball', 36.3, 0, { a: PAL.saffron, b: PAL.cream }], ['toys.cab', 36.9, -0.2, { body: PAL.indigo, trim: '#f2d16b', tilt: 0.3 }], ['toys.top', 37.4, 0, { a: PAL.leaf, b: PAL.coral }], ['toys.doll', 37.8, -0.3, { coat: PAL.saffron, lining: PAL.plum, patch: PAL.teal, skin: SKIN[0], hair: HAIR[2], sit: true }],
      ['toys.puzzle', 38.45, 0.1, { box: '#f2d6c8', a: '#5b4060', b: '#d4878a', c: '#d6a640' }], ['toys.drum', 39.15, 0, { a: PAL.teal }]];
    disp.forEach((d, i) => prop(s, d[0], d[1], i % 2 ? 0.83 : 0.51, i % 2 ? 4.68 : 4.37, Math.PI + d[2], d[3], { noCollide: true, scale: d[0] === 'toys.puzzle' ? 1 : 1.5 }));
    prop(s, 'plant', 39.5, 0.83, 4.68, 0, { kind: 'broad', size: 0.65, pot: PAL.teal });
    // a kite propped against the back of the display, facing the street
    prop(s, 'toys.kite', 35.6, 1.55, 4.74, Math.PI, { a: PAL.coral, b: PAL.saffron, patch: PAL.teal, up: 1.45, tail: 0.3 }, { noCollide: true });

    // ---------------- kites on the ceiling, bunting ----------------
    const kites = [[33.0, 2.3, 9.6, 0.3, PAL.coral, PAL.saffron, PAL.teal], [36.1, 2.35, 8.0, -0.5, PAL.teal, PAL.cream, PAL.coral], [34.1, 2.4, 12.1, 1.0, PAL.saffron, PAL.indigo, PAL.leaf], [37.9, 2.3, 10.9, -1.2, PAL.leaf, PAL.saffron, PAL.plum]];
    for (const k of kites) prop(s, 'toys.kite', k[0], k[1], k[2], k[3], { a: k[4], b: k[5], patch: k[6], up: H - k[1] - 0.17, tail: 0.75 }, { noCollide: true });
    bunting(s, [30.25, 2.92, 6.1], [39.75, 2.92, 6.1], { colors: [PAL.coral, PAL.saffron, PAL.teal, PAL.cream, PAL.leaf, PAL.indigo], sag: 0.35 });

    // ---------------- the height chart, on the pier by the door ----------------
    s.deco(() => {
      g.mat('paint', '#f4ead2'); g.box(30.42, 0.12, 4.16, 30.86, 1.86, 4.19, { bevel: 0.006 });
      for (let i = 0; i < 18; i++) { g.mat('paint', i % 2 ? PAL.teal : PAL.coral); g.box(30.43, 0.12 + i * 0.1, 4.19, 30.47, 0.22 + i * 0.1, 4.195, { faces: 'Z' }); g.mat('plain', '#4a4038'); g.box(30.47, 0.12 + i * 0.1 - 0.002, 4.19, 30.55, 0.12 + i * 0.1 + 0.002, 4.195, { faces: 'Z' }); }
    });
    const marks = [[1.37, 'Rafe 11', '#26306b'], [1.2, 'Esi 10', '#b03a2e'], [1.13, 'Tavi 9', '#2f6f4a'], [1.02, 'Pip 7', '#b03a2e'], [0.95, 'Lumi 6', '#7a2a5a'], [1.08, 'Mira 8', '#5a5048'], [1.28, 'Jon 10', '#5a5048'], [0.86, 'Nico 5', '#2f6f4a']];
    s.deco(() => { for (const m of marks) { g.mat('plain', m[2]); g.box(30.55, m[0] - 0.003, 4.19, 30.84, m[0] + 0.003, 4.196, { faces: 'Z' }); } });
    for (const m of marks) sign(s, { kind: 'label', text: m[1] }, 30.73, m[0] + 0.022, 4.198, { face: 'Z', w: 0.2, h: 0.035 });
    sign(s, { kind: 'notice', title: 'You weigh this much here', lines: ['Here, deck 16: 0.98 g', 'The Hollow: 0.5 g', 'The Third: a third', 'The Twentieth: a twentieth', 'The Spindle: nearly nothing', 'Go up.'], hand: true }, 30.62, 2.12, 4.2, { face: 'Z', w: 0.4, h: 0.48 });
    lamp(s, 'sconce', 30.95, 2.0, 4.18, { face: 'Z', clip: C, power: 0.5, K: 3000 });

    // ---------------- signs ----------------
    sign(s, SIGNS['toys.notice'], 30.5, 1.5, 3.995, { face: 'z' });
    sign(s, { kind: 'poster', title: 'Spinball', lines: ['Axis flies true', 'Spin sinks', 'Anti floats'], palette: [PAL.teal, PAL.cream, PAL.saffron], motif: 'ball' }, 39.83, 2.2, 8.05, { face: 'x', w: 0.42, h: 0.6 });
    prop(s, 'toys.kite', 39.6, 1.85, 5.3, -Math.PI / 2, { a: PAL.saffron, b: PAL.teal, patch: PAL.coral, up: 0.45, tail: 0.45 }, { noCollide: true });
    // the loans board behind the desk: a cork board of slips, who has what, pinned in colours
    s.deco(() => {
      g.mat('wood', '#7a5233'); g.box(39.8, 1.5, 6.42, 39.84, 2.36, 7.72, { bevel: 0.006 });
      g.mat('felt', '#b98e5c'); g.box(39.78, 1.54, 6.46, 39.8, 2.32, 7.68, { faces: 'x' });
      const rs = new Rng(31);
      for (let i = 0; i < 15; i++) {
        const z = 6.56 + (i % 5) * 0.22 + rs.f(-0.02, 0.02), y = 1.66 + Math.floor(i / 5) * 0.24 + rs.f(-0.02, 0.02);
        g.mat('paper', rs.pick(['#fffaf0', '#fde4da', '#e6f4f6', '#f3f7d8'])); g.box(39.772, y - 0.08, z - 0.07, 39.778, y + 0.08, z + 0.07, { faces: 'x' });
        g.mat('plain', '#6a6058'); for (let k = 0; k < 3; k++) g.box(39.771, y + 0.03 - k * 0.035, z - 0.05, 39.772, y + 0.036 - k * 0.035, z + 0.03 - (k % 2) * 0.03, { faces: 'x' });
        g.mat('paint', rs.pick(['#b03a2e', PAL.teal, PAL.saffron])); g.ball(39.768, y + 0.06, z, 0.008, 0.008, 0.008, { segs: 5, rings: 3 });
      }
    });
    s.furniture(() => { g.mat('cast', '#2f3a36'); g.tube([[30.5, 2.78, 4.0], [30.5, 2.78, 3.42]], 0.016, { segs: 6 }); g.tube([[30.5, 2.6, 4.0], [30.5, 2.78, 3.75]], 0.01, { segs: 5 }); g.tube([[30.5, 2.78, 3.48], [30.5, 2.72, 3.48]], 0.005, { segs: 4 }); g.tube([[30.5, 2.78, 3.82], [30.5, 2.72, 3.82]], 0.005, { segs: 4 }); });
    sign(s, Object.assign({}, SIGNS['toys.hanging'], { emblem: 'ball' }), 30.5, 2.42, 3.65, { face: 'X', double: true, w: 0.56, h: 0.56 });
    sign(s, { kind: 'chalk', title: 'Back today', lines: ['A wooden cab, gimbal stiff', 'A kite, two sticks', 'A doll, her ninth mend', 'All out again tomorrow'] }, 39.83, 1.75, 10.95, { face: 'x', w: 0.55, h: 0.8 });

    // ---------------- light ----------------
    lamp(s, 'panel', 33.3, H - 0.2, 7.3, { w: 1.2, d: 0.5, K: 3300, power: 0.85, clip: C });
    lamp(s, 'panel', 36.5, H - 0.2, 10.7, { w: 1.2, d: 0.5, K: 3300, power: 0.8, clip: C });
    lamp(s, 'lantern', 35.3, 2.35, 10.4, { tint: PAL.saffron, drop: 0.65, power: 0.6, clip: C, r: 0.24, hh: 0.34 });
    lamp(s, 'lantern', 31.3, 2.45, 10.0, { tint: PAL.coral, drop: 0.55, power: 0.35, clip: C });
    lamp(s, 'globe', 32.15, 2.2, 12.3, { K: 3000, power: 0.55, clip: C, drop: 0.8, r: 0.13 });
    lamp(s, 'strip', 32.5, H - 0.04, 4.5, { to: [39.6, H - 0.04, 4.5], K: 3200, power: 0.55, clip: CS });
    s.light({ at: [37.5, 1.55, 13.4], type: 'spot', dir: [0, -1, 0], cone: [62, 30], color: warm(2650), power: 7, range: 4, shadow: true, lamp: true, clip: C, radius: 0.05 });
    lamp(s, 'bulb', 38.0, 1.3, 7.93, { K: 2800, power: 0.35, range: 2.5, clip: C });
    lamp(s, 'bulb', 39.2, 1.6, 10.9, { K: 3100, power: 0.3, range: 3, clip: C });

    // ---------------- people ----------------
    s.spot('counter', 38.95, 0, 7.4, -Math.PI / 2, { who: 'ros', tags: ['keeper', 'toys'] });
    s.spot('customer', 37.2, 0, 7.4, Math.PI / 2, { tags: ['borrow'] });
    s.spot('customer', 37.2, 0, 6.7, Math.PI / 2, { tags: ['borrow'] });
    s.spot('work', 37.4, 0, 12.72, Math.PI, { tags: ['mend'] });
    s.spot('work', 36.2, 0, 12.75, Math.PI, { tags: ['mend', 'stand'] });
    for (const p of [[34.2, 9.1, 2.3], [35.9, 9.4, -2.6], [34.6, 11.3, 0.6], [36.1, 11.0, -0.8], [33.8, 10.7, 1.6], [35.3, 9.6, 3.1]]) s.spot('play', p[0], 0, p[1], p[2], { tags: ['kids', 'mat'] });
    for (const p of [[32.15, 11.68, Math.PI], [32.77, 12.3, Math.PI / 2], [32.15, 12.92, 0], [31.53, 12.3, -Math.PI / 2], [31.85, 8.22, Math.PI], [32.4, 9.28, 0]]) s.spot('play', p[0], 0, p[1], p[2], { tags: ['kids', 'table'] });
    for (const p of [[31.0, 6.2, -Math.PI / 2], [31.0, 7.4, -Math.PI / 2], [31.05, 10.4, -Math.PI / 2], [38.95, 9.6, Math.PI / 2], [38.95, 11.9, Math.PI / 2], [33.5, 13.0, Math.PI], [31.4, 13.0, Math.PI], [35.6, 5.35, 0], [37.8, 5.3, 0]]) s.spot('browse', p[0], 0, p[1], p[2], { tags: ['toys'] });
    s.spot('stand', 32.7, 0, 5.5, 2.4, { tags: ['parent'] }); s.spot('stand', 33.0, 0, 8.3, 2.8, { tags: ['parent', 'watch'] });
    s.spot('chat', 36.2, 0, 8.1, 1.0, { tags: ['parent'] }); s.spot('chat', 36.9, 0, 8.3, -1.9, { tags: ['parent'] });
    s.spot('browse', 34.4, 0, 6.85, 0, { tags: ['books', 'kids'] }); s.spot('browse', 35.3, 0, 7.95, Math.PI, { tags: ['books', 'kids'] });
    s.path([[31.7, 1.6], [31.7, 5.4], [33.2, 6.5], [36.6, 6.5], [37.15, 7.2]]);
    s.path([[33.2, 6.5], [33.0, 8.3], [34.6, 8.3]]);
    s.path([[31.7, 5.4], [31.05, 6.3], [31.05, 10.6], [33.0, 11.0]]);
    s.path([[37.15, 7.2], [37.3, 8.7], [38.8, 10.6], [37.4, 12.5]]);
    s.path([[33.0, 11.0], [33.2, 13.0], [34.6, 12.9], [36.2, 12.7]]);

    // ---------------- what the player can do ----------------
    const say = (lines) => talk(game, 'ros', lines);
    s.interact({ x: 38.6, y: 1.35, z: 7.4, radius: 1.7, kind: 'talk', prompt: 'Talk to Ros', async onUse(game) {
      if (!game.ui) return;
      game.busy++;
      let pick = null;
      try { pick = await game.ui.choose({ name: 'Ros', colour: '#3a8a8a' }, 'Borrowing, returning, or just looking?', [{ label: 'Borrow something', value: 'menu' }, { label: 'Ask about the wooden cab', value: 'cab' }, { label: 'Ask what a new toy costs', value: 'cost' }]); } finally { game.busy--; }
      if (pick === 'cab') {
        await say(['That cab went out first to a girl called Mira, forty years ago. Then to her son. Now his twins have it, and they are hard on gimbals.', "It came back this morning with the cabin stuck. I'll have it swinging by tomorrow and it goes out again."]);
        found(game, 'toy-loans');
      } else if (pick === 'cost') {
        await say(['New mass is about twenty-five kays a kilo. A wooden cab is half a kilo, so twelve and a half kays, for a thing that ends up under a bed.', 'So nobody buys one. You borrow it, you bring it back scuffed, I mend it, and somebody else gets it.']);
        found(game, 'toy-loans');
      } else if (pick === 'menu') {
        const m = MENUS.toys; let id = null;
        game.busy++;
        try { id = await game.ui.menu({ kicker: 'Ladle Row', title: m.title, note: m.note, items: m.items.map((it) => ({ id: it.id, name: it.name, desc: it.desc, price: it.price, tag: it.tag })), wallet: game.wallet ? game.wallet.kwh : 0 }); } finally { game.busy--; }
        if (!id) return;
        if (id === 'spinball') { game.flags.hasBall = true; give(game, 'spinball'); await say(['Axis flies true, spin sinks, anti floats. Bring it back scuffed. That is what it is for.']); }
        else if (id === 'wooden-cab') { give(game, 'toy-cab'); await say(["Not that one, that one's on the bench. Here's its cousin. Tip it and the cabin stays level, the same as a real one."]); }
        else if (id === 'mending') await say(['Leave it on the bench with your name on a tag. If it can be mended, I will. If it cannot, it goes back for its mass and comes out as something else.']);
        else { const it = m.items.find((x) => x.id === id); game.flags['loan:' + id] = true; if (game.ui) game.ui.toast('On loan: ' + (it ? it.name : id), { kind: 'gain' }); await say(["It's in the book. Bring it back when you're bored of it, which takes longer than you'd think."]); }
      }
    } });
    s.interact({ x: 39.15, y: 0.55, z: 5.4, radius: 1.4, prompt: (game) => game.flags.hasBall ? 'You have a spinball already' : 'Borrow a spinball', onUse(game) {
      if (game.flags.hasBall) { if (game.ui) game.ui.toast('You have one already. Throw it anti and see.', { kind: 'info' }); return; }
      game.flags.hasBall = true; give(game, 'spinball'); game.sfxAt('ball-catch', f, 39.15, 0.5, 5.4);
      return say(['Write your name in the book. Axis flies true, spin sinks, anti floats. Bring it back scuffed.']);
    } });
    let toldTop = false;
    s.interact({ x: TD[0], y: 0.25, z: TD[2], radius: 1.5, prompt: 'Spin the top', onUse(game) {
      spin.t = 7; spin.ang = 0; spin.tilt = 0.02; spin.prec = Math.random() * 6; spin.dirty = true;
      game.sfxAt('drum-tap', f, TD[0], 0.1, TD[2], { vol: 0.5 });
      if (!toldTop) { toldTop = true; return say(['A top is a drum. Spin it fast enough and it stands up by itself. Nobody here thinks that is strange.']); }
    } });
    s.interact({ x: 30.62, y: 1.3, z: 4.4, radius: 1.5, prompt: 'Read the height chart', onUse(game) {
      return talk(game, 'Height chart', ['At the top, in paint: You weigh this much here. Deck 16, 0.98 g.', "Under it, in a child's pencil: The Hollow 0.5. The Third, a third. The Twentieth, a twentieth. The Spindle, nearly nothing. Go up.", 'The marks climb the frame in three colours of pencil. One of them says Mira 8, and it is very old.']);
    } });
    let drumOpen = true;
    s.interact({ x: MD.cx, y: 0.45, z: MD.cz, radius: 1.5, prompt: () => drumOpen ? 'Close the model drum' : 'Open the model drum', onUse(game) {
      drumOpen = !drumOpen; if (lidOpen) lidOpen.userData.hidden = !drumOpen; if (lidShut) lidShut.userData.hidden = drumOpen;
      game.sfxAt('clunk', f, MD.cx, 0.3, MD.cz, { vol: 0.5 });
      if (drumOpen) return talk(game, 'The model drum', ['Inside, the decks are painted in rings round a green Hollow with a lake the size of a thumbnail.', 'Somebody has drawn a tiny flyer on the sunline in pencil.']);
    } });
    s.interact({ x: 34.8, y: 0.75, z: 7.3, radius: 1.4, prompt: 'Look at the picture book', onUse(game) {
      return talk(game, 'Picture book', ['A book of the Hours, one animal to a page, each drawn from its name and nothing else.', 'This one says HARE. It has very long ears, because the name sounds as if it should, and nobody here has ever seen one to say otherwise.', 'Somebody has added a second pair of ears in pencil. Somebody else has rubbed them out.']);
    } });
    s.interact({ x: 38.1, y: 1.0, z: 6.72, radius: 1.2, prompt: 'Look through the card index', onUse(game) {
      return talk(game, 'Card index', ['Wooden cab, gimballed. Out 41 times. Mended 12. Back this morning from the Okafor twins, gimbal stiff.', 'Doll, relined coat. Out 63 times. On her ninth mend. Coat has been teal, rust and saffron, and is plum now.', 'Kite, coral. Out 30 times. Two new sticks. The patch is from a kite that did not make it.']);
    } });
    s.interact({ x: 37.0, y: 1.0, z: 13.45, radius: 1.4, prompt: 'Look at the mending bench', onUse(game) {
      return talk(game, 'The mending bench', ['A wooden cab lies with its cabin out of the yoke and two brass pins in a saucer. The gimbal is stiff.', "A doll in a plum coat waits for her arm, on her ninth mend. The new stitches are green, so you can see them.", 'Glue pots, tiny clamps on pegs, and a tag on everything: whose it was, and who has it next.']);
    } });

    // ---------------- sound, zone, spawns ----------------
    let kids = null;
    s.trigger({ box: [30, 0, 4, 40, 3, 14], onEnter(game) { if (!kids) kids = game.loopAt('kids', f, 35, 0.8, 10.2, { vol: 0.22, radius: 9 }); } });
    s.zoneBox({ id: 'toys', place: 'toys', box: [30, 0, 4.1, 40, H, 14], name: 'The toy library', sub: 'Ladle Row', ambience: 'shop', reverb: 'room', env: { exposure: 1.0, warmth: 0.2 } });
    s.finish();
    game.spawns.toys = { frame: f, x: 34.6, y: 0, z: -1.6, yaw: Math.PI };
    game.spawns['toys-inside'] = { frame: f, x: 31.8, y: 0, z: 5.3, yaw: 2.35 };
  },
};
