/* ---------- The game: a wander year across Merrow ---------- */
"use strict";

const SAVE_KEY = "three-nights.save.v1";
const DAY = 1440;
const BOOKING_DAY = 120;
const KNOTNIGHT = 300;
const YEAR = 365;
const PASSING_RAFTS = ["Melusine", "Asrai", "Rusalka", "Ondine", "Nixie", "Finfolk", "Ningyo", "Lorelei", "Morgen", "Undine"];

const HOMES = [
  { name: "Chervil", ring: 2, note: "an open hall drum across the rows from Sorrel, with a Ledger at every ring and a hall at Ring 2" },
  { name: "Sorrel", ring: 3, note: "a steady drum on Herb Row, where the old get the light and children see the stars once" },
  { name: "Lovage", ring: 1, note: "Sorrel's brighter neighbour, with twelve hours of noon and an auction for everything" },
  { name: "Tansy", ring: 5, note: "a steady drum of strawberries, strain libraries and the Row's only henhouse" },
  { name: "Rue", ring: 1, note: "a counted drum nine years into a birth stop, with the best blight kitchen on the Row" },
];

let state = null;

function newState(playerName, homeName, recipients) {
  const p = canonPos(homeName);
  const home = HOMES.find((h) => h.name === homeName) || HOMES[0];
  const seed = (Date.now() ^ strHash(playerName || "x")) >>> 0;
  const r = makeRng(seed);
  const s = {
    v: 1, seed,
    player: { name: playerName, home: homeName, hx: p[0], hy: p[1], ring: home.ring, recipients: recipients || [] },
    t: 6 * 60 + 40,              // day 1, 06:40
    x: p[0], y: p[1],
    purse: 30,
    dark: false, darkDays: 0,
    nightsHere: 0, sleptHere: false,
    ring: home.ring,
    visited: {}, rowsSeen: {}, route: [[p[0], p[1], 1, "start"]],
    cards: [], log: [], met: [], spoons: [],
    stats: { glides: 0, legs: 0, distKm: 0, fares: 0, nightsAboard: 0, farthest: 0, farthestName: "", dearest: null, meals: 0, hollow: 0, windows: 0, spindle: 0, dawns: 0, shifts: 0, events: 0 },
    passing: { raft: r.pick(PASSING_RAFTS), day: r.int(196, 236) },
    transit: null,
    view: "platform", viewUntil: 0,
    ended: false,
    talked: {},
  };
  return s;
}

function dayOf(t) { return Math.floor(t / DAY) + 1; }
function clockOf(t) { return t % DAY; }
function weekdayOf(t) { return WEEKDAYS[(dayOf(t) - 1) % 7]; }
function here() { return getDrum(state.x, state.y); }
function homeDrum() { return getDrum(state.player.hx, state.player.hy); }
function lightHome() { return lightSeconds(state.x, state.y, state.player.hx, state.player.hy); }

function phaseName(d, t) {
  const s = sunlineAt(d, clockOf(t));
  if (s.phase === "dawn") return "lamp-dawn";
  if (s.phase === "noon") return "lamp-noon";
  if (s.phase === "dusk") return "lamp-dusk";
  return "lamp-night";
}

function festivalOn(day) {
  if (day === BOOKING_DAY - 1) return "quiet";
  if (day === BOOKING_DAY) return "booking";
  if (day === KNOTNIGHT) return "knotnight";
  if (Math.abs(day - state.passing.day) <= 3) return "passing";
  return null;
}

/* --- the log (feed) --- */
function logEntry(text, kind, extra) {
  state.log.unshift(Object.assign({ t: state.t, text, kind: kind || "note", at: here() ? here().name : "" }, extra || {}));
  if (state.log.length > 80) state.log.length = 80;
}

/* --- time --- */
function advance(mins) {
  const before = state.t;
  state.t += Math.max(0, Math.round(mins));
  const d0 = dayOf(before), d1 = dayOf(state.t);
  for (let d = d0 + 1; d <= d1; d++) {
    const gain = 6 + (state.dark ? 9.6 : 0);
    state.purse += gain;
    if (state.dark) state.darkDays += 1;
    if (d === YEAR + 1 && !state.ended) state.yearTurned = true;
  }
}

function spend(kwh, what) {
  state.purse -= kwh;
  if (kwh > 0) {
    const st = state.stats;
    if (!st.dearest || kwh > st.dearest.kwh) st.dearest = { kwh, what };
  }
}

