/* ---------- content: landmarks, and a card behind every door ---------- */

const D = (typeof ATLAS_DATA !== "undefined" ? ATLAS_DATA : {}) || {};
const HOURS = (D.hours && D.hours.length === 12) ? D.hours : HOUR_NAMES.slice(1).map((name, i) => ({ n: i + 1, name, opposite: HOUR_NAMES[oppositeHour(i + 1)], hex: "#888", character: "", known: "", word: null, dish: null, club: "", saying: "", rivalry: "" }));
const RINGS = (D.rings && D.rings.length === 9) ? D.rings : [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({ n, name: "Ring " + WORDS[n], nick: "", lanes: [1, 3, 7, 9].includes(n) ? "Lovage and Tansy" : n === 5 ? "the tubes and cyclers" : "Chervil and Rue", character: "", quaysides: "", known: "" }));
const NAMES = Object.assign({ first: ["Ash", "Larch", "Hazel"], second: ["grove", "mere", "by"], whole: ["the Saltings", "Netherby"], given: ["Anna"], family: ["Vale"] }, D.names || {});

const KINDS = {
  home: "Neighbourhoods & streets",
  civic: "Public business",
  eat: "Food & drink",
  water: "Baths & water",
  green: "Gardens, woods & light",
  work: "Works & crews",
  make: "Makers & markets",
  culture: "Learning & arts",
  play: "Sport & flight",
  rites: "Rites & quiet places",
};
const KIND_SHORT = { home: "Streets", civic: "Civic", eat: "Food", water: "Water", green: "Green", work: "Works", make: "Makers", culture: "Culture", play: "Sport", rites: "Rites" };

/* ---- pools, split by band once ---- */
function poolFor(list, band) {
  const all = Array.isArray(list) ? list.filter(x => x && (x.text || x.line)) : [];
  const own = all.filter(x => !x.bands || x.bands.includes(band));
  return own.length ? own : all;
}
const POOLS = {};
for (const band of ["low", "middle", "high"]) {
  const A = D.genA || {}, B = D.genB || {}, C = D.life || {};
  POOLS[band] = {
    types: poolFor(A.types, band), middles: poolFor(A.middles, band), halls: poolFor(A.halls, band),
    trades: poolFor(B.trades, band), sounds: poolFor(B.sounds, band), smells: poolFor(B.smells, band), rare: poolFor(B.rare, band),
    customs: poolFor(C.customs, band), arguments: poolFor(C.arguments, band), residents: poolFor(C.residents, band), histories: poolFor(C.histories, band),
  };
}

/* ---- landmarks ---- */
const PLACES = (D.places || []).filter(p => p && p.id && p.name && p.zone);
const PLACE_BY_ID = new Map();
const CLAIMS = new Map();   // block key -> landmark (a neighbourhood that owns its block)

function beyondSpot(p, j) {
  const s = (p.id + " " + p.name + " " + (p.tags || []).join(" ")).toLowerCase();
  if (/window|gallery|shutter|red room|waiting/.test(s)) return { z: 3905 + j() * 70, r: 500 + j() * 900 };
  if (/still|dock/.test(s)) return { z: 3835 + j() * 40, r: 20 + j() * 120 };
  if (/despun|track/.test(s)) return { z: 3790 + j() * 30, r: 60 + j() * 250 };
  if (/radiator|back crew|sled|panel|crew/.test(s)) return { z: 3815 + j() * 50, r: 1200 + j() * 1700 };
  if (/rectenna|beam|diode/.test(s)) return { z: -200 + j() * 110, r: 300 + j() * 2600 };
  if (/glide|catch|train|quay light/.test(s)) return { z: 400 + j() * 2900, r: 3190 + j() * 110 };
  if (/yard|data|vault|world/.test(s)) return { z: 300 + j() * 3100, r: 3250 + j() * 110 };
  return { z: 600 + j() * 2500, r: 3200 + j() * 150 };
}

