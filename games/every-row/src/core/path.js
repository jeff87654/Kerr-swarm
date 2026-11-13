// Camera paths. A world gives a handful of keys (where the camera is, what it looks at, when) and gets back a smooth
// flight that starts moving straight ahead through its entry and ends moving straight through its exit, at speeds in
// proportion to the size of each opening. That proportion is what lets a crossing between two worlds of very different
// sizes (a hall and a Hollow) carry no jolt: the engine scales one opening onto the other.
//
// With opts.frame the keys are given in the flat model (x = arc metres, y = height, z = along the axis) and the flight
// is bent onto the drum with everything else, so "fly level along this street" follows the floor as it curves up.
import { Vector3, Quaternion, Matrix4 } from 'three';
import { clamp, smootherstep } from './rng.js';

const V = (a) => (a && a.isVector3 ? a.clone() : new Vector3(a[0], a[1], a[2]));
const _m = new Matrix4(), _q = new Quaternion(), _q2 = new Quaternion(), _f = new Vector3(), _u = new Vector3(), _r = new Vector3(), _t = new Vector3();

// Openings crossed per second: speed through an opening = CROSS * its radius.
export const CROSS = 1.15;

function hermite(out, p0, m0, p1, m1, u, h) {
  const u2 = u * u, u3 = u2 * u;
  const a = 2 * u3 - 3 * u2 + 1, b = (u3 - 2 * u2 + u) * h, c = -2 * u3 + 3 * u2, d = (u3 - u2) * h;
  return out.set(a * p0.x + b * m0.x + c * p1.x + d * m1.x, a * p0.y + b * m0.y + c * p1.y + d * m1.y, a * p0.z + b * m0.z + c * p1.z + d * m1.z);
}

// Velocities at each key for a C1 spline through points at uneven times.
function tangents(pts, ts, v0, v1) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const m = new Vector3();
    if (i === 0) { if (v0) m.copy(v0); else m.subVectors(pts[1], pts[0]).divideScalar(ts[1] - ts[0]); }
    else if (i === n - 1) { if (v1) m.copy(v1); else m.subVectors(pts[n - 1], pts[n - 2]).divideScalar(ts[n - 1] - ts[n - 2]); }
    else {
      const ha = ts[i] - ts[i - 1], hb = ts[i + 1] - ts[i];
      const da = new Vector3().subVectors(pts[i], pts[i - 1]).divideScalar(ha);
      const db = new Vector3().subVectors(pts[i + 1], pts[i]).divideScalar(hb);
      m.copy(da).multiplyScalar(hb / (ha + hb)).addScaledVector(db, ha / (ha + hb));
    }
    out.push(m);
  }
  return out;
}

export function quatLook(out, fwd, up) {
  // a camera looks down its own -z; build the turn that points -z along fwd with y near up
  _f.copy(fwd).normalize();
  _r.crossVectors(_f, up);
  if (_r.lengthSq() < 1e-8) { _r.set(1, 0, 0).cross(_f); if (_r.lengthSq() < 1e-8) _r.set(0, 1, 0).cross(_f); }
  _r.normalize();
  _u.crossVectors(_r, _f);
  _m.makeBasis(_r, _u, _t.copy(_f).negate());
  return out.setFromRotationMatrix(_m);
}

/**
 * keys: [{ t, p, look?, up?, fov?, roll? }, ...] with t in seconds, rising, the first at 0.
 *   p     where the camera is (Vector3 or [x, y, z])
 *   look  the point it looks at (default: straight ahead along the flight)
 *   up    which way is up at this key, a direction in the same space as p (default: opts.up)
 *   fov   vertical field of view, degrees (default opts.fov or 58)
 *   roll  radians about the line of sight
 * opts:
 *   frame        a frame from makeFrame(): keys are flat and the flight is bent onto the drum
 *   up           'drum' (toward the axis from wherever the camera is; the default) or a Vector3 / [x,y,z] in drum space
 *   entryRadius  size of the opening the flight begins in (sets the starting speed)
 *   exitRadius   size of the opening it ends in (sets the finishing speed)
 *   entryDir     starting direction (default: toward the second key)      exitDir   finishing direction
 *   align        seconds over which the view swings from / to straight ahead at each end (default 2.2)
 *   tail         seconds of flight kept beyond the exit opening (default 0.8)
 */
