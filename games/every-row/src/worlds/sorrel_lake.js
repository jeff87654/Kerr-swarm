// Sorrel, Herb Row: lamp-dawn on the lake, when the old have it to themselves (docs/sorrel.md, "The Hollow's plan" and
// the Hollow's landmarks; ashgrove.md, Day two; three-nights 15-canon.js, Sorrel: "Plain Sorrel dawn", a ramp warm and
// then white). It is a little after six. The sunline has just begun its plain three-hour dawn and every lamp in the
// Hollow is still lit, so the land is half lamp and half dawn and both end walls are cities of lit windows.
//
// The plan is painted from the docs' own layout, Hour by Hour and Ring by Ring (an Hour is a 30 degree wedge counted
// spinward from Hare, a Ring a 417 m slice from the front wall, as the Sorrel Atlas has them):
//   the lake, Fox to Stag in Rings Four to Six; Bench Island and its jetty in Otter, Ring Five; the Robe House on the Stag
//   shore in Ring Four; the orchards, Heron to Bee in Rings Three to Seven, in blossom, leaf or fruit by section, with the
//   Winter Tents in Heron, Ring Four, Brush Rows in Bee, Ring Six, and the Old Graft in Owl, Ring Seven; the lawns, Swift
//   to Moth, with the kite field in Badger and the Changeover's big pavilion at their back; the grounds, Wolf to Hare,
//   with the twelve spinball pitches in Wolf, the half-g track and the bandstand in Lark; the Front Wood, the Fern Gardens
//   and the Back Wood in the Dim Ends, and the Lamp Walk right round the back one; a lift pavilion every 170 m.
//
// The flight comes up among apple trees on the lane between Brush Rows and the Old Graft, past a section under its
// winter tent and the crews on step-ladders dabbing blossom with brushes, climbs out over the lake until it is a shape
// on the land and the land closes overhead, comes down to Bench Island (the Last Stair bringing more elders up, the
// bench in order of age, a dive off the jetty taking half again as long to fall), skims the swimmers to the Robe House
// and its queue of wet swimmers being handed robes and lidded cups, and lifts away.
//
// Not canon:
//   - the lake's exact outline (a rounded oblong filling Fox to Stag and Rings Four to Six, 2.4 km2 against the docs'
//     'about 3'), the island's size and its place toward Otter's spinward side, near the Robe House, the
//     jetty's length and the small dive stand at its end; which way the bench faces
//   - the Last Stair coming out of the island pavilion as an open stairwell; the Robe House's look (moss boards and
//     bronze trim, Stag's colours, an open counter facing the water, broth urns), the queue along a rope
//   - where the rotating winter tents stand this week besides the Winter Tents in Heron; the section pattern of blossom,
//     leaf and fruit; the Old Graft as a single fenced row of thirty-odd trees along the Ring Six lane
//   - the lanes, avenues and lamps of the orchard, the shore promenade and its lamps, the floor gardens, clumps and paths
//     over the rest of the plan; the shapes of the track, pitches, kite field and bandstand
//   - the house colours of the end walls, taken from the twelve Hours' colours
import {
  Scene, ShaderMaterial, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, BufferGeometry, BufferAttribute,
  Mesh, InstancedMesh, Vector2, Vector3, Matrix4, Quaternion, Euler, Sphere, AdditiveBlending, Color,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, pavilionGeo } from '../kit/hollow.js';
import { makePath, nearPath } from '../core/path.js';
import { scatterTrees } from '../kit/flora.js';
import { crowd, figureGeo, SKIN } from '../kit/folk.js';
import { Geo, instances } from '../kit/geo.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, litMaterial, vec3col } from '../kit/mats.js';
import { makeRng, hash2, cellRand, smoothstep } from '../core/rng.js';

// ---------------------------------------------------------------- where things are
const H = C / 12, RING = L / 9;
const hourX = (h) => (h - 1) * H;            // where Hour h begins: Hare 1, Heron 2, Owl 3, Bee 4, Fox 5, Otter 6, Stag 7, Swift 8, Badger 9, Moth 10, Wolf 11, Lark 12
const ringZ = (r) => (r - 1) * RING;         // where Ring r begins: One at the front wall
const TAU = Math.PI * 2;

// The lake: Fox to Stag, Rings Four to Six. A rounded oblong (a superellipse) with a slow wobble to its shore.
const WY = 0.2;                                          // the water's surface stands this far above the lake bed
const LK = { x: 4320, z: 1875, a: 1124, b: 600, p: 3.2 };
const lakeWob = (g) => 1 + 0.03 * Math.sin(3 * g + 1.1) + 0.022 * Math.sin(5 * g + 2.4) + 0.012 * Math.sin(9 * g + 0.3);
function lakeR(g) {
  const c = Math.abs(Math.cos(g)), s = Math.abs(Math.sin(g));
  return lakeWob(g) / Math.pow(Math.pow(c / LK.a, LK.p) + Math.pow(s / LK.b, LK.p), 1 / LK.p);
}
/** the shore as points, `pad` metres out from the water (negative: in toward the middle) */
function lakePoly(n = 360, pad = 0) {
  const out = [];
  for (let i = 0; i < n; i++) { const g = (i / n) * TAU, r = Math.max(10, lakeR(g) + pad); out.push([LK.x + Math.cos(g) * r, LK.z + Math.sin(g) * r]); }
  return out;
}
/** metres outside the shore (negative inside) */
function lakeEdge(x, z) { const dx = x - LK.x, dz = z - LK.z; return Math.hypot(dx, dz) - lakeR(Math.atan2(dz, dx)); }
const inLake = (x, z, pad = 0) => lakeEdge(x, z) < pad;
/** the front (Ring Four) shore at x */
function frontShore(x) { let z = LK.z; while (z > LK.z - 800 && inLake(x, z)) z -= 0.5; return z; }

const IS = { x: 4676, z: 1703 };                         // Bench Island, Otter, Ring Five (Otter ends at 4,712 m, Ring Five begins at 1,667)
const ISR = [34, 21];                                    // its half-size, metres
const JET = { x0: IS.x + 31, x1: IS.x + 88, z: IS.z - 4, w: 3.2, deck: 0.9 };   // the jetty, spinward off the island
const STAND = { x: JET.x1 - 2.4, h: 3.6 };               // a dive stand at its end
const BENCH = { x0: IS.x - 29, x1: IS.x + 5, z: IS.z + 14 };                      // the elders' bench, facing back across the water
const STAIR = { x: IS.x + 17, z: IS.z - 3, up: 1.5 };   // the Last Stair: the core of the island's pavilion, beside the jetty
const RH = { x: 4805 };                                  // the Robe House, Stag, Ring Four
RH.shore = frontShore(RH.x);
RH.z = Math.max(ringZ(4) + 7, RH.shore - 17);          // the house's middle line (Ring Four starts at 1,250 m)
const LANE_Z = ringZ(7);                                 // the lane between Rings Six and Seven: Brush Rows on one side, the Old Graft on the other
const GRAFT = { x0: 2096, x1: hourX(4) - 6, z: LANE_Z + 17 };                      // the Old Graft, Owl, Ring Seven
const START = { x: 2300, z: LANE_Z + 0.4 };
const ORCH = { x0: hourX(2), x1: hourX(5), z0: ringZ(3), z1: ringZ(8) };          // Heron to Bee, Rings Three to Seven

// Sections of orchard: the ground draws each in blossom, leaf or fruit by a hash of its cell, and scatterTrees reads
// the same hash. Find a section size that puts Brush Rows in blossom and the section across the lane out of it (it is
// under its tent this week), so the painted plan, the standing trees and the tents all agree.
const SHARE = { blossom: 0.3, fruit: 0.3 };
function sectionLayout() {
  const kindAt = (sx, sz, x, z) => { const q = cellRand(Math.floor(x / sx) + 400, Math.floor(z / sz) + 400)[0]; return q < SHARE.blossom ? 0 : q < SHARE.blossom + SHARE.fruit ? 2 : 1; };
  let pick = null;
  for (const sz of [250, 2500 / 11, 2500 / 12, 2500 / 9]) {
    for (let sx = 190; sx <= 330 && !pick; sx++) {
      if ([2366, 2440, 2520, 2600].every((x) => kindAt(sx, sz, x, LANE_Z - 30) === 0) && kindAt(sx, sz, 2470, LANE_Z + 60) !== 0 && kindAt(sx, sz, 2300, LANE_Z - 30) !== 0) pick = { sx, sz };
    }
    if (pick) break;
  }
  if (!pick) pick = { sx: 262, sz: 250 };
  const { sx, sz } = pick;
  const lay = { sx, sz, kind: (x, z) => kindAt(sx, sz, x, z) };
  // tents: the section across the lane from Brush Rows, the Winter Tents in Heron, Ring Four, and a few more this week
  const want = [[2470, LANE_Z + 60], [hourX(2) + 230, ringZ(4) + 200], [hourX(2) + 520, ringZ(4) + 200], [hourX(2) + 380, ringZ(4) + 420], [1900, ringZ(3) + 150], [2900, ringZ(5) + 100], [1250, ringZ(6) + 260], [2150, ringZ(5) + 260]];
  const seen = new Set();
  lay.tents = [];
  for (const [x, z] of want) {
    const ix = Math.floor(x / sx), iz = Math.floor(z / sz), key = ix + ',' + iz;
    if (seen.has(key) || lay.kind(x, z) === 0) continue;
    seen.add(key);
    const t = { x0: Math.max(ix * sx, ORCH.x0) + 5, x1: Math.min((ix + 1) * sx, ORCH.x1) - 5, z0: Math.max(iz * sz, ORCH.z0) + 5, z1: Math.min((iz + 1) * sz, ORCH.z1) - 5 };
    if (t.x1 - t.x0 > 60 && t.z1 - t.z0 > 60) lay.tents.push(t);
  }
  return lay;
}
const inTent = (lay, x, z, pad = 0) => lay.tents.some((t) => x > t.x0 - pad && x < t.x1 + pad && z > t.z0 - pad && z < t.z1 + pad);

