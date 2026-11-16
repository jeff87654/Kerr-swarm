// People: small faceted figures, by the thousand. Each strolls a little circle or stands; at half a g the stride floats.
// The figures themselves are made in kit/human.js: eight people to cast a crowd from (two builds of adult and a child,
// with their hair and clothes), each at four levels of detail, standing or sitting. Near the camera a person has a
// face, hands and shoes; far off, a few dozen facets. The vertex shader (kit/mats.js) walks their legs and arms in step
// with the ground they cover, turns their heads, and gives each their own skin, hair and trousers.
import { BufferGeometry, Float32BufferAttribute, Uint8BufferAttribute, Mesh, Sphere, Vector3, InstancedMesh, InstancedBufferAttribute, DynamicDrawUsage, Matrix4, Quaternion } from 'three';
import { Geo, instances, rgb, share } from './geo.js';
import { makeRng, hash2 } from '../core/rng.js';
import { nearPath } from '../core/path.js';
import { C } from './plan.js';
import { FOLK_LOD, folkMaterial } from './mats.js';
import { makeFolkKit, FOLK_SKIN, FOLK_LEGS } from './human.js';

export const SKIN = FOLK_SKIN;
export const CLOTH = ['#c9563c', '#d98c2b', '#e2c14a', '#6f9a3e', '#3f8a7a', '#3a6ea5', '#5b4b9a', '#a34b86', '#d7d2c4', '#8c8577', '#2f3b45', '#b5553f', '#e7e1d3', '#7a4a2e', '#4f6f8f', '#c7a36a'];

const KIT = makeFolkKit(), PART = KIT.PART;
// what each part is painted when a figure carries no look of its own: [colour, how far the instance colour tints it]
const PAINT = { [PART.fixed]: ['#808080', 0], [PART.hair]: ['#35261c', 0], [PART.top]: ['#ffffff', 1], [PART.legs]: ['#6a6f7a', 0.35], [PART.shoes]: ['#2b2725', 0], [PART.eye]: ['#1b1513', 0] };

const cache = new Map(), built = new Map();
/**
 * One of the cast (see CAST in kit/human.js) as a geometry: lod 0 (near) .. 3 (far), kind 'stand' | 'chair' | 'ground'.
 * skin: the colour baked in for meshes whose copies carry no look. tag: the level the shader takes it for
 * (0..3: drawn only over that level's distances; 4: always; 5: from the middle distance outward).
 */
function folkGeo(cast, lod, kind, skin, tag) {
  const key = [cast, lod, kind, skin, tag].join('|');
  let g = cache.get(key);
  if (g) return g;
  // the figure standing is kept: its sitting poses are made from it
  const far = lod >= 3 && kind !== 'stand', bk = cast + '|' + lod + (far ? kind : '');
  let mesh = built.get(bk);
  if (!mesh) built.set(bk, mesh = KIT.build({ ...KIT.CAST[cast], lod, sit: far ? kind : undefined }));
  if (kind !== 'stand') mesh = KIT.sitting(mesh, kind);
  const pk = KIT.pack(mesh, tag), n = pk.count, col = new Uint8Array(n * 4), sk = rgb(skin || SKIN[1]);
  for (let i = 0; i < n; i++) {
    const part = pk.part[i * 3], ao = pk.part[i * 3 + 1], paint = PAINT[part], c = part === PART.skin ? sk : rgb(paint[0]);
    col[i * 4] = Math.min(255, c[0] * ao * 255); col[i * 4 + 1] = Math.min(255, c[1] * ao * 255); col[i * 4 + 2] = Math.min(255, c[2] * ao * 255);
    col[i * 4 + 3] = part === PART.skin ? 0 : paint[1] * 255;
  }
  g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pk.pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(pk.nor, 3));
  g.setAttribute('aCol', new Uint8BufferAttribute(col, 4, true));
  g.setAttribute('aEmit', new Float32BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('aRig', new Float32BufferAttribute(pk.rig, 4));
  g.setAttribute('aPart', new Float32BufferAttribute(pk.part, 3));
  g.computeBoundingSphere();
  g.userData.shared = true;             // instances() shares these vertices between meshes instead of copying them
  cache.set(key, g);
  return g;
}

