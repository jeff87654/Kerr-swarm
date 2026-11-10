// The Keeping Room, the larder shop on Ladle Row: a stone cellar of things that keep. Cool light on grey limewash and
// flagstones under low stone ribs, oak racks of cheese, hams over the table, and at the end of the view the wall of
// household crocks with its rolling ladder, washed from above. Two warm pools over the tasting counter, where Zhenya
// lays out the keeping board, and one rust-orange accent through it all: glaze, enamel shades, the awning of the poster.
import { lamp, block, warm } from '../world/kit.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { MENUS } from '../content/menus.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';
import { unit, dome, plate, buyFrom, sayAs, spread, foodParts } from './food_parts.js';

const TAU = Math.PI * 2;
// palette: grey limewash, stone, dark oak, slate-plum paint, cream paper, and the accent: rust-orange glaze
const LIME = '#7c7e7b', DADO = '#5a5b59', FLAG = '#73726d', CEIL = '#666865', RIB = '#8c8b84', OAK = '#3e2c20', OAK2 = '#5c412c';
const SLATE = '#2e2a33', RUST = '#b5532e', CREAM = '#ece2c8', PAPER = '#efe6cf', IRON = '#2f2c2a', BRASS = '#b08a45';
const GLAZES = ['#8a5a34', '#3a2a22', '#d4c8ac', '#8c9a86', '#5e6872', RUST, '#a87838', '#6a3a26', '#d4c8ac', '#8a5a34'];
const ZHENYA = { name: 'Zhenya', colour: '#d6a640' };

// ---------------------------------------------------------------------------------------------------------------
// Props of this shop (food.ld_*)
// ---------------------------------------------------------------------------------------------------------------

// A stoneware crock, dipped: bare clay at the foot, glaze above. p: { glaze, h, r, lid: 'glaze' | 'wood' | 'cloth' | 'none', cloth, band, label, tag }
defineProp('food.ld_crock', (g, p) => {
  const h = p.h || 0.26, r = p.r || 0.1, c = p.glaze || '#8a5a34', S = p.segs || 12;
  g.mat('plaster', '#b39a7c', { rough: 0.2 }); g.lathe(0, 0, [[0, 0], [r * 0.8, 0], [r * 0.9, h * 0.05], [r * 0.97, h * 0.13]], { segs: S, capTop: false });
  g.mat('glaze', c, { rough: -0.18 });
  g.lathe(0, 0, [[r * 0.97, h * 0.13], [r * 1.02, h * 0.48], [r * 0.93, h * 0.76], [r * 0.77, h * 0.86], [r * 0.81, h * 0.92], [r * 0.74, h * 0.92]], { segs: S, capTop: false, capBottom: false });
  if (p.band) { g.mat('glaze', p.band, { rough: -0.18 }); g.lathe(0, 0, [[r * 1.024, h * 0.3], [r * 1.028, h * 0.36]], { segs: S, capTop: false, capBottom: false }); }
  const lid = p.lid || 'glaze';
  if (lid === 'cloth') {
    g.mat('weave', p.cloth || '#e6dcc4'); g.ball(0, h * 0.9, 0, r * 0.88, h * 0.09, r * 0.88, { segs: S, rings: 3, bottom: 0 });
    g.lathe(0, 0, [[r * 0.9, h * 0.76], [r * 0.85, h * 0.9]], { segs: S, capTop: false, capBottom: false });
    g.mat('weave', p.string || RUST); g.lathe(0, 0, [[r * 0.82, h * 0.83], [r * 0.82, h * 0.86]], { segs: S, capTop: false, capBottom: false });
  } else if (lid === 'wood') {
    g.mat('wood', p.wood || '#6a4a2e'); g.cyl(0, h * 0.915, 0, r * 0.86, 0.016, { segs: S }); g.cyl(0, h * 0.915 + 0.016, 0, 0.016, 0.02, { segs: 6 });
  } else if (lid === 'none') {
    g.mat('plain', '#2a221c'); g.cyl(0, h * 0.78, 0, r * 0.74, 0.004, { segs: S });
  } else {
    g.mat('glaze', p.lidTint || shadeHex(c, 1.2), { rough: -0.18 }); g.lathe(0, 0, [[r * 0.82, h * 0.91], [r * 0.6, h * 0.99], [r * 0.2, h * 1.03], [r * 0.19, h * 1.08], [0, h * 1.085]], { segs: S, capBottom: false });
  }
  if (p.label) { g.mat('paper', PAPER); g.lathe(0, 0, [[r * 1.034, h * 0.4], [r * 1.036, h * 0.58]], { segs: S, capTop: false, capBottom: false }); }
  if (p.tag) {           // a paper tag on a string round the neck, hanging at the front
    g.mat('weave', '#d8cdb0'); g.tube([[-r * 0.5, h * 0.86, r * 0.62], [0, h * 0.7, r * 1.02], [0.01, h * 0.62, r * 1.06]], 0.0018, { segs: 3 });
    g.mat('paper', p.tag === true ? '#e9dcc0' : p.tag); g.push(); g.move(0.01, h * 0.55, r * 1.07); g.rotZ(0.12); g.box(-0.022, -0.035, -0.001, 0.022, 0.035, 0.001); g.pop();
  }
  return { posts: h > 0.38 ? [[0, 0, r, 0, h]] : null, cast: h > 0.3 };
});

// A slatted oak rack for turning cheeses. Front toward +z. p: { w, d, h, levels, wood }
defineProp('food.ld_rack', (g, p) => {
  const w = p.w || 2, d = p.d || 0.55, L = p.levels || [0.12, 0.55, 0.98, 1.41, 1.84], top = p.h || 2.25, wood = p.wood || OAK;
  g.mat('wood', wood, { rough: -0.05 });
  for (const x of [-w / 2 + 0.03, 0, w / 2 - 0.03]) for (const z of [-d / 2 + 0.03, d / 2 - 0.03]) g.box(x - 0.03, 0, z - 0.03, x + 0.03, top, z + 0.03, { bevel: 0.006 });
  for (const y of L) for (const z of [-d / 2 + 0.03, d / 2 - 0.03]) g.box(-w / 2, y - 0.07, z - 0.022, w / 2, y - 0.025, z + 0.022, { bevel: 0.005 });
  g.box(-w / 2 - 0.02, top, -d / 2 - 0.01, w / 2 + 0.02, top + 0.04, d / 2 + 0.03, { bevel: 0.008 });
  g.mat('wood', shadeHex(wood, 1.35), { rough: 0.05 });
  for (const y of L) { const n = 6; for (let i = 0; i < n; i++) { const z = -d / 2 + 0.06 + i * (d - 0.12) / (n - 1); g.box(-w / 2 + 0.01, y - 0.025, z - 0.02, w / 2 - 0.01, y, z + 0.02, { bevel: 0.004 }); } }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, top + 0.04, d / 2]], tier: 's' };
});

// A cheesecloth cover drawn over a wheel. p: { r, h, col }
defineProp('food.ld_cloth', (g, p) => {
  const r = p.r || 0.17, h = p.h || 0.1, c = p.col || '#e6dcc0';
  g.mat('weave', c, { rough: 0.15 });
  g.lathe(0, 0, [[r * 1.07, h * 0.2], [r * 1.065, h * 0.45], [r * 1.05, h * 0.85], [r * 1.0, h * 1.04], [r * 0.75, h * 1.1], [r * 0.35, h * 1.13], [0, h * 1.14]], { segs: 18, capBottom: false });
  g.mat('weave', p.tie || RUST); g.lathe(0, 0, [[r * 1.072, h * 0.55], [r * 1.072, h * 0.62]], { segs: 18, capTop: false, capBottom: false });
  return { cast: false };
});

// A pendant shade in rust enamel, hanging from y = 0 down a cord of length L. p: { L, col }
defineProp('food.ld_shade', (g, p) => {
  const L = p.L || 1.2, y = -L, c = p.col || RUST;
  g.mat('brushed', IRON); g.tube([[0, 0, 0], [0, y + 0.01, 0]], 0.005, { segs: 4, caps: false }); g.cyl(0, -0.03, 0, 0.045, 0.03, { segs: 10 });
  g.mat('cast', BRASS, { rough: -0.15 }); g.cyl(0, y - 0.02, 0, 0.026, 0.04, { segs: 10 });
  g.mat('paint', c, { rough: -0.28 }); g.lathe(0, 0, [[0.21, y - 0.17], [0.2, y - 0.16], [0.14, y - 0.1], [0.06, y - 0.04], [0.03, y - 0.02]], { segs: 20, capTop: false, capBottom: false });
  g.mat('paint', '#efe6d4', { rough: -0.2 }); g.lathe(0, 0, [[0.21, y - 0.175], [0.212, y - 0.165]], { segs: 20, capTop: false, capBottom: false });
  g.mat('plain', '#f6e6c8', { emissive: 0.4, lamp: true }); g.lathe(0, 0, [[0.028, y - 0.02], [0.058, y - 0.04], [0.138, y - 0.1], [0.198, y - 0.16]], { segs: 20, capTop: false, capBottom: false });
  g.mat('plain', '#fff0c8', { emissive: 4, lamp: true }); g.ball(0, y - 0.07, 0, 0.03, 0.034, 0.03, { segs: 10, rings: 6 });
  return { cast: false };
});

