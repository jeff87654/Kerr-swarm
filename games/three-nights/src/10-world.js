/* ---------- The world: Merrow's grid, its rows and its drums ---------- */
"use strict";

// Merrow: ~3e11 nation drums at 24.5 km, about 547,723 a side (13.42 M km).
const WORLD = {
  N: 547723,
  PITCH_KM: 24.5,
  QUAY_MS: 174.4,      // quay speed, m/s
  HOP_S: 140,          // glide hop, s
  C_KMS: 299792.458,
  PLACES: 200000000,   // places per nation drum (the raft standard)
  LIFE: 120,           // years
};

// Canon rows, placed so wander-year.md's legs and light delays come out right
// (tools/solve_rows.py). Grid coordinates of each row's anchor drum.
const CANON_ROW_ANCHORS = /*ROW_ANCHORS*/ {
  Herb: [65306, 253061], Hedge: [150943, 189253], Gull: [250600, 115000], Weather: [313000, 16343],
  Bell: [416249, 63412], Kelp: [507437, 161433], Pigment: [469437, 279980], Thimble: [362678, 305629],
  Grain: [310665, 406935], Cooper: [235996, 360106], Kite: [164437, 315229], Quill: [92498, 318886],
} /*END_ROW_ANCHORS*/;

const CANON_THEME_IDS = {
  Herb: "herb", Hedge: "hedge", Gull: "gull", Weather: "weather", Bell: "bell", Kelp: "kelp",
  Pigment: "pigment", Thimble: "thimble", Grain: "grain", Cooper: "cooper", Kite: "kite", Quill: "quill",
};

// Canon drums: [row, dx, dy, name] relative to the row's anchor.
// Herb Row is three grid rows deep: Rue one row "below" Sorrel, Chervil one "above".
const CANON_DRUM_PLACES = [
  ["Herb", 0, 0, "Sorrel"], ["Herb", -1, 0, "Tansy"], ["Herb", 1, 0, "Lovage"],
  ["Herb", 3, 0, "Yarrow"], ["Herb", 5, 0, "Borage"], ["Herb", 0, 1, "Chervil"], ["Herb", 0, -1, "Rue"],
  ["Hedge", 0, 0, "Sloe"], ["Gull", 0, 0, "Kittiwake"],
  ["Weather", 0, 0, "Gloaming"], ["Weather", 1, 0, "Squall"],
  ["Bell", 0, 0, "Carillon"], ["Kelp", 0, 0, "Dulse"],
  ["Pigment", 0, 0, "Madder"], ["Pigment", 1, 0, "Ochre"], ["Grain", 0, 0, "Spelt"],
];

// Canon blocks (rectangles) around each anchor: [dx0, dx1, dy0, dy1]
const CANON_BLOCK_SHAPES = {
  Herb: [-9, 11, -1, 1], Hedge: [-12, 13, 0, 1], Gull: [-12, 13, -1, 0], Weather: [-12, 13, 0, 1],
  Bell: [-12, 13, 0, 1], Kelp: [-12, 13, 0, 1], Pigment: [-12, 13, -1, 0], Thimble: [-14, 15, 0, 0],
  Grain: [-12, 13, 0, 1], Cooper: [-12, 13, 0, 1], Kite: [-12, 13, -1, 0], Quill: [-12, 13, 0, 1],
};

let CANON_BLOCKS = null;   // built at init
let CANON_BY_KEY = null;   // "x,y" -> canon drum name
let THEME_BY_ID = null;
let RANDOM_THEMES = null;  // themes eligible for procedural rows (not the 12 canon rows)

// Words that belong to the world itself, not to any one drum
const RESERVED_NAMES = new Set(["Lantern", "Spindle", "Hollow", "Keel", "Glide", "Ledger", "Margin", "Shade", "Merrow", "Selkie", "Atari", "Tilley", "Ashgrove"]);

