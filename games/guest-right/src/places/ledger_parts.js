// Parts shared by the Station Ring 2 places on the south side of the glide platform (the Ledger hall, the guest desk,
// the ring counter, the Quaysides lane and the Gate): painted boards, a few props, seats and small helpers.
import { defineProp } from '../world/props.js';
import { SIGNS } from '../content/signs.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';

export const ledgerParts = true;

export const SERIF = "'Cormorant Garamond', Georgia, serif";
export const CAPS = "'Barlow Condensed', 'Arial Narrow', sans-serif";
export const SANS = "'Barlow', Arial, sans-serif";
export const HAND = "'Caveat', 'Segoe Script', cursive";

// A sign spec from content/signs.js. Plates and labels are painted from text + lines, so a `sub` becomes a line.
export function spec(id, extra) {
  const b = SIGNS[id];
  const o = Object.assign({}, b || { kind: 'notice', title: id }, extra || {});
  if (o.sub && (o.kind === 'plate' || o.kind === 'label') && !o.lines) o.lines = [o.sub];
  return o;
}

// Commas in a whole number: 194060000 -> '194,060,000'.
export function num(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

// Say something safely, with the game's busy count held.
export async function tell(game, speaker, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(speaker, lines); } finally { game.busy--; }
}
export function found(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
export function flags(game) { return game.flags || (game.flags = {}); }

// ---------- painted rects ----------
// Reserve a rect of the sign atlas (ppm pixels a metre), paint it with draw(ctx, w, h) and set a quad on it facing `face`,
// centred on (x, y, z), as sign() does. Returns the atlas rect (keep it to redraw a changing board).
export function painted(s, key, wM, hM, ppm, draw, x, y, z, o = {}) {
  const atlas = s.world.game && s.world.game.atlas; if (!atlas) return null;
  const r = atlas.add(Math.round(wM * ppm), Math.round(hM * ppm), draw, key);
  quadOn(s, r, wM, hM, x, y, z, o);
  return r;
}
export function quadOn(s, r, w, h, x, y, z, o = {}) {
  const g = s.g, f = o.face || 'Z';
  const nx = f === 'X' ? 1 : f === 'x' ? -1 : 0, nz = f === 'Z' ? 1 : f === 'z' ? -1 : 0;
  const rx = nz, rz = -nx; const off = o.off === undefined ? 0.003 : o.off;
  const cx = x + nx * off, cz = z + nz * off;
  g.atlas(r.page, { emissive: o.glow || 0, lamp: !!o.glow, rough: o.rough });
  if (o.cutout) g._mat[2] |= 16;
  g.quad([cx - rx * w / 2, y - h / 2, cz - rz * w / 2], [cx + rx * w / 2, y - h / 2, cz + rz * w / 2], [cx + rx * w / 2, y + h / 2, cz + rz * w / 2], [cx - rx * w / 2, y + h / 2, cz - rz * w / 2], { uv: [r.u0, r.v1, r.u1, r.v0] });
  s.flush({ tier: o.tier || 's', level: o.level });
}

function fit(ctx, text, font, size, maxW, min = 6) {
  let sz = size; ctx.font = font.replace('$', sz);
  while (sz > min && ctx.measureText(text).width > maxW) { sz -= 1; ctx.font = font.replace('$', sz); }
  return sz;
}
function grain(ctx, w, h, seed, amt, n) {
  const r = new Rng(seed);
  for (let i = 0; i < n; i++) { ctx.fillStyle = r.chance(0.5) ? 'rgba(255,255,255,' + (amt * r.next()).toFixed(3) + ')' : 'rgba(0,0,0,' + (amt * r.next()).toFixed(3) + ')'; ctx.fillRect(r.f(0, w), r.f(0, h), r.f(1, 10), r.f(0.5, 2)); }
}

// ---------- the flap board ----------
const TILE = ['#16191a', '#191d1d', '#141718', '#1a1c1b'];
// One row of flap tiles, a character to a tile, left edge x, top y, cell cw x ch.
export function flaps(ctx, text, x, y, cw, ch, ink, seed) {
  const chars = Array.from(text); const r = new Rng(seed || 7);
  const fs = Math.round(ch * 0.74);
  ctx.font = '600 ' + fs + 'px ' + CAPS; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i], tx = x + i * cw;
    if (c === ',' || c === '.') { ctx.fillStyle = ink; ctx.fillText(c, tx + cw * 0.5, y + ch * 0.62); continue; }
    ctx.fillStyle = TILE[r.i(0, 3)]; ctx.fillRect(tx + cw * 0.06, y, cw * 0.88, ch);
    ctx.fillStyle = ink; ctx.fillText(c, tx + cw / 2, y + ch * 0.54);
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(tx + cw * 0.06, y + ch * 0.5 - 0.6, cw * 0.88, 1.4);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(tx + cw * 0.06, y, cw * 0.88, ch * 0.06);
  }
}
// A strip of flap panels across a width, with text set in them (names).
function strip(ctx, x, y, w, h, seed) {
  const r = new Rng(seed); const n = Math.max(1, Math.round(w / (h * 0.62)));
  for (let i = 0; i < n; i++) { ctx.fillStyle = TILE[r.i(0, 3)]; ctx.fillRect(x + i * w / n + 0.6, y, w / n - 1.2, h); }
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x, y + h * 0.5 - 0.5, w, 1);
}

// A figure cell: a label, a big value in flap tiles, a line beneath. o: { hot (amber), text (value is words, not digits) }
export function drawFigure(label, value, sub, o = {}) {
  return (ctx, w, h) => {
    ctx.fillStyle = '#0e1312'; ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, hashStr(label), 0.035, 140);
    const ink = o.hot ? '#ffc35a' : '#f1e6cc', lab = o.hot ? '#ffcf7a' : '#d9c9a0';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = lab; const ls = fit(ctx, label, '600 $px ' + CAPS, h * 0.14, w * 0.9); void ls; ctx.fillText(label, w / 2, h * 0.13);
    ctx.fillStyle = o.hot ? '#b07a2a' : '#6d6450'; ctx.fillRect(w * 0.08, h * 0.24, w * 0.84, 1.5);
    if (o.text) {
      const words = String(value).split(' / ');
      words.forEach((wd, i) => { ctx.fillStyle = ink; fit(ctx, wd, 'italic 600 $px ' + SERIF, h * 0.2, w * 0.9); ctx.fillText(wd, w / 2, h * (0.44 + i * 0.2)); });
    } else {
      const n = Array.from(value).length; const cw = Math.min(w * 0.92 / n, h * 0.2), ch = Math.min(cw * 1.7, h * 0.4);
      flaps(ctx, value, (w - cw * n) / 2, h * 0.32, cw, ch, ink, hashStr(label + value));
    }
    if (sub) { ctx.fillStyle = o.hot ? '#e8b062' : '#b3a888'; fit(ctx, sub, '500 $px ' + CAPS, h * 0.1, w * 0.92); ctx.textAlign = 'center'; ctx.fillText(sub, w / 2, h * 0.86); }
  };
}

