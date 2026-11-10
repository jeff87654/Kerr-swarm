// The Hollow's floor: the land round the player (three nested rings of ground, finer near you), its trees, the lake,
// the sunline's light and the far bank overhead. All of it follows the one map in world/land.js, so what you see
// across the Hollow is what you find when you walk there.
import * as THREE from 'three';
import { LAND, BIOME, GROUND, landAt, heightAt, surfAt, wrapX, treeInCell, TREE_CELL, bakeLandMap } from '../world/land.js';
import { createShell, GLSL_SHELL } from '../render/shell.js';
import { makeWorldMaterial, worldUniforms, FLAG } from '../render/worldmat.js';
import { GLSL_COMMON, GLSL_BEND } from '../render/glsl.js';
import { Geo, MeshBuf, matLayer, matTile } from '../world/meshbuilder.js';
import { DRUM } from '../core/drum.js';
import { clamp, lerp, hash2i, hexLin, smoothstep, kelvin } from '../core/util.js';

const RINGS = [{ half: 96, cell: 2, snap: 16 }, { half: 416, cell: 8, snap: 64 }, { half: 1600, cell: 32, snap: 256 }];
const SUN_POWER = 34;

// ---- the ground: a square grid of (n+1)^2 vertices, rebuilt in place when the player has walked far enough
function makeRing(game, f, cfg, level, mat, overlay) {
  const n = Math.round(2 * cfg.half / cfg.cell), nv = (n + 1) * (n + 1) + 4 * (n + 1);
  const pos = new Float32Array(nv * 3), nrm = new Int8Array(nv * 4), uv = new Float32Array(nv * 2), col = new Uint8Array(nv * 4), mt = new Uint8Array(nv * 4);
  const idx = new Uint32Array(n * n * 6 + 4 * n * 6);
  let k = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
  // skirts: each edge vertex has a twin 3 m lower, so no gap shows against the coarser ring outside
  const sk = (n + 1) * (n + 1);
  for (let e = 0; e < 4; e++) for (let i = 0; i < n; i++) {
    const top = (q) => e === 0 ? q : e === 1 ? n * (n + 1) + q : e === 2 ? q * (n + 1) : q * (n + 1) + n;
    const a = top(i), b = top(i + 1), c = sk + e * (n + 1) + i, d = c + 1;
    if (e === 0 || e === 3) { idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c; } else { idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 4, true)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 4, true)); g.setAttribute('aMat', new THREE.BufferAttribute(mt, 4, false)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  const mesh = new THREE.Mesh(g, mat);
  game.world.addRenderable(mesh, { frame: f, origin: [0, 0, 0], center: [0, 0, 0], radius: cfg.half * 1.6, far: 1e5, caster: false, always: true });
  const L = { grass: matLayer('grass'), sand: matLayer('sand'), gravel: matLayer('gravel'), stone: matLayer('stone'), soil: matLayer('soil') };
  const T = { grass: matTile('grass'), sand: matTile('sand'), gravel: matTile('gravel'), stone: matTile('stone'), soil: matTile('soil') };
  const ring = { mesh, cx: 1e9, cz: 1e9, cfg, level, job: null };
  // the land is sampled on a grid one cell wider than the mesh all round, so normals need no extra samples
  const m = n + 3, Hh = new Float32Array(m * m), Bb = new Uint8Array(m * m), Sh = new Float32Array(m * m), Tr = new Float32Array(m * m);
  // ask for the ring to be centred near (px, pz); the work is done a little at a time by work()
  ring.want = (px, pz, inner) => {
    const cx = Math.round(px / cfg.snap) * cfg.snap, cz = Math.round(pz / cfg.snap) * cfg.snap;
    const cur = ring.job || ring;
    if (cx === cur.cx && cz === cur.cz) { if (!ring.job && inner && ring.inner && (inner.dx !== ring.inner.dx || inner.dz !== ring.inner.dz)) ring.job = { cx, cz, inner, row: m }; return; }
    ring.job = { cx, cz, inner, row: 0 };
  };
  // returns true when the ring is up to date
  ring.work = (ms) => {
    const job = ring.job; if (!job) return true;
    const c = cfg.cell, h0 = cfg.half, t0 = performance.now();
    while (job.row < m) {
      const j = job.row, wz = job.cz - h0 + (j - 1) * c;
      for (let i = 0; i < m; i++) { const l = landAt(job.cx - h0 + (i - 1) * c, wz); const q = j * m + i; Hh[q] = l.h; Bb[q] = l.biome; Sh[q] = l.shade; Tr[q] = overlay ? l.pd : l.tree; }
      job.row++;
      if (performance.now() - t0 > ms) return false;
    }
    const cx = job.cx, cz = job.cz, inner = job.inner;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const lx = -h0 + i * c, lz = -h0 + j * c; const v = j * (n + 1) + i, q = (j + 1) * m + (i + 1);
      let b = Bb[q]; const hh = Hh[q], sh = Sh[q], tree = overlay ? 0 : Tr[q];
      let y = hh + (overlay ? 0.035 : 0);
      // paths are drawn by the overlay; under them the ground is whatever lies beside the path
      if (!overlay && b === BIOME.PATH) { const alt = [Bb[q + 1], Bb[q - 1], Bb[q + m], Bb[q - m], Bb[q + m + 1], Bb[q - m - 1]]; b = BIOME.LAWN; for (const a of alt) if (a !== BIOME.PATH) { b = a; break; } }
      if (overlay) b = BIOME.PATH;
      if (inner && Math.abs(lx - inner.dx) < inner.half - c && Math.abs(lz - inner.dz) < inner.half - c) y -= 1.2 + level;
      pos[v * 3] = lx; pos[v * 3 + 1] = y; pos[v * 3 + 2] = lz;
      const hx = Hh[q + 1] - Hh[q - 1], hz = Hh[q + m] - Hh[q - m];
      const nl = Math.hypot(hx, 2 * c, hz); nrm[v * 4] = -hx / nl * 127; nrm[v * 4 + 1] = 2 * c / nl * 127; nrm[v * 4 + 2] = -hz / nl * 127;
      const gd = GROUND[b] || GROUND[0]; const layer = L[gd[0]], tile = T[gd[0]]; let r = gd[1][0], gg = gd[1][1], bb = gd[1][2];
      if (b === BIOME.LAKE) { const d = clamp((LAND.WATER - hh) / 2, 0, 1); r = lerp(210, 70, d); gg = lerp(205, 110, d); bb = lerp(180, 110, d); }
      const kk = 0.86 + 0.28 * sh; const shadeTree = 1 - 0.18 * Math.min(1, tree * 1.5) * (level > 0 ? 1 : 0.3);
      col[v * 4] = clamp(r * kk * shadeTree, 0, 255); col[v * 4 + 1] = clamp(gg * kk * shadeTree, 0, 255); col[v * 4 + 2] = clamp(bb * kk * shadeTree, 0, 255);
      col[v * 4 + 3] = overlay ? clamp(255 * (0.5 + (1.6 - Tr[q]) / 2.4), 0, 255) : 255;
      mt[v * 4] = layer; mt[v * 4 + 1] = 0; mt[v * 4 + 2] = 0; mt[v * 4 + 3] = 128;
      uv[v * 2] = (lx + (cx % (tile * 64))) / tile; uv[v * 2 + 1] = (lz + (cz % (tile * 64))) / tile;
    }
    for (let e = 0; e < 4; e++) for (let i = 0; i <= n; i++) {
      const src = e === 0 ? i : e === 1 ? n * (n + 1) + i : e === 2 ? i * (n + 1) : i * (n + 1) + n, dst = sk + e * (n + 1) + i;
      pos[dst * 3] = pos[src * 3]; pos[dst * 3 + 1] = pos[src * 3 + 1] - 3 - level * 2; pos[dst * 3 + 2] = pos[src * 3 + 2];
      for (let q = 0; q < 4; q++) { nrm[dst * 4 + q] = nrm[src * 4 + q]; col[dst * 4 + q] = col[src * 4 + q]; mt[dst * 4 + q] = mt[src * 4 + q]; }
      uv[dst * 2] = uv[src * 2]; uv[dst * 2 + 1] = uv[src * 2 + 1];
    }
    for (const a of ['position', 'normal', 'uv', 'aColor', 'aMat']) g.attributes[a].needsUpdate = true;
    const o = mesh.userData.origin; o[0] = cx; o[1] = 0; o[2] = cz;
    ring.cx = cx; ring.cz = cz; ring.inner = inner; ring.job = null;
    return true;
  };
  return ring;
}

