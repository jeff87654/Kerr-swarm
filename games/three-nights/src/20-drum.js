/* ---------- Drum dossiers: everything about one nation drum ---------- */
"use strict";

const STANDARD_PALETTES = [
  { name: "Plain ramp", stops: ["#26231f", "#74685a", "#e2d3b8", "#fff8ec"], note: "The standard ramp: warm, then white." },
  { name: "Plain ramp", stops: ["#23252a", "#676f7c", "#d6dbe3", "#f8fbff"], note: "The standard ramp, run a little cool." },
  { name: "Plain ramp", stops: ["#29231c", "#7f6a4e", "#ecd2a4", "#fff6e4"], note: "The standard ramp, run a little warm." },
];

const FAR_CANON = ["Sorrel", "Lovage", "Chervil", "Sloe", "Kittiwake", "Gloaming", "Squall", "Carillon", "Dulse", "Madder", "Ochre", "Spelt", "Tansy", "Rue", "Borage", "Yarrow"];

function canonPos(name) {
  for (const [row, dx, dy, nm] of CANON_DRUM_PLACES) if (nm === name) {
    const [ax, ay] = CANON_ROW_ANCHORS[row]; return [ax + dx, ay + dy];
  }
  return null;
}

function randomFar(r, x, y) {
  // A drum far across Merrow: half the time a canon drum, otherwise a random spot
  if (r.chance(0.45)) {
    const nm = r.pick(FAR_CANON);
    const p = canonPos(nm);
    if (p && Math.hypot(p[0] - x, p[1] - y) > 50) return { name: nm, row: blockAt(p[0], p[1]).theme.row, x: p[0], y: p[1] };
  }
  for (let i = 0; i < 6; i++) {
    const fx = r.int(0, WORLD.N - 1), fy = r.int(0, WORLD.N - 1);
    if (Math.hypot(fx - x, fy - y) > 20000) return { name: drumNameAt(fx, fy), row: blockAt(fx, fy).theme.row, x: fx, y: fy };
  }
  return { name: "Dulse", row: "Kelp Row", x: CANON_ROW_ANCHORS.Kelp[0], y: CANON_ROW_ANCHORS.Kelp[1] };
}

function neighbourNames(x, y) {
  const out = [];
  for (const d of DIRS) if (inRaft(x + d.dx, y + d.dy)) out.push(drumNameAt(x + d.dx, y + d.dy));
  return out;
}

function slotContext(d, r) {
  const P = CONTENT.people;
  const nbs = d.neighbours;
  return {
    drum: d.name, row: d.row,
    nb: () => r.pick(nbs),
    nb2: () => r.pick(nbs),
    far: () => randomFar(r, d.x, d.y).name,
    farrow: () => randomFar(r, d.x, d.y).row,
    name: () => r.pick(P.given), name2: () => r.pick(P.given),
    full: () => r.pick(P.given) + " " + r.pick(P.surnames),
    surname: () => r.pick(P.surnames),
    deck: () => String(r.int(16, 301)), hdeck: () => String(r.int(302, 375)), ldeck: () => String(r.int(16, 113)),
    ring: () => String(r.int(1, 9)),
    block: () => r.pick(d.neighbourhoods), street: () => r.pick(d.streets),
    n: () => String(r.int(2, 9)), years: () => String(r.int(3, 90)),
    weekday: () => r.pick(WEEKDAYS), painter: () => d.painter || r.pick(P.given),
    time: () => pad2(r.int(5, 22)) + ":" + pad2(r.pick([0, 10, 15, 20, 30, 40, 45, 50])),
    ago: () => String(r.int(5, 400)),
  };
}

function fillItem(d, item, seed) {
  const rr = makeRng(seed ^ 0x9e3779b9);
  let t = item.t;
  if (item.n) t = t.replace(/\{n\}/g, String(rr.int(item.n[0], item.n[1])));
  if (item.years) t = t.replace(/\{years\}/g, String(rr.int(item.years[0], item.years[1])));
  if (item.ago) t = t.replace(/\{ago\}/g, String(rr.int(item.ago[0], item.ago[1])));
  return fill(d, t, seed);
}

