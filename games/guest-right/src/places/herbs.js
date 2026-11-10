// Bring Herbs, Not Gin, the herb shop on Ladle Row: the brightest, greenest room on the street, where light is the luxury.
// Banks of potted herbs on stepped sage staging under rows of white grow lamps hung on chains, a copper misting pipe along
// every bank, bundles drying overhead by the door, saffron seed drawers at the back under the Row: a pot for each drum.
import { lamp, warm } from '../world/kit.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { MENUS } from '../content/menus.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';
import { unit, plate, buyFrom, sayAs, spread, drawHerbPot, foodParts } from './food_parts.js';

const TAU = Math.PI * 2;
// palette: whitewash, sage staging, terracotta, saffron, copper, white lamp light
const WASH = '#e0e5d4', TILE = '#d3e4cf', SAGE = '#86a67f', SAGE_D = '#4f6e55', SAFFRON = '#e3a91f', TEAL = '#2f6e62';
const BRASS = '#b08a45', COPPER = '#b8693c', ALU = '#cfd3d0', ASH = '#c9aa7c', BEAM = '#a7bd9f';
const POTS = ['#b8613d', '#c4704a', '#a8563a', '#c98a5a', '#b8613d', '#d39468', '#b05a3a'];
const AMADOU = { name: 'Amadou', colour: '#e8c25a' };

// what each herb looks like in a pot (leaf tints nudge the natural leaf texture)
const HERB = {
  Chervil: { kind: 'fern', leaf: '#f0ffd8', size: 0.2 },
  Sorrel: { kind: 'broad', leaf: '#f4ffc8', size: 0.2 },
  Lovage: { kind: 'broad', leaf: '#b8d8a0', size: 0.27 },
  Tansy: { kind: 'fern', leaf: '#d8eab0', size: 0.23, flowers: true, flowerTint: '#f2c62a' },
  Rue: { kind: 'fine', leaf: '#cfe0e4', size: 0.18 },
  Yarrow: { kind: 'fern', leaf: '#dcf0c0', size: 0.22, flowers: true, flowerTint: '#f6f1e2' },
  Borage: { kind: 'broad', leaf: '#c8dcb4', size: 0.24, flowers: true, flowerTint: '#5878ff' },
  Coriander: { kind: 'fern', leaf: '#e8ffc8', size: 0.2 },
  Shiso: { kind: 'shiso', leaf: '#c070b8', size: 0.2 },
  Basil: { kind: 'broad', leaf: '#f0ffd0', size: 0.21 },
  Chives: { kind: 'fine', leaf: '#d0f0a8', size: 0.24, flowers: true, flowerTint: '#d8a0e0' },
  Mint: { kind: 'broad', leaf: '#d8f8c0', size: 0.19 },
  Thyme: { kind: 'fine', leaf: '#c8d4b0', size: 0.14 },
};
const ROWKINDS = ['Basil', 'Chervil', 'Sorrel', 'Mint', 'Coriander', 'Shiso', 'Lovage', 'Chives', 'Thyme', 'Borage', 'Yarrow', 'Rue', 'Basil', 'Coriander', 'Chervil', 'Mint'];

// A terracotta pot with a bushy herb in it: a lighter, fuller cousin of drawHerbPot for the hundreds on the staging.
// o: { name (a HERB key), r, size, pot, seed, flowers }
function pot(g, x, y, z, o) {
  const h = HERB[o.name] || HERB.Basil, r = o.r || 0.062, ph = r * 1.12, size = (o.size || h.size * 1.25), rng = new Rng(hashStr('hbp' + (o.seed || 0)));
  g.mat('glaze', o.pot || '#b8613d', { rough: 0.3 });
  g.lathe(x, z, [[r * 0.7, y], [r * 0.9, y + ph * 0.76], [r * 1.07, y + ph * 0.78], [r * 1.07, y + ph], [r * 0.93, y + ph], [r * 0.9, y + ph * 0.9]], { segs: 9, capTop: false, capBottom: false });
  g.mat('soil', '#ffffff'); g.cyl(x, y + ph * 0.84, z, r * 0.9, 0.004, { segs: 6 });
  const kind = h.kind, layer = kind === 'broad' || kind === 'shiso' ? 'leafA' : kind === 'fern' ? 'fern' : 'leafB';
  const n = o.n || (kind === 'fine' ? 7 : 8), yb = y + ph * 0.82;
  g.mat(layer, kind === 'shiso' ? h.leaf : mixHex(h.leaf, '#86c855', 0.3), { sway: 0.35 });
  for (let i = 0; i < n; i++) {
    const inner = i < Math.ceil(n / 2), a = i / Math.ceil(n / 2) * Math.PI + rng.f(-0.3, 0.3);
    const hh = size * (inner ? rng.f(0.85, 1.05) : rng.f(0.55, 0.75)), ww = hh * (kind === 'fine' ? 0.6 : kind === 'fern' ? 0.75 : 1.0);
    g.card(x + rng.f(-r * 0.25, r * 0.25), yb, z + rng.f(-r * 0.25, r * 0.25), ww, hh, a, { tilt: inner ? rng.f(-0.18, 0.18) : (i % 2 ? 0.55 : -0.55) });
  }
  if (h.flowers && o.flowers !== false) { g.mat('blossom', h.flowerTint, { sway: 0.35 }); for (let i = 0; i < 3; i++) g.card(x + rng.f(-r * 0.5, r * 0.5), yb + size * 0.55, z + rng.f(-r * 0.5, r * 0.5), size * 0.38, size * 0.38, rng.f(0, 3), { tilt: 0.2 }); }
}

// ---------------------------------------------------------------------------------------------------------------
// Props of this shop (food.hb_*)
// ---------------------------------------------------------------------------------------------------------------

// Stepped staging, along x, front toward +z. Steps are [top, z0, z1]. p: { L, kind: 'wall' | 'window' | 'island', paint }
const STEPS = {
  wall: [[0.46, -0.26, 0], [0.76, -0.52, -0.26], [1.06, -0.78, -0.52]],
  window: [[0.62, -0.24, 0], [0.86, -0.48, -0.24], [1.1, -0.7, -0.48]],
  island: [[0.5, 0.5, 0.76], [0.78, 0.25, 0.5], [1.04, -0.25, 0.25], [0.78, -0.5, -0.25], [0.5, -0.76, -0.5]],
};
defineProp('food.hb_staging', (g, p) => {
  const L = p.L || 2, paint = p.paint || SAGE, body = shadeHex(paint, 0.78), S = STEPS[p.kind || 'wall'];
  let zmin = 0, zmax = 0, ymax = 0;
  const nf = Math.max(1, Math.round(L / 1.0));
  for (const st of S) {
    const [y, z0, z1] = st; zmin = Math.min(zmin, z0); zmax = Math.max(zmax, z1); ymax = Math.max(ymax, y);
    g.mat('paint', body); g.box(-L / 2 + 0.03, 0.07, z0 + 0.01, L / 2 - 0.03, y - 0.024, z1 - 0.01, { aoBottom: 0.6 });
    g.mat('wood', paint, { rough: -0.05 });
    const sw = (z1 - z0) / 3; for (let i = 0; i < 3; i++) g.box(-L / 2, y - 0.024, z0 + i * sw + 0.005, L / 2, y, z0 + (i + 1) * sw - 0.005, { bevel: 0.004 });
    g.mat('paint', shadeHex(paint, 1.08), { rough: -0.1 });
    for (const e of [z0, z1]) g.box(-L / 2, y - 0.11, e - 0.012, L / 2, y - 0.024, e + 0.012, { bevel: 0.004 });
    g.mat('paint', paint, { rough: -0.05 });
    for (let k = 0; k <= nf; k++) { const x = -L / 2 + 0.03 + k * (L - 0.06) / nf; g.box(x - 0.024, 0, z0 - 0.004, x + 0.024, y - 0.024, z1 + 0.004, { bevel: 0.005 }); }
  }
  g.mat('paint', '#2c3a30'); g.box(-L / 2 + 0.03, 0, zmin + 0.04, L / 2 - 0.03, 0.07, zmax - 0.04);
  return { solid: [[-L / 2, 0, zmin, L / 2, ymax, zmax]], tier: 's' };
});

