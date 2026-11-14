// Lovage, Herb Row: Lamplight Rise, a public stair up the last of the Middle decks into the first of the High decks.
// Lovage auctions its high decks and spends the rents on light, so its money lives up, "and the lift lobbies get
// grander as you climb" (docs/ashgrove.md, Day three: Lovage; games/three-nights/src/15-canon.js, Lovage). The Rise is
// a square well cut up through twelve decks, 296 to 307, with a stair winding round its four sides, a lobby of four
// cab doors on every deck (docs/drum-transport.md: four berths to a lobby) and one chain of lamp globes hung down the
// middle. Every deck up is a little grander and a good deal brighter: worn tile, a pipe rail and dented doors at the
// foot, where a cart sells the Crock's country loaf at 1.10 to people who eat it standing (docs/eating-out.md); brass,
// enamel plates and lemon trees by the middle, where a clerk chalks tonight's lots of Hollow hours; gilt at the top,
// a floor you can see the lamps in, and a landing of garden doors with light under all but one (docs/daily-life.md,
// Light: "A bright home is the plainest sign of wealth"; docs/sorrel.md, the Garden Doors). One door stands ajar.
// Three flights from the top a wedding party rests with the new sofa, which in Lovage is meant to be seen.
//
// y = 0 is the floor of deck 296 (radius 1,820 m, 0.607 g); the top landing, deck 307, is y = 44 (0.593 g).
//
// What a spinning drum does here, worked out:
//   - Weight. g = w * w * r, with w = 0.0572 rad/s. Each deck up is 4 m nearer the axis and 0.0013 g lighter, and
//     every landing's brass plate says so: 0.607 g at the foot, 0.593 g at the top.
//   - The fall line. A thing let go at height h keeps the sideways speed it had, which is less than the floor's
//     below it, so it lands antispinward of the plumb point by d = R (tan f - f), where cos f = 1 - h / R and R is
//     the floor's radius: about two thirds of h * sqrt(2h / R). From deck 297 that is 18 cm; from deck 307, 44 m up
//     and four seconds' fall, 6.6 m. The chain hangs plumb, since it is not falling. In the floor under it a brass
//     line runs antispinward with a stud for each deck where a crumb let go beside the chain would land.
//
// Not canon (the docs give Lovage its custom, its notices, its street and neighbourhood names, and no plan):
//   - the Rise itself as a stair (the docs have Lamplight Rise only as a neighbourhood's name), its decks, its
//     twelve-deck well (the docs' courts are six decks; Sorrel has stairs of thirteen and sixteen decks), and the
//     whole gradient from dented doors to gilt squeezed into twelve decks
//   - each deck's lobby opening off the next wall round, the stair's flights hung in the well, a gallery on every deck,
//     the chain of globes, and the lit ceiling over the well
//   - everything on the landings: the cart (the Crock itself is on the Low decks), the washing, the mender and his
//     prices, the notice boards, the lemon trees, the carpet, the apple under glass, the armchairs, the robots, the
//     shops and stalls and their names (the Licensed Cellar among them), where the Bright Arcade, Auction Walk, Coin
//     Yard, Highmarket and Gilding come in, and the sofa being carried up by the stair (the sofa is the docs')
//   - the auction board's wording and its prices, except that an hour at the quiet end goes for about three kays; the
//     notices "Drop nothing" and "Lamplight Rise" (the methanol, auction and Sorrel gin notices are the docs' words,
//     the first shortened)
//   - the fall line and its studs, and the weight on the plates (the numbers are the drum's own)
//   - garden doors on a stair landing (Sorrel's are along a corridor on deck 361), their lacquer and their numbers;
//     coats that hang open on their linings, for people of the high decks
import { Scene, Matrix4, Vector3 } from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DRUM, DEG } from '../kit/drum.js';
import { makeDeck, finish, frontage, Run, PALETTES } from '../kit/deck.js';
import { Geo, mixc, shade, rgb } from '../kit/geo.js';
import { makeRng, smoothstep, clamp, lerp } from '../core/rng.js';
import { SKIN } from '../kit/folk.js';

const DECK0 = 296, NK = 12, RISE = 4, TOP = (NK - 1) * RISE;      // twelve decks: the top landing's floor is y = 44
const HV = 6, GD = 3.5, HW = HV + GD;                            // half the well; a gallery's depth; the walls
const FW = 2.4, SLAB = 1.0, ROOM = 3;                            // a flight's width; a floor's thickness; floor to ceiling
const NR = 24, STEP = RISE / NR, GO = 0.29, U1 = (NR - 1) * GO / 2;   // 24 risers of 167 mm, treads of 290: 6.67 m of going
const EYE = 1.75, R0 = deckRadius(DECK0);
const TAU = Math.PI * 2;

// how bright deck k's lamps are: a hushed half at the foot, past two at the top
const lev = (k) => 0.5 * Math.pow(4.6, k / (NK - 1));
// what deck k weighs, in g
const weight = (k) => (DRUM.OMEGA * DRUM.OMEGA * (R0 - RISE * k) / 9.80665).toFixed(3);
// how far antispinward of the plumb point a thing lands, let go h metres above the foot
const fall = (h) => { const f = Math.acos(1 - h / R0); return R0 * (Math.tan(f) - f); };

// the four walls in the order the stair and the flight go round them: anti, back, spin, front. Each is a Run looking
// into the well: u along it (the way the flight travels), y up, v = 0 at the wall and -3.5 at the gallery's edge.
const WALLS = [[-1, 0, 3], [0, 1, 0], [1, 0, 1], [0, -1, 2]];
const wallRun = (s, y = 0) => { const q = WALLS[((s % 4) + 4) % 4]; return new Run(q[0] * HW, y, q[1] * HW, q[2]); };
const on = (k, u, y, v) => wallRun(k, RISE * k).pt(u, y, v);       // a point of deck k's own lobby side
const wallN = (g, u0, u1, y0, y1, v, col, e = 0) => g.quad([u1, y0, v], [u0, y0, v], [u0, y1, v], [u1, y1, v], col, e);
const both = (g, a, b, c, d, col, e = 0) => { g.quad(a, b, c, d, col, e); g.quad(d, c, b, a, col, e); };

// paint, from the foot (deck 296) through decks 300 and 304 to the top (307): umber and old brass to gilt and white
const STOPS = [0, 4, 8, 11];
const PAINT = {
  wall: ['#6b5742', '#b3966c', '#dccaa2', '#efe5cc'], dado: ['#46372a', '#7a5d3a', '#c6a566', '#e6d4a6'],
  trim: ['#31271e', '#86602e', '#c5963c', '#f3c25c'], floor: ['#5a5046', '#96846a', '#cbb894', '#e8ddc4'],
  soffit: ['#5a4c3c', '#93805f', '#d0c09c', '#ece2ca'], fascia: ['#5c4d3c', '#a08660', '#d8c69c', '#f0e6cc'],
  metal: ['#3c3c3d', '#75572b', '#b68a3a', '#f0c050'], door: ['#55625b', '#3f5f73', '#b08d4a', '#f3c25c'],
  lamp: ['#ffb062', '#ffcc92', '#ffe4bc', '#fff5e0'], cab: ['#7a6c58', '#b9a27c', '#e6d2a8', '#fff0cf'],
  step: ['#5f554a', '#93826a', '#cdbb98', '#efe5cf'],
};
const VALUE = { polish: [0.1, 0.38, 0.75, 1.0] };                  // how far each deck's floor is polished
const stop = (k) => { let i = 0; while (i < 2 && k > STOPS[i + 1]) i++; return [i, clamp((k - STOPS[i]) / (STOPS[i + 1] - STOPS[i]), 0, 1)]; };
const paint = (name, k) => { const [i, t] = stop(k), a = PAINT[name]; return mixc(a[i], a[i + 1], t); };
const value = (name, k) => { const [i, t] = stop(k), a = VALUE[name]; return lerp(a[i], a[i + 1], t); };
// a colour for the sign painter, who wants it as written
const hex = (c) => { const q = rgb(c), f = (v) => { const s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(clamp(s, 0, 1) * 255).toString(16).padStart(2, '0'); }; return '#' + f(q[0]) + f(q[1]) + f(q[2]); };

// coats: plain at the foot, new by the middle, dark and good at the top (where the lining is the colour)
const PLAIN = ['#6f6a5e', '#7a6a55', '#5c6670', '#8a8172', '#4f5a52', '#77604a', '#66625c', '#8c7b62', '#59544c', '#6b7468'];
const NEW = ['#f6f1e4', '#efc65a', '#f29e38', '#e8644a', '#d9476e', '#7d5bd0', '#3c8fd6', '#2aa596', '#5cb85c', '#f7cfb6', '#e0b04a', '#c8e4f4'];
const GOOD = ['#2b2a3a', '#3a2c28', '#1f2c40', '#2f3a34', '#40303a', '#33302c'];
const LINING = ['#1f8fc4', '#e8644a', '#f3c25c', '#3fae8a', '#d9476e'];
const coat = (k, rng) => (k <= 2 ? rng.pick(PLAIN) : k <= 4 ? (rng() < 0.5 ? rng.pick(PLAIN) : rng.pick(NEW)) : k <= 8 ? rng.pick(NEW) : rng() < 0.55 ? rng.pick(GOOD) : rng.pick(NEW));

