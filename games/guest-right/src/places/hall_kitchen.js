// The hall kitchen: open to the long table across the pass at the middle of the hall's north wall. A range of electric
// hotplates with the big pots held on the 65 degree loop, one plate for searing, the plating bench and the pass with its
// rail of lidded dishes, a washing-up corner under the wall of numbered lids, the noodle bench (Thursday is ramen),
// sacks of Mill flour and rice, crocks, knives, and herbs under a grow-lamp. No flame and no smoke; steam is fine.
import { floor, ceiling, wall, lamp, roomGlow, warm } from '../world/kit.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { Rng, shadeHex } from '../core/util.js';

const X0 = -14, X1 = 14, Z0 = -34, Z1 = -27.5, H = 3.2;
const NW = -33.7, WW = -13.7, EW = 13.7;        // inner faces of the north, west and east walls
const CLIP = [X0 - 0.05, -0.3, Z0 - 0.05, X1 + 0.05, H + 0.1, Z1 + 0.9];
const STEEL = '#c3beb4', ENAMEL = '#2c4a46';
const GLAZES = ['#e9e1cf', '#a9c6b0', '#d4a24a', '#3a4a7a', '#b5653a', '#8fb3c4'];

// A big stockpot with a lid and two handles, held on the loop. p: { r, h }
defineProp('kitchen.pot', (g, p) => {
  const r = p.r || 0.24, h = p.h || 0.4;
  g.mat('brushed', p.metal || STEEL, { rough: 0.22 });
  g.lathe(0, 0, [[0, 0], [r - 0.01, 0], [r, 0.01], [r, h], [r + 0.012, h + 0.008], [r - 0.006, h + 0.01], [r - 0.012, h - 0.01]], { segs: 20, capTop: false });
  g.mat('brushed', shadeHex(p.metal || STEEL, 0.9)); g.lathe(0, 0, [[r + 0.008, h + 0.012], [r * 0.9, h + 0.03], [r * 0.3, h + 0.05], [0.025, h + 0.055], [0.025, h + 0.09], [0.04, h + 0.1], [0, h + 0.1]], { segs: 20, capBottom: false });
  g.mat('cast', '#2a2624'); for (const s of [-1, 1]) g.tube([[s * r, h - 0.06, -0.05], [s * (r + 0.05), h - 0.05, -0.05], [s * (r + 0.05), h - 0.05, 0.05], [s * r, h - 0.06, 0.05]], 0.009, { segs: 5 });
  return { posts: [[0, 0, r, 0, h]], tier: 's' };
});

// A sack of Mill flour or rice, slumped, tied at the neck. p: { col, label }
defineProp('kitchen.sack', (g, p) => {
  g.mat('weave', p.col || '#d8ccb0', { rough: 0.1 });
  g.lathe(0, 0, [[0, 0], [0.2, 0.0], [0.24, 0.08], [0.24, 0.35], [0.2, 0.5], [0.08, 0.6], [0.05, 0.64], [0.07, 0.7], [0, 0.71]], { segs: 12 });
  g.mat('weave', '#8a6a3a'); g.cyl(0, 0.6, 0, 0.055, 0.025, { segs: 8 });
  g.mat('paint', p.band || '#8c2c26'); g.lathe(0, 0, [[0.242, 0.26], [0.242, 0.34]], { segs: 12, capBottom: false, capTop: false });
  return { posts: [[0, 0, 0.24, 0, 0.6]], tier: 's' };
});

// A kitchen knife on the magnetic strip, point down.
defineProp('kitchen.knife', (g, p) => {
  const L = p.len || 0.22;
  g.mat('wood', p.handle || '#3a2a1e'); g.box(-0.012, 0, -0.008, 0.012, 0.11, 0.008, { bevel: 0.004 });
  g.mat('brushed', '#d8d4cc', { rough: -0.25 }); g.box(-0.016, -L, -0.0015, 0.016, 0.0, 0.0015); g.box(-0.016, -L - 0.02, -0.0015, 0.0, -L, 0.0015);
  return { cast: false };
});

// A hanging ladle or spoon on a rail hook.
defineProp('kitchen.ladle', (g, p) => {
  const L = p.len || 0.38;
  g.mat('cast', '#6a6258'); g.tube([[0, 0.02, 0], [0, 0, 0.01], [0, -0.02, 0.012]], 0.004, { segs: 4 });
  g.mat('brushed', '#cfcac2', { rough: -0.2 }); g.tube([[0, -0.02, 0.014], [0, -L, 0.016]], 0.006, { segs: 5 });
  if (p.kind === 'spoon') g.ball(0, -L - 0.04, 0.02, 0.035, 0.05, 0.012, { segs: 8, rings: 5 });
  else g.ball(0, -L - 0.04, 0.04, 0.055, 0.045, 0.055, { segs: 10, rings: 6, top: 0.1 });
  return { cast: false };
});

