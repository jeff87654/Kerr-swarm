// Gloaming, Weather Row: a painted dusk, seen from the auctioned seats of the end-wall terraces. Tonight's dusk is by
// Hesk, and he ends on green: forty minutes of it, the sunline going out through a cold sea-green while the far bank
// turns blue-black overhead, and then the lamps and the windows (docs/wander-year.md, Day 96; docs/open-drums.md,
// Culture, light-painting, and Kinds of open drum: a fair drum spends on light and spectacle and returns its rents;
// games/three-nights/src/15-canon.js, Gloaming: the palette "Hesk's green dusk", guests free on the lower terraces).
//
// The flight starts in a seat on the Third of the front wall, goes down the aisle past Hesk at his desk by the rail, out
// over the drop and down over a fairground in the gold and the white, along a long water mirror and low over a bowl of
// lawns full of people watching as the green comes, across the round basin, and up the second mirror as the lamps come
// up in order. When the line is gone the terraces roar and lift their lamps, and the flight ends along the guests'
// terrace on the back wall, beside them.
//
// Not canon (the docs say only "tiered end-wall terraces packed for the dusk, and long lawns below"):
//   - the plan: four long water mirrors laid along the axis, each running through a channel into a round basin at the
//     middle of the floor, in a bowl of lawns terraced down to the water where people sit to watch the end of the dusk
//     (Gloaming's dusks go out toward the middle); twenty fairgrounds, rings of tents in strong colours round a striped
//     pavilion inside a promenade of lamps, with avenues of lamps going out from them; beds of flowers in long stripes
//     beside the mirrors; lit promenades the length of the floor and rings of walks round it; gardens, woods, clumps,
//     wandering paths; woods in the Dim Ends with lit rides through them;
//   - the seats: raked rows of benches built on the Third of the front wall; on every other tier the seats are painted;
//   - Hesk's desk by the rail of the Third: a slanted board of coloured slides and keys under a hooded lamp, and the
//     people keeping back from him;
//   - the guests on the second tier of the back wall, four deep at the rail, every second one with a hand lamp; the hand
//     lamps along every lower terrace and in the bowls; the tents lit from inside after dark;
//   - the mirrors keeping a sea-green sheen after the land has gone dark (what they hold of the walls is turned green);
//   - Hesk's sequence before the green (a late gold, then a cold white), the line going out from both ends toward the
//     middle, and the order the lamps come up in after it: the far bank's first, then the promenades from the ends
//     inward as the line leaves them, the fairground rings, the windows tier by tier from the foot, the hand lamps along
//     every terrace, and last the lamps lifted in the bowls and on the terraces when the line is gone. The forty
//     minutes are pressed into one.
import {
  Scene, Color, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, Mesh, ShaderMaterial, Vector3, AdditiveBlending,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, TIERS, NT, TIER_H } from '../kit/hollow.js';
import { makePath, nearPath } from '../core/path.js';
import { Geo, instances } from '../kit/geo.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, litMaterial } from '../kit/mats.js';
import { scatterTrees } from '../kit/flora.js';
import { crowd, figureGeo, scatterPeople, CLOTH, SKIN } from '../kit/folk.js';
import { makeRng, smoothstep, hash2 } from '../core/rng.js';
import { DRUM } from '../kit/drum.js';

const SEAT_DEG = 90;                          // where round the front wall the camera's seats are
const X0 = (SEAT_DEG / 360) * C;              // the same, as flat x on the Hollow floor
const MIDZ = L / 2;                           // the middle of the floor, where the dusk goes out last
const wrapX = (x) => ((x % C) + C) % C;
const dX = (d) => ((d % C) + C * 1.5) % C - C / 2;   // the shortest way round from one x to another

// ---- the shape of the floor
const MX = [0, 1, 2, 3].map((k) => wrapX(X0 + 160 + (k * C) / 4));   // the four water mirrors, one a quarter of the way round from the next
const MW = 34;                                // half the width of a mirror's water
const MZ = [[820, 1580], [2170, 2930]];       // its two reaches, either side of the bowl
const BR = 96;                                // the basin's water
const B0 = 120, NSTEP = 12, SD = 12;          // the bowl of lawns: from B0 out, NSTEP terraces SD metres deep
const B1 = B0 + NSTEP * SD;                   // 264 m
const LANES = []; for (const m of MX) LANES.push(wrapX(m + C / 12), wrapX(m + C / 6));
const RINGS = [700, 1450, 2300, L - 700];
const FAIRS = (() => {
  const a = [], rng = makeRng('gloaming-fairs');
  for (let k = 0; k < 4; k++) {
    for (const s of [-1, 1]) for (const z of [1180, 2570]) a.push({ x: wrapX(MX[k] + s * 392 + rng.f(-30, 30)), z: z + rng.f(-40, 40), r: rng.f(120, 172), k: a.length });
    a.push({ x: wrapX(MX[k] + C / 8), z: MIDZ, r: 214, k: a.length, great: true });
  }
  return a;
})();
const TENTS = ['#c8352e', '#e3a22c', '#2f8f8a', '#3a4c9e', '#7e3a76', '#d9623a', '#e2cf6a'];
const FAIR_LAMPS = ['#ffd27a', '#ff9e6a', '#a8f0d4', '#ffe6c0', '#f7a8c8', '#c8d8ff'];
const FLOWERS = ['#d8a24a', '#c75a6a', '#efe4cc', '#7b5aa0', '#d77a4a', '#e8d27a', '#5a8fa8'];
const WOODS = ['#718c68', '#64826a'];
const WALK = '#d4cbad', WATER = '#4c8c96', DEEP = '#2a6476';

// near one of the big things painted on the floor (so woods and paths keep off them)
function busy(x, z, pad) {
  for (const m of MX) {
    const dx = Math.abs(dX(x - m));
    if (dx < 118 + pad && z > MZ[0][0] - 30 - pad && z < MZ[1][1] + 30 + pad) return true;
    if (Math.hypot(dx, z - MIDZ) < B1 + 22 + pad) return true;
  }
  for (const f of FAIRS) if (Math.hypot(dX(x - f.x), z - f.z) < f.r * 1.12 + pad) return true;
  for (const lx of LANES) if (Math.abs(dX(x - lx)) < 40 + pad) return true;
  for (const rz of RINGS) if (Math.abs(z - rz) < 34 + pad) return true;
  return false;
}
const circlePts = (cx, cz, r, n, a0 = 0, a1 = Math.PI * 2) => { const a = []; for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * (i / n); a.push([cx + Math.cos(t) * r, cz + Math.sin(t) * r]); } return a; };
function along(pts, spacing, fn) {
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let d = carry;
    while (d < len) { const t = d / len; fn(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, i + t); d += spacing; }
    carry = d - len;
  }
}

// ---- when the line has left a place: it goes out from both ends toward the middle between LINE0 and LINE1
const LINE0 = 32, LINE1 = 50, SHRINK = 0.92, HALF0 = MIDZ - DRUM.SUN0;
function goneAt(z) {
  const k = (1 - Math.abs(z - MIDZ) / HALF0) / SHRINK;
  if (k <= 0) return LINE0 - 1.5;
  if (k >= 1) return LINE1;
  let a = 0, b = 1;
  for (let i = 0; i < 18; i++) { const m = (a + b) / 2; if (m * m * (3 - 2 * m) < k) a = m; else b = m; }
  return LINE0 + (a + b) * 0.5 * (LINE1 - LINE0);
}
const SUN_ANGLE = X0 / DRUM.RH;
// how far round from the bright side a place is: 0 under the line's bright face, 1 on the far bank
const farness = (x) => (1 - Math.cos(x / DRUM.RH - SUN_ANGLE)) / 2;
const ROAR = 50.5;                            // the line is gone; the terraces roar

