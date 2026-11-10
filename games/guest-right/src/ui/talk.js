// Dialogue: the lower-third panel. say() types lines out; choose() offers a numbered list.
// Both are promises that always resolve, also when a newer call replaces them.

import { h, clear, deferred, speakerOf, fmt2, isKey } from './dom.js';
import { icon } from './icons.js';

const CPS = 45;

function pauseAfter(ch, next) {
  const end = next === undefined || next === ' ' || next === '\n' || next === '"' || next === '”' || next === '’';
  if (ch === ',') return 0.11;
  if ((ch === '.' || ch === '?' || ch === ';' || ch === ':' || ch === '…') && end) return 0.26;
  return 0;
}

function normLines(lines, base, lookup) {
  const arr = Array.isArray(lines) ? lines : [lines];
  const out = [];
  for (const ln of arr) {
    if (ln == null) continue;
    if (typeof ln === 'string') { out.push({ sp: base, t: ln }); continue; }
    if (typeof ln === 'object') {
      let sp = base;
      if (ln.s != null) sp = speakerOf(lookup && typeof ln.s === 'string' && lookup[ln.s] ? lookup[ln.s] : ln.s, base);
      out.push({ sp, t: String(ln.t != null ? ln.t : ln.text != null ? ln.text : '') });
    }
  }
  return out;
}

