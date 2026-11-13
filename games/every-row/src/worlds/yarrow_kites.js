// Yarrow, Herb Row: test day on the kite lawns.
// Yarrow is "a maker drum further along Herb Row, with a craft-school quarter" (games/three-nights/src/15-canon.js;
// docs/eating-out.md, "Yarrow and Borage"), and its Hollow has "workshop pavilions at the floor's edges, an orchard, and
// lawns where the schools test kites". There is no wind in a drum: kites are flown by walking (docs/sorrel.md, the Kite
// Field), so a lawn of kites is a lawn of people walking and running in long lines and loops, each towing a kite. When a
// flyer stops, the kite comes down, slowly, at half a g. The far bank is three kilometres overhead with its own kites,
// flown back at you (docs/ashgrove.md, "Day two"). Apprentices sign the underside of the first thing they make that
// someone buys (the custom in 15-canon.js). Things are dear in mass and mended where it shows (docs/open-drums.md,
// "Visible mending"; docs/daily-life.md: a new chair is 125 kWh).
//
// Every kite here follows from its flyer: each flyer walks, jogs or runs round a looped track (a stadium: two straights
// and two half circles), some stopping now and then; the kite trails behind and above on a taut line, as high as the
// flyer's speed over the last few seconds allows, and sinks when they stop. Flyers, kites, tails, trains, dragons and
// strings are all drawn by one small vertex shader that knows the same tracks (and a copy of it here in JS keeps them
// out of the camera's way).
//
// Not canon (the docs give Yarrow's Hollow one line): the plan (an orchard band behind a row of workshop pavilions at
// each edge, the school lawns between, worn walking tracks, chalked lanes, judges' stands); the pavilions and what is in
// them (a sawtooth roof, kite benches, cloth bolts, a tool board, chairs and flutes in the neighbours); test day itself;
// the kinds of kite (diamonds, boxes, six-sided, deltas, trains, dragons, great deltas towed by teams of six) and the
// school colours; the judges' flags; the Ring, a ring-wing kite kept up over one spot by a circle of runners.
import {
  Scene, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, Uint8BufferAttribute, BufferGeometry, Mesh,
  LineSegments, InstancedMesh, ShaderMaterial, DoubleSide, Vector3, Matrix4, Quaternion, Color,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, WOOD_CELL } from '../kit/hollow.js';
import { makeFrame, DRUM } from '../kit/drum.js';
import { makePath, nearPath } from '../core/path.js';
import { treeGeo } from '../kit/flora.js';
import { crowd, SKIN, CLOTH } from '../kit/folk.js';
import { Geo, instances, rgb } from '../kit/geo.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, litMaterial, hollowRig } from '../kit/mats.js';
import { makeRng, cellRand } from '../core/rng.js';

// ---------------------------------------------------------------- the place
const PAV_N = 180, PAV_SP = C / PAV_N;          // workshop pavilions right round each edge of the floor
const X0 = PAV_SP * 57;                          // the pavilion the flight starts in
const ZP = 772;                                  // its open front, facing the lawns
const ZB = L - ZP;                               // the back row's fronts, facing the other way
const LAWN0 = 792, LAWN1 = L - 792;              // the school lawns between the two rows
const WALK_N = 20, WALK_SP = C / WALK_N;         // long walks along the axis between the schools' lawns
const CROSS = [1520, 2230];                      // walks across
// the Ring: where the flight leaves, a ring-wing kite over a circle of runners
const RING = { x: X0 + 250, z: ZP + 340, y: 44, r: 13.5, band: 2.6, walkR: 31, speed: 3.6, n: 12 };

// Workshop white: a cool, clear ramp, good for seeing what you're making
const WHITE = '#f6fbff', PALE = '#c9d6dc', SLATE = '#55636b', INK = '#1f2326';
// school colours, two to a school
const SCHOOLS = [
  ['#e8402a', '#f6fbff'], ['#f5b800', '#1f2326'], ['#1f6fd1', '#f6fbff'], ['#18a37a', '#f5d84a'],
  ['#ff7a1a', '#16808a'], ['#d03a8c', '#f6efe0'], ['#5bc8e8', '#24306e'], ['#7b4fc9', '#f5b800'],
  ['#f6fbff', '#e8402a'], ['#1f2326', '#5bc8e8'], ['#c8e04a', '#2c5a3a'], ['#ffd84d', '#e8402a'],
];
const HERO = ['#e8402a', '#f5d84a'];             // the kite on the bench

// ---------------------------------------------------------------- how a flyer and a kite move (the shader has a copy)
// A rig: one flyer (or a team abreast) on a track, and the kite they tow.
//   track: centre (cx, cz), turn th, half-length of the straights a, radius of the ends r
//   v: speed along it, metres a second (negative: the other way round); s0: where on it at clock 0
//   stop: [period, seconds at full speed, seconds to slow or start, phase] (period 0: never stops)
//   len: line length; eMax: the line's angle above level at full speed
// distance covered by clock t, in seconds at full speed
function kDist(t, st) {
  if (!(st[0] > 0)) return t;
  const P = st[0], m = st[1], r = st[2], tt = t + st[3], n = Math.floor(tt / P);
  let u = tt - n * P, d = n * (m + r);
  if (u < m) return d + u;
  d += m; u -= m;
  if (u < r) { const w = u / r; return d + r * (w - w * w * w + 0.5 * w * w * w * w); }
  d += 0.5 * r; u -= r;
  const stopT = P - m - 2 * r;
  if (u < stopT) return d;
  const w = Math.min(Math.max((u - stopT) / r, 0), 1);
  return d + r * (w * w * w - 0.5 * w * w * w * w);
}
// a point of a track: [x, z, tx, tz]
function kTrack(rg, s) {
  const a = rg.a, r = rg.r, P = 4 * a + 2 * Math.PI * r;
  let u = ((s % P) + P) % P, lx, lz, tx, tz;
  if (u < 2 * a) { lx = -a + u; lz = -r; tx = 1; tz = 0; }
  else if ((u -= 2 * a) < Math.PI * r) { const g = -Math.PI / 2 + u / r; lx = a + r * Math.cos(g); lz = r * Math.sin(g); tx = -Math.sin(g); tz = Math.cos(g); }
  else if ((u -= Math.PI * r) < 2 * a) { lx = a - u; lz = r; tx = -1; tz = 0; }
  else { u -= 2 * a; const g = Math.PI / 2 + u / r; lx = -a + r * Math.cos(g); lz = r * Math.sin(g); tx = -Math.sin(g); tz = Math.cos(g); }
  const c = Math.cos(rg.th), sn = Math.sin(rg.th);
  return [rg.cx + c * lx - sn * lz, rg.cz + sn * lx + c * lz, c * tx - sn * tz, sn * tx + c * tz];
}
const LAG = 6;                                   // seconds of walking a kite's height remembers
const sstep = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };
// where the flyer and the kite are at clock t: { F:[x, z], W:[tx, tz], K:[x, y, z], q, lift, e, s, d }
function kRig(rg, t) {
  const v = Math.abs(rg.v), sg = rg.v < 0 ? -1 : 1;
  const D = kDist(t, rg.stop);
  const q = rg.stop[0] > 0 ? Math.min(Math.max((D - kDist(t - LAG, rg.stop)) / LAG, 0), 1) : 1;
  const s = rg.s0 + v * D, pf = kTrack(rg, s * sg);
  const lift = sstep(0.08, 0.85, q), e = rg.eMax * lift, d = rg.len * Math.cos(e);
  const pk = kTrack(rg, (s - d) * sg);
  const c = Math.hypot(pf[0] - pk[0], pf[1] - pk[1]);
  const y = Math.max(1.1 * lift + Math.sqrt(Math.max(rg.len * rg.len - c * c, 0)), 0.25);
  return { F: [pf[0], pf[1]], W: [pf[2] * sg, pf[3] * sg], K: [pk[0], y, pk[1]], Wk: [pk[2] * sg, pk[3] * sg], q, lift, e, s, d, sg };
}
// how long a track is
const trackLen = (rg) => 4 * rg.a + 2 * Math.PI * rg.r;

// ---------------------------------------------------------------- who flies what, and where
// kinds: 'diamond', 'rokko' (six-sided), 'box', 'delta', 'train' (many small kites on one line), 'dragon' (a head
// and a long body), 'team' (a great delta towed by six walking abreast)
const KIND_W = [['diamond', 26], ['rokko', 13], ['box', 12], ['delta', 14], ['train', 8], ['dragon', 8], ['team', 3.5]];
function pickKind(rng, w = KIND_W) { let t = rng() * w.reduce((a, b) => a + b[1], 0); for (const [k, x] of w) { t -= x; if (t <= 0) return k; } return w[0][0]; }
const inLane = (x, z) => x > X0 - 7 && x < X0 + 9 && z < ZP + 270;           // the child's run out of the door
const inRing = (x, z) => Math.hypot(x - RING.x, z - RING.z) < RING.walkR + 12;
const onWalk = (x, z) => { const u = (((x - WALK_SP / 2) % WALK_SP) + WALK_SP) % WALK_SP; return u < 9 || u > WALK_SP - 9 || CROSS.some((c) => Math.abs(z - c) < 9); };

// a rig of a kind, on a track centred at (cx, cz)
function makeRig(rng, kind, cx, cz, far) {
  const pace = kind === 'team' ? 'walk' : rng.pick(['walk', 'walk', 'jog', 'jog', 'run']);
  const v = pace === 'walk' ? rng.f(1.2, 1.7) : pace === 'jog' ? rng.f(2.4, 3.2) : rng.f(3.8, 5.0);
  const shape = rng();
  let a, r, th;
  if (kind === 'team') { a = rng.f(90, 180); r = rng.f(14, 22); th = rng.chance(0.7) ? Math.PI / 2 + rng.f(-0.2, 0.2) : rng.f(-0.2, 0.2); }
  else if (kind === 'dragon') { a = rng.f(60, 150); r = rng.f(5, 9); th = rng.chance(0.6) ? Math.PI / 2 + rng.f(-0.15, 0.15) : rng.f(-0.25, 0.25); }
  else if (shape < 0.45) { a = rng.f(35, 120); r = rng.f(3, 7); th = rng.chance(0.6) ? Math.PI / 2 + rng.f(-0.15, 0.15) : rng.f(-0.25, 0.25); }   // a lane, there and back
  else if (shape < 0.85) { a = rng.f(0, 35); r = rng.f(10, 30); th = rng.f(0, Math.PI); }                                                       // a loop
  else { a = 0; r = rng.f(6, 16); th = 0; }                                                                                                      // round and round
  const sc = SCHOOLS[Math.floor(rng() * SCHOOLS.length)];
  const flip = rng.chance(0.3);
  const rg = {
    kind, far, cx, cz, a, r, th, v: v * (rng.chance(0.5) ? 1 : -1), s0: rng.f(0, 2000),
    stop: rng.chance(kind === 'team' ? 0 : 0.3) ? [rng.f(34, 60), 0, rng.f(1.6, 2.6), rng.f(0, 60)] : [0, 0, 0, 0],
    len: 0, eMax: 0, scale: 1, seed: rng(), c1: flip ? sc[1] : sc[0], c2: flip ? sc[0] : sc[1],
    child: kind !== 'team' && rng.chance(0.4), n: 0, seg: 0, pace,
  };
  if (rg.stop[0]) rg.stop[1] = rg.stop[0] * rng.f(0.55, 0.75);
  const eK = pace === 'walk' ? rng.f(0.55, 0.75) : pace === 'jog' ? rng.f(0.75, 0.95) : rng.f(0.9, 1.1);
  rg.eMax = eK;
  if (kind === 'diamond') { rg.len = rng.f(14, 40); rg.scale = rng.f(1.1, 1.8); }
  else if (kind === 'rokko') { rg.len = rng.f(18, 45); rg.scale = rng.f(1.4, 2.3); }
  else if (kind === 'box') { rg.len = rng.f(18, 45); rg.scale = rng.f(1.3, 2.1); rg.child = false; }
  else if (kind === 'delta') { rg.len = rng.f(20, 50); rg.scale = rng.f(1.2, 2.0); }
  else if (kind === 'train') { rg.len = rng.f(40, 70); rg.scale = rng.f(0.55, 0.72); rg.n = rng.i(14, 24); rg.seg = rng.f(1.3, 1.7); rg.child = false; }
  else if (kind === 'dragon') { rg.len = rng.f(30, 60); rg.scale = rng.f(1.3, 1.8); rg.n = 40; rg.seg = rng.f(0.38, 0.5); rg.child = false; }
  else if (kind === 'team') { rg.len = rng.f(65, 110); rg.scale = rng.f(9, 14); rg.eMax = rng.f(0.6, 0.75); }
  if (rg.child) { rg.len *= 0.7; rg.scale *= 0.85; }
  return rg;
}
// the ground the track covers, as points every few metres
function trackPoints(rg, step = 5) { const out = [], P = trackLen(rg); for (let s = 0; s < P; s += step) { const p = kTrack(rg, s); out.push([p[0], p[1]]); } return out; }

// distance from p to the segment a-b (3D)
function segDist(p, a, b) {
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2], l2 = abx * abx + aby * aby + abz * abz;
  let t = l2 > 0 ? ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby + (p[2] - a[2]) * abz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(a[0] + abx * t - p[0], a[1] + aby * t - p[1], a[2] + abz * t - p[2]);
}
// does a rig keep clear of the camera all through the flight? cam: flat points every 0.5 s
function clearOf(rg, cam) {
  const big = rg.kind === 'team' ? rg.scale * 1.25 : rg.kind === 'dragon' ? 2 : rg.scale;
  const reach = rg.a + rg.r + rg.len + big + 12 + (rg.kind === 'dragon' ? 40 * rg.seg * rg.scale : 0);
  for (let i = 0; i < cam.length; i++) {
    const c = cam[i], t = i * 0.5;
    // nothing of this rig can come near a camera this far off
    if ((c.x - rg.cx) ** 2 + (c.z - rg.cz) ** 2 > reach * reach) continue;
    const k = kRig(rg, t);
    const p = [c.x, c.y, c.z], K = k.K, H = [k.F[0], 1.3, k.F[1]];
    if (Math.hypot(K[0] - c.x, K[1] - c.y, K[2] - c.z) < big + 5) return false;
    if (c.y < 5 && Math.hypot(k.F[0] - c.x, k.F[1] - c.z) < 4) return false;
    if (segDist(p, H, K) < (rg.kind === 'train' ? 3.5 : rg.kind === 'team' ? 4 : 1.6)) return false;
    if (rg.kind === 'dragon') for (let j = 8; j <= rg.n; j += 8) {
      const q = kTrack(rg, (k.s - k.d - j * rg.seg * rg.scale) * k.sg);
      if (Math.hypot(q[0] - c.x, K[1] - j * 0.2 - c.y, q[1] - c.z) < 5) return false;
    }
  }
  return true;
}

