// The lot hall (Chervil's assembly, decks 200 to 203, under Ring Five): the plan, the colours, small helpers and the
// props. Every prop is drawn at the origin with its front toward +z and cached by the few parameters it takes.
//
// Frame 'lot-hall': x spinward, z toward the back cap, y up. Deck 200 at y = 0, decks 201 to 203 at y = 4, 8, 12.
import * as THREE from 'three';
import { defineProp } from '../world/props.js';
import { wall } from '../world/kit.js';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { shadeHex } from '../core/util.js';

export const PI = Math.PI;
export const TAU = Math.PI * 2;
export const REGION = 'lot-hall';
export const DY = [0, 4, 8, 12];
export const SUB = 'the lot hall · deck 200 · Ring Five';

// ---------------------------------------------------------------------------------------------------------------
// the plan
// ---------------------------------------------------------------------------------------------------------------
// The Bowl: a round hall centred on (0, 0). The floor (r < R0) at y = 0; ten rows of chairs climbing outward, RISE a
// row; the rim walkway at y = 4 (deck 201) out to the wall; the public gallery right round at y = 8 (deck 202); the
// ceiling under deck 204. The throat (the members' way in) comes in along +z at floor level and runs out under the
// back rows as a tunnel to the foyer.
export const B = {
  R0: 4.6, ROWS: 10, D: 1.1, RISE: 0.36, RIM: 4.0, RW: 19.0, WT: 0.4, TOP: 15.4,
  GY: 8, G0: 15.4, THROAT: 1.85, BRIDGE: 7, TUN: 2.6, AHW: 0.65,
};
export const RIM_IN = B.R0 + B.ROWS * B.D;                  // 15.6: the back edge of the last row
export const AISLES = [60, 120, 180, 240, 300].map((d) => d * PI / 180);   // radial aisles (the throat is at 0, toward +z)
export const DOOR_X = 6;                                    // the doors through the hall's wall at y = 4 and y = 8, at x = +-6
export const DOOR_W = 1.6;
export const DOOR_A = Math.asin(DOOR_X / B.RW);
export function rowR(k) { return B.R0 + B.D * k; }
export function rowY(k) { return B.RISE * (k + 1); }

// the foyer: three decks tall, the mezzanine M1 (y 4) along its hall side, M2 (y 8) in the middle over the floor door
export const FOY = { x0: -18, x1: 18, z0: 20, z1: 38, h: 11.6 };
export const M1 = { y: 4, z1: 24 };
export const M2 = { y: 8, x: 7, z1: 24 };
// the cab lobby behind the foyer; the corridor of hatches (anti); the Two Chairs at its end; the Pin Room (spinward)
export const LOB = { x0: -6, x1: 6, z0: 38, z1: 46, h: 3.4 };
export const HAT = { x0: -48, x1: -18, z0: 31, z1: 36, h: 3.4, oz0: 25.4 };
export const CRT = { x0: -62, x1: -48, z0: 26, z1: 41, h: 3.4 };
export const PIN = { x0: 18, x1: 44, z0: 18, z1: 40, h: 11.6 };
export const SIDE_DOOR = { z0: 32, w: 3 };                  // the foyer's two side doors, west to the hatches, east to the Pin Room

// colours: warm plaster and old wood, madder and teal felt, brass, a saffron accent
export const C = {
  plaster: '#dcc39a', plasterD: '#b99a6e', teal: '#1f4f52', tealL: '#2f6f73', gilt: '#c9a24a', brass: '#b08a45',
  walnut: '#4a2e1e', walnutD: '#2c1a12', oak: '#8a5a34', floor: '#b8a58a', madder: '#9b2f2a', saffron: '#d99a2b',
  ochre: '#b8782f', plum: '#5b3a5e', indigo: '#2f3f6a', moss: '#5f7a3a', rose: '#c46a6a', iron: '#2a2c2c',
  cream: '#efe4c8', ink: '#22302c', slate: '#1f2a26', paper: '#efe6d0',
};
export const FELTS = [C.madder, C.saffron, C.tealL, C.plum, C.ochre, C.indigo, C.moss, C.rose, '#7a3a2a', '#3f7f6a', '#a85a2a', '#4a5a8a'];
// the chairs' cloths and paints, and the woods they are tinted to (multiplied over a pale base)
export const CLOTHS = ['#9b2f2a', '#2f6f73', '#d99a2b', '#5b3a5e', '#3f5a8a', '#6b7a3a', '#b5653a', '#c46a6a'];
export const WOODS = [[1, 0.92, 0.82], [0.72, 0.56, 0.44], [0.9, 0.74, 0.58], [0.58, 0.44, 0.34], [1.04, 0.96, 0.86], [0.8, 0.62, 0.48], [0.66, 0.5, 0.42]];

