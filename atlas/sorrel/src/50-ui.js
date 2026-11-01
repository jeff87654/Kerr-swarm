/* ---------- the page around the drawing ---------- */

const UI = { card: null, home: null, homeName: "Ashgrove", log: { doors: [], places: [], recent: [] }, hashGuard: null };

function paras(t) { return String(t).split(/\n\s*\n/).map(p => `<p>${esc(p.trim())}</p>`).join(""); }

function hourCard(h) {
  const H = HOURS[h - 1] || {};
  const sections = [];
  if (H.known) sections.push({ h: "What Sorrel says", t: H.known });
  if (H.word && H.word.w) sections.push({ h: "A word of its own", t: `“${H.word.w}”: ${H.word.means}` });
  if (H.dish && H.dish.name) sections.push({ h: "Its dish", t: `${cap(H.dish.name)}. ${H.dish.text || ""}`.trim() });
  if (H.club) sections.push({ h: "In the Round", t: H.club });
  if (H.saying) sections.push({ h: "A saying", t: H.saying });
  if (H.rivalry) sections.push({ h: `Overhead · ${HOUR_NAMES[oppositeHour(h)]}`, t: H.rivalry });
  const inHour = PLACES.filter(p => p.spot.hour === h && p.zone !== "beyond" && p.zone !== "axle").length;
  sections.push({ h: "In the atlas", t: `${inHour} landmarks, and about ${fmtInt(DOORS / 12)} neighbourhoods: some 16.7 million people in a wedge from the Keel to the Hollow, all along the drum.` });
  return {
    type: "hour", id: "hour-" + HOUR_NAMES[h].toLowerCase(), title: `The Hour of the ${HOUR_NAMES[h]}`,
    kicker: `Hour ${WORDS[h]} of twelve · ${H.colours || ""}`.replace(/ · $/, ""),
    addr: `${(h - 1) * 30}°–${h * 30}° spinward · ${fmtDist(TAU * DRUM.R / 12)} of rim · ${fmtDist(TAU * DRUM.FLOOR / 12)} of Hollow floor`,
    text: H.character || "", sections, spot: { zone: "hour", z: DRUM.L / 2, r: 2200, theta: hourCenter(h) }, swatch: H.hex,
  };
}

function ringCard(i) {
  const R = RINGS[i - 1] || {};
  const sections = [];
  if (R.quaysides) sections.push({ h: `Station Ring ${WORDS[i]}`, t: R.quaysides });
  if (R.lanes) sections.push({ h: "Trains to", t: cap(R.lanes) + "." });
  if (R.known) sections.push({ h: "What Sorrel says", t: R.known });
  const n = PLACES.filter(p => p.spot.ring === i && !["beyond", "axle"].includes(p.zone)).length;
  sections.push({ h: "In the atlas", t: `${n} landmarks along this slice of the drum, Keel to Hollow.` });
  return {
    type: "ring", id: "ring-" + i, title: R.name || "Ring " + WORDS[i], kicker: `Ring ${WORDS[i]} of nine${R.nick ? " · “" + R.nick + "”" : ""}`,
    addr: `${fmtInt((i - 1) * DRUM.RING_W)}–${fmtInt(i * DRUM.RING_W)} m from the front cap${i === 1 ? " (the power end)" : i === 9 ? " (the heat end)" : ""}`,
    text: R.character || "", sections, spot: { zone: "ring", z: ringCenter(i), r: 2250, theta: MAP.theta },
  };
}

/* ---- the card ---- */
function routeSpots(from, to, via) {
  if (!from || !to || !["deck", "keel", "line", "hollow", "wall", "spindle", "axle"].includes(to.zone)) return null;
  const pts = [{ z: from.z, r: from.r }];
  const toR = to.zone === "deck" || to.zone === "keel" || to.zone === "line" ? to.r : deckR(375);
  const toZ = ["wall", "spindle", "axle"].includes(to.zone) ? (to.wall === "front" || to.z < DRUM.L / 2 ? 300 : DRUM.L - 300) : to.z;
  if (via) { pts.push({ z: from.z, r: via.r - 4 }); pts.push({ z: toZ, r: via.r - 4 }); pts.push({ z: toZ, r: toR }); }
  else { pts.push({ z: from.z, r: toR }); pts.push({ z: toZ, r: toR }); }
  if (to.zone !== "deck" && to.zone !== "keel" && to.zone !== "line") pts.push({ z: to.z, r: to.r });
  return pts;
}

/* ---- tours: a few hand-picked walks through the drum ---- */
const TOURS = (Array.isArray(D.tours) ? D.tours : []).map(t => Object.assign({}, t, { stops: (t.stops || []).filter(s => PLACE_BY_ID.has(s.id || s)).map(s => typeof s === "string" ? { id: s } : s) })).filter(t => t.stops.length > 1);

