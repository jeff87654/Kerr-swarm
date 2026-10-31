/* ---------- The interface ---------- */
"use strict";

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

let hollowView = null, glideView = null, windowView = null, titleGlide = null;
let stageMode = "hollow";      // hollow | glide | window
let glideAnim = null;          // {t, from, to, start, dur, resolve}
let feedExpanded = false;
let lastTalk = {};
let busy = false;

/* ---------- toasts ---------- */
let toastTimer = null;
function toast(msg) {
  const root = $("#toast-root");
  root.innerHTML = '<div class="toast" role="status">' + esc(msg) + "</div>";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { root.innerHTML = ""; }, 4200);
}

/* ---------- canvas sizing ---------- */
function sizeCanvas(c, scale) {
  const r = c.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = Math.max(320, Math.round(r.width * dpr * scale));
  let h = Math.max(180, Math.round(r.height * dpr * scale));
  const maxPix = window.innerWidth < 700 ? 0.6e6 : 1.2e6;
  if (w * h > maxPix) { const k = Math.sqrt(maxPix / (w * h)); w = Math.round(w * k); h = Math.round(h * k); }
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
}

/* ---------- the stage ---------- */
function stageCaption(d) {
  const s = sunlineAt(d, clockOf(state.t));
  const ph = phaseName(d, state.t);
  if (stageMode === "window") return state.lastWindowKind === "backcrew" ? "Behind the radiators, the whole sky over your shoulder" : "The Window, behind the drum";
  if (state.view === "hollow") {
    const v = { floor: "from the floor", lake: "from the lake shore", terrace: "from the end-wall terraces", spindle: "from the Spindle" }[state.hollowView || "floor"];
    return "The Hollow " + v + ", " + ph + (s.phase === "dawn" || s.phase === "dusk" ? ": “" + d.palette.name + "”" : "");
  }
  return "On the Ring " + state.ring + " poster: the Hollow right now, " + ph;
}

function renderStage() {
  if (typeof audioScene === "function") audioScene(currentAudioScene());
  const d = here();
  const ov = $("#stage-overlay");
  if (!d) return;
  const showHollow = stageMode === "hollow";
  $("#cv-hollow").hidden = !showHollow;
  $("#cv-glide").hidden = stageMode !== "glide";
  $("#cv-window").hidden = stageMode !== "window";
  if (stageMode === "glide") return; // the glide draws its own overlay
  const views = state.view === "hollow"
    ? ["floor", "lake", "terrace", "spindle"].filter((v) => v !== "lake" || d.hollow.lake > 0.02)
    : [];
  ov.innerHTML =
    '<div class="stage-sign"><div class="nm">' + esc(d.name) + '</div><div class="sub">' + esc(d.row) + " · " + esc(d.kindLabel) + ' · <b>' + addressOf(d.x, d.y) + "</b></div></div>" +
    '<div class="stage-cap">' + esc(stageCaption(d)) + "</div>" +
    (stageMode === "window" && (state.windowCaps || []).length ? '<p class="win-cap" id="win-cap" data-i="-1"></p>' : "") +
    (views.length ? '<div class="stage-views" role="group" aria-label="Where to stand">' + views.map((v) => '<button class="vbtn" type="button" data-act="hview" data-v="' + v + '" aria-pressed="' + ((state.hollowView || "floor") === v) + '">' + ({ floor: "Floor", lake: "Lake", terrace: "Terraces", spindle: "Spindle" })[v] + "</button>").join("") + "</div>" : "") +
    (state.view !== "platform" ? '<div class="stage-views" style="left:auto;top:auto;bottom:16px;right:max(16px, env(safe-area-inset-right, 0px));' + (views.length ? "bottom:54px;" : "") + '"><button class="vbtn" type="button" data-act="to-platform">Back down to the ring</button></div>' : "");
  if (showHollow && hollowView && !hollowView.ok) {
    const st = d.palette.stops;
    $("#stage").style.background = "linear-gradient(180deg," + st[3] + " 0%," + st[2] + " 35%," + st[1] + " 70%," + st[0] + " 100%)";
  }
  if (showHollow && hollowView && hollowView.ok) {
    const s = sunlineAt(d, clockOf(state.t));
    const fest = festivalOn(dayOf(state.t));
    const night = s.I < 0.14;
    const flyers = night ? (fest === "booking" && d.open ? 9000 : 1600) : 0;
    const view = state.view === "hollow" ? (state.hollowView || "floor") : (d.hollow.lake > 0.05 ? "lake" : "floor");
    hollowView.set(d, s, view, flyers, hash32("lamps", d.x, d.y, dayOf(state.t)));
  }
  if (stageMode === "window" && windowView && windowView.ok) { windowView.setSeed(hash32("win", d.x, d.y)); windowView.setPassing(festivalOn(dayOf(state.t)) === "passing"); }
}

function stageOnScreen() {
  const el = $("#stage");
  if (!el) return true;
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < (window.innerHeight || 800) && r.width > 0;
}

function stageLoop() {
  let last = 0;
  const frame = (ts) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const poster = state && state.view === "platform" && stageMode === "hollow";
    const gap = prefersReducedMotion ? 400 : poster ? 66 : 33;
    if (ts - last < gap) return;
    if ($("#title").hidden && !$("#app").hidden && stageMode !== "glide" && !stageOnScreen()) return;
    last = ts;
    const time = ts / 1000;
    if (!$("#title").hidden && titleGlide) {
      sizeCanvas($("#cv-title"), 0.8);
      titleGlide.render(((time / 90) % 1) * 0.9 + 0.05, time, { frame: false, mirror: true });
      return;
    }
    if ($("#app").hidden) return;
    if (stageMode === "glide" && glideAnim) {
      const c = $("#cv-glide");
      sizeCanvas(c, 0.85);
      const now = performance.now();
      const k = clamp((now - glideAnim.start) / glideAnim.dur, 0, 1);
      const t = 0.02 + 0.965 * k;
      const flash = k > 0.93 ? (k - 0.93) / 0.07 : 0;
      glideView.render(t, time, { catchFlash: flash });
      const hud = $("#glide-count");
      if (hud) hud.textContent = Math.max(0, Math.round(glideAnim.secs * (1 - k))) + " s";
      if (k >= 1 && glideAnim.resolve) { const r = glideAnim.resolve; glideAnim.resolve = null; setTimeout(r, 120); }
      return;
    }
    if (stageMode === "window" && windowView && windowView.ok) {
      sizeCanvas($("#cv-window"), 0.75);
      const el = (performance.now() - (state.windowStart || 0)) / 1000;
      const caps = state.windowCaps || [];
      const capEl = $("#win-cap");
      if (capEl && caps.length) {
        const idx = Math.min(caps.length - 1, Math.floor(el / 7));
        if (capEl.dataset.i !== String(idx)) { capEl.dataset.i = String(idx); capEl.textContent = caps[idx]; capEl.style.opacity = "0"; requestAnimationFrame(() => { capEl.style.opacity = "1"; }); }
      }
      const open = prefersReducedMotion ? 1 : smooth(2.5, 9, el);
      windowView.render(time, open, clamp(el / 70, 0, 1));
      return;
    }
    if (hollowView && hollowView.ok) {
      sizeCanvas($("#cv-hollow"), 0.62);
      hollowView.render(time);
    }
  };
  requestAnimationFrame(frame);
}