// ---------------------------------------------------------------------------------------------------------------
// small helpers, safe when the UI or the audio is missing
// ---------------------------------------------------------------------------------------------------------------
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export async function choose(game, who, prompt, options) { if (!game.ui || !game.ui.choose) return null; game.busy++; try { return await game.ui.choose(who, prompt, options); } finally { game.busy--; } }
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: 6 }); }
export function sfx(game, name, f, x, y, z, o) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z, o); }
export function find(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
export function hour(game) { return game.clock ? game.clock.hours : 12; }
export function day(game) { return game.clock ? game.clock.day : 1; }
export function pickBy(list, k) { return list[((k % list.length) + list.length) % list.length]; }
// Wait a frame between the big parts of the build, then take the region's sign pages back.
export async function tick(game) {
  await new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });
  if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + REGION);
}
// Run fn(a, b, i) over [a0, a1] in pieces no longer than `step` (long things must be cut so the drum can bend them).
export function runX(a0, a1, step, fn) { const n = Math.max(1, Math.ceil((a1 - a0) / step)); for (let i = 0; i < n; i++) fn(a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n, i); }
// A wall along z (constant x) or along x (constant z), cut round each hole: holes [[a0, w, sill, h], ...].
export function wallRun(s, axis, c, a0, a1, y0, h, o, holes) {
  const hs = (holes || []).slice().sort((p, q) => p[0] - q[0]);
  const piece = (u0, u1, op) => {
    runX(u0, u1, axis === 'x' ? 10 : 40, (a, b) => {
      const opts = Object.assign({}, o, { openings: op ? [{ at: 0, w: b - a, h: op[3], sill: op[2] }] : undefined });
      if (axis === 'x') wall(s, a, c, b, c, y0, h, opts); else wall(s, c, a, c, b, y0, h, opts);
    });
  };
  let u = a0;
  for (const hl of hs) { if (hl[0] > u + 0.01) piece(u, hl[0]); piece(hl[0], hl[0] + hl[1], hl); u = hl[0] + hl[1]; }
  if (u < a1 - 0.01) piece(u, a1);
}
// A point on a circle round the hall's centre: theta from +z toward +x.
export function P(r, th, y) { return [r * Math.sin(th), y, r * Math.cos(th)]; }
// A quad whose face points as near as possible along (nx, ny, nz), whichever order the corners came in.
export function q4(g, a, b, c, d, nx, ny, nz) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
  if (cx * nx + cy * ny + cz * nz >= 0) g.quad(a, b, c, d); else g.quad(a, d, c, b);
}
// An annulus sector lying flat at height y, facing up (or down with dn), from r0 to r1 and th0 to th1, in pieces.
export function ringFlat(g, r0, r1, th0, th1, y, step, dn) {
  const n = Math.max(1, Math.ceil(Math.abs(th1 - th0) * r1 / (step || 1.2)));
  for (let i = 0; i < n; i++) {
    const a = th0 + (th1 - th0) * i / n, b = th0 + (th1 - th0) * (i + 1) / n;
    q4(g, P(r0, b, y), P(r0, a, y), P(r1, a, y), P(r1, b, y), 0, dn ? -1 : 1, 0);
  }
}
// A curved wall face at radius r from y0 to y1, facing in (toward the centre) or out.
export function ringWall(g, r, th0, th1, y0, y1, out, step) {
  const n = Math.max(1, Math.ceil(Math.abs(th1 - th0) * r / (step || 1.2)));
  for (let i = 0; i < n; i++) {
    const a = th0 + (th1 - th0) * i / n, b = th0 + (th1 - th0) * (i + 1) / n, m = (a + b) / 2, sg = out ? 1 : -1;
    q4(g, P(r, a, y0), P(r, b, y0), P(r, b, y1), P(r, a, y1), sg * Math.sin(m), 0, sg * Math.cos(m));
  }
}
// The shortest signed angle from b to a.
export function adiff(a, b) { let d = a - b; while (d > PI) d -= TAU; while (d < -PI) d += TAU; return d; }

// A seat the player can take. (x, y, z): the floor under the seat; yaw: the way the seat faces (prop convention).
export function seat(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + 0.5, z, radius: o.radius || 0.9, wide: true,
    prompt: (game) => (game.player && game.player.seat ? 'Stand up' : label),
    onUse(game) {
      const p = game.player; if (!p) return; if (p.seat) { p.stand(); return; }
      p.sit({ x, y, z, yaw: PI - yaw, eye: o.eye || 1.12 }); p.yaw = PI - yaw; p.pitch = o.pitch || 0;
      if (o.onSit) o.onSit(game);
    } });
}