// ---------------------------------------------------------------- the plan
// Wiping a channel with the kit's `clear` costs a multiply pass over the whole canvas. Here what must be wiped is painted
// black with a plain fill on just the layer that needs it, and nothing is wiped where nothing lies underneath.
function zero(plan, name, shape, width = 0) { plan.layer(name, (cx) => { cx.globalCompositeOperation = 'source-over'; cx.fillStyle = '#000'; cx.strokeStyle = '#000'; if (width) { cx.lineWidth = width; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.stroke(shape); } else cx.fill(shape); }); }
// The kit's fill and stroke painted once, instead of three times over for the seam: for what lies well away from x = 0.
function onceOf(plan) {
  const hexA = (c, a) => { if (a === undefined || a >= 1) return c; const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const ch = (r, g, b) => (r || g || b ? `rgb(${Math.round(255 * Math.min(1, r || 0))},${Math.round(255 * Math.min(1, g || 0))},${Math.round(255 * Math.min(1, b || 0))})` : null);
  const go = (shape, o, width) => {
    const run = (name, style, op) => plan.once(name, (cx) => {
      cx.globalCompositeOperation = op;
      if (width) { cx.lineWidth = width; cx.lineCap = 'round'; cx.lineJoin = 'round'; if (o.dash) cx.setLineDash(o.dash); cx.strokeStyle = style; cx.stroke(shape); } else { cx.fillStyle = style; cx.fill(shape); }
    });
    if (o.color) run('alb', hexA(o.color, o.alpha), 'source-over');
    const m = ch(o.water, o.wood, o.lamp); if (m) run('mask', m, 'lighter');
    const k = ch(o.paved, o.rows, o.life); if (k) run('kind', k, 'lighter');
  };
  return {
    fill: (shape, o) => go(shape, o, 0),
    stroke: (shape, w, o) => go(Array.isArray(shape) ? plan.curve(shape) : shape, o, w),
    zero: (name, shape, width = 0) => plan.once(name, (cx) => { cx.fillStyle = '#000'; cx.strokeStyle = '#000'; if (width) { cx.lineWidth = width; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.stroke(shape); } else cx.fill(shape); }),
  };
}
const gather = () => { const m = new Map(); m.put = (key, shape) => { let p = m.get(key); if (!p) m.set(key, p = new Path2D()); p.addPath(shape); return m; }; return m; };
function lampsAlong(out, pts, spacing, closed = false) {
  const list = closed ? [...pts, pts[0]] : pts;
  let carry = 0;
  for (let i = 0; i < list.length - 1; i++) {
    const a = list[i], b = list[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let d = carry;
    while (d < len) { const t = d / len; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += spacing; }
    carry = d - len;
  }
  return out;
}
// land colours, a little grey: the light's colour does the rest
const LAWN = '#8fa27c', WALKC = '#c9bea2', WOODS = ['#587856', '#5f7e5e', '#67835e'];
const FLOWERS = ['#d9a0b4', '#e6cf7a', '#c9d98a', '#b7a3d6', '#e8b06a', '#f0e2c4', '#d98a70'];
// six of the twelve Hours' colours (sorrel.md: Hare's tawny, Heron's grey-blue, Owl's violet, Bee's gold, Fox's russet,
// Otter's teal): the houses of the end walls are painted in them
const HOUR_COLS = ['#cfa878', '#a9b8c4', '#a898b4', '#d8b450', '#b8643e', '#5e9c98'];

// Everything is gathered into one path per colour and painted in a few calls: each call costs the canvas a pass.
function* paintSorrel(plan, lay) {
  const rng = makeRng('sorrel-lake-plan'), lamps = [], P1 = onceOf(plan);
  const KEEP = [[ORCH.x0, ORCH.z0, ORCH.x1, ORCH.z1], [hourX(9), ringZ(5), hourX(10), ringZ(6)], [hourX(9) + 300, ringZ(8) + 60, hourX(9) + 490, ringZ(8) + 220],
    [hourX(11), ringZ(4), hourX(12), ringZ(5)], [hourX(12) + 100, ringZ(5) - 20, hourX(13) - 100, ringZ(6) + 20], [hourX(12) + 330, ringZ(6) + 150, hourX(12) + 460, ringZ(6) + 250],
    [0, ringZ(3) + 100, 700, ringZ(3) + 240], [0, ringZ(6) + 60, 700, ringZ(6) + 200]];
  const busy = (x, z, pad) => inLake(x, z, pad + 70) || KEEP.some((k) => x > k[0] - pad && x < k[2] + pad && z > k[1] - pad && z < k[3] + pad);
  // whole-floor layers are painted once, as plain rectangles (a band is drawn three times over, for the seam)
  plan.once('alb', (cx) => { cx.fillStyle = LAWN; cx.fillRect(0, 0, C, L); cx.fillStyle = '#4f6a4a'; cx.fillRect(0, 0, C, 700); cx.fillStyle = '#68805a'; cx.fillRect(0, L - 700, C, 700); });
  plan.once('kind', (cx) => { cx.fillStyle = 'rgb(0,0,13)'; cx.fillRect(0, 700, C, L - 1400); });
  // the Dim Ends: the Front Wood (yew, hornbeam, birch, hazel) and the Back Wood (birch and tall bamboo), with glades
  plan.once('mask', (cx) => { cx.globalCompositeOperation = 'lighter'; cx.fillStyle = 'rgb(0,242,0)'; cx.fillRect(0, 0, C, 700); cx.fillStyle = 'rgb(0,235,0)'; cx.fillRect(0, L - 700, C, 700); });
  plan.mottle(['#9cac7e', '#8a9c6e', '#a3b083', '#839769', '#aab588', '#8ea07a'], 20, 340, { alpha: 0.45, seed: 'sorrel-lawn', z0: 700, z1: L - 700 });
  yield 'plan: ground';
  const glades = gather();
  for (let i = 0; i < 48; i++) glades.put(rng.pick(['#76906a', '#6c8862']), plan.blob(rng.f(0, C), rng.chance(0.5) ? rng.f(330, 660) : rng.f(L - 660, L - 330), rng.f(36, 100), rng.f(26, 60), { seed: i + 3, n: 28 }));
  const gladeAll = new Path2D(); for (const [c, p] of glades) { plan.fill(p, { color: c }); gladeAll.addPath(p); }
  // the Fern Gardens, Heron, under the front wall: ferns taller than people, moss, and a bed of sorrel
  const ferns = gather();
  for (let i = 0; i < 40; i++) ferns.put(rng.pick(['#5f8a4c', '#77985a']), plan.blob(hourX(2) + rng.f(40, H - 40), rng.f(420, 680), rng.f(10, 28), rng.f(8, 20), { seed: 90 + i, n: 20 }));
  for (const [, p] of ferns) gladeAll.addPath(p);
  for (const [c, p] of ferns) P1.fill(p, { color: c });
  zero(plan, 'mask', gladeAll);
  P1.fill(plan.rect(hourX(2) + 360, 600, hourX(2) + 410, 630, 4), { color: '#8f9a4a' });
  // the Lamp Walk: low lamps right round the back Dim End, nine kilometres of them; and the walk through the Front Wood
  const lampWalk = [], frontWalk = [];
  for (let i = 0; i <= 160; i++) { const x = (i / 160) * C; lampWalk.push([x, L - 520 + Math.sin(i * 0.7) * 18 + Math.sin(i * 0.23) * 30]); frontWalk.push([x, 560 + Math.sin(i * 0.5 + 1) * 22]); }
  const dimWalks = new Path2D(); dimWalks.addPath(plan.line(lampWalk)); dimWalks.addPath(plan.line(frontWalk));
  zero(plan, 'mask', dimWalks, 5);
  plan.stroke(dimWalks, 4.5, { color: '#c9bc9a', paved: 0.8, life: 0.2 });
  lampsAlong(lamps, lampWalk, 11); lampsAlong(lamps, frontWalk, 30);
  yield 'plan: dim ends';

  // ---- walks: lanes along every Hour line and rings along the Ring lines, where nothing else is
  const walks = gather();
  for (let h = 0; h < 12; h++) {
    let run = [];
    const flush = () => { if (run.length > 1) { walks.put(6, plan.line(run)); lampsAlong(lamps, run, 28); } run = []; };
    for (let z = 700; z <= L - 700; z += 25) { const x = h * H + Math.sin(z * 0.004 + h) * 14; if (busy(x, z, 8)) flush(); else run.push([x, z]); }
    flush();
  }
  for (let r = 2; r <= 9; r++) {
    let run = [];
    const flush = () => { if (run.length > 1) { walks.put(5, plan.line(run)); lampsAlong(lamps, run, 30); } run = []; };
    for (let x = 0; x <= C; x += 30) { const z = ringZ(r) + Math.sin(x * 0.003 + r) * 16; if (busy(x, z, 8) || z < 700 || z > L - 700) flush(); else run.push([x, z]); }
    flush();
  }
  for (let i = 0; i < 70; i++) {
    let x = rng.f(0, C), z = rng.f(760, L - 760), a = rng.f(0, TAU); const pts = [];
    for (let k = 0; k < 12; k++) { pts.push([x, z]); a += rng.f(-0.45, 0.45); x += Math.cos(a) * 34; z += Math.sin(a) * 34; }
    if (pts.some((q) => busy(q[0], q[1], 12) || q[1] < 740 || q[1] > L - 740)) continue;
    walks.put(3, plan.line(pts));
  }
  for (const [w, p] of walks) plan.stroke(p, w, { color: WALKC, paved: 0.8, life: 0.25 });
  yield 'plan: walks';

  // ---- the lawns: Swift to Moth, Rings Two to Eight. Mown in long strips; the kite field in Badger; the Changeover's
  // big pavilion at their back in Badger, Ring Eight
  const LX0 = hourX(8), LX1 = hourX(11);
  const strips = gather();
  for (let x = LX0 + 20, k = 0; x < LX1 - 20; x += 60, k++) strips.put(k % 2 ? '#a6b382' : '#9dad7b', plan.rect(x, 720, x + 60, L - 720));
  for (const [c, p] of strips) P1.fill(p, { color: c, alpha: 0.6 });
  P1.fill(plan.rect(hourX(9) + 30, ringZ(5) + 20, hourX(10) - 30, ringZ(6) - 20, 30), { color: '#acb987', life: 0.06 });
  P1.stroke(plan.rect(hourX(9) + 30, ringZ(5) + 20, hourX(10) - 30, ringZ(6) - 20, 30), 1.5, { color: '#e8e6d6', dash: [6, 6] });
  P1.fill(plan.ellipse(hourX(9) + H / 2, ringZ(8) + 140, 46, 46), { color: '#cfc5aa', paved: 1, life: 0.3 });
  P1.fill(plan.ellipse(hourX(9) + H / 2, ringZ(8) + 140, 16, 16), { color: '#efe9da' });
  // ---- the grounds: Wolf to Hare, Rings Three to Seven
  const GX0 = hourX(11);
  // twelve spinball pitches in Wolf, Ring Four
  const pitch = new Path2D(), pline = new Path2D();
  for (let i = 0; i < 12; i++) {
    const px = GX0 + 22 + (i % 4) * 188, pz = ringZ(4) + 24 + Math.floor(i / 4) * 128;
    pitch.addPath(plan.rect(px, pz, px + 160, pz + 108, 4));
    pline.addPath(plan.rect(px + 6, pz + 6, px + 154, pz + 102, 3)); pline.addPath(plan.line([[px + 80, pz + 6], [px + 80, pz + 102]])); pline.addPath(plan.ellipse(px + 80, pz + 54, 12, 12));
  }
  P1.fill(pitch, { color: '#a3bb7c', life: 0.05 });
  P1.stroke(pline, 1.4, { color: '#f0eee2' });
  // the half-g track in Lark, Ring Five, and the bandstand in Lark, Ring Six
  const TX = hourX(12) + H / 2, TZ = ringZ(5) + RING / 2;
  P1.fill(plan.rect(TX - 260, TZ - 135, TX + 260, TZ + 135, 135), { color: '#a2b47e', life: 0.05 });
  P1.stroke(plan.rect(TX - 240, TZ - 118, TX + 240, TZ + 118, 118), 19, { color: '#b46c4c', paved: 0.4 });
  const lanesT = new Path2D(); for (let k = 1; k < 6; k++) lanesT.addPath(plan.rect(TX - 249 + k * 3, TZ - 127 + k * 3, TX + 249 - k * 3, TZ + 127 - k * 3, 127 - k * 3));
  P1.stroke(lanesT, 0.4, { color: '#f2e4d6' });
  P1.fill(plan.ellipse(TX, ringZ(6) + 200, 30, 30), { color: '#cdbfa2', paved: 1, life: 0.2 });
  P1.fill(plan.ellipse(TX, ringZ(6) + 200, 9, 9), { color: '#f2ecdc' });
  const hp = new Path2D(), hl = new Path2D();
  for (const z of [ringZ(3) + 120, ringZ(6) + 80]) for (let i = 0; i < 3; i++) { const px = hourX(1) + 80 + i * 200; hp.addPath(plan.rect(px, z, px + 150, z + 100, 4)); hl.addPath(plan.rect(px + 5, z + 5, px + 145, z + 95, 3)); }
  P1.fill(hp, { color: '#a3bb7c' }); P1.stroke(hl, 1.2, { color: '#f0eee2' });
  yield 'plan: lawns and grounds';

  // ---- floor gardens and clumps over the rest of the floor
  const beds = gather(), hedges = new Path2D(), gravel = new Path2D();
  for (let i = 0; i < 150; i++) {
    const x = rng.f(0, C), z = rng.f(800, L - 800), w = rng.f(70, 150), h = rng.f(50, 100);
    if (busy(x, z, w) || busy(x + w, z + h, 20)) continue;
    hedges.addPath(plan.rect(x, z, x + w, z + h, 4)); gravel.addPath(plan.rect(x + 3, z + 3, x + w - 3, z + h - 3, 3));
    for (const [qx, qz] of [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]]) beds.put(rng.pick(FLOWERS.slice(0, 5)), plan.rect(x + w * qx - w * 0.19, z + h * qz - h * 0.19, x + w * qx + w * 0.19, z + h * qz + h * 0.19, 3));
    lampsAlong(lamps, [[x, z - 3], [x + w, z - 3]], 18);
  }
  plan.fill(hedges, { color: '#46663f' });
  plan.fill(gravel, { color: '#d3c7a8', paved: 0.6, life: 0.12 });
  for (const [c, p] of beds) plan.fill(p, { color: c });
  // herb beds in long strips, the drum's name among them: sorrel, chives, sage, lavender, thyme
  const herbs = gather();
  for (let i = 0; i < 60; i++) {
    const x = rng.f(0, C), z = rng.f(800, L - 800), w = rng.f(90, 200), n = 8 + rng.i(0, 10);
    if (busy(x, z, 20) || busy(x + w, z + n * 8, 20)) continue;
    for (let j = 0; j < n; j++) herbs.put(rng.pick(['#7f9a5e', '#a3a86c', '#b3aa7c', '#8fae7a', '#9a8ab0', '#c4b98c']), plan.rect(x, z + j * 8, x + w * rng.f(0.85, 1), z + j * 8 + 6));
    lampsAlong(lamps, [[x - 4, z - 4], [x + w, z - 4]], 20);
  }
  for (const [c, p] of herbs) plan.fill(p, { color: c });
  const woods = gather();
  for (let i = 0; i < 120; i++) {
    const x = rng.f(0, C), z = rng.f(820, L - 820), r = rng.f(50, 150);
    if (busy(x, z, r + 30)) continue;
    woods.put(rng.pick(WOODS), plan.blob(x, z, r, r * rng.f(0.5, 0.9), { wobble: 0.35, lobes: 6, seed: 300 + i, n: 40 }));
  }
  for (let i = 0; i < 950; i++) {
    const x = rng.f(0, C), z = rng.f(760, L - 760), r = rng.f(8, 30);
    if (busy(x, z, r + 20)) continue;
    woods.put(rng.pick(WOODS), plan.blob(x, z, r, r * rng.f(0.6, 1.1), { wobble: 0.3, lobes: 4, seed: i + 1, n: 20 }));
  }
  for (const [c, p] of woods) plan.fill(p, { color: c, wood: 1 });
  yield 'plan: gardens';

  yield* paintOrchards(plan, lay, lamps);
  yield* paintLake(plan, lamps);
  // every lamp at once: drawn once, but for the few by the seam
  const lampsSeam = lamps.filter((q) => q[0] < 8 || q[0] > C - 8), lampsRest = new Path2D();
  for (const q of lamps) if (q[0] >= 8 && q[0] <= C - 8) { lampsRest.moveTo(q[0] + 2.2, q[1]); lampsRest.arc(q[0], q[1], 2.2, 0, TAU); }
  P1.fill(lampsRest, { lamp: 1 });
  if (lampsSeam.length) plan.dots(lampsSeam, 2.2, { lamp: 1 });
  for (const q of lamps) plan.features.push({ type: 'lamp', x: ((q[0] % C) + C) % C, z: q[1], h: 4.5 });
}

// The orchards: Heron to Bee, Rings Three to Seven. Every section its own season, lanes between sections, wider
// avenues on the Hour and Ring lines, the tents, Brush Rows and the Old Graft.
function* paintOrchards(plan, lay, lamps) {
  const P1 = onceOf(plan);
  const { sx, sz } = lay;
  P1.fill(plan.rect(ORCH.x0 + 6, ORCH.z0 + 6, ORCH.x1 - 6, ORCH.z1 - 6), { color: '#7d9360', rows: 1, life: 0.03 });
  const secs = gather();
  for (let ix = Math.floor(ORCH.x0 / sx); ix * sx < ORCH.x1; ix++) for (let iz = Math.floor(ORCH.z0 / sz); iz * sz < ORCH.z1; iz++) {
    const x0 = Math.max(ix * sx, ORCH.x0 + 6), x1 = Math.min((ix + 1) * sx, ORCH.x1 - 6), z0 = Math.max(iz * sz, ORCH.z0 + 6), z1 = Math.min((iz + 1) * sz, ORCH.z1 - 6);
    const k = lay.kind((x0 + x1) / 2, (z0 + z1) / 2), j = hash2(ix, iz, 3);
    const col = k === 0 ? (j < 0.5 ? '#bdb3a4' : '#c4b2ac') : k === 2 ? (j < 0.5 ? '#8c8d58' : '#93864f') : (j < 0.5 ? '#76905a' : '#6f8a58');
    secs.put(col, plan.rect(x0, z0, x1, z1));
  }
  for (const [c, p] of secs) P1.fill(p, { color: c, alpha: 0.8 });
  // lanes between sections, avenues on the Hour and Ring lines (lit)
  const lanes = new Path2D(), aves = new Path2D();
  for (let x = Math.ceil(ORCH.x0 / sx) * sx; x < ORCH.x1; x += sx) lanes.addPath(plan.line([[x, ORCH.z0], [x, ORCH.z1]]));
  for (let z = Math.ceil(ORCH.z0 / sz) * sz; z < ORCH.z1; z += sz) lanes.addPath(plan.line([[ORCH.x0, z], [ORCH.x1, z]]));
  // (lamps stand at the avenues' edges, staggered, so the middle is clear)
  for (let h = 2; h <= 5; h++) { const x = hourX(h), pts = [[x, ORCH.z0], [x, ORCH.z1]]; aves.addPath(plan.line(pts)); lampsAlong(lamps, [[x - 6.5, ORCH.z0], [x - 6.5, ORCH.z1]], 48); lampsAlong(lamps, [[x + 6.5, ORCH.z0 + 24], [x + 6.5, ORCH.z1]], 48); }
  for (let r = 3; r <= 8; r++) {
    const z = ringZ(r), x1 = r >= 4 && r <= 7 ? LK.x - LK.a - 60 : ORCH.x1, sp = r === 7 ? 36 : 48;
    aves.addPath(plan.line([[ORCH.x0, z], [x1, z]]));
    lampsAlong(lamps, [[ORCH.x0, z - 6.5], [x1, z - 6.5]], sp); lampsAlong(lamps, [[ORCH.x0 + sp / 2, z + 6.5], [x1, z + 6.5]], sp);
  }
  P1.zero('kind', lanes, 5); P1.zero('kind', aves, 14);
  P1.stroke(lanes, 5, { color: '#c4b996', paved: 0.5, life: 0.1 });
  P1.stroke(aves, 14, { color: '#b3aa92', paved: 0.8, life: 0.2 });
  // winter tents: white cloth over whole sections, ridges running along the axis
  const tent = new Path2D(), ridge = new Path2D();
  for (const t of lay.tents) {
    tent.addPath(plan.rect(t.x0, t.z0, t.x1, t.z1, 3));
    for (let x = t.x0 + 9; x < t.x1; x += 18) ridge.addPath(plan.line([[x, t.z0 + 1], [x, t.z1 - 1]]));
  }
  P1.zero('kind', tent);
  P1.fill(tent, { color: '#e8ebe8' });
  P1.stroke(ridge, 2.2, { color: '#cfd6d8' });
  // the Old Graft: one fenced row of russet trees, older than the Register, with a gravel walk inside the fence
  P1.zero('kind', plan.rect(GRAFT.x0 - 8, GRAFT.z - 12, GRAFT.x1 + 2, GRAFT.z + 14, 3));
  P1.fill(plan.rect(GRAFT.x0 - 8, GRAFT.z - 12, GRAFT.x1 + 2, GRAFT.z + 14, 3), { color: '#a49a6c', paved: 0.3 });
  const crowns = []; for (let x = GRAFT.x0; x <= GRAFT.x1; x += 8) crowns.push([x, GRAFT.z]);
  plan.dots(crowns, 3.6, { color: '#7a6a3c' });
  P1.stroke(plan.rect(GRAFT.x0 - 8, GRAFT.z - 12, GRAFT.x1 + 2, GRAFT.z + 14, 2), 0.8, { color: '#e2dccb' });
  yield 'plan: orchards';
}

// The lake: a shore park ringed with trees, a lit promenade, a strand of pale gravel, the water darkening toward the
// middle, Bench Island, and the Robe House's apron on the Stag shore.
function* paintLake(plan, lamps) {
  const P1 = onceOf(plan);
  P1.fill(plan.poly(lakePoly(360, 70)), { color: '#93a678', life: 0.1 });
  const ring = new Path2D(); for (const q of lakePoly(240, 52)) ring.addPath(plan.ellipse(q[0], q[1], 4.6, 4.6));
  P1.fill(ring, { color: '#5e7c4e', wood: 1 });
  P1.stroke(plan.poly(lakePoly(360, 32)), 7, { color: '#c9bc9a', paved: 0.85, life: 0.6 });
  lampsAlong(lamps, lakePoly(360, 37), 22, true);
  P1.fill(plan.poly(lakePoly(360, 7)), { color: '#b9ae8e', paved: 0.3, life: 0.45 });
  P1.zero('kind', plan.poly(lakePoly(360, 0)));
  P1.fill(plan.poly(lakePoly(360, 0)), { color: '#5a8484', water: 1 });
  for (const [pad, c, a] of [[-90, '#467680', 0.6], [-260, '#3a6670', 0.55]]) P1.fill(plan.poly(lakePoly(240, pad)), { color: c, alpha: a });
  // Bench Island: a paved island round the pavilion that comes up through the lake bed
  P1.zero('mask', plan.rect(IS.x - ISR[0], IS.z - ISR[1], IS.x + ISR[0], IS.z + ISR[1], 16));
  P1.fill(plan.rect(IS.x - ISR[0], IS.z - ISR[1], IS.x + ISR[0], IS.z + ISR[1], 16), { color: '#cfc5aa', paved: 1, life: 0.5 });
  P1.fill(plan.ellipse(STAIR.x, STAIR.z, 9, 9), { color: '#efe9da' });
  // the Robe House's apron and its steps into the water
  P1.fill(plan.rect(RH.x - 34, RH.z - 9, RH.x + 34, RH.shore + 1, 6), { color: '#d4c8aa', paved: 1, life: 0.6 });
  P1.fill(plan.rect(RH.x - 24, RH.z - 6, RH.x + 24, RH.z + 6, 2), { color: '#6f7e4c' });
  yield 'plan: lake';
}

// Lift pavilions, one every 170 m: painted everywhere, built only near the flight.
function paintPavilions(plan, lay) {
  const rng = makeRng('sorrel-pav'), pav = [];
  for (let z = 760; z < L - 700; z += 170) for (let x = 0; x < C - 80; x += C / 55) {
    const px = x + rng.f(-28, 28), pz = z + rng.f(-28, 28);
    if (px < 14 || px > C - 14 || inLake(px, pz, 60) || inTent(lay, px, pz, 14) || (Math.abs(pz - GRAFT.z) < 30 && px > GRAFT.x0 - 20 && px < GRAFT.x1 + 20)) continue;
    pav.push([px, pz]);
  }
  pav.push([START.x + 52, LANE_Z - 21]);         // the one the flight comes up out of, among the apples
  const P1 = onceOf(plan), discs = new Path2D(), cores = new Path2D(), seam = [];
  for (const q of pav) { if (q[0] < 12 || q[0] > C - 12) { seam.push(q); continue; } discs.moveTo(q[0] + 9, q[1]); discs.arc(q[0], q[1], 9, 0, TAU); cores.moveTo(q[0] + 2.2, q[1]); cores.arc(q[0], q[1], 2.2, 0, TAU); }
  P1.zero('mask', discs); P1.zero('kind', discs);
  P1.fill(discs, { color: '#c9c1a8', alpha: 0.9, paved: 1 });
  P1.fill(cores, { lamp: 0.9 });
  if (seam.length) { plan.dots(seam, 9, { color: '#c9c1a8', alpha: 0.9, paved: 1 }); plan.dots(seam, 2.2, { lamp: 0.9 }); }
  return pav;
}

// ---------------------------------------------------------------- the water
// A sheet over the lake (the ground's own water stays under it). It holds what the kit's water holds, the far bank
// lit as it is and the sunline's streak, and more: the far bank's lamps, and where a mirrored ray leaves by an end
// wall, that wall's thousands of lit windows, broken up by the ripples. Shallows pale toward the shore, lamp light
// pools on the water by the promenade.
const WATER_VERT = /* glsl */`
${BEND_PARS}
varying vec3 vW; varying vec3 vF;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  vF = p;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const waterFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tAlb, tMask;
vec3 kLand(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }      // the land's colour is kept as painted: see Plan.textures()
uniform vec2 uSize;
uniform vec3 uBend, uLampCol, uWinA, uWinB, uStone, uDeep, uShallow;
uniform float uTime, uSunRod, uSunWidth, uWave, uLamp, uLit, uWinPow;
varying vec3 vW; varying vec3 vF;
${rig.glsl}
${NOISE_GLSL}
vec2 kRipple(vec2 p, float t) {
  return vec2(kNoise(p + vec2(t, 0.7 * t)) - kNoise(p + vec2(t + 0.35, 0.7 * t)), kNoise(p.yx * 1.07 + vec2(-0.6 * t, t) + 5.3) - kNoise(p.yx * 1.07 + vec2(-0.6 * t, t + 0.35) + 5.3)) * 2.0;
}
void main() {
  ${CLIP_FRAG}
  vec2 m = vF.xz;
  vec2 uv = m / uSize;
  if (texture2D(tMask, uv).r < 0.5) discard;
  float px = max(length(dFdx(m)), length(dFdy(m)));
  float dist = length(vW - cameraPosition);
  vec3 up = vec3(-normalize(vW.xy), 0.0);
  vec3 T = vec3(up.y, -up.x, 0.0);
  vec3 V = (cameraPosition - vW) / dist;
  float t = uTime * 0.45;
  vec2 tl = kRipple(m * 0.55, t * 1.6) * smoothstep(1.4, 0.3, px) * 1.2
          + kRipple(m * 0.12, t) * smoothstep(6.0, 1.5, px) * 0.7
          + kRipple(m * 0.022, t * 0.5) * smoothstep(34.0, 8.0, px) * 0.3;
  vec3 Nw = normalize(up + T * tl.x * uWave + vec3(0.0, 0.0, 1.0) * tl.y * uWave);
  float ndv = max(dot(Nw, V), 0.0);
  float fres = 0.06 + 0.94 * pow(1.0 - ndv, 5.0);
  vec3 R = reflect(-V, Nw);
  float rr = max(dot(R.xy, R.xy), 1e-5);
  float tt = -2.0 * dot(vW.xy, R.xy) / rr;
  vec3 Hh = vW + R * tt;
  float rz = abs(R.z) < 1e-4 ? 1e-4 : R.z;
  float tw = (rz > 0.0 ? uSize.y - vW.z : -vW.z) / rz;
  vec3 refl;
  float wallK = (tt > 0.0 && Hh.z > 0.0 && Hh.z < uSize.y) ? smoothstep(-30.0, 60.0, min(Hh.z, uSize.y - Hh.z)) : 0.0;
  // the land overhead, upside down, lit as it is, with its lamps
  vec3 landR = vec3(0.0);
  if (wallK > 0.0) {
    vec2 huv = vec2(fract(atan(Hh.y, Hh.x) / 6.2831853 - uBend.x / 6.2831853), Hh.z / uSize.y);
    vec3 ha = kLand(textureLod(tAlb, huv, 4.5).rgb);
    ha = mix(ha, kLand(textureLod(tAlb, huv, 8.0).rgb), smoothstep(0.0, 0.5, textureLod(tMask, huv, 6.0).r) * 0.9);
    vec3 nH = vec3(-normalize(Hh.xy), 0.0);
    landR = ha * kLight(Hh, nH, Hh, nH) + uLampCol * uLamp * (textureLod(tMask, huv, 2.0).b * 5.0 + textureLod(tMask, huv, 4.0).b * 3.0);
  }
  // an end wall: its stone in the Hollow's glow, and its windows, found along a ray bent by the broad ripples only (the
  // fine ones would tear the windows into contour lines); the fine ripples make the mirrored windows flicker instead
  vec2 tlB = kRipple(m * 0.022, t * 0.5) * 0.3 + kRipple(m * 0.12, t) * 0.25 * smoothstep(6.0, 1.5, px);
  vec3 R2 = reflect(-V, normalize(up + (T * tlB.x + vec3(0.0, 0.0, 1.0) * tlB.y) * uWave));
  float rz2 = abs(R2.z) < 1e-4 ? 1e-4 : R2.z;
  tw = (rz2 > 0.0 ? uSize.y - vW.z : -vW.z) / rz2;
  vec3 Pw = vW + R2 * tw;
  float r = length(Pw.xy), arcW = atan(Pw.y, Pw.x) * r, below = 1500.0 - r;
  vec2 q = vec2(arcW / 4.4, below / 24.0);
  vec2 qi = floor(q);
  float flats = step(below, 1425.0);
  float on = step(1.0 - uLit * 0.3, kHash(qi)) * flats;
  float thin = smoothstep(0.42, 0.12, abs(fract(q.x) - 0.5)) * smoothstep(0.5, 0.3, abs(fract(q.y) - 0.5));
  vec3 wc = mix(uWinA, uWinB, kHash(qi + 3.1)) * (0.5 + 1.3 * kHash(qi + 7.3));
  float fw = px * (dist + tw) / max(dist, 1.0) / 4.4;
  float flick = 0.35 + 1.3 * kNoise(m * vec2(1.7, 0.3) + vec2(t * 1.3, t * 2.1));
  vec3 wins = mix(wc * on * thin * flick, mix(uWinA, uWinB, 0.35) * uLit * flats * 0.07, smoothstep(0.8, 3.0, fw));
  vec3 wallR = uStone * (uAmb * 0.3 + kSunColor(Pw.xy) * 0.03) + wins * uWinPow + vec3(1.0, 0.85, 0.6) * 2.0 * smoothstep(3.0, 0.0, abs(r - 62.0)) * step(r, 80.0);
  refl = mix(wallR, landR, wallK);
  // the sunline's streak, and glitter round it
  vec3 Mid = vW + R * (tt * 0.5);
  float dm = length(Mid.xy);
  float inLine = smoothstep(uSunZ.x - 40.0, uSunZ.x + 40.0, Mid.z) * smoothstep(uSunZ.y + 40.0, uSunZ.y - 40.0, Mid.z) * step(0.0, tt);
  float wdt = uSunWidth * (1.0 + px * 0.35);
  float streak = exp(-dm * dm / (wdt * wdt));
  float gl = kNoise(m * 1.9 + vec2(t * 2.3, -t * 1.9)) * kNoise(m * 0.83 - vec2(t * 0.9, t * 1.3) + 3.0);
  streak += smoothstep(0.28, 0.6, gl) * exp(-dm * dm / (wdt * wdt * 40.0)) * 0.8 * smoothstep(6.0, 0.5, px);
  vec3 sunRefl = kSunColor(vW.xy) * uSunRod * streak * inLine;
  // the body of the water: shallows pale by the shore, the lamps' light pooled on it there
  vec3 Lgt = kLight(vW, up, vF, vec3(0.0, 1.0, 0.0));
  float deep = smoothstep(0.55, 1.0, textureLod(tMask, uv, 5.5).r);
  vec3 body = mix(uShallow, uDeep, deep) * (Lgt * 0.9 + 0.02);
  float halo = textureLod(tMask, uv, 2.6).b * 0.5 + textureLod(tMask, uv, 3.6).b + textureLod(tMask, uv, 5.0).b * 0.7;
  body += uLampCol * uLamp * halo * 0.16;
  vec3 wcol = body * (1.0 - fres) + (refl + sunRefl) * fres;
  gl_FragColor = vec4(kAir(wcol, vW), 1.0);
}`;

function waterMesh(hollow, o) {
  const x0 = LK.x - LK.a * 1.06 - 10, x1 = LK.x + LK.a * 1.06 + 10, z0 = LK.z - LK.b * 1.06 - 10, z1 = LK.z + LK.b * 1.06 + 10;
  const dx = C / 768, nx = Math.ceil((x1 - x0) / dx), nz = Math.ceil((z1 - z0) / 24);
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
  let k = 0;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { pos[k++] = x0 + (x1 - x0) * (i / nx); pos[k++] = WY; pos[k++] = z0 + (z1 - z0) * (j / nz); }
  const idx = new Uint32Array(nx * nz * 6);
  k = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(new BufferAttribute(idx, 1));
  const f = hollow.frame, pts = [];
  for (let i = 0; i <= 8; i++) for (const z of [z0, z1]) pts.push(f.point(x0 + (x1 - x0) * (i / 8), 0, z));
  g.boundingSphere = new Sphere().setFromPoints(pts);
  const uniforms = {
    ...hollow.rig.uniforms, uClip: G.uClip, uTime: G.uTime,
    uBend: { value: new Vector3(f.a0, f.z0, f.floorR) }, tAlb: { value: hollow.tex.alb }, tMask: { value: hollow.tex.mask }, uSize: { value: new Vector2(C, L) },
    uLampCol: { value: vec3col(o.lampColor) }, uWinA: { value: vec3col(o.winA) }, uWinB: { value: vec3col(o.winB) }, uStone: { value: vec3col(o.stone) },
    uDeep: { value: vec3col('#24525c') }, uShallow: { value: vec3col('#6e9a92') },
    uSunRod: { value: o.rod }, uSunWidth: { value: 20 }, uWave: { value: 0.016 }, uLamp: { value: o.lamp }, uLit: { value: o.lit }, uWinPow: { value: 2.4 },
  };
  const m = new ShaderMaterial({ uniforms, vertexShader: WATER_VERT, fragmentShader: waterFrag(hollow.rig) });
  const mesh = new Mesh(g, m);
  mesh.renderOrder = -6;
  return mesh;
}

// Lamps held in the water: each light drawn where its mirror image meets the lake, as seen from the eye, stretched
// into a streak and broken by the ripples. One draw call for all of them; the camera's flat place is fed in each frame.
const REFL_VERT = /* glsl */`
attribute vec3 aPos;      // the lamp (flat: x, height, z)
attribute vec4 aCS;       // rgb x strength, size in metres
attribute float aPh;
${BEND_PARS}
uniform sampler2D tMask;
uniform vec2 uSize, uRes;
uniform vec3 uCamF;
uniform float uTime, uPx, uMinPx, uMaxPx, uPower, uFar, uStretch;
varying vec3 vW; varying vec3 vC; varying vec2 vQ; varying float vPh;
void main() {
  vec3 c = uCamF;
  vec3 mir = vec3(aPos.x, -aPos.y, aPos.z);
  float s = c.y / max(c.y + aPos.y, 0.01);
  vec3 p = c + (mir - c) * s; p.y = ${(WY + 0.05).toFixed(2)};
  float dd = length(p.xz - c.xz);
  float wet = textureLod(tMask, p.xz / uSize, 0.0).r;
  float fade = smoothstep(uFar, uFar * 0.55, dd) * smoothstep(0.45, 0.8, wet) * step(0.6, c.y);
  vec3 n = vec3(0.0, 1.0, 0.0);
  kBend(p, n);
  vW = p;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float dist = max(length(mir - c), 0.1);
  mv.xyz *= 0.9;                                       // a little nearer the eye than it lies: never under the water it is on
  float px = aCS.w * uPx / dist;
  float shown = clamp(px, uMinPx, uMaxPx);
  float k = min(px * px / (shown * shown), 1.0);
  vC = aCS.rgb * k * fade * uPower;
  vQ = position.xy; vPh = aPh;
  vec4 clip = projectionMatrix * mv;
  clip.xy += position.xy * vec2(shown, shown * uStretch) / uRes * clip.w * 2.0;
  gl_Position = (fade > 0.0 && mv.z < 0.0) ? clip : vec4(2.0, 2.0, 2.0, 1.0);
}`;
const REFL_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uTime;
varying vec3 vW; varying vec3 vC; varying vec2 vQ; varying float vPh;
void main() {
  ${CLIP_FRAG}
  float r = length(vec2(vQ.x * 2.0, vQ.y * 2.0));
  float a = pow(max(1.0 - r, 0.0), 1.4);
  // broken into bars by the ripples, and shimmering
  float bars = 0.55 + 0.45 * sin(vQ.y * 23.0 + uTime * 2.7 + vPh * 40.0) * sin(vQ.y * 9.0 - uTime * 1.3 + vPh * 13.0);
  a *= bars;
  if (a <= 0.003) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;
function reflections(points, hollow, o = {}) {
  const n = points.length, g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const aPos = new Float32Array(n * 3), aCS = new Float32Array(n * 4), aPh = new Float32Array(n), c = new Color();
  for (let i = 0; i < n; i++) {
    const q = points[i];
    aPos.set(q.p, i * 3);
    c.set(q.color || '#ffc27a'); const k = q.power || 4;
    aCS[i * 4] = c.r * k; aCS[i * 4 + 1] = c.g * k; aCS[i * 4 + 2] = c.b * k; aCS[i * 4 + 3] = q.size || 1.2;
    aPh[i] = (i * 0.618034) % 1;
  }
  g.setAttribute('aPos', new InstancedBufferAttribute(aPos, 3));
  g.setAttribute('aCS', new InstancedBufferAttribute(aCS, 4));
  g.setAttribute('aPh', new InstancedBufferAttribute(aPh, 1));
  g.instanceCount = n;
  const f = hollow.frame;
  const m = new ShaderMaterial({
    uniforms: {
      uClip: G.uClip, uTime: G.uTime, uPx: G.uPx, uRes: G.uRes, uBend: { value: new Vector3(f.a0, f.z0, f.floorR) },
      tMask: { value: hollow.tex.mask }, uSize: { value: new Vector2(C, L) }, uCamF: { value: new Vector3(0, 10, 0) },
      uMinPx: { value: 1.4 }, uMaxPx: { value: o.maxPx || 60 }, uPower: { value: o.power === undefined ? 1 : o.power }, uFar: { value: o.far || 1100 }, uStretch: { value: o.stretch || 4.5 },
    },
    vertexShader: REFL_VERT, fragmentShader: REFL_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const mesh = new Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 9;
  return mesh;
}

// ---------------------------------------------------------------- people of the morning
// Everyone here is old, so they are drawn with hair: white, grey and iron. Faces +z; faces drawn with tint take each
// copy's colour (clothes, robes, swim caps).
const HAIR = ['#f4f1ea', '#e4dfd4', '#cdc8be', '#aaa59c', '#8a857c'];
const SKINS = [SKIN[0], SKIN[1], SKIN[2], SKIN[3]];
const SUITS = ['#1f2a33', '#2d4a5c', '#5a2a34', '#2a3f36', '#3a3550', '#14202a', '#6b3a2a'];
const ROBES = ['#ece6d8', '#e2dccb', '#d8e2de', '#e8d8c8', '#dfe4e8', '#f0ebe0'];
const geoCache = new Map();
function cached(key, make) { let g = geoCache.get(key); if (!g) { g = make(); geoCache.set(key, g); } return g; }
// sitting on a bench, hands in the lap
function elderSitGeo(skin, hair) {
  return cached('sit' + skin + hair, () => {
    const g = new Geo();
    g.tint(0.3).box(-0.17, 0.0, 0.0, 0.17, 0.17, 0.48, '#5a5650');
    g.box(-0.16, -0.45, 0.4, -0.04, 0.0, 0.5, '#5a5650'); g.box(0.04, -0.45, 0.4, 0.16, 0.0, 0.5, '#5a5650');
    g.tint(1).cyl(0, 0.15, 0.02, 0.22, 0.17, 0.6, 6, '#ffffff', { smooth: false });
    g.tint(0).blob(0, 0.92, 0.04, 0.125, 0, skin, { shadeBottom: 0.8 });
    g.blob(0, 0.98, -0.02, [0.13, 0.1, 0.12], 0, hair, { shadeBottom: 0.85 });
    return g.build();
  });
}
// a swimmer: head and a hump of shoulders out of the water, a cap or white hair, and a pale wake in a V behind
function swimmerGeo(skin) {
  return cached('swim' + skin, () => {
    const g = new Geo();
    g.tint(0).blob(0, -0.02, -0.05, [0.24, 0.1, 0.3], 0, skin, { shadeBottom: 0.7 });
    g.blob(0, 0.13, 0.12, 0.12, 0, skin, { shadeBottom: 0.8 });
    g.tint(1).blob(0, 0.19, 0.1, [0.13, 0.09, 0.13], 0, '#ffffff', { shadeBottom: 0.85 });
    g.tint(0).quad([0.06, 0.1, 0.2], [-1.5, 0.1, -4.4], [-1.32, 0.1, -4.5], [-0.06, 0.1, 0.1], '#d2e0dc', 0.4);
    g.quad([0.06, 0.1, 0.1], [1.32, 0.1, -4.5], [1.5, 0.1, -4.4], [-0.06, 0.1, 0.2], '#d2e0dc', 0.4);
    return g.build();
  });
}
// a bather standing, wet: bare arms and legs, a dark costume (tinted), hair
function batherGeo(skin, hair) {
  return cached('bath' + skin + hair, () => {
    const g = new Geo();
    g.tint(0).box(-0.14, 0, -0.08, -0.03, 0.82, 0.08, skin); g.box(0.03, 0, -0.08, 0.14, 0.82, 0.08, skin);
    g.tint(1).cyl(0, 0.78, 0, 0.2, 0.17, 0.64, 6, '#ffffff', { smooth: false });
    g.tint(0).box(-0.27, 0.86, -0.05, -0.19, 1.38, 0.05, skin); g.box(0.19, 0.86, -0.05, 0.27, 1.38, 0.05, skin);
    g.blob(0, 1.58, 0, 0.125, 0, skin, { shadeBottom: 0.8 }); g.blob(0, 1.64, -0.04, [0.13, 0.09, 0.12], 0, hair);
    return g.build();
  });
}
// in a warm robe to the ankles (tinted), holding a lidded cup of broth in both hands
function robedGeo(skin, hair) {
  return cached('robe' + skin + hair, () => {
    const g = new Geo();
    g.tint(1).cyl(0, 0, 0, 0.27, 0.2, 1.42, 7, '#ffffff', { smooth: false });
    g.cyl(0, 1.3, 0, 0.24, 0.16, 0.14, 7, '#ffffff', { smooth: false });
    g.tube([[-0.22, 1.32, 0], [-0.2, 1.08, 0.16], [-0.06, 1.12, 0.3]], 0.065, 4, '#ffffff');
    g.tube([[0.22, 1.32, 0], [0.2, 1.08, 0.16], [0.06, 1.12, 0.3]], 0.065, 4, '#ffffff');
    g.tint(0).cyl(0, 1.08, 0.32, 0.055, 0.06, 0.12, 6, '#b8833e').cyl(0, 1.2, 0.32, 0.065, 0.02, 0.03, 6, '#d9a85a');
    g.blob(0, 1.6, 0, 0.125, 0, skin, { shadeBottom: 0.8 }); g.blob(0, 1.66, -0.04, [0.13, 0.09, 0.12], 0, hair);
    return g.build();
  });
}
// on a step-ladder, one arm up into the blossom with a soft brush
function brushGeo(skin) {
  return cached('brush' + skin, () => {
    const g = new Geo();
    g.tint(0.3).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#4e4a44');
    g.tint(1).cyl(0, 0.82, 0, 0.22, 0.17, 0.62, 6, '#ffffff', { smooth: false });
    g.tube([[0.18, 1.36, 0], [0.32, 1.7, 0.12], [0.36, 2.02, 0.24]], 0.055, 4, '#ffffff');
    g.tube([[-0.18, 1.36, 0], [-0.3, 1.2, 0.2], [-0.2, 1.1, 0.34]], 0.055, 4, '#ffffff');
    g.tint(0).cyl(0.36, 2.0, 0.24, 0.012, 0.012, 0.32, 4, '#8a6a44').blob(0.36, 2.36, 0.24, [0.05, 0.07, 0.05], 0, '#f4ead6');
    g.blob(0, 1.6, 0, 0.125, 0, skin, { shadeBottom: 0.8 });
    g.tint(1).blob(0, 1.68, 0, [0.15, 0.07, 0.15], 0, '#ffffff');
    return g.build();
  });
}
// diving: arms straight over the head, body straight; turned about x as it falls
function diverGeo(skin) {
  return cached('dive' + skin, () => {
    const g = new Geo();
    g.box(-0.13, -0.95, -0.08, -0.02, -0.12, 0.08, skin); g.box(0.02, -0.95, -0.08, 0.13, -0.12, 0.08, skin);
    g.tint(1).cyl(0, -0.16, 0, 0.19, 0.16, 0.62, 6, '#ffffff', { smooth: false }).tint(0);
    g.box(-0.2, 0.42, -0.05, -0.12, 1.15, 0.05, skin); g.box(0.12, 0.42, -0.05, 0.2, 1.15, 0.05, skin);
    g.blob(0, 0.62, 0.02, 0.12, 0, skin, { shadeBottom: 0.8 }); g.blob(0, 0.68, -0.02, [0.125, 0.09, 0.12], 0, HAIR[1]);
    return g.build();
  });
}
function ladderGeo() {
  return cached('ladder', () => {
    const g = new Geo();
    for (const s of [-1, 1]) { g.push().rot('x', s * 0.2); g.box(-0.3, 0, -0.03, -0.25, 2.25, 0.03, '#b9a27c'); g.box(0.25, 0, -0.03, 0.3, 2.25, 0.03, '#b9a27c'); g.pop(); }
    g.push().rot('x', -0.2); for (let y = 0.4; y < 2.2; y += 0.42) g.box(-0.26, y, -0.04, 0.26, y + 0.05, 0.04, '#c8b28a'); g.pop();
    g.box(-0.3, 2.2, -0.12, 0.3, 2.28, 0.12, '#a8926e');
    return g.build();
  });
}
// the Old Graft's trees: short, broad, leaning, their trunks thick with age; russet fruit
function graftGeo() {
  return cached('graft', () => {
    const g = new Geo();
    g.tint(0.15).tube([[0, 0, 0], [0.25, 0.9, 0.1], [0.1, 1.7, 0.35], [0.45, 2.3, 0.3]], (u) => 0.42 - 0.2 * u, 6, '#6e5a46');
    g.tube([[0.15, 1.6, 0.3], [-0.8, 2.3, 0.1], [-1.5, 2.6, -0.2]], 0.14, 5, '#6e5a46');
    g.tint(1).blob(0.5, 3.1, 0.3, [2.4, 1.3, 2.2], 1, '#ffffff', { lump: 0.25, seed: 4, shadeBottom: 0.75 });
    g.blob(-1.4, 2.8, -0.2, [1.5, 1.0, 1.4], 0, '#ffffff', { lump: 0.25, seed: 7, shadeBottom: 0.75 });
    g.tint(0);
    const rng = makeRng('russets');
    for (let i = 0; i < 22; i++) { const a = rng.f(0, TAU), r = rng.f(1.0, 2.3); g.blob(0.3 + Math.cos(a) * r, rng.f(2.2, 3.0), 0.2 + Math.sin(a) * r * 0.9, 0.09, 0, rng.pick(['#9a6a34', '#8a5a2c', '#a87a3e'])); }
    return g.build();
  });
}

// ---------------------------------------------------------------- places
// winter tents: ridged white cloth over whole sections, held at four degrees for six weeks
function tentsInto(g, lay) {
  for (const t of lay.tents) {
    const n = Math.max(1, Math.round((t.x1 - t.x0) / 18)), bw = (t.x1 - t.x0) / n, E = 2.6, R = 7.2, z0 = t.z0, z1 = t.z1, ce = 0.07;
    for (let k = 0; k < n; k++) {
      const x0 = t.x0 + bw * k, x1 = x0 + bw, xm = x0 + bw / 2;
      g.quad([x0, E, z1], [xm, R, z1], [xm, R, z0], [x0, E, z0], '#eef3f5', ce);
      g.quad([xm, R, z1], [x1, E, z1], [x1, E, z0], [xm, R, z0], '#c9d3d8', ce);
      g.tri([x0, E, z0], [xm, R, z0], [x1, E, z0], '#d8e0e4', ce); g.tri([x1, E, z1], [xm, R, z1], [x0, E, z1], '#d8e0e4', ce);
      g.quad([x1, 0, z0], [x0, 0, z0], [x0, E, z0], [x1, E, z0], k % 2 ? '#dfe6e9' : '#cfd8dc', ce); g.quad([x0, 0, z1], [x1, 0, z1], [x1, E, z1], [x0, E, z1], k % 2 ? '#dfe6e9' : '#cfd8dc', ce);
      g.box(xm - 0.12, 0, z0 - 0.3, xm + 0.12, R + 0.3, z0, '#b9b4a6'); g.box(xm - 0.12, 0, z1, xm + 0.12, R + 0.3, z1 + 0.3, '#b9b4a6');
    }
    g.quad([t.x0, 0, z0], [t.x0, 0, z1], [t.x0, E, z1], [t.x0, E, z0], '#e3e8e8', ce); g.quad([t.x1, 0, z1], [t.x1, 0, z0], [t.x1, E, z0], [t.x1, E, z1], '#e3e8e8', ce);
    // a door at each end of the middle bay, warm light behind its flap
    const xd = t.x0 + bw * Math.floor(n / 2) + bw / 2;
    g.box(xd - 1.1, 0, z0 - 0.08, xd + 1.1, 2.2, z0 - 0.02, '#ffd9a0', { emit: 1.6 }); g.box(xd - 1.1, 0, z1 + 0.02, xd + 1.1, 2.2, z1 + 0.08, '#ffd9a0', { emit: 1.6 });
  }
}
// the Old Graft's fence: weathered posts and two rails, a gate on the lane
function graftFenceInto(g) {
  const x0 = GRAFT.x0 - 8, x1 = GRAFT.x1 + 2, z0 = GRAFT.z - 12, z1 = GRAFT.z + 14, gate = START.x + 26;
  const post = (x, z) => g.box(x - 0.07, 0, z - 0.07, x + 0.07, 1.25, z + 0.07, '#bdb29a', { top: '#d8cfba' });
  for (const z of [z0, z1]) {
    for (let x = x0; x <= x1; x += 2.6) post(x, z);
    for (const y of [0.55, 1.05]) {
      if (z === z0) { g.box(x0, y, z - 0.03, gate - 1.4, y + 0.09, z + 0.03, '#d2c8b0'); g.box(gate + 1.4, y, z - 0.03, x1, y + 0.09, z + 0.03, '#d2c8b0'); }
      else g.box(x0, y, z - 0.03, x1, y + 0.09, z + 0.03, '#d2c8b0');
    }
  }
  for (const x of [x0, x1]) { for (let z = z0; z <= z1; z += 2.6) post(x, z); for (const y of [0.55, 1.05]) g.box(x - 0.03, y, z0, x + 0.03, y + 0.09, z1, '#d2c8b0'); }
  g.box(gate - 1.45, 0, z0 - 0.1, gate - 1.3, 1.6, z0 + 0.1, '#8c7a5c'); g.box(gate + 1.3, 0, z0 - 0.1, gate + 1.45, 1.6, z0 + 0.1, '#8c7a5c');
  g.box(gate - 1.3, 0.3, z0 - 0.02, gate - 0.1, 1.15, z0 + 0.02, '#a8987a');
}

const IT = 1.1;     // the island's paved top, above its floor
function islandInto(g, glows) {
  // a quay of pale stone round a paved top a metre above the water
  const poly = []; const [hx, hz] = ISR, cr = 14;
  const corner = (cx, cz, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); poly.push([cx + Math.cos(a) * cr, cz + Math.sin(a) * cr]); } };
  corner(IS.x + hx - cr, IS.z + hz - cr, 0); corner(IS.x - hx + cr, IS.z + hz - cr, Math.PI / 2); corner(IS.x - hx + cr, IS.z - hz + cr, Math.PI); corner(IS.x + hx - cr, IS.z - hz + cr, Math.PI * 1.5);
  g.extrude(poly, -0.6, IT + 0.6, '#b5ab94', { top: '#d3c9b0' });
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; g.quad([a[0], IT + 0.01, a[1]], [b[0], IT + 0.01, b[1]], [b[0] * 0.97 + IS.x * 0.03, IT + 0.01, b[1] * 0.97 + IS.z * 0.03], [a[0] * 0.97 + IS.x * 0.03, IT + 0.01, a[1] * 0.97 + IS.z * 0.03], '#e4dccb'); }
  for (let x = IS.x - hx + 6; x < IS.x + hx - 4; x += 4.8) g.box(x, IT, IS.z - hz + 3, x + 0.08, IT + 0.012, IS.z + hz - 3, '#c4baa2');
  // the pavilion the lake bed sends up, on a podium beside the jetty: eight posts, a pale roof, and its core, where the
  // Last Stair comes up out of the lobbies below, lit
  const px = STAIR.x, pz = STAIR.z, PT = IT + STAIR.up;
  {
    const P0 = px - 8.2, P1 = px + 8.2, Q0 = pz - 8.2, Q1 = pz + 8.2, sd = '#c9c1ae', tp = { top: '#d8d0bc' };
    g.box(P0, IT, Q0, px - 2.6, IT + STAIR.up, Q1, sd, tp); g.box(px + 2.6, IT, Q0, P1, IT + STAIR.up, Q1, sd, tp);
    g.box(px - 2.6, IT, Q0, px + 2.6, IT + STAIR.up, pz - 3.2, sd, tp); g.box(px - 2.6, IT, pz + 2.6, px + 2.6, IT + STAIR.up, Q1, sd, tp);
  }
  for (let k = 0; k < 6; k++) g.box(px - 2, IT + k * (STAIR.up / 6), pz + 8.2 + (5 - k) * 0.5, px + 2, IT + (k + 1) * (STAIR.up / 6), pz + 8.7 + (5 - k) * 0.5, k % 2 ? '#d2c9b4' : '#c6bda8');
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + Math.PI / 8; g.cyl(px + Math.cos(a) * 7.2, PT, pz + Math.sin(a) * 7.2, 0.3, 0.26, 3.9, 5, '#ece6d8'); }
  g.cyl(px, PT + 3.9, pz, 9.0, 7.6, 0.55, 8, '#f1ece0', { smooth: false });
  g.cyl(px, PT + 4.45, pz, 7.6, 1.4, 1.5, 8, '#e0d8c6', { smooth: false });
  g.cyl(px, PT + 3.6, pz, 7.4, 7.4, 0.3, 8, '#ffe2ae', { smooth: false, cap: false, emit: 0.6 });
  // the core: open on the side toward the bench, the stair going down inside it, lit from the lobbies below
  const c0 = px - 2.6, c1 = px + 2.6, d0 = pz - 3.2, d1 = pz + 2.6, ch = PT + 3.6, wc = '#8e9aa0';
  g.box(c0, IT, d0, c1, ch, d0 + 0.3, wc); g.box(c0, IT, d0, c0 + 0.3, ch, d1, wc); g.box(c1 - 0.3, IT, d0, c1, ch, d1, wc);
  g.box(c0, PT + 2.5, d1 - 0.3, c1, ch, d1, wc);
  g.quad([c1 - 0.31, IT, d0 + 0.31], [c0 + 0.31, IT, d0 + 0.31], [c0 + 0.31, ch, d0 + 0.31], [c1 - 0.31, ch, d0 + 0.31], '#ffd9a0', 1.6);
  g.box(c0 + 0.3, IT, d0 + 0.3, c1 - 0.3, IT + 0.02, d1, '#ffe4b4', { emit: 2.4 });
  const nst = 8, rise = STAIR.up / nst, run = (d1 - d0 - 0.6) / nst;
  for (let k = 0; k < nst; k++) { const z1 = d1 - k * run, y = PT - k * rise; g.box(c0 + 0.32, y - rise, z1 - run, c1 - 0.32, y, z1, k % 2 ? '#bfb6a2' : '#ada28c', { top: k % 2 ? '#d6ccb4' : '#cbc1a8' }); }
  g.box(px - 1.6, PT + 2.6, d1 + 0.01, px + 1.6, PT + 2.95, d1 + 0.04, '#a8763a');
  glows.push({ p: [px, PT + 2.2, d1 - 0.8], color: '#ffd9a0', power: 6, size: 2.2 }, { p: [px, IT + 0.8, d0 + 1.2], color: '#ffd29a', power: 5, size: 2.4 });
  // the elders' bench: long, timber, facing back across the water to the Back Wall's windows
  const { x0, x1, z } = BENCH;
  g.box(x0, IT + 0.42, z - 0.28, x1, IT + 0.5, z + 0.24, '#9a7a56', { top: '#b08c64' });
  g.box(x0, IT + 0.55, z - 0.36, x1, IT + 1.0, z - 0.29, '#8a6c4c');
  for (let x = x0 + 0.3; x <= x1; x += 2.4) g.box(x - 0.06, IT, z - 0.3, x + 0.06, IT + 0.45, z + 0.2, '#5c4a38');
  // the jetty: planks on posts, lamps along it, a ladder down at the end, and a small dive stand
  const { x0: j0, x1: j1, z: jz, w, deck } = JET;
  for (let x = j0, k = 0; x < j1; x += 1.4, k++) g.box(x, deck - 0.12, jz - w / 2, Math.min(x + 1.36, j1), deck, jz + w / 2, k % 3 ? '#a08a6a' : '#b49e7c');
  for (let x = j0 + 2; x <= j1; x += 4) for (const s of [-1, 1]) g.cyl(x, -1.2, jz + s * (w / 2 - 0.1), 0.15, 0.15, deck + 1.1, 5, '#6f5e4a');
  for (let x = j0 + 6; x < j1; x += 14) { for (const s of [-1, 1]) { g.cyl(x, deck, jz + s * (w / 2 + 0.05), 0.06, 0.05, 3.2, 5, '#4a4b50'); glows.push({ p: [x, deck + 3.35, jz + s * (w / 2 + 0.05)], color: '#ffd29a', power: 5, size: 0.9, h: deck + 3.35 }); } }
  const sx = STAND.x, top = deck + STAND.h;
  for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) g.box(sx + dx - 0.09, deck, jz + dz - 0.09, sx + dx + 0.09, top, jz + dz + 0.09, '#7a6650');
  g.box(sx - 1.1, top - 0.14, jz - 1.1, sx + 1.1, top, jz + 1.1, '#b49e7c');
  g.box(sx + 1.1, top - 0.1, jz - 0.35, sx + 2.4, top - 0.02, jz + 0.35, '#c8b28a');
  for (const s of [-1, 1]) g.box(sx - 1.1, top, jz + s * 1.06 - 0.03, sx + 1.1, top + 0.9, jz + s * 1.06 + 0.03, '#8a7458');
  for (let y = deck + 0.3; y < top; y += 0.36) g.box(sx - 1.15, y, jz - 0.4, sx - 1.05, y + 0.05, jz + 0.4, '#8a7458');
  // lamp posts round the island's edge
  for (let i = 0; i < poly.length; i += 4) { const q = poly[i], x = IS.x + (q[0] - IS.x) * 0.93, zz = IS.z + (q[1] - IS.z) * 0.9; g.cyl(x, IT, zz, 0.07, 0.05, 3.6, 5, '#4a4b50'); g.cyl(x, IT + 3.6, zz, 0.2, 0.16, 0.36, 6, '#fff0c8', { emit: 2.6 }); glows.push({ p: [x, IT + 3.8, zz], color: '#ffd29a', power: 5, size: 0.9, h: IT + 3.8 }); }
}

