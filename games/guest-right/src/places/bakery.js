// Second Rise, the bakery on Ladle Row: a full, warm shop where every warm thing has a lid, and behind the counter the
// bakehouse lies open to view. The eye goes over the glass case and the red pendants to the deck ovens glowing at the back.
// Big shapes: the bread wall (west), the counter and its glass case, the ovens under their hood, the starter shelf (east).
// Palette: oxblood and tomato red, butter plaster, cream tile with a cobalt band, honey oak, flour and linen.
import { lamp, block, warm } from '../world/kit.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { MENUS } from '../content/menus.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';
import { unit, glassCase, dome, plate, buyFrom, sayAs, spread, drawLoaf, drawBun, drawCroissant, drawPuff, foodParts } from './food_parts.js';

const TAU = Math.PI * 2;
const OX = '#7a2a22', OXD = '#5a1e18', TOM = '#c9452e', CREAM = '#f3e6cc', BUTTER = '#efcf8c', TILE = '#f1e9d8', COBALT = '#2f4f8a';
const OAK = '#9a6a3c', OAKD = '#6a4428', MAPLE = '#dcc092', FLOUR = '#f6f1e6', LINEN = '#efe7d6', BRASS = '#b08a45', STEEL = '#c9c4bb';
const IDRIS = { name: 'Idris', colour: '#e8a070' };

// a loaf crust, picked by a seed so a shelf is never one colour
const CRUSTS = ['#b8763a', '#a8662e', '#c08446', '#9a5a28', '#c48c4c'];

// a cane proving basket drawn by hand (the same shape as food.proof), covered or showing its dough
function drawProof(g, x, y, z, r, cloth) {
  const h = 0.08;
  g.mat('cane', '#c49a62'); g.lathe(x, z, [[0, y], [r * 0.7, y], [r * 0.92, y + h * 0.5], [r, y + h], [r * 0.92, y + h], [r * 0.86, y + h * 0.6]], { segs: 14, capTop: false });
  if (cloth) { g.mat('weave', cloth); g.ball(x, y + h, z, r * 1.02, 0.028, r * 1.02, { segs: 12, rings: 3, bottom: 0 }); }
  else { g.mat('plaster', '#efe2c4', { rough: 0.15 }); g.ball(x, y + h * 0.82, z, r * 0.86, 0.035, r * 0.86, { segs: 12, rings: 3, bottom: 0 }); }
}
// a honeycomb steamed cake: a yellow round, full of holes
function drawCake(g, x, y, z, r, h) {
  g.mat('plaster', '#f0d27a', { rough: 0.2 });
  g.lathe(x, z, [[0, y], [r * 0.96, y], [r, y + h * 0.12], [r * 1.01, y + h * 0.75], [r * 0.9, y + h], [r * 0.5, y + h * 1.05], [0, y + h * 1.06]], { segs: 16 });
  g.mat('plain', '#c99a3a', { rough: 0.3 }); const rng = new Rng(hashStr('cake' + r));
  for (let i = 0; i < 14; i++) { const a = rng.f(0, TAU), d = rng.f(0, r * 0.75); g.ball(x + Math.cos(a) * d, y + h * 1.04 - d * d * 0.6, z + Math.sin(a) * d, 0.006, 0.002, 0.006, { segs: 5, rings: 2 }); }
  for (let i = 0; i < 12; i++) { const a = rng.f(0, TAU), yy = rng.f(0.2, 0.7) * h; g.ball(x + Math.cos(a) * r * 1.0, y + yy, z + Math.sin(a) * r * 1.0, 0.005, 0.005, 0.005, { segs: 5, rings: 2 }); }
}

// ---------------------------------------------------------------------------------------------------------------
// Props of this shop (food.bk_*)
// ---------------------------------------------------------------------------------------------------------------

// A pendant lamp in red enamel with a cream lining, hanging from y = 0 down a cord of length L. p: { L, col }
defineProp('food.bk_shade', (g, p) => {
  const L = p.L || 1.0, y = -L, c = p.col || TOM;
  g.mat('brushed', '#3a3430'); g.tube([[0, 0, 0], [0, y + 0.02, 0]], 0.005, { segs: 4, caps: false }); g.cyl(0, -0.03, 0, 0.045, 0.03, { segs: 10 });
  g.mat('cast', BRASS, { rough: -0.15 }); g.cyl(0, y - 0.035, 0, 0.026, 0.055, { segs: 10 });
  g.mat('paint', c, { rough: -0.3 }); g.lathe(0, 0, [[0.245, y - 0.17], [0.24, y - 0.16], [0.165, y - 0.1], [0.075, y - 0.045], [0.034, y - 0.025], [0.03, y]], { segs: 22, capTop: false, capBottom: false });
  g.mat('paint', CREAM, { rough: -0.2 }); const ring = []; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; ring.push([Math.cos(a) * 0.245, y - 0.17, Math.sin(a) * 0.245]); } g.tube(ring, 0.006, { segs: 4, closed: true });
  g.mat('plain', '#fbefd6', { emissive: 0.55, lamp: true }); g.lathe(0, 0, [[0.03, y - 0.026], [0.07, y - 0.05], [0.158, y - 0.105], [0.236, y - 0.166]], { segs: 22, capTop: false, capBottom: false });
  g.mat('plain', '#fff0c8', { emissive: 4, lamp: true }); g.ball(0, y - 0.085, 0, 0.034, 0.04, 0.034, { segs: 10, rings: 6 });
  return { cast: false };
});

// The bread wall: an oxblood cupboard with three sloping oak shelves of loaves over it. Front toward +z. p: { w, d, h }
defineProp('food.bk_breadwall', (g, p) => {
  const w = p.w || 3.1, d = p.d || 0.5, h = p.h || 2.1, rng = new Rng(hashStr('bw' + w));
  // the cupboard
  g.mat('paint', OX, { rough: -0.1 }); g.box(-w / 2, 0.08, -d / 2, w / 2, 0.5, d / 2 - 0.02, { aoBottom: 0.6 });
  g.mat('paint', OXD); g.box(-w / 2 + 0.03, 0, -d / 2, w / 2 - 0.03, 0.08, d / 2 - 0.06);
  g.mat('paint', shadeHex(OX, 1.22), { rough: -0.1 });
  const nb = 4; for (let i = 0; i < nb; i++) { const x0 = -w / 2 + 0.05 + i * (w - 0.1) / nb + 0.025, x1 = -w / 2 + 0.05 + (i + 1) * (w - 0.1) / nb - 0.025; g.box(x0, 0.14, d / 2 - 0.02, x1, 0.44, d / 2 - 0.005, { bevel: 0.008 }); }
  g.mat('cast', BRASS, { rough: -0.1 }); for (let i = 0; i < nb; i++) { const xc = -w / 2 + 0.05 + (i + 0.5) * (w - 0.1) / nb; g.ball(xc, 0.4, d / 2 - 0.002, 0.012, 0.012, 0.012, { segs: 6, rings: 4 }); }
  g.mat('wood', OAK, { rough: -0.08 }); g.box(-w / 2 - 0.01, 0.5, -d / 2, w / 2 + 0.01, 0.535, d / 2 + 0.01, { bevel: 0.008 });
  // uprights, back and cornice
  const bays = 3, bw = w / bays;
  for (let u = 0; u <= bays; u++) { const x = -w / 2 + u * bw; g.box(Math.max(-w / 2, x - 0.025), 0.535, -d / 2, Math.min(w / 2, x + 0.025), h, d / 2 - 0.02, { bevel: 0.006 }); }
  g.mat('wood', shadeHex(OAK, 0.62)); g.box(-w / 2, 0.535, -d / 2, w / 2, h, -d / 2 + 0.015, { faces: 'Z' });
  g.mat('wood', OAK, { rough: -0.08 }); g.box(-w / 2 - 0.035, h, -d / 2, w / 2 + 0.035, h + 0.05, d / 2 + 0.04, { bevel: 0.01 });
  g.mat('paint', OX); g.box(-w / 2 - 0.02, h - 0.12, d / 2 - 0.03, w / 2 + 0.02, h, d / 2 + 0.01, { bevel: 0.006 });
  g.mat('paint', CREAM); g.box(-w / 2 - 0.02, h - 0.075, d / 2 + 0.01, w / 2 + 0.02, h - 0.06, d / 2 + 0.013, { faces: 'Z' });
  // three sloping shelves, lined with linen, each with its kind of loaf
  const tiers = [[0.6, 'boule'], [1.06, 'batard'], [1.5, 'tin']];
  for (const [ty, kind] of tiers) {
    g.push(); g.move(0, ty, 0.02); g.rotX(0.26);
    for (let b = 0; b < bays; b++) {
      const a0 = -w / 2 + b * bw + 0.03, a1 = a0 + bw - 0.06;
      g.mat('wood', OAK, { rough: -0.06 }); g.box(a0, -0.022, -d / 2 + 0.03, a1, 0, d / 2 - 0.04);
      g.box(a0, 0, d / 2 - 0.065, a1, 0.05, d / 2 - 0.04, { bevel: 0.006 });
      g.mat('weave', b % 2 ? LINEN : '#e8dcc0'); g.box(a0 + 0.01, 0, -d / 2 + 0.04, a1 - 0.01, 0.003, d / 2 - 0.07, { faces: 'Y' });
      if (kind === 'boule') {
        const n = Math.floor((a1 - a0) / 0.215);
        for (let i = 0; i < n; i++) for (const zz of [-0.1, 0.1]) drawLoaf(g, a0 + (i + 0.5) * (a1 - a0) / n + rng.f(-0.008, 0.008), 0.003, zz - 0.01, 'boule', rng.pick(CRUSTS), rng.f(0, 3), 9);
      } else if (kind === 'batard') {
        const n = Math.floor((a1 - a0) / 0.16);
        for (let i = 0; i < n; i++) drawLoaf(g, a0 + (i + 0.5) * (a1 - a0) / n, 0.003, -0.01, 'batard', rng.pick(CRUSTS), Math.PI / 2 + rng.f(-0.1, 0.1), 9);
      } else {
        const n = Math.floor((a1 - a0) / 0.235);
        for (let i = 0; i < n; i++) for (const zz of [-0.13, 0.0, 0.13]) drawLoaf(g, a0 + (i + 0.5) * (a1 - a0) / n, 0.003, zz - 0.01, 'tin', rng.pick(CRUSTS), rng.f(-0.06, 0.06), 9);
      }
    }
    g.pop();
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h + 0.05, d / 2]], tier: 's' };
});

