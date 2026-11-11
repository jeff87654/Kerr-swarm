// The Spice Rack and the Spouts (lm_chimney.js): the plan, small helpers, and the props of the place: still climbers on
// the walls, a child on a slide sack, lockers, a wall of loan shoes, chalk tubs, a first-aid cabinet and cot, heaps of soft
// blocks, and meshes that move.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { defineProp } from '../world/props.js';
import { shadeHex, mixHex, Rng } from '../core/util.js';

export const chimneyParts = true;
const PI = Math.PI;

// ---------------------------------------------------------------------------------------------------------------
// the plan (frame `chimney`, metres; deck 40 + k at y = 4k)
// ---------------------------------------------------------------------------------------------------------------
export const SH = { x0: -7, x1: 7, z0: -7, z1: 7, top: 32 };          // the shaft; its back (z1) and spinward (x1) faces are the walls
export const GO = { x: -10, z: -10 };                                  // the galleries' outer walls: anti arm x[-10, -7], front arm z[-10, -7]
export const NG = 7;                                                   // galleries on decks 41 to 47
export const BR = { x: 3.0, w: 1.4, k: 7 };                            // the bridge across the top, along z
export const HALL = { x0: -44, x1: 44, z0: -59.5, z1: -10, h: 19.6 };  // the Spouts
export const FOY = { x0: -26, x1: -10, z0: -10, z1: 10, h: 3.4 };      // the counter, changing room, first aid
export const LOB = { x0: -34, x1: -26, z0: -5, z1: 5, h: 3.4 };        // the cab lobby
export const CORE = { x0: -13, x1: -10, z0: -10, z1: -7 };             // the stair, beside the galleries' corner
export const STOP = 'chimney';
export const SUB = 'deck 40 · Ring Six';
export const PAL = {
  plaster: '#e6d8bf', cream: '#efe4cc', wood: '#7a5233', dark: '#2c3a40', teal: '#2f7d7a', red: '#c8452e', ochre: '#d9a23a',
  indigo: '#34417a', plum: '#6b3d5e', green: '#4f8a52', mat: '#2f5f9a', brass: '#b08a45',
};
export const ROUTE_COLS = ['#d8432f', '#e9c43d', '#2f9fa8', '#7a4aa0', '#4fa65a', '#e8873a', '#e06a9a', '#3a62b8', '#efe8da'];