/**
 * A figure about 1.7 m tall, facing +z, to instance yourself. pose: 'stand' | 'sit' (on a seat at the origin) | 'child' |
 * 'fly' (arms out, wing-sleeves). Under a lit material it walks when its copies carry walk or drift. It is a person at
 * middle distance (a hundred-odd facets): crowd() and drifters() draw nearer people in full.
 */
export function figureGeo(skin = SKIN[1], pose = 'stand') {
  if (pose !== 'fly') {
    const even = SKIN.indexOf(skin) % 2 === 0;
    return folkGeo(pose === 'child' ? 'c1' : even ? 'a1' : 'b1', 2, pose === 'sit' ? 'chair' : 'stand', skin, 4);
  }
  const key = skin + pose;
  if (cache.has(key)) return cache.get(key);
  const g = new Geo();
  // lying along +z, arms wide, sleeves from wrist to hip
  g.tint(1).box(-0.2, -0.1, -0.75, 0.2, 0.12, 0.1, '#ffffff');
  g.tint(0.6).tri([-0.2, 0, -0.1], [-1.25, 0, 0.0], [-0.2, 0, 0.45], '#ffffff'); g.tri([0.2, 0, 0.45], [1.25, 0, 0.0], [0.2, 0, -0.1], '#ffffff');
  g.tri([-0.2, 0, 0.45], [-1.25, 0, 0.0], [-0.2, 0, -0.1], '#ffffff'); g.tri([0.2, 0, -0.1], [1.25, 0, 0.0], [0.2, 0, 0.45], '#ffffff');
  g.tint(0).box(-0.16, -0.08, -1.55, 0.16, 0.08, -0.75, '#3a3f48');
  g.blob(0, 0.02, 0.3, 0.14, 0, skin, { shadeBottom: 0.8 });
  const geo = g.build();
  cache.set(key, geo);
  return geo;
}

// ---------------------------------------------------------------- who is in a crowd
const ADULTS = ['a1', 'a1', 'a2', 'a2', 'a3', 'b1', 'b1', 'b2', 'b2', 'b3'];
// who stands in for whom as people get further off: fewer kinds of figure, so fewer things to draw
const MID = { a1: 'a1', a2: 'a1', a3: 'a3', b1: 'b1', b2: 'b1', b3: 'b3', c1: 'c1', c2: 'c2' };
const FAR = { a1: 'a1', a2: 'a1', a3: 'b3', b1: 'a1', b2: 'a1', b3: 'b3', c1: 'c1', c2: 'c1' };
// one person: which of the cast, how they sit, and their look (skin, hair, legs: indices into kit/human.js's palettes)
function dress(it, pose, skin, onGround, r) {
  it.cast = pose === 'child' ? (r() < 0.5 ? 'c1' : 'c2') : ADULTS[Math.floor(r() * ADULTS.length)];
  it.kind = pose === 'sit' ? (onGround ? 'ground' : 'chair') : 'stand';
  let si = SKIN.indexOf(skin); if (si < 0) si = 1;
  const grey = r(), dark = si >= 2 && si <= 4;
  const hair = grey < 0.1 ? (r() < 0.4 ? 8 : 7) : Math.floor(r() * (dark ? 3 : 7));
  it.look = [si, hair, Math.floor(r() * FOLK_LEGS.length)];
}
const groupBy = (items, key) => { const g = new Map(); for (const it of items) { const k = key(it); let a = g.get(k); if (!a) g.set(k, a = []); a.push(it); } return g; };

const CELL = 30, SLACK = 2.5;      // SLACK: metres either side of a hand-over in which a person is in both pools (the shader picks one)
const _v = new Vector3();
/**
 * The nearer levels of detail, as pools: one mesh for each kind of figure at each level, filled again every picture
 * with exactly the people who are within that level's range just then. (The shader drops whoever is outside a level's
 * range, person by person, so the far mesh and the pools never draw the same person twice.)
 * list: the people, dressed (cast, kind, look). extra: [[attribute, size, values], ...]: what each copy carries besides
 * its matrix, colour and look. where(i, t, v): put the flat place of person i at time t in v.
 * cells: null to consider everyone each picture, or [{ c, r, items }] (centre and radius as drawn, indices into list)
 * to consider only those near the camera. bounds: a sphere round them all, as drawn.
 * returns the meshes; the first is an empty one that does the work.
 */
