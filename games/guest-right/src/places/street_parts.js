// Shared parts for Candlewick's streets (Ladle Row, Thread Street) and the fernery: the street shell bay by bay,
// ordinary house fronts, threshold arches and the runs on into the next blocks, and the street furniture.
// Positions on a street are (a, v): a runs along the street, v across it. A side of a street is (a, d): d is the depth
// behind its front line (0 on the front, negative toward the street).
import * as THREE from 'three';
import { lamp, warm } from '../world/kit.js';
import { archway, planter } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { Rng, hashStr, shadeHex, mixHex } from '../core/util.js';

// ---------------------------------------------------------------------------------------------------------------
// street and side descriptors
// ---------------------------------------------------------------------------------------------------------------
// c0: where the street's centre line lies across the frame (z for a street along x, x for one along z). Default 0.
export function street(axis, hw, H, c0 = 0) {
  const X = axis === 'x';
  const st = { axis, X, hw, H, c0 };
  st.xz = (a, v) => (X ? [a, v + c0] : [v + c0, a]);
  st.pt = (a, y, v) => (X ? [a, y, v + c0] : [v + c0, y, a]);
  st.bx = (a0, v0, a1, v1, y0, y1) => (X ? [Math.min(a0, a1), y0, Math.min(v0, v1) + c0, Math.max(a0, a1), y1, Math.max(v0, v1) + c0] : [Math.min(v0, v1) + c0, y0, Math.min(a0, a1), Math.max(v0, v1) + c0, y1, Math.max(a0, a1)]);
  const MAP = X ? { a: 'x', A: 'X', v: 'z', V: 'Z' } : { a: 'z', A: 'Z', v: 'x', V: 'X' };
  st.F = (f) => f.replace(/[aAvV]/g, (c) => MAP[c]);
  st.box = (g, a0, v0, a1, v1, y0, y1, o) => { const b = st.bx(a0, v0, a1, v1, y0, y1); if (o && o.faces) o = Object.assign({}, o, { faces: st.F(o.faces) }); g.box(b[0], b[1], b[2], b[3], b[4], b[5], o); };
  st.solid = (s, a0, v0, a1, v1, y0, y1, o) => { const b = st.bx(a0, v0, a1, v1, y0, y1); return s.solid(b[0], b[1], b[2], b[3], b[4], b[5], o); };
  st.tube = (g, pts, r, o) => g.tube(pts.map((p) => st.pt(p[0], p[1], p[2])), r, o);
  st.yawA = (sg) => (X ? (sg > 0 ? Math.PI / 2 : -Math.PI / 2) : (sg > 0 ? 0 : Math.PI));     // a prop facing +a / -a
  st.yawV = (sg) => (X ? (sg > 0 ? 0 : Math.PI) : (sg > 0 ? Math.PI / 2 : -Math.PI / 2));     // a prop facing +v / -v
  st.faceV = (sg) => (X ? (sg > 0 ? 'Z' : 'z') : (sg > 0 ? 'X' : 'x'));
  st.faceA = (sg) => (X ? (sg > 0 ? 'X' : 'x') : (sg > 0 ? 'Z' : 'z'));
  st.propYaw = X ? 0 : -Math.PI / 2;                                                           // lays a prop's local x along +a
  st.alongA = X ? 'x' : 'z';
  st.alongV = X ? 'z' : 'x';
  return st;
}

export function side(st, c, out) {
  const sd = { st, c, out };
  sd.v = (d) => c - out * d;
  sd.F = (f) => f.replace(/[fb]/g, (ch) => ((ch === 'f') === (out > 0) ? 'V' : 'v'));
  sd.box = (g, a0, a1, d0, d1, y0, y1, o) => st.box(g, a0, sd.v(d0), a1, sd.v(d1), y0, y1, o && o.faces ? Object.assign({}, o, { faces: sd.F(o.faces) }) : o);
  sd.pt = (a, y, d) => st.pt(a, y, sd.v(d));
  sd.xz = (a, d) => st.xz(a, sd.v(d));
  sd.solid = (s, a0, a1, d0, d1, y0, y1, o) => st.solid(s, a0, sd.v(d0), a1, sd.v(d1), y0, y1, o);
  sd.face = st.faceV(out);            // a sign on the front, looking at the street
  sd.yaw = st.yawV(out);              // a prop with its front to the street
  return sd;
}

// player yaw (0 looks to -z) from a prop's facing yaw (0 faces +z)
export function lookYaw(propYaw) { return Math.PI - propYaw; }

// reading and small notes, safe without a UI
export async function read(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(who, lines); } finally { game.busy--; }
}
export function note(game, text) { if (game.ui) game.ui.toast(text, { kind: 'info', dur: 5 }); }
export function found(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }

// ---------------------------------------------------------------------------------------------------------------
// colours
// ---------------------------------------------------------------------------------------------------------------
export const FELT = ['#c9962e', '#2f6f73', '#b5532e', '#33407a', '#6b7a3a', '#8a2f3c'];
export const LANTERN = ['#e8743b', '#f2c14e', '#3fa7a3', '#d95d7a', '#7aa85a', '#e9e2d0', '#c9552e'];
export const CLOTH = ['#5b3a6e', '#d4878a', '#d6a640', '#26306b', '#5f8a3a', '#b5653a', '#2f6f8f', '#8a2f3c', '#e0b04a', '#3f7f6a'];

// The finishes of ordinary fronts: every unit is somebody's, so no two neighbours match.
export const FIN = [
  { mat: 'plaster', tint: '#c45a36', dado: { h: 1.0, mat: 'tile', tint: '#2f6f73' }, trim: '#efe2c6', door: '#26306b', curtain: '#e8c26a' },
  { mat: 'paint', tint: '#2f6f73', dado: { h: 0.95, mat: 'wood', tint: '#5b3a26' }, trim: '#e3b456', door: '#a8412b', curtain: '#d98c5f' },
  { mat: 'plaster', tint: '#d9a441', dado: { h: 1.1, mat: 'pattern', tint: '#33407a' }, trim: '#3a2a20', door: '#2f6f73', curtain: '#b5532e' },
  { mat: 'flute', tint: '#8a5634', dado: null, trim: '#ead9b6', door: '#6b7a3a', curtain: '#f0d79a' },
  { mat: 'paint', tint: '#33407a', dado: { h: 1.0, mat: 'mosaic', tint: '#d8c8a8' }, trim: '#e9c46a', door: '#c9962e', curtain: '#f2c879' },
  { mat: 'plaster', tint: '#e5d3b0', dado: { h: 1.2, mat: 'tile', tint: '#8a2f3c' }, trim: '#2f4f43', door: '#8a2f3c', curtain: '#cf7a5a' },
  { mat: 'block', tint: '#8fae96', dado: { h: 0.9, mat: 'wood', tint: '#3a2a20' }, trim: '#f0e6cf', door: '#3a2a20', curtain: '#e5b25d' },
  { mat: 'plaster', tint: '#b45f78', dado: { h: 1.05, mat: 'tile', tint: '#2b3a36' }, trim: '#f2e6cc', door: '#2f5d50', curtain: '#f0c98a' },
  { mat: 'wood', tint: '#a8794f', dado: { h: 0.9, mat: 'tile', tint: '#c9552e' }, trim: '#2a2622', door: '#33407a', curtain: '#9fc2a8' },
];

// ---------------------------------------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------------------------------------
// One bay of the street's ceiling services, a = 0..L along local x, v across local z (width W), the ceiling at H.
// p: { L, W, H, hatch }
defineProp('streets.bay', (g, p) => {
  const L = p.L, W = p.W, H = p.H, hw = W / 2;
  // the beam at a = 0: an I-section in oxide red on corbels at both fronts
  g.mat('paint', '#7d3526', { rough: -0.12 });
  g.box(-0.12, H - 0.37, -hw, 0.12, H - 0.33, hw, { bevel: 0.012 });
  g.box(-0.022, H - 0.33, -hw, 0.022, H, hw, { faces: 'xX' });
  g.box(-0.1, H - 0.05, -hw, 0.1, H - 0.02, hw, { faces: 'yxX' });
  // rivets along the flange edges
  g.mat('cast', '#5e2a20');
  for (let z = -hw + 0.5; z < hw - 0.3; z += 0.5) for (const sx of [-1, 1]) g.box(sx * 0.09 - 0.012, H - 0.385, z - 0.012, sx * 0.09 + 0.012, H - 0.37, z + 0.012);
  if (p.beamOnly) return { tier: 's', cast: false };
  // ceiling panels, cream, riveted, and a shallow stringer down the middle
  g.mat('panel', '#b5aa92'); g.box(0, H, -hw, L, H + 0.02, hw, { faces: 'y' });
  g.mat('paint', '#8e8572'); g.box(0, H - 0.06, -0.08, L, H, 0.08, { faces: 'yzZ' });
  // the air duct: galvanised, with joint flanges and straps
  const dv = hw - 1.0, dy = H - 0.19, R = 0.15;
  g.mat('brushed', '#aca89e'); g.tube([[0, dy, dv], [L, dy, dv]], R, { segs: 14, caps: false });
  g.mat('brushed', '#8d897f'); for (const a of [0.35, L / 2 + 0.35]) g.tube([[a - 0.035, dy, dv], [a + 0.035, dy, dv]], R + 0.018, { segs: 14 });
  g.mat('cast', '#34302b');
  for (const a of [L * 0.22, L * 0.72]) {
    const ring = []; for (let i = 0; i < 14; i++) { const t = i / 14 * Math.PI * 2; ring.push([a, dy + Math.sin(t) * (R + 0.008), dv + Math.cos(t) * (R + 0.008)]); }
    g.tube(ring, 0.008, { segs: 4, closed: true });
    g.box(a - 0.015, dy + R, dv - 0.01, a + 0.015, H, dv + 0.01, { faces: 'xXzZ' });
  }
  // a stencilled access door on the duct
  g.mat('paint', '#d6cfbd'); g.box(L * 0.45, dy - 0.1, dv - R - 0.012, L * 0.45 + 0.36, dy + 0.06, dv - R + 0.03, { bevel: 0.006 });
  // the pipe run: brass, red, and the felt-lagged loop pipe with brass bands
  const pv = -(hw - 0.62);
  g.mat('cast', '#b08a45'); g.tube([[0, H - 0.13, pv], [L, H - 0.13, pv]], 0.03, { segs: 8, caps: false });
  g.mat('paint', '#8a2f2a', { rough: -0.1 }); g.tube([[0, H - 0.14, pv + 0.13], [L, H - 0.14, pv + 0.13]], 0.038, { segs: 8, caps: false });
  g.mat('felt', '#d6ccb4'); g.tube([[0, H - 0.2, pv + 0.33], [L, H - 0.2, pv + 0.33]], 0.075, { segs: 10, caps: false });
  g.mat('cast', '#a8823f'); for (const a of [0.6, L / 2, L - 0.6]) g.tube([[a - 0.025, H - 0.2, pv + 0.33], [a + 0.025, H - 0.2, pv + 0.33]], 0.082, { segs: 10 });
  g.mat('cast', '#2f2c28');
  for (const a of [L * 0.5 - 0.5]) { g.box(a - 0.02, H - 0.3, pv - 0.08, a + 0.02, H - 0.27, pv + 0.45); for (const z of [pv - 0.06, pv + 0.43]) g.box(a - 0.012, H - 0.27, z - 0.012, a + 0.012, H, z + 0.012); }
  // the cable tray with its cables
  const tv = -(hw - 1.55), ty = H - 0.22;
  g.mat('cast', '#5d625b'); g.box(0, ty, tv - 0.16, L, ty + 0.012, tv + 0.16, { faces: 'yYxX' });
  g.box(0, ty, tv - 0.165, L, ty + 0.06, tv - 0.15, { faces: 'yYzZ' }); g.box(0, ty, tv + 0.15, L, ty + 0.06, tv + 0.165, { faces: 'yYzZ' });
  const cc = ['#1f1e1c', '#7a2e22', '#c9962e', '#2b3a5a'];
  for (let k = 0; k < 4; k++) { g.mat('leather', cc[k]); const z = tv - 0.1 + k * 0.065; g.tube([[0, ty + 0.03, z], [L * 0.5, ty + 0.03 + (k % 2) * 0.01, z + 0.01], [L, ty + 0.03, z]], 0.016, { segs: 5, caps: false }); }
  g.mat('cast', '#2f2c28'); for (const z of [tv - 0.17, tv + 0.17]) g.box(L * 0.5 - 0.01, ty, z - 0.01, L * 0.5 + 0.01, H, z + 0.01);
  // an access hatch in the ceiling
  if (p.hatch) {
    const a0 = L * 0.24, z0 = 0.35;
    g.mat('paint', '#7a7466'); g.box(a0, H - 0.035, z0, a0 + 0.8, H, z0 + 0.04); g.box(a0, H - 0.035, z0 + 0.76, a0 + 0.8, H, z0 + 0.8); g.box(a0, H - 0.035, z0, a0 + 0.04, H, z0 + 0.8); g.box(a0 + 0.76, H - 0.035, z0, a0 + 0.8, H, z0 + 0.8);
    g.mat('panel', '#b5ac96'); g.box(a0 + 0.04, H - 0.02, z0 + 0.04, a0 + 0.76, H - 0.005, z0 + 0.76, { faces: 'y' });
    g.mat('cast', '#c8a45a'); g.tube([[a0 + 0.3, H - 0.02, z0 + 0.4], [a0 + 0.32, H - 0.07, z0 + 0.4], [a0 + 0.48, H - 0.07, z0 + 0.4], [a0 + 0.5, H - 0.02, z0 + 0.4]], 0.009, { segs: 5 });
  }
  return { tier: 's', cast: false };
});