// A column of names: a header, then rows [{ a, b, hot, dim }] as flap strips, the first name in caps, the second in italic.
export function drawNames(header, sub, rows, o = {}) {
  return (ctx, w, h) => {
    ctx.fillStyle = '#0e1312'; ctx.fillRect(0, 0, w, h);
    const hh = h * 0.1;
    ctx.fillStyle = o.band || '#1d2a2a'; ctx.fillRect(0, 0, w, hh);
    ctx.fillStyle = o.head || '#f1e6cc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    fit(ctx, header, '600 $px ' + CAPS, hh * 0.56, w * 0.9); ctx.fillText(header, w / 2, hh * 0.42);
    if (sub) { ctx.fillStyle = o.subInk || '#a99f8a'; fit(ctx, sub, 'italic 500 $px ' + SERIF, hh * 0.32, w * 0.9); ctx.fillText(sub, w / 2, hh * 0.82); }
    const n = o.rows || 16; const top = hh + h * 0.02, lh = (h - top - h * 0.01) / n;
    for (let i = 0; i < n; i++) {
      const y = top + i * lh; strip(ctx, w * 0.03, y + lh * 0.08, w * 0.94, lh * 0.84, hashStr(header) + i * 31);
      const rw = rows[i]; if (!rw) continue;
      ctx.textBaseline = 'middle';
      const ink = rw.hot ? '#ffc35a' : rw.dim ? '#9c9482' : '#f1e6cc';
      ctx.textAlign = 'left'; ctx.fillStyle = ink; fit(ctx, rw.a.toUpperCase(), '600 $px ' + CAPS, lh * 0.56, w * 0.5); ctx.fillText(rw.a.toUpperCase(), w * 0.06, y + lh * 0.52);
      if (rw.b) { ctx.textAlign = 'right'; ctx.fillStyle = rw.hot ? '#f2c27a' : '#c9bea4'; fit(ctx, rw.b, 'italic 600 $px ' + SERIF, lh * 0.62, w * 0.42); ctx.fillText(rw.b, w * 0.95, y + lh * 0.5); }
    }
  };
}

// Candlewick's own column: the block against its births, deaths and room, and its neighbours on Ring Two.
export function drawBlocks(blk, others) {
  return (ctx, w, h) => {
    ctx.fillStyle = '#120f0c'; ctx.fillRect(0, 0, w, h);
    const hh = h * 0.12; ctx.fillStyle = '#9e3d22'; ctx.fillRect(0, 0, w, hh);
    ctx.fillStyle = '#ffe9c2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    fit(ctx, 'CANDLEWICK', '600 $px ' + CAPS, hh * 0.6, w * 0.9); ctx.fillText('CANDLEWICK', w / 2, hh * 0.4);
    fit(ctx, 'your block, Ring Two, decks 16 to 21', 'italic 500 $px ' + SERIF, hh * 0.3, w * 0.9); ctx.fillText('your block, Ring Two, decks 16 to 21', w / 2, hh * 0.8);
    const rows = [['PEOPLE', num(blk.people)], ['BORN THIS YEAR', String(blk.born)], ['DIED THIS YEAR', String(blk.died)], ['ROOM FOR THIRDS', String(blk.room)], ['THIRDS GIVEN', String(blk.thirdsGiven)]];
    let y = hh + h * 0.03; const lh = h * 0.075;
    rows.forEach((rw, i) => {
      ctx.textAlign = 'left'; ctx.fillStyle = '#e9d9b6'; fit(ctx, rw[0], '600 $px ' + CAPS, lh * 0.5, w * 0.5); ctx.fillText(rw[0], w * 0.06, y + lh * 0.5);
      const cw = Math.min(lh * 0.62, w * 0.07); flaps(ctx, rw[1], w * 0.94 - cw * rw[1].length, y + lh * 0.1, cw, lh * 0.8, i === 4 ? '#ffc35a' : '#f1e6cc', 11 + i);
      y += lh;
    });
    y += h * 0.02; ctx.fillStyle = '#7a4a2a'; ctx.fillRect(w * 0.06, y, w * 0.88, 1.5); y += h * 0.02;
    ctx.fillStyle = '#d9c9a0'; ctx.textAlign = 'center'; fit(ctx, 'RING TWO BLOCKS · BORN · DIED · ROOM', '600 $px ' + CAPS, h * 0.032, w * 0.9); ctx.fillText('RING TWO BLOCKS · BORN · DIED · ROOM', w / 2, y + h * 0.02); y += h * 0.05;
    const bl = h * 0.052;
    for (const b of others) {
      const me = b[0] === 'Candlewick';
      if (me) { ctx.fillStyle = 'rgba(158,61,34,0.45)'; ctx.fillRect(w * 0.03, y, w * 0.94, bl); }
      ctx.fillStyle = me ? '#ffd28a' : '#cfc3a6'; ctx.textAlign = 'left'; fit(ctx, b[0].toUpperCase(), '600 $px ' + CAPS, bl * 0.6, w * 0.4); ctx.fillText(b[0].toUpperCase(), w * 0.06, y + bl * 0.52);
      ctx.textAlign = 'right'; const t = b[1] + '   ' + b[2] + '   ' + b[3]; fit(ctx, t, '600 $px ' + CAPS, bl * 0.6, w * 0.45); ctx.fillText(t, w * 0.94, y + bl * 0.52);
      y += bl;
    }
    y += h * 0.015; ctx.fillStyle = '#7a4a2a'; ctx.fillRect(w * 0.06, y, w * 0.88, 1.5); y += h * 0.03;
    ctx.fillStyle = '#e9d9b6'; ctx.textAlign = 'center'; fit(ctx, 'HOLDS · AFTER', '600 $px ' + CAPS, h * 0.032, w * 0.9); ctx.fillText('HOLDS · AFTER', w / 2, y); y += h * 0.04;
    const tail = [['Marit Vell', 'Aurel Vell, two years'], ['Imre Saltash', 'Odile Saltash'], ['Bel Corrie', 'Hollis Corrie']];
    for (const t of tail) {
      ctx.textAlign = 'left'; ctx.fillStyle = '#f1e6cc'; fit(ctx, t[0].toUpperCase(), '600 $px ' + CAPS, h * 0.03, w * 0.48); ctx.fillText(t[0].toUpperCase(), w * 0.06, y);
      ctx.textAlign = 'right'; ctx.fillStyle = '#c9bea4'; fit(ctx, t[1], 'italic 600 $px ' + SERIF, h * 0.032, w * 0.44); ctx.fillText(t[1], w * 0.94, y); y += h * 0.045;
    }
  };
}

