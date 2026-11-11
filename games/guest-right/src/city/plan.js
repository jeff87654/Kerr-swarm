// The plan of a generated block: where its court, hall, lobby, shops, special rooms and house rows go.
// Pure: the same cell always gives the same plan. Everything a builder needs is in absolute coordinates of the
// layer's frame (x spinward, z toward the back), so a lot module never needs to know how the block was laid out.
//
// A block is one cell of the grid (src/core/layout.js), about 210 m round by 208 m along:
//   - its AVENUE runs spinward through the middle (8 m wide, z = cell centre), its STREET along the axis (6 m wide);
//   - they cross in the COURT, an atrium two to six decks tall;
//   - the HALL (one long table) lies along the court's front side; LOTS line both sides of every arm.
// The canonical layout below is mirrored east-west and front-back by the cell's seed, so no two neighbours match.
//
// plan = { info, H (street ceiling), court: { x0, z0, x1, z1, decks, top, sides }, hall: lot, lots: [lot...], strips: [strip...],
//          exits: { spin, anti, back, front }: each { open, name (the next block), built }, avenue: { z, hw }, street: { x, hw } }
// lot  = { id, kind, use, x0, z0, x1, z1, front: 'n' | 's' | 'e' | 'w' (the side of the footprint its street or court is on:
//          n = low z, s = high z, w = low x, e = high x), onCourt: bool, seed, name?, trade? ... }
// strip = { axis: 'x' | 'z', side: -1 | +1 (which side of the street: low or high across it), a0, a1, front (the line the fronts stand on),
//           items: [{ a0, a1, kind: 'lot' | 'lotside' | 'houses' | 'pier', lot? }] }
import { BLOCK_Z, wrapI, J_MIN, J_MAX } from '../core/layout.js';
import { Rng } from '../core/util.js';
import { cellInfo } from './city.js';
import { TRADES } from '../content/city.js';

export const STREET_H = 3.4, AVE_HW = 4, ST_HW = 3, LOT_H = 3.2;

// rooms a block keeps besides its shops: [use, sign text, sub]
const ROOMS = {
  low: [['clinic', 'CLINIC', 'walk in'], ['choir', 'CHOIR ROOM', 'Tuesdays and Thursdays'], ['office', 'BLOCK OFFICE', 'the court clerk · the draws'], ['laundry', 'LAUNDRY', 'the night price after eleven'], ['nursery', 'THE WARM FLOOR', 'day nursery'], ['toys', 'TOYS ON LOAN', 'mended between borrowers']],
  middle: [['clinic', 'CLINIC', 'walk in'], ['choir', 'CHOIR ROOM', 'every evening somewhere'], ['office', 'BLOCK OFFICE', 'the court clerk · the draws'], ['laundry', 'LAUNDRY', 'the night price after eleven'], ['worlds', 'WORLD ROOM', 'slow worlds · a lamp for the lag'], ['letters', 'LETTER ROOM', 'read aloud, once']],
  high: [['clinic', 'CLINIC', 'bone days · walk in'], ['choir', 'ELDERS’ CHOIR', 'afternoons'], ['office', 'BLOCK OFFICE', 'the court clerk · the hour desk'], ['laundry', 'LAUNDRY', 'the night price after eleven'], ['tea', 'TEA DANCE', 'Thursdays · half a g'], ['notes', 'NOTE ROOM', 'the yearly notes come in here']],
};
// what the big special lots can be, by band: [kind, weight]. Lot modules register under 'special.<kind>' (see lots.js).
const SPECIAL_XL = { low: [['school', 3], ['baths', 2], ['playhall', 2], ['inn', 1], ['market', 1]], middle: [['workshops', 3], ['baths', 2], ['theatre', 1], ['reading', 2], ['market', 2]], high: [['garden', 3], ['baths', 2], ['reading', 2], ['dancehall', 2]] };
const SPECIAL_L = { low: [['dimwood', 2], ['square', 2], ['naming', 1], ['cradle', 1]], middle: [['dimwood', 2], ['square', 2], ['stillroom', 1], ['studio', 2]], high: [['dimwood', 2], ['square', 1], ['lamprow', 3], ['stillroom', 1]] };
function weighted(r, list) { let t = 0; for (const e of list) t += e[1]; let x = r.next() * t; for (const e of list) { x -= e[1]; if (x <= 0) return e[0]; } return list[0][0]; }

