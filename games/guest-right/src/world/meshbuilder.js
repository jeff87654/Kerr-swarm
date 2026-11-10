// Geometry in code. MeshBuf is a growable vertex/index store in the world material's layout; Geo draws shapes into one
// with a transform stack and a current material. Everything is in a frame's flat metres (x spinward, y up, z back).
import * as THREE from 'three';
import { rgb8, clamp } from '../core/util.js';
import { MAT_INFO } from '../render/texgen.js';
import { FLAG } from '../render/worldmat.js';

export class MeshBuf {
  constructor(vcap = 256, icap = 512) {
    this.pos = new Float32Array(vcap * 3); this.nrm = new Int8Array(vcap * 4); this.uv = new Float32Array(vcap * 2);
    this.col = new Uint8Array(vcap * 4); this.mat = new Uint8Array(vcap * 4); this.idx = new Uint32Array(icap);
    this.nv = 0; this.ni = 0; this.vcap = vcap; this.icap = icap;
  }
  _growV(n) {
    if (this.nv + n <= this.vcap) return;
    let c = this.vcap; while (c < this.nv + n) c *= 2;
    const g = (A, k) => { const B = new A.constructor(c * k); B.set(A.subarray(0, this.nv * k)); return B; };
    this.pos = g(this.pos, 3); this.nrm = g(this.nrm, 4); this.uv = g(this.uv, 2); this.col = g(this.col, 4); this.mat = g(this.mat, 4); this.vcap = c;
  }
  _growI(n) {
    if (this.ni + n <= this.icap) return;
    let c = this.icap; while (c < this.ni + n) c *= 2;
    const B = new Uint32Array(c); B.set(this.idx.subarray(0, this.ni)); this.idx = B; this.icap = c;
  }
  clear() { this.nv = 0; this.ni = 0; }
  // append another buffer's triangles [i0, i1) (index range), offsetting positions by (dx,dy,dz); only the vertices used are copied
  appendRange(src, i0, i1, dx, dy, dz, remap) {
    const n = i1 - i0; this._growI(n);
    for (let k = i0; k < i1; k++) {
      const sv = src.idx[k]; let dv = remap[sv];
      if (dv === -1) {
        this._growV(1); dv = this.nv++; remap[sv] = dv;
        this.pos[dv * 3] = src.pos[sv * 3] + dx; this.pos[dv * 3 + 1] = src.pos[sv * 3 + 1] + dy; this.pos[dv * 3 + 2] = src.pos[sv * 3 + 2] + dz;
        const a = dv * 4, b = sv * 4;
        this.nrm[a] = src.nrm[b]; this.nrm[a + 1] = src.nrm[b + 1]; this.nrm[a + 2] = src.nrm[b + 2];
        this.uv[dv * 2] = src.uv[sv * 2]; this.uv[dv * 2 + 1] = src.uv[sv * 2 + 1];
        this.col[a] = src.col[b]; this.col[a + 1] = src.col[b + 1]; this.col[a + 2] = src.col[b + 2]; this.col[a + 3] = src.col[b + 3];
        this.mat[a] = src.mat[b]; this.mat[a + 1] = src.mat[b + 1]; this.mat[a + 2] = src.mat[b + 2]; this.mat[a + 3] = src.mat[b + 3];
      }
      this.idx[this.ni++] = dv;
    }
  }
  toGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos.slice(0, this.nv * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.nrm.slice(0, this.nv * 4), 4, true));
    g.setAttribute('uv', new THREE.BufferAttribute(this.uv.slice(0, this.nv * 2), 2));
    g.setAttribute('aColor', new THREE.BufferAttribute(this.col.slice(0, this.nv * 4), 4, true));
    g.setAttribute('aMat', new THREE.BufferAttribute(this.mat.slice(0, this.nv * 4), 4, false));
    g.setIndex(new THREE.BufferAttribute(this.nv > 65535 ? this.idx.slice(0, this.ni) : new Uint16Array(this.idx.subarray(0, this.ni)), 1));
    return g;
  }
  bounds() {
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = this.pos;
    for (let i = 0; i < this.nv; i++) { const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    return [x0, y0, z0, x1, y1, z1];
  }
}

// ---------- materials ----------
const CUTOUT = { leafA: 1, leafB: 1, fern: 1, blossom: 1, grille: 1 };
const SHADE = { brushed: FLAG.METAL, cast: FLAG.METAL, deckplate: FLAG.METAL, grille: FLAG.METAL,
  felt: FLAG.CLOTH, weave: FLAG.CLOTH, stripe: FLAG.CLOTH, knit: FLAG.CLOTH, carpet: FLAG.CLOTH, motif: FLAG.CLOTH,
  leafA: FLAG.FOLIAGE, leafB: FLAG.FOLIAGE, fern: FLAG.FOLIAGE, blossom: FLAG.FOLIAGE };