// The proving cabinet: oak, glazed, raised on legs over the loop pipes; cane baskets rising on its shelves. Front toward +z.
defineProp('food.bk_proofer', (g, p) => {
  const w = p.w || 2.4, d = p.d || 0.58, h = p.h || 1.95, y0 = 0.32, rng = new Rng(hashStr('pf' + w));
  g.mat('brushed', '#5a544c'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.05) - 0.025, 0, sz * (d / 2 - 0.06) - 0.025, sx * (w / 2 - 0.05) + 0.025, y0, sz * (d / 2 - 0.06) + 0.025);
  g.mat('wood', OAK, { rough: -0.06 });
  g.box(-w / 2, y0, -d / 2, -w / 2 + 0.045, h, d / 2, { bevel: 0.008 }); g.box(w / 2 - 0.045, y0, -d / 2, w / 2, h, d / 2, { bevel: 0.008 });
  g.box(-w / 2, y0, -d / 2, w / 2, y0 + 0.07, d / 2, { bevel: 0.008 });
  g.box(-w / 2 - 0.02, h - 0.07, -d / 2, w / 2 + 0.02, h + 0.04, d / 2 + 0.03, { bevel: 0.01 });
  g.mat('paint', '#e9c88e', { emissive: 0.22, lamp: true }); g.box(-w / 2 + 0.045, y0 + 0.07, -d / 2, w / 2 - 0.045, h - 0.07, -d / 2 + 0.02, { faces: 'Z' });
  // shelves of baskets
  const shelves = [y0 + 0.07, 0.78, 1.14, 1.5];
  shelves.forEach((sy, si) => {
    g.mat('brushed', '#a9a39a'); if (si > 0) g.box(-w / 2 + 0.045, sy - 0.015, -d / 2 + 0.02, w / 2 - 0.045, sy, d / 2 - 0.05);
    const n = Math.floor((w - 0.12) / 0.25);
    for (let i = 0; i < n; i++) { const x = -w / 2 + 0.06 + (i + 0.5) * (w - 0.12) / n; drawProof(g, x, sy, -0.04, 0.1, rng.chance(0.55) ? (rng.chance(0.5) ? LINEN : '#e6d2b0') : null); }
  });
  // doors: three glazed leaves in oak frames, brass handles
  const leaves = 3, lw = (w - 0.09) / leaves;
  g.mat('wood', shadeHex(OAK, 1.08), { rough: -0.08 });
  for (let i = 0; i < leaves; i++) {
    const a0 = -w / 2 + 0.045 + i * lw, a1 = a0 + lw;
    g.box(a0, y0 + 0.07, d / 2 - 0.03, a0 + 0.05, h - 0.07, d / 2, { bevel: 0.005 }); g.box(a1 - 0.05, y0 + 0.07, d / 2 - 0.03, a1, h - 0.07, d / 2, { bevel: 0.005 });
    g.box(a0, y0 + 0.07, d / 2 - 0.03, a1, y0 + 0.16, d / 2, { bevel: 0.005 }); g.box(a0, h - 0.16, d / 2 - 0.03, a1, h - 0.07, d / 2, { bevel: 0.005 });
    g.box(a0, 1.1, d / 2 - 0.03, a1, 1.14, d / 2, { bevel: 0.004 });
  }
  g.mat('cast', BRASS, { rough: -0.15 }); for (let i = 0; i < leaves; i++) { const xh = -w / 2 + 0.045 + (i + 1) * lw - 0.09; g.tube([[xh, 1.0, d / 2], [xh, 1.0, d / 2 + 0.04], [xh, 1.24, d / 2 + 0.04], [xh, 1.24, d / 2]], 0.008, { segs: 5 }); }
  // a dial thermometer on the top rail
  g.push(); g.move(w / 2 - 0.25, h - 0.015, d / 2 + 0.03); g.rotX(Math.PI / 2);
  g.mat('cast', BRASS); g.cyl(0, -0.02, 0, 0.06, 0.02, { segs: 16 }); g.mat('plain', '#f4ecd8', { rough: -0.3 }); g.cyl(0, 0.0, 0, 0.05, 0.002, { segs: 16 });
  g.pop();
  g.mat('plain', '#8a2420'); g.box(w / 2 - 0.252, h - 0.015, d / 2 + 0.034, w / 2 - 0.248, h + 0.025, d / 2 + 0.036);
  const panes = []; for (let i = 0; i < leaves; i++) { const a0 = -w / 2 + 0.045 + i * lw + 0.05, a1 = a0 + lw - 0.1; panes.push([a0, y0 + 0.16, d / 2 - 0.015, a1, 1.1, d / 2 - 0.015, { opacity: 0.1 }], [a0, 1.14, d / 2 - 0.015, a1, h - 0.16, d / 2 - 0.015, { opacity: 0.1 }]); }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h + 0.04, d / 2 + 0.05]], tier: 's', glass: panes };
});

// The bakers' bench: a thick maple top, floured, with dough and tools on it and baskets on the shelf beneath. Front toward +z.
defineProp('food.bk_bench', (g, p) => {
  const w = p.w || 3.4, d = p.d || 0.9, h = p.h || 0.9, rng = new Rng(hashStr('bb' + w));
  g.mat('wood', OAKD, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.08) - 0.04, 0, sz * (d / 2 - 0.08) - 0.04, sx * (w / 2 - 0.08) + 0.04, h - 0.07, sz * (d / 2 - 0.08) + 0.04, { bevel: 0.008 });
  g.box(-w / 2 + 0.08, h - 0.16, -d / 2 + 0.06, w / 2 - 0.08, h - 0.07, d / 2 - 0.06, { faces: 'xXzZ' });
  g.box(-w / 2 + 0.1, 0.16, -d / 2 + 0.08, w / 2 - 0.1, 0.19, d / 2 - 0.08, { bevel: 0.006 });
  g.mat('wood', MAPLE, { rough: 0.05 }); g.box(-w / 2, h - 0.07, -d / 2, w / 2, h, d / 2, { bevel: 0.014 });
  // flour on the top, worst where the dough is worked
  g.mat('plaster', '#ecdcbc', { rough: 0.35 });
  for (const [x, z, rx, rz] of [[-0.75, 0.05, 0.5, 0.3], [-0.35, -0.2, 0.25, 0.16], [0.35, -0.05, 0.45, 0.3], [1.15, 0.1, 0.25, 0.18], [-1.3, -0.15, 0.2, 0.16]]) g.ball(x, h, z, rx, 0.002, rz, { segs: 14, rings: 2, bottom: 0 });
  g.mat('plaster', FLOUR, { rough: 0.35 });
  for (const [x, z, rx, rz] of [[-0.85, 0.12, 0.22, 0.12], [0.3, 0.05, 0.18, 0.1], [-0.5, -0.12, 0.1, 0.07]]) g.ball(x, h + 0.001, z, rx, 0.002, rz, { segs: 12, rings: 2, bottom: 0 });
  // a mass of dough, a row of rounds, a scraper, a rolling pin, a dredger
  g.mat('plaster', '#efe2c4', { rough: 0.15 }); g.ball(-0.7, h + 0.002, 0.02, 0.24, 0.075, 0.19, { segs: 16, rings: 5, bottom: 0 });
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) g.ball(0.05 + i * 0.12 + rng.f(-0.01, 0.01), h + 0.002, -0.14 + j * 0.13, 0.045, 0.04, 0.045, { segs: 10, rings: 4, bottom: 0 });
  g.mat('brushed', STEEL, { rough: -0.2 }); g.box(-0.3, h + 0.002, 0.18, -0.18, h + 0.004, 0.27);
  g.mat('wood', OAKD); g.box(-0.3, h + 0.004, 0.25, -0.18, h + 0.02, 0.28, { bevel: 0.006 });
  g.push(); g.move(1.05, h + 0.03, 0.12); g.rotY(0.3); g.rotZ(Math.PI / 2); g.mat('wood', '#c9a46a', { rough: -0.05 }); g.cyl(0, -0.2, 0, 0.03, 0.4, { segs: 10 }); g.cyl(0, -0.3, 0, 0.012, 0.6, { segs: 6 }); g.pop();
  g.mat('brushed', STEEL, { rough: -0.2 }); g.lathe(1.4, -0.2, [[0, h], [0.04, h], [0.04, h + 0.11], [0.036, h + 0.13], [0, h + 0.135]], { segs: 12 });
  // under the bench: stacked baskets, a flour bin, folded linen
  for (let i = 0; i < 4; i++) drawProof(g, -1.2 + (i % 2) * 0.02, 0.19 + i * 0.075, 0.05, 0.11, null);
  for (let i = 0; i < 3; i++) drawProof(g, -0.85, 0.19 + i * 0.075, -0.05, 0.11, null);
  g.mat('paint', '#e6dcc4', { rough: -0.1 }); g.lathe(0.2, 0, [[0, 0.19], [0.18, 0.19], [0.2, 0.25], [0.2, 0.55], [0, 0.55]], { segs: 16 });
  g.mat('paint', TOM); g.lathe(0.2, 0, [[0.202, 0.42], [0.202, 0.46]], { segs: 16, capTop: false, capBottom: false });
  for (let i = 0; i < 5; i++) { g.mat('weave', i % 2 ? LINEN : '#e3d6bc'); g.box(0.75, 0.19 + i * 0.022, -0.16, 1.15, 0.209 + i * 0.022, 0.14, { bevel: 0.008 }); }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A deep glazed sink on an oak stand with a draining board and a brass tap. Front toward +z. p: { w }
