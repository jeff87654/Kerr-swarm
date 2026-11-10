// People: bodies and how they are drawn. Every person is a set of rigid, rounded parts (tapered capsules and turned
// shapes) hung on a fifteen-bone skeleton. Each part shape is one THREE.InstancedMesh shared by everyone; a part's
// instance carries its matrix (flat metres relative to the mesh origin) and an rgba tint that colours the near-white
// vertex colours of the shape. Shapes are modelled once at a reference adult of 1.70 m and scaled per person.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { hexLin, Rng, clamp, lerp, mixHex, shadeHex, hashStr } from '../core/util.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------------------------
// The skeleton. Bones hang their limbs along local -y; a person faces local +z; +x is their left.
// ---------------------------------------------------------------------------------------------------------------
export const BONE = { PELVIS: 0, CHEST: 1, HEAD: 2, UA_L: 3, FA_L: 4, HA_L: 5, UA_R: 6, FA_R: 7, HA_R: 8, TH_L: 9, SH_L: 10, FT_L: 11, TH_R: 12, SH_R: 13, FT_R: 14 };
export const NBONES = 15;
// Reference adult (1.70 m): every length a person has is one of these times their own scale.
export const REF = {
  hip: 0.88, hipW: 0.09, waist: 0.12, neck: 0.43, shoulderX: 0.165, shoulderY: 0.336,
  upper: 0.30, fore: 0.25, hand: 0.17, thigh: 0.40, shin: 0.40, ankle: 0.08, crown: 0.268, chin: 0.055,
};

// ---------------------------------------------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------------------------------------------
// A lofted surface through horizontal elliptical rings, bottom to top: ring = [y, rx, rz, cx, cz, ao].
// Normals are found from the surface itself, so any ring sequence shades smoothly. o: { segs, phase, flip, col(x,y,z) -> [r,g,b] | null,
// inner: thickness (adds an inside surface and a bottom rim: for open garments), open: true (no closing at the ends) }
function loft(g, R, o = {}) {
  const segs = o.segs || 12, n = R.length, ph = o.phase || 0;
  const P = new Float64Array(n * segs * 3);
  for (let i = 0; i < n; i++) {
    const r = R[i];
    for (let s = 0; s < segs; s++) {
      const a = ph + s / segs * TAU, k = (i * segs + s) * 3;
      let x = (r[3] || 0) + Math.cos(a) * r[1], y = r[0], z = (r[4] || 0) + Math.sin(a) * r[2];
      if (o.floor !== undefined && y < o.floor) y = o.floor;
      P[k] = x; P[k + 1] = y; P[k + 2] = z;
    }
  }
  emitGrid(g, P, n, segs, R, o, !!o.flip);
  if (o.inner) {
    const t = o.inner, Q = new Float64Array(P.length);
    for (let i = 0; i < n; i++) {
      const r = R[i];
      for (let s = 0; s < segs; s++) {
        const a = ph + s / segs * TAU, k = (i * segs + s) * 3;
        Q[k] = (r[3] || 0) + Math.cos(a) * Math.max(0.002, r[1] - t); Q[k + 1] = r[0]; Q[k + 2] = (r[4] || 0) + Math.sin(a) * Math.max(0.002, r[2] - t);
      }
    }
    emitGrid(g, Q, n, segs, R, o, !o.flip);
    // the rim at the bottom edge
    const base = g.buf.nv;
    for (let s = 0; s <= segs; s++) {
      const sm = s % segs, k = sm * 3, a = ph + sm / segs * TAU;
      g.v(P[k], P[k + 1], P[k + 2], Math.cos(a) * 0.3, -0.95, Math.sin(a) * 0.3, s * 0.02, 0);
      g.v(Q[k], Q[k + 1], Q[k + 2], Math.cos(a) * 0.3, -0.95, Math.sin(a) * 0.3, s * 0.02, t);
    }
    for (let s = 0; s < segs; s++) { const a = base + s * 2; if (o.flip) g.quadI(a, a + 2, a + 3, a + 1); else g.quadI(a, a + 1, a + 3, a + 2); }
    const base2 = g.buf.nv, top = (n - 1) * segs * 3;
    for (let s = 0; s <= segs; s++) {
      const sm = s % segs, k = top + sm * 3, a = ph + sm / segs * TAU;
      g.v(P[k], P[k + 1], P[k + 2], Math.cos(a) * 0.3, 0.95, Math.sin(a) * 0.3, s * 0.02, 0);
      g.v(Q[k], Q[k + 1], Q[k + 2], Math.cos(a) * 0.3, 0.95, Math.sin(a) * 0.3, s * 0.02, t);
    }
    for (let s = 0; s < segs; s++) { const a = base2 + s * 2; if (o.flip) g.quadI(a, a + 1, a + 3, a + 2); else g.quadI(a, a + 2, a + 3, a + 1); }
  }
}
// Shared by loft: a ring grid P (n rings of segs points) to vertices and triangles.
function emitGrid(g, P, n, segs, R, o, flip) {
  const base = g.buf.nv; let vlen = 0; const col = g._col, c0 = col[0], c1 = col[1], c2 = col[2];
  for (let i = 0; i < n; i++) {
    if (i > 0) { const k0 = (i - 1) * segs * 3, k1 = i * segs * 3; vlen += Math.hypot(P[k1] - P[k0], P[k1 + 1] - P[k0 + 1], P[k1 + 2] - P[k0 + 2]); }
    const ip = Math.max(0, i - 1), inx = Math.min(n - 1, i + 1);
    const avgR = (R[i][1] + R[i][2]) * 0.5, ao = R[i][5] === undefined ? 1 : R[i][5];
    for (let s = 0; s <= segs; s++) {
      const sm = s % segs, k = (i * segs + sm) * 3;
      const kp = (i * segs + (sm + segs - 1) % segs) * 3, kn = (i * segs + (sm + 1) % segs) * 3;
      const ka = (ip * segs + sm) * 3, kb = (inx * segs + sm) * 3;
      const tx = P[kn] - P[kp], ty = P[kn + 1] - P[kp + 1], tz = P[kn + 2] - P[kp + 2];
      const ux = P[kb] - P[ka], uy = P[kb + 1] - P[ka + 1], uz = P[kb + 2] - P[ka + 2];
      let nx = uy * tz - uz * ty, ny = uz * tx - ux * tz, nz = ux * ty - uy * tx;
      let l = Math.hypot(nx, ny, nz);
      if (l < 1e-12) { nx = 0; ny = i === 0 ? -1 : 1; nz = 0; l = 1; }
      nx /= l; ny /= l; nz /= l; if (flip) { nx = -nx; ny = -ny; nz = -nz; }
      if (o.col) { const c = o.col(P[k], P[k + 1], P[k + 2]); if (c) { col[0] = c[0]; col[1] = c[1]; col[2] = c[2]; } else { col[0] = c0; col[1] = c1; col[2] = c2; } }
      g.v(P[k], P[k + 1], P[k + 2], nx, ny, nz, (s / segs) * TAU * Math.max(avgR, 0.03), vlen, ao);
    }
  }
  col[0] = c0; col[1] = c1; col[2] = c2;
  for (let i = 0; i < n - 1; i++) for (let s = 0; s < segs; s++) {
    const a = base + i * (segs + 1) + s, b = a + 1, c = a + segs + 1, d = c + 1;
    if (flip) g.quadI(a, b, d, c); else g.quadI(a, c, d, b);
  }
}
// Rings for a tapered capsule from a bottom sphere (centre yb, radius rb) to a top sphere (yt, rt). o: { zr (depth/width), xr, czb, czt, hemi, mid, ao }
function capRings(yb, rb, yt, rt, o = {}) {
  const zr = o.zr || 1, xr = o.xr || 1, n = o.hemi || 4, m = o.mid || 2, czb = o.czb || 0, czt = o.czt || 0, cxb = o.cxb || 0, cxt = o.cxt || 0;
  const R = [];
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * i / n; const c = Math.max(Math.cos(a), 0.012); R.push([yb + Math.sin(a) * rb, c * rb * xr, c * rb * zr, cxb, czb, o.aoB === undefined ? 1 : o.aoB]); }
  for (let k = 0; k <= m; k++) { const t = k / m; R.push([lerp(yb, yt, t), lerp(rb, rt, t) * xr, lerp(rb, rt, t) * zr, lerp(cxb, cxt, t), lerp(czb, czt, t), 1]); }
  for (let i = 1; i <= n; i++) { const a = (Math.PI / 2) * i / n; const c = Math.max(Math.cos(a), 0.012); R.push([yt + Math.sin(a) * rt, c * rt * xr, c * rt * zr, cxt, czt, 1]); }
  return R;
}
// Close a ring list at both ends with small rounded caps (for shapes that are not capsules).
function closeRings(R, kb = 0.6, kt = 0.6, lean) {
  const a = R[0], b = R[R.length - 1];
  const db = Math.min(a[1], a[2]) * kb, dt = Math.min(b[1], b[2]) * kt;
  const lo = kb > 0.02 ? (lean ? [[a[0] - db, a[1] * 0.02, a[2] * 0.02, a[3], a[4], a[5]]] : [[a[0] - db, a[1] * 0.02, a[2] * 0.02, a[3], a[4], a[5]], [a[0] - db * 0.55, a[1] * 0.8, a[2] * 0.8, a[3], a[4], a[5]]]) : [];
  const hi = kt > 0.02 ? (lean ? [[b[0] + dt, b[1] * 0.02, b[2] * 0.02, b[3], b[4]]] : [[b[0] + dt * 0.55, b[1] * 0.8, b[2] * 0.8, b[3], b[4]], [b[0] + dt, b[1] * 0.02, b[2] * 0.02, b[3], b[4]]]) : [];
  return lo.concat(R).concat(hi);
}
const pick = (R, idx) => idx.map((i) => R[i]);
// A sheet with thickness from a parametric surface fn(u, v) -> [x, y, z]; the front faces the hint direction (x, y, z).
function slab(g, nu, nv, fn, thick, hint) {
  const P = []; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P.push(fn(i / nu, j / nv));
  const at = (i, j) => P[clamp(j, 0, nv) * (nu + 1) + clamp(i, 0, nu)];
  const N = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const a = at(i - 1, j), b = at(i + 1, j), c = at(i, j - 1), d = at(i, j + 1);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; N.push([nx / l, ny / l, nz / l]);
  }
  const mid = N[Math.floor(N.length / 2)]; const flip = mid[0] * hint[0] + mid[1] * hint[1] + mid[2] * hint[2] < 0 ? -1 : 1;
  for (const nn of N) { nn[0] *= flip; nn[1] *= flip; nn[2] *= flip; }
  const W = nu + 1;
  for (let side = 0; side < 2; side++) {
    const base = g.buf.nv, sg = side ? -1 : 1, off = side ? -thick : 0;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const p = P[j * W + i], nn = N[j * W + i];
      g.v(p[0] + nn[0] * off, p[1] + nn[1] * off, p[2] + nn[2] * off, nn[0] * sg, nn[1] * sg, nn[2] * sg, i / nu * 0.3, j / nv * 0.3);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * W + i, b = a + 1, c = a + W, d = c + 1;
      if ((flip > 0) !== (side === 1)) g.quadI(a, b, d, c); else g.quadI(a, c, d, b);
    }
  }
  // edges
  const edge = (list) => {
    const base = g.buf.nv;
    for (const [i, j] of list) {
      const p = P[j * W + i], nn = N[j * W + i]; const q = [p[0] - nn[0] * thick, p[1] - nn[1] * thick, p[2] - nn[2] * thick];
      g.v(p[0], p[1], p[2], 0, 1, 0, 0, 0); g.v(q[0], q[1], q[2], 0, 1, 0, 0, 0);
    }
    for (let k = 0; k < list.length - 1; k++) { const a = base + k * 2; g.quadI(a, a + 1, a + 3, a + 2); g.quadI(a, a + 2, a + 3, a + 1); }
  };
  const L = []; for (let i = 0; i <= nu; i++) L.push([i, 0]); edge(L);
  const L2 = []; for (let i = 0; i <= nu; i++) L2.push([i, nv]); edge(L2);
  const L3 = []; for (let j = 0; j <= nv; j++) L3.push([0, j]); edge(L3);
  const L4 = []; for (let j = 0; j <= nv; j++) L4.push([nu, j]); edge(L4);
}
// interpolate a ring list at height y -> [rx, rz, cz]
export function ringAt(R, y) {
  if (y <= R[0][0]) return [R[0][1], R[0][2], R[0][4] || 0];
  for (let i = 1; i < R.length; i++) if (y <= R[i][0]) { const a = R[i - 1], b = R[i], t = (y - a[0]) / (b[0] - a[0] || 1); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[4] || 0, b[4] || 0, t)]; }
  const l = R[R.length - 1]; return [l[1], l[2], l[4] || 0];
}