export function matLayer(name) { const m = MAT_INFO[name]; if (!m) throw new Error('unknown material: ' + name); return m.layer; }
export function matTile(name) { return MAT_INFO[name].tile; }
export function isCutoutLayer(layer) { return !!CUTOUT_LAYERS[layer]; }
const CUTOUT_LAYERS = {}; for (const k in CUTOUT) if (MAT_INFO[k]) CUTOUT_LAYERS[MAT_INFO[k].layer] = 1;
// emissive strength -> the byte the shader decodes as 2^((y-128)/16)
export function emisCode(strength) { return strength <= 0 ? 0 : clamp(Math.round(128 + 16 * Math.log2(strength)), 1, 255); }

const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1);

// ---------- the drawing kit ----------
export class Geo {
  constructor(buf) {
    this.buf = buf || new MeshBuf();
    this.stack = []; this.M = new THREE.Matrix4(); this.ident = true;
    this._col = [204, 204, 204, 255]; this._mat = [matLayer('plain'), 0, 0, 128]; this._tile = 1; this._atlas = false;
    this.aoBottom = 1; this.aoTop = 1;
  }
  // --- transform stack (flat space). Calls nest: push(); move(); rotY(); ...; pop();
  push() { this.stack.push(this.M.clone()); return this; }
  pop() { this.M.copy(this.stack.pop()); this.ident = this._isIdent(); return this; }
  _isIdent() { const e = this.M.elements; return e[0] === 1 && e[5] === 1 && e[10] === 1 && e[12] === 0 && e[13] === 0 && e[14] === 0 && e[1] === 0 && e[2] === 0 && e[4] === 0 && e[6] === 0 && e[8] === 0 && e[9] === 0; }
  move(x, y, z) { this.M.multiply(_m.makeTranslation(x, y, z)); this.ident = false; return this; }
  rotY(a) { this.M.multiply(_m.makeRotationY(a)); this.ident = false; return this; }
  rotX(a) { this.M.multiply(_m.makeRotationX(a)); this.ident = false; return this; }
  rotZ(a) { this.M.multiply(_m.makeRotationZ(a)); this.ident = false; return this; }
  scale(x, y, z) { this.M.multiply(_m.makeScale(x, y === undefined ? x : y, z === undefined ? x : z)); this.ident = false; return this; }
  at(x, y, z, yaw = 0) { this.push(); this.move(x, y, z); if (yaw) this.rotY(yaw); return this; }

  // --- material state. mat('planks', '#b98a5a', { rough: +0.1, emissive: 4, lamp: true, night: true, sway: 0.5 })
  mat(name, tint = '#cccccc', o) {
    const info = MAT_INFO[name]; if (!info) throw new Error('unknown material: ' + name);
    const c = rgb8(tint); this._col[0] = c[0]; this._col[1] = c[1]; this._col[2] = c[2]; this._col[3] = 255;
    let flags = SHADE[name] || 0, param = 128, em = 0;
    if (o) {
      if (o.rough !== undefined) param = clamp(Math.round(128 + o.rough * 255), 0, 255);
      if (o.emissive) em = emisCode(o.emissive);
      if (o.lamp) flags |= FLAG.LAMP; if (o.night) flags |= FLAG.NIGHT; if (o.flicker) flags |= FLAG.FLICKER;
      if (o.sway) { flags |= FLAG.SWAY; param = clamp(Math.round(o.sway * 255), 0, 255); }
      if (o.shade === 'metal') flags = (flags & ~96) | FLAG.METAL; else if (o.shade === 'cloth') flags = (flags & ~96) | FLAG.CLOTH; else if (o.shade === 'foliage') flags = (flags & ~96) | FLAG.FOLIAGE; else if (o.shade === 'plain') flags &= ~96;
    }
    this._mat[0] = info.layer; this._mat[1] = em; this._mat[2] = flags; this._mat[3] = param; this._tile = info.tile; this._atlas = false;
    return this;
  }
  // sign-atlas material: uvs given explicitly (0..1 of the atlas page)
  atlas(page, o) {
    this._col[0] = this._col[1] = this._col[2] = 255; this._col[3] = 255;
    let flags = FLAG.ATLAS, em = 0; if (o) { if (o.emissive) em = emisCode(o.emissive); if (o.lamp) flags |= FLAG.LAMP; if (o.night) flags |= FLAG.NIGHT; }
    this._mat[0] = page; this._mat[1] = em; this._mat[2] = flags; this._mat[3] = o && o.rough !== undefined ? clamp(Math.round(o.rough * 255), 0, 255) : 150; this._tile = 1; this._atlas = true;
    return this;
  }
  tint(t) { const c = rgb8(t); this._col[0] = c[0]; this._col[1] = c[1]; this._col[2] = c[2]; return this; }
  ao(bottom, top) { this.aoBottom = bottom; this.aoTop = top === undefined ? bottom : top; return this; }

