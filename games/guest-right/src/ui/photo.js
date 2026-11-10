// Photo mode: hides the HUD, draws a thin frame with rule-of-thirds ticks, offers three sliders
// (field of view, exposure, hour of day) and a shutter. Not modal: the player can still look about.

import { h, btn, clamp, parseHour, hourLabel, isKey, focusEl } from './dom.js';
import { iconEl } from './icons.js';
import { slider } from './settings.js';

export function createPhoto(ctx) {
  const { G, layers } = ctx;
  let active = false;
  let els = null;
  let hidden = false;
  let kept = 0;
  let busy = false;
  const state = { fov: 60, ev: 0, hour: 12 };

  function push() {
    G.photoSet({ fov: state.fov, ev: state.ev, hour: state.hour });
  }

  function build() {
    const frame = h('div', 'gr-pf', [
      h('i', 'gr-pf-c is-tl'), h('i', 'gr-pf-c is-tr'), h('i', 'gr-pf-c is-bl'), h('i', 'gr-pf-c is-br'),
      h('i', 'gr-pf-t is-t1'), h('i', 'gr-pf-t is-t2'), h('i', 'gr-pf-t is-b1'), h('i', 'gr-pf-t is-b2'),
      h('i', 'gr-pf-t is-l1'), h('i', 'gr-pf-t is-l2'), h('i', 'gr-pf-t is-r1'), h('i', 'gr-pf-t is-r2'),
      h('i', 'gr-pf-x is-1'), h('i', 'gr-pf-x is-2'), h('i', 'gr-pf-x is-3'), h('i', 'gr-pf-x is-4'),
    ]);
    const fov = slider({ min: 20, max: 100, step: 1, value: state.fov, label: 'Field of view', fmt: (v) => Math.round(v) + '°', onInput: (v) => { state.fov = v; push(); } });
    const ev = slider({ min: -2, max: 2, step: 0.1, value: state.ev, label: 'Exposure', fmt: (v) => (v > 0.04 ? '+' : v < -0.04 ? '-' : '') + Math.abs(v).toFixed(1) + ' EV', onInput: (v) => { state.ev = v; push(); } });
    const hour = slider({ min: 0, max: 24, step: 0.25, value: state.hour, label: 'Hour of day', fmt: (v) => hourLabel(v), onInput: (v) => { state.hour = v; push(); } });
    const grp = (ico, label, s) => h('div', 'gr-pslot', [h('div', 'gr-pslot-h', [iconEl(ico), h('span', 'gr-kicker', label)]), s.el]);
    const shutter = btn('gr-shutter', h('span', 'gr-shutter-i'), 'Take a photo');
    shutter.addEventListener('click', (e) => { e.stopPropagation(); take(); });
    const ctl = h('div', 'gr-pctl gr-panel', [
      grp('lens', 'Field of view', fov),
      grp('aperture', 'Exposure', ev),
      grp('sun', 'Hour', hour),
      h('div', 'gr-pctl-s', shutter),
    ]);
    const exit = btn('gr-btn is-quiet gr-pexit', [h('span', 'gr-key is-small', 'Esc'), 'Leave']);
    exit.addEventListener('click', () => api.exit());
    const hideB = btn('gr-btn is-quiet', [h('span', 'gr-key is-small', 'H'), 'Hide']);
    hideB.addEventListener('click', () => setHidden(!hidden));
    const top = h('div', 'gr-ptop', [
      h('div', 'gr-ptop-l', [iconEl('camera'), h('span', 'gr-kicker', 'Photo mode'), h('span', 'gr-pcount', '')]),
      h('div', 'gr-ptop-r', [h('span', 'gr-hint', [h('span', 'gr-key is-small', 'Enter'), 'Take']), hideB, exit]),
    ]);
    const flash = h('div', 'gr-pflash');
    const thumbs = h('div', 'gr-pthumbs');
    const hint = h('div', 'gr-phint', [h('span', 'gr-key is-small', 'H'), 'Show the controls']);
    const el = h('div', 'gr-photo', [frame, top, ctl, flash, thumbs, hint]);
    layers.photo.appendChild(el);
    return { el, fov, ev, hour, shutter, flash, thumbs, count: top.querySelector('.gr-pcount'), ctl };
  }

  function setHidden(v) {
    hidden = !!v;
    if (els) els.el.classList.toggle('is-bare', hidden);
  }

  function take() {
    if (!active || busy) return;
    busy = true;
    const f = els.flash;
    f.classList.remove('is-on');
    void f.offsetWidth;
    f.classList.add('is-on');
    els.shutter.classList.add('is-press');
    setTimeout(() => els && els.shutter.classList.remove('is-press'), 180);
    let res;
    try { res = G.photoTake(); } catch (err) { res = null; }
    Promise.resolve(res).then((src) => {
      busy = false;
      if (!src || !els) return;
      kept += 1;
      els.count.textContent = kept === 1 ? 'One kept' : kept + ' kept';
      const img = h('img', '');
      img.src = src;
      img.alt = 'The photo you just took';
      const t = h('div', 'gr-pthumb', img);
      els.thumbs.appendChild(t);
      while (els.thumbs.children.length > 3) els.thumbs.firstChild.remove();
      requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('is-docked')));
      setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 500); }, 3200);
    }, () => { busy = false; });
  }

  const api = {
    enter() {
      if (active) return;
      if (!els) els = build();
      active = true;
      busy = false;
      state.fov = clamp(Number(G.get('fov', 60)) || 60, 20, 100);
      const hr = parseHour(G.clock());
      state.hour = hr != null ? Math.round(hr * 4) / 4 : 12;
      state.ev = 0;
      els.fov.set(state.fov);
      els.ev.set(state.ev);
      els.hour.set(state.hour);
      els.count.textContent = '';
      setHidden(false);
      els.el.classList.add('is-on');
      ctx.setPhoto(true);
      G.emit('ui:photo', true);
      ctx.sfx('open');
    },
    exit() {
      if (!active) return;
      active = false;
      els.el.classList.remove('is-on');
      if (document.activeElement && els.el.contains(document.activeElement)) document.activeElement.blur();
      ctx.setPhoto(false);
      G.emit('ui:photo', false);
      ctx.sfx('close');
    },
    take,
    get active() { return active; },
    // Keys while photo mode is open and nothing modal is above it. Returns true when used.
    key(e) {
      if (!active) return false;
      const a = document.activeElement;
      if (a && a._grKey && els.el.contains(a) && a._grKey(e)) return true;
      if (e.key === 'Escape') { e.preventDefault(); api.exit(); return true; }
      if (isKey(e, 'Enter', 'f')) { e.preventDefault(); if (!e.repeat) take(); return true; }
      if (e.key === ' ' && a === els.shutter) { e.preventDefault(); if (!e.repeat) take(); return true; }
      if (isKey(e, 'h')) { e.preventDefault(); setHidden(!hidden); return true; }
      if (e.key === 'Tab') {
        e.preventDefault();
        const list = [els.fov.ctl, els.ev.ctl, els.hour.ctl, els.shutter];
        const i = list.indexOf(a);
        const n = i < 0 ? (e.shiftKey ? list.length - 1 : 0) : (i + (e.shiftKey ? -1 : 1) + list.length) % list.length;
        focusEl(list[n]);
        return true;
      }
      return false;
    },
  };
  return api;
}
