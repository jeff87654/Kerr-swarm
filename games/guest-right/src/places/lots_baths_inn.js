// An inn of guest-right beds, on the Low decks: any traveller from a drum that grants the same gets three nights here and
// a seat at any hall; the fourth night they stay as long as they cook. On the street a recessed porch and a lit fascia;
// in the front band the lobby (the desk where a guest signs, the key board, the book on its stand), the guests' shelf of
// things left behind, a washroom on the loop, a parlour where families meet their travellers (and, when there is room,
// a drying room); behind, the common room with one long table, raised to two storeys, with a gallery of upper rooms
// reached by a stair and a corridor of small guest rooms under it, each with a bed, a lamp and a hook.
import { LOT_H } from '../city/plan.js';
import { say, note } from '../city/lots.js';
import { railing, column } from '../world/kit2.js';
import { Rng, shadeHex, mixHex, clamp } from '../core/util.js';
import { local, chatRing, pickBy, sitPlayer, seatedAs } from './lots_baths_kit.js';
import { PAL } from './baths_parts.js';
import { innParts, INN_PAL, INN_NAMES, KEEPERS, GREET, GUEST_RIGHT, KEY_LINES, RULES, SHELF, SIGNINGS, CUPS, TABLE, WAKE, BOARD, PARLOUR } from './lots_baths_inn_parts.js';

const nice = (t) => t.split(' ').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

