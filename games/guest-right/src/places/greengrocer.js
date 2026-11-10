// The Glass Case, the greengrocer on Ladle Row: a jeweller's for vegetables. Few things, each in its own pool of light,
// in a room painted dark so the produce glows. The eye goes from the apple on its plinth to the lamp-grown lettuces at the back.
import { lamp, block, warm } from '../world/kit.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { MENUS } from '../content/menus.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';
import { unit, glassCase, dome, plate, glassMat, buyFrom, sayAs, spread, drawTomato, drawCucumber, drawLettuce, drawHerbPot, foodParts } from './food_parts.js';

const TAU = Math.PI * 2;
// palette: green-black walls, aubergine panelling, dark oak, brass, rose velvet, tissue
const WALL = '#1c2923', DADO = '#2b1922', PANEL = '#38212c', CEIL = '#171a19', BEAM = '#271d18', OAK = '#3a2620';
const BRASS = '#b08a45', VELVET = '#8c2a3c', ROSE = '#c25a6c', TISSUE = '#f3ece0', PINK = '#efd3d6', FRAME = '#1a2620';
const FAUSTA = { name: 'Fausta', colour: '#e0607a' };

// ---------------------------------------------------------------------------------------------------------------
// Props of this shop (food.gg_*)
// ---------------------------------------------------------------------------------------------------------------

// A footed brass dish of cherry tomatoes. p: { r, n }
defineProp('food.gg_dish', (g, p) => {
  const r = p.r || 0.075;
  g.mat('cast', BRASS, { rough: -0.2 });
  g.lathe(0, 0, [[0.032, 0], [0.034, 0.005], [0.014, 0.012], [0.009, 0.038], [0.018, 0.047], [r * 0.7, 0.054], [r, 0.068], [r * 0.95, 0.07], [r * 0.66, 0.061], [0, 0.058]], { segs: 18 });
  const rng = new Rng(hashStr('ggd' + (p.n || 7)));
  drawTomato(g, 0, 0.058, 0, 0.017, '#d0301e');
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + rng.f(-0.15, 0.15); drawTomato(g, Math.cos(a) * r * 0.52, 0.06, Math.sin(a) * r * 0.52, rng.f(0.015, 0.018), mixHex('#c8281c', '#e04a20', rng.next())); }
  drawTomato(g, 0.012, 0.086, -0.004, 0.016, '#c42a1e');
  return { cast: false };
});

// A shallow oak tray with a brass rim, a linen cloth and cucumbers laid side by side along x. p: { w, d, n }
defineProp('food.gg_tray', (g, p) => {
  const w = p.w || 0.5, d = p.d || 0.32, n = p.n || 5, rng = new Rng(hashStr('ggt' + n + w));
  g.mat('wood', '#4a2f22', { rough: -0.1 }); g.box(-w / 2, 0, -d / 2, w / 2, 0.012, d / 2, { bevel: 0.004 });
  g.mat('cast', BRASS, { rough: -0.15 });
  for (const sz of [-1, 1]) g.box(-w / 2, 0.012, sz * d / 2 - 0.004, w / 2, 0.03, sz * d / 2 + 0.004, { bevel: 0.002 });
  for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.004, 0.012, -d / 2, sx * w / 2 + 0.004, 0.03, d / 2, { bevel: 0.002 });
  g.mat('weave', '#efe7d6'); g.box(-w / 2 + 0.01, 0.012, -d / 2 + 0.01, w / 2 - 0.01, 0.015, d / 2 - 0.01, { faces: 'Y' });
  for (let i = 0; i < n; i++) drawCucumber(g, rng.f(-0.01, 0.01), 0.015, -d / 2 + 0.04 + i * (d - 0.08) / Math.max(1, n - 1), rng.f(-0.06, 0.06), rng.f(0.22, 0.27));
  return { cast: false };
});

// A glazed dish of radishes with their leaves. p: { n }
defineProp('food.gg_radish', (g, p) => {
  const n = p.n || 7, rng = new Rng(hashStr('ggr' + n));
  g.mat('glaze', '#e9e1cf', { rough: -0.25 }); g.lathe(0, 0, [[0.05, 0], [0.07, 0.008], [0.095, 0.03], [0.09, 0.032], [0.06, 0.012], [0, 0.01]], { segs: 18 });
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + rng.f(-0.2, 0.2), rr = i === 0 ? 0 : 0.045, x = Math.cos(a) * rr, z = Math.sin(a) * rr, y = 0.028;
    g.mat('plain', mixHex('#c42a48', '#d84a6a', rng.next()), { rough: -0.3 }); g.ball(x, y, z, 0.017, 0.016, 0.017, { segs: 10, rings: 6 });
    g.mat('plain', '#f2e8e4'); g.tube([[x, y - 0.014, z], [x + 0.004, y - 0.03, z + 0.01]], [0.004, 0.001], { segs: 3 });
    g.mat('leafA', '#ffffff', { sway: 0.2 }); g.card(x, y + 0.014, z, 0.05, 0.075, a + 1.4, { tilt: (rr ? 0.5 : 0.1) });
  }
  return { cast: false };
});

// A cane punnet of pea shoots. p: { w, d }
defineProp('food.gg_shoots', (g, p) => {
  const w = p.w || 0.12, d = p.d || 0.1, rng = new Rng(hashStr('ggs' + w));
  g.mat('cane', '#d9b98a'); g.box(-w / 2, 0, -d / 2, w / 2, 0.04, d / 2, { faces: 'xXzZy', bevel: 0.003 });
  g.mat('soil', '#ffffff'); g.box(-w / 2 + 0.005, 0.03, -d / 2 + 0.005, w / 2 - 0.005, 0.034, d / 2 - 0.005, { faces: 'Y' });
  g.mat('leafB', '#d8f0a8', { sway: 0.3 });
  for (let i = 0; i < 9; i++) g.card(rng.f(-w / 2 + 0.015, w / 2 - 0.015), 0.034, rng.f(-d / 2 + 0.015, d / 2 - 0.015), 0.06, rng.f(0.06, 0.085), rng.f(0, 3), { tilt: rng.f(-0.2, 0.2) });
  return { cast: false };
});

// A lettuce growing in its own small square pot. p: { r, col, seed, pot }
defineProp('food.gg_lpot', (g, p) => {
  const r = p.r || 0.085, s = r * 0.75;
  g.mat('glaze', p.pot || '#2f4a3c', { rough: -0.1 }); g.box(-s, 0, -s, s, 0.07, s, { bevel: 0.008, faces: 'xXzZy' });
  g.mat('soil', '#ffffff'); g.box(-s + 0.008, 0.06, -s + 0.008, s - 0.008, 0.064, s - 0.008, { faces: 'Y' });
  drawLettuce(g, 0, 0.05, 0, r, p.col || '#5e9a3a', p.seed || 0);
  return { cast: false };
});

