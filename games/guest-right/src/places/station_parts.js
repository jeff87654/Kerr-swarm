// Parts for Station Ring 2's glide platform and its lift lobby: the palette, the vault's curve, meshes that move,
// the armoured glide car and its seats, and the platform's own props.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { defineProp } from '../world/props.js';
import { signRect } from '../world/signs.js';
import { shadeHex, Rng, hashStr } from '../core/util.js';

export const stationParts = true;

// Five colours and an accent: deep teal steel, warm cream panels, oxide-red cars, worn deck grey, brass, and safety yellow.
export const PAL = {
  teal: '#2c5a56', tealDark: '#1d3b39', cream: '#e2d6bc', vault: '#cfc2a4', oxide: '#b0502c', yellow: '#e0ad32',
  steel: '#474c4e', brass: '#b08a45', deck: '#74716a', conc: '#8a8378', ink: '#1b1d1e',
};

// ---- the vault: a segmental barrel over z[-22, 12], springing at y = 8 from both walls, crown 12.6 m
export const VAULT = { zN: -22, zS: 12, spring: 8, crown: 12.6 };
const ZC = (VAULT.zN + VAULT.zS) / 2, HALF = (VAULT.zS - VAULT.zN) / 2, RISE = VAULT.crown - VAULT.spring;
const RAD = (HALF * HALF + RISE * RISE) / (2 * RISE), YC = VAULT.crown - RAD;
export function vaultY(z) { const d = z - ZC; return YC + Math.sqrt(Math.max(0, RAD * RAD - d * d)); }
export function vaultSlope(z) { const d = z - ZC; return -d / Math.sqrt(Math.max(1e-6, RAD * RAD - d * d)); }

// A box that follows the vault's curve along z at x in [x0, x1]: from `below` under the vault surface to `above` over it.
export function vaultBand(g, x0, x1, z0, z1, below, above, n) {
  const segs = n || Math.max(2, Math.ceil((z1 - z0) / 2));
  for (let i = 0; i < segs; i++) {
    const za = z0 + (z1 - z0) * i / segs, zb = z0 + (z1 - z0) * (i + 1) / segs, zm = (za + zb) / 2;
    const a = Math.atan(vaultSlope(zm)), L = Math.hypot(zb - za, vaultY(zb) - vaultY(za)) * 1.02;
    g.push(); g.move(0, vaultY(zm), zm); g.rotX(-a);
    g.box(x0, -below, -L / 2, x1, above, L / 2);
    g.pop();
  }
}

// ---- meshes that move: drawn once into their own buffer, placed by the world every frame from userData.origin.
export function movable(s, draw, origin, o = {}) {
  const g = new Geo(new MeshBuf(1024, 2048)); draw(g);
  const mesh = new THREE.Mesh(g.buf.toGeometry(), s.world.mats.opaque);
  s.world.addRenderable(mesh, { frame: s.frame, origin: origin.slice(), center: o.center || [0, 0, 0], radius: o.radius || 6, far: o.far || 150, caster: !!o.caster, scope: s });
  s.meshes.push(mesh);
  return mesh;
}
// Turn a movable mesh about the x axis (clock hands).
export function rotX(mesh, a) { const e = mesh.matrixWorld.elements, c = Math.cos(a), sn = Math.sin(a); e[0] = 1; e[1] = 0; e[2] = 0; e[4] = 0; e[5] = c; e[6] = sn; e[8] = 0; e[9] = -sn; e[10] = c; }

// The sign atlas is shared by the whole game, so big signs here are painted at a lower density: k divides the
// pixels per metre (a sign is painted at w/k x h/k and stretched to w x h). Otherwise like world/signs.js sign().
const CUTOUT_KINDS = { label: 1, letters: 1 };
export function signK(s, spec, x, y, z, o) {
  const game = s.world.game, atlas = game && game.atlas; if (!atlas) return null;
  const k = o.k || 1, w = o.w, h = o.h, g = s.g, face = o.face || 'Z';
  const R = signRect(atlas, spec, w / k, h / k), r = R.rect, cut = !!CUTOUT_KINDS[spec.kind];
  const faces = o.double ? [face, { X: 'x', x: 'X', Z: 'z', z: 'Z' }[face]] : [face];
  const t = 0.022;
  for (const fc of faces) {
    const nx = fc === 'X' ? 1 : fc === 'x' ? -1 : 0, nz = fc === 'Z' ? 1 : fc === 'z' ? -1 : 0, rx = nz, rz = -nx;
    const off = o.double ? t / 2 + 0.002 : 0.003, cx = x + nx * off, cz = z + nz * off;
    g.atlas(r.page, { emissive: o.glow || 0, lamp: !!o.glow && o.lamp !== false });
    if (cut) g._mat[2] |= 16;
    g.quad([cx - rx * w / 2, y - h / 2, cz - rz * w / 2], [cx + rx * w / 2, y - h / 2, cz + rz * w / 2], [cx + rx * w / 2, y + h / 2, cz + rz * w / 2], [cx - rx * w / 2, y + h / 2, cz - rz * w / 2], { uv: [r.u0, r.v1, r.u1, r.v0] });
  }
  if (o.board !== false && !cut) {
    const alongX = face === 'Z' || face === 'z', sg = face === 'X' || face === 'Z' ? 1 : -1, m = 0.012;
    g.mat('wood', o.back || '#3a2d22');
    if (o.double) { if (alongX) g.box(x - w / 2 - m, y - h / 2 - m, z - t / 2, x + w / 2 + m, y + h / 2 + m, z + t / 2); else g.box(x - t / 2, y - h / 2 - m, z - w / 2 - m, x + t / 2, y + h / 2 + m, z + w / 2 + m); }
    else if (alongX) g.box(x - w / 2 - m, y - h / 2 - m, z - sg * t, x + w / 2 + m, y + h / 2 + m, z, { faces: 'xXyY' + (sg > 0 ? 'Z' : 'z') });
    else g.box(x - sg * t, y - h / 2 - m, z - w / 2 - m, x, y + h / 2 + m, z + w / 2 + m, { faces: 'zZyY' + (sg > 0 ? 'X' : 'x') });
  }
  s.flush({ tier: o.tier || (Math.max(w, h) > 1.2 ? 's' : 'd'), level: o.level });
  return R;
}