function* makeRigs(path, density) {
  const rng = makeRng('yarrow-rigs');
  const cam = [];
  for (let t = 0; t <= path.duration + 0.01; t += 0.5) cam.push(path.flat(t));
  const near = [], far = [];
  // a coarse map of how many tracks cover each 8 m of lawn near the flight: people weave, but not through each other
  const occ = new Map(), key = (x, z) => Math.floor(x / 8) + ',' + Math.floor(z / 8);
  const crowded = (pts, lim) => pts.some(([x, z]) => (occ.get(key(x, z)) || 0) >= lim);
  const mark = (pts) => { for (const [x, z] of pts) { const k = key(x, z); occ.set(k, (occ.get(k) || 0) + 1); } };
  const okGround = (pts) => pts.every(([x, z]) => z > LAWN0 + 6 && z < LAWN1 - 6 && !inLane(x, z) && !inRing(x, z));
  let t0 = performance.now(), work = 0;
  // near the flight: a crowded test day, each rig kept out of the camera's way
  const NX0 = X0 - 430, NX1 = X0 + 600, NZ1 = ZP + 820;
  const want = Math.round(900 * Math.min(density, 1.2));
  let tries = 0;
  for (; near.length < want && tries < want * 8; tries++) {
    const kind = pickKind(rng);
    // most of them about the flight, thinning out to the edge of the near field
    const c = cam[Math.floor(rng.f(14, cam.length - 4))], ra = 270 * Math.sqrt(rng()), an = rng.f(0, 6.283);
    const cx = c.x + Math.cos(an) * ra, cz = c.z + Math.sin(an) * ra;
    if (cx < NX0 || cx > NX1 || cz > NZ1) continue;
    const rg = makeRig(rng, kind, cx, cz, false);
    if (kind !== 'train' && kind !== 'team' && kind !== 'dragon') { rg.scale *= 1.9; rg.len *= 1.15; }
    const pts = trackPoints(rg);
    if (!okGround(pts) || crowded(pts, kind === 'team' ? 1 : 3)) continue;
    if (!clearOf(rg, cam)) continue;
    mark(pts); near.push(rg);
    if (performance.now() - t0 > 4) { work += performance.now() - t0; yield 'kites: who flies'; t0 = performance.now(); }
  }
  // everywhere else round the floor: the kites of the other schools, which the far bank flies back at you
  const nFar = Math.round(5500 * density);
  for (let tries = 0; far.length < nFar && tries < nFar * 3; tries++) {
    const cx = rng.f(0, C), cz = rng.f(LAWN0 + 30, LAWN1 - 30);
    let dx = ((cx - X0 - 60) % C + C * 1.5) % C - C / 2;
    if (Math.abs(dx) < 520 && cz < NZ1 + 40) continue;
    if (onWalk(cx, cz)) continue;
    const kind = pickKind(rng, [['diamond', 20], ['rokko', 12], ['box', 8], ['delta', 16], ['dragon', 3], ['team', 4], ['train', 3]]);
    const rg = makeRig(rng, kind, cx, cz, true);
    if (rg.kind === 'team') rg.scale *= 1.15;
    far.push(rg);
    if (performance.now() - t0 > 4) { work += performance.now() - t0; yield 'kites: far'; t0 = performance.now(); }
  }
  // the lawns overhead, where the flight looks up: a busier stretch of the far bank, flying back at you
  const nOver = Math.round(2600 * density);
  for (let i = 0, tries = 0; i < nOver && tries < nOver * 3; tries++) {
    const cx = X0 + 200 + C / 2 + rng.f(-1700, 1700), cz = rng.f(LAWN0 + 30, ZP + 1800);
    if (onWalk(cx, cz)) continue;
    const kind = pickKind(rng, [['diamond', 14], ['rokko', 10], ['box', 6], ['delta', 14], ['dragon', 4], ['team', 7], ['train', 3]]);
    const rg = makeRig(rng, kind, ((cx % C) + C) % C, cz, true);
    rg.scale *= kind === 'team' ? 1.2 : 1.5;
    far.push(rg); i++;
    if (performance.now() - t0 > 4) { work += performance.now() - t0; yield 'kites: far'; t0 = performance.now(); }
  }
  return { near, far };
}

// ---------------------------------------------------------------- the plan
// Shapes of one kind are gathered into one path and painted once.
const gather = () => { const m = new Map(); m.put = (k, shape) => { let p = m.get(k); if (!p) m.set(k, p = new Path2D()); p.addPath(shape); return m; }; return m; };
function softPatches(plan, colors, count, size, alpha, seed, z0 = 0, z1 = L) {
  const rng = makeRng(seed), list = [];
  for (let i = 0; i < count; i++) { const s = size * rng.f(0.5, 1.5); list.push([rng.f(0, C), rng.f(z0, z1), s, rng.f(0.4, 1.1), rng.f(0, 3.14), alpha * rng.f(0.4, 1), rng.pick(colors)]); }
  for (let i0 = 0; i0 < list.length; i0 += 30) plan.layer('alb', (cx) => {
    for (const [x, z, s, k, rot, a, c] of list.slice(i0, i0 + 30)) {
      cx.save(); cx.translate(x, z); cx.rotate(rot); cx.scale(1, k);
      const g = cx.createRadialGradient(0, 0, 0, 0, 0, s);
      g.addColorStop(0, c); g.addColorStop(1, c + '00');
      cx.globalAlpha = a; cx.fillStyle = g; cx.fillRect(-s, -s, 2 * s, 2 * s);
      cx.restore();
    }
  });
}
function stadiumPath(plan, rg) { return plan.poly(trackPoints(rg, Math.max(3, Math.min(10, trackLen(rg) / 24)))); }

function* paintYarrow(plan, rigs) {
  const rng = makeRng('yarrow-plan');
  plan.fill(plan.band(0, L), { color: '#97b085' });
  softPatches(plan, ['#a3b98f', '#8aa57c', '#a9bc92', '#90aa86', '#b0c09a', '#86a07c'], 150, 270, 0.5, 'yarrow-lawn');
  // the Dim Ends: woods under the walls
  plan.fill(plan.band(0, 480), { color: '#5b7366', wood: 0.95 });
  plan.fill(plan.band(L - 480, L), { color: '#57705f', wood: 0.95 });
  yield;
  // the orchard, a band behind each row of workshops, sections in blossom where their winter has just ended
  for (const [z0, z1] of [[500, 690], [L - 690, L - 500]]) {
    plan.fill(plan.rect(-C, z0, 2 * C, z1), { color: '#98ab88', rows: 1 });
    const lanes = new Path2D();
    for (let i = 0; i < 90; i++) { const x = (i / 90) * C; lanes.addPath(plan.line([[x, z0], [x, z1]])); }
    plan.stroke(lanes, 5, { color: '#c4c9b8', clear: ['rows'], paved: 0.4, life: 0.3 });
  }
  // the workshop rows: yards, sawtooth roofs, and a walk with lamps before them
  const roofs = new Path2D(), teeth = new Path2D(), yards = new Path2D(), doors = new Path2D();
  for (const [zf, dir] of [[ZP, -1], [ZB, 1]]) {
    yards.addPath(plan.rect(-C, Math.min(zf, zf + dir * 50), 2 * C, Math.max(zf, zf + dir * 50)));
    for (let i = 0; i < PAV_N; i++) {
      const cx = i * PAV_SP, x0 = cx - 13;
      const zb = zf + dir * 15;
      roofs.addPath(plan.rect(x0, Math.min(zf, zb), x0 + 26, Math.max(zf, zb)));
      for (let k = 1; k < 4; k++) teeth.addPath(plan.line([[x0, zf + dir * k * 3.75], [x0 + 26, zf + dir * k * 3.75]]));
      doors.addPath(plan.rect(cx - 6.5, zf - 3, cx + 6.5, zf + 3));
    }
  }
  plan.fill(yards, { color: '#cdd6d8', paved: 1, life: 0.5 });
  plan.fill(roofs, { color: '#eef4f7', clear: ['life'] });
  plan.stroke(teeth, 1.2, { color: '#93a3ad' });
  plan.fill(doors, { color: '#d9e0e2', life: 0.9 });
  const walkF = [], walkB = [];
  for (let i = 0; i <= 120; i++) { walkF.push([(i / 120) * C, ZP + 12]); walkB.push([(i / 120) * C, ZB - 12]); }
  for (const w of [walkF, walkB]) { plan.stroke(w, 8, { color: '#d6dcd8', paved: 0.8, life: 0.9 }); plan.lamps(w, 28); }
  yield;
  // the schools' lawns between: each its own shade, divided by walks with poplars and lamps
  const lawns = gather();
  const tones = ['#9ab488', '#a5bb8f', '#92ad84', '#abbf94', '#98b28c', '#a2b98a'];
  for (let i = 0; i < WALK_N; i++) {
    const x0 = i * WALK_SP + WALK_SP / 2 + 10, x1 = x0 + WALK_SP - 20;
    const zs = [LAWN0 + 20, CROSS[0] - 10, CROSS[0] + 10, CROSS[1] - 10, CROSS[1] + 10, LAWN1 - 20];
    for (let k = 0; k < 3; k++) lawns.put(tones[(i * 3 + k * 5) % tones.length], plan.rect(x0, zs[k * 2], x1, zs[k * 2 + 1], 14));
  }
  for (const [c, p] of lawns) plan.fill(p, { color: c });
  const walks = new Path2D(), longW = [];
  for (let i = 0; i < WALK_N; i++) { const x = i * WALK_SP + WALK_SP / 2, w = [[x, ZP + 12], [x, ZB - 12]]; walks.addPath(plan.line(w)); longW.push(w); }
  for (const z of CROSS) walks.addPath(plan.line([[-C, z], [2 * C, z]]));
  plan.stroke(walks, 9, { color: '#d4dad4', paved: 0.8, life: 0.9 });
  // poplars down both sides: as dots near the flight (where real trees stand on them), as a dashed line farther off
  const dashes = new Path2D();
  for (const w of longW) {
    plan.lamps(w, 30);
    if (Math.abs((((w[0][0] - X0) % C) + C * 1.5) % C - C / 2) < 700) plan.avenue(w, 9, 12, { color: '#6d8a68', radius: 3.4 });
    else for (const dx of [-9, 9]) dashes.addPath(plan.line([[w[0][0] + dx, w[0][1]], [w[1][0] + dx, w[1][1]]]));
  }
  plan.stroke(dashes, 6, { color: '#6d8a68', wood: 1, dash: [5, 7], cap: 'butt' });
  for (const z of CROSS) { const w = []; for (let i = 0; i <= 120; i++) w.push([(i / 120) * C, z]); plan.lamps(w, 30); }
  yield;
  // worn tracks where the flyers walk and run, round and round, every test day
  const worn = new Path2D();
  for (const rg of rigs.near) worn.addPath(stadiumPath(plan, rg));
  // (drawn once each, not with the seam's copies: a track that crosses the seam loses a little of itself)
  const strokeOnce = (p, width, color, alpha, life) => {
    plan.once('alb', (cx) => { cx.globalAlpha = alpha; cx.strokeStyle = color; cx.lineWidth = width; cx.lineJoin = 'round'; cx.stroke(p); });
    if (life) plan.once('kind', (cx) => { cx.globalCompositeOperation = 'lighter'; cx.strokeStyle = `rgb(0,0,${Math.round(life * 255)})`; cx.lineWidth = width; cx.stroke(p); });
  };
  let t0 = performance.now(), wornFar = new Path2D(), nw = 0;
  for (const rg of rigs.far) {
    // only within reach of the flight: from farther off a worn track is lost in the lawn
    const dx = Math.abs((((rg.cx - X0) % C) + C * 1.5) % C - C / 2);
    if (dx > 1300 || rg.cz > ZP + 1700) continue;
    wornFar.addPath(stadiumPath(plan, rg));
    // in batches, so the canvas work comes in pieces
    if (++nw % 120 === 0) { strokeOnce(wornFar, 3.2, '#c3c7b0', 0.35, 0.45); wornFar = new Path2D(); }
    if (performance.now() - t0 > 4) { yield 'plan: tracks'; t0 = performance.now(); }
  }
  strokeOnce(wornFar, 3.2, '#c3c7b0', 0.35, 0.45);
  strokeOnce(worn, 2.4, '#c6c9b3', 0.55, 0);
  // chalked lanes on some lawns, start lines, and the judges' stands at the lane ends
  const chalk = new Path2D(), stands = [];
  for (let i = 0; i < WALK_N; i++) {
    const x0 = i * WALK_SP + WALK_SP / 2 + 40;
    for (const [z0, z1] of [[LAWN0 + 40, CROSS[0] - 40], [CROSS[1] + 40, LAWN1 - 40]]) {
      if (rng() < 0.4) continue;
      const lx = x0 + rng.f(0, WALK_SP - 140), n = rng.i(4, 8);
      for (let k = 0; k <= n; k++) chalk.addPath(plan.line([[lx + k * 9, z0 + 30], [lx + k * 9, z1 - 30]]));
      chalk.addPath(plan.line([[lx, z0 + 30], [lx + n * 9, z0 + 30]])); chalk.addPath(plan.line([[lx, z1 - 30], [lx + n * 9, z1 - 30]]));
      stands.push([lx + n * 4.5, z0 + 18], [lx + n * 4.5, z1 - 18]);
    }
  }
  plan.stroke(chalk, 0.8, { color: '#f4f7f2' });
  plan.dots(stands, 5, { color: '#eef3f5', paved: 1, life: 1 });
  // spectators along the cross walks
  for (const z of CROSS) plan.fill(plan.band(z - 16, z + 16), { life: 0.5 });
}