// ---------------------------------------------------------------- the flight
// From the cart under the front gallery, in across the foot and a look up the well; then a slow spiral round the
// chain, a quarter turn and one deck at a time, passing each deck's lobby side close to its rail; one look down from
// near the top; and straight on through the garden door that stands ajar. a counts quarter turns: a = k is deck k's lobby.
//
// The view turns with the spiral and at the spiral's own pace, 27 degrees a second: the eye looks a steady few degrees
// to the wall's side of the way it is going (TURN) and a little up (TILT), so that each landing slides through the
// picture from left to right and nothing is snapped to. Three things move it otherwise, all slowly: the look up the
// well at the foot (drifting a little toward the foot's own cab doors, so that it comes down onto them), a lean
// toward the sofa at deck 304, and the look down. For that one the eye all but stops abreast of deck 306's lobby (PACE)
// while the view goes on turning as it was, past deck 307's gilded doors and the motto over them, in past the chain to
// the wall the garden doors are in, and tips down; so when it comes up again the door that stands ajar is ahead of
// it, and the eye has only to go. Each list is [a, value] steps, eased from one to the next.
const T0 = 10.8, DT = 3.3, DOOR_U = -3.5, LIFT = 0.65;
const ramp = (steps, a) => { let i = 0; while (i < steps.length - 2 && a > steps[i + 1][0]) i++; return lerp(steps[i][1], steps[i + 1][1], smoothstep(steps[i][0], steps[i + 1][0], a)); };
const PACE = [[0, 0.13], [0.6, 1 / DT], [9.65, 1 / DT], [9.9, 0.058], [10.25, 0.058], [10.5, 0.19], [11, 0.2]];   // quarter turns a second
const TURN = [[0, 34], [2.5, 22], [6.8, 22], [8.5, -12], [9.4, 14], [11, 14]];                                   // degrees toward the wall
const TILT = [[0, 4], [0.8, 8], [7.5, 8], [8.5, -14], [9.25, 5], [9.6, 12], [11, 12]];                           // degrees up
const FOV = [[0, 68], [0.8, 62], [7.8, 62], [8.5, 60], [9.2, 62], [9.7, 62], [10.1, 66], [10.6, 66], [11, 60]];
// the second at which the flight reaches each hundredth of a quarter turn
const CLOCK = [T0];
for (let i = 1; i <= 1100; i++) CLOCK.push(CLOCK[i - 1] + 0.01 / ramp(PACE, (i - 0.5) / 100));
const timeOf = (a) => { if (a <= 0) return T0 + a * DT; const i = Math.min(1099, Math.floor(a * 100)); return lerp(CLOCK[i], CLOCK[i + 1], Math.min(1, a * 100 - i)); };
// where the eye is: 3.3 m from the chain, a little further out abreast of each lobby, and 2.4 m above each landing as
// it passes; over the last three quarters of a turn it eases up to the height it crosses the top landing's rail at
function spiral(a) {
  const ps = a * Math.PI / 2, r = 3.3 + 0.2 * Math.cos(a * TAU), y = EYE + RISE * Math.min(a, 10.25) + LIFT * smoothstep(0, 1, a);
  return [-r * Math.cos(ps), lerp(y, TOP + 2.4, smoothstep(10.25, 11, a)), r * Math.sin(ps)];
}
// The look down, in seconds. Until LOOK_IN the view is the spiral's own. From then it turns at the same rate (SPIN),
// slows over 2.4 s and stops ten degrees short of square to the garden doors' wall (LOOK_STILL). It keeps its chin up
// for the first of that, while deck 307's cab doors and the motto go by, and then tips down. It holds (to LOOK_UP) and
// comes up over 3.4 s, turning the last ten degrees as it does: so the gilded doors are at its right hand as it lifts
// and it is square to the door that stands ajar by the time the spiral ends (T_TOP). It never turns back on itself.
const A_IN = 9.6, LOOK_IN = timeOf(A_IN), T_TOP = timeOf(11), SPIN = 90 / DT, H_IN = 90 - 90 * A_IN + ramp(TURN, A_IN), P_IN = ramp(TILT, A_IN), H_HOLD = -890;
const LOOK_EASE = LOOK_IN + (H_IN - H_HOLD) / SPIN - 1.2, LOOK_STILL = LOOK_EASE + 2.4, LOOK_UP = LOOK_STILL + 1.7;
function lookDown(t) {
  const s = t - LOOK_EASE;
  const h = t <= LOOK_EASE ? H_IN - SPIN * (t - LOOK_IN) : s < 2.4 ? H_HOLD + SPIN * (1.2 - s + s * s / 4.8) : H_HOLD;
  return [h - 10 * smoothstep(LOOK_UP + 0.4, T_TOP, t), lerp(P_IN, -58, smoothstep(LOOK_IN + 2.4, LOOK_STILL + 0.4, t)) + 50 * smoothstep(LOOK_UP, LOOK_UP + 3.4, t)];
}
function flightKeys() {
  // every look point lies six metres from its own key, so the view turns as evenly between keys as it does at them
  const aim = (p, heading, pitch) => { const c = 6 * Math.cos(pitch * DEG); return [p[0] + c * Math.cos(heading * DEG), p[1] + 6 * Math.sin(pitch * DEG), p[2] + c * Math.sin(heading * DEG)]; };
  const key = (t, p, heading, pitch, fov) => ({ t, p, look: aim(p, heading, pitch), fov });
  const keys = [
    key(0, [-0.4, 1.62, -8.2], 97, 0, 62),
    key(3.0, [-0.9, 1.64, -4.3], 97, 4, 62),
    key(5.6, [-1.8, 1.7, -2.7], 98, 45, 72),
    key(7.8, [-2.7, 1.74, -1.6], 102, 48, 72),
    key(9.5, [-3.25, 1.75, -0.75], 112, 25, 70),
  ];
  // the spiral: a key every quarter of a quarter turn, and closer where the eye all but stops to look down.
  // The way it is going is 90 degrees less every quarter turn (x is spinward, z along the axis, the wall on the right hand)
  const as = [];
  for (let j = 0; j <= 44; j++) as.push(j / 4);
  for (let j = 0; j <= 56; j++) as.push(Math.round((9.6 + j * 0.025) * 1000) / 1000);
  for (const a of [...new Set(as)].sort((p, q) => p - q)) {
    const t = timeOf(a), g = a > A_IN ? lookDown(t) : [90 - 90 * a + ramp(TURN, a), ramp(TILT, a)];
    keys.push(key(t, spiral(a), g[0], g[1], ramp(FOV, a)));
  }
  // then over the top landing's rail a metre clear of it (the rail is at x = -5.92 and 1.05 m high), down under the
  // lamp that hangs beside the door's line to the door's own height, level for the last two metres, and through
  const z = DOOR_U;
  for (const [dt, x, h, see, fov] of [[2.2, -3.0, 2.35, 1.5, 60], [4.2, -5.7, 2.15, 1.32, 58], [5.3, -7.0, 1.6, 1.15, 58], [6.0, -7.85, 1.27, 1.1, 58], [6.9, -8.95, 1.1, 1.1, 58], [8.3, -10.62, 1.1, 1.1, 58]]) keys.push({ t: T_TOP + dt, p: [x, TOP + h, z], look: [x - 6, TOP + see, z], fov });
  return keys;
}

// ---------------------------------------------------------------- what a deck is made of
function deckPaint(k) {
  return {
    k, y: RISE * k, lev: lev(k), glow: 0.45 + 0.55 * lev(k),
    wall: paint('wall', k), dado: paint('dado', k), trim: paint('trim', k), floor: paint('floor', k), soffit: paint('soffit', k),
    fascia: paint('fascia', k), metal: paint('metal', k), door: paint('door', k), cab: paint('cab', k), step: paint('step', k),
    lamp: hex(paint('lamp', k)), polish: value('polish', k),
  };
}

// A rail along a gallery's edge from u0 to u1: pipe at the foot (deck 297's is patched with a plank and whatever pipe
// there was), iron balusters under a wooden hand rail, then brass, then gilt and glass.
function drawRail(P, M, u0, u1, rng) {
  if (u1 - u0 < 0.2) return;
  const g = P.g, k = M.k, v = -GD + 0.08, m = M.metal, len = u1 - u0, n = Math.max(1, Math.round(len / 1.5)), sp = len / n;
  if (k <= 2) {
    for (let i = 0; i <= n; i++) { const u = u0 + i * sp; g.box(u - 0.03, 0, v - 0.03, u + 0.03, 1.07, v + 0.03, m, { skip: 'b' }); }
    for (let i = 0; i < n; i++) {
      const a = u0 + i * sp, b = a + sp, patch = k === 1 && rng() < 0.34;
      for (const y of [0.36, 0.7, 1.04]) g.box(a, y - 0.02, v - 0.02, b, y + 0.02, v + 0.02, rng() < 0.12 ? '#6f7f86' : m, { skip: 'we' });
      if (patch) { g.box(a + 0.1, 0.97, v - 0.045, b - 0.1, 1.1, v - 0.02, '#b39a70'); for (const q of [a + 0.3, b - 0.3]) g.box(q - 0.035, 0.95, v - 0.055, q + 0.035, 1.12, v + 0.035, '#d9cfb8'); }
    }
  } else if (k <= 6) {
    g.box(u0, 0.08, v - 0.02, u1, 0.12, v + 0.02, m, { skip: 'we' }).box(u0, 1.02, v - 0.045, u1, 1.07, v + 0.045, k >= 5 ? paint('trim', k + 2) : '#6b4a2c', { skip: 'we' });
    for (let u = u0 + 0.125; u < u1; u += 0.25) g.box(u - 0.012, 0.12, v - 0.012, u + 0.012, 1.02, v + 0.012, m, { skip: 'tb' });
    for (let i = 0; i <= n; i++) { const u = u0 + i * sp; g.box(u - 0.035, 0, v - 0.035, u + 0.035, 1.1, v + 0.035, m, { skip: 'b' }); }
  } else {
    g.box(u0, 0, v - 0.03, u1, 0.1, v + 0.03, m, { skip: 'web' }).box(u0, 1.0, v - 0.04, u1, 1.05, v + 0.04, m, { skip: 'we', emit: k >= 10 ? 0.25 : 0.08 });
    P.gl.quad([u1, 0.1, v], [u0, 0.1, v], [u0, 1.0, v], [u1, 1.0, v], '#cfe6e8');
    for (let i = 0; i <= n; i++) { const u = u0 + i * sp; g.box(u - 0.03, 0.1, v - 0.03, u + 0.03, 1.0, v + 0.03, m, { skip: 'tb' }); if (k >= 10) g.cyl(u, 1.05, v, 0.05, 0.0, 0.12, 6, m, { smooth: false, emit: 0.3 }); }
  }
}

// one leaf of a cab door between p0 and p1: dented and scuffed at the foot, panelled and enamelled, then brass, then gilt
function drawLeaf(g, M, p0, p1, dh, rng) {
  const k = M.k, col = M.door, m = (p0 + p1) / 2;
  g.box(p0, 0.02, 0.18, p1, dh, 0.23, col, { skip: 'b', emit: k >= 9 ? 0.14 : 0 });
  if (k <= 1) {
    g.tri([p1 - 0.08, 0.42, 0.176], [p0 + 0.08, 0.5, 0.176], [m + rng.f(-0.12, 0.12), rng.f(0.95, 1.35), 0.166], shade(col, 0.78));
    g.tri([p1 - 0.1, 1.35, 0.176], [p0 + 0.1, 1.2, 0.176], [m + rng.f(-0.1, 0.1), rng.f(1.7, 2.0), 0.168], shade(col, 1.16));
    g.box(p0, 0.02, 0.172, p1, 0.32, 0.18, '#77746a', { skip: 's' }).box(m - 0.1, 1.0 + rng.f(-0.2, 0.2), 0.174, m + 0.14, 1.12, 0.18, shade(col, 0.6), { skip: 's' });
  } else if (k <= 5) {
    g.box(p0 + 0.12, 0.3, 0.165, p1 - 0.12, dh - 0.25, 0.18, shade(col, 1.12), { skip: 's' }).box(p0, 0.02, 0.17, p1, 0.24, 0.18, M.metal, { skip: 's' });
  } else {
    const t = M.trim, e = k >= 9 ? 0.3 : 0.05, deep = k >= 9 ? '#c08a2a' : shade(col, 0.9);
    for (const [ya, yb] of [[0.32, 1.02], [1.14, dh - 0.22]]) {
      g.box(p0 + 0.09, ya, 0.166, p1 - 0.09, yb, 0.18, t, { skip: 's', emit: e }).box(p0 + 0.15, ya + 0.06, 0.158, p1 - 0.15, yb - 0.06, 0.166, deep, { skip: 's', emit: k >= 9 ? 0.1 : 0 });
      if (k >= 9) g.cyl((p0 + p1) / 2, (ya + yb) / 2 - 0.08, 0.15, 0.1, 0.0, 0.16, 4, t, { smooth: false, emit: 0.4 });
    }
    g.box(p0, 0.02, 0.17, p1, 0.22, 0.18, t, { skip: 's', emit: e });
  }
}

// a cab standing in its berth with its doors open: a small lit room with a seat round it, and someone in it
function cabRoom(deck, g, run, M, u, rng) {
  const cw = 2.0, cd = 1.9, ch = 2.15, felt = M.cab, e = 0.42 * M.glow;
  wallN(g, u - cw / 2, u + cw / 2, 0, ch, 0.3 + cd, felt, e);
  g.quad([u - cw / 2, 0, 0.3 + cd], [u - cw / 2, 0, 0.3], [u - cw / 2, ch, 0.3], [u - cw / 2, ch, 0.3 + cd], felt, e).quad([u + cw / 2, 0, 0.3], [u + cw / 2, 0, 0.3 + cd], [u + cw / 2, ch, 0.3 + cd], [u + cw / 2, ch, 0.3], felt, e);
  g.floor(u - cw / 2, 0.26, u + cw / 2, 0.3 + cd, 0.01, shade(felt, 0.55)).floor(u - cw / 2, 0.26, u + cw / 2, 0.3 + cd, ch, '#fff3dc', { down: true, emit: 2.4 * M.glow });
  g.box(u - cw / 2, 0, 0.3 + cd - 0.45, u + cw / 2, 0.45, 0.3 + cd, shade(M.door, 0.85), { skip: 'b' });
  deck.glow([{ p: run.pt(u, 1.5, 1.0), color: M.lamp, power: 1.5 * M.glow, size: 1.6 }]);
  if (rng() < 0.75) deck.people([{ p: run.pt(u + rng.f(-0.3, 0.3), 0, 0.7 + rng.f(0, 0.5)), yaw: run.yaw + Math.PI + rng.f(-0.3, 0.3), color: coat(M.k, rng) }]);
}