// ---------------------------------------------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------------------------------------------
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: 7 }); }
export function sfx(game, name, f, x, y, z, o) { if (game.audio && game.sfxAt && f) game.sfxAt(name, f, x, y, z, o); }
export async function say(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(who, lines); } finally { game.busy--; }
}
export async function choose(game, who, prompt, opts) {
  if (!game.ui) return null;
  game.busy++;
  try { return await game.ui.choose(who, prompt, opts); } finally { game.busy--; }
}
export async function read(game, title, lines) {
  if (!game.ui) return;
  await say(game, { name: title, colour: '#FFD9A0' }, lines);
}
export function find(game, id) { if (game.journal) game.journal.find(id); }
// a seat the player can take: (x, y, z) the floor under it, yaw the way it faces (prop convention: 0 faces +z)
export function seat(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + 0.6, z, radius: o.radius || 1.0,
    prompt: (game) => (game.player.seat ? 'Stand up' : label),
    onUse(game) {
      const p = game.player; if (p.seat) { p.stand(); return; }
      p.sit({ x, y: y + (o.lift || 0), z, yaw: PI - yaw, eye: o.eye || 1.12 }); p.yaw = PI - yaw; p.pitch = o.pitch || 0.05;
      if (o.onSit) o.onSit(game);
    } });
}
// a little menu that spends from the wallet; items [{ id, name, desc, price }] -> the item or null
export async function buy(game, menu, kicker) {
  if (!game.ui) return null;
  game.busy++;
  try {
    const items = menu.items.map((it) => Object.assign({}, it, { disabled: game.wallet && it.price > game.wallet.kwh + 1e-6 }));
    const id = await game.ui.menu({ kicker: kicker || '', title: menu.title, note: menu.note, items, wallet: game.wallet ? game.wallet.kwh : 0 });
    if (!id) return null;
    const it = menu.items.find((q) => q.id === id); if (!it) return null;
    if (game.wallet && it.price > 0 && !game.wallet.spend(it.price, it.name)) return null;
    return it;
  } finally { game.busy--; }
}
// wait for the next frame between big parts of the build, and take the region's page of the sign atlas back
export function frameWait(game) {
  return new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; if (game && game.atlas && game.atlas.begin) game.atlas.begin('region:chimney'); res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });
}
// a mesh drawn once into its own buffer and moved by the world every frame from userData.origin
export function movable(s, draw, origin, o = {}) {
  const g = new Geo(new MeshBuf(1024, 2048)); draw(g);
  const mesh = new THREE.Mesh(g.buf.toGeometry(), s.world.mats.opaque);
  s.world.addRenderable(mesh, { frame: s.frame, origin: origin.slice(), center: o.center || [0, 0, 0], radius: o.radius || 2, far: o.far || 120, caster: !!o.caster, scope: s, level: o.level || 0 });
  s.meshes.push(mesh);
  return mesh;
}
// two-bone reach: from root a toward target t with lengths l1, l2, bending toward hint; returns the middle joint
export function reach(a, t, l1, l2, hint) {
  const d0 = [t[0] - a[0], t[1] - a[1], t[2] - a[2]]; let d = Math.hypot(d0[0], d0[1], d0[2]) || 1e-3;
  const dir = [d0[0] / d, d0[1] / d, d0[2] / d]; d = Math.min(d, l1 + l2 - 0.01);
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), up = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const hd = hint[0] * dir[0] + hint[1] * dir[1] + hint[2] * dir[2];
  let b = [hint[0] - hd * dir[0], hint[1] - hd * dir[1], hint[2] - hd * dir[2]]; const bl = Math.hypot(b[0], b[1], b[2]) || 1; b = [b[0] / bl, b[1] / bl, b[2] / bl];
  return [a[0] + dir[0] * along + b[0] * up, a[1] + dir[1] * along + b[1] * up, a[2] + dir[2] * along + b[2] * up];
}
// the end of a limb from root a toward t at exactly length l (when the hold is out of reach the hand stops short of it)
function toward(a, t, l) { const d = Math.hypot(t[0] - a[0], t[1] - a[1], t[2] - a[2]) || 1; const k = Math.min(1, l / d); return [a[0] + (t[0] - a[0]) * k, a[1] + (t[1] - a[1]) * k, a[2] + (t[2] - a[2]) * k]; }

