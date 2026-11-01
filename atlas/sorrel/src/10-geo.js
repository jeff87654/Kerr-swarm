/* ---------- the drum: decks, Rings, Hours, strata and blocks ---------- */

const DRUM = {
  R: 3000,                 // rim radius, m (1 g)
  L: 3750,                 // length, m
  W: 2 * Math.PI / 110,    // spin, rad/s (one turn in 110 s)
  G0: 9.81,
  JACKET: 50,              // hydrogen jacket, m
  QUAY: 3052,              // quay track radius, m
  FLOOR: 1500,             // the Hollow's floor
  LINE_ON: 450, LINE_OFF: 3300,   // where the sunline is lit along the axis
  HALL_LEN: 300,           // flying halls reach this far from each end wall
  SPINDLE: 75,             // flying country
  TERR_DEPTH: 350,         // how far the lowest terrace reaches out from an end wall (as in the 3D game)
  TERR_TOP: 120,           // the terraces stop this far from the axis
};
DRUM.RING_W = DRUM.L / 9;
DRUM.BLOCK_Z = DRUM.L / 18;

const LINE_FIRST = [13, 38, 63, 88, 113, 138, 163, 188, 213, 238, 263, 288, 313, 338, 363];
const LINE_SET = new Set();
LINE_FIRST.forEach(n => { LINE_SET.add(n); LINE_SET.add(n + 1); });

const deckR = n => DRUM.R - 4 * (n - 1);
const gAt = r => r / DRUM.R;
const deckAtR = r => Math.floor((DRUM.R - r) / 4) + 1;     // the deck whose space holds radius r
const isLineDeck = n => LINE_SET.has(n);
const lineFirstOf = n => (LINE_SET.has(n) ? (LINE_SET.has(n - 1) && LINE_FIRST.includes(n - 1) ? n - 1 : n) : 0);

function bandOfDeck(n) {
  if (n < 1) return "outside";
  if (n > 376) return "hollow";
  if (isLineDeck(n)) return "line";
  if (n <= 15) return "keel";
  if (n <= 113) return "low";
  if (n <= 301) return "middle";
  if (n <= 375) return "high";
  return "hollow";
}

const BAND_INFO = {
  outside: { name: "Outside the hull", short: "Outside" },
  keel: { name: "The Keel", short: "Keel", decks: "Decks 1–15", g: "~1.00 g", pop: "No homes" },
  line: { name: "Line decks", short: "Line deck" },
  low: { name: "Low decks", short: "Low decks", decks: "Decks 16–113", g: "0.98–0.85 g", pop: "~67 million people" },
  middle: { name: "Middle decks", short: "Middle decks", decks: "Decks 114–301", g: "0.85–0.60 g", pop: "~102 million people" },
  high: { name: "High decks", short: "High decks", decks: "Decks 302–375", g: "0.60–0.50 g", pop: "~30 million people" },
  hollow: { name: "The Hollow", short: "Hollow" },
};

/* Rings: nine slices along the axis, 1 at the front (power) to 9 at the back (heat). */
const ringCenter = i => (2 * i - 1) * DRUM.L / 18;
const ringOfZ = z => clamp(Math.floor(z / DRUM.RING_W) + 1, 1, 9);

/* Hours: twelve 30° wedges counted spinward. θ = 0 is the start of Hour One. */
const TAU = Math.PI * 2;
const HOUR_W = TAU / 12;
const normTheta = t => ((t % TAU) + TAU) % TAU;
const hourOfTheta = t => Math.floor(normTheta(t) / HOUR_W) % 12 + 1;
const hourCenter = h => (h - 0.5) * HOUR_W;
const HOUR_NAMES = ["", "Hare", "Heron", "Owl", "Bee", "Fox", "Otter", "Stag", "Swift", "Badger", "Moth", "Wolf", "Lark"];
const oppositeHour = h => ((h + 5) % 12) + 1;

/* ---- strata: the drum's decks grouped into neighbourhood-deep layers ---- */
const STRATA = [];   // residential
const KEEL_STRATA = [];
const LINE_STRATA = [];
let DOORS = 0;       // residential neighbourhoods in all