// ---- trees: four kinds, each drawn once near and once simply, then instanced
function treeModels() {
  const R = (s) => { let x = s * 9973; return () => { x = (x * 16807) % 2147483647; return (x % 100000) / 100000; }; };
  const near = (sp) => {
    const g = new Geo(new MeshBuf(2048, 4096)), cut = new Geo(new MeshBuf(2048, 4096)); const r = R(sp + 3);
    if (sp === 3) {                 // bamboo clump
      for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = r() * 0.5, h = 5 + r() * 3, lx = Math.cos(a) * 0.5 * r(), lz = Math.sin(a) * 0.5 * r();
        g.mat('wood', '#8fa35a', { rough: -0.1 }); g.tube([[Math.cos(a) * d, 0, Math.sin(a) * d], [Math.cos(a) * d + lx * 0.4, h * 0.5, Math.sin(a) * d + lz * 0.4], [Math.cos(a) * d + lx * 1.6, h, Math.sin(a) * d + lz * 1.6]], [0.035, 0.03, 0.012], { segs: 5 });
        cut.mat('leafB', '#e6f2c0', { sway: 0.9 }); for (let k = 0; k < 5; k++) { const hh = h * (0.45 + 0.11 * k); cut.card(Math.cos(a) * d + lx * (hh / h) * 1.2, hh, Math.sin(a) * d + lz * (hh / h) * 1.2, 1.5, 1.4, r() * 6.28, { tilt: 0.3 }); } }
      return { g: g.buf, cut: cut.buf, r: 0.35 };
    }
    const birch = sp === 2, apple = sp === 0; const H = apple ? 3.6 : birch ? 9 : 7.5, tr = apple ? 0.11 : birch ? 0.1 : 0.2, crown = apple ? 2.1 : birch ? 1.7 : 3.4, cy = apple ? 2.6 : birch ? 6.2 : 5;
    g.mat(birch ? 'paper' : 'bark', birch ? '#e8e4d8' : apple ? '#7a6652' : '#ffffff');
    g.tube([[0, 0, 0], [0.04, H * 0.3, 0.02], [-0.03, H * 0.62, 0.05], [0.02, H * 0.88, 0]], [tr * 1.25, tr, tr * 0.7, tr * 0.3], { segs: 7 });
    const nb = apple ? 5 : birch ? 6 : 7;
    for (let i = 0; i < nb; i++) { const a = i / nb * 6.28 + r(), y0 = H * (0.32 + 0.45 * r()), len = crown * (0.6 + 0.4 * r()); g.tube([[0, y0, 0], [Math.cos(a) * len * 0.5, y0 + len * (birch ? 0.5 : 0.3), Math.sin(a) * len * 0.5], [Math.cos(a) * len, y0 + len * (birch ? 0.75 : 0.42), Math.sin(a) * len]], [tr * 0.5, tr * 0.3, tr * 0.1], { segs: 5 }); }
    // a lumpy core of a few rounded masses gives the crown its volume; many small cards give it its leafy edge
    const coreCol = apple ? '#b9d6a0' : birch ? '#cfe0a0' : '#a9c890';
    g.mat('grass', coreCol, { rough: 0.2, shade: 'foliage' });
    const lumps = apple ? 6 : birch ? 5 : 8; const cen = [];
    for (let i = 0; i < lumps; i++) { const a = i / lumps * 6.28 + r(), rr = crown * (i === 0 ? 0 : 0.42 + 0.18 * r()), yy = cy + (r() - 0.4) * crown * (birch ? 1.1 : 0.5); const br = crown * (i === 0 ? 0.62 : 0.4 + 0.14 * r()); cen.push([Math.cos(a) * rr, yy, Math.sin(a) * rr, br]); g.ball(Math.cos(a) * rr, yy, Math.sin(a) * rr, br, br * (birch ? 1.25 : 0.82), br, { segs: 8, rings: 5 }); }
    cut.mat(birch ? 'leafB' : 'leafA', apple ? '#ffffff' : birch ? '#f4ffd0' : '#eaf7da', { sway: 0.7 });
    const nc = apple ? 70 : birch ? 64 : 96;
    for (let i = 0; i < nc; i++) { const c = cen[i % cen.length]; const a = r() * 6.28, el = (r() - 0.2) * 1.6, rr = c[3] * (0.8 + 0.3 * r()); const x = c[0] + Math.cos(a) * Math.cos(el) * rr, y = c[1] + Math.sin(el) * rr * (birch ? 1.2 : 0.8), z = c[2] + Math.sin(a) * Math.cos(el) * rr; const sz = (apple ? 0.6 : birch ? 0.7 : 0.9) * (0.75 + 0.5 * r()); cut.card(x, y - sz * 0.45, z, sz, sz, a + 1.57, { tilt: (r() - 0.5) * 1.1 }); }
    if (apple) { g.mat('glaze', '#b3261e', { rough: -0.1 }); for (let i = 0; i < 14; i++) { const c = cen[1 + (i % (cen.length - 1))]; const a = r() * 6.28; g.ball(c[0] + Math.cos(a) * c[3] * 0.95, c[1] - c[3] * (0.3 + 0.4 * r()), c[2] + Math.sin(a) * c[3] * 0.95, 0.036, 0.034, 0.036, { segs: 5, rings: 3 }); } }
    return { g: g.buf, cut: cut.buf, r: tr * 1.4 };
  };
  const far = (sp) => {
    const g = new Geo(new MeshBuf(256, 512));
    if (sp === 3) { g.mat('grass', '#a9c07a', { shade: 'foliage', rough: 0.2 }); g.ball(0, 4.2, 0, 1.3, 3.8, 1.3, { segs: 6, rings: 4 }); return g.buf; }
    const birch = sp === 2, apple = sp === 0; const H = apple ? 3.6 : birch ? 9 : 7.5, crown = apple ? 2.1 : birch ? 1.7 : 3.4, cy = apple ? 2.6 : birch ? 6.2 : 5;
    g.mat(birch ? 'paper' : 'bark', birch ? '#e8e4d8' : '#8a7a68'); g.cyl(0, 0, 0, apple ? 0.12 : 0.2, H * 0.7, { segs: 4, r1: 0.05, capBottom: false });
    g.mat('grass', apple ? '#c4e0a8' : birch ? '#d6e6a8' : '#b4d298', { rough: 0.2, shade: 'foliage' }); g.ball(0, cy, 0, crown * 0.95, crown * (birch ? 1.25 : 0.72), crown * 0.95, { segs: 7, rings: 4 });
    return g.buf;
  };
  const out = []; for (let sp = 0; sp < 4; sp++) out.push({ near: near(sp), far: far(sp) });
  return out;
}