// The Robe House: a long low house on the Stag shore, its front open to the water over a counter, robes on racks and
// shelves behind, broth urns steaming on the counter, a rope for the queue, benches beside it
function robeHouseInto(g, glows, steam) {
  const x = RH.x, z = RH.z, hx = 24, d0 = z - 5, d1 = z + 4.6, E = 3.3;
  const moss = '#5f6e46', moss2 = '#6c7c50', bronze = '#a8763a';
  g.box(x - hx - 1, 0, d0 - 0.8, x + hx + 1, 0.35, d1 + 1.2, '#cfc6b0', { top: '#ddd4be' });
  g.box(x - hx, 0.35, d0, x + hx, E, d0 + 0.3, moss);
  g.quad([x - hx, 0.36, d0 + 0.31], [x + hx, 0.36, d0 + 0.31], [x + hx, E - 0.1, d0 + 0.31], [x - hx, E - 0.1, d0 + 0.31], '#ffdcaa', 1.15);
  for (const s of [-1, 1]) g.box(x + s * hx - 0.15, 0.35, d0, x + s * hx + 0.15, E, d1, moss2);
  for (let k = -hx; k <= hx; k += 4.8) g.box(x + k - 0.14, 0.35, d1 - 0.3, x + k + 0.14, E, d1, '#e6dfcc');
  // the roof: a shallow pitch, deep eaves, bronze fascia
  const R0 = d0 - 1.4, R1 = d1 + 2.2, ry = E + 1.2, rm = (R0 + R1) / 2;
  g.quad([x - hx - 1.5, E + 0.05, R1], [x + hx + 1.5, E + 0.05, R1], [x + hx + 1.5, ry, rm], [x - hx - 1.5, ry, rm], '#4f5a3c');
  g.quad([x - hx - 1.5, ry, rm], [x + hx + 1.5, ry, rm], [x + hx + 1.5, E + 0.05, R0], [x - hx - 1.5, E + 0.05, R0], '#4a5538');
  g.quad([x + hx + 1.5, E - 0.25, R1], [x - hx - 1.5, E - 0.25, R1], [x - hx - 1.5, E + 0.05, R1], [x + hx + 1.5, E + 0.05, R1], bronze);
  g.tri([x - hx - 1.5, E + 0.05, R0], [x - hx - 1.5, ry, rm], [x - hx - 1.5, E + 0.05, R1], moss); g.tri([x + hx + 1.5, E + 0.05, R1], [x + hx + 1.5, ry, rm], [x + hx + 1.5, E + 0.05, R0], moss);
  g.quad([x + hx + 1.5, E + 0.04, R0], [x + hx + 1.5, E + 0.04, R1], [x - hx - 1.5, E + 0.04, R1], [x - hx - 1.5, E + 0.04, R0], '#3c3a30');
  // the counter, bronze-topped, and urns on it
  g.box(x - hx + 1, 0.35, d1 - 1.4, x + hx - 1, 1.3, d1 - 0.6, '#7a6a4c', { top: bronze });
  for (let k = -hx + 4; k < hx - 2; k += 6) {
    g.cyl(x + k, 1.3, d1 - 1.0, 0.32, 0.3, 0.7, 8, '#b8873e'); g.cyl(x + k, 2.0, d1 - 1.0, 0.3, 0.1, 0.12, 8, '#d9a85a');
    for (let i = 0; i < 5; i++) steam.push({ p: [x + k + (i - 2) * 0.08, 2.15, d1 - 1.0], color: '#f6efe2', power: 0.38, size: 1.0 + i * 0.3, move: [0.05 * (i - 2), 0.2, 0.42], loop: 5 + i * 0.7, twinkle: 0.2, phase: (k * 0.13 + i * 0.21) % 1 });
    glows.push({ p: [x + k, 2.9, d1 - 0.4], color: '#ffd8a0', power: 4, size: 0.8, h: 2.9 });
  }
  // racks of robes and shelves of folded ones behind the counter
  for (let k = -hx + 1.5; k < hx - 1; k += 0.62) g.box(x + k, 1.0, d0 + 0.45, x + k + 0.5, 2.7, d0 + 0.75, ROBES[Math.floor(Math.abs(k * 7.3)) % ROBES.length]);
  for (let k = -hx + 2; k < hx - 2; k += 3) for (let y = 0.6; y < 2.6; y += 0.5) g.box(x + k, y, d0 + 1.0, x + k + 2.4, y + 0.3, d0 + 1.6, ROBES[Math.floor(Math.abs(k + y * 3)) % ROBES.length]);
  // a stone edge and broad steps down into the water
  const sz = RH.shore;
  g.box(x - 34, 0, sz - 2.4, x - 14, 0.4, sz - 0.2, '#b9b09a'); g.box(x + 14, 0, sz - 2.4, x + 34, 0.4, sz - 0.2, '#b9b09a');
  for (let k = 0; k < 4; k++) g.box(x - 14, 0, sz - 2.4 + k * 1.1, x + 14, 0.4 - k * 0.12, sz - 1.3 + k * 1.1, k % 2 ? '#c8bfa8' : '#bdb49c');
  // the queue's rope, on short bronze posts, from the steps to the counter's end
  for (let k = 0; k <= 8; k++) { const px = x - 14 + k * 3.2; g.cyl(px, 0.35, d1 + 2.6, 0.05, 0.05, 0.95, 5, bronze); }
  g.box(x - 14, 1.2, d1 + 2.57, x + 11.6, 1.26, d1 + 2.63, '#c9b48a');
  // benches either side, where robed elders sit with their cups
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const bx = x + s * (hx + 5 + k * 3.4); g.box(bx - 1.3, 0.42, z - 3, bx + 1.3, 0.5, z + 3, '#9a7a56'); g.box(bx - 1.3, 0.5, z - 3, bx - 1.2, 0.95, z + 3, '#8a6c4c'); }
  for (let k = -hx; k <= hx; k += 8) glows.push({ p: [x + k, E - 0.4, d1 + 1.6], color: '#ffd29a', power: 4.5, size: 0.8, h: E - 0.4 });
}

