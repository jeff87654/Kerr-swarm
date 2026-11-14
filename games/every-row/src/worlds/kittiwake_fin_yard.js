// Kittiwake, Gull Row: the swing school in Fin Yard. Kittiwake makes wing-sleeves and the whole drum flies
// (docs/wander-year.md, Day 60; the Kittiwake entry in games/three-nights/src/15-canon.js: Netside, Fin Yard, Sleeve
// Street, the palette "Feather grey" #1e2328 #5e6b78 #d6dde6 #fbfdff, "Gin near cost, never before flying", teachers
// of nine who call grown-ups "big aunt", broth at the flying hall gate, the motto "Aim wide", and Gull Row's saying
// that Kittiwake children "can't walk straight, only fly it"). Sleeves are hired "with your shoes kept as the
// deposit" (docs/sorrel.md, The Spindle), and fashion lives in linings (docs/ashgrove.md, Day one): the outsides
// are feather grey, the insides every colour, so a swinger is grey from above and bright from underneath.
//
// Before anyone is let near the flying hall they learn the stroke here, lying in a harness on a long cord over a net.
// The flight is one slow turn to the left. It starts low in Sleeve Street, past the hire counter's wall of shoes and
// the slate about gin; goes straight on under the net, looking up through it at four classes swinging very slowly
// while lane nine lets go on the count and lands on the net; comes up through the hatch at the net's front edge, past
// the crosswise slate; follows the net's edge anti-ward while the teacher overtakes on her cord, rises, lets go at
// the top, turns once and drops to the net in front of her beginners; turns round her into lane three, which is
// shut, and climbs it between the two biggest swings, over the eight that one of them draws; and at the top gallery,
// as a child steps off the jetty on the high cord, goes through the gate and into the lift for the flying hall (the
// next world, kittiwake_crosswise.js, begins at its gate). Deck 300 is y = 0; the yard is seven decks tall.
//
// The sums. Deck 300 is 1,804 m from the axis and the drum turns at w = 0.0572 rad/s, so the floor weighs
// g = w^2 r = 5.90 m/s^2 (0.6 g) and moves at V = w r = 103 m/s. The hooks are 27.4 m up, where g is 5.81.
//   - A cord of L = 20 m swings over and back in T = 2 pi sqrt(L / g) = 11.6 s when the swing is small, and a big
//     swing is slower: 11.8 s at 34 degrees, 12.0 at 41, 12.3 at 57. The classes here, on 20.4 to 21.3 m at 17 to 19
//     degrees, take 11.8 to 12.0 s; the beginners' cords (4.9 m down to 3.4 m) 5.8 s down to 4.8; the high cord
//     (8.4 m, let go at 73 degrees) 8.4 s. None of that is looked up: every cord's motion is integrated from the
//     forces below, once, when the world is built, and played back at its own period.
//   - The forces on a swinger, as the drum sees them (x spinward, y up, z along the axis, from the hook):
//       x'' = -T x / L + w^2 x + 2 w y'        y'' = -T y / L - w^2 (r_hook - y) - 2 w x'        z'' = -T z / L
//     the cord's pull T, the weight (which grows with depth), and the sideways push on anything that rises or falls.
//   - A swing along the axis is not quite a line. Rising you are pushed spinward and falling anti, at 2 w (your
//     vertical speed). The height goes as L theta^2 / 2, so that push comes and goes twice in every swing, as
//     w L theta0^2 Omega sin(2 Omega t) with Omega = 2 pi / T; and a pendulum pushed at twice its own rate answers a
//     third as far and the other way about. So the swinger draws a thin figure of eight, w L theta0^2 / (3 Omega) to
//     either side: 0.25 m at a swing of 34 degrees and 0.74 m at 57. The integration gives 0.26 and 0.77. The longest
//     cord here (21 m, swung to 52 degrees) draws an eight 1.4 m across and 33 m long, and the school has laced it
//     into the net in red tape: the tape is the track that same integration gives.
//   - The eight is a swing that repeats, and it has to be started right: every cord here is on its repeating swing,
//     which leaves the top with a little sideways speed (0.07 m/s for a class, 0.64 for the longest cord). Let go
//     from rest, a swing starts down one side of the eight and then opens and turns, further off its lane with each
//     pass: a 20 m cord let go level from the top gallery would reach 14 m/s and wander nine metres.
//   - A swing round the drum (crosswise) moves exactly as an ordinary pendulum under the hook's g, because there the
//     sideways push lies along the cord and only changes how hard it pulls. Going spinward at u you weigh more by the
//     factor (1 + u / V)^2 and coming back less: at 6.4 m/s, the bottom of a swing of 34 degrees, an eighth each way.
//     Nobody can see that, so a slate says it.
//   - Letting go. At the top of a crosswise swing you are still. A fall of 8 m at 0.6 g takes 1.65 s, and all that
//     way down you are pushed anti: you land w g t^3 / 3 = 0.5 m antispinward of plumb. The teacher's fall is
//     integrated from the same forces without the cord; a black cross on the net marks plumb and a red ring where
//     she comes down. Lane nine's children fall 3.9 m in 1.15 s and land only 8 cm anti: they leave the top of an
//     axial swing with the eight's sideways speed, spinward, which takes back half of the drift.
//   - Beginners hang on five short cords, each a little shorter than the last, so that they fall out of step and
//     come back into it every 116 seconds.
//
// Not canon (the docs give Kittiwake its trade, its flying, Fin Yard and Sleeve Street by name, the shoes kept as the
// deposit, the gin rule and the broth, and nothing else about its decks):
//   - the swing school itself: its cords, hooks, harnesses and nine lanes, the two crosswise lanes, the net, its
//     hatch and ladder, the red eight, the landing rings and crosses, the beginners' beam, the high cord from the top
//     gallery and its jetty, the count on which a class lets go
//   - Fin Yard's size (34 by 54 m, seven decks tall), its deck (300) and where it lies in the drum; its sheer walls,
//     galleries and lofts; Sleeve Street running along the axis and across the yard's floor under the net; the lift
//     on the top gallery
//   - the teacher being on a cord here (she and her red top are the next world's), every other swinger, the grown
//     visitors on lane six, the children waiting on the net
//   - what the lofts hold (cutting tables, bolts, offcuts by colour, sleeves hung by the wrists, a fitting), the
//     shoe wall's pigeonholes and tags, every price (a turn of the yard at 3 kays, linings turned for 5; remade
//     sleeves at 18 and gin at 0.18 are the docs' own figures) and the wording of every slate, plate and board
import {
  Scene, BufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, Mesh, ShaderMaterial,
  DoubleSide, Vector3, Sphere,
} from 'three';
import { makePath } from '../core/path.js';
import { DRUM, makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, street, frontage, lobby, Run, PALETTES, DOOR_IN } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG } from '../kit/mats.js';
import { Geo, rgb, shade } from '../kit/geo.js';
import { SKIN, CLOTH } from '../kit/folk.js';
import { makeRng, smoothstep, clamp } from '../core/rng.js';

const W = DRUM.OMEGA;
const RF = deckRadius(300);                        // the yard's floor: 1,804 m from the axis
// Fin Yard, in the frame of deck 300 (x spinward, y up, z toward the back wall)
const X0 = -17, X1 = 17, Z0 = -27, Z1 = 27, TOP = 28;
const HOOK = 27.4;                                 // the long cords' hooks, under the roof's lamps
const NET_Y = 4.3, NET_SAG = 0.8;                  // the net: tied off one storey up, hanging a little lower in the middle
const XS = 9, SW = 8;                              // Sleeve Street: it runs along the axis, in at the back wall and out at the front
const HATCH = [5.2, 13.8, -27, -22.3];             // the way up through the net, at its front edge over the street: x0, x1, z0, z1
// nine lanes along the axis, numbered from the anti wall. Lane three is shut, and the flight goes up it
const LANES = [-15.5, -12.5, -8.5, -4.5, 0.9, 4.0, 7.4, 10.5, 13.6];
const XL = LANES[2];
const ZA = -20.5, ZB = -15.5;                      // the two crosswise lanes at the front end
const XBEAM = -13.5;                               // the beginners' beam, along the anti wall

// ---------------------------------------------------------------- the physics of a cord
// s = [x, y, z, vx, vy, vz] from the hook; ra = the hook's distance from the axis. One step of Runge and Kutta's
// fourth-order rule, then back onto the sphere the cord allows.
const _k = [new Float64Array(6), new Float64Array(6), new Float64Array(6), new Float64Array(6)], _y = new Float64Array(6);
function bobDeriv(s, L, ra, o) {
  const fx = W * W * s[0] + 2 * W * s[4], fy = W * W * (s[1] - ra) - 2 * W * s[3];
  const tau = (s[3] * s[3] + s[4] * s[4] + s[5] * s[5] + s[0] * fx + s[1] * fy) / (L * L);
  o[0] = s[3]; o[1] = s[4]; o[2] = s[5]; o[3] = fx - tau * s[0]; o[4] = fy - tau * s[1]; o[5] = -tau * s[2];
}
function bobStep(s, dt, L, ra) {
  bobDeriv(s, L, ra, _k[0]);
  for (let i = 0; i < 6; i++) _y[i] = s[i] + _k[0][i] * dt / 2;
  bobDeriv(_y, L, ra, _k[1]);
  for (let i = 0; i < 6; i++) _y[i] = s[i] + _k[1][i] * dt / 2;
  bobDeriv(_y, L, ra, _k[2]);
  for (let i = 0; i < 6; i++) _y[i] = s[i] + _k[2][i] * dt;
  bobDeriv(_y, L, ra, _k[3]);
  for (let i = 0; i < 6; i++) s[i] += (_k[0][i] + 2 * _k[1][i] + 2 * _k[2][i] + _k[3][i]) * dt / 6;
  const l = Math.hypot(s[0], s[1], s[2]) / L; s[0] /= l; s[1] /= l; s[2] /= l;
  const rv = (s[0] * s[3] + s[1] * s[4] + s[2] * s[5]) / (L * L); s[3] -= rv * s[0]; s[4] -= rv * s[1]; s[5] -= rv * s[2];
}
// from the top of a swing along the axis, with sideways speed vx: on to the far top. Returns [x there, seconds]
function halfSwing(L, th0, vx, ra, dt) {
  const s = new Float64Array([0, -L * Math.cos(th0), L * Math.sin(th0), vx, 0, 0]);
  for (let i = 0, t = 0; i < 20000; i++, t += dt) {
    const pv = s[5], px = s[0];
    bobStep(s, dt, L, ra);
    if (i > 5 && pv < 0 && s[5] >= 0) { const f = pv / (pv - s[5]); return [px + (s[0] - px) * f, t + f * dt]; }
  }
  return [0, 12];
}
const NTAB = 240;
// a whole period from state s, as NTAB + 1 places (the last the same as the first)
function tabulate(s, T, L, ra) {
  const tab = new Float32Array((NTAB + 1) * 3), sub = 6, dt = T / (NTAB * sub);
  let wide = 0, fast = 0;
  for (let i = 0; i <= NTAB; i++) {
    tab[i * 3] = s[0]; tab[i * 3 + 1] = s[1]; tab[i * 3 + 2] = s[2];
    for (let k = 0; k < sub; k++) { bobStep(s, dt, L, ra); fast = Math.max(fast, Math.hypot(s[3], s[4], s[5])); }
  }
  for (let k = 0; k < 3; k++) tab[NTAB * 3 + k] = tab[k];
  return { tab, wide, fast };
}
/** The settled swing along the axis: the sideways speed at the top that brings the swinger back to her lane's line at the far top. A generator: `yield*` it. */
function* orbitAxial(L, deg, hookY = HOOK) {
  const th0 = deg * DEG, ra = RF - hookY, dt = 0.012;
  let a = 0, b = 0.05, fa = halfSwing(L, th0, a, ra, dt)[0];
  yield 'fin yard: swings';
  let fb = halfSwing(L, th0, b, ra, dt)[0];
  yield 'fin yard: swings';
  for (let i = 0; i < 12 && Math.abs(fb) > 1e-7 && fb !== fa; i++) { const c = b - fb * (b - a) / (fb - fa); a = b; fa = fb; b = c; fb = halfSwing(L, th0, b, ra, dt)[0]; yield 'fin yard: swings'; }
  const T = 2 * halfSwing(L, th0, b, ra, dt)[1];
  yield 'fin yard: swings';
  const o = tabulate(new Float64Array([0, -L * Math.cos(th0), L * Math.sin(th0), b, 0, 0]), T, L, ra);
  for (let i = 0; i < NTAB; i++) o.wide = Math.max(o.wide, Math.abs(o.tab[i * 3]));
  return { T, L, deg, vTop: b, ...o, cross: false };
}
/** A swing round the drum, from rest at its spinward top: it stays in its plane, and is an ordinary pendulum's. */
function orbitCross(L, deg, hookY = HOOK) {
  const th0 = deg * DEG, ra = RF - hookY, dt = 0.012, s = new Float64Array([L * Math.sin(th0), -L * Math.cos(th0), 0, 0, 0, 0]);
  let T = 12;
  for (let i = 0, t = 0; i < 20000; i++, t += dt) { const pv = s[3]; bobStep(s, dt, L, ra); if (i > 5 && pv < 0 && s[3] >= 0) { T = 2 * (t + dt * pv / (pv - s[3])); break; } }
  const o = tabulate(new Float64Array([L * Math.sin(th0), -L * Math.cos(th0), 0, 0, 0, 0]), T, L, ra);
  return { T, L, deg, vTop: 0, ...o, cross: true };
}
// where an orbit is, u of the way through its period (0 at its +z, or spinward, top)
function orbitAt(o, u, out) {
  const q = (u - Math.floor(u)) * NTAB, i = Math.min(NTAB - 1, Math.floor(q)), f = q - i, t = o.tab, a = i * 3;
  out[0] = t[a] + (t[a + 3] - t[a]) * f; out[1] = t[a + 1] + (t[a + 4] - t[a + 1]) * f; out[2] = t[a + 2] + (t[a + 5] - t[a + 2]) * f;
  return out;
}
/** Anything let go at p (flat, in the yard) with velocity v: its flight until it meets the height floorAt(x, z). Places every 1/60 s. */
function fallFrom(p, v, floorAt) {
  const pts = [], dt = 1 / 960, s = [p[0], p[1], p[2], v[0], v[1], v[2]];
  for (let i = 0; i < 9600; i++) {
    if (i % 16 === 0) pts.push(s[0], s[1], s[2]);
    if (s[1] <= floorAt(s[0], s[2]) && s[4] < 0) break;
    // the same forces without the cord: weight w^2 (r - y) downward, and 2 w across whatever moves up, down or round
    const ax = 2 * W * s[4], ay = -W * W * (RF - s[1]) - 2 * W * s[3];
    s[3] += ax * dt; s[4] += ay * dt;
    s[0] += s[3] * dt; s[1] += s[4] * dt; s[2] += s[5] * dt;
  }
  return { pts, time: (pts.length / 3 - 1) / 60, end: [s[0], s[1], s[2]], speed: -s[4] };
}