// The street lamp: an enamel dish on a rod, hung from a beam. Origin at the fixing; it hangs `drop` metres.
defineProp('streets.lamp', (g, p) => {
  const d = p.drop || 0.6, y0 = -d;
  g.mat('cast', '#2b2a27'); g.tube([[0, 0, 0], [0, y0 + 0.22, 0]], 0.009, { segs: 5, caps: false });
  g.cyl(0, y0 + 0.19, 0, 0.04, 0.06, { segs: 10 });
  g.mat('glaze', p.shade || '#2f5146', { rough: -0.25 });
  g.lathe(0, 0, [[0.29, y0], [0.285, y0 + 0.025], [0.2, y0 + 0.095], [0.08, y0 + 0.165], [0.045, y0 + 0.2]], { segs: 18, capBottom: false });
  g.mat('glaze', '#f6e8c6', { emissive: 1.3, lamp: true });
  g.lathe(0, 0, [[0.04, y0 + 0.19], [0.075, y0 + 0.158], [0.19, y0 + 0.088], [0.278, y0 + 0.022]], { segs: 18, capBottom: false, capTop: false });
  g.mat('diffuser', '#fff0cc', { emissive: 7, lamp: true }); g.ball(0, y0 + 0.07, 0, 0.065, 0.075, 0.065, { segs: 10, rings: 7 });
  g.mat('cast', '#b08a45'); const ring = []; for (let i = 0; i < 18; i++) { const t = i / 18 * Math.PI * 2; ring.push([Math.cos(t) * 0.29, y0, Math.sin(t) * 0.29]); } g.tube(ring, 0.009, { segs: 4, closed: true });
  return { tier: 's', cast: false };
});

// A cloth festival lantern hung from a hook at the origin. p: { c, r }
defineProp('streets.lantern', (g, p) => {
  const r = p.r || 0.13, hh = r * 1.8, top = -0.12;
  g.mat('brushed', '#4a4038'); g.tube([[0, 0, 0], [0, top, 0]], 0.004, { segs: 4, caps: false });
  g.mat('paper', p.c, { emissive: 1.5, lamp: true });
  g.lathe(0, 0, [[r * 0.4, top - hh], [r * 0.7, top - hh * 0.9], [r * 0.93, top - hh * 0.72], [r, top - hh * 0.5], [r * 0.93, top - hh * 0.28], [r * 0.7, top - hh * 0.1], [r * 0.4, top]], { segs: 14 });
  g.mat('wood', '#3b2a1e'); for (const t of [0.28, 0.5, 0.72]) { const rr = t === 0.5 ? r : r * 0.93; const ring = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ring.push([Math.cos(a) * (rr + 0.003), top - hh * t, Math.sin(a) * (rr + 0.003)]); } g.tube(ring, 0.003, { segs: 3, closed: true }); }
  g.mat('wood', '#3b2a1e'); g.cyl(0, top - 0.02, 0, r * 0.42, 0.025, { segs: 8 }); g.cyl(0, top - hh - 0.01, 0, r * 0.42, 0.025, { segs: 8 });
  g.mat('weave', shadeHex(p.c, 0.7)); g.tube([[0, top - hh - 0.01, 0], [0, top - hh - 0.1, 0]], 0.012, { segs: 4 });
  return { tier: 's', cast: false };
});

// A bicycle, side-on along local x, standing on its stand. p: { c, basket }
defineProp('streets.bicycle', (g, p) => {
  const R = 0.33, wb = 1.04, fx = wb / 2, rx = -wb / 2, hy = R;
  const wheel = (x) => {
    const ring = []; for (let i = 0; i < 22; i++) { const t = i / 22 * Math.PI * 2; ring.push([x + Math.cos(t) * R, hy + Math.sin(t) * R, 0]); }
    g.mat('speckle', '#222120'); g.tube(ring, 0.022, { segs: 5, closed: true });
    g.mat('brushed', '#b9b4aa'); const rim = ring.map((q) => [x + (q[0] - x) * 0.9, hy + (q[1] - hy) * 0.9, 0]); g.tube(rim, 0.008, { segs: 4, closed: true });
    for (let i = 0; i < 6; i++) { const t = i / 6 * Math.PI; g.tube([[x + Math.cos(t) * R * 0.88, hy + Math.sin(t) * R * 0.88, 0], [x - Math.cos(t) * R * 0.88, hy - Math.sin(t) * R * 0.88, 0]], 0.003, { segs: 3, caps: false }); }
    g.cyl(x, hy - 0.04, 0, 0.03, 0.08, { segs: 8 });
  };
  wheel(rx); wheel(fx);
  const c = p.c || '#2f6f73'; g.mat('paint', c, { rough: -0.15 });
  const bb = [-0.04, 0.28, 0], seat = [-0.2, 0.84, 0], head = [0.36, 0.86, 0], headLo = [0.4, 0.7, 0];
  g.tube([bb, seat], 0.018, { segs: 6 }); g.tube([bb, headLo], 0.02, { segs: 6 }); g.tube([[seat[0] + 0.03, seat[1] - 0.06, 0], [head[0], head[1] - 0.04, 0]], 0.016, { segs: 6 });
  for (const sz of [-1, 1]) { g.tube([[rx, hy, sz * 0.05], bb], 0.011, { segs: 5 }); g.tube([[rx, hy, sz * 0.05], [seat[0] + 0.02, seat[1] - 0.06, 0]], 0.01, { segs: 5 }); g.tube([[head[0], head[1], 0], [fx, hy, sz * 0.05]], 0.012, { segs: 5 }); }
  g.tube([[head[0], head[1], 0], [head[0] - 0.02, 1.02, 0]], 0.014, { segs: 6 });
  g.mat('brushed', '#9c978d'); g.tube([[head[0] - 0.1, 1.02, -0.27], [head[0] - 0.02, 1.02, -0.2], [head[0] - 0.02, 1.02, 0.2], [head[0] - 0.1, 1.02, 0.27]], 0.011, { segs: 5 });
  g.mat('leather', '#2a1d16'); for (const sz of [-1, 1]) g.tube([[head[0] - 0.1, 1.02, sz * 0.27], [head[0] - 0.16, 1.02, sz * 0.29]], 0.017, { segs: 6 });
  g.mat('leather', '#4a2c1c'); g.box(seat[0] - 0.12, seat[1], -0.06, seat[0] + 0.1, seat[1] + 0.05, 0.06, { bevel: 0.02 });
  g.mat('paint', shadeHex(c, 0.8)); const arc = []; for (let i = 0; i <= 8; i++) { const t = Math.PI * (0.15 + 0.65 * i / 8); arc.push([rx + Math.cos(t) * (R + 0.05), hy + Math.sin(t) * (R + 0.05), 0]); } g.tube(arc, 0.03, { segs: 5 });
  g.mat('cast', '#2b2a27'); g.tube([[bb[0], bb[1], 0.05], [bb[0] - 0.08, 0.0, 0.18]], 0.008, { segs: 4 });
  g.box(bb[0] - 0.09, 0.2, 0.05, bb[0] + 0.09, 0.36, 0.08);
  if (p.basket) { g.mat('cane', '#b8935a'); g.box(fx - 0.18, 0.86, -0.17, fx + 0.14, 1.06, 0.17, { faces: 'xXzZy' }); g.mat('weave', p.basket); g.ball(fx - 0.02, 1.02, 0, 0.13, 0.08, 0.13, { segs: 8, rings: 4, bottom: 0 }); }
  return { solid: [[-0.86, 0, -0.12, 0.84, 1.0, 0.12]], tier: 'd' };
});

// A handcart: a slatted bed on two wheels, with its handles down. Along local x, handles toward +x. p: { c, load }
defineProp('streets.handcart', (g, p) => {
  const c = p.c || '#8a5634';
  g.mat('wood', c, { rough: 0.05 }); g.box(-0.7, 0.42, -0.42, 0.55, 0.47, 0.42, { bevel: 0.01 });
  for (const sz of [-1, 1]) g.box(-0.7, 0.47, sz * 0.42 - 0.02, 0.55, 0.72, sz * 0.42 + 0.02, { bevel: 0.008 });
  g.box(-0.72, 0.47, -0.42, -0.68, 0.72, 0.42, { bevel: 0.008 });
  g.mat('wood', shadeHex(c, 0.7)); for (const sz of [-1, 1]) g.tube([[-0.6, 0.44, sz * 0.36], [0.55, 0.44, sz * 0.36], [1.2, 0.12, sz * 0.3]], 0.025, { segs: 6 });
  g.tube([[1.18, 0.12, -0.32], [1.18, 0.12, 0.32]], 0.022, { segs: 6 });
  for (const sz of [-1, 1]) {
    const ring = []; for (let i = 0; i < 20; i++) { const t = i / 20 * Math.PI * 2; ring.push([-0.15 + Math.cos(t) * 0.3, 0.3 + Math.sin(t) * 0.3, sz * 0.5]); }
    g.mat('cast', '#2b2a27'); g.tube(ring, 0.025, { segs: 5, closed: true });
    g.mat('wood', '#5b3a26'); for (let i = 0; i < 4; i++) { const t = i / 4 * Math.PI; g.tube([[-0.15 + Math.cos(t) * 0.28, 0.3 + Math.sin(t) * 0.28, sz * 0.5], [-0.15 - Math.cos(t) * 0.28, 0.3 - Math.sin(t) * 0.28, sz * 0.5]], 0.012, { segs: 4, caps: false }); }
  }
  g.mat('cast', '#2b2a27'); g.tube([[-0.15, 0.3, -0.5], [-0.15, 0.3, 0.5]], 0.018, { segs: 6 });
  g.tube([[-0.65, 0.42, 0], [-0.65, 0.0, 0]], 0.02, { segs: 5 });
  if (p.load === 'cloth') {
    const cols = ['#5b3a6e', '#d6a640', '#26306b', '#d4878a'];
    for (let i = 0; i < 4; i++) { g.mat('weave', cols[i]); g.box(-0.6 + i * 0.28, 0.47, -0.36, -0.36 + i * 0.28, 0.47 + 0.12 + (i % 2) * 0.05, 0.36, { bevel: 0.04 }); }
  } else if (p.load === 'crates') {
    g.mat('wood', '#b08d5e'); g.box(-0.62, 0.47, -0.36, -0.08, 0.8, 0.0, { bevel: 0.01 }); g.box(-0.05, 0.47, -0.3, 0.48, 0.72, 0.34, { bevel: 0.01 });
    g.mat('glaze', '#8a5a3c'); g.cyl(-0.35, 0.8, -0.18, 0.1, 0.18, { segs: 10 });
  }
  return { solid: [[-0.75, 0, -0.55, 1.22, 0.75, 0.55]], tier: 'd' };
});