// The keeping board: three cheeses, ham cut thin, hard rusks and two small lidded dishes on oak. Front toward +z.
defineProp('food.ld_board', (g) => {
  const w = 0.42, d = 0.24, y = 0.022;
  g.mat('wood', '#6a4a2e', { rough: -0.1 }); g.box(-w / 2, 0, -d / 2, w / 2, y, d / 2, { bevel: 0.006 }); g.box(w / 2 - 0.01, 0.004, -0.028, w / 2 + 0.06, 0.018, 0.028, { bevel: 0.006 });
  // three wedges, points to the front
  const W = [[-0.15, '#f0d48a', '#c99a4a'], [-0.075, '#f6ecd0', '#e2d6b8'], [0.0, '#e8b850', '#7a4a26']];
  for (const [x, paste, rind] of W) {
    g.mat('plaster', paste, { rough: 0.15 }); g.prism([[x - 0.028, -0.07], [x + 0.028, -0.07], [x, 0.02]], y, y + 0.032);
    g.mat('plaster', rind, { rough: 0.2 }); g.box(x - 0.029, y, -0.078, x + 0.029, y + 0.033, -0.07);
  }
  // ham, folded thin
  g.mat('plain', '#b25a46', { rough: -0.12 });
  for (let i = 0; i < 4; i++) { g.push(); g.move(0.075 + (i % 2) * 0.03, y + 0.006 + i * 0.002, -0.07 + i * 0.03); g.rotY(0.4 + i * 0.5); g.ball(0, 0, 0, 0.034, 0.007, 0.022, { segs: 8, rings: 3 }); g.pop(); }
  g.mat('plain', '#e6c8b8'); for (let i = 0; i < 3; i++) g.box(0.06 + i * 0.022, y + 0.009, -0.06 + i * 0.03, 0.07 + i * 0.022, y + 0.012, -0.05 + i * 0.03);
  // rusks, fanned
  g.mat('plaster', '#c8955a', { rough: 0.1 });
  for (let i = 0; i < 4; i++) { g.push(); g.move(-0.1 + i * 0.03, y, 0.075); g.rotY(-0.3 + i * 0.08); g.rotX(-0.25); g.box(-0.012, 0, -0.025, 0.012, 0.045, 0.025, { bevel: 0.005 }); g.pop(); }
  // two small lidded dishes: miso-glazed curd, and preserves
  for (const [x, z, c] of [[0.16, -0.05, RUST], [0.16, 0.055, '#d8ccb0']]) {
    g.mat('glaze', c, { rough: -0.2 }); g.lathe(x, z, [[0, y], [0.022, y], [0.032, y + 0.018], [0.033, y + 0.026]], { segs: 12, capTop: false });
    g.mat('glaze', shadeHex(c, 1.15), { rough: -0.2 }); g.lathe(x, z, [[0.035, y + 0.026], [0.03, y + 0.034], [0.01, y + 0.042], [0.009, y + 0.05], [0, y + 0.051]], { segs: 12, capBottom: false });
  }
  return { cast: false };
});

// An opaque domed food cover, set down beside a board. p: { r, col }
defineProp('food.ld_cover', (g, p) => {
  const r = p.r || 0.2, c = p.col || '#d8ccb0';
  g.mat('glaze', c, { rough: -0.22 }); g.lathe(0, 0, [[r, 0], [r * 0.98, r * 0.18], [r * 0.85, r * 0.4], [r * 0.55, r * 0.56], [0, r * 0.62]], { segs: 20, capBottom: false });
  g.mat('wood', OAK2); g.ball(0, r * 0.66, 0, 0.022, 0.03, 0.022, { segs: 8, rings: 5 });
  g.mat('glaze', RUST); g.lathe(0, 0, [[r * 1.003, r * 0.05], [r * 0.999, r * 0.1]], { segs: 20, capTop: false, capBottom: false });
  return { cast: false };
});

// A barrel with iron hoops and a slate on top. p: { r, h, wood }
defineProp('food.ld_barrel', (g, p) => {
  const r = p.r || 0.28, h = p.h || 0.8, rad = (t) => r * (0.86 + 0.14 * Math.sin(Math.PI * t));
  g.mat('wood', p.wood || '#7a5636', { rough: -0.05 });
  const P = []; for (let i = 0; i <= 8; i++) P.push([rad(i / 8), h * i / 8]);
  g.lathe(0, 0, [[0, 0]].concat(P).concat([[0, h]]), { segs: 20 });
  g.mat('wood', shadeHex(p.wood || '#7a5636', 0.65)); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; g.tube([0.02, 0.25, 0.5, 0.75, 0.98].map((t) => [Math.cos(a) * (rad(t) + 0.001), h * t, Math.sin(a) * (rad(t) + 0.001)]), 0.003, { segs: 3, caps: false }); }
  g.mat('cast', IRON, { rough: 0.05 }); for (const t of [0.07, 0.28, 0.72, 0.93]) g.lathe(0, 0, [[rad(t) + 0.004, h * t - 0.022], [rad(t) + 0.007, h * t], [rad(t) + 0.004, h * t + 0.022]], { segs: 20, capTop: false, capBottom: false });
  g.mat('stone', '#4a4a4e', { rough: -0.1 }); g.cyl(0, h, 0, r * 0.98, 0.025, { segs: 20 });
  return { posts: [[0, 0, r, 0, h + 0.025]], tier: 's' };
});

// A cane basket of hard rusks, sliced and dried. p: { w, d, cane }
defineProp('food.ld_rusks', (g, p) => {
  const w = p.w || 0.34, d = p.d || 0.22, h = 0.09, cane = p.cane || '#b48a52', rng = new Rng(hashStr('ldr' + w + d));
  g.mat('cane', cane); g.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, { bevel: 0.012, faces: 'xXzZy' });
  g.mat('cane', shadeHex(cane, 0.8)); g.tube([[-w / 2, h, -d / 2], [w / 2, h, -d / 2], [w / 2, h, d / 2], [-w / 2, h, d / 2]], 0.01, { segs: 5, closed: true });
  g.mat('weave', '#e9dfc8'); g.box(-w / 2 + 0.015, h - 0.025, -d / 2 + 0.015, w / 2 - 0.015, h - 0.018, d / 2 - 0.015, { faces: 'Y' });
  g.mat('plaster', '#c8955a', { rough: 0.1 });
  const n = Math.floor((w - 0.04) / 0.032);
  for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) { g.push(); g.move(-w / 2 + 0.03 + i * 0.032, h - 0.02 + row * 0.012, (row ? 0.04 : -0.04) * d / 0.22); g.rotZ(rng.f(-0.35, -0.15)); g.rotY(rng.f(-0.1, 0.1)); g.box(-0.008, 0, -0.045, 0.008, 0.05, 0.045, { bevel: 0.005 }); g.pop(); }
  return { cast: false };
});

// A glazed dish of black garlic: papery heads, one cut to show the black cloves. p: { n }
defineProp('food.ld_garlic', (g, p) => {
  const n = p.n || 5, rng = new Rng(hashStr('ldg' + n));
  g.mat('glaze', '#3a2a22', { rough: -0.2 }); g.lathe(0, 0, [[0.06, 0], [0.08, 0.008], [0.11, 0.035], [0.104, 0.037], [0.07, 0.014], [0, 0.012]], { segs: 18 });
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + rng.f(-0.2, 0.2), rr = i === 0 ? 0 : 0.055, x = Math.cos(a) * rr, z = Math.sin(a) * rr, y = 0.012 + (i === 0 ? 0.012 : 0);
    g.mat('paper', mixHex('#ddd0bc', '#b89aa8', rng.f(0, 0.4)), { rough: 0.15 }); g.lathe(x, z, [[0, y], [0.016, y + 0.004], [0.025, y + 0.016], [0.022, y + 0.03], [0.008, y + 0.042], [0.002, y + 0.05]], { segs: 10 });
  }
  g.mat('plain', '#1e1a18', { rough: -0.2 }); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; g.ball(0.035 + Math.cos(a) * 0.009, 0.03, -0.04 + Math.sin(a) * 0.009, 0.008, 0.012, 0.008, { segs: 6, rings: 4 }); }
  return { cast: false };
});

// A stepped oak stand for jars, three tiers, tops at y 0.1, 0.27, 0.44 and z +0.13, 0, -0.13. p: { w }
defineProp('food.ld_stand', (g, p) => {
  const w = p.w || 1.3, T = [[0.1, 0.13], [0.27, 0], [0.44, -0.13]];
  g.mat('wood', OAK, { rough: -0.05 });
  for (const t of T) g.box(-w / 2, t[0] - 0.025, t[1] - 0.065, w / 2, t[0], t[1] + 0.065, { bevel: 0.006 });
  for (const sx of [-1, 1]) g.prism([[sx * w / 2 - 0.02, -0.2], [sx * w / 2 + 0.005, -0.2], [sx * w / 2 + 0.005, 0.2], [sx * w / 2 - 0.02, 0.2]], 0, 0.1).prism([[sx * w / 2 - 0.02, -0.2], [sx * w / 2 + 0.005, -0.2], [sx * w / 2 + 0.005, 0.065], [sx * w / 2 - 0.02, 0.065]], 0.1, 0.27).prism([[sx * w / 2 - 0.02, -0.2], [sx * w / 2 + 0.005, -0.2], [sx * w / 2 + 0.005, -0.065], [sx * w / 2 - 0.02, -0.065]], 0.27, 0.44);
  g.mat('cast', BRASS, { rough: -0.1 }); for (const t of T) g.box(-w / 2, t[0] - 0.022, t[1] + 0.065, w / 2, t[0] - 0.004, t[1] + 0.068);
  return { cast: false };
});

// A stack of crock lids waiting to be washed, and a cloth. p: { n }
defineProp('food.ld_lids', (g, p) => {
  const n = p.n || 4, rng = new Rng(hashStr('ldl' + n));
  for (let i = 0; i < n; i++) { const c = rng.pick(GLAZES), r = rng.f(0.075, 0.095), y = i * 0.022, x = rng.f(-0.008, 0.008); g.mat('glaze', c, { rough: -0.18 }); g.lathe(x, 0, [[r, y], [r * 0.7, y + 0.016], [r * 0.2, y + 0.022], [0, y + 0.023]], { segs: 12 }); }
  return { cast: false };
});

// A zinc washing tub, a little water in it. p: { r }
defineProp('food.ld_tub', (g, p) => {
  const r = p.r || 0.2;
  g.mat('brushed', '#9a9890', { rough: 0.15 }); g.lathe(0, 0, [[0, 0], [r * 0.85, 0], [r, 0.2], [r * 1.04, 0.21], [r * 0.98, 0.21], [r * 0.82, 0.012]], { segs: 18 });
  g.mat('plain', '#5a6a70', { rough: -0.45 }); g.cyl(0, 0.08, 0, r * 0.9, 0.002, { segs: 16 });
  g.mat('cast', IRON); for (const sx of [-1, 1]) g.tube([[sx * r * 1.0, 0.17, -0.03], [sx * r * 1.07, 0.17, 0], [sx * r * 1.0, 0.17, 0.03]], 0.006, { segs: 4 });
  return { cast: false };
});