function landmarkSpot(p) {
  const j = rng(hash32("pin", p.id));
  const ring = p.ring >= 1 && p.ring <= 9 ? p.ring : null;
  const hour = p.hour >= 1 && p.hour <= 12 ? p.hour : null;
  let z = ring ? ringCenter(ring) + (j() - 0.5) * 300 : DRUM.L * (0.15 + 0.7 * j());
  let theta = hour ? hourCenter(hour) + (j() - 0.5) * HOUR_W * 0.8 : j() * TAU;
  let r = DRUM.R, deck = null;
  const front = p.wall ? p.wall === "front" : (ring ? ring <= 5 : j() < 0.5);
  switch (p.zone) {
    case "keel": case "line": case "deck": {
      const d0 = clamp(p.deck || 200, 1, 375), d1 = clamp(p.deckTo || d0, d0, 375);
      deck = d0;
      r = (deckR(d0) + deckR(d1) - 4) / 2;
      break;
    }
    case "hollow":
      r = p.r && p.r < DRUM.FLOOR - 20 ? p.r : DRUM.FLOOR - 16;
      break;
    case "wall": {
      r = clamp(p.r || 900, DRUM.TERR_TOP + 5, DRUM.FLOOR - 10);
      const d = terraceDepth(r);
      z = front ? d - 10 : DRUM.L - d + 10;
      break;
    }
    case "spindle": {
      r = clamp(p.r == null ? 20 + j() * 45 : p.r, 0, 74);
      if (ring && ring > 1 && ring < 9) break;                 // out along the axis, by its Ring
      if (ring === 1 || (!ring && p.wall === "front")) z = 40 + j() * 230;
      else z = DRUM.L - 40 - j() * 230;
      break;
    }
    case "axle":
      r = 8 + j() * 20;
      z = front ? -22 : DRUM.L + 22;
      break;
    case "outside":
      r = clamp(p.r || 3058, 3002, 3068);
      break;
    case "beyond": {
      const b = beyondSpot(p, j);
      z = b.z; r = b.r;
      break;
    }
  }
  return { zone: p.zone, z, r, theta: normTheta(theta), deck, ring: ring || ringOfZ(clamp(z, 0, DRUM.L)), hour: hour || hourOfTheta(theta), wall: p.zone === "wall" || p.zone === "axle" || (p.zone === "spindle" && !(ring > 1 && ring < 9)) ? (front ? "front" : "back") : null };
}

for (const p of PLACES) {
  p.spot = landmarkSpot(p);
  PLACE_BY_ID.set(p.id, p);
  if (p.zone === "deck" && p.kind === "home" && p.deckTo && p.deckTo - p.deck >= 3) {
    for (let n = p.deck; n <= p.deckTo; n++) {
      const s = stratumOfDeck(n);
      if (!s || s.kind !== "res") continue;
      const b = blockAt(p.spot.z, deckR(n) - 2, p.spot.theta);
      if (b && !CLAIMS.has(b.key)) CLAIMS.set(b.key, p);
    }
  }
}

/* The order of the Climb: from outside in. */
const ZONE_ORDER = ["outside", "keel", "line", "deck", "hollow", "wall", "spindle", "axle", "beyond"];
function climbGroup(p) {
  if (p.zone === "deck") return bandOfDeck(p.deck || 200);
  return p.zone;
}
const GROUPS = [
  { id: "outside", name: "Outside the hull", facts: "The quay, the moat and the hydrogen jacket. r 3,000–3,060 m.", swatch: "--m-jacket" },
  { id: "keel", name: "The Keel", facts: "Decks 1–15 · ~1.00 g · no homes. The food plant, water, reserves and the nine station rings.", swatch: "--m-keel" },
  { id: "line", name: "Line decks", facts: "Fifteen, one in every 25 decks · nobody lives here. Cab depots, workshops, freight and the helium tubes.", swatch: "--m-line" },
  { id: "low", name: "Low decks", facts: "Decks 16–113 · 0.98–0.85 g · ~67 million people. Families, schools, sport, inns for visitors.", swatch: "--m-low" },
  { id: "middle", name: "Middle decks", facts: "Decks 114–301 · 0.85–0.60 g · ~102 million people. Most homes and work.", swatch: "--m-mid" },
  { id: "high", name: "High decks", facts: "Decks 302–375 · 0.60–0.50 g · ~30 million people. In Sorrel, the elders' country, by allotment.", swatch: "--m-high" },
  { id: "hollow", name: "The Hollow", facts: "The floor at 0.50 g, 35 km², 9.4 km round; the far bank 3 km overhead.", swatch: "--m-air-noon" },
  { id: "wall", name: "The end walls", facts: "Terraces climbing from half a g toward the axis; the only windows in Sorrel.", swatch: "--m-wall" },
  { id: "spindle", name: "The Spindle", facts: "Within 75 m of the axis · under 0.03 g · flying country.", swatch: "--m-air-dawn" },
  { id: "axle", name: "The axles", facts: "Power in at the front, heat out at the back.", swatch: "--m-layer" },
  { id: "beyond", name: "Beyond the drum", facts: "The mid-raft, the radiators and the Windows: places most Sorrelers see once.", swatch: "--m-midraft" },
];

function sortKey(p) {
  const s = p.spot;
  const gi = GROUPS.findIndex(g => g.id === climbGroup(p));
  // outside in: big r first; along the axis within a band
  return [gi, p.zone === "deck" || p.zone === "keel" || p.zone === "line" ? (p.deck || 0) : -s.r, s.z];
}
const CLIMB = PLACES.slice().sort((a, b) => {
  const ka = sortKey(a), kb = sortKey(b);
  for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
  return 0;
});