// The potting bench: scrubbed boards on a sage frame, a back board with a shelf, a tray with soil. Front toward +z. p: { w }
defineProp('food.hb_bench', (g, p) => {
  const w = p.w || 1.6, d = 0.6, h = 0.86, wood = '#b48c60';
  g.mat('paint', SAGE, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.05) - 0.03, 0, sz * (d / 2 - 0.05) - 0.03, sx * (w / 2 - 0.05) + 0.03, h - 0.04, sz * (d / 2 - 0.05) + 0.03, { bevel: 0.006 });
  g.box(-w / 2 + 0.05, h - 0.13, d / 2 - 0.07, w / 2 - 0.05, h - 0.04, d / 2 - 0.035, { bevel: 0.005 });
  g.mat('wood', shadeHex(wood, 0.85)); g.box(-w / 2 + 0.03, 0.16, -d / 2 + 0.04, w / 2 - 0.03, 0.19, d / 2 - 0.04, { bevel: 0.004 });
  g.mat('wood', wood, { rough: 0.05 }); for (let i = 0; i < 4; i++) g.box(-w / 2, h - 0.04, -d / 2 + i * d / 4 + 0.003, w / 2, h, -d / 2 + (i + 1) * d / 4 - 0.003, { bevel: 0.004 });
  g.mat('wood', shadeHex(wood, 0.92));
  g.box(-w / 2, h, -d / 2, w / 2, h + 0.62, -d / 2 + 0.025, { bevel: 0.006 });
  g.box(-w / 2 + 0.02, h + 0.4, -d / 2 + 0.02, w / 2 - 0.02, h + 0.425, -d / 2 + 0.17, { bevel: 0.004 });
  for (const sx of [-1, 1]) g.box(sx * w / 2 - (sx > 0 ? 0.025 : 0), h, -d / 2, sx * w / 2 + (sx > 0 ? 0 : 0.025), h + 0.2, d / 2 - 0.12, { bevel: 0.005 });
  g.box(-w / 2 + 0.025, h, d / 2 - 0.15, 0.02, h + 0.07, d / 2 - 0.125, { bevel: 0.004 });
  g.box(0.0, h, -d / 2 + 0.025, 0.02, h + 0.12, d / 2 - 0.125, { bevel: 0.004 });
  // soil in the tray, heaped toward the back
  g.mat('soil', '#e8ddd0'); g.box(-w / 2 + 0.03, h, -d / 2 + 0.03, -0.002, h + 0.02, d / 2 - 0.15, { faces: 'Y' });
  g.ball(-w / 4 - 0.05, h + 0.015, -0.06, w * 0.17, 0.09, 0.16, { segs: 14, rings: 5, bottom: 0 });
  g.ball(-w / 4 + 0.12, h + 0.015, 0.02, 0.1, 0.045, 0.08, { segs: 10, rings: 4, bottom: 0 });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A watering can, painted, with a brass rose. p: { col }
defineProp('food.hb_can', (g, p) => {
  const c = p.col || TEAL;
  g.mat('paint', c, { rough: -0.15 });
  g.lathe(0, 0, [[0, 0], [0.08, 0], [0.088, 0.012], [0.09, 0.17], [0.082, 0.19], [0.05, 0.205], [0, 0.21]], { segs: 16 });
  g.cyl(-0.035, 0.18, 0, 0.034, 0.045, { segs: 12 });
  g.mat('paint', shadeHex(c, 0.7)); g.lathe(0, 0, [[0.091, 0.06], [0.091, 0.075]], { segs: 16, capTop: false, capBottom: false });
  g.mat('paint', c, { rough: -0.15 }); g.tube([[0.07, 0.035, 0], [0.17, 0.13, 0], [0.26, 0.24, 0]], [0.017, 0.012, 0.009], { segs: 8 });
  g.tube([[-0.082, 0.05, 0], [-0.13, 0.13, 0], [-0.1, 0.26, 0], [-0.01, 0.285, 0], [0.04, 0.21, 0]], 0.01, { segs: 6 });
  g.mat('cast', BRASS, { rough: -0.15 }); g.push(); g.move(0.255, 0.235, 0); g.rotZ(-0.8);
  g.lathe(0, 0, [[0.009, 0], [0.028, 0.035], [0.031, 0.042], [0, 0.044]], { segs: 12 }); g.pop();
  return { cast: false };
});

// A pendant in saffron enamel with a white inside, hanging from y = 0 on a cord of length L. p: { L }
defineProp('food.hb_shade', (g, p) => {
  const L = p.L || 1.0, y = -L;
  g.mat('brushed', '#3a3430'); g.tube([[0, 0, 0], [0, y + 0.01, 0]], 0.005, { segs: 4, caps: false }); g.cyl(0, -0.03, 0, 0.04, 0.03, { segs: 10 });
  g.mat('cast', BRASS, { rough: -0.15 }); g.cyl(0, y - 0.02, 0, 0.026, 0.04, { segs: 10 });
  g.mat('paint', SAFFRON, { rough: -0.3 }); g.lathe(0, 0, [[0.17, y - 0.17], [0.165, y - 0.16], [0.11, y - 0.09], [0.05, y - 0.035], [0.03, y - 0.02]], { segs: 20, capTop: false, capBottom: false });
  g.mat('paint', '#3a2a18'); g.lathe(0, 0, [[0.173, y - 0.178], [0.173, y - 0.165]], { segs: 20, capTop: false, capBottom: false });
  g.mat('plain', '#fff4dc', { emissive: 0.4, lamp: true }); g.lathe(0, 0, [[0.028, y - 0.02], [0.048, y - 0.035], [0.108, y - 0.09], [0.163, y - 0.16]], { segs: 20, capTop: false, capBottom: false });
  g.mat('plain', '#fff0c8', { emissive: 4, lamp: true }); g.ball(0, y - 0.07, 0, 0.03, 0.034, 0.03, { segs: 10, rings: 6 });
  return { cast: false };
});

// A celadon jug of host's sprigs, each tied with green thread. p: { n }
defineProp('food.hb_sprigs', (g, p) => {
  const n = p.n || 9, rng = new Rng(hashStr('hbs' + n));
  g.mat('glaze', '#b9d6c2', { rough: -0.3 });
  g.lathe(0, 0, [[0, 0], [0.046, 0], [0.056, 0.03], [0.058, 0.09], [0.046, 0.13], [0.042, 0.15], [0.05, 0.162], [0.044, 0.164], [0.037, 0.145]], { segs: 16, capTop: false });
  g.mat('plain', '#4a6a5a', { rough: -0.45 }); g.cyl(0, 0.128, 0, 0.04, 0.002, { segs: 12 });
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + rng.f(-0.2, 0.2), lean = rng.f(0.05, 0.1), ty = 0.29 + rng.f(0, 0.06);
    const b = [Math.cos(a) * 0.012, 0.1, Math.sin(a) * 0.012], t = [Math.cos(a) * lean, ty, Math.sin(a) * lean];
    g.mat('bark', '#8aa858'); g.tube([b, t], 0.0022, { segs: 3 });
    const k = 0.42, m = [b[0] + (t[0] - b[0]) * k, b[1] + (t[1] - b[1]) * k, b[2] + (t[2] - b[2]) * k];
    g.mat('weave', '#3f8a3a'); g.cyl(m[0], m[1] - 0.005, m[2], 0.006, 0.01, { segs: 6 });
    g.mat(i % 3 ? 'fern' : 'leafB', '#f0ffe0', { sway: 0.2 }); g.card(t[0], t[1] - 0.075, t[2], 0.08, 0.11, a, { tilt: 0.25 });
  }
  return { cast: false };
});

// Shears for the sprigs, lying open, green handles. Front toward +z.
defineProp('food.hb_shears', (g) => {
  g.mat('brushed', '#d4d7d4', { rough: -0.3 });
  for (const s of [-1, 1]) { g.push(); g.rotY(s * 0.16); g.box(0, 0, -0.005, 0.11, 0.004, 0.005, { bevel: 0.0015 }); g.pop(); }
  g.mat('paint', '#3f7a4a', { rough: -0.2 });
  for (const s of [-1, 1]) { const ring = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ring.push([-0.045 + Math.cos(a) * 0.022, 0.006, s * 0.022 + Math.sin(a) * 0.015]); } g.tube(ring, 0.0045, { segs: 4, closed: true }); g.tube([[-0.024, 0.005, s * 0.012], [0.005, 0.004, s * 0.002]], 0.004, { segs: 4 }); }
  g.mat('cast', BRASS); g.cyl(0.006, 0, 0, 0.006, 0.008, { segs: 8 });
  return { cast: false };
});

// A wooden spool of thread. p: { col }
defineProp('food.hb_spool', (g, p) => {
  g.mat('wood', '#c8a070', { rough: -0.1 }); g.cyl(0, 0, 0, 0.028, 0.007, { segs: 12 }); g.cyl(0, 0.053, 0, 0.028, 0.007, { segs: 12 });
  g.mat('weave', p.col || '#3f8a3a'); g.cyl(0, 0.007, 0, 0.023, 0.046, { segs: 12 });
  g.mat('wood', '#3a2a1a'); g.cyl(0, 0.06, 0, 0.006, 0.0015, { segs: 6 });
  g.mat('weave', p.col || '#3f8a3a'); g.tube([[0.023, 0.03, 0], [0.05, 0.004, 0.02], [0.09, 0.002, 0.035]], 0.0013, { segs: 3 });
  return { cast: false };
});

// A stack of empty terracotta pots, nested. p: { r, n, col }
defineProp('food.hb_potstack', (g, p) => {
  const r = p.r || 0.065, n = p.n || 5, ph = r * 1.15;
  g.mat('glaze', p.col || '#b8613d', { rough: 0.25 });
  for (let i = 0; i < n; i++) { const y = i * ph * 0.24; g.lathe(0, 0, [[0, y], [r * 0.68, y], [r * 0.74, y + ph * 0.06], [r * 0.92, y + ph * 0.78], [r * 1.06, y + ph * 0.8], [r * 1.06, y + ph], [r * 0.93, y + ph], [r * 0.9, y + ph * 0.9]], { segs: 12, capTop: false }); }
  g.mat('soil', '#5a4030'); g.cyl(0, (n - 1) * ph * 0.24 + 0.006, 0, r * 0.7, 0.002, { segs: 10 });
  return { cast: false };
});