/* --- arriving and leaving --- */
function arriveAt(x, y, how, ring) {
  state.x = x; state.y = y;
  state.nightsHere = 0; state.sleptHere = false;
  state.ring = ring || 1 + (hash32("ring", x, y, state.t) % 9);
  state.view = "platform";
  const d = here();
  const k = d.key;
  if (!state.visited[k]) state.visited[k] = { name: d.name, row: d.row, sub: d.sub, first: dayOf(state.t), nights: 0, x, y };
  state.rowsSeen[d.row + "@" + d.block.id] = d.row;
  const lh = lightHome();
  if (lh > state.stats.farthest) { state.stats.farthest = lh; state.stats.farthestName = d.name; }
  // arrival passage
  const band = timeBand(clockOf(state.t));
  const pool = ((CONTENT.events && CONTENT.events.arrive) || []).filter((a) => (a.when === band) && kindOk(a, d.kinds));
  const pass = pool.length ? fill(d, makeRng(hash32("arr", x, y, state.t)).pick(pool).t, hash32("arrf", x, y, state.t)) : "The platform is lit and busy.";
  logEntry(pass, "arrive", { title: "Station Ring " + state.ring + ", " + d.name });
}

function glideTo(dx, dy) {
  const nx = state.x + dx, ny = state.y + dy;
  if (!inRaft(nx, ny)) return false;
  const hops = Math.abs(dx) + Math.abs(dy);
  const turns = dx !== 0 && dy !== 0 ? 1 : 0;
  const mins = hops * (WORLD.HOP_S / 60) + turns * 1 + 2;
  advance(mins);
  state.stats.glides += hops;
  state.stats.distKm += hops * WORLD.PITCH_KM;
  state.route.push([nx, ny, dayOf(state.t), "glide"]);
  if (state.route.length > 600) state.route.splice(1, 1);
  const g = (CONTENT.events && CONTENT.events.glide) || [];
  if (g.length) logEntry(fill(here(), makeRng(hash32("gl", state.t)).pick(g), hash32("glf", state.t)), "glide", { title: hops === 1 ? "The Glide, 140 seconds" : "The Glide, " + hops + " hops" });
  arriveAt(nx, ny, "glide");
  return true;
}

function cyclerQuote(tx, ty, speed) {
  const dkm = distKm(state.x, state.y, tx, ty);
  const fare = { 2: 1.1, 5: 7, 20: 111 }[speed];
  let hours;
  if (speed === 20) hours = dkm / 20 / 3600 + 2 * (34 / 60) + 2;
  else hours = dkm / speed / 3600 + 12;
  return { dkm, fare, hours, days: hours / 24 };
}

function boardCycler(tx, ty, speed) {
  const q = cyclerQuote(tx, ty, speed);
  if (state.purse < q.fare) return { ok: false, why: "That fare is " + fmtKwh(q.fare) + " kWh and the purse holds " + fmtKwh(state.purse) + "." };
  spend(q.fare, speed === 20 ? "an express cycler leg" : "a cycler fare");
  state.stats.fares += q.fare;
  state.stats.legs += 1;
  state.stats.distKm += q.dkm;
  state.transit = { fromX: state.x, fromY: state.y, tx, ty, speed, depart: state.t, arrive: state.t + q.hours * 60, fare: q.fare, dkm: q.dkm, shown: 0 };
  state.view = "cycler";
  const nights = Math.floor(q.hours / 24);
  state.stats.nightsAboard += nights;
  logEntry((speed === 20 ? "Express cycler" : speed === 5 ? "A middling cycler" : "The slow line") + " from " + here().name + " toward " + drumNameAt(tx, ty) + ", " + blockAt(tx, ty).theme.row + ": " + fmtDist(q.dkm) + ", about " + (q.days < 1.5 ? Math.round(q.hours) + " hours" : Math.round(q.days) + " days") + ", " + fmtKwh(q.fare) + " kWh.", "cycler", { title: "Boarding by capsule" });
  return { ok: true, q };
}

