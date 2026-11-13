// Trees, and scattering them where a Plan says there are woods and orchards. Faceted and few-sided on purpose: a
// Hollow shows tens of thousands at once.
import { Geo, instances, rgb } from './geo.js';
import { hash2, cellRand } from '../core/rng.js';
import { nearPath } from '../core/path.js';
import { C } from './plan.js';
import { WOOD_CELL } from './hollow.js';

const cache = new Map();
/**
 * A tree model, base at the origin, y up. Crowns take an instance colour; trunks do not.
 * kinds: 'round' (a broad crown), 'apple' (low and wide, an orchard tree), 'yew' (dark, layered), 'birch' (white stem, light crown),
 *        'poplar' (tall and narrow), 'bush', 'pear' (small, upright), 'pine' (flat tiers)
 */
export function treeGeo(kind = 'round') {
  if (cache.has(kind)) return cache.get(kind);
  const g = new Geo();
  g.tint(0.3);                    // trunks and stems
  const leaf = '#ffffff';
  if (kind === 'round') {
    g.cyl(0, 0, 0, 0.42, 0.26, 4.2, 5, '#8a735c');
    g.tint(1).blob(0, 7.2, 0, [3.6, 3.2, 3.6], 1, leaf, { lump: 0.22, seed: 3, shadeBottom: 0.78 }).blob(1.8, 5.6, 0.9, [2.3, 1.9, 2.3], 0, leaf, { lump: 0.2, seed: 5, shadeBottom: 0.78 }).blob(-1.6, 5.9, -1.2, [2.2, 1.8, 2.2], 0, leaf, { lump: 0.2, seed: 8, shadeBottom: 0.78 }).tint(0.3);
  } else if (kind === 'apple') {
    g.cyl(0, 0, 0, 0.26, 0.2, 1.7, 5, '#8a735c');
    g.tint(1).blob(0, 3.1, 0, [2.5, 1.8, 2.5], 1, leaf, { lump: 0.2, seed: 2, shadeBottom: 0.8 }).tint(0.3);
  } else if (kind === 'pear') {
    g.cyl(0, 0, 0, 0.2, 0.15, 1.4, 5, '#5e4a38');
    g.tint(1).blob(0, 3.4, 0, [1.5, 2.3, 1.5], 1, leaf, { lump: 0.18, seed: 4 }).tint(0.3);
  } else if (kind === 'yew') {
    g.cyl(0, 0, 0, 0.5, 0.35, 2.2, 5, '#4a382c');
    g.tint(1);
    g.cyl(0, 1.6, 0, 3.9, 2.4, 3.0, 7, leaf, { smooth: false, top: leaf });
    g.cyl(0, 4.2, 0, 3.0, 1.5, 3.0, 7, leaf, { smooth: false });
    g.cyl(0, 6.8, 0, 2.0, 0.2, 3.4, 6, leaf, { smooth: false });
    g.tint(0.3);
  } else if (kind === 'pine') {
    g.cyl(0, 0, 0, 0.35, 0.2, 9.5, 5, '#6b4c38');
    g.tint(1);
    g.cyl(0, 5.2, 0, 3.4, 0.5, 1.6, 6, leaf, { smooth: false });
    g.cyl(0, 7.2, 0, 2.6, 0.4, 1.6, 6, leaf, { smooth: false });
    g.cyl(0, 9.0, 0, 1.7, 0.1, 1.9, 6, leaf, { smooth: false });
    g.tint(0.3);
  } else if (kind === 'birch') {
    g.cyl(0, 0, 0, 0.2, 0.12, 7.4, 5, '#e2dfd4');
    g.cyl(0, 2.1, 0, 0.21, 0.2, 0.3, 5, '#3c3a36'); g.cyl(0, 4.4, 0, 0.18, 0.17, 0.25, 5, '#3c3a36');
    g.tint(1).blob(0, 8.0, 0, [2.0, 2.6, 2.0], 1, leaf, { lump: 0.28, seed: 6 }).blob(0.9, 6.2, 0.4, [1.3, 1.4, 1.3], 0, leaf, { lump: 0.25, seed: 9 }).tint(0.3);
  } else if (kind === 'poplar') {
    g.cyl(0, 0, 0, 0.3, 0.2, 3.0, 5, '#5b4735');
    g.tint(1).blob(0, 8.5, 0, [1.7, 6.4, 1.7], 1, leaf, { lump: 0.14, seed: 7 }).tint(0.3);
  } else if (kind === 'bush') {
    g.tint(1).blob(0, 0.9, 0, [1.4, 1.0, 1.4], 0, leaf, { lump: 0.25, seed: 1 }).tint(0.3);
  } else throw new Error('no such tree: ' + kind);
  const geo = g.build();
  cache.set(kind, geo);
  return geo;
}

const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

/**
 * Stand real trees near the flight, exactly where the ground draws their crowns: in woods (green of the plan's mask)
 * one to a cell, in orchards (green of its kind layer) one on every lattice point. Farther off the ground's own
 * painted crowns carry on, so only the trees the camera passes close to need building.
 * opts:
 *   near       flat points of the camera's flight (path.points())
 *   radius     how far from the flight trees stand at full number (default 170); thinning to none by 1.5 x that
 *   wood       [{ kind, weight, tint }, ...] the mix of trees in woods (default round and birch); colours come from the plan
 *   orchard    { kind, scale } (default apple)
 *   max        most trees to plant
 * The orchard lattice, its sections and the blossom colours are read from the Hollow's ground, so they always agree.
 * returns the meshes (already added to the Hollow)
 */
