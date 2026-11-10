// Marit Vell's Hall, the Ring 2 hall: one room 124 m long under a felt-hung vault, one table down the middle of it,
// four hundred seats, and the open kitchen (hall_kitchen.js) behind a long pass at the middle of the north wall.
// The picture this place exists for is the view down the table: the floor, the table and the line of lamps over it
// all rise with the drum toward both ends. Everything here is built to keep that view clear and to make it read.
// Also built here: the two passages from Ladle Row to the hall's end doors.
import { floor, ceiling, wall, lamp, roomGlow, warm } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop, defineProp, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door, doorFrame } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { MENUS } from '../content/menus.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';

// ---------- the plan ----------
const H = 7.2;                       // the room is two decks tall
const ZN = -27.2, ZS = -14.3;        // inner faces of the north and south walls
const ZC = -20.75;                   // the table's axis
const XE = 61.7;                     // inner faces of the end walls (x = +-61.7)
const SPRING = 5.0, APEX = 7.05;     // the vault springs from the cornice and rises to the crown
const PIERS = []; for (let x = -59.5; x < 60; x += 7) PIERS.push(x);          // pilasters and vault ribs, every 7 m
const RIBS = [-XE + 0.18].concat(PIERS, [XE - 0.18]);
const SEGS = [[-59.5, -13.5], [-12.5, 12.5], [13.5, 59.5]];                     // the table, with two crossings for the servers
const ARCH = [[-27.7, -24.9], [-24.1, -17.9], [-17.1, -10.9], [-10.1, -3.9], [-3.1, 3.1], [3.9, 10.1], [10.9, 17.1], [17.9, 24.1], [24.9, 27.7]];
const PASS = [[-10.15, -3.85], [-3.15, 3.15], [3.85, 10.15]];
const KDOOR = [[-12.6, -11.3], [11.3, 12.6]];
const DOOR_W = 1.8, DOOR_H = 2.5;    // the end doors, on the table's axis
const CLIP = [-62.05, -0.3, -27.55, 62.05, H + 0.1, -13.6];

// palette: warm plaster, dark oiled wood, honey boards, madder and indigo felt, saffron for the accents
const C = {
  plaster: '#d6b98c', plasterDk: '#c7a678', wood: '#4b2f1f', honey: '#a6744a', top: '#8a5a36',
  madder: '#8c2c26', indigo: '#283062', saffron: '#d1952c', teal: '#2f6c66', green: '#3c5a3e', brass: '#b8863b',
};
const GLAZES = ['#e9e1cf', '#a9c6b0', '#d4a24a', '#3a4a7a', '#b5653a', '#8fb3c4', '#c9a0a0'];

// ---------- the vault ----------
const HS = (ZS - ZN) / 2, RISE = APEX - SPRING, VR = (HS * HS + RISE * RISE) / (2 * RISE), VCY = APEX - VR, TH = Math.asin(HS / VR);
// a point on the vault's inner surface, t from 0 (north) to 1 (south), pulled in toward the room by `off`
function vp(t, off = 0) { const a = -TH + 2 * TH * t; const s = Math.sin(a), c = Math.cos(a); return [ZC + (VR - off) * s, VCY + (VR - off) * c]; }

// ---------- props of the hall ----------
// A herb pot for the middle of the table: terracotta, a saucer, a tuft of cut-and-come-again herbs.
defineProp('hall.herbpot', (g, p) => {
  const r = new Rng(p.seed || 1);
  g.mat('glaze', p.pot || '#b4643e', { rough: 0.15 });
  g.lathe(0, 0, [[0, 0], [0.06, 0], [0.065, 0.01], [0.08, 0.1], [0.088, 0.11], [0.088, 0.125], [0.078, 0.125], [0.074, 0.11]], { segs: 12, capTop: false });
  g.mat('glaze', '#9a5534'); g.lathe(0, 0, [[0, 0.0], [0.1, 0.0], [0.1, 0.012], [0.09, 0.012]], { segs: 12, capTop: false });
  g.mat('soil', '#ffffff'); g.cyl(0, 0.1, 0, 0.074, 0.008, { segs: 10 });
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2 + r.f(-0.3, 0.3);
    g.mat(i % 2 ? 'leafB' : 'leafA', mixHex('#ffffff', p.leaf || '#cfe8a0', r.f(0, 0.8)), { sway: 0.4 });
    g.card(Math.cos(a) * 0.025, 0.1, Math.sin(a) * 0.025, r.f(0.13, 0.19), r.f(0.16, 0.24), a + Math.PI / 2, { tilt: r.f(0.15, 0.4) });
  }
  return { tier: 's', cast: false };
});

// A water jug with a lid, a pinched spout and a handle.
defineProp('hall.jug', (g, p) => {
  const c = p.glaze || '#e9e1cf';
  g.mat('glaze', c, { rough: -0.1 });
  g.lathe(0, 0, [[0, 0], [0.055, 0], [0.062, 0.01], [0.075, 0.08], [0.07, 0.16], [0.052, 0.21], [0.056, 0.235], [0.05, 0.235], [0.046, 0.215]], { segs: 14, capTop: false });
  g.mat('glaze', p.lid || shadeHex(c, 0.75)); g.lathe(0, 0, [[0.058, 0.232], [0.04, 0.25], [0.012, 0.255], [0.014, 0.27], [0, 0.272]], { segs: 12, capBottom: false, capTop: false });
  g.mat('glaze', c); g.tube([[-0.07, 0.19, 0], [-0.115, 0.17, 0], [-0.12, 0.1, 0], [-0.075, 0.06, 0]], 0.011, { segs: 5 });
  g.box(0.045, 0.21, -0.018, 0.085, 0.232, 0.018, { bevel: 0.006 });
  return { tier: 's', cast: false };
});

// A big lidded tureen for the shared dishes, with two lug handles.
defineProp('hall.tureen', (g, p) => {
  const c = p.glaze || '#b5653a', r = p.r || 0.15;
  g.mat('glaze', c, { rough: -0.08 });
  g.lathe(0, 0, [[0, 0], [r * 0.55, 0], [r * 0.6, 0.012], [r * 0.95, r * 0.45], [r, r * 0.7], [r * 0.97, r * 0.74], [r * 0.9, r * 0.6]], { segs: 18, capTop: false });
  g.mat('glaze', p.lid || shadeHex(c, 1.2)); g.lathe(0, 0, [[r * 1.0, r * 0.72], [r * 0.95, r * 0.8], [r * 0.6, r * 1.02], [r * 0.18, r * 1.1], [r * 0.14, r * 1.16], [r * 0.24, r * 1.26], [r * 0.12, r * 1.32], [0, r * 1.33]], { segs: 18, capBottom: false, capTop: false });
  g.mat('glaze', c); for (const s of [-1, 1]) g.box(s * r * 0.98 - 0.025, r * 0.52, -0.035, s * r * 0.98 + 0.025, r * 0.62, 0.035, { bevel: 0.01 });
  return { tier: 's', cast: false };
});

// The Nine: a small deep-blue lidded pot with a bone spoon resting in a notch.
defineProp('hall.nine', (g) => {
  g.mat('glaze', '#24366b', { rough: -0.15 });
  g.lathe(0, 0, [[0, 0], [0.035, 0], [0.045, 0.012], [0.05, 0.045], [0.046, 0.058], [0.042, 0.052]], { segs: 12, capTop: false });
  g.mat('glaze', '#e6c46a'); g.lathe(0, 0, [[0.05, 0.056], [0.045, 0.064], [0.012, 0.072], [0.012, 0.082], [0, 0.084]], { segs: 12, capBottom: false, capTop: false });
  g.mat('wood', '#e8dcc4'); g.tube([[0.02, 0.07, 0.0], [0.07, 0.05, 0.03], [0.09, 0.012, 0.045]], 0.0045, { segs: 4 });
  return { cast: false };
});

// One lamp of the long line: a drop rod from the rail, a wide coolie shade, a glowing underside.
defineProp('hall.pendant', (g, p) => {
  g.mat('cast', '#3d332a'); g.tube([[0, 0, 0], [0, -0.44, 0]], 0.008, { segs: 5, caps: false });
  g.cyl(0, -0.47, 0, 0.03, 0.04, { segs: 8 });
  g.mat(p.enamel ? 'paint' : 'cast', p.shade || '#b8863b', { rough: p.enamel ? -0.2 : 0 });
  g.lathe(0, 0, [[0.235, -0.64], [0.24, -0.625], [0.2, -0.57], [0.11, -0.5], [0.045, -0.465], [0.03, -0.45]], { segs: 18, capBottom: false });
  g.mat('diffuser', '#ffd8a0', { emissive: 3, lamp: true });
  g.lathe(0, 0, [[0.225, -0.632], [0.0, -0.6]], { segs: 18, capBottom: false, capTop: false });
  g.mat('diffuser', '#fff0d0', { emissive: 9, lamp: true }); g.ball(0, -0.63, 0, 0.065, 0.06, 0.065, { segs: 10, rings: 6 });
  return { tier: 's', cast: false };
});

// A two-shelf serving trolley, steel frame, wooden shelves, with whatever is on it left to the caller.
defineProp('hall.trolley', (g, p) => {
  const w = 0.9, d = 0.5;
  g.mat('brushed', '#a9a39a');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * (w / 2 - 0.02), 0.08, sz * (d / 2 - 0.02)], [sx * (w / 2 - 0.02), 0.9, sz * (d / 2 - 0.02)]], 0.012, { segs: 6 });
  g.tube([[-w / 2 - 0.02, 0.9, -d / 2 + 0.02], [-w / 2 - 0.06, 0.95, -d / 2 + 0.02], [-w / 2 - 0.06, 0.95, d / 2 - 0.02], [-w / 2 - 0.02, 0.9, d / 2 - 0.02]], 0.012, { segs: 6 });
  g.mat('wood', p.wood || '#7a5233'); g.box(-w / 2, 0.86, -d / 2, w / 2, 0.885, d / 2, { bevel: 0.006 }); g.box(-w / 2, 0.3, -d / 2, w / 2, 0.325, d / 2, { bevel: 0.006 });
  g.mat('speckle', '#2a2624'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.ball(sx * (w / 2 - 0.02), 0.04, sz * (d / 2 - 0.02), 0.04, 0.04, 0.015, { segs: 8, rings: 5 });
  return { solid: [[-w / 2 - 0.06, 0, -d / 2, w / 2, 0.95, d / 2]], tier: 's' };
});

// A plain dining chair for the long table, cheaper than the bentwood exemplar: square legs, a seat, a back of rails or slats.
// p: { wood, seat (colour of the seat pad), back: 'rail' | 'slat' | 'ladder' }
defineProp('hall.chair', (g, p) => {
  const wood = p.wood || '#6b4a2f';
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) {
    g.box(sx * 0.19 - 0.02, 0, 0.15, sx * 0.19 + 0.02, 0.44, 0.19, { bevel: 0.005 });
    g.box(sx * 0.19 - 0.02, 0, -0.21, sx * 0.19 + 0.02, 0.95, -0.17, { bevel: 0.005 });
  }
  g.box(-0.19, 0.14, -0.2, 0.19, 0.17, -0.18); g.box(-0.19, 0.14, 0.16, 0.19, 0.17, 0.18);
  g.box(-0.22, 0.42, -0.22, 0.22, 0.45, 0.2, { bevel: 0.01 });
  if (p.back === 'slat') { for (let i = 0; i < 4; i++) g.box(-0.12 + i * 0.08 - 0.018, 0.5, -0.2, -0.12 + i * 0.08 + 0.018, 0.9, -0.185); g.box(-0.19, 0.86, -0.21, 0.19, 0.94, -0.175, { bevel: 0.008 }); }
  else if (p.back === 'ladder') { for (const y of [0.58, 0.7, 0.82, 0.92]) g.box(-0.19, y - 0.025, -0.205, 0.19, y + 0.025, -0.18, { bevel: 0.006 }); }
  else { g.box(-0.19, 0.78, -0.21, 0.19, 0.93, -0.17, { bevel: 0.01 }); g.box(-0.19, 0.58, -0.205, 0.19, 0.62, -0.18); }
  if (p.seat) { g.mat('felt', p.seat); g.box(-0.2, 0.45, -0.19, 0.2, 0.475, 0.18, { bevel: 0.012 }); }
  return { posts: [[0, 0, 0.21, 0, 0.47]], tier: 's' };
});

// An A-frame step ladder, paint-spotted.
defineProp('hall.ladder', (g, p) => {
  const h = p.h || 2.6, spread = 0.55;
  g.mat('wood', p.wood || '#b08a58', { rough: 0.1 });
  for (const sx of [-1, 1]) {
    g.box(sx * 0.24 - 0.025, 0, -spread - 0.025, sx * 0.24 + 0.025, 0.06, -spread + 0.025);
    g.tube([[sx * 0.26, 0, -spread], [sx * 0.2, h, -0.02]], 0.022, { segs: 5 });
    g.tube([[sx * 0.26, 0, spread], [sx * 0.2, h, 0.02]], 0.02, { segs: 5 });
  }
  const n = Math.round(h / 0.3);
  for (let i = 1; i < n; i++) { const t = i / n, z = -spread * (1 - t), y = h * t; g.box(-0.24 + t * 0.04, y - 0.015, z - 0.06, 0.24 - t * 0.04, y + 0.015, z + 0.06, { bevel: 0.005 }); }
  g.box(-0.24, h - 0.02, -0.12, 0.24, h + 0.03, 0.12, { bevel: 0.01 });
  g.mat('paint', '#e9dfc9'); g.box(-0.1, h * 0.4, -spread * 0.6 - 0.02, -0.05, h * 0.4 + 0.004, -spread * 0.6 + 0.04);
  return { solid: [[-0.3, 0, -spread, 0.3, h, spread]], tier: 's' };
});