// ---------------------------------------------------------------------------------------------------------------
// Body shapes at the reference size
// ---------------------------------------------------------------------------------------------------------------
const SKIN = (g) => g.mat('plain', '#ffffff', { shade: 'cloth', rough: 0.08 });
const CLOTH = (g) => g.mat('weave', '#ffffff', { rough: 0.05 });
const FELT = (g) => g.mat('felt', '#ffffff');
const HAIR = (g) => g.mat('plain', '#ffffff', { rough: -0.12 });

export const PELVIS_R = [[-0.135, 0.09, 0.075, 0, -0.005, 0.8], [-0.11, 0.135, 0.1, 0, -0.01, 0.85], [-0.06, 0.162, 0.116, 0, -0.014], [0.0, 0.172, 0.122, 0, -0.014], [0.07, 0.16, 0.112, 0, -0.006], [0.125, 0.146, 0.103, 0, 0], [0.15, 0.12, 0.088, 0, 0]];
export const CHEST_R = [[-0.05, 0.142, 0.103, 0, 0], [0.04, 0.148, 0.107, 0, 0.002], [0.14, 0.158, 0.117, 0, 0.01], [0.23, 0.172, 0.118, 0, 0.008], [0.3, 0.184, 0.109, 0, 0.0], [0.35, 0.18, 0.1, 0, -0.005], [0.385, 0.162, 0.089, 0, -0.008], [0.41, 0.125, 0.076, 0, -0.011], [0.43, 0.08, 0.063, 0, -0.012], [0.445, 0.05, 0.05, 0, -0.012]];
const HEAD_R = [[-0.035, 0.046, 0.046, 0, -0.004], [0.03, 0.044, 0.044, 0, -0.008], [0.052, 0.05, 0.056, 0, 0.002, 0.85], [0.07, 0.065, 0.077, 0, 0.012], [0.1, 0.078, 0.09, 0, 0.01], [0.135, 0.085, 0.096, 0, 0.004], [0.17, 0.087, 0.099, 0, -0.004], [0.205, 0.081, 0.093, 0, -0.012], [0.235, 0.064, 0.075, 0, -0.018], [0.256, 0.038, 0.046, 0, -0.02], [0.267, 0.006, 0.007, 0, -0.02]];