// A stepped oak stand of herb pots, three tiers. p: { w, seed }
defineProp('food.gg_herbstand', (g, p) => {
  const w = p.w || 1.4, rng = new Rng(hashStr('ggh' + w + (p.seed || 0)));
  const tiers = [[0.36, 0.17], [0.62, -0.01], [0.88, -0.19]];
  g.mat('wood', OAK, { rough: -0.05 });
  for (const sx of [-1, 1]) g.prism([[sx * w / 2 - 0.025, -0.28], [sx * w / 2 + 0.025, -0.28], [sx * w / 2 + 0.025, 0.27], [sx * w / 2 - 0.025, 0.27]], 0, 0.36).prism([[sx * w / 2 - 0.025, -0.28], [sx * w / 2 + 0.025, -0.28], [sx * w / 2 + 0.025, 0.08], [sx * w / 2 - 0.025, 0.08]], 0.36, 0.62).prism([[sx * w / 2 - 0.025, -0.28], [sx * w / 2 + 0.025, -0.28], [sx * w / 2 + 0.025, -0.1], [sx * w / 2 - 0.025, -0.1]], 0.62, 0.9);
  for (const t of tiers) { g.box(-w / 2, t[0] - 0.03, t[1] - 0.09, w / 2, t[0], t[1] + 0.09, { bevel: 0.006 }); g.box(-w / 2 + 0.03, 0, t[1] - 0.09, w / 2 - 0.03, t[0] - 0.03, t[1] - 0.075); }
  g.mat('cast', BRASS, { rough: -0.1 }); for (const t of tiers) g.box(-w / 2, t[0] - 0.026, t[1] + 0.09, w / 2, t[0] - 0.004, t[1] + 0.094);
  const kinds = ['broad', 'shiso', 'fine', 'broad', 'fine', 'shiso'], pots = ['#b8613d', '#a8563a', '#c4704a', '#3f5a4a', '#b8613d'];
  tiers.forEach((t, ti) => {
    const n = Math.floor((w - 0.1) / 0.19);
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 0.05 + (i + 0.5) * (w - 0.1) / n, k = kinds[(i + ti * 2) % kinds.length];
      drawHerbPot(g, x, t[0], t[1], { kind: k, r: 0.055, size: rng.f(0.15, 0.2), pot: pots[(i + ti) % pots.length], seed: i * 7 + ti, flowers: k === 'fine' && rng.chance(0.3), flowerTint: '#c9a0e0' });
    }
  });
  return { solid: [[-w / 2, 0, -0.28, w / 2, 0.9, 0.27]], tier: 's' };
});

// A pendant lamp shade in green enamel, hanging from y = 0 down a cord of length L. p: { L }
defineProp('food.gg_shade', (g, p) => {
  const L = p.L || 1.0, y = -L;
  g.mat('brushed', '#3a3430'); g.tube([[0, 0, 0], [0, y + 0.01, 0]], 0.005, { segs: 4, caps: false }); g.cyl(0, -0.03, 0, 0.04, 0.03, { segs: 10 });
  g.mat('cast', BRASS, { rough: -0.15 }); g.cyl(0, y - 0.02, 0, 0.028, 0.04, { segs: 10 });
  g.mat('paint', '#1f4a36', { rough: -0.25 }); g.lathe(0, 0, [[0.19, y - 0.2], [0.185, y - 0.19], [0.13, y - 0.11], [0.06, y - 0.04], [0.032, y - 0.02]], { segs: 20, capTop: false, capBottom: false });
  g.mat('cast', BRASS); g.lathe(0, 0, [[0.194, y - 0.21], [0.194, y - 0.195]], { segs: 20, capTop: false, capBottom: false });
  g.mat('plain', '#f6e6c8', { emissive: 0.35, lamp: true }); g.lathe(0, 0, [[0.03, y - 0.02], [0.058, y - 0.04], [0.128, y - 0.11], [0.183, y - 0.19]], { segs: 20, capTop: false, capBottom: false });
  g.mat('plain', '#fff0c8', { emissive: 4, lamp: true }); g.ball(0, y - 0.075, 0, 0.032, 0.036, 0.032, { segs: 10, rings: 6 });
  return { cast: false };
});

// The tissue roll on its brass holder, with a cone of string beside it. Front toward +z.
defineProp('food.gg_wrap', (g) => {
  g.mat('wood', '#4a2f22', { rough: -0.1 }); g.box(-0.2, 0, -0.07, 0.2, 0.02, 0.07, { bevel: 0.006 });
  g.mat('cast', BRASS, { rough: -0.15 }); for (const sx of [-1, 1]) { g.box(sx * 0.18 - 0.008, 0.02, -0.012, sx * 0.18 + 0.008, 0.15, 0.012, { bevel: 0.003 }); }
  g.push(); g.move(0, 0.12, 0); g.rotZ(Math.PI / 2); g.mat('paper', PINK, { rough: 0.2 }); g.cyl(0, -0.165, 0, 0.042, 0.33, { segs: 14 }); g.mat('cast', BRASS); g.cyl(0, -0.19, 0, 0.007, 0.38, { segs: 6 }); g.pop();
  g.mat('paper', PINK, { rough: 0.2 }); g.sheet([-0.15, 0.12, 0.042], [0.15, 0.12, 0.042], [0.15, 0.022, 0.1], [-0.15, 0.022, 0.1], { nu: 4, nv: 3, sag: 0.006 });
  g.mat('cast', BRASS); g.box(-0.16, 0.06, 0.05, 0.16, 0.066, 0.058, { bevel: 0.002 });
  // a cone of string on a spindle
  g.mat('wood', '#4a2f22'); g.cyl(0.3, 0, 0, 0.045, 0.012, { segs: 12 }); g.mat('cast', BRASS); g.cyl(0.3, 0.012, 0, 0.005, 0.15, { segs: 6 });
  g.mat('weave', '#cdb88a'); g.lathe(0.3, 0, [[0.034, 0.014], [0.036, 0.03], [0.026, 0.09], [0.014, 0.12], [0.008, 0.125]], { segs: 12 });
  g.mat('weave', '#cdb88a'); g.tube([[0.3, 0.16, 0], [0.26, 0.17, 0.02], [0.2, 0.12, 0.06], [0.16, 0.05, 0.09]], 0.0018, { segs: 3 });
  return { cast: false };
});

// A velvet riser for a window bed. p: { w, d, h, col }
defineProp('food.gg_riser', (g, p) => {
  const w = p.w || 1.0, d = p.d || 0.26, h = p.h || 0.14, c = p.col || VELVET;
  g.mat('felt', c); g.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, { bevel: 0.012 });
  g.mat('cast', BRASS, { rough: -0.1 }); g.box(-w / 2 - 0.004, 0, d / 2 - 0.006, w / 2 + 0.004, 0.012, d / 2 + 0.004);
  return { cast: false };
});

// A brass étagère for a window: three round velvet-topped tiers on a centre rod. Tier tops at y 0.14, 0.42, 0.68.
defineProp('food.gg_etagere', (g, p) => {
  const T = [[0.14, 0.2], [0.42, 0.15], [0.68, 0.095]];
  g.mat('cast', BRASS, { rough: -0.18 });
  g.lathe(0, 0, [[0.11, 0], [0.11, 0.012], [0.07, 0.022], [0.02, 0.05], [0.011, 0.07]], { segs: 18 });
  g.cyl(0, 0.05, 0, 0.009, 0.74, { segs: 8 });
  g.ball(0, 0.8, 0, 0.022, 0.03, 0.022, { segs: 10, rings: 6 });
  for (const t of T) {
    g.mat('cast', BRASS, { rough: -0.18 }); g.lathe(0, 0, [[0.02, t[0] - 0.03], [t[1] * 0.6, t[0] - 0.014], [t[1], t[0] - 0.01], [t[1] + 0.006, t[0] + 0.012], [t[1] - 0.004, t[0] + 0.012], [t[1] - 0.006, t[0]]], { segs: 22, capTop: false });
    g.mat('felt', p.col || VELVET); g.cyl(0, t[0] - 0.004, 0, t[1] - 0.005, 0.004, { segs: 20 });
  }
  return { cast: false };
});

// A round table under a long rose cloth. p: { r, h, cloth }
defineProp('food.gg_rtable', (g, p) => {
  const r = p.r || 0.45, h = p.h || 0.76, c = p.cloth || VELVET;
  g.mat('felt', c);
  g.lathe(0, 0, [[r + 0.04, 0.012], [r + 0.03, 0.08], [r + 0.012, h * 0.6], [r + 0.012, h - 0.02], [r, h], [r * 0.6, h + 0.004], [0, h + 0.005]], { segs: 28, capBottom: false });
  g.mat('cast', BRASS, { rough: -0.1 }); g.lathe(0, 0, [[r + 0.042, 0.004], [r + 0.044, 0.02]], { segs: 28, capTop: false, capBottom: false });
  g.mat('weave', TISSUE); g.lathe(0, 0, [[r * 0.55, h + 0.006], [r * 0.55, h + 0.009], [0, h + 0.009]], { segs: 22, capBottom: false });
  return { posts: [[0, 0, r + 0.03, 0, h]], tier: 's' };
});

