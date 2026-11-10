/* ---------- Start-up ---------- */
"use strict";

window.__rtc = { result: null, results: [], errors: [], Stage, Game, Run, EVENTS, HOURS };
window.addEventListener("error", (e) => { window.__rtc.errors.push(String(e.message) + " @" + String(e.filename || "").split("/").pop() + ":" + e.lineno); });
window.addEventListener("unhandledrejection", (e) => { window.__rtc.errors.push("rejection: " + String(e.reason)); });

function boot(saved) {
  for (const h of CONTENT.hours) { HOURS[h.n] = h; PALS[h.n] = makePal(h); }
  loadState();
  if (saved && saved.st && saved.st.v === 1) Game.st = saved.st;
  if (storageGet("rtc-sound") === "0") Snd.on = false;

  // test hooks (local builds only: an artifact link carries no query)
  if (QUERY.fresh) Game.st = { v: 1, club: 0, threads: {}, round: {} };
  if (QUERY.club) Game.st.club = clamp(+QUERY.club | 0, 1, 12);
  if (QUERY.threads) { const k = clamp(+QUERY.threads | 0, 0, 3); for (let n = 1; n <= 12; n++) if (k) Game.st.threads[HOUR_IDS[n]] = { k: QUERY.mixed ? ((n * 7) % 3) + 1 : k, best: 0 }; }
  if (QUERY.speed) Stage.speed = Math.max(0.1, +QUERY.speed);
  if (QUERY.mute) Snd.on = false;

  stageInit($("#cv"));
  shellInit();
  try {
    document.fonts.load('800 32px "Big Shoulders Display"'); document.fonts.load('700 32px "Big Shoulders Display"');
    document.fonts.load('500 16px "IBM Plex Mono"'); document.fonts.load('500 18px "Newsreader"'); document.fonts.load('italic 500 18px "Newsreader"');
  } catch (e) { /* the fallbacks will do */ }

  const hv = QUERY.h ? clamp(+QUERY.h | 0, 1, 12) : 1;
  if (QUERY.ev) {
    const n = HOUR_IDS.indexOf(QUERY.ev);
    if (!Game.st.club) Game.st.club = n > 0 ? n : 1;
    if (n > 0 && EVENTS[QUERY.ev]) Run.play(n);
    else if (QUERY.ev === "round" && EVENTS.round) EVENTS.round.start(QUERY.mode || "heavy");
    else showClock();
  } else if (QUERY.view === "pick") showPick(hv);
  else if (QUERY.view === "clock") { if (!Game.st.club) Game.st.club = hv; showClock(); }
  else if (QUERY.view === "card") { if (!Game.st.club) Game.st.club = hv; showCard(hv); }
  else if (QUERY.view === "result") {
    if (!Game.st.club) Game.st.club = hv;
    const ev = EVENTS[HOUR_IDS[hv]], k = QUERY.k === undefined ? 2 : +QUERY.k;
    showCard(hv); Run.phase = "after"; $("#watchTag").hidden = true;
    showResult(hv, { id: HOUR_IDS[hv], score: 0, knots: k, text: ev && ev.marks ? (ev.fmt ? ev.fmt(ev.marks[Math.max(0, k - 1)]) : ev.marks[Math.max(0, k - 1)]) + (ev.unit ? " " + ev.unit : "") : "A fair showing", had: +QUERY.had || 0 });
  } else if (QUERY.view === "round" && EVENTS.round) { if (!Game.st.club) Game.st.club = hv; EVENTS.round.showCard(); }
  else routeHash();
}

(function () {
  const hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) { try { hot.snapshot(() => ({ st: Game.st })); } catch (e) { /* not in a viewer */ } }
  if (hot && hot.ready) hot.ready(boot); else boot((hot && hot.data) || {});
})();
