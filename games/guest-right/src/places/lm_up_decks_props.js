// The Simmer and the elders' rooms round it, on the High decks (deck 340, Ring Three, 0.55 g): the plan, the palette,
// small helpers and the props. Everything here is drawn at the origin with its front toward +z.
import { defineProp } from '../world/props.js';
import { shadeHex } from '../core/util.js';

export const PI = Math.PI;
export const REGION = 'up-decks';
export const GEE = 0.548;                           // deck 340: r = 3,000 - 4 x 339 = 1,644 m, so 1,644 / 3,000 of a g

// The plan (frame 'up-decks': x spinward, y up, z toward the back cap; deck 340's floor at y = 0, deck 341's at 4).
export const HALL = { x0: -15, x1: 15, z0: -34, z1: 34, wallH: 6.6, crown: 7.7 };
export const POOL = { x0: -8, x1: 8, z0: -25, z1: 24.6, water: -0.35, bottom: -2.9, floatZ: -19 };
// the shallows at the front end: steps down into the water, [z0, z1, top]
export const STEPS = [[-25, -24.4, -0.25], [-24.4, -22.8, -0.52], [-22.8, -21, -0.8], [-21, -19, -1.08]];
export const BAL = { y: 4, x: 13.3 };              // the balcony of deck 341's flats, x[13.3, 15] each side
export const LOBBY = { x0: -7, x1: 7, z0: -46, z1: -34, h: 3.4 };
export const TEA = { x0: -29, x1: -15, z0: -22, z1: -6, h: 3.3 };
export const TABLE = { x0: -37, x1: -15, z0: 2, z1: 18, h: 3.6 };
export const LANE = { x0: 15, x1: 63, z0: -1.6, z1: 1.6, h: 3.0 };
export const FOOT = { x0: 63, x1: 75, z0: -6, z1: 6, h: 3.4 };
export const GARDEN = { x0: 39.6, x1: 43.6, z0: -5.0, z1: -1.6, door: 41.6 };

export const PAL = {
  cream: '#efe4cc', bone: '#e4d4b2', sea: '#5f9f95', teal: '#2f6f6c', deep: '#1d4a4f', coral: '#cf6c45', ochre: '#dca043',
  plum: '#6b3b5c', wood: '#7a5233', dark: '#4a3220', brass: '#b08a45', pool: '#5fb3b3', ink: '#2a2218', paper: '#f2e8d2',
};

// the vault over the pool hall: a shallow arc across x, springing from the walls at wallH and rising to the crown
const VH = HALL.x1, VRISE = HALL.crown - HALL.wallH, VR = (VH * VH + VRISE * VRISE) / (2 * VRISE), VCY = HALL.crown - VR;
export function vaultY(x) { return VCY + Math.sqrt(Math.max(0, VR * VR - x * x)); }

// ---------------------------------------------------------------------------------------------------------------
// small helpers, safe when the UI or audio is missing
// ---------------------------------------------------------------------------------------------------------------
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: 7 }); }
export function card(game, kicker, title, text) { if (game.ui) game.ui.card({ kicker, title, text, dur: 11 }); }
export function sfx(game, name, f, x, y, z, o) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z, o); }
export function custom(game, term) { if (game.journal && game.journal.custom) game.journal.custom(term); }
// Wait a frame between big parts of the build, then take the region's atlas group back (another builder may have had it).
export async function tick(game) {
  await new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });
  if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + REGION);
}
// Run fn(a, b, i) over [a0, a1] in pieces no longer than `step` (long things are cut so the drum can bend them).
export function run(a0, a1, step, fn) { const n = Math.max(1, Math.ceil((a1 - a0) / step)); for (let i = 0; i < n; i++) fn(a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n, i); }
// A pick that is the same every time for the same key and list.
export function pick(list, k) { const v = Math.abs(Math.sin(k * 12.9898 + 78.233) * 43758.5453); return list[Math.floor((v - Math.floor(v)) * list.length) % list.length]; }