// A sign drawn into any Geo (for signs that ride on moving meshes). face: 'x' | 'X' | 'z' | 'Z'. o.k as in signK.
export function signQuad(g, game, spec, x, y, z, face, w, h, o = {}) {
  const atlas = game && game.atlas; if (!atlas) return;
  const k = o.k || 1, R = signRect(atlas, spec, w / k, h / k), r = R.rect, W = w, H = h;
  const nx = face === 'X' ? 1 : face === 'x' ? -1 : 0, nz = face === 'Z' ? 1 : face === 'z' ? -1 : 0, rx = nz, rz = -nx;
  const cx = x + nx * 0.004, cz = z + nz * 0.004;
  g.atlas(r.page, { emissive: o.glow || 0, lamp: !!o.glow });
  g.quad([cx - rx * W / 2, y - H / 2, cz - rz * W / 2], [cx + rx * W / 2, y - H / 2, cz + rz * W / 2], [cx + rx * W / 2, y + H / 2, cz + rz * W / 2], [cx - rx * W / 2, y + H / 2, cz - rz * W / 2], { uv: [r.u0, r.v1, r.u1, r.v0] });
}

// ---- the glide car. Local space: x along the platform (centre 0), y up from the platform floor, z = 0 at the aft face
// (the face toward the platform and the back cap: windows face aft), the car running back to z = -6 toward the Lantern.
export const CAR = { hx: 4.5, d: 6.0, top: 3.0, ix: 2.7, iz0: -1.0, iz1: -3.9, ih: 2.3, door: 0.6, doorH: 2.1, w0: 1.4, w1: 2.1, wy0: 1.0, wy1: 1.55 };
const CUSHIONS = ['#2f6f73', '#8a2f3c', '#c08a2e', '#3b4a7a', '#6b8f4e', '#a8543a'];

// An armoured bucket seat with a four-point harness, front toward +z, feet at the origin. Cushion top at 0.47.
export function drawSeat(g, x, z, cushion, yaw) {
  g.at(x, 0, z, yaw || 0);
  g.mat('cast', '#3a3f41'); g.cyl(0, 0, -0.06, 0.17, 0.03, { segs: 10 }); g.cyl(0, 0.03, -0.06, 0.06, 0.31, { segs: 8 });
  g.box(-0.24, 0.33, -0.3, 0.24, 0.38, 0.2, { bevel: 0.015 });
  g.mat('leather', cushion, { rough: -0.1 }); g.box(-0.225, 0.37, -0.26, 0.225, 0.47, 0.22, { bevel: 0.045 });
  g.mat('cast', '#3a3f41'); g.box(-0.26, 0.36, -0.38, 0.26, 1.22, -0.3, { bevel: 0.025 });
  g.mat('leather', cushion, { rough: -0.1 }); g.box(-0.225, 0.47, -0.31, 0.225, 1.12, -0.2, { bevel: 0.045 });
  g.box(-0.14, 1.1, -0.33, 0.14, 1.36, -0.21, { bevel: 0.05 });
  g.mat('cast', '#3a3f41'); for (const sx of [-1, 1]) g.box(sx * 0.245 - 0.022, 0.47, -0.3, sx * 0.245 + 0.022, 0.68, 0.12, { bevel: 0.012 });
  g.mat('weave', '#23282b');
  for (const sx of [-1, 1]) g.tube([[sx * 0.11, 1.13, -0.2], [sx * 0.1, 0.98, -0.155], [sx * 0.06, 0.66, -0.12], [sx * 0.03, 0.53, -0.06]], 0.02, { segs: 4 });
  g.box(-0.2, 0.48, -0.06, 0.2, 0.515, -0.02);
  g.mat('cast', PAL.brass, { rough: -0.2 }); g.box(-0.045, 0.47, -0.07, 0.045, 0.56, -0.01, { bevel: 0.01 });
  g.pop();
}

