// Shared pieces for the back axle and the Window (region 'axle-back'): small helpers for lines and seats, a way to model
// round things in true space near the axis, meshes the scope can move every frame, and the props both places use.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { defineProp } from '../world/props.js';

export const PI = Math.PI;

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
    prompt: (game) => (game.player.seat ? 'Stand up' : (typeof label === 'function' ? label(game) : label)),
    onUse(game) {
      const p = game.player; if (p.seat) { p.stand(); if (o.onStand) o.onStand(game); return; }
      p.sit({ x, y: y + (o.lift || 0), z, yaw: PI - yaw, eye: o.eye || 1.12 }); p.yaw = PI - yaw; p.pitch = o.pitch || 0.02;
      if (o.onSit) o.onSit(game);
    } });
}

// ---------------------------------------------------------------------------------------------------------------
// True space. A frame is flat metres bent round the axis: flat x is an angle (x / rho0), flat y is height toward the axis.
// Near the axis that squeezes everything sideways. To model a round thing properly (a pipe forty metres up, a ring round
// the axis), draw it in true space (x across, y up, the axis at y = rho0 above x = 0) and then call trueToFlat on the
// vertices just drawn: the engine's bend turns them back into the shape you drew.
// ---------------------------------------------------------------------------------------------------------------
export function trueToFlat(g, n0, rho0) {
  const b = g.buf, P = b.pos, N = b.nrm;
  for (let i = n0; i < b.nv; i++) {
    const X = P[i * 3], Y = P[i * 3 + 1], dy = rho0 - Y;
    const rr = Math.hypot(X, dy), th = Math.atan2(X, dy), c = Math.cos(th), sn = Math.sin(th);
    P[i * 3] = rho0 * th; P[i * 3 + 1] = rho0 - rr;
    const nx = N[i * 4] / 127, ny = N[i * 4 + 1] / 127;
    N[i * 4] = Math.round((nx * c + ny * sn) * 127); N[i * 4 + 1] = Math.round((-nx * sn + ny * c) * 127);
  }
}
// A point at angle th round the axis (0 = straight below it, growing spinward), rho from the axis, z along it, in true space.
export function polar(th, rho, z, rho0) { return [rho * Math.sin(th), rho0 - rho * Math.cos(th), z]; }
// The same point as flat frame coordinates (for lights, spots and colliders).
export function polarFlat(th, rho, z, rho0) { return [th * rho0, rho0 - rho, z]; }
// Draw in true space with fn(g), remap, flush with o.
export function inTrue(s, rho0, fn, o) { const g = s.g, n0 = g.buf.nv; fn(g); trueToFlat(g, n0, rho0); s.flush(o || { tier: 's' }); }

// ---------------------------------------------------------------------------------------------------------------
// A mesh of the scope's that can be moved every frame (a turning collar, a rolling shutter). Draw it at its own origin with
// draw(g); move it by changing the returned origin. Turning about the axis is a shift of origin[0] (flat x is an angle).
// o: { origin: [x, y, z], center, radius, far }
// ---------------------------------------------------------------------------------------------------------------
export function movingMesh(s, draw, o = {}) {
  const W = s.world, g = new Geo(new MeshBuf(2048, 4096));
  draw(g);
  const mesh = new THREE.Mesh(g.buf.toGeometry(), W.mats.opaque);
  const origin = (o.origin || [0, 0, 0]).slice();
  W.addRenderable(mesh, { frame: s.frame, origin, center: o.center || [0, 0, 0], radius: o.radius || 12, far: o.far || 400, caster: false, scope: s });
  s.meshes.push(mesh);
  return { mesh, origin };
}

// The inside faces of a box (a recess, a cabin): which = any of 'x X y Y z Z', naming the walls at the low and high ends
// of each axis ('x' is the wall at x0, seen from inside, so it faces +x).
export function innerBox(g, x0, y0, z0, x1, y1, z1, which) {
  if (which.indexOf('x') >= 0) g.box(x0, y0, z0, x0, y1, z1, { faces: 'X' });
  if (which.indexOf('X') >= 0) g.box(x1, y0, z0, x1, y1, z1, { faces: 'x' });
  if (which.indexOf('y') >= 0) g.box(x0, y0, z0, x1, y0, z1, { faces: 'Y' });
  if (which.indexOf('Y') >= 0) g.box(x0, y1, z0, x1, y1, z1, { faces: 'y' });
  if (which.indexOf('z') >= 0) g.box(x0, y0, z0, x1, y1, z0, { faces: 'Z' });
  if (which.indexOf('Z') >= 0) g.box(x0, y0, z1, x1, y1, z1, { faces: 'z' });
}