// ---------------------------------------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------------------------------------

// An upholstered armchair with a high seat and arms to push up from: what the old ask for. p: { cloth, wood, mend }
defineProp('updecks.armchair', (g, p) => {
  const wood = p.wood || '#5a3d28', cloth = p.cloth || '#8a3a3a';
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.28, 0, sz * 0.25], [sx * 0.27, 0.2, sz * 0.24]], [0.024, 0.02], { segs: 6 });
  g.box(-0.32, 0.18, -0.3, 0.32, 0.26, 0.28, { bevel: 0.015 });
  g.mat('weave', cloth);
  g.box(-0.27, 0.26, -0.24, 0.27, 0.49, 0.27, { bevel: 0.05 });                       // the seat cushion: 0.49 high
  g.box(-0.3, 0.3, -0.33, 0.3, 1.02, -0.18, { bevel: 0.06 });                         // the back
  for (const sx of [-1, 1]) g.box(sx * 0.27 - 0.06, 0.26, -0.3, sx * 0.27 + 0.06, 0.66, 0.27, { bevel: 0.045 });   // the arms
  g.mat('wood', shadeHex(wood, 1.2)); for (const sx of [-1, 1]) g.box(sx * 0.27 - 0.05, 0.66, -0.2, sx * 0.27 + 0.05, 0.69, 0.3, { bevel: 0.012 });
  if (p.mend) { g.mat('weave', p.mend); g.box(-0.14, 0.62, -0.183, 0.04, 0.78, -0.17, { bevel: 0.006 }); }
  return { solid: [[-0.33, 0, -0.33, 0.33, 0.49, 0.3]], spots: [{ type: 'sit', x: 0, y: 0.49, z: 0.02, yaw: 0 }], tier: 's' };
});

// A bench with a back and arms at both ends, long enough for three. p: { w, wood, cushion }
defineProp('updecks.bench', (g, p) => {
  const w = p.w || 1.8, wood = p.wood || '#7a5233';
  g.mat('wood', wood, { rough: -0.03 });
  for (let i = 0; i < 4; i++) { const z = -0.2 + i * 0.11; g.box(-w / 2, 0.44, z, w / 2, 0.47, z + 0.095, { bevel: 0.008 }); }
  for (let i = 0; i < 4; i++) g.box(-w / 2 + 0.05, 0.6 + i * 0.11, -0.27, w / 2 - 0.05, 0.68 + i * 0.11, -0.245 + i * 0.012, { bevel: 0.008 });
  g.mat('cast', p.metal || '#2f3a36');
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.04);
    g.tube([[x, 0, 0.24], [x, 0.44, 0.22], [x, 0.44, -0.23], [x, 0, -0.25]], 0.02, { segs: 6 });
    g.tube([[x, 0.44, -0.23], [x, 1.02, -0.3]], 0.02, { segs: 6 });
    g.tube([[x, 0.44, 0.2], [x, 0.66, 0.2], [x, 0.68, -0.05], [x, 0.7, -0.26]], 0.024, { segs: 6 });     // the arm, to push up on
  }
  if (p.cushion) { g.mat('weave', p.cushion); g.box(-w / 2 + 0.12, 0.47, -0.2, -w / 2 + 0.62, 0.53, 0.2, { bevel: 0.03 }); }
  const spots = []; const n = Math.max(1, Math.floor(w / 0.6));
  for (let i = 0; i < n; i++) spots.push({ type: 'sit', x: -w / 2 + (i + 0.5) * w / n, y: 0.47, z: 0.0, yaw: 0 });
  return { solid: [[-w / 2, 0, -0.27, w / 2, 0.47, 0.25]], spots, tier: 's' };
});