// The old Count board: dead, dusty, a few flaps hanging crooked, its last figure still up.
export function drawCount() {
  return (ctx, w, h) => {
    ctx.fillStyle = '#1e241f'; ctx.fillRect(0, 0, w, h);
    const r = new Rng(340);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#b8ad8e'; fit(ctx, 'THE COUNT', '600 $px ' + CAPS, h * 0.12, w * 0.8); ctx.fillText('THE COUNT', w / 2, h * 0.1);
    ctx.fillStyle = '#6a6452'; ctx.fillRect(w * 0.08, h * 0.18, w * 0.84, 1.5);
    const rows = [['PEOPLE OVER SHARES', ''], ['BIRTHS THIS YEAR', 'NONE'], ['PERMITS ISSUED', 'NONE']];
    rows.forEach((rw, i) => { const y = h * (0.26 + i * 0.1); ctx.textAlign = 'left'; ctx.fillStyle = '#a39a7e'; fit(ctx, rw[0], '600 $px ' + CAPS, h * 0.06, w * 0.5); ctx.fillText(rw[0], w * 0.08, y); if (rw[1]) { const cw = h * 0.055; flaps(ctx, rw[1], w * 0.92 - cw * rw[1].length, y - h * 0.04, cw, h * 0.08, '#c9bfa0', 50 + i); } });
    ctx.textAlign = 'center'; ctx.fillStyle = '#a39a7e'; fit(ctx, 'UNDER PAR', '600 $px ' + CAPS, h * 0.07, w * 0.8); ctx.fillText('UNDER PAR', w / 2, h * 0.6);
    const v = '6,000,000'; const cw = w * 0.085; flaps(ctx, v, (w - cw * v.length) / 2, h * 0.67, cw, h * 0.22, '#e0d4b0', 341);
    // dust, a crooked flap, a missing one
    ctx.save(); ctx.translate(w * 0.71, h * 0.37); ctx.rotate(0.22); ctx.fillStyle = '#2a2e28'; ctx.fillRect(-w * 0.03, -h * 0.04, w * 0.06, h * 0.08); ctx.restore();
    for (let i = 0; i < 1400; i++) { ctx.fillStyle = 'rgba(200,190,160,' + (0.03 + 0.07 * r.next()).toFixed(3) + ')'; ctx.fillRect(r.f(0, w), r.f(0, h) * r.f(0.2, 1), r.f(1, 4), r.f(1, 3)); }
    const gr = ctx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(190,180,150,0.22)'); gr.addColorStop(0.5, 'rgba(190,180,150,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
  };
}

// An engraved brass plate with a heading and running lines.
export function drawPlate(title, lines, o = {}) {
  return (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, o.a || '#b8914c'); g.addColorStop(0.5, o.b || '#dcbc7c'); g.addColorStop(1, o.c || '#a8823f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); grain(ctx, w, h, hashStr(title), 0.06, 200);
    ctx.strokeStyle = 'rgba(60,40,10,0.6)'; ctx.lineWidth = Math.max(1, h * 0.012); ctx.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
    ctx.fillStyle = o.ink || '#33260f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const n = lines.length; const th = h * (o.titleK || 0.16), lh = (h * 0.8 - th) / Math.max(1, n);
    fit(ctx, title, '600 $px ' + CAPS, th * 0.72, w * 0.86); ctx.fillText(title, w / 2, h * 0.1 + th * 0.5);
    lines.forEach((ln, i) => { fit(ctx, ln, (o.italic ? 'italic 600 $px ' : '500 $px ') + SERIF, lh * 0.74, w * 0.88); ctx.fillText(ln, w / 2, h * 0.1 + th + lh * (i + 0.5)); });
    for (const p of [[0.03, 0.08], [0.97, 0.08], [0.03, 0.92], [0.97, 0.92]]) { ctx.fillStyle = '#6e5222'; ctx.beginPath(); ctx.arc(w * p[0], h * p[1], Math.max(2, h * 0.025), 0, 7); ctx.fill(); }
  };
}

// The Ledger's title band: the name between rules, with the drum and the ring either side.
export function drawTitle(left, title, right) {
  return (ctx, w, h) => {
    ctx.fillStyle = '#0e1312'; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e8c477'; fit(ctx, title, 'italic 600 $px ' + SERIF, h * 0.8, w * 0.4); const tw = ctx.measureText(title).width; ctx.fillText(title, w / 2, h * 0.5);
    ctx.fillStyle = '#a8823f'; ctx.fillRect(w * 0.04, h * 0.5, w / 2 - tw / 2 - w * 0.06, 2); ctx.fillRect(w / 2 + tw / 2 + w * 0.02, h * 0.5, w / 2 - tw / 2 - w * 0.06, 2);
    ctx.fillStyle = '#d9c9a0'; fit(ctx, left, '600 $px ' + CAPS, h * 0.26, w * 0.24); ctx.fillText(left, w * 0.17, h * 0.3); fit(ctx, right, '600 $px ' + CAPS, h * 0.26, w * 0.24); ctx.fillText(right, w * 0.83, h * 0.3);
  };
}

// A hand-drawn map of Candlewick for the guest desk wall.
export function drawMap() {
  return (ctx, w, h) => {
    ctx.fillStyle = '#efe4c9'; ctx.fillRect(0, 0, w, h); grain(ctx, w, h, 99, 0.05, 300);
    const X = (x) => w * (0.5 + x / 260), Y = (z) => h * (0.42 + z / 170);
    ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2;
    ctx.fillStyle = '#c9d6b0'; ctx.fillRect(X(-28), Y(-14), X(28) - X(-28), Y(20) - Y(-14)); ctx.strokeRect(X(-28), Y(-14), X(28) - X(-28), Y(20) - Y(-14));
    ctx.fillStyle = '#e2b77a'; ctx.fillRect(X(-62), Y(-27.5), X(62) - X(-62), Y(-14) - Y(-27.5)); ctx.strokeRect(X(-62), Y(-27.5), X(62) - X(-62), Y(-14) - Y(-27.5));
    ctx.fillStyle = '#d8cdb4'; ctx.fillRect(X(-110), Y(-4), X(110) - X(-110), Y(4) - Y(-4)); ctx.fillRect(X(-3), Y(20), X(3) - X(-3), Y(80) - Y(20));
    ctx.fillStyle = '#9fc0c8'; ctx.fillRect(X(-104), Y(-40), X(-68) - X(-104), Y(-4) - Y(-40)); ctx.strokeRect(X(-104), Y(-40), X(-68) - X(-104), Y(-4) - Y(-40));
    ctx.fillStyle = '#e7c6a8'; ctx.fillRect(X(42), Y(4), X(100) - X(42), Y(36) - Y(4)); ctx.strokeRect(X(42), Y(4), X(100) - X(42), Y(36) - Y(4));
    ctx.fillStyle = '#2a2018'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lab = (t, x, z, s) => { ctx.font = '600 ' + Math.round(h * (s || 0.04)) + 'px ' + HAND; ctx.fillText(t, X(x), Y(z)); };
    lab('Wick Court', 0, 3, 0.05); lab('the long table', 0, -21, 0.045); lab('Ladle Row', 80, 0); lab('Ladle Row', -86, 0); lab('Thread St', 0, 60); lab('baths', -86, -22); lab('school', 71, 20);
    ctx.fillStyle = '#b5532e'; ctx.beginPath(); ctx.arc(X(9), Y(26), h * 0.018, 0, 7); ctx.fill(); lab('your flat, deck 19', 30, 34, 0.04);
    ctx.font = '600 ' + Math.round(h * 0.07) + 'px ' + HAND; ctx.fillText('Candlewick', w / 2, h * 0.08);
    ctx.font = '500 ' + Math.round(h * 0.035) + 'px ' + HAND; ctx.fillText('straight up from the station, deck 16 · cabs on deck 4', w / 2, h * 0.93);
    ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = w * 0.012; ctx.strokeRect(0, 0, w, h);
  };
}

// A slate in chalk: the day's title, a rule, the lines in coloured chalk.
export function drawChalk(sp) {
  return (ctx, w, h) => {
    ctx.fillStyle = '#20262a'; ctx.fillRect(0, 0, w, h);
    const r = new Rng(91);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.012 + 0.03 * r.next()).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(r.f(0, w), r.f(0, h), r.f(10, 60), r.f(4, 16), r.f(0, 3), 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#6b4a2f'; ctx.lineWidth = w * 0.05; ctx.strokeRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f4e9c9'; ctx.font = '600 ' + Math.round(h * 0.11) + 'px ' + HAND; ctx.fillText(sp.title || '', w / 2, h * 0.13);
    ctx.fillRect(w * 0.2, h * 0.21, w * 0.6, 1.5);
    const cols = ['#f1ede2', '#f6d27a', '#a9d8c8', '#f2a48f']; const lines = sp.lines || []; const lh = h * 0.68 / Math.max(1, lines.length);
    lines.forEach((ln, i) => { ctx.fillStyle = cols[i % cols.length]; let sz = Math.round(lh * 0.6); ctx.font = '500 ' + sz + 'px ' + HAND; while (sz > 8 && ctx.measureText(ln).width > w * 0.84) { sz--; ctx.font = '500 ' + sz + 'px ' + HAND; } ctx.fillText(ln, w / 2, h * 0.28 + lh * (i + 0.5)); });
  };
}

// ---------- seats ----------
// A seat the player can use: sit, and stand again from the same place. (x, y, z) the floor under the seat, seatH its height.
export function seatHere(s, x, y, z, yaw, prompt, seatH = 0.46) {
  const seat = { x, y, z, yaw, eye: 1.12 + (seatH - 0.46) };
  const fx = Math.sin(yaw), fz = -Math.cos(yaw);
  s.interact({
    pos: (game) => (game.player.seat === seat ? [x + fx * 0.7, y + 1.1, z + fz * 0.7] : [x, y + seatH + 0.1, z]),
    x, y: y + seatH + 0.1, z, radius: 1.3,
    prompt: (game) => (game.player.seat === seat ? 'Stand up' : prompt),
    onUse(game) { if (game.player.seat === seat) game.player.stand(); else { game.player.sit(seat); game.player.yaw = yaw; } },
  });
  return seat;
}

// ---------- strings of bulbs ----------
// A sagging cord of small warm bulbs between two points (glowing faces only; add real lights separately).
export function bulbs(s, a, b, o = {}) {
  const g = s.g, len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = o.n || Math.max(4, Math.round(len / 0.55)), sag = o.sag === undefined ? len * 0.05 : o.sag;
  const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const line = []; for (let i = 0; i <= 14; i++) line.push(P(i / 14));
  g.mat('brushed', '#2a2622'); g.tube(line, 0.006, { segs: 4, caps: false });
  const cols = o.colors || ['#ffd9a0'];
  for (let i = 0; i < n; i++) {
    const p = P((i + 0.5) / n); const c = cols[i % cols.length];
    g.mat('diffuser', c, { emissive: o.glow || 4, lamp: true }); g.ball(p[0], p[1] - 0.06, p[2], 0.024, 0.032, 0.024, { segs: 6, rings: 4 });
    g.mat('brushed', '#2a2622'); g.cyl(p[0], p[1] - 0.035, p[2], 0.012, 0.03, { segs: 5 });
  }
  return s.flush({ tier: 'd', cast: false, level: o.level });
}

// ---------- props ----------
// A tea urn on a two-shelf trolley, with lidded cups and a stack of saucers. Front toward +z.
defineProp('station.urnTrolley', (g) => {
  g.mat('wood', '#6a4a30', { rough: -0.05 });
  for (const yy of [0.18, 0.78]) g.box(-0.45, yy, -0.28, 0.45, yy + 0.03, 0.28, { bevel: 0.01 });
  g.mat('cast', '#3a3632');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.42, 0.06, sz * 0.25], [sx * 0.42, 0.82, sz * 0.25]], 0.014, { segs: 6 });
  g.tube([[-0.42, 0.95, -0.25], [-0.5, 0.95, -0.25], [-0.5, 0.95, 0.25], [-0.42, 0.95, 0.25]], 0.014, { segs: 6 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.mat('plain', '#1e1c1a'); g.ball(sx * 0.42, 0.045, sz * 0.25, 0.04, 0.04, 0.02, { segs: 8, rings: 5 }); }
  g.mat('cast', '#b08a45', { rough: -0.2 });
  g.lathe(-0.12, 0, [[0.0, 0.81], [0.15, 0.81], [0.17, 0.86], [0.17, 1.2], [0.15, 1.26], [0.06, 1.3], [0.05, 1.34], [0.07, 1.36], [0, 1.37]], { segs: 18 });
  g.tube([[-0.12, 0.92, 0.16], [-0.12, 0.92, 0.22], [-0.12, 0.88, 0.24]], 0.012, { segs: 6 });
  for (const sx of [-1, 1]) g.tube([[-0.12 + sx * 0.17, 1.1, 0], [-0.12 + sx * 0.22, 1.12, 0], [-0.12 + sx * 0.22, 1.2, 0], [-0.12 + sx * 0.17, 1.22, 0]], 0.008, { segs: 5 });
  g.mat('glaze', '#e7dfcf');
  for (let i = 0; i < 6; i++) { const x = 0.16 + (i % 3) * 0.1, z = -0.1 + Math.floor(i / 3) * 0.12; g.lathe(x, z, [[0, 0.81], [0.026, 0.81], [0.036, 0.823], [0.04, 0.89], [0.043, 0.89], [0.012, 0.905], [0, 0.91]], { segs: 10 }); }
  g.mat('glaze', '#e7dfcf'); for (let i = 0; i < 5; i++) g.cyl(0.3, 0.21 + i * 0.012, 0.1, 0.075, 0.01, { segs: 12 });
  g.mat('weave', '#a8392e'); g.box(-0.4, 0.21, -0.22, 0.1, 0.24, 0.12, { bevel: 0.005 });
  return { solid: [[-0.5, 0, -0.3, 0.45, 0.95, 0.3]], tier: 'd' };
});