// The street sweeper: a squat appliance on its charging plate. Front toward +z.
defineProp('streets.sweeper', (g) => {
  g.mat('cast', '#3a3632'); g.box(-0.42, 0, -0.42, 0.42, 0.03, 0.42, { bevel: 0.01 });
  g.mat('brushed', '#c9a43c'); g.box(-0.36, 0.03, -0.36, 0.36, 0.035, 0.36);
  g.mat('knit', '#2b2a27'); g.lathe(0, 0, [[0.3, 0.035], [0.33, 0.06], [0.31, 0.1]], { segs: 18, capBottom: false, capTop: false });
  g.mat('paint', '#d9a441', { rough: -0.2 }); g.lathe(0, 0, [[0.31, 0.1], [0.32, 0.14], [0.31, 0.34], [0.27, 0.4], [0.16, 0.43], [0, 0.44]], { segs: 20 });
  g.mat('speckle', '#2b2a27'); g.lathe(0, 0, [[0.325, 0.15], [0.335, 0.17], [0.335, 0.21], [0.325, 0.23]], { segs: 20, capBottom: false, capTop: false });
  g.mat('paint', '#33407a'); g.box(-0.15, 0.4, -0.12, 0.15, 0.46, 0.12, { bevel: 0.02 });
  g.mat('diffuser', '#7dff9a', { emissive: 4 }); g.ball(0.0, 0.47, 0.06, 0.02, 0.02, 0.02, { segs: 6, rings: 4 });
  g.mat('brushed', '#9c978d'); g.tube([[-0.12, 0.44, -0.2], [-0.12, 0.62, -0.24], [0.12, 0.62, -0.24], [0.12, 0.44, -0.2]], 0.012, { segs: 5 });
  g.mat('paint', '#efe6d2'); g.box(-0.12, 0.25, 0.305, 0.12, 0.31, 0.32);
  return { solid: [[-0.36, 0, -0.36, 0.36, 0.5, 0.36]], tier: 'd' };
});