// A coat on a hook: shoulders, a hanging body with a mended patch, a collar. p: { col, patch, len }
defineProp('hall.coat', (g, p) => {
  const col = p.col || '#6e7f3a', len = p.len || 0.95;
  g.mat('cast', '#7a6a50'); g.tube([[0, 0, -0.03], [0, 0, 0.04], [0, 0.04, 0.06]], 0.006, { segs: 4 });
  // the body: a turned bell flattened front to back, hanging from the collar; sleeves hanging at its sides
  g.mat('weave', col);
  g.push(); g.move(0, 0, 0.09); g.scale(1, 1, 0.42);
  g.lathe(0, 0, [[0.2, -0.09 - len], [0.205, -0.09 - len * 0.6], [0.18, -0.2], [0.15, -0.1], [0.06, -0.05], [0.0, -0.04]], { segs: 10 });
  g.pop();
  for (const s of [-1, 1]) g.tube([[s * 0.16, -0.12, 0.09], [s * 0.2, -0.35, 0.1], [s * 0.19, -0.66, 0.12]], [0.05, 0.045, 0.04], { segs: 6 });
  g.mat('weave', p.lining || shadeHex(col, 0.7)); g.tube([[-0.07, -0.06, 0.13], [0, -0.09, 0.17], [0.07, -0.06, 0.13]], 0.025, { segs: 5 });
  if (p.patch) { g.mat('knit', p.patch); g.box(0.06, -0.55, 0.165, 0.15, -0.45, 0.176); }
  return { cast: false };
});

// A volunteer's apron on its peg, ties hanging.
defineProp('hall.apron', (g, p) => {
  g.mat('wood', '#5b3a26'); g.cyl(0, 0, 0, 0.018, 0.06, { segs: 6 }); g.push(); g.rotX(Math.PI / 2); g.cyl(0, -0.01, 0, 0.016, 0.07, { segs: 6 }); g.pop();
  g.mat('weave', p.col || '#ece4d0');
  g.sheet([-0.13, -0.02, 0.06], [0.13, -0.02, 0.06], [0.24, -0.82, 0.06], [-0.24, -0.82, 0.06], { nu: 4, nv: 4, ripple: 0.015, rippleN: 4 });
  g.mat('weave', p.tie || '#c9552e'); g.tube([[-0.12, -0.3, 0.065], [-0.17, -0.55, 0.07], [-0.15, -0.72, 0.07]], 0.008, { segs: 4 }); g.tube([[0.12, -0.3, 0.065], [0.15, -0.6, 0.07]], 0.008, { segs: 4 });
  g.box(-0.1, -0.5, 0.062, 0.1, -0.36, 0.07);
  return { cast: false };
});

// A plate rack on brackets with plates standing on edge. p: { w, n }
defineProp('hall.platerack', (g, p) => {
  const w = p.w || 1.6, n = p.n || 10, r = new Rng(p.seed || 3);
  g.mat('wood', p.wood || '#5b3a26'); g.box(-w / 2, 0, -0.12, w / 2, 0.03, 0.12, { bevel: 0.006 }); g.box(-w / 2, 0.1, 0.1, w / 2, 0.125, 0.12, { bevel: 0.004 });
  for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.1) - 0.015, -0.18, -0.12, sx * (w / 2 - 0.1) + 0.015, 0, -0.08);
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.12 + i * (w - 0.24) / Math.max(1, n - 1);
    g.mat('glaze', r.pick(GLAZES)); g.push(); g.move(x, 0.13, -0.02); g.rotZ(Math.PI / 2); g.rotX(0.15);
    g.lathe(0, 0, [[0, -0.008], [0.08, -0.008], [0.12, 0.004], [0.115, 0.009], [0.07, 0.0], [0, 0.0]], { segs: 14 }); g.pop();
  }
  return { cast: false };
});

// A stack of lids or nested bowls: one turned shape with ridges, cheap enough to put everywhere. p: { n, glaze, r }
defineProp('hall.stack', (g, p) => {
  const n = p.n || 6, r = p.r || 0.085, c = p.glaze || '#e9e1cf';
  const prof = [[r * 0.5, 0]];
  for (let i = 0; i < n; i++) { prof.push([r, i * 0.03 + 0.012]); prof.push([r * 0.94, i * 0.03 + 0.03]); }
  prof.push([r * 0.6, n * 0.03 + 0.008]); prof.push([0, n * 0.03 + 0.01]);
  g.mat('glaze', c); g.lathe(0, 0, prof, { segs: 12 });
  return { cast: false };
});

// The place-setting pieces, lighter than the shared exemplars because there are hundreds of them on one table.
defineProp('hall.setbowl', (g, p) => {
  const r = 0.08, c = p.glaze || '#e9e1cf';
  g.mat('glaze', c); g.lathe(0, 0, [[0, 0], [r * 0.55, 0], [r * 0.95, r * 0.5], [r, r * 0.72], [r * 0.9, r * 0.72]], { segs: 12, capTop: false });
  g.mat('glaze', p.lid || c); g.lathe(0, 0, [[r * 1.0, r * 0.72], [r * 0.62, r * 1.04], [r * 0.15, r * 1.14], [r * 0.2, r * 1.3], [0, r * 1.34]], { segs: 12, capBottom: false, capTop: false });
  return { cast: false };
});
defineProp('hall.setcup', (g, p) => {
  const c = p.glaze || '#d9cfb8';
  g.mat('glaze', c); g.lathe(0, 0, [[0, 0], [0.03, 0], [0.04, 0.08], [0.035, 0.08]], { segs: 10, capTop: false });
  g.mat('glaze', p.lid || shadeHex(c, 0.8)); g.lathe(0, 0, [[0.043, 0.08], [0.012, 0.098], [0.012, 0.108], [0, 0.11]], { segs: 10, capBottom: false, capTop: false });
  return { cast: false };
});
defineProp('hall.setplate', (g, p) => {
  g.mat('glaze', p.glaze || '#ece5d6'); g.lathe(0, 0, [[0, 0], [0.075, 0], [0.12, 0.014], [0.115, 0.018], [0, 0.007]], { segs: 14 });
  return { cast: false };
});

// The lamp at each end of the room: a great round opal lamp with brass spokes, the bright thing at the end of the long view.
defineProp('hall.rose', (g, p) => {
  const R = p.r || 0.75;
  g.push(); g.rotX(Math.PI / 2);
  g.mat('diffuser', '#ffe2b0', { emissive: 5, lamp: true }); g.lathe(0, 0, [[R, 0.0], [R * 0.6, 0.015], [0, 0.02]], { segs: 32, capBottom: false, capTop: false });
  g.mat('cast', p.metal || '#b8863b', { rough: -0.15 }); g.lathe(0, 0, [[R, -0.06], [R + 0.07, -0.05], [R + 0.08, 0.03], [R, 0.05], [R - 0.03, 0.03]], { segs: 32 });
  g.lathe(0, 0, [[0.12, -0.02], [0.14, 0.05], [0.0, 0.07]], { segs: 16 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.tube([[Math.cos(a) * 0.13, 0.035, Math.sin(a) * 0.13], [Math.cos(a) * R, 0.035, Math.sin(a) * R]], 0.012, { segs: 4, caps: false }); }
  g.tube(Array.from({ length: 25 }, (_, i) => { const a = i / 24 * Math.PI * 2; return [Math.cos(a) * R * 0.55, 0.035, Math.sin(a) * R * 0.55]; }), 0.01, { segs: 4, caps: false });
  g.pop();
  return { tier: 's', cast: false };
});

// An easel for a chalkboard (the board itself is a sign).
defineProp('hall.easel', (g, p) => {
  const h = p.h || 1.75;
  g.mat('wood', p.wood || '#6b4a2f');
  g.tube([[-0.36, 0, 0.12], [-0.24, h, -0.02]], 0.018, { segs: 5 }); g.tube([[0.36, 0, 0.12], [0.24, h, -0.02]], 0.018, { segs: 5 });
  g.tube([[0, 0, -0.42], [0, h - 0.1, -0.04]], 0.016, { segs: 5 });
  g.box(-0.4, 0.62, 0.05, 0.4, 0.66, 0.13, { bevel: 0.006 });
  return { posts: [[0, 0, 0.3, 0, h]], tier: 's' };
});

// A coat stand: turned pole, three feet, pegs.
defineProp('hall.coatstand', (g, p) => {
  g.mat('wood', p.wood || '#4b2f1f');
  g.lathe(0, 0, [[0.03, 0], [0.025, 0.1], [0.022, 1.7], [0.035, 1.74], [0.0, 1.78]], { segs: 8 });
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.tube([[0, 0.12, 0], [Math.cos(a) * 0.3, 0.01, Math.sin(a) * 0.3]], 0.016, { segs: 5 }); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; g.tube([[0, 1.6, 0], [Math.cos(a) * 0.14, 1.66, Math.sin(a) * 0.14]], 0.012, { segs: 5 }); }
  return { posts: [[0, 0, 0.22, 0, 1.8]], tier: 's' };
});

// A rolled length of felt, tied. p: { col, len }
defineProp('hall.feltroll', (g, p) => {
  const len = p.len || 1.6, r = p.r || 0.16;
  g.mat('felt', p.col || '#8c2c26'); g.push(); g.rotZ(Math.PI / 2); g.cyl(0, -len / 2, 0, r, len, { segs: 14 }); g.pop();
  g.mat('felt', shadeHex(p.col || '#8c2c26', 0.6)); g.push(); g.rotZ(Math.PI / 2); g.cyl(0, len / 2, 0, r * 0.35, 0.004, { segs: 10 }); g.pop();
  g.mat('weave', '#e4d8b8'); for (const x of [-len * 0.3, len * 0.3]) { g.push(); g.move(x, 0, 0); g.rotZ(Math.PI / 2); g.cyl(0, -0.015, 0, r + 0.005, 0.03, { segs: 14 }); g.pop(); }
  return { tier: 's' };
});

// ---------- drawing helpers ----------
// Fill the corners above an elliptical arch in a wall along x: arch from x0 to x1, springing at ys, crown at yt (the opening's top), wall from z0 to z1.
function archFill(g, x0, x1, z0, z1, ys, yt, n = 10) {
  const hw = (x1 - x0) / 2, xc = (x0 + x1) / 2, rise = yt - ys - 0.0;
  const pts = []; for (let i = 0; i <= n; i++) { const u = -hw + 2 * hw * i / n; pts.push([xc + u, ys + rise * Math.sqrt(Math.max(0, 1 - (u / hw) * (u / hw))) * 0.999]); }
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1];
    g.quad([a[0], a[1], z1], [b[0], b[1], z1], [b[0], yt, z1], [a[0], yt, z1]);
    g.quad([b[0], b[1], z0], [a[0], a[1], z0], [a[0], yt, z0], [b[0], yt, z0]);
    g.quad([a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]);
  }
  return pts;
}

// A moulding that follows the arch's curve (a tube), proud of one face.
function archMould(g, pts, z, r) { g.tube(pts.map((p) => [p[0], p[1] + r * 0.6, z]), r, { segs: 6 }); }

// A transverse rib of the vault at x, w wide, d deep, coming down to the cornice.
function ribArc(g, x, w, d, n = 16) {
  const xa = x - w / 2, xb = x + w / 2;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n; const o0 = vp(t0), o1 = vp(t1), i0 = vp(t0, d), i1 = vp(t1, d);
    g.quad([xa, i0[1], i0[0]], [xb, i0[1], i0[0]], [xb, i1[1], i1[0]], [xa, i1[1], i1[0]]);           // soffit
    g.quad([xa, o0[1], o0[0]], [xa, i0[1], i0[0]], [xa, i1[1], i1[0]], [xa, o1[1], o1[0]]);           // the -x face
    g.quad([xb, i0[1], i0[0]], [xb, o0[1], o0[0]], [xb, o1[1], o1[0]], [xb, i1[1], i1[0]]);           // the +x face
  }
}

// A longitudinal rib along the vault at t, from xa to xb.
function ribLong(g, t, xa, xb, w, d) {
  const dt = w / 2 / (2 * TH * VR); const a = vp(t - dt), b = vp(t + dt), ai = vp(t - dt, d), bi = vp(t + dt, d);
  g.quad([xa, ai[1], ai[0]], [xb, ai[1], ai[0]], [xb, bi[1], bi[0]], [xa, bi[1], bi[0]]);
  g.quad([xa, a[1], a[0]], [xb, a[1], a[0]], [xb, ai[1], ai[0]], [xa, ai[1], ai[0]]);
  g.quad([xb, b[1], b[0]], [xa, b[1], b[0]], [xa, bi[1], bi[0]], [xb, bi[1], bi[0]]);
}