// A small steel hand bell on a turned wooden stand.
defineProp('station.bell', (g) => {
  g.mat('wood', '#4a3020'); g.lathe(0, 0, [[0, 0], [0.06, 0], [0.065, 0.012], [0.05, 0.022], [0, 0.024]], { segs: 14 });
  g.mat('cast', '#c9cbc6', { rough: -0.3, shade: 'metal' });
  g.lathe(0, 0, [[0.055, 0.024], [0.05, 0.032], [0.036, 0.06], [0.028, 0.09], [0.022, 0.1], [0, 0.105]], { segs: 16 });
  g.mat('wood', '#2a1c14'); g.lathe(0, 0, [[0.01, 0.1], [0.012, 0.13], [0.02, 0.15], [0.016, 0.17], [0, 0.175]], { segs: 8 });
  return { cast: false };
});

// A stack of big leather-bound ledgers. p: { n, seed }
defineProp('station.ledgers', (g, p) => {
  const r = new Rng(hashStr('ledg' + (p.seed || 0))); const cols = ['#6b2a22', '#2a3a5c', '#3e4a2a', '#5a3a22', '#1e2a2a'];
  let y = 0;
  for (let i = 0; i < (p.n || 4); i++) {
    const t = r.f(0.04, 0.07), w = r.f(0.3, 0.38), d = r.f(0.22, 0.27), a = r.f(-0.15, 0.15);
    g.at(r.f(-0.02, 0.02), y, r.f(-0.02, 0.02), a);
    g.mat('leather', cols[r.i(0, cols.length - 1)]); g.box(-w / 2, 0, -d / 2, w / 2, t, d / 2, { bevel: 0.006 });
    g.mat('paper', '#e8dcc0'); g.box(-w / 2 + 0.01, 0.005, -d / 2 + 0.006, w / 2 - 0.006, t - 0.005, d / 2 + 0.002, { faces: 'XzZ' });
    g.pop(); y += t;
  }
  return { cast: false };
});

