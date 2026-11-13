// Kittiwake, Gull Row: a crosswise lesson in the front flying hall, by day (docs/wander-year.md, Day 60, and Method,
// "Crosswise flight"; raft-habitat.md, "The sunline and the Spindle"; ashgrove.md, Day two, "The Spindle"; the Kittiwake
// entry in games/three-nights/src/15-canon.js: wing-sleeves, nine-year-old teachers who call grown-ups "big aunt", broth in
// bulbs at the gate, the palette "Feather grey" #1e2328 #5e6b78 #d6dde6 #fbfdff, the motto "Aim wide").
//
// The story is the card's. A teacher of nine and one grown beginner fly out from the gate on the top terrace, lengthwise
// along the hall (easy: straight), to the push-off rail, and hang there while the beginner looks at her hoop across the
// hall. Then they push off, aimed far wide of it. Across the axis nothing pushes on a flyer: each of them, and the camera
// behind them, goes in a straight line in the frame that does not turn, and the hall turns under them, so the hoop swings
// round into their way and they go through it. The camera keeps its own heading for most of the crossing, so the whole
// hall and the land beyond the net wheel slowly round the two of them; near the end it turns, as they do, to face the hoop.
// Three other grown-ups miss theirs on the way and sail into the net.
// The sums: the drum turns at 0.0572 rad/s. Pushing off from a rail 67 m out you already move 3.8 m/s spinward with it,
// so to come out at a hoop 52 m out on the far side 25 s later you aim about 75 degrees wide of it; the hoop is a third of
// the way round the hall from where you started, and you pass 7 m from the axis.
//
// Not canon (the docs are silent): the push-off rail, a padded ring hung inside the net 180 m out, where classes wait and
// launch; the ring of beginners' hoops across from it; the gate's counter, sleeve board, canopy and shoe shelves on the top
// terrace by the front hub (shoes as the deposit is Sorrel's custom in sorrel.md, borrowed here); the padding and paint on
// the hub, the spar and the hub face; the stiff ribs that hold the sock open; the other rings of padded hoops hung on lines
// to the net, and every colour of them; the classes flying in strings behind their teachers; the sleeves' cut (a membrane
// from wrist to hip, per the docs, with a hem along the arm in a second colour); the Hollow's plan (sleeve-makers' yards,
// greens where sleeve cloth is laid out to dry, training lawns with hoops on poles, falling lawns marked with rings, kite
// walks, the lake's shape).
import {
  Scene, BufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, Mesh, ShaderMaterial,
  DoubleSide, Matrix4, Vector3, Quaternion, Sphere,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { G, CLIP_PARS, CLIP_FRAG, glowPoints, litMaterial, hollowRig } from '../kit/mats.js';
import { Geo, rgb } from '../kit/geo.js';
import { crowd, CLOTH, SKIN } from '../kit/folk.js';
import { DRUM } from '../kit/drum.js';
import { makeRng } from '../core/rng.js';

const W = DRUM.OMEGA;                 // the drum's turn, rad/s
const NET_R = 75, NET_Z0 = 11, NET_Z1 = 300;     // the sock: from the rail of the top terrace out to 300 m
const DEG = Math.PI / 180;
const cyl = (aDeg, r, z) => [r * Math.cos(aDeg * DEG), r * Math.sin(aDeg * DEG), z];
const inward = (aDeg) => [-Math.cos(aDeg * DEG), -Math.sin(aDeg * DEG), 0];
const spinward = (aDeg) => [-Math.sin(aDeg * DEG), Math.cos(aDeg * DEG), 0];
const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const nrm3 = (a) => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rotZ = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [c * p[0] - s * p[1], s * p[0] + c * p[1], p[2]]; };
const r2 = (p) => Math.hypot(p[0], p[1]);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const ZAX = [0, 0, 1];

// ---------------------------------------------------------------- free flight
// A flyer who lets go of the drum at drum point p with inertial velocity V goes in a straight line in the frame that does
// not turn. In the drum's frame (which turned through W t meanwhile) it is at rot(p + V t, -W t).
function freeAt(p, V, t) { return rotZ(add3(p, V, t), -W * t); }
// its velocity as the drum sees it
function freeVel(p, V, t) { const q = freeAt(p, V, t), v = rotZ(V, -W * t); return [v[0] + W * q[1], v[1] - W * q[0], v[2]]; }
// the inertial velocity that takes a flyer from drum point A now to drum point B, T seconds later
function aimV(A, B, T) { const Bi = rotZ(B, W * T); return [(Bi[0] - A[0]) / T, (Bi[1] - A[1]) / T, (Bi[2] - A[2]) / T]; }
// a velocity as the drum sees it, for a flyer at A moving at inertial V
function relU(A, V) { return [V[0] + W * A[1], V[1] - W * A[0], V[2]]; }
// the front hub: a cone from the hub face out along the spar (kit/hollow.js)
const HUB = [[46, 0], [40, 26], [22, 60], [9, 120], [4, 150]];
function hubR(z) {
  if (z < 0 || z > 150) return 1.4;
  for (let i = 0; i < HUB.length - 1; i++) if (z <= HUB[i + 1][1]) { const [r0, z0] = HUB[i], [r1, z1] = HUB[i + 1]; return r0 + (r1 - r0) * (z - z0) / (z1 - z0); }
  return 1.4;
}

// ---------------------------------------------------------------- the story's numbers
const ZR = 180, RAIL = 68;            // the push-off rail: a ring 68 m out, 180 m along the hall
const AL = 22;                        // where on it the two of them hang (degrees)
const AS = -9;                        // where they start, at the terrace rail by the gate
const T_GO = 29, T_X = 25;            // push-off, and seconds across
const T_ARR = 23.6;                   // when they reach the rail
const DELTA = -150;                   // the angle round the axis, in the frame that does not turn, between rail and hoop
const HOOP_R = 52, HOOP_Z = 196;      // the ring of beginners' hoops across the hall
const CAM_LAG = 0.95;                 // the camera comes through the hoop this long after the beginner
const A_HOOP = AL + DELTA - (W * T_X) / DEG;      // where the hoop hangs, as the drum sees it