/* ---- names ---- */
function theName(n, atStart) {
  if (!n) return n;
  if (/^the /.test(n)) return (atStart ? "The " : "the ") + n.slice(4);
  return n;
}
/* Names the landmarks own, which the generator leaves alone, plus the game's names for Ashgrove's neighbours. */
const RESERVED = new Set(PLACES.filter(p => p.kind === "home").map(p => p.name.toLowerCase().replace(/^the /, ""))
  .concat(["ashgrove", "larchmere", "netherby", "saltings", "fernside", "pear street"]));
const NAMED_BLOCKS = new Map();   // block key -> a fixed name
(function nameAshgroveNeighbours() {
  const ash = PLACES.find(p => p.id === "ashgrove");
  if (!ash) return;
  const home = STRATA.find(s => s.from === 73);
  if (!home) return;
  const b = blockAt(ash.spot.z, home.rMid, ash.spot.theta);
  const near = (di, name) => {
    const t = STRATA[home.index + di];
    if (t) NAMED_BLOCKS.set(makeBlock(t, b.a, Math.floor((b.k + 0.5) / home.N * t.N) % t.N).key, name);
  };
  near(1, "Larchmere"); near(2, "Netherby"); near(-1, "the Saltings");
})();
function joinName(a, b) {
  if (/^\s/.test(b)) return a + b;
  return a.slice(-1).toLowerCase() === b.charAt(0).toLowerCase() ? a + b.slice(1) : a + b;
}
function nbName(b) {
  const c = CLAIMS.get(b.key);
  if (c) return c.name;
  const fixed = NAMED_BLOCKS.get(b.key);
  if (fixed) return fixed;
  const r = rng(b.seed ^ 0x51ed270b);
  for (let i = 0; i < 6; i++) {
    const n = r() < 0.24 && NAMES.whole.length ? pick(r, NAMES.whole) : joinName(pick(r, NAMES.first), pick(r, NAMES.second));
    if (!RESERVED.has(n.toLowerCase().replace(/^the /, ""))) return n;
  }
  return joinName(pick(r, NAMES.first), pick(r, NAMES.second));
}
function personName(r) { return pick(r, NAMES.given) + " " + pick(r, NAMES.family); }

function yearsAgo(r) {
  const y = Math.exp(lerp(Math.log(9), Math.log(6000), r() * r()));
  const v = y < 60 ? Math.round(y) : y < 300 ? Math.round(y / 5) * 5 : y < 2000 ? Math.round(y / 10) * 10 : Math.round(y / 50) * 50;
  return v === 74 ? 73 : v;   // 74 years ago is the Eleven Days
}

function fill(text, ctx) {
  return String(text || "").replace(/\{(name|hour|ring|years)\}/g, (m, k, off, all) => {
    if (k === "name") {
      const atStart = off === 0 || /[.!?]\s*$/.test(all.slice(0, off));
      return theName(ctx.name, atStart);
    }
    if (k === "hour") return HOUR_NAMES[ctx.hour];
    if (k === "ring") return WORDS[ctx.ring];
    if (k === "years") {
      const atStart = off === 0 || /[.!?]\s*$/.test(all.slice(0, off));
      if (atStart && ctx.years < 100) return cap(numberWords(ctx.years));
      return ctx.years < 10 ? numberWords(ctx.years) : fmtInt(ctx.years);
    }
    return m;
  });
}

/* ---- cards ---- */
/* Six gauges (or three): the physics of standing here. */
function gaugesFor(spot, extra) {
  const r = spot.r, g = gAt(r);
  const out = [
    { k: "Weight", v: fmtG(g) },
    { k: "A 70 kg person", v: Math.round(PHYS.weightKg(r)) + " kg" },
    { k: "A 50 cm jump", v: PHYS.jump(r) < 10 ? PHYS.jump(r).toFixed(PHYS.jump(r) < 1 ? 2 : 1) + " m" : Math.round(PHYS.jump(r)) + " m" },
  ];
  const more = [];
  if (r > 300) more.push({ k: "A cup dropped 1 m", v: PHYS.cupCm(r).toFixed(1) + " cm anti" });
  more.push(...(extra || []));
  more.push({ k: "Walking pace", v: PHYS.walk(r).toFixed(2) + " m/s" });
  more.push({ k: "Speed round the axis", v: Math.round(PHYS.deckSpeed(r)) + " m/s" });
  more.push({ k: "From the axis", v: fmtInt(r) + " m" });
  return out.concat(more.slice(0, 3));
}

function hourLine(h, r) {
  const H = HOURS[h - 1] || {};
  const opts = [];
  if (H.word && H.word.w) opts.push(`In ${H.name}, “${H.word.w}” means ${H.word.means.replace(/\.$/, "")}.`);
  if (H.dish && H.dish.name) opts.push(`${H.name}'s dish is ${H.dish.name.replace(/^the /i, "the ")}. ${H.dish.text || ""}`.trim());
  if (H.saying) opts.push(`They say in ${H.name}: “${H.saying.replace(/\.$/, "")}.”`);
  if (H.rivalry) opts.push(H.rivalry);
  return opts.length ? pick(r, opts) : "";
}