// ---------------------------------------------------------------- the net, as JavaScript knows it (its shader does the same sums)
const netBase = (x, z) => NET_Y - NET_SAG * (1 - (x / X1) * (x / X1)) * (1 - (z / Z1) * (z / Z1));
const NDENT = 20;
const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// turn v about the unit axis k by angle a
const turn3 = (v, k, a) => { const c = Math.cos(a), s = Math.sin(a), kv = cross3(k, v), d = dot3(k, v); return [v[0] * c + kv[0] * s + k[0] * d * (1 - c), v[1] * c + kv[1] * s + k[1] * d * (1 - c), v[2] * c + kv[2] * s + k[2] * d * (1 - c)]; };
const UP = [0, 1, 0];
const RING = 0.5;                  // the harness ring rides this far above a swinger's back (times her size)
// where its four lines meet her (across, along), and how they hang when nobody is in them
const HARNESS = [[0.16, 0.2], [-0.16, 0.2], [0.13, -0.3], [-0.13, -0.3]], LIMP = [[0.07, 0.05], [-0.07, 0.05], [0.05, -0.07], [-0.05, -0.07]];
const STAND = 1.31;                // a figure's middle above her feet (times her size)

// ---------------------------------------------------------------- the school: who hangs where, and when they let go
// Times are seconds of the flight. Everything a swinger does is a pure function of that clock, so the camera's way
// through them can be planned (and is checked, with ?debug, when the world is built).
const T_COUNT = 13.2;              // lane nine lets go, all five, on the count
const T_DROP = 35.5;               // the teacher lets go
const T_EIGHT = 42.0;              // the longest cord is at the front top of its swing
const T_SENIOR = 43.0;             // and lane four's
const T_CROSS = 20.4;              // lane B's swinger is at her spinward top: she comes down over the street as the flight nears the hatch
const T_STEP = 50.3;               // a child steps off the top gallery on the high cord
const GREYS = ['#aab4c0', '#8d99a8', '#c3ccd6', '#7d8a99', '#b6bfca', '#99a5b3'];
const LININGS = ['#e8563a', '#f2c14e', '#2f9e96', '#3f6fc0', '#ef8a2c', '#a34b86', '#6cc0dc', '#d93a5a', '#7bc47f'];
const JETTY_Z = 25.7;              // where the child on the high cord stands on her jetty, on lane five

function* makeSchool() {
  const rng = makeRng('fin-yard-school');
  const riders = [], cords = [], orbits = {};
  function* orbit(L, deg, cross, hookY) { const k = [L.toFixed(3), deg.toFixed(2), cross ? 1 : 0, hookY || HOOK].join('_'); if (!orbits[k]) { orbits[k] = cross ? orbitCross(L, deg, hookY) : yield* orbitAxial(L, deg, hookY); yield 'fin yard: swings'; } return orbits[k]; }
  const child = (lining, o = {}) => ({ cloth: rng.pick(GREYS), outer: rng.pick(GREYS), lining, skin: rng.pick(SKIN), look: [rng(), rng(), rng.chance(0.3) ? 1 : 0, rng()], pose: [rng.f(-0.04, 0.12), rng.f(0.02, 0.12), rng.f(0.08, 0.22)], scale: rng.f(0.68, 0.8), ...o });
  // a rider on a cord: hook, orbit, t0 (a second at which she is at her back-wall, or spinward, top), face (which way her head points)
  const ride = (o) => {
    const r = { face: 1, twist: 0.04, slop: 0, slopT: 9, stroke: [0.3, 2.9, 0], drop: null, kind: 'ride', ...o };
    r.cord = cords.length; cords.push({ hook: r.hook, rider: riders.length, kind: 'ride' }); riders.push(r);
    return r;
  };
  const hoist = (x, z) => cords.push({ hook: [x, HOOK, z], kind: 'hoist' });

  // four classes of five, each in step on its own lane and in its own lining, with a sixth cord hoisted out of the
  // way. Their cords differ by a hand or two, so the classes drift in and out of step with one another
  const CLASSES = [
    { lane: 0, L: 21.3, deg: 18, lining: '#f2c14e', t0: 3.1 },
    { lane: 6, L: 20.7, deg: 18.5, lining: '#2f9e96', t0: 8.4 },
    { lane: 7, L: 21, deg: 17, lining: '#ef8a2c', t0: 0 },
    { lane: 8, L: 20.4, deg: 19, lining: '#3f6fc0', t0: 5.6 },
  ];
  const classes = [];
  for (let ci = 0; ci < CLASSES.length; ci++) {
    const c = CLASSES[ci], ob = yield* orbit(c.L, c.deg), list = [];
    for (let k = 0; k < 5; k++) list.push(ride({ ...child(c.lining), hook: [LANES[c.lane], HOOK, -3.5 + k * 5.2], orbit: ob, t0: c.t0, dir: 'z', stroke: [0.34, 2.9, ci * 1.7], who: 'class' }));
    hoist(LANES[c.lane], 22.9);
    classes.push(list);
    yield 'fin yard: classes';
  }
  // lane nine, by the spin wall, lets go at the front top of its swing, all five, on the count; then each walks back
  // up the lane to the ledge
  {
    const list = classes[3], ob = list[0].orbit, n = Math.floor(T_COUNT / ob.T);
    list.forEach((r, k) => { r.t0 = T_COUNT - (n + 0.5) * ob.T; r.drop = { t: T_COUNT, top: 0.5, lie: 0.9 + 0.22 * ((k * 3) % 5), pace: 1.25, walk: [[LANES[8], 25.6 - 0.8 * (4 - k)]] }; });
  }
  // lane six: grown visitors, each with a third of the lane, swinging small and not straight
  for (const [i, z, deg, slop] of [[0, -3, 10, 0.45], [1, 9, 13, 0.5], [2, 21, 8, 0.35]]) ride({
    cloth: CLOTH[[0, 5, 3][i]], outer: GREYS[i], lining: '#e9edf2', skin: SKIN[[1, 4, 2][i]], look: [rng(), rng(), 0, rng()], pose: [0.3, 0.42, 0.9], scale: [1.02, 0.96, 1.05][i],
    hook: [LANES[5], HOOK, z], orbit: yield* orbit(20, deg), t0: rng.f(0, 11), dir: 'z', face: i === 1 ? -1 : 1, twist: 0.55, slop, slopT: 10.3 + i, stroke: [0.5, 1.7 + 0.3 * i, i * 2.1], who: 'visitor',
  });
  hoist(LANES[5], 3); hoist(LANES[5], 15.5);
  yield 'fin yard: visitors';
  // lane two: the longest cord, and the swing that draws the widest eight. Lane four: another big one. Lane three,
  // between them, is shut: its cords are up for splicing. The times put each at the front top of her swing as the
  // flight goes by
  const eob = yield* orbit(21, 52), sob = yield* orbit(20, 41);
  const eightRider = ride({ ...child('#d93a5a', { scale: 0.8 }), hook: [LANES[1], HOOK, 8.2], orbit: eob, t0: T_EIGHT - 3.5 * eob.T, dir: 'z', stroke: [0.22, 3.3, 0.4], who: 'eight' });
  yield 'fin yard: the eight';
  const senior = ride({ ...child('#a34b86', { scale: 0.78 }), hook: [LANES[3], HOOK, 9], orbit: sob, t0: T_SENIOR - 3.5 * sob.T, dir: 'z', stroke: [0.22, 3.1, 2.2], who: 'senior' });
  for (const z of [-6, 0, 6, 12]) hoist(XL, z);
  yield 'fin yard: seniors';
  // the crosswise lanes at the front end. The teacher's swing tops out 8 m above the net (from her middle to where
  // she lands), and she lets go at its anti top, in front of her beginners
  const TX = 3, landY = netBase(TX - 13.4, ZA) + 0.15 * 0.7;
  const tdeg = Math.acos((HOOK - (landY + 8)) / 20) / DEG, tob = yield* orbit(20, tdeg, true);
  const teacher = ride({
    cloth: '#e8563a', outer: '#fbfdff', lining: '#e8563a', skin: SKIN[0], look: [0.55, 0.5, 1, 0.733], pose: [0.0, 0.05, 0.12], scale: 0.7,
    hook: [TX, HOOK, ZA], orbit: tob, t0: T_DROP - 2.5 * tob.T, dir: 'x', face: -1, stroke: [0.2, 3.0, 1.0], who: 'teacher',
    drop: { t: T_DROP, top: 0.5, turns: 1, lie: 1.3, pace: 1.2, walk: [[-10.7, ZA + 2.2], [-10.7, ZA + 4.4]] },
  });
  yield 'fin yard: the teacher';
  const cob = yield* orbit(20, 34, true);
  ride({ ...child('#7bc47f'), hook: [4.3, HOOK, ZB], orbit: cob, t0: T_CROSS, dir: 'x', stroke: [0.3, 2.7, 0.3], who: 'cross' });
  hoist(-12, ZB);
  yield 'fin yard: crosswise';
  // the beginners: five short cords from a sloping beam by the anti wall, each a little shorter than the last, so that
  // they fall out of step and come back into it every 116 seconds (20 swings of the longest, 24 of the shortest)
  const ref = orbitCross(4, 22, 9.25), beginners = [];
  for (let i = 0; i < 5; i++) {
    const L = 4 * Math.pow(116 / (20 + i) / ref.T, 2), hy = 5.25 + L, ob = yield* orbit(L, 22, true, hy);
    beginners.push(ride({ ...child(LININGS[(i * 2 + 1) % 9], { scale: 0.5 + 0.02 * (4 - i) }), hook: [XBEAM, hy, -25 + i * 2], orbit: ob, t0: 8.2, dir: 'x', face: i % 2 ? -1 : 1, twist: 0.18, slop: 0.06, stroke: [0.55, 1.5 + 0.1 * i, i * 1.3], who: 'beginner', beam: true }));
    yield 'fin yard: beginners';
  }
  // lane five: the high cord. A child stands on the jetty of the top gallery with her back to the yard, the cord taut
  // from her harness to a hook 8 m out under the roof, and steps off backward: out over the whole school at 8 m/s, up
  // to the height she left, and back to the jetty in a little over eight seconds, where she can step on again. (A
  // 20 m cord from up there would start level, reach 14 m/s and wander nine metres off its lane: the sideways push
  // goes with speed. The sums were done and the school thought better of it.)
  const LL = 8.4, fallY = HOOK - (24 + STAND * 0.74), reach = Math.sqrt(LL * LL - fallY * fallY), lob = yield* orbit(LL, Math.asin(reach / LL) / DEG);
  const longRider = ride({ ...child('#6cc0dc', { scale: 0.74 }), hook: [LANES[4], HOOK, JETTY_Z - reach], orbit: lob, t0: T_STEP, dir: 'z', stroke: [0.1, 3, 0], kind: 'long', who: 'long' });
  cords[longRider.cord].kind = 'long';
  yield 'fin yard: the high cord';

  // what a drop needs: where she lets go, her fall, and her way off across the net
  for (const r of riders) {
    if (!r.drop) continue;
    const d = r.drop, q = orbitAt(r.orbit, d.top, [0, 0, 0]);
    d.p0 = add3(r.hook, q); d.fall = fallFrom(d.p0, r.orbit.cross ? [0, 0, 0] : [r.orbit.vTop, 0, 0], (x, z) => netBase(x, z) + 0.15 * r.scale);
    d.land = d.t + d.fall.time; d.up = d.land + d.lie; d.go = d.up + 0.9; d.pace = d.pace || 1.05;         // metres a second, across a net
    d.at = [d.fall.end[0], d.fall.end[2]];
    d.path = [d.at, ...d.walk]; d.len = [0];
    for (let i = 1; i < d.path.length; i++) d.len.push(d.len[i - 1] + Math.hypot(d.path[i][0] - d.path[i - 1][0], d.path[i][1] - d.path[i - 1][1]));
    yield 'fin yard: falls';
  }
  return { riders, cords, classes, teacher, eightRider, senior, longRider, beginners, orbits };
}