// ---------------------------------------------------------------- kites, modelled in their own frame
// x across the span, y up the spine, z out of the face toward the flyer. Tint weight 1 takes the school's first colour,
// 0.5 its second, 0 keeps its own. A kite about 1 m tall at scale 1.
const SPAR = '#3b3631';
function spar(g, a, b, w = 0.012) { g.tint(0).tube([a, b], w, 3, SPAR, { smooth: false }); }
function diamondGeo(detail) {
  const g = new Geo(), N = [0, 0.42, 0], Lf = [-0.36, 0.06, -0.05], R = [0.36, 0.06, -0.05], T = [0, -0.58, 0], M = [0, 0.06, 0.03];
  g.tint(1).tri(N, Lf, M, '#ffffff').tri(N, M, R, '#ffffff');
  g.tint(0.5).tri(Lf, T, M, '#ffffff').tri(M, T, R, '#ffffff');
  if (detail) { spar(g, [0, -0.58, 0.02], [0, 0.42, 0.02]); spar(g, [-0.36, 0.06, -0.03], [0.36, 0.06, -0.03]); }
  return g.build();
}
function rokkoGeo(detail) {
  const g = new Geo(), P = [[-0.3, 0.5], [-0.44, 0.22], [-0.3, -0.5], [0.3, -0.5], [0.44, 0.22], [0.3, 0.5]];
  g.tint(1);
  for (let i = 0; i < 6; i++) { const a = P[i], b = P[(i + 1) % 6]; g.tri([0, 0, 0.02], [a[0], a[1], a[0] * a[0] * -0.2], [b[0], b[1], b[0] * b[0] * -0.2], '#ffffff'); }
  if (detail) {
    // a disc of the second colour on both faces: the school's mark
    g.tint(0.5);
    for (let i = 0; i < 10; i++) { const a0 = (i / 10) * 6.283, a1 = ((i + 1) / 10) * 6.283; for (const z of [0.024, -0.004]) { const p0 = [0, 0.02, z], p1 = [Math.cos(a0) * 0.2, 0.02 + Math.sin(a0) * 0.2, z], p2 = [Math.cos(a1) * 0.2, 0.02 + Math.sin(a1) * 0.2, z]; if (z > 0) g.tri(p0, p1, p2, '#ffffff'); else g.tri(p0, p2, p1, '#ffffff'); } }
    spar(g, [0, -0.5, 0.03], [0, 0.5, 0.03]); spar(g, [-0.44, 0.22, 0.0], [0.44, 0.22, 0.0]); spar(g, [-0.3, -0.5, 0.0], [0.3, -0.5, 0.0]);
  } else { g.tint(0.5).tri([-0.15, -0.15, 0.03], [0.15, -0.15, 0.03], [0, 0.2, 0.03], '#ffffff'); }
  return g.build();
}
function boxGeo(detail) {
  const g = new Geo(), w = 0.19;
  for (const [y0, y1, t] of [[0.14, 0.5, 1], [-0.5, -0.14, 0.5]]) {
    g.tint(t);
    const c = [[-w, -w], [w, -w], [w, w], [-w, w]];
    for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; g.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], '#ffffff'); }
  }
  if (detail) for (const [x, z] of [[-w, -w], [w, -w], [w, w], [-w, w]]) spar(g, [x, -0.52, z], [x, 0.52, z], 0.01);
  return g.build();
}
function deltaGeo(detail, big) {
  const g = new Geo(), Nn = [0, 0.55, 0], Lt = [-1.0, -0.35, -0.06], Rt = [1.0, -0.35, -0.06], Tr = [0, -0.18, 0];
  if (big) {
    // the great deltas: bands of both colours across the wing
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    for (const tip of [Lt, Rt]) {
      const side = tip === Lt;
      for (let k = 0; k < 5; k++) {
        const a0 = lerp(Nn, tip, k / 5), a1 = lerp(Nn, tip, (k + 1) / 5), b0 = lerp(Nn, Tr, k / 5), b1 = lerp(Nn, Tr, (k + 1) / 5);
        g.tint(k % 2 ? 0.5 : 1);
        if (side) { g.quad(a0, a1, b1, b0, '#ffffff'); } else { g.quad(a0, b0, b1, a1, '#ffffff'); }
      }
    }
  } else {
    g.tint(1).tri(Nn, Lt, Tr, '#ffffff'); g.tint(detail ? 0.5 : 1).tri(Nn, Tr, Rt, '#ffffff');
  }
  if (detail) {
    g.tint(0).tri([0, 0.3, 0.0], [0, -0.1, 0.0], [0, 0.05, 0.24], '#eef2f4');
    spar(g, [0, 0.55, 0.01], [-1.0, -0.35, -0.05], big ? 0.008 : 0.012); spar(g, [0, 0.55, 0.01], [1.0, -0.35, -0.05], big ? 0.008 : 0.012);
    spar(g, [0, 0.55, 0.01], [0, -0.18, 0.01], big ? 0.008 : 0.012); spar(g, [-0.5, -0.08, -0.02], [0.5, -0.08, -0.02], big ? 0.006 : 0.01);
  }
  return g.build();
}
// a dragon's head: a round face with a rim, eyes and whiskers
function headGeo() {
  const g = new Geo(), n = 12;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 6.283, a1 = ((i + 1) / n) * 6.283;
    g.tint(1).tri([0, 0, 0.04], [Math.cos(a0) * 0.5, Math.sin(a0) * 0.5, 0], [Math.cos(a1) * 0.5, Math.sin(a1) * 0.5, 0], '#ffffff');
    g.tint(0.5).quad([Math.cos(a0) * 0.5, Math.sin(a0) * 0.5, 0], [Math.cos(a0) * 0.66, Math.sin(a0) * 0.66, -0.05], [Math.cos(a1) * 0.66, Math.sin(a1) * 0.66, -0.05], [Math.cos(a1) * 0.5, Math.sin(a1) * 0.5, 0], '#ffffff');
  }
  g.tint(0);
  for (const s of [-1, 1]) {
    g.blob(s * 0.2, 0.14, 0.06, [0.12, 0.12, 0.04], 0, '#fbfbf6');
    g.blob(s * 0.2, 0.14, 0.1, [0.055, 0.055, 0.02], 0, INK);
    g.tube([[s * 0.15, -0.12, 0.05], [s * 0.6, -0.3, 0.0], [s * 0.85, -0.6, -0.1]], 0.012, 3, '#f5d84a');
  }
  g.box(-0.18, -0.24, 0.04, 0.18, -0.18, 0.07, '#b8262a');
  return g.build();
}
// many segments, each at local z = -j: a tail ribbon (width w) or a dragon's body (a tapering tube with fins)
function tailGeo(n, w) {
  const g = new Geo();
  for (let j = 0; j < n; j++) {
    g.tint(j % 4 < 2 ? 0.5 : 1);
    g.quad([-w / 2, 0, -j], [w / 2, 0, -j], [w / 2, 0, -(j + 1)], [-w / 2, 0, -(j + 1)], '#ffffff');
  }
  return g.build();
}
function bodyGeo(n, sides = 6, fat = 1) {
  const g = new Geo();
  const rad = (j) => 0.34 * fat * (1 - 0.55 * j / n);
  for (let j = 0; j < n; j++) {
    const r0 = rad(j), r1 = rad(j + 1);
    g.tint(j % 3 === 2 ? 0.5 : 1);
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * 6.283, a1 = ((i + 1) / sides) * 6.283;
      g.quad([Math.cos(a0) * r0, Math.sin(a0) * r0, -j], [Math.cos(a1) * r0, Math.sin(a1) * r0, -j], [Math.cos(a1) * r1, Math.sin(a1) * r1, -(j + 1)], [Math.cos(a0) * r1, Math.sin(a0) * r1, -(j + 1)], '#ffffff');
    }
    if (j % 2 === 0) { g.tint(0.5); for (const s of [-1, 1]) g.tri([s * r0, 0, -j], [s * (r0 + 0.42), -0.05, -j - 0.4], [s * r0, 0, -j - 0.9], '#ffffff'); }
  }
  // the tail's streamers
  g.tint(0.5);
  for (const s of [-1, 1]) g.quad([0, 0, -n], [s * 0.05, 0, -n], [s * 0.4, -0.1, -n - 3.5], [s * 0.3, -0.1, -n - 3.5], '#ffffff');
  return g.build();
}
// a train: up to n small kites, each at local z = -10 k, colours turn and turn about
function trainGeo(n) {
  const g = new Geo();
  for (let k = 0; k < n; k++) {
    const z = -10 * k, N = [0, 0.42, z], Lf = [-0.36, 0.06, z - 0.04], R = [0.36, 0.06, z - 0.04], T = [0, -0.58, z], M = [0, 0.06, z + 0.03];
    g.tint(k % 2 ? 0.5 : 1).tri(N, Lf, M, '#ffffff').tri(N, M, R, '#ffffff').tri(Lf, T, M, '#ffffff').tri(M, T, R, '#ffffff');
    g.tint(k % 2 ? 1 : 0.5).quad([-0.05, -0.58, z], [0.05, -0.58, z], [0.03, -1.2, z - 0.2], [-0.03, -1.2, z - 0.2], '#ffffff');
  }
  return g.build();
}
// a flyer, facing +z: parts 1 clothes, 2 and 3 legs, 4 the arm holding the line (along +y from the shoulder), 5 skin
function flyerGeo() {
  const g = new Geo(), parts = [];
  const part = (id, fn) => { const a = g.tris; fn(); for (let i = a; i < g.tris; i++) parts.push(id, id, id); };
  part(2, () => g.box(-0.15, 0, -0.08, -0.02, 0.88, 0.08, '#ffffff'));
  part(3, () => g.box(0.02, 0, -0.08, 0.15, 0.88, 0.08, '#ffffff'));
  part(1, () => { g.cyl(0, 0.82, 0, 0.21, 0.18, 0.62, 6, '#ffffff', { smooth: false }); g.box(-0.29, 0.86, -0.05, -0.2, 1.4, 0.05, '#ffffff'); });
  part(4, () => g.box(-0.05, 0, -0.05, 0.05, 0.64, 0.05, '#ffffff'));
  part(5, () => g.blob(0, 1.6, 0, 0.135, 0, '#ffffff', { shadeBottom: 0.8 }));
  const geo = g.build();
  geo.setAttribute('aPart', new Float32BufferAttribute(parts, 1));
  return geo;
}

// ---------------------------------------------------------------- the shader that flies them
// The same sums as kDist, kTrack and kRig above, per vertex. aA: track centre x, z, turn, half-length of the straights;
// aB: end radius, speed (signed), start, line length; aS: stopping; aK: line angle at full speed, scale, seed, how far
// to the left of the track this flyer walks (a team abreast).
const MOTION = /* glsl */`
uniform float uClock;
attribute vec4 aA; attribute vec4 aB; attribute vec4 aS; attribute vec4 aK;
float kDist(float t) {
  if (aS.x <= 0.0) return t;
  float P = aS.x, m = aS.y, r = aS.z, tt = t + aS.w, n = floor(tt / P);
  float u = tt - n * P, d = n * (m + r);
  if (u < m) return d + u;
  d += m; u -= m;
  if (u < r) { float w = u / r; return d + r * (w - w * w * w + 0.5 * w * w * w * w); }
  d += 0.5 * r; u -= r;
  float stopT = P - m - 2.0 * r;
  if (u < stopT) return d;
  float w = clamp((u - stopT) / r, 0.0, 1.0);
  return d + r * (w * w * w - 0.5 * w * w * w * w);
}
vec2 kTrack(float s, out vec2 tn) {
  float a = aA.w, r = aB.x, P = 4.0 * a + 6.2831853 * r;
  float u = mod(s, P);
  vec2 l;
  if (u < 2.0 * a) { l = vec2(-a + u, -r); tn = vec2(1.0, 0.0); }
  else {
    u -= 2.0 * a;
    if (u < 3.14159265 * r) { float g = -1.5707963 + u / r; l = vec2(a + r * cos(g), r * sin(g)); tn = vec2(-sin(g), cos(g)); }
    else {
      u -= 3.14159265 * r;
      if (u < 2.0 * a) { l = vec2(a - u, r); tn = vec2(-1.0, 0.0); }
      else { u -= 2.0 * a; float g = 1.5707963 + u / r; l = vec2(-a + r * cos(g), r * sin(g)); tn = vec2(-sin(g), cos(g)); }
    }
  }
  float c = cos(aA.z), sn = sin(aA.z);
  tn = vec2(c * tn.x - sn * tn.y, sn * tn.x + c * tn.y);
  return aA.xy + vec2(c * l.x - sn * l.y, sn * l.x + c * l.y);
}
// the flyer F heading W, the kite K heading Wk, how far it is up (lift 0..1), the line's angle e, where on the track
void kRig(float t, out vec3 F, out vec3 W, out vec3 K, out vec3 Wk, out float lift, out float e, out float s, out float d, out float sg) {
  float v = abs(aB.y); sg = aB.y < 0.0 ? -1.0 : 1.0;
  float D = kDist(t);
  float q = aS.x > 0.0 ? clamp((D - kDist(t - ${LAG.toFixed(1)})) / ${LAG.toFixed(1)}, 0.0, 1.0) : 1.0;
  s = aB.z + v * D;
  vec2 tw; vec2 pf = kTrack(s * sg, tw);
  F = vec3(pf.x, 0.0, pf.y); W = vec3(tw.x, 0.0, tw.y) * sg;
  lift = smoothstep(0.08, 0.85, q); e = aK.x * lift; d = aB.w * cos(e);
  vec2 tk; vec2 pk = kTrack((s - d) * sg, tk);
  Wk = vec3(tk.x, 0.0, tk.y) * sg;
  float c = length(pf - pk);
  K = vec3(pk.x, max(1.1 * lift + sqrt(max(aB.w * aB.w - c * c, 0.0)), 0.25), pk.y);
  K.y += 0.3 * lift * sin(t * 0.83 + aK.z * 31.0);
}
// the kite's axes: R across, U up the spine, N out of its face toward the flyer; it leans into the line and rocks
void kAxes(vec3 Wk, float lift, float e, float t, out vec3 R, out vec3 U, out vec3 N) {
  float l2 = smoothstep(0.15, 0.7, lift);
  float b = mix(-1.5, e - 0.32, l2);
  N = Wk * cos(b) - vec3(0.0, sin(b), 0.0);
  U = vec3(0.0, cos(b), 0.0) + Wk * sin(b);
  R = cross(U, N);
  float roll = l2 * (0.17 * sin(t * (0.9 + aK.z) + aK.z * 40.0) + 0.07 * sin(t * 2.3 + aK.z * 13.0));
  float cr = cos(roll), sr = sin(roll);
  vec3 R2 = R * cr + U * sr; U = U * cr - R * sr; R = R2;
}
// the hand that holds the line: the right shoulder, and an arm's length toward the kite (figure scale k)
vec3 kHand(vec3 F, vec3 W, vec3 K, float k) {
  vec3 X = vec3(W.z, 0.0, -W.x);
  vec3 sh = F + vec3(0.0, 1.38 * k, 0.0) + X * 0.22 * k;
  return sh + normalize(K - sh) * 0.64 * k;
}`;