// ---- painting, cheaply. plan.fill() draws every shape three times (a turn each way, for the seam) and clears with a
// multiply, which is slow. Here each layer is drawn once, shapes that cross the seam are put in twice (seam()), and
// what must be cleared beneath is painted over in black on its own layer first (wipe: water, wood and lamps; wipeKind:
// paving, rows and people).
let SHIFT = null;
function seam(path, shape, x0, x1) {
  if (!SHIFT) SHIFT = { r: new DOMMatrix().translate(C, 0), l: new DOMMatrix().translate(-C, 0) };
  path.addPath(shape);
  if (x0 < 0) path.addPath(shape, SHIFT.r);
  if (x1 > C) path.addPath(shape, SHIFT.l);
  return path;
}
const rgbCh = (a, b, c) => `rgb(${Math.round(255 * Math.min(1, a || 0))},${Math.round(255 * Math.min(1, b || 0))},${Math.round(255 * Math.min(1, c || 0))})`;
let OPS = [];                                  // what painting asks for, gathered and handed to the plan in a few big steps
function paint(plan, path, o, width) {
  const q = (layer, fn) => OPS.push([layer, fn]);
  const draw = (cx, style) => {
    if (width) { cx.lineWidth = width; cx.lineCap = o.cap || 'round'; cx.lineJoin = 'round'; cx.strokeStyle = style; cx.stroke(path); }
    else if (typeof path === 'function') { cx.fillStyle = style; path(cx); }
    else { cx.fillStyle = style; cx.fill(path, o.rule || 'nonzero'); }
  };
  if (o.wipe) q('mask', (cx) => draw(cx, '#000'));
  if (o.wipeKind) q('kind', (cx) => draw(cx, '#000'));
  if (o.color) q('alb', (cx) => { if (o.alpha !== undefined) cx.globalAlpha = o.alpha; draw(cx, typeof o.color === 'function' ? o.color(cx) : o.color); });
  if (o.water || o.wood || o.lamp) q('mask', (cx) => { cx.globalCompositeOperation = 'lighter'; draw(cx, rgbCh(o.water, o.wood, o.lamp)); });
  if (o.paved || o.rows || o.life) q('kind', (cx) => { cx.globalCompositeOperation = 'lighter'; draw(cx, rgbCh(o.paved, o.rows, o.life)); });
}
// hand the plan what was gathered, a few calls to a step (each step of painting ends in a wait for the graphics card)
function commit(plan, per) {
  for (const layer of ['alb', 'mask', 'kind']) {
    const list = OPS.filter((o) => o[0] === layer).map((o) => o[1]);
    for (let i = 0; i < list.length; i += per) { const grp = list.slice(i, i + per); plan.once(layer, (cx) => { for (const fn of grp) { cx.save(); fn(cx); cx.restore(); } }); }
  }
  OPS = [];
}
// a fill of upright stripes, each `width` metres across, in the colours given, over and over round the floor
const stripes = (colors, width) => (cx) => {
  const c = document.createElement('canvas'); c.width = colors.length; c.height = 1;
  const k = c.getContext('2d'); colors.forEach((col, i) => { k.fillStyle = col; k.fillRect(i, 0, 1, 1); });
  const pat = cx.createPattern(c, 'repeat'); pat.setTransform(new DOMMatrix().scale(width, 1)); cx.imageSmoothingEnabled = false;
  return pat;
};
// shapes gathered by what they are painted with, so that each kind is one call however many shapes there are
const gather = () => { const m = new Map(); m.put = (key, shape, x0, x1) => { let p = m.get(key); if (!p) m.set(key, p = new Path2D()); seam(p, shape, x0, x1); return m; }; return m; };
const xs = (pts) => { let a = 1e9, b = -1e9; for (const q of pts) { if (q[0] < a) a = q[0]; if (q[0] > b) b = q[0]; } return [a, b]; };
// many small squares (lamps, crowns): drawn as plain rectangles, which the canvas does far faster than one path of thousands
const dots = (pts, r) => (cx) => { const d = 2 * r; for (const q of pts) { const x = q[0] - r, z = q[1] - r; cx.fillRect(x, z, d, d); if (q[0] < r) cx.fillRect(x + C, z, d, d); else if (q[0] > C - r) cx.fillRect(x - C, z, d, d); } };

/**
 * Paint Gloaming's floor. lamps: a list to fill with the lamps it paints, { x, z, color, when, kind } (they are painted
 * on the plan here, and stood up as timed lights by the world); tents: the same for the fairgrounds' tents.
 */
export function* paintGloaming(plan, lamps, tents) {
  const rng = makeRng('gloaming-plan');
  const lamp = (x, z, color, when, kind) => lamps.push({ x: wrapX(x), z, color, when, kind });
  OPS = [];
  OPS.push(['kind', (cx) => { cx.fillStyle = 'rgb(0,0,128)'; cx.fillRect(0, 0, C, L); }]);
  // long lawns round the floor, each mown its own shade, so the land overhead has a grain at the largest scale; and
  // soft patches over them
  const lawnA = gather();
  paint(plan, plan.rect(0, 640, C, L - 640), { color: stripes(['#b4ba90', '#9ba780', '#aab28a'], C / 48) });
  for (let i = 0; i < 46; i++) { const x = rng.f(0, C), z = rng.f(800, L - 800), r = rng.f(150, 320); lawnA.put((i % 2 ? 'rgba(190,186,146,0.32)' : 'rgba(138,158,116,0.3)'), plan.blob(x, z, r, r * rng.f(0.4, 0.8), { wobble: 0.3, seed: 500 + i, n: 24 }), x - r * 1.4, x + r * 1.4); }
  for (const [c, p] of lawnA) paint(plan, p, { color: c });
  // the Dim Ends under the walls: woods, with glades left out of them
  const dim = [new Path2D(), new Path2D()], glades = gather();
  dim[0].addPath(plan.rect(0, 0, C, 640)); dim[1].addPath(plan.rect(0, L - 640, C, L));
  for (let i = 0; i < 70; i++) {
    const gx = rng.f(150, C - 150), front = rng.chance(0.5), g = plan.blob(gx, front ? rng.f(420, 620) : rng.f(L - 620, L - 420), rng.f(30, 90), rng.f(20, 50), { seed: i + 3, n: 28 });
    dim[front ? 0 : 1].addPath(g); glades.put('#8a9c74', g, 1, 1);
  }
  for (const d of dim) paint(plan, d, { color: '#607e5c', wood: 0.9, rule: 'evenodd' });
  for (const [c, p] of glades) paint(plan, p, { color: c, life: 0.2 });
  // lit rides through the Dim Ends: the first lamps to come on, since the line never reaches them
  const rides = new Path2D();
  for (const zc of [470, 590, L - 590, L - 470]) {
    const pts = []; for (let i = 0; i <= 240; i++) pts.push([(i / 240) * C, zc + Math.sin(i * 0.41 + zc) * 34 + Math.sin(i * 0.11 + zc * 0.3) * 22]);
    rides.addPath(plan.line(pts));
    along(pts, 19, (x, z) => lamp(x, z, '#ffc27a', goneAt(z), 'lane'));
  }
  paint(plan, rides, { color: '#b4ad8e', paved: 0.6, wipe: true }, 5);
  yield 'plan: lawns';

  // woods and clumps, kept off everything else
  const woods = gather();
  for (let i = 0; i < 140; i++) {
    const x = rng.f(0, C), z = rng.f(720, L - 720), r = rng.f(40, 120);
    if (busy(x, z, r)) continue;
    woods.put(rng.pick(WOODS), plan.blob(x, z, r, r * rng.f(0.5, 0.9), { wobble: 0.35, lobes: 6, seed: 300 + i, n: 36 }), x - r * 1.4, x + r * 1.4);
  }
  for (let i = 0; i < 800; i++) {
    const x = rng.f(0, C), z = rng.f(700, L - 700), r = rng.f(8, 30);
    if (busy(x, z, r)) continue;
    woods.put(rng.pick(WOODS), plan.blob(x, z, r, r * rng.f(0.6, 1.1), { wobble: 0.3, lobes: 4, seed: i + 1, n: 12 }), x - r * 1.4, x + r * 1.4);
  }
  for (const [c, p] of woods) paint(plan, p, { color: c, wood: 1 });
  yield 'plan: woods';
  // wandering paths across the lawns between
  const wander = new Path2D();
  for (let i = 0; i < 70; i++) {
    let x = rng.f(0, C), z = rng.f(760, L - 760), a = rng.f(0, 6.28); const pts = [];
    for (let k = 0; k < 12; k++) { pts.push([x, z]); a += rng.f(-0.45, 0.45); x += Math.cos(a) * 34; z += Math.sin(a) * 34; }
    if (pts.some((q) => busy(q[0], q[1], 6))) continue;
    const [a0, a1] = xs(pts); seam(wander, plan.curve(pts), a0 - 3, a1 + 3);
  }
  paint(plan, wander, { color: '#cdc3a2' }, 3);
  yield 'plan: paths';

  yield* paintMirrors(plan, rng, lamp);
  yield* paintFairs(plan, rng, lamp, tents);
  // promenades the length of the floor, between the mirrors, under trees; and rings of walks round it, all lit
  const walks = gather(), lt = [];
  for (let i = 0; i < LANES.length; i++) {
    const x = LANES[i], pts = [];
    for (let k = 0; k <= 36; k++) { const z = 420 + (k / 36) * (L - 840); pts.push([x + Math.sin(k * 0.5 + i) * 18 + Math.sin(k * 0.19 + i * 2) * 34, z]); }
    const [a0, a1] = xs(pts); walks.put(8, plan.curve(pts), a0 - 30, a1 + 30);
    along(pts, 26, (px, pz) => lamp(px, pz, '#ffcf8c', goneAt(pz), 'lane'));
    aveDots(pts.filter((q) => q[1] > 700 && q[1] < L - 700), 10, 14, lt);
  }
  for (const rz of RINGS) {
    const pts = []; for (let i = 0; i <= 160; i++) pts.push([(i / 160) * C, rz + Math.sin(i * 0.33 + rz) * 22]);
    walks.put(8, plan.line(pts), 1, 1);
    along(pts, 24, (px, pz) => lamp(px, pz, '#ffd59a', goneAt(pz), 'lane'));
  }
  for (const [w, p] of walks) paint(plan, p, { color: WALK, paved: 0.85, life: 0.4, wipe: true }, w);
  paint(plan, dots(lt, 4), { color: WOODS[2], wood: 1 });
  yield 'plan: walks';
  // formal gardens beside the bowls: a hedge, gravel, four beds and a round one in the middle, all of them gathered
  const hedge = new Path2D(), gravel = new Path2D(), beds = gather(), GF = ['#d0a0a8', '#d8c48e', '#a99ab8'];
  for (const m of MX) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = m + sx * 300, z = MIDZ + sz * 330, w = 120, h = 86, x0 = x - w / 2, z0 = z - h / 2;
    seam(hedge, plan.rect(x0, z0, x0 + w, z0 + h), x0, x0 + w); seam(gravel, plan.rect(x0 + 3, z0 + 3, x0 + w - 3, z0 + h - 3), x0, x0 + w);
    for (const [qx, qz] of [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]]) {
      const cx = x0 + w * qx, cz = z0 + h * qz;
      beds.put(rng.pick(GF), plan.rect(cx - w * 0.19, cz - h * 0.19, cx + w * 0.19, cz + h * 0.19), x0, x0 + w);
      beds.put(rng.pick(GF), plan.rect(cx - w * 0.1, cz - h * 0.1, cx + w * 0.1, cz + h * 0.1), x0, x0 + w);
    }
    beds.put(rng.pick(GF), plan.rect(x - 8, z - 8, x + 8, z + 8), x0, x0 + w);
  }
  paint(plan, hedge, { color: '#4f6c4a' }); paint(plan, gravel, { color: WALK });
  for (const [c, p] of beds) paint(plan, p, { color: c });
  // every lamp on the floor, in one go (small squares: at 2.3 m a pixel a lamp is a pixel or two)
  for (const h of [0, 1]) paint(plan, dots(lamps.filter((q) => (q.x < C / 2) === !h).map((q) => [q.x, q.z]), 2), { lamp: 1 });
  for (const q of lamps) if (q.kind === 'lane' || q.kind === 'quay') plan.features.push({ type: 'lamp', x: q.x, z: q.z, h: 4.5 });
  commit(plan, 2);
  yield 'plan: gardens';
}