function cyclerVignette(i) {
  const pool = ((CONTENT.events && CONTENT.events.cycler) || []);
  const express = state.transit && state.transit.speed === 20;
  const tr0 = state.transit;
  const homeward = tr0 ? Math.hypot(tr0.tx - state.player.hx, tr0.ty - state.player.hy) < Math.hypot(tr0.fromX - state.player.hx, tr0.fromY - state.player.hy) : false;
  const p2 = pool.filter((s) => (express ? /^Express:/.test(s) : !/^Express:/.test(s)) &&
    !(homeward && /(longer|lengthen|further|farther|grow|stretch)/i.test(s) && /(home|light|second|delay)/i.test(s)) &&
    !(!homeward && /(shorter|shrink|closer to home|nearer home)/i.test(s)));
  const r = makeRng(hash32("cyc", state.transit ? state.transit.depart : 0, i));
  const s = p2.length ? r.pick(p2) : "The train runs on.";
  return fill(here(), s.replace(/^Express:\s*/, ""), hash32("cycf", i, state.t));
}

function finishCycler() {
  const tr = state.transit;
  if (!tr) return;
  state.t = Math.round(tr.arrive);
  // the dividend accrues aboard
  const days = Math.floor(tr.arrive / DAY) - Math.floor(tr.depart / DAY);
  state.purse += days * (6 + (state.dark ? 9.6 : 0));
  if (state.dark) state.darkDays += days;
  state.route.push([tr.tx, tr.ty, dayOf(state.t), "cycler"]);
  state.transit = null;
  arriveAt(tr.tx, tr.ty, "cycler");
}

/* --- guest-right and nights --- */
function lodgingFor(d) {
  if (d.guestRight && state.nightsHere < 3) return { kind: d.open ? "margin" : "guest", cost: 0, label: d.open ? "a Margin flat on guest-right" : "a guest flat on guest-right" };
  if (d.sub === "thin") return { kind: "thin", cost: 0.8, label: "a hot-bunk inn on the Low decks" };
  return { kind: "inn", cost: 2, label: "an inn on the Low decks" };
}

function sleep() {
  const d = here();
  const lodge = lodgingFor(d);
  if (lodge.cost > state.purse) return { ok: false, why: "An inn here costs " + fmtKwh(lodge.cost) + " kWh. The purse is short. Try a drum that keeps guest-right." };
  spend(lodge.cost, lodge.label);
  const c = clockOf(state.t);
  let wake = d.lampsUp + 15;
  let mins = (wake - c + DAY) % DAY;
  if (mins < 150) mins += DAY;   // a nap is not a night
  advance(mins);
  state.nightsHere += 1;
  state.sleptHere = true;
  const v = state.visited[d.key]; if (v) v.nights = (v.nights || 0) + 1;
  const pool = ((CONTENT.events && CONTENT.events.nights) || []).filter((n) => n.where === lodge.kind || (lodge.kind === "guest" && n.where === "margin"));
  const t = pool.length ? fill(d, makeRng(hash32("night", d.x, d.y, state.t)).pick(pool).t, hash32("nf", state.t)) : "You sleep well.";
  logEntry(t, "night", { title: lodge.cost === 0 ? "A night on guest-right" : lodge.kind === "thin" ? "A night in a hot-bunk inn" : "A night at an inn on the Low decks" });
  state.view = "platform";
  return { ok: true };
}

function waitHours(h) { advance(h * 60); }

/* --- the Hollow --- */
function hollowAccess(d) {
  const g = d.rules.guests || { access: "free" };
  const c = clockOf(state.t);
  const s = sunlineAt(d, c);
  const night = s.phase === "night";
  const r = makeRng(hash32("lottery", d.x, d.y, dayOf(state.t)));
  switch (g.access) {
    case "paid": return { ok: true, cost: g.kwh || 3, where: "floor", note: "An hour on the floor, bought at the auction." };
    case "lottery": return r.chance(0.6) ? { ok: true, cost: 0, where: "floor", note: "Your lottery ticket came up." } : { ok: true, cost: 0, where: "terrace", note: "No luck in today's lottery. The end-wall terraces are open to anyone." };
    case "night": return night ? { ok: true, cost: 0, where: "terrace", note: "The terraces are open in the lamp-night." } : { ok: false, why: "Guests may only come up in the lamp-night here." };
    case "terraces": return { ok: true, cost: 0, where: "terrace", note: "Guests have the end-wall terraces." };
    default: return { ok: true, cost: 0, where: "floor", note: "Guests get an hour on the floor." };
  }
}