(function buildStrata() {
  // residential segments between line decks
  const segs = [];
  let run = null;
  for (let n = 16; n <= 375; n++) {
    if (isLineDeck(n)) { if (run) { segs.push(run); run = null; } continue; }
    if (!run) run = [n, n]; else run[1] = n;
  }
  if (run) segs.push(run);

  function split(a, b) {
    if (a === 65 && b === 87) return [[65, 72], [73, 78], [79, 83], [84, 87]];   // Ashgrove is decks 73–78
    const len = b - a + 1;
    const k = Math.max(1, Math.round(len / 5.75));
    const base = Math.floor(len / k), extra = len % k;
    const out = [];
    let s = a;
    for (let i = 0; i < k; i++) {
      const size = base + (i < extra ? 1 : 0);
      out.push([s, s + size - 1]);
      s += size;
    }
    return out;
  }

  function mk(from, to, kind) {
    const rOut = deckR(from), rIn = deckR(to) - 4;
    const rMid = (rOut + rIn) / 2;
    const N = Math.max(12, Math.round(TAU * rMid / 210));
    return { from, to, kind, band: kind === "res" ? bandOfDeck(Math.round((from + to) / 2)) : kind, rOut, rIn, rMid, N };
  }

  for (const [a, b] of segs) for (const [f, t] of split(a, b)) {
    const s = mk(f, t, "res");
    s.offset = DOORS;
    s.index = STRATA.length;
    DOORS += 18 * s.N;
    STRATA.push(s);
  }
  for (const [f, t] of [[1, 4], [5, 8], [9, 12], [15, 15]]) KEEL_STRATA.push(mk(f, t, "keel"));
  for (const f of LINE_FIRST) LINE_STRATA.push(mk(f, f + 1, "line"));
})();

function stratumOfDeck(n) {
  if (isLineDeck(n)) return LINE_STRATA.find(s => n >= s.from && n <= s.to) || null;
  if (n >= 1 && n <= 15) return KEEL_STRATA.find(s => n >= s.from && n <= s.to) || null;
  for (const s of STRATA) if (n >= s.from && n <= s.to) return s;
  return null;
}

/* The block (a ~210 m square, a few decks deep) holding a point. */
function blockAt(z, r, theta) {
  if (z < 0 || z > DRUM.L || r > DRUM.R || r <= DRUM.FLOOR) return null;
  const n = deckAtR(r);
  const s = stratumOfDeck(n);
  if (!s) return null;
  const a = clamp(Math.floor(z / DRUM.BLOCK_Z), 0, 17);
  const k = Math.floor(normTheta(theta) / TAU * s.N) % s.N;
  return makeBlock(s, a, k);
}

function makeBlock(s, a, k) {
  const thetaMid = (k + 0.5) / s.N * TAU;
  const b = {
    kind: s.kind, stratum: s, a, k,
    z0: a * DRUM.BLOCK_Z, z1: (a + 1) * DRUM.BLOCK_Z, zMid: (a + 0.5) * DRUM.BLOCK_Z,
    rOut: s.rOut, rIn: s.rIn, rMid: s.rMid,
    theta: thetaMid, hour: hourOfTheta(thetaMid), ring: ringOfZ((a + 0.5) * DRUM.BLOCK_Z),
    from: s.from, to: s.to, band: s.band,
  };
  if (s.kind === "res") b.door = s.offset + a * s.N + k + 1;
  b.key = s.kind + ":" + s.from + ":" + a + ":" + k;
  b.seed = hash32(s.kind, s.from, a, k);
  return b;
}

function blockFromDoor(door) {
  const d = door - 1;
  for (const s of STRATA) {
    if (d >= s.offset && d < s.offset + 18 * s.N) {
      const i = d - s.offset;
      return makeBlock(s, Math.floor(i / s.N), i % s.N);
    }
  }
  return null;
}

function blockFromKey(key) {
  const m = /^(res|keel|line):(\d+):(\d+):(\d+)$/.exec(key || "");
  if (!m) return null;
  const s = stratumOfDeck(+m[2]);
  if (!s || s.kind !== m[1]) return null;
  const a = +m[3], k = +m[4];
  if (a > 17 || k >= s.N) return null;
  return makeBlock(s, a, k);
}