// trees down both sides of a line: the points of their crowns
function aveDots(pts, side, spacing, out) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 1e-6) continue;
    const nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len;
    for (let d = 0; d < len; d += spacing) { const t = d / len, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; out.push([x + nx * side, z + nz * side], [x - nx * side, z - nz * side]); }
  }
}
function annulus(cx, cz, r0, r1) { const p = new Path2D(); p.moveTo(cx + r1, cz); p.arc(cx, cz, r1, 0, Math.PI * 2, false); p.moveTo(cx + r0, cz); p.arc(cx, cz, r0, 0, Math.PI * 2, true); return p; }

// the water mirrors, their quays and flower beds, and the bowls of lawns round the basins at the middle of the floor
function* paintMirrors(plan, rng, lamp) {
  const quay = new Path2D(), water = new Path2D(), deep = new Path2D(), beds = new Path2D(), trees = [];
  const bowl = new Path2D(), stepA = new Path2D(), stepB = new Path2D(), aisles = new Path2D(), outer = new Path2D();
  const cause = new Path2D(), pave = new Path2D(), bridges = new Path2D();
  for (const m of MX) {
    const X = (shape, path, r) => seam(path, shape, m - r, m + r);
    for (const [z0, z1] of MZ) {
      X(plan.rect(m - MW - 20, z0 - 20, m + MW + 20, z1 + 20, 12), quay, 60);
      X(plan.rect(m - MW, z0, m + MW, z1, 5), water, 40);
      X(plan.rect(m - MW + 13, z0 + 34, m + MW - 13, z1 - 34, 5), deep, 40);
      for (const s of [-1, 1]) {
        const bx0 = m + s * (MW + 33), bx1 = m + s * (MW + 33 + 7 * 7.4); seam(beds, plan.rect(Math.min(bx0, bx1), z0 + 24, Math.max(bx0, bx1), z1 - 24), m - 130, m + 130);
        along([[m + s * (MW + 4), z0 - 14], [m + s * (MW + 4), z1 + 14]], 15, (x, z) => lamp(x, z, '#ffe2b0', goneAt(z), 'quay'));
      }
      aveDots([[m, z0 - 14], [m, z1 + 14]], MW + 27, 12, trees);
      for (const zb of [z0 + (z1 - z0) * 0.33, z0 + (z1 - z0) * 0.67]) X(plan.rect(m - MW - 2, zb - 4, m + MW + 2, zb + 4), bridges, 40);
    }
    // the bowl: lawns terraced down to the basin, aisles, a lit walk round the top
    const R = B1 + 24;
    X(plan.ellipse(m, MIDZ, B1 + 18, B1 + 18), bowl, R);
    for (let k = 0; k < NSTEP; k++) X(annulus(m, MIDZ, B0 + k * SD, B0 + (k + 1) * SD), k % 2 ? stepA : stepB, R);
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) * Math.PI / 4; X(plan.line([[m + Math.cos(a) * (B0 - 4), MIDZ + Math.sin(a) * (B0 - 4)], [m + Math.cos(a) * (B1 + 6), MIDZ + Math.sin(a) * (B1 + 6)]]), aisles, R); }
    for (const s of [-1, 1]) X(plan.line([[m + s * (B0 - 4), MIDZ], [m + s * (B1 + 6), MIDZ]]), aisles, R);
    X(plan.ellipse(m, MIDZ, B1 + 12, B1 + 12), outer, R);
    X(plan.rect(m - 24, MZ[0][1], m + 24, MZ[1][0]), cause, 30);
    X(plan.ellipse(m, MIDZ, BR + 16, BR + 16), pave, R);
    X(plan.ellipse(m, MIDZ, BR, BR), water, R);
    X(plan.rect(m - 9, MZ[0][1] - 2, m + 9, MZ[1][0] + 2), water, 30);
    X(plan.ellipse(m, MIDZ, BR * 0.72, BR * 0.72), deep, R);
    along(circlePts(m, MIDZ, BR + 7, 96), 7, (x, z) => lamp(x, z, '#fff0d0', ROAR + 0.2, 'basin'));
    along(circlePts(m, MIDZ, B1 + 16, 128), 12, (x, z, u) => lamp(x, z, '#ffd89a', goneAt(MIDZ - B1) + 1 + 2 * (u / 128), 'bowl'));
  }
  paint(plan, quay, { color: '#d8cfb2', paved: 0.8, life: 0.4 });
  paint(plan, beds, { color: stripes(FLOWERS, 7.4) });
  paint(plan, dots(trees, 4.2), { color: '#5f7e5a', wood: 1 });
  yield 'plan: mirrors';
  paint(plan, bowl, { color: '#a9b48a', life: 0.2 });
  paint(plan, stepA, { color: '#9eae82', life: 0.5 });
  paint(plan, stepB, { color: '#bcc498', life: 0.5 });
  paint(plan, aisles, { color: WALK, paved: 0.9, wipeKind: true }, 4.5);
  paint(plan, outer, { color: WALK, paved: 0.9, life: 0.3 }, 9);
  paint(plan, cause, { color: WALK, paved: 0.9 });
  paint(plan, pave, { color: '#ddd3b8', paved: 1 });
  paint(plan, water, { color: WATER, water: 1 });
  paint(plan, deep, { color: DEEP, alpha: 0.75 });
  paint(plan, bridges, { color: '#cfc4a6', paved: 1, wipe: true });
  yield 'plan: bowls';
}