function tourHTML(cd) {
  const T = UI.tour;
  if (!T || cd.type !== "landmark") return "";
  const tour = TOURS.find(t => t.id === T.id);
  if (!tour || !tour.stops[T.i] || tour.stops[T.i].id !== cd.id) return "";
  const stop = tour.stops[T.i], next = tour.stops[T.i + 1];
  let h = `<div class="tourbar"><div class="label">${esc(tour.name)} · stop ${T.i + 1} of ${tour.stops.length}</div>`;
  if (stop.note) h += `<p class="tournote">${esc(stop.note)}</p>`;
  h += `<div class="card-actions">`;
  if (T.i > 0) h += `<button type="button" class="tool" data-tour="prev">‹ Back</button>`;
  h += next ? `<button type="button" class="tool primary" data-tour="next">Next: ${esc(PLACE_BY_ID.get(next.id).name)} ›</button>` : `<button type="button" class="tool primary" data-tour="end">Finish the walk</button>`;
  if (next) h += `<button type="button" class="tool" data-tour="end">Leave the walk</button>`;
  h += `</div></div>`;
  return h;
}

function startTour(id, i = 0) {
  const tour = TOURS.find(t => t.id === id);
  if (!tour) return;
  UI.tour = { id, i };
  MAP.walk = tour.stops.map(s => PLACE_BY_ID.get(s.id));
  MAP.walkAt = i;
  openPlace(tour.stops[i].id);
}
function endTour() { UI.tour = null; MAP.walk = null; MAP.dirty = true; }

function renderCard(cd) {
  const el = $("#card");
  let h = `<article class="card">`;
  h += tourHTML(cd);
  h += `<div class="card-top"><div class="card-kind">`;
  if (cd.type === "landmark") h += `<span class="dot" aria-hidden="true"></span>`;
  if (cd.swatch) h += `<span class="dot" aria-hidden="true" style="background:${esc(cd.swatch)}"></span>`;
  h += `<span>${esc(cd.kicker)}</span>`;
  if (cd.generated) h += `<span class="gen">· generated</span>`;
  h += `</div><h2 class="card-name">${esc(cd.title)}</h2>`;
  if (cd.addr) h += `<div class="card-addr">${esc(cd.addr)}</div>`;
  h += `</div>`;
  if (cd.sub) h += `<p class="card-type">${esc(cd.sub)}</p>`;
  if (cd.text) h += `<div class="card-text">${paras(cd.text)}</div>`;
  if (cd.detail) h += `<div class="sect detail"><h3>Good to know</h3><p>${esc(cd.detail)}</p></div>`;
  const whoHTML = w => `<p class="who"><q>${esc(w.line)}</q><span class="whoname">${esc(w.name)}${w.age ? ", " + w.age : ""}${w.role ? ", " + esc(w.role) : ""}</span></p>`;
  if (cd.who && cd.type === "landmark") h += `<div class="sect"><h3>Who you might meet</h3>${whoHTML(cd.who)}</div>`;
  if (cd.sections) cd.sections.forEach((s, i) => {
    if (cd.type === "door" && cd.who && s.h === "Only here") h += `<div class="sect"><h3>A neighbour</h3>${whoHTML(cd.who)}</div>`;
    if (s.t) h += `<div class="sect"><h3>${esc(s.h)}</h3><p>${esc(s.t)}</p></div>`;
    if (cd.type === "door" && cd.who && s.h === "The argument" && !cd.sections.some(x => x.h === "Only here")) h += `<div class="sect"><h3>A neighbour</h3>${whoHTML(cd.who)}</div>`;
  });
  if (cd.gauges && cd.gauges.length) h += `<div class="gauges">${cd.gauges.map(g => `<div class="gauge"><span class="v">${esc(g.v)}</span><span class="k">${esc(g.k)}</span></div>`).join("")}</div>`;
  // the way there
  const isPlace = cd.spot && !["hour", "ring"].includes(cd.spot.zone);
  if (isPlace && UI.home) {
    const here = UI.home && Math.abs(UI.home.z - cd.spot.z) < 1 && Math.abs(UI.home.r - cd.spot.r) < 1;
    const rt = here ? null : route(UI.home, Object.assign({ title: cd.title }, cd.spot));
    if (here) h += `<div class="sect route"><h3>Getting there</h3><p class="total">This is home.</p></div>`;
    else if (rt) {
      h += `<div class="sect route"><h3>Getting there from ${esc(UI.homeName)}</h3>`;
      h += `<p class="total">${rt.t != null ? `<b>${fmtDur(rt.t)}</b> door to door by the Lattice` : esc(rt.note || "")}</p>`;
      h += `<ol>${rt.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol></div>`;
    }
  }
  // wandering from a door
  if (cd.type === "door" && cd.block) {
    h += `<div class="sect"><h3>Wander</h3><div class="card-actions">`;
    for (const [dir, lab] of [["spin", "Spinward"], ["anti", "Antispinward"], ["up", "Up, toward the Hollow"], ["down", "Down, toward the rim"], ["front", "Toward the front"], ["back", "Toward the back"]]) {
      if (neighbourBlock(cd.block, dir)) h += `<button type="button" class="tool" data-wander="${dir}">${lab}</button>`;
    }
    h += `</div></div>`;
  }
  if (cd.type === "hour") {
    h += `<div class="sect"><h3>Look round</h3><div class="card-actions"><button type="button" class="tool" data-anyin="${HOUR_NAMES.indexOf(cd.title.replace("The Hour of the ", ""))}">Open a door in this Hour</button></div></div>`;
  }
  // nearby landmarks
  if (isPlace && cd.spot.zone !== "beyond") {
    const near = nearestPlaces(cd.spot, 4, cd.place && cd.place.id);
    if (near.length) h += `<div class="sect near"><h3>Nearby landmarks</h3><ul>${near.map(n => `<li><button type="button" class="linkbtn" data-place="${esc(n.p.id)}">${esc(n.p.name)}</button><span class="d">${esc(nearWhere(n.p, cd.spot))}</span></li>`).join("")}</ul></div>`;
  }
  const acts = [];
  if (isPlace && ["deck", "keel", "line", "hollow", "wall"].includes(cd.spot.zone)) acts.push(`<button type="button" class="tool" data-act="home">Make this home</button>`);
  if (cd.type === "landmark" && ["deck", "keel", "line", "hollow", "wall"].includes(cd.spot.zone)) acts.push(`<button type="button" class="tool" data-act="near">Open a door nearby</button>`);
  if (acts.length) h += `<div class="card-actions">${acts.join("")}</div>`;
  if (cd.tags && cd.tags.length || cd.canon) h += `<div class="tags">${cd.canon ? `<span class="tag canon" title="This place is in the world bible">in ${esc(cd.canon)}</span>` : ""}${(cd.tags || []).slice(0, 6).map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>`;
  h += `</article>`;
  el.innerHTML = h;
  $("#cardcol").scrollTop = 0;
}