// A stand of walking sticks left by the water, each with a coloured band on it. p: { n, seed }
defineProp('updecks.sticks', (g, p) => {
  g.mat('glaze', '#2f6f6c'); g.lathe(0, 0, [[0, 0], [0.13, 0], [0.14, 0.04], [0.13, 0.42], [0.145, 0.45], [0.11, 0.45], [0.1, 0.06], [0, 0.06]], { segs: 16, capTop: false });
  const n = p.n || 5, cols = ['#cf6c45', '#dca043', '#6b3b5c', '#5f9f95', '#e8d9b8'];
  for (let i = 0; i < n; i++) {
    const a = i / n * PI * 2 + (p.seed || 0), tx = Math.cos(a) * 0.06, tz = Math.sin(a) * 0.06, lean = 0.05 + (i % 3) * 0.03;
    g.mat('wood', ['#6b4a2f', '#8a6240', '#4a3220', '#9a7448'][i % 4], { rough: -0.1 });
    const top = [tx + Math.cos(a) * lean * 2, 0.92 + (i % 2) * 0.05, tz + Math.sin(a) * lean * 2];
    g.tube([[tx, 0.06, tz], top], 0.012, { segs: 5 });
    g.tube([top, [top[0] + Math.cos(a) * 0.09, top[1] + 0.03, top[2] + Math.sin(a) * 0.09], [top[0] + Math.cos(a) * 0.12, top[1] - 0.03, top[2] + Math.sin(a) * 0.12]], 0.014, { segs: 5 });
    g.mat('weave', cols[i % cols.length]); g.cyl(top[0] * 0.8 + tx * 0.2, top[1] - 0.22, top[2] * 0.8 + tz * 0.2, 0.016, 0.05, { segs: 6 });
  }
  return { posts: [[0, 0, 0.14, 0, 0.45]] };
});

// A tiled pillar-urn of warm broth on the pool edge, with a brass tap and lidded cups in a rack under it.
defineProp('updecks.urn', (g, p) => {
  g.mat('tile', p.tile || '#cf6c45'); g.box(-0.32, 0, -0.32, 0.32, 0.9, 0.32, { bevel: 0.02, aoBottom: 0.6 });
  g.mat('tile', '#efe4cc'); g.box(-0.36, 0.9, -0.36, 0.36, 0.95, 0.36, { bevel: 0.015 });
  g.mat('cast', '#b08a45', { rough: -0.2 }); g.lathe(0, 0, [[0, 0.95], [0.2, 0.95], [0.22, 1.05], [0.23, 1.38], [0.19, 1.46], [0.08, 1.5], [0.06, 1.56], [0.03, 1.6], [0, 1.6]], { segs: 18 });
  g.tube([[0, 1.08, 0.2], [0, 1.08, 0.3], [0, 1.03, 0.33]], 0.016, { segs: 6 });
  g.mat('wood', '#3a2a1e'); g.box(-0.04, 1.11, 0.27, 0.04, 1.14, 0.31, { bevel: 0.005 });
  g.mat('wood', '#5a3d28'); g.box(-0.3, 0.55, 0.32, 0.3, 0.58, 0.46, { bevel: 0.006 });
  const cols = ['#efe4cc', '#5f9f95', '#dca043', '#cf6c45', '#e8d9b8'];
  for (let i = 0; i < 5; i++) {
    const x = -0.24 + i * 0.12; g.mat('glaze', cols[i]); g.lathe(x, 0.39, [[0, 0.58], [0.032, 0.58], [0.04, 0.66], [0, 0.65]], { segs: 10, capTop: false });
    g.mat('glaze', cols[(i + 2) % 5]); g.lathe(x, 0.39, [[0.043, 0.66], [0.012, 0.68], [0.012, 0.69], [0, 0.69]], { segs: 10, capBottom: false });
  }
  return { solid: [[-0.36, 0, -0.36, 0.36, 0.95, 0.36]], tier: 's' };
});