function ringLine(i) {
  const R = RINGS[i - 1] || {};
  if (R.quaysides && /^Station Ring/.test(R.quaysides)) return R.quaysides;
  const lanes = R.lanes ? `trains to ${R.lanes}` : "";
  return [`Station Ring ${WORDS[i]}${lanes ? ": " + lanes : ""}.`, R.quaysides || ""].filter(Boolean).join(" ");
}

const SMALL = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function numberWords(n) {
  if (n < 20) return SMALL[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + SMALL[n % 10] : "");
  return fmtInt(n);
}

function doorCard(b) {
  const claim = CLAIMS.get(b.key);
  if (claim) return landmarkCard(claim);
  const r = rng(b.seed);
  const P = POOLS[b.band] || POOLS.middle;
  const name = nbName(b);
  const ctx = { name, hour: b.hour, ring: b.ring, years: yearsAgo(r) };
  const type = P.types.length ? pick(r, P.types) : null;
  const middle = P.middles.length ? pick(r, P.middles) : null;
  const light = middle ? middle.light : null;
  const ok = x => !x.needs || x.needs === light;
  const hall = P.halls.length ? pick(r, P.halls) : null;
  const trades = pickN(r, P.trades, 2);
  const sound = P.sounds.length ? pick(r, P.sounds) : null;
  const smell = P.smells.length ? pick(r, P.smells) : null;
  const customs = P.customs.filter(ok), args = P.arguments.filter(ok);
  const custom = customs.length ? pick(r, customs) : null;
  const arg = args.length ? pick(r, args) : null;
  const res = P.residents.length ? pick(r, P.residents) : null;
  const hist = P.histories.length ? pick(r, P.histories) : null;
  const rare = P.rare.length && r() < 0.14 ? pick(r, P.rare) : null;
  const decks = b.to - b.from + 1;
  const people = Math.round(DRUM.BLOCK_Z * (TAU * b.rMid / b.stratum.N) * decks / 87 / 10) * 10;
  const spot = { zone: "deck", z: b.zMid, r: b.rMid, theta: b.theta, deck: b.from, ring: b.ring, hour: b.hour };
  const sections = [];
  if (middle) sections.push({ h: light === "bright" ? "The middle · a bright court" : light === "dim" ? "The middle · a dim wood" : "The middle", t: fill(middle.text, ctx) });
  if (hall) sections.push({ h: "Eat", t: fill(hall.text, ctx) });
  if (trades.length) sections.push({ h: "Makers & shops", t: trades.map(x => fill(x.text, ctx)).join(" ") });
  if (sound || smell) sections.push({ h: "Hear & smell", t: [sound ? `You'll hear ${fill(sound.text, ctx).replace(/\.$/, "")}.` : "", smell ? `You'll smell ${fill(smell.text, ctx).replace(/\.$/, "")}.` : ""].join(" ").trim() });
  if (custom) sections.push({ h: "Custom", t: fill(custom.text, ctx) });
  if (arg) sections.push({ h: "The argument", t: fill(arg.text, ctx) });
  if (rare) sections.push({ h: "Only here", t: fill(rare.text, ctx), rare: true });
  if (hist) sections.push({ h: "History", t: fill(hist.text, ctx) });
  const who = res ? { name: personName(r), age: Math.round(lerp(res.age ? res.age[0] : 30, res.age ? res.age[1] : 70, r())), role: res.role, line: fill(res.line, ctx) } : null;
  const hl = hourLine(b.hour, r);
  sections.push({ h: `The Hour · ${HOUR_NAMES[b.hour]}`, t: hl });
  const plat = toPlatform(spot), hol = toHollow(spot);
  sections.push({ h: `The station · Ring ${WORDS[b.ring]}`, t: ringLine(b.ring) + (plat ? ` About ${fmtDur(plat.t)} to the platform by cab.` : "") });
  return {
    type: "door", id: "door-" + b.door, title: name,
    kicker: `Neighbourhood · door ${fmtInt(b.door)} of ${fmtInt(DOORS)}`,
    addr: addrLine(`Decks ${b.from}–${b.to}`, b.ring, b.hour) + " · " + fmtG(gAt(b.rMid)),
    sub: type ? fill(type.text, ctx) : "",
    sections, who, spot, block: b,
    gauges: gaugesFor(spot, [{ k: "People", v: "~" + fmtInt(people) }, { k: "To the Hollow", v: hol ? fmtDur(hol) : "—" }]),
    generated: true,
  };
}

