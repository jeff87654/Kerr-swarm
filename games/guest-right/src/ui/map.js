// The map, in three views: the local plan (game.mapData().local: segments in metres, y up, auto-fitted, with zoom and
// pan), Round the drum (one layer of the city's blocks unrolled: src/ui/round.js), and the drum in section (side on,
// to scale, with an end-on inset, the landmarks a cab can reach and the decks and rings you have been to).
// map.pick({ from }) opens Round the drum as a chooser for the cab and resolves to a cell { L, i, j } or null.

import { h, btn, clear, clamp, isKey, focusEl } from './dom.js';
import { icon, iconEl } from './icons.js';
import { openScreen } from './stack.js';
import { segmented } from './settings.js';
import { createRound } from './round.js';
import { summary, landmarks, parseCell, ringWord, cap, youCell, infoOf } from './chervil.js';

const R = 3000;        // rim radius, m
const LEN = 3750;      // drum length, m
const HOLLOW = 1500;   // Hollow radius, m
const U = 10;          // metres per section unit
const BLOCK_Z = LEN / 18;

const deckR = (n) => R - 4 * (n - 1);
const num = (v) => Math.round(v).toLocaleString('en-GB');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function youR(you) {
  if (!you) return null;
  if (isFinite(you.rho)) return Number(you.rho);
  if (isFinite(you.deck)) return deckR(Number(you.deck));
  return null;
}

function ringName(r) {
  if (r == null || r === '') return '';
  if (typeof r === 'number') return 'Ring ' + ringWord(r);
  return String(r);
}

// the drum's z (0 at the front cap) of where you are
function youZ(you) {
  if (!you) return null;
  if (isFinite(you.zM)) return Number(you.zM);
  if (isFinite(you.ring)) return ((Number(you.ring) - 0.5) * LEN) / 9;
  return null;
}

// ---------- the drum in section ----------
// Section units: x = metres along the axis / U, y = metres out from the axis / U (the near side is drawn below the
// axis, the far side above). The Keel is drawn three times its true depth so it reads; the Low decks give it room.
const SY = { r0: R / U, keel: R / U - 14, low: deckR(113) / U, mid: deckR(301) / U, high: HOLLOW / U };
function sy(rho) {
  const r = Number(rho);
  const top16 = deckR(16), keelIn = deckR(15) - 2;
  if (r >= keelIn) return SY.keel + ((r - keelIn) / (R - keelIn)) * (SY.r0 - SY.keel);
  if (r >= deckR(113)) return SY.low + ((r - deckR(113)) / (top16 + 2 - deckR(113))) * (SY.keel - SY.low);
  return r / U;
}

