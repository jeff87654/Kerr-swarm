// Lots: the craft shops of the generated city (shop.mender, shop.tailor, shop.dyer, shop.chairs, shop.lamps, shop.flutes, shop.felt,
// shop.books, shop.toys, shop.second, shop.sleeves, shop.kites, shop.crocks).
//
// One workshop-shop, laid out to fit whatever footprint the plan gives (8 to 14 m of front, 9.5 to 11 m deep, front on any side):
// a glazed front with the trade's window, a counter with the keeper's post, a goods wall, a working corner, a back shelf, light in
// warm pools. Two layouts, each mirrored by the seed:
//   A, door at one end: the window runs along the rest of the front; goods down both side walls; the counter across the back
//      on the far side with the back shelf behind it; the working corner in the back corner on the door side.
//   B, door in the middle: a window either side of it; goods down both walls; the counter across the back middle; the working
//      corner against a side wall at the back. Wide court shops get two pieces on the floor instead of one.
// Everything is placed in (u, q): u along the front from the door side, q inward from the front line. The trades
// (lots_shops_craft_trades.js) fill the slots with their own fittings, goods, colours, work and lines.
import { registerLot, orient, say, note } from '../city/lots.js';
import { LOT_H } from '../city/plan.js';
import { room, shopfront } from '../world/kit2.js';
import { lamp, block } from '../world/kit.js';
import { prop, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { GIVEN } from '../content/city.js';
import { craftProps } from './lots_shops_craft_props.js';
import { TRADE, historyCard } from './lots_shops_craft_trades.js';
import { upperBand, CLUTTER, BAND_OF } from './lots_shops_craft_walls.js';

// Props are cached per distinct parameter set across the whole city, so every size handed to one is rounded to two significant
// figures: a few centimetres nobody sees, and a cache that stays small however many blocks are walked through.
const qn = (x) => { if (typeof x !== 'number' || !isFinite(x) || x === 0) return x; const m = Math.pow(10, 1 - Math.floor(Math.log10(Math.abs(x)))); return Math.round(x * m) / m; };
const qp = (p) => { if (!p) return p; const o = {}; for (const k in p) o[k] = qn(p[k]); return o; };
const qprop = (s, name, x, y, z, yw, p, o) => prop(s, name, x, y, z, yw, qp(p), o);

const KEYS = ['mender', 'tailor', 'dyer', 'chairs', 'lamps', 'flutes', 'felt', 'books', 'toys', 'second', 'sleeves', 'kites', 'crocks'];
const MAX_LIGHTS = 6;
// where each trade's card is read
const CARD_AT = { mender: 'stage', tailor: 'counter', dyer: 'floor', chairs: 'stage', lamps: 'work', flutes: 'wall', books: 'wall', second: 'stage', sleeves: 'wall', kites: 'counter', crocks: 'floor' };
const NOTE_BAND = {
  low: 'An hour of somebody\'s time is about six kays in Chervil. New mass is twenty-five a kilogram, so bring the old one in first.',
  middle: 'An hour of somebody\'s time is about six kays in Chervil. New mass is twenty-five a kilogram.',
  high: 'An hour of somebody\'s time is about six kays, here as anywhere in Chervil. The elders mostly pay in hours.',
};

// ---------------------------------------------------------------------------------------------------------------
// layout: the slots, in (u, q)
// ---------------------------------------------------------------------------------------------------------------
function layout(W, D, r) {
  const wide = W >= 11.5, kind = W < 9 ? 'A' : wide ? 'B' : (r.chance(0.5) ? 'A' : 'B');
  const L = { kind, mirror: r.chance(0.5), aisleQ0: 1.9, aisleQ1: D - 3.1 };
  if (kind === 'A') {
    L.door = { u0: 0.7, u1: 1.9 };
    L.stages = [{ u0: 2.35, u1: W - 0.3, q0: 0.14, q1: 1.3 }];
    L.walls = [{ side: 'L', a0: 1.75, a1: D - 2.8 }, { side: 'R', a0: 2.6, a1: D - 3.2 }];
    const cl = Math.min(2.8, W * 0.36), cu = W * 0.68;
    L.counter = { u: cu, q: D - 2.35, len: cl };
    L.back = { side: 'B', a0: cu - cl / 2 - 0.35, a1: W - 0.3 };
    const w1 = cu - cl / 2 - 0.5;
    L.work = { side: 'B', a: (0.3 + w1) / 2, len: w1 - 0.3 };
    L.floors = [{ u: W * 0.52, q: (2.1 + D - 3.5) / 2, w: Math.min(1.9, W * 0.24), d: 1.2 }];
    L.seat = { u: W - 0.45, q: 1.95, du: -1, dq: 0 };
    L.plant = { u: 0.42, q: 0.5 };
    L.aisleU = W * 0.52;
  } else {
    L.door = { u0: W / 2 - 0.6, u1: W / 2 + 0.6 };
    L.stages = [{ u0: 0.3, u1: W / 2 - 0.95, q0: 0.14, q1: 1.25 }, { u0: W / 2 + 0.95, u1: W - 0.3, q0: 0.14, q1: 1.25 }];
    L.walls = [{ side: 'L', a0: 1.75, a1: D - 3.15 }, { side: 'R', a0: 1.75, a1: D - 3.15 }];
    const cl = Math.min(3.0, W * 0.3), cu = W / 2 + 0.55;
    L.counter = { u: cu, q: D - 2.35, len: cl };
    L.back = { side: 'B', a0: cu - cl / 2 - 0.3, a1: Math.min(W - 1.5, cu + cl / 2 + 0.45) };
    L.work = { side: 'L', a: D - 1.55, len: 2.6 };
    L.floors = wide ? [{ u: W * 0.34, q: (2.1 + D - 3.6) / 2, w: 1.9, d: 1.2 }, { u: W * 0.66, q: (2.1 + D - 3.6) / 2, w: 2.2, d: 1.1, island: true }]
      : [{ u: W / 2, q: (2.1 + D - 3.6) / 2, w: Math.min(1.9, W * 0.22), d: 1.2 }];
    L.seat = { u: W - 0.75, q: D - 0.7, du: 0, dq: -1 };
    L.plant = { u: W - 0.45, q: D - 1.75 };
    L.aisleU = wide ? W / 2 : W / 2 - (r.chance(0.5) ? 1.6 : -1.6);
  }
  return L;
}

// ---------------------------------------------------------------------------------------------------------------
// the builder
// ---------------------------------------------------------------------------------------------------------------
async function craftShop(s, lot, plan, game, tick, tid) {
  const T = TRADE[tid], o = orient(lot), r = new Rng(lot.seed), info = plan.info, H = LOT_H, g = s.g;
  const W = o.W, D = o.D, band = info.band === 'low' || info.band === 'high' ? info.band : 'middle';
  const L = layout(W, D, r), mir = L.mirror, seed = lot.seed % 9973;
  const prof = game.params && game.params.citylog ? { work: 0, worst: 0, t: performance.now() } : null;
  if (prof) { const f0 = s.flush; prof.tris = 0; prof.by = {}; s.flush = function (o) { prof.tris += (this.g.buf.ni / 3) | 0; return f0.call(this, o); }; }
  const pr = (name, x, y, z, yw, p, op) => { const t0 = prof ? prof.tris : 0; const m = qprop(s, name, x, y, z, yw, p, op); if (prof) prof.by[name] = (prof.by[name] || 0) + prof.tris - t0; return m; };
  const tk = async () => { if (prof) { const d = performance.now() - prof.t; prof.work += d; if (d > prof.worst) prof.worst = d; } if (tick) await tick(); if (prof) prof.t = performance.now(); };
  const P = (u, q) => o.P(mir ? W - u : u, q);
  const V3 = (u, y, q) => { const p = P(u, q); return [p[0], y, p[1]]; };
  const box = (u0, q0, u1, q1) => { const a = P(u0, q0), b = P(u1, q1); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; };
  const dir = (du, dq) => { const a = P(0, 0), b = P(du, dq); return [b[0] - a[0], b[1] - a[1]]; };
  const yaw = (du, dq) => { const d = dir(du, dq); return Math.atan2(d[0], d[1]); };
  const face = (du, dq) => { const d = dir(du, dq); return Math.abs(d[0]) > Math.abs(d[1]) ? (d[0] > 0 ? 'X' : 'x') : (d[1] > 0 ? 'Z' : 'z'); };
  const keeper = GIVEN[(lot.seed >>> 3) % GIVEN.length];

  // ---------- palette, nudged per shop so two of a trade are cousins, not twins ----------
  const pal = T.pal, wallTint = mixHex(pal.wall, r.pick(['#ffffff', '#e8d4b0', '#d8c8b8']), r.f(0, 0.14));

  // ---------- the room ----------
  const clip = room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: pal.floor, ceil: ['paint', pal.ceil],
    wall: { tint: wallTint, mat: pal.wallMat, dado: pal.dado, skirt: '#2a2018' }, open: { [lot.front]: false },
    glow: { sky: T.dark ? '#ffc890' : '#ffdcae', ground: shadeHex(pal.floor[1], 0.9), power: T.dark ? 0.16 : 0.24 } });
  const clipOut = clip.slice(); if (lot.front === 'n') clipOut[2] -= 2.2; else if (lot.front === 's') clipOut[5] += 2.2; else if (lot.front === 'w') clipOut[0] -= 2.2; else clipOut[3] += 2.2;
  let nLights = 0;

  // ---------- the context the trades work in ----------
  const C = {
    s, g, r, lot, info, game, band, W, D, H, pal, seed, SY: 0.42, keeper, L,
    P, V3, box, yaw, face, out: yaw(0, -1), inn: yaw(0, 1),
    prop: (name, u, y, q, yw, p, op) => { const pt = P(u, q); return pr(name, pt[0], y, pt[1], yw, p, op); },
    propAt: (name, x, y, z, yw, p, op) => pr(name, x, y, z, yw, p, op),
    spot: (type, u, q, yw, tags, y) => { const pt = P(u, q); s.spot(type, pt[0], y || 0, pt[1], yw, { tags: tags || ['shop'] }); },
    spotW: (type, x, z, yw, tags, y) => s.spot(type, x, y || 0, z, yw, { tags: tags || ['shop'] }),
    lamp: (kind, u, y, q, op) => { if (nLights >= MAX_LIGHTS) return false; nLights++; const pt = P(u, q); const oo = Object.assign({ clip }, op); if (oo.toUQ) { oo.to = V3(oo.toUQ[0], y, oo.toUQ[1]); } lamp(s, kind, pt[0], y, pt[1], oo); return true; },
    drawAt: (x, y, z, yw, fn) => s.detail(() => { g.at(x, y, z, yw); fn(g); g.pop(); }),
    // a run along a wall: side 'L' (u = 0), 'R' (u = W) or 'B' (the back), a along it; off from the wall face into the room
    pt: (run, a, off) => run.side === 'L' ? P(0.16 + off, a) : run.side === 'R' ? P(W - 0.16 - off, a) : P(a, D - 0.16 - off),
    ryaw: (run) => run.side === 'L' ? yaw(1, 0) : run.side === 'R' ? yaw(-1, 0) : yaw(0, -1),
    rface: (run) => run.side === 'L' ? face(1, 0) : run.side === 'R' ? face(-1, 0) : face(0, -1),
    bunting: (a, y, cols) => bunting(s, V3(a.u0 + 0.1, y, a.q0 + 0.12), V3(a.u1 - 0.1, y, a.q0 + 0.12), { colors: cols, sag: 0.2, drop: 0.16 }),
    feltHangings: () => s.deco(() => {
      const cols = pal.hang || [pal.felt, '#8a2f3c', '#2f6f73'];
      for (const side of ['L', 'R']) {
        const n = Math.max(2, Math.round((D - 0.8) / 1.25));
        for (let i = 0; i < n; i++) {
          const q0 = 0.4 + i * (D - 0.8) / n + 0.04, q1 = 0.4 + (i + 1) * (D - 0.8) / n - 0.04, u0 = side === 'L' ? 0.16 : W - 0.21, u1 = side === 'L' ? 0.21 : W - 0.16;
          const b = box(u0, q0, u1, q1); g.mat('felt', cols[i % cols.length]); g.box(b[0], 2.2, b[1], b[2], 2.98, b[3], { bevel: 0.012 });
          const sb = box(side === 'L' ? 0.21 : W - 0.215, q0 + 0.05, side === 'L' ? 0.215 : W - 0.21, q1 - 0.05); g.mat('weave', '#d6a640'); g.box(sb[0], 2.28, sb[1], sb[2], 2.3, sb[3]);
        }
      }
    }),
  };
  void craftProps;

  // ---------- the front ----------
  const dp0 = mir ? W - L.door.u1 : L.door.u0, du = (L.door.u0 + L.door.u1) / 2;
  shopfront(s, { side: lot.front, a0: o.a0 + 0.25, a1: o.a1 - 0.25, c: o.c, y: 0, h: H,
    fascia: { text: lot.name, sub: lot.sub, palette: pal.sign, emblem: T.emblem },
    palette: { frame: pal.frame, plinth: pal.plinth, awning: pal.awning },
    door: { kind: r.chance(0.6) ? 'slide' : 'hinge', at: dp0 - 0.25, w: 1.2, tint: pal.frame },
    awning: lot.onCourt ? false : (r.chance(0.7) ? { depth: 1.0 } : false), plinth: 0.42, lights: false, glow: 0.7 });
  s.structure(() => {
    // side returns beside the glazing, and a lintel band inside the front
    g.mat('paint', pal.frame); for (const p of [0, W - 0.25]) { const b = o.box(p, -0.1, p + 0.25, 0.1); g.box(b[0], 0, b[1], b[2], H, b[3]); }
    // beams across the room, parallel to the front
    g.mat('wood', pal.beam, { rough: 0.05 });
    const nb = Math.max(2, Math.round(D / 2.3));
    for (let i = 1; i < nb; i++) { const q = D * i / nb, b = box(0.16, q - 0.09, W - 0.16, q + 0.09); g.box(b[0], H - 0.2, b[1], b[2], H - 0.005, b[3], { bevel: 0.015 }); }
    // the picture rail on three walls
    g.mat('wood', shadeHex(pal.beam, 0.85));
    for (const b of [box(0.16, 0.12, 0.19, D - 0.16), box(W - 0.19, 0.12, W - 0.16, D - 0.16), box(0.16, D - 0.19, W - 0.16, D - 0.16)]) g.box(b[0], 2.42, b[1], b[2], 2.465, b[3], { bevel: 0.006 });
    // a duct down one side and two pipes down the other
    g.mat('brushed', '#8f8778'); { const b = box(W - 0.62, 0.3, W - 0.22, D - 0.3); g.box(b[0], H - 0.34, b[1], b[2], H - 0.06, b[3], { bevel: 0.01 }); }
    g.mat('grille', '#5c574e'); for (let q = 1.0; q < D - 0.8; q += 2.4) { const b = box(W - 0.56, q, W - 0.28, q + 0.4); g.box(b[0], H - 0.345, b[1], b[2], H - 0.34, b[3], { faces: 'y' }); }
    pal.pipes.forEach((c, i) => { g.mat('cast', c, { rough: -0.1 }); const u = 0.3 + i * 0.13; g.tube([V3(u, H - 0.13, 0.25), V3(u, H - 0.13, D - 0.2)], 0.035, { segs: 8 }); });
    g.mat('cast', '#3a3632'); for (let q = 0.8; q < D - 0.3; q += 1.6) { const b = box(0.16, q - 0.02, 0.5, q + 0.02); g.box(b[0], H - 0.2, b[1], b[2], H - 0.005, b[3]); }
  });
  // the windows' stages: a low plinth with felt on top
  for (const a of L.stages) { const v = box(a.u0 - 0.1, 0.1, a.u1 + 0.1, 0.17); s.deco(() => { g.mat('weave', pal.felt); g.box(v[0], 2.36, v[1], v[2], 2.64, v[3], { bevel: 0.01 }); g.mat('weave', pal.sign[2]); g.box(v[0], 2.36, v[1] - 0.004, v[2], 2.39, v[3] + 0.004); }); const b = box(a.u0, a.q0, a.u1, a.q1); block(s, b[0], 0, b[1], b[2], C.SY - 0.012, b[3], 'wood', shadeHex(pal.frame, 1.15), { bevel: 0.012 }); s.detail(() => { g.mat('felt', pal.felt); g.box(b[0] + 0.02, C.SY - 0.012, b[1] + 0.02, b[2] - 0.02, C.SY, b[3] - 0.02, { faces: 'YxXzZ' }); }); }
  await tk();

  // ---------- the window ----------
  for (let k = 0; k < L.stages.length; k++) { const a = L.stages[k]; T.stage(C, a, k); await tk(); C.lamp('spot', (a.u0 + a.u1) / 2, H, (a.q0 + a.q1) / 2 + 0.1, { clip: clipOut, K: T.dark ? 2600 : 3000, power: L.stages.length > 1 ? 0.75 : 0.95, cone: [62, 28] }); }
  await tk();

  // ---------- the counter and the keeper's post ----------
  const K = L.counter, cy = yaw(0, -1);
  C.prop('counter', K.u, 0, K.q, cy, { w: K.len, d: 0.6, h: 0.92, body: pal.plinth, top: '#8a6240' }, { noSpots: true });
  C.lamp('globe', K.u, 2.3, K.q, { drop: 0.9, K: T.dark || band === 'high' ? 2500 : 2700, power: 0.85, r: 0.14 });
  C.spot('counter', K.u - 0.2, K.q + 0.75, cy, ['shop', tid, T.tag]);
  C.spot('customer', K.u - 0.45, K.q - 0.85, yaw(0, 1), ['shop']); C.spot('customer', K.u + 0.55, K.q - 0.9, yaw(0, 1) - 0.2, ['shop']);
  C.spot('queue', K.u + 0.2, K.q - 1.75, yaw(0, 1), ['shop']);
  { const st = P(K.u + K.len / 2 - 0.35, K.q + 0.7); pr('stool', st[0], 0, st[1], 0, { wood: '#5a3d28', h: 0.62 }, { noSpots: true }); }
  { const a = P(K.u - K.len * 0.28, K.q), b = P(K.u + K.len * 0.22, K.q); T.top(C, { x0: a[0], z0: a[1], x1: b[0], z1: b[1], yaw: cy }); }
  // the price board on the back wall, over the keeper's head
  { const bp = P(K.u, D - 0.2); sign(s, { kind: 'chalk', title: T.board.title, lines: T.board.lines }, bp[0], 2.62, bp[1], { face: face(0, -1), w: 0.56, h: 0.34 }); }
  await tk();

  // ---------- the goods walls ----------
  let firstRun = null;
  for (const run of L.walls) {
    const len = run.a1 - run.a0, n = Math.floor((len + 0.06) / 1.36); if (n < 1) continue;
    for (let i = 0; i < n; i++) {
      const a = (run.a0 + run.a1) / 2 + (i - (n - 1) / 2) * 1.36;
      T.unit(C, run, a, i);
      if (i % 2 === 0) { const bp = C.pt(run, a, 0.95); C.spotW('browse', bp[0], bp[1], C.ryaw(run) + Math.PI, ['shop']); }
      await tk();
    }
    if (!firstRun) firstRun = Object.assign({ n }, run);
    if (BAND_OF[tid]) upperBand(C, run, BAND_OF[tid]);
    const cl = CLUTTER[tid], endA = run.a1 + 0.45;
    if (cl && !(L.kind === 'B' && run.side === 'L')) { const c = cl[(seed + (run.side === 'R' ? 1 : 0)) % cl.length], cp = C.pt(run, endA, 0.32); pr(c[0], cp[0], 0, cp[1], C.ryaw(run) + r.f(-0.4, 0.4), c[1], { noSpots: true }); }
    await tk();
  }

  // ---------- the working corner ----------
  T.work(C, L.work);
  await tk();
  if (nLights < MAX_LIGHTS) { nLights++; const wp = C.pt(L.work, L.work.a, 0.9); lamp(s, 'globe', wp[0], 2.4, wp[1], { clip, drop: 0.8, K: T.dark ? 3000 : 3700, power: 0.8, r: 0.13 }); }
  if (T.walls) T.walls(C);
  await tk();

  // ---------- the floor, the back shelf, the ceiling ----------
  for (let k = 0; k < L.floors.length; k++) {
    const f = L.floors[k];
    if (f.island) {
      // a wide shop's second window, in the middle of the floor: the trade's own display on a plinth
      const a = { u0: f.u - f.w / 2, u1: f.u + f.w / 2, q0: f.q - f.d / 2, q1: f.q + f.d / 2 }, b = box(a.u0, a.q0, a.u1, a.q1);
      block(s, b[0], 0, b[1], b[2], C.SY - 0.012, b[3], 'wood', shadeHex(pal.frame, 1.15), { bevel: 0.012 }); s.detail(() => { g.mat('felt', pal.felt); g.box(b[0] + 0.02, C.SY - 0.012, b[1] + 0.02, b[2] - 0.02, C.SY, b[3] - 0.02, { faces: 'YxXzZ' }); });
      T.stage(C, a, 2); C.lamp('spot', f.u, H, f.q, { K: 3000, power: 0.8, cone: [60, 26] });
    } else { T.floor(C, f, k); C.lamp('globe', f.u, 2.35, f.q, { drop: 0.85, K: 2800, power: 0.75, r: 0.14 }); }
    await tk();
  }
  T.back(C, L.back);
  await tk();
  if (T.ceil) { T.ceil(C, L); await tk(); }
  // a door mat, a rug down the floor where the trade has not put its own, a plant, a chair to wait in
  if (!T.ownRug) for (const f of L.floors) if (!f.island) { const rp = P(f.u, f.q); pr('rug', rp[0], 0, rp[1], yaw(0, 1), { w: f.w + 1.3, d: f.d + 1.1, a: pal.rug[0], b: pal.rug[1] }); }
  if (L.kind === 'A') { const q0 = 1.45, q1 = L.aisleQ1 + 0.4, rp = P(du, (q0 + q1) / 2); pr('rug', rp[0], 0, rp[1], yaw(1, 0), { w: q1 - q0, d: 0.9, a: pal.rug[1], b: pal.rug[0], mat: 'stripe' }); }
  { const dm = P(du, 0.75); pr('rug', dm[0], 0, dm[1], yaw(0, 1), { w: 1.2, d: 0.7, a: pal.rug[0], b: pal.rug[1], mat: 'rush' }); }
  if (L.plant) { const pp = P(L.plant.u, L.plant.q); pr('plant', pp[0], 0, pp[1], r.f(0, 3), { kind: r.pick(['broad', 'fern', 'fine']), size: r.f(1.0, 1.35), pot: r.pick(['#a3563a', '#2f6f73', '#d6a640', '#33407a']) }); }
  let seatAt = C.sitPrompt || null;
  if (!seatAt) { const sp = P(L.seat.u, L.seat.q), sy = yaw(L.seat.du, L.seat.dq); pr('shops-craft.seat', sp[0], 0, sp[1], sy, { wood: '#4a3020', seat: pal.rug[0] }); seatAt = { u: L.seat.u, q: L.seat.q, yaw: sy, y: 0.46 }; }
  // the band shows: a child's chair by the counter on the Low decks, a chair to rest in by the counter on the High decks
  { const bu = K.u - K.len / 2 - 0.55, bq = K.q - 0.2, bp = P(bu, bq);
    if (band === 'low') { pr('toys.chair', bp[0], 0, bp[1], yaw(1, -0.4), { col: r.pick(['#e8705a', '#2f8a85', '#e9b23c']) }); const pp = P(bu + 0.3, bq - 0.9); s.spot('play', pp[0], 0, pp[1], yaw(1, 0), { tags: ['kids', 'floor'] }); }
    else if (band === 'high') pr('shops-craft.seat', bp[0], 0, bp[1], yaw(1, -0.4), { wood: '#3a2418', seat: pal.felt }); }
  // light at the door, for the street
  if (nLights < MAX_LIGHTS) { nLights++; const ep = P(du, -0.55); lamp(s, 'bulb', ep[0], 2.55, ep[1], { power: 0.55, range: 4.5, K: 2800 }); }
  // and over the first goods wall, if there is a light to spare
  if (firstRun && nLights < MAX_LIGHTS) { nLights++; const gp = C.pt(firstRun, (firstRun.a0 + firstRun.a1) / 2, 0.7); lamp(s, 'spot', gp[0], H, gp[1], { clip, K: 3200, power: 0.55, cone: [60, 26] }); }
  // the window notice, on the inside of the glass by the door
  // (the window notice was cut to keep the block's sign atlas small: fascia and price board only)
  // the trade's own sound
  if (T.loop) { const lp = C.sound || C.glowAt || P(L.work.side === 'L' ? 0.8 : L.work.a, D - 1.0); s.loop(T.loop, lp[0], 1.0, lp[1], { vol: T.loop === 'steam' ? 0.25 : 0.14, radius: 7 }); }

  // ---------- people's ways ----------
  if (L.kind === 'B') { const f0 = L.floors[0], lane = f0.u + f0.w / 2 + 0.8; s.path([P(du, -0.7), P(du, 1.4), P(du, L.aisleQ0 + 0.6), P(lane, L.aisleQ0 + 0.6), P(lane, K.q - 1.3), P(K.u, K.q - 1.3)], { width: 1.0 }); }
  else s.path([P(du, -0.7), P(du, 1.4), P(du, L.aisleQ0 + 0.6), P(K.u, K.q - 1.3)], { width: 1.1 });
  for (const f of L.floors) s.path([P(du, L.aisleQ0 + 0.6), P(f.u, f.q - f.d / 2 - 0.55)], { width: 0.9 });
  for (const run of L.walls) { const a = C.pt(run, run.a0 + 0.4, 0.95), b = C.pt(run, run.a1 - 0.3, 0.95); s.path([P(du, L.aisleQ0 + 0.6), a, b], { width: 0.9 }); }

  // ---------- things to do ----------
  let talks = 0;
  const ip = P(K.u, K.q - 0.55);
  s.interact({ x: ip[0], y: 1.15, z: ip[1], radius: 1.6, kind: 'talk', prompt: 'Talk to ' + keeper, onUse: async (gm) => {
    const first = talks === 0; talks++;
    await say(gm, keeper, first ? [T.greet[seed % T.greet.length]] : [T.greet[(seed + talks) % T.greet.length]]);
    if (!gm.ui) return;
    gm.busy++; let c = null;
    try { c = await gm.ui.choose(keeper, lot.name, [{ label: T.menu, sub: T.services.map((x) => x.name).slice(0, 2).join(', '), value: 'buy' }, { label: 'Ask about the work', value: 'ask' }, { label: 'Just looking', value: null }]); } finally { gm.busy--; }
    if (c === 'ask') await say(gm, keeper, T.about[(seed + talks) % T.about.length].concat([T.band[band]]));
    else if (c === 'buy') await services(gm, T, lot, keeper, band, tid);
  } });
  // the card, read where the trade keeps it
  if (T.card) {
    const at = CARD_AT[tid] || 'stage', st = L.stages[0];
    let cp = at === 'counter' ? P(K.u - K.len * 0.28, K.q - 0.4) : at === 'work' ? C.pt(L.work, L.work.a, 1.0) : at === 'wall' && firstRun ? C.pt(firstRun, (firstRun.a0 + firstRun.a1) / 2, 0.75) : at === 'floor' ? P(L.floors[0].u, L.floors[0].q - 0.7) : P((st.u0 + st.u1) / 2, st.q1 + 0.35);
    if (C.lidAt) cp = P(C.lidAt.u, C.lidAt.q);
    let reads = 0;
    s.interact({ x: cp[0], y: 1.1, z: cp[1], radius: 1.5, prompt: T.card.prompt, onUse: async (gm) => {
      if (gm.audio) gm.sfx(T.card.lid ? 'lid-down' : 'paper', { vol: 0.5 });
      const lines = T.card.gen ? historyCard(new Rng((lot.seed ^ (reads * 2654435761)) >>> 0)) : T.card.texts[(seed + reads) % T.card.texts.length];
      reads++;
      await say(gm, { name: T.card.title, colour: '#FFD9A0' }, lines);
    } });
  }
  // something to try: a flute, a top, a sleeve, the felt boards, or a chair to sit in
  if (T.tryIt) {
    const tp = tid === 'sleeves' ? P((L.stages[0].u0 + L.stages[0].u1) / 2, L.stages[0].q1 + 0.4) : tid === 'toys' ? P(L.floors[0].u, L.floors[0].q - 0.8) : firstRun ? C.pt(firstRun, (firstRun.a0 + firstRun.a1) / 2 + 0.7, 0.8) : P(du, 2.5);
    let n = 0;
    s.interact({ x: tp[0], y: 1.1, z: tp[1], radius: 1.4, prompt: T.tryIt.prompt, onUse: async (gm) => { if (gm.audio) gm.sfx(T.tryIt.sfx, { vol: 0.6 }); await say(gm, '', T.tryIt.lines[(seed + n++) % T.tryIt.lines.length]); } });
  }
  if (T.clap && C.clapAt) {
    const cp = P(C.clapAt.u, C.clapAt.q); let n = 0;
    s.interact({ x: cp[0], y: 1.2, z: cp[1], radius: 1.4, prompt: 'Clap in front of the boards', onUse: async (gm) => { if (gm.audio) { gm.sfx('knock', { vol: 0.6 }); gm.sfx('knock', { vol: 0.15, delay: 0.5 }); } await say(gm, '', T.clap[(seed + n++) % T.clap.length]); } });
  }
  if (seatAt) {
    const sp = P(seatAt.u, seatAt.q);
    s.interact({ x: sp[0], y: (seatAt.y || 0.46) + 0.3, z: sp[1], radius: 1.1, priority: 0.2, prompt: tid === 'chairs' ? 'Sit in the oldest chair' : tid === 'books' ? 'Sit and read the margins' : tid === 'flutes' ? 'Sit on the listening bench' : 'Sit down a while', onUse: (gm) => { if (gm.player && gm.player.sit) gm.player.sit({ x: sp[0], y: seatAt.y || 0.46, z: sp[1], yaw: Math.PI - seatAt.yaw }); } });
  }

  if (prof) { await tk(); console.log('[craft] ' + tid + ' ' + L.kind + ' W' + W.toFixed(1) + ' work ' + prof.work.toFixed(1) + ' ms, worst slice ' + prof.worst.toFixed(1) + ' ms, lights ' + nLights + ', tris ' + prof.tris + ' ' + Object.entries(prof.by).sort((a, b) => b[1] - a[1]).slice(0, 9).map((e) => e[0] + ' ' + e[1]).join(', ')); delete s.flush; }
  s.zoneBox({ id: lot.id, place: 'city-shop', box: [lot.x0, -0.5, lot.z0, lot.x1, 3.4, lot.z1], name: lot.name, sub: info.name + ' · ' + (lot.onCourt ? 'the court' : o.alongX ? info.avenue : info.street), ambience: T.ambience || 'shop', reverb: T.reverb || 'room', cell: info.key });
}