// ---------------------------------------------------------------------------------------------------------------
// A climber on a wall. The wall is the plane z = 0 and the climber hangs in front of it (z < 0): the prop's front (+z)
// faces into the wall. p: { pose (0..5), top, bottom, skin, hair, harness, bag }. The rope ties in at (0, 0.04, -0.17).
// ---------------------------------------------------------------------------------------------------------------
const POSES = [
  { hR: [0.34, 0.62], hL: [-0.18, 0.86], fR: [0.24, -0.62], fL: [-0.26, -0.9], lean: 0.05 },
  { hR: [0.2, 0.92], hL: [-0.36, 0.5], fR: [0.3, -0.92], fL: [-0.2, -0.5], lean: 0.12 },
  { hR: [0.42, 0.42], hL: [-0.42, 0.44], fR: [0.3, -0.7], fL: [-0.32, -0.66], lean: 0.18 },
  { hR: [0.06, 1.0], hL: [-0.3, 0.7], fR: [0.36, -0.36], fL: [-0.16, -0.88], lean: 0.02 },
  { hR: [0.46, 0.2], hL: [-0.12, 0.96], fR: [0.14, -0.86], fL: [-0.44, -0.44], lean: 0.1 },
  { hR: [0.28, 0.4], hL: [-0.3, 0.38], fR: [0.22, -0.95], fL: [-0.24, -0.95], lean: 0.45 },     // resting back on the rope
];
export function drawClimber(g, p) {
  const P = POSES[(p.pose || 0) % POSES.length], skin = p.skin || '#b9825a', top = p.top || '#c8452e', bottom = p.bottom || '#34417a';
  const zb = -0.3 - P.lean;                             // how far the body hangs off the wall
  const pel = [0, 0, zb], chest = [0.02, 0.44, zb + 0.06 - P.lean * 0.3], neck = [0.02, 0.6, zb + 0.06 - P.lean * 0.35];
  const head = [0.02, 0.74, zb + 0.02 - P.lean * 0.45];
  const sh = (sx) => [chest[0] + sx * 0.19, chest[1] + 0.06, chest[2] + 0.02], hip = (sx) => [sx * 0.1, -0.06, zb + 0.02];
  const hand = (q) => [q[0], q[1], -0.05], foot = (q) => [q[0], q[1], -0.09];
  // torso, pelvis
  g.mat('weave', bottom); g.ball(pel[0], pel[1], pel[2], 0.155, 0.11, 0.12, { segs: 10, rings: 6 });
  g.mat('weave', top); g.tube([[pel[0], pel[1] + 0.04, pel[2]], [0.01, 0.22, zb + 0.03 - P.lean * 0.15], chest], [0.14, 0.135, 0.15], { segs: 10 });
  g.ball(chest[0], chest[1] + 0.02, chest[2], 0.18, 0.1, 0.12, { segs: 10, rings: 5 });
  g.mat('plain', skin); g.tube([chest, neck], 0.045, { segs: 6 });
  g.ball(head[0], head[1], head[2], 0.1, 0.12, 0.105, { segs: 12, rings: 8 });
  g.mat('weave', p.hair || '#2a1d14'); g.ball(head[0], head[1] + 0.015, head[2] - 0.012, 0.108, 0.12, 0.112, { segs: 12, rings: 5, bottom: 0.05 });
  // arms
  for (const sx of [1, -1]) {
    const s0 = sh(sx), tgt = hand(sx > 0 ? P.hR : P.hL), h1 = toward(s0, tgt, 0.56);
    const el = reach(s0, h1, 0.29, 0.28, [sx * 0.7, -0.6, -0.5]);
    g.mat('weave', top); g.tube([s0, el], [0.055, 0.048], { segs: 6 });
    g.mat('plain', skin); g.tube([el, h1], [0.042, 0.034], { segs: 6 }); g.ball(h1[0], h1[1], h1[2], 0.045, 0.05, 0.035, { segs: 6, rings: 4 });
    // legs
    const hp = hip(sx), ft = foot(sx > 0 ? P.fR : P.fL), f1 = toward(hp, ft, 0.84);
    const kn = reach(hp, f1, 0.43, 0.42, [sx * 1.0, 0.25, 0.35]);
    g.mat('weave', bottom); g.tube([hp, kn], [0.075, 0.062], { segs: 7 }); g.tube([kn, f1], [0.058, 0.046], { segs: 7 });
    g.mat('leather', p.shoe || '#3a2b24'); g.ball(f1[0], f1[1] - 0.02, f1[2] + 0.03, 0.05, 0.045, 0.11, { segs: 8, rings: 5 });
  }
  // harness: a waist belt, leg loops, the belay loop, and a chalk bag at the back
  g.mat('weave', p.harness || '#e9c43d');
  const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; ring.push([Math.cos(a) * 0.16, 0.05, zb + Math.sin(a) * 0.125]); }
  g.tube(ring, 0.02, { segs: 5, closed: true });
  for (const sx of [1, -1]) { const lr = []; for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2; lr.push([sx * 0.1 + Math.cos(a) * 0.08, -0.12, zb + Math.sin(a) * 0.075]); } g.tube(lr, 0.014, { segs: 4, closed: true }); }
  g.mat('cast', '#9aa3a6', { rough: -0.2 }); g.tube([[-0.02, 0.0, zb - 0.13], [0, 0.04, zb - 0.17], [0.02, 0.0, zb - 0.13]], 0.012, { segs: 5 });
  g.mat('weave', p.bag || '#8a2f3c'); g.cyl(0, -0.02, zb + 0.15, 0.06, 0.12, { segs: 8 });
  g.mat('plain', '#f4f1ea'); g.cyl(0, 0.1, zb + 0.15, 0.045, 0.01, { segs: 8 });
}
defineProp('lmchimney.climber', (g, p) => { drawClimber(g, p); return { tier: 's', cast: true }; });

