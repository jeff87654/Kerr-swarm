// The drum's geometry and physics, and the coordinate systems the whole game shares.
//
// DRUM COORDINATES (cylindrical, the one true address of anything): theta (radians, increasing spinward),
//   rho (metres from the axis; bigger = further "down"), z (metres along the axis: 0 = front cap, 3750 = back cap).
//
// A FRAME is a flat working space for one deck or terrace: x = metres spinward (measured at the frame's own radius),
//   y = metres up (toward the axis), z = metres toward the back. Geometry, collision and people all live in a frame.
//   theta = theta0 + x / rho0, rho = rho0 - y, z_drum = z0 + z. Right-handed: x cross y = z.
//
// RENDER SPACE is what the GPU sees: a Cartesian frame centred on the camera's anchor (its own drum coordinates), with +Y
//   along the anchor's up. Everything is bent into it (in the vertex shader, or by cylToRender here), so floors really curve.
import { wrapPi } from './util.js';

export const DRUM = {
  R: 3000,            // rim radius, m
  L: 3750,            // length, m
  HOLLOW_R: 1500,     // radius of the Hollow's floor
  OMEGA: 0.05718,     // rad/s (one turn every 110 s); OMEGA^2 * R = 9.81
  G0: 9.81,
  DECK: 4,            // deck pitch, m
  RING: 3750 / 9,     // one Ring: 417 m of axis
  SUN_Z0: 450, SUN_Z1: 3300,   // the lit part of the sunline
};

export function deckRadius(n) { return DRUM.R - DRUM.DECK * (n - 1); }       // floor radius of deck n (deck 1 = the rim)
export function deckOf(rho) { return Math.round((DRUM.R - rho) / DRUM.DECK) + 1; }
export function gAt(rho) { return rho / DRUM.R; }                             // weight there, in g
export function ringOf(z) { return Math.max(1, Math.min(9, Math.floor(z / DRUM.RING) + 1)); }
export const RING_NAMES = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

export class Frame {
  constructor(id, rho0, theta0 = 0, z0 = 0) { this.id = id; this.rho0 = rho0; this.theta0 = theta0; this.z0 = z0; }
  theta(x) { return this.theta0 + x / this.rho0; }
  rho(y) { return this.rho0 - y; }
  zd(z) { return this.z0 + z; }
  // flat (x,y,z) -> drum cyl, written into out {theta, rho, z}
  toCyl(x, y, z, out) { out.theta = this.theta0 + x / this.rho0; out.rho = this.rho0 - y; out.z = this.z0 + z; return out; }
  fromCyl(c, out) { out.x = wrapPi(c.theta - this.theta0) * this.rho0; out.y = this.rho0 - c.rho; out.z = c.z - this.z0; return out; }
  // weight (in g) of something standing at height y, moving spinward at vx (flat metres per second)
  weight(y, vx = 0) { const r = this.rho0 - y; const w = vx / this.rho0 + DRUM.OMEGA; return r * w * w / DRUM.G0; }
}

// Free motion in a frame's flat coordinates (exact for the spinning drum): writes [ax, ay] for a body at height y with
// velocity (vx, vy). az is always 0: along the axis nothing bends.
export function freeAccel(frame, y, vx, vy, out) {
  const r = frame.rho0 - y;
  const w = vx / frame.rho0 + DRUM.OMEGA;
  out[0] = 2 * frame.rho0 * vy * w / r;       // climbing pushes you spinward-ward of nothing: a falling thing drifts anti
  out[1] = -r * w * w;                        // weight: more when moving spinward, less going anti
  return out;
}

// drum cyl -> render space, relative to an anchor {theta, rho, z}. out is an array or Vector3-like (set via indices 0..2 or x,y,z).
export function cylToRender(theta, rho, z, anchor, out) {
  const d = wrapPi(theta - anchor.theta);
  const s = Math.sin(d), sh = Math.sin(0.5 * d);
  out.x = rho * s;
  out.y = (anchor.rho - rho) + rho * 2 * sh * sh;
  out.z = z - anchor.z;
  return out;
}
export function flatToRender(frame, x, y, z, anchor, out) {
  return cylToRender(frame.theta0 + x / frame.rho0, frame.rho0 - y, frame.z0 + z, anchor, out);
}
// render space -> drum cyl
export function renderToCyl(X, Y, Z, anchor, out) {
  const a = anchor.rho - Y;
  out.theta = anchor.theta + Math.atan2(X, a);
  out.rho = Math.hypot(X, a);
  out.z = Z + anchor.z;
  return out;
}
// The angle by which local "up" at drum angle theta is turned from the anchor's up (rotation about render Z).
export function tilt(theta, anchor) { return wrapPi(theta - anchor.theta); }

// How far a thing dropped from height h (m) lands antispinward, at radius r (the docs' formula).
export function dropDrift(h, r) { return Math.pow(2 * h, 1.5) / (3 * Math.sqrt(r)); }

// The sunline's light on a surface facing the axis, at axial position z and radius rho, relative to mid-floor (1.0).
export function sunlineFactor(z, rho = DRUM.HOLLOW_R) {
  const f = (zz) => { const u = (zz - z) / rho; return 0.5 * (u / (1 + u * u) + Math.atan(u)); };   // integral of rho^3/(rho^2+dz^2)^2 dz / rho... normalised below
  const k = (a, b) => f(b) - f(a);
  const mid = (() => { const zm = DRUM.L / 2; const g = (zz) => { const u = (zz - zm) / DRUM.HOLLOW_R; return 0.5 * (u / (1 + u * u) + Math.atan(u)); }; return g(DRUM.SUN_Z1) - g(DRUM.SUN_Z0); })();
  return (k(DRUM.SUN_Z0, DRUM.SUN_Z1) / mid) * (DRUM.HOLLOW_R / rho);
}