// A mesh that turns: draw it at its own origin with draw(g), and get back set(angle), which turns it about x (or z).
export function turning(s, x, y, z, radius, draw, axis) {
  const W = s.world, g = new Geo(new MeshBuf(1024, 2048));
  draw(g);
  const mesh = new THREE.Mesh(g.buf.toGeometry(), W.mats.opaque);
  W.addRenderable(mesh, { frame: s.frame, origin: [x, y, z], center: [0, 0, 0], radius, far: 140, caster: false, scope: s });
  s.meshes.push(mesh);
  const e = mesh.matrixWorld.elements;
  return {
    set(a) {
      const c = Math.cos(a), sn = Math.sin(a);
      if (axis === 'z') { e[0] = c; e[1] = sn; e[2] = 0; e[4] = -sn; e[5] = c; e[6] = 0; e[8] = 0; e[9] = 0; e[10] = 1; }
      else { e[0] = 1; e[1] = 0; e[2] = 0; e[4] = 0; e[5] = c; e[6] = sn; e[8] = 0; e[9] = -sn; e[10] = c; }
    },
    mesh,
  };
}
// A clock hand on a wall face: built pointing up (+y) in its own plane, turned about the face's normal.
// face: 'x' | 'X' | 'z' | 'Z' (the way the dial looks). Returns set(angle): 0 is twelve o'clock, growing clockwise.
export function hand(s, x, y, z, face, len, wid, tint) {
  const W = s.world, g = new Geo(new MeshBuf(64, 128));
  g.mat('cast', tint || '#1d1b18', { rough: -0.2 });
  g.box(-wid / 2, -len * 0.18, 0, wid / 2, len, 0.006);
  const mesh = new THREE.Mesh(g.buf.toGeometry(), W.mats.opaque);
  const n = face === 'X' ? [1, 0, 0] : face === 'x' ? [-1, 0, 0] : face === 'Z' ? [0, 0, 1] : [0, 0, -1];
  W.addRenderable(mesh, { frame: s.frame, origin: [x + n[0] * 0.01, y, z + n[2] * 0.01], center: [0, 0, 0], radius: len + 0.1, far: 90, caster: false, scope: s });
  s.meshes.push(mesh);
  const e = mesh.matrixWorld.elements, right = [n[2], 0, -n[0]];
  return (a) => {
    const hv = [Math.sin(a) * right[0], Math.cos(a), Math.sin(a) * right[2]];
    const x0 = hv[1] * n[2] - hv[2] * n[1], x1 = hv[2] * n[0] - hv[0] * n[2], x2 = hv[0] * n[1] - hv[1] * n[0];
    e[0] = x0; e[1] = x1; e[2] = x2; e[4] = hv[0]; e[5] = hv[1]; e[6] = hv[2]; e[8] = n[0]; e[9] = n[1]; e[10] = n[2];
  };
}

// A curved run of glass (a dome): draw the profile turned about y, flushed into the scope's glass.
export function glassLathe(s, x, y, z, profile, o = {}) {
  const g = s.g;
  g.mat('plain', o.tint || '#dfeee8');
  g._col[3] = Math.round(255 * (o.opacity === undefined ? 0.14 : o.opacity)); g._mat[3] = Math.round(255 * 0.05);
  g.lathe(x, z, profile.map((p) => [p[0], p[1] + y]), { segs: o.segs || 20, capBottom: false, capTop: false });
  g._col[3] = 255;
  s.flush({ glass: true, level: o.level });
}

