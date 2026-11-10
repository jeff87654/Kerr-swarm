// Settings: custom sliders, segmented controls and toggles, and the settings sheet that writes
// every change through game.settings.set at once.

import { h, btn, clamp, isKey, focusEl } from './dom.js';
import { icon } from './icons.js';
import { openScreen } from './stack.js';

const pct = (v) => Math.round(v * 100) + '%';

export const SETTING_ROWS = [
  { sec: 'Picture' },
  { key: 'quality', label: 'Detail', hint: 'Shadows, lamps and how far you can see', type: 'seg', def: 'high', opts: [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['ultra', 'Ultra']] },
  { key: 'renderScale', label: 'Render scale', type: 'slider', def: 1, min: 0.5, max: 1, step: 0.05, fmt: pct },
  { key: 'fov', label: 'Field of view', type: 'slider', def: 75, min: 60, max: 100, step: 1, fmt: (v) => Math.round(v) + '°' },
  { key: 'headBob', label: 'Head bob', hint: 'The small sway of walking', type: 'toggle', def: true },
  { sec: 'Controls' },
  { key: 'sensitivity', label: 'Look sensitivity', type: 'slider', def: 1, min: 0.2, max: 3, step: 0.05, fmt: (v) => v.toFixed(2) + '×' },
  { key: 'invertY', label: 'Invert look', hint: 'Push up to look down', type: 'toggle', def: false },
  { sec: 'Sound' },
  { key: 'volMaster', label: 'Everything', type: 'slider', def: 0.8, min: 0, max: 1, step: 0.05, fmt: pct },
  { key: 'volMusic', label: 'Music', type: 'slider', def: 0.7, min: 0, max: 1, step: 0.05, fmt: pct },
  { key: 'volSfx', label: 'Effects', type: 'slider', def: 0.8, min: 0, max: 1, step: 0.05, fmt: pct },
  { key: 'volVoice', label: 'Voices', type: 'slider', def: 0.8, min: 0, max: 1, step: 0.05, fmt: pct },
  { key: 'volAmbience', label: 'The drum around you', type: 'slider', def: 0.8, min: 0, max: 1, step: 0.05, fmt: pct },
  { sec: 'Words and time' },
  { key: 'subtitles', label: 'Subtitles', hint: 'Overheard lines, and the size of all spoken text', type: 'seg', def: 'small', opts: [['off', 'Off'], ['small', 'Small'], ['large', 'Large']] },
  { key: 'daySpeed', label: 'Length of a day', hint: 'Minutes of real time for one day in Chervil', type: 'seg', def: 48, opts: [[24, '24 min'], [48, '48'], [72, '72'], [96, '96']] },
];

// A horizontal slider. Returns { el, ctl, set(v), get() }. el includes the value readout.
export function slider(o) {
  const min = o.min != null ? o.min : 0;
  const max = o.max != null ? o.max : 1;
  const step = o.step || (max - min) / 100;
  const fmt = o.fmt || ((v) => String(v));
  let value = clamp(Number(o.value != null ? o.value : min), min, max);
  const fill = h('div', 'gr-sl-fill');
  const knob = h('div', 'gr-sl-knob');
  const ctl = h('div', 'gr-sl gr-ctl', [h('div', 'gr-sl-track'), fill, knob]);
  ctl.tabIndex = 0;
  ctl.setAttribute('role', 'slider');
  if (o.label) ctl.setAttribute('aria-label', o.label);
  const val = h('div', 'gr-sl-val');
  const el = h('div', 'gr-sl-wrap', [ctl, val]);
  function draw() {
    const p = ((value - min) / (max - min || 1)) * 100;
    fill.style.width = p + '%';
    knob.style.left = p + '%';
    val.textContent = fmt(value);
    ctl.setAttribute('aria-valuenow', String(value));
    ctl.setAttribute('aria-valuetext', fmt(value));
  }
  function setv(v, fire) {
    const q = Math.round((clamp(v, min, max) - min) / step) * step + min;
    const nv = Number(clamp(q, min, max).toFixed(4));
    if (nv === value) return;
    value = nv;
    draw();
    if (fire && o.onInput) o.onInput(value);
  }
  const fromX = (cx) => {
    const r = ctl.getBoundingClientRect();
    return min + clamp((cx - r.left) / Math.max(1, r.width), 0, 1) * (max - min);
  };
  ctl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    focusEl(ctl);
    try { ctl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    ctl.classList.add('is-drag');
    setv(fromX(e.clientX), true);
    const mv = (ev) => setv(fromX(ev.clientX), true);
    const up = () => {
      ctl.classList.remove('is-drag');
      ctl.removeEventListener('pointermove', mv);
      ctl.removeEventListener('pointerup', up);
      ctl.removeEventListener('pointercancel', up);
      if (o.onCommit) o.onCommit(value);
    };
    ctl.addEventListener('pointermove', mv);
    ctl.addEventListener('pointerup', up);
    ctl.addEventListener('pointercancel', up);
  });
  ctl._grKey = (e) => {
    const big = e.shiftKey ? 5 : 1;
    if (e.key === 'ArrowRight' || isKey(e, 'd')) { e.preventDefault(); setv(value + step * big, true); return true; }
    if (e.key === 'ArrowLeft' || isKey(e, 'a')) { e.preventDefault(); setv(value - step * big, true); return true; }
    if (e.key === 'Home') { e.preventDefault(); setv(min, true); return true; }
    if (e.key === 'End') { e.preventDefault(); setv(max, true); return true; }
    return false;
  };
  draw();
  return { el, ctl, set: (v) => { value = clamp(Number(v), min, max); draw(); }, get: () => value };
}

