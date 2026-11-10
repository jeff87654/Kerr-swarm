// Guest-Right's interface: everything that is not the 3D world. createUI(game) builds it under one
// root (#gr-ui) above the canvas. See ARCHITECTURE.md, section UI, for the contract.
//
// Engine notes:
// - The root has pointer-events: none; only open panels take the pointer. z-index 50.
// - While ui.modal is true the UI takes every keydown (capture phase on window) and stops it,
//   so the game sees no key presses then. Keyups are left alone so held keys release cleanly.
//   When nothing is open, Esc is not taken: the game calls ui.pause.open().
// - Opening a screen that needs the cursor calls document.exitPointerLock().
// - Events emitted on game.events: 'ui:modal' (bool), 'ui:pause' (bool), 'ui:leave' (true),
//   'ui:chapter' (chapter id), 'ui:photo' (bool).

import { CSS_BASE } from './css.js';
import { CSS_SCREENS } from './css2.js';
import { h, safeGame, isTyping } from './dom.js';
import { createStack, trapTab } from './stack.js';
import { createHud } from './hud.js';
import { createTalk } from './talk.js';
import { createVenue } from './venue.js';
import { createScreens } from './screens.js';
import { createJournal } from './journal.js';
import { createMap } from './map.js';
import { createPhoto } from './photo.js';
import { createCardHome } from './card.js';
import { createTouch } from './touch.js';

const LAYERS = ['world', 'hud', 'touch', 'letter', 'note', 'fade', 'banner', 'talk', 'photo', 'screen', 'load'];

