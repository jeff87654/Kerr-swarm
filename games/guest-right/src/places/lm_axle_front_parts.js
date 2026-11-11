// Shared pieces for the front axle (region 'axle-front'): small helpers for lines, seats and hand lines, a way to model
// round things in true space near the axis, meshes the scope can show, hide or move, and the props the place uses.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { defineProp } from '../world/props.js';

export const PI = Math.PI;
export const RHO = 60;                          // the frame's floor: sixty metres from the axis
export const C = 2 * PI * RHO;                  // flat x once round the axis
export const HALF = C / 2;                      // the Lap's seam, straight across the axis from the lobby
export const XR = HALF + 0.01;                  // a box from -XR to XR goes all the way round

export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info' }); }
export function find(game, id) { if (game.journal) game.journal.find(id); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }

// Lines as someone (a plain name or { name, colour }), safely.
export async function say(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(who, lines); } finally { game.busy--; }
}

// A seat the player can take: (x, y, z) the floor under it, yaw the way the seat faces (prop convention: 0 faces +z).
export function seat(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + 0.55, z, radius: o.radius || 1.0,
    prompt: (game) => (game.player.seat ? 'Unbuckle and stand' : (typeof label === 'function' ? label(game) : label)),
    onUse(game) {
      const p = game.player; if (p.seat) { p.stand(); if (o.onStand) o.onStand(game); return; }
      p.sit({ x, y: y + (o.lift || 0), z, yaw: PI - yaw, eye: o.eye || 1.12 }); p.yaw = PI - yaw; p.pitch = o.pitch || 0.02;
      if (o.onSit) o.onSit(game);
    } });
}

// Run fn(a, b) over [x0, x1] in pieces no longer than step, so long things land in small chunks.
export function runX(x0, x1, step, fn) { const n = Math.max(1, Math.ceil((x1 - x0) / step)); for (let i = 0; i < n; i++) fn(x0 + (x1 - x0) * i / n, x0 + (x1 - x0) * (i + 1) / n); }

// ---------------------------------------------------------------------------------------------------------------
// True space. A frame is flat metres bent round the axis: flat x is an angle (x / RHO), flat y is height toward it.
// Near the axis that squeezes everything sideways. To model a round thing properly, draw it in true space (x across,
// y up, the axis at y = RHO above x = 0) and call trueToFlat on the vertices just drawn.
// ---------------------------------------------------------------------------------------------------------------
export function trueToFlat(g, n0, rho0) {
  const b = g.buf, P = b.pos, N = b.nrm, ox = g.ox || 0;
  for (let i = n0; i < b.nv; i++) {
    const X = P[i * 3] + ox, Y = P[i * 3 + 1], dy = rho0 - Y;
    const rr = Math.hypot(X, dy), th = Math.atan2(X, dy), c = Math.cos(th), sn = Math.sin(th);
    P[i * 3] = rho0 * th - ox; P[i * 3 + 1] = rho0 - rr;
    const nx = N[i * 4] / 127, ny = N[i * 4 + 1] / 127;
    N[i * 4] = Math.round((nx * c + ny * sn) * 127); N[i * 4 + 1] = Math.round((-nx * sn + ny * c) * 127);
  }
}
// A point at angle th round the axis (0 = straight below it, growing spinward), rho from the axis, z along it, in true space.
export function polar(th, rho, z) { return [rho * Math.sin(th), RHO - rho * Math.cos(th), z]; }
// The same point as flat frame coordinates (for lights, spots and colliders).
export function polarFlat(th, rho, z) { const t = Math.atan2(Math.sin(th), Math.cos(th)); return [t * RHO, RHO - rho, z]; }
// Draw in true space with fn(g), remap, flush with o.
export function inTrue(s, fn, o) { const g = s.g, n0 = g.buf.nv; fn(g); trueToFlat(g, n0, RHO); s.flush(o || { tier: 's' }); }
// A turned shape whose axis is a radius of the drum: profile [[r, d], ...] with d measured inward (toward the axis) from
// the point at (th, rho, z). Drawn in true space; call inside inTrue.
export function radialLathe(g, th, rho, z, profile, o) {
  const p = polar(th, rho, z);
  g.push(); g.move(p[0], p[1], p[2]); g.rotZ(th); g.lathe(0, 0, profile, o); g.pop();
}