// KIND 0 a kite; 1 a tail ribbon; 2 a dragon's body; 3 a train. aX: train count or segments, spacing (m), where on the
// spine a tail hangs, unused.
const KITE_VERT = /* glsl */`
${BEND_PARS}
${MOTION}
uniform float uPx, uMinPx, uSpan, uMaxK;
attribute vec4 aCol; attribute vec4 aX; attribute vec3 aC1; attribute vec3 aC2;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vSail; varying float vSoft;
void main() {
  float t = uClock;
  vec3 F, W, K, Wk; float lift, e, s, d, sg;
  kRig(t, F, W, K, Wk, lift, e, s, d, sg);
  vec3 R, U, N; kAxes(Wk, lift, e, t, R, U, N);
  float sc = aK.y;
  vec3 p = position, n = normal, P;
#if KIND == 0
  // a kite too far off to fill a couple of pixels is drawn a little larger, so it stays a speck of colour
  vec3 c0 = K, n0 = vec3(0.0, 1.0, 0.0); kBend(c0, n0);
  float dist = length(c0 - cameraPosition);
  sc *= clamp(uMinPx * dist / (uSpan * sc * uPx), 1.0, uMaxK);
  P = K + (R * p.x + U * p.y + N * p.z) * sc;
  n = R * n.x + U * n.y + N * n.z;
#elif KIND == 3
  float k = floor(-p.z / 10.0 + 0.5); p.z += 10.0 * k;
  vec3 H = kHand(F, W, K, 1.0);
  vec3 dl = H - K; float ll = length(dl);
  float f = min(k * aX.y / max(ll, 1.0), 0.9);
  vec3 Q = K + dl * f - vec3(0.0, ll * 0.03 * 4.0 * f * (1.0 - f), 0.0);
  float show = step(k, aX.x - 0.5);
  P = Q + (R * p.x + U * p.y + N * p.z) * sc * show;
  n = R * n.x + U * n.y + N * n.z;
#else
  // segment j trails back along the track from where it hangs, falling away below the kite, waving
  float j = floor(-p.z + 0.5); p.z += j;
  float sp = aX.y;
  vec2 tj; vec2 pj = kTrack((s - d - j * sp) * sg, tj);
  vec3 T = vec3(tj.x, 0.0, tj.y) * sg;
  vec3 Rj = normalize(vec3(-T.z, 0.0, T.x));
  vec3 A = K + U * (aX.z * sc);
#if KIND == 1
  float slope = mix(1.2, 0.5, lift);
#else
  float slope = mix(0.9, 0.2, lift);
#endif
  vec3 Cj = vec3(pj.x + (A.x - K.x), max(A.y - j * sp * sin(slope), 0.1), pj.y + (A.z - K.z));
  float wave = sin(t * 3.1 - j * 0.6 + aK.z * 20.0);
#if KIND == 1
  Cj += Rj * wave * 0.035 * j * sc;
  float tw = j * 0.55 + t * 2.4 + aK.z * 9.0;
  vec3 across = Rj * cos(tw) + vec3(0.0, sin(tw), 0.0);
  P = Cj + across * p.x * sc;
  n = cross(across, T);
#else
  Cj += Rj * wave * 0.5 * smoothstep(0.0, 12.0, j) * lift;
  vec3 Tb = normalize(T * cos(slope) + vec3(0.0, sin(slope), 0.0));
  vec3 Ub = normalize(cross(Tb, Rj));
  P = Cj + (Rj * p.x + Ub * p.y + Tb * p.z) * sc;
  n = Rj * n.x + Ub * n.y + Tb * n.z;
#endif
#endif
  kBend(P, n);
  vW = P; vN = n;
  float w = aCol.a;
  vCol = w > 0.75 ? aCol.rgb * aC1 : w > 0.25 ? aCol.rgb * aC2 : aCol.rgb;
  vSail = step(0.25, w); vSoft = 0.0;
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
}`;

// the flyers: legs going at the speed they cover ground, leaning in when they run, an arm up the line
const FLYER_VERT = /* glsl */`
${BEND_PARS}
${MOTION}
attribute vec4 aCol; attribute float aPart; attribute vec3 aC1; attribute vec3 aC2;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vSail; varying float vSoft;
void main() {
  float t = uClock;
  vec3 F, W, K, Wk; float lift, e, s, d, sg;
  kRig(t, F, W, K, Wk, lift, e, s, d, sg);
  float k = aK.y;
  F += vec3(-W.z, 0.0, W.x) * aK.w;
  float v = abs(aB.y) * (kDist(t + 0.2) - kDist(t - 0.2)) / 0.4;
  float run = clamp((v - 1.6) / 2.6, 0.0, 1.0), moving = clamp(v / 0.5, 0.0, 1.0);
  float ph = s / ((0.75 + 0.55 * run) * k) * 3.14159;
  vec3 X = vec3(W.z, 0.0, -W.x), Y = vec3(0.0, 1.0, 0.0);
  vec3 p = position, n = normal, P;
  if (aPart > 3.5 && aPart < 4.5) {
    vec3 sh = F + vec3(0.0, 1.38 * k, 0.0) + X * 0.22 * k;
    vec3 dir = normalize(K - sh);
    vec3 side = normalize(cross(dir, Y) + vec3(1e-4, 0.0, 0.0));
    vec3 up2 = cross(side, dir);
    P = sh + (dir * p.y + side * p.x + up2 * p.z) * k;
    n = dir * n.y + side * n.x + up2 * n.z;
  } else {
    if (aPart > 1.5 && aPart < 3.5) {
      float sw = (aPart < 2.5 ? 1.0 : -1.0) * sin(ph) * (0.28 + 0.42 * run) * moving;
      float c = cos(sw), sn = sin(sw), qy = p.y - 0.86;
      p = vec3(p.x, 0.86 + qy * c + p.z * sn, p.z * c - qy * sn);
      n = vec3(n.x, n.y * c + n.z * sn, n.z * c - n.y * sn);
    }
    float lean = 0.25 * run * moving, cl = cos(lean), sl = sin(lean);
    p = vec3(p.x, p.y * cl - p.z * sl, p.z * cl + p.y * sl);
    n = vec3(n.x, n.y * cl - n.z * sl, n.z * cl + n.y * sl);
    p.y += abs(sin(ph)) * 0.09 * run * moving;
    P = F + (X * p.x + Y * p.y + W * p.z) * k;
    n = X * n.x + Y * n.y + W * n.z;
  }
  kBend(P, n);
  vW = P; vN = n;
  vec3 skin = mix(vec3(0.82, 0.55, 0.38), vec3(0.16, 0.08, 0.045), fract(aK.z * 7.31));
  vCol = aCol.rgb * (aPart > 4.5 ? skin : (aPart > 1.5 && aPart < 3.5) ? aC2 : aC1);
  vSail = 0.0; vSoft = aPart > 4.5 ? 0.2 : 0.6;
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
}`;

const kiteFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vSail; varying float vSoft;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  N = normalize(mix(N, kUp(vW), vSoft));
  // cloth lets the light through: a sail seen from under it glows with the line's light
  vec3 Lg = kLight(vW, N, vW, N) + vSail * 0.6 * kLight(vW, -N, vW, -N);
  gl_FragColor = vec4(kAir(vCol * Lg, vW), 1.0);
}`;

// strings: a line from the flyer's hand to the kite's bridle, sagging when it slackens. aX: bridle (kite frame), figure scale
const LINE_VERT = /* glsl */`
${BEND_PARS}
${MOTION}
attribute vec4 aX;
uniform float uFade;
varying vec3 vW; varying float vA;
void main() {
  float t = uClock;
  vec3 F, W, K, Wk; float lift, e, s, d, sg;
  kRig(t, F, W, K, Wk, lift, e, s, d, sg);
  vec3 R, U, N; kAxes(Wk, lift, e, t, R, U, N);
  F += vec3(-W.z, 0.0, W.x) * aK.w;
  vec3 H = kHand(F, W, K, aX.w);
  vec3 A = K + (R * aX.x + U * aX.y + N * aX.z) * aK.y;
  float u = position.x, ll = length(A - H);
  vec3 P = mix(H, A, u);
  P.y = max(P.y - ll * (0.012 + 0.08 * (1.0 - lift)) * 4.0 * u * (1.0 - u), 0.04);
  vec3 n = vec3(0.0, 1.0, 0.0);
  kBend(P, n);
  vW = P;
  vA = clamp(uFade / max(length(P - cameraPosition), 1.0), 0.0, 1.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
}`;
const lineFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uCol; uniform float uAlpha;
varying vec3 vW; varying float vA;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 c = uCol * (kSunColor(vW.xy) * 0.7 + uAmb * 1.4);
  gl_FragColor = vec4(kAir(c, vW), uAlpha * vA);
}`;

// ---------------------------------------------------------------- meshes from rigs
// items: [{ rg, k: [line angle, scale, seed, left], x: [...4], c1, c2 }]
function rigGeometry(base, items) {
  const g = new InstancedBufferGeometry();
  for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.getAttribute(k));
  if (base.index) g.setIndex(base.index);
  const n = items.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), S = new Float32Array(n * 4), K = new Float32Array(n * 4), X = new Float32Array(n * 4);
  const C1 = new Float32Array(n * 3), C2 = new Float32Array(n * 3);
  items.forEach((it, i) => {
    const r = it.rg;
    A.set([r.cx, r.cz, r.th, r.a], i * 4); B.set([r.r, r.v, r.s0, r.len], i * 4); S.set(r.stop, i * 4);
    K.set(it.k, i * 4); X.set(it.x || [0, 0, 0, 0], i * 4);
    C1.set(rgb(it.c1 || r.c1), i * 3); C2.set(rgb(it.c2 || r.c2), i * 3);
  });
  for (const [k, a, s] of [['aA', A, 4], ['aB', B, 4], ['aS', S, 4], ['aK', K, 4], ['aX', X, 4], ['aC1', C1, 3], ['aC2', C2, 3]]) g.setAttribute(k, new InstancedBufferAttribute(a, s));
  g.instanceCount = n;
  return g;
}
const BEND0 = { value: new Vector3(0, 0, DRUM.RH) };
function kiteMesh(rig, U, base, items, kind, span = 1, minPx = 2.4, maxK = 4) {
  if (!items.length) return null;
  const m = new ShaderMaterial({
    uniforms: { ...rig.uniforms, uClip: G.uClip, uClock: U.clock, uBend: BEND0, uPx: G.uPx, uMinPx: { value: minPx }, uSpan: { value: span }, uMaxK: { value: maxK } },
    defines: { KIND: kind }, vertexShader: KITE_VERT, fragmentShader: kiteFrag(rig), side: DoubleSide,
  });
  const mesh = new Mesh(rigGeometry(base, items), m);
  mesh.frustumCulled = false;
  return mesh;
}
function flyerMesh(rig, U, items) {
  const m = new ShaderMaterial({ uniforms: { ...rig.uniforms, uClip: G.uClip, uClock: U.clock, uBend: BEND0 }, vertexShader: FLYER_VERT, fragmentShader: kiteFrag(rig), side: DoubleSide });
  const mesh = new Mesh(rigGeometry(flyerGeo(), items), m);
  mesh.frustumCulled = false;
  return mesh;
}
function lineMesh(rig, U, items, segs = 10) {
  const pos = [];
  for (let i = 0; i < segs; i++) pos.push(i / segs, 0, 0, (i + 1) / segs, 0, 0);
  const base = new BufferGeometry(); base.setAttribute('position', new Float32BufferAttribute(pos, 3));
  const m = new ShaderMaterial({
    uniforms: { ...rig.uniforms, uClip: G.uClip, uClock: U.clock, uBend: BEND0, uFade: { value: 90 }, uCol: { value: new Vector3(...rgb('#eef3f6')) }, uAlpha: { value: 0.5 } },
    vertexShader: LINE_VERT, fragmentShader: lineFrag(rig), transparent: true, depthWrite: false,
  });
  const mesh = new LineSegments(rigGeometry(base, items), m);
  mesh.frustumCulled = false; mesh.renderOrder = 6;
  return mesh;
}
// where the line ties on, in the kite's own frame
const BRIDLE = { diamond: [0, 0.04, 0.22], rokko: [0, 0.1, 0.22], box: [0, 0.22, 0.16], delta: [0, 0.18, 0.26], dragon: [0, 0, 0.2], train: [0, 0, 0.12] };
const TEAM_LEFT = [-6.25, -3.75, -1.25, 1.25, 3.75, 6.25];
const LEGS = ['#2f3b45', '#4a4f57', '#5e5446', '#3a3f48', '#6b6f73', '#24306e', '#7a6a58'];

function* buildKites(scene, rig, rigs, U) {
  const out = [];
  const add = (m) => { if (m) { scene.add(m); out.push(m); } };
  const all = rigs.near.concat(rigs.far);
  const it = (rg, extra = {}) => ({ rg, k: [rg.eMax, rg.scale, rg.seed, 0], ...extra });
  const of = (list, kind) => list.filter((r) => r.kind === kind);
  // near: kites in detail, tails, flyers and their lines
  add(kiteMesh(rig, U, diamondGeo(true), of(rigs.near, 'diamond').map((r) => it(r)), 0, 1));
  add(kiteMesh(rig, U, rokkoGeo(true), of(rigs.near, 'rokko').map((r) => it(r)), 0, 1));
  add(kiteMesh(rig, U, boxGeo(true), of(rigs.near, 'box').map((r) => it(r)), 0, 1));
  add(kiteMesh(rig, U, deltaGeo(true, false), of(rigs.near, 'delta').map((r) => it(r)), 0, 2));
  yield 'kites: near';
  const tails = [];
  for (const r of rigs.near) {
    if (r.kind === 'diamond') tails.push(it(r, { x: [12, 0.42 * r.scale, -0.58, 0] }));
    else if (r.kind === 'rokko' && r.seed < 0.5) tails.push(it(r, { x: [12, 0.42 * r.scale, -0.5, 0], c2: r.c1, c1: r.c2 }));
    else if (r.kind === 'delta') tails.push(it(r, { x: [12, 0.5 * r.scale, -0.18, 0] }));
  }
  add(kiteMesh(rig, U, tailGeo(12, 0.11), tails, 1));
  // in every field, near and far: dragons, trains and the great deltas
  add(kiteMesh(rig, U, headGeo(), of(all, 'dragon').map((r) => it(r)), 0, 1.3, 2.4, 6));
  add(kiteMesh(rig, U, bodyGeo(40), of(rigs.near, 'dragon').map((r) => it(r, { x: [40, r.seg * r.scale, -0.1, 0] })), 2));
  add(kiteMesh(rig, U, bodyGeo(18, 4, 2.2), of(rigs.far, 'dragon').map((r) => it(r, { x: [18, r.seg * r.scale * 2.2, -0.1, 0] })), 2));
  add(kiteMesh(rig, U, trainGeo(24), of(all, 'train').map((r) => it(r, { x: [r.n, r.seg, 0, 0] })), 3));
  add(kiteMesh(rig, U, deltaGeo(true, true), of(all, 'team').map((r) => it(r)), 0, 2, 2.4, 6));
  yield 'kites: dragons';
  // far: simple shapes, a speck of colour each
  add(kiteMesh(rig, U, diamondGeo(false), of(rigs.far, 'diamond').map((r) => it(r)), 0, 1, 3.2, 9));
  add(kiteMesh(rig, U, rokkoGeo(false), of(rigs.far, 'rokko').map((r) => it(r)), 0, 1, 3.2, 9));
  add(kiteMesh(rig, U, boxGeo(false), of(rigs.far, 'box').map((r) => it(r)), 0, 1, 3.2, 9));
  add(kiteMesh(rig, U, deltaGeo(false, false), of(rigs.far, 'delta').map((r) => it(r)), 0, 2, 3.2, 9));
  yield 'kites: far';
  // the flyers near the flight, and every line
  const rng = makeRng('yarrow-flyers'), fl = [], lines = [];
  for (const r of rigs.near) {
    const lefts = r.kind === 'team' ? TEAM_LEFT : [0];
    for (const left of lefts) {
      const fs = r.child ? rng.f(0.62, 0.72) : rng.f(0.93, 1.06);
      fl.push({ rg: r, k: [r.eMax, fs, rng(), left], c1: rng.chance(0.35) ? r.c1 : rng.pick(CLOTH), c2: rng.pick(LEGS) });
      const br = r.kind === 'team' ? [left / 6.25 * 0.72, -0.12, 0.2] : BRIDLE[r.kind];
      lines.push({ rg: r, k: [r.eMax, r.scale, r.seed, left], x: [br[0], br[1], br[2], fs] });
    }
  }
  add(flyerMesh(rig, U, fl));
  add(lineMesh(rig, U, lines));
  yield 'kites: flyers';
  return out;
}