defineProp('food.bk_sink', (g, p) => {
  const w = p.w || 1.15, d = 0.55, h = 0.9, sw = 0.62;
  g.mat('wood', OAKD); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.05) - 0.03, 0, sz * (d / 2 - 0.05) - 0.03, sx * (w / 2 - 0.05) + 0.03, h - 0.26, sz * (d / 2 - 0.05) + 0.03, { bevel: 0.006 });
  g.box(-w / 2 + 0.05, 0.12, -d / 2 + 0.05, w / 2 - 0.05, 0.15, d / 2 - 0.05, { bevel: 0.006 });
  // the sink at the -x end
  const sx0 = -w / 2, sx1 = -w / 2 + sw;
  g.mat('glaze', '#f2eee6', { rough: -0.3 }); g.box(sx0, h - 0.26, -d / 2, sx1, h, d / 2, { bevel: 0.02, faces: 'xXzZy' });
  g.box(sx0, h - 0.02, -d / 2, sx1, h, -d / 2 + 0.04); g.box(sx0, h - 0.02, d / 2 - 0.04, sx1, h, d / 2); g.box(sx0, h - 0.02, -d / 2, sx0 + 0.04, h, d / 2); g.box(sx1 - 0.04, h - 0.02, -d / 2, sx1, h, d / 2);
  g.mat('glaze', '#d8d2c6', { rough: -0.3 }); g.box(sx0 + 0.04, h - 0.22, -d / 2 + 0.04, sx1 - 0.04, h - 0.215, d / 2 - 0.04, { faces: 'Y' });
  g.box(sx0 + 0.04, h - 0.22, -d / 2 + 0.04, sx0 + 0.045, h - 0.02, d / 2 - 0.04, { faces: 'X' }); g.box(sx1 - 0.045, h - 0.22, -d / 2 + 0.04, sx1 - 0.04, h - 0.02, d / 2 - 0.04, { faces: 'x' });
  g.box(sx0 + 0.04, h - 0.22, -d / 2 + 0.04, sx1 - 0.04, h - 0.02, -d / 2 + 0.045, { faces: 'Z' }); g.box(sx0 + 0.04, h - 0.22, d / 2 - 0.045, sx1 - 0.04, h - 0.02, d / 2 - 0.04, { faces: 'z' });
  // draining board, grooved
  g.mat('wood', MAPLE, { rough: 0.05 }); g.box(sx1, h - 0.05, -d / 2, w / 2, h - 0.01, d / 2, { bevel: 0.008 });
  g.mat('wood', shadeHex(MAPLE, 0.8)); for (let i = 0; i < 6; i++) { const z = -d / 2 + 0.08 + i * (d - 0.16) / 5; g.box(sx1 + 0.04, h - 0.01, z - 0.004, w / 2 - 0.04, h - 0.008, z + 0.004, { faces: 'Y' }); }
  // tap
  g.mat('cast', BRASS, { rough: -0.2 }); const tx = (sx0 + sx1) / 2;
  g.tube([[tx, h, -d / 2 + 0.02], [tx, h + 0.25, -d / 2 + 0.02], [tx, h + 0.3, -d / 2 + 0.08], [tx, h + 0.22, -d / 2 + 0.16]], 0.014, { segs: 8 });
  for (const s2 of [-1, 1]) { g.cyl(tx + s2 * 0.08, h + 0.12, -d / 2 + 0.02, 0.012, 0.04, { segs: 6 }); g.box(tx + s2 * 0.08 - 0.03, h + 0.16, -d / 2 + 0.015, tx + s2 * 0.08 + 0.03, h + 0.17, -d / 2 + 0.025); }
  // a bucket and a brush underneath
  g.mat('brushed', '#9a948a'); g.lathe(0.25, 0.02, [[0, 0.15], [0.12, 0.15], [0.14, 0.4], [0.13, 0.4], [0.11, 0.17]], { segs: 14, capTop: false });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A linen airer hung from the ceiling at y = 0, with cloths over its rails. Front toward +z. p: { w, d }
defineProp('food.bk_airer', (g, p) => {
  const w = p.w || 2.6, d = p.d || 0.6, rng = new Rng(hashStr('air' + w));
  g.mat('weave', '#d8cdb0'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * (w / 2 - 0.1), 0, 0], [sx * (w / 2 - 0.1), -0.62, sz * d / 2]], 0.004, { segs: 3, caps: false });
  g.mat('cast', '#3a3430'); for (const sx of [-1, 1]) { g.box(sx * (w / 2 - 0.1) - 0.02, -0.66, -d / 2 - 0.02, sx * (w / 2 - 0.1) + 0.02, -0.62, d / 2 + 0.02, { bevel: 0.006 }); g.cyl(sx * (w / 2 - 0.1), -0.04, 0, 0.035, 0.04, { segs: 10 }); }
  g.mat('wood', '#c9a46a', { rough: -0.05 }); const rails = 4;
  for (let i = 0; i < rails; i++) { const z = -d / 2 + i * d / (rails - 1); g.push(); g.move(0, -0.64, z); g.rotZ(Math.PI / 2); g.cyl(0, -w / 2, 0, 0.016, w, { segs: 6 }); g.pop(); }
  const cols = [LINEN, '#e8dcc0', '#d9c79a', LINEN, TOM];
  for (let i = 0; i < rails; i++) {
    const z = -d / 2 + i * d / (rails - 1); let x = -w / 2 + 0.2;
    while (x < w / 2 - 0.5) {
      const cw = rng.f(0.35, 0.55), drop = rng.f(0.22, 0.38); g.mat('weave', rng.pick(cols), { rough: 0.1 });
      g.sheet([x, -0.625, z + 0.004], [x + cw, -0.625, z + 0.004], [x + cw, -0.625 - drop, z + 0.012], [x, -0.625 - drop, z + 0.012], { nu: 3, nv: 2, sag: 0.01 });
      x += cw + rng.f(0.08, 0.25);
    }
  }
  return { cast: false };
});

// A stack of paper bags with a cone of string beside it. Front toward +z.
defineProp('food.bk_bags', (g) => {
  for (let i = 0; i < 10; i++) { g.mat('paper', i % 3 ? '#c9a87a' : '#e6d6b4'); const o = (i % 2) * 0.006 - 0.003; g.box(-0.1 + o, i * 0.006, -0.13 - o, 0.1 + o, i * 0.006 + 0.005, 0.13 - o); }
  g.mat('paper', '#efe6cf'); g.box(-0.06, 0.06, -0.09, 0.06, 0.062, 0.05, { faces: 'Y' });
  g.mat('wood', OAKD); g.cyl(0.2, 0, 0, 0.045, 0.012, { segs: 12 }); g.mat('cast', BRASS); g.cyl(0.2, 0.012, 0, 0.005, 0.15, { segs: 6 });
  g.mat('weave', TOM); g.lathe(0.2, 0, [[0.034, 0.014], [0.036, 0.03], [0.026, 0.09], [0.014, 0.12], [0.008, 0.125]], { segs: 12 });
  g.mat('weave', TOM); g.tube([[0.2, 0.16, 0], [0.16, 0.15, 0.03], [0.1, 0.08, 0.06]], 0.0018, { segs: 3 });
  return { cast: false };
});

// A honeycomb steamed cake on a little board. p: { r }
defineProp('food.bk_cake', (g, p) => {
  const r = p.r || 0.1; g.mat('wood', '#8a5a32', { rough: -0.1 }); g.cyl(0, 0, 0, r + 0.025, 0.014, { segs: 18 });
  g.mat('paper', '#f3ead8'); g.cyl(0, 0.014, 0, r + 0.012, 0.002, { segs: 18 });
  drawCake(g, 0, 0.016, 0, r, r * 0.65);
  return { cast: false };
});