// Deck k's lobby: the whole wall of its side, four cab doors in the middle of it. o.open: doors standing open on a lit
// cab; o.slide: one whose leaves are meshes of their own, to part as the flight comes by. Returns slide(0..1).
function drawLobby(deck, P, run, M, rng, o) {
  const g = P.g, k = M.k, us = [-3.9, -1.3, 1.3, 3.9], dw = 1.5, dh = 2.2, H = ROOM, glow = M.glow, fr = M.metal, leaves = [];
  let x = -HW;
  for (const u of us) { wallN(g, x, u - dw / 2, 0, H, 0, M.wall); wallN(g, u - dw / 2, u + dw / 2, dh, H, 0, M.wall); x = u + dw / 2; }
  wallN(g, x, HW, 0, H, 0, M.wall);
  x = -HW;
  for (const u of [...us, 99]) { const b = u === 99 ? HW : u - dw / 2 - 0.1; g.box(x, 0, -0.025, b, 1.0, 0, M.dado, { skip: 'bs' }).box(x, 1.0, -0.04, b, 1.06, 0, M.trim, { skip: 's' }); x = u + dw / 2 + 0.1; }
  if (k >= 6) g.box(-HW, H - 0.16, -0.05, HW, H - 0.06, 0, M.trim, { skip: 's', emit: k >= 9 ? 0.2 : 0 });      // a cornice, gilt by the top
  if (k >= 7) for (const u of [-2.6, 2.6]) g.box(u - 0.11, 1.06, -0.045, u + 0.11, H - 0.16, 0, M.trim, { skip: 'bs', emit: k >= 9 ? 0.2 : 0.03 }).box(u - 0.15, 1.06, -0.06, u + 0.15, 1.2, 0, M.trim, { skip: 's', emit: k >= 9 ? 0.2 : 0.03 });      // and pilasters between the doors
  us.forEach((u, i) => {
    const a = u - dw / 2, b = u + dw / 2, isOpen = (o.open || []).includes(i), moves = o.slide === i, lit = isOpen || moves, lc = lit ? '#b9f0c0' : M.lamp;
    g.box(a - 0.1, 0, -0.05, a, dh + 0.1, 0.26, fr, { skip: 'b' }).box(b, 0, -0.05, b + 0.1, dh + 0.1, 0.26, fr, { skip: 'b' }).box(a, dh, -0.05, b, dh + 0.1, 0.26, fr);
    g.box(u - 0.2, dh + 0.18, -0.04, u + 0.2, dh + 0.3, 0, '#2f2f30', { skip: 's' }).box(u - 0.16, dh + 0.2, -0.05, u + 0.16, dh + 0.28, -0.04, lc, { emit: 3 * glow, skip: 's' });
    deck.glow([{ p: run.pt(u, dh + 0.24, -0.08), color: lc, power: 1.2 * glow, size: 0.45 }]);
    g.box(b + 0.22, 1.0, -0.03, b + 0.36, 1.3, 0, '#3a3b3c', { skip: 's' }).box(b + 0.26, 1.12, -0.04, b + 0.32, 1.18, -0.03, '#ffe0a0', { emit: 3, skip: 's' });
    if (lit) cabRoom(deck, g, run, M, u, rng);
    if (isOpen) { g.box(a - 0.02, 0.02, 0.18, a + 0.1, dh, 0.23, M.door, { skip: 'b' }).box(b - 0.1, 0.02, 0.18, b + 0.02, dh, 0.23, M.door, { skip: 'b' }); return; }
    for (const sd of [-1, 1]) {
      const lg = moves ? new Geo({ maxSeg: 8 }) : g, p0 = sd < 0 ? a : u + 0.006, p1 = sd < 0 ? u - 0.006 : b;
      if (moves) lg.at(run.ox, run.oy, run.oz, run.yaw);
      drawLeaf(lg, M, p0, p1, dh, rng);
      if (moves) { lg.pop(); const m = lg.mesh(deck.lit, deck.frame); deck.group.add(m); leaves.push([m, sd]); }
    }
  });
  const brass = hex(paint('trim', Math.max(k, 2.5))), ink = '#2b2214';
  deck.sign('Cabs', { run, at: run.pt(0, H - 0.4, -0.014), h: 0.3, style: 'plate', font: 'cond', track: 0.2, ground: k >= 4 ? brass : '#cfc6ae', ink });
  deck.sign(['Deck ' + (DECK0 + k), weight(k) + ' g'], { run, at: run.pt(-5.3, 1.62, -0.03), w: 0.62, h: 0.4, style: 'plate', font: 'cond', font2: 'serif', ground: brass, ink, glow: 0.25 });
  const slide = (q) => { for (const [m, sd] of leaves) { const d = run.dir(sd * clamp(q, 0, 1) * (dw / 2 - 0.08), 0); m.rotation.z = d[0] / (deck.frame.floorR - M.y - 1.1); m.position.z = d[1]; } };
  return { slide, us };
}

// ---------------------------------------------------------------- the stair
// The flight from deck k up to deck k + 1 hangs in the well along the side opposite deck k's lobby and climbs the way
// the camera goes round, so the stair is one square helix: a flight to a side, a landing in each corner of the well.
// 24 risers of 167 mm and 23 treads of 290 mm, closed strings, a rail both sides. Drawn in its side's own
// co-ordinates: u along the flight, v from -5.9 (the well) to -3.5 (the gallery's edge).
const VA = -GD - FW, VB = -GD;
const LAMP = [1.3, 0, -2.0];                               // the lamp on a post by the bread cart
const nose = (u) => ((u + U1) / GO + 1) * STEP;            // the line through the treads' front edges
function drawFlight(deck, k, rng) {
  const run = wallRun(k + 2, RISE * k), P = deck.pen(run, 0, 'st' + k), g = P.g, M = deckPaint(k + 0.5);
  const tread = M.step, riser = shade(M.step, 0.7), str = k < 3 ? M.metal : M.trim, railC = k < 3 ? M.metal : k < 7 ? '#6b4a2c' : M.metal;
  for (let i = 0; i < NR - 1; i++) {
    const u0 = -U1 + i * GO, y = (i + 1) * STEP;
    g.box(u0, y - 0.25, VA + 0.03, u0 + GO, y, VB - 0.03, riser, { top: tread, skip: 'bens' });
    if (k >= 6) g.box(u0, y, VA + 0.05, u0 + 0.04, y + 0.006, VB - 0.05, M.trim, { skip: 'b', emit: k >= 9 ? 0.3 : 0.05 });
  }
  // the underside, the two strings, and the two short level pieces that join it to the corner landings
  const under = shade(M.soffit, 1.1), ue = 0.5 * M.glow;
  g.quad([-U1, -0.25, VA], [U1, RISE - STEP - 0.25, VA], [U1, RISE - STEP - 0.25, VB], [-U1, -0.25, VB], under, ue);
  for (const v of [VA, VB - 0.02]) both(g, [-U1, -0.27, v], [U1, RISE - STEP - 0.27, v], [U1, RISE + 0.04, v], [-U1, STEP + 0.04, v], str, k >= 9 ? 0.3 : 0.12 * M.glow);
  // three small lamps under it, so that the stair shows from below
  for (const q of [0.2, 0.5, 0.8]) {
    const u = -U1 + q * 2 * U1, y = (u + U1) / GO * STEP - 0.27;
    g.cyl(u, y - 0.03, (VA + VB) / 2, 0.11, 0.14, 0.04, 8, M.lamp, { emit: 2 + 2.4 * M.lev, smooth: false, cap: false, base: true });
    deck.glow([{ p: run.pt(u, y - 0.06, (VA + VB) / 2), color: M.lamp, power: 0.8 + 0.4 * M.lev, size: 0.5 }]);
  }
  g.box(U1, RISE - 0.45, VA, HV - FW, RISE, VB, under, { skip: 'tse', emit: ue });
  P.f.tint(1).floor(U1, VA, HV - FW, VB, RISE, M.floor, { emit: M.polish }).tint(0);
  if (k > 0) {
    g.box(-HV, -0.25, VA, -U1, 0, VB, under, { skip: 'tsw', emit: ue });
    P.f.tint(1).floor(-HV, VA, -U1, VB, 0, M.floor, { emit: M.polish }).tint(0);
  }
  // rails: a hand rail on posts both sides; pipes at the foot, balusters, then glass
  for (const v of [VA + 0.07, VB - 0.07]) {
    g.tube([[-U1, nose(-U1) + 0.92, v], [U1, nose(U1) + 0.92, v]], 0.032, 5, railC, { emit: k >= 9 ? 0.2 : 0 });
    for (let i = 0; i < NR; i += 3) { const u = Math.min(-U1 + i * GO, U1), y = nose(u); g.box(u - 0.025, y - 0.1, v - 0.025, u + 0.025, y + 0.92, v + 0.025, M.metal, { skip: 'tb' }); }
    if (k < 3) for (const h of [0.34, 0.63]) g.tube([[-U1, nose(-U1) + h, v], [U1, nose(U1) + h, v]], 0.018, 4, rng() < 0.3 ? '#6f7f86' : M.metal);
    else if (k < 7) for (let i = 0; i < NR - 1; i++) { const u = -U1 + (i + 0.5) * GO, y = nose(u); g.box(u - 0.011, y - 0.06, v - 0.011, u + 0.011, y + 0.9, v + 0.011, M.metal, { skip: 'tb' }); }
    else P.gl.quad([U1, nose(U1) + 0.06, v], [-U1, nose(-U1) + 0.06, v], [-U1, nose(-U1) + 0.88, v], [U1, nose(U1) + 0.88, v], '#cfe6e8');
    for (const [u, y] of [[-U1, 0], [U1, RISE]]) g.box(u - 0.05, y, v - 0.05, u + 0.05, y + 1.16, v + 0.05, str, { skip: 'b', emit: k >= 9 ? 0.2 : 0 });
  }
  // the newel in the well's corner at each end, and the bit of rail from it to the flight's own
  for (const [ua, ub, y] of [[-(HV - FW), -U1, 0], [U1, HV - FW, RISE]]) {
    if (y === 0 && k === 0) continue;
    const un = y ? ub : ua;
    g.box(un - 0.06, y, VA + 0.01, un + 0.06, y + 1.2, VA + 0.13, str, { skip: 'b', emit: k >= 9 ? 0.2 : 0 }).box(ua, y + 0.97, VA + 0.04, ub, y + 1.03, VA + 0.1, railC, { skip: 'we' });
    if (k >= 4) { g.blob(un, y + 1.3, VA + 0.07, 0.1, 1, M.lamp, { emit: 2 + 2 * M.lev, shadeBottom: 1 }); deck.glow([{ p: run.pt(un, y + 1.3, VA + 0.07), color: M.lamp, power: 0.7 + 0.5 * M.lev, size: 0.6 }]); }
  }
  P.done();
  // people: standing on the treads, sitting on them lower down, and a few who climb or come down
  const dens = deck.density, up = run.yaw + Math.PI / 2, spots = [];
  for (let i = 0, n = Math.round((7 - 0.45 * k) * dens); i < n; i++) {
    const st = 1 + Math.floor(rng() * (NR - 4)), edge = rng() < 0.5, v = edge ? (rng() < 0.5 ? VA + 0.42 : VB - 0.42) : rng.f(VA + 0.6, VB - 0.6), u = -U1 + (st + 0.5) * GO;
    if (k < 4 && rng() < 0.3) spots.push({ p: run.pt(u + GO, (st + 2) * STEP, v), sit: true, yaw: up + Math.PI, color: coat(k, rng) });
    else spots.push({ p: run.pt(u, (st + 1) * STEP, v), yaw: edge && v < -4.7 ? run.yaw + Math.PI + rng.f(-0.5, 0.5) : rng() < 0.7 ? up : up + Math.PI, color: coat(k, rng), child: rng() < 0.08 });
  }
  // Those who climb go along the line through the middle of the treads, and a little way onto the landing at each end,
  // where the kit shrinks a walker to nothing and lets it grow again: someone stands at each end of each lane, on the
  // very spot, so that a walker comes out from behind a person and goes in behind another. Nobody climbs the two flights the sofa has stopped.
  const E = 0.32, T = (2 * U1 + 2 * E) / 0.5, slope = STEP / GO, vy = 0.5 * slope, y0 = STEP / 2 - E * slope, ends = makeRng('rise-stair' + k), lanes = new Set();
  for (let i = 0, n = Math.round((k < 6 ? 3 : 2) * dens); i < n; i++) {
    const down = i % 3 === 2, d = run.dir(down ? -0.5 : 0.5, 0), lane = down ? VA + 0.75 : VB - 0.75, v = lane + (down ? 0 : rng.f(-0.1, 0.1));
    const w = { p: run.pt(down ? U1 + E : -U1 - E, down ? RISE - y0 : y0, v), yaw: down ? up + Math.PI : up, drift: [d[0], down ? -vy : vy, d[1], T], phase: rng(), color: coat(k, rng), child: rng() < 0.1, skin: rng.pick(SKIN), scale: rng.f(0.93, 1.06) };
    if (k !== 7 && k !== 8) { deck.walkers.push(w); lanes.add(lane); }
  }
  for (const lane of lanes) for (const [u, y] of [[-U1 - E + 0.18, 0], [U1 + E - 0.18, RISE]]) spots.push({ p: run.pt(u, y, lane), yaw: up + ends.f(-1.2, 1.2) + (y ? Math.PI : 0), color: coat(y ? k + 1 : k, ends) });
  deck.people(spots);
}