function drumSvg(you, extra) {
  const L = LEN / U;
  const { r0, keel, low, mid, high } = SY;
  const out = [];
  const band = (a, b, cls) => {
    out.push('<rect class="' + cls + '" x="0" y="' + a + '" width="' + L + '" height="' + (b - a) + '"/>');
    out.push('<rect class="' + cls + '" x="0" y="' + (-b) + '" width="' + L + '" height="' + (b - a) + '"/>');
  };
  band(keel, r0, 'b-keel');
  band(low, keel, 'b-low');
  band(mid, low, 'b-mid');
  band(high, mid, 'b-high');
  for (const y of [keel, low, mid, high]) {
    out.push('<line class="b-edge" x1="0" y1="' + y + '" x2="' + L + '" y2="' + y + '"/>');
    out.push('<line class="b-edge" x1="0" y1="' + (-y) + '" x2="' + L + '" y2="' + (-y) + '"/>');
  }
  // the end walls climb in terraces toward the axis
  const steps = 10;
  for (const end of [0, 1]) {
    for (const s of [1, -1]) {
      let d = '';
      for (let k = 0; k <= steps; k++) {
        const rr = high - (k * (high - 9)) / steps;
        const dep = 30 * (1 - k / steps);
        const x = end ? L - dep : dep;
        const xn = end ? L - 30 * (1 - (k + 1) / steps) : 30 * (1 - (k + 1) / steps);
        const rn = high - ((k + 1) * (high - 9)) / steps;
        if (k === 0) d += 'M' + (end ? L : 0) + ' ' + s * rr + 'L' + x + ' ' + s * rr;
        if (k < steps) d += 'L' + x + ' ' + s * rn + 'L' + xn + ' ' + s * rn;
      }
      d += 'L' + (end ? L : 0) + ' ' + s * 9 + 'Z';
      out.push('<path class="b-terr" d="' + d + '"/>');
    }
  }
  // the Spindle, the flying halls at its ends, and the sunline down its middle
  out.push('<rect class="b-spin" x="0" y="-7.5" width="' + L + '" height="15"/>');
  out.push('<rect class="b-fly" x="0" y="-7.5" width="12" height="15"/><rect class="b-fly" x="' + (L - 12) + '" y="-7.5" width="12" height="15"/>');
  out.push('<line class="b-sun-g" x1="12" y1="0" x2="' + (L - 12) + '" y2="0"/><line class="b-sun" x1="12" y1="0" x2="' + (L - 12) + '" y2="0"/>');
  // the far bank, a lake and orchards on the Hollow floor, hinted
  out.push('<line class="b-lake" x1="' + L * 0.36 + '" y1="' + (high - 1.4) + '" x2="' + L * 0.52 + '" y2="' + (high - 1.4) + '"/>');
  out.push('<line class="b-lake" x1="' + L * 0.48 + '" y1="' + (-high + 1.4) + '" x2="' + L * 0.62 + '" y2="' + (-high + 1.4) + '"/>');
  // outline
  out.push('<rect class="b-out" x="0" y="' + (-r0) + '" width="' + L + '" height="' + 2 * r0 + '"/>');
  // nine station rings in the Keel; the ones you have walked in are lit
  const ringsBeen = (extra && extra.rings) || new Set();
  for (let k = 1; k <= 9; k++) {
    const x = ((k - 0.5) * L) / 9;
    const lit = ringsBeen.has(k) ? ' is-been' : '';
    out.push('<rect class="b-ring' + lit + '" x="' + (x - 3) + '" y="' + keel + '" width="6" height="' + (r0 - keel) + '"/>');
    out.push('<rect class="b-ring' + lit + '" x="' + (x - 3) + '" y="' + (-r0) + '" width="6" height="' + (r0 - keel) + '"/>');
    out.push('<text class="t-ring' + lit + '" x="' + x + '" y="' + (r0 + 22) + '">' + k + '</text>');
  }
  out.push('<text class="t-cap" x="' + L / 2 + '" y="' + (r0 + 44) + '">Station rings</text>');
  out.push('<text class="t-end" x="0" y="' + (-r0 - 14) + '">Front</text>');
  out.push('<text class="t-end is-r" x="' + L + '" y="' + (-r0 - 14) + '">Back</text>');
  out.push('<text class="t-cap is-unit" x="' + L / 2 + '" y="' + (-r0 - 14) + '">3,750 m</text>');
  // band labels, left; ty moves a label off its band when two would touch
  const lab = (y, t, s, ty) => {
    const yt = ty != null ? ty : y;
    out.push('<path class="b-lead" fill="none" d="M-4 ' + y + 'L-12 ' + y + 'L-18 ' + yt + 'L-24 ' + yt + '"/>');
    out.push('<text class="t-band" x="-30" y="' + (yt + 4) + '">' + esc(t) + '</text>');
    if (s) out.push('<text class="t-bsub" x="-30" y="' + (yt + 20) + '">' + esc(s) + '</text>');
  };
  lab((keel + r0) / 2, 'Keel', 'Decks 1 to 15, 1 g', r0 + 8);
  lab((low + keel) / 2, 'Low decks', '16 to 113', (low + keel) / 2 - 12);
  lab((mid + low) / 2, 'Middle decks', '114 to 301');
  lab((high + mid) / 2, 'High decks', '302 to 375');
  lab(high * 0.55, 'The Hollow', 'Floor at 0.5 g');
  lab(0, 'Sunline', 'Along the axis');
  out.push('<text class="t-terr" x="40" y="' + (high * 0.5) + '">Terraces</text>');
  out.push('<text class="t-terr is-r" x="' + (L - 40) + '" y="' + (high * 0.5) + '">Terraces</text>');
  out.push('<text class="t-far" x="' + L / 2 + '" y="' + (-high * 0.55) + '">The far bank, overhead</text>');

  // the blocks you have been to, by layer and by place along the axis, and a tick at the side for each layer
  if (extra && extra.cells && extra.cells.length) {
    let dots = '';
    const ticks = new Set();
    for (const c of extra.cells) {
      const y = sy(c.rho);
      dots += 'M' + ((c.j * BLOCK_Z) / U).toFixed(1) + ' ' + y.toFixed(2) + 'h0.01';
      ticks.add(y.toFixed(2));
    }
    out.push('<path class="b-been" d="' + dots + '"/>');
    let tk = '';
    for (const y of ticks) tk += 'M' + L + ' ' + y + 'h5';
    out.push('<path class="b-btick" d="' + tk + '"/>');
  }

  // landmarks a cab can reach: a diamond each, and one label a group in a column at the right, led to its place
  const lms = (extra && extra.landmarks) || [];
  const reachedSet = (extra && extra.reached) || new Set();
  const groups = new Map();
  for (const m of lms) {
    if (m.rho == null || m.z == null) continue;
    const x = clamp(m.z / U, 3, L - 3), y = clamp(sy(m.rho), 2, r0 - 2);
    const gk = m.group || m.name;
    let g = groups.get(gk);
    if (!g) { g = { name: m.group || m.name, items: [] }; groups.set(gk, g); }
    g.items.push({ x, y, m });
  }
  const marks = [], tags = [];
  for (const g of groups.values()) {
    let reached = false, ax = -1, ay = 0;
    for (const it of g.items) {
      const hit = reachedSet.has(it.m.id);
      if (hit) reached = true;
      if (it.x > ax) { ax = it.x; ay = it.y; }
      const k = it.x.toFixed(0) + ',' + it.y.toFixed(0);
      const old = marks.find((q) => q.k === k);
      if (old) { old.reached = old.reached || hit; continue; }
      marks.push({ k, x: it.x, y: it.y, reached: hit });
    }
    const names = new Set(g.items.map((it) => it.m.name));
    tags.push({ ax, ay, text: names.size === 1 ? g.items[0].m.name : g.name, cls: 't-lm' + (reached ? ' is-been' : ''), lead: 'b-lmlead' });
  }
  const r = youR(you);
  let rx = null;
  if (r != null) {
    const z = youZ(you);
    rx = { x: clamp((z == null ? LEN / 2 : z) / U, 2, L - 2), y: clamp(sy(r), 2, r0 - 2) };
    tags.push({ ax: rx.x + 4, ay: rx.y, text: 'You', cls: 't-you', lead: 'b-lead is-you' });
  }
  // the column: in order down the drum, 13 units apart, pushed back up if it runs off the bottom
  tags.sort((p, q) => p.ay - q.ay);
  const gapY = 13, maxY = r0 + 24;
  for (let i = 0; i < tags.length; i++) tags[i].ly = Math.max(tags[i].ay, i ? tags[i - 1].ly + gapY : -r0);
  for (let i = tags.length - 1; i >= 0; i--) if (tags[i].ly > (i === tags.length - 1 ? maxY : tags[i + 1].ly - gapY)) tags[i].ly = i === tags.length - 1 ? maxY : tags[i + 1].ly - gapY;
  const cx = L + 16;
  for (const t of tags) {
    out.push('<path class="' + t.lead + '" fill="none" d="M' + (t.ax + 5).toFixed(1) + ' ' + t.ay.toFixed(1) + 'L' + (L + 6) + ' ' + t.ay.toFixed(1) + 'L' + (cx - 4) + ' ' + t.ly.toFixed(1) + 'L' + cx + ' ' + t.ly.toFixed(1) + '"/>');
    out.push('<text class="' + t.cls + '" x="' + (cx + 4) + '" y="' + (t.ly + 4).toFixed(1) + '">' + esc(t.text) + '</text>');
  }
  for (const m of marks) out.push('<path class="b-lm' + (m.reached ? ' is-been' : '') + '" d="M' + m.x + ' ' + (m.y - 4) + 'L' + (m.x + 4) + ' ' + m.y + 'L' + m.x + ' ' + (m.y + 4) + 'L' + (m.x - 4) + ' ' + m.y + 'Z"/>');

  // you
  if (rx) {
    const { x, y } = rx;
    out.push('<g class="you" transform="translate(' + x + ' ' + y + ')"><circle class="you-p" r="9"/><circle class="you-r" r="6"/><circle class="you-d" r="3.2"/></g>');
  }
  const vb = '-200 ' + (-r0 - 40) + ' ' + (L + 340) + ' ' + (2 * r0 + 96);
  return '<svg class="gr-drum" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="The drum in section">' + out.join('') + '</svg>';
}