// ---------------------------------------------------------------------------------------------------------------
// A child on a slide sack, sitting up, feet first along +x. p: { top, sack, skin, hair }
// ---------------------------------------------------------------------------------------------------------------
export function drawRider(g, p) {
  const skin = p.skin || '#a8714e', top = p.top || '#e9c43d';
  g.mat('weave', p.sack || '#8a2f3c'); g.ball(0.02, 0.06, 0, 0.36, 0.08, 0.2, { segs: 10, rings: 5 });
  g.mat('weave', p.bottom || '#34417a');
  for (const sz of [-1, 1]) g.tube([[-0.05, 0.14, sz * 0.08], [0.2, 0.24, sz * 0.09], [0.36, 0.13, sz * 0.08]], [0.05, 0.045, 0.04], { segs: 6 });
  g.mat('weave', top); g.tube([[-0.1, 0.14, 0], [-0.14, 0.45, 0]], [0.11, 0.12], { segs: 8 });
  for (const sz of [-1, 1]) g.tube([[-0.13, 0.42, sz * 0.12], [-0.02, 0.3, sz * 0.2], [0.1, 0.36, sz * 0.24]], 0.035, { segs: 5 });
  g.mat('plain', skin); g.ball(-0.15, 0.6, 0, 0.085, 0.1, 0.085, { segs: 10, rings: 6 });
  g.mat('weave', p.hair || '#2a1d14'); g.ball(-0.16, 0.62, 0, 0.09, 0.09, 0.09, { segs: 10, rings: 4, bottom: 0.1 });
}

// ---------------------------------------------------------------------------------------------------------------
// furniture
// ---------------------------------------------------------------------------------------------------------------
// A bank of lockers, n doors wide, each door its own old colour with a name card and a mended hinge here and there.
// p: { n, h, seed }
defineProp('lmchimney.lockers', (g, p) => {
  const n = p.n || 4, h = p.h || 1.9, w = 0.42, d = 0.48, W = n * w, r = new Rng(p.seed || 3);
  const cols = ['#2f7d7a', '#c8452e', '#d9a23a', '#34417a', '#6b3d5e', '#4f8a52', '#8a6a4a'];
  g.mat('paint', '#3a3f3c'); g.box(-W / 2, 0, -d / 2, W / 2, 0.1, d / 2 - 0.04);
  g.mat('paint', '#cfc4ae'); g.box(-W / 2, 0.1, -d / 2, W / 2, h, d / 2 - 0.02, { faces: 'xXyYz' });
  for (let i = 0; i < n; i++) {
    const x0 = -W / 2 + i * w + 0.015, x1 = x0 + w - 0.03, c = r.pick(cols);
    g.mat('paint', shadeHex(c, r.f(0.85, 1.1))); g.box(x0, 0.13, d / 2 - 0.03, x1, h - 0.03, d / 2, { bevel: 0.006 });
    g.mat('paint', shadeHex(c, 0.7)); for (let k = 0; k < 4; k++) g.box(x0 + 0.08, h - 0.32 + k * 0.04, d / 2, x1 - 0.08, h - 0.31 + k * 0.04, d / 2 + 0.004, { faces: 'Z' });
    g.mat('paper', '#efe6d0'); g.box(x0 + 0.1, h - 0.52, d / 2, x1 - 0.1, h - 0.42, d / 2 + 0.004, { faces: 'Z' });
    g.mat('cast', '#b08a45'); g.box(x1 - 0.07, 1.0, d / 2, x1 - 0.04, 1.12, d / 2 + 0.02, { bevel: 0.004 });
    if (r.chance(0.3)) { g.mat('cast', '#c8c2b6'); g.box(x0 - 0.01, 0.5, d / 2 - 0.01, x0 + 0.03, 0.62, d / 2 + 0.012); }
  }
  g.mat('paint', '#cfc4ae'); g.box(-W / 2 - 0.01, h - 0.02, -d / 2, W / 2 + 0.01, h + 0.02, d / 2 + 0.01, { bevel: 0.005 });
  return { solid: [[-W / 2, 0, -d / 2, W / 2, h, d / 2]], tier: 's' };
});