// ---------------------------------------------------------------- dressing the flight
// Builds what the camera passes. Returns the live parts for update(): the diver, the splash, the lights.
function* dress(hollow, lay, path, ctx) {
  const frame = hollow.frame, rng = makeRng('sorrel-lake-dress'), D = ctx.density;
  const pts = path.points(0.5), low = pts.filter((q) => q.y < 70);
  let t0 = performance.now();
  const tick = function* (what) { if (performance.now() - t0 > 4) { yield what; t0 = performance.now(); } };
  const glows = [], steam = [], lod = [];
  const g = new Geo({ maxSeg: 16 });
  tentsInto(g, lay); yield 'tents';
  graftFenceInto(g); islandInto(g, glows); yield 'island';
  robeHouseInto(g, glows, steam); yield 'robe house';
  hollow.add(g.mesh(hollow.lit, frame));
  yield 'places';
  // the Old Graft's trees
  const graft = [];
  for (let x = GRAFT.x0, i = 0; x <= GRAFT.x1; x += 8, i++) graft.push({ p: [x + rng.f(-0.6, 0.6), 0, GRAFT.z + rng.f(-0.8, 0.8)], yaw: rng.f(0, TAU), scale: rng.f(0.9, 1.15), color: rng.pick(['#71843f', '#7a8a44', '#6a7c3c']) });
  hollow.add(instances(graftGeo(), hollow.lit, graft, { frame, cell: 400 }));

  // ---- Brush Rows: crews in Bee's gold and black on step-ladders, dabbing the blossom with brushes
  const ladders = [], brushers = [], crews = [];
  for (let gz = Math.floor((LANE_Z - 6) / 6); gz * 6 > LANE_Z - 160; gz--) {
    for (let gx = Math.floor(2358 / 7); gx * 7 < 2760; gx++) {
      const x = (gx + 0.5) * 7, z = (gz + 0.5) * 6, s = hollow.at(x, z);
      if (s.rows < 0.5 || lay.kind(x, z) !== 0) continue;
      const front = z > LANE_Z - 16, near = LANE_Z - z < 40 && x < 2620;
      const col = rng.pick(['#d8b040', '#2a2a28', '#e2c050', '#3a3630']);
      if (front) {
        // the row along the lane: ladders on the lane side of each tree, a brush up into the blossom
        if (hash2(gx, gz, 5) > 0.6) continue;
        const lx = x + rng.f(-0.9, 0.9);
        ladders.push({ p: [lx, 0, z + 2.8], yaw: 0 });
        brushers.push({ p: [lx, 1.25, z + 2.62], yaw: Math.PI + rng.f(-0.3, 0.3), color: col });
        if (hash2(gx, gz, 9) < 0.5) crews.push({ p: [lx + rng.f(-1.6, 1.6), 0, z + rng.f(3.8, 5.0)], yaw: Math.PI + rng.f(-0.8, 0.8), color: rng.pick(['#d8b040', '#2a2a28', '#c9a038']), walk: 0 });
        continue;
      }
      if (hash2(gx, gz, 5) > (near ? 0.35 : 0.12)) continue;
      const lx = x + 3.5;
      ladders.push({ p: [lx, 0, z], yaw: 0 });
      brushers.push({ p: [lx, 1.25, z], yaw: -Math.PI / 2 + rng.f(-0.3, 0.3), color: col });
      if (hash2(gx, gz, 9) < 0.3) crews.push({ p: [lx + rng.f(-1, 1), 0, z + rng.f(1.6, 2.6)], yaw: rng.f(0, TAU), color: rng.pick(['#d8b040', '#2a2a28', '#c9a038']), walk: 0 });
    }
    yield* tick('brush rows');
  }
  hollow.add(instances(ladderGeo(), hollow.lit, ladders, { frame, cell: 300 }));
  for (const skin of [SKINS[0], SKINS[2]]) hollow.add(instances(brushGeo(skin), hollow.lit, brushers.filter((_, i) => (i % 2 === 0) === (skin === SKINS[0])), { frame, cell: 300 }));
  hollow.add(crowd(crews, hollow.walk, { frame, seed: 'crews' }));
  yield 'brushers';

  // ---- elders walking the lane to the lake, a few with hand lamps
  const walkMat = litMaterial(hollow.rig, { bend: frame, drift: true, stride: 0.04 });
  const walkers = [], handLamps = [];
  const LX0 = 2120, LX1 = LK.x - LK.a + 30;
  for (let i = 0; i < Math.round(46 * D); i++) {
    const dir = rng.chance(0.82) ? 1 : -1, v = rng.f(0.75, 1.05), len = LX1 - LX0, w = len / v, side = rng.chance(0.5) ? 1 : -1;
    const z = LANE_Z + side * rng.f(4.4, 5.8), ph = rng();
    const it = { p: [dir > 0 ? LX0 : LX1, 0, z], yaw: dir > 0 ? Math.PI / 2 : -Math.PI / 2, drift: [dir * v, 0, 0, w], phase: ph, color: rng.pick(['#7a6a58', '#5a6470', '#8a7a62', '#6a5a6a', '#4a5a50', '#9a8a70']), skin: rng.pick(SKINS), hair: rng.pick(HAIR) };
    walkers.push(it);
    if (rng.chance(0.3)) handLamps.push({ p: [it.p[0] + 0.3 * dir, 0.85, z + 0.25], color: '#ffd08a', power: 4, size: 0.35, move: [dir * v, 0, 0], loop: w, phase: ph });
  }
  const byKey = new Map();
  for (const it of walkers) { const k = it.skin + it.hair; let a = byKey.get(k); if (!a) byKey.set(k, a = []); a.push(it); }
  for (const [, list] of byKey) hollow.add(instances(figureGeo(list[0].skin, 'stand'), walkMat, list, { frame, cell: 2000, drift: true }));
  yield 'walkers';

  // ---- Bench Island
  const sitters = new Map(), standers = [], climbers = [];
  const put = (map, key, item) => { let a = map.get(key); if (!a) map.set(key, a = []); a.push(item); };
  // the bench, in order of age: the oldest at its anti end, whitest
  const nB = Math.floor((BENCH.x1 - BENCH.x0 - 0.6) / 0.8);
  for (let i = 0; i < nB; i++) {
    if (rng.chance(0.06)) continue;
    const u = i / nB, hair = HAIR[Math.min(4, Math.floor(u * 4.2 + rng.f(-0.4, 0.4) + 0.4))] || HAIR[0];
    put(sitters, rng.pick(SKINS) + '|' + hair, { p: [BENCH.x0 + 0.5 + i * 0.8, IT + 0.46, BENCH.z - 0.04], yaw: rng.f(-0.12, 0.12), color: rng.pick(['#8a7f70', '#5e6a72', '#7a6650', '#a39886', '#5f7464', '#8c7a8a', '#d8d2c4', '#4f5f74']) });
  }
  // on the island: bathers about to go in, robes over shoulders, a few standing by the water
  for (let i = 0; i < 46; i++) {
    const x = IS.x + rng.f(-30, 28), z = IS.z + rng.f(-18, 18);
    if (Math.abs(z - BENCH.z) < 1.6 && x < BENCH.x1 + 1) continue;
    if (Math.abs(x - STAIR.x) < 9 && Math.abs(z - STAIR.z) < 9) continue;
    standers.push({ p: [x, IT, z], yaw: rng.f(0, TAU), color: rng.pick(SUITS), skin: rng.pick(SKINS), hair: rng.pick(HAIR), walk: rng.chance(0.3) ? rng.f(1, 3) : 0 });
  }
  // waiting along the jetty, and at the foot of the stand
  for (let x = JET.x0 + 4; x < JET.x1 - 4; x += rng.f(2.5, 7)) standers.push({ p: [x, JET.deck, JET.z + rng.f(-1, 1)], yaw: Math.PI / 2 + rng.f(-0.4, 0.4), color: rng.pick(SUITS), skin: rng.pick(SKINS), hair: rng.pick(HAIR), walk: 0 });
  // the Last Stair: climbing out of the core, then down the podium's steps toward the bench
  for (let i = 0; i < 14; i++) {
    const ph = i / 14;
    climbers.push({ p: [STAIR.x + rng.f(-0.6, 0.6), IT + 0.05, STAIR.z - 2.4], yaw: 0, drift: [0, STAIR.up / 9, 6.0 / 9, 9], phase: ph, color: rng.pick(['#7a6a58', '#5a6470', '#d8d2c4', '#6a5a6a']), skin: rng.pick(SKINS), hair: rng.pick(HAIR) });
    climbers.push({ p: [STAIR.x + rng.f(-0.8, 0.8), IT + STAIR.up, STAIR.z + 3.8], yaw: 0, drift: [0, 0, 0.62, 7], phase: ph, color: rng.pick(['#7a6a58', '#5a6470', '#d8d2c4', '#4a5a50']), skin: rng.pick(SKINS), hair: rng.pick(HAIR) });
    climbers.push({ p: [STAIR.x + rng.f(-1, 1), IT, STAIR.z + 12], yaw: -Math.PI * 0.6, drift: [-0.55, 0, 0.12, 30], phase: ph, color: rng.pick(['#8a7a62', '#5a6470', '#d8d2c4', '#6a5a6a']), skin: rng.pick(SKINS), hair: rng.pick(HAIR) });
  }
  for (const [k, list] of sitters) { const [skin, hair] = k.split('|'); hollow.add(instances(elderSitGeo(skin, hair), hollow.lit, list, { frame, cell: 400 })); }
  const sb = new Map(); for (const s of standers) put(sb, s.skin + '|' + s.hair, { ...s, walk: [s.walk, 0.5, rng.f(0, TAU), 0.03] });
  for (const [k, list] of sb) { const [skin, hair] = k.split('|'); hollow.add(instances(batherGeo(skin, hair), hollow.walk, list, { frame, cell: 400, walk: true })); }
  const cb = new Map(); for (const s of climbers) put(cb, s.skin + '|' + s.hair, s);
  for (const [k, list] of cb) { const [skin] = k.split('|'); hollow.add(instances(figureGeo(skin, 'stand'), walkMat, list, { frame, cell: 400, drift: true })); }
  yield 'island folk';

  // ---- the Robe House: the queue of wet swimmers along the rope, the robed with their cups, swimmers coming up the steps
  const queue = [], robed = [], upSteps = [];
  const qz = RH.z + 4.6 + 3.3;
  for (let i = 0; i < 26; i++) queue.push({ p: [RH.x - 14, 0.35, qz + rng.f(-0.25, 0.25)], yaw: Math.PI / 2, drift: [0.16, 0, 0, 160], phase: i / 26, color: rng.pick(SUITS), skin: rng.pick(SKINS), hair: rng.pick(HAIR) });
  for (let i = 0; i < 18; i++) upSteps.push({ p: [RH.x - 12 + rng.f(0, 24), -1.5, RH.shore + 7], yaw: Math.PI, drift: [rng.f(-0.1, 0.1), 0.155, -0.75, 12], phase: rng(), color: rng.pick(SUITS), skin: rng.pick(SKINS), hair: rng.pick(HAIR) });
  for (let i = 0; i < 70; i++) {
    const side = rng.sign(), x = RH.x + side * rng.f(16, 42), z = RH.z + rng.f(-6, 14);
    if (Math.abs(x - RH.x) < 24 && z < RH.z + 6) continue;
    if (z > RH.shore - 1) continue;
    robed.push({ p: [x, 0.35, z], yaw: rng.f(0, TAU), color: rng.pick(ROBES), skin: rng.pick(SKINS), hair: rng.pick(HAIR), walk: [rng.chance(0.35) ? rng.f(1, 4) : 0, 0.45, rng.f(0, TAU), 0.02] });
  }
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) for (let j = 0; j < 5; j++) { const bx = RH.x + s * (24 + 5 + k * 3.4); put(sitters, 'robe', { p: [bx - 0.75, 0.88, RH.z - 2.4 + j * 1.2], yaw: Math.PI / 2, color: rng.pick(ROBES), skin: rng.pick(SKINS), hair: rng.pick(HAIR) }); }
  for (let i = 0; i < 6; i++) robed.push({ p: [RH.x - 20 + i * 8 + rng.f(-1, 1), 0.35, RH.z + 1.2], yaw: 0, color: '#5f6e46', skin: rng.pick(SKINS), hair: rng.pick(HAIR), walk: [0, 0.4, 0, 0] });
  const rq = new Map(); for (const s of [...queue, ...upSteps]) put(rq, s.skin + '|' + s.hair, s);
  for (const [k, list] of rq) { const [skin, hair] = k.split('|'); hollow.add(instances(batherGeo(skin, hair), walkMat, list, { frame, cell: 400, drift: true })); }
  const rr = new Map(); for (const s of robed) put(rr, s.skin + '|' + s.hair, s);
  for (const [k, list] of rr) { const [skin, hair] = k.split('|'); hollow.add(instances(robedGeo(skin, hair), hollow.walk, list, { frame, cell: 400, walk: true })); }
  const rs = sitters.get('robe') || [];
  for (const it of rs) put(sitters, it.skin + '#' + it.hair, it);
  for (const [k, list] of sitters) { if (!k.includes('#')) continue; const [skin, hair] = k.split('#'); hollow.add(instances(elderSitGeo(skin, hair), hollow.lit, list, { frame, cell: 400 })); }
  yield 'robe house folk';
  return { glows, steam, handLamps, lod, low, pts, walkMat };
}

