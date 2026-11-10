// Many lights. Every lamp in the world is registered here in drum coordinates; each frame the visible ones are
// written to a float texture and assigned to view-space clusters, which the lighting pass walks per pixel.
//
// A light: { theta, rho, z, color:[r,g,b] linear, range, type, flags, radius, dir, end, box }
//   type   0 point · 1 spot · 2 tube (a line of light from the position to `end`)
//   flags  1 SHADOW (dimmed by the overhead room shadow map) · 2 NOSPEC (fill light, no highlights) · 4 LAMP (follows the
//          home-lamp level: dims in the lamp-night) · 8 NIGHT (only on at night) · 16 SUNLIT (follows the sunline's level)
//   box    optional clip volume {t0,t1,r0,r1,z0,z1,soft}: drum theta (absolute radians), rho and z. Light stops at its room's walls.
// Ambient volumes are separate: big soft boxes of hemisphere light (a room's bounce, an atrium's luminous ceiling).
import * as THREE from 'three';
import { wrapPi, clamp } from '../core/util.js';

export const LIGHT = { POINT: 0, SPOT: 1, TUBE: 2 };
export const LF = { SHADOW: 1, NOSPEC: 2, LAMP: 4, NIGHT: 8, SUNLIT: 16 };

export const CLUSTER = { X: 16, Y: 9, Z: 16, NEAR: 0.3, FAR: 260 };
const MAX_INDICES = 256 * 768;      // a lamp near the eye covers every tile of a dozen depth slices: leave room for many of them
const ROWS = 5;

export class LightSystem {
  constructor(maxActive = 256) {
    this.maxActive = maxActive;
    this.lights = [];            // live light objects (sparse: removed ones are null)
    this.free = [];
    this.ambients = [];
    this.active = [];            // this frame's lights
    this.count = 0;
    const nC = CLUSTER.X * CLUSTER.Y * CLUSTER.Z;
    this.lightData = new Float32Array(512 * ROWS * 4);
    this.lightTex = new THREE.DataTexture(this.lightData, 512, ROWS, THREE.RGBAFormat, THREE.FloatType);
    this.clusterData = new Float32Array(nC * 2);
    this.clusterTex = new THREE.DataTexture(this.clusterData, CLUSTER.X * CLUSTER.Y, CLUSTER.Z, THREE.RGFormat, THREE.FloatType);
    this.indexData = new Float32Array(MAX_INDICES);
    this.indexTex = new THREE.DataTexture(this.indexData, 256, MAX_INDICES / 256, THREE.RedFormat, THREE.FloatType);
    for (const t of [this.lightTex, this.clusterTex, this.indexTex]) {
      t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    }
    this._counts = new Uint16Array(nC);
    this._offsets = new Uint32Array(nC);
    this._rects = new Int16Array(512 * 6);
    this._frustum = new THREE.Frustum();
    this._sphere = new THREE.Sphere();
    this._v = new THREE.Vector3();
    this.levels = { lamps: 1, night: 1, sun: 1 };
    // ambient uniforms (up to 8 volumes)
    this.ambU = {
      uAmbCount: { value: 0 },
      uAmbSky: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
      uAmbGround: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
      uAmbMin: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
      uAmbMax: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
    };
  }

  add(l) {
    l.type = l.type || 0; l.flags = l.flags || 0; l.radius = l.radius || 0.05; l.on = l.on !== false; l.scale = 1;
    const i = this.free.length ? this.free.pop() : this.lights.length;
    this.lights[i] = l; l._i = i;
    return l;
  }
  remove(l) { if (l && this.lights[l._i] === l) { this.lights[l._i] = null; this.free.push(l._i); } }

  // { box:{t0,t1,r0,r1,z0,z1,soft}, sky:[r,g,b], ground:[r,g,b], flags: 1 = skylit (dimmed by the sky shadow map), 4 lamp, 16 sunlit, spec: 0..1 }
  addAmbient(a) { a.flags = a.flags || 0; a.spec = a.spec === undefined ? 1 : a.spec; a.scale = 1; this.ambients.push(a); return a; }
  removeAmbient(a) { const i = this.ambients.indexOf(a); if (i >= 0) this.ambients.splice(i, 1); }