function buildPelvis(g) { CLOTH(g); loft(g, closeRings(pick(PELVIS_R, [0, 2, 3, 5, 6]), 0.4, 0.3, true), { segs: 8 }); }
function buildChest(g) { CLOTH(g); loft(g, closeRings(pick(CHEST_R, [0, 2, 4, 5, 6, 7, 9]), 0.3, 0.4), { segs: 8 }); }
function buildHead(g) {
  SKIN(g);
  const cheek = (x, y, z) => { const d = Math.hypot(Math.abs(x) - 0.052, y - 0.098, Math.max(0, 0.08 - z)); return d < 0.03 && z > 0.05 ? [255, Math.round(232 + 23 * d / 0.03), Math.round(224 + 31 * d / 0.03)] : null; };
  loft(g, closeRings(pick(HEAD_R, [0, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0.5, 0.0), { segs: 8, col: cheek });
  // nose, ears
  g.ball(0, 0.106, 0.097, 0.0125, 0.019, 0.016, { segs: 5, rings: 3 });
  for (const s of [-1, 1]) g.ball(s * 0.083, 0.12, -0.006, 0.0085, 0.019, 0.013, { segs: 4, rings: 3 });
  // eyes: small and dark
  g.mat('plain', '#1d1612', { rough: -0.35 });
  for (const s of [-1, 1]) g.ball(s * 0.032, 0.13, 0.0905, 0.0115, 0.0145, 0.009, { segs: 5, rings: 3, bottom: -0.3 });
}
// hair: a shell over the cranium whose lower edge runs from the forehead down to the nape. o: { grow, front, side, back, segs }
function hairShell(g, o) {
  const gr = o.grow || 0.012, cx = 0, cy = 0.162, cz = -0.008, rx = 0.088 + gr, ry = 0.106 + gr * 0.8, rz = 0.1 + gr;
  const segs = o.segs || 9, rings = o.rings || 4;
  const hl = (phi) => { const f = Math.cos(phi); const h = f > 0 ? lerp(o.side || 0.12, o.front || 0.19, f) : lerp(o.side || 0.12, o.back || 0.07, -f); return h; };
  const P = new Float64Array((rings + 1) * segs * 3), R = [];
  for (let i = 0; i <= rings; i++) R.push([0, rx, rz, 0, 0, i === 0 ? 0.8 : 1]);
  for (let s = 0; s < segs; s++) {
    const phi = s / segs * TAU;          // 0 = front (+z)
    const yEdge = hl(phi); const pEdge = Math.acos(clamp((yEdge - cy) / ry, -0.98, 0.98));
    for (let i = 0; i <= rings; i++) {
      const t = i / rings, p = lerp(pEdge, 0.02, t);
      const k = ((rings - i) * segs + s) * 3;
      P[k] = cx + Math.sin(phi) * Math.sin(p) * rx; P[k + 1] = cy + Math.cos(p) * ry; P[k + 2] = cz + Math.cos(phi) * Math.sin(p) * rz;
      if (o.vol && i > 1) { const bump = o.vol(phi, t); P[k] += Math.sin(phi) * Math.sin(p) * bump; P[k + 1] += Math.cos(p) * bump * 0.6; P[k + 2] += Math.cos(phi) * Math.sin(p) * bump; }
    }
  }
  emitGrid(g, P, rings + 1, segs, R.reverse(), {}, false);
  // a thick lip at the hairline, turned in toward the head
  const base = g.buf.nv;
  for (let s = 0; s <= segs; s++) {
    const sm = s % segs, k = ((rings) * segs + sm) * 3, phi = sm / segs * TAU;
    const ix = Math.sin(phi), iz = Math.cos(phi);
    g.v(P[k], P[k + 1], P[k + 2], ix * 0.4, -0.9, iz * 0.4, s * 0.02, 0, 0.7);
    g.v(P[k] - ix * gr * 0.9, P[k + 1] + 0.004, P[k + 2] - iz * gr * 0.9, ix * 0.4, -0.9, iz * 0.4, s * 0.02, 0.01, 0.6);
  }
  for (let s = 0; s < segs; s++) { const a = base + s * 2; g.quadI(a, a + 2, a + 3, a + 1); g.quadI(a, a + 1, a + 3, a + 2); }
}
function brows(g) { for (const s of [-1, 1]) { g.push(); g.move(s * 0.033, 0.153, 0.093); g.rotZ(s * -0.12); g.ball(0, 0, 0, 0.017, 0.0045, 0.006, { segs: 4, rings: 2 }); g.pop(); } }
function buildHair(style) {
  return (g) => {
    HAIR(g);
    brows(g);
    if (style === 'brows') return;
    if (style === 'cropped') { hairShell(g, { grow: 0.005, front: 0.195, side: 0.13, back: 0.07 }); return; }
    if (style === 'bald') {
      const arc = []; for (let i = 0; i <= 12; i++) { const phi = 0.55 + (TAU - 1.1) * i / 12; arc.push([Math.sin(phi) * 0.088, 0.118 - 0.025 * Math.cos(phi) * -1 * 0.3, Math.cos(phi) * 0.098 - 0.008]); }
      g.tube(arc.filter((q, i) => i % 2 === 0), 0.019, { segs: 5 }); return;
    }
    if (style === 'short') {
      hairShell(g, { grow: 0.016, front: 0.19, side: 0.125, back: 0.075, vol: (phi, t) => 0.012 * Math.max(0, Math.cos(phi)) * Math.sin(t * Math.PI) });
      g.ball(0.01, 0.222, 0.062, 0.072, 0.03, 0.045, { segs: 7, rings: 3 });       // a swept fringe
      return;
    }
    if (style === 'long') {
      hairShell(g, { grow: 0.014, front: 0.2, side: 0.13, back: 0.11 });
      loft(g, closeRings([[-0.12, 0.08, 0.034, 0, -0.07], [-0.04, 0.09, 0.04, 0, -0.075], [0.06, 0.098, 0.05, 0, -0.072], [0.15, 0.094, 0.06, 0, -0.05]], 0.6, 0.6, true), { segs: 7 });
      for (const s of [-1, 1]) loft(g, closeRings([[0.0, 0.016, 0.022, s * 0.08, 0.0], [0.08, 0.02, 0.026, s * 0.092, 0.005], [0.17, 0.022, 0.028, s * 0.09, 0.0]], 0.8, 0.8, true), { segs: 5 });
      return;
    }
    if (style === 'tied') {
      hairShell(g, { grow: 0.01, front: 0.2, side: 0.13, back: 0.085 });
      g.tube([[0, 0.15, -0.1], [0, 0.125, -0.13], [0, 0.07, -0.145], [0, 0.0, -0.135], [0, -0.05, -0.12]], [0.028, 0.034, 0.03, 0.022, 0.008], { segs: 6 });
      return;
    }
    if (style === 'bun') {
      hairShell(g, { grow: 0.008, front: 0.2, side: 0.13, back: 0.08 });
      g.ball(0, 0.232, -0.078, 0.052, 0.046, 0.05, { segs: 8, rings: 4 });
      return;
    }
    // 'cap' and 'scarf' wear cropped hair under the headwear
    hairShell(g, { grow: 0.005, front: 0.195, side: 0.13, back: 0.07 });
  };
}
function buildHeadwear(kind) {
  return (g) => {
    if (kind === 'cap') {
      FELT(g);
      hairShell(g, { grow: 0.024, front: 0.21, side: 0.17, back: 0.12, vol: (phi, t) => 0.02 * t });
      loft(g, [[0.16, 0.1, 0.108, 0, -0.006], [0.19, 0.098, 0.107, 0, -0.008]], { segs: 9 });
      return;
    }
    if (kind === 'scarf') {
      CLOTH(g);
      hairShell(g, { grow: 0.02, front: 0.2, side: 0.06, back: 0.02, vol: (phi, t) => 0.01 * Math.sin(t * Math.PI) });
      g.ball(0, 0.05, -0.1, 0.05, 0.04, 0.035, { segs: 6, rings: 3 });               // the knot at the nape
      g.tube([[0, 0.04, -0.115], [0.01, -0.02, -0.125], [0.02, -0.08, -0.12]], [0.025, 0.02, 0.012], { segs: 4 });
      return;
    }
    if (kind === 'hat') {
      FELT(g);
      g.lathe(0, -0.008, [[0.098, 0.2], [0.093, 0.27], [0.06, 0.305], [0, 0.31]], { segs: 10, capBottom: false });
      g.lathe(0, -0.008, [[0.098, 0.205], [0.172, 0.2], [0.165, 0.212], [0.098, 0.215]], { segs: 12, capBottom: false, capTop: false });
      g.lathe(0, -0.008, [[0.172, 0.2], [0.098, 0.2]], { segs: 12, capBottom: false, capTop: false });
    }
  };
}
function buildUpperArm(g) { CLOTH(g); loft(g, capRings(-REF.upper, 0.046, 0, 0.051, { zr: 0.94, hemi: 2, mid: 1, czt: -0.004 }), { segs: 6 }); }
function buildForearm(g) { CLOTH(g); loft(g, [[-0.254, 0.02, 0.02], [-0.244, 0.054, 0.052], [-0.1, 0.049, 0.047], [0, 0.05, 0.049], [0.035, 0.035, 0.035], [0.05, 0.002, 0.002]], { segs: 6 }); }
function buildCuff(g) { CLOTH(g); loft(g, [[-0.25, 0.058, 0.056], [-0.206, 0.056, 0.054]], { segs: 6 }); }
function buildHand(side) {
  return (g) => {
    SKIN(g);
    loft(g, closeRings([[-0.135, 0.018, 0.034, 0, 0.004], [-0.08, 0.023, 0.044, 0, 0.003], [-0.015, 0.022, 0.036], [0.02, 0.02, 0.029]], 0.6, 0.2, true), { segs: 6 });
    g.push(); g.move(-side * 0.014, -0.052, 0.036); g.rotX(-0.5); g.rotZ(side * 0.25); g.ball(0, -0.012, 0, 0.014, 0.03, 0.015, { segs: 4, rings: 2 }); g.pop();
  };
}
function buildThigh(g) { CLOTH(g); loft(g, capRings(-REF.thigh, 0.07, 0, 0.094, { zr: 0.97, hemi: 2, mid: 1, aoB: 0.95 }), { segs: 6 }); }
function buildShin(g) { CLOTH(g); loft(g, [[-0.43, 0.02, 0.02, 0, 0.012], [-0.412, 0.076, 0.078, 0, 0.012, 0.85], [-0.2, 0.062, 0.064, 0, 0.0], [0, 0.068, 0.068, 0, 0.0], [0.045, 0.045, 0.045], [0.068, 0.002, 0.002]], { segs: 6 }); }
function buildFoot(g) {
  g.mat('leather', '#ffffff', { rough: 0.15 });
  const sole = -REF.ankle;
  const L = [[-0.075, 0.004, 0.004], [-0.06, 0.034, 0.038], [-0.02, 0.042, 0.048], [0.06, 0.048, 0.04], [0.15, 0.046, 0.03], [0.188, 0.028, 0.02], [0.198, 0.004, 0.004]];
  // draw directly in foot space (no rotation): rings along z
  const segs = 6; const n = L.length; const Q = new Float64Array(n * segs * 3);
  for (let i = 0; i < n; i++) for (let s = 0; s < segs; s++) {
    const a = s / segs * TAU, k = (i * segs + s) * 3; const hw = L[i][1], hh = L[i][2] + 0.006, cy = sole + L[i][2];
    let y = cy + Math.sin(a) * hh; if (y < sole) y = sole;
    Q[k] = Math.cos(a) * hw; Q[k + 1] = y; Q[k + 2] = L[i][0];
  }
  // emit with rings running along z: reuse emitGrid (it only needs the grid and per-ring radii)
  emitGrid(g, Q, n, segs, L.map((r) => [r[0], r[1], r[2]]), {}, true);
  // a darker sole band
  g.mat('leather', '#5a4a3e', { rough: 0.2 });
  g.box(-0.04, sole - 0.002, -0.06, 0.04, sole + 0.012, 0.17, { faces: 'xXyzZ' });
}
// garments (pelvis bone)
const HEM = {
  short: [[-0.29, 0.205, 0.165], [-0.2, 0.198, 0.156], [-0.08, 0.19, 0.145], [0.0, 0.18, 0.134], [0.07, 0.17, 0.122], [0.13, 0.152, 0.108]],
  long: [[-0.62, 0.245, 0.215], [-0.45, 0.228, 0.195], [-0.3, 0.212, 0.175], [-0.15, 0.196, 0.155], [0.0, 0.181, 0.135], [0.07, 0.17, 0.122], [0.13, 0.152, 0.108]],
  skirt: [[-0.7, 0.3, 0.27], [-0.5, 0.265, 0.235], [-0.3, 0.228, 0.198], [-0.12, 0.198, 0.158], [0.0, 0.182, 0.136], [0.07, 0.17, 0.122], [0.13, 0.152, 0.108]],
};
function buildHem(kind) { return (g) => { CLOTH(g); const R = HEM[kind]; loft(g, R.length > 6 ? pick(R, [0, 1, 3, 4, 6]) : pick(R, [0, 2, 3, 5]), { segs: 9 }); }; }
// sitting: a lap of cloth over the thighs (rings in the x-y plane, stepping along z), and a curtain from the knees for long ones
function buildHemSit(kind) {
  return (g) => {
    CLOTH(g);
    const len = kind === 'short' ? 0.3 : 0.44, segs = 8;
    const L = [[-0.13, 0.15, 0.1], [-0.06, 0.18, 0.12], [0.12, 0.2, 0.11], [len - 0.03, 0.195, 0.095], [len + 0.012, 0.1, 0.03]];
    const n = L.length, Q = new Float64Array(n * segs * 3);
    for (let i = 0; i < n; i++) for (let s = 0; s < segs; s++) {
      const a = s / segs * TAU, k = (i * segs + s) * 3; const cy = -0.005 + (i < 2 ? 0.04 : 0);
      Q[k] = Math.cos(a) * L[i][1]; Q[k + 1] = cy + Math.sin(a) * L[i][2]; Q[k + 2] = L[i][0];
      if (Q[k + 1] < -0.11) Q[k + 1] = -0.11;
    }
    emitGrid(g, Q, n, segs, L, {}, true);
    if (kind !== 'short') {
      const drop = kind === 'skirt' ? 0.5 : 0.38, w = kind === 'skirt' ? 0.25 : 0.21;
      slab(g, 4, 2, (u, v) => { const x = (u - 0.5) * 2 * w; return [x, 0.04 - v * drop, len + 0.02 + v * 0.03 - 0.03 * (1 - (2 * u - 1) * (2 * u - 1)) * -1]; }, 0.012, [0, 0, 1]);
      // the back of the garment, falling behind the seat
      slab(g, 3, 1, (u, v) => { const x = (u - 0.5) * 2 * (w - 0.03); return [x, 0.0 - v * 0.12, -0.13 - v * 0.04]; }, 0.012, [0, 0, -1]);
    }
  };
}
function buildApron(kind) {
  return (g) => {
    CLOTH(g);
    if (kind === 'skirt') { slab(g, 4, 3, (u, v) => { const x = (u - 0.5) * 0.34, y = 0.12 - v * 0.62; const r = ringAt(HEM.long, y); const zf = Math.sqrt(Math.max(0, 1 - Math.pow(x / (r[0] + 0.01), 2))) * (r[1] + 0.012); return [x, y, zf + 0.012]; }, 0.008, [0, 0, 1]); return; }
    if (kind === 'lap') { slab(g, 4, 5, (u, v) => { const x = (u - 0.5) * 0.34; const path = [[0.12, 0.13], [0.06, 0.15], [0.115, 0.24], [0.11, 0.43], [-0.1, 0.47], [-0.3, 0.47]]; const f = v * (path.length - 1), i = Math.min(path.length - 2, Math.floor(f)), t = f - i; return [x, lerp(path[i][0], path[i + 1][0], t), lerp(path[i][1], path[i + 1][1], t)]; }, 0.008, [0, 1, 0.3]); return; }
    // the bib, on the chest
    slab(g, 4, 3, (u, v) => { const y = 0.0 + v * 0.31, w = lerp(0.13, 0.09, v); const x = (u - 0.5) * 2 * w; const r = ringAt(CHEST_R, y); const zf = r[2] + Math.sqrt(Math.max(0, 1 - Math.pow(x / (r[0] + 0.004), 2))) * (r[1] + 0.008); return [x, y, zf + 0.004]; }, 0.007, [0, 0, 1]);
    g.tube([[-0.07, 0.31, 0.1], [-0.07, 0.42, 0.03], [0, 0.445, -0.06], [0.07, 0.42, 0.03], [0.07, 0.31, 0.1]], 0.008, { segs: 3 });
  };
}
function buildCollar(g) {
  CLOTH(g);
  loft(g, [[0.4, 0.088, 0.078, 0, -0.008], [0.43, 0.074, 0.066, 0, -0.012], [0.462, 0.062, 0.058, 0, -0.012]], { segs: 9 });
  // the lapels of a wrap: two bands meeting low on the chest
  for (const s of [-1, 1]) slab(g, 1, 3, (u, v) => { const y = lerp(0.42, 0.2, v), x = s * lerp(0.07, 0.0, v) + (u - 0.5) * 0.045 * (1 - v * 0.5); const r = ringAt(CHEST_R, y); const zf = r[2] + Math.sqrt(Math.max(0, 1 - Math.pow(x / (r[0] + 0.004), 2))) * (r[1] + 0.006); return [x, y, zf + 0.003]; }, 0.006, [0, 0, 1]);
}
function buildShawl(g) {
  CLOTH(g);
  // a cape over the shoulders, longer behind, with the two ends falling down the front
  const R = [[0.14, 0.2, 0.135, 0, -0.012], [0.29, 0.196, 0.124, 0, -0.006], [0.37, 0.172, 0.104, 0, -0.01], [0.425, 0.095, 0.074, 0, -0.012], [0.45, 0.07, 0.062, 0, -0.012]];
  const segs = 11, n = R.length, P = new Float64Array(n * segs * 3);
  for (let i = 0; i < n; i++) for (let k = 0; k < segs; k++) {
    const a = k / segs * TAU, j = (i * segs + k) * 3; let y = R[i][0];
    const front = Math.max(0, Math.sin(a));                       // +z is the front
    if (i === 0) y += 0.1 * front * front - 0.06 * Math.max(0, -Math.sin(a));
    P[j] = Math.cos(a) * R[i][1]; P[j + 1] = y; P[j + 2] = R[i][4] + Math.sin(a) * R[i][2];
  }
  emitGrid(g, P, n, segs, R, {}, false);
  const Q = new Float64Array(P.length); for (let i = 0; i < n; i++) for (let k = 0; k < segs; k++) { const j = (i * segs + k) * 3, a = k / segs * TAU; Q[j] = P[j] - Math.cos(a) * 0.01; Q[j + 1] = P[j + 1]; Q[j + 2] = P[j + 2] - Math.sin(a) * 0.01; }
  emitGrid(g, Q, n, segs, R, {}, true);
  for (const sd of [-1, 1]) slab(g, 1, 3, (u, v) => { const y = lerp(0.38, 0.02, v), x = sd * (0.075 + 0.02 * v) + (u - 0.5) * 0.07; const r = ringAt(CHEST_R, Math.max(y, -0.04)); const zf = r[2] + Math.sqrt(Math.max(0, 1 - Math.pow(x / (r[0] + 0.004), 2))) * (r[1] + 0.012); return [x, y, zf + 0.004]; }, 0.01, [0, 0, 1]);
}
function buildKerchief(g) {
  CLOTH(g);
  loft(g, [[0.395, 0.09, 0.08, 0, -0.008], [0.425, 0.078, 0.07, 0, -0.012], [0.45, 0.066, 0.062, 0, -0.012]], { segs: 9 });
  slab(g, 2, 2, (u, v) => { const y = lerp(0.41, 0.3, v), x = (u - 0.5) * 0.14 * (1 - v * 0.92); const r = ringAt(CHEST_R, y); const zf = r[2] + Math.sqrt(Math.max(0, 1 - Math.pow(x / (r[0] + 0.004), 2))) * (r[1] + 0.008); return [x, y, zf + 0.004]; }, 0.006, [0, 0, 1]);
}
function buildSash(g) {
  CLOTH(g);
  loft(g, [[0.07, 0.186, 0.14, 0, -0.008], [0.11, 0.178, 0.132, 0, -0.004], [0.155, 0.166, 0.122, 0, 0.0]], { segs: 10 });
  for (const dx of [0, 0.035]) slab(g, 1, 2, (u, v) => [0.15 + dx + (u - 0.5) * 0.04, 0.1 - v * 0.2, 0.085 - dx * 0.4], 0.006, [0.6, 0, 0.8]);
  g.ball(0.158, 0.11, 0.092, 0.025, 0.022, 0.018, { segs: 5, rings: 3 });
}
function buildBag(g) {
  g.mat('leather', '#ffffff', { rough: 0.05 });
  g.box(0.175, -0.2, -0.04, 0.235, 0.01, 0.17, { bevel: 0.015 });
  g.mat('leather', '#d8d0c8'); g.box(0.232, -0.06, -0.035, 0.24, 0.012, 0.165, { bevel: 0.006 });
}
function buildStrap(g) {
  g.mat('leather', '#ffffff');
  g.tube([[-0.11, 0.39, 0.09], [-0.04, 0.29, 0.122], [0.06, 0.17, 0.128], [0.15, 0.04, 0.115], [0.19, -0.06, 0.08]], 0.011, { segs: 3 });
  g.tube([[-0.11, 0.39, 0.09], [-0.135, 0.42, 0.0], [-0.11, 0.39, -0.085], [-0.03, 0.28, -0.115], [0.08, 0.15, -0.12], [0.19, -0.06, -0.08]], 0.011, { segs: 3 });
}
function buildSpecs(g) {
  g.mat('cast', '#ffffff', { rough: -0.2 });
  for (const s of [-1, 1]) {
    const ring = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ring.push([s * 0.032 + Math.cos(a) * 0.019, 0.133 + Math.sin(a) * 0.015, 0.104]); }
    g.tube(ring, 0.0028, { segs: 3, closed: true });
    g.tube([[s * 0.051, 0.136, 0.102], [s * 0.088, 0.14, 0.06], [s * 0.09, 0.13, -0.01]], 0.0025, { segs: 4 });
  }
  g.tube([[-0.013, 0.138, 0.106], [0, 0.142, 0.108], [0.013, 0.138, 0.106]], 0.0025, { segs: 4 });
}
function buildPatch(g) { CLOTH(g); g.box(-0.035, -0.035, -0.004, 0.035, 0.035, 0.004, { faces: 'xXyYZ' }); }

// ----- held things (each in its own space; see ATTACH in people_poses.js for how they are held)
function buildItem(kind) {
  return (g) => {
    switch (kind) {
      case 'cup': g.mat('glaze', '#ffffff'); g.lathe(0, 0, [[0, 0], [0.028, 0], [0.038, 0.012], [0.042, 0.085], [0.039, 0.088]], { segs: 8 }); g.mat('glaze', '#cfc6b4'); g.lathe(0, 0, [[0.045, 0.086], [0.042, 0.095], [0.013, 0.104], [0.013, 0.114], [0, 0.116]], { segs: 8, capBottom: false }); break;
      case 'bowl': g.mat('glaze', '#ffffff'); g.lathe(0, 0, [[0, 0], [0.045, 0], [0.05, 0.008], [0.082, 0.045], [0.088, 0.064]], { segs: 9 }); g.mat('glaze', '#d9cfba'); g.lathe(0, 0, [[0.09, 0.063], [0.085, 0.07], [0.05, 0.092], [0.014, 0.1], [0.014, 0.112], [0, 0.114]], { segs: 9, capBottom: false }); break;
      case 'plate': g.mat('glaze', '#ffffff'); g.lathe(0, 0, [[0, 0], [0.07, 0], [0.12, 0.014], [0.118, 0.019], [0.07, 0.008], [0, 0.007]], { segs: 16 }); g.mat('glaze', '#c9b89a'); g.lathe(0, 0, [[0.1, 0.012], [0.08, 0.05], [0.02, 0.07], [0, 0.072]], { segs: 14, capBottom: false }); break;
      case 'basket': g.mat('cane', '#ffffff'); g.lathe(0, 0, [[0, -0.3], [0.12, -0.3], [0.16, -0.26], [0.18, -0.12], [0.175, -0.1]], { segs: 14, capTop: false }); g.mat('cane', '#b89a6a'); g.tube([[-0.16, -0.12, 0], [-0.12, 0.02, 0], [0, 0.06, 0], [0.12, 0.02, 0], [0.16, -0.12, 0]], 0.01, { segs: 5 }); g.mat('plain', '#8a9a4a'); g.ball(0.03, -0.12, 0.02, 0.08, 0.035, 0.07, { segs: 8, rings: 4 }); g.mat('plain', '#c9552e'); g.ball(-0.06, -0.11, -0.03, 0.04, 0.04, 0.04, { segs: 8, rings: 5 }); break;
      case 'flute': g.mat('wood', '#ffffff', { rough: -0.15 }); g.push(); g.rotZ(-Math.PI / 2); g.cyl(0, 0, 0, 0.017, 1.2, { segs: 10 }); g.pop(); g.mat('cast', '#c8a45a'); for (const x of [0.02, 0.4, 0.75, 1.16]) { g.push(); g.rotZ(-Math.PI / 2); g.cyl(0, x, 0, 0.02, 0.03, { segs: 10 }); g.pop(); } g.mat('plain', '#2a1e18'); for (let i = 0; i < 7; i++) g.ball(0.45 + i * 0.07, 0.0, 0.016, 0.006, 0.006, 0.003, { segs: 6, rings: 3 }); g.ball(0.05, 0.0, 0.016, 0.008, 0.005, 0.003, { segs: 6, rings: 3 }); break;
      case 'book': g.mat('leather', '#ffffff'); g.box(-0.08, -0.11, -0.016, 0.08, 0.11, 0.016, { bevel: 0.004 }); g.mat('paper', '#efe6d0'); g.box(-0.076, -0.106, -0.012, 0.078, 0.106, 0.012); break;
      case 'bookopen': g.mat('leather', '#ffffff'); for (const s of [-1, 1]) { g.push(); g.rotY(s * 0.25); g.box(s > 0 ? 0 : -0.16, -0.11, -0.006, s > 0 ? 0.16 : 0, 0.11, 0.0); g.mat('paper', '#f2ead8'); g.box(s > 0 ? 0.004 : -0.152, -0.104, 0.0, s > 0 ? 0.152 : -0.004, 0.104, 0.012); g.mat('leather', '#ffffff'); g.pop(); } break;
      case 'lamp': g.mat('cast', '#ffffff'); g.cyl(0, -0.2, 0, 0.055, 0.02, { segs: 10 }); g.cyl(0, -0.06, 0, 0.045, 0.025, { segs: 10 }); g.tube([[-0.045, -0.04, 0], [-0.03, 0.02, 0], [0, 0.035, 0], [0.03, 0.02, 0], [0.045, -0.04, 0]], 0.004, { segs: 4 }); g.mat('diffuser', '#ffd9a0', { emissive: 6 }); g.lathe(0, 0, [[0.03, -0.18], [0.045, -0.15], [0.045, -0.09], [0.03, -0.06]], { segs: 10 }); break;
      case 'crate': g.mat('wood', '#ffffff', { rough: 0.1 }); g.box(-0.25, -0.15, -0.17, 0.25, 0.15, 0.17, { bevel: 0.012 }); g.mat('wood', '#8a6a44'); for (const y of [-0.06, 0.06]) g.box(-0.255, y - 0.012, -0.175, 0.255, y + 0.012, 0.175); g.mat('plain', '#c9552e'); for (let i = 0; i < 5; i++) g.ball(-0.16 + i * 0.08, 0.16, (i % 2) * 0.06 - 0.03, 0.04, 0.035, 0.04, { segs: 8, rings: 5 }); break;
      case 'ball': g.mat('felt', '#ffffff'); g.ball(0, 0, 0, 0.09, 0.09, 0.09, { segs: 9, rings: 6 }); g.mat('felt', '#f0ead8'); g.lathe(0, 0, [[0.0915, -0.012], [0.0915, 0.012]], { segs: 16, capTop: false, capBottom: false }); break;
      case 'spoon': g.mat('cast', '#d8d0c0', { rough: -0.2 }); g.tube([[0, 0, 0], [0, -0.13, 0.01]], 0.005, { segs: 4 }); g.ball(0, -0.15, 0.012, 0.018, 0.026, 0.007, { segs: 8, rings: 4 }); break;
      case 'sticks': g.mat('wood', '#ffffff'); g.tube([[0.004, 0.02, 0], [0.012, -0.2, 0.01]], [0.004, 0.002], { segs: 4 }); g.tube([[-0.004, 0.02, 0], [-0.008, -0.2, 0.014]], [0.004, 0.002], { segs: 4 }); break;
      case 'cane': g.mat('wood', '#ffffff', { rough: -0.1 }); g.tube([[0.07, 0.02, 0], [0.03, 0.04, 0], [0, 0, 0], [0, -0.85, 0]], 0.011, { segs: 6 }); g.mat('leather', '#2a2018'); g.cyl(0, -0.86, 0, 0.014, 0.025, { segs: 6 }); break;
      case 'broom': g.mat('wood', '#ffffff'); g.tube([[0, 0.5, 0], [0, -0.8, 0]], 0.014, { segs: 6 }); g.mat('cane', '#d8b878'); g.lathe(0, 0, [[0.03, -0.8], [0.07, -0.95], [0.11, -1.06], [0.0, -1.07]], { segs: 10, capTop: false }); break;
      case 'slate': g.mat('plain', '#3a3a44', { rough: -0.2 }); g.box(-0.045, -0.07, -0.004, 0.045, 0.07, 0.004, { bevel: 0.003 }); g.mat('plain', '#bfe0e4', { emissive: 1.2 }); g.box(-0.04, -0.062, 0.0035, 0.04, 0.062, 0.0045); break;
      case 'board': g.mat('wood', '#ffffff'); g.box(-0.09, -0.12, -0.005, 0.09, 0.12, 0.005, { bevel: 0.003 }); g.mat('paper', '#f2ead8'); g.box(-0.08, -0.11, 0.004, 0.08, 0.1, 0.007); g.mat('cast', '#c8a45a'); g.box(-0.03, 0.095, 0.005, 0.03, 0.12, 0.012); break;
      case 'ladle': g.mat('cast', '#d8d0c0', { rough: -0.2 }); g.tube([[0, 0.02, 0], [0, -0.3, 0.02]], 0.007, { segs: 5 }); g.lathe(0, 0.03, [[0.0, -0.36], [0.03, -0.355], [0.045, -0.33], [0.047, -0.31]], { segs: 10, capTop: false }); break;
      case 'drum': g.mat('wood', '#ffffff'); g.lathe(0, 0, [[0.07, -0.32], [0.09, -0.3], [0.08, -0.22], [0.06, -0.14], [0.11, -0.05], [0.14, 0.0], [0.14, 0.01]], { segs: 14 }); g.mat('leather', '#e8dcc0'); g.cyl(0, 0.008, 0, 0.142, 0.01, { segs: 16 }); g.mat('weave', '#c9552e'); g.lathe(0, 0, [[0.112, -0.06], [0.112, -0.03]], { segs: 14, capTop: false, capBottom: false }); break;
      case 'cloth': CLOTH(g); slab(g, 6, 4, (u, v) => [(u - 0.5) * 0.3, Math.sin(u * 3.0) * 0.015 - (v - 0.5) * 0.04, (v - 0.5) * 0.22 + Math.sin(v * 4 + u * 2) * 0.01], 0.008, [0, 1, 0]); break;
      case 'brush': g.mat('wood', '#ffffff'); g.tube([[0, 0.02, 0], [0, -0.16, 0]], 0.006, { segs: 5 }); g.mat('felt', '#3a2a20'); g.cyl(0, -0.2, 0, 0.012, 0.04, { r1: 0.007, segs: 6 }); break;
      case 'knife': g.mat('wood', '#ffffff'); g.tube([[0, 0, 0], [0, -0.07, 0]], 0.01, { segs: 5 }); g.mat('cast', '#d8d8d8', { rough: -0.25 }); g.box(-0.002, -0.17, -0.012, 0.002, -0.07, 0.01); break;
      default: break;
    }
  };
}

// LOD shapes: the middle figure (~190 triangles), the far one (~40), and the shadow stand-ins (~70, drawn only into shadow maps)
function buildL1Body(g) {
  CLOTH(g);
  loft(g, closeRings([[-0.3, 0.2, 0.16], [0.0, 0.176, 0.128], [0.26, 0.162, 0.117, 0, 0.01], [0.45, 0.176, 0.104], [0.53, 0.1, 0.07]], 0.25, 0.3, true), { segs: 6 });
  for (const s of [-1, 1]) { g.push(); g.move(s * 0.19, 0.46, -0.005); g.rotZ(s * 0.06); loft(g, [[-0.64, 0.002, 0.002], [-0.6, 0.045, 0.045], [0, 0.055, 0.055], [0.05, 0.002, 0.002]], { segs: 4, phase: 0.785 }); g.pop(); }
}
function buildL1Leg(g) {
  CLOTH(g);
  loft(g, [[-0.88, 0.002, 0.002, 0, 0.03], [-0.84, 0.06, 0.08, 0, 0.03], [-0.4, 0.062, 0.062], [0, 0.088, 0.088], [0.06, 0.002, 0.002]], { segs: 4, phase: 0.785, col: (x, y) => y < -0.76 ? [110, 96, 86] : null });
}
function buildL1Head(g) { SKIN(g); loft(g, [[-0.03, 0.002, 0.002], [0.0, 0.045, 0.045], [0.08, 0.07, 0.08, 0, 0.01], [0.17, 0.088, 0.1], [0.24, 0.06, 0.07], [0.268, 0.002, 0.002]], { segs: 6 }); }
function buildL1Hair(g) { HAIR(g); hairShell(g, { grow: 0.014, front: 0.19, side: 0.12, back: 0.07, segs: 6, rings: 2 }); }
function buildL2Body(g) { CLOTH(g); loft(g, [[0.0, 0.002, 0.002], [0.04, 0.1, 0.08], [0.9, 0.17, 0.12], [1.38, 0.18, 0.1], [1.45, 0.002, 0.002]], { segs: 4, phase: 0.785, col: (x, y) => y < 0.8 ? [150, 140, 132] : null }); }
function buildL2Head(g) { SKIN(g); g.ball(0, 0, 0, 0.088, 0.115, 0.1, { segs: 4, rings: 2 }); }
function buildShadowBody(g) { CLOTH(g); loft(g, [[-0.3, 0.002, 0.002], [-0.22, 0.17, 0.13], [0.5, 0.17, 0.11], [0.62, 0.08, 0.08], [0.72, 0.09, 0.1], [0.83, 0.002, 0.002]], { segs: 5 }); }
function buildShadowLeg(g) { CLOTH(g); loft(g, [[-0.88, 0.002, 0.002], [-0.82, 0.06, 0.06], [0, 0.08, 0.08], [0.05, 0.002, 0.002]], { segs: 4 }); }

// Every shape that people are made of, by name -> builder, and how many instances it may need.
const SHAPES = {
  pelvis: [buildPelvis, 'body'], chest: [buildChest, 'body'], head: [buildHead, 'body'],
  'hair-short': [buildHair('short'), 'opt'], 'hair-cropped': [buildHair('cropped'), 'opt'], 'hair-long': [buildHair('long'), 'opt'], 'hair-tied': [buildHair('tied'), 'opt'],
  'hair-bun': [buildHair('bun'), 'opt'], 'hair-bald': [buildHair('bald'), 'opt'], 'hair-under': [buildHair('under'), 'opt'], 'hair-brows': [buildHair('brows'), 'opt'],
  'hw-cap': [buildHeadwear('cap'), 'few'], 'hw-scarf': [buildHeadwear('scarf'), 'opt'], 'hw-hat': [buildHeadwear('hat'), 'few'],
  upperarm: [buildUpperArm, 'pair'], forearm: [buildForearm, 'pair'], cuff: [buildCuff, 'pair'], 'hand-l': [buildHand(1), 'body'], 'hand-r': [buildHand(-1), 'body'],
  thigh: [buildThigh, 'pair'], shin: [buildShin, 'pair'], foot: [buildFoot, 'pair'],
  'hem-short': [buildHem('short'), 'opt'], 'hem-long': [buildHem('long'), 'opt'], 'hem-skirt': [buildHem('skirt'), 'opt'],
  'hemsit-short': [buildHemSit('short'), 'opt'], 'hemsit-long': [buildHemSit('long'), 'opt'], 'hemsit-skirt': [buildHemSit('skirt'), 'opt'],
  'apron-bib': [buildApron('bib'), 'few'], 'apron-skirt': [buildApron('skirt'), 'few'], 'apron-lap': [buildApron('lap'), 'few'],
  collar: [buildCollar, 'opt'], shawl: [buildShawl, 'few'], kerchief: [buildKerchief, 'few'], sash: [buildSash, 'opt'], bag: [buildBag, 'few'], strap: [buildStrap, 'few'],
  specs: [buildSpecs, 'few'], patch: [buildPatch, 'opt'],
  'l1-body': [buildL1Body, 'l1'], 'l1-leg': [buildL1Leg, 'l1pair'], 'l1-head': [buildL1Head, 'l1'], 'l1-hair': [buildL1Hair, 'l1'],
  'l2-body': [buildL2Body, 'l2'], 'l2-head': [buildL2Head, 'l2'],
  'sh-body': [buildShadowBody, 'shadow'], 'sh-leg': [buildShadowLeg, 'shadow2'],
};
export const ITEMS = ['cup', 'bowl', 'plate', 'basket', 'flute', 'book', 'bookopen', 'lamp', 'crate', 'ball', 'spoon', 'sticks', 'cane', 'broom', 'slate', 'board', 'ladle', 'drum', 'cloth', 'brush', 'knife'];
for (const k of ITEMS) SHAPES['item-' + k] = [buildItem(k), 'item'];

// ---------------------------------------------------------------------------------------------------------------
// The instanced meshes
// ---------------------------------------------------------------------------------------------------------------
export class PartMesh {
  constructor(name, geom, cap, mat) {
    this.name = name; this.cap = cap; this.count = 0;
    geom.setAttribute('aInst', new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4));
    const mesh = this.mesh = new THREE.InstancedMesh(geom, mat, cap);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    geom.attributes.aInst.setUsage(THREE.DynamicDrawUsage);
    this.M = mesh.instanceMatrix.array; this.C = geom.attributes.aInst.array;
    this.tris = geom.index ? geom.index.count / 3 : 0;
    mesh.count = 0;
  }
}
export function createPartMeshes(game, density = 1) {
  const caps = { body: 140, pair: 280, opt: 140, few: 80, l1: 220, l1pair: 440, l2: 700, item: 70, shadow: 140, shadow2: 280 };
  const out = new Map(), list = [];
  const mat = game.world.mats.inst;
  for (const name in SHAPES) {
    const [fn, kind] = SHAPES[name];
    const g = new Geo(new MeshBuf(1024, 2048));
    fn(g);
    const pm = new PartMesh(name, g.buf.toGeometry(), caps[kind], mat);
    pm.idx = list.length; out.set(name, pm); list.push(pm);
  }
  return { byName: out, list };
}