function goHollow(viewPick) {
  const d = here();
  const acc = hollowAccess(d);
  if (!acc.ok) return acc;
  if (acc.cost > state.purse) return { ok: false, why: "An hour costs " + fmtKwh(acc.cost) + " kWh here." };
  spend(acc.cost, "an hour in the Hollow");
  advance(8);
  const s = sunlineAt(d, clockOf(state.t));
  let view = viewPick || (acc.where === "terrace" ? "terrace" : (d.hollow.lake > 0.05 && makeRng(hash32("hv", d.x, d.y, dayOf(state.t))).chance(0.5) ? "lake" : "floor"));
  state.view = "hollow";
  state.hollowView = view;
  state.stats.hollow += 1;
  const when = s.phase;
  const pool = ((CONTENT.events && CONTENT.events.hollow) || []).filter((h) => h.when === when && kindOk(h, d.kinds) && (!h.tags || h.tags.some((t) => d.hollowTags.indexOf(t) >= 0) || h.tags.length === 0));
  const pool2 = pool.length ? pool : ((CONTENT.events && CONTENT.events.hollow) || []).filter((h) => h.when === when);
  const t = pool2.length ? fill(d, makeRng(hash32("hol", d.x, d.y, state.t)).pick(pool2).t, hash32("holf", state.t)) : "The far bank hangs overhead.";
  logEntry(acc.note + " " + t, "hollow", { title: "The Hollow at " + phaseName(d, state.t) });
  advance(60);
  return { ok: true };
}

function goSpindle() {
  const d = here();
  const s = sunlineAt(d, clockOf(state.t));
  advance(10);
  state.view = "hollow";
  state.hollowView = s.I < 0.14 ? "spindle" : "terrace";
  state.stats.spindle += 1;
  const lf = festivalOn(dayOf(state.t)) === "booking" && d.open && s.I < 0.14;
  const F = (CONTENT.events && CONTENT.events.festivals) || {};
  const pool = lf && F.longflight && F.longflight.length ? F.longflight : ((CONTENT.events && CONTENT.events.spindle) || []);
  const t = pool.length ? fill(d, makeRng(hash32("sp", state.t)).pick(pool), hash32("spf", state.t)) : "You fly the axis.";
  const sleeves = state.spoons && state.hasSleeves ? "" : " Sleeves hired at the gate for a fifth of a kWh.";
  if (!state.hasSleeves) spend(0.2, "hired wing-sleeves");
  logEntry(t + sleeves, "spindle", { title: s.I < 0.14 ? "The Spindle in the lamp-night" : "The flying halls" });
  advance(60);
  return { ok: true };
}

function waitForPhase(target) {
  // advance to the start of the drum's next dawn (or dusk)
  const d = here();
  const c = clockOf(state.t);
  const s = sunlineAt(d, c);
  let goal = target === "dawn" ? s.dawnStart : s.fullEnd;
  let mins = (goal - c + DAY) % DAY;
  advance(mins + 70);
  state.view = "hollow";
  state.hollowView = "terrace";
  state.stats.dawns += 1;
  const pal = d.palette;
  const by = pal.by ? " by " + pal.by : "";
  logEntry("You find a place on the end-wall terraces before the " + (target === "dawn" ? "dawn" : "dusk") + ". Tonight's sequence is “" + pal.name + "”" + by + ". " + (pal.note || ""), "paint", { title: target === "dawn" ? "A painted dawn" : "A painted dusk" });
  return { ok: true };
}

/* --- the Window and the back crews --- */
function goWindow() {
  const d = here();
  if (!d.windows.keeps) return { ok: false, why: d.name + " keeps no Windows." };
  if (!d.windows.guests) return { ok: false, why: d.name + "'s Windows are for its own eight-year-olds. Guests aren't taken." };
  advance(90);
  state.view = "window";
  state.windowStart = performance.now();
  state.stats.windows += 1;
  const W = (CONTENT.events && CONTENT.events.window) || [];
  const wr = makeRng(hash32("win", d.x, d.y, state.t));
  const pickW = (stage) => { const p = W.filter((w) => w.stage === stage); return p.length ? fill(d, wr.pick(p).t, hash32("winf", stage, state.t)) : ""; };
  state.windowCaps = ["approach", "wait", "open", "after"].map(pickW).filter(Boolean);
  if (!state.windowCaps.length) state.windowCaps = ["Through the back axle, where the drum's heat goes out as a river of ammonia, into a chamber that slowly stops turning, and out along a shielded track to the gallery. Twenty minutes in the red light, for your eyes."];
  logEntry(state.windowCaps.join(" "), "window", { title: "The Window" });
  advance(120);
  return { ok: true };
}