// the chain of lamp globes down the middle of the well: one every metre and a half, dim amber at the foot, white at the top
function drawChain(deck) {
  const g = deck.bucket(0, 0, 'chain').g;
  g.cyl(0, 2.8, 0, 0.02, 0.02, NK * RISE - 2.8, 5, '#8a6a2e', { cap: false });
  g.cyl(0, 2.42, 0, 0.0, 0.075, 0.3, 8, '#c5963c', { smooth: false, emit: 0.2 });        // a plumb bob at its foot, over the first stud of the fall line
  for (let y = 3.1; y < NK * RISE - 0.8; y += 1.55) {
    const k = y / RISE, L = lev(k), r = 0.2 + 0.0028 * y, c = hex(paint('lamp', Math.min(k, 11)));
    g.blob(0, y, 0, [r, r * 1.08, r], 1, c, { emit: 1.3 + 2.7 * L, shadeBottom: 1 });
    g.cyl(0, y + r, 0, 0.055, 0.03, 0.1, 6, '#9a6a2a', { smooth: false });
    deck.glow([{ p: [0, y, 0], color: c, power: 0.8 + 0.65 * L, size: 0.85 + 0.012 * y }]);
  }
}

// the well's own ceiling, a deck above the top landing: lit panels between gilt beams, and a rose where the chain hangs
function drawCeiling(deck) {
  const g = deck.bucket(0, 0, 'top').g, y = NK * RISE, M = deckPaint(11);
  g.floor(-HV, -HV, HV, HV, y, shade(M.soffit, 0.8), { down: true, emit: 0.4 });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) g.floor(-HV + i * 3 + 0.2, -HV + j * 3 + 0.2, -HV + i * 3 + 2.8, -HV + j * 3 + 2.8, y - 0.05, '#fff6e2', { down: true, emit: 3.4 });
  for (let i = 0; i <= 4; i++) g.box(-HV + i * 3 - 0.14, y - 0.4, -HV, -HV + i * 3 + 0.14, y, HV, M.trim, { skip: 't', emit: 0.25 }).box(-HV, y - 0.4, -HV + i * 3 - 0.14, HV, y, -HV + i * 3 + 0.14, M.trim, { skip: 't', emit: 0.25 });
  g.cyl(0, y - 0.5, 0, 0.3, 0.75, 0.46, 12, M.trim, { emit: 0.3, cap: false });
  // the band of wall between the top gallery's ceiling and this one
  for (let s = 0; s < 4; s++) { const P = deck.pen(wallRun(s, TOP), 0, 'top'); wallN(P.g, -HV, HV, ROOM, RISE, -GD, M.fascia, 0.2); P.done(); }
}

// ---------------------------------------------------------------- furnishings of the Rise's own
function addProtos(deck) {
  // a lemon tree in a tub (there is no soil in a drum), in fruit
  deck.proto('lemon', (g) => {
    g.cyl(0, 0, 0, 0.3, 0.36, 0.5, 8, '#d2c3a2', { smooth: false, top: '#4f4338' }).cyl(0, 0.5, 0, 0.04, 0.03, 0.8, 5, '#6b5440');
    g.at(0, 0, 0, 0, [-1, 1, 1]).tint(1).blob(0, 1.72, 0, [0.62, 0.56, 0.62], 1, '#ffffff', { lump: 0.25, seed: 4, shadeBottom: 0.7 }).tint(0).pop();      // (mirrored: a blob winds inward)
    for (let i = 0; i < 16; i++) { const a = i * 2.4, e = -0.55 + 1.1 * ((i * 7) % 8) / 8, c = Math.cos(e); g.blob(Math.cos(a) * c * 0.64, 1.72 + Math.sin(e) * 0.56, Math.sin(a) * c * 0.64, [0.055, 0.065, 0.055], 0, '#f2cf3a', { emit: 0.4, shadeBottom: 0.85 }); }
  }, { leafy: true });
  // a clipped bay in a tub
  deck.proto('bay', (g) => {
    g.cyl(0, 0, 0, 0.32, 0.38, 0.52, 8, '#d2c3a2', { smooth: false, top: '#4f4338' }).cyl(0, 0.52, 0, 0.045, 0.035, 1.0, 5, '#6b5440');
    g.at(0, 0, 0, 0, [-1, 1, 1]).tint(1).blob(0, 1.95, 0, [0.52, 0.56, 0.52], 1, '#ffffff', { lump: 0.08, seed: 6, shadeBottom: 0.7 }).tint(0).pop();
  }, { leafy: true });
  // the Crock's country loaf
  deck.proto('loaf', (g) => { g.blob(0, 0.07, 0, [0.16, 0.085, 0.1], 0, '#b97a3c', { seed: 3, shadeBottom: 0.72 }); g.box(-0.09, 0.135, -0.012, 0.09, 0.15, 0.012, '#e6c890'); });
  // the new sofa: 40 kg, about a thousand kays, the colour it is at the wedding
  deck.proto('sofa', (g) => {
    g.box(-1.15, 0.12, -0.45, 1.15, 0.48, 0.45, '#1f8e8a').box(-1.15, 0.48, 0.22, 1.15, 1.0, 0.45, '#1c8580');
    g.box(-1.3, 0.12, -0.45, -1.05, 0.74, 0.45, '#1a7d78').box(1.05, 0.12, -0.45, 1.3, 0.74, 0.45, '#1a7d78');
    g.box(-1.0, 0.48, -0.4, -0.02, 0.62, 0.22, '#28a29c').box(0.02, 0.48, -0.4, 1.0, 0.62, 0.22, '#28a29c');
    for (const [x, z] of [[-1.2, -0.38], [1.2, -0.38], [-1.2, 0.38], [1.2, 0.38]]) g.cyl(x, 0, z, 0.05, 0.04, 0.12, 5, '#f2c050', { emit: 0.3 });
    g.box(-1.16, 0.9, 0.2, 1.16, 0.96, 0.47, '#f2c050', { emit: 0.25 }).blob(0, 1.08, 0.34, [0.2, 0.11, 0.08], 0, '#fff6e6', { shadeBottom: 0.9 });
  });
  // people of the high decks: a long dark coat hanging open on a bright lining, white hair, a stick. They face +z as the kit's figures do
  LINING.slice(0, 4).forEach((lining, i) => deck.proto('elder' + i, (g) => {
    g.box(-0.13, 0, -0.09, 0.13, 0.5, 0.09, '#34343a');
    g.tint(1).cyl(0, 0.4, 0, 0.25, 0.17, 1.05, 6, '#ffffff', { smooth: false }).tint(0);
    g.quad([-0.075, 0.42, 0.226], [0.075, 0.42, 0.226], [0.02, 1.38, 0.156], [-0.02, 1.38, 0.156], lining, 0.25);
    for (const x of [-0.245, 0.245]) g.cube(x, 0.86, 0.02, 0.05, 0.07, 0.11, lining, { emit: 0.25 });
    g.blob(0, 1.6, 0, 0.14, 0, SKIN[(i * 2 + 1) % SKIN.length], { shadeBottom: 0.8 }).blob(0, 1.685, -0.035, [0.15, 0.09, 0.15], 0, i % 2 ? '#d9d6ce' : '#f1eee6', { shadeBottom: 0.9 });
    g.tube([[0.31, 0, 0.14], [0.28, 0.88, 0.1]], 0.014, 4, '#5a4632');
  }));
  // a row of mended shoes for a counter
  deck.proto('shoes', (g) => { for (let i = 0; i < 5; i++) for (const d of [0, 0.11]) g.box(-0.62 + i * 0.3 + d, 0, -0.12, -0.54 + i * 0.3 + d, 0.07, 0.12, ['#3a2a22', '#5a3a2a', '#2f2f30', '#7e3f33', '#8a6a4a'][i], { skip: 'b' }); });
}

// A street's mouth in a gallery's wall between ua and ub: jambs, a beam, the street's name on an enamel plate, and a
// few metres of the street going away under its lamps.
function drawMouth(deck, P, run, M, ua, ub, name, rng) {
  const g = P.g, top = 2.5, dep = 11, e = 0.5 * M.glow, wall = shade(M.wall, 0.95);
  wallN(g, ua, ub, top, ROOM, 0, M.wall);
  g.box(ua - 0.14, 0, -0.05, ua, top + 0.12, 0.3, M.trim, { skip: 'b' }).box(ub, 0, -0.05, ub + 0.14, top + 0.12, 0.3, M.trim, { skip: 'b' }).box(ua, top, -0.05, ub, top + 0.12, 0.3, M.trim);
  P.f.tint(M.k >= 7 ? 0.5 : 1).floor(ua, 0, ub, dep, 0, M.floor, { emit: M.polish }).tint(0);
  g.floor(ua, 0, ub, dep, ROOM - 0.1, M.soffit, { down: true, emit: 0.3 * M.glow });
  wallN(g, ua, ub, 0, ROOM, dep, wall, e * 1.6);
  g.quad([ua, 0, dep], [ua, 0, 0.3], [ua, ROOM, 0.3], [ua, ROOM, dep], wall, e).quad([ub, 0, 0.3], [ub, 0, dep], [ub, ROOM, dep], [ub, ROOM, 0.3], wall, e);
  for (let v = 2; v < dep; v += 3) {
    g.floor((ua + ub) / 2 - 0.45, v - 0.15, (ua + ub) / 2 + 0.45, v + 0.15, ROOM - 0.12, '#fff3dc', { down: true, emit: 1.5 + 2.5 * M.lev });
    deck.glow([{ p: run.pt((ua + ub) / 2, ROOM - 0.2, v), color: M.lamp, power: 0.9 + 1.0 * M.lev, size: 0.7 }]);
    // a shop's window on one hand and a door on the other, as flat lit faces
    const sd = (Math.round(v) % 2) ? 1 : -1, uw = sd > 0 ? ub - 0.01 : ua + 0.01, c = rng.pick(deck.pal.window);
    const q = (v0, v1, y0, y1, col, em) => (sd > 0 ? g.quad([uw, y0, v0], [uw, y0, v1], [uw, y1, v1], [uw, y1, v0], col, em) : g.quad([uw, y0, v1], [uw, y0, v0], [uw, y1, v0], [uw, y1, v1], col, em));
    q(v - 1.1, v + 0.9, 0.6, 2.2, c, 1.2 * M.glow);
  }
  deck.sign(name, { run, at: run.pt((ua + ub) / 2, top + 0.3, -0.02), h: 0.26, style: 'plate', font: 'cond', track: 0.12 });
  const spots = [];
  for (let i = 0, n = Math.max(1, Math.round((3.2 - 0.2 * M.k) * deck.density)); i < n; i++) spots.push({ p: run.pt(rng.f(ua + 0.5, ub - 0.5), 0, rng.f(0.8, dep - 2)), yaw: rng() * TAU, color: coat(M.k, rng) });
  deck.people(spots);
}