// ---------------------------------------------------------------------------------------------------------------
// Looks: who a person is to look at
// ---------------------------------------------------------------------------------------------------------------
const SKINS = ['#3a2418', '#4a2e22', '#5a3828', '#6b4430', '#7a4a32', '#8a5a3c', '#8f5e40', '#9c6b4a', '#a8754f', '#b07850', '#c48a62', '#c69c74', '#d8a888', '#e0b49a', '#e8c4aa', '#f0d4c0'];
const HAIR_DARK = ['#141010', '#1a1414', '#1e1512', '#2a1c14', '#2a1a14', '#3a2a20', '#4a3020'];
const HAIR_MID = ['#5a3a22', '#6b4a2f', '#7a5233', '#8a3a1e', '#a0522d', '#c97a3a', '#c9a66b', '#d8b878'];
const HAIR_DYED = ['#3a8a8a', '#7a2a5a', '#2f6f8f', '#c94f6d', '#6c4a7a', '#d05a3a'];
const HAIR_GREY = ['#8c8c8c', '#9a9a9a', '#bdb6aa', '#cfcac0', '#d8d4cc', '#e6e1d8', '#f0ece4'];
const TOPS = ['#c9552e', '#2f6f73', '#3a8a8a', '#d6a640', '#26306b', '#5b4060', '#6c9a4c', '#8a3a2e', '#d4878a', '#e0a040', '#2a6a5a', '#2f6f8f', '#e9e2d0', '#b5653a', '#e0607a', '#7a2a3a', '#3d5a80', '#4f7a3a', '#d98a3a', '#6c4a7a', '#9a2a2a', '#3b4a6a', '#b03a3a', '#7a2a5a', '#f0d070', '#c94f6d', '#4a8a6a', '#1f6a8a', '#a85a2a', '#e8dcc0'];
const LININGS = ['#e8c25a', '#2f6f8f', '#e0607a', '#d6a640', '#26306b', '#3a8a8a', '#f0ead8', '#c9552e', '#5b4060', '#6c9a4c', '#e0a040', '#d4878a', '#f0d070', '#7a2a3a', '#2a6a5a'];
const BOTTOMS = ['#3a3a44', '#4a3b2e', '#2e2a33', '#3a3530', '#2e3036', '#33333d', '#4a4038', '#5a4a3a', '#26306b', '#3a5a3a', '#4a5a6a', '#2a2a30', '#5a3a2a', '#3b4a3f', '#6a4a3a', '#2f4f4a', '#5b4060', '#7a5a3a'];
const SHOES = ['#2a1e18', '#3a2a20', '#1e1a18', '#5a3a22', '#7a4a2a', '#8a2f3c', '#2f4f4a', '#26306b', '#4a3b2e', '#a07a4a', '#3a3a44'];
const PATCHES = ['#e8c25a', '#e0607a', '#3fa7a3', '#f0d070', '#d05a3a', '#6c9a4c', '#c94f6d', '#2f6f8f', '#e9e2d0'];
const APRONS = ['#e9e2d0', '#ece4d0', '#d8ccb0', '#c9b89a', '#2f4f4a', '#5a4a3a', '#8a3a2e'];
const BAGS = ['#6b4a2f', '#7a5233', '#4a3020', '#8a6240', '#3a2a20', '#a07a4a', '#5a3a2a'];