function landmarkCard(p) {
  const s = p.spot;
  let deckText = "";
  if (p.zone === "deck" || p.zone === "keel" || p.zone === "line") deckText = p.deckTo && p.deckTo !== p.deck ? `Decks ${p.deck}–${p.deckTo}` : `Deck ${p.deck}`;
  else if (p.zone === "hollow") deckText = s.r >= DRUM.FLOOR - 30 ? "The Hollow floor" : `The Hollow, ${Math.round(DRUM.FLOOR - s.r)} m above the floor`;
  else if (p.zone === "wall") deckText = `The ${s.wall} wall, ${Math.round(DRUM.FLOOR - s.r)} m up`;
  else if (p.zone === "spindle") deckText = `The Spindle, ${s.wall === "front" ? "front" : s.wall === "back" ? "back" : "middle"}`;
  else if (p.zone === "axle") deckText = `The ${s.wall} axle`;
  else if (p.zone === "outside") deckText = "Outside the hull";
  else if (p.zone === "beyond") deckText = "Beyond the drum";
  const showRing = !["beyond", "axle"].includes(p.zone) && p.ring;
  const showHour = !["beyond", "axle"].includes(p.zone) && p.hour;
  const g = p.zone === "beyond" ? null : gAt(s.r);
  const extra = [];
  if (["deck", "keel", "line"].includes(p.zone)) {
    const plat = toPlatform(s), hol = toHollow(s);
    if (plat && p.zone !== "keel") extra.push({ k: "To the platform", v: fmtDur(plat.t) });
    if (hol) extra.push({ k: "To the Hollow", v: fmtDur(hol) });
  }
  if (p.zone === "hollow" || p.zone === "wall") extra.push({ k: "Sun at full", v: fmtSun(PHYS.sunAt(s.r, s.z)) });
  return {
    type: "landmark", id: p.id, title: p.name,
    kicker: (KINDS[p.kind] || "Landmark"),
    kind: p.kind,
    addr: addrLine(deckText, showRing ? p.ring : null, showHour ? p.hour : null) + (g != null ? " · " + fmtG(g) : ""),
    sub: p.blurb || "",
    text: p.text || "", detail: p.detail || "", who: p.who && p.who.name ? p.who : null,
    canon: p.canon || null, tags: p.tags || [],
    spot: s, place: p,
    gauges: p.zone === "beyond" ? [] : gaugesFor(s, extra),
  };
}

/* ---- cards for places that aren't neighbourhoods ---- */
const FIXED = {
  jacket: { title: "The hydrogen jacket", text: "Fifty metres of liquid hydrogen at 20 K wrapped round the hull and both end caps, about 3.5 tonnes over every square metre: Sorrel's shield against cosmic rays, some 2.2 t of it for each person inside. In the guard vacuum between hull and jacket, cryopanels freeze whatever the hull leaks, so nothing vents. Nobody goes in. Glide trains pass through it in short dark tunnels." },
  moat: { title: "The moat", text: "About half a metre of Sorrel's own water held outside the jacket over the sides and the front cap: two-thirds of the drum's water, some 53 million tonnes. It keeps the Lantern's hard X-rays from warming the 20 K jacket and throws a quarter to a third of them back into the mid-raft. It is also the drum's water supply, piped in across the jacket to the Keel." },
  quay: { title: "The quay", text: "A band of track round the drum's waist, outside the jacket and moat, moving at 174 m/s and pressing at a little over 1 g. Cradles carry glide cars round to the touch point of their lane and let go; the next drum's cradles catch them 140 seconds later. Sorrel has a quay band over each of its nine station rings, each ringed with lights." },
  midraft: { title: "The mid-raft", text: "A dark hall 3.75 km deep between the rectenna layer in front and the radiator layer behind, flooded with the Lantern's hard X-rays: an unshielded person would be dead within minutes. Drums stand in it every 24.5 km, each six kilometres across and wearing rings of quay lights round its waist. Along Herb Row the next one is Lovage on one side and Tansy on the other; across the rows, Chervil and Rue. Glide cars cross in 140 seconds of free fall." },
  rectenna: { title: "The rectenna field", text: "The raft's front layer: a field of receiving antennas that turn the Lantern's microwave beam back into electricity, about two square metres for every person. Sorrel's cell takes in some 340 GW, and about 160 GW of it crosses into the hull through the rotary joint at the front axle. The patch of the Lantern that feeds Merrow is eleven light-months away. Nobody comes out here; machines change the diodes on a schedule." },
  radiators: { title: "The radiator layer", text: "Fixed panels across the raft's back, some 390 km² of them for Sorrel's hull alone, at about room temperature, shedding the drum's heat to the dark. The ammonia comes out through the back axle's great joint at about 220 cubic metres a second. Back crews ride sleds along the panel rows chasing leaks and changing pumps, with the stars over their shoulders." },
  windows: { title: "The Windows", text: "A dozen long, low galleries on the aft face of the radiator layer, about 150 couches each. Every Sorrel child comes once, at about eight, with one adult of their choosing. Twenty minutes of red light first, so eyes can wake up; then the shutter opens on the River, the Shelf, and the black shapes of other rafts." },
  frontaxle: { title: "The front axle", text: "Power in. About 160 GW crosses from the still raft into the turning drum through a rotary joint at the hub of the moat's front tank, and runs out from here down the front wall and the sunline's spar. It is the quiet end of the drum: the hum of current, not the roar of pumps." },
  backaxle: { title: "The back axle", text: "Heat out. Pipes as wide as rooms carry the drum's heat away as ammonia, some 220 cubic metres a second, through the great rotary joint into the part of the raft that doesn't turn. It is the loudest place in Sorrel, and the way to the Windows." },
  spindleDay: { title: "The Spindle", text: "The axis itself: within 75 m of it you weigh under 3% of a g. By day the middle is closed, because the sunline runs down it and a few tens of metres away its light would burn you; people fly only in the netted halls at the two ends. Flying along the axis is easy. Flying across it, Coriolis bends your path." },
  spindleNight: { title: "The Spindle, open", text: "The sunline is down, so the whole axis is open: three and three-quarter kilometres of flying country under 3% of a g. People fly its length with hand lamps, lengthwise, because crosswise the drum turns under you and you come out somewhere you didn't aim." },
  hallFront: { title: "The front flying hall", text: "A long sock of netting round the axis at the front end, out to about 300 m from the wall and netted off well short of the sunline. A surface here facing the line's end gets a bright morning's light at most. Wing-sleeves are hired at the gate." },
  hallBack: { title: "The back flying hall", text: "A long sock of netting round the axis at the back end, where the Spindle lifts from the back wall arrive. Under 3% of a g, in the Hollow's own soft glow. Wing-sleeves are hired at the gate, and Axis Tea Room sends tea up in lidded bulbs." },
};