export function makePath(keys, opts = {}) {
  const n = keys.length;
  if (n < 2) throw new Error('a path needs at least two keys');
  const ts = keys.map((k) => k.t);
  if (ts[0] !== 0) throw new Error('the first path key must be at t = 0');
  for (let i = 1; i < n; i++) if (!(ts[i] > ts[i - 1])) throw new Error('path key times must rise: key ' + i);
  const frame = opts.frame || null;
  const pts = keys.map((k) => V(k.p));
  const entryRadius = opts.entryRadius || 10, exitRadius = opts.exitRadius || 10;
  const align = opts.align === undefined ? 2.2 : opts.align;
  const tail = opts.tail === undefined ? 0.8 : opts.tail;
  const d0 = opts.entryDir ? V(opts.entryDir).normalize() : new Vector3().subVectors(pts[1], pts[0]).normalize();
  const d1 = opts.exitDir ? V(opts.exitDir).normalize() : new Vector3().subVectors(pts[n - 1], pts[n - 2]).normalize();
  const tan = tangents(pts, ts, d0.clone().multiplyScalar(CROSS * entryRadius), d1.clone().multiplyScalar(CROSS * exitRadius));
  const looks = keys.map((k) => (k.look ? V(k.look) : null));
  for (let i = 0; i < n; i++) if (!looks[i]) { const sp = Math.max(tan[i].length(), 1e-3); looks[i] = pts[i].clone().addScaledVector(tan[i], Math.max(60 / sp, 1.5)); }
  const ltan = tangents(looks, ts, null, null);
  const fovs = keys.map((k) => k.fov || opts.fov || 58);
  const rolls = keys.map((k) => k.roll || 0);
  const upOpt = opts.up === undefined || opts.up === 'drum' ? 'drum' : V(opts.up).normalize();
  const ups = keys.map((k) => (k.up ? V(k.up).normalize() : null));
  const duration = ts[n - 1];
  const tCross = duration - tail;

  const seg = (t) => { let lo = 0, hi = n - 2; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ts[mid] <= t) lo = mid; else hi = mid - 1; } return lo; };
  const fp = new Vector3(), fl = new Vector3(), wp = new Vector3(), wl = new Vector3(), wv = new Vector3(), up_ = new Vector3(), dir_ = new Vector3(), a_ = new Vector3(), b_ = new Vector3();

  // position in the model's own space (flat if framed)
  function flat(t, out = new Vector3()) { t = clamp(t, 0, duration); const i = seg(t), h = ts[i + 1] - ts[i]; return hermite(out, pts[i], tan[i], pts[i + 1], tan[i + 1], (t - ts[i]) / h, h); }
  function world(t, out) { flat(t, out); return frame ? frame.point(out.x, out.y, out.z, out) : out; }

  function sample(t, out) {
    t = clamp(t, 0, duration);
    const i = seg(t), h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, s = u * u * (3 - 2 * u);
    hermite(fp, pts[i], tan[i], pts[i + 1], tan[i + 1], u, h);
    hermite(fl, looks[i], ltan[i], looks[i + 1], ltan[i + 1], u, h);
    if (frame) { frame.point(fp.x, fp.y, fp.z, wp); frame.point(fl.x, fl.y, fl.z, wl); } else { wp.copy(fp); wl.copy(fl); }
    // velocity on the drum, by difference
    const e = 0.02; world(Math.min(t + e, duration), a_); world(Math.max(t - e, 0), b_);
    wv.subVectors(a_, b_).divideScalar(Math.min(t + e, duration) - Math.max(t - e, 0));
    // up
    if (ups[i] && ups[i + 1]) { up_.copy(ups[i]).lerp(ups[i + 1], s).normalize(); if (frame) frame.dir(fp.x, up_.x, up_.y, up_.z, up_); }
    else if (upOpt === 'drum') { up_.set(-wp.x, -wp.y, 0); if (up_.lengthSq() < 1e-4) up_.set(0, 1, 0); up_.normalize(); }
    else up_.copy(upOpt);
    dir_.subVectors(wl, wp);
    if (dir_.lengthSq() < 1e-6) dir_.copy(wv);
    quatLook(_q, dir_, up_);
    // at both ends the camera faces the way it is going
    const w = Math.max(1 - smootherstep(0, align, t), 1 - smootherstep(0, align, tCross - t));
    if (w > 0 && wv.lengthSq() > 1e-8) { quatLook(_q2, wv, up_); _q.slerp(_q2, clamp(w, 0, 1)); }
    const roll = rolls[i] + (rolls[i + 1] - rolls[i]) * s;
    if (roll) { _q2.setFromAxisAngle(_t.set(0, 0, 1), roll); _q.multiply(_q2); }
    out.pos.copy(wp); out.quat.copy(_q); out.fov = fovs[i] + (fovs[i + 1] - fovs[i]) * s;
    if (out.vel) out.vel.copy(wv);
    return out;
  }

  const tmp = { pos: new Vector3(), quat: new Quaternion(), fov: 58, vel: new Vector3() };
  sample(0, tmp);
  const entry = { pos: tmp.pos.clone(), quat: tmp.quat.clone(), radius: entryRadius, fov: tmp.fov };
  sample(tCross, tmp);
  const exit = { pos: tmp.pos.clone(), quat: tmp.quat.clone(), radius: exitRadius, fov: tmp.fov, flat: flat(tCross) };

  return {
    duration, tCross, sample, entry, exit, keys, frame, flat,
    /** the flight as a list of points every `step` seconds: in the model's space (flat) by default, on the drum with world = true */
    points(step = 0.5, inWorld = false) { const a = []; for (let t = 0; t <= duration; t += step) a.push(inWorld ? world(t, new Vector3()) : flat(t)); return a; },
  };
}

/** distance from a flat point (x, z) to the nearest of a list of flat points, ignoring height; wraps in x with period wrap if given */
export function nearPath(points, x, z, wrap = 0) {
  let best = 1e18;
  for (let i = 0; i < points.length; i++) {
    let dx = points[i].x - x; if (wrap) { dx = ((dx % wrap) + wrap * 1.5) % wrap - wrap / 2; }
    const dz = points[i].z - z, d = dx * dx + dz * dz;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}