function pickHair(rng, age) {
  if (age > 78 || (age > 58 && rng.chance(0.55)) || (age > 45 && rng.chance(0.18))) return rng.pick(HAIR_GREY);
  const u = rng.next(); if (u < 0.64) return rng.pick(HAIR_DARK); if (u < 0.9) return rng.pick(HAIR_MID); return rng.pick(HAIR_DYED);
}
// look spec -> the full description the rig needs. spec may come from CAST[id].look (fixed) or be generated.
export function makeLook(seed, spec) {
  const rng = new Rng(typeof seed === 'string' ? hashStr(seed) : seed);
  let age = spec && spec.age !== undefined ? spec.age : null;
  if (age === null) { const u = rng.next(); age = u < 1 / 7 ? rng.i(2, 14) : u < 1 / 7 + 1 / 6 ? rng.i(80, 112) : rng.i(15, 79); }
  const child = age < 15, elder = age >= 78;
  const L = {};
  L.age = age; L.child = child; L.elder = elder;
  const build = spec && spec.build ? spec.build : child ? 'child' : elder ? (rng.chance(0.5) ? 'elder' : rng.pick(['slight', 'medium'])) : rng.pick(['slight', 'medium', 'medium', 'medium', 'broad']);
  L.build = build;
  const bw = { slight: 0.9, medium: 1.0, broad: 1.15, child: 0.98, elder: 0.97 }[build] || 1;
  L.bw = bw * (spec && spec.build ? 1 : rng.f(0.95, 1.05));
  if (spec && spec.height) L.H = spec.height;
  else if (child) L.H = clamp(0.76 + 0.058 * age + rng.f(-0.05, 0.05), 0.8, 1.68);
  else { L.H = clamp(1.71 + rng.gauss() * 0.24 - (elder ? 0.04 : 0), 1.5, 1.95); if (age < 17) L.H -= 0.04; }
  L.shoulder = rng.f(0.93, 1.07); L.hips = rng.f(0.93, 1.09);
  const hx = (k, list) => (spec && spec[k]) || rng.pick(list);
  L.skin = (spec && spec.skin) || mixHex(rng.pick(SKINS), rng.pick(SKINS), rng.f(0, 0.4));
  L.hair = (spec && spec.hair) || pickHair(rng, age);
  let hs = spec && spec.hairStyle;
  if (!hs) {
    const u = rng.next();
    hs = u < 0.24 ? 'short' : u < 0.39 ? 'tied' : u < 0.53 ? 'long' : u < 0.63 ? 'bun' : u < 0.78 ? 'cropped' : u < 0.84 ? (age > 40 ? 'bald' : 'cropped') : u < 0.9 ? 'cap' : 'scarf';
    if (child && hs === 'bun' && rng.chance(0.5)) hs = 'tied';
  }
  L.hairStyle = hs;
  L.top = (spec && spec.top) || (child ? rng.pick(TOPS.slice(0, 26)) : rng.pick(TOPS));
  L.lining = (spec && spec.lining) || rng.pick(LININGS);
  if (L.lining === L.top) L.lining = shadeHex(L.top, 1.35);
  L.bottom = (spec && spec.bottom) || (rng.chance(child ? 0.35 : 0.18) ? rng.pick(TOPS) : rng.pick(BOTTOMS));
  L.shoe = rng.pick(SHOES);
  const acc = spec && spec.accent ? [spec.accent] : [];
  if (!spec) {
    if (rng.chance(elder ? 0.32 : 0.1)) acc.push('shawl');
    if (rng.chance(0.13)) acc.push('kerchief');
    if (rng.chance(child ? 0.25 : 0.14)) acc.push('satchel');
    if (rng.chance(elder ? 0.42 : age > 45 ? 0.2 : 0.06)) acc.push('spectacles');
    if (rng.chance(child ? 0.06 : 0.07)) acc.push('hat');
    if (elder && age > 88 && rng.chance(0.35)) acc.push('cane');
    if (!child && rng.chance(0.06)) acc.push('apron');
  }
  L.accents = acc;
  if (spec && spec.apron) L.apron = spec.apron; else if (acc.indexOf('apron') >= 0) L.apron = rng.pick(APRONS);
  // what they wear over the trousers
  const gu = rng.next();
  L.garment = spec && spec.garment ? spec.garment : gu < 0.34 ? 'short' : gu < 0.58 ? 'long' : gu < 0.8 ? 'skirt' : 'none';
  if (child && L.garment === 'long') L.garment = 'short';
  if (L.garment === 'skirt') { L.skirt = (spec && spec.bottom && rng.chance(0.5)) ? spec.bottom : rng.pick(TOPS); if (L.skirt === L.top) L.skirt = rng.pick(LININGS); }
  L.accentCol = rng.pick(LININGS.concat(TOPS.slice(0, 12)));
  if (L.accentCol === L.top) L.accentCol = L.lining;
  L.hat = rng.pick(['#4a3b2e', '#26306b', '#7a2a3a', '#2f4f4a', '#c9a66b', '#5b4060', '#d6a640']);
  L.headCloth = hs === 'cap' ? (spec && spec.apron ? '#f2ede2' : rng.pick(['#e9e2d0', L.lining, '#2f4f4a', '#c9552e'])) : hs === 'scarf' ? (spec && spec.lining ? spec.lining : rng.pick(LININGS.concat(TOPS.slice(0, 10)))) : null;
  L.sash = rng.chance(0.42) ? rng.pick(LININGS) : null;
  L.collar = rng.chance(0.75);
  L.bag = rng.pick(BAGS);
  L.metal = rng.pick(['#2a2420', '#c8a45a', '#5a4a40', '#8a8a90']);
  if (rng.chance(child ? 0.15 : 0.32)) L.patch = { where: rng.pick(['chest', 'thigh', 'upper', 'fore', 'hem']), col: rng.pick(PATCHES), side: rng.sign(), rot: rng.f(-0.4, 0.4) };
  L.handed = rng.chance(0.1) ? -1 : 1;
  L.habit = child ? rng.pick(['hang', 'hang', 'hips', 'back']) : elder ? rng.pick(['back', 'front', 'hang', 'front']) : rng.pick(['hang', 'hang', 'front', 'back', 'fold', 'hips']);
  L.stoop = elder ? rng.f(0.08, 0.24) + (age > 95 ? 0.08 : 0) : rng.f(-0.02, 0.04);
  L.voice = spec && spec.voice ? spec.voice : { pitch: child ? rng.f(1.35, 1.6) : rng.f(0.85, 1.15), speed: rng.f(0.9, 1.15), timbre: child ? 'child' : elder ? 'elder' : rng.pick(['warm', 'bright', 'low', 'warm']) };
  return L;
}