// The top landing's wall: garden doors. Each is a flat that keeps a bright garden, and you can tell by the light under
// the door and round its edges. `ajar` is left as a bare opening for the leaf that swings.
const GARDEN_US = [-7, -3.5, 0, 3.5, 7];
const LACQUER = ['#21433a', '#4a2026', '#22324e', '#3a2f1a', '#2f2a3a'];
function drawGardenWall(deck, P, run, M, ajar, vd, rng) {
  const g = P.g, dw = 1.2, dh = 2.2, light = '#fff1c8';
  let x = -HW, n = 0;
  for (const u of GARDEN_US) {
    const a = u - dw / 2, b = u + dw / 2, open = ajar === u, dep = open ? vd + 0.08 : 0.12;
    wallN(g, x, a, 0, ROOM, 0, M.wall); wallN(g, a, b, dh, ROOM, 0, M.wall); x = b;
    g.box(a - 0.12, 0, -0.05, a, dh + 0.12, dep, M.trim, { skip: 'b', emit: 0.2 }).box(b, 0, -0.05, b + 0.12, dh + 0.12, dep, M.trim, { skip: 'b', emit: 0.2 }).box(a, dh, -0.05, b, dh + 0.12, dep, M.trim, { emit: 0.2 });
    // (one flat in fifteen keeps no garden: its door has an ordinary lamp's line under it and nothing round it)
    const dark = run.turn === 3 && u === 3.5, lac = LACQUER[(run.turn * 2 + n) % LACQUER.length];
    if (!open) {
      // the leaf, shut: dark lacquer, two fingers short of its frame all round, and daylight behind it
      const gap = dark ? 0.008 : 0.045;
      wallN(g, a, b, 0, dh, 0.1, dark ? '#ffb868' : light, dark ? 1.6 : 11);
      g.box(a + gap, dark ? 0.03 : 0.075, 0.05, b - gap, dh - gap, 0.1, lac, { skip: 's' });
      for (const [ya, yb] of [[0.3, 0.98], [1.12, dh - 0.24]]) g.box(a + 0.18, ya, 0.04, b - 0.18, yb, 0.05, shade(lac, 1.35), { skip: 's' });
      g.cyl(b - 0.15, 1.02, 0.03, 0.035, 0.035, 0.06, 6, M.trim, { emit: 0.3 });
      if (!dark) for (const q of [0.25, 0.5, 0.75]) deck.glow([{ p: run.pt(a + q * dw, 0.05, 0.03), color: light, power: 1.5, size: 0.42 }]);
      if (!dark) for (const q of [0.55, 1.2, 1.85]) deck.glow([{ p: run.pt(a + 0.02, q, 0.03), color: light, power: 0.8, size: 0.28 }, { p: run.pt(b - 0.02, q, 0.03), color: light, power: 0.8, size: 0.28 }]);
    }
    // what comes out under it, across the floor
    if (!dark) for (let i = 0; i < 3; i++) g.floor(a - 0.05 - i * 0.12, -0.34 - i * 0.5, b + 0.05 + i * 0.12, -(i ? 0.34 + (i - 1) * 0.5 : 0), 0.004 + i * 0.001, light, { emit: [2.4, 0.9, 0.35][i] });
    if (!dark) deck.glow([{ p: run.pt(u, 0.06, -0.06), color: light, power: 1.2, size: 1.3 }]);
    deck.sign(String(run.turn * 5 + n++ + 1), { run, at: run.pt(b + 0.3, 1.55, -0.012), h: 0.15, w: 0.24, style: 'plate', font: 'cond', ground: '#f3c25c', ink: '#2b2214' });
  }
  wallN(g, x, HW, 0, ROOM, 0, M.wall);
  g.box(-HW, 0, -0.03, HW, 0.16, 0, M.trim, { skip: 'bs', emit: 0.15 }).box(-HW, ROOM - 0.16, -0.05, HW, ROOM - 0.06, 0, M.trim, { skip: 's', emit: 0.2 });
  // a lemon tree between the doors, here and there
  for (let i = 0; i < GARDEN_US.length - 1; i++) if (rng() < 0.6) { const p = run.pt(GARDEN_US[i] + 1.75, 0, -0.5); if (deck.clear(p[0], p[1] + 1.2, p[2], 1.6)) deck.put('lemon', { p, yaw: rng() * TAU, scale: rng.f(0.85, 1.05), color: rng.pick(deck.pal.leaf) }); }
}

// What stands along the three walls of deck k that are not its lobby, going round from the lobby: for each a list of
// [from, to, what]. h: a home's door. f: a flat, with windows on the well. s / t: a shop or a stall, its name, its
// goods. m: a street's mouth and its name. n: a notice. Anything left over is plain wall, perhaps with a bench.
const NOTICES = [
  ['Hollow hours', 'at auction tonight,', 'Ring 1 hall.', 'Wedding parties', 'may bid jointly.'],
  ['Drop nothing', 'What you let go lands', 'anti of where you', 'thought. See the line', 'in the floor.'],
  ['Lamplight Rise', 'Twelve decks, 264 steps.', 'You weigh a little less', 'on every landing.'],
];
const WALLS_OF = [
  [['t Noodles noodles', 'm The Bright Arcade', 'h'], ['h', 'n 0', 'h'], ['h', 'n 2', 'h']],
  [['s Licensed Cellar bottles', 'n 1', 'h'], ['h', 'h', 'h'], ['h', 'm Coin Yard', 't Tea tea']],
  [['h', 'n 0', 'h'], ['s Second-hand pots', 'h', 'h'], ['h', 'n 2', 'h']],
  [['s Books books', 'h', 'h'], ['h', 'n 1', 's Pots and lids pots'], ['h', 'm The Bright Arcade', 'h']],
  [['s Linings cloth', 'f', 'h'], ['f', 'n 1', 's Tea tea'], ['f', 'm Highmarket', 's Shoes shoes']],
  [['s Paper paper', 'm Auction Walk', 'f'], ['f', 's Flutes flutes', 'f'], ['f', 'm Auction Walk', 's Books books']],
  [['s Lamps lamps', 'f', 'f'], ['f', 'n 1', 'f'], ['f', 'm Highmarket', 's Toys toys']],
  [['f', 's Lamps lamps', 'f'], ['f', 'f', 'f'], ['f', 'm Gilding', 'f']],
  [['f', 'f', 'f'], ['f', 'f', 'f'], ['f', 'm Gilding', 'f']],
  [['f', 'f'], ['f', 'f'], ['f', 'f']],
  [['f', 'f'], ['f', 'f'], ['f', 'f']],
];
function frontsOf(k, r, rng, mouths) {
  const list = WALLS_OF[k][r - 1], spans = list.length === 2 ? [[-8.4, -0.6], [0.6, 8.4]] : [[-8.3, -3.1], [-2.3, 2.3], [3.1, 8.3]];
  const dull = ['#5a5348', '#4f5a52', '#6a4a3a', '#55504a'], pale = ['#f4ecd8', '#e9dcc0', '#f1e6c8'];
  return list.map((w, i) => {
    const [kind, ...rest] = w.split(' '), f = { local: true, from: spans[i][0], to: spans[i][1], lit: 1 };
    if (k <= 2) f.door = rng.pick(dull); else if (k >= 9) f.door = rng.pick(pale);
    if (kind === 'h') return { ...f, kind: 'home', bench: false };
    if (kind === 'f') return { ...f, kind: 'flat', lit: 0.55 + 0.045 * k, windows: list.length === 2 ? 3 : undefined };
    if (kind === 'n') return { ...f, from: -1.6, to: 1.6, kind: 'wall', bench: false, notice: NOTICES[+rest[0]] };
    if (kind === 'm') { mouths.push([-1.5, 1.5, rest.join(' ')]); return { ...f, from: -1.64, to: 1.64, kind: 'gap' }; }
    const goods = rest.pop();
    return { ...f, kind: kind === 't' ? 'stall' : 'shop', name: rest.join(' '), goods, awning: kind === 't' || (k < 7 && rng() < 0.5), blade: false, open: rng() < 0.6 };
  });
}

// ---------------------------------------------------------------- a deck: its gallery, lamps, walls and people
// a lamp under a gallery's ceiling: a bare panel at the foot (now and then a dead one), a globe on a stem, a cluster by the top
function drawLamp(deck, g, run, M, u, v, rng) {
  const k = M.k, E = 1.5 + 2.6 * M.lev, y = ROOM;
  if (k <= 2) {
    const dead = rng() < 0.16;
    g.box(u - 0.5, y - 0.05, v - 0.2, u + 0.5, y, v + 0.2, '#4a4b4c', { skip: 't' }).floor(u - 0.44, v - 0.14, u + 0.44, v + 0.14, y - 0.055, dead ? '#6a5a44' : '#ffe2b0', { down: true, emit: dead ? 0.1 : E });
    if (!dead) deck.glow([{ p: run.pt(u, y - 0.1, v), color: M.lamp, power: 1.1 + 1.1 * M.lev, size: 0.7, twinkle: ((Math.round(u * 7) + k * 5 + run.turn * 3) % 6 + 6) % 6 === 0 ? 0.7 : 0 }]);      // and one on its way out
    return;
  }
  const drop = 0.5, r = 0.13 + 0.008 * k;
  g.cyl(u, y - drop, v, 0.012, 0.012, drop, 4, M.metal, { cap: false }).blob(u, y - drop - r * 0.8, v, r, 1, M.lamp, { emit: E, shadeBottom: 1 });
  if (k >= 9) for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.6, c = Math.cos(a) * 0.3, s = Math.sin(a) * 0.3; g.blob(u + c, y - drop + 0.02, v + s, r * 0.7, 0, M.lamp, { emit: E, shadeBottom: 1 }).tube([[u, y - drop + 0.12, v], [u + c, y - drop + 0.08, v + s]], 0.01, 3, M.metal); }
  deck.glow([{ p: run.pt(u, y - drop - r * 0.8, v), color: M.lamp, power: 0.9 + 0.55 * M.lev, size: 0.62 + 0.02 * k }]);
  // from deck 304 up the floor is polished, and holds each lamp
  if (k >= 8) g.cyl(u, 0.002, v, 0.62, 0.62, 0.002, 14, M.lamp, { emit: 0.06 + 0.04 * (k - 8), smooth: false }).cyl(u, 0.005, v, 0.24, 0.24, 0.002, 10, M.lamp, { emit: 0.3 + 0.12 * (k - 8), smooth: false });
}