// ---------------------------------------------------------------- the workshops
// A pavilion: open at the front (local z = 0) onto the lawn, 26 m wide and 15 deep, with a sawtooth roof whose glazed
// faces look at the lawn. og takes faces seen from outside (in the Hollow's light), ig faces seen from inside (in the
// shade of the roof).
const PW = 13, PD = 15, PH = 6, DOOR = 6.5, INNER = '#e2e9ec';
function pavilionShell(og, ig, x, zf) {
  og.at(x, 0, zf); ig.at(x, 0, zf);
  ig.floor(-PW + 0.3, -PD + 0.3, PW - 0.3, 0, 0.12, '#cfd5d4');
  og.box(-PW, 0, -PD, PW, 0.12, 0, '#bfc8cc', { skip: 'tbn' });
  og.floor(-PW, 0, PW, 1.4, 0.13, '#d8dee0');
  og.box(-PW, 0.12, -PD, PW, PH, -PD + 0.3, WHITE, { skip: 'sb' }); ig.box(-PW, 0.12, -PD, PW, PH, -PD + 0.3, INNER, { skip: 'tbnwe' });
  og.box(-PW, 0.12, -PD, -PW + 0.3, PH, 0, WHITE, { skip: 'eb' }); ig.box(-PW, 0.12, -PD, -PW + 0.3, PH, 0, INNER, { skip: 'tbnsw' });
  og.box(PW - 0.3, 0.12, -PD, PW, PH, 0, WHITE, { skip: 'wb' }); ig.box(PW - 0.3, 0.12, -PD, PW, PH, 0, INNER, { skip: 'tbnse' });
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -PW : DOOR, x1 = s < 0 ? -DOOR : PW;
    og.box(x0, 0.12, -0.3, x1, PH, 0, WHITE, { skip: 'nb' }); ig.box(x0, 0.12, -0.3, x1, PH, 0, INNER, { skip: 'tbswe' });
    // the doors, slid open along the front: slate, with pale rails
    const d0 = s < 0 ? -PW - 0.5 : DOOR - 0.2, d1 = s < 0 ? -DOOR + 0.2 : PW + 0.5;
    og.box(d0, 0.13, 0.04, d1, 5.1, 0.2, SLATE, { top: PALE });
    for (let k = 0; k < 4; k++) og.box(d0 + 0.1, 0.4 + k * 1.2, 0.2, d1 - 0.1, 0.48 + k * 1.2, 0.24, PALE);
  }
  og.box(-DOOR, 5.1, -0.3, DOOR, PH, 0, WHITE, { skip: 'n' }); ig.box(-DOOR, 5.1, -0.3, DOOR, PH, 0, INNER, { skip: 'tbswe' });
  og.box(-PW - 0.6, 5.1, 0, PW + 0.6, 5.3, 0.45, PALE);
  // the sawtooth roof: four teeth, each a slope rising toward the lawn and a glazed face looking at it
  for (let k = 0; k < 4; k++) {
    const zA = -PD + 3.75 * k, zB = zA + 3.75, y1 = PH + 1.5;
    const a = [-PW, PH, zA], b = [PW, PH, zA], c = [PW, y1, zB], d = [-PW, y1, zB];
    og.quad(a, d, c, b, '#e9eff2'); ig.quad(a, b, c, d, '#d6dee2');
    og.quad([-PW, PH, zB], [PW, PH, zB], [PW, y1, zB], [-PW, y1, zB], '#8fa5b2', 0.05);
    ig.quad([PW, PH, zB], [-PW, PH, zB], [-PW, y1, zB], [PW, y1, zB], '#eef5fa', 1.1);
    og.tri([-PW, PH, zA], [-PW, PH, zB], [-PW, y1, zB], '#eef3f6'); og.tri([PW, PH, zA], [PW, y1, zB], [PW, PH, zB], '#eef3f6');
    // the trusses under each tooth
    ig.box(-PW, PH - 0.35, zB - 0.12, PW, PH, zB + 0.12, '#b9c4ca');
    for (let x = -PW + 3.25; x < PW; x += 6.5) ig.tube([[x, PH, zA + 0.2], [x, PH - 0.3, zB - 0.2], [x, y1 - 0.1, zB - 0.1]], 0.05, 4, '#9aa8b0');
  }
  og.pop(); ig.pop();
}

// small things for benches and walls
function kiteFlat(g, x, y, z, s, c1, c2, rot = 0, lean = 0) {
  // a diamond kite standing at (x, y, z), in the x-y plane turned by rot about y, leaning back by lean
  g.at(x, y, z, rot); g.rot('x', -lean);
  g.tri([0, 0.42 * s, 0], [-0.36 * s, 0.06 * s, 0], [0, 0.06 * s, 0.01], c1).tri([0, 0.42 * s, 0], [0, 0.06 * s, 0.01], [0.36 * s, 0.06 * s, 0], c1);
  g.tri([-0.36 * s, 0.06 * s, 0], [0, -0.58 * s, 0], [0, 0.06 * s, 0.01], c2).tri([0, 0.06 * s, 0.01], [0, -0.58 * s, 0], [0.36 * s, 0.06 * s, 0], c2);
  g.tube([[0, -0.58 * s, 0.02], [0, 0.42 * s, 0.02]], 0.012, 3, SPAR, { smooth: false }); g.tube([[-0.36 * s, 0.06 * s, 0.02], [0.36 * s, 0.06 * s, 0.02]], 0.012, 3, SPAR, { smooth: false });
  g.pop(); g.pop();
}
function frameOnly(g, x, y, z, s, rot) {
  g.at(x, y, z, rot);
  g.tube([[0, 0, -0.58 * s], [0, 0, 0.42 * s]], 0.013, 3, '#c9b48e', { smooth: false });
  g.tube([[-0.36 * s, 0, 0.06 * s], [0.36 * s, 0, 0.06 * s]], 0.013, 3, '#c9b48e', { smooth: false });
  g.tube([[0, 0.01, 0.42 * s], [-0.36 * s, 0.01, 0.06 * s], [0, 0.01, -0.58 * s], [0.36 * s, 0.01, 0.06 * s], [0, 0.01, 0.42 * s]], 0.004, 3, '#e8e2d2', { smooth: false });
  g.pop();
}
function chairGeo(g, x, z, rot, wood, seat, upside, y0 = 0) {
  g.at(x, upside ? y0 + 0.5 : y0, z, rot);
  if (upside) g.rot('z', Math.PI);
  for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) g.box(lx - 0.025, 0, lz - 0.025, lx + 0.025, 0.45, lz + 0.025, wood);
  g.box(-0.23, 0.45, -0.23, 0.23, 0.5, 0.23, seat);
  if (!upside) { for (let k = -2; k <= 2; k++) g.box(k * 0.085 - 0.012, 0.5, -0.23, k * 0.085 + 0.012, 0.95, -0.2, wood); g.box(-0.23, 0.92, -0.24, 0.23, 1.0, -0.19, wood); }
  if (upside) g.pop();
  g.pop();
}
// the bench the flight begins at, and the workshop round it (local to the pavilion at X0)
function heroWorkshop(ig, rng) {
  ig.at(X0, 0, ZP);
  // the bench: old, scarred, mended with a dark butterfly key where it split
  ig.box(-1.75, 0.84, -6.45, 1.75, 0.93, -5.15, '#b8996f', { top: '#c9aa80' });
  for (const [lx, lz] of [[-1.6, -6.3], [1.6, -6.3], [-1.6, -5.3], [1.6, -5.3]]) ig.box(lx - 0.05, 0.12, lz - 0.05, lx + 0.05, 0.84, lz + 0.05, '#8d7152');
  ig.box(-1.6, 0.3, -6.3, 1.6, 0.34, -5.3, '#8d7152');
  ig.extrude([[-0.5, -5.62], [-0.38, -5.7], [-0.26, -5.62], [-0.26, -5.78], [-0.38, -5.7], [-0.5, -5.78]], 0.93, 0.004, '#4a3426');
  // on it: spools of line, shears, a pot of glue, a rule, offcuts in two schools' colours
  for (let i = 0; i < 4; i++) ig.cyl(1.05 + i * 0.16, 0.93, -5.4, 0.06, 0.06, 0.09, 8, ['#f6fbff', '#e8402a', '#f5d84a', '#c9d6dc'][i]);
  ig.box(-1.45, 0.93, -5.5, -0.95, 0.945, -5.46, '#9aa3a8'); ig.box(-1.4, 0.93, -5.62, -1.0, 0.945, -5.32, '#9aa3a8');
  ig.cyl(1.35, 0.93, -6.15, 0.07, 0.06, 0.1, 7, '#55636b'); ig.box(-1.6, 0.93, -6.32, 0.4, 0.94, -6.26, '#e4d4a8');
  for (let i = 0; i < 7; i++) { const ox = rng.f(-1.5, 1.4), oz = rng.f(-6.3, -5.25); ig.tri([ox, 0.935, oz], [ox + rng.f(0.1, 0.25), 0.935, oz + rng.f(-0.1, 0.1)], [ox + rng.f(0, 0.15), 0.935, oz + rng.f(0.08, 0.2)], i % 2 ? '#e8402a' : '#f5d84a'); }
  // a lamp over the bench
  ig.tube([[0, PH, -5.8], [0, 2.5, -5.8]], 0.012, 3, INK);
  ig.cyl(0, 2.2, -5.8, 0.36, 0.09, 0.3, 10, SLATE, { cap: false });
  ig.blob(0, 2.25, -5.8, 0.09, 0, '#fff4dc', { emit: 4 });
  // the side bench: frames waiting for cloth, a kite half covered, kites leaning on the wall
  ig.box(-12.65, 0.84, -13.2, -11.2, 0.92, -1.8, '#b39470'); for (const z of [-13, -7.5, -2]) ig.box(-12.5, 0.12, z - 0.05, -11.35, 0.84, z + 0.05, '#8d7152');
  for (let i = 0; i < 5; i++) frameOnly(ig, -11.95, 0.93, -12.2 + i * 2.1, 1.2, 0.2 * (i - 2));
  kiteFlat(ig, -11.9, 0.95, -4.0, 1.2, '#1f6fd1', '#f6fbff', Math.PI / 2, Math.PI / 2);
  for (let i = 0; i < 6; i++) kiteFlat(ig, -12.55, 1.9 + (i % 2) * 0.2, -12.5 + i * 1.9, 1.3 + (i % 3) * 0.25, SCHOOLS[i * 2][0], SCHOOLS[i * 2][1], Math.PI / 2, 0.18);
  // the cloth: bolts on shelves along the right wall, in every school's colours
  for (const y of [0.55, 1.3, 2.05]) ig.box(11.4, y - 0.05, -12.6, 12.65, y, -3.4, '#a88a64');
  for (let s = 0; s < 3; s++) for (let i = 0; i < 12; i++) {
    const c = SCHOOLS[(i + s * 5) % SCHOOLS.length][(i + s) % 2], y = [0.55, 1.3, 2.05][s];
    ig.at(12.0, y + 0.17, -12.2 + i * 0.75).rot('z', Math.PI / 2).cyl(0, -0.6, 0, 0.17, 0.17, 1.2, 8, c).pop().pop();
  }
  // the back wall: a board of old tools, and finished kites above it, one mended where it shows
  ig.box(-5.5, 1.0, -14.72, 5.5, 3.1, -14.66, SLATE);
  for (let i = 0; i < 9; i++) {
    const tx = -4.8 + i * 1.2, z = -14.62;
    if (i % 3 === 0) { ig.quad([tx - 0.35, 1.5, z], [tx + 0.25, 1.62, z], [tx + 0.25, 2.5, z], [tx - 0.35, 2.4, z], '#b9c0c4'); ig.box(tx + 0.25, 2.2, z - 0.02, tx + 0.45, 2.55, z + 0.03, '#7a5a3c'); }
    else if (i % 3 === 1) { ig.box(tx - 0.3, 1.6, z - 0.02, tx + 0.3, 1.8, z + 0.06, '#8d6a48'); ig.box(tx - 0.04, 1.8, z, tx + 0.04, 2.6, z + 0.04, '#7a5a3c'); ig.cyl(tx, 2.6, z + 0.02, 0.09, 0.09, 0.22, 6, '#6a4a32'); }
    else { for (let k = 0; k < 3; k++) ig.box(tx - 0.3 + k * 0.25, 1.4, z, tx - 0.26 + k * 0.25, 2.1, z + 0.03, k === 1 ? '#c9b48e' : '#9aa3a8'); ig.box(tx - 0.35, 2.3, z, tx + 0.35, 2.36, z + 0.03, INK); ig.box(tx - 0.35, 2.3, z, tx - 0.29, 2.8, z + 0.03, INK); }
  }
  const hung = [[-8.5, 4.3, 1.5, '#e8402a', '#f6fbff'], [-4.5, 4.4, 1.4, '#18a37a', '#f5d84a'], [4.2, 4.3, 1.5, '#1f6fd1', '#f6fbff'], [8.6, 4.2, 1.3, '#ff7a1a', '#16808a']];
  for (const [hx, hy, hs, c1, c2] of hung) kiteFlat(ig, hx, hy, -14.6, hs, c1, c2, 0, 0.05);
  // the mended one: a six-sided kite with a patch of another colour stitched across a tear in gold
  ig.at(0, 4.3, -14.58);
  const R6 = [[-0.6, 1.0], [-0.88, 0.44], [-0.6, -1.0], [0.6, -1.0], [0.88, 0.44], [0.6, 1.0]];
  for (let i = 0; i < 6; i++) { const a = R6[i], b = R6[(i + 1) % 6]; ig.tri([0, 0, 0], [b[0], b[1], 0], [a[0], a[1], 0], '#d03a8c'); }
  ig.quad([0.1, -0.2, 0.01], [0.6, -0.35, 0.01], [0.55, 0.2, 0.01], [0.15, 0.25, 0.01], '#f6efe0');
  for (let k = 0; k < 9; k++) { const u = k / 8; ig.box(0.1 + u * 0.5 - 0.012, -0.21 - u * 0.15, 0.015, 0.1 + u * 0.5 + 0.012, -0.21 - u * 0.15 + 0.08, 0.02, '#f2c14e', { emit: 0.2 }); }
  ig.tube([[0.15, 0.25, 0.02], [0.55, 0.2, 0.02]], 0.01, 3, '#f2c14e', { emit: 0.2 });
  ig.tube([[0, -1.0, 0.03], [0, 1.0, 0.03]], 0.02, 3, SPAR); ig.tube([[-0.88, 0.44, 0.03], [0.88, 0.44, 0.03]], 0.02, 3, SPAR);
  ig.pop();
  // from the trusses: two box kites and a dragon's head coiled with its body
  for (const [bx, bz, c1, c2] of [[-5.5, -9.4, '#f5b800', '#1f2326'], [6.2, -10.5, '#e8402a', '#f6fbff']]) {
    ig.tube([[bx, PH - 0.3, bz], [bx, 4.6, bz]], 0.01, 3, INK);
    for (const [y0, y1, c] of [[3.95, 4.55, c1], [2.95, 3.55, c2]]) for (let i = 0; i < 4; i++) { const a0 = i * Math.PI / 2 + 0.4, a1 = a0 + Math.PI / 2; ig.quad([bx + Math.cos(a0) * 0.3, y0, bz + Math.sin(a0) * 0.3], [bx + Math.cos(a1) * 0.3, y0, bz + Math.sin(a1) * 0.3], [bx + Math.cos(a1) * 0.3, y1, bz + Math.sin(a1) * 0.3], [bx + Math.cos(a0) * 0.3, y1, bz + Math.sin(a0) * 0.3], c); ig.quad([bx + Math.cos(a1) * 0.3, y0, bz + Math.sin(a1) * 0.3], [bx + Math.cos(a0) * 0.3, y0, bz + Math.sin(a0) * 0.3], [bx + Math.cos(a0) * 0.3, y1, bz + Math.sin(a0) * 0.3], [bx + Math.cos(a1) * 0.3, y1, bz + Math.sin(a1) * 0.3], c); }
  }
  const coil = []; for (let i = 0; i <= 40; i++) { const a = i * 0.45; coil.push([7.6 + Math.cos(a) * (0.9 - i * 0.012), 4.8 - i * 0.07, -6.5 + Math.sin(a) * (0.9 - i * 0.012)]); }
  ig.tube(coil, 0.2, 6, '#5bc8e8'); for (let i = 2; i < 40; i += 3) ig.blob(coil[i][0], coil[i][1], coil[i][2], 0.23, 0, '#24306e');
  ig.cyl(7.6, 4.85, -6.5, 0.55, 0.55, 0.06, 12, '#24306e');
  // a chair in for re-springing, upside down on a trestle by the door
  ig.box(8.4, 0.12, -3.4, 9.6, 0.88, -2.6, '#8d7152', { skip: 'b' });
  chairGeo(ig, 9.0, -3.0, 0.3, '#6e5238', '#b0503a', true, 0.88);
  ig.pop();
}