function initWorld() {
  for (const t of CONTENT.themes.themes) t.names = t.names.filter((n) => !RESERVED_NAMES.has(n));
  THEME_BY_ID = {};
  for (const t of CONTENT.themes.themes) THEME_BY_ID[t.id] = t;
  const canonIds = new Set(Object.values(CANON_THEME_IDS));
  RANDOM_THEMES = CONTENT.themes.themes.filter((t) => !canonIds.has(t.id));
  // Ashgrove and its streets belong to Sorrel
  CONTENT.themes.neighbourhoods = CONTENT.themes.neighbourhoods.filter((n) => n !== "Ashgrove" && !/\bHall$/i.test(n));
  CONTENT.themes.streets = CONTENT.themes.streets.filter((n) => n !== "Pear Street" && n !== "the Long Arcade");
  CANON_BLOCKS = [];
  const byRow = {};
  for (const t of CONTENT.themes.themes) byRow[(t.row || "").toLowerCase()] = t;
  for (const row of Object.keys(CANON_ROW_ANCHORS)) {
    const [ax, ay] = CANON_ROW_ANCHORS[row];
    const [dx0, dx1, dy0, dy1] = CANON_BLOCK_SHAPES[row];
    let theme = THEME_BY_ID[CANON_THEME_IDS[row]] || byRow[(row + " row").toLowerCase()];
    if (!theme) {
      const names = CANON_DRUM_PLACES.filter((c) => c[0] === row).map((c) => c[3]);
      const filler = RANDOM_THEMES.length ? RANDOM_THEMES[hash32("fallback", row) % RANDOM_THEMES.length].names : ["Lantern"];
      theme = { id: CANON_THEME_IDS[row], row: row + " Row", about: "", names: names.concat(filler) };
    }
    CANON_BLOCKS.push({
      canonRow: row, x0: ax + dx0, x1: ax + dx1, y0: ay + dy0, y1: ay + dy1,
      id: "canon:" + row, theme, hash: hash32("canonblock", row),
    });
  }
  CANON_BY_KEY = {};
  for (const [row, dx, dy, name] of CANON_DRUM_PLACES) {
    const [ax, ay] = CANON_ROW_ANCHORS[row];
    CANON_BY_KEY[(ax + dx) + "," + (ay + dy)] = name;
  }
}

function inRaft(x, y) { return x >= 0 && y >= 0 && x < WORLD.N && y < WORLD.N; }

/* --- Rows: the grid is tiled with founded stretches, 1-3 grid rows deep and 12-36 drums long --- */
const BAND_PATTERNS = [
  [3, 3], [2, 2, 2], [1, 2, 3], [3, 2, 1], [2, 1, 3], [3, 1, 2], [1, 3, 2], [2, 3, 1],
  [1, 1, 2, 2], [2, 2, 1, 1], [1, 2, 1, 2], [2, 1, 2, 1], [3, 1, 1, 1], [1, 1, 1, 3], [2, 2, 2],
];

function subBandOf(y) {
  const b = Math.floor(y / 6);
  const pat = BAND_PATTERNS[hash32("band", b) % BAND_PATTERNS.length];
  let off = y - b * 6, start = b * 6, s = 0;
  for (; s < pat.length; s++) {
    if (off < pat[s]) break;
    off -= pat[s]; start += pat[s];
  }
  return { b, s, y0: start, y1: start + pat[s] - 1 };
}

const segCache = makeCache(4096);
function segmentsOf(b, s, c) {
  const key = b + ":" + s + ":" + c;
  let segs = segCache.get(key);
  if (segs) return segs;
  const r = makeRng(hash32("cell", b, s, c));
  const k = r.weighted([[2, 3], [3, 4], [4, 2]]);
  segs = null;
  for (let tries = 0; tries < 24 && !segs; tries++) {
    const cuts = [];
    for (let i = 0; i < k - 1; i++) cuts.push(r.int(12, 48));
    cuts.sort((p, q) => p - q);
    const bounds = [0].concat(cuts, [60]);
    let ok = true;
    for (let i = 0; i < k; i++) { const L = bounds[i + 1] - bounds[i]; if (L < 12 || L > 36) { ok = false; break; } }
    if (ok) segs = bounds;
  }
  if (!segs) segs = [0, 20, 40, 60];
  return segCache.set(key, segs);
}

const blockCache = makeCache(4096);
function blockAt(x, y) {
  for (const cb of CANON_BLOCKS) {
    if (x >= cb.x0 && x <= cb.x1 && y >= cb.y0 && y <= cb.y1) return cb;
  }
  const sb = subBandOf(y);
  const off = hash32("off", sb.b, sb.s) % 60;
  const xx = x + off;
  const c = Math.floor(xx / 60);
  const segs = segmentsOf(sb.b, sb.s, c);
  const local = xx - c * 60;
  let i = 0;
  while (i < segs.length - 2 && local >= segs[i + 1]) i++;
  const id = sb.b + ":" + sb.s + ":" + c + ":" + i;
  let blk = blockCache.get(id);
  if (blk) return blk;
  const h = hash32("block", sb.b, sb.s, c, i);
  const theme = RANDOM_THEMES[h % RANDOM_THEMES.length];
  blk = {
    id, x0: c * 60 + segs[i] - off, x1: c * 60 + segs[i + 1] - 1 - off,
    y0: sb.y0, y1: sb.y1, theme, hash: h, canonRow: null,
  };
  return blockCache.set(id, blk);
}

