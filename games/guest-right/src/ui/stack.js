// The stack of screens that take input. The top one gets the keys; Esc closes it;
// focus is trapped inside it and restored to where it was when it closes.

import { h, deferred, focusables, focusEl } from './dom.js';

export function createStack(onChange) {
  const layers = [];

  function push(layer) {
    layer.prevFocus = document.activeElement;
    layers.push(layer);
    onChange();
    return layer;
  }

  function remove(layer) {
    const i = layers.indexOf(layer);
    if (i < 0) return;
    const wasTop = i === layers.length - 1;
    layers.splice(i, 1);
    if (wasTop) {
      const top = layers[layers.length - 1];
      const pf = layer.prevFocus;
      if (pf && pf.isConnected && (!top || (top.el && top.el.contains(pf)))) focusEl(pf);
      else if (top && top.refocus) top.refocus();
      else if (!top && document.activeElement && document.activeElement.closest && document.activeElement.closest('#gr-ui')) document.activeElement.blur();
    }
    onChange();
  }

  function top() {
    return layers[layers.length - 1] || null;
  }

  function find(name) {
    for (let i = layers.length - 1; i >= 0; i--) if (layers[i].name === name) return layers[i];
    return null;
  }

  return { push, remove, top, find, layers };
}

// Keeps Tab and Shift+Tab inside el.
export function trapTab(e, el) {
  const list = focusables(el);
  if (!list.length) { e.preventDefault(); return; }
  const i = list.indexOf(document.activeElement);
  let n;
  if (e.shiftKey) n = i <= 0 ? list.length - 1 : i - 1;
  else n = i < 0 || i >= list.length - 1 ? 0 : i + 1;
  e.preventDefault();
  focusEl(list[n]);
}

// Opens a full screen (a scrim plus a panel) on the screen layer, as a modal layer.
// opts: { name, cls, panel, key(e, handle), onClose(v), parent, scrim, screen, focus, escape }
// Returns { el, wrap, promise, close(v), closed, children }.
export function openScreen(ctx, opts) {
  const o = opts || {};
  const wrap = h('div', 'gr-screen' + (o.scrim === false ? '' : ' is-scrim') + (o.cls ? ' ' + o.cls : ''));
  if (o.panel) wrap.appendChild(o.panel);
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  if (o.label) wrap.setAttribute('aria-label', o.label);
  ctx.layers.screen.appendChild(wrap);
  const d = deferred();
  const handle = {
    el: o.panel || wrap,
    wrap,
    promise: d.promise,
    closed: false,
    children: [],
    close(v) {
      if (handle.closed) return;
      handle.closed = true;
      for (const c of handle.children.slice()) c.close(null);
      if (o.parent) {
        const i = o.parent.children.indexOf(handle);
        if (i >= 0) o.parent.children.splice(i, 1);
      }
      ctx.stack.remove(layer);
      wrap.classList.remove('is-on');
      wrap.style.pointerEvents = 'none';
      setTimeout(() => wrap.remove(), 300);
      if (o.sound !== false) ctx.sfx('close');
      try { if (o.onClose) o.onClose(v); } catch (err) { console.error(err); }
      d.resolve(v === undefined ? null : v);
    },
  };
  const layer = {
    name: o.name || 'screen',
    el: wrap,
    screen: o.screen !== false,
    cursor: true,
    key(e) {
      if (o.key && o.key(e, handle) === true) return;
      if (e.key === 'Escape' && o.escape !== false) { e.preventDefault(); handle.close(null); }
    },
    refocus() {
      const f = (typeof o.focus === 'function' ? o.focus() : o.focus) || focusables(wrap)[0];
      focusEl(f);
    },
  };
  handle.layer = layer;
  layer.handle = handle;
  if (o.parent) o.parent.children.push(handle);
  ctx.stack.push(layer);
  if (o.sound !== false) ctx.sfx('open');
  // Focus as soon as the caller has finished building the screen (a microtask), so a key
  // pressed before the first frame already lands in it. The fade-in waits for a frame.
  queueMicrotask(() => {
    if (!handle.closed && !wrap.contains(document.activeElement)) layer.refocus();
  });
  requestAnimationFrame(() => {
    if (handle.closed) return;
    wrap.classList.add('is-on');
    if (!wrap.contains(document.activeElement)) layer.refocus();
  });
  return handle;
}