// ---------------------------------------------------------------------------------------------------------------
// the chairs: six kinds, four ages, a cloth or paint colour. Remade, never replaced: the older, the more mended.
// p: { k (0..5), a (0 newest .. 3 oldest), c (cloth hex) }. Seat at 0.46. No collision of its own (the hall adds posts).
// ---------------------------------------------------------------------------------------------------------------
defineProp('lothall.chair', (g, p) => {
  const k = p.k | 0, a = p.a | 0, cl = p.c || CLOTHS[0];
  const wood = '#c9a07a', W = k === 5 ? 0.52 : 0.47, D = 0.46, SH = 0.46, L = 0.042;
  const hw = W / 2, hd = D / 2, arms = a >= 3 || (a === 2 && (k === 3 || k === 0));
  g.mat('wood', wood, { rough: a >= 2 ? 0.12 : -0.04 });
  // legs: square, a touch splayed on the old ones
  const sp = a >= 2 ? 0.015 : 0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (hw - 0.035), z = sz * (hd - 0.035);
    g.box(x - L / 2 + sx * sp, 0, z - L / 2 + sz * sp, x + L / 2 + sx * sp, SH - 0.03, z + L / 2 + sz * sp, { faces: 'xXzZ' });
  }
  // stretchers: front and back on the old, sides on all
  for (const sx of [-1, 1]) g.box(sx * (hw - 0.035) - 0.012, 0.13, -hd + 0.04, sx * (hw - 0.035) + 0.012, 0.155, hd - 0.04, { faces: 'yYxX' });
  if (a >= 1) g.box(-hw + 0.05, 0.2, -hd + 0.025, hw - 0.05, 0.225, -hd + 0.045, { faces: 'yYzZ' });
  // the seat
  if (k === 1) { g.mat('rush', '#c9b07a'); g.box(-hw, SH - 0.04, -hd, hw, SH, hd, { faces: 'xXzZY' }); g.mat('wood', wood); g.box(-hw - 0.005, SH - 0.045, hd - 0.03, hw + 0.005, SH - 0.005, hd + 0.005, { faces: 'ZxXY' }); }
  else if (k === 3) { g.mat('wood', wood); g.box(-hw, SH - 0.06, -hd, hw, SH - 0.03, hd, { faces: 'xXzZ' }); g.mat('weave', cl, { rough: 0.1 }); g.box(-hw + 0.01, SH - 0.035, -hd + 0.01, hw - 0.01, SH + 0.025, hd - 0.005, { faces: 'xXzZY' }); }
  else { g.box(-hw, SH - 0.035, -hd, hw, SH, hd, { faces: 'xXzZY' }); }
  // the back
  const by = SH, bz = -hd + 0.02;
  g.mat('wood', wood, { rough: a >= 2 ? 0.12 : -0.04 });
  if (k === 0) {            // hoop back with three spindles
    for (const sx of [-1, 1]) g.box(sx * (hw - 0.035) - 0.018, by, bz - 0.018, sx * (hw - 0.035) + 0.018, by + 0.42, bz + 0.018, { faces: 'xXzZ' });
    const pts = []; for (let i = 0; i <= 4; i++) { const t = i / 4 * PI; pts.push([-(hw - 0.035) * Math.cos(t), by + 0.42 + Math.sin(t) * 0.1, bz]); }
    g.tube(pts, 0.016, { segs: 4, caps: false });
    for (const x of [-0.08, 0.08]) g.box(x - 0.01, by, bz - 0.01, x + 0.01, by + 0.48, bz + 0.01, { faces: 'xXzZ' });
  } else if (k === 1) {     // ladder back: tall posts, three slats
    for (const sx of [-1, 1]) g.box(sx * (hw - 0.035) - 0.02, by, bz - 0.02, sx * (hw - 0.035) + 0.02, by + 0.56, bz + 0.02, { faces: 'xXzZY' });
    for (let i = 0; i < 3; i++) { const y = by + 0.18 + i * 0.13; g.box(-hw + 0.05, y, bz - 0.012, hw - 0.05, y + 0.06, bz + 0.012, { faces: 'yYzZ' }); }
  } else if (k === 2) {     // a solid painted back panel
    for (const sx of [-1, 1]) g.box(sx * (hw - 0.035) - 0.02, by, bz - 0.02, sx * (hw - 0.035) + 0.02, by + 0.46, bz + 0.02, { faces: 'xXzZY' });
    g.mat('paint', cl, { rough: a >= 2 ? 0.15 : -0.1 }); g.box(-hw + 0.05, by + 0.12, bz - 0.015, hw - 0.05, by + 0.42, bz + 0.012, { faces: 'zZY' });
  } else if (k === 3) {     // upholstered back
    for (const sx of [-1, 1]) g.box(sx * (hw - 0.035) - 0.02, by, bz - 0.02, sx * (hw - 0.035) + 0.02, by + 0.5, bz + 0.02, { faces: 'xXzZY' });
    g.mat('weave', cl, { rough: 0.1 }); g.box(-hw + 0.045, by + 0.1, bz - 0.01, hw - 0.045, by + 0.47, bz + 0.05, { faces: 'xXzZY' });
  } else if (k === 4) {     // spindle back with a crest rail
    for (const sx of [-1, 1]) g.box(sx * (hw - 0.035) - 0.018, by, bz - 0.018, sx * (hw - 0.035) + 0.018, by + 0.4, bz + 0.018, { faces: 'xXzZ' });
    g.box(-hw + 0.01, by + 0.36, bz - 0.022, hw - 0.01, by + 0.44, bz + 0.022, { faces: 'xXyYzZ' });
    for (let i = 0; i < 3; i++) { const x = -0.1 + i * 0.1; g.box(x - 0.008, by, bz - 0.008, x + 0.008, by + 0.37, bz + 0.008, { faces: 'xXzZ' }); }
  } else {                  // a wide chair with a curved back board
    for (const sx of [-1, 1]) g.box(sx * (hw - 0.035) - 0.02, by, bz - 0.02, sx * (hw - 0.035) + 0.02, by + 0.44, bz + 0.02, { faces: 'xXzZY' });
    g.push(); g.move(0, by + 0.28, bz - 0.02);
    const pts = []; for (let i = 0; i <= 4; i++) { const t = -1 + i / 2; pts.push([t * (hw - 0.05), 0, -0.03 * (1 - t * t)]); }
    g.mat('wood', shadeHex(wood, 0.92)); g.tube(pts, [0.07, 0.07, 0.07, 0.07, 0.07], { segs: 4, caps: false });
    g.pop();
  }
  // arms, on the old ones: the names are carved underneath them
  if (arms) {
    g.mat('wood', shadeHex(wood, 0.9), { rough: 0.05 });
    for (const sx of [-1, 1]) {
      const x = sx * (hw + 0.015);
      g.box(x - 0.028, SH + 0.2, -hd + 0.02, x + 0.028, SH + 0.235, hd - 0.02, { faces: 'xXzZY' });
      g.box(x - 0.016, SH, hd - 0.07, x + 0.016, SH + 0.2, hd - 0.04, { faces: 'xXzZ' });
    }
  }
  // the mends: a bright binding round a front leg, a brass splint on the back, a darned patch on a cloth seat
  if (a >= 2) {
    g.mat('weave', pickBy(['#e8b84a', '#3fa7a3', '#d95d7a', '#e9e2d0'], k + a));
    g.box(hw - 0.035 - L / 2 - 0.006, 0.24, hd - 0.035 - L / 2 - 0.006, hw - 0.035 + L / 2 + 0.006, 0.31, hd - 0.035 + L / 2 + 0.006, { faces: 'xXzZ' });
  }
  if (a >= 3) {
    g.mat('cast', '#c9a24a', { rough: -0.2 }); g.box(-hw + 0.02, by + 0.3, bz - 0.026, -hw + 0.06, by + 0.38, bz - 0.018, { faces: 'z' });
    if (k === 3) { g.mat('weave', pickBy(['#e8b84a', '#3f7f6a', '#c9552e'], k)); g.box(0.02, SH + 0.026, -0.05, 0.14, SH + 0.029, 0.08); }
  }
  return { tier: 's', cast: false };
});