// ---------------------------------------------------------------- where everyone is at second t
// how far along her way off the net a dropper has got: [x, z, heading x, heading z, moving]
function walkAt(d, t, out) {
  const total = d.len[d.len.length - 1], s = clamp((t - d.go) * d.pace, 0, total);
  let i = 0; while (i < d.len.length - 2 && s > d.len[i + 1]) i++;
  const a = d.path[i], b = d.path[i + 1], seg = Math.max(d.len[i + 1] - d.len[i], 1e-6), k = (s - d.len[i]) / seg;
  // she turns a corner over her last step before it and her first after
  let hx = (b[0] - a[0]) / seg, hz = (b[1] - a[1]) / seg;
  if (i + 2 < d.path.length && d.len[i + 1] - s < 0.5) { const c = d.path[i + 2], l2 = Math.max(d.len[i + 2] - d.len[i + 1], 1e-6), w = 0.5 - (d.len[i + 1] - s); hx += ((c[0] - b[0]) / l2 - hx) * w; hz += ((c[1] - b[1]) / l2 - hz) * w; }
  if (i > 0 && s - d.len[i] < 0.5) { const p = d.path[i - 1], l0 = Math.max(d.len[i] - d.len[i - 1], 1e-6), w = 0.5 - (s - d.len[i]); hx += ((a[0] - p[0]) / l0 - hx) * w; hz += ((a[1] - p[1]) / l0 - hz) * w; }
  const hl = Math.hypot(hx, hz) || 1;
  out[0] = a[0] + (b[0] - a[0]) * k; out[1] = a[1] + (b[1] - a[1]) * k; out[2] = hx / hl; out[3] = hz / hl; out[4] = t > d.go && s < total ? 1 : 0;
  return out;
}
const _w = [0, 0, 0, 0, 0], _q = [0, 0, 0];
// The net's dents at second t, as [x, z, depth, radius]: a landing rings like a struck skin and dies away, and
// whoever is on the net carries a small dent about with her.
function netDents(school, t, out, still) {
  let n = 0;
  if (still) for (const d of still) out[n++] = d;
  for (const r of school.riders) {
    const d = r.drop;
    if (!d || t < d.land) continue;
    const tau = t - d.land;
    if (tau < 4.5 && n < NDENT) out[n++] = [d.at[0], d.at[1], 1.6 * r.scale * Math.exp(-2 * tau) * Math.sin(6.3 * tau), 1.7];
    if (n < NDENT) { walkAt(d, t, _w); out[n++] = [_w[0], _w[1], 0.2, 1.1]; }
  }
  out.length = n;
  return out;
}
function netAt(x, z, dents) {
  let y = netBase(x, z);
  for (const d of dents) { const dx = x - d[0], dz = z - d[1]; y -= d[2] * Math.exp(-(dx * dx + dz * dz) / (d[3] * d[3])); }
  return y;
}
// a swinger on her cord: S.pos (her middle), S.f (the way her head points), S.bk (her back: up the cord), S.ring
function onCord(r, t, S) {
  const o = r.orbit, q = orbitAt(o, (t - r.t0) / o.T, _q);
  if (r.slop) { const s = r.slop * Math.sin(6.2832 * t / r.slopT + r.look[3] * 9); if (o.cross) q[2] += s; else q[0] += s; const l = Math.hypot(q[0], q[1], q[2]) / o.L; q[0] /= l; q[1] /= l; q[2] /= l; }
  const c = [-q[0] / o.L, -q[1] / o.L, -q[2] / o.L], d = o.cross ? [r.face, 0, 0] : [0, 0, r.face], k = dot3(d, c);
  let f = nrm3([d[0] - k * c[0], d[1] - k * c[1], d[2] - k * c[2]]);
  if (r.twist) f = turn3(f, c, r.twist * Math.sin(0.43 * t + r.look[3] * 9));
  S.pos = add3(r.hook, q); S.f = f; S.bk = c; S.ring = add3(S.pos, c, RING * r.scale);
  S.flap = r.stroke[0] * Math.sin(6.2832 * t / r.stroke[1] + r.stroke[2]); S.walk = 0; S.on = true;
  return S;
}
// the child on the high cord: standing on the jetty, her back to the yard, until she steps off; and standing again
// each time the swing brings her back
function longState(r, t, S) {
  const o = r.orbit, tau = t - r.t0, u = tau > 0 ? tau / o.T : 0, q = orbitAt(o, u, _q);
  const c = [-q[0] / o.L, -q[1] / o.L, -q[2] / o.L], k = r.face * c[2], f = nrm3([-k * c[0], -k * c[1], r.face - k * c[2]]), sd = cross3(c, f);
  // how far the cord would lean her from upright as she stands there
  if (r.lean === undefined) { const q0 = orbitAt(o, 0, [0, 0, 0]), c0 = [-q0[0] / o.L, -q0[1] / o.L, -q0[2] / o.L], k0 = r.face * c0[2], f0 = nrm3([-k0 * c0[0], -k0 * c0[1], r.face - k0 * c0[2]]); r.lean = Math.atan2(dot3(cross3(UP, f0), cross3(c0, f0)), dot3(UP, f0)); }
  const w = u - Math.floor(u), back = -r.lean * (tau > 0 ? 1 - Math.min(smoothstep(0, 0.1, w), smoothstep(1, 0.9, w)) : 1);
  S.pos = add3(r.hook, q); S.f = turn3(f, sd, back); S.bk = turn3(c, sd, back); S.ring = add3(S.pos, c, RING * r.scale);
  S.flap = tau > 0 ? 0.12 * Math.sin(2 * t) : 0.05 * Math.sin(1.3 * t); S.walk = 0; S.on = true;
  return S;
}
function riderState(r, t, dents, S) {
  const d = r.drop;
  if (r.kind === 'long') return longState(r, t, S);
  if (!d || t < d.t) return onCord(r, t, S);
  S.on = false; S.ring = null;
  const lane = r.orbit.cross ? [r.face, 0, 0] : [0, 0, r.face];
  if (t < d.land) {
    // falling: a turn backward for those who are allowed one, and coming level for the net
    if (!d.f0) { const s0 = onCord(r, d.t, {}); d.f0 = s0.f; d.bk0 = s0.bk; d.sd = cross3(s0.bk, s0.f); d.level = Math.atan2(dot3(cross3(s0.bk, UP), d.sd), dot3(s0.bk, UP)); }
    const tau = t - d.t, qf = Math.min(d.fall.pts.length / 3 - 2, tau * 60), i = Math.floor(qf), fr = qf - i, a = i * 3, P = d.fall.pts;
    const ang = (d.level - 6.2832 * (d.turns || 0)) * smoothstep(0.05, 0.95 * d.fall.time, tau);
    S.pos = [P[a] + (P[a + 3] - P[a]) * fr, P[a + 1] + (P[a + 4] - P[a + 1]) * fr, P[a + 2] + (P[a + 5] - P[a + 2]) * fr];
    S.f = turn3(d.f0, d.sd, ang); S.bk = turn3(d.bk0, d.sd, ang); S.flap = 0.25; S.walk = 0;
    return S;
  }
  walkAt(d, t, _w);
  const x = _w[0], z = _w[1], y = netAt(x, z, dents), e = smoothstep(d.up, d.up + 0.8, t);
  // lying where she landed; then up, arms out for balance, turning to face the way she will go; then walking
  const yaw = Math.atan2(_w[2] * lane[2] - _w[3] * lane[0], _w[2] * lane[0] + _w[3] * lane[2]) * smoothstep(d.up + 0.4, d.go + 0.5, t);
  const h = t < d.go + 0.5 ? turn3(lane, UP, yaw) : [_w[2], 0, _w[3]];
  const f = nrm3(mix3(lane, UP, e)), bk0 = mix3(UP, [-h[0], 0, -h[2]], e), kk = dot3(bk0, f);
  S.f = e >= 1 ? add3(UP, h, 0.06) : f; S.bk = e >= 1 ? [-h[0], 0, -h[2]] : nrm3([bk0[0] - kk * f[0], bk0[1] - kk * f[1], bk0[2] - kk * f[2]]);
  S.walk = _w[4];
  S.pos = [x, y + (0.15 + (STAND - 0.15) * e) * r.scale + 0.04 * S.walk * Math.abs(Math.sin(t * 5.2 + r.look[3] * 9)), z];
  S.flap = 0.1 * e * Math.sin(t * 2.3 + r.look[3] * 5) + 0.12 * e;
  return S;
}
// the end of cord i at second t: where its ring is, with or without anyone hanging from it
function cordEnd(school, i, t, S) {
  const c = school.cords[i];
  if (c.kind === 'hoist') return [c.hook[0], c.hook[1] - 4.2, c.hook[2]];
  const r = school.riders[c.rider];
  if (S && S.ring) return S.ring;
  const o = r.orbit, q = orbitAt(o, (t - r.t0) / o.T, _q), k = (o.L - RING * r.scale) / o.L;
  return [c.hook[0] + q[0] * k, c.hook[1] + q[1] * k, c.hook[2] + q[2] * k];
}