// fairgrounds: a promenade ring of lamps, rings of tents in strong colours round a striped pavilion, avenues going out
function* paintFairs(plan, rng, lamp, tents) {
  const ground = new Path2D(), prom = new Path2D(), inner = new Path2D(), spokes = new Path2D(), under = new Path2D();
  const tentP = gather(), trees = [];
  const nearBig = (x, z, self) => {
    for (const m of MX) { const dx = Math.abs(dX(x - m)); if ((dx < 130 && z > MZ[0][0] - 40 && z < MZ[1][1] + 40) || Math.hypot(dx, z - MIDZ) < B1 + 40) return true; }
    for (const f of FAIRS) if (f !== self && Math.hypot(dX(x - f.x), z - f.z) < f.r + 30) return true;
    return z < 680 || z > L - 680;
  };
  let t0 = performance.now();
  for (const f of FAIRS) {
    const { x, z, r } = f, frng = makeRng('fair' + f.k), X = (shape, path, rr) => seam(path, shape, x - rr, x + rr);
    X(plan.ellipse(x, z, r * 1.06, r * 1.06), ground, r * 1.1);
    X(plan.ellipse(x, z, r, r), prom, r + 8);
    X(plan.ellipse(x, z, r * 0.55, r * 0.55), inner, r);
    const lc = FAIR_LAMPS[f.k % FAIR_LAMPS.length], base = goneAt(z) + 2.5;
    along(circlePts(x, z, r, 120), 9, (px, pz, u) => lamp(px, pz, lc, base + 2.6 * (u / 120), 'ring'));
    along(circlePts(x, z, r * 0.55, 80), 11, (px, pz, u) => lamp(px, pz, lc, base + 1.4 + 2.6 * (u / 80), 'ring'));
    const ns = f.great ? 12 : 8, a0 = frng.f(0, 1), len = f.great ? 280 : 190, spokeA = [];
    for (let i = 0; i < ns; i++) {
      const a = a0 + (i / ns) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const p0 = [x + c * r, z + s * r], p1 = [x + c * (r + len), z + s * (r + len)];
      if ([0.35, 0.7, 1].some((u) => nearBig(x + c * (r + len * u), z + s * (r + len * u), f))) continue;
      X(plan.line([p0, p1]), spokes, r + len + 10); spokeA.push(a);
      along([p0, p1], 13, (px, pz, u) => lamp(px, pz, lc, base + 2.8 + 1.8 * u, 'ring'));
      aveDots([p0, p1], 8, 13, trees);
    }
    // tents in rings between the paths, in the fair's three colours and white (squares: at this scale a tent is a few pixels)
    const scheme = [TENTS[f.k % 7], TENTS[(f.k * 3 + 2) % 7], TENTS[(f.k * 5 + 4) % 7], '#efe6d2'];
    const rings = f.great ? [[0.33, 6.5], [0.45, 5], [0.7, 8], [0.85, 6]] : [[0.36, 5.5], [0.72, 7.2], [0.87, 5]];
    for (const [rr, tr] of rings) {
      const R = r * rr, n = Math.floor((Math.PI * 2 * R) / (tr * 2 + 5));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rr, tx = x + Math.cos(a) * R, tz = z + Math.sin(a) * R, t = tr * frng.f(0.8, 1.15);
        if (rr > 0.6 && spokeA.some((sa) => Math.abs(dX((a - sa) * R)) < t + 5)) continue;
        const c = scheme[(i + (rr > 0.6 ? 1 : 0)) % (rr > 0.6 ? 4 : 3)], s = plan.rect(tx - t * 0.85, tz - t * 0.85, tx + t * 0.85, tz + t * 0.85);
        tentP.put(c, s, tx - t, tx + t); seam(under, s, tx - t, tx + t);
        tents.push({ x: wrapX(tx), z: tz, r: t, color: c, fair: f.k });
      }
    }
    const pr = f.great ? 40 : r * 0.19, nw = 16;
    for (let i = 0; i < nw; i++) {
      const a = (i / nw) * Math.PI * 2, b = ((i + 1) / nw) * Math.PI * 2, p = new Path2D();
      p.moveTo(x, z); p.arc(x, z, pr, a, b); p.closePath(); tentP.put(i % 2 ? scheme[0] : '#efe6d2', p, x - pr, x + pr); seam(under, p, x - pr, x + pr);
    }
    tents.push({ x: wrapX(x), z, r: pr, color: scheme[0], top: true, fair: f.k });
    if (performance.now() - t0 > 12) { yield 'plan: fairs'; t0 = performance.now(); }
  }
  paint(plan, ground, { color: '#c6bf98', life: 0.4 });
  paint(plan, spokes, { color: WALK, paved: 0.85 }, 7);
  paint(plan, dots(trees, 4), { color: '#62825c', wood: 1 });
  paint(plan, prom, { color: WALK, paved: 0.9, life: 0.5 }, 10);
  paint(plan, inner, { color: WALK, paved: 0.9, life: 0.5 }, 5);
  yield 'plan: fairgrounds';
  paint(plan, under, { wipeKind: true });
  for (const [c, p] of tentP) paint(plan, p, { color: c });
  yield 'plan: tents';
}
// ---------------------------------------------------------------- lamps that come on in their own time
// The kit's glowPoints, with each light given the moment it comes on (it flares a little, then settles) and, for hand
// lamps, the moment it is lifted and how far. One draw call for any number; uT is the flight's clock.
const TL_VERT = /* glsl */`
attribute vec3 aPos;      // where (flat)
attribute vec4 aColSize;  // rgb x strength, size in metres
attribute vec4 aWhen;     // when it comes on, seconds it takes, when it is lifted, how far (metres; 0 = a fixed lamp)
${BEND_PARS}
uniform float uT, uTime, uPx, uMinPx, uMaxPx, uPower, uFall; uniform vec2 uRes;
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  float on = smoothstep(aWhen.x, aWhen.x + aWhen.y, uT);
  vQ = position.xy; vC = vec3(0.0); vW = vec3(0.0);
  if (on <= 0.0) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
  float held = step(0.001, abs(aWhen.w));
  float lift = held * smoothstep(aWhen.z, aWhen.z + 1.4, uT);
  vec3 p = aPos; p.y += aWhen.w * lift;
  vec3 n = vec3(0.0, 1.0, 0.0);
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vec4 mv = viewMatrix * wp;
  float dist = max(-mv.z, 0.01);
  float px = aColSize.w * uPx / dist;
  float shown = clamp(px, uMinPx, uMaxPx);
  float k = min(pow(px / shown, uFall), 1.0);
  float pop = 1.0 + 1.3 * on * (1.0 - smoothstep(0.0, 1.8, uT - aWhen.x - aWhen.y));
  float hand = mix(1.0, (0.88 + 0.12 * sin(uTime * 2.7 + aPos.x * 3.1 + aPos.z * 1.7)) * (1.0 + 0.7 * lift), held);
  vC = aColSize.rgb * k * on * pop * hand * uPower;
  vec4 clip = projectionMatrix * mv;
  clip.xy += position.xy * shown / uRes * clip.w * 2.0;
  gl_Position = clip;
}`;
const TL_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uSoft;
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  ${CLIP_FRAG}
  float r = length(vQ) * 2.0;
  float a = pow(max(1.0 - r, 0.0), uSoft);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;