/* ---------- glide transition ---------- */
function playGlide(fromName, toName, hops) {
  return new Promise((resolve) => {
    stageMode = "glide";
    renderStage();
    glideView.setSeed(hash32("gl", state.x, state.y, state.t));
    const secs = hops * 140;
    const ov = $("#stage-overlay");
    ov.innerHTML = '<div class="glide-hud"><div class="box"><div class="route">' + esc(fromName) + " → " + esc(toName) + '</div><div class="count mono" id="glide-count">' + secs + ' s</div><div class="hint">Weightless. Through the aft window, a metre of clear water.</div></div></div>' +
      '<button class="vbtn skip" type="button" data-act="skip-glide">Skip to the catch</button>';
    const dur = prefersReducedMotion ? 500 : Math.min(9000, 4800 + (hops - 1) * 700);
    if (typeof audioScene === "function") audioScene("glide");
    let done = false;
    const finish = () => { if (done) return; done = true; glideAnim = null; stageMode = "hollow"; resolve(); };
    glideAnim = { start: performance.now(), dur, secs, resolve: finish };
    setTimeout(finish, dur + 450);
  });
}

/* ---------- top bar ---------- */
function renderStatus() {
  const d = here();
  const day = dayOf(state.t);
  const fest = festivalOn(day);
  const festName = { quiet: "the Quiet", booking: "Booking Day", knotnight: "Knotnight", passing: "the Passing of " + state.passing.raft }[fest];
  $("#status").innerHTML =
    "<span>Day <b>" + day + "</b> · " + weekdayOf(state.t) + "</span>" +
    "<span><b>" + fmtClock(clockOf(state.t)) + "</b> " + phaseName(d, state.t) + "</span>" +
    "<span><b>" + fmtKwh(state.purse) + "</b> kWh</span>" +
    "<span>" + fmtSec(lightHome()) + " from " + esc(state.player.home) + "</span>" +
    (state.dark ? '<span class="thread">● black thread</span>' : "") +
    (festName ? '<span style="color:var(--quay-2)">' + esc(festName) + "</span>" : "");
  $("#btn-cards").textContent = "Cards · " + state.cards.length;
}

/* ---------- the drum's page ---------- */
function stars(n, ladle) {
  let s = n ? '<span class="stars" title="' + n + ' apple-seed star' + (n > 1 ? "s" : "") + '">' + "✦".repeat(n) + "</span>" : "";
  if (ladle) s += '<span class="stars" title="The Ladle: the best of the free table">· Ladle</span>';
  return s;
}

function boardHTML(d) {
  const day = dayOf(state.t);
  const b = boardFor(d, day);
  if (d.board === "ledger") {
    const names = namingPairs(d, day, 2);
    return '<div class="board"><div class="bt"><span>The Ledger · Ring ' + state.ring + "</span><span>Day " + day + "</span></div><table>" +
      "<tr><td>Places</td><td>" + fmtInt(b.places) + "</td></tr>" +
      "<tr><td>People</td><td>" + fmtInt(b.people) + "</td></tr>" +
      "<tr><td>The Margin</td><td>" + fmtInt(b.margin) + "</td></tr>" +
      "<tr><td>Born today</td><td>" + fmtInt(b.bornToday) + "</td></tr>" +
      "<tr><td>Died today</td><td>" + fmtInt(b.deathsToday) + "</td></tr>" +
      "<tr><td>Guests tonight</td><td>" + fmtInt(b.guests) + "</td></tr></table>" +
      '<div class="names">Named at this ring today: ' + names.map((n) => esc(n.baby) + " for " + esc(n.dead) + " (" + n.age + ")").join("; ") + ".</div></div>";
  }
  if (d.board === "count") {
    return '<div class="board count"><div class="bt"><span>The Count · Ring ' + state.ring + "</span><span>Day " + day + "</span></div><table>" +
      "<tr><td>Places</td><td>" + fmtInt(b.places) + "</td></tr>" +
      "<tr><td>People</td><td>" + fmtInt(b.people) + "</td></tr>" +
      "<tr><td>Above par</td><td>" + fmtInt(b.people - b.places) + "</td></tr>" +
      "<tr><td>Births licensed this year</td><td>none</td></tr>" +
      "<tr><td>Died today</td><td>" + fmtInt(b.deathsToday) + "</td></tr>" +
      "<tr><td>Par expected in</td><td>about " + d.yearsToPar + " years</td></tr></table></div>";
  }
  return '<div class="board"><div class="bt"><span>Register · Ring ' + state.ring + "</span><span>Day " + day + "</span></div><table>" +
    "<tr><td>Places</td><td>" + fmtInt(b.places) + "</td></tr>" +
    "<tr><td>People</td><td>" + fmtInt(b.people) + "</td></tr>" +
    "<tr><td>Born today</td><td>" + fmtInt(b.bornToday) + "</td></tr>" +
    "<tr><td>Died today</td><td>" + fmtInt(b.deathsToday) + "</td></tr>" +
    (b.guests ? "<tr><td>Guests tonight</td><td>" + fmtInt(b.guests) + "</td></tr>" : "") + "</table></div>";
}

function feedHTML() {
  const n = feedExpanded ? 24 : 3;
  const items = state.log.slice(0, n);
  return '<section aria-label="What happened"><h2 class="sect-title">Today <span class="aside">' + esc(weekdayOf(state.t)) + ", day " + dayOf(state.t) + "</span></h2><div class=\"feed\">" +
    items.map((e, i) => '<article class="entry ' + (i === 0 ? "new" : "old") + '"><div class="when">Day ' + dayOf(e.t) + " · " + fmtClock(clockOf(e.t)) + (e.at ? " · " + esc(e.at) : "") + "</div>" +
      (e.title ? '<div class="ttl">' + esc(e.title) + "</div>" : "") + "<p>" + esc(e.text) + "</p></article>").join("") +
    "</div>" + (state.log.length > 3 ? '<button class="btn ghost feed-more" type="button" data-act="feed-more">' + (feedExpanded ? "Show less" : "Show earlier") + "</button>" : "") + "</section>";
}

function currentWheres() {
  const c = clockOf(state.t);
  if (state.view === "hollow") return state.hollowView === "terrace" ? ["terrace", "hollow"] : state.hollowView === "spindle" ? ["spindle", "hollow"] : ["hollow", "terrace"];
  if (state.view === "window") return ["platform"];
  const w = ["platform"];
  if (timeBand(c) === "evening" && here().open) w.push("hall");
  return w;
}
function peopleTitle() {
  if (state.view === "hollow") return state.hollowView === "terrace" ? "On the terraces" : state.hollowView === "spindle" ? "On the Spindle" : "In the Hollow";
  return "On the platform";
}

