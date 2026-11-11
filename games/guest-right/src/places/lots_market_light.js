// Light studios: in a drum with no daylight, light is a craft, and painters pool their share of it into one dim room
// and take its booths in turns. From the street: a dark front, two windows each showing a small lit study, the name
// over the door. Inside: a warm front room with the rota and the store of gels and shades, a felt curtain, then the
// studio: booths round the walls, each a white wall and a rack of coloured lamps on arms, one lit with a study in
// progress, one you may switch on yourself; the critique wall in the middle with benches before it.
import { defineProp } from '../world/props.js';
import { craftParts } from './craft_parts.js';
import { local, walkways, pickBy, tell, toast, meter, someone } from './lots_market_kit.js';
import { STUDIO_NAMES, ROTA_LINES, CRIT_LINES, GEL_LINES, STUDY_ON, STUDY_OFF } from './lots_market_words.js';
import { frontSide } from '../city/lots.js';
import { LOT_H } from '../city/plan.js';
import { frontWall, pilaster } from './street_parts.js';
import { Rng, hashStr, shadeHex, mixHex } from '../core/util.js';

void craftParts;
const LO = 3.3, FR = 4.6;
// the painters' colours: the River's brown-violet, rose, gold, a white, a teal, a deep blue
export const LIGHTS = ['#6a4868', '#e0909a', '#f0b850', '#fff4e0', '#3fb0a8', '#3a4a9a'];

// A rack of lamps on arms: a three-footed stand, a pole, four arms each with a lamp head and a gel. Front (+z) is the way
// the lamps point. p: { v, lit }; lit: the lenses glow in their colours.
defineProp('lots-market.lamprack', (g, p) => {
  const r = new Rng(hashStr('lr' + p.v)), lit = !!p.lit;
  g.mat('cast', '#2a2622'); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5; g.tube([[Math.cos(a) * 0.35, 0.02, Math.sin(a) * 0.35], [0, 0.25, 0]], 0.016, { segs: 4 }); }
  g.mat('cast', '#3c4148', { rough: -0.2 }); g.cyl(0, 0.2, 0, 0.022, 2.3, { segs: 6 });
  const H = [1.1, 1.5, 1.9, 2.3];
  for (let i = 0; i < 4; i++) {
    const y = H[i], sx = (i % 2 ? 1 : -1) * r.f(0.15, 0.45), col = LIGHTS[(p.v + i * 2) % LIGHTS.length], tilt = r.f(-0.25, 0.1);
    g.mat('cast', '#3c4148'); g.tube([[0, y, 0], [sx * 0.6, y + 0.08, 0.1], [sx, y + tilt * 0.3, 0.3]], 0.012, { segs: 4 });
    g.push(); g.move(sx, y + tilt * 0.3, 0.3); g.rotX(Math.PI / 2 + tilt);
    g.mat('cast', '#2a2622'); g.lathe(0, 0, [[0.03, -0.02], [0.07, 0.04], [0.11, 0.14]], { segs: 8, capTop: false });
    g.mat('diffuser', col, { emissive: lit ? 4.5 : 0.35, lamp: false }); g.cyl(0, 0.13, 0, 0.1, 0.006, { segs: 8, capBottom: false });
    // barn doors
    g.mat('cast', '#2a2622'); for (const s of [-1, 1]) g.box(s * 0.11 - 0.005, 0.14, -0.1, s * 0.11 + 0.005, 0.24, 0.1, { faces: 'xX' });
    g.pop();
  }
  // a cable down the pole to a plug box on the floor
  g.mat('weave', '#1e1c1e'); g.tube([[0.03, 2.2, -0.03], [0.05, 1.0, -0.05], [0.1, 0.05, -0.2], [0.4, 0.02, -0.4]], 0.008, { segs: 3 });
  return { posts: [[0, 0, 0.2, 0, 2.4]], tier: 's', cast: false };
});