function nearWhere(p, from) {
  const s = p.spot;
  if (p.zone === "deck" || p.zone === "keel" || p.zone === "line") {
    const dd = (p.deck || 0) - (from.deck || deckAtR(from.r));
    const dir = !from.deck && from.zone !== "deck" ? `deck ${p.deck}` : dd === 0 ? "same deck" : `${Math.abs(dd)} decks ${dd > 0 ? "up" : "down"}`;
    return `${dir} · ${HOUR_NAMES[s.hour]} · Ring ${WORDS[s.ring]}`;
  }
  return `${GROUPS.find(g => g.id === climbGroup(p)).name} · ${HOUR_NAMES[s.hour] || ""}`;
}

function neighbourBlock(b, dir) {
  const s = b.stratum;
  if (dir === "spin") return makeBlock(s, b.a, (b.k + 1) % s.N);
  if (dir === "anti") return makeBlock(s, b.a, (b.k - 1 + s.N) % s.N);
  if (dir === "front") return b.a > 0 ? makeBlock(s, b.a - 1, b.k) : null;
  if (dir === "back") return b.a < 17 ? makeBlock(s, b.a + 1, b.k) : null;
  if (s.kind !== "res") return null;
  const i = s.index + (dir === "up" ? 1 : -1);
  const t = STRATA[i];
  if (!t) return null;
  return makeBlock(t, b.a, Math.floor((b.k + 0.5) / s.N * t.N) % t.N);
}

/* ---- opening places ---- */
function setHash(id) {
  UI.hashGuard = id;
  try { if (location.hash !== "#" + id) location.hash = id; } catch (e) { /* frame may refuse */ }
}

function logSeen(cd) {
  const L = UI.log;
  if (cd.type === "door") { if (!L.doors.includes(cd.block.door)) L.doors.push(cd.block.door); }
  else if (cd.type === "landmark") { if (!L.places.includes(cd.id)) L.places.push(cd.id); }
  if (["door", "landmark"].includes(cd.type)) {
    L.recent = [{ id: cd.id, t: cd.title }].concat(L.recent.filter(x => x.id !== cd.id)).slice(0, 8);
    if (L.doors.length > 5000) L.doors = L.doors.slice(-5000);
    storeSet("sorrel-atlas-log", L);
  }
  renderLedger();
}

function openCard(cd, opts = {}) {
  if (!cd) return;
  UI.card = cd;
  renderCard(cd);
  MAP.selPlace = cd.type === "landmark" ? cd.id : null;
  MAP.sel = cd.spot && !["hour"].includes(cd.spot.zone) ? Object.assign({ block: cd.block || null }, cd.spot) : null;
  if (cd.type === "hour") MAP.sel = null;
  let rt = null;
  if (UI.home && cd.spot && !["hour", "ring", "beyond"].includes(cd.spot.zone)) {
    try { rt = route(UI.home, Object.assign({ title: cd.title }, cd.spot)); } catch (e) { rt = null; }
  }
  MAP.routeSpots = rt && rt.t != null ? routeSpots(UI.home, cd.spot, rt.via) : null;
  const allRound = cd.place && !cd.place.hour;   // runs all the way round: leave the cut where it is
  if (cd.spot && cd.spot.theta != null && opts.turn !== false && !allRound) setTheta(cd.spot.theta, false);
  if (opts.fly && cd.spot) {
    if (cd.type === "hour") flyTo(fitView());
    else {
      const sNow = MAP.s;
      const sWant = cd.type === "ring" ? Math.max(sNow, 0.35) : opts.zoom || Math.max(sNow, cd.type === "door" || cd.type === "keel" || cd.type === "line" ? 1.25 : 0.6);
      flyTo(viewFor(cd.spot.z, cd.spot.r, sWant));
    }
  }
  MAP.dirty = true;
  if (cd.id && opts.hash !== false) setHash(cd.id);
  logSeen(cd);
  updatePeek(cd);
}