// A felt panel on the vault between t0 and t1, xa to xb, offset off toward the room.
function feltPanel(g, t0, t1, xa, xb, off, n = 4) {
  for (let i = 0; i < n; i++) {
    const a = vp(t0 + (t1 - t0) * i / n, off), b = vp(t0 + (t1 - t0) * (i + 1) / n, off);
    g.quad([xa, a[1], a[0]], [xb, a[1], a[0]], [xb, b[1], b[0]], [xa, b[1], b[0]]);
  }
}

// A bench: plank seat on two or three trestle frames. Drawn by hand so 400 seats stay cheap.
function benchGeo(g, x0, x1, zc, wood, seatCol) {
  g.mat('wood', wood, { rough: -0.06 }); g.box(x0, 0.415, zc - 0.17, x1, 0.46, zc + 0.17, { bevel: 0.012 });
  if (seatCol) { g.mat('felt', seatCol); g.box(x0 + 0.04, 0.46, zc - 0.14, x1 - 0.04, 0.485, zc + 0.14, { bevel: 0.01 }); }
  g.mat('wood', shadeHex(wood, 0.78));
  const legs = [x0 + 0.14, x1 - 0.14]; if (x1 - x0 > 2.2) legs.push((x0 + x1) / 2);
  for (const lx of legs) {
    for (const s of [-1, 1]) g.box(lx - 0.03, 0, zc + s * 0.13 - 0.03, lx + 0.03, 0.415, zc + s * 0.13 + 0.03, { bevel: 0.006, aoBottom: 0.6 });
    g.box(lx - 0.035, 0.36, zc - 0.16, lx + 0.035, 0.415, zc + 0.16, { bevel: 0.006 });
    g.box(lx - 0.04, 0, zc - 0.17, lx + 0.04, 0.05, zc + 0.17, { bevel: 0.008 });
  }
  g.box(x0 + 0.14, 0.12, zc - 0.022, x1 - 0.14, 0.17, zc + 0.022, { bevel: 0.006 });
}