// The row of workshops either side of the flight's start, each with its trade out on the apron: kites drying on racks,
// chairs set out in rows, flutes laid on a long table, lengths of dyed cloth on lines. Judges with flags at the ends
// of the lanes, and people watching along the walk.
function* buildWorkshops(hollow, inRig, rigs) {
  const rng = makeRng('yarrow-workshops');
  const frame = hollow.frame;
  const og = new Geo({ maxSeg: 8 }), ig = new Geo({ maxSeg: 8 }), ag = new Geo({ maxSeg: 8 });
  const inside = [], outside = [], glows = [];
  let t0 = performance.now();
  for (let k = -11; k <= 11; k++) {
    const x = X0 + k * PAV_SP;
    pavilionShell(og, ig, x, ZP);
    glows.push({ p: [x, 2.25, ZP - 5.8], color: '#ffe9c8', power: 5, size: 0.4 });
    if (k !== 0) {
      const trade = ['kites', 'chairs', 'kites', 'flutes', 'cloth', 'kites', 'chairs'][((k * 5) % 7 + 7) % 7];
      ig.at(x, 0, ZP);
      // benches inside, and kites hung on the back wall
      ig.box(-3, 0.84, -7, 3, 0.92, -5.5, '#b39470'); for (const lx of [-2.8, 2.8]) ig.box(lx - 0.06, 0.12, -6.9, lx + 0.06, 0.84, -5.6, '#8d7152');
      for (let i = 0; i < 5; i++) kiteFlat(ig, -8 + i * 4, 4.3, -14.6, rng.f(1.2, 1.8), SCHOOLS[(i + k * 3 + 36) % 12][0], SCHOOLS[(i + k * 3 + 36) % 12][1], 0, 0.04);
      for (let i = 0; i < 4; i++) inside.push({ p: [x + rng.f(-8, 8), 0.12, ZP - rng.f(3, 12)], walk: rng.chance(0.5) ? rng.f(0.5, 1.5) : 0, color: rng.pick(CLOTH) });
      ig.pop();
      ag.at(x, 0, ZP);
      if (trade === 'kites') {
        // kites drying on racks before the door, and a row laid out on the grass to be judged
        for (let r = 0; r < 3; r++) { const rz = 3.5 + r * 2.2; ag.box(-6, 0, rz - 0.04, -5.92, 2.2, rz + 0.04, '#9aa8b0'); ag.box(6, 0, rz - 0.04, 6.08, 2.2, rz + 0.04, '#9aa8b0'); ag.box(-6, 2.12, rz - 0.04, 6.08, 2.2, rz + 0.04, '#9aa8b0'); for (let i = 0; i < 7; i++) { const s = SCHOOLS[(i * 5 + r + k + 24) % 12]; kiteFlat(ag, -5.1 + i * 1.7, 1.45, rz, 1.25, s[0], s[1], 0, 0.02); } }
        for (let i = 0; i < 9; i++) { const s = SCHOOLS[(i * 7 + k + 24) % 12]; kiteFlat(ag, -8 + i * 2, 0.16, 11.5, 1.6, s[0], s[1], 0, Math.PI / 2); }
      } else if (trade === 'chairs') {
        // new chairs set out in rows (a chair is a hundred and twenty-five kays of new mass), and old ones in for mending
        const woods = ['#a07a52', '#8d6a48', '#b88d5e', '#6e5238'], seats = ['#c9563c', '#3a6ea5', '#d9c49a', '#2f3b45', '#6f9a3e'];
        for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) chairGeo(ag, -5.6 + i * 1.6, 3 + r * 1.8, rng.f(-0.15, 0.15), woods[(i + r) % 4], seats[(i * 3 + r) % 5], false);
        for (let i = 0; i < 3; i++) { ag.box(-9.6 + i * 1.4, 0, 2.2, -8.6 + i * 1.4, 0.8, 2.8, '#8d7152', { skip: 'b' }); chairGeo(ag, -9.1 + i * 1.4, 2.5, 0.2, '#6e5238', '#9a8a70', true, 0.8); }
      } else if (trade === 'flutes') {
        // flutes laid out on a long table, a dozen to a cloth
        ag.box(-6, 0.78, 3, 6, 0.86, 4.4, '#e9eef0'); for (const lx of [-5.8, 5.8]) ag.box(lx - 0.05, 0, 3.1, lx + 0.05, 0.78, 4.3, '#8d7152');
        for (let i = 0; i < 40; i++) { const fx = -5.6 + i * 0.28, c = i % 5 === 0 ? '#3b3631' : '#c9a66b'; ag.at(fx, 0.9, 3.7).rot('x', Math.PI / 2).cyl(0, -0.33, 0, 0.022, 0.02, 0.66, 5, c).pop().pop(); }
      } else {
        // cloth dyed in the schools' colours, drying on lines
        for (let r = 0; r < 4; r++) {
          const rz = 3 + r * 2.4;
          ag.cyl(-9, 0, rz, 0.05, 0.05, 3.2, 4, '#9aa8b0'); ag.cyl(9, 0, rz, 0.05, 0.05, 3.2, 4, '#9aa8b0');
          for (let i = 0; i < 9; i++) { const c = SCHOOLS[(i + r * 4 + k + 24) % 12][(i + r) % 2], cx = -8.4 + i * 1.9; ag.quad([cx, 0.9, rz], [cx + 1.6, 0.9, rz], [cx + 1.6, 3.1, rz], [cx, 3.1, rz], c); }
        }
      }
      ag.pop();
      for (let i = 0; i < 9; i++) outside.push({ p: [x + rng.f(-11, 11), 0.13, ZP + rng.f(1, 15)], walk: rng.chance(0.6) ? rng.f(0.6, 3) : 0, child: rng.chance(0.3) });
    }
    if (performance.now() - t0 > 4) { yield 'workshops'; t0 = performance.now(); }
  }
  heroWorkshop(ig, rng);
  yield 'workshops: the bench';
  const inLit = litMaterial(inRig, { bend: frame }), inDbl = litMaterial(inRig, { bend: frame, side: 'double' });
  hollow.add(og.mesh(hollow.lit, frame));
  hollow.add(ig.mesh(inDbl, frame));
  hollow.add(ag.mesh(hollow.litDouble, frame));
  hollow.glow(glows, { minPx: 1.2, maxPx: 40 });
  yield 'workshops: meshes';
  // people at work inside the hero's workshop: the apprentice signing, the teacher watching, two at the side bench
  const inWalk = litMaterial(inRig, { bend: frame, walk: true });
  inside.push(
    { p: [X0 + 2.15, 0.12, ZP - 5.75], yaw: -Math.PI / 2, color: '#2f3b45' },
    { p: [X0 - 2.3, 0.12, ZP - 5.6], yaw: Math.PI / 2, color: '#8c8577' },
    { p: [X0 - 10.9, 0.12, ZP - 9.5], yaw: -Math.PI / 2, color: '#3f8a7a' },
    { p: [X0 - 10.9, 0.12, ZP - 6.0], yaw: -Math.PI / 2, color: '#d98c2b' },
    { p: [X0 + 10.6, 0.12, ZP - 8], yaw: Math.PI / 2, color: '#a34b86' },
  );
  hollow.add(crowd(inside, inWalk, { frame, seed: 'yarrow-inside', bob: 0.05 }));
  // the apprentice's arm across the bench, with a pen at the kite's underside
  const arm = new Geo({ maxSeg: 8 });
  arm.tube([[X0 + 1.95, 1.35, ZP - 5.75], [X0 + 1.3, 1.08, ZP - 5.85], [X0 + 0.55, 1.0, ZP - 6.05]], 0.05, 5, '#2f3b45');
  arm.blob(X0 + 0.52, 1.0, ZP - 6.06, 0.055, 0, SKIN[2]);
  arm.tube([[X0 + 0.5, 0.97, ZP - 6.1], [X0 + 0.42, 1.12, ZP - 6.0]], 0.008, 3, INK);
  hollow.add(arm.mesh(inLit, frame));
  // onlookers along the walk before the workshops, and on the grass
  for (let i = 0; i < 260; i++) {
    const x = X0 + rng.f(-560, 560), z = ZP + rng.f(8, 20);
    if (Math.abs(x - X0) < 9) continue;
    outside.push({ p: [x, 0, z], walk: rng.chance(0.55) ? rng.f(0.8, 5) : 0, sit: rng.chance(0.15), child: rng.chance(0.3) });
  }
  // judges in white coats with flags, at the ends of the long lanes near the flight
  const judges = [];
  for (const rg of rigs.near) {
    if (rg.a < 60 || judges.length > 60) continue;
    for (const s of [-1, 1]) {
      const c = Math.cos(rg.th), sn = Math.sin(rg.th), lx = s * (rg.a + rg.r + 5), lz = rg.r + 4;
      judges.push({ p: [rg.cx + c * lx - sn * lz, 0, rg.cz + sn * lx + c * lz], yaw: rg.th + (s < 0 ? Math.PI / 2 : -Math.PI / 2) });
    }
  }
  hollow.add(crowd(outside, hollow.walk, { frame, seed: 'yarrow-out', bob: 0.12, cell: 120 }));
  const jg = new Geo();
  jg.tint(0).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#3a3f48');
  jg.cyl(0, 0.82, 0, 0.24, 0.2, 0.7, 6, '#f6fbff', { smooth: false });
  jg.blob(0, 1.6, 0, 0.135, 0, SKIN[1], { shadeBottom: 0.8 });
  jg.tube([[0.22, 1.35, 0], [0.4, 1.8, 0.05], [0.45, 2.2, 0.05]], 0.045, 4, '#f6fbff');
  jg.cyl(0.45, 1.6, 0.05, 0.015, 0.015, 1.4, 4, INK);
  jg.quad([0.46, 2.4, 0.05], [1.1, 2.55, 0.05], [1.05, 2.98, 0.05], [0.46, 3.0, 0.05], '#e8402a');
  jg.quad([0.46, 2.4, 0.05], [0.46, 3.0, 0.05], [1.05, 2.98, 0.05], [1.1, 2.55, 0.05], '#f6fbff');
  hollow.add(instances(jg.build(), hollow.litDouble, judges, { frame, cell: 300 }));
  yield 'workshops: people';
}

// Poplars down both sides of the long walks near the flight, standing exactly where the ground draws a crown for each
// (the same cells as kit/flora.js), worked out from the avenues' own lines so the plan need not be read back.
function* standPoplars(hollow, low) {
  const S = WOOD_CELL, items = [], base = rgb('#6d8a68');
  let t0 = performance.now();
  for (let i = 0; i < WALK_N; i++) {
    const wx = i * WALK_SP + WALK_SP / 2;
    if (Math.abs((((wx - X0) % C) + C * 1.5) % C - C / 2) > 650) continue;
    for (const x of [wx - 9, wx + 9]) {
      for (let gz = Math.floor((ZP + 12) / S); gz * S < ZB - 12; gz++) for (let gx = Math.floor((x - 4) / S); gx <= Math.floor((x + 4) / S); gx++) {
        const r = cellRand(gx, gz), tx = (gx + 0.15 + 0.7 * r[0]) * S, tz = (gz + 0.15 + 0.7 * r[1]) * S;
        const k = Math.round((tz - ZP - 12) / 12);
        if (Math.hypot(tx - x, tz - (ZP + 12 + k * 12)) > 2.3 || r[2] > 0.97) continue;
        if (nearPath(low, tx, tz, C) > 280) continue;
        const sc = S * (0.36 + 0.2 * r[3]) / 3.6, f = r[3] * 7.3 % 1, kk = (1.02 + 0.5 * r[3]) * 1.05;
        items.push({ p: [tx, 0, tz], yaw: r[3] * 6.28, scale: [sc, sc * (0.95 + 0.3 * r[1]), sc], color: [base[0] * kk * (1.08 - 0.18 * f), base[1] * kk, base[2] * kk * (0.86 + 0.2 * f)] });
      }
      if (performance.now() - t0 > 4) { yield 'trees'; t0 = performance.now(); }
    }
  }
  hollow.add(instances(treeGeo('poplar'), hollow.lit, items, { frame: hollow.frame, cell: 300 }));
  hollow.setTreeNear(220);
}