export const place = {
  id: 'kitchen', name: 'The hall kitchen', order: 41,
  build(game) {
    const W = game.world;
    const f = W.frame('candlewick', deckRadius(16), 0, 625);
    const s = W.scope('kitchen', f);
    const g = s.g;
    const R = new Rng(16022);
    const clip = CLIP;

    // ======================= the room =======================
    floor(s, X0, Z0, X1, Z1, 0, 'tile', '#a2573c');
    s.structure(() => {
      g.mat('tile', '#6e3a28'); g.box(X0, 0, -31.35, X1, 0.003, -31.25, { faces: 'Y' });
      g.mat('grille', '#4a4642'); g.box(-9, 0.0, -31.42, 7, 0.006, -31.18, { faces: 'Y' });          // the floor drain
    });
    ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#ebe4d6');
    const wo = { t: 0.3, mat: 'tile', tint: '#ebe5d6', dado: { h: 1.05, mat: 'tile', tint: '#2f6c66' }, skirt: '#2c2a26' };
    wall(s, X0, -33.85, X1, -33.85, 0, H, wo);
    wall(s, -13.85, Z0, -13.85, Z1, 0, H, wo);
    wall(s, 13.85, Z0, 13.85, Z1, 0, H, Object.assign({}, wo, { openings: [{ at: 0.6, w: 1.1, h: 2.1 }] }));
    // a band of ochre tile over the dado and a top rail of wood
    s.structure(() => {
      g.mat('tile', '#d1952c');
      g.box(X0 + 0.3, 1.05, NW, X1 - 0.3, 1.15, NW + 0.012, { faces: 'Z' });
      g.box(WW, 1.05, Z0 + 0.3, WW + 0.012, 1.15, Z1, { faces: 'X' });
      g.box(EW - 0.012, 1.05, Z0 + 0.3, EW, 1.15, Z1, { faces: 'x' });
    });

    // ======================= the pass =======================
    // a long steel bench on the kitchen side, running through the three openings to a shelf on the hall side
    s.furniture(() => {
      g.mat('paint', ENAMEL); g.box(-10.15, 0.1, -28.32, 10.15, 0.88, -27.5, { faces: 'xXz', aoBottom: 0.6 });
      g.mat('paint', shadeHex(ENAMEL, 0.6)); g.box(-10.1, 0, -28.25, 10.1, 0.1, -27.5, { faces: 'z' });
      g.mat('brushed', STEEL, { rough: 0.3 }); g.box(-10.2, 0.88, -28.36, 10.2, 0.92, -27.5, { bevel: 0.006 });
    });
    for (const o of [[-10.15, -3.85], [-3.15, 3.15], [3.85, 10.15]]) {
      s.furniture(() => {
        // the hall side: a panelled front in dark wood, a brass edge
        g.mat('wood', '#4b2f1f'); g.box(o[0], 0.0, -27.5, o[1], 0.88, -26.98, { faces: 'xXZ', aoBottom: 0.6 });
        g.mat('wood', '#5c3a26'); for (let x = o[0] + 0.15; x < o[1] - 0.6; x += 0.85) g.box(x, 0.16, -26.98, x + 0.7, 0.78, -26.965, { bevel: 0.008 });
        g.mat('brushed', STEEL, { rough: 0.3 }); g.box(o[0], 0.88, -27.5, o[1], 0.92, -26.92, { bevel: 0.006 });
        g.mat('cast', '#b8863b', { rough: -0.2 }); g.box(o[0], 0.9, -26.94, o[1], 0.925, -26.9, { bevel: 0.004 });
        // the heated gantry over the pass: a steel shelf on posts, and the heat lamps above it
        g.mat('brushed', '#a9a39a'); for (const x of [o[0] + 0.15, (o[0] + o[1]) / 2, o[1] - 0.15]) g.tube([[x, 0.92, -27.25], [x, 1.5, -27.25]], 0.014, { segs: 6 });
        g.mat('brushed', STEEL); g.box(o[0] + 0.05, 1.48, -27.5, o[1] - 0.05, 1.51, -27.0, { bevel: 0.004 });
        g.mat('brushed', '#3a3632'); g.box(o[0] + 0.05, 2.38, -27.45, o[1] - 0.05, 2.5, -27.05, { bevel: 0.01 });
        g.mat('diffuser', '#ffb070', { emissive: 4, lamp: true }); for (let x = o[0] + 0.6; x < o[1] - 0.3; x += 1.2) g.box(x - 0.2, 2.37, -27.35, x + 0.2, 2.38, -27.15, { faces: 'y' });
      });
      s.solid(o[0], 0, -27.5, o[1], 0.92, -26.92);
      s.light({ at: [(o[0] + o[1]) / 2, 2.3, -27.25], to: [o[1] - 0.6, 2.3, -27.25], type: 'tube', color: warm(2400), power: 4.5, range: 4.5, lamp: true, clip: [o[0] - 1, -0.3, -29, o[1] + 1, 3.0, -25.5], radius: 0.1 });
      // the rail of lidded dishes waiting on the pass, and more on the gantry
      for (let x = o[0] + 0.25; x < o[1] - 0.2; x += R.f(0.24, 0.42)) {
        if (R.chance(0.78)) prop(s, 'hall.setbowl', x, 0.92, -27.22 + R.f(-0.08, 0.08), R.f(0, 6), { glaze: R.pick(GLAZES), lid: R.chance(0.7) ? undefined : R.pick(GLAZES) });
        if (R.chance(0.45)) prop(s, 'hall.setbowl', x + 0.1, 1.51, -27.25, R.f(0, 6), { glaze: R.pick(GLAZES) });
      }
      // tickets on the gantry rail: one per table stretch
      s.detail(() => { g.mat('paper', '#f1ead8'); for (let x = o[0] + 0.4; x < o[1] - 0.3; x += 0.55) g.box(x, 1.36, -27.0, x + 0.07, 1.47, -26.996); });
    }
    s.solid(-10.2, 0, -28.36, 10.2, 0.92, -27.5);
    sign(s, { kind: 'letters', text: 'KITCHEN · LIDS ON', font: 'caps', palette: ['#e9c46a'] }, 0, 2.95, -26.98, { face: 'Z', w: 3.6, h: 0.32, glow: 1.6 });
    sign(s, SIGNS['kitchen.lids'], -3.35, 1.9, -26.99, { face: 'Z' });

    // ======================= the range, on the north wall =======================
    const RX0 = -10.6, RX1 = 7.6;
    s.furniture(() => {
      g.mat('paint', ENAMEL); g.box(RX0, 0.1, NW, RX1, 0.86, NW + 0.82, { faces: 'xXZ', aoBottom: 0.6 });
      g.mat('paint', shadeHex(ENAMEL, 0.55)); g.box(RX0 + 0.05, 0, NW, RX1 - 0.05, 0.1, NW + 0.76, { faces: 'xXZ' });
      g.mat('paint', shadeHex(ENAMEL, 1.25)); for (let x = RX0 + 0.08; x < RX1 - 0.5; x += 0.9) g.box(x, 0.18, NW + 0.82, x + 0.82, 0.78, NW + 0.835, { bevel: 0.01 });
      g.mat('brushed', '#d6d2ca'); for (let x = RX0 + 0.08; x < RX1 - 0.5; x += 0.9) g.box(x + 0.3, 0.72, NW + 0.84, x + 0.52, 0.74, NW + 0.87, { bevel: 0.006 });
      g.mat('brushed', STEEL, { rough: 0.3 }); g.box(RX0 - 0.02, 0.86, NW, RX1 + 0.02, 0.9, NW + 0.86, { bevel: 0.008 });
      g.box(RX0, 0.9, NW, RX1, 1.02, NW + 0.03);
    });
    s.solid(RX0, 0, NW, RX1, 0.9, NW + 0.86);
    // hotplates: black discs, and the one that sears glowing dull orange
    const plates = [];
    for (let x = RX0 + 0.5; x < RX1 - 0.3; x += 0.82) for (const zz of [NW + 0.24, NW + 0.6]) plates.push([x + (zz > NW + 0.4 ? 0.2 : 0), zz]);
    s.furniture(() => {
      for (const p of plates) {
        const sear = p[0] > 5.6 && p[1] > NW + 0.4;
        g.mat('cast', '#2a2624'); g.cyl(p[0], 0.9, p[1], 0.17, 0.012, { segs: 16 });
        if (sear) { g.mat('cast', '#ff6a2a', { emissive: 2.2, lamp: false }); g.cyl(p[0], 0.912, p[1], 0.13, 0.002, { segs: 16 }); }
        else { g.mat('cast', '#3a3530'); for (const rr of [0.05, 0.1]) g.lathe(p[0], p[1], [[rr, 0.913], [rr + 0.012, 0.913]], { segs: 16, capBottom: false, capTop: false }); }
      }
    });
    s.light({ at: [6.6, 1.0, NW + 0.6], color: '#ff7a3a', power: 0.5, range: 1.6, radius: 0.12, clip });
    // the big pots on the loop, and the medium ones
    const pots = [];
    for (const p of plates) {
      if (p[0] > 5.6 && p[1] > NW + 0.4) continue;
      if (p[1] < NW + 0.4 && R.chance(0.85)) { const r = R.f(0.2, 0.26); prop(s, 'kitchen.pot', p[0], 0.912, p[1], R.f(0, 6), { r, h: R.f(0.36, 0.46) }); pots.push(p); }
      else if (p[1] > NW + 0.4 && R.chance(0.6)) prop(s, 'kitchen.pot', p[0], 0.912, p[1], R.f(0, 6), { r: R.f(0.13, 0.17), h: R.f(0.16, 0.24), metal: R.pick([STEEL, '#b5653a']) });
    }
    // the 65 degree loop: two lagged pipes along the wall, flow and return, banded in brass, with a tap over each big pot
    s.structure(() => {
      for (const pp of [[1.32, '#b0442c'], [1.52, '#2f6f8f']]) {
        g.mat('weave', '#ddd3be', { rough: 0.1 }); const pts = []; for (let x = X0 + 0.35; x <= RX1 + 2.1; x += 2) pts.push([Math.min(x, RX1 + 2.1), pp[0], NW + 0.12]); g.tube(pts, 0.055, { segs: 10 });
        g.mat('paint', pp[1]);
        for (let x = X0 + 1.0; x < RX1 + 2; x += 1.8) { g.push(); g.move(x, pp[0], NW + 0.12); g.rotZ(Math.PI / 2); g.cyl(0, -0.04, 0, 0.058, 0.08, { segs: 10 }); g.pop(); }
        g.mat('cast', '#b8863b', { rough: -0.2 }); for (let x = X0 + 0.6; x < RX1 + 2; x += 0.6) { g.push(); g.move(x, pp[0], NW + 0.12); g.rotZ(Math.PI / 2); g.cyl(0, -0.012, 0, 0.06, 0.024, { segs: 10 }); g.pop(); }
      }
      // the risers where the loop comes out of the wall and goes back
      g.mat('cast', '#b8863b'); for (const x of [X0 + 0.35, RX1 + 2.1]) g.tube([[x, 1.32, NW + 0.12], [x, 3.2, NW + 0.12]], 0.06, { segs: 10 });
    });
    for (const p of pots) {
      s.detail(() => {
        g.mat('cast', '#b8863b', { rough: -0.2 });
        g.tube([[p[0], 1.32, NW + 0.17], [p[0], 1.32, NW + 0.26], [p[0], 1.2, NW + 0.26], [p[0], 1.08, NW + 0.24]], 0.014, { segs: 6 });
        g.cyl(p[0], 1.24, NW + 0.26, 0.014, 0.06, { segs: 6 });
        g.mat('paint', '#b0442c'); g.push(); g.move(p[0], 1.3, NW + 0.26); g.rotX(Math.PI / 2); g.cyl(0, 0.0, 0, 0.04, 0.012, { segs: 10 }); g.pop();
      });
    }
    sign(s, SIGNS['kitchen.loop'], -1.6, 1.78, NW + 0.02, { face: 'Z' });
    sign(s, SIGNS['kitchen.hotplate'], 6.5, 2.02, NW + 1.155, { face: 'Z', w: 0.5, h: 0.16 });
    // the hood over the range, its light, its duct
    s.structure(() => {
      g.mat('brushed', '#b9b3a8', { rough: -0.05 });
      g.box(RX0 - 0.05, 2.15, NW, RX1 + 0.05, 2.62, NW + 1.15, { faces: 'xXyZ', bevel: 0.01 });
      g.mat('brushed', '#8d877e'); g.box(RX0 + 0.05, 2.14, NW + 0.05, RX1 - 0.05, 2.15, NW + 1.05, { faces: 'y' });
      g.mat('brushed', '#a9a39a'); g.box(-3.0, 2.62, NW, -1.2, H, NW + 0.8, { faces: 'xXZ' });
      g.mat('diffuser', '#fff1dc', { emissive: 3.2, lamp: true }); g.box(RX0 + 0.3, 2.13, NW + 0.75, RX1 - 0.3, 2.14, NW + 0.85, { faces: 'y' });
    });
    s.light({ at: [RX0 + 0.5, 2.05, NW + 0.8], to: [RX1 - 0.5, 2.05, NW + 0.8], type: 'tube', color: warm(4000), power: 5.5, range: 3.6, radius: 0.08, lamp: true, clip, shadow: true });
    // ladles and spoons from a rail on the hood's front
    s.detail(() => { g.mat('brushed', '#a9a39a'); g.tube([[-9.8, 2.08, NW + 1.2], [-4.5, 2.08, NW + 1.2]], 0.012, { segs: 6 }); });
    for (let x = -9.6, i = 0; x < -4.6; x += 0.32, i++) prop(s, 'kitchen.ladle', x, 2.08, NW + 1.2, 0, { len: R.f(0.28, 0.42), kind: i % 3 === 1 ? 'spoon' : 'ladle' });

    // ======================= the plating island =======================
    s.furniture(() => {
      g.mat('brushed', STEEL, { rough: 0.3 }); g.box(-8, 0.88, -30.6, 8, 0.92, -29.6, { bevel: 0.008 });
      g.mat('brushed', '#a9a39a'); for (const x of [-7.9, -4, 0, 4, 7.9]) for (const zz of [-30.52, -29.68]) g.box(x - 0.025, 0, zz - 0.025, x + 0.025, 0.88, zz + 0.025);
      g.mat('brushed', '#b3ada3'); g.box(-7.95, 0.22, -30.55, 7.95, 0.245, -29.65);
      g.mat('wood', '#b98a56', { rough: 0.05 }); for (const x of [-6.5, -1.2, 3.8]) g.box(x, 0.92, -30.4, x + 1.3, 0.955, -29.8, { bevel: 0.008 });
    });
    s.solid(-8, 0, -30.6, 8, 0.92, -29.6);
    // on and under the island: stacks of bowls and lids, crocks, a bowl of herbs, the day's tickets
    for (let x = -7.4; x < 7.6; x += 0.9) {
      const k = R.i(0, 4);
      if (k === 0) prop(s, 'hall.stack', x, 0.92, -30.1, 0, { n: R.i(6, 10), glaze: R.pick(GLAZES) });
      else if (k === 1) { for (let j = 0; j < 3; j++) prop(s, 'bowl', x - 0.2 + j * 0.2, 0.92, -29.85, R.f(0, 6), { glaze: R.pick(GLAZES) }); }
      else if (k === 2) prop(s, 'crock', x, 0.92, -30.15, 0, { glaze: R.pick(['#8a5a3c', '#3a4a7a', '#2f6c66', '#c9a24a']), h: 0.2, r: 0.08 });
      else if (k === 3) prop(s, 'bowl', x, 0.92, -30.2, 0, { glaze: '#e9e1cf', open: true, food: R.pick(['#7aa05a', '#c98f4e', '#e8d8b0']), r: 0.12 });
      prop(s, 'hall.stack', x + 0.2, 0.245, -30.1, 0, { n: R.i(4, 9), glaze: R.pick(GLAZES), r: 0.1 });
    }

    // ======================= the washing-up corner and the wall of numbered lids =======================
    s.furniture(() => {
      g.mat('brushed', STEEL, { rough: 0.3 }); g.box(WW, 0.86, -32.9, WW + 0.7, 0.92, -29.0, { bevel: 0.006 });
      g.mat('paint', '#3a5a6a'); g.box(WW, 0.08, -32.85, WW + 0.66, 0.86, -29.05, { faces: 'XzZ', aoBottom: 0.6 });
      g.mat('brushed', '#8d877e'); for (const zc of [-32.1, -31.2]) g.box(WW + 0.1, 0.55, zc - 0.38, WW + 0.6, 0.921, zc + 0.38, { faces: 'XxzZ' });
      g.mat('brushed', '#5c5852'); for (const zc of [-32.1, -31.2]) g.box(WW + 0.1, 0.55, zc - 0.38, WW + 0.6, 0.56, zc + 0.38, { faces: 'Y' });
      g.mat('plain', '#9fb8b8', { rough: -0.4 }); for (const zc of [-32.1, -31.2]) g.box(WW + 0.12, 0.72, zc - 0.36, WW + 0.58, 0.725, zc + 0.36, { faces: 'Y' });
      g.mat('cast', '#b8863b', { rough: -0.2 }); for (const zc of [-32.1, -31.2]) g.tube([[WW + 0.02, 1.15, zc], [WW + 0.2, 1.22, zc], [WW + 0.3, 1.1, zc]], 0.016, { segs: 6 });
      // a draining rack of lids standing on edge
      g.mat('brushed', '#a9a39a'); g.box(WW + 0.08, 0.92, -30.4, WW + 0.62, 0.96, -29.2);
    });
    s.solid(WW, 0, -32.9, WW + 0.7, 0.92, -29.0);
    for (let z = -30.3, i = 0; z < -29.3; z += 0.09, i++) {
      s.detail(() => { g.mat('glaze', GLAZES[i % GLAZES.length]); g.push(); g.move(WW + 0.35, 1.05, z); g.rotX(Math.PI / 2 - 0.15); g.lathe(0, 0, [[0.085, -0.01], [0.07, 0.01], [0.02, 0.025], [0, 0.026]], { segs: 12 }); g.pop(); });
    }
    // the lid wall: four rows of numbered lids on pegs over the sink, a gap for every lid out at the table
    s.structure(() => { g.mat('wood', '#5a3826'); g.box(WW, 1.3, -33.4, WW + 0.03, 2.95, -28.6, { bevel: 0.005 }); });
    s.detail(() => {
      for (let row = 0; row < 4; row++) for (let i = 0; i < 13; i++) {
        if ((row * 13 + i) % 5 === 3 || (row * 7 + i * 3) % 11 === 0) continue;
        const z = -33.15 + i * 0.37, y = 1.5 + row * 0.4;
        g.mat('glaze', GLAZES[(row + i * 2) % GLAZES.length]); g.push(); g.move(WW + 0.05, y, z); g.rotZ(-Math.PI / 2);
        g.lathe(0, 0, [[0.14, 0], [0.13, 0.02], [0.08, 0.045], [0.02, 0.055], [0.025, 0.075], [0, 0.078]], { segs: 14 }); g.pop();
        g.mat('paint', '#2a2622'); g.box(WW + 0.05, y - 0.09, z - 0.025, WW + 0.06, y - 0.07, z + 0.025);
      }
    });
    sign(s, { kind: 'notice', title: 'Lids out', lines: ['A lid not on its peg is at', 'the table. Count them back', 'in before you go home.'] }, WW + 0.04, 1.75, -28.25, { face: 'X' });
    // a dish trolley by the sinks, and the washer's apron on a hook
    prop(s, 'hall.trolley', -11.6, 0, -33.0, 0, { wood: '#8a6240' });
    for (let k = 0; k < 3; k++) prop(s, 'hall.stack', -11.9 + k * 0.3, 0.885, -33.0, 0, { n: R.i(6, 11), glaze: R.pick(GLAZES) });
    for (let k = 0; k < 3; k++) prop(s, 'hall.stack', -11.9 + k * 0.3, 0.325, -33.0, 0, { n: R.i(4, 8), glaze: '#e9e1cf', r: 0.11 });

    // ======================= the east end: noodles, sacks, crocks, knives, herbs =======================
    // the noodle bench: a thick wooden top white with flour, a dough log, pulled noodles hanging to dry
    s.furniture(() => {
      g.mat('wood', '#c79c62', { rough: -0.05 }); g.box(10.6, 0.84, -31.6, 12.6, 0.92, -30.4, { bevel: 0.015 });
      g.mat('wood', '#6b4a2f'); for (const x of [10.7, 12.5]) for (const zz of [-31.5, -30.5]) g.box(x - 0.04, 0, zz - 0.04, x + 0.04, 0.84, zz + 0.04, { bevel: 0.006, aoBottom: 0.6 });
      g.box(10.7, 0.18, -31.5, 12.5, 0.21, -30.5);
      g.mat('plain', '#f4efe2', { rough: 0.3 }); g.box(10.75, 0.92, -31.45, 12.0, 0.923, -30.55, { faces: 'Y' });
      g.mat('plain', '#efe4c8', { rough: 0.15 }); g.ball(11.0, 0.98, -31.0, 0.1, 0.06, 0.1, { segs: 10, rings: 6 }); g.ball(11.25, 0.97, -30.8, 0.08, 0.05, 0.08, { segs: 10, rings: 6 });
      g.push(); g.move(11.7, 0.96, -31.0); g.rotZ(Math.PI / 2); g.cyl(0, -0.25, 0, 0.045, 0.5, { segs: 10 }); g.pop();
      g.mat('brushed', '#cfcac2'); g.box(12.2, 0.92, -31.2, 12.32, 0.99, -31.19);
      // the drying rack
      g.mat('wood', '#6b4a2f'); for (const zz of [-31.55, -30.45]) g.tube([[12.55, 0.92, zz], [12.55, 1.55, zz]], 0.015, { segs: 5 });
      g.tube([[12.55, 1.55, -31.55], [12.55, 1.55, -30.45]], 0.012, { segs: 5 });
      g.mat('plain', '#efe2c0', { rough: 0.2 }); for (let z = -31.45; z < -30.5; z += 0.035) g.tube([[12.5, 1.55, z], [12.48, 1.15 + 0.08 * Math.sin(z * 37), z + 0.01], [12.56, 1.0 + 0.06 * Math.cos(z * 23), z + 0.005]], 0.003, { segs: 3, caps: false });
    });
    s.solid(10.6, 0, -31.6, 12.6, 0.92, -30.4);
    // sacks of Mill flour and rice under the bench and against the wall
    const SACKS = [[13.25, -31.9, '#d8ccb0', '#8c2c26'], [13.3, -31.35, '#e2d8c2', '#2f6f8f'], [13.2, -30.85, '#d8ccb0', '#8c2c26'], [11.2, -30.95, '#e2d8c2', '#2f6f8f'], [11.9, -31.05, '#d8ccb0', '#8c2c26']];
    for (const k of SACKS) prop(s, 'kitchen.sack', k[0], 0, k[1], R.f(0, 6), { col: k[2], band: k[3] }, k[0] < 13 ? { scale: 0.8, noCollide: true } : {});
    sign(s, { kind: 'label', text: 'MILL FLOUR', sub: 'Ring 2 · 25 kg' }, 13.0, 0.36, -31.9, { face: 'x', w: 0.3, h: 0.12, board: false });
    sign(s, { kind: 'label', text: 'MILL RICE', sub: 'waxy · 25 kg' }, 13.04, 0.36, -31.35, { face: 'x', w: 0.3, h: 0.12, board: false });
    // shelves of crocks on the east wall
    for (const zc of [-29.0, -30.2]) {
      prop(s, 'shelving', EW - 0.17, 0, zc, -Math.PI / 2, { w: 1.15, h: 2.1, d: 0.32, shelves: 4, wood: '#6b4a2f' });
      for (let sh = 0; sh < 4; sh++) for (let k = 0; k < 4; k++) {
        const y = 0.105 + sh * (2.1 - 0.11) / 4, z = zc - 0.42 + k * 0.28;
        if (R.chance(0.82)) prop(s, 'crock', EW - 0.18, y, z, R.f(0, 6), { glaze: R.pick(['#8a5a3c', '#3a4a7a', '#2f6c66', '#c9a24a', '#b5653a', '#e9e1cf']), h: R.f(0.18, 0.3), r: R.f(0.07, 0.1) });
      }
    }
    // the cold store door, on the east wall
    door(s, { x: 13.7, y: 0, z: -33.4, w: 1.1, h: 2.05, along: 'z', dir: 1, kind: 'hinge', style: 'plain', tint: '#b9b3a8', mat: 'brushed', locked: true, lockedText: 'The cold store. Kitchen only.', label: 'the cold store' });
    // a short prep counter and the knife strip on the north wall at the east end
    s.furniture(() => {
      g.mat('paint', ENAMEL); g.box(8.1, 0.08, NW, 10.3, 0.86, NW + 0.6, { faces: 'xXZ', aoBottom: 0.6 });
      g.mat('wood', '#b98a56', { rough: 0.05 }); g.box(8.05, 0.86, NW, 10.35, 0.92, NW + 0.64, { bevel: 0.01 });
      g.mat('wood', '#3a2a1e'); g.box(8.3, 1.5, NW, 9.9, 1.56, NW + 0.03, { bevel: 0.005 });
    });
    s.solid(8.05, 0, NW, 10.35, 0.92, NW + 0.64);
    for (let x = 8.45, i = 0; x < 9.85; x += 0.14, i++) prop(s, 'kitchen.knife', x, 1.5, NW + 0.04, 0, { len: [0.2, 0.26, 0.16, 0.22, 0.3, 0.18][i % 6], handle: ['#3a2a1e', '#6b4a2f', '#2a2a2a'][i % 3] });
    prop(s, 'crock', 8.4, 0.92, NW + 0.3, 0, { glaze: '#3a4a7a', h: 0.26, r: 0.09 });
    prop(s, 'bowl', 9.0, 0.92, NW + 0.35, 0, { glaze: '#e9e1cf', open: true, food: '#7aa05a', r: 0.13 });
    // herbs under the grow-lamp: two shelves of pots on the north wall
    s.structure(() => {
      g.mat('wood', '#6b4a2f'); for (const y of [1.1, 1.75]) g.box(10.6, y, NW, 13.55, y + 0.035, NW + 0.34, { bevel: 0.006 });
      for (const x of [10.7, 13.45]) g.box(x - 0.02, 1.0, NW, x + 0.02, 1.1, NW + 0.3);
      g.mat('brushed', '#5c5852'); g.box(10.7, 2.38, NW + 0.1, 13.45, 2.42, NW + 0.32, { bevel: 0.006 });
      g.mat('diffuser', '#ffd2f4', { emissive: 5, lamp: false }); g.box(10.75, 2.375, NW + 0.15, 13.4, 2.38, NW + 0.27, { faces: 'y' });
    });
    for (const y of [1.135, 1.785]) for (let x = 10.85; x < 13.4; x += R.f(0.28, 0.36)) prop(s, 'hall.herbpot', x, y, NW + 0.17, R.f(0, 6), { seed: R.i(1, 9), pot: R.pick(['#b4643e', '#a9573a', '#c47a4e', '#2f6c66']), leaf: R.pick(['#cfe8a0', '#b8d890', '#e0f0b0', '#a8d080']) });
    s.light({ at: [10.9, 2.3, NW + 0.3], to: [13.3, 2.3, NW + 0.3], type: 'tube', color: '#ffd6f2', power: 2.6, range: 2.6, radius: 0.06, clip });

    // ======================= the ceiling: ducts, cable tray, lights =======================
    s.structure(() => {
      g.mat('brushed', '#b0aaa0'); const d = []; for (let x = -12.5; x <= 12.5; x += 2.5) d.push([x, 2.95, -32.6]); g.tube(d, 0.2, { segs: 12 });
      g.mat('brushed', '#9a948b'); for (let x = -12.5; x <= 12.5; x += 1.25) { g.push(); g.move(x, 2.95, -32.6); g.rotZ(Math.PI / 2); g.cyl(0, -0.02, 0, 0.215, 0.04, { segs: 12 }); g.pop(); }
      g.mat('brushed', '#8d877e'); g.box(-12.5, 3.02, -33.55, 12.5, 3.05, -33.3, { faces: 'yxXzZ' });
      g.mat('cast', '#2f6c66'); const p2 = []; for (let x = -13.5; x <= 13.5; x += 3) p2.push([x, 3.07, -28.6]); g.tube(p2, 0.025, { segs: 6 });
    });
    for (const x of [-6, 0, 6]) lamp(s, 'panel', x, H, -30.1, { w: 1.8, d: 0.5, K: 4200, power: 1.7, clip });
    lamp(s, 'panel', -12.2, H, -31.0, { w: 1.0, d: 0.5, K: 4000, power: 1.3, clip });
    lamp(s, 'panel', 11.6, H, -31.0, { w: 1.0, d: 0.5, K: 4000, power: 1.3, clip });
    roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#fff4e4', ground: '#e2d2bc', power: 0.42 });
    // and some of it spills out into the hall through the pass
    s.ambient({ box: [-11, 0, -27.5, 11, 2.7, -24.5], sky: '#fff0dc', ground: '#c9a57c', power: 0.18, lamp: true, soft: 1.5 });

    // ======================= people =======================
    s.spot('counter', 0, 0, -28.85, 0, { tags: ['kitchen', 'pass'], who: 'marit' });
    const WORK = [
      [-8.0, -32.45, Math.PI, 'cook', 'rhos'], [-3.0, -32.45, Math.PI, 'cook'], [2.0, -32.45, Math.PI, 'cook'], [6.5, -32.45, Math.PI, 'cook'],
      [-6.0, -28.85, 0, 'plate'], [3.5, -28.85, 0, 'plate'], [-2.0, -31.15, 0, 'plate'],
      [-12.55, -31.6, -Math.PI / 2, 'wash', 'clem'], [-12.55, -30.0, -Math.PI / 2, 'wash'],
      [11.4, -32.05, 0, 'pull-noodles'], [11.6, -29.95, Math.PI, 'pull-noodles'],
      [12.0, -32.85, Math.PI, 'herbs'],
    ];
    for (const w of WORK) s.spot('work', w[0], 0, w[1], w[2], Object.assign({ tags: ['kitchen', w[3]] }, w[4] ? { who: w[4] } : {}));
    s.path([[-11.95, -28.8], [-8, -28.8], [-4, -28.8], [0, -28.8], [4, -28.8], [8, -28.8], [9.3, -28.8], [11.95, -28.8]]);
    s.path([[-11.95, -28.8], [-11.95, -30.8], [-11.95, -32.1], [-8, -32.1], [-4, -32.1], [0, -32.1], [4, -32.1], [8, -32.1], [9.3, -32.1], [9.3, -30.8], [9.3, -28.8]]);

    // ======================= things to do =======================
    const find = (id) => { if (game.journal && game.journal.find) game.journal.find(id); };
    const say = async (who, lines) => { if (game.ui) { game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } } };
    s.interact({
      x: -1.6, y: 1.7, z: NW + 0.1, radius: 1.5, prompt: 'Read the plate on the loop',
      async onUse() { await say('A brass plate', ['Loop. 65 degrees. Hold here, sear there.', 'The pipe is warm right along its length. Everything on this side of the kitchen is held on the food plant\'s spare heat, and costs nothing to keep hot.']); find('waste-heat'); },
    });
    s.interact({
      x: -3.0, y: 1.25, z: NW + 0.3, radius: 1.3, prompt: 'Lift a pot lid',
      async onUse(gm) {
        if (gm.audio) gm.sfxAt('lid-up', f, -3, 1.3, NW + 0.3);
        const d = gm.clock.day;
        const t = d === 1 ? ['Broth, gold and slow, rich with gelatin from the vats. No bone has ever been near it. It has been on the loop since yesterday.', 'The tap above it ticks as the pipe warms.'] : d === 2 ? ['Jook, barely moving. On the Quiet the kitchen cooks small. Tomorrow\'s feast has been growing for six weeks.'] : ['Stock for the gravy, and under the next lid, butter going soft with the herb pot\'s cuttings beaten through it.'];
        await say('The range', t);
        if (gm.audio) gm.sfxAt('lid-down', f, -3, 1.3, NW + 0.3);
      },
    });
    s.interact({
      x: 6.6, y: 1.05, z: NW + 0.6, radius: 1.2, prompt: 'Look at the searing plate',
      async onUse() { await say('The hotplate', ['The only plate in the kitchen that draws real power, and the label says be quick.', 'Holding is free on the loop. Searing is what you pay for.']); },
    });
    s.interact({
      x: 11.6, y: 1.0, z: -31.0, radius: 1.4, prompt: (gm) => (gm.clock.day === 1 ? 'Try pulling a noodle' : 'Look at the noodle bench'),
      async onUse(gm) {
        if (gm.clock.day === 1) {
          if (gm.audio) gm.sfxAt('cutlery', f, 11.6, 1.0, -31.0, { vol: 0.5 });
          await say('The noodle bench', ['You fold and stretch, fold and stretch. The dough goes long, then thin, then breaks in the middle.', 'Clem, passing with a tray of lids: one per bowl, the woman in Dulse does. Marit does about one per pot.']);
        } else await say('The noodle bench', ['Flour in the grain of the wood, and a rack of last Thursday\'s offcuts drying for soup.']);
      },
    });
    s.interact({
      x: -13.2, y: 1.0, z: -31.6, radius: 1.3, prompt: 'Wash a lid',
      async onUse(gm) {
        if (gm.audio) { gm.sfxAt('pour', f, -13.2, 1.0, -31.6, { vol: 0.5 }); gm.sfxAt('plate', f, -13.2, 1.0, -31.6, { delay: 0.8, vol: 0.4 }); }
        gm.flags.lidsWashed = (gm.flags.lidsWashed || 0) + 1;
        const n = gm.flags.lidsWashed;
        if (gm.ui) gm.ui.toast(n === 1 ? 'One lid washed. Clem says that leaves three hundred and ninety-nine.' : n + ' lids washed. Clem calls it the quiet part.', { kind: 'info' });
      },
    });
    s.interact({
      x: WW + 0.1, y: 2.1, z: -31.0, radius: 1.8, prompt: 'Look at the wall of lids',
      async onUse() { await say('The wall of lids', ['Four hundred lids, each with a number punched in its rim, and the gaps are lids out at the table.', 'Some of the numbers are older than anyone in the kitchen.']); },
    });
    // the feast tickets: the vat lines' slips for the Booking Day steaks, clipped by the cold store
    sign(s, { kind: 'notice', title: 'Feast lines', lines: ['Steaks: vat line 4, started', 'six weeks ago, in Thursday.', 'Butter: churned Tuesday.', 'Cheese: down since last year.', 'Apples: Teodor. Do not touch.'], hand: true }, EW - 0.02, 1.55, -31.9 + 0.0, { face: 'x' });
    s.interact({
      x: EW - 0.1, y: 1.55, z: -31.9, radius: 1.3, prompt: 'Read the feast lines',
      async onUse() { await say('Feast lines', ['Steaks started in their vat line six weeks ago, butter churned on Tuesday, cheese put down before last Booking Day.', 'Rhoswen has written underneath: grown slow so the drum does not warm up. Cook quick on the day.']); find('feast-grown'); },
    });

    // ======================= zone and sound =======================
    s.zoneBox({ id: 'kitchen', place: 'kitchen', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The hall kitchen', sub: "Marit Vell's Hall", ambience: 'hall', reverb: 'room', headroom: 2.9, env: { exposure: 0.95, autoKey: 0.17, warmth: 0.2 } });
    let steam = null;
    game.events.on('zone', (e) => {
      if (steam || !game.audio || !e || !e.zone || e.zone.place !== 'kitchen') return;
      steam = [game.loopAt('steam', f, -3, 1.4, NW + 0.4, { vol: 0.35, radius: 3 }), game.loopAt('sizzle', f, 6.6, 1.0, NW + 0.6, { vol: 0.15, radius: 1.5 })];
    });

    s.finish();
    game.spawns.kitchen = { frame: f, x: 0, y: 0, z: -31.2, yaw: Math.PI };
  },
};