// A rack of gels standing in slots: thin coloured sheets, some burnt at the edge. p: { w }
defineProp('lots-market.gelrack', (g, p) => {
  const w = p.w || 1.4, r = new Rng(hashStr('gr' + w));
  g.mat('wood', '#5a3a26'); g.box(-w / 2, 0, -0.2, w / 2, 0.9, 0.2, { faces: 'xXYzZ' });
  g.mat('wood', '#3a2a20'); for (let x = -w / 2 + 0.05; x < w / 2 - 0.02; x += 0.06) g.box(x, 0.9, -0.18, x + 0.01, 0.93, 0.18, { faces: 'xXYzZ' });
  const cols = LIGHTS.concat(['#c8402e', '#e8c242', '#5b3a6e', '#2f6f73']);
  for (let x = -w / 2 + 0.08, i = 0; x < w / 2 - 0.04; x += 0.06, i++) { const c = cols[r.i(0, cols.length - 1)], h = r.f(0.25, 0.45); g.mat('diffuser', c, { emissive: 0.12 }); g.box(x, 0.9, -0.16 + r.f(0, 0.04), x + 0.004, 0.9 + h, 0.16 - r.f(0, 0.04), { faces: 'xX' }); }
  return { solid: [[-w / 2, 0, -0.2, w / 2, 1.3, 0.2]], tier: 's', cast: false };
});