// Amadou's counter: green panelled front with saffron beads, a scrubbed top. Front toward +z. p: { L }
defineProp('food.hb_counter', (g, p) => {
  const L = p.L || 2.4, d = 0.62, h = 0.92;
  g.mat('paint', '#2a2e28'); g.box(-L / 2 + 0.03, 0, -d / 2 + 0.06, L / 2 - 0.03, 0.08, d / 2 - 0.03, { aoBottom: 0.6 });
  g.mat('paint', TEAL, { rough: -0.1 }); g.box(-L / 2, 0.08, -d / 2 + 0.04, L / 2, h - 0.04, d / 2, { bevel: 0.01 });
  const n = Math.max(1, Math.round(L / 0.6)), pw = (L - 0.12) / n;
  for (let i = 0; i < n; i++) {
    const x0 = -L / 2 + 0.06 + i * pw + 0.03, x1 = x0 + pw - 0.06, y0 = 0.18, y1 = h - 0.14;
    g.mat('paint', shadeHex(TEAL, 1.18), { rough: -0.1 }); g.box(x0, y0, d / 2, x1, y1, d / 2 + 0.012, { bevel: 0.006 });
    g.mat('paint', SAFFRON, { rough: -0.2 });
    g.box(x0 - 0.012, y1, d / 2, x1 + 0.012, y1 + 0.012, d / 2 + 0.016); g.box(x0 - 0.012, y0 - 0.012, d / 2, x1 + 0.012, y0, d / 2 + 0.016);
    g.box(x0 - 0.012, y0, d / 2, x0, y1, d / 2 + 0.016); g.box(x1, y0, d / 2, x1 + 0.012, y1, d / 2 + 0.016);
  }
  g.mat('wood', '#d2b285', { rough: 0.05 }); g.box(-L / 2 - 0.03, h - 0.04, -d / 2 + 0.02, L / 2 + 0.03, h, d / 2 + 0.045, { bevel: 0.012 });
  g.mat('wood', '#8a6a48'); g.box(-L / 2 + 0.04, 0.44, -d / 2 + 0.02, L / 2 - 0.04, 0.465, -d / 2 + 0.05);
  return { solid: [[-L / 2 - 0.03, 0, -d / 2, L / 2 + 0.03, h, d / 2 + 0.045]], tier: 's' };
});

// ---------------------------------------------------------------------------------------------------------------
// The place
// ---------------------------------------------------------------------------------------------------------------