// ---------------------------------------------------------------------------------------------------------------
// A mesh of the scope's own that can be shown, hidden or moved every frame (a pouring stream, the view through a slit).
// draw(g) at its own origin; returns { mesh, origin, show(bool) }.
// ---------------------------------------------------------------------------------------------------------------
export function ownMesh(s, draw, o = {}) {
  const W = s.world, g = new Geo(new MeshBuf(1024, 2048));
  draw(g);
  const mesh = new THREE.Mesh(g.buf.toGeometry(), W.mats.opaque);
  const origin = (o.origin || [0, 0, 0]).slice();
  W.addRenderable(mesh, { frame: s.frame, origin, center: o.center || [0, 0, 0], radius: o.radius || 6, far: o.far || 200, caster: false, scope: s });
  s.meshes.push(mesh);
  const it = { mesh, origin, shown: true, show(v) { v = !!v; if (v !== it.shown) { it.shown = v; mesh.userData.hidden = !v; } } };
  if (o.hidden) it.show(false);
  return it;
}

// The inside faces of a box (a recess, a cabin): which = any of 'x X y Y z Z'.
export function innerBox(g, x0, y0, z0, x1, y1, z1, which) {
  if (which.indexOf('x') >= 0) g.box(x0, y0, z0, x0, y1, z1, { faces: 'X' });
  if (which.indexOf('X') >= 0) g.box(x1, y0, z0, x1, y1, z1, { faces: 'x' });
  if (which.indexOf('y') >= 0) g.box(x0, y0, z0, x1, y0, z1, { faces: 'Y' });
  if (which.indexOf('Y') >= 0) g.box(x0, y1, z0, x1, y1, z1, { faces: 'y' });
  if (which.indexOf('z') >= 0) g.box(x0, y0, z0, x1, y1, z0, { faces: 'Z' });
  if (which.indexOf('Z') >= 0) g.box(x0, y0, z1, x1, y1, z1, { faces: 'z' });
}

// A brass hand line on little brackets along a polyline of [x, z] at height y (people move by hand lines here).
// side: which way the brackets go to the wall (+1 or -1 relative to the line's left normal).
export function handLine(s, pts, y, o = {}) {
  const g = s.g, off = o.off || 0.07;
  g.mat('cast', o.tint || '#b08a45', { rough: -0.12 });
  // densify, so a long line bends with the drum instead of cutting a chord
  const dense = [];
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.0)); for (let k = 0; k < n; k++) dense.push([a[0] + (b[0] - a[0]) * k / n, y, a[1] + (b[1] - a[1]) * k / n]); }
  const last = pts[pts.length - 1]; dense.push([last[0], y, last[1]]);
  g.tube(dense, o.r || 0.022, { segs: 7 });
  g.mat('cast', o.bracket || '#4a4038');
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.max(1, Math.round(len / 1.4));
    const nx = (b[1] - a[1]) / (len || 1), nz = -(b[0] - a[0]) / (len || 1);
    for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; g.tube([[x, y, z], [x + nx * off * (o.side || 1), y, z + nz * off * (o.side || 1)]], 0.012, { segs: 5 }); }
  }
  s.flush({ tier: 'd', cast: false });
}