// ---------------------------------------------------------------- a child in wing-sleeves: lying along +z, back up (+y)
// The shape is the flying hall's (kittiwake_crosswise.js), so that the same children fly there. The tint weight says
// what a face is: 1 top, 0.85 legs, 0.7 sleeve, 0.6 sleeve band, 0.5 hem and arm, 0.3 skin, 0.15 hair, 0 its own
// colour. A grown-up is about 1.8 m from crown to heel at size 1.
const S_SH = [0.19, 0.0, 0.25], S_EL = [0.5, 0.03, 0.37], S_WR = [0.82, 0.03, 0.46], S_HIP = [0.16, 0.0, -0.31];
const bez = (a, b, c, d, t) => { const u = 1 - t; return [0, 1, 2].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]); };
function sleeveGeo(g, s, n) {
  const X = (p) => [p[0] * s, p[1], p[2]];
  const lead = (t) => bez(S_SH, [0.3, 0.02, 0.31], [0.62, 0.03, 0.42], S_WR, t);
  const trail = (t) => bez(S_HIP, [0.44, 0.0, -0.2], [0.71, 0.02, 0.17], S_WR, t);
  const vs = [0, 0.13, 0.62, 0.8, 1], parts = [0.5, 0.7, 0.6, 0.7];
  const P = (i, j) => { const t = i / n, v = vs[j], a = lead(t), b = trail(t), q = mix3(a, b, v); q[1] += 0.05 * Math.sin(Math.PI * v) * Math.sin(Math.PI * Math.pow(t, 0.7)); return X(q); };
  for (let j = 0; j < 4; j++) {
    g.tint(parts[j]);
    for (let i = 0; i < n; i++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      if (s > 0) { g.tri(a, b, c, '#ffffff'); if (i < n - 1) g.tri(a, c, d, '#ffffff'); }
      else { g.tri(a, c, b, '#ffffff'); if (i < n - 1) g.tri(a, d, c, '#ffffff'); }
    }
  }
}
function taper(g, z0, w0, h0, z1, w1, h1, col) {
  const p = (z, w, h, sx, sy) => [sx * w / 2, sy * h / 2, z];
  const A = [p(z0, w0, h0, -1, -1), p(z0, w0, h0, 1, -1), p(z0, w0, h0, 1, 1), p(z0, w0, h0, -1, 1)];
  const B = [p(z1, w1, h1, -1, -1), p(z1, w1, h1, 1, -1), p(z1, w1, h1, 1, 1), p(z1, w1, h1, -1, 1)];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; g.quad(A[i], A[j], B[j], B[i], col); }
  g.quad(A[3], A[2], A[1], A[0], col); g.quad(B[0], B[1], B[2], B[3], col);
}
function flyerGeo() {
  const g = new Geo();
  g.tint(1); taper(g, 0.3, 0.4, 0.2, -0.33, 0.32, 0.18, '#ffffff');
  g.tint(0.3).blob(0, 0.03, 0.43, [0.1, 0.115, 0.115], 1, '#ffffff', { shadeBottom: 0.75 });
  g.tint(0.15).blob(0, 0.075, 0.4, [0.112, 0.1, 0.115], 0, '#ffffff', { shadeBottom: 0.85 });
  for (const s of [-1, 1]) {
    g.tint(0.5).tube([[0.17 * s, 0.0, 0.24], [S_EL[0] * s, S_EL[1], S_EL[2]], [S_WR[0] * s, S_WR[1], S_WR[2]]], 0.048, 6, '#ffffff');
    g.tint(0.3).blob(0.855 * s, 0.03, 0.475, 0.05, 0, '#ffffff', { shadeBottom: 0.8 });
    g.tint(0.85).tube([[0.085 * s, -0.01, -0.28], [0.12 * s, -0.02, -0.74], [0.15 * s, -0.03, -1.15]], (t) => 0.075 - 0.025 * t, 6, '#ffffff');
    g.tint(0).box(0.15 * s - 0.05, -0.09, -1.31, 0.15 * s + 0.05, 0.03, -1.13, '#2a2f36');
    sleeveGeo(g, s, 6);
  }
  g.tint(0);
  return g.build();
}
// Each is posed from JavaScript every frame: aPos, aF (head), aU (back). aLook: legs (below 0: the same grey as the
// top), hair, banded sleeves, seed. aPose: the stroke (radians at the wrist), legs apart, walking (0..1), size.
const FLYER_VERT = /* glsl */`
attribute vec4 aCol;
attribute vec3 aPos; attribute vec3 aF; attribute vec3 aU;
attribute vec3 aCloth; attribute vec3 aOuter; attribute vec3 aLining; attribute vec3 aSkin; attribute vec4 aLook; attribute vec4 aPose;
uniform float uClock;
${BEND_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vLin; varying float vSleeve; varying float vSide;
const vec3 LEGS[6] = vec3[6](vec3(0.042, 0.058, 0.08), vec3(0.028, 0.044, 0.102), vec3(0.147, 0.195, 0.262), vec3(0.195, 0.069, 0.027), vec3(0.479, 0.392, 0.246), vec3(0.023, 0.028, 0.037));
const vec3 HAIR[6] = vec3[6](vec3(0.02, 0.012, 0.008), vec3(0.08, 0.04, 0.02), vec3(0.3, 0.16, 0.06), vec3(0.55, 0.38, 0.18), vec3(0.17, 0.05, 0.02), vec3(0.008, 0.008, 0.01));
void main() {
  vec3 f = normalize(aF), bk = normalize(aU - f * dot(aU, f)), sd = cross(bk, f);
  float size = aPose.w, seed = aLook.w;
  vec3 p = position, n = normal;
  float side = sign(p.x);
  // legs: a little apart; an idle kick on the cord, a step on the net
  float lw = clamp((-0.3 - p.z) / 0.9, 0.0, 1.0) * step(abs(p.x), 0.32);
  p.x += side * aPose.y * lw * 0.35;
  p.y += (sin(uClock * 2.1 + seed * 40.0 + side * 1.7) * 0.06 * (1.0 - aPose.z) + sin(uClock * 5.2 + seed * 57.0) * side * 0.2 * aPose.z) * lw;
  // arms and sleeves: the stroke, bending up and down from the shoulder
  float reach = abs(p.x) - 0.19, aw = clamp(reach / 0.63, 0.0, 1.0) * step(-0.34, p.z), ang = aPose.x * aw;
  if (aw > 0.0) { p.x = side * (0.19 + reach * cos(ang)); p.y += reach * sin(ang); }
  // a child's head is bigger for her size
  if (size < 0.8 && p.z > 0.33 && abs(p.x) < 0.2) p = vec3(0.0, 0.04, 0.42) + (p - vec3(0.0, 0.04, 0.42)) * 1.25;
  p *= size;
  vec3 P = aPos + sd * p.x + bk * p.y + f * p.z;
  vec3 N = sd * n.x + bk * n.y + f * n.z;
  vF = P; vFN = N;
  kBend(P, N);
  vec3 P0 = aPos, B0 = bk; kBend(P0, B0);
  vSide = dot(normalize(cameraPosition - P0), B0);
  float part = aCol.a;
  vec3 col = aCol.rgb, lin = aCol.rgb;
  vSleeve = 0.0;
  if (part > 0.92) { col *= aCloth; lin = col; }
  else if (part > 0.77) { col *= aLook.x < 0.0 ? aCloth * 0.7 : LEGS[int(aLook.x * 5.99)]; lin = col; }
  else if (part > 0.65) { lin = col * aLining; col *= aOuter; vSleeve = 1.0; }
  else if (part > 0.55) { lin = col * aLining; col *= aLook.z > 0.5 ? aLining : aOuter; vSleeve = 1.0; }
  else if (part > 0.4) { col *= aLook.z > 0.5 ? aLining : aOuter; lin = col; vSleeve = 0.5; }
  else if (part > 0.22) { col *= aSkin; lin = col; }
  else if (part > 0.07) { col *= HAIR[int(aLook.y * 5.99)]; lin = col; }
  vCol = col; vLin = lin; vW = P; vN = N;
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
}`;
const flyerFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vLin; varying float vSleeve; varying float vSide;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  // a sleeve is feather grey above and its lining below; the lamps come through the cloth and light the lining
  vec3 col = mix(vCol, vLin, smoothstep(0.06, -0.06, vSide));
  vec3 up = kUp(vW);
  vec3 Ls = kLight(vW, normalize(mix(N, up, 0.3)), vF, normalize(mix(FN, vec3(0.0, 1.0, 0.0), 0.3)));
  Ls += kLight(vW, -N, vF, -FN) * 0.6 * vSleeve;
  gl_FragColor = vec4(kAir(col * Ls, vW), 1.0);
}`;
const bendOf = (frame) => ({ value: new Vector3(frame.a0, frame.z0, frame.floorR) });
function flyerMesh(deck, cap) {
  const base = flyerGeo(), g = new InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'aCol']) g.setAttribute(k, base.getAttribute(k));
  const mk = (name, size) => { const a = new InstancedBufferAttribute(new Float32Array(cap * size), size); g.setAttribute(name, a); return a; };
  const A = { pos: mk('aPos', 3), f: mk('aF', 3), u: mk('aU', 3), pose: mk('aPose', 4), cloth: mk('aCloth', 3), outer: mk('aOuter', 3), lining: mk('aLining', 3), skin: mk('aSkin', 3), look: mk('aLook', 4) };
  g.instanceCount = 0;
  const uni = { ...deck.rig.uniforms, uClip: G.uClip, uClock: { value: 0 }, uBend: bendOf(deck.frame) };
  const mesh = new Mesh(g, new ShaderMaterial({ uniforms: uni, vertexShader: FLYER_VERT, fragmentShader: flyerFrag(deck.rig), side: DoubleSide }));
  mesh.frustumCulled = false;
  return {
    mesh, uni, tris: base.getAttribute('position').count / 3,
    /** what figure i wears (once) */
    look(i, r) {
      A.cloth.array.set(rgb(r.cloth), i * 3); A.outer.array.set(rgb(r.outer), i * 3); A.lining.array.set(rgb(r.lining), i * 3); A.skin.array.set(rgb(r.skin), i * 3);
      A.look.array.set([r.suit === false ? r.look[0] : -1, r.look[1], r.look[2], r.look[3]], i * 4);
      for (const k of ['cloth', 'outer', 'lining', 'skin', 'look']) A[k].needsUpdate = true;
    },
    /** where figure i is and how she lies (every frame) */
    set(i, S, r) { A.pos.array.set(S.pos, i * 3); A.f.array.set(S.f, i * 3); A.u.array.set(S.bk, i * 3); const a = A.pose.array, k = i * 4; a[k] = S.flap; a[k + 1] = r.pose[1]; a[k + 2] = S.walk; a[k + 3] = r.scale; },
    done(n) { g.instanceCount = n; A.pos.needsUpdate = true; A.f.needsUpdate = true; A.u.needsUpdate = true; A.pose.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------- cords: thin ribbons from hook to ring, turned to the eye
// A cord is 16 mm thick and is seen from forty metres. One too thin to fill a pixel is drawn a pixel wide and fainter
// (but not as faint as its true share of the pixel: the cords are the picture), so that it stays a line.
const CORD_VERT = /* glsl */`
attribute vec3 aA; attribute vec3 aB; attribute vec2 aWd;      // its two ends (flat); its thickness in metres and how dark it is
${BEND_PARS}
uniform float uPx, uMinPx;
varying vec3 vW; varying float vA; varying float vShade;
void main() {
  vec3 A = aA, B = aB, n = vec3(0.0, 1.0, 0.0), n2 = vec3(0.0, 1.0, 0.0);
  kBend(A, n); kBend(B, n2);
  vec3 P = mix(A, B, position.y), view = cameraPosition - P;
  float shown = max(aWd.x, uMinPx * length(view) / uPx);
  P += normalize(cross(B - A, view) + vec3(1e-6, 0.0, 0.0)) * position.x * shown;
  vW = P; vA = pow(aWd.x / shown, 0.55); vShade = aWd.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(P, 1.0);
}`;
const CORD_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uCol;
varying vec3 vW; varying float vA; varying float vShade;
void main() {
  ${CLIP_FRAG}
  gl_FragColor = vec4(uCol * vShade, vA);
}`;
function cordMesh(deck, cap) {
  const g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const A = new InstancedBufferAttribute(new Float32Array(cap * 3), 3), B = new InstancedBufferAttribute(new Float32Array(cap * 3), 3), Wd = new InstancedBufferAttribute(new Float32Array(cap * 2), 2);
  g.setAttribute('aA', A); g.setAttribute('aB', B); g.setAttribute('aWd', Wd);
  g.instanceCount = 0;
  const mesh = new Mesh(g, new ShaderMaterial({
    uniforms: { uClip: G.uClip, uPx: G.uPx, uBend: bendOf(deck.frame), uMinPx: { value: 1.3 }, uCol: { value: new Vector3(...rgb('#232a33')) } },
    vertexShader: CORD_VERT, fragmentShader: CORD_FRAG, side: DoubleSide, transparent: true, depthWrite: false,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 5;
  return {
    mesh,
    set(i, a, b, w, shadeK) { A.array.set(a, i * 3); B.array.set(b, i * 3); Wd.array[i * 2] = w; Wd.array[i * 2 + 1] = shadeK; },
    done(n) { g.instanceCount = n; A.needsUpdate = true; B.needsUpdate = true; Wd.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------- the net
// A square mesh of white cord, 14 cm to a side, with a heavier rope every two metres, tied off at the walls and
// hanging 0.8 m lower in the middle. Close to, each cord is a line; far off or at a slant they close into a veil. It
// is lit from above, so from underneath it is a grey lattice against the lamps. Whoever lands in it or walks on it
// dents it (uDent: x, z, depth, radius). Tape laced into it (lane lines, the eight, landing rings) is drawn solid.
const NET_VERT = /* glsl */`
attribute vec4 aCol;      // a tape's colour, and 1; or 0 for the net itself
${BEND_PARS}
uniform vec4 uDent[${NDENT}]; uniform vec4 uNet;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vM; varying vec4 vCol;
float netY(vec2 q) {
  float y = uNet.x - uNet.y * (1.0 - q.x * q.x / (uNet.z * uNet.z)) * (1.0 - q.y * q.y / (uNet.w * uNet.w));
  for (int i = 0; i < ${NDENT}; i++) { vec2 d = q - uDent[i].xy; y -= uDent[i].z * exp(-dot(d, d) / (uDent[i].w * uDent[i].w)); }
  return y;
}
void main() {
  vec2 q = position.xz;
  float e = 0.25;
  vec3 p = vec3(q.x, netY(q) + position.y, q.y);
  vec3 n = normalize(vec3(netY(q - vec2(e, 0.0)) - netY(q + vec2(e, 0.0)), 2.0 * e, netY(q - vec2(0.0, e)) - netY(q + vec2(0.0, e))));
  vF = p; vFN = n; vM = q; vCol = aCol;
  kBend(p, n);
  vW = p; vN = n;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const netFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform float uCell, uRope, uMain, uMainW, uBelow; uniform vec3 uThread, uMainCol, uEye;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vM; varying vec4 vCol;
${rig.glsl}
// how much of a pixel p wide, at t, is covered by lines w wide standing at every whole number
float kLines(float t, float w, float p) {
  p = max(p, 1e-4);
  float a = t - 0.5 * p + 0.5 * w, b = t + 0.5 * p + 0.5 * w;
  float g1 = floor(a) * w + min(fract(a), w), g2 = floor(b) * w + min(fract(b), w);
  return clamp((g2 - g1) / p, 0.0, 1.0);
}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN), V = normalize(cameraPosition - vW);
  float ndv = dot(N, V), below = 0.0;
  if (ndv < 0.0) { N = -N; FN = -FN; ndv = -ndv; below = 1.0; }
  vec3 Lg = kLight(vW, N, vF, FN) * mix(1.0, uBelow, below);
  if (vCol.a > 0.5) { gl_FragColor = vec4(kAir(vCol.rgb * Lg, vW), 1.0); return; }
  vec2 d = vM / uCell, pw = fwidth(d);
  float w = uRope / uCell;
  float c1 = kLines(d.x, w, pw.x), c2 = kLines(d.y, w, pw.y);
  vec2 mm = vM / uMain, pm = fwidth(mm);
  float c3 = kLines(mm.x, uMainW / uMain, pm.x), c4 = kLines(mm.y, uMainW / uMain, pm.y);
  // cord is round: seen at a slant across its length it hides more of what is behind it (uEye: the eye, in the flat model)
  vec3 E = normalize(uEye - vF);
  float ey = max(abs(E.y), 0.12), kx = min(length(E.xy) / ey, 5.0), kz = min(length(E.zy) / ey, 5.0);
  c1 = 1.0 - pow(1.0 - c1, kx); c2 = 1.0 - pow(1.0 - c2, kz); c3 = 1.0 - pow(1.0 - c3, kx); c4 = 1.0 - pow(1.0 - c4, kz);
  float fine = 1.0 - (1.0 - c1) * (1.0 - c2), main = 1.0 - (1.0 - c3) * (1.0 - c4);
  float a = 1.0 - (1.0 - fine) * (1.0 - main);
  vec3 col = mix(uThread, uMainCol, main / max(fine + main, 1e-4));
  gl_FragColor = vec4(kAir(col * Lg, vW), a);
}`;
function netMesh(deck, school) {
  const pos = [], col = [], idx = [], step = 0.5, nx = Math.round((X1 - X0) / step), nz = Math.round((Z1 - Z0) / step);
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { pos.push(X0 + i * step, 0, Z0 + j * step); col.push(0, 0, 0, 0); }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const cx = X0 + (i + 0.5) * step, cz = Z0 + (j + 0.5) * step;
    if (cx > HATCH[0] && cx < HATCH[1] && cz > HATCH[2] && cz < HATCH[3]) continue;
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  // tape laced into the net along a line of [x, z] points, w wide
  const tape = (pts, w, colour, lift = 0.015) => {
    const c = rgb(colour), fine = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.5)); for (let k = 1; k <= n; k++) fine.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    const v0 = pos.length / 3;
    for (let i = 0; i < fine.length; i++) {
      const p = fine[Math.max(0, i - 1)], q = fine[Math.min(fine.length - 1, i + 1)], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, nxv = -(q[1] - p[1]) / l * w / 2, nzv = (q[0] - p[0]) / l * w / 2;
      pos.push(fine[i][0] + nxv, lift, fine[i][1] + nzv, fine[i][0] - nxv, lift, fine[i][1] - nzv); col.push(c[0], c[1], c[2], 1, c[0], c[1], c[2], 1);
      if (i) { const a = v0 + i * 2 - 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  };
  const ring = (x, z, r, w, colour) => { const pts = []; for (let i = 0; i <= 20; i++) pts.push([x + r * Math.cos(i * Math.PI / 10), z + r * Math.sin(i * Math.PI / 10)]); tape(pts, w, colour, 0.02); };
  // the hatch's edge, the lanes' lines, the two crosswise lanes
  tape([[HATCH[0], Z0 + 0.1], [HATCH[0], HATCH[3]], [HATCH[1], HATCH[3]], [HATCH[1], Z0 + 0.1]], 0.2, '#e8563a', 0.02);
  LANES.forEach((x, i) => { if (i !== 2 && i !== 4) tape([[x, -10.6], [x, Z1 - 0.4]], 0.05, '#7d8a99'); });
  tape([[-10.8, ZA], [X1 - 0.6, ZA]], 0.05, '#7d8a99'); tape([[-7.2, ZB], [X1 - 1.2, ZB]], 0.05, '#7d8a99');
  // the eight the longest cord draws, laced in red under it: the true track, from the same integration that moves her
  { const r = school.eightRider, t = r.orbit.tab, pts = []; for (let i = 0; i <= NTAB; i += 2) pts.push([r.hook[0] + t[i * 3], r.hook[2] + t[i * 3 + 2]]); tape(pts, 0.14, '#d93a5a', 0.025); }
  // where each of them lets go (a black cross under the spot: plumb) and where she comes down (a ring)
  for (const r of school.riders) {
    if (!r.drop) continue;
    const d = r.drop, big = r.who === 'teacher';
    ring(d.at[0], d.at[1], big ? 0.8 : 0.55, big ? 0.1 : 0.07, big ? '#e8563a' : r.lining);
    const cs = big ? 0.45 : 0.3;
    tape([[d.p0[0] - cs, d.p0[2]], [d.p0[0] + cs, d.p0[2]]], 0.07, '#1e2328', 0.03); tape([[d.p0[0], d.p0[2] - cs], [d.p0[0], d.p0[2] + cs]], 0.07, '#1e2328', 0.03);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('aCol', new Float32BufferAttribute(col, 4));
  g.setIndex(idx);
  g.boundingSphere = new Sphere(deck.frame.point(0, NET_Y, 0), 40);
  const uDent = { value: new Float32Array(NDENT * 4) };
  for (let i = 0; i < NDENT; i++) uDent.value[i * 4 + 3] = 1;
  const v3 = (c) => new Vector3(...rgb(c));
  const mesh = new Mesh(g, new ShaderMaterial({
    uniforms: {
      ...deck.rig.uniforms, uClip: G.uClip, uBend: bendOf(deck.frame), uDent, uNet: { value: [NET_Y, NET_SAG, X1, Z1] },
      uCell: { value: 0.14 }, uRope: { value: 0.008 }, uMain: { value: 2 }, uMainW: { value: 0.024 }, uThread: { value: v3('#f4f7fa') }, uMainCol: { value: v3('#d6dde6') }, uBelow: { value: 0.5 }, uEye: { value: new Vector3() },
    },
    vertexShader: NET_VERT, fragmentShader: netFrag(deck.rig), side: DoubleSide, transparent: true, depthWrite: false,
  }));
  mesh.renderOrder = 4;
  return { mesh, uDent, uEye: mesh.material.uniforms.uEye.value, tris: idx.length / 3 };
}

// ---------------------------------------------------------------- paint, and the flight
// Feather grey: pale walls, grey trim, white lamps in the yard; the street keeps a warmer lamp.
const FEATHER = {
  ...PALETTES.bright,
  walls: ['#d6dde6', '#cdd5df', '#dfe4ea', '#c8d0da', '#d9dfe6', '#e3e8ee'],
  dado: ['#9aa7b6', '#8d99a8', '#a8b3c0', '#7d8a99'],
  trim: ['#5e6b78', '#4a5560', '#6c7986', '#3a434e'],
  doors: ['#e8563a', '#2f9e96', '#f2c14e', '#3f6fc0', '#a34b86', '#5e6b78', '#ef8a2c', '#1e2328'],
  awnings: [['#e8563a', '#fbfdff'], ['#2f9e96', '#fbfdff'], ['#f2c14e', '#fbfdff'], ['#3f6fc0', '#f1f4f8'], ['#5e6b78', '#fbfdff']],
  signs: [['#1e2328', '#fbfdff'], ['#fbfdff', '#1e2328'], ['#5e6b78', '#fbfdff'], ['#e8563a', '#fbfdff'], ['#2f3b45', '#f2c14e'], ['#d6dde6', '#1e2328']],
  floor: '#aeb6c0', strip: '#8b95a1', court: '#c3cad3', ceiling: '#b9c1cb', rib: '#e3e8ee',
  rooms: ['#f0e6d2', '#e6ecf2', '#f2dcc8', '#dfe8e4', '#f6eedc', '#e9e2ee', '#eef0e0'],
  metal: '#8a939e', brass: '#b9a777', glass: '#cfe0ea',
  lamp: '#ffdfb4', window: ['#ffe0a8', '#fff0cf', '#fff6e6', '#ffd896'], shop: '#fff0d6',
};
// The flight is one long turn to the left. Along Sleeve Street toward the front, looking in at the hire counter;
// straight on under the net, tilting up at the lanes overhead as lane nine lets go; up through the hatch at the front
// edge, past the crosswise slate; anti-ward along the net's front edge while the teacher overtakes on the left, rises
// and lets go; round her as she gets up, and into lane three, which is shut; up it between the two big swings; and
// through the gate of the top gallery into the lift.
function flightKeys() {
  return [
    { t: 0, p: [XS - 0.3, 1.6, 49], look: [XS - 0.3, 1.6, 41] },
    { t: 4, p: [XS - 0.3, 1.6, 43.6], look: [XS - 3.6, 1.6, 36.4] },
    { t: 7.5, p: [XS - 0.3, 1.62, 36.5], look: [XS - 3.5, 1.7, 29.6] },
    { t: 10, p: [XS - 0.1, 1.7, 29.5], look: [XS - 0.5, 3.5, 19] },
    { t: 12, p: [XS, 1.9, 23.5], look: [XS + 2, 7, 11], fov: 62 },
    { t: 14.5, p: [XS, 2.0, 15.5], look: [XS + 3.4, 8.2, 5.5], fov: 64 },
    { t: 17.5, p: [XS, 2.0, 5.5], look: [XS + 1, 13, -3], fov: 64 },
    { t: 20.5, p: [XS, 2.0, -5], look: [XS - 1, 11.5, -14], fov: 62 },
    { t: 23, p: [XS, 2.2, -14], look: [XS - 1, 8.5, -22.5] },
    { t: 25.5, p: [XS, 2.6, -21.3], look: [XS - 1.6, 6.2, -27] },
    { t: 27.5, p: [XS, 4.7, -24.7], look: [5.4, 6.0, -27] },
    { t: 29.5, p: [8.5, 6.4, -25.3], look: [2, 6.6, -24.2] },
    { t: 32.5, p: [4.5, 7.0, -25.4], look: [0.5, 7.4, -21] },
    { t: 35.5, p: [-4.2, 7.5, -25.0], look: [-9.9, 10.75, -20.5], fov: 54 },
    { t: 37.2, p: [-6.6, 7.5, -23.4], look: [-10.4, 5.5, -20.4], fov: 54 },
    { t: 40, p: [XL, 7.9, -18], look: [XL - 3, 10.5, -8] },
    { t: 42, p: [XL, 8.8, -13.2], look: [XL - 0.8, 13.5, -3] },
    { t: 44, p: [XL, 10.2, -7.7], look: [XL, 10, 8] },
    { t: 46.5, p: [XL, 11.8, -1], look: [XL - 0.3, 10.5, 16] },
    { t: 50, p: [XL, 16, 10], look: [XL + 3.6, 22.6, 27] },
    { t: 53, p: [XL, 21.3, 18.5], look: [XL + 1.2, 24.4, 27.5] },
    { t: 55.5, p: [XL, 24.95, 23.6], look: [XL, 25.1, 31] },
    { t: 57.5, p: [XL, 25.1, 29.5], look: [XL, 25.1, 37] },
    { t: 59.3, p: [XL, 25.1, 32.7], look: [XL, 25.1, 40] },
  ];
}
// With ?debug: how near the flight comes to anyone, and to any cord, and when. Logged once, when the world is built.
function* checkFlight(path, school) {
  const S = {}, dl = [], near = [];
  let worst = [1e9, 0, ''], cordWorst = [1e9, 0, 0], t0 = performance.now();
  for (let t = 0; t <= path.duration; t += 0.2) {
    const c = path.flat(t), cx = c.x, cy = c.y, cz = c.z, dents = netDents(school, t, dl);
    for (let i = 0; i < school.cords.length; i++) {
      const cd = school.cords[i], r = cd.rider === undefined ? null : school.riders[cd.rider];
      if (r) {
        riderState(r, t, dents, S);
        const d = Math.hypot(S.pos[0] - cx, S.pos[1] - cy, S.pos[2] - cz);
        if (d < worst[0]) worst = [d, t, r.who + ' ' + cd.rider];
        if (d < 4.5) near.push(`${t.toFixed(1)}s ${r.who} ${d.toFixed(1)}m`);
      }
      // the nearest point of the cord, from its hook to its ring
      const e = cordEnd(school, i, t, r ? S : null), a = cd.hook, bx = e[0] - a[0], by = e[1] - a[1], bz = e[2] - a[2];
      const k = clamp(((cx - a[0]) * bx + (cy - a[1]) * by + (cz - a[2]) * bz) / (bx * bx + by * by + bz * bz), 0, 1);
      const d = Math.hypot(a[0] + bx * k - cx, a[1] + by * k - cy, a[2] + bz * k - cz);
      if (d < cordWorst[0]) cordWorst = [d, t, i];
    }
    if (performance.now() - t0 > 2) { yield 'fin yard: checking the flight'; t0 = performance.now(); }
  }
  console.log(`[fin-yard] nearest swinger ${worst[0].toFixed(2)} m at ${worst[1].toFixed(1)} s (${worst[2]}); nearest cord ${cordWorst[0].toFixed(2)} m at ${cordWorst[1].toFixed(1)} s (cord ${cordWorst[2]}); within 4.5 m: ${near.filter((_, i) => i % 3 === 0).join(', ') || 'nobody'}`);
  const o = school.orbits, list = Object.keys(o).map((k) => `${o[k].cross ? 'cross' : 'axial'} L ${o[k].L.toFixed(2)} at ${o[k].deg.toFixed(1)} deg: ${o[k].T.toFixed(2)} s, ${o[k].wide.toFixed(2)} m wide, ${o[k].fast.toFixed(1)} m/s`);
  console.log('[fin-yard] ' + list.join(' | '));
  for (const r of school.riders) if (r.drop) console.log(`[fin-yard] ${r.who} lets go at ${r.drop.t.toFixed(2)} s from ${r.drop.p0.map((v) => v.toFixed(2))}, falls ${r.drop.fall.time.toFixed(2)} s, lands ${(r.drop.fall.end[0] - r.drop.p0[0]).toFixed(2)} m spinward at ${r.drop.fall.speed.toFixed(1)} m/s`);
}

// ---------------------------------------------------------------- the yard itself
// a wall panel in a run's own co-ordinates (u along the wall, v into it), facing the yard
const wn = (g, u0, u1, y0, y1, v, col, e = 0) => g.quad([u1, y0, v], [u0, y0, v], [u0, y1, v], [u1, y1, v], col, e);
const ROOMS = ['#f3e7d0', '#efe2cc', '#e9edf2', '#f6ecd6', '#e6e0d6'];
// a finished pair of sleeves hung up by the wrists, lining outward: two fins from wrist to hip (c: a cloth Geo, seen from both sides)
function hungSleeves(c, u, y, v, lining, outer, s = 1) {
  for (const sd of [-1, 1]) {
    const w = [u + sd * 0.06, y, v], sh = [u + sd * 0.03, y - 0.78 * s, v], hip = [u + sd * 0.36 * s, y - 1.02 * s, v], mid = [u + sd * 0.25 * s, y - 0.45 * s, v];
    c.tri(w, sh, hip, lining, 0.22); c.tri(w, hip, mid, lining, 0.22);
    c.quad(w, mid, [mid[0] + sd * 0.05, mid[1] - 0.01, v - 0.004], [w[0] + sd * 0.045, w[1], v - 0.004], outer);      // the hem turned back: feather grey
  }
}
// A gallery bay: an opening behind a parapet, with a sleeve-maker's loft behind it lit by its own lamp
function gallery(deck, P, run, a, b, y0, wall, rng, o = {}) {
  const g = P.g, dep = o.dep || 2.6, H = 2.9, room = rng.pick(ROOMS), e = 0.5;
  wn(g, a, b, y0 + H, y0 + 4, 0, wall);
  g.box(a, y0, 0, a + 0.22, y0 + H, 0.3, wall, { skip: 'tbs' }).box(b - 0.22, y0, 0, b, y0 + H, 0.3, wall, { skip: 'tbs' });
  if (!o.open) g.box(a + 0.22, y0, 0, b - 0.22, y0 + 1.0, 0.14, shade(wall, 0.97), { skip: 'b', top: shade(wall, 0.78) });
  g.floor(a, 0, b, dep, y0 + 0.01, '#a9b1bb');
  wn(g, a, b, y0, y0 + H, dep, room, e);
  g.floor(a, 0, b, dep, y0 + H, shade(room, 0.8), { down: true, emit: e * 0.6 });
  if (o.fine) { g.quad([a, y0, dep], [a, y0, 0.3], [a, y0 + H, 0.3], [a, y0 + H, dep], room, e * 0.7); g.quad([b, y0, 0.3], [b, y0, dep], [b, y0 + H, dep], [b, y0 + H, 0.3], room, e * 0.7); }
  // what is in it: a rail of finished sleeves, bolts stood on end, or just a door
  const what = rng();
  if (what < 0.5) { g.box(a + 0.4, y0 + 2.5, dep - 0.3, b - 0.4, y0 + 2.54, dep - 0.26, '#5e6b78'); for (let u = a + 0.75; u < b - 0.6; u += rng.f(0.62, 0.9)) hungSleeves(P.c, u, y0 + 2.5, dep - 0.28, rng.pick(LININGS), rng.pick(GREYS), rng.f(0.85, 1.1)); }
  else if (what < 0.72) { const m = (a + b) / 2; g.box(m - 1.1, y0 + 0.78, dep - 1.3, m + 1.1, y0 + 0.84, dep - 0.5, '#d9ccb2').box(m - 0.9, y0 + 0.84, dep - 1.05, m + 0.7, y0 + 0.98, dep - 0.85, rng.pick(LININGS), { emit: 0.2 }); }
  else wn(g, (a + b) / 2 - 0.5, (a + b) / 2 + 0.5, y0, y0 + 2.1, dep - 0.02, rng.pick(deck.pal.doors), 0.1);
  if (o.fine) deck.glow([{ p: run.pt((a + b) / 2, y0 + H - 0.2, dep * 0.5), color: '#fff0d6', power: 1.1, size: 0.55 }]);
  // people at the parapet, watching
  if (!o.open && o.folk) for (let i = 0; i < o.folk; i++) deck.people([{ p: run.pt(rng.f(a + 0.6, b - 0.6), y0, 0.5), yaw: run.yaw + Math.PI + rng.f(-0.3, 0.3), child: rng.chance(0.35) }]);
}
// One wall of the yard: seven storeys of bays. Storeys 2, 4 and 6 are galleries; the others are sheer, with a loft's
// window here and there. Storey 0 (the lofts under the net) is a row of fronts made by the kit.
function* yardWall(deck, run, u0, u1, nb, rng, part, o = {}) {
  const pal = deck.pal, bw = (u1 - u0) / nb;
  for (let k = 0; k < nb; k++) {
    const a = u0 + k * bw, b = a + bw, mid = (a + b) / 2, P = deck.pen(run, mid, part), g = P.g;
    const wall = shade(pal.walls[(k * 5 + nb) % 6], rng.f(0.97, 1.03)), q = run.pt(mid, 12, 0), far = deck.dist(q[0], q[1], q[2]);
    wn(g, a, b, 3, 4, 0, wall);
    g.box(a, 3.9, -0.6, b, 4.26, 0, shade(wall, 0.92), { skip: 's' });                  // the ledge the net is tied off to
    for (let s = 1; s < 7; s++) {
      const y0 = s * 4;
      if (o.skip && o.skip(mid, s)) continue;
      if (s % 2 === 0) gallery(deck, P, run, a, b, y0, wall, rng, { open: !!(o.open && o.open(mid, s)), fine: far < 50, folk: rng.chance(far < 60 ? 0.75 : 0.3) ? Math.round(rng.i(1, 3) * deck.density) : 0 });
      else {
        wn(g, a, b, y0, y0 + 4, 0, wall);
        if (rng.chance(0.3) && !(o.bare && o.bare(mid, s))) {
          // a loft's window on the yard: a lit room, and in some a pair of sleeves hung up to be seen
          const w0 = mid - 1.3, w1 = mid + 1.3, room = rng.pick(ROOMS);
          g.box(w0 - 0.08, y0 + 1.0, -0.05, w1 + 0.08, y0 + 1.08, 0.02, shade(wall, 0.8)).box(w0 - 0.08, y0 + 2.6, -0.05, w1 + 0.08, y0 + 2.68, 0.02, shade(wall, 0.8));
          wn(g, w0, w1, y0 + 1.08, y0 + 2.6, -0.012, room, 0.75);
          if (rng.chance(0.4)) hungSleeves(P.c, mid + rng.f(-0.5, 0.5), y0 + 2.52, -0.03, rng.pick(LININGS), rng.pick(GREYS), 1.15);
        }
      }
      g.box(a, y0 - 0.12, -0.07, b, y0 + 0.05, 0, shade(wall, 0.88), { skip: 's' });      // a string course at every deck
    }
    g.box(a - 0.09, 4.26, -0.05, a + 0.09, o.skip && (o.skip(mid, 6) || o.skip(mid - bw, 6)) ? 24 : TOP, 0, shade(wall, 0.9), { skip: 'tbs' });    // where one house's paint meets the next
    P.done();
    if (deck.clk.due()) { yield 'fin yard: walls'; deck.clk.go(); }
  }
}
// ---------------------------------------------------------------- Sleeve Street: the fronts the flight passes
const SHOES = ['#c9563c', '#e2c14a', '#3a6ea5', '#2f9e96', '#7a4a2e', '#1e2328', '#d7d2c4', '#a34b86', '#6f9a3e', '#e8563a', '#f2c14e', '#5e3b26', '#3f6fc0', '#2f3b45', '#ef8a2c'];
// an open-fronted room behind a row's line: floor, three walls, a ceiling with a lamp, and a board over the opening
function openRoom(deck, P, b, run, H, o) {
  const g = P.g, a = b.u0 + 0.12, z = b.u1 - 0.12, dep = o.dep, hi = H - 0.2, e = o.glow === undefined ? 0.5 : o.glow, mid = (b.u0 + b.u1) / 2;
  g.floor(a, 0.2, z, dep, 0.015, o.floor || '#8f95a0');
  wn(g, a, z, 0, hi, dep, o.room, e);
  g.quad([a, 0, dep], [a, 0, 0.26], [a, hi, 0.26], [a, hi, dep], o.room, e * 0.75).quad([z, 0, 0.26], [z, 0, dep], [z, hi, dep], [z, hi, 0.26], o.room, e * 0.75);
  g.floor(a, 0.26, z, dep, hi, shade(o.room, 0.85), { down: true, emit: e * 0.5 });
  g.floor(mid - 1.2, dep * 0.45, mid + 1.2, dep * 0.45 + 0.24, hi - 0.01, '#fff3dc', { down: true, emit: 4 * deck.glowK });
  deck.glow([{ p: run.pt(mid, hi - 0.25, dep * 0.5), color: deck.pal.shop, power: 0.9 * deck.glowK, size: 1.4 }]);
  g.box(b.u0 + 0.24, 2.3, -0.05, b.u1 - 0.24, 2.86, 0.26, o.ground, { skip: 'b' }).box(b.u0 + 0.24, 2.24, -0.02, b.u1 - 0.24, 2.3, 0.26, '#5e6b78');
  if (H > 2.9) g.box(b.u0 + 0.24, 2.86, 0, b.u1 - 0.24, H, 0.26, b.wall, { skip: 'tb' });
  if (o.name) deck.sign(o.name, { run, at: run.pt(mid, 2.58, -0.056), maxW: b.u1 - b.u0 - 0.8, h: 0.44, style: 'board', font: o.font || 'serif', ground: o.ground, ink: o.ink || '#fbfdff' });
}
// The hire counter. Sleeves are hired by the turn "with your shoes kept as the deposit" (sorrel.md), so behind the
// counter is a wall of shoes (shoeWall, below).
function hireCounter(deck, P, b, run, H) {
  const g = P.g, rng = makeRng('fin-yard-counter'), dep = 2.7, mid = (b.u0 + b.u1) / 2;
  openRoom(deck, P, b, run, H, { dep, room: '#efe6d4', ground: '#1e2328', name: 'Sleeve hire' });
  // the counter, with a flap at one end; folded sleeves on it, lining side up, and the ledger
  g.box(b.u0 + 0.24, 0, -0.22, b.u1 - 1.3, 0.94, 0.36, '#9aa7b6', { skip: 'b', top: '#d6dde6' }).box(b.u1 - 1.3, 0.88, -0.22, b.u1 - 0.24, 0.94, 0.36, '#c3ccd6');
  for (let i = 0; i < 5; i++) { const x = b.u0 + 0.7 + i * 0.62; for (let j = 0; j < 1 + (i * 7) % 3; j++) g.box(x, 0.94 + j * 0.035, -0.08, x + 0.44, 0.975 + j * 0.035, 0.24, j % 2 ? rng.pick(GREYS) : rng.pick(LININGS), { skip: 'b' }); }
  g.box(mid + 0.9, 0.94, -0.05, mid + 1.4, 0.97, 0.26, '#f4ead2', { skip: 'b' });
  deck.sign(['One turn of the yard, 3 kays', 'Children, 1 kay', 'Your shoes are the deposit.', 'No shoes, no sleeves.'], { run, at: run.pt(b.u0 + 2.1, 0.5, -0.226), w: 2.9, h: 0.8, style: 'chalk', head: false });
  deck.sign(['Tag on the left shoe', 'Do not lose your half'], { run, at: run.pt(b.u1 - 2.2, 0.56, -0.226), w: 1.5, h: 0.42, style: 'card', font: 'cond', head: false });
  // the hirer and her help behind the counter; three people giving up their shoes
  deck.people([{ p: run.pt(mid + 0.45, 0, 0.95), yaw: run.yaw + Math.PI, color: '#9aa7b6' }, { p: run.pt(mid - 2.2, 0, 1.5), yaw: run.yaw + Math.PI - 0.5, color: '#5e6b78' }]);
  deck.people([{ p: run.pt(mid + 0.15, 0, -0.6), yaw: run.yaw + 0.2 }, { p: run.pt(mid + 0.75, 0, -0.62), yaw: run.yaw - 0.1, child: true }, { p: run.pt(mid + 3.1, 0, -0.58), yaw: run.yaw }]);
}
// The wall of shoes behind the hire counter: pigeonholes on the back wall and both side walls, a pair in most of them
// and a tag on every pair, a little over two hundred pairs in all. It is drawn a few cells at a time, between frames
function* shoeWall(deck, row) {
  const b = row.find('hire'), run = row.run, P = deck.pen(run, (b.u0 + b.u1) / 2, 'shoes'), g = P.g, rng = makeRng('fin-yard-shoes');
  const dep = 2.7, u0 = b.u0 + 0.14, u1 = b.u1 - 0.14, wood = '#b9a98c', dark = '#8d7f66';
  const y0 = 0.5, rh = 0.3, rows = 7, cw = 0.3, cd = 0.32, top = y0 + rows * rh;
  const pair = (place, small) => {
    const c = rng.pick(SHOES), l = small ? rng.f(0.15, 0.19) : rng.f(0.22, 0.27), h = small ? 0.055 : 0.075, e = 0.22;
    for (const s of [0.045, 0.17]) place(s, s + 0.085, l, h, c, e);
  };
  const nb = Math.floor((u1 - u0 - 0.1) / cw), ub = (u0 + u1) / 2 - nb * cw / 2;
  for (let r = 0; r <= rows; r++) g.box(ub, y0 + r * rh - 0.012, dep - cd, ub + nb * cw, y0 + r * rh + 0.012, dep, wood, { skip: 's' });
  for (let c = 0; c <= nb; c++) g.box(ub + c * cw - 0.01, y0, dep - cd, ub + c * cw + 0.01, top, dep, dark, { skip: 'tbs' });
  for (let r = 0; r < rows; r++) for (let c = 0; c < nb; c++) {
    if (rng() < 0.14) continue;
    const x = ub + c * cw, y = y0 + r * rh + 0.012;
    pair((a, z, l, h, col, e) => g.box(x + a, y, dep - 0.03 - l, x + z, y + h, dep - 0.03, col, { skip: 'bs', emit: e }), r < 2 && rng() < 0.6);
    wn(g, x + 0.128, x + 0.172, y - 0.075, y - 0.012, dep - cd - 0.006, '#f7efd8', 0.5);
    if (deck.clk.due()) { yield 'fin yard: shoes'; deck.clk.go(); }
  }
  for (const sd of [0, 1]) {
    const wu = sd ? u1 : u0, dir = sd ? -1 : 1, nv = Math.floor((dep - 0.4 - 0.75) / cw), v0 = 0.75;
    for (let r = 0; r <= rows; r++) g.box(Math.min(wu, wu + dir * cd), y0 + r * rh - 0.012, v0, Math.max(wu, wu + dir * cd), y0 + r * rh + 0.012, v0 + nv * cw, wood);
    for (let c = 0; c <= nv; c++) g.box(Math.min(wu, wu + dir * cd), y0, v0 + c * cw - 0.01, Math.max(wu, wu + dir * cd), top, v0 + c * cw + 0.01, dark, { skip: 'tb' });
    for (let r = 0; r < rows; r++) for (let c = 0; c < nv; c++) {
      if (rng() < 0.14) continue;
      const v = v0 + c * cw, y = y0 + r * rh + 0.012;
      pair((a, z, l, h, col, e) => g.box(Math.min(wu + dir * 0.03, wu + dir * (0.03 + l)), y, v + a, Math.max(wu + dir * 0.03, wu + dir * (0.03 + l)), y + h, v + z, col, { skip: 'b', emit: e }), r < 2 && rng() < 0.6);
    }
  }
  P.done();
  yield 'fin yard: shoes';
}
// A sleeve-maker's loft, open to the street: finished sleeves hung up by the wrists across the opening, linings
// outward; a cutting table; bolts on end. (Its offcuts, sorted by colour along the back wall, are offcutWall's)
function loft(deck, P, b, run, H, o) {
  const g = P.g, rng = makeRng('fin-yard-loft' + o.name), dep = 3.1, u0 = b.u0 + 0.3, u1 = b.u1 - 0.3, mid = (b.u0 + b.u1) / 2;
  openRoom(deck, P, b, run, H, { dep, room: o.room || '#f1e9d8', ground: o.ground, ink: o.ink, name: o.name, font: o.font });
  g.box(u0, 2.26, 0.1, u1, 2.3, 0.14, '#5e6b78');
  for (let u = u0 + 0.5, i = 0; u < u1 - 0.35; u += 0.8, i++) hungSleeves(P.c, u, 2.26, 0.12, o.linings[i % o.linings.length], GREYS[i % 6], 0.95 + 0.1 * ((i * 3) % 2));
  // the cutting table: a sleeve chalked out on grey cloth, its lining beside it, the shears
  const tu = mid - 0.3 * o.side, tv = 1.35;
  g.box(tu - 1.3, 0.8, tv - 0.55, tu + 1.3, 0.86, tv + 0.55, '#d9ccb2');
  for (const [x, v] of [[-1.2, -0.48], [1.2, -0.48], [-1.2, 0.48], [1.2, 0.48]]) g.box(tu + x - 0.04, 0, tv + v - 0.04, tu + x + 0.04, 0.8, tv + v + 0.04, '#8d7f66', { skip: 'tb' });
  g.floor(tu - 1.2, tv - 0.5, tu + 0.5, tv + 0.5, 0.865, '#aab4c0');
  g.tri([tu - 1.0, 0.872, tv + 0.35], [tu + 0.3, 0.872, tv + 0.1], [tu - 0.9, 0.872, tv - 0.4], '#fbfdff');
  g.tri([tu + 0.45, 0.872, tv + 0.42], [tu + 1.15, 0.872, tv + 0.2], [tu + 0.5, 0.872, tv - 0.35], o.linings[0], 0.2);
  g.box(tu + 0.6, 0.866, tv - 0.46, tu + 0.95, 0.885, tv - 0.4, '#3a434e');
  // bolts on end against one side wall, and lying on a rack
  const bu = o.side > 0 ? u1 - 0.16 : u0 + 0.16;
  for (let i = 0; i < 6; i++) g.cyl(bu - o.side * (0.05 + 0.02 * (i % 2)), 0, 0.7 + i * 0.3, 0.12, 0.12, rng.f(1.2, 1.7), 7, o.linings[(i * 2) % o.linings.length], { emit: 0.15, top: '#e9e2cf' });
  deck.people([{ p: run.pt(tu + 0.2, 0, tv + 0.95), yaw: run.yaw + Math.PI, color: '#8d99a8' }]);
  if (o.card) deck.sign(o.card, { run, at: run.pt(o.side > 0 ? b.u0 + 0.85 : b.u1 - 0.85, 0.62, 0.1), w: 0.95, h: 0.42, style: 'card', font: 'cond', head: false });
}
// Offcuts sorted by colour, in pigeonholes along a loft's back wall. Drawn a shelf at a time, between frames
function* offcutWall(deck, row, id, side) {
  const b = row.find(id), P = deck.pen(row.run, (b.u0 + b.u1) / 2, 'shoes'), g = P.g, dep = 3.1, u0 = b.u0 + 0.3, u1 = b.u1 - 0.3;
  // offcuts by colour: the hue goes once round along the wall, pale at the top
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const wheel = (h, s, l) => { const f = (n) => { const q = (n + h * 12) % 12; return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(q - 3, 9 - q, 1)); }; return [lin(f(0)), lin(f(8)), lin(f(4))]; };
  const a = u0 + (side > 0 ? 0 : 0.5), z = u1 - (side > 0 ? 0.5 : 0);
  for (let k = 0; k < 5; k++) {
    g.box(a, 0.42 + k * 0.42, dep - 0.34, z, 0.45 + k * 0.42, dep, '#b9a98c', { skip: 's' });
    for (let x = a + 0.04, i = 0; x < z - 0.2; x += 0.2, i++) g.box(x, 0.45 + k * 0.42, dep - 0.3, x + 0.17, 0.45 + k * 0.42 + 0.2 + 0.12 * ((i * 5 + k * 3) % 4) / 3, dep - 0.04, wheel((x - a) / (z - a) * 0.9, 0.62 - 0.06 * k, 0.36 + 0.08 * k), { skip: 'bs', emit: 0.3 });
    if (deck.clk.due()) { yield 'fin yard: offcuts'; deck.clk.go(); }
  }
  P.done();
  yield 'fin yard: offcuts';
}
// A fitting: the customer stands on a low round block with her arms out while her sleeves are pinned. She is one of
// the school's own figures (see build()), so only the room is drawn here
function fittingRoom(deck, P, b, run, H) {
  const g = P.g, dep = 3.0, mid = (b.u0 + b.u1) / 2;
  openRoom(deck, P, b, run, H, { dep, room: '#e6ecf2', ground: '#5e6b78', name: 'Fittings', font: 'italic' });
  g.cyl(mid, 0.015, 1.55, 0.62, 0.62, 0.22, 12, '#c3ccd6', { smooth: false, top: '#e3e8ee' });
  // a tall glass on the side wall, a rail of sleeves waiting, a stool with the pin box
  g.box(b.u1 - 0.2, 0.3, 0.9, b.u1 - 0.14, 2.3, 2.1, '#cfe0ea', { emit: 0.55 }).box(b.u1 - 0.22, 0.24, 0.84, b.u1 - 0.13, 2.36, 0.9, '#8d7f66').box(b.u1 - 0.22, 0.24, 2.1, b.u1 - 0.13, 2.36, 2.16, '#8d7f66');
  g.box(b.u0 + 0.4, 2.0, dep - 0.3, b.u0 + 2.6, 2.04, dep - 0.26, '#5e6b78');
  for (let i = 0; i < 3; i++) hungSleeves(P.c, b.u0 + 0.8 + i * 0.75, 2.0, dep - 0.28, LININGS[(i * 3 + 2) % 9], GREYS[i], 0.9);
  deck.put('stool', { p: run.pt(mid + 1.1, 0, 0.9), yaw: 0, color: '#9aa7b6' });
  g.box(mid + 1.0, 0.48, 0.82, mid + 1.2, 0.54, 0.98, '#e8563a');
  deck.people([{ p: run.pt(mid - 0.75, 0, 1.7), yaw: run.yaw + Math.PI * 0.5, sit: true, color: '#8d99a8' }, { p: run.pt(mid + 0.55, 0, 2.25), yaw: run.yaw + Math.PI + 0.5, color: '#aab4c0' }]);
  deck.sign(['Remade sleeves', 'from 18 kays'], { run, at: run.pt(b.u0 + 0.85, 0.62, 0.1), w: 0.95, h: 0.42, style: 'card', font: 'cond', head: false });
}

const LOB = 8.5;                   // the lift lobby on the top gallery: this far to either side of lane three
const LOFT_TRADES = [['Sleeves', 'cloth'], ['Linings', 'cloth'], ['Hems and cuffs', 'cloth'], ['Offcuts', 'cloth'], ['Cord and splicing', 'none'], ['Harness', 'shoes'], ['Broth', 'pots'], ['Thread', 'jars'], ['Net mending', 'none'], ['Sleeves let out', 'cloth']];
function* buildYard(deck, school, ZW) {
  const pal = deck.pal, rng = makeRng('fin-yard-walls'), g = deck.bucket(0, 0, 'yard').g, wall = pal.walls[0];
  for (let x = X0; x < X1; x += 8.5) { const f = deck.bucket(x + 4, 0, 'yard').f; f.tint(0.5).floor(x, Z0, x + 8.5, Z1, 0, '#a3abb5', { emit: 0.55 }).tint(0); }
  yield 'fin yard: floor';
  // the four walls, each in its own run (u along it, v into it). Some stretches stay bare, for the boards on them
  const RB = new Run(0, 0, Z1, 0), RN = new Run(0, 0, Z0, 2), RA = new Run(X0, 0, 0, 3), RS = new Run(X1, 0, 0, 1), jx = LANES[4];
  yield* yardWall(deck, RB, X0, X1, 8, rng, 'yardB', { skip: (mid, s) => s === 6 && mid < 0, open: (mid, s) => s === 6 && mid > 0 && mid < 4.25, bare: (mid, s) => s === 1 || (s === 5 && mid < -4 && mid > -13) });
  yield* yardWall(deck, RN, -X1, -X0, 8, rng, 'yardN', { bare: (mid, s) => s === 1 });
  yield* yardWall(deck, RA, Z0, Z1, 12, rng, 'yardA', { bare: (mid, s) => s === 1 && mid < -13 });
  yield* yardWall(deck, RS, -Z1, -Z0, 12, rng, 'yardS', {});
  // under the net: the lofts and stalls of the yard's own floor, and the street's two mouths
  const fill = { mix: { shop: 2, stall: 1.5, wall: 0.25 }, bay: [4.4, 6], trades: LOFT_TRADES, lit: 0.95, awnings: 0.25, blades: 0.3 }, mouth = [{ from: XS - 3.5, to: XS + 3.5, kind: 'gap' }];
  yield* frontage(deck, RB, { from: X0, to: X1, height: 3, fill, part: 'floorB', fronts: mouth });
  yield* frontage(deck, RN, { from: -X1, to: -X0, height: 3, fill, part: 'floorN', fronts: mouth });
  yield* frontage(deck, RA, { from: Z0, to: Z1, height: 3, fill, part: 'floorA' });
  yield* frontage(deck, RS, { from: -Z1, to: -Z0, height: 3, fill, part: 'floorS' });
  yield 'fin yard: lofts';
  {
    // the top gallery on the back wall, over lanes one to four: the lift lobby, behind a parapet with a gate at lanes
    // two, three and four; and beside it lane five's jetty, where the high cord is let go
    const P = deck.pen(RB, XL, 'yard'), gg = P.g, dep = ZW - Z1, par = shade(wall, 0.97), cap = shade(wall, 0.78), a = XL - LOB, b = XL + LOB;
    wn(gg, a, b, 27, TOP, 0, wall);
    P.f.tint(0.5).floor(a, 0, b, dep, 24.01, pal.court, { emit: 0.5 }).tint(0);
    gg.floor(a, 0, b, dep, 27, pal.ceiling, { down: true, emit: 0.3 });
    gg.quad([a, 24, dep], [a, 24, 0], [a, 27, 0], [a, 27, dep], wall).quad([b, 24, 0], [b, 24, dep], [b, 27, dep], [b, 27, 0], wall);
    const gates = [LANES[1], XL, LANES[3]];
    let at = a;
    for (const x of gates) { gg.box(at, 24, 0, x - 0.95, 25.0, 0.14, par, { skip: 'b', top: cap }); at = x + 0.95; }
    gg.box(at, 24, 0, b, 25.0, 0.14, par, { skip: 'b', top: cap });
    for (const x of [LANES[1], LANES[3]]) gg.box(x - 0.95, 24.92, 0.04, x + 0.95, 24.97, 0.1, '#e8563a').box(x - 0.95, 24.45, 0.05, x + 0.95, 24.49, 0.09, '#5e6b78');      // lanes two and four: shut
    gg.box(XL - 0.95, 24, 0.02, XL - 0.89, 25.0, 0.12, '#5e6b78', { skip: 'b' }).box(XL + 0.89, 24, 0.02, XL + 0.95, 25.0, 0.12, '#5e6b78', { skip: 'b' });               // lane three's stands open
    gg.box(jx - 0.8, 23.84, -1.75, jx + 0.8, 24.0, 0.0, '#9aa7b6', { top: '#c3cad3' });
    for (const sd of [-1, 1]) { gg.box(jx + sd * 0.8 - 0.025, 24.9, -1.75, jx + sd * 0.8 + 0.025, 24.95, 0.0, '#5e6b78'); for (const v of [-1.72, -0.9, -0.05]) gg.box(jx + sd * 0.8 - 0.02, 24, v - 0.02, jx + sd * 0.8 + 0.02, 24.9, v + 0.02, '#5e6b78', { skip: 'tb' }); }
    gg.box(jx + 0.8, 24, 0, 4.03, 25.0, 0.14, par, { skip: 'b', top: cap });
    P.done();
    // someone to see her off, and people waiting for the lift
    deck.people([{ p: [jx + 1.5, 24, Z1 + 0.6], yaw: Math.PI + 0.5 }, { p: [XL + 3.2, 24, Z1 + 1.6], yaw: 0.4 }, { p: [XL + 3.9, 24, Z1 + 1.9], yaw: -1.2, child: true }, { p: [XL - 5.5, 24, Z1 + 0.5], yaw: Math.PI }, { p: [XL - 6.2, 24, Z1 + 0.5], yaw: Math.PI, child: true }]);
  }
  yield 'fin yard: top gallery';
  // the roof: white lamps from wall to wall, a few trusses, and under them a rail for the hooks of every lane
  for (let i = 0; i < 8; i++) {
    const x0 = X0 + i * 4.25, bb = deck.bucket(x0 + 2, 0, 'roof').g;
    for (let j = 0; j < 12; j++) bb.floor(x0 + 0.06, Z0 + j * 4.5 + 0.06, x0 + 4.19, Z0 + j * 4.5 + 4.44, TOP - 0.04, '#f7faff', { down: true, emit: rng.f(2.35, 2.5) });
    bb.floor(x0, Z0, x0 + 4.25, Z1, TOP, '#6b7480', { down: true });
    if (deck.clk.due()) { yield 'fin yard: roof'; deck.clk.go(); }
  }
  for (let j = 0; j <= 12; j += 2) g.box(X0, 27.62, Z0 + j * 4.5 - 0.1, X1, TOP, Z0 + j * 4.5 + 0.1, '#aab3bd', { skip: 't', emit: 0.5 });
  LANES.forEach((x, i) => g.box(x - 0.05, HOOK, i === 4 ? 15.5 : -10.6, x + 0.05, HOOK + 0.12, i === 4 ? 19.5 : Z1, '#4a5560', { skip: 't' }));
  g.box(-11, HOOK, ZA - 0.05, X1, HOOK + 0.12, ZA + 0.05, '#4a5560', { skip: 't' }).box(-13, HOOK, ZB - 0.05, X1, HOOK + 0.12, ZB + 0.05, '#4a5560', { skip: 't' });
  for (const c of school.cords) if (c.hook[1] === HOOK) g.box(c.hook[0] - 0.09, HOOK - 0.1, c.hook[2] - 0.09, c.hook[0] + 0.09, HOOK, c.hook[2] + 0.09, '#2f3640');
  yield 'fin yard: roof';
  // the beginners' beam, along the anti wall: it slopes, so that every child hangs at the same height on a cord of her
  // own length. Three arms hold it off the wall
  const bg = school.beginners, h0 = bg[0].hook, h4 = bg[4].hook, by = (z) => h0[1] + (z - h0[2]) * (h4[1] - h0[1]) / (h4[2] - h0[2]) + 0.1;
  g.tube([[XBEAM, by(-26), -26], [XBEAM, by(-16), -16]], 0.05, 6, '#8d99a8');
  for (const z of [-25.6, -21, -16.4]) g.tube([[XBEAM, by(z), z], [X0, by(z) + 0.9, z]], 0.035, 5, '#8d99a8');
  // the ladder up through the hatch, on the front wall beside the street's mouth
  { const lx = HATCH[1] - 0.5, lz = Z0 + 0.22; for (const s of [-0.24, 0.24]) g.box(lx + s - 0.02, 0, lz - 0.02, lx + s + 0.02, 5.5, lz + 0.02, '#c9bfa6', { skip: 'b' }); for (let y = 0.3; y < 5.4; y += 0.32) g.box(lx - 0.24, y - 0.015, lz - 0.02, lx + 0.24, y + 0.015, lz + 0.02, '#8a7d66'); }
  yield 'fin yard: fittings';
}
// The yard's words: lane numbers at both ends of every lane, the school's boards and slates
function yardSigns(deck) {
  const dark = '#2c3330', chalk = '#eef0e8';
  LANES.forEach((x, i) => {
    deck.sign(String(i + 1), { at: [x, 4.58, Z0 + 0.04], n: [0, 1], w: 0.5, h: 0.5, style: 'plate', font: 'cond', ground: i === 2 ? '#e8563a' : '#fbfdff', ink: i === 2 ? '#fbfdff' : '#1e2328' });
    if (Math.abs(x - XS) > 3.4) deck.sign(String(i + 1), { at: [x, 4.58, Z1 - 0.04], n: [0, -1], w: 0.5, h: 0.5, style: 'plate', font: 'cond', ground: i === 2 ? '#e8563a' : '#fbfdff', ink: i === 2 ? '#fbfdff' : '#1e2328' });
  });
  for (const [z, name] of [[ZA, 'A'], [ZB, 'B']]) deck.sign(name, { at: [X1 - 0.04, 4.58, z], n: [-1, 0], w: 0.5, h: 0.5, style: 'plate', font: 'cond', ground: '#fbfdff', ink: '#1e2328' });
  // the crosswise slate, on the front wall where the hatch comes up: the one thing about a swing here that nobody can see
  const b = deck.bucket(4.6, Z0, 'yard').g;
  b.box(2.2, 4.92, Z0, 7.0, 7.6, Z0 + 0.04, '#8d7f66', { skip: 'n' });
  deck.sign(['Crosswise', 'Going spinward you weigh an eighth more.', 'Coming back, an eighth less.', 'Nobody can see it. You will feel it.', 'Letting go is for teachers.'], { at: [4.6, 6.26, Z0 + 0.08], n: [0, 1], w: 4.6, h: 2.5, style: 'chalk', ground: dark, ink: chalk });
  // over the beginners, what Gull Row says of Kittiwake's children, taken as praise
  deck.sign(["Can't walk straight.", 'Only fly it.'], { at: [X0 + 0.06, 6.35, -21], n: [1, 0], w: 6.4, h: 2.2, style: 'board', font: 'serif', ground: '#5e6b78', ink: '#fbfdff', head: false });
  // on the top gallery's parapet, either side of lane three's gate
  deck.sign('Aim wide.', { at: [XL + 2.0, 24.5, Z1 - 0.04], n: [0, -1], w: 1.9, h: 0.56, style: 'board', font: 'italic', ground: '#e8563a', ink: '#fbfdff' });
  deck.sign(['Lane 3 is shut', 'Cords up for splicing'], { at: [XL - 2.0, 24.5, Z1 - 0.04], n: [0, -1], w: 1.9, h: 0.56, style: 'plate', font: 'cond', font2: 'serif' });
  // under the lift gallery, straight ahead of anyone coming up lane three
  const c = deck.bucket(XL, Z1, 'yard').g;
  c.box(XL - 3.4, 20.2, Z1 - 0.04, XL + 3.4, 23.6, Z1, '#8d7f66', { skip: 's' });
  deck.sign(['Ready for the hall', 'Lane 1: all five', 'Lane 7: all but one', 'Lane 9: next week', 'Lane 2: yes, and she knows it', 'Big aunts: not yet'], { at: [XL, 21.9, Z1 - 0.08], n: [0, -1], w: 6.5, h: 3.2, style: 'chalk', ground: dark, ink: chalk });
}

export const kittiwakeFinYard = {
  id: 'kittiwake-fin-yard',
  title: 'The swing school', drum: 'Kittiwake', row: 'Gull Row', kind: 'a maker drum', light: 18.9,
  line: 'Before they let you near the hall you learn the stroke on a cord, swinging across Fin Yard with thirty children over a net. A swing takes twelve seconds up here. My teacher let go at the top of hers and did a turn, and I was told not to try that.',
  tone: '#d6dde6', source: 'wander-year.md (Day 60), sorrel.md (The Spindle), ashgrove.md (Day one)',
  sound: { root: 52, scale: 'lydian', pad: 0.4, air: 0.45, hum: 0.1, crowd: 0.5, bells: 0.15, bright: 0.7 },
  *build(ctx) {
    const frame = makeFrame(200 * DEG, 1650, RF);
    const path = makePath(flightKeys(), { frame, entryRadius: 1.1, exitRadius: 1.1 });
    const ex = path.exit.flat, ZW = ex.z - DOOR_IN;                 // the wall of lift doors on the top gallery
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'fin-yard', palette: FEATHER, light: { level: 1, ambUp: '#59606a', ambDown: '#474d56', ambPower: 0.85 }, floor: { shine: 0.9 }, clock: 'flight' });
    const rng = makeRng('fin-yard'), dens = ctx.density || 1;
    yield 'fin yard: path';
    const school = yield* makeSchool();
    yield 'fin yard: the school';
    if (ctx.engine && ctx.engine.opts && ctx.engine.opts.debug) yield* checkFlight(path, school);

    // ---- Sleeve Street: in at the back wall, across the yard's floor under the net, and out at the front
    const warm = ['#e8563a', '#ef8a2c', '#f2c14e', '#d93a5a', '#a34b86'], cool = ['#2f9e96', '#3f6fc0', '#6cc0dc', '#7bc47f', '#f2c14e'];
    const fill = { mix: { shop: 2, stall: 1, wall: 0.3 }, bay: [4.6, 6.2], trades: LOFT_TRADES, lit: 0.9, awnings: 0.3, blades: 0.4 };
    const lamps = { every: 6, grid: 30, kind: 'panel', power: 0.95 };
    const sleeve = yield* street(deck, {
      axis: 'z', from: Z1, to: 62, at: XS, y: 0, width: SW, lamps, cloth: 0.3, folk: { stand: 0, stroll: 0, walk: 0 }, fill, part: 'sa',
      plates: [{ at: 33.5, lines: ['Sleeve Street', 'to Fin Yard'] }],
      fronts: {
        anti: [
          { from: 43.5, to: 49.5, kind: 'custom', id: 'linings', draw: (P, b, run, H) => loft(deck, P, b, run, H, { name: 'Linings', ground: '#e8563a', side: 1, linings: warm, card: ['Linings turned', '5 kays'] }) },
          { from: 35.5, to: 43.5, kind: 'custom', id: 'hire', draw: (P, b, run, H) => hireCounter(deck, P, b, run, H) },
          { from: 31, to: 35.5, kind: 'stall', id: 'gin', name: 'Gin', goods: 'bottles', awning: ['#5e6b78', '#fbfdff'], ground: '#1e2328', ink: '#fbfdff', lit: 1, props: false },
          { from: Z1, to: 31, kind: 'wall', bench: false },
        ],
        spin: [
          { from: 41.5, to: 47.5, kind: 'custom', draw: (P, b, run, H) => fittingRoom(deck, P, b, run, H) },
          { from: 35, to: 41.5, kind: 'custom', id: 'hems', draw: (P, b, run, H) => loft(deck, P, b, run, H, { name: 'Hems and cuffs', ground: '#2f9e96', side: -1, linings: cool, font: 'italic', card: ['Let out, taken in', 'while you swing'] }) },
          { from: 30.5, to: 35, kind: 'stall', name: 'Broth', goods: 'pots', awning: ['#e8563a', '#fbfdff'], ground: '#5e6b78', ink: '#fbfdff', lit: 1, props: false },
          { from: Z1, to: 30.5, kind: 'wall', bench: false, notice: ['Lost', 'One left shoe, child, yellow.', 'It was the deposit.'] },
        ],
      },
    });
    {
      // the gin rule, where nobody can say they did not see it
      const run = sleeve.sides.anti.run, P = deck.pen(run, 29, 'sa');
      P.g.box(27.55, 1.12, -0.05, 30.45, 2.5, 0, '#8d7f66', { skip: 's' });
      P.done();
      deck.sign(['NO GIN', 'BEFORE FLYING'], { run, at: run.pt(29, 1.81, -0.056), w: 2.76, h: 1.26, style: 'chalk', font: 'hand', head: false });
      deck.sign(['Gin 0.18', 'afterwards'], { run, at: run.pt(33.25, 0.5, -0.288), w: 1.3, h: 0.56, style: 'chalk', head: false });
    }
    yield 'fin yard: sleeve street';
    yield* shoeWall(deck, sleeve.sides.anti);
    yield* offcutWall(deck, sleeve.sides.anti, 'linings', 1);
    yield* offcutWall(deck, sleeve.sides.spin, 'hems', -1);
    yield* street(deck, { axis: 'z', from: -52, to: Z0, at: XS, y: 0, width: SW, lamps, folk: { stand: 2, stroll: 1, walk: 0 }, fill, part: 'sb' });
    // the street's people go on walking under the net: one file toward the front, as the flight goes, and one coming
    // back. They keep the flight's clock, so the same ones are overtaken or met at the same places every time, and
    // nobody is close in front of the first picture
    const file = (x, from, to, at) => { for (const z of at) deck.walkersAlong({ from: [x, 0, from], to: [x, 0, to], n: Math.max(1, Math.round(rng.i(1, 3) * dens)), spread: 0.22, start: Math.abs(z - from), rng }); };
    file(XS + 3.2, 60, -50, [38, 27, 14, 3, -9, -22, -36]);
    file(XS - 3.2, -50, 60, [16, 6, -6, -18, -30, -42]);
    for (const [x, z, n] of [[-1, 12, 3], [-9, -6, 2], [14.6, 4, 2], [0.5, -16, 3], [-12, 19, 2], [-4, 21, 2], [15, -14, 2]]) deck.knot(x, 0, z, n, rng);
    yield 'fin yard: walkers';

    yield* buildYard(deck, school, ZW);
    yardSigns(deck);
    // children waiting their turn on the net, at its edges
    for (const [x, z, yaw] of [[-14.6, 25.4, 2.6], [-13.7, 25.8, 3.3], [-5.6, 25.7, 3.0], [15.9, 19.5, -1.6], [16.0, 18.2, -1.3], [15.9, -13, -1.7], [-15.9, -9.5, 1.2], [-15.6, -11, 1.6]]) deck.people([{ p: [x, netBase(x, z), z], yaw, child: true, color: rng.pick(GREYS) }]);
    // light: the yard's own, white and even, from its roof; a little less of it under the net; the lobby's warmer lamps
    deck.zone({ min: [X0 - 2.2, 4.4, Z0 - 2.2], max: [X1 + 2.2, TOP + 1, Z1 + 2.2], soft: 1.2, color: '#f2f6fb', power: 1.3, side: 0.74, under: 0.6 });
    deck.zone({ min: [X0 - 2.2, -0.5, Z0 - 2.2], max: [X1 + 2.2, 3.2, Z1 + 2.2], soft: 1.2, color: '#f4f4ee', power: 0.95, side: 0.6, under: 0.5 });
    deck.zone({ min: [XL - LOB, 23.6, Z1 + 0.9], max: [XL + LOB, 27.4, ZW + 0.4], soft: 0.9, color: '#fff3e0', power: 0.95, side: 0.75, under: 0.5 });
    const lifts = lobby(deck, { at: [XL, ZW], y: 24, face: 'front', doors: 5, pitch: 2.6, width: 2 * LOB, hole: 2, open: [4], name: 'To the flying hall', lines: ['Broth at the gate'], door: '#e8563a', wall: FEATHER.walls[0] });
    // nothing is planted here: what the kit stands outside a shop becomes a crate of offcuts
    for (const k of ['planter', 'tub', 'pot']) { for (const it of deck.items.get(k) || []) deck.put('crate', { p: it.p, yaw: it.yaw, color: rng.pick(LININGS) }); deck.items.delete(k); }
    yield 'fin yard: the yard';

    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);
    // figures in sleeves who are not on a cord: the customer at her fitting, facing the street; children standing on the
    // net, watching the beginners, waiting for a lane, and queueing at the hatch for the ladder
    const stand = (x, y, z, hx, hz, scale, lining, o = {}) => ({ pos: [x, y + STAND * scale, z], f: [hx * 0.05, 1, hz * 0.05], bk: [-hx, 0, -hz], flap: o.flap || 0.1, walk: 0, r: { cloth: rng.pick(GREYS), outer: rng.pick(GREYS), lining, skin: rng.pick(SKIN), look: [rng(), rng(), 0, rng()], pose: [0, 0.08, 0], scale, ...o } });
    const extras = [stand(XS + SW / 2 + 1.55, 0.235, 44.5, -1, 0, 0.98, '#f2c14e', { cloth: '#d7d2c4', suit: false, flap: 0.16 })];
    for (const [x, z, hx, hz, lining] of [[-10.6, -23.4, -1, 0.3, '#2f9e96'], [-10.2, -24.5, -1, 0.5, '#f2c14e'], [-9.9, -14.6, -0.9, -0.4, '#d93a5a'], [-16.0, 25.2, 0.4, -1, '#f2c14e'], [-11.2, 25.3, 0, -1, '#6cc0dc'], [14.5, -23.4, -1, 0.2, '#3f6fc0'], [14.8, -24.5, -1, -0.1, '#ef8a2c'], [15.5, -22.5, -0.8, 0.5, '#7bc47f']]) extras.push(stand(x, netBase(x, z) - 0.2, z, hx, hz, rng.f(0.6, 0.72), lining));
    const fly = flyerMesh(deck, 48), nR = school.riders.length;
    yield 'fin yard: figures';
    const cordsM = cordMesh(deck, 220), net = netMesh(deck, school);
    school.riders.forEach((r, i) => fly.look(i, { ...r, suit: !(r.who === 'visitor' || r.who === 'teacher') }));
    extras.forEach((e, j) => { fly.look(nR + j, e.r); fly.set(nR + j, e, e.r); });
    scene.add(fly.mesh, net.mesh, cordsM.mesh);
    yield 'fin yard: swingers';

    const S = {}, dl = [], local = new Vector3(), still = extras.filter((e) => e.pos[1] > 3).map((e) => [e.pos[0], e.pos[2], 0.2, 1.1]);
    const open0 = path.tCross - 6.5, open1 = path.tCross - 3.0;
    lifts.slide(0);
    const pose = (t, camera) => {
      fly.uni.uClock.value = t;
      const dents = netDents(school, t, dl, still), ud = net.uDent.value;
      for (let i = 0; i < NDENT; i++) { const d = dents[i]; ud[i * 4] = d ? d[0] : 0; ud[i * 4 + 1] = d ? d[1] : 0; ud[i * 4 + 2] = d ? d[2] : 0; ud[i * 4 + 3] = d ? d[3] : 1; }
      let nc = 0;
      for (let i = 0; i < school.cords.length; i++) {
        const c = school.cords[i], r = c.rider === undefined ? null : school.riders[c.rider];
        let end;
        if (r) {
          riderState(r, t, dents, S); fly.set(c.rider, S, r);
          end = cordEnd(school, i, t, S);
          // the harness: four short lines from the ring to her shoulders and hips, or hanging limp when she has let go
          const sc = r.scale;
          if (S.on) { const sd = cross3(S.bk, S.f); for (const [a, bb] of HARNESS) cordsM.set(nc++, end, [S.pos[0] + (sd[0] * a + S.f[0] * bb + S.bk[0] * 0.08) * sc, S.pos[1] + (sd[1] * a + S.f[1] * bb + S.bk[1] * 0.08) * sc, S.pos[2] + (sd[2] * a + S.f[2] * bb + S.bk[2] * 0.08) * sc], 0.008, 1.5); }
          else { const dn = nrm3(sub3(end, c.hook)); for (const [a, bb] of LIMP) cordsM.set(nc++, end, [end[0] + dn[0] * 0.42 * sc + a, end[1] + dn[1] * 0.42 * sc, end[2] + dn[2] * 0.42 * sc + bb], 0.008, 1.5); }
        } else end = cordEnd(school, i, t, null);
        cordsM.set(nc++, c.hook, end, r && r.beam ? 0.012 : 0.016, 1);
        if (!r) cordsM.set(nc++, end, [end[0], end[1] - 0.5, end[2]], 0.05, 1.3);
      }
      fly.done(nR + extras.length); cordsM.done(nc);
      if (camera) { frame.local(camera.position, local); net.uEye.copy(local); cordsM.mesh.renderOrder = local.y > netBase(local.x, local.z) ? 5 : 3; }
    };
    pose(0, null);
    return {
      scene, path, deck, near: 0.12, far: 400,
      look: { exposure: 0.92, bloom: 0.14, threshold: 1.15, saturation: 1.08, vignette: 0.36, contrast: 1.08 },
      portal: { shape: 'rect', width: 1.5, height: 2.2, rim: false, mist: '#e9eef4' },
      update(t, dt, camera) { deck.tick(t); pose(t, camera); lifts.slide(smoothstep(open0, open1, t)); },
    };
  },
};
