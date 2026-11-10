/* ---------- The drum: Sorrel's numbers and the physics every game shares ----------
   Sorrel is raft-habitat.md's nation drum: 3 km in radius, 3.75 km long, one turn every 110 s.
   Out is down. Deck n sits at r = 3,000 - 4(n - 1) m and weighs r / 3,000 of rim weight.
   Coriolis in the frame of the floor (x spinward, y up, toward the axis):
       ax = +2 W vy      rising things are pushed spinward, falling things antispinward
       ay = -g - 2 W vx  spinward things are heavier, antispinward things lighter
   "Axis flies true, spin sinks, anti floats." */
"use strict";

const DRUM = {
  R: 3000,            // rim radius, m
  L: 3750,            // length, m
  T: 110,             // seconds a turn
  W: TAU / 110,       // rad/s
  G0: 9.81,           // rim weight, m/s2 (1 g)
  HOLLOW_R: 1500,     // the Hollow's floor
  SPINDLE_R: 75,      // flying country: within 75 m of the axis
  DECKS: 376,         // deck 376 is the Hollow's floor
  ARCADE_DECK: 201,   // the Round Arcade
};

const deckR = (n) => DRUM.R - 4 * (n - 1);                 // radius of deck n, m
const deckAtR = (r) => Math.round((DRUM.R - r) / 4) + 1;
const gFrac = (r) => r / DRUM.R;                           // weight as a fraction of rim weight
const gAt = (r) => DRUM.G0 * r / DRUM.R;                   // local weight, m/s2
const gDeck = (n) => gAt(deckR(n));
const deckSpeed = (r) => DRUM.W * r;                       // how fast the floor itself moves, m/s

function bandOfDeck(n) {
  if (n <= 15) return "the Keel";
  if (n <= 113) return "the Low decks";
  if (n <= 301) return "the Middle decks";
  if (n <= 375) return "the High decks";
  return "the Hollow";
}

// Weight factor for someone moving along the floor at u m/s (u > 0 spinward) at radius r.
const runWeight = (u, r) => { const k = 1 + u / (DRUM.W * r); return k * k; };

// How far antispinward a thing dropped from h metres lands, at radius r (metres).
const dropDrift = (h, r) => Math.pow(2 * h, 1.5) / (3 * Math.sqrt(r));

// How far spinward a thing thrown straight up at v m/s lands, where weight is g m/s2 (metres).
const leapDrift = (v, g) => (4 / 3) * DRUM.W * v * v * v / (g * g);

// One step of a thrown or falling thing in the floor's frame.
// p = {x, y, vx, vy}: x metres spinward, y metres up. g = local weight in m/s2 (use gAt(r)).
// Good to a few percent for throws of tens of metres; that is all a game needs.
function spinStep(p, dt, g) {
  const ax = 2 * DRUM.W * p.vy;
  const ay = -g - 2 * DRUM.W * p.vx;
  p.vx += ax * dt;
  p.vy += ay * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
}

// Near the axis, in the cross-section of the drum (x, y metres from the axis, turning frame):
// the spin throws you outward and bends every sideways move.
//   ax = W^2 x + 2 W vy,  ay = W^2 y - 2 W vx
function axisStep(p, dt, fx, fy) {
  const W = DRUM.W;
  const ax = (fx || 0) + W * W * p.x + 2 * W * p.vy;
  const ay = (fy || 0) + W * W * p.y - 2 * W * p.vx;
  p.vx += ax * dt;
  p.vy += ay * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
}

// Sorrel's sunline: 0 at lamp-night, 1 at full sun. mins = minutes since midnight.
// Dawn ramps 06:00-09:00, full 09:00-15:00, dusk 15:00-18:00.
function sunLevel(mins) {
  const h = (((mins / 60) % 24) + 24) % 24;
  if (h < 6 || h >= 18) return 0;
  if (h < 9) return (h - 6) / 3;
  if (h < 15) return 1;
  return (18 - h) / 3;
}
function lampWord(mins) {
  const h = (((mins / 60) % 24) + 24) % 24;
  if (h < 6) return "lamp-night";
  if (h < 9) return "lamp-dawn";
  if (h < 15) return "full sun";
  if (h < 18) return "dusk";
  return "lamp-night";
}

const HOUR_NAMES = ["", "Hare", "Heron", "Owl", "Bee", "Fox", "Otter", "Stag", "Swift", "Badger", "Moth", "Wolf", "Lark"];
const HOUR_IDS = HOUR_NAMES.map((n) => n.toLowerCase());
const oppositeHour = (n) => ((n + 5) % 12) + 1;
// centre of Hour n's wedge on the clock face, radians clockwise from the top (Hour One runs from 12 to 1)
const hourAngle = (n) => (n - 0.5) * TAU / 12;