// A net: a grid of thin cords over a rectangle in a plane of constant z (x0..x1, y0..y1) or constant x.
export function netZ(s, x0, x1, z, y0, y1, cell, tint) {
  const g = s.g; g.mat('weave', tint || '#d8ccb0');
  for (let x = x0; x <= x1 + 1e-3; x += cell) g.tube([[x, y0, z], [x, y1, z]], 0.006, { segs: 3, caps: false });
  for (let y = y0; y <= y1 + 1e-3; y += cell) g.tube([[x0, y, z], [x1, y, z]], 0.006, { segs: 3, caps: false });
  s.flush({ tier: 'd', cast: false });
}
export function netX(s, x, z0, z1, y0, y1, cell, tint) {
  const g = s.g; g.mat('weave', tint || '#d8ccb0');
  for (let z = z0; z <= z1 + 1e-3; z += cell) g.tube([[x, y0, z], [x, y1, z]], 0.006, { segs: 3, caps: false });
  for (let y = y0; y <= y1 + 1e-3; y += cell) g.tube([[x, y, z0], [x, y, z1]], 0.006, { segs: 3, caps: false });
  s.flush({ tier: 'd', cast: false });
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------
// A low chair bolted to the floor, with a lap strap across the seat. p: { wood, cloth, strap }
defineProp('lm-axle-front.strapchair', (g, p) => {
  const wood = p.wood || '#6b4a2f', cloth = p.cloth || '#2f5d5a', strap = p.strap || '#d6a640';
  g.mat('cast', '#4a4038'); g.cyl(0, 0, 0, 0.2, 0.02, { segs: 14 }); g.cyl(0, 0.02, 0, 0.045, 0.36, { segs: 10 });
  for (const sx of [-1, 1]) g.box(sx * 0.17 - 0.012, 0.012, -0.012, sx * 0.17 + 0.012, 0.03, 0.012);
  g.mat('wood', wood, { rough: -0.05 }); g.box(-0.24, 0.38, -0.23, 0.24, 0.42, 0.22, { bevel: 0.015 });
  g.mat('felt', cloth); g.box(-0.22, 0.42, -0.21, 0.22, 0.47, 0.2, { bevel: 0.025 });
  g.mat('wood', wood, { rough: -0.05 }); g.box(-0.23, 0.42, -0.25, 0.23, 0.84, -0.21, { bevel: 0.015 });
  g.mat('felt', cloth); g.box(-0.2, 0.5, -0.215, 0.2, 0.8, -0.19, { bevel: 0.02 });
  for (const sx of [-1, 1]) { g.mat('wood', wood); g.box(sx * 0.25 - 0.025, 0.42, -0.23, sx * 0.25 + 0.025, 0.62, 0.18, { bevel: 0.01 }); }
  // the strap: two webbing halves lying across the seat and a brass buckle
  g.mat('weave', strap); g.box(-0.24, 0.47, 0.02, -0.02, 0.485, 0.07); g.box(0.04, 0.47, 0.02, 0.24, 0.485, 0.07);
  g.mat('cast', '#c8a45a', { rough: -0.15 }); g.box(-0.03, 0.465, 0.0, 0.05, 0.495, 0.09, { bevel: 0.005 });
  return { solid: [[-0.25, 0, -0.25, 0.25, 0.47, 0.22]], spots: [{ type: 'sit', x: 0, y: 0.47, z: 0.04, yaw: 0, tags: p.tags || ['rail', 'tea'] }], tier: 'd' };
});

// A cup with a clip-on lid: a squat stoneware beaker, a lid with a wire bail clipped over it. p: { glaze, lid }
defineProp('lm-axle-front.clipcup', (g, p) => {
  const c = p.glaze || '#e9e1cf';
  g.mat('glaze', c, { rough: -0.2 }); g.lathe(0, 0, [[0, 0], [0.034, 0], [0.04, 0.01], [0.042, 0.075], [0.044, 0.08]], { segs: 14, capTop: false });
  g.mat('glaze', p.lid || '#2f6f73', { rough: -0.2 }); g.lathe(0, 0, [[0.047, 0.078], [0.046, 0.088], [0.016, 0.096], [0.016, 0.104], [0, 0.106]], { segs: 14, capBottom: false });
  g.mat('cast', '#c8a45a'); for (const sx of [-1, 1]) g.tube([[sx * 0.046, 0.06, 0], [sx * 0.05, 0.085, 0], [sx * 0.02, 0.098, 0]], 0.0025, { segs: 3 });
  return { cast: false, tier: 'd' };
});

// The pot that pours: tall, narrow, with a long swan spout, on a weighted stand. p: { glaze }
defineProp('lm-axle-front.pot', (g, p) => {
  const c = p.glaze || '#2f6f73';
  g.mat('cast', '#3a3430'); g.cyl(0, 0, 0, 0.13, 0.04, { segs: 16 }); g.cyl(0, 0.04, 0, 0.02, 0.22, { segs: 8 }); g.cyl(0, 0.26, 0, 0.1, 0.02, { segs: 14 });
  g.mat('glaze', c, { rough: -0.25 });
  g.lathe(0, 0, [[0, 0.28], [0.07, 0.28], [0.095, 0.32], [0.1, 0.42], [0.085, 0.5], [0.06, 0.53], [0.062, 0.55]], { segs: 18, capTop: false });
  g.mat('glaze', '#e9e1cf', { rough: -0.2 }); g.lathe(0, 0, [[0.066, 0.545], [0.06, 0.565], [0.02, 0.58], [0.02, 0.6], [0, 0.605]], { segs: 14, capBottom: false });
  g.mat('glaze', c, { rough: -0.25 }); g.tube([[0.08, 0.34, 0], [0.16, 0.38, 0], [0.21, 0.47, 0], [0.25, 0.52, 0], [0.29, 0.53, 0]], [0.026, 0.02, 0.014, 0.011, 0.009], { segs: 8 });
  g.mat('cast', '#c8a45a'); g.tube([[-0.09, 0.48, 0], [-0.16, 0.46, 0], [-0.17, 0.38, 0], [-0.1, 0.34, 0]], 0.012, { segs: 6 });
  return { solid: [[-0.13, 0, -0.13, 0.13, 0.6, 0.13]], tier: 'd' };
});

// A sloped lectern with the visitors' book open on it, a pencil on a string. p: { wood }
defineProp('lm-axle-front.lectern', (g, p) => {
  const wood = p.wood || '#5a3a28';
  g.mat('wood', wood, { rough: -0.05 }); g.box(-0.28, 0, -0.22, 0.28, 0.06, 0.22, { bevel: 0.01 }); g.box(-0.06, 0.06, -0.06, 0.06, 0.95, 0.06, { bevel: 0.01 });
  g.push(); g.move(0, 1.0, 0); g.rotX(0.38);
  g.box(-0.34, -0.03, -0.24, 0.34, 0.0, 0.24, { bevel: 0.01 }); g.box(-0.34, 0.0, 0.22, 0.34, 0.04, 0.25);
  g.mat('leather', '#7a2f3c'); g.box(-0.3, 0.0, -0.2, 0.3, 0.02, 0.2, { bevel: 0.006 });
  g.mat('paper', '#f1e8d4'); g.box(-0.28, 0.02, -0.18, -0.01, 0.034, 0.18); g.box(0.01, 0.02, -0.18, 0.28, 0.034, 0.18);
  g.mat('paper', '#9a8c74'); for (let i = 0; i < 6; i++) { g.box(-0.25, 0.0345, -0.13 + i * 0.045, -0.05, 0.035, -0.12 + i * 0.045); g.box(0.04, 0.0345, -0.13 + i * 0.045, 0.22 - (i % 3) * 0.04, 0.035, -0.12 + i * 0.045); }
  g.mat('wood', '#c9a24a'); g.tube([[0.3, 0.04, -0.1], [0.3, 0.04, 0.08]], 0.005, { segs: 5 });
  g.pop();
  g.mat('weave', '#a82a2a'); g.tube([[0.3, 1.0, 0.02], [0.33, 0.85, 0.05], [0.31, 0.7, 0.04], [0.06, 0.62, 0.0]], 0.003, { segs: 3 });
  return { solid: [[-0.3, 0, -0.25, 0.3, 1.1, 0.25]], tier: 'd' };
});

// A ceiling lamp for low weight: a rigid stem and a ribbed glass shade, nothing to swing. p: { glass }
defineProp('lm-axle-front.stemlamp', (g, p) => {
  g.mat('cast', '#4a4038'); g.cyl(0, -0.02, 0, 0.06, 0.02, { segs: 10 }); g.cyl(0, -0.5, 0, 0.012, 0.48, { segs: 6 });
  g.mat('cast', '#b08a45', { rough: -0.1 }); g.cyl(0, -0.54, 0, 0.04, 0.04, { segs: 10 });
  return { cast: false, tier: 'd' };
});