function peopleHTML(d) {
  const day = dayOf(state.t), c = clockOf(state.t);
  const ps = peopleFor(d, day, c, currentWheres());
  const ai = aiReady();
  if (!ps.length) return "";
  return '<section aria-label="' + esc(peopleTitle()) + '"><h2 class="sect-title">' + esc(peopleTitle()) + ' <span class="aside">' + (state.view === "hollow" ? "this hour" : "people at Ring " + state.ring + " this hour") + "</span></h2><div class=\"people\">" +
    ps.map((p) => {
      const said = lastTalk[p.id];
      return '<div class="person"><div class="pn">' + esc(p.name) + '</div><div class="pr">' + p.age + " · " + esc(p.role) + '</div><div class="pd">' + esc(cap(p.doing)) + ".</div>" +
        (said !== undefined ? '<div class="say">' + esc(p.lines[said % p.lines.length]) + "</div>" : "") +
        '<div class="row"><button class="btn" type="button" data-act="talk" data-id="' + esc(p.id) + '">' + (said === undefined ? "Say hello" : "Keep talking") + "</button>" +
        (ai ? '<button class="btn" type="button" data-act="ask" data-id="' + esc(p.id) + '">Ask about anything…</button>' : "") + "</div></div>";
    }).join("") + "</div></section>";
}

function noticesHTML(d) {
  const ns = noticesFor(d, dayOf(state.t));
  const official = /^(THE COUNT|THE LEDGER|METHANOL|REGISTER|NOTICE FROM THE|BY ORDER)/;
  return '<section aria-label="Notices"><h2 class="sect-title">The notice board <span class="aside">pinned by the Ring ' + state.ring + " hatch</span></h2><div class=\"felt\"><div class=\"notices\">" +
    ns.map((n, i) => {
      const r = makeRng(hash32("slip", d.x, d.y, i, dayOf(state.t) >> 3));
      const rot = (r() - 0.5) * 3.2;
      const off = official.test(n.t) || n.cat === "count" || n.cat === "gate" || n.cat === "ledger";
      const cls = off ? "official" : "p" + (1 + (i % 4));
      return '<div class="slip ' + cls + '" style="transform:rotate(' + rot.toFixed(2) + 'deg)">' + esc(n.t) + "</div>";
    }).join("") + "</div></div></section>";
}

function tonightHTML(d) {
  const evs = tonightFor(d, dayOf(state.t));
  if (!evs.length) return "";
  const fest = festivalOn(dayOf(state.t));
  let festBlock = "";
  if (fest) {
    const F = (CONTENT.events && CONTENT.events.festivals) || {};
    const key = fest === "booking" ? "booking" : fest;
    const pool = F[key] || [];
    if (pool.length) festBlock = '<div class="famous"><b>' + esc({ quiet: "The Quiet", booking: "Booking Day", knotnight: "Knotnight", passing: "The Passing of " + state.passing.raft }[fest]) + "</b><br>" + esc(fill(d, makeRng(hash32("fest", d.x, d.y, dayOf(state.t))).pick(pool), hash32("festf", d.x, d.y))) + "</div>";
  }
  return '<section aria-label="What\'s on"><h2 class="sect-title">What\'s on <span class="aside">today in ' + esc(d.name) + "</span></h2>" + festBlock +
    '<div class="eats">' + evs.map((e, i) => '<div class="eat"><div class="en" style="font-size:18px">' + esc(e.t) + '</div><div class="meta">' + esc({ dawn: "at lamp-dawn", day: "by day", evening: "this evening", night: "in the lamp-night" }[e.when] || "today") + (e.cost ? " · " + fmtKwh(e.cost) + " kWh" : " · free") + "</div><div>" + esc(e.d) + '</div><div class="row" style="margin-top:8px"><button class="btn" type="button" data-act="event" data-i="' + i + '">' + esc(eventGoLabel(e)) + '</button></div></div>').join("") + "</div></section>";
}

function hallTonight(d) {
  const hn = (CONTENT.food && CONTENT.food.hallnights) || [];
  if (!d.open || !hn.length) return null;
  const r = makeRng(hash32("hall", d.x, d.y, dayOf(state.t)));
  return fill(d, r.pick(hn), hash32("hallf", d.x, d.y, dayOf(state.t)));
}

function eatHTML(d) {
  if (!d.eat || !d.eat.length) return "";
  const ht = hallTonight(d);
  const hallBlock = ht ? '<div class="eat"><div><span class="en">The ' + esc(d.neighbourhoods[0]) + " hall</span>" + stars(0, true) + '</div><div class="meta">one long table · ' + (d.guestRight ? "free on guest-right" : "about 3.5 kWh") + " · dinner from 18:00</div><div>Tonight: " + esc(ht) + '.</div><div class="row" style="margin-top:8px"><button class="btn" type="button" data-act="hall">' + (timeBand(clockOf(state.t)) === "evening" ? "Sit down at the long table" : "Come back for dinner at 18:00") + "</button></div></div>" : "";
  return '<section aria-label="Where to eat"><h2 class="sect-title">Where to eat <span class="aside">from the Crosswise Guide\'s notes</span></h2><div class="eats">' + hallBlock +
    d.eat.map((p, i) => {
      const free = p.guestFree && d.guestRight;
      const price = free ? "free on guest-right" : p.price ? "about " + fmtKwh(p.price) + " kWh a head" : "free, from the commons";
      return '<div class="eat"><div><span class="en">' + esc(p.name) + "</span>" + stars(p.stars || 0, p.ladle) + '</div><div class="meta">' + esc(p.where || "") + " · " + price + "</div><div>" + esc(p.blurb || "") + "</div>" +
        (p.dishes && p.dishes.length ? "<ul>" + p.dishes.map((x) => "<li>" + esc(x[0]) + ' <span class="faint mono">' + fmtKwh(x[1]) + "</span></li>").join("") + "</ul>" : "") +
        (p.tip ? '<div class="tip">' + esc(p.tip) + "</div>" : "") +
        '<div class="row" style="margin-top:8px"><button class="btn" type="button" data-act="eat" data-i="' + i + '">Eat here' + (free ? "" : p.price ? " · " + fmtKwh(p.price) + " kWh" : "") + "</button></div></div>";
    }).join("") + "</div></section>";
}

function aboutHTML(d) {
  const pal = d.palette;
  const sw = '<span class="swatch" aria-hidden="true">' + pal.stops.map((c) => '<span style="background:' + esc(c) + '"></span>').join("") + "</span>";
  const rows = [
    ["The row", d.row + ". " + (d.rowAbout || "")],
    ["Fixed goods", d.rules.goods],
    ["Births", d.rules.births],
    ["Gin", d.rules.gin],
    ["Guests", (d.guestRight ? "Grants guest-right: three nights in a guest flat, and the halls. " : "No guest-right here; inns on the Low decks. ") + (d.rules.guests ? d.rules.guests.t : "")],
    ["The Hollow", cap(d.hollowText) + ". Full noon for " + d.sunHours + " hours a day."],
    ["The dawn", sw + "“" + pal.name + "”" + (pal.by ? ", painted by " + pal.by : "") + ". " + (pal.note || "")],
    ["Lamps up", d.rules.lamps + (d.rules.dayNote && !/^Lamps up at/.test(d.rules.dayNote) ? ". " + d.rules.dayNote : "")],
    ["Windows", d.windows.keeps ? (d.windows.guests ? "Keeps Windows behind the drum, and takes guests on the dawn round when there are seats." : "Keeps Windows for its own eight-year-olds.") : "Keeps no Windows."],
  ];
  if (d.customs && d.customs.length) rows.push(["Customs", d.customs.join(" ")]);
  if (d.history) rows.push(["History", cap(d.name + " " + d.history.replace(/^\s*/, "")) + (/[.!?]$/.test(d.history) ? "" : ".")]);
  if (d.reputation) rows.push(["Neighbours say", d.reputation]);
  if (d.motto) rows.push(["Over the ring", "“" + d.motto + "”"]);
  return '<section aria-label="About this drum"><h2 class="sect-title">About ' + esc(d.name) + ' <span class="aside">' + addressOf(d.x, d.y) + "</span></h2><dl class=\"facts\">" +
    rows.map((r) => "<dt>" + esc(r[0]) + "</dt><dd>" + (r[0] === "The dawn" ? r[1].replace(/^(<span[\s\S]*?<\/span>)([\s\S]*)$/, (m, a, b) => a + esc(b)) : esc(r[1])) + "</dd>").join("") + "</dl></section>";
}

