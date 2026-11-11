// A block's bath house: warm for nothing from the food plant's 65 degree loop. From the street: a tiled front with lit
// frosted windows and a curtained door; inside, the robing room | the keeper's desk and the broth urn | the resting room,
// then the steam room and a long washing hall, then the pool hall under a vault with its mural: the hot pool, the warm
// pool, the cold plunge in an aisle, the loop's pipes along a wall. Built from the lot's own coordinates (any front).
import { floor, ceiling } from '../world/kit.js';
import { smoothArch, cutRects } from './baths_parts.js';
import { local, chatRing, pickBy, byBand, sitPlayer, seatedAs } from './lots_baths_kit.js';
import { say, note } from '../city/lots.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';
import { meter, BATH_PALS, BRASS, pool, arcOf, vault, mural, KEEPERS, FASCIA_SUB, PRICE, GREET, ASK_HEAT, PAID, NOT_PAID, BROTH, WASHED, HOT, WARM, SHALLOW_LOW, COLD, STEAM, REST, OVERHEARD, RULES, RULES_HIGH, PLATE } from './lots_baths_bath_parts.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export async function buildBaths(s, lot, plan, game, tick) {
  const L = local(s, lot), g = s.g, W = L.W, D = L.D, info = plan.info, r = new Rng(lot.seed), seed = lot.seed >>> 0;
  const high = info.band === 'high', low = info.band === 'low';
  const pal = BATH_PALS[seed % BATH_PALS.length];
  const keeper = { name: pickBy(seed, 1, KEEPERS), colour: '#8fd0c0' };
  const bathName = info.name + ' baths';
  const cx = W / 2, Q1 = 7.5, Q2 = 13.1, RW = cx - 6, RR0 = cx + 6;
  const SW = clamp(W * 0.2, 7.5, 10), NW = clamp(Math.round(W * 0.42), 16, 22), AW = (W - NW) / 2, A0 = AW, A1 = W - AW;
  const SPR = 4.4, CROWN = 6.95, DH = D - Q2;
  const tileWall = (dado) => ({ mat: 'tile', tint: pal.tile, dado: { h: dado || 1.2, mat: 'tile', tint: pal.dado }, skirt: pal.dadoD });
  const clipFront = L.clip(0, -0.3, 0, W, 3.45, Q1 + 0.05), clipEntry = L.clip(RW, -0.3, 0, RR0, 3.45, Q1 + 0.1);
  const clipRobe = L.clip(0, -0.3, 0, RW, 3.45, Q1), clipRest = L.clip(RR0, -0.3, 0, W, 3.45, Q1);
  const clipSteam = L.clip(0, -0.3, Q1, SW, 2.7, Q2), clipWash = L.clip(SW, -0.3, Q1, W, 3.45, Q2 + 0.1);
  const clipHall = L.clip(0, -1.6, Q2, W, 7.1, D);
  const key = (k) => lot.id + ':' + k;
  const done = meter(s, 'baths ' + W.toFixed(1) + ' x ' + D.toFixed(1) + ' front ' + lot.front + ' ' + info.band);
  const T = async () => { if (done.pause) done.pause(); if (tick) await tick(); if (done.resume) done.resume(); };

  // =============================================================================================================
  // the shell
  // =============================================================================================================
  // floors (the pool hall's are cut round its pools further down)
  L.floor(0, 0, RW, Q1, 0, 'planks', '#a8794f');
  L.floor(RW, 0, RR0, Q1, 0, 'hex', mixHex(pal.cream, pal.hex, 0.4));
  L.floor(RR0, 0, W, Q1, 0, 'planks', '#8a6240');
  L.floor(0, Q1, SW, Q2, 0, 'tile', shadeHex(pal.dadoD, 1.1));
  L.floor(SW, Q1, W, Q2, 0, 'tile', mixHex(pal.cream, pal.hex, 0.55));
  L.ceiling(0, 0, W, Q1, 3.3, 'paint', mixHex(pal.cream, '#d9c9a8', 0.4));
  L.ceiling(SW, Q1, W, Q2, 3.3, 'paint', pal.cream);
  L.ceiling(0, Q1, SW, Q2, 2.6, 'tile', shadeHex(pal.dado, 1.05));
  L.ceiling(0, Q2, A0, D, 3.3, 'paint', pal.cream); L.ceiling(A1, Q2, W, D, 3.3, 'paint', pal.cream);
  await T();
  // the front on the street: a tiled wall, a curtained door, lit frosted windows
  const wins = [];
  wins.push(cx - 4.0, cx + 2.9);
  for (const span of [[0, RW], [RR0, W]]) { const n = Math.max(1, Math.floor((span[1] - span[0] - 1.6) / 3.0)); for (let k = 0; k < n; k++) wins.push(span[0] + (span[1] - span[0]) * (k + 0.5) / n - 0.55); }
  L.wallP(0.08, 0, W, 0, 3.2, { mat: 'tile', tint: pal.cream, dado: { h: 1.0, mat: 'tile', tint: pal.dadoD }, skirt: pal.deep, openings: [{ at: cx - 1.0, w: 2.0, h: 2.6 }].concat(wins.map((a) => ({ at: a, w: 1.1, h: 1.5, sill: 1.0 }))) });
  L.wallQ(0.08, 0, D, 0, 3.4, tileWall(1.3)); L.wallQ(W - 0.08, 0, D, 0, 3.4, tileWall(1.3));
  await T();
  L.wallP(D - 0.08, 0, W, 0, 3.4, tileWall(1.3));
  await T();
  s.structure(() => {
    for (const a of wins) {
      const p0 = a, p1 = a + 1.1;
      g.mat('diffuser', '#f0d2a0', { emissive: 0.55, lamp: true }); L.box(p0, 1.0, 0.06, p1, 2.5, 0.1);
      g.mat('cast', BRASS); for (const u of [0.367, 0.733]) L.box(p0 + u - 0.01, 1.0, 0.02, p0 + u + 0.01, 2.5, 0.14);
      for (const v of [1.5, 2.0]) L.box(p0, v, 0.02, p1, v + 0.02, 0.14);
      g.mat('tile', pal.acc); L.box(p0 - 0.1, 0.92, -0.06, p1 + 0.1, 1.0, 0.0, { bevel: 0.01 });
      g.mat('tile', pal.dado);
      for (let i = 0; i < 9; i++) { const t0 = i / 9 * Math.PI, t1 = (i + 1) / 9 * Math.PI, pa = (p0 + p1) / 2 - Math.cos(t0) * 0.66, pb = (p0 + p1) / 2 - Math.cos(t1) * 0.66, ym = Math.sin((t0 + t1) / 2) * 0.3; L.box(Math.min(pa, pb), 2.56 + ym, -0.05, Math.max(pa, pb), 2.64 + ym, 0.0); }
    }
    // pilasters, a band of accent tile, the deep cornice with its brass line
    g.mat('tile', pal.dado);
    const pil = [0.2, W - 0.2, cx - 1.6, cx + 1.6]; for (const a of [RW, RR0]) pil.push(a);
    for (const a of pil) L.box(a - 0.18, 0, -0.07, a + 0.18, 3.0, 0.0, { bevel: 0.015 });
    g.mat('tile', pal.acc); L.box(0, 1.0, -0.04, cx - 1.6, 1.07, 0.0); L.box(cx + 1.6, 1.0, -0.04, W, 1.07, 0.0);
    g.mat('paint', pal.deep); L.box(0, 3.0, -0.09, W, 3.2, 0.0, { bevel: 0.01 });
    g.mat('cast', BRASS); L.box(0, 2.98, -0.1, W, 3.0, -0.08);
    // a mosaic mat before the door
    g.mat('mosaic', pal.acc); L.box(cx - 1.5, 0.002, 0.16, cx + 1.5, 0.006, 1.4, { faces: 'Y' });
    g.mat('mosaic', pal.cream); L.box(cx - 1.35, 0.006, 0.26, cx + 1.35, 0.009, 1.3, { faces: 'Y' });
    g.mat('mosaic', pal.dado); L.box(cx - 0.9, 0.009, 0.4, cx + 0.9, 0.012, 1.16, { faces: 'Y' });
  });
  { const c = L.P(cx, 0.08); smoothArch(s, c[0], 0, c[1], 2.0, 2.6, L.axis(1, 0).toLowerCase(), { tint: pal.cream, depth: 0.3, rise: 0.7, f: 0.13, line: pal.acc, key: pal.dadoD }); }
  await T();
  L.sign({ kind: 'fascia', text: bathName.toUpperCase(), sub: pickBy(seed, 2, FASCIA_SUB), palette: [pal.deep, '#f6ead0', pal.acc], emblem: 'drop' }, cx, 2.94, -0.1, [0, -1], { w: Math.min(6.4, W * 0.2), h: 0.32, glow: 2.2 });
  // the split curtain in the doorway, hung inside so it reads through the arch
  s.deco(() => {
    g.mat('cast', BRASS); L.tube([[cx - 1.0, 2.42, 0.28], [cx + 1.0, 2.42, 0.28]], 0.016, { segs: 6 });
    for (let i = 0; i < 3; i++) {
      const pa = cx - 0.98 + i * 0.66, pb = pa + 0.62;
      g.mat('weave', i === 1 ? pal.acc : pal.deep); L.sheet([pa, 2.42, 0.28], [pb, 2.42, 0.28], [pb, 1.9, 0.3], [pa, 1.9, 0.3], { nu: 3, nv: 2, ripple: 0.012, rippleN: 3 });
      g.mat('weave', '#f1e2c2'); L.box(pa + 0.02, 1.98, 0.26, pb - 0.02, 2.02, 0.32);
    }
  });
  const clipOut = L.clip(cx - 5, -0.3, -3.5, cx + 5, 3.4, 0.3);
  L.lamp('sconce', cx - 1.95, 2.2, -0.1, { face: [0, -1], clip: clipOut, K: 2700, power: 0.9 });
  L.lamp('sconce', cx + 1.95, 2.2, -0.1, { face: [0, -1], clip: clipOut, K: 2700, power: 0.9 });
  await T();

  // band 1's walls: robing | entry | resting; band 2 behind them; the pool hall's front wall
  L.wallQ(RW, 0, Q1, 0, 3.4, Object.assign(tileWall(1.4), { openings: [{ at: 2.0, w: 2.4, h: 2.6 }] }));
  L.wallQ(RR0, 0, Q1, 0, 3.4, tileWall(1.4));
  const robeDoor = RW - 3.0, restDoor = RR0 + 1.0;
  L.wallP(Q1, 0, W, 0, 3.4, Object.assign(tileWall(1.5), { openings: [{ at: robeDoor, w: 1.5, h: 2.3 }, { at: cx - 1.5, w: 3.0, h: 2.8 }, { at: restDoor, w: 1.4, h: 2.2 }] }));
  { const c = L.P(cx, Q1); smoothArch(s, c[0], 0, c[1], 3.0, 2.8, L.axis(1, 0).toLowerCase(), { tint: '#e2d5b8', depth: 0.34, rise: 0.9, line: pal.acc, key: pal.dadoD }); }
  await T();
  L.wallQ(SW, Q1, Q2, 0, 3.4, Object.assign(tileWall(1.6), { tint: '#4f8f80', mat: 'tile', dado: { h: 0.95, mat: 'mosaic', tint: pal.dadoD } }));
  const aDoorA = SW + 2.5 <= A0 ? SW + 0.7 : null, aDoorB = A1 + 0.8;
  const q2ops = [{ at: 0.35, w: SW - 0.6, h: 2.4 }, { at: cx - 1.5, w: 3.0, h: 2.8 }, { at: aDoorB, w: 1.6, h: 2.4 }];
  if (aDoorA !== null) q2ops.push({ at: aDoorA, w: 1.6, h: 2.4 });
  L.wallP(Q2, 0, W, 0, 3.4, Object.assign(tileWall(1.5), { openings: q2ops }));
  L.wallP(Q2, A0, A1, 3.4, 3.6, { mat: 'tile', tint: pal.cream, skirt: false });
  L.wallP(D - 0.08, A0, A1, 3.4, 3.6, { mat: 'tile', tint: pal.cream, skirt: false });
  { const c = L.P(cx, Q2); smoothArch(s, c[0], 0, c[1], 3.0, 2.8, L.axis(1, 0).toLowerCase(), { tint: '#e2d5b8', depth: 0.34, rise: 0.9, line: pal.acc, key: pal.dadoD }); }
  await T();

  if (done.lap) done.lap('shell');
  // =============================================================================================================
  // the entry: the keeper's desk, robes on the warm rail, the broth urn, the rules
  // =============================================================================================================
  s.structure(() => {
    const cq = Q1 * 0.5, cell = 0.11, R = 1.15;
    const colAt = (i, j) => { const d = Math.hypot(i, j) * cell; if (d > R) return null; const a = Math.atan2(j, i), ray = Math.cos(a * 8) > 0.2; return d < 0.18 ? '#fff3c8' : d < 0.5 ? (ray ? pal.acc2 : '#f3dcae') : d < 0.66 ? pal.cream : d < 1.0 ? (Math.sin(a * 12 + d * 9) > 0 ? pal.dado : pal.dadoD) : pal.acc; };
    for (let j = -11; j <= 11; j++) {
      let i = -11;
      while (i <= 11) {
        const c = colAt(i, j); if (!c) { i++; continue; }
        let k = i; while (k + 1 <= 11 && colAt(k + 1, j) === c) k++;
        g.mat('mosaic', c); L.box(cx + i * cell - cell / 2 + 0.006, 0.0, cq + j * cell - cell / 2 + 0.006, cx + k * cell + cell / 2 - 0.006, 0.005, cq + j * cell + cell / 2 - 0.006, { faces: 'Y' });
        i = k + 1;
      }
    }
  });
  await T();
  s.deco(() => { g.mat('wood', pal.wood); for (let p = RW + 1.5; p < RR0 - 0.5; p += 2.5) L.box(p - 0.09, 3.08, 0.2, p + 0.09, 3.3, Q1 - 0.1, { bevel: 0.012 }); g.mat('felt', '#e8dcc4'); L.tube([[RW + 0.15, 2.95, Q1 - 0.26], [RR0 - 0.15, 2.95, Q1 - 0.26]], 0.075, { segs: 10 }); });
  await T();
  // the desk, along the resting room's wall, the keeper behind it
  const dp = RR0 - 1.9, dq = Q1 * 0.5;
  L.prop('counter', dp, 0, dq, -Math.PI / 2, { w: 2.6, d: 0.65, body: pal.dadoD, top: '#7a5233' }, { noSpots: true });
  L.spot('counter', dp + 0.8, 0, dq, -Math.PI / 2, { tags: ['keeper', 'baths'] });
  for (const dz of [-0.7, 0.7]) L.spot('customer', dp - 0.95, 0, dq + dz, Math.PI / 2, { tags: ['baths'] });
  L.prop('baths.robes', RR0 - 0.08, 0, dq, -Math.PI / 2, { w: Math.min(3.6, Q1 - 2.2), n: 8, seed: seed % 5 });
  L.prop('baths.towels', RR0 - 0.3, 0, 0.95, -Math.PI / 2, { w: 1.1, seed: seed % 7, shelves: 4 });
  s.detail(() => {
    const b = (p0, y0, q0, p1, y1, q1, m, c) => { g.mat(m, c); L.box(p0, y0, q0, p1, y1, q1, { bevel: 0.006 }); };
    b(dp - 0.2, 0.92, dq - 0.95, dp + 0.2, 0.945, dq - 0.45, 'weave', '#5a2a22'); b(dp - 0.18, 0.945, dq - 0.93, dp + 0.18, 0.955, dq - 0.47, 'paper', '#f1e8d4');
    g.mat('cast', BRASS); L.lathe(dp, dq - 0.1, [[0, 0.92], [0.05, 0.92], [0.05, 0.93], [0.035, 0.96], [0.012, 0.99], [0.008, 1.0], [0, 1.0]], { segs: 12 });
    b(dp - 0.2, 0.92, dq + 0.25, dp + 0.2, 0.95, dq + 0.6, 'wood', '#4a3220');
    g.mat('cast', BRASS); for (let k = 0; k < 6; k++) L.cyl(dp - 0.12 + (k % 3) * 0.11, 0.95, dq + 0.33 + Math.floor(k / 3) * 0.14, 0.03, 0.006, { segs: 10 });
    g.mat('cast', '#2a6863'); L.lathe(dp + 0.05, dq + 0.95, [[0.07, 0.92], [0.05, 0.94], [0.015, 0.96], [0.012, 1.42]], { segs: 10 });
    g.mat('diffuser', '#ffd9a0', { emissive: 3.5, lamp: true }); L.ball(dp + 0.05, 1.36, dq + 0.95, 0.07, 0.07, 0.07, { segs: 10, rings: 6 });
  });
  await T();
  // the broth on a warm tiled shelf against the back wall, anti side of the arch
  const up0 = RW + 0.5, up1 = Math.min(cx - 2.0, RW + 4.0);
  s.furniture(() => {
    g.mat('tile', pal.dadoD); L.box(up0, 0, Q1 - 0.6, up1, 0.86, Q1 - 0.08, { bevel: 0.01, aoBottom: 0.6 });
    g.mat('cast', BRASS, { rough: -0.2 }); L.box(up0 - 0.05, 0.86, Q1 - 0.66, up1 + 0.05, 0.9, Q1 - 0.08, { bevel: 0.008 });
    g.mat('felt', '#e8dcc4'); L.tube([[up0 + 0.1, 0.72, Q1 - 0.66], [up1 - 0.1, 0.72, Q1 - 0.66]], 0.05, { segs: 8 });
    g.mat('wood', pal.wood); L.box(up0, 1.55, Q1 - 0.36, up1, 1.58, Q1 - 0.08, { bevel: 0.006 });
  });
  L.solid(up0, 0, Q1 - 0.66, up1, 0.9, Q1 - 0.08);
  L.prop('baths.urn', up0 + 0.5, 0.9, Q1 - 0.36, Math.PI, {});
  const cupCols = [pal.cream, '#d9cfb8', pal.dado, pal.acc, '#e8d9b8', pal.acc2];
  for (let i = 0; i < 10; i++) L.prop('cup', up0 + 1.0 + (i % 5) * 0.3, 0.9, Q1 - 0.5 + Math.floor(i / 5) * 0.2, 0, { glaze: cupCols[i % 6], lid: shadeHex(cupCols[(i + 2) % 6], 0.85) });
  for (let i = 0; i < Math.floor((up1 - up0 - 0.3) / 0.4); i++) L.prop('cup', up0 + 0.25 + i * 0.4, 1.58, Q1 - 0.22, 0, { glaze: cupCols[(i + 3) % 6], lid: shadeHex(cupCols[(i + 5) % 6], 0.9) });
  await T();
  const rs0 = high ? RULES_HIGH : pickBy(seed, 3, RULES), rulesSpec = { title: rs0.title, lines: ['A bath · ' + PRICE.toFixed(2) + ' kays · robe and broth free'].concat(rs0.lines) };
  L.sign({ kind: 'plate', text: rulesSpec.title, lines: rulesSpec.lines.slice(0, 3) }, cx + 2.4, 1.6, Q1 - 0.1, [0, -1], { w: 0.6, h: 0.32 });
  L.prop('bench', cx - 3.2, 0, 0.55, 0, { w: 1.8, back: true, wood: '#7a5233' });
  L.prop('baths.fernpot', RW + 0.45, 0, 0.5, 0, { pot: pal.acc, size: 1.1 });
  L.prop('baths.fernpot', cx + 2.0, 0, 0.5, 0, { pot: pal.dado, size: 0.9 });
  L.prop('baths.fernpot', cx + 1.8, 0, Q1 - 0.45, 0, { pot: pal.acc2, size: 0.8 });
  for (const p of [cx - 3, cx + 2.2]) L.lamp('globe', p, 2.45, Q1 * 0.5, { r: 0.2, drop: 0.85, clip: clipEntry, K: 2700, power: 1.1 });
  L.glowBox(RW, 0, 0, RR0, 3.3, Q1, { sky: '#ffdcae', ground: '#c9a57c', power: 0.3 });
  await T();

  if (done.lap) done.lap('entry');
  // =============================================================================================================
  // the robing room: banks of lockers in bays, benches, slippers, a mending table
  // =============================================================================================================
  {
    const bw = 6 * 0.42;
    L.prop('baths.lockers', 0.32, 0, Q1 * 0.5, Math.PI / 2, { cols: 6, rows: 3, seed: seed % 3 });
    L.prop('bench', 1.4, 0, Q1 * 0.5, Math.PI / 2, { w: 2.2, wood: '#8a6240' });
    // banks along the back wall, between the side wall and the door to the washing hall
    const banks = []; for (let p = 1.0 + bw / 2; p + bw / 2 < robeDoor - 0.4; p += bw + 0.6) banks.push(p);
    for (let k = 0; k < banks.length; k++) {
      L.prop('baths.lockers', banks[k], 0, Q1 - 0.32, Math.PI, { cols: 6, rows: 3, seed: (seed + k) % 3 });
      L.prop('bench', banks[k], 0, Q1 - 1.5, Math.PI, { w: 2.0, wood: ['#8a6240', '#9a7448', '#7a5233'][k % 3] });
      for (const dpp of [-0.8, 0.8]) L.spot('stand', banks[k] + dpp, 0, Q1 - 0.95, 0, { tags: ['baths', 'lockers'] });
      if (k % 2 === 0) await T();
    }
    const strap = [pal.dado, pal.acc, pal.acc2, '#33407a'];
    for (let k = 0; k < Math.min(10, banks.length * 3 + 2); k++) L.prop('baths.slippers', 1.2 + k * ((RW - 2.4) / 10), 0, Q1 - 2.2 + (k % 2) * 0.12, Math.PI + (k % 3 - 1) * 0.3, { c: ['#c9a46a', '#b08d5e', '#d9b77a'][k % 3], strap: strap[k % 4] });
    // the mending table under a front window: a robe with a bright patch, a tin of thread
    const mp = Math.max(2.6, RW * 0.5);
    L.prop('table', mp, 0, 1.2, 0, { w: 1.3, d: 0.65, wood: '#6f4e33' });
    L.prop('stool', mp, 0, 1.95, 0, { wood: '#7a5a3a' });
    L.spot('sit', mp, 0.46, 1.95, Math.PI, { tags: ['mend', 'baths'] });
    s.detail(() => {
      g.mat('knit', pal.cream); L.box(mp - 0.4, 0.74, 1.0, mp + 0.15, 0.82, 1.4, { bevel: 0.03 });
      g.mat('knit', pal.acc); L.box(mp - 0.25, 0.82, 1.08, mp - 0.05, 0.825, 1.28);
      g.mat('cast', '#7a6a4a'); L.cyl(mp + 0.35, 0.74, 1.15, 0.07, 0.05, { segs: 12 });
      g.mat('weave', pal.acc2); L.cyl(mp + 0.32, 0.79, 1.13, 0.012, 0.03, { segs: 6 }); g.mat('weave', pal.dado); L.cyl(mp + 0.38, 0.79, 1.18, 0.012, 0.03, { segs: 6 });
    });
    L.prop('baths.fernpot', RW - 0.45, 0, 0.5, 0, { pot: pal.dado, size: 1.0 });
    for (const p of [RW * 0.3, RW * 0.72]) L.lamp('globe', p, 2.5, Q1 * 0.55, { r: 0.18, drop: 0.75, clip: clipRobe, K: 2800, power: 1.0 });
    L.glowBox(0, 0, 0, RW, 3.3, Q1, { sky: '#ffe2bc', ground: '#a8794f', power: 0.28 });
  }
  await T();

  if (done.lap) done.lap('robing');
  // =============================================================================================================
  // the resting room: loungers under the windows, felt, a low tea table, a shelf of games
  // =============================================================================================================
  {
    const n = Math.min(8, Math.max(3, Math.floor((W - RR0 - 1.0) / 1.45))), tw = ['#efe4cc', pal.dado, pal.acc, '#efe4cc', pal.acc2];
    for (let i = 0; i < n; i++) L.prop('baths.lounger', RR0 + 0.95 + i * 1.45, 0, 1.2, Math.PI, { wood: ['#9a7448', '#b08d5e', '#8a6240'][i % 3], towel: tw[i % 3] }, { spot: { tags: ['rest', 'baths'] } });
    await T();
    await T();
    s.deco(() => {
      const cols = [pal.acc2, '#33407a', pal.acc, pal.dadoD, '#8a2f3c']; let i = 0;
      for (let p = restDoor + 2.0; p + 2.0 < W - 0.3; p += 2.2) { g.mat('felt', cols[i++ % cols.length]); L.sheet([p, 2.75, Q1 - 0.12], [p + 2.0, 2.75, Q1 - 0.12], [p + 2.0, 0.5, Q1 - 0.14], [p, 0.5, Q1 - 0.14], { nu: 6, nv: 4, ripple: 0.025, rippleN: 6 }); }
      for (let q = 2.4; q + 1.8 < Q1 - 0.2; q += 2.0) { g.mat('felt', cols[i++ % cols.length]); L.sheet([W - 0.18, 2.75, q], [W - 0.18, 2.75, q + 1.8], [W - 0.2, 0.5, q + 1.8], [W - 0.2, 0.5, q], { nu: 6, nv: 4, ripple: 0.025, rippleN: 6 }); }
      for (let k = 0; k < 3; k++) { g.mat('felt', cols[(k + 2) % cols.length]); const q = 2.4 + k * 1.6; L.sheet([RR0 + 0.4, 3.0, q], [W - 0.4, 3.0, q], [W - 0.4, 2.65, q], [RR0 + 0.4, 2.65, q], { nu: 8, nv: 2, sag: 0.08 }); }
      g.mat('felt', '#8a2f3c'); L.sheet([restDoor - 0.05, 2.18, Q1 - 0.12], [restDoor + 0.45, 2.18, Q1 - 0.12], [restDoor + 0.4, 0.05, Q1 - 0.16], [restDoor, 0.05, Q1 - 0.16], { nu: 4, nv: 5, ripple: 0.03, rippleN: 5 });
    });
    await T();
    const tables = W - RR0 > 15 ? [RR0 + (W - RR0) * 0.33, RR0 + (W - RR0) * 0.72] : [RR0 + (W - RR0) * 0.55];
    for (const tp of tables) {
      const tq = Q1 * 0.6;
      L.prop('rug', tp, 0, tq, 0, { w: 3.6, d: 2.4, a: '#8a2f3c', b: pal.acc2 }, { noCollide: true });
      s.furniture(() => { g.mat('wood', '#5a3d28'); L.box(tp - 0.6, 0.3, tq - 0.35, tp + 0.6, 0.35, tq + 0.35, { bevel: 0.012 }); for (const sp of [-0.5, 0.5]) for (const sq of [-0.25, 0.25]) L.box(tp + sp - 0.025, 0, tq + sq - 0.025, tp + sp + 0.025, 0.3, tq + sq + 0.025); });
      L.solid(tp - 0.6, 0, tq - 0.35, tp + 0.6, 0.35, tq + 0.35);
      L.prop('baths.teapot', tp, 0.35, tq, 0.4, { glaze: pal.dadoD });
      for (const c of [[-0.4, -0.15], [-0.3, 0.2], [0.35, -0.18], [0.42, 0.16]]) L.prop('cup', tp + c[0], 0.35, tq + c[1], 0, { glaze: pal.cream, lid: pal.dado });
      for (const c of [[-1.0, 0, Math.PI / 2], [1.0, 0, -Math.PI / 2], [0, 0.8, Math.PI]]) { L.prop('baths.cushion', tp + c[0], 0, tq + c[1], c[2], { c: [pal.acc2, pal.acc, '#33407a'][Math.abs(Math.round(c[0] + c[1] * 2)) % 3] }); }
      L.lamp('lantern', tp, 2.1, tq, { tint: tp === tables[0] ? pal.acc2 : pal.acc, drop: 0.75, clip: clipRest, K: 2500, power: 0.6 });
    }
    if (tables.length === 1) L.lamp('lantern', RR0 + 2.2, 2.25, Q1 - 1.6, { tint: '#f2c879', drop: 0.55, clip: clipRest, K: 2500, power: 0.45 });
    L.prop('baths.game', W - 1.2, 0, Q1 - 1.4, 0.1, {});
    s.furniture(() => {
      g.mat('wood', '#5a3d28'); L.box(W - 0.5, 0, 0.4, W - 0.16, 1.2, 1.6, { bevel: 0.01 });
      const bc = [pal.acc, '#33407a', pal.acc2, pal.dado, '#8a2f3c', pal.cream];
      for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) { g.mat('paper', bc[(k * 4 + i) % 6]); L.box(W - 0.46, 0.1 + k * 0.38, 0.5 + i * 0.27, W - 0.22, 0.16 + k * 0.38 + (i % 2) * 0.03, 0.73 + i * 0.27, { bevel: 0.006 }); }
    });
    L.solid(W - 0.5, 0, 0.4, W - 0.16, 1.2, 1.6);
    L.prop('baths.fernpot', W - 0.6, 0, Q1 - 0.5, 0, { pot: pal.acc2, size: 1.0 });
    L.glowBox(RR0, 0, 0, W, 3.3, Q1, { sky: '#ffcf9a', ground: '#8a6240', power: 0.18 });
  }
  await T();

  if (done.lap) done.lap('rest');
  // =============================================================================================================
  // the steam room: tiers on two walls, a glazed front on the pool hall, steam over the brass box
  // =============================================================================================================
  {
    const tier = (p0, q0, p1, q1, y, tint) => { s.furniture(() => { g.mat('tile', tint); L.box(p0, 0, q0, p1, y - 0.05, q1, { aoBottom: 0.6 }); g.mat('wood', '#8a6240', { rough: -0.05 }); L.box(p0 + 0.01, y - 0.05, q0 + 0.01, p1 - 0.01, y, q1 - 0.01, { bevel: 0.006 }); }); L.solid(p0, 0, q0, p1, y, q1); };
    tier(0.16, Q1 + 0.08, SW - 0.08, Q1 + 0.68, 0.9, pal.dadoD);
    tier(0.76, Q1 + 0.68, SW - 0.08, Q1 + 1.28, 0.45, shadeHex(pal.dado, 0.9));
    tier(0.16, Q1 + 0.68, 0.76, Q2 - 0.3, 0.9, pal.dadoD);
    tier(0.76, Q1 + 1.28, 1.36, Q2 - 0.3, 0.45, shadeHex(pal.dado, 0.9));
    for (let p = 0.6; p < SW - 0.4; p += 1.15) L.spot('sit', p, 0.9, Q1 + 0.4, 0, { tags: ['steam', 'baths'] });
    for (let p = 1.3; p < SW - 0.4; p += 1.2) L.spot('sit', p, 0.45, Q1 + 1.0, 0, { tags: ['steam', 'baths'] });
    for (let q = Q1 + 1.4; q < Q2 - 0.6; q += 1.15) { L.spot('sit', 0.45, 0.9, q, Math.PI / 2, { tags: ['steam', 'baths'] }); L.spot('sit', 1.05, 0.45, q + 0.5, Math.PI / 2, { tags: ['steam', 'baths'] }); }
    s.structure(() => {
      g.mat('tile', shadeHex(pal.dado, 0.85)); L.box(0.16, 0.9, Q1 + 0.08, 0.18, 2.6, Q2 - 0.1); L.box(0.18, 0.9, Q1 + 0.08, SW - 0.08, 2.6, Q1 + 0.1);
      L.box(SW - 0.1, 0, Q1 + 0.1, SW - 0.08, 2.6, Q2 - 0.1);
      g.mat('mosaic', pal.acc); L.box(0.18, 1.9, Q1 + 0.1, 0.2, 1.98, Q2 - 0.1); L.box(0.2, 1.9, Q1 + 0.1, SW - 0.1, 1.98, Q1 + 0.12);
      g.mat('mosaic', pal.acc2); L.box(SW - 0.12, 1.9, Q1 + 0.12, SW - 0.1, 1.98, Q2 - 0.1);
    });
    L.prop('baths.bucket', SW - 1.3, 0, Q1 + 2.7, 0.4, { dipper: true, wood: '#946a3e' });
    // the steam box against the partition
    s.furniture(() => { g.mat('cast', BRASS); L.box(SW - 1.0, 0, Q1 + 1.45, SW - 0.1, 0.55, Q1 + 2.35, { bevel: 0.02 }); g.mat('grille', '#6a5a3a'); L.box(SW - 0.95, 0.55, Q1 + 1.5, SW - 0.15, 0.56, Q1 + 2.3, { faces: 'Y' }); });
    L.solid(SW - 1.0, 0, Q1 + 1.45, SW - 0.1, 0.56, Q1 + 2.35);
    // the glazed front onto the aisle, with an open doorway hung with a felt strip curtain
    const gp0 = 0.35, gp1 = SW - 0.25, dp0 = SW - 1.55, dp1 = SW - 0.6;
    s.structure(() => {
      g.mat('wood', pal.wood);
      const posts = [gp0, dp0, dp1, gp1]; for (let p = gp0 + 1.2; p < dp0 - 0.4; p += 1.2) posts.push(p);
      for (const p of posts) L.box(p - 0.05, 0, Q2 - 0.06, p + 0.05, 2.4, Q2 + 0.06, { bevel: 0.01 });
      L.box(gp0, 2.3, Q2 - 0.06, gp1, 2.4, Q2 + 0.06, { bevel: 0.01 }); L.box(gp0, 0, Q2 - 0.06, dp0, 0.5, Q2 + 0.06, { bevel: 0.01 }); L.box(dp1, 0, Q2 - 0.06, gp1, 0.5, Q2 + 0.06, { bevel: 0.01 });
      g.mat('tile', pal.dadoD); L.box(0.2, 2.4, Q2 - 0.08, SW - 0.1, 2.62, Q2 + 0.08);
    });
    L.glass(gp0 + 0.05, 0.5, Q2, dp0 - 0.05, 2.3, Q2, { tint: '#f4e8d8', opacity: 0.4, rough: 0.35 });
    L.glass(dp1 + 0.05, 0.5, Q2, gp1 - 0.05, 2.3, Q2, { tint: '#f4e8d8', opacity: 0.4, rough: 0.35 });
    L.solid(gp0, 0, Q2 - 0.08, dp0, 2.4, Q2 + 0.08); L.solid(dp1, 0, Q2 - 0.08, gp1, 2.4, Q2 + 0.08);
    s.deco(() => { for (let k = 0; k < 6; k++) { g.mat('felt', k % 2 ? pal.acc : pal.deep); const pa = dp0 + 0.03 + k * 0.155; L.sheet([pa, 2.28, Q2 - 0.1], [pa + 0.14, 2.28, Q2 - 0.1], [pa + 0.14, 1.0, Q2 - 0.12], [pa, 1.0, Q2 - 0.12], { nu: 1, nv: 3, ripple: 0.01 }); } });
    L.lamp('bulb', SW * 0.5, 2.2, (Q1 + Q2) / 2, { clip: clipSteam, K: 2300, power: 0.55, range: 6 });
    s.deco(() => { g.mat('diffuser', '#ffcf9a', { emissive: 2.2, lamp: true }); L.ball(SW * 0.5, 2.5, (Q1 + Q2) / 2, 0.12, 0.08, 0.12, { segs: 10, rings: 5 }); });
    for (const st of [[SW - 0.55, 1.0, Q1 + 1.9, 1.6, 0.07], [SW - 1.2, 1.7, Q1 + 2.4, 2.0, 0.04], [1.6, 2.0, Q1 + 1.3, 2.4, 0.035], [SW * 0.5, 2.2, Q1 + 3.4, 2.4, 0.03], [1.2, 1.8, Q2 - 1.2, 2.0, 0.03], [SW * 0.4, 1.2, Q1 + 2.8, 2.6, 0.05], [SW * 0.7, 1.4, Q2 - 1.6, 2.4, 0.045]]) {
      L.glow(st[0], st[1], st[2], [0, 1], { color: '#fff0de', size: st[3], strength: st[4], follow: 'lamps' });
      L.glow(st[0], st[1], st[2], [1, 0], { color: '#fff0de', size: st[3] * 0.9, strength: st[4] * 0.8, follow: 'lamps' });
    }
    L.glowBox(0, 0, Q1, SW, 2.6, Q2, { sky: '#ffcf9a', ground: pal.dadoD, power: 0.22 });
  }
  await T();

  if (done.lap) done.lap('steam');
  // =============================================================================================================
  // the washing hall: taps on the long wall in bays, stools and buckets, plinths of stacked buckets, robes on the far wall
  // =============================================================================================================
  {
    const ops = [[robeDoor - 0.5, robeDoor + 2.0], [cx - 2.1, cx + 2.1], [restDoor - 0.5, restDoor + 1.9]];
    const free = (p) => p > SW + 0.6 && p < W - 0.6 && ops.every((o2) => p < o2[0] || p > o2[1]);
    let k = 0;
    for (let p = SW + 0.9; p < W - 0.6; p += 2.3) {
      if (!free(p)) continue;
      L.prop('baths.tap', p, 0, Q1 + 0.08, 0, { tile: pal.cream });
      L.prop('baths.stool', p, 0, Q1 + 0.7, Math.PI, { wood: ['#9a7448', '#b08d5e', '#8a6240'][k % 3] }, { spot: { tags: ['wash', 'baths'] } });
      if (k % 3 === 0) L.prop('baths.bucket', p + 0.38, 0, Q1 + 0.58, 0, { dipper: k % 4 === 0, wood: ['#a77e4c', '#b9925a', '#946a3e'][k % 3] });
      k++; if (k % 3 === 0) await T();
    }
    const plin = []; for (let p = SW + 3.5; p < W - 2.5; p += 8.5) if (Math.abs(p - cx) > 3.6) plin.push(p);
    const pq = Q1 + 2.9;
    for (const pc of plin) {
      s.furniture(() => { g.mat('tile', pal.dadoD); L.box(pc - 1.4, 0, pq - 0.5, pc + 1.4, 0.42, pq + 0.5, { bevel: 0.02, aoBottom: 0.6 }); g.mat('tile', pal.cream); L.box(pc - 1.45, 0.42, pq - 0.55, pc + 1.45, 0.47, pq + 0.55, { bevel: 0.015 }); });
      L.solid(pc - 1.45, 0, pq - 0.55, pc + 1.45, 0.47, pq + 0.55);
      for (const st of [[-0.9, 0], [-0.62, 0], [-0.76, 0.2]]) L.prop('baths.bucket', pc + st[0], 0.47 + st[1], pq, 0, { wood: '#a77e4c' }, { noCollide: true });
      s.detail(() => { const cl = [pal.cream, pal.dado, pal.acc, pal.cream]; for (let i = 0; i < 4; i++) { g.mat('knit', cl[i]); L.box(pc + 0.8, 0.47 + i * 0.05, pq - 0.25, pc + 1.2, 0.52 + i * 0.05, pq + 0.2, { bevel: 0.02 }); } });
      L.spot('sit', pc, 0.47, pq + 0.6, 0, { tags: ['wash', 'baths'] }); L.spot('sit', pc - 0.3, 0.47, pq - 0.6, Math.PI, { tags: ['wash', 'baths'] });
    }
    await T();
    // robes on warm rails and towel shelves along the far wall, between its openings
    const farOps = [[0, SW + 0.1], [cx - 2.0, cx + 2.0], [aDoorB - 0.3, aDoorB + 1.9]]; if (aDoorA !== null) farOps.push([aDoorA - 0.3, aDoorA + 1.9]);
    let rk = 0;
    for (let p = SW + 1.6; p + 1.4 < W - 0.4; p += 4.6) {
      if (!farOps.every((o2) => p + 1.4 < o2[0] || p - 1.4 > o2[1])) continue;
      if (rk % 3 === 2) L.prop('baths.towels', p, 0, Q2 - 0.3, Math.PI, { w: 1.4, h: 1.6, shelves: 3, seed: (seed + rk) % 9 });
      else L.prop('baths.robes', p, 0, Q2 - 0.08, Math.PI, { w: 2.6, n: 6, seed: (seed + rk) % 3, y: 1.7 });
      rk++;
    }
    s.structure(() => {
      g.mat('grille', BRASS); L.box(SW + 0.5, 0.0, Q1 + 1.55, W - 0.5, 0.006, Q1 + 1.75, { faces: 'Y' });
      g.mat('tile', pal.acc); for (const seg of [[SW + 0.1, robeDoor], [robeDoor + 1.5, cx - 1.7], [cx + 1.7, restDoor], [restDoor + 1.4, W - 0.1]]) if (seg[1] > seg[0] + 0.1) L.box(seg[0], 1.5, Q1 + 0.08, seg[1], 1.58, Q1 + 0.1);
    });
    s.deco(() => { g.mat('felt', '#e8dcc4'); L.tube([[SW + 0.3, 3.05, Q2 - 0.3], [W - 0.3, 3.05, Q2 - 0.3]], 0.07, { segs: 10 }); g.mat('cast', '#c08a5a'); L.tube([[SW + 0.3, 3.12, Q1 + 0.3], [W - 0.3, 3.12, Q1 + 0.3]], 0.035, { segs: 8 }); });
    const nl = W - SW > 38 ? 3 : 2;
    for (let i = 0; i < nl; i++) L.lamp('globe', SW + (W - SW) * (i + 0.5) / nl, 2.55, (Q1 + Q2) / 2, { r: 0.18, drop: 0.7, clip: clipWash, K: 3000, power: 1.1, range: 9 });
    L.prop('baths.fernpot', SW + 0.5, 0, Q2 - 0.5, 0, { pot: pal.acc, size: 1.0 });
    L.prop('baths.fernpot', W - 0.5, 0, Q1 + 0.5, 0, { pot: pal.dado, size: 1.0 });
    L.spot('work', cx + 4.0, 0, Q1 + 2.0, Math.PI / 2, { tags: ['sweep', 'baths'] });
    L.glowBox(SW, 0, Q1, W, 3.3, Q2, { sky: '#ffe2bc', ground: pal.hex, power: 0.28 });
  }
  await T();

  if (done.lap) done.lap('wash');
  // =============================================================================================================
  // the pool hall: arcades, the vault, the mural
  // =============================================================================================================
  const n = Math.max(3, Math.floor((DH - 0.6) / 4.0)), start = (DH - (n * 4.0 - 0.6)) / 2;
  const arches = []; for (let k = 0; k < n; k++) arches.push({ at: start + 4.0 * k, w: 3.4, h: 3.0 });
  const piers = []; for (let k = 1; k < n; k++) piers.push(Q2 + start + 4.0 * k - 0.3);
  for (const pA of [A0, A1]) {
    L.wallQ(pA, Q2 + 0.08, D - 0.08, 0, SPR, { mat: 'tile', tint: pal.cream, dado: { h: 1.4, mat: 'tile', tint: pal.dado }, skirt: pal.dadoD, openings: arches, cap: true });
    for (const a of arches) { const c = L.P(pA, Q2 + 0.08 + a.at + 1.7); smoothArch(s, c[0], 0, c[1], 3.4, 3.0, L.axis(0, 1).toLowerCase(), { tint: '#e2d5b8', depth: 0.3, rise: 1.0, f: 0.14, line: pal.acc, key: pal.dadoD }); }
    await T();
  }
  const arc = arcOf(A0 + 0.08, A1 - 0.08, SPR, CROWN);
  vault(L, arc, A0 + 0.08, A1 - 0.08, Q2 + 0.08, D - 0.16, piers, pal);
  await T();
  // a frieze above the aisle roofs, the cornice, the lunette of frosted glass over the arch (a lamp, not a window)
  s.structure(() => {
    for (const side of [[A0 + 0.08, 1], [A1 - 0.08, -1]]) {
      const p = side[0], d = side[1];
      g.mat('mosaic', pal.dado); L.box(Math.min(p, p + d * 0.012), 3.5, Q2 + 0.1, Math.max(p, p + d * 0.012), 4.1, D - 0.1);
      g.mat('mosaic', pal.acc); L.box(Math.min(p, p + d * 0.02), 3.58, Q2 + 0.1, Math.max(p, p + d * 0.02), 3.66, D - 0.1); L.box(Math.min(p, p + d * 0.02), 3.94, Q2 + 0.1, Math.max(p, p + d * 0.02), 4.02, D - 0.1);
      g.mat('wood', pal.wood); L.box(Math.min(p, p + d * 0.22), SPR - 0.14, Q2 + 0.08, Math.max(p, p + d * 0.22), SPR + 0.04, D - 0.08, { bevel: 0.015 });
    }
  });
  s.structure(() => {
    const cy = 3.4, R0 = 0.5, R1 = Math.min(2.2, (arc.cy + arc.R) - 3.6), nf = 7;
    for (let i = 0; i < nf; i++) {
      const t0 = Math.PI * i / nf + 0.02, t1 = Math.PI * (i + 1) / nf - 0.02;
      const P2 = (t, rr) => [cx - Math.cos(t) * rr, cy + Math.sin(t) * rr, Q2 + 0.1];
      g.mat('diffuser', i % 2 ? '#f6dfb4' : '#f2d4a0', { emissive: 1.5, lamp: true });
      L.quad(P2(t1, R0), P2(t0, R0), P2(t0, R1), P2(t1, R1), { double: true });
    }
    g.mat('mosaic', pal.acc);
    for (let i = 0; i < 14; i++) { const t0 = Math.PI * i / 14, t1 = Math.PI * (i + 1) / 14; const P2 = (t, rr) => [cx - Math.cos(t) * rr, cy + Math.sin(t) * rr, Q2 + 0.11]; L.quad(P2(t1, R1 + 0.06), P2(t0, R1 + 0.06), P2(t0, R1 + 0.26), P2(t1, R1 + 0.26), { double: true }); }
  });
  const muralKind = (seed >>> 3) % 3;
  await mural(L, A0 + 0.1, A1 - 0.1, 0.95, D - 0.16, (p) => arc.y(p) - 0.04, muralKind, pal, seed, T);
  s.structure(() => { g.mat('tile', pal.cream); L.box(A0 + 0.08, 0.86, D - 0.2, A1 - 0.08, 0.95, D - 0.16, { bevel: 0.01 }); });
  await T();

  if (done.lap) done.lap('vault+mural');
  // =============================================================================================================
  // the pools, and the floor cut round them
  // =============================================================================================================
  const hw = Math.min(NW / 2 - 2.4, 6), HL = clamp(DH * 0.34, 5.5, 7.5), hp0 = cx - hw, hp1 = cx + hw, hq0 = Q2 + 3.0, hq1 = hq0 + HL;
  const ww = Math.min(NW / 2 - 1.6, 8), WL = clamp(DH - HL - 3.0 - 4.2 - 1.5, 2.6, 4.2), wp0 = cx - ww, wp1 = cx + ww, wq1 = D - 1.5, wq0 = wq1 - WL;
  const pc = A1 + AW / 2, pq0 = Q2 + 3.4, pq1 = pq0 + 3.0, pp0 = pc - 1.5, pp1 = pc + 1.5;
  // a wide lot's near aisle gets a shallow pool of its own (the children's pool on the Low decks)
  const wide = AW >= 12, sp0 = 2.8, sp1 = A0 - 3.4, sq0 = Q2 + DH * 0.28, sq1 = Math.min(D - 2.4, sq0 + 8);
  const holeN = [L.B(hp0, hq0, hp1, hq1), L.B(wp0, wq0, wp1, wq1)], holeB = [L.B(pp0, pq0, pp1, pq1)], holeA = wide ? [L.B(sp0, sq0, sp1, sq1)] : [];
  { const b = L.B(A0, Q2, A1, D); for (const rr of cutRects(b[0], b[1], b[2], b[3], holeN)) floor(s, rr[0], rr[1], rr[2], rr[3], 0, 'tile', pal.floor); }
  { const b = L.B(0, Q2, A0, D); for (const rr of cutRects(b[0], b[1], b[2], b[3], holeA)) floor(s, rr[0], rr[1], rr[2], rr[3], 0, 'hex', pal.hex); }
  { const b = L.B(A1, Q2, W, D); for (const rr of cutRects(b[0], b[1], b[2], b[3], holeB)) floor(s, rr[0], rr[1], rr[2], rr[3], 0, 'hex', pal.hex); }
  // a border of tile round the nave floor
  s.structure(() => {
    g.mat('tile', pal.dadoD); L.box(A0 + 0.2, 0, Q2 + 0.9, A1 - 0.2, 0.004, Q2 + 1.2, { faces: 'Y' }); L.box(A0 + 0.2, 0, D - 0.6, A1 - 0.2, 0.004, D - 0.3, { faces: 'Y' });
    g.mat('tile', pal.acc); L.box(A0 + 0.2, 0, Q2 + 1.2, A1 - 0.2, 0.004, Q2 + 1.28, { faces: 'Y' });
  });
  await T();
  const PF = (p0, q0, p1, q1, water, bottom, tile) => { const b = L.B(p0, q0, p1, q1); return { x0: b[0], z0: b[1], x1: b[2], z1: b[3], water, bottom, tile }; };
  const ledge = (p0, q0, p1, q1, top) => { const b = L.B(p0, q0, p1, q1); return [b[0], b[1], b[2], b[3], top]; };
  const handrail = (p, q, dpp, dqq) => {
    s.detail(() => { g.mat('cast', BRASS, { rough: -0.25 }); L.tube([[p, 0, q], [p, 0.9, q], [p + dpp * 0.25, 0.95, q + dqq * 0.25], [p + dpp * 0.7, 0.6, q + dqq * 0.7], [p + dpp * 0.95, -0.1, q + dqq * 0.95]], 0.022, { segs: 8 }); L.cyl(p, 0, q, 0.05, 0.025, { segs: 10 }); });
    const c = L.P(p, q); s.post(c[0], c[1], 0.04, 0, 0.95);
  };
  // the hot pool: stepped ledges along both long sides to sit on, stairs at both ends
  {
    const band = []; for (let k = 0; k < 4; k++) { const top = -0.28 * (k + 1); band.push(ledge(hp0, hq0 + 0.3 * k, hp1, hq0 + 0.3 * (k + 1), top)); band.push(ledge(hp0, hq1 - 0.3 * (k + 1), hp1, hq1 - 0.3 * k, top)); }
    pool(s, PF(hp0, hq0, hp1, hq1, -0.2, -1.4, pal.pool), { ledges: band, line: pal.acc, water: pal.water });
    const qm = (hq0 + hq1) / 2;
    L.stairs(hp0 + 2.0, -1.4, qm, [-1, 0], 1.4, 2.0, 1.6, { mat: 'tile', tint: pal.pool, nosing: pal.acc });
    L.stairs(hp1 - 2.0, -1.4, qm, [1, 0], 1.4, 2.0, 1.6, { mat: 'tile', tint: pal.pool, nosing: pal.acc });
    for (const sq of [qm - 1.0, qm + 1.0]) { handrail(hp0 - 0.25, sq, 1, 0); handrail(hp1 + 0.25, sq, -1, 0); }
    // the spout: a tiled pillar at the far side, a brass spout pouring in from the loop
    s.furniture(() => {
      g.mat('tile', pal.dadoD); L.box(cx - 0.3, 0, hq1 + 0.5, cx + 0.3, 0.12, hq1 + 1.1, { bevel: 0.02 });
      g.mat('tile', pal.acc); L.lathe(cx, hq1 + 0.8, [[0.2, 0.12], [0.16, 0.2], [0.13, 0.75], [0.17, 0.85], [0.2, 0.9]], { segs: 14 });
      g.mat('cast', BRASS, { rough: -0.2 }); L.lathe(cx, hq1 + 0.8, [[0.0, 0.9], [0.22, 0.9], [0.3, 0.98], [0.32, 1.06], [0.28, 1.06], [0.2, 0.97], [0, 0.96]], { segs: 18, capTop: false });
      g.mat('glaze', '#cfe8e2', { rough: -0.45 }); L.cyl(cx, 1.0, hq1 + 0.8, 0.27, 0.01, { segs: 16 });
      g.mat('cast', BRASS, { rough: -0.25 }); L.tube([[cx, 1.0, hq1 + 0.6], [cx, 1.0, hq1 + 0.2], [cx, 0.88, hq1 - 0.12]], [0.045, 0.04, 0.05], { segs: 10 });
      g.mat('glaze', '#cfe8e2', { rough: -0.45 }); L.tube([[cx, 0.86, hq1 - 0.14], [cx, 0.45, hq1 - 0.22], [cx, -0.19, hq1 - 0.27]], [0.032, 0.028, 0.045], { segs: 8, caps: false });
    });
    { const c = L.P(cx, hq1 + 0.8); s.post(c[0], c[1], 0.3, 0, 1.06); }
  }
  await T();
  // the warm pool under the mural: a ledge on both long sides, steps at one end
  pool(s, PF(wp0, wq0, wp1, wq1, -0.18, -0.8, mixHex(pal.pool, '#ffffff', 0.15)), { ledges: [ledge(wp0, wq0, wp1, wq0 + 0.45, -0.42), ledge(wp0, wq1 - 0.45, wp1, wq1, -0.42)], line: pal.acc2, water: mixHex(pal.water, '#7fc4c0', 0.3) });
  L.stairs(wp0 + 1.2, -0.8, (wq0 + wq1) / 2, [-1, 0], 0.8, 1.2, 1.2, { mat: 'tile', tint: pal.pool, nosing: pal.acc2 });
  handrail(wp0 - 0.25, (wq0 + wq1) / 2 - 0.75, 1, 0);
  if (wide) {
    pool(s, PF(sp0, sq0, sp1, sq1, -0.15, -0.6, mixHex(pal.pool, '#ffffff', 0.25)), { ledges: [ledge(sp0, sq0, sp0 + 0.45, sq1, -0.36), ledge(sp1 - 0.45, sq0, sp1, sq1, -0.36)], line: pal.acc, water: mixHex(pal.water, '#8fd0c8', 0.4) });
    L.stairs((sp0 + sp1) / 2, -0.6, sq0 + 1.0, [0, -1], 0.6, 1.0, 1.4, { mat: 'tile', tint: pal.pool, nosing: pal.acc });
    handrail((sp0 + sp1) / 2 - 0.85, sq0 - 0.25, 0, 1);
  }
  // the cold plunge in the far aisle, with its shower on the wall
  pool(s, PF(pp0, pq0, pp1, pq1, -0.2, -1.4, '#a9d4dc'), { ledges: [ledge(pp0, pq1 - 0.4, pp1, pq1, -0.5)], line: '#33407a', water: '#3f8aa6' });
  L.stairs(pc, -1.4, pq0 + 1.6, [0, -1], 1.4, 1.6, 1.2, { mat: 'tile', tint: '#a9d4dc', nosing: '#33407a' });
  handrail(pc - 0.75, pq0 - 0.25, 0, 1);
  s.furniture(() => {
    const sq = pq1 + 1.4;
    g.mat('cast', BRASS, { rough: -0.2 }); L.tube([[W - 0.18, 0.2, sq], [W - 0.18, 2.35, sq], [W - 0.6, 2.42, sq]], 0.022, { segs: 8 });
    L.lathe(W - 0.65, sq, [[0.02, 2.42], [0.1, 2.36], [0.13, 2.33], [0.0, 2.33]], { segs: 16 });
    g.mat('cast', '#7a6a4a'); L.tube([[W - 0.67, 2.33, sq + 0.05], [W - 0.67, 1.55, sq + 0.05]], 0.004, { segs: 4 });
    g.mat('grille', BRASS); L.box(W - 1.15, 0.0, sq - 0.5, W - 0.2, 0.006, sq + 0.5, { faces: 'Y' });
  });
  // steam over the hot water
  const steam = (p, y, q, size, k) => { L.glow(p, y, q, [0, 1], { color: '#fff1dc', size, strength: 0.045 * k, follow: 'lamps' }); L.glow(p, y + 0.1, q, [1, 0], { color: '#fff1dc', size: size * 0.85, strength: 0.04 * k, follow: 'lamps' }); };
  steam(cx - hw * 0.5, 0.35, hq0 + HL * 0.4, 3.0, 1); steam(cx + hw * 0.45, 0.45, hq0 + HL * 0.6, 2.8, 1); steam(cx, 0.7, hq0 + HL * 0.5, 3.4, 0.8);
  if (wide) steam((sp0 + sp1) / 2, 0.3, (sq0 + sq1) / 2, 2.6, 0.5);
  steam(cx - ww * 0.4, 0.3, (wq0 + wq1) / 2, 2.4, 0.6); steam(cx + ww * 0.4, 0.35, (wq0 + wq1) / 2, 2.4, 0.6);
  await T();

  if (done.lap) done.lap('pools');
  // =============================================================================================================
  // the pool hall's furniture: the loop's pipes and gauge, benches, loungers, ferns, robes; light
  // =============================================================================================================
  {
    const PX = 0.4, pipeY = [1.05, 1.42], qa0 = Q2 + 0.2, qa1 = D - 0.2, nseg = Math.ceil((qa1 - qa0) / 6);
    for (let k = 0; k < nseg; k++) {
      const za = qa0 + (qa1 - qa0) * k / nseg, zb = qa0 + (qa1 - qa0) * (k + 1) / nseg;
      s.furniture(() => {
        g.mat('felt', '#efe4cc'); for (const y of pipeY) L.tube([[PX, y, za], [PX, y, zb]], 0.1, { segs: 12, caps: false });
        g.mat('cast', BRASS, { rough: -0.2 }); for (let q = za + 0.6; q < zb; q += 1.6) for (const y of pipeY) L.tube([[PX, y, q - 0.03], [PX, y, q + 0.03]], 0.108, { segs: 12 });
        g.mat('tile', pal.acc); for (let q = za + 1.4; q < zb; q += 1.6) L.tube([[PX, pipeY[1], q - 0.08], [PX, pipeY[1], q + 0.08]], 0.104, { segs: 12, caps: false });
        g.mat('tile', pal.dadoD); for (let q = za + 1.4; q < zb; q += 1.6) L.tube([[PX, pipeY[0], q - 0.08], [PX, pipeY[0], q + 0.08]], 0.104, { segs: 12, caps: false });
        g.mat('cast', '#2a2622'); for (let q = za + 0.3; q < zb; q += 1.6) { L.box(0.16, 0.9, q - 0.03, 0.5, 0.95, q + 0.03); L.box(0.16, 1.27, q - 0.03, 0.5, 1.32, q + 0.03); }
      });
    }
    L.solid(0.16, 0.9, qa0, 0.55, 1.55, qa1);
    await T();
    // the gauge: a brass case, a cream dial, the needle at sixty-five
    const gq = Q2 + 1.6, gy = 1.85;
    s.detail(() => {
      g.mat('cast', BRASS); L.tube([[PX, pipeY[1] + 0.1, gq], [PX, gy - 0.16, gq]], 0.014, { segs: 6 });
      g.mat('cast', BRASS, { rough: -0.2 }); L.box(0.16, gy - 0.16, gq - 0.16, 0.24, gy + 0.16, gq + 0.16, { bevel: 0.05 });
      g.mat('paint', '#f3ead6'); L.box(0.24, gy - 0.135, gq - 0.135, 0.245, gy + 0.135, gq + 0.135, { bevel: 0.002 });
      g.mat('paint', '#2a2622'); for (let i = 0; i <= 10; i++) { const a = -2.2 + i * 0.44; L.box(0.245, gy + Math.cos(a) * 0.11 - 0.004, gq + Math.sin(a) * 0.11 - 0.004, 0.25, gy + Math.cos(a) * 0.11 + 0.004, gq + Math.sin(a) * 0.11 + 0.004); }
      const an = -2.2 + 6.5 * 0.44; L.tube([[0.252, gy, gq], [0.252, gy + Math.cos(an) * 0.1, gq + Math.sin(an) * 0.1]], 0.004, { segs: 4 });
      g.mat('paint', '#c9452e'); const ar = -2.2 + 7 * 0.44; L.box(0.247, gy + Math.cos(ar) * 0.12 - 0.007, gq + Math.sin(ar) * 0.12 - 0.007, 0.252, gy + Math.cos(ar) * 0.12 + 0.007, gq + Math.sin(ar) * 0.12 + 0.007);
    });
    // warm benches under the pipes, sitting with your back to the loop
    for (let qs = Q2 + 3.0; qs + 3.5 < D - 0.5; qs += 5.5) {
      const qe = qs + 3.5;
      s.furniture(() => { g.mat('wood', '#9a7448', { rough: -0.05 }); for (let k = 0; k < 4; k++) L.box(0.6 + k * 0.11, 0.42, qs, 0.69 + k * 0.11, 0.46, qe, { bevel: 0.006 }); g.mat('tile', pal.dadoD); for (const q of [qs + 0.2, (qs + qe) / 2, qe - 0.2]) L.box(0.16, 0, q - 0.06, 1.0, 0.42, q + 0.06, { bevel: 0.01 }); });
      L.solid(0.16, 0, qs, 1.02, 0.46, qe);
      for (let q = qs + 0.4; q < qe - 0.2; q += 0.75) L.spot('sit', 0.85, 0.46, q, Math.PI / 2, { tags: ['baths', 'pipes'] });
    }
    await T();
    await T();
    // tiled benches along the nave walls between the arches, facing the pools
    for (const pA of [A0 + 0.5, A1 - 0.5]) {
      const dir = pA < cx ? Math.PI / 2 : -Math.PI / 2;
      for (const qp of piers) {
        s.furniture(() => { g.mat('tile', pal.dado); L.box(pA - 0.28, 0, qp - 0.5, pA + 0.28, 0.42, qp + 0.5, { aoBottom: 0.6 }); g.mat('tile', pal.cream); L.box(pA - 0.31, 0.42, qp - 0.54, pA + 0.31, 0.47, qp + 0.54, { bevel: 0.015 }); });
        L.solid(pA - 0.31, 0, qp - 0.54, pA + 0.31, 0.47, qp + 0.54);
        L.spot('sit', pA, 0.47, qp - 0.25, dir, { tags: ['baths'] }); L.spot('sit', pA, 0.47, qp + 0.25, dir, { tags: ['baths'] });
      }
    }
    // loungers along the far aisle's wall behind the plunge, heads to the wall; towels by the plunge
    const tw = [pal.cream, pal.dado, pal.acc, pal.acc2];
    let li = 0;
    for (let q = pq1 + 3.0; q < D - 0.9 && li < 5; q += 1.45) { L.prop('baths.lounger', W - 1.25, 0, q, Math.PI / 2, { wood: ['#9a7448', '#b08d5e', '#8a6240'][li % 3], towel: tw[li % 3] }, { spot: { tags: ['rest', 'baths'] } }); li++; }
    if (wide) {
      // the warm slab: a tiled bench the loop runs under, for lying on after the plunge
      const sp = A1 + AW * 0.5, sqc = Q2 + DH * 0.45;
      s.furniture(() => {
        g.mat('tile', pal.dadoD); L.box(sp - 0.7, 0, sqc - 1.6, sp + 0.7, 0.4, sqc + 1.6, { bevel: 0.02, aoBottom: 0.6 });
        g.mat('terrazzo', pal.cream); L.box(sp - 0.75, 0.4, sqc - 1.65, sp + 0.75, 0.46, sqc + 1.65, { bevel: 0.02 });
        g.mat('tile', pal.acc); L.box(sp - 0.71, 0.3, sqc - 1.61, sp + 0.71, 0.35, sqc + 1.61);
      });
      s.structure(() => { g.mat('mosaic', pal.acc2); L.box(sp - 1.3, 0.001, sqc - 2.2, sp + 1.3, 0.005, sqc + 2.2, { faces: 'Y' }); g.mat('mosaic', pal.dado); L.box(sp - 1.15, 0.005, sqc - 2.05, sp + 1.15, 0.008, sqc + 2.05, { faces: 'Y' }); });
      L.solid(sp - 0.75, 0, sqc - 1.65, sp + 0.75, 0.46, sqc + 1.65);
      for (const dq2 of [-1.0, 0.0, 1.0]) for (const ds of [-1, 1]) L.spot('sit', sp + ds * 0.45, 0.46, sqc + dq2, ds > 0 ? Math.PI / 2 : -Math.PI / 2, { tags: ['baths', 'slab'] });
      const tp = A1 + AW * 0.42;
      for (const tq of [Q2 + DH * 0.6, Q2 + DH * 0.86]) {
        L.prop('table', tp, 0, tq, 0, { w: 0.8, round: true, h: 0.7, wood: '#5a3d28', top: '#8a6240' });
        for (let c = 0; c < 3; c++) { const a = c * 2.094 + 0.5, cp = tp + Math.sin(a) * 0.72, cq = tq + Math.cos(a) * 0.72; L.prop('chair', cp, 0, cq, a + Math.PI, { wood: ['#5a3a26', '#7a5233', '#6b4a2f'][c], seat: pal.acc2 }); }
        for (const c of [[-0.15, 0.1], [0.18, -0.05], [0.0, -0.2]]) L.prop('cup', tp + c[0], 0.7, tq + c[1], 0, { glaze: pal.cream, lid: pal.acc });
      }
    }
    L.prop('baths.towels', A1 + 0.5, 0, pq0 - 0.9, Math.PI / 2, { w: 1.4, h: 1.5, shelves: 3, seed: seed % 11 });
    await T();
    // ferns by the piers and in the corners, slippers at the pools' edges, lidded cups left on the coping
    const pots = [[A0 - 0.7, Q2 + 0.6, pal.acc, 1.1], [A1 + 0.7, Q2 + 0.6, pal.dado, 1.0], [A0 + 0.7, D - 0.7, pal.acc2, 1.2], [A1 - 0.7, D - 0.7, pal.acc, 1.2], [1.0, D - 0.7, pal.dado, 1.3], [W - 0.7, Q2 + 0.7, pal.acc2, 1.0]];
    for (const pp of pots) L.prop('baths.fernpot', pp[0], 0, pp[1], r.f(0, 3), { pot: pp[2], size: pp[3] });
    const strap = [pal.dado, pal.acc, '#33407a', pal.acc2];
    for (let i = 0; i < 6; i++) L.prop('baths.slippers', hp0 + 0.8 + i * (hp1 - hp0 - 1.6) / 5, 0, hq0 - 0.55 - (i % 2) * 0.1, Math.PI + (i % 3 - 1) * 0.35, { c: '#c9a46a', strap: strap[i % 4] });
    for (const c of [[hp0 + 1.4, hq1 + 0.2], [hp1 - 2.2, hq0 - 0.2], [wp1 - 1.0, wq0 - 0.2], [pp1 - 0.4, pq0 - 0.2]]) L.prop('cup', c[0], 0.016, c[1], 0, { glaze: pal.cream, lid: pal.dado });
    L.prop('baths.bucket', A0 - 0.6, 0, Q2 + 2.2, 0.3, { dipper: true });
    await T();
    // lamps: two big globes over the hot pool, a strip along the crown, a wash on the mural, one lamp in each aisle, the plunge's cool globe
    for (const qq of [hq0 + HL * 0.25, hq0 + HL * 0.75]) L.lamp('globe', cx, 4.8, qq, { r: 0.4, drop: arc.cy + arc.R - 0.15 - 4.8, clip: clipHall, K: 2750, power: 3.0, range: 14 });
    s.deco(() => { g.mat('cast', BRASS); L.box(cx - 0.08, arc.cy + arc.R - 0.24, Q2 + 0.6, cx + 0.08, arc.cy + arc.R - 0.16, D - 0.6); });
    L.lamp('strip', cx, arc.cy + arc.R - 0.25, Q2 + 0.8, { to: [cx, arc.cy + arc.R - 0.25, D - 0.8], clip: clipHall, K: 3300, power: 1.1, range: 7 });
    L.light({ at: [A0 + 1.8, 3.6, D - 0.6], to: [A1 - 1.8, 3.6, D - 0.6], type: 'tube', color: '#ffd890', power: 1.5, range: 4.5, clip: clipHall, lamp: true, radius: 0.15 });
    if (wide) L.lamp('globe', A0 * 0.5, 2.6, Q2 + DH * 0.2, { r: 0.2, drop: 0.6, clip: L.clip(0, -0.8, Q2, A0 + 0.5, 3.4, D), K: 2700, power: 1.1, range: 9 });
    // the aisles' ceilings: beams across, a lagged return pipe and a cold main on hangers, fern baskets
    for (const xx of [[0, A0], [A1, W]]) {
      s.deco(() => {
        g.mat('wood', pal.wood); for (let q = Q2 + 1.2; q < D - 0.4; q += 2.6) L.box(xx[0] + 0.1, 3.08, q - 0.09, xx[1] - 0.1, 3.3, q + 0.09, { bevel: 0.012 });
        const pp = xx[0] < 1 ? A0 - 0.7 : A1 + 0.7;
        g.mat('felt', '#e8dcc4'); L.tube([[pp, 2.92, Q2 + 0.1], [pp, 2.92, D - 0.1]], 0.07, { segs: 10, caps: false });
        g.mat('cast', '#3f6f8a'); L.tube([[pp + (xx[0] < 1 ? -0.28 : 0.28), 2.98, Q2 + 0.1], [pp + (xx[0] < 1 ? -0.28 : 0.28), 2.98, D - 0.1]], 0.04, { segs: 8, caps: false });
        g.mat('cast', BRASS); for (let q = Q2 + 1.2; q < D - 0.5; q += 2.6) L.tube([[pp, 2.92, q - 0.025], [pp, 2.92, q + 0.025]], 0.076, { segs: 10 });
      });
      for (const q of [Q2 + DH * 0.33, Q2 + DH * 0.78]) {
        const bp = (xx[0] + xx[1]) / 2 + (xx[0] < 1 ? -1.5 : 1.5);
        s.detail(() => {
          g.mat('cast', '#3a3028'); for (let k = 0; k < 3; k++) { const a = k * 2.094; L.tube([[bp, 3.08, q], [bp + Math.cos(a) * 0.17, 2.42, q + Math.sin(a) * 0.17]], 0.004, { segs: 3 }); }
          g.mat('cane', '#b08d5e'); L.lathe(bp, q, [[0, 2.24], [0.12, 2.25], [0.19, 2.32], [0.2, 2.42], [0.18, 2.42], [0.0, 2.3]], { segs: 12, capTop: false });
          g.mat('fern', '#ffffff', { sway: 0.5 }); for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, c = L.P(bp + Math.cos(a) * 0.08, q + Math.sin(a) * 0.08); g.card(c[0], 2.4, c[1], 0.3, 0.55, a + Math.PI / 2, { tilt: 0.95 }); }
        });
      }
    }
    L.lamp('globe', A0 * 0.5, 2.6, Q2 + DH * 0.55, { r: 0.2, drop: 0.6, clip: L.clip(0, -0.3, Q2, A0 + 0.5, 3.4, D), K: 2800, power: 1.3, range: 10 });
    L.lamp('globe', pc, 2.5, (pq0 + pq1) / 2, { r: 0.16, drop: 0.7, clip: L.clip(A1 - 0.5, -1.6, Q2, W, 3.4, D), K: 4000, power: 1.0, range: 8 });
    L.lamp('lantern', pc, 2.4, Math.min(D - 2, pq1 + 6), { tint: pal.acc2, drop: 0.75, r: 0.24, hh: 0.36, clip: L.clip(A1 - 0.5, -0.3, Q2, W, 3.4, D), K: 2500, power: 0.8 });
    L.glowBox(0, -1.4, Q2, W, 3.3, D, { sky: '#ffd9a8', ground: pal.pool, power: 0.28 });
    L.glowBox(A0, SPR - 1, Q2, A1, arc.cy + arc.R, D, { sky: '#ffcf96', ground: '#ffd9a8', power: 0.2 });
  }
  await T();

  if (done.lap) done.lap('hallfurn');
  // =============================================================================================================
  // people: seats in the water, groups, work; walkways
  // =============================================================================================================
  const SEATS = { hot: [], warm: [], plunge: [], shallow: [] };
  if (wide) for (let q = sq0 + 1.3; q < sq1 - 0.4; q += 1.5) { SEATS.shallow.push([sp0 + 0.28, -0.36, q, Math.PI / 2]); SEATS.shallow.push([sp1 - 0.28, -0.36, q + 0.5, -Math.PI / 2]); }
  for (let p = hp0 + 0.8; p < hp1 - 0.5; p += 1.4) { SEATS.hot.push([p, -0.56, hq0 + 0.45, 0]); SEATS.hot.push([p + 0.3, -0.56, hq1 - 0.45, Math.PI]); }
  for (let p = wp0 + 1.7; p < wp1 - 0.4; p += 1.6) { SEATS.warm.push([p, -0.42, wq0 + 0.25, 0]); SEATS.warm.push([p + 0.4, -0.42, wq1 - 0.25, Math.PI]); }
  SEATS.plunge.push([pc - 0.6, -0.5, pq1 - 0.25, Math.PI], [pc + 0.6, -0.5, pq1 - 0.25, Math.PI]);
  for (const k in SEATS) for (const st of SEATS[k]) L.spot('bath', st[0], st[1], st[2], st[3], { tags: ['baths', k] });
  chatRing(L, A1 + AW * 0.5, D - 2.4, 3, 0.65, ['baths']);
  chatRing(L, A0 - 2.6, Q2 + DH * 0.35, 3, 0.6, ['baths']);
  chatRing(L, cx + hw + 1.2, hq1 + 2.0, 2, 0.55, ['baths']);
  chatRing(L, cx - 3.5, Q1 * 0.45, 2, 0.5, ['baths']);
  L.spot('work', cx - 2.5, 0, hq1 + 1.8, 0, { tags: ['sweep', 'baths'] });
  L.spot('work', A0 * 0.5, 0, D - 1.2, Math.PI, { tags: ['sweep', 'baths'] });
  L.spot('stand', 1.0, 0, Q2 + 1.6, -Math.PI / 2, { tags: ['read', 'baths'] });
  L.spot('stand', W - 1.0, 0, pq0 + 0.6, Math.PI / 2, { tags: ['baths'] });
  // from the street through the door, the entry, the washing hall, into the pool hall
  const spineQ = Q1 + 2.0, hallQ = Q2 + 1.6;
  L.path([[cx, -0.7], [cx, 1.2], [cx, Q1 * 0.5 + 1.4], [cx, spineQ], [cx, Q2 + 0.4], [cx, hallQ]], { width: 1.6 });
  L.path([[cx, Q1 * 0.5 + 1.4], [dp - 1.2, Q1 * 0.5]], { width: 1.1 });
  L.path([[cx, Q1 * 0.5 + 1.4], [RW + 1.0, 3.3], [RW - 1.2, 3.3], [RW - 1.2, Q1 - 2.2], [robeDoor + 0.75, Q1 - 2.2], [robeDoor + 0.75, spineQ]], { width: 1.1 });
  L.path([[RW - 1.2, 3.3], [Math.max(1.6, RW * 0.4), 3.3]], { width: 1.0 });
  L.path([[SW + 0.8, spineQ], [cx, spineQ], [W - 0.9, spineQ]], { width: 1.3 });
  L.path([[restDoor + 0.7, spineQ], [restDoor + 0.7, Q1 - 1.0], [restDoor + 0.7, 2.8], [Math.min(W - 2, restDoor + 5), 2.8]], { width: 1.0 });
  if (aDoorA !== null) L.path([[aDoorA + 0.8, spineQ], [aDoorA + 0.8, hallQ]], { width: 1.2 });
  L.path([[aDoorB + 0.8, spineQ], [aDoorB + 0.8, hallQ]], { width: 1.2 });
  // the hall: a cross walk at the front, round the hot pool, down both aisles, to the steam room
  const sideA = hp0 - 1.1, sideB = hp1 + 1.1, backQ = hq1 + 1.9;
  L.path([[A0 - 2.4, hallQ], [sideA, hallQ], [cx, hallQ], [sideB, hallQ], [A1 + 2.4, hallQ]], { width: 1.3 });
  L.path([[sideA, hallQ], [sideA, backQ], [cx - 0.9, backQ], [cx + 0.9, backQ], [sideB, backQ], [sideB, hallQ]], { width: 1.2 });
  L.path([[sideA, backQ], [sideA, wq0 - 0.8], [cx, wq0 - 0.8], [sideB, wq0 - 0.8], [sideB, backQ]], { width: 1.1 });
  L.path([[A0 - 2.4, hallQ], [A0 - 2.4, D - 1.2]], { width: 1.2 }); L.path([[A1 + 2.4, hallQ], [A1 + 2.4, D - 1.2]], { width: 1.2 });
  L.path([[A0 - 2.4, hallQ], [SW - 1.05, hallQ], [SW - 1.05, Q2 - 1.6]], { width: 1.0 });
  for (const a of [arches[0], arches[arches.length - 1]]) { const q = Q2 + 0.08 + a.at + 1.7; L.path([[A0 - 2.4, q], [sideA, q]], { width: 1.0 }); L.path([[A1 + 2.4, q], [sideB, q]], { width: 1.0 }); }
  await T();

  if (done.lap) done.lap('people');
  // =============================================================================================================
  // things to do
  // =============================================================================================================
  const day = () => (game.clock ? game.clock.day : 1);
  const paidKey = () => 'lotbath:' + lot.id + ':' + day();
  const paid = (gm) => !!gm.flags[paidKey()];
  const band = info.band;
  const lineOf = (salt, list) => pickBy(seed, salt, byBand(info, list));
  const splash = (gm, p, q) => { L.sfx(gm, 'splash', p, 0, q, { vol: 0.4 }); if (high) L.sfx(gm, 'splash', p, 0, q, { vol: 0.18, delay: 1.3, pitch: 0.8 }); };
  const nearest = (gm, list) => { const w = L.where(gm) || [cx, Q2]; let best = list[0], bd = 1e9; for (const st of list) { const d = Math.hypot(st[0] - w[0], st[2] - w[1]); if (d < bd) { bd = d; best = st; } } return best; };
  const anySeat = (gm) => gm.player && gm.player.seat && typeof gm.player.seat.lot === 'string' && gm.player.seat.lot.indexOf(lot.id + ':') === 0;

  // the keeper at the desk
  L.interact({ p: dp - 0.8, y: 1.2, q: dq, radius: 1.8, kind: 'talk', prompt: 'Talk to ' + keeper.name + ' at the desk', async onUse(gm) {
    if (!gm.ui) return;
    const met = 'lotbathmet:' + lot.id;
    if (!gm.flags[met]) { gm.flags[met] = true; await say(gm, keeper, pickBy(seed, 6, GREET[band] || GREET.middle)); }
    gm.busy++; let c = null;
    try {
      c = await gm.ui.choose(keeper, 'What can ' + keeper.name + ' do for you?', [
        { label: paid(gm) ? 'You have paid for today' : 'Pay for a bath (' + PRICE.toFixed(2) + ' kWh)', value: 'pay', disabled: paid(gm) },
        { label: 'Ask what the heat costs', value: 'heat' },
        { label: 'Nothing, thank you', value: null },
      ]);
    } finally { gm.busy--; }
    if (c === 'pay') {
      if (gm.wallet && !gm.wallet.spend(PRICE, 'A bath at ' + bathName)) { await say(gm, keeper, ['Short. Never mind. Go in anyway, and pay me when you are not.']); }
      gm.flags[paidKey()] = true;
      note(gm, pickBy(seed, 7, PAID), 'gain');
      if (gm.journal && gm.journal.custom) gm.journal.custom('The waste-heat loop');
    } else if (c === 'heat') await say(gm, keeper, pickBy(seed, 8, ASK_HEAT));
  } });
  // broth from the urn
  L.interact({ p: up0 + 0.6, y: 1.0, q: Q1 - 1.0, radius: 1.3, prompt: 'Take a lidded cup of broth', onUse(gm) {
    L.sfx(gm, 'pour', up0 + 0.5, 1.1, Q1 - 0.4); L.sfx(gm, 'lid-down', up0 + 0.9, 1.0, Q1 - 0.4, { delay: 0.8 });
    note(gm, pickBy(seed + day(), 9, BROTH), 'gain'); if (gm.journal && gm.journal.custom) gm.journal.custom('Lids');
  } });
  // the rules
  L.interact({ p: cx + 2.4, y: 1.5, q: Q1 - 0.7, radius: 1.3, prompt: 'Read the rules by the arch', onUse: (gm) => say(gm, { name: rulesSpec.title, colour: '#FFD9A0' }, rulesSpec.lines.join(' ')) });
  // the gauge
  L.interact({ p: 0.9, y: 1.6, q: Q2 + 1.6, radius: 1.4, prompt: 'Read the gauge on the loop', onUse(gm) {
    if (gm.ui) gm.ui.card({ kicker: 'A brass plate on the pipe', title: 'The Sixty-Five', text: 'Waste heat from the food plant, up the loop at sixty-five degrees. It warms every bath and kitchen tap in ' + info.name + '. Heating the water costs nothing; the pumps and the cleaning cost about five hundredths of a kay a bath.', dur: 10 });
    if (gm.journal && gm.journal.custom) gm.journal.custom('The waste-heat loop');
  } });
  // wash first: the nearest stool
  const stools = []; for (let p = SW + 0.9; p < W - 0.6; p += 2.3) { const ops = [[robeDoor - 0.5, robeDoor + 2.0], [cx - 2.1, cx + 2.1], [restDoor - 0.5, restDoor + 1.9]]; if (p > SW + 0.6 && ops.every((o2) => p < o2[0] || p > o2[1])) stools.push([p, 0.25, Q1 + 0.7, Math.PI]); }
  for (const pp of [SW + (W - SW) * 0.25, SW + (W - SW) * 0.75]) {
    L.interact({ p: pp, y: 0.8, q: Q1 + 1.6, radius: 3.4, prompt: (gm) => seatedAs(gm, key('wash')) ? 'Get up' : 'Sit on a stool and wash first', onUse(gm) {
      if (anySeat(gm)) { gm.player.stand(); return; }
      const st = nearest(gm, stools); if (!sitPlayer(L, gm, st[0], st[1], st[2], st[3], 0.95, key('wash'), -0.15)) return;
      L.sfx(gm, 'pour', st[0], 0.6, st[2] - 0.5);
      gm.flags['lotbathwashed:' + lot.id] = true; if (gm.ui) gm.ui.subtitle(null, pickBy(seed + day(), 10, WASHED), 5);
    } });
  }
  // the pools
  const poolUse = (k, eye, p, q, rad, label, lines, salt) => L.interact({ p, y: 0.4, q, radius: rad, prompt: (gm) => seatedAs(gm, key(k)) ? 'Get out of the water' : label, onUse(gm) {
    if (anySeat(gm)) { gm.player.stand(); return; }
    if (!paid(gm)) { if (gm.ui) gm.ui.subtitle(null, pickBy(seed + day(), 11, NOT_PAID), 5); return; }
    const st = nearest(gm, SEATS[k]); if (!sitPlayer(L, gm, st[0], st[1], st[2], st[3], eye, key(k), -0.08)) return;
    splash(gm, st[0], st[2]);
    if (gm.ui) gm.ui.subtitle(null, lineOf(salt, lines), 6);
  } });
  poolUse('hot', 0.66, cx, hq0 - 0.6, 2.6, 'Get into the hot pool', HOT, 12);
  poolUse('hot', 0.66, cx - hw * 0.5, hq1 + 0.6, 2.2, 'Get into the hot pool', HOT, 12);
  poolUse('warm', 0.62, cx, wq0 - 0.6, 2.8, 'Sit in the warm pool', WARM, 13);
  poolUse('plunge', 0.62, pc, pq0 - 0.6, 1.6, 'Plunge into the cold pool', COLD, 14);
  if (wide) poolUse('shallow', 0.6, (sp0 + sp1) / 2, sq0 - 0.6, 2.4, low ? 'Sit in the children\'s pool' : 'Sit in the shallow pool', low ? SHALLOW_LOW : WARM, 17);
  // the steam room: the lower tier
  L.interact({ p: SW * 0.5, y: 0.8, q: Q1 + 2.6, radius: 2.4, prompt: (gm) => seatedAs(gm, key('steam')) ? 'Get up' : 'Sit in the steam', onUse(gm) {
    if (anySeat(gm)) { gm.player.stand(); return; }
    if (!sitPlayer(L, gm, SW * 0.5, 0.45, Q1 + 1.0, 0, 1.1, key('steam'), -0.05)) return;
    if (gm.ui) gm.ui.subtitle(null, pickBy(seed + day(), 15, STEAM), 6);
  } });
  // a lounger in the resting room: let the hours go
  L.interact({ p: RR0 + 2.4, y: 0.6, q: 2.4, radius: 2.2, prompt: (gm) => seatedAs(gm, key('rest')) ? 'Get up' : 'Lie on a lounger a while', async onUse(gm) {
    if (anySeat(gm)) { gm.player.stand(); return; }
    if (!sitPlayer(L, gm, RR0 + 0.95 + 1.45, 0.62, 1.2, 0, 0.62, key('rest'), 0.18)) return;
    if (!gm.ui || !gm.clock || !gm.ui.pickHour) return;
    gm.busy++; let h = null;
    try { h = await gm.ui.pickHour({ title: 'Lie here until', from: gm.clock.hours, to: gm.clock.hours + 8, now: gm.clock.hours }); } finally { gm.busy--; }
    if (h !== null && h !== undefined) { gm.clock.skipTo(h % 24); note(gm, pickBy(seed + day(), 16, REST)); }
  } });

  // =============================================================================================================
  // while you sit in the water: what people say; sound only while you are near
  // =============================================================================================================
  const talkers = { low: ['A bather', 'A mother with a sleeping baby', 'Someone in the steam', 'A boy on the ledge', 'A night-crew woman'], middle: ['A bather', 'Someone in the steam', 'A man with his eyes shut', 'A woman by the steps'], high: ['An old man by the steps', 'A woman of about a hundred', 'Someone with their eyes shut', 'Two old friends'] }[band] || ['A bather'];
  let tNext = 6, check = 0, loops = null; const queue = [];
  const startLoops = () => {
    const h1 = L.loop('water-lap', cx, -0.2, (hq0 + hq1) / 2, { vol: 0.35, radius: 13 });
    if (high && h1 && h1.set) h1.set({ pitch: 0.62 });
    const h2 = L.loop('steam', SW - 0.55, 0.6, Q1 + 1.9, { vol: 0.32, radius: 6 });
    const h3 = L.loop('murmur', cx, 1.2, Q2 + DH * 0.5, { vol: 0.28, radius: 20, param: high ? 0.3 : 0.5 });
    const h4 = L.loop('fountain', cx, 0.5, hq1 + 0.2, { vol: 0.25, radius: 7 });
    if (high && h4 && h4.set) h4.set({ pitch: 0.75 });
    return [h1, h2, h3, h4];
  };
  s.every((dt, gm) => {
    if (!gm) return;
    check -= dt;
    if (check <= 0) {
      check = 0.5;
      const near = L.inside(gm, -4, -4, W + 4, D + 4, -2, 8);
      if (near && !loops) loops = startLoops();
      else if (!near && loops) { for (const h of loops) { try { h.stop(0.6); } catch (e) { /* gone */ } } loops = null; }
    }
    const pl = gm.player, k = pl && pl.seat && typeof pl.seat.lot === 'string' && pl.seat.lot.indexOf(lot.id + ':') === 0 ? pl.seat.lot.slice(lot.id.length + 1) : null;
    for (let i = queue.length - 1; i >= 0; i--) { queue[i].t -= dt; if (queue[i].t <= 0) { if (gm.ui && k) gm.ui.subtitle(queue[i].who, queue[i].text, 5); queue.splice(i, 1); } }
    if (!k || k === 'rest' || k === 'wash') { tNext = Math.max(tNext, 5); return; }
    tNext -= dt; if (tNext > 0 || !gm.ui) return;
    tNext = 11 + Math.random() * 8;
    const lines = OVERHEARD[band] || OVERHEARD.middle, l = lines[Math.floor(Math.random() * lines.length)], who = talkers[Math.floor(Math.random() * talkers.length)];
    if (Array.isArray(l)) { gm.ui.subtitle(who, l[0], 5); queue.push({ t: 3.0, who: 'Another', text: l[1] }); } else gm.ui.subtitle(who, l, 5);
  });

  // =============================================================================================================
  // zones
  // =============================================================================================================
  const zb = (p0, q0, p1, q1, y0, y1) => { const b = L.B(p0, q0, p1, q1); return [b[0], y0, b[1], b[2], y1, b[3]]; };
  s.zoneBox({ id: lot.id, place: 'city-special', box: zb(0, 0, W, Q2, -0.5, 3.4), name: bathName.charAt(0).toUpperCase() + bathName.slice(1), sub: info.name + ' · robes, broth, hot water', ambience: 'baths', reverb: 'room', cell: info.key });
  s.zoneBox({ id: lot.id + '/steam', place: 'city-special', box: zb(0, Q1, SW, Q2, -0.5, 2.6), name: 'The steam room', sub: bathName, ambience: 'baths', reverb: 'tile', headroom: 2.6, cell: info.key });
  s.zoneBox({ id: lot.id + '/hall', place: 'city-special', box: zb(0, Q2, W, D, -1.6, 7.0), name: 'The pool hall', sub: info.name + (high ? ' · slow water' : ' · on the sixty-five'), ambience: 'baths', reverb: 'tile', headroom: 7, env: { warmth: 0.38, bloom: 0.07, autoKey: 0.15 }, cell: info.key });
  void ceiling; void r;
  done();
}