function openPlace(id, opts = {}) {
  const p = PLACE_BY_ID.get(id);
  if (p) openCard(landmarkCard(p), Object.assign({ fly: true }, opts));
}

function openDoor(door, opts = {}) {
  const b = blockFromDoor(door);
  if (b) openCard(doorCard(b), Object.assign({ fly: true }, opts));
}

function openBlock(b, opts = {}) {
  if (!b) return;
  const cd = b.kind === "res" ? doorCard(b) : b.kind === "keel" ? keelCard(b) : lineCard(b);
  openCard(cd, Object.assign({ fly: true, zoom: Math.max(MAP.s, 1.25) }, opts));
}

function openFromHash() {
  let id = "";
  try { id = decodeURIComponent((location.hash || "").slice(1)); } catch (e) { id = ""; }
  if (!id || id === UI.hashGuard) return false;
  UI.hashGuard = id;
  if (PLACE_BY_ID.has(id)) { openPlace(id, { hash: false }); return true; }
  let m;
  if ((m = /^door-(\d+)$/.exec(id)) && +m[1] >= 1 && +m[1] <= DOORS) { openDoor(+m[1], { hash: false }); return true; }
  if ((m = /^hour-([a-z]+)$/.exec(id))) { const h = HOUR_NAMES.findIndex(x => x.toLowerCase() === m[1]); if (h > 0) { openCard(hourCard(h), { fly: true, hash: false }); return true; } }
  if ((m = /^ring-(\d)$/.exec(id))) { openCard(ringCard(+m[1]), { fly: true, hash: false }); return true; }
  if ((m = /^(keel|line)-(\d+)-(\d+)-(\d+)$/.exec(id))) { const b = blockFromKey(`${m[1]}:${m[2]}:${m[3]}:${m[4]}`); if (b) { openBlock(b, { hash: false }); return true; } }
  return false;
}

/* ---- Hour picker and dial ---- */
function setTheta(t, fit) {
  MAP.theta = normTheta(t);
  const h = hourOfTheta(MAP.theta);
  $("#hour-name").innerHTML = `<b>${esc(HOUR_NAMES[h])}</b> <span class="mono">${esc(WORDS[h])}</span>`;
  $("#hour-name").setAttribute("aria-label", `The drawing cuts through the Hour of the ${HOUR_NAMES[h]}. Open its card.`);
  drawDial();
  $("#cutnote").textContent = `Cut through ${HOUR_NAMES[h]}; overhead, across the Hollow, ${HOUR_NAMES[oppositeHour(h)]}. Axis at the top, rim at the bottom: out is down.`;
  MAP.dirty = true;
  if (fit) flyTo(fitView(), 450);
}

function drawDial() {
  const svg = $("#dial");
  const h = hourOfTheta(MAP.theta);
  let out = "";
  for (let i = 1; i <= 12; i++) {
    // Hours run spinward; draw them clockwise from the top, as Sorrel's clocks do
    const a0 = (i - 1) * HOUR_W - Math.PI / 2, a1 = i * HOUR_W - Math.PI / 2;
    const R = 18, r0 = 8;
    const p = (a, rad) => `${(Math.cos(a) * rad).toFixed(2)} ${(Math.sin(a) * rad).toFixed(2)}`;
    const col = (HOURS[i - 1] && HOURS[i - 1].hex) || "#999";
    out += `<path d="M ${p(a0, r0)} L ${p(a0, R)} A ${R} ${R} 0 0 1 ${p(a1, R)} L ${p(a1, r0)} A ${r0} ${r0} 0 0 0 ${p(a0, r0)} Z" fill="${esc(col)}" opacity="${i === h ? 1 : 0.45}" stroke="var(--card)" stroke-width="0.8"><title>${esc(HOUR_NAMES[i])}</title></path>`;
  }
  const a = MAP.theta - Math.PI / 2;
  out += `<line x1="${(Math.cos(a + Math.PI) * 18).toFixed(2)}" y1="${(Math.sin(a + Math.PI) * 18).toFixed(2)}" x2="${(Math.cos(a) * 19.5).toFixed(2)}" y2="${(Math.sin(a) * 19.5).toFixed(2)}" stroke="var(--ink)" stroke-width="1.3"/>`;
  out += `<circle r="3" fill="var(--accent)"/>`;
  svg.innerHTML = out;
}

