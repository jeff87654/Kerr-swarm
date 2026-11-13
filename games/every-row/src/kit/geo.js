// A small geometry builder. Worlds model things flat, in metres, out of coloured facets: boxes, prisms, tubes, lathes.
// Every vertex carries a colour, a tint weight (how far an instance colour repaints it) and a glow.
import { BufferGeometry, Float32BufferAttribute, Uint8BufferAttribute, Matrix4, Vector3, Color, InstancedMesh, InstancedBufferAttribute, Mesh, Sphere, Quaternion } from 'three';

const _c = new Color();
const cache = new Map();
// colour -> linear [r, g, b]
export function rgb(c) {
  if (Array.isArray(c)) return c;
  if (c && c.isColor) return [c.r, c.g, c.b];
  let v = cache.get(c);
  if (!v) { _c.set(c); v = [_c.r, _c.g, _c.b]; cache.set(c, v); }
  return v;
}
// mix two colours (linear), t = 0..1
export function mixc(a, b, t) { const p = rgb(a), q = rgb(b); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]; }
// scale a colour's brightness
export function shade(a, k) { const p = rgb(a); return [p[0] * k, p[1] * k, p[2] * k]; }

const _a = new Vector3(), _b = new Vector3(), _n = new Vector3(), _v = new Vector3();

export class Geo {
  /** opts.maxSeg: split any triangle wider than this in x (use ~8 for things that will be bent onto a deck, ~16 in the Hollow) */
  constructor(opts = {}) {
    this.pos = []; this.nrm = []; this.col = []; this.emit = [];
    this.maxSeg = opts.maxSeg || 0;
    this.m = new Matrix4(); this.stack = [];
    this.tintW = 0;                       // tint weight given to new vertices
    this.count = 0;
  }
  get tris() { return this.pos.length / 9; }
  // ---- transforms
  push(m) { this.stack.push(this.m.clone()); if (m) this.m.multiply(m); return this; }
  pop() { this.m.copy(this.stack.pop()); return this; }
  /** move/turn/scale what is drawn next, until pop(): yaw about y (radians), scale a number or [x,y,z] */
  at(x, y, z, yaw = 0, scale = 1) {
    const m = new Matrix4().makeRotationY(yaw);
    if (scale !== 1) { const s = typeof scale === 'number' ? [scale, scale, scale] : scale; m.scale(_v.set(s[0], s[1], s[2])); }
    m.setPosition(x, y, z);
    return this.push(m);
  }
  rot(axis, angle) { const m = new Matrix4(); if (axis === 'x') m.makeRotationX(angle); else if (axis === 'z') m.makeRotationZ(angle); else m.makeRotationY(angle); return this.push(m); }
  tint(w) { this.tintW = w; return this; }