function endSvg(you) {
  const s = 100 / R;
  const r = youR(you);
  const out = [];
  out.push('<circle class="e-rim" r="100"/>');
  for (const rr of [deckR(16), deckR(114), deckR(302)]) out.push('<circle class="e-band" r="' + rr * s + '"/>');
  out.push('<circle class="e-hollow" r="' + HOLLOW * s + '"/>');
  out.push('<circle class="e-sun" r="2.2"/>');
  out.push('<path class="e-spin" d="M -38 112 A 118 118 0 0 0 38 112"/><path class="e-spin-h" d="M 32 108 L 39 112 L 34 118"/>');
  out.push('<text class="t-cap" x="0" y="140">Spin</text>');
  if (r != null) {
    const th = ((Number(you.thetaDeg) || 0) * Math.PI) / 180;
    const x = Math.sin(th) * r * s;
    const y = Math.cos(th) * r * s;
    out.push('<line class="e-ray" x1="0" y1="0" x2="' + x + '" y2="' + y + '"/>');
    out.push('<circle class="you-p" cx="' + x + '" cy="' + y + '" r="7"/><circle class="you-d" cx="' + x + '" cy="' + y + '" r="3.2"/>');
  }
  return '<svg class="gr-endv" viewBox="-130 -130 260 280" role="img" aria-label="The drum end on">' + out.join('') + '</svg>';
}

