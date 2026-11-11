// Round the drum: one layer of the city unrolled. N blocks round (45 to 88, wrapping) by 17 along the axis, the nine
// rings marked, every block a cell: Candlewick, the block you are in, the blocks you have been to and the halls you have
// eaten at. A strip of the 58 layers at the side steps up and down. Hover or focus a cell to read it; in chooser mode a
// cell can be picked and gone to by cab.
//
// createRound(ctx, { chooser, from, cell, onGo(cell), onBack() }) -> { el, show(), hide(), key(e), focus(), resize(), refresh() }
// Needs game.city; the caller checks G.city() first.

import { h, btn, clear, clamp, isKey, focusEl } from './dom.js';
import { iconEl } from './icons.js';
import { BAND_WORDS, ringWord, ringOfJ, parseCell, cellKeyOf, cap, signedOf, ateAt, infoOf, youCell, relWords } from './chervil.js';

const J0 = 1, J1 = 17, ROWS = 17;
const C = {
  lamp: '#FFD9A0', gold: '#FFE3A8', text: '#F3EDE2', dim: '#A99F90', faint: '#7d7468', ink: '#14100c', leaf: '#8FD694', teal: '#3FE0D0',
};

// a steady 0..1 per block, so the unvisited city has a texture and the same block always looks the same
function grain(L, i, j) {
  let x = (L * 73856093) ^ (i * 19349663) ^ (j * 83492791);
  x = Math.imul(x ^ (x >>> 13), 0x5bd1e995);
  x ^= x >>> 15;
  return ((x >>> 0) % 1000) / 1000;
}