function pools(list, material, extra, where, cells, bounds) {
  const mat = folkMaterial(material), n = list.length;
  if (mat === material) return [];                             // not a lit material: the far figures are all there is
  // what each person's copy carries, kept so that a pool is filled without working anything out again
  const M = new Float32Array(n * 16), col = new Float32Array(n * 3), look = new Float32Array(n * 4);
  const m4 = new Matrix4(), q = new Quaternion(), s = new Vector3(), p = new Vector3(), up = new Vector3(0, 1, 0);
  list.forEach((it, i) => {
    const sc = it.scale === undefined ? 1 : it.scale;
    if (typeof sc === 'number') s.set(sc, sc, sc); else s.set(sc[0], sc[1], sc[2]);
    m4.compose(p.set(it.p[0], it.p[1], it.p[2]), q.setFromAxisAngle(up, it.yaw || 0), s).toArray(M, i * 16);
    col.set(it.color === undefined ? [1, 1, 1] : rgb(it.color), i * 3);
    look.set([it.look[0], it.look[1], it.look[2], 0], i * 4);
  });
  const src = [M, col, look, ...extra.map((e) => e[2])], sizes = [16, 3, 4, ...extra.map((e) => e[1])], na = src.length;
  const none = new BufferGeometry();
  none.setAttribute('position', new Float32BufferAttribute(new Float32Array(9), 3)); none.setAttribute('normal', new Float32BufferAttribute(new Float32Array(9), 3));
  none.setAttribute('aCol', new Uint8BufferAttribute(new Uint8Array(12), 4, true)); none.setAttribute('aEmit', new Float32BufferAttribute(new Float32Array(3), 1));
  none.boundingSphere = bounds;
  const holder = new Mesh(none, material), out = [holder];
  holder.frustumCulled = false;
  const levels = [[], [], []], poolOf = [new Int32Array(n), new Int32Array(n), new Int32Array(n)];
  [null, MID, FAR].forEach((stand, lod) => {
    const keys = new Map();
    list.forEach((it, i) => {
      const k = (stand ? stand[it.cast] : it.cast) + '|' + it.kind;
      let j = keys.get(k);
      if (j === undefined) { keys.set(k, j = levels[lod].length); levels[lod].push({ cast: k.split('|')[0], kind: k.split('|')[1], cap: 0, n: 0 }); }
      levels[lod][j].cap++; poolOf[lod][i] = j;
    });
    for (const P of levels[lod]) {
      const g = share(folkGeo(P.cast, lod, P.kind, null, lod)), mesh = new InstancedMesh(g, mat, P.cap);
      P.attr = [mesh.instanceMatrix, new InstancedBufferAttribute(new Float32Array(P.cap * 3), 3), new InstancedBufferAttribute(new Float32Array(P.cap * 4), 4)];
      mesh.instanceColor = P.attr[1]; g.setAttribute('aLook', P.attr[2]);
      for (const [name, size] of extra) { const a = new InstancedBufferAttribute(new Float32Array(P.cap * size), size); g.setAttribute(name, a); P.attr.push(a); }
      for (const a of P.attr) a.setUsage(DynamicDrawUsage);
      mesh.count = 0; mesh.frustumCulled = false; mesh.boundingSphere = bounds; P.mesh = mesh;
      out.push(mesh);
    }
  });
  const bend = material.uniforms.uBend ? material.uniforms.uBend.value : null, clock = material.uniforms.uTime, far = FOLK_LOD[2] + SLACK;
  let cx = 0, cy = 0, cz = 0, t = 0;
  const consider = (i) => {
    where(i, t, _v);
    let x = _v.x, y = _v.y, z = _v.z;
    if (bend && bend.z > 0) { const a = bend.x + x / bend.z, r = bend.z - y; x = r * Math.cos(a); y = r * Math.sin(a); z += bend.y; }
    const d = Math.hypot(x - cx, y - cy, z - cz);
    if (d > far) return;
    for (let lod = 0; lod < 3; lod++) {
      if (d > FOLK_LOD[lod] + SLACK || (lod > 0 && d < FOLK_LOD[lod - 1] - SLACK)) continue;
      const P = levels[lod][poolOf[lod][i]], j = P.n++;
      for (let a = 0; a < na; a++) { const sz = sizes[a], from = src[a], to = P.attr[a].array; for (let e = 0; e < sz; e++) to[j * sz + e] = from[i * sz + e]; }
    }
  };
  holder.onBeforeRender = (renderer, scene, camera) => {
    holder.worldToLocal(_v.setFromMatrixPosition(camera.matrixWorld));
    cx = _v.x; cy = _v.y; cz = _v.z; t = clock.value;
    for (const L of levels) for (const P of L) P.n = 0;
    if (cells) { for (const c of cells) if (Math.hypot(c.c.x - cx, c.c.y - cy, c.c.z - cz) - c.r < far) for (const i of c.items) consider(i); }
    else for (let i = 0; i < n; i++) consider(i);
    for (const L of levels) for (const P of L) {
      P.mesh.count = P.n;
      if (P.n) for (let a = 0; a < na; a++) { const at = P.attr[a]; at.clearUpdateRanges(); at.addUpdateRange(0, P.n * sizes[a]); at.needsUpdate = true; }
    }
  };
  return out;
}