// The car: o: { body, band, interior: bool, fakeWindows: bool (a dark water face instead of real glass), seats: bool, game, number }
export function drawCar(g, o = {}) {
  const C = CAR, body = o.body || PAL.oxide, band = o.band || '#e8dcbf', dark = '#33373a';
  // the armour skirt below the floor (it goes down into the pit)
  g.mat('panel', dark); g.box(-C.hx + 0.12, -1.5, -C.d + 0.12, C.hx - 0.12, 0.1, -0.12, { faces: 'xXzZ', aoBottom: 0.4 });
  // sides and front: thick tanks of water behind riveted plate
  g.mat('panel', body); g.box(-C.hx, 0.1, -C.d, C.hx, C.top, 0, { faces: 'xXz', aoBottom: 0.8 });
  const A = (x0, x1, y0, y1) => g.box(x0, y0, -0.1, x1, y1, 0, { faces: 'Z', aoBottom: y0 < 0.2 ? 0.85 : 1 });
  A(-C.hx, -C.w1, 0.1, C.top); A(C.w1, C.hx, 0.1, C.top); A(-C.door, C.door, C.doorH, C.top);
  for (const sx of [-1, 1]) {
    const a = Math.min(sx * C.w0, sx * C.w1), b = Math.max(sx * C.w0, sx * C.w1);
    A(a, b, 0.1, C.wy0); A(a, b, C.wy1, C.top);
    A(Math.min(sx * C.door, sx * C.w0), Math.max(sx * C.door, sx * C.w0), 0.1, C.top);
  }
  // the tank seams, the corner beads and the roof cap
  g.mat('panel', shadeHex(body, 0.78));
  for (const x of [-3.2, 3.2]) g.box(x - 0.04, 0.1, 0.0, x + 0.04, C.top, 0.03, { faces: 'ZxX' });
  for (const z of [-2.0, -4.0]) for (const sx of [-1, 1]) g.box(sx * C.hx - 0.03, 0.1, z - 0.04, sx * C.hx + 0.03, C.top, z + 0.04, { faces: sx > 0 ? 'XzZ' : 'xzZ' });
  g.mat('panel', body); for (const sx of [-1, 1]) for (const z of [0, -C.d]) g.cyl(sx * C.hx, 0.1, z, 0.15, C.top - 0.1, { segs: 10, capBottom: false });
  g.mat('panel', shadeHex(body, 0.62)); g.box(-C.hx - 0.1, C.top, -C.d - 0.1, C.hx + 0.1, C.top + 0.32, 0.1, { bevel: 0.12 });
  g.mat('panel', dark); g.box(-C.hx - 0.06, 0.06, -C.d - 0.06, C.hx + 0.06, 0.26, 0.06, { faces: 'xXzZY', bevel: 0.03 });
  // a cream band all round, above the door head
  g.mat('paint', band); g.box(-C.hx - 0.016, 2.32, -C.d - 0.016, C.hx + 0.016, 2.58, 0.016, { faces: 'xXzZ' });
  for (const sx of [-1, 1]) for (const z of [0, -C.d]) g.cyl(sx * C.hx, 2.32, z, 0.166, 0.26, { segs: 10, capBottom: false, capTop: false });
  // roof furniture: lifting lugs, a hatch, the cable trunk
  g.mat('cast', '#3d4244');
  for (const sx of [-1, 1]) for (const z of [-0.8, -5.2]) { g.box(sx * 3.6 - 0.12, C.top + 0.32, z - 0.05, sx * 3.6 + 0.12, C.top + 0.5, z + 0.05, { bevel: 0.02 }); g.tube([[sx * 3.6 - 0.09, C.top + 0.5, z], [sx * 3.6, C.top + 0.62, z], [sx * 3.6 + 0.09, C.top + 0.5, z]], 0.025, { segs: 5 }); }
  g.cyl(-1.6, C.top + 0.32, -3.0, 0.42, 0.1, { segs: 16 }); g.cyl(-1.6, C.top + 0.42, -3.0, 0.3, 0.04, { segs: 16 });
  g.mat('panel', PAL.steel); g.box(0.6, C.top + 0.32, -4.6, 3.0, C.top + 0.52, -4.2, { bevel: 0.03 });
  // the door: a hazard frame, a deep reveal, a bridge plate onto the platform
  g.mat('paint', PAL.yellow); g.box(-0.78, 0.1, 0, -C.door, 2.28, 0.03, { faces: 'ZxX' }); g.box(C.door, 0.1, 0, 0.78, 2.28, 0.03, { faces: 'ZxX' }); g.box(-0.78, C.doorH, 0, 0.78, 2.28, 0.03, { faces: 'ZyY' });
  g.mat('paint', '#1c1c1c'); for (let i = 0; i < 6; i++) { const y = 0.22 + i * 0.34; for (const sx of [-1, 1]) g.box(sx > 0 ? C.door : -0.78, y, 0.03, sx > 0 ? 0.78 : -C.door, y + 0.15, 0.034, { faces: 'Z' }); }
  for (let i = 0; i < 5; i++) { const x = -0.7 + i * 0.32; g.box(x, C.doorH + 0.02, 0.03, x + 0.14, 2.26, 0.034, { faces: 'Z' }); }
  g.mat('panel', '#4b4743'); g.box(-C.door - 0.02, 0, -1.0, -C.door, C.doorH, 0, { faces: 'X' }); g.box(C.door, 0, -1.0, C.door + 0.02, C.doorH, 0, { faces: 'x' });
  g.box(-C.door, C.doorH, -1.0, C.door, C.doorH + 0.02, 0, { faces: 'y' });
  g.mat('deckplate', '#7b776e'); g.box(-C.door, -0.08, -1.0, C.door, 0, 0.2, { faces: 'YZ' });
  g.mat('paint', PAL.yellow); g.box(-C.door, -0.08, 0.15, C.door, 0.004, 0.22, { faces: 'YZ' });
  g.mat('cast', PAL.brass, { rough: -0.25 }); for (const sx of [-1, 1]) g.tube([[sx * 0.92, 0.55, 0.0], [sx * 0.92, 0.6, 0.09], [sx * 0.92, 1.85, 0.09], [sx * 0.92, 1.9, 0.0]], 0.022, { segs: 6 });
  // door lamps and a little hood over the door
  g.mat('diffuser', '#ffb347', { emissive: 2.5 }); for (const sx of [-1, 1]) g.ball(sx * 0.42, 2.44, 0.06, 0.06, 0.06, 0.05, { segs: 8, rings: 5 });
  g.mat('panel', shadeHex(body, 0.62)); g.box(-1.0, 2.62, 0, 1.0, 2.7, 0.28, { bevel: 0.02 });
  // the windows: a metre and more of clear water, deep in the aft wall
  for (const sx of [-1, 1]) {
    const a = Math.min(sx * C.w0, sx * C.w1), b = Math.max(sx * C.w0, sx * C.w1);
    g.mat('plain', '#2f7a84', { rough: -0.35 });
    g.box(a - 0.02, C.wy0, -1.0, a, C.wy1, 0, { faces: 'X' }); g.box(b, C.wy0, -1.0, b + 0.02, C.wy1, 0, { faces: 'x' });
    g.box(a, C.wy1, -1.0, b, C.wy1 + 0.02, 0, { faces: 'y' }); g.box(a, C.wy0 - 0.02, -1.0, b, C.wy0, 0, { faces: 'Y' });
    if (o.fakeWindows) { g.mat('plain', '#10323a', { rough: -0.45, emissive: 0.12 }); g.box(a, C.wy0, -0.12, b, C.wy1, -0.1, { faces: 'Z' }); g.mat('plain', '#2c6d78', { rough: -0.45, emissive: 0.2 }); g.box(a + 0.04, C.wy1 - 0.08, -0.098, b - 0.04, C.wy1 - 0.05, -0.096, { faces: 'Z' }); }
    g.mat('cast', '#2b2f31'); g.box(a - 0.07, C.wy0 - 0.07, 0, b + 0.07, C.wy0, 0.05, { faces: 'ZY' }); g.box(a - 0.07, C.wy1, 0, b + 0.07, C.wy1 + 0.07, 0.05, { faces: 'Zy' });
    g.box(a - 0.07, C.wy0, 0, a, C.wy1, 0.05, { faces: 'ZX' }); g.box(b, C.wy0, 0, b + 0.07, C.wy1, 0.05, { faces: 'Zx' });
  }
  // the car's number and its warning, painted on
  if (o.game) {
    signQuad(g, o.game, { kind: 'plate', text: o.number || 'CAR 5114', sub: 'about 13 t of water a seat' }, 3.3, 1.7, 0.0, 'Z', 0.9, 0.4, { k: 3.6 });
    signQuad(g, o.game, { kind: 'plate', text: 'WINDOWS FACE AFT', sub: 'water 1.3 m deep' }, -3.3, 1.7, 0.0, 'Z', 0.8, 0.35, { k: 3.2 });
    for (const sx of [-1, 1]) signQuad(g, o.game, { kind: 'plate', text: o.number || 'CAR 5114', sub: 'about 13 t of water a seat' }, sx * (C.hx + 0.02), 1.6, -3.0, sx > 0 ? 'X' : 'x', 1.2, 0.53, { k: 4.8 });
  }
  if (!o.interior) return;
  // ---- inside: padded, because for 140 seconds everything floats
  g.mat('speckle', '#3c514e'); g.box(-C.ix, -0.04, C.iz1, C.ix, 0, C.iz0, { faces: 'Y' });
  g.mat('weave', '#d5c4a0');
  g.box(C.ix, 0, C.iz1, C.ix + 0.04, C.ih, C.iz0, { faces: 'x' }); g.box(-C.ix - 0.04, 0, C.iz1, -C.ix, C.ih, C.iz0, { faces: 'X' });
  g.box(-C.ix, 0, C.iz1 - 0.04, C.ix, C.ih, C.iz1, { faces: 'Z' });
  g.mat('weave', '#cbb995'); g.box(-C.ix, C.ih, C.iz1, C.ix, C.ih + 0.04, C.iz0, { faces: 'y' });
  const I = (x0, x1, y0, y1) => g.box(x0, y0, C.iz0, x1, y1, C.iz0 + 0.04, { faces: 'z' });
  g.mat('weave', '#d5c4a0');
  I(-C.ix, -C.w1, 0, C.ih); I(C.w1, C.ix, 0, C.ih); I(-C.door, C.door, C.doorH, C.ih);
  for (const sx of [-1, 1]) { const a = Math.min(sx * C.w0, sx * C.w1), b = Math.max(sx * C.w0, sx * C.w1); I(a, b, 0, C.wy0); I(a, b, C.wy1, C.ih); I(Math.min(sx * C.door, sx * C.w0), Math.max(sx * C.door, sx * C.w0), 0, C.ih); }
  // quilted ribs on the padding, a leather kick panel, the window and door surrounds
  g.mat('weave', '#c2ae88');
  for (let i = 0; i < 7; i++) { const z = C.iz1 + 0.25 + i * 0.42; for (const sx of [-1, 1]) g.box(sx * C.ix - 0.03, 0.55, z - 0.025, sx * C.ix + 0.03, C.ih - 0.1, z + 0.025, { bevel: 0.012 }); }
  for (let i = 0; i < 12; i++) { const x = -C.ix + 0.2 + i * 0.47; g.box(x - 0.025, 1.3, C.iz1 - 0.03, x + 0.025, C.ih - 0.1, C.iz1 + 0.03, { bevel: 0.012 }); }
  g.mat('leather', '#5a3527'); g.box(-C.ix, 0, C.iz1, C.ix, 0.5, C.iz1 + 0.06, { faces: 'ZY' }); for (const sx of [-1, 1]) g.box(sx > 0 ? C.ix - 0.06 : -C.ix, 0, C.iz1, sx > 0 ? C.ix : -C.ix + 0.06, 0.5, C.iz0, { faces: sx > 0 ? 'xY' : 'XY' });
  g.mat('cast', PAL.brass, { rough: -0.2 });
  for (const sx of [-1, 1]) { const a = Math.min(sx * C.w0, sx * C.w1), b = Math.max(sx * C.w0, sx * C.w1); g.box(a - 0.05, C.wy0 - 0.05, C.iz0 - 0.03, b + 0.05, C.wy0, C.iz0, { faces: 'zY' }); g.box(a - 0.05, C.wy1, C.iz0 - 0.03, b + 0.05, C.wy1 + 0.05, C.iz0, { faces: 'zy' }); }
  // grab rails and hanging straps
  for (const z of [-1.45, -3.25]) {
    g.tube([[-C.ix + 0.15, 2.12, z], [C.ix - 0.15, 2.12, z]], 0.02, { segs: 6 });
    for (const x of [-C.ix + 0.3, 0, C.ix - 0.3]) g.tube([[x, 2.12, z], [x, C.ih, z]], 0.012, { segs: 4, caps: false });
  }
  g.mat('leather', '#3b2a1f');
  for (const z of [-1.45, -3.25]) for (let i = 0; i < 8; i++) {
    const x = -C.ix + 0.45 + i * 0.64; if (Math.abs(x) < 0.3) continue;
    g.tube([[x, 2.12, z], [x, 1.86, z]], 0.014, { segs: 4 });
    const ring = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; ring.push([x + Math.sin(a) * 0.06, 1.8 + Math.cos(a) * 0.06, z]); } g.tube(ring, 0.011, { segs: 4, closed: true });
  }
  // the ceiling light
  g.mat('brushed', '#8d8478'); g.box(-2.25, C.ih - 0.05, -2.55, 2.25, C.ih, -2.25, { faces: 'yxXzZ' });
  g.mat('diffuser', '#fff1d8', { emissive: 3.5, lamp: true }); g.box(-2.2, C.ih - 0.06, -2.5, 2.2, C.ih - 0.05, -2.3, { faces: 'y' });
  // cargo nets at the two ends
  g.mat('weave', '#b8a27a');
  for (const sx of [-1, 1]) {
    const x = sx * (C.ix - 0.05);
    for (let k = 0; k <= 4; k++) { const y = 0.55 + k * 0.28; g.tube([[x, y, C.iz1 + 0.5], [x, y, C.iz1 + 1.5]], 0.008, { segs: 3, caps: false }); }
    for (let k = 0; k <= 5; k++) { const z = C.iz1 + 0.5 + k * 0.2; g.tube([[x, 0.55, z], [x, 1.67, z]], 0.008, { segs: 3, caps: false }); }
    g.mat('weave', sx > 0 ? '#6b8f4e' : '#3b4a7a'); g.box(x - sx * 0.32, 0.5, C.iz1 + 0.6, x - sx * 0.04, 0.85, C.iz1 + 1.1, { bevel: 0.06 });
    g.mat('weave', '#b8a27a');
  }
  if (o.seats !== false) {
    let k = 0;
    for (const sx of [-1, 1]) for (const ax of [0.97, 1.62, 2.27]) drawSeat(g, sx * ax, C.iz1 + 0.47, CUSHIONS[(k++ + (o.seed || 0)) % CUSHIONS.length]);
  }
}
// Boxes a car needs to collide, in the frame, for a car whose aft-face centre is at (cx, cy, za).
export function carSolids(cx, cy, za) {
  const C = CAR, z0 = za + C.iz0, z1 = za + C.iz1, Z = za - C.d;
  return [
    [cx - C.hx, cy, z0, cx - C.door, cy + C.top + 0.4, za], [cx + C.door, cy, z0, cx + C.hx, cy + C.top + 0.4, za],
    [cx - C.hx, cy, Z, cx - C.ix, cy + C.top + 0.4, z0], [cx + C.ix, cy, Z, cx + C.hx, cy + C.top + 0.4, z0],
    [cx - C.ix, cy, Z, cx + C.ix, cy + C.top + 0.4, z1],
    [cx - C.ix, cy + C.ih, z1, cx + C.ix, cy + C.top + 0.4, z0],
    [cx - C.ix, cy - 0.6, z1, cx + C.ix, cy, za + 0.2],
    [cx - C.ix, cy, z1, cx - 0.66, cy + 0.47, z1 + 0.72], [cx + 0.66, cy, z1, cx + C.ix, cy + 0.47, z1 + 0.72],
  ];
}

