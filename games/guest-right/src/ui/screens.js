// Title, pause, how to play, chapters, credits and loading.

import { h, btn, deferred, isKey, focusEl, fmt2 } from './dom.js';
import { iconEl } from './icons.js';
import { openScreen } from './stack.js';
import { openSettings, sheetHead, rowNav } from './settings.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export const DEFAULT_KEYS = [
  { k: ['W', 'A', 'S', 'D'], t: 'Walk' },
  { k: ['Mouse'], t: 'Look about' },
  { k: ['E'], t: 'Use, talk, sit' },
  { k: ['Space'], t: 'Jump' },
  { k: ['Shift'], t: 'Hurry' },
  { k: ['J'], t: 'Journal' },
  { k: ['M'], t: 'Map' },
  { k: ['P'], t: 'Photo mode' },
  { k: ['Esc'], t: 'Pause' },
];

const HELP_NOTES = [
  ['Your wallet is energy', 'It fills to 21.60 kWh a day. The commons cost nothing: the Mill table, the lit streets, the cabs and the Glide.'],
  ['Out is down', 'The middle of the drum is up. Avenues run spinward, the way the drum turns, and streets run along the axis.'],
  ['In conversation', 'E, Space or a click goes on. Number keys pick a reply. Esc leaves a menu.'],
  ['On a phone', 'Your left thumb walks, your right thumb looks. The buttons at the right use, jump, hurry and open the journal.'],
];

export const DEFAULT_CREDITS = [
  { title: 'Guest-Right' },
  'Three nights in Chervil',
  '',
  { h: 'Made in code' },
  'Every street, lamp, voice and tune',
  '',
  { h: 'Set in' },
  'The Kerr swarm, Herb Row',
  '',
  { h: 'Type' },
  'Cormorant Garamond, Barlow, Barlow Condensed and Caveat',
  'under the SIL Open Font Licence',
  '',
  { h: 'Built with' },
  'three.js',
  '',
  { h: 'With thanks' },
  'To every hall that sets a place for a stranger',
];

// A vertical list of big tracked buttons, driven by keys or pointer.
function listMenu(ctx, items, onPick) {
  const el = h('div', 'gr-list');
  let focus = -1;
  const rows = items.map((it, i) => {
    const b = btn('gr-li gr-nav', [h('span', 'gr-li-t', it.label), it.sub ? h('span', 'gr-li-s', it.sub) : null]);
    b.addEventListener('mouseenter', () => set(i, true));
    b.addEventListener('focus', () => set(i, false));
    b.addEventListener('click', () => { ctx.sfx('click'); onPick(it, i); });
    el.appendChild(b);
    return b;
  });
  function set(i, sound) {
    if (i === focus || !rows[i]) return;
    focus = i;
    rows.forEach((r, j) => r.classList.toggle('is-focus', j === i));
    if (document.activeElement !== rows[i]) focusEl(rows[i]);
    if (sound) ctx.sfx('hover');
  }
  function key(e) {
    const n = rows.length;
    if (e.key === 'ArrowDown' || isKey(e, 's')) { e.preventDefault(); set(((focus < 0 ? -1 : focus) + 1) % n, true); return true; }
    if (e.key === 'ArrowUp' || isKey(e, 'w')) { e.preventDefault(); set((focus <= 0 ? n : focus) - 1, true); return true; }
    if (isKey(e, 'Enter', ' ', 'e')) { e.preventDefault(); if (!e.repeat && focus >= 0) { ctx.sfx('click'); onPick(items[focus], focus); } return true; }
    return false;
  }
  return { el, rows, set, key, focused: () => rows[focus] };
}