// Knitting left on a bench: a ball of wool, a half-made scarf, two needles. p: { c }
defineProp('streets.knitting', (g, p) => {
  const c = p.c || '#c9552e';
  g.mat('knit', c); g.ball(0.18, 0.06, 0.02, 0.065, 0.06, 0.065, { segs: 10, rings: 7 });
  g.sheet([-0.32, 0.012, -0.12], [0.05, 0.012, -0.12], [0.05, 0.012, 0.07], [-0.32, 0.012, 0.07], { nu: 4, nv: 2 });
  g.mat('knit', '#e9e2d0'); g.box(-0.32, 0.004, -0.12, -0.26, 0.016, 0.07);
  g.mat('wood', '#c9a26a'); g.tube([[0.0, 0.02, -0.16], [0.12, 0.03, 0.14]], 0.004, { segs: 4 }); g.tube([[0.03, 0.02, -0.17], [0.1, 0.035, 0.15]], 0.004, { segs: 4 });
  g.mat('knit', c); g.tube([[0.13, 0.05, 0.03], [0.08, 0.02, 0.0], [0.04, 0.015, -0.04]], 0.004, { segs: 3, caps: false });
  return { tier: 'd', cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// the shell: floor, ceiling bays, lamps, festival things
// ---------------------------------------------------------------------------------------------------------------
// shell(s, st, a0, a1, o): bays between a0 and a1. o: { n (bays), clip, festive, cloth, simple, endBeam, startBeam, lampEvery, seed, skipLamp: [bay indices] }
// Returns the bay lines.
export function shell(s, st, a0, a1, o = {}) {
  const g = s.g, hw = st.hw, H = st.H, n = o.n || Math.max(1, Math.round((a1 - a0) / 6)), L = (a1 - a0) / n;
  const lines = [];
  const rng = new Rng(hashStr('shell' + a0 + ',' + a1 + (o.seed || '')));
  // corbels under the beam ends, only where they land on a plain front (never across somebody's sign)
  const corbels = (a) => {
    for (const sg of [-1, 1]) {
      if (o.corbel && !o.corbel(a, sg)) continue;
      const v0 = sg > 0 ? hw - 0.24 : -hw, v1 = sg > 0 ? hw : -hw + 0.24;
      g.mat('paint', '#7d3526', { rough: -0.12 }); st.box(g, a - 0.16, v0, a + 0.16, v1, H - 0.82, H - 0.37, { bevel: 0.02 });
      g.mat('cast', '#3b3631'); st.box(g, a - 0.17, v0 - 0.01, a + 0.17, v1 + 0.01, H - 0.86, H - 0.82, { bevel: 0.01 });
    }
    s.flush({ tier: 's' });
  };
  for (let i = 0; i < n; i++) {
    const b0 = a0 + i * L, b1 = b0 + L, bm = (b0 + b1) / 2;
    lines.push(b0);
    floorBay(s, st, b0, b1, i, o);
    // the ceiling services for this bay (with the beam at b0); the very first beam can be left off
    const first = i === 0 && o.startBeam === false;
    if (!first) { prop(s, 'streets.bay', ...st.pt(b0, 0, 0), st.propYaw, { L: +L.toFixed(3), W: hw * 2, H, hatch: i % 3 === 1 }, { tier: 's', cast: false }); corbels(b0); }
    else { g.mat('panel', '#b5aa92'); st.box(g, b0, -hw, b1, hw, H, H + 0.02, { faces: 'y' }); s.flush({ tier: 's' }); }
    // felt baffles across the middle of the bay, or cloth on Thread Street
    if (!o.simple && !o.cloth && !(o.noBaffle && o.noBaffle.indexOf(i) >= 0)) {
      const vb0 = -(hw - 2.1), vb1 = hw - 1.45;
      g.mat('felt', FELT[(i + (o.seed || 0)) % FELT.length]); st.box(g, bm - 0.03, vb0, bm + 0.03, vb1, H - 0.5, H - 0.02, { bevel: 0.01 });
      g.mat('cast', '#b08a45'); st.tube(g, [[bm, H - 0.5, vb0 - 0.02], [bm, H - 0.5, vb1 + 0.02]], 0.011, { segs: 5 });
      g.mat('cast', '#2f2c28'); for (const v of [vb0 + 0.2, vb1 - 0.2]) st.box(g, bm - 0.008, v - 0.008, bm + 0.008, v + 0.008, H - 0.02, H);
      s.flush({ tier: 's' });
    }
    // the lamp at the beam, and a lantern string or bunting for the festival
    const lampHere = !(o.skipLamp && o.skipLamp.indexOf(i) >= 0) && (!first);
    if (lampHere) {
      const drop = 0.62, p = st.pt(b0, H - 0.37, 0);
      prop(s, 'streets.lamp', p[0], p[1], p[2], 0, { drop }, { tier: 's', cast: false });
      s.light({ at: st.pt(b0, H - 0.37 - drop + 0.06, 0), type: 'spot', dir: [0, -1, 0], cone: [82, 34], color: warm(o.K || 2850), power: o.power || 15, range: o.range || 7, shadow: true, radius: 0.14, clip: o.clip, lamp: true });
    }
    if (o.festive && i % 2 === 0) lanternString(s, st, b0 + L * 0.28, i, o.clip, rng);
    if (o.festive && o.bunting !== false) flags(s, st, b0 + 0.35, b1 - 0.35, i % 2 ? 1 : -1, H - 0.55, rng);
    if (o.cloth) clothLine(s, st, bm, i, rng);
  }
  if (o.endBeam !== false) { prop(s, 'streets.bay', ...st.pt(a1, 0, 0), st.propYaw, { L: 0, W: hw * 2, H, beamOnly: true }, { tier: 's', cast: false }); corbels(a1); }
  // one walkable floor and one ceiling for the whole run
  st.solid(s, a0, -hw, a1, hw, -0.5, 0, { surf: 'tile' });
  st.solid(s, a0, -hw, a1, hw, H, H + 0.6, { surf: 'stone' });
  return lines;
}

// The floor of one bay: a terrazzo field, a patterned runner between brass lines, dark hex borders by the fronts,
// a mosaic band under the beam, and a drain cover every other bay.
function floorBay(s, st, b0, b1, i, o) {
  const g = s.g, hw = st.hw, rw = o.runner || 0.85;
  const bd = 0.42;
  g.mat('hex', '#58625b'); st.box(g, b0, -hw, b1, -hw + bd, -0.02, 0, { faces: 'Y' }); st.box(g, b0, hw - bd, b1, hw, -0.02, 0, { faces: 'Y' });
  g.mat('terrazzo', o.field || '#bfae8e'); st.box(g, b0, -hw + bd, b1, -rw - 0.035, -0.02, 0, { faces: 'Y' }); st.box(g, b0, rw + 0.035, b1, hw - bd, -0.02, 0, { faces: 'Y' });
  g.mat('cast', '#b8914a', { rough: -0.2 }); st.box(g, b0, -rw - 0.035, b1, -rw, -0.02, 0, { faces: 'Y' }); st.box(g, b0, rw, b1, rw + 0.035, -0.02, 0, { faces: 'Y' });
  g.mat('pattern', o.runnerTint || '#b2603f'); st.box(g, b0, -rw, b1, rw, -0.02, 0, { faces: 'Y' });
  // feet have worn the middle of the runner paler and matt
  g.mat('pattern', mixHex(o.runnerTint || '#b2603f', '#e6d3b8', 0.3), { rough: 0.15 }); st.box(g, b0, -rw * 0.45, b1, rw * 0.45, 0, 0.004, { faces: 'Y' });
  // the band under the beam, with brass ends
  g.mat('mosaic', o.band || '#3f6f6a'); st.box(g, b0 - 0.2, -hw + bd, b0 + 0.2, -rw - 0.035, 0, 0.004, { faces: 'YaA' }); st.box(g, b0 - 0.2, rw + 0.035, b0 + 0.2, hw - bd, 0, 0.004, { faces: 'YaA' });
  s.flush({ tier: 's' });
  if (i % 2 === 1) {
    for (const sg of [-1, 1]) {
      const am = (b0 + b1) / 2 + sg * 0.6, v = sg * (hw - bd - 0.45);
      g.mat('cast', '#45413b', { rough: -0.1 }); st.box(g, am - 0.28, v - 0.17, am + 0.28, v + 0.17, 0, 0.006, { bevel: 0.004 });
      g.mat('cast', '#24221f'); for (let k = 0; k < 6; k++) { const aa = am - 0.22 + k * 0.088; st.box(g, aa - 0.018, v - 0.12, aa + 0.018, v + 0.12, 0.006, 0.007, { faces: 'Y' }); }
    }
    s.flush({ tier: 'd', cast: false });
  }
}

// A sagging string of cloth lanterns across the street; the middle one lights the pool under it.
function lanternString(s, st, a, i, clip, rng) {
  const g = s.g, hw = st.hw, H = st.H, y = H - 0.42, sag = 0.34, n = st.hw > 3.5 ? 5 : 4;
  const P = (t) => [a, y - sag * 4 * t * (1 - t), -hw + 0.25 + (2 * hw - 0.5) * t];
  const line = []; for (let k = 0; k <= 12; k++) line.push(P(k / 12));
  g.mat('weave', '#d8cdb8'); st.tube(g, line, 0.005, { segs: 4, caps: false }); s.flush({ tier: 's', cast: false });
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, q = P(t), c = LANTERN[(i * 3 + k) % LANTERN.length];
    const pp = st.pt(q[0], q[1], q[2]);
    prop(s, 'streets.lantern', pp[0], pp[1], pp[2], rng.f(0, 3), { c, r: k % 2 ? 0.11 : 0.14 }, { tier: 's', cast: false });
    if (k === Math.floor(n / 2)) s.light({ at: st.pt(q[0], q[1] - 0.3, q[2]), color: c, power: 1.2, range: 4, radius: 0.12, clip, lamp: true, nospec: true });
  }
}

// Bunting along a diagonal of the bay (zigzagging bay to bay), drawn at the structure tier so it reads far down the street.
function flags(s, st, a0, a1, sg, y, rng) {
  const g = s.g, hw = st.hw - 0.3;
  const A = [a0, y, -sg * hw], B = [a1, y, sg * hw];
  const len = Math.hypot(B[0] - A[0], B[2] - A[2]), n = Math.round(len / 0.36), sag = 0.32;
  const P = (t) => [A[0] + (B[0] - A[0]) * t, A[1] - sag * 4 * t * (1 - t), A[2] + (B[2] - A[2]) * t];
  const line = []; for (let k = 0; k <= 14; k++) line.push(P(k / 14));
  g.mat('weave', '#d8cdb8'); st.tube(g, line, 0.004, { segs: 4, caps: false });
  const cols = ['#c9552e', '#e7b547', '#2f6f73', '#e9e2d0', '#8a2f3c', '#6b8f4e', '#33407a'];
  for (let k = 0; k < n; k++) {
    const t0 = (k + 0.12) / n, t1 = (k + 0.88) / n, p0 = P(t0), p1 = P(t1), pm = P((t0 + t1) / 2);
    g.mat('weave', cols[(k + Math.floor(a0)) % cols.length], { sway: 0.8 });
    const v0 = g.buf.nv;
    g.quad(st.pt(p0[0], p0[1], p0[2]), st.pt(p1[0], p1[1], p1[2]), st.pt(pm[0], pm[1] - 0.2, pm[2]), st.pt(pm[0] + 0.001, pm[1] - 0.2, pm[2]), { double: true });
    for (const kk of [0, 1, 4, 7]) g.param(v0 + kk, 0);
  }
  s.flush({ tier: 's', cast: false });
  void rng;
}

// Dyed cloth drying on a line across Thread Street: two or three lengths, hung high enough to walk under.
function clothLine(s, st, a, i, rng) {
  const g = s.g, hw = st.hw - 0.25, y = st.H - 0.5;
  g.mat('weave', '#d8cdb8'); st.tube(g, [[a, y, -hw], [a, y - 0.12, 0], [a, y, hw]], 0.006, { segs: 4, caps: false });
  g.mat('cast', '#2f2c28'); for (const v of [-hw, hw]) st.box(g, a - 0.02, v - 0.02, a + 0.02, v + 0.02, y - 0.02, st.H);
  s.flush({ tier: 's', cast: false });
  const n = 2 + (i % 2);
  let v = -hw + 0.25;
  for (let k = 0; k < n; k++) {
    const w = rng.f(0.9, 1.5), drop = rng.f(0.55, 0.85); const v1 = Math.min(hw - 0.2, v + w); if (v1 - v < 0.5) break;
    const c = CLOTH[(i * 3 + k * 2) % CLOTH.length];
    const yy0 = y - 0.12 * (1 - Math.abs((v + v1) / 2) / hw);
    g.mat(k % 3 === 1 ? 'motif' : 'weave', c, { sway: 0.5 });
    g.sheet(st.pt(a, yy0, v), st.pt(a, yy0, v1), st.pt(a + 0.03, yy0 - drop, v1), st.pt(a + 0.03, yy0 - drop, v), { nu: 6, nv: 3, ripple: 0.05, rippleN: 4 });
    s.flush({ tier: 's', cast: true });
    v = v1 + rng.f(0.15, 0.4);
  }
}

// A soft bounce light for a run of street, so the walls between the pools are not black.
export function streetGlow(s, st, a0, a1, o = {}) {
  const b = st.bx(a0, -st.hw - 0.3, a1, st.hw + 0.3, -0.1, st.H + 0.1);
  s.ambient({ box: b, sky: o.sky || '#ffd9a8', ground: o.ground || '#b88c64', power: o.power === undefined ? 0.17 : o.power, lamp: true, soft: 1.5, spec: 0.4 });
}

// ---------------------------------------------------------------------------------------------------------------
// fronts
// ---------------------------------------------------------------------------------------------------------------
const T = 0.2;      // wall thickness of an ordinary front

// A front wall from a0 to a1 with openings [{ at, w, h, sill }] (at from a0). Drawn on its street face, with reveals and a skirting.
export function frontWall(s, sd, a0, a1, H, ops, fin, o = {}) {
  const g = s.g, len = a1 - a0;
  const pieces = []; let u = 0;
  for (const op of ops.slice().sort((p, q) => p.at - q.at)) {
    const sill = op.sill || 0;
    if (op.at > u + 1e-4) pieces.push([u, op.at, 0, H, 0]);
    if (sill > 0) pieces.push([op.at, op.at + op.w, 0, sill, 1]);
    if (sill + op.h < H - 1e-4) pieces.push([op.at, op.at + op.w, sill + op.h, H, 2]);
    u = op.at + op.w;
  }
  if (u < len - 1e-4) pieces.push([u, len, 0, H, 0]);
  const dado = fin.dado;
  for (const pc of pieces) {
    const p0 = a0 + pc[0], p1 = a0 + pc[1], yb = pc[2], yt = pc[3];
    const ends = (pc[0] > 1e-4 ? 'a' : '') + (pc[1] < len - 1e-4 ? 'A' : '');
    const caps = (pc[4] === 1 ? 'Y' : '') + (pc[4] === 2 ? 'y' : '');
    if (dado && yb < dado.h) {
      g.mat(dado.mat, dado.tint); sd.box(g, p0, p1, 0, T, yb, Math.min(dado.h, yt), { faces: 'f' + (pc[4] === 1 ? 'Y' : ''), aoBottom: yb === 0 ? 0.7 : 1 });
      if (yt > dado.h) { g.mat(fin.mat, fin.tint); sd.box(g, p0, p1, 0, T, dado.h, yt, { faces: 'f' + (pc[4] === 2 ? 'y' : '') }); }
      // a rail capping the dado
      if (yt > dado.h + 0.03) { g.mat('wood', fin.trim); sd.box(g, p0, p1, -0.025, 0, dado.h - 0.01, dado.h + 0.035, { faces: 'fyY' + ends }); }
    } else { g.mat(fin.mat, fin.tint); sd.box(g, p0, p1, 0, T, yb, yt, { faces: 'f' + caps, aoBottom: yb === 0 ? 0.7 : 1 }); }
    if (ends) { g.mat('plaster', shadeHex(fin.trim, 0.92)); sd.box(g, p0, p1, 0, T, yb, yt, { faces: ends }); }
    if (yb === 0 && pc[4] === 0) { g.mat('wood', '#3a2a20'); sd.box(g, p0, p1, -0.016, 0, 0, 0.12, { faces: 'fY' + ends }); }
    if (o.noCollide !== true) sd.solid(s, p0, p1, 0, T, yb, yt);
    s.flush({ tier: 's' });
  }
  // a cornice and a painted frieze up to the street ceiling
  g.mat('wood', fin.trim); sd.box(g, a0, a1, -0.06, 0, 2.66, 2.74, { faces: 'fyY', bevel: 0.01 });
  g.mat('paint', mixHex(fin.tint, fin.trim, 0.35)); sd.box(g, a0, a1, -0.004, 0, 2.74, H, { faces: 'f' });
  s.flush({ tier: 's' });
}

// A pilaster on the front line at a (a strip of trim that separates two neighbours' fronts).
export function pilaster(s, sd, a, H, tint) {
  const g = s.g; g.mat('stone', tint || '#b9ae9a'); sd.box(g, a - 0.13, a + 0.13, -0.09, 0.02, 0, H - 0.37, { bevel: 0.012, aoBottom: 0.7 });
  g.mat('stone', shadeHex(tint || '#b9ae9a', 0.85)); sd.box(g, a - 0.15, a + 0.15, -0.11, 0.02, 0, 0.18, { bevel: 0.01 });
  s.flush({ tier: 's' }); sd.solid(s, a - 0.15, a + 0.15, -0.11, 0.02, 0, H);
}

// A house door in an opening at [p0, p0 + 1]: recessed panelled leaf, architrave, fanlight lit from the hall, step, mat.
function houseDoor(s, sd, p0, fin, o) {
  const g = s.g, w = 1.0, p1 = p0 + w, dh = 2.12, oh = 2.5;
  // leaf
  g.mat('wood', o.doorTint || fin.door, { rough: -0.05 }); sd.box(g, p0 + 0.03, p1 - 0.03, 0.08, 0.13, 0, dh, { bevel: 0.008 });
  g.mat('wood', shadeHex(o.doorTint || fin.door, 1.15));
  if (o.glazed) {
    sd.box(g, p0 + 0.14, p1 - 0.14, 0.065, 0.08, 0.15, 0.85, { bevel: 0.006 });
    g.mat('diffuser', '#f6e2b0', { emissive: 1.6, lamp: true }); sd.box(g, p0 + 0.16, p1 - 0.16, 0.075, 0.08, 1.0, dh - 0.16, { faces: 'f' });
    g.mat('wood', o.doorTint || fin.door); sd.box(g, p0 + 0.48, p0 + 0.52, 0.068, 0.08, 1.0, dh - 0.16, { faces: 'fyY' });
  } else {
    for (const r of [[0.15, 0.9], [1.05, dh - 0.15]]) for (const c of [[0.13, 0.47], [0.53, 0.87]]) sd.box(g, p0 + c[0], p0 + c[1], 0.066, 0.08, r[0], r[1], { bevel: 0.006 });
  }
  // brass: knob, letter slot, kick plate
  g.mat('cast', '#c8a45a', { rough: -0.2 });
  sd.box(g, p1 - 0.17, p1 - 0.13, 0.04, 0.066, 0.98, 1.02, { bevel: 0.01 });
  if (!o.glazed) sd.box(g, p0 + 0.35, p0 + 0.65, 0.07, 0.08, 1.12, 1.17, { bevel: 0.004 });
  sd.box(g, p0 + 0.06, p1 - 0.06, 0.072, 0.08, 0.02, 0.17, { faces: 'f' });
  // transom and fanlight, lit by the hall lamp behind
  g.mat('wood', fin.trim); sd.box(g, p0, p1, 0.06, 0.13, dh, dh + 0.06);
  g.mat('diffuser', '#f2c987', { emissive: 1.1, lamp: true }); sd.box(g, p0 + 0.02, p1 - 0.02, 0.12, 0.13, dh + 0.06, oh - 0.02, { faces: 'f' });
  g.mat('wood', fin.trim); for (let k = 1; k < 4; k++) { const a = p0 + k * 0.25; sd.box(g, a - 0.012, a + 0.012, 0.1, 0.12, dh + 0.06, oh - 0.02, { faces: 'f' }); }
  // architrave proud of the wall
  g.mat('wood', fin.trim); sd.box(g, p0 - 0.09, p0, -0.04, 0.02, 0, oh + 0.09, { bevel: 0.008 }); sd.box(g, p1, p1 + 0.09, -0.04, 0.02, 0, oh + 0.09, { bevel: 0.008 }); sd.box(g, p0 - 0.12, p1 + 0.12, -0.05, 0.02, oh, oh + 0.11, { bevel: 0.01 });
  // the step and the mat
  g.mat('stone', '#bdb09a'); sd.box(g, p0 - 0.06, p1 + 0.06, -0.14, 0.08, 0, 0.03, { bevel: 0.008, aoBottom: 0.75 });
  s.flush({ tier: 's' });
  const mats = ['rush', 'motif', 'rush', 'weave', 'carpet']; const mc = ['#a88a55', '#8a2f3c', '#9c8a5a', '#2f6f73', '#5b3a6e'];
  const mi = hashStr(o.name || String(p0)) % mats.length;
  g.mat(mats[mi], mc[mi]); sd.box(g, p0 + 0.06, p1 - 0.06, -0.66, -0.15, 0, 0.014, { faces: 'YaAfb' });
  s.flush({ tier: 'd', cast: false });
  sd.solid(s, p0, p1, 0.05, T, 0, oh);
}

const DOOR_LINES = [
  'Nobody answers. Half the street is at the hall.',
  "A voice through the door: \"If it's about the felt, it's on the line.\"",
  'Nobody answers. Three pairs of small shoes on the mat, all wet from the baths.',
  'Somebody calls down the stair: "Back at six. Have you eaten?"',
  'Nobody comes. A note in the letter slot says: gone to sit with Gran.',
  'A child opens the door a hand wide, looks at you, and closes it again. Politely.',
];
export function knockLine(game, name) {
  const h = game.clock ? game.clock.hours : 12;
  if (h >= 23 || h < 6.5) return 'You think better of it. It is the lamp-night, and the fanlight is dark.';
  if (h >= 11.5 && h < 14.5) return 'Nobody answers. It is lunch, and everyone is at the long table.';
  return DOOR_LINES[(hashStr(name || 'x') + Math.floor(h)) % DOOR_LINES.length];
}

// An ordinary front unit between a0 and a1 on a side. o: { kind, fin, name, num, door (offset), win (offset | false), win2, lit,
//   clip (the street's light clip), plants, knock (text or function), glazed, H }
export function unit(s, sd, a0, a1, o = {}) {
  const g = s.g, st = sd.st, H = o.H || st.H, fin = typeof o.fin === 'object' ? o.fin : FIN[(o.fin || 0) % FIN.length];
  const kind = o.kind || 'house', w = a1 - a0, out = { doors: [] };
  const ops = [];
  if (kind === 'house' || kind === 'stair') {
    const dAt = o.door !== undefined ? o.door : Math.max(0.35, Math.min(w - 1.35, 0.55));
    ops.push({ at: dAt, w: 1.0, h: 2.5 });
    const wins = [];
    if (o.win !== false && w - dAt - 1.0 > 1.9) wins.push(o.win !== undefined && o.win !== true ? o.win : dAt + 1.0 + Math.min(1.0, (w - dAt - 1.0 - 1.4) / 2));
    if (o.win2 !== undefined) wins.push(o.win2);
    for (const wa of wins) ops.push({ at: wa, w: 1.3, h: 1.3, sill: 0.95 });
    frontWall(s, sd, a0, a1, H, ops, fin);
    houseDoor(s, sd, a0 + dAt, fin, { name: o.name, glazed: kind === 'stair' || o.glazed, doorTint: o.doorTint });
    const dc = a0 + dAt + 0.5; out.doors.push(dc);
    // the name plate, the lamp over the plate, the house number on the fanlight's head
    if (o.name) sign(s, { kind: 'plate', text: o.name, lines: o.num ? [o.num] : undefined }, ...sd.pt(dc + 0.78, 1.5, -0.006), { face: sd.face, w: 0.3, h: 0.14 });
    if (o.label) sign(s, Object.assign({ kind: 'label' }, o.label), ...sd.pt(dc, 2.81, -0.01), { face: sd.face, w: 0.9, h: 0.22 });
    const lp = sd.pt(dc + 0.78, 2.2, 0);
    if (o.lamp !== false) lamp(s, 'sconce', lp[0], lp[1], lp[2], { face: sd.face, power: o.lampPower || 0.9, K: 2600, clip: o.clip, range: 4 });
    else { s.g.mat('cast', '#8a6d3b'); sd.box(s.g, dc + 0.72, dc + 0.84, -0.04, 0, 2.1, 2.3, { bevel: 0.008 }); s.g.mat('diffuser', '#e9dcc0'); sd.box(s.g, dc + 0.73, dc + 0.83, -0.13, -0.04, 2.12, 2.28, { bevel: 0.01 }); s.flush({ tier: 'd', cast: false }); }
    for (const wa of wins) { houseWindow(s, sd, a0 + wa, fin, o); if (o.spots !== false) s.spot('stand', ...sd.pt(a0 + wa + 0.65, 0, -0.95), sd.yaw + Math.PI, { tags: ['window', 'street'] }); }
    // a pot or two by the door
    if (o.plants !== false) {
      const r = new Rng(hashStr('pots' + a0));
      const kinds = ['broad', 'fern', 'fine', 'flower'], pots = ['#a3563a', '#3d6f8a', '#d9c7a6', '#6b7a3a', '#2b3a36'];
      const pa = a0 + dAt - 0.32; if (pa > a0 + 0.25) prop(s, 'plant', ...sd.pt(pa, 0, -0.3), 0, { kind: kinds[r.i(0, 3)], size: r.f(0.8, 1.25), pot: pots[r.i(0, 4)] });
      if (r.chance(0.6) && a0 + dAt + 1.33 < a1 - 0.2 && !wins.length) prop(s, 'plant', ...sd.pt(a0 + dAt + 1.32, 0, -0.28), 0, { kind: kinds[r.i(0, 3)], size: r.f(0.6, 1.0), pot: pots[r.i(0, 4)] });
    }
    if (o.knock !== false) {
      const name = o.name || 'the door';
      const pp = sd.pt(dc, 1.2, -0.1);
      s.interact({ x: pp[0], y: pp[1], z: pp[2], radius: 1.3, prompt: o.prompt || (o.name ? 'Knock at ' + o.name + "'s" : 'Knock'),
        onUse(game) { game.sfxAt('knock', s.frame, pp[0], pp[1], pp[2]); const t = typeof o.knock === 'function' ? o.knock(game) : (o.knock || knockLine(game, name)); setTimeout(() => note(game, t), 700); } });
    }
  } else if (kind === 'blank') {
    frontWall(s, sd, a0, a1, H, [], fin);
  }
  return out;
}

// A sash window in an opening at [p0, p0 + 1.3], sill 0.95, 1.3 high: frame, bars, glass, a curtain lit from inside, a sill with pots.
function houseWindow(s, sd, p0, fin, o) {
  const g = s.g, p1 = p0 + 1.3, y0 = 0.95, y1 = 2.25;
  g.mat('motif', fin.curtain, o.lit === false ? undefined : { emissive: 0.55, lamp: true }); sd.box(g, p0, p1, 0.15, 0.17, y0, y1, { faces: 'f' });
  g.mat('wood', fin.trim);
  sd.box(g, p0, p0 + 0.06, 0.04, 0.1, y0, y1); sd.box(g, p1 - 0.06, p1, 0.04, 0.1, y0, y1); sd.box(g, p0, p1, 0.04, 0.1, y1 - 0.06, y1); sd.box(g, p0, p1, 0.04, 0.1, y0, y0 + 0.05);
  sd.box(g, p0 + 0.06, p1 - 0.06, 0.05, 0.09, (y0 + y1) / 2 - 0.025, (y0 + y1) / 2 + 0.025); sd.box(g, (p0 + p1) / 2 - 0.018, (p0 + p1) / 2 + 0.018, 0.05, 0.09, y0, y1);
  // the outside sill and a pair of pots
  g.mat('stone', '#cfc3ad'); sd.box(g, p0 - 0.08, p1 + 0.08, -0.12, 0.05, y0 - 0.06, y0, { bevel: 0.01 });
  g.mat('wood', fin.trim); sd.box(g, p0 - 0.08, p0, -0.03, 0.02, y0, y1 + 0.08, { bevel: 0.006 }); sd.box(g, p1, p1 + 0.08, -0.03, 0.02, y0, y1 + 0.08, { bevel: 0.006 }); sd.box(g, p0 - 0.1, p1 + 0.1, -0.04, 0.02, y1, y1 + 0.08, { bevel: 0.008 });
  s.flush({ tier: 's' });
  const gp = sd.pt(p0 + 0.06, y0 + 0.05, 0.07), gq = sd.pt(p1 - 0.06, y1 - 0.06, 0.07);
  s.glass(gp[0], gp[1], gp[2], gq[0], gq[1], gq[2], { opacity: 0.16 });
  if (o.sillPots !== false) {
    const r = new Rng(hashStr('sill' + p0));
    for (const t of [0.22, 0.75]) if (r.chance(0.8)) prop(s, 'plant', ...sd.pt(p0 + 1.3 * t, y0, -0.06), r.f(0, 3), { kind: r.chance(0.5) ? 'flower' : 'fine', size: r.f(0.32, 0.45), pot: ['#a3563a', '#d9c7a6', '#3d6f8a'][r.i(0, 2)] }, { noCollide: true });
  }
}

// A plain stone pier filling a sliver between neighbours.
export function pier(s, sd, a0, a1, H, tint) {
  const g = s.g; g.mat('stone', tint || '#bdb29e'); sd.box(g, a0, a1, -0.04, T, 0, H, { faces: 'fyY', aoBottom: 0.7 });
  g.mat('stone', shadeHex(tint || '#bdb29e', 0.82)); sd.box(g, a0, a1, -0.08, T, 0, 0.2, { faces: 'fY', bevel: 0.01 }); sd.box(g, a0, a1, -0.08, T, 2.6, 2.74, { faces: 'fyY', bevel: 0.01 });
  s.flush({ tier: 's' }); sd.solid(s, a0, a1, -0.08, T, 0, H);
}

// ---------------------------------------------------------------------------------------------------------------
// threshold arches and the run on into the next block
// ---------------------------------------------------------------------------------------------------------------
// An arch across the street at a, naming the block beyond it on the face you walk toward (dir: +1 if the next block is toward +a).
export function thresholdArch(s, st, a, dir, nextName, nextNote, homeName, clip) {
  const g = s.g, hw = st.hw, H = st.H, pw = 0.55, w = 2 * (hw - pw), h = 2.72;
  for (const sg of [-1, 1]) {
    const v0 = sg > 0 ? hw - pw : -hw, v1 = sg > 0 ? hw : -hw + pw;
    g.mat('stone', '#c2b49a'); st.box(g, a - 0.36, v0, a + 0.36, v1, 0, H, { bevel: 0.015, aoBottom: 0.7 });
    g.mat('stone', '#9b8e78'); st.box(g, a - 0.42, v0 - (sg > 0 ? 0.06 : 0), a + 0.42, v1 + (sg > 0 ? 0 : 0.06), 0, 0.32, { bevel: 0.015 });
    st.box(g, a - 0.4, v0 - (sg > 0 ? 0.04 : 0), a + 0.4, v1 + (sg > 0 ? 0 : 0.04), 1.98, 2.08, { bevel: 0.012 });
    st.solid(s, a - 0.42, v0, a + 0.42, v1, 0, H);
  }
  s.flush({ tier: 's', cast: true });
  const c = st.pt(a, 0, 0);
  archway(s, c[0], 0, c[2], w, h, st.alongV, { depth: 0.66, tint: '#c2b49a' });
  g.mat('stone', '#b3a68e'); st.box(g, a - 0.33, -hw + pw, a + 0.33, hw - pw, h + 0.14, H, { faces: 'aAy' });
  g.mat('cast', '#b08a45'); st.box(g, a - 0.34, -hw + pw, a + 0.34, hw - pw, h + 0.14, h + 0.17, { faces: 'aAy' });
  s.flush({ tier: 's' });
  // the names, lit: the next block's on the face you walk toward, ours on the way back
  const yN = (h + 0.17 + H) / 2;
  sign(s, { kind: 'letters', text: nextName, font: 'caps', palette: ['#ffe3a8'] }, ...st.pt(a - dir * 0.335, yN, 0), { face: st.faceA(-dir), w: Math.min(3.6, w - 0.6), h: 0.36, glow: 2.6 });
  sign(s, { kind: 'letters', text: homeName, font: 'caps', palette: ['#ffe3a8'] }, ...st.pt(a + dir * 0.335, yN, 0), { face: st.faceA(dir), w: Math.min(3.6, w - 0.6), h: 0.36, glow: 2.6 });
  // plates on the piers
  for (const sg of [-1, 1]) {
    const v = sg * (hw - pw - 0.002);
    const f = st.faceV(-sg);
    sign(s, { kind: 'plate', text: nextName, lines: [nextNote] }, ...st.pt(a - dir * 0.18, 1.55, v), { face: f, w: 0.34, h: 0.16 });
  }
  // two lamps on the arch, so it is the bright thing at the end of the view
  for (const sg of [-1, 1]) {
    for (const dd of [-1, 1]) {
      const p = st.pt(a + dd * 0.37, 2.32, sg * (hw - pw / 2));
      lamp(s, 'sconce', p[0], p[1], p[2], { face: st.faceA(dd), power: 1.1, K: 2500, clip, range: 4.5 });
    }
  }
  // a threshold of brass and stone in the floor
  g.mat('stone', '#a99c86'); st.box(g, a - 0.5, -hw + pw, a + 0.5, hw - pw, 0, 0.004, { faces: 'YaA' });
  g.mat('cast', '#b8914a'); for (const dd of [-1, 1]) st.box(g, a + dd * 0.5 - 0.02, -hw + pw, a + dd * 0.5 + 0.02, hw - pw, 0, 0.005, { faces: 'Y' });
  s.flush({ tier: 's' });
}

// The run on into the next block: simpler fronts on both sides, lamps, and at the end a lit lift-core lobby with cabs.
// o: { a0 (the arch), a1 (the lobby front), dir, clip, name, seed, H }
export function runOn(s, st, o) {
  const g = s.g, hw = st.hw, H = st.H, dir = o.dir, lo = Math.min(o.a0, o.a1), hi = Math.max(o.a0, o.a1);
  shell(s, st, lo, hi, { n: Math.round((hi - lo) / 6), clip: o.clip, simple: true, endBeam: false, startBeam: false, power: 9, seed: 3 });
  streetGlow(s, st, lo, hi, { power: 0.16 });
  // fronts: closed doors, a few lit windows, no interiors
  const r = new Rng(hashStr('runon' + o.name));
  for (const out of [1, -1]) {
    const sd = side(st, out > 0 ? -hw : hw, out);
    const end = hi - 0.6; let a = lo + 0.6, k = 0;
    while (end - a > 0.5) {
      let w = r.f(3.6, 5.2); if (end - (a + w) < 2.8) w = end - a;
      pilaster(s, sd, a, H);
      unit(s, sd, a, a + w, { fin: (k * 4 + (out > 0 ? 1 : 5) + o.seed) % FIN.length, win: r.chance(0.6), clip: o.clip, plants: r.chance(0.4), knock: false, lampPower: 0.6, lit: r.chance(0.7) });
      a += w; k++;
    }
    pier(s, sd, lo, lo + 0.6, H); pier(s, sd, hi - 0.6, hi, H);
  }
  // the lobby at the far end
  liftLobby(s, st, o.a1, dir, o);
}

// A lit lift-core lobby closing the far end of a run-on: a cross wall with a wide mouth, a shallow lobby, two cab berths.
function liftLobby(s, st, a, dir, o) {
  const g = s.g, hw = st.hw, H = st.H, mw = Math.min(4.2, 2 * hw - 1.6), D = 3.6;
  // the cross wall, with the mouth in its middle
  g.mat('tile', '#2f5d5a');
  const A0 = a, A1 = a + dir * 0.25;
  st.box(g, A0, -hw, A1, -mw / 2, 0, H, { faces: dir > 0 ? 'aV' : 'AV' }); st.box(g, A0, mw / 2, A1, hw, 0, H, { faces: dir > 0 ? 'av' : 'Av' });
  st.box(g, A0, -mw / 2, A1, mw / 2, 2.7, H, { faces: (dir > 0 ? 'a' : 'A') + 'y' });
  g.mat('tile', '#1f3a38'); st.box(g, A0 - dir * 0.01, -hw, A0, -mw / 2, 0, 1.0, { faces: dir > 0 ? 'a' : 'A' }); st.box(g, A0 - dir * 0.01, mw / 2, A0, hw, 0, 1.0, { faces: dir > 0 ? 'a' : 'A' });
  g.mat('cast', '#c8a45a'); st.box(g, A0 - dir * 0.05, -mw / 2 - 0.08, A1, -mw / 2, 0, 2.78); st.box(g, A0 - dir * 0.05, mw / 2, A1, mw / 2 + 0.08, 0, 2.78); st.box(g, A0 - dir * 0.05, -mw / 2 - 0.08, A1, mw / 2 + 0.08, 2.7, 2.78);
  s.flush({ tier: 's' });
  st.solid(s, A0, -hw, A1, -mw / 2, 0, H); st.solid(s, A0, mw / 2, A1, hw, 0, H);
  // the lit sign over the mouth
  sign(s, { kind: 'fascia', text: 'CABS', sub: o.lobbySub || 'lifts · stairs · decks 16 to 21', font: 'caps', palette: ['#14211f', '#ffe3a8', '#3fe0d0'] }, ...st.pt(A0 - dir * 0.012, 3.05, 0), { face: st.faceA(-dir), w: Math.min(3.0, mw), h: 0.5, glow: 3 });
  // the lobby itself
  const B0 = A1, B1 = a + dir * D, lv0 = -mw / 2 - 0.6, lv1 = mw / 2 + 0.6, LH = 3.0;
  g.mat('terrazzo', '#e3dccb'); st.box(g, B0, lv0, B1, lv1, -0.02, 0, { faces: 'Y' });
  g.mat('paint', '#f0e8d6'); st.box(g, B0, lv0, B1, lv1, LH, LH + 0.02, { faces: 'y' });
  g.mat('tile', '#d9d2bf'); st.box(g, B0, lv0 - 0.15, B1, lv0, 0, LH, { faces: 'V' }); st.box(g, B0, lv1, B1, lv1 + 0.15, 0, LH, { faces: 'v' });
  g.mat('tile', '#2f6f73'); st.box(g, B0, lv0 - 0.15, B1, lv0, 0, 1.1, { faces: 'V' }); st.box(g, B0, lv1, B1, lv1 + 0.15, 0, 1.1, { faces: 'v' });
  g.mat('tile', '#d9d2bf'); st.box(g, B1, lv0, B1 + dir * 0.15, lv1, 0, LH, { faces: dir > 0 ? 'a' : 'A' });
  // two berth doors in the back wall, brass framed, with lamps over them
  for (const sg of [-1, 1]) {
    const vc = sg * (mw / 4 + 0.15);
    g.mat('brushed', '#b9b4aa'); st.box(g, B1 - dir * 0.02, vc - 0.55, B1, vc + 0.55, 0, 2.2, { faces: dir > 0 ? 'a' : 'A' });
    g.mat('brushed', '#8d897f'); st.box(g, B1 - dir * 0.03, vc - 0.008, B1 - dir * 0.02, vc + 0.008, 0, 2.2, { faces: dir > 0 ? 'a' : 'A' });
    g.mat('cast', '#c8a45a'); st.box(g, B1 - dir * 0.06, vc - 0.65, B1, vc - 0.55, 0, 2.3); st.box(g, B1 - dir * 0.06, vc + 0.55, B1, vc + 0.65, 0, 2.3); st.box(g, B1 - dir * 0.06, vc - 0.65, B1, vc + 0.65, 2.2, 2.3);
    g.mat('diffuser', sg > 0 ? '#9fffd8' : '#ffd9a0', { emissive: 5, lamp: true }); st.box(g, B1 - dir * 0.07, vc - 0.07, B1 - dir * 0.06, vc + 0.07, 2.42, 2.56, { faces: dir > 0 ? 'a' : 'A' });
  }
  g.mat('wood', '#6b4a2f'); st.box(g, B0 + dir * 0.6, lv0, B0 + dir * 1.9, lv0 + 0.42, 0.42, 0.47, { bevel: 0.01 }); st.box(g, B0 + dir * 0.65, lv0 + 0.05, B0 + dir * 1.85, lv0 + 0.37, 0, 0.42, { bevel: 0.01 });
  s.flush({ tier: 's' });
  st.solid(s, B0, lv0 - 0.15, B1, lv0, 0, LH); st.solid(s, B0, lv1, B1, lv1 + 0.15, 0, LH); st.solid(s, B1, lv0, B1 + dir * 0.15, lv1, 0, LH);
  st.solid(s, B0, lv0, B1, lv1, -0.5, 0, { surf: 'tile' }); st.solid(s, B0 + dir * 0.6, lv0, B0 + dir * 1.9, lv0 + 0.42, 0, 0.47);
  // and past it, nothing: the cabs are the way on
  st.solid(s, B1, -hw - 2, B1 + dir * 2, hw + 2, -1, H + 1);
  const lclip = st.bx(B0 - dir * 2.5, lv0 - 0.1, B1, lv1 + 0.1, -0.2, LH + 0.1);
  lamp(s, 'panel', ...st.pt((B0 + B1) / 2, LH, 0), { w: st.X ? 1.6 : 0.6, d: st.X ? 0.6 : 1.6, power: 2.4, K: 3700, clip: lclip });
  s.ambient({ box: st.bx(B0, lv0, B1, lv1, 0, LH), sky: '#fff0d8', ground: '#d8c8a8', power: 0.5, lamp: true, soft: 0.5 });
  sign(s, { kind: 'notice', title: 'Guests', lines: ['The lifts are quicker.', 'Any cab will take you back', 'to Candlewick: say "Wick Court"', 'and sit down.'] }, ...st.pt(B0 + dir * 1.3, 1.5, lv1 - 0.002), { face: st.faceV(-1), w: 0.34, h: 0.46 });
  if (o.lobbyPlate) sign(s, o.lobbyPlate, ...st.pt(B0 + dir * 1.3, 1.6, lv0 + 0.002), { face: st.faceV(1), w: 0.34, h: 0.15 });
  const ip = st.pt(B1 - dir * 0.8, 1.2, 0);
  s.interact({ x: ip[0], y: ip[1], z: ip[2], radius: 1.6, prompt: 'Call a cab',
    onUse(game) { game.sfxAt('chime', s.frame, ip[0], 2.4, ip[2]); setTimeout(() => note(game, o.cabText || 'A cab is already waiting in the berth. You let it wait: Candlewick is just back down the street.'), 600); } });
}

// ---------------------------------------------------------------------------------------------------------------
// street furniture
// ---------------------------------------------------------------------------------------------------------------
// A bench you can sit on. yaw = the way the sitter faces. o: { w, back, tags, knitting }
export function bench(s, x, z, yaw, o = {}) {
  const w = o.w || 1.6;
  prop(s, 'bench', x, 0, z, yaw, { w, back: o.back !== false, wood: o.wood || '#7a5233', metal: o.metal || '#2f3a36' }, { noSpots: true });
  benchSpots(s, x, z, yaw, w, o.tags || ['street']);
  s.interact({ x, y: 0.7, z, radius: 1.3, prompt: o.prompt || 'Sit on the bench', onUse(game) { if (game.player && game.player.sit) game.player.sit({ x, y: 0, z, yaw: lookYaw(yaw) }); } });
  if (o.knitting) {
    const c = Math.cos(yaw), sn = Math.sin(yaw), lx = w * 0.27;
    prop(s, 'streets.knitting', x + c * lx, 0.46, z - sn * lx, yaw + 0.3, { c: o.knitting });
  }
}

// Seats on a bench (the props' own spots lose their type, so they are added here).
export function benchSpots(s, x, z, yaw, w, tags) {
  const n = Math.max(1, Math.floor(w / 0.6)), c = Math.cos(yaw), sn = Math.sin(yaw);
  for (let i = 0; i < n; i++) { const lx = -w / 2 + (i + 0.5) * w / n; s.spot('sit', x + c * lx, 0.46, z - sn * lx, yaw, { tags }); }
}

// A drinking tap: a tiled splashback, a stone basin, a brass tap and a cup on a chain. On a side's front at a.
export function drinkingTap(s, sd, a, o = {}) {
  const g = s.g;
  g.mat('tile', '#2f6f73'); sd.box(g, a - 0.45, a + 0.45, -0.03, 0, 0.5, 1.7, { faces: 'fyYaA' });
  g.mat('tile', '#e9dcc0'); sd.box(g, a - 0.5, a + 0.5, -0.04, -0.03, 1.7, 1.78, { faces: 'fyYaA' });
  g.mat('stone', '#c9bda6'); const c = sd.pt(a, 0, -0.27);
  g.lathe(c[0], c[2], [[0.12, 0], [0.1, 0.1], [0.08, 0.6], [0.16, 0.66], [0.27, 0.78], [0.29, 0.86], [0.26, 0.86], [0.22, 0.8], [0, 0.78]], { segs: 16 });
  g.mat('cast', '#c8a45a', { rough: -0.25 });
  const t0 = sd.pt(a, 1.15, -0.03), t1 = sd.pt(a, 1.15, -0.2), t2 = sd.pt(a, 1.07, -0.26);
  g.tube([t0, t1, t2], 0.022, { segs: 8 });
  g.cyl(t1[0], 1.17, t1[2], 0.012, 0.08, { segs: 6 }); g.box(t1[0] - 0.06, 1.245, t1[2] - 0.012, t1[0] + 0.06, 1.26, t1[2] + 0.012);
  const cp = sd.pt(a + 0.3, 0.86, -0.22);
  g.mat('cast', '#9c978d'); g.tube([sd.pt(a + 0.2, 1.3, -0.03), sd.pt(a + 0.28, 1.05, -0.1), [cp[0], cp[1] + 0.09, cp[2]]], 0.004, { segs: 3 });
  g.mat('glaze', '#e9e2d0'); g.lathe(cp[0], cp[2], [[0, 0], [0.03, 0], [0.04, 0.08], [0.037, 0.082], [0.028, 0.01], [0, 0.008]], { segs: 12 });
  s.flush({ tier: 'd' });
  s.post(c[0], c[2], 0.28, 0, 0.86);
  if (o.plate !== false) sign(s, { kind: 'label', text: 'DRINKING WATER', lines: ['free · cold · from the deck main'] }, ...sd.pt(a, 1.53, -0.032), { face: sd.face, w: 0.7, h: 0.2 });
  const ip = sd.pt(a, 1.0, -0.45);
  s.interact({ x: ip[0], y: ip[1], z: ip[2], radius: 1.3, prompt: 'Drink at the tap',
    onUse(game) { game.sfxAt('pour', s.frame, t2[0], t2[1], t2[2]); setTimeout(() => { game.sfxAt('sip', s.frame, ip[0], 1.5, ip[2]); note(game, o.text || 'Cold, and faintly of the pipes. The cup on the chain has been mended twice, in gold.'); }, 900); } });
  s.spot('stand', ...sd.pt(a, 0, -1.0), sd.yaw + Math.PI, { tags: ['drink', 'street'] });
}

// A notice pillar: a square column with a cap, posters on all four faces. At (x, z) in the street.
export function noticePillar(s, x, z, posters, o = {}) {
  const g = s.g, hw = 0.33, h = 2.5;
  g.mat('paint', o.tint || '#2f4f43'); g.box(x - hw - 0.04, 0, z - hw - 0.04, x + hw + 0.04, 0.3, z + hw + 0.04, { bevel: 0.02, aoBottom: 0.6 });
  g.box(x - hw, 0.3, z - hw, x + hw, h, z + hw, { bevel: 0.015 });
  g.mat('cast', '#b08a45'); g.box(x - hw - 0.03, h, z - hw - 0.03, x + hw + 0.03, h + 0.06, z + hw + 0.03, { bevel: 0.01 });
  g.mat('paint', o.tint || '#2f4f43'); g.at(x, 0, z, Math.PI / 4); g.lathe(0, 0, [[hw * 1.5, h + 0.06], [hw * 1.42, h + 0.12], [hw * 0.9, h + 0.3], [0.07, h + 0.42], [0.03, h + 0.52]], { segs: 4 }); g.pop();
  g.mat('cast', '#b08a45'); g.ball(x, h + 0.55, z, 0.05, 0.05, 0.05, { segs: 8, rings: 5 });
  s.flush({ tier: 's', cast: true });
  s.solid(x - hw - 0.04, 0, z - hw - 0.04, x + hw + 0.04, h + 0.3, z + hw + 0.04);
  const faces = [['Z', 0, 1], ['X', 1, 0], ['z', 0, -1], ['x', -1, 0]];
  posters.forEach((p, i) => { const f = faces[i % 4]; sign(s, p, x + f[1] * (hw + 0.002), 1.45, z + f[2] * (hw + 0.002), { face: f[0], w: 0.5, h: 0.72, board: false }); });
  // small notices pasted under the posters
  if (o.notes) o.notes.forEach((p, i) => { const f = faces[i % 4]; const off = 0.12 * (i % 2 ? 1 : -1); sign(s, p, x + f[1] * (hw + 0.003) + (f[2] ? off : 0), 0.78, z + f[2] * (hw + 0.003) + (f[1] ? off : 0), { face: f[0], w: 0.22, h: 0.3, board: false }); });
}

// A public clock: a double-faced drum hung under a beam, whose hands keep the drum's time.
export function publicClock(s, st, a, v, yc, o = {}) {
  const g = s.g, R = o.r || 0.3, H = st.H, W = s.world, game = W.game;
  const c = st.pt(a, yc, v), e0 = st.pt(a - 0.09, yc, v), e1 = st.pt(a + 0.09, yc, v);
  g.mat('paint', '#2f4f43', { rough: -0.2 }); g.tube([e0, e1], R + 0.035, { segs: 24, caps: false });
  g.mat('cast', '#b08a45'); for (const sg of [-1, 1]) g.tube([st.pt(a + sg * 0.09, yc, v), st.pt(a + sg * 0.1, yc, v)], R + 0.045, { segs: 24, caps: false });
  g.mat('paint', '#f3ead4', { emissive: 0.5, lamp: true }); for (const sg of [-1, 1]) g.tube([st.pt(a + sg * 0.085, yc, v), st.pt(a + sg * 0.092, yc, v)], R, { segs: 24 });
  // hour marks
  g.mat('plain', '#1d1b18');
  for (const sg of [-1, 1]) for (let k = 0; k < 12; k++) {
    const t = k / 12 * Math.PI * 2, rr = R * 0.84, big = k % 3 === 0 ? 1.8 : 1;
    const up = Math.cos(t) * rr, rt = Math.sin(t) * rr;
    // the viewer of the +a face looks along -a; their right is -v for street x, and the same rule for z
    const right = st.X ? -sg : sg;
    const p = st.pt(a + sg * 0.094, yc + up, v + right * rt);
    g.box(p[0] - 0.012 * big, p[1] - 0.012 * big, p[2] - 0.012 * big, p[0] + 0.012 * big, p[1] + 0.012 * big, p[2] + 0.012 * big);
  }
  // the hanger from the ceiling
  g.mat('cast', '#2f2c28'); g.tube([st.pt(a, yc + R + 0.03, v), st.pt(a, H - 0.37, v)], 0.02, { segs: 6 });
  g.box(c[0] - 0.08, H - 0.4, c[2] - 0.08, c[0] + 0.08, H - 0.37, c[2] + 0.08);
  s.flush({ tier: 's' });
  if (o.label) for (const sg of [-1, 1]) sign(s, o.label, ...st.pt(a + sg * 0.02, yc - R - 0.17, v), { face: st.faceA(sg), w: 0.5, h: 0.16 });
  // the hands: four small meshes turned every frame
  const hands = [];
  for (const sg of [-1, 1]) for (const kind of ['h', 'm']) {
    const hg = new Geo(new MeshBuf(64, 128));
    hg.mat('cast', '#1d1b18', { rough: -0.2 });
    if (kind === 'h') hg.box(-0.014, -0.04, 0, 0.014, R * 0.55, 0.006); else hg.box(-0.009, -0.05, 0.006, 0.009, R * 0.82, 0.012);
    const mesh = new THREE.Mesh(hg.buf.toGeometry(), W.mats.opaque);
    const origin = st.pt(a + sg * 0.096, yc, v);
    W.addRenderable(mesh, { frame: s.frame, origin, center: [0, 0, 0], radius: R + 0.1, far: 150, caster: false, scope: s });
    s.meshes.push(mesh);
    const n = st.X ? [sg, 0, 0] : [0, 0, sg];
    hands.push({ mesh, kind, n });
  }
  const upd = () => {
    const h = game && game.clock ? game.clock.hours : 12;
    for (const hd of hands) {
      const th = hd.kind === 'h' ? ((h % 12) / 12) * Math.PI * 2 : (h % 1) * Math.PI * 2;
      const n = hd.n; const right = [-(n[1] * 0 - n[2] * 1), -(n[2] * 0 - n[0] * 0), -(n[0] * 1 - n[1] * 0)];     // right = -(n x up)
      const hv = [Math.sin(th) * right[0], Math.cos(th), Math.sin(th) * right[2]];
      const x0 = hv[1] * n[2] - hv[2] * n[1], x1 = hv[2] * n[0] - hv[0] * n[2], x2 = hv[0] * n[1] - hv[1] * n[0];
      const e = hd.mesh.matrixWorld.elements;
      e[0] = x0; e[1] = x1; e[2] = x2; e[4] = hv[0]; e[5] = hv[1]; e[6] = hv[2]; e[8] = n[0]; e[9] = n[1]; e[10] = n[2];
    }
  };
  upd();
  W.dynamics.push({ scope: s, t: 0, update(dt) { this.t += dt; if (this.t > 0.5) { this.t = 0; upd(); } } });
  const ip = st.pt(a, 1.6, v);
  s.interact({ x: ip[0], y: 2.2, z: ip[2], radius: 2.2, prompt: 'Read the clock', wide: true,
    onUse(g2) { const l = g2.clock && g2.clock.label ? g2.clock.label() : ''; note(g2, o.text ? o.text(l) : 'The street clock says ' + l + '. Somebody on Ladle Row winds it on the Quiet, by hand, every year.'); } });
}

// A noticeboard on a front: a framed cork board with notices pinned on it.
export function noticeboard(s, sd, a0, a1, y0, y1, notices, o = {}) {
  const g = s.g;
  g.mat('wood', '#5b3a26'); sd.box(g, a0, a1, -0.06, 0, y0, y1, { bevel: 0.012 });
  g.mat('felt', '#a8814f'); sd.box(g, a0 + 0.07, a1 - 0.07, -0.07, -0.06, y0 + 0.07, y1 - 0.07, { faces: 'f' });
  g.mat('wood', '#5b3a26'); sd.box(g, a0 - 0.05, a1 + 0.05, -0.14, 0, y1, y1 + 0.06, { bevel: 0.01 });
  s.flush({ tier: 's' });
  for (const n of notices) sign(s, n.spec, ...sd.pt(n.a, n.y, -0.072), { face: sd.face, w: n.w || 0.3, h: n.h || 0.42, board: false });
  if (o.title) sign(s, { kind: 'label', text: o.title, ink: '#f1e6c9' }, ...sd.pt((a0 + a1) / 2, y1 + 0.16, -0.01), { face: sd.face, w: Math.min(1.6, a1 - a0), h: 0.2 });
  const ip = sd.pt((a0 + a1) / 2, (y0 + y1) / 2, -0.4);
  s.interact({ x: ip[0], y: ip[1], z: ip[2], radius: 1.5, prompt: o.prompt || 'Read the noticeboard', onUse(game) { read(game, o.who || 'Noticeboard', o.lines || notices.map((n) => (n.spec.title ? n.spec.title + ': ' : '') + (n.spec.lines || []).join(' '))); } });
  s.spot('stand', ...sd.pt((a0 + a1) / 2 - 0.3, 0, -0.8), sd.yaw + Math.PI, { tags: ['read', 'street'] });
  s.spot('stand', ...sd.pt((a0 + a1) / 2 + 0.4, 0, -0.9), sd.yaw + Math.PI, { tags: ['read', 'street'] });
}

// A wall of brass letter flaps on a timber board, one per household.
export function letterFlaps(s, sd, a0, a1, o = {}) {
  const g = s.g, y0 = 0.85, y1 = 2.05;
  g.mat('wood', '#6b4a2f'); sd.box(g, a0, a1, -0.05, 0, y0 - 0.1, y1 + 0.1, { bevel: 0.01 });
  const cols = Math.max(2, Math.floor((a1 - a0 - 0.2) / 0.27)), rows = 6, cw = (a1 - a0 - 0.2) / cols, rh = (y1 - y0) / rows;
  g.mat('cast', '#c4a05a', { rough: -0.15 });
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const p = a0 + 0.1 + i * cw, y = y0 + j * rh;
    sd.box(g, p + 0.025, p + cw - 0.025, -0.065, -0.05, y + 0.03, y + rh - 0.03, { bevel: 0.004 });
  }
  g.mat('cast', '#3a2c14'); for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const p = a0 + 0.1 + i * cw, y = y0 + j * rh; sd.box(g, p + cw * 0.3, p + cw * 0.7, -0.067, -0.065, y + rh * 0.62, y + rh * 0.7, { faces: 'f' }); }
  s.flush({ tier: 'd', cast: false });
  if (o.plate) sign(s, o.plate, ...sd.pt((a0 + a1) / 2, y1 + 0.28, -0.006), { face: sd.face, w: 0.42, h: 0.16 });
  const ip = sd.pt((a0 + a1) / 2, 1.4, -0.4);
  s.interact({ x: ip[0], y: ip[1], z: ip[2], radius: 1.4, prompt: 'Read the names on the flaps', onUse(game) { game.sfxAt('clunk', s.frame, ip[0], ip[1], ip[2], { vol: 0.4 }); read(game, o.who || 'Letter flaps', o.lines || ['Names on brass, one to a flap.']); } });
  s.spot('stand', ...sd.pt((a0 + a1) / 2, 0, -0.75), sd.yaw + Math.PI, { tags: ['letters', 'street'] });
}