// ---------------------------------------------------------------- the Hollow's plan
// Shapes of one kind are gathered into one path and painted once: the canvas work is most of a Hollow's build.
const LX = 0.58 * C, LZ = 2050;
export function* paintKittiwake(plan) {
  const rng = makeRng('kittiwake-plan');
  const many = (list, fn) => { const p = new Path2D(); for (const it of list) p.addPath(fn(it)); return p; };
  plan.fill(plan.band(0, L), { color: '#86a879', life: 0.3 });
  // patches of lighter and darker lawn, a colour at a time
  const patchCols = ['#a3c08c', '#6f9468', '#b6cc98', '#7fa17a', '#c1cfa2', '#5f8461'], patches = patchCols.map(() => []);
  for (let i = 0; i < 260; i++) { const r = rng.f(90, 300); patches[i % 6].push(plan.blob(rng.f(0, C), rng.f(500, L - 500), r, r * rng.f(0.5, 1.1), { wobble: 0.3, lobes: 4, seed: i + 50, n: 16 })); }
  patches.forEach((list, k) => plan.fill(many(list, (b) => b), { color: patchCols[k], alpha: 0.45 }));
  yield 'kittiwake: patches';
  // the Dim Ends
  plan.fill(plan.band(0, 690), { color: '#3f5c4c', wood: 0.9, clear: ['life'] });
  plan.fill(plan.band(L - 690, L), { color: '#3c584a', wood: 0.9, clear: ['life'] });
  yield;
  // the lake: long, lying along the axis, with a pale strand
  const lake = plan.blob(LX, LZ, 330, 760, { wobble: 0.18, lobes: 6, seed: 21 });
  plan.stroke(lake, 46, { color: '#e4e9ee', paved: 0.3, life: 0.9, clear: ['wood'] });
  plan.fill(lake, { color: '#4f93a8', water: 1, clear: ['life', 'paved', 'wood'] });
  plan.fill(plan.blob(LX, LZ, 220, 600, { wobble: 0.2, lobes: 5, seed: 22 }), { color: '#3a7f96' });
  // falling lawns, where children practise falling slowly: pale lawns marked with rings
  const lawns = [[0.08 * C, 1300], [0.2 * C, 2500], [0.36 * C, 1600], [0.83 * C, 2700], [0.94 * C, 1450], [0.46 * C, 900], [0.66 * C, 1150]];
  plan.fill(many(lawns, ([x, z]) => plan.ellipse(x, z, 250, 210)), { color: '#c4dba2', life: 0.9, clear: ['wood'] });
  const rings = [];
  for (const [x, z] of lawns) for (let k = 0; k < 9; k++) { const cx = x + rng.f(-170, 170), cz = z + rng.f(-130, 130), r = rng.f(14, 28); rings.push([cx, cz, r], [cx, cz, r * 0.45]); }
  plan.stroke(many(rings, ([x, z, r]) => plan.ellipse(x, z, r, r)), 2.2, { color: '#fbfdff' });
  yield;
  // training lawns: rows of hoops on poles, painted red, yellow and white, on close-mown squares
  const train = [];
  for (let i = 0; i < 18; i++) train.push([((i * 0.157 + 0.05) % 1) * C, 760 + ((i * 397) % 2100)]);
  plan.fill(many(train, ([x, z]) => plan.rect(x - 130, z - 90, x + 130, z + 90, 14)), { color: '#a9c98a', life: 0.7, clear: ['wood'] });
  plan.stroke(many(train, ([x, z]) => plan.rect(x - 130, z - 90, x + 130, z + 90, 14)), 3, { color: '#eef2f6', paved: 0.5 });
  const poleCols = ['#e8563a', '#f2c14e', '#fbfdff'], poles = poleCols.map(() => []);
  train.forEach(([x0, z0], t) => { for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) poles[(i + j + t) % 3].push([x0 - 105 + i * 35, z0 - 60 + j * 40]); });
  poles.forEach((list, k) => plan.dots(list, 4.5, { color: poleCols[k] }));
  yield;
  // kite walks: long straight tracks round the floor (kites are flown by walking)
  const kites = [[0.12 * C, 2050], [0.7 * C, 1050], [0.47 * C, 2900], [0.9 * C, 3000]];
  plan.fill(many(kites, ([x0, z0]) => plan.rect(x0 - 260, z0 - 130, x0 + 260, z0 + 130, 30)), { color: '#9fbd85', life: 0.4, clear: ['wood'] });
  const tracks = [];
  for (const [x0, z0] of kites) for (let k = 0; k < 7; k++) tracks.push([[x0 - 250, z0 - 110 + k * 37], [x0 + 250, z0 - 110 + k * 37]]);
  plan.stroke(many(tracks, (t) => plan.line(t)), 3.5, { color: '#e6ead9', paved: 0.4, life: 1 });
  // the greens where sleeve cloth is laid out to dry: long strips in rows, the drum's colours from kilometres off
  const cloth = ['#e8563a', '#f2c14e', '#ef8a2c', '#2f9e96', '#3f6fc0', '#6cc0dc', '#a34b86', '#d93a5a', '#fbfdff', '#7bc47f'];
  const FAM = [[0, 1, 2], [3, 4, 5], [6, 7, 0], [1, 2, 9], [4, 5, 8], [7, 0, 1], [3, 9, 5]];
  const greens = [];
  for (let i = 0; i < 30; i++) greens.push([((i * 0.0731 + 0.03 + (i % 3) * 0.21) % 1) * C, 720 + ((i * 523) % 2300), rng.f(170, 320), rng.chance(0.5)]);
  plan.fill(many(greens, ([x0, z0, w]) => plan.rect(x0 - 14, z0 - 14, x0 + w + 14, z0 + 364, 8)), { color: '#c9d1d8', life: 0.4, clear: ['wood'] });
  const strips = cloth.map(() => []);
  greens.forEach(([x0, z0, w, across], g) => {
    const fam = FAM[g % FAM.length];
    if (across) for (let i = 0; i < Math.floor(w / 10); i++) strips[fam[i % 3]].push([x0 + i * 10, z0, x0 + i * 10 + 7.5, z0 + 350]);
    else for (let i = 0; i < 30; i++) strips[fam[i % 3]].push([x0, z0 + i * 11.7, x0 + w, z0 + i * 11.7 + 8.8]);
  });
  strips.forEach((list, k) => plan.fill(many(list, ([a, b, c, d]) => plan.rect(a, b, c, d)), { color: cloth[k] }));
  yield;
  // sleeve-makers' yards: long pale workshop roofs in rows, cutting courts between them, gardens beside
  const yards = [[0.31 * C, 2950], [0.66 * C, 800], [0.04 * C, 2250], [0.88 * C, 1850], [0.18 * C, 1000], [0.53 * C, 3010], [0.74 * C, 1500], [0.42 * C, 2300], [0.97 * C, 760]];
  plan.fill(many(yards, ([x0, z0]) => plan.rect(x0 - 20, z0 - 20, x0 + 300, z0 + 230, 10)), { color: '#5e6b78', paved: 0.9, life: 0.6, clear: ['wood'] });
  const roofs = [], ridges = [], courts = [];
  for (const [x0, z0] of yards) for (let i = 0; i < 6; i++) { const zz = z0 + i * 34; roofs.push([x0, zz]); ridges.push([[x0, zz + 10], [x0 + 280, zz + 10]]); if (i % 2) courts.push([x0 + 10, zz + 22]); }
  plan.fill(many(roofs, ([x, z]) => plan.rect(x, z, x + 280, z + 21, 2)), { color: '#fbfdff', clear: ['life'] });
  plan.stroke(many(ridges, (t) => plan.line(t)), 1.6, { color: '#9aa7b6' });
  const awn = ['#e8563a', '#f2c14e', '#2f9e96'];
  awn.forEach((c, k) => plan.fill(many(courts.filter((_, i) => i % 3 === k), ([x, z]) => plan.rect(x + k * 80, z, x + k * 80 + 60, z + 9, 1)), { color: c }));
  const gcol = ['#e7a7b8', '#f2d27a', '#b9a8dc'], beds = gcol.map(() => []);
  yards.forEach(([x0, z0], y) => { for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) beds[(i + j + y) % 3].push([x0 + 322 + i * 20, z0 + 4 + j * 23]); });
  plan.fill(many(yards, ([x0, z0]) => plan.rect(x0 + 318, z0, x0 + 442, z0 + 120, 6)), { color: '#7fa86f', life: 0.5, clear: ['wood'] });
  beds.forEach((list, k) => plan.fill(many(list, ([x, z]) => plan.rect(x, z, x + 15, z + 17, 3)), { color: gcol[k] }));
  yield;
  // woods in clumps, painted a colour at a time
  const clumpCols = ['#4f7457', '#476b50', '#5a7f5c', '#3f6249'], clumps = clumpCols.map(() => []);
  for (let i = 0; i < 420; i++) {
    const x = rng.f(0, C), z = rng.f(720, L - 720), r = rng.f(12, 46);
    if (Math.abs(x - LX) < 430 && Math.abs(z - LZ) < 830) continue;
    clumps[i % 4].push(plan.blob(x, z, r, r * rng.f(0.6, 1.1), { wobble: 0.3, lobes: 4, seed: i + 1, n: 20 }));
  }
  clumps.forEach((list, k) => plan.fill(many(list, (p) => p), { color: clumpCols[k], wood: 0.85, clear: ['life', 'rows'] }));
  yield;
  // walks, and avenues along the long ones
  const ring = (z, wob) => { const a = []; for (let i = 0; i <= 120; i++) a.push([(i / 120) * C, z + Math.sin(i * 0.29 + z) * wob]); return a; };
  const walks = [], longs = [];
  for (let k = 0; k < 9; k++) walks.push(ring(760 + k * 280, 30));
  for (let i = 0; i < 16; i++) { const x = (i / 16) * C, w = [[x, 720], [x + 70, 1500], [x - 50, 2300], [x, L - 720]]; walks.push(w); longs.push(w); }
  plan.stroke(many(walks, (w) => plan.curve(w)), 7, { color: '#e3e8ec', paved: 0.8, life: 0.8, clear: ['wood'] });
  const trees = [];
  for (const w of longs.filter((_, i) => i % 2 === 0)) for (let i = 0; i < w.length - 1; i++) {
    const [a, b] = [w[i], w[i + 1]], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len * 9, nz = (b[0] - a[0]) / len * 9;
    for (let d = 0; d < len; d += 19) { const t = d / len, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; trees.push([x + nx, z + nz], [x - nx, z - nz]); }
  }
  plan.dots(trees, 4.4, { color: '#3f6a4a', wood: 1 });
}

// ---------------------------------------------------------------- a flyer in wing-sleeves: lying along +z, back up (+y)
// The tint weight says what a face is: 1 top, 0.85 legs, 0.7 sleeve, 0.6 sleeve band (sleeve or hem colour, by flyer),
// 0.5 hem, 0.3 skin, 0.15 hair, 0 its own colour. An adult is about 1.8 m from crown to heel at scale 1.
const S_SH = [0.19, 0.0, 0.25], S_EL = [0.5, 0.03, 0.37], S_WR = [0.82, 0.03, 0.46], S_HIP = [0.16, 0.0, -0.31];
const bez = (a, b, c, d, t) => { const u = 1 - t; return [0, 1, 2].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]); };
function sleeve(g, s, n) {
  // a taut membrane from the arm to the hip, its trailing edge drawn in; bands across it from hem to trailing edge
  const X = (p) => [p[0] * s, p[1], p[2]];
  const lead = (t) => bez(S_SH, [0.3, 0.02, 0.31], [0.62, 0.03, 0.42], S_WR, t);
  const trail = (t) => bez(S_HIP, [0.44, 0.0, -0.2], [0.71, 0.02, 0.17], S_WR, t);
  const vs = [0, 0.13, 0.62, 0.8, 1], parts = [0.5, 0.7, 0.6, 0.7];
  const P = (i, j) => { const t = i / n, v = vs[j], a = lead(t), b = trail(t), q = mix3(a, b, v); q[1] += 0.05 * Math.sin(Math.PI * v) * Math.sin(Math.PI * Math.pow(t, 0.7)); return X(q); };
  for (let j = 0; j < 4; j++) {
    g.tint(parts[j]);
    for (let i = 0; i < n; i++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      if (s > 0) { g.tri(a, b, c, '#ffffff'); if (i < n - 1) g.tri(a, c, d, '#ffffff'); }
      else { g.tri(a, c, b, '#ffffff'); if (i < n - 1) g.tri(a, d, c, '#ffffff'); }
    }
  }
}
function taper(g, z0, w0, h0, z1, w1, h1, col, y0 = 0) {
  const p = (z, w, h, sx, sy) => [sx * w / 2, y0 + sy * h / 2, z];
  const A = [p(z0, w0, h0, -1, -1), p(z0, w0, h0, 1, -1), p(z0, w0, h0, 1, 1), p(z0, w0, h0, -1, 1)];
  const B = [p(z1, w1, h1, -1, -1), p(z1, w1, h1, 1, -1), p(z1, w1, h1, 1, 1), p(z1, w1, h1, -1, 1)];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; g.quad(A[i], A[j], B[j], B[i], col); }
  g.quad(A[3], A[2], A[1], A[0], col); g.quad(B[0], B[1], B[2], B[3], col);
}
function flyerNearGeo() {
  const g = new Geo();
  g.tint(1); taper(g, 0.3, 0.4, 0.2, -0.33, 0.32, 0.18, '#ffffff');
  g.tint(0.3).blob(0, 0.03, 0.43, [0.1, 0.115, 0.115], 1, '#ffffff', { shadeBottom: 0.75 });
  g.tint(0.15).blob(0, 0.075, 0.4, [0.112, 0.1, 0.115], 0, '#ffffff', { shadeBottom: 0.85 });
  for (const s of [-1, 1]) {
    g.tint(0.5).tube([[0.17 * s, 0.0, 0.24], [S_EL[0] * s, S_EL[1], S_EL[2]], [S_WR[0] * s, S_WR[1], S_WR[2]]], 0.048, 6, '#ffffff');
    g.tint(0.3).blob(0.855 * s, 0.03, 0.475, 0.05, 0, '#ffffff', { shadeBottom: 0.8 });
    g.tint(0.85).tube([[0.085 * s, -0.01, -0.28], [0.12 * s, -0.02, -0.74], [0.15 * s, -0.03, -1.15]], (t) => 0.075 - 0.025 * t, 6, '#ffffff');
    g.tint(0).box(0.15 * s - 0.05, -0.09, -1.31, 0.15 * s + 0.05, 0.03, -1.13, '#2a2f36');
    sleeve(g, s, 6);
  }
  g.tint(0);
  return g.build();
}
function flyerFarGeo() {
  const g = new Geo();
  g.tint(1).box(-0.19, -0.1, -0.33, 0.19, 0.1, 0.28, '#ffffff');
  g.tint(0.3).blob(0, 0.03, 0.42, 0.13, 0, '#ffffff', { shadeBottom: 0.8 });
  g.tint(0.85).box(-0.16, -0.07, -1.25, 0.16, 0.06, -0.33, '#ffffff');
  for (const s of [-1, 1]) {
    const X = (p) => [p[0] * s, p[1], p[2]], mid = [0.5, 0.02, 0.1];
    const tri = (a, b, c) => { if (s > 0) g.tri(X(a), X(b), X(c), '#ffffff'); else g.tri(X(a), X(c), X(b), '#ffffff'); };
    g.tint(0.7); tri(S_SH, mid, S_HIP); tri(mid, S_WR, [0.6, 0.02, 0.0]); tri(S_HIP, mid, [0.6, 0.02, 0.0]);
    g.tint(0.5); tri(S_SH, S_WR, mid);
  }
  g.tint(0);
  return g.build();
}