export async function buildInn(s, lot, plan, game, tick) {
  void innParts;
  const log = game.params && game.params.citylog, t0 = performance.now(); let waited = 0;
  const meter = () => { let nt = 0; for (const ch of s.chunks.values()) if (ch.bufs) for (const k in ch.bufs) nt += ch.bufs[k].ni || 0; return { tris: nt / 3, lights: s.lights.length }; };
  const m0 = log ? meter() : null;
  const parts = []; let tLast = performance.now();
  const T = async (label) => { const a = performance.now(); if (log) { parts.push((label || '?') + ' ' + Math.round(a - tLast)); } if (tick) await tick(); tLast = performance.now(); waited += tLast - a; };
  const L = local(s, lot), g = s.g, W = L.W, D = L.D, info = plan.info, r = new Rng(lot.seed), seed = lot.seed;
  const pal = INN_PAL[r.i(0, INN_PAL.length - 1)];
  const NAME = pickBy(seed, 1, INN_NAMES), Name = nice(NAME);
  const keeper = { name: pickBy(seed, 2, KEEPERS), colour: '#f2c879' };
  const cx = W / 2, F = 8, GQ = D - 5.2, RQ = D - 3.4, GY = 3.6, HH = 6.9, LH = LOT_H, CH = 3.38, FW = 0.22;
  const lp0 = cx - 7, lp1 = cx + 7;
  const flip = r.chance(0.5), dd = flip ? -1 : 1;                 // dd: the side of the lobby the desk and parlour are on
  const washW = clamp((lp0 - 0.16) * 0.55, 5.5, 10);
  const wash = flip ? [W - 0.16 - washW, W - 0.16] : [0.16, 0.16 + washW];
  const shelf = flip ? [lp1, W - 0.16 - washW] : [0.16 + washW, lp0];
  const parWing = flip ? [0.16, lp0] : [lp1, W - 0.16];
  const dryW = parWing[1] - parWing[0] > 14 ? 5 : 0;
  const dry = dryW ? (flip ? [0.16, 0.16 + dryW] : [W - 0.16 - dryW, W - 0.16]) : null;
  const par = dryW ? (flip ? [0.16 + dryW, lp0] : [lp1, W - 0.16 - dryW]) : parWing;
  const lobShelfP = flip ? lp1 : lp0, lobParP = flip ? lp0 : lp1;
  const wallT = pal.wall, dado = { h: 1.0, mat: 'wood', tint: shadeHex(pal.dado, 0.85) };
  const wallO = { tint: wallT, dado, skirt: pal.trim };
  const clipCommon = L.clip(0.16, -0.3, F, W - 0.16, HH + 0.05, D - 0.16);
  const glazeC = ['#e9e2d0', '#d9c7a6', '#a3563a', '#3d6f8a', '#6b7a3a', '#efe4cc'], lidC = ['#c9552e', '#2f6f73', '#d6a640', '#33407a', '#8a2f3c'];

  // =============================================================================================================
  // the shell
  // =============================================================================================================
  L.floor(lp0, 0.2, lp1, F, 0, 'pattern', mixHex(pal.wall, '#b89870', 0.45));
  L.floor(wash[0], 0.2, wash[1], F, 0, 'tile', '#d6e2d6');
  L.floor(shelf[0], 0.2, shelf[1], F, 0, 'planks', pal.floor);
  L.floor(parWing[0], 0.2, parWing[1], F, 0, 'planks', shadeHex(pal.floor, 0.92));
  L.floor(0.16, F, W - 0.16, D - 0.16, 0, 'planks', pal.floor);
  L.ceiling(0.16, 0.3, W - 0.16, F, LH, 'paint', '#efe6d6');
  L.ceiling(0.16, F, W - 0.16, D - 0.16, HH, 'wood', shadeHex(pal.floor, 0.75));
  await T('1');

  // --- the front: a plastered face with a cornice, windows to the parlour, frosted lamp-lit windows to the washroom
  const wins = [];
  wins.push({ at: cx - 6.4, w: 2.2, h: 1.5, sill: 0.95, kind: 'clear' }, { at: cx + 4.2, w: 2.2, h: 1.5, sill: 0.95, kind: 'clear' });
  const wingWins = (a, b, kind) => { const n = Math.max(1, Math.floor((b - a - 0.8) / 3.4)); for (let k = 0; k < n; k++) { const m = a + (b - a) * (k + 0.5) / n; wins.push(kind === 'frost' ? { at: m - 0.7, w: 1.4, h: 0.9, sill: 1.75, kind } : { at: m - 0.85, w: 1.7, h: 1.5, sill: 0.95, kind }); } };
  wingWins(wash[0], wash[1], 'frost'); wingWins(par[0], par[1], 'clear'); if (dry) wingWins(dry[0], dry[1], 'frost');
  L.wallP(FW, 0.16, W - 0.16, 0, LH, Object.assign({}, wallO, { outer: { tint: mixHex(wallT, '#ffffff', 0.15) }, openings: [{ at: cx - 2.6 - 0.16, w: 5.2, h: 2.8 }].concat(wins.map((w) => ({ at: w.at - 0.16, w: w.w, h: w.h, sill: w.sill }))) }));
  s.structure(() => {
    // the cornice and plinth across the whole front (in the strip between the street line and the wall)
    for (let a = 0; a < W; a += 8) { const b = Math.min(W, a + 8);
      g.mat('paint', pal.trim); L.box(a, 2.98, 0.02, b, LH, FW - 0.07, { bevel: 0.01 });
      g.mat('paint', pal.dado); L.box(a, 2.86, 0.06, b, 2.98, FW - 0.07); L.box(a, 0, 0.04, b, 0.42, FW - 0.07, { bevel: 0.01 });
    }
    // pilasters at the ends and either side of the porch
    g.mat('paint', pal.trim); for (const p of [0.0, cx - 2.95, cx + 2.6, W - 0.35]) L.box(p, 0, 0.02, p + 0.35, 2.98, FW - 0.07, { bevel: 0.012 });
  });
  for (const w of wins) {
    const p0 = w.at, p1 = w.at + w.w, y0 = w.sill, y1 = w.sill + w.h;
    s.structure(() => {
      g.mat('paint', pal.trim); L.box(p0 - 0.1, y1, 0.08, p1 + 0.1, y1 + 0.12, FW - 0.07, { bevel: 0.01 }); L.box(p0 - 0.1, y0 - 0.08, 0.02, p1 + 0.1, y0, FW + 0.1, { bevel: 0.01 });
      L.box(p0 - 0.1, y0, 0.08, p0, y1, FW - 0.07); L.box(p1, y0, 0.08, p1 + 0.1, y1, FW - 0.07);
      if (w.kind === 'frost') { g.mat('diffuser', '#f3dcb2', { emissive: 1.0, lamp: true }); L.box(p0, y0, FW - 0.02, p1, y1, FW + 0.02); }
      g.mat('paint', pal.trim); const n = Math.max(2, Math.round(w.w / 0.6)); for (let k = 1; k < n; k++) { const m = p0 + w.w * k / n; L.box(m - 0.02, y0, FW - 0.04, m + 0.02, y1, FW + 0.03); }
      L.box(p0, (y0 + y1) / 2 - 0.02, FW - 0.04, p1, (y0 + y1) / 2 + 0.02, FW + 0.03);
    });
    if (w.kind === 'clear') L.glass(p0, y0, FW, p1, y1, FW, { opacity: 0.12 });
  }
  // the porch: a recess with a low ceiling, a mosaic mat, a bench and a lantern, the fascia over it
  L.wallQ(cx - 2.6 + 0.08, FW, 1.9, 0, LH, { tint: mixHex(wallT, '#ffffff', 0.1), dado: { h: 1.0, mat: 'tile', tint: pal.dado }, skirt: pal.trim });
  L.wallQ(cx + 2.6 - 0.08, FW, 1.9, 0, LH, { tint: mixHex(wallT, '#ffffff', 0.1), dado: { h: 1.0, mat: 'tile', tint: pal.dado }, skirt: pal.trim });
  L.wallP(1.98, cx - 2.6, cx + 2.6, 0, LH, Object.assign({}, wallO, { openings: [{ at: 1.8, w: 1.6, h: 2.45 }] }));
  L.ceiling(cx - 2.6, 0.0, cx + 2.6, 1.9, 2.8, 'wood', shadeHex(pal.floor, 0.7), { noCollide: true });
  s.structure(() => {
    g.mat('mosaic', pal.dado); L.box(cx - 2.4, 0.002, 0.1, cx + 2.4, 0.006, 1.86);
    g.mat('mosaic', '#efe4cc'); L.box(cx - 2.2, 0.006, 0.24, cx + 2.2, 0.009, 1.72);
    g.mat('mosaic', pal.accent); L.box(cx - 1.0, 0.009, 0.4, cx + 1.0, 0.012, 1.56);
    g.mat('paint', pal.trim); L.box(cx - 0.84, 0, 1.9, cx - 0.8, 2.5, 2.06); L.box(cx + 0.8, 0, 1.9, cx + 0.84, 2.5, 2.06); L.box(cx - 0.84, 2.45, 1.9, cx + 0.84, 2.53, 2.06);
  });
  // a split curtain in the inner doorway
  s.deco(() => {
    g.mat('cast', '#b8913f'); L.tube([[cx - 0.8, 2.36, 1.86], [cx + 0.8, 2.36, 1.86]], 0.014, { segs: 6 });
    for (let i = 0; i < 3; i++) { const a = cx - 0.78 + i * 0.52, b = a + 0.5; g.mat('weave', i === 1 ? pal.accent : pal.dado); L.sheet([a, 2.36, 1.85], [b, 2.36, 1.85], [b, 1.9, 1.84], [a, 1.9, 1.84], { nu: 3, nv: 2, ripple: 0.012, rippleN: 3 }); }
  });
  L.sign({ kind: 'fascia', text: NAME, sub: 'guest-right beds · ' + info.name, emblem: 'cup', palette: pal.sign }, cx, 3.0, 0.0, [0, -1], { w: 4.8, h: 0.38, glow: 1.6 });
  await T('fascia');
  // a brass plate by the inner door, and a bell push (drawn: the fascia says the rest)
  s.detail(() => { g.mat('cast', '#c4a05a', { rough: -0.25 }); L.box(cx + 1.25, 1.4, 1.87, cx + 1.85, 1.7, 1.9, { bevel: 0.01 }); g.mat('paint', '#3a2a20'); for (let k = 0; k < 3; k++) L.box(cx + 1.32, 1.47 + k * 0.07, 1.865, cx + 1.78 - k * 0.08, 1.49 + k * 0.07, 1.87); g.mat('glaze', pal.accent); L.box(cx + 1.0, 1.3, 1.88, cx + 1.08, 1.38, 1.9, { bevel: 0.01 }); });
  L.prop('bench', cx - 2.2, 0, 1.05, Math.PI / 2, { w: 1.3, wood: '#7a5233' });
  L.prop('plant', cx + 2.1, 0, 0.75, 0, { kind: 'fern', size: 1.0, pot: pal.dado });
  L.lamp('lantern', cx, 2.35, 1.0, { tint: pal.accent, drop: 0.38, power: 0.9, K: 2600, clip: L.clip(cx - 3.5, -0.3, -1.6, cx + 3.5, 3.2, 1.95) });
  await T('2');

  // --- the walls of the front band
  L.wallQ(lobShelfP, FW + 0.08, F - 0.08, 0, LH, Object.assign({}, wallO, { openings: [{ at: 1.5, w: F - 3.8, h: 2.6 }] }));
  L.wallQ(lobParP, FW + 0.08, F - 0.08, 0, LH, Object.assign({}, wallO, { openings: [{ at: 2.2, w: 1.3, h: 2.3 }] }));
  const pWS = flip ? wash[0] : wash[1];
  L.wallQ(pWS, FW + 0.08, F - 0.08, 0, LH, Object.assign({}, wallO));
  s.structure(() => { g.mat('tile', '#6fa898'); const sd = flip ? 1 : -1; L.box(Math.min(pWS + sd * 0.08, pWS + sd * 0.1), 0, FW + 0.08, Math.max(pWS + sd * 0.08, pWS + sd * 0.1), 1.8, F - 0.08); });
  if (dry) L.wallQ(flip ? dry[1] : dry[0], FW + 0.08, F - 0.08, 0, LH, Object.assign({}, wallO, { openings: [{ at: 2.6, w: 1.1, h: 2.2 }] }));
  // the back of the front band: the arch to the common room, the washroom's door, the parlour's door
  const washDoor = flip ? wash[0] + 0.5 : wash[1] - 1.7;      // near the shelf side
  const parDoor = (par[0] + par[1]) / 2 - 0.7;
  L.wallP(F, 0.16, W - 0.16, 0, LH, Object.assign({}, wallO, { openings: [{ at: cx - 1.7 - 0.16, w: 3.4, h: 2.9 }, { at: washDoor - 0.16, w: 1.2, h: 2.2 }, { at: parDoor - 0.16, w: 1.4, h: 2.3 }].sort((a, b) => a.at - b.at) }));
  L.wallP(F, 0.16, W - 0.16, LH, HH - LH, { tint: wallT, skirt: false });
  // party walls and the back wall
  L.wallQ(0.08, 0, D, 0, LH, wallO); L.wallQ(W - 0.08, 0, D, 0, LH, wallO);
  L.wallQ(0.08, F, D, LH, HH - LH, { tint: wallT, skirt: false }); L.wallQ(W - 0.08, F, D, LH, HH - LH, { tint: wallT, skirt: false });
  L.wallP(D - 0.08, 0.16, W - 0.16, 0, HH, { tint: mixHex(wallT, pal.dado, 0.12), skirt: pal.trim, dado });
  await T('3');

  // =============================================================================================================
  // the lobby
  // =============================================================================================================
  const clipLob = L.clip(lp0, -0.3, FW, lp1, LH + 0.05, F);
  L.glowBox(lp0, 0, FW, lp1, LH, F, { sky: '#ffdcae', ground: '#b88c64', power: 0.32 });
  L.prop('rug', cx, 0, F / 2 + 1.0, 0, { w: 1.6, d: F - 3.2, a: pal.dado, b: pal.accent });
  // the desk, the keeper, the key board behind
  const dp = cx + dd * 3.6, dq = F - 2.7;
  L.prop('counter', dp, 0, dq, Math.PI, { w: 2.8, d: 0.62, body: pal.dado, top: '#8a6240' }, { noSpots: true });
  L.spot('counter', dp, 0, dq + 0.8, Math.PI, { tags: ['keeper', 'inn'] });
  L.spot('work', dp + dd * 1.6, 0, dq + 0.75, Math.PI, { tags: ['write', 'inn'] });
  for (const k of [-0.7, 0.7]) L.spot('customer', dp + k, 0, dq - 0.85, 0, { tags: ['inn'] });
  L.prop('lots-baths.inn-keys', dp, 1.25, F - 0.08, Math.PI, { cols: 6, rows: 4, seed: seed % 4, wood: '#5a3d28' });
  await T('keys');
  s.detail(() => {
    // the day book, the bell, a pot of pencils, a lidded cup on the desk
    g.mat('weave', pal.accent); L.box(dp - 0.9, 0.92, dq - 0.2, dp - 0.45, 0.95, dq + 0.15, { bevel: 0.006 });
    g.mat('paper', '#f1e8d4'); L.box(dp - 0.88, 0.95, dq - 0.18, dp - 0.47, 0.96, dq + 0.13);
    g.mat('cast', '#b8913f', { rough: -0.2 }); L.lathe(dp + 0.2, dq - 0.1, [[0, 0.92], [0.05, 0.92], [0.05, 0.93], [0.035, 0.96], [0.012, 0.99], [0.008, 1.0], [0, 1.0]], { segs: 12 });
    g.mat('glaze', pal.dado); L.lathe(dp + 0.6, dq + 0.05, [[0, 0.92], [0.04, 0.92], [0.045, 1.0], [0.04, 1.0], [0, 0.93]], { segs: 10, capTop: false });
    g.mat('wood', '#c9a46a'); for (let k = 0; k < 4; k++) L.box(dp + 0.58 + k * 0.012, 0.95, dq + 0.04, dp + 0.59 + k * 0.012, 1.08, dq + 0.06);
  });
  L.prop('cup', dp - 0.1, 0.92, dq + 0.1, 0, { glaze: '#efe4cc', lid: pal.dado });
  L.lamp('globe', dp - 1.05, 1.32, dq, { r: 0.09, drop: 0.3, clip: clipLob, K: 2600, power: 0.45, range: 3 });
  s.deco(() => { g.mat('cast', '#2a2622'); L.lathe(dp - 1.05, dq, [[0.07, 0.92], [0.05, 0.94], [0.015, 0.96], [0.012, 1.62]], { segs: 8 }); });
  await T('desk');
  // the book on its stand, by the arch
  const bp = cx - dd * 3.0, bq = F - 1.5;
  L.prop('lots-baths.inn-lectern', bp, 0, bq, Math.PI, { cover: pal.dado });
  await T('book');
  // a bench under the window with coat pegs over it; slippers in a basket
  L.prop('bench', cx - dd * 5.0, 0, FW + 0.45, 0, { w: 1.8, back: true, wood: '#7a5233' });
  L.prop('lots-baths.inn-hook', cx - dd * 2.6, 0, 1.15, dd > 0 ? -Math.PI / 2 : Math.PI / 2, { coat: pal.felt[1], bag: pal.felt[2], lining: pal.accent, mend: pal.felt[0] });
  L.prop('baths.fernpot', lp0 + 0.55, 0, F - 0.55, 0, { pot: pal.accent, size: 1.1 });
  L.prop('baths.fernpot', lp1 - 0.55, 0, F - 0.55, 0, { pot: pal.dado, size: 1.0 });
  L.prop('crate', cx + dd * 2.0, 0, FW + 0.45, 0.1, { w: 0.5, h: 0.24, d: 0.36, wood: '#b08d5e' });
  for (let k = 0; k < 3; k++) L.prop('baths.slippers', cx + dd * 2.0 + (k - 1) * 0.14, 0.24, FW + 0.45, (k - 1) * 0.3, { c: '#c9a46a', strap: pal.felt[k] }, { noCollide: true });
  // the rules on the parlour-side wall
  const rules = pickBy(seed, 5, RULES);
  // the house rules, hand-lettered on a framed card (drawn; read it with the prompt)
  s.detail(() => {
    const wp = lobParP - dd * 0.08, sg = -dd;
    g.mat('wood', pal.trim); L.box(Math.min(wp, wp + sg * 0.03), 1.18, F - 1.85, Math.max(wp, wp + sg * 0.03), 2.0, F - 1.15, { bevel: 0.008 });
    g.mat('paper', '#f3ead6'); L.box(Math.min(wp, wp + sg * 0.035), 1.23, F - 1.8, Math.max(wp, wp + sg * 0.035), 1.95, F - 1.2);
    g.mat('paint', pal.dado); L.box(Math.min(wp, wp + sg * 0.04), 1.84, F - 1.7, Math.max(wp, wp + sg * 0.04), 1.9, F - 1.3);
    g.mat('paint', '#3a3028'); for (let k = 0; k < rules.length; k++) L.box(Math.min(wp, wp + sg * 0.04), 1.72 - k * 0.09, F - 1.72, Math.max(wp, wp + sg * 0.04), 1.735 - k * 0.09, F - 1.72 + 0.3 + (k * 37 % 5) * 0.035);
  });
  s.deco(() => {
    g.mat('wood', pal.trim); L.box(lp0 + 0.1, 2.5, F - 0.11, lp1 - 0.1, 2.55, F - 0.08);
    for (const sg of [-1, 1]) {
      const c0 = cx + sg * 2.0, c1 = cx + sg * 3.3, a0 = Math.min(c0, c1), a1 = Math.max(c0, c1);
      if (sg === dd) continue;
      g.mat('rush', '#b08d5e'); L.box(a0, 1.4, F - 0.11, a1, 2.3, F - 0.09);
      g.mat('wood', pal.trim); L.box(a0 - 0.04, 1.36, F - 0.12, a1 + 0.04, 1.4, F - 0.08); L.box(a0 - 0.04, 2.3, F - 0.12, a1 + 0.04, 2.34, F - 0.08);
      for (let k = 0; k < 14; k++) { const u = a0 + 0.08 + r.f(0, a1 - a0 - 0.28), v = 1.46 + r.f(0, 0.66); g.mat('paper', ['#f3ead6', '#e8d9b8', pal.felt[k % 4], '#d9e4e0'][k % 4]); L.box(u, v, F - 0.13, u + 0.2, v + 0.14, F - 0.11); g.mat('cast', '#c4a05a'); L.box(u + 0.09, v + 0.11, F - 0.135, u + 0.11, v + 0.13, F - 0.13); }
    }
  });
  for (const p of [cx - 3.6, cx + 3.6]) L.lamp('globe', p, 2.6, F / 2 + 0.3, { r: 0.17, drop: 0.5, clip: clipLob, K: 2700, power: 1.0 });
  s.deco(() => { g.mat('wood', pal.trim); for (let q = 1.6; q < F - 0.3; q += 2.2) L.box(lp0 + 0.1, LH - 0.2, q - 0.08, lp1 - 0.1, LH, q + 0.08, { bevel: 0.01 }); });
  await T('4');

  // =============================================================================================================
  // the guests' shelf
  // =============================================================================================================
  {
    const a = shelf[0] + 0.08, b = shelf[1] - 0.08, w = b - a;
    const clip = L.clip(a, -0.3, FW, b, LH + 0.05, F);
    L.glowBox(a, 0, FW, b, LH, F, { sky: '#ffe0b8', ground: '#a8794f', power: 0.3 });
    const cards = new Rng(seed ^ 0x5bd1).shuffle(SHELF.slice());
    const nb = Math.max(1, Math.floor((w - 0.4) / 1.5)), bw = (w - 0.4) / nb;
    const things = (pp, qq, face, y, len) => {
      // a row of left things along a shelf, each with its little card
      let u = -len / 2 + 0.08;
      while (u < len / 2 - 0.15) {
        const k = r.i(0, 6), c = pal.felt[r.i(0, 3)], p = pp + u, w2 = 0.12 + r.f(0, 0.12);
        const ctr = p + w2 / 2;
        if (k === 0) { g.mat('glaze', glazeC[r.i(0, 5)]); L.lathe(ctr, qq, [[0, y], [0.05, y], [0.055, y + 0.14], [0.03, y + 0.17], [0, y + 0.17]], { segs: 10 }); }
        else if (k === 1) { g.mat('knit', c); L.box(p, y, qq - 0.1, p + w2, y + 0.08, qq + 0.1, { bevel: 0.02 }); g.mat('knit', shadeHex(c, 1.2)); L.box(p, y + 0.08, qq - 0.1, p + w2, y + 0.13, qq + 0.1, { bevel: 0.02 }); }
        else if (k === 2) { g.mat('wood', '#b08d5e'); L.ball(ctr, y + 0.06, qq, 0.06, 0.06, 0.06, { segs: 10, rings: 6 }); }
        else if (k === 3) { g.mat('cast', '#3d4a45'); L.cyl(ctr, y, qq, 0.035, 0.16, { segs: 8 }); g.mat('diffuser', '#f6dfb4'); L.ball(ctr, y + 0.2, qq, 0.045, 0.045, 0.045, { segs: 8, rings: 5 }); }
        else if (k === 4) { g.mat('cast', c); L.cyl(ctr, y, qq, 0.05, 0.12, { segs: 10 }); }
        else if (k === 5) { g.mat('paper', c); L.box(p, y, qq - 0.08, p + 0.05, y + 0.2, qq + 0.08); g.mat('paper', glazeC[r.i(0, 5)]); L.box(p + 0.05, y, qq - 0.08, p + 0.09, y + 0.18, qq + 0.08); }
        else { g.mat('weave', c); L.box(p, y, qq - 0.07, p + w2, y + 0.03, qq + 0.07, { bevel: 0.01 }); }
        g.mat('paper', '#f6efe0'); L.box(ctr - 0.035, y, qq + face * 0.11, ctr + 0.035, y + 0.05, qq + face * 0.115);
        u += w2 + r.f(0.06, 0.16);
      }
    };
    for (const side of [0, 1]) {
      const qq = side ? F - 0.26 : FW + 0.26, aa = side ? Math.PI : 0, face = side ? -1 : 1;
      for (let k = 0; k < nb; k++) {
        const pp = a + 0.2 + bw * (k + 0.5);
        L.prop('shelving', pp, 0, qq, aa, { w: bw - 0.06, h: 2.1, d: 0.34, shelves: 4, wood: '#6f5137', back: true });
        s.detail(() => { for (let j = 1; j < 4; j++) things(pp, qq, face, 0.08 + j * (2.1 - 0.11) / 4 + 0.025, bw - 0.2); });
      }
      await T('5');
    }
    {
      const ep = flip ? b - 0.2 : a + 0.2, ea = flip ? -Math.PI / 2 : Math.PI / 2;
      L.prop('shelving', ep, 0, F / 2, ea, { w: Math.min(2.4, F - 4.4), h: 2.3, d: 0.34, shelves: 5, wood: '#6f5137', back: true });
      s.detail(() => { for (let j = 1; j < 5; j++) { const y = 0.08 + j * (2.3 - 0.11) / 5 + 0.025; let u = F / 2 - 1.0; while (u < F / 2 + 0.9) { g.mat(r.chance(0.5) ? 'knit' : 'paper', pal.felt[r.i(0, 3)]); const w2 = r.f(0.1, 0.22); L.box(ep - 0.12, y, u, ep + 0.12, y + r.f(0.08, 0.2), u + w2, { bevel: 0.01 }); u += w2 + 0.05; } } });
      s.deco(() => { g.mat('wood', pal.trim); L.box(a + 0.1, 2.55, FW + 0.1, b - 0.1, 2.6, FW + 0.13); L.box(a + 0.1, 2.55, F - 0.13, b - 0.1, 2.6, F - 0.1); });
    }
    // a table in the middle with more left on it, a stool
    const tp = (a + b) / 2, tq = F / 2 + 0.1;
    if (w > 3.0) {
      L.prop('table', tp, 0, tq, Math.PI / 2, { w: Math.min(1.8, F - 3.4), d: 0.8, wood: '#6f4e33' });
      s.detail(() => { things(tp, tq, 1, 0.74, Math.min(1.5, w - 1.6)); });
      L.spot('browse', tp, 0, tq - 1.0, 0, { tags: ['inn'] }); L.spot('browse', tp, 0, tq + 1.0, Math.PI, { tags: ['inn'] });
    }
    L.lamp('globe', tp, 2.7, tq, { r: 0.15, drop: 0.45, clip, K: 2800, power: 0.9 });
    L.interact({ p: tp, y: 1.2, q: tq, radius: Math.max(2.2, w / 2), prompt: 'Read the cards on the shelf', onUse: (gm) => say(gm, { name: 'The guests\' shelf', colour: '#FFD9A0' }, cards.slice(0, 3)) });
    s.zoneBox({ id: lot.id + '/shelf', place: 'city-special', box: L.clip(a, -0.5, FW, b, LH, F, 0).slice(0, 6), name: 'The guests\' shelf', sub: Name + ' · what guests brought', ambience: 'shop', reverb: 'felt', headroom: LH, cell: info.key });
  }
  await T('6');

  // =============================================================================================================
  // the washroom
  // =============================================================================================================
  {
    const a = wash[0] + 0.08, b = wash[1] - 0.08;
    const clip = L.clip(a, -0.3, FW, b, LH + 0.05, F);
    L.glowBox(a, 0, FW, b, LH, F, { sky: '#ffe8cc', ground: '#a9c9b8', power: 0.32 });
    // tile lining up to 1.8 on the front and back walls
    s.structure(() => { g.mat('tile', '#e9e2d0'); L.box(a, 0, FW + 0.08, b, 1.8, FW + 0.1); L.box(a, 0, F - 0.1, b, 1.8, F - 0.08); g.mat('tile', pal.dado); L.box(a, 1.8, FW + 0.08, b, 1.88, FW + 0.11); L.box(a, 1.8, F - 0.11, b, 1.88, F - 0.08); });
    // basins along the front wall
    const nB = Math.max(2, Math.floor((b - a - 0.6) / 1.15));
    for (let k = 0; k < nB; k++) { const p = a + 0.3 + (b - a - 0.6) * (k + 0.5) / nB; L.prop('baths.tap', p, 0, FW + 0.08, 0, { tile: '#efe4cc' }); L.spot('stand', p, 0, FW + 0.75, Math.PI, { tags: ['wash', 'inn'] }); }
    // showers along the back wall, from the outer end to short of the door
    const sa = flip ? washDoor + 1.5 : a + 0.05, sb = flip ? b - 0.05 : washDoor - 0.3;
    const nS = Math.max(1, Math.floor((sb - sa) / 1.15)), sw = (sb - sa) / nS;
    for (let k = 0; k < nS; k++) {
      const p0 = sa + k * sw, p1 = p0 + sw;
      s.furniture(() => {
        g.mat('tile', '#6fa898'); for (const p of k === 0 ? [p0, p1] : [p1]) L.box(p - 0.03, 0, F - 1.25, p + 0.03, 2.05, F - 0.1, { bevel: 0.01 });
        g.mat('cast', '#b8913f', { rough: -0.2 }); L.tube([[(p0 + p1) / 2, 2.25, F - 0.12], [(p0 + p1) / 2, 2.25, F - 0.4]], 0.018, { segs: 6 });
        L.lathe((p0 + p1) / 2, F - 0.45, [[0.02, 2.25], [0.09, 2.2], [0.1, 2.18], [0, 2.18]], { segs: 12 });
        L.tube([[p0 + 0.05, 2.05, F - 1.22], [p1 - 0.05, 2.05, F - 1.22]], 0.01, { segs: 5 });
        g.mat('grille', '#b8913f'); L.box(p0 + 0.2, 0.0, F - 0.9, p1 - 0.2, 0.006, F - 0.3);
        const open = r.chance(0.5), c = pal.felt[(k + 1) % 4];
        g.mat('weave', c); if (open) L.sheet([p0 + 0.06, 2.04, F - 1.22], [p0 + 0.3, 2.04, F - 1.22], [p0 + 0.3, 0.3, F - 1.2], [p0 + 0.06, 0.3, F - 1.2], { nu: 3, nv: 4, ripple: 0.03, rippleN: 4 });
        else L.sheet([p0 + 0.06, 2.04, F - 1.22], [p1 - 0.06, 2.04, F - 1.22], [p1 - 0.06, 0.3, F - 1.2], [p0 + 0.06, 0.3, F - 1.2], { nu: 4, nv: 4, ripple: 0.03, rippleN: 6 });
      });
      for (const p of k === 0 ? [p0, p1] : [p1]) L.solid(p - 0.03, 0, F - 1.25, p + 0.03, 2.05, F - 0.1);
    }
    // a slatted bench down the middle, towels on the end wall, buckets
    const mp = (a + b) / 2, mq = F / 2 - 0.2;
    s.furniture(() => { g.mat('wood', '#9a7448'); for (let k = 0; k < 4; k++) L.box(mp - Math.min(1.6, (b - a) / 2 - 0.9), 0.42, mq - 0.2 + k * 0.11, mp + Math.min(1.6, (b - a) / 2 - 0.9), 0.45, mq - 0.12 + k * 0.11, { bevel: 0.006 }); g.mat('tile', '#6fa898'); for (const sx of [-1, 1]) L.box(mp + sx * 1.0 - 0.06, 0, mq - 0.2, mp + sx * 1.0 + 0.06, 0.42, mq + 0.2); });
    L.solid(mp - 1.6, 0, mq - 0.2, mp + 1.6, 0.45, mq + 0.2);
    for (const k of [-0.6, 0.6]) L.spot('sit', mp + k, 0.45, mq + 0.05, 0, { tags: ['wash', 'inn'] });
    const ep = flip ? b - 0.25 : a + 0.25;
    L.prop('baths.towels', ep, 0, F / 2 - 0.4, flip ? -Math.PI / 2 : Math.PI / 2, { w: 1.4, h: 1.7, shelves: 4, seed: seed % 13 });
    L.prop('baths.bucket', mp + 1.9, 0, mq, 0.3, { dipper: true }); L.prop('baths.stool', mp - 1.9, 0, mq, 0.2, { wood: '#9a7448' });
    L.prop('baths.fernpot', ep, 0, FW + 0.5, 0, { pot: pal.dado, size: 0.9 });
    L.lamp('globe', mp, 2.7, F / 2, { r: 0.16, drop: 0.4, clip, K: 3200, power: 1.0 });
    L.loop('shower', (sa + sb) / 2, 1.5, F - 0.8, { vol: 0.16, radius: 8 });
    s.zoneBox({ id: lot.id + '/wash', place: 'city-special', box: L.clip(a, -0.5, FW, b, LH, F, 0), name: 'The washroom', sub: Name + ' · on the loop', ambience: 'baths', reverb: 'tile', headroom: LH, cell: info.key });
  }
  await T('7');

  // =============================================================================================================
  // the parlour (and the drying room)
  // =============================================================================================================
  {
    const a = par[0] + 0.08, b = par[1] - 0.08, w = b - a, mp = (a + b) / 2, mq = F / 2;
    const clip = L.clip(a, -0.3, FW, b, LH + 0.05, F);
    L.glowBox(a, 0, FW, b, LH, F, { sky: '#ffd9a8', ground: '#a8794f', power: 0.3 });
    L.prop('rug', mp, 0, mq, Math.PI / 2, { w: Math.min(F - 2.6, 4.4), d: Math.min(w - 1.6, 3.2), a: pal.felt[0], b: pal.felt[1] });
    // two settles facing across a low table
    for (const sg of [-1, 1]) L.prop('lots-baths.inn-sofa', mp + sg * 1.25, 0, mq, sg < 0 ? Math.PI / 2 : -Math.PI / 2, { w: 1.8, wood: '#5a3d28', cloth: pal.felt[sg < 0 ? 2 : 3] }, { spot: { tags: ['inn', 'parlour'] } });
    s.furniture(() => { g.mat('wood', '#5a3d28'); L.box(mp - 0.35, 0.36, mq - 0.55, mp + 0.35, 0.41, mq + 0.55, { bevel: 0.012 }); for (const sp of [-0.28, 0.28]) for (const sq of [-0.48, 0.48]) L.box(mp + sp - 0.025, 0, mq + sq - 0.025, mp + sp + 0.025, 0.36, mq + sq + 0.025); });
    L.solid(mp - 0.35, 0, mq - 0.55, mp + 0.35, 0.41, mq + 0.55);
    L.prop('baths.teapot', mp, 0.41, mq - 0.2, 0.3, { glaze: pal.dado });
    for (const c of [[-0.15, 0.15], [0.15, 0.3], [0.1, -0.35]]) L.prop('cup', mp + c[0], 0.41, mq + c[1], 0, { glaze: '#efe4cc', lid: pal.felt[1] });
    // a writing table for cards home, a toy crate, children on the floor
    const wp = flip ? a + 0.5 : b - 0.5;
    if (w > 5.2) {
      L.prop('table', wp, 0, F - 1.4, flip ? Math.PI / 2 : -Math.PI / 2, { w: 1.2, d: 0.6, wood: '#6f4e33' });
      L.prop('chair', wp + (flip ? 0.75 : -0.75), 0, F - 1.4, flip ? -Math.PI / 2 : Math.PI / 2, { wood: '#5a3a26', back: 'slat' }, { noSpots: true });
      L.spot('work', wp + (flip ? 0.75 : -0.75), 0, F - 1.4, flip ? -Math.PI / 2 : Math.PI / 2, { tags: ['write', 'inn'] });
      s.detail(() => { g.mat('paper', '#f3ead6'); for (let k = 0; k < 5; k++) L.box(wp - 0.2 + k * 0.004, 0.74 + k * 0.004, F - 1.6, wp + 0.0 + k * 0.004, 0.744 + k * 0.004, F - 1.3); });
    }
    // in a long parlour, more tables: a round one with chairs either side of the settles
    for (const k of w > 13 ? [-1, 1] : w > 9 ? [flip ? -1 : 1] : []) {
      const tp2 = mp + k * w * 0.3, tq2 = mq + 0.3;
      L.prop('table', tp2, 0, tq2, 0, { w: 0.8, round: true, wood: '#6f4e33' });
      for (let c = 0; c < 3; c++) { const an = c * 2.094 + 0.5, cp = tp2 + Math.sin(an) * 0.7, cq = tq2 + Math.cos(an) * 0.7; L.prop('chair', cp, 0, cq, an + Math.PI, { wood: '#5a3a26', back: 'hoop', seat: pal.felt[(c + 1) % 4] }, { spot: { tags: ['inn', 'parlour'] } }); }
      L.prop('baths.teapot', tp2 + 0.1, 0.74, tq2, 0, { glaze: pal.felt[2] }, { noCollide: true });
      L.prop('cup', tp2 - 0.15, 0.74, tq2 + 0.1, 0, { glaze: '#efe4cc', lid: pal.felt[0] }, { noCollide: true });
    }
    // a dresser of plates and toys on the end wall
    { const ep = flip ? a + 0.2 : b - 0.2, ea = flip ? Math.PI / 2 : -Math.PI / 2, ew = Math.min(2.4, F - 4.6);
      L.prop('shelving', ep, 0, F / 2 - 0.3, ea, { w: ew, h: 1.9, d: 0.34, shelves: 4, wood: '#5a3d28', back: true });
      for (let j = 1; j < 4; j++) for (let k = 0; k < 5; k++) { const qq = F / 2 - 0.3 - ew / 2 + 0.3 + k * (ew - 0.6) / 4, y = 0.08 + j * (1.9 - 0.11) / 4 + 0.025;
        if (j === 1) L.prop('crock', ep + (flip ? 0.02 : -0.02), y, qq, 0, { glaze: glazeC[(k + j) % 6], h: 0.2, r: 0.07 }, { noCollide: true });
        else L.prop(j === 2 ? 'bowl' : 'cup', ep + (flip ? 0.02 : -0.02), y, qq, 0, { glaze: glazeC[(k * 2 + j) % 6], lid: lidC[k % 5], r: 0.08 }, { noCollide: true }); }
    }
    const tp = flip ? b - 0.6 : a + 0.6;
    L.prop('crate', tp, 0, FW + 0.6, 0, { w: 0.6, h: 0.34, d: 0.42, wood: '#b08d5e' });
    s.detail(() => { const bc = ['#c9552e', '#2f6f73', '#d6a640', '#33407a']; for (let k = 0; k < 4; k++) { g.mat('knit', bc[k]); L.ball(tp - 0.15 + k * 0.1, 0.38, FW + 0.55 + (k % 2) * 0.1, 0.06, 0.06, 0.06, { segs: 8, rings: 5 }); } g.mat('wood', '#c9a46a'); L.box(tp + 0.4, 0, FW + 0.9, tp + 0.55, 0.15, FW + 1.05, { bevel: 0.02 }); });
    for (const k of [0, 1, 2]) L.spot('play', tp + (flip ? -1 : 1) * (0.8 + k * 0.7), 0, FW + 1.4 + (k % 2) * 0.6, k * 2, { tags: ['floor', 'inn'] });
    chatRing(L, mp, F - 1.3, 3, 0.65, ['inn', 'parlour']);
    L.prop('baths.fernpot', flip ? b - 0.4 : a + 0.4, 0, F - 0.45, 0, { pot: pal.accent, size: 1.0 });
    // herbs on the window sills
    for (const wv of wins) if (wv.kind === 'clear' && wv.at > a - 0.1 && wv.at + wv.w < b + 0.1) for (let k = 0; k < 3; k++) L.prop('plant', wv.at + 0.3 + k * (wv.w - 0.6) / 2, wv.sill, FW + 0.2, 0, { kind: 'fine', size: 0.3, pot: '#a3563a' }, { noCollide: true });
    L.lamp('lantern', mp, 2.45, mq, { tint: pal.felt[1], drop: 0.5, power: 0.8, K: 2600, clip });
    s.deco(() => {
      g.mat('wood', pal.trim); L.box(a + 0.1, 2.5, F - 0.12, b - 0.1, 2.55, F - 0.09);
      let k = 0; for (let u = a + 0.5; u + 1.2 < b - 0.3; u += 1.9) { if (u + 1.3 > parDoor && u - 0.1 < parDoor + 1.4) continue; g.mat(k % 2 ? 'motif' : 'felt', pal.felt[(k + 2) % 4]); L.sheet([u, 2.48, F - 0.1], [u + 1.2, 2.48, F - 0.1], [u + 1.2, 1.3, F - 0.12], [u, 1.3, F - 0.12], { nu: 3, nv: 3, ripple: 0.02, rippleN: 3 }); k++; }
      g.mat('cast', '#b8913f'); L.tube([[a + 0.3, 2.5, F - 0.16], [b - 0.3, 2.5, F - 0.16]], 0.01, { segs: 4 });
    });
    L.loop('kids', mp, 1.0, mq, { vol: 0.12, radius: 9 });
    L.interact({ p: mp, y: 1.0, q: mq, radius: 2.4, prompt: 'Look round the parlour', onUse: (gm) => say(gm, { name: 'The parlour', colour: '#FFD9A0' }, pickBy(seed, 30, PARLOUR)) });
    s.zoneBox({ id: lot.id + '/parlour', place: 'city-special', box: L.clip(a, -0.5, FW, b, LH, F, 0), name: 'The parlour', sub: Name + ' · where families meet their guests', ambience: 'shop', reverb: 'felt', headroom: LH, cell: info.key });
    if (dry) {
      const da = dry[0] + 0.08, db = dry[1] - 0.08;
      L.glowBox(da, 0, FW, db, LH, F, { sky: '#ffe2bc', ground: '#a8794f', power: 0.36 });
      s.furniture(() => {
        g.mat('felt', '#efe4cc'); L.tube([[da + 0.2, 0.25, F - 0.35], [db - 0.2, 0.25, F - 0.35]], 0.08, { segs: 10 });
        g.mat('cast', '#b8913f'); for (const q of [2.2, 4.0, 5.8]) L.tube([[da + 0.1, 2.3, q], [db - 0.1, 2.3, q]], 0.016, { segs: 6 });
      });
      s.deco(() => {
        for (const q of [2.2, 4.0, 5.8]) { let u = da + 0.3; while (u < db - 0.5) { const w2 = r.f(0.4, 0.8); g.mat(r.chance(0.3) ? 'stripe' : 'weave', pal.felt[r.i(0, 3)]); L.sheet([u, 2.3, q - 0.02], [u + w2, 2.3, q - 0.02], [u + w2, 2.3 - r.f(0.6, 1.2), q], [u, 2.3 - r.f(0.6, 1.2), q], { nu: 3, nv: 3, ripple: 0.02 }); u += w2 + 0.12; } }
      });
      L.spot('work', (da + db) / 2, 0, 3.1, 0, { tags: ['sew', 'inn'] });
    }
  }
  await T('8');

  // =============================================================================================================
  // the common room: the long table, the hot shelf, felt, the drum board, the lamp panels
  // =============================================================================================================
  L.glowBox(0.16, 0, F, W - 0.16, HH, GQ, { sky: '#ffd6a0', ground: '#a8794f', power: 0.27 });
  L.glowBox(0.16, LH, F, W - 0.16, HH, D, { sky: '#ffcf96', ground: '#e9c894', power: 0.22 });
  const pT0 = 3.4, pT1 = W - 3.9, qt = F + (GQ - F) * 0.46;
  for (let p = pT0; p < pT1 - 0.01; p += 8) {
    const pe = Math.min(pT1, p + 8);
    s.furniture(() => {
      g.mat('wood', '#7a5233', { rough: -0.1 }); L.box(p, 0.7, qt - 0.45, pe, 0.76, qt + 0.45, { bevel: 0.012 });
      g.mat('wood', '#5a3a26'); for (let u = p + 0.4; u < pe; u += 2.4) L.box(u - 0.06, 0, qt - 0.38, u + 0.06, 0.7, qt + 0.38);
      g.mat('stripe', pal.felt[0]); L.box(p + 0.15, 0.76, qt - 0.16, pe - 0.15, 0.765, qt + 0.16);
      for (const sg of [-1, 1]) { g.mat('wood', '#8a6240'); L.box(p, 0.4, qt + sg * 0.78 - 0.16, pe, 0.45, qt + sg * 0.78 + 0.16, { bevel: 0.01 }); g.mat('wood', '#5a3a26'); for (let u = p + 0.3; u < pe; u += 2.0) L.box(u - 0.05, 0, qt + sg * 0.78 - 0.13, u + 0.05, 0.4, qt + sg * 0.78 + 0.13); }
    });
    L.solid(p, 0, qt - 0.45, pe, 0.76, qt + 0.45);
    for (const sg of [-1, 1]) L.solid(p, 0, qt + sg * 0.78 - 0.16, pe, 0.45, qt + sg * 0.78 + 0.16);
    await T('9');
  }
  const seats = [];
  for (const sg of [-1, 1]) for (let p = pT0 + 0.45; p < pT1 - 0.3; p += 0.75) {
    const a = sg < 0 ? 0 : Math.PI; seats.push({ p, q: qt + sg * 0.78, a });
    L.spot('sit', p, 0.45, qt + sg * 0.78, a, { tags: ['inn', 'eat', 'table'] });
  }
  for (let p = pT0 + 0.6; p < pT1 - 0.4; p += 1.5) for (const sg of [-1, 1]) if (r.chance(0.36)) L.prop('bowl', p + r.f(-0.2, 0.2), 0.765, qt + sg * 0.27, r.f(0, 3), { glaze: glazeC[r.i(0, 5)], lid: lidC[r.i(0, 4)], r: 0.09 }, { noCollide: true });
  for (let p = pT0 + 2.5; p < pT1 - 1.5; p += 6) { L.prop('plant', p, 0.765, qt, 0, { kind: 'fine', size: 0.36, pot: '#a3563a' }, { noCollide: true }); L.prop('baths.teapot', p + 1.4, 0.765, qt + 0.05, r.f(0, 3), { glaze: pal.felt[r.i(0, 3)] }, { noCollide: true }); }
  await T('10');
  // lanterns low over the table on long cords
  const nLan = 4;
  for (let k = 0; k < nLan; k++) { const p = pT0 + (pT1 - pT0) * (k + 0.5) / nLan; L.lamp('lantern', p, 2.3, qt, { tint: pal.felt[k % 4], drop: HH - 2.3 - 0.3, r: 0.26, hh: 0.4, power: 1.25, K: 2600, clip: clipCommon, range: 8 }); }
  // the hot shelf against the far wall: a tiled counter on the loop, the urn, cups, crocks; the cook beside it
  const hp = W - 0.16, cq = qt;
  s.furniture(() => {
    g.mat('tile', pal.dado); L.box(hp - 0.62, 0, cq - 1.7, hp, 0.88, cq + 1.7, { bevel: 0.01 });
    g.mat('cast', '#b8913f', { rough: -0.2 }); L.box(hp - 0.66, 0.88, cq - 1.74, hp, 0.92, cq + 1.74, { bevel: 0.008 });
    g.mat('wood', '#5a3d28'); L.box(hp - 0.3, 1.6, cq - 1.6, hp, 1.63, cq + 1.6, { bevel: 0.006 });
    g.mat('felt', '#efe4cc'); L.tube([[hp - 0.12, 0.1, cq - 2.4], [hp - 0.12, 0.1, cq - 1.2], [hp - 0.12, 0.8, cq - 1.2]], 0.07, { segs: 10 });
    g.mat('cast', '#b8913f'); for (const q of [cq - 2.1, cq - 1.6]) L.tube([[hp - 0.12, 0.1, q - 0.03], [hp - 0.12, 0.1, q + 0.03]], 0.078, { segs: 10 });
  });
  L.solid(hp - 0.66, 0, cq - 1.74, hp, 0.92, cq + 1.74);
  L.prop('baths.urn', hp - 0.32, 0.92, cq - 1.0, -Math.PI / 2, {});
  for (let i = 0; i < 12; i++) L.prop('cup', hp - 0.48 + (i % 3) * 0.13, 0.92, cq - 0.35 + Math.floor(i / 3) * 0.2, 0, { glaze: glazeC[i % 6], lid: lidC[(i + 1) % 5] });
  for (let i = 0; i < 3; i++) L.prop('crock', hp - 0.33, 0.92, cq + 0.75 + i * 0.32, 0, { glaze: ['#3a2a20', '#a3563a', '#d9c7a6'][i], h: 0.26, r: 0.11 });
  for (let i = 0; i < 9; i++) L.prop('cup', hp - 0.14, 1.63, cq - 1.4 + i * 0.34, 0, { glaze: glazeC[(i + 3) % 6], lid: lidC[i % 5] }, { noCollide: true });
  L.sign({ kind: 'chalk', title: 'Tonight', lines: ['Eat at ' + info.hall, info.dish[0], 'Tea on the loop · free', 'Lamps fade at eleven'] }, hp - 0.02, 2.3, cq, [-1, 0], { w: 0.62, h: 0.85 });
  await T('chalk');
  L.spot('work', hp - 1.15, 0, cq + 0.4, Math.PI / 2, { tags: ['cook', 'inn'] });
  L.lamp('globe', hp - 1.2, 2.9, cq, { r: 0.18, drop: HH - 2.9 - 0.2, clip: clipCommon, K: 2800, power: 1.0 });
  chatRing(L, hp - 2.4, cq - 3.2, 3, 0.65, ['inn']);
  L.spot('play', pT0 - 1.2, 0, qt - 2.0, 1, { tags: ['run', 'inn'] }); L.spot('play', pT1 + 0.8, 0, qt + 2.2, 2, { tags: ['hop', 'inn'] });
  L.spot('work', cx + 4, 0, qt - 2.6, 0, { tags: ['sweep', 'inn'] });
  await T('11');

  // --- up the walls: felt hangings on the party walls, lamp panels and the drum board on the front wall, beams
  s.deco(() => {
    for (const side of [0, 1]) {
      const p = side ? W - 0.17 : 0.17;
      let k = side;
      for (let q = F + 1.0; q + 1.8 < GQ - 0.3; q += 3.4) {
        g.mat('felt', pal.felt[k++ % 4]);
        if (side) L.sheet([p, 6.4, q + 1.8], [p, 6.4, q], [p - 0.02, 3.9, q], [p - 0.02, 3.9, q + 1.8], { nu: 5, nv: 4, ripple: 0.025, rippleN: 5 });
        else L.sheet([p, 6.4, q], [p, 6.4, q + 1.8], [p + 0.02, 3.9, q + 1.8], [p + 0.02, 3.9, q], { nu: 5, nv: 4, ripple: 0.025, rippleN: 5 });
      }
      g.mat('cast', '#3a2a1e'); L.tube([[p + (side ? -0.02 : 0.02), 6.45, F + 0.9], [p + (side ? -0.02 : 0.02), 6.45, GQ - 0.3]], 0.015, { segs: 5 });
    }
  });
  const bw = Math.min(9, W * 0.26), b0 = cx - bw / 2, b1 = cx + bw / 2, by0 = 3.85, by1 = 6.35, fq = F + 0.09;
  // round lamps (lenses of frosted glass in brass rims) along the upper front wall either side of the board
  let kk = 0;
  for (const sg of [-1, 1]) {
    for (let p = sg < 0 ? b0 - 2.0 : b1 + 2.0; sg < 0 ? p > 1.2 : p < W - 1.2; p += sg * 4.6) {
      const tint = mixHex(pal.felt[kk++ % 4], '#ffc070', 0.35);
      s.structure(() => {
        g.mat('tile', pal.dado); L.ball(p, 5.1, fq, 0.62, 0.62, 0.02, { segs: 16, rings: 3 });
        g.mat('cast', '#b8913f', { rough: -0.25 }); L.ball(p, 5.1, fq + 0.02, 0.5, 0.5, 0.04, { segs: 16, rings: 3 });
        g.mat('diffuser', tint, { emissive: 2.6, lamp: true }); L.ball(p, 5.1, fq + 0.04, 0.34, 0.34, 0.09, { segs: 14, rings: 4 });
        g.mat('cast', '#b8913f', { rough: -0.25 }); for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3; L.tube([[p + Math.cos(an) * 0.08, 5.1 + Math.sin(an) * 0.08, fq + 0.14], [p + Math.cos(an) * 0.4, 5.1 + Math.sin(an) * 0.4, fq + 0.07]], 0.008, { segs: 4 }); }
      });
    }
  }
  // the drum board: the rows of the swarm painted dark, the drums gilded, a brass pin in every drum a guest came from,
  // threads from the pins to Chervil in the middle
  s.structure(() => {
    g.mat('wood', pal.trim); L.box(b0 - 0.12, by0 - 0.12, fq, b1 + 0.12, by1 + 0.12, fq + 0.06, { bevel: 0.015 });
    g.mat('paint', '#1d2a3a'); L.box(b0, by0, fq + 0.06, b1, by1, fq + 0.075);
  });
  s.detail(() => {
    const rows = 7, cols = Math.max(6, Math.round(bw / 1.05)), mid = [cx, (by0 + by1) / 2];
    for (let j = 0; j < rows; j++) {
      const y = by0 + 0.2 + j * (by1 - by0 - 0.4) / (rows - 1);
      g.mat('cast', '#b8913f'); L.box(b0 + 0.15, y - 0.006, fq + 0.075, b1 - 0.15, y + 0.006, fq + 0.08);
      for (let i = 0; i < cols; i++) {
        const p = b0 + 0.3 + i * (bw - 0.6) / (cols - 1);
        if (j === 3 && i === Math.floor(cols / 2)) continue;
        g.mat('paint', ['#d6a640', '#c9552e', '#6fa898', '#efe4cc'][(i * 3 + j) % 4]); L.box(p - 0.06, y - 0.06, fq + 0.075, p + 0.06, y + 0.06, fq + 0.085);
        if (r.chance(0.45)) {
          g.mat('cast', '#e0b04a', { rough: -0.3 }); L.ball(p + 0.04, y + 0.04, fq + 0.11, 0.022, 0.022, 0.022, { segs: 6, rings: 4 });
          g.mat('weave', pal.felt[(i + j) % 4]); L.tube([[p + 0.04, y + 0.04, fq + 0.1], [mid[0], mid[1], fq + 0.1]], 0.004, { segs: 3, caps: false });
        }
      }
    }
    g.mat('cast', '#e0b04a', { rough: -0.3 }); L.box(mid[0] - 0.16, mid[1] - 0.16, fq + 0.075, mid[0] + 0.16, mid[1] + 0.16, fq + 0.1, { bevel: 0.03 });
  });
  L.light({ at: [cx, 3.55, F + 1.2], type: 'spot', dir: [0, 0.9, -0.35], cone: [60, 35], color: '#ffe0b0', power: 3.2, range: 5, clip: clipCommon, lamp: true });
  // felt baffles hung along the room under the beams (the air is heliox: bare rooms ring)
  s.deco(() => { let k = 1; for (let p = 4.5; p < W - 3; p += 4.8) { g.mat('felt', pal.felt[k++ % 4]); L.sheet([p, 6.78, F + 1.2], [p, 6.78, GQ - 1.0], [p, 6.1, GQ - 1.0], [p, 6.1, F + 1.2], { nu: 10, nv: 2, ripple: 0.03, rippleN: 12 }); } });
  // beams across the tall ceiling
  s.deco(() => { g.mat('wood', shadeHex(pal.floor, 0.55)); for (let p = 2.0; p < W - 1; p += 3.6) L.box(p - 0.1, HH - 0.26, F + 0.1, p + 0.1, HH, D - 0.2, { bevel: 0.012 }); });
  await T('12');

  // =============================================================================================================
  // the gallery, the stair, the rooms
  // =============================================================================================================
  // the gallery's slab over the corridor and the ground rooms, its painted edge, its floor
  for (let p = 0.16; p < W - 0.17; p += 8) { const pe = Math.min(W - 0.16, p + 8); s.structure(() => { g.mat('wood', shadeHex(pal.floor, 0.7)); L.box(p, CH, GQ, pe, GY - 0.02, D - 0.16); g.mat('paint', pal.dado); L.box(p, CH - 0.08, GQ - 0.04, pe, GY + 0.04, GQ + 0.02); g.mat('cast', '#b8913f'); L.box(p, GY + 0.04, GQ - 0.05, pe, GY + 0.06, GQ + 0.02); }); }
  L.floor(0.16, GQ, W - 0.16, D - 0.16, GY, 'planks', shadeHex(pal.floor, 1.05));
  const rp = []; for (let p = 1.6; p < W - 0.3; p += 6) rp.push(L.P(Math.min(p, W - 0.3), GQ + 0.04)); rp.push(L.P(W - 0.3, GQ + 0.04));
  railing(s, rp, GY, { tint: pal.trim, rail: '#7a5233', posts: 1.5 });
  for (let p = 4.2; p < W - 1.0; p += 4.8) { const c = L.P(p, GQ + 0.14); column(s, c[0], 0, c[1], CH - 0.1, { r: 0.1, mat: 'wood', tint: pal.trim }); }
  // the stair up the low-p party wall, its panelled side and handrail
  L.stairs(0.85, 0, GQ - 6.3, [0, 1], GY, 6.3, 1.1, { mat: 'wood', tint: shadeHex(pal.floor, 1.1), nosing: pal.trim });
  for (let k = 0; k < 6; k++) {
    const q0 = GQ - 6.3 + k * 1.05, top = GY * (k + 1) / 6;
    s.structure(() => { g.mat('wood', pal.dado); L.box(1.4, 0, q0, 1.48, top, q0 + 1.05); });
    L.solid(1.4, 0, q0, 1.5, top + 0.95, q0 + 1.05);
  }
  s.furniture(() => {
    g.mat('wood', '#7a5233'); L.tube([[1.44, 0.95, GQ - 6.3], [1.44, GY + 0.95, GQ]], 0.028, { segs: 8 });
    g.mat('cast', pal.trim); for (let k = 0; k <= 6; k++) { const q = GQ - 6.3 + k * 1.05, y = GY * k / 6; L.tube([[1.44, y, q], [1.44, y + 0.95, q]], 0.016, { segs: 5 }); }
  });
  await T('13');

  // the ground rooms: a front wall with a door each, partitions, and in each a bed, a lamp, a hook
  const n = Math.max(6, Math.floor((W - 0.32) / 2.8)), rw = (W - 0.32) / n;
  const doorAt = (i) => { const pa = 0.16 + i * rw; return i % 2 === 0 ? pa + rw - 1.05 : pa + 0.2; };
  L.wallP(RQ, 0.16, W - 0.16, 0, CH, Object.assign({}, wallO, { openings: Array.from({ length: n }, (_, i) => ({ at: doorAt(i) - 0.16, w: 0.85, h: 2.1 })) }));
  for (let i = 1; i < n; i++) L.wallQ(0.16 + i * rw, RQ + 0.08, D - 0.16, 0, CH, { tint: mixHex(wallT, '#ffffff', 0.2), t: 0.1, skirt: pal.trim });
  const lit = new Set([r.i(0, 1), r.i(Math.floor(n / 3), Math.floor(n / 2)), r.i(n - 2, n - 1)]);
  const clipRooms = L.clip(0.16, -0.3, GQ, W - 0.16, CH, D - 0.16);
  L.glowBox(0.16, 0, GQ, W - 0.16, CH, D - 0.16, { sky: '#ffd6a0', ground: '#a8794f', power: 0.36 });
  const covers = pal.felt.concat(['#efe4cc', '#6fa898']);
  for (let i = 0; i < n; i++) {
    const pa = 0.16 + i * rw, pb = pa + rw, dr = i % 2 === 0;                // dr: the door is at the pb end
    const bp = dr ? pa + 0.08 + 0.52 : pb - 0.08 - 0.52, bq = D - 0.16 - 1.05;
    const dpm = doorAt(i) + 0.425;
    const ci = (i * 3 + seed) % 4;
    L.prop('lots-baths.inn-bed', bp, 0, bq, Math.PI, { frame: '#6b4a2f', cover: pal.felt[ci], quilt: ci === 1 ? [pal.felt[2], pal.felt[0], '#efe4cc'] : null, mend: pal.accent }, { tint: [[1, 1, 1], [0.92, 0.88, 0.85], [1.05, 1.0, 0.95]][i % 3] });
    // the lamp over the bed head: a real light in a few rooms, a lit or dark shade in the rest
    const on = lit.has(i) || r.chance(0.45);
    s.deco(() => {
      g.mat('cast', '#8a6d3b'); L.box(bp - 0.06, 1.35, D - 0.17, bp + 0.06, 1.55, D - 0.2);
      g.mat('diffuser', '#ffd9a0', on ? { emissive: 3.0, lamp: true } : undefined); L.ball(bp, 1.45, D - 0.28, 0.07, 0.09, 0.07, { segs: 8, rings: 6 });
      // a small rug, a curtain at the door
      g.mat('weave', covers[(i + 2) % covers.length]); L.box(dr ? bp + 0.55 : bp - 1.25, 0.004, bq - 0.6, dr ? bp + 1.25 : bp - 0.55, 0.012, bq + 0.5);
      g.mat('weave', pal.felt[i % 4]); L.sheet([dpm + (dr ? 0.42 : -0.42), 2.1, RQ + 0.1], [dpm + (dr ? 0.22 : -0.22), 2.1, RQ + 0.1], [dpm + (dr ? 0.28 : -0.28), 0.1, RQ + 0.14], [dpm + (dr ? 0.42 : -0.42), 0.1, RQ + 0.14], { nu: 2, nv: 4, ripple: 0.02, rippleN: 3 });
      g.mat('paint', '#b8913f'); L.box(dpm - 0.07, 2.2, RQ - 0.1, dpm + 0.07, 2.32, RQ - 0.08);
    });
    if (lit.has(i)) L.lamp('bulb', bp, 1.5, D - 0.5, { K: 2500, power: 0.35, range: 3.5, clip: L.clip(pa, -0.3, RQ, pb, CH, D - 0.16) });
    L.prop('lots-baths.inn-hook', dr ? pb - 0.06 : pa + 0.06, 0, RQ + 1.0, dr ? -Math.PI / 2 : Math.PI / 2, [{ coat: pal.felt[1], bag: null, lining: pal.accent, mend: pal.felt[0] }, { coat: null, bag: pal.felt[3], lining: pal.accent, mend: pal.felt[0] }, { coat: pal.felt[2], bag: pal.felt[0], lining: pal.accent, mend: pal.felt[1] }, { coat: null, bag: null }][(i + seed) % 4]);
    if (i % 2 === 0) L.prop('stool', dr ? bp + 0.75 : bp - 0.75, 0, D - 0.45, 0, { wood: '#7a5a3a', h: 0.45 }, { noSpots: true });
    if (i % 2 === 0 && r.chance(0.6)) L.prop('cup', dr ? bp + 0.75 : bp - 0.75, 0.45, D - 0.45, 0, { glaze: '#efe4cc', lid: pal.felt[i % 4] }, { noCollide: true });
    const key = 'inn-bed-' + i;
    L.interact({ p: bp, y: 0.7, q: bq - 0.5, radius: 1.0, prompt: (gm) => seatedAs(gm, key) ? 'Get up' : 'Lie down a while', async onUse(gm) {
      if (seatedAs(gm, key)) { gm.player.stand(); return; }
      if (!sitPlayer(L, gm, bp, 0.5, bq + 0.2, Math.PI, 0.32, key, 0.35)) return;
      if (!gm.ui || !gm.clock || !gm.ui.pickHour) return;
      gm.busy++; let h = null;
      try { h = await gm.ui.pickHour({ title: 'Lie here until', from: gm.clock.hours, to: gm.clock.hours + 8, now: gm.clock.hours }); } finally { gm.busy--; }
      if (h !== null && h !== undefined) { gm.clock.skipTo(h % 24); note(gm, pickBy(seed, 40 + (gm.flags.innNaps = (gm.flags.innNaps || 0) + 1), WAKE)); }
    } });
    if (i % 4 === 1) await T('14');
  }
  // the corridor's lamps
  for (const k of [0.17, 0.5, 0.83]) { const p = 0.16 + Math.round(n * k) * rw; L.lamp('sconce', p, 2.35, RQ - 0.08, { face: [0, -1], K: 2700, power: 1.1, range: 7, clip: clipRooms }); }
  await T('15');

  // the upper rooms: a wall of closed doors along the gallery, one or two open, lit inside
  const open = new Set([r.i(1, Math.max(1, Math.floor(n / 2) - 1))]); if (n > 9) open.add(r.i(Math.floor(n / 2) + 1, n - 2));
  L.wallP(RQ, 0.16, W - 0.16, GY, HH - GY, Object.assign({}, wallO, { openings: [...open].map((i) => ({ at: doorAt(i) - 0.16, w: 0.85, h: 2.1 })) }));
  s.structure(() => {
    for (let i = 0; i < n; i++) {
      if (open.has(i)) continue;
      const d0 = doorAt(i), q = RQ - 0.1;
      g.mat('paint', pal.trim); L.box(d0 - 0.07, GY, q - 0.02, d0 + 0.92, GY + 2.2, q + 0.02);
      g.mat('wood', ['#6b4a2f', '#7a5233', pal.dado, '#5a3d28'][(i + seed) % 4]); L.box(d0, GY, q - 0.05, d0 + 0.85, GY + 2.1, q);
      g.mat('wood', '#3a2a1e'); L.box(d0 + 0.1, GY + 1.2, q - 0.065, d0 + 0.75, GY + 1.9, q - 0.05); L.box(d0 + 0.1, GY + 0.2, q - 0.065, d0 + 0.75, GY + 1.0, q - 0.05);
      g.mat('cast', '#c4a05a', { rough: -0.25 }); L.box(i % 2 === 0 ? d0 + 0.7 : d0 + 0.09, GY + 0.98, q - 0.1, i % 2 === 0 ? d0 + 0.76 : d0 + 0.15, GY + 1.04, q - 0.05); L.box(d0 + 0.36, GY + 1.95, q - 0.07, d0 + 0.5, GY + 2.05, q - 0.05);
    }
  });
  for (const i of open) {
    const pa = 0.16 + i * rw, pb = pa + rw, dr = i % 2 === 0, bp = dr ? pa + 0.6 : pb - 0.6, bq = D - 0.16 - 1.05;
    L.wallQ(pa, RQ + 0.08, D - 0.16, GY, HH - GY, { tint: mixHex(wallT, '#ffffff', 0.2), t: 0.1, skirt: pal.trim });
    L.wallQ(pb, RQ + 0.08, D - 0.16, GY, HH - GY, { tint: mixHex(wallT, '#ffffff', 0.2), t: 0.1, skirt: pal.trim });
    L.ceiling(pa, RQ, pb, D - 0.16, GY + 3.0, 'paint', '#efe6d6', { noCollide: true });
    L.prop('lots-baths.inn-bed', bp, GY, bq, Math.PI, { frame: '#6b4a2f', cover: pal.felt[2], quilt: [pal.felt[0], pal.felt[3], '#efe4cc'], mend: pal.accent });
    L.prop('lots-baths.inn-hook', dr ? pb - 0.06 : pa + 0.06, GY, RQ + 1.0, dr ? -Math.PI / 2 : Math.PI / 2, { coat: pal.felt[1], bag: null, lining: pal.accent, mend: pal.felt[2] });
    L.lamp('sconce', bp, GY + 1.5, D - 0.17, { face: [0, -1], K: 2500, power: 0.6, clip: L.clip(pa, GY - 0.3, RQ - 0.5, pb, HH, D - 0.16) });
    L.spot('stand', bp + (dr ? 0.9 : -0.9), GY, RQ + 1.4, Math.PI, { tags: ['inn'] });
  }
  // people on the gallery leaning at the rail; the gallery's own light
  for (const k of [0.25, 0.55, 0.8]) L.spot('stand', W * k, GY, GQ + 0.45, Math.PI, { tags: ['rail', 'inn'] });
  await T('16');

  // =============================================================================================================
  // walkways
  // =============================================================================================================
  const aisle = [qt - 1.75, qt + 1.75], cq0 = GQ + 0.9;
  L.path([[cx, -0.7], [cx, 1.2], [cx, 2.8], [cx, F / 2], [cx, F + 1.2], [cx, aisle[0]]], { width: 1.4 });
  L.path([[cx, F / 2], [dp, F - 3.7]], { width: 1.0 });
  L.path([[cx, F / 2], [bp, F - 2.4]], { width: 1.0 });
  L.path([[cx, 2.8], [lobParP + dd * 1.0, 3.15], [(par[0] + par[1]) / 2, F / 2 - 1.2]], { width: 1.1 });
  L.path([[(par[0] + par[1]) / 2, F / 2 - 1.2], [parDoor + 0.7, F - 1.0], [parDoor + 0.7, F + 1.0]], { width: 1.1 });
  if (dry) L.path([[(par[0] + par[1]) / 2, F / 2 - 1.2], [flip ? dry[1] - 0.8 : dry[0] + 0.8, 3.15], [(dry[0] + dry[1]) / 2, 3.15]], { width: 1.0 });
  L.path([[cx, F / 2], [lobShelfP - dd * 1.0, F / 2], [(shelf[0] + shelf[1]) / 2, F / 2 - 1.2]], { width: 1.1 });
  L.path([[washDoor + 0.6, F + 1.0], [washDoor + 0.6, F - 1.0], [(wash[0] + wash[1]) / 2, F / 2 + 1.2]], { width: 1.0 });
  // round the long table, and the front aisle along the band's back wall
  for (const q of aisle) { const pts = []; for (let p = pT0 - 1.2; p <= pT1 + 1.25; p += 3) pts.push([p, q]); pts.push([pT1 + 1.3, q]); L.path(pts, { width: 1.2 }); }
  L.path([[pT0 - 1.2, aisle[0]], [pT0 - 1.2, aisle[1]]]); L.path([[pT1 + 1.3, aisle[0]], [pT1 + 1.3, aisle[1]]]);
  L.path([[washDoor + 0.6, F + 1.0], [cx, F + 1.2], [parDoor + 0.7, F + 1.0]], { width: 1.2 });
  L.path([[pT1 + 1.3, aisle[0]], [hp - 1.4, cq - 2.0]], { width: 1.0 });
  // the corridor under the gallery and into every room
  { const pts = []; for (let p = 2.0; p <= W - 1.0; p += 3) pts.push([p, cq0]); pts.push([W - 1.0, cq0]); L.path(pts, { width: 1.2 }); }
  for (const p of [cx - 6, cx + 6]) L.path([[p, aisle[1]], [p, cq0]], { width: 1.2 });
  for (let i = 0; i < n; i++) { const d = doorAt(i) + 0.425; L.path([[d, cq0], [d, RQ + 0.9]], { width: 0.8 }); }
  // the stair and the gallery (with heights)
  const P3 = (p, y, q) => { const c = L.P(p, q); return [c[0], y, c[1]]; };
  s.path([P3(2.0, 0, GQ - 7.2), P3(0.85, 0, GQ - 6.8), P3(0.85, GY, GQ + 0.2), P3(0.85, GY, cq0), P3(3.0, GY, cq0)], { width: 1.0 });
  L.path([[pT0 - 1.2, aisle[1]], [2.0, GQ - 7.2]], { width: 1.0 });
  { const pts = []; for (let p = 3.0; p <= W - 1.0; p += 3) pts.push(P3(p, GY, cq0)); s.path(pts, { width: 1.1 }); }
  for (const i of open) { const d = doorAt(i) + 0.425; s.path([P3(d, GY, cq0), P3(d, GY, RQ + 1.0)], { width: 0.8 }); }
  await T('17');

  // =============================================================================================================
  // things to do
  // =============================================================================================================
  const bk = 'inn:' + info.key;
  L.interact({ p: dp, y: 1.2, q: dq - 0.75, radius: 1.6, kind: 'talk', prompt: 'Talk to ' + keeper.name, async onUse(gm) {
    if (!gm.ui) return;
    if (!gm.flags[bk + ':met']) { gm.flags[bk + ':met'] = true; await say(gm, keeper, pickBy(seed, 3, GREET)); }
    gm.busy++; let c = null;
    try {
      c = await gm.ui.choose(keeper, 'What will you ask?', [
        { label: 'Ask about guest-right', value: 'right' },
        { label: 'Ask which key to take', value: 'key' },
        { label: 'Ask where to eat', value: 'hall' },
        { label: 'Nothing, thank you', value: null },
      ]);
    } finally { gm.busy--; }
    if (c === 'right') { gm.flags.innAsked = (gm.flags.innAsked || 0) + 1; await say(gm, keeper, pickBy(seed, 10 + gm.flags.innAsked, GUEST_RIGHT)); if (gm.journal && gm.journal.custom) gm.journal.custom('Guest-right'); }
    else if (c === 'key') await say(gm, keeper, pickBy(seed, 11, KEY_LINES));
    else if (c === 'hall') await say(gm, keeper, ['The hall here is ' + info.hall + '. Today it is ' + info.dish[0] + '.', pickBy(seed, 12, ['Go at one. You will be seated next to someone. That is the point.', 'Any hall in Chervil will feed a guest. This one is closest and ' + info.cook.split(' ')[0] + ' cooks it.', 'Guests eat free on guest-right. Lift the lid when it reaches you.', 'Gin only after six, and only at the hall. Not here. We have tea.'])]);
  } });
  L.interact({ p: bp, y: 1.1, q: bq - 0.6, radius: 1.3, prompt: (gm) => gm.flags[bk + ':signed'] ? 'Read the book' : 'Sign the book', async onUse(gm) {
    const prev = pickBy(seed, 13, SIGNINGS), prev2 = pickBy(seed, 14, SIGNINGS.slice().reverse());
    if (gm.flags[bk + ':signed']) { await say(gm, { name: 'The book', colour: '#FFD9A0' }, ['Names, drums and a line each, in a hundred hands.', prev2, 'And yours: "' + gm.flags[bk + ':signed'] + '"']); return; }
    if (!gm.ui) return;
    gm.busy++; let c = null;
    try {
      c = await gm.ui.choose({ name: 'The book', colour: '#FFD9A0' }, 'Above the empty line: "' + prev + '" What do you write?', [
        { label: 'Spelt, Grain Row. Eleven legs. Slept well.', value: 'Spelt, Grain Row. Eleven legs. Slept well.' },
        { label: 'From Spelt. Pell sends his best.', value: 'From Spelt. Pell sends his best.' },
        { label: 'Here for Booking Day. Will cook if asked.', value: 'Here for Booking Day. Will cook if asked.' },
        { label: 'Just the name of your drum', value: 'Spelt.' },
        { label: 'Leave it for now', value: null },
      ]);
    } finally { gm.busy--; }
    if (!c) return;
    gm.flags[bk + ':signed'] = c; gm.flags.innsSigned = (gm.flags.innsSigned || 0) + 1;
    L.sfx(gm, 'paper', bp, 1.1, bq);
    note(gm, 'You sign the book at ' + Name + ', ' + info.name + '. ' + (gm.flags.innsSigned === 1 ? 'Your first inn in Chervil.' : gm.flags.innsSigned + ' inns signed so far.'), 'gain');
  } });
  L.interact({ p: lobParP - dd * 0.6, y: 1.5, q: F - 1.5, radius: 1.3, prompt: 'Read the house rules', onUse: (gm) => say(gm, { name: 'House rules', colour: '#FFD9A0' }, [rules.join('. ') + '.']) });
  L.interact({ p: hp - 1.0, y: 1.1, q: cq - 0.7, radius: 1.4, prompt: (gm) => gm.flags[bk + ':cup'] ? 'Another cup from the urn' : 'Take a cup from the hot shelf', onUse(gm) {
    gm.flags[bk + ':cup'] = true; L.sfx(gm, 'pour', hp - 0.3, 1.1, cq - 1.0); L.sfx(gm, 'lid-down', hp - 0.4, 1.0, cq - 0.5, { delay: 0.9 });
    note(gm, pickBy(seed, 15 + ((gm.flags.innCups = (gm.flags.innCups || 0) + 1) % 4), CUPS), 'gain');
    if (gm.journal && gm.journal.custom) gm.journal.custom('Lids');
  } });
  for (let p = pT0 + 3; p < pT1 - 1; p += 8) {
    for (const sg of [-1, 1]) L.interact({ p, y: 0.8, q: qt + sg * 1.25, radius: 2.0, prompt: (gm) => seatedAs(gm, 'inn-table') ? 'Get up' : 'Sit at the long table', onUse(gm) {
      if (seatedAs(gm, 'inn-table')) { gm.player.stand(); return; }
      const w = L.where(gm) || [p, qt]; let best = seats[0], bd = 1e9;
      for (const st of seats) { const d = Math.hypot(st.p - w[0], st.q - w[1]); if (d < bd) { bd = d; best = st; } }
      sitPlayer(L, gm, best.p, 0.45, best.q, best.a, 0.72, 'inn-table', -0.12);
      const t = pickBy(seed, 50 + ((gm.flags.innSits = (gm.flags.innSits || 0) + 1) % 4), TABLE);
      if (gm.ui) { gm.ui.subtitle(null, t[0], 5); if (t[1]) setTimeout(() => { if (gm.ui && seatedAs(gm, 'inn-table')) gm.ui.subtitle(null, t[1], 5); }, 3000); }
    } });
  }
  L.interact({ p: cx, y: 1.6, q: F + 1.6, radius: 2.0, priority: 0.2, prompt: 'Look up at the drum board', onUse: (gm) => say(gm, { name: 'The drum board', colour: '#FFD9A0' }, pickBy(seed, 60, BOARD)) });

  // =============================================================================================================
  // sound and zones
  // =============================================================================================================
  L.loop('murmur', cx, 1.2, qt, { vol: 0.32, radius: 22, param: 0.4 });
  s.zoneBox({ id: lot.id, place: 'city-special', box: [lot.x0, -0.5, lot.z0, lot.x1, HH, lot.z1], name: Name, sub: info.name + ' · guest-right beds · the long table', ambience: 'hall', reverb: 'felt', headroom: HH, cell: info.key });
  s.zoneBox({ id: lot.id + '/lobby', place: 'city-special', box: L.clip(lp0, -0.5, 0, lp1, LH, F, 0), name: Name, sub: info.name + ' · sign the book, take a key', ambience: 'shop', reverb: 'room', headroom: LH, cell: info.key });
  s.zoneBox({ id: lot.id + '/rooms', place: 'city-special', box: L.clip(0.16, -0.5, GQ, W - 0.16, CH, D, 0), name: 'The guest rooms', sub: Name + ' · a bed, a lamp, a hook', ambience: 'quiet', reverb: 'felt', headroom: CH, cell: info.key });
  s.zoneBox({ id: lot.id + '/gallery', place: 'city-special', box: L.clip(0.16, GY - 0.4, GQ, W - 0.16, HH, D, 0), name: 'The gallery', sub: Name + ' · the upper rooms', ambience: 'hall', reverb: 'felt', headroom: HH - GY, cell: info.key });
  // the tall room is open through two decks: let the camera on the gallery see the floor below
  s.court(lot.x0 - 3, lot.z0 - 3, lot.x1 + 3, lot.z1 + 3);
  if (log) { const m1 = meter(); console.log('[lots-baths] special.inn ' + lot.id + ' front ' + lot.front + ' ' + W.toFixed(1) + 'x' + D.toFixed(1) + ': ' + Math.round(m1.tris - m0.tris) + ' tris, ' + (m1.lights - m0.lights) + ' lights, ' + (performance.now() - t0 - waited).toFixed(1) + ' ms · ' + parts.join(' ')); }
  void PAL;
}