export const place = {
  id: 'herbs', name: 'Bring Herbs, Not Gin', order: 43,
  build(game) {
    void foodParts;
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('herbs', f);
    const X0 = 55, X1 = 61.5, Z0 = -13.5, Z1 = -4, H = 3.2;
    const xi0 = X0 + 0.16, xi1 = X1 - 0.16, zb = Z0 + 0.16;
    const DX = 58.2;                                                     // the door's centre

    const U = unit(s, {
      x0: X0, x1: X1, z0: Z0, z1: Z1, h: H,
      floor: ['tile', '#c99070'], ceil: ['paint', '#f4f2ea'],
      wall: { tint: WASH, mat: 'plaster', dado: { h: 1.12, mat: 'tile', tint: TILE }, skirt: SAGE_D },
      beams: { tint: BEAM }, rail: SAGE_D,
      front: {
        fascia: Object.assign({}, SIGNS['herbs.fascia'], { palette: [TEAL, '#f8ecc0', SAFFRON], emblem: 'leaf' }),
        palette: { frame: TEAL, plinth: '#24453c', awning: [SAFFRON, '#f6f0de'] },
        door: { at: DX - 0.55 - (X0 + 0.22), w: 1.1, tint: TEAL }, glow: 0.6, awning: { depth: 0.9 },
      },
      glow: { sky: '#eef6e6', ground: '#c89a78', power: 0.2 },
    });
    const clip = U.clip, spill = U.spill;

    // ---- helpers ----
    const chain = (g, x, z, y0, y1) => {
      g.mat('cast', '#8a867c', { rough: -0.1 });
      const n = Math.max(1, Math.floor((y1 - y0) / 0.1)), st = (y1 - y0) / n;
      for (let i = 0; i < n; i++) {
        const yc = y0 + (i + 0.5) * st, hy = st * 0.62;
        const q = i % 2 ? [[x - 0.009, yc, z], [x, yc + hy, z], [x + 0.009, yc, z], [x, yc - hy, z]] : [[x, yc, z - 0.009], [x, yc + hy, z], [x, yc, z + 0.009], [x, yc - hy, z]];
        g.tube(q, 0.0024, { segs: 3, closed: true });
      }
      g.mat('cast', BRASS, { rough: -0.1 }); g.cyl(x, y1 - 0.012, z, 0.024, 0.012, { segs: 8 });
    };
    // a grow lamp: an aluminium hood with a white diffuser, in segments of about two metres, hung on chains (or on wall arms)
    const growLamp = (ax, az, bx, bz, y, o = {}) => {
      const alongX = Math.abs(bx - ax) > Math.abs(bz - az);
      const a0 = alongX ? Math.min(ax, bx) : Math.min(az, bz), a1 = alongX ? Math.max(ax, bx) : Math.max(az, bz), c = alongX ? az : ax;
      const len = a1 - a0, nseg = Math.max(1, Math.round(len / (o.seg || 2.0)));
      s.deco((g) => {
        const B = (u0, v0, y0, u1, v1, y1, opt) => (alongX ? g.box(u0, y0, v0, u1, y1, v1, opt) : g.box(v0, y0, u0, v1, y1, u1, opt));
        for (let k = 0; k < nseg; k++) {
          const s0 = a0 + k * len / nseg + 0.02, s1 = a0 + (k + 1) * len / nseg - 0.02;
          g.mat('brushed', ALU, { rough: -0.15 });
          B(s0, c - 0.07, y + 0.012, s1, c + 0.07, y + 0.05, { bevel: 0.012 });
          B(s0, c - 0.082, y - 0.022, s1, c - 0.07, y + 0.03); B(s0, c + 0.07, y - 0.022, s1, c + 0.082, y + 0.03);
          g.mat('paint', '#3c5a48'); B(s0 - 0.012, c - 0.086, y - 0.024, s0 + 0.008, c + 0.086, y + 0.056, { bevel: 0.004 }); B(s1 - 0.008, c - 0.086, y - 0.024, s1 + 0.012, c + 0.086, y + 0.056, { bevel: 0.004 });
          g.mat('diffuser', '#f4f8ff', { emissive: o.glow || 6, lamp: o.lamp !== false }); B(s0 + 0.012, c - 0.066, y + 0.002, s1 - 0.012, c + 0.066, y + 0.012, { faces: 'y' });
          if (!o.arms) { const a = k === 0 ? s0 + 0.16 : a0 + k * len / nseg; const pp = alongX ? [a, c] : [c, a]; chain(g, pp[0], pp[1], y + 0.05, H); if (k === nseg - 1) { const q = alongX ? [s1 - 0.16, c] : [c, s1 - 0.16]; chain(g, q[0], q[1], y + 0.05, H); } }
          g.mat('plain', '#2a2a28'); { const a = s1 - 0.05, pp = alongX ? [a, c + 0.03] : [c + 0.03, a]; g.tube([[pp[0], y + 0.05, pp[1]], [pp[0], y + 0.25, pp[1]], [pp[0], H, pp[1]]], 0.004, { segs: 3 }); }
        }
      });
      const ins = 0.12, at = alongX ? [a0 + ins, y - 0.05, c] : [c, y - 0.05, a0 + ins], to = alongX ? [a1 - ins, y - 0.05, c] : [c, y - 0.05, a1 - ins];
      s.light({ at, to, type: 'tube', color: warm(o.K || 4300), power: o.power || 4, range: o.range || 3.0, radius: 0.06, clip: o.clip || clip, lamp: o.lamp !== false, nospec: o.nospec });
    };
    // a row of potted herbs from a to b at height y, in runs of one herb each. Returns the runs (for labels).
    const potRow = (ax, az, bx, bz, y, seed, o = {}) => {
      const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.floor(len / (o.sp || 0.2))), rng = new Rng(hashStr('hbrow' + seed));
      const runs = []; let k = 0, left = 0, name = null;
      s.deco((g) => {
        for (let i = 0; i < n; i++) {
          if (left <= 0) { name = o.only || ROWKINDS[(seed * 5 + k++) % ROWKINDS.length]; left = rng.i(3, 6); runs.push({ name, t: (i + 0.5) / n }); }
          left--;
          const t = (i + 0.5) / n, x = ax + (bx - ax) * t + rng.f(-0.012, 0.012), z = az + (bz - az) * t + rng.f(-0.012, 0.012);
          const h = HERB[name], r = (o.r || 0.062) * rng.f(0.92, 1.08);
          pot(g, x, y, z, { name, r, size: h.size * 1.3 * (o.k || 1) * rng.f(0.85, 1.15), pot: rng.pick(POTS), seed: seed * 100 + i, flowers: rng.chance(0.75) });
          if (rng.chance(0.16)) { g.mat('paper', '#f4f0e4'); g.box(x + r * 0.45, y + r * 0.9, z - 0.002, x + r * 0.45 + 0.018, y + r * 1.15 + 0.05, z + 0.002); }
        }
      });
      return runs.map((q) => ({ name: q.name, x: ax + (bx - ax) * q.t, z: az + (bz - az) * q.t }));
    };
    const label = (name, x, y, z, face) => plate(s, name, '0.03', x, y, z, face, 0.085);

    // ---- the west bank: staging the length of the wall, three tiers, three lamps ----
    const WF = xi0 + 0.78, WZ0 = -13.3, WZ1 = -5.3;
    prop(s, 'food.hb_staging', WF, 0, (WZ0 + WZ1) / 2, Math.PI / 2, { L: WZ1 - WZ0, kind: 'wall' });
    const STW = STEPS.wall;
    STW.forEach((st, i) => {
      const cx = WF + (st[1] + st[2]) / 2;                                // step centre (local z = world x offset)
      const runs = potRow(cx, WZ0 + 0.12, cx, WZ1 - 0.12, st[0], 10 + i, { r: i === 2 ? 0.07 : 0.062, k: i === 2 ? 1.2 : 1 });
      if (i === 0) runs.forEach((q, j) => { if (j < 9) label(q.name, WF + 0.014, st[0] - 0.066, q.z, 'X'); });
      growLamp(cx, WZ0 + 0.05, cx, WZ1 - 0.05, st[0] + 0.78, { power: 2.7, range: 2.8, clip: i === 0 ? spill : clip });
    });

    // ---- the east bank, shorter: the potting bench takes the back corner and the counter the front ----
    const EF = xi1 - 0.78, EZ0 = -12.55, EZ1 = -8.45;
    prop(s, 'food.hb_staging', EF, 0, (EZ0 + EZ1) / 2, -Math.PI / 2, { L: EZ1 - EZ0, kind: 'wall' });
    STW.forEach((st, i) => {
      const cx = EF - (st[1] + st[2]) / 2;
      const runs = potRow(cx, EZ0 + 0.12, cx, EZ1 - 0.12, st[0], 20 + i, { r: i === 2 ? 0.07 : 0.062, k: i === 2 ? 1.2 : 1 });
      if (i === 0) runs.forEach((q) => label(q.name, EF - 0.014, st[0] - 0.066, q.z, 'x'));
      growLamp(cx, EZ0 + 0.05, cx, EZ1 - 0.05, st[0] + 0.78, { power: 2.7, range: 2.8 });
    });

    // ---- the island: double-sided staging down the middle of the room, three lamps over it ----
    const IZ0 = -11.8, IZ1 = -8.2;
    prop(s, 'food.hb_staging', DX, 0, (IZ0 + IZ1) / 2, Math.PI / 2, { L: IZ1 - IZ0, kind: 'island' });
    STEPS.island.forEach((st, i) => {
      const cx = DX + (st[1] + st[2]) / 2;
      const runs = potRow(cx, IZ0 + 0.12, cx, IZ1 - 0.12, st[0], 30 + i, { r: i === 2 ? 0.075 : 0.062, k: i === 2 ? 1.3 : 1 });
      if (i === 0) runs.forEach((q) => label(q.name, DX + 0.76 + 0.014, st[0] - 0.066, q.z, 'X'));
      if (i === 4) runs.forEach((q) => label(q.name, DX - 0.76 - 0.014, st[0] - 0.066, q.z, 'x'));
    });
    growLamp(DX - 0.5, IZ0 + 0.05, DX - 0.5, IZ1 - 0.05, 1.38, { power: 3.2, range: 2.6 });
    growLamp(DX + 0.5, IZ0 + 0.05, DX + 0.5, IZ1 - 0.05, 1.38, { power: 3.2, range: 2.6 });
    growLamp(DX, IZ0 + 0.05, DX, IZ1 - 0.05, 1.8, { power: 3.2, range: 2.6 });
    sign(s, { kind: 'chalk', title: 'Cut while you wait', lines: ['Any pot, a sprig', 'Three hundredths', 'Tied for a host'] }, DX, 0.62, IZ1 + 0.012, { face: 'Z', w: 0.44, h: 0.5 });
    s.deco((g) => { for (const [x, i] of [[57.5, 0], [58.9, 1]]) pot(g, x, 0, IZ1 + 0.18, { name: i ? 'Lovage' : 'Borage', r: 0.15, size: 0.62, pot: i ? '#b8613d' : '#c98a5a', seed: 990 + i, n: 11 }); });
    for (const x of [57.5, 58.9]) s.post(x, IZ1 + 0.18, 0.17, 0, 0.8);

    // ---- the misting pipe: copper, on wall clips, nozzles every half metre, fed down the back corner ----
    s.structure((g) => {
      const PY = 2.1, R = 0.012;
      const nozzles = (pts) => {
        for (const q of pts) {
          g.mat('cast', BRASS, { rough: -0.15 }); g.cyl(q[0], q[1] - 0.045, q[2], 0.008, 0.045, { segs: 6 }); g.cyl(q[0], q[1] - 0.06, q[2], 0.005, 0.016, { segs: 6, r1: 0.009 });
          g.mat('cast', COPPER, { rough: -0.1 }); g.cyl(q[0], q[1] - 0.016, q[2], 0.016, 0.032, { segs: 8 });
        }
      };
      g.mat('cast', COPPER, { rough: -0.1 });
      // west run, over the middle step
      const wx = WF - 0.39;
      g.tube([[wx, PY, -5.45], [wx, PY, -13.0], [wx, PY + 0.04, -13.18], [wx, PY + 0.2, -13.22], [wx, 3.0, -13.22], [wx + 0.06, 3.05, -13.22], [EF + 0.39 - 0.06, 3.05, -13.22], [EF + 0.39, 3.0, -13.22], [EF + 0.39, PY + 0.2, -13.22], [EF + 0.39, PY + 0.04, -13.18], [EF + 0.39, PY, -13.0], [EF + 0.39, PY, EZ1 + 0.05]], R, { segs: 8 });
      // the island's branch along the ceiling and down to its ridge
      g.tube([[DX, 3.05, -13.22], [DX, 3.05, IZ0 - 0.1], [DX, 3.0, IZ0 + 0.0], [DX, 2.3, IZ0 + 0.05], [DX, 2.26, IZ0 + 0.12], [DX, 2.26, IZ1 - 0.1]], R, { segs: 8 });
      g.mat('cast', BRASS); g.ball(wx, PY, -5.44, 0.016, 0.016, 0.016, { segs: 8, rings: 5 }); g.ball(EF + 0.39, PY, EZ1 + 0.06, 0.016, 0.016, 0.016, { segs: 8, rings: 5 }); g.ball(DX, 2.26, IZ1 - 0.09, 0.016, 0.016, 0.016, { segs: 8, rings: 5 });
      g.cyl(DX, 3.03, -13.22, 0.02, 0.04, { segs: 8 });
      const wn = [], en = [], inz = [];
      for (let z = -12.8; z < -5.5; z += 0.5) wn.push([wx, PY, z]);
      for (let z = -12.3; z < EZ1; z += 0.5) en.push([EF + 0.39, PY, z]);
      for (let z = IZ0 + 0.3; z < IZ1 - 0.1; z += 0.5) inz.push([DX, 2.26, z]);
      nozzles(wn); nozzles(en); nozzles(inz);
      // wall clips
      g.mat('paint', SAGE_D);
      for (let z = -12.3; z < -5.5; z += 1.5) { g.tube([[xi0, PY, z], [wx, PY, z]], 0.006, { segs: 4 }); g.box(xi0, PY - 0.04, z - 0.03, xi0 + 0.012, PY + 0.04, z + 0.03); }
      for (let z = -11.8; z < EZ1; z += 1.5) { g.tube([[xi1, PY, z], [EF + 0.39, PY, z]], 0.006, { segs: 4 }); g.box(xi1 - 0.012, PY - 0.04, z - 0.03, xi1, PY + 0.04, z + 0.03); }
      // the valve and gauge on the riser in the back west corner
      g.mat('cast', BRASS, { rough: -0.15 }); g.cyl(wx, 2.45, -13.22, 0.022, 0.07, { segs: 10 });
      g.push(); g.move(wx + 0.035, 2.49, -13.22); g.rotZ(Math.PI / 2); g.cyl(0, -0.01, 0, 0.008, 0.04, { segs: 6 }); g.pop();
      g.mat('paint', '#b0302a', { rough: -0.2 }); { const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ring.push([wx + 0.07, 2.49 + Math.sin(a) * 0.045, -13.22 + Math.cos(a) * 0.045]); } g.tube(ring, 0.006, { segs: 4, closed: true }); g.tube([[wx + 0.07, 2.445, -13.22], [wx + 0.07, 2.535, -13.22]], 0.004, { segs: 3 }); g.tube([[wx + 0.07, 2.49, -13.265], [wx + 0.07, 2.49, -13.175]], 0.004, { segs: 3 }); }
      g.mat('cast', BRASS); g.push(); g.move(wx, 2.68, -13.19); g.rotX(Math.PI / 2); g.cyl(0, -0.01, 0, 0.042, 0.022, { segs: 14 }); g.pop();
      g.mat('plain', '#f4efe2', { rough: -0.3 }); g.box(wx - 0.034, 2.646, -13.168, wx + 0.034, 2.714, -13.166, { faces: 'Z' });
      g.mat('plain', '#2a2622'); g.box(wx - 0.002, 2.68, -13.165, wx + 0.026, 2.684, -13.164, { faces: 'Z' });
      // a tap over the potting bench, fed from the back run
      g.mat('cast', COPPER, { rough: -0.1 }); g.tube([[60.95, 3.05, -13.22], [60.95, 1.62, -13.22], [60.95, 1.56, -13.17]], R, { segs: 8 });
      g.mat('cast', BRASS, { rough: -0.15 }); g.tube([[60.95, 1.56, -13.17], [60.95, 1.56, -13.1], [60.95, 1.5, -13.07]], 0.011, { segs: 8 }); g.cyl(60.95, 1.58, -13.13, 0.006, 0.05, { segs: 6 }); g.box(60.92, 1.625, -13.14, 60.98, 1.64, -13.12);
    });

    // ---- the back wall: seed drawers in saffron, the Row above them under a lamp that stays on, the sign ----
    const DRX = 58.3, DRW = 2.4;
    prop(s, 'food.drawers', DRX, 0, zb + 0.225, 0, { w: DRW, h: 1.15, d: 0.45, cols: 9, rows: 6, wood: '#4f6e55', front: SAFFRON });
    const DT = 1.185;
    prop(s, 'food.hb_potstack', 57.35, DT, zb + 0.2, 0, { r: 0.05, n: 4 });
    s.detail((g) => {
      // seed packets in a little tray, a brass scoop, a ledger
      g.mat('wood', '#8a6a48'); g.box(57.7, DT, zb + 0.08, 58.1, DT + 0.04, zb + 0.3, { bevel: 0.004, faces: 'xXzZy' });
      const cols = ['#efe2c4', '#e3c27a', '#d9e2c4', '#f2d6b0', '#efe2c4', '#c9d8b0'];
      for (let i = 0; i < 6; i++) { g.mat('paper', cols[i]); g.box(57.72 + i * 0.062, DT + 0.01, zb + 0.15, 57.77 + i * 0.062, DT + 0.1 - (i % 2) * 0.012, zb + 0.16); }
      g.mat('cast', BRASS, { rough: -0.15 }); g.push(); g.move(58.55, DT + 0.03, zb + 0.24); g.rotZ(Math.PI / 2); g.lathe(0, 0, [[0, -0.07], [0.03, -0.068], [0.034, -0.02], [0.034, 0.03]], { segs: 12, capTop: false }); g.pop();
      g.mat('wood', '#5a4030'); g.tube([[58.55 - 0.035, DT + 0.03, zb + 0.24], [58.55 - 0.11, DT + 0.03, zb + 0.24]], 0.009, { segs: 6 });
      g.mat('leather', '#2f4a3a', { rough: -0.1 }); g.box(58.85, DT, zb + 0.1, 59.15, DT + 0.035, zb + 0.32, { bevel: 0.004 });
      g.mat('paper', '#efe6cf'); g.box(58.855, DT + 0.004, zb + 0.104, 59.145, DT + 0.031, zb + 0.322, { faces: 'xXZ' });
    });
    plate(s, 'Seed', 'ask at the counter', DRX, 1.09, zb + 0.465, 'Z', 0.12);

    // the Row: a pot for each drum, on a shelf of its own
    const RY = 1.6, RZ = zb + 0.14;
    s.furniture((g) => {
      g.mat('wood', '#4f6e55', { rough: -0.08 }); g.box(57.15, RY - 0.035, zb, 59.45, RY, zb + 0.3, { bevel: 0.006 });
      g.mat('paint', SAFFRON, { rough: -0.2 }); g.box(57.15, RY - 0.035, zb + 0.3, 59.45, RY - 0.005, zb + 0.308);
      g.mat('cast', BRASS); for (const x of [57.3, 58.3, 59.3]) g.tube([[x, RY - 0.24, zb], [x, RY - 0.14, zb + 0.03], [x, RY - 0.035, zb + 0.24]], 0.008, { segs: 5 });
    });
    const ROW = ['Sorrel', 'Lovage', 'Tansy', 'Chervil', 'Rue', 'Yarrow', 'Borage'];
    s.detail((g) => {
      ROW.forEach((nm, i) => {
        const h = HERB[nm], x = 57.4 + i * 0.3;
        drawHerbPot(g, x, RY, RZ, { kind: h.kind, r: 0.078, size: h.size * 1.25, pot: nm === 'Chervil' ? SAFFRON : '#b8613d', potMat: 'glaze', leaf: h.leaf, seed: 700 + i, n: 8, flowers: h.flowers, flowerTint: h.flowerTint });
      });
    });
    ROW.forEach((nm, i) => plate(s, nm, nm === 'Tansy' ? 'to look at' : nm === 'Chervil' ? 'our own' : '0.03', 57.4 + i * 0.3, RY - 0.02, zb + 0.312, 'Z', 0.1));
    // its lamp on two wall arms, left up all night
    s.deco((g) => { g.mat('cast', BRASS, { rough: -0.1 }); for (const x of [57.35, 59.25]) { g.box(x - 0.015, 2.2, zb, x + 0.015, 2.26, zb + 0.02); g.tube([[x, 2.23, zb + 0.01], [x, 2.24, zb + 0.12], [x, 2.2, zb + 0.18]], 0.008, { segs: 5 }); } });
    growLamp(57.2, zb + 0.18, 59.4, zb + 0.18, 2.13, { arms: true, lamp: false, power: 2.6, range: 2.4, K: 4000, glow: 6 });
    sign(s, { kind: 'banner', text: 'Bring herbs, not gin', palette: [TEAL, '#f8ecc0'] }, DRX, 2.6, zb + 0.004, { face: 'Z', w: 1.5, h: 0.44 });
    s.deco((g) => { g.mat('paint', SAFFRON, { rough: -0.2 }); g.box(DRX - 0.79, 2.36, zb, DRX + 0.79, 2.38, zb + 0.03); g.box(DRX - 0.79, 2.82, zb, DRX + 0.79, 2.84, zb + 0.03); });

    // little pots for flats with no window, on a narrow case of their own
    const FX0 = xi0 + 0.84, FX1 = 57.0, FZ = zb + 0.28;
    s.furniture((g) => {
      g.mat('paint', SAGE, { rough: -0.05 });
      for (const x of [FX0, FX1 - 0.03]) g.box(x, 0, zb, x + 0.03, 1.95, FZ, { bevel: 0.005 });
      g.mat('paint', shadeHex(SAGE, 0.6)); g.box(FX0 + 0.03, 0.08, zb, FX1 - 0.03, 1.95, zb + 0.015);
      g.mat('wood', '#e7dcc2'); for (const y of [0.3, 0.65, 1.0, 1.35, 1.7]) g.box(FX0 + 0.03, y - 0.022, zb, FX1 - 0.03, y, FZ, { bevel: 0.004 });
      g.mat('paint', SAGE_D); g.box(FX0, 1.95, zb, FX1, 1.99, FZ + 0.02, { bevel: 0.006 }); g.box(FX0 + 0.03, 0, zb + 0.02, FX1 - 0.03, 0.08, FZ - 0.01);
      g.mat('diffuser', '#f4f8ff', { emissive: 2.5, lamp: true }); for (const y of [0.65, 1.0, 1.35, 1.7]) g.box(FX0 + 0.06, y - 0.03, FZ - 0.07, FX1 - 0.06, y - 0.022, FZ - 0.05, { faces: 'y' });
    });
    s.detail((g) => {
      const rng = new Rng(hashStr('hbflat')), kinds = ['Basil', 'Chives', 'Mint', 'Basil', 'Thyme', 'Mint'];
      [0.3, 0.65, 1.0, 1.35].forEach((y, row) => spread(FX0 + 0.06, FX1 - 0.06, 5, (x, i) => {
        const h = HERB[kinds[(i + row) % kinds.length]];
        drawHerbPot(g, x, y, FZ - 0.12 + rng.f(-0.02, 0.02), { kind: h.kind, r: 0.034, size: 0.1, pot: rng.pick(['#b8613d', '#c98a5a', SAFFRON, '#f0ead8']), leaf: h.leaf, seed: 800 + row * 10 + i, n: 5 });
        g.mat('paper', '#f6f1e4'); g.box(x - 0.016, y, FZ - 0.065, x + 0.016, y + 0.022, FZ - 0.062);
      }));
    });
    prop(s, 'food.hb_potstack', FX0 + 0.22, 1.7, FZ - 0.12, 0, { r: 0.034, n: 6, col: '#c98a5a' });
    prop(s, 'food.hb_potstack', FX0 + 0.62, 1.7, FZ - 0.12, 0, { r: 0.034, n: 4, col: '#f0ead8' });
    s.light({ at: [(FX0 + FX1) / 2, 0.55, FZ + 0.05], to: [(FX0 + FX1) / 2, 1.65, FZ + 0.05], type: 'tube', color: warm(4200), power: 1.0, range: 1.4, radius: 0.04, clip, lamp: true });
    sign(s, { kind: 'notice', title: 'For a flat with no window', lines: ['A pot, a lamp, a watt', 'Basil, chives or mint', 'A rooted cutting, 0.06', 'The pot is lent', 'Bring it back bigger'], paper: '#f2ecd8' }, (FX0 + FX1) / 2, 2.64, zb + 0.004, { face: 'Z', w: 0.42, h: 0.5 });

    // ---- the potting bench in the back east corner ----
    const BX = 60.45, BZ = zb + 0.3, BH = 0.86;
    prop(s, 'food.hb_bench', BX, 0, BZ, 0, { w: 1.7 });
    prop(s, 'food.hb_can', 60.95, BH, BZ + 0.12, 2.6, { col: TEAL });
    prop(s, 'food.hb_potstack', 60.25, BH, BZ + 0.15, 0, { r: 0.065, n: 6 });
    prop(s, 'food.hb_potstack', 60.47, BH, BZ + 0.05, 0, { r: 0.055, n: 4, col: '#c98a5a' });
    prop(s, 'food.hb_potstack', 61.15, BH, BZ - 0.12, 0, { r: 0.075, n: 3 });
    s.detail((g) => {
      // a trowel stuck in the soil, a dibber, a ball of twine, a tray of seedlings, three pots being potted on
      g.mat('brushed', '#9a9890', { rough: -0.1 }); g.push(); g.move(59.85, BH + 0.06, BZ - 0.02); g.rotZ(0.5); g.ball(0, -0.05, 0, 0.032, 0.07, 0.006, { segs: 8, rings: 4 }); g.pop();
      g.mat('wood', '#7a5236'); g.tube([[59.85, BH + 0.06, BZ - 0.02], [59.92, BH + 0.17, BZ - 0.02]], [0.012, 0.014], { segs: 6 });
      g.mat('wood', '#c8a070'); g.tube([[60.0, BH + 0.005, BZ + 0.2], [60.14, BH + 0.008, BZ + 0.24]], [0.004, 0.011], { segs: 6 });
      g.mat('weave', '#cdb88a'); g.ball(61.12, BH + 0.045, BZ + 0.18, 0.045, 0.045, 0.045, { segs: 10, rings: 7 });
      g.tube([[61.12, BH + 0.04, BZ + 0.225], [61.06, BH + 0.004, BZ + 0.27], [60.9, BH + 0.003, BZ + 0.26]], 0.0018, { segs: 3 });
      g.mat('cane', '#9a7a52'); g.box(60.6, BH + 0.425, BZ - 0.29, 60.95, BH + 0.47, BZ - 0.14, { faces: 'xXzZy', bevel: 0.003 });
      g.mat('leafB', '#e8ffd0', { sway: 0.3 }); { const rng = new Rng(hashStr('hbseed')); for (let i = 0; i < 12; i++) g.card(rng.f(60.62, 60.93), BH + 0.46, rng.f(BZ - 0.27, BZ - 0.16), 0.04, rng.f(0.04, 0.06), rng.f(0, 3)); }
    });
    s.detail((g) => {
      for (let i = 0; i < 3; i++) { const h = HERB[['Basil', 'Lovage', 'Coriander'][i]]; drawHerbPot(g, 60.5 + i * 0.16, BH, BZ + 0.2 - (i % 2) * 0.06, { kind: h.kind, r: 0.06, size: 0.15, leaf: h.leaf, seed: 900 + i }); }
      // seed jars and packets on the back shelf
      for (let i = 0; i < 5; i++) { const x = 59.75 + i * 0.12; g.mat('glaze', ['#efe6cf', '#c9d8c0', '#e3c27a', '#efe6cf', '#d8c0a0'][i], { rough: -0.25 }); g.cyl(x, BH + 0.425, BZ - 0.22, 0.035, 0.1 + (i % 2) * 0.03, { segs: 10 }); g.mat('wood', '#7a5636'); g.cyl(x, BH + 0.525 + (i % 2) * 0.03, BZ - 0.22, 0.033, 0.012, { segs: 10 }); }
    });
    prop(s, 'food.sack', 59.95, 0.19, BZ, 0.4, { h: 0.4, r: 0.16, tint: '#a08a62', band: SAFFRON });
    prop(s, 'food.sack', 60.45, 0.19, BZ - 0.02, -0.3, { h: 0.38, r: 0.15, tint: '#b19a70' });
    prop(s, 'food.hb_potstack', 60.95, 0.19, BZ, 0, { r: 0.08, n: 5 });
    prop(s, 'food.hb_can', 59.45, 0, -12.45, 1.2, { col: '#4f7a52' });
    lamp(s, 'globe', BX, 2.2, BZ + 0.15, { clip, power: 0.5, K: 3000, drop: 1.0, r: 0.1 });

    // ---- Amadou's counter by the door, his shelves on the wall behind ----
    const CX = 60.15, CZ0 = -8.0, CZ1 = -5.6, CT = 0.92, CZ = (CZ0 + CZ1) / 2;
    prop(s, 'food.hb_counter', CX, 0, CZ, -Math.PI / 2, { L: CZ1 - CZ0 });
    prop(s, 'food.hb_sprigs', CX - 0.05, CT, -5.95, 0, { n: 11 });
    prop(s, 'food.hb_shears', CX - 0.12, CT, -6.4, 0.6, {});
    prop(s, 'food.hb_spool', CX + 0.15, CT, -6.3, 0, { col: '#3f8a3a' }); prop(s, 'food.hb_spool', CX + 0.2, CT, -6.42, 0, { col: '#5aa04a' });
    prop(s, 'food.scale', CX + 0.05, CT, -7.0, -Math.PI / 2, {});
    s.detail((g) => {
      // squares of paper for wrapping, a ledger, a tied sprig waiting
      for (let i = 0; i < 12; i++) { g.mat('paper', i % 2 ? '#f4efe2' : '#e9e0c8'); const o = (i % 3) * 0.004; g.box(CX - 0.1 + o, CT + i * 0.003, -7.72 - o, CX + 0.1 + o, CT + i * 0.003 + 0.0025, -7.52 - o); }
      g.mat('leather', '#5a3a22', { rough: -0.1 }); g.box(CX + 0.06, CT, -7.95, CX + 0.28, CT + 0.03, -7.65, { bevel: 0.004 });
      g.mat('paper', '#efe6cf'); g.box(CX + 0.064, CT + 0.004, -7.946, CX + 0.276, CT + 0.026, -7.654, { faces: 'xzZ' });
      g.mat('bark', '#8aa858'); g.tube([[CX - 0.18, CT + 0.005, -6.7], [CX - 0.02, CT + 0.006, -6.66]], 0.0025, { segs: 3 });
      g.mat('weave', '#3f8a3a'); g.cyl(CX - 0.12, CT, -6.69, 0.006, 0.012, { segs: 6 });
      g.mat('fern', '#f0ffe0'); g.push(); g.move(CX - 0.02, CT + 0.008, -6.66); g.rotZ(-Math.PI / 2); g.card(0, 0, 0, 0.07, 0.09, 0, {}); g.pop();
    });
    drawPotOnCounter();
    function drawPotOnCounter() { s.detail((g) => { const h = HERB.Chervil; drawHerbPot(g, CX - 0.15, CT, -5.75, { kind: h.kind, r: 0.06, size: 0.2, leaf: h.leaf, seed: 950, pot: SAFFRON }); }); }
    plate(s, 'A sprig', '0.03', CX - 0.312, 0.8, -6.0, 'x', 0.1);
    plate(s, 'Tied for a host', 'same price', CX - 0.312, 0.8, -7.4, 'x', 0.12);
    prop(s, 'food.hb_shade', CX, H, -6.3, 0, { L: 1.05 }); prop(s, 'food.hb_shade', CX, H, -7.35, 0, { L: 1.05 });
    lamp(s, 'bulb', CX, H - 1.14, -6.3, { clip, power: 0.6, K: 2800, range: 3.2 });
    lamp(s, 'bulb', CX, H - 1.14, -7.35, { clip, power: 0.6, K: 2800, range: 3.2 });
    prop(s, 'stool', 61.0, 0, -7.6, 0, { wood: '#8a6a48', h: 0.62 });
    // shelves behind him: thread, paper, seed jars, tins
    const SX = xi1;
    s.furniture((g) => {
      g.mat('wood', '#4f6e55', { rough: -0.08 }); for (const y of [1.25, 1.65, 2.05]) g.box(SX - 0.26, y - 0.03, -7.9, SX, y, -5.25, { bevel: 0.006 });
      g.mat('cast', BRASS); for (const y of [1.25, 1.65, 2.05]) for (const z of [-7.7, -6.6, -5.45]) g.tube([[SX, y - 0.2, z], [SX - 0.02, y - 0.11, z], [SX - 0.18, y - 0.03, z]], 0.007, { segs: 5 });
    });
    spread(-7.8, -6.7, 7, (z, i) => prop(s, 'food.hb_spool', SX - 0.12, 1.25, z, i, { col: ['#3f8a3a', '#5aa04a', '#2f6a3a', '#e3a91f', '#3f8a3a', '#b0302a', '#5aa04a'][i] }));
    spread(-6.5, -5.3, 4, (z, i) => prop(s, 'food.linen', SX - 0.13, 1.25, z, i * 0.2, { col: '#f4efe2', col2: '#e9e0c8', n: 5, w: 0.2, d: 0.22 }));
    const JARS = ['#d8c8a0', '#5a3a2a', '#9ab070', '#c96a3a', '#efe6cf', '#3a5a2a', '#c9a04a', '#d8c8a0', '#8a5a3a'];
    spread(-7.8, -5.35, 9, (z, i) => prop(s, 'food.jar', SX - 0.12, 1.65, z, 0, { fill: JARS[i], h: i % 3 === 1 ? 0.18 : 0.14, r: 0.04, level: 0.5 + (i % 4) * 0.12, lid: i % 2 ? 'metal' : 'cloth' }));
    spread(-7.8, -5.35, 6, (z, i) => prop(s, 'food.tin', SX - 0.12, 2.05, z, 0, { col: [SAFFRON, TEAL, '#b0302a', '#2f5a4a', SAFFRON, '#3a2a4a'][i], h: 0.14 + (i % 2) * 0.05, r: 0.055 }));

    // ---- the windows: stepped stands of pots under strong lamps that spill onto the pavement ----
    for (const [wx0, wx1, seed] of [[xi0 + 0.2, DX - 0.75, 40], [DX + 0.75, xi1 - 0.2, 50]]) {
      const cx = (wx0 + wx1) / 2, L = wx1 - wx0, zf = Z1 - 0.27;
      prop(s, 'food.hb_staging', cx, 0, zf, 0, { L, kind: 'window' });
      STEPS.window.forEach((st, i) => potRow(wx0 + 0.08, zf + (st[1] + st[2]) / 2, wx1 - 0.08, zf + (st[1] + st[2]) / 2, st[0], seed + i, { r: 0.064, k: 1.05 + i * 0.1, sp: 0.24 }));
      growLamp(wx0 + 0.02, zf - 0.38, wx1 - 0.02, zf - 0.38, 1.72, { power: 4.2, range: 3.4, clip: spill, seg: 2.2 });
    }

    // ---- drying racks over the way in: two ladders hung flat, dozens of bundles ----
    const RKY = 2.62;
    for (const [za, zc] of [[-5.75, -6.2], [-7.0, -7.45]]) {
      const rx0 = 56.35, rx1 = 59.55;
      s.deco((g) => {
        g.mat('wood', ASH, { rough: -0.05 });
        for (const z of [za, zc]) g.box(rx0, RKY - 0.028, z - 0.022, rx1, RKY + 0.028, z + 0.022, { bevel: 0.008 });
        const n = 11; for (let i = 0; i < n; i++) { const x = rx0 + 0.12 + i * (rx1 - rx0 - 0.24) / (n - 1); g.tube([[x, RKY, za + 0.02], [x, RKY, zc - 0.02]], 0.012, { segs: 6 }); }
        g.mat('weave', '#d8cdb0'); for (const x of [rx0 + 0.2, rx1 - 0.2]) for (const z of [za, zc]) g.tube([[x, RKY + 0.028, z], [x, H, z]], 0.005, { segs: 4 });
        g.mat('cast', BRASS); for (const x of [rx0 + 0.2, rx1 - 0.2]) for (const z of [za, zc]) g.cyl(x, H - 0.012, z, 0.018, 0.012, { segs: 8 });
      });
      const rng = new Rng(hashStr('hbrack' + za));
      for (let i = 0; i < 11; i++) {
        const x = rx0 + 0.12 + i * (rx1 - rx0 - 0.24) / 10;
        for (const t of [0.28, 0.72]) {
          if (rng.chance(0.12)) continue;
          prop(s, 'food.bundle', x + rng.f(-0.02, 0.02), RKY - 0.012, za + (zc - za) * t, rng.f(0, 3), { leaf: rng.pick(['#c9d89a', '#b8c888', '#d8d090', '#a8c080', '#c4a8b8']), len: rng.pick([0.06, 0.09, 0.12]), seed: rng.i(0, 5), layer: rng.chance(0.4) ? 'fern' : 'leafB', thread: rng.pick(['#3f7a3a', SAFFRON, '#b0302a']) });
        }
      }
    }
    lamp(s, 'spot', 57.9, 3.18, -6.6, { clip, cone: [40, 18], power: 0.5, K: 3000 });

    // ---- the walls above the banks: herb prints over the picture rail ----
    const PRINT = ['#f2ead2', '#2f5e4e', '#6f9a4a'];
    [['Chervil', 'cut it last'], ['Lovage', 'a little goes a long way'], ['Sorrel', 'a leaf at a time']].forEach((q, i) => sign(s, { kind: 'poster', title: q[0], lines: [q[1]], motif: 'leaf', palette: PRINT }, xi0 + 0.004, 2.74, -11.6 + i * 2.6, { face: 'X', w: 0.5, h: 0.66 }));
    [['Borage', 'a blue flower if you are lucky'], ['Rue', 'never eaten twice']].forEach((q, i) => sign(s, { kind: 'poster', title: q[0], lines: [q[1]], motif: 'leaf', palette: PRINT }, xi1 - 0.004, 2.74, -11.6 + i * 2.2, { face: 'x', w: 0.5, h: 0.66 }));

    // floor: a coir mat at the door, a brass drain by the island
    prop(s, 'rug', DX, 0, -4.62, 0, { w: 1.2, d: 0.5, mat: 'rush', a: '#8a7650', b: '#5a4a32' });
    s.deco((g) => { g.mat('cast', BRASS, { rough: -0.1 }); g.box(DX - 0.15, 0, -7.75, DX + 0.15, 0.004, -7.45); g.mat('grille', '#3a3430'); g.box(DX - 0.13, 0.004, -7.73, DX + 0.13, 0.005, -7.47, { faces: 'Y' }); });

    // ---- the pavement: a saffron cart of pots, the chalkboard, the hanging sign ----
    const KX = 56.5, KZ = -3.42;
    prop(s, 'food.cart', KX, 0, KZ, 0, { w: 1.2, d: 0.6, paint: SAFFRON, wood: '#a07a50' });
    potRow(KX - 0.5, KZ + 0.12, KX + 0.5, KZ + 0.12, 0.62, 60, { r: 0.06, sp: 0.18 });
    potRow(KX - 0.5, KZ - 0.14, KX + 0.5, KZ - 0.14, 0.86, 61, { r: 0.066, sp: 0.18, k: 1.15 });
    plate(s, 'A sprig', '0.03', KX, 0.47, KZ + 0.305, 'Z', 0.12);
    prop(s, 'food.board', 60.1, 0, -3.45, 0, { w: 0.62, h: 1.25, wood: '#24453c' });
    sign(s, SIGNS['herbs.chalk'], 60.1, 0.815, -3.42, { face: 'Z', w: 0.6, h: 0.78, board: false });
    s.deco((g) => {
      const x = X1 - 0.11; g.mat('cast', '#2a2622', { rough: -0.1 });
      g.box(x - 0.04, 2.55, -3.99, x + 0.04, 2.95, -3.95, { bevel: 0.006 });
      g.tube([[x, 2.72, -3.96], [x, 2.72, -3.22]], 0.012, { segs: 6 });
      g.tube([[x, 2.92, -3.96], [x, 2.86, -3.7], [x, 2.76, -3.45], [x, 2.72, -3.36]], 0.009, { segs: 5 });
      g.mat('cast', BRASS); g.ball(x, 2.72, -3.21, 0.02, 0.02, 0.02, { segs: 8, rings: 5 });
      for (const z of [-3.82, -3.38]) g.tube([[x, 2.72, z], [x, 2.66, z]], 0.005, { segs: 4 });
    });
    sign(s, Object.assign({}, SIGNS['herbs.hanging'], { palette: [TEAL, '#f8ecc0', SAFFRON], emblem: 'leaf' }), X1 - 0.11, 2.35, -3.6, { face: 'X', double: true, w: 0.56, h: 0.6, back: TEAL });

    // ---- people ----
    s.spot('counter', 60.9, 0, CZ, -Math.PI / 2, { who: 'amadou', tags: ['herbs'] });
    s.spot('work', 60.3, 0, BZ + 0.68, 0, { who: 'amadou', tags: ['herbs', 'pot'] });
    s.spot('work', 56.55, 0, -9.6, -Math.PI / 2, { tags: ['herbs', 'water'] });
    s.spot('work', 59.95, 0, -10.8, Math.PI / 2, { tags: ['herbs', 'water'] });
    for (const z of [-6.3, -7.35]) s.spot('customer', 59.3, 0, z, Math.PI / 2, { tags: ['herbs'] });
    s.spot('queue', 58.9, 0, -5.4, Math.PI / 2, { tags: ['herbs'] });
    for (const z of [-6.6, -8.4, -11.4]) s.spot('browse', 56.5, 0, z, -Math.PI / 2, { tags: ['herbs'] });
    for (const z of [-9.0, -11.0]) s.spot('browse', 57.0, 0, z, Math.PI / 2, { tags: ['herbs'] });
    s.spot('browse', 59.4, 0, -9.6, -Math.PI / 2, { tags: ['herbs'] });
    s.spot('browse', 59.95, 0, -9.0, Math.PI / 2, { tags: ['herbs'] });
    s.spot('browse', 58.6, 0, -12.35, 0, { tags: ['herbs', 'row'] });
    s.spot('browse', 56.5, 0, -12.45, 0, { tags: ['herbs', 'flats'] });
    s.spot('browse', DX, 0, -12.2, 0, { tags: ['herbs', 'seed'] });
    s.spot('browse', 56.4, 0, -5.4, Math.PI, { tags: ['herbs', 'window'] });
    s.spot('chat', 57.6, 0, -7.0, 2.4, { tags: ['herbs'] }); s.spot('chat', 58.3, 0, -7.6, -0.6, { tags: ['herbs'] });
    s.spot('browse', KX, 0, -2.6, 0, { tags: ['herbs', 'street'] }); s.spot('browse', 60.1, 0, -2.7, 0, { tags: ['herbs', 'street'] });
    s.path([[DX, -2.5], [DX, -4.6], [DX, -6.6]]);
    s.path([[DX, -6.6], [59.3, -7.4], [59.4, -9.0], [59.5, -12.1], [58.3, -12.35], [56.7, -12.1], [56.6, -9.0], [56.8, -7.2], [DX, -6.6]]);
    s.path([[59.3, -7.4], [59.3, -6.3]]);

    // ---- things to do ----
    s.interact({
      x: CX - 0.3, y: 1.1, z: CZ, radius: 1.3, kind: 'talk', prompt: 'Talk to Amadou',
      async onUse(gm) {
        if (!gm.ui) return;
        gm.flags = gm.flags || {};
        if (gm.journal && gm.journal.meet) gm.journal.meet('amadou');
        if (!gm.flags.hbMet) { gm.flags.hbMet = true; await sayAs(gm, AMADOU, ['Where did you sleep? Good. Have you eaten?', "Then you're here for a sprig. Everyone who comes through that door is going to somebody's table."]); }
        let pick = null; gm.busy++;
        try { pick = await gm.ui.choose(AMADOU, 'What can I cut you?', [{ label: 'Buy a sprig', value: 'buy' }, { label: 'Ask for the Row in sprigs', value: 'row' }, { label: 'Ask why not gin', value: 'gin' }, { label: 'Ask about the lamps', value: 'lamps' }]); } finally { gm.busy--; }
        if (pick === 'buy') { const it = await buyFrom(gm, MENUS.herbs, 'Amadou'); if (it) { if (it.id === 'host-sprig' && gm.inv && gm.inv.give) gm.inv.give('host-sprig'); await sayAs(gm, AMADOU, BOUGHT[it.id] || 'In a twist of paper. Keep it out of the heat.'); } }
        else if (pick === 'row') { await sayAs(gm, AMADOU, ROWTALK); if (gm.journal) gm.journal.find('herb-row'); }
        else if (pick === 'gin') { await sayAs(gm, AMADOU, GIN); if (gm.journal) gm.journal.find('bring-herbs'); }
        else if (pick === 'lamps') await sayAs(gm, AMADOU, LAMPS);
      },
    });
    s.interact({
      x: DX, y: 1.1, z: -10.0, radius: 1.3, prompt: 'Smell the herbs',
      onUse(gm) { return sayAs(gm, { name: 'The island', colour: '#a9e08a' }, SMELL); },
    });
    s.interact({
      x: 58.3, y: 1.8, z: zb + 0.3, radius: 1.2, prompt: 'Look at the Row, a pot for each drum',
      async onUse(gm) { await sayAs(gm, { name: 'The Row', colour: '#e8c25a' }, ROWSHELF); if (gm.journal) gm.journal.find('herb-row'); },
    });
    s.interact({
      x: DRX - 0.6, y: 0.8, z: zb + 0.5, radius: 1.0, prompt: 'Open a seed drawer',
      onUse(gm) { gm.flags = gm.flags || {}; const i = (gm.flags.hbDrawer || 0) % DRAWERS.length; gm.flags.hbDrawer = i + 1; if (gm.sfxAt) gm.sfxAt('clunk', f, DRX - 0.6, 0.8, zb + 0.45); return sayAs(gm, { name: 'A seed drawer', colour: '#e3a91f' }, DRAWERS[i]); },
    });
    s.interact({
      x: DRX + 0.4, y: 2.4, z: zb + 0.4, radius: 1.4, prompt: 'Read the sign over the drawers',
      async onUse(gm) { await sayAs(gm, { name: 'Bring herbs, not gin', colour: '#a9d8c8' }, SIGNTEXT); if (gm.journal) gm.journal.find('bring-herbs'); },
    });
    s.interact({
      x: DX, y: 2.2, z: -3.7, radius: 1.1, prompt: 'Read the sign over the door',
      async onUse(gm) { await sayAs(gm, { name: 'BRING HERBS, NOT GIN', colour: '#e8c25a' }, SIGNTEXT); if (gm.journal) gm.journal.find('bring-herbs'); },
    });
    s.interact({
      x: (FX0 + FX1) / 2, y: 1.0, z: zb + 0.4, radius: 0.9, prompt: 'Look at the little pots',
      onUse(gm) { return sayAs(gm, { name: 'For a flat with no window', colour: '#a9e08a' }, FLATS); },
    });
    s.interact({
      x: 60.1, y: 0.9, z: -3.35, radius: 1.0, prompt: 'Read the board',
      onUse(gm) { const c = SIGNS['herbs.chalk']; return sayAs(gm, { name: 'The board', colour: '#f4e9c9' }, [c.title.replace(' · ', ', ') + '.'].concat(c.lines.map((l) => l.split(' · ').join(', ') + '.'))); },
    });

    // the misting pipe hisses faintly once you are inside
    let mist = null;
    s.trigger({ box: [X0, 0, Z0, X1, H, Z1], onEnter(gm) { if (!mist && gm.audio && gm.loopAt) mist = gm.loopAt('steam', f, DX, 2.2, -10.0, { vol: 0.15, radius: 4 }); } });

    s.zoneBox({ id: 'herbs', place: 'herbs', box: [X0, 0, Z0, X1, H, Z1], name: 'Bring Herbs, Not Gin', sub: 'Ladle Row', ambience: 'shop', reverb: 'room' });
    s.finish();
    game.spawns.herbs = { frame: f, x: DX, y: 0, z: -5, yaw: 0 };
  },
};

