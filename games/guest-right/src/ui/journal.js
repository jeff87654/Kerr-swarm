// The journal: a two-page book with five tabs. Data comes from game.journal on every open.

import { h, btn, clear, isKey, focusEl, hourLabel } from './dom.js';
import { icon, iconEl } from './icons.js';
import { openScreen } from './stack.js';

const TABS = [
  { id: 'threads', label: 'Threads' },
  { id: 'found', label: 'Found' },
  { id: 'people', label: 'People' },
  { id: 'customs', label: 'Customs' },
  { id: 'cards', label: 'Cards' },
];

function cardCaption(c) {
  const bits = [c.place, c.day, c.hour != null && c.hour !== '' ? (typeof c.hour === 'number' ? hourLabel(c.hour) : c.hour) : null].filter(Boolean);
  return bits.join(', ');
}

export function createJournal(ctx) {
  const { G } = ctx;
  let handle = null;
  let tab = 'threads';
  let data = null;
  const sel = { threads: 0, found: 0, people: 0, customs: 0, cards: -1 };
  let els = null;

  function load() {
    data = {
      threads: G.journal('threads').slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0)),
      found: G.journal('found'),
      people: G.journal('people').slice().sort((a, b) => (a.met ? 0 : 1) - (b.met ? 0 : 1)),
      customs: G.journal('customs').slice().sort((a, b) => (a.seen ? 0 : 1) - (b.seen ? 0 : 1)),
      cards: G.journal('cards'),
    };
  }

  function count(id) {
    const d = data[id] || [];
    if (id === 'found') return d.filter((x) => x.found).length + ' / ' + d.length;
    if (id === 'threads') return String(d.filter((x) => !x.done).length);
    if (id === 'people') return String(d.filter((x) => x.met).length);
    if (id === 'customs') return String(d.filter((x) => x.seen).length);
    return String(d.length);
  }

  function build() {
    const tabs = h('div', 'gr-tabs');
    tabs.setAttribute('role', 'tablist');
    const tabBtns = TABS.map((t, i) => {
      const b = btn('gr-tab', [h('span', 'gr-tab-t', t.label), h('span', 'gr-tab-c', '')]);
      b.title = t.label + ' (' + (i + 1) + ')';
      b.setAttribute('role', 'tab');
      b.addEventListener('click', () => setTab(t.id, true));
      tabs.appendChild(b);
      return b;
    });
    const x = btn('gr-x', null, 'Close');
    x.innerHTML = icon('close');
    x.addEventListener('click', () => close());
    const head = h('div', 'gr-book-head', [
      h('div', 'gr-book-ht', [h('div', 'gr-kicker', 'Your journal'), h('div', 'gr-sheet-title', 'Three nights in Chervil')]),
      tabs,
      h('div', 'gr-sheet-hx', [h('span', 'gr-key is-small gr-esc', 'Esc'), x]),
    ]);
    const list = h('div', 'gr-jlist');
    const page = h('div', 'gr-jpage');
    const back = btn('gr-jback', [iconEl('chevLeft'), 'Back'], 'Back to the list');
    back.addEventListener('click', () => body.classList.remove('is-detail'));
    const pageWrap = h('div', 'gr-jpage-w', [back, page]);
    const grid = h('div', 'gr-jcards');
    const viewer = h('div', 'gr-jview gr-gone');
    viewer.addEventListener('click', () => viewer.classList.add('gr-gone'));
    const body = h('div', 'gr-book-body', [list, h('div', 'gr-gutter'), pageWrap, grid, viewer]);
    const panel = h('div', 'gr-book gr-panel gr-rise', [head, body]);
    return { panel, tabs, tabBtns, list, page, body, grid, viewer, x };
  }

  function rowsFor(id) {
    const d = data[id] || [];
    return d.map((it) => {
      if (id === 'threads') {
        const steps = Array.isArray(it.steps) ? it.steps : [];
        const done = steps.filter((s) => s.done).length;
        return { cls: it.done ? 'is-done' : '', ico: it.done ? 'check' : 'thread', t: it.title || '', s: steps.length ? done + ' of ' + steps.length : it.done ? 'Done' : '' };
      }
      if (id === 'found') return it.found ? { cls: 'is-found', ico: 'sprig', t: it.title || '', s: it.where || '' } : { cls: 'is-unfound', ico: 'ring', t: 'Not yet found', s: it.hint || '' };
      if (id === 'people') return { cls: it.met ? '' : 'is-unmet', sw: it.colour, t: it.name || '', s: it.met ? it.role || '' : 'Not yet met' };
      if (id === 'customs') return it.seen ? { cls: '', ico: 'quill', t: it.term || '', s: '' } : { cls: 'is-unfound', ico: 'ring', t: 'Not yet heard', s: '' };
      return null;
    });
  }

  function renderList() {
    const { list } = els;
    clear(list);
    const rows = rowsFor(tab);
    if (!rows.length) { list.appendChild(h('div', 'gr-empty', 'Nothing here yet.')); renderPage(); return; }
    rows.forEach((r, i) => {
      const lead = r.sw !== undefined
        ? h('span', 'gr-jsw', null)
        : iconEl(r.ico, 'gr-jrow-i');
      if (r.sw !== undefined) { lead.style.background = r.cls === 'is-unmet' ? 'transparent' : r.sw || 'var(--lamp)'; }
      const b = btn('gr-jrow gr-nav ' + r.cls, [lead, h('span', 'gr-jrow-b', [h('span', 'gr-jrow-t', r.t), r.s ? h('span', 'gr-jrow-s', r.s) : null])]);
      b.setAttribute('role', 'option');
      b.addEventListener('click', () => { select(i, true); els.body.classList.add('is-detail'); });
      b.addEventListener('focus', () => select(i, false));
      list.appendChild(b);
    });
    select(Math.min(sel[tab] || 0, rows.length - 1), false, true);
  }

  function select(i, sound, force) {
    const rows = els.list.querySelectorAll('.gr-jrow');
    if (!rows.length) return;
    if (i === sel[tab] && !force) return;
    sel[tab] = i;
    rows.forEach((r, j) => r.classList.toggle('is-sel', j === i));
    if (sound) ctx.sfx('page');
    renderPage();
  }

  function renderPage() {
    const { page } = els;
    clear(page);
    const d = data[tab] || [];
    const it = d[sel[tab]];
    if (!it) { page.appendChild(h('div', 'gr-empty is-page', tab === 'threads' ? 'No threads yet. Somebody will ask you to do something soon enough.' : 'Nothing here yet.')); return; }
    page.scrollTop = 0;
    if (tab === 'threads') {
      const steps = Array.isArray(it.steps) ? it.steps : [];
      page.appendChild(h('div', 'gr-kicker' + (it.done ? ' is-leaf' : ' is-lamp'), it.done ? 'Done' : 'A thread to follow'));
      page.appendChild(h('div', 'gr-jp-t', it.title || ''));
      if (it.text) page.appendChild(h('div', 'gr-jp-x', it.text));
      if (steps.length) {
        const ul = h('div', 'gr-steps');
        for (const s of steps) ul.appendChild(h('div', 'gr-step' + (s.done ? ' is-done' : ''), [iconEl(s.done ? 'check' : 'ring'), h('span', '', s.text || '')]));
        page.appendChild(ul);
      }
    } else if (tab === 'found') {
      if (it.found) {
        page.appendChild(h('div', 'gr-kicker is-leaf', 'Found'));
        page.appendChild(h('div', 'gr-jp-t', it.title || ''));
        if (it.where) page.appendChild(h('div', 'gr-jp-where', [iconEl('place'), h('span', '', it.where)]));
        page.appendChild(h('div', 'gr-jp-x is-drop', it.text || ''));
      } else {
        page.appendChild(h('div', 'gr-kicker', 'Not yet found'));
        page.appendChild(h('div', 'gr-jp-t is-dim', 'Somewhere in Chervil'));
        if (it.hint) page.appendChild(h('div', 'gr-jp-hint', it.hint));
      }
    } else if (tab === 'people') {
      const av = h('div', 'gr-jp-av', (it.name || '·').trim().charAt(0));
      if (it.met && it.colour) av.style.setProperty('--c', it.colour);
      if (!it.met) av.classList.add('is-unmet');
      page.appendChild(h('div', 'gr-jp-person', [av, h('div', '', [h('div', 'gr-jp-t', it.name || ''), h('div', 'gr-kicker', it.met ? it.role || '' : 'Not yet met')])]));
      if (it.met && it.line) page.appendChild(h('div', 'gr-jp-x', it.line));
      else if (!it.met) page.appendChild(h('div', 'gr-jp-hint', 'You will know them when you meet them.'));
    } else if (tab === 'customs') {
      if (it.seen) {
        page.appendChild(h('div', 'gr-kicker is-lamp', 'A custom of Chervil'));
        page.appendChild(h('div', 'gr-jp-t', it.term || ''));
        page.appendChild(h('div', 'gr-jp-x is-drop', it.text || ''));
      } else {
        page.appendChild(h('div', 'gr-kicker', 'Not yet heard'));
        page.appendChild(h('div', 'gr-jp-hint', 'Listen in the halls.'));
      }
    }
  }

  function renderCards() {
    const { grid, viewer } = els;
    clear(grid);
    const cards = data.cards || [];
    if (!cards.length) { grid.appendChild(h('div', 'gr-empty is-page', 'No photos yet. Press P for photo mode, and keep the ones you like for the card home.')); return; }
    cards.forEach((c, i) => {
      const img = h('img', '');
      img.alt = cardCaption(c) || 'A photo';
      img.src = c.src || '';
      const fig = btn('gr-pcard gr-nav', [h('span', 'gr-pcard-img', img), h('span', 'gr-pcard-c', cardCaption(c))]);
      fig.style.setProperty('--r', ((i % 3) - 1) * 1.2 + 'deg');
      fig.addEventListener('click', () => {
        clear(viewer);
        const big = h('img', '');
        big.src = c.src || '';
        big.alt = img.alt;
        viewer.appendChild(h('div', 'gr-jview-c', [h('div', 'gr-pcard-img', big), h('div', 'gr-pcard-c', cardCaption(c))]));
        viewer.classList.remove('gr-gone');
        ctx.sfx('page');
      });
      grid.appendChild(fig);
    });
  }

  function setTab(id, sound) {
    if (!TABS.some((t) => t.id === id)) id = 'threads';
    tab = id;
    if (!els) return;
    els.tabBtns.forEach((b, i) => {
      const on = TABS[i].id === id;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.lastChild.textContent = count(TABS[i].id);
      if (on) requestAnimationFrame(() => { try { b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (err) { /* ignore */ } });
    });
    els.body.classList.toggle('is-cards', id === 'cards');
    els.body.classList.remove('is-detail');
    els.viewer.classList.add('gr-gone');
    if (id === 'cards') renderCards();
    else renderList();
    if (sound) ctx.sfx('page');
  }

  function open(t) {
    load();
    if (handle) { setTab(t || tab, true); return; }
    els = build();
    handle = openScreen(ctx, {
      name: 'journal', panel: els.panel, label: 'Journal',
      focus: () => els.body.querySelector('.gr-jrow.is-sel, .gr-pcard') || els.x,
      key: (e) => {
        const k = e.key;
        if (k === 'Escape' && !els.viewer.classList.contains('gr-gone')) { e.preventDefault(); els.viewer.classList.add('gr-gone'); return true; }
        if (k === 'Escape' && els.body.classList.contains('is-detail') && window.innerWidth <= 720) { e.preventDefault(); els.body.classList.remove('is-detail'); return true; }
        if (isKey(e, 'j')) { e.preventDefault(); close(); return true; }
        if (/^[1-5]$/.test(k)) { e.preventDefault(); setTab(TABS[Number(k) - 1].id, true); focusList(); return true; }
        if (k === 'ArrowRight' || k === 'ArrowLeft') {
          e.preventDefault();
          const onCard = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('gr-pcard');
          if (tab === 'cards' && onCard && !e.shiftKey && moveCard(k === 'ArrowRight' ? 1 : -1)) return true;
          const i = TABS.findIndex((x) => x.id === tab);
          const n = (i + (k === 'ArrowLeft' ? -1 : 1) + TABS.length) % TABS.length;
          setTab(TABS[n].id, true);
          focusList();
          return true;
        }
        if (k === 'ArrowDown' || k === 'ArrowUp' || isKey(e, 'w', 's')) {
          e.preventDefault();
          if (tab === 'cards') { moveCard(k === 'ArrowDown' || isKey(e, 's') ? 3 : -3); return true; }
          const rows = els.list.querySelectorAll('.gr-jrow');
          if (!rows.length) return true;
          const d = k === 'ArrowDown' || isKey(e, 's') ? 1 : -1;
          const n = Math.max(0, Math.min(rows.length - 1, (sel[tab] || 0) + d));
          focusEl(rows[n]);
          rows[n].scrollIntoView({ block: 'nearest' });
          select(n, true);
          return true;
        }
        if (isKey(e, 'Enter', ' ', 'e')) {
          const a = document.activeElement;
          if (a && a.classList && (a.classList.contains('gr-pcard') || a.classList.contains('gr-jrow'))) { e.preventDefault(); if (!e.repeat) a.click(); return true; }
        }
        return false;
      },
      onClose: () => { handle = null; els = null; },
    });
    setTab(t || tab, false);
  }

  function moveCard(d) {
    const cards = els.grid.querySelectorAll('.gr-pcard');
    if (!cards.length) return false;
    const i = Array.prototype.indexOf.call(cards, document.activeElement);
    const n = Math.max(0, Math.min(cards.length - 1, (i < 0 ? 0 : i + d)));
    if (n === i) return false;
    focusEl(cards[n]);
    cards[n].scrollIntoView({ block: 'nearest' });
    ctx.sfx('hover');
    return true;
  }

  function focusList() {
    requestAnimationFrame(() => {
      if (!els) return;
      const f = els.body.querySelector('.gr-jrow.is-sel, .gr-pcard');
      if (f) focusEl(f);
    });
  }

  function close() {
    if (handle) handle.close(null);
  }

  return { open, close, get isOpen() { return !!handle; } };
}