// The trade's services: a menu, a price in kays, a line from the keeper, a note of what you got.
async function services(gm, T, lot, keeper, band, tid) {
  if (!gm.ui) return;
  const hr = gm.clock ? gm.clock.hours : 12, day = gm.clock ? gm.clock.day : 1;
  const items = T.services.map((x) => ({ id: x.id, name: x.name, desc: x.desc, price: x.price, tag: x.loan ? 'loan' : undefined, disabled: !!(x.days && x.days.indexOf(day) < 0) || !!(x.hours && (hr < x.hours[0] || hr > x.hours[1])) }));
  gm.busy++; let pick = null;
  try { pick = await gm.ui.menu({ kicker: lot.name, title: T.menu, note: NOTE_BAND[band], items, wallet: gm.wallet ? gm.wallet.kwh : 0 }); } finally { gm.busy--; }
  const sv = pick && T.services.find((x) => x.id === pick); if (!sv) return;
  let colour = null;
  if (sv.colours && T.colours) {
    gm.busy++; try { colour = await gm.ui.choose(keeper, 'Which colour', T.colours.map((c) => ({ label: c[0], value: c[0] }))); } finally { gm.busy--; }
    if (!colour) return;
  }
  if (sv.price > 0 && gm.wallet && !gm.wallet.spend(sv.price, sv.name + ', ' + lot.name)) { note(gm, 'Not enough in your wallet today.'); return; }
  if (gm.audio) gm.sfx(tid === 'dyer' ? 'pour' : tid === 'chairs' ? 'knock' : tid === 'crocks' ? 'lid-down' : 'scissors', { vol: 0.5 });
  await say(gm, keeper, sv.reply);
  note(gm, colour ? sv.toast.replace('a colour people will remember', colour.toLowerCase()) : sv.toast, 'gain');
  gm.flags['craft:' + tid] = (gm.flags['craft:' + tid] || 0) + 1;
  if (gm.events) gm.events.emit('city:craft', { trade: tid, shop: lot.name, what: sv.id, kwh: sv.price });
}

for (const k of KEYS) registerLot('shop.' + k, (s, lot, plan, game, tick) => craftShop(s, lot, plan, game, tick, k));

// a place record so the file is loaded; it builds nothing itself
export const place = { id: 'lots-shops-craft', name: 'Lots: craft shops', order: 2, always: true, build() {} };