// ---------------------------------------------------------------------------------------------------------------
// Props for the platform
// ---------------------------------------------------------------------------------------------------------------

// A double-armed lamp standard. The light is added by the caller. p: { h, metal }
defineProp('platform.standard', (g, p) => {
  const h = p.h || 5.2, metal = p.metal || PAL.teal;
  g.mat('cast', metal);
  g.lathe(0, 0, [[0.27, 0], [0.27, 0.1], [0.22, 0.16], [0.2, 0.3], [0.15, 0.42], [0.12, 0.62], [0.1, h - 0.7], [0.13, h - 0.6], [0.1, h - 0.48], [0.075, h + 0.02]], { segs: 14 });
  g.mat('cast', PAL.brass, { rough: -0.2 }); g.cyl(0, 0.62, 0, 0.13, 0.05, { segs: 12 }); g.cyl(0, h - 0.64, 0, 0.145, 0.05, { segs: 12 }); g.ball(0, h + 0.09, 0, 0.075, 0.1, 0.075, { segs: 10, rings: 6 });
  g.mat('cast', metal);
  for (const sx of [-1, 1]) {
    g.tube([[0, h - 0.4, 0], [sx * 0.3, h - 0.22, 0], [sx * 0.62, h - 0.2, 0], [sx * 0.78, h - 0.3, 0], [sx * 0.8, h - 0.42, 0]], 0.034, { segs: 6 });
    g.tube([[0, h - 0.8, 0], [sx * 0.3, h - 0.5, 0], [sx * 0.55, h - 0.24, 0]], 0.02, { segs: 5 });
    g.cyl(sx * 0.8, h - 0.5, 0, 0.13, 0.08, { segs: 12, r1: 0.05 });
  }
  g.mat('diffuser', '#fff0d4', { emissive: 5, lamp: true }); for (const sx of [-1, 1]) g.ball(sx * 0.8, h - 0.68, 0, 0.17, 0.19, 0.17, { segs: 12, rings: 8 });
  // a bracket for a festival flag
  g.mat('cast', metal); g.tube([[0, h - 1.5, 0], [0, h - 1.5, 0.75]], 0.022, { segs: 5 });
  return { posts: [[0, 0, 0.27, 0, h]], tier: 's' };
});

