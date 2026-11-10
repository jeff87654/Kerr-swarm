// Small DOM and data helpers shared by the UI modules. No game state lives here.

export function h(tag, cls, kids) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (kids != null) add(e, kids);
  return e;
}

export function add(parent, kids) {
  if (kids == null || kids === false) return parent;
  if (Array.isArray(kids)) {
    for (const k of kids) add(parent, k);
  } else if (typeof kids === 'string' || typeof kids === 'number') {
    parent.appendChild(document.createTextNode(String(kids)));
  } else {
    parent.appendChild(kids);
  }
  return parent;
}

export function attr(e, o) {
  for (const k in o) {
    if (o[k] === false || o[k] == null) e.removeAttribute(k);
    else e.setAttribute(k, o[k] === true ? '' : String(o[k]));
  }
  return e;
}

export function markup(tag, cls, inner) {
  const e = h(tag, cls);
  e.innerHTML = inner;
  return e;
}

export function clear(e) {
  while (e && e.firstChild) e.removeChild(e.firstChild);
  return e;
}

export function btn(cls, kids, label) {
  const b = h('button', cls, kids);
  b.type = 'button';
  if (label) b.setAttribute('aria-label', label);
  return b;
}

export function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

export function wrap180(d) {
  return ((((d + 180) % 360) + 360) % 360) - 180;
}

export function fmt2(n) {
  const v = Number(n);
  return isFinite(v) ? v.toFixed(2) : '0.00';
}

export function fmtDist(m) {
  const v = Number(m);
  if (!isFinite(v)) return '';
  if (v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 0 : 1) + ' km';
  return Math.round(v) + ' m';
}

// 13.5 -> '13:30'. Hours past 24 wrap.
export function hourLabel(hh) {
  let t = ((Number(hh) % 24) + 24) % 24;
  let H = Math.floor(t);
  let M = Math.round((t - H) * 60);
  if (M === 60) { M = 0; H = (H + 1) % 24; }
  return String(H).padStart(2, '0') + ':' + String(M).padStart(2, '0');
}

// '13:05' -> 13.083, or null.
export function parseHour(s) {
  const m = /(\d{1,2}):(\d{2})/.exec(String(s || ''));
  return m ? Number(m[1]) + Number(m[2]) / 60 : null;
}

export function speakerOf(s, fallback) {
  if (s && typeof s === 'object') {
    return { name: String(s.name || s.short || ''), colour: s.colour || s.color || null, raw: s };
  }
  if (typeof s === 'string' && s) return { name: s, colour: null, raw: s };
  if (fallback) return fallback;
  return { name: '', colour: null, raw: null };
}

export function focusables(root) {
  if (!root) return [];
  const list = root.querySelectorAll('button, [href], input, textarea, select, [tabindex]');
  const out = [];
  for (const e of list) {
    if (e.disabled || e.getAttribute('tabindex') === '-1') continue;
    if (e.closest('[inert], .gr-gone')) continue;
    if (!e.getClientRects().length) continue;
    out.push(e);
  }
  return out;
}

export function isTyping(e) {
  const t = e && e.target;
  if (!t || !t.tagName) return false;
  if (t.tagName === 'TEXTAREA') return true;
  if (t.tagName === 'INPUT') return !/^(button|checkbox|radio|range|submit)$/.test(t.type || 'text');
  return !!t.isContentEditable;
}

export function isKey(e, ...names) {
  const k = e.key;
  for (const n of names) {
    if (n === k) return true;
    if (n.length === 1 && k && k.length === 1 && n.toLowerCase() === k.toLowerCase()) return true;
  }
  return false;
}

export function isConfirm(e) {
  return isKey(e, 'Enter', ' ', 'e');
}

// A promise that resolves once, however many times resolve is called.
export function deferred() {
  let res;
  const promise = new Promise((r) => { res = r; });
  const d = {
    promise,
    done: false,
    resolve(v) {
      if (d.done) return;
      d.done = true;
      res(v);
    },
  };
  return d;
}

// Wraps the text so that any kWh amount in it is drawn in ember.
export function kwhText(text) {
  const frag = document.createDocumentFragment();
  const s = String(text == null ? '' : text);
  const re = /([+-]?\d+(?:\.\d+)?\s?kWh)/g;
  let last = 0;
  let m;
  while ((m = re.exec(s))) {
    if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
    frag.appendChild(h('span', 'gr-ember', m[1]));
    last = m.index + m[1].length;
  }
  if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
  return frag;
}

export function focusEl(e) {
  if (!e || typeof e.focus !== 'function') return;
  try { e.focus({ preventScroll: true }); } catch (err) { /* ignore */ }
}

// Everything the UI reads from the game goes through here, so a missing piece never throws.
export function safeGame(game) {
  const g = () => game || {};
  const call = (fn, def) => {
    try {
      const v = fn();
      return v === undefined || v === null ? def : v;
    } catch (err) {
      return def;
    }
  };
  return {
    raw: () => game,
    get: (k, d) => call(() => g().settings.get(k), d),
    set: (k, v) => call(() => g().settings.set(k, v), undefined),
    emit: (n, d) => call(() => g().events.emit(n, d), undefined),
    on: (n, f) => call(() => g().events.on(n, f), undefined),
    sfx: (n) => call(() => g().audio.ui(n), undefined),
    journal: (k) => {
      const v = call(() => g().journal[k](), []);
      return Array.isArray(v) ? v : [];
    },
    mapData: () => call(() => g().mapData(), null),
    photoSet: (o) => call(() => g().photo.set(o), undefined),
    photoTake: () => call(() => g().photo.take(), null),
    clock: () => call(() => g().clock.label(), ''),
    kwh: () => {
      const v = call(() => g().wallet.kwh, null);
      return typeof v === 'number' && isFinite(v) ? v : null;
    },
    setVirtual: (v) => call(() => {
      if (!game) return;
      if (!game.input || typeof game.input !== 'object') game.input = {};
      game.input.virtual = v;
    }, undefined),
  };
}