// ---------------------------------------------------------------- the kite from the bench, and the child who bought it
// Worked out in the flat model for any moment of the flight, then stood on the drum each frame.
const HK = 1.6, HC = 0.68;                                     // the kite's size, the child's
const HX0 = X0 + 0.3, HZ0 = ZP - 4.55, HX1 = X0 + 0.9, HZ1 = ZP + 5;
function heroAt(t) {
  const out = { child: [HX0, 0.12, HZ0], yaw: Math.PI, dist: 0, run: 0, held: 0, fly: 0, K: null, U: null, N: null, L: 0 };
  // the child: waits at the bench, turns, carries the kite out of the door, and runs
  if (t < 3.6) { out.yaw = Math.PI - Math.PI * sstep(2.4, 3.5, t); }
  else if (t < 7.6) { const u = sstep(3.6, 7.6, t); out.child = [HX0 + (HX1 - HX0) * u, 0.12 * (1 - sstep(6.4, 7.0, t)), HZ0 + (HZ1 - HZ0) * u]; out.yaw = 0; out.dist = (HZ1 - HZ0) * u; out.run = 0.2; }
  else {
    const u = Math.min((t - 7.6) / 1.8, 1), ramp = 4.4 * 1.8 * (u * u * u - 0.5 * u * u * u * u), z = HZ1 + ramp + 4.4 * Math.max(t - 9.4, 0);
    out.child = [HX1, 0, z]; out.yaw = 0; out.dist = (HZ1 - HZ0) + (z - HZ1); out.run = sstep(7.6, 9.4, t);
  }
  const [cx, cy, cz] = out.child, fwd = [Math.sin(out.yaw), 0, Math.cos(out.yaw)], side = [Math.cos(out.yaw), 0, -Math.sin(out.yaw)];
  // the kite: on the bench face up being signed, lifted, carried at the child's side, then let go and flown
  const bench = { K: [X0 + 0.1, 0.965, ZP - 5.8], U: [0, 0, 1], N: [0, 1, 0] };
  const held = { K: [cx + side[0] * 0.55 + fwd[0] * 0.15, cy + 0.95, cz + side[2] * 0.55 + fwd[2] * 0.15], U: [0, 0.94, 0.34], N: [0, -0.34, 0.94] };
  const lift = sstep(2.6, 3.6, t);
  let K = held.K.map((v, i) => bench.K[i] + (v - bench.K[i]) * lift);
  let U = held.U.map((v, i) => bench.U[i] + (v - bench.U[i]) * lift), N = held.N.map((v, i) => bench.N[i] + (v - bench.N[i]) * lift);
  if (t > 7.6) {
    const Lh = 2.5 + 29.5 * sstep(7.6, 15.5, t), e = 0.25 + 0.7 * sstep(7.8, 12.5, t), b = e - 0.32;
    const hand = [cx + side[0] * 0.15, 0.95, cz];
    const fly = { K: [hand[0], hand[1] + Lh * Math.sin(e) + 0.3 * Math.sin(t * 0.9), hand[2] - Lh * Math.cos(e)], U: [0, Math.cos(b), Math.sin(b)], N: [0, -Math.sin(b), Math.cos(b)] };
    const roll = 0.16 * Math.sin(t * 1.1) * sstep(9, 12, t);
    const R0 = [1, 0, 0];
    fly.U = [fly.U[0] * Math.cos(roll) - R0[0] * Math.sin(roll), fly.U[1] * Math.cos(roll), fly.U[2] * Math.cos(roll)];
    const w = sstep(7.6, 8.8, t);
    K = K.map((v, i) => v + (fly.K[i] - v) * w); U = U.map((v, i) => v + (fly.U[i] - v) * w); N = N.map((v, i) => v + (fly.N[i] - v) * w);
    out.fly = w; out.L = Lh; out.hand = hand;
  }
  // tidy the axes
  const nv = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  N = nv(N); const d = U[0] * N[0] + U[1] * N[1] + U[2] * N[2]; U = nv([U[0] - N[0] * d, U[1] - N[1] * d, U[2] - N[2] * d]);
  out.K = K; out.U = U; out.N = N; out.R = [U[1] * N[2] - U[2] * N[1], U[2] * N[0] - U[0] * N[2], U[0] * N[1] - U[1] * N[0]];
  out.held = lift;
  return out;
}

const _m1 = new Matrix4(), _m2 = new Matrix4(), _v1 = new Vector3(), _v2 = new Vector3(), _v3 = new Vector3(), _v4 = new Vector3();
// stand a model at flat point p with flat axes (x, y, z directions), scaled
function placeFlat(obj, frame, p, ax, ay, az, s = 1) {
  frame.dir(p[0], ax[0], ax[1], ax[2], _v1); frame.dir(p[0], ay[0], ay[1], ay[2], _v2); frame.dir(p[0], az[0], az[1], az[2], _v3);
  frame.point(p[0], p[1], p[2], _v4);
  obj.matrix.makeBasis(_v1.multiplyScalar(s), _v2.multiplyScalar(s), _v3.multiplyScalar(s)).setPosition(_v4);
  obj.matrixWorldNeedsUpdate = true;
}

