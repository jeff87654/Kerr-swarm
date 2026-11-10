/* ---------- The shell: what the player has done, the card beside the stage, and the run of one game ----------
   A game registers itself with registerEvent({...}); see content/brief.md for the contract. */
"use strict";

const EVENTS = Object.create(null);
function registerEvent(ev) { EVENTS[ev.id] = ev; }

const HOURS = [null];   // HOURS[1..12], filled from CONTENT in main
const PALS = [null];

const Game = {
  st: { v: 1, club: 0, threads: {}, round: {} },
  view: "title", hour: 0, pending: 0,
};

function loadState() {
  try { const s = JSON.parse(storageGet("rtc-state") || "null"); if (s && s.v === 1 && s.threads) Game.st = s; } catch (e) { /* start fresh */ }
  if (!Game.st.round) Game.st.round = {};
}
function saveState() { storageSet("rtc-state", JSON.stringify(Game.st)); }

const knotsOf = (id) => (Game.st.threads[id] && Game.st.threads[id].k) || 0;
const bestOf = (id) => (Game.st.threads[id] ? Game.st.threads[id].best : undefined);
const threadCount = () => { let n = 0; for (let i = 1; i <= 12; i++) if (knotsOf(HOUR_IDS[i]) > 0) n++; return n; };
const knotCount = () => { let n = 0; for (let i = 1; i <= 12; i++) n += knotsOf(HOUR_IDS[i]); return n; };
// the way round: your own Hour first, then spinward
function trail() { const c = Game.st.club || 1, out = []; for (let i = 0; i < 12; i++) out.push(((c - 1 + i) % 12) + 1); return out; }
function nextHour(after) {
  const tr = trail();
  let start = 0;
  if (after) start = (tr.indexOf(after) + 1) % 12;
  for (let i = 0; i < 12; i++) { const n = tr[(start + i) % 12]; if (n !== after && EVENTS[HOUR_IDS[n]] && knotsOf(HOUR_IDS[n]) === 0) return n; }
  return 0;
}

function knotsHtml(k, big) {
  let s = '<span class="knots' + (big ? " big" : "") + '" role="img" aria-label="' + (k ? numWord(k) + (k === 1 ? " knot" : " knots") : "no thread yet") + '">';
  for (let i = 0; i < 3; i++) s += '<i' + (i < k ? ' class="on"' : "") + "></i>";
  return s + "</span>";
}
function eyebrow(n, rest) { return '<p class="eyebrow"><span class="swatch"></span>' + esc(rest) + "</p>"; }

// Dye the page in an Hour's colours (0: the brass of the plate at one, One, Hare).
function setDye(n) {
  const app = $("#app"); if (!app) return;
  let a = "#c9a55a", b = PAPER;
  if (n && HOURS[n]) { a = HOURS[n].a; b = HOURS[n].b; }
  const light = lum(a) > lum(b) ? a : b;
  const hi = lum(light) < 0.32 ? shade(light, 0.5) : light;
  app.style.setProperty("--a", a); app.style.setProperty("--b", b);
  app.style.setProperty("--on-a", onCol(a)); app.style.setProperty("--hi", hi);
}

function setPanel(html) { const p = $("#panel"); p.innerHTML = html; }
function setVeil(big, sub, tap) {
  const v = $("#veil"); if (!v) return;
  v.hidden = !big && !sub; v.classList.toggle("tap", !!tap);
  $("#veilBig").textContent = big || "";
  const s = $("#veilSub"); s.textContent = sub || ""; s.hidden = !sub;
}
function setHash(name) {
  const want = name ? "#" + name : "";
  if ((location.hash || "") === want) return;
  try { if (want) location.hash = want; else history.replaceState(null, "", location.pathname + location.search); } catch (e) { /* a sandbox may refuse */ }
}