// Children's chalk on the floor: a hopscotch, a drum drawn as two circles and an axis, a flier in wing-sleeves, a few loose sticks.
export function chalk(s, st, a, v, o = {}) {
  const g = s.g, y = 0.005, lw = 0.055;
  const quadsOf = (pts, col, closed) => {
    g.mat('plain', col, { rough: 0.35 });
    const n = pts.length, m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const p = pts[i], q = pts[(i + 1) % n]; const da = q[0] - p[0], dv = q[1] - p[1], l = Math.hypot(da, dv) || 1; const na = -dv / l * lw / 2, nv = da / l * lw / 2;
      g.quad(st.pt(p[0] - na, y, p[1] - nv), st.pt(q[0] - na, y, q[1] - nv), st.pt(q[0] + na, y, q[1] + nv), st.pt(p[0] + na, y, p[1] + nv), { double: true });
    }
  };
  const rect = (a0, v0, a1, v1, col) => quadsOf([[a0, v0], [a1, v0], [a1, v1], [a0, v1]], col, true);
  // hopscotch along the street: 1, 2, 3, then 4-5 side by side, 6, then 7-8, and a home circle
  const sq = 0.42; let aa = a;
  const cols = ['#fbf6ea', '#ff9cb8', '#ffd84a', '#7fd0f0'];
  rect(aa, v - sq / 2, aa + sq, v + sq / 2, cols[0]); aa += sq;
  rect(aa, v - sq / 2, aa + sq, v + sq / 2, cols[0]); aa += sq;
  rect(aa, v - sq / 2, aa + sq, v + sq / 2, cols[0]); aa += sq;
  rect(aa, v - sq, aa + sq, v, cols[1]); rect(aa, v, aa + sq, v + sq, cols[1]); aa += sq;
  rect(aa, v - sq / 2, aa + sq, v + sq / 2, cols[0]); aa += sq;
  rect(aa, v - sq, aa + sq, v, cols[2]); rect(aa, v, aa + sq, v + sq, cols[2]); aa += sq;
  const circ = (ca, cv, r, col, nn) => { const p = []; for (let i = 0; i < (nn || 18); i++) { const t = i / (nn || 18) * Math.PI * 2; p.push([ca + Math.cos(t) * r, cv + Math.sin(t) * r]); } quadsOf(p, col, true); };
  circ(aa + 0.32, v, 0.3, cols[3]);
  // the drum: two circles and the axis through them
  const da = a + 0.3, dv = v + (o.flip ? -1 : 1) * 1.2;
  circ(da, dv, 0.42, cols[3], 20); circ(da, dv, 0.24, cols[1], 16); quadsOf([[da - 0.6, dv], [da + 0.6, dv]], cols[2]);
  // a flier: a stick figure with long sleeves
  const fa = a + 1.6, fv = dv;
  quadsOf([[fa, fv - 0.18], [fa + 0.3, fv - 0.18]], cols[0]); circ(fa + 0.38, fv - 0.18, 0.08, cols[0], 10);
  quadsOf([[fa + 0.15, fv - 0.18], [fa + 0.05, fv - 0.5], [fa + 0.3, fv - 0.36]], cols[1]); quadsOf([[fa + 0.15, fv - 0.18], [fa + 0.05, fv + 0.14], [fa + 0.3, fv]], cols[1]);
  quadsOf([[fa, fv - 0.18], [fa - 0.2, fv - 0.28]], cols[0]); quadsOf([[fa, fv - 0.18], [fa - 0.2, fv - 0.08]], cols[0]);
  s.flush({ tier: 'd', cast: false });
  // loose sticks
  g.mat('plain', '#f4b8c8'); const p1 = st.pt(a - 0.3, 0.008, v + 0.5); g.box(p1[0] - 0.04, 0, p1[2] - 0.008, p1[0] + 0.04, 0.016, p1[2] + 0.008, { bevel: 0.006 });
  g.mat('plain', '#f6dc7a'); const p2 = st.pt(a - 0.24, 0.008, v + 0.58); g.box(p2[0] - 0.008, 0, p2[2] - 0.035, p2[0] + 0.008, 0.016, p2[2] + 0.035, { bevel: 0.006 });
  s.flush({ tier: 'd', cast: false });
  const sp = [[a + 0.2, v + 0.6, 0], [a + 2.6, v - 0.7, Math.PI], [a + 1.2, v + 0.75, 2.4]];
  for (const q of sp) s.spot('play', ...st.pt(q[0], 0, q[1]), q[2], { tags: ['kids', 'chalk', 'street'] });
}