// The speaker's stool: tall, round, on a turning seat, three legs and a brass foot ring worn bright at the front.
defineProp('lothall.stool', (g) => { drawStool(g); return { posts: [[0, 0, 0.24, 0, 0.76]], tier: 's', cast: true }; });
export function drawStool(g) {
  const h = 0.74;
  g.mat('wood', '#3a2418', { rough: 0.05 });
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.3; g.tube([[Math.sin(a) * 0.27, 0, Math.cos(a) * 0.27], [Math.sin(a) * 0.12, h - 0.06, Math.cos(a) * 0.12]], [0.026, 0.022], { segs: 7 }); }
  g.mat('cast', '#d2ad5c', { rough: -0.35 });
  const ring = []; for (let i = 0; i <= 18; i++) { const a = i / 18 * TAU; ring.push([Math.sin(a) * 0.205, 0.3, Math.cos(a) * 0.205]); }
  g.tube(ring, 0.014, { segs: 6 });
  g.mat('cast', '#2c2a26'); g.cyl(0, h - 0.07, 0, 0.09, 0.05, { segs: 14 });
  // the seat: a turned disc of dark wood, a felt pad worn through to the weave in the middle
  g.mat('wood', '#4a2e1e', { rough: -0.05 }); g.lathe(0, 0, [[0, h - 0.025], [0.2, h - 0.025], [0.215, h - 0.01], [0.215, h + 0.012], [0.2, h + 0.02], [0, h + 0.02]], { segs: 22 });
  g.mat('felt', C.madder); g.lathe(0, 0, [[0, h + 0.02], [0.185, h + 0.02], [0.18, h + 0.035], [0, h + 0.04]], { segs: 22, capBottom: false });
  g.mat('weave', '#c9a06a'); g.cyl(0.02, h + 0.0405, -0.01, 0.06, 0.002, { segs: 12 });
}