function fixedCard(key, spot, kicker) {
  const f = FIXED[key];
  return {
    type: "fixed", id: "x-" + key, title: f.title, kicker: kicker || "The drum",
    addr: spot.zone === "beyond" ? "Beyond the drum" : (spot.zone === "outside" ? "Outside the hull" : "") + (spot.zone !== "beyond" && spot.r != null ? (spot.zone === "outside" ? " · " : "") + fmtG(gAt(spot.r)) : ""),
    text: f.text, spot, gauges: spot.zone === "beyond" ? [] : gaugesFor(spot), generated: false,
  };
}

function keelCard(b) {
  const r = rng(b.seed);
  const pool = (D.keel || []).filter(u => !u.decks || (b.to >= u.decks[0] && b.from <= u.decks[1]));
  const u = pool.length ? pick(r, pool) : { name: "Keel works", text: "Plant and storage at a full g: pumps, tanks and the long corridors of the drum's metabolism." };
  const spot = { zone: "keel", z: b.zMid, r: b.rMid, theta: b.theta, deck: b.from, ring: b.ring, hour: b.hour };
  const dz = Math.abs(b.zMid - ringCenter(b.ring));
  return {
    type: "keel", id: `keel-${b.from}-${b.a}-${b.k}`, title: u.name, kicker: "The Keel · a working block",
    addr: addrLine(b.from === b.to ? `Deck ${b.from}` : `Decks ${b.from}–${b.to}`, b.ring, b.hour) + " · " + fmtG(gAt(b.rMid)),
    text: fill(u.text, { ring: b.ring, hour: b.hour, name: u.name, years: yearsAgo(r) }),
    sections: [{ h: `The station · Ring ${WORDS[b.ring]}`, t: ringLine(b.ring) + ` Station Ring ${WORDS[b.ring]} is ${Math.round(dz / 10) * 10} m along the Keel from here.` }],
    spot, block: b, gauges: gaugesFor(spot), generated: true,
  };
}

function lineCard(b) {
  const r = rng(b.seed);
  const L = LINES.find(x => x.deck === b.from) || LINES[0];
  const pool = D.line || [];
  const u = pool.length ? pick(r, pool) : { name: "Line deck", text: "Tubes behind walls, depots, workshops and freight sorting. Nobody lives on a line deck." };
  const spot = { zone: "line", z: b.zMid, r: b.rMid, theta: b.theta, deck: b.from, ring: b.ring, hour: b.hour };
  return {
    type: "line", id: `line-${b.from}-${b.a}-${b.k}`, title: u.name, kicker: `Line deck ${b.from} · a working block`,
    addr: addrLine(`Decks ${b.from}–${b.to}`, b.ring, b.hour) + " · " + fmtG(gAt(b.rMid)),
    text: fill(u.text, { ring: b.ring, hour: b.hour, name: u.name, years: yearsAgo(r) }),
    sections: [{ h: "Posted on the loops", t: `Spinward ${L.spin.toFixed(L.spin % 1 ? 1 : 0)} m/s, where riders feel ${L.feelSpin.toFixed(2)} g. Antispinward ${L.anti.toFixed(L.anti % 1 ? 1 : 0)} m/s, ${L.feelAnti.toFixed(2)} g. Cross-lines 30 m/s, and weight doesn't change on them. The tubes hold pure helium, so crews wear masks.` }],
    spot, block: b, gauges: gaugesFor(spot), generated: true,
  };
}