function sorrelMinutes() {
  if (QUERY.clock) { const m = /^(\d+):(\d+)$/.exec(QUERY.clock); if (m) return +m[1] * 60 + +m[2]; }
  const d = new Date(); return d.getHours() * 60 + d.getMinutes();
}
function drawTop() {
  const el = $("#topInfo"); if (!el) return;
  const m = sorrelMinutes();
  let s = "<span>Sorrel <b>" + fmtClock(m) + "</b> " + lampWord(m) + "</span>";
  if (Game.st.club) {
    s += '<span><b>' + esc(HOURS[Game.st.club].name) + '</b> <span class="band" aria-label="' + threadCount() + ' of 12 threads">';
    for (const n of trail()) { const H = HOURS[n]; s += '<span' + (knotsOf(HOUR_IDS[n]) ? ' class="on" style="--ta:' + H.a + ";--tb:" + H.b + '"' : "") + "></span>"; }
    s += "</span></span>";
  }
  el.innerHTML = s;
  const sb = $("#sndBtn"); if (sb) { sb.setAttribute("aria-pressed", Snd.on ? "true" : "false"); sb.textContent = Snd.on ? "Sound on" : "Sound off"; }
}

/* ---------- the views ---------- */
function stopRun() { Run.ev = null; Run.phase = "idle"; Stage.capture = false; Hud.clear(); setVeil("", ""); $("#watchTag").hidden = true; }

function showTitle() {
  stopRun(); Game.view = "title"; Game.hour = 0; setDye(0); setHash("");
  Hub.mode = "title"; Hub.sel = 0; setScene(Hub);
  let s = '<p class="eyebrow">Sorrel · one drum · two hundred million people</p><h1>Round the Clock</h1>';
  s += '<p class="lede">Sorrel is cut like a clock into twelve Hours, named for animals nobody here has ever seen. Each is a county of seventeen million with its own colours, its own trade, its own word and its own dish.</p>';
  s += "<p>Before a runner's first Round, the great race of the Hours, they go round the clock: a day in every Hour, at that Hour's own game. Twelve games, from a full g at the rim to none at all on the axis.</p>";
  s += "<h4>Pick the Hour you'll run for</h4><ul class=\"hours\">";
  for (let n = 1; n <= 12; n++) { const H = HOURS[n]; s += '<li><button class="chip" type="button" data-act="pick" data-n="' + n + '" style="--ca:' + H.a + ";--cb:" + H.b + '"><span class="sw"></span><span class="nm">' + esc(H.name) + "<small>" + esc(H.keeps) + "</small></span></button></li>"; }
  s += "</ul>";
  setPanel(s); drawTop();
}

function showPick(n) {
  stopRun(); Game.view = "pick"; Game.hour = n; setDye(n);
  Hub.mode = "title"; Hub.sel = n; setScene(Hub);
  const H = HOURS[n], O = HOURS[oppositeHour(n)];
  let s = eyebrow(n, "Hour " + cap(numWord(n)) + " · " + H.colours);
  s += "<h2>" + esc(H.name) + '</h2><p class="club">' + esc(H.club) + ", " + esc(H.nick) + "</p>";
  s += "<p>" + esc(H.character) + '</p><p class="saying">“' + esc(H.saying) + "”</p>";
  s += '<div class="note"><h4>Overhead, across the Hollow: ' + esc(O.name) + "</h4><p>" + esc(H.rivalry) + "</p></div>";
  s += '<div class="row"><button class="btn primary big" type="button" data-act="join">Run for ' + esc(H.name) + '</button><button class="btn" type="button" data-act="title">Another Hour</button></div>';
  setPanel(s); drawTop();
}