function headerHTML(d) {
  const kindClass = d.open ? "k-open" : "k-" + d.sub;
  const chips = ['<span class="chip ' + kindClass + '">' + esc(d.kindLabel) + "</span>"];
  chips.push('<span class="chip">' + (d.guestRight ? "guest-right" : "no guest-right") + "</span>");
  if (d.windows.keeps) chips.push('<span class="chip">keeps Windows</span>');
  if (d.backcrew) chips.push('<span class="chip">back crews take guests</span>');
  chips.push('<span class="chip">' + fmtSec(lightHome()) + " from " + esc(state.player.home) + "</span>");
  const v = state.visited[d.key];
  if (v && v.first < dayOf(state.t)) chips.push('<span class="chip">first visited day ' + v.first + "</span>");
  const blurb = d.blurb || KIND_BLURB[d.sub];
  const fam = (d.famous || []).map((f) => '<div class="famous"><b>' + esc(f.t) + "</b><br>" + esc(fillItem(d, { t: f.d, n: f.n, years: f.years, ago: f.ago }, hash32("fam", d.x, d.y))) + "</div>").join("");
  return '<section aria-label="' + esc(d.name) + '"><p class="lede">' + esc(blurb) + '</p><div class="chips">' + chips.join("") + "</div>" + fam + "</section>";
}

function renderMain() {
  const d = here();
  $("#feedbox").innerHTML = feedHTML();
  $("#main").innerHTML = headerHTML(d) + boardHTML(d) + peopleHTML(d) + noticesHTML(d) + tonightHTML(d) + eatHTML(d) + aboutHTML(d);
}

/* ---------- side: things to do, departures, map ---------- */
function todoItems(d) {
  const items = [];
  const c = clockOf(state.t), s = sunlineAt(d, c);
  items.push({ act: "counter", label: "A cup of broth at the Ring " + state.ring + " hatch", cost: "free" });
  const acc = hollowAccess(d);
  if (acc.ok) items.push({ act: "hollow", label: acc.where === "terrace" ? "Up to the end-wall terraces" : "Go up to the Hollow", cost: (acc.cost ? fmtKwh(acc.cost) + " kWh" : "free") + " · 1 h" });
  else items.push({ act: null, label: "The Hollow", why: acc.why });
  const longFlight = festivalOn(dayOf(state.t)) === "booking" && d.open && s.I < 0.14;
  items.push({ act: "spindle", label: longFlight ? "Fly the Long Flight, end to end with hand lamps" : s.I < 0.14 ? "Fly the Spindle in the dark" : "Fly in the flying halls", cost: (state.hasSleeves ? "own sleeves" : "0.2 kWh") + " · 1 h" });
  if (d.palette.by || d.sub === "fair") items.push({ act: "dawn", label: "Wait for " + (d.palette.for === "dusk" ? "the painted dusk" : "the painted dawn") + " on the terraces", cost: "free" });
  if (d.windows.keeps && d.windows.guests) items.push({ act: "window", label: "A seat at the Window, behind the drum", cost: "free · 4 h" });
  if (d.backcrew) items.push({ act: "backcrew", label: "Ride a shift with the back crew (sign for the dose)", cost: "8 h" });
  for (const f of d.famous || []) if (f.buy) items.push({ act: "buy", label: "Buy " + f.buy.item, cost: fmtKwh(f.buy.kwh) + " kWh" });
  const lodge = lodgingFor(d);
  items.push({ act: "sleep", label: "Stay the night in " + lodge.label.replace(/^a /, "a "), cost: (lodge.cost ? fmtKwh(lodge.cost) + " kWh" : "free") + (d.guestRight && state.nightsHere < 3 ? " · " + (state.nightsHere + 1) + "/3" : "") });
  items.push({ act: "wait", label: "Wait an hour on the platform", cost: "" });
  if (state.spoons.indexOf(d.name) < 0) items.push({ act: "spoon", label: "Take a spoon of starter, leave a spoon", cost: "free" });
  if (d.name === "Spelt" && d.canon && state.spoons.length && !state.raftLoaf) items.push({ act: "loaf", label: "Give Pell your " + state.spoons.length + " spoon" + (state.spoons.length > 1 ? "s" : "") + " for the raft loaf", cost: "" });
  items.push({ act: "card", label: "Write a card home", cost: "" });
  items.push({ act: "dark", label: state.dark ? "Take off the black thread" : "Tie a black thread: go dark", cost: state.dark ? "" : "+9.6/day" });
  if (d.name === state.player.home && dayOf(state.t) >= 30) items.push({ act: "homecoming", label: "Come home: end the wander year", cost: "" });
  return items;
}