// Hundreds of old people swimming slowly: a stream from the island to the Robe House, others in long slow circles all
// over the lake, thickest where the flight comes low.
function* swimmers(hollow, ctx, walkMat) {
  const frame = hollow.frame, rng = makeRng('sorrel-swim'), D = ctx.density;
  const caps = ['#f4f1ea', '#e4dfd4', '#cdc8be', '#c94f4a', '#3f7fb5', '#e8b44a', '#5e9c98', '#f0e2c4', '#a898b4'];
  const circ = [[], []], lane = [[], []];
  const ok = (x, z) => inLake(x, z, -6) && !(Math.abs(x - IS.x) < ISR[0] + 8 && Math.abs(z - IS.z) < ISR[1] + 8) && !(x > JET.x0 - 2 && x < JET.x1 + 3 && Math.abs(z - JET.z) < 4);
  // the stream: from the island's water to the Robe House steps
  const A = [IS.x + 20, IS.z - 30], B = [RH.x, RH.shore + 9], len = Math.hypot(B[0] - A[0], B[1] - A[1]), dx = (B[0] - A[0]) / len, dz = (B[1] - A[1]) / len;
  for (let i = 0; i < Math.round(220 * D); i++) {
    const v = rng.f(0.4, 0.62), off = rng.f(-1, 1) * rng.f(0, 70), w = len / v;
    const x = A[0] - dz * off, z = A[1] + dx * off * 0.6;
    lane[i % 2].push({ p: [x, WY - 0.01, z], yaw: Math.atan2(dx, dz), drift: [dx * v, 0, dz * v, w], phase: rng(), color: rng.pick(caps) });
  }
  // circlers: near the island, by the Fox shore under the climb, and everywhere thinly
  const spots = [[IS.x, IS.z, 160, 260], [IS.x + 120, IS.z - 160, 200, 160], [LK.x - LK.a + 160, LK.z + 300, 200, 160], [RH.x, RH.shore + 60, 90, 90], [LK.x, LK.z, 1100, 650]];
  for (const [cx, cz, r, n] of spots) {
    for (let i = 0; i < Math.round(n * D); i++) {
      const a = rng.f(0, TAU), d = Math.sqrt(rng()) * r, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d * 0.8;
      if (!ok(x, z)) continue;
      const rad = rng.f(4, 30), sp = rng.f(0.35, 0.6) * (rng.chance(0.5) ? 1 : -1);
      if (!ok(x + rad, z) || !ok(x - rad, z) || !ok(x, z + rad) || !ok(x, z - rad)) continue;
      circ[i % 2].push({ p: [x, WY - 0.01, z], walk: [rad, Math.abs(sp), rng.f(0, TAU), 0.03], color: rng.pick(caps) });
    }
    yield 'swimmers';
  }
  // (the walk shader turns each to face along its circle)
  for (const k of [0, 1]) {
    hollow.add(instances(swimmerGeo(SKINS[k * 2]), hollow.walk, circ[k], { frame, cell: 1200, walk: true }));
    hollow.add(instances(swimmerGeo(SKINS[k * 2 + 1]), walkMat, lane[k], { frame, cell: 2400, drift: true }));
  }
  return circ[0].length + circ[1].length + lane[0].length + lane[1].length;
}

