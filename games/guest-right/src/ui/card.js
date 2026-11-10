// The card home: the ending. Pick one of your photos for the front, turn it over, write up to
// 300 characters in your own hand, and send it by light. Resolves { front, text } or null.

import { h, btn, clear, isKey, isTyping, focusEl, hourLabel } from './dom.js';
import { iconEl } from './icons.js';
import { openScreen } from './stack.js';

const MAX = 300;
let uid = 0;

function caption(p) {
  if (!p) return '';
  const hr = p.hour != null && p.hour !== '' ? (typeof p.hour === 'number' ? hourLabel(p.hour) : p.hour) : null;
  return [p.place, p.day, hr].filter(Boolean).join(', ');
}

function stampSvg() {
  const holes = [];
  for (let x = 4; x <= 60; x += 7) { holes.push('<circle cx="' + x + '" cy="0" r="2.6"/>', '<circle cx="' + x + '" cy="78" r="2.6"/>'); }
  for (let y = 4; y <= 76; y += 7.2) { holes.push('<circle cx="0" cy="' + y + '" r="2.6"/>', '<circle cx="64" cy="' + y + '" r="2.6"/>'); }
  return '<svg class="gr-stamp" viewBox="0 0 64 78" aria-hidden="true">' +
    '<rect x="0" y="0" width="64" height="78" fill="#f6efe0"/>' +
    '<rect x="5" y="5" width="54" height="68" fill="#9c4a33"/>' +
    '<g fill="none" stroke="#f3e2c4" stroke-width="1.2">' +
    '<circle cx="32" cy="33" r="17"/><circle cx="32" cy="33" r="9"/><line x1="32" y1="14" x2="32" y2="52" stroke-dasharray="2 2"/>' +
    '<path d="M18 33h28" stroke-width=".8"/></g>' +
    '<circle cx="32" cy="33" r="2" fill="#ffd9a0"/>' +
    '<text x="32" y="64" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="600" font-size="7.5" letter-spacing="1.4" fill="#f3e2c4">CHERVIL</text>' +
    '<g fill="#efe6d3">' + holes.join('') + '</g></svg>';
}

function postmarkSvg(place, day, delay) {
  const id = 'gr-pm-' + (++uid);
  const top = String(place || 'Chervil').toUpperCase();
  const d = day != null && day !== '' ? (typeof day === 'number' ? 'DAY ' + day : String(day).toUpperCase()) : '';
  const lines = [];
  for (let i = 0; i < 4; i++) {
    const y = 26 + i * 9;
    lines.push('<path d="M-92 ' + y + ' q 8 -5 16 0 t 16 0 t 16 0 t 16 0 t 16 0" />');
  }
  return '<svg class="gr-postmark" viewBox="-96 -2 196 104" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6">' + lines.join('') +
    '<circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="31"/></g>' +
    '<defs><path id="' + id + '-a" d="M 13 50 A 37 37 0 0 1 87 50"/><path id="' + id + '-b" d="M 10 50 A 40 40 0 0 0 90 50"/></defs>' +
    '<text font-family="Barlow Condensed, sans-serif" font-weight="600" font-size="10" letter-spacing="2.2" fill="currentColor" text-anchor="middle"><textPath href="#' + id + '-a" startOffset="50%">' + top + '</textPath></text>' +
    '<text font-family="Barlow Condensed, sans-serif" font-weight="600" font-size="8" letter-spacing="2" fill="currentColor" text-anchor="middle"><textPath href="#' + id + '-b" startOffset="50%">BY LIGHT</textPath></text>' +
    '<text x="50" y="48" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="600" font-size="12" letter-spacing="1.2" fill="currentColor">' + d + '</text>' +
    (delay ? '<text x="50" y="61" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="500" font-size="9" letter-spacing="1" fill="currentColor">LIGHT ' + String(delay).toUpperCase() + '</text>' : '') +
    '</svg>';
}