// A hand lamp hanging from a hook (the hook at y = 0, the lamp below). p: { c, lit }
defineProp('platform.handlamp', (g, p) => {
  g.mat('cast', '#3a332c'); g.tube([[0, 0, 0], [0, -0.03, 0.035], [0, -0.07, 0.04], [0, -0.1, 0]], 0.006, { segs: 4 });
  g.tube([[-0.05, -0.12, 0], [-0.05, -0.06, 0], [0, -0.03, 0], [0.05, -0.06, 0], [0.05, -0.12, 0]], 0.006, { segs: 4 });
  g.mat('cast', p.metal || PAL.brass, { rough: -0.1 }); g.cyl(0, -0.13, 0, 0.055, 0.02, { segs: 10, r1: 0.03 }); g.cyl(0, -0.31, 0, 0.065, 0.025, { segs: 10 });
  g.mat('diffuser', p.c || '#f2c879', p.lit ? { emissive: 2.2 } : { rough: -0.2 });
  g.lathe(0, 0, [[0.05, -0.3], [0.062, -0.27], [0.064, -0.19], [0.05, -0.14]], { segs: 10 });
  g.mat('cast', p.metal || PAL.brass); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; g.tube([[Math.cos(a) * 0.066, -0.3, Math.sin(a) * 0.066], [Math.cos(a) * 0.066, -0.14, Math.sin(a) * 0.066]], 0.004, { segs: 3, caps: false }); }
  g.mat('paper', p.tag || '#efe6d2'); g.box(0.02, -0.2, 0.066, 0.075, -0.16, 0.07);
  return { cast: false };
});