// An open ledger lying on a desk, with a ribbon.
defineProp('station.openBook', (g, p) => {
  const w = p.w || 0.5, d = p.d || 0.34;
  g.mat('leather', p.cover || '#4a2a20'); g.box(-w / 2 - 0.01, 0, -d / 2 - 0.01, w / 2 + 0.01, 0.012, d / 2 + 0.01, { bevel: 0.004 });
  g.mat('paper', '#efe5cc');
  for (const sx of [-1, 1]) { g.at(sx * w / 4, 0.012, 0, 0); g.rotZ(-sx * 0.05); g.box(-w / 4 + 0.004, 0, -d / 2, w / 4 - 0.004, 0.02, d / 2, { bevel: 0.003 }); g.pop(); }
  g.mat('weave', '#b5532e'); g.box(-0.005, 0.03, -d / 2 - 0.06, 0.005, 0.032, d / 2 - 0.05);
  // ruled lines in ink
  g.mat('plain', '#5a4a3a'); for (let i = 0; i < 9; i++) for (const sx of [-1, 1]) g.box(sx * w / 4 - w / 5.2, 0.0335 + 0.001 * sx * 0, -d / 2 + 0.04 + i * 0.03, sx * w / 4 + w / 5.2 * (i % 3 === 2 ? 0.4 : 1), 0.0345, -d / 2 + 0.043 + i * 0.03, { faces: 'Y' });
  return { cast: false };
});

// A banker's desk lamp with a coloured glass shade (the light is added by the caller). p: { shade }
defineProp('station.deskLamp', (g, p) => {
  g.mat('cast', '#b08a45', { rough: -0.2 });
  g.lathe(0, 0, [[0.08, 0], [0.08, 0.015], [0.03, 0.03], [0.012, 0.04], [0.012, 0.3], [0.02, 0.31], [0, 0.315]], { segs: 14 });
  g.tube([[0, 0.3, 0], [0, 0.33, 0.04]], 0.008, { segs: 5 });
  g.mat('diffuser', p.shade || '#2f7a4a', { emissive: 1.4, lamp: true });
  g.at(0, 0.36, 0.05, 0); g.scale(1, 1, 1);
  g.lathe(0, 0, [[0.03, -0.03], [0.13, -0.025], [0.14, -0.02], [0.13, 0.0], [0.05, 0.05], [0.0, 0.055]], { segs: 16 });
  g.pop();
  return { cast: false };
});

// A handcart: a slatted bed on two wheels, a handle, two little legs. Front toward +z.
defineProp('station.handcart', (g, p) => {
  const w = 0.7, l = 1.3;
  g.mat('wood', p.wood || '#8a6a44', { rough: 0.1 });
  for (let i = 0; i < 6; i++) { const x = -w / 2 + (i + 0.5) * w / 6; g.box(x - w / 14, 0.42, -l / 2, x + w / 14 - 0.008, 0.45, l / 2, { bevel: 0.004 }); }
  g.mat('cast', p.metal || '#2f5a5a');
  for (const sx of [-1, 1]) { g.box(sx * w / 2 - 0.03, 0.38, -l / 2, sx * w / 2, 0.42, l / 2); g.tube([[sx * w / 2 - 0.015, 0.42, l / 2], [sx * 0.25, 0.95, l / 2 + 0.4]], 0.018, { segs: 6 }); }
  g.tube([[-0.25, 0.95, l / 2 + 0.4], [0.25, 0.95, l / 2 + 0.4]], 0.02, { segs: 6 });
  g.box(-w / 2, 0.42, -l / 2 - 0.02, w / 2, 0.75, -l / 2 + 0.01);
  for (const sx of [-1, 1]) { g.tube([[sx * (w / 2 - 0.05), 0.4, l / 2 - 0.1], [sx * (w / 2 - 0.05), 0, l / 2 - 0.1]], 0.015, { segs: 5 }); }
  g.mat('plain', '#1e1c1a');
  for (const sx of [-1, 1]) { g.at(sx * (w / 2 + 0.05), 0.2, -l / 2 + 0.25, 0); g.rotZ(Math.PI / 2); g.lathe(0, 0, [[0.2, -0.03], [0.2, 0.03]], { segs: 18 }); g.pop(); }
  g.mat('cast', '#9a9590'); g.tube([[-w / 2 - 0.1, 0.2, -l / 2 + 0.25], [w / 2 + 0.1, 0.2, -l / 2 + 0.25]], 0.015, { segs: 5 });
  return { solid: [[-w / 2 - 0.1, 0, -l / 2, w / 2 + 0.1, 0.8, l / 2 + 0.4]], tier: 's' };
});