// ---------------------------------------------------------------- the diver
// Off the stand at the jetty's end, one after another. At half a g the fall takes half again as long as at home.
const GH = 9.81 * 0.5, V0 = 2.3, VX = 1.25;
const DIVE = { period: 6.5, wait: 1.4 };
const _m = new Matrix4(), _q = new Quaternion(), _e = new Euler(0, 0, 0, 'YXZ'), _p = new Vector3(), _s = new Vector3(1, 1, 1), _zero = new Matrix4().makeScale(0, 0, 0);
function liveMesh(geo, mat, n) { const m = new InstancedMesh(geo, mat, Math.max(1, n)); m.frustumCulled = false; for (let i = 0; i < n; i++) m.setMatrixAt(i, _zero); return m; }
function place(mesh, i, x, y, z, yaw, pitch, sc = 1) { _e.set(pitch, yaw, 0, 'YXZ'); _q.setFromEuler(_e); _s.set(sc, sc, sc); mesh.setMatrixAt(i, _m.compose(_p.set(x, y, z), _q, _s)); }
function diveState(u) {
  // u: seconds into this diver's turn. Returns [x, y, pitch, splash age or -1, shown]
  const top = JET.deck + STAND.h, x0 = STAND.x + 1.9, yc = top + 0.95;
  if (u < DIVE.wait) return [x0 - 0.4 + u * 0.25, yc, 0, -1, 1];
  const a = u - DIVE.wait, yv = yc + V0 * a - 0.5 * GH * a * a;
  const tIn = (V0 + Math.sqrt(V0 * V0 + 2 * GH * (yc - 0.2))) / GH;
  if (a < tIn) return [x0 + VX * a, yv, Math.min(2.6, (a / tIn) * 2.7), -1, 1];
  return [x0 + VX * tIn, -3, 0, a - tIn, 0];
}