const WATER_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_SHELL}
uniform float uTime;
uniform vec3 uWaterBody;
in vec3 vPos;
in vec3 vFlat;
layout(location = 0) out vec4 outColor;
void main() {
  vec3 V = normalize(-vPos);
  float dist = length(vPos);
  // ripples: small, slow, and flatter far away
  vec2 p = vFlat.xz;
  vec2 q1 = p * 0.9 + vec2(uTime * 0.21, uTime * 0.13), q2 = p * 2.3 + vec2(-uTime * 0.31, uTime * 0.17), q3 = p * 0.17 + vec2(uTime * 0.05, -uTime * 0.03);
  float e = 0.12;
  float hx = vnoise(q1 + vec2(e, 0.0)) - vnoise(q1 - vec2(e, 0.0)) + 0.5 * (vnoise(q2 + vec2(e, 0.0)) - vnoise(q2 - vec2(e, 0.0))) + 2.0 * (vnoise(q3 + vec2(e, 0.0)) - vnoise(q3 - vec2(e, 0.0)));
  float hz = vnoise(q1 + vec2(0.0, e)) - vnoise(q1 - vec2(0.0, e)) + 0.5 * (vnoise(q2 + vec2(0.0, e)) - vnoise(q2 - vec2(0.0, e))) + 2.0 * (vnoise(q3 + vec2(0.0, e)) - vnoise(q3 - vec2(0.0, e)));
  float amp = 0.5 / (1.0 + dist * 0.02);
  float th = atan(vPos.x, uShellRho - vPos.y);
  vec3 up = vec3(-sin(th), cos(th), 0.0), tx = vec3(cos(th), sin(th), 0.0);
  vec3 N = normalize(up + (tx * -hx + vec3(0.0, 0.0, 1.0) * -hz) * amp);
  float NoV = max(dot(N, V), 0.0);
  float fres = 0.02 + 0.98 * pow(1.0 - NoV, 5.0);
  vec3 R = reflect(-V, N); if (dot(R, up) < 0.02) R = normalize(R + up * (0.02 - dot(R, up)));
  float t;
  vec3 refl = shellTrace(vPos, R, t);
  vec3 body = uWaterBody * (lineLight(th + uShellA.x, vPos.z + uShellA.y, 1500.0) * uShellA.z * 0.5 + uShellGlow * 2.0);
  vec3 col = mix(body, refl, fres);
  outColor = vec4(col, mix(0.82, 1.0, fres));
}
`;
const WATER_VERT = /* glsl */`
${GLSL_COMMON}
${GLSL_BEND}
out vec3 vPos;
out vec3 vFlat;
void main() {
  vec4 fr = frameRow(modelMatrix);
  float th; vec3 pr = bendPos(position, fr, th);
  vPos = pr; vFlat = position;
  gl_Position = projectionMatrix * viewMatrix * vec4(pr, 1.0);
}
`;

export const place = {
  id: 'hollow', name: 'The Hollow', order: 40,
  async build(game) {
    const W = game.world, pl = game.pipeline;
    const f = W.frame('hollow', DRUM.HOLLOW_R, 0, 0);
    const s = W.scope('hollow-land', f);
    const col = W.colliders(f);
    col.heightFn = (x, z) => { if (z < 0.6 || z > LAND.L - 0.6) return null; const l = landAt(x, z); return l.biome === BIOME.LAKE ? Math.max(l.h, LAND.WATER - 1.28) : l.h; };
    col.surfFn = surfAt;

    // the far bank: bake the map and hand it to the shell
    const MW = 1024, MH = 512;
    const data = bakeLandMap(MW, MH);
    const shell = game.shell = createShell(pl, data, MW, MH);
    pl.backgroundPass = (p, camera) => shell.pass(p, camera);

    // the ground
    const farMat = makeWorldMaterial({}, {}); farMat.uniforms.uFade.value.set(1380, 1590);
    const rings = RINGS.map((cfg, i) => makeRing(game, f, cfg, i, i === 2 ? farMat : W.mats.opaque));
    const pathMat = makeWorldMaterial({ VERT_ALPHA: 1 }, {});
    const paths = makeRing(game, f, RINGS[0], 0, pathMat, true);

    // the lake: one sheet at the water level; the land hides it wherever the ground is higher
    const wmat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
      uniforms: Object.assign({ uAnchorRho: worldUniforms.uAnchorRho, uTime: worldUniforms.uTime, uWaterBody: { value: new THREE.Color(0.012, 0.045, 0.05) } }, shell.uniforms),
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.NormalBlending });
    {
      const x0 = 20, x1 = 1560, z0 = 1150, z1 = 2560, nx = 78, nz = 70; const p = new Float32Array((nx + 1) * (nz + 1) * 3), ix = [];
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { const v = j * (nx + 1) + i; p[v * 3] = x0 + (x1 - x0) * i / nx - 790; p[v * 3 + 1] = LAND.WATER; p[v * 3 + 2] = z0 + (z1 - z0) * j / nz - 1855; }
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; ix.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setIndex(ix);
      const mesh = new THREE.Mesh(g, wmat);
      W.addRenderable(mesh, { frame: f, origin: [790, 0, 1855], center: [0, 0, 0], radius: 1100, far: 1e5, forward: true, always: true });
    }

    // trees
    const models = treeModels(); const NEAR = 64, FAR = 430, CAPN = 260, CAPF = 5200;
    const mk = (buf, mat, cap, caster) => {
      const geo = buf.toGeometry(); const im = new THREE.InstancedMesh(geo, mat, cap);
      const inst = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4).fill(1), 4); geo.setAttribute('aInst', inst); im.count = 0;
      W.addRenderable(im, { frame: f, origin: [0, 0, 0], center: [0, 4, 0], radius: 8, far: 1e5, caster, always: true });
      im.userData.inst = inst; return im;
    };
    const tm = models.map((m) => ({ nearO: mk(m.near.g, W.mats.inst, CAPN, true), nearC: mk(m.near.cut, W.mats.instCutout, CAPN, true), far: mk(m.far, W.mats.inst, CAPF, true), r: m.near.r }));
    const chunks = new Map(); const CH = 8;       // tree cells per cached chunk
    const chunkTrees = (cx, cz) => {
      const key = cx + ',' + cz; let a = chunks.get(key);
      if (!a) { a = []; for (let j = 0; j < CH; j++) for (let i = 0; i < CH; i++) { const t = treeInCell(cx * CH + i, cz * CH + j, TREE_CELL); if (t) a.push(t.x, t.z, t.sp, t.s, t.rot, heightAt(t.x, t.z)); } chunks.set(key, a); if (chunks.size > 2500) chunks.delete(chunks.keys().next().value); }
      return a;
    };
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    let tcx = 1e9, tcz = 1e9; let posts = [];
    const placeTrees = (px, pz) => {
      const ox = Math.round(px / 16) * 16, oz = Math.round(pz / 16) * 16; if (ox === tcx && oz === tcz) return; tcx = ox; tcz = oz;
      for (const t of tm) { t.nearO.count = 0; t.nearC.count = 0; t.far.count = 0; for (const m of [t.nearO, t.nearC, t.far]) { const o = m.userData.origin; o[0] = ox; o[1] = 0; o[2] = oz; } }
      for (const c of posts) col.remove(c); posts = [];
      const span = CH * TREE_CELL, c0x = Math.floor((ox - FAR) / span), c1x = Math.floor((ox + FAR) / span), c0z = Math.floor((oz - FAR) / span), c1z = Math.floor((oz + FAR) / span);
      for (let cz = c0z; cz <= c1z; cz++) for (let cx = c0x; cx <= c1x; cx++) {
        const a = chunkTrees(cx, cz);
        for (let i = 0; i < a.length; i += 6) {
          const x = a[i], z = a[i + 1], sp = a[i + 2], sc = a[i + 3], rot = a[i + 4], h = a[i + 5];
          const dx = wrapX(x - ox), dz = z - oz, d = Math.hypot(dx, dz); if (d > FAR) continue;
          const t = tm[sp]; Q.setFromAxisAngle(Y, rot); S.set(sc, sc, sc); P.set(dx, h - 0.05, dz); M.compose(P, Q, S);
          const tint = 0.82 + 0.36 * hash2i(Math.round(x), Math.round(z), 9);
          if (d < NEAR && t.nearO.count < CAPN) {
            const k = t.nearO.count++; t.nearO.setMatrixAt(k, M); t.nearC.setMatrixAt(k, M); t.nearC.count = t.nearO.count;
            const ia = t.nearO.userData.inst.array, ib = t.nearC.userData.inst.array; ia[k * 4] = ia[k * 4 + 1] = ia[k * 4 + 2] = 1; ib[k * 4] = tint; ib[k * 4 + 1] = tint * (0.96 + 0.08 * hash2i(Math.round(x), Math.round(z), 10)); ib[k * 4 + 2] = tint * 0.92;
            if (d < 60) posts.push(col.cyl(ox + dx, z, t.r * sc + 0.08, h - 1, h + 2.2, { surf: 'wood' }));
          } else if (t.far.count < CAPF) { const k = t.far.count++; t.far.setMatrixAt(k, M); const ia = t.far.userData.inst.array; ia[k * 4] = tint; ia[k * 4 + 1] = tint; ia[k * 4 + 2] = tint * 0.92; }
        }
      }
      for (const t of tm) for (const m of [t.nearO, t.nearC, t.far]) { m.instanceMatrix.needsUpdate = true; m.userData.inst.needsUpdate = true; }
    };

    // light: the Hollow's own glow (everything lit by the line lights everything else), and a little lamplight at night
    const glow = s.ambient({ box: [-4712, -6, 0, 4712, 400, LAND.L], sky: [0.5, 0.56, 0.42], ground: [0.3, 0.36, 0.22], power: 1, skylit: true, allRound: true, spec: 0.35, groundK: 1 });
    const zone = s.zoneBox({ id: 'hollow', place: 'lawns', box: [-4712, -8, 0, 4712, 60, LAND.L], name: 'The Hollow', sub: 'Chervil', ambience: 'hollow-day', reverb: 'open', headroom: 30, sky: true, skyTop: 40, sun: true, sunPower: SUN_POWER, far: 2400,
      env: { exposure: 1.0, autoKey: 0.19, autoMin: 0.02, autoMax: 5, bloom: 0.045, warmth: 0.05, contrast: 1.1, saturation: 1.12 } });
    zone.allRound = true;
    s.finish();

    // every frame: follow the player with the ground and the trees, and keep the sky current
    const sunCol = [1, 1, 1];
    game.hollow = { rings, zone, glow, shell, sunTint: null };
    game.events.on('prerender', () => {
      const p = game.player; const onFloor = p.frame === f; const here = onFloor || !!(p.frame && p.frame.hollowView);
      shell.on = here;
      if (!here) return;
      // keep the player's x inside one turn of the drum
      if (onFloor) { if (p.pos.x > LAND.C / 2) p.pos.x -= LAND.C; else if (p.pos.x < -LAND.C / 2) p.pos.x += LAND.C; }
      // from a terrace or the Spindle the land below is still drawn: follow the point of the floor under (or nearest) the eye
      const px = onFloor ? p.pos.x : wrapX(W.anchor.theta * LAND.R), pz = onFloor ? p.pos.z : Math.max(40, Math.min(LAND.L - 40, W.anchor.z));
      // the ground follows in three rings; each coarser ring sinks a little under the finer one inside it
      const first = !game.hollow.built || Math.abs(px - rings[0].cx) > 60 || Math.abs(pz - rings[0].cz) > 60;
      const c0x = Math.round(px / RINGS[0].snap) * RINGS[0].snap, c0z = Math.round(pz / RINGS[0].snap) * RINGS[0].snap;
      const c1x = Math.round(px / RINGS[1].snap) * RINGS[1].snap, c1z = Math.round(pz / RINGS[1].snap) * RINGS[1].snap;
      const c2x = Math.round(px / RINGS[2].snap) * RINGS[2].snap, c2z = Math.round(pz / RINGS[2].snap) * RINGS[2].snap;
      rings[0].want(px, pz, null); paths.want(px, pz, null);
      rings[1].want(px, pz, { dx: c0x - c1x, dz: c0z - c1z, half: RINGS[0].half });
      rings[2].want(px, pz, { dx: c1x - c2x, dz: c1z - c2z, half: RINGS[1].half });
      let budget = first ? 1e9 : 3.5;
      for (const r of [rings[0], paths, rings[1], rings[2]]) { const t0 = performance.now(); r.work(budget); budget = Math.max(0.2, budget - (performance.now() - t0)); }
      game.hollow.built = true;
      placeTrees(px, pz);
      // the sunline: plain white at noon, warm at the ends of the day; a lamp-painter may take it over (game.hollow.sunTint)
      const sun = game.clock.sun(), night = game.clock.night();
      const D = pl.sunData;
      if (game.hollow.sunTint) game.hollow.sunTint(D, game.clock);
      else { const k = kelvin(lerp(2600, 5600, smoothstep(0, 0.7, sun))); if (Math.abs(k[2] - sunCol[2]) > 0.004 || !game.hollow.inited) { sunCol[0] = k[0]; sunCol[1] = k[1]; sunCol[2] = k[2]; for (let i = 0; i < 64 * 32; i++) { D[i * 4] = k[0]; D[i * 4 + 1] = k[1]; D[i * 4 + 2] = k[2]; D[i * 4 + 3] = 1; } pl.sunTex.needsUpdate = true; game.hollow.inited = true; } }
      const g0 = 0.05 + 0.95 * sun;
      glow.scale = SUN_POWER * 0.2 * sun + 0.05 * (1 - sun);
      shell.set(W.anchor, sun * SUN_POWER, night, [0.085 * sun * SUN_POWER + 0.012, 0.095 * sun * SUN_POWER + 0.013, 0.07 * sun * SUN_POWER + 0.014]);
      zone.ambience = sun > 0.5 ? 'hollow-day' : sun > 0.02 ? 'hollow-dusk' : 'hollow-night';
      void g0;
    });
    game.cab.addStop({ id: 'lake-pavilion', name: 'The Hollow', sub: 'the lake pavilion, by the festival green', banner: 'The Hollow', frame: f, x: 0, y: heightAt(0, 1700) + 0.05, z: 1700, yaw: Math.PI / 2 });
    game.spawns.hollow = { frame: f, x: 0, y: heightAt(0, 1700) + 0.05, z: 1700, yaw: Math.PI / 2 };
    game.spawns.lake = { frame: f, x: 150, y: heightAt(150, 1800) + 0.05, z: 1800, yaw: Math.PI / 2 };
    game.spawns.orchard = { frame: f, x: -420, y: heightAt(-420, 1500) + 0.05, z: 1500, yaw: 0 };
  },
};