// shared by both kinds: pose, colour, light. aLook: legs colour, hair colour, banded sleeves, which way the back faces
// (far flyers only); aPose: arms swept forward, legs apart, kick, seed (x 1000) + scale
const FLY_COMMON = /* glsl */`
attribute vec4 aCol; attribute float aEmit;
attribute vec3 aCloth; attribute vec3 aSleeve; attribute vec3 aTrim; attribute vec3 aSkin; attribute vec4 aLook; attribute vec4 aPose;
uniform float uTime;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vSleeve;
const vec3 LEGS[6] = vec3[6](vec3(0.042, 0.058, 0.08), vec3(0.028, 0.044, 0.102), vec3(0.147, 0.195, 0.262), vec3(0.195, 0.069, 0.027), vec3(0.479, 0.392, 0.246), vec3(0.023, 0.028, 0.037));
const vec3 HAIR[6] = vec3[6](vec3(0.02, 0.012, 0.008), vec3(0.08, 0.04, 0.02), vec3(0.3, 0.16, 0.06), vec3(0.55, 0.38, 0.18), vec3(0.17, 0.05, 0.02), vec3(0.008, 0.008, 0.01));
void flyerOut(vec3 pos, vec3 f, vec3 bk) {
  vec3 sd = cross(bk, f);
  float seed = floor(aPose.w) / 1000.0, scale = fract(aPose.w) * 2.0;
  vec3 p = position;
  float side = sign(p.x);
  // legs: apart, and a slow kick
  float lw = clamp((-0.3 - p.z) / 0.9, 0.0, 1.0) * step(abs(p.x), 0.32);
  p.x += side * aPose.y * lw * 0.35;
  p.y += sin(uTime * 2.1 + seed * 40.0 + side * 1.7) * aPose.z * lw * 0.14;
  // arms and sleeves: swept forward or back, and the sleeves working a little
  float aw = clamp((abs(p.x) - 0.19) / 0.63, 0.0, 1.0) * step(-0.34, p.z);
  p.z += aPose.x * aw * 0.3;
  p.y += sin(uTime * (1.3 + fract(seed * 31.0) * 1.4) + seed * 70.0) * 0.08 * aw * aw;
  // a child's head is bigger for her size
  if (scale < 0.8 && p.z > 0.33 && abs(p.x) < 0.2) p = vec3(0.0, 0.04, 0.42) + (p - vec3(0.0, 0.04, 0.42)) * 1.25;
  p *= scale;
  vec3 wpos = pos + sd * p.x + bk * p.y + f * p.z;
  vN = sd * normal.x + bk * normal.y + f * normal.z;
  float part = aCol.a;
  vec3 col = aCol.rgb;
  vSleeve = 0.0;
  if (part > 0.92) col *= aCloth;
  else if (part > 0.77) col *= LEGS[int(aLook.x * 5.99)];
  else if (part > 0.65) { col *= aSleeve; vSleeve = 1.0; }
  else if (part > 0.55) { col *= aLook.z > 0.5 ? aTrim : aSleeve; vSleeve = 1.0; }
  else if (part > 0.4) { col *= aTrim; vSleeve = 0.6; }
  else if (part > 0.22) col *= aSkin;
  else if (part > 0.07) col *= HAIR[int(aLook.y * 5.99)];
  vCol = col;
  vW = wpos;
  gl_Position = projectionMatrix * viewMatrix * vec4(wpos, 1.0);
}`;
// far flyers move by a rule the GPU knows (and flyerState() below repeats in JS):
//   aA: x loop seconds, y phase, z mode (0 a lane, straight as the drum sees it; 1 free, straight in the frame that does
//   not turn, ending in the net at aA.w seconds; 2 hovering), w seconds to the net
const FAR_VERT = /* glsl */`
attribute vec4 aP0; attribute vec3 aV; attribute vec4 aA;
uniform float uOmega;
${FLY_COMMON}
void main() {
  float T = aA.x, mode = aA.z, seed = floor(aPose.w) / 1000.0, show = 1.0;
  vec3 pos, f;
  if (mode < 0.5) {
    float u = fract(uTime / T + aA.y);
    show = smoothstep(0.0, 0.04, u) * smoothstep(1.0, 0.96, u);
    pos = aP0.xyz + aV * (u * T); f = normalize(aV);
  } else if (mode < 1.5) {
    float u = fract(uTime / T + aA.y), tau = min(u * T, aA.w);
    show = smoothstep(0.0, 0.04, u) * smoothstep(1.0, 0.96, u);
    vec3 q = aP0.xyz + aV * tau; float a = -uOmega * tau, c = cos(a), s = sin(a);
    pos = vec3(c * q.x - s * q.y, s * q.x + c * q.y, q.z);
    vec3 v = vec3(c * aV.x - s * aV.y, s * aV.x + c * aV.y, aV.z) + uOmega * vec3(pos.y, -pos.x, 0.0);
    f = u * T > aA.w ? normalize(vec3(pos.xy, 0.0)) : normalize(v);
  } else {
    float k = seed * 17.0;
    pos = aP0.xyz + 0.3 * vec3(sin(uTime * 0.7 + k), cos(uTime * 0.6 + k * 1.3), sin(uTime * 0.5 + k * 0.7));
    f = normalize(aV);
  }
  vec3 rf = aLook.w > 0.5 ? vec3(0.0, 0.0, 1.0) : -normalize(vec3(pos.xy, 0.0) + vec3(1e-4, 0.0, 0.0));
  vec3 bk = rf - f * dot(rf, f);
  bk = dot(bk, bk) < 1e-4 ? normalize(cross(f, vec3(0.0, 1.0, 0.0))) : normalize(bk);
  float roll = 0.15 * sin(uTime * 0.8 + seed * 17.0), cr = cos(roll), sr = sin(roll);
  vec3 sd = cross(bk, f);
  bk = bk * cr - sd * sr;
  if (show < 0.01 || aP0.w > 0.5) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); return; }
  flyerOut(pos, f, bk);
}`;
// near flyers are posed in JS every frame
const NEAR_VERT = /* glsl */`
attribute vec3 aPos; attribute vec3 aF; attribute vec3 aU;
${FLY_COMMON}
void main() { flyerOut(aPos, normalize(aF), normalize(aU)); }`;
const flyFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vSleeve;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 Lg = kLight(vW, N, vW, N);
  // sleeve cloth is thin: the light behind it comes through, coloured
  Lg += kLight(vW, -N, vW, -N) * 0.5 * vSleeve;
  // and the lit land all round fills the shade a little
  Lg += uAmb * 0.45;
  gl_FragColor = vec4(kAir(vCol * Lg, vW), 1.0);
}`;

// where a far flyer is at clock t, as the shader has it; with full, also which way it faces. Returns false when unseen.
function flyerState(it, t, out, full) {
  const [T, ph, mode, tHit] = it.A;
  let f = null;
  if (mode < 0.5) {
    const u = ((t / T + ph) % 1 + 1) % 1;
    if (u < 0.004 || u > 0.996) return false;
    out.pos = add3(it.p0, it.v, u * T); if (full) f = nrm3(it.v);
  } else if (mode < 1.5) {
    const u = ((t / T + ph) % 1 + 1) % 1, tau = Math.min(u * T, tHit);
    if (u < 0.004 || u > 0.996) return false;
    out.pos = freeAt(it.p0, it.v, tau);
    if (full) f = u * T > tHit ? nrm3([out.pos[0], out.pos[1], 0]) : nrm3(freeVel(it.p0, it.v, tau));
  } else {
    const k = Math.floor(it.seed * 1000) / 1000 * 17;
    out.pos = add3(it.p0, [Math.sin(t * 0.7 + k), Math.cos(t * 0.6 + k * 1.3), Math.sin(t * 0.5 + k * 0.7)], 0.3);
    if (full) f = nrm3(it.v);
  }
  if (!full) return true;
  const rf = it.look[3] > 0.5 ? ZAX : nrm3([-out.pos[0] - 1e-4, -out.pos[1], 0]);
  let bk = sub3(rf, f.map((x) => x * dot3(rf, f)));
  bk = dot3(bk, bk) < 1e-4 ? nrm3(cross3(f, [0, 1, 0])) : nrm3(bk);
  const roll = 0.15 * Math.sin(t * 0.8 + Math.floor(it.seed * 1000) / 1000 * 17), sd = cross3(bk, f);
  out.f = f; out.bk = add3(bk.map((x) => x * Math.cos(roll)), sd, -Math.sin(roll));
  return true;
}
const poseW = (it) => Math.floor(it.seed * 1000) + Math.min(it.scale, 1.99) / 2;
function colourAttrs(g, n) {
  const a = {};
  for (const [k, s] of [['aCloth', 3], ['aSleeve', 3], ['aTrim', 3], ['aSkin', 3], ['aLook', 4], ['aPose', 4]]) { a[k] = new InstancedBufferAttribute(new Float32Array(n * s), s); g.setAttribute(k, a[k]); }
  return a;
}
function writeLooks(a, i, it) {
  a.aCloth.array.set(rgb(it.cloth), i * 3); a.aSleeve.array.set(rgb(it.sleeve), i * 3); a.aTrim.array.set(rgb(it.trim), i * 3); a.aSkin.array.set(rgb(it.skin), i * 3);
  a.aLook.array.set(it.look, i * 4);
  a.aPose.array.set([it.pose[0], it.pose[1], it.pose[2], poseW(it)], i * 4);
}
function baseGeo(base) {
  const g = new InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'aCol', 'aEmit']) g.setAttribute(k, base.getAttribute(k));
  g.boundingSphere = new Sphere(new Vector3(0, 0, 150), 400);
  return g;
}
function farFlyers(rig, items, uni) {
  const g = baseGeo(flyerFarGeo()), n = items.length;
  const P0 = new InstancedBufferAttribute(new Float32Array(n * 4), 4), V = new InstancedBufferAttribute(new Float32Array(n * 3), 3), A = new InstancedBufferAttribute(new Float32Array(n * 4), 4);
  g.setAttribute('aP0', P0); g.setAttribute('aV', V); g.setAttribute('aA', A);
  const a = colourAttrs(g, n);
  items.forEach((it, i) => { P0.array.set([...it.p0, 0], i * 4); V.array.set(it.v, i * 3); A.array.set(it.A, i * 4); writeLooks(a, i, it); });
  g.instanceCount = n;
  const mesh = new Mesh(g, new ShaderMaterial({ uniforms: { ...rig.uniforms, ...uni }, vertexShader: FAR_VERT, fragmentShader: flyFrag(rig), side: DoubleSide }));
  mesh.frustumCulled = false;
  return { mesh, hide: P0 };
}
function nearFlyers(rig, cap, uni) {
  const g = baseGeo(flyerNearGeo());
  const pos = new InstancedBufferAttribute(new Float32Array(cap * 3), 3), F = new InstancedBufferAttribute(new Float32Array(cap * 3), 3), U = new InstancedBufferAttribute(new Float32Array(cap * 3), 3);
  g.setAttribute('aPos', pos); g.setAttribute('aF', F); g.setAttribute('aU', U);
  const a = colourAttrs(g, cap);
  g.instanceCount = 0;
  const mesh = new Mesh(g, new ShaderMaterial({ uniforms: { ...rig.uniforms, ...uni }, vertexShader: NEAR_VERT, fragmentShader: flyFrag(rig), side: DoubleSide }));
  mesh.frustumCulled = false;
  const looks = new Array(cap).fill(null);
  return {
    mesh, cap,
    set(i, st, it) {
      pos.array.set(st.pos, i * 3); F.array.set(st.f, i * 3); U.array.set(st.bk, i * 3);
      if (looks[i] !== it) { looks[i] = it; writeLooks(a, i, it); for (const k in a) a[k].needsUpdate = true; }
    },
    done(n) { g.instanceCount = n; pos.needsUpdate = true; F.needsUpdate = true; U.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------- the net: a sock of diamond mesh
// Close to, each thread is a fine bright line in the light coming down the hall; far off, or seen edge on, the threads
// close up into a dark veil, so the net darkens toward its edges and the lit land shows through where you look straight out.
const NET_VERT = /* glsl */`
attribute vec2 aM;
varying vec3 vW; varying vec2 vM; varying vec3 vN;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vM = aM; vN = normal;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const netFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform float uCell, uRope, uMainU, uMainV, uMainW, uOpacity; uniform vec3 uThread, uDark, uMain;
varying vec3 vW; varying vec2 vM; varying vec3 vN;
${rig.glsl}
float kLines(float t, float w, float p) {
  p = max(p, 1e-4);
  float a = t - 0.5 * p + 0.5 * w, b = t + 0.5 * p + 0.5 * w;
  float g1 = floor(a) * w + min(fract(a), w), g2 = floor(b) * w + min(fract(b), w);
  return clamp((g2 - g1) / p, 0.0, 1.0);
}
void main() {
  ${CLIP_FRAG}
  vec2 d = vec2(vM.x + vM.y, vM.x - vM.y) / uCell;
  vec2 pw = fwidth(d);
  float w = uRope / uCell;
  float c1 = kLines(d.x, w, pw.x), c2 = kLines(d.y, w, pw.y);
  vec2 mm = vM / vec2(uMainU, uMainV); vec2 pm = fwidth(mm);
  float c3 = kLines(mm.x, uMainW / uMainU, pm.x), c4 = kLines(mm.y, uMainW / uMainV, pm.y);
  float fine = 1.0 - (1.0 - c1) * (1.0 - c2), main = 1.0 - (1.0 - c3) * (1.0 - c4);
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  float ndv = abs(dot(N, V));
  // how well the fine threads are resolved: a thread wider than a pixel's share of a cell shines; a blur of them is dark
  float res = smoothstep(0.55, 0.12, max(pw.x, pw.y)) * smoothstep(0.08, 0.3, ndv) * smoothstep(110.0, 35.0, length(cameraPosition - vW));
  vec3 Lg = (kLight(vW, N, vW, N) + kLight(vW, -N, vW, -N)) * 0.5 + uAmb * 0.25;
  // the threads catch the light that comes down the hall from the lit line
  float sheen = 0.6 + 1.2 * pow(clamp(1.0 - abs(V.z), 0.0, 1.0), 2.0);
  vec3 cf = mix(uDark, uThread * sheen, res);
  float a = 1.0 - (1.0 - fine * uOpacity) * (1.0 - main);
  vec3 col = (cf * fine * uOpacity + uMain * sheen * main) / max(fine * uOpacity + main, 1e-4);
  a = 1.0 - pow(max(1.0 - a, 0.0), 1.0 / max(ndv, 0.07));
  col = mix(col, uDark, smoothstep(0.35, 0.05, ndv) * 0.7);
  gl_FragColor = vec4(kAir(col * Lg, vW), a);
}`;

function netMesh(rig) {
  const pos = [], nrm = [], m = [], idx = [];
  const NA = 200, NZ = 16, circ = 2 * Math.PI * NET_R;
  for (let j = 0; j <= NZ; j++) {
    const z = NET_Z0 + (NET_Z1 - NET_Z0) * (j / NZ);
    for (let i = 0; i <= NA; i++) { const a = (i / NA) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(NET_R * c, NET_R * s, z); nrm.push(-c, -s, 0); m.push((i / NA) * circ, z); }
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  // the net across its end
  const s0 = pos.length / 3, NR = 10;
  for (let j = 0; j <= NR; j++) {
    const r = 1.8 + (NET_R - 1.8) * Math.pow(j / NR, 0.8);
    for (let i = 0; i <= NA; i++) { const a = (i / NA) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(r * c, r * s, NET_Z1); nrm.push(0, 0, -1); m.push(r * c, r * s); }
  }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = s0 + j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('aM', new Float32BufferAttribute(m, 2));
  g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(0, 0, (NET_Z0 + NET_Z1) / 2), 190);
  const v3 = (c) => new Vector3(...rgb(c));
  const mat = new ShaderMaterial({
    uniforms: {
      ...rig.uniforms, uClip: G.uClip,
      uCell: { value: circ / 400 }, uRope: { value: 0.06 }, uMainU: { value: circ / 24 }, uMainV: { value: 24 }, uMainW: { value: 0.18 },
      uOpacity: { value: 0.95 }, uThread: { value: v3('#fbfdff') }, uDark: { value: v3('#1e2328') }, uMain: { value: v3('#d6dde6') },
    },
    vertexShader: NET_VERT, fragmentShader: netFrag(rig), side: DoubleSide, transparent: true, depthWrite: false,
  });
  const mesh = new Mesh(g, mat);
  mesh.renderOrder = 4;
  return mesh;
}

// ---------------------------------------------------------------- hoops
const HOOP_COLS = [['#e8563a', '#fbfdff'], ['#f2c14e', '#1e2328'], ['#2f9e96', '#fbfdff'], ['#3f6fc0', '#f2c14e'], ['#fbfdff', '#e8563a'], ['#a34b86', '#fbfdff']];
function basisAt(c, n, upHint) {
  const z = new Vector3(...n).normalize();
  const y = new Vector3(...upHint); y.addScaledVector(z, -y.dot(z));
  if (y.lengthSq() < 1e-6) y.set(0, 0, 1).addScaledVector(z, -z.z);
  y.normalize();
  const x = new Vector3().crossVectors(y, z);
  return new Matrix4().makeBasis(x, y, z).setPosition(c[0], c[1], c[2]);
}
// a ring in its own xy plane: R round, r thick
function torus(g, R, r, segs, sides, colAt, emit = 0) {
  const P = (a, b) => [(R + r * Math.cos(b)) * Math.cos(a), (R + r * Math.cos(b)) * Math.sin(a), r * Math.sin(b)];
  const N = (a, b) => [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2, col = colAt(i);
    for (let j = 0; j < sides; j++) {
      const b0 = (j / sides) * Math.PI * 2, b1 = ((j + 1) / sides) * Math.PI * 2;
      g.tri(P(a0, b0), P(a1, b0), P(a1, b1), col, emit, N(a0, b0), N(a1, b0), N(a1, b1));
      g.tri(P(a0, b0), P(a1, b1), P(a0, b1), col, emit, N(a0, b0), N(a1, b1), N(a0, b1));
    }
  }
}
// a padded hoop in its own xy plane, and lines from its rim out to the net
function addHoop(g, m, R, pad, cols, bands, lines) {
  g.push(m);
  torus(g, R, pad, bands * 3, 5, (i) => cols[Math.floor(i / 3) % cols.length]);
  g.pop();
  const c = new Vector3().setFromMatrixPosition(m), X = new Vector3().setFromMatrixColumn(m, 0), Y = new Vector3().setFromMatrixColumn(m, 1);
  for (let k = 0; k < lines; k++) {
    const a = (k / lines) * Math.PI * 2 + 0.4, dir = X.clone().multiplyScalar(Math.cos(a)).addScaledVector(Y, Math.sin(a));
    const p = c.clone().addScaledVector(dir, R + pad);
    const dx = dir.x, dy = dir.y, A = dx * dx + dy * dy, B = 2 * (p.x * dx + p.y * dy), Cc = p.x * p.x + p.y * p.y - NET_R * NET_R;
    if (A < 1e-4) continue;
    const s = (-B + Math.sqrt(Math.max(B * B - 4 * A * Cc, 0))) / (2 * A);
    const q = p.clone().addScaledVector(dir, s);
    if (q.z < NET_Z0 || q.z > NET_Z1) continue;
    g.tube([[p.x, p.y, p.z], [q.x, q.y, q.z]], 0.035, 3, '#9aa7b6');
  }
}

// ---------------------------------------------------------------- the story
const _qa = new Quaternion(), _qb = new Quaternion(), _m4 = new Matrix4(), _va = new Vector3(), _vb = new Vector3(), _vc = new Vector3();
// a facing (f forward, bk the back) as a turn, and back again
function quatOf(f, bk, out) { const F = _va.set(...f), B = _vb.set(...bk), S = _vc.crossVectors(B, F); _m4.makeBasis(S, B, F); return out.setFromRotationMatrix(_m4); }
function facingOf(q) { const F = new Vector3(0, 0, 1).applyQuaternion(q), B = new Vector3(0, 1, 0).applyQuaternion(q); return [[F.x, F.y, F.z], [B.x, B.y, B.z]]; }
function slerpFacing(fa, ba, fb, bb, s) { quatOf(fa, ba, _qa); quatOf(fb, bb, _qb); _qa.slerp(_qb, s); return facingOf(_qa); }
const ortho = (v, f) => nrm3(sub3(v, f.map((x) => x * dot3(v, f))));
// turn v about the unit axis k by angle a
function turn(v, k, a) { const c = Math.cos(a), s = Math.sin(a), kv = cross3(k, v), d = dot3(k, v); return [0, 1, 2].map((i) => v[i] * c + kv[i] * s + k[i] * d * (1 - c)); }
// progress 0..1 between t0 and t1, speeding up over ta seconds and slowing over td
function trapezoid(t, t0, t1, ta, td) {
  const D = t1 - t0, x = Math.min(Math.max(t - t0, 0), D), v = 1 / (D - ta / 2 - td / 2);
  if (x < ta) return 0.5 * v * x * x / ta;
  if (x < D - td) return v * (ta / 2 + (x - ta));
  return 1 - 0.5 * v * (D - x) * (D - x) / td;
}
// a lengthwise way along the hall from A to B (angle, radius, z), dipping in toward the axis on the way
function lengthwise(A, B, s, dip) { const k = sstep(0, 1, s); return cyl(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * s - dip * Math.sin(Math.PI * s), A[2] + (B[2] - A[2]) * s); }

export function kittiwakeStory() {
  const P0 = cyl(AL, RAIL - 0.8, ZR), H = cyl(A_HOOP, HOOP_R, HOOP_Z);
  const Vc = aimV(P0, H, T_X), vEnd = freeVel(P0, Vc, T_X), side = nrm3(cross3(vEnd, ZAX));
  const f0 = nrm3(relU(P0, Vc)), bk0 = ortho(ZAX, f0);
  const Pt0 = add3(add3(P0, spinward(AL), -1.9), ZAX, 0.6);
  const Hb = add3(add3(H, side, 0.9), ZAX, -0.3), Ht = add3(add3(H, side, -2.0), ZAX, 0.5);
  const Vb = aimV(P0, Hb, T_X), Vt = aimV(Pt0, Ht, T_X - 0.35);
  const C0 = add3(add3(P0, f0, -4.2), ZAX, -2.6);
  const Vcam = aimV(C0, H, T_X + CAM_LAG);
  const cast = [];
  // the two of them: from the gate along the hall, to the rail, and across
  const pair = (who, start, end, V, tx, t0, t1, wob) => (t, out) => {
    const bob = [Math.sin(t * 0.9 + t0 * 3) * 0.12, Math.cos(t * 0.7 + t0) * 0.12, Math.sin(t * 0.5) * 0.1];
    if (t < T_GO) {
      const s = trapezoid(t, t0, t1, 3.2, 3.6);
      const A = [AS + (who ? 1.6 : 0), 69.5 - (who ? 0.8 : 0), 12.6], B = [Math.atan2(start[1], start[0]) / DEG, r2(start), start[2]];
      const p = lengthwise(A, B, s, 7), p2 = lengthwise(A, B, Math.min(s + 0.002, 1), 7);
      out.pos = add3(p, bob, s > 0 && s < 1 ? 0.2 : 1);
      const tan = s < 0.998 ? nrm3(sub3(p2, p)) : ZAX;
      const roll = Math.PI * sstep(13.5, 21, t);
      let f = s < 0.02 ? [0, 0, 1] : tan, bk = turn(ortho(nrm3([-p[0], -p[1], 0]), f), f, roll);
      const k = sstep(t1 - 3.2, t1 - 0.2, t);
      if (k > 0) [f, bk] = slerpFacing(f, bk, f0, bk0, k);
      out.f = f; out.bk = bk;
    } else {
      const tau = t - T_GO, e = sstep(0, 0.9, tau);
      out.pos = mix3(add3(start, bob), freeAt(start, V, Math.min(tau, tx + 3)), e);
      const fi = rotZ(f0, -W * tau), fr = nrm3(freeVel(start, V, tau));
      const f = nrm3(mix3(fi, fr, sstep(tx - 9, tx - 2, tau)));
      out.f = f; out.bk = ortho(ZAX, f);
    }
    const w = wob * Math.sin(t * 1.1 + t0 * 5);
    out.bk = turn(out.bk, out.f, w);
    return true;
  };
  const look = (legs, hair, banded) => [legs, hair, banded ? 1 : 0, 1];
  const beginner = { state: pair(0, P0, Hb, Vb, T_X, 1.3, T_ARR, 0.2), cloth: '#3f6fc0', sleeve: '#f2c14e', trim: '#1e2328', skin: SKIN[2], look: look(0.4, 0.15, false), pose: [0.18, 0.22, 0.7], scale: 1.0, seed: 0.311, who: 'beginner' };
  const teacher = { state: pair(1, Pt0, Ht, Vt, T_X - 0.35, 0.9, T_ARR - 0.3, 0.04), cloth: '#e8563a', sleeve: '#fbfdff', trim: '#e8563a', skin: SKIN[0], look: look(0.55, 0.5, true), pose: [0.0, 0.06, 0.15], scale: 0.7, seed: 0.733, who: 'teacher' };
  cast.push(beginner, teacher);

  // three grown-ups who aim at their hoops, or not wide enough, and sail past them into the net
  const misses = [];
  const miss = (da, tL, tx, eps, cloth, sleeve, trim, skin, seed) => {
    const A = cyl(AL + da, RAIL - 0.8, ZR), Hm = cyl(A_HOOP + da, HOOP_R, HOOP_Z);
    // aimed a few degrees off the hoop, whichever way keeps them farther from the spar
    const axisMin = (V) => { let m = 1e9; for (let t = 0; t < tx; t += 0.25) m = Math.min(m, r2(freeAt(A, V, t))); return m; };
    const Va = aimV(A, cyl(A_HOOP + da + eps, HOOP_R, HOOP_Z), tx), Vo = aimV(A, cyl(A_HOOP + da - eps, HOOP_R, HOOP_Z), tx);
    const V = axisMin(Va) > axisMin(Vo) ? Va : Vo, fa = nrm3(relU(A, V));
    let hit = 40; for (let t = 0; t < 40; t += 0.05) if (r2(freeAt(A, V, t)) > 73.6) { hit = t; break; }
    const P = freeAt(A, V, hit), fN = nrm3([P[0], P[1], 0]);
    misses.push({ A, Hm, V, tL, hit });
    cast.push({
      state(t, out) {
        const tau = t - tL, bob = [Math.sin(t * 0.8 + seed * 9) * 0.15, Math.cos(t * 0.6 + seed * 5) * 0.15, 0];
        if (tau < 0) { out.pos = add3(A, bob); out.f = fa; out.bk = ortho(ZAX, fa); return true; }
        if (tau < hit) {
          out.pos = mix3(add3(A, bob), freeAt(A, V, tau), sstep(0, 0.8, tau));
          const f = rotZ(fa, -W * tau); out.f = f; out.bk = turn(ortho(ZAX, f), f, 0.35 * Math.sin(t * 1.3 + seed * 7));
          return true;
        }
        // in the net, spread out against it, bouncing a little
        const k = Math.exp(-(tau - hit) * 1.2) * Math.sin((tau - hit) * 5);
        out.pos = add3(P, fN, 0.5 + 0.6 * k);
        out.f = nrm3(add3(fN, ZAX, 0.3)); out.bk = ortho(ZAX, out.f);
        out.bk = turn(out.bk, out.f, 0.2 * Math.sin(t * 0.7 + seed * 3));
        return true;
      },
      cloth, sleeve, trim, skin, look: [0.3 + seed * 0.4, seed, seed > 0.5 ? 1 : 0, 1], pose: [0.25, 0.35, 1.0], scale: 1.0, seed, who: 'miss',
    });
  };
  miss(40, -6, T_X, 7, '#a34b86', '#2f9e96', '#fbfdff', SKIN[4], 0.52);
  miss(13, 24.5, T_X, 7, '#d7d2c4', '#e8563a', '#f2c14e', SKIN[1], 0.18);
  miss(26, 19, T_X, 7, '#2f3b45', '#6cc0dc', '#3f6fc0', SKIN[3], 0.87);

  // ---- the camera
  const st = { pos: null, f: null, bk: null };
  const at = (who, t) => { who.state(t, st); return { pos: st.pos, f: st.f, bk: st.bk }; };
  const mid = (t) => { const a = at(beginner, t), b = at(teacher, t); return { pos: mix3(a.pos, b.pos, 0.4), f: a.f, bk: a.bk }; };
  const key = (t, p, lookP, up, fov) => ({ t, p, look: add3(p, nrm3(sub3(lookP, p)), 30), up, fov });
  const keys = [];
  { const p0 = cyl(-13, 67.8, 7.4), m = mid(0), p = mix3(p0, m.pos, 0.42); keys.push({ t: 0, p: p0, up: inward(-16) }); keys.push(key(1.8, p, add3(mid(1.8).pos, ZAX, 3), inward(-13))); }
  // following: behind (D), above their backs (U) and to one side (S), as they roll over on the way
  // [t, behind, above, aside, how far ahead it looks (1) or at them (0)]: behind, then above them looking down at their
  // sleeves against the land, then behind again with the rail ahead
  const OFF = [[3.2, 6.0, 1.6, 1.0, 1], [6.4, 5.0, 1.4, 1.8, 1], [9.4, 1.0, 8.6, 1.0, 0], [12.8, 0.4, 9.0, 0.8, 0], [16.2, 4.4, 3.0, 1.6, 0.6], [18.8, 6.0, 2.2, 1.0, 1], [21.4, 5.2, 1.7, 0.6, 1]];
  const offAt = (t) => { let i = 0; while (i < OFF.length - 2 && t > OFF[i + 1][0]) i++; const a = OFF[i], b = OFF[i + 1], s = sstep(a[0], b[0], t); return [1, 2, 3, 4].map((k) => a[k] + (b[k] - a[k]) * s); };
  for (let t = 3.2; t <= 21.45; t += 1.4) {
    const m = mid(t), [D, U, S, ah] = offAt(t), sd = cross3(m.bk, m.f);
    const p = add3(add3(add3(m.pos, m.f, -D), m.bk, U), sd, S);
    keys.push(key(t, p, mix3(add3(m.pos, m.f, 0.8), add3(add3(m.pos, m.f, 14), m.bk, 1.2), ah), m.bk, 58 - 14 * (1 - ah)));
  }
  // at the rail: settle behind them, look across at the hoop, then back to them as they go
  const hoopLook = (p) => key(0, p, H, ZAX).look;
  keys.push(key(T_ARR + 0.6, add3(C0, [0.4, 0.2, -0.6]), add3(P0, ZAX, 1.0), ortho(ZAX, f0)));
  keys.push({ t: 25.6, p: add3(C0, [0.2, 0.1, -0.3]), look: hoopLook(C0), up: ZAX, fov: 24 });
  keys.push({ t: 27.4, p: add3(C0, [0.05, 0.03, -0.1]), look: hoopLook(C0), up: ZAX, fov: 24 });
  // across: the camera's own free line; it looks at the two of them (a little over their heads), then turns to the hoop
  const camLook = (tau) => {
    const c = freeAt(C0, Vcam, tau), b = at(beginner, T_GO + tau).pos, tt = at(teacher, T_GO + tau).pos;
    const d1 = nrm3(sub3(add3(mix3(b, tt, 0.4), ZAX, 0.9), c)), d2 = nrm3(sub3(H, c));
    return nrm3(mix3(d1, d2, sstep(T_X * 0.35, T_X * 0.8, tau)));
  };
  const lastTau = T_X + CAM_LAG;
  for (let tau = 0; tau < lastTau - 0.3; tau += 1.0) { const c = freeAt(C0, Vcam, tau); keys.push({ t: T_GO + tau, p: c, look: add3(c, camLook(tau), 30), up: ZAX }); }
  for (const tau of [lastTau, lastTau + 0.8]) { const c = freeAt(C0, Vcam, tau); keys.push({ t: T_GO + tau, p: c, look: add3(c, nrm3(freeVel(C0, Vcam, tau)), 30), up: ZAX }); }
  const exitSpeed = len3(freeVel(C0, Vcam, lastTau));
  return { cast, beginner, teacher, misses, keys, P0, H, side, C0, Vcam, exitSpeed, f0 };
}

// ---------------------------------------------------------------- the world
// Afternoon: the line a little warm, one bank brighter than the other, the Hollow's glow cool and low, so that in the
// hall things are lit from the far end, where the line begins, and the side toward the hub is in shade.
const LIGHT = { sun: '#fff1dc', sunPower: 1.08, sunFar: '#dce6f2', sunFarPower: 0.72, sunAngle: 2.2, sunSharp: 1.3, amb: '#a9b8ca', ambPower: 0.3, bounce: '#a7b893', bouncePower: 0.2, air: '#cfdae6', airDensity: 0.000055 };
const SLEEVES = ['#e8563a', '#f2c14e', '#2f9e96', '#3f6fc0', '#fbfdff', '#ef8a2c', '#a34b86', '#6cc0dc', '#d93a5a', '#1e2328', '#7bc47f', '#5e6b78'];
const OPEN_FOR = 24;

export const kittiwakeCrosswise = {
  id: 'kittiwake-crosswise',
  title: 'Crosswise in the flying hall', drum: 'Kittiwake', row: 'Gull Row', kind: 'a maker drum', light: 18.9,
  line: 'My teacher is nine. Across the axis the drum turns under you, so you aim wide, and on my fourth try I came out at the hoop I\'d aimed for.',
  tone: '#d6dde6', source: 'wander-year.md (Day 60), raft-habitat.md (The sunline and the Spindle), ashgrove.md (Day two)',
  sound: { root: 52, scale: 'lydian', pad: 0.4, air: 0.55, crowd: 0.35, bells: 0.12, bright: 0.7 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    yield 'kittiwake: canvases';
    yield* paintKittiwake(plan);
    yield 'kittiwake: plan';
    // the end walls in feather grey, quieter than the land so the hall's colours stand out against them
    const houses = ['#c3ccd6', '#9aa7b6', '#7d8a99', '#5e6b78', '#b5553f', '#3f8f9a'];
    const wall = { lit: 0.06, crowd: 0.35, stone: '#9aa7b6', stone2: '#7d8a99', houses, houseMix: 0.6, glass: '#1e2328', gardenColor: '#5f8a62', awning: '#e8563a', pave: '#9aa7b6', tiers: { 27: { crowd: 0.8 }, 29: { crowd: 0.9 } } };
    const hollow = yield* buildHollow(ctx, {
      seed: 'kittiwake', plan, light: LIGHT,
      sunline: { power: 9, haloPower: 0.001 },
      ground: { canopy: '#4f7a57', people: 0.6, lamp: 0, sunRod: 30, water: '#6fa3b8', stripes: 0.08 },
      front: wall, back: { ...wall, crowd: 0.25 },
    });
    yield 'kittiwake: hollow';
    const scene = new Scene();
    scene.add(hollow.group);
    const rng = makeRng('kittiwake-hall');
    // in the hall: the line's light comes down it from the far end; the land all round glows in from every side
    const rig = hollowRig({ ...LIGHT, amb: '#b4c2d2', ambPower: 0.42, bouncePower: 0.32 });
    const hallLit = litMaterial(rig, {}), dbl = litMaterial(rig, { side: 'double' });

    const story = kittiwakeStory();
    const exitR = story.exitSpeed / 1.15;
    const path = makePath(story.keys, { entryRadius: 2.4, exitRadius: exitR });
    const track = path.points(0.25, true).map((v) => [v.x, v.y, v.z]);
    // the flight, hashed in 4 m cells, so the crowd can keep out of the lens
    const grid = new Map(), cellK = (cx, cy, cz) => ((cx + 512) * 1024 + (cy + 512)) * 1024 + (cz + 512);
    for (const q of track) { const k = cellK(Math.floor(q[0] / 4), Math.floor(q[1] / 4), Math.floor(q[2] / 4)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(q); }
    const nearTrack = (p, d) => {
      const cx = Math.floor(p[0] / 4), cy = Math.floor(p[1] / 4), cz = Math.floor(p[2] / 4);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
        const list = grid.get(cellK(cx + i, cy + j, cz + k)); if (!list) continue;
        for (const q of list) if ((q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2 < d * d) return true;
      }
      return false;
    };
    // where the two of them cross: the crowd's free crossers keep well clear of it, so the eye has them to rest on
    const story2 = [];
    { const s = { pos: null }; for (let t = T_GO; t < T_GO + T_X; t += 1) { story.beginner.state(t, s); story2.push(s.pos); } }
    const nearStory = (p, d) => story2.some((q) => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 + (q[2] - p[2]) ** 2 < d * d);
    yield 'kittiwake: flight';

    // ---- the net, its ribs, and the push-off rail
    scene.add(netMesh(hollow.rig));
    const ribs = new Geo();
    for (let z = NET_Z0 + 24; z <= NET_Z1; z += 36) { ribs.at(0, 0, Math.min(z, NET_Z1)); torus(ribs, NET_R + 0.3, z >= NET_Z1 - 1 ? 0.45 : 0.28, 64, 4, () => '#c3ccd6'); ribs.pop(); }
    yield 'kittiwake: ribs';
    ribs.at(0, 0, ZR); torus(ribs, RAIL, 0.2, 144, 5, (i) => ['#e8563a', '#fbfdff', '#f2c14e', '#fbfdff'][i % 4]); ribs.pop();
    for (let k = 0; k < 48; k++) { const a = k * 7.5, p = cyl(a, RAIL + 0.2, ZR), q = cyl(a, NET_R, ZR); ribs.tube([p, q], 0.06, 4, '#9aa7b6'); }
    scene.add(ribs.mesh(hallLit));
    yield 'kittiwake: ribs';
    // the hub and the spar, padded and painted where flyers meet them
    const pad = new Geo();
    pad.rot('x', Math.PI / 2);
    pad.lathe(0, 0, 0, [[47.6, 0.3], [41.6, 26], [23.6, 60], [10.6, 120], [5.6, 150], [2.4, 156]], 48, (k) => ['#5e6b78', '#6b7886', '#55616e', '#677482', '#e8563a'][k]);
    pad.pop();
    for (const [z, c] of [[5, '#e8563a'], [14, '#fbfdff'], [23, '#f2c14e'], [38, '#e8563a'], [52, '#fbfdff'], [80, '#2f9e96'], [104, '#f2c14e'], [134, '#e8563a']]) { pad.at(0, 0, z); torus(pad, hubR(z) + 2.0, 0.7, 48, 5, () => c); pad.pop(); }
    for (let z = 156, k = 0; z < NET_Z1; z += 6, k++) { pad.at(0, 0, z); pad.rot('x', Math.PI / 2); pad.cyl(0, 0, 0, 1.65, 1.65, 5.6, 10, k % 5 === 4 ? '#e8563a' : k % 2 ? '#d6dde6' : '#9aa7b6', { cap: false }); pad.pop(); pad.pop(); }
    scene.add(pad.mesh(dbl));
    yield 'kittiwake: hub';
    const lining = new Geo();
    for (let i = 0; i < 96; i++) {
      const a0 = (i / 96) * Math.PI * 2, a1 = ((i + 1) / 96) * Math.PI * 2, c = i % 2 ? '#3a434e' : '#333b45';
      lining.quad([47.6 * Math.cos(a0), 47.6 * Math.sin(a0), 0.15], [74.9 * Math.cos(a0), 74.9 * Math.sin(a0), 0.15], [74.9 * Math.cos(a1), 74.9 * Math.sin(a1), 0.15], [47.6 * Math.cos(a1), 47.6 * Math.sin(a1), 0.15], c, 0.04);
    }
    scene.add(lining.mesh(dbl));
    const lamps = [];
    for (const [r, z] of [[47.8, 1], [41.8, 26], [23.8, 60], [10.8, 120], [62, 0.4]]) for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; lamps.push({ p: [r * Math.cos(a), r * Math.sin(a), z], color: '#ffe9c8', power: 5, size: 0.35 }); }
    for (let k = 0; k < 96; k++) lamps.push({ p: cyl(k * 3.75 + 1.9, RAIL + 0.3, ZR), color: '#fff1d6', power: 3.5, size: 0.22 });
    yield 'kittiwake: net';

    // ---- hoops: the beginners' ring across from the rail, and rings hung along the hall
    const hoops = new Geo(), hoopSpots = [];
    const vEnd = freeVel(story.C0, story.Vcam, T_X + CAM_LAG);
    for (const da of [-150, -120, -95, -70, -48, -26, 13, 26, 40, 58, 80, 105, 130, 160, 190]) {
      const c = cyl(A_HOOP + da, HOOP_R, HOOP_Z), n = rotZ(vEnd, da * DEG);
      const m = basisAt(c, n, ZAX), R = da === 13 || da === 26 || da === 40 ? 3.4 : 2.6 + rng.f(0, 0.8);
      addHoop(hoops, m, R, 0.24, rng.pick(HOOP_COLS), 14, 3);
      hoopSpots.push({ c, n, R, a: A_HOOP + da, keep: true });
      for (let i = 0; i < 8; i++) { const q = new Vector3(Math.cos(i / 8 * 6.283) * R, Math.sin(i / 8 * 6.283) * R, 0).applyMatrix4(m); lamps.push({ p: [q.x, q.y, q.z], color: '#fff1d6', power: 3.5, size: 0.22 }); }
    }
    for (const z of [62, 112, 240, 275]) {
      const nH = rng.i(5, 8), a0 = rng.f(0, 360);
      for (let k = 0; k < nH; k++) {
        const a = a0 + (k / nH) * 360 + rng.f(-12, 12), r = rng.f(24, 56), zz = z + rng.f(-10, 10);
        if (zz < 150 && r < hubR(zz) + 10) continue;
        const c = cyl(a, r, zz), R = rng.f(1.8, 3.2);
        if (nearTrack(c, R + 6)) continue;
        const sp = spinward(a), ind = inward(a), tilt = rng.f(-0.8, 0.8), tz = rng.f(-0.5, 0.5);
        const n = [sp[0] + ind[0] * tilt, sp[1] + ind[1] * tilt, tz];
        const m = basisAt(c, n, ZAX);
        addHoop(hoops, m, R, 0.22, rng.pick(HOOP_COLS), 14, 3);
        hoopSpots.push({ c, n, R, a });
        if (rng.chance(0.5)) for (let i = 0; i < 8; i++) { const q = new Vector3(Math.cos(i / 8 * 6.283) * R, Math.sin(i / 8 * 6.283) * R, 0).applyMatrix4(m); lamps.push({ p: [q.x, q.y, q.z], color: '#fff1d6', power: 4, size: 0.25 }); }
      }
      yield 'kittiwake: hoops';
    }
    scene.add(hoops.mesh(hallLit));
    // the hoop she aimed for: the way out
    const ex = path.exit, exM = new Matrix4().compose(ex.pos, ex.quat, new Vector3(1, 1, 1));
    const exG = new Geo();
    addHoop(exG, exM, exitR * 1.04, 0.42, ['#e8563a', '#fbfdff', '#e8563a', '#fbfdff', '#f2c14e', '#fbfdff'], 24, 4);
    scene.add(exG.mesh(hallLit));
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2, q = new Vector3(Math.cos(a) * (exitR * 1.04 + 0.45), Math.sin(a) * (exitR * 1.04 + 0.45), 0.2).applyMatrix4(exM); lamps.push({ p: [q.x, q.y, q.z], color: i % 2 ? '#ffe2b0' : '#fff6e8', power: 9, size: 0.36, twinkle: 0.1 }); }
    scene.add(glowPoints(lamps, { minPx: 1.2, maxPx: 40, soft: 1.8 }));
    yield 'kittiwake: hoops';

    // ---- the crowd: everyone but the story, far off drawn simply, near the lens drawn in full (update() swaps them)
    const items = [];
    const person = (child, sleeve, trim) => {
      const s = sleeve || rng.pick(SLEEVES);
      let tr = trim || rng.pick(SLEEVES); if (tr === s) tr = s === '#fbfdff' ? '#1e2328' : '#fbfdff';
      return { cloth: rng.pick(CLOTH), sleeve: s, trim: tr, skin: rng.pick(SKIN), look: [rng(), rng(), rng.chance(0.4) ? 1 : 0, 0], pose: [rng.f(-0.15, 0.3), rng.f(0, 0.3), rng.f(0.1, 0.8)], scale: child ? rng.f(0.55, 0.75) : rng.f(0.92, 1.08), seed: rng() };
    };
    // lengthwise lanes, some of them classes in a string behind a teacher, in matching sleeves
    const nLane = Math.round(300 * ctx.density);
    for (let i = 0, tries = 0; i < nLane && tries < nLane * 4; tries++) {
      const a = rng.f(0, 360), r = rng.f(26, 70), out = rng.chance(0.5), sp = rng.f(2.5, 7);
      let z0 = 16; while (z0 < 160 && r < hubR(z0) + 3.5) z0 += 2;
      const z1 = 292; if (z1 - z0 < 60) continue;
      const p0 = cyl(a, r, out ? z0 : z1), v = [0, 0, out ? sp : -sp], T = (z1 - z0) / sp;
      const lx = r * Math.cos(a * DEG), ly = r * Math.sin(a * DEG);
      const ok = !track.some((q) => q[2] > z0 - 3 && q[2] < z1 + 3 && (q[0] - lx) ** 2 + (q[1] - ly) ** 2 < 10.2);
      if (!ok) continue;
      const ph = rng(), cls = rng.chance(0.25);
      if (cls) {
        const sl = rng.pick(SLEEVES), tr = rng.pick(['#fbfdff', '#1e2328', '#f2c14e']), n = rng.i(4, 7);
        for (let k = 0; k < n; k++) {
          const pr = person(true, k ? sl : '#fbfdff', k ? tr : '#e8563a'); if (!k) { pr.scale = 0.72; pr.cloth = '#e8563a'; }
          const off = [rng.f(-0.8, 0.8), rng.f(-0.8, 0.8), 0];
          items.push({ p0: add3(p0, off), v, A: [T, ph - (k * 2.3) / (sp * T), 0, 0], ...pr });
        }
        i += n;
      } else { items.push({ p0, v, A: [T, ph, 0, 0], ...person(rng.chance(0.6)) }); i++; }
    }
    yield 'kittiwake: crowd';
    // free crossers, on loops of the clock: most aim wide enough and some do not
    const nCross = Math.round(90 * ctx.density);
    for (let i = 0, tries = 0; i < nCross && tries < nCross * 8; tries++) {
      const a = rng.f(0, 360), z0 = rng.f(40, 285), A = cyl(a, rng.f(64, 71), z0);
      const Tx = rng.f(12, 22), tgt = cyl(a + rng.f(70, 150) * rng.sign() + rng.f(-14, 14), rng.f(40, 60), Math.min(290, Math.max(30, z0 + rng.f(-20, 20))));
      const V = aimV(A, tgt, Tx);
      let hit = 0, ok = true;
      for (let t = 0.25; t < 45; t += 0.25) {
        const q = freeAt(A, V, t), rr = r2(q);
        if (rr < 5 || q[2] < 14 || q[2] > 296 || (q[2] < 156 && rr < hubR(q[2]) + 3)) { ok = false; break; }
        if (rr > 73.6) { hit = t; break; }
        if ((t * 4) % 2 === 0 && (nearStory(q, 14) || nearTrack(q, 3.6))) { ok = false; break; }
      }
      if (!ok || !hit) continue;
      const pr = person(rng.chance(0.55)); pr.look[3] = 1;
      items.push({ p0: A, v: V, A: [hit + rng.f(3, 6), rng(), 1, hit], ...pr });
      i++;
    }
    // hovering: by the hoops, along the push-off rail (where the classes wait), by the gate, and grown-ups in the net
    for (const h of hoopSpots) {
      const n = h.keep ? rng.i(2, 4) : rng.i(2, 6), ind = inward(h.a);
      for (let k = 0; k < n; k++) {
        const s = rng.sign(), p = add3(add3(add3(h.c, h.n, s * rng.f(2.5, 5)), ind, rng.f(-3, 3)), ZAX, rng.f(-h.R, h.R) * 0.8);
        if (nearTrack(p, 4.5) || nearStory(p, 4)) continue;
        const pr = person(rng.chance(0.7)); pr.look[3] = 1;
        items.push({ p0: p, v: h.n.map((x) => -x * s), A: [1, 0, 2, 0], ...pr });
      }
    }
    const busy = [0, 40, 13, 26];
    for (let a = 0; a < 360; a += rng.f(2.6, 4.2)) {
      if (busy.some((d) => Math.abs(((a - AL - d + 540) % 360) - 180) < 3.2)) continue;
      const p = add3(cyl(a, RAIL - 0.8 - rng.f(0, 0.6), ZR), ZAX, rng.f(-0.7, 0.7));
      if (nearTrack(p, 4.8)) continue;
      const pr = person(rng.chance(0.6)); pr.look[3] = 1; pr.pose[0] = 0.5;
      items.push({ p0: p, v: add3(inward(a), spinward(a), rng.f(-0.5, 0.5)), A: [1, 0, 2, 0], ...pr });
    }
    for (let i = 0, n = 0; i < 200 && n < 26; i++) {
      const a = rng.f(-34, 12), p = cyl(a, rng.f(60, 71), rng.f(13, 30));
      if (nearTrack(p, 4.5) || r2(sub3(p, cyl(AS, 69.5, 12.6))) < 4) continue;
      const h = rng.f(0, Math.PI * 2), pr = person(rng.chance(0.5));
      items.push({ p0: p, v: [Math.cos(h), Math.sin(h), rng.f(-0.6, 0.9)], A: [1, 0, 2, 0], ...pr });
      n++;
    }
    for (let i = 0; i < 30; i++) {
      const a = rng.f(0, 360), p = cyl(a, 74.2, rng.f(30, 290)), pr = person(false); pr.pose = [0.3, 0.4, 0.4];
      items.push({ p0: p, v: add3(nrm3([p[0], p[1], 0]), ZAX, 0.3), A: [1, 0, 2, 0], ...pr });
    }
    const flyU = { uClip: G.uClip, uTime: G.uTime, uOmega: { value: W } };
    const far = farFlyers(rig, items, flyU), near = nearFlyers(rig, 112, flyU);
    scene.add(far.mesh, near.mesh);
    yield 'kittiwake: crowd';

    // ---- the gate on the top terrace, by the hub face
    const t29 = hollow.terrace(0, 29, -6);
    const gate = new Geo({ maxSeg: 1.5 });
    gate.box(-26, 0, -10.6, 26, 1.1, -8.6, '#d6dde6', { top: '#fbfdff' });                 // the counter
    gate.box(-26, 0, -11, 26, 5.2, -10.6, '#e9edf2', { emit: 0.35 });                     // the board behind it, lit
    for (let i = 0; i < 18; i++) gate.box(-27 + i * 3, 5.2, -11, -24 + i * 3, 5.4, -9.4, i % 2 ? '#fbfdff' : '#e8563a');   // a striped canopy
    for (let i = 0; i <= 12; i++) gate.box(-26 + i * 4.333 - 0.06, 0, -7.4, -26 + i * 4.333 + 0.06, 5.2, -7.28, '#9aa7b6');
    const gateLamps = [];
    for (let i = 0; i < 26; i++) gateLamps.push({ p: [-25 + i * 2, 4.9, -8.0], color: '#ffe7c4', power: 5, size: 0.3 });
    t29.glow(gateLamps, { minPx: 1.2, maxPx: 30, soft: 1.8 });
    for (let i = 0; i < 26; i++) for (let j = 0; j < 3; j++) {
      const x = -25 + i * 1.95, y = 1.6 + j * 1.2, c = SLEEVES[(i * 3 + j * 5) % SLEEVES.length];
      gate.tri([x, y + 1.0, -10.55], [x + 0.2, y, -10.55], [x + 1.7, y + 0.9, -10.55], c);   // sleeves pinned up to choose from
    }
    for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) {
      const x = 28 + i * 0.7, y = 0.25 + j * 0.5;                                           // shoes kept as the deposit
      gate.box(x, y - 0.25, -10.9, x + 0.66, y + 0.2, -10.2, '#c9d1da', { skip: 'n' });
      if ((i * 7 + j * 3) % 5) { const sc = ['#3a3f48', '#7a4a2e', '#c9563c', '#e7e1d3', '#2f3b45'][(i + j) % 5]; gate.box(x + 0.08, y - 0.2, -10.7, x + 0.3, y - 0.08, -10.4, sc); gate.box(x + 0.36, y - 0.2, -10.7, x + 0.58, y - 0.08, -10.4, sc); }
    }
    for (let i = 0; i < 18; i++) gate.blob(-24 + i * 2.7, 1.25, -9.6, 0.12, 0, '#f4ead2');   // bulbs of broth
    t29.add(gate.mesh(t29.lit, t29.frame));
    const spots = [];
    for (let i = 0; i < 70; i++) spots.push({ p: [rng.f(-30, 40), 0, rng.f(-8, -1)], walk: rng.chance(0.4) ? rng.f(0.5, 2) : 0, child: rng.chance(0.55), yaw: Math.PI });
    for (const m of crowd(spots, t29.walk, { frame: t29.frame, bob: 0.35, speed: 0.6 })) t29.add(m);
    yield 'kittiwake: gate';

    const st = { pos: null, f: null, bk: null }, hidden = [], hideArr = far.hide.array, cand = [];
    let portal = null;
    return {
      scene, path, hollow, near: 0.3, far: 9000,
      look: { exposure: 1.06, bloom: 0.2, threshold: 0.95, saturation: 1.08, vignette: 0.42, contrast: 1.1 },
      portal: { rim: false, mist: '#e9eef4', openFor: OPEN_FOR },
      update(t, dt, camera) {
        // the story, always drawn in full; then whoever of the crowd is within 24 m of the lens
        let n = 0;
        for (const it of story.cast) if (it.state(t, st)) near.set(n++, st, it);
        for (const i of hidden) hideArr[i * 4 + 3] = 0;
        hidden.length = 0; cand.length = 0;
        const now = G.uTime.value, cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
        for (let i = 0; i < items.length; i++) {
          if (!flyerState(items[i], now, st, false)) continue;
          const d2 = (st.pos[0] - cx) ** 2 + (st.pos[1] - cy) ** 2 + (st.pos[2] - cz) ** 2;
          if (d2 < 576) cand.push(d2 + i * 1e-7, i);
        }
        const idx = [];
        for (let k = 0; k < cand.length; k += 2) idx.push(k);
        if (idx.length > near.cap - n) idx.sort((a, b) => cand[a] - cand[b]);
        for (const k of idx) {
          if (n >= near.cap) break;
          const i = cand[k + 1];
          flyerState(items[i], now, st, true); near.set(n++, st, items[i]);
          hideArr[i * 4 + 3] = 1; hidden.push(i);
        }
        near.done(n); far.hide.needsUpdate = true;
        // the opening holds mist until it opens: keep the mist out of the hoop until then
        if (!portal) portal = scene.children.find((o) => o.renderOrder === -20 && o.geometry && o.geometry.type === 'CircleGeometry') || null;
        if (portal) portal.visible = t > path.tCross - OPEN_FOR - 0.1;
      },
    };
  },
};
