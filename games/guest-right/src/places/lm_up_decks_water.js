// The slow water of the Simmer: the moving surface, the light it throws on the vault and the pool floor, the paddle that
// makes the swell, the wave clock over it, and a splash that hangs. All of it is a few small meshes whose vertices are
// written every frame, as the street clocks turn their hands.
//
// The swell runs from the paddle at the back end to the steps at the front, fifty metres, in thirteen seconds (3.85 m/s).
// At 0.55 g a wave runs at about three quarters of the speed it would at the rim, and the same push stands it about a
// third higher, so the swell is slow and tall; the chop off the walls is slower too.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { PI, POOL, STEPS, GEE, vaultY } from './lm_up_decks_props.js';

export const CROSS_S = 13;                          // seconds from the paddle to the steps
export const DIAL = { x: 0, y: 4.75, z: 33.88, r: 1.35 };   // the wave clock on the back wall, facing the length of the pool
const C = (POOL.z1 - POOL.z0) / CROSS_S;            // the swell's speed
const GACC = GEE * 9.81;
const deepC = (L) => Math.sqrt(GACC * L / (2 * PI));

// travelling waves: amplitude (m), wavelength (m), heading (radians from -z toward +x), speed (m/s), main (shaped by the paddle and the shallows)
const WAVES = [];
function wave(A, L, head, speed, main, ph) { const k = 2 * PI / L; WAVES.push({ A, kx: k * Math.sin(head), kz: -k * Math.cos(head), w: k * speed, k2: k * k, main, ph }); }
wave(0.19, 15.4, 0, C, true, 0);
wave(0.055, 9.2, 0.3, deepC(9.2), true, 1.3);
wave(0.022, 2.4, 1.5, deepC(2.4), false, 0.4);
wave(0.016, 1.7, -0.95, deepC(1.7), false, 2.2);
wave(0.011, 1.2, 2.4, deepC(1.2), false, 4.1);
wave(0.008, 0.9, -2.2, deepC(0.9), false, 0.9);

const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
// how much of the swell there is at z: none at the paddle's face, growing over six metres, taller as it shoals onto the steps
function mainEnv(z) { return smooth(POOL.z1 - 0.2, POOL.z1 - 6.5, z) * (1 + 0.5 * smooth(-18.5, -22.5, z)) * (1 - 0.55 * smooth(-23.2, -25, z)); }
function sideEnv(z) { return 1 - 0.6 * smooth(-21, -25, z); }
// the floor of the pool at z (the steps of the shallows, then the deep)
export function bottomAt(z) { for (const st of STEPS) if (z >= st[0] && z < st[1]) return st[2]; return POOL.bottom; }