export const place = {
  id: 'hall', name: "Marit Vell's Hall", order: 40,
  build(game) {
    const W = game.world;
    const f = W.frame('candlewick', deckRadius(16), 0, 625);
    const s = W.scope('hall', f);
    const g = s.g;
    const R = new Rng(16021);
    const clip = CLIP;

    // ======================= the shell =======================
    floor(s, -62, -27.5, 62, -14, 0, 'planks', C.honey);
    // a darker border of boards round the room and a band along each aisle
    s.structure(() => {
      g.mat('planks', '#6e4a2e', { rough: 0.05 });
      for (const zz of [[ZN, ZN + 0.35], [ZS - 0.35, ZS]]) for (let x = -62; x < 62; x += 16) g.box(x, 0, zz[0], Math.min(62, x + 16), 0.003, zz[1], { faces: 'Y' });
    });
    for (let x = -62; x < 62; x += 16) {
      s.structure(() => { g.mat('planks', '#7a5434'); for (const zb of [ZC - 2.25, ZC + 2.25]) g.box(x, 0, zb - 0.06, Math.min(62, x + 16), 0.003, zb + 0.06, { faces: 'Y' }); });
    }

    // north wall: the pass to the kitchen and its two doors
    const wallO = { t: 0.3, tint: C.plaster, dado: { h: 1.2, mat: 'flute', tint: '#5a3826' }, skirt: '#2e1d13' };
    wall(s, -62, -27.35, 62, -27.35, 0, H, Object.assign({}, wallO, {
      openings: PASS.map((p) => ({ at: p[0] + 62, w: p[1] - p[0], h: 2.6 })).concat(KDOOR.map((p) => ({ at: p[0] + 62, w: p[1] - p[0], h: 2.2 }))),
    }));
    // south wall, solid where the shops stand behind it
    wall(s, -62, -14.15, -28, -14.15, 0, H, wallO);
    wall(s, 28, -14.15, 62, -14.15, 0, H, wallO);
    // end walls with the doors on the table's axis
    const endOpen = [{ at: ZC - DOOR_W / 2 + 27.5, w: DOOR_W, h: DOOR_H }];
    wall(s, -61.85, -27.5, -61.85, -14, 0, H, Object.assign({}, wallO, { openings: endOpen }));
    wall(s, 61.85, -27.5, 61.85, -14, 0, H, Object.assign({}, wallO, { openings: endOpen }));

    // the arcade onto Wick Court: nine elliptical arches between stone piers, nothing in the way
    const AY = 3.3, AT = 4.75;
    wall(s, -28, -14.15, 28, -14.15, 0, H, { t: 0.3, tint: '#d8bf98', mat: 'plaster', tintA: '#d6bc94', skirt: false, openings: ARCH.map((a) => ({ at: a[0] + 28, w: a[1] - a[0], h: AT })) });
    for (const a of ARCH) {
      const narrow = a[1] - a[0] < 3; const top = narrow ? AY + 1.25 : AT;
      s.structure(() => {
        g.mat('plaster', '#d8bf98'); const pts = archFill(g, a[0], a[1], -14.3, -14.0, AY, top, 12);
        if (narrow) { g.box(a[0], top, -14.3, a[1], AT, -14.0, { faces: 'yzZ' }); }
        g.mat('stone', '#c9b79a'); archMould(g, pts, -13.96, 0.055); archMould(g, pts, -14.34, 0.055);
        const xc = (a[0] + a[1]) / 2; g.box(xc - 0.17, top - 0.12, -14.38, xc + 0.17, top + 0.32, -13.92, { bevel: 0.015 });
      });
    }
    // piers: stone bases and impost blocks on both faces
    for (let i = 0; i < ARCH.length - 1; i++) {
      const x0 = ARCH[i][1], x1 = ARCH[i + 1][0];
      s.structure(() => {
        g.mat('stone', '#bfae92'); g.box(x0 - 0.06, 0, -14.4, x1 + 0.06, 0.5, -13.9, { bevel: 0.02, aoBottom: 0.6 });
        g.mat('stone', '#c9b79a'); g.box(x0 - 0.08, AY - 0.18, -14.42, x1 + 0.08, AY, -13.88, { bevel: 0.02 });
        g.mat('wood', C.wood); g.box(x0 - 0.04, AY - 0.26, -14.44, x1 + 0.04, AY - 0.18, -13.86, { bevel: 0.01 });
      });
    }
    for (const x of [-28, 28]) s.structure(() => { g.mat('stone', '#bfae92'); g.box(x - 0.3, 0, -14.4, x + 0.3, 0.5, -13.9, { bevel: 0.02 }); g.mat('stone', '#c9b79a'); g.box(x - 0.32, AY - 0.18, -14.42, x + 0.32, AY, -13.88, { bevel: 0.02 }); });
    // the court face above the arches: a string course and the fascia
    s.structure(() => {
      g.mat('stone', '#c9b79a'); g.box(-28, 5.25, -14.0, 28, 5.45, -13.86, { bevel: 0.02 });
      g.mat('paint', '#2e3d36'); g.box(-6.4, 5.6, -14.0, 6.4, 6.9, -13.94, { bevel: 0.02 });
    });
    sign(s, SIGNS['hall.fascia'], 0, 6.25, -13.93, { face: 'Z', w: 6.2, h: 1.1, board: false, glow: 0.5 });
    lamp(s, 'bulb', 0, 5.4, -13.2, { power: 0.8, range: 4.5, K: 2800, clip: [-8, 4, -14.0, 8, 8.2, -11] });
    // the ladle sign, hanging from a bracket on the central arch's court face
    s.structure(() => { g.mat('cast', '#2e2a24'); g.tube([[-3.1, 4.9, -13.9], [-3.1, 4.9, -13.2], [-3.1, 4.75, -13.2]], 0.018, { segs: 5 }); g.tube([[-3.1, 4.4, -13.92], [-3.1, 4.9, -13.5]], 0.012, { segs: 5 }); });
    sign(s, Object.assign({}, SIGNS['hall.hanging'], { emblem: 'ladle', palette: ['#f0e2c0', '#283062', '#c58a2c'] }), -3.1, 4.3, -13.2, { face: 'X', double: true, w: 0.75, h: 0.75 });

    // ======================= pilasters, cornice and wall dressing =======================
    for (const x of PIERS) for (const side of [-1, 1]) {
      const zf = side < 0 ? ZN : ZS, d = side < 0 ? 1 : -1;      // d: the way into the room
      const za = Math.min(zf, zf + d * 0.36), zb = Math.max(zf, zf + d * 0.36);
      if (side > 0 && Math.abs(x) < 28) continue;                 // the arcade's piers do this job on the court side
      s.structure(() => {
        g.mat('plaster', C.plasterDk); g.box(x - 0.3, 1.2, za, x + 0.3, SPRING - 0.3, zb, { faces: d > 0 ? 'xXZ' : 'xXz' });
        g.mat('wood', C.wood); g.box(x - 0.34, 0, Math.min(zf, zf + d * 0.4), x + 0.34, 1.2, Math.max(zf, zf + d * 0.4), { bevel: 0.015, aoBottom: 0.6 });
        g.box(x - 0.38, SPRING - 0.3, Math.min(zf, zf + d * 0.44), x + 0.38, SPRING, Math.max(zf, zf + d * 0.44), { bevel: 0.02 });
        g.mat('paint', C.saffron); g.box(x - 0.39, SPRING - 0.2, Math.min(zf, zf + d * 0.45), x + 0.39, SPRING - 0.16, Math.max(zf, zf + d * 0.45));
      });
    }
    // the cornice the vault springs from, with a lip that hides the cove light
    for (let i = 0; i < 8; i++) {
      const xa = -62 + i * 15.5, xb = xa + 15.5;
      s.structure(() => {
        for (const side of [-1, 1]) {
          const zf = side < 0 ? ZN : ZS, d = side < 0 ? 1 : -1, Z = (u) => zf + d * u;
          g.mat('wood', C.wood); g.box(xa, SPRING - 0.22, Math.min(Z(0), Z(0.22)), xb, SPRING, Math.max(Z(0), Z(0.22)), { faces: 'yY' + (d > 0 ? 'Z' : 'z') });
          g.box(xa, SPRING, Math.min(Z(0.18), Z(0.24)), xb, SPRING + 0.2, Math.max(Z(0.18), Z(0.24)), { faces: 'yYzZ' });
          g.mat('paint', C.saffron); g.box(xa, SPRING - 0.3, Math.min(Z(0), Z(0.08)), xb, SPRING - 0.22, Math.max(Z(0), Z(0.08)), { faces: 'y' + (d > 0 ? 'Z' : 'z') });
          g.mat('diffuser', '#ffcf8f', { emissive: 2.2, lamp: true }); g.box(xa, SPRING + 0.01, Math.min(Z(0.04), Z(0.1)), xb, SPRING + 0.04, Math.max(Z(0.04), Z(0.1)), { faces: 'Y' });
          // the frieze under the cornice and the dado rail, both broken where the wall is (the arcade, the pass)
          const gap = side > 0 ? [-28.0, 28.0] : [-12.7, 12.7];
          const pieces = [[xa, Math.min(xb, gap[0])], [Math.max(xa, gap[1]), xb]].filter((p) => p[1] - p[0] > 0.05);
          for (const pc of pieces) {
            const fz = (u0, u1) => [Math.min(Z(u0), Z(u1)), Math.max(Z(u0), Z(u1))];
            let q = fz(0, 0.012); g.mat('paint', C.teal); g.box(pc[0], 4.38, q[0], pc[1], 4.56, q[1], { faces: d > 0 ? 'Z' : 'z' });
            q = fz(0, 0.016); g.mat('paint', C.saffron); for (const yy of [4.33, 4.6]) g.box(pc[0], yy, q[0], pc[1], yy + 0.03, q[1], { faces: d > 0 ? 'Z' : 'z' });
            q = fz(0.012, 0.016); g.mat('paint', '#7a2f28'); for (let x = pc[0] + 0.25; x < pc[1] - 0.1; x += 0.5) g.box(x, 4.44, q[0], x + 0.1, 4.5, q[1], { faces: d > 0 ? 'Z' : 'z' });
            q = fz(0, 0.05); g.mat('wood', C.wood); g.box(pc[0], 1.2, q[0], pc[1], 1.26, q[1], { bevel: 0.01 });
          }
        }
      });
    }
    // cove light along both cornices: long warm tubes washing the felt
    for (let i = 0; i < 8; i++) {
      const xa = -61.6 + i * 15.4, xb = xa + 15.4;
      for (const side of [-1, 1]) {
        const zl = side < 0 ? ZN + 0.25 : ZS - 0.25;
        s.light({ at: [xa + 0.3, SPRING + 0.25, zl], to: [xb - 0.3, SPRING + 0.25, zl], type: 'tube', color: warm(2600), power: 2.4, range: 6.0, radius: 0.1, lamp: true, clip });
      }
    }
    // felt hangings between the pilasters: the hall's acoustic panels, one colour a bay, hung from a rod on rings
    const HANG = [C.madder, C.saffron, C.teal, '#5b4060', C.indigo, '#9a3b22', C.green];
    for (let i = 0; i < PIERS.length - 1; i++) {
      const xa = PIERS[i] + 0.55, xb = PIERS[i + 1] - 0.55, xm = (xa + xb) / 2;
      for (const side of [-1, 1]) {
        if (side > 0 && Math.abs(xm) < 28) continue;
        if (side < 0 && Math.abs(xm) < 15) continue;
        const zf = side < 0 ? ZN : ZS, d = side < 0 ? 1 : -1;
        const col = HANG[(i * 3 + (side > 0 ? 2 : 0)) % HANG.length];
        const zw = zf + d * 0.06, x0 = xm - 2.35, x1 = xm + 2.35, y1 = 4.12, y0 = 2.3;
        s.structure(() => {
          g.mat('wood', C.wood); g.tube([[x0 - 0.12, y1 + 0.05, zw], [x1 + 0.12, y1 + 0.05, zw]], 0.022, { segs: 6 });
          for (const xx of [x0 - 0.12, x1 + 0.12]) g.box(xx - 0.03, y1 + 0.0, Math.min(zf, zw), xx + 0.03, y1 + 0.1, Math.max(zf, zw));
          const P = (x, y) => [x, y, zw + d * 0.005];
          g.mat('motif', col, { rough: 0.1 });
          if (d > 0) g.sheet(P(x0, y1), P(x1, y1), P(x1, y0), P(x0, y0), { nu: 10, nv: 3, ripple: 0.025, rippleN: 7 });
          else g.sheet(P(x1, y1), P(x0, y1), P(x0, y0), P(x1, y0), { nu: 10, nv: 3, ripple: 0.025, rippleN: 7 });
          g.mat('felt', shadeHex(col, 0.55)); const yb = y0 + 0.02;
          g.box(x0, yb - 0.1, Math.min(zw, zw + d * 0.03), x1, yb, Math.max(zw, zw + d * 0.03), { bevel: 0.01 });
        });
      }
    }

    // ======================= the vault =======================
    const FELT_ROWS = ['#b5782c', C.madder, C.madder, '#b5782c'];
    for (let b = 0; b < RIBS.length - 1; b++) {
      const xa = RIBS[b], xb = RIBS[b + 1];
      s.structure(() => {
        for (let r = 0; r < 4; r++) {
          const t0 = r / 4, t1 = (r + 1) / 4;
          let col = FELT_ROWS[r];
          if ((r === 1 || r === 2) && b % 3 === 1) col = '#9a3b22';             // a rust-red run, rehung later than the rest
          if ((r === 1 || r === 2) && b === 13) col = '#b0442c';                 // Mags's new felt, not yet faded
          col = shadeHex(col, R.f(0.9, 1.08));
          g.mat('felt', shadeHex(col, 0.5)); feltPanel(g, t0, t1, xa, xb, 0, 4);
          if (b === 5 && r === 2) continue;                                       // one coffer stripped for rehanging
          const m = 0.035, ins = 0.3; const pa = Math.min(xa + ins, (xa + xb) / 2 - 0.1), pb = Math.max(xb - ins, (xa + xb) / 2 + 0.1);
          g.mat('felt', col); feltPanel(g, t0 + m, t1 - m, pa, pb, 0.12, 4);
          // the quilting: two stitched lines along each pillow
          g.mat('felt', shadeHex(col, 0.72)); for (const tt of [t0 + (t1 - t0) * 0.35, t0 + (t1 - t0) * 0.65]) { const q = vp(tt, 0.125), q2 = vp(tt + 0.004, 0.125); g.quad([pa, q[1], q[0]], [pb, q[1], q[0]], [pb, q2[1], q2[0]], [pa, q2[1], q2[0]]); }
        }
        g.mat('wood', C.wood); for (const t of [0.25, 0.5, 0.75]) ribLong(g, t, xa, xb, 0.18, 0.2);
        g.mat('paint', C.saffron); for (const t of [0.25, 0.5, 0.75]) { const q = vp(t - 0.003, 0.205), q2 = vp(t + 0.003, 0.205); g.quad([xa, q[1], q[0]], [xb, q[1], q[0]], [xb, q2[1], q2[0]], [xa, q2[1], q2[0]]); }
      });
    }
    // the transverse ribs, with a saffron fillet and gilded bosses where the ribs cross
    for (const x of RIBS) {
      s.structure(() => {
        const end = Math.abs(x) > 61; const w = end ? 0.36 : 0.4;
        g.mat('wood', C.wood); ribArc(g, x, w, 0.32, 16);
        g.mat('paint', C.saffron); for (let i = 0; i < 16; i++) { const a = vp(i / 16, 0.325), b2 = vp((i + 1) / 16, 0.325); g.quad([x - 0.04, a[1], a[0]], [x + 0.04, a[1], a[0]], [x + 0.04, b2[1], b2[0]], [x - 0.04, b2[1], b2[0]]); }
        g.mat('cast', C.brass, { rough: -0.15 }); for (const t of [0.25, 0.5, 0.75]) { const q = vp(t, 0.36); g.ball(x, q[1], q[0], 0.13, 0.08, 0.13, { segs: 10, rings: 5 }); }
      });
    }

    // ======================= the table =======================
    const TOP_Y = 0.75;
    for (const sg of SEGS) {
      for (let x = sg[0]; x < sg[1] - 0.01; x += 2.4) {
        const x1 = Math.min(sg[1], x + 2.4);
        s.furniture(() => {
          g.mat('wood', shadeHex(C.top, R.f(0.9, 1.08)), { rough: -0.1 }); g.box(x + 0.004, TOP_Y - 0.05, ZC - 0.52, x1 - 0.004, TOP_Y, ZC + 0.52, { bevel: 0.012 });
          g.mat('wood', C.wood); g.box(x + 0.05, TOP_Y - 0.13, ZC - 0.44, x1 - 0.05, TOP_Y - 0.05, ZC + 0.44, { faces: 'xXzZy' });
          for (const lx of [x + 0.12, x1 - 0.12]) {
            for (const sz of [-1, 1]) g.box(lx - 0.035, 0, ZC + sz * 0.36 - 0.035, lx + 0.035, TOP_Y - 0.13, ZC + sz * 0.36 + 0.035, { bevel: 0.008, aoBottom: 0.55 });
            g.box(lx - 0.03, 0.1, ZC - 0.36, lx + 0.03, 0.15, ZC + 0.36, { bevel: 0.006 });
          }
        });
        s.solid(x, 0, ZC - 0.52, x1, TOP_Y, ZC + 0.52, { surf: 'wood' });
      }
      // runners laid end to end, none of them the same
      for (let x = sg[0] + 0.3; x < sg[1] - 0.5; x += 4.6) {
        const x1 = Math.min(sg[1] - 0.3, x + 4.4);
        const cols = [[C.madder, C.saffron], [C.indigo, '#e9dcc0'], [C.teal, '#e0a040'], ['#c9552e', '#f1e6cf'], ['#5b4060', '#d6a640']][R.i(0, 4)];
        s.furniture(() => {
          g.mat('stripe', cols[0], { rough: 0.1 }); g.box(x, TOP_Y, ZC - 0.21, x1, TOP_Y + 0.004, ZC + 0.21, { faces: 'YxX' });
          g.mat('weave', cols[1]); for (const sz of [-1, 1]) g.box(x, TOP_Y + 0.001, ZC + sz * 0.21 - 0.025, x1, TOP_Y + 0.0055, ZC + sz * 0.21 + 0.025, { faces: 'Y' });
        });
      }
    }

    // ======================= benches, chairs, four hundred seats =======================
    const seats = [];                 // { x, z, side, yaw (person: front toward the table), seg }
    const SIDES = [{ z: ZC - 1.0, face: 1 }, { z: ZC + 1.0, face: -1 }];
    let seatTotal = 0;
    for (const sd of SIDES) {
      for (let k = 0; k < SEGS.length; k++) {
        const [a, b] = SEGS[k]; const n = Math.round((b - a) / 0.585); const pitch = (b - a) / n;
        // group seats into benches of four; the odd ones join the last bench
        const groups = []; for (let i = 0; i < n; i += 4) groups.push([i, Math.min(n, i + 4)]);
        if (groups.length > 1 && groups[groups.length - 1][1] - groups[groups.length - 1][0] < 3) { const l = groups.pop(); groups[groups.length - 1][1] = l[1]; }
        for (const gr of groups) {
          const x0 = a + gr[0] * pitch + 0.04, x1 = a + gr[1] * pitch - 0.04;
          const roll = R.next();
          if (roll < 0.14) {
            // chairs: mismatched, from every hall that ever closed
            for (let i = gr[0]; i < gr[1]; i++) {
              const cx = a + (i + 0.5) * pitch + R.f(-0.03, 0.03);
              const wood = R.pick(['#6b4a2f', '#4b2f1f', '#8a6240', '#2f4a44', '#7a2f28', '#c58a2c']);
              if (R.chance(0.18)) prop(s, 'chair', cx, 0, sd.z - sd.face * 0.04, sd.face > 0 ? 0 : Math.PI, { wood, seat: R.pick(['#d9c08a', '#b5653a', '#2f6c66', '#c9a24a']), back: R.chance(0.5) ? 'slat' : 'hoop' }, { tier: 's', noSpots: true });
              else prop(s, 'hall.chair', cx, 0, sd.z - sd.face * 0.04, (sd.face > 0 ? 0 : Math.PI) + R.f(-0.06, 0.06), { wood, seat: R.chance(0.6) ? R.pick(['#8c2c26', '#2f6c66', '#d1952c', '#5b4060']) : null, back: R.pick(['rail', 'slat', 'ladder']) }, { tier: 's', noSpots: true });
            }
          } else {
            const painted = roll > 0.86; const wood = painted ? R.pick(['#2f6c66', '#7a2f28', '#3c5a3e', '#c58a2c']) : shadeHex(R.pick(['#6b4a2f', '#7a5233', '#5a3a24', '#8a6240']), R.f(0.9, 1.1));
            const cushion = !painted && roll > 0.66 ? R.pick(['#8c2c26', '#283062', '#d1952c', '#2f6c66', '#5b4060']) : null;
            s.furniture(() => benchGeo(g, x0, x1, sd.z, wood, cushion));
            s.solid(x0, 0, sd.z - 0.17, x1, cushion ? 0.485 : 0.46, sd.z + 0.17, { surf: 'wood' });
          }
          for (let i = gr[0]; i < gr[1]; i++) seats.push({ x: a + (i + 0.5) * pitch, z: sd.z, face: sd.face, seg: k });
        }
        seatTotal += n;
      }
      // a chair at each end of the table, for whoever is oldest
    }
    prop(s, 'chair', -60.05, 0, ZC, Math.PI / 2, { wood: '#4b2f1f', seat: '#8c2c26', back: 'slat' }, { tier: 's', noSpots: true });
    prop(s, 'chair', 60.05, 0, ZC, -Math.PI / 2, { wood: '#6b4a2f', seat: '#2f6c66', back: 'slat' }, { tier: 's', noSpots: true });
    s.spot('sit', -60.05, 0.46, ZC, Math.PI / 2, { tags: ['hall', 'eat', 'head'] });
    s.spot('sit', 60.05, 0.46, ZC, -Math.PI / 2, { tags: ['hall', 'eat', 'head'] });
    // the sit spots: a person's yaw follows the props' convention (front toward +z at yaw 0)
    for (const st of seats) s.spot('sit', st.x, 0.46, st.z, st.face > 0 ? 0 : Math.PI, { tags: ['hall', 'eat'] });
    void seatTotal;

    // ======================= the table laid =======================
    // one place in three laid: a plate, a lidded bowl on it, a lidded cup, a spoon. The rest have a folded cloth or nothing.
    const laid = [];
    for (const st of seats) {
      const ez = ZC - st.face * 0.31;           // the setting sits 0.2 in from the table's edge
      const r = R.next();
      if (r < 0.36) {
        const gl = R.pick(GLAZES), lid = R.chance(0.7) ? gl : R.pick(GLAZES);
        prop(s, 'hall.setplate', st.x, TOP_Y, ez, 0, { glaze: R.pick(['#ece5d6', '#e9e1cf', '#d9cfb8']) });
        prop(s, 'hall.setbowl', st.x, TOP_Y + 0.008, ez, R.f(0, 6), { glaze: gl, lid });
        prop(s, 'hall.setcup', st.x + 0.2, TOP_Y, ez + st.face * 0.06, 0, { glaze: R.pick(['#d9cfb8', '#2f6c66', '#b5653a', '#e9e1cf']) });
        s.detail(() => { g.mat('cast', '#c9b98a'); g.box(st.x - 0.17, TOP_Y, ez - 0.07, st.x - 0.155, TOP_Y + 0.008, ez + 0.08, { bevel: 0.003 }); });
        laid.push(st);
      } else if (r < 0.58) {
        s.detail(() => { g.mat('weave', R.pick(['#efe6d2', '#d9b25c', '#a9c6b0', '#e8c4b8'])); g.box(st.x - 0.11, TOP_Y, ez - 0.08, st.x + 0.11, TOP_Y + 0.018, ez + 0.08, { bevel: 0.006 }); });
      } else if (r < 0.66) {
        prop(s, 'cup', st.x + 0.15, TOP_Y, ez, 0, { glaze: '#d9cfb8', open: true, drink: R.pick(['#5a3a22', '#c9a24a', '#e9e2d0']) });
      }
    }
    // down the middle: the Nine every few seats, water jugs, tureens for the shared dishes, herb pots, cruets
    const nines = [];
    for (const sg of SEGS) {
      for (let x = sg[0] + 0.9, i = 0; x < sg[1] - 0.6; x += 1.17, i++) {
        const zz = ZC + (i % 2 ? 0.09 : -0.09);
        const kind = i % 4;
        if (kind === 0) { prop(s, 'hall.nine', x, TOP_Y + 0.004, zz, R.f(0, 6), {}); nines.push([x, zz]); }
        else if (kind === 1) prop(s, 'hall.jug', x, TOP_Y + 0.004, zz, R.f(0, 6), { glaze: R.pick(['#e9e1cf', '#a9c6b0', '#d4a24a', '#8fb3c4']) });
        else if (kind === 2) prop(s, 'hall.herbpot', x, TOP_Y + 0.004, ZC, R.f(0, 6), { seed: R.i(1, 6), pot: R.pick(['#b4643e', '#a9573a', '#c47a4e']), leaf: R.pick(['#cfe8a0', '#b8d890', '#e0f0b0']) });
        else prop(s, 'hall.tureen', x, TOP_Y + 0.004, zz, R.f(0, 6), { glaze: R.pick(['#b5653a', '#2f6c66', '#e9e1cf', '#3a4a7a', '#d4a24a']), r: R.f(0.13, 0.17) });
        if (kind === 1 || kind === 3) prop(s, 'crock', x + 0.32, TOP_Y + 0.004, ZC - (i % 2 ? 0.1 : -0.1), 0, { glaze: R.pick(['#8a5a3c', '#3a4a7a', '#c9a24a']), h: 0.09, r: 0.035 });
      }
    }

    // ======================= the long line of lamps =======================
    const RAIL_Y = 2.85;
    for (let i = 0; i < 15; i++) {
      const xa = -58.9 + i * 117.8 / 15, xb = xa + 117.8 / 15;
      s.structure(() => {
        g.mat('cast', '#7a5a30', { rough: -0.1 }); const pts = []; for (let k = 0; k <= 4; k++) pts.push([xa + (xb - xa) * k / 4, RAIL_Y, ZC]); g.tube(pts, 0.022, { segs: 6, caps: false });
      });
    }
    s.structure(() => { g.mat('cast', '#7a5a30'); for (const x of [-58.9, 58.9]) g.ball(x, RAIL_Y, ZC, 0.04, 0.04, 0.04, { segs: 8, rings: 5 }); });
    for (const x of PIERS) {
      const crown = vp(0.5, 0.32)[1];
      s.structure(() => { g.mat('cast', '#3d332a'); g.tube([[x, RAIL_Y, ZC], [x, crown, ZC]], 0.01, { segs: 5, caps: false }); g.mat('cast', C.brass); g.cyl(x, RAIL_Y - 0.03, ZC, 0.035, 0.06, { segs: 8 }); });
    }
    let pn = 0;
    for (let x = -58.1; x < 58.2; x += 1.75, pn++) {
      const shade = pn % 9 === 4 ? '#2f6c66' : pn % 13 === 7 ? '#a3352b' : pn % 17 === 11 ? '#e3d7bc' : C.brass;
      prop(s, 'hall.pendant', x, RAIL_Y, ZC, 0, { shade, enamel: shade !== C.brass });
      if (pn % 2 === 0) s.light({ at: [x + 0.875, 2.1, ZC], color: warm(2650), power: 6.5, range: 6.5, shadow: true, radius: 0.22, lamp: true, clip });
    }

    // ======================= along the walls =======================
    // sideboards in the north bays either side of the kitchen, with plate racks over them
    const SB_COLS = [C.teal, '#7a2f28', C.green, '#5b4060', '#2e3d5a', '#8a5a2a'];
    let sbi = 0;
    for (let i = 0; i < PIERS.length - 1; i++) {
      const xa = PIERS[i], xb = PIERS[i + 1], xm = (xa + xb) / 2;
      if (xb <= 13 && xa >= -13) continue;                  // the pass
      if (Math.abs(xm) < 15) continue;                       // the bays with the kitchen doors
      const w = 4.6 + R.f(-0.4, 0.4), body = SB_COLS[sbi++ % SB_COLS.length];
      prop(s, 'counter', xm, 0, ZN + 0.29, 0, { w, d: 0.52, h: 0.9, body, top: '#6b4a2f' }, { noSpots: true });
      prop(s, 'hall.platerack', xm, 1.85, ZN + 0.12, 0, { w: w - 0.6, n: 9 + (i % 3), seed: i });
      // on top: stacks of lids and bowls, crocks of pickles, a pile of cloths
      for (let k = 0; k < 5; k++) {
        const px = xm - w / 2 + 0.45 + k * (w - 0.9) / 4, kind = (i + k) % 4;
        if (kind === 0) prop(s, 'hall.stack', px, 0.9, ZN + 0.3, 0, { n: R.i(5, 9), glaze: R.pick(GLAZES) });
        else if (kind === 1) { prop(s, 'crock', px - 0.1, 0.9, ZN + 0.3, 0, { glaze: R.pick(['#8a5a3c', '#3a4a7a', '#2f6c66']) }); prop(s, 'crock', px + 0.16, 0.9, ZN + 0.26, 0, { glaze: '#c9a24a', h: 0.22, r: 0.08 }); }
        else if (kind === 2) prop(s, 'hall.stack', px, 0.9, ZN + 0.3, 0, { n: R.i(8, 12), glaze: R.pick(GLAZES), r: 0.11 });
        else s.detail(() => { g.mat('weave', R.pick(['#efe6d2', '#d9b25c', '#c9552e'])); for (let j = 0; j < 4; j++) g.box(px - 0.2, 0.9 + j * 0.025, ZN + 0.15, px + 0.2, 0.92 + j * 0.025, ZN + 0.45, { bevel: 0.008 }); });
      }
      sbi += 0;
    }
    // coat hooks with coats on the south walls behind the shops, and benches built in under them
    const COAT_COLS = ['#6e7f3a', '#2f6f8f', '#8a3a2e', '#d6a640', '#5b4060', '#3a3a44', '#c9552e', '#2a6a5a', '#9a7a5a'];
    for (let i = 0; i < PIERS.length - 1; i++) {
      const xa = PIERS[i], xb = PIERS[i + 1], xm = (xa + xb) / 2;
      if (Math.abs(xm) < 30) continue;
      if (Math.abs(Math.abs(xm) - 35) < 1) {
        // the notice bay: a cork board of posters and notes, a bench under it
        s.structure(() => { g.mat('wood', '#5a3826'); g.box(xa + 1.2, 1.15, ZS - 0.05, xb - 1.2, 2.25, ZS, { bevel: 0.01 }); g.mat('paper', '#b48a5a', { rough: 0.2 }); g.box(xa + 1.28, 1.22, ZS - 0.055, xb - 1.28, 2.18, ZS - 0.05, { faces: 'z' }); });
        const ps = xm < 0 ? ['poster.fund', 'poster.sun', 'poster.quiet'] : ['poster.feast', 'poster.booking', 'poster.homecoming'];
        ps.forEach((id, k) => { if (SIGNS[id]) sign(s, SIGNS[id], xm - 1.2 + k * 1.2, 1.7, ZS - 0.06, { face: 'z', w: 0.55, h: 0.8 }); });
        sign(s, { kind: 'notice', title: 'Wanted', lines: ['Hands for the lids,', 'Booking Day, from eleven.', 'Ask Clem.'], hand: true }, xm - 0.6, 1.5, ZS - 0.065, { face: 'z', w: 0.26, h: 0.36 });
        sign(s, { kind: 'notice', title: 'Found', lines: ['A blue scarf, mended twice.', 'On the peg by the anti door.'], hand: true }, xm + 0.62, 1.95, ZS - 0.065, { face: 'z', w: 0.26, h: 0.36 });
        s.furniture(() => benchGeo(g, xa + 1.0, xb - 1.0, ZS - 0.25, '#5a3a24', C.indigo));
        s.solid(xa + 1.0, 0, ZS - 0.42, xb - 1.0, 0.49, ZS - 0.08);
        continue;
      }
      s.structure(() => { g.mat('wood', '#5a3826'); g.box(xa + 0.5, 1.62, ZS - 0.03, xb - 0.5, 1.76, ZS, { bevel: 0.008 }); });
      s.furniture(() => benchGeo(g, xa + 0.6, xb - 0.6, ZS - 0.25, '#5a3a24', R.pick(['#8c2c26', '#283062', '#2f6c66'])));
      s.solid(xa + 0.6, 0, ZS - 0.42, xb - 0.6, 0.49, ZS - 0.08);
      for (let x = xa + 0.8; x < xb - 0.6; x += 0.42) {
        if (R.chance(0.42)) prop(s, 'hall.coat', x, 1.7, ZS, Math.PI, { col: R.pick(COAT_COLS), patch: R.chance(0.4) ? R.pick(['#e0b04a', '#c9552e', '#3fa7a3', '#f1e6cf']) : null, len: R.f(0.8, 1.05) });
        else s.detail(() => { g.mat('cast', '#7a6a50'); g.tube([[x, 1.7, ZS], [x, 1.7, ZS - 0.07], [x, 1.74, ZS - 0.09]], 0.007, { segs: 4 }); });
      }
      for (let k = 0; k < 4; k++) if (R.chance(0.5)) s.spot('sit', xa + 1.2 + k * 1.3, 0.48, ZS - 0.25, Math.PI, { tags: ['hall', 'wait'] });
    }
    // the volunteers' aprons on pegs by each kitchen door
    const APRONS = ['#ece4d0', '#e9dfc9', '#d9c7a6', '#ece4d0', '#e8d8c8', '#efe6d2'];
    for (const side of [-1, 1]) {
      for (let k = 0; k < 6; k++) {
        const x = side * (13.25 + k * 0.4);
        if (side > 0 && k === 5) continue;
        prop(s, 'hall.apron', x, 1.82, ZN, 0, { col: APRONS[k], tie: R.pick(['#c9552e', '#2f6f8f', '#d6a640', '#3a8a8a', '#8a3a2e']) });
      }
      s.structure(() => { g.mat('wood', '#5a3826'); g.box(side * 13.05 - (side > 0 ? 0 : 2.1), 1.76, ZN, side * 13.05 + (side > 0 ? 2.1 : 0), 1.88, ZN + 0.03, { bevel: 0.006 }); });
    }

    // sconces on the pilasters, alternately north and south, and plants under them on the court side
    for (let i = 0; i < PIERS.length; i++) {
      const x = PIERS[i]; const north = i % 2 === 0;
      if (!north && Math.abs(x) < 28) { lamp(s, 'sconce', x + (x < 0 ? 0.45 : -0.45), 2.6, ZS - 0.03, { face: 'z', clip, K: 2700, power: 0.9 }); continue; }
      lamp(s, 'sconce', x, 2.65, north ? ZN + 0.37 : ZS - 0.37, { face: north ? 'Z' : 'z', clip, K: 2700, power: 1.1 });
    }
    for (const x of [-24.5, -10.5, 10.5, 24.5]) for (const dx of [-0.75, 0.75]) prop(s, 'plant', x + dx, 0, ZS - 0.45, 0, { kind: R.pick(['broad', 'fern', 'fine']), size: R.f(1.1, 1.5), pot: R.pick(['#b4643e', '#2f6c66', '#d4a24a']) });

    // floor runners of rush matting down both aisles, bound in red, one per bay
    for (let i = 0; i < PIERS.length - 1; i++) {
      const xa = PIERS[i] + 0.5, xb = PIERS[i + 1] - 0.5;
      s.structure(() => {
        for (const zc of [ZC - 3.55, ZC + 3.55]) {
          const col = [C.madder, '#3a4888', '#7a3a22', C.teal][i % 4];
          g.mat('carpet', shadeHex(col, R.f(0.85, 1.05)), { rough: 0.1 }); g.box(xa, 0.003, zc - 0.42, xb, 0.012, zc + 0.42, { faces: 'YxXzZ' });
          g.mat('weave', C.saffron); for (const sz of [-1, 1]) g.box(xa + 0.08, 0.004, zc + sz * 0.33 - 0.025, xb - 0.08, 0.0135, zc + sz * 0.33 + 0.025, { faces: 'Y' });
        }
      });
    }

    // serving trolleys, parked near the kitchen and at the crossings
    const TROLLEYS = [[-15.6, ZC - 2.45, 0.1], [15.8, ZC - 2.45, -0.08], [-6.5, ZC - 4.9, 0], [7.3, ZC - 4.9, 0.1], [-15.9, ZC + 2.45, 0.06], [32.5, ZC - 4.7, 0]];
    for (const t of TROLLEYS) {
      prop(s, 'hall.trolley', t[0], 0, t[1], t[2], { wood: R.pick(['#7a5233', '#8a6240']) });
      for (let k = 0; k < 3; k++) prop(s, 'bowl', t[0] - 0.28 + k * 0.28, 0.885, t[1], t[2], { glaze: R.pick(GLAZES) });
      prop(s, 'hall.stack', t[0] - 0.2, 0.325, t[1], 0, { n: 7, glaze: R.pick(GLAZES) }); prop(s, 'hall.stack', t[0] + 0.2, 0.325, t[1], 0, { n: 5, glaze: '#e9e1cf', r: 0.11 });
      s.spot('work', t[0], 0, t[1] + (t[1] < ZC ? -0.6 : 0.6), t[1] < ZC ? 0 : Math.PI, { tags: ['hall', 'serve'] });
    }

    // ======================= the end walls: hangings, doors, the bright thing at each end of the view =======================
    for (const side of [-1, 1]) {
      const xw = side * XE, inX = -side;          // inX: the way into the room
      const fx = side * (XE - 0.04);
      // a great felt hanging over the door, lit from the vault
      s.structure(() => {
        g.mat('cast', '#3d332a'); g.tube([[fx + inX * 0.05, 6.2, ZC - 3.2], [fx + inX * 0.05, 6.2, ZC + 3.2]], 0.025, { segs: 6 });
        g.mat('felt', side < 0 ? '#8c2c26' : '#9a3b22');
        g.sheet([fx + inX * 0.07, 6.15, ZC + side * 3.0], [fx + inX * 0.07, 6.15, ZC - side * 3.0], [fx + inX * 0.07, 3.15, ZC - side * 3.0], [fx + inX * 0.07, 3.15, ZC + side * 3.0], { nu: 18, nv: 6, ripple: 0.05, rippleN: 9 });
        g.mat('felt', C.saffron); g.sheet([fx + inX * 0.075, 3.4, ZC + side * 3.0], [fx + inX * 0.075, 3.4, ZC - side * 3.0], [fx + inX * 0.075, 3.25, ZC - side * 3.0], [fx + inX * 0.075, 3.25, ZC + side * 3.0], { nu: 18, nv: 1, ripple: 0.05, rippleN: 9 });
      });
      prop(s, 'hall.rose', fx + inX * 0.16, 5.05, ZC, side < 0 ? Math.PI / 2 : -Math.PI / 2, { r: 1.05 });
      sign(s, { kind: 'fascia', text: side < 0 ? 'The Long Table' : 'Lids On', sub: side < 0 ? 'four hundred seats' : 'lift it when it reaches you', palette: ['#2e2a24', '#f0e2c0', '#d1952c'] }, fx + inX * 0.12, 3.72, ZC, { face: side < 0 ? 'X' : 'x', w: 3.0, h: 0.5 });
      s.light({ at: [xw + inX * 0.6, 4.95, ZC], color: warm(2800), power: 7, range: 8, lamp: true, clip, radius: 0.6 });
      s.light({ at: [xw + inX * 1.3, 2.6, ZC], color: warm(2800), power: 2.2, range: 4.5, lamp: true, clip, radius: 0.15 });
      // the door surround and the double doors
      s.structure(() => {
        g.mat('wood', C.wood);
        g.box(fx + inX * 0.02 - 0.06, 0, ZC - DOOR_W / 2 - 0.2, fx + inX * 0.02 + 0.06, DOOR_H + 0.25, ZC - DOOR_W / 2, { bevel: 0.015 });
        g.box(fx + inX * 0.02 - 0.06, 0, ZC + DOOR_W / 2, fx + inX * 0.02 + 0.06, DOOR_H + 0.25, ZC + DOOR_W / 2 + 0.2, { bevel: 0.015 });
        g.box(fx + inX * 0.02 - 0.07, DOOR_H, ZC - DOOR_W / 2 - 0.25, fx + inX * 0.02 + 0.07, DOOR_H + 0.3, ZC + DOOR_W / 2 + 0.25, { bevel: 0.02 });
      });
      const dx = side * 61.85;
      door(s, { x: dx, y: 0, z: ZC - DOOR_W / 2, w: DOOR_W / 2, h: DOOR_H - 0.02, along: 'z', dir: 1, swing: side, style: 'glazed', tint: '#7a2f28', auto: true, label: 'the hall' });
      door(s, { x: dx, y: 0, z: ZC + DOOR_W / 2, w: DOOR_W / 2, h: DOOR_H - 0.02, along: 'z', dir: -1, swing: -side, style: 'glazed', tint: '#7a2f28', auto: true, label: 'the hall' });
      // coat stands either side of the door
      for (const dz of [-2.0, 2.0]) {
        prop(s, 'hall.coatstand', xw + inX * 0.5, 0, ZC + dz, R.f(0, 6), {});
        if (R.chance(0.8)) prop(s, 'hall.coat', xw + inX * 0.5 + 0.12, 1.66, ZC + dz, side < 0 ? Math.PI / 2 + 0.2 : -Math.PI / 2 - 0.2, { col: R.pick(COAT_COLS), len: 0.9 });
      }
      // chat by the door, people meeting before they sit
      for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + (side > 0 ? 0.5 : 0); const cx = xw + inX * 2.8, cz = ZC + side * 4.2; s.spot('chat', cx + Math.sin(a) * 0.6, 0, cz + Math.cos(a) * 0.6, a + Math.PI, { tags: ['hall', 'door'] }); }
    }
    // frames round the two kitchen doors, worn pale at hand height, and a plate over each
    for (const kd of KDOOR) {
      s.structure(() => {
        g.mat('wood', C.wood);
        g.box(kd[0] - 0.14, 0, ZN, kd[0], 2.3, ZN + 0.06, { bevel: 0.01 }); g.box(kd[1], 0, ZN, kd[1] + 0.14, 2.3, ZN + 0.06, { bevel: 0.01 });
        g.box(kd[0] - 0.18, 2.2, ZN, kd[1] + 0.18, 2.36, ZN + 0.08, { bevel: 0.012 });
        g.mat('wood', '#8a6a4a'); for (const xx of [kd[0] - 0.07, kd[1] + 0.07]) g.box(xx - 0.05, 1.0, ZN + 0.06, xx + 0.05, 1.3, ZN + 0.062);
      });
      sign(s, { kind: 'plate', text: 'KITCHEN', sub: 'mind the lids' }, (kd[0] + kd[1]) / 2, 2.55, ZN + 0.02, { face: 'Z' });
    }
    // the volunteers' board and the gin plate by the east kitchen door; seating and lids by the west one
    sign(s, SIGNS['hall.volunteers'], 16.4, 2.35, ZN + 0.02, { face: 'Z', w: 1.5, h: 1.05 });
    sign(s, SIGNS['hall.gin'], 13.7, 1.45, ZN + 0.02, { face: 'Z' });
    sign(s, SIGNS['hall.lids'], -15.6, 1.55, ZN + 0.02, { face: 'Z' });
    sign(s, SIGNS['hall.seated'], -16.15, 1.55, ZN + 0.02, { face: 'Z' });
    sign(s, { kind: 'poster', title: 'One Long Table', lines: ['Marit Vell\'s Hall', 'Four hundred seats', 'Sit by someone'], palette: ['#283062', '#f0d070', '#e9dcc0'], motif: 'table' }, -61.66, 1.75, ZC + 3.6, { face: 'X', w: 0.8, h: 1.15 });

    // the chalkboards on easels at the central arch, one per day (see the day scopes below)
    prop(s, 'hall.easel', -2.2, 0, -15.6, 0.25, {});
    prop(s, 'hall.easel', 2.4, 0, -15.6, -0.2, {});

    // ======================= Booking Day, two days off: half dressed =======================
    // bunting along both sides of the vault in the east half; the west half still in its crates
    const BUNT = ['#c9552e', '#e7b547', '#2f6c66', '#e9e2d0', '#8c2c26', '#283062', '#d6a640'];
    const swag = (x0, x1, lvl) => { for (const zz of [ZN + 0.6, ZS - 0.6]) bunting(s, [x0, 4.7, zz], [x1, 4.7, zz], { colors: BUNT, sag: 0.45, drop: 0.24 }); void lvl; };
    for (let i = 0; i < PIERS.length - 1; i++) if (PIERS[i] >= -3.5) swag(PIERS[i], PIERS[i + 1]);
    // across the room, high, every other bay from the middle eastward
    for (let i = 0; i < PIERS.length; i++) if (PIERS[i] > 0 && i % 2 === 0) bunting(s, [PIERS[i], 5.2, ZN + 0.4], [PIERS[i], 5.2, ZS - 0.4], { colors: BUNT, sag: 1.0, drop: 0.26 });
    // the work in progress, gone by Booking Day: a ladder, bunting half strung, a basket of more,
    // and Mags rehanging felt in the stripped coffer with a tall ladder and rolls of new felt
    const prep = W.scope('hall.prep', f); const pg = prep.g;
    prop(prep, 'hall.ladder', -4.4, 0, ZN + 1.3, 0.1, { h: 2.7 });
    bunting(prep, [-3.5, 4.7, ZN + 0.6], [-5.6, 3.3, ZN + 1.1], { colors: BUNT, sag: 0.2 });
    prep.detail(() => { pg.mat('cane', '#c49a5a'); pg.lathe(-5.5, ZN + 1.6, [[0.18, 0], [0.24, 0.06], [0.26, 0.3], [0.25, 0.32]], { segs: 14, capTop: false }); pg.mat('weave', '#e7b547'); pg.ball(-5.5, 0.28, ZN + 1.6, 0.22, 0.07, 0.22, { segs: 10, rings: 4 }); });
    prep.spot('work', -4.4, 0, ZN + 2.2, Math.PI, { tags: ['hall', 'bunting'] });
    prep.spot('stand', -5.4, 0, ZN + 2.4, Math.PI * 0.8, { tags: ['hall', 'bunting'] });
    prop(prep, 'hall.ladder', -28.0, 0, -18.3, Math.PI + 0.1, { h: 3.4, wood: '#a07a48' });
    prop(prep, 'hall.feltroll', -29.6, 0.16, -16.0, 0.2, { col: '#b0442c', len: 1.8 });
    prop(prep, 'hall.feltroll', -29.4, 0.16, -16.42, 0.25, { col: '#3a4888', len: 1.7, r: 0.13 });
    prep.spot('work', -28.0, 0, -17.5, Math.PI, { tags: ['hall', 'hang-felt'], who: 'mags' });
    prep.finish();
    prop(s, 'crate', -30.3, 0, ZS - 0.4, 0.0, { w: 0.9, h: 0.5, d: 0.6 });
    sign(s, SIGNS['hall.felt'], -30.3, 0.32, ZS - 0.705 - 0.002, { face: 'z', w: 0.7, h: 0.22, board: false });
    // crates arriving by the west door: loaves, wine, cloths
    const CRATES = [[-58.6, ZC + 3.9, 0.1, 'quayside.crate.loaves'], [-57.7, ZC + 4.3, -0.15, null], [-58.6, ZC + 3.9, 0.05, null, 0.42], [-58.0, ZC - 4.4, 0.2, null], [-57.2, ZC - 4.6, -0.1, null]];
    for (const c of CRATES) {
      prop(s, 'crate', c[0], c[4] || 0, c[1], c[2], { w: 0.7, h: 0.42, d: 0.5, wood: R.pick(['#b08d5e', '#9a7a4e']) });
      if (c[3] && SIGNS[c[3]]) sign(s, SIGNS[c[3]], c[0], 0.22, c[1] + 0.256, { face: 'Z', w: 0.55, h: 0.18, board: false });
    }
    sign(s, { kind: 'label', text: 'CELLARS · RING 2', sub: 'for the feast · glass' }, -57.7, 0.22, ZC + 4.56, { face: 'Z', w: 0.55, h: 0.18, board: false });
    prop(s, 'hall.stack', -58.0, 0.42, ZC - 4.4, 0, { n: 10, glaze: '#e9e1cf', r: 0.11 });

    // ======================= the day scopes: what changes from day to day =======================
    const dayScopes = [];
    for (let d = 1; d <= 3; d++) {
      const ds = W.scope('hall.day' + d, f); ds.visible = false; dayScopes.push(ds);
      const chalk = SIGNS['hall.chalk.' + d];
      if (chalk) sign(ds, chalk, -2.2 + Math.sin(0.25) * 0.05, 1.18, -15.6 + 0.1, { face: 'Z', w: 0.62, h: 0.9, tier: 's' });
      const count = [
        { kind: 'chalk', title: 'Booking Day', lines: ['In two days', 'Tomorrow is the Quiet', 'Bunting: anti end still to go', 'Felt: Mags, from eight', 'Lids washed: most'] },
        { kind: 'chalk', title: 'Booking Day', lines: ['Tomorrow', 'Today is the Quiet', 'Talk to someone', 'Lids washed: all', 'Bunting: nearly'] },
        { kind: 'chalk', title: 'Booking Day', lines: ['Today', 'The feast at one', 'Apples: Teodor', 'The vote at five', 'Flight at ten'] },
      ][d - 1];
      sign(ds, count, 2.4 - Math.sin(0.2) * 0.05, 1.18, -15.6 + 0.1, { face: 'Z', w: 0.62, h: 0.9, tier: 's' });
      if (d >= 2) {
        // the dressing goes on: more bunting each day
        const g2 = ds.g; void g2;
        for (let i = 0; i < PIERS.length - 1; i++) if (PIERS[i] < -3.5 && (d === 3 || PIERS[i] > -40)) for (const zz of [ZN + 0.6, ZS - 0.6]) bunting(ds, [PIERS[i], 4.7, zz], [PIERS[i + 1], 4.7, zz], { colors: BUNT, sag: 0.45, drop: 0.24 });
        for (let i = 0; i < PIERS.length; i++) if (PIERS[i] < 0 && i % 2 === 1 && (d === 3 || PIERS[i] > -30)) bunting(ds, [PIERS[i], 5.2, ZN + 0.4], [PIERS[i], 5.2, ZS - 0.4], { colors: BUNT, sag: 1.0, drop: 0.26 });
      }
      if (d === 3) {
        // Mags has finished: the stripped coffer is rehung in new felt
        ds.structure((gg) => { gg.mat('felt', '#b0442c'); feltPanel(gg, 0.5 + 0.035, 0.75 - 0.035, RIBS[5] + 0.3, RIBS[6] - 0.3, 0.12, 4); });
        // the feast laid: an apple between every two places, cheese boards, bread
        const R3 = new Rng(303);
        for (let k = 0; k < seats.length; k += 2) {
          const st = seats[k]; const ez = ZC - st.face * 0.12;
          ds.detail((gg) => { gg.mat('glaze', '#b8463a', { rough: -0.25 }); gg.ball(st.x + 0.29, TOP_Y + 0.04, ez, 0.04, 0.038, 0.04, { segs: 9, rings: 6 }); gg.mat('bark', '#5a4030'); gg.tube([[st.x + 0.29, TOP_Y + 0.075, ez], [st.x + 0.3, TOP_Y + 0.095, ez]], 0.004, { segs: 3 }); });
          if (k % 8 === 0) ds.detail((gg) => { gg.mat('wood', '#a97a4a'); gg.box(st.x - 0.25, TOP_Y, ZC - 0.12, st.x + 0.25, TOP_Y + 0.02, ZC + 0.12, { bevel: 0.006 }); gg.mat('plain', '#e8c87a', { rough: 0.1 }); for (let j = 0; j < 3; j++) gg.box(st.x - 0.18 + j * 0.13, TOP_Y + 0.02, ZC - 0.05, st.x - 0.1 + j * 0.13, TOP_Y + 0.06, ZC + 0.05, { bevel: 0.006 }); });
          void R3;
        }
      }
      ds.finish();
    }
    const showDay = () => { const d = Math.max(1, Math.min(3, (game.clock && game.clock.day) || 1)); for (let i = 0; i < 3; i++) dayScopes[i].visible = i + 1 === d; prep.visible = d < 3; };
    showDay();
    let lastDay = -1;
    game.events.on('update', () => { const d = game.clock ? game.clock.day : 1; if (d !== lastDay) { lastDay = d; showDay(); } });

    // ======================= light =======================
    roomGlow(s, -62, 0, -27.5, 62, H, -14, { sky: '#ffd8a6', ground: '#b88a5e', power: 0.13 });
    // the court's daylight, spilling in through the arches
    s.ambient({ box: [-28, 0, -18.5, 28, 5, -14], sky: '#fff1dc', ground: '#d9c4a4', power: 0.22, lamp: true, soft: 2.5 });
    for (const x of [-21, -7, 7, 21]) s.light({ at: [x, 3.6, -12.6], color: warm(4300), power: 3.2, range: 9, lamp: true, radius: 1.2, clip: [-28.2, -0.3, -20, 28.2, 5.2, -13.9] });

    // ======================= the passages from Ladle Row =======================
    for (const side of [-1, 1]) buildPassage(s, g, side, R);

    // ======================= people =======================
    const P = (pts, o) => s.path(pts, o);
    const XS = [-60.5, -59.5, -52.5, -45.5, -38.5, -31.5, -24.5, -21, -17.5, -14, -13, -11.95, -10.5, -7, -3.5, 0, 3.5, 7, 10.5, 11.95, 13, 14, 17.5, 21, 24.5, 31.5, 38.5, 45.5, 52.5, 59.5, 60.5];
    P(XS.map((x) => [x, ZC - 3.55]));                         // the north aisle, behind the diners
    P(XS.map((x) => [x, ZC + 3.55]));                         // the south aisle, along the arches
    for (const sx of [-1, 1]) {
      P([[sx * 60.5, ZC - 3.55], [sx * 60.5, ZC], [sx * 60.5, ZC + 3.55]]);
      P([[sx * 60.5, ZC], [sx * 63.75, ZC], [sx * 63.75, -12], [sx * 63.75, -4], [sx * 63.75, 0]]);
      P([[sx * 13, ZC - 3.55], [sx * 13, ZC], [sx * 13, ZC + 3.55]]);           // the crossings in the table
      P([[sx * 11.95, ZC - 3.55], [sx * 11.95, -27.5], [sx * 11.95, -28.8]]);    // to the kitchen doors
    }
    for (const x of [-21, -14, -7, 0, 7, 14, 21]) P([[x, ZC + 3.55], [x, -14], [x, -11]]);   // out through the arches into the court
    // chat at the arches
    for (const cx of [-14, 14]) for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + cx; s.spot('chat', cx + Math.sin(a) * 0.55, 0, -15.6 + Math.cos(a) * 0.55, a + Math.PI, { tags: ['hall', 'arch'] }); }
    // Marit, when she is out front, and the volunteers who walk the table with the lids
    s.spot('stand', 0, 0, ZN + 1.0, 0, { tags: ['hall', 'host'], who: 'marit' });
    for (const x of [-30, -20, 20, 30, 45]) s.spot('work', x, 0, ZC - 2.0, 0, { tags: ['hall', 'serve', 'lids'] });

    // ======================= things to do =======================
    let seated = null;
    const say = async (who, lines) => { if (game.ui) { game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } } };
    const find = (id) => { if (game.journal && game.journal.find) game.journal.find(id); };
    const sitAt = (st) => {
      const p = game.player; if (!p) return;
      p.sit({ x: st.x, y: 0.46, z: st.z, yaw: st.face > 0 ? Math.PI : 0, eye: 1.15 });
      p.yaw = st.face > 0 ? Math.PI : 0; p.pitch = -0.18;
      seated = st;
      if (game.audio) game.sfxAt('clunk', f, st.x, 0.4, st.z, { vol: 0.3 });
      if (Math.abs(st.x) > 40) find('long-table');
      if (game.ui && !game.flags.hallSatOnce) { game.flags.hallSatOnce = true; game.ui.toast('Seated next to someone. That is the point.', { kind: 'info' }); }
    };
    const stand = () => { if (game.player) { const st = seated; game.player.stand(); if (st) { game.player.pos.x = st.x; game.player.pos.z = st.z - st.face * 0.75; } } seated = null; };
    // one interaction every four seats; it seats you at the nearest free place along that stretch
    const bySide = [seats.filter((q) => q.face > 0), seats.filter((q) => q.face < 0)];
    for (const list of bySide) {
      for (let i = 1; i < list.length; i += 4) {
        const st = list[i];
        const group = list.slice(Math.max(0, i - 2), Math.min(list.length, i + 3));
        s.interact({
          x: st.x, y: 0.55, z: st.z, radius: 1.3, prompt: 'Sit at the long table', enabled: () => !seated,
          onUse(gm) { const px = gm.player.pos.x; let best = group[0]; for (const q of group) if (Math.abs(q.x - px) < Math.abs(best.x - px)) best = q; sitAt(best); },
        });
      }
    }
    s.interact({
      radius: 1.2, priority: 1.5, prompt: 'Stand up', enabled: () => !!seated && !!(game.player && game.player.seat),
      pos: () => seated ? [seated.x, TOP_Y + 0.05, seated.z + seated.face * 0.45] : null,
      onUse() { stand(); },
    });
    game.events.on('update', () => { if (seated && game.player && !game.player.seat) seated = null; });

    // the Nine: taste it
    for (let i = 0; i < nines.length; i += 2) {
      const n = nines[i];
      s.interact({
        x: n[0], y: TOP_Y + 0.08, z: n[1], radius: 1.0, prompt: 'Have some Nine',
        async onUse(gm) {
          if (gm.audio) gm.sfxAt('lid-up', f, n[0], TOP_Y + 0.1, n[1], { vol: 0.5 });
          gm.flags.nineTasted = (gm.flags.nineTasted || 0) + 1;
          const lines = gm.flags.nineTasted === 1
            ? ['Bitter first, then salt, then something like broth that stays on the tongue.', 'Nine amino acids in a paste. Someone along the table says, have some Nine, you look peaky.']
            : ['Still bitter. You are starting to like it, which everyone says happens.'];
          await say('The Nine', lines);
          if (gm.audio) gm.sfxAt('lid-down', f, n[0], TOP_Y + 0.1, n[1], { vol: 0.5 });
        },
      });
    }
    // lift a lid at a laid place
    const lidSpots = laid.filter((q, i) => i % 7 === 3);
    for (const st of lidSpots) {
      const ez = ZC - st.face * 0.31;
      s.interact({
        x: st.x, y: TOP_Y + 0.12, z: ez, radius: 0.9, prompt: 'Lift the lid',
        async onUse(gm) {
          if (gm.audio) gm.sfxAt('lid-up', f, st.x, TOP_Y + 0.1, ez);
          find('lids');
          await say('A lidded bowl', ['Steam, and the smell of broth. Then, in this air, the cold coming at it straight away.', 'You put the lid back. Somebody down the table nods.']);
          if (gm.audio) gm.sfxAt('lid-down', f, st.x, TOP_Y + 0.1, ez);
        },
      });
    }
    // the chalkboards
    const chalkText = (d) => { const c = SIGNS['hall.chalk.' + d]; return c ? c.lines.join('. ') + '.' : ''; };
    s.interact({
      x: -2.2, y: 1.2, z: -15.5, radius: 1.3, prompt: 'Read the chalkboard',
      async onUse(gm) {
        const d = Math.max(1, Math.min(3, gm.clock.day)); const c = SIGNS['hall.chalk.' + d];
        if (gm.audio) gm.sfx('chalk', { vol: 0.4 });
        if (gm.ui) gm.ui.card({ kicker: "Marit Vell's Hall", title: c ? c.title : 'Today', text: chalkText(d), dur: 7 });
        if (d === 2) find('quiet-savings');
      },
    });
    s.interact({
      x: 2.4, y: 1.2, z: -15.5, radius: 1.3, prompt: 'Read the countdown',
      async onUse(gm) {
        const d = Math.max(1, Math.min(3, gm.clock.day));
        const t = ['Booking Day in two days. Tomorrow is the Quiet. The anti end still wants its bunting, and Mags is up the ladder from eight.', 'Booking Day tomorrow. Today is the Quiet: no worlds, no messages, and someone has written talk to someone underneath in a different chalk.', 'Booking Day: the feast at one, Teodor on the apples, the vote at five and the Flight at ten.'][d - 1];
        if (gm.ui) gm.ui.card({ kicker: 'The chalkboard', title: 'Booking Day', text: t, dur: 7 });
      },
    });
    // the volunteers' board, the gin plate, the seating notice
    s.interact({
      x: 16.4, y: 2.0, z: ZN + 0.1, radius: 1.6, prompt: 'Read the volunteers board',
      async onUse(gm) { if (gm.ui) gm.ui.card({ kicker: 'Volunteers', title: 'Eleven volunteers and a cook', text: SIGNS['hall.volunteers'].lines.join('. ') + '. Nine of the eleven are over seventy.', dur: 7 }); find('aunts-dish'); },
    });
    s.interact({
      x: 13.7, y: 1.45, z: ZN + 0.1, radius: 1.2, prompt: 'Read the brass plate',
      async onUse(gm) {
        if (gm.clock.hours >= 18) { find('gin'); await say('A brass plate', ['Gin after six. In the halls only.', 'It is after six. Somebody behind the pass is already setting out the lidded glasses.']); }
        else await say('A brass plate', ['Gin after six. In the halls only.', 'Somebody has polished the word only until it is the brightest thing on the plate.']);
      },
    });

    // order at the pass: the hall's menu, filtered by the day and the hour
    const orderAt = async (gm, x) => {
      const M = MENUS.hall; if (!M || !gm.ui) return;
      const d = gm.clock.day, hr = gm.clock.hours;
      const items = M.items.filter((it) => (!it.days || it.days.indexOf(d) >= 0) && (!it.hours || (hr >= it.hours[0] && hr < it.hours[1])))
        .map((it) => ({ id: it.id, name: it.name, desc: it.desc, price: M.guestFree && it.tag !== 'gin' ? 0 : it.price, tag: it.tag === 'gin' ? 'after six' : null }));
      if (!items.length) { await say('Marit', ['Nothing on the pass right now. Lamp-dawn jook from half six. Sit, if you like.']); return; }
      gm.busy++;
      let id = null;
      try { id = await gm.ui.menu({ kicker: 'The pass', title: M.title, note: (M.notes && M.notes[d]) || M.note, items, wallet: gm.wallet ? gm.wallet.kwh : undefined }); } finally { gm.busy--; }
      if (!id) return;
      const it = items.find((q) => q.id === id); if (!it) return;
      if (it.price > 0 && gm.wallet && !gm.wallet.spend(it.price, it.name)) return;
      if (gm.audio) { gm.sfxAt('plate', f, x, 1.0, ZN + 0.4); gm.sfxAt('lid-down', f, x, 1.0, ZN + 0.4, { delay: 0.3 }); }
      if (gm.ui) gm.ui.toast(it.name + ', under a lid', { kind: 'gain' });
      if (id === 'ramen') find('species-is-a-fat');
      if (id === 'aunts') find('aunts-dish');
      if (id === 'half-apple') find('apple-star');
      if (d === 2) find('quiet-savings');
      if (id === 'gin') find('gin');
      gm.flags.hallMeals = (gm.flags.hallMeals || 0) + 1;
    };
    for (const x of [-7, 0, 7]) {
      s.interact({
        x, y: 1.25, z: ZN + 0.25, radius: 1.5, kind: 'talk', prompt: 'Order at the pass',
        async onUse(gm) {
          if (!gm.ui) return;
          gm.busy++; let v = null;
          try { v = await gm.ui.choose('Marit', "Where did you sleep, and have you eaten?", [{ label: 'See what is on', value: 'menu' }, { label: 'Ask who is paid and who is not', value: 'paid' }, { label: 'Not yet. Later.', value: null }]); } finally { gm.busy--; }
          if (v === 'menu') await orderAt(gm, x);
          else if (v === 'paid') { await say('Marit', ['Me, for twelve hours a day, at six kays an hour, spread over four hundred seats. The eleven are not paid. Guests pay nothing.', 'Comes to about two point seven a head. Cheapest good meal on the Row, and the slowest.']); find('hall-price'); }
        },
      });
    }

    // the long view from either end: find it by standing at the end of the table
    for (const sx of [-1, 1]) s.trigger({ box: [sx > 0 ? 58.4 : -61.6, 0, ZC - 0.9, sx > 0 ? 61.6 : -58.4, 2.5, ZC + 0.9], once: true, onEnter(gm) { if (gm.ui && !(gm.journal && gm.journal.isFound && gm.journal.isFound('long-table'))) gm.ui.toast('From here the far end of the table climbs.', { kind: 'info' }); } });

    // ======================= zones and sound =======================
    s.zoneBox({ id: 'hall', place: 'hall', box: [-62, -0.5, -27.5, 62, H, -14], name: "Marit Vell's Hall", sub: 'The long table', ambience: 'hall', reverb: 'hall', headroom: 3.2, env: { exposure: 1.0, autoKey: 0.15, warmth: 0.38, bloom: 0.07 } });
    let loops = null;
    game.events.on('zone', (e) => {
      const z = e && e.zone; if (!z || loops || !game.audio) return;
      if (z.place === 'hall' || z.place === 'kitchen') loops = [game.loopAt('kitchen', f, 0, 1.2, -31.5, { vol: 0.75, radius: 9 }), game.loopAt('murmur', f, 0, 1.2, ZC, { vol: 0.5, radius: 30, param: 0.6 })];
    });

    s.finish();
    game.spawns.hall = { frame: f, x: -8, y: 0, z: ZC - 3.4, yaw: Math.PI / 2 };
    game.spawns['hall-east'] = { frame: f, x: 60.6, y: 0, z: ZC, yaw: -Math.PI / 2 };
    game.spawns['hall-court'] = { frame: f, x: 0, y: 0, z: -11, yaw: 0 };
  },
};

