// Ochre, Pigment Row: the derby with Madder, in Ochre's league hall on deck 236.
//
// Madder and Ochre are one glide apart (docs/wander-year.md, Days 222 and 226) and each has a line about the other
// (games/three-nights/src/15-canon.js): "Pigment Row says Madder has cried at a board twice this year and is planning
// a third", and "Madder says Ochre's grinders have never once been wrong, and it's insufferable". The two boards were
// the vote on Booking Day and the Count coming down. This is the third: a scoreboard.
//
// The game is spinball, and its one rule is the docs' (ashgrove.md, Day one): "axis flies true, spin sinks, anti
// floats." A ball thrown along the axis goes straight; thrown spinward "it gains about a sixth of its weight and
// dives; thrown antispinward it loses as much and sails". Sorrel plays its Middle league on this same deck, "at 0.69 g,
// and every hard throw breaks harder than a Low-deck child would believe" (sorrel.md, the Middle League Hall).
//
// The sums. Deck 236 is 2,060 m from the axis and goes round at V = 0.0572 x 2,060 = 117.8 m/s; things on it weigh
// 0.0572^2 x 2,060 = 6.74 m/s2, which is 0.69 g. A ball thrown spinward at u goes round faster than the floor and
// weighs (1 + u/V)^2 of its rest weight; thrown antispinward, (1 - u/V)^2. At 15 m/s that is 27% heavier or 24%
// lighter; along the axis nothing changes. No flight here is drawn from those figures, though. Every ball flies a
// straight line in the frame that does not turn, from the hand that throws it to the hands (or the hoop) that take
// it, and is drawn as the turning hall sees it (throwOf, below): the breaks come out of that by themselves. The air's
// drag is left out, as the rule leaves it out.
//
// What the flight shows, by those equations (out/ochre_derby/sums.mjs prints them):
//   - a pass thrown anti at 24 m/s, which weighs 0.63 of its rest weight: it carries 60 m in 2.5 s and never rises 4 m;
//   - straight after it, a pass thrown spinward at 12 m/s, which weighs 1.21: to carry 32 m it has to go up 7 m, and it
//     comes down at 41 degrees. Two more like it follow;
//   - two passes across the hall, along the axis: they rise under 2 m and stray a finger's width from a straight line;
//   - the last throw. Eight all, nine seconds left, Madder attacking anti. From 24 m inside their own half it leaves
//     the hand, 2.1 m up, at 27.5 m/s, 25.0 of that antispinward, so it weighs (1 - 25.0/117.8)^2 = 0.62 of its rest
//     weight. It tops out at 17.5 m under lamps hung at 19, is in the air 4.96 s, flies 119 m, and comes down through
//     the hoop at 21 degrees. The same throw made spinward would be down again in 2.3 s, 59 m off.
// A standing leap of 0.75 m here takes 0.94 s; the same legs at one g would manage half a metre.
//
// The flight: from behind the rail at the top of Madder's half of one stand, down over the rows and out over the
// boards while the ball goes up and down the hall; along the floor to a leap in the middle; up to look at Ochre's half
// and down again with a pass to Madder's long thrower; round him and in behind; then after his throw the length of
// the hall, and through the hoop behind it.
//
// Not canon. The docs give the throwing rule and nothing else of the game (drum-digest.md, section 12, item 16), and
// of Ochre indoors nothing at all:
//   - the derby itself, the score, the clock, and that Madder came to Ochre for it this week;
//   - the hall: on deck 236 of Ochre as Sorrel's Middle League Hall is of Sorrel, 190 m round the drum, 66 m across
//     and five decks high; its stands of sixteen rows, the concourses behind them on deck 238, the galleries on the end
//     walls either side of each hoop, its lamps, the wheel of twelve pigments in its floor and round its hoops, the
//     names of its two stands (Grindstone and Panel Yard are Ochre's neighbourhoods);
//   - the game's shape: hoops 1.5 m in radius with their middles 6.5 m up the two end walls, teams of nine, nobody
//     running with the ball, ends changed at the half, umpires on high chairs, benches, the lines on the floor and
//     the distances painted beside them;
//   - the ball carrying a lamp, so that ten thousand people can see it break; the flip-tile boards;
//   - Ochre's colours (Madder's red is canon; Ochre is given its dawn's yellow-brown), the scarves, flags, knitted hats
//     and hand lamps, and the words on the boards and parapets (the two mottoes and the two sayings are three-nights'
//     canon, as are the broths, the ten minutes and the neighbourhoods' names; the rest is made of them);
//   - that the long thrower is slight (ashgrove.md: Ossian "is good at it, because he's small and throws anti").
import {
  Scene, Mesh, ShaderMaterial, BufferGeometry, BufferAttribute, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, CanvasTexture,
  NoColorSpace, LinearMipmapLinearFilter, LinearFilter, ClampToEdgeWrapping, AdditiveBlending, DoubleSide, Vector2, Vector3, Vector4, Matrix4, Quaternion,
  DynamicDrawUsage, Sphere,
} from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DRUM, DEG } from '../kit/drum.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, litMaterial, glowPoints } from '../kit/mats.js';
import { Geo, instances, shade, rgb, fitBounds } from '../kit/geo.js';
import { SKIN } from '../kit/folk.js';
import { makeDeck, finish, PALETTES } from '../kit/deck.js';
import { makeRng, smoothstep, clamp } from '../core/rng.js';

// ---------------------------------------------------------------- the hall's measures (flat: x spinward, y up, z aft)
const W = DRUM.OMEGA, R = deckRadius(236), GRAV = W * W * R;      // 2,060 m; 6.74 m/s2
const XE = 95;                        // the end walls: the anti end at -XE, the spinward end at +XE
const ZP = 16;                        // the boards along the two long sides
const NROW = 16, TREAD = 0.8, RISE = 0.45, ROW_Y = 0.8, ROW_Z = 16.3;      // the stands: sixteen rows each side
const CON_Y = 8, CON_Z = ROW_Z + NROW * TREAD, ZW = 33.3;                  // the concourse behind the top row (deck 238), and the back wall
const HB = 19, HC = 19.7;             // the lamps and the undersides of the beams; the ceiling
const HY = 6.5, HOOP = 1.5;           // a hoop: the height of its middle, and its radius
const BAY = 19, AISLE = 1.3;          // a bay of a stand, from the middle of one aisle to the middle of the next; an aisle's width
const REACH = 2.35, LEAP = 0.75;      // hands held up; a standing leap at 0.69 g
const SLIGHT = 0.9, REACH4 = REACH * SLIGHT;      // Madder's long thrower is slight: his hands, and the ball in them, are lower
const RED = ['#7e2d33', '#a8343a', '#c9565a', '#e07a6e', '#8f2f38', '#b8474a'], ROSE = '#e07a6e', MADDER = '#a8343a';
const YEL = ['#d9a65a', '#c08a3e', '#e8c078', '#a87838', '#7a5428', '#cf9a48'], OCHRE = '#d9a65a', BROWN = '#7a5428';
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- a throw, by the true equations
// From flat p0 to flat p1, T seconds in the air. In the frame that does not turn the ball goes straight from where
// the hand is now to where the catcher's hands will have been carried by then; at(tau) turns that line back into the
// hall's own co-ordinates. spin, up and axis are the launch as the thrower sees it, in m/s.
function throwOf(p0, p1, T) {
  const r0 = R - p0[1], a0 = p0[0] / R, r1 = R - p1[1], a1 = p1[0] / R + W * T;
  const x0 = r0 * Math.cos(a0), y0 = r0 * Math.sin(a0), vx = (r1 * Math.cos(a1) - x0) / T, vy = (r1 * Math.sin(a1) - y0) / T, vz = (p1[2] - p0[2]) / T;
  const c = Math.cos(a0), s = Math.sin(a0);
  return {
    p0, p1, T, spin: -vx * s + vy * c - W * r0, up: -(vx * c + vy * s), axis: vz,
    at(tau, out = [0, 0, 0]) { const x = x0 + vx * tau, y = y0 + vy * tau; out[0] = (Math.atan2(y, x) - W * tau) * R; out[1] = R - Math.hypot(x, y); out[2] = p0[2] + vz * tau; return out; },
  };
}

// ---------------------------------------------------------------- the last minute of the derby
// Seconds are the flight's. The clock on the boards reads 0:45 as the flight begins and runs out at 45.
const CLOCK = 45, TL = 36, T_LAST = 4.96, TG = TL + T_LAST;        // the last throw leaves the hand at TL and is through the hoop at TG
const HAND = REACH + LEAP;            // where a leaping catcher takes the ball
// who: O1..O9 are Ochre (attacking spinward), M1..M9 Madder (attacking anti). Each throw: when, how long in the air,
// who throws, who takes it (null: the hoop), from where, to where.
const THROWS = [
  { t: 2.2, T: 2.5, by: 'M7', to: 'O3', p0: [-10, REACH, 3], p1: [-70, HAND + 0.05, 4] },       // anti: flat and long, and Ochre's leap takes it
  { t: 7.2, T: 2.6, by: 'O3', to: 'O6', p0: [-70, REACH, 4], p1: [-38, HAND, 9] },              // spinward: up 7 m and down steep
  { t: 12.4, T: 1.5, by: 'O6', to: 'O7', p0: [-38, REACH, 9], p1: [-36, REACH, -9] },           // across: straight
  { t: 16.6, T: 2.4, by: 'O7', to: 'M5', p0: [-36, REACH, -9], p1: [-6, HAND + 0.1, 1] },       // spinward again, and Madder's leap takes it
  { t: 22.2, T: 1.2, by: 'M5', to: 'M6', p0: [-6, REACH, 1], p1: [-4, REACH, -11] },            // across
  { t: 26.2, T: 2.5, by: 'M6', to: 'M4', p0: [-4, REACH, -11], p1: [24.4, REACH4 + LEAP, -0.8] },      // back to the long thrower, spinward: it dives to him
  { t: TL, T: T_LAST, by: 'M4', to: null, p0: [24.4, REACH4, -0.8], p1: [-XE, HY, 0] },         // the last one
];
for (const th of THROWS) th.fly = throwOf(th.p0, th.p1, th.T);
const LAST = THROWS[THROWS.length - 1];
// leaps: who, the second they are highest, how high (a parabola at this deck's weight, up and down in 2 sqrt(2h/g))
const LEAPS = [
  ['O3', 4.7, LEAP + 0.05], ['M9', 4.78, 0.65], ['O6', 9.8, LEAP], ['M8', 9.86, 0.6], ['M5', 19.0, LEAP + 0.1], ['O8', 19.12, 0.7], ['M4', 28.7, LEAP],
  ['O8', TL + 0.12, 0.7], ['O1', TG - 0.1, 0.8],
];
// where each player stands, as [second, x, z]: between two of them a player runs, easing off and on
const TRACKS = {
  O1: [[0, -88, 1], [20, -84, 0], [TL, -90, 0.6]],
  O2: [[0, -76, 10], [12, -62, 11], [22, -52, 12], [TL, -60, 10]],
  O3: [[0, -73, 6.5], [3.8, -70, 4], [7.6, -70, 4], [13, -62, 4], [22, -56, 6], [TL, -64, 5]],
  O4: [[0, -56, -3], [9, -46, -4], [18, -30, -2], [27, -24, -3], [TL, -36, -2]],
  O5: [[0, -60, -12], [11, -50, -12.5], [19, -30, -11.5], [30, -20, -10.5], [TL + 2, -38, -9.5]],
  O6: [[0, -45, 10.5], [8.8, -38, 9], [12.9, -38, 9], [17.5, -28, 12.5], [24, -14, 13], [31, -6, 12], [TL + 1, -12, 11]],
  O7: [[0, -41, -11.5], [12.6, -36, -9], [17.2, -36, -9], [24, -20, -10], [31, -8, -9], [TL + 1, -14, -8]],
  O8: [[0, -14, 5.5], [15, -5, 2.6], [19, -3.4, 2.2], [20, -3.4, 2.2], [23.6, -2.6, -7], [28.5, 12, -3.5], [TL - 0.25, 21.4, -0.75], [TL + 3, 21.4, -0.75]],
  O9: [[0, 9, -8], [16, 13, -7], [23, 15, -5], [28.5, 19, -5], [TL - 0.1, 26.6, -3.4], [TL + 3, 26.2, -3.2]],
  M1: [[0, 84, -1], [22, 78, 0], [TL, 70, 1]],
  M2: [[0, 60, 9], [22, 50, 9], [TL, 44, 8]],
  M3: [[0, 56, -10], [22, 46, -9], [TL, 40, -8]],
  M4: [[0, 33, -2], [20, 28, -1], [26, 24.4, -0.8], [TG + 0.6, 24.4, -0.8], [TG + 5, 12, 1]],
  M5: [[0, 4, 0], [13, -2, 1], [18, -6, 1], [22.6, -6, 1], [28, -24, 3], [TL, -52, 2], [TG, -66, 1], [TG + 5, -74, 6]],
  M6: [[0, 6, -10], [19, -2, -11], [22.6, -4, -11], [26.8, -4, -11], [32, -22, -10], [TG, -56, -9], [TG + 5, -66, -12]],
  M7: [[0, -10, 3], [2.8, -10, 3], [10, -24, 2], [21, -34, 3], [31, -54, 4], [TG, -72, 3], [TG + 5, -80, 8]],
  M8: [[0, -47, 13], [8.8, -39.4, 10.2], [11, -39.4, 10.2], [16.5, -44, 5], [27, -54, 8], [TG, -78, 8], [TG + 5, -84, 12]],
  M9: [[0, -68, 1], [3.9, -71.8, 3.4], [6, -71.8, 3.4], [16, -70, -3], [31, -80, -4], [TG, -86, -2], [TG + 5, -86, -9]],
};
const NAMES = Object.keys(TRACKS);
const ease = (u) => u * u * (3 - 2 * u);
// where a player is at t: [x, lift, z], and how fast he is going
function standAt(name, t, out) {
  const k = TRACKS[name];
  let i = 0; while (i < k.length - 2 && k[i + 1][0] <= t) i++;
  const a = k[i], b = k[i + 1], u = clamp((t - a[0]) / (b[0] - a[0]), 0, 1), e = ease(u);
  out[0] = a[1] + (b[1] - a[1]) * e; out[2] = a[2] + (b[2] - a[2]) * e;
  const sp = 6 * u * (1 - u) / (b[0] - a[0]);
  out[3] = (b[1] - a[1]) * sp; out[4] = (b[2] - a[2]) * sp;
  let y = 0;
  for (let j = 0; j < LEAPS.length; j++) { const l = LEAPS[j]; if (l[0] === name) y = Math.max(y, l[2] - 0.5 * GRAV * (t - l[1]) * (t - l[1])); }
  out[1] = y;
  return out;
}
// where the ball is at t: in the air on a throw, or in the hands of whoever has it. Returns the throw it is on (or null).
const _st = [0, 0, 0, 0, 0];
function ballAt(t, out) {
  let cur = THROWS[0], held = cur.by;
  for (let j = 0; j < THROWS.length; j++) { const th = THROWS[j]; if (t >= th.t) { cur = th; held = th.to; } }
  if (t >= cur.t && t <= cur.t + cur.T) { cur.fly.at(t - cur.t, out); return cur; }
  if (t < cur.t) held = cur.by;
  if (!held) { out[0] = -XE - 3; out[1] = HY - 1; out[2] = 0; return null; }       // through the hoop, and gone
  standAt(held, t, _st);
  out[0] = _st[0]; out[1] = (held === 'M4' ? REACH4 : REACH) + _st[1]; out[2] = _st[2];
  return null;
}