export function planCell(L, i, j) {
  const info = cellInfo(L, i, j), r = new Rng(info.seed ^ 0x2545f491);
  const HU = info.pitch / 2, HW = BLOCK_Z / 2, cx = info.x, cz = info.z;
  const fu = r.chance(0.5) ? 1 : -1, fw = r.chance(0.5) ? 1 : -1;
  const CW = [20, 24, 28][r.i(0, 2)], CN = 14, CS = r.chance(0.5) ? 14 : 20;
  const decks = Math.max(2, Math.min(info.decks, 2 + r.i(0, 4)));
  const lots = [], strips = [];
  let nid = 0;
  // ---- canonical (u, w) to the frame's (x, z), with the mirrors
  const X = (u) => cx + fu * u, Z = (w) => cz + fw * w;
  const frontMap = (f) => (f === 'n' ? (fw > 0 ? 'n' : 's') : f === 's' ? (fw > 0 ? 's' : 'n') : f === 'w' ? (fu > 0 ? 'w' : 'e') : (fu > 0 ? 'e' : 'w'));
  const lot = (kind, u0, w0, u1, w1, front, extra) => {
    const xa = X(u0), xb = X(u1), za = Z(w0), zb = Z(w1);
    const l = Object.assign({ id: info.key + '/' + kind + (nid++), kind, x0: Math.min(xa, xb), z0: Math.min(za, zb), x1: Math.max(xa, xb), z1: Math.max(za, zb), front: frontMap(front), seed: (info.seed ^ (nid * 2654435761)) >>> 0, onCourt: false }, extra);
    lots.push(l); return l;
  };
  // a strip along the avenue (axis x) or the street (axis z), with its items in canonical order
  const strip = (axis, side, items) => {
    const out = { axis, side: axis === 'x' ? side * fw : side * fu, items: [] };
    out.front = axis === 'x' ? cz + out.side * AVE_HW : cx + out.side * ST_HW;
    for (const it of items) {
      if (it.a1 - it.a0 < 0.05) continue;
      const m = axis === 'x' ? [X(it.a0), X(it.a1)] : [Z(it.a0), Z(it.a1)];
      out.items.push(Object.assign({}, it, { a0: Math.min(m[0], m[1]), a1: Math.max(m[0], m[1]) }));
    }
    out.items.sort((p, q) => p.a0 - q.a0);
    if (out.items.length) { out.a0 = out.items[0].a0; out.a1 = out.items[out.items.length - 1].a1; strips.push(out); }
    return out;
  };
  const trades = TRADES.slice(); for (let k = trades.length - 1; k > 0; k--) { const q = r.i(0, k); const t = trades[k]; trades[k] = trades[q]; trades[q] = t; }
  let ti = 0;
  const shopLot = (u0, w0, u1, w1, front, extra) => { const t = trades[ti++ % trades.length]; return lot('shop', u0, w0, u1, w1, front, Object.assign({ trade: t.id, tradeKind: t.kind, name: t.names[r.i(0, t.names.length - 1)], sub: t.sub }, extra)); };
  const rooms = ROOMS[info.band].slice(); for (let k = rooms.length - 1; k > 0; k--) { const q = r.i(0, k); const t = rooms[k]; rooms[k] = rooms[q]; rooms[q] = t; }
  let ri = 0;
  const roomLot = (u0, w0, u1, w1, front, extra) => { const t = rooms[ri++ % rooms.length]; return lot('room', u0, w0, u1, w1, front, Object.assign({ use: t[0], name: t[1], sub: t[2] }, extra)); };
  const D = 9.5;                                    // depth of an ordinary lot behind its front

  // ---- the hall along the court's front side, east of the street
  const hallLen = Math.min([56, 70, 84][r.i(0, 2)], HU - 9);
  const hall = lot('hall', 3.2, -27.5, 3.2 + hallLen, -CN, 's', { onCourt: true, courtSpan: [X(3.2), X(CW)].sort((a, b) => a - b), name: info.hall, cook: info.cook, dish: info.dish,
    kitchen: (() => { const a = X(18), b = X(42), c = Z(-34), d = Z(-27.5); return { x0: Math.min(a, b), x1: Math.max(a, b), z0: Math.min(c, d), z1: Math.max(c, d) }; })() });
  // ---- rooms on the court: one beside the hall, two on the back side
  const cnw = roomLot(-CW + 2, -27.5, -3.2, -CN, 's', { onCourt: true });
  const cbw = shopLot(-17, CS, -3.2, CS + 11, 'n', { onCourt: true }), cbe = shopLot(3.2, CS, 17, CS + 11, 'n', { onCourt: true });

  // ---- avenue, front side (toward the hall), spinward arm: shops, the lift lobby, a last shop, houses
  {
    const items = [{ a0: CW, a1: CW + 2, kind: 'pier' }]; let u = CW + 2;
    const nShops = 3 + (r.chance(0.5) ? 1 : 0);
    for (let k = 0; k < nShops; k++) { const w = r.f(8, 9.5); const l = shopLot(u, -AVE_HW - D, u + w, -AVE_HW, 's'); items.push({ a0: u, a1: u + w, kind: 'lot', lot: l.id }); u += w; }
    items.push({ a0: u, a1: u + 0.5, kind: 'pier' }); u += 0.5;
    const lobby = lot('lobby', u, -AVE_HW - D, u + 14, -AVE_HW, 's', { name: info.name.toUpperCase() + ' CORE' }); items.push({ a0: u, a1: u + 14, kind: 'lot', lot: lobby.id }); u += 14;
    if (HU - 0.6 - u > 13) { const w = r.f(8, 9.5); const l = shopLot(u, -AVE_HW - D, u + w, -AVE_HW, 's'); items.push({ a0: u, a1: u + w, kind: 'lot', lot: l.id }); u += w; }
    items.push({ a0: u, a1: HU - 0.6, kind: 'houses' }, { a0: HU - 0.6, a1: HU, kind: 'pier' });
    strip('x', -1, items);
  }
  // ---- avenue, front side, anti arm: two or three of the block's own rooms, then houses (and sometimes a big special at the far end)
  {
    const items = [{ a0: -CW - 2, a1: -CW, kind: 'pier' }]; let u = -CW - 2;
    const n = 2 + (r.chance(0.6) ? 1 : 0);
    for (let k = 0; k < n; k++) { const w = r.f(9, 11.5); const l = roomLot(u - w, -AVE_HW - D, u, -AVE_HW, 's'); items.push({ a0: u - w, a1: u, kind: 'lot', lot: l.id }); u -= w; }
    const far = -HU + 0.6;
    if (r.chance(0.55)) {
      const kind = weighted(r, SPECIAL_XL[info.band]);
      const l = lot('special', far + 0.4, -40, far + 36.4, -AVE_HW, 's', { special: kind, size: 'xl' });
      items.push({ a0: far + 36.4, a1: u, kind: 'houses' }, { a0: far + 0.4, a1: far + 36.4, kind: 'lot', lot: l.id }, { a0: far, a1: far + 0.4, kind: 'pier' });
    } else items.push({ a0: far, a1: u, kind: 'houses' });
    items.push({ a0: -HU, a1: far, kind: 'pier' });
    strip('x', -1, items);
  }
  // ---- avenue, back side, spinward arm: a shop, then the big special lot, then houses
  {
    const items = [{ a0: CW, a1: CW + 2, kind: 'pier' }];
    const s1 = shopLot(CW + 2, AVE_HW, CW + 12, AVE_HW + D, 'n'); items.push({ a0: CW + 2, a1: CW + 12, kind: 'lot', lot: s1.id });
    const kind = weighted(r, SPECIAL_XL[info.band]);
    const xl0 = 42, xl1 = Math.min(100, HU - 5);
    items.push({ a0: CW + 12, a1: xl0, kind: 'houses' });
    const l = lot('special', xl0, AVE_HW, xl1, 36, 'n', { special: kind, size: 'xl' }); items.push({ a0: xl0, a1: xl1, kind: 'lot', lot: l.id });
    items.push({ a0: xl1, a1: HU - 0.6, kind: 'houses' }, { a0: HU - 0.6, a1: HU, kind: 'pier' });
    strip('x', 1, items);
  }
  // ---- avenue, back side, anti arm: houses, the smaller special (a dim wood, a bright square), houses
  {
    const kind = weighted(r, SPECIAL_L[info.band]);
    const l = lot('special', -60, AVE_HW, -36, 24, 'n', { special: kind, size: 'l' });
    strip('x', 1, [{ a0: -CW - 2, a1: -CW, kind: 'pier' }, { a0: -36, a1: -CW - 2, kind: 'houses' }, { a0: -60, a1: -36, kind: 'lot', lot: l.id }, { a0: -HU + 0.6, a1: -60, kind: 'houses' }, { a0: -HU, a1: -HU + 0.6, kind: 'pier' }]);
  }
  // ---- street, back arm: the sides of the two court rooms, shops, then houses
  for (const side of [1, -1]) {
    const items = [{ a0: CS, a1: CS + 11, kind: 'lotside', lot: (side > 0 ? cbe : cbw).id }, { a0: CS + 11, a1: CS + 11.5, kind: 'pier' }]; let w = CS + 11.5;
    const n = 2 + (r.chance(0.5) ? 1 : 0);
    for (let k = 0; k < n; k++) { const len = r.f(8.5, 10); const l = side > 0 ? shopLot(ST_HW, w, ST_HW + 10, w + len, 'w') : shopLot(-ST_HW - 10, w, -ST_HW, w + len, 'e'); items.push({ a0: w, a1: w + len, kind: 'lot', lot: l.id }); w += len; }
    items.push({ a0: w, a1: HW - 0.6, kind: 'houses' }, { a0: HW - 0.6, a1: HW, kind: 'pier' });
    strip('z', side, items);
  }
  // ---- street, front arm: the hall's end on one side, the court room's side on the other, houses beyond
  strip('z', 1, [{ a0: -HW, a1: -HW + 0.6, kind: 'pier' }, { a0: -HW + 0.6, a1: -28, kind: 'houses' }, { a0: -28, a1: -27.5, kind: 'pier' }, { a0: -27.5, a1: -CN, kind: 'lotside', lot: hall.id }]);
  strip('z', -1, [{ a0: -HW, a1: -HW + 0.6, kind: 'pier' }, { a0: -HW + 0.6, a1: -28, kind: 'houses' }, { a0: -28, a1: -27.5, kind: 'pier' }, { a0: -27.5, a1: -CN, kind: 'lotside', lot: cnw.id }]);

  // ---- the court and what stands on each of its sides (spans in absolute coordinates, low to high)
  const xa = X(-CW), xb = X(CW), za = Z(-CN), zb = Z(CS);
  const court = { x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: Math.min(za, zb), z1: Math.max(za, zb), decks, top: decks * 4 - 0.6, style: info.style, sides: {} };
  const spanX = (list) => list.map((q) => { const a = X(q[0]), b = X(q[1]); return { a0: Math.min(a, b), a1: Math.max(a, b), kind: q[2], lot: q[3] }; }).sort((p, q) => p.a0 - q.a0);
  const spanZ = (list) => list.map((q) => { const a = Z(q[0]), b = Z(q[1]); return { a0: Math.min(a, b), a1: Math.max(a, b), kind: q[2], lot: q[3] }; }).sort((p, q) => p.a0 - q.a0);
  const frontSide = spanX([[-CW, -CW + 2, 'wall'], [-CW + 2, -3.2, 'lot', cnw.id], [-3.2, -3, 'wall'], [-3, 3, 'street'], [3, 3.2, 'wall'], [3.2, CW, 'lot', hall.id]]);
  const backSide = spanX([[-CW, -17, 'wall'], [-17, -3.2, 'lot', cbw.id], [-3.2, -3, 'wall'], [-3, 3, 'street'], [3, 3.2, 'wall'], [3.2, 17, 'lot', cbe.id], [17, CW, 'wall']]);
  const sideSpans = () => spanZ([[-CN, -AVE_HW, 'wall'], [-AVE_HW, AVE_HW, 'street'], [AVE_HW, CS, 'wall']]);
  court.sides[fw > 0 ? 'n' : 's'] = frontSide; court.sides[fw > 0 ? 's' : 'n'] = backSide; court.sides.w = sideSpans(); court.sides.e = sideSpans();

  // ---- the ways out, and who is there
  const nb = (di, dj) => { const jj = j + dj; if (jj < J_MIN || jj > J_MAX) return { open: false, cap: dj < 0 ? 'front' : 'back' }; const c = cellInfo(L, wrapI(L, i + di), jj); return { open: true, name: c.name, built: c.built, cell: { L, i: c.i, j: jj } }; };
  const exits = { spin: nb(1, 0), anti: nb(-1, 0), back: nb(0, 1), front: nb(0, -1) };
  if (exits.back.built) exits.back.open = false;          // Candlewick has no way out at its front: its hall is there
  // a block beside one built by hand begins at that block's arch (Candlewick's stand at x = -105 and 105, z = 104)
  const avenue = { z: cz, hw: AVE_HW, x0: cx - HU, x1: cx + HU }, st = { x: cx, hw: ST_HW, z0: cz - HW, z1: cz + HW };
  const arch = (ex, k) => { const a = ex.built && ex.cell ? cellInfo(ex.cell.L, ex.cell.i, ex.cell.j).arches : null; return a && a[k] !== undefined ? a[k] : null; };
  { const a = arch(exits.anti, 'spin'); if (a !== null) avenue.x0 = a; }
  { const a = arch(exits.spin, 'anti'); if (a !== null) avenue.x1 = a; }
  { const a = arch(exits.front, 'back'); if (a !== null) st.z0 = a; }
  return { info, H: STREET_H, court, hall, lots, strips, exits, avenue, street: st, cx, cz, HU, HW, fu, fw };
}