// A hand lamp (unlit): brass foot, a frosted chimney, a cap and a wire handle. Knotnight is lit with these.
defineProp('food.ld_handlamp', (g, p) => {
  const c = p.col || BRASS;
  g.mat('cast', c, { rough: -0.15 }); g.lathe(0, 0, [[0, 0], [0.045, 0], [0.048, 0.01], [0.038, 0.03], [0.03, 0.04]], { segs: 14 });
  g.mat('plain', '#e8e4d8', { rough: -0.3 }); g.lathe(0, 0, [[0.03, 0.04], [0.036, 0.07], [0.034, 0.12], [0.024, 0.15]], { segs: 14, capBottom: false, capTop: false });
  g.mat('cast', c, { rough: -0.15 }); g.lathe(0, 0, [[0.026, 0.148], [0.03, 0.16], [0.012, 0.175], [0, 0.178]], { segs: 12, capBottom: false });
  g.mat('cast', IRON); const arc = []; for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; arc.push([Math.cos(a) * 0.04, 0.17 + Math.sin(a) * 0.06, 0]); } g.tube(arc, 0.0025, { segs: 3 });
  if (p.tag) { g.mat('paper', p.tag); g.box(0.035, 0.2, -0.001, 0.07, 0.235, 0.001); }
  return { cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// The place
// ---------------------------------------------------------------------------------------------------------------

export const place = {
  id: 'larder', name: 'The Keeping Room', order: 42,
  build(game) {
    void foodParts;
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('larder', f);
    const X0 = 47, X1 = 55, Z0 = -13.5, Z1 = -4, H = 3.2;
    const xi0 = X0 + 0.16, xi1 = X1 - 0.16, zb = Z0 + 0.16;          // inner faces of the walls

    const U = unit(s, {
      x0: X0, x1: X1, z0: Z0, z1: Z1, h: H,
      floor: ['stone', FLAG], ceil: ['plaster', CEIL],
      wall: { tint: LIME, mat: 'plaster', dado: { h: 0.95, mat: 'stone', tint: DADO }, skirt: '#2e2925' },
      beams: false, rail: OAK,
      front: {
        fascia: Object.assign({}, SIGNS['larder.fascia'], { palette: [SLATE, CREAM, '#d8794a'], emblem: 'cup' }),
        palette: { frame: SLATE, plinth: '#5a3424', awning: [RUST, CREAM, SLATE, CREAM] },
        door: { at: 51 - 0.55 - (X0 + 0.22), w: 1.1, tint: SLATE }, glow: 0.5, awning: { depth: 0.9 },
      },
      backDoor: { at: 6.5, w: 0.85, label: 'the cold store', tint: SLATE, text: 'The cold store. Staff only.' },
      glow: { sky: '#b4bfcc', ground: '#5a5046', power: 0.09 },
    });
    const clip = U.clip, spill = U.spill;
    const nrm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
    // a lit strip with no fitting but a thin diffuser
    const glowStrip = (a, b, o) => {
      s.deco((g) => { g.mat('diffuser', o.tint || '#f2f4ff', { emissive: 0.9, lamp: o.lamp !== false }); g.box(Math.min(a[0], b[0]) - 0.015, a[1] - 0.012, Math.min(a[2], b[2]) - 0.015, Math.max(a[0], b[0]) + 0.015, a[1], Math.max(a[2], b[2]) + 0.015, { faces: 'yxXzZ' }); });
      s.light({ at: [a[0], a[1] - 0.03, a[2]], to: [b[0], b[1] - 0.03, b[2]], type: 'tube', color: warm(o.K || 3800), power: 5 * o.power, range: o.range || 3, radius: 0.04, clip, lamp: o.lamp !== false });
    };
    // a brass price plate standing on a surface at height y
    const tag = (t, sb, x, y, z, face, w) => {
      const h = w * 0.46, d = face === 'Z' || face === 'X' ? -1 : 1, alongX = face === 'Z' || face === 'z';
      sign(s, { kind: 'plate', text: t, lines: sb ? [sb] : undefined }, x, y + h / 2 + 0.006, z, { face, w, h, board: false, glow: 0.18 });
      s.detail((g) => {
        g.mat('cast', BRASS, { rough: -0.1 });
        if (alongX) { g.box(x - w * 0.42, y, Math.min(z, z + d * 0.025), x + w * 0.42, y + 0.006, Math.max(z, z + d * 0.025)); g.box(x - 0.004, y, Math.min(z + d * 0.003, z + d * 0.02), x + 0.004, y + h * 0.8, Math.max(z + d * 0.003, z + d * 0.02)); }
        else { g.box(Math.min(x, x + d * 0.025), y, z - w * 0.42, Math.max(x, x + d * 0.025), y + 0.006, z + w * 0.42); g.box(Math.min(x + d * 0.003, x + d * 0.02), y, z - 0.004, Math.max(x + d * 0.003, x + d * 0.02), y + h * 0.8, z + 0.004); }
      });
    };

    // ---- the vault: three low stone ribs across the room on corbels, a pipe run through them ----
    const R = 13.68, YC = 3.05 - R, archY = (x) => YC + Math.sqrt(R * R - (x - 51) * (x - 51));
    const RIBS = [-11.9, -9.35, -6.8];
    for (const zc of RIBS) {
      s.structure((g) => {
        const N = 20, t = 0.12;
        g.mat('stone', RIB, { rough: 0.1 });
        for (let i = 0; i < N; i++) {
          const xa = xi0 + (xi1 - xi0) * i / N, xb = xi0 + (xi1 - xi0) * (i + 1) / N, ya = archY(xa), yb = archY(xb);
          g.quad([xa, ya, zc + t], [xb, yb, zc + t], [xb, H, zc + t], [xa, H, zc + t]);
          g.quad([xb, yb, zc - t], [xa, ya, zc - t], [xa, H, zc - t], [xb, H, zc - t]);
          g.quad([xa, ya, zc - t], [xb, yb, zc - t], [xb, yb, zc + t], [xa, ya, zc + t]);
        }
        for (const side of [-1, 1]) {
          const w0 = side < 0 ? xi0 : xi1, o = -side;
          g.box(Math.min(w0, w0 + o * 0.22), 2.36, zc - 0.16, Math.max(w0, w0 + o * 0.22), 2.54, zc + 0.16, { bevel: 0.02 });
          g.box(Math.min(w0, w0 + o * 0.14), 2.3, zc - 0.12, Math.max(w0, w0 + o * 0.14), 2.36, zc + 0.12, { bevel: 0.012 });
        }
      });
    }
    s.structure((g) => {
      g.mat('cast', '#9a6a44', { rough: -0.1 }); g.tube([[50.32, 3.1, zb + 0.05], [50.32, 3.1, Z1 - 0.4]], 0.035, { segs: 10 });
      g.mat('paint', '#4a5058', { rough: -0.1 }); g.tube([[50.5, 3.11, zb + 0.05], [50.5, 3.11, Z1 - 0.4]], 0.045, { segs: 10 });
      g.mat('cast', IRON); for (const z of [-12.6, -10.6, -8.1, -5.4]) { g.box(50.24, 3.03, z - 0.02, 50.58, 3.05, z + 0.02); g.box(50.24, 3.03, z - 0.02, 50.26, 3.2, z + 0.02); g.box(50.56, 3.03, z - 0.02, 50.58, 3.2, z + 0.02); }
      g.mat('cast', '#3a3430', { rough: -0.1 }); g.box(52.4, H - 0.012, -5.9, 53.2, H, -5.4, { bevel: 0.004 });
      g.mat('grille', '#3a3430'); g.box(52.45, H - 0.014, -5.85, 53.15, H - 0.012, -5.45, { faces: 'y' });
    });

    // ---- the crock wall: floor to ceiling, seven bays of household crocks, a rail and the ladder ----
    const CW0 = 47.3, CW1 = 53.3, CF = zb + 0.4, NB = 7, BW = (CW1 - CW0) / NB;
    const LV = [0.1, 0.62, 0.96, 1.3, 1.64, 1.98, 2.32, 2.66], PEL = 2.98;
    s.furniture((g) => {
      g.mat('wood', shadeHex(OAK, 0.62)); g.box(CW0, 0.1, zb, CW1, PEL, zb + 0.02, { faces: 'Z' });
      g.mat('wood', shadeHex(OAK, 0.5)); for (let i = 0; i < 20; i++) { const x = CW0 + 0.15 + i * 0.3; g.box(x - 0.004, 0.1, zb + 0.02, x + 0.004, PEL, zb + 0.024, { faces: 'Z' }); }
      g.mat('wood', OAK, { rough: -0.05 });
      for (let i = 0; i <= NB; i++) { const x = CW0 + i * BW; g.box(x - 0.03, 0, zb, x + 0.03, PEL, CF + 0.012, { bevel: 0.008 }); }
      g.mat('wood', shadeHex(OAK, 0.55)); g.box(CW0, 0, CF - 0.05, CW1, 0.1, CF, { aoBottom: 0.6 });
      g.mat('wood', OAK, { rough: -0.05 });
      for (const L of LV) { g.box(CW0, L - 0.035, zb + 0.02, CW1, L, CF, { faces: 'yYZ' }); g.box(CW0, L - 0.06, CF, CW1, L + 0.006, CF + 0.018, { bevel: 0.004 }); }
      g.box(CW0 - 0.05, PEL, zb, CW1 + 0.05, PEL + 0.15, CF + 0.08, { bevel: 0.01 });
      g.box(CW0 - 0.07, PEL + 0.15, zb, CW1 + 0.07, PEL + 0.21, CF + 0.11, { bevel: 0.01 });
      g.mat('cast', IRON, { rough: -0.05 }); g.tube([[CW0 + 0.03, 2.9, CF + 0.05], [CW1 - 0.03, 2.9, CF + 0.05]], 0.013, { segs: 8 });
      for (let i = 0; i <= NB; i++) { const x = CW0 + i * BW; g.box(x - 0.012, 2.88, CF, x + 0.012, 2.92, CF + 0.06); }
    });
    s.solid(CW0 - 0.05, 0, zb, CW1 + 0.05, H, CF + 0.02);
    s.deco((g) => { g.mat('diffuser', '#eef2ff', { emissive: 1.4, lamp: true }); g.box(CW0 + 0.05, PEL - 0.003, CF + 0.005, CW1 - 0.05, PEL, CF + 0.05, { faces: 'y' }); });
    {
      const rng = new Rng(hashStr('ld-crockwall'));
      for (let row = 0; row < LV.length; row++) {
        const y = LV[row], wide = row === 2 || row === 5, per = row === 0 || wide ? 2 : 3, top = row === LV.length - 1;
        for (let b = 0; b < NB; b++) for (let k = 0; k < per; k++) {
          const x = CW0 + b * BW + (k + 0.5) * BW / per + rng.f(-0.014, 0.014), z = zb + 0.22 + rng.f(-0.02, 0.02);
          if (row > 0 && rng.chance(0.09)) { if (rng.chance(0.5)) prop(s, 'food.ld_lids', x, y, z, 0, { n: 2 + rng.i(0, 2) }); continue; }     // out on loan
          const glaze = row === 0 ? rng.pick(['#8a5a34', '#3a2a22', '#6a3a26', RUST, '#5e6872']) : rng.pick(GLAZES);
          const h = row === 0 ? 0.42 : top ? 0.22 : wide ? 0.27 : rng.pick([0.22, 0.24, 0.26]), r = row === 0 ? 0.15 : wide ? 0.13 : rng.pick([0.085, 0.09, 0.1]);
          const lid = row === 0 ? rng.pick(['wood', 'glaze', 'glaze']) : rng.chance(0.22) ? 'cloth' : rng.chance(0.15) ? 'wood' : 'glaze';
          const tint = rng.f(0.9, 1.06);
          prop(s, 'food.ld_crock', x, y, z, rng.f(0, TAU), { glaze, h, r, lid, label: row !== 3 && row !== 4 && rng.chance(0.6), band: rng.chance(0.18) ? CREAM : undefined, segs: row === 0 || wide ? 14 : row > 5 ? 10 : 12 }, { tint: [tint, tint, tint], cast: false });
        }
      }
    }
    // the household cards along the two shelves at eye height
    const NAMES = [
      [1.64, [['Okafor', 'miso'], ['Vell', 'larder sour'], ['The Satos', 'berries'], ['Brandt Ilunga', 'miso'], ['Flat 19C', 'sour'], ['Lindqvist', 'black garlic'], ['Kurt', 'miso, the old one']]],
      [1.3, [['Adeyemi', 'sour'], ['The Aunts', 'berries, two'], ['Marsh', 'miso'], ['Naredi', 'sour'], ['Holm and Paz', 'miso'], ['Flat 7A', 'berries'], ['Guests', 'for whoever comes']]],
    ];
    for (const [L, list] of NAMES) {
      list.forEach((nm, b) => {
        const x = CW0 + (b + 0.5) * BW;
        s.deco((g) => { g.mat('paper', b === 6 && L === 1.3 ? '#f2dcc0' : PAPER); g.box(x - 0.11, L - 0.054, CF + 0.018, x + 0.11, L + 0.004, CF + 0.021, { faces: 'Z' }); g.mat('cast', BRASS, { rough: -0.1 }); for (const sx of [-1, 1]) g.box(x + sx * 0.112 - 0.006, L - 0.056, CF + 0.018, x + sx * 0.112 + 0.006, L + 0.006, CF + 0.024); });
        sign(s, { kind: 'label', text: nm[0], lines: [nm[1]] }, x, L - 0.025, CF + 0.024, { face: 'Z', w: 0.2, h: 0.05 });
      });
    }
    prop(s, 'food.ladder', 51.62, 0, CF + 0.085, 0, { h: 2.86, w: 0.46, lean: 0.62, wood: '#6a4a2e' });
    // light: the pelmet tube washes down the crocks; two ceiling spots graze them from the room
    s.light({ at: [CW0 + 0.25, PEL - 0.06, CF + 0.12], to: [CW1 - 0.25, PEL - 0.06, CF + 0.12], type: 'tube', color: warm(4100), power: 2.5, range: 3.4, radius: 0.05, clip, lamp: true });
    for (const x of [49.0, 51.9]) lamp(s, 'spot', x, 3.18, -10.6, { clip, dir: nrm([0, -0.52, -1]), cone: [46, 20], power: 1.15, K: 3900, range: 6.5 });

    // ---- the back corner: the cold store door under a caged lamp ----
    s.deco((g) => {
      g.mat('cast', IRON); g.box(53.86, 2.28, zb, 53.98, 2.46, zb + 0.04, { bevel: 0.005 });
      g.mat('diffuser', '#e8eeff', { emissive: 3, lamp: true }); g.ball(53.92, 2.37, zb + 0.09, 0.05, 0.065, 0.05, { segs: 10, rings: 6 });
      g.mat('cast', IRON); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; g.tube([[53.92 + Math.cos(a) * 0.056, 2.3, zb + 0.09 + Math.sin(a) * 0.056], [53.92 + Math.cos(a) * 0.056, 2.44, zb + 0.09 + Math.sin(a) * 0.056]], 0.003, { segs: 3 }); }
    });
    s.light({ at: [53.92, 2.37, zb + 0.18], color: warm(4200), power: 1.0, range: 2.6, radius: 0.05, clip, lamp: true });
    prop(s, 'food.sack', 54.55, 0, -12.55, 0.4, { tint: '#a8916a', h: 0.55, r: 0.18, band: RUST });
    prop(s, 'food.ld_crock', 54.5, 0, -12.05, 0.2, { glaze: '#3a2a22', h: 0.46, r: 0.16, lid: 'wood' });

    // ---- the west wall: two cheese racks, the returned crocks, the Knotnight list and poster ----
    const RX = xi0 + 0.28, RLV = [0.12, 0.55, 0.98, 1.41, 1.84];
    for (const zc of [-11.75, -9.65]) prop(s, 'food.ld_rack', RX, 0, zc, Math.PI / 2, { w: 2.0, d: 0.55, h: 2.25, levels: RLV });
    {
      const rng = new Rng(hashStr('ld-cheese'));
      const NC = { cast: false };
      const RINDS = ['#c99a4a', '#b8863a', '#8a6a3a', '#a87a40', '#d0aa60', '#7a5a34'];
      for (const [zc, seed] of [[-11.75, 0], [-9.65, 1]]) {
        RLV.forEach((y, li) => {
          spread(zc - 0.98, zc + 0.98, 5, (z, i) => {
            const x = RX + rng.f(-0.03, 0.03), k = (i + li + seed) % 5;
            if (li === 0) { const r = 0.17; prop(s, 'food.cheese', x, y, z, 0, { kind: 'wheel', r, h: 0.12, rind: rng.pick(RINDS) }, NC); if (k % 2 === 0) prop(s, 'food.cheese', x, y + 0.12, z, 0, { kind: 'wheel', r: 0.165, h: 0.11, rind: rng.pick(RINDS) }, NC); }
            else if (li === 1) { prop(s, 'food.cheese', x, y, z, 0, { kind: 'wheel', r: 0.16, h: 0.11, rind: '#c4a060' }, NC); prop(s, 'food.ld_cloth', x, y, z, 0, { r: 0.16, h: 0.11, col: k % 2 ? '#e6dcc0' : '#d8ccae', tie: k === 3 ? RUST : '#8a7a5a' }, NC); }
            else if (li === 2) {
              if (k === 1 || k === 3) prop(s, 'food.cheese', x + 0.06, y, z, Math.PI / 2, { kind: 'half', r: 0.16, h: 0.11, rind: rng.pick(RINDS), paste: rng.pick(['#f0d48a', '#ead09a', '#e8c470']) }, NC);
              else prop(s, 'food.cheese', x, y, z, 0, { kind: 'wheel', r: 0.155, h: 0.12, rind: rng.pick(RINDS) }, NC);
            } else if (li === 3) { for (const dz of [-0.08, 0.08]) prop(s, 'food.cheese', x, y, z + dz, 0, { kind: 'tall', r: 0.07, h: rng.pick([0.14, 0.16, 0.18]), rind: rng.pick(['#e8dcc0', '#c9a45c', '#8a7a5a']) }, NC); }
            else { const wax = rng.pick([RUST, '#2e2a26', '#c9a040', '#7a2a24']); prop(s, 'food.cheese', x, y, z, 0, { kind: 'wheel', r: 0.12, h: 0.08, wax }, NC); if (k % 2) prop(s, 'food.cheese', x, y + 0.08, z, 0, { kind: 'wheel', r: 0.11, h: 0.075, wax }, NC); }
          });
        });
      }
    }
    tag('0.33', 'a slice, aged two years', RX + 0.29, 0.98, -11.75, 'X', 0.09); tag('0.33', 'a slice', RX + 0.29, 0.98, -9.65, 'X', 0.08);
    s.deco((g) => { g.mat('cast', BRASS, { rough: -0.1 }); g.box(RX + 0.22, 2.17, -12.7, RX + 0.3, 2.25, -8.7, { bevel: 0.006 }); });
    glowStrip([RX + 0.26, 2.17, -12.55], [RX + 0.26, 2.17, -8.85], { power: 0.32, K: 4000, range: 2.6, tint: '#f4f2ea' });

    // the returned crocks: a low two-tier bench of crocks with their tags, lids off, waiting for the tub
    const BX0 = xi0, BX1 = xi0 + 0.46, BZ0 = -8.45, BZ1 = -6.75;
    s.furniture((g) => {
      g.mat('wood', OAK2, { rough: -0.05 });
      for (const z of [BZ0 + 0.04, BZ1 - 0.04]) for (const x of [BX0 + 0.04, BX1 - 0.04]) g.box(x - 0.03, 0, z - 0.03, x + 0.03, 0.62, z + 0.03, { bevel: 0.006 });
      g.box(BX0, 0.585, BZ0, BX1 + 0.02, 0.62, BZ1, { bevel: 0.008 }); g.box(BX0 + 0.02, 0.12, BZ0 + 0.02, BX1, 0.15, BZ1 - 0.02, { bevel: 0.006 });
    });
    s.solid(BX0, 0, BZ0, BX1 + 0.02, 0.62, BZ1);
    {
      const rng = new Rng(hashStr('ld-back'));
      const TAGS = ['#e9dcc0', '#f2d0b0', '#e9dcc0', '#d8e0d0', '#e9dcc0'];
      spread(BZ0 + 0.1, BZ1 - 0.3, 5, (z, i) => prop(s, 'food.ld_crock', BX0 + 0.22, 0.62, z + rng.f(-0.02, 0.02), Math.PI / 2 + rng.f(-0.4, 0.4), { glaze: rng.pick(GLAZES), h: rng.pick([0.24, 0.26, 0.28]), r: 0.095, lid: 'none', tag: TAGS[i] }));
      prop(s, 'food.ld_lids', BX0 + 0.25, 0.62, BZ1 - 0.12, 0, { n: 5 });
      prop(s, 'food.ld_tub', BX0 + 0.24, 0.15, BZ0 + 0.3, 0, { r: 0.19 });
      prop(s, 'food.ld_crock', BX0 + 0.22, 0.15, BZ0 + 0.85, 1.2, { glaze: '#8a5a34', h: 0.3, r: 0.11, lid: 'none', tag: true });
      prop(s, 'food.ld_crock', BX0 + 0.24, 0.15, BZ0 + 1.25, 2.2, { glaze: RUST, h: 0.28, r: 0.1, lid: 'none', tag: '#f2d0b0' });
      prop(s, 'food.linen', BX0 + 0.23, 0.15, BZ1 - 0.15, 0.1, { col: '#e8e0cc', col2: '#d8c8a8', n: 3, w: 0.26, d: 0.2 });
    }
    plate(s, 'Crocks lent, crocks back', 'leave them here, we wash them', BX1 + 0.022, 0.5, (BZ0 + BZ1) / 2, 'X', 0.36);
    const KNOT = { kind: 'chalk', title: 'Last Knotnight', lines: ['Miso · 64 crocks', 'Larder sour · 120 crocks', 'Berries · 410 jars', 'Rusks · 1,200 bags', 'Cheeses turned · 300', 'Crocks back · 171 of 184'] };
    sign(s, KNOT, xi0 + 0.014, 1.66, -7.62, { face: 'X', w: 0.6, h: 0.84, back: '#3a2a20' });
    sign(s, Object.assign({}, SIGNS['poster.knotnight'], { motif: 'quiet', palette: ['#2e2a33', '#e8c9a0', '#d8794a'] }), xi0 + 0.01, 1.58, -5.7, { face: 'X', w: 0.48, h: 0.68 });
    lamp(s, 'sconce', xi0 + 0.01, 1.98, -6.62, { face: 'X', clip, K: 3000, power: 0.5, range: 3.2 });
    // sacks and a barrel in the front corner, by the window
    prop(s, 'food.sack', 47.45, 0, -6.5, 0.3, { tint: '#b99c6c', h: 0.6, r: 0.2, band: RUST });
    prop(s, 'food.sack', 47.86, 0, -6.5, 1.1, { tint: '#a8916a', h: 0.5, r: 0.18 });
    prop(s, 'food.sack', 48.12, 0, -5.22, 2.0, { tint: '#c4ab80', h: 0.45, r: 0.17, band: '#5e6872' });
    prop(s, 'food.ld_barrel', 47.6, 0, -5.32, 0.3, { r: 0.26, h: 0.72, wood: '#6a4a30' });
    prop(s, 'food.ld_rusks', 47.6, 0.745, -5.32, 0.3, { w: 0.3, d: 0.2 });
    tag('0.25', 'rusks, a bag', 47.86, 0.745, -5.32, 'X', 0.08);

    // ---- the table in the middle: cheeses under cloth and glass, miso, hams on a rack above ----
    const TX0 = 49.3, TX1 = 50.5, TZ0 = -10.2, TZ1 = -7.6, TT = 0.86;
    s.furniture((g) => {
      g.mat('wood', OAK2, { rough: 0.02 }); g.box(TX0, TT - 0.07, TZ0, TX1, TT, TZ1, { bevel: 0.015 });
      g.mat('wood', OAK, { rough: -0.05 });
      for (const x of [TX0 + 0.1, TX1 - 0.1]) for (const z of [TZ0 + 0.1, TZ1 - 0.1]) g.lathe(x, z, [[0.06, 0], [0.066, 0.04], [0.05, 0.1], [0.045, 0.4], [0.062, 0.5], [0.045, 0.6], [0.055, TT - 0.07]], { segs: 10 });
      g.box(TX0 + 0.06, TT - 0.17, TZ0 + 0.06, TX1 - 0.06, TT - 0.07, TZ1 - 0.06, { faces: 'xXzZ' });
      g.box(TX0 + 0.08, 0.16, TZ0 + 0.08, TX1 - 0.08, 0.19, TZ1 - 0.08, { bevel: 0.005 });
    });
    s.solid(TX0, 0, TZ0, TX1, TT, TZ1);
    prop(s, 'food.cheese', 49.65, TT, -7.98, 0, { kind: 'wheel', r: 0.21, h: 0.13, rind: '#b8863a' });
    prop(s, 'food.ld_cloth', 49.65, TT, -7.98, 0, { r: 0.21, h: 0.13, col: '#e2d8bc' });
    prop(s, 'food.cheese', 50.17, TT, -7.95, 0, { kind: 'wheel', r: 0.17, h: 0.11, rind: '#8a6a3a' });
    prop(s, 'food.cheese', 50.17, TT + 0.11, -7.95, 0, { kind: 'half', r: 0.16, h: 0.1, rind: '#a87a40', paste: '#ead09a' });
    prop(s, 'food.cheese', 49.9, TT + 0.026, -8.7, 0.5, { kind: 'wedge', r: 0.13, h: 0.09, rind: '#7a5a34', paste: '#e8c470' });
    prop(s, 'food.cheese', 49.98, TT + 0.026, -8.8, 0, { kind: 'tall', r: 0.06, h: 0.12, rind: '#e8dcc0' });
    dome(s, 49.92, TT, -8.72, 0.2, 0.25);
    s.detail((g) => { g.mat('stone', '#3e3e44', { rough: -0.1 }); g.box(49.4, TT, -9.62, 49.95, TT + 0.016, -9.18, { bevel: 0.004 }); });
    for (const [x, z, k, rind, paste] of [[49.55, -9.5, 'wedge', '#c99a4a', '#f0d48a'], [49.72, -9.3, 'wedge', '#8a6a3a', '#e8c470'], [49.82, -9.52, 'wedge', '#d0aa60', '#f4e6c0']]) prop(s, 'food.cheese', x, TT + 0.016, z, 0.6, { kind: k, r: 0.12, h: 0.08, rind, paste });
    prop(s, 'food.cheese', 50.25, TT, -9.35, 0, { kind: 'tall', r: 0.08, h: 0.16, rind: '#c9a45c' }); prop(s, 'food.cheese', 50.3, TT, -9.12, 0, { kind: 'tall', r: 0.07, h: 0.13, rind: '#e8dcc0' });
    prop(s, 'food.ld_crock', 49.56, TT, -9.98, 0, { glaze: '#d4c8ac', h: 0.22, r: 0.09, lid: 'wood', label: true });
    prop(s, 'food.ld_crock', 49.86, TT, -10.0, 0, { glaze: RUST, h: 0.25, r: 0.095, lid: 'glaze', label: true });
    prop(s, 'food.ld_crock', 50.2, TT, -9.92, 0, { glaze: '#8a5a34', h: 0.2, r: 0.085, lid: 'cloth', label: true });
    prop(s, 'food.ld_garlic', 50.22, TT, -8.55, 0, { n: 5 });
    tag('0.20', 'black garlic, a head', 50.36, TT, -8.4, 'X', 0.08);
    tag('0.55', 'white miso, a small jar', TX0 - 0.0, TT, -9.98, 'x', 0.09);
    tag('Aged two years', '0.33 a slice', 49.9, TT, TZ1 + 0.005, 'Z', 0.13);
    prop(s, 'food.ld_crock', 49.62, 0.19, -9.7, 0, { glaze: '#3a2a22', h: 0.4, r: 0.15, lid: 'wood' });
    prop(s, 'food.ld_crock', 50.15, 0.19, -9.6, 0, { glaze: '#5e6872', h: 0.36, r: 0.14, lid: 'glaze', band: CREAM });
    prop(s, 'food.sack', 49.9, 0.19, -8.2, 0.7, { tint: '#b99c6c', h: 0.42, r: 0.17 });
    // the ham rack, hung from the ceiling over the back half of the table
    const HY = 2.66;
    s.deco((g) => {
      g.mat('wood', OAK, { rough: -0.05 }); for (const x of [49.66, 50.14]) g.tube([[x, HY, -10.12], [x, HY, -8.72]], 0.028, { segs: 8 });
      g.mat('cast', IRON); for (const x of [49.66, 50.14]) for (const z of [-10.04, -8.8]) { g.tube([[x, HY + 0.02, z], [x, H, z]], 0.008, { segs: 4 }); g.cyl(x, H - 0.012, z, 0.03, 0.012, { segs: 8 }); }
      for (const x of [49.66, 50.14]) for (const z of [-9.95, -9.6, -9.1, -8.88]) g.tube([[x, HY + 0.03, z - 0.02], [x, HY + 0.04, z], [x, HY - 0.02, z + 0.01]], 0.004, { segs: 3 });
    });
    for (const [x, z, k, c] of [[49.66, -9.95, 1.0, '#8a3e26'], [49.66, -9.6, 0.85, '#7a3420'], [49.66, -9.1, 1.1, '#94462a'], [50.14, -9.82, 0.9, '#7a3420'], [50.14, -9.35, 1.05, '#8a3e26'], [50.14, -8.9, 0.8, '#a04e30']]) prop(s, 'food.ham', x, HY - 0.02, z, z * 3, { col: c, size: k, len: 0.22 });
    lamp(s, 'spot', 50.6, 3.18, -8.2, { clip, dir: nrm([-0.4, -1, -0.05]), cone: [32, 14], power: 0.75, K: 3800 });

    // ---- Zhenya's counter, the tasting end toward the street, and her shelves on the east wall ----
    const KX0 = 52.7, KX1 = 53.35, KZ0 = -11.6, KZ1 = -6.6, KT = 0.93;
    s.furniture((g) => {
      g.mat('wood', shadeHex(OAK, 0.55)); g.box(KX0 + 0.04, 0, KZ0 + 0.02, KX1 - 0.02, 0.1, KZ1 - 0.04, { aoBottom: 0.6 });
      g.mat('wood', OAK, { rough: -0.05 }); g.box(KX0, 0.1, KZ0, KX1, KT - 0.05, KZ1, { aoBottom: 0.7 });
      g.mat('wood', shadeHex(OAK, 1.3), { rough: -0.05 }); spread(KZ0, KZ1, 7, (z) => g.box(KX0 - 0.012, 0.2, z - 0.29, KX0, KT - 0.16, z + 0.29, { bevel: 0.008 }));
      g.box(KX0 + 0.08, 0.2, KZ1, KX1 - 0.08, KT - 0.16, KZ1 + 0.012, { bevel: 0.008 });
      g.mat('wood', '#6a4a30', { rough: 0.02 }); g.box(KX0 - 0.1, KT - 0.05, KZ0 - 0.02, KX1 + 0.03, KT, KZ1 + 0.04, { bevel: 0.012 });
      g.mat('cast', BRASS, { rough: -0.1 }); g.tube([[KX0 - 0.15, 0.2, KZ0 + 0.25], [KX0 - 0.15, 0.2, KZ1 - 0.15]], 0.018, { segs: 8 });
      for (const z of [KZ0 + 0.3, (KZ0 + KZ1) / 2, KZ1 - 0.2]) g.tube([[KX0 - 0.15, 0.2, z], [KX0 - 0.04, 0.2, z], [KX0, 0.24, z]], 0.01, { segs: 5 });
      // her side: two open shelves under the top, linen and crocks on them
      g.mat('wood', shadeHex(OAK, 0.7)); g.box(KX1, 0.38, KZ0 + 0.05, KX1 + 0.002, 0.4, KZ1 - 0.05, { faces: 'X' });
    });
    s.solid(KX0 - 0.1, 0, KZ0, KX1 + 0.03, KT, KZ1 + 0.04);
    const KY = KT + 0.002;
    // tasting end: four tall stools, two boards laid out, small lidded things
    const STOOLS = [-6.95, -7.6, -8.25, -8.9], SX = 52.22;
    STOOLS.forEach((z, i) => { prop(s, 'stool', SX, 0, z, i * 1.3, { h: 0.68, wood: i % 2 ? '#5a4030' : '#4a3426' }, { noSpots: true }); s.spot('sit', SX, 0.68, z, Math.PI / 2, { tags: ['larder', 'taste'] }); });
    prop(s, 'food.ld_board', 52.92, KY, -6.95, -Math.PI / 2, {}); dome(s, 52.92, KY, -6.95, 0.25, 0.17);
    prop(s, 'food.ld_board', 52.9, KY, -8.25, -Math.PI / 2, {}); prop(s, 'food.ld_cover', 53.15, KY, -7.85, 0, { r: 0.18 });
    prop(s, 'cup', 52.72, KY, -7.25, 0, { glaze: '#d8ccb0', lid: RUST }); prop(s, 'cup', 52.74, KY, -8.55, 0, { glaze: '#5e6872', lid: '#d8ccb0' });
    prop(s, 'bowl', 52.85, KY, -7.6, 0, { glaze: RUST, lid: '#d8ccb0', r: 0.07 }); prop(s, 'food.ld_crock', 53.05, KY, -7.55, 0, { glaze: '#d4c8ac', h: 0.14, r: 0.06, lid: 'glaze' });
    prop(s, 'bowl', 52.85, KY, -8.92, 0, { glaze: '#8c9a86', lid: '#d4c8ac', r: 0.07 }); prop(s, 'food.ld_rusks', 53.1, KY, -8.95, Math.PI / 2, { w: 0.26, d: 0.18 });
    prop(s, 'food.linen', 53.2, KY, -6.85, 0.1, { col: '#e8e0cc', col2: RUST, n: 4, w: 0.2, d: 0.18 });
    plate(s, 'The keeping board', '1.10', KX0 - 0.1, KT - 0.12, -7.6, 'x', 0.22);
    // serving end: the balance, a cheese under glass, the cutting board and wire, her ledger
    prop(s, 'food.scale', 53.0, KY, -9.75, -Math.PI / 2, {});
    prop(s, 'food.cheese', 53.0, KY + 0.026, -10.4, 0, { kind: 'half', r: 0.15, h: 0.11, rind: '#8a6a3a', paste: '#e8c470' }); dome(s, 53.0, KY, -10.4, 0.18, 0.2);
    s.detail((g) => {
      g.mat('wood', '#7a5636', { rough: -0.05 }); g.box(52.82, KY, -11.35, 53.2, KY + 0.04, -10.85, { bevel: 0.008 });
      g.mat('cast', '#c9c4bb', { rough: -0.2 }); g.tube([[52.86, KY + 0.04, -11.3], [52.86, KY + 0.16, -11.3], [53.16, KY + 0.16, -11.3], [53.16, KY + 0.04, -11.3]], 0.004, { segs: 4 });
      g.mat('wood', OAK2); g.box(52.84, KY + 0.04, -11.32, 52.88, KY + 0.2, -11.28, { bevel: 0.004 });
    });
    prop(s, 'food.cheese', 53.0, KY + 0.04, -11.05, Math.PI / 2, { kind: 'half', r: 0.17, h: 0.12, rind: '#b8863a', paste: '#f0d48a' });
    s.detail((g) => {
      g.mat('leather', '#2e3a5a', { rough: -0.1 }); g.box(53.08, KY, -10.0, 53.3, KY + 0.03, -9.7, { bevel: 0.004 });
      g.mat('paper', PAPER); g.box(53.085, KY + 0.004, -9.995, 53.295, KY + 0.026, -9.703, { faces: 'xzZ' });
      g.mat('weave', '#d6a640'); g.box(53.18, KY + 0.03, -10.02, 53.19, KY + 0.031, -9.7);
    });
    prop(s, 'food.ld_crock', 53.15, KY, -11.45, 0, { glaze: '#3a2a22', h: 0.2, r: 0.08, lid: 'wood' });
    tag('0.15', "last year's larder sour", KX0 - 0.08, KY, -11.45, 'x', 0.1);
    // under her side of the counter: linen and a row of spare crocks
    prop(s, 'food.linen', KX1 - 0.15, 0.4, -10.8, 0, { col: '#e8e0cc', col2: '#d8c8a8', n: 4, w: 0.22, d: 0.2 });
    // the pendants: rust enamel, low over the stools and the scale
    for (const z of [-7.25, -8.6, -10.45]) { prop(s, 'food.ld_shade', 53.0, H, z, 0, { L: 1.3 }); lamp(s, 'bulb', 53.0, H - 1.38, z, { clip, power: 0.42, K: 2700, range: 3.0 }); }

    // her shelves on the east wall: a cupboard, three shelves of jars, tins, bottles and bags
    const EX = xi1, EZ0 = -11.8, EZ1 = -6.6;
    block(s, EX - 0.34, 0, EZ0, EX, 0.86, EZ1, 'wood', OAK, { bevel: 0.01 });
    s.furniture((g) => {
      g.mat('wood', shadeHex(OAK, 1.25)); spread(EZ0, EZ1, 6, (z) => g.box(EX - 0.352, 0.12, z - 0.38, EX - 0.34, 0.76, z + 0.38, { bevel: 0.006 }));
      g.mat('cast', BRASS); spread(EZ0, EZ1, 6, (z) => g.ball(EX - 0.36, 0.6, z, 0.012, 0.012, 0.012, { segs: 6, rings: 4 }));
      g.mat('wood', OAK, { rough: -0.08 }); for (const y of [1.25, 1.62, 1.99]) g.box(EX - 0.3, y - 0.03, EZ0, EX, y, EZ1, { bevel: 0.006 });
      g.mat('cast', IRON); for (const y of [1.25, 1.62, 1.99]) for (const z of [EZ0 + 0.2, -9.2, EZ1 - 0.2]) g.tube([[EX, y - 0.22, z], [EX - 0.02, y - 0.12, z], [EX - 0.22, y - 0.035, z]], 0.007, { segs: 5 });
    });
    {
      const rng = new Rng(hashStr('ld-east'));
      // cupboard top: bags of rusks, black garlic, paper and string
      prop(s, 'food.ld_garlic', EX - 0.16, 0.86, -7.2, 0, { n: 6 });
      prop(s, 'food.ld_rusks', EX - 0.16, 0.86, -8.1, Math.PI / 2, { w: 0.3, d: 0.22 });
      prop(s, 'food.linen', EX - 0.16, 0.86, -10.9, Math.PI / 2, { col: '#d8c8a8', col2: '#c9b48a', n: 6, w: 0.26, d: 0.2 });
      prop(s, 'food.ld_crock', EX - 0.17, 0.86, -9.4, 0, { glaze: RUST, h: 0.3, r: 0.11, lid: 'glaze', band: CREAM });
      prop(s, 'food.ld_crock', EX - 0.17, 0.86, -10.1, 0, { glaze: '#d4c8ac', h: 0.26, r: 0.1, lid: 'cloth' });
      // shelf one: tins of the Nine and of rusks
      spread(EZ0 + 0.1, EZ1 - 0.1, 12, (z, i) => prop(s, 'food.tin', EX - 0.15, 1.25, z, 0, { col: i % 3 === 2 ? RUST : i % 3 === 1 ? '#5e6872' : '#7a8a6a', h: i % 3 === 2 ? 0.2 : 0.15, r: 0.065, band: i % 3 === 1 ? CREAM : '#e9d9a8' }));
      // shelf two: preserved berries
      const BER = ['#6a1e3a', '#8a2040', '#4a1a3a', '#a03a2a', '#5a1a2e', '#7a2a4a'];
      spread(EZ0 + 0.08, EZ1 - 0.08, 16, (z, i) => prop(s, 'food.jar', EX - 0.15, 1.62, z, 0, { fill: BER[i % BER.length], h: i % 4 === 1 ? 0.17 : 0.14, r: 0.045, level: 0.82, cloth: i % 3 ? '#d9c79a' : '#e6dcc4', string: RUST }));
      // shelf three: bottles of soy and sour, and bags
      spread(EZ0 + 0.1, -8.6, 9, (z, i) => prop(s, 'food.bottle', EX - 0.15, 1.99, z, 0, { glass: rng.pick(['#2a1e14', '#3a2a18', '#2e3a2c', '#4a2e1a']), h: rng.pick([0.24, 0.28, 0.22]), r: 0.034, cork: i % 4 === 0 ? 'wax' : undefined }));
      for (let i = 0; i < 4; i++) prop(s, 'food.sack', EX - 0.15, 1.99, -7.3 - i * 0.3, i, { tint: '#c9a87a', h: 0.18, r: 0.07 });
    }
    glowStrip([EX - 0.22, 1.955, EZ0 + 0.15], [EX - 0.22, 1.955, EZ1 - 0.15], { power: 0.3, K: 3600, range: 2.0, tint: '#fff4e4' });
    // the front east corner: crates of tins and a sack
    prop(s, 'crate', 54.4, 0, -5.75, 0.05, { w: 0.6, h: 0.32, d: 0.42, wood: '#7a5a3a' });
    prop(s, 'crate', 54.42, 0.32, -5.77, -0.06, { w: 0.6, h: 0.32, d: 0.42, wood: '#8a6a44' });
    for (let i = 0; i < 3; i++) prop(s, 'food.tin', 54.24 + i * 0.16, 0.64, -5.72, 0, { col: [RUST, '#5e6872', '#7a8a6a'][i], h: 0.16, r: 0.065 });
    prop(s, 'food.sack', 53.75, 0, -5.4, 0.8, { tint: '#b99c6c', h: 0.56, r: 0.19, band: RUST });
    // above them: a shelf of hand lamps for Knotnight, and the list of crocks out
    s.furniture((g) => {
      g.mat('wood', OAK, { rough: -0.05 }); g.box(xi1 - 0.22, 1.36, -6.35, xi1, 1.39, -5.15, { bevel: 0.006 });
      g.mat('cast', IRON); for (const z of [-6.2, -5.3]) g.tube([[xi1, 1.16, z], [xi1 - 0.02, 1.27, z], [xi1 - 0.18, 1.355, z]], 0.007, { segs: 5 });
      g.mat('wood', OAK2); g.box(xi1 - 0.03, 1.62, -6.35, xi1, 1.68, -5.15, { bevel: 0.005 });
      g.mat('cast', BRASS); for (let i = 0; i < 5; i++) g.tube([[xi1 - 0.03, 1.65, -6.2 + i * 0.24], [xi1 - 0.09, 1.65, -6.2 + i * 0.24], [xi1 - 0.1, 1.68, -6.2 + i * 0.24]], 0.005, { segs: 4 });
    });
    spread(-6.3, -5.2, 5, (z, i) => prop(s, 'food.ld_handlamp', xi1 - 0.11, 1.39, z, -Math.PI / 2 + (i % 2) * 0.3, { col: i === 2 ? '#8a8a84' : BRASS, tag: i % 2 ? '#e9dcc0' : undefined }));
    plate(s, 'Hand lamps', 'lent for Knotnight', xi1 - 0.225, 1.33, -5.75, 'x', 0.16);
    sign(s, { kind: 'notice', title: 'Crocks out', lines: ['Okafor, two, since the Quiet', 'Flat 19C, one, back soon', 'Marsh, three', 'The Aunts, one', 'Holm and Paz, the big one', 'Adeyemi, the lid only'], hand: true }, xi1 - 0.012, 1.6, -4.78, { face: 'x', w: 0.3, h: 0.42 });

    // ---- the windows: cheeses and crocks on the west bed, a stand of berry jars on the east ----
    const bed = (a0, a1) => {
      block(s, a0, 0, -4.96, a1, 0.5, -4.25, 'stone', '#7f796e', { bevel: 0.01 });
      s.deco((g) => { g.mat('stone', '#4a4a4e', { rough: -0.1 }); g.box(a0 + 0.01, 0.5, -4.95, a1 - 0.01, 0.512, -4.26, { faces: 'Y' }); g.mat('wood', OAK); g.box(a0, 0.48, -4.975, a1, 0.515, -4.958); });
    };
    bed(47.3, 50.35); bed(51.65, 54.7);
    const BY = 0.512;
    prop(s, 'food.cheese', 47.85, BY, -4.62, 0, { kind: 'wheel', r: 0.2, h: 0.12, rind: '#b8863a' });
    prop(s, 'food.cheese', 47.85, BY + 0.12, -4.62, 0, { kind: 'wheel', r: 0.18, h: 0.11, rind: '#8a6a3a' });
    prop(s, 'food.cheese', 47.85, BY + 0.23, -4.62, 0, { kind: 'wheel', r: 0.15, h: 0.1, wax: RUST });
    prop(s, 'food.cheese', 48.5, BY, -4.55, 0, { kind: 'half', r: 0.19, h: 0.12, rind: '#7a5a34', paste: '#e8c470' });
    prop(s, 'food.cheese', 49.2, BY + 0.026, -4.6, 0, { kind: 'tall', r: 0.075, h: 0.14, rind: '#e8dcc0' }); dome(s, 49.2, BY, -4.6, 0.13, 0.22);
    prop(s, 'food.ld_crock', 49.78, BY, -4.72, 0, { glaze: RUST, h: 0.34, r: 0.12, lid: 'glaze', label: true });
    prop(s, 'food.ld_crock', 50.1, BY, -4.48, 0, { glaze: '#d4c8ac', h: 0.22, r: 0.085, lid: 'cloth', label: true });
    tag('0.33', 'a slice, two years', 48.5, BY, -4.3, 'Z', 0.09); tag('0.55', 'white miso', 49.92, BY, -4.29, 'Z', 0.08);
    prop(s, 'food.ld_stand', 53.15, BY, -4.66, 0, { w: 1.3 });
    {
      const BER = ['#6a1e3a', '#8a2040', '#4a1a3a', '#a03a2a', '#5a1a2e', '#7a2a4a'], T = [[0.1, 0.13], [0.27, 0], [0.44, -0.13]];
      T.forEach((t, ti) => spread(52.56, 53.74, 6 - ti, (x, i) => prop(s, 'food.jar', x, BY + t[0], -4.66 + t[1], 0, { fill: BER[(i + ti * 2) % BER.length], h: 0.13 + (ti === 2 ? 0.03 : 0), r: 0.042, level: 0.84, string: RUST })));
    }
    prop(s, 'food.tin', 51.95, BY, -4.62, 0, { col: '#7a8a6a', h: 0.15, r: 0.065 }); prop(s, 'food.tin', 52.1, BY, -4.45, 0, { col: RUST, h: 0.15, r: 0.065 }); prop(s, 'food.tin', 52.02, BY + 0.15, -4.54, 0.3, { col: '#5e6872', h: 0.15, r: 0.065 });
    prop(s, 'food.ld_rusks', 54.25, BY, -4.6, 0.1, { w: 0.34, d: 0.24 });
    tag('0.60', 'berries, a small jar', 53.15, BY, -4.29, 'Z', 0.1); tag('0.17', 'a tin of the Nine', 52.05, BY, -4.29, 'Z', 0.08);
    lamp(s, 'spot', 48.8, 3.18, -4.62, { clip: spill, cone: [36, 16], power: 1.1, K: 3600 });
    lamp(s, 'spot', 53.15, 3.18, -4.62, { clip: spill, cone: [36, 16], power: 1.1, K: 3600 });
    prop(s, 'rug', 51, 0, -4.62, 0, { w: 1.0, d: 0.48, mat: 'rush', a: '#8a7650', b: '#5a4a32' });

    // ---- the pavement: a barrel and a low bench of crocks, the board, the hanging sign ----
    prop(s, 'food.ld_barrel', 48.2, 0, -3.55, 0.6, { r: 0.28, h: 0.78 });
    prop(s, 'food.ld_crock', 48.1, 0.805, -3.6, 0, { glaze: RUST, h: 0.26, r: 0.1, lid: 'glaze', label: true });
    prop(s, 'food.ld_rusks', 48.32, 0.805, -3.42, 0.5, { w: 0.24, d: 0.16 });
    s.furniture((g) => {
      g.mat('wood', OAK2, { rough: -0.05 }); g.box(48.9, 0.4, -3.7, 50.1, 0.45, -3.32, { bevel: 0.01 });
      for (const x of [49.0, 50.0]) g.box(x - 0.04, 0, -3.66, x + 0.04, 0.4, -3.36, { bevel: 0.008 });
      g.box(49.0, 0.12, -3.54, 50.0, 0.16, -3.48, { bevel: 0.005 });
    });
    s.solid(48.9, 0, -3.7, 50.1, 0.45, -3.32);
    prop(s, 'food.ld_crock', 49.12, 0.45, -3.52, 0, { glaze: '#8a5a34', h: 0.3, r: 0.11, lid: 'wood', label: true });
    prop(s, 'food.ld_crock', 49.42, 0.45, -3.5, 0, { glaze: '#d4c8ac', h: 0.24, r: 0.09, lid: 'cloth', label: true });
    prop(s, 'food.ld_crock', 49.68, 0.45, -3.53, 0, { glaze: '#5e6872', h: 0.28, r: 0.1, lid: 'glaze', band: CREAM });
    prop(s, 'food.ld_crock', 49.93, 0.45, -3.48, 0, { glaze: RUST, h: 0.2, r: 0.08, lid: 'glaze' });
    plate(s, 'Crocks lent', 'ask inside', 49.5, 0.3, -3.315, 'Z', 0.12);
    prop(s, 'food.board', 53.6, 0, -3.48, 0, { w: 0.62, h: 1.25, wood: '#2a1c14' });
    sign(s, SIGNS['larder.chalk'], 53.6, 0.815, -3.45, { face: 'Z', w: 0.6, h: 0.78, board: false });
    s.deco((g) => {
      const x = 54.89; g.mat('cast', IRON, { rough: -0.1 });
      g.box(x - 0.04, 2.55, -3.99, x + 0.04, 2.95, -3.95, { bevel: 0.006 });
      g.tube([[x, 2.72, -3.96], [x, 2.72, -3.22]], 0.012, { segs: 6 });
      g.tube([[x, 2.92, -3.96], [x, 2.86, -3.7], [x, 2.76, -3.45], [x, 2.72, -3.36]], 0.009, { segs: 5 });
      g.mat('cast', RUST); g.ball(x, 2.72, -3.21, 0.02, 0.02, 0.02, { segs: 8, rings: 5 });
      for (const z of [-3.82, -3.38]) { g.mat('cast', IRON); g.tube([[x, 2.72, z], [x, 2.66, z]], 0.005, { segs: 4 }); }
    });
    sign(s, Object.assign({}, SIGNS['larder.hanging'], { palette: [CREAM, SLATE, RUST] }), 54.89, 2.35, -3.6, { face: 'X', double: true, w: 0.56, h: 0.6, back: SLATE });

    // ---- people ----
    s.spot('counter', 54.05, 0, -9.1, -Math.PI / 2, { who: 'zhenya', tags: ['larder'] });
    s.spot('work', 54.05, 0, -7.6, -Math.PI / 2, { who: 'zhenya', tags: ['larder', 'board'] });
    s.spot('work', 54.12, 0, -10.6, Math.PI / 2, { who: 'zhenya', tags: ['larder', 'shelf'] });
    s.spot('work', 51.62, 0, -12.05, 0, { tags: ['larder', 'stock', 'ladder'] });
    s.spot('work', 48.0, 0, -7.6, -Math.PI / 2, { tags: ['larder', 'stock', 'wash'] });
    for (const z of [-9.9, -10.9]) s.spot('customer', 52.1, 0, z, Math.PI / 2, { tags: ['larder'] });
    s.spot('queue', 51.95, 0, -6.1, 1.0, { tags: ['larder'] });
    for (const [x, z, yaw, t] of [[49.0, -12.0, 0, 'crocks'], [50.5, -11.95, 0, 'crocks'], [52.7, -12.1, 0, 'crocks'], [48.3, -11.6, -Math.PI / 2, 'cheese'], [48.3, -9.9, -Math.PI / 2, 'cheese'], [48.75, -8.9, Math.PI / 2, 'table'], [51.05, -8.5, -Math.PI / 2, 'table'], [48.35, -5.8, -Math.PI / 2, 'poster'], [52.6, -5.5, Math.PI, 'window']]) s.spot('browse', x, 0, z, yaw, { tags: ['larder', t] });
    s.spot('chat', 50.0, 0, -6.6, 1.05, { tags: ['larder'] }); s.spot('chat', 50.7, 0, -7.0, -2.09, { tags: ['larder'] });
    s.spot('browse', 48.9, 0, -2.85, 0, { tags: ['larder', 'street'] }); s.spot('browse', 53.6, 0, -2.85, 0, { tags: ['larder', 'street'] });
    s.path([[51, -2.5], [51, -4.6], [51, -6.2]]);
    s.path([[51, -6.2], [51.55, -7.0], [51.55, -10.6], [51.3, -11.7], [49.9, -11.65], [48.6, -11.0], [48.55, -8.0], [49.5, -6.5], [51, -6.2]]);
    s.path([[51.3, -11.7], [52.6, -12.2], [54.05, -11.9], [54.05, -9.1], [54.05, -7.0]]);

    // ---- things to do ----
    s.interact({
      x: 52.95, y: 1.1, z: -9.9, radius: 1.3, prompt: 'Buy something at the counter',
      async onUse(gm) {
        if (!gm.ui) return;
        gm.flags = gm.flags || {};
        if (!gm.flags.ldMet) { gm.flags.ldMet = true; await sayAs(gm, ZHENYA, MET); }
        let pick = null; gm.busy++;
        try { pick = await gm.ui.choose(ZHENYA, 'Everything here keeps. Take your time.', [{ label: 'Buy something', value: 'buy' }, { label: 'Ask what a good larder holds', value: 'larder' }, { label: 'Ask about the crocks', value: 'crocks' }, { label: 'Ask about Knotnight', value: 'knot' }]); } finally { gm.busy--; }
        if (pick === 'buy') {
          const it = await buyFrom(gm, MENUS.larder, 'Zhenya');
          if (it) { if (it.id === 'crock' && gm.inv && gm.inv.give && !(gm.inv.has && gm.inv.has('lent-crock'))) gm.inv.give('lent-crock'); await sayAs(gm, ZHENYA, BOUGHT[it.id] || 'Wrapped. It keeps.'); if (it.id === 'keeping-board') seat(gm, 1); }
        } else if (pick === 'larder') { await sayAs(gm, ZHENYA, LARDER); if (gm.journal) gm.journal.find('larder-pride'); }
        else if (pick === 'crocks') await sayAs(gm, ZHENYA, CROCKS);
        else if (pick === 'knot') { await sayAs(gm, ZHENYA, KNOTTALK); if (gm.journal) gm.journal.find('knotnight'); }
      },
    });
    const seat = (gm, i) => { if (!gm.player || !gm.player.sit) return; gm.player.sit({ x: SX, y: 0, z: STOOLS[i], yaw: Math.PI / 2, eye: 1.36 }); gm.player.yaw = Math.PI / 2; };
    s.interact({
      x: SX + 0.1, y: 0.9, z: -7.9, radius: 1.2, prompt: 'Sit at the tasting counter',
      onUse(gm) {
        const pz = gm.player && gm.player.pos ? gm.player.pos.z : -7.9; let best = 0;
        STOOLS.forEach((z, i) => { if (Math.abs(z - pz) < Math.abs(STOOLS[best] - pz)) best = i; });
        seat(gm, best);
      },
    });
    s.interact({
      x: 51.0, y: 1.5, z: CF + 0.6, radius: 1.5, prompt: 'Read the names on the crocks',
      async onUse(gm) { if (gm.sfxAt) gm.sfxAt('lid-up', f, 50.3, 1.5, CF); await sayAs(gm, { name: 'The crock wall', colour: '#e8b08a' }, NAMES_READ); },
    });
    s.interact({
      x: BX1 + 0.2, y: 0.9, z: (BZ0 + BZ1) / 2, radius: 1.0, prompt: 'Look at the returned crocks',
      onUse(gm) { return sayAs(gm, { name: 'Crocks back', colour: '#e8b08a' }, RETURNED); },
    });
    s.interact({
      x: xi0 + 0.3, y: 1.6, z: -7.62, radius: 1.1, prompt: 'Read the Knotnight list',
      async onUse(gm) { await sayAs(gm, { name: 'Last Knotnight', colour: '#f4e9c9' }, LIST); if (gm.journal) gm.journal.find('knotnight'); },
    });
    s.interact({
      x: xi0 + 0.3, y: 1.55, z: -5.7, radius: 0.9, prompt: 'Read the poster',
      async onUse(gm) { await sayAs(gm, { name: 'Knotnight', colour: '#d8794a' }, POSTER); if (gm.journal) gm.journal.find('knotnight'); },
    });
    s.interact({
      x: 54.6, y: 1.7, z: -3.4, radius: 1.4, prompt: 'Read the hanging sign',
      async onUse(gm) { await sayAs(gm, { name: 'Knotnight all year', colour: '#d8794a' }, HANGING); if (gm.journal) gm.journal.find('knotnight'); },
    });
    s.interact({
      x: 53.6, y: 0.9, z: -3.4, radius: 1.0, prompt: 'Read the board',
      onUse(gm) { const c = SIGNS['larder.chalk']; return sayAs(gm, { name: 'The board', colour: '#f4e9c9' }, [c.title + ':'].concat(c.lines.map((l) => l.replace(' · ', ', ')))); },
    });

    // the air handler breathes over the door; the cellar is otherwise quiet
    let air = null;
    s.trigger({ box: [X0, 0, Z0, X1, H, Z1], onEnter(gm) { if (!air && gm.loopAt) air = gm.loopAt('air', f, 52.8, 3.0, -5.65, { vol: 0.08, radius: 5 }); } });

    s.zoneBox({ id: 'larder', place: 'larder', box: [X0, 0, Z0, X1, H, Z1], name: 'The Keeping Room', sub: 'Ladle Row', ambience: 'shop', reverb: 'felt', env: { autoKey: 0.1, autoMax: 2.0, bloom: 0.06, contrast: 1.14, warmth: -0.04, vignette: 0.34 } });
    s.finish();
    game.spawns.larder = { frame: f, x: 51, y: 0, z: -5, yaw: 0 };
  },
};

const MET = ['A Margin flat, then. Clean shelves and nothing on them.', 'Have you eaten? Sit at the counter if you want the board. Nothing in here goes off while you decide.'];
const LARDER = [
  'If the beam were ever cut, the drum would keep the air going for fifty-five days. That is the drum\'s half.',
  'The food is the family\'s half. Hard bread, aged cheese, preserves, miso, and a tin of the Nine at the back.',
  'A good larder holds fifty-five days. A proud one holds sixty. Mine holds sixty-one, and I mention it.',
];
const CROCKS = [
  'Every crock in this room is older than the shop, and the shop is older than me.',
  'You take one full and bring it back empty. I wash it, tag it, and it goes out again.',
  "A new one would cost you most of two days' wallet in clay. So they come back.",
];
const KNOTTALK = [
  'One evening a year the block turns its lamps down and makes the larder together, as if a long dark were coming.',
  'None has come for a hundred million years. We fill the crocks anyway. It is good practice, and a good evening.',
];
const BOUGHT = {
  'cheese-slice': 'Thirty grams, cut thin. Two years in the Ring 2 cellars, and it was in no hurry.',
  'keeping-board': 'Sit, then. The lid stays on until you are on the stool.',
  miso: "The jar comes back. Wash it or don't. I'll wash it again.",
  'black-garlic': "Five weeks on the loop. Sweet as fruit, and it doesn't care what you think.",
  'larder-sour': 'Last year\'s. The block put down a hundred and twenty crocks of it, so you are helping.',
  berries: 'Put down at Knotnight for a dark that never came. It is no worse in the light.',
  rusks: 'They keep for a year and taste of it. Dip them.',
  'nine-tin': 'For the back of the shelf. Everyone has one and nobody opens it.',
  crock: ['Glazed, lidded, and older than the shop.', 'It goes back. Your name goes on the tag, so I will know.'],
};
const NAMES_READ = [
  'Paper cards along the shelf edges, the names in pencil: Okafor, Vell, the Satos, Brandt Ilunga, Flat 19C, Lindqvist, Kurt.',
  'The shelf below: Adeyemi, the Aunts, Marsh, Naredi, Holm and Paz, Flat 7A.',
  'And one card in a different hand that just says Guests, for whoever comes.',
];
const RETURNED = [
  'Crocks lent, crocks back. Each waits here with its tag on a string until it has been through the tub.',
  'Okafor, Thread Street, rinsed. The Satos, two, one lid mended with a seam of gold. Flat 19C: sorry it was late.',
];
const LIST = [
  'Last Knotnight, in chalk: what the block put down together with the lamps low.',
  'Miso, sixty-four crocks. Larder sour, a hundred and twenty. Berries, four hundred and ten jars. Rusks, twelve hundred bags. Three hundred cheeses turned.',
  'Crocks back: 171 of 184. Someone has gone over the 171 several times.',
];
const POSTER = [
  'Knotnight. Lamps down, larder up. Bring a crock.',
  "One evening a year the lamps go down and the block makes its larder together, as if a long dark were coming. It remembers the layer era, when a raft could sit in other rafts' shadow for weeks.",
];
const HANGING = [
  'Knotnight all year. Everything here keeps.',
  'Knotnight is one evening a year: the lamps go down and a neighbourhood makes its larder together. None of the long darks it remembers has come for more than a hundred million years.',
];
