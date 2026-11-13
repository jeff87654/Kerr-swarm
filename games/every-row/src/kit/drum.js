// The shape every world shares: a nation drum, and how to stand things on the inside of it.
//
// World axes: the drum's axis is +z, from the front end wall (z = 0, the power end) to the back (z = L, the heat end).
// A point is (r cos a, r sin a, z). "Up" is toward the axis. Spinward is the way the angle a grows.
// A local frame at a spot on a floor has x = spinward, y = up, z = toward the back: right-handed, so things are
// modelled flat as on any ground and then bent or stood on the drum.
import { Vector3, Matrix4, Quaternion } from 'three';

export const DRUM = {
  R: 3000,          // rim radius, m (1 g)
  L: 3750,          // length, m
  RH: 1500,         // the Hollow's floor radius (0.5 g)
  DECK: 4,          // metres between decks
  DECKS: 376,
  OMEGA: 0.0572,    // rad/s: one turn in 110 s
  SUN0: 450,        // the lit sunline stops this far short of each end wall
  SPINDLE: 75,      // flying country: under 3% of a g
  CELL: 24500,      // spacing of drums on the raft
  QUAY: 3050,       // radius of the quay band outside jacket and moat
};
// radius of deck n (1 is the rim, 376 the Hollow floor)
export const deckRadius = (n) => DRUM.R - DRUM.DECK * (n - 1);
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

// A point on the drum from its angle (radians), its distance along the axis, and its radius.
export function cyl(a, z, r, out = new Vector3()) { return out.set(r * Math.cos(a), r * Math.sin(a), z); }
// The same from a height above a floor: h metres up from the floor of radius floorR.
export function above(a, z, h, floorR = DRUM.RH, out = new Vector3()) { return cyl(a, z, floorR - h, out); }
// Which way is up at a point (toward the axis).
export function upAt(p, out = new Vector3()) { out.set(-p.x, -p.y, 0); return out.lengthSq() < 1e-9 ? out.set(0, 1, 0) : out.normalize(); }
// Spinward at a point.
export function spinAt(p, out = new Vector3()) { out.set(-p.y, p.x, 0); return out.lengthSq() < 1e-9 ? out.set(1, 0, 0) : out.normalize(); }
export function angleOf(p) { return Math.atan2(p.y, p.x); }
export function radiusOf(p) { return Math.hypot(p.x, p.y); }

// The matrix that stands a flat-modelled thing at angle a, distance z, on a floor of radius floorR, h metres above it,
// turned by yaw about its own up axis, and scaled.
const _x = new Vector3(), _y = new Vector3(), _z = new Vector3(), _p = new Vector3(), _m = new Matrix4(), _q = new Quaternion(), _s = new Vector3();
export function standAt(a, z, opts = {}, out = new Matrix4()) {
  const floorR = opts.floorR === undefined ? DRUM.RH : opts.floorR, h = opts.h || 0, yaw = opts.yaw || 0;
  const c = Math.cos(a), s = Math.sin(a);
  _x.set(-s, c, 0); _y.set(-c, -s, 0); _z.set(0, 0, 1);
  out.makeBasis(_x, _y, _z);
  if (yaw) { _m.makeRotationY(yaw); out.multiply(_m); }
  const sc = opts.scale;
  if (sc !== undefined) { if (typeof sc === 'number') _s.set(sc, sc, sc); else _s.set(sc[0], sc[1], sc[2]); out.scale(_s); }
  const r = floorR - h;
  out.setPosition(r * c, r * s, z);
  return out;
}

// A frame for bending flat geometry onto a floor: local (x, y, z) -> drum.
//   a0, z0: where the local origin sits; floorR: the floor's radius.
export function makeFrame(a0, z0, floorR = DRUM.RH) {
  return {
    a0, z0, floorR,
    // local point -> world
    point(x, y, z, out = new Vector3()) { const a = a0 + x / floorR, r = floorR - y; return out.set(r * Math.cos(a), r * Math.sin(a), z0 + z); },
    // local direction at local x -> world
    dir(x, dx, dy, dz, out = new Vector3()) { const a = a0 + x / floorR, c = Math.cos(a), s = Math.sin(a); return out.set(-s * dx - c * dy, c * dx - s * dy, dz); },
    // world -> local
    local(p, out = new Vector3()) { let a = Math.atan2(p.y, p.x) - a0; a = ((a + Math.PI) % TAU + TAU) % TAU - Math.PI; return out.set(a * floorR, floorR - Math.hypot(p.x, p.y), p.z - z0); },
    stand(x, z, opts = {}, out = new Matrix4()) { return standAt(a0 + x / floorR, z0 + z, { ...opts, floorR }, out); },
  };
}

// Arc length round a floor for an angle, and back.
export const arc = (a, floorR = DRUM.RH) => a * floorR;
export const ang = (s, floorR = DRUM.RH) => s / floorR;

// The sunline's light on a patch of floor facing the axis, as a fraction of mid-floor (raft-habitat.md's model:
// each metre of line shines like a lambertian rod, and the lit part stops SUN0 short of each wall).
export function floorLight(z, D = DRUM.RH) {
  const F = (a) => (a * D) / (D * D + a * a) + Math.atan(a / D);
  const mid = 2 * F((DRUM.L - 2 * DRUM.SUN0) / 2);
  return (F(DRUM.L - DRUM.SUN0 - z) - F(DRUM.SUN0 - z)) / mid * (DRUM.RH / D);
}