function backShift() {
  const d = here();
  if (!d.backcrew) return { ok: false, why: "The back crews here don't take guests." };
  advance(45);
  state.view = "window";
  state.windowStart = performance.now();
  state.stats.shifts += 1;
  const pool = (CONTENT.events && CONTENT.events.backcrew) || [];
  const pick = (stage) => { const p = pool.filter((b) => b.stage === stage); return p.length ? fill(d, makeRng(hash32("bc", stage, state.t)).pick(p).t, hash32("bcf", stage)) : ""; };
  state.windowCaps = [pick("start"), pick("work"), pick("sky"), pick("end")].filter(Boolean);
  logEntry(state.windowCaps.join(" "), "backcrew", { title: "Eight hours behind the radiators" });
  advance(8 * 60);
  return { ok: true };
}

/* --- eating, events, people --- */
function eatCounter() {
  const d = here();
  const extra = ((CONTENT.food && CONTENT.food.counter) || []).filter((c) => !c.kwh);
  const bit = extra.length ? " and " + makeRng(hash32("ctr", d.x, d.y, dayOf(state.t))).pick(extra).t : " and a sticky rice ball";
  advance(15);
  state.stats.meals += 1;
  logEntry("A cup of Mill broth from the Ring " + state.ring + " hatch, " + d.broth + bit + ". Free, as everywhere.", "food", { title: "The ring counter" });
  return { ok: true };
}

function eatAt(i) {
  const d = here();
  const p = d.eat[i];
  if (!p) return { ok: false };
  const free = p.guestFree && d.guestRight;
  const cost = free ? 0 : p.price || 0;
  if (cost > state.purse) return { ok: false, why: p.name + " is about " + fmtKwh(cost) + " kWh a head." };
  spend(cost, "dinner at " + p.name);
  advance(75);
  state.stats.meals += 1;
  const dish = p.dishes && p.dishes.length ? p.dishes[Math.floor(makeRng(hash32("dish", state.t)).range(0, p.dishes.length))][0] : "the house dish";
  logEntry("You eat at " + p.name + (cost ? " (" + fmtKwh(cost) + " kWh)" : free ? " on guest-right" : "") + ". " + dish + ". " + (p.tip || ""), "food", { title: p.name });
  return { ok: true };
}

function eatHall() {
  const d = here();
  const c = clockOf(state.t);
  if (timeBand(c) !== "evening") { const wait = (18 * 60 - c + DAY) % DAY; if (wait < 16 * 60) advance(wait); }
  const cost = d.guestRight ? 0 : 3.5;
  if (cost > state.purse) return { ok: false, why: "Dinner at the hall is about 3.5 kWh here." };
  spend(cost, "dinner at the hall");
  advance(90);
  state.stats.meals += 1;
  const ht = (typeof hallTonight === "function" && hallTonight(d)) || "whatever the aunts made";
  const pool = ((CONTENT.events && CONTENT.events.tonight) || []).filter((e) => e.act === "hall" && kindOk(e, d.kinds));
  const extra = pool.length ? " " + fill(d, makeRng(hash32("halle", d.x, d.y, state.t)).pick(pool).d, hash32("hallef", state.t)) : "";
  logEntry("Dinner at the " + d.neighbourhoods[0] + " hall, one long table" + (cost ? "" : ", free on guest-right") + ": " + ht + "." + extra, "food", { title: "The long table" });
  state.view = "platform";
  return { ok: true };
}

function attendEvent(i) {
  const d = here();
  const evs = tonightFor(d, dayOf(state.t));
  const e = evs[i];
  if (!e) return { ok: false };
  if (e.cost > state.purse) return { ok: false, why: "That costs " + fmtKwh(e.cost) + " kWh." };
  spend(e.cost, e.t);
  const startAt = eventStart(e);
  const c = clockOf(state.t);
  if (startAt !== null) { const wait = (startAt - c + DAY) % DAY; if (wait > 15 && wait < 16 * 60) advance(wait); }
  advance(120);
  state.stats.events += 1;
  if (e.act === "flight" || e.act === "swell" || e.act === "lake" || e.act === "paint") { state.view = "hollow"; state.hollowView = e.act === "flight" ? "spindle" : e.act === "paint" ? "terrace" : "lake"; }
  logEntry(e.d, "event", { title: e.t });
  return { ok: true };
}

function eventStart(e) {
  const c = clockOf(state.t);
  const at = { dawn: 6 * 60, day: 11 * 60, evening: 19 * 60, night: 22 * 60 + 30 }[e.when];
  if (at === undefined) return null;
  const band = timeBand(c);
  if (band === e.when) return null;
  return at;
}
function eventGoLabel(e) {
  const at = eventStart(e);
  return at === null ? "Go now · 2 h" : "Go at " + fmtClock(at) + " · 2 h";
}