// A recessed niche in a front, lined with tile, where the sweeper waits. Builds its own front wall pieces round it.
export function sweeperNiche(s, sd, a0, a1, fin, o = {}) {
  const g = s.g, st = sd.st, H = st.H, w = a1 - a0, nw = 1.3, at = (w - nw) / 2, nh = 1.55, D = 0.95;
  frontWall(s, sd, a0, a1, H, [{ at, w: nw, h: nh }], fin);
  const n0 = a0 + at, n1 = n0 + nw;
  g.mat('tile', '#e8dcc2'); sd.box(g, n0, n1, D, D + 0.05, 0, nh, { faces: 'f' }); sd.box(g, n0 - 0.05, n0, 0, D, 0, nh, { faces: 'A' }); sd.box(g, n1, n1 + 0.05, 0, D, 0, nh, { faces: 'a' });
  sd.box(g, n0, n1, 0, D, nh, nh + 0.05, { faces: 'y' });
  g.mat('tile', '#2f6f73'); sd.box(g, n0, n1, D - 0.002, D, 0, 0.5, { faces: 'f' });
  g.mat('stone', '#a99c86'); sd.box(g, n0, n1, -0.06, D, 0, 0.04, { faces: 'fYaA', bevel: 0.006 });
  g.mat('stone', '#c2b49a'); sd.box(g, n0 - 0.12, n1 + 0.12, -0.05, 0.02, nh, nh + 0.16, { bevel: 0.01 });
  for (const e of [n0 - 0.12, n1]) sd.box(g, e, e + 0.12, -0.05, 0.02, 0, nh, { bevel: 0.01 });
  s.flush({ tier: 's' });
  sd.solid(s, n0, n1, 0.0, D + 0.05, 0, nh);
  const c = sd.pt((n0 + n1) / 2, 0.04, D / 2);
  prop(s, 'streets.sweeper', c[0], c[1], c[2], sd.yaw, {});
  lamp(s, 'spot', ...sd.pt((n0 + n1) / 2, nh, D / 2 - 0.1), { power: 0.35, K: 3400, clip: sd.st.bx(n0 - 0.05, sd.v(-0.3), n1 + 0.05, sd.v(D + 0.1), -0.1, nh + 0.1), cone: [60, 30] });
  sign(s, { kind: 'plate', text: 'SWEEPER · DECK ' + (o.deck || 16), lines: ['charging · please do not sit on it'] }, ...sd.pt(n1 + 0.4, 1.45, -0.006), { face: sd.face, w: 0.34, h: 0.15 });
  const ip = sd.pt((n0 + n1) / 2, 0.8, -0.3);
  s.interact({ x: ip[0], y: ip[1], z: ip[2], radius: 1.5, prompt: 'Look at the sweeper',
    onUse(game) { note(game, o.text || 'A street sweeper, docked and charging. It goes out at two in the morning and comes back with other people\'s buttons in its bin.'); } });
  s.spot('work', ...sd.pt((n0 + n1) / 2 + 0.9, 0, -0.9), sd.yaw, { tags: ['sweep', 'street'] });
}