/* ---- the lamp clock ---- */
function clockPhase(min) {
  const h = min / 60;
  if (h >= 6 && h < 9) return "lamp-dawn";
  if (h >= 9 && h < 15) return "lamp-noon";
  if (h >= 15 && h < 18) return "dusk";
  return "lamp-night";
}
function setClock(min) {
  MAP.clock = ((min % 1440) + 1440) % 1440;
  $("#clock").value = String(MAP.clock);
  $("#clock-out").textContent = `${fmtClock(MAP.clock)} ${clockPhase(MAP.clock)}`;
  MAP.dirty = true;
}

/* ---- search ---- */
let SEARCH_SEL = -1;
function searchResults(q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const out = [];
  let m;
  if ((m = /^(?:deck\s*)?(\d{1,3})$/.exec(q)) && +m[1] >= 1 && +m[1] <= 376) {
    const n = +m[1];
    out.push({ kind: "deck", name: `Deck ${n}`, where: `${BAND_INFO[bandOfDeck(n)] ? BAND_INFO[bandOfDeck(n)].name : ""} · ${fmtG(gAt(deckR(n)))} · ${fmtDist(TAU * deckR(n))} round`, go: () => {
      const b = blockAt(DRUM.L / 2, deckR(n) - 2, MAP.theta);
      if (b) openBlock(b, { zoom: Math.max(MAP.s, 1.6) });
      else if (n === 376) openCard(floorCard(DRUM.L / 2, MAP.theta), { fly: true });
    } });
  }
  if ((m = /^ring\s*(\d)$/.exec(q)) && +m[1] >= 1 && +m[1] <= 9) out.push({ kind: "ring", name: (RINGS[+m[1] - 1] || {}).name || "Ring " + m[1], where: "A slice of the drum, Keel to Hollow", go: () => openCard(ringCard(+m[1]), { fly: true }) });
  for (let h = 1; h <= 12; h++) if (HOUR_NAMES[h].toLowerCase().startsWith(q) || WORDS[h].toLowerCase() === q) out.push({ kind: "hour", name: `The Hour of the ${HOUR_NAMES[h]}`, where: `Hour ${WORDS[h]}`, go: () => openCard(hourCard(h), { fly: true }) });
  RINGS.forEach((R, i) => { if (q.length > 2 && ((R.nick || "").toLowerCase().includes(q) || (R.name || "").toLowerCase().includes(q))) out.push({ kind: "ring", name: R.name, where: R.nick ? "“" + R.nick + "”" : "", go: () => openCard(ringCard(i + 1), { fly: true }) }); });
  const scored = [];
  for (const p of PLACES) {
    const name = p.name.toLowerCase();
    let sc = 0;
    if (name.startsWith(q) || name.replace(/^the /, "").startsWith(q)) sc = 3;
    else if (name.includes(q)) sc = 2;
    else if ((p.tags || []).some(t => t.toLowerCase().includes(q))) sc = 1.5;
    else if (q.length > 3 && ((p.blurb || "") + " " + (p.text || "")).toLowerCase().includes(q)) sc = 1;
    if (sc) scored.push({ sc, p });
  }
  scored.sort((a, b) => b.sc - a.sc || a.p.name.localeCompare(b.p.name));
  for (const { p } of scored.slice(0, 12)) out.push({ kind: KIND_SHORT[p.kind] || "place", name: p.name, where: landmarkCard(p).addr, go: () => openPlace(p.id) });
  if (q.length >= 3) {
    const idx = buildNameIndex();
    let n = 0;
    for (const [nm, doors] of idx) {
      if (!nm.includes(q)) continue;
      const b = blockFromDoor(doors[0]);
      out.push({ kind: "neighbourhood", name: theName(nbName(b), true), where: doors.length > 1 ? `${doors.length} neighbourhoods by this name; one at decks ${b.from}–${b.to}, Ring ${WORDS[b.ring]}, ${HOUR_NAMES[b.hour]}` : `Decks ${b.from}–${b.to} · Ring ${WORDS[b.ring]} · ${HOUR_NAMES[b.hour]}`, go: () => openDoor(doors[Math.floor(Math.random() * doors.length)]) });
      if (++n >= 6) break;
    }
  }
  return out.slice(0, 24);
}

function showResults(list) {
  const ul = $("#results");
  if (!list.length) { ul.hidden = true; ul.innerHTML = ""; return; }
  ul.innerHTML = list.map((r, i) => `<li><button type="button" data-i="${i}" class="${i === SEARCH_SEL ? "on" : ""}"><span class="r-name">${esc(r.name)}</span><span class="r-kind">${esc(r.kind)}</span><span class="r-where">${esc(r.where || "")}</span></button></li>`).join("");
  ul.hidden = false;
  ul._list = list;
}