function showClock() {
  if (!Game.st.club) return showTitle();
  stopRun(); Game.view = "clock"; Game.hour = 0; setDye(Game.st.club); setHash("");
  Hub.mode = "clock"; Hub.sel = 0; setScene(Hub);
  const C = HOURS[Game.st.club], tc = threadCount(), nx = nextHour();
  let s = eyebrow(0, "You run for " + C.name + " · " + C.nick + " · " + tc + " of 12 threads");
  s += tc === 12 ? "<h2>All twelve</h2>" : "<h2>Go round the clock</h2>";
  if (tc === 0) s += "<p>Play each Hour at its own game and it ties a thread in its colours round your wrist: one knot for a fair showing, two for a good one, three for beating the house. Start at home and go spinward. Then run the Round.</p>";
  else if (tc < 12) s += "<p>" + cap(numWord(tc)) + (tc === 1 ? " thread" : " threads") + " on your wrist, " + numWord(12 - tc) + " to go. Any Hour will have you, in any order; spinward is the custom.</p>";
  else s += "<p>You've been right round. Every Hour's thread is on your wrist, " + knotCount() + " knots of 36. The Arcade is cleared and the trolley is parked.</p>";
  s += '<div class="row">';
  if (nx) s += '<button class="btn primary big" type="button" data-act="hour" data-n="' + nx + '">' + (tc ? "Next: " : "Start: ") + esc(HOURS[nx].name) + "</button>";
  if (EVENTS.round) s += '<button class="btn' + (nx ? "" : " primary big") + '" type="button" data-act="round">The Round</button>';
  s += '</div><ul class="hours long">';
  for (const n of trail()) {
    const H = HOURS[n], ev = EVENTS[HOUR_IDS[n]];
    s += '<li><button class="chip' + (n === Game.st.club ? " mine" : "") + '" type="button" data-act="hour" data-n="' + n + '" style="--ca:' + H.a + ";--cb:" + H.b + '"><span class="sw"></span><span class="nm">' + esc(H.name) + "<small>" + esc(ev ? ev.name : "still setting up") + (n === Game.st.club ? " · home" : "") + "</small></span>" + knotsHtml(knotsOf(HOUR_IDS[n])) + "</button></li>";
  }
  s += "</ul>";
  setPanel(s); drawTop();
}

function marksLine(ev) {
  if (!ev.marks) return "";
  const u = ev.unit ? " " + ev.unit : "";
  const f = ev.fmt || ((v) => String(v));
  return "One knot at " + f(ev.marks[0]) + ", two at " + f(ev.marks[1]) + ", three at " + f(ev.marks[2]) + u + ".";
}

function showCard(n) {
  if (!Game.st.club) { Game.pending = n; return showPick(n); }
  const ev = EVENTS[HOUR_IDS[n]];
  stopRun(); Game.view = "card"; Game.hour = n; setDye(n); setHash(HOUR_IDS[n]);
  const H = HOURS[n], O = HOURS[oppositeHour(n)], k = knotsOf(HOUR_IDS[n]);
  let s = eyebrow(n, "Hour " + cap(numWord(n)) + " · " + H.colours + (n === Game.st.club ? " · home" : ""));
  s += "<h2>" + esc(H.name) + '</h2><p class="club">' + esc(H.club) + ", " + esc(H.nick) + "</p>";
  s += "<p>" + esc(H.character) + "</p>";
  if (ev) {
    s += '<div class="gamebox"><h3>' + esc(ev.name) + '</h3><p class="where">' + esc(ev.place) + "</p><p>" + esc(ev.intro) + "</p>";
    s += '<p class="how"><b>How:</b> ' + esc(ev.how) + (ev.keys ? '<span class="keys">Keys: ' + esc(ev.keys) + "</span>" : "") + "</p>";
    s += '<div class="row"><button class="btn primary big" type="button" data-act="play">' + (k ? "Play again" : "Play") + "</button>" + knotsHtml(k) + "</div>";
    s += '<p class="marks">' + esc(marksLine(ev)) + "</p></div>";
  } else s += '<div class="gamebox"><h3>Still setting up</h3><p>This Hour\'s game is not ready yet.</p></div>';
  s += '<p class="saying">“' + esc(H.saying) + "”</p>";
  s += '<div class="note"><h4>Known for</h4><p>' + esc(H.known) + "</p></div>";
  s += '<div class="note"><h4>Overhead, across the Hollow: ' + esc(O.name) + "</h4><p>" + esc(H.rivalry) + "</p></div>";
  s += '<div class="row"><button class="btn" type="button" data-act="clock">Back to the clock</button></div>';
  setPanel(s); drawTop();
  if (ev) Run.demo(n); else { Hub.mode = "clock"; Hub.sel = n; setScene(Hub); }
}

function showPlaying(n) {
  const ev = EVENTS[HOUR_IDS[n]], H = HOURS[n];
  Game.view = "play";
  let s = eyebrow(n, "Hour " + cap(numWord(n)) + " · " + H.name);
  s += "<h3>" + esc(ev.name) + '</h3><p class="where">' + esc(ev.place) + '</p><p class="how">' + esc(ev.how) + (ev.keys ? '<span class="keys">Keys: ' + esc(ev.keys) + "</span>" : "") + "</p>";
  s += '<p class="marks">' + esc(marksLine(ev)) + "</p>";
  s += '<div class="row"><button class="btn" type="button" data-act="quit">Leave the game</button></div>';
  setPanel(s);
}