// A planter with a lamp to keep it: a kit planter on the street, flowers or ferns.
export function streetPlanter(s, x, z, w, d, plants) {
  planter(s, x, 0, z, { w, d, h: 0.55, plants, tint: '#a99c86', density: 18 });
}

// ---------------------------------------------------------------------------------------------------------------
// walkways
// ---------------------------------------------------------------------------------------------------------------
// A walkway along the street at v through every a in `as` (sorted, near-duplicates merged).
export function rowPath(s, st, v, as, o) {
  const xs = as.slice().sort((p, q) => p - q); const pts = [];
  for (const a of xs) if (!pts.length || a - pts[pts.length - 1] > 0.8) pts.push(a);
  s.path(pts.map((a) => st.xz(a, v)), o);
  return pts;
}
// Every `step` metres from a0 to a1, plus the given extras.
export function stations(a0, a1, step, extra) { const r = []; const n = Math.max(1, Math.round((a1 - a0) / step)); for (let i = 0; i <= n; i++) r.push(a0 + (a1 - a0) * i / n); return r.concat(extra || []); }

// Join the loose ends of other places' walkways (shop doors along the fronts) to this street's walkways.
// band: [vMin, vMax] in |v| where a loose end may be; aRange: [a0, a1].
export function stitch(s, st, aRange, band, maxD) {
  const nav = s.world.nav(s.frame);
  const mine = nav.nodes.filter((n) => n.owner === s);
  let k = 0;
  for (const n of nav.nodes) {
    if (n.owner === s || n.links.length > 1 || Math.abs(n.y) > 0.6) continue;
    const c0 = st.c0 || 0;
    const a = st.X ? n.x : n.z, v = (st.X ? n.z : n.x) - c0;
    if (a < aRange[0] - 0.5 || a > aRange[1] + 0.5 || Math.abs(v) < band[0] || Math.abs(v) > band[1]) continue;
    if (n.links.some((l) => l.to.owner === s)) continue;
    let best = null, bd = 1e9;
    for (const m of mine) { const mv = (st.X ? m.z : m.x) - c0; if (Math.abs(mv) > 0.5 && Math.sign(mv) !== Math.sign(v)) continue; const d = Math.hypot(m.x - n.x, m.z - n.z); if (d < bd) { bd = d; best = m; } }
    if (best && bd < (maxD || 4)) { nav.link(n, best, 1.4); k++; }
  }
  return k;
}

// A board of direction signs hung from a beam: `plus` faces +a (read by people walking toward -a), `minus` faces -a.
export function signBoard(s, st, a, v, plus, minus) {
  const g = s.g, H = st.H, n = Math.max(plus.length, minus.length), top = 2.86;
  g.mat('cast', '#2f2c28');
  for (const dv of [-0.4, 0.4]) st.tube(g, [[a, H - 0.37, v + dv], [a, top + 0.02, v + dv]], 0.008, { segs: 4 });
  s.flush({ tier: 's' });
  for (let i = 0; i < n; i++) {
    const y = top - 0.12 - i * 0.24;
    if (plus[i]) sign(s, plus[i], ...st.pt(a + 0.012, y, v), { face: st.faceA(1), w: 0.9, h: 0.2 });
    if (minus[i]) sign(s, minus[i], ...st.pt(a - 0.012, y, v), { face: st.faceA(-1), w: 0.9, h: 0.2 });
  }
}