function meetPerson(p) {
  if (!state.met.find((m) => m.name === p.name)) {
    state.met.push({ name: p.name, role: p.role, drum: here().name, day: dayOf(state.t) });
    if (state.met.length > 400) state.met.shift();
  }
}

function toggleDark() {
  state.dark = !state.dark;
  logEntry(state.dark
    ? "You tie a black thread round your left wrist and switch your worlds off. Your purse gains the day's 9.6 kWh of compute for as long as you keep it on."
    : "You take off the black thread and switch your worlds back on. Messages arrive in a heap, postmarked with their light delays.", "note", { title: state.dark ? "Going dark" : "Back on" });
}

function leaveSpoon() {
  const d = here();
  if (state.spoons.indexOf(d.name) >= 0) return { ok: false, why: "You already carry a spoon of " + d.name + "'s starter." };
  state.spoons.push(d.name);
  logEntry("You take a spoon of " + d.name + "'s starter for your crock and leave a spoon of the last one. The Gate registers it with the strain library in a minute and a half.", "starter", { title: "Take a spoon, leave a spoon" });
  return { ok: true };
}

function giveSpoons() {
  const n = state.spoons.length;
  state.raftLoaf = { day: dayOf(state.t), spoons: n };
  const list = state.spoons.slice(-4).join(", ");
  logEntry("Pell takes your " + n + " spoon" + (n > 1 ? "s" : "") + " of starter, " + list + (n > 4 ? " and the rest" : "") + ", sends them through Spelt's Gate to be registered, and adds them to this year's mother. “Half of them are lies,” he says, “and I'll take those too.” He gives you a heel of the raft loaf for the road. It tastes of everywhere.", "starter", { title: "The raft loaf" });
  return { ok: true };
}

/* --- cards --- */
function cardContext() {
  const d = here();
  const since = [];
  for (const e of state.log) {
    if (e.at !== d.name) break;
    since.push((e.title ? e.title + ": " : "") + e.text);
    if (since.length > 6) break;
  }
  return { d, since: since.reverse() };
}

function templateCard(recipient) {
  const { d } = cardContext();
  const pool = ((CONTENT.events && CONTENT.events.cards) || []);
  const day = dayOf(state.t);
  let sit = day <= 2 && d.name === state.player.home ? "first" : state.view === "window" ? (state.stats.shifts && state.log[0] && state.log[0].kind === "backcrew" ? "backcrew" : "window") : state.view === "hollow" ? (state.hollowView === "spindle" ? "spindle" : "hollow") : lightHome() > 25 ? "far" : d.sub;
  let p = pool.filter((c) => c.for === sit);
  if (!p.length) p = pool.filter((c) => c.for === "drum");
  const r = makeRng(hash32("card", state.t, strHash(recipient || "")));
  const base = p.length ? r.pick(p).t : "I'm in {drum}. More soon.";
  const t = base.replace(/\{light\}/g, fmtSec(lightHome()).replace(" s", " seconds")).replace(/\{day\}/g, String(day)).replace(/\{home\}/g, state.player.home);
  return fill(d, t, hash32("cardf", state.t));
}

function sendCard(recipient, text, frontURL, frontLabel) {
  const d = here();
  const card = {
    id: "c" + state.t + "-" + state.cards.length,
    day: dayOf(state.t), t: state.t, to: recipient, text,
    drum: d.name, row: d.row, sub: d.sub, light: lightHome(), front: frontURL, frontLabel,
  };
  state.cards.push(card);
  logEntry("A card to " + recipient + ", sent by light. It will be read " + fmtSec(card.light) + " from now.", "card", { title: "A card home" });
  return card;
}

/* --- save and load --- */
function saveGame() {
  if (!state) return;
  // keep card images for the most recent 40 only, to stay small
  const copy = Object.assign({}, state);
  copy.cards = state.cards.map((c, i) => (i < state.cards.length - 40 ? Object.assign({}, c, { front: null }) : c));
  storageSet(SAVE_KEY, JSON.stringify(copy));
}
function loadGame() {
  const raw = storageGet(SAVE_KEY);
  if (!raw) return null;
  try { const s = JSON.parse(raw); if (s && s.v === 1) return s; } catch (e) { /* ignore */ }
  return null;
}