export async function buildStudio(s, lot, plan, game, tick) {
  const L = local(s, lot), g = s.g, W = L.W, D = L.D, info = plan.info, seed = lot.seed >>> 0, r = new Rng(seed);
  const T = meter(s, game, 'studio ' + lot.id + ' ' + W.toFixed(1) + 'x' + D.toFixed(1) + ' front ' + lot.front + ' ' + info.band, tick);
  try {
    const c = W / 2, nm = pickBy(seed, 1, STUDIO_NAMES), dark = '#1e1a20', felt = ['#2a2230', '#26202a', '#2e2428'][seed % 3], white = '#f2efe8';
    const clipF = L.clip(0, -0.3, 0, W, LO + 0.05, FR + 0.1), clipS = L.clip(0, -0.3, FR - 0.1, W, LO + 0.05, D);
    // ---------------------------------------------------------------------------------------------------------------
    // the shell: a dark front, a warm front room, the studio in felt and black rubber
    // ---------------------------------------------------------------------------------------------------------------
    L.floor(0, 0, W, FR, 0, 'planks', '#6e4c34');
    L.floor(0, FR, W, D, 0, 'speckle', '#2a2828');
    L.ceiling(0, 0, W, FR, LO, 'paint', '#4a3e44');
    L.ceiling(0, FR, W, D, LO, 'felt', '#1c1a1e');
    const fw = { tint: '#d9ccb6', mat: 'plaster', dado: { h: 1.0, mat: 'wood', tint: '#4a3428' }, skirt: '#2a1e18' };
    L.wallQ(0.08, 0.3, FR, 0, LO, fw); L.wallQ(W - 0.08, 0.3, FR, 0, LO, fw);
    const sw = { tint: felt, mat: 'felt', skirt: '#141214' };
    L.wallQ(0.08, FR, D, 0, LO, sw); L.wallQ(W - 0.08, FR, D, 0, LO, sw); L.wallP(D - 0.08, 0, W, 0, LO, sw);
    // the partition with its curtained doorway
    L.wallP(FR, 0, W, 0, LO, { tint: '#d9ccb6', mat: 'plaster', dado: { h: 1.0, mat: 'wood', tint: '#4a3428' }, openings: [{ at: c - 1.0, w: 2.0, h: 2.4 }], inner: { tint: felt, mat: 'felt' }, outer: { tint: '#d9ccb6', mat: 'plaster' } });
    s.deco(() => {
      g.mat('cast', '#2a2622'); L.tube([[c - 1.4, 2.45, FR + 0.15], [c + 1.4, 2.45, FR + 0.15]], 0.015, { segs: 5 });
      g.mat('felt', '#5b2a3a'); for (const sd of [-1, 1]) L.sheet([c + sd * 1.0, 2.45, FR + 0.15], [c + sd * 1.45, 2.45, FR + 0.15], [c + sd * 1.45, 0.02, FR + 0.17], [c + sd * 1.0, 0.02, FR + 0.17], { nu: 3, nv: 3, ripple: 0.05, rippleN: 4 });
    });
    await T();
    // the front: a dark painted wall, a narrow door, two windows each with a small lit study behind the glass
    {
      const sd = frontSide(lot), a0 = L.o.a0, fin = { mat: 'paint', tint: '#2a2430', dado: { h: 0.9, mat: 'tile', tint: '#5b3a6e' }, trim: '#d6a640', door: '#5b3a6e' };
      const dw = 1.3, door = [c - dw / 2, dw, 2.4], win = [[c - 1.2 - 3.0, 2.4], [c + 1.2 + 0.6, 2.4]];
      const ops = [{ at: door[0], w: dw, h: 2.4 }].concat(win.map((w) => ({ at: w[0], w: w[1], h: 1.6, sill: 0.8 })));
      frontWall(s, sd, a0, L.o.a1, LOT_H, ops, fin);
      L.wallP(0.27, 0, W, 0, LO, { t: 0.14, openings: ops, tint: '#d9ccb6', mat: 'plaster', dado: { h: 1.0, mat: 'wood', tint: '#4a3428' }, skirt: '#2a1e18' });
      for (const w of win) {
        L.glass(w[0], 0.8, 0.12, w[0] + w[1], 2.4, 0.12, { opacity: 0.12 });
        pilaster(s, sd, a0 + w[0] - 0.3, LOT_H + 0.37, '#4a3e44'); pilaster(s, sd, a0 + w[0] + w[1] + 0.3, LOT_H + 0.37, '#4a3e44');
        // the window study: a white board inside the glass, painted with light in bands
        const k = (seed + (w[0] < c ? 0 : 3)) % LIGHTS.length;
        s.structure(() => {
          g.mat('paint', '#d6a640'); L.box(w[0], 0.8, 0.08, w[0] + w[1], 0.86, 0.18); L.box(w[0], 2.34, 0.08, w[0] + w[1], 2.4, 0.18); L.box(w[0], 0.8, 0.08, w[0] + 0.06, 2.4, 0.18); L.box(w[0] + w[1] - 0.06, 0.8, 0.08, w[0] + w[1], 2.4, 0.18);
          for (let i = 0; i < 6; i++) { g.mat('diffuser', mixHex(LIGHTS[(k + Math.floor(i / 2)) % LIGHTS.length], LIGHTS[(k + Math.floor(i / 2) + 1) % LIGHTS.length], (i % 2) * 0.5), { emissive: 0.75 + i * 0.1 }); L.box(w[0] + 0.25, 0.95 + i * 0.22, 0.6, w[0] + w[1] - 0.25, 1.17 + i * 0.22, 0.62, { faces: 'q' }); }
          g.mat('wood', '#2a2622'); L.box(w[0] + 0.15, 0.85, 0.62, w[0] + w[1] - 0.15, 2.35, 0.66, { faces: 'qpPyY' });
        });
      }
      pilaster(s, sd, a0 + door[0] - 0.3, LOT_H + 0.37, '#4a3e44'); pilaster(s, sd, a0 + door[0] + dw + 0.3, LOT_H + 0.37, '#4a3e44');
      pilaster(s, sd, a0 + 0.16, LOT_H + 0.37, '#4a3e44'); pilaster(s, sd, L.o.a1 - 0.16, LOT_H + 0.37, '#4a3e44');
      s.structure(() => { g.mat('paint', fin.door); L.box(door[0] + 0.02, 0.02, 0.36, door[0] + 0.06, 2.32, 0.36 + dw * 0.9); g.mat('stone', '#4a3e44'); L.box(door[0], 0, -0.12, door[0] + dw, 0.012, 0.36, { faces: 'Y' }); });
      await T();
      L.sign({ kind: 'fascia', text: nm[0], sub: nm[1], palette: ['#1e1a20', '#f2e3cf', '#e0909a'] }, c, 2.93, -0.04, [0, -1], { w: 3.2, h: 0.4, glow: 1.6, board: false });
      L.lamp('sconce', c - dw / 2 - 0.35, 2.15, -0.12, { face: [0, -1], K: 2700, power: 0.7, clip: L.clip(c - 4, -0.3, -3, c + 4, 3.4, 0.2) });
    }
    await T();
    T.lap('shell');

    // ---------------------------------------------------------------------------------------------------------------
    // the front room: the rota, the store of gels and shades, coats, a bench
    // ---------------------------------------------------------------------------------------------------------------
    const left = seed % 2 === 0, gp = left ? 0.45 : W - 0.45, ga = left ? Math.PI / 2 : -Math.PI / 2, gs = left ? 1 : -1;
    L.prop('craft.drawers', gp, 0, 1.6, ga, { w: 1.4, h: 1.1, cols: 5, rows: 8, wood: '#4a3020' }, { noSpots: true });
    L.prop('lots-market.gelrack', gp + gs * 0.05, 0, 3.3, ga, { w: 1.4 });
    s.detail(() => {
      // shades on pegs above the drawers, a crate of lamp heads, the lending slips
      g.mat('wood', '#4a3020'); L.box(gp - gs * 0.3, 2.15, 0.7, gp - gs * 0.25, 2.22, 4.2);
      for (let i = 0; i < 7; i++) { const q = 0.9 + i * 0.48, col = LIGHTS[(i + seed) % LIGHTS.length]; g.mat('paper', col, { emissive: 0.15 }); L.lathe(gp - gs * 0.12, q, [[0.05, 1.82], [0.14, 1.95], [0.15, 2.05], [0.05, 2.12]], { segs: 8, capTop: false, capBottom: false }); }
      g.mat('wood', '#8a6240'); L.box(gp + gs * 1.0 - 0.3, 0, 2.3, gp + gs * 1.0 + 0.3, 0.32, 2.75, { faces: 'pPqQY' });
      for (let i = 0; i < 4; i++) { g.mat('cast', ['#7a6a58', '#2f4a44', '#8a2f3c', '#3c4148'][i]); L.lathe(gp + gs * 1.0 - 0.15 + (i % 2) * 0.3, 2.42 + Math.floor(i / 2) * 0.2, [[0.03, 0.32], [0.07, 0.36], [0.1, 0.42]], { segs: 8, capTop: false }); }
      g.mat('paper', '#efe4c8'); for (let i = 0; i < 5; i++) L.box(gp - gs * 0.24, 1.15 - i * 0.04, 1.0 + i * 0.12, gp - gs * 0.22, 1.2 - i * 0.04, 1.08 + i * 0.12);
    });
    L.spot('counter', gp + gs * 0.9, 0, 1.6, ga + Math.PI, { tags: ['studio', 'gels', 'keeper'] });
    L.spot('browse', gp + gs * 1.0, 0, 3.3, ga + Math.PI, { tags: ['studio', 'gels'] });
    L.interact({ p: gp + gs * 1.1, q: 2.4, y: 1.2, radius: 1.5, prompt: 'Look in the store of gels and shades', onUse: (gm) => tell(gm, 'The store', pickBy(seed + (gm.clock ? gm.clock.day : 1), 3, GEL_LINES)) });
    // the other side: coat hooks with dark smocks on them, a bench to change shoes on
    const op = left ? W - 0.3 : 0.3, os = left ? -1 : 1;
    s.detail(() => {
      g.mat('wood', '#4a3020'); L.box(Math.min(op, op + os * 0.06), 1.75, 1.0, Math.max(op, op + os * 0.06), 1.85, 3.8);
      for (let i = 0; i < 5; i++) { const q = 1.3 + i * 0.6; g.mat('weave', ['#2a2230', '#3a3040', '#5b3a6e', '#2a2622', '#3a4a9a'][(i + seed) % 5]); L.sheet([op + os * 0.08, 1.8, q - 0.2], [op + os * 0.08, 1.8, q + 0.2], [op + os * 0.14, 0.8, q + 0.26], [op + os * 0.14, 0.8, q - 0.26], { nu: 2, nv: 2, ripple: 0.02, rippleN: 2 }); }
    });
    L.prop('bench', op + os * 0.6, 0, 2.4, left ? -Math.PI / 2 : Math.PI / 2, { w: 1.8, back: false, wood: '#4a3020' }, { noSpots: true });
    for (const dq of [-0.45, 0.45]) L.spot('sit', op + os * 0.6, 0.46, 2.4 + dq, left ? -Math.PI / 2 : Math.PI / 2, { tags: ['studio', 'wait'] });
    // the rota on the partition, beside the curtain
    const rp = c + (left ? 2.2 : -2.2), rr = new Rng(seed + 3);
    await T();
    L.sign({ kind: 'board', title: 'The rota', lines: ['booth 1|' + someone(rr), 'booth 2|' + someone(rr), 'booth 3|a dusk, rehearsing', 'booth 4|' + someone(rr), 'lamp-night|booked', 'light left today|' + (2 + seed % 5) + '.' + (seed % 9) + ' kays'], palette: ['#1e1a20', '#f2e3cf', '#e0909a'] }, rp, 1.65, FR - 0.09, [0, -1], { w: 1.1, h: 0.75 });
    await T();
    L.interact({ p: rp, q: FR - 0.9, y: 1.5, radius: 1.3, prompt: 'Read the rota', onUse: (gm) => tell(gm, 'The rota', pickBy(seed + (gm.clock ? gm.clock.day : 1), 5, ROTA_LINES)) });
    L.prop('plant', c + (left ? -2.0 : 2.0), 0, FR - 0.5, 0, { kind: 'fern', size: 1.2, pot: '#5b3a6e' });
    L.lamp('globe', c - 3, LO - 0.02, 2.3, { r: 0.18, drop: 0.6, K: 2700, power: 1.0, range: 6, clip: clipF });
    L.lamp('globe', c + 3, LO - 0.02, 2.3, { r: 0.18, drop: 0.6, K: 2700, power: 1.0, range: 6, clip: clipF });
    L.glowBox(0, 0, 0, W, LO, FR, { sky: '#ffd8b0', ground: '#8a5a40', power: 0.3 });
    await T();
    T.lap('front');

    // ---------------------------------------------------------------------------------------------------------------
    // the booths: round the side walls and the back wall, each a white wall, felt sides, a curtain, a lamp rack
    // ---------------------------------------------------------------------------------------------------------------
    const BD = 3.0, booths = [];
    { // side walls: from the partition to the back wall
      const q0 = FR + 0.3, q1 = D, n = Math.max(2, Math.round((q1 - q0) / 3.6)), st = (q1 - q0) / n;
      for (let i = 0; i < n; i++) for (const sd of [0, 1]) booths.push({ side: sd ? 'hi' : 'lo', a0: q0 + st * i, a1: q0 + st * (i + 1) });
    }
    { const p0 = BD, p1 = W - BD, n = Math.max(2, Math.round((p1 - p0) / 3.6)), st = (p1 - p0) / n; for (let i = 0; i < n; i++) booths.push({ side: 'back', a0: p0 + st * i, a1: p0 + st * (i + 1) }); }
    // each booth in local terms: its centre on the white wall, the way it faces, the frame of its open side
    const geo = (b) => {
      if (b.side === 'back') { const m = (b.a0 + b.a1) / 2; return { wall: [m, D - 0.17], a: Math.PI, mouth: [m, D - BD], across: [1, 0], half: (b.a1 - b.a0) / 2 }; }
      const m = (b.a0 + b.a1) / 2, lo = b.side === 'lo';
      return { wall: [lo ? 0.17 : W - 0.17, m], a: lo ? Math.PI / 2 : -Math.PI / 2, mouth: [lo ? BD : W - BD, m], across: [0, 1], half: (b.a1 - b.a0) / 2 };
    };
    const litI = (seed % booths.length), switchI = (seed * 7 + 3) % booths.length === litI ? (litI + 2) % booths.length : (seed * 7 + 3) % booths.length;
    const glowI = [(litI + 4) % booths.length, (litI + booths.length - 3) % booths.length].filter((i) => i !== switchI && i !== litI);
    const studyLights = [];
    for (let bi = 0; bi < booths.length; bi++) {
      const b = booths[bi], G = geo(b), wl = G.wall, mo = G.mouth, ax = G.across, h = G.half, inX = mo[0] - wl[0], inQ = mo[1] - wl[1], len = Math.hypot(inX, inQ), ux = inX / len, uq = inQ / len;
      const at = (d, s2) => [wl[0] + ux * d + ax[0] * s2, wl[1] + uq * d + ax[1] * s2];        // d: out from the wall, s2: along it
      // the white wall, a skirting, a pencilled grid
      s.structure(() => {
        const a = at(0.0, -h + 0.08), bb = at(0.03, h - 0.08);
        g.mat('paint', white, { rough: 0.25 }); L.box(Math.min(a[0], bb[0]), 0.1, Math.min(a[1], bb[1]), Math.max(a[0], bb[0]), 2.9, Math.max(a[1], bb[1]));
        g.mat('paint', '#1e1a20'); const c0 = at(0.0, -h + 0.08), c1 = at(0.05, h - 0.08); L.box(Math.min(c0[0], c1[0]), 0, Math.min(c0[1], c1[1]), Math.max(c0[0], c1[0]), 0.1, Math.max(c0[1], c1[1]));
      });
      // the felt dividers between booths (one per booth, on its low side; the last booth closes the run)
      s.furniture(() => {
        for (const e of (bi === booths.length - 1 ? [-h, h] : [-h])) {
          const p0 = at(0.0, e - 0.03), p1 = at(BD, e + 0.03);
          g.mat('felt', felt); L.box(Math.min(p0[0], p1[0]), 0, Math.min(p0[1], p1[1]), Math.max(p0[0], p1[0]), 2.7, Math.max(p0[1], p1[1]));
          g.mat('cast', '#2a2622'); const t0 = at(BD - 0.03, e - 0.04), t1 = at(BD + 0.02, e + 0.04); L.box(Math.min(t0[0], t1[0]), 0, Math.min(t0[1], t1[1]), Math.max(t0[0], t1[0]), 2.75, Math.max(t0[1], t1[1]));
        }
        // the curtain rail across the mouth and the curtain drawn to one side
        const r0 = at(BD, -h), r1 = at(BD, h);
        g.mat('cast', '#2a2622'); L.tube([[r0[0], 2.62, r0[1]], [r1[0], 2.62, r1[1]]], 0.012, { segs: 4 });
        const k0 = at(BD - 0.05, h - 0.75), k1 = at(BD - 0.05, h - 0.12);
        g.mat('felt', '#3a2a40'); L.sheet([k0[0], 2.6, k0[1]], [k1[0], 2.6, k1[1]], [k1[0], 0.05, k1[1]], [k0[0], 0.05, k0[1]], { nu: 4, nv: 2, ripple: 0.06, rippleN: 5 });
      });
      for (const e of (bi === booths.length - 1 ? [-h, h] : [-h])) { const p0 = at(0.0, e - 0.03), p1 = at(BD, e + 0.03); L.solid(Math.min(p0[0], p1[0]), 0, Math.min(p0[1], p1[1]), Math.max(p0[0], p1[0]), 2.7, Math.max(p0[1], p1[1])); }
      // a faint amber line on the floor along the booth's mouth, so feet can find the way in the dark
      s.deco(() => { const a = at(BD + 0.05, -h + 0.2), bb = at(BD + 0.09, h - 0.2); g.mat('diffuser', '#ffb060', { emissive: 0.45, lamp: false }); L.box(Math.min(a[0], bb[0]), 0.0, Math.min(a[1], bb[1]), Math.max(a[0], bb[0]), 0.004, Math.max(a[1], bb[1]), { faces: 'Y' }); });
      // the lamp rack, pointing at the white wall; a stool; a little trolley of gels and a sketchbook
      const lit = bi === litI, rk = at(1.9, h * 0.25), st = at(1.3, -h * 0.4), tr = at(2.2, -h * 0.55);
      L.prop('lots-market.lamprack', rk[0], 0, rk[1], G.a + Math.PI, { v: (seed + bi) % LIGHTS.length, lit });
      L.prop('stool', st[0], 0, st[1], G.a, { wood: '#3a2a20' }, { noSpots: true });
      s.detail(() => {
        g.mat('cast', '#2a2622'); L.box(tr[0] - 0.22, 0.0, tr[1] - 0.22, tr[0] + 0.22, 0.72, tr[1] + 0.22, { faces: 'pPqQY' });
        g.mat('paper', '#efe6d2'); L.box(tr[0] - 0.15, 0.72, tr[1] - 0.12, tr[0] + 0.12, 0.735, tr[1] + 0.1);
        for (let i = 0; i < 3; i++) { g.mat('diffuser', LIGHTS[(bi + i) % LIGHTS.length], { emissive: 0.2 }); L.box(tr[0] - 0.18 + i * 0.12, 0.735, tr[1] + 0.12, tr[0] - 0.08 + i * 0.12, 0.74, tr[1] + 0.2); }
      });
      L.solid(tr[0] - 0.22, 0, tr[1] - 0.22, tr[0] + 0.22, 0.75, tr[1] + 0.22);
      // people: the lit booth has its painter at work; others somebody sitting with a sketchbook now and then
      if (lit) { const w1 = at(1.5, -h * 0.1); L.spot('work', w1[0], 0, w1[1], G.a + Math.PI, { tags: ['paint', 'light', 'studio'] }); }
      else if (bi % 3 === 1) L.spot('sit', st[0], 0.46, st[1], G.a + Math.PI, { tags: ['studio', 'sketch'] });
      // light: the lit booth paints its wall in three colours; the switchable one is ready, off; two others glow faintly
      const aim = (k) => { const p = at(0.0, (k - 1) * h * 0.45); return [p[0], 1.2 + (k % 2) * 0.6, p[1]]; };
      const mk = (k, col, power, on) => { const from = at(1.7, h * 0.25 + (k - 1) * 0.2), to = aim(k), d = [to[0] - from[0], to[1] - 1.7, to[2] - from[1]], n = Math.hypot(d[0], d[1], d[2]); const lt = L.light({ at: [from[0], 1.7 + (k - 1) * 0.2, from[1]], type: 'spot', dir: [d[0] / n, d[1] / n, d[2] / n], cone: [34, 12], color: col, power, range: 4.2, clip: clipS, lamp: false }); lt.on = on; return lt; };
      if (lit) { for (let k = 0; k < 3; k++) mk(k, LIGHTS[(seed + k * 2) % 3 === 0 ? 0 : (seed + k) % LIGHTS.length], 16, true); if (game.params && game.params.citylog) console.log('[lots-market] studio lit booth at p ' + at(1.6, 0)[0].toFixed(1) + ' q ' + at(1.6, 0)[1].toFixed(1)); }
      if (bi === switchI) { for (let k = 0; k < 3; k++) studyLights.push(mk(k, LIGHTS[[0, 1, 2][k]], 16, false)); }
      if (glowI.indexOf(bi) >= 0) mk(1, LIGHTS[(bi + seed) % LIGHTS.length], 7, true);
      if (bi === switchI) {
        const ip = at(1.6, 0);
        if (game.params && game.params.citylog) console.log('[lots-market] studio switch booth at p ' + ip[0].toFixed(1) + ' q ' + ip[1].toFixed(1));
        L.interact({ p: ip[0], q: ip[1], y: 1.2, radius: 1.5, prompt: () => (studyLights.length && studyLights[0].on ? 'Turn the study\'s lamps down' : 'Switch on the study\'s lamps'), onUse: (gm) => {
          const on = !studyLights[0].on; for (const lt of studyLights) lt.on = on;
          if (gm.sfx) gm.sfx('lamp-click', { vol: 0.5 }); else if (gm.audio && gm.audio.play) gm.audio.play('lamp-click', { vol: 0.5 });
          gm.flags = gm.flags || {}; const k = gm.flags.studio_lit = (gm.flags.studio_lit || 0) + (on ? 1 : 0);
          toast(gm, on ? STUDY_ON[(seed + k) % STUDY_ON.length] : STUDY_OFF[(seed + k) % STUDY_OFF.length]);
        } });
        // a chalked name on the floor before it: whose study this is
        s.deco(() => { g.mat('paint', '#e9e1cf'); const a = at(BD - 0.3, -0.4), bb = at(BD - 0.26, 0.4); L.box(Math.min(a[0], bb[0]), 0.002, Math.min(a[1], bb[1]), Math.max(a[0], bb[0]), 0.004, Math.max(a[1], bb[1]), { faces: 'Y' }); });
      }
      if (bi % 3 === 2) await T();
    }
    s.onDispose(() => { studyLights.length = 0; });
    await T();
    T.lap('booths');

    // ---------------------------------------------------------------------------------------------------------------
    // the critique wall: a long freestanding board of pinned studies in the middle, benches before it
    // ---------------------------------------------------------------------------------------------------------------
    const cq = FR + 4.2, cw = Math.min(7, W - 2 * BD - 3);
    s.furniture(() => {
      g.mat('wood', '#3a2a20'); for (const e of [-cw / 2, cw / 2]) L.box(c + e - 0.06, 0, cq - 0.3, c + e + 0.06, 2.4, cq + 0.3, { faces: 'pPqQY' });
      g.mat('felt', '#4a3e44'); L.box(c - cw / 2, 0.5, cq - 0.05, c + cw / 2, 2.3, cq + 0.05, { faces: 'qQyY' });
      g.mat('wood', '#3a2a20'); L.box(c - cw / 2, 2.3, cq - 0.07, c + cw / 2, 2.36, cq + 0.07);
    });
    L.solid(c - cw / 2 - 0.06, 0, cq - 0.3, c + cw / 2 + 0.06, 2.4, cq + 0.3);
    s.detail(() => {
      const rr2 = new Rng(seed + 11), n = Math.floor(cw / 0.55);
      for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) {
        const p = c - cw / 2 + 0.3 + i * (cw - 0.6) / Math.max(1, n - 1) + rr2.f(-0.05, 0.05), y = 1.35 + j * 0.55 + rr2.f(-0.05, 0.05), k = rr2.i(0, LIGHTS.length - 1);
        // a print of a study: three bands of colour on white, a strip of comments under it
        g.mat('paper', '#f2efe8'); L.box(p - 0.2, y - 0.2, cq - 0.065, p + 0.2, y + 0.2, cq - 0.06, { faces: 'q' });
        for (let b = 0; b < 3; b++) { g.mat('plain', mixHex(LIGHTS[(k + b) % LIGHTS.length], '#f2efe8', 0.2 + b * 0.1), { emissive: 0.15 }); L.box(p - 0.17, y - 0.17 + b * 0.11, cq - 0.07, p + 0.17, y - 0.07 + b * 0.11, cq - 0.065, { faces: 'q' }); }
        g.mat('paper', '#e8dcc4'); L.box(p - 0.17, y - 0.27, cq - 0.07, p + 0.1 + rr2.f(0, 0.07), y - 0.22, cq - 0.065, { faces: 'q' });
      }
    });
    L.lamp('strip', c - cw / 2 + 0.3, LO - 0.03, cq - 0.9, { to: [c + cw / 2 - 0.3, LO - 0.03, cq - 0.9], K: 3600, power: 1.0, range: 3.5, clip: clipS });
    for (const sd of [-1, 1]) { L.prop('bench', c + sd * 1.3, 0, cq - 2.0, 0, { w: 1.8, back: true, wood: '#3a2a20' }, { noSpots: true }); for (const dp of [-0.45, 0.45]) L.spot('sit', c + sd * 1.3 + dp, 0.46, cq - 2.0, 0, { tags: ['studio', 'critique'] }); }
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; L.spot('chat', c + 2.9 + Math.sin(a) * 0.6, 0, cq - 1.0 + Math.cos(a) * 0.6, a + Math.PI, { tags: ['studio', 'critique'] }); }
    L.interact({ p: c, q: cq - 0.8, y: 1.5, radius: 1.8, prompt: 'Look at the critique wall', onUse: (gm) => tell(gm, 'The critique wall', pickBy(seed + (gm.clock ? gm.clock.day : 1), 7, CRIT_LINES)) });
    // a worktable at the back of the floor with lamp heads in pieces
    const wq = Math.min(D - BD - 1.3, cq + 2.6);
    L.prop('table', c, 0, wq, 0, { w: 2.2, d: 0.9, h: 0.74, wood: '#3a2a20' });
    s.detail(() => { for (let i = 0; i < 5; i++) { g.mat('cast', ['#7a6a58', '#2f4a44', '#8a2f3c', '#3c4148', '#b08a45'][i]); L.lathe(c - 0.8 + i * 0.4, wq + (i % 2 ? 0.15 : -0.15), [[0.03, 0.74], [0.07, 0.8], [0.1, 0.88]], { segs: 8, capTop: false }); } });
    L.spot('work', c, 0, wq + 0.75, Math.PI, { tags: ['studio', 'mend', 'lamps'] });
    L.lamp('globe', c, LO - 0.02, wq, { r: 0.14, drop: 1.4, K: 3000, power: 0.6, range: 3.2, clip: clipS });
    L.glowBox(0, 0, FR, W, LO, D, { sky: '#8a7a98', ground: '#3a3238', power: 0.32 });
    await T();
    T.lap('middle');

    // walkways, sound, the zone
    const lines = [[[c, -0.7], [c, 1.2], [c, FR - 0.8], [c, FR + 1.2], [c, cq - 1.2]], [[BD + 0.5, FR + 1.2], [W - BD - 0.5, FR + 1.2]], [[BD + 0.5, FR + 1.2], [BD + 0.5, D - BD - 0.5], [W - BD - 0.5, D - BD - 0.5], [W - BD - 0.5, FR + 1.2]], [[c, FR - 0.8], [gp + (left ? 1.4 : -1.4), 2.4]]];
    walkways(L, lines, 1.1);
    L.loop('hum-lamp', c, 2.0, (FR + D) / 2, { vol: 0.08, radius: 10 });
    const zb = L.B(0, 0, W, D);
    s.zoneBox({ id: lot.id, place: 'city-special', box: [zb[0], -0.5, zb[1], zb[2], LO, zb[3]], name: nm[0].charAt(0) + nm[0].slice(1).toLowerCase(), sub: info.name + ' · ' + nm[1], ambience: 'quiet', reverb: 'felt', cell: info.key });
    void shadeHex;
  } finally { T.done(); }
}