// ---------------------------------------------------------------- the world
export const sorrelLake = {
  id: 'sorrel-lake',
  title: 'Lamp-dawn on the lake', drum: 'Sorrel', row: 'Herb Row', kind: 'a steady drum', light: 0.0,
  line: 'The old have the lake until nine. You come up through the ground among apple trees, and then you look up and keep looking.',
  tone: '#e8c99a', source: 'sorrel.md (The Hollow\'s plan; Landmarks, The Hollow), ashgrove.md (Day two)',
  sound: { root: 50, scale: 'lydian', pad: 0.5, air: 0.25, water: 0.6, crowd: 0.12, bells: 0.25, bright: 0.5 },
  *build(ctx) {
    const lay = sectionLayout();
    const plan = new Plan(ctx.q.plan);
    yield 'plan made';
    yield* paintSorrel(plan, lay);
    const pav = paintPavilions(plan, lay);
    yield 'pavilions';
    const WALL = {
      lit: 0.62, crowd: 0.08, garden: 0.8, stone: '#c6b89e', stone2: '#b6a284', houses: HOUR_COLS, houseMix: 0.32, winA: '#ffa858', winB: '#ffdcaa', winPower: 2.8,
      lifts: 16, awning: '#a8763a', gardenColor: '#7d9a58', pave: '#d6c8aa',
    };
    const hollow = yield* buildHollow(ctx, {
      seed: 'sorrel', plan, pavilions: false,
      light: { sun: '#ecd2a6', sunPower: 0.2, amb: '#7a8494', ambPower: 0.22, bounce: '#9aa08a', bouncePower: 0.18, ground: '#ffb868', groundPower: 0.3, air: '#9ea6b2', airDensity: 0.00006 },
      sunline: { power: 13, halo: 260, haloPower: 0.05 },
      ground: { canopy: '#6f8e4c', blossom: '#f0cfd6', fruit: '#c4502c', blossomShare: SHARE.blossom, fruitShare: SHARE.fruit, section: [lay.sx, lay.sz], rows: [7, 6], lamp: 0.75, lampColor: '#ffc27a', people: 0.6, sunRod: 13, wave: 0.014, stripes: 0.04, grain: 0.2 },
      front: WALL, back: WALL,
    });
    yield 'hollow';
    const scene = new Scene();
    scene.add(hollow.group);
    const frame = hollow.frame;

    // up out of the apples on the Ring Six lane, Old Graft on the right and Brush Rows on the left; over the crews and out
    // over the lake, high; down to Bench Island; across the swimmers to the Robe House; and away
    // (each key looks toward its target from a set distance: look points at very different distances from their keys
    // make the curve through them swing, and the camera stares at the paving or the water for a second)
    const K = (t, p, target, d) => {
      if (!target) return { t, p };
      const v = [target[0] - p[0], target[1] - p[1], target[2] - p[2]], n = Math.hypot(v[0], v[1], v[2]) || 1;
      return { t, p, look: [p[0] + (v[0] / n) * d, p[1] + (v[1] / n) * d, p[2] + (v[2] / n) * d] };
    };
    const path = makePath([
      K(0, [START.x, 2.3, START.z]),
      K(6, [START.x + 18, 2.5, START.z], [START.x + 120, 4.5, LANE_Z - 8], 90),
      K(11, [START.x + 68, 3.0, START.z - 0.5], [START.x + 125, 3.6, LANE_Z - 13], 90),
      K(16, [2462, 9, LANE_Z - 5], [2900, 170, 2380], 160),
      K(22, [2860, 90, 2420], [3800, 380, 2050], 260),
      K(29, [3460, 190, 2270], [3530, 560, 1250], 300),
      K(36, [4170, 100, 1975], [IS.x - 10, 2, IS.z + 5], 200),
      K(41.5, [IS.x - 36, 10, IS.z + 40], [IS.x - 4, 2, IS.z + 10], 80),
      K(45, [IS.x + 14, 8.5, IS.z + 31], [IS.x + 12, 2.2, IS.z + 2], 60),
      K(48.5, [IS.x + 68, 7, IS.z + 14], [STAND.x + 3, 3.5, JET.z], 60),
      K(53, [RH.x - 40, 15, RH.shore + 115], [RH.x - 4, 1.5, RH.z + 6], 80),
      K(57.5, [RH.x - 6, 7.5, RH.shore + 17], [RH.x + 5, 1.6, RH.z + 1], 70),
      K(61, [RH.x + 46, 34, RH.z - 66], [RH.x + 300, 230, RH.z - 480], 90),
      K(65, [RH.x + 150, 100, RH.z - 225]),
    ], { frame, entryRadius: 1.8, exitRadius: 30 });
    yield 'path';

    const dr = yield* dress(hollow, lay, path, ctx);
    const nSwim = yield* swimmers(hollow, ctx, dr.walkMat);
    const low = dr.low;
    const trees = yield* scatterTrees(hollow, { near: low, radius: 90, max: 7000 * ctx.density, wood: [{ kind: 'round', weight: 3 }, { kind: 'birch', weight: 1, tint: [1.2, 1.15, 0.9] }], orchard: { kind: 'apple' } });
    yield 'trees';
    hollow.lampPosts({ near: low, radius: 260, power: 3.6, color: '#ffcf8e' });
    yield 'lamp posts';
    const pitems = []; for (const q of pav) if (nearPath(low, q[0], q[1], C) < 700) pitems.push({ p: [q[0], 0, q[1]], yaw: (q[0] * 0.37) % 6.28 });
    hollow.add(instances(pavilionGeo(), hollow.lit, pitems, { frame, cell: 500 }));
    yield 'pavilions built';

    // the lights: lamps, the hand lamps on the lane, steam off the urns, and the lamps held in the water
    const lampGlow = hollow.glow([...dr.glows, ...dr.handLamps], { minPx: 1.2, maxPx: 50 });
    const steamGlow = hollow.glow(dr.steam, { minPx: 2, maxPx: 160, soft: 2.4 });
    const rpts = [];
    for (const f of plan.features) if (f.type === 'lamp' && Math.abs(lakeEdge(f.x, f.z) - 37) < 6) rpts.push({ p: [f.x, 4.5, f.z], color: '#ffc884', power: 3.2, size: 1.0 });
    for (const q of dr.glows) if (q.h) rpts.push({ p: [q.p[0], q.h, q.p[2]], color: q.color, power: 3.2, size: 0.9 });
    const refl = reflections(rpts, hollow, { far: 1300, stretch: 5 });
    scene.add(refl);
    const water = waterMesh(hollow, { lampColor: '#ffc27a', winA: WALL.winA, winB: WALL.winB, stone: WALL.stone, rod: 13, lamp: 1, lit: WALL.lit });
    scene.add(water);
    // the diver, and the ring a dive leaves
    const diver = liveMesh(diverGeo(SKINS[1]), litMaterial(hollow.rig, { bend: frame, soft: 0.3 }), 1);
    diver.setColorAt(0, new Color('#2d4a5c'));
    const ringG = new Geo(); for (let i = 0; i < 24; i++) { const a0 = (i / 24) * TAU, a1 = ((i + 1) / 24) * TAU; ringG.quad([Math.cos(a0), 0, Math.sin(a0)], [Math.cos(a0) * 0.8, 0, Math.sin(a0) * 0.8], [Math.cos(a1) * 0.8, 0, Math.sin(a1) * 0.8], [Math.cos(a1), 0, Math.sin(a1)], '#f2f6f2', 0.6); }
    ringG.blob(0, 0, 0, [0.45, 0.5, 0.45], 0, '#f4f8f4', { emit: 0.5 });
    const splash = liveMesh(ringG.build(), litMaterial(hollow.rig, { bend: frame, side: 'double', soft: 0 }), 1);
    scene.add(diver, splash);
    yield 'lights';

    // the dawn going on: a plain ramp, warm and then white; the lamps easing, a few windows going dark
    const rig = hollow.rig, sunC = new Color('#ecd2a6'), sunC2 = new Color('#f2e2c4'), sc = new Color();
    const look = { exposure: 2.05, bloom: 0.26, threshold: 0.78, saturation: 1.04, contrast: 1.06, vignette: 0.42, lift: [0.006, 0.004, 0.0], gain: [1.02, 1.0, 0.97] };
    const camF = refl.material.uniforms.uCamF.value, wu = water.material.uniforms;
    const DIVE_T = 48.2;            // a diver leaves the stand so as to be in the air as the flight passes the jetty
    function light(t) {
      const u = smoothstep(0, 65, t);
      sc.copy(sunC).lerp(sunC2, u);
      rig.set({ sun: sc, sunPower: 0.2 + 0.1 * u, sunFar: sc, sunFarPower: 0.2 + 0.1 * u, amb: '#7a8494', ambPower: 0.22 + 0.04 * u, ground: '#ffb868', groundPower: 0.3 - 0.08 * u });
      hollow.setRod(12 + 4 * u); wu.uSunRod.value = 12 + 4 * u;
      hollow.setNight(0.75 - 0.1 * u, WALL.lit - 0.06 * u); wu.uLit.value = WALL.lit - 0.06 * u; wu.uLamp.value = 0.8 - 0.1 * u;
      look.exposure = 2.0 - 0.12 * u;
    }
    light(0);
    return {
      scene, path, hollow, near: 0.5, far: 9000, look,
      portal: { mist: '#e8c99a' },
      stats: { swimmers: nSwim, trees: trees.count },
      update(t, dt, camera) {
        light(t);
        frame.local(camera.position, camF);
        if (camF.x < 0) camF.x += C;
        const u = (((t - DIVE_T) % DIVE.period) + DIVE.period) % DIVE.period + DIVE.wait + 0.55;
        const [x, y, pitch, age, shown] = diveState(u % DIVE.period);
        if (shown) place(diver, 0, x, y, JET.z, Math.PI / 2, pitch); else diver.setMatrixAt(0, _zero);
        diver.instanceMatrix.needsUpdate = true;
        if (age >= 0 && age < 3) place(splash, 0, x, WY + 0.04 - Math.max(0, age - 2.2) * 0.3, JET.z, 0, 0, 0.6 + age * 1.6); else splash.setMatrixAt(0, _zero);
        splash.instanceMatrix.needsUpdate = true;
      },
    };
  },
};