// a growing list of timed lights, kept as the arrays the shader reads
function lightList() {
  let cap = 4096, n = 0, P = new Float32Array(cap * 3), CS = new Float32Array(cap * 4), W = new Float32Array(cap * 4);
  const cache = new Map(), c = new Color();
  const grow = () => { cap *= 2; const p = new Float32Array(cap * 3), q = new Float32Array(cap * 4), w = new Float32Array(cap * 4); p.set(P); q.set(CS); w.set(W); P = p; CS = q; W = w; };
  return {
    get n() { return n; },
    /** a light at flat (x, y, z): colour, power, size (m), when it comes on, seconds it takes, when it is lifted, how far */
    add(x, y, z, color, power, size, when, ramp = 0.8, liftAt = 0, lift = 0) {
      if (n === cap) grow();
      let k = cache.get(color); if (!k) { c.set(color); k = [c.r, c.g, c.b]; cache.set(color, k); }
      P[n * 3] = x; P[n * 3 + 1] = y; P[n * 3 + 2] = z;
      CS[n * 4] = k[0] * power; CS[n * 4 + 1] = k[1] * power; CS[n * 4 + 2] = k[2] * power; CS[n * 4 + 3] = size;
      W[n * 4] = when; W[n * 4 + 1] = ramp; W[n * 4 + 2] = liftAt; W[n * 4 + 3] = lift;
      n++;
    },
    arrays() { return [P.slice(0, n * 3), CS.slice(0, n * 4), W.slice(0, n * 4), n]; },
  };
}
/** list: a lightList(). opts: minPx, maxPx, soft, fall (how a light too small to fill its disc dims: 2 = by its area, 1 = less) */
function timedLights(list, frame, opts = {}) {
  const [aPos, aCS, aW, n] = list.arrays(), g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aPos', new InstancedBufferAttribute(aPos, 3));
  g.setAttribute('aColSize', new InstancedBufferAttribute(aCS, 4));
  g.setAttribute('aWhen', new InstancedBufferAttribute(aW, 4));
  g.instanceCount = n;
  const m = new ShaderMaterial({
    uniforms: {
      uClip: G.uClip, uTime: G.uTime, uPx: G.uPx, uRes: G.uRes, uT: { value: 0 },
      uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) },
      uMinPx: { value: opts.minPx || 1.2 }, uMaxPx: { value: opts.maxPx || 60 }, uSoft: { value: opts.soft || 1.6 }, uPower: { value: 1 }, uFall: { value: opts.fall || 2 },
    },
    vertexShader: TL_VERT, fragmentShader: TL_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const mesh = new Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  return mesh;
}

// ---------------------------------------------------------------- things to stand up
// A seated figure for the far rows: two boxes, no face (it is seen from behind or from far off).
function farSitter() {
  const g = new Geo();
  g.tint(1).box(-0.2, 0.0, -0.13, 0.2, 0.66, 0.13, '#ffffff', { skip: 'b' });
  g.tint(0).box(-0.11, 0.7, -0.1, 0.11, 0.95, 0.11, '#c99a72', { skip: 'b' });
  return g.build();
}
// A standing figure for the far end of a crowd: a body and a head.
function farStander() {
  const g = new Geo();
  g.tint(1).box(-0.2, 0.0, -0.12, 0.2, 1.42, 0.12, '#ffffff', { skip: 'b' });
  g.tint(0).box(-0.1, 1.44, -0.1, 0.1, 1.68, 0.1, '#b48a66', { skip: 'b' });
  return g.build();
}
// A tent of unit radius: a wall and a cone roof in sixteen gores, every other one the instance's colour and the rest
// white, a ball on the pole. Lit from inside at night (the material's emit is turned up).
function tentGeo(wall = 0.42, roof = 0.56) {
  const g = new Geo(), n = 16;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    g.tint(i % 2 ? 1 : 0);
    const col = i % 2 ? '#ffffff' : '#f2ebdc';
    g.quad([c1, 0, s1], [c0, 0, s0], [c0, wall, s0], [c1, wall, s1], col, 0.9);
    g.tri([c1 * 1.04, wall - 0.02, s1 * 1.04], [c0 * 1.04, wall - 0.02, s0 * 1.04], [0, wall + roof, 0], col, 0.45);
  }
  g.tint(0).blob(0, wall + roof + 0.03, 0, 0.04, 0, '#f4e6b0', { emit: 1 });
  return g.build();
}
// Hesk's desk, in the frame of the Third: its board slopes up toward the rail (+z), rows of coloured slides set in it
// lit from below, a row of keys along its near edge, and a hooded lamp on a stalk bent over it.
const SLIDES = ['#ffc480', '#ffd8a0', '#fff0dc', '#f2fff8', '#c8f0e0', '#8fd8bc', '#6fc9a8', '#45a088', '#1f5a52', '#0c1a1c', '#2a3a5a', '#e8a880'];
function heskDesk(g, x, z) {
  g.at(x, 0.04, z, 0);
  for (const [lx, lz] of [[-0.66, -0.28], [0.66, -0.28], [-0.66, 0.28], [0.66, 0.28]]) g.box(lx - 0.03, 0, lz - 0.03, lx + 0.03, 0.84, lz + 0.03, '#3a2e26', { skip: 'b' });
  g.box(-0.72, 0.84, -0.32, 0.72, 0.9, 0.32, '#4a3a2e');
  g.box(-0.62, 0.3, -0.26, 0.62, 0.33, 0.26, '#4a3a2e', { skip: 'b' });                 // a shelf below, with cases on it
  g.box(-0.5, 0.33, -0.2, -0.1, 0.45, 0.18, '#6a3a2c'); g.box(0.05, 0.33, -0.18, 0.45, 0.5, 0.2, '#2e4a48');
  g.at(0, 0.97, 0); g.rot('x', -0.32);
  g.box(-0.68, -0.05, -0.3, 0.68, 0.0, 0.3, '#1e2226');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
    const sx = -0.6 + c * 0.1, sz = -0.04 + r * 0.075;
    g.box(sx, 0.0, sz, sx + 0.075, 0.012, sz + 0.055, SLIDES[(c + r * 5) % SLIDES.length], { emit: 2.4 - r * 0.3 });
  }
  for (let c = 0; c < 16; c++) g.box(-0.6 + c * 0.075, 0.0, -0.24, -0.6 + c * 0.075 + 0.06, 0.02, -0.14, '#e8e0cc', { emit: 0.25 });
  g.pop(); g.pop(); g.pop();
  g.at(x, 0.04, z, 0);
  g.cyl(0.62, 0.9, 0.24, 0.016, 0.016, 0.62, 5, '#2a2a2c');
  g.tube([[0.62, 1.5, 0.24], [0.52, 1.66, 0.12], [0.36, 1.68, 0.02]], 0.014, 4, '#2a2a2c');
  g.cyl(0.36, 1.52, 0.02, 0.15, 0.05, 0.16, 8, '#2c3e3a', { smooth: false });       // the hood, its mouth down at the board
  g.cyl(0.36, 1.515, 0.02, 0.11, 0.11, 0.012, 8, '#fff2d8', { emit: 6 });
  g.pop();
}
// ---------------------------------------------------------------- the dusk
// Hesk's sequence, pressed into a minute: [t, sun, sun power, far bank, its power, glow, its power, rod, sharpness, lamps]
const SEQ = [
  [0, '#ffc480', 0.75, '#ffb478', 0.55, '#9a8070', 0.2, 30, 1.0, 0.0],
  [9, '#ffcf98', 0.72, '#e8a880', 0.45, '#8c7c74', 0.22, 30, 1.2, 0.0],
  [17, '#f2fff8', 0.6, '#a0a8c0', 0.22, '#6c8078', 0.24, 32, 1.8, 0.0],
  [25, '#6fc9a8', 0.9, '#2a3a5a', 0.06, '#2f5a5c', 0.4, 30, 2.6, 0.15],
  [33, '#55b090', 0.56, '#141c34', 0.015, '#22405a', 0.7, 26, 3.0, 0.4],
  [41, '#2a7a68', 0.3, '#0a0f1e', 0.0, '#1c3058', 1.1, 20, 3.0, 0.8],
  [47, '#1f5a52', 0.1, '#0a0f1e', 0.0, '#1a2c5c', 1.5, 9, 3.0, 1.0],
  [52, '#0c1a1c', 0.02, '#0a0f1e', 0.0, '#1c2e60', 1.9, 0.5, 3.0, 1.0],
  [70, '#0c1a1c', 0.0, '#0a0f1e', 0.0, '#1c2e60', 2.0, 0, 3.0, 1.0],
];
const SEQC = SEQ.map((k) => [new Color(k[1]), new Color(k[3]), new Color(k[5])]);
const HAND = ['#ffc070', '#ffd49a', '#ffb060', '#ffe2b8', '#ffd49a', '#a8f0d4'];