function renderSide() {
  const d = here();
  const deps = DIRS.map((dir) => {
    const nx = d.x + dir.dx, ny = d.y + dir.dy;
    if (!inRaft(nx, ny)) return '<button class="flap-row" type="button" disabled><span class="ar">' + dir.arrow + '</span><span class="dn">Runout<span class="dk">the edge of Merrow</span></span><span class="dt">—</span></button>';
    const nd = getDrum(nx, ny);
    const seen = state.visited[nd.key] ? " · been" : "";
    return '<button class="flap-row" type="button" data-act="glide" data-dx="' + dir.dx + '" data-dy="' + dir.dy + '"><span class="ar">' + dir.arrow + '</span><span class="dn">' + esc(nd.name) + '<span class="dk">' + esc(nd.kindLabel) + " · " + esc(dir.label) + (nd.row !== d.row ? " · " + esc(nd.row) : "") + seen + '</span></span><span class="dt">140 s</span></button>';
  }).join("");
  const todo = todoItems(d).map((it) => it.act
    ? '<button class="btn' + (it.act === "homecoming" ? " go" : "") + '" type="button" data-act="do-' + it.act + '"><span>' + esc(it.label) + '</span><span class="cost">' + esc(it.cost || "") + "</span></button>"
    : '<div class="why"><b>' + esc(it.label) + ":</b> " + esc(it.why) + "</div>").join("");
  const fresh = renderSide.lastKey !== d.key;
  renderSide.lastKey = d.key;
  const rowsCrossed = Array.from(new Set(Object.values(state.rowsSeen)));
  const rowsCarded = new Set(state.cards.map((c) => c.row));
  const cardedHere = rowsCarded.has(d.row);
  $("#side").innerHTML =
    '<div class="panel"><div class="ph"><h2>Departures</h2><span class="aside">Station Ring ' + state.ring + '</span></div><div class="pb"><div class="flap' + (fresh && !prefersReducedMotion ? " fresh" : "") + '">' + deps +
    '<button class="flap-row" type="button" data-act="open-raft"><span class="ar">⇢</span><span class="dn">Cycler<span class="dk">anywhere on Merrow, by capsule</span></span><span class="dt">1.1 kWh+</span></button></div></div></div>' +
    '<div class="panel"><div class="ph"><h2>Here</h2><span class="aside">' + fmtClock(clockOf(state.t)) + " · " + esc(phaseName(d, state.t)) + '</span></div><div class="pb"><div class="todo">' + todo + "</div></div></div>" +
    '<div class="panel localmap"><div class="ph"><h2>Nearby</h2><span class="aside">two glides around · click to go</span></div><div class="pb">' + localMapSVG(d) + "</div></div>" +
    '<div class="panel"><div class="ph"><h2>Purse</h2><span class="aside">' + (state.dark ? "dark · " + state.darkDays + " days" : "worlds on") + '</span></div><div class="pb mono" style="font-size:13px;line-height:1.7"><div><b style="font-size:20px;color:var(--quay-2)">' + fmtKwh(state.purse) + "</b> kWh</div>" +
    '<div class="muted">+6 a day set aside from your dividend' + (state.dark ? ", +9.6 while dark" : "") + '.</div><div class="muted">Fares so far ' + fmtKwh(state.stats.fares) + " kWh · " + Object.keys(state.visited).length + " drums · " + state.cards.length + " cards</div>" +
    '<div style="margin-top:10px;color:var(--ink)">One card home from every row: ' + rowsCarded.size + " of " + rowsCrossed.length + ' rows crossed</div><div class="goal" aria-hidden="true">' + rowsCrossed.slice(0, 40).map((r) => '<span class="pip' + (rowsCarded.has(r) ? " on" : "") + '" title="' + esc(r) + '"></span>').join("") + "</div>" +
    (cardedHere ? "" : '<div class="faint" style="margin-top:4px">No card from ' + esc(d.row) + " yet.</div>") + "</div></div>";
}

const KIND_COLOR = { hall: "#b9c46c", wood: "#6f9c6a", fair: "#e6b45e", maker: "#d08c5a", steady: "#4f9db3", thin: "#d7a86f", counted: "#b07a9a" };

function localMapSVG(d) {
  const R = 2, cell = 64, W = (2 * R + 1) * cell, H = (2 * R + 1) * cell;
  let out = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Drums within three glides"><rect width="' + W + '" height="' + H + '" fill="#07090b"/>';
  // row blocks as faint bands
  for (let j = -R; j <= R; j++) {
    for (let i = -R; i <= R; i++) {
      const x = d.x + i, y = d.y + j;
      if (!inRaft(x, y)) continue;
      const blk = blockAt(x, y);
      const tint = (blk.hash % 5) * 4;
      out += '<rect x="' + ((i + R) * cell) + '" y="' + ((R - j) * cell) + '" width="' + cell + '" height="' + cell + '" fill="rgb(' + (12 + tint) + "," + (14 + tint) + "," + (18 + tint) + ')"/>';
    }
  }
  // lanes
  for (let k = 0; k <= 2 * R; k++) {
    out += '<line x1="0" x2="' + W + '" y1="' + (k * cell + cell / 2) + '" y2="' + (k * cell + cell / 2) + '" stroke="#1d232b" stroke-width="1"/>';
    out += '<line y1="0" y2="' + H + '" x1="' + (k * cell + cell / 2) + '" x2="' + (k * cell + cell / 2) + '" stroke="#1d232b" stroke-width="1"/>';
  }
  for (let j = -R; j <= R; j++) {
    for (let i = -R; i <= R; i++) {
      const x = d.x + i, y = d.y + j;
      if (!inRaft(x, y)) continue;
      const nd = getDrum(x, y);
      const cx = (i + R) * cell + cell / 2, cy = (R - j) * cell + cell / 2;
      const me = i === 0 && j === 0;
      const seen = !!state.visited[nd.key];
      const col = KIND_COLOR[nd.sub] || "#888";
      out += '<g' + (me ? "" : ' style="cursor:pointer" data-act="glide-to" data-x="' + x + '" data-y="' + y + '"') + '><title>' + esc(nd.name + ", " + nd.row + " (" + nd.kindLabel + ")" + (me ? ": you are here" : ", " + (Math.abs(i) + Math.abs(j)) + " glide" + (Math.abs(i) + Math.abs(j) > 1 ? "s" : ""))) + "</title>" +
        '<circle cx="' + cx + '" cy="' + (cy - 5) + '" r="' + (me ? 9 : 7) + '" fill="' + col + '" fill-opacity="' + (seen || me ? 0.95 : 0.55) + '"' + (me ? ' stroke="#ffd193" stroke-width="2.5"' : seen ? ' stroke="#ebe4d6" stroke-width="1"' : "") + "/>" +
        '<text class="lbl' + (me ? " here-lbl" : "") + '" x="' + cx + '" y="' + (cy + 15) + '" text-anchor="middle">' + esc(nd.name.length > 10 ? nd.name.slice(0, 9) + "." : nd.name) + "</text></g>";
    }
  }
  out += "</svg>";
  return out;
}

function renderAll() {
  if (!state) return;
  if (dayOf(state.t) > YEAR && !state.yearToasted) {
    state.yearToasted = true;
    setTimeout(() => toast("A year today. " + state.player.home + " is " + fmtSec(lightHome()) + " away by light. Go home when you're ready, or keep going."), 400);
  }
  renderStatus();
  renderStage();
  renderMain();
  renderSide();
  saveGame();
}

/* ---------- modals ---------- */
function openModal(html, cls) {
  const root = $("#modal-root");
  root.innerHTML = '<div class="modal" data-act="modal-bg"><div class="dialog ' + (cls || "") + '" role="dialog" aria-modal="true">' + html + "</div></div>";
  const first = root.querySelector("input, textarea, button.go, button");
  if (first) setTimeout(() => first.focus(), 30);
}
function closeModal() {
  $("#modal-root").innerHTML = "";
  if (askCtl) { try { askCtl.abort(); } catch (e) { /* ignore */ } }
  if (cardCtl) { try { cardCtl.abort(); } catch (e) { /* ignore */ } cardCtl = null; }
  // never leave a traveller between drums: closing the journey steps off at the far end
  if (state && state.transit && !state.arriving) { finishCycler(); lastTalk = {}; syncStage(); renderAll(); }
}
function dlgHead(title, extra) { return '<div class="dh"><h2>' + esc(title) + "</h2><div style=\"display:flex;gap:8px;align-items:center\">" + (extra || "") + '<button class="btn" type="button" data-act="close">Close</button></div></div>'; }

/* ---------- the raft map and cyclers ---------- */
let raftSel = null;
const CANON_LABELS = [["Herb", "Herb Row"], ["Hedge", "Hedge Row"], ["Gull", "Gull Row"], ["Weather", "Weather Row"], ["Bell", "Bell Row"], ["Kelp", "Kelp Row"], ["Pigment", "Pigment Row"], ["Thimble", "Thimble Row"], ["Grain", "Grain Row"], ["Cooper", "Cooper Row"], ["Kite", "Kite Row"], ["Quill", "Quill Row"]];

