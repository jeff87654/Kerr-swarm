// The heads-up display and everything that floats over the world without taking input:
// place, clock, wallet, compass, thread, reticle, prompt, toasts, cards, banners, subtitles,
// bubbles, rides, fades and the letterbox.

import { h, clear, fmt2, fmtDist, wrap180, clamp, kwhText, speakerOf, deferred } from './dom.js';
import { icon, iconEl } from './icons.js';

const POINTS = [
  { deg: 0, label: 'Spinward', cls: 'is-spin' },
  { deg: 90, label: 'Back', cls: '' },
  { deg: 180, label: 'Anti', cls: '' },
  { deg: 270, label: 'Front', cls: '' },
];
const SPAN = 180; // degrees visible across the compass strip

export function createHud(ctx) {
  const { layers, G } = ctx;

  // ---------- frame ----------
  const root = h('div', 'gr-layer gr-hud');
  layers.hud.appendChild(root);

  // place, bottom left
  const placeT = h('div', 'gr-place-title');
  const placeS = h('div', 'gr-place-sub');
  const placeEl = h('div', 'gr-place gr-gone', [h('div', 'gr-pool'), h('div', 'gr-place-rule'), placeT, placeS]);
  root.appendChild(placeEl);

  // status, bottom right
  const weightT = h('span', '', '');
  const weightEl = h('div', 'gr-status-top gr-gone', [iconEl('plumb'), weightT]);
  const clockT = h('span', 'gr-clock-t');
  const clockD = h('span', 'gr-clock-d');
  const clockEl = h('div', 'gr-clock gr-gone', [clockT, clockD]);
  const vrule = h('div', 'gr-vrule gr-gone');
  const walletN = h('span', 'gr-wallet-n', '0.00');
  const walletEl = h('div', 'gr-wallet gr-gone', [walletN, h('span', 'gr-wallet-u', 'kWh')]);
  const statusEl = h('div', 'gr-status', [h('div', 'gr-pool'), weightEl, h('div', 'gr-status-row', [clockEl, vrule, walletEl])]);
  root.appendChild(statusEl);

  // compass, top centre
  const strip = h('div', 'gr-cstrip', h('div', 'gr-cline'));
  const caret = h('div', 'gr-caret');
  const clabel = h('div', 'gr-clabel');
  const compassEl = h('div', 'gr-compass is-off', [h('div', 'gr-pool'), strip, caret, clabel]);
  root.appendChild(compassEl);
  const ticks = [];
  for (let d = 0; d < 360; d += 15) {
    if (d % 90 === 0) continue;
    const t = h('div', 'gr-tick' + (d % 45 === 0 ? ' is-mid' : ''));
    t._deg = d;
    strip.appendChild(t);
    ticks.push(t);
  }
  const pts = POINTS.map((p) => {
    const e = h('div', 'gr-card-pt ' + p.cls, p.label);
    e._deg = p.deg;
    strip.appendChild(e);
    return e;
  });
  const majors = POINTS.map((p) => {
    const t = h('div', 'gr-tick is-mid');
    t.style.height = '10px';
    t._deg = p.deg;
    strip.appendChild(t);
    return t;
  });
  const markEls = new Map();
  let stripW = 0;
  let yaw = 0;
  let markers = [];
  let compassDirty = true;

  // thread
  const threadT = h('span', 'gr-thread-t');
  const threadEl = h('div', 'gr-thread is-off', [iconEl('thread'), threadT]);
  root.appendChild(threadEl);

  // reticle and prompt
  const ret = h('div', 'gr-ret m-dot', [h('div', 'gr-ret-dot'), h('div', 'gr-ret-ring'), h('div', 'gr-ret-talk'), h('div', 'gr-ret-aim')]);
  ret.children[2].innerHTML = icon('talk');
  root.appendChild(ret);
  const promptKey = h('span', 'gr-key');
  const promptT = h('span', 'gr-prompt-t');
  const promptEl = h('div', 'gr-prompt', [promptKey, promptT]);
  root.appendChild(promptEl);

  // notes layer
  const toasts = h('div', 'gr-toasts');
  layers.note.appendChild(toasts);
  const dcardK = h('span', 'gr-kicker');
  const dcardT = h('div', 'gr-dcard-t');
  const dcardX = h('div', 'gr-dcard-x');
  const dcard = h('div', 'gr-dcard gr-panel', [h('div', 'gr-dcard-k', [iconEl('sprig'), dcardK]), dcardT, h('div', 'gr-orn', h('i')), dcardX]);
  layers.note.appendChild(dcard);
  const subs = h('div', 'gr-subs');
  layers.note.appendChild(subs);
  const rideK = h('div', 'gr-ride-k');
  const rideB = h('div', 'gr-ride-b');
  const rideS = h('div', 'gr-ride-s');
  const rideEl = h('div', 'gr-ride', [rideK, rideB, rideS]);
  layers.note.appendChild(rideEl);

  const bannerT = h('div', 'gr-banner-t');
  const bannerS = h('div', 'gr-banner-s');
  const bannerEl = h('div', 'gr-banner', [bannerT, bannerS]);
  layers.banner.appendChild(bannerEl);

  const fadeEl = h('div', 'gr-fade');
  layers.fade.appendChild(fadeEl);
  layers.letter.appendChild(h('div', 'gr-lb is-top'));
  layers.letter.appendChild(h('div', 'gr-lb is-bot'));

  // ---------- place, clock, wallet, weight ----------
  let placeKey = '';
  let placeTimer = 0;
  function place(title, sub) {
    // the city's zones write their line from the middle of a sentence ('decks 140 to 145 · Ring Five', 'the long table · ...')
    if (sub) sub = String(sub).charAt(0).toUpperCase() + String(sub).slice(1);
    const key = (title || '') + '|' + (sub || '');
    if (key === placeKey) return;
    placeKey = key;
    if (!title && !sub) { placeEl.classList.add('gr-gone'); return; }
    const apply = () => {
      placeT.textContent = title || '';
      placeS.textContent = sub || '';
      placeS.classList.toggle('gr-gone', !sub);
      placeEl.classList.remove('gr-gone');
      requestAnimationFrame(() => placeEl.classList.remove('is-swap'));
    };
    clearTimeout(placeTimer);
    if (placeEl.classList.contains('gr-gone')) { placeEl.classList.add('is-swap'); apply(); return; }
    placeEl.classList.add('is-swap');
    placeTimer = setTimeout(apply, 380);
  }

  function clock(text) {
    if (text == null || text === '') { clockEl.classList.add('gr-gone'); syncRule(); return; }
    const parts = String(text).split(/\s*·\s*/);
    clockT.textContent = parts[0] || '';
    clockD.textContent = parts.slice(1).join(' · ');
    clockEl.classList.remove('gr-gone');
    syncRule();
  }

  let wShown = null;
  let wTarget = null;
  let wFrom = 0;
  let wT = 1;
  function wallet(kwh, delta) {
    const v = Number(kwh);
    if (!isFinite(v)) { walletEl.classList.add('gr-gone'); syncRule(); return; }
    walletEl.classList.remove('gr-gone');
    syncRule();
    let d = Number(delta);
    if (!isFinite(d) || delta == null) d = wTarget == null ? 0 : v - wTarget;
    if (wShown == null) { wShown = v; wTarget = v; walletN.textContent = fmt2(v); return; }
    if (Math.abs(v - wTarget) < 0.0005 && !(delta != null && Math.abs(d) >= 0.005)) return;
    wFrom = wShown;
    wTarget = v;
    wT = 0;
    if (Math.abs(d) >= 0.005) {
      const de = h('div', 'gr-delta', (d > 0 ? '+' : '-') + fmt2(Math.abs(d)));
      walletEl.appendChild(de);
      setTimeout(() => de.remove(), 1900);
      walletEl.classList.remove('is-pulse');
      void walletEl.offsetWidth;
      walletEl.classList.add('is-pulse');
    }
  }
  function syncRule() {
    vrule.classList.toggle('gr-gone', clockEl.classList.contains('gr-gone') || walletEl.classList.contains('gr-gone'));
  }

  function weight(g) {
    const v = Number(g);
    if (g == null || !isFinite(v)) { weightEl.classList.add('gr-gone'); return; }
    weightT.textContent = v.toFixed(2) + ' g';
    weightEl.classList.remove('gr-gone');
  }

  // ---------- compass ----------
  function compass(yawDeg, list) {
    const y = Number(yawDeg);
    if (yawDeg == null || !isFinite(y)) { compassEl.classList.add('is-off'); return; }
    compassEl.classList.remove('is-off');
    if (Math.abs(wrap180(y - yaw)) > 0.02) compassDirty = true;
    yaw = y;
    if (list !== undefined) { markers = Array.isArray(list) ? list : []; compassDirty = true; }
  }
  function layoutCompass() {
    if (!compassDirty || compassEl.classList.contains('is-off')) return;
    compassDirty = false;
    if (!stripW) stripW = strip.clientWidth || 0;
    if (!stripW) { compassDirty = true; return; }
    const ppd = stripW / SPAN;
    const half = stripW / 2;
    const place1 = (e, deg, w) => {
      const rel = wrap180(deg - yaw);
      if (Math.abs(rel) > SPAN / 2 + 8) { e.style.opacity = '0'; return rel; }
      e.style.opacity = '';
      e.style.transform = 'translateX(' + (half + rel * ppd - (w || 0)).toFixed(1) + 'px)';
      return rel;
    };
    for (const t of ticks) place1(t, t._deg, 0);
    for (const t of majors) place1(t, t._deg, 0);
    for (const p of pts) {
      if (!p._w) p._w = p.offsetWidth || 50;
      place1(p, p._deg, p._w / 2);
    }
    const seen = new Set();
    let best = null;
    for (const m of markers) {
      if (!m || m.bearing == null) continue;
      const id = String(m.id != null ? m.id : m.label);
      seen.add(id);
      let e = markEls.get(id);
      if (!e) { e = h('div', 'gr-cmark', h('i')); strip.appendChild(e); markEls.set(id, e); }
      e.className = 'gr-cmark is-' + (m.kind || 'place');
      let rel = wrap180(Number(m.bearing) - yaw);
      const lim = SPAN / 2 - 6;
      if (Math.abs(rel) > lim) { e.classList.add('is-edge'); rel = Math.sign(rel) * lim; }
      e.style.transform = 'translateX(' + (half + rel * ppd).toFixed(1) + 'px)';
      if (Math.abs(rel) < 9 && (!best || Math.abs(rel) < best.r || (m.kind === 'thread' && best.m.kind !== 'thread'))) best = { r: Math.abs(rel), m };
    }
    for (const [id, e] of markEls) if (!seen.has(id)) { e.remove(); markEls.delete(id); }
    if (best && best.m.label) {
      clear(clabel);
      clabel.appendChild(document.createTextNode(best.m.label));
      if (best.m.dist != null) clabel.appendChild(h('b', '', fmtDist(best.m.dist)));
      clabel.classList.add('is-on');
    } else clabel.classList.remove('is-on');
  }
  const onResize = () => { stripW = 0; for (const p of pts) p._w = 0; compassDirty = true; };
  window.addEventListener('resize', onResize);
  ctx.cleanup.push(() => window.removeEventListener('resize', onResize));

  // ---------- thread ----------
  let threadText = null;
  function thread(text) {
    if (!text) { threadText = null; threadEl.classList.add('is-off'); return; }
    if (text === threadText) return;
    const isNew = threadText !== null;
    threadText = text;
    threadT.textContent = text;
    threadEl.classList.remove('is-off', 'is-new');
    if (isNew) { void threadEl.offsetWidth; threadEl.classList.add('is-new'); }
  }

  // ---------- reticle and prompt ----------
  let promptOn = false;
  function prompt(text, key) {
    if (!text) {
      promptEl.classList.remove('is-on');
      promptOn = false;
      if (ctx.onPrompt) ctx.onPrompt(false);
      return;
    }
    promptT.textContent = text;
    const k = key === undefined ? 'E' : key;
    promptKey.textContent = k || '';
    promptKey.classList.toggle('gr-gone', !k);
    promptEl.classList.add('is-on');
    promptOn = true;
    if (ctx.onPrompt) ctx.onPrompt(true);
  }
  function reticle(mode) {
    const m = ['dot', 'use', 'talk', 'aim', 'none'].indexOf(mode) >= 0 ? mode : 'dot';
    ret.className = 'gr-ret m-' + m;
  }

  // ---------- toasts ----------
  const TOAST_ICON = { info: 'info', gain: 'energy', spend: 'energy', thread: 'thread', found: 'sprig' };
  function toast(text, opts) {
    if (!text) return;
    const o = opts || {};
    const kind = TOAST_ICON[o.kind] ? o.kind : 'info';
    const t = h('div', 'gr-toast gr-panel k-' + kind, [iconEl(TOAST_ICON[kind]), h('div', 'gr-toast-t', kwhText(text))]);
    toasts.appendChild(t);
    while (toasts.children.length > 4) toasts.firstChild.remove();
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('is-on')));
    if (kind === 'thread') ctx.sfx('thread');
    else if (kind === 'found') ctx.sfx('found');
    const dur = (o.dur || Math.min(7, 3 + String(text).length / 28)) * 1000;
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 400); }, dur);
  }

  // ---------- discovery cards and banners take turns, in the order they were asked for ----------
  const noteQ = [];
  let noteBusy = false;
  function card(o) {
    if (!o) return;
    noteQ.push({ k: 'card', o });
    pump();
  }
  function banner(title, sub) {
    if (!title) return;
    noteQ.push({ k: 'banner', o: { title, sub } });
    pump();
  }
  function pump() {
    if (noteBusy) return;
    const n = noteQ.shift();
    if (!n) return;
    noteBusy = true;
    const done = () => { noteBusy = false; pump(); };
    if (n.k === 'card') showCard(n.o, done);
    else showBanner(n.o, done);
  }
  function showCard(o, done) {
    dcardK.textContent = o.kicker || 'Found';
    dcardT.textContent = o.title || '';
    dcardX.textContent = o.text || '';
    dcardX.classList.toggle('gr-gone', !o.text);
    ctx.sfx('found');
    requestAnimationFrame(() => requestAnimationFrame(() => dcard.classList.add('is-on')));
    const dur = (o.dur || Math.min(9, 4.5 + String(o.text || '').length / 40)) * 1000;
    setTimeout(() => { dcard.classList.remove('is-on'); setTimeout(done, 550); }, dur);
  }
  function showBanner(b, done) {
    bannerT.textContent = b.title;
    bannerS.textContent = b.sub || '';
    bannerS.classList.toggle('gr-gone', !b.sub);
    requestAnimationFrame(() => requestAnimationFrame(() => bannerEl.classList.add('is-on')));
    setTimeout(() => { bannerEl.classList.remove('is-on'); setTimeout(done, 950); }, 4200);
  }

  // ---------- subtitles ----------
  function subtitle(speaker, text, dur) {
    if (!text || ctx.subsOff()) return;
    const sp = speakerOf(speaker);
    const s = h('div', 'gr-sub', [sp.name ? h('b', '', sp.name) : null, String(text)]);
    subs.appendChild(s);
    while (subs.children.length > 3) subs.firstChild.remove();
    requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('is-on')));
    const ms = (dur || 2.2 + String(text).length / 15) * 1000;
    setTimeout(() => { s.classList.remove('is-on'); setTimeout(() => s.remove(), 320); }, ms);
  }

  // ---------- bubbles ----------
  const bubbles = new Map();
  function bubble(id, text, anchor) {
    const key = String(id);
    let b = bubbles.get(key);
    if (!text) {
      if (b) { b.el.style.opacity = '0'; setTimeout(() => b.el.remove(), 260); bubbles.delete(key); }
      return;
    }
    if (!b) {
      b = { el: h('div', 'gr-bubble'), anchor: null };
      b.el.style.opacity = '0';
      layers.world.appendChild(b.el);
      bubbles.set(key, b);
    }
    b.el.textContent = text;
    b.w = 0;
    if (typeof anchor === 'function') b.anchor = anchor;
    placeBubble(b);
  }
  function placeBubble(b) {
    let a = null;
    try { a = b.anchor ? b.anchor() : null; } catch (e) { a = null; }
    if (!a || !a.visible || !isFinite(a.x) || !isFinite(a.y)) { b.el.style.opacity = '0'; return; }
    if (!b.w) { b.w = b.el.offsetWidth; b.h = b.el.offsetHeight; }
    const dist = isFinite(a.dist) ? a.dist : 4;
    const op = clamp(1 - (dist - 9) / 9, 0, 1);
    const sc = clamp(1.08 - dist / 40, 0.78, 1);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = clamp(a.x - b.w / 2, 8, vw - b.w - 8);
    const y = clamp(a.y - b.h - 12, 8, vh - b.h - 8);
    b.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
    b.el.style.opacity = String(op);
  }

  // ---------- fade, letterbox, ride ----------
  let fadeD = null;
  let fadeTimer = 0;
  function fade(toBlack, seconds) {
    if (fadeD) fadeD.resolve();
    clearTimeout(fadeTimer);
    const d = deferred();
    fadeD = d;
    const s = Math.max(0, Number(seconds) || 0);
    fadeEl.style.transitionDuration = s + 's';
    void fadeEl.offsetWidth;
    fadeEl.style.opacity = toBlack ? '1' : '0';
    fadeTimer = setTimeout(() => { d.resolve(); if (fadeD === d) fadeD = null; }, s * 1000 + 30);
    return d.promise;
  }
  function letterbox(on) {
    layers.letter.classList.toggle('is-on', !!on);
  }
  function ride(info) {
    if (!info) { rideEl.classList.remove('is-on'); return; }
    rideK.textContent = info.kicker || '';
    rideB.textContent = info.big != null ? String(info.big) : '';
    rideS.textContent = info.sub || '';
    rideK.classList.toggle('gr-gone', !info.kicker);
    rideS.classList.toggle('gr-gone', !info.sub);
    rideEl.classList.add('is-on');
  }

  // ---------- frame update ----------
  function update(dt) {
    if (wT < 1) {
      wT = Math.min(1, wT + dt / 0.65);
      const e = 1 - Math.pow(1 - wT, 3);
      wShown = wFrom + (wTarget - wFrom) * e;
      walletN.textContent = fmt2(wShown);
    }
    layoutCompass();
    for (const b of bubbles.values()) placeBubble(b);
  }

  function show(on) {
    root.classList.toggle('is-hidden', on === false);
  }

  return {
    hud: { show, place, clock, wallet, compass, thread, weight },
    prompt, reticle, toast, card, banner, subtitle, bubble, fade, letterbox, ride, update,
    syncWorld: () => { for (const b of bubbles.values()) placeBubble(b); },
    promptVisible: () => promptOn,
  };
}