  // ---- lowest level: one triangle, points already transformed
  _raw(a, b, c, na, nb, nc, col, emit, depth) {
    if (this.maxSeg > 0 && depth < 12) {
      const xmin = Math.min(a.x, b.x, c.x), xmax = Math.max(a.x, b.x, c.x);
      if (xmax - xmin > this.maxSeg) {
        const dab = Math.abs(a.x - b.x), dbc = Math.abs(b.x - c.x), dca = Math.abs(c.x - a.x);
        if (dab >= dbc && dab >= dca) { const m = a.clone().lerp(b, 0.5), nm = na.clone().lerp(nb, 0.5); this._raw(a, m, c, na, nm, nc, col, emit, depth + 1); this._raw(m, b, c, nm, nb, nc, col, emit, depth + 1); }
        else if (dbc >= dca) { const m = b.clone().lerp(c, 0.5), nm = nb.clone().lerp(nc, 0.5); this._raw(a, b, m, na, nb, nm, col, emit, depth + 1); this._raw(a, m, c, na, nm, nc, col, emit, depth + 1); }
        else { const m = c.clone().lerp(a, 0.5), nm = nc.clone().lerp(na, 0.5); this._raw(a, b, m, na, nb, nm, col, emit, depth + 1); this._raw(m, b, c, nm, nb, nc, col, emit, depth + 1); }
        return;
      }
    }
    const p = this.pos, n = this.nrm, cc = this.col, e = this.emit, w = this.tintW * 255;
    p.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    n.push(na.x, na.y, na.z, nb.x, nb.y, nb.z, nc.x, nc.y, nc.z);
    const r = Math.min(255, col[0] * 255), g = Math.min(255, col[1] * 255), bl = Math.min(255, col[2] * 255);
    cc.push(r, g, bl, w, r, g, bl, w, r, g, bl, w);
    e.push(emit, emit, emit);
  }
  /** a triangle (counter-clockwise seen from its front). Points are [x,y,z] or Vector3. Optional smooth normals. */
  tri(a, b, c, color, emit = 0, na, nb, nc) {
    const A = toV(a).applyMatrix4(this.m), B = toV(b).applyMatrix4(this.m), C = toV(c).applyMatrix4(this.m);
    let NA, NB, NC;
    if (na) { NA = toV(na).transformDirection(this.m); NB = toV(nb).transformDirection(this.m); NC = toV(nc).transformDirection(this.m); }
    else { _a.subVectors(B, A); _b.subVectors(C, A); NA = NB = NC = new Vector3().crossVectors(_a, _b).normalize(); }
    this._raw(A, B, C, NA, NB, NC, rgb(color), emit, 0);
    return this;
  }
  /** a four-sided face, corners counter-clockwise seen from its front */
  quad(a, b, c, d, color, emit = 0) { this.tri(a, b, c, color, emit); this.tri(a, c, d, color, emit); return this; }
  /**
   * a box from corner (x0,y0,z0) to (x1,y1,z1). opts: emit, top, bottom, sides (colours), skip: string of faces to leave
   * out from 't' top, 'b' bottom, 'n' (z0 side), 's' (z1 side), 'w' (x0 side), 'e' (x1 side)
   */
  box(x0, y0, z0, x1, y1, z1, color, opts = {}) {
    const e = opts.emit || 0, skip = opts.skip || '', top = opts.top || color, bot = opts.bottom || color, sd = opts.sides || color;
    if (!skip.includes('t')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], top, e);
    if (!skip.includes('b')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], bot, e);
    if (!skip.includes('n')) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], sd, e);
    if (!skip.includes('s')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], sd, e);
    if (!skip.includes('w')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], sd, e);
    if (!skip.includes('e')) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], sd, e);
    return this;
  }
  /** a box by centre and size */
  cube(cx, cy, cz, sx, sy, sz, color, opts) { return this.box(cx - sx / 2, cy - sy / 2, cz - sz / 2, cx + sx / 2, cy + sy / 2, cz + sz / 2, color, opts); }
  /**
   * an upright prism or cone frustum: centre of its base (x, y, z), bottom radius r0, top radius r1, height h, n sides.
   * opts: emit, cap (default true), base (default false), smooth (default n > 8), top (colour of the cap), squash [sx, sz]
   */
  cyl(x, y, z, r0, r1, h, n, color, opts = {}) {
    const e = opts.emit || 0, smooth = opts.smooth === undefined ? n > 8 : opts.smooth, sq = opts.squash || [1, 1], ph = opts.phase || 0;
    const slope = (r0 - r1) / (h || 1);
    for (let i = 0; i < n; i++) {
      const a0 = ph + (i / n) * 6.283185307, a1 = ph + ((i + 1) / n) * 6.283185307;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const p00 = [x + c0 * r0 * sq[0], y, z + s0 * r0 * sq[1]], p10 = [x + c1 * r0 * sq[0], y, z + s1 * r0 * sq[1]];
      const p01 = [x + c0 * r1 * sq[0], y + h, z + s0 * r1 * sq[1]], p11 = [x + c1 * r1 * sq[0], y + h, z + s1 * r1 * sq[1]];
      if (smooth) {
        const n0 = [c0, slope, s0], n1 = [c1, slope, s1];
        this.tri(p00, p01, p11, color, e, n0, n0, n1); this.tri(p00, p11, p10, color, e, n0, n1, n1);
      } else { if (r1 > 1e-6) this.quad(p00, p01, p11, p10, color, e); else this.tri(p00, p01, p10, color, e); }
      if (opts.cap !== false && r1 > 1e-6) this.tri([x, y + h, z], p11, p01, opts.top || color, e);
      if (opts.base) this.tri([x, y, z], p00, p10, color, e);
    }
    return this;
  }
  /** a faceted blob (a squashed, slightly lumpy ball): centre, radii [rx, ry, rz], detail 0..2. opts: emit, lump (0..0.4), seed, shadeBottom */
  blob(x, y, z, r, detail, color, opts = {}) {
    const rr = typeof r === 'number' ? [r, r, r] : r, lump = opts.lump || 0, seed = opts.seed || 1, e = opts.emit || 0;
    const base = rgb(color), dark = opts.shadeBottom === undefined ? 0.62 : opts.shadeBottom;
    const t = (1 + Math.sqrt(5)) / 2;
    let vs = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map((v) => norm3(v));
    let fs = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let d = 0; d < detail; d++) {
      const mid = new Map(), nf = [];
      const m = (i, j) => { const k = i < j ? i + '_' + j : j + '_' + i; let q = mid.get(k); if (q === undefined) { q = vs.length; vs.push(norm3([(vs[i][0] + vs[j][0]) / 2, (vs[i][1] + vs[j][1]) / 2, (vs[i][2] + vs[j][2]) / 2])); mid.set(k, q); } return q; };
      for (const [a, b, c] of fs) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
      fs = nf;
    }
    const pts = vs.map((v, i) => { const k = 1 + lump * (hash1(i * 7.13 + seed * 31.7) - 0.5) * 2; return [x + v[0] * rr[0] * k, y + v[1] * rr[1] * k, z + v[2] * rr[2] * k]; });
    for (const [a, b, c] of fs) {
      const ny = (vs[a][1] + vs[b][1] + vs[c][1]) / 3;
      const k = dark + (1 - dark) * (0.5 + 0.5 * ny);
      this.tri(pts[a], pts[c], pts[b], [base[0] * k, base[1] * k, base[2] * k], e);
    }
    return this;
  }
  /** a tube along a list of points: radius, sides. opts: emit, closed, smooth */
  tube(points, radius, sides, color, opts = {}) {
    const e = opts.emit || 0, n = points.length, P = points.map(toV);
    const rings = [];
    let bx = null;
    for (let i = 0; i < n; i++) {
      const tan = new Vector3().subVectors(P[Math.min(i + 1, n - 1)], P[Math.max(i - 1, 0)]);
      if (tan.lengthSq() < 1e-12) tan.set(0, 0, 1);
      tan.normalize();
      // the frame is carried from ring to ring (so loops and knots do not flip or collapse)
      if (!bx) { const up = Math.abs(tan.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0); bx = new Vector3().crossVectors(tan, up).normalize(); }
      else { bx = bx.clone().addScaledVector(tan, -bx.dot(tan)); if (bx.lengthSq() < 1e-10) bx.crossVectors(tan, new Vector3(0.3, 0.9, 0.1)); bx.normalize(); }
      const by = new Vector3().crossVectors(bx, tan).normalize();
      const rad = typeof radius === 'function' ? radius(i / (n - 1)) : radius;
      const ring = [];
      for (let j = 0; j < sides; j++) { const a = (j / sides) * 6.283185307, c = Math.cos(a), s = Math.sin(a); ring.push({ p: P[i].clone().addScaledVector(bx, c * rad).addScaledVector(by, s * rad), n: bx.clone().multiplyScalar(c).addScaledVector(by, s) }); }
      rings.push(ring);
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
      const a = rings[i][j], b = rings[i][(j + 1) % sides], c = rings[i + 1][(j + 1) % sides], d = rings[i + 1][j];
      if (opts.smooth === false) this.quad(a.p, b.p, c.p, d.p, color, e);
      else { this.tri(a.p, b.p, c.p, color, e, a.n, b.n, c.n); this.tri(a.p, c.p, d.p, color, e, a.n, c.n, d.n); }
    }
    return this;
  }
  /** turn a profile [[radius, height], ...] about the y axis at (x, y, z): n sides. opts: emit, smooth, arc: [from, to] radians */
  lathe(x, y, z, profile, n, color, opts = {}) {
    const e = opts.emit || 0, a0 = opts.arc ? opts.arc[0] : 0, a1 = opts.arc ? opts.arc[1] : 6.283185307;
    for (let i = 0; i < n; i++) {
      const u0 = a0 + (a1 - a0) * (i / n), u1 = a0 + (a1 - a0) * ((i + 1) / n);
      const c0 = Math.cos(u0), s0 = Math.sin(u0), c1 = Math.cos(u1), s1 = Math.sin(u1);
      for (let k = 0; k < profile.length - 1; k++) {
        const [r0, h0] = profile[k], [r1, h1] = profile[k + 1];
        const colk = typeof color === 'function' ? color(k) : color;
        this.quad([x + c0 * r0, y + h0, z + s0 * r0], [x + c0 * r1, y + h1, z + s0 * r1], [x + c1 * r1, y + h1, z + s1 * r1], [x + c1 * r0, y + h0, z + s1 * r0], colk, e);
      }
    }
    return this;
  }
  /** a flat polygon [[x, z], ...] (counter-clockwise seen from above) at height y, pulled up by h. opts: emit, top, sides, noTop, noSides */
  extrude(poly, y, h, color, opts = {}) {
    const e = opts.emit || 0, n = poly.length, top = opts.top || color, sd = opts.sides || color;
    if (!opts.noSides) for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; this.quad([a[0], y, a[1]], [a[0], y + h, a[1]], [b[0], y + h, b[1]], [b[0], y, b[1]], sd, e); }
    if (!opts.noTop) for (let i = 1; i < n - 1; i++) this.tri([poly[0][0], y + h, poly[0][1]], [poly[i + 1][0], y + h, poly[i + 1][1]], [poly[i][0], y + h, poly[i][1]], top, e);
    return this;
  }
  /** a level rectangle at height y facing up (or down with opts.down), from (x0, z0) to (x1, z1) */
  floor(x0, z0, x1, z1, y, color, opts = {}) {
    if (opts.down) return this.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], color, opts.emit || 0);
    return this.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], color, opts.emit || 0);
  }
  /** copy everything from another Geo, through the current transform */
  add(other) {
    const p = other.pos, n = other.nrm, c = other.col, e = other.emit, keep = this.tintW;
    for (let i = 0; i < p.length; i += 9) {
      const A = new Vector3(p[i], p[i + 1], p[i + 2]).applyMatrix4(this.m), B = new Vector3(p[i + 3], p[i + 4], p[i + 5]).applyMatrix4(this.m), C = new Vector3(p[i + 6], p[i + 7], p[i + 8]).applyMatrix4(this.m);
      const NA = new Vector3(n[i], n[i + 1], n[i + 2]).transformDirection(this.m), NB = new Vector3(n[i + 3], n[i + 4], n[i + 5]).transformDirection(this.m), NC = new Vector3(n[i + 6], n[i + 7], n[i + 8]).transformDirection(this.m);
      const j = (i / 9) * 12;
      this.tintW = c[j + 3] / 255;
      this._raw(A, B, C, NA, NB, NC, [c[j] / 255, c[j + 1] / 255, c[j + 2] / 255], e[i / 3], 0);
    }
    this.tintW = keep;
    return this;
  }
  /** the finished BufferGeometry (position, normal, aCol, aEmit) */
  build() {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('aCol', new Uint8BufferAttribute(this.col, 4, true));
    g.setAttribute('aEmit', new Float32BufferAttribute(this.emit, 1));
    g.computeBoundingSphere();
    return g;
  }
  /** a Mesh of this geometry. If the material bends, pass the frame so the mesh is culled by where it really is. */
  mesh(material, frame) {
    const g = this.build(), m = new Mesh(g, material);
    if (frame) fitBounds(m, frame);
    return m;
  }
}