function fill(d, text, seed) {
  const r = makeRng(seed);
  const ctx = slotContext(d, r);
  // Make nb and nb2 differ when possible
  const nbs = d.neighbours.slice();
  const nb1 = r.pick(nbs);
  const rest = nbs.filter((n) => n !== nb1);
  ctx.nb = nb1; ctx.nb2 = rest.length ? r.pick(rest) : nb1;
  const n1 = r.pick(CONTENT.people.given);
  let n2 = r.pick(CONTENT.people.given); if (n2 === n1) n2 = r.pick(CONTENT.people.given);
  ctx.name = n1; ctx.name2 = n2;
  return fillSlots(text, ctx, r);
}

/* Map Hollow tags to renderer parameters */
function hollowParams(tags, sub, r) {
  const has = (t) => tags.indexOf(t) >= 0;
  const p = {
    lake: has("biglake") ? r.range(0.15, 0.22) : has("lake") ? r.range(0.06, 0.12) : (r.chance(0.35) ? r.range(0.03, 0.06) : 0),
    woods: has("dimwood") ? r.range(0.65, 0.85) : has("woods") || has("yew") || has("birch") || has("bamboo") ? r.range(0.25, 0.45) : r.range(0.04, 0.16),
    orchard: has("orchards") ? r.range(0.18, 0.32) : r.range(0.03, 0.1),
    squares: has("squares") ? r.range(0.12, 0.2) : sub === "fair" ? r.range(0.08, 0.14) : r.range(0.02, 0.06),
    meadow: has("meadow") || has("flowers") ? r.range(0.25, 0.45) : r.range(0.05, 0.15),
    pavilions: has("pavilions") ? r.range(0.6, 1) : r.range(0.25, 0.6),
    terrace: has("terrace-gardens") ? r.range(0.7, 1) : r.range(0.25, 0.6),
    swell: has("swell") ? 1 : 0,
    canal: has("canal") ? 1 : 0,
    crowds: has("crowds") ? 1 : sub === "thin" ? 0.8 : 0.4,
    flowers: has("flowers") ? 1 : 0,
    bamboo: has("bamboo") ? 1 : 0,
    kites: has("kites") ? 1 : 0,
    lakePhi: r.range(0, Math.PI * 2), lakeZ: r.range(1100, 2700),
    seed: r.range(0, 1000),
    hue: r.range(-1, 1),
  };
  if (sub === "wood") { p.squares *= 0.3; p.orchard *= 0.5; }
  return p;
}

const drumCache = makeCache(400);