function showResult(n, res) {
  const ev = EVENTS[HOUR_IDS[n]], H = HOURS[n];
  Game.view = "result";
  const nx = nextHour(n);
  let s = eyebrow(n, H.name + " · " + ev.name);
  s += '<p class="score">' + esc(res.text) + "</p>";
  let tl;
  if (res.knots === 0) tl = res.had ? "Your thread stays as it was." : "No thread yet. " + H.name + " will have you back.";
  else if (!res.had) tl = H.name + " ties its thread on your wrist: " + numWord(res.knots) + (res.knots === 1 ? " knot." : " knots.");
  else if (res.knots > res.had) tl = "Another knot in " + H.name + "'s thread: " + numWord(res.knots) + " now.";
  else tl = cap(numWord(res.knots)) + (res.knots === 1 ? " knot" : " knots") + " today. Your thread keeps its " + numWord(Math.max(res.had, res.knots)) + ".";
  s += '<div class="row">' + knotsHtml(res.knots, true) + '</div><p class="marks">' + esc(tl) + "</p>";
  if (res.knots > 0 || res.had) s += '<div class="thread-line" aria-hidden="true"></div>';
  const line = H.lines && H.lines[res.knots];
  if (line) s += '<p class="host">“' + esc(line) + "”<cite>" + esc(H.host.name) + ", " + esc(H.host.role) + "</cite></p>";
  s += '<div class="note"><h4>They feed you: ' + esc(H.dish.name) + "</h4><p>" + esc(H.dish.text) + "</p></div>";
  s += '<div class="note"><h4>Their word: ' + esc(H.word.w) + "</h4><p>" + esc(cap(H.word.means)) + ".</p></div>";
  s += '<div class="row">';
  if (res.knots === 0) s += '<button class="btn primary big" type="button" data-act="play">Again</button>';
  if (nx) s += '<button class="btn' + (res.knots ? " primary big" : "") + '" type="button" data-act="hour" data-n="' + nx + '">Next: ' + esc(HOURS[nx].name) + "</button>";
  else if (res.knots && EVENTS.round) s += '<button class="btn primary big" type="button" data-act="round">The Round</button>';
  if (res.knots > 0) s += '<button class="btn" type="button" data-act="play">Again</button>';
  s += '<button class="btn" type="button" data-act="clock">The clock</button></div>';
  setPanel(s); drawTop();
}

/* ---------- running one game ---------- */
const HudOff = { set() {}, say() {}, clear() {} };