// The Churn's frame, which stays still: two cast A-frames, the bearings, a crank on the spinward side, the token tray,
// and the heap of tokens that the cage turns round. The axle is along x at y = 1.05.
export const CHURN = { ax: 1.05, r: 0.56, half: 0.5 };
defineProp('lothall.churnframe', (g) => { drawChurnFrame(g); return { solid: [[-0.78, 0, -0.5, 0.78, 0.9, 0.5]], tier: 's', cast: true }; });
export function drawChurnFrame(g) {
  const A = CHURN.ax;
  g.mat('cast', '#2a3434', { rough: -0.1 });
  for (const sx of [-1, 1]) {
    const x = sx * 0.66;
    g.tube([[x, 0, -0.44], [x, A, 0]], 0.03, { segs: 7 }); g.tube([[x, 0, 0.44], [x, A, 0]], 0.03, { segs: 7 });
    g.box(x - 0.03, 0.34, -0.3, x + 0.03, 0.38, 0.3);
    g.mat('cast', '#b08a45', { rough: -0.25 }); g.cyl(x, A - 0.07, 0, 0.07, 0.14, { segs: 14 }); g.mat('cast', '#2a3434', { rough: -0.1 });
    g.box(x - 0.1, 0, -0.5, x + 0.1, 0.04, -0.38); g.box(x - 0.1, 0, 0.38, x + 0.1, 0.04, 0.5);
  }
  // the base boards, worn pale where the clerk stands
  g.mat('wood', '#5a3a24'); g.box(-0.76, 0, -0.5, 0.76, 0.03, 0.5, { bevel: 0.01 });
  // the token tray in front, on a bracket, and the heap of tokens inside the cage
  g.mat('wood', '#3a2418'); g.box(-0.24, 0.84, 0.6, 0.24, 0.87, 0.82, { bevel: 0.008 });
  g.mat('cast', '#2a3434'); g.tube([[-0.2, 0.84, 0.62], [-0.2, 0.6, 0.38]], 0.012, { segs: 5 }); g.tube([[0.2, 0.84, 0.62], [0.2, 0.6, 0.38]], 0.012, { segs: 5 });
  g.mat('wood', '#e6d2a6', { rough: -0.1 });
  for (let i = 0; i < 46; i++) {
    const t = i * 2.399, rr = 0.06 + (i % 9) * 0.035, x = Math.cos(t) * rr * 1.3, z = Math.sin(t) * rr * 0.62;
    const y = A - CHURN.r + 0.05 + (0.3 - Math.min(0.3, Math.abs(z) * 0.9)) * 0.22 + (i % 3) * 0.018;
    g.push(); g.move(x * 0.9, y, z * 0.85); g.rotX(0.4 + (i % 5) * 0.5); g.rotZ((i % 7) * 0.4);
    g.cyl(0, -0.006, 0, 0.032, 0.012, { segs: 8 }); g.pop();
  }
}
// The cage itself (it turns): two brass end rings with spokes, ten wooden staves, a little door, the crank.
export function drawChurnCage(g) {
  const R = CHURN.r, H = CHURN.half;
  for (const sx of [-1, 1]) {
    g.mat('cast', '#c9a24a', { rough: -0.3 });
    const ring = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; ring.push([sx * H, Math.cos(a) * R, Math.sin(a) * R]); }
    g.tube(ring, 0.022, { segs: 6 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.tube([[sx * H, 0, 0], [sx * H, Math.cos(a) * R, Math.sin(a) * R]], 0.012, { segs: 5 }); }
    g.cyl(sx * H, -0.05, 0, 0.05, 0.1, { segs: 10 });
  }
  g.mat('cast', '#2a3434'); g.push(); g.rotZ(PI / 2); g.cyl(0, -0.72, 0, 0.022, 1.44, { segs: 8 }); g.pop();
  g.mat('wood', '#7a4a2a', { rough: -0.05 });
  for (let i = 0; i < 10; i++) {
    if (i === 3) continue;
    const a = (i + 0.5) / 10 * TAU, y = Math.cos(a) * R, z = Math.sin(a) * R;
    g.push(); g.move(0, y, z); g.rotX(-a); g.box(-H, -0.01, -0.05, H, 0.012, 0.05, { faces: 'yYzZ' }); g.pop();
  }
  // the door in the gap, with a brass latch, and the number painted on the next stave
  { const a = 3.5 / 10 * TAU; g.push(); g.move(0, Math.cos(a) * R, Math.sin(a) * R); g.rotX(-a);
    g.mat('wood', '#a85a2a'); g.box(-0.26, -0.012, -0.12, 0.26, 0.016, 0.12, { faces: 'yYzZxX' });
    g.mat('cast', '#d2ad5c'); g.box(-0.04, 0.016, 0.08, 0.04, 0.03, 0.12); g.pop(); }
  // the crank on the spinward end, its wooden handle
  g.mat('cast', '#2a3434'); g.box(0.72, -0.03, -0.03, 0.75, 0.3, 0.03);
  g.mat('wood', '#c9a06a'); g.push(); g.move(0.74, 0.3, 0); g.rotZ(PI / 2); g.cyl(0, 0, 0, 0.026, 0.16, { segs: 8 }); g.pop();
}

// A writing table for the clerks of the floor: a sloped top with a ledge, ledgers open, ink, a hooded lamp.
defineProp('lothall.clerkdesk', (g, p) => {
  const w = p.w || 1.6, wood = p.wood || '#5a3a24';
  g.mat('wood', wood, { rough: -0.06 });
  for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.06) - 0.03, 0, -0.3, sx * (w / 2 - 0.06) + 0.03, 0.74, 0.3, { faces: 'xXzZ' });
  g.box(-w / 2 + 0.06, 0.08, -0.04, w / 2 - 0.06, 0.12, 0.04, { faces: 'yYzZ' });
  g.box(-w / 2, 0.74, -0.32, w / 2, 0.79, 0.32, { bevel: 0.01 });
  g.box(-w / 2, 0.79, -0.32, w / 2, 0.92, -0.26, { bevel: 0.006 });
  g.mat('felt', C.teal); g.box(-w / 2 + 0.04, 0.79, -0.26, w / 2 - 0.04, 0.795, 0.28, { faces: 'Y' });
  for (const sx of [-0.35, 0.35]) {
    g.mat('weave', sx < 0 ? '#7a2a3a' : '#2f4f6b'); g.box(sx * w - 0.24, 0.795, -0.12, sx * w + 0.24, 0.81, 0.2, { bevel: 0.004 });
    g.mat('paper', C.paper); g.box(sx * w - 0.22, 0.81, -0.1, sx * w - 0.006, 0.822, 0.18); g.box(sx * w + 0.006, 0.81, -0.1, sx * w + 0.22, 0.822, 0.18);
    g.mat('plain', '#3a2c20'); for (let i = 0; i < 8; i++) { const z = -0.08 + i * 0.032; g.box(sx * w - 0.2, 0.823, z, sx * w - 0.05 - (i % 3) * 0.03, 0.824, z + 0.005); g.box(sx * w + 0.03, 0.823, z, sx * w + 0.19 - (i % 2) * 0.05, 0.824, z + 0.005); }
  }
  g.mat('glaze', '#1d2a3a'); g.cyl(0, 0.79, -0.2, 0.03, 0.05, { segs: 10 });
  g.mat('cast', '#2c2a26'); g.tube([[0, 0.92, -0.29], [0, 1.3, -0.25], [0, 1.32, -0.06]], 0.01, { segs: 5 });
  g.mat('cast', '#2f6f4a'); g.lathe(0, -0.06, [[0.02, 1.33], [0.09, 1.25], [0.095, 1.24]], { segs: 12, capBottom: false });
  g.mat('diffuser', '#ffe0a8', { emissive: 2.5, lamp: true }); g.cyl(0, 1.245, -0.06, 0.07, 0.005, { segs: 12 });
  return { solid: [[-w / 2, 0, -0.32, w / 2, 0.92, 0.32]], tier: 's', cast: true };
});

