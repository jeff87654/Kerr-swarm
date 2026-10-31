/* ---------- Boot and wiring ---------- */
"use strict";

let titleHome = "Chervil";

function syncStage() {
  if (glideAnim) return;
  stageMode = state && state.view === "window" ? "window" : "hollow";
}

function showTitle() {
  $("#app").hidden = true;
  $("#title").hidden = false;
  const homes = $("#f-homes");
  homes.innerHTML = HOMES.map((h) => '<button class="home-opt" type="button" data-home="' + esc(h.name) + '" aria-pressed="' + (h.name === titleHome) + '">' + esc(h.name) + "</button>").join("");
  const note = () => { const h = HOMES.find((x) => x.name === titleHome); $("#f-home-note").textContent = h ? cap(h.note) + "." : ""; };
  note();
  homes.onclick = (ev) => {
    const b = ev.target.closest("[data-home]");
    if (!b) return;
    titleHome = b.dataset.home;
    $$(".home-opt", homes).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.home === titleHome)));
    note();
  };
  const nm = $("#f-name");
  if (!nm.value) nm.value = makeRng(Date.now() >>> 0).pick(CONTENT.people.given);
  const saved = loadGame();
  const cont = $("#btn-continue");
  if (saved) {
    cont.hidden = false;
    const sd = getDrum(saved.x, saved.y);
    cont.textContent = "Continue: day " + dayOf(saved.t) + " in " + (sd ? sd.name : "Merrow") + ", as " + saved.player.name;
    cont.onclick = () => { state = saved; startApp(); };
  } else cont.hidden = true;
  $("#btn-begin").onclick = () => {
    const name = (nm.value || "").trim() || "Wren";
    state = newState(name, titleHome, []);
    const d = here();
    state.visited[d.key] = { name: d.name, row: d.row, sub: d.sub, first: 1, nights: 0, x: d.x, y: d.y };
    state.rowsSeen[d.row + "@" + d.block.id] = d.row;
    logEntry("Your table has come down to Station Ring " + state.ring + " with hand lamps to see you off, and is pretending not to cry. In your bag: two shirts, a good knife, a crock of starter, a black thread in case, and a year. The first glide is free. So is every one after it.", "start", { title: "Day one" });
    logEntry("Glide to any neighbour from the Departures board, or take a cycler anywhere on Merrow. The Here list is what you can do where you are. Stay up to three nights in any drum that keeps guest-right, eat where you like, and send cards home: the custom is one from every row. Your purse grows by 6 kWh a day, and 9.6 more on days you go dark.", "help", { title: "How a wander year works" });
    startApp();
  };
}

function startApp() {
  $("#title").hidden = true;
  $("#app").hidden = false;
  if (state.transit) { state.arriving = false; finishCycler(); }
  if (state.view === "cycler") state.view = "platform";
  syncStage();
  renderAll();
  window.scrollTo(0, 0);
}

async function doGlide(dx, dy) {
  if (busy) return;
  const nx = state.x + dx, ny = state.y + dy;
  if (!inRaft(nx, ny)) return;
  busy = true;
  const from = here(), to = getDrum(nx, ny);
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  await playGlide(from.name, to.name, Math.abs(dx) + Math.abs(dy));
  glideTo(dx, dy);
  lastTalk = {};
  syncStage();
  renderAll();
  busy = false;
}

function result(res) {
  if (res && res.ok === false && res.why) { toast(res.why); return false; }
  syncStage();
  renderAll();
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  return true;
}

function atPlatform() { state.view = "platform"; }