// ---------------------------------------------------------------- the hall
const MOD = BAY / 3;                  // long things are cut into lengths of 6.33 m, so that they bend
const lengths = (x0, x1, fn) => { for (let a = x0, i = 0; a < x1 - 0.01; a += MOD, i++) fn(a, Math.min(x1, a + MOD), i); };
const wallS = (g, x0, x1, y0, y1, z, col, e = 0) => g.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, e);      // faces aft (+z)
const wallN = (g, x0, x1, y0, y1, z, col, e = 0) => g.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], col, e);      // faces the front (-z)
const wallE = (g, x, z0, z1, y0, y1, col, e = 0) => g.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], col, e);      // faces spinward (+x)
const wallW = (g, x, z0, z1, y0, y1, col, e = 0) => g.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, e);      // faces anti (-x)
// a wall along x at |z| on side s (+1 the back stand, -1 the front), facing the pitch (inward = 1) or away from it
const wallAt = (g, s, inward, x0, x1, y0, y1, z, col, e = 0) => ((s > 0) === (inward > 0) ? wallN : wallS)(g, x0, x1, y0, y1, s * z, col, e);
// a level face on side s between two distances from the middle line
const flat2 = (g, s, x0, x1, za, zb, y, col, o) => g.floor(x0, Math.min(s * za, s * zb), x1, Math.max(s * za, s * zb), y, col, o);
const PITCH = '#d3c9b2', PITCH2 = '#c6bba2', LINE = '#6b4a26', PLASTER = '#b59c6e', PLASTER2 = '#8f7954', DADO = '#7a5c3c', STEEL = '#4c4741', DARK = '#2b2824';
const TREADC = '#4a433b', RISERC = '#5c5347', STEP = '#b3a892';
// Ochre's twelve pigments (worlds/ochre_chart.js paints its end wall with them): the wheel in the middle of the floor
const PIGMENTS = ['#d4a034', '#c27a2e', '#a24a2a', '#b8362c', '#9a2642', '#6c3a6c', '#38448e', '#3a78b0', '#2f8a84', '#4a7a4e', '#7c873c', '#d6c04c'];
const rowY = (i) => ROW_Y + RISE * i, rowZ = (i) => ROW_Z + TREAD * i;
const inAisle = (x, m = 0.12) => Math.abs(x - BAY * Math.round(x / BAY)) < AISLE / 2 + m;      // an aisle at every 19 m, and half of one against each end wall

// The floor: pale tiles, polished, with the lines painted on them a finger above (the kit's floor shader draws both).
function* layFloor(deck) {
  const f = deck.bucket(0, 0, 'pitch').f, Y = 0.02;
  // (laid in bands 25 m deep from each end, every other one a shade darker, so that the eye can count the distance)
  const cuts = new Set(); lengths(-XE, XE, (a) => cuts.add(+a.toFixed(3))); for (const d of [25, 50, 75]) { cuts.add(-XE + d); cuts.add(XE - d); } cuts.add(XE);
  const xs = [...cuts].sort((a, b) => a - b);
  for (let i = 0; i < xs.length - 1; i++) if (xs[i + 1] - xs[i] > 0.01) f.tint(1).floor(xs[i], -ZP, xs[i + 1], ZP, 0, Math.floor((XE - Math.abs((xs[i] + xs[i + 1]) / 2)) / 25) % 2 ? PITCH2 : PITCH, { emit: 0.9 });
  yield 'derby: floor';
  f.tint(0);
  const line = (x0, z0, x1, z1, col = LINE) => f.floor(x0, z0, x1, z1, Y, col, { emit: 0.5 });
  for (const s of [-1, 1]) lengths(-XE, XE, (a, b) => line(a, s * (ZP - 0.7) - 0.1, b, s * (ZP - 0.7) + 0.1));
  for (const [z0, z1] of [[-ZP + 0.6, -7], [-4.6, 4.6], [7, ZP - 0.6]]) line(-0.16, z0, 0.16, z1);      // (not under the wheel's paint)
  for (const d of [25, 50, 75]) for (const s of [-1, 1]) line(s * (XE - d) - 0.08, -ZP + 0.6, s * (XE - d) + 0.08, ZP - 0.6, '#9a7a4e');
  // the wheel in the middle: twelve pigments, a dark ring inside and out
  const ring = (cx, r0, r1, a0, a1, n, col, y = Y) => {
    for (let i = 0; i < n; i++) {
      const p = a0 + (a1 - a0) * i / n, q = a0 + (a1 - a0) * (i + 1) / n, c = typeof col === 'function' ? col(i) : col;
      f.quad([cx + Math.cos(p) * r0, y, Math.sin(p) * r0], [cx + Math.cos(p) * r1, y, Math.sin(p) * r1], [cx + Math.cos(q) * r1, y, Math.sin(q) * r1], [cx + Math.cos(q) * r0, y, Math.sin(q) * r0], c, 0.5);
    }
  };
  ring(0, 4.9, 6.7, 0, -TAU, 48, (i) => PIGMENTS[Math.floor(i / 4)], Y + 0.004);
  ring(0, 6.7, 7.0, 0, -TAU, 48, LINE, Y + 0.004);
  ring(0, 4.6, 4.9, 0, -TAU, 48, LINE, Y + 0.004);
  yield 'derby: floor';
  // the keeps: a half circle under each hoop, tinted, with a dark edge
  for (const s of [-1, 1]) {
    const a0 = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    ring(s * XE, 0.01, 11.75, a0, a0 - Math.PI, 24, '#dccb9f', 0.016);
    ring(s * XE, 11.75, 12, a0, a0 - Math.PI, 24, LINE);
  }
  // metres to the hoop ahead, stencilled where a thrower facing it reads them: to the anti hoop along the front side,
  // to the spinward hoop along the back. Seven bars to a figure, cut short at the corners as a stencil's are
  const BARS = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg'], H = 1.5, WD = 0.74, T = 0.17, C = 0.07;
  const figures = (text, cx, cz, dir) => {
    const total = text.length * WD + (text.length - 1) * 0.36, P = (u, v) => [cx + dir * v, Y + 0.012, cz + dir * u];
    const bar = (u0, u1, v0, v1) => f.quad(P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1), LINE, 0.5);
    text.split('').forEach((ch, i) => {
      const u = -total / 2 + i * (WD + 0.36), on = BARS[+ch];
      if (on.includes('a')) bar(u + C, u + WD - C, H / 2 - T, H / 2);
      if (on.includes('g')) bar(u + C, u + WD - C, -T / 2, T / 2);
      if (on.includes('d')) bar(u + C, u + WD - C, -H / 2, -H / 2 + T);
      if (on.includes('f')) bar(u, u + T, T / 2 + C, H / 2 - C);
      if (on.includes('b')) bar(u + WD - T, u + WD, T / 2 + C, H / 2 - C);
      if (on.includes('e')) bar(u, u + T, -H / 2 + C, -T / 2 - C);
      if (on.includes('c')) bar(u + WD - T, u + WD, -H / 2 + C, -T / 2 - C);
    });
  };
  for (let d = 25; d < 190; d += 25) { figures(String(d), -XE + d + 2.2, -ZP + 2.7, -1); figures(String(d), XE - d - 2.2, ZP - 2.7, 1); }
}

// The boards along the long sides, and the stands behind them: sixteen rows of benches, aisles with half steps, a
// concourse along the top with a rail, and the back wall with a door to deck 238 in every bay. A stand is ten bays
// alike, 19 m each, from the middle of one aisle to the middle of the next. One bay is modelled, as the back stand's
// with its anti end at x = 0, and drawn twenty times, turned about for the front stand; each copy's planks take a
// shade of their own. (Laid out whole, the two stands were half the triangles this file builds, and most of what it
// throws away in building them.) Only the concourses' floors and rails are laid in place.
function* buildStands(deck, rng) {
  const g = new Geo(), planks = ['#8a6a44', '#7a5c3c', '#96744a', '#806040', '#8f7048'], H2 = AISLE / 2, h = RISE / 2;
  // the boards: panels of old paint, a dark kick strip, a rail on top; and the walk behind them
  for (let k = 0; k < 3; k++) {
    const a = k * MOD, b = a + MOD;
    wallAt(g, 1, 1, a, b, 0.22, 1.18, ZP, k === 1 ? '#e2d5b6' : k ? '#d9caa6' : '#e9dec4');
    wallAt(g, 1, 1, a, b, 0, 0.22, ZP - 0.012, '#4a3a28'); wallAt(g, 1, 1, a, b, 1.18, 1.27, ZP - 0.012, DADO);
    flat2(g, 1, a, b, ZP - 0.012, ZP + 0.15, 1.27, DADO);
    wallAt(g, 1, -1, a, b, ROW_Y, 1.27, ZP + 0.15, DADO);
    flat2(g, 1, a, b, ZP + 0.15, ROW_Z, ROW_Y, TREADC);
  }
  // rows: a tread and the riser behind it, and a bench of planks, one or two of them newer than the rest
  for (let i = 0; i < NROW; i++) {
    const y = rowY(i), z = rowZ(i);
    for (let k = 0; k < 3; k++) {
      // (tread, riser and bench all stop short of the aisles: the aisles' own steps are laid in the gaps)
      const ta = k ? k * MOD : H2, tb = k < 2 ? (k + 1) * MOD : BAY - H2, pc = rng() < 0.08 ? '#b89868' : planks[(k * 3 + i * 2 + Math.floor(rng() * 2)) % 5];
      flat2(g, 1, ta, tb, z, z + TREAD, y, TREADC);
      wallAt(g, 1, 1, ta, tb, y, y + RISE, z + TREAD, RISERC);
      g.tint(0.5);
      flat2(g, 1, ta + 0.03, tb - 0.03, z + 0.3, z + 0.64, y + 0.42, pc);
      wallAt(g, 1, 1, ta + 0.03, tb - 0.03, y + 0.36, y + 0.42, z + 0.3, shade(pc, 0.7));
      g.tint(0);
    }
    // half an aisle at each end: pale steps, a half step in each row, an ochre nosing on every edge
    for (const x0 of [0, BAY - H2]) {
      const x1 = x0 + H2;
      flat2(g, 1, x0, x1, z, z + 0.08, y, OCHRE); flat2(g, 1, x0, x1, z + 0.08, z + 0.42, y, STEP);
      flat2(g, 1, x0, x1, z + 0.42, z + 0.5, y + h, OCHRE); flat2(g, 1, x0, x1, z + 0.5, z + TREAD, y + h, STEP);
      wallAt(g, 1, 1, x0, x1, y, y + h, z + 0.42, shade(STEP, 0.8)); wallAt(g, 1, 1, x0, x1, y + h, y + RISE, z + TREAD, shade(STEP, 0.8));
    }
  }
  yield 'derby: a bay of rows';
  // the back wall: plain, the door, plain; a dado along its foot; the upper wall in two bands; half a pier at each end
  const d0 = BAY / 2 - 1.5, d1 = BAY / 2 + 1.5, top = CON_Y + 2.7;
  for (const [a, b] of [[0, d0], [d1, BAY]]) { wallAt(g, 1, 1, a, b, CON_Y, CON_Y + 1.1, ZW, DADO); wallAt(g, 1, 1, a, b, CON_Y + 1.1, top, ZW, PLASTER); }
  wallAt(g, 1, 1, d0 + 0.12, d1 - 0.12, CON_Y, top, ZW + 1.6, '#ffd9a2', 1.25);                       // the street beyond, lit
  for (const xa of [d0, d1 - 0.12]) g.box(xa, CON_Y, ZW - 0.05, xa + 0.12, top, ZW + 1.6, '#5a4630', { skip: 'tb' });
  flat2(g, 1, d0, d1, ZW, ZW + 1.6, CON_Y, '#b8ad98');
  for (let k = 0; k < 3; k++) { const a = k * MOD, b = a + MOD; wallAt(g, 1, 1, a, b, top, 13.2, ZW, PLASTER); wallAt(g, 1, 1, a, b, 13.2, 13.5, ZW - 0.03, DADO); wallAt(g, 1, 1, a, b, 13.5, HC, ZW, PLASTER2); }
  for (const x0 of [0, BAY - 0.3]) g.box(x0, CON_Y, ZW - 0.35, x0 + 0.3, HB, ZW, '#b9a67e', { skip: x0 ? 'tbe' : 'tbw' });
  const items = [];
  for (let k = 0; k < 10; k++) for (const sd of [1, -1]) { const t = rng.f(0.84, 1.12); items.push({ p: [-XE + (sd > 0 ? k : k + 1) * BAY, 0, 0], yaw: sd > 0 ? 0 : Math.PI, color: [t, t * 0.98, t * 0.95] }); }
  // (the kit takes each copy's own origin for its middle when it works out what is in view; a bay reaches 45 m from its)
  for (const m of instances(g.build(), deck.lit, items, { frame: deck.frame, cell: 4000 })) { m.boundingSphere.radius += 30; deck.group.add(m); }
  yield 'derby: twenty bays';
  // the concourses: floor and rail (which stops short of the end galleries)
  for (const sd of [-1, 1]) {
    const bk = deck.bucket(0, 0, sd > 0 ? 'back' : 'front'), e = bk.g, r0 = CON_Z + 0.16, r1 = CON_Z + 0.24;
    lengths(-XE, XE, (a, b) => flat2(bk.f.tint(0.5), sd, a, b, CON_Z, ZW, CON_Y, '#a59a86', { emit: 0.35 }));
    bk.f.tint(0);
    lengths(-XE + GAL_D, XE - GAL_D, (a, b) => {
      e.box(a, CON_Y + 1.06, Math.min(sd * r0, sd * r1), b, CON_Y + 1.12, Math.max(sd * r0, sd * r1), STEEL, { skip: 'we' });
      e.box(a, CON_Y + 0.55, Math.min(sd * (r0 + 0.02), sd * (r1 - 0.02)), b, CON_Y + 0.59, Math.max(sd * (r0 + 0.02), sd * (r1 - 0.02)), STEEL, { skip: 'we' });
      for (const px of [a, (a + b) / 2]) e.box(px - 0.03, CON_Y, sd * (CON_Z + 0.2) - 0.03, px + 0.03, CON_Y + 1.06, sd * (CON_Z + 0.2) + 0.03, STEEL, { skip: 'tb' });
    });
    yield 'derby: concourse';
  }
}