function getDrum(x, y) {
  if (!inRaft(x, y)) return null;
  const key = x + "," + y;
  const cached = drumCache.get(key);
  if (cached) return cached;

  const C = CONTENT;
  const F = C.flavour;
  const blk = blockAt(x, y);
  const name = drumNameAt(x, y);
  const canonName = CANON_BY_KEY[key];
  const canon = canonName ? CANON_DRUMS[canonName] : null;
  const sub = canon ? canon.sub : kindOf(x, y, blk);
  const open = isOpen(sub);
  const kinds = kindsList(sub);
  const r = makeRng(hash32("drum", x, y));

  const d = {
    x, y, key, name, canon: !!canon, canonData: canon,
    row: blk.theme.row, rowAbout: (canon && canon.rowAbout) || blk.theme.about, block: blk,
    sub, open, kinds, kindLabel: KIND_LABEL[sub],
    neighbours: neighbourNames(x, y),
  };

  d.neighbourhoods = (canon && canon.neighbourhoods) || r.sample(C.themes.neighbourhoods, 6);
  d.streets = (canon && canon.streets) || r.sample(C.themes.streets, 4);
  d.painter = r.pick(C.people.given);

  // The board
  const places = WORLD.PLACES;
  let people;
  if (open) {
    const m = canon && canon.margin !== undefined ? canon.margin : r.range(0.02, 0.04);
    people = Math.round(places * (1 - m) / 1000) * 1000;
  } else if (sub === "counted") {
    const over = canon && canon.over !== undefined ? canon.over : r.range(0.02, 0.1);
    people = Math.round(places * (1 + over) / 1000) * 1000;
    d.yearsToPar = Math.max(1, Math.round(over * WORLD.LIFE));
    d.stopYears = canon && canon.name === "Rue" ? 9 : r.int(2, 14);
  } else if (sub === "thin") {
    people = Math.round(places * (1 + r.range(0.003, 0.03)) / 1000) * 1000;
  } else {
    people = Math.round(places * (1 - r.range(-0.001, 0.003)) / 1000) * 1000;
  }
  d.places = places; d.people = people; d.margin = places - people;
  d.board = (canon && canon.board) || (open ? "ledger" : sub === "counted" ? "count" : "register");
  if (name === "Rue") d.yearsToPar = 11;

  // Rules
  const pickRule = (arr, fallback) => {
    const pool = arr ? poolFor(arr, kinds) : [];
    return pool.length ? r.pick(pool) : fallback;
  };
  const R = F.rules || {};
  if (canon) {
    d.rules = {
      goods: canon.rules.goods, births: canon.rules.births, gin: canon.rules.gin,
      guests: canon.rules.guests, lamps: canon.rules.lamps,
    };
  } else {
    const goods = pickRule(R.goods, { t: "Allots its high decks and Hollow hours by rotation." });
    const births = sub === "counted"
      ? pickRule((R.births || []).filter((b) => (b.k || []).indexOf("counted") >= 0), { t: "Births are licensed, and fourteen-year-olds are fitted during a stop." })
      : pickRule((R.births || []).filter((b) => !b.k || b.k.indexOf("counted") < 0), { t: "Holdings: places pass to heirs in the household." });
    const gin = pickRule(R.gin, { t: "Gin near cost, with thiamine." });
    const gw = { hall: { free: 4, lottery: 3, paid: 1, terraces: 1, night: 0.5 }, wood: { free: 4, lottery: 1, paid: 0.5, terraces: 1, night: 1 }, fair: { free: 3, lottery: 2, paid: 2, terraces: 2, night: 0.3 }, maker: { free: 4, lottery: 2, paid: 1, terraces: 1, night: 0.5 },
      steady: { free: 2, lottery: 1.5, paid: 2, terraces: 1.5, night: 1 }, thin: { free: 1, lottery: 2, paid: 0.6, terraces: 1.5, night: 2 }, counted: { free: 0.2, lottery: 0.5, paid: 0.5, terraces: 2, night: 3 } }[sub];
    const gpool = poolFor(R.guests || [], kinds);
    const access = r.weighted(Object.entries(gw));
    const gsub = gpool.filter((g) => g.access === access);
    let guests = gsub.length ? r.pick(gsub) : pickRule(R.guests, { t: "Guests get an hour on the floor a day.", access: "free" });
    if (sub === "counted" && guests.access === "free") guests = { t: "No guest hours during the stop; the terraces are open in the lamp-night.", access: "night" };
    const day = pickRule(R.day, { t: "Lamps up at 06:30.", lamps: "06:30" });
    const f2 = (it, k) => fillItem(d, it, hash32("rule", x, y, k));
    d.rules = { goods: f2(goods, 1), births: f2(births, 2), gin: f2(gin, 3), guests: Object.assign({}, guests, { t: f2(guests, 4) }), lamps: day.lamps || "06:30", dayNote: f2(day, 5) };
  }
  const [lh, lm] = String(d.rules.lamps || "06:30").split(":").map(Number);
  d.lampsUp = (isNaN(lh) ? 6 : lh) * 60 + (isNaN(lm) ? 30 : lm);

  // Guest-right, Windows, back crews
  d.guestRight = canon ? canon.guestRight : open ? true : sub === "steady" ? r.chance(0.85) : sub === "thin" ? r.chance(0.45) : false;
  if (canon) {
    d.windows = canon.windows || { keeps: false };
    d.backcrew = !!canon.backcrew;
  } else {
    const keeps = r.chance(open ? 0.55 : sub === "steady" ? 0.4 : 0.22);
    d.windows = { keeps, guests: keeps && r.chance(0.6) };
    d.backcrew = r.chance(0.1);
  }

  // The sunline and the dawn
  d.sunHours = canon ? canon.sunHours : sub === "fair" ? r.pick([7, 8, 8, 9, 10]) : sub === "thin" ? r.pick([5, 6, 6]) : r.weighted([[6, 8], [7, 1.5], [8, 0.8], [12, 0.2]]);
  if (canon) d.palette = canon.palette;
  else {
    const painted = r.chance(sub === "fair" ? 0.95 : sub === "hall" ? 0.7 : sub === "wood" ? 0.45 : sub === "maker" ? 0.4 : 0.15);
    const dawns = F.dawns || [];
    if (painted && dawns.length) {
      const dp = r.pick(dawns);
      d.palette = { name: dp.name, stops: dp.stops, note: dp.note, by: d.painter, for: dp.for || "both" };
    } else d.palette = r.pick(STANDARD_PALETTES);
  }

  // The Hollow
  let tags, hollowText;
  if (canon) { tags = canon.hollow.tags; hollowText = canon.hollow.t; }
  else {
    const pool = (F.hollow || []).filter((h) => {
      if (sub === "wood") return true;
      return h.tags.indexOf("dimwood") < 0;
    });
    const woodPool = pool.filter((h) => h.tags.some((t) => t === "dimwood" || t === "woods" || t === "yew" || t === "birch" || t === "bamboo"));
    const first = sub === "wood" && woodPool.length ? r.pick(woodPool) : r.pick(pool);
    const second = r.pick(pool);
    tags = Array.from(new Set(first.tags.concat(second && second !== first ? second.tags : [])));
    hollowText = first.t + (second && second !== first ? "; " + second.t : "");
  }
  d.hollowText = hollowText;
  d.hollowTags = tags;
  d.hollow = hollowParams(tags, sub, makeRng(hash32("hollow", x, y)));

  // Character
  const famousPool = (F.famous && F.famous[sub]) || [];
  d.famous = canon ? canon.famous : famousPool.length ? r.sample(famousPool, sub === "maker" ? 1 : 1) : [];
  d.customs = canon ? canon.customs : r.sample(poolFor(F.customs || [], kinds), 2).map((c) => fillItem(d, c, hash32("custom", x, y, c.t.length)));
  if (!canon && F.history && F.history.length) {
    const hpool = poolFor(F.history, kinds);
    const h = r.pick(hpool.length ? hpool : F.history);
    const rr = makeRng(hash32("hist", x, y));
    d.history = fillItem(d, h, hash32("histf", x, y));
  } else d.history = null;
  const reps = F.reputations ? poolFor(F.reputations.map((x2) => typeof x2 === "string" ? { t: x2 } : x2), kinds) : [];
  d.reputation = canon ? canon.reputation : reps.length ? fillItem(d, r.pick(reps), hash32("rep", x, y)) : null;
  d.motto = canon ? canon.motto : (F.mottos && r.chance(0.55) ? r.pick(F.mottos) : null);
  if (d.motto && typeof d.motto === "object") d.motto = d.motto.t;
  d.broth = canon ? canon.broth : F.broths ? r.pick(F.broths) : "peppery";
  if (typeof d.broth === "object") d.broth = d.broth.t;

  // Where to eat
  if (canon && canon.eat) d.eat = canon.eat.map((p) => Object.assign({}, p));
  else {
    const places2 = poolFor(C.food.places || [], kinds);
    d.eat = r.sample(places2, r.chance(0.5) ? 2 : 1).map((p) => {
      const q = Object.assign({}, p);
      q.name = fill(d, p.name, hash32("ename", x, y, p.name.length));
      q.where = p.where ? fill(d, p.where, hash32("ewhere", x, y)) : "";
      q.blurb = fill(d, p.blurb || "", hash32("eblurb", x, y));
      q.tip = p.tip ? fill(d, p.tip, hash32("etip", x, y)) : "";
      q.dishes = (p.dishes || []).map((dd) => [fill(d, dd[0], hash32("edish", x, y, dd[0].length)), dd[1]]);
      if (open && q.price > 0 && (p.style === "hall")) q.guestFree = true;
      return q;
    });
  }

  d.blurb = canon ? canon.blurb : null;
  d.canonPeople = canon && canon.people ? canon.people : [];
  d.canonNotices = canon && canon.notices ? canon.notices : [];

  return drumCache.set(key, d);
}