/* ---- the Hollow ---- */
const DIM_END = 700;   // the floor dims toward each end wall over its last ~700 m
function floorAreaAt(hour, z) {
  if (z < DIM_END || z > DRUM.L - DIM_END) return "dim";
  return floorArea(hour, ringOfZ(z));
}
function floorArea(hour, ring) {
  if (ring === 1 || ring === 9) return "dim";
  if (hour >= 5 && hour <= 7 && ring >= 4 && ring <= 6) return "lake";
  if (hour >= 2 && hour <= 4 && ring >= 3 && ring <= 7) return "orchards";
  if (hour >= 8 && hour <= 10 && ring >= 2 && ring <= 8) return "lawns";
  if ((hour >= 11 || hour === 1) && ring >= 3 && ring <= 7) return "grounds";
  return "gardens";
}
const AREA_NAMES = { lake: "the lake", orchards: "the orchards", lawns: "the lawns", grounds: "the grounds", dim: "a Dim End", gardens: "the floor gardens" };

/* How far the terraced end wall reaches into the Hollow at radius r (0 above the top terrace). */
function terraceDepth(r) {
  if (r >= DRUM.FLOOR) return DRUM.TERR_DEPTH;
  if (r <= DRUM.TERR_TOP) return 0;
  const tiers = 30;
  const t = (r - DRUM.TERR_TOP) / (DRUM.FLOOR - DRUM.TERR_TOP);    // 0 at top, 1 at floor
  const stepT = Math.ceil(t * tiers) / tiers;
  return DRUM.TERR_DEPTH * stepT;
}

/* Light from the sunline (raft-habitat.md's Method): a diffuse line lit from z = 450 to 3,300 m.
   On a surface facing the axis at radius ρ and axial position z, light ∝ ρ² ∫ dz′ ÷ (ρ² + (z′ − z)²)²,
   scaled so that mid-floor gets 0.33 kW/m² at full sun. */
function lineF(rho, z) {
  rho = Math.max(rho, 20);
  const f = u => u / (2 * (rho * rho + u * u)) + Math.atan(u / rho) / (2 * rho);
  return f(DRUM.LINE_OFF - z) - f(DRUM.LINE_ON - z);
}
const LINE_F_MID = lineF(DRUM.FLOOR, DRUM.L / 2);

/* ---- a little physics for the cards ---- */
const PHYS = {
  weightKg: r => 70 * gAt(r),
  walk: r => 1.4 * Math.sqrt(Math.max(gAt(r), 0.05)),          // m/s, fixed Froude number
  jump: r => 0.5 / Math.max(gAt(r), 0.01),                      // m, for a jump that clears 0.5 m on Earth
  deckSpeed: r => DRUM.W * r,
  cupCm: r => Math.pow(2, 1.5) / (3 * Math.sqrt(r)) * 100,      // a cup dropped 1 m lands this far anti
  runFactor: (r, u, dir) => Math.pow(1 + dir * u / (DRUM.W * r), 2),
  sunAt: (rho, z = DRUM.L / 2) => 0.33 * lineF(rho, clamp(z, 0, DRUM.L)) / LINE_F_MID,   // kW/m² at full sun, facing the axis
};
const fmtSun = kw => kw >= 1 ? kw.toFixed(1) + " kW/m²" : Math.round(kw * 1000) + " W/m²";

/* Sorrel's sunline, as a fraction of full brightness at a lamp-clock minute. */
function sunLevel(min) {
  const h = min / 60;
  if (h < 6 || h >= 18) return 0;
  if (h < 9) return (h - 6) / 3;
  if (h < 15) return 1;
  return (18 - h) / 3;
}
function spindleOpen(min) { return sunLevel(min) < 0.14; }

function ringWord(i) { return WORDS[i] || String(i); }
function hourLabel(h) { return HOUR_NAMES[h] + " (" + WORDS[h] + ")"; }
function addrLine(deckText, ring, hour) {
  const bits = [];
  if (deckText) bits.push(deckText);
  if (ring) bits.push("Ring " + ringWord(ring));
  if (hour) bits.push(HOUR_NAMES[hour]);
  return bits.join(" · ");
}