// Rolls of tissue lying on a shelf, a stack of paper bags, a ledger: the keeper's things. p: { kind: 'rolls' | 'bags' | 'ledger' | 'punnets' }
defineProp('food.gg_things', (g, p) => {
  const k = p.kind || 'rolls';
  if (k === 'rolls') {
    const cols = [PINK, TISSUE, '#e7c3ca', TISSUE];
    cols.forEach((c, i) => { g.push(); g.move(-0.13 + i * 0.086, 0.041, (i % 2) * 0.012); g.rotX(Math.PI / 2); g.mat('paper', c, { rough: 0.2 }); g.cyl(0, -0.12, 0, 0.04, 0.24, { segs: 12 }); g.mat('paper', '#a88a60'); g.cyl(0, -0.121, 0, 0.012, 0.242, { segs: 8 }); g.pop(); });
  } else if (k === 'bags') {
    for (let i = 0; i < 9; i++) { g.mat('paper', i % 3 ? '#c9a87a' : '#d4b88c'); const o = (i % 2) * 0.006 - 0.003; g.box(-0.1 + o, i * 0.006, -0.13 - o, 0.1 + o, i * 0.006 + 0.005, 0.13 - o); }
  } else if (k === 'ledger') {
    g.mat('leather', '#5a1e28', { rough: -0.1 }); g.box(-0.11, 0, -0.15, 0.11, 0.03, 0.15, { bevel: 0.004 });
    g.mat('paper', '#efe6cf'); g.box(-0.105, 0.004, -0.145, 0.105, 0.026, 0.147, { faces: 'XzZ' });
    g.mat('weave', '#c9a45c'); g.box(-0.02, 0.03, -0.17, -0.012, 0.031, 0.15);
  } else {
    for (let i = 0; i < 5; i++) { g.mat('cane', i % 2 ? '#d9b98a' : '#cfae7e'); g.box(-0.065, i * 0.016, -0.05, 0.065, i * 0.016 + 0.045, 0.05, { faces: 'xXzZy', bevel: 0.003 }); }
  }
  return { cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// The place
// ---------------------------------------------------------------------------------------------------------------

export const place = {
  id: 'greengrocer', name: 'The Glass Case', order: 41,
  build(game) {
    void foodParts;
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('greengrocer', f);
    const X0 = 39, X1 = 47, Z0 = -13.5, Z1 = -4, H = 3.2;
    const xi0 = X0 + 0.16, xi1 = X1 - 0.16, zb = Z0 + 0.16;          // inner faces of the walls

    const U = unit(s, {
      x0: X0, x1: X1, z0: Z0, z1: Z1, h: H,
      floor: ['planks', '#5a3e2e'], ceil: ['paint', CEIL],
      wall: { tint: WALL, mat: 'plaster', dado: { h: 1.05, mat: 'wood', tint: DADO }, skirt: '#160f0c' },
      beams: { tint: BEAM }, rail: '#6a5232',
      front: {
        fascia: Object.assign({}, SIGNS['greengrocer.fascia'], { palette: ['#16231d', '#ecdcaf', '#c9a45c'], emblem: 'leaf' }),
        palette: { frame: FRAME, plinth: '#4a1622', awning: ['#1f3a2c', '#c9b47a'] },
        door: { at: 43 - 0.55 - (X0 + 0.22), w: 1.1, tint: FRAME }, glow: 0.5, awning: { depth: 0.9 },
      },
      backDoor: { at: 0.35, w: 0.9, label: "Fausta's cold room", tint: '#2a1a22', text: 'The cold room. Staff only.' },
      glow: { sky: '#c8c0a0', ground: '#5a3a2e', power: 0.13 },
    });
    const clip = U.clip, spill = U.spill;
    // a lit strip with no fitting but a thin diffuser, whose light ignores the overhead shadow (it sits under shelves and hoods)
    const glowStrip = (a, b, o) => {
      s.deco((g) => { g.mat('diffuser', '#fff4e0', { emissive: 0.9, lamp: o.lamp !== false }); g.box(Math.min(a[0], b[0]) - 0.015, a[1] - 0.012, Math.min(a[2], b[2]) - 0.015, Math.max(a[0], b[0]) + 0.015, a[1], Math.max(a[2], b[2]) + 0.015, { faces: 'yxXzZ' }); });
      s.light({ at: [a[0], a[1] - 0.03, a[2]], to: [b[0], b[1] - 0.03, b[2]], type: 'tube', color: warm(o.K || 3200), power: 5 * o.power, range: o.range || 3, radius: 0.04, clip, lamp: o.lamp !== false });
    };
    // glassCase() with clearer panes: in a dark room the pane's own haze outshines what is behind it, so thin it down
    const clearCase = (o, op) => glassCase(s, Object.assign({}, o, { opacity: op }));
    // a price plate standing on a surface at height y, on a little brass foot with a strut behind
    const tag = (t, sb, x, y, z, face, w) => {
      const h = w * 0.46, d = face === 'Z' || face === 'X' ? -1 : 1, alongX = face === 'Z' || face === 'z';
      sign(s, { kind: 'plate', text: t, lines: sb ? [sb] : undefined }, x, y + h / 2 + 0.006, z, { face, w, h, board: false, glow: 0.22 });
      s.detail((g) => {
        g.mat('cast', BRASS, { rough: -0.1 });
        if (alongX) { g.box(x - w * 0.42, y, Math.min(z, z + d * 0.025), x + w * 0.42, y + 0.006, Math.max(z, z + d * 0.025)); g.box(x - 0.004, y, Math.min(z + d * 0.003, z + d * 0.02), x + 0.004, y + h * 0.8, Math.max(z + d * 0.003, z + d * 0.02)); }
        else { g.box(Math.min(x, x + d * 0.025), y, z - w * 0.42, Math.max(x, x + d * 0.025), y + 0.006, z + w * 0.42); g.box(Math.min(x + d * 0.003, x + d * 0.02), y, z - 0.004, Math.max(x + d * 0.003, x + d * 0.02), y + h * 0.8, z + 0.004); }
      });
    };

    // ---- the walls dressed: raised panels in the dado, a brass dado rail, a dark cornice ----
    s.deco((g) => {
      const runs = [['x', xi0, zb + 0.1, Z1 - 0.3], ['X', xi1, zb + 0.1, Z1 - 0.3], ['z', zb, xi0 + 0.1, xi1 - 0.1]];
      for (const r of runs) {
        const [face, c, a0, a1] = r, n = Math.max(1, Math.round((a1 - a0) / 0.72)), step = (a1 - a0) / n;
        g.mat('wood', PANEL, { rough: -0.08 });
        for (let i = 0; i < n; i++) {
          const b0 = a0 + i * step + 0.06, b1 = a0 + (i + 1) * step - 0.06;
          if (face === 'z' && b1 > 41.55 && b0 < 44.45) continue;          // hidden behind the lettuce cabinet
          if (face === 'z') g.box(b0, 0.2, c, b1, 0.9, c + 0.014, { bevel: 0.005 });
          else if (face === 'x') g.box(c, 0.2, b0, c + 0.014, 0.9, b1, { bevel: 0.005 });
          else g.box(c - 0.014, 0.2, b0, c, 0.9, b1, { bevel: 0.005 });
        }
        g.mat('cast', BRASS, { rough: -0.1 });
        if (face === 'z') g.box(xi0, 1.035, c, xi1, 1.06, c + 0.022);
        else if (face === 'x') g.box(c, 1.035, zb, c + 0.022, 1.06, Z1 - 0.24);
        else g.box(c - 0.022, 1.035, zb, c, 1.06, Z1 - 0.24);
        g.mat('wood', '#14100e');
        if (face === 'z') g.box(xi0, H - 0.1, c, xi1, H, c + 0.06);
        else if (face === 'x') g.box(c, H - 0.1, zb, c + 0.06, H, Z1 - 0.24);
        else g.box(c - 0.06, H - 0.1, zb, c, H, Z1 - 0.24);
      }
    });
    // a brass trough on each side wall above the picture rail, washing the green upward to the beams
    for (const side of [-1, 1]) {
      const wx = side < 0 ? xi0 : xi1, ox = -side;
      s.deco((g) => { g.mat('cast', BRASS, { rough: -0.1 }); g.box(Math.min(wx, wx + ox * 0.09), 2.38, -12.9, Math.max(wx, wx + ox * 0.09), 2.44, Z1 - 0.5, { bevel: 0.006 }); });
      s.light({ at: [wx + ox * 0.05, 2.47, -12.7], to: [wx + ox * 0.05, 2.47, Z1 - 0.7], type: 'tube', color: warm(2900), power: 1.0, range: 1.7, radius: 0.04, clip, lamp: true, nospec: true });
    }
    // the machine overhead: a copper pipe and a green one along the east wall, a grille for the air
    s.structure((g) => {
      g.mat('cast', '#9a6a44', { rough: -0.1 }); g.tube([[46.55, 2.96, -13.34], [46.55, 2.96, -4.5]], 0.035, { segs: 10 });
      g.mat('paint', '#2a3a32', { rough: -0.1 }); g.tube([[46.38, 3.0, -13.34], [46.38, 3.0, -8.2], [46.2, 3.0, -8.0], [46.2, 3.0, -4.5]], 0.05, { segs: 10 });
      g.mat('cast', '#3a3430'); for (const z of [-12.5, -10.0, -7.0, -5.0]) { g.box(46.3, 2.94, z - 0.02, xi1, 3.2, z + 0.02); g.lathe(46.55, z, [[0.042, 2.95], [0.042, 2.99]], { segs: 10 }); }
      g.mat('cast', BRASS, { rough: -0.1 }); g.box(40.6, H - 0.012, -9.1, 41.4, H, -8.5, { bevel: 0.004 });
      g.mat('grille', '#3a3430'); g.box(40.65, H - 0.014, -9.05, 41.35, H - 0.012, -8.55, { faces: 'y' });
    });
    prop(s, 'rug', 43, 0, -4.62, 0, { w: 1.0, d: 0.48, mat: 'rush', a: '#8a7650', b: '#5a4a32' });
    prop(s, 'rug', 43, 0, -5.95, 0, { w: 1.15, d: 1.7, a: VELVET, b: '#c9a45c' });

    // ---- the windows: two velvet beds, a few things on each ----
    const bed = (a0, a1) => {
      block(s, a0, 0, -4.96, a1, 0.5, -4.25, 'wood', '#2a1a14', { bevel: 0.01 });
      s.deco((g) => { g.mat('felt', VELVET); g.box(a0 + 0.01, 0.5, -4.95, a1 - 0.01, 0.512, -4.26, { faces: 'Y' }); g.mat('cast', BRASS, { rough: -0.1 }); g.box(a0, 0.48, -4.975, a1, 0.515, -4.958); });
    };
    bed(39.3, 42.3); bed(43.7, 46.7);
    const BY = 0.512, ET = [0.14, 0.42, 0.68];   // bed top; the étagère's tier tops
    // west window: one tomato under a dome, an étagère of tomatoes, a dish of cherry tomatoes, tissue
    prop(s, 'food.cushion', 39.85, BY, -4.55, 0, { col: ROSE, w: 0.11, d: 0.11 }); dome(s, 39.85, BY, -4.55, 0.12, 0.2);
    prop(s, 'food.tomato', 39.85, BY + 0.024, -4.55, 0, { r: 0.04, col: '#c8281c' });
    const EW = [40.85, -4.66];
    prop(s, 'food.gg_etagere', EW[0], BY, EW[1], 0, {});
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; prop(s, 'food.tomato', EW[0] + Math.cos(a) * 0.12, BY + ET[0], EW[1] + Math.sin(a) * 0.12, i, { r: 0.034, col: ['#c8281c', '#d8561e', '#7a2a24', '#c42a20'][i] }); }
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.9; prop(s, 'food.tomato', EW[0] + Math.cos(a) * 0.08, BY + ET[1], EW[1] + Math.sin(a) * 0.08, i, { r: 0.03, col: ['#e2a020', '#d23a1e', '#c8281c'][i] }); }
    prop(s, 'food.tomato', EW[0], BY + ET[2], EW[1] + 0.03, 0, { r: 0.038, col: '#c8281c' });
    prop(s, 'food.gg_dish', 41.6, BY, -4.5, 0, {});
    prop(s, 'food.linen', 42.0, BY, -4.78, 0.3, { col: PINK, col2: TISSUE, n: 3, w: 0.2, d: 0.16 });
    tag('0.50', 'tomato', 40.85, BY, -4.34, 'Z', 0.075); tag('0.10', 'cherry', 41.6, BY, -4.34, 'Z', 0.07);
    // east window: an apple under a dome, an étagère of apples and a lettuce, herbs, a punnet
    prop(s, 'food.cushion', 44.3, BY, -4.55, 0, { col: ROSE, w: 0.11, d: 0.11 }); dome(s, 44.3, BY, -4.55, 0.12, 0.21);
    prop(s, 'food.apple', 44.3, BY + 0.024, -4.55, 0.4, { r: 0.04, col: '#b8322a' });
    const EE = [45.2, -4.66];
    prop(s, 'food.gg_etagere', EE[0], BY, EE[1], 0, {});
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5; prop(s, 'food.apple', EE[0] + Math.cos(a) * 0.115, BY + ET[0], EE[1] + Math.sin(a) * 0.115, i * 2, { r: 0.038, col: mixHex('#b8322a', '#c9a23a', i * 0.2), tissue: i === 1 ? PINK : true }); }
    prop(s, 'food.gg_lpot', EE[0], BY + ET[1], EE[1], 0.3, { r: 0.08, seed: 5, col: '#7a4a5a' });
    prop(s, 'food.punnet', EE[0], BY + ET[2], EE[1], 0.2, { seed: 6, w: 0.11, d: 0.09, n: 9 });
    prop(s, 'food.herbpot', 45.95, BY, -4.78, 0, { kind: 'broad', r: 0.06, seed: 1 }); prop(s, 'food.herbpot', 46.35, BY, -4.72, 0, { kind: 'shiso', r: 0.06, seed: 2 });
    prop(s, 'food.punnet', 46.15, BY, -4.42, 0.2, { seed: 4 });
    tag('4.4', 'orchard apple', 44.3, BY, -4.34, 'Z', 0.08); tag('0.90', 'Tansy', 45.75, BY, -4.34, 'Z', 0.07);
    lamp(s, 'spot', 40.8, 3.18, -4.62, { clip: spill, cone: [34, 16], power: 1.3, K: 3200 });
    lamp(s, 'spot', 45.2, 3.18, -4.62, { clip: spill, cone: [34, 16], power: 1.3, K: 3200 });

    // ---- the apple on its plinth, the dearest thing in the room ----
    const VX = 43, VZ = -7.5;
    s.furniture((g) => {
      g.mat('wood', '#1e1410', { rough: -0.05 }); g.box(VX - 0.28, 0, VZ - 0.28, VX + 0.28, 0.1, VZ + 0.28, { bevel: 0.015, aoBottom: 0.6 });
      g.mat('cast', BRASS, { rough: -0.12 }); g.box(VX - 0.245, 0.1, VZ - 0.245, VX + 0.245, 0.125, VZ + 0.245, { bevel: 0.006 });
    });
    clearCase({ x0: VX - 0.2, z0: VZ - 0.2, x1: VX + 0.2, z1: VZ + 0.2, base: 1.02, top: 1.38, body: OAK, lining: VELVET, frame: BRASS }, 0.05);
    prop(s, 'food.cushion', VX, 1.024, VZ, 0.785, { col: ROSE, w: 0.15, d: 0.15 });
    prop(s, 'food.apple', VX, 1.05, VZ, 0.6, { r: 0.043, col: '#b42c26' });
    plate(s, 'Orchard apple', '4.4', VX, 0.78, VZ + 0.207, 'Z', 0.17);
    lamp(s, 'spot', VX, 3.18, VZ, { clip, cone: [11, 5], power: 0.9, K: 3300 });

    // ---- the west wall: the tomato case, the cucumber case, and the shelf of apples above ----
    // tall wall cases with oak lids, lit from inside like a jeweller's (glass tops only shine back at you from across a dark room)
    const CX0 = 39.3, CX1 = 39.95, CY = 0.854, CT = 1.5;
    const wallCase = (z0, z1, lining, shelves) => {
      clearCase({ x0: CX0, z0, x1: CX1, z1, base: 0.85, top: CT, body: OAK, lining, frame: BRASS, panels: 'X', shelves, noTopPane: true }, 0.04);
      s.furniture((g) => {
        g.mat('wood', OAK, { rough: -0.08 }); g.box(CX0 - 0.03, CT, z0 - 0.03, CX1 + 0.035, CT + 0.06, z1 + 0.03, { bevel: 0.012 });
        g.mat('cast', BRASS, { rough: -0.12 }); g.box(CX1 + 0.03, CT + 0.012, z0 - 0.03, CX1 + 0.04, CT + 0.03, z1 + 0.03);
        g.mat('wood', shadeHex(OAK, 0.7)); g.box(CX0, CT - 0.004, z0, CX1, CT, z1, { faces: 'y' });
      });
      s.deco((g) => { g.mat('diffuser', '#fff1d8', { emissive: 3, lamp: true }); g.box(CX1 - 0.07, CT - 0.016, z0 + 0.08, CX1 - 0.04, CT - 0.004, z1 - 0.08, { faces: 'yxX' }); });
      s.light({ at: [CX1 - 0.06, CT - 0.04, z0 + 0.12], to: [CX1 - 0.06, CT - 0.04, z1 - 0.12], type: 'tube', color: warm(3300), power: 1.7, range: 1.4, radius: 0.03, clip: [CX0 - 0.02, CY - 0.05, z0 - 0.02, CX1 + 0.6, CT, z1 + 0.02], lamp: true });
    };
    wallCase(-8.9, -6.0, '#4e1622');
    const TOMS = [[0.038, '#c8281c'], [0.034, '#7a2a24'], [0.04, '#d43a1e'], [0.033, '#e2a020'], [0.036, '#b8241c'], [0.035, '#d8561e'], [0.039, '#c42a20']];
    prop(s, 'food.gg_riser', 39.44, CY, -7.5, Math.PI / 2, { w: 2.7, d: 0.2, h: 0.12 });
    spread(-8.75, -6.25, 7, (z, i) => {
      const back = i % 2 === 1, x = back ? 39.44 : 39.7, y = back ? CY + 0.12 : CY;
      prop(s, 'food.cushion', x, y, z, 0, { col: back ? ROSE : VELVET, w: 0.12, d: 0.12 });
      prop(s, 'food.tomato', x, y + 0.024, z, i, { r: TOMS[i][0], col: TOMS[i][1] });
      if (!back) tag('0.50', 'tomato', 39.88, CY, z, 'X', 0.07);
    });
    prop(s, 'food.gg_dish', 39.44, CY + 0.12, -6.15, 0, { r: 0.065 }); tag('0.10', 'cherry', 39.88, CY, -6.45, 'X', 0.07);
    lamp(s, 'spot', 40.05, 3.18, -7.45, { clip, cone: [26, 12], power: 0.6, K: 3200 });

    wallCase(-12.2, -9.35, '#3a5a3a', [1.12]);
    prop(s, 'food.gg_tray', 39.62, CY, -11.35, Math.PI / 2, { w: 0.62, d: 0.42, n: 5 });
    prop(s, 'food.gg_radish', 39.62, CY, -10.3, 0, {}); prop(s, 'food.gg_radish', 39.6, CY, -9.8, 1.3, { n: 5 });
    tag('0.45', 'cucumber', 39.88, CY, -11.35, 'X', 0.075); tag('0.30', 'radish', 39.88, CY, -10.05, 'X', 0.07);
    prop(s, 'food.gg_shoots', 39.62, 1.126, -11.7, 0.1, {}); prop(s, 'food.gg_shoots', 39.62, 1.126, -11.2, -0.1, {}); prop(s, 'food.gg_shoots', 39.62, 1.126, -10.7, 0.05, {});
    prop(s, 'food.gg_dish', 39.62, 1.126, -10.0, 0, { r: 0.07 });
    tag('0.16', 'pea shoots', 39.88, 1.126, -11.2, 'X', 0.075);
    lamp(s, 'spot', 40.05, 3.18, -10.75, { clip, cone: [26, 12], power: 0.6, K: 3200 });

    // the apple shelf on brass brackets, a picture light over it
    const AY = 1.86;
    s.furniture((g) => {
      g.mat('wood', OAK, { rough: -0.1 }); g.box(xi0, AY - 0.03, -12.0, xi0 + 0.3, AY, -6.2, { bevel: 0.006 });
      g.mat('cast', BRASS, { rough: -0.1 }); g.box(xi0 + 0.29, AY - 0.015, -12.0, xi0 + 0.305, AY + 0.015, -6.2);
      for (const z of [-11.7, -9.1, -6.5]) g.tube([[xi0, AY - 0.2, z], [xi0 + 0.02, AY - 0.12, z], [xi0 + 0.2, AY - 0.035, z]], 0.008, { segs: 5 });
      g.box(xi0, 2.2, -11.95, xi0 + 0.3, 2.23, -6.25, { bevel: 0.006 });
      for (const z of [-11.4, -6.8]) g.tube([[xi0, 2.36, z], [xi0 + 0.12, 2.32, z], [xi0 + 0.2, 2.23, z]], 0.007, { segs: 5 });
    });
    spread(-11.9, -6.3, 13, (z, i) => prop(s, 'food.apple', xi0 + 0.15, AY, z, i * 1.3, { r: 0.04, col: mixHex('#b8322a', '#c9a23a', (i * 0.37) % 0.5), tissue: i % 2 ? PINK : true }));
    plate(s, '4.4', 'orchard apple, each', xi0 + 0.31, AY - 0.05, -9.1, 'X', 0.1);
    glowStrip([xi0 + 0.2, 2.195, -11.85], [xi0 + 0.2, 2.195, -6.35], { power: 0.35, K: 3000, range: 2.2 });

    // ---- the back wall: the lettuces under their lamp, between the cold-room door and the herb stand ----
    const NX0 = 41.6, NX1 = 44.4, NZ = zb + 0.56;
    s.furniture((g) => {
      g.mat('wood', OAK, { rough: -0.05 });
      g.box(NX0, 0, zb, NX0 + 0.08, 2.62, NZ, { bevel: 0.008 }); g.box(NX1 - 0.08, 0, zb, NX1, 2.62, NZ, { bevel: 0.008 });
      g.box(NX0, 2.34, zb, NX1, 2.62, NZ + 0.02, { bevel: 0.01 });
      g.box(NX0 + 0.08, 0, zb, NX1 - 0.08, 0.47, NZ - 0.02, { aoBottom: 0.6 });
      g.mat('wood', shadeHex(OAK, 1.25)); for (const a of [[NX0 + 0.14, 42.95], [43.05, NX1 - 0.14]]) g.box(a[0], 0.08, NZ - 0.02, a[1], 0.4, NZ - 0.005, { bevel: 0.006 });
      g.mat('cast', BRASS, { rough: -0.1 }); for (const x of [42.85, 43.15]) g.ball(x, 0.3, NZ, 0.012, 0.012, 0.012, { segs: 6, rings: 4 });
      g.box(NX0, 2.3, NZ, NX1, 2.34, NZ + 0.025);
      g.mat('tile', '#d6ead2', { rough: -0.2, emissive: 0.12, lamp: true }); g.box(NX0 + 0.08, 0.47, zb + 0.026, NX1 - 0.08, 2.34, zb + 0.036, { faces: 'Z' });
      g.mat('wood', OAK); for (const y of [1.06, 1.66]) { g.box(NX0 + 0.08, y - 0.03, zb, NX1 - 0.08, y, NZ - 0.04, { bevel: 0.005 }); }
      g.mat('cast', BRASS); for (const y of [0.47, 1.06, 1.66]) g.box(NX0 + 0.08, y - 0.024, NZ - 0.045, NX1 - 0.08, y + 0.002, NZ - 0.03);
    });
    s.solid(NX0, 0, zb, NX1, 2.62, NZ);
    [0.47, 1.06, 1.66].forEach((y, row) => {
      spread(NX0 + 0.1, NX1 - 0.1, 7, (x, i) => prop(s, 'food.gg_lpot', x, y, zb + 0.28, (i * 1.7 + row) % TAU, { r: 0.095 + ((i + row) % 3) * 0.01, col: ['#5e9a3a', '#6aa83e', '#7a4a5a', '#5a9440'][(i + row * 2) % 4], seed: i + row * 6 }));
      glowStrip([NX0 + 0.14, y + 0.555, zb + 0.44], [NX1 - 0.14, y + 0.555, zb + 0.44], { power: 0.45, K: 4300, range: 3.0 });
    });
    plate(s, 'Leaves for a salad', '0.59', 43, 2.47, NZ + 0.022, 'Z', 0.3);

    // stacked crates from the growers between the door and the lettuces
    prop(s, 'crate', 40.95, 0, -12.95, 0.05, { w: 0.6, h: 0.32, d: 0.42, wood: '#8a6a44' });
    prop(s, 'crate', 40.97, 0.32, -12.97, -0.04, { w: 0.6, h: 0.32, d: 0.42, wood: '#9a7a50' });
    prop(s, 'food.linen', 40.95, 0.64, -12.95, 0.1, { col: TISSUE, col2: PINK, n: 5, w: 0.34, d: 0.26 });

    // ---- the herb stand at the back, under the lamp that goes dark last ----
    prop(s, 'food.gg_herbstand', 45.75, 0, zb + 0.3, 0, { w: 1.5 });
    s.deco((g) => {
      g.mat('cast', BRASS, { rough: -0.1 }); g.box(45.0, 1.62, zb, 46.5, 1.66, zb + 0.32, { bevel: 0.006 });
      g.box(44.98, 1.6, zb + 0.3, 46.52, 1.66, zb + 0.33);
    });
    glowStrip([45.08, 1.6, zb + 0.18], [46.42, 1.6, zb + 0.18], { power: 0.5, K: 3800, range: 2.4, lamp: false });
    sign(s, { kind: 'poster', title: 'Cut it crosswise', lines: ['and everyone sees the star', 'an apple for every two'], motif: 'feast', palette: ['#1b2822', '#efe2c4', '#c25a6c'] }, 45.75, 2.0, zb + 0.004, { face: 'Z', w: 0.42, h: 0.58 });

    // ---- Fausta's counter: a glass-topped case, the balance on it, her shelves behind ----
    const KX0 = 44.9, KX1 = 45.6, KZ0 = -11.2, KZ1 = -7.4, KT = 0.93;
    clearCase({ x0: KX0, z0: KZ0, x1: KX1, z1: KZ1, base: 0.55, top: KT, body: OAK, lining: '#4e1622', frame: BRASS, panels: 'xzZ', noTopPane: true }, 0.04);
    glassMat(s.g, '#e6efea', 0.05, 0.02); s.g.box(KX0, KT - 0.006, KZ0, KX1, KT, KZ1, { faces: 'Y' }); s.g._col[3] = 255; s.flush({ glass: true });
    s.deco((g) => { g.mat('diffuser', '#fff1d8', { emissive: 0.4, lamp: true }); g.box(KX1 - 0.06, KT - 0.03, KZ0 + 0.1, KX1 - 0.03, KT - 0.018, KZ1 - 0.1, { faces: 'yxX' }); g.mat('wood', OAK); g.box(KX1 - 0.08, KT - 0.018, KZ0, KX1, KT - 0.006, KZ1, { faces: 'yxX' }); });
    s.light({ at: [KX1 - 0.05, KT - 0.05, KZ0 + 0.15], to: [KX1 - 0.05, KT - 0.05, KZ1 - 0.15], type: 'tube', color: warm(3300), power: 1.5, range: 1.2, radius: 0.03, clip: [KX0 - 0.6, 0.5, KZ0, KX1, KT, KZ1], lamp: true });
    const KY = 0.554;
    prop(s, 'food.punnet', 45.25, KY, -7.75, 0.1, { seed: 1 }); prop(s, 'food.punnet', 45.25, KY, -8.0, -0.15, { seed: 2 });
    prop(s, 'food.gg_shoots', 45.25, KY, -8.45, 0, {}); prop(s, 'food.gg_radish', 45.25, KY, -8.95, 0.5, {});
    prop(s, 'food.gg_dish', 45.25, KY, -9.5, 0, {}); prop(s, 'food.cushion', 45.25, KY, -10.05, 0, { col: ROSE }); prop(s, 'food.tomato', 45.25, KY + 0.024, -10.05, 0, { r: 0.037 });
    prop(s, 'food.gg_lpot', 45.25, KY, -10.65, 0, { r: 0.08, seed: 9, col: '#7a4a5a' });
    for (const [z, t, sb] of [[-7.88, '0.90', 'Tansy'], [-8.45, '0.16', 'shoots'], [-8.95, '0.30', 'radish'], [-9.5, '0.10', 'cherry'], [-10.05, '0.50', 'tomato'], [-10.65, '0.59', 'leaves']]) tag(t, sb, KX0 + 0.05, KY, z, 'x', 0.065);
    prop(s, 'food.scale', 45.25, KT + 0.012, -9.3, -Math.PI / 2, {});
    prop(s, 'food.gg_wrap', 45.3, KT + 0.012, -10.55, Math.PI / 2, {});
    prop(s, 'food.linen', 45.25, KT + 0.012, -8.2, 0.2, { col: PINK, col2: '#f6efe2', n: 6, w: 0.3, d: 0.22 });
    prop(s, 'food.gg_things', 45.35, KT + 0.012, -7.7, 0.1, { kind: 'ledger' });
    prop(s, 'food.gg_shade', 45.25, H, -8.4, 0, { L: 1.1 }); prop(s, 'food.gg_shade', 45.25, H, -10.2, 0, { L: 1.1 });
    lamp(s, 'bulb', 45.25, H - 1.22, -8.4, { clip, power: 0.6, K: 2700, range: 3.5 });
    lamp(s, 'bulb', 45.25, H - 1.22, -10.2, { clip, power: 0.6, K: 2700, range: 3.5 });

    // her cupboard and shelves on the east wall
    const SX = xi1;
    block(s, SX - 0.34, 0, -11.0, SX, 0.86, -7.6, 'wood', OAK, { bevel: 0.01 });
    s.furniture((g) => {
      g.mat('wood', shadeHex(OAK, 1.2)); spread(-11.0, -7.6, 4, (z) => g.box(SX - 0.352, 0.12, z - 0.36, SX - 0.34, 0.76, z + 0.36, { bevel: 0.006 }));
      g.mat('cast', BRASS); spread(-11.0, -7.6, 4, (z) => g.ball(SX - 0.36, 0.62, z, 0.012, 0.012, 0.012, { segs: 6, rings: 4 }));
      g.mat('wood', OAK, { rough: -0.08 }); for (const y of [1.32, 1.72, 2.12]) g.box(SX - 0.27, y - 0.03, -11.0, SX, y, -7.6, { bevel: 0.006 });
      g.mat('cast', BRASS); for (const y of [1.32, 1.72, 2.12]) for (const z of [-10.8, -9.3, -7.8]) g.tube([[SX, y - 0.22, z], [SX - 0.02, y - 0.12, z], [SX - 0.2, y - 0.035, z]], 0.007, { segs: 5 });
    });
    prop(s, 'food.gg_things', SX - 0.14, 0.86, -10.6, Math.PI / 2, { kind: 'bags' });
    prop(s, 'food.gg_things', SX - 0.14, 0.86, -8.2, Math.PI / 2, { kind: 'punnets' });
    prop(s, 'food.jar', SX - 0.14, 0.86, -9.3, 0, { fill: '#cfd8c0', level: 0.6, h: 0.18, r: 0.05 });
    // shelf one: tissue and string; shelf two: jars of seed and dried herbs; shelf three: tins and spare punnets
    prop(s, 'food.gg_things', SX - 0.13, 1.32, -10.6, Math.PI / 2, { kind: 'rolls' }); prop(s, 'food.gg_things', SX - 0.13, 1.32, -9.95, Math.PI / 2, { kind: 'rolls' });
    prop(s, 'food.gg_things', SX - 0.13, 1.32, -8.0, Math.PI / 2, { kind: 'bags' }); prop(s, 'food.gg_wrap', SX - 0.14, 1.32, -9.05, -Math.PI / 2, {});
    const JARS = ['#6a1e3a', '#c9a04a', '#3a5a2a', '#8a3a1e', '#d8c8a0', '#5a3a2a', '#9ab070', '#c96a3a', '#4a2a3a'];
    spread(-10.95, -7.65, 9, (z, i) => prop(s, 'food.jar', SX - 0.13, 1.72, z, 0, { fill: JARS[i], h: i % 3 === 1 ? 0.19 : 0.15, r: 0.045, level: 0.5 + (i % 4) * 0.12 }));
    spread(-10.95, -8.6, 5, (z, i) => prop(s, 'food.tin', SX - 0.13, 2.12, z, 0, { col: [VELVET, '#2f5a4a', '#c9a04a', '#3a2a4a', '#2f4a5a'][i], h: 0.15 + (i % 2) * 0.05, r: 0.06 }));
    prop(s, 'food.gg_things', SX - 0.13, 2.12, -8.1, 0, { kind: 'punnets' }); prop(s, 'food.gg_things', SX - 0.13, 2.12, -7.8, 0.2, { kind: 'punnets' });

    // ---- the middle: Tansy strawberries under the big dome on a round table ----
    const TX = 42.5, TZ = -10.45;
    prop(s, 'food.gg_rtable', TX, 0, TZ, 0, { r: 0.42 });
    prop(s, 'food.punnet', TX - 0.07, 0.775, TZ + 0.04, 0.1, { seed: 11 }); prop(s, 'food.punnet', TX + 0.08, 0.775, TZ - 0.03, -0.2, { seed: 12 }); prop(s, 'food.punnet', TX, 0.82, TZ, 0.4, { seed: 13 });
    dome(s, TX, 0.775, TZ, 0.2, 0.26);
    tag('Tansy strawberries', '0.90 the punnet', TX, 0.775, TZ + 0.34, 'Z', 0.16);
    prop(s, 'food.gg_dish', TX + 0.27, 0.775, TZ + 0.18, 0, { r: 0.065 });
    lamp(s, 'spot', TX, 3.18, TZ, { clip, cone: [20, 9], power: 0.8, K: 3200 });

    // a chair for anyone who looks a long time, and a notice of the growers
    prop(s, 'chair', 40.45, 0, -5.45, 2.25, { wood: '#3a2418', seat: VELVET });
    sign(s, { kind: 'notice', title: 'On the racks this week', lines: ['Tomatoes: Bay Nine, the Keel', 'Strawberries: Tansy, by glide', 'Apples: the Hollow rows', 'Leaves and herbs: here,', 'under our own lamps'], paper: '#efe2c8' }, xi0 + 0.012, 1.55, -5.35, { face: 'X', w: 0.3, h: 0.42 });

    // ---- the pavement: a low stall of herbs and a chalkboard, the hanging sign ----
    prop(s, 'food.stall', 40.7, 0, -3.5, 0, { w: 1.3, d: 0.46, h: 0.62, cloth: '#5a1a28', trim: '#c9a45c' });
    spread(40.12, 40.95, 4, (x, i) => prop(s, 'food.herbpot', x, 0.62, -3.6 + (i % 2) * 0.13, 0, { kind: ['broad', 'fine', 'shiso', 'broad'][i], r: 0.075, size: 0.26, seed: 20 + i }));
    prop(s, 'food.gg_lpot', 41.18, 0.62, -3.55, 0, { r: 0.085, seed: 21 }); dome(s, 41.18, 0.62, -3.55, 0.13, 0.2);
    plate(s, '0.03', 'herbs, five grams', 40.55, 0.585, -3.255, 'Z', 0.1);
    prop(s, 'food.board', 45.35, 0, -3.48, 0, { w: 0.62, h: 1.25, wood: '#2a1c14' });
    sign(s, SIGNS['greengrocer.chalk'], 45.35, 0.815, -3.45, { face: 'Z', w: 0.6, h: 0.78, board: false });
    s.deco((g) => {
      const x = 46.89; g.mat('cast', '#2a2622', { rough: -0.1 });
      g.box(x - 0.04, 2.55, -3.99, x + 0.04, 2.95, -3.95, { bevel: 0.006 });
      g.tube([[x, 2.72, -3.96], [x, 2.72, -3.22]], 0.012, { segs: 6 });
      g.tube([[x, 2.92, -3.96], [x, 2.86, -3.7], [x, 2.76, -3.45], [x, 2.72, -3.36]], 0.009, { segs: 5 });
      g.mat('cast', BRASS); g.ball(x, 2.72, -3.21, 0.02, 0.02, 0.02, { segs: 8, rings: 5 });
      for (const z of [-3.82, -3.38]) g.tube([[x, 2.72, z], [x, 2.66, z]], 0.005, { segs: 4 });
    });
    sign(s, Object.assign({}, SIGNS['greengrocer.hanging'], { palette: ['#1b2822', '#ecdcaf', '#c8402e'], emblem: 'apple' }), 46.89, 2.35, -3.6, { face: 'X', double: true, w: 0.56, h: 0.6, back: '#1b2822' });

    // ---- people ----
    s.spot('counter', 46.2, 0, -9.3, -Math.PI / 2, { who: 'fausta', tags: ['greengrocer'] });
    s.spot('work', 46.2, 0, -10.5, -Math.PI / 2, { who: 'fausta', tags: ['greengrocer', 'wrap'] });
    s.spot('work', 45.75, 0, -12.05, Math.PI, { who: 'fausta', tags: ['greengrocer', 'tend'] });
    for (const z of [-8.4, -10.1]) s.spot('customer', 44.35, 0, z, Math.PI / 2, { tags: ['greengrocer'] });
    for (const z of [-7.9, -10.6]) s.spot('browse', 40.55, 0, z, -Math.PI / 2, { tags: ['greengrocer'] });
    s.spot('browse', 43, 0, -6.85, Math.PI, { tags: ['greengrocer', 'apple'] });
    s.spot('browse', 41.75, 0, -10.45, Math.PI / 2, { tags: ['greengrocer'] });
    s.spot('browse', 42.5, 0, -12.15, Math.PI, { tags: ['greengrocer', 'lettuce'] });
    s.spot('browse', 45.4, 0, -11.95, Math.PI, { tags: ['greengrocer', 'herbs'] });
    s.spot('browse', 40.7, 0, -5.4, 0, { tags: ['greengrocer', 'window'] });
    s.spot('queue', 44.3, 0, -7.05, Math.PI, { tags: ['greengrocer'] });
    s.spot('sit', 40.45, 0.45, -5.45, 2.25, { tags: ['greengrocer'] });
    s.spot('browse', 40.7, 0, -2.85, Math.PI, { tags: ['greengrocer', 'street'] }); s.spot('browse', 45.35, 0, -2.85, Math.PI, { tags: ['greengrocer', 'street'] });
    s.path([[43, -2.5], [43, -4.5], [43, -6.4]]);
    s.path([[43, -6.4], [44.25, -7.0], [44.25, -9.3], [44.25, -11.5], [43, -11.95], [41.4, -11.6], [40.6, -10.2], [40.6, -7.6], [41.5, -6.4], [43, -6.4]]);
    s.path([[44.25, -7.0], [45.9, -6.6], [46.2, -7.6], [46.2, -11.0], [45.75, -11.95]]);

    // ---- things to do ----
    s.interact({
      x: 45.0, y: 1.0, z: -9.3, radius: 1.3, kind: 'talk', prompt: 'Talk to Fausta',
      async onUse(gm) {
        if (!gm.ui) return;
        gm.flags = gm.flags || {};
        if (!gm.flags.ggMet) { gm.flags.ggMet = true; await sayAs(gm, FAUSTA, ["Margin flat, by the look of your bag. Have you eaten today?", "Eat at the hall first. A tomato is not lunch. It's an occasion."]); }
        let pick = null; gm.busy++;
        try { pick = await gm.ui.choose(FAUSTA, 'Look as long as you like.', [{ label: 'Buy something', value: 'buy' }, { label: "Ask what a salad's worth of leaves costs", value: 'salad' }, { label: 'Ask where it all comes from', value: 'growers' }]); } finally { gm.busy--; }
        if (pick === 'buy') {
          const it = await buyFrom(gm, MENUS.greengrocer, 'Fausta');
          if (it) { const give = { tomato: 'tomato', apple: 'whole-apple' }[it.id]; if (give && gm.inv && gm.inv.give) gm.inv.give(give); await sayAs(gm, FAUSTA, BOUGHT[it.id] || 'In tissue, then. Mind the corners.'); }
        }
        else if (pick === 'salad') { await sayAs(gm, FAUSTA, SALAD); if (gm.journal) gm.journal.find('salad-treat'); }
        else if (pick === 'growers') await sayAs(gm, FAUSTA, GROWERS);
      },
    });
    s.interact({
      x: VX, y: 1.2, z: VZ, radius: 1.0, prompt: 'Look at the apple',
      async onUse(gm) {
        await sayAs(gm, { name: 'Orchard apple, 4.4', colour: '#e2c486' }, ["From the Hollow's orchard rows, alone on its own cushion under its own light.", 'It costs more than a steak, and more than a bottle of gin. You buy one as a gift, and never for yourself.']);
        if (gm.journal) gm.journal.find('tomato-jewel');
      },
    });
    s.interact({
      x: CX1 + 0.05, y: 1.05, z: -7.45, radius: 1.1, prompt: 'Read the price plates',
      async onUse(gm) {
        await sayAs(gm, { name: 'The price plates', colour: '#e2c486' }, ['Tomato, 0.50. One to a cushion, four cushions, one lamp each.', 'Cherry tomato, 0.10.', "A calorie from the Garden's lamps costs about thirteen times one from the Mill. Next door a sugar bun is 0.40."]);
        if (gm.journal) gm.journal.find('tomato-jewel');
      },
    });
    s.interact({
      x: 43, y: 1.3, z: NZ + 0.2, radius: 1.2, prompt: 'Look at the lettuces under the lamp',
      onUse(gm) { return sayAs(gm, { name: 'Under the lamp', colour: '#a9d8c8' }, ['Twenty-one lettuces in three rows, each in its own pot, each under the same white lamp.', 'The plate says: Leaves for a salad, 0.59. Fausta grows these herself.']); },
    });
    s.interact({
      x: TX, y: 1.0, z: TZ, radius: 0.9, prompt: 'Look at the strawberries',
      onUse(gm) { return sayAs(gm, { name: 'Under the dome', colour: '#f2a48f' }, ['Tansy strawberries, 0.90 the punnet. Picked in Tansy this morning and through the Gate on the first glide.']); },
    });
    s.interact({
      x: 45.75, y: 1.0, z: zb + 0.5, radius: 1.0, prompt: 'Smell the herbs',
      onUse(gm) { return sayAs(gm, { name: 'The herb stand', colour: '#8fd694' }, ['Basil, shiso, coriander and chives, five grams for three hundredths of a kay.', 'Their lamp stays on when the others go down for the night.']); },
    });
    s.interact({
      x: 40.45, y: 0.75, z: -5.45, radius: 0.9, prompt: 'Sit and look a while',
      onUse(gm) { if (gm.player && gm.player.sit) { gm.player.sit({ x: 40.45, y: 0, z: -5.45, yaw: 2.25 }); gm.player.yaw = Math.PI - 2.25; } },
    });
    s.interact({
      x: 45.35, y: 0.9, z: -3.4, radius: 1.0, prompt: 'Read the board',
      onUse(gm) { const c = SIGNS['greengrocer.chalk']; return sayAs(gm, { name: 'The board', colour: '#f4e9c9' }, [c.title + ':'].concat(c.lines.map((l) => l.replace(' · ', ', ')))); },
    });

    // the lettuce lamps hum faintly once you are inside
    let hum = null;
    s.trigger({ box: [X0, 0, Z0, X1, H, Z1], onEnter(gm) { if (!hum && gm.loopAt) hum = gm.loopAt('hum-lamp', f, 43, 1.4, zb + 0.3, { vol: 0.12, radius: 4 }); } });

    s.zoneBox({ id: 'greengrocer', place: 'greengrocer', box: [X0, 0, Z0, X1, H, Z1], name: 'The Glass Case', sub: 'Ladle Row', ambience: 'shop', reverb: 'room', env: { autoKey: 0.14, autoMax: 2.2, bloom: 0.07, contrast: 1.15, warmth: 0.2 } });
    s.finish();
    game.spawns.greengrocer = { frame: f, x: 43, y: 0, z: -5, yaw: 0 };
  },
};