  // anchor: camera drum coords {theta, rho, z}; viewRot: Matrix4 world->view (rotation only); proj: projection matrix
  update(anchor, camera, isVisible) {
    const L = this.lights, act = this.active; act.length = 0;
    const fr = this._frustum, sp = this._sphere, v = this._v;
    this._pv = this._pv || new THREE.Matrix4();
    this._pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    fr.setFromProjectionMatrix(this._pv);
    const FAR = CLUSTER.FAR, lv = this.levels;
    for (let i = 0; i < L.length; i++) {
      const l = L[i]; if (!l || !l.on) continue;
      if (isVisible && l.scope && !isVisible(l.scope)) continue;
      const dz = l.z - anchor.z; if (dz > FAR + l.range || dz < -FAR - l.range) continue;
      const dth = wrapPi(l.theta - anchor.theta);
      const arc = dth * l.rho; if (arc > FAR + l.range || arc < -FAR - l.range) continue;
      let k = l.scale;
      if (l.flags & LF.LAMP) k *= lv.lamps;
      if (l.flags & LF.NIGHT) k *= lv.night;
      if (l.flags & LF.SUNLIT) k *= lv.sun;
      if (k <= 0.003) continue;
      const s = Math.sin(dth), sh = Math.sin(0.5 * dth);
      const X = l.rho * s, Y = (anchor.rho - l.rho) + l.rho * 2 * sh * sh, Z = dz;
      const d2 = X * X + Y * Y + Z * Z;
      if (d2 > (FAR + l.range) * (FAR + l.range)) continue;
      v.set(X, Y, Z); sp.center.copy(v); sp.radius = l.range;
      if (l.type === 2 && l.end) { sp.radius += Math.hypot((wrapPi(l.end.theta - l.theta)) * l.rho, l.end.rho - l.rho, l.end.z - l.z); }
      if (!fr.intersectsSphere(sp)) continue;
      l._x = X; l._y = Y; l._z = Z; l._d2 = d2; l._k = k; l._dth = dth; l._r = sp.radius;
      const lum = (l.color[0] + l.color[1] + l.color[2]) * k;
      l._imp = lum * l.range * l.range / (d2 + 25);
      act.push(l);
    }
    if (act.length > this.maxActive) { act.sort((a, b) => b._imp - a._imp); act.length = this.maxActive; }
    this.count = act.length;
    this._write(anchor);
    this._cluster(camera);
    this._ambient(anchor);
  }

  _write(anchor) {
    const D = this.lightData, W = 512 * 4, act = this.active;
    for (let i = 0; i < act.length; i++) {
      const l = act[i]; const o = i * 4;
      D[o] = l._x; D[o + 1] = l._y; D[o + 2] = l._z; D[o + 3] = l.range;
      D[W + o] = l.color[0] * l._k; D[W + o + 1] = l.color[1] * l._k; D[W + o + 2] = l.color[2] * l._k; D[W + o + 3] = l.type + 8 * (l.flags & 3);
      const c = Math.cos(l._dth), s = Math.sin(l._dth);
      if (l.type === 1) {
        const d = l.dir || [0, -1, 0];
        D[2 * W + o] = d[0] * c - d[1] * s; D[2 * W + o + 1] = d[0] * s + d[1] * c; D[2 * W + o + 2] = d[2];
        D[2 * W + o + 3] = l.cosOuter === undefined ? 0.5 : l.cosOuter;
      } else if (l.type === 2 && l.end) {
        const e = l.end, dt = wrapPi(e.theta - anchor.theta), ss = Math.sin(dt), sh = Math.sin(0.5 * dt);
        D[2 * W + o] = e.rho * ss; D[2 * W + o + 1] = (anchor.rho - e.rho) + e.rho * 2 * sh * sh; D[2 * W + o + 2] = e.z - anchor.z;
        D[2 * W + o + 3] = l.radius;
      } else { D[2 * W + o] = 0; D[2 * W + o + 1] = -1; D[2 * W + o + 2] = 0; D[2 * W + o + 3] = l.radius; }
      const b = l.box;
      if (b) {
        D[3 * W + o] = wrapPi(b.t0 - anchor.theta); D[3 * W + o + 1] = b.r0; D[3 * W + o + 2] = b.z0 - anchor.z; D[3 * W + o + 3] = b.soft || 0.4;
        D[4 * W + o] = wrapPi(b.t1 - anchor.theta); D[4 * W + o + 1] = b.r1; D[4 * W + o + 2] = b.z1 - anchor.z;
      } else {
        D[3 * W + o] = -10; D[3 * W + o + 1] = -1e6; D[3 * W + o + 2] = -1e6; D[3 * W + o + 3] = 1;
        D[4 * W + o] = 10; D[4 * W + o + 1] = 1e6; D[4 * W + o + 2] = 1e6;
      }
      D[4 * W + o + 3] = l.cosInner === undefined ? 0.8 : l.cosInner;
    }
    this.lightTex.needsUpdate = true;
  }