// A traveller's duffel bag. p: { c }
defineProp('platform.bag', (g, p) => {
  g.mat('weave', p.c || '#6c4a2e'); g.push(); g.rotZ(Math.PI / 2); g.lathe(0, 0, [[0, -0.32], [0.13, -0.31], [0.16, -0.24], [0.17, 0.0], [0.16, 0.24], [0.13, 0.31], [0, 0.32]], { segs: 12 }); g.pop();
  g.mat('leather', '#3a2618'); for (const x of [-0.18, 0.18]) g.tube([[x, 0.0, 0.17], [x, 0.17, 0.1], [x, 0.25, 0.0], [x, 0.17, -0.1], [x, 0.0, -0.17]], 0.012, { segs: 4, caps: false });
  g.tube([[-0.32, 0.12, 0], [-0.1, 0.4, 0], [0.1, 0.4, 0], [0.32, 0.12, 0]], 0.01, { segs: 4 });
  g.mat('weave', '#d9a441'); g.box(-0.02, 0.05, 0.155, 0.12, 0.13, 0.17);
  return { solid: [[-0.33, 0, -0.17, 0.33, 0.34, 0.17]], cast: true };
});

// A freight trolley with sealed produce crates. p: { n }
defineProp('platform.trolley', (g, p) => {
  g.mat('cast', '#3d4244'); g.box(-1.1, 0.22, -0.5, 1.1, 0.3, 0.5, { bevel: 0.02 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.box(sx * 0.95 - 0.03, 0.06, sz * 0.4 - 0.03, sx * 0.95 + 0.03, 0.22, sz * 0.4 + 0.03); g.push(); g.move(sx * 0.95, 0.09, sz * 0.4); g.rotZ(Math.PI / 2); g.mat('speckle', '#222'); g.cyl(0, -0.03, 0, 0.09, 0.06, { segs: 10 }); g.pop(); g.mat('cast', '#3d4244'); }
  g.tube([[1.1, 0.3, -0.42], [1.25, 1.0, -0.42], [1.25, 1.0, 0.42], [1.1, 0.3, 0.42]], 0.025, { segs: 6 });
  g.mat('wood', '#8a6a44'); g.box(-1.08, 0.3, -0.48, 1.08, 0.33, 0.48, { faces: 'Y' });
  const r = new Rng(hashStr('trolley' + (p.n || 0))); const cols = ['#e6e1d3', '#d4dfd8', '#e0d6c0'];
  let n = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < (i === 2 ? 1 : 2); j++) {
    const x = -0.72 + i * 0.7 + r.f(-0.04, 0.04), y = 0.33 + j * 0.38, c = cols[(n++) % 3];
    g.mat('paint', c); g.box(x - 0.33, y, -0.42, x + 0.33, y + 0.36, 0.42, { bevel: 0.025 });
    g.mat('paint', '#2f6f73'); g.box(x - 0.335, y + 0.24, -0.425, x + 0.335, y + 0.29, 0.425, { faces: 'xXzZ' });
    g.mat('paint', '#c9552e'); g.box(x + 0.12, y + 0.08, 0.42, x + 0.26, y + 0.18, 0.426, { faces: 'Z' });
  }
  return { solid: [[-1.1, 0, -0.5, 1.25, 1.1, 0.5]], tier: 's' };
});