const BOUGHT = {
  'host-sprig': ['Tied with green thread.', "Hand it over at the door, before your coat's off. That's when it counts."],
  chervil: 'Our own. Put it on last. It sulks in the heat.',
  lovage: 'A little goes a long way. Same as the drum.',
  sorrel: 'Eat a leaf now and you will see what I mean.',
  coriander: 'If they ask what it is, tell them it was cut this morning.',
  shiso: 'Wrap your rice in it. Wrap anything in it.',
  borage: "There's a flower on that one. You're lucky.",
  rue: "For a joke, then. Watch their face when they taste it.",
  'row-sprigs': ['The Row in a bundle, chervil in the middle where it belongs.', 'Tansy stays in its pot. Ask anyone from Tansy.'],
  cutting: ['Keep it under your lamp and water it when the soil goes pale.', 'Bring the pot back when the plant is bigger than it is. Somebody needs it after you.'],
};
const ROWTALK = [
  'Seven drums founded together and named for herbs, so here they are, a pot for each.',
  'Sorrel, Lovage, Tansy, Rue, Chervil, Yarrow, Borage. Three hundredths a sprig, or six of them tied together for eighteen.',
  "Tansy I keep for looking at. It's bitter, and the Tansy people would rather you bought their strawberries.",
];
const GIN = [
  'A bottle of gin is 2.8. Less than one apple. It says you walked past the hall on your way.',
  "A sprig is three hundredths of a kay, and it says you thought about whose table you'd be sitting at.",
];
const LAMPS = [
  "Five grams of herbs a day, one person's worth, takes a watt or two of lamp. It's the cheapest light in the drum that you can eat.",
  'The shop lamps go down at eleven with everything else. The grow lamps stay up all night, the Row at the back too.',
];
const SMELL = [
  'Chervil first, faintly of aniseed. Then the lemon of sorrel, the celery of lovage, and something like cucumber from the borage.',
  'Under it all, warm wet soil, and a cool breath every few seconds from the misting pipe.',
];
const ROWSHELF = [
  'Seven pots on a shelf of their own, under a lamp on two brass arms: Sorrel, Lovage, Tansy, Chervil, Rue, Yarrow, Borage.',
  'One for each drum on that stretch of the Row, founded together and named for herbs. Chervil sits in the middle, in a saffron pot.',
  "Every plate says 0.03 except two. Chervil's says our own. Tansy's says to look at.",
];
const DRAWERS = [
  ['Coriander seed, round and pale, in paper twists.', 'The label has been rewritten in three different hands.'],
  ['Borage seed, black and ridged.', 'Someone has drawn a small blue flower on the label.'],
  ['Chervil, nearly empty.', 'Half the block sows a pot of it before Booking Day.'],
  ['Sorrel seed, sent down from Sorrel.', "Someone has written thank you on the twist."],
  ['Basil, twelve twists of it.', 'A note in the drawer says: ask before you take.'],
];
const SIGNTEXT = [
  'Bring herbs, not gin.',
  'A sprig from your shelf is the classic gift for a host: three hundredths of a kay.',
  'A whole bottle of gin is 2.8, less than one apple, and too cheap to say anything.',
];
const FLATS = [
  'Thumb-sized pots of basil, chives and mint, each with a paper tag, under a strip of white light.',
  'A rooted cutting is 0.06. The pot is lent, and goes back when the plant is bigger than it.',
];