export function* scatterTrees(hollow, opts = {}) {
  const near = opts.near, R = opts.radius || 170, R2 = R * 1.5;
  const woodMix = opts.wood || [{ kind: 'round', weight: 3 }, { kind: 'birch', weight: 1, tint: [1.25, 1.25, 0.9] }];
  const orch = opts.orchard || { kind: 'apple' };
  const gu = hollow.ground.material.uniforms;
  const rows = [gu.uRows.value.x, gu.uRows.value.y], sec = [gu.uSection.value.x, gu.uSection.value.y];
  const canopy = [gu.uCanopy.value.x, gu.uCanopy.value.y, gu.uCanopy.value.z], blossom = [gu.uBlossom.value.x, gu.uBlossom.value.y, gu.uBlossom.value.z];
  const bShare = gu.uBlossomShare.value;
  const max = opts.max || 30000, S = WOOD_CELL;
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const p of near) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  x0 -= R2; x1 += R2; z0 = Math.max(0, z0 - R2); z1 = Math.min(hollow.plan.L, z1 + R2);
  if (x1 - x0 > C) { x0 = 0; x1 = C; }
  const coarse = near.filter((_, i) => i % 2 === 0);
  const lists = new Map();
  const put = (kind, item) => { let a = lists.get(kind); if (!a) lists.set(kind, a = []); a.push(item); };
  const totalW = woodMix.reduce((a, b) => a + (b.weight || 1), 0);
  const wrapI = (i, n) => ((i % n) + n) % n;
  const nxW = Math.round(C / S);                 // the shader's cells do not wrap, so neither do these: x stays in 0 .. C
  let count = 0, t0 = performance.now();
  for (let gz = Math.floor(z0 / S); gz * S < z1 && count < max; gz++) {
    for (let gxi = Math.floor(x0 / S); gxi * S < x1; gxi++) {
      const gx = wrapI(gxi, nxW);
      const r = cellRand(gx, gz);
      const x = (gx + 0.15 + 0.7 * r[0]) * S, z = (gz + 0.15 + 0.7 * r[1]) * S;
      const s = hollow.at(x, z);
      if (r[2] >= s.wood + 0.02 || s.water > 0.2) continue;
      const d = nearPath(coarse, x, z, C);
      if (d > R2) continue;
      if (d > R && hash2(gx, gz, 37) > 1 - (d - R) / (R2 - R)) continue;
      let w = hash2(gx, gz, 41) * totalW, sel = woodMix[0];
      for (const m of woodMix) { w -= (m.weight || 1); if (w <= 0) { sel = m; break; } }
      const rad = S * (0.36 + 0.2 * r[3]), sc = rad / 3.6;
      const f = fr(r[3] * 7.3), k = (1.02 + 0.5 * r[3]) * 1.05, t = sel.tint || [1, 1, 1];
      const col = [lin(s.r) * k * (1.08 + (0.9 - 1.08) * f) * t[0], lin(s.g) * k * (1.02 + (1.0 - 1.02) * f) * t[1], lin(s.b) * k * (0.86 + (1.06 - 0.86) * f) * t[2]];
      put(sel.kind, { p: [x, 0, z], yaw: hash2(gx, gz, 71) * 6.28, scale: [sc, sc * (0.9 + 0.35 * hash2(gx, gz, 83)), sc], color: col });
      count++;
    }
    if (performance.now() - t0 > 4) { yield 'trees: woods'; t0 = performance.now(); }
  }
  const sx = rows[0], sz = rows[1];
  for (let gz = Math.floor(z0 / sz); gz * sz < z1 && count < max; gz++) {
    for (let gxi = Math.floor(x0 / sx); gxi * sx < x1; gxi++) {
      const gx = wrapI(gxi, Math.round(C / sx));
      const x = (gx + 0.5) * sx, z = (gz + 0.5) * sz;
      const s = hollow.at(x, z);
      if (s.rows < 0.5 || s.water > 0.2) continue;
      const d = nearPath(coarse, x, z, C);
      if (d > R2) continue;
      if (d > R && hash2(gx, gz, 37) > 1 - (d - R) / (R2 - R)) continue;
      const r = cellRand(gx, gz), q = cellRand(Math.floor(x / sec[0]) + 400, Math.floor(z / sec[1]) + 400);
      const k = 0.8 + 0.4 * r[0];
      let col = [canopy[0] * k, canopy[1] * k, canopy[2] * k];
      if (q[0] < bShare) { const u = 0.5 + 0.4 * r[1]; col = [col[0] + (blossom[0] - col[0]) * u, col[1] + (blossom[1] - col[1]) * u, col[2] + (blossom[2] - col[2]) * u]; }
      put(orch.kind, { p: [x, 0, z], yaw: hash2(gx, gz, 71) * 6.28, scale: (orch.scale || 1) * (0.92 + 0.16 * r[2]), color: col });
      count++;
    }
    if (performance.now() - t0 > 4) { yield 'trees: orchards'; t0 = performance.now(); }
  }
  const out = [];
  for (const [kind, items] of lists) { for (const m of instances(treeGeo(kind), hollow.lit, items, { frame: hollow.frame, cell: 400 })) { hollow.group.add(m); out.push(m); } yield 'trees: ' + kind; }
  hollow.setTreeNear(R * 0.8);
  out.count = count;
  return out;
}
const fr = (x) => x - Math.floor(x);