// A wall of loan shoes: pigeonholes, a pair in each, sized by the labels. p: { cols, rows, seed }
defineProp('lmchimney.shoewall', (g, p) => {
  const nc = p.cols || 8, nr = p.rows || 6, cw = 0.3, rh = 0.24, d = 0.34, W = nc * cw, H = nr * rh + 0.12, r = new Rng(p.seed || 7);
  const shoe = ['#3a2b24', '#2f5f9a', '#c8452e', '#4f8a52', '#d9a23a', '#6b3d5e', '#2c3a40', '#e8e0cc'];
  g.mat('wood', '#7a5a3a'); g.box(-W / 2 - 0.03, 0, -d / 2, W / 2 + 0.03, H, -d / 2 + 0.02, { faces: 'Z' });
  for (let i = 0; i <= nc; i++) g.box(-W / 2 + i * cw - 0.012, 0.06, -d / 2, -W / 2 + i * cw + 0.012, H, d / 2, { bevel: 0.004 });
  for (let j = 0; j <= nr; j++) g.box(-W / 2, 0.06 + j * rh - 0.012, -d / 2, W / 2, 0.06 + j * rh + 0.012, d / 2, { bevel: 0.004 });
  for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) {
    const cx = -W / 2 + (i + 0.5) * cw, y = 0.06 + j * rh + 0.012;
    g.mat('paper', '#efe6d0'); g.box(cx - 0.05, y - 0.006, d / 2 - 0.004, cx + 0.05, y + 0.03, d / 2 + 0.002, { faces: 'Z' });
    if (r.chance(0.18)) continue;                     // out on loan
    const c = r.pick(shoe), L = 0.17 + j * 0.012;
    g.mat('leather', c);
    for (const sx of [-1, 1]) { g.box(cx + sx * 0.06 - 0.04, y, -L / 2, cx + sx * 0.06 + 0.04, y + 0.07, L / 2, { bevel: 0.02 }); }
    g.mat('plain', '#f1eadb'); for (const sx of [-1, 1]) g.box(cx + sx * 0.06 - 0.042, y, -L / 2, cx + sx * 0.06 + 0.042, y + 0.018, L / 2, { faces: 'xXzZ' });
  }
  return { solid: [[-W / 2, 0, -d / 2, W / 2, H, d / 2]], tier: 's' };
});

// A tub of chalk with a scoop, on a low stool. p: { tub }
defineProp('lmchimney.chalk', (g, p) => {
  g.mat('glaze', p.tub || '#2f7d7a'); g.lathe(0, 0, [[0, 0], [0.15, 0], [0.17, 0.02], [0.18, 0.22], [0.165, 0.23], [0.16, 0.04], [0, 0.03]], { segs: 16, capTop: false });
  g.mat('plain', '#f4f1ea', { rough: 0.3 }); g.lathe(0, 0, [[0.165, 0.18], [0.08, 0.2], [0, 0.205]], { segs: 14, capBottom: false, capTop: false });
  g.mat('cast', '#9aa3a6'); g.tube([[0.04, 0.2, 0], [0.12, 0.3, 0.02], [0.2, 0.34, 0.03]], 0.008, { segs: 4 }); g.ball(0.03, 0.2, 0, 0.04, 0.02, 0.04, { segs: 6, rings: 3, top: 0 });
  return { posts: [[0, 0, 0.18, 0, 0.23]], cast: false };
});