const Run = {
  ev: null, s: null, ctx: null, hour: 0, phase: "idle", hold: 0, countT: 0, bot: false, b: null, prev: null, opt: null,

  ctxFor(n, demo, opt) {
    const seed = QUERY.seed ? (+QUERY.seed | 0) : ((Math.random() * 0x7fffffff) | 0);
    const id = n ? HOUR_IDS[n] : "round";
    return {
      seed, rng: makeRng(seed), hour: n ? HOURS[n] : HOURS[Game.st.club || 1], pal: n ? PALS[n] : PALS[Game.st.club || 1],
      sfx: demo ? SndOff : Snd, hud: demo ? HudOff : Hud, say: demo ? () => {} : (t, sec) => Hud.say(t, sec),
      demo: !!demo, skill: QUERY.skill !== undefined ? +QUERY.skill : (demo ? 0.9 : 1),
      best: bestOf(id), reduced: REDUCED_MOTION, time: 0, opt: opt || null,
      club: Game.st.club || 1, threads: Game.st.threads,
    };
  },
  begin(ev, n, demo, opt) {
    Run.ev = ev; Run.hour = n; Run.opt = opt || null;
    Run.ctx = Run.ctxFor(n, demo, opt);
    Run.s = ev.create(Run.ctx);
    Run.b = freshInput(); Run.prev = { down: false, left: false, right: false, up: false, dn: false }; Run.tapUp = false;
    Run.hold = 0;
    setScene(EventScene);
  },
  demo(n, opt) {
    const ev = n ? EVENTS[HOUR_IDS[n]] : EVENTS.round;
    Run.begin(ev, n, true, opt); Run.phase = "demo"; Run.bot = true;
    Stage.capture = false; Hud.clear(); setVeil("", ""); $("#watchTag").hidden = !ev.bot;
  },
  play(n, opt) {
    const ev = n ? EVENTS[HOUR_IDS[n]] : EVENTS.round;
    if (!ev) return;
    Snd.wake();
    Run.begin(ev, n, false, opt);
    Run.bot = !!QUERY.bot && !!ev.bot;
    $("#watchTag").hidden = true; Hud.clear();
    Stage.capture = true;
    if (n) { showPlaying(n); setDye(n); } else if (ev.showPlaying) ev.showPlaying(Run.ctx);
    const quick = QUERY.bot || QUERY.nocount;
    Run.phase = quick ? "play" : "count"; Run.countT = quick ? 0 : 2.1;
    if (!quick) setVeil("3", ev.how); else setVeil("", "");
    const cv = Stage.cv;
    try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); cv.focus({ preventScroll: true }); } catch (e) { /* fine */ }
    try { const r = $("#stageBox").getBoundingClientRect(); if (r.top < 60 || r.bottom > window.innerHeight + 4) $("#stageBox").scrollIntoView({ block: "start", behavior: REDUCED_MOTION ? "auto" : "smooth" }); } catch (e) { /* fine */ }
  },
  // Turn what a bot asked for into the same input a player would give.
  botInput() {
    const b = Run.b, p = Run.prev, o = Run._bi || (Run._bi = freshInput());
    let down = !!b.down;
    if (Run.tapUp) { down = false; Run.tapUp = false; } else if (b.tap) { down = true; Run.tapUp = true; }
    o.x = b.x; o.y = b.y; o.moved = true;
    o.ptrDown = down; o.ptrPressed = down && !p.down; o.ptrReleased = !down && p.down;
    o.down = down; o.pressed = o.ptrPressed; o.released = o.ptrReleased;
    o.act = false; o.actPressed = false; o.actReleased = false;
    o.left = !!b.left; o.right = !!b.right; o.up = !!b.up; o.dn = !!b.dn;
    o.leftPressed = o.left && !p.left; o.rightPressed = o.right && !p.right; o.upPressed = o.up && !p.up; o.dnPressed = o.dn && !p.dn;
    o.ax = (o.right ? 1 : 0) - (o.left ? 1 : 0); o.ay = (o.dn ? 1 : 0) - (o.up ? 1 : 0);
    o.num = b.num || 0;
    p.down = down; p.left = o.left; p.right = o.right; p.up = o.up; p.dn = o.dn;
    b.tap = false; b.down = false; b.left = false; b.right = false; b.up = false; b.dn = false; b.num = 0;
    return o;
  },
  finish() {
    const ev = Run.ev, s = Run.s, n = Run.hour;
    Run.phase = "after"; Stage.capture = false;
    if (ev.finish) { ev.finish(s, Run.ctx); return; }
    const score = Math.round((s.score || 0) * 100) / 100;
    let knots = 0;
    for (let i = 0; i < 3; i++) if (score >= ev.marks[i]) knots = i + 1;
    const text = ev.result ? ev.result(s, Run.ctx) : (ev.fmt ? ev.fmt(score) : String(score)) + (ev.unit ? " " + ev.unit : "");
    const id = HOUR_IDS[n], had = knotsOf(id);
    if (!Run.bot || QUERY.keep) {
      const th = Game.st.threads[id] || (Game.st.threads[id] = { k: 0, best: score });
      th.k = Math.max(th.k, knots); th.best = Math.max(th.best === undefined ? score : th.best, score);
      saveState();
    }
    if (knots) Snd.knots(knots); else Snd.miss();
    const res = { id, score, knots, text, had };
    window.__rtc.result = res; window.__rtc.results.push(res);
    showResult(n, res);
  },
};