function openRaftMap() {
  raftSel = null;
  const picks = CANON_LABELS.map(([k, label]) => '<button class="btn" type="button" data-act="raft-pick" data-row="' + k + '">' + esc(label) + "</button>").join(" ");
  openModal(dlgHead("Merrow", '<span class="fine">0.1 AU a side · about 300 billion drums</span>') +
    '<div class="db"><div class="raftmap"><div><canvas id="raft-cv" width="900" height="900" aria-label="Map of Merrow. Click anywhere to plan a cycler."></canvas>' +
    '<p class="fine" style="margin-top:8px">Rings show light delay from ' + esc(state.player.home) + ' every 10 seconds. Dots are the rows named in the old wander-year cards; the amber line is your route.</p></div>' +
    '<div class="quote" id="raft-quote"><p class="muted" style="margin:0">Click anywhere on Merrow to see what\'s there and what a cycler costs. Speed is the fare, not distance.</p><div style="display:flex;flex-wrap:wrap;gap:6px">' + picks + '<button class="btn" type="button" data-act="raft-pick" data-row="home">Home</button><button class="btn go" type="button" data-act="raft-pick" data-row="anywhere">Somewhere I’ve never heard of</button></div></div></div></div>');
  drawRaftMap();
  const cv = $("#raft-cv");
  cv.addEventListener("click", (ev) => {
    const r = cv.getBoundingClientRect();
    const fx = (ev.clientX - r.left) / r.width, fy = (ev.clientY - r.top) / r.height;
    const x = clamp(Math.round(fx * WORLD.N), 0, WORLD.N - 1), y = clamp(Math.round((1 - fy) * WORLD.N), 0, WORLD.N - 1);
    selectRaftPoint(x, y);
  });
}

function selectRaftPoint(x, y) {
  raftSel = { x, y };
  drawRaftMap();
  const d = getDrum(x, y);
  const lh = lightSeconds(x, y, state.player.hx, state.player.hy);
  const opts = [[2, "Slow line", "weightless, with the Wanderers' Galley"], [5, "Middling", "quicker, still cheap"], [20, "Express", "1 g ramps at each end, quiet and dear"]].map(([v, label, note]) => {
    const q = cyclerQuote(x, y, v);
    const t = q.days < 1.5 ? Math.round(q.hours) + " hours" : Math.round(q.days) + " days";
    return '<button class="speed" type="button" data-act="cycle-go" data-v="' + v + '"' + (state.purse < q.fare ? " disabled" : "") + "><b>" + label + " · " + v + ' km/s</b><b>' + fmtKwh(q.fare) + " kWh</b><span>" + esc(note) + "</span><span>" + t + "</span></button>";
  }).join("");
  $("#raft-quote").innerHTML = '<div class="fine">' + esc(d.row) + " · " + addressOf(x, y) + '</div><div class="dest">' + esc(d.name) + '</div><div class="muted" style="font-size:15px">' + esc(cap(d.kindLabel)) + ". " + esc(fmtDist(distKm(state.x, state.y, x, y))) + " from here; " + fmtSec(lh) + " by light from " + esc(state.player.home) + ".</div>" + opts +
    '<p class="fine" style="margin:4px 0 0">Your purse: ' + fmtKwh(state.purse) + " kWh. Boarding is by capsule from a ramp beside the trunk.</p>";
}