// The first-aid cabinet: a white cupboard with a red cross, drawers of tape, a lamp over it. p: {}
defineProp('lmchimney.aid', (g) => {
  g.mat('paint', '#ece6da'); g.box(-0.5, 0, -0.2, 0.5, 1.8, 0.2, { bevel: 0.012 });
  g.mat('paint', '#d9d1c1'); g.box(-0.47, 0.06, 0.2, -0.01, 0.9, 0.215, { bevel: 0.006 }); g.box(0.01, 0.06, 0.2, 0.47, 0.9, 0.215, { bevel: 0.006 });
  for (let i = 0; i < 3; i++) g.box(-0.47, 0.96 + i * 0.27, 0.2, 0.47, 1.2 + i * 0.27, 0.215, { bevel: 0.006 });
  g.mat('paint', '#c8302a'); g.box(-0.04, 1.28, 0.216, 0.04, 1.52, 0.222); g.box(-0.12, 1.36, 0.216, 0.12, 1.44, 0.222);
  g.mat('cast', '#b08a45'); for (let i = 0; i < 3; i++) g.box(-0.08, 1.06 + i * 0.27, 0.215, 0.08, 1.09 + i * 0.27, 0.235, { bevel: 0.004 });
  g.box(-0.06, 0.45, 0.215, -0.03, 0.6, 0.235); g.box(0.03, 0.45, 0.215, 0.06, 0.6, 0.235);
  return { solid: [[-0.5, 0, -0.2, 0.5, 1.8, 0.2]], tier: 's' };
});
// A cot with a folded blanket and a pillow. p: { blanket }
defineProp('lmchimney.cot', (g, p) => {
  g.mat('cast', '#5a6a66'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.9, 0, sz * 0.32], [sx * 0.9, 0.42, sz * 0.32]], 0.02, { segs: 6 });
  g.tube([[-0.92, 0.42, -0.34], [0.92, 0.42, -0.34]], 0.022, { segs: 6 }); g.tube([[-0.92, 0.42, 0.34], [0.92, 0.42, 0.34]], 0.022, { segs: 6 });
  g.mat('weave', '#e8e0cc'); g.box(-0.92, 0.42, -0.34, 0.92, 0.52, 0.34, { bevel: 0.04 });
  g.mat('weave', '#f4efe2'); g.box(-0.85, 0.52, -0.25, -0.5, 0.62, 0.25, { bevel: 0.04 });
  g.mat('motif', p.blanket || '#8a2f3c'); g.box(0.2, 0.52, -0.3, 0.85, 0.6, 0.3, { bevel: 0.03 });
  return { solid: [[-0.92, 0, -0.34, 0.92, 0.55, 0.34]], spots: [{ type: 'sit', x: 0.1, y: 0.52, z: 0.25, yaw: 0 }], tier: 's' };
});
// A coat rail with hooks and things hung on it. p: { w, seed }
defineProp('lmchimney.hooks', (g, p) => {
  const w = p.w || 2, r = new Rng(p.seed || 5), n = Math.round(w / 0.3);
  g.mat('wood', '#6f4e33'); g.box(-w / 2, 1.55, -0.03, w / 2, 1.68, 0, { bevel: 0.01 });
  const cl = ['#c8452e', '#2f7d7a', '#d9a23a', '#34417a', '#6b3d5e', '#4f8a52', '#e8e0cc'];
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n;
    g.mat('cast', '#b08a45'); g.tube([[x, 1.6, 0], [x, 1.6, 0.07], [x, 1.66, 0.09]], 0.008, { segs: 4 });
    if (r.chance(0.6)) { const c = r.pick(cl); g.mat(r.chance(0.5) ? 'knit' : 'weave', c); g.box(x - 0.13, 0.95 + r.f(0, 0.15), 0.02, x + 0.13, 1.6, 0.1 + r.f(0, 0.05), { bevel: 0.04 }); }
  }
  return { cast: false, tier: 'd' };
});