  // --- vertices. Position/normal are transformed by the stack; uv is given in metres (divided by the tile) unless raw.
  v(x, y, z, nx, ny, nz, u, w, aoK = 1, rawUV = false) {
    const b = this.buf; b._growV(1); const i = b.nv++;
    if (!this.ident) {
      const e = this.M.elements;
      const X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14];
      const NX = e[0] * nx + e[4] * ny + e[8] * nz, NY = e[1] * nx + e[5] * ny + e[9] * nz, NZ = e[2] * nx + e[6] * ny + e[10] * nz;
      const l = Math.hypot(NX, NY, NZ) || 1; x = X; y = Y; z = Z; nx = NX / l; ny = NY / l; nz = NZ / l;
    }
    b.pos[i * 3] = x; b.pos[i * 3 + 1] = y; b.pos[i * 3 + 2] = z;
    const a = i * 4;
    b.nrm[a] = Math.round(nx * 127); b.nrm[a + 1] = Math.round(ny * 127); b.nrm[a + 2] = Math.round(nz * 127);
    if (rawUV || this._atlas) { b.uv[i * 2] = u; b.uv[i * 2 + 1] = w; } else { b.uv[i * 2] = u / this._tile; b.uv[i * 2 + 1] = w / this._tile; }
    b.col[a] = this._col[0]; b.col[a + 1] = this._col[1]; b.col[a + 2] = this._col[2]; b.col[a + 3] = Math.round(this._col[3] * aoK);
    b.mat[a] = this._mat[0]; b.mat[a + 1] = this._mat[1]; b.mat[a + 2] = this._mat[2]; b.mat[a + 3] = this._mat[3];
    return i;
  }
  // set the per-vertex parameter (roughness offset, or sway weight) of an existing vertex
  param(i, value01) { this.buf.mat[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(value01 * 255))); return this; }
  tri(a, b, c) { const B = this.buf; B._growI(3); B.idx[B.ni++] = a; B.idx[B.ni++] = b; B.idx[B.ni++] = c; }
  quadI(a, b, c, d) { const B = this.buf; B._growI(6); B.idx[B.ni++] = a; B.idx[B.ni++] = b; B.idx[B.ni++] = c; B.idx[B.ni++] = a; B.idx[B.ni++] = c; B.idx[B.ni++] = d; }

  // A flat quad from four corners (counter-clockwise seen from the front), with a planar uv in metres from its own edges.
  quad(p0, p1, p2, p3, o) {
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const lu = Math.hypot(ux, uy, uz), lv = Math.hypot(vx, vy, vz);
    const uv = o && o.uv;     // [u0,v0,u1,v1] raw
    const a = uv ? this.v(p0[0], p0[1], p0[2], nx, ny, nz, uv[0], uv[1], 1, true) : this.v(p0[0], p0[1], p0[2], nx, ny, nz, 0, 0);
    const b = uv ? this.v(p1[0], p1[1], p1[2], nx, ny, nz, uv[2], uv[1], 1, true) : this.v(p1[0], p1[1], p1[2], nx, ny, nz, lu, 0);
    const c = uv ? this.v(p2[0], p2[1], p2[2], nx, ny, nz, uv[2], uv[3], 1, true) : this.v(p2[0], p2[1], p2[2], nx, ny, nz, lu, lv);
    const d = uv ? this.v(p3[0], p3[1], p3[2], nx, ny, nz, uv[0], uv[3], 1, true) : this.v(p3[0], p3[1], p3[2], nx, ny, nz, 0, lv);
    this.quadI(a, b, c, d);
    if (o && o.double && !uv) this.quad(p0, p3, p2, p1);      // the back, with its own normal
    return this;
  }

  // One axis-aligned rectangle with world-planar uvs, subdivided so long faces bend with the drum.
  // axis: 0 = x-normal, 1 = y-normal, 2 = z-normal; sign: +1 or -1; a,b extents on the two in-plane axes; c = plane coordinate.
  _face(axis, sign, a0, a1, b0, b1, c, ao0 = 1, ao1 = 1) {
    // in-plane axes: axis 0 -> (z, y); axis 1 -> (x, z); axis 2 -> (x, y)
    const uA = axis === 0 ? 2 : 0, vA = axis === 1 ? 2 : 1;
    const bendAlong = uA === 0;          // only x needs subdividing
    const na = bendAlong ? Math.max(1, Math.ceil((a1 - a0) / 4)) : 1;
    const n = [0, 0, 0]; n[axis] = sign;
    const p = [0, 0, 0]; p[axis] = c;
    const base = this.buf.nv;
    for (let i = 0; i <= na; i++) {
      const a = a0 + (a1 - a0) * i / na;
      for (let j = 0; j <= 1; j++) {
        const b = j ? b1 : b0;
        p[uA] = a; p[vA] = b;
        // vertical faces: v runs up, so ao0 is the bottom edge and ao1 the top
        this.v(p[0], p[1], p[2], n[0], n[1], n[2], axis === 0 ? p[2] : p[0], axis === 1 ? p[2] : p[1], axis === 1 ? 1 : (j ? ao1 : ao0));
      }
    }
    // winding: counter-clockwise when seen from the side the normal points to
    const flip = (axis === 0 ? sign > 0 : axis === 1 ? sign > 0 : sign < 0);
    for (let i = 0; i < na; i++) {
      const q = base + i * 2;
      if (flip) this.quadI(q, q + 1, q + 3, q + 2); else this.quadI(q, q + 2, q + 3, q + 1);
    }
  }

  // Axis-aligned box. o.faces: string of faces to keep, any of 'x X y Y z Z' (lower = minus side); default all.
  // o.bevel: chamfer in metres (rounded-looking edges). o.aoBottom / o.aoTop darken the vertical faces toward the floor.
  box(x0, y0, z0, x1, y1, z1, o) {
    if (x0 > x1) { const t = x0; x0 = x1; x1 = t; } if (y0 > y1) { const t = y0; y0 = y1; y1 = t; } if (z0 > z1) { const t = z0; z0 = z1; z1 = t; }
    const f = (o && o.faces) || 'xXyYzZ';
    const b = o && o.bevel ? Math.min(o.bevel, (x1 - x0) / 2.01, (y1 - y0) / 2.01, (z1 - z0) / 2.01) : 0;
    const a0 = o && o.aoBottom !== undefined ? o.aoBottom : this.aoBottom, a1 = o && o.aoTop !== undefined ? o.aoTop : this.aoTop;
    if (b <= 0) {
      if (f.indexOf('x') >= 0) this._face(0, -1, z0, z1, y0, y1, x0, a0, a1);
      if (f.indexOf('X') >= 0) this._face(0, 1, z0, z1, y0, y1, x1, a0, a1);
      if (f.indexOf('y') >= 0) this._face(1, -1, x0, x1, z0, z1, y0);
      if (f.indexOf('Y') >= 0) this._face(1, 1, x0, x1, z0, z1, y1);
      if (f.indexOf('z') >= 0) this._face(2, -1, x0, x1, y0, y1, z0, a0, a1);
      if (f.indexOf('Z') >= 0) this._face(2, 1, x0, x1, y0, y1, z1, a0, a1);
      return this;
    }
    // bevelled: inset faces, then edge strips and corner triangles whose normals blend between the faces
    const X = [x0, x0 + b, x1 - b, x1], Y = [y0, y0 + b, y1 - b, y1], Z = [z0, z0 + b, z1 - b, z1];
    if (f.indexOf('x') >= 0) this._face(0, -1, Z[1], Z[2], Y[1], Y[2], x0, a0, a1);
    if (f.indexOf('X') >= 0) this._face(0, 1, Z[1], Z[2], Y[1], Y[2], x1, a0, a1);
    if (f.indexOf('y') >= 0) this._face(1, -1, X[1], X[2], Z[1], Z[2], y0);
    if (f.indexOf('Y') >= 0) this._face(1, 1, X[1], X[2], Z[1], Z[2], y1);
    if (f.indexOf('z') >= 0) this._face(2, -1, X[1], X[2], Y[1], Y[2], z0, a0, a1);
    if (f.indexOf('Z') >= 0) this._face(2, 1, X[1], X[2], Y[1], Y[2], z1, a0, a1);
    const V = (x, y, z, nx, ny, nz) => this.v(x, y, z, nx, ny, nz, x + z * 0.7, y + z * 0.7, 1 - (1 - a0) * (1 - (y - y0) / (y1 - y0 || 1)));
    // edges parallel to x (4), y (4), z (4)
    for (const sy of [0, 1]) for (const sz of [0, 1]) {
      const yf = sy ? y1 : y0, yi = sy ? Y[2] : Y[1], zf = sz ? z1 : z0, zi = sz ? Z[2] : Z[1], ny = sy ? 1 : -1, nz = sz ? 1 : -1;
      const a = V(X[1], yf, zi, 0, ny, 0), bb = V(X[2], yf, zi, 0, ny, 0), c = V(X[2], yi, zf, 0, 0, nz), d = V(X[1], yi, zf, 0, 0, nz);
      if ((sy ^ sz) === 0) this.quadI(a, bb, c, d); else this.quadI(a, d, c, bb);
    }
    for (const sx of [0, 1]) for (const sz of [0, 1]) {
      const xf = sx ? x1 : x0, xi = sx ? X[2] : X[1], zf = sz ? z1 : z0, zi = sz ? Z[2] : Z[1], nx = sx ? 1 : -1, nz = sz ? 1 : -1;
      const a = V(xf, Y[1], zi, nx, 0, 0), bb = V(xf, Y[2], zi, nx, 0, 0), c = V(xi, Y[2], zf, 0, 0, nz), d = V(xi, Y[1], zf, 0, 0, nz);
      if ((sx ^ sz) === 1) this.quadI(a, bb, c, d); else this.quadI(a, d, c, bb);
    }
    for (const sx of [0, 1]) for (const sy of [0, 1]) {
      const xf = sx ? x1 : x0, xi = sx ? X[2] : X[1], yf = sy ? y1 : y0, yi = sy ? Y[2] : Y[1], nx = sx ? 1 : -1, ny = sy ? 1 : -1;
      const a = V(xf, yi, Z[1], nx, 0, 0), bb = V(xf, yi, Z[2], nx, 0, 0), c = V(xi, yf, Z[2], 0, ny, 0), d = V(xi, yf, Z[1], 0, ny, 0);
      if ((sx ^ sy) === 0) this.quadI(a, bb, c, d); else this.quadI(a, d, c, bb);
    }
    for (const sx of [0, 1]) for (const sy of [0, 1]) for (const sz of [0, 1]) {
      const xf = sx ? x1 : x0, xi = sx ? X[2] : X[1], yf = sy ? y1 : y0, yi = sy ? Y[2] : Y[1], zf = sz ? z1 : z0, zi = sz ? Z[2] : Z[1];
      const a = V(xf, yi, zi, sx ? 1 : -1, 0, 0), bb = V(xi, yf, zi, 0, sy ? 1 : -1, 0), c = V(xi, yi, zf, 0, 0, sz ? 1 : -1);
      if ((sx ^ sy ^ sz) === 1) this.tri(a, bb, c); else this.tri(a, c, bb);
    }
    return this;
  }
  // box by centre and size
  cube(cx, cy, cz, sx, sy, sz, o) { return this.box(cx - sx / 2, cy - sy / 2, cz - sz / 2, cx + sx / 2, cy + sy / 2, cz + sz / 2, o); }

  // Surface of revolution about the y axis through (cx, cz): profile is [[r, y], ...] from bottom to top.
  // o.segs (default 16), o.smooth (default true), o.capTop / o.capBottom (default: closed where r > 0 at the ends)
  lathe(cx, cz, profile, o) {
    const segs = (o && o.segs) || 16, n = profile.length;
    const base = this.buf.nv;
    // normals from the profile's slope
    const nr = [], ny = [];
    for (let i = 0; i < n; i++) {
      const a = profile[Math.max(0, i - 1)], b = profile[Math.min(n - 1, i + 1)];
      let dr = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dr, dy) || 1; nr.push(dy / l); ny.push(-dr / l);
    }
    let vlen = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0) vlen += Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]);
      const r = profile[i][0], y = profile[i][1];
      for (let s = 0; s <= segs; s++) {
        const a = s / segs * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        this.v(cx + c * r, y, cz + sn * r, c * nr[i], ny[i], sn * nr[i], a * Math.max(r, 0.05), vlen);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let s = 0; s < segs; s++) {
      const a = base + i * (segs + 1) + s, b = a + 1, c = a + segs + 1, d = c + 1;
      this.quadI(a, c, d, b);
    }
    const cap = (i, up) => {
      const r = profile[i][0], y = profile[i][1]; if (r <= 1e-4) return;
      const c0 = this.v(cx, y, cz, 0, up ? 1 : -1, 0, 0, 0); const ring = this.buf.nv;
      for (let s = 0; s <= segs; s++) { const a = s / segs * Math.PI * 2; this.v(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, 0, up ? 1 : -1, 0, Math.cos(a) * r, Math.sin(a) * r); }
      for (let s = 0; s < segs; s++) { if (up) this.tri(c0, ring + s + 1, ring + s); else this.tri(c0, ring + s, ring + s + 1); }
    };
    if (!o || o.capBottom !== false) cap(0, false);
    if (!o || o.capTop !== false) cap(n - 1, true);
    return this;
  }
  // upright cylinder / cone: centre of the base (cx, y0, cz), radius r (r1 at the top), height h
  cyl(cx, y0, cz, r, h, o) { const r1 = o && o.r1 !== undefined ? o.r1 : r; return this.lathe(cx, cz, [[r, y0], [r1, y0 + h]], o); }
  // ellipsoid centred at (cx, cy, cz)
  ball(cx, cy, cz, rx, ry, rz, o) {
    const segs = (o && o.segs) || 12, rings = (o && o.rings) || 8; const base = this.buf.nv;
    const top = o && o.top !== undefined ? o.top : 1, bottom = o && o.bottom !== undefined ? o.bottom : -1;      // cut planes in -1..1 (hemispheres)
    const rz2 = rz === undefined ? rx : rz;
    for (let i = 0; i <= rings; i++) {
      const sy = bottom + (top - bottom) * i / rings; const ph = Math.asin(clamp(sy, -1, 1)); const cr = Math.cos(ph);
      for (let s = 0; s <= segs; s++) {
        const a = s / segs * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        const nx = c * cr / rx, nyy = sy / ry, nz = sn * cr / rz2; const l = Math.hypot(nx, nyy, nz) || 1;
        this.v(cx + c * cr * rx, cy + sy * ry, cz + sn * cr * rz2, nx / l, nyy / l, nz / l, a * rx, ph * ry);
      }
    }
    for (let i = 0; i < rings; i++) for (let s = 0; s < segs; s++) { const a = base + i * (segs + 1) + s; this.quadI(a, a + segs + 1, a + segs + 2, a + 1); }
    return this;
  }
  // A tube along a path of points [[x,y,z], ...]; r may be a number or an array per point. o.segs (6), o.caps (true), o.closed
  tube(path, r, o) {
    const segs = (o && o.segs) || 6, n = path.length, closed = o && o.closed; const base = this.buf.nv;
    const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), P = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    let len = 0; let prevN = null;
    for (let i = 0; i < n; i++) {
      const a = path[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = path[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      if (!prevN) { N.copy(Math.abs(T.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).cross(T).normalize(); }
      else { N.copy(prevN).addScaledVector(T, -prevN.dot(T)).normalize(); }
      B.crossVectors(T, N); prevN = N.clone();
      if (i > 0) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]);
      const rr = typeof r === 'number' ? r : r[i];
      for (let s = 0; s <= segs; s++) {
        const an = s / segs * Math.PI * 2, c = Math.cos(an), sn = Math.sin(an);
        const nx = N.x * c + B.x * sn, nyy = N.y * c + B.y * sn, nz = N.z * c + B.z * sn;
        this.v(path[i][0] + nx * rr, path[i][1] + nyy * rr, path[i][2] + nz * rr, nx, nyy, nz, an * rr, len);
      }
    }
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) for (let s = 0; s < segs; s++) {
      const a = base + i * (segs + 1) + s, c = base + ((i + 1) % n) * (segs + 1) + s;
      this.quadI(a, a + 1, c + 1, c);
    }
    if (!closed && (!o || o.caps !== false)) {
      for (const end of [0, n - 1]) {
        const p = path[end], q = path[end === 0 ? 1 : n - 2]; T.set(p[0] - q[0], p[1] - q[1], p[2] - q[2]).normalize();
        const c0 = this.v(p[0], p[1], p[2], T.x, T.y, T.z, 0, 0); const ring = base + end * (segs + 1);
        for (let s = 0; s < segs; s++) { if (end === 0) this.tri(c0, ring + s, ring + s + 1); else this.tri(c0, ring + s + 1, ring + s); }
      }
    }
    return this;
  }
  // Prism: a polygon in the xz plane ([[x,z], ...] counter-clockwise seen from above), from y0 to y1. Convex or mildly concave (fan from centroid).
  prism(poly, y0, y1, o) {
    const n = poly.length; let cx = 0, cz = 0; for (const p of poly) { cx += p[0]; cz += p[1]; } cx /= n; cz /= n;
    let per = 0;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n]; const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
      const nx = dz / l, nz = -dx / l;
      const v0 = this.v(a[0], y0, a[1], nx, 0, nz, per, y0, this.aoBottom), v1 = this.v(b[0], y0, b[1], nx, 0, nz, per + l, y0, this.aoBottom);
      const v2 = this.v(b[0], y1, b[1], nx, 0, nz, per + l, y1, this.aoTop), v3 = this.v(a[0], y1, a[1], nx, 0, nz, per, y1, this.aoTop);
      this.quadI(v0, v3, v2, v1); per += l;
    }
    for (const top of [true, false]) {
      if (o && ((top && o.capTop === false) || (!top && o.capBottom === false))) continue;
      const y = top ? y1 : y0, ny = top ? 1 : -1; const c0 = this.v(cx, y, cz, 0, ny, 0, cx, cz); const ring = this.buf.nv;
      for (const p of poly) this.v(p[0], y, p[1], 0, ny, 0, p[0], p[1]);
      for (let i = 0; i < n; i++) { const a = ring + i, b = ring + (i + 1) % n; if (top) this.tri(c0, b, a); else this.tri(c0, a, b); }
    }
    return this;
  }
  // Extrude a polygon given in a vertical plane: pts [[u, y], ...] (counter-clockwise seen from +z), along z from z0 to z1 (axis 'z'),
  // or along x (axis 'x', u runs along z). For arches, mouldings, benches, counters.
  extrude(pts, a0, a1, axis = 'z', o) {
    const n = pts.length; let cu = 0, cy = 0; for (const p of pts) { cu += p[0]; cy += p[1]; } cu /= n; cy /= n;
    const P = (u, y, a) => axis === 'z' ? [u, y, a] : [a, y, u];
    const Nn = (nu, ny) => axis === 'z' ? [nu, ny, 0] : [0, ny, nu];
    let per = 0;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n]; const du = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(du, dy) || 1;
      const nn = Nn(dy / l, -du / l); const A = P(p[0], p[1], a0), B = P(q[0], q[1], a0), C = P(q[0], q[1], a1), D = P(p[0], p[1], a1);
      const v0 = this.v(A[0], A[1], A[2], nn[0], nn[1], nn[2], per, a0), v1 = this.v(B[0], B[1], B[2], nn[0], nn[1], nn[2], per + l, a0);
      const v2 = this.v(C[0], C[1], C[2], nn[0], nn[1], nn[2], per + l, a1), v3 = this.v(D[0], D[1], D[2], nn[0], nn[1], nn[2], per, a1);
      if (axis === 'z') this.quadI(v0, v1, v2, v3); else this.quadI(v0, v3, v2, v1);
      per += l;
    }
    for (const end of [0, 1]) {
      if (o && o.caps === false) break;
      const a = end ? a1 : a0; const nn = axis === 'z' ? [0, 0, end ? 1 : -1] : [end ? 1 : -1, 0, 0];
      const C0 = P(cu, cy, a); const c0 = this.v(C0[0], C0[1], C0[2], nn[0], nn[1], nn[2], cu, cy); const ring = this.buf.nv;
      for (const p of pts) { const Q = P(p[0], p[1], a); this.v(Q[0], Q[1], Q[2], nn[0], nn[1], nn[2], p[0], p[1]); }
      for (let i = 0; i < n; i++) { const x = ring + i, y = ring + (i + 1) % n; const f = (axis === 'z') === (end === 1); if (f) this.tri(c0, x, y); else this.tri(c0, y, x); }
    }
    return this;
  }
  // A hanging or stretched sheet between four corners (p00, p10 along the top; p01, p11 along the bottom), with sag. Double-sided.
  sheet(p00, p10, p11, p01, o) {
    const nu = (o && o.nu) || 6, nv = (o && o.nv) || 4, sag = (o && o.sag) || 0, base = this.buf.nv;
    const L = Math.hypot(p10[0] - p00[0], p10[1] - p00[1], p10[2] - p00[2]), H = Math.hypot(p01[0] - p00[0], p01[1] - p00[1], p01[2] - p00[2]);
    const ux = p10[0] - p00[0], uy = p10[1] - p00[1], uz = p10[2] - p00[2], vx = p01[0] - p00[0], vy = p01[1] - p00[1], vz = p01[2] - p00[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (let side = 0; side < 2; side++) {
      const sg2 = side ? -1 : 1;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const s = i / nu, t = j / nv;
        const x = (p00[0] * (1 - s) + p10[0] * s) * (1 - t) + (p01[0] * (1 - s) + p11[0] * s) * t;
        let y = (p00[1] * (1 - s) + p10[1] * s) * (1 - t) + (p01[1] * (1 - s) + p11[1] * s) * t;
        const z = (p00[2] * (1 - s) + p10[2] * s) * (1 - t) + (p01[2] * (1 - s) + p11[2] * s) * t;
        const sg = sag * 4 * s * (1 - s) * (o && o.sagEdge === 'all' ? 1 : (0.35 + 0.65 * t));
        y -= sg;
        const rip = (o && o.ripple) ? Math.sin(s * Math.PI * (o.rippleN || 5)) * o.ripple * t : 0;
        const rs = (o && o.ripple) ? Math.cos(s * Math.PI * (o.rippleN || 5)) * 0.6 : 0;      // lean the normal with the ripple
        this.v(x + nx * rip, y, z + nz * rip, sg2 * (nx - ux / L * rs), sg2 * ny, sg2 * (nz - uz / L * rs), s * L, t * H, 1, false);
      }
    }
    const row = (nu + 1) * (nv + 1);
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i; this.quadI(a, a + 1, a + nu + 2, a + nu + 1);
      const b = a + row; this.quadI(b, b + nu + 1, b + nu + 2, b + 1);
    }
    return this;
  }
  // A single upright card (cut-out foliage, a poster): bottom-centre at (x,y,z), width w, height h, facing angle yaw; uv 0..1.
  card(x, y, z, w, h, yaw = 0, o) {
    const c = Math.cos(yaw), s = Math.sin(yaw), hx = c * w / 2, hz = -s * w / 2; const tilt = (o && o.tilt) || 0;
    const tx = s * tilt * h, tz = c * tilt * h;
    const uv = (o && o.uv) || [0, 0, 1, 1];
    const nx = s, nz = c;
    const a = this.v(x - hx, y, z - hz, nx, 0.3, nz, uv[0], uv[1], 1, true), b = this.v(x + hx, y, z + hz, nx, 0.3, nz, uv[2], uv[1], 1, true);
    const d = this.v(x - hx + tx, y + h, z - hz + tz, nx, 0.3, nz, uv[0], uv[3], 1, true), cc = this.v(x + hx + tx, y + h, z + hz + tz, nx, 0.3, nz, uv[2], uv[3], 1, true);
    this.quadI(a, b, cc, d);
    if (this._mat[2] & 4) { this.buf.mat[a * 4 + 3] = 0; this.buf.mat[b * 4 + 3] = 0; }       // swaying cards are rooted at their base
    return this;
  }
  // Copy another buffer in (a cached prop), under the current transform, optionally re-tinting by multiplying colours.
  stamp(src, tintMul) {
    const b = this.buf; b._growV(src.nv); b._growI(src.ni); const base = b.nv; const e = this.M.elements;
    for (let i = 0; i < src.nv; i++) {
      const x = src.pos[i * 3], y = src.pos[i * 3 + 1], z = src.pos[i * 3 + 2]; const o = (base + i);
      b.pos[o * 3] = e[0] * x + e[4] * y + e[8] * z + e[12]; b.pos[o * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13]; b.pos[o * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
      const nx = src.nrm[i * 4], ny = src.nrm[i * 4 + 1], nz = src.nrm[i * 4 + 2];
      let NX = e[0] * nx + e[4] * ny + e[8] * nz, NY = e[1] * nx + e[5] * ny + e[9] * nz, NZ = e[2] * nx + e[6] * ny + e[10] * nz; const l = Math.hypot(NX, NY, NZ) || 1;
      b.nrm[o * 4] = Math.round(NX / l * 127); b.nrm[o * 4 + 1] = Math.round(NY / l * 127); b.nrm[o * 4 + 2] = Math.round(NZ / l * 127);
      b.uv[o * 2] = src.uv[i * 2]; b.uv[o * 2 + 1] = src.uv[i * 2 + 1];
      if (tintMul) { b.col[o * 4] = Math.min(255, src.col[i * 4] * tintMul[0]); b.col[o * 4 + 1] = Math.min(255, src.col[i * 4 + 1] * tintMul[1]); b.col[o * 4 + 2] = Math.min(255, src.col[i * 4 + 2] * tintMul[2]); }
      else { b.col[o * 4] = src.col[i * 4]; b.col[o * 4 + 1] = src.col[i * 4 + 1]; b.col[o * 4 + 2] = src.col[i * 4 + 2]; }
      b.col[o * 4 + 3] = src.col[i * 4 + 3];
      b.mat[o * 4] = src.mat[i * 4]; b.mat[o * 4 + 1] = src.mat[i * 4 + 1]; b.mat[o * 4 + 2] = src.mat[i * 4 + 2]; b.mat[o * 4 + 3] = src.mat[i * 4 + 3];
    }
    b.nv += src.nv;
    for (let i = 0; i < src.ni; i++) b.idx[b.ni++] = src.idx[i] + base;
    return this;
  }
}