function drawRaftMap() {
  const cv = $("#raft-cv");
  if (!cv) return;
  const ctx = cv.getContext("2d"), S = cv.width, N = WORLD.N;
  const px = (x) => (x / N) * S, py = (y) => (1 - y / N) * S;
  ctx.fillStyle = "#050607"; ctx.fillRect(0, 0, S, S);
  // texture: the rows
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 2400; i++) {
    const r = makeRng(i * 7919);
    ctx.fillStyle = "rgba(240,164,87," + (0.03 + r() * 0.05).toFixed(3) + ")";
    ctx.fillRect(r() * S, r() * S, 2 + r() * 8, 1);
  }
  ctx.globalAlpha = 1;
  // light-delay rings from home
  const perSec = WORLD.C_KMS / WORLD.PITCH_KM;
  ctx.strokeStyle = "rgba(79,157,179,0.35)"; ctx.fillStyle = "rgba(79,157,179,0.7)"; ctx.font = "13px IBM Plex Mono, monospace";
  for (let s = 10; s <= 60; s += 10) {
    ctx.beginPath(); ctx.arc(px(state.player.hx), py(state.player.hy), (s * perSec / N) * S, 0, Math.PI * 2); ctx.stroke();
    const lx = px(state.player.hx) + (s * perSec / N) * S * 0.71 + 4, ly = py(state.player.hy) - (s * perSec / N) * S * 0.71 - 4;
    if (lx < S - 30 && ly > 12) ctx.fillText(s + " s", lx, ly);
  }
  // canon rows
  for (const [k, label] of CANON_LABELS) {
    const [ax, ay] = CANON_ROW_ANCHORS[k];
    ctx.fillStyle = "#ebe4d6";
    ctx.beginPath(); ctx.arc(px(ax), py(ay), 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(235,228,214,0.85)"; ctx.font = "14px IBM Plex Mono, monospace";
    const tx = px(ax) + 8 > S - 110 ? px(ax) - 110 : px(ax) + 8;
    ctx.fillText(label, tx, py(ay) + 4);
  }
  // visited
  ctx.fillStyle = "rgba(255,209,147,0.8)";
  for (const k in state.visited) { const v = state.visited[k]; ctx.fillRect(px(v.x) - 1.5, py(v.y) - 1.5, 3, 3); }
  // route
  ctx.strokeStyle = "rgba(240,164,87,0.9)"; ctx.lineWidth = 2;
  ctx.beginPath();
  state.route.forEach((p, i) => { if (i === 0) ctx.moveTo(px(p[0]), py(p[1])); else ctx.lineTo(px(p[0]), py(p[1])); });
  ctx.stroke();
  // home and here
  ctx.strokeStyle = "#b9c46c"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(px(state.player.hx), py(state.player.hy), 9, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#ffd193";
  ctx.beginPath(); ctx.arc(px(state.x), py(state.y), 6, 0, Math.PI * 2); ctx.fill();
  if (raftSel) {
    ctx.strokeStyle = "#ffd193"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(px(state.x), py(state.y)); ctx.lineTo(px(raftSel.x), py(raftSel.y)); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(px(raftSel.x), py(raftSel.y), 8, 0, Math.PI * 2); ctx.stroke();
  }
}

/* ---------- the cycler journey ---------- */
async function runCycler(v) {
  if (!raftSel) return;
  const res = boardCycler(raftSel.x, raftSel.y, v);
  if (!res.ok) { toast(res.why); return; }
  const tr = state.transit;
  const totalDays = (tr.arrive - tr.depart) / DAY;
  const n = Math.max(2, Math.min(7, Math.round(totalDays / 3) + 2));
  openModal(dlgHead(v === 20 ? "The express" : "The slow line", '<span class="fine mono" id="jr-day"></span>') +
    '<div class="db"><div class="journey"><div class="vignettes" id="jr-v"></div><div><canvas id="jr-cv" width="600" height="600" style="width:100%;aspect-ratio:1;background:#050607;border:1px solid var(--rule);border-radius:6px"></canvas>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn" type="button" data-act="jr-card">Write a card from the line</button><button class="btn go" type="button" data-act="jr-arrive" id="jr-arrive" disabled>Arriving…</button></div></div></div></div>');
  const cv = $("#jr-cv"), ctx = cv.getContext("2d"), S = cv.width, N = WORLD.N;
  const px = (x) => (x / N) * S, py = (y) => (1 - y / N) * S;
  let i = 0;
  const start = performance.now();
  const dur = prefersReducedMotion ? 300 : Math.min(14000, 3500 + n * 1500);
  const draw = () => {
    if (!$("#jr-cv")) return;
    const k = clamp((performance.now() - start) / dur, 0, 1);
    ctx.fillStyle = "#050607"; ctx.fillRect(0, 0, S, S);
    for (const [kk, label] of CANON_LABELS) { const [ax, ay] = CANON_ROW_ANCHORS[kk]; ctx.fillStyle = "rgba(235,228,214,0.6)"; ctx.fillRect(px(ax) - 2, py(ay) - 2, 4, 4); ctx.font = "13px IBM Plex Mono, monospace"; ctx.fillText(label, px(ax) + 6 > S - 100 ? px(ax) - 100 : px(ax) + 6, py(ay) + 4); }
    ctx.strokeStyle = "rgba(79,157,179,0.8)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px(tr.fromX), py(tr.fromY)); ctx.lineTo(px(tr.tx), py(tr.ty)); ctx.stroke();
    const cx = lerp(tr.fromX, tr.tx, k), cy = lerp(tr.fromY, tr.ty, k);
    ctx.fillStyle = "#ffd193"; ctx.beginPath(); ctx.arc(px(cx), py(cy), 6, 0, Math.PI * 2); ctx.fill();
    const tNow = tr.depart + (tr.arrive - tr.depart) * k;
    const el = $("#jr-day");
    if (el) el.textContent = "Day " + dayOf(tNow) + " · " + fmtDist(tr.dkm * (1 - k)) + " to go · " + fmtSec(lightSeconds(cx, cy, state.player.hx, state.player.hy)) + " from home";
    const want = Math.floor(k * n);
    while (i < want && i < n) {
      const day = dayOf(tr.depart + (tr.arrive - tr.depart) * ((i + 0.5) / n));
      const div = document.createElement("div");
      div.className = "vignette";
      div.innerHTML = '<div class="d">Day ' + day + "</div>" + esc(cyclerVignette(i));
      $("#jr-v").prepend(div);
      i++;
    }
    if (k < 1) requestAnimationFrame(draw);
    else enableArrive();
  };
  const enableArrive = () => { const b = $("#jr-arrive"); if (b && b.disabled) { b.disabled = false; b.textContent = "Step off at " + drumNameAt(tr.tx, tr.ty); } };
  setTimeout(() => { enableArrive(); }, dur + 400);
  requestAnimationFrame(draw);
}

/* ---------- cards ---------- */
function snapshotStage() {
  const src = stageMode === "window" ? $("#cv-window") : stageMode === "glide" ? $("#cv-glide") : $("#cv-hollow");
  // From the platform, a card is printed in advance: the Hollow at its painted dawn, or at noon.
  let restore = null;
  if (stageMode === "hollow" && state.view === "platform" && hollowView && hollowView.ok) {
    const d = here();
    const painted = !!d.palette.by;
    const sun = painted ? { I: 0.5, phase: d.palette.for === "dusk" ? "dusk" : "dawn", f: 0.5 } : { I: 1, phase: "noon", f: 1 };
    hollowView.set(d, sun, d.hollow.lake > 0.05 ? "lake" : "floor", 0, 1);
    hollowView.render(37);
    restore = () => renderStage();
  }
  try {
    const c = document.createElement("canvas");
    c.width = 560; c.height = 315;
    const ctx = c.getContext("2d");
    const sw = src.width, sh = src.height;
    const k = Math.max(c.width / sw, c.height / sh);
    const w = sw * k, h = sh * k;
    ctx.drawImage(src, (c.width - w) / 2, (c.height - h) / 2, w, h);
    const url = c.toDataURL("image/jpeg", 0.72);
    if (restore) restore();
    return url;
  } catch (e) { if (restore) restore(); return null; }
}

function cardHTML(c) {
  return '<article class="pcard">' + (c.front ? '<img alt="' + esc(c.frontLabel || "The front of the card") + '" src="' + c.front + '">' : '<div class="noimg">' + esc(c.frontLabel || "") + "</div>") +
    '<div class="pb2"><div class="pm"><span>Day ' + c.day + " · " + esc(c.drum) + ", " + esc(c.row) + "</span><span>Light home: " + fmtSec(c.light) + '</span></div><div class="to">To ' + esc(c.to) + '</div><div class="tx">' + esc(c.text) + "</div></div></article>";
}

function openCards() {
  const list = state.cards.slice().reverse();
  openModal(dlgHead("Cards home", '<button class="btn go" type="button" data-act="do-card">Write a card</button>') +
    '<div class="db">' + (list.length ? '<div class="cardgrid">' + list.map(cardHTML).join("") + "</div>" : '<p class="muted">No cards yet. The custom is one card home from every row, sent by light and postmarked with the delay.</p>') + "</div>");
}

let cardCtl = null;
function openComposer() {
  const d = here();
  const front = snapshotStage();
  const label = state.view === "platform" && stageMode === "hollow" ? d.name + "'s Hollow, as printed on the cards sold at the ring" : stageCaption(d);
  const recips = Array.from(new Set((state.player.recipients || []).concat(["my table", "Mum", "Dad", "Gran", "the Thursday crew"]))).slice(0, 8);
  const ai = aiReady();
  openModal(dlgHead("A card from " + d.name) +
    '<div class="db"><div class="composer"><div>' + cardHTML({ front, frontLabel: label, day: dayOf(state.t), drum: d.name, row: d.row, light: lightHome(), to: "…", text: "" }).replace('<div class="tx"></div>', '<div class="tx faint">Write on the right.</div>') + "</div>" +
    '<div style="display:flex;flex-direction:column;gap:10px"><div class="field"><label for="c-to">To</label><input id="c-to" list="c-to-list" value="' + esc(recips[0] || "my table") + '"><datalist id="c-to-list">' + recips.map((r) => '<option value="' + esc(r) + '">').join("") + "</datalist></div>" +
    '<div class="field"><label for="c-text">The card</label><textarea id="c-text" maxlength="900"></textarea></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' + (ai ? '<button class="btn" type="button" data-act="c-draft">Draft it with Claude</button>' : "") + '<button class="btn" type="button" data-act="c-suggest">Suggest a line</button><button class="btn go" type="button" data-act="c-send">Send by light</button></div><div class="fine" id="c-note"></div></div></div></div>', "");
  const modal = $(".dialog");
  modal.dataset.front = front || "";
  modal.dataset.label = label;
}

/* ---------- conversations ---------- */
let askCtl = null, askPerson = null, askTurns = [];
function findPerson(id) {
  const d = here();
  return peopleFor(d, dayOf(state.t), clockOf(state.t), currentWheres()).find((p) => p.id === id);
}
function openAsk(p) {
  askPerson = p; askTurns = [];
  meetPerson(p);
  openModal(dlgHead(p.name, '<span class="fine">' + p.age + " · " + esc(p.role) + "</span>") +
    '<div class="db"><div class="chat"><div class="log" id="chat-log"><div class="msg them">' + esc(p.lines[0] || "Hello.") + '</div></div><form id="chat-form"><input id="chat-in" type="text" maxlength="400" placeholder="Ask ' + esc(p.name.split(" ")[0]) + ' anything" autocomplete="off"><button class="btn go" type="submit">Ask</button></form><div class="fine">Answers come from Claude, playing ' + esc(p.name.split(" ")[0]) + " inside the world. The first question asks your permission.</div></div></div>", "narrow");
  askTurns.push({ role: "assistant", content: p.lines[0] || "Hello." });
  $("#chat-form").addEventListener("submit", (ev) => { ev.preventDefault(); sendAsk(); });
}
async function sendAsk() {
  const inp = $("#chat-in");
  const q = inp.value.trim();
  if (!q || !askPerson) return;
  inp.value = "";
  const log = $("#chat-log");
  const me = document.createElement("div"); me.className = "msg me"; me.textContent = q; log.appendChild(me);
  const them = document.createElement("div"); them.className = "msg them"; them.textContent = "…"; log.appendChild(them);
  log.scrollTop = log.scrollHeight;
  askTurns.push({ role: "user", content: q });
  if (askCtl) { try { askCtl.abort(); } catch (e) { /* ignore */ } }
  askCtl = new AbortController();
  try {
    const text = await aiAskPerson(askPerson, askTurns, (t) => { them.textContent = t; log.scrollTop = log.scrollHeight; }, askCtl.signal);
    askTurns.push({ role: "assistant", content: text });
    if (askTurns.length > 14) askTurns.splice(1, 2);
  } catch (e) {
    them.textContent = e && e.text ? e.text : aiErrorCopy(e);
    askTurns.pop();
  }
}

/* ---------- menu, about, homecoming ---------- */
function openMenu() {
  openModal(dlgHead("Menu") + '<div class="db" style="display:flex;flex-direction:column;gap:14px">' +
    '<p style="margin:0">You are <b>' + esc(state.player.name) + "</b> of " + esc(state.player.home) + ", on day " + dayOf(state.t) + " of your wander year.</p>" +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-act="open-ledger">Your year so far</button><button class="btn" type="button" data-act="open-about">About this game</button><button class="btn" type="button" data-act="restart-ask">Start a new year</button></div>' +
    '<div id="restart-confirm"></div></div>', "narrow");
}

function yearTable() {
  const st = state.stats;
  const rows = [
    ["Days away", dayOf(state.t) - 1],
    ["Glides", st.glides],
    ["Cycler legs", st.legs],
    ["Distance", fmtDist(st.distKm)],
    ["Fares", fmtKwh(st.fares) + " kWh"],
    ["Drums visited", Object.keys(state.visited).length],
    ["Drums slept in", Object.values(state.visited).filter((v) => v.nights > 0).length],
    ["Nights aboard", st.nightsAboard],
    ["Farthest from home", fmtSec(st.farthest) + (st.farthestName ? ", at " + st.farthestName : "")],
    ["Dearest purchase", st.dearest ? fmtKwh(st.dearest.kwh) + " kWh, " + st.dearest.what : "nothing yet"],
    ["Times up in a Hollow", st.hollow],
    ["Windows and back-crew shifts", st.windows + st.shifts],
    ["Spoons of starter", state.spoons.length],
    ["People met", state.met.length],
    ["Cards", state.cards.length],
  ];
  const drums = Object.values(state.visited).sort((a, b) => a.first - b.first);
  const met = state.met.slice(-24);
  return '<table class="stat-table">' + rows.map((r) => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(String(r[1])) + "</td></tr>").join("") + "</table>" +
    '<h3 class="sect-title" style="margin-top:18px">Drums, in order</h3><p class="muted" style="margin:0;font-size:15.5px">' + drums.map((v) => esc(v.name) + ' <span class="faint mono" style="font-size:12px">(' + esc(v.row) + ", day " + v.first + (v.nights ? ", " + v.nights + " night" + (v.nights > 1 ? "s" : "") : "") + ")</span>").join(" · ") + "</p>" +
    (met.length ? '<h3 class="sect-title" style="margin-top:18px">People you met</h3><p class="muted" style="margin:0;font-size:15.5px">' + met.map((m) => esc(m.name) + ' <span class="faint mono" style="font-size:12px">(' + esc(m.role) + ", " + esc(m.drum) + ")</span>").join(" · ") + "</p>" : "");
}

function openLedger(homecoming) {
  const pool = (CONTENT.events && CONTENT.events.festivals && CONTENT.events.festivals.homecoming) || [];
  const hc = homecoming && pool.length ? '<p class="lede">' + esc(fill(here(), makeRng(hash32("hc", state.t)).pick(pool), hash32("hcf", state.t))) + "</p>" : "";
  openModal(dlgHead(homecoming ? "Homecoming" : "The year on the Ledger") + '<div class="db">' + hc + yearTable() +
    (state.cards.length ? '<h3 class="sect-title" style="margin-top:18px">The cards</h3><div class="cardgrid">' + state.cards.slice().reverse().map(cardHTML).join("") + "</div>" : "") + "</div>");
}

function openAbout() {
  openModal(dlgHead("About this game") + '<div class="db" style="max-width:72ch">' +
    "<p>Three Nights Anywhere is set in the Kerr swarm world bible: a civilization of about 10<sup>33</sup> people living on rafts in the Shade, powered by a shell around the Milky Way's central black hole. Merrow is one raft, 0.1 AU a side.</p>" +
    "<p>Every drum on Merrow's grid is generated from its address, so the same drum is always the same nation: its name, its kind, its board, its rules, its Hollow and its painted dawn. People, notices and what's on change with the day and the hour. Sixteen drums are written by hand to match the bible: Sorrel, Lovage, Tansy, Chervil, Rue, Yarrow and Borage on Herb Row; Sloe, Kittiwake, Gloaming, Squall, Carillon, Dulse, Madder, Ochre and Spelt across the raft.</p>" +
    "<p>The numbers follow the bible: glides of 140 seconds at 174 m/s between drums 24.5 km apart; cyclers priced by speed squared (1.1 kWh at 2 km/s, 111 at 20); a wallet of 21.6 kWh a day; three-hour dawns and six hours of noon on a 2 kWe budget; light delay home from your position on the grid. The canon rows sit where the light delays in the old wander-year cards put them.</p>" +
    "<p><b>What this assumes.</b> Rows are founded stretches one to three grid rows deep and 12 to 36 drums long, each named on a theme. Drum kinds follow the bible's shares at a quiet time, with neighbours leaning alike. Guest-right holds three nights per visit. Each traveller sets aside 6 kWh a day from the dividend, 9.6 more when dark. Booking Day falls on day " + BOOKING_DAY + ", Knotnight on day " + KNOTNIGHT + ", and a raft called " + esc(state.passing.raft) + " passes around day " + state.passing.day + ". Conversations and drafted cards, when available, are written by Claude playing inside the world.</p>" +
    "</div>");
}