// A long standing desk of the Pin Room: two sloped faces back to back, a ledge on each, sheets laid out, brass rods to
// hold them down, cast legs. p: { L }
defineProp('lothall.readdesk', (g, p) => {
  const L = p.L || 6, H = 1.08, wood = '#6b4429';
  g.mat('cast', '#2a3434', { rough: -0.1 });
  const nl = Math.max(2, Math.round(L / 1.8));
  for (let i = 0; i <= nl; i++) { const x = -L / 2 + 0.15 + (L - 0.3) * i / nl; g.box(x - 0.03, 0, -0.06, x + 0.03, H - 0.1, 0.06, { faces: 'xXzZ' }); g.box(x - 0.04, 0, -0.32, x + 0.04, 0.04, 0.32); }
  g.box(-L / 2 + 0.1, 0.22, -0.02, L / 2 - 0.1, 0.26, 0.02, { faces: 'yYzZ' });
  for (const sz of [-1, 1]) {
    g.push(); g.move(0, H - 0.05, sz * 0.21); g.rotX(sz * 0.32);
    g.mat('wood', wood, { rough: -0.05 }); g.box(-L / 2, -0.03, -0.24, L / 2, 0.0, 0.24, { faces: 'yYxXzZ' });
    g.mat('cast', '#b08a45', { rough: -0.25 }); g.tube([[-L / 2 + 0.05, 0.03, sz * 0.2], [L / 2 - 0.05, 0.03, sz * 0.2]], 0.008, { segs: 5 });
    g.mat('wood', shadeHex(wood, 0.8)); g.box(-L / 2, 0.0, sz * 0.24 - (sz > 0 ? 0.04 : 0), L / 2, 0.04, sz * 0.24 + (sz > 0 ? 0 : 0.04), { faces: 'yYzZ' });
    // sheets laid along it, each with its lines
    const n = Math.floor(L / 0.36);
    for (let i = 0; i < n; i++) {
      const x = -L / 2 + 0.2 + i * (L - 0.4) / n, tw = 0.105 + (i % 3) * 0.01;
      g.mat('paper', (i % 4) === 1 ? '#e6d6b0' : C.paper); g.box(x - tw, 0.001, -0.15, x + tw, 0.004, 0.15, { faces: 'Y' });
      g.mat('plain', '#4a3a2e'); for (let j = 0; j < 7; j++) { const z = -0.12 + j * 0.035; g.box(x - tw + 0.02, 0.0045, z, x + tw - 0.03 - ((i + j) % 3) * 0.02, 0.005, z + 0.006, { faces: 'Y' }); }
    }
    g.pop();
  }
  return { solid: [[-L / 2, 0, -0.34, L / 2, H, 0.34]], tier: 's', cast: true };
});