// Crew lockers, three doors, names chalked on. p: { c }
defineProp('platform.lockers', (g, p) => {
  const c = p.c || '#5b7a6e';
  g.mat('paint', c); g.box(-0.9, 0.08, -0.25, 0.9, 1.9, 0.25, { bevel: 0.01 });
  g.mat('paint', '#2a2d2e'); g.box(-0.88, 0, -0.23, 0.88, 0.08, 0.2);
  for (let i = 0; i < 3; i++) {
    const x = -0.6 + i * 0.6; g.mat('paint', shadeHex(c, 1.1 - i * 0.07)); g.box(x - 0.27, 0.14, 0.25, x + 0.27, 1.84, 0.27, { bevel: 0.008 });
    g.mat('paint', '#1f2324'); for (let k = 0; k < 4; k++) g.box(x - 0.12, 1.55 + k * 0.05, 0.27, x + 0.12, 1.57 + k * 0.05, 0.274, { faces: 'Z' });
    g.mat('cast', PAL.brass); g.box(x + 0.18, 0.95, 0.27, x + 0.21, 1.1, 0.29);
    g.mat('paper', '#efe6d2'); g.box(x - 0.1, 1.3, 0.27, x + 0.1, 1.38, 0.274, { faces: 'Z' });
  }
  return { solid: [[-0.9, 0, -0.25, 0.9, 1.9, 0.27]], tier: 's' };
});

// An A-frame stepladder. p: { h }
defineProp('platform.ladder', (g, p) => {
  const h = p.h || 2.4; g.mat('paint', '#c08a2e');
  for (const sx of [-1, 1]) { g.box(sx * 0.25 - 0.025, 0, 0.35, sx * 0.25 + 0.025, h, 0.0, { faces: 'xXyY' }); }
  for (const sx of [-1, 1]) g.tube([[sx * 0.25, 0, 0.45], [sx * 0.25, h, 0.02]], 0.022, { segs: 5 });
  for (const sx of [-1, 1]) g.tube([[sx * 0.25, 0, -0.55], [sx * 0.24, h - 0.05, -0.04]], 0.022, { segs: 5 });
  g.mat('wood', '#8a6a44'); const n = Math.round(h / 0.3);
  for (let i = 1; i < n; i++) { const t = i / n; g.box(-0.25, t * h - 0.02, 0.45 - 0.43 * t - 0.07, 0.25, t * h + 0.01, 0.45 - 0.43 * t + 0.05, { bevel: 0.005 }); }
  g.box(-0.28, h, -0.1, 0.28, h + 0.05, 0.12, { bevel: 0.01 });
  return { solid: [[-0.3, 0, -0.55, 0.3, h, 0.45]], tier: 's' };
});

// A safety cone.
defineProp('platform.cone', (g) => {
  g.mat('paint', '#2a2a2a'); g.box(-0.18, 0, -0.18, 0.18, 0.04, 0.18, { bevel: 0.01 });
  g.mat('paint', '#e0662c'); g.lathe(0, 0, [[0.15, 0.04], [0.11, 0.25], [0.085, 0.36], [0.045, 0.55], [0.0, 0.57]], { segs: 12 });
  g.mat('paint', '#f2efe6'); g.lathe(0, 0, [[0.103, 0.27], [0.091, 0.34]], { segs: 12, capBottom: false, capTop: false });
  return { posts: [[0, 0, 0.16, 0, 0.55]] };
});

// A bin with a lid and a brass rim.
defineProp('platform.bin', (g, p) => {
  g.mat('paint', p.c || PAL.teal); g.lathe(0, 0, [[0.2, 0], [0.22, 0.05], [0.22, 0.85], [0.2, 0.88]], { segs: 14 });
  g.mat('cast', PAL.brass); g.cyl(0, 0.85, 0, 0.235, 0.04, { segs: 14 }); g.mat('paint', shadeHex(p.c || PAL.teal, 0.7)); g.lathe(0, 0, [[0.23, 0.89], [0.18, 0.96], [0.06, 0.99], [0, 1.0]], { segs: 14 });
  return { posts: [[0, 0, 0.23, 0, 1.0]], tier: 's' };
});

// A drinking fountain: water is the one thing nobody carries.
defineProp('platform.fountain', (g) => {
  g.mat('stone', '#bdb3a0'); g.lathe(0, 0, [[0.28, 0], [0.26, 0.08], [0.16, 0.18], [0.13, 0.75], [0.3, 0.86], [0.32, 0.92], [0.27, 0.94]], { segs: 16 });
  g.mat('cast', PAL.brass, { rough: -0.2 }); g.tube([[0, 0.9, 0], [0, 1.02, 0.02], [0, 1.04, 0.1]], 0.02, { segs: 6 }); g.cyl(0.18, 0.86, 0, 0.03, 0.06, { segs: 8 });
  g.mat('plain', '#2f6f7a', { rough: -0.5 }); g.cyl(0, 0.9, 0, 0.24, 0.005, { segs: 14 });
  return { posts: [[0, 0, 0.3, 0, 0.95]], tier: 's' };
});

// A coil of bunting and a crate of flags, waiting to go up.
defineProp('platform.flagcrate', (g) => {
  g.mat('wood', '#a8865a'); g.box(-0.35, 0, -0.25, 0.35, 0.35, 0.25, { bevel: 0.01 });
  const cols = ['#c9552e', '#e7b547', '#2f6f73', '#e9e2d0', '#8a2f3c', '#6b8f4e'];
  for (let i = 0; i < 9; i++) { g.mat('weave', cols[i % cols.length]); const x = -0.28 + (i % 5) * 0.14, z = -0.15 + Math.floor(i / 5) * 0.2; g.box(x - 0.06, 0.3, z - 0.07, x + 0.06, 0.42 + (i % 3) * 0.03, z + 0.07, { bevel: 0.02 }); }
  g.mat('weave', '#d8cdb8'); for (let k = 0; k < 4; k++) { const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ring.push([0.62 + Math.cos(a) * (0.2 - k * 0.02), 0.02 + k * 0.025, Math.sin(a) * (0.2 - k * 0.02)]); } g.tube(ring, 0.012, { segs: 4, closed: true }); }
  return { solid: [[-0.35, 0, -0.25, 0.35, 0.42, 0.25]] };
});

