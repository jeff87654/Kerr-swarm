// A venue's menu (a small printed card of what it sells) and the "sit a while" hour picker.

import { h, btn, fmt2, clamp, hourLabel, isKey } from './dom.js';
import { openScreen } from './stack.js';

const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

function spanWords(hours) {
  const total = Math.round(hours * 60);
  if (total <= 0) return '';
  const H = Math.floor(total / 60);
  const M = total % 60;
  const hw = H ? (H <= 12 ? NUM[H] : String(H)) + (H === 1 ? ' hour' : ' hours') : '';
  const mw = M ? M + (M === 1 ? ' minute' : ' minutes') : '';
  const s = [hw, mw].filter(Boolean).join(' and ');
  return s.charAt(0).toUpperCase() + s.slice(1) + ' from now';
}

export function createVenue(ctx) {
  const { G } = ctx;
  let menuH = null;
  let hourH = null;

  function menu(spec) {
    const o = spec || {};
    if (menuH) menuH.close(null);
    const items = (Array.isArray(o.items) ? o.items : []).filter(Boolean);
    const wallet = typeof o.wallet === 'number' ? o.wallet : G.kwh();
    const head = h('div', 'gr-menu-head', [
      o.kicker ? h('div', 'gr-kicker', o.kicker) : null,
      h('div', 'gr-menu-title', o.title || 'Menu'),
      h('div', 'gr-orn', h('i')),
      o.note ? h('div', 'gr-menu-note', o.note) : null,
    ]);
    const list = h('div', 'gr-menu-items');
    list.setAttribute('role', 'listbox');
    const rows = [];
    const state = [];
    items.forEach((it, i) => {
      const price = Number(it.price);
      const free = !(price > 0);
      const poor = !free && wallet != null && price > wallet + 1e-9;
      const reason = typeof it.disabled === 'string' ? it.disabled : poor ? 'Not enough in the wallet' : '';
      const off = !!it.disabled || poor;
      const pr = free
        ? h('div', 'gr-item-p is-free', 'on the table')
        : h('div', 'gr-item-p', [fmt2(price), h('small', '', 'kWh')]);
      const row = btn('gr-item' + (off ? ' is-off' : ''), [
        h('div', 'gr-item-n', [String(it.name || ''), it.tag ? h('span', 'gr-tag', it.tag) : null]),
        pr,
        it.desc ? h('div', 'gr-item-d', it.desc) : null,
        reason ? h('div', 'gr-item-why', reason) : null,
      ]);
      row.setAttribute('role', 'option');
      row.tabIndex = -1;
      row.addEventListener('mouseenter', () => setFocus(i, true));
      row.addEventListener('focus', () => setFocus(i, false));
      row.addEventListener('click', () => pick(i));
      list.appendChild(row);
      rows.push(row);
      state.push({ off, it });
    });
    if (!items.length) list.appendChild(h('div', 'gr-menu-note', 'Nothing today.'));
    const leave = btn('gr-btn is-quiet', ['Leave', h('span', 'gr-key is-small', 'Esc')]);
    leave.addEventListener('click', () => handle.close(null));
    const foot = h('div', 'gr-menu-foot', [
      wallet != null ? h('div', 'gr-menu-wallet', [h('span', 'gr-kicker', 'Wallet'), h('span', 'gr-wallet', [h('span', 'gr-wallet-n', fmt2(wallet)), h('span', 'gr-wallet-u', 'kWh')])]) : null,
      o.footer ? h('div', 'gr-menu-foot-t', o.footer) : null,
      leave,
    ]);
    const panel = h('div', 'gr-menu gr-panel gr-rise', [head, list, foot]);
    let focus = -1;
    function setFocus(i, sound) {
      if (i === focus || !rows[i]) return;
      focus = i;
      rows.forEach((r, j) => r.classList.toggle('is-focus', j === i));
      try { rows[i].focus({ preventScroll: true }); } catch (err) { /* ignore */ }
      rows[i].scrollIntoView({ block: 'nearest' });
      if (sound) ctx.sfx('hover');
    }
    function first() { for (let i = 0; i < state.length; i++) if (!state[i].off) return i; return 0; }
    function move(d) {
      const n = rows.length;
      if (!n) return;
      let i = focus < 0 ? first() - d : focus;
      i = (i + d + n) % n;
      setFocus(i, true);
    }
    function pick(i) {
      const st = state[i];
      if (!st) return;
      if (st.off) {
        ctx.sfx('deny');
        rows[i].classList.remove('is-deny');
        void rows[i].offsetWidth;
        rows[i].classList.add('is-deny');
        return;
      }
      ctx.sfx(Number(st.it.price) > 0 ? 'coin' : 'click');
      handle.close(st.it.id !== undefined ? st.it.id : i);
    }
    const handle = openScreen(ctx, {
      name: 'menu', panel, label: o.title || 'Menu', screen: false,
      focus: () => rows[focus < 0 ? first() : focus] || leave,
      key: (e) => {
        const k = e.key;
        if (/^[1-9]$/.test(k)) { e.preventDefault(); pick(Number(k) - 1); return true; }
        if (k === 'ArrowDown' || isKey(e, 's')) { e.preventDefault(); move(1); return true; }
        if (k === 'ArrowUp' || isKey(e, 'w')) { e.preventDefault(); move(-1); return true; }
        if (isKey(e, 'e', ' ', 'Enter')) {
          if (document.activeElement === leave) return false;
          e.preventDefault();
          if (!e.repeat) pick(focus < 0 ? first() : focus);
          return true;
        }
        return false;
      },
      onClose: () => { if (menuH === handle) menuH = null; },
    });
    menuH = handle;
    setFocus(first(), false);
    return handle.promise;
  }

  function pickHour(spec) {
    const o = spec || {};
    if (hourH) hourH.close(null);
    const now = o.now != null ? Number(o.now) : null;
    let from = Number(o.from);
    let to = Number(o.to);
    if (!isFinite(from)) from = now != null ? now : 0;
    if (!isFinite(to)) to = from + 6;
    if (to < from) to += 24;
    const opts = [];
    for (let x = Math.ceil(from + 0.001); x <= Math.floor(to + 0.001); x++) opts.push(x);
    if (!opts.length) opts.push(to);
    let sel = 0;
    const big = h('div', 'gr-hour-big', hourLabel(opts[0]));
    const sub = h('div', 'gr-hour-sub');
    const fill = h('div', 'gr-hour-fill');
    const knob = h('div', 'gr-hour-knob');
    const dial = h('div', 'gr-hour-dial', [h('div', 'gr-hour-track'), fill]);
    dial.tabIndex = 0;
    dial.setAttribute('role', 'slider');
    dial.setAttribute('aria-label', 'Hour');
    const n = opts.length;
    const pos = (i) => (n === 1 ? 100 : (i / (n - 1)) * 100);
    const every = n <= 9 ? 1 : n <= 16 ? 2 : 3;
    opts.forEach((x, i) => {
      const t = h('div', 'gr-hour-tk');
      t.style.left = pos(i) + '%';
      dial.appendChild(t);
      if ((i % every === 0 && (n - 1 - i >= every || every === 1)) || i === n - 1) {
        const l = h('div', 'gr-hour-tl', String(((x % 24) + 24) % 24).padStart(2, '0'));
        l.style.left = pos(i) + '%';
        dial.appendChild(l);
      }
    });
    dial.appendChild(knob);
    const go = btn('gr-btn is-primary', ['Sit until ' + hourLabel(opts[0])]);
    const stay = btn('gr-btn is-quiet', ['Get up', h('span', 'gr-key is-small', 'Esc')]);
    function setSel(i, sound) {
      i = clamp(i, 0, n - 1);
      if (i !== sel && sound) ctx.sfx('hover');
      sel = i;
      big.textContent = hourLabel(opts[i]);
      sub.textContent = now != null ? spanWords(opts[i] - now) : '';
      knob.style.left = pos(i) + '%';
      fill.style.width = pos(i) + '%';
      go.textContent = 'Sit until ' + hourLabel(opts[i]);
      dial.setAttribute('aria-valuetext', hourLabel(opts[i]));
    }
    const fromX = (cx) => {
      const r = dial.getBoundingClientRect();
      return Math.round(clamp((cx - r.left) / Math.max(1, r.width), 0, 1) * (n - 1));
    };
    dial.addEventListener('pointerdown', (e) => {
      try { dial.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      setSel(fromX(e.clientX), true);
      const mv = (ev) => setSel(fromX(ev.clientX), true);
      const up = () => { dial.removeEventListener('pointermove', mv); dial.removeEventListener('pointerup', up); dial.removeEventListener('pointercancel', up); };
      dial.addEventListener('pointermove', mv);
      dial.addEventListener('pointerup', up);
      dial.addEventListener('pointercancel', up);
    });
    const panel = h('div', 'gr-hour gr-panel gr-rise', [
      h('div', 'gr-kicker', o.kicker || 'Sit a while'),
      h('div', 'gr-menu-title', o.title || 'Until when'),
      big, sub, dial,
      h('div', 'gr-hour-acts', [stay, go]),
    ]);
    const handle = openScreen(ctx, {
      name: 'hour', panel, label: 'Sit a while', screen: false,
      focus: () => dial,
      key: (e) => {
        const k = e.key;
        if (k === 'ArrowRight' || k === 'ArrowUp' || isKey(e, 'd')) { e.preventDefault(); setSel(sel + 1, true); return true; }
        if (k === 'ArrowLeft' || k === 'ArrowDown' || isKey(e, 'a')) { e.preventDefault(); setSel(sel - 1, true); return true; }
        if (isKey(e, 'Enter', 'e') || (k === ' ' && document.activeElement === dial)) {
          if (document.activeElement === stay) return false;
          e.preventDefault();
          ctx.sfx('click');
          handle.close(opts[sel]);
          return true;
        }
        return false;
      },
      onClose: () => { if (hourH === handle) hourH = null; },
    });
    go.addEventListener('click', () => { ctx.sfx('click'); handle.close(opts[sel]); });
    stay.addEventListener('click', () => handle.close(null));
    hourH = handle;
    setSel(0, false);
    return handle.promise;
  }

  return { menu, pickHour };
}