/* --- Daily and hourly things: the board, notices, people, tonight --- */

function boardFor(d, day) {
  const r = makeRng(hash32("board", d.x, d.y, day));
  const deathsYear = d.people / WORLD.LIFE;
  const deathsToday = Math.round(deathsYear / 365 * r.range(0.9, 1.1));
  let bornToday;
  if (d.sub === "counted") bornToday = 0;
  else if (d.sub === "thin") bornToday = Math.round(deathsToday * r.range(1.0, 1.06));
  else bornToday = Math.round(deathsToday * r.range(0.97, 1.03));
  let guests = 0;
  if (d.guestRight) {
    guests = d.open ? Math.round(r.range(300000, 450000) / 100) * 100 : d.sub === "thin" ? Math.round(r.range(15000, 60000) / 100) * 100 : Math.round(r.range(60000, 200000) / 100) * 100;
    if (d.name === "Chervil") guests = Math.round(r.range(400000, 420000) / 100) * 100;
  }
  return { places: d.places, people: d.people, margin: d.margin, bornToday, deathsToday, guests };
}

function namingPairs(d, day, n) {
  const r = makeRng(hash32("naming", d.x, d.y, day));
  const out = [];
  for (let i = 0; i < n; i++) {
    const dead = r.pick(CONTENT.people.given) + " " + r.pick(CONTENT.people.surnames);
    const age = r.int(84, 117);
    const first = dead.split(" ")[0];
    const babySur = r.pick(CONTENT.people.surnames);
    out.push({ baby: (r.chance(0.6) ? first : r.pick(CONTENT.people.given)) + " " + babySur, dead, age });
  }
  return out;
}