// One of the Two Chairs: an old high-backed armchair, deep-buttoned, one of a pair that are never moved. p: { c, wood }
defineProp('lothall.quarrelchair', (g, p) => {
  const cl = p.c || C.madder, wood = p.wood || '#3a2418';
  g.mat('wood', wood, { rough: 0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.lathe(sx * 0.3, sz * 0.28, [[0.03, 0], [0.04, 0.05], [0.03, 0.14], [0.035, 0.2]], { segs: 8 });
  g.mat('weave', cl, { rough: 0.15 }); g.box(-0.36, 0.2, -0.34, 0.36, 0.44, 0.34, { bevel: 0.04 });
  g.box(-0.36, 0.44, -0.36, 0.36, 1.18, -0.2, { bevel: 0.05 });
  for (const sx of [-1, 1]) g.box(sx * 0.36 - 0.07, 0.44, -0.3, sx * 0.36 + 0.07, 0.7, 0.32, { bevel: 0.04 });
  // buttons, a mend in another colour across one arm
  g.mat('cast', '#c9a24a'); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) g.ball(-0.15 + i * 0.15, 0.7 + j * 0.25, -0.198, 0.012, 0.012, 0.006, { segs: 6, rings: 3 });
  g.mat('weave', p.mend || '#e8b84a'); g.box(0.29, 0.69, -0.1, 0.43, 0.705, 0.12, { bevel: 0.01 });
  return { posts: [[0, 0, 0.36, 0, 0.7]], spots: [{ type: 'sit', x: 0, y: 0.44, z: 0.04, yaw: 0 }], tier: 's', cast: true };
});

// The tea stall's urn: a tall lidded copper urn with a brass tap, on the loop's own warm plate. p: { r }
defineProp('lothall.urn', (g, p) => {
  const r = p.r || 0.2;
  g.mat('cast', '#2c2a26'); g.cyl(0, 0, 0, r * 1.1, 0.03, { segs: 16 });
  g.mat('cast', '#b8704a', { rough: -0.35 }); g.lathe(0, 0, [[r * 0.9, 0.03], [r, 0.1], [r * 1.02, 0.5], [r * 0.85, 0.6], [r * 0.5, 0.64]], { segs: 18, capBottom: false });
  g.mat('cast', '#c9a24a', { rough: -0.3 }); g.lathe(0, 0, [[r * 0.5, 0.64], [r * 0.45, 0.67], [r * 0.12, 0.7], [r * 0.12, 0.74], [0, 0.76]], { segs: 14, capBottom: false });
  for (const sx of [-1, 1]) g.tube([[sx * r, 0.45, 0], [sx * (r + 0.07), 0.45, 0], [sx * (r + 0.07), 0.35, 0], [sx * r, 0.32, 0]], 0.01, { segs: 5 });
  g.push(); g.move(0, 0.14, r * 0.98); g.rotX(PI / 2); g.cyl(0, 0, 0, 0.02, 0.08, { segs: 8 }); g.pop();
  g.box(-0.01, 0.1, r + 0.06, 0.01, 0.16, r + 0.08);
  return { posts: [[0, 0, r, 0, 0.76]], tier: 'd', cast: true };
});

// A brass name plate's body (the text is a sign on it). p: { w, h }
export function brassPlate(g, x, y, z, w, h, face) {
  const t = 0.012;
  g.mat('cast', '#c9a24a', { rough: -0.3 });
  if (face === 'Z') g.box(x - w / 2, y - h / 2, z, x + w / 2, y + h / 2, z + t, { bevel: 0.004 });
  else if (face === 'z') g.box(x - w / 2, y - h / 2, z - t, x + w / 2, y + h / 2, z, { bevel: 0.004 });
  else if (face === 'X') g.box(x, y - h / 2, z - w / 2, x + t, y + h / 2, z + w / 2, { bevel: 0.004 });
  else g.box(x - t, y - h / 2, z - w / 2, x, y + h / 2, z + w / 2, { bevel: 0.004 });
}

// A cab berth door pair on a wall, the call buttons, and the cab stop's interacts. (x, z): the wall's centre point;
// yaw: the way the berths face (prop convention).
export function berths(s, x, z, yaw, stopId) {
  const g = s.g;
  s.furniture(() => {
    g.at(x, 0, z, yaw);
    for (const bx of [-1.6, 1.6]) {
      const bw = 1.3;
      g.mat('stone', '#9c8f7c'); g.box(bx - bw / 2 - 0.18, 0, 0, bx + bw / 2 + 0.18, 2.62, 0.16, { bevel: 0.01 });
      g.mat('cast', C.brass, { rough: -0.1 }); g.box(bx - bw / 2, 0.02, 0.16, bx - 0.01, 2.36, 0.2); g.box(bx + 0.01, 0.02, 0.16, bx + bw / 2, 2.36, 0.2);
      g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(bx - bw / 2 + 0.06, yy, 0.2, bx + bw / 2 - 0.06, yy + 0.03, 0.215);
      g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(bx - 0.2, 2.44, 0.16, bx + 0.2, 2.52, 0.19);
      g.mat('cast', '#3a3430'); g.box(bx + bw / 2 + 0.25, 1.05, 0.0, bx + bw / 2 + 0.4, 1.3, 0.08, { bevel: 0.01 });
      g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.box(bx + bw / 2 + 0.3, 1.13, 0.08, bx + bw / 2 + 0.35, 1.2, 0.09);
    }
    g.pop();
  });
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  for (const bx of [-1.6, 1.6]) {
    const px = x + Math.cos(yaw) * bx, pz = z - Math.sin(yaw) * bx;
    s.interact({ x: px + fx * 0.6, y: 1.2, z: pz + fz * 0.6, radius: 1.7, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open(stopId); } });
  }
}
