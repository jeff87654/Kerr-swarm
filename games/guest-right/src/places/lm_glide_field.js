// The Glide: what you see through a glide car's port. The mid-raft between the drums, drawn at one two-hundredth of its
// size so the engine's draw distance reaches the vanishing point (out there the eye cannot tell). A square grid of drums
// 24.5 km apart, each a dark cylinder standing between the rectenna layer below and the radiator layer above, each
// wearing its ring of quay lights round the waist; the lane lamps at our own level; the horizon where every ring merges.
//
// Everything is drawn in "grid" coordinates (x across the lane, z along it, y up from the car's floor) into a handful of
// meshes the ride moves every frame: the car stays at the frame's origin looking aft (+z), and the world slides past.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { Rng, hashStr } from '../core/util.js';

export const SC = 1 / 200;                              // metres of field per metre of the real raft
export const EYE = 1.2;                                // the seated eye, above the car's floor
export const R = 3050 * SC;                             // the quay: the car's path round a drum's waist
export const RJ = R - 1.9;                              // the jacket as drawn (pulled in so it never touches the car)
export const L = 24500 * SC;                            // drum to drum, the length of one glide
export const Y_LANE = EYE - 0.62;                       // the lane lamps, just under the car
export const Y_WAIST = EYE + 1250 * SC;                 // the quay lights: Ring Two's lane runs 1.25 km nearer the front
export const Y_BOT = EYE - 775 * SC, Y_TOP = EYE + 3175 * SC;   // front cap (with its thicker jacket) and back cap
export const Y_FLOOR = EYE - 830 * SC, Y_CEIL = EYE + 3265 * SC;  // the rectenna layer and the radiator layer
const HZ = 1900;                                        // the horizon ring: past it every ring has merged into one line
export const COL = { chervil: '#ffbf4d', sorrel: '#a6f2c4', lane: '#ffa04a', sorrelLane: '#7fe0c0' };
const RINGS = ['#ffe2b0', '#fff0d6', '#ffd49a', '#ffe9c4', '#f6efe4', '#ffdcae', '#ffe7bc', '#e9eef8'];

// ---- small pieces drawn straight into a Geo ----
// A cylinder wall of radius r from a list of rows [[y, tint], ...], with raw uvs at `tile` metres a repeat.
function wallRows(g, r, rows, segs, tile, inward) {
  const b = g.buf, n0 = b.nv;
  for (let i = 0; i < rows.length; i++) {
    g.tint(rows[i][1]);
    for (let j = 0; j <= segs; j++) {
      const a = (j / segs) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      g.v(r * c, rows[i][0], r * s, c, 0, s, (a * r) / tile, rows[i][0] / tile, 1, true);
    }
  }
  const W = segs + 1;
  for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < segs; j++) { const a = n0 + i * W + j; if (inward) g.quadI(a, a + 1, a + W + 1, a + W); else g.quadI(a, a + W, a + W + 1, a + 1); }
}
// A small eight-sided lamp.
function oct(g, x, y, z, s) {
  const i = g.v(x + s, y, z, 1, 0, 0, 0, 0), k = g.v(x - s, y, z, -1, 0, 0, 0, 0), u = g.v(x, y + s, z, 0, 1, 0, 0, 0), d = g.v(x, y - s, z, 0, -1, 0, 0, 0), f = g.v(x, y, z + s, 0, 0, 1, 0, 0), bk = g.v(x, y, z - s, 0, 0, -1, 0, 0);
  g.tri(u, f, i); g.tri(u, k, f); g.tri(u, bk, k); g.tri(u, i, bk); g.tri(d, i, f); g.tri(d, f, k); g.tri(d, k, bk); g.tri(d, bk, i);
}
// A lamp seen from far off: one small square facing the lane (-z).
function dot(g, x, y, z, s) {
  const a = g.v(x - s, y - s, z, 0, 0, -1, 0, 0), b = g.v(x + s, y - s, z, 0, 0, -1, 0, 0), c = g.v(x + s, y + s, z, 0, 0, -1, 0, 0), d = g.v(x - s, y + s, z, 0, 0, -1, 0, 0);
  g.quadI(a, d, c, b);
}
// A flat ring (annulus) in a horizontal plane, facing up or down.
function disc(g, r0, r1, y, segs, tIn, tOut, up) {
  const n0 = g.buf.nv;
  for (let j = 0; j <= segs; j++) {
    const a = (j / segs) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
    g.tint(tIn); g.v(r0 * c, y, r0 * s, 0, up ? 1 : -1, 0, 0, 0);
    g.tint(tOut); g.v(r1 * c, y, r1 * s, 0, up ? 1 : -1, 0, 0, 0);
  }
  for (let j = 0; j < segs; j++) { const a = n0 + j * 2; if (up) g.quadI(a, a + 2, a + 3, a + 1); else g.quadI(a, a + 1, a + 3, a + 2); }
}