// people walking a straight line and coming round again, in this deck's coats
function walkLine(deck, a, b, n, k, rng, speed = 1.1) {
  const len = Math.hypot(b[0] - a[0], b[2] - a[2]), ux = (b[0] - a[0]) / len, uz = (b[2] - a[2]) / len;
  for (let i = 0; i < n; i++) {
    const sp = speed * rng.f(0.85, 1.15), off = rng.f(-0.3, 0.3);
    deck.walkers.push({ p: [a[0] - uz * off, a[1], a[2] + ux * off], yaw: Math.atan2(ux, uz), drift: [ux * sp, 0, uz * sp, len / sp], phase: rng(), color: coat(k, rng), child: k < 6 && rng() < 0.1, skin: rng.pick(SKIN), scale: rng.f(0.93, 1.06) });
  }
}

// which cab doors stand open on a lit cab, and which one parts as the flight comes up to it
const OPEN = [[3], [], [3], [], [0, 3], [2], [], [3], [1], [], [0], [1]];
const SLIDE = [2, 2, null, 2, null, null, 3, null, 3, 2, null, 3];

function* buildDeck(deck, k, rng, state) {
  const M = deckPaint(k), part = 'k' + k, below = deckPaint(Math.max(0, k - 1));
  // the kit's own paint for the fronts it draws: old things low down, new things higher, and every lamp as bright as its deck
  Object.assign(deck.pal, k >= 4 ? PALETTES.bright : PALETTES.warm, { lamp: M.lamp, shop: M.lamp, brass: hex(paint('trim', Math.max(k, 3))), goods: 0.5 + 0.045 * k });
  deck.glowK = M.glow;
  for (let s = 0; s < 4; s++) {
    const run = wallRun(s, M.y), P = deck.pen(run, 0, part), g = P.g, r = (((s - k) % 4) + 4) % 4;       // r = 0: the lobby's side
    if (k > 0) {
      // the gallery: its floor, the ceiling it makes for the deck below, the edge of its slab, its rail
      P.f.tint(k >= 7 ? 0.5 : 1).floor(-HV, -GD, HW, 0, 0, M.floor, { emit: M.polish }).tint(0);
      g.floor(-HV, -GD, HW, 0, -SLAB, below.soffit, { down: true, emit: 0.42 * below.glow });
      wallN(g, -HV, HV, -SLAB, 0, -GD, M.fascia, 0.3 * M.glow);
      if (k >= 4) g.box(-HV, -0.5, -GD - 0.025, HV, -0.38, -GD, M.trim, { skip: 's', emit: k >= 9 ? 0.3 : 0.05 });
      if (k >= 8) g.box(-HV, -0.12, -GD - 0.04, HV, 0, -GD, M.trim, { skip: 's', emit: k >= 9 ? 0.3 : 0.05 });
      // the rail stops short of the corner where the stair's landing is
      drawRail(P, M, r === 2 ? -(HV - FW) : -HV, r === 1 ? HV - FW : HV, rng);
      yield 'rise: gallery';
      // from deck 300 up, a string of small bulbs under the gallery's edge: closer set and brighter with every deck
      if (k >= 4) { const sp = k >= 10 ? 0.75 : k >= 7 ? 1.0 : 1.5; for (let u = -HV + sp / 2; u < HV; u += sp) deck.glow([{ p: run.pt(u, -SLAB - 0.05, -GD - 0.06), color: M.lamp, power: 0.3 + 0.12 * M.lev, size: 0.26 }]); }
    }
    if (k === NK - 1) g.floor(-HV, -GD, HW, 0, ROOM, M.soffit, { down: true, emit: 0.42 * M.glow });
    for (const u of [-3.875, 0, 3.875, 7.75]) drawLamp(deck, g, run, M, u, -1.75, rng);
    // beams under the ceiling; and lower down, where nobody has paid to box them in, the pipes: one of them the warm loop
    const beam = shade(M.soffit, 0.84);
    for (const u of [-5.81, -1.94, 1.94, 5.81]) g.box(u - 0.09, ROOM - 0.2, -GD + 0.2, u + 0.09, ROOM, 0, beam, { skip: 't' });
    g.box(-HV, ROOM - 0.2, -GD, HV, ROOM, -GD + 0.2, beam, { skip: 't' });
    if (k <= 4) g.box(-HW, ROOM - 0.2, -0.64, HW, ROOM - 0.07, -0.51, '#a8553a', { skip: 't' }).box(-HW, ROOM - 0.17, -0.88, HW, ROOM - 0.08, -0.79, '#6d6c68', { skip: 't' });
    yield 'rise: lamps';
    if (r === 0) state.lobbies[k] = drawLobby(deck, P, run, M, rng, { open: OPEN[k], slide: SLIDE[k] });
    else if (k === NK - 1) drawGardenWall(deck, P, run, M, s === 0 ? DOOR_U : null, state.doorV, rng);
    P.done();
    yield 'rise: wall';
    if (r !== 0 && k < NK - 1) {
      const mouths = [];
      yield* frontage(deck, run, { from: -HW, to: HW, height: ROOM, fill: false, paint: { wall: M.wall, dado: M.dado, trim: M.trim }, fronts: frontsOf(k, r, rng, mouths), part });
      yield 'rise: fronts';
      if (mouths.length) { const Q = deck.pen(run, 0, part); for (const [a, b, name] of mouths) drawMouth(deck, Q, run, M, a, b, name, rng); Q.done(); }
    }
    yield 'rise: deck ' + (DECK0 + k);
  }
  // people on the galleries: many at the foot, few at the top, and those mostly old
  const spots = [], dens = deck.density;
  for (let i = 0, n = Math.round((15 - k) * dens); i < n; i++) {
    const run = wallRun(Math.floor(rng() * 4), M.y), atRail = k > 0 && rng() < 0.45, u = rng.f(-HV + 0.4, HV - 0.4), p = run.pt(u, 0, atRail ? -GD + 0.45 : rng.f(-2.6, -0.8));
    if (!deck.clear(p[0], p[1] + 1.4, p[2], 3.1) || (k === 8 && p[0] > 2.5 && p[2] > 2.5)) continue;
    const yaw = atRail ? run.yaw + Math.PI + rng.f(-0.4, 0.4) : rng() * TAU;
    if (k >= 9 && rng() < 0.7) deck.put('elder' + Math.floor(rng() * 4), { p, yaw, color: rng.pick(GOOD), scale: rng.f(0.94, 1.02) });
    else spots.push({ p, yaw, color: coat(k, rng), child: k < 6 && rng() < 0.1, walk: !atRail && rng() < 0.3 ? rng.f(0.4, 0.8) : 0 });
  }
  deck.people(spots);
  const n = Math.round((4.5 - 0.3 * k) * dens);
  walkLine(deck, on(k, -7.6, 0, -1.25), on(k, 7.6, 0, -1.25), n, k, rng);
  walkLine(deck, on(k, 7.6, 0, -0.8), on(k, -7.6, 0, -0.8), Math.max(1, n - 1), k, rng);
  yield 'rise: people ' + (DECK0 + k);
}