function factsFor(you, block, sum) {
  const box = h('div', 'gr-mfacts');
  box.appendChild(h('div', 'gr-kicker', 'Where you are'));
  const r = youR(you);
  if (r == null) { box.appendChild(h('div', 'gr-mfacts-t', 'Somewhere in Chervil')); return box; }
  const inHollow = !isFinite(you.deck) && r <= HOLLOW + 20;
  const title = block ? block.name : inHollow || (isFinite(you.deck) && you.deck > 375) ? 'The Hollow' : isFinite(you.deck) ? 'Deck ' + Math.round(you.deck) : 'In the drum';
  box.appendChild(h('div', 'gr-mfacts-t', title));
  const g = r / R;
  const lines = [];
  if (block) lines.push(cap(block.address) + ' · ' + g.toFixed(2) + ' g');
  else lines.push([ringName(you.ring), g.toFixed(2) + ' g'].filter(Boolean).join(' · '));
  lines.push(num(r) + ' m out from the axis');
  const z = youZ(you);
  if (z != null) lines.push(num(clamp(z, 0, LEN)) + ' m from the front wall');
  for (const l of lines) box.appendChild(h('div', 'gr-mfacts-l', l));
  if (sum && sum.keys.length) {
    const nb = sum.keys.length, nl = sum.layers.size;
    box.appendChild(h('div', 'gr-mfacts-b', 'You have been to ' + nb + (nb === 1 ? ' block' : ' blocks') + ' on ' + nl + (nl === 1 ? ' layer' : ' layers') + ' of decks, in ' + sum.rings.size + ' of the nine rings.'));
  }
  return box;
}

