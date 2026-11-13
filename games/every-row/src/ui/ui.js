// The page round the picture: the opening screen, each world's card, a bar of controls, the list of worlds.
import { TIERS } from '../core/engine.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get(k, d) { try { const v = localStorage.getItem('every-row.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('every-row.' + k, JSON.stringify(v)); } catch (e) { /* private window */ } } };

const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M5 5v14l9-7zM16 5h3v14h-3z"/></svg>',
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path class="wave" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  grid: '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>',
  full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

/**
 * Build the interface. hooks: { sound: { on, set(on) } } (optional). Returns { showCard(def), setWaiting(bool) }.
 */
export function mountUI(root, engine, worlds, hooks = {}) {
  root.innerHTML = '';
  let cards = 0, started = false, idleTimer = 0, cardTimer = 0, soundOn = false;

  // ---- opening
  const open = el('div', 'er-open');
  open.innerHTML = `
    <div class="er-open-in">
      <div class="er-kicker">Merrow &middot; three hundred billion drums</div>
      <h1>A Card from Every Row</h1>
      <p class="er-sub">An endless flight through the drums of Merrow, in the order of one wander year. Each drum is a nation of two hundred million turning round its own small sun, and no two keep house the same way. Nothing to steer: the camera flies itself, and every place ends in a way through to the next.</p>
      <button class="er-begin" type="button">Begin</button>
      <div class="er-hint">Space pauses &middot; &rarr; skips ahead &middot; S for sound &middot; G for the drums</div>
    </div>`;
  root.appendChild(open);

  // ---- the card
  const card = el('div', 'er-card');
  root.appendChild(card);

  // ---- waiting note
  const waitNote = el('div', 'er-wait', 'finding the next drum');
  root.appendChild(waitNote);

  // ---- controls
  const bar = el('div', 'er-bar');
  const btn = (name, icon, title, fn) => { const b = el('button', 'er-btn er-b-' + name, icon); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.addEventListener('click', (e) => { e.stopPropagation(); fn(b); }); bar.appendChild(b); return b; };
  const bPause = btn('pause', ICON.pause, 'Pause (Space)', () => togglePause());
  btn('next', ICON.next, 'Skip to the way through (right arrow)', () => engine.skip());
  const bSound = btn('sound', ICON.mute, 'Sound (S)', () => toggleSound());
  btn('grid', ICON.grid, 'The drums (G)', () => toggleGallery());
  const bGear = btn('gear', ICON.gear, 'Picture quality', () => cycleTier());
  btn('full', ICON.full, 'Full screen (F)', () => toggleFull());
  const tierNote = el('span', 'er-tier', '');
  bar.appendChild(tierNote);
  root.appendChild(bar);

  // ---- the list of worlds
  const gal = el('div', 'er-gallery');
  const galIn = el('div', 'er-gallery-in');
  const head = el('div', 'er-gallery-head', `<h2>The drums</h2><p>Every place here is from the Kerr swarm world bible, in the order Marit Vell saw them on her wander year. Pick one to go there now; the flight carries on from it.</p>`);
  const x = el('button', 'er-btn er-x', ICON.close); x.type = 'button'; x.title = 'Close'; x.addEventListener('click', () => toggleGallery(false));
  head.appendChild(x);
  galIn.appendChild(head);
  const grid = el('div', 'er-grid');
  for (const w of worlds) {
    if (w.hidden) continue;
    const c = el('button', 'er-tile');
    c.type = 'button';
    c.style.setProperty('--tone', w.tone || '#d8c8a8');
    c.innerHTML = `<span class="er-tile-where">${esc(w.drum)} &middot; ${esc(w.row)}</span><span class="er-tile-title">${esc(w.title)}</span><span class="er-tile-kind">${esc(w.kind)}</span>`;
    c.addEventListener('click', () => { toggleGallery(false); begin(); engine.jump(w.id); });
    grid.appendChild(c);
  }
  galIn.appendChild(grid);
  galIn.appendChild(el('p', 'er-about', 'The drums, their rows and their customs come from the world bible\'s docs (open-drums, wander-year, ashgrove, sorrel, eating-out and the rest). Where the docs are silent, as on how most Hollows are laid out, the plans are this page\'s own and are not canon. Everything is drawn in your browser as it flies: no pictures, models or recordings are loaded.'));
  gal.appendChild(galIn);
  root.appendChild(gal);

  // ---- behaviour
  function begin() {
    if (started) return;
    started = true;
    open.classList.add('gone');
    engine.fadeTarget = 1;
    engine.paused = false;
    if (lastDef) showCard(lastDef);
    if (hooks.onBegin) hooks.onBegin();
  }
  open.querySelector('.er-begin').addEventListener('click', begin);

  function togglePause(v) { engine.paused = v === undefined ? !engine.paused : v; bPause.innerHTML = engine.paused ? ICON.play : ICON.pause; root.classList.toggle('paused', engine.paused); wake(); }
  function toggleSound(v) { soundOn = v === undefined ? !soundOn : v; bSound.innerHTML = soundOn ? ICON.sound : ICON.mute; if (hooks.sound) hooks.sound(soundOn); store.set('sound', soundOn); }
  function toggleGallery(v) { const on = v === undefined ? !gal.classList.contains('on') : v; gal.classList.toggle('on', on); }
  function toggleFull() { try { const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => { /* not allowed here */ }); } catch (e) { /* not allowed here */ } }
  function showTier() { tierNote.textContent = (engine.autoTier ? 'Auto' : TIERS[engine.tierIndex].name); }
  function cycleTier() {
    // Auto -> Low -> Medium -> High -> Ultra -> Auto
    if (engine.autoTier) { engine.autoTier = false; engine.setTier(0); }
    else if (engine.tierIndex >= TIERS.length - 1) { engine.autoTier = true; engine.setTier(2); }
    else engine.setTier(engine.tierIndex + 1);
    store.set('tier', engine.autoTier ? 'auto' : engine.tierIndex);
    showTier(); bGear.classList.add('flash'); setTimeout(() => bGear.classList.remove('flash'), 300);
  }
  showTier();

  function wake() { root.classList.add('awake'); clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (!engine.paused && !gal.classList.contains('on')) root.classList.remove('awake'); }, 2600); }
  window.addEventListener('pointermove', wake, { passive: true });
  window.addEventListener('pointerdown', wake, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    const k = e.key;
    if (k === ' ' || k === 'Spacebar') { e.preventDefault(); if (!started) begin(); else togglePause(); }
    else if (k === 'Enter' && !started) begin();
    else if (k === 'ArrowRight') { begin(); engine.skip(); }
    else if (k === 's' || k === 'S') toggleSound();
    else if (k === 'g' || k === 'G' || k === 'i' || k === 'I') toggleGallery();
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === 'q' || k === 'Q') cycleTier();
    else if (k === 'Escape') toggleGallery(false);
  });

  let lastDef = null;
  function showCard(def) {
    lastDef = def;
    if (!started) return;
    cards++;
    clearTimeout(cardTimer);
    card.classList.remove('on');
    const light = typeof def.light === 'number' ? (def.light === 0 ? 'home' : `light home ${def.light.toFixed(1)} s`) : '';
    cardTimer = setTimeout(() => {
      card.style.setProperty('--tone', def.tone || '#d8c8a8');
      card.innerHTML = `
        <div class="er-card-where">${esc(def.drum)} <i>&middot;</i> ${esc(def.row)} <i>&middot;</i> ${esc(def.kind)}</div>
        <div class="er-card-title">${esc(def.title)}</div>
        <div class="er-card-line">${esc(def.line || '')}</div>
        <div class="er-card-mark"><span class="er-stamp"></span>card ${cards}${light ? ' &middot; ' + light : ''}</div>`;
      card.classList.add('on');
      cardTimer = setTimeout(() => card.classList.remove('on'), 11000);
    }, 900);
  }

  // remembered choices
  if (store.get('tier', 'auto') !== 'auto' && !hooks.fixedTier) { engine.autoTier = false; engine.setTier(store.get('tier', 2)); showTier(); }

  return {
    showCard, begin,
    setWaiting(on) { waitNote.classList.toggle('on', !!on && started); },
    get started() { return started; },
    wantsSound: () => store.get('sound', false),
  };
}