/* ---- the ledger ---- */
function renderLedger() {
  const L = UI.log;
  const seen = L.doors.length;
  const left = DOORS - seen;
  const years = left / 365.25;
  const pct = seen / DOORS * 100;
  let h = `<div><span class="label">Your ledger</span></div>`;
  h += `<div>Doors opened: <b>${fmtInt(seen)}</b> of ${fmtInt(DOORS)} · landmarks: <b>${L.places.length}</b> of ${PLACES.length}</div>`;
  h += `<div class="meter" role="img" aria-label="${pct.toFixed(3)}% of Sorrel's neighbourhoods seen"><i style="width:${Math.max(pct, 0.15)}%"></i></div>`;
  h += `<div>At one a day, the rest would take <b>${years.toFixed(1)} years</b>: about ${(years / 120).toFixed(2)} lifetimes.</div>`;
  if (L.recent.length > 1) h += `<div class="seen">Lately: ${L.recent.slice(1, 6).map(x => `<button type="button" class="linkbtn" data-recent="${esc(x.id)}">${esc(x.t)}</button>`).join("")}</div>`;
  $("#ledger").innerHTML = h;
}

/* ---- mobile: a strip on the drawing that points at the card ---- */
function updatePeek(cd) {
  let p = $("#peek");
  if (!p) {
    p = document.createElement("button");
    p.id = "peek"; p.type = "button"; p.className = "peek";
    $("#frame").appendChild(p);
    p.addEventListener("click", () => $("#cardcol").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }));
  }
  p.innerHTML = `<span class="pk-k">${esc(cd.type === "door" ? "Neighbourhood" : cd.kicker || "")}</span><span class="pk-n">${esc(cd.title)}</span><span class="pk-go">Read ↓</span>`;
}

/* ---- the Climb ---- */
function renderChips() {
  const counts = {};
  for (const p of PLACES) counts[p.kind] = (counts[p.kind] || 0) + 1;
  const kinds = Object.keys(KINDS).filter(k => counts[k]);
  const on = MAP.kinds;
  $("#chips").innerHTML = `<button type="button" class="chip" data-kind="" aria-pressed="${!on}">All<span class="n">${PLACES.length}</span></button>` +
    kinds.map(k => `<button type="button" class="chip" data-kind="${k}" aria-pressed="${!!(on && on.has(k))}">${esc(KINDS[k])}<span class="n">${counts[k]}</span></button>`).join("");
}

function renderClimb() {
  const box = $("#climb-list");
  const show = p => !MAP.kinds || MAP.kinds.has(p.kind);
  let h = "";
  for (const g of GROUPS) {
    const items = CLIMB.filter(p => climbGroup(p) === g.id && show(p));
    if (!items.length) continue;
    h += `<section class="band" aria-label="${esc(g.name)}"><div class="band-head"><h3>${esc(g.name)}</h3><div class="swatch" style="background:var(${g.swatch})"></div><p>${esc(g.facts)}</p></div><ul class="entries">`;
    for (const p of items) {
      const cd = landmarkCard(p);
      h += `<li class="entry"><button type="button" data-place="${esc(p.id)}"><span class="e-name">${esc(p.name)}</span><span class="e-addr"><span class="e-kind">${esc(KIND_SHORT[p.kind] || "")}</span> · ${esc(cd.addr)}</span><span class="e-blurb">${esc(p.blurb || "")}</span></button></li>`;
    }
    h += `</ul></section>`;
  }
  box.innerHTML = h || `<p class="empty">No landmarks of that kind.</p>`;
}

/* ---- wiring ---- */
function anyDoor(hour) {
  for (let i = 0; i < 40; i++) {
    const d = 1 + Math.floor(Math.random() * DOORS);
    const b = blockFromDoor(d);
    if (!hour || b.hour === hour) { openCard(doorCard(b), { fly: true, zoom: Math.max(MAP.s, 1.4) }); return; }
  }
}