// ---------------------------------------------------------------------------------------------------------------
// A pit of soft blocks inside a padded kerb: box [x0, z0, x1, z1]. Drawn into the scope, with a floor you can stand on.
// ---------------------------------------------------------------------------------------------------------------
export function softPit(s, box, o = {}) {
  const g = s.g, [x0, z0, x1, z1] = box, r = new Rng(o.seed || 11), lv = o.level || 0;
  const cols = o.cols || ['#d8432f', '#e9c43d', '#2f9fa8', '#efe8da', '#4fa65a', '#e06a9a', '#3a62b8', '#e8873a'];
  const kh = 0.62, kt = 0.4;
  // the kerb: four padded rolls
  g.mat('weave', o.kerb || '#2c3a40');
  g.box(x0, 0, z0, x1, kh, z0 + kt, { bevel: 0.08 }); g.box(x0, 0, z1 - kt, x1, kh, z1, { bevel: 0.08 });
  g.box(x0, 0, z0 + kt, x0 + kt, kh, z1 - kt, { bevel: 0.08 }); g.box(x1 - kt, 0, z0 + kt, x1, kh, z1 - kt, { bevel: 0.08 });
  g.mat('weave', o.stripe || '#e9c43d'); g.box(x0 - 0.005, kh - 0.2, z0 - 0.005, x1 + 0.005, kh - 0.12, z0 + kt, { faces: 'z' }); g.box(x0 - 0.005, kh - 0.2, z1 - kt, x1 + 0.005, kh - 0.12, z1 + 0.005, { faces: 'Z' });
  s.flush({ tier: 's', cast: true, level: lv });
  // the blocks: a heap, deeper in the middle, each a little turned
  const ix0 = x0 + kt + 0.05, ix1 = x1 - kt - 0.05, iz0 = z0 + kt + 0.05, iz1 = z1 - kt - 0.05;
  const n = Math.round((ix1 - ix0) * (iz1 - iz0) * (o.density || 9));
  for (let i = 0; i < n; i++) {
    const x = r.f(ix0 + 0.15, ix1 - 0.15), z = r.f(iz0 + 0.15, iz1 - 0.15);
    const u = Math.min(x - ix0, ix1 - x, z - iz0, iz1 - z) / Math.max(0.5, Math.min(ix1 - ix0, iz1 - iz0) / 2);
    const y = r.f(0.02, 0.18 + 0.25 * Math.min(1, u)), sz = r.f(0.24, 0.34);
    g.mat('weave', r.pick(cols)); g.at(x, y, z, r.f(0, PI)); g.rotX(r.f(-0.3, 0.3)); g.box(-sz / 2, 0, -sz / 2, sz / 2, sz, sz / 2, { bevel: 0.035 }); g.pop();
    if (i % 60 === 59) s.flush({ tier: 'd', cast: false, level: lv });
  }
  s.flush({ tier: 'd', cast: false, level: lv });
  // a soft floor at the blocks' top to stand on, and the kerb to climb out over
  s.solid(ix0, 0, iz0, ix1, 0.42, iz1, { surf: 'felt' });
  s.solid(x0, 0, z0, x1, kh, z0 + kt, { surf: 'felt' }); s.solid(x0, 0, z1 - kt, x1, kh, z1, { surf: 'felt' });
  s.solid(x0, 0, z0 + kt, x0 + kt, kh, z1 - kt, { surf: 'felt' }); s.solid(x1 - kt, 0, z0 + kt, x1, kh, z1 - kt, { surf: 'felt' });
  return { floor: 0.42, inner: [ix0, iz0, ix1, iz1] };
}