export function createTalk(ctx) {
  const { layers, stack } = ctx;

  const swatch = h('span', 'gr-swatch');
  const nameT = h('span', 'gr-talk-n');
  const nameRow = h('div', 'gr-talk-name', [swatch, nameT]);
  const shown = h('span', '');
  const hid = h('span', 'gr-hid');
  const textEl = h('div', 'gr-talk-text', [shown, hid]);
  textEl.setAttribute('aria-live', 'polite');
  const adv = h('div', 'gr-adv');
  adv.innerHTML = icon('chevDown');
  const main = h('div', 'gr-talk-main', [nameRow, textEl, adv]);
  const choicesEl = h('div', 'gr-choices');
  choicesEl.setAttribute('role', 'listbox');
  const panel = h('div', 'gr-talk gr-panel', [main, choicesEl]);
  layers.talk.appendChild(panel);

  let session = null;
  let hideTimer = 0;

  function setSpeaker(sp) {
    const name = sp && sp.name;
    nameRow.classList.toggle('gr-gone', !name);
    nameT.textContent = name || '';
    swatch.style.background = (sp && sp.colour) || '';
    main.classList.toggle('is-narr', !name);
  }

  function render(text, i) {
    shown.textContent = text.slice(0, i);
    hid.textContent = text.slice(i);
  }

  function begin(cursor) {
    if (session) session.end(null);
    clearTimeout(hideTimer);
    const d = deferred();
    const s = { d, ended: false, tw: null, key: null, click: null, timers: [] };
    s.end = (v) => {
      if (s.ended) return;
      s.ended = true;
      if (s.tw) s.tw.dead = true;
      for (const t of s.timers) clearTimeout(t);
      stack.remove(s.layer);
      if (session === s) {
        session = null;
        hideTimer = setTimeout(() => {
          panel.classList.remove('is-on', 'has-choices');
          ctx.setTalking(false);
        }, 110);
      }
      d.resolve(v);
    };
    s.layer = {
      name: 'talk', el: panel, screen: false, cursor: !!cursor,
      key: (e) => { if (s.key) s.key(e); },
      refocus: () => {},
    };
    session = s;
    stack.push(s.layer);
    panel.classList.add('is-on');
    ctx.setTalking(true);
    return s;
  }

  function type(s, text, onChar, sp, onDone) {
    const tw = { done: false, dead: false, i: 0, t: 0.05 };
    render(text, 0);
    adv.classList.remove('is-on');
    const finish = () => {
      if (tw.done) return;
      tw.done = true;
      tw.i = text.length;
      render(text, text.length);
      onDone();
    };
    tw.finish = finish;
    ctx.tick((dt) => {
      if (tw.dead || tw.done) return false;
      tw.t -= dt;
      let guard = 0;
      while (tw.t <= 0 && tw.i < text.length && guard++ < 12) {
        const ch = text[tw.i++];
        if (onChar) { try { onChar(ch, sp && sp.raw != null ? sp.raw : sp); } catch (err) { /* the caller's problem */ } }
        tw.t += 1 / CPS + pauseAfter(ch, text[tw.i]);
      }
      render(text, tw.i);
      if (tw.i >= text.length) { finish(); return false; }
      return true;
    });
    s.tw = tw;
    return tw;
  }

  // ---------- say ----------
  function say(speaker, lines, opts) {
    const o = opts || {};
    const s = begin(false);
    const base = speakerOf(speaker);
    const list = normLines(lines, base, o.speakers);
    panel.classList.remove('has-choices');
    clear(choicesEl);
    let idx = 0;
    const next = () => {
      if (s.ended) return;
      if (idx >= list.length) { s.end(undefined); return; }
      const ln = list[idx++];
      setSpeaker(ln.sp);
      type(s, ln.t, o.onChar, ln.sp, () => {
        adv.classList.add('is-on');
        if (o.auto) s.timers.push(setTimeout(() => { if (!s.ended && s.tw && s.tw.done) next(); }, o.auto * 1000));
      });
    };
    const advance = () => {
      if (s.ended) return;
      if (s.tw && !s.tw.done) { s.tw.finish(); return; }
      next();
    };
    s.key = (e) => {
      if (isKey(e, 'e', ' ', 'Enter')) {
        e.preventDefault();
        if (!e.repeat) advance();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (ctx.openPause) ctx.openPause();
      }
    };
    s.click = advance;
    if (!list.length) { s.end(undefined); return s.d.promise; }
    next();
    return s.d.promise;
  }

  // ---------- choose ----------
  function choose(speaker, promptText, options) {
    const opts = (Array.isArray(options) ? options : []).filter(Boolean);
    const s = begin(true);
    if (speaker != null) setSpeaker(speakerOf(speaker));
    clear(choicesEl);
    if (!opts.length) { s.end(null); return s.d.promise; }
    panel.classList.add('has-choices');
    choicesEl.classList.add('is-wait');
    let focus = -1;
    const rows = opts.map((op, i) => {
      const off = !!op.disabled;
      const row = h('button', 'gr-choice' + (off ? ' is-off' : ''), [
        h('span', 'gr-choice-n', String(i + 1)),
        h('span', 'gr-choice-l', String(op.label != null ? op.label : '')),
        op.cost != null && Number(op.cost) > 0 ? h('span', 'gr-choice-c', [fmt2(op.cost), h('small', '', 'kWh')]) : h('span', ''),
        op.sub || typeof op.disabled === 'string' ? h('span', 'gr-choice-s', String(typeof op.disabled === 'string' ? op.disabled : op.sub)) : null,
      ]);
      row.type = 'button';
      row.setAttribute('role', 'option');
      row.tabIndex = -1;
      row.style.transitionDelay = (0.04 * i) + 's';
      row.addEventListener('mouseenter', () => setFocus(i, true));
      row.addEventListener('click', (e) => { e.stopPropagation(); pick(i); });
      choicesEl.appendChild(row);
      return row;
    });
    const firstOn = () => { for (let i = 0; i < opts.length; i++) if (!opts[i].disabled) return i; return 0; };
    function setFocus(i, sound) {
      if (i === focus) return;
      focus = i;
      rows.forEach((r, j) => r.classList.toggle('is-focus', j === i));
      if (rows[i]) { try { rows[i].focus({ preventScroll: true }); } catch (err) { /* ignore */ } }
      if (sound) ctx.sfx('hover');
    }
    function move(dir) {
      const n = rows.length;
      let i = focus < 0 ? firstOn() : focus;
      for (let k = 0; k < n; k++) { i = (i + dir + n) % n; if (!opts[i].disabled) break; }
      setFocus(i, true);
    }
    let ready = false;
    function reveal() {
      if (ready || s.ended) return;
      ready = true;
      choicesEl.classList.remove('is-wait');
      adv.classList.remove('is-on');
      setFocus(firstOn(), false);
    }
    function pick(i) {
      if (s.ended) return;
      if (!ready) { if (s.tw) s.tw.finish(); reveal(); }
      const op = opts[i];
      if (!op) return;
      if (op.disabled) {
        ctx.sfx('deny');
        const r = rows[i];
        r.classList.remove('is-deny');
        void r.offsetWidth;
        r.classList.add('is-deny');
        return;
      }
      ctx.sfx('click');
      s.end(op.value !== undefined ? op.value : i);
    }
    s.key = (e) => {
      const k = e.key;
      if (/^[1-9]$/.test(k)) { e.preventDefault(); const i = Number(k) - 1; if (i < rows.length) pick(i); return; }
      if (k === 'Escape') { e.preventDefault(); ctx.sfx('close'); s.end(null); return; }
      if (!ready) {
        if (isKey(e, 'e', ' ', 'Enter') || k.indexOf('Arrow') === 0) { e.preventDefault(); if (s.tw) s.tw.finish(); reveal(); }
        return;
      }
      if (k === 'ArrowDown' || isKey(e, 's')) { e.preventDefault(); move(1); }
      else if (k === 'ArrowUp' || isKey(e, 'w')) { e.preventDefault(); move(-1); }
      else if (isKey(e, 'e', ' ', 'Enter')) { e.preventDefault(); if (!e.repeat) pick(focus < 0 ? firstOn() : focus); }
    };
    s.click = () => { if (!ready) { if (s.tw) s.tw.finish(); reveal(); } };
    s.layer.refocus = () => { if (rows[focus]) { try { rows[focus].focus({ preventScroll: true }); } catch (err) { /* ignore */ } } };
    const text = promptText != null && promptText !== '' ? String(promptText) : null;
    if (text) type(s, text, null, null, reveal);
    else {
      adv.classList.remove('is-on');
      if (!shown.textContent && !hid.textContent) textEl.classList.add('gr-gone');
      reveal();
    }
    return s.d.promise.then((v) => { textEl.classList.remove('gr-gone'); return v; });
  }

  // A click anywhere advances a line, also while the pointer is locked to the canvas.
  const onDown = (e) => {
    if (!session || !session.click || stack.top() !== session.layer) return;
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest('.gr-choices, .gr-touch-btn')) return;
    session.click();
  };
  window.addEventListener('pointerdown', onDown, true);
  ctx.cleanup.push(() => {
    window.removeEventListener('pointerdown', onDown, true);
    if (session) session.end(null);
  });

  return {
    say, choose,
    active: () => !!session,
  };
}