// Platform scales: a steel plate with a dial on a post.
defineProp('station.scales', (g) => {
  g.mat('deckplate', '#7a7a74'); g.box(-0.4, 0, -0.4, 0.4, 0.12, 0.4, { bevel: 0.01 });
  g.mat('paint', '#2f5a5a'); g.box(-0.05, 0.12, -0.42, 0.05, 1.2, -0.34, { bevel: 0.008 });
  g.at(0, 1.3, -0.38, 0); g.rotX(Math.PI / 2); g.lathe(0, 0, [[0.17, -0.05], [0.17, 0.05]], { segs: 20 }); g.pop();
  g.mat('plain', '#efe8d8'); g.at(0, 1.3, -0.33, 0); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.145, 0.005, { segs: 20 }); g.pop();
  g.mat('plain', '#a8392e'); g.box(-0.004, 1.3, -0.326, 0.004, 1.42, -0.322);
  return { solid: [[-0.4, 0, -0.42, 0.4, 0.12, 0.4]], posts: [[0, -0.38, 0.08, 0, 1.45]], tier: 's' };
});

// A market stall: a counter with a panelled front, corner posts, a back rail and two shelves. Front toward +z. p: { w, body, top }
defineProp('station.stall', (g, p) => {
  const w = p.w || 2.6, d = 0.7, h = 0.92, body = p.body || '#2f5a5a';
  g.mat('paint', body); g.box(-w / 2, 0.08, -d / 2, w / 2, h - 0.04, d / 2, { aoBottom: 0.6 });
  g.mat('paint', shadeHex(body, 0.6)); g.box(-w / 2 + 0.03, 0, -d / 2 + 0.04, w / 2 - 0.03, 0.08, d / 2 - 0.04);
  g.mat('paint', shadeHex(body, 1.2)); const n = Math.max(2, Math.round(w / 0.55));
  for (let i = 0; i < n; i++) { const x0 = -w / 2 + 0.05 + i * (w - 0.1) / n + 0.025, x1 = -w / 2 + 0.05 + (i + 1) * (w - 0.1) / n - 0.025; g.box(x0, 0.16, d / 2, x1, h - 0.12, d / 2 + 0.012, { bevel: 0.008 }); }
  g.mat('wood', p.top || '#9a7048', { rough: -0.05 }); g.box(-w / 2 - 0.04, h - 0.04, -d / 2 - 0.02, w / 2 + 0.04, h, d / 2 + 0.06, { bevel: 0.012 });
  g.mat('wood', shadeHex(p.top || '#9a7048', 0.7));
  for (const sx of [-1, 1]) { g.box(sx * w / 2 - 0.045, h, d / 2 - 0.02, sx * w / 2 + 0.045, 2.55, d / 2 + 0.07, { bevel: 0.008 }); g.box(sx * w / 2 - 0.045, 0, -d / 2 - 1.3, sx * w / 2 + 0.045, 2.75, -d / 2 - 1.21, { bevel: 0.008 }); }
  // back shelves (behind the keeper)
  g.mat('wood', p.top || '#9a7048');
  for (const yy of [0.9, 1.35, 1.8]) g.box(-w / 2 + 0.05, yy, -d / 2 - 1.3, w / 2 - 0.05, yy + 0.03, -d / 2 - 0.95, { bevel: 0.006 });
  g.mat('paint', shadeHex(body, 0.85)); g.box(-w / 2, 0, -d / 2 - 1.36, w / 2, 2.75, -d / 2 - 1.3, { faces: 'Z' });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2 + 0.06], [-w / 2, 0, -d / 2 - 1.36, w / 2, 2.75, -d / 2 - 0.95]], tier: 's',
    spots: [{ type: 'counter', x: 0, y: 0, z: -d / 2 - 0.5, yaw: 0, tags: ['stall'] }, { type: 'customer', x: -w / 4, y: 0, z: d / 2 + 0.55, yaw: Math.PI }, { type: 'customer', x: w / 4, y: 0, z: d / 2 + 0.6, yaw: Math.PI }] };
});

// A rack of lidded cups: three shelves of them in a steel frame.
defineProp('station.cupRack', (g, p) => {
  const w = p.w || 0.9;
  g.mat('brushed', '#a8aaa4');
  for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.02, 0, -0.14, sx * w / 2, 0.75, 0.14);
  for (let k = 0; k < 3; k++) g.box(-w / 2, k * 0.25, -0.14, w / 2, k * 0.25 + 0.015, 0.14);
  const cols = ['#e9e1cf', '#2f6f73', '#e9e1cf', '#c9552e', '#e9e1cf', '#d9b25c'];
  for (let k = 0; k < 3; k++) for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) {
    const x = -w / 2 + 0.07 + i * (w - 0.14) / 6, z = -0.06 + j * 0.12, y = k * 0.25 + 0.015, c = cols[(i + j + k) % cols.length];
    g.mat('glaze', c); g.lathe(x, z, [[0, y], [0.026, y], [0.036, y + 0.012], [0.04, y + 0.08], [0.043, y + 0.08], [0.04, y + 0.088], [0.012, y + 0.098], [0.012, y + 0.108], [0, y + 0.11]], { segs: 9 });
  }
  return { solid: [[-w / 2, 0, -0.14, w / 2, 0.75, 0.14]], tier: 'd' };
});