const EventScene = {
  update(dt, inp) {
    const R = Run; if (!R.ev) return;
    if (R.phase === "demo") {
      if (R.ev.bot) R.ev.bot(R.s, R.b, R.ctx);
      const bi = R.botInput();
      if (!R.s.done) { R.ev.update(R.s, dt, bi, R.ctx); R.ctx.time += dt; }
      else { R.hold += dt; if (R.hold > 1.8) R.demo(R.hour, R.opt); }
      if (inp.ptrPressed) Run.play(R.hour, R.opt);
    } else if (R.phase === "count") {
      R.countT -= dt;
      const k = Math.ceil(R.countT / 0.7);
      const big = k >= 1 ? String(k) : "";
      if ($("#veilBig").textContent !== big) { if (big) { setVeil(big, R.ev.how); Snd.tick(); } }
      if (R.countT <= 0) { setVeil("", ""); R.phase = "play"; Snd.pop(); }
    } else if (R.phase === "play") {
      if (Stage.until !== undefined && R.ctx.time >= Stage.until) return;      // test hook: hold the game at an exact moment
      let use = inp;
      if (R.bot) { R.ev.bot(R.s, R.b, R.ctx); use = R.botInput(); }
      R.ev.update(R.s, dt, use, R.ctx); R.ctx.time += dt;
      if (R.s.done) R.finish();
    } else if (R.phase === "after") {
      if (R.ev.after) R.ev.after(R.s, dt, R.ctx);
    }
  },
  draw(g) {
    const R = Run; if (!R.ev) return;
    R.ev.draw(R.s, g, R.ctx);
  },
};

/* ---------- wiring ---------- */
const ACTIONS = {
  pick(n) { Snd.wake(); Snd.tap(); showPick(n); },
  title() { showTitle(); },
  join() {
    Game.st.club = Game.hour; saveState(); Snd.wake(); Snd.call(Game.hour);
    const p = Game.pending; Game.pending = 0;
    if (p) showCard(p); else showClock();
  },
  clock() { Snd.tap(); showClock(); },
  hour(n) { Snd.wake(); Snd.tap(); showCard(n); },
  play() { Run.play(Game.hour); },
  quit() { if (Run.hour === 0 && EVENTS.round) EVENTS.round.showCard(); else showCard(Game.hour); },
  round() { Snd.wake(); Snd.tap(); if (EVENTS.round) EVENTS.round.showCard(); },
};

function shellInit() {
  $("#panel").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.getAttribute("data-act"), n = +b.getAttribute("data-n") || 0;
    if (ACTIONS[act]) ACTIONS[act](n, b);
  });
  $("#brand").addEventListener("click", () => { if (Game.st.club) showClock(); else showTitle(); });
  $("#sndBtn").addEventListener("click", () => { Snd.set(!Snd.on); if (Snd.on) Snd.tap(); drawTop(); });
  const about = $("#about");
  $("#aboutBtn").addEventListener("click", () => { about.hidden = false; $("#resetBtn").textContent = "Start over"; $("#aboutClose").focus(); });
  $("#aboutClose").addEventListener("click", () => { about.hidden = true; });
  about.addEventListener("click", (e) => { if (e.target === about) about.hidden = true; });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") { if (!about.hidden) about.hidden = true; else if (Game.view === "play") ACTIONS.quit(); } });
  $("#resetBtn").addEventListener("click", (e) => {
    const b = e.currentTarget;
    if (b.textContent !== "Really start over?") { b.textContent = "Really start over?"; return; }
    Game.st = { v: 1, club: 0, threads: {}, round: {} }; saveState(); about.hidden = true; showTitle();
  });
  $("#veil").addEventListener("click", () => { if (Game.view === "card") Run.play(Game.hour); });
  window.addEventListener("hashchange", () => routeHash(true));
  setInterval(drawTop, 20000);
}

// Show what the address asks for: #otter is Otter's card, #round the Round, nothing the clock.
// When the address changes under us (the Back button), don't redraw a view we are already on.
function routeHash(changed) {
  const h = (location.hash || "").replace("#", "").toLowerCase();
  const n = HOUR_IDS.indexOf(h), v = Game.view;
  if (n > 0) {
    if (changed && Game.hour === n && (v === "card" || v === "play" || v === "result" || v === "pick")) return;
    return showCard(n);
  }
  if (h === "round" && EVENTS.round && Game.st.club) {
    if (changed && (v === "round" || v === "roundresult" || (v === "play" && Run.hour === 0))) return;
    return EVENTS.round.showCard();
  }
  if (changed && (v === "title" || v === "pick" || v === "clock")) return;
  if (Game.st.club) showClock(); else showTitle();
}