/**
 * Draw people who stand, sit and stroll, each at whichever level of detail their distance wants: the far level is
 * every person, in large cells; the nearer ones are pools (see pools()).
 * returns the meshes.
 */
function people(items, material, opts) {
  const frame = opts.frame, out = [], n = items.length;
  if (!n) return out;
  for (const [k, list] of groupBy(items, (it) => FAR[it.cast] + '|' + it.kind)) {
    const [cast, kind] = k.split('|');
    for (const m of instances(folkGeo(cast, 3, kind, null, 3), material, list, { frame, cell: opts.cell, walk: true })) out.push(m);
  }
  const at = items.map((it) => (frame ? frame.point(it.p[0], it.p[1], it.p[2]) : new Vector3(it.p[0], it.p[1], it.p[2])));
  const bounds = new Sphere().setFromPoints(at); bounds.radius += 14;
  // only people who can ever be near the camera need the nearer levels; they are looked through cell by cell
  const cells = [];
  const index = items.map((it, i) => i).filter((i) => items[i].reach === undefined || items[i].reach < FOLK_LOD[2] + items[i].walk[0] + 4);
  for (const [, inCell] of groupBy(index, (i) => Math.floor(items[i].p[0] / CELL) + '_' + Math.floor(items[i].p[1] / CELL) + '_' + Math.floor(items[i].p[2] / CELL))) {
    const sp = new Sphere().setFromPoints(inCell.map((i) => at[i]));
    let stroll = 0; for (const i of inCell) stroll = Math.max(stroll, items[i].walk[0]);
    cells.push({ c: sp.center, r: sp.radius + stroll + 1, items: inCell });
  }
  if (!cells.length) return out;
  const walk = new Float32Array(n * 4);
  items.forEach((it, i) => walk.set(it.walk, i * 4));
  // where a stroller is now: the same circle the shader walks them round
  const where = (i, t, v) => {
    const it = items[i], r = walk[i * 4];
    v.set(it.p[0], it.p[1], it.p[2]);
    if (r > 0.01) { const ph = walk[i * 4 + 2] + t * walk[i * 4 + 1] / Math.max(r, 0.5); v.x += Math.cos(ph) * r; v.z += Math.sin(ph) * r; }
  };
  for (const m of pools(items, material, [['aWalk', 4, walk]], where, cells, bounds)) out.push(m);
  return out;
}

/**
 * Make a crowd from a list of spots. spots: [{ p:[x,y,z], walk (metres of stroll, 0 = standing), yaw, sit, child, color,
 * skin, reach (metres from the nearest the camera ever comes: far people are then made at the far levels only) }].
 * Someone who sits at height 0 to 0.2 sits on the ground with their legs crossed; higher, on a seat, feet down.
 * material: a lit material made with walk: true (hollow.walk, or deck's). opts: frame, bob (default 0.1, more in low g), speed
 * returns the meshes.
 */