function defaultFront() {
  const arches = [];
  for (let i = 0; i < 7; i++) {
    const x = 40 + i * 60;
    arches.push('<path d="M' + x + ' 300 V170 a30 30 0 0 1 60 0 V300" />');
    arches.push('<circle cx="' + (x + 30) + '" cy="150" r="3" fill="#ffd9a0" stroke="none"/>');
  }
  return '<svg class="gr-pc-def" viewBox="0 0 480 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<defs><radialGradient id="gr-pcg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#5a3b22"/><stop offset=".6" stop-color="#2a1b12"/><stop offset="1" stop-color="#140d08"/></radialGradient></defs>' +
    '<rect width="480" height="320" fill="url(#gr-pcg)"/>' +
    '<g fill="none" stroke="#ffd9a0" stroke-opacity=".35" stroke-width="1.4">' + arches.join('') + '<path d="M0 300H480"/></g>' +
    '<text x="240" y="118" text-anchor="middle" font-family="Cormorant Garamond, serif" font-style="italic" font-weight="600" font-size="58" fill="#ffe3a8">From Chervil</text>' +
    '<text x="240" y="146" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="600" font-size="12" letter-spacing="4" fill="#f3ede2" fill-opacity=".8">AN OPEN DRUM ON HERB ROW</text></svg>';
}