export function buildWater(game, s) {
  const W = s.world, f = s.frame;
  let t = 0;
  const groupAt = (z) => 0.8 + 0.3 * Math.sin(t * 2 * PI / 31 + z * 0.12);    // sets: every half minute the swell comes a little bigger

  // ------------------------------------------------------------------------------------------------
  // the surface: a glass sheet, 0.5 m squares, its heights and normals written every frame
  // ------------------------------------------------------------------------------------------------
  const X0 = POOL.x0 + 0.03, X1 = POOL.x1 - 0.03, Z0 = POOL.z0 + 0.03, Z1 = POOL.z1 - 0.12;
  const NX = 33, NZ = Math.round((Z1 - Z0) / 0.5) + 1;
  const cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
  const sg = new Geo(new MeshBuf(NX * NZ + 4, (NX - 1) * (NZ - 1) * 6 + 6));
  sg.mat('plain', '#2f8a90'); sg._col[3] = 92; sg._mat[3] = 10;
  const gx = [], gz = [];
  for (let i = 0; i < NX; i++) gx.push(X0 + (X1 - X0) * i / (NX - 1));
  for (let j = 0; j < NZ; j++) gz.push(Z0 + (Z1 - Z0) * j / (NZ - 1));
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) sg.v(gx[i] - cx, 0, gz[j] - cz, 0, 1, 0, gx[i] * 0.25, gz[j] * 0.25, 1, true);
  for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i; sg.quadI(a, a + NX, a + NX + 1, a + 1); }
  const sGeo = sg.buf.toGeometry();
  const surf = new THREE.Mesh(sGeo, W.fwdMats.glass);
  W.addRenderable(surf, { frame: f, origin: [cx, POOL.water, cz], center: [0, 0, 0], radius: Math.hypot(X1 - X0, Z1 - Z0) / 2 + 1, far: 260, caster: false, forward: true, scope: s });
  s.meshes.push(surf);
  const sPos = sGeo.attributes.position, sNrm = sGeo.attributes.normal;
  const envM = gz.map(mainEnv), envS = gz.map(sideEnv);

  // ------------------------------------------------------------------------------------------------
  // light off the water: soft glow cards on the vault and on the pool floor whose strength follows the
  // curvature of the surface (where it focuses the lamps, the light gathers)
  // ------------------------------------------------------------------------------------------------
  const glowSheet = (pts, size, colour, faceY) => {
    const g = new Geo(new MeshBuf(pts.length * 4 + 4, pts.length * 6 + 6));
    g.mat('plain', colour); g._col[3] = 128; g._mat[3] = 0;
    const h = size / 2;
    for (const p of pts) {
      const y0 = faceY(p[0] - h), y1 = faceY(p[0] + h);
      g.quad([p[0] - h, y0, p[1] - h], [p[0] - h, y0, p[1] + h], [p[0] + h, y1, p[1] + h], [p[0] + h, y1, p[1] - h], { uv: [0, 0, 1, 1] });
    }
    const geo = g.buf.toGeometry();
    const mesh = new THREE.Mesh(geo, W.fwdMats.glow); mesh.renderOrder = 2;
    let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9; for (const p of pts) { bx0 = Math.min(bx0, p[0]); bx1 = Math.max(bx1, p[0]); bz0 = Math.min(bz0, p[1]); bz1 = Math.max(bz1, p[1]); }
    W.addRenderable(mesh, { frame: f, origin: [0, 0, 0], center: [(bx0 + bx1) / 2, faceY(0), (bz0 + bz1) / 2], radius: Math.hypot(bx1 - bx0, bz1 - bz0) / 2 + 2, far: 200, caster: false, forward: true, scope: s });
    s.meshes.push(mesh);
    return geo.attributes.aMat;
  };
  const ceilPts = [], floorPts = [];
  for (let x = -10.8; x <= 10.81; x += 0.8) for (let z = -25.6; z <= 24.4; z += 0.8) ceilPts.push([x, z]);
  for (let x = -7.6; x <= 7.61; x += 0.8) for (let z = -24.7; z <= 24.2; z += 0.8) floorPts.push([x, z]);
  const ceilMat = glowSheet(ceilPts, 1.55, '#cdeef0', (x) => vaultY(x) - 0.05);
  // the floor cards sit on whatever step they are over
  const floorMat = (() => {
    const g = new Geo(new MeshBuf(floorPts.length * 4 + 4, floorPts.length * 6 + 6));
    g.mat('plain', '#e6fbff'); g._col[3] = 128; g._mat[3] = 0;
    for (const p of floorPts) { const y = bottomAt(p[1]) + 0.025, h = 0.68; g.quad([p[0] - h, y, p[1] - h], [p[0] - h, y, p[1] + h], [p[0] + h, y, p[1] + h], [p[0] + h, y, p[1] - h], { uv: [0, 0, 1, 1] }); }
    const geo = g.buf.toGeometry(); const mesh = new THREE.Mesh(geo, W.fwdMats.glow); mesh.renderOrder = 2;
    W.addRenderable(mesh, { frame: f, origin: [0, 0, 0], center: [0, -2, 0], radius: 27, far: 160, caster: false, forward: true, scope: s });
    s.meshes.push(mesh);
    return geo.attributes.aMat;
  })();
  const ceilEdge = ceilPts.map((p) => 1 - smooth(7.6, 10.9, Math.abs(p[0])));

  // ------------------------------------------------------------------------------------------------
  // the paddle: a hinged flap across the back end, rocking with the swell
  // ------------------------------------------------------------------------------------------------
  const pg = new Geo(new MeshBuf(512, 1024));
  const PH = POOL.water + 0.12 - POOL.bottom;
  pg.mat('paint', '#1d4a4f', { rough: -0.15 }); pg.box(-7.86, 0, -0.08, 7.86, PH, 0.08, { bevel: 0.02 });
  pg.mat('paint', '#cf6c45', { rough: -0.15 }); pg.box(-7.88, PH - 0.16, -0.095, 7.88, PH, 0.095, { bevel: 0.02 });
  pg.mat('cast', '#b08a45', { rough: -0.2 }); for (let x = -7; x <= 7.01; x += 1.75) pg.box(x - 0.05, 0.05, -0.12, x + 0.05, PH - 0.18, -0.08, { bevel: 0.01 });
  pg.mat('cast', '#2a2622'); pg.tube([[-7.9, 0.02, 0.0], [7.9, 0.02, 0.0]], 0.09, { segs: 10 });
  const paddle = new THREE.Mesh(pg.buf.toGeometry(), W.mats.opaque);
  W.addRenderable(paddle, { frame: f, origin: [0, POOL.bottom, POOL.z1 - 0.05], center: [0, PH / 2, 0], radius: 8.5, far: 160, caster: false, scope: s });
  s.meshes.push(paddle);

  // ------------------------------------------------------------------------------------------------
  // the wave clock's hand: once round in the thirteen seconds a wave takes to cross
  // ------------------------------------------------------------------------------------------------
  const hg = new Geo(new MeshBuf(128, 256));
  hg.mat('cast', '#1d1b18', { rough: -0.2 }); hg.box(-0.035, -0.28, -0.05, 0.035, 1.06, -0.02, { bevel: 0.01 });
  hg.mat('paint', '#cf6c45'); hg.box(-0.06, 0.92, -0.06, 0.06, 1.12, -0.03, { bevel: 0.01 });
  hg.mat('cast', '#b08a45'); hg.box(-0.09, -0.09, -0.075, 0.09, 0.09, -0.01, { bevel: 0.02 });
  const hand = new THREE.Mesh(hg.buf.toGeometry(), W.mats.opaque);
  W.addRenderable(hand, { frame: f, origin: [DIAL.x, DIAL.y, DIAL.z], center: [0, 0.4, 0], radius: 1.3, far: 150, caster: false, scope: s });
  s.meshes.push(hand);

  // ------------------------------------------------------------------------------------------------
  // a splash: droplets thrown up from the surface, falling at 0.55 g
  // ------------------------------------------------------------------------------------------------
  const ND = 60, dg = new Geo(new MeshBuf(ND * 6 + 6, ND * 24 + 6));
  dg.mat('glaze', '#e4f6f4', { rough: -0.45, emissive: 0.35 });
  const shape = [];
  for (let d = 0; d < ND; d++) {
    const r = 0.018 + (d % 5) * 0.007, v0 = dg.buf.nv;
    const P = [[r, 0, 0], [-r, 0, 0], [0, r * 1.3, 0], [0, -r * 1.3, 0], [0, 0, r], [0, 0, -r]];
    for (const p of P) { const l = Math.hypot(p[0], p[1], p[2]); dg.v(p[0], p[1] - 20, p[2], p[0] / l, p[1] / l, p[2] / l, 0, 0, 1, true); shape.push(p); }
    const F = [[0, 2, 4], [4, 2, 1], [1, 2, 5], [5, 2, 0], [4, 3, 0], [1, 3, 4], [5, 3, 1], [0, 3, 5]];
    for (const tr of F) dg.tri(v0 + tr[0], v0 + tr[1], v0 + tr[2]);
  }
  const dGeo = dg.buf.toGeometry();
  const drops = new THREE.Mesh(dGeo, W.mats.opaque);
  const dOrigin = [0, POOL.water, -22];
  W.addRenderable(drops, { frame: f, origin: dOrigin, center: [0, 1.5, 0], radius: 5, far: 80, caster: false, scope: s });
  s.meshes.push(drops);
  drops.userData.hidden = true;
  const D = []; for (let d = 0; d < ND; d++) D.push({ x: 0, y: -20, z: 0, vx: 0, vy: 0, vz: 0, live: false });
  let splashLive = 0;
  const dPos = dGeo.attributes.position;
  function splash(x, z, power) {
    const k = power || 1;
    dOrigin[0] = x; dOrigin[2] = z; dOrigin[1] = POOL.water + heightAt(x, z);
    for (let d = 0; d < ND; d++) {
      const a = Math.random() * PI * 2, sp = (0.15 + Math.random() * 0.95) * k, up = (1.8 + Math.random() * 2.8) * k;
      D[d] = { x: (Math.random() - 0.5) * 0.3, y: 0.02, z: (Math.random() - 0.5) * 0.3, vx: Math.cos(a) * sp, vy: up, vz: Math.sin(a) * sp, live: true, wait: Math.random() * 0.12 };
    }
    splashLive = ND; drops.userData.hidden = false;
  }

  // ------------------------------------------------------------------------------------------------
  // the wave field
  // ------------------------------------------------------------------------------------------------
  function heightAt(x, z) {
    let h = 0; const em = mainEnv(z) * groupAt(z), es = sideEnv(z);
    for (const w of WAVES) h += w.A * (w.main ? em : es) * Math.sin(w.kx * x + w.kz * z - w.w * t + w.ph);
    return h > 0.24 ? 0.24 + (h - 0.24) * 0.3 : h;
  }

  let acc = 0;
  s.every((dt, gm) => {
    const pl = gm && gm.player;
    if (!pl || !pl.frame || pl.frame.id !== f.id) return;
    dt = Math.min(dt, 0.1); t += dt; acc += dt;
    // the surface
    const P = sPos.array, N = sNrm.array;
    for (let j = 0; j < NZ; j++) {
      const z = gz[j], em = envM[j] * groupAt(z), es = envS[j];
      for (let i = 0; i < NX; i++) {
        const x = gx[i]; let h = 0, dx = 0, dz = 0;
        for (let k = 0; k < WAVES.length; k++) {
          const w = WAVES[k], A = w.A * (w.main ? em : es), ph = w.kx * x + w.kz * z - w.w * t + w.ph;
          const sn = Math.sin(ph), cs = Math.cos(ph); h += A * sn; dx += A * w.kx * cs; dz += A * w.kz * cs;
        }
        if (h > 0.24) { h = 0.24 + (h - 0.24) * 0.3; dx *= 0.3; dz *= 0.3; }
        const v = j * NX + i; P[v * 3 + 1] = h;
        const l = Math.hypot(dx, 1, dz); N[v * 4] = Math.round(-dx / l * 127); N[v * 4 + 1] = Math.round(127 / l); N[v * 4 + 2] = Math.round(-dz / l * 127);
      }
    }
    sPos.needsUpdate = true; sNrm.needsUpdate = true;
    // the light it throws, twenty times a second
    if (acc > 0.05) {
      acc = 0;
      const caustic = (pts, mat, base, gain, edge, sx) => {
        const A = mat.array;
        for (let c = 0; c < pts.length; c++) {
          const x = pts[c][0] * sx, z = pts[c][1]; let k2 = 0; const em = mainEnv(z), es = sideEnv(z);
          for (let k = 0; k < WAVES.length; k++) { const w = WAVES[k]; k2 += w.A * (w.main ? em : es) * w.k2 * Math.sin(w.kx * x + w.kz * z - w.w * t + w.ph); }
          let v = (base + gain * Math.max(0, k2 - 0.04)) * (edge ? edge[c] : 1);
          v = Math.max(0, Math.min(255, Math.round(v * 255)));
          A[c * 16 + 3] = v; A[c * 16 + 7] = v; A[c * 16 + 11] = v; A[c * 16 + 15] = v;
        }
        mat.needsUpdate = true;
      };
      caustic(ceilPts, ceilMat, 0.006, 0.075, ceilEdge, 0.74);
      caustic(floorPts, floorMat, 0.004, 0.06, null, 1);
    }
    // the paddle leans into each stroke as the swell leaves it
    {
      const w = WAVES[0], a = -0.1 * Math.sin(w.kz * (POOL.z1 - 0.05) - w.w * t + w.ph + 0.9);
      const e = paddle.matrixWorld.elements, c = Math.cos(a), sn = Math.sin(a);
      e[0] = 1; e[1] = 0; e[2] = 0; e[4] = 0; e[5] = c; e[6] = sn; e[8] = 0; e[9] = -sn; e[10] = c;
    }
    // the wave clock's hand turns about z, clockwise as seen from the water
    {
      const th = ((t % CROSS_S) / CROSS_S) * PI * 2, e = hand.matrixWorld.elements, c = Math.cos(th), sn = Math.sin(th);
      e[0] = c; e[1] = sn; e[2] = 0; e[4] = -sn; e[5] = c; e[6] = 0; e[8] = 0; e[9] = 0; e[10] = 1;
    }
    // the splash
    if (splashLive > 0) {
      const A = dPos.array; let live = 0;
      for (let d = 0; d < ND; d++) {
        const q = D[d];
        if (q.live) {
          if (q.wait > 0) q.wait -= dt;
          else { q.vy -= GACC * dt; q.vx *= 1 - 0.15 * dt; q.vz *= 1 - 0.15 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; if (q.y < -0.05 && q.vy < 0) { q.live = false; q.y = -20; } }
          if (q.live) live++;
        }
        for (let k = 0; k < 6; k++) { const p = shape[d * 6 + k], v = d * 6 + k; A[v * 3] = q.x + p[0]; A[v * 3 + 1] = q.y + p[1]; A[v * 3 + 2] = q.z + p[2]; }
      }
      dPos.needsUpdate = true; splashLive = live;
      if (!live) drops.userData.hidden = true;
    }
  });

  return { splash, heightAt: (x, z) => heightAt(x, z), time: () => t };
}