// A small plate of pastries for a shelf. p: { kind: 'croissant' | 'bun' | 'puff' | 'plait' }
defineProp('food.bk_plate', (g, p) => {
  const k = p.kind || 'bun', rng = new Rng(hashStr('pl' + k));
  g.mat('glaze', p.glaze || '#efe8da', { rough: -0.3 }); g.lathe(0, 0, [[0, 0], [0.08, 0], [0.13, 0.014], [0.125, 0.018], [0.08, 0.008], [0, 0.007]], { segs: 18, capTop: false });
  if (k === 'croissant') { drawCroissant(g, -0.03, 0.008, 0.02, 0.3); drawCroissant(g, 0.04, 0.008, -0.01, -0.4); drawCroissant(g, 0.0, 0.03, 0.0, 0.1); }
  else if (k === 'puff') { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; drawPuff(g, Math.cos(a) * 0.05, 0.008, Math.sin(a) * 0.05); } drawPuff(g, 0, 0.03, 0); }
  else if (k === 'plait') drawLoaf(g, 0, 0.008, 0, 'plait', '#c07a36', rng.f(-0.2, 0.2), 9);
  else { for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; drawBun(g, Math.cos(a) * 0.05, 0.008, Math.sin(a) * 0.05, 0.036, '#b86a2c', '#f4ecdc'); } drawBun(g, 0, 0.035, 0, 0.034, '#b86a2c', '#f4ecdc'); }
  return { cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// The place
// ---------------------------------------------------------------------------------------------------------------

export const place = {
  id: 'bakery', name: 'Second Rise', order: 40,
  build(game) {
    void foodParts;
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('bakery', f);
    const X0 = 30, X1 = 39, Z0 = -13.5, Z1 = -4, H = 3.2;
    const xi0 = X0 + 0.16, xi1 = X1 - 0.16, zb = Z0 + 0.16;
    const DOOR0 = 34.0, DOOR1 = 35.1;

    const U = unit(s, {
      x0: X0, x1: X1, z0: Z0, z1: Z1, h: H,
      floor: ['pattern', '#e2b48e'], ceil: ['paint', '#f2e8d4'],
      wall: { tint: BUTTER, mat: 'plaster', dado: { h: 1.2, mat: 'tile', tint: TILE }, skirt: OXD },
      backWall: { dado: { h: 2.15, mat: 'tile', tint: TILE } },
      beams: { tint: '#8a5a32' }, rail: OX,
      front: {
        fascia: Object.assign({}, SIGNS['bakery.fascia'], { emblem: 'loaf', palette: [OX, '#f6e7c8', '#e8b85a'] }),
        palette: { frame: OX, plinth: OXD, awning: [TOM, CREAM] }, awning: true,
        door: { at: DOOR0 - (X0 + 0.22), w: DOOR1 - DOOR0, tint: OX }, glow: 0.6,
      },
      backDoor: { at: 7.1, w: 0.9, label: 'the flour store', tint: OXD, text: 'The flour store. Staff only.' },
      glow: { sky: '#ffd8a8', ground: '#d9a070', power: 0.2 },
    });
    const clip = U.clip, spill = U.spill;
    const glowStrip = (a, b, o) => {
      if (o.fitting !== false) s.deco((g) => { g.mat('diffuser', '#fff1d8', { emissive: 0.9, lamp: true }); g.box(Math.min(a[0], b[0]) - 0.015, a[1] - 0.012, Math.min(a[2], b[2]) - 0.015, Math.max(a[0], b[0]) + 0.015, a[1], Math.max(a[2], b[2]) + 0.015, { faces: 'yxXzZ' }); });
      s.light({ at: [a[0], a[1] - 0.03, a[2]], to: [b[0], b[1] - 0.03, b[2]], type: 'tube', color: warm(o.K || 3000), power: 5 * o.power, range: o.range || 3, radius: 0.04, clip: o.clip || clip, lamp: true });
    };

    // ---- the walls dressed: a cobalt band along the top of the tiles, a red cornice ----
    s.deco((g) => {
      g.mat('tile', COBALT, { rough: -0.2 });
      g.box(xi0, 1.17, zb + 0.2, xi0 + 0.012, 1.23, Z1 - 0.25); g.box(xi1 - 0.012, 1.17, zb + 0.2, xi1, 1.23, Z1 - 0.25);
      g.box(xi0, 2.12, zb, xi1, 2.18, zb + 0.012);
      g.mat('paint', OX); g.box(xi0, H - 0.08, zb, xi1, H, zb + 0.05); g.box(xi0, H - 0.08, zb, xi0 + 0.05, H, Z1 - 0.25); g.box(xi1 - 0.05, H - 0.08, zb, xi1, H, Z1 - 0.25);
    });
    // felt hung between the beams over the shop, red and ochre, so the room does not ring
    s.deco((g) => {
      const cols = [TOM, '#d9a548', OX, '#d9a548', TOM];
      [-7.5, -7.05, -6.65].forEach((zc, j) => [[30.7, 34.15], [34.95, 38.35]].forEach((a, i) => {
        g.mat('felt', cols[(i + j) % cols.length]); g.sheet([a[0], 3.04, zc], [a[1], 3.04, zc], [a[1], 2.9, zc], [a[0], 2.9, zc], { nu: 6, nv: 2, ripple: 0.008, rippleN: 5 });
        g.mat('cast', BRASS); g.box(a[0], 2.89, zc - 0.006, a[1], 2.905, zc + 0.006);
      }));
    });
    // the doormat and a runner to the counter
    prop(s, 'rug', 34.55, 0, -4.75, 0, { w: 1.2, d: 0.6, mat: 'rush', a: '#8a7650', b: '#5a4a32' });
    prop(s, 'rug', 35.6, 0, -7.0, 0.12, { w: 1.0, d: 2.0, a: OX, b: '#e8b85a' });

    // ---- the windows: two oak beds of bread under the awning ----
    const BY = 0.5;
    const bed = (a0, a1) => {
      block(s, a0, 0, -4.9, a1, BY, -4.24, 'wood', OAKD, { bevel: 0.01 });
      s.deco((g) => { g.mat('weave', LINEN); g.box(a0 + 0.01, BY, -4.89, a1 - 0.01, BY + 0.006, -4.25, { faces: 'Y' }); g.mat('weave', TOM); g.sheet([a0 + 0.01, BY + 0.004, -4.9], [a1 - 0.01, BY + 0.004, -4.9], [a1 - 0.01, BY - 0.12, -4.915], [a0 + 0.01, BY - 0.12, -4.915], { nu: 8, nv: 2, ripple: 0.006, rippleN: 7 }); });
    };
    bed(30.3, 33.85); bed(35.25, 38.7);
    const BT = BY + 0.006;
    // west window: a basket of boules, the plait under a dome, croissants under linen, a steamer, rolls
    prop(s, 'food.basket', 30.75, BT, -4.58, 0.08, { w: 0.5, d: 0.36, fill: 'boule', crust: '#a8662e', seed: 1 });
    dome(s, 31.45, BT, -4.58, 0.17, 0.2); prop(s, 'food.loaf', 31.45, BT + 0.03, -4.58, 0.4, { kind: 'plait', crust: '#c07a36' });
    prop(s, 'food.tray', 32.2, BT, -4.6, -0.05, { w: 0.5, d: 0.34, fill: 'croissant', cover: LINEN, seed: 2 });
    prop(s, 'food.basket', 32.95, BT, -4.55, -0.1, { w: 0.42, d: 0.3, h: 0.1, fill: 'roll', crust: '#c08446', seed: 3 });
    prop(s, 'food.steamer', 33.55, BT, -4.6, 0, { r: 0.14, n: 3 });
    plate(s, '0.40', 'sugar bun', 32.2, BT + 0.035, -4.33, 'Z', 0.08); plate(s, '2.20', 'plait', 31.45, BT + 0.035, -4.33, 'Z', 0.08);
    // east window: batards, the honeycomb cake under a dome, a covered basket of buns, steamers, linen
    prop(s, 'food.basket', 35.75, BT, -4.58, -0.06, { w: 0.55, d: 0.36, fill: 'batard', crust: '#b8763a', seed: 4 });
    dome(s, 36.55, BT, -4.58, 0.16, 0.2); prop(s, 'food.bk_cake', 36.55, BT + 0.026, -4.58, 0, { r: 0.1 });
    prop(s, 'food.steamer', 37.2, BT, -4.62, 0.3, { r: 0.13, n: 2 }); prop(s, 'food.steamer', 37.32, BT + 0.175, -4.6, 0.8, { r: 0.12, n: 1 });
    prop(s, 'food.basket', 37.95, BT, -4.58, 0.1, { w: 0.48, d: 0.34, fill: 'bun', crust: '#b86a2c', covered: true, seed: 5 });
    prop(s, 'food.linen', 38.45, BT, -4.7, 0.2, { col: LINEN, col2: TOM, n: 3, w: 0.22, d: 0.18 });
    plate(s, '0.30', 'honeycomb', 36.55, BT + 0.035, -4.33, 'Z', 0.08);
    lamp(s, 'spot', 32.0, 3.18, -4.6, { clip: spill, cone: [36, 16], power: 1.1, K: 2900 });
    lamp(s, 'spot', 37.0, 3.18, -4.6, { clip: spill, cone: [36, 16], power: 1.1, K: 2900 });
    // a globe just inside the door: the light that reaches the street at four in the morning
    lamp(s, 'globe', 34.55, 2.5, -5.4, { clip: spill, power: 0.75, K: 2700, r: 0.15, drop: 0.7 });

    // ---- the bread wall (west), lit from under its cornice ----
    const WX = xi0 + 0.25, WZ = -6.75;
    prop(s, 'food.bk_breadwall', WX, 0, WZ, Math.PI / 2, { w: 3.1, d: 0.5, h: 2.1 });
    glowStrip([WX + 0.12, 2.04, WZ - 1.45], [WX + 0.12, 2.04, WZ + 1.45], { power: 0.5, K: 2900, range: 2.4 });
    // baskets of rolls and tins of rusks on top of it
    spread(WZ - 1.4, WZ + 1.4, 5, (z, i) => {
      if (i % 2 === 0) prop(s, 'food.basket', WX, 2.15, z, Math.PI / 2, { w: 0.42, d: 0.3, h: 0.12, fill: i === 2 ? 'bun' : 'roll', covered: i !== 2, cloth: i === 2 ? LINEN : '#e6d2b0', seed: 10 + i });
      else prop(s, 'food.tin', WX, 2.15, z, 0, { col: i === 1 ? COBALT : TOM, band: CREAM, h: 0.2, r: 0.08 });
    });
    for (const [z, t, sb, y] of [[WZ - 1.03, '0.70', 'country boule', 0.56], [WZ, '0.60', 'batard', 1.02], [WZ + 1.03, '0.50', 'tin loaf', 1.46]]) plate(s, t, sb, WX + 0.24, y, z, 'X', 0.09);

    // ---- the middle: a stall with a red cloth, baskets under linen, steamers, a cake under glass ----
    const MX = 32.65, MZ = -6.45;
    prop(s, 'food.stall', MX, 0, MZ, 0, { w: 1.3, d: 0.62, h: 0.74, cloth: TOM, trim: CREAM, wood: OAK });
    const MT = 0.74;
    prop(s, 'food.basket', MX - 0.35, MT, MZ + 0.05, 0.1, { w: 0.46, d: 0.34, fill: 'bun', crust: '#b86a2c', top: '#f4ecdc', covered: true, seed: 20 });
    prop(s, 'food.basket', MX + 0.2, MT, MZ + 0.12, -0.12, { w: 0.4, d: 0.3, h: 0.1, fill: 'puff', covered: true, cloth: '#e6d2b0', seed: 21 });
    prop(s, 'food.steamer', MX + 0.4, MT, MZ - 0.16, 0, { r: 0.13, n: 3 });
    dome(s, MX - 0.05, MT, MZ - 0.17, 0.13, 0.16); prop(s, 'food.bk_cake', MX - 0.05, MT + 0.026, MZ - 0.17, 0, { r: 0.085 });
    plate(s, '0.30', 'six cheese puffs', MX + 0.2, MT - 0.06, MZ + 0.322, 'Z', 0.09); plate(s, '0.40', 'sugar bun', MX - 0.35, MT - 0.06, MZ + 0.322, 'Z', 0.08);
    lamp(s, 'spot', MX, 3.18, MZ, { clip, cone: [24, 11], power: 0.75, K: 3000 });

    // ---- the counter: oxblood and cream tile, an oak top; the glass case in the middle ----
    const CZ0 = -9.25, CZ1 = -8.6, CT = 0.93, GX0 = 32.3, GX1 = 35.0, CX1 = 37.6;
    const counterRun = (a0, a1, endCap) => {
      s.furniture((g) => {
        g.mat('paint', OX, { rough: -0.08 }); g.box(a0, 0.1, CZ0 + 0.02, a1, CT - 0.05, CZ1 - 0.02, { aoBottom: 0.6 });
        g.mat('paint', OXD); g.box(a0, 0, CZ0 + 0.04, a1, 0.1, CZ1 - 0.06);
        const n = Math.max(1, Math.round((a1 - a0) / 0.62));
        for (let i = 0; i < n; i++) {
          const b0 = a0 + 0.06 + i * (a1 - a0 - 0.12) / n + 0.03, b1 = a0 + 0.06 + (i + 1) * (a1 - a0 - 0.12) / n - 0.03;
          g.mat('tile', CREAM, { rough: -0.2 }); g.box(b0, 0.18, CZ1 - 0.02, b1, CT - 0.15, CZ1 - 0.008);
          g.mat('wood', OAK, { rough: -0.08 }); g.box(b0 - 0.02, 0.16, CZ1 - 0.02, b1 + 0.02, 0.19, CZ1 - 0.002, { bevel: 0.004 }); g.box(b0 - 0.02, CT - 0.16, CZ1 - 0.02, b1 + 0.02, CT - 0.13, CZ1 - 0.002, { bevel: 0.004 });
        }
        g.mat('paint', TOM); g.box(a0, CT - 0.12, CZ1 - 0.021, a1, CT - 0.06, CZ1 - 0.006);
        if (endCap) { g.mat('paint', OX); g.box(a1 - 0.02, 0.1, CZ0 + 0.02, a1 + 0.004, CT - 0.05, CZ1 - 0.02); g.mat('tile', CREAM); g.box(a1, 0.18, CZ0 + 0.1, a1 + 0.012, CT - 0.15, CZ1 - 0.1); }
        g.mat('wood', OAK, { rough: -0.12 }); g.box(a0 - (a0 > xi0 + 0.01 ? 0.01 : 0), CT - 0.05, CZ0 - 0.02, a1 + (endCap ? 0.03 : 0.01), CT, CZ1 + 0.04, { bevel: 0.012 });
        // the bakehouse side: open shelves of bags and linen
        g.mat('wood', OAKD); g.box(a0, 0.4, CZ0 + 0.02, a1, 0.43, CZ1 - 0.1, { faces: 'yYz' });
      });
      s.solid(a0, 0, CZ0, a1 + (endCap ? 0.03 : 0), CT, CZ1 + 0.04);
    };
    counterRun(xi0, GX0, false); counterRun(GX1, CX1, true);
    glassCase(s, { x0: GX0, z0: CZ0 + 0.03, x1: GX1, z1: CZ1 + 0.02, base: 0.86, top: 1.32, body: OX, bodyMat: 'paint', topMat: 'wood', topTint: OAK, lining: CREAM, frame: BRASS, shelves: [1.09], panels: 'Z' });
    const GY = 0.864, GS = 1.092, GZ = (CZ0 + CZ1) / 2 + 0.03;
    prop(s, 'food.tray', 32.7, GY, GZ, 0, { w: 0.62, d: 0.42, fill: 'croissant', seed: 30 });
    prop(s, 'food.tray', 33.35, GY, GZ, 0, { w: 0.6, d: 0.42, fill: 'puff', seed: 31 });
    prop(s, 'food.tray', 34.0, GY, GZ, 0, { w: 0.6, d: 0.42, fill: 'bun', top: '#f4ecdc', seed: 32 });
    prop(s, 'food.tray', 34.62, GY, GZ, 0, { w: 0.6, d: 0.42, fill: 'cake', col: '#f0d27a', seed: 33 });
    spread(GX0 + 0.05, GX1 - 0.05, 6, (x, i) => prop(s, 'food.bk_plate', x, GS, GZ, i * 0.7, { kind: ['plait', 'croissant', 'bun', 'puff', 'plait', 'bun'][i] }));
    for (const [x, t, sb] of [[32.7, '0.55', 'croissant'], [33.35, '0.30', 'six puffs'], [34.0, '0.40', 'sugar bun'], [34.62, '0.30', 'honeycomb']]) plate(s, t, sb, x, GY + 0.025, CZ1 - 0.005, 'Z', 0.075);
    s.deco((g) => { g.mat('diffuser', '#fff1d8', { emissive: 2.5, lamp: true }); g.box(GX0 + 0.08, 1.3, CZ0 + 0.1, GX1 - 0.08, 1.31, CZ0 + 0.13, { faces: 'yzZ' }); });
    s.light({ at: [GX0 + 0.15, 1.27, CZ0 + 0.12], to: [GX1 - 0.15, 1.27, CZ0 + 0.12], type: 'tube', color: warm(3100), power: 1.6, range: 1.3, radius: 0.03, clip: [GX0 - 0.02, 0.84, CZ0, GX1 + 0.02, 1.33, CZ1 + 0.6], lamp: true });

    // on the west run: the Lovage loaves in their basket, honestly labelled; yesterday's heels
    const LX = 31.45, LZ = -8.93;
    prop(s, 'food.basket', LX, CT, LZ, 0.04, { w: 0.66, d: 0.46, h: 0.15, fill: 'boule', crust: '#7a4220', cane: '#a8784a', seed: 40 });
    sign(s, { kind: 'notice', title: 'The Lovage loaf', lines: ['Baked at the Crock,', 'in Lovage.', 'In by the first glide.', 'We sell it.', "We don't make it."], paper: '#f3ead6' }, LX + 0.2, CT + 0.21, LZ + 0.24, { face: 'Z', w: 0.16, h: 0.21 });
    s.detail((g) => { g.mat('wood', OAKD); g.box(LX + 0.19, CT, LZ + 0.2, LX + 0.21, CT + 0.11, LZ + 0.23); });
    plate(s, '1.10', 'Lovage loaf', LX - 0.15, CT + 0.035, CZ1 + 0.042, 'Z', 0.09);
    prop(s, 'food.basket', 30.62, CT, -8.95, -0.05, { w: 0.42, d: 0.4, h: 0.12, fill: 'batard', crust: '#9a5a28', cloth: '#e6d2b0', seed: 41 });
    plate(s, 'Free', "yesterday's heels", 30.62, CT + 0.035, CZ1 + 0.042, 'Z', 0.09);
    // on the east run: the starter crock and its card, the scale, bags and string, a steamer
    const SX = 35.45, SZ = -8.98;
    prop(s, 'food.domebase', SX, CT, SZ, 0, { r: 0.17, wood: OAKD });
    prop(s, 'food.crock', SX, CT + 0.026, SZ, 0.3, { glaze: '#4a5a6a', h: 0.3, r: 0.13, lid: 'cloth', cloth: LINEN, string: TOM, band: '#c9b48a', paper: '#efe2c4' });
    s.detail((g) => {
      g.mat('wood', '#c9a46a', { rough: -0.05 }); g.tube([[SX + 0.08, CT + 0.03, SZ + 0.12], [SX + 0.1, CT + 0.34, SZ + 0.04]], 0.008, { segs: 5 }); g.ball(SX + 0.078, CT + 0.04, SZ + 0.125, 0.025, 0.012, 0.03, { segs: 8, rings: 4 });
      g.mat('cast', BRASS); g.box(SX - 0.06, CT, SZ + 0.2, SX + 0.06, CT + 0.008, SZ + 0.24); g.box(SX - 0.004, CT, SZ + 0.205, SX + 0.004, CT + 0.11, SZ + 0.215);
    });
    sign(s, { kind: 'notice', title: 'Strain library', lines: ['Registered starter', 'Second Rise mother', 'Kept by the Tamm table', 'Vial and genome on file'], paper: '#e8eef0' }, SX, CT + 0.08, SZ + 0.232, { face: 'Z', w: 0.11, h: 0.15 });
    prop(s, 'food.scale', 36.08, CT, -8.95, 0, { kind: 'dial', col: CREAM });
    prop(s, 'food.bk_bags', 36.68, CT, -8.95, 0.1, {});
    prop(s, 'food.steamer', 37.25, CT, -8.95, 0.2, { r: 0.13, n: 3 });
    prop(s, 'food.steamer', 37.22, CT + 0.235, -8.93, 0.9, { r: 0.12, n: 1 });
    // three red pendants low over the counter
    for (const x of [31.35, 33.65, 36.3]) { prop(s, 'food.bk_shade', x, H, -8.92, 0, { L: 1.02 }); lamp(s, 'bulb', x, H - 1.13, -8.92, { clip, power: 0.75, K: 2700, range: 3.6 }); }

    // ---- the east wall: a bench to wait on, the starter shelf over it ----
    prop(s, 'bench', xi1 - 0.24, 0, -6.15, -Math.PI / 2, { w: 1.6, wood: OAK, back: true, metal: OXD }, { spot: { tags: ['bakery', 'wait'] } });
    const SH0 = -7.95, SH1 = -5.35, SD = 0.28;
    s.furniture((g) => {
      g.mat('wood', OAK, { rough: -0.08 });
      for (const y of [1.52, 1.9, 2.26]) g.box(xi1 - SD, y - 0.03, SH0, xi1, y, SH1, { bevel: 0.006 });
      g.mat('paint', OX); for (const y of [1.52, 1.9]) g.box(xi1 - SD - 0.012, y - 0.06, SH0, xi1 - SD + 0.004, y - 0.03, SH1);
      g.mat('cast', '#3a3430'); for (const y of [1.52, 1.9, 2.26]) for (const z of [SH0 + 0.2, (SH0 + SH1) / 2, SH1 - 0.2]) g.tube([[xi1, y - 0.2, z], [xi1 - 0.02, y - 0.12, z], [xi1 - 0.2, y - 0.035, z]], 0.007, { segs: 5 });
    });
    const GLAZES = ['#7a5236', '#4a5a6a', '#a8563a', '#2f5a4a', '#c9a04a', '#6a3a4a', '#3a4a6a', '#8a7a5a', '#b86a3a'];
    const CLOTHS = [LINEN, '#e6d2b0', '#d9a0a0', '#c9d8c0', '#efe0b0', '#c8c0d8'];
    const crocks = (y, n, gap) => spread(SH0 + 0.12, SH1 - 0.12, n, (z, i) => {
      if (i === gap) return;
      const k = (i * 5 + Math.round(y * 10)) % GLAZES.length, h = 0.13 + ((i * 7) % 4) * 0.018, r = 0.055 + ((i * 3) % 3) * 0.008;
      prop(s, 'food.crock', xi1 - 0.14, y, z, i * 1.1, { glaze: GLAZES[k], h, r, lid: 'cloth', cloth: CLOTHS[(i + k) % CLOTHS.length], string: i % 3 ? '#8a2f2a' : '#3a5a8a', label: false });
      s.detail((g) => { g.mat('weave', '#d8cdb0'); g.tube([[xi1 - 0.14 - r * 0.8, y + h * 0.86, z], [xi1 - 0.14 - r - 0.012, y + h * 0.55, z + 0.01]], 0.0015, { segs: 3, caps: false }); g.mat('paper', i % 2 ? '#f3ead6' : '#e8dcc0'); g.box(xi1 - 0.14 - r - 0.016, y + h * 0.4, z - 0.012, xi1 - 0.14 - r - 0.012, y + h * 0.56, z + 0.028); });
    });
    crocks(1.52, 9, -1); crocks(1.9, 8, 5);
    const GAPZ = SH0 + 0.12 + (SH1 - SH0 - 0.24) * 5.5 / 8;
    sign(s, { kind: 'letters', text: 'Spelt?', palette: ['#3a3834'] }, xi1 - 0.158, 1.965, GAPZ, { face: 'x', w: 0.12, h: 0.06, board: false });
    s.detail((g) => { g.mat('paper', '#f8f4ea'); g.box(xi1 - 0.156, 1.9, GAPZ - 0.07, xi1 - 0.15, 2.03, GAPZ + 0.07, { faces: 'x' }); });
    // the top shelf: spare crocks and stacked steamers
    for (const [z, t] of [[-7.6, 0], [-6.9, 1], [-6.2, 0], [-5.6, 1]]) { if (t) prop(s, 'food.steamer', xi1 - 0.14, 2.26, z, 0, { r: 0.12, n: 3 }); else prop(s, 'food.crock', xi1 - 0.14, 2.26, z, 0, { glaze: '#e6dcc4', h: 0.24, r: 0.1, band: COBALT }); }
    glowStrip([xi1 - 0.55, 2.1, SH0 + 0.3], [xi1 - 0.55, 2.1, SH1 - 0.3], { power: 0.16, K: 2700, range: 1.4, fitting: false });
    plate(s, 'Left by guests', 'take a spoon, leave a spoon', xi1 - SD - 0.013, 1.475, (SH0 + SH1) / 2, 'x', 0.22);

    // ================= the bakehouse =================
    // the ovens under their hood, against the tiled back wall
    const OZ = zb + 0.47;
    prop(s, 'food.oven', 34.15, 0, OZ, 0, { w: 1.65, d: 0.9, decks: 3, body: '#d6cfc2', trim: '#2e2a26' });
    prop(s, 'food.oven', 35.95, 0, OZ, 0, { w: 1.35, d: 0.9, decks: 2, body: '#d6cfc2', trim: OX });
    for (let i = 0; i < 4; i++) drawProofProp(s, 35.65 + (i % 2) * 0.24, 1.4 + Math.floor(i / 2) * 0.08, OZ - 0.05 + (i % 2) * 0.02);
    // the deck windows burn brighter than the shared oven draws them, with the loaves dark against the glow
    s.deco((g) => {
      for (const [x, w, n] of [[34.15, 1.65, 3], [35.95, 1.35, 2]]) for (let i = 0; i < n; i++) {
        const yb = 0.42 + i * 0.42 + 0.05, yt = yb + 0.32, x0 = x - w / 2 + 0.16, x1 = x + w / 2 - 0.42, zf = OZ + 0.45 + 0.03;
        g.mat('diffuser', '#ff7a2a', { emissive: 2.6, lamp: true }); g.box(x0, yb + 0.1, zf, x1, yt - 0.08, zf + 0.002, { faces: 'Z' });
        g.mat('plain', '#3a1c0c'); const m = Math.floor((x1 - x0) / 0.2);
        for (let k = 0; k < m; k++) { const cx = x0 + (k + 0.5) * (x1 - x0) / m; g.ball(cx, yb + 0.1, zf + 0.003, 0.075, 0.045, 0.002, { segs: 10, rings: 3, bottom: 0 }); }
      }
    });
    s.structure((g) => {
      const a0 = 33.15, a1 = 36.8, zf = zb + 1.1;
      g.mat('paint', OX, { rough: -0.25 });
      g.extrude([[zb, 2.18], [zf, 2.18], [zf, 2.32], [zf - 0.35, 2.68], [zb, 2.68]], a0, a1, 'x');
      g.mat('paint', CREAM, { rough: -0.2 }); g.box(a0 - 0.01, 2.15, zf - 0.02, a1 + 0.01, 2.19, zf + 0.01, { bevel: 0.006 });
      g.mat('cast', BRASS, { rough: -0.15 }); g.box(a0 - 0.012, 2.27, zf - 0.01, a1 + 0.012, 2.29, zf + 0.004);
      g.mat('brushed', '#a9a39a'); g.box(34.55, 2.68, zb, 35.35, H, zb + 0.55);
      g.mat('cast', '#3a3430'); for (const x of [34.6, 35.3]) g.box(x - 0.01, 2.75, zb + 0.55, x + 0.01, 3.1, zb + 0.56);
    });
    s.solid(33.15, 2.18, zb, 36.8, 2.68, zb + 1.1);
    s.deco((g) => { g.mat('diffuser', '#ffe2bc', { emissive: 0.8, lamp: true }); for (const x of [33.9, 35.95]) g.box(x - 0.3, 2.17, zb + 0.75, x + 0.3, 2.18, zb + 0.82, { faces: 'y' }); });
    s.light({ at: [33.5, 2.1, zb + 0.8], to: [36.4, 2.1, zb + 0.8], type: 'tube', color: warm(3400), power: 2.2, range: 3.2, radius: 0.06, clip, lamp: true });
    // the ovens' own glow on the floor and the bench: the bright thing at the end of the view
    s.light({ at: [34.0, 1.05, OZ + 0.75], color: warm(1900), power: 1.6, range: 3.0, radius: 0.4, clip, lamp: true });
    s.light({ at: [35.85, 0.8, OZ + 0.75], color: warm(1900), power: 1.0, range: 2.4, radius: 0.3, clip, lamp: true });
    sign(s, { kind: 'plate', text: '230', lines: ['bread'] }, 34.15, 2.03, OZ + 0.455, { face: 'Z', w: 0.12, h: 0.055, board: false });

    // the mixer and the flour sacks in the west corner
    prop(s, 'food.mixer', 32.45, 0, zb + 0.4, 0, { paint: CREAM });
    for (const [x, z, t, h] of [[30.45, zb + 0.25, '#c9b48a', 0.62], [30.9, zb + 0.22, '#b99c6c', 0.66], [31.38, zb + 0.26, '#c9b48a', 0.6], [30.6, zb + 0.66, '#d6c4a0', 0.58], [31.08, zb + 0.7, '#b99c6c', 0.62]]) prop(s, 'food.sack', x, 0, z, x * 3, { tint: t, h, r: 0.2, band: (x * 10) % 3 > 1 ? TOM : COBALT });
    s.detail((g) => { g.mat('weave', '#c9b48a', { rough: 0.2 }); g.push(); g.move(30.9, 0.66 + 0.16, zb + 0.35); g.rotZ(Math.PI / 2); g.rotY(0.2); g.cyl(0, -0.3, 0, 0.17, 0.6, { segs: 10 }); g.pop(); });
    // flour on the floor round the sacks and the bench
    s.deco((g) => {
      g.mat('plaster', '#ead0b4', { rough: 0.3 });
      for (const [x, z, rx, rz] of [[33.2, -10.95, 2.0, 0.95], [31.4, -12.5, 0.9, 0.6], [32.4, -12.2, 0.6, 0.5], [34.6, -11.8, 0.8, 0.4]]) g.ball(x, 0, z, rx, 0.003, rz, { segs: 20, rings: 2, bottom: 0 });
      g.mat('plaster', '#efdcc4', { rough: 0.35 });
      for (const [x, z, rx, rz] of [[32.4, -11.75, 0.7, 0.3], [33.6, -10.2, 0.5, 0.22], [31.1, -12.6, 0.45, 0.3], [31.7, -11.2, 0.3, 0.5]]) g.ball(x, 0.001, z, rx, 0.003, rz, { segs: 16, rings: 2, bottom: 0 });
    });

    // the bakers' bench in the middle, dough rising on it
    const BX = 33.2, BZ = -10.95, BH = 0.9;
    prop(s, 'food.bk_bench', BX, 0, BZ, 0, { w: 3.4, d: 0.9, h: BH });
    for (const [x, z, c] of [[BX - 1.45, BZ - 0.25, null], [BX - 1.45, BZ + 0.0, LINEN], [BX - 1.2, BZ - 0.28, null], [BX + 1.0, BZ - 0.28, '#e6d2b0'], [BX + 1.25, BZ - 0.28, null]]) prop(s, 'food.proof', x, BH, z, 0, { r: 0.1, cloth: c || undefined });
    prop(s, 'food.scale', BX + 1.4, BH, BZ + 0.2, 0.2, {});
    prop(s, 'food.tray', BX + 0.7, BH, BZ + 0.28, 0, { w: 0.5, d: 0.3, fill: 'roll', col: '#efe2c4', seed: 50 });
    // a work lamp over the bench, and the linen airer behind it
    s.deco((g) => { g.mat('brushed', '#3a3430'); for (const x of [31.9, 34.5]) g.tube([[x, H, BZ], [x, 2.36, BZ]], 0.004, { segs: 3, caps: false }); });
    lamp(s, 'strip', 31.9, 2.36, BZ, { to: [34.5, 2.36, BZ], clip, power: 0.55, K: 3500 });
    prop(s, 'food.bk_airer', 31.55, H, -12.2, 0, { w: 1.9, d: 0.5 });

    // the proving cabinet on the west wall, over the loop pipes
    const PZ = -10.95;
    prop(s, 'food.bk_proofer', xi0 + 0.3, 0, PZ, Math.PI / 2, { w: 2.4, d: 0.58, h: 1.95 });
    s.light({ at: [xi0 + 0.35, 1.2, PZ - 0.9], to: [xi0 + 0.35, 1.2, PZ + 0.9], type: 'tube', color: warm(2300), power: 0.8, range: 1.2, radius: 0.04, clip: [xi0, 0.3, PZ - 1.25, xi0 + 0.62, 1.95, PZ + 1.25], lamp: true });
    plate(s, 'Proving', 'warm from the loop', xi0 + 0.605, 1.86, PZ - 0.4, 'X', 0.14);
    // the 65 degree loop: flow and return in red oxide with cream bands, up the wall and along under the ceiling
    s.structure((g) => {
      const runs = [[xi0 + 0.1, 0.12, 2.86], [xi0 + 0.2, 0.2, 2.94]];
      for (const [px, py, cy] of runs) {
        g.mat('paint', '#9a3a24', { rough: -0.2 });
        g.tube([[px, -0.02, -9.45], [px, py, -9.45], [px, py, -12.45], [px, cy, -12.45], [px, cy, -4.6]], 0.032, { segs: 8 });
        g.mat('paint', CREAM); for (const z of [-9.7, -11.0, -12.2, -10.0, -8.0, -6.0]) { const yy = z > -9.45 ? cy : py; g.lathe(px, z, [[0.036, yy - 0.03], [0.036, yy + 0.03]], { segs: 8, capTop: false, capBottom: false }); }
      }
      g.mat('cast', BRASS, { rough: -0.15 }); const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ring.push([xi0 + 0.31, 0.2 + Math.cos(a) * 0.06, -9.62 + Math.sin(a) * 0.06]); } g.tube(ring, 0.008, { segs: 4, closed: true });
      g.tube([[xi0 + 0.2, 0.2, -9.62], [xi0 + 0.31, 0.2, -9.62]], 0.01, { segs: 5 });
      g.mat('cast', '#3a3430'); for (const z of [-10.5, -8.5, -6.5, -4.9]) g.box(xi0, 2.82, z - 0.02, xi0 + 0.25, 2.99, z + 0.02);
    });
    plate(s, 'Loop', 'sixty-five degrees', xi0 + 0.013, 0.5, -9.62, 'X', 0.12);
    // a clock over the cabinet
    s.deco((g) => {
      g.push(); g.move(xi0 + 0.02, 2.5, PZ); g.rotZ(-Math.PI / 2);
      g.mat('paint', OX); g.cyl(0, 0, 0, 0.19, 0.04, { segs: 22 }); g.mat('plain', '#f6efdc', { rough: -0.3 }); g.cyl(0, 0.04, 0, 0.165, 0.002, { segs: 22 });
      g.mat('plain', '#2a2622'); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.box(Math.cos(a) * 0.14 - 0.006, 0.042, Math.sin(a) * 0.14 - 0.006, Math.cos(a) * 0.14 + 0.006, 0.044, Math.sin(a) * 0.14 + 0.006); }
      g.box(-0.004, 0.044, -0.004, 0.09, 0.046, 0.004); g.box(-0.004, 0.046, -0.12, 0.004, 0.048, 0.004);
      g.pop();
    });

    // the cooling racks between the bench and the way through
    prop(s, 'food.rack', 36.2, 0, -10.5, 0, { w: 0.66, d: 0.46, h: 1.75, n: 9, fills: ['bun', 'boule', 'croissant', 'batard', 'roll', 'bun', 'empty', 'boule', 'none'] });
    prop(s, 'food.rack', 36.95, 0, -10.55, 0.06, { w: 0.66, d: 0.46, h: 1.75, n: 8, fills: ['roll', 'bun', 'puff', 'boule', 'croissant', 'bun', 'batard', 'none'] });
    s.detail((g) => {
      g.mat('weave', '#e3d6bc', { rough: 0.1 });
      g.sheet([35.84, 1.77, -10.28], [36.56, 1.77, -10.28], [36.56, 1.77, -10.74], [35.84, 1.77, -10.74], { nu: 4, nv: 3, sag: 0.02 });
      g.sheet([35.84, 1.77, -10.27], [36.56, 1.77, -10.27], [36.58, 1.5, -10.24], [35.82, 1.5, -10.24], { nu: 5, nv: 2, ripple: 0.01, rippleN: 4 });
    });

    // the sink on the east wall, a rail of cloths, a shelf of linen lids, the bake list
    prop(s, 'food.bk_sink', xi1 - 0.28, 0, -11.85, -Math.PI / 2, { w: 1.15 });
    s.furniture((g) => {
      g.mat('wood', OAK, { rough: -0.08 }); g.box(xi1 - 0.3, 1.66, -12.5, xi1, 1.69, -11.2, { bevel: 0.006 });
      g.mat('cast', '#3a3430'); for (const z of [-12.3, -11.4]) g.tube([[xi1, 1.48, z], [xi1 - 0.02, 1.56, z], [xi1 - 0.2, 1.655, z]], 0.007, { segs: 5 });
      g.mat('cast', BRASS); g.tube([[xi1, 1.25, -12.45], [xi1 - 0.08, 1.25, -12.45], [xi1 - 0.08, 1.25, -11.25], [xi1, 1.25, -11.25]], 0.01, { segs: 5 });
    });
    for (const z of [-12.25, -11.75, -11.4]) prop(s, 'food.linen', xi1 - 0.15, 1.69, z, Math.PI / 2, { col: LINEN, col2: z < -12 ? TOM : '#e3d6bc', n: 4, w: 0.26, d: 0.2 });
    s.detail((g) => { g.mat('weave', TOM); g.sheet([xi1 - 0.09, 1.26, -12.2], [xi1 - 0.09, 1.26, -11.85], [xi1 - 0.1, 0.92, -11.85], [xi1 - 0.1, 0.92, -12.2], { nu: 3, nv: 2, sag: 0.008 }); g.mat('weave', LINEN); g.sheet([xi1 - 0.09, 1.26, -11.7], [xi1 - 0.09, 1.26, -11.4], [xi1 - 0.1, 0.96, -11.4], [xi1 - 0.1, 0.96, -11.7], { nu: 3, nv: 2, sag: 0.008 }); });
    lamp(s, 'sconce', xi1, 2.05, -11.85, { face: 'x', clip, power: 0.5, K: 3200 });
    sign(s, { kind: 'notice', title: 'Bake list', lines: ['4.00 buns, two racks', '4.30 puffs, croissants', '5.00 steamed cakes', '6.00 tins and batards', 'First glide: Lovage', 'Heels to the larder by 9'], hand: true, paper: '#f3ead6' }, xi1 - 0.012, 1.55, -9.95, { face: 'x', w: 0.3, h: 0.42 });

    // ---- the pavement: the stall of buns, the chalkboard, the hanging sign ----
    prop(s, 'food.stall', 31.75, 0, -3.52, 0, { w: 1.3, d: 0.44, h: 0.66, cloth: OX, trim: CREAM, wood: OAK });
    prop(s, 'food.basket', 31.4, 0.66, -3.53, 0.05, { w: 0.46, d: 0.34, fill: 'bun', crust: '#b86a2c', top: '#f4ecdc', covered: true, seed: 60 });
    prop(s, 'food.basket', 31.95, 0.66, -3.55, -0.08, { w: 0.4, d: 0.32, h: 0.1, fill: 'puff', covered: true, cloth: '#e6d2b0', seed: 61 });
    prop(s, 'food.steamer', 32.28, 0.66, -3.56, 0, { r: 0.12, n: 3 });
    plate(s, '0.40', 'sugar bun', 31.4, 0.62, -3.282, 'Z', 0.09);
    prop(s, 'food.board', 37.7, 0, -3.48, 0, { w: 0.62, h: 1.25, wood: OXD });
    sign(s, SIGNS['bakery.chalk'], 37.7, 0.815, -3.45, { face: 'Z', w: 0.6, h: 0.78, board: false });
    s.deco((g) => {
      const x = 30.11; g.mat('cast', '#2a2622', { rough: -0.1 });
      g.box(x - 0.04, 2.55, -3.99, x + 0.04, 2.95, -3.95, { bevel: 0.006 });
      g.tube([[x, 2.72, -3.96], [x, 2.72, -3.22]], 0.012, { segs: 6 });
      g.tube([[x, 2.92, -3.96], [x, 2.86, -3.7], [x, 2.76, -3.45], [x, 2.72, -3.36]], 0.009, { segs: 5 });
      g.mat('cast', BRASS); g.ball(x, 2.72, -3.21, 0.02, 0.02, 0.02, { segs: 8, rings: 5 });
      for (const z of [-3.82, -3.38]) g.tube([[x, 2.72, z], [x, 2.66, z]], 0.005, { segs: 4 });
    });
    sign(s, Object.assign({}, SIGNS['bakery.hanging'], { palette: [OX, '#f6e7c8', '#e8b85a'], emblem: 'loaf' }), 30.11, 2.35, -3.6, { face: 'X', double: true, w: 0.56, h: 0.6, back: OX });

    // ---- people ----
    s.spot('counter', 36.3, 0, -9.75, Math.PI, { who: 'idris', tags: ['bakery'] });
    s.spot('counter', 33.6, 0, -9.75, Math.PI, { tags: ['bakery'] });
    s.spot('work', 33.0, 0, -11.85, Math.PI, { who: 'nell', tags: ['bake', 'bakery'] });
    s.spot('work', 34.2, 0, -11.85, 0, { tags: ['bake', 'oven'] });
    s.spot('work', 35.95, 0, -11.95, 0, { tags: ['bake', 'oven'] });
    s.spot('work', 31.15, 0, -10.4, -Math.PI / 2, { tags: ['bake', 'prove'] });
    s.spot('work', xi1 - 0.85, 0, -11.85, Math.PI / 2, { tags: ['bake', 'wash'] });
    s.spot('work', 36.6, 0, -9.85, Math.PI, { tags: ['bake', 'rack'] });
    s.spot('customer', 36.3, 0, -8.1, 0, { tags: ['bakery'] });
    s.spot('customer', 33.6, 0, -8.1, 0, { tags: ['bakery', 'case'] });
    s.spot('customer', 31.45, 0, -8.1, 0, { tags: ['bakery', 'lovage'] });
    [[36.4, -7.5], [36.6, -6.9], [36.8, -6.3], [36.95, -5.7]].forEach((q, i) => s.spot('queue', q[0], 0, q[1], -0.25 + i * 0.03, { tags: ['bakery'], order: i }));
    s.spot('browse', 31.25, 0, -5.9, -Math.PI / 2, { tags: ['bakery', 'bread'] });
    s.spot('browse', 31.25, 0, -7.55, -Math.PI / 2, { tags: ['bakery', 'bread'] });
    s.spot('browse', MX, 0, MZ + 0.85, 0, { tags: ['bakery'] });
    s.spot('browse', MX + 1.05, 0, MZ - 0.1, -Math.PI / 2, { tags: ['bakery'] });
    s.spot('browse', 37.75, 0, -7.4, Math.PI / 2, { tags: ['bakery', 'starters'] });
    s.spot('browse', 32.0, 0, -5.4, Math.PI, { tags: ['bakery', 'window'] });
    s.spot('browse', 31.75, 0, -2.75, 0, { tags: ['bakery', 'street'] });
    s.spot('browse', 37.7, 0, -2.8, 0, { tags: ['bakery', 'street'] });
    s.path([[34.55, -2.5], [34.55, -4.5], [34.8, -5.8], [35.9, -7.0], [36.3, -8.0]]);
    s.path([[34.8, -5.8], [33.6, -5.45], [31.4, -5.6], [31.3, -7.6], [33.0, -8.0], [34.5, -7.6], [34.8, -5.8]]);
    s.path([[36.3, -8.0], [37.6, -7.7], [38.2, -8.4], [38.2, -9.7], [36.3, -9.75], [35.3, -9.75], [35.15, -11.85], [33.0, -11.85], [31.2, -11.6], [31.15, -10.4], [31.6, -9.75], [35.3, -9.75]]);
    s.path([[38.2, -9.7], [38.1, -11.0], [38.0, -11.85]]);

    // ---- things to do ----
    s.interact({
      x: 36.3, y: 1.1, z: -9.0, radius: 1.3, kind: 'talk', prompt: 'Talk to Idris',
      async onUse(gm) {
        if (!gm.ui) return;
        gm.flags = gm.flags || {};
        if (!gm.flags.bkMet) { gm.flags.bkMet = true; await sayAs(gm, IDRIS, HELLO); if (gm.journal && gm.journal.meet) gm.journal.meet('idris'); }
        const opts = [{ label: 'Buy something', value: 'buy' }, { label: 'Ask where the country loaf is baked', value: 'loaf' }, { label: 'Ask about the crock on the counter', value: 'crock' }];
        if (gm.inv && gm.inv.has && gm.inv.has('spelt-mother')) opts.push({ label: "Show him the spoon of Spelt's mother", value: 'spelt' });
        let pick = null; gm.busy++;
        try { pick = await gm.ui.choose(IDRIS, 'Lids on, mind the warm side.', opts); } finally { gm.busy--; }
        if (pick === 'buy') { const it = await buyFrom(gm, MENUS.bakery, 'Idris'); if (it) await sayAs(gm, IDRIS, BOUGHT[it.id] || 'Lid on, and mind the warm side.'); }
        else if (pick === 'loaf') { await sayAs(gm, IDRIS, LOVAGE); if (gm.journal) gm.journal.find('lovage-loaf'); }
        else if (pick === 'crock') { await sayAs(gm, IDRIS, CROCK); if (gm.journal) gm.journal.find('starter-file'); }
        else if (pick === 'spelt') await sayAs(gm, IDRIS, SPELT);
      },
    });
    s.interact({
      x: SX, y: CT + 0.15, z: SZ + 0.3, radius: 0.8, prompt: "Read the starter's card",
      async onUse(gm) {
        await sayAs(gm, { name: 'Strain library card', colour: '#b9d0d8' }, CARD);
        if (gm.journal) gm.journal.find('starter-file');
      },
    });
    s.interact({
      x: LX, y: CT + 0.2, z: LZ + 0.4, radius: 0.85, prompt: 'Read the label on the basket',
      async onUse(gm) {
        await sayAs(gm, { name: 'The Lovage loaf, 1.10', colour: '#e8c486' }, ['Baked at the Crock, in Lovage. In by the first glide. We sell it. We don\'t make it.', 'A dark crust and a flour ring from the basket. The halls serve this at every feast and call it Chervil sourdough.']);
        if (gm.journal) gm.journal.find('lovage-loaf');
      },
    });
    s.interact({
      x: xi1 - 0.3, y: 1.7, z: -6.65, radius: 1.2, prompt: 'Look at the starter shelf',
      async onUse(gm) {
        const lines = SHELF.slice();
        if (gm.inv && gm.inv.has && gm.inv.has('spelt-mother')) lines.push("The spoon in your bag is for Marit. Still, the gap is exactly the size of a small crock.");
        await sayAs(gm, { name: 'The starter shelf', colour: '#d8c8a0' }, lines);
      },
    });
    s.interact({
      x: 37.7, y: 0.9, z: -3.35, radius: 1.0, prompt: 'Read the board',
      async onUse(gm) {
        const c = SIGNS['bakery.chalk'];
        await sayAs(gm, { name: 'The board', colour: '#f4e9c9' }, [c.title + ': ' + c.lines.slice(0, 5).map((l) => l.replace(' · ', ', ')).join('. ') + '. ' + c.lines[5], 'Next door, under its own lamp, one tomato costs 0.50. Here a sugar bun is 0.40.', 'Bread is Mill starch with a little gluten from the Vats. A calorie of it costs about 1.3 times a cracker, and a tomato is lamplight.']);
        if (gm.journal) gm.journal.find('cheap-bread');
      },
    });
    s.interact({
      x: xi0 + 0.7, y: 1.1, z: PZ, radius: 1.0, prompt: 'Look into the proving cabinet',
      onUse(gm) { return sayAs(gm, { name: 'The proving cabinet', colour: '#e9c88e' }, PROOF); },
    });
    s.interact({
      x: 34.6, y: 1.2, z: OZ + 0.75, radius: 1.2, prompt: 'Watch the ovens',
      onUse(gm) { return sayAs(gm, { name: 'The deck ovens', colour: '#ffb070' }, OVENS); },
    });
    s.interact({
      x: xi1 - 0.45, y: 0.7, z: -6.15, radius: 0.9, prompt: 'Sit and wait a while',
      onUse(gm) { if (gm.player && gm.player.sit) { gm.player.sit({ x: xi1 - 0.24, y: 0, z: -6.15, yaw: -Math.PI / 2 }); gm.player.yaw = Math.PI / 2; } },
    });

    // the bakehouse sounds start the first time you come in
    let kitchen = null;
    s.trigger({ box: [X0, 0, Z0, X1, H, Z1], onEnter(gm) { if (!kitchen && gm.audio && gm.loopAt) kitchen = gm.loopAt('kitchen', f, 34.5, 1, -11.5, { vol: 0.25, radius: 6 }); } });

    s.zoneBox({ id: 'bakery', place: 'bakery', box: [X0, 0, Z0, X1, H, Z1], name: 'Second Rise', sub: 'Ladle Row', ambience: 'shop', reverb: 'room', env: { autoKey: 0.16, bloom: 0.08, warmth: 0.25 } });
    s.finish();
    game.spawns.bakery = { frame: f, x: 34.5, y: 0, z: -5, yaw: 0 };
  },
};