// ---------------------------------------------------------------- one small thing to a landing
// Each stands on its deck's lobby side, toward the rail, where the flight comes up past it.
const GIN = ['Visitors from Sorrel', 'Two bottles of gin each,', 'duty free. We are not', 'looking forward to it', 'at all.'];
const LOTS = ['Hollow hours tonight', 'Ring 1 hall', 'Dawn hour, 3 kays', 'First noon, 9', 'Last noon, 12', 'Dusk hour, 4', 'Wedding parties may bid jointly'];
function dress(deck, k, M, rng) {
  const run = wallRun(k, M.y), P = deck.pen(run, 0, 'k' + k), g = P.g, out = run.yaw + Math.PI, along = run.yaw + Math.PI / 2;
  const at = (u, y, v) => run.pt(u, y, v), put = (kind, u, y, v, o = {}) => deck.put(kind, { p: run.pt(u, y, v), yaw: run.yaw, ...o });
  const who = (u, y, v, yaw, o = {}) => deck.people([{ p: run.pt(u, y, v), yaw, color: coat(k, rng), ...o }]);
  const elder = (i, u, v, yaw) => deck.put('elder' + i, { p: run.pt(u, 0, v), yaw, color: GOOD[(i * 2 + k) % GOOD.length] });
  const brass = hex(paint('trim', Math.max(k, 2.5)));
  // the deck's number and what you weigh there, on brass, on the edge of its floor
  if (k > 0) deck.sign(['Deck ' + (DECK0 + k), weight(k) + ' g'], { run, at: at(1.8, -0.56, -GD - 0.045), w: 1.5, h: 0.6, style: 'plate', font: 'cond', font2: 'serif', ground: brass, ink: '#2b2214', glow: 0.45 });
  if (k === 1) {
    // washing put over the patched rail to air, two chairs that do not match, and the Rise's name where the foot can read it
    for (const [u, c] of [[-2.4, '#c9c3b2'], [0.6, '#8fa0a8'], [3.3, '#b9a58a']]) put('sheet', u, 1.09, -GD + 0.08, { scale: [1, rng.f(0.8, 1), 1], color: c });
    for (const u of [-1.0, 0.1]) { put('chair', u, 0, -2.0, { color: rng.pick(PLAIN) }); who(u, 0.48, -2.0, out, { sit: true }); }
    put('crate', 1.3, 0, -2.1, { color: '#8a7a5a' });
    deck.sign('Lamplight Rise', { run, at: at(-2.7, -0.5, -GD - 0.045), w: 5.4, h: 0.62, style: 'plate', font: 'cond', track: 0.22, glow: 0.35 });
  } else if (k === 2) {
    // the mender: shoes are twenty kays new, so most are resoled
    put('counter', 1.2, 0, -2.0, { color: '#8a6f52' }); put('shoes', 1.2, 0.95, -2.0);
    deck.sign(['Soles 2 kays', 'Heels 1', 'While you wait'], { run, at: at(1.2, 0.5, -2.32), w: 1.5, h: 0.7, style: 'chalk' });
    who(1.0, 0, -1.35, out); put('stool', 3.0, 0, -2.2, { color: '#7a6a55' }); who(3.0, 0.46, -2.2, out + 1.2, { sit: true });
  } else if (k === 3) {
    // the notice board, and two people reading it
    const d = run.dir(-0.55, -0.83), yaw = Math.atan2(-d[0], -d[1]), p = at(0.5, 0, -2.5);
    deck.put('noticeboard', { p, yaw, scale: [1.7, 1.15, 1], color: '#5f4630' });
    for (const [sd, lines] of [[-1, GIN], [1, NOTICES[0]]]) deck.sign(lines, { at: [p[0] + d[0] * 0.035 + d[1] * 0.56 * sd, p[1] + 1.58, p[2] + d[1] * 0.035 - d[0] * 0.56 * sd], n: d, w: 1.02, h: 1.1, style: 'paper', font2: 'serif' });
    for (const sd of [-1.5, 1.45]) deck.people([{ p: [p[0] + d[0] * 0.7 + d[1] * sd, p[1], p[2] + d[1] * 0.7 - d[0] * sd], yaw: Math.atan2(-d[0], -d[1]) + sd * 0.45, color: coat(k, rng) }]);
  } else if (k === 4) {
    // the first lemon tree, under a lamp of its own, and a bench
    put('lemon', 3.0, 0, -2.6, { color: '#6f9a50', scale: 1.05 });
    g.cyl(3.0, 2.6, -2.6, 0.012, 0.012, 0.4, 4, M.metal, { cap: false }).cyl(3.0, 2.52, -2.6, 0.3, 0.1, 0.1, 8, M.metal, { smooth: false, cap: false }).cyl(3.0, 2.515, -2.6, 0.27, 0.27, 0.01, 8, '#fff6e0', { emit: 6, smooth: false, base: true });
    deck.glow([{ p: at(3.0, 2.5, -2.6), color: '#fff6e0', power: 2.4, size: 0.9 }]);
    put('bench', -1.5, 0, -2.2, { color: '#7a5a34' }); who(-1.85, 0.45, -2.2, out, { sit: true }); who(-1.15, 0.45, -2.2, out, { sit: true });
  } else if (k === 5) {
    // Auction Walk crosses here: a clerk on a crate chalks tonight's lots, and people stop to read them over each other's heads
    const a = 0.9273, ca = Math.cos(a), sa = Math.sin(a), loc = (x, y, z) => at(3.2 + x * ca + z * sa, y, -1.5 - x * sa + z * ca), d = run.dir(-sa, -ca);
    g.at(3.2, 0, -1.5, a);
    for (const x of [-1.3, 1.3]) g.box(x - 0.05, 0, -0.04, x + 0.05, 2.75, 0.04, '#5a4632', { skip: 'b' });
    g.box(-1.36, 0.72, -0.03, 1.36, 2.66, 0.03, '#6b4a2c').box(-1.28, 0.8, -0.04, 1.28, 2.58, -0.03, '#262b29', { skip: 's' }).box(0.8, 1.52, -0.075, 0.9, 1.55, -0.04, '#ffffff', { emit: 0.6 });
    g.pop();
    const c = loc(0, 1.69, -0.05);
    deck.sign(LOTS, { at: c, n: d, w: 2.5, h: 1.72, style: 'chalk', head: true });
    deck.put('crate', { p: loc(0.95, 0, -0.5), yaw: run.yaw + a, scale: [1.3, 1.1, 1.7], color: '#8a7a5a' });
    deck.people([{ p: loc(0.95, 0.34, -0.5), yaw: run.yaw + a, color: '#2f3b45' }]);
    for (let i = 0; i < 12; i++) { const x = rng.f(-1.6, 1.3), z = rng.f(-3.1, -1.3), q = loc(x, 0, z), v = -1.5 - x * sa + z * ca; if (v > -3.0 && v < -0.5 && deck.clear(q[0], q[1] + 1.4, q[2], 3.0)) deck.people([{ p: q, yaw: run.yaw + a + rng.f(-0.25, 0.25), color: coat(k, rng) }]); }
  } else if (k === 6) {
    // three lemon trees in a row under one long lamp, a ladder, and somebody picking
    for (const u of [-1.7, 0.5, 2.7]) put('lemon', u, 0, -2.85, { color: rng.pick(['#6f9a50', '#7fae5c', '#5f9058']), yaw: rng() * TAU, scale: rng.f(0.95, 1.12) });
    g.box(-2.3, 2.9, -3.0, 3.3, 2.94, -2.7, '#fff6e0', { emit: 5.5, skip: 't' }).box(-2.35, 2.94, -3.05, 3.35, ROOM, -2.65, M.metal, { skip: 't' });
    for (const u of [-1.7, 0.5, 2.7]) deck.glow([{ p: at(u, 2.86, -2.85), color: '#fff6e0', power: 2.0, size: 0.9 }]);
    put('ladder', 0.5, 0, -2.2, { scale: 0.8 }); who(0.5, 0.82, -2.05, out); put('crate', 1.4, 0, -2.2, { color: '#e8c838' });
  } else if (k === 7) {
    // the first carpet, from a cab's door to the rail, and two armchairs
    g.box(0.35, 0, -3.3, 2.25, 0.012, -0.32, '#8a2f2a', { skip: 'b' });
    for (const u of [0.35, 2.15]) g.box(u, 0.012, -3.3, u + 0.1, 0.015, -0.32, '#d9a441', { skip: 'b', emit: 0.1 });
    put('armchair', -1.2, 0, -2.5, { color: '#b5553f' }); put('armchair', -2.3, 0, -2.5, { color: '#3f6f73' }); who(-1.2, 0.44, -2.5, out, { sit: true });
  } else if (k === 8) {
    // tub trees either side of the doors, and a robot going over the floor
    for (const u of [-5.3, 5.3]) put('bay', u, 0, -0.55, { color: '#5f9058' });
    const d = run.dir(1, 0); deck.put('robot', { p: at(-5.5, 0, -2.6), yaw: along, drift: [d[0] * 0.3, 0, d[1] * 0.3, 36], phase: 0.3, color: '#d9d4c8' });
  } else if (k === 9) {
    // somebody keeps an orchard apple under glass
    g.box(0.8, 0, -2.9, 1.2, 1.04, -2.5, '#f1ead8', { skip: 'b' }).box(0.78, 0.98, -2.92, 1.22, 1.05, -2.48, M.trim, { emit: 0.3 });
    for (const [x0, z0, x1, z1] of [[0.82, -2.88, 1.18, -2.88], [1.18, -2.52, 0.82, -2.52], [0.82, -2.52, 0.82, -2.88], [1.18, -2.88, 1.18, -2.52]]) P.gl.quad([x1, 1.05, z1], [x0, 1.05, z0], [x0, 1.42, z0], [x1, 1.42, z1], '#d9eef0');
    g.box(0.8, 1.42, -2.9, 1.2, 1.45, -2.5, M.trim, { emit: 0.3 }).cube(1.0, 1.41, -2.7, 0.08, 0.02, 0.08, '#fff3d6', { emit: 6 });
    g.blob(1.0, 1.115, -2.7, [0.055, 0.05, 0.055], 1, '#c9463a', { emit: 0.6, shadeBottom: 0.7 }).cyl(1.0, 1.16, -2.7, 0.008, 0.004, 0.03, 4, '#5a4632');
    deck.glow([{ p: at(1.0, 1.3, -2.7), color: '#fff0d0', power: 1.3, size: 0.6 }]);
    deck.sign(['An orchard apple', 'Not for sale'], { run, at: at(1.0, 0.72, -2.912), w: 0.36, h: 0.2, style: 'card', font: 'serif', font2: 'cond', head: true });
    elder(1, 0.0, -2.5, along);
  } else if (k === 10) {
    // armchairs, and nobody in them; another robot at the floor
    [['#7a4f9a', -2.7], ['#2f8f8a', -1.6], ['#d9603f', -0.5], ['#e0a52e', 0.6]].forEach(([c, u]) => put('armchair', u, 0, -2.55, { color: c }));
    elder(2, 2.0, -3.0, out);
    const d = run.dir(-1, 0); deck.put('robot', { p: at(5.5, 0, -1.9), yaw: along + Math.PI, drift: [d[0] * 0.3, 0, d[1] * 0.3, 36], phase: 0.6, color: '#f1ead8' });
  } else if (k === 11) {
    // lemon trees by the gilded doors, two old people at the rail, and Lovage's motto over all of it
    for (const u of [-5.4, 5.4]) put('lemon', u, 0, -0.6, { color: '#7fae5c', scale: 1.1 });
    elder(0, 2.5, -3.0, out + 0.3); elder(3, 3.2, -2.95, out - 0.2); elder(1, -2.6, -1.0, run.yaw);
    deck.sign('Brighter for it.', { run, at: at(0, ROOM + 0.52, -GD - 0.03), w: 4.4, h: 0.52, style: 'board', font: 'italic', ground: '#f8f1e0', ink: '#a8792a' });
  }
  P.done();
}

// Three flights from the top a wedding party has set the new sofa down on the stair's corner landing, which it fills.
// Two of them sit on it. The rest stand about; the people coming up behind wait on the top treads.
function sofaParty(deck, rng) {
  const y = RISE * 8, c = 4.8, yaw = Math.PI / 4, cs = Math.cos(yaw), sn = Math.sin(yaw), at = (lx, ly, lz) => [c + lx * cs + lz * sn, y + ly, c - lx * sn + lz * cs];
  deck.put('sofa', { p: [c, y, c], yaw });
  const best = ['#f6f1e4', '#efc65a', '#d9476e', '#3c8fd6', '#f29e38', '#2aa596', '#7d5bd0', '#f7cfb6'], spots = [];
  for (const lx of [-0.55, 0.5]) spots.push({ p: at(lx, 0.62, -0.1), sit: true, yaw: -3 * Math.PI / 4, color: best[lx < 0 ? 0 : 1] });
  for (const [x, z, a, i] of [[6.5, 6.9, -2.2, 2], [7.2, 6.2, -2.5, 3], [6.9, 7.7, -2.0, 4], [7.9, 7.0, -2.4, 5], [5.4, 6.6, -1.6, 6], [6.6, 5.3, 3.0, 7]]) spots.push({ p: [x, y, z], yaw: a, color: best[i], child: i === 6 });
  for (const st of [2, 3]) spots.push({ p: [st === 2 ? 4.3 : 5.2, y + (st + 2) * STEP, U1 - (st + 1.5) * GO], sit: true, yaw: 0, color: best[st + 1] });
  for (const st of [14, 16, 17, 19]) spots.push({ p: [-U1 + (st + 0.5) * GO, y - RISE + (st + 1) * STEP, HW + rng.f(-5.4, -4.0)], yaw: Math.PI / 2, color: coat(7, rng) });
  deck.people(spots);
}

// The foot: worn tile, the cart with the Crock's loaf and the people eating it standing, the methanol notice, and the
// fall line: brass in the floor from under the chain toward anti, a stud for each deck where a crumb let go beside the
// chain at that deck's floor would land.
function buildFoot(deck, rng) {
  const M = deckPaint(0), b = deck.bucket(0, 0, 'k0'), g = b.g, brass = '#9a6a2a';
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) b.f.tint(1).floor(-HW + i * 1.9, -HW + j * 1.9, -HW + (i + 1) * 1.9, -HW + (j + 1) * 1.9, 0, shade(M.floor, (i + j) % 2 ? 0.93 : 1.06), { emit: 0.1 + 0.08 * rng() });
  b.f.tint(0);
  g.box(-fall(TOP), 0.002, -0.03, 0, 0.01, 0.03, brass, { skip: 'b' });
  for (let k = 1; k < NK; k++) {
    const d = fall(RISE * k);
    g.cyl(-d, 0.002, 0, 0.085, 0.085, 0.012, 10, '#c5963c', { smooth: false, emit: 0.5 });
    deck.glow([{ p: [-d, 0.03, 0], color: '#ffc27a', power: 0.55, size: 0.26 }]);
    deck.sign(String(DECK0 + k), { at: [-d, 0.016, 0.3], up: -Math.PI / 2, h: 0.17, w: 0.4, style: 'plate', font: 'cond', ground: '#8a6a2e', ink: '#2b2214' });
  }
  g.cyl(0, 0.002, 0, 0.2, 0.2, 0.012, 12, '#c5963c', { smooth: false, emit: 0.1 });
  deck.sign(['The fall line', 'Let go beside the chain,', 'a crumb lands on its deck.'], { at: [0.95, 0.016, 0], up: -Math.PI / 2, w: 1.5, h: 0.62, style: 'plate', font: 'cond', font2: 'serif', ground: '#8a6a2e', ink: '#2b2214' });
  // the cart
  const C = [0.3, 0, -2.4], cy = 0.5;
  deck.put('cart', { p: C, yaw: cy, color: '#7a5a3a' });
  for (let i = 0; i < 9; i++) { const lx = -0.36 + (i % 3) * 0.36, lz = -0.2 + Math.floor(i / 3) * 0.2; deck.put('loaf', { p: [C[0] + lx * Math.cos(cy) + lz * Math.sin(cy), 0.46 + (i % 2) * 0.02, C[2] - lx * Math.sin(cy) + lz * Math.cos(cy)], yaw: cy + rng.f(-0.4, 0.4), scale: rng.f(0.9, 1.1) }); }
  deck.put('lampPost', { p: LAMP, yaw: 0, scale: 0.94 });
  deck.glow([{ p: [LAMP[0], 2.2, LAMP[2]], color: '#ffc27a', power: 1.6, size: 1.0 }]);
  const nb = [-0.2, -0.98], sp = [-0.6, 0, -1.9];
  deck.put('noticeboard', { p: sp, yaw: Math.atan2(0.2, 0.98), scale: [0.9, 0.62, 1], color: '#5f4630' });
  deck.sign(['From the Crock', 'Country loaf 1.10'], { at: [sp[0] + nb[0] * 0.03, 0.855, sp[2] + nb[1] * 0.03], n: nb, w: 1.1, h: 0.6, style: 'chalk' });
  deck.people([{ p: [0.75, 0, -1.75], yaw: -2.6, color: '#d9d2c4' }]);
  // people eating: a loaf held up says what their hands are doing
  for (const [ex, ez] of [[1.9, -2.6], [2.3, -3.3], [2.0, -1.2], [2.9, -2.0], [2.5, 0.5], [2.7, -0.9], [3.3, -3.1], [0.4, -3.6], [1.9, -3.5], [3.4, -1.4], [-0.3, -3.3], [1.2, -1.7]]) {
    const x = ex + rng.f(-0.15, 0.15), z = ez + rng.f(-0.15, 0.15), yaw = rng() < 0.55 ? Math.atan2(C[0] - x, C[2] - z) + rng.f(-0.7, 0.7) : rng() * TAU;
    if (!deck.clear(x, 1.4, z, 1.5)) continue;
    deck.people([{ p: [x, 0, z], yaw, color: rng.pick(PLAIN) }]);
    deck.put('loaf', { p: [x + Math.sin(yaw) * 0.25, 1.2, z + Math.cos(yaw) * 0.25], yaw: yaw + 1.2, scale: 0.72 });
  }
  // the methanol notice, as on every platform of Lovage's Quaysides
  const nm = [-0.447, -0.894], mp = [1.2, 0, -5.0];
  deck.put('noticeboard', { p: mp, yaw: 0.4636, color: '#5f4630' });
  deck.sign(['Methanol kills', 'Spirit cut with feedstock', 'blinds before it kills.', 'Licensed cellars only.', 'Four dead last year.'], { at: [mp[0] + nm[0] * 0.03, 1.375, mp[2] + nm[1] * 0.03], n: nm, w: 1.2, h: 0.98, style: 'paper', font2: 'serif', upper: true });
}