export function createMap(ctx) {
  const { G } = ctx;
  let handle = null;
  let view = 'local';
  let els = null;
  let data = null;
  let vb = null;
  let fitVb = null;
  let drag = null;
  let round = null;
  let chooser = null;   // { from } while the cab is asking
  let want = null;      // a cell to show when Round the drum opens

  const views = () => (G.city() ? [['local', 'Here'], ['round', 'Round the drum'], ['drum', 'The drum']] : [['local', 'Here'], ['drum', 'The drum']]);

  // ---------- the local plan ----------
  function bounds(local) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const p = (x, z) => { if (!isFinite(x) || !isFinite(z)) return; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, -z); y1 = Math.max(y1, -z); };
    for (const l of local.lines || []) { p(l[0], l[1]); p(l[2], l[3]); }
    for (const l of local.labels || []) p(l.x, l.z);
    if (local.you) p(local.you.x, local.you.z);
    for (const m of local.markers || []) p(m.x, m.z);
    if (!isFinite(x0)) return { x: -50, y: -50, w: 100, h: 100 };
    const w = Math.max(20, x1 - x0);
    const hh = Math.max(20, y1 - y0);
    const pad = Math.max(w, hh) * 0.08 + 6;
    return { x: x0 - pad, y: y0 - pad, w: w + 2 * pad, h: hh + 2 * pad };
  }

  function planSvg(local) {
    const byKind = {};
    for (const l of local.lines || []) {
      if (!l || l.length < 4) continue;
      const k = String(l[4] || 'wall').replace(/[^a-z-]/gi, '');
      byKind[k] = (byKind[k] || '') + 'M' + (+l[0]).toFixed(2) + ' ' + (-l[1]).toFixed(2) + 'L' + (+l[2]).toFixed(2) + ' ' + (-l[3]).toFixed(2);
    }
    const out = [];
    const order = ['green', 'water', 'edge', 'street', 'rail', 'furniture', 'wall', 'door'];
    const rank = (k) => { const i = order.indexOf(k); return i < 0 ? 5.5 : i; };
    const kinds = Object.keys(byKind).sort((a, b) => rank(a) - rank(b));
    for (const k of kinds) out.push('<path class="k-' + k + '" d="' + byKind[k] + '" vector-effect="non-scaling-stroke"/>');
    for (const l of local.labels || []) {
      if (!l || !isFinite(l.x) || !isFinite(l.z)) continue;
      out.push('<text class="p-lab' + (l.kind ? ' is-' + esc(l.kind) : '') + '" x="' + l.x + '" y="' + (-l.z) + '">' + esc(l.text) + '</text>');
    }
    for (const m of local.markers || []) {
      if (!m || !isFinite(m.x) || !isFinite(m.z)) continue;
      out.push('<g class="p-mark is-' + esc(m.kind || 'place') + '" data-x="' + m.x + '" data-y="' + (-m.z) + '"><path class="p-glyph" d="' + (m.kind === 'thread' ? 'M0 -6L6 0L0 6L-6 0Z' : m.kind === 'person' ? 'M0 -4A4 4 0 1 0 0.01 -4Z' : 'M0 -5A5 5 0 1 0 0.01 -5Z') + '"/>' + (m.label ? '<text class="p-mlab" x="10" y="4">' + esc(m.label) + '</text>' : '') + '</g>');
    }
    const y = local.you;
    if (y && isFinite(y.x) && isFinite(y.z)) {
      out.push('<g class="p-you" data-x="' + y.x + '" data-y="' + (-y.z) + '" data-yaw="' + (Number(y.yaw) || 0) + '"><circle class="you-p" r="15"/><circle class="you-r" r="12"/><path class="p-arrow" d="M0 -10L6.5 7L0 3.5L-6.5 7Z"/></g>');
    }
    return '<svg class="gr-plan" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Plan of where you are">' + out.join('') + '</svg>';
  }

  function applyVb() {
    const svg = els && els.planHost.querySelector('svg');
    if (!svg || !vb) return;
    svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    const cw = Math.max(1, els.planHost.clientWidth);
    const ch = Math.max(1, els.planHost.clientHeight);
    const upp = Math.max(vb.w / cw, vb.h / ch);   // units per CSS pixel
    for (const t of svg.querySelectorAll('.p-lab')) t.style.fontSize = ((t.classList.contains('is-big') ? 12.5 : 11.5) * upp).toFixed(3) + 'px';
    for (const g of svg.querySelectorAll('.p-mark, .p-you')) {
      const rot = g.dataset.yaw ? ' rotate(' + g.dataset.yaw + ')' : '';
      g.setAttribute('transform', 'translate(' + g.dataset.x + ' ' + g.dataset.y + ')' + rot + ' scale(' + upp.toFixed(4) + ')');
    }
    // labels that would overlap are hidden: markers first, then big labels, then the rest
    const placed = [];
    const clash = (r) => placed.some((p) => !(r.right < p.left - 6 || r.left > p.right + 6 || r.bottom < p.top - 2 || r.top > p.bottom + 2));
    for (const t of svg.querySelectorAll('.p-mlab, .p-glyph, .p-you .you-r')) placed.push(t.getBoundingClientRect());
    const labs = Array.from(svg.querySelectorAll('.p-lab')).sort((a, b) => (b.classList.contains('is-big') ? 1 : 0) - (a.classList.contains('is-big') ? 1 : 0));
    for (const t of labs) {
      t.style.visibility = '';
      t.setAttribute('dx', '0');
      t.setAttribute('dy', '0');
      const w = t.getBoundingClientRect().width * 0.62 * upp;
      let ok = null;
      for (const [dx, dy] of [[0, '0'], [0, '-1.5em'], [0, '1.5em'], [-w, '0'], [w, '0']]) {
        t.setAttribute('dx', String(dx));
        t.setAttribute('dy', dy);
        const r = t.getBoundingClientRect();
        if (!clash(r)) { ok = r; break; }
      }
      if (ok) placed.push(ok);
      else { t.setAttribute('dx', '0'); t.setAttribute('dy', '0'); t.style.visibility = 'hidden'; }
    }
    // a scale bar of a round number of metres, about a fifth of the width
    const target = (cw / 5) * upp;
    const nice = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
    let m = nice[0];
    for (const n of nice) if (n <= target) m = n;
    els.scaleBar.style.width = (m / upp).toFixed(1) + 'px';
    els.scaleT.textContent = m >= 1000 ? m / 1000 + ' km' : m + ' m';
  }

  function zoomAt(f, cx, cy) {
    if (!vb) return;
    const r = els.planHost.getBoundingClientRect();
    const cw = Math.max(1, r.width), ch = Math.max(1, r.height);
    const upp = Math.max(vb.w / cw, vb.h / ch);
    // the point under the cursor, in plan units
    const ox = vb.x + vb.w / 2 + ((cx == null ? cw / 2 : cx - r.left) - cw / 2) * upp;
    const oy = vb.y + vb.h / 2 + ((cy == null ? ch / 2 : cy - r.top) - ch / 2) * upp;
    const lim = fitVb ? [fitVb.w / 12, fitVb.w * 3] : [10, 1e5];
    const nw = clamp(vb.w / f, lim[0], lim[1]);
    const k = nw / vb.w;
    vb = { x: ox - (ox - vb.x) * k, y: oy - (oy - vb.y) * k, w: vb.w * k, h: vb.h * k };
    applyVb();
  }

  function pan(dxPx, dyPx) {
    if (!vb) return;
    const cw = Math.max(1, els.planHost.clientWidth), ch = Math.max(1, els.planHost.clientHeight);
    const upp = Math.max(vb.w / cw, vb.h / ch);
    vb = { x: vb.x - dxPx * upp, y: vb.y - dyPx * upp, w: vb.w, h: vb.h };
    applyVb();
  }

  function centreOnYou() {
    const y = data && data.local && data.local.you;
    if (!vb || !y || !isFinite(y.x)) { vb = fitVb ? Object.assign({}, fitVb) : vb; applyVb(); return; }
    vb = { x: y.x - vb.w / 2, y: -y.z - vb.h / 2, w: vb.w, h: vb.h };
    applyVb();
  }

  function renderPlan() {
    const local = data && data.local;
    clear(els.planHost);
    if (!local || !(local.lines || []).length) {
      els.planHost.appendChild(h('div', 'gr-empty is-page', 'No plan of this place yet.'));
      els.planTools.classList.add('gr-gone');
      return;
    }
    els.planTools.classList.remove('gr-gone');
    els.planHost.innerHTML = planSvg(local);
    fitVb = bounds(local);
    vb = Object.assign({}, fitVb);
    requestAnimationFrame(() => {
      if (!els) return;
      // on a small screen a whole plan can be too small to read: start closer, around you
      const cw = Math.max(1, els.planHost.clientWidth), ch = Math.max(1, els.planHost.clientHeight);
      const upp = Math.max(vb.w / cw, vb.h / ch);
      const y = local.you;
      if (upp > 0.55 && y && isFinite(y.x) && isFinite(y.z)) vb = { x: y.x - (cw * 0.55) / 2, y: -y.z - (ch * 0.55) / 2, w: cw * 0.55, h: ch * 0.55 };
      applyVb();
    });
  }

  function renderDrum() {
    const you = data && data.drum && data.drum.you;
    const sum = summary(G);
    const city = sum.city;
    const cells = [];
    if (city) {
      const seen = new Set();
      for (const k of sum.keys) {
        const c = parseCell(k);
        const s = c.L + ':' + c.j;
        if (seen.has(s)) continue;
        seen.add(s);
        cells.push({ j: c.j, rho: city.LAYERS[c.L].rho0 });
      }
    }
    const rings = new Set(sum.rings);
    if (you && isFinite(you.ring)) rings.add(Number(you.ring));
    const reached = new Set(ctx.reached ? ctx.reached.list().map((x) => x.id) : []);
    els.drumHost.innerHTML = drumSvg(you, { cells, rings, landmarks: landmarks(G), reached });
    clear(els.drumSide);
    const endHost = h('div', 'gr-endhost');
    endHost.innerHTML = endSvg(you);
    const yc = youCell(city);
    els.drumSide.appendChild(factsFor(you || null, yc ? infoOf(city, yc) : null, sum));
    els.drumSide.appendChild(endHost);
    els.drumSide.appendChild(h('div', 'gr-mlegend', [
      h('span', 'gr-lg is-lm', [h('i', ''), 'A landmark a cab can reach']),
      h('span', 'gr-lg is-lmb', [h('i', ''), 'One you have reached']),
      cells.length ? h('span', 'gr-lg is-been', [h('i', ''), 'Blocks you have been to']) : null,
    ]));
    els.drumSide.appendChild(h('div', 'gr-mnote', 'Out is down. The middle is up.'));
  }

  function renderRound() {
    if (!round) {
      const city = G.city();
      if (!city) { clear(els.roundHost); els.roundHost.appendChild(h('div', 'gr-empty is-page', 'The blocks of Chervil are not on this map yet.')); return; }
      round = createRound(ctx, chooser
        ? { chooser: true, from: chooser.from, cell: chooser.from, onGo: (c) => { if (handle) handle.close(c); }, onBack: () => close() }
        : { cell: want });
      els.roundHost.appendChild(round.el);
    } else if (want) round.goTo(want);
    want = null;
    round.show();
  }

  function setView(v, sound) {
    const list = views().map((x) => x[0]);
    view = list.indexOf(v) >= 0 ? v : 'local';
    if (!els) return;
    if (els.seg) els.seg.set(view);
    els.body.classList.toggle('is-drum', view === 'drum');
    els.body.classList.toggle('is-round', view === 'round');
    els.body.classList.toggle('is-local', view === 'local');
    if (!chooser) els.title.textContent = view === 'drum' ? 'Chervil, in section' : view === 'round' ? 'Round the drum' : (data && data.local && data.local.title) || 'Here';
    if (view === 'drum') renderDrum();
    else if (view === 'round') renderRound();
    else renderPlan();
    if (sound) ctx.sfx('page');
  }

  function build() {
    const title = h('div', 'gr-sheet-title', chooser ? 'Where to' : '');
    const seg = chooser ? null : segmented({ opts: views(), value: view, label: 'Map view', onInput: (v) => setView(v, true) });
    const x = btn('gr-x', null, chooser ? 'Back' : 'Close');
    x.innerHTML = icon('close');
    x.addEventListener('click', () => close());
    const head = h('div', 'gr-book-head is-map', [
      h('div', 'gr-book-ht', [h('div', 'gr-kicker', chooser ? 'Cab · pick a block' : 'Map'), title]),
      seg ? h('div', 'gr-map-seg', seg.el) : null,
      h('div', 'gr-sheet-hx', [h('span', 'gr-key is-small gr-esc', 'Esc'), x]),
    ]);
    const planHost = h('div', 'gr-planhost');
    const zin = btn('gr-mtool', null, 'Closer');
    zin.innerHTML = icon('plus');
    const zout = btn('gr-mtool', null, 'Further');
    zout.innerHTML = icon('minus');
    const zme = btn('gr-mtool', null, 'Centre on me');
    zme.innerHTML = icon('target');
    zin.addEventListener('click', () => zoomAt(1.4));
    zout.addEventListener('click', () => zoomAt(1 / 1.4));
    zme.addEventListener('click', () => centreOnYou());
    const planTools = h('div', 'gr-mtools', [zin, zout, zme]);
    const scaleBar = h('div', 'gr-scale-b');
    const scaleT = h('div', 'gr-scale-t');
    const legend = h('div', 'gr-legend', [
      h('span', 'gr-lg is-you', [iconEl('arrow'), 'You']),
      h('span', 'gr-lg is-thread', [h('i', ''), 'Thread']),
      h('span', 'gr-lg is-place', [h('i', ''), 'Place']),
    ]);
    const planWrap = h('div', 'gr-planwrap', [planHost, planTools, h('div', 'gr-scale', [scaleBar, scaleT]), legend]);
    const drumHost = h('div', 'gr-drumhost');
    const drumSide = h('div', 'gr-drumside');
    const drumWrap = h('div', 'gr-drumwrap', [drumHost, drumSide]);
    const roundHost = h('div', 'gr-roundwrap');
    const body = h('div', 'gr-map-body', [planWrap, roundHost, drumWrap]);
    const panel = h('div', 'gr-book gr-panel gr-rise is-map' + (chooser ? ' is-chooser' : ''), [head, body]);
    planHost.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
    const pts = new Map();
    planHost.addEventListener('pointerdown', (e) => {
      try { planHost.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      drag = { pinch: pts.size === 2 ? distOf(pts) : 0 };
      planHost.classList.add('is-drag');
    });
    planHost.addEventListener('pointermove', (e) => {
      const p = pts.get(e.pointerId);
      if (!p || !drag) return;
      if (pts.size === 2) {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const d = distOf(pts);
        if (drag.pinch) zoomAt(d / drag.pinch);
        drag.pinch = d;
        return;
      }
      pan(e.clientX - p.x, e.clientY - p.y);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    });
    const up = (e) => { pts.delete(e.pointerId); if (!pts.size) { drag = null; planHost.classList.remove('is-drag'); } else drag = { pinch: 0 }; };
    planHost.addEventListener('pointerup', up);
    planHost.addEventListener('pointercancel', up);
    return { panel, body, title, seg, planHost, planTools, scaleBar, scaleT, drumHost, drumSide, roundHost, x };
  }

  function distOf(pts) {
    const a = Array.from(pts.values());
    return a.length < 2 ? 0 : Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
  }

  let rsz = 0;
  const onResize = () => {
    if (!els) return;
    if (view === 'local') applyVb();
    else if (view === 'round' && round) { cancelAnimationFrame(rsz); rsz = requestAnimationFrame(() => { if (round) round.resize(); }); }
  };

  function cycle() {
    const list = views().map((v) => v[0]);
    setView(list[(list.indexOf(view) + 1) % list.length], true);
    if (view === 'round' && round) round.focus();
  }

  function openWith(v) {
    els = build();
    round = null;
    handle = openScreen(ctx, {
      name: 'map', panel: els.panel, label: chooser ? 'Pick a block' : 'Map',
      focus: () => (view === 'round' && round ? round.grid : els.seg ? els.seg.ctl : els.x),
      key: (e) => {
        const k = e.key;
        if (!chooser && isKey(e, 'm')) { e.preventDefault(); close(); return true; }
        if (!chooser && isKey(e, 'v')) { e.preventDefault(); cycle(); return true; }
        if (els.seg && document.activeElement === els.seg.ctl && (k === 'ArrowLeft' || k === 'ArrowRight')) return false;
        if (view === 'round') return round ? round.key(e) : false;
        if (view !== 'local') return false;
        if (k === '+' || k === '=') { e.preventDefault(); zoomAt(1.3); return true; }
        if (k === '-' || k === '_') { e.preventDefault(); zoomAt(1 / 1.3); return true; }
        if (isKey(e, 'c') || k === '0') { e.preventDefault(); centreOnYou(); return true; }
        const step = 60;
        if (k === 'ArrowLeft' || isKey(e, 'a')) { e.preventDefault(); pan(step, 0); return true; }
        if (k === 'ArrowRight' || isKey(e, 'd')) { e.preventDefault(); pan(-step, 0); return true; }
        if (k === 'ArrowUp' || isKey(e, 'w')) { e.preventDefault(); pan(0, step); return true; }
        if (k === 'ArrowDown' || isKey(e, 's')) { e.preventDefault(); pan(0, -step); return true; }
        return false;
      },
      onClose: () => { handle = null; els = null; round = null; chooser = null; window.removeEventListener('resize', onResize); },
    });
    window.addEventListener('resize', onResize);
    setView(v, false);
    focusEl(view === 'round' && round ? round.grid : els.seg ? els.seg.ctl : els.x);
  }

  // open(view, { cell }): view is 'local' | 'round' | 'drum'; cell picks the block Round the drum shows first
  function open(v, o) {
    if (chooser) return;
    data = G.mapData() || {};
    if (o && o.cell && G.city()) { want = o.cell; v = 'round'; }
    if (handle) { setView(v || view, true); if (view === 'round' && round) round.focus(); return; }
    const hasLocal = data.local && (data.local.lines || []).length;
    openWith(v || (hasLocal || view !== 'local' ? view : 'drum'));
  }

  // The cab's chooser: Round the drum, where picking a block and pressing Go here resolves to its cell.
  function pick(o) {
    if (!G.city()) return Promise.resolve(null);
    if (handle) handle.close(null);
    chooser = { from: (o && o.from) || youCell(G.city()) || null };
    data = G.mapData() || {};
    openWith('round');
    const p = handle.promise;
    return p.then((c) => (c && isFinite(c.L) && isFinite(c.i) && isFinite(c.j) ? { L: c.L, i: c.i, j: c.j } : null));
  }

  function close() {
    if (handle) handle.close(null);
  }

  return { open, close, pick, get isOpen() { return !!handle; } };
}