// A big lidded stockpot, held on the loop on a steel plate.
defineProp('station.pot', (g, p) => {
  const r = p.r || 0.24, h = p.h || 0.36;
  g.mat('brushed', '#b9bcb8', { rough: -0.25 });
  g.lathe(0, 0, [[0, 0], [r * 0.96, 0], [r, 0.02], [r, h], [r * 1.03, h + 0.01], [r * 0.98, h + 0.012], [r * 0.96, h - 0.01]], { segs: 22, capTop: false });
  g.lathe(0, 0, [[r * 1.03, h + 0.01], [r * 0.9, h + 0.05], [r * 0.3, h + 0.08], [0, h + 0.085]], { segs: 22 });
  g.mat('wood', '#2a1c14'); g.cyl(0, h + 0.08, 0, 0.05, 0.03, { segs: 10 }); g.ball(0, h + 0.12, 0, 0.035, 0.025, 0.035, { segs: 8, rings: 5 });
  g.mat('brushed', '#8a8c88'); for (const sx of [-1, 1]) g.tube([[sx * r, h - 0.06, 0], [sx * (r + 0.06), h - 0.05, 0], [sx * (r + 0.06), h - 0.1, 0], [sx * r, h - 0.11, 0]], 0.012, { segs: 5 });
  return { posts: [[0, 0, r, 0, h]], cast: true };
});

// A board of brass key tags on hooks, in rows by block. p: { rows, cols }
defineProp('station.keyBoard', (g, p) => {
  const rows = p.rows || 6, cols = p.cols || 14, w = 2.4, h = 1.3;
  g.mat('wood', '#5a3a24'); g.box(-w / 2 - 0.05, -0.05, -0.03, w / 2 + 0.05, h + 0.05, 0.0, { bevel: 0.01 });
  g.mat('felt', '#26306b'); g.box(-w / 2, 0, 0, w / 2, h, 0.006, { faces: 'Z' });
  const r = new Rng(19);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = -w / 2 + 0.36 + i * (w - 0.46) / (cols - 1), y = h - 0.14 - j * (h - 0.2) / rows;
    g.mat('cast', '#7a6a4a'); g.tube([[x, y, 0.006], [x, y, 0.035]], 0.004, { segs: 4 });
    if (r.chance(0.22)) continue;          // out on loan
    g.mat('cast', r.chance(0.5) ? '#c9a45c' : '#b08a45', { rough: -0.15 }); g.box(x - 0.022, y - 0.1, 0.012, x + 0.022, y - 0.02, 0.016, { bevel: 0.003 });
    g.mat('weave', ['#3a7a4a', '#2f6f73', '#a8392e', '#d9b25c'][r.i(0, 3)]); g.tube([[x, y + 0.002, 0.03], [x - 0.01, y - 0.02, 0.016]], 0.003, { segs: 3, caps: false });
  }
  return { cast: false };
});

// A traveller's bag, soft and strapped, sitting on the floor. p: { c }
defineProp('station.bag', (g, p) => {
  g.mat('weave', p.c || '#5a6a3a'); g.ball(0, 0.18, 0, 0.3, 0.19, 0.17, { segs: 12, rings: 7, bottom: 0.5 });
  g.mat('leather', '#4a3020'); g.tube([[-0.18, 0.3, 0.1], [0, 0.48, 0.02], [0.18, 0.3, 0.1]], 0.012, { segs: 5 });
  g.box(-0.31, 0.16, -0.02, 0.31, 0.2, 0.02);
  return { tier: 'd' };
});

// A stainless sealed cabinet with glass doors and racked vials (for the Gate). p: { w }
defineProp('station.cabinet', (g, p) => {
  const w = p.w || 1.2, h = 2.0, d = 0.55;
  g.mat('brushed', '#d4d8d6', { rough: -0.2 }); g.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, { bevel: 0.01, faces: 'xXyYz' });
  g.mat('plain', '#e9eeee'); g.box(-w / 2 + 0.04, 0.12, -d / 2 + 0.02, w / 2 - 0.04, h - 0.06, d / 2 - 0.04, { faces: 'Z' });
  const cols = ['#3a8a8a', '#d9b25c', '#c9552e', '#e9e1cf', '#5a7aa8'];
  for (let k = 0; k < 4; k++) {
    const y = 0.2 + k * 0.45; g.mat('brushed', '#c4c8c6'); g.box(-w / 2 + 0.05, y, -d / 2 + 0.03, w / 2 - 0.05, y + 0.015, d / 2 - 0.05);
    for (let i = 0; i < 9; i++) { g.mat('glaze', cols[(i + k) % cols.length]); g.cyl(-w / 2 + 0.12 + i * (w - 0.24) / 8, y + 0.015, 0.0, 0.025, 0.11, { segs: 7 }); }
  }
  g.mat('brushed', '#9a9e9c'); g.box(-0.005, 0.1, d / 2 - 0.01, 0.005, h - 0.04, d / 2 + 0.005);
  for (const sx of [-1, 1]) g.box(sx * 0.06 - 0.008, 0.95, d / 2, sx * 0.06 + 0.008, 1.2, d / 2 + 0.03);
  g.mat('plain', '#e8c242'); g.box(-w / 2 + 0.05, h - 0.18, d / 2, -w / 2 + 0.3, h - 0.1, d / 2 + 0.004);
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], glass: [[-w / 2 + 0.04, 0.1, d / 2 - 0.005, w / 2 - 0.04, h - 0.05, d / 2 - 0.005, { opacity: 0.12, tint: '#dfeceb' }]], tier: 's' };
});

// A section of roller conveyor (along x), on legs. p: { l }
defineProp('station.roller', (g, p) => {
  const l = p.l || 4, w = 0.7, h = 0.8;
  g.mat('brushed', '#b4b8b6');
  for (const sz of [-1, 1]) g.box(-l / 2, h - 0.12, sz * w / 2 - 0.04, l / 2, h, sz * w / 2);
  const n = Math.round(l / 0.12);
  g.mat('brushed', '#d8dbd8', { rough: -0.3 });
  for (let i = 0; i < n; i++) { const x = -l / 2 + (i + 0.5) * l / n; g.at(x, h - 0.03, 0, 0); g.rotX(Math.PI / 2); g.lathe(0, 0, [[0.025, -w / 2 + 0.04], [0.025, w / 2 - 0.04]], { segs: 7 }); g.pop(); }
  g.mat('paint', '#3a4a4a');
  for (let k = 0; k <= Math.round(l / 1.4); k++) { const x = -l / 2 + 0.08 + k * (l - 0.16) / Math.round(l / 1.4); for (const sz of [-1, 1]) g.box(x - 0.03, 0, sz * (w / 2 - 0.02) - 0.03, x + 0.03, h - 0.12, sz * (w / 2 - 0.02) + 0.03); }
  return { solid: [[-l / 2, 0, -w / 2, l / 2, h, w / 2]], tier: 's' };
});