// The roof (a dark slab on beams, the lamps hung at 19 m) and the two end walls: pads along the foot, the twelve
// pigments in a ring round the hoop, the casing of the board, and two galleries either side with the rule and the
// end's own words on their parapets. Returns the lamps' glows.
const BW = 21, BH = BW * 320 / 1024, BY = 13.4;        // a scoreboard: its width, its height (as its picture's), and the height of its middle
function* buildShell(deck) {
  const g = deck.bucket(0, 0, 'roof').g, glows = [];
  lengths(-XE, XE, (a, b) => g.floor(a, -ZW, b, ZW, HC, '#2f2b27', { down: true }));
  for (let x = -XE; x <= XE + 0.01; x += BAY / 2) g.box(x - 0.3, HB, -ZW, x + 0.3, HC, ZW, '#3d3833', { skip: 't' });
  for (const z of [-22, -11, 0, 11, 22]) lengths(-XE, XE, (a, b) => g.box(a, HC - 0.4, z - 0.2, b, HC, z + 0.2, '#37322e', { skip: 'twe' }));
  yield 'derby: roof';
  // floodlights over the floor, four rows of twenty; smaller, warmer lamps over the stands (each kind modelled once)
  deck.proto('flood', (q) => {
    q.box(-1.3, 0, -0.7, 1.3, 0.3, 0.7, DARK, { skip: 'b' }).floor(-1.2, -0.6, 1.2, 0.6, 0, '#fff8ea', { down: true, emit: 8 });
    for (const sx of [-1, 1]) q.box(sx * 1.1 - 0.04, 0.3, -0.04, sx * 1.1 + 0.04, HC - 0.4 - HB, 0.04, STEEL, { skip: 'tb' });
  });
  deck.proto('standLamp', (q) => { q.box(-0.85, 0, -0.45, 0.85, 0.25, 0.45, DARK, { skip: 'b' }).floor(-0.78, -0.38, 0.78, 0.38, 0, '#ffe6c0', { down: true, emit: 4 }); });
  for (let i = 0; i < 20; i++) {
    const x = -XE + BAY / 4 + i * BAY / 2;
    for (const z of [-12, -4, 4, 12]) { deck.put('flood', { p: [x, HB, z] }); glows.push({ p: [x, HB - 0.08, z], color: '#fff6e4', power: 3.4, size: 2.0 }); }
    for (const z of [-22.5, 22.5]) { deck.put('standLamp', { p: [x, HB, z] }); glows.push({ p: [x, HB - 0.08, z], color: '#ffe2b8', power: 2.2, size: 1.7 }); }
  }
  yield 'derby: lamps';
  // the end walls
  for (const s of [-1, 1]) {
    const e = deck.bucket(0, 0, s < 0 ? 'anti' : 'spin').g, X = s * XE, zs = s < 0 ? -1 : 1;
    const wall = (z0, z1, y0, y1, col, em = 0, out = 0) => (s < 0 ? wallE : wallW)(e, X - s * out, z0, z1, y0, y1, col, em);
    // pads along the foot, then plaster in two bands with a dark line between
    for (let z = -ZW, k = 0; z < ZW - 0.01; z += 1.85, k++) wall(z, Math.min(ZW, z + 1.85), 0, 2.2, k % 2 ? '#6b4a2c' : '#74522f');
    const Q = 3.2;
    for (const [z0, z1] of [[-ZW, -Q], [Q, ZW]]) { wall(z0, z1, 2.2, 13.2, PLASTER); wall(z0, z1, 13.2, 13.5, DADO); wall(z0, z1, 13.5, HC, PLASTER2); }
    wall(-Q, Q, 2.2, HY - Q, PLASTER); wall(-Q, Q, HY + Q, 13.2, PLASTER); wall(-Q, Q, 13.2, 13.5, DADO); wall(-Q, Q, 13.5, HC, PLASTER2);
    yield 'derby: end wall';
    // round the hoop: a steel collar, the twelve pigments, a dark line, and plaster out to the square
    const N = 40, P = (a, r) => [X, HY + r * Math.sin(a), zs * r * Math.cos(a)];
    for (let i = 0; i < N; i++) {
      const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, am = (a0 + a1) / 2;
      const d0 = Q / Math.max(Math.abs(Math.cos(a0)), Math.abs(Math.sin(a0))), d1 = Q / Math.max(Math.abs(Math.cos(a1)), Math.abs(Math.sin(a1)));
      e.quad(P(a0, HOOP), P(a0, 1.8), P(a1, 1.8), P(a1, HOOP), '#4a4540');
      e.quad(P(a0, 1.8), P(a0, 2.5), P(a1, 2.5), P(a1, 1.8), PIGMENTS[Math.floor(am / TAU * 12) % 12]);
      e.quad(P(a0, 2.5), P(a0, 2.62), P(a1, 2.62), P(a1, 2.5), LINE);
      e.quad(P(a0, 2.62), P(a0, d0), P(a1, d1), P(a1, 2.62), PLASTER);
      if (s > 0) {
        // the spinward hoop is not the way out: a dark throat behind it
        const B = (a) => [X + 1.2, HY + HOOP * Math.sin(a), zs * HOOP * Math.cos(a)];
        e.quad(P(a0, HOOP), P(a1, HOOP), B(a1), B(a0), '#1b171c');
        e.tri([X + 1.2, HY, 0], B(a0), B(a1), '#0c0a0e');
      }
    }
    yield 'derby: end wall';
    // the board's casing, on two brackets
    const x0 = Math.min(X, X - s * 0.5), x1 = Math.max(X, X - s * 0.5);
    e.box(x0, BY - BH / 2 - 0.2, -BW / 2 - 0.2, x1, BY + BH / 2 + 0.2, BW / 2 + 0.2, '#1f1c1a');
    for (const z of [-BW / 2 + 2, BW / 2 - 2]) e.box(x0, BY + BH / 2 + 0.2, z - 0.1, x1, HC, z + 0.1, STEEL, { skip: 'tb' });
    // the galleries either side of the hoop: a slab, a parapet hung in the colours of whoever has that end today, a
    // step for the back row, lit doors behind
    const drape = s < 0 ? '#8f2f38' : '#b9853a', xi = X - s * GAL_D, ink = s < 0 ? '#fff0ea' : '#21170e';
    const span = (a, b) => [Math.min(a, b), Math.max(a, b)];
    GALLERIES.forEach(([gy, za, zb], level) => {
      for (const sz of [-1, 1]) {
        const [z0, z1] = span(sz * za, sz * zb), [xa, xb] = span(X, xi), [pa, pb] = span(xi, xi - s * 0.12), [sa, sb] = span(X, X - s * (GAL_D - 0.9));
        e.box(xa, gy - 0.28, z0, xb, gy, z1, '#8d8068', { top: '#a59a86' });
        const [q0, q1] = span(sz * za, sz * Math.min(zb, CON_Z + 0.24));      // (the upper one stops where the concourse comes round to it)
        e.box(pa, gy - 0.28, q0, pb, gy + 0.95, q1, drape, { top: DADO });
        e.box(sa, gy, z0, sb, gy + 0.3, z1, '#978b76', { skip: 'b' });
        for (let z = za + 3; z < zb - 1.5; z += 6.4) wall(sz * z - 0.8, sz * z + 0.8, gy + 0.3, gy + 2.5, '#f0c890', 0.7, 0.02);
        // on the parapets: the rule beside the hoop it is true of, and above it what that end has to say for itself
        const left = sz === (s < 0 ? 1 : -1), words = level ? (s < 0 ? ['Planning a third', 'Keep the difference'] : ['Never once wrong', 'Sign for the dose']) : (s < 0 ? ['Anti', 'floats'] : ['Spin', 'sinks']);
        deck.sign(words[left ? 0 : 1], { at: [xi - s * 0.15, gy + 0.36, sz * (level ? 14.5 : (za + zb) / 2)], n: [-s, 0], w: level ? 12 : 8.6, h: level ? 0.86 : 1.0, style: 'board', font: 'cond', ground: drape, ink, track: level ? 0.1 : 0.2 });
      }
    });
    yield 'derby: end wall';
  }
  return glows;
}

// A hoop: a steel ring with a lit strip inside it, and four lugs that hold it to its wall. Modelled once, about its
// own middle, on a wall x = 0 with the hall on its spinward side, and stood at both ends (the world does it: the one
// the flight leaves by has a material of its own, so that it can flare when a ball goes through).
function hoopGeo() {
  const g = new Geo(), pts = [], lit = [], N = 36;
  for (let i = 0; i <= N; i++) { const a = i / N * TAU; pts.push([0, Math.sin(a) * (HOOP + 0.13), Math.cos(a) * (HOOP + 0.13)]); lit.push([0.05, Math.sin(a) * (HOOP + 0.035), Math.cos(a) * (HOOP + 0.035)]); }
  g.tube(pts, 0.13, 6, '#cfc8ba');
  g.tube(lit, 0.045, 4, '#fff2d6', { emit: 3.2 });
  for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; g.cube(0, Math.sin(a) * (HOOP + 0.3), Math.cos(a) * (HOOP + 0.3), 0.3, 0.26, 0.26, STEEL); }
  return g.build();
}

// At the halfway line, inside the boards: an umpire on a high chair each side; and along the front boards the two
// benches, with those who are not among the nine on the floor.
function sideline(deck, rng) {
  const g = deck.bucket(0, 0, 'pitch').g, spots = [];
  for (const s of [-1, 1]) {
    const z = s * (ZP - 1.05), wood = s > 0 ? '#8a6a44' : '#6e7a6a';
    g.at(0, 0, z, s > 0 ? Math.PI : 0);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.tube([[sx * 0.52, 0, sz * 0.5], [sx * 0.3, 2.45, sz * 0.26]], 0.035, 5, wood);
    for (let k = 1; k < 6; k++) { const u = k / 6; g.box(-0.5 + 0.2 * u, 2.45 * u - 0.02, 0.5 - 0.24 * u - 0.03, 0.5 - 0.2 * u, 2.45 * u + 0.02, 0.5 - 0.24 * u + 0.03, '#b39a70'); }
    g.box(-0.36, 2.45, -0.32, 0.36, 2.51, 0.32, '#b89868').box(-0.36, 2.51, -0.32, 0.36, 3.2, -0.27, wood, { skip: 'b' }).box(-0.36, 1.95, 0.3, 0.36, 1.99, 0.52, '#b89868');
    g.pop();
    spots.push({ p: [0, 2.5, z], sit: true, yaw: s > 0 ? Math.PI : 0, color: '#efe6d2' });
  }
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? -15 : 4, z = -(ZP - 0.75), shirt = side < 0 ? MADDER : OCHRE;
    g.box(x0, 0.4, z - 0.2, x0 + 11, 0.46, z + 0.2, side < 0 ? '#7a5c3c' : '#96744a');
    for (let x = x0 + 0.4; x < x0 + 11; x += 2.5) g.box(x - 0.05, 0, z - 0.18, x + 0.05, 0.4, z + 0.18, STEEL, { skip: 'tb' });
    for (let x = x0 + 0.7; x < x0 + 10.6; x += 1.15) if (rng() < 0.75) spots.push({ p: [x + rng.f(-0.1, 0.1), 0.46, z + 0.02], sit: true, yaw: 0, color: shirt });
    spots.push({ p: [x0 + (side < 0 ? 11.8 : -0.8), 0, z + 0.5], yaw: side < 0 ? -0.5 : 0.5, color: '#efe6d2' });
  }
  deck.people(spots);
}