// A brass hand line on little brackets along a polyline at height y (people move by hand lines where they weigh little).
export function handLine(s, pts, y, o = {}) {
  const g = s.g, off = o.off || 0.07;
  g.mat('cast', o.tint || '#b08a45', { rough: -0.12 });
  const path = pts.map((p) => [p[0], y, p[1]]);
  g.tube(path, o.r || 0.022, { segs: 7 });
  g.mat('cast', o.bracket || '#4a4038');
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); const n = Math.max(1, Math.round(len / 1.4));
    const nx = (b[1] - a[1]) / (len || 1), nz = -(b[0] - a[0]) / (len || 1);
    for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; g.tube([[x, y, z], [x + nx * off * (o.side || 1), y, z + nz * off * (o.side || 1)]], 0.012, { segs: 5 }); }
  }
  s.flush({ tier: 'd', cast: false, level: o.level });
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------
// A pair of ear defenders hanging by its band from a hook. p: { cup, band }
defineProp('lm-axle-back.defenders', (g, p) => {
  const cup = p.cup || '#c9552e', band = p.band || '#2f3a36';
  g.mat('cast', '#3a3430'); g.tube([[0, 0.02, -0.04], [0, 0.02, 0.02], [0, 0.07, 0.04]], 0.006, { segs: 5 });      // the hook
  g.mat('brushed', band);
  const arc = []; for (let i = 0; i <= 10; i++) { const a = PI * i / 10; arc.push([-Math.cos(a) * 0.088, -0.1 + Math.sin(a) * 0.1, 0.03]); }
  g.tube(arc, 0.011, { segs: 6 });
  for (const sx of [-1, 1]) {
    g.mat('glaze', cup, { rough: 0.05 }); g.ball(sx * 0.09, -0.12, 0.03, 0.028, 0.048, 0.042, { segs: 10, rings: 7 });
    g.mat('felt', '#2a2624'); g.ball(sx * 0.07, -0.12, 0.03, 0.012, 0.04, 0.034, { segs: 8, rings: 5 });
  }
  return { cast: false, tier: 'd' };
});

// A felt slipper pair on a shelf. p: { felt, sole, size (1 adult, 0.7 child) }
defineProp('lm-axle-back.slippers', (g, p) => {
  const k = p.size || 1, felt = p.felt || '#7a2f3c', sole = p.sole || '#3a3430';
  for (const sx of [-1, 1]) {
    const x = sx * 0.055 * k;
    g.mat('rush', sole); g.box(x - 0.04 * k, 0, -0.12 * k, x + 0.04 * k, 0.012, 0.12 * k, { bevel: 0.005 });
    g.mat('felt', felt); g.ball(x, 0.012, 0.02 * k, 0.042 * k, 0.04 * k, 0.1 * k, { segs: 10, rings: 6, bottom: 0 });
  }
  return { cast: false, tier: 'd' };
});

// A deep couch for the Window, long and low, felt over a wooden frame. p: { w, cloth, wood }
defineProp('lm-axle-back.couch', (g, p) => {
  const w = p.w || 2.4, cloth = p.cloth || '#3a2f3f', wood = p.wood || '#4a3426';
  g.mat('wood', wood, { rough: -0.02 }); g.box(-w / 2, 0.06, -0.42, w / 2, 0.24, 0.36, { bevel: 0.02 });
  for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.05) - 0.05, 0, -0.4, sx * (w / 2 - 0.05) + 0.05, 0.08, 0.34);
  g.mat('felt', cloth); g.box(-w / 2 + 0.02, 0.24, -0.36, w / 2 - 0.02, 0.4, 0.34, { bevel: 0.05 });
  g.mat('felt', cloth); g.box(-w / 2 + 0.02, 0.36, -0.46, w / 2 - 0.02, 0.86, -0.28, { bevel: 0.06 });
  g.mat('wood', wood); for (const sx of [-1, 1]) g.box(sx * w / 2 - (sx > 0 ? 0.1 : 0), 0.24, -0.46, sx * w / 2 + (sx > 0 ? 0 : 0.1), 0.58, 0.36, { bevel: 0.02 });
  const spots = []; const n = Math.max(1, Math.floor(w / 0.62));
  for (let i = 0; i < n; i++) spots.push({ type: 'sit', x: -w / 2 + (i + 0.5) * w / n, y: 0.4, z: 0.02, yaw: 0, tags: ['watch', 'window'] });
  return { solid: [[-w / 2, 0, -0.46, w / 2, 0.4, 0.36]], spots, tier: 's' };
});

// A robe hanging on a peg: a long soft sheet. p: { cloth }
defineProp('lm-axle-back.robe', (g, p) => {
  g.mat('cast', '#5a4a33'); g.tube([[0, 0, -0.06], [0, 0, 0.04]], 0.012, { segs: 5 });
  const c = p.cloth || '#5b4060';
  g.mat('weave', c);
  // body: front and back panels, narrow at the shoulders and wider at the hem
  g.sheet([-0.17, -0.07, 0.1], [0.17, -0.07, 0.1], [0.27, -1.15, 0.14], [-0.27, -1.15, 0.14], { sag: 0.0, ripple: 0.03, nu: 4, nv: 5 });
  g.sheet([-0.17, -0.07, 0.03], [0.17, -0.07, 0.03], [0.25, -1.12, 0.02], [-0.25, -1.12, 0.02], { sag: 0.0, ripple: 0.02, nu: 3, nv: 4 });
  // sleeves hanging at the sides
  for (const sx of [-1, 1]) g.sheet([sx * 0.15, -0.08, 0.04], [sx * 0.22, -0.1, 0.1], [sx * 0.28, -0.72, 0.12], [sx * 0.2, -0.72, 0.06], { sag: 0.0, ripple: 0.02, nu: 2, nv: 3 });
  // the collar and a tie, in the trim colour
  g.mat('weave', p.trim || '#d6a640');
  const ring = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ring.push([Math.cos(a) * 0.09, -0.07, 0.065 + Math.sin(a) * 0.045]); } g.tube(ring, 0.02, { segs: 5, closed: true });
  g.box(-0.012, -0.62, 0.135, 0.012, -0.3, 0.145); g.box(-0.27, -1.16, 0.13, 0.27, -1.12, 0.15);
  return { cast: false, tier: 'd' };
});