// A toolbox. p: { c }
defineProp('platform.toolbox', (g, p) => {
  g.mat('paint', p.c || '#a8432e'); g.box(-0.28, 0, -0.12, 0.28, 0.22, 0.12, { bevel: 0.015 }); g.mat('paint', shadeHex(p.c || '#a8432e', 0.8)); g.box(-0.28, 0.22, -0.12, 0.28, 0.27, 0.12, { bevel: 0.01 });
  g.mat('cast', '#2a2a2a'); g.tube([[-0.12, 0.27, 0], [-0.1, 0.34, 0], [0.1, 0.34, 0], [0.12, 0.27, 0]], 0.012, { segs: 5 });
  return { solid: [[-0.28, 0, -0.12, 0.28, 0.3, 0.12]] };
});

// A drop pipe from the overhead run to the deck, with a hand-wheel valve and a gauge, against a wall at z = 0 (front +z).
// p: { h (top), c (colour), r }
defineProp('platform.droppipe', (g, p) => {
  const h = p.h || 6.3, r = p.r || 0.075, c = p.c || '#a8432e', z = r + 0.06;
  g.mat('cast', c); g.tube([[0, 0, z], [0, h, z]], r, { segs: 10, caps: false });
  g.mat('cast', '#3a3f41');
  for (const y of [0.0, 2.6, 4.6, h - 0.3]) g.cyl(0, y, z, r + 0.03, 0.06, { segs: 10 });
  for (const y of [1.1, 3.4, 5.4]) { g.box(-0.05, y - 0.03, 0, 0.05, y + 0.03, z); g.tube([[-r - 0.01, y, z], [0, y, z + r + 0.01], [r + 0.01, y, z]], 0.012, { segs: 4 }); }
  // the valve and its hand wheel
  g.cyl(0, 1.25, z, r + 0.05, 0.22, { segs: 10 }); g.tube([[0, 1.36, z], [0, 1.36, z + 0.24]], 0.02, { segs: 6 });
  g.mat('paint', '#c9302c'); const ring = []; for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; ring.push([Math.cos(a) * 0.17, 1.36 + Math.sin(a) * 0.17, z + 0.24]); } g.tube(ring, 0.018, { segs: 5, closed: true });
  for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2 + 0.3; g.tube([[0, 1.36, z + 0.24], [Math.cos(a) * 0.17, 1.36 + Math.sin(a) * 0.17, z + 0.24]], 0.01, { segs: 4 }); }
  // the gauge
  g.mat('cast', PAL.brass); g.tube([[0, 1.75, z + r], [0, 1.75, z + r + 0.12]], 0.012, { segs: 5 }); g.push(); g.move(0, 1.75, z + r + 0.14); g.rotX(Math.PI / 2); g.cyl(0, -0.03, 0, 0.08, 0.04, { segs: 14 }); g.pop();
  g.mat('paint', '#f2ede0'); g.push(); g.move(0, 1.75, z + r + 0.181); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.068, 0.002, { segs: 14 }); g.pop();
  g.mat('paint', '#c9302c'); g.box(-0.004, 1.75, z + r + 0.184, 0.004, 1.81, z + r + 0.186, { faces: 'Z' });
  return { posts: [[0, z, r + 0.05, 0, 2.2]], tier: 's' };
});

// A first-aid cabinet on the wall (front +z), the cross in white.
defineProp('platform.aidbox', (g) => {
  g.mat('paint', '#a8302a'); g.box(-0.32, 1.1, 0, 0.32, 1.9, 0.18, { bevel: 0.015 });
  g.mat('paint', '#8a2622'); g.box(-0.3, 1.12, 0.18, 0.3, 1.88, 0.19, { faces: 'Z' });
  g.mat('paint', '#f2ede0'); g.box(-0.05, 1.33, 0.19, 0.05, 1.67, 0.194, { faces: 'Z' }); g.box(-0.17, 1.45, 0.19, 0.17, 1.55, 0.194, { faces: 'Z' });
  g.mat('cast', PAL.brass); g.box(0.24, 1.42, 0.19, 0.27, 1.58, 0.22);
  return { solid: [[-0.32, 1.1, 0, 0.32, 1.9, 0.2]], tier: 'd', cast: false };
});

// The cab call post: a brass column with one big button.
defineProp('platform.callpost', (g) => {
  g.mat('cast', PAL.tealDark); g.lathe(0, 0, [[0.2, 0], [0.2, 0.06], [0.12, 0.12], [0.08, 0.2], [0.07, 0.95], [0.1, 1.0], [0.1, 1.08]], { segs: 14 });
  g.mat('cast', PAL.brass, { rough: -0.25 }); g.box(-0.13, 1.0, -0.1, 0.13, 1.22, 0.1, { bevel: 0.02 });
  g.mat('diffuser', '#ffd27a', { emissive: 3, lamp: true }); g.push(); g.move(0, 1.12, 0.1); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.045, 0.02, { segs: 12 }); g.pop();
  g.mat('cast', PAL.brass); g.push(); g.move(0, 1.12, -0.1); g.rotX(-Math.PI / 2); g.cyl(0, 0, 0, 0.045, 0.02, { segs: 12 }); g.pop();
  return { posts: [[0, 0, 0.2, 0, 1.22]], tier: 's' };
});