// ---------------------------------------------------------------- ten thousand people
// Everyone in the stands is one of three instanced meshes with shaders of their own: people, the flags some hold and
// the scarves some hold up. Each copy carries its seat and its mood: which half it sits in, the second it gets up
// when the ball goes through, and a number of its own. Sitting becomes standing by stretching the figure; a hop is a
// parabola at this deck's weight. uT is the flight's seconds, so the hall and the ball keep one clock.
const CROWD_PARS = /* glsl */`
attribute vec4 aSeat;     // where (flat), and the turn that faces it the way it looks (0: toward the front wall)
attribute vec4 aMood;     // 1 in Madder's half; 1 if on its feet all game (2: and modelled standing); the second it gets up at the goal; a number of its own
${BEND_PARS}
uniform float uTime, uT, uGoal, uThrow; uniform vec4 uBall;      // where the ball is (flat), and 1 while it is in the air
// x: how far it is stretched out of its seat (0 sitting, 1 standing); y: metres off the floor in a hop; z: 1 if on its feet
vec3 kStand() {
  float rnd = aMood.w, red = aMood.x, after = uT - aMood.z;
  // while the last throw is in the air a third of the hall gets to its feet; Ochre's third sits down again
  float ant = step(rnd, 0.35) * smoothstep(0.0, 0.5, uT - (uThrow + 0.8 + rnd * 9.0)) * mix(1.0 - smoothstep(0.4, 1.6, uT - uGoal), 1.0, red);
  // and wherever a throw goes over, three in ten get up to watch it, and sit down behind it
  float over = step(fract(rnd * 3.3), 0.3) * uBall.w * smoothstep(22.0, 6.0, abs(aSeat.x - uBall.x));
  float up = max(max(step(0.5, aMood.y), over), max(ant, red * smoothstep(0.0, 0.45, after)));
  // (hops keep the page's clock, not the flight's: the engine may hold the flight short of the hoop for a world not yet built, and the stands must go on leaping)
  float per = 0.72 + 0.22 * fract(rnd * 7.31), u = fract(uTime / per + rnd);
  float hop = red * smoothstep(0.3, 0.75, after) * 4.0 * u * (1.0 - u) * (0.16 + 0.24 * fract(rnd * 13.7));
  return vec3(up * (1.0 - step(1.5, aMood.y)), hop, up);
}
vec3 kTurn(vec3 v) { float c = cos(aSeat.w), s = sin(aSeat.w); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }`;
const CROWD_VERT = /* glsl */`
attribute vec4 aCol; attribute vec3 aCoat;
${CROWD_PARS}
uniform vec3 uSkin[6]; uniform vec3 uHair[5];
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol;
void main() {
  vec3 p = position * (0.9 + 0.18 * fract(aMood.w * 5.3) - 0.22 * step(0.93, fract(aMood.w * 29.1))), n = normal;      // no two the same height, and a few children
  vec3 st = kStand();
  float top = step(0.7, position.y);
  p.y += mix(-0.34, 0.44, top) * st.x + st.y;
  p.x += top * 0.03 * sin(uTime * (0.6 + aMood.w) + aMood.w * 40.0);
  p = kTurn(p) + aSeat.xyz; n = kTurn(n);
  vF = p; vFN = n;
  kBend(p, n);
  vW = p; vN = n;
  vec3 skin = uSkin[int(mod(aMood.w * 61.0, 6.0))];
  // hair, or for one in five a knitted hat in their colours
  vec3 hair = fract(aMood.w * 17.3) < 0.2 ? aCoat * 0.85 : uHair[int(mod(aMood.w * 131.0, 5.0))];
  vCol = aCol.a > 0.75 ? aCol.rgb * aCoat : aCol.a > 0.4 ? aCol.rgb * skin : aCol.a > 0.15 ? aCol.rgb * hair : aCol.rgb;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const crowdFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  // (not by a half: a face that looks straight down would then have no normal at all, and draw as a hole in the picture)
  N = normalize(mix(N, kUp(vW), 0.45)); FN = normalize(mix(FN, vec3(0.0, 1.0, 0.0), 0.45));
  gl_FragColor = vec4(kAir(vCol * kLight(vW, N, vF, FN), vW), 1.0);
}`;
// A flag: a pole held in two hands and a cloth on it. The pole is waved from side to side; the cloth trails the way
// the pole's head has come from, hangs for a moment at each end of the swing, and ripples along its length.
const FLAG_VERT = /* glsl */`
attribute vec4 aFlag;     // the pole's length; how keenly it is waved, 0..1; -; -
attribute vec3 aColA; attribute vec3 aColB;
${CROWD_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vColB; varying float vV;
void main() {
  vec3 st = kStand();
  float rnd = aMood.w, red = aMood.x, after = uT - aMood.z;
  float mad = red * smoothstep(0.0, 0.7, after);                          // Madder's half, once the ball is through
  float low = (1.0 - red) * smoothstep(0.3, 2.2, uT - uGoal);             // Ochre's flags come down
  float amp = mix(0.16 + 0.2 * aFlag.y, 0.62, mad) * (1.0 - 0.8 * low), own = 0.85 + 0.3 * fract(rnd * 3.7), w0 = (1.1 + 0.9 * aFlag.y) * own, w1 = 2.9 * own;
  // the swing quickens when the ball goes through. Its phase is the sum of its rate so far, not the rate times the
  // clock: the page's clock may stand at any number of seconds, and a rate that changed would throw the flag about
  float a2 = max(after, 0.0) * red, more = a2 < 0.7 ? a2 * a2 / 1.4 : a2 - 0.35;
  float ph = uTime * w0 + (w1 - w0) * more + rnd * 40.0, th = amp * sin(ph), sw = amp * mix(w0, w1, mad) * cos(ph);
  float lean = mix(0.3, 0.08, mad) + 1.05 * low;
  float Lp = aFlag.x, Wc = Lp * 0.6, Hc = Lp * 0.38;
  vec3 q; vV = -1.0;
  if (position.z < 0.5) q = vec3(position.x, position.y * Lp, 0.0);
  else {
    float u = position.x, v = position.y, dir = clamp(-sw * 1.6, -1.0, 1.0), hang = sqrt(1.0 - dir * dir);
    float rip = sin(u * 7.0 - uTime * 4.0 - 3.0 * more + rnd * 20.0) * u;
    q = vec3(u * Wc * dir, Lp - v * Hc - u * Wc * hang * 0.8 - u * u * 0.1 * Hc, rip * Hc * 0.2 + u * Wc * 0.12 * hang);
    vV = v;
  }
  float c = cos(th), s = sin(th); q = vec3(q.x * c - q.y * s, q.x * s + q.y * c, q.z);
  float cl = cos(lean), sl = sin(lean); q = vec3(q.x, q.y * cl + q.z * sl, -q.y * sl + q.z * cl);
  q.y += 0.95 + 0.44 * st.z + st.y;
  q.z -= 0.2;
  vec3 p = aSeat.xyz + kTurn(q), n = kTurn(vec3(0.0, 0.35, -1.0));
  vF = p; vFN = n;
  kBend(p, n);
  vW = p; vN = n;
  vCol = vV < 0.0 ? vec3(0.42, 0.36, 0.28) : aColA; vColB = aColB;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const flagFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vColB; varying float vV;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(mix(normalize(vN), kUp(vW), 0.6)), FN = normalize(mix(normalize(vFN), vec3(0.0, 1.0, 0.0), 0.6));
  vec3 c = vV > 0.36 && vV < 0.64 ? vColB : vCol;
  gl_FragColor = vec4(kAir(c * kLight(vW, N, vF, FN), vW), 1.0);
}`;
// A scarf held up between two hands, swaying with its row. Most of Madder's come up when the ball goes through.
const SCARF_VERT = /* glsl */`
attribute vec4 aCol; attribute vec3 aColA; attribute float aHold;
${CROWD_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vColB; varying float vV;
void main() {
  vec3 st = kStand();
  float red = aMood.x, after = uT - aMood.z;
  float held = max(step(aHold, 0.13), red * step(aHold, 0.6) * smoothstep(0.25, 0.9, after));
  float sway = sin(uTime * 1.5 + 1.3 * red * max(after, 0.0) + (aSeat.x + aSeat.z) * 0.33 + aSeat.y * 0.9);
  vec3 q = vec3(position.x + 0.2 * sway, position.y + 1.48 + 0.44 * st.z + st.y - 0.07 * (1.0 - 4.0 * position.x * position.x) + 0.1 * position.x * sway, -0.05);
  q = mix(vec3(0.0, 0.9, 0.0), q, held);
  vec3 p = aSeat.xyz + kTurn(q), n = kTurn(vec3(0.0, 0.3, -1.0));
  vF = p; vFN = n;
  kBend(p, n);
  vW = p; vN = n;
  vCol = mix(aCol.rgb, aCol.rgb * aColA, aCol.a); vColB = vCol; vV = -1.0;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

// someone in the stands, facing -z. 'plain': a coat and a head, sitting (the shader stretches it to stand). 'sit': the
// same with a rounder head, for the rows the flight starts over. 'stand': modelled on its feet, with legs, arms and a
// scarf, for those along the rail the flight starts behind.
function specGeo(kind) {
  const g = new Geo();
  if (kind === 'plain') {
    g.tint(1).box(-0.21, 0.42, -0.13, 0.21, 1.02, 0.13, '#ffffff', { skip: 'b' });
    g.tint(0.5).box(-0.1, 1.05, -0.1, 0.1, 1.29, 0.1, '#ffffff', { skip: 'bt' });
    g.tint(0.3).floor(-0.1, -0.1, 0.1, 0.1, 1.29, '#ffffff').quad([-0.1, 1.19, 0.102], [0.1, 1.19, 0.102], [0.1, 1.29, 0.102], [-0.1, 1.29, 0.102], '#ffffff');
  } else if (kind === 'sit') {
    g.tint(1).cyl(0, 0.42, 0, 0.225, 0.19, 0.58, 6, '#ffffff', { smooth: false });
    g.at(0, 0, 0, 0, [-1, 1, 1]);      // (a blob's faces wind inward: under a mirror they face out, and the hair sits on the head)
    g.tint(0.5).blob(0, 1.165, 0, 0.118, 0, '#ffffff', { shadeBottom: 0.8 });
    g.tint(0.3).blob(0, 1.2, 0.02, [0.124, 0.095, 0.126], 0, '#ffffff', { shadeBottom: 0.9 });
    g.pop();
  } else {
    g.tint(0);
    for (const sx of [-1, 1]) g.box(sx * 0.1 - 0.075, 0, -0.085, sx * 0.1 + 0.075, 0.88, 0.085, '#4d4a48', { skip: 'tb' });
    g.tint(1).cyl(0, 0.8, 0, 0.245, 0.2, 0.64, 6, '#ffffff', { smooth: false });
    for (const sx of [-1, 1]) g.box(sx * 0.28 - 0.055, 0.84, -0.07, sx * 0.28 + 0.055, 1.42, 0.07, '#e4e4e4');
    g.tint(0).cyl(0, 1.41, 0, 0.155, 0.145, 0.085, 6, '#f1e6d6', { smooth: false, cap: false });
    g.at(0, 0, 0, 0, [-1, 1, 1]);
    g.tint(0.5).blob(0, 1.6, 0, 0.122, 0, '#ffffff', { shadeBottom: 0.8 });
    g.tint(0.3).blob(0, 1.636, 0.022, [0.128, 0.098, 0.13], 0, '#ffffff', { shadeBottom: 0.9 });
    g.pop();
  }
  return g.build();
}
function flagGeo() {
  const pos = [], nx = 8, ny = 3, quad = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  quad([-0.025, 0, 0], [0.025, 0, 0], [0.025, 1, 0], [-0.025, 1, 0]);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) quad([i / nx, (j + 1) / ny, 1], [(i + 1) / nx, (j + 1) / ny, 1], [(i + 1) / nx, j / ny, 1], [i / nx, j / ny, 1]);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  return g;
}
function scarfGeo() {
  const g = new Geo(), n = 5;
  for (let i = 0; i < n; i++) { const a = -0.52 + 1.04 * i / n, b = -0.52 + 1.04 * (i + 1) / n; g.tint(i % 2 ? 0 : 1).quad([a, 0, 0], [b, 0, 0], [b, 0.15, 0], [a, 0.15, 0], i % 2 ? '#f4e9dc' : '#ffffff'); }
  return g.build();
}
function instanced(base, n, attrs) {
  const ig = new InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'aCol']) if (base.getAttribute(k)) ig.setAttribute(k, base.getAttribute(k));
  for (const k in attrs) ig.setAttribute(k, new InstancedBufferAttribute(attrs[k][0], attrs[k][1]));
  ig.instanceCount = n;
  ig.boundingSphere = new Sphere(new Vector3(), 1e5);
  return ig;
}

// The galleries on each end wall, either side of the hoop: decks 237 and 238, the upper one the concourse carried round.
// [floor, from |z|, to |z|]
const GALLERIES = [[4, 3.4, ROW_Z], [CON_Y, 3.4, ZW]], GAL_D = 2.5;
const NEUTRAL = ['#8c8577', '#2f3b45', '#d7d2c4', '#4f6f8f', '#5a5f52', '#6b6258', '#3f4a4f', '#e7e1d3', '#4a4038'];

// Fill the stands. Returns the meshes; U.t is the uniform that carries the flight's seconds.
// (Nobody here is an object: each is a row of numbers written straight into the tables the meshes are drawn from.
// Ten thousand small objects made in a few milliseconds are ten thousand things for the collector to move, and it
// does that in the middle of somebody else's flight.)
const CROWD_MAX = 13000, SCARF_RED = [ROSE, MADDER, '#c9565a'], SCARF_YEL = [OCHRE, '#c08a3e', '#e8c078'];
function* buildCrowd(deck, ctx, rng, U, pts) {
  const dens = ctx.density || 1, fill = Math.min(0.97, 0.55 + 0.42 * dens), frame = deck.frame;
  const nStart = 30, closePts = [...pts.slice(0, nStart), ...pts.slice(-18)];      // the flight's first fifteen seconds and its last nine, a point each half second
  // a table: for each of up to CROWD_MAX rows, so many numbers under each name
  const table = (cols) => { const t = { n: 0 }; for (const k in cols) t[k] = new Float32Array(CROWD_MAX * cols[k]); return t; };
  const folk = [0, 1, 2].map(() => table({ seat: 4, mood: 4, coat: 3 }));      // plain; sitting, near the flight; standing, near the flight
  const flags = table({ seat: 4, mood: 4, flag: 4, a: 3, b: 3 }), scarves = table({ seat: 4, mood: 4, a: 3, hold: 1 }), lamps = [];
  // how far a place is from the flight's start (closePts up to nStart) or from its end (the rest). Only by one of the
  // two can anyone be near it, and the sum is dear before the browser has made it fast: so the start is asked after
  // only for seats within 13.5 m of it along the hall, on its own side, and the end only for the anti end's galleries
  // (the run-in is down the middle of the floor, and no seat in a stand is within 15 m of that)
  const toFlight = (x, y, z, from, to) => { let best = 1e9; for (let i = from; i < to; i++) { const p = closePts[i], d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) + (p.z - z) * (p.z - z); if (d < best) best = d; } return Math.sqrt(best); };
  let xa = 1e9, xb = -1e9;
  for (let i = 0; i < nStart; i++) { xa = Math.min(xa, closePts[i].x - 13.5); xb = Math.max(xb, closePts[i].x + 13.5); }
  // Is a seat out of the flight's way? deck.clear answers that, by asking all of the flight, close-set (458 points),
  // about the one place: asked of five hundred seats before the browser has made it fast, that was most of this
  // function's time and of what it threw away. These are the same points, made as the kit makes them, but only those
  // over the Panel Yard stand (every other is metres from any seat asked about), and of those, for each row, only the
  // few within reach of it. The answers are deck.clear's own.
  const way = [];
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(a.distanceTo(b) / 0.6)); for (let k = 0; k < n; k++) { const p = a.clone().lerp(b, k / n); if (p.z > 14.5) way.push(p); } }
  let reach = [];
  const rowWay = (y, z, r) => { reach = []; for (const p of way) if (Math.abs(p.z - z) < r && Math.abs(p.y - y) < r) reach.push(p.x, p.y, p.z); };
  const clearOf = (x, y, z, r) => { const r2 = r * r; for (let i = 0; i < reach.length; i += 3) { const dx = reach[i] - x, dy = reach[i + 1] - y, dz = reach[i + 2] - z; if (dx * dx + dy * dy + dz * dz < r2) return false; } return true; };
  const copy = (to, j, from, i) => { for (let k = 0; k < 4; k++) { to.seat[j * 4 + k] = from.seat[i * 4 + k]; to.mood[j * 4 + k] = from.mood[i * 4 + k]; } };
  // yaw: the turn that faces them the way they look. calm: no big flag; bare: no flag at all (beside the hoop);
  // byHoop: on a gallery of the anti end, where the flight goes out
  const add = (x, y, z, yaw, stand, calm, bare, byHoop) => {
    const red = x < 0 ? 1 : 0, r = rng(), coat = rgb(r < 0.58 ? rng.pick(red ? RED : YEL) : r < 0.7 ? (red ? '#f6e6e0' : '#fff3dc') : rng.pick(NEUTRAL));
    const dFlight = byHoop ? toFlight(x, y + 1, z, nStart, closePts.length) : z > 0 && x > xa && x < xb ? toFlight(x, y + 1, z, 0, nStart) : 99, near = dFlight < 13;
    const t = folk[near ? (stand ? 2 : 1) : 0], i = t.n++, s4 = i * 4;
    t.seat[s4] = x; t.seat[s4 + 1] = y; t.seat[s4 + 2] = z; t.seat[s4 + 3] = yaw;
    t.mood[s4] = red; t.mood[s4 + 1] = stand ? (near ? 2 : 1) : 0; t.mood[s4 + 2] = TG + 0.06 + Math.sqrt((x + XE) * (x + XE) + z * z) / 130 + rng() * 0.5; t.mood[s4 + 3] = rng();
    t.coat[i * 3] = coat[0]; t.coat[i * 3 + 1] = coat[1]; t.coat[i * 3 + 2] = coat[2];
    const h = rng(), big = stand && !calm && rng() < 0.05;
    if (!bare && dFlight > (big ? 6.5 : 4.6) && (h < 0.05 * Math.min(1, dens + 0.2) || big)) {      // (and nobody waves one across the lens)
      const a = rgb(rng.pick(red ? RED : YEL)), b = rgb(red ? (rng() < 0.6 ? '#f6e6e0' : ROSE) : (rng() < 0.6 ? BROWN : '#fff3dc')), b2 = rng() < 0.3 ? a : b, j = flags.n++;
      copy(flags, j, t, i);
      flags.flag[j * 4] = big ? rng.f(4.0, 5.2) : rng.f(1.9, 2.7); flags.flag[j * 4 + 1] = rng();
      for (let k = 0; k < 3; k++) { flags.a[j * 3 + k] = a[k]; flags.b[j * 3 + k] = b2[k]; }
    } else {
      const hold = rng();
      if (hold < 0.13 || (red && hold < 0.6)) {
        const a = rgb(rng.pick(red ? SCARF_RED : SCARF_YEL)), j = scarves.n++;
        copy(scarves, j, t, i);
        scarves.hold[j] = hold;
        for (let k = 0; k < 3; k++) scarves.a[j * 3 + k] = a[k];
      } else if (red && rng() < 0.22) lamps.push({ p: [x - Math.sin(yaw) * 0.14, y + (stand ? 2.1 : 1.75), z - Math.cos(yaw) * 0.14], color: rng() < 0.75 ? '#ffd9a8' : '#ffb0a0', power: rng.f(2.2, 4.2), size: 0.34, twinkle: 0.5, phase: rng() });
    }
  };
  // (the loops over people are in functions of their own, not in this generator: a plain function with a long loop in
  // it is made fast by the browser after a few hundred turns, and a generator is not)
  const seatRow = (s, i) => {
    const y = rowY(i), z = s * (rowZ(i) + 0.47), yaw = s > 0 ? 0 : Math.PI;
    if (s > 0) rowWay(y + 1.15, z, 1.3);
    for (let x = -XE + 0.5; x < XE - 0.3; x += 0.56) {
      if (inAisle(x, 0.2) || rng() > fill || (i > 9 && Math.abs(x) > XE - GAL_D - 0.3) || (s > 0 && x > -58 && x < -41 && !clearOf(x, y + 1.15, z, 1.3))) continue;
      add(x + rng.f(-0.05, 0.05), y, z, yaw, 0, false, false, false);
    }
  };
  // on their feet along the rail of a concourse, two deep
  const railRow = (s, row) => {
    const z = s * (CON_Z + (row ? 1.3 : 0.62)), yaw = s > 0 ? 0 : Math.PI;
    if (s > 0) rowWay(CON_Y + 1.45, z, 1.9);
    for (let x = -XE + GAL_D + 0.4; x < XE - GAL_D - 0.2; x += 0.62) {
      const px = x + rng.f(-0.1, 0.1);
      if (rng() > (row ? 0.5 : 0.86) * fill || (s > 0 && px > -58 && px < -46 && !clearOf(px, CON_Y + 1.45, z, 1.9))) continue;
      add(px, CON_Y, z, yaw, 1, false, false, false);
    }
  };
  // and on an end gallery, two deep, the back row on a step
  const gallery = (e, level) => {
    const gy = GALLERIES[level][0], za = GALLERIES[level][1], zb = GALLERIES[level][2];
    for (const sz of [-1, 1]) for (let row = 0; row < 2; row++) for (let z = za + 0.45; z < zb - 0.3; z += 0.6) {
      if (rng() > (row ? 0.7 : 0.92) * fill) continue;
      add(e * (XE - GAL_D + (row ? 1.25 : 0.55)), gy + (row ? 0.3 : 0), sz * (z + rng.f(-0.08, 0.08)), e * Math.PI / 2, 1, z < 10, z < (level ? 11.5 : 5.6), e < 0);
    }
  };
  let t0 = performance.now();
  for (const s of [1, -1]) {
    for (let i = 0; i < NROW; i++) { seatRow(s, i); if (performance.now() - t0 > 3) { yield 'derby: seats'; t0 = performance.now(); } }
    railRow(s, 0); railRow(s, 1);
    yield 'derby: concourse folk';
  }
  for (const e of [-1, 1]) for (let level = 0; level < 2; level++) gallery(e, level);
  yield 'derby: gallery folk';
  const bend = () => ({ value: new Vector3(frame.a0, frame.z0, frame.floorR) });
  const uni = () => ({ ...deck.rig.uniforms, uClip: G.uClip, uTime: G.uTime, uBend: bend(), uT: U.t, uBall: U.ball, uGoal: { value: TG }, uThrow: { value: TL } });
  const cut = (t, k, size) => [t[k].slice(0, t.n * size), size];      // a table's column, as long as it was filled
  const out = [];
  // people: one mesh of plain figures, and two of better ones round where the flight begins and ends
  const crowdMat = new ShaderMaterial({ uniforms: { ...uni(), uSkin: { value: SKIN.map((c) => new Vector3(...rgb(c))) }, uHair: { value: ['#2a221c', '#4a3c30', '#6b5540', '#9a8f84', '#c9a878'].map((c) => new Vector3(...rgb(c))) } }, vertexShader: CROWD_VERT, fragmentShader: crowdFrag(deck.rig) });
  ['plain', 'sit', 'stand'].forEach((kind, k) => {
    const t = folk[k];
    if (!t.n) return;
    const mesh = new Mesh(instanced(specGeo(kind), t.n, { aSeat: cut(t, 'seat', 4), aMood: cut(t, 'mood', 4), aCoat: cut(t, 'coat', 3) }), crowdMat);
    mesh.frustumCulled = false; out.push(mesh);
  });
  yield 'derby: people';
  // flags, and scarves
  const flagMesh = new Mesh(instanced(flagGeo(), flags.n, { aSeat: cut(flags, 'seat', 4), aMood: cut(flags, 'mood', 4), aFlag: cut(flags, 'flag', 4), aColA: cut(flags, 'a', 3), aColB: cut(flags, 'b', 3) }),
    new ShaderMaterial({ uniforms: uni(), vertexShader: FLAG_VERT, fragmentShader: flagFrag(deck.rig), side: DoubleSide }));
  const scarfMesh = new Mesh(instanced(scarfGeo(), scarves.n, { aSeat: cut(scarves, 'seat', 4), aMood: cut(scarves, 'mood', 4), aColA: cut(scarves, 'a', 3), aHold: cut(scarves, 'hold', 1) }),
    new ShaderMaterial({ uniforms: uni(), vertexShader: SCARF_VERT, fragmentShader: flagFrag(deck.rig), side: DoubleSide }));
  flagMesh.frustumCulled = scarfMesh.frustumCulled = false; out.push(flagMesh, scarfMesh);
  yield '~derby: flags and scarves';      // (a few megabytes of tables have just been made and dropped: leave the rest of this frame to the collector)
  // hand lamps, dark until the ball is through
  const lampMesh = glowPoints(lamps, { bend: frame, minPx: 1.3, maxPx: 60, soft: 1.7, power: 0 });
  out.push(lampMesh);
  return { meshes: out, lamps: lampMesh, count: folk[0].n + folk[1].n + folk[2].n, flags: flags.n, scarves: scarves.n };
}

// ---------------------------------------------------------------- the boards
// A board of flip tiles at each end: the half, the clock, and two rows of nine tiles. It is painted once on a canvas
// 1024 x 320. The three tiles that turn while the flight lasts (two of the clock's, and Madder's score) are painted on
// a second, small canvas as pairs, the face going and the face coming, and the shader drops one flap over the other.
const TB = { w: 100, h: 108, x0: 38, pitch: 106, rows: [90, 204] }, TS = { y: 14, h: 62 };
const FONT_TILE = (px) => `500 ${px}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
const INK = { ochre: '#eebb6a', madder: '#f08f84', num: '#fbf3e0', small: '#d9cdb5' };
const LIVE_TILES = [[878, TS.y, 52, TS.h, INK.num], [934, TS.y, 52, TS.h, INK.num], [TB.x0 + 8 * TB.pitch, TB.rows[1], TB.w, TB.h, INK.num]];
function paintTile(cx, x, y, w, h, ch, ink) {
  cx.fillStyle = '#27231f'; cx.fillRect(x, y, w, h);
  cx.fillStyle = 'rgba(255,255,255,0.035)'; cx.fillRect(x, y, w, h / 2 - 1);
  if (ch && ch !== ' ') { cx.fillStyle = ink; cx.font = FONT_TILE(h * 0.9); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(ch, x + w / 2, y + h * (ch === ':' ? 0.48 : 0.54)); }
  cx.fillStyle = '#0d0c0b'; cx.fillRect(x, y + h / 2 - 1.5, w, 3); cx.fillRect(x, y + h / 2 - 5, 4, 10); cx.fillRect(x + w - 4, y + h / 2 - 5, 4, 10);
}
function* paintBoard(cx) {
  cx.fillStyle = '#131110'; cx.fillRect(0, 0, 1024, 320);
  'SECOND HALF'.split('').forEach((ch, i) => paintTile(cx, TB.x0 + i * 44, TS.y, 40, TS.h, ch, INK.small));
  yield 'derby: board: the half';
  ['0', ':', '4', '5'].forEach((ch, i) => paintTile(cx, 766 + i * 56, TS.y, 52, TS.h, ch, INK.num));
  for (let r = 0; r < 2; r++) {
    const name = r ? 'MADDER' : 'OCHRE ';
    for (let i = 0; i < 9; i++) paintTile(cx, TB.x0 + i * TB.pitch, TB.rows[r], TB.w, TB.h, i < 6 ? name[i] : i === 8 ? '8' : ' ', i < 6 ? (r ? INK.madder : INK.ochre) : INK.num);
    yield 'derby: board: a row';
  }
}
const BOARD_VERT = /* glsl */`
${BEND_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vUv;
void main() {
  vec3 p = position, n = normal;
  vF = p; vFN = n; vUv = uv;
  kBend(p, n);
  vW = p; vN = n;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const boardFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tMap, tLive; uniform float uGlow; uniform vec4 uSrc[3]; uniform vec2 uFlip[3];      // a tile's place on the board; how far its flap has fallen, and its flash
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vUv;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 c = texture2D(tMap, vUv).rgb;
  float k = uGlow;
  for (int i = 0; i < 3; i++) {
    vec2 q = (vUv - uSrc[i].xy) / uSrc[i].zw;
    if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) continue;
    float p = uFlip[i].x, ang = p * 3.14159265, xa = (float(i) * 2.0 + q.x) * 0.125, xb = xa + 0.125;
    if (q.y < 0.5) {
      // the upper half: the new face behind, the old flap falling in front of it
      float h = cos(min(ang, 1.5708)), yy = 0.5 - (0.5 - q.y) / max(h, 1e-3);
      c = p < 0.5 && yy >= 0.0 ? texture2D(tLive, vec2(xa, yy)).rgb * (0.5 + 0.5 * h) : texture2D(tLive, vec2(xb, q.y)).rgb;
    } else {
      // the lower half: the old face, the new flap coming down over it
      float h = -cos(max(ang, 1.5708)), yy = 0.5 + (q.y - 0.5) / max(h, 1e-3);
      c = p > 0.5 && yy <= 1.0 ? texture2D(tLive, vec2(xb, yy)).rgb * (0.5 + 0.5 * h) : texture2D(tLive, vec2(xa, q.y)).rgb;
    }
    k *= 1.0 + uFlip[i].y;
  }
  // (the canvases are kept as painted, not as light: a canvas sent into an sRGB texture is slow)
  c = mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
  gl_FragColor = vec4(kAir(c * (kLight(vW, normalize(vN), vF, normalize(vFN)) * 0.3 + k), vW), 1.0);
}`;
function* scoreBoards(deck) {
  const canvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  const texOf = (cv) => {
    const t = new CanvasTexture(cv);
    t.colorSpace = NoColorSpace; t.flipY = false; t.wrapS = t.wrapT = ClampToEdgeWrapping;
    t.minFilter = LinearMipmapLinearFilter; t.magFilter = LinearFilter; t.generateMipmaps = true; t.anisotropy = 8;
    return t;
  };
  const cv = canvas(1024, 320), cx = cv.getContext('2d', { willReadFrequently: true }), cvL = canvas(1024, 128), cxL = cvL.getContext('2d', { willReadFrequently: true });
  const tex = texOf(cv), live = texOf(cvL);
  yield 'derby: board: canvases';
  yield* paintBoard(cx);
  let gone = false, shown = -1;
  tex.addEventListener('dispose', () => { gone = true; });
  // the page's own type may not have arrived when the board is first lettered: letter it again when it has
  const probe = () => { cx.font = FONT_TILE(90); return cx.measureText('OCHRE MADDER 0123456789').width; };
  const w0 = probe();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!gone && probe() !== w0) { for (const part of paintBoard(cx)) { /* quick by now */ } tex.needsUpdate = true; shown = -1; } }, () => { /* the stand-in type stays */ });
  const pos = [], nrm = [], uv = [], y0 = BY - BH / 2, y1 = BY + BH / 2;
  for (const s of [-1, 1]) {
    const x = s * (XE - 0.52), l = -s * BW / 2, r = s * BW / 2;      // seen from the hall, z runs leftward on the anti wall and rightward on the spinward one
    const q = [[l, y0, 0, 1], [r, y0, 1, 1], [r, y1, 1, 0], [l, y1, 0, 0]];
    for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(x, q[i][1], q[i][0]); nrm.push(-s, 0, 0); uv.push(q[i][2], q[i][3]); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  const flip = [0, 1, 2].map(() => new Vector2(1, 0));
  const mat = new ShaderMaterial({
    uniforms: {
      ...deck.rig.uniforms, uClip: G.uClip, uBend: { value: new Vector3(deck.frame.a0, deck.frame.z0, deck.frame.floorR) }, tMap: { value: tex }, tLive: { value: live }, uGlow: { value: 0.95 },
      uSrc: { value: LIVE_TILES.map((r) => new Vector4(r[0] / 1024, r[1] / 320, r[2] / 1024, r[3] / 320)) }, uFlip: { value: flip },
    },
    vertexShader: BOARD_VERT, fragmentShader: boardFrag(deck.rig),
  });
  const mesh = fitBounds(new Mesh(g, mat), deck.frame);
  mesh.renderOrder = 1;
  // what the tiles read at t: the clock runs down from CLOCK and stops; Madder's score turns as the ball goes through
  const set = (t) => {
    const k = clamp(Math.floor(t), 0, CLOCK), n = CLOCK - k, was = Math.min(CLOCK, n + 1), p = t <= 0 || t >= CLOCK + 1 ? 1 : clamp((t - k) / 0.32, 0, 1);
    const g9 = clamp((t - TG - 0.12) / 0.6, 0, 1);
    if (n !== shown) {
      shown = n;
      [Math.floor(was / 10), Math.floor(n / 10), was % 10, n % 10, 8, 9].forEach((ch, i) => { const r = LIVE_TILES[i >> 1]; cxL.setTransform(128 / r[2], 0, 0, 128 / r[3], i * 128, 0); paintTile(cxL, 0, 0, r[2], r[3], String(ch), r[4]); });
      cxL.setTransform(1, 0, 0, 1, 0, 0);
      live.needsUpdate = true;
    }
    flip[0].x = Math.floor(was / 10) === Math.floor(n / 10) ? 1 : p; flip[1].x = p; flip[2].x = g9;
    flip[2].y = 1.6 * smoothstep(0.0, 0.3, t - TG - 0.4) * (1 - smoothstep(1.2, 4.5, t - TG));        // the new nine shines for a moment
  };
  set(0);
  return { mesh, set };
}