// ---------------------------------------------------------------------------------------------------------------
// A trough swept along a path: the slide. pts: [[x, y, z], ...] (the bottom of the channel, where a rider sits);
// o: { r (inner radius), t (wall), arc (half-angle of the open channel, radians from the bottom), closed: [[i0, i1], ...]
//      (stretches drawn as a closed tube), col, inner, lip, tint }
// Every ring is turned so the channel opens upward (toward +y), whichever way the path runs.
// ---------------------------------------------------------------------------------------------------------------
export function sweepTrough(s, pts, o = {}) {
  const g = s.g, r = o.r || 0.55, t = o.t || 0.05, n = pts.length, lv = o.level || 0;
  const frames = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    // side = T x up (horizontal), upn = side x T
    let sx = -tz, sz = tx; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    const ux = -sz * ty, uy = sz * tx - sx * tz, uz = sx * ty;
    const ul = Math.hypot(ux, uy, uz) || 1;
    // the centre of the channel's circle sits r above the rider's line
    frames.push({ p: pts[i], c: [pts[i][0] + ux / ul * r, pts[i][1] + uy / ul * r, pts[i][2] + uz / ul * r], s: [sx, 0, sz], u: [ux / ul, uy / ul, uz / ul] });
  }
  const closedAt = (i) => (o.closed || []).some((q) => i >= q[0] && i <= q[1]);
  const ring = (F, ang, rr) => { const c = Math.cos(ang), sn = Math.sin(ang); const nx = F.s[0] * sn - F.u[0] * c, ny = -F.u[1] * c, nz = F.s[2] * sn - F.u[2] * c; return { p: [F.c[0] + nx * rr, F.c[1] + ny * rr, F.c[2] + nz * rr], n: [nx, ny, nz] }; };
  const SEG = o.segs || 18;
  const stripe = (i0, i1, a0, a1, segs, rr, inward, col, step) => {
    g.mat(o.mat || 'glaze', col, o.matOpts);
    let lenAcc = 0;
    for (let i = i0; i < i1; i += step) {
      const j = Math.min(i1, i + step), F0 = frames[i], F1 = frames[j];
      const dl = Math.hypot(F1.p[0] - F0.p[0], F1.p[1] - F0.p[1], F1.p[2] - F0.p[2]);
      const base = g.buf.nv;
      for (const [F, L] of [[F0, lenAcc], [F1, lenAcc + dl]]) {
        for (let k = 0; k <= segs; k++) {
          const ang = a0 + (a1 - a0) * k / segs, q = ring(F, ang, rr), sgn = inward ? -1 : 1;
          g.v(q.p[0], q.p[1], q.p[2], q.n[0] * sgn, q.n[1] * sgn, q.n[2] * sgn, ang * rr, L);
        }
      }
      for (let k = 0; k < segs; k++) {
        const a = base + k, b = a + 1, c = base + segs + 1 + k, d = c + 1;
        if (inward) g.quadI(a, b, d, c); else g.quadI(a, c, d, b);
      }
      lenAcc += dl;
    }
  };
  const A = o.arc || 2.1, step = o.step || 2;
  // runs of open and closed rings, flushed in short pieces so they cull by chunk
  let i = 0;
  while (i < n - 1) {
    const closed = closedAt(i); let j = i; while (j < n - 1 && closedAt(j + 1) === closed && j - i < 40) j++;
    if (j === i) j = i + 1;
    const a0 = closed ? -PI : -A, a1 = closed ? PI : A;
    stripe(i, j, a0, a1, closed ? SEG + 6 : SEG, r, true, o.inner || '#e8603f', step);
    stripe(i, j, a0, a1, closed ? SEG + 6 : SEG, r + t, false, o.col || '#d4452c', step);
    s.flush({ tier: 's', cast: true, level: lv });
    if (!closed) {
      // bands painted round the inside every two metres, so a rider sees the speed
      g.mat('glaze', o.lip || '#f3e6c8');
      for (let k = i + 5; k < j; k += 10) {
        const F0 = frames[k], F1 = frames[Math.min(j, k + 1)], base = g.buf.nv, segs = 12;
        for (const F of [F0, F1]) for (let m = 0; m <= segs; m++) { const ang = -A * 0.96 + 2 * A * 0.96 * m / segs, q = ring(F, ang, r - 0.006); g.v(q.p[0], q.p[1], q.p[2], -q.n[0], -q.n[1], -q.n[2], m * 0.1, 0); }
        for (let m = 0; m < segs; m++) { const a = base + m, b = a + 1, c = base + segs + 1 + m, d = c + 1; g.quadI(a, b, d, c); }
      }
      // the rolled lips
      for (const sa of [-A, A]) { const line = []; for (let k = i; k <= j; k += step) line.push(ring(frames[k], sa, r + t / 2).p); const e = ring(frames[j], sa, r + t / 2).p; const last = line[line.length - 1]; if (last[0] !== e[0] || last[2] !== e[2]) line.push(e); g.tube(line, t * 0.9, { segs: 6, caps: false }); }
      s.flush({ tier: 'd', cast: false, level: lv });
    } else {
      // bands of colour round the tube, every couple of metres
      g.mat('glaze', o.lip || '#f3e6c8');
      for (let k = i; k <= j; k += 10) { const F = frames[k], loop = []; for (let m = 0; m < 16; m++) loop.push(ring(F, -PI + m / 16 * PI * 2, r + t + 0.012).p); g.tube(loop, 0.03, { segs: 4, closed: true }); }
      s.flush({ tier: 'd', cast: false, level: lv });
    }
    i = j;
  }
  return frames;
}