// the stair's last corner landing, on deck 307: nothing goes on up from it, so its far edge has a rail
function topLanding(deck) {
  const run = wallRun(1, TOP), P = deck.pen(run, 0, 'st10'), g = P.g, M = deckPaint(11), u = -(HV - FW);
  g.box(-HV, -0.25, VA, u, 0, VB, shade(M.soffit, 1.1), { skip: 'tsw', emit: 0.5 * M.glow });
  P.f.tint(0.5).floor(-HV, VA, u, VB, 0, M.floor, { emit: M.polish }).tint(0);
  g.box(u - 0.04, 1.0, VA, u + 0.04, 1.05, VB, M.metal, { emit: 0.25 }).box(u - 0.03, 0, VA, u + 0.03, 0.1, VB, M.metal, { skip: 'b' });
  for (const v of [VA + 0.05, VB - 0.05]) g.box(u - 0.04, 0, v - 0.04, u + 0.04, 1.12, v + 0.04, M.trim, { skip: 'b', emit: 0.2 });
  P.gl.quad([u, 0.1, VB], [u, 0.1, VA], [u, 1.0, VA], [u, 1.0, VB], '#cfe6e8');
  P.done();
}

// The door that stands ajar. Its leaf is a mesh of its own, hung on the jamb nearer the gilded doors, and swings out
// over the landing. vd: how far behind the wall's face the opening stands (where the path's own opening is).
function hangDoor(deck, vd) {
  const run = wallRun(0, TOP), dw = 1.2, dh = 2.2, uh = DOOR_U - dw / 2, vl = vd - 0.14, M = deckPaint(11), lac = LACQUER[0], lg = new Geo({ maxSeg: 8 });
  lg.at(run.ox, run.oy, run.oz, run.yaw);
  lg.box(uh + 0.012, 0.03, vl, uh + dw - 0.012, dh - 0.012, vl + 0.045, lac, { skip: 's' });
  for (const [ya, yb] of [[0.3, 0.98], [1.12, dh - 0.24]]) lg.box(uh + 0.18, ya, vl - 0.01, uh + dw - 0.18, yb, vl, shade(lac, 1.35), { skip: 's' });
  lg.cyl(uh + dw - 0.13, 1.02, vl - 0.035, 0.035, 0.035, 0.06, 6, M.trim, { emit: 0.3 });
  // the side that faces the garden takes the garden's light
  lg.quad([uh + 0.012, 0.03, vl + 0.045], [uh + dw - 0.012, 0.03, vl + 0.045], [uh + dw - 0.012, dh - 0.012, vl + 0.045], [uh + 0.012, dh - 0.012, vl + 0.045], '#fff4d4', 2.6);
  lg.pop();
  const mesh = lg.mesh(deck.lit, deck.frame);
  mesh.matrixAutoUpdate = false; deck.group.add(mesh);
  const h = run.pt(uh, 0, vl + 0.02), B = deck.frame.stand(h[0], h[2], { h: h[1] }), Binv = B.clone().invert(), R = new Matrix4();
  return { mesh, swing(a) { mesh.matrix.copy(B).multiply(R.makeRotationY(a)).multiply(Binv); mesh.matrixWorldNeedsUpdate = true; } };
}

// Light that grows with height. Every pair of decks has its own lattice of lamps (the gallery's sixteen and the chain's
// globe in the middle), each pair brighter than the pair below; and five boxes of soft light stacked up the well, each
// beginning ten metres higher than the last, add to one another, so that the light between the lamps rises smoothly.
function lightRise(deck) {
  for (let b = 0; b < 6; b++) deck.lattice({ origin: [-7.75, RISE * 2 * b + ROOM - 0.1, -7.75], spacing: [3.875, 3.875], count: [5, 5], storeys: 2, rise: RISE, color: hex(paint('lamp', 2 * b + 0.5)), power: 0.95 * lev(2 * b + 0.5), reach: 3.6 });
  deck.lattice({ origin: [LAMP[0], 2.2, LAMP[2]], spacing: [1, 1], count: [1, 1], color: '#ffc27a', power: 1.5, reach: 2.6 });               // the cart's own lamp
  deck.lattice({ origin: [-HW + 0.3, TOP + 0.3, GARDEN_US[0]], spacing: [1, 3.5], count: [1, 3], color: '#fff1c8', power: 1.4, reach: 1.5, drop: 0.7, above: 2.6 });   // under the garden doors the flight comes to
  const cols = ['#ffcf96', '#ffd9aa', '#ffe4c0', '#fff0d6', '#fff6e4'], pw = [0.08, 0.11, 0.16, 0.22, 0.32];
  for (let i = 0; i < 5; i++) deck.zone({ min: [-60, 10 * (i + 1), -60], max: [60, 90, 60], soft: 10, color: cols[i], power: pw[i], side: 0.5, under: 0.6 });
  return deck.zone({ min: [0, -90, 0], max: [1, -89, 1], power: 0 });              // what comes out of the door that stands ajar: set as it opens
}

// ---------------------------------------------------------------- the world
export const lovageRise = {
  id: 'lovage-rise',
  title: 'Money lives up', drum: 'Lovage', row: 'Herb Row', kind: 'a steady drum', light: 0.0,
  line: 'In Lovage money lives up. I climbed the twelve decks of Lamplight Rise and every lobby was grander than the one under it, and at the top you can tell who keeps a garden by the light under the door.',
  tone: '#f3c25c', source: 'ashgrove.md (Day three: Lovage), three-nights 15-canon.js (Lovage), daily-life.md (Light), sorrel.md (the Garden Doors)',
  sound: { root: 52, scale: 'major', pad: 0.5, air: 0.15, hum: 0.2, crowd: 0.45, bells: 0.3, bright: 0.8 },
  *build(ctx) {
    const frame = makeFrame(212 * DEG, 640, R0);
    const rng = makeRng('lamplight-rise');
    const path = makePath(flightKeys(), { frame, entryRadius: 1.2, exitRadius: 1.0, align: 1.2 });      // (the keys already look the way they go at both ends)
    const doorV = -HW - path.exit.flat.x;              // the wall's face stands this far in front of the path's opening
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'lamplight', palette: PALETTES.warm, light: { level: 1, ambPower: 0.42, ambUp: '#5b4a38', ambDown: '#3d3024' }, floor: { shine: 1, wear: 0.8 } });
    yield 'rise: path';
    addProtos(deck);
    const state = { lobbies: [], doorV };
    buildFoot(deck, rng);
    yield 'rise: the foot';
    for (let k = 0; k < NK; k++) {
      yield* buildDeck(deck, k, rng, state);
      dress(deck, k, deckPaint(k), rng);
      yield 'rise: things';
    }
    for (let k = 0; k < NK - 1; k++) { drawFlight(deck, k, rng); yield 'rise: flights'; }
    topLanding(deck);
    sofaParty(deck, rng);
    yield 'rise: the sofa';
    drawChain(deck);
    yield 'rise: the chain';
    drawCeiling(deck);
    const spill = lightRise(deck), door = hangDoor(deck, doorV), rig = deck.rig;
    yield 'rise: light';
    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);
    const look = { exposure: 1.75, bloom: 0.24, threshold: 1.0, saturation: 1.06, vignette: 0.5, contrast: 1.05 };
    const down0 = LOOK_IN + 3.0, down1 = LOOK_STILL + 0.2, down2 = LOOK_UP, down3 = LOOK_UP + 3.0;
    const eye = new Vector3(), slides = [];
    // a cab's doors part as its lobby comes to the middle of the picture: half a quarter turn before the eye is abreast of it
    SLIDE.forEach((d, k) => { if (d !== null && state.lobbies[k]) slides.push(k === 0 ? [state.lobbies[k], T0 - 0.5, T0 + 1.0] : k === NK - 1 ? [state.lobbies[k], LOOK_UP + 1.4, LOOK_UP + 3.2] : [state.lobbies[k], timeOf(k - 0.8), timeOf(k - 0.35)]); });
    door.swing(0.35);
    return {
      scene, path, deck, near: 0.1, far: 500, look,
      // (the next world is drawn through the door only from eleven seconds before the crossing: until the view has come up
      // from the well the door is out of the picture, though near enough to its middle for the engine to count it in)
      portal: { shape: 'rect', width: 1.2, height: 2.2, rim: false, mist: '#fff1c8', mistPower: 5, openFor: 11 },
      update(t) {
        // the eye takes up some of the light as it climbs, and not all of it: the top is brighter on the page too
        path.flat(t, eye);
        const h = clamp(eye.y / (TOP + 2), 0, 1);
        // (looking down the well from the top it opens again, as an eye does)
        look.exposure = 1.75 * Math.pow(0.26, h) * (1 + 1.0 * smoothstep(down0, down1, t) * (1 - smoothstep(down2, down3, t)));
        look.bloom = lerp(0.24, 0.17, h);
        look.threshold = lerp(1.0, 2.6, h);
        for (const [lobby, t0, t1] of slides) lobby.slide(smoothstep(t0, t1, t));
        const open = smoothstep(path.tCross - 6.6, path.tCross - 2.6, t);
        door.swing(0.35 + 1.5 * open);
        rig.setZone(spill, { min: [-HW - 0.5, TOP - 0.3, DOOR_U - 1.3], max: [-HW + 1 + 3.5 * open, TOP + 2.7, DOOR_U + 1.3], soft: 0.9, color: '#fff1c8', power: 0.3 + 1.3 * open, side: 0.9, under: 0.6 });
      },
    };
  },
};