// proportions: head ratio and leg fraction by age
function headRatio(age) { return age < 2 ? 4.3 : age < 7 ? lerp(4.3, 5.6, (age - 2) / 5) : age < 13 ? lerp(5.6, 6.6, (age - 7) / 6) : age < 18 ? lerp(6.6, 7.0, (age - 13) / 5) : 7.0; }
function legFrac(age) { return age < 2 ? 0.4 : age < 8 ? lerp(0.4, 0.465, (age - 2) / 6) : age < 14 ? lerp(0.465, 0.505, (age - 8) / 6) : age < 18 ? lerp(0.505, 0.518, (age - 14) / 4) : 0.518; }

// A person's dimensions and their part list (which shapes, on which bones, with what offset, scale and colour).
export function makeBody(L, meshes) {
  const H = L.H, hk = H / 1.7;
  const kHead = (H / headRatio(L.age)) / (REF.crown - REF.chin) * 0.98;
  const legLen = H * legFrac(L.age);
  const kLeg = legLen / REF.hip;
  const neckBase = H - REF.crown * kHead;
  const kTorso = (neckBase - legLen) / (REF.waist + REF.neck);
  const kArm = hk * (L.child ? 0.96 : 1);
  const w = L.bw * Math.pow(hk, L.child ? 1.0 : 0.85);
  const wSh = w * L.shoulder, wHip = w * L.hips, wLimb = Math.pow(L.bw, 0.5) * Math.pow(hk, L.child ? 0.95 : 0.8);
  const D = {
    H, kHead, kLeg, kTorso, kArm, w, wSh, wHip, wLimb,
    hipY: legLen, hipW: REF.hipW * wHip, thigh: REF.thigh * kLeg, shin: REF.shin * kLeg, ankle: REF.ankle * kLeg,
    waist: REF.waist * kTorso, neck: REF.neck * kTorso, shX: REF.shoulderX * wSh, shY: REF.shoulderY * kTorso,
    upper: REF.upper * kArm, fore: REF.fore * kArm, hand: REF.hand * kArm, footLen: 0.25 * Math.max(kLeg, 0.6) * (L.child ? 1.05 : 1),
  };
  D.reach = D.upper + D.fore;
  const lin = (hex) => { const c = hexLin(hex); return [c[0], c[1], c[2], 1]; };
  const C = {
    skin: lin(L.skin), hair: lin(L.hair), top: lin(L.top), lining: lin(L.lining), bottom: lin(L.bottom), shoe: lin(L.shoe),
    apron: L.apron ? lin(L.apron) : null, accent: lin(L.accentCol), hat: lin(L.hat), head: L.headCloth ? lin(L.headCloth) : null,
    sash: L.sash ? lin(L.sash) : null, bag: lin(L.bag), metal: lin(L.metal), skirt: L.skirt ? lin(L.skirt) : null, patch: L.patch ? lin(L.patch.col) : null,
  };
  const P = [];
  const add = (name, bone, o, s, col, cond, rs) => { const pm = meshes.get(name); if (!pm) return; P.push({ pm: pm.idx, b: bone, o, s, c: col, cond: cond || 0, rs: rs || null, fl: 0 }); };
  const sT = [wHip, kTorso, wHip * 0.98], sC = [wSh, kTorso, w], sH = [kHead, kHead, kHead], sA = [wLimb, kArm, wLimb], sL = [wLimb, kLeg, wLimb];
  add('pelvis', BONE.PELVIS, [0, 0, 0], sT, C.bottom);
  add('chest', BONE.CHEST, [0, 0, 0], sC, C.top);
  add('head', BONE.HEAD, [0, 0, 0], sH, C.skin);
  const hs = L.hairStyle;
  if (hs === 'scarf') { add('hair-brows', BONE.HEAD, [0, 0, 0], sH, C.hair); add('hw-scarf', BONE.HEAD, [0, 0, 0], sH, C.head); }
  else if (hs === 'cap') { add('hair-under', BONE.HEAD, [0, 0, 0], sH, C.hair); add('hw-cap', BONE.HEAD, [0, 0, 0], sH, C.head); }
  else add('hair-' + hs, BONE.HEAD, [0, 0, 0], sH, C.hair);
  if (L.accents.indexOf('hat') >= 0 && hs !== 'scarf' && hs !== 'cap') add('hw-hat', BONE.HEAD, [0, 0, 0], sH, C.hat);
  if (L.accents.indexOf('spectacles') >= 0) add('specs', BONE.HEAD, [0, 0, 0], sH, C.metal);
  for (const [ua, fa, ha, hand] of [[BONE.UA_L, BONE.FA_L, BONE.HA_L, 'hand-l'], [BONE.UA_R, BONE.FA_R, BONE.HA_R, 'hand-r']]) {
    add('upperarm', ua, [0, 0, 0], sA, C.top);
    add('forearm', fa, [0, 0, 0], sA, C.top);
    add('cuff', fa, [0, 0, 0], sA, C.lining);
    add(hand, ha, [0, 0, 0], [kArm * 1.02, kArm, kArm], C.skin);
  }
  const sF = [Math.max(0.75, wLimb), Math.max(kLeg, 0.6), D.footLen / 0.25];
  for (const [th, sh, ft] of [[BONE.TH_L, BONE.SH_L, BONE.FT_L], [BONE.TH_R, BONE.SH_R, BONE.FT_R]]) {
    add('thigh', th, [0, 0, 0], sL, C.bottom);
    add('shin', sh, [0, 0, 0], sL, C.bottom);
    add('foot', ft, [0, 0, 0], sF, C.shoe);
  }
  const gm = L.garment;
  if (gm !== 'none') {
    const col = gm === 'skirt' ? (C.skirt || C.bottom) : C.top;
    const sHem = [wHip, kLeg, wHip * 0.98];
    add('hem-' + gm, BONE.PELVIS, [0, 0, 0], sHem, col, 1); P[P.length - 1].fl = 1;
    add('hemsit-' + gm, BONE.PELVIS, [0, 0, 0], [wHip, kTorso, kLeg], col, 2);
  }
  if (C.sash) add('sash', BONE.PELVIS, [0, 0, 0], [wHip * 1.01, kTorso, wHip], C.sash);
  if (L.collar && L.accents.indexOf('shawl') < 0 && L.accents.indexOf('kerchief') < 0) add('collar', BONE.CHEST, [0, 0, 0], sC, C.lining);
  if (L.accents.indexOf('shawl') >= 0) add('shawl', BONE.CHEST, [0, 0, 0], sC, C.accent);
  if (L.accents.indexOf('kerchief') >= 0) add('kerchief', BONE.CHEST, [0, 0, 0], sC, C.accent);
  if (C.apron) { add('apron-bib', BONE.CHEST, [0, 0, 0], sC, C.apron); add('apron-skirt', BONE.PELVIS, [0, 0, 0], [wHip, kLeg, wHip], C.apron, 1); add('apron-lap', BONE.PELVIS, [0, 0, 0], [wHip, kTorso, kLeg], C.apron, 2); }
  if (L.accents.indexOf('satchel') >= 0) { add('bag', BONE.PELVIS, [0, 0, 0], [wHip, kTorso, wHip], C.bag, 0); add('strap', BONE.CHEST, [0, 0, 0], sC, C.bag); }
  if (L.patch) {
    const pt = L.patch, s = pt.side; let bone, o;
    const cr = Math.cos(pt.rot), sr = Math.sin(pt.rot);
    let rs = [cr, sr, 0, -sr, cr, 0, 0, 0, 1];          // rotation about z, then faced by the cases below
    if (pt.where === 'chest') { bone = BONE.CHEST; const r = ringAt(CHEST_R, 0.2); o = [s * 0.07 * wSh, 0.2 * kTorso, (r[2] + r[1] * 0.92) * w + 0.008]; }
    else if (pt.where === 'thigh') { bone = s > 0 ? BONE.TH_L : BONE.TH_R; o = [0, -0.3 * kLeg, 0.066 * wLimb + 0.004]; }
    else if (pt.where === 'upper') { bone = s > 0 ? BONE.UA_L : BONE.UA_R; o = [0, -0.27 * kArm, -0.046 * wLimb - 0.003]; rs = [-cr, sr, 0, sr, cr, 0, 0, 0, -1]; }
    else if (pt.where === 'fore') { bone = s > 0 ? BONE.FA_L : BONE.FA_R; o = [s * 0.045 * wLimb + s * 0.003, -0.12 * kArm, 0]; rs = s > 0 ? [0, sr, -cr, 0, cr, sr, 1, 0, 0] : [0, sr, cr, 0, cr, -sr, -1, 0, 0]; }
    else { bone = BONE.PELVIS; o = [s * 0.09 * wHip, -0.15 * kLeg, 0.15 * wHip + 0.01]; }
    if (gm === 'none' && pt.where === 'hem') { bone = BONE.CHEST; const r = ringAt(CHEST_R, 0.1); o = [s * 0.08 * wSh, 0.1 * kTorso, (r[2] + r[1] * 0.9) * w + 0.008]; }
    const k = Math.min(1, hk * 1.05);
    add('patch', bone, o, [k, k, k], C.patch, pt.where === 'hem' && gm !== 'none' ? 1 : 0, rs.map((v) => v * k));
  }
  const L1 = [];
  const add1 = (name, bone, o, s, col) => { const pm = meshes.get(name); L1.push({ pm: pm.idx, b: bone, o, s, c: col, cond: 0, rs: null, fl: 0 }); };
  add1('l1-body', BONE.PELVIS, [0, 0, 0], [w, kTorso, w], C.top);
  add1('l1-head', BONE.HEAD, [0, 0, 0], sH, C.skin);
  add1('l1-hair', BONE.HEAD, [0, 0, 0], sH, hs === 'scarf' || hs === 'cap' ? C.head : C.hair);
  add1('l1-leg', BONE.TH_L, [0, 0, 0], [wLimb, kLeg, wLimb], C.bottom);
  add1('l1-leg', BONE.TH_R, [0, 0, 0], [wLimb, kLeg, wLimb], C.bottom);
  const SH = [];
  const kUp = (H - legLen) / 0.82;
  SH.push({ pm: meshes.get('sh-body').idx, b: BONE.PELVIS, o: [0, 0, 0], s: [w, kUp, w], c: C.top, cond: 0, rs: null, fl: 0 });
  for (const tb of [BONE.TH_L, BONE.TH_R]) SH.push({ pm: meshes.get('sh-leg').idx, b: tb, o: [0, 0, 0], s: [wLimb, kLeg, wLimb], c: C.bottom, cond: 0, rs: null, fl: 0 });
  const L2 = [{ pm: meshes.get('l2-body').idx, c: C.top, s: [w, H / 1.7, w] }, { pm: meshes.get('l2-head').idx, c: hs === 'bald' ? C.skin : (C.head || C.hair), s: [kHead, kHead, kHead], y: H - 0.12 * kHead }];
  return { L, D, C, parts: P, l1: L1, l2: L2, sh: SH };
}