// A wooden float on the rope that marks the end of the shallows.
defineProp('updecks.float', (g, p) => {
  g.mat('paint', p.c || '#cf6c45', { rough: -0.2 }); g.ball(0, 0, 0, 0.13, 0.09, 0.13, { segs: 10, rings: 6 });
  g.mat('paint', '#efe4cc', { rough: -0.2 }); g.cyl(0, -0.02, 0, 0.135, 0.04, { segs: 10 });
  return { cast: false };
});

// The Carver: the oldest chair on the deck, a tall carved armchair with a high back, mended in three woods.
defineProp('updecks.carver', (g) => {
  const W1 = '#3a2416', W2 = '#5a3d28', W3 = '#8a6240';
  g.mat('wood', W1, { rough: -0.12 });
  for (const sx of [-1, 1]) {
    g.lathe(sx * 0.3, 0.26, [[0.04, 0], [0.035, 0.08], [0.045, 0.14], [0.03, 0.3], [0.035, 0.5]], { segs: 10 });
    g.lathe(sx * 0.3, -0.26, [[0.04, 0], [0.035, 0.1], [0.04, 0.5], [0.032, 0.9], [0.036, 1.4], [0.05, 1.46], [0.02, 1.56], [0, 1.58]], { segs: 10 });
  }
  g.box(-0.34, 0.45, -0.3, 0.34, 0.52, 0.3, { bevel: 0.015 });
  g.mat('wood', W2, { rough: -0.1 });
  for (const sx of [-1, 1]) { g.box(sx * 0.3 - 0.045, 0.72, -0.28, sx * 0.3 + 0.045, 0.76, 0.34, { bevel: 0.015 }); g.tube([[sx * 0.3, 0.52, 0.26], [sx * 0.3, 0.72, 0.3]], 0.025, { segs: 6 }); }
  for (let i = 0; i < 3; i++) g.box(-0.27, 0.66 + i * 0.26, -0.29, 0.27, 0.74 + i * 0.26, -0.25, { bevel: 0.012 });
  // the cresting rail, carved with a row of ladles
  g.mat('wood', W1, { rough: -0.12 }); g.box(-0.36, 1.34, -0.31, 0.36, 1.48, -0.24, { bevel: 0.02 });
  g.mat('wood', W3); for (let i = 0; i < 5; i++) { const x = -0.24 + i * 0.12; g.cyl(x, 1.39, -0.235, 0.03, 0.01, { segs: 10 }); }
  // a newer splat in a paler wood, the mend
  g.mat('wood', W3, { rough: -0.08 }); g.box(-0.08, 0.52, -0.28, 0.08, 1.34, -0.26, { bevel: 0.01 });
  // a cushion in the year's colour
  g.mat('weave', '#cf6c45'); g.box(-0.28, 0.52, -0.24, 0.28, 0.58, 0.27, { bevel: 0.03 });
  g.mat('weave', '#dca043'); g.box(-0.29, 0.545, 0.0, 0.29, 0.555, 0.04, { faces: 'xXyY' });
  return { solid: [[-0.36, 0, -0.31, 0.36, 0.58, 0.32]], tier: 's' };
});

// A watering can, for the gardens behind the doors. p: { c }
defineProp('updecks.can', (g, p) => {
  g.mat('cast', p.c || '#5f7f6a', { rough: -0.1 });
  g.lathe(0, 0, [[0, 0], [0.09, 0], [0.1, 0.02], [0.1, 0.2], [0.085, 0.24], [0, 0.245]], { segs: 14 });
  g.tube([[0.08, 0.06, 0], [0.2, 0.2, 0], [0.26, 0.29, 0]], [0.018, 0.014, 0.012], { segs: 6 });
  g.cyl(0.27, 0.29, 0, 0.03, 0.02, { segs: 8 });
  g.tube([[-0.07, 0.22, 0], [-0.04, 0.33, 0], [0.04, 0.33, 0], [0.07, 0.22, 0]], 0.009, { segs: 5 });
  return { cast: false };
});