// The sequencer: a pale instrument on a bench, with a sample tray, a row of indicator lamps and a printed strip.
defineProp('station.sequencer', (g) => {
  g.mat('paint', '#e6ebe9'); g.box(-0.5, 0, -0.3, 0.5, 0.42, 0.3, { bevel: 0.03 });
  g.mat('paint', '#3a8a8a'); g.box(-0.5, 0.42, -0.3, 0.5, 0.44, 0.3, { bevel: 0.01 });
  g.mat('plain', '#1e2a2a'); g.box(-0.3, 0.12, 0.3, 0.3, 0.3, 0.305);
  g.mat('brushed', '#c4c8c6'); g.box(-0.22, 0.44, -0.1, 0.22, 0.47, 0.18, { bevel: 0.005 });
  for (let i = 0; i < 6; i++) { g.mat('diffuser', i === 2 ? '#ffb347' : '#7fe0a0', { emissive: 2.5 }); g.ball(-0.4 + i * 0.03, 0.36, 0.305, 0.008, 0.008, 0.004, { segs: 6, rings: 4 }); }
  g.mat('paper', '#f4f0e6'); g.box(0.32, 0.2, 0.3, 0.42, 0.21, 0.42);
  return { solid: [[-0.5, 0, -0.3, 0.5, 0.47, 0.3]], tier: 'd' };
});

// A sealed produce crate with a glass lid showing what is in it (strawberries, tomatoes, apples). p: { fruit, w, d }
defineProp('station.fruitCrate', (g, p) => {
  const w = p.w || 0.6, d = p.d || 0.4, h = 0.22;
  g.mat('wood', p.wood || '#c9a676', { rough: 0.1 }); g.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, { bevel: 0.006, faces: 'xXzZy' });
  g.mat('wood', '#6a4a30'); g.box(-w / 2 + 0.02, h - 0.03, -d / 2 + 0.02, w / 2 - 0.02, h - 0.02, d / 2 - 0.02, { faces: 'Y' });
  const r = new Rng(hashStr((p.fruit || 'x') + w)); const c = p.fruit || '#c8243a';
  const big = p.big ? 0.04 : 0.022;
  const nx = Math.floor((w - 0.06) / (big * 2.1)), nz = Math.floor((d - 0.06) / (big * 2.1));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = -w / 2 + 0.04 + big + i * big * 2.1 + r.f(-0.004, 0.004), z = -d / 2 + 0.04 + big + j * big * 2.1 + r.f(-0.004, 0.004);
    g.mat('plain', mixHex(c, '#ffffff', r.f(0, 0.12)), { rough: -0.35 }); g.ball(x, h - 0.02 + big * 0.8, z, big, big * (p.big ? 0.95 : 1.15), big, { segs: p.big ? 7 : 5, rings: p.big ? 5 : 4 });
    
  }
  g.mat('brushed', '#c4c8c6'); g.box(-w / 2, h + big * 2.2, -d / 2, w / 2, h + big * 2.2 + 0.012, -d / 2 + 0.02); g.box(-w / 2, h + big * 2.2, d / 2 - 0.02, w / 2, h + big * 2.2 + 0.012, d / 2);
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h + 0.05, d / 2]], glass: [], tier: 'd' };
});

// A loaf of bread under a cloth or bare. p: { c, cloth }
defineProp('station.loaf', (g, p) => {
  g.mat('plain', p.c || '#a8663a', { rough: 0.05 }); g.ball(0, 0.06, 0, 0.14, 0.07, 0.09, { segs: 10, rings: 6, bottom: 0.5 });
  g.mat('plain', shadeHex(p.c || '#a8663a', 1.25)); for (let i = 0; i < 3; i++) g.box(-0.07 + i * 0.06, 0.118, -0.05, -0.05 + i * 0.06, 0.124, 0.05, { faces: 'Y' });
  return { cast: false };
});

// A bolt of cloth lying on its side. p: { c }
defineProp('station.bolt', (g, p) => {
  g.at(0, 0.09, 0, 0); g.rotZ(Math.PI / 2);
  g.mat('weave', p.c || '#a8392e'); g.lathe(0, 0, [[0.09, -0.35], [0.09, 0.35]], { segs: 12 });
  g.mat('wood', '#c9a676'); g.lathe(0, 0, [[0.025, -0.37], [0.025, 0.37]], { segs: 6 });
  g.pop();
  return { cast: false };
});

// A sack of grain or flour, tied at the neck. p: { c }
defineProp('station.sack', (g, p) => {
  g.mat('weave', p.c || '#a8946a'); g.ball(0, 0.22, 0, 0.24, 0.24, 0.2, { segs: 10, rings: 7, bottom: 0.4 });
  g.lathe(0, 0, [[0.16, 0.38], [0.07, 0.48], [0.05, 0.52], [0.08, 0.58], [0.06, 0.6], [0, 0.6]], { segs: 8 });
  g.mat('weave', '#6a4a30'); g.lathe(0, 0, [[0.055, 0.5], [0.06, 0.515], [0.055, 0.53]], { segs: 8 });
  return { posts: [[0, 0, 0.22, 0, 0.5]], tier: 'd' };
});
// A low basket with something in it. p: { c (contents), r }
defineProp('station.basket', (g, p) => {
  const r = p.r || 0.26; g.mat('cane', '#b08d5e'); g.lathe(0, 0, [[0, 0], [r * 0.8, 0], [r, r * 0.6], [r * 1.02, r * 0.62], [r * 0.82, r * 0.06], [0, 0.02]], { segs: 14 });
  const R = new Rng(hashStr('bk' + (p.c || '') + r)); g.mat('plain', p.c || '#c8243a', { rough: -0.2 });
  for (let i = 0; i < 9; i++) { const a = R.f(0, 6.28), d = R.f(0, r * 0.65); g.ball(Math.cos(a) * d, r * 0.5, Math.sin(a) * d, 0.05, 0.045, 0.05, { segs: 6, rings: 4 }); }
  return { posts: [[0, 0, r, 0, r * 0.6]], tier: 'd' };
});
// A chalk A-frame stood on the floor (the slate itself is painted on by the caller). Front toward +z, leaning back.
defineProp('station.aframe', (g) => {
  g.mat('wood', '#6b4a2f');
  for (const sx of [-1, 1]) { g.tube([[sx * 0.24, 0, 0.18], [sx * 0.24, 0.72, 0.0]], 0.018, { segs: 5 }); g.tube([[sx * 0.24, 0, -0.2], [sx * 0.24, 0.72, 0.0]], 0.018, { segs: 5 }); }
  g.box(-0.25, 0.7, -0.03, 0.25, 0.75, 0.03);
  g.mat('slate', '#2a3034'); g.at(0, 0.36, 0.09, 0); g.rotX(-0.24); g.box(-0.22, -0.32, -0.012, 0.22, 0.32, 0.0); g.pop();
  return { posts: [[0, 0, 0.25, 0, 0.75]], tier: 'd' };
});