// ---------------------------------------------------------------------------------------------------------------
// Solving the skeleton: pose channels (see people_poses.js) -> bone matrices in the frame's flat space.
// A bone matrix is 12 numbers: X axis, Y axis, Z axis (columns), then the translation.
// ---------------------------------------------------------------------------------------------------------------
export const CH = {
  RX: 0, RY: 1, RZ: 2, RYAW: 3, RPITCH: 4, PP: 5, PR: 6, PT: 7, SB: 8, SS: 9, ST: 10, HP: 11, HY: 12, HR: 13,
  AL: 14, AR: 20,           // arm: tx (out), ty (up), tz (forward) in reaches from the shoulder, swivel, wrist pitch, wrist roll
  LL: 26, LR: 31,           // leg: hip flex, abduct, twist, knee, ankle
  FLARE: 36, GROUND: 37, N: 38,
};

const _R = new Float64Array(9), _R2 = new Float64Array(9);
// R = Ry(a) * Rx(b) * Rz(c), stored as columns
export function eulerYXZ(a, b, c, out) {
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  out[0] = ca * cc + sa * sb * sc; out[1] = cb * sc; out[2] = -sa * cc + ca * sb * sc;
  out[3] = -ca * sc + sa * sb * cc; out[4] = cb * cc; out[5] = sa * sc + ca * sb * cc;
  out[6] = sa * cb; out[7] = -sb; out[8] = ca * cb;
  return out;
}
// child = parent * (T(tx,ty,tz) * R) ; parent and child are 12-number bone matrices at offsets pi and ci of arrays
export function compose(Pm, pi, tx, ty, tz, R, Cm, ci) {
  const X0 = Pm[pi], X1 = Pm[pi + 1], X2 = Pm[pi + 2], Y0 = Pm[pi + 3], Y1 = Pm[pi + 4], Y2 = Pm[pi + 5], Z0 = Pm[pi + 6], Z1 = Pm[pi + 7], Z2 = Pm[pi + 8];
  Cm[ci + 9] = Pm[pi + 9] + X0 * tx + Y0 * ty + Z0 * tz; Cm[ci + 10] = Pm[pi + 10] + X1 * tx + Y1 * ty + Z1 * tz; Cm[ci + 11] = Pm[pi + 11] + X2 * tx + Y2 * ty + Z2 * tz;
  for (let k = 0; k < 3; k++) {
    const r0 = R[k * 3], r1 = R[k * 3 + 1], r2 = R[k * 3 + 2];
    Cm[ci + k * 3] = X0 * r0 + Y0 * r1 + Z0 * r2; Cm[ci + k * 3 + 1] = X1 * r0 + Y1 * r1 + Z1 * r2; Cm[ci + k * 3 + 2] = X2 * r0 + Y2 * r1 + Z2 * r2;
  }
}
// a point in a bone's space -> flat
export function bonePoint(Bm, b, x, y, z, out) {
  const i = b * 12; out[0] = Bm[i + 9] + Bm[i] * x + Bm[i + 3] * y + Bm[i + 6] * z; out[1] = Bm[i + 10] + Bm[i + 1] * x + Bm[i + 4] * y + Bm[i + 7] * z; out[2] = Bm[i + 11] + Bm[i + 2] * x + Bm[i + 5] * y + Bm[i + 8] * z; return out;
}
const _v = [0, 0, 0];
// rotation about x only
function rotX(b, out) { const cb = Math.cos(b), sb = Math.sin(b); out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0; out[4] = cb; out[5] = sb; out[6] = 0; out[7] = -sb; out[8] = cb; return out; }
// two-bone arm in the chest's space -> upper, fore and hand matrices (in chest space, written at Cm offsets)
function solveArm(D, side, c, k, Cm, iu, ifo, ih) {
  const sx = side * D.shX, sy = D.shY, sz = -0.005 * D.kTorso;
  const reach = D.reach;
  let dx = side * c[k] * reach, dy = c[k + 1] * reach, dz = c[k + 2] * reach; let d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const a = D.upper, b = D.fore, dmax = (a + b) * 0.995, dmin = Math.abs(a - b) + 0.03;
  if (d < 1e-6) { dx = 0; dy = -1; dz = 0; d = 1; }
  const ux = dx / d, uy = dy / d, uz = dz / d;
  const dd = d < dmin ? dmin : d > dmax ? dmax : d;
  // the pole: elbows point back, down and a little out; swivel turns it about the shoulder-hand line
  let px = side * 0.3, py = -0.35, pz = -1.0;
  const sw = c[k + 3];
  if (sw) { // rotate the pole about u by sw (Rodrigues)
    const cs = Math.cos(sw), sn = Math.sin(sw), dot = px * ux + py * uy + pz * uz;
    const cx = uy * pz - uz * py, cy = uz * px - ux * pz, cz = ux * py - uy * px;
    px = px * cs + cx * sn + ux * dot * (1 - cs); py = py * cs + cy * sn + uy * dot * (1 - cs); pz = pz * cs + cz * sn + uz * dot * (1 - cs);
  }
  let pd = px * ux + py * uy + pz * uz; let vx = px - pd * ux, vy = py - pd * uy, vz = pz - pd * uz; let vl = Math.sqrt(vx * vx + vy * vy + vz * vz);
  if (vl < 1e-5) { vx = 0; vy = 0; vz = -1; pd = -uz; vx -= pd * ux; vy -= pd * uy; vz -= pd * uz; vl = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1; }
  vx /= vl; vy /= vl; vz /= vl;
  let ca = (a * a + dd * dd - b * b) / (2 * a * dd); ca = ca < -1 ? -1 : ca > 1 ? 1 : ca; const sa = Math.sqrt(1 - ca * ca);
  const ex = sx + a * (ca * ux + sa * vx), ey = sy + a * (ca * uy + sa * vy), ez = sz + a * (ca * uz + sa * vz);
  const wx = sx + ux * dd, wy = sy + uy * dd, wz = sz + uz * dd;
  armFrame(sx, sy, sz, sx - ex, sy - ey, sz - ez, vx, vy, vz, Cm, iu);
  armFrame(ex, ey, ez, ex - wx, ey - wy, ez - wz, vx, vy, vz, Cm, ifo);
  // the hand: the forearm frame turned by the wrist
  eulerYXZ(c[k + 5] * side, c[k + 4], 0, _R);
  compose(Cm, ifo, 0, -b, 0, _R, Cm, ih);
}
// a limb frame: y along the limb (pointing back to its joint), z toward the side away from the pole
function armFrame(ox, oy, oz, yx, yy, yz, vx, vy, vz, out, oi) {
  let l = Math.sqrt(yx * yx + yy * yy + yz * yz) || 1; yx /= l; yy /= l; yz /= l;
  let fx = -vx, fy = -vy, fz = -vz; const dt = fx * yx + fy * yy + fz * yz; fx -= dt * yx; fy -= dt * yy; fz -= dt * yz; l = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1; fx /= l; fy /= l; fz /= l;
  out[oi] = yy * fz - yz * fy; out[oi + 1] = yz * fx - yx * fz; out[oi + 2] = yx * fy - yy * fx; out[oi + 3] = yx; out[oi + 4] = yy; out[oi + 5] = yz; out[oi + 6] = fx; out[oi + 7] = fy; out[oi + 8] = fz; out[oi + 9] = ox; out[oi + 10] = oy; out[oi + 11] = oz;
}
const _L = new Float64Array(12 * 6), _root = new Float64Array(12);
const ARM_BONES = [BONE.UA_L, BONE.FA_L, BONE.HA_L, BONE.UA_R, BONE.FA_R, BONE.HA_R];
// Solve a person: p.cur (channels), p.x/y/z/yaw, p.body.D -> p.bones (NBONES * 12, flat frame coordinates).
// lite: skip the arms (the reduced figure has them built into its body)
export function solve(p, lite) {
  const c = p.cur, D = p.body.D, Bm = p.bones;
  const root = _root, yaw = p.yaw + c[CH.RYAW], cy = Math.cos(yaw), sy = Math.sin(yaw);
  root[0] = cy; root[1] = 0; root[2] = -sy; root[3] = 0; root[4] = 1; root[5] = 0; root[6] = sy; root[7] = 0; root[8] = cy; root[9] = p.x; root[10] = p.y; root[11] = p.z;
  eulerYXZ(c[CH.PT], c[CH.PP] + c[CH.RPITCH], c[CH.PR], _R2);
  const ground = c[CH.GROUND] > 0.5;
  compose(root, 0, c[CH.RX], ground ? D.hipY : c[CH.RY], c[CH.RZ], _R2, Bm, 0);
  // legs
  const hy = -0.02 * D.kTorso;
  eulerYXZ(c[CH.LL + 2], -c[CH.LL], c[CH.LL + 1], _R); compose(Bm, 0, D.hipW, hy, 0, _R, Bm, BONE.TH_L * 12);
  eulerYXZ(-c[CH.LR + 2], -c[CH.LR], -c[CH.LR + 1], _R); compose(Bm, 0, -D.hipW, hy, 0, _R, Bm, BONE.TH_R * 12);
  rotX(c[CH.LL + 3], _R); compose(Bm, BONE.TH_L * 12, 0, -D.thigh, 0, _R, Bm, BONE.SH_L * 12);
  rotX(c[CH.LR + 3], _R); compose(Bm, BONE.TH_R * 12, 0, -D.thigh, 0, _R, Bm, BONE.SH_R * 12);
  rotX(c[CH.LL + 4], _R); compose(Bm, BONE.SH_L * 12, 0, -D.shin, 0, _R, Bm, BONE.FT_L * 12);
  rotX(c[CH.LR + 4], _R); compose(Bm, BONE.SH_R * 12, 0, -D.shin, 0, _R, Bm, BONE.FT_R * 12);
  if (ground) {
    // put the lowest sole on the floor (this is what makes a walk bounce)
    const fh = -0.05 * D.footLen / 0.25, ft = 0.17 * D.footLen / 0.25, an = -D.ankle;
    let lo = 1e9;
    for (let fb = BONE.FT_L; fb <= BONE.FT_R; fb += 3) {
      const i = fb * 12, yb = Bm[i + 10] + Bm[i + 4] * an;
      const y1 = yb + Bm[i + 7] * fh, y2 = yb + Bm[i + 7] * ft; if (y1 < lo) lo = y1; if (y2 < lo) lo = y2;
    }
    const dy = p.y + c[CH.RY] - lo;
    Bm[10] += dy; for (let b = BONE.TH_L; b <= BONE.FT_R; b++) Bm[b * 12 + 10] += dy;
    p.lift = dy;
  }
  // spine and head
  eulerYXZ(c[CH.ST], c[CH.SB], c[CH.SS], _R); compose(Bm, 0, 0, D.waist, 0, _R, Bm, BONE.CHEST * 12);
  eulerYXZ(c[CH.HY], c[CH.HP], c[CH.HR], _R); compose(Bm, BONE.CHEST * 12, 0, D.neck, -0.01 * D.kTorso, _R, Bm, BONE.HEAD * 12);
  p.sx = p.x; p.sy = p.y; p.sz = p.z;
  if (lite) return;
  solveArm(D, 1, c, CH.AL, _L, 0, 12, 24);
  solveArm(D, -1, c, CH.AR, _L, 36, 48, 60);
  const cb = BONE.CHEST * 12;
  for (let j = 0; j < 6; j++) {
    const li = j * 12; for (let q = 0; q < 9; q++) _R[q] = _L[li + q];
    compose(Bm, cb, _L[li + 9], _L[li + 10], _L[li + 11], _R, Bm, ARM_BONES[j] * 12);
  }
}
// carry the last solved skeleton along with the person (for frames when a distant figure is not re-posed)
export function shiftBones(p) {
  const dx = p.x - p.sx, dy = p.y - p.sy, dz = p.z - p.sz; if (!dx && !dy && !dz) return;
  const Bm = p.bones; for (let b = 0; b < NBONES; b++) { Bm[b * 12 + 9] += dx; Bm[b * 12 + 10] += dy; Bm[b * 12 + 11] += dz; }
  p.sx = p.x; p.sy = p.y; p.sz = p.z;
}

