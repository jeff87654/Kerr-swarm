// People: small faceted figures, by the thousand. Each strolls a little circle or stands; at half a g the stride floats.
import { Geo, instances } from './geo.js';
import { makeRng, hash2 } from '../core/rng.js';
import { nearPath } from '../core/path.js';
import { C } from './plan.js';

export const SKIN = ['#f1c9a5', '#d9a87c', '#b07b52', '#8a5a3a', '#5e3b26', '#e8b894'];
export const CLOTH = ['#c9563c', '#d98c2b', '#e2c14a', '#6f9a3e', '#3f8a7a', '#3a6ea5', '#5b4b9a', '#a34b86', '#d7d2c4', '#8c8577', '#2f3b45', '#b5553f', '#e7e1d3', '#7a4a2e', '#4f6f8f', '#c7a36a'];

const cache = new Map();
/** A standing figure about 1.7 m tall, facing +z. pose: 'stand' | 'sit' | 'child' | 'fly' (arms out, wing-sleeves) */
export function figureGeo(skin = SKIN[1], pose = 'stand') {
  const key = skin + pose;
  if (cache.has(key)) return cache.get(key);
  const g = new Geo();
  const k = pose === 'child' ? 0.66 : 1;
  if (pose === 'fly') {
    // lying along +z, arms wide, sleeves from wrist to hip
    g.tint(1).box(-0.2, -0.1, -0.75, 0.2, 0.12, 0.1, '#ffffff');
    g.tint(0.6).tri([-0.2, 0, -0.1], [-1.25, 0, 0.0], [-0.2, 0, 0.45], '#ffffff'); g.tri([0.2, 0, 0.45], [1.25, 0, 0.0], [0.2, 0, -0.1], '#ffffff');
    g.tri([-0.2, 0, 0.45], [-1.25, 0, 0.0], [-0.2, 0, -0.1], '#ffffff'); g.tri([0.2, 0, -0.1], [1.25, 0, 0.0], [0.2, 0, 0.45], '#ffffff');
    g.tint(0).box(-0.16, -0.08, -1.55, 0.16, 0.08, -0.75, '#3a3f48');
    g.blob(0, 0.02, 0.3, 0.14, 0, skin, { shadeBottom: 0.8 });
  } else if (pose === 'sit') {
    g.tint(0).box(-0.17, 0.0, 0.0, 0.17, 0.2, 0.5, '#3a3f48');
    g.tint(1).cyl(0, 0.18, 0, 0.21, 0.17, 0.58, 6, '#ffffff', { smooth: false });
    g.tint(0).blob(0, 0.92, 0, 0.13, 0, skin, { shadeBottom: 0.8 });
  } else {
    g.tint(0.35).box(-0.15 * k, 0, -0.1 * k, 0.15 * k, 0.86 * k, 0.1 * k, '#6a6f7a');
    g.tint(1).cyl(0, 0.82 * k, 0, 0.22 * k, 0.17 * k, 0.62 * k, 6, '#ffffff', { smooth: false });
    g.tint(0).blob(0, 1.6 * k, 0, 0.125 * k + 0.02, 0, skin, { shadeBottom: 0.8 });
  }
  const geo = g.build();
  cache.set(key, geo);
  return geo;
}

/**
 * Make a crowd from a list of spots. spots: [{ p:[x,y,z], walk (metres of stroll, 0 = standing), yaw, sit, child, color }].
 * material: a lit material made with walk: true (hollow.walk, or deck's). opts: frame, bob (default 0.1, more in low g), speed
 * returns the meshes.
 */