function floorCard(z, theta) {
  const hour = hourOfTheta(theta), ring = ringOfZ(z);
  const area = floorAreaAt(hour, z);
  const sub = Math.floor(z / 140) * 1000 + Math.floor(normTheta(theta) / TAU * 60);
  const r = rng(hash32("floor", hour, ring, sub));
  const H = D.hollow || {};
  const own = (H.floor || []).filter(u => u.area === area);
  const any = (H.floor || []).filter(u => u.area === "any");
  const pool = own.length && (r() < 0.65 || !any.length) ? own : (any.length ? any : own);
  const u = pool.length ? pick(r, pool) : { name: cap(AREA_NAMES[area]), text: "Grass at half a g, a pavilion among trees, and the far bank overhead." };
  const spot = { zone: "hollow", z, r: DRUM.FLOOR - 1, theta, ring, hour };
  const opp = oppositeHour(hour);
  return {
    type: "floor", id: "f-" + hour + "-" + ring + "-" + sub, title: u.name, kicker: `The Hollow floor · ${AREA_NAMES[area]}`,
    addr: addrLine("The Hollow floor", ring, hour) + " · 0.50 g",
    text: fill(u.text, { hour, ring, name: u.name, years: yearsAgo(r) }),
    sections: [{ h: "Overhead", t: `Three kilometres up, upside down and perfectly sharp: the floor of ${HOUR_NAMES[opp]}, ${AREA_NAMES[floorAreaAt(opp, z)]}. ${(HOURS[hour - 1] || {}).rivalry || ""}`.trim() }],
    spot, gauges: gaugesFor(spot, [{ k: "Sun at full", v: fmtSun(PHYS.sunAt(DRUM.FLOOR, z)) }]), generated: true,
  };
}

function wallCard(z, rr, theta) {
  const front = z < DRUM.L / 2;
  const hour = hourOfTheta(theta);
  const r = rng(hash32("wall", front ? 1 : 2, Math.round(rr / 40), hour));
  const pool = ((D.hollow || {}).wall || []).filter(u => rr >= (u.rmin || 0) && rr <= (u.rmax || 1500));
  const u = pool.length ? pick(r, pool) : { name: "A terrace", text: "A ledge of garden on the end wall, lighter than the floor below it." };
  const spot = { zone: "wall", z, r: rr, theta, ring: front ? 1 : 9, hour, wall: front ? "front" : "back" };
  return {
    type: "wall", id: "w-" + (front ? "f" : "b") + "-" + Math.round(rr / 40) + "-" + hour, title: u.name, kicker: `The ${front ? "front" : "back"} wall · a terrace`,
    addr: `The ${front ? "front" : "back"} wall, ${Math.round(DRUM.FLOOR - rr)} m above the floor · ${HOUR_NAMES[hour]} · ${fmtG(gAt(rr))}`,
    text: fill(u.text, { hour, ring: front ? 1 : 9, name: u.name, years: yearsAgo(r) }),
    spot, gauges: gaugesFor(spot, [{ k: "Sun at full", v: fmtSun(PHYS.sunAt(rr, z)) }]), generated: true,
  };
}

function airCard(z, rr, theta, clockMin) {
  const hour = hourOfTheta(theta), ring = ringOfZ(z);
  const up = DRUM.FLOOR - rr;
  const opp = oppositeHour(hour);
  const sun = sunLevel(clockMin);
  const below = floorAreaAt(hour, z), above = floorAreaAt(opp, z);
  const spot = { zone: "hollow", z, r: rr, theta, ring, hour };
  const t = [
    `Nothing here but warm, clean heliox, ${fmtInt(up)} m above ${AREA_NAMES[below]} of ${HOUR_NAMES[hour]} and ${fmtInt(rr + DRUM.FLOOR)} m below ${AREA_NAMES[above]} of ${HOUR_NAMES[opp]}, which hang overhead.`,
    rr > 300 ? `If you could stand here you would weigh ${fmtG(gAt(rr))}, but there is nothing to stand on: anything let go here falls, slowly and in a curve, toward the floor of ${HOUR_NAMES[hour]}.` : `This close to the axis you would weigh almost nothing.`,
    sun > 0 ? `The sunline is ${fmtInt(rr)} m away and at ${Math.round(sun * 100)}% just now: about ${fmtSun(PHYS.sunAt(rr, z) * sun)} on a face turned toward it.` : `The sunline is dark, and the Hollow is lamp-night.`,
  ];
  return {
    type: "air", id: "a-" + Math.round(z / 50) + "-" + Math.round(rr / 50) + "-" + hour, title: up < 400 ? "Kite height" : up < 1100 ? "Open air" : "Near the axis",
    kicker: "The Hollow · the air",
    addr: addrLine(`${fmtInt(up)} m above the floor`, ring, hour) + " · " + fmtG(gAt(rr)),
    text: t.join(" "), spot, gauges: gaugesFor(spot, [{ k: "Sun at full", v: fmtSun(PHYS.sunAt(rr, z)) }]), generated: true,
  };
}

