// The land of Chervil's Hollow: one function says what is where on the whole floor (9.4 km round, 3.75 km long), and
// everything else is derived from it: the ground you walk on, where trees stand, the lake, the paths, and the picture of the
// far bank that hangs overhead. x is metres spinward along the floor (it wraps), z is the drum's own z (0 front, 3750 back).
import { noise2, fbm2, clamp, smoothstep, lerp, hash2i, mod } from '../core/util.js';
import { DRUM } from '../core/drum.js';

export const LAND = {
  R: DRUM.HOLLOW_R, C: 2 * Math.PI * DRUM.HOLLOW_R, L: DRUM.L,
  WATER: -0.35,                         // lake surface, metres relative to the floor datum
  PAVILION: 170,                        // lift pavilions stand on a grid about this far apart
};
export const BIOME = { LAWN: 0, ORCHARD: 1, WOOD: 2, LAKE: 3, BEACH: 4, PATH: 5, MEADOW: 6, GREEN: 7, PLAZA: 8, GROUND: 9, GARDEN: 10 };
const C = LAND.C;

export function wrapX(x) { return x - C * Math.floor(x / C + 0.5); }
// periodic noise in x (period C) so the land joins up round the drum
function pn(x, z, s, seed) { const u = (x / C + 0.5); const k = Math.round(C / s); const fx = u * k, xi = Math.floor(fx), t = fx - xi; const a = noise2(mod(xi, k), z / s, seed), b = noise2(mod(xi + 1, k), z / s, seed); const w = t * t * (3 - 2 * t); return a + (b - a) * w; }

// The lake: an irregular water with one island, on the spinward side of the festival green.
function lakeField(x, z) {
  const dx = (x - 760) / 640, dz = (z - 1850) / 560;
  let d = 1 - Math.sqrt(dx * dx + dz * dz);
  d += (pn(x, z, 260, 11) - 0.5) * 0.55 + (pn(x, z, 70, 12) - 0.5) * 0.14;
  const ix = (x - 620) / 70, iz = (z - 1760) / 110; d -= Math.max(0, 1 - Math.sqrt(ix * ix + iz * iz)) * 0.9;      // the island
  return d;                              // > 0 inside the water
}
// Paths: a loose grid of gravel walks, wandering a little.
function pathDist(x, z) {
  const w1 = (pn(x, z, 260, 21) - 0.5) * 90, w2 = (pn(x, z, 260, 22) - 0.5) * 90;
  const ax = x + w1 + 85, az = z + w2 + 85 - 50;
  let gx = Math.abs(mod(ax, 170) - 85), gz = Math.abs(mod(az, 170) - 85);
  // not every stretch of the grid is a path: about a third are left as grass, so the walks read as walks, not graph paper
  const ix = Math.floor(ax / 170), iz = Math.floor(az / 170);
  if (hash2i(Math.round(ax / 170), iz, 31) < 0.38) gx = 99;
  if (hash2i(ix, Math.round(az / 170), 32) < 0.38) gz = 99;
  return Math.min(gx, gz);
}
const out = { biome: 0, h: 0, shade: 0, tree: 0, wet: 0, pd: 99 };
// What is at (x, z): fills and returns a shared object { biome, h (height in m), shade (0..1 variation), tree (tree density 0..1), wet }.
export function landAt(x, z) {
  x = wrapX(x);
  const o = out; o.wet = 0;
  const n1 = pn(x, z, 420, 1), n2 = pn(x, z, 130, 2), n3 = pn(x, z, 37, 3);
  let h = (n1 - 0.5) * 5.0 + (n2 - 0.5) * 1.6 + (n3 - 0.5) * 0.35;
  o.shade = n3;
  const dEnd = Math.min(z, LAND.L - z);                       // distance to the nearer end wall
  let biome = BIOME.LAWN, tree = 0;
  // the big patchwork: orchards, lawns, meadows by a slow noise
  const patch = pn(x, z, 600, 5) + (pn(x, z, 150, 6) - 0.5) * 0.25;
  if (dEnd < 700 + (n2 - 0.5) * 160) { biome = BIOME.WOOD; tree = 0.55 + 0.35 * n2; }
  else if (patch > 0.58) { biome = BIOME.ORCHARD; tree = 1; }
  else if (patch < 0.36) { biome = BIOME.MEADOW; tree = 0.03; }
  else { biome = BIOME.LAWN; tree = n2 > 0.72 ? 0.25 : 0.015; }
  // the festival green round the lake pavilion: always open lawn
  const gx = (x - 10) / 150, gz = (z - 1790) / 230; const green = 1 - Math.sqrt(gx * gx + gz * gz);
  if (green > 0) { biome = BIOME.GREEN; tree = 0; h *= clamp(1 - green * 2.2, 0, 1); }
  else if (green > -0.25 && biome === BIOME.ORCHARD) { biome = BIOME.LAWN; tree = 0.02; }
  // the foot of each end wall: a paved band
  if (dEnd < 26) { biome = BIOME.PLAZA; tree = 0; h *= dEnd / 26; }
  // the lake
  const lk = lakeField(x, z);
  if (lk > -0.12) {
    if (lk > 0) { biome = BIOME.LAKE; tree = 0; h = LAND.WATER - 0.15 - Math.min(2.0, lk * 9); o.wet = 1; }
    else { const t = (lk + 0.12) / 0.12; if (lk > -0.05) { biome = BIOME.BEACH; tree = 0; } h = lerp(h, LAND.WATER + 0.25, smoothstep(0, 1, t)); if (biome !== BIOME.BEACH) tree *= 1 - t; }
  }
  // paths cut through everything but water
  o.pd = 99;
  if (biome !== BIOME.LAKE && biome !== BIOME.PLAZA) {
    const pd = pathDist(x, z); o.pd = pd;
    if (pd < 1.6) { biome = BIOME.PATH; tree = 0; }
    else if (pd < 4.5) tree *= (pd - 1.6) / 2.9;
  }
  o.biome = biome; o.h = h; o.tree = tree;
  return o;
}
export function heightAt(x, z) { return landAt(x, z).h; }
export function surfAt(x, z) { const b = landAt(x, z).biome; return b === BIOME.PATH ? 'gravel' : b === BIOME.BEACH ? 'sand' : b === BIOME.PLAZA ? 'stone' : b === BIOME.LAKE ? 'water' : 'grass'; }