  _cluster(camera) {
    const CX = CLUSTER.X, CY = CLUSTER.Y, CZ = CLUSTER.Z, NEAR = CLUSTER.NEAR, FAR = CLUSTER.FAR;
    const act = this.active, counts = this._counts, offs = this._offsets, rects = this._rects;
    counts.fill(0);
    const e = camera.matrixWorldInverse.elements;       // rotation only (camera sits at the origin of render space)
    const P00 = camera.projectionMatrix.elements[0], P11 = camera.projectionMatrix.elements[5];
    const logK = CZ / Math.log(FAR / NEAR);
    for (let i = 0; i < act.length; i++) {
      const l = act[i], r = l._r;
      const vx = e[0] * l._x + e[4] * l._y + e[8] * l._z;
      const vy = e[1] * l._x + e[5] * l._y + e[9] * l._z;
      const vz = -(e[2] * l._x + e[6] * l._y + e[10] * l._z);       // distance ahead
      let z0 = vz - r, z1 = vz + r; const o = i * 6;
      if (z1 < NEAR || z0 > FAR) { rects[o] = 1; rects[o + 1] = 0; continue; }
      z0 = Math.max(z0, NEAR); z1 = Math.min(z1, FAR);
      const s0 = clamp(Math.floor(Math.log(z0 / NEAR) * logK), 0, CZ - 1), s1 = clamp(Math.floor(Math.log(z1 / NEAR) * logK), 0, CZ - 1);
      let x0 = 0, x1 = CX - 1, y0 = 0, y1 = CY - 1;
      // tight tangent bounds of the sphere on each screen axis
      const dxz2 = vx * vx + vz * vz;
      if (dxz2 > r * r && vz > 0) {
        const a = Math.atan2(vx, vz), b = Math.asin(Math.min(1, r / Math.sqrt(dxz2)));
        const lo = a - b, hi = a + b;
        if (lo > -1.55) x0 = clamp(Math.floor((Math.tan(lo) * P00 * 0.5 + 0.5) * CX), 0, CX - 1);
        if (hi < 1.55) x1 = clamp(Math.floor((Math.tan(hi) * P00 * 0.5 + 0.5) * CX), 0, CX - 1);
      }
      const dyz2 = vy * vy + vz * vz;
      if (dyz2 > r * r && vz > 0) {
        const a = Math.atan2(vy, vz), b = Math.asin(Math.min(1, r / Math.sqrt(dyz2)));
        const lo = a - b, hi = a + b;
        if (lo > -1.55) y0 = clamp(Math.floor((Math.tan(lo) * P11 * 0.5 + 0.5) * CY), 0, CY - 1);
        if (hi < 1.55) y1 = clamp(Math.floor((Math.tan(hi) * P11 * 0.5 + 0.5) * CY), 0, CY - 1);
      }
      rects[o] = x0; rects[o + 1] = x1; rects[o + 2] = y0; rects[o + 3] = y1; rects[o + 4] = s0; rects[o + 5] = s1;
      for (let s = s0; s <= s1; s++) for (let y = y0; y <= y1; y++) { const base = (s * CY + y) * CX; for (let x = x0; x <= x1; x++) counts[base + x]++; }
    }
    let total = 0; const CD = this.clusterData, n = counts.length;
    for (let c = 0; c < n; c++) {
      const k = counts[c]; offs[c] = total; CD[c * 2] = total; total += k;
      if (total > MAX_INDICES) { total -= k; counts[c] = 0; CD[c * 2 + 1] = 0; continue; }
      CD[c * 2 + 1] = k;
    }
    const ID = this.indexData; counts.fill(0);
    for (let i = 0; i < act.length; i++) {
      const o = i * 6; const x0 = rects[o], x1 = rects[o + 1]; if (x0 > x1) continue;
      const y0 = rects[o + 2], y1 = rects[o + 3], s0 = rects[o + 4], s1 = rects[o + 5];
      for (let s = s0; s <= s1; s++) for (let y = y0; y <= y1; y++) {
        const base = (s * CY + y) * CX;
        for (let x = x0; x <= x1; x++) { const c = base + x; if (CD[c * 2 + 1] > counts[c]) { ID[offs[c] + counts[c]] = i; counts[c]++; } }
      }
    }
    this.indexCount = total;
    this.clusterTex.needsUpdate = true; this.indexTex.needsUpdate = true;
  }

  _ambient(anchor) {
    const U = this.ambU, A = this.ambients, lv = this.levels; let n = 0;
    // nearest boxes first
    for (const a of A) {
      const b = a.box;
      const dt = b.all ? 0 : Math.max(0, wrapPi(b.t0 - anchor.theta), -wrapPi(b.t1 - anchor.theta)) * anchor.rho;
      const dr = Math.max(0, b.r0 - anchor.rho, anchor.rho - b.r1), dz = Math.max(0, b.z0 - anchor.z, anchor.z - b.z1);
      a._d = Math.hypot(dt, dr, dz);
    }
    const list = A.filter((a) => a._d < 400 && a.on !== false).sort((p, q) => p._d - q._d);
    for (const a of list) {
      if (n >= 8) break;
      let k = a.scale; if (a.flags & LF.LAMP) k *= lv.lamps; if (a.flags & LF.SUNLIT) k *= lv.sun; if (a.flags & LF.NIGHT) k *= lv.night;
      const b = a.box;
      U.uAmbSky.value[n].set(a.sky[0] * k, a.sky[1] * k, a.sky[2] * k, a.spec);
      U.uAmbGround.value[n].set(a.ground[0] * k, a.ground[1] * k, a.ground[2] * k, a.flags & 1);
      U.uAmbMin.value[n].set(b.all ? -10 : wrapPi(b.t0 - anchor.theta), b.r0, b.z0 - anchor.z, b.soft || 1);
      U.uAmbMax.value[n].set(b.all ? 10 : wrapPi(b.t1 - anchor.theta), b.r1, b.z1 - anchor.z, 0);
      n++;
    }
    U.uAmbCount.value = n;
  }
}