function initUI() {
  // the masthead's numbers
  const floor = (() => { let a = 0; for (let n = 1; n <= 376; n++) a += TAU * deckR(n) * DRUM.L; return a / 1e6; })();
  $("#lede-doors").textContent = fmtInt(Math.round(DOORS / 100) * 100);
  $("#lede-years").textContent = String(Math.round(DOORS / 365.25));
  const facts = [["People", "200,000,000"], ["Decks", "376"], ["Floor", `${fmtInt(Math.round(floor / 100) * 100)} km², about Wales`], ["Neighbourhoods", fmtInt(DOORS)], ["One turn", "110 s"], ["Landmarks", String(PLACES.length)]];
  $("#facts").innerHTML = facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
  $("#legend").innerHTML = [["--m-keel", "Keel"], ["--m-low", "Low"], ["--m-mid", "Middle"], ["--m-high", "High"], ["--m-line", "Line deck"]].map(([v, t]) => `<span><i style="background:var(${v})"></i>${t}</span>`).join("") +
    `<span><i style="background:var(--pin);border-radius:50%"></i>landmark in this Hour</span><span><i style="background:var(--card);border-color:var(--pin);border-radius:50%"></i>in another Hour</span>`;

  // home
  const ash = PLACE_BY_ID.get("ashgrove") || PLACES.find(p => /^ashgrove$/i.test(p.name));
  const storedHome = storeGet("sorrel-atlas-home", null);
  if (storedHome && storedHome.spot && typeof storedHome.spot.z === "number") { UI.home = storedHome.spot; UI.homeName = storedHome.name || "home"; }
  else if (ash) { UI.home = ash.spot; UI.homeName = ash.name; }
  else { UI.home = { zone: "deck", z: ringCenter(3), r: deckR(75) - 2, theta: hourCenter(4), deck: 75 }; UI.homeName = "Ashgrove"; }
  const lg = storeGet("sorrel-atlas-log", null);
  if (lg && Array.isArray(lg.doors)) UI.log = { doors: lg.doors.filter(Number.isFinite), places: Array.isArray(lg.places) ? lg.places : [], recent: Array.isArray(lg.recent) ? lg.recent : [] };

  // the map
  initMap($("#map"));
  MAP.onPick = (pin, z, r) => {
    if (pin) { openCard(landmarkCard(pin), { fly: false }); return; }
    const ri = ringOfZ(z);                                   // the Ring labels under the rim open their Ring
    if (r > 3085 && r < 3215 && Math.abs(z - ringCenter(ri)) < 80) { openCard(ringCard(ri), { fly: false, turn: false }); return; }
    const cd = cardAt(z, r, MAP.theta, MAP.clock);
    if (cd) openCard(cd, { fly: false, turn: false });
  };
  const tip = $("#tip");
  MAP.onHover = (x, y, pin) => {
    const prev = MAP.hoverPin;
    MAP.hoverPin = pin ? pin.id : null;
    if (prev !== MAP.hoverPin) MAP.dirty = true;
    if (x == null) { tip.hidden = true; return; }
    let html = "";
    if (pin) html = `<b>${esc(pin.name)}</b><span class="mono">${esc(landmarkCard(pin).addr)}</span><br>${esc(pin.blurb || "")}`;
    else {
      const z = wz(x), r = wr(y);
      if (z >= 0 && z <= DRUM.L && r > DRUM.FLOOR && r <= DRUM.R) {
        const n = deckAtR(r), b = blockAt(z, r, MAP.theta);
        const what = !b ? "" : b.kind === "res" ? theName(nbName(b), true) : b.kind === "line" ? `Line deck ${b.from}` : "The Keel";
        html = `<span class="mono">Deck ${n} · ${fmtG(gAt(r))} · Ring ${WORDS[ringOfZ(z)]}</span>${what ? `<b>${esc(what)}</b>` : ""}`;
      }
    }
    if (!html) { tip.hidden = true; return; }
    tip.innerHTML = html; tip.hidden = false;
    const fw = $("#frame").clientWidth;
    tip.style.left = Math.min(x + 14, fw - tip.offsetWidth - 6) + "px";
    tip.style.top = (y + 16) + "px";
  };

  // toolbar
  $("#hour-prev").addEventListener("click", () => setTheta(hourCenter((hourOfTheta(MAP.theta) + 10) % 12 + 1), false));
  $("#hour-next").addEventListener("click", () => setTheta(hourCenter(hourOfTheta(MAP.theta) % 12 + 1), false));
  $("#hour-name").addEventListener("click", () => openCard(hourCard(hourOfTheta(MAP.theta)), { fly: false }));
  $("#dial").addEventListener("click", e => {
    const b = $("#dial").getBoundingClientRect();
    const a = Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) + Math.PI / 2;
    setTheta(hourCenter(hourOfTheta(a)), false);
  });
  $("#clock").addEventListener("input", e => setClock(+e.target.value));
  $("#anydoor").addEventListener("click", () => anyDoor(null));
  $("#zin").addEventListener("click", () => zoomAt(MAP.W / 2, MAP.H / 2, 1.8));
  $("#zout").addEventListener("click", () => zoomAt(MAP.W / 2, MAP.H / 2, 1 / 1.8));
  $("#zfit").addEventListener("click", () => flyTo(fitView(), 450));

  const q = $("#q");
  q.addEventListener("input", () => { SEARCH_SEL = -1; showResults(searchResults(q.value)); });
  q.addEventListener("keydown", e => {
    const ul = $("#results"), list = ul._list || [];
    if (e.key === "ArrowDown") { SEARCH_SEL = Math.min(SEARCH_SEL + 1, list.length - 1); showResults(list); e.preventDefault(); }
    else if (e.key === "ArrowUp") { SEARCH_SEL = Math.max(SEARCH_SEL - 1, 0); showResults(list); e.preventDefault(); }
    else if (e.key === "Enter") { const r = list[Math.max(SEARCH_SEL, 0)]; if (r) { r.go(); ul.hidden = true; q.blur(); } e.preventDefault(); }
    else if (e.key === "Escape") { ul.hidden = true; }
  });
  $("#results").addEventListener("click", e => {
    const b = e.target.closest("button[data-i]");
    if (!b) return;
    const r = ($("#results")._list || [])[+b.dataset.i];
    if (r) { r.go(); $("#results").hidden = true; }
  });
  document.addEventListener("click", e => { if (!e.target.closest(".search")) $("#results").hidden = true; });

  // card and climb clicks
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-place],[data-wander],[data-act],[data-recent],[data-kind],[data-anyin],[data-tour],[data-starttour]");
    if (!t) return;
    if (t.dataset.starttour) {
      startTour(t.dataset.starttour);
      $("#atlas").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
      return;
    }
    if (t.dataset.tour && UI.tour) {
      const tour = TOURS.find(x => x.id === UI.tour.id);
      if (t.dataset.tour === "end" || !tour) { endTour(); if (UI.card) renderCard(UI.card); return; }
      const i = clamp(UI.tour.i + (t.dataset.tour === "next" ? 1 : -1), 0, tour.stops.length - 1);
      UI.tour.i = i; MAP.walkAt = i;
      openPlace(tour.stops[i].id);
      return;
    }
    if (t.dataset.place) {
      if (UI.tour && !t.closest(".tourbar")) endTour();
      openPlace(t.dataset.place);
      if (t.closest("#climb")) $("#atlas").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    } else if (t.dataset.wander && UI.card && UI.card.block) {
      const b = neighbourBlock(UI.card.block, t.dataset.wander);
      if (b) openCard(doorCard(b), { fly: true, zoom: Math.max(MAP.s, 1.25) });
    } else if (t.dataset.act === "home" && UI.card) {
      UI.home = Object.assign({}, UI.card.spot); UI.homeName = UI.card.title;
      storeSet("sorrel-atlas-home", { spot: UI.home, name: UI.homeName });
      openCard(UI.card, { fly: false, hash: false, turn: false });
    } else if (t.dataset.act === "near" && UI.card && UI.card.spot) {
      const s = UI.card.spot;
      let b = null;
      if (["deck", "keel", "line"].includes(s.zone)) {
        const st = stratumOfDeck(clamp(deckAtR(s.r), 16, 375));
        const base = st && st.kind === "res" ? st : STRATA[clamp(Math.round((deckAtR(s.r) - 16) / 6.2), 0, STRATA.length - 1)];
        const i = clamp(base.index + Math.floor(Math.random() * 5) - 2, 0, STRATA.length - 1);
        b = blockAt(clamp(s.z + (Math.random() - 0.5) * 600, 5, DRUM.L - 5), STRATA[i].rMid, s.theta + (Math.random() - 0.5) * 0.12);
      } else b = blockAt(clamp(s.z, 5, DRUM.L - 5), STRATA[STRATA.length - 1 - Math.floor(Math.random() * 3)].rMid, s.theta);
      if (b) openBlock(b);
    } else if (t.dataset.recent) {
      const id = t.dataset.recent;
      if (PLACE_BY_ID.has(id)) openPlace(id);
      else { const m = /^door-(\d+)$/.exec(id); if (m) openDoor(+m[1]); }
    } else if (t.dataset.kind != null && t.classList.contains("chip")) {
      const k = t.dataset.kind;
      if (!k) MAP.kinds = null;
      else {
        const s = new Set(MAP.kinds || []);
        if (s.has(k)) s.delete(k); else s.add(k);
        MAP.kinds = s.size ? s : null;
      }
      renderChips(); renderClimb(); MAP.dirty = true;
    } else if (t.dataset.anyin) anyDoor(+t.dataset.anyin);
  });

  window.addEventListener("hashchange", () => openFromHash());

  // walks, offered under the lede and at the head of the Climb
  if (TOURS.length) {
    const html = `<span class="walks-label mono">Take a walk:</span>` + TOURS.map(t => `<button type="button" class="tool${t === TOURS[0] ? " primary" : ""}" data-starttour="${esc(t.id)}" title="${esc(t.about || "")}">${esc(t.name)} <span class="mono">· ${t.stops.length} stops</span></button>`).join("");
    const a = $("#walks"); if (a) { a.innerHTML = html; a.hidden = false; }
  }

  // the lamp clock starts at the viewer's own time of day
  const now = new Date();
  setClock(now.getHours() * 60 + now.getMinutes());
  setTheta(hourCenter(4), false);
  renderChips();
  renderClimb();
  renderLedger();
  let test = "";
  try {
    const qp = new URLSearchParams(location.search);
    test = qp.get("test") || "";
    if (qp.get("dark")) { document.documentElement.setAttribute("data-theme", "dark"); readColors(); }
  } catch (e) { test = ""; }
  if (/^\d\d:\d\d$/.test(test)) setClock(+test.slice(0, 2) * 60 + +test.slice(3));
  if (!openFromHash()) {
    if (ash) openCard(landmarkCard(ash), { fly: false, hash: false, turn: true });
    else anyDoor(null);
  }
  if (/zoom/.test(test)) flyTo(viewFor(ringCenter(3), deckR(75), 1.6), 0);
  let m;
  if ((m = /walk(\d+)?/.exec(test)) && TOURS.length) {        // ?test=walk3: the first walk, at stop 3
    startTour(TOURS[0].id, clamp((+m[1] || 1) - 1, 0, TOURS[0].stops.length - 1));
    flyTo(fitView(), 0);
  }
  if ((m = /search:([a-z ]+)/i.exec(test))) { $("#q").value = m[1]; showResults(searchResults(m[1])); }
}