// A segmented control. opts: [[value, label], ...]
export function segmented(o) {
  const ctl = h('div', 'gr-seg gr-ctl');
  ctl.tabIndex = 0;
  ctl.setAttribute('role', 'radiogroup');
  if (o.label) ctl.setAttribute('aria-label', o.label);
  let value = o.value;
  const btns = o.opts.map(([v, label]) => {
    const b = btn('gr-seg-b', label);
    b.tabIndex = -1;
    b.setAttribute('role', 'radio');
    b.addEventListener('click', () => { setv(v, true); focusEl(ctl); });
    ctl.appendChild(b);
    return b;
  });
  function draw() {
    o.opts.forEach(([v], i) => {
      const on = String(v) === String(value);
      btns[i].classList.toggle('is-on', on);
      btns[i].setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  function setv(v, fire) {
    if (String(v) === String(value)) return;
    value = v;
    draw();
    if (fire && o.onInput) o.onInput(value);
  }
  function stepBy(d) {
    let i = o.opts.findIndex(([v]) => String(v) === String(value));
    i = clamp((i < 0 ? 0 : i) + d, 0, o.opts.length - 1);
    setv(o.opts[i][0], true);
  }
  ctl._grKey = (e) => {
    if (e.key === 'ArrowRight' || isKey(e, 'd')) { e.preventDefault(); stepBy(1); return true; }
    if (e.key === 'ArrowLeft' || isKey(e, 'a')) { e.preventDefault(); stepBy(-1); return true; }
    return false;
  };
  draw();
  return { el: ctl, ctl, set: (v) => { value = v; draw(); }, get: () => value };
}

export function toggle(o) {
  let value = !!o.value;
  const ctl = btn('gr-tog gr-ctl', [h('span', 'gr-tog-k')]);
  ctl.setAttribute('role', 'switch');
  if (o.label) ctl.setAttribute('aria-label', o.label);
  const txt = h('span', 'gr-tog-t');
  const el = h('div', 'gr-tog-wrap', [txt, ctl]);
  function draw() {
    ctl.classList.toggle('is-on', value);
    ctl.setAttribute('aria-checked', value ? 'true' : 'false');
    txt.textContent = value ? 'On' : 'Off';
  }
  function setv(v) {
    value = !!v;
    draw();
    if (o.onInput) o.onInput(value);
  }
  ctl.addEventListener('click', () => setv(!value));
  ctl._grKey = (e) => {
    if (isKey(e, 'Enter', ' ', 'e')) { e.preventDefault(); if (!e.repeat) setv(!value); return true; }
    if (e.key === 'ArrowRight' || isKey(e, 'd')) { e.preventDefault(); if (!value) setv(true); return true; }
    if (e.key === 'ArrowLeft' || isKey(e, 'a')) { e.preventDefault(); if (value) setv(false); return true; }
    return false;
  };
  draw();
  return { el, ctl, set: (v) => { value = !!v; draw(); }, get: () => value };
}

// The header used by every sheet: kicker, title and a close button.
export function sheetHead(kicker, title, onClose) {
  const x = btn('gr-x', null, 'Close');
  x.innerHTML = icon('close');
  x.addEventListener('click', onClose);
  return {
    el: h('div', 'gr-sheet-head', [h('div', 'gr-sheet-ht', [kicker ? h('div', 'gr-kicker', kicker) : null, h('div', 'gr-sheet-title', title)]), h('div', 'gr-sheet-hx', [h('span', 'gr-key is-small gr-esc', 'Esc'), x])]),
    x,
  };
}

// Up and Down move between the controls of a sheet.
export function rowNav(e, root) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && !isKey(e, 'w', 's')) return false;
  const list = Array.from(root.querySelectorAll('.gr-ctl, .gr-nav')).filter((x) => x.getClientRects().length);
  if (!list.length) return false;
  e.preventDefault();
  const i = list.indexOf(document.activeElement);
  const d = e.key === 'ArrowDown' || isKey(e, 's') ? 1 : -1;
  const n = i < 0 ? (d > 0 ? 0 : list.length - 1) : clamp(i + d, 0, list.length - 1);
  focusEl(list[n]);
  list[n].scrollIntoView({ block: 'nearest' });
  return true;
}

export function openSettings(ctx, parent) {
  const { G } = ctx;
  let handle = null;
  const head = sheetHead('Settings', 'How it looks and sounds', () => handle && handle.close(null));
  const body = h('div', 'gr-sheet-body');
  for (const r of SETTING_ROWS) {
    if (r.sec) { body.appendChild(h('div', 'gr-sec', h('span', 'gr-kicker', r.sec))); continue; }
    const cur = G.get(r.key, r.def);
    const write = (v) => { G.set(r.key, v); ctx.onSetting(r.key, v); ctx.sfx('click'); };
    let c;
    if (r.type === 'slider') c = slider({ min: r.min, max: r.max, step: r.step, fmt: r.fmt, value: cur, label: r.label, onInput: (v) => { G.set(r.key, v); ctx.onSetting(r.key, v); } , onCommit: () => ctx.sfx('click') });
    else if (r.type === 'seg') c = segmented({ opts: r.opts, value: cur, label: r.label, onInput: write });
    else c = toggle({ value: cur, label: r.label, onInput: write });
    body.appendChild(h('div', 'gr-srow is-' + r.type, [
      h('div', 'gr-srow-l', [h('div', 'gr-srow-n', r.label), r.hint ? h('div', 'gr-srow-h', r.hint) : null]),
      h('div', 'gr-srow-c is-' + r.type, c.el),
    ]));
  }
  const panel = h('div', 'gr-sheet gr-panel gr-rise', [head.el, body]);
  handle = openScreen(ctx, {
    name: 'settings', panel, parent, label: 'Settings',
    focus: () => body.querySelector('.gr-ctl'),
    key: (e) => rowNav(e, body),
  });
  return handle;
}