// Pavilions (the tops of lift cores) stand where the path grid crosses: returns the nearest crossing to (x, z).
export function nearestPavilion(x, z, o) {
  const px = Math.round(x / 170) * 170, pz = Math.round((z - 50) / 170) * 170 + 50;
  o.x = px; o.z = pz; return o;
}

// Trees: one candidate per cell of a jittered grid; returns species and size, or null. Deterministic.
// species: 0 apple (orchard rows), 1 park tree (broad), 2 birch (the dim ends), 3 bamboo clump
const tr = { x: 0, z: 0, sp: 0, s: 1, rot: 0 };
export function treeInCell(ix, iz, cell) {
  const jx = hash2i(ix, iz, 71), jz = hash2i(ix, iz, 72), pick = hash2i(ix, iz, 73);
  let x = (ix + 0.5) * cell, z = (iz + 0.5) * cell;
  const l0 = landAt(x, z);
  if (l0.tree <= 0) return null;
  const orchard = l0.biome === BIOME.ORCHARD;
  if (orchard) { x += (jx - 0.5) * 0.8; z += (jz - 0.5) * 0.8; if ((ix & 1) && false) return null; }
  else { x += (jx - 0.5) * cell * 0.85; z += (jz - 0.5) * cell * 0.85; }
  const l = landAt(x, z);
  if (l.tree <= 0 || pick > l.tree) return null;
  if (z < 8 || z > LAND.L - 8) return null;
  tr.x = x; tr.z = z; tr.rot = jx * 6.283;
  if (orchard) { tr.sp = 0; tr.s = 0.85 + 0.3 * jz; }
  else if (l.biome === BIOME.WOOD) { tr.sp = hash2i(ix, iz, 74) < 0.3 ? 3 : 2; tr.s = 0.8 + 0.6 * jz; }
  else { tr.sp = 1; tr.s = 0.9 + 0.7 * jz; }
  return tr;
}
export const TREE_CELL = 7;