function noticesFor(d, day) {
  const week = Math.floor((day - 1) / 7);
  const r = makeRng(hash32("notices", d.x, d.y, week));
  const pool = poolFor(CONTENT.notices || [], d.kinds).filter((n) => {
    if (!d.guestRight && /guest-right|Margin flat|wanderers on guest/i.test(n.t)) return false;
    if (!d.windows.keeps && /\bWindow\b/.test(n.t)) return false;
    const goods = d.rules.goods || "", gin = d.rules.gin || "";
    if (/auction/i.test(n.t) && !/auction/i.test(goods)) return false;
    if (/(list for the high decks|by age|congratulations on being old)/i.test(n.t) && !/\bage\b|old/i.test(goods)) return false;
    if (/lottery|the draw\b/i.test(n.t) && !/lottery|draw|lot\b/i.test(goods + " " + (d.rules.guests ? d.rules.guests.t : ""))) return false;
    if (/(duty|smuggl|bootleg|methanol|taxed)/i.test(n.t) && !/(tax|duty|ration|methanol|bottle)/i.test(gin)) return false;
    if (/(near cost|cheap gin)/i.test(n.t) && !/cost/i.test(gin)) return false;
    if (/Margin flat|guest-right/i.test(n.t) && !d.guestRight) return false;
    if (/\bThe Count\b|THE COUNT|the fitting/i.test(n.t) && d.sub !== "counted") return false;
    if (/\bLedger\b|LEDGER/.test(n.t) && d.board !== "ledger") return false;
    return true;
  });
  const n = r.int(4, 6);
  const picks = r.sample(pool, n).map((it, i) => ({ t: fill(d, it.t, hash32("nt", d.x, d.y, week, i)), cat: it.cat }));
  for (const t of d.canonNotices) picks.unshift({ t, cat: "canon" });
  return picks.slice(0, 7);
}