const BOUGHT = {
  tomato: 'One tomato, in tissue. Carry it in your hand, not your pocket.',
  'cherry-tomato': "Eat it here. That's what they're for.",
  apple: ['Rose tissue and a bit of string.', 'Whoever it is for will know what it cost, and will know not to say so.'],
  herbs: "Five grams. I cut it at the last moment, so it still thinks it's in the pot.",
  'salad-leaves': 'In a damp cloth. Cut it into careful portions, and give the biggest one away.',
  cucumber: 'Cold and firm. Cut it thick, salt it, and bring the cloth back.',
  radish: 'With butter, slowly. Nobody hurries a radish.',
  strawberries: "Picked in Tansy this morning, through the Gate on the first glide. They've had a busier morning than you.",
  'pea-shoots': 'A handful. Eat them on the walk home.',
};
const SALAD = [
  "A side salad's worth is about 150 grams of leaves. That's 0.59.",
  'Five grams of herbs costs about a watt of light. A salad of leaves costs twenty-five.',
  "So pastry is what you fill up on, and a salad is the treat. We cut it into careful portions.",
  'And the herb pots are always the last of the Garden to go dark. Remember that.',
];
const GROWERS = [
  'The tomatoes come from a bay on the Keel. I know the grower. She names them, and I keep the names off the plates.',
  'The strawberries come from Tansy by glide, and the apples down from the Hollow rows, six to a crate, each in its own paper.',
  'The lettuces at the back are mine. That lamp is the dearest thing in the shop after the apple.',
];