// ---- colours. The ground up close is a texture times a tint; from afar it is the same thing averaged, with the trees on top.
// GROUND[biome] = [texture, tint as sRGB bytes]; the far colour is derived from these so near and far agree.
export const GROUND = {
  [BIOME.LAWN]: ['grass', [255, 255, 255]], [BIOME.GREEN]: ['grass', [235, 255, 215]], [BIOME.MEADOW]: ['grass', [255, 240, 190]], [BIOME.ORCHARD]: ['grass', [205, 232, 200]],
  [BIOME.WOOD]: ['soil', [200, 215, 170]], [BIOME.LAKE]: ['sand', [200, 200, 180]], [BIOME.BEACH]: ['sand', [255, 255, 255]], [BIOME.PATH]: ['gravel', [235, 222, 200]],
  [BIOME.PLAZA]: ['stone', [214, 204, 188]], [BIOME.GROUND]: ['soil', [255, 255, 255]], [BIOME.GARDEN]: ['grass', [220, 240, 200]],
};
// the average linear colour of each ground texture as the world shader shows it (texture x 1.25)
const TEX_AVG = { grass: [0.088, 0.18, 0.04], sand: [0.68, 0.62, 0.47], gravel: [0.5, 0.48, 0.43], stone: [0.62, 0.62, 0.62], soil: [0.3, 0.215, 0.155] };
const lin = (b) => Math.pow(b / 255, 2.2), enc = (v) => Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2) * 255;
const FAR = {};
for (const k in GROUND) { const g = GROUND[k], a = TEX_AVG[g[0]]; FAR[k] = [a[0] * lin(g[1][0]), a[1] * lin(g[1][1]), a[2] * lin(g[1][2])]; }
const CANOPY = [0.045, 0.125, 0.028], CANOPY_WOOD = [0.03, 0.085, 0.028];

// Bake the whole floor into an RGBA image: rgb = colour seen from afar, a = night lights (lamps along paths, pavilions).
// Returns a Uint8Array (w * h * 4), rows from z = 0 to L, columns from x = -C/2 to C/2.
export function bakeLandMap(w, h) {
  const data = new Uint8Array(w * h * 4); const texel = C / w;
  for (let j = 0; j < h; j++) {
    const z = (j + 0.5) / h * LAND.L;
    for (let i = 0; i < w; i++) {
      const x = ((i + 0.5) / w - 0.5) * C;
      const l = landAt(x, z); let b = l.biome; const pd = l.pd;
      // a path is narrower than a texel: take the land beside it and lay the path over by how much of the texel it covers
      let pathCover = 0;
      if (pd < texel * 0.5 + 1.6 && b !== BIOME.LAKE && b !== BIOME.PLAZA) { pathCover = clamp(2.6 / texel, 0, 1) * clamp(1.4 - pd / (texel * 0.5 + 1.6), 0, 1); if (b === BIOME.PATH) { const l2 = landAt(x + 6, z + 6); b = l2.biome === BIOME.PATH ? BIOME.LAWN : l2.biome; landAt(x, z); } }
      const c = FAR[b] || FAR[0];
      const k = 0.86 + 0.28 * l.shade; let r = c[0] * k, g = c[1] * k, bl = c[2] * k;
      if (l.tree > 0.05 && b !== BIOME.PATH) {
        const cov = clamp(l.tree * (b === BIOME.ORCHARD ? 0.62 : 0.8), 0, 0.85) * (0.75 + 0.5 * hash2i(i, j, 5)); const cc = b === BIOME.WOOD ? CANOPY_WOOD : CANOPY;
        r = lerp(r, cc[0], cov); g = lerp(g, cc[1], cov); bl = lerp(bl, cc[2], cov);
      }
      if (b === BIOME.LAKE) { const d = clamp((LAND.WATER - l.h) / 2.2, 0, 1); r = lerp(0.1, 0.012, d); g = lerp(0.26, 0.06, d); bl = lerp(0.27, 0.12, d); }
      if (pathCover > 0) { const pc = FAR[BIOME.PATH]; r = lerp(r, pc[0], pathCover); g = lerp(g, pc[1], pathCover); bl = lerp(bl, pc[2], pathCover); }
      const q = (j * w + i) * 4;
      data[q] = enc(r); data[q + 1] = enc(g); data[q + 2] = enc(bl);
      // night lights: lamps strung along the paths, brighter at the crossings (pavilions) and along the foot of the walls
      let a = 0;
      if (pathCover > 0 || l.biome === BIOME.PATH) a = hash2i(i, j, 9) < 0.3 ? 170 : 0;
      const pvx = Math.abs(mod(x + 85, 170) - 85), pvz = Math.abs(mod(z - 50 + 85, 170) - 85); if (pvx < texel && pvz < texel) a = 255;
      if (l.biome === BIOME.PLAZA && (i % 2) === 0) a = 200;
      data[q + 3] = a;
    }
  }
  return data;
}