const NAME_PREFIXES = ["New", "Little", "Second", "Far", "Young", "Lesser"];
const blockNamesCache = makeCache(2048);
function blockNames(blk) {
  let names = blockNamesCache.get(blk.id);
  if (names) return names;
  const reserved = new Set(Object.values(CANON_BY_KEY));
  const pool = blk.theme.names.filter((n) => !reserved.has(n));
  names = makeRng(blk.hash ^ 0x5bd1e995).shuffle(pool);
  return blockNamesCache.set(blk.id, names);
}

function drumNameAt(x, y) {
  const key = x + "," + y;
  if (CANON_BY_KEY[key]) return CANON_BY_KEY[key];
  const blk = blockAt(x, y);
  const names = blockNames(blk);
  const w = blk.x1 - blk.x0 + 1;
  const p = (y - blk.y0) * w + (x - blk.x0);
  const base = names[p % names.length];
  const cyc = Math.floor(p / names.length);
  return cyc ? NAME_PREFIXES[(cyc - 1) % NAME_PREFIXES.length] + " " + base : base;
}

/* --- Drum kinds --- */
const KIND_LABEL = {
  hall: "hall drum", wood: "wood drum", fair: "fair drum", maker: "maker drum",
  steady: "steady drum", thin: "thin drum", counted: "counted drum",
};
const KIND_BLURB = {
  hall: "An open drum that spends its choices on people's time: cooked halls, music, teaching.",
  wood: "An open drum of dim woods and long silences, where people carry slates.",
  fair: "An open drum of light and spectacle, with the rents returned to everyone.",
  maker: "An open drum of craft schools, famous for one thing people glide in to buy.",
  steady: "A decent drum, near par, with no Margin to speak of.",
  thin: "A crowded drum of overspent holdings, cheerful about it, mostly.",
  counted: "A drum that licenses its births and posts the Count at every platform.",
};

function kindOf(x, y, blk) {
  const r = makeRng(hash32("kind", x, y));
  const lean = makeRng(blk.hash ^ 0x2545f491);
  const leanKind = lean.weighted([["hall", 2], ["wood", 1], ["fair", 1], ["maker", 2], ["steady", 6], ["thin", 2]]);
  if (r.chance(0.28)) return leanKind;
  return r.weighted([["hall", 7], ["wood", 5], ["fair", 5], ["maker", 8], ["steady", 59], ["thin", 14], ["counted", 2]]);
}

function kindsList(sub) {
  if (sub === "hall" || sub === "wood" || sub === "fair" || sub === "maker") return ["any", "open", sub];
  return ["any", sub];
}
function isOpen(sub) { return sub === "hall" || sub === "wood" || sub === "fair" || sub === "maker"; }

/* --- Positions and light --- */
function lightSeconds(x1, y1, x2, y2) {
  const dkm = Math.hypot(x1 - x2, y1 - y2) * WORLD.PITCH_KM;
  return dkm / WORLD.C_KMS;
}
function distKm(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2) * WORLD.PITCH_KM; }
function fmtDist(km) {
  if (km < 1000) return Math.round(km) + " km";
  if (km < 1e6) return (km / 1000).toFixed(km < 1e4 ? 1 : 0).replace(/\.0$/, "") + " thousand km";
  return (km / 1e6).toFixed(2) + " million km";
}
function addressOf(x, y) { return fmtInt(x) + " · " + fmtInt(y); }

// Direction labels on the grid: along the row (x) and across the rows (y)
const DIRS = [
  { id: "spin", dx: 1, dy: 0, label: "along the row", arrow: "→" },
  { id: "anti", dx: -1, dy: 0, label: "along the row", arrow: "←" },
  { id: "up", dx: 0, dy: 1, label: "across the rows", arrow: "↑" },
  { id: "down", dx: 0, dy: -1, label: "across the rows", arrow: "↓" },
];