// ---------------------------------------------------------------- eighteen players, a ball and its trail
// A player: legs, shorts, a shirt with a band, a head; arms down, or up for whoever has the ball, is leaping for it or
// has just scored. The kit's figures cannot move their arms, so there are two figures and each player is one or the other.
function playerGeo(skin, up) {
  const g = new Geo();
  g.tint(0);
  for (const sx of [-1, 1]) g.box(sx * 0.1 - 0.065, 0, -0.075, sx * 0.1 + 0.065, 0.7, 0.075, skin, { skip: 'tb' }).box(sx * 0.1 - 0.075, 0, -0.1, sx * 0.1 + 0.075, 0.09, 0.14, '#3a3530', { skip: 'b' });
  g.tint(0.45).box(-0.2, 0.62, -0.12, 0.2, 0.92, 0.12, '#f1ebdf', { skip: 't' });
  g.tint(1).cyl(0, 0.9, 0, 0.22, 0.2, 0.56, 6, '#ffffff', { smooth: false });
  g.tint(0).cyl(0, 1.12, 0, 0.222, 0.214, 0.1, 6, '#f6f0e2', { smooth: false, cap: false });
  g.at(0, 0, 0, 0, [-1, 1, 1]).blob(0, 1.6, 0, 0.125, 0, skin, { shadeBottom: 0.8 }).blob(0, 1.64, -0.024, [0.131, 0.098, 0.132], 0, '#3d3128', { shadeBottom: 0.9 }).pop();
  for (const sx of [-1, 1]) {
    if (up) { g.tint(1).box(sx * 0.21 - 0.05, 1.3, -0.06, sx * 0.21 + 0.05, 1.62, 0.06, '#ffffff', { skip: 'b' }); g.tint(0).box(sx * 0.19 - 0.04, 1.62, -0.05, sx * 0.19 + 0.04, REACH - 0.08, 0.05, skin, { skip: 'b' }); }
    else { g.tint(1).box(sx * 0.26 - 0.05, 1.12, -0.06, sx * 0.26 + 0.05, 1.44, 0.06, '#ffffff', { skip: 'b' }); g.tint(0).box(sx * 0.27 - 0.04, 0.78, -0.05, sx * 0.27 + 0.04, 1.12, 0.05, skin, { skip: 't' }); }
  }
  return g.build();
}
const TRAIL_VERT = /* glsl */`
attribute float aFade;
varying vec3 vW; varying float vA;
void main() { vW = position; vA = aFade; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const TRAIL_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uColor;
varying vec3 vW; varying float vA;
void main() {
  ${CLIP_FRAG}
  gl_FragColor = vec4(uColor * vA * vA, 1.0);
}`;
// Under floodlights a shadow lies straight below what casts it. One soft patch for each player and one for the ball:
// without them nobody can see that a leap has left the floor, or how high a throw has gone.
const SHADOW_VERT = /* glsl */`
attribute vec3 aQ;        // which corner (-1..1), and how dark
${BEND_PARS}
varying vec3 vW; varying vec3 vQ;
void main() { vec3 p = position, n = vec3(0.0, 1.0, 0.0); vQ = aQ; kBend(p, n); vW = p; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`;
const SHADOW_FRAG = /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vQ;
void main() {
  ${CLIP_FRAG}
  gl_FragColor = vec4(0.06, 0.05, 0.04, vQ.z * smoothstep(1.0, 0.2, length(vQ.xy)));
}`;
const TRAIL_N = 56, TRAIL_S = 1.8;       // the trail: how many pieces, and how many seconds of flight it holds

// Stand the players, the ball and its trail in the scene. Returns move(t, camera), which puts them where they are at t.
function* makePlay(deck, scene) {
  const frame = deck.frame, skins = [SKIN[0], SKIN[2], SKIN[4], SKIN[1]], sets = [];
  const items = NAMES.map((name) => ({ p: [0, 0, 0], color: name[0] === 'M' ? MADDER : OCHRE }));
  for (let k = 0; k < skins.length; k++) {
    const mine = NAMES.map((_, i) => i).filter((i) => i % skins.length === k);
    const pair = [0, 1].map((up) => { const m = instances(playerGeo(skins[k], up), deck.lit, mine.map((i) => items[i]), { colors: true })[0]; m.frustumCulled = false; m.instanceMatrix.setUsage(DynamicDrawUsage); scene.add(m); return m; });
    sets.push({ mine, pair });
    yield 'derby: players';
  }
  // the ball: a small bright thing with a lamp in it
  const bg = new Geo(); bg.blob(0, 0, 0, 0.115, 1, '#fff3d6', { emit: 2.6, shadeBottom: 1 });
  const ball = bg.mesh(deck.plain); ball.frustumCulled = false; scene.add(ball);
  const glow = glowPoints([{ p: [0, 0, 0], color: '#ffe9b8', power: 5, size: 0.62 }], { bend: frame, minPx: 3.2, maxPx: 90, soft: 2.2 });
  scene.add(glow);
  const tg = new BufferGeometry(), tp = new Float32Array((TRAIL_N + 1) * 6), tf = new Float32Array((TRAIL_N + 1) * 2), idx = [];
  for (let i = 0; i < TRAIL_N; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  tg.setAttribute('position', new BufferAttribute(tp, 3).setUsage(DynamicDrawUsage));      // (not Float32BufferAttribute, which copies what it is given)
  tg.setAttribute('aFade', new BufferAttribute(tf, 1).setUsage(DynamicDrawUsage));
  tg.setIndex(idx);
  const trail = new Mesh(tg, new ShaderMaterial({ uniforms: { uClip: G.uClip, uColor: { value: new Vector3(1.9, 1.5, 0.9) } }, vertexShader: TRAIL_VERT, fragmentShader: TRAIL_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide }));
  trail.frustumCulled = false; trail.renderOrder = 9; scene.add(trail);

  const NS = NAMES.length + 1, sg = new BufferGeometry(), sp3 = new Float32Array(NS * 12), sq = new Float32Array(NS * 12), sidx = [];
  for (let i = 0; i < NS; i++) sidx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  sg.setAttribute('position', new BufferAttribute(sp3, 3).setUsage(DynamicDrawUsage));
  sg.setAttribute('aQ', new BufferAttribute(sq, 3).setUsage(DynamicDrawUsage));
  sg.setIndex(sidx);
  const shadows = new Mesh(sg, new ShaderMaterial({ uniforms: { uClip: G.uClip, uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) } }, vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false, side: DoubleSide }));
  shadows.frustumCulled = false; shadows.renderOrder = 2; scene.add(shadows);
  // patch i: under (x, z), r metres across, for something h metres off the floor
  const CX = [-1, 1, 1, -1], CZ = [1, 1, -1, -1];
  const shade2 = (i, x, z, r, h, dark) => {
    const rr = r * (1 + 0.25 * h), a = dark / (1 + 0.55 * h);
    for (let k = 0, o = i * 12; k < 4; k++, o += 3) { sp3[o] = x + CX[k] * rr; sp3[o + 1] = 0.05; sp3[o + 2] = z + CZ[k] * rr; sq[o] = CX[k]; sq[o + 1] = CZ[k]; sq[o + 2] = a; }
  };
  const st = [0, 0, 0, 0, 0], b = [0, 0, 0], q = [0, 0, 0], M = new Matrix4(), Q = new Quaternion(), P = new Vector3(), S = new Vector3(), Y = new Vector3(0, 1, 0);
  const wa = new Vector3(), wb = new Vector3(), side = new Vector3(), tan = new Vector3(), eye = new Vector3();
  const pts = []; for (let i = 0; i <= TRAIL_N; i++) pts.push(new Vector3());
  return (t, camera, ballOut, clock) => {
    const flying = ballAt(t, b);
    if (ballOut) { let a = 0; for (let n = 0; n < THROWS.length; n++) { const c = THROWS[n], d = t - c.t; if (d >= 0) a = Math.min(1, d / 0.25) * (1 - smoothstep(c.T, c.T + 0.7, d)); } ballOut.set(b[0], b[1], b[2], a); }
    // who has their arms up: whoever holds the ball or is about to take it, whoever is in the air, and Madder once it is in
    let holder = THROWS[0].by, taker = null;
    for (let n = 0; n < THROWS.length; n++) { const th = THROWS[n]; if (t >= th.t + th.T) holder = th.to; else if (t >= th.t) { holder = null; taker = th.to; if (t < th.t + 0.35) holder = th.by; if (t < th.t + th.T - 0.75) taker = null; } }
    for (let n = 0; n < sets.length; n++) for (let j = 0; j < sets[n].mine.length; j++) {
      const set = sets[n], i = set.mine[j], name = NAMES[i], madder = name[0] === 'M';
      standAt(name, t, st);
      const sp = Math.hypot(st[3], st[4]), won = madder && t > TG + 0.25;
      let y = st[1] + 0.07 * Math.abs(Math.sin(t * 9 + i * 1.7)) * smoothstep(0.5, 2.2, sp);
      if (won) { const tau = (clock + i * 0.37) % 0.98; y += smoothstep(TG + 0.25, TG + 0.7, t) * Math.max(0, 0.5 - 0.5 * GRAV * (tau - 0.385) * (tau - 0.385)); }      // (by the page's clock, as the stands' hops are)
      // he faces the way he runs, or the ball
      const w = smoothstep(0.5, 1.6, sp), dx = (b[0] - st[0]) * (1 - w) + st[3] * w, dz = (b[2] - st[2]) * (1 - w) + st[4] * w;
      const up = name === holder || name === taker || st[1] > 0.02 || won ? 1 : 0, sc = name === 'M4' ? SLIGHT : 1;
      Q.setFromAxisAngle(Y, Math.atan2(dx, dz));
      for (let k = 0; k < 2; k++) { M.compose(P.set(st[0], y, st[2]), Q, S.setScalar(k === up ? sc : 0)); set.pair[k].setMatrixAt(j, M); set.pair[k].instanceMatrix.needsUpdate = true; }
      shade2(i, st[0], st[2], 0.5, y, 0.55);
    }
    shade2(NS - 1, b[0], b[2], 0.3, Math.max(0, b[1] - 2.4), b[0] > -XE && Math.abs(b[2]) < ZP ? 0.5 : 0);
    sg.getAttribute('position').needsUpdate = true; sg.getAttribute('aQ').needsUpdate = true;
    // the ball
    frame.point(b[0], b[1], b[2], ball.position);
    const a = glow.geometry.getAttribute('aPos'); a.setXYZ(0, b[0], b[1], b[2]); a.needsUpdate = true;
    ball.visible = glow.visible = b[0] > -XE;
    // its trail: the last 1.8 s of the throw it is on, or was on, as a ribbon turned to the eye
    let th = null; for (let n = 0; n < THROWS.length; n++) { const c = THROWS[n]; if (t >= c.t && t < c.t + c.T + TRAIL_S) th = c; }
    if (!th) { if (tf[0] !== 0 || tf[2] !== 0) { tf.fill(0); tg.getAttribute('aFade').needsUpdate = true; } return flying; }
    const head = Math.min(t - th.t, th.T), tail = Math.max(0, t - th.t - TRAIL_S);
    eye.copy(camera.position);
    for (let i = 0; i <= TRAIL_N; i++) { th.fly.at(head + (tail - head) * i / TRAIL_N, q); frame.point(q[0], q[1], q[2], pts[i]); }
    for (let i = 0; i <= TRAIL_N; i++) {
      tan.subVectors(pts[Math.max(i - 1, 0)], pts[Math.min(i + 1, TRAIL_N)]);
      wa.subVectors(eye, pts[i]);
      const d = wa.length(), fade = (1 - i / TRAIL_N) * smoothstep(2, 9, d), hw = Math.max(0.04, d * 0.0017) * (0.35 + 0.65 * fade);
      side.crossVectors(tan, wa); if (side.lengthSq() < 1e-10) side.set(0, 0, 1); side.normalize().multiplyScalar(hw);
      wa.copy(pts[i]).add(side); wb.copy(pts[i]).sub(side);
      const o = i * 6; tp[o] = wa.x; tp[o + 1] = wa.y; tp[o + 2] = wa.z; tp[o + 3] = wb.x; tp[o + 4] = wb.y; tp[o + 5] = wb.z;
      tf[i * 2] = tf[i * 2 + 1] = fade * (head - tail > 0.02 ? 1 : 0);
    }
    tg.getAttribute('position').needsUpdate = true; tg.getAttribute('aFade').needsUpdate = true;
    return flying;
  };
}

// ---------------------------------------------------------------- the flight behind the last throw
// The camera's run is laid along the ball's own. It comes up behind the thrower as he lets go, 2.5 m back and already
// moving, and goes up the hall under the ball's arc at 20 m/s, 11 m behind it after a second and 22 after three,
// looking up at it against the roof. Then it lets the ball go on ahead: when the ball is through the hoop the camera
// is still some 50 m short of it and 12 m up, and it hangs there for two seconds and more, to see all of Madder's end
// go up. Then it stoops to the hoop, and brakes over the last stretch to the speed an opening this size is crossed
// at. Returns keys every half second from 1.4 s before the throw, and the second of the crossing.
const X_OUT = -XE + 0.03;               // where the last opening stands: a finger in front of the anti wall
function chase() {
  const VEND = 1.15 * HOOP, T0 = -1.4, X_REL = 27, GOAL = T_LAST;
  // how fast it goes, m/s, by the seconds since the throw
  const SP = [[T0, 0.9], [-0.7, 5], [0, 14], [1.4, 20], [2.0, 20], [3.0, 12.5], [GOAL, 6], [GOAL + 2.4, 5.6], [GOAL + 3.8, 9.5], [GOAL + 4.8, 9.5]];
  const ran = (k) => { let d = 0; for (let i = 0; i < k; i++) d += (SP[i][1] + SP[i + 1][1]) / 2 * (SP[i + 1][0] - SP[i][0]); return d; };      // metres run by SP[k]
  const xStart = X_REL + ran(2), n = SP.length - 1, left = xStart - ran(n) - X_OUT;      // what is left to the hoop when the stoop is over
  const tCross = SP[n][0] + left / ((SP[n][1] + VEND) / 2);
  SP.push([tCross, VEND], [tCross + 3, VEND]);
  const speed = (tau) => { let i = 0; while (i < SP.length - 2 && SP[i + 1][0] <= tau) i++; const a = SP[i], b = SP[i + 1]; return a[1] + (b[1] - a[1]) * clamp((tau - a[0]) / (b[0] - a[0]), 0, 1); };
  // metres run since T0, by hundredths of a second
  const run = [0]; for (let tau = T0; tau < tCross + 2; tau += 0.01) run.push(run[run.length - 1] + speed(tau + 0.005) * 0.01);
  const runAt = (tau) => { const f = clamp((tau - T0) / 0.01, 0, run.length - 1), i = Math.min(Math.floor(f), run.length - 2); return run[i] + (run[i + 1] - run[i]) * (f - i); };
  const xAt = (tau) => xStart - runAt(tau);
  // the ball's height and place across the hall where it passes x
  const bx = [], by = [], bz = [], q = [0, 0, 0];
  for (let i = 0; i <= 240; i++) { LAST.fly.at(T_LAST * i / 240, q); bx.push(q[0]); by.push(q[1]); bz.push(q[2]); }
  const over = (x) => { if (x >= bx[0]) return [by[0], bz[0]]; if (x <= bx[240]) return [by[240], bz[240]]; let i = 0; while (bx[i + 1] > x) i++; const u = (bx[i] - x) / (bx[i] - bx[i + 1]); return [by[i] + (by[i + 1] - by[i]) * u, bz[i] + (bz[i + 1] - bz[i]) * u]; };
  const HOOPAT = [-XE, HY, 0], hand = LAST.p0;
  const keyAt = (tau) => {
    const x = xAt(tau), o = over(x), arc = 0.72 * o[0] + 2.6, s = smoothstep(-20, -86, x);
    const p = [x, arc + (HY - arc) * s, (o[1] + 0.9 * smoothstep(-50, 20, x)) * (1 - s)];
    let look;
    if (tau < T_LAST) {
      const b = tau > 0 ? LAST.fly.at(tau, [0, 0, 0]) : hand, w = 0.55 - 0.25 * smoothstep(0, 1.5, tau);
      look = [b[0] + (HOOPAT[0] - b[0]) * w, b[1] + (HOOPAT[1] - b[1]) * w, b[2] + (HOOPAT[2] - b[2]) * w];
    } else look = [-XE - 25 * smoothstep(0, 6, tau - T_LAST), HY, 0];
    return { t: TL + tau, p, look, fov: 58 + 7 * smoothstep(-0.6, 1.2, tau) * (1 - smoothstep(T_LAST - 0.6, T_LAST + 4, tau)) };
  };
  const keys = [];
  for (let tau = T0; tau < tCross - 0.3; tau += 0.5) keys.push(keyAt(tau));
  keys.push({ t: TL + tCross, p: [X_OUT, HY, 0] }, { t: TL + tCross + 0.8, p: [X_OUT - VEND * 0.8, HY, 0] });
  return { keys, tCross: TL + tCross };
}

// ---------------------------------------------------------------- round the thrower
// From the catch (the key `from`) to the first key of the run behind the last throw (`to`) the camera goes round
// Madder's thrower by the Panel Yard side and comes in behind him: a turn of some 140 degrees with him in the middle
// of the picture and the hall going round behind him, yellow first and then the whole length of it to the far hoop.
// A turn like that wants its time and an even pace, so it is not left to a curve through a few look points (which
// once took it at 120 degrees a second). The heading is laid down first, and never turns faster than about 30 degrees
// a second; the camera is stood where that heading looks at him; and every key's look point lies along its own
// heading, as far off as he is. vIn: how fast the camera comes into the first key, m/s along x and z. Keys every 0.45 s.
function sling(from, to, him, vIn) {
  const T = to.t - from.t, N = Math.round(T / 0.45), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const dx0 = from.p[0] - him[0], dz0 = from.p[2] - him[2], r0 = Math.hypot(dx0, dz0), f0 = Math.atan2(dz0, dx0);
  const dx1 = to.p[0] - him[0], dz1 = to.p[2] - him[2], r1 = Math.hypot(dx1, dz1), f1 = Math.atan2(dz1, dx1);
  const lx = to.look[0] - to.p[0], ly = to.look[1] - to.p[1], lz = to.look[2] - to.p[2];
  // the heading: toward him at first, the run's own at the last, falling all the way (clockwise, seen from above)
  const th0 = wrap(f0 + Math.PI), th1 = Math.atan2(lz, lx), turn = -(((th0 - th1) % TAU + TAU) % TAU);
  const pace = (u) => smoothstep(0, 0.12, u) * (1 - 0.94 * smoothstep(0.7, 1, u));      // how fast it turns: up to speed in 0.7 s, easing off over the last 1.8
  const sum = [0]; for (let i = 1; i <= 400; i++) sum.push(sum[i - 1] + pace((i - 0.5) / 400) / 400);
  const heading = (u) => { const f = clamp(u, 0, 1) * 400, i = Math.min(Math.floor(f), 399); return th0 + turn * (sum[i] + (sum[i + 1] - sum[i]) * (f - i)) / sum[400]; };
  // as it comes in, the camera is already going round him and closing on him: its place takes that up, so that the way
  // does not kink, and he sits a few degrees off the middle of the picture for the first half second
  const wIn = (-vIn[0] * Math.sin(f0) + vIn[1] * Math.cos(f0)) / r0, rIn = vIn[0] * Math.cos(f0) + vIn[1] * Math.sin(f0);
  const off1 = wrap(th1 - (f1 + Math.PI)), dip = Math.max(0, -rIn * T - 2 * (r0 - r1));
  const aim0 = from.look[1], pitch1 = Math.atan2(ly, Math.hypot(lx, lz)), LOW = 2.3, keys = [];
  for (let k = 0; k < N; k++) {
    const u = k / N, th = heading(u), off = -wIn * T * u * Math.exp(-u / 0.08) + off1 * smoothstep(0.5, 1, u), f = th - Math.PI - off;
    const r = r1 + (r0 - r1) * (1 - u) * (1 - u) - dip * u * (1 - u) * (1 - u);
    const y = from.p[1] + (LOW - from.p[1]) * smoothstep(0, 0.32, u) + (to.p[1] - LOW) * smoothstep(0.45, 1, u);      // down to his own height as it passes him, and up again behind him as the hall opens out
    const aim = aim0 + (2.0 - aim0) * smoothstep(0, 0.3, u), toHim = Math.atan2(aim - y, r), pitch = toHim + (pitch1 - toHim) * smoothstep(0.6, 1, u);
    const p = [him[0] + r * Math.cos(f), y, him[2] + r * Math.sin(f)];
    keys.push({ t: from.t + T * u, p, look: [p[0] + r * Math.cos(th), y + r * Math.tan(pitch), p[2] + r * Math.sin(th)] });
  }
  return keys;
}

// Ochre's paint: its dawn's yellow-browns, on cream
const EARTH = {
  ...PALETTES.warm,
  walls: ['#d2bf98', '#c4ae84', '#d9c8a2', '#cbb78e', '#bfa97e', '#ddd0ac'], dado: ['#7a5c3c', '#6e5236', '#836442', '#74583a'],
  trim: ['#4a3a28', '#5c4630', '#3f3224', '#553f2a'], floor: PITCH, strip: LINE, lamp: '#fff6e6',
  signs: [['#5c3d1c', '#f6ead0'], ['#7a5428', '#fff3dc'], ['#d9a65a', '#21170e'], ['#efe2c6', '#5c3d1c'], ['#21170e', '#d9a65a'], ['#c08a3e', '#fff3dc']],
};

// Words: what is for sale on the boards round the floor, the rule along both walls, the stands' names (each end's own
// words are on its parapets: see buildShell); and cloth hung from the roof over each half in its colours.
function dress(deck, rng) {
  // [the words, which of its half's three paints, the hand]
  const ochre = [['Any colour you can describe', 0, 'cond'], ['Ten minutes', 1, 'cond'], ['Grindstone', 2, 'italic'], ['Never once wrong', 0, 'cond'], ['Crew Street', 1, 'cond'], ['Sign for the dose', 2, 'italic'], ['Toasted barley broth', 0, 'cond']];
  const madder = [['Keep the difference', 0, 'cond'], ['Rootyard', 1, 'cond'], ['Planning a third', 2, 'italic'], ['Dye House', 0, 'cond'], ["Grinders' Arcade", 1, 'cond'], ['Beet broth, a little sour', 2, 'italic'], ['Guests welcome', 0, 'cond']];
  const oc = [['#7a5428', '#fff3dc'], ['#d9a65a', '#21170e'], ['#efe2c6', '#5c3d1c']], mc = [['#7e2d33', '#fff0ea'], ['#f3e3dc', '#7e2d33'], ['#a8343a', '#fff0ea']];
  for (const s of [-1, 1]) {
    let k = s > 0 ? 0 : 3;
    lengths(-XE, XE, (a, b, i) => {
      if (i % 2) return;
      const x = (a + b) / 2, red = x < 0, [text, paint, font] = (red ? madder : ochre)[k % 7], c = (red ? mc : oc)[paint]; k++;
      deck.sign(text, { at: [x, 0.7, s * (ZP - 0.04)], n: [0, -s], w: 5.6, h: 0.76, style: 'board', font, ground: c[0], ink: c[1] });
    });
    // the rule, along both walls; and whose stand it is
    deck.sign('Axis flies true', { at: [0, 11.1, s * (ZW - 0.09)], n: [0, -s], w: 15, h: 2.1, style: 'board', font: 'cond', ground: '#efe2c6', ink: '#5c3d1c', track: 0.2 });
    for (const x of [-47.5, 47.5]) deck.sign(s > 0 ? 'Panel Yard stand' : 'Grindstone stand', { at: [x, 15.7, s * (ZW - 0.07)], n: [0, -s], w: 7.6, h: 1.25, style: 'board', font: 'cond', ground: '#5c3d1c', ink: '#f6ead0' });
    // cloth from the roof, over the front of each stand
    for (let i = 0; i < 20; i++) {
      const x = -XE + BAY / 4 + i * BAY / 2;
      deck.put('banner', { p: [x, HB - 0.1, s * 15.2], yaw: 0, scale: [2.5, 3.1 + 0.5 * rng(), 1], color: x < 0 ? rng.pick(RED) : rng.pick(YEL) });
    }
  }
}

// ---------------------------------------------------------------- the world
export const ochreDerby = {
  id: 'ochre-derby',
  title: 'The Pigment Row derby', drum: 'Ochre', row: 'Pigment Row', kind: 'a steady drum', light: 33.1,
  line: 'Pigment Row says Madder has cried at a board twice this year and is planning a third. I was at the third. Madder nine, Ochre eight, the last one thrown anti from their own half, and it sailed the whole way.',
  tone: '#d9a65a', source: 'ashgrove.md (Day one: spinball); sorrel.md (the Middle League Hall); 15-canon.js (Madder, Ochre); wander-year.md (Days 222, 226)',
  sound: { root: 46, scale: 'mixo', pad: 0.3, air: 0.1, hum: 0.15, crowd: 1, bells: 0.2, bright: 0.7 },
  *build(ctx) {
    const frame = makeFrame(118 * DEG, 2300, R);            // deck 236: y = 0 is its floor, the concourses are deck 238
    const rng = makeRng('ochre-derby'), run = chase();
    // behind the rail at the top of Madder's half of the Panel Yard stand, as a long flat pass comes in anti and Ochre
    // leaps for it; down over the rows while Ochre's own goes back up the hall, high and steep, and the next goes across;
    // out over the boards and along the floor with the third, to Madder's leap in the middle; up over the halfway line
    // to see Ochre's half, and down the hall with the pass back to Madder's long thrower; round him (sling) and in
    // behind; then the run behind the last throw (chase)
    const early = [
      { t: 0, p: [-52.2, 9.72, 32.0] },
      { t: 4.6, p: [-54.2, 9.66, 28.5], look: [-70, 4, 3] },
      { t: 7.2, p: [-53.9, 9.3, 26.8], look: [-64, 5, 4] },
      { t: 8.6, p: [-53.3, 8.9, 25.6], look: [-54, 8.5, 6.5] },
      { t: 10.0, p: [-51.6, 8.3, 24.0], look: [-41, 3, 8.5] },
      { t: 12.4, p: [-47.5, 6.6, 20.3], look: [-37, 2.3, 3] },
      { t: 14.2, p: [-45.5, 5.6, 16.0], look: [-36, 2, -7] },
      { t: 16.6, p: [-42, 4.8, 9.5], look: [-20, 6, -3] },
      { t: 19.0, p: [-17, 3.3, 6.4], look: [-6, 2.9, 1] },
      { t: 22.2, p: [-10.5, 4.2, 9.0], look: [-5, 2.2, -4] },
      // (from here to the catch the view holds one heading, across and down the hall, and the pass flies through it)
      { t: 24.6, p: [-6, 9.5, 9.2], look: [13.2, 3.5, -6.9] },
      { t: 26.2, p: [-4, 9.2, 9.5], look: [10.1, 4.5, -7.4] },
      { t: 27.5, p: [4, 6.6, 9.2], look: [17.9, 6.5, -5.2] },
    ];
    const caught = THROWS[THROWS.length - 2], tC = caught.t + caught.T, last = early[early.length - 1];
    const at = { t: tC, p: [13.5, 3.8, 8.3], look: [caught.p1[0], caught.p1[1] - 0.07, caught.p1[2]] };
    const round = sling(at, run.keys[0], LAST.p0, [(at.p[0] - last.p[0]) / (tC - last.t), (at.p[2] - last.p[2]) / (tC - last.t)]);
    const path = makePath([...early, ...round, ...run.keys
    ], { frame, entryRadius: 0.8, exitRadius: HOOP });
    const pts = path.points(0.5);
    const deck = makeDeck(ctx, {
      frame, near: pts, seed: 'ochre-derby', palette: EARTH,
      light: { level: 1, lamp: '#fff6e6', ambUp: '#6a6258', ambDown: '#3d372f', ambPower: 0.7, haze: '#8f8370', hazeDensity: 0.0014 }, floor: { slab: [1, 1], shine: 1, rough: 0.014, lampGlow: 90, wear: 0.8 },
    });
    yield 'derby: path';

    yield* layFloor(deck);
    yield* buildStands(deck, rng);
    const floods = yield* buildShell(deck);
    dress(deck, rng);
    sideline(deck, rng);
    // light: white floods on the floor, the stands a step darker and warmer, and the lamps themselves for the floor to hold
    deck.zone({ min: [-XE - 3, -2, -ZP - 1.2], max: [XE + 3, HC + 2, ZP + 1.2], soft: 2.2, color: '#fffaf0', power: 1.15, side: 0.55, under: 0.16 });
    deck.zone({ min: [-XE - 3, -2, ZP + 1.2], max: [XE + 3, 11.5, ZW + 4], soft: 2.2, color: '#ffeed2', power: 0.62, side: 0.62, under: 0.2 });
    deck.zone({ min: [-XE - 3, -2, -ZW - 4], max: [XE + 3, 11.5, -ZP - 1.2], soft: 2.2, color: '#ffeed2', power: 0.62, side: 0.62, under: 0.2 });
    deck.lattice({ origin: [-XE + BAY / 4, HB, -12], spacing: [BAY / 2, 8], count: [20, 4], color: '#fff6e6', power: 0.1, reach: 30 });
    // people coming and going along the concourses
    for (const s of [-1, 1]) for (const d of [-1, 1]) deck.walkersAlong({ from: [d > 0 ? (s > 0 ? -38 : -90) : 90, CON_Y, s * (ZW - 0.8)], to: [d > 0 ? 90 : (s > 0 ? -38 : -90), CON_Y, s * (ZW - 0.8)], n: Math.round(9 * (ctx.density || 1)), speed: 1.2, spread: 0.35, rng });
    yield 'derby: dressed';

    const U = { t: { value: 0 }, ball: { value: new Vector4(0, 0, 0, 0) } };      // the flight's seconds and the ball's place, for the stands' shaders
    const crowd = yield* buildCrowd(deck, ctx, rng, U, pts);      // (the flight's points: people are modelled better where it begins and where it ends, and none sits in its way)
    const boards = yield* scoreBoards(deck);
    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group, ...crowd.meshes, boards.mesh, glowPoints(floods, { bend: frame, minPx: 1.4, maxPx: 40, soft: 1.8 }));
    yield '~derby: stands full';      // (the kit has just made its meshes and its sheet of lettering: the same)
    // the hoop at the anti end, and the lamps round it
    const hoops = hoopGeo(), hoopMat = litMaterial(deck.rig, { bend: frame });
    const hoop = instances(hoops, hoopMat, [{ p: [X_OUT, HY, 0] }], { frame })[0], other = instances(hoops, deck.lit, [{ p: [XE - 0.03, HY, 0], yaw: Math.PI }], { frame })[0];
    yield 'derby: hoops';
    const rim = []; for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * TAU; rim.push({ p: [X_OUT + 0.12, HY + Math.sin(a) * (HOOP + 0.13), Math.cos(a) * (HOOP + 0.13)], color: '#ffe6bc', power: 2.4, size: 0.42 }); }
    const rimGlow = glowPoints(rim, { bend: frame, minPx: 1.5, maxPx: 70, soft: 1.8 });
    scene.add(hoop, other, rimGlow);
    const move = yield* makePlay(deck, scene);
    yield 'derby: players';

    const look = { exposure: 0.95, bloom: 0.2, threshold: 1.0, saturation: 1.08, contrast: 1.05, vignette: 0.42 };
    const eye0 = { position: path.entry.pos };
    const update = (t, dt, camera, engine) => {
      U.t.value = t;
      boards.set(t);
      move(t, camera || eye0, U.ball.value, engine ? engine.time : t);
      // the ball goes through: the hoop flares, Madder's lamps come out, and the eye takes a moment to settle
      const flare = smoothstep(TG - 0.05, TG + 0.1, t) * (1 - smoothstep(TG + 0.3, TG + 2.6, t));
      hoopMat.uniforms.uEmit.value = 1 + 3 * flare;
      rimGlow.material.uniforms.uPower.value = 1 + 3.5 * flare + 0.8 * smoothstep(TG, TG + 2, t);
      crowd.lamps.material.uniforms.uPower.value = smoothstep(TG + 0.5, TG + 2.4, t);
      look.bloom = 0.2 + 0.1 * flare;
    };
    update(0, 0, eye0);
    return {
      scene, path, deck, count: crowd.count, near: 0.25, far: 700, look,
      // (the next world is first drawn through the hoop as the camera settles behind the thrower, 2.2 s before he
      // throws: the frame that first draw can cost would otherwise fall on the throw or on the goal. From there the hoop
      // is seven pixels across)
      portal: { rim: false, mist: '#1a1420', openFor: run.tCross - (TL - 2.2) },
      update,
    };
  },
};