function makeHero(scene, hollow, inRig) {
  const frame = hollow.frame;
  const inPlain = litMaterial(inRig, { side: 'double' }), outPlain = litMaterial(hollow.rig, { side: 'double' });
  const kg = new Geo();
  kg.tint(0);
  // (the cloth glows a little with the light through it)
  kg.tri([0, 0.42, 0], [-0.36, 0.06, -0.04], [0, 0.06, 0.02], HERO[0], 0.35).tri([0, 0.42, 0], [0, 0.06, 0.02], [0.36, 0.06, -0.04], HERO[0], 0.35);
  kg.tri([-0.36, 0.06, -0.04], [0, -0.58, 0], [0, 0.06, 0.02], HERO[1], 0.35).tri([0, 0.06, 0.02], [0, -0.58, 0], [0.36, 0.06, -0.04], HERO[1], 0.35);
  kg.tube([[0, -0.58, 0.025], [0, 0.42, 0.025]], 0.01, 4, SPAR); kg.tube([[-0.36, 0.06, 0.0], [0.36, 0.06, 0.0]], 0.01, 4, SPAR);
  kg.tube([[0, 0.24, 0.03], [0, 0.04, 0.2], [0, -0.3, 0.03]], 0.003, 3, '#f6fbff');
  // the apprentice's name on the underside, in ink
  const sig = []; for (let i = 0; i <= 14; i++) sig.push([-0.13 + i * 0.018, -0.3 + 0.025 * Math.sin(i * 1.9) + (i > 9 ? 0.02 : 0), 0.024]);
  kg.tube(sig, 0.0035, 3, INK);
  const kite = new Mesh(kg.build(), inPlain); kite.matrixAutoUpdate = false; kite.frustumCulled = false; scene.add(kite);
  // the child: a body, two legs that swing, an arm on the line
  const body = new Geo(), legL = new Geo(), legR = new Geo(), armG = new Geo();
  body.cyl(0, 0.82, 0, 0.21, 0.18, 0.62, 7, '#f5b800', { smooth: false }); body.blob(0, 1.6, 0, 0.14, 1, SKIN[1], { shadeBottom: 0.8 });
  body.blob(0, 1.66, -0.02, [0.15, 0.12, 0.15], 0, '#4a2e1c'); body.box(-0.29, 0.86, -0.05, -0.2, 1.38, 0.05, '#f5b800');
  legL.box(-0.15, 0, -0.08, -0.02, 0.88, 0.08, '#24306e'); legR.box(0.02, 0, -0.08, 0.15, 0.88, 0.08, '#24306e');
  armG.box(-0.05, 0, -0.05, 0.05, 0.64, 0.05, '#f5b800'); armG.blob(0, 0.66, 0, 0.06, 0, SKIN[1]);
  const parts = [body, legL, legR, armG].map((g) => { const m = new Mesh(g.build(), inPlain); m.matrixAutoUpdate = false; m.frustumCulled = false; scene.add(m); return m; });
  // its tail, and its line
  const NT = 14, tpos = new Float32Array(NT * 6 * 3), tnrm = new Float32Array(NT * 6 * 3), tcol = new Uint8Array(NT * 6 * 4), temit = new Float32Array(NT * 6);
  for (let i = 0; i < NT * 6; i++) { const c = rgb(Math.floor(i / 6) % 4 < 2 ? HERO[1] : HERO[0]); tcol.set([c[0] * 255, c[1] * 255, c[2] * 255, 0], i * 4); }
  const tg = new BufferGeometry();
  tg.setAttribute('position', new Float32BufferAttribute(tpos, 3)); tg.setAttribute('normal', new Float32BufferAttribute(tnrm, 3));
  tg.setAttribute('aCol', new Uint8BufferAttribute(tcol, 4, true)); tg.setAttribute('aEmit', new Float32BufferAttribute(temit, 1));
  const tail = new Mesh(tg, outPlain); tail.frustumCulled = false; scene.add(tail);
  const tP = tg.attributes.position.array, tN = tg.attributes.normal.array;       // (the attributes hold copies)
  const lg = new BufferGeometry(); lg.setAttribute('position', new Float32BufferAttribute(new Float32Array(6), 3));
  const lineMat = new ShaderMaterial({
    uniforms: { ...hollow.rig.uniforms, uClip: G.uClip, uCol: { value: new Vector3(...rgb('#f6fbff')) }, uAlpha: { value: 0.9 } },
    vertexShader: /* glsl */`varying vec3 vW; varying float vA; void main() { vW = position; vA = 1.0; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
    fragmentShader: lineFrag(hollow.rig), transparent: true, depthWrite: false,
  });
  const line = new LineSegments(lg, lineMat); line.frustumCulled = false; scene.add(line);
  const W = new Vector3(), A = new Vector3(), Bv = new Vector3(), Cv = new Vector3();
  return function update(t) {
    const h = heroAt(t), out = h.child[2] > ZP - 0.4;
    for (const m of parts) m.material = out ? outPlain : inPlain;
    kite.material = h.K[2] > ZP - 0.4 ? outPlain : inPlain;
    placeFlat(kite, frame, h.K, h.R, h.U, h.N, HK);
    const fwd = [Math.sin(h.yaw), 0, Math.cos(h.yaw)], side = [Math.cos(h.yaw), 0, -Math.sin(h.yaw)], up = [0, 1, 0];
    const lean = 0.22 * h.run, ph = h.dist / (0.62 + 0.35 * h.run) * Math.PI, moving = h.run > 0.05 || (t > 3.6 && t < 7.6) ? 1 : 0;
    const fl = [fwd[0] * Math.cos(lean) + 0, Math.sin(lean) * 0 + 0, fwd[2] * Math.cos(lean)];
    const upL = [fwd[0] * Math.sin(lean), Math.cos(lean), fwd[2] * Math.sin(lean)];
    const bob = Math.abs(Math.sin(ph)) * 0.08 * h.run;
    const base = [h.child[0], h.child[1] + bob, h.child[2]];
    placeFlat(parts[0], frame, base, side, upL, [fl[0] - fwd[0] * 0 + 0, -Math.sin(lean), fl[2]], HC);
    for (const [k, sgn] of [[1, 1], [2, -1]]) {
      const sw = sgn * Math.sin(ph) * (0.3 + 0.4 * h.run) * moving;
      const ly = [upL[0] * Math.cos(sw) + fwd[0] * Math.sin(sw), upL[1] * Math.cos(sw) - Math.sin(lean) * Math.sin(sw), upL[2] * Math.cos(sw) + fwd[2] * Math.sin(sw)];
      const lz = [fwd[0] * Math.cos(sw) - upL[0] * Math.sin(sw), -upL[1] * Math.sin(sw), fwd[2] * Math.cos(sw) - upL[2] * Math.sin(sw)];
      const hip = [base[0] + upL[0] * 0.86 * HC, base[1] + upL[1] * 0.86 * HC, base[2] + upL[2] * 0.86 * HC];
      placeFlat(parts[k], frame, [hip[0] - ly[0] * 0.86 * HC, hip[1] - ly[1] * 0.86 * HC, hip[2] - ly[2] * 0.86 * HC], side, ly, lz, HC);
    }
    // the arm: toward the kite (or holding it at the side)
    const sh = [base[0] + side[0] * 0.22 * HC + upL[0] * 1.38 * HC, base[1] + upL[1] * 1.38 * HC, base[2] + side[2] * 0.22 * HC + upL[2] * 1.38 * HC];
    const tgt = h.fly > 0 ? h.K : [h.K[0] - h.U[0] * 0.3, h.K[1] - h.U[1] * 0.3, h.K[2] - h.U[2] * 0.3];
    let dir = [tgt[0] - sh[0], tgt[1] - sh[1], tgt[2] - sh[2]]; const dl = Math.hypot(...dir) || 1; dir = dir.map((v) => v / dl);
    let ax = [dir[1] * 0 - dir[2] * 1, dir[2] * 0 - dir[0] * 0, dir[0] * 1 - dir[1] * 0]; const al = Math.hypot(...ax) || 1; ax = ax.map((v) => v / al);
    const az = [ax[1] * dir[2] - ax[2] * dir[1], ax[2] * dir[0] - ax[0] * dir[2], ax[0] * dir[1] - ax[1] * dir[0]];
    if (t < 2.6) dir = [-fwd[0] * 0.2, -0.98, -fwd[2] * 0.2];
    placeFlat(parts[3], frame, sh, ax, dir, az, HC);
    // the tail: where the kite's foot was a moment ago, falling away below it
    // a chain of short links, each laid toward where the one before it was a moment ago, and hanging
    const pts = [];
    for (let i = 0; i <= NT; i++) {
      if (t < 2.6) { const a = h.K; pts.push([a[0] - 0.08 * i * Math.sin(i * 0.25), 0.968, a[2] - 0.58 * HK * (1 - 0.0) - 0.075 * i * Math.cos(i * 0.25)]); continue; }
      const p = heroAt(t - i * 0.05);
      const q = [p.K[0] - p.U[0] * 0.58 * HK, p.K[1] - p.U[1] * 0.58 * HK - i * 0.05 * (1 - 0.8 * p.fly), p.K[2] - p.U[2] * 0.58 * HK];
      if (i > 0) {
        const a = pts[i - 1], dx = q[0] - a[0], dy = q[1] - a[1] - 0.04, dz = q[2] - a[2], l = Math.hypot(dx, dy, dz) || 1;
        q[0] = a[0] + dx / l * 0.2; q[1] = a[1] + dy / l * 0.2; q[2] = a[2] + dz / l * 0.2;
      }
      q[1] = Math.max(q[1], 0.15);
      pts.push(q);
    }
    for (let i = 0; i < NT; i++) {
      const a = pts[i], b = pts[i + 1];
      frame.point(a[0], a[1], a[2], A); frame.point(b[0], b[1], b[2], Bv);
      W.subVectors(Bv, A); Cv.set(-A.x, -A.y, 0).normalize();
      const tw = i * 0.5 + t * 2.4, across = _v1.crossVectors(W, Cv).normalize().multiplyScalar(Math.cos(tw)).addScaledVector(Cv, t < 2.6 ? 0 : Math.sin(tw) * 0.4).normalize().multiplyScalar(0.06);
      if (t < 2.6) across.copy(_v2.crossVectors(W, Cv).normalize().multiplyScalar(0.06));
      const n = _v3.crossVectors(across, W).normalize();
      const P = [A.clone().sub(across), A.clone().add(across), Bv.clone().add(across), Bv.clone().sub(across)];
      [0, 1, 2, 0, 2, 3].forEach((k, j) => { tP.set([P[k].x, P[k].y, P[k].z], (i * 6 + j) * 3); tN.set([n.x, n.y, n.z], (i * 6 + j) * 3); });
    }
    tg.attributes.position.needsUpdate = true; tg.attributes.normal.needsUpdate = true;
    tg.computeBoundingSphere();
    // the line, from the hand to the bridle, once the kite is let go
    const lp = lg.attributes.position.array;
    if (h.fly > 0) {
      const hand = [sh[0] + dir[0] * 0.64 * HC, sh[1] + dir[1] * 0.64 * HC, sh[2] + dir[2] * 0.64 * HC];
      const br = [h.K[0] + h.N[0] * 0.22 * HK + h.U[0] * 0.04 * HK, h.K[1] + h.N[1] * 0.22 * HK + h.U[1] * 0.04 * HK, h.K[2] + h.N[2] * 0.22 * HK + h.U[2] * 0.04 * HK];
      frame.point(hand[0], hand[1], hand[2], A); frame.point(br[0], br[1], br[2], Bv);
      lp.set([A.x, A.y, A.z, Bv.x, Bv.y, Bv.z]);
      line.visible = true;
    } else line.visible = false;
    lg.attributes.position.needsUpdate = true;
  };
}

// ---------------------------------------------------------------- the Ring
// A ring-wing kite, 32 m across, kept up over one spot by twelve runners going round a circle beneath it, each on a line
// to its rim: the way out of this world. It turns as they go round.
function makeRing(scene, hollow, path) {
  const frame = hollow.frame, ex = path.exit, R0 = RING.r, R1 = RING.r + RING.band, NW = RING.n;
  const omega = RING.speed / RING.walkR;
  const g = new Geo(), n = 64;
  const at = (a, r, z) => [Math.cos(a) * r, Math.sin(a) * r, z];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const c = i % 8 === 7 ? '#f5b800' : i % 2 ? '#e8402a' : WHITE;
    g.quad(at(a0, R0, -0.5), at(a1, R0, -0.5), at(a1, R1, 0.7), at(a0, R1, 0.7), c);
    if (i % 4 === 0) g.tube([at(a0, R0 - 0.05, -0.52), at(a0, R1 + 0.05, 0.72)], 0.05, 4, SPAR, { smooth: false });
  }
  const rim = (r, z) => { const p = []; for (let i = 0; i <= 96; i++) p.push(at((i / 96) * Math.PI * 2, r, z)); return p; };
  g.tube(rim(R0, -0.5), 0.09, 5, '#3b3631'); g.tube(rim(R1, 0.7), 0.07, 5, '#3b3631');
  for (let i = 0; i < NW; i++) { const a = (i / NW) * Math.PI * 2; g.blob(...at(a, R1 + 0.1, 0.75), 0.16, 0, '#f6fbff'); }
  const ring = g.mesh(litMaterial(hollow.rig, { side: 'double' }));
  ring.matrixAutoUpdate = false; ring.frustumCulled = false;
  scene.add(ring);
  const base = new Matrix4().compose(ex.pos, ex.quat, new Vector3(1, 1, 1)), spin = new Matrix4(), M = new Matrix4();
  const cx = ex.flat.x, cz = ex.flat.z;
  const att = new Vector3(), loc = new Vector3();
  // where each runner's line meets the rim, and where the runner is, at clock t (phi0 turns the whole thing)
  const state = (t, phi0, out) => {
    M.multiplyMatrices(base, spin.makeRotationZ(omega * t + phi0));
    for (let i = 0; i < NW; i++) {
      const a = (i / NW) * Math.PI * 2;
      att.set(Math.cos(a) * (R1 + 0.1), Math.sin(a) * (R1 + 0.1), 0.75).applyMatrix4(M);
      frame.local(att, loc);
      const th = Math.atan2(loc.z - cz, loc.x - cx) + 0.45;
      out[i] = { att: att.clone(), th, p: [cx + Math.cos(th) * RING.walkR, 0, cz + Math.sin(th) * RING.walkR], f: [-Math.sin(th), 0, Math.cos(th)] };
    }
    return out;
  };
  // which way round they go (the rim's turning, seen on the floor), and where to start so no line crosses the lens
  const s0 = state(0, 0, []), s1 = state(0.5, 0, []);
  let dth = s1[0].th - s0[0].th; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
  const dir = dth >= 0 ? 1 : -1;
  const hand = (w) => { const fx = w.f[0] * dir, fz = w.f[2] * dir; const inX = cx - w.p[0], inZ = cz - w.p[2], l = Math.hypot(inX, inZ); return frame.point(w.p[0] + inX / l * 0.45 + fx * 0.1, 1.9, w.p[2] + inZ / l * 0.45 + fz * 0.1); };
  const tmp = { pos: new Vector3(), quat: new Quaternion(), fov: 58 };
  let best = 0, bestD = -1;
  for (let k = 0; k < 16; k++) {
    const phi0 = (k / 16) * (Math.PI * 2 / NW);
    let dmin = 1e9;
    for (let t = path.tCross - 9; t < path.tCross; t += 0.15) {
      path.sample(t, tmp);
      const st = state(t, phi0, []);
      for (const w of st) { const h = hand(w); dmin = Math.min(dmin, segDist([tmp.pos.x, tmp.pos.y, tmp.pos.z], [h.x, h.y, h.z], [w.att.x, w.att.y, w.att.z])); }
    }
    if (dmin > bestD) { bestD = dmin; best = phi0; }
  }
  // the runners: an instanced figure mid-stride, its line arm up toward the ring
  const fg = new Geo();
  fg.tint(0.35).box(-0.15, 0, 0.0, -0.02, 0.88, 0.16, '#6a6f7a').box(0.02, 0, -0.18, 0.15, 0.88, -0.02, '#6a6f7a');
  fg.tint(1).cyl(0, 0.82, 0, 0.21, 0.18, 0.62, 6, '#ffffff', { smooth: false });
  fg.tint(0).blob(0, 1.6, 0.05, 0.135, 0, SKIN[2], { shadeBottom: 0.8 });
  const w0 = s0[0], F0 = [w0.f[0] * dir, w0.f[2] * dir], armSide = Math.sign(F0[1] * (cx - w0.p[0]) - F0[0] * (cz - w0.p[2])) || 1;
  fg.tint(1).tube([[armSide * 0.22, 1.36, 0], [armSide * 0.38, 1.66, 0.05], [armSide * 0.45, 1.9, 0.1]], 0.05, 4, '#ffffff');
  const cols = ['#e8402a', '#f6fbff', '#f5b800'];
  const runners = new InstancedMesh(fg.build(), litMaterial(hollow.rig, {}), NW);
  for (let i = 0; i < NW; i++) { const c = rgb(cols[i % 3]); runners.setColorAt(i, new Color().setRGB(c[0], c[1], c[2])); }
  runners.frustumCulled = false; scene.add(runners);
  const lg = new BufferGeometry(); lg.setAttribute('position', new Float32BufferAttribute(new Float32Array(NW * 6), 3));
  const lineMat = new ShaderMaterial({
    uniforms: { ...hollow.rig.uniforms, uClip: G.uClip, uCol: { value: new Vector3(...rgb('#f6fbff')) }, uAlpha: { value: 0.85 } },
    vertexShader: /* glsl */`varying vec3 vW; varying float vA; void main() { vW = position; vA = 1.0; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`,
    fragmentShader: lineFrag(hollow.rig), transparent: true, depthWrite: false,
  });
  const lines = new LineSegments(lg, lineMat); lines.frustumCulled = false; scene.add(lines);
  const st = [], obj = { matrix: new Matrix4() };
  return function update(t) {
    state(t, best, st);
    ring.matrix.copy(M); ring.matrixWorldNeedsUpdate = true;
    const lp = lg.attributes.position.array;
    st.forEach((w, i) => {
      const fx = w.f[0] * dir, fz = w.f[2] * dir;
      placeFlat(obj, frame, w.p, [fz, 0, -fx], [0, 1, 0], [fx, 0, fz], 1.0);
      runners.setMatrixAt(i, obj.matrix);
      const h = hand(w);
      lp.set([h.x, h.y, h.z, w.att.x, w.att.y, w.att.z], i * 6);
    });
    runners.instanceMatrix.needsUpdate = true;
    lg.attributes.position.needsUpdate = true;
  };
}

// ---------------------------------------------------------------- the world
const LIGHT = { sun: '#eef5ff', sunPower: 0.78, sunFar: '#dfe8f4', sunFarPower: 0.55, amb: '#b6c6d2', ambPower: 0.3, bounce: '#a9b8a0', bouncePower: 0.22, air: '#dbe6ee', airDensity: 0.00006 };
const WALL = {
  lit: 0.12, crowd: 0.3, stone: '#e8eef1', stone2: '#cdd8de', houses: ['#f6fbff', '#c9d6dc', '#dfe7ea', '#e9eef0', '#b9c6cc', '#d4dde1'], houseMix: 0.5,
  glass: '#55636b', awning: '#55636b', gardenColor: '#8aa284', pave: '#dfe6e9', winA: '#ffe2b8', winB: '#fff4e0',
};

function flightKeys() {
  const d = [0.77, 0.64, 0], R = [RING.x, RING.y, RING.z], at = (k) => [R[0] + d[0] * k, R[1] + d[1] * k, R[2] + d[2] * k];
  return [
    { t: 0, p: [X0 + 0.25, 1.55, ZP - 8.6], fov: 70 },
    { t: 5, p: [X0 + 0.15, 1.8, ZP - 4.6], look: [X0 + 0.5, 1.0, ZP + 3], fov: 64 },
    { t: 9, p: [X0, 2.4, ZP + 0.8], look: [X0 + 1.2, 4, ZP + 18], fov: 60 },
    { t: 13, p: [X0 - 1.5, 12, ZP + 2], look: [X0 + 1, 21, ZP + 11] },
    { t: 18, p: [X0 - 3, 24, ZP + 17], look: [X0 + 1, 27, ZP + 30] },
    { t: 23, p: [X0 - 6, 27, ZP + 44], look: [X0 + 20, 22, ZP + 160] },
    { t: 29, p: [X0 + 10, 24, ZP + 100], look: [X0 + 60, 18, ZP + 220] },
    { t: 35, p: [X0 + 50, 18, ZP + 165], look: [X0 + 600, 40, ZP + 200] },
    { t: 41, p: [X0 + 110, 14, ZP + 235], look: [X0 + 600, 150, ZP + 330] },
    { t: 46, p: [R[0] - 78, 16, R[2] - 8], look: R },
    { t: 49.5, p: at(-36), look: at(30) },
    { t: 53.8, p: at(10) },
  ];
}

export const yarrowKites = {
  id: 'yarrow-kites',
  title: 'Test day on the lawns',
  drum: 'Yarrow', row: 'Herb Row', kind: 'a maker drum', light: 0.0,
  line: 'There is no wind in a drum, so kites are flown by walking. The apprentice signed the underside of mine before I ran it out of the door, and when I stopped it came down slowly.',
  tone: '#c9d6dc',
  source: '15-canon.js (Yarrow), eating-out.md (Yarrow and Borage), sorrel.md (the Kite Field), ashgrove.md (Day two)',
  sound: { root: 53, scale: 'lydian', pad: 0.4, air: 0.45, crowd: 0.45, bells: 0.15, bright: 0.75 },
  *build(ctx) { try { return yield* buildYarrow(ctx); } catch (e) { console.error('[yarrow] ' + e.stack); throw e; } },
};
// (development) how much work a stage of the build takes, summed over its slices
function* timed(label, gen, out) {
  let w = 0, t = performance.now(), r = gen.next();
  while (!r.done) { w += performance.now() - t; yield r.value; t = performance.now(); r = gen.next(); }
  out.push(label + ' ' + Math.round(w + performance.now() - t));
  return r.value;
}
function* buildYarrow(ctx) {
  {
    const frame = makeFrame(0, 0, DRUM.RH);
    const path = makePath(flightKeys(), { frame, entryRadius: 0.5, exitRadius: 12 });
    const TM = [];
    const rigs = yield* timed('rigs', makeRigs(path, ctx.density), TM);
    const plan = new Plan(ctx.q.plan);
    yield* timed('paint', paintYarrow(plan, rigs), TM);
    yield 'yarrow: plan';
    const hollow = yield* timed('hollow', buildHollow(ctx, {
      seed: 'yarrow', plan, light: LIGHT, pavilions: false,
      sunline: { power: 34, halo: 280, haloPower: 0.035 },
      ground: { rows: [7, 6], canopy: '#86a172', blossom: '#f4eef0', blossomShare: 0.35, fruitShare: 0.1, people: 0.8, lamp: 0.25, lampColor: '#ffdcae', sunRod: 34, stripes: 0.07, grain: 0.18 },
      front: WALL, back: { ...WALL, crowd: 0.35 },
    }), TM);
    const scene = new Scene();
    scene.add(hollow.group);
    yield 'yarrow: hollow';
    const pts = path.points(0.5);
    const low = pts.filter((q) => q.y < 120);
    yield* timed('poplars', standPoplars(hollow, low), TM);
    const U = { clock: { value: 0 } };
    yield* timed('kites', buildKites(scene, hollow.rig, rigs, U), TM);
    // inside the workshops: the light through the roof's glazing, and the bench lamps
    const inRig = hollowRig({ ...LIGHT, sunPower: 0.5, sunFarPower: 0.42, amb: '#bcc8d0', ambPower: 0.34, ground: '#ffd6a8', groundPower: 0.18, airDensity: 0 });
    yield* timed('workshops', buildWorkshops(hollow, inRig, rigs), TM);
    const hero = makeHero(scene, hollow, inRig);
    yield 'yarrow: the kite from the bench';
    let tr = performance.now(); const ring = makeRing(scene, hollow, path); TM.push('ring ' + Math.round(performance.now() - tr));
    yield 'yarrow: the Ring';
    const look = { exposure: 1.12, bloom: 0.2, threshold: 0.9, saturation: 1.1, contrast: 1.1, vignette: 0.38, lift: [0.0, 0.003, 0.008], gain: [0.98, 1.0, 1.03] };
    return {
      scene, path, hollow, near: 0.25, far: 9000, look,
      portal: { mist: '#e9f0f4', rim: false },
      update(t, dt, camera, engine) {
        // the kites' clock runs on through the crossing: while this world is only seen through the last one's opening,
        // it counts up to the moment of crossing
        const cur = engine && engine.cur;
        const clock = cur && cur.scene !== scene && t === 0 ? Math.min(cur.t - cur.tCross, 0) : t;
        U.clock.value = clock;
        hero(t); ring(clock);
      },
    };
  }
}