// ---------------------------------------------------------------------------------------------------------------
// Drawing: write a person's parts into the instance buffers (relative to the meshes' shared origin)
// ---------------------------------------------------------------------------------------------------------------
export function emitParts(list, Bm, parts, sitting, origin, stats, flare) {
  let n = 0;
  for (let i = 0; i < parts.length; i++) {
    const e = parts[i];
    if (e.cond === 1 && sitting) continue; if (e.cond === 2 && !sitting) continue;
    const pm = list[e.pm]; if (pm.count >= pm.cap) continue;
    const bi = e.b * 12, M = pm.M, j = pm.count * 16;
    const X0 = Bm[bi], X1 = Bm[bi + 1], X2 = Bm[bi + 2], Y0 = Bm[bi + 3], Y1 = Bm[bi + 4], Y2 = Bm[bi + 5], Z0 = Bm[bi + 6], Z1 = Bm[bi + 7], Z2 = Bm[bi + 8];
    const o = e.o;
    M[j + 12] = Bm[bi + 9] + X0 * o[0] + Y0 * o[1] + Z0 * o[2] - origin[0];
    M[j + 13] = Bm[bi + 10] + X1 * o[0] + Y1 * o[1] + Z1 * o[2] - origin[1];
    M[j + 14] = Bm[bi + 11] + X2 * o[0] + Y2 * o[1] + Z2 * o[2] - origin[2];
    if (e.rs) {
      const r = e.rs;
      for (let k = 0; k < 3; k++) { const a = r[k * 3], b = r[k * 3 + 1], cc = r[k * 3 + 2]; M[j + k * 4] = X0 * a + Y0 * b + Z0 * cc; M[j + k * 4 + 1] = X1 * a + Y1 * b + Z1 * cc; M[j + k * 4 + 2] = X2 * a + Y2 * b + Z2 * cc; }
    } else {
      const s = e.s, fz = e.fl && flare ? 1 + flare : 1;
      M[j] = X0 * s[0]; M[j + 1] = X1 * s[0]; M[j + 2] = X2 * s[0];
      M[j + 4] = Y0 * s[1]; M[j + 5] = Y1 * s[1]; M[j + 6] = Y2 * s[1];
      M[j + 8] = Z0 * s[2] * fz; M[j + 9] = Z1 * s[2] * fz; M[j + 10] = Z2 * s[2] * fz;
    }
    M[j + 3] = 0; M[j + 7] = 0; M[j + 11] = 0; M[j + 15] = 1;
    const C = pm.C, ci = pm.count * 4, col = e.c; C[ci] = col[0]; C[ci + 1] = col[1]; C[ci + 2] = col[2]; C[ci + 3] = 1;
    pm.count++; n++;
  }
  if (stats) stats.parts += n;
  return n;
}
// one instance with an explicit 3x3 (columns) and translation (flat)
export function emitOne(pm, R, sx, sy, sz, x, y, z, col, origin) {
  if (pm.count >= pm.cap) return false;
  const M = pm.M, j = pm.count * 16;
  M[j] = R[0] * sx; M[j + 1] = R[1] * sx; M[j + 2] = R[2] * sx; M[j + 3] = 0;
  M[j + 4] = R[3] * sy; M[j + 5] = R[4] * sy; M[j + 6] = R[5] * sy; M[j + 7] = 0;
  M[j + 8] = R[6] * sz; M[j + 9] = R[7] * sz; M[j + 10] = R[8] * sz; M[j + 11] = 0;
  M[j + 12] = x - origin[0]; M[j + 13] = y - origin[1]; M[j + 14] = z - origin[2]; M[j + 15] = 1;
  const C = pm.C, ci = pm.count * 4; C[ci] = col[0]; C[ci + 1] = col[1]; C[ci + 2] = col[2]; C[ci + 3] = 1;
  pm.count++;
  return true;
}