export function crowd(spots, material, opts = {}) {
  const seed = opts.seed || 'crowd', rng = makeRng(seed), lr = makeRng(seed + '~look');
  const items = [];
  for (const s of spots) {
    const pose = s.pose || (s.sit ? 'sit' : s.child ? 'child' : 'stand');
    const skin = s.skin || SKIN[Math.floor(rng() * SKIN.length)];
    const walk = pose === 'sit' ? 0 : (s.walk === undefined ? 0 : s.walk);
    const speed = (opts.speed || 1.0) * (0.7 + 0.5 * rng());
    const it = {
      p: s.p, yaw: walk > 0 ? 0 : (s.yaw === undefined ? rng() * 6.28 : s.yaw), scale: 0.92 + 0.16 * rng(),
      color: s.color || CLOTH[Math.floor(rng() * CLOTH.length)],
      walk: [walk, (rng() < 0.5 ? -1 : 1) * speed, rng() * 6.28, walk > 0 ? (opts.bob === undefined ? 0.1 : opts.bob) : 0],
      reach: s.reach,
    };
    dress(it, pose, skin, s.p[1] >= 0 && s.p[1] < 0.2, lr);
    items.push(it);
  }
  return people(items, material, { frame: opts.frame, cell: opts.cell || 400 });
}

/**
 * People who travel a line (as instances() with drift): items [{ p, yaw, drift: [vx, vy, vz, seconds], phase, color,
 * skin, child, pose: 'sit' for riders, scale }]. material: a lit material made with drift: true. opts: frame, cell, seed.
 * The far level holds everyone; the nearer ones are pools (see pools()).
 * returns the meshes.
 */
export function drifters(list, material, opts = {}) {
  const lr = makeRng((opts.seed || 'drifters') + '~look'), out = [], n = list.length;
  if (!n) return out;
  list.forEach((w, i) => {
    if (w.phase === undefined) w.phase = (i * 0.61803398875) % 1;
    if (!w.cast) dress(w, w.pose || (w.child ? 'child' : 'stand'), w.skin || SKIN[Math.floor(lr() * SKIN.length)], false, lr);
  });
  for (const [k, items] of groupBy(list, (it) => FAR[it.cast] + '|' + it.kind)) {
    const [cast, kind] = k.split('|');
    for (const m of instances(folkGeo(cast, 3, kind, null, 3), material, items, { frame: opts.frame, cell: opts.cell || 4000, drift: true })) out.push(m);
  }
  const drift = new Float32Array(n * 4), phase = new Float32Array(n);
  list.forEach((it, i) => { const d = it.drift || [0, 0, 0, 1]; drift.set([d[0], d[1], d[2], d[3] || 1], i * 4); phase[i] = it.phase; });
  const where = (i, t, v) => {
    const it = list[i], T = drift[i * 4 + 3], u = t / T + phase[i], k = (u - Math.floor(u)) * T;
    v.set(it.p[0] + drift[i * 4] * k, it.p[1] + drift[i * 4 + 1] * k, it.p[2] + drift[i * 4 + 2] * k);
  };
  const frame = opts.frame, ends = [];
  for (const it of list) { const d = it.drift || [0, 0, 0, 1]; for (const k of [0, d[3] || 1]) { const x = it.p[0] + d[0] * k, y = it.p[1] + d[1] * k, z = it.p[2] + d[2] * k; ends.push(frame ? frame.point(x, y, z) : new Vector3(x, y, z)); } }
  const bounds = new Sphere().setFromPoints(ends); bounds.radius += 4;
  for (const m of pools(list, material, [['aDrift', 4, drift], ['aPhase', 1, phase]], where, null, bounds)) out.push(m);
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
      spots.push({ p: [((x % C) + C) % C, 0, z], walk: r < 0.45 ? 0 : 1.5 + 9 * hash2(gx, gz, 19), sit: r < 0.22, child: r > 0.86, reach: d });
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
