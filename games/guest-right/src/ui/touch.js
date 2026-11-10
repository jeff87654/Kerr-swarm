// Touch controls: a stick that appears where the left thumb lands, a look pad on the right half,
// and buttons for use, jump, hurry and the journal (plus map and pause at the top right).
// Writes game.input.virtual = { moveX, moveY, lookDX, lookDY, jump, use, run }.
// moveY is +1 for forward. lookDX and lookDY are pixels since the game last read them: the game
// adds them to its look and sets them back to 0.

import { h, btn, clamp } from './dom.js';
import { icon } from './icons.js';

const RADIUS = 52;
const DEAD = 0.1;

export function createTouch(ctx) {
  const { layers, G } = ctx;
  const v = { moveX: 0, moveY: 0, lookDX: 0, lookDY: 0, jump: false, use: false, run: false };
  let on = false;

  const left = h('div', 'gr-tz is-left');
  const right = h('div', 'gr-tz is-right');
  const knob = h('div', 'gr-stick-k');
  const stick = h('div', 'gr-stick', knob);
  const mk = (cls, ico, label) => {
    const b = btn('gr-touch-btn ' + cls, null, label);
    b.innerHTML = icon(ico) + '<span class="gr-tb-l">' + label + '</span>';
    return b;
  };
  const bUse = mk('is-use', 'hand', 'Use');
  const bJump = mk('is-jump', 'jump', 'Jump');
  const bRun = mk('is-run', 'run', 'Hurry');
  const bJournal = mk('is-journal', 'book', 'Journal');
  const bMap = mk('is-map is-top', 'map', 'Map');
  const bPause = mk('is-pause is-top', 'menu', 'Pause');
  const el = h('div', 'gr-touch', [left, right, stick, bUse, bJump, bRun, bJournal, bMap, bPause]);
  layers.touch.appendChild(el);

  function write() {
    G.setVirtual(v);
  }

  // the stick
  let stickId = null;
  let ox = 0;
  let oy = 0;
  left.addEventListener('pointerdown', (e) => {
    if (stickId !== null) return;
    e.preventDefault();
    stickId = e.pointerId;
    try { left.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    const r = el.getBoundingClientRect();
    ox = clamp(e.clientX - r.left, RADIUS + 12, r.width - RADIUS - 12);
    oy = clamp(e.clientY - r.top, RADIUS + 12, r.height - RADIUS - 12);
    stick.style.transform = 'translate(' + (ox - RADIUS) + 'px,' + (oy - RADIUS) + 'px)';
    stick.classList.add('is-on');
    moveStick(e);
  });
  function moveStick(e) {
    const r = el.getBoundingClientRect();
    let dx = e.clientX - r.left - ox;
    let dy = e.clientY - r.top - oy;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) { dx *= RADIUS / d; dy *= RADIUS / d; }
    knob.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    const m = Math.min(1, d / RADIUS);
    const k = m < DEAD ? 0 : (m - DEAD) / (1 - DEAD) / (m || 1);
    v.moveX = Number((dx / RADIUS * k).toFixed(3));
    v.moveY = Number((-dy / RADIUS * k).toFixed(3));
    write();
  }
  left.addEventListener('pointermove', (e) => { if (e.pointerId === stickId) moveStick(e); });
  const endStick = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    stick.classList.remove('is-on');
    knob.style.transform = '';
    v.moveX = 0;
    v.moveY = 0;
    write();
  };
  left.addEventListener('pointerup', endStick);
  left.addEventListener('pointercancel', endStick);

  // the look pad
  let lookId = null;
  let lx = 0;
  let ly = 0;
  right.addEventListener('pointerdown', (e) => {
    if (lookId !== null) return;
    e.preventDefault();
    lookId = e.pointerId;
    lx = e.clientX;
    ly = e.clientY;
    try { right.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  right.addEventListener('pointermove', (e) => {
    if (e.pointerId !== lookId) return;
    v.lookDX += e.clientX - lx;
    v.lookDY += e.clientY - ly;
    lx = e.clientX;
    ly = e.clientY;
    write();
  });
  const endLook = (e) => { if (e.pointerId === lookId) lookId = null; };
  right.addEventListener('pointerup', endLook);
  right.addEventListener('pointercancel', endLook);

  // buttons
  const hold = (b, key) => {
    const down = (e) => { e.preventDefault(); e.stopPropagation(); v[key] = true; b.classList.add('is-down'); write(); try { b.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } };
    const up = () => { v[key] = false; b.classList.remove('is-down'); write(); };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
  };
  hold(bUse, 'use');
  hold(bJump, 'jump');
  bRun.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    v.run = !v.run;
    bRun.classList.toggle('is-latched', v.run);
    write();
  });
  const tap = (b, fn) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); ctx.sfx('click'); fn(); });
  tap(bJournal, () => ctx.openJournal());
  tap(bMap, () => ctx.openMap());
  tap(bPause, () => ctx.openPause());
  for (const b of [bUse, bJump, bRun, bJournal, bMap, bPause]) b.addEventListener('contextmenu', (e) => e.preventDefault());

  function reset() {
    stickId = null;
    lookId = null;
    stick.classList.remove('is-on');
    knob.style.transform = '';
    v.moveX = 0; v.moveY = 0; v.lookDX = 0; v.lookDY = 0; v.jump = false; v.use = false;
    for (const b of [bUse, bJump]) b.classList.remove('is-down');
    write();
  }

  return {
    enable(flag) {
      on = flag !== false;
      el.classList.toggle('is-on', on);
      ctx.setTouch(on);
      if (!on) { v.run = false; bRun.classList.remove('is-latched'); }
      reset();
    },
    get enabled() { return on; },
    useHint(flag) { bUse.classList.toggle('is-hint', !!flag); },
    reset,
    virtual: v,
  };
}