function timeBand(mins) {
  const h = (mins % 1440) / 60;
  if (h >= 5 && h < 9) return "dawn";
  if (h >= 9 && h < 17) return "day";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

function peopleFor(d, day, mins, whereArg) {
  const wheres = Array.isArray(whereArg) ? whereArg : [whereArg || "platform"];
  const where = wheres[0];
  const hour = Math.floor((mins % 1440) / 60);
  const slot = Math.floor(hour / 3);
  const r = makeRng(hash32("people", d.x, d.y, day, slot, strHash(wheres.join("+"))));
  const out = [];
  for (const cp of d.canonPeople) {
    const okWhere = wheres.indexOf(cp.where) >= 0 || (wheres.indexOf("platform") >= 0 && (cp.where === "quayside" || cp.where === "gate"));
    const okHour = !cp.hours || (hour >= cp.hours[0] && hour < cp.hours[1]);
    if (okWhere && okHour) out.push(Object.assign({ canon: true, id: "c:" + cp.name }, cp));
  }
  const roles = (CONTENT.people.roles || []).filter((ro) => kindOk(ro, d.kinds) && (!ro.where || wheres.some((w) => ro.where.indexOf(w) >= 0) || (where === "platform" && (ro.where.indexOf("quayside") >= 0 || ro.where.indexOf("counter") >= 0))));
  const night = hour >= 23 || hour < 5;
  const count = Math.max(0, (night ? 2 : 3) - out.length);
  const chosen = r.sample(roles, count);
  chosen.forEach((ro, i) => {
    const pr = makeRng(hash32("person", d.x, d.y, day, slot, i, strHash(ro.role)));
    const given = pr.pick(CONTENT.people.given);
    const sur = pr.pick(CONTENT.people.surnames);
    const age = pr.int(ro.age ? ro.age[0] : 20, ro.age ? ro.age[1] : 70);
    const fitting = (ro.lines || []).filter((l) => {
      if (/\bWindows?\b/.test(l) && !d.windows.keeps) return false;
      if (/birth right/i.test(l) && !/right/i.test(d.rules.births || "")) return false;
      if (/(two bottles|duty)/i.test(l) && !/(bottle|duty|tax)/i.test(d.rules.gin || "")) return false;
      if (/\bLedger\b/.test(l) && d.board !== "ledger") return false;
      if (/\bthe Count\b/.test(l) && d.sub !== "counted") return false;
      if (/guest-right|Margin flat/i.test(l) && !d.guestRight) return false;
      return true;
    });
    const lines = pr.sample(fitting.length ? fitting : (ro.lines || []), 3).map((l, j) => fill(d, l, hash32("pl", d.x, d.y, day, slot, i, j)));
    out.push({
      id: "p:" + d.key + ":" + day + ":" + slot + ":" + i, name: given + " " + sur, given, age,
      role: fill(d, ro.role, hash32("prole", d.x, d.y, day, slot, i)),
      doing: fill(d, pr.pick(ro.doing || ["waiting for a glide"]), hash32("pdo", d.x, d.y, day, slot, i)),
      lines, knows: ro.knows || "", where: where || "platform",
    });
  });
  return out;
}

function tonightFor(d, day) {
  const r = makeRng(hash32("tonight", d.x, d.y, day));
  const pool = poolFor((CONTENT.events && CONTENT.events.tonight) || [], d.kinds).filter((e) => {
    if (e.act === "window" && !d.windows.keeps) return false;
    if (e.act === "swell" && !d.hollow.swell) return false;
    if (/\bswell\b/i.test(e.t + " " + e.d) && !d.hollow.swell) return false;
    if (e.act === "lake" && d.hollow.lake <= 0.02) return false;
    if (/\bWindow\b/.test(e.t + " " + e.d) && !d.windows.keeps) return false;
    if (/\bLedger\b/.test(e.t + " " + e.d) && d.board !== "ledger") return false;
    if (/\bthe Count\b/.test(e.t + " " + e.d) && d.sub !== "counted") return false;
    return true;
  });
  const evs = r.sample(pool, 2).map((e, i) => ({
    t: fill(d, e.t, hash32("evt", d.x, d.y, day, i)), d: fill(d, e.d, hash32("evd", d.x, d.y, day, i)),
    when: e.when || "evening", cost: e.cost || 0, act: e.act || "music",
  }));
  return evs;
}

// Sunline brightness (0..1) and which phase, at a clock time for this drum
function sunlineAt(d, mins) {
  const m = ((mins % 1440) + 1440) % 1440;
  const d0 = d.lampsUp - 30;               // dawn begins
  const full0 = d0 + 180, full1 = full0 + d.sunHours * 60, end = full1 + 180;
  const rel = (m - d0 + 1440) % 1440;
  const len = end - d0;
  let I = 0, phase = "night", f = 0;
  if (rel < 180) { I = rel / 180; phase = "dawn"; f = I; }
  else if (rel < 180 + d.sunHours * 60) { I = 1; phase = "noon"; f = 1; }
  else if (rel < len) { I = 1 - (rel - 180 - d.sunHours * 60) / 180; phase = "dusk"; f = I; }
  return { I, phase, f, dawnStart: d0, fullStart: full0, fullEnd: full1, nightStart: end % 1440 };
}

// Colour of the sunline from the drum's palette at ramp fraction f (0 dark .. 1 full)
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
function paletteColor(stops, f) {
  const cs = stops.map(hexToRgb);
  const x = clamp(f, 0, 1) * (cs.length - 1);
  const i = Math.min(cs.length - 2, Math.floor(x)), t = x - i;
  return [lerp(cs[i][0], cs[i + 1][0], t), lerp(cs[i][1], cs[i + 1][1], t), lerp(cs[i][2], cs[i + 1][2], t)];
}