// a covered proving basket on top of the small oven, as a prop placement
function drawProofProp(s, x, y, z) { prop(s, 'food.proof', x, y, z, 0, { r: 0.1, cloth: LINEN }); }

const HELLO = [
  "Where did you sleep, wanderer? Candlewick, by the key. And have you eaten?",
  "Have a bun first. They're cheaper than a tomato and they'll get you to lunch.",
];
const LOVAGE = [
  "Not here. That's the Lovage loaf, from the Crock in Lovage. It comes in on the first glide, still under its cloth.",
  "The halls serve it at every feast and call it Chervil sourdough. Everyone knows. Nobody says.",
  "We put its own name on the basket. Somebody on the Row ought to.",
];
const CROCK = [
  "That's our mother. My grandmother's, and her aunt's before her.",
  "She's registered with the strain library, so there's a vial of her frozen down in the Keel and her genome on file.",
  "If she died, the library could grow her back in about a week. I'd still sit with the empty crock for a day.",
];
const SPELT = [
  "Pell's mother. Two hundred and twelve drums in that spoon, he'll tell you, and half of them are lies.",
  "That's for Marit, I know. She's at the Ring 2 hall. If there's a scrape left when she's done, the shelf by the bench has a gap.",
];
const CARD = [
  'Strain library, Chervil. Registered starter: the Second Rise mother.',
  'First registered a hundred and six years ago by Ama Tamm. Kept since by the Tamm table, Ladle Row. Vial and genome on file.',
  'On the back, in pencil: Feed at four. If she dies, the library can grow her back in about a week. Feed her anyway.',
];
const SHELF = [
  "Small crocks under cloths, each with a paper tag on a string: Sorrel, Tansy, Rue, Borage, Hassock, a cycler galley, and one from Lovage marked, in pencil, not the Crock's.",
  "Wanderers leave a spoon of starter here as they pass through, the way they do in Pell's crock room at home. The plate says take a spoon, leave a spoon.",
  'On the second shelf there is a gap, and a card propped in it. In pencil: Spelt?',
];
const PROOF = [
  'Shelves of cane baskets behind the glass, some under linen, all of them slowly rising.',
  "Two pipes from the food plant's loop run under it at sixty-five degrees, so the cabinet keeps warm for nothing, and so does whoever leans on it at four in the morning.",
];
const OVENS = [
  'Two electric deck ovens, every deck glowing orange through its glass. The dial on the big one says 230.',
  'Baking costs power, so Second Rise bakes in big batches before the Row is up, and everything warm goes under a lid the moment it comes out.',
];
const BOUGHT = {
  'lovage-loaf': "In its own cloth. Bring the cloth back and the next one goes home in it.",
  'sugar-bun': 'Forty hundredths. Next door that would buy you four fifths of a tomato.',
  croissant: 'Eat it over the paper, and hold the paper a little anti. That is where the flakes land.',
  'cheese-puffs': 'Six in a bag. They are best in the first ten minutes, so walk slowly.',
  'steamed-cake': 'Keep the cloth on it till you sit down. Heliox will have the warmth out of it in a minute.',
  'cheese-pull': "Pull it in front of someone. That's half of what it's for.",
  'margin-bun': "This year's Margin on the top. We cut a new stamp every Booking Day.",
  heels: "Free. Take them along to the larder and Zhenya will make something sour of them.",
};