function toV(a) { return a.isVector3 ? a.clone() : new Vector3(a[0], a[1], a[2]); }
function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
function hash1(x) { const s = Math.sin(x * 127.1) * 43758.5453; return s - Math.floor(s); }

// The world-space bounding sphere of flat geometry once it is bent by a frame.
export function fitBounds(mesh, frame) {
  const g = mesh.geometry;
  if (!g.boundingBox) g.computeBoundingBox();
  const b = g.boundingBox, pts = [];
  for (let i = 0; i <= 4; i++) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(frame.point(b.min.x + (b.max.x - b.min.x) * (i / 4), y, z));
  const s = new Sphere().setFromPoints(pts);
  s.radius *= 1.05;
  g.boundingSphere = s;
  return mesh;
}

const _q = new Quaternion(), _s = new Vector3(), _p = new Vector3(), _m4 = new Matrix4(), _y = new Vector3(0, 1, 0);
/**
 * Many copies of one geometry. items: [{ p:[x,y,z], yaw, scale (number or [x,y,z]), color, walk:[radius, speed, phase, bob],
 * drift:[vx,vy,vz,seconds], phase }]. opts.walk / opts.drift must match the material's.
 * Positions are flat if the material bends: pass the frame as opts.frame and the copies are grouped into cells
 * (opts.cell metres, default 600) so that what is behind the camera is not drawn.
 * Returns an array of InstancedMesh.
 */