export function createUI(game) {
  const G = safeGame(game);

  // one style element and one root, replaced if createUI runs again (as it does in the dev page)
  const old = document.getElementById('gr-ui');
  if (old && old._grDestroy) old._grDestroy();
  else if (old) old.remove();
  let style = document.getElementById('gr-ui-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'gr-ui-style';
    document.head.appendChild(style);
  }
  style.textContent = CSS_BASE + CSS_SCREENS;

  const root = h('div', '');
  root.id = 'gr-ui';
  const layers = {};
  for (const name of LAYERS) {
    const l = h('div', 'gr-layer gr-l-' + name);
    layers[name] = l;
    root.appendChild(l);
  }
  (document.body || document.documentElement).appendChild(root);

  // ---------- the ticker ----------
  const tickers = new Set();
  let raf = 0;
  let last = performance.now();
  let subsT = 0;
  function frame(t) {
    const dt = Math.min(0.1, Math.max(0, (t - last) / 1000));
    last = t;
    for (const f of Array.from(tickers)) {
      let keep;
      try { keep = f(dt); } catch (err) { console.error(err); keep = false; }
      if (keep === false) tickers.delete(f);
    }
    try { hud.update(dt); } catch (err) { console.error(err); }
    subsT -= dt;
    if (subsT <= 0) { subsT = 0.5; readSubs(); }
    raf = requestAnimationFrame(frame);
  }
  function tick(fn) { tickers.add(fn); }

  // ---------- sounds, throttled so a sweep across a list is not a rattle ----------
  let lastHover = 0;
  function sfx(name) {
    if (name === 'hover') {
      const now = performance.now();
      if (now - lastHover < 45) return;
      lastHover = now;
    }
    G.sfx(name);
  }

  // ---------- modal state ----------
  // ui.modal is true while anything in the stack takes input. 'ui:modal' false is sent a task
  // later, so `await ui.say(); await ui.choose()` stays modal from start to finish.
  let modal = false;
  let told = false;
  let touch = null;
  const stack = createStack(() => {
    const m = stack.layers.length > 0;
    modal = m;
    root.classList.toggle('gr-modal', m);
    root.classList.toggle('gr-has-screen', stack.layers.some((l) => l.screen));
    const top = stack.top();
    if (m && top && top.cursor && document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (err) { /* ignore */ }
    }
    if (m && !told) {
      told = true;
      if (touch) touch.reset();
      G.emit('ui:modal', true);
    } else if (!m && told) {
      setTimeout(() => {
        if (!modal && told) { told = false; G.emit('ui:modal', false); }
      }, 0);
    }
  });

  let subsMode = '';
  function readSubs(v) {
    const s = String(v != null ? v : G.get('subtitles', 'small'));
    if (s === subsMode) return;
    subsMode = s;
    root.classList.toggle('gr-sub-large', s === 'large');
    root.classList.toggle('gr-sub-off', s === 'off');
  }

  const ctx = {
    G, layers, stack, tick, sfx, root,
    cleanup: [],
    setTalking: (b) => root.classList.toggle('gr-talking', !!b),
    setPhoto: (b) => root.classList.toggle('gr-photo-on', !!b),
    setTouch: (b) => root.classList.toggle('gr-touch-on', !!b),
    subsOff: () => subsMode === 'off',
    onSetting: (k, v) => { if (k === 'subtitles') readSubs(v); },
    onPrompt: (b) => { if (touch) touch.useHint(b); },
    openPause: () => screens.pause.open(),
    openJournal: () => journal.open(),
    openMap: () => map.open(),
  };

  const hud = createHud(ctx);
  const talk = createTalk(ctx);
  const venue = createVenue(ctx);
  const screens = createScreens(ctx);
  const journal = createJournal(ctx);
  const map = createMap(ctx);
  const photo = createPhoto(ctx);
  const cardHome = createCardHome(ctx);
  touch = createTouch(ctx);
  readSubs();

  // ---------- keys ----------
  function onKeyDown(e) {
    const top = stack.top();
    if (typeof e.key !== 'string' || !e.key) return;
    if (top) {
      if ((e.ctrlKey || e.metaKey || e.altKey) && !top.ctrlKeys) return;
      e.stopImmediatePropagation();
      if (e.key === 'Tab') { trapTab(e, top.el); return; }
      const ae = document.activeElement;
      let used = false;
      if (ae && ae._grKey && top.el && top.el.contains(ae) && !isTyping(e)) {
        try { used = ae._grKey(e) === true; } catch (err) { console.error(err); }
      }
      if (!used && top.key) {
        try { top.key(e); } catch (err) { console.error(err); }
      }
      if (!isTyping(e) && (e.key === ' ' || e.key.indexOf('Arrow') === 0)) e.preventDefault();
      return;
    }
    if (photo.active && !(e.ctrlKey || e.metaKey || e.altKey)) {
      if (photo.key(e)) e.stopImmediatePropagation();
    }
  }
  window.addEventListener('keydown', onKeyDown, true);
  raf = requestAnimationFrame(frame);

  // Removes the UI and every listener it added. Open waits resolve with null (pause and title too).
  function destroy() {
    cancelAnimationFrame(raf);
    tickers.clear();
    window.removeEventListener('keydown', onKeyDown, true);
    for (const f of ctx.cleanup) { try { f(); } catch (err) { /* ignore */ } }
    ctx.cleanup.length = 0;
    for (const l of stack.layers.slice().reverse()) { if (l.handle) l.handle.close(null); }
    if (photo.active) photo.exit();
    if (touch.enabled) touch.enable(false);
    root.remove();
  }
  root._grDestroy = destroy;

  const ui = {
    get modal() { return modal; },
    update(dt) {
      // the ticker runs on its own; this keeps world-pinned bubbles in step with the camera
      try { hud.syncWorld(dt); } catch (err) { console.error(err); }
    },

    loading: screens.loading,
    titleScreen: (o) => screens.titleScreen(o),

    hud: hud.hud,
    prompt: (text, key) => hud.prompt(text, key),
    reticle: (mode) => hud.reticle(mode),
    toast: (text, o) => hud.toast(text, o),
    card: (o) => hud.card(o),
    banner: (title, sub) => hud.banner(title, sub),
    subtitle: (speaker, text, dur) => hud.subtitle(speaker, text, dur),
    bubble: (id, text, anchor) => hud.bubble(id, text, anchor),
    fade: (toBlack, seconds) => hud.fade(toBlack, seconds),
    letterbox: (on) => hud.letterbox(on),
    ride: (info) => hud.ride(info),

    say: (speaker, lines, opts) => talk.say(speaker, lines, opts),
    choose: (speaker, prompt, options) => talk.choose(speaker, prompt, options),
    menu: (o) => venue.menu(o),
    pickHour: (o) => venue.pickHour(o),

    pause: screens.pause,
    journal: { open: (tab) => journal.open(tab), close: () => journal.close(), get isOpen() { return journal.isOpen; } },
    map: { open: (view) => map.open(view), close: () => map.close(), get isOpen() { return map.isOpen; } },
    photo: { enter: () => photo.enter(), exit: () => photo.exit(), take: () => photo.take(), get active() { return photo.active; } },
    cardHome: (o) => cardHome(o),
    credits: (lines) => screens.credits(lines),

    touch: { enable: (on) => touch.enable(on), get enabled() { return touch.enabled; } },

    // small extensions beyond the contract
    setKeys: (list) => screens.setKeys(list),
    setChapters: (list) => screens.setChapters(list),
    help: () => screens.openHelp(),
    root,
    destroy,
  };
  return ui;
}