// One passage from Ladle Row (z = -4) to an end door of the hall (x = +-62). side: -1 west, +1 east.
function buildPassage(s, g, side, R) {
  const xa = side > 0 ? 62 : -65.5, xb = side > 0 ? 65.5 : -62, z0 = -27.5, z1 = -4, h = 3.2, xm = (xa + xb) / 2;
  const clipP = [xa - 0.05, -0.3, z0, xb + 0.05, h + 0.1, z1 + 0.6];
  floor(s, xa, z0, xb, z1, 0, 'terrazzo', '#cdb89a');
  ceiling(s, xa, z0, xb, z1, h, 'paint', '#efe4d0');
  s.structure(() => { g.mat('terrazzo', '#8a3a2e'); for (let z = z0; z < z1; z += 8) g.box(xm - 0.35, 0, Math.max(z0 + 0.2, z), xm + 0.35, 0.003, Math.min(z1, z + 8), { faces: 'Y' }); });
  const wo = { t: 0.24, tint: '#e6d2b0', dado: { h: 1.1, mat: 'tile', tint: '#2f6c66' }, skirt: '#2e1d13' };
  const outer = side > 0 ? 65.38 : -65.38, inner = side > 0 ? 62.12 : -62.12;
  wall(s, outer, z0, outer, z1, 0, h, wo);
  wall(s, inner, -14, inner, z1, 0, h, wo);                     // the hall's own end wall makes the rest of this side
  wall(s, xa, -27.38, xb, -27.38, 0, h, wo);
  // the archway onto Ladle Row
  wall(s, xa, -4.12, xb, -4.12, 0, h, { t: 0.24, tint: '#d8bf98', skirt: false, openings: [{ at: 0.35, w: 2.8, h: 2.75 }] });
  s.structure(() => {
    g.mat('plaster', '#d8bf98'); const pts = archFill(g, xa + 0.35, xa + 3.15, -4.24, -4.0, 2.3, 2.75, 8);
    g.mat('stone', '#c9b79a'); archMould(g, pts, -3.96, 0.045);
    g.box(xa + 0.15, 0, -4.3, xa + 0.4, 0.45, -3.94, { bevel: 0.015 }); g.box(xa + 3.1, 0, -4.3, xa + 3.35, 0.45, -3.94, { bevel: 0.015 });
  });
  sign(s, SIGNS['hall.fascia'], xm, 3.0, -3.96, { face: 'Z', w: 3.2, h: 0.42, board: true, back: '#2e3d36', glow: 0.4 });
  s.structure(() => { g.mat('cast', '#2e2a24'); g.tube([[xm + side * 1.55, 2.55, -3.95], [xm + side * 1.55, 2.55, -3.3], [xm + side * 1.55, 2.45, -3.3]], 0.015, { segs: 5 }); });
  sign(s, { kind: 'hanging', text: 'THE RING 2 HALL', emblem: 'ladle', palette: ['#f0e2c0', '#8c2c26', '#c58a2c'] }, xm + side * 1.55, 2.1, -3.3, { face: 'X', double: true, w: 0.6, h: 0.6 });
  lamp(s, 'bulb', xm, 2.9, -3.4, { power: 0.6, range: 4, K: 2800, clip: [xa - 1, -0.3, -4.2, xb + 1, 3.4, -2] });
  // lamps down the passage, warm, with a darker stretch in the middle
  for (const z of [-24.5, -18.5, -11, -6]) lamp(s, 'panel', xm, h, z, { w: 1.0, d: 0.45, K: 2900, power: z === -18.5 ? 0.55 : 0.8, clip: clipP });
  roomGlow(s, xa, 0, z0, xb, h, z1, { sky: '#ffdcae', ground: '#c9a57c', power: 0.2 });
  // the hall's door frame on the passage side
  s.structure(() => {
    const fx = side > 0 ? 62.0 : -62.0, o = side > 0 ? 1 : -1;
    g.mat('wood', C.wood);
    g.box(Math.min(fx, fx + o * 0.08), 0, ZC - DOOR_W / 2 - 0.18, Math.max(fx, fx + o * 0.08), DOOR_H + 0.2, ZC - DOOR_W / 2, { bevel: 0.012 });
    g.box(Math.min(fx, fx + o * 0.08), 0, ZC + DOOR_W / 2, Math.max(fx, fx + o * 0.08), DOOR_H + 0.2, ZC + DOOR_W / 2 + 0.18, { bevel: 0.012 });
    g.box(Math.min(fx, fx + o * 0.09), DOOR_H, ZC - DOOR_W / 2 - 0.22, Math.max(fx, fx + o * 0.09), DOOR_H + 0.26, ZC + DOOR_W / 2 + 0.22, { bevel: 0.015 });
  });
  sign(s, { kind: 'plate', text: "MARIT VELL'S HALL", sub: 'four hundred seats · lids on' }, side > 0 ? 62.03 : -62.03, 1.55, ZC + 1.3, { face: side > 0 ? 'X' : 'x' });
  // a bench, coat hooks with coats, posters, a planter at the mouth
  const bx = side > 0 ? 65.0 : -65.0;
  s.solid(bx - 0.2, 0, -14, bx + 0.2, 0.49, -9.2);
  s.furniture(() => { g.at(bx, 0, -11.6, Math.PI / 2); benchGeo(g, -2.4, 2.4, 0, '#5a3a24', side > 0 ? '#283062' : '#8c2c26'); g.pop(); });
  for (let k = 0; k < 4; k++) s.spot('sit', bx, 0.48, -13.4 + k * 1.2, side > 0 ? -Math.PI / 2 : Math.PI / 2, { tags: ['hall', 'wait', 'passage'] });
  s.structure(() => { g.mat('wood', '#5a3826'); g.box(Math.min(outer - side * 0.12, outer - side * 0.15), 1.68, -21.5, Math.max(outer - side * 0.12, outer - side * 0.15), 1.8, -17.5, { bevel: 0.006 }); });
  for (let z = -21.2; z < -17.6; z += 0.42) if (R.chance(0.55)) prop(s, 'hall.coat', outer - side * 0.12, 1.74, z, side > 0 ? -Math.PI / 2 : Math.PI / 2, { col: R.pick(['#6e7f3a', '#2f6f8f', '#8a3a2e', '#d6a640', '#5b4060', '#3a3a44']), patch: R.chance(0.5) ? '#e0b04a' : null, len: R.f(0.8, 1.0) });
  sign(s, side > 0 ? SIGNS['poster.booking'] : SIGNS['poster.flight'], outer - side * 0.13, 1.75, -8.0, { face: side > 0 ? 'x' : 'X' });
  sign(s, side > 0 ? SIGNS['poster.dawn'] : SIGNS['poster.reels'], outer - side * 0.13, 1.75, -7.2, { face: side > 0 ? 'x' : 'X' });
  sign(s, SIGNS['hall.seated'], inner + side * 0.13, 1.55, -8.4, { face: side > 0 ? 'X' : 'x' });
  planter(s, xm + side * 1.15, 0, -5.0, { w: 0.9, d: 0.5, h: 0.55, plants: 'herbs', tint: '#8a5a3c' });
  lamp(s, 'sconce', outer - side * 0.13, 2.1, -12.5, { face: side > 0 ? 'x' : 'X', K: 2700, power: 0.7, clip: clipP });
  // a picture rail on both walls, a pipe run along the ceiling, the hall's hours on a board
  const innerF = inner + side * 0.12, outerF = outer - side * 0.12;
  s.structure(() => {
    g.mat('wood', '#5a3826');
    for (const [wf, dir, za] of [[innerF, side, -14], [outerF, -side, z0 + 0.12]]) g.box(Math.min(wf, wf + dir * 0.025), 2.35, za, Math.max(wf, wf + dir * 0.025), 2.4, z1 - 0.12);
    g.mat('cast', '#2f6c66'); const pp = []; for (let z = z0 + 0.2; z <= z1 - 0.1; z += 3) pp.push([outerF - side * 0.18, h - 0.15, Math.min(z, z1 - 0.1)]); g.tube(pp, 0.035, { segs: 8 });
    g.mat('cast', '#b8863b'); for (let z = z0 + 1; z < z1; z += 2.5) g.box(outerF - side * 0.18 - 0.05, h - 0.2, z - 0.02, outerF - side * 0.18 + 0.05, h, z + 0.02);
  });
  sign(s, { kind: 'board', title: "Marit Vell's Hall", lines: ['Lamp-dawn jook|06:30', 'The table opens|11:30', 'Ramen, Thursdays|13:00', 'Gin|after six', 'Lamps down|23:00'], palette: ['#2a1c14', '#f3e6c8', '#d1952c'] }, innerF + side * 0.005, 1.65, -10.6, { face: side > 0 ? 'X' : 'x', w: 1.3, h: 0.9 });
  sign(s, SIGNS[side > 0 ? 'poster.homecoming' : 'poster.choir'], innerF + side * 0.005, 1.7, -7.0, { face: side > 0 ? 'X' : 'x', w: 0.55, h: 0.8 });
  // the dead end past the hall door: spare benches stood on end, chairs stacked, a crate of lids
  const sx = xm + side * 0.6;
  s.furniture(() => { g.at(sx - side * 0.9, 0, -26.6, 0); benchGeo(g, -1.2, 1.2, 0, '#6b4a2f', null); g.pop(); g.at(sx - side * 0.9, 0.46, -26.6, 0.04); benchGeo(g, -1.15, 1.15, 0, '#7a5233', null); g.pop(); });
  s.solid(sx - side * 0.9 - 1.2, 0, -26.8, sx - side * 0.9 + 1.2, 0.95, -26.4);
  for (let k = 0; k < 3; k++) prop(s, 'hall.chair', sx + side * 0.3, k * 0.47, -25.4, Math.PI * 0.5 * side + k * 0.08, { wood: ['#6b4a2f', '#2f4a44', '#8a6240'][k], back: 'rail' }, { noCollide: k > 0 });
  prop(s, 'crate', sx - side * 0.5, 0, -25.2, 0.2, { w: 0.6, h: 0.4, d: 0.45 });
  prop(s, 'hall.stack', sx - side * 0.5, 0.4, -25.2, 0, { n: 9, glaze: '#e9e1cf', r: 0.11 });
  // chat by the hall door
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; s.spot('chat', xm + Math.sin(a) * 0.55, 0, -23.6 + Math.cos(a) * 0.55, a + Math.PI, { tags: ['hall', 'passage'] }); }
  s.zoneBox({ id: 'hall-passage-' + (side > 0 ? 'east' : 'west'), place: 'hall', box: [xa, -0.5, z0, xb, h, z1], name: "Marit Vell's Hall", sub: side > 0 ? 'The spinward door' : 'The anti door', ambience: 'arcade', reverb: 'room', env: { exposure: 1.0, autoKey: 0.16, warmth: 0.3 } });
  void doorFrame;
}