// ---- one drum ----
// o: { ring (colour of its quay lights), detail (a near drum: panels, lamps you can count, locks, cradles), far (0..1: how
//      far off, for the plain drums), seed }
function drum(g, o) {
  const r = new Rng(o.seed || 1), ring = o.ring;
  const segs = o.detail ? 120 : o.far > 0.6 ? 20 : 32;
  // the body: dark, with the quay lights' spill round the waist, a little of the lane lamps, the radiators' red on top
  g.mat(o.detail ? 'panel' : 'plain', '#ffffff', { emissive: 1, rough: 0.2 });
  const spill = o.ring === COL.sorrel ? '#24382c' : '#3b2b19';
  const laneSpill = o.ring === COL.sorrel ? '#1c3329' : '#3a2814';
  const rows = [[Y_BOT, '#07090c'], [Y_LANE - 0.6, '#0c0e11'], [Y_LANE, laneSpill], [Y_LANE + 0.7, '#0d0f12'], [Y_WAIST - 2.2, '#0d0e11'], [Y_WAIST - 0.6, spill], [Y_WAIST, '#5a4429'],
    [Y_WAIST + 0.6, spill], [Y_WAIST + 2.6, '#100e0e'], [Y_TOP - 3.0, '#120b0a'], [Y_TOP, '#2a120b']];
  if (o.ring === COL.sorrel) rows[6][1] = '#36594a';
  wallRows(g, RJ, o.detail ? rows : [rows[0], rows[2], rows[5], rows[6], rows[7], rows[10]], segs, 1.6);
  // the quay lights: a lit lip all round the waist, and the lamps on it
  g.mat('plain', '#ffffff', { emissive: o.detail ? 2.2 : 4.5 });
  wallRows(g, RJ + 0.1, [[Y_WAIST - 0.09, '#1a120a'], [Y_WAIST, ring], [Y_WAIST + 0.09, '#1a120a']], segs, 4);
  g.mat('plain', ring, { emissive: o.detail ? 12 : 16 });
  const nL = o.detail ? 300 : o.far > 0.6 ? 28 : o.far > 0.3 ? 44 : 72;
  for (let i = 0; i < nL; i++) {
    const a = (i / nL) * Math.PI * 2, x = (RJ + 0.16) * Math.cos(a), z = (RJ + 0.16) * Math.sin(a);
    if (o.detail) oct(g, x, Y_WAIST, z, 0.06); else dot(g, x, Y_WAIST, z, 0.14 + 0.45 * o.far);
  }
  // the lane lamps at our own level, amber, sparser: where the cradles run
  g.mat('plain', o.ring === COL.sorrel ? COL.sorrelLane : COL.lane, { emissive: o.detail ? 6 : 3 });
  const nLane = o.detail ? 180 : o.far > 0.35 ? 0 : 36;
  for (let i = 0; i < nLane; i++) {
    const a = (i / nLane) * Math.PI * 2, x = (RJ + 0.16) * Math.cos(a), z = (RJ + 0.16) * Math.sin(a);
    if (o.detail) g.ball(x, Y_LANE, z, 0.026, 0.026, 0.026, { segs: 6, rings: 4 }); else dot(g, x, Y_LANE, z, 0.09 + 0.1 * o.far);
  }
  if (!o.detail && o.far <= 0.35) { g.mat('plain', '#ffffff', { emissive: 1.4 }); wallRows(g, RJ + 0.08, [[Y_LANE - 0.05, '#120c06'], [Y_LANE, '#7a4a20'], [Y_LANE + 0.05, '#120c06']], segs, 4); }
  // the back axle up to the radiators (heat out as ammonia), the front axle down to the rectennas (power in)
  g.mat('plain', '#ffffff', { emissive: 1 });
  wallRows(g, 0.9, [[Y_TOP - 0.05, '#2a120b'], [Y_CEIL + 0.05, '#3a1a10']], o.far > 0.4 ? 6 : 12, 2);
  wallRows(g, 0.6, [[Y_FLOOR - 0.05, '#0d1218'], [Y_BOT + 0.05, '#0b0e12']], o.far > 0.4 ? 6 : 10, 2);
  g.mat('plain', '#ff7a4a', { emissive: 4 });
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + r.f(0, 0.4); dot(g, 0.95 * Math.cos(a), Y_TOP + 0.18, 0.95 * Math.sin(a) - 0.0, 0.05); }
  if (!o.detail) return;
  // ---- a near drum's own detail: the lane's track ledge, the sixty locks through the jacket, the cradles
  g.mat('panel', '#ffffff', { emissive: 1 });
  wallRows(g, RJ + 0.12, [[Y_LANE - 0.16, '#0e0d0c'], [Y_LANE - 0.1, '#2c2116']], segs, 1);
  disc(g, RJ, RJ + 0.12, Y_LANE - 0.1, segs, '#20180f', '#2c2116', true);
  disc(g, RJ, RJ + 0.12, Y_LANE - 0.16, segs, '#0a0a0a', '#0a0a0a', false);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 + 0.02, c = Math.cos(a), s = Math.sin(a), rr = RJ + 0.005, w = 0.11;
    const tx = -s, tz = c;                       // along the wall
    g.mat('plain', '#8a5a30', { emissive: 0.7 });
    const P = (u, y) => [rr * c + tx * u, y, rr * s + tz * u];
    const q = (p0, p1, p2, p3) => { const a0 = g.v(p0[0], p0[1], p0[2], c, 0, s, 0, 0), a1 = g.v(p1[0], p1[1], p1[2], c, 0, s, 0, 0), a2 = g.v(p2[0], p2[1], p2[2], c, 0, s, 0, 0), a3 = g.v(p3[0], p3[1], p3[2], c, 0, s, 0, 0); g.quadI(a0, a3, a2, a1); };
    const y0 = Y_LANE + 0.04, y1 = Y_LANE + 0.24;
    q(P(-w - 0.012, y0 - 0.012), P(w + 0.012, y0 - 0.012), P(w + 0.012, y1 + 0.012), P(-w - 0.012, y1 + 0.012));
    g.mat('plain', '#050505');
    const rr2 = rr + 0.004, P2 = (u, y) => [rr2 * c + tx * u, y, rr2 * s + tz * u];
    const a0 = g.v(...P2(-w, y0), c, 0, s, 0, 0), a1 = g.v(...P2(w, y0), c, 0, s, 0, 0), a2 = g.v(...P2(w, y1), c, 0, s, 0, 0), a3 = g.v(...P2(-w, y1), c, 0, s, 0, 0); g.quadI(a0, a3, a2, a1);
  }
  // cradles waiting on the track: a lit arm every so often
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + 0.07, c = Math.cos(a), s = Math.sin(a), rr = RJ + 0.2;
    g.mat('panel', '#3a3530', { emissive: 0.6 });
    g.push(); g.move(rr * c, Y_LANE - 0.1, rr * s); g.rotY(-a); g.box(-0.08, 0, -0.12, 0.12, 0.09, 0.12); g.pop();
    g.mat('plain', '#9fe8ff', { emissive: 5 }); oct(g, (rr + 0.13) * c, Y_LANE + 0.02, (rr + 0.13) * s, 0.02);
  }
}