const ACTIONS = {
  "close": () => closeModal(),
  "sound": (el) => { const on = audioToggle(); el.setAttribute("aria-pressed", String(!!on)); },
  "modal-bg": (el, ev) => { if (ev.target === el) closeModal(); },
  "open-cards": () => openCards(),
  "open-raft": () => openRaftMap(),
  "open-menu": () => openMenu(),
  "open-ledger": () => openLedger(false),
  "open-about": () => openAbout(),
  "restart-ask": () => { $("#restart-confirm").innerHTML = '<div class="famous"><b>Start a new year?</b><br>This year\'s cards and route will be gone.<div style="display:flex;gap:8px;margin-top:8px"><button class="btn go" type="button" data-act="restart-yes">Start again</button><button class="btn" type="button" data-act="close">Keep this year</button></div></div>'; },
  "restart-yes": () => { storageDel(SAVE_KEY); state = null; closeModal(); showTitle(); },
  "hview": (el) => { state.hollowView = el.dataset.v; renderStage(); },
  "to-platform": () => { atPlatform(); syncStage(); renderAll(); },
  "skip-glide": () => { if (glideAnim) { glideAnim.start = performance.now() - glideAnim.dur; const r = glideAnim.resolve; setTimeout(() => { if (r) r(); }, 160); } },
  "feed-more": () => { feedExpanded = !feedExpanded; renderMain(); },
  "talk": (el) => {
    const id = el.dataset.id;
    const p = findPerson(id);
    if (!p) return;
    lastTalk[id] = lastTalk[id] === undefined ? 0 : lastTalk[id] + 1;
    meetPerson(p);
    renderMain();
  },
  "ask": (el) => { const p = findPerson(el.dataset.id); if (p) openAsk(p); },
  "event": (el) => result(attendEvent(Number(el.dataset.i))),
  "eat": (el) => { atPlatform(); result(eatAt(Number(el.dataset.i))); },
  "hall": () => result(eatHall()),
  "glide": (el) => doGlide(Number(el.dataset.dx), Number(el.dataset.dy)),
  "glide-to": (el) => doGlide(Number(el.dataset.x) - state.x, Number(el.dataset.y) - state.y),
  "do-counter": () => { atPlatform(); result(eatCounter()); },
  "do-hollow": () => result(goHollow()),
  "do-spindle": () => result(goSpindle()),
  "do-dawn": () => result(waitForPhase(here().palette.for === "dusk" ? "dusk" : "dawn")),
  "do-window": () => { state.lastWindowKind = "window"; result(goWindow()); },
  "do-backcrew": () => { state.lastWindowKind = "backcrew"; result(backShift()); },
  "do-buy": () => {
    const f = (here().famous || []).find((x) => x.buy);
    if (!f) return;
    if (state.purse < f.buy.kwh) { toast("That's " + fmtKwh(f.buy.kwh) + " kWh. Try going dark for a few days."); return; }
    spend(f.buy.kwh, f.buy.item);
    if (/sleeve/i.test(f.buy.item)) state.hasSleeves = true;
    logEntry("You buy " + f.buy.item + " for " + fmtKwh(f.buy.kwh) + " kWh.", "buy", { title: "A purchase" });
    result({ ok: true });
  },
  "do-sleep": () => result(sleep()),
  "do-wait": () => { atPlatform(); waitHours(1); logEntry("You wait an hour on the platform and watch the glide trains come in through the jacket.", "note", { title: "An hour on the platform" }); result({ ok: true }); },
  "do-spoon": () => result(leaveSpoon()),
  "do-loaf": () => result(giveSpoons()),
  "do-card": () => openComposer(),
  "do-dark": () => { toggleDark(); result({ ok: true }); },
  "do-homecoming": () => { state.ended = true; logEntry("Home. Your block meets you at Station Ring " + state.ring + " with hand lamps, your table at the front.", "home", { title: "Homecoming" }); renderAll(); openLedger(true); },
  "raft-pick": (el) => {
    const k = el.dataset.row;
    let p;
    if (k === "home") p = [state.player.hx, state.player.hy];
    else if (k === "anywhere") { const r = makeRng((Date.now() ^ state.t) >>> 0); p = [r.int(2000, WORLD.N - 2000), r.int(2000, WORLD.N - 2000)]; }
    else { const a = CANON_ROW_ANCHORS[k]; p = [a[0], a[1]]; }
    selectRaftPoint(p[0], p[1]);
  },
  "cycle-go": (el) => runCycler(Number(el.dataset.v)),
  "jr-card": () => {
    const box = document.createElement("div");
    box.className = "famous";
    box.innerHTML = '<div class="field"><label for="jr-to">A card from the line, to</label><input id="jr-to" value="' + esc((state.player.recipients || [])[0] || "my table") + '"></div><div class="field" style="margin-top:6px"><label for="jr-text">The card</label><textarea id="jr-text" style="width:100%;min-height:110px;background:#fbf6ea;color:#2a251f;border:1px solid #c9bda6;border-radius:4px;padding:8px;font-family:var(--font-hand);font-size:15px;box-sizing:border-box"></textarea></div><div style="display:flex;gap:8px;margin-top:6px"><button class="btn" type="button" data-act="jr-suggest">Suggest a line</button><button class="btn go" type="button" data-act="jr-send">Send by light</button></div>';
    const v = $("#jr-v"); if (v) v.prepend(box);
  },
  "jr-suggest": () => { const ta = $("#jr-text"); if (ta) ta.value = cyclerVignette(Math.floor(Math.random() * 99)) + " "; },
  "jr-send": () => {
    const ta = $("#jr-text"), to = $("#jr-to");
    if (!ta || !ta.value.trim()) { toast("Write something first."); return; }
    let front = null;
    try { front = $("#jr-cv").toDataURL("image/jpeg", 0.75); } catch (e) { /* ignore */ }
    const c = sendCard(to.value.trim() || "my table", ta.value.trim(), front, "The route, from the slow line");
    c.drum = "the slow line"; c.row = state.transit && state.transit.speed === 20 ? "express" : "cycler";
    ta.closest(".famous").innerHTML = '<span class="muted">Sent. It will be read ' + fmtSec(c.light) + " from now.</span>";
    saveGame();
  },
  "jr-arrive": async () => {
    const tr = state.transit;
    if (!tr) return;
    state.arriving = true;
    closeModal();
    busy = true;
    const toName = drumNameAt(tr.tx, tr.ty);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    await playGlide("The capsule ramp", toName, 1);
    finishCycler();
    state.arriving = false;
    lastTalk = {};
    syncStage();
    renderAll();
    busy = false;
  },
  "c-suggest": () => { const ta = $("#c-text"); if (ta) ta.value = templateCard($("#c-to").value); },
  "c-draft": async (el) => {
    const ta = $("#c-text"), note = $("#c-note");
    if (!ta) return;
    if (cardCtl) { try { cardCtl.abort(); } catch (e) { /* ignore */ } cardCtl = null; el.textContent = "Draft it with Claude"; note.textContent = "Stopped."; return; }
    el.textContent = "Stop"; note.textContent = "Writing…";
    const ctl = new AbortController();
    cardCtl = ctl;
    try {
      const text = await aiDraftCard($("#c-to").value || "my table", (t) => { ta.value = t; note.textContent = "Writing…"; }, ctl.signal);
      ta.value = text; note.textContent = "Drafted. Change anything you like.";
    } catch (e) {
      if (e && e.code !== "cancelled") { note.textContent = aiErrorCopy(e) || ""; if (!ta.value) ta.value = templateCard($("#c-to").value); }
    } finally {
      if (cardCtl === ctl) cardCtl = null;
      if (document.body.contains(el)) el.textContent = "Draft it with Claude";
    }
  },
  "c-send": () => {
    const ta = $("#c-text"), to = $("#c-to");
    if (!ta || !ta.value.trim()) { toast("Write something first, or ask for a suggestion."); return; }
    const dlg = $(".dialog");
    const c = sendCard(to.value.trim() || "my table", ta.value.trim(), dlg.dataset.front || null, dlg.dataset.label || "");
    closeModal();
    toast("Sent by light. It will be read " + fmtSec(c.light) + " from now.");
    renderAll();
  },
};

function wire() {
  document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-act]");
    if (!el) return;
    const fn = ACTIONS[el.dataset.act];
    if (!fn) return;
    if (el.dataset.act !== "modal-bg") ev.preventDefault();
    if (busy && el.dataset.act !== "skip-glide") return;
    fn(el, ev);
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && $("#modal-root").innerHTML) closeModal();
  });
}

function boot(hotData) {
  initWorld();
  hollowView = new HollowView($("#cv-hollow"));
  glideView = new GlideView($("#cv-glide"));
  windowView = new WindowView($("#cv-window"));
  titleGlide = new GlideView($("#cv-title"));
  titleGlide.setSeed(7);
  wire();
  stageLoop();
  if (hotData && hotData.state) { state = hotData.state; startApp(); }
  else showTitle();
  initAI();
  try {
    if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => ({ state }));
  } catch (e) { /* ignore */ }
}

(function start() {
  const go = (data) => boot(data || {});
  try {
    if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(go);
    else go(window.claude && window.claude.hot ? window.claude.hot.data : null);
  } catch (e) { go(null); }
})();