export function instances(geometry, material, items, opts = {}) {
  const frame = opts.frame, cell = opts.cell || 600, groups = new Map();
  if (frame) for (const it of items) { const k = Math.floor(it.p[0] / cell) + '_' + Math.floor(it.p[2] / cell); let a = groups.get(k); if (!a) groups.set(k, a = []); a.push(it); }
  else groups.set('all', items);
  const out = [], c = new Color();
  const gr = geometry.boundingSphere ? geometry.boundingSphere.radius : 10;
  for (const list of groups.values()) {
    if (!list.length) continue;
    const mesh = new InstancedMesh(geometry, material, list.length);
    const walk = opts.walk ? new Float32Array(list.length * 4) : null;
    const drift = opts.drift ? new Float32Array(list.length * 4) : null, phase = opts.drift ? new Float32Array(list.length) : null;
    let anyColor = false, maxS = 1;
    const pts = [];
    for (let i = 0; i < list.length; i++) {
      const it = list[i], sc = it.scale === undefined ? 1 : it.scale;
      if (typeof sc === 'number') _s.set(sc, sc, sc); else _s.set(sc[0], sc[1], sc[2]);
      maxS = Math.max(maxS, _s.x, _s.y, _s.z);
      _q.setFromAxisAngle(_y, it.yaw || 0);
      _m4.compose(_p.set(it.p[0], it.p[1], it.p[2]), _q, _s);
      mesh.setMatrixAt(i, _m4);
      if (it.color !== undefined) { const v = rgb(it.color); c.setRGB(v[0], v[1], v[2]); mesh.setColorAt(i, c); anyColor = true; }
      else if (anyColor || opts.colors) { c.setRGB(1, 1, 1); mesh.setColorAt(i, c); }
      if (walk) { const w = it.walk || [0, 0, 0, 0]; walk[i * 4] = w[0]; walk[i * 4 + 1] = w[1]; walk[i * 4 + 2] = w[2]; walk[i * 4 + 3] = w[3]; }
      if (drift) { const d = it.drift || [0, 0, 0, 1]; drift[i * 4] = d[0]; drift[i * 4 + 1] = d[1]; drift[i * 4 + 2] = d[2]; drift[i * 4 + 3] = d[3] || 1; phase[i] = it.phase === undefined ? (i * 0.61803398875) % 1 : it.phase; }
      if (frame) pts.push(frame.point(it.p[0], it.p[1], it.p[2])); else pts.push(new Vector3(it.p[0], it.p[1], it.p[2]));
    }
    if (walk || drift) mesh.geometry = geometry.clone();
    if (walk) mesh.geometry.setAttribute('aWalk', new InstancedBufferAttribute(walk, 4));
    if (drift) { mesh.geometry.setAttribute('aDrift', new InstancedBufferAttribute(drift, 4)); mesh.geometry.setAttribute('aPhase', new InstancedBufferAttribute(phase, 1)); mesh.frustumCulled = false; }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    const s = new Sphere().setFromPoints(pts);
    s.radius += gr * maxS + (opts.walk ? 30 : 0);
    mesh.boundingSphere = s;
    out.push(mesh);
  }
  return out;
}
