// The block theatre (special.theatre, the Middle decks): a felt-hung house where nobody shouts. A glazed foyer under a
// canopy of small lamps, with a cloak counter and the playbill; side passages to a raked house of two hundred and
// fifty remade chairs, none matching, under a lighting gallery; a stage set for tonight's play in front of its painted
// cloth, with a prop table in the wings; behind it the paint frame; beside it the green room and the wardrobe.
// The house and stage are one tall room up to y = 7 (the decks above are the block's flats); everything else is 3.3.
import { shopfront } from '../world/kit2.js';
import { defineProp, hasProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { LOT_H } from '../city/plan.js';
import { Rng, mixHex, shadeHex, clamp } from '../core/util.js';
import { local, pickBy, someBy, say, sitHere, getUp, feltHang, baffle, openLeaves, FELTS } from './lots_theatre_kit.js';
import { PLAYS, REHEARSAL, DAYTIME, CLOAK, PROPS, GALLERY, PAINT, GREEN } from './lots_theatre_words.js';

const HF = 3.3, HH = 7.0, SH = 0.8, RP = 0.95, RISE = 0.27, PS = 2.0;
const WOOD = '#4a3222', DARK = '#2a1f1a';
const SCHEMES = [
  { felt: '#6b2a35', felt2: '#b7832f', wall: '#3b2630', seat: ['#8c3b26', '#6b2a35', '#b7832f', '#1f4f55', '#4f2f45', '#a8412b', '#2f5d50'], front: '#6b2a35', trim: '#d6a640', floor: '#5a2a2a' },
  { felt: '#1f4f55', felt2: '#c9962e', wall: '#22343a', seat: ['#1f4f55', '#2f6f73', '#b7832f', '#8c3b26', '#33407a', '#6b7a3a', '#c9962e'], front: '#1f4f55', trim: '#e3b456', floor: '#2f3d3a' },
  { felt: '#33407a', felt2: '#c9552e', wall: '#262b45', seat: ['#33407a', '#c9552e', '#5b3a6e', '#2f6f73', '#b7832f', '#8a2f3c', '#6b7a3a'], front: '#26306b', trim: '#e0b04a', floor: '#3a2f45' },
  { felt: '#4f2f45', felt2: '#3fa7a3', wall: '#2f2230', seat: ['#4f2f45', '#8a2f3c', '#3fa7a3', '#b7832f', '#5b3a6e', '#1f4f55', '#d6a640'], front: '#4f2f45', trim: '#e8c26a', floor: '#3b2a33' },
];

// A stage lamp on a yoke: a black drum with a lens, a barn door and a card tied on. Front toward +z.
defineProp('lots-theatre.stagelamp', (g, p) => {
  g.mat('cast', '#2b2724'); g.box(-0.16, 0.02, -0.03, -0.14, 0.34, 0.03); g.box(0.14, 0.02, -0.03, 0.16, 0.34, 0.03); g.box(-0.16, 0.32, -0.03, 0.16, 0.36, 0.03);
  g.push(); g.move(0, 0.18, 0); g.rotX(Math.PI / 2 + (p.tilt || 0.35));
  g.cyl(0, -0.16, 0, 0.13, 0.3, { segs: 10 }); g.cyl(0, 0.14, 0, 0.1, 0.05, { segs: 10 });
  g.mat('diffuser', p.gel || '#ffe2b0', { emissive: p.lit ? 2.5 : 0.4, lamp: true }); g.cyl(0, 0.19, 0, 0.085, 0.006, { segs: 10 });
  g.pop();
  g.mat('paper', '#efe6d2'); g.box(0.16, 0.08, 0.0, 0.17, 0.2, 0.08, { faces: 'X' });
  return { tier: 'd', cast: false };
});

// A coat rail with coats on hangers. p: { w, n, seed }. Along local x, front toward +z.
defineProp('lots-theatre.rail', (g, p) => {
  const w = p.w || 1.6, r = new Rng(311 + (p.seed || 0)), n = p.n || Math.round(w / 0.16);
  g.mat('cast', '#3a3530'); for (const sx of [-1, 1]) { g.tube([[sx * w / 2, 0, 0], [sx * w / 2, 1.72, 0]], 0.016, { segs: 6 }); g.box(sx * w / 2 - 0.02, 0, -0.25, sx * w / 2 + 0.02, 0.03, 0.25); }
  g.tube([[-w / 2, 1.7, 0], [w / 2, 1.7, 0]], 0.014, { segs: 6 });
  const COLS = ['#8c3b26', '#1f4f55', '#b7832f', '#33407a', '#4f2f45', '#6b7a3a', '#2a2622', '#c9552e', '#d6c49a', '#5b3a6e'];
  for (let i = 0; i < n; i++) {
    if (r.chance(0.15)) continue;
    const x = -w / 2 + 0.1 + i * (w - 0.2) / Math.max(1, n - 1), len = r.f(0.7, 1.15), c = r.pick(COLS);
    g.mat(r.chance(0.5) ? 'weave' : 'knit', c); g.box(x - 0.035, 1.66 - len, -0.24, x + 0.035, 1.66, 0.24, { bevel: 0.02 });
    if (r.chance(0.3)) { g.mat('weave', r.pick(['#e0b04a', '#3fa7a3', '#d95d7a'])); g.box(x - 0.04, 1.66 - len * 0.6, 0.1, x + 0.04, 1.66 - len * 0.45, 0.2); }
  }
  return { solid: [[-w / 2, 0, -0.26, w / 2, 1.75, 0.26]], tier: 'd' };
});

// The prop table: a long table edged in white tape, things on it each with its card.
defineProp('lots-theatre.proptable', (g) => {
  g.mat('wood', '#5a3a22'); g.box(-1.0, 0.86, -0.35, 1.0, 0.9, 0.35, { bevel: 0.01 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.94 - 0.025, 0, sz * 0.3 - 0.025, sx * 0.94 + 0.025, 0.86, sz * 0.3 + 0.025);
  g.mat('paper', '#efe6d2'); for (let i = -2; i <= 2; i++) g.box(i * 0.4 - 0.19, 0.9, -0.33, i * 0.4 + 0.19, 0.903, 0.33, { faces: 'Y' });
  g.mat('paint', '#e9e2d0'); for (let i = -2; i <= 3; i++) g.box(i * 0.4 - 0.205, 0.9, -0.34, i * 0.4 - 0.195, 0.906, 0.34, { faces: 'Y' });
  // a cup, a wooden apple, an umbrella, a letter, a hand lamp, a bucket
  g.mat('glaze', '#c9b48a'); g.lathe(-0.8, 0, [[0, 0.903], [0.04, 0.903], [0.045, 0.99], [0, 0.985]], { segs: 10 });
  g.mat('wood', '#a8412b'); g.ball(-0.4, 0.96, 0.02, 0.055, 0.055, 0.055, { segs: 8, rings: 6 });
  g.mat('weave', '#26306b'); g.tube([[-0.15, 0.93, -0.2], [0.2, 0.93, 0.2]], [0.04, 0.012], { segs: 6 }); g.mat('wood', '#3a2a20'); g.tube([[0.2, 0.93, 0.2], [0.26, 0.96, 0.25]], 0.01, { segs: 4 });
  g.mat('paper', '#f2ead8'); g.box(0.3, 0.903, -0.12, 0.5, 0.908, 0.02, { faces: 'Y' });
  g.mat('cast', '#8a6d3b'); g.cyl(0.8, 0.903, -0.05, 0.05, 0.12, { segs: 8 }); g.mat('diffuser', '#ffd9a0', { emissive: 0.8 }); g.cyl(0.8, 1.02, -0.05, 0.035, 0.04, { segs: 8 });
  g.mat('cast', '#9aa0a0'); g.lathe(0.6, 0.18, [[0.06, 0.903], [0.08, 1.05], [0.075, 1.05], [0.055, 0.91]], { segs: 10 });
  // the cards: one in front of each thing
  g.mat('paper', '#ffffff'); for (const x of [-0.8, -0.4, 0.0, 0.4, 0.8]) { g.push(); g.move(x, 0.906, 0.24); g.rotX(-1.1); g.box(-0.05, 0, 0, 0.05, 0.06, 0.004); g.pop(); }
  return { solid: [[-1.0, 0, -0.35, 1.0, 0.9, 0.35]], tier: 'd' };
});

// The mirror in the green room: a frame ringed with small round lamps, two of them lit.
defineProp('lots-theatre.mirror', (g) => {
  g.mat('wood', '#3a2a20'); g.box(-0.55, 0, 0, 0.55, 0.8, 0.04, { bevel: 0.01 });
  g.mat('plain', '#9fb0b0', { rough: -0.45 }); g.box(-0.48, 0.07, 0.04, 0.48, 0.73, 0.045, { faces: 'Z' });
  for (let i = 0; i < 12; i++) {
    const t = i / 11, x = i < 4 ? -0.52 : i < 8 ? -0.36 + (i - 4) * 0.24 : 0.52, y = i < 4 ? 0.12 + i * 0.2 : i < 8 ? 0.77 : 0.12 + (i - 8) * 0.2;
    g.mat('diffuser', '#ffe2b0', { emissive: i === 5 || i === 9 ? 3 : 0.05, lamp: true }); g.ball(x, y, 0.06, 0.025, 0.025, 0.025, { segs: 6, rings: 4 }); void t;
  }
  return { tier: 'd', cast: false };
});

export async function buildTheatre(s, lot, plan, game, tick) {
  const L = local(s, lot), W = L.W, D = L.D, info = plan.info, r = new Rng(lot.seed), g = s.g, o = L.o;
  const S = SCHEMES[(lot.seed >>> 3) % SCHEMES.length];
  const play = pickBy(lot.seed, 1, PLAYS);
  const C = clamp(W - 16, 20, 24), L1 = (W - C) / 2, L2 = L1 + C, pc = W / 2;
  const FQ = 6.6, R = D >= 34 ? 10 : 9;
  const qBA0 = FQ + 0.08, qBA1 = qBA0 + 1.5, yTop = R * RISE;
  const qRow = (k) => qBA1 + (R - 1 - k) * RP;                 // the near edge of row k's tier (row 0 is nearest the stage)
  const qF0 = qBA1 + R * RP, qS0 = qF0 + 2.0;                  // the front aisle, then the stage's front edge
  const SD = clamp(D - qS0 - 6.4, 6, 7.5), qS1 = qS0 + SD;     // the stage's back; the backstage band behind it
  const PW = Math.min(14, C - 6);                              // the proscenium opening
  const clipF = L.clip(0, -0.2, -2.2, W, HF + 0.1, FQ), clipH = L.clip(L1, -0.2, FQ, L2, HH + 0.1, D);

  // ---------------------------------------------------------------- floors, ceilings, the walls of the rooms
  L.floor(0, 0, W, FQ, 0, 'terrazzo', '#c9b9a0');
  L.floor(L1, FQ, L2, D, 0, 'planks', '#5e4632');
  L.floor(0, FQ, L1, D, 0, 'planks', '#8a6a48'); L.floor(L2, FQ, W, D, 0, 'planks', '#8a6a48');
  L.ceiling(0, 0, W, FQ, HF, 'paint', mixHex(S.felt2, '#5a4030', 0.45));
  L.ceiling(0, FQ, L1, D, HF, 'paint', '#d9cdb4'); L.ceiling(L2, FQ, W, D, HF, 'paint', '#d9cdb4');
  L.ceiling(L1, FQ, L2, D, HH, 'felt', '#1d1a1c');
  await tick('floors');
  const plaster = '#e3d5b8', dado = { h: 1.0, mat: 'wood', tint: '#5b3a26' };
  // party walls
  L.wallQ(0.08, 0.16, D - 0.16, 0, HF, { tint: plaster, dado });
  L.wallQ(W - 0.08, 0.16, D - 0.16, 0, HF, { tint: plaster, dado });
  L.wallP(D - 0.08, 0, L1, 0, HF, { tint: plaster, dado }); L.wallP(D - 0.08, L2, W, 0, HF, { tint: plaster, dado });
  L.wallP(D - 0.08, L1, L2, 0, HH, { tint: '#4a3a30', mat: 'plaster' });
  await tick('party walls');
  // the foyer's back wall: doors to the two passages
  const dL = L1 - PS + 0.2, dR = L2 + 0.2, dr1 = FQ + 1.8, dr2 = FQ + Math.max(3, D - FQ - 5) + 0.6;
  L.wallP(FQ, 0, W, 0, HF, { inner: { tint: plaster }, outer: { tint: S.wall, mat: 'paint' }, dado: { h: 1.1, mat: 'wood', tint: '#3a2a20' }, openings: [{ at: dL, w: 1.6, h: 2.4 }, { at: dR, w: 1.6, h: 2.4 }] });
  L.wallP(FQ, L1, L2, HF, HH - HF, { tint: '#3b2c2a', skirt: false });
  await tick('foyer wall');
  // the house's side walls: a door from each passage to the front aisle, and one to backstage
  for (const p of [L1, L2]) L.wallQ(p, FQ, D - 0.16, 0, HH, { inner: { tint: p === L1 ? S.wall : plaster }, outer: { tint: p === L1 ? plaster : S.wall }, tint: S.wall, dado: { h: 1.0, mat: 'wood', tint: '#3a2a20' }, openings: [{ at: qF0 - FQ + 0.25, w: 1.4, h: 2.3 }, { at: D - FQ - 2.6, w: 1.2, h: 2.2 }] });
  // the passages' outer walls, with a door into each side room
  for (const p of [L1 - PS, L2 + PS]) L.wallQ(p, FQ, D - 0.16, 0, HF, { tint: plaster, dado, openings: [{ at: 1.2, w: 1.2, h: 2.2 }, { at: Math.max(3, D - FQ - 5), w: 1.2, h: 2.2 }] });
  await tick('walls');

  // ---------------------------------------------------------------- the front: a glazed foyer under a canopy of small lamps
  const GW = Math.min(16, W - 12), gA = pc - GW / 2, gB = pc + GW / 2;
  shopfront(s, { side: lot.front, a0: o.a0 + gA, a1: o.a0 + gB, c: o.c, y: 0, h: LOT_H, fascia: null, fasciaH: 0.5, palette: { frame: S.front, plinth: shadeHex(S.front, 0.7), awning: [S.front, S.trim] }, door: { kind: 'open', at: GW / 2 - 1.2, w: 2.4, h: 2.3 }, awning: false, lights: false });
  openLeaves(L, 0.0, pc - 1.2, 2.4, 2.3, S.front);
  L.wallP(0.1, 0, gA, 0, LOT_H, { inner: { tint: S.wall, mat: 'paint' }, outer: { tint: S.front, mat: 'plaster' }, dado: { h: 0.9, mat: 'tile', tint: shadeHex(S.front, 0.6) } });
  L.wallP(0.1, gB, W, 0, LOT_H, { inner: { tint: S.wall, mat: 'paint' }, outer: { tint: S.front, mat: 'plaster' }, dado: { h: 0.9, mat: 'tile', tint: shadeHex(S.front, 0.6) } });
  L.wallP(0.1, 0, W, HF - 0.1, 0.1, { tint: S.wall, skirt: false, noCollide: true });
  s.structure(() => {
    // pilasters, a cornice, and two lit poster cases on each side wall
    g.mat('stone', '#cdbf9f');
    for (const p of [0.35, gA - 0.25, gB + 0.25, W - 0.35]) L.box(p - 0.2, 0, -0.12, p + 0.2, LOT_H, 0.02, { bevel: 0.015 });
    g.mat('wood', S.trim); L.box(0, 2.62, -0.1, gA, 2.72, 0.02, { bevel: 0.01 }); L.box(gB, 2.62, -0.1, W, 2.72, 0.02, { bevel: 0.01 });
  });
  for (const span of [[0.6, gA - 0.6], [gB + 0.6, W - 0.6]]) {
    const n = Math.max(1, Math.min(3, Math.floor((span[1] - span[0]) / 3.2)));
    for (let k = 0; k < n; k++) {
      const p = span[0] + (span[1] - span[0]) * (k + 0.5) / n, col = FELTS[(k + (span[0] > pc ? 3 : 0) + (lot.seed & 3)) % FELTS.length];
      s.structure(() => {
        g.mat('wood', S.trim); L.box(p - 0.5, 0.7, -0.09, p + 0.5, 2.3, 0.0, { bevel: 0.01 });
        g.mat('paint', col, { emissive: 0.6, lamp: true }); L.box(p - 0.42, 0.78, -0.095, p + 0.42, 2.22, -0.09, { faces: 'xXzZ' });
        g.mat('paint', mixHex(col, '#f3e6c8', 0.6), { emissive: 0.7, lamp: true }); L.box(p - 0.32, 1.7, -0.1, p + 0.32, 2.05, -0.095, { faces: 'zZ' }); L.box(p - 0.25, 1.05, -0.1, p + 0.25, 1.12, -0.095, { faces: 'zZ' }); L.box(p - 0.3, 0.95, -0.1, p + 0.3, 0.99, -0.095, { faces: 'zZ' });
      });
      s.glass(...(() => { const a = L.P(p - 0.42, -0.1), b = L.P(p + 0.42, -0.1); return [a[0], 0.78, a[1], b[0], 2.22, b[1]]; })(), { opacity: 0.12 });
    }
  }
  // the canopy over the glazed front: brass-edged, lined with small lamps
  {
    const c0 = gA - 0.4, c1 = gB + 0.4, qo = -1.15;
    s.structure(() => {
      g.mat('paint', shadeHex(S.front, 0.8)); L.box(c0, 2.66, qo, c1, 2.78, 0.0, { faces: 'yYxXzZ' });
      g.mat('cast', '#b08a45', { rough: -0.2 }); L.box(c0 - 0.02, 2.62, qo - 0.04, c1 + 0.02, 2.82, qo, { bevel: 0.01 });
      g.mat('cast', '#2f2a26'); for (const p of [c0 + 0.6, c1 - 0.6]) L.tube([[p, 2.8, qo + 0.1], [p, 3.15, -0.02]], 0.015, { segs: 5 });
    });
    s.deco(() => {
      g.mat('diffuser', '#ffe7b8', { emissive: 5, lamp: true });
      const n = Math.round((c1 - c0) / 0.6);
      for (let i = 0; i <= n; i++) for (const q of [qo + 0.2, qo + 0.62]) { const c = L.P(c0 + 0.2 + i * (c1 - c0 - 0.4) / n, q); g.ball(c[0], 2.635, c[1], 0.035, 0.035, 0.035, { segs: 5, rings: 3 }); }
      // and a string of them along the canopy's lip
      g.mat('diffuser', '#ffd890', { emissive: 4, lamp: true });
      for (let i = 0; i <= n * 2; i++) { const c = L.P(c0 + 0.1 + i * (c1 - c0 - 0.2) / (n * 2), qo - 0.06); g.cube(c[0], 2.72, c[1], 0.04, 0.04, 0.04); }
    });
    L.light({ at: [c0 + 0.6, 2.55, qo + 0.45], to: [c1 - 0.6, 2.55, qo + 0.45], type: 'tube', K: undefined, color: '#ffd9a8', power: 5, range: 5.5, radius: 0.2, lamp: true, clip: L.clip(c0 - 1.5, -0.2, -3.5, c1 + 1.5, 3.3, 3.0) });
    await tick('canopy');
    sign(s, { kind: 'fascia', text: 'Theatre', sub: info.name + ' · nobody shouts', palette: [S.front, '#f6e7c4', S.trim], emblem: 'lamp' }, ...(() => { const c = L.P(pc, qo - 0.05); return [c[0], 3.03, c[1]]; })(), { face: L.face(0, -1), w: 3.6, h: 0.42, glow: 1.2 });
  }
  await tick('front');

  // ---------------------------------------------------------------- the foyer: cloak counter, playbill, benches, felt
  {
    // felt on the back wall between the doors, and on the inner face of the front
    const frames = [];
    for (const span of [[0.6, dL - 0.3], [L1 + 0.4, L2 - 0.4], [dR + 1.9, W - 0.6]]) {
      const n = Math.floor((span[1] - span[0] + 0.9) / 2.5); if (n < 1) continue;
      const step = (span[1] - span[0]) / n;
      for (let k = 0; k < n; k++) {
        const a = span[0] + k * step + 0.45, b = a + step - 0.9;
        if (b - a > 0.8) feltHang(L, [a, FQ - 0.08], [b, FQ - 0.08], 2.9, 0.55, [S.felt, S.felt2, FELTS[(k + lot.seed) % 8]][k % 3], [0, -0.06], { band: k % 2 ? S.trim : null, mend: k % 4 === 1 ? ['#e0b04a', '#3fa7a3'] : null, nu: 7 });
        if (k > 0) frames.push(span[0] + k * step);
      }
    }
    await tick('felt panels');
    // old playbills in frames between the felts
    s.deco(() => {
      for (const p of frames) {
        const c = FELTS[Math.round(p * 7) % 8];
        g.mat('wood', S.trim); L.box(p - 0.3, 1.3, FQ - 0.11, p + 0.3, 2.15, FQ - 0.08);
        g.mat('paint', c); L.box(p - 0.25, 1.35, FQ - 0.115, p + 0.25, 2.1, FQ - 0.11, { faces: 'zZ' });
        g.mat('paint', '#f2e3c4'); L.box(p - 0.18, 1.88, FQ - 0.12, p + 0.18, 2.0, FQ - 0.115, { faces: 'zZ' }); L.box(p - 0.12, 1.45, FQ - 0.12, p + 0.12, 1.5, FQ - 0.115, { faces: 'zZ' });
        g.mat('paint', mixHex(c, '#f2e3c4', 0.5)); L.box(p - 0.14, 1.6, FQ - 0.12, p + 0.14, 1.8, FQ - 0.115, { faces: 'zZ' });
      }
    });
    await tick('frames');
    for (const span of [[0.7, gA - 0.6], [gB + 0.6, W - 0.7]]) {
      const n = Math.floor((span[1] - span[0] + 0.6) / 2.2); if (n < 1) continue; const step = (span[1] - span[0]) / n;
      for (let k = 0; k < n; k++) feltHang(L, [span[0] + k * step + 0.3, 0.18], [span[0] + (k + 1) * step - 0.3, 0.18], 2.55, 1.05, k % 2 ? S.felt : S.felt2, [0, 0.06], { nu: 6 });
    }
    // a runner from the door to the back wall, and the lamps
    L.prop('rug', pc, 0, FQ * 0.5, Math.PI / 2, { w: FQ - 1.2, d: 2.0, a: S.felt, b: S.trim });
    const lamps = W > 44 ? [0.2, 0.5, 0.8] : [0.26, 0.74];
    for (const t of lamps) L.lamp('lantern', W * t, HF - 0.55, FQ * 0.5, { tint: r.pick(['#e8743b', '#f2c14e', '#d95d7a']), drop: 0.45, r: 0.26, hh: 0.4, power: 1.3, clip: clipF, range: 8 });
    L.glowBox(0, 0, 0, W, HF, FQ, { sky: '#ffcf9a', ground: S.floor, power: 0.4 });
    for (let k = 0; k < Math.round(W / 9); k++) baffle(L, [1 + k * 9, 1.2], [1 + k * 9 + 0.12, FQ - 1.2], HF, shadeHex(S.wall, 0.8), 0.3);
    await tick('lanterns');
    // the cloak counter at the low end, coats behind it
    const cp = 2.3;
    L.prop('counter', cp, 0, FQ * 0.45, Math.PI / 2, { w: 3.2, d: 0.6, h: 0.95, body: S.felt, top: '#b98a5a' }, { noSpots: true });
    L.prop('lots-theatre.rail', 0.65, 0, FQ * 0.45, Math.PI / 2, { w: 3.6, seed: lot.seed & 7 });
    L.spot('counter', cp - 0.75, 0, FQ * 0.45, Math.PI / 2, { tags: ['theatre', 'cloak'] });
    L.spot('customer', cp + 0.8, 0, FQ * 0.45 + 0.4, -Math.PI / 2, { tags: ['theatre'] });
    L.sign({ kind: 'plate', text: 'Cloaks', lines: ['tag and peg, no charge'] }, 0.19, 2.35, FQ * 0.45, [1, 0], { w: 0.42, h: 0.18 });
    s.detail(() => { g.mat('glaze', '#e9e2d0'); L.lathe(cp, FQ * 0.45 + 1.1, [[0, 0.95], [0.06, 0.95], [0.065, 1.12], [0.05, 1.15], [0, 1.15]], { segs: 10 }); g.mat('cast', '#b08a45'); L.cyl(cp, 0.95, FQ * 0.45 - 1.2, 0.04, 0.08, { segs: 8 }); });
    L.interact({ p: cp + 0.6, y: 1.1, q: FQ * 0.45, radius: 1.6, prompt: 'Ask at the cloak counter', onUse: (gm) => say(gm, 'The cloak counter', someBy(lot.seed, 3, CLOAK, 2)) });
    // the playbill on a stand by the door, facing the street through the glass
    await tick('foyer felt');
    const bp = pc - 3.0, bq = 1.6;
    s.furniture(() => {
      g.mat('wood', '#3a2a20'); for (const dp of [-0.38, 0.38]) L.box(bp + dp - 0.025, 0, bq - 0.03, bp + dp + 0.025, 1.95, bq + 0.03, { bevel: 0.006 });
      L.box(bp - 0.42, 0.62, bq - 0.04, bp + 0.42, 1.9, bq + 0.02, { bevel: 0.01 });
    });
    L.sign({ kind: 'poster', title: play.t, lines: ['tonight at half past seven', 'nobody shouts', info.name + ' theatre'], palette: [S.wall, '#f2e3c4', S.trim], motif: play.cloth === 'river' ? 'flight' : play.cloth === 'dark' ? 'lamp' : play.cloth === 'letters' ? 'book' : play.cloth === 'garden' ? 'leaf' : play.cloth === 'sea' ? 'drop' : 'star' }, bp, 1.26, bq - 0.045, [0, -1], { w: 0.62, h: 0.9, board: false });
    L.spot('stand', bp - 0.3, 0, bq + 0.9, Math.PI, { tags: ['read', 'board'] }); L.spot('stand', bp + 0.5, 0, bq + 1.0, Math.PI, { tags: ['read', 'board'] });
    L.interact({ p: bp, y: 1.3, q: bq + 0.5, radius: 1.6, prompt: 'Read the playbill', onUse: (gm) => say(gm, play.t, [play.a, play.b, 'Doors at half past seven. Seats are free and not numbered. The lamp fund takes what you like to give, in kays.', 'Nobody shouts. If you must laugh, laugh. If you must cough, there are lozenges at the cloak counter.']) });
    await tick('playbill');
    // benches along the front, plants, people waiting and talking
    const benches = [];
    for (const span of [[gB + 0.8, W - 1.4], [1.0 + 3.5, gA - 0.8]]) { const n = Math.floor((span[1] - span[0]) / 2.6); for (let k = 0; k < n; k++) benches.push(span[0] + 1.1 + k * 2.6); }
    for (const p of benches) { L.prop('bench', p, 0, 0.62, 0, { w: 1.8, back: true, wood: '#5a3a22' }, { noSpots: true }); for (const dp of [-0.5, 0.5]) L.spot('sit', p + dp, 0.46, 0.66, 0, { tags: ['theatre'] }); }
    for (const p of [gA - 0.45, gB + 0.45]) L.prop('plant', p, 0, 0.6, 0, { kind: 'broad', size: 1.6, pot: S.felt2 });
    for (const c of [[pc + 4.2, FQ * 0.55], [pc - 5.5, FQ * 0.62]]) for (let k = 0; k < 3; k++) { const t = k / 3 * Math.PI * 2 + 0.4, pp = c[0] + Math.cos(t) * 0.6, qq = c[1] + Math.sin(t) * 0.6; L.spot('chat', pp, 0, qq, Math.atan2(c[0] - pp, c[1] - qq), { tags: ['theatre'] }); }
    L.spot('work', pc + 2, 0, FQ - 1.4, Math.PI / 2, { tags: ['sweep'] });
    L.path([[pc, -0.7], [pc, 1.2], [pc, FQ * 0.5]], { width: 2.0 });
    L.path([[pc, FQ * 0.5], [cp + 1.2, FQ * 0.5]]);
    L.zone(0, -0.5, 0, W, HF, FQ, { id: lot.id + '/foyer', place: 'city-special', name: 'The theatre foyer', sub: info.name + ' · tonight: ' + play.t, ambience: 'quiet', reverb: 'felt', cell: info.key });
  }
  await tick('foyer');

  // ---------------------------------------------------------------- the passages: felt, small lamps, doors at both ends
  for (const side of [-1, 1]) {
    const pp = side < 0 ? L1 - PS / 2 : L2 + PS / 2, pIn = side < 0 ? L1 : L2, pDoor = pIn - side * 0.6;
    const wallIn = pIn - side * 0.1;
    for (const span of [[FQ + 2.2, qF0 - 0.3], [qF0 + 2.0, D - 3.2]]) if (span[1] - span[0] > 1.5) feltHang(L, [wallIn, span[0]], [wallIn, span[1]], 2.6, 0.5, side < 0 ? S.felt : S.felt2, [-side * 0.05, 0], { nu: 8 });
    L.lamp('sconce', wallIn - side * 0.02, 2.0, (FQ + qF0) / 2, { face: [-side, 0], K: 2600, power: 0.9, clip: L.clip(Math.min(pIn, pIn - side * PS), -0.2, FQ, Math.max(pIn, pIn - side * PS), HF, D), range: 7 });
    L.glowBox(Math.min(pIn, pIn - side * PS), 0, FQ, Math.max(pIn, pIn - side * PS), HF, D, { sky: '#ffd2a0', ground: '#6b4a2f', power: 0.22 });
    L.path([[pc, FQ * 0.5], [pp, FQ * 0.5], [pp, FQ + 0.8], [pp, dr1], [pp, qF0 + 0.95], [pDoor, qF0 + 0.95], [side < 0 ? L1 + 0.9 : L2 - 0.9, qF0 + 0.5]], { width: 1.3 });
    L.path([[pp, qF0 + 0.95], [pp, dr2], [pp, D - 2.0], [pIn + side * 1.0, D - 2.0]], { width: 1.2 });
    L.zone(Math.min(pIn, pIn - side * PS), -0.5, FQ, Math.max(pIn, pIn - side * PS), HF, D, { id: lot.id + '/passage' + side, place: 'city-special', name: 'The felt passage', sub: info.name + ' theatre', ambience: 'quiet', reverb: 'felt', cell: info.key });
  }
  await tick('passages');

  // ---------------------------------------------------------------- the house: tiers of remade chairs, felt walls, the gallery
  const half = Math.min(14, Math.floor((C - 2 * 1.3 - 1.2) / 2 / 0.58)), aisleW = (C - half * 2 * 0.58 - 1.2) / 2;
  {
    // the tiers (the back aisle is the top one)
    for (let k = 1; k <= R; k++) {
      const q0 = k === R ? qBA0 : qRow(k), q1 = k === R ? qBA1 : qRow(k) + RP, y = k * RISE;
      L.block(L1 + 0.08, 0, q0, L2 - 0.08, y - 0.03, q1, 'wood', '#3a2a22', { cast: false, noCollide: true });
      L.block(L1 + 0.08, y - 0.03, q0, L2 - 0.08, y, q1, 'carpet', S.floor, { cast: false, noCollide: true, faces: 'YxXzZ' });
      L.solid(L1 + 0.08, 0, q0, L2 - 0.08, y, q1, { surf: 'carpet' });
    }
    // little aisle lights in the risers, so nobody misses a step
    s.deco(() => {
      g.mat('diffuser', '#ffcf8a', { emissive: 3, lamp: false });
      for (let k = 0; k < R; k++) { const q = qRow(k) - 0.012, y = (k + 1) * RISE - 0.1; for (const p of [L1 + aisleW / 2, pc, L2 - aisleW / 2]) L.box(p - 0.06, y, q - 0.01, p + 0.06, y + 0.035, q + 0.004, { faces: 'zZ' }); }
    });
    await tick('tiers');
    // the seats, row by row, nearest the stage first
    let seats = 0, mends = 0;
    for (let k = 0; k < R; k++) {
      const y = k * RISE, qs = qRow(k) + 0.47;
      for (const sg of [-1, 1]) {
        const v = r.f(0.9, 1.06);
        L.propMid('lots-theatre.seatrow', (half - 1) * 0.58, pc + sg * (0.89 + (half - 1) * 0.29), y, qs, 0, { n: half, cols: S.seat, v: r.i(0, 5) }, { noSpots: true, cast: false, tint: [v, v * r.f(0.96, 1.02), v * r.f(0.94, 1.02)] });
        for (let i = 0; i < half; i++) { L.spot('sit', pc + sg * (0.89 + i * 0.58), y + 0.46, qs + 0.02, 0, { tags: ['theatre', 'watch'] }); seats++; }
      }
      await tick('seat row');
    }
    void mends;
    // walkways: up both side aisles and the middle one, and along the back
    for (const p of [L1 + aisleW / 2, pc, L2 - aisleW / 2]) { const pts = [[p, 0, qF0 + 0.5]]; for (let k = 0; k <= R; k++) pts.push([p, k * RISE, (k === R ? (qBA0 + qBA1) / 2 : qRow(k) + 0.47)]); L.path(pts, { width: 1.0 }); }
    L.path([[L1 + 0.9, 0, qF0 + 0.5], [L1 + aisleW / 2, 0, qF0 + 0.5], [L1 + aisleW + 0.2, 0, qF0 + 0.5], [pc, 0, qF0 + 0.5], [L2 - aisleW - 0.2, 0, qF0 + 0.5], [L2 - aisleW / 2, 0, qF0 + 0.5], [L2 - 0.9, 0, qF0 + 0.5]], { width: 1.2 });
    L.path([[L1 + aisleW / 2, yTop, (qBA0 + qBA1) / 2], [L2 - aisleW / 2, yTop, (qBA0 + qBA1) / 2]], { y: yTop, width: 1.2 });
    // felt on the side walls in tall panels, with brass pilasters between; felt baffles across the roof
    const nb = Math.max(3, Math.round((D - FQ - 1) / 3.4)), bw = (D - FQ - 1.0) / nb;
    for (let b = 0; b < nb; b++) {
      const q0 = FQ + 0.5 + b * bw, q1 = q0 + bw - 0.35, col = b % 2 ? S.felt : S.felt2;
      feltHang(L, [L1 + 0.1, q0], [L1 + 0.1, q1], HH - 0.4, 1.1, b % 3 === 2 ? FELTS[(b + lot.seed) % 8] : col, [0.06, 0], { nu: 6, band: b % 2 ? S.trim : null });
      feltHang(L, [L2 - 0.1, q0], [L2 - 0.1, q1], HH - 0.4, 1.1, b % 3 === 1 ? FELTS[(b * 3 + lot.seed) % 8] : col, [-0.06, 0], { nu: 6, band: b % 2 ? null : S.trim, mend: b === 2 ? ['#e0b04a', '#d95d7a'] : null });
    }
    s.structure(() => { g.mat('cast', '#9a7a3e', { rough: -0.2 }); for (let b = 0; b <= nb; b++) { const q = FQ + 0.5 + b * bw - 0.17; for (const p of [L1 + 0.12, L2 - 0.12]) L.box(p - 0.05, 0, q - 0.05, p + 0.05, HH - 0.3, q + 0.05); } });
    for (let q = FQ + 2.5; q < D - 1; q += 3.2) baffle(L, [L1 + 1.0, q], [L2 - 1.0, q + 0.1], HH, q % 2 > 1 ? S.felt : '#2a2226', 0.6);
    // the lighting gallery over the back aisle: a deck, a rail of old stage lamps, a ladder up to it
    const yG = yTop + 2.3, qG1 = qBA0 + 1.35;
    L.block(L1 + 0.08, yG - 0.12, qBA0, L2 - 0.08, yG, qG1, 'wood', '#3a2a22', { surf: 'wood' });
    L.block(L1 + 0.08, yG - 0.12, qG1 - 0.05, L2 - 0.08, yG + 0.18, qG1, 'paint', '#2a2226', { noCollide: true });
    s.furniture(() => {
      g.mat('cast', '#2b2724'); L.tube([[L1 + 0.1, yG + 1.0, qG1 - 0.03], [L2 - 0.1, yG + 1.0, qG1 - 0.03]], 0.025, { segs: 6 });
      L.tube([[L1 + 0.1, yG + 0.55, qG1 - 0.03], [L2 - 0.1, yG + 0.55, qG1 - 0.03]], 0.015, { segs: 5 });
      for (let p = L1 + 0.6; p < L2; p += 2.0) L.tube([[p, yG, qG1 - 0.03], [p, yG + 1.0, qG1 - 0.03]], 0.015, { segs: 5 });
      for (const p of [L1 + 3, pc, L2 - 3]) L.tube([[p, yG - 0.12, qG1 - 0.1], [p, HH, qG1 - 0.1]], 0.02, { segs: 5 });
    });
    s.solid(...(() => { const b = L.B(L1 + 0.08, qG1 - 0.08, L2 - 0.08, qG1); return [b[0], yG, b[1], b[2], yG + 1.05, b[3]]; })());
    for (let p = L1 + 1.4, i = 0; p < L2 - 1; p += 1.6, i++) L.prop('lots-theatre.stagelamp', p, yG + 1.03, qG1 + 0.08, r.f(-0.25, 0.25), { tilt: 0.42, gel: ['#ffe2b0', '#ffd0a0', '#f0c8ff', '#c8e8ff'][i % 4], lit: i % 3 === 1 });
    // a lamp desk on the gallery with its plot, and the ladder at the low end
    s.detail(() => { g.mat('wood', '#5a3a22'); L.box(pc - 0.7, yG, qBA0 + 0.15, pc + 0.7, yG + 0.85, qBA0 + 0.65, { bevel: 0.01 }); g.mat('paper', '#efe6d2'); L.box(pc - 0.5, yG + 0.85, qBA0 + 0.25, pc + 0.4, yG + 0.853, qBA0 + 0.6, { faces: 'Y' }); g.mat('diffuser', '#ffd9a0', { emissive: 1.4, lamp: true }); L.box(pc + 0.45, yG + 0.85, qBA0 + 0.3, pc + 0.6, yG + 1.05, qBA0 + 0.4); });
    const lp = L1 + 0.5;
    s.furniture(() => { g.mat('wood', '#6b4a2f'); for (const dp of [-0.22, 0.22]) L.box(lp + dp - 0.025, yTop, qBA0 + 0.06, lp + dp + 0.025, yG + 1.0, qBA0 + 0.11); for (let y = yTop + 0.3; y < yG + 0.9; y += 0.3) L.box(lp - 0.22, y - 0.02, qBA0 + 0.07, lp + 0.22, y + 0.02, qBA0 + 0.1); });
    L.interact({ p: lp, y: yTop + 1.2, q: qBA0 + 0.6, radius: 1.3, prompt: 'Climb the ladder to the lighting gallery', onUse: (gm) => { L.place(gm, lp + 1.2, yG, qBA0 + 0.75, 0, -0.25); } });
    L.interact({ p: lp + 1.0, y: yG + 1.1, q: qBA0 + 0.6, radius: 1.2, prompt: 'Climb back down', onUse: (gm) => { L.place(gm, lp + 1.0, yTop, (qBA0 + qBA1) / 2, 0, -0.1); } });
    L.interact({ p: pc, y: yG + 1.1, q: qBA0 + 0.75, radius: 1.6, prompt: 'Look along the lamp rail', onUse: (gm) => say(gm, 'The lighting gallery', someBy(lot.seed, 5, GALLERY, 3)) });
    // the gallery's lamps light the stage; two dim lamps on the house walls; the bounce of the room
    const tgt = [pc, SH + 1.0, qS0 + SD * 0.45];
    for (const dp of [-PW * 0.3, 0, PW * 0.3]) {
      const at = [pc + dp, yG + 1.25, qG1 + 0.15], v = [tgt[0] + dp * 0.4 - at[0], tgt[1] - at[1], tgt[2] - at[2]], n = Math.hypot(v[0], v[1], v[2]);
      L.light({ at, type: 'spot', dir: [v[0] / n, v[1] / n, v[2] / n], cone: [21, 9], color: dp === 0 ? '#ffe4bc' : dp < 0 ? '#ffd2a8' : '#f0dcff', power: 46, range: 26, shadow: true, clip: clipH, lamp: true });
    }
    for (const p of [L1 + 0.3, L2 - 0.3]) L.lamp('sconce', p, 3.2, qF0 - 1.0, { face: [p < pc ? 1 : -1, 0], K: 2500, power: 0.45, clip: clipH, range: 6 });
    L.glowBox(L1, 0, FQ, L2, HH, D, { sky: '#ffbf8a', ground: S.floor, power: 0.16 });
    L.zone(L1, -0.5, FQ, L2, HH, qS0, { id: lot.id + '/house', place: 'city-special', name: 'The house', sub: info.name + ' theatre · ' + seats + ' seats, none matching', ambience: 'quiet', reverb: 'felt', cell: info.key, headroom: HH - 0.5 });
    // a cleaner by day, the director in the front aisle in the evening
    L.spot('work', L1 + aisleW / 2, 3 * RISE, qRow(3) + 0.5, Math.PI / 2, { tags: ['sweep'] }); L.spot('work', L2 - aisleW / 2, RISE, qRow(1) + 0.5, -Math.PI / 2, { tags: ['sweep'] });
    L.spot('stand', pc + 2.4, 0, qF0 + 1.2, 0, { tags: ['theatre', 'focus'] });
    // sit and watch: a seat by the middle aisle, four rows back
    const wk = Math.min(4, R - 1), wp = pc + 0.89, wq = qRow(wk) + 0.47;
    L.interact({ p: wp, y: wk * RISE + 0.9, q: wq, radius: 1.3, priority: 0.2,
      prompt: (gm) => (gm.clock && gm.clock.hours >= 17.5 && gm.clock.hours < 23 ? 'Sit and watch the rehearsal' : 'Sit in the house'),
      onUse: async (gm) => {
        if (!sitHere(L, gm, wp, wk * RISE, wq, 0, 'theatre-seat', 1.1)) return;
        const h = gm.clock ? gm.clock.hours : 12, eve = h >= 17.5 && h < 23;
        const lines = eve ? [play.t + '. ' + play.a, ...someBy(lot.seed + (gm.clock ? gm.clock.day : 1), 7, REHEARSAL, 2), play.b] : [...someBy(lot.seed, 8, DAYTIME, 2), 'Tonight: ' + play.t + '. ' + play.a];
        await say(gm, eve ? 'The rehearsal' : 'The house', lines);
      } });
    getUp(s, 'theatre');
  }
  await tick('house');

  // ---------------------------------------------------------------- the stage: platform, proscenium of felt, the set, the cloth
  {
    L.block(L1 + 0.08, 0, qS0, L2 - 0.08, SH, qS1, 'planks', '#3a2c24', { surf: 'wood' });
    s.structure(() => { g.mat('paint', '#1d1a1c'); L.box(L1 + 0.08, 0, qS0 - 0.02, L2 - 0.08, SH - 0.02, qS0, { faces: 'z' }); g.mat('wood', '#6b4a2f'); L.box(L1 + 0.08, SH - 0.05, qS0 - 0.05, L2 - 0.08, SH, qS0 + 0.03, { bevel: 0.01 }); });
    // steps up at both front corners, and down at the back to backstage
    for (const p of [L1 + aisleW + 0.2, L2 - aisleW - 0.2]) L.stairs(p, 0, qS0 - 1.35, [0, 1], SH, 1.35, 0.9, { mat: 'wood', tint: '#4a3222' });
    L.stairs(L1 + 1.0, 0, qS1 + 1.4, [0, -1], SH, 1.4, 1.0, { mat: 'wood', tint: '#4a3222' });
    // footlights
    L.lamp('strip', pc - PW / 2 + 0.5, SH + 0.04, qS0 + 0.12, { to: [pc + PW / 2 - 0.5, SH + 0.04, qS0 + 0.12], K: 2500, power: 0.6, clip: clipH, range: 5 });
    s.structure(() => { g.mat('cast', '#2b2724'); L.box(pc - PW / 2 + 0.4, SH, qS0 + 0.04, pc + PW / 2 - 0.4, SH + 0.1, qS0 + 0.08); });
    // the proscenium: felt legs either side and a border across the top
    const qP = qS0 + 0.55, legC = S.felt;
    s.deco(() => {
      g.mat('felt', legC); L.sheet([L1 + 0.1, HH - 0.1, qP], [pc - PW / 2, HH - 0.1, qP], [pc - PW / 2, SH + 0.02, qP], [L1 + 0.1, SH + 0.02, qP], { nu: 8, nv: 4, ripple: 0.06, rippleN: 7 });
      L.sheet([pc + PW / 2, HH - 0.1, qP], [L2 - 0.1, HH - 0.1, qP], [L2 - 0.1, SH + 0.02, qP], [pc + PW / 2, SH + 0.02, qP], { nu: 8, nv: 4, ripple: 0.06, rippleN: 7 });
      L.sheet([pc - PW / 2 - 0.2, HH - 0.1, qP - 0.05], [pc + PW / 2 + 0.2, HH - 0.1, qP - 0.05], [pc + PW / 2 + 0.2, 5.1, qP - 0.05], [pc - PW / 2 - 0.2, 5.1, qP - 0.05], { nu: 14, nv: 2, ripple: 0.05, rippleN: 11 });
      g.mat('felt', S.trim); L.quad([pc - PW / 2 - 0.2, 5.1, qP - 0.07], [pc + PW / 2 + 0.2, 5.1, qP - 0.07], [pc + PW / 2 + 0.2, 5.24, qP - 0.07], [pc - PW / 2 - 0.2, 5.24, qP - 0.07], { double: true });
    });
    await tick('stage');
    // tonight's cloth
    cloth(L, play.cloth, pc, PW + 1.2, qS1 - 0.45, SH + 0.05, 6.35, r);
    // the set: a table, a lamp that really lights, two chairs that do not match, a rug, and what the play needs
    const tq = qS0 + SD * 0.5;
    L.prop('rug', pc, SH, tq, 0, { w: 3.0, d: 2.0, a: S.felt2, b: '#e9dcc0' });
    L.prop('table', pc, SH, tq, 0, { w: 1.4, d: 0.8, wood: '#5a3a22', legs: 'four' });
    L.prop('chair', pc - 0.95, SH, tq + 0.1, Math.PI / 2 + 0.3, { wood: '#3a2a20', back: 'slat' }, { noSpots: true });
    L.prop('chair', pc + 0.9, SH, tq - 0.15, -Math.PI / 2 - 0.2, { wood: '#7a5233', back: 'hoop' }, { noSpots: true });
    if (hasProp('books.greenlamp')) L.prop('books.greenlamp', pc + 0.35, SH + 0.74, tq - 0.1, 0.4, {});
    L.light({ at: [pc + 0.35, SH + 1.12, tq - 0.06], color: '#ffd8a0', power: 2.4, range: 4.5, radius: 0.08, shadow: true, clip: clipH, lamp: true });
    s.detail(() => {
      g.mat('glaze', '#e9e2d0'); L.lathe(pc - 0.3, tq + 0.1, [[0, SH + 0.74], [0.04, SH + 0.74], [0.045, SH + 0.83], [0, SH + 0.825]], { segs: 10 });
      g.mat('paper', '#f2ead8'); L.box(pc - 0.1, SH + 0.74, tq - 0.25, pc + 0.12, SH + 0.745, tq - 0.05, { faces: 'Y' });
      if (play.cloth === 'rain' || play.cloth === 'sea') { g.mat('cast', '#9aa0a0'); L.lathe(pc + 1.7, tq + 0.6, [[0.12, SH], [0.16, SH + 0.3], [0.15, SH + 0.3], [0.11, SH + 0.01]], { segs: 12 }); }
      if (play.cloth === 'letters' || play.cloth === 'count') { g.mat('wood', '#4a3222'); L.box(pc - 2.4, SH, tq + 0.4, pc - 1.6, SH + 1.2, tq + 0.75, { bevel: 0.01 }); g.mat('paper', '#efe6d2'); L.box(pc - 2.35, SH + 0.3, tq + 0.39, pc - 1.65, SH + 1.1, tq + 0.4, { faces: 'z' }); }
      if (play.cloth === 'snow' || play.cloth === 'dark') { g.mat('cast', '#8a6d3b'); L.cyl(pc - 1.6, SH, tq - 0.6, 0.06, 0.24, { segs: 8 }); g.mat('diffuser', '#ffcf8a', { emissive: 2, lamp: true }); L.cyl(pc - 1.6, SH + 0.24, tq - 0.6, 0.045, 0.06, { segs: 8 }); }
      if (play.cloth === 'garden' || play.cloth === 'river') { g.mat('glaze', '#a3563a'); L.lathe(pc + 2.0, tq - 0.4, [[0.15, SH], [0.2, SH + 0.35], [0.18, SH + 0.36], [0, SH + 0.34]], { segs: 12 }); }
    });
    if (play.cloth === 'garden' || play.cloth === 'river') L.prop('plant', pc + 2.0, SH + 0.3, qS0 + SD * 0.5 - 0.4, 0, { kind: 'fern', size: 0.7, pot: '#a3563a' }, { noCollide: true });
    // the players' places: three to play and sing, one to drum
    const PT = ['sing', 'flute', 'drum', 'sing'];
    [[pc - 1.6, tq - 1.3, 0.3], [pc + 1.7, tq - 1.0, -0.4], [pc - 3.2, tq + 0.4, 0.9], [pc + 0.2, tq - 1.9, 0.0]].forEach((v, i) => L.spot('perform', v[0], SH, v[1], Math.PI + v[2], { tags: [PT[i], 'theatre'] }));
    for (const sg of [-1, 1]) { const p = sg < 0 ? L1 + aisleW + 0.2 : L2 - aisleW - 0.2; L.path([[p, 0, qF0 + 0.5], [p, 0, qS0 - 1.45], [p, SH, qS0 + 0.25], [pc + sg * 1.2, SH, tq - 1.4]], { width: 1.0 }); }
    L.path([[L1 + 1.0, 0, qS1 + 1.6], [L1 + 1.0, SH, qS1 - 0.2], [L1 + 2.0, SH, qS1 - 0.8], [pc - 1.6, SH, tq - 1.4]], { width: 1.0 });
    // the wings: the prop table stage left, a prompt desk stage right
    const wq = qS0 + SD * 0.42, wpL = L1 + 1.45, wpR = L2 - 1.3;
    L.prop('lots-theatre.proptable', wpL, SH, wq, Math.PI / 2, {});
    L.interact({ p: wpL + 0.7, y: SH + 1.0, q: wq, radius: 1.5, prompt: 'Read the cards on the prop table', onUse: (gm) => say(gm, 'The prop table', someBy(lot.seed, 9, PROPS, 4)) });
    s.detail(() => {
      g.mat('wood', '#3a2a20'); L.box(wpR - 0.4, SH, wq - 0.5, wpR + 0.4, SH + 1.1, wq + 0.5, { bevel: 0.01 });
      g.mat('paper', '#efe6d2'); L.box(wpR - 0.36, SH + 1.1, wq - 0.4, wpR + 0.2, SH + 1.104, wq + 0.4, { faces: 'Y' });
      g.mat('diffuser', '#7fb0ff', { emissive: 1.5, lamp: true }); L.box(wpR + 0.22, SH + 1.1, wq - 0.1, wpR + 0.3, SH + 1.2, wq + 0.1);
    });
    L.solid(wpR - 0.4, SH, wq - 0.5, wpR + 0.4, SH + 1.1, wq + 0.5);
    L.spot('work', wpR - 0.75, SH, wq, Math.PI / 2, { tags: ['write', 'theatre'] });
    L.zone(L1, -0.5, qS0, L2, HH, D, { id: lot.id + '/stage', place: 'city-special', name: 'The stage', sub: 'tonight: ' + play.t, ambience: 'quiet', reverb: 'felt', cell: info.key, headroom: HH - 0.5 });
  }
  await tick('set');

  // ---------------------------------------------------------------- backstage: the paint frame and its cloth
  {
    const fw = Math.min(C - 3, 12), q = D - 0.35, y0 = 0.35, y1 = Math.min(HH - 0.5, 5.6);
    s.furniture(() => {
      g.mat('wood', '#6b4a2f'); L.box(pc - fw / 2 - 0.12, 0, q - 0.06, pc - fw / 2, y1 + 0.2, q + 0.06); L.box(pc + fw / 2, 0, q - 0.06, pc + fw / 2 + 0.12, y1 + 0.2, q + 0.06);
      L.box(pc - fw / 2, y1, q - 0.05, pc + fw / 2, y1 + 0.12, q + 0.05); L.box(pc - fw / 2, y0 - 0.1, q - 0.05, pc + fw / 2, y0, q + 0.05);
    });
    const next = pickBy(lot.seed, 13, PLAYS.filter((pl) => pl !== play));
    cloth(L, next.cloth, pc, fw, q - 0.07, y0, y1, r, true);
    // a rolling bridge in front of it, the dye trolley, flats leaning on the side walls
    s.furniture(() => {
      g.mat('cast', '#3d4a45'); const bp = pc + fw * 0.15;
      for (const dp of [-0.9, 0.9]) for (const dq of [-0.5, 0.5]) L.tube([[bp + dp, 0, q - 1.3 + dq], [bp + dp, 2.1, q - 1.3 + dq]], 0.025, { segs: 6 });
      g.mat('wood', '#7a5233'); L.box(bp - 1.0, 2.05, q - 1.85, bp + 1.0, 2.1, q - 0.75);
      g.mat('wood', '#5a3a22'); L.box(pc - 2.4, 0.1, q - 1.6, pc - 1.4, 0.75, q - 1.0, { bevel: 0.01 });
      const pots = ['#2f6f73', '#c9552e', '#e0b04a', '#33407a', '#6b7a3a', '#e9e2d0'];
      for (let i = 0; i < 6; i++) { g.mat('glaze', pots[i]); L.lathe(pc - 2.3 + (i % 3) * 0.32, q - 1.45 + Math.floor(i / 3) * 0.3, [[0, 0.75], [0.1, 0.75], [0.11, 0.92], [0, 0.93]], { segs: 10 }); }
      g.mat('wood', '#c9b48a'); for (let i = 0; i < 4; i++) L.box(L1 + 0.2 + i * 0.06, 0, qS1 + 1.8 + i * 0.2, L1 + 0.26 + i * 0.06, 4.2 - i * 0.3, qS1 + 3.0 + i * 0.2);
      g.mat('paint', '#5f8a3a'); L.box(L1 + 0.45, 0.2, qS1 + 1.9, L1 + 0.46, 3.6, qS1 + 3.1, { faces: 'xX' });
    });
    for (const dp of [-0.9, 0.9]) L.solid(pc + fw * 0.15 + dp - 0.05, 0, q - 1.85, pc + fw * 0.15 + dp + 0.05, 2.1, q - 0.75);
    L.solid(pc - 2.4, 0, q - 1.6, pc - 1.4, 0.93, q - 1.0);
    L.spot('work', pc - fw * 0.25, 0, q - 1.1, 0, { tags: ['dye'] }); L.spot('work', pc + fw * 0.3, 0, q - 1.0, 0, { tags: ['dye'] });
    L.lamp('globe', pc, HH - 2.2, q - 2.2, { drop: 2.0, K: 3800, power: 1.6, clip: clipH, range: 9 });
    L.interact({ p: pc - fw * 0.1, y: 1.5, q: q - 1.4, radius: 1.8, prompt: 'Look at the cloth on the paint frame', onUse: (gm) => say(gm, 'The paint frame', [...someBy(lot.seed, 11, PAINT, 2), 'Next on the frame: ' + next.t + '.']) });
    L.path([[L1 + 1.0, 0, D - 2.0], [pc, 0, D - 2.0], [L2 - 1.0, 0, D - 2.0]], { width: 1.2 });
    L.path([[L1 + 1.0, 0, D - 2.0], [L1 + 1.0, 0, qS1 + 1.6]], { width: 1.0 });
  }
  await tick('backstage');

  // ---------------------------------------------------------------- the side rooms: the green room, the wardrobe
  for (const side of [-1, 1]) {
    const pa = side < 0 ? 0.16 : L2 + PS + 0.08, pb = side < 0 ? L1 - PS - 0.08 : W - 0.16, wd = pb - pa, mid = (pa + pb) / 2, pDoor = side < 0 ? pb : pa;
    const q0 = FQ + 0.08, q1 = D - 0.16, green = (side < 0) === ((lot.seed & 1) === 0);
    const clip = L.clip(pa, -0.2, q0, pb, HF + 0.1, q1);
    L.glowBox(pa, 0, q0, pb, HF, q1, { sky: green ? '#ffd8a8' : '#ffe6c4', ground: '#7a5a3a', power: 0.3 });
    L.zone(pa, -0.5, q0, pb, HF, q1, { id: lot.id + (green ? '/green' : '/wardrobe'), place: 'city-special', name: green ? 'The green room' : 'The wardrobe', sub: info.name + ' theatre · cast and crew', ambience: 'quiet', reverb: 'felt', cell: info.key });
    const outer = side < 0 ? pa : pb, inw = side < 0 ? 1 : -1;      // the outer wall and the way into the room from it
    const pp = side < 0 ? L1 - PS / 2 : L2 + PS / 2;
    L.path([[pp, dr1], [pDoor - inw * 0.9, dr1], [mid, dr1 + 1.2], [mid, dr2 - 1.2], [pDoor - inw * 0.9, dr2], [pp, dr2]], { width: 1.1 });
    if (green) {
      // the green room proper at the front: sofa, armchairs, the mirror, a kettle on the loop; dressing places behind
      const sq = q0 + 2.6;
      L.prop('bench', outer + inw * 0.55, 0, sq + 1.2, inw > 0 ? Math.PI / 2 : -Math.PI / 2, { w: 2.0, back: true, wood: '#5a3a22' }, { noSpots: true });
      s.detail(() => { g.mat('weave', '#2f5d50'); const c = [outer + inw * 0.6, sq + 1.2]; L.box(c[0] - 0.25, 0.46, c[1] - 0.95, c[0] + 0.25, 0.56, c[1] + 0.95, { bevel: 0.04 }); g.mat('knit', '#e0b04a'); L.box(c[0] - 0.12, 0.56, c[1] + 0.3, c[0] + 0.15, 0.66, c[1] + 0.62, { bevel: 0.04 }); });
      for (const dq of [-0.6, 0.0, 0.6]) L.spot('sit', outer + inw * 0.6, 0.5, sq + 1.2 + dq, inw > 0 ? Math.PI / 2 : -Math.PI / 2, { tags: ['theatre', 'green'] });
      if (wd > 4.4 && hasProp('books.armchair')) { L.prop('books.armchair', outer + inw * 3.0, 0, sq + 0.4, inw > 0 ? -Math.PI / 2 - 0.4 : Math.PI / 2 + 0.4, { fabric: '#8c3b26', mend: '#e0b04a', patch: '#3fa7a3', mendAt: 'arm' }, { noSpots: true }); L.spot('sit', outer + inw * 3.0, 0.47, sq + 0.4, inw > 0 ? -Math.PI / 2 - 0.4 : Math.PI / 2 + 0.4, { tags: ['theatre', 'green'] }); }
      L.prop('table', outer + inw * 1.8, 0, sq + 1.2, Math.PI / 2, { w: 1.0, d: 0.6, h: 0.45, wood: '#6b4a2f' });
      s.detail(() => { for (let i = 0; i < 4; i++) { g.mat('glaze', ['#e9e2d0', '#a3563a', '#3d6f8a', '#6b7a3a'][i]); const c = [outer + inw * (1.65 + (i % 2) * 0.3), sq + 0.95 + Math.floor(i / 2) * 0.4]; L.lathe(c[0], c[1], [[0, 0.45], [0.035, 0.45], [0.04, 0.53], [0, 0.535]], { segs: 8 }); } });
      L.prop('counter', mid, 0, q0 + 0.5, 0, { w: Math.min(2.4, Math.floor((wd - 1.2) * 2) / 2), d: 0.55, h: 0.9, body: '#2f5d50', top: '#b98a5a' }, { noSpots: true });
      s.detail(() => { g.mat('cast', '#b9b4aa'); L.lathe(mid - 0.4, q0 + 0.45, [[0, 0.9], [0.1, 0.9], [0.11, 1.08], [0.06, 1.14], [0, 1.15]], { segs: 10 }); });
      const nm = Math.max(1, Math.floor((q1 - sq - 4.0) / 2.0));
      for (let k = 0; k < nm; k++) {
        const mq = sq + 3.4 + k * 2.0;
        L.prop('lots-theatre.mirror', outer + inw * 0.06, 0.95, mq, inw > 0 ? Math.PI / 2 : -Math.PI / 2, {});
        s.detail(() => { g.mat('wood', '#5a3a22'); L.box(outer + inw * 0.05, 0.72, mq - 0.6, outer + inw * 0.55, 0.76, mq + 0.6, { bevel: 0.01 }); });
        L.solid(outer + inw * 0.05, 0, mq - 0.6, outer + inw * 0.55, 0.76, mq + 0.6);
        L.prop('stool', outer + inw * 0.95, 0, mq, 0, { wood: '#7a5a3a' }, { noSpots: true });
        L.spot('sit', outer + inw * 0.95, 0.46, mq, inw > 0 ? -Math.PI / 2 : Math.PI / 2, { tags: ['theatre', 'green'] });
      }
      await tick('green room');
      L.prop('lots-theatre.rail', outer + inw * (wd - 0.7), 0, (sq + q1) / 2, inw > 0 ? Math.PI / 2 : -Math.PI / 2, { w: Math.min(3.0, Math.round((q1 - sq - 2) * 2) / 2), seed: 3 });
      L.lamp('lantern', mid, HF - 0.5, sq + 1.2, { tint: '#3fa7a3', drop: 0.4, power: 1.1, clip, range: 7 });
      L.lamp('globe', mid, HF, (sq + q1) / 2 + 1.5, { drop: 0.5, K: 2900, power: 0.9, clip, range: 8 });
      for (let k = 0; k < 2; k++) { const t = k * Math.PI + 0.5, p = mid + Math.cos(t) * 0.55, q = q0 + 1.8 + Math.sin(t) * 0.55; L.spot('chat', p, 0, q, Math.atan2(mid - p, q0 + 1.8 - q), { tags: ['theatre', 'green'] }); }
      L.interact({ p: mid, y: 1.2, q: sq + 1.2, radius: 2.0, prompt: 'Look round the green room', onUse: (gm) => say(gm, 'The green room', someBy(lot.seed, 12, GREEN, 2)) });
      s.structure(() => { g.mat('paint', '#3f7f6a'); L.box(outer + inw * 0.09, 1.0, q0 + 0.2, outer + inw * 0.1, HF - 0.05, q1 - 0.2, { faces: inw > 0 ? 'X' : 'x' }); });
    } else {
      // the wardrobe: rows of costume rails, a cutting table, hat boxes on shelves, two seamsters' places
      const rows = Math.max(1, Math.floor((wd - 2.4) / 1.6));
      for (let k = 0; k < rows; k++) {
        const p = outer + inw * (1.0 + k * 1.6), len = Math.min(q1 - q0 - 7.5, 9), nseg = Math.max(1, Math.round(len / 2.6));
        for (let j = 0; j < nseg; j++) L.prop('lots-theatre.rail', p, 0, q0 + 5.6 + (j + 0.5) * len / nseg, Math.PI / 2, { w: Math.round((len / nseg - 0.3) * 2) / 2, seed: (k * 5 + j + lot.seed) & 3 });
        await tick('rails');
      }
      await tick('wardrobe rails');
      const tq = q0 + 2.8;
      L.prop('table', mid, 0, tq, 0, { w: Math.min(2.2, Math.floor((wd - 1.6) * 2) / 2), d: 1.0, h: 0.86, wood: '#7a5233', legs: 'trestle' });
      s.detail(() => { g.mat('weave', '#c9552e'); L.box(mid - 0.7, 0.86, tq - 0.3, mid + 0.4, 0.875, tq + 0.35); g.mat('weave', '#e0b04a'); L.box(mid + 0.1, 0.875, tq - 0.2, mid + 0.6, 0.885, tq + 0.1); g.mat('cast', '#3a3530'); L.box(mid - 0.2, 0.875, tq + 0.12, mid - 0.05, 0.89, tq + 0.32); });
      for (const sg of [-1, 1]) { L.prop('stool', mid + sg * 0.55, 0, tq + 0.85, 0, { wood: '#6b4a2f' }, { noSpots: true }); L.spot('work', mid + sg * 0.55, 0, tq + 0.75, Math.PI, { tags: ['sew', 'theatre'] }); }
      L.prop('shelving', mid, 0, q0 + 0.35, 0, { w: Math.min(3.0, Math.floor((wd - 1.2) * 2) / 2), h: 2.1, d: 0.4, shelves: 4, wood: '#5a3a22' });
      s.detail(() => { const sw = Math.min(3.0, Math.floor((wd - 1.2) * 2) / 2), n = Math.floor(sw / 0.5); for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { g.mat('paper', ['#c9552e', '#2f6f73', '#e0b04a', '#e9e2d0', '#5b3a6e'][(i + j * 2) % 5]); const p0 = mid - sw / 2 + 0.08 + i * 0.5; L.box(p0, 0.6 + j * 0.5, q0 + 0.2, p0 + 0.38, 0.86 + j * 0.5, q0 + 0.5, { faces: 'YxXzZ' }); } });
      L.lamp('globe', mid, HF, tq, { drop: 0.6, K: 3600, power: 1.2, clip, range: 7 });
      L.lamp('globe', mid, HF, (q0 + 5.6 + q1) / 2 + 1, { drop: 0.5, K: 2900, power: 0.9, clip, range: 9 });
      L.interact({ p: mid, y: 1.1, q: tq + 0.4, radius: 1.8, prompt: 'Look round the wardrobe', onUse: (gm) => say(gm, 'The wardrobe', [pickBy(lot.seed, 14, ['Every coat on these rails has been in at least three plays, and has the mends to show it.', 'A costume is taken in, let out and dyed again for every play. Colour weighs nothing; cloth is dear.', 'Hems for the High decks are weighted, so a skirt hangs right at half a g. These have little brass weights sewn in a row.']), pickBy(lot.seed, 15, ['A list on the door: who is wearing what tonight, and what it must not be sat on in.', 'Two seamsters’ places at the cutting table, each with its own scissors on a string.'])]) });
    }
    await tick('side room');
  }

  // the whole lot, for the HUD between rooms and the sound
  L.zone(0, -0.5, 0, W, HH, D, { id: lot.id, place: 'city-special', name: 'Theatre', sub: info.name + ' · nobody shouts', ambience: 'quiet', reverb: 'felt', cell: info.key });
}

// A painted cloth: the old world as the play needs it, in dye on a stretched cloth. (pc, q): its middle and plane;
// w its width; y0 to y1 its height. back: it faces the back wall (the paint frame) instead of the house.
function cloth(L, kind, pc, w, q, y0, y1, r, back) {
  const g = L.g, h = y1 - y0, u0 = pc - w / 2;
  const qq = q - 0.012;                       // painted shapes sit just in front of the cloth, on the side toward the street
  const Q = (a, b, c, d, col, em) => { g.mat('paint', col, em ? { emissive: em, lamp: true } : undefined); L.quad([u0 + a[0] * w, y0 + a[1] * h, qq], [u0 + b[0] * w, y0 + b[1] * h, qq], [u0 + c[0] * w, y0 + c[1] * h, qq], [u0 + d[0] * w, y0 + d[1] * h, qq], { double: true }); };
  const R = (x0, v0, x1, v1, col, em) => Q([x0, v0], [x1, v0], [x1, v1], [x0, v1], col, em);
  const BG = { rain: '#7d8a92', snow: '#c9cfd4', count: '#1f2a44', dark: '#14110f', garden: '#2f4a2a', river: '#2a1f2e', sea: '#5a7f96', letters: '#e6d8b8' }[kind] || '#7d8a92';
  L.s.deco(() => {
    g.mat('weave', BG); L.quad([u0, y0, q], [u0 + w, y0, q], [u0 + w, y1, q], [u0, y1, q], { double: true });
    g.mat('wood', '#3a2a20'); L.tube([[u0 - 0.1, y1 + 0.03, q], [u0 + w + 0.1, y1 + 0.03, q]], 0.04, { segs: 6 }); L.tube([[u0, y0 + 0.02, q], [u0 + w, y0 + 0.02, q]], 0.025, { segs: 5 });
    if (kind === 'rain') {
      R(0, 0.62, 1, 1, '#6c7880'); R(0, 0.78, 1, 1, '#5d6870');
      Q([0, 0], [1, 0], [1, 0.3], [0, 0.42], '#4f6b3a'); Q([0, 0], [1, 0], [1, 0.16], [0, 0.22], '#3d5a2c');
      R(0.62, 0.28, 0.78, 0.46, '#8a6a48'); Q([0.6, 0.46], [0.8, 0.46], [0.7, 0.56], [0.7, 0.56], '#5a3a26'); R(0.68, 0.28, 0.72, 0.38, '#2a1f1a'); R(0.74, 0.38, 0.77, 0.42, '#e8c26a', 0.6);
      g.mat('paint', '#b9c9d4'); for (let i = 0; i < 44; i++) { const x = r.f(0, 1), v = r.f(0.25, 0.95), dx = 0.012, dv = 0.07; L.quad([u0 + x * w, y0 + v * h, qq - 0.002], [u0 + (x + 0.004) * w, y0 + v * h, qq - 0.002], [u0 + (x + 0.004 - dx) * w, y0 + (v - dv) * h, qq - 0.002], [u0 + (x - dx) * w, y0 + (v - dv) * h, qq - 0.002], { double: true }); }
    } else if (kind === 'snow') {
      R(0, 0.55, 1, 1, '#aeb6bd'); Q([0, 0], [1, 0], [1, 0.4], [0, 0.48], '#eef1f3');
      Q([0.35, 0], [0.65, 0], [0.52, 0.44], [0.48, 0.44], '#8a8e8c');
      R(0.12, 0.38, 0.2, 0.62, '#3a3530'); Q([0.08, 0.62], [0.24, 0.62], [0.16, 0.78], [0.16, 0.78], '#2a2622'); R(0.82, 0.4, 0.88, 0.58, '#3a3530');
      g.mat('paint', '#ffffff'); for (let i = 0; i < 70; i++) { const x = r.f(0, 1), v = r.f(0.3, 0.98), s = 0.006; L.quad([u0 + x * w, y0 + v * h, qq - 0.002], [u0 + (x + s) * w, y0 + v * h, qq - 0.002], [u0 + (x + s) * w, y0 + (v + s * w / h) * h, qq - 0.002], [u0 + x * w, y0 + (v + s * w / h) * h, qq - 0.002], { double: true }); }
    } else if (kind === 'count') {
      R(0.2, 0.15, 0.8, 0.9, '#3a2a20'); R(0.22, 0.18, 0.78, 0.87, '#e6d8b8');
      for (let i = 0; i < 14; i++) { const v = 0.22 + i * 0.045; R(0.25, v, 0.25 + r.f(0.25, 0.48), v + 0.012, '#3a3530'); R(0.68, v, 0.75, v + 0.012, '#8a2f3c'); }
      R(0.2, 0.84, 0.8, 0.9, '#8a2f3c');
    } else if (kind === 'dark') {
      R(0.4, 0.2, 0.6, 0.55, '#221c18'); R(0.47, 0.3, 0.53, 0.38, '#f2c879', 1.2); R(0.45, 0.28, 0.55, 0.4, '#4a3420');
      for (let i = 0; i < 6; i++) R(0.05 + i * 0.16, 0.0, 0.1 + i * 0.16, 0.12 + r.f(0, 0.1), '#1d1714');
    } else if (kind === 'garden') {
      R(0, 0.85, 1, 1, '#1d2a1c'); R(0.2, 0.9, 0.8, 0.95, '#fff2c8', 1.5);
      for (let i = 0; i < 9; i++) { const x = 0.06 + i * 0.105; Q([x, 0.05], [x + 0.08, 0.05], [x + 0.06, 0.5 + r.f(0, 0.25)], [x + 0.02, 0.5 + r.f(0, 0.25)], i % 2 ? '#4f7a3a' : '#6b8f4e'); R(x + 0.03, 0.42, x + 0.05, 0.46, '#c9552e'); }
      R(0, 0, 1, 0.06, '#5a4030');
    } else if (kind === 'river') {
      for (let i = 0; i < 160; i++) { const t = r.next(), x = t, v = 0.25 + t * 0.5 + r.gauss() * 0.12, s = r.f(0.003, 0.008); if (v < 0.02 || v > 0.98) continue; g.mat('paint', r.chance(0.2) ? '#d89858' : '#d8c490'); L.quad([u0 + x * w, y0 + v * h, qq - 0.002], [u0 + (x + s) * w, y0 + v * h, qq - 0.002], [u0 + (x + s) * w, y0 + (v + s * w / h) * h, qq - 0.002], [u0 + x * w, y0 + (v + s * w / h) * h, qq - 0.002], { double: true }); }
      Q([0, 0.3], [0.5, 0.45], [0.48, 0.52], [0, 0.4], '#1a1420'); Q([0.55, 0.62], [1, 0.75], [1, 0.82], [0.6, 0.7], '#1a1420');
    } else if (kind === 'sea') {
      R(0, 0.6, 1, 1, '#9fb6c4'); for (let i = 0; i < 7; i++) { const v = 0.2 + i * 0.055; R(0, v, 1, v + 0.03, i % 2 ? '#3f6a86' : '#6f97ae'); }
      Q([0, 0], [1, 0], [1, 0.18], [0, 0.24], '#d8c08a'); R(0.1, 0.24, 0.24, 0.42, '#a8794f'); Q([0.08, 0.42], [0.26, 0.42], [0.17, 0.52], [0.17, 0.52], '#8a2f3c');
    } else {
      for (let i = 0; i < 12; i++) { const v = 0.18 + i * 0.06; R(0.08, v, 0.08 + r.f(0.3, 0.4), v + 0.012, '#3a3530'); R(0.55, v + 0.02, 0.55 + r.f(0.25, 0.38), v + 0.032, '#3a3530'); }
      R(0.42, 0.05, 0.58, 0.15, '#f2ead8'); Q([0.42, 0.15], [0.58, 0.15], [0.5, 0.1], [0.5, 0.1], '#c9b48a');
    }
  });
  void back;
}