export function createCardHome(ctx) {
  const { G } = ctx;
  let current = null;

  function cardHome(spec) {
    const o = spec || {};
    if (current) current.close(null);
    let photos = Array.isArray(o.photos) ? o.photos : null;
    if (!photos) photos = G.journal('cards');
    photos = photos.map((p, i) => (typeof p === 'string' ? { id: i, src: p } : p)).filter((p) => p && p.src);
    let pick = photos.length ? 0 : -1;
    let side = 'front';

    const toStr = String(o.to || 'Pell, at Spelt');
    const toParts = toStr.split(/,\s*/);
    const toName = toParts[0];

    // front
    const frontImg = h('div', 'gr-pc-img');
    const frontCap = h('div', 'gr-pc-cap');
    const front = h('div', 'gr-pc-face gr-pc-front', [frontImg, frontCap]);
    // back
    const area = h('textarea', 'gr-pc-write');
    area.maxLength = MAX;
    area.rows = 7;
    area.spellcheck = false;
    area.placeholder = 'Dear ' + toName + ',';
    area.setAttribute('aria-label', 'Your card to ' + toName);
    const counter = h('div', 'gr-pc-count', '0 / ' + MAX);
    area.addEventListener('input', () => {
      if (area.value.length > MAX) area.value = area.value.slice(0, MAX);
      counter.textContent = area.value.length + ' / ' + MAX;
      counter.classList.toggle('is-full', area.value.length >= MAX - 20);
    });
    const stamp = h('div', 'gr-pc-stamp');
    stamp.innerHTML = stampSvg();
    const pm = h('div', 'gr-pc-pm');
    pm.innerHTML = postmarkSvg(o.place || 'Chervil', o.day, o.delay);
    const addr = h('div', 'gr-pc-addr', [
      h('div', 'gr-pc-al', 'To ' + toName + (toParts.length > 1 ? ',' : '')),
      toParts.length > 1 ? h('div', 'gr-pc-al', toParts.slice(1).join(', ')) : null,
      h('div', 'gr-pc-al', o.addressLine || 'Grain Row'),
    ]);
    const back = h('div', 'gr-pc-face gr-pc-back', [
      h('div', 'gr-pc-l', [area, counter]),
      h('div', 'gr-pc-div'),
      h('div', 'gr-pc-r', [h('div', 'gr-pc-top', [h('div', 'gr-pc-label', 'Post card'), stamp, pm]), addr]),
    ]);
    const inner = h('div', 'gr-pc-in', [front, back]);
    const card = h('div', 'gr-pc', inner);

    // the photo picker
    const thumbs = h('div', 'gr-ch-thumbs');
    thumbs.setAttribute('role', 'radiogroup');
    thumbs.setAttribute('aria-label', 'Photos for the front');
    const tBtns = photos.map((p, i) => {
      const img = h('img', '');
      img.src = p.src;
      img.alt = caption(p) || 'Photo ' + (i + 1);
      const b = btn('gr-ch-t', img);
      b.setAttribute('role', 'radio');
      b.tabIndex = -1;
      b.addEventListener('click', () => setPick(i, true));
      thumbs.appendChild(b);
      return b;
    });
    if (!photos.length) thumbs.appendChild(h('div', 'gr-ch-none', 'You kept no photos, so the front is the hall’s own card.'));

    const notYet = btn('gr-btn is-quiet', [h('span', 'gr-key is-small', 'Esc'), 'Not yet']);
    const turn = btn('gr-btn is-primary', [iconEl('flip'), 'Turn it over']);
    const toFront = btn('gr-btn is-quiet', [iconEl('flip'), 'The front']);
    const send = btn('gr-btn is-primary', [iconEl('send'), 'Send it home']);
    const actsF = h('div', 'gr-ch-acts', [notYet, turn]);
    const actsB = h('div', 'gr-ch-acts gr-gone', [toFront, h('span', 'gr-hint gr-ch-sendhint', [h('span', 'gr-key is-small', 'Ctrl'), h('span', 'gr-key is-small', 'Enter')]), send]);
    const stepF = h('div', 'gr-ch-step', [thumbs]);
    const panel = h('div', 'gr-ch gr-rise', [
      h('div', 'gr-ch-head', [
        h('div', 'gr-kicker', o.kicker || 'The fourth morning'),
        h('div', 'gr-ch-title', o.title || 'A card home'),
        h('div', 'gr-ch-sub', o.sub || 'One from every row, sent by light. Choose the front, then write.'),
      ]),
      card,
      stepF,
      h('div', 'gr-ch-foot', [actsF, actsB]),
    ]);

    function setPick(i, sound) {
      if (!photos.length) return;
      pick = Math.max(0, Math.min(photos.length - 1, i));
      tBtns.forEach((b, j) => { b.classList.toggle('is-on', j === pick); b.setAttribute('aria-checked', j === pick ? 'true' : 'false'); });
      clear(frontImg);
      const img = h('img', '');
      img.src = photos[pick].src;
      img.alt = caption(photos[pick]);
      frontImg.appendChild(img);
      frontCap.textContent = caption(photos[pick]);
      if (sound) ctx.sfx('hover');
    }
    function setSide(s) {
      side = s;
      inner.classList.toggle('is-back', s === 'back');
      card.classList.toggle('is-flipped', s === 'back');
      stepF.classList.toggle('is-hidden', s === 'back');
      actsF.classList.toggle('gr-gone', s === 'back');
      actsB.classList.toggle('gr-gone', s !== 'back');
      ctx.sfx('page');
      if (s === 'back') setTimeout(() => focusEl(area), 420);
      else focusEl(tBtns[pick] || turn);
    }
    function finish() {
      const p = photos[pick];
      ctx.sfx('click');
      handle.close({ front: p ? (p.id != null ? p.id : p.src) : null, text: area.value.slice(0, MAX) });
    }
    notYet.addEventListener('click', () => handle.close(null));
    turn.addEventListener('click', () => setSide('back'));
    toFront.addEventListener('click', () => setSide('front'));
    send.addEventListener('click', finish);
    card.addEventListener('click', (e) => { if (side === 'front') setSide('back'); else if (e.target === card) area.focus(); });

    if (photos.length) setPick(0, false);
    else frontImg.innerHTML = defaultFront();

    const handle = openScreen(ctx, {
      name: 'card', panel, cls: 'is-card', label: 'A card home',
      focus: () => (side === 'back' ? area : tBtns[pick] || turn),
      key: (e) => {
        if (e.key === 'Escape') { e.preventDefault(); if (side === 'back') setSide('front'); else handle.close(null); return true; }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (side === 'back') finish(); else setSide('back'); return true; }
        if (isTyping(e)) return true;
        if (side === 'front') {
          if (e.key === 'ArrowRight' || isKey(e, 'd')) { e.preventDefault(); setPick(pick + 1, true); focusEl(tBtns[pick]); return true; }
          if (e.key === 'ArrowLeft' || isKey(e, 'a')) { e.preventDefault(); setPick(pick - 1, true); focusEl(tBtns[pick]); return true; }
          if (isKey(e, 'Enter', 'e', ' ')) {
            const a = document.activeElement;
            if (a === notYet) return false;
            e.preventDefault();
            if (!e.repeat) setSide('back');
            return true;
          }
        } else if (isKey(e, 'Enter', ' ')) {
          const a = document.activeElement;
          if (a && a.tagName === 'BUTTON') { e.preventDefault(); if (!e.repeat) a.click(); return true; }
        }
        return false;
      },
      onClose: () => { if (current === handle) current = null; },
    });
    handle.layer.ctrlKeys = true;
    current = handle;
    return handle.promise;
  }

  return cardHome;
}