export const gloamingDusk = {
  id: 'gloaming-dusk',
  title: 'Hesk ends on green', drum: 'Gloaming', row: 'Weather Row', kind: 'a fair drum', light: 28.0,
  line: 'Hesk ended on green. Forty minutes of it, the sunline going out through a cold sea-green, and the terraces silent until it was gone. Then they roared.',
  tone: '#6fc9a8', source: 'wander-year.md (Day 96), open-drums.md (Culture)',
  sound: { root: 43, scale: 'aeolian', pad: 0.55, air: 0.25, crowd: 0.35, bells: 0.12, bright: 0.3, hum: 0.15 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    const lamps = [], tents = [];
    yield 'plan made';
    yield* paintGloaming(plan, lamps, tents);
    const tiers = {};
    for (let i = 0; i < NT; i++) tiers[i] = i < 23 ? { crowd: 1, garden: 0.25 } : { crowd: 0.7, garden: 0.8 };
    const wall = {
      lit: 0.0, crowd: 0.95, garden: 0.4, houseMix: 0.4, winA: '#ffb060', winB: '#ffe0b0', winPower: 2.0,
      stone: '#e4dccc', stone2: '#d6c6aa', houses: ['#d9c2a0', '#c9b49a', '#b4c4b8', '#e0d2ae', '#a9bcc4', '#d4b09c'], tiers,
    };
    const hollow = yield* buildHollow(ctx, {
      seed: 'gloaming', plan, pavilions: false,
      light: { sun: SEQ[0][1], sunPower: SEQ[0][2], sunFar: SEQ[0][3], sunFarPower: SEQ[0][4], sunAngle: SUN_ANGLE, amb: SEQ[0][5], ambPower: SEQ[0][6], ground: '#ffb468', groundPower: 0, air: '#d8d6d0' },
      sunline: { power: 30, keep: true },
      ground: { lamp: 0, lampColor: '#ffc68a', lampFollowsSun: true, people: 0.9, sunRod: 30, wave: 0.01, stripes: 0.07, canopy: '#6a8a5e' },
      front: wall, back: { ...wall },
    });
    yield 'hollow';
    const scene = new Scene();
    scene.add(hollow.group);
    const rng = makeRng('gloaming-seats');

    // ---- the seats: raked rows of benches on the Third of the front wall, every seat sold and taken
    const T = hollow.terrace(0, TIERS.third, SEAT_DEG);
    const NR = 14, RUN = 0.9, RISE = 0.36, Z0 = 3.4, XS = 224, AISLE = 28, AW = 1.25;
    const rowZ = (k) => -(Z0 + k * RUN);          // front edge of row k (the rail is z = 0, the houses at z = -depth)
    const rowH = (k) => (k + 1) * RISE;
    const inAisle = (x) => Math.abs(x - Math.round(x / AISLE) * AISLE) < AW;
    const HX = -3.3, HZ = -1.55;                   // Hesk's desk, on the walk by the rail beside the camera's aisle
    const g = new Geo({ maxSeg: 16 });
    for (let k = 0; k < NR; k++) {
      const z0 = rowZ(k), z1 = rowZ(k + 1), y = rowH(k), yb = k ? rowH(k - 1) : 0;
      g.floor(-XS, z1, XS, z0, y, k % 2 ? '#d2c8b6' : '#dad0bd');
      g.quad([-XS, yb, z0], [XS, yb, z0], [XS, y, z0], [-XS, y, z0], '#b0a590');
      for (const s of [-1, 1]) { const x = s * XS; if (s > 0) g.quad([x, 0, z0], [x, 0, z1], [x, y, z1], [x, y, z0], '#b8ad98'); else g.quad([x, 0, z1], [x, 0, z0], [x, y, z0], [x, y, z1], '#b8ad98'); }
      for (let a = -XS; a < XS; a += AISLE) {
        const xa = Math.max(-XS, a + AW), xb = Math.min(XS, a + AISLE - AW);
        g.box(xa, y + 0.36, z0 - 0.62, xb, y + 0.44, z0 - 0.16, '#8a6a50', { skip: 'b' });
        g.box(xa, y, z0 - 0.5, xb, y + 0.36, z0 - 0.42, '#6e5440', { skip: 'bt' });
      }
      if (k % 3 === 2) yield 'seats';
    }
    g.quad([XS, 0, rowZ(NR)], [-XS, 0, rowZ(NR)], [-XS, rowH(NR - 1), rowZ(NR)], [XS, rowH(NR - 1), rowZ(NR)], '#b8ad98');
    g.floor(-XS, rowZ(0), XS, 0.34, 0.03, '#d8cfbc');                                          // the walk along the rail
    g.box(-XS, 0, 0.02, XS, 0.16, 0.3, '#cfc5b2', { skip: 'b' });
    g.box(-XS, 0.98, 0.02, XS, 1.08, 0.3, '#ddd3c2', { skip: 'b', top: '#efe7d8' });
    for (let x = -XS; x <= XS; x += 1.6) g.box(x - 0.05, 0.16, 0.11, x + 0.05, 0.98, 0.21, '#c4baa6', { skip: 'bt' });
    heskDesk(g, HX, HZ);
    T.add(g.mesh(T.lit, T.frame));
    yield 'seats: built';
    // the people in them: whole figures near the camera, simpler ones farther along
    const near = new Map(), far = [], NEAR = 64;
    for (let k = 0; k < NR; k++) {
      for (let x = -XS + 0.4; x < XS - 0.3; x += 0.6 + rng.f(-0.04, 0.06)) {
        if (inAisle(x) || rng.chance(0.04)) continue;
        const p = [x + rng.f(-0.06, 0.06), rowH(k) + 0.44, rowZ(k) - 0.4], yaw = rng.f(-0.25, 0.25), color = rng.pick(CLOTH);
        if (Math.abs(x) < NEAR) { const skin = rng.pick(SKIN); let a = near.get(skin); if (!a) near.set(skin, a = []); a.push({ p, yaw, color, scale: rng.f(0.94, 1.06) }); }
        else far.push({ p, yaw, color, scale: [rng.f(0.9, 1.1), rng.f(0.9, 1.08), 1] });
      }
      if (k % 4 === 3) yield 'seat people';
    }
    const seated = [];
    for (const [skin, list] of near) seated.push(...instances(figureGeo(skin, 'sit'), T.lit, list, { frame: T.frame, cell: 140 }));
    yield 'seat people: near';
    seated.push(...instances(farSitter(), T.lit, far, { frame: T.frame, cell: 160 }));
    // late-comers along the walk by the rail; by Hesk's desk only Hesk, and a few keeping back from him
    const spots = [{ p: [HX, 0.04, HZ - 0.72], yaw: 0, color: '#2c3a3c', skin: SKIN[1] }];
    for (const [dx, dz] of [[-3.6, -1.2], [-4.4, -2.3], [-5.1, -0.9], [3.4, -2.6], [4.1, -1.3], [-6.2, -2.0], [2.6, -0.8]]) {
      const x = HX + dx, z = dz;
      spots.push({ p: [x, 0.04, z], yaw: Math.atan2(HX - x, HZ - z) + rng.f(-0.3, 0.3), walk: 0 });
    }
    for (let x = -XS; x < XS; x += rng.f(2.2, 6)) {
      if (Math.abs(x - HX) < 11) continue;
      spots.push({ p: [x, 0.03, -rng.f(0.7, 2.8)], walk: rng.chance(0.6) ? rng.f(1, 6) : 0, yaw: rng.f(-0.6, 0.6) + (rng.chance(0.5) ? 0 : Math.PI) });
    }
    seated.push(...crowd(spots, T.walk, { frame: T.frame, seed: 'gloaming-rail', bob: 0.25 }));
    T.add(seated);
    T.glow([{ p: [HX + 0.36, 1.5, HZ + 0.02], color: '#fff0d0', power: 5, size: 0.28 }], { maxPx: 40 });
    yield 'seat people: made';

    // ---- the flight. Down the aisle past Hesk and out over the rail; down over a fairground in the gold, along the
    // first mirror in the white, low over the bowl's watchers as the green comes and across the basin; up the second
    // mirror as the lamps come up; and in to the guests' terrace on the back wall as it roars, to run along it.
    const GX = X0 + 420;                           // where round the back wall the flight meets the guests
    const T2 = hollow.terrace(1, 2, (GX / C) * 360);
    const toHollow = (F) => (x, y, z) => { const v = hollow.frame.local(F.frame.point(x, y, z)); return [v.x, v.y, v.z]; };
    const tf = toHollow(T), tf2 = toHollow(T2);
    const path = makePath([
      { t: 0, p: tf(0, rowH(7) + 1.95, rowZ(7) - 0.5) },
      { t: 5, p: tf(-0.3, 3.3, -3.0), look: tf(-150, -100, 75) },
      { t: 9, p: tf(-0.6, 3.4, 1.5), look: [X0 - 10, 455, 700] },
      { t: 14, p: tf(-2, 5, 42), look: [X0 - 110, 0, 1100] },
      { t: 21, p: [X0 - 60, 190, 780], look: [X0 - 232, 0, 1180] },
      { t: 26, p: [X0 - 140, 62, 1080], look: [X0 - 40, 8, 1300] },
      { t: 30, p: [X0 + 125, 100, 1330], look: [X0 + 165, 0, 1640] },
      { t: 34, p: [X0 + 158, 80, 1690], look: [X0 + 160, 0, 1880] },
      { t: 39, p: [X0 + 168, 112, 2150], look: [X0 + 185, 40, 2850] },
      { t: 44, p: [X0 + 60, 150, 2900], look: [X0 + 250, 60, 3350] },
      { t: 49, p: tf2(-300, 25, -60), look: tf2(-120, 3, -4) },
      { t: 52, p: tf2(-200, 8, -12), look: tf2(-60, 2, -3) },
      { t: 55, p: tf2(-110, 3, -6), look: tf2(-50, 1.8, -3) },
      { t: 62, p: tf2(0, 3, -6) },
    ], { frame: hollow.frame, entryRadius: 1.2, exitRadius: 3 });
    yield 'path';
    const pts = path.points(0.5), low = pts.filter((q) => q.y < 260 && q.z > 520 && q.z < L - 520), thin = low.filter((_, i) => i % 3 === 0);

    // ---- near the flight: trees, people on the lawns and quays, lamp posts, the fairground's tents standing up
    const lod = [];
    const trees = yield* scatterTrees(hollow, { near: low, radius: 125, max: 3200 * ctx.density, wood: [{ kind: 'round', weight: 3 }, { kind: 'poplar', weight: 1 }, { kind: 'birch', weight: 1, tint: [1.2, 1.15, 0.9] }] });
    for (const m of trees) lod.push([m, 700]);
    const folk = yield* scatterPeople(hollow, { near: low.filter((q) => q.y < 120), radius: 150, density: 1.1 * ctx.density, max: 2600 });
    for (const m of folk) lod.push([m, 450]);
    yield 'people: made';
    for (const m of hollow.lampPosts({ near: low.filter((_, i) => i % 3 === 0), radius: 170 })) lod.push([m, 600]);
    yield 'near the flight';
    const tentMat = litMaterial(hollow.rig, { bend: hollow.frame, emit: 0 });
    const tItems = [], topItems = [];
    for (const q of tents) {
      if (nearPath(thin, q.x, q.z, C) > 460) continue;
      (q.top ? topItems : tItems).push({ p: [q.x, 0, q.z], yaw: hash2(Math.round(q.x), Math.round(q.z), 3) * 6.28, scale: q.top ? [q.r, q.r * 0.6, q.r] : q.r, color: q.color });
    }
    for (const m of hollow.add(instances(tentGeo(), tentMat, tItems, { frame: hollow.frame, cell: 500 }))) lod.push([m, 1600]);
    for (const m of hollow.add(instances(tentGeo(0.36, 0.62), tentMat, topItems, { frame: hollow.frame, cell: 500 }))) lod.push([m, 1600]);
    yield 'tents';

    // ---- the bowl the flight crosses: people sitting on its terraces facing the water, whole near the flight
    const bx = MX[0], brng = makeRng('gloaming-bowl'), wSpots = [], wFar = [];
    const aisleA = []; for (let i = 0; i < 8; i++) aisleA.push((i + 0.5) * Math.PI / 4); aisleA.push(0, Math.PI);
    let tw = performance.now();
    for (let k = 0; k < NSTEP; k++) {
      for (const rr of [B0 + k * SD + 3.2, B0 + k * SD + 7.8]) {
        const n = Math.floor((Math.PI * 2 * rr) / 1.15);
        for (let i = 0; i < n; i++) {
          if (!brng.chance(0.55)) continue;
          const a = (i / n) * Math.PI * 2, x = bx + Math.cos(a) * rr, z = MIDZ + Math.sin(a) * rr;
          if (Math.abs(x - bx) < 27 || aisleA.some((b) => Math.abs(dX((a - b) * rr)) < 3.2)) continue;
          const d = nearPath(thin, x, z, C);
          if (d > 170) continue;
          const yaw = Math.atan2(bx - x, MIDZ - z) + brng.f(-0.3, 0.3);
          if (d < 80 && wSpots.length < 1800) wSpots.push({ p: [x, 0, z], sit: true, yaw, child: brng.chance(0.1) });
          else wFar.push({ p: [x, 0, z], yaw, color: brng.pick(CLOTH), scale: [brng.f(0.9, 1.1), brng.f(0.9, 1.1), 1] });
        }
      }
      if (performance.now() - tw > 12) { yield 'watchers: placing'; tw = performance.now(); }
    }
    for (const m of hollow.add(crowd(wSpots, hollow.walk, { frame: hollow.frame, seed: 'gloaming-bowl', cell: 200 }))) lod.push([m, 1100]);
    yield 'watchers: near';
    for (const m of hollow.add(instances(farSitter(), hollow.lit, wFar, { frame: hollow.frame, cell: 200 }))) lod.push([m, 1100]);
    yield 'watchers';

    // ---- the guests' terrace on the back wall: a crowd four deep along the rail, facing the Hollow, each second one
    // with a hand lamp, lit as the windows come on and lifted when the line is gone
    const grng = makeRng('gloaming-guests'), gSpots = [], gFar = [], gLamps = lightList();
    for (let x = -200; x < 560; x += 0.68 + grng.f(-0.06, 0.1)) for (let j = 0; j < 4; j++) {
      if (!grng.chance(0.86)) continue;
      const z = 0.75 + j * 0.8 + grng.f(-0.15, 0.15), xx = x + grng.f(-0.12, 0.12), yaw = Math.PI + grng.f(-0.4, 0.4);
      if (xx > -60 && xx < 160) gSpots.push({ p: [xx, 0.04, z], yaw, walk: 0, child: grng.chance(0.08) });
      else gFar.push({ p: [xx, 0.04, z], yaw, color: grng.pick(CLOTH), scale: [grng.f(0.9, 1.1), grng.f(0.92, 1.08), 1] });
      if (grng.chance(0.5)) gLamps.add(xx + 0.18, 1.12, z - 0.32, grng.pick(HAND), grng.f(5, 8), 0.32, 45.5 + grng.f(0, 2.5), 0.5, ROAR + 0.1 + grng.f(0, 0.9) + Math.abs(x - 40) * 0.0015, grng.f(0.75, 1.05));
    }
    const guests = [...crowd(gSpots, T2.walk, { frame: T2.frame, seed: 'gloaming-guests', cell: 120 })];
    yield 'guests: near';
    guests.push(...instances(farStander(), T2.lit, gFar, { frame: T2.frame, cell: 160 }));
    T2.add(guests);
    const guestLamps = timedLights(gLamps, T2.frame, { maxPx: 30 });
    hollow.add(guestLamps);
    yield 'guests';

    // ---- the lamps, in the order they come up
    // on the floor: the far bank's first (its light went first), then the promenades and quays as the line leaves them,
    // the fairground rings chasing round, the bowls' rims; the basins' rings when the line is gone
    const lrng = makeRng('gloaming-lamps'), floor = lightList(), hands = lightList();
    const LOOK = { lane: [6, 1.3], quay: [6, 1.2], ring: [9, 1.9], bowl: [8, 1.6], basin: [11, 1.8] };
    for (const q of lamps) {
      const f = farness(q.x), [power, size] = LOOK[q.kind];
      let when = q.when;
      if (q.kind !== 'basin' && q.kind !== 'bowl') when = Math.max(23.5 + lrng.f(0, 2.5), when - 11 * f * f);
      floor.add(q.x, q.kind === 'ring' ? 5.2 : 4.6, q.z, q.color, power, size, when + lrng.f(0, 0.7), 0.7);
    }
    const floorLamps = timedLights(floor, hollow.frame, { maxPx: 50, fall: 1 });
    hollow.add(floorLamps);
    yield 'lamps: floor';
    // in the bowls, when the line is gone: every watcher's lamp at once, from the water outward, and lifted
    for (const m of MX) for (let i = 0; i < Math.round(3000 * ctx.density); i++) {
      const r = lrng.f(B0 + 2, B1 - 2), a = lrng.f(0, Math.PI * 2), x = m + Math.cos(a) * r, z = MIDZ + Math.sin(a) * r;
      if (Math.abs(dX(x - m)) < 27) continue;
      hands.add(wrapX(x), 0.95, z, lrng.pick(HAND), lrng.f(6, 10), 1.0, ROAR - 0.4 + ((r - B0) / (B1 - B0)) * 1.1 + lrng.f(0, 0.4), 0.4, ROAR + 0.8 + lrng.f(0, 0.8), 0.9);
    }
    yield 'lamps: bowls';
    // on the end walls: a hand lamp every few metres along every terrace, lit tier by tier from the foot, all lifted
    for (const s of [0, 1]) {
      const depths = hollow.wallDepths[s];
      for (let tier = 0; tier < NT; tier++) {
        let zRail = 0; for (let i = tier; i < NT; i++) zRail += depths[i];
        if (tier > 16) break;
        const y = (tier + 1) * TIER_H, r = DRUM.RH - y, step = (tier < 10 ? 10 : 14) / r, gx = GX + 180 * (DRUM.RH / r), gw = 390 * (DRUM.RH / r);
        for (let a = lrng.f(0, step); a < Math.PI * 2; a += step * lrng.f(0.5, 1.5)) {
          const x = a * DRUM.RH;
          if (s === 1 && tier === 2 && Math.abs(dX(x - gx)) < gw) continue;   // the guests' own
          hands.add(x, y + 1.1, s === 0 ? zRail - lrng.f(0.8, 3.2) : L - zRail + lrng.f(0.8, 3.2), lrng.pick(HAND), lrng.f(5, 9), 0.7, 44.5 + tier * 0.12 + lrng.f(0, 1.8), 0.6, ROAR + 0.3 + tier * 0.04 + lrng.f(0, 0.7), 0.9);
        }
      }
    }
    const handLamps = timedLights(hands, hollow.frame, { maxPx: 30, fall: 1.6 });
    hollow.add(handLamps);
    yield 'lamps: hands';
    // and after it all, people going home over the lawns with hand lamps: small lights, slowly moving
    const hand = [];
    for (let i = 0; i < Math.round(4500 * ctx.density); i++) {
      const x = lrng.f(0, C), z = lrng.f(700, L - 700), s = hollow.at(x, z);
      if (s.water > 0.2 || s.wood > 0.5 || s.life < 0.3) continue;
      const a = lrng.f(0, 6.28), v = lrng.f(0.8, 1.5);
      hand.push({ p: [x, 1.1, z], color: lrng.pick(HAND), power: lrng.f(6, 10), size: 1.2, move: [Math.cos(a) * v, 0, Math.sin(a) * v], loop: lrng.f(80, 200), twinkle: 0.15, phase: lrng() });
    }
    const handMesh = hollow.glow(hand, { minPx: 1.3, maxPx: 24, soft: 2.0 });
    yield 'lamps';

    // ---- the light, second by second
    const rig = hollow.rig, U = rig.uniforms;
    // each tier's windows come on in their own time, from the foot of the wall upward, after the promenades
    const winT = [0, 1].map((s) => { const a = []; for (let i = 0; i < NT; i++) a.push([39 + i * 0.22 + 2.5 * hash2(i, s, 3), 0.06 + 0.16 * hash2(i, s, 7) + (i < 10 ? 0.04 : 0)]); return a; });
    const sun = new Color(), farC = new Color(), amb = new Color();
    const look = { exposure: 1.5, bloom: 0.26, threshold: 0.7, saturation: 1.05, vignette: 0.5, contrast: 1.03 };
    const timed = [floorLamps, handLamps, guestLamps];
    const wallTint = hollow.ground.material.uniforms.uWallTint.value, stoneTint = wallTint.clone(), seaTint = new Vector3(0.5, 2.6, 2.1);
    function light(t) {
      let i = 0; while (i < SEQ.length - 2 && SEQ[i + 1][0] <= t) i++;
      const a = SEQ[i], b = SEQ[i + 1], u = smoothstep(a[0], b[0], t), ca = SEQC[i], cb = SEQC[i + 1];
      const m = (j) => a[j] + (b[j] - a[j]) * u;
      sun.copy(ca[0]).lerp(cb[0], u); farC.copy(ca[1]).lerp(cb[1], u); amb.copy(ca[2]).lerp(cb[2], u);
      rig.set({ sun, sunPower: m(2), sunFar: farC, sunFarPower: m(4), amb, ambPower: m(6), ground: '#ffb468', groundPower: 0.35 * m(9) });
      U.uSunSharp.value = m(8);
      hollow.setRod(m(7));
      hollow.setNight(m(9) * m(9), 0.05 * m(9));
      const half = HALF0 * (1 - SHRINK * smoothstep(LINE0, LINE1, t));
      hollow.setLine(MIDZ - half, MIDZ + half);
      for (let s = 0; s < 2; s++) for (let k = 0; k < NT; k++) { const w = winT[s][k]; hollow.setWindows(s, k, w[1] * smoothstep(w[0], w[0] + 6, t)); }
      for (const mesh of timed) mesh.material.uniforms.uT.value = t;
      tentMat.uniforms.uEmit.value = 0.9 * smoothstep(37, 45, t);
      // the water keeps the green after the land has lost it: what the mirrors hold of the walls turns sea-green
      const wk = smoothstep(33, 42, t) * (1 - 0.55 * smoothstep(50, 62, t));
      wallTint.copy(stoneTint).lerp(seaTint, wk);
      T2.setGlow('#ffbe78', 0.25 * smoothstep(45.5, 48, t) + 0.35 * smoothstep(ROAR, ROAR + 1.5, t));
      handMesh.material.uniforms.uPower.value = smoothstep(53, 60, t);
      handMesh.visible = t > 53;
      look.exposure = 1.5 + 0.35 * smoothstep(36, 52, t);
    }
    light(0);
    const seatAt = T.frame.point(0, 0, -8), guestAt = T2.frame.point(180, 0, 2);
    return {
      scene, path, hollow, near: 0.3, far: 8500, look,
      portal: { mist: '#6fc9a8' },
      update(t, dt, camera) {
        light(t);
        if (!camera) return;
        const cp = camera.position;
        const showSeats = cp.distanceTo(seatAt) < 1400;
        for (const m of seated) m.visible = showSeats;
        const showGuests = cp.distanceTo(guestAt) < 1500;
        for (const m of guests) m.visible = showGuests;
        for (const [m, far] of lod) { const s = m.isInstancedMesh ? m.boundingSphere : m.geometry.boundingSphere; m.visible = cp.distanceTo(s.center) - s.radius < far; }
      },
    };
  },
};