export function createScreens(ctx) {
  const { G } = ctx;
  let chapters = [];
  let keys = DEFAULT_KEYS;
  let titleH = null;
  let pauseH = null;
  let pauseD = null;

  // ---------- shared sheets ----------
  function openHelp(parent) {
    let handle = null;
    const head = sheetHead('How to play', 'A guest’s guide', () => handle && handle.close(null));
    const keyRows = keys.map((r) => h('div', 'gr-help-k', [
      h('div', 'gr-help-keys', (r.k || []).map((k) => h('span', 'gr-key', k))),
      h('div', 'gr-help-t', r.t),
    ]));
    const notes = HELP_NOTES.map(([t, x]) => h('div', 'gr-help-n', [h('div', 'gr-help-nt', t), h('div', 'gr-help-nx', x)]));
    const body = h('div', 'gr-sheet-body gr-help', [
      h('div', 'gr-help-col', [h('div', 'gr-sec', h('span', 'gr-kicker', 'Keys')), h('div', 'gr-help-grid', keyRows)]),
      h('div', 'gr-help-col', [h('div', 'gr-sec', h('span', 'gr-kicker', 'Worth knowing')), notes]),
    ]);
    body.tabIndex = 0;
    body.classList.add('gr-nav');
    const panel = h('div', 'gr-sheet gr-panel gr-rise is-wide', [head.el, body]);
    handle = openScreen(ctx, { name: 'help', panel, parent, label: 'How to play', focus: () => head.x });
    return handle;
  }

  function openChapters(parent, onPick) {
    let handle = null;
    const head = sheetHead('Chapters', 'Begin again from', () => handle && handle.close(null));
    const body = h('div', 'gr-sheet-body');
    if (!chapters.length) body.appendChild(h('div', 'gr-empty', 'No chapters yet.'));
    chapters.forEach((c, i) => {
      const b = btn('gr-chap gr-nav', [
        h('span', 'gr-chap-n', ROMAN[i] || String(i + 1)),
        h('span', 'gr-chap-b', [h('span', 'gr-chap-t', c.title || String(c.id)), c.sub ? h('span', 'gr-chap-s', c.sub) : null]),
        iconEl('chevRight', 'gr-chap-go'),
      ]);
      if (c.locked) { b.disabled = true; b.classList.add('is-off'); }
      b.addEventListener('mouseenter', () => focusEl(b));
      b.addEventListener('click', () => { ctx.sfx('click'); handle.close(null); onPick(c); });
      body.appendChild(b);
    });
    const panel = h('div', 'gr-sheet gr-panel gr-rise', [head.el, body]);
    handle = openScreen(ctx, {
      name: 'chapters', panel, parent, label: 'Chapters',
      focus: () => body.querySelector('.gr-chap:not([disabled])') || head.x,
      key: (e) => {
        if (rowNav(e, body)) return true;
        if (isKey(e, 'e', ' ', 'Enter') && document.activeElement && document.activeElement.classList.contains('gr-chap')) { e.preventDefault(); if (!e.repeat) document.activeElement.click(); return true; }
        return false;
      },
    });
    return handle;
  }

  // ---------- title ----------
  function titleScreen(spec) {
    const o = spec || {};
    if (titleH) titleH.close(null);
    if (Array.isArray(o.chapters)) chapters = o.chapters.filter(Boolean);
    const items = [{ id: 'new', label: 'Begin' }];
    if (o.canContinue) items.push({ id: 'continue', label: 'Continue', sub: o.continueSub || '' });
    if (chapters.length) items.push({ id: 'chapters', label: 'Chapters' });
    items.push({ id: 'settings', label: 'Settings' });
    items.push({ id: 'credits', label: 'Credits' });
    let handle = null;
    const list = listMenu(ctx, items, (it) => {
      if (it.id === 'new') handle.close({ action: 'new' });
      else if (it.id === 'continue') handle.close({ action: 'continue' });
      else if (it.id === 'chapters') openChapters(handle, (c) => handle.close({ action: 'chapter', chapter: c.id }));
      else if (it.id === 'settings') openSettings(ctx, handle);
      else if (it.id === 'credits') credits(o.credits || DEFAULT_CREDITS, handle);
    });
    const panel = h('div', 'gr-ts', [
      h('div', 'gr-ts-in', [
        h('div', 'gr-ts-k', o.kicker || 'An open drum on Herb Row'),
        h('h1', 'gr-ts-t', o.title || 'Guest-Right'),
        h('div', 'gr-ts-s', o.sub || 'Three nights in Chervil'),
        h('div', 'gr-ts-rule'),
        list.el,
      ]),
      h('div', 'gr-ts-foot', [iconEl('headphones'),h('span', '', o.footer || 'Best with headphones')]),
    ]);
    handle = openScreen(ctx, {
      name: 'title', panel, scrim: false, cls: 'is-title', escape: false, label: 'Guest-Right',
      focus: () => list.focused() || list.rows[o.canContinue ? 1 : 0],
      key: (e) => list.key(e),
      onClose: () => { if (titleH === handle) titleH = null; },
    });
    titleH = handle;
    list.set(o.canContinue ? 1 : 0, false);
    return handle.promise.then((v) => v || { action: 'none' });
  }

  // ---------- pause ----------
  function openPause(spec) {
    const o = spec || {};
    if (pauseH) return pauseD.promise;
    if (Array.isArray(o.chapters)) chapters = o.chapters.filter(Boolean);
    const d = deferred();
    pauseD = d;
    const items = [{ id: 'resume', label: 'Resume' }, { id: 'settings', label: 'Settings' }, { id: 'help', label: 'How to play' }];
    if (chapters.length) items.push({ id: 'chapters', label: 'Chapters' });
    items.push({ id: 'leave', label: 'Leave to title' });
    let handle = null;
    let result = { action: 'resume' };
    const list = listMenu(ctx, items, (it) => {
      if (it.id === 'resume') handle.close();
      else if (it.id === 'settings') openSettings(ctx, handle);
      else if (it.id === 'help') openHelp(handle);
      else if (it.id === 'chapters') openChapters(handle, (c) => { result = { action: 'chapter', chapter: c.id }; G.emit('ui:chapter', c.id); handle.close(); });
      else if (it.id === 'leave') confirmLeave(handle, () => { result = { action: 'leave' }; G.emit('ui:leave', true); handle.close(); });
    });
    const clock = G.clock();
    const kwh = G.kwh();
    const threads = G.journal('threads').filter((t) => t && !t.done);
    const side = threads.length ? h('div', 'gr-pause-side', [
      h('div', 'gr-kicker', 'Your thread'),
      h('div', 'gr-pause-st', threads[0].title || ''),
      threads[0].text ? h('div', 'gr-pause-sx', threads[0].text) : null,
    ]) : null;
    const panel = h('div', 'gr-pz', [
      h('div', 'gr-ts-in is-pause', [
        h('div', 'gr-ts-k', clock ? 'Paused · ' + clock : 'Paused'),
        h('div', 'gr-ts-t is-small', 'Guest-Right'),
        h('div', 'gr-ts-rule'),
        list.el,
        kwh != null ? h('div', 'gr-pause-w', [h('span', 'gr-kicker', 'Wallet'), h('span', 'gr-wallet', [h('span', 'gr-wallet-n', fmt2(kwh)), h('span', 'gr-wallet-u', 'kWh')])]) : null,
      ]),
      side,
    ]);
    handle = openScreen(ctx, {
      name: 'pause', panel, cls: 'is-pause', label: 'Paused',
      focus: () => list.focused() || list.rows[0],
      key: (e) => list.key(e),
      onClose: () => {
        pauseH = null;
        pauseD = null;
        G.emit('ui:pause', false);
        d.resolve(result);
      },
    });
    pauseH = handle;
    G.emit('ui:pause', true);
    list.set(0, false);
    return d.promise;
  }

  function confirmLeave(parent, onLeave) {
    let handle = null;
    const stay = btn('gr-btn is-primary', 'Stay');
    const go = btn('gr-btn', 'Leave');
    stay.classList.add('gr-nav');
    go.classList.add('gr-nav');
    stay.addEventListener('click', () => handle.close(null));
    go.addEventListener('click', () => { handle.close(null); onLeave(); });
    const panel = h('div', 'gr-confirm gr-panel gr-rise', [
      h('div', 'gr-kicker', 'Leave to title'),
      h('div', 'gr-menu-title', 'Leave the drum for now'),
      h('div', 'gr-menu-note', 'Chervil will keep turning without you.'),
      h('div', 'gr-hour-acts', [go, stay]),
    ]);
    handle = openScreen(ctx, {
      name: 'confirm', panel, parent, label: 'Leave to title', focus: () => stay,
      key: (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); focusEl(document.activeElement === stay ? go : stay); return true; }
        if (isKey(e, 'e', ' ', 'Enter')) { e.preventDefault(); if (!e.repeat && document.activeElement && document.activeElement.click) document.activeElement.click(); return true; }
        return false;
      },
    });
  }

  function closePause() {
    if (pauseH) pauseH.close();
  }

  // ---------- credits ----------
  function credits(lines, parent) {
    const list = Array.isArray(lines) && lines.length ? lines : DEFAULT_CREDITS;
    const roll = h('div', 'gr-roll');
    for (const ln of list) {
      if (ln == null || ln === '') { roll.appendChild(h('div', 'gr-roll-gap')); continue; }
      if (typeof ln === 'string') {
        if (ln.indexOf('## ') === 0) roll.appendChild(h('div', 'gr-roll-title', ln.slice(3)));
        else if (ln.indexOf('# ') === 0) roll.appendChild(h('div', 'gr-roll-h', ln.slice(2)));
        else roll.appendChild(h('div', 'gr-roll-l', ln));
        continue;
      }
      if (ln.title) roll.appendChild(h('div', 'gr-roll-title', ln.title));
      else if (ln.h) roll.appendChild(h('div', 'gr-roll-h', ln.h));
      else if (ln.role || ln.name) roll.appendChild(h('div', 'gr-roll-pair', [h('span', 'gr-roll-r', ln.role || ''), h('span', 'gr-roll-nm', ln.name || '')]));
    }
    roll.appendChild(h('div', 'gr-roll-end', h('div', 'gr-orn', h('i'))));
    const skip = h('div', 'gr-roll-skip', [h('span', 'gr-key is-small', 'Esc'), h('span', '', 'Close')]);
    const panel = h('div', 'gr-credits', [h('div', 'gr-roll-win', roll), skip]);
    let y = 0;
    let started = false;
    const handle = openScreen(ctx, {
      name: 'credits', panel, parent, scrim: false, cls: 'is-credits', label: 'Credits',
      key: (e) => {
        if (isKey(e, 'Enter', ' ', 'e')) { e.preventDefault(); handle.close(null); return true; }
        return false;
      },
    });
    panel.addEventListener('click', () => handle.close(null));
    ctx.tick((dt) => {
      if (handle.closed) return false;
      const win = roll.parentNode;
      if (!started) { y = win.clientHeight * 0.92; started = true; }
      y -= dt * 34;
      roll.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
      if (y < -roll.offsetHeight + win.clientHeight * 0.42) {
        handle.close(null);
        return false;
      }
      return true;
    });
    return handle.promise;
  }

  // ---------- loading ----------
  const loadTitle = h('div', 'gr-load-t', 'Guest-Right');
  const loadFill = h('div', 'gr-load-fill');
  const loadLabel = h('div', 'gr-load-l', '');
  const loadTip = h('div', 'gr-load-tip', '');
  const loadEl = h('div', 'gr-load', [
    h('div', 'gr-load-c', [loadTitle, h('div', 'gr-load-bar', loadFill), loadLabel]),
    loadTip,
  ]);
  ctx.layers.load.appendChild(loadEl);
  let tipTimer = 0;
  const loading = {
    show() { loadEl.classList.add('is-on'); loadEl.style.pointerEvents = 'auto'; },
    set(p, label) {
      const v = Math.max(0, Math.min(1, Number(p) || 0));
      loadFill.style.transform = 'scaleX(' + v.toFixed(4) + ')';
      if (label != null) loadLabel.textContent = label;
    },
    tip(text) {
      clearTimeout(tipTimer);
      loadTip.classList.remove('is-on');
      tipTimer = setTimeout(() => { loadTip.textContent = text || ''; if (text) loadTip.classList.add('is-on'); }, loadTip.textContent ? 380 : 0);
    },
    hide() { loadEl.classList.remove('is-on'); loadEl.style.pointerEvents = 'none'; },
    visible: () => loadEl.classList.contains('is-on'),
  };

  return {
    titleScreen,
    pause: {
      open: openPause,
      close: closePause,
      get isOpen() { return !!pauseH; },
    },
    credits: (lines) => credits(lines, null),
    loading,
    setChapters: (c) => { if (Array.isArray(c)) chapters = c.filter(Boolean); },
    setKeys: (k) => { if (Array.isArray(k) && k.length) keys = k; },
    openHelp: () => openHelp(null),
  };
}