export function createRound(ctx, opts) {
  const { G } = ctx;
  const o = opts || {};
  const city = G.city();
  const LAYERS = city.LAYERS;
  const NL = LAYERS.length;
  const chooser = !!o.chooser;
  const HOME = city.HOME || { L: 0, i: 0, j: 3 };

  let you = youCell(city);
  const startCell = o.cell || o.from || you || HOME;
  let L = clamp(startCell.L | 0, 0, NL - 1);
  let cur = { i: wrap(L, startCell.i), j: clamp(startCell.j | 0, J0, J1) };
  let hover = null;
  let pick = null;
  let start = 0;           // the signed index of the leftmost column shown
  let geo = null;
  let flags = G.flags() || {};
  let visitedLayers = new Map();

  // ---------- elements ----------
  const title = h('div', 'gr-rh-t', '');
  const sub = h('div', 'gr-rh-s', '');
  const been = h('div', 'gr-rh-b', '');
  const upB = btn('gr-btn is-quiet gr-rh-btn', [iconEl('chevUp'), h('span', 'gr-rh-bl', 'Up a layer')], 'Up a layer, toward the axis');
  const dnB = btn('gr-btn is-quiet gr-rh-btn', [iconEl('chevDown'), h('span', 'gr-rh-bl', 'Down a layer')], 'Down a layer, toward the rim');
  const meB = btn('gr-btn is-quiet gr-rh-btn', [iconEl('target'), h('span', 'gr-rh-bl', 'Where you are')], 'Back to where you are');
  upB.addEventListener('click', () => step(1, true));
  dnB.addEventListener('click', () => step(-1, true));
  meB.addEventListener('click', () => toYou(true));
  const head = h('div', 'gr-rh', [h('div', 'gr-rh-l', [title, h('div', 'gr-rh-row', [sub, been])]), h('div', 'gr-rh-ctl', [dnB, upB, meB])]);

  const canvas = h('canvas', 'gr-rcv');
  canvas.setAttribute('aria-hidden', 'true');
  const cursorEl = h('div', 'gr-rcur');
  const hoverEl = h('div', 'gr-rcur is-hover gr-gone');
  const youEl = h('div', 'gr-ryou gr-gone', [h('i', 'gr-ryou-p'), h('i', 'gr-ryou-d')]);
  const pickEl = h('div', 'gr-rpick gr-gone');
  const live = h('div', 'gr-sr');
  live.setAttribute('aria-live', 'polite');
  const gridHost = h('div', 'gr-rgrid', [canvas, pickEl, youEl, hoverEl, cursorEl, live]);
  gridHost.tabIndex = 0;
  gridHost.setAttribute('role', 'application');
  gridHost.setAttribute('aria-roledescription', 'map of blocks');
  gridHost.setAttribute('aria-label', 'Blocks round the drum. Arrow keys move, Page Up and Page Down change layer' + (chooser ? ', Enter picks a block.' : '.'));

  const gcv = h('canvas', 'gr-rgcv');
  gcv.setAttribute('aria-hidden', 'true');
  const gauge = h('div', 'gr-rgauge', [h('div', 'gr-rg-cap', 'Up'), h('div', 'gr-rg-host', gcv), h('div', 'gr-rg-cap', 'Down')]);

  const card = h('div', 'gr-rcard');
  const legend = h('div', 'gr-rlegend', [
    h('span', 'gr-rlg is-you', [h('i', ''), 'You']),
    h('span', 'gr-rlg is-home', [h('i', ''), 'Candlewick']),
    h('span', 'gr-rlg is-been', [h('i', ''), 'Been']),
    h('span', 'gr-rlg is-ate', [h('i', ''), 'Ate there']),
    h('span', 'gr-rlg is-not', [h('i', ''), 'Not yet']),
  ]);
  const goB = btn('gr-btn is-primary gr-rgo', [h('span', 'gr-rgo-k', 'Go here'), h('span', 'gr-rgo-n', '')]);
  const backB = btn('gr-btn is-quiet gr-rback', [h('span', 'gr-key is-small', 'Esc'), 'Back']);
  goB.disabled = true;
  goB.addEventListener('click', () => go());
  backB.addEventListener('click', () => { if (o.onBack) o.onBack(); });
  const foot = chooser ? h('div', 'gr-rfoot', [backB, goB]) : h('div', 'gr-rfoot', legend);
  const info = h('div', 'gr-rinfo', [card, foot]);
  const el = h('div', 'gr-round' + (chooser ? ' is-chooser' : ''), [head, gridHost, gauge, info]);

  // ---------- helpers ----------
  function wrap(l, i) { const N = LAYERS[l].N; return (((i | 0) % N) + N) % N; }
  function keyOf(l, i, j) { return l + ':' + wrap(l, i) + ':' + j; }
  function visited(k) { try { return !!(city.visited && city.visited.has(k)); } catch (err) { return false; } }
  function readVisited() {
    visitedLayers = new Map();
    try { for (const k of city.visited) { const c = parseCell(k); if (LAYERS[c.L]) visitedLayers.set(c.L, (visitedLayers.get(c.L) || 0) + 1); } } catch (err) { /* none */ }
  }
  function firstSi(N) { return Math.floor(N / 2) - N + 1; }

  // ---------- geometry ----------
  function layout() {
    const W = Math.max(10, gridHost.clientWidth), H = Math.max(10, gridHost.clientHeight);
    const N = LAYERS[L].N;
    const narrow = W < 520;
    const padL = narrow ? 34 : 58, padR = 10, padT = 24, padB = 28;
    const aw = W - padL - padR, ah = H - padT - padB;
    const ch = clamp(Math.floor(ah / ROWS), 8, 26);
    let cw = aw / N;
    const full = cw >= 6.5;
    if (!full) cw = 7;
    cw = Math.min(cw, ch * 1.3);
    const cols = full ? N : Math.floor(aw / cw);
    const gw = cols * cw, gh = ROWS * ch;
    const x0 = Math.round(padL + (aw - gw) / 2);
    const y0 = Math.round(padT + Math.max(0, (ah - gh) / 2));
    geo = { W, H, N, cw, ch, cols, full, gw, gh, x0, y0, padL, narrow };
    if (full) start = firstSi(N);
    else keepVisible(cur.i);
  }
  // the x of a cell's left edge, or null if it is off the strip
  function colX(i) {
    const N = geo.N;
    const d = (((signedOf(N, i) - start) % N) + N) % N;
    const x = geo.x0 + d * geo.cw;
    return x > geo.x0 + geo.gw - geo.cw * 0.5 ? null : x;
  }
  function rowY(j) { return geo.y0 + (J1 - j) * geo.ch; }
  function keepVisible(i) {
    if (!geo || geo.full) return;
    const N = geo.N;
    const si = signedOf(N, i);
    let d = (((si - start) % N) + N) % N;
    if (d < 2) start = si - 2;
    else if (d > geo.cols - 3) start = si - geo.cols + 3;
  }
  function centreOn(i) {
    if (!geo || geo.full) return;
    start = signedOf(geo.N, i) - Math.floor(geo.cols / 2);
  }
  function hit(px, py) {
    if (!geo) return null;
    const { x0, y0, cw, ch, gw, gh } = geo;
    if (px < x0 || px >= x0 + gw || py < y0 || py >= y0 + gh) return null;
    const j = J1 - Math.floor((py - y0) / ch);
    const si = Math.floor(start + (px - x0) / cw);
    return { i: wrap(L, si), j: clamp(j, J0, J1) };
  }

  // ---------- drawing ----------
  function draw() {
    if (!geo) return;
    const { W, H, N, cw, ch, gw, gh, x0, y0, narrow } = geo;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const yourRing = you && you.L === L ? ringOfJ(you.j) : 0;
    // the nine rings: alternate bands behind the cells, and their numbers in the gutter
    for (let r = 1; r <= 9; r++) {
      const jLo = r === 1 ? 1 : 2 * (r - 1), jHi = r === 1 ? 1 : 2 * (r - 1) + 1;
      const yt = rowY(jHi), yb = rowY(jLo) + ch;
      if (r % 2 === 0) { g.fillStyle = 'rgba(255,217,160,.045)'; g.fillRect(x0 - (narrow ? 26 : 40), yt, gw + (narrow ? 26 : 40), yb - yt); }
      if (r > 1) { g.fillStyle = 'rgba(255,217,160,.16)'; g.fillRect(x0 - (narrow ? 26 : 40), yb - 0.5, narrow ? 20 : 32, 1); }
      g.fillStyle = r === yourRing ? C.lamp : 'rgba(169,159,144,.85)';
      g.font = '600 ' + (narrow ? 11.5 : 13) + "px 'Barlow Condensed', sans-serif";
      g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillText(String(r), x0 - (narrow ? 7 : 10), (yt + yb) / 2 + 0.5);
    }
    g.font = "600 10.5px 'Barlow Condensed', sans-serif";
    try { g.letterSpacing = '1.6px'; } catch (err) { /* older canvas */ }
    g.fillStyle = C.lamp;
    g.textAlign = 'right';
    g.textBaseline = 'alphabetic';
    g.fillText('BACK', x0 - (narrow ? 5 : 8), y0 - 8);
    g.textBaseline = 'top';
    g.fillText('FRONT', x0 - (narrow ? 5 : 8), y0 + gh + 9);
    if (!narrow) {
      g.fillStyle = 'rgba(169,159,144,.75)';
      g.textAlign = 'left';
      g.textBaseline = 'alphabetic';
      g.fillText('RINGS ONE TO NINE', x0, y0 - 8);
    }
    try { g.letterSpacing = '0px'; } catch (err) { /* older canvas */ }

    // the cells
    g.save();
    g.beginPath(); g.rect(x0, y0 - 1, gw, gh + 2); g.clip();
    const gap = cw > 9 ? 1 : 0.6;
    const r0 = Math.min(2, cw * 0.18);
    const first = Math.floor(start);
    const n = geo.full ? N : geo.cols + 2;
    const round = typeof g.roundRect === 'function';
    const ateDots = [], lit = [];
    for (let c = 0; c < n; c++) {
      const si = first + c;
      const i = wrap(L, si);
      const x = x0 + (si - start) * cw;
      for (let j = J0; j <= J1; j++) {
        const y = rowY(j);
        const k = L + ':' + i + ':' + j;
        const been = visited(k);
        if (been) { lit.push([x, y, grain(L, i, j)]); if (ateAt(flags, k)) ateDots.push([x + cw / 2, y + ch / 2]); continue; }
        g.fillStyle = 'rgba(243,237,226,' + (0.045 + grain(L, i, j) * 0.06).toFixed(3) + ')';
        g.beginPath();
        if (round) g.roundRect(x + gap, y + gap, cw - 2 * gap, ch - 2 * gap, r0); else g.rect(x + gap, y + gap, cw - 2 * gap, ch - 2 * gap);
        g.fill();
      }
    }
    // the blocks you have walked into, lit, with a little lamplight round them
    g.shadowColor = 'rgba(255,190,110,.55)';
    g.shadowBlur = Math.min(10, cw);
    for (const [x, y, t] of lit) {
      g.fillStyle = 'rgba(255,217,160,' + (0.66 + t * 0.2).toFixed(3) + ')';
      g.beginPath();
      if (round) g.roundRect(x + gap, y + gap, cw - 2 * gap, ch - 2 * gap, r0); else g.rect(x + gap, y + gap, cw - 2 * gap, ch - 2 * gap);
      g.fill();
    }
    g.shadowBlur = 0;
    g.shadowColor = 'transparent';
    // a bowl's dot where you have eaten
    g.fillStyle = C.ink;
    const dr = Math.max(1.6, Math.min(cw, ch) * 0.2);
    for (const [x, y] of ateDots) { g.beginPath(); g.arc(x, y, dr, 0, Math.PI * 2); g.fill(); }
    g.restore();

    // Candlewick, and the column of its meridian on every layer
    const mx = colX(0);
    if (mx != null) {
      g.strokeStyle = 'rgba(255,217,160,.55)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(mx + cw / 2, y0 - 5); g.lineTo(mx + cw / 2, y0 - 1); g.moveTo(mx + cw / 2, y0 + gh + 1); g.lineTo(mx + cw / 2, y0 + gh + 5); g.stroke();
    }
    if (L === HOME.L) {
      const hx = colX(HOME.i);
      if (hx != null) {
        const hy = rowY(HOME.j);
        g.strokeStyle = C.gold; g.lineWidth = 1.5;
        g.strokeRect(hx - 1.5, hy - 1.5, cw + 3, ch + 3);
        const youRight = you && you.L === L && you.j === HOME.j && signedOf(N, you.i) > signedOf(N, HOME.i);
        if (youRight) label(g, 'Candlewick', hx - 7, hy + ch / 2, 'right');
        else label(g, 'Candlewick', hx + cw + 7, hy + ch / 2, 'left');
      }
    }
    // degrees round, under the strip
    g.font = "600 11px 'Barlow Condensed', sans-serif";
    g.textBaseline = 'top';
    g.fillStyle = C.dim;
    const marks = narrow ? [[0, '0°'], [N / 4, '90°'], [-N / 4, '90°']] : [[0, '0°'], [N / 4, '90° spinward'], [-N / 4, '90° anti']];
    const at = (si) => { const d = ((((si - start) % N) + N) % N); return x0 + (d + 0.5) * cw; };
    const placed = [];
    const put = (x, t) => {
      const w = g.measureText(t).width;
      let al = 'center', cx = x;
      if (narrow && x - w / 2 < x0 + 6) return;           // the gutter's FRONT has that corner
      if (x - w / 2 < x0) { al = 'left'; cx = x0 + w / 2; }
      else if (x + w / 2 > x0 + gw) { al = 'right'; cx = x0 + gw - w / 2; }
      if (placed.some((p) => Math.abs(p - cx) < w + 16)) return;
      placed.push(cx);
      g.textAlign = al;
      g.fillText(t, al === 'left' ? x0 : al === 'right' ? x0 + gw : x, y0 + gh + 9);
    };
    for (const [si, t] of marks) put(at(si), t);
    // the far side: the seam where the strip wraps
    const seam = Math.floor(N / 2) + 1;
    const ds = ((((seam - start) % N) + N) % N);
    for (const x of [x0 + ds * cw, x0 + (ds + N) * cw]) {
      if (x < x0 - 1 || x > x0 + gw + 1) continue;
      g.strokeStyle = 'rgba(255,217,160,.35)'; g.setLineDash([2, 3]);
      g.beginPath(); g.moveTo(x, y0 - 6); g.lineTo(x, y0 + gh + 6); g.stroke(); g.setLineDash([]);
      put(x, '180°');
    }
    if (!geo.full) {
      // the strip goes on round: fade its two ends
      const fl = g.createLinearGradient(x0, 0, x0 + 18, 0);
      fl.addColorStop(0, 'rgba(20,16,12,.9)'); fl.addColorStop(1, 'rgba(20,16,12,0)');
      g.fillStyle = fl; g.fillRect(x0, y0 - 1, 18, gh + 2);
      const fr = g.createLinearGradient(x0 + gw, 0, x0 + gw - 18, 0);
      fr.addColorStop(0, 'rgba(20,16,12,.9)'); fr.addColorStop(1, 'rgba(20,16,12,0)');
      g.fillStyle = fr; g.fillRect(x0 + gw - 18, y0 - 1, 18, gh + 2);
    }
  }

  function label(g, text, x, y, align) {
    g.font = "italic 600 15px 'Cormorant Garamond', serif";
    g.textAlign = align; g.textBaseline = 'middle';
    g.lineWidth = 4; g.strokeStyle = 'rgba(20,16,12,.92)'; g.lineJoin = 'round';
    const w = g.measureText(text).width;
    if (align === 'left' && x + w > geo.x0 + geo.gw) { x -= geo.cw + 14; g.textAlign = 'right'; }
    else if (align === 'right' && x - w < geo.x0) { x += geo.cw + 14; g.textAlign = 'left'; }
    g.strokeText(text, x, y); g.fillStyle = C.gold; g.fillText(text, x, y);
  }

  // the strip of layers: one bar each, as wide as the layer is round; up (toward the axis) at the top
  function drawGauge() {
    const host = gcv.parentNode;
    const W = Math.max(10, host.clientWidth), H = Math.max(10, host.clientHeight);
    gaugeH = host.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (gcv.width !== Math.round(W * dpr) || gcv.height !== Math.round(H * dpr)) { gcv.width = Math.round(W * dpr); gcv.height = Math.round(H * dpr); }
    gcv.style.width = W + 'px'; gcv.style.height = H + 'px';
    const g = gcv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const rh = H / NL;
    const maxN = LAYERS.reduce((m, l) => Math.max(m, l.N), 1);
    const cx = W / 2 + 4, maxW = W - 22;
    for (let l = 0; l < NL; l++) {
      const ly = LAYERS[l];
      const y = H - (l + 1) * rh;
      const w = Math.max(4, (ly.N / maxN) * maxW);
      const isCur = l === L, isYou = you && you.L === l;
      const nb = visitedLayers.get(l) || 0;
      g.fillStyle = isCur ? C.gold : nb ? 'rgba(255,217,160,.7)' : ly.band === 'middle' ? 'rgba(243,237,226,.16)' : 'rgba(243,237,226,.24)';
      g.fillRect(cx - w / 2, y + rh * 0.18, w, Math.max(1, rh * 0.64));
      if (isYou) { g.fillStyle = C.lamp; g.beginPath(); g.arc(cx + w / 2 + 6, y + rh / 2, 2.6, 0, Math.PI * 2); g.fill(); }
      if (isCur) {
        g.fillStyle = C.gold;
        g.beginPath(); g.moveTo(cx - w / 2 - 9, y + rh / 2 - 4); g.lineTo(cx - w / 2 - 3, y + rh / 2); g.lineTo(cx - w / 2 - 9, y + rh / 2 + 4); g.fill();
      }
    }
  }

  // ---------- the overlays: cursor, hover, you, the pick ----------
  function placeBox(e, cell, pad) {
    const x = cell ? colX(cell.i) : null;
    if (!cell || x == null || (cell.L != null && cell.L !== L)) { e.classList.add('gr-gone'); return; }
    e.classList.remove('gr-gone');
    e.style.left = (x - pad) + 'px';
    e.style.top = (rowY(cell.j) - pad) + 'px';
    e.style.width = (geo.cw + 2 * pad) + 'px';
    e.style.height = (geo.ch + 2 * pad) + 'px';
  }
  function overlays() {
    if (!geo) return;
    placeBox(cursorEl, cur, 2);
    placeBox(hoverEl, hover && (hover.i !== cur.i || hover.j !== cur.j) ? hover : null, 1);
    placeBox(youEl, you, 0);
    placeBox(pickEl, pick, 3);
  }

  // ---------- the card ----------
  let cardKey = '';
  function showCard(cell) {
    const k = keyOf(cell.L, cell.i, cell.j);
    if (k === cardKey) return;
    cardKey = k;
    const q = infoOf(city, cell);
    clear(card);
    if (!q) { card.appendChild(h('div', 'gr-empty', 'Nobody has written this block down.')); return; }
    const isYou = you && keyOf(you.L, you.i, you.j) === k;
    const been = visited(k), ate = ateAt(flags, k);
    const status = isYou ? ['You are here', 'is-lamp'] : ate ? ['You ate here', 'is-leaf'] : been ? ['You have been here', 'is-lamp'] : q.key === keyOf(HOME.L, HOME.i, HOME.j) ? ['Your Margin flat is here', 'is-lamp'] : ['Not yet been', ''];
    const dish = Array.isArray(q.dish) ? q.dish : [String(q.dish || ''), ''];
    const rel = you ? relWords(city, you, cell) : '';
    const a = h('div', 'gr-rcard-a', [
      h('div', 'gr-kicker ' + status[1], status[0]),
      h('div', 'gr-rcard-t', q.name || ''),
      h('div', 'gr-rcard-ad', cap(q.address || '') + ' · ' + (Number(q.g) || 0).toFixed(2) + ' g'),
      h('div', 'gr-rcard-st', (q.avenue || '') + (q.street ? ' and ' + q.street : '')),
    ]);
    const b = h('div', 'gr-rcard-b', [
      h('div', 'gr-rcard-r', [h('span', 'gr-rcard-l', 'Hall'), h('span', 'gr-rcard-v', [q.hall || '', q.cook && String(q.hall || '').indexOf(q.cook) < 0 ? h('span', 'gr-rcard-c', ', cooked by ' + q.cook) : null])]),
      h('div', 'gr-rcard-r', [h('span', 'gr-rcard-l', 'Today'), h('span', 'gr-rcard-v', [cap(dish[0]), dish[1] ? h('span', 'gr-rcard-dl', dish[1]) : null])]),
    ]);
    const c = h('div', 'gr-rcard-c3', [
      q.pride ? h('div', 'gr-rcard-p', q.pride) : null,
      rel ? h('div', 'gr-rcard-rel', [iconEl('arrow'), h('span', '', 'From you: ' + rel)]) : null,
    ]);
    card.appendChild(a); card.appendChild(b); card.appendChild(c);
    live.textContent = (q.name || '') + ', ' + (q.address || '') + '. ' + status[0] + '.';
  }
  function refreshCard() { const c = hover || cur; showCard({ L, i: c.i, j: c.j }); }

  function setPick(cell) {
    pick = cell ? { L: cell.L, i: cell.i, j: cell.j } : null;
    const q = pick ? infoOf(city, pick) : null;
    const here = pick && you && keyOf(you.L, you.i, you.j) === keyOf(pick.L, pick.i, pick.j);
    goB.disabled = !q || here;
    goB.lastChild.textContent = q ? (here ? 'You are here' : q.name + ' · ' + q.address) : 'Choose a block';
    overlays();
  }

  // ---------- head ----------
  function drawHead() {
    const ly = LAYERS[L];
    title.textContent = 'Decks ' + ly.d0 + ' to ' + ly.d1;
    sub.textContent = (Number(ly.g) || 0).toFixed(2) + ' g · ' + cap(BAND_WORDS[ly.band] || '') + ' · ' + ly.N + ' blocks round';
    const nb = visitedLayers.get(L) || 0;
    const yours = you && you.L === L;
    been.textContent = yours ? (nb > 1 ? 'You are here, and have been to ' + nb + ' of its blocks' : 'You are on these decks') : nb ? 'You have been to ' + nb + (nb === 1 ? ' block' : ' blocks') + ' here' : 'You have not been on these decks';
    been.classList.toggle('is-lamp', !!(yours || nb));
    upB.disabled = L >= NL - 1;
    dnB.disabled = L <= 0;
    meB.classList.toggle('gr-gone', !you || (you.L === L && cur.i === you.i && cur.j === you.j));
  }

  // ---------- actions ----------
  function render() {
    refreshCard();
    drawHead();
    layout();
    draw();
    drawGauge();
    overlays();
  }
  function setLayer(l, sound) {
    l = clamp(l, 0, NL - 1);
    if (l === L) return;
    const a = city.above({ L, i: cur.i, j: cur.j }, l - L);
    L = l;
    cur = a ? { i: a.i, j: a.j } : { i: 0, j: cur.j };
    hover = null;
    hoverEl.classList.add('gr-gone');
    canvas.classList.remove('is-in');
    void canvas.offsetWidth;
    canvas.classList.add('is-in');
    layout();
    centreOn(cur.i);
    render();
    if (sound) ctx.sfx('page');
  }
  function step(d, sound) { setLayer(L + d, sound); }
  function moveCur(di, dj) {
    cur = { i: wrap(L, cur.i + di), j: clamp(cur.j + dj, J0, J1) };
    hover = null;
    if (geo && !geo.full) { keepVisible(cur.i); draw(); }
    overlays();
    refreshCard();
    drawHead();
    ctx.sfx('hover');
  }
  function toYou(sound) {
    you = youCell(city);
    const c = you || HOME;
    if (c.L !== L) { L = c.L; canvas.classList.remove('is-in'); void canvas.offsetWidth; canvas.classList.add('is-in'); }
    cur = { i: c.i, j: c.j };
    hover = null;
    layout();
    centreOn(cur.i);
    render();
    focusEl(gridHost);
    if (sound) ctx.sfx('page');
  }
  function choose(cell) {
    if (!chooser) { cur = { i: cell.i, j: cell.j }; overlays(); refreshCard(); drawHead(); ctx.sfx('click'); return; }
    const same = pick && pick.L === L && pick.i === cell.i && pick.j === cell.j;
    cur = { i: cell.i, j: cell.j };
    if (same) { go(); return; }
    setPick({ L, i: cell.i, j: cell.j });
    refreshCard();
    drawHead();
    ctx.sfx('click');
  }
  function go() {
    if (!pick || goB.disabled) { ctx.sfx('deny'); return; }
    if (o.onGo) o.onGo({ L: pick.L, i: pick.i, j: pick.j });
  }

  // ---------- pointer ----------
  let press = null;
  let wheelT = 0;
  gridHost.addEventListener('pointerdown', (e) => {
    const r = gridHost.getBoundingClientRect();
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, start, moved: false, px: e.clientX - r.left, py: e.clientY - r.top };
    try { gridHost.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  gridHost.addEventListener('pointermove', (e) => {
    const r = gridHost.getBoundingClientRect();
    if (press && press.id === e.pointerId) {
      const dx = e.clientX - press.x;
      if (Math.abs(dx) > 5 || Math.abs(e.clientY - press.y) > 5) press.moved = true;
      if (press.moved && geo && !geo.full) {
        start = press.start - dx / geo.cw;
        gridHost.classList.add('is-drag');
        draw(); overlays();
        return;
      }
    }
    if (e.pointerType === 'touch') return;
    const c = hit(e.clientX - r.left, e.clientY - r.top);
    if (!c) { if (hover) { hover = null; overlays(); refreshCard(); } return; }
    if (hover && hover.i === c.i && hover.j === c.j) return;
    hover = c;
    overlays();
    refreshCard();
  });
  const release = (e) => {
    if (!press || press.id !== e.pointerId) return;
    const p = press;
    press = null;
    gridHost.classList.remove('is-drag');
    if (p.moved || e.type === 'pointercancel') return;
    const c = hit(p.px, p.py);
    if (c) choose(c);
    focusEl(gridHost);
  };
  gridHost.addEventListener('pointerup', release);
  gridHost.addEventListener('pointercancel', release);
  gridHost.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch' && hover) { hover = null; overlays(); refreshCard(); } });
  gridHost.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (geo && !geo.full && Math.abs(e.deltaX) > Math.abs(e.deltaY)) { start += e.deltaX / geo.cw; draw(); overlays(); return; }
    const now = performance.now();
    if (Math.abs(e.deltaY) > 20 && now - wheelT > 220) { wheelT = now; step(e.deltaY < 0 ? 1 : -1, true); }
  }, { passive: false });
  gridHost.addEventListener('focus', () => gridHost.classList.add('is-focus'));
  gridHost.addEventListener('blur', () => gridHost.classList.remove('is-focus'));

  let gPress = false;
  const gaugeAt = (e) => {
    const r = gcv.getBoundingClientRect();
    const t = clamp((e.clientY - r.top) / Math.max(1, r.height), 0, 0.9999);
    setLayer(NL - 1 - Math.floor(t * NL), true);
  };
  gauge.addEventListener('pointerdown', (e) => { gPress = true; try { gauge.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } gaugeAt(e); });
  gauge.addEventListener('pointermove', (e) => { if (gPress) gaugeAt(e); });
  gauge.addEventListener('pointerup', () => { gPress = false; });
  gauge.addEventListener('pointercancel', () => { gPress = false; });

  // ---------- keys (the map passes them on while this view is showing) ----------
  function key(e) {
    const k = e.key;
    const onGrid = document.activeElement === gridHost;
    if (k === 'PageUp' || (e.shiftKey && k === 'ArrowUp') || k === ']') { e.preventDefault(); step(1, true); return true; }
    if (k === 'PageDown' || (e.shiftKey && k === 'ArrowDown') || k === '[') { e.preventDefault(); step(-1, true); return true; }
    if (k === 'Home' || isKey(e, 'c') || k === '0') { e.preventDefault(); toYou(true); return true; }
    if (!onGrid) {
      if (k.indexOf('Arrow') === 0) { e.preventDefault(); focusEl(gridHost); return true; }
      return false;
    }
    if (k === 'ArrowLeft' || isKey(e, 'a')) { e.preventDefault(); moveCur(-1, 0); return true; }
    if (k === 'ArrowRight' || isKey(e, 'd')) { e.preventDefault(); moveCur(1, 0); return true; }
    if (k === 'ArrowUp' || isKey(e, 'w')) { e.preventDefault(); moveCur(0, 1); return true; }
    if (k === 'ArrowDown' || isKey(e, 's')) { e.preventDefault(); moveCur(0, -1); return true; }
    if (isKey(e, 'Enter', ' ', 'e')) { e.preventDefault(); if (!e.repeat) choose({ i: cur.i, j: cur.j }); return true; }
    return false;
  }

  function refresh() {
    flags = G.flags() || {};
    you = youCell(city);
    readVisited();
    cardKey = '';
    render();
  }

  readVisited();
  if (chooser) setPick(null);
  let roT = 0, lastW = 0, lastH = 0;
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => {
      const w = gridHost.clientWidth, hh = gridHost.clientHeight;
      if (!geo || (w === lastW && hh === lastH && gcv.parentNode.clientHeight === gaugeH)) return;
      lastW = w; lastH = hh;
      cancelAnimationFrame(roT);
      roT = requestAnimationFrame(() => { if (el.isConnected) { layout(); draw(); drawGauge(); overlays(); } });
    });
    ro.observe(gridHost);
    ro.observe(gcv.parentNode);
  }
  let gaugeH = 0;

  return {
    el,
    grid: gridHost,
    show() { refresh(); if (geo && !geo.full) { centreOn(cur.i); draw(); overlays(); } },
    resize() { if (el.isConnected && el.offsetParent) render(); },
    refresh,
    key,
    focus() { focusEl(gridHost); },
    goTo(cell) { if (!cell || !LAYERS[cell.L]) return; L = cell.L; cur = { i: wrap(L, cell.i), j: clamp(cell.j, J0, J1) }; layout(); centreOn(cur.i); render(); },
    get layer() { return L; },
    cellKey: () => cellKeyOf({ L, i: cur.i, j: cur.j }),
  };
}