// ---- the planes and the horizon ----
// A plane of long panels running along the lane (z), in alternating tints, cut finer near the car. tint(x, z, row) -> hex.
function stripes(g, y, down, tint, uvx, uvz) {
  const X = HZ + 40, W = 12;
  for (let x = -X, row = 0; x < X; x += W, row++) {
    const ax = Math.abs(x + W / 2);
    for (let z = Math.max(-X, ax * 0.3 - 300); z < X;) {
      const d = Math.hypot(ax, z), len = d < 300 ? 24 : d < 800 ? 60 : 160, z1 = Math.min(X, z + len);
      if (Math.hypot(ax, (z + z1) / 2) < HZ + 40) {
        const ids = [];
        for (const q of [[x, z], [x + W, z], [x + W, z1], [x, z1]]) { g.tint(tint(q[0], q[1], row)); ids.push(g.v(q[0], y, q[1], 0, down ? -1 : 1, 0, q[0] / uvx, q[1] / uvz, 1, true)); }
        if (down) g.quadI(ids[0], ids[1], ids[2], ids[3]); else g.quadI(ids[0], ids[3], ids[2], ids[1]);
      }
      z = z1;
    }
  }
}
export const H2 = (r, gg, b) => '#' + [r, gg, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
// The radiator layer: dull red-brown panels in rows running away; pools of warmer light over each drum's back axle.
function ceilingGeo(g, drums) {
  g.mat('flute', '#ffffff', { emissive: 1, rough: 0.3 });
  stripes(g, Y_CEIL, true, (x, z, row) => {
    let k = 0; for (const d of drums) { const dx = x - d[0], dz = z - d[1]; const q = (dx * dx + dz * dz) / 500; if (q < 6) k += Math.exp(-q); }
    k = Math.min(1, k);
    const far = Math.min(1, Math.hypot(x, z) / HZ), alt = row % 2 ? 1 : row % 4 === 0 ? 0.72 : 0.86;
    return H2((24 + 70 * k) * alt * (1 - 0.3 * far), (10 + 24 * k) * alt * (1 - 0.25 * far), (7 + 9 * k) * alt);
  }, 3, 0.5);
  // the seams across the rows, darker, every 40 m (8 km)
  g.mat('plain', '#ffffff', { emissive: 1 });
  for (let z = -240; z < HZ; z += 40) {
    const hw = Math.sqrt(Math.max(0, (HZ + 40) * (HZ + 40) - z * z)), w = 0.5 + Math.abs(z) * 0.0015, ids = [];
    g.tint('#0c0504');
    for (const q of [[-hw, z - w], [hw, z - w], [hw, z + w], [-hw, z + w]]) ids.push(g.v(q[0], Y_CEIL - 0.03, q[1], 0, -1, 0, 0, 0));
    g.quadI(ids[0], ids[1], ids[2], ids[3]);
  }
}
// The rectenna layer: near black, a cold sheen that grows toward the horizon, rows of dishes too fine to see.
function floorGeo(g) {
  g.mat('hex', '#ffffff', { emissive: 1, rough: 0.1 });
  stripes(g, Y_FLOOR, false, (x, z, row) => {
    const far = Math.min(1, Math.hypot(x, z) / HZ), sheen = Math.pow(far, 0.6), alt = row % 2 ? 1 : 0.8;
    return H2((3 + 15 * sheen) * alt, (5 + 22 * sheen) * alt, (8 + 34 * sheen) * alt);
  }, 1.2, 1.2);
}
// Under each drum, the rectenna's faint sheen of its quay lights: a soft pool, and a streak toward the lane.
function floorPools(g, drums) {
  g.mat('plain', '#ffffff', { emissive: 1 });
  for (const d of drums) {
    const x = d[0], z = d[1], dist = Math.hypot(x, z), warmC = d[2] === COL.sorrel ? '#12302a' : '#2a2014', y = Y_FLOOR + 0.02 + Math.min(0.3, dist * 0.0002);
    const n0 = g.buf.nv, N = 14, rr = RJ * 1.7;
    g.tint(warmC); g.v(x, y, z, 0, 1, 0, 0, 0);
    for (let j = 0; j <= N; j++) { const a = (j / N) * Math.PI * 2; g.tint('#05080c'); g.v(x + rr * Math.cos(a), y, z + rr * Math.sin(a), 0, 1, 0, 0, 0); }
    for (let j = 0; j < N; j++) g.tri(n0, n0 + 2 + j, n0 + 1 + j);
    // the streak: from the drum's foot toward the lane, narrowing
    const tx = -x, tz = -61 - z, tl = Math.hypot(tx, tz) || 1, ux = tx / tl, uz = tz / tl, px = -uz, pz = ux, Ls = Math.min(70, dist * 0.35), w0 = RJ * 0.55;
    const ids = [];
    g.tint('#05080c'); ids.push(g.v(x + px * w0, y + 0.01, z + pz * w0, 0, 1, 0, 0, 0));
    g.tint(warmC); ids.push(g.v(x, y + 0.01, z, 0, 1, 0, 0, 0));
    g.tint('#05080c'); ids.push(g.v(x - px * w0, y + 0.01, z - pz * w0, 0, 1, 0, 0, 0));
    g.tint('#05080c'); ids.push(g.v(x + ux * Ls, y + 0.01, z + uz * Ls, 0, 1, 0, 0, 0));
    g.tri(ids[0], ids[3], ids[1]); g.tri(ids[1], ids[3], ids[2]);
  }
}
// The horizon: a ring far out where floor and ceiling meet and every quay light has merged into one warm line.
function horizonGeo(g) {
  g.mat('plain', '#ffffff', { emissive: 1 });
  const rows = [[Y_FLOOR - 1, '#0a1018'], [EYE - 1.2, '#121620'], [EYE, '#3a2c20'], [Y_WAIST - 1.0, '#6a4a2a'], [Y_WAIST, '#ffd89a'], [Y_WAIST + 1.0, '#7a5030'], [Y_WAIST + 4, '#2a140c'], [Y_CEIL + 1, '#22100a']];
  wallRows(g, HZ, rows, 128, 50, true);
  g.mat('plain', '#ffffff', { emissive: 4 });
  wallRows(g, HZ - 2, [[Y_LANE - 0.15, '#000000'], [Y_LANE, '#ffa04a'], [Y_LANE + 0.15, '#000000']], 128, 50, true);
}

// ---- the field as meshes the ride can move ----
function meshOf(s, g, gx, gz) {
  const mesh = new THREE.Mesh(g.buf.toGeometry(), s.world.mats.opaque);
  const origin = [0, 0, 0];
  s.world.addRenderable(mesh, { frame: s.frame, origin, center: [0, 8, 0], radius: 3000, far: 1e7, caster: false, scope: s });
  s.meshes.push(mesh);
  return { mesh, origin, gx, gz };
}

// Build it all. Returns the field: { meshes, home, next, setPose(cx, cz, phi), swap(back), tris }.
export async function buildField(s, tick) {
  const grid = [];
  for (let k = 0; k <= 15; k++) for (let n = -16; n <= 16; n++) {
    if (k === 0 && n === 0) continue;
    const x = -R + n * L, z = k * L;
    if (Math.hypot(x, z) > HZ - 40) continue;
    if (z < Math.abs(x) * 0.18 - 30) continue;       // nowhere a port could see them
    grid.push([x, z, n, k, RINGS[hashStr('drum' + n + ':' + k) % RINGS.length]]);
  }
  const parts = [];
  let tris = 0;
  // the plain drums, in a few meshes by distance
  const bands = [[0, 420], [420, 900], [900, 2000]];
  for (const bd of bands) {
    const g = new Geo(new MeshBuf(65536, 131072));
    for (const d of grid) {
      const dist = Math.hypot(d[0], d[1]); if (dist < bd[0] || dist >= bd[1]) continue;
      const hsh = hashStr('drum' + d[2] + ':' + d[3]);
      g.push(); g.move(d[0], 0, d[1]);
      drum(g, { ring: d[4], far: Math.min(1, dist / 1500), seed: hsh });
      g.pop();
    }
    tris += g.buf.ni / 3;
    parts.push(meshOf(s, g, 0, 0));
    await tick();
  }
  // the two near drums: Chervil, which you leave, and Sorrel, which catches you
  const mk = (ring, seed) => { const g = new Geo(new MeshBuf(65536, 131072)); drum(g, { ring, detail: true, seed }); tris += g.buf.ni / 3; return g; };
  const home = meshOf(s, mk(COL.chervil, 7), -R, 0); parts.push(home);
  const next = meshOf(s, mk(COL.sorrel, 11), -R, -L); parts.push(next);
  await tick();
  // the radiator layer, the rectenna layer, the horizon
  const drumsXZ = grid.map((d) => [d[0], d[1]]).concat([[-R, 0], [-R, -L], [-R, -2 * L]]);
  { const g = new Geo(new MeshBuf(65536, 131072)); ceilingGeo(g, drumsXZ); tris += g.buf.ni / 3; parts.push(meshOf(s, g, 0, 0)); }
  await tick();
  { const g = new Geo(new MeshBuf(65536, 131072)); floorGeo(g); floorPools(g, grid.map((d) => [d[0], d[1], d[4]]).concat([[-R, 0, COL.chervil], [-R, -L, COL.sorrel]])); horizonGeo(g); tris += g.buf.ni / 3; parts.push(meshOf(s, g, 0, 0)); }
  await tick();
  const F = {
    meshes: parts, home, next, tris,
    // where the car is in the grid (cx, cz) and how far it has turned (phi): everything is placed round it
    setPose(cx, cz, phi) {
      const c = Math.cos(phi), sn = Math.sin(phi);
      for (const m of parts) {
        const dx = m.gx - cx, dz = m.gz - cz;
        m.origin[0] = dx * c - dz * sn; m.origin[2] = dx * sn + dz * c;
        const e = m.mesh.matrixWorld.elements; e[0] = c; e[1] = 0; e[2] = sn; e[4] = 0; e[5] = 1; e[6] = 0; e[8] = -sn; e[9] = 0; e[10] = c; e[12] = 0; e[13] = 0; e[14] = 0;
      }
    },
    // outbound: Chervil beside you and Sorrel ahead; back: the other way about
    swap(back) { home.gz = back ? -L : 0; next.gz = back ? 0 : -L; },
  };
  F.setPose(0, 0, 0);
  return F;
}