export function crowd(spots, material, opts = {}) {
  const rng = makeRng(opts.seed || 'crowd');
  const groups = new Map();
  for (const s of spots) {
    const pose = s.pose || (s.sit ? 'sit' : s.child ? 'child' : 'stand');
    const skin = s.skin || SKIN[Math.floor(rng() * SKIN.length)];
    const key = skin + '|' + pose;
    let a = groups.get(key); if (!a) groups.set(key, a = { skin, pose, items: [] });
    const walk = pose === 'sit' ? 0 : (s.walk === undefined ? 0 : s.walk);
    const speed = (opts.speed || 1.0) * (0.7 + 0.5 * rng());
    a.items.push({
      p: s.p, yaw: walk > 0 ? 0 : (s.yaw === undefined ? rng() * 6.28 : s.yaw), scale: 0.92 + 0.16 * rng(),
      color: s.color || CLOTH[Math.floor(rng() * CLOTH.length)],
      walk: [walk, (rng() < 0.5 ? -1 : 1) * speed, rng() * 6.28, walk > 0 ? (opts.bob === undefined ? 0.1 : opts.bob) : 0],
    });
  }
  const out = [];
  for (const g of groups.values()) for (const m of instances(figureGeo(g.skin, g.pose), material, g.items, { frame: opts.frame, cell: opts.cell || 400, walk: true })) out.push(m);
  return out;
}

/**
 * People on a Hollow floor near the flight, where the plan says there is life (blue of the kind layer).
 * opts: near (flat flight points), radius (default 220), density (people per 100 m2 at life = 1, default 1.2), max,
 *       clear (metres kept empty either side of the flight where it is under 6 m up, default 3.5: nobody stands in the lens)
 */
export function* scatterPeople(hollow, opts = {}) {
  const near = opts.near.filter((_, i) => i % 3 === 0), R = opts.radius || 220, cell = 4;
  const dens = (opts.density === undefined ? 1.2 : opts.density) * cell * cell / 100, max = opts.max || 9000;
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const p of near) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  x0 -= R; x1 += R; z0 = Math.max(0, z0 - R); z1 = Math.min(hollow.plan.L, z1 + R);
  const spots = [];
  const low = opts.near.filter((p) => p.y < 6), clearR = opts.clear === undefined ? 3.5 : opts.clear;
  let t0 = performance.now();
  for (let gz = Math.floor(z0 / cell); gz * cell < z1 && spots.length < max; gz++) {
    for (let gx = Math.floor(x0 / cell); gx * cell < x1; gx++) {
      const x = (gx + hash2(gx, gz, 5)) * cell, z = (gz + hash2(gx, gz, 9)) * cell;
      const s = hollow.at(x, z);
      if (s.water > 0.25 || s.life < 0.05) continue;
      const d = nearPath(near, x, z, C);
      if (d > R) continue;
      if (hash2(gx, gz, 13) > dens * s.life * (1 - (d / R) * (d / R))) continue;
      if (d < 40 && low.length && nearPath(low, x, z, C) < clearR + 9) { if (nearSeg(low, x, z) < clearR) continue; }
      const r = hash2(gx, gz, 17);
      spots.push({ p: [((x % C) + C) % C, 0, z], walk: r < 0.45 ? 0 : 1.5 + 9 * hash2(gx, gz, 19), sit: r < 0.22, child: r > 0.86 });
    }
    if (performance.now() - t0 > 4) { yield 'people'; t0 = performance.now(); }
  }
  const meshes = crowd(spots, hollow.walk, { frame: hollow.frame, bob: opts.bob === undefined ? 0.16 : opts.bob, speed: 0.95, seed: opts.seed || 'hollowfolk' });
  for (const m of meshes) hollow.group.add(m);
  meshes.count = spots.length;
  return meshes;
}

// distance from (x, z) to the nearest stretch of a flight (flat points), ignoring height
function nearSeg(points, x, z) {
  let best = 1e18;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz;
    if (l2 > 400) continue;                      // not neighbours along the flight
    let t = l2 > 0 ? ((x - a.x) * dx + (z - a.z) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const ex = a.x + dx * t - x, ez = a.z + dz * t - z, d = ex * ex + ez * ez;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}