/* What's at a point of the drawing, at a cut angle and lamp-clock minute. */
function cardAt(z, r, theta, clockMin) {
  // beyond the caps and outside the rim
  if (z < -55) return fixedCard("rectenna", { zone: "beyond", z, r, theta }, "Beyond the drum");
  if (z > DRUM.L + 55) return fixedCard(z > 3895 && r > 450 && r < 1500 ? "windows" : "radiators", { zone: "beyond", z, r, theta }, "Beyond the drum");
  if (r > 3070) return fixedCard("midraft", { zone: "beyond", z, r, theta }, "Beyond the drum");
  if (r > DRUM.R) {
    const near = Math.abs(z - ringCenter(ringOfZ(z))) < 40;
    if (r > DRUM.QUAY && near) return fixedCard("quay", { zone: "outside", z, r, theta, ring: ringOfZ(z) }, "Outside the hull");
    if (r > DRUM.R + DRUM.JACKET - 4) return fixedCard("moat", { zone: "outside", z, r, theta, ring: ringOfZ(z) }, "Outside the hull");
    return fixedCard("jacket", { zone: "outside", z, r, theta, ring: ringOfZ(z) }, "Outside the hull");
  }
  if (z < 0 || z > DRUM.L) {
    if (r < 60) return fixedCard(z < 0 ? "frontaxle" : "backaxle", { zone: "axle", z, r, theta, wall: z < 0 ? "front" : "back" }, "The axles");
    return fixedCard("jacket", { zone: "outside", z, r, theta }, "The end cap");
  }
  if (r > DRUM.FLOOR) {
    const b = blockAt(z, r, theta);
    if (!b) return null;
    if (b.kind === "res") return doorCard(b);
    if (b.kind === "keel") {
      if (b.to <= 4) {
        const st = PLACES.find(p => p.zone === "keel" && p.deck <= 4 && p.ring === b.ring && /station ring|quayside/i.test(p.name + " " + (p.tags || []).join(" ")));
        if (st && Math.abs(z - ringCenter(b.ring)) < 70) return landmarkCard(st);
      }
      return keelCard(b);
    }
    if (b.kind === "line") return lineCard(b);
    return null;
  }
  // inside the Hollow
  if (r < DRUM.SPINDLE) {
    const hall = z < DRUM.HALL_LEN ? "hallFront" : z > DRUM.L - DRUM.HALL_LEN ? "hallBack" : null;
    const key = hall || (spindleOpen(clockMin) ? "spindleNight" : "spindleDay");
    return fixedCard(key, { zone: "spindle", z, r, theta, ring: ringOfZ(z), wall: z < DRUM.L / 2 ? "front" : "back" }, "The Spindle");
  }
  const dFront = terraceDepth(r);
  if (z < dFront || z > DRUM.L - dFront) return wallCard(z, r, theta);
  if (r > DRUM.FLOOR - 40) return floorCard(z, theta);
  return airCard(z, r, theta, clockMin);
}

function nearestPlaces(spot, n, exceptId) {
  const arc = (a, b) => { const d = normTheta(a - b); return Math.min(d, TAU - d); };
  return PLACES.filter(p => p.id !== exceptId && p.zone !== "beyond").map(p => {
    const s = p.spot;
    const d = Math.abs(s.z - spot.z) + Math.abs(s.r - spot.r) + arc(s.theta, spot.theta) * Math.min(s.r, spot.r || s.r);
    return { p, d };
  }).sort((a, b) => a.d - b.d).slice(0, n);
}

/* Search every landmark, Hour, Ring, deck, and every neighbourhood name. */
let NAME_INDEX = null;
function buildNameIndex() {
  if (NAME_INDEX) return NAME_INDEX;
  NAME_INDEX = new Map();
  for (const s of STRATA) for (let a = 0; a < 18; a++) for (let k = 0; k < s.N; k++) {
    const b = makeBlock(s, a, k);
    const nm = nbName(b).toLowerCase();
    let list = NAME_INDEX.get(nm);
    if (!list) NAME_INDEX.set(nm, list = []);
    list.push(b.door);
  }
  return NAME_INDEX;
}
