// The lamp garden of a High-deck block: where the old of the block garden. A low entrance under a portico, a tall room
// beyond it (two decks high, to y = 6.8) with arcaded aisles either side, pools of lamplight with dark between them, a
// waist-high bed under every lamp so nobody has to bend, benches round each, a slow walk with handrails, a rill down the
// middle that ends in a basin you can drink from standing, fruit trained on wires along the back wall under its own
// lamps, and a potting bench in one aisle.
import { say, note } from '../city/lots.js';
import { column, railing } from '../world/kit2.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { local, pick, sitAWhile, brightFront, wallRailQ, noticeBoard } from './lots_quiet_kit.js';

const NAMES = ['THE LAMP GARDEN', 'SLOW GARDEN', 'THE OLD GARDEN', 'POOL GARDEN', 'THE WAIST BEDS', 'APPLE WIRES'];
const BEDS = ['salad', 'herbs', 'flowers', 'tomato', 'strawberry', 'climbers', 'greens', 'flowers'];
const WOOD = ['#7a5233', '#8a6240', '#6b4a2f', '#9a6a40', '#5b4030'];
const PAINT = ['#c9552e', '#2f6f73', '#d6a640', '#5b3a6e', '#6b7a3a', '#a8412b', '#33407a', '#8a2f3c', '#3f7f6a'];

export async function buildGarden(s, lot, plan, game, tick) {
  const r = new Rng(lot.seed), info = plan.info, HL = 3.4, HT = 6.8;
  const L = local(s, lot, r.chance(0.5)), g = L.g, W = L.W, D = L.D;
  const name = NAMES[r.i(0, NAMES.length - 1)];
  const nice = name.split(' ').map((w) => (w === 'THE' ? 'The' : w.charAt(0) + w.slice(1).toLowerCase())).join(' ');
  const A = 4.0, QF = 4.6, dP = W / 2 + r.f(-4, 4);                                   // aisle width; depth of the entrance band
  const clip = L.clip(0.1, 0.4, W - 0.1, D - 0.1, -0.3, HT + 0.1, 0.05);
  const gS = info.g.toFixed(2);

  // ---------------- the shell ----------------
  L.floor(0, 0.3, W, D, 0, 'stone', '#b9ae98');
  // the party walls, low along the aisles and the entrance, two decks tall behind the garden
  const wl = { mat: 'plaster', tint: '#e2d6bc', dado: { h: 1.0, mat: 'wood', tint: '#5b4030' } };
  L.wallQ(0.08, 0.3, D, 0, HL, wl); L.wallQ(W - 0.08, 0.3, D, 0, HL, wl);
  L.wallP(D - 0.08, 0, A + 0.1, 0, HL, wl); L.wallP(D - 0.08, W - A - 0.1, W, 0, HL, wl);
  L.wallP(D - 0.08, A + 0.1, W - A - 0.1, 0, HL, { mat: 'block', tint: '#6a5a48', skirt: false });
  L.wallP(D - 0.08, A, W - A, HL, HT - HL, { mat: 'plaster', tint: '#8f8470', skirt: false });
  await tick();
  // ceilings: low over the entrance and the aisles, high over the garden
  L.ceil(0, 0.3, W, QF, HL, 'paint', '#e9dfcc'); L.ceil(0, QF, A, D, HL, 'paint', '#e9dfcc'); L.ceil(W - A, QF, W, D, HL, 'paint', '#e9dfcc');
  L.ceil(A, QF, W - A, D, HT, 'paint', '#3a3a34');
  // the faces where the ceiling steps up, and the beams on the colonnades
  g.mat('plaster', '#cfc2a6');
  L.box(A - 0.15, HL, QF - 0.15, A + 0.15, HT, D - 0.1, { faces: 'P' }); L.box(W - A - 0.15, HL, QF - 0.15, W - A + 0.15, HT, D - 0.1, { faces: 'p' });
  L.box(A, HL, QF - 0.15, W - A, HT, QF + 0.15, { faces: 'Q' });
  s.flush({ tier: 's' });
  g.mat('wood', '#5b4030');
  L.box(A - 0.2, 2.95, QF - 0.2, A + 0.2, HL, D - 0.1, { faces: 'ypP', bevel: 0.01 }); L.box(W - A - 0.2, 2.95, QF - 0.2, W - A + 0.2, HL, D - 0.1, { faces: 'ypP', bevel: 0.01 });
  L.box(0.1, 2.95, QF - 0.2, W - 0.1, HL, QF + 0.2, { faces: 'yqQ', bevel: 0.01 });
  s.flush({ tier: 's' });
  const cols = [];
  for (let q = QF + 4.2; q < D - 1.5; q += 4.4) cols.push([A, q], [W - A, q]);
  const nf = Math.max(2, Math.round((W - 2 * A) / 5));
  for (let k = 1; k < nf; k++) { const cp = A + (W - 2 * A) * k / nf; if (Math.abs(cp - dP) > 2.2) cols.push([cp, QF]); }
  cols.push([A, QF], [W - A, QF]);
  for (const c of cols) { const a = L.P(c[0], c[1]); column(s, a[0], 0, a[1], 2.95, { r: 0.16, tint: '#c9bda6' }); }
  // the high ceiling's beams, dark, with the lamp rods hung from them
  for (let q = QF + 3; q < D - 1; q += 3.4) { g.mat('wood', '#3f3226'); L.box(A, HT - 0.4, q - 0.12, W - A, HT, q + 0.12, { faces: 'yqQ' }); s.flush({ tier: 's' }); }
  await tick();

  // ---------------- the front ----------------
  const fin = { mat: 'plaster', tint: '#6b7a3a', dado: { h: 1.0, mat: 'tile', tint: '#3a2a20' }, trim: '#efe2c6', pil: '#d4c7ae', bar: '#2f2a22', step: '#c9bda6', sillT: '#8a6240' };
  await brightFront(L, plan, { doorP: dP, doorW: 3.6, fin, H: HL, name, sub: 'pooled light · beds at waist height', palette: ['#2f3a22', '#f6ecd0', '#e8c26a'], sill: 0.8, inner: { mat: 'plaster', tint: '#e2d6bc', dado: { h: 1.0, mat: 'wood', tint: '#5b4030' } } }, tick);
  await tick();

  // ---------------- the plan of the garden: pools in two rows, walks between, the rill down the middle ----------------
  const mid = W / 2;
  const nCol = Math.max(2, 2 * Math.round((W - 2 * A - 6) / 22)), qa = QF + (D - QF) * 0.32, qb = QF + (D - QF) * 0.66;
  const pools = [];
  for (let k = 0; k < nCol; k++) { const p = A + (W - 2 * A) * (k + 0.5) / nCol; pools.push([p, qa], [p, qb]); }
  const QW0 = QF + 2.2, QW1 = D - 3.4, QWM = (qa + qb) / 2, PW0 = A + 1.6, PW1 = W - A - 1.6;
  // dark ground between the pools: mulch, moss, low ferns
  g.mat('soil', '#4a3d30'); L.box(A + 0.2, 0, QF + 0.3, W - A - 0.2, 0.006, D - 0.2, { faces: 'Y' }); s.flush({ tier: 's', cast: false });
  // the walks: pale paving, a loop with a cross-walk between the rows and one down the middle beside the rill
  const walk = (p0, q0, p1, q1) => { g.mat('stone', '#ddd3bd'); L.box(Math.min(p0, p1) - 0.8, 0, Math.min(q0, q1) - 0.8, Math.max(p0, p1) + 0.8, 0.012, Math.max(q0, q1) + 0.8, { faces: 'Y' }); g.mat('stone', '#a89c84'); L.box(Math.min(p0, p1) - 0.85, 0, Math.min(q0, q1) - 0.85, Math.max(p0, p1) + 0.85, 0.009, Math.max(q0, q1) + 0.85, { faces: 'Y' }); s.flush({ tier: 's', cast: false }); };
  walk(PW0, QW0, PW1, QW0); walk(PW0, QW1, PW1, QW1); walk(PW0, QW0, PW0, QW1); walk(PW1, QW0, PW1, QW1); walk(PW0, QWM, PW1, QWM);
  walk(dP, 0.6, dP, QW0);
  for (let k = 0; k < 60; k++) { const p = r.f(A + 0.5, W - A - 0.5), q = r.f(QF + 0.6, D - 1.8); const onWalk = Math.abs(q - QW0) < 1.2 || Math.abs(q - QW1) < 1.2 || Math.abs(q - QWM) < 1.2 || Math.abs(p - PW0) < 1.2 || Math.abs(p - PW1) < 1.2 || Math.abs(p - mid) < 0.9 || pools.some((pl) => Math.abs(p - pl[0]) < 2.4 && Math.abs(q - pl[1]) < 2.6); if (onWalk) continue; g.mat('grass', mixHex('#3f5a2e', '#5f7a3a', r.next())); L.ball(p, -0.02, q, r.f(0.4, 0.9), 0.07, { segs: 8, rings: 3, bottom: 0 }); if (k % 10 === 0) s.flush({ tier: 's', cast: false }); }
  s.flush({ tier: 's', cast: false });
  await tick();

  // ---------------- a pool of light: a waist-high bed, a lamp high over it, benches round it ----------------
  const seats = [];
  for (let k = 0; k < pools.length; k++) {
    const [p, q] = pools[k], kind = BEDS[(k + r.i(0, 7)) % BEDS.length], bw = 3.2, bd = 1.4, bh = 0.8;
    const wood = WOOD[k % WOOD.length];
    L.block(p - bw / 2, 0, q - bd / 2, p + bw / 2, bh - 0.06, q + bd / 2, 'wood', wood, { bevel: 0.02 });
    g.mat('wood', shadeHex(wood, 1.25)); L.box(p - bw / 2 - 0.06, bh - 0.06, q - bd / 2 - 0.06, p + bw / 2 + 0.06, bh, q + bd / 2 + 0.06, { bevel: 0.012 });
    g.mat('soil', '#5b4a3a'); L.box(p - bw / 2 + 0.06, bh - 0.03, q - bd / 2 + 0.06, p + bw / 2 - 0.06, bh - 0.01, q + bd / 2 - 0.06, { faces: 'Y' });
    s.flush({ tier: 's', cast: true });
    bedPlants(L, r, kind, p, q, bw, bd, bh - 0.02);
    for (const e of [-1, 1]) L.prop('lots-quiet.shrub', p + e * (bw / 2 - 0.3), bh - 0.02, q + r.f(-0.2, 0.2), r.f(0, 6.28), { s: +(r.f(0.6, 0.9)).toFixed(1), v: (k + e + 2) % 3, kind: kind === 'flowers' ? 'blossom' : 'leafA' }, { noCollide: true });
    // a label on the bed's end
    g.mat('paint', PAINT[(k * 3) % PAINT.length]); L.box(p + bw / 2 + 0.06, 0.5, q - 0.12, p + bw / 2 + 0.075, 0.68, q + 0.12); s.flush({ tier: 'd', cast: false });
    // the lamp: a wide shade high up on a long rod
    const ly = 5.4;
    g.mat('cast', '#2a2622'); L.tube([[p, HT - 0.4, q], [p, ly + 0.3, q]], 0.008, { segs: 4, caps: false });
    g.mat('cast', ['#2f4f43', '#5a2e22', '#33407a', '#6b7a3a'][k % 4]); L.lathe(p, q, [[0.06, ly + 0.3], [0.12, ly + 0.28], [0.55, ly + 0.02], [0.6, ly], [0.56, ly], [0.11, ly + 0.25]], { segs: 18 });
    g.mat('diffuser', '#fff1d8', { emissive: 7, lamp: true }); L.cyl(p, ly + 0.01, q, 0.5, 0.01, { segs: 16 });
    s.flush({ tier: 's', cast: false });
    L.light({ at: [p, ly - 0.05, q], type: 'spot', dir: [0, -1, 0], cone: [36, 20], color: ['#fff0d6', '#ffe8c8', '#fff6e6'][k % 3], power: 52, range: 8.5, clip, lamp: true, shadow: true });
    // benches on both long sides, facing the bed
    for (const sg of [-1, 1]) {
      const bq = q + sg * 1.85, bwid = 2.6;
      L.prop('bench', p, 0, bq, L.yaw(0, -sg), { w: bwid, back: true, wood: WOOD[(k + (sg > 0 ? 2 : 0)) % WOOD.length], metal: '#2f3a36' }, { noSpots: true });
      for (const u of [-0.85, 0, 0.85]) seats.push([p + u, bq, 0, -sg]);
      // arms to push up on: a rail post at each end
      g.mat('cast', '#2f3a36'); for (const e of [-bwid / 2 - 0.12, bwid / 2 + 0.12]) L.tube([[p + e, 0, bq], [p + e, 0.75, bq], [p + e * 0.92, 0.82, bq]], 0.016, { segs: 5 });
      g.mat('wood', '#b98a5a'); for (const e of [-bwid / 2 - 0.12, bwid / 2 + 0.12]) L.ball(p + e * 0.96, 0.82, bq, 0.035, 0.03, { segs: 8, rings: 5 });
      s.flush({ tier: 'd', cast: true });
    }
    await tick();
  }
  seats.forEach((st) => L.spot('sit', st[0], 0.46, st[1], L.yaw(st[2], st[3]), { tags: ['garden', 'elders', 'quiet'] }));

  // ---------------- the rill: a slot in the paving from the back wall to a basin you can drink from standing ----------------
  const rq0 = QW0 + 1.4, rq1 = D - 1.2;
  g.mat('stone', '#8a8070'); L.box(mid - 0.24, 0, rq0, mid - 0.16, 0.02, rq1, { faces: 'YpP' }); L.box(mid + 0.16, 0, rq0, mid + 0.24, 0.02, rq1, { faces: 'YpP' });
  g.mat('plain', '#25403b', { rough: -0.5 }); L.box(mid - 0.16, 0, rq0, mid + 0.16, 0.008, rq1, { faces: 'Y' });
  g.mat('plain', '#9fd0c6', { rough: -0.5, emissive: 0.15 }); for (let q = rq0 + 0.4; q < rq1; q += r.f(0.9, 1.6)) L.box(mid - 0.12, 0.009, q, mid + 0.12, 0.0095, q + 0.05, { faces: 'Y' });
  s.flush({ tier: 's', cast: false });
  // its head: a stone lip in the back wall
  L.block(mid - 0.6, 0, D - 0.5, mid + 0.6, 0.55, D - 0.1, 'stone', '#9b917c', { bevel: 0.02 });
  g.mat('cast', '#a8823f', { rough: -0.2 }); L.tube([[mid, 0.45, D - 0.5], [mid, 0.42, D - 0.68]], 0.025, { segs: 8 });
  g.mat('plain', '#d6efe6', { rough: -0.5, emissive: 0.2 }); L.box(mid - 0.01, 0.01, D - 0.72, mid + 0.01, 0.42, D - 0.69);
  s.flush({ tier: 's', cast: false });
  // the basin at the foot, at the height of your hand, with a cup on a chain
  const bq = rq0 - 0.55;
  g.mat('stone', '#bfb19a'); L.lathe(mid, bq, [[0.3, 0], [0.3, 0.1], [0.2, 0.2], [0.17, 0.7], [0.26, 0.76]], { segs: 16 });
  g.mat('stone', '#d4c7ae'); L.lathe(mid, bq, [[0.26, 0.76], [0.42, 0.8], [0.46, 0.9], [0.44, 0.92], [0.36, 0.86], [0, 0.84]], { segs: 20 });
  g.mat('plain', '#4f8a86', { rough: -0.5 }); L.cyl(mid, 0.875, bq, 0.37, 0.004, { segs: 16 });
  g.mat('cast', '#b08a45'); L.tube([[mid, 0.85, bq + 0.42], [mid, 1.1, bq + 0.42], [mid, 1.12, bq + 0.3]], 0.016, { segs: 6 });
  g.mat('glaze', '#e9e2d0'); L.lathe(mid + 0.38, bq - 0.18, [[0, 0.9], [0.03, 0.9], [0.04, 0.98], [0.037, 0.982], [0.028, 0.91], [0, 0.908]], { segs: 10 });
  g.mat('cast', '#9c978d'); L.tube([[mid + 0.3, 0.88, bq - 0.1], [mid + 0.36, 0.86, bq - 0.16], [mid + 0.38, 0.99, bq - 0.18]], 0.004, { segs: 3 });
  s.flush({ tier: 's', cast: true }); L.post(mid, bq, 0.46, 0, 0.92);
  L.light({ at: [mid, 2.4, bq], type: 'spot', dir: [0, -1, 0], cone: [30, 16], color: '#e8f4ff', power: 9, range: 4, clip, lamp: true });
  L.loop('fountain', mid, 0.9, bq, { vol: 0.22, radius: 7 });
  L.loop('water-lap', mid, 0.3, D - 0.8, { vol: 0.18, radius: 6 });
  await tick();

  // ---------------- handrails along the walks ----------------
  const rail = (pts) => railing(s, pts.map((v) => L.P(v[0], v[1])), 0, { h: 0.92, tint: '#2f3a36', rail: '#b98a5a', posts: 1.6 });
  for (const q of [QW0 - 0.85, QW1 + 0.85]) {
    // in runs with gaps for the walks off them
    const gaps = [dP, mid].sort((a, b) => a - b);
    let p0 = PW0 - 0.85;
    for (const gp of gaps) { if (gp - 1.0 > p0 + 0.6) rail([[p0, q], [gp - 1.0, q]]); p0 = gp + 1.0; }
    if (PW1 + 0.85 > p0 + 0.6) rail([[p0, q], [PW1 + 0.85, q]]);
  }
  for (const p of [PW0 - 0.85, PW1 + 0.85]) { rail([[p, QW0 + 1.0], [p, QWM - 1.0]]); rail([[p, QWM + 1.0], [p, QW1 - 1.0]]); }
  // small lamps set in the paving at the walks' edges, so the dark between the pools is never a guess
  g.mat('diffuser', '#ffe2b0', { emissive: 1.6, lamp: true });
  for (const q of [QW0, QWM, QW1]) for (let p = PW0; p <= PW1; p += 3.2) for (const sg of [-1, 1]) L.box(p - 0.05, 0.012, q + sg * 0.78 - 0.05, p + 0.05, 0.02, q + sg * 0.78 + 0.05, { faces: 'Y' });
  for (const p of [PW0, PW1]) for (let q = QW0 + 1.6; q <= QW1 - 1; q += 3.2) for (const sg of [-1, 1]) L.box(p + sg * 0.78 - 0.05, 0.012, q - 0.05, p + sg * 0.78 + 0.05, 0.02, q + 0.05, { faces: 'Y' });
  s.flush({ tier: 'd', cast: false });
  await tick();

  // ---------------- fruit on wires along the back wall, under its own lamps ----------------
  const eq = D - 0.45, e0 = A + 0.8, e1 = W - A - 0.8;
  g.mat('wood', '#6b4a2f'); for (let p = e0; p <= e1 + 0.01; p += (e1 - e0) / Math.max(1, Math.round((e1 - e0) / 3))) L.box(p - 0.05, 0, eq - 0.05, p + 0.05, 3.3, eq + 0.05, { bevel: 0.01 });
  g.mat('cast', '#9c978d'); for (const y of [0.7, 1.25, 1.8, 2.35, 2.9]) L.tube([[e0, y, eq], [e1, y, eq]], 0.004, { segs: 3, caps: false });
  s.flush({ tier: 's', cast: false });
  let apples = 0, pears = 0;
  const nTrees = Math.max(4, Math.floor((e1 - e0) / 3.2));
  for (let t = 0; t < nTrees; t++) {
    if (Math.abs(e0 + (e1 - e0) * (t + 0.5) / nTrees - mid) < 1.2) continue;
    const p = e0 + (e1 - e0) * (t + 0.5) / nTrees, pear = (t + lot.seed) % 3 === 0;
    g.mat('bark', '#ffffff'); L.tube([[p, 0, eq - 0.08], [p + 0.02, 1.2, eq - 0.08], [p, 2.9, eq - 0.08]], [0.07, 0.05, 0.03], { segs: 6 });
    for (const y of [0.7, 1.25, 1.8, 2.35]) for (const sg of [-1, 1]) {
      const len = r.f(1.0, 1.4);
      g.mat('bark', '#d8ccc0'); L.tube([[p, y - 0.12, eq - 0.08], [p + sg * 0.25, y, eq - 0.08], [p + sg * len, y + 0.02, eq - 0.08]], [0.03, 0.022, 0.012], { segs: 4 });
      for (let j = 0; j < 4; j++) { g.mat('leafA', mixHex('#ffffff', '#d8eab0', r.next() * 0.4), { sway: 0.2 }); L.card(p + sg * r.f(0.2, len), y - 0.15, eq - r.f(0.12, 0.2), 0.3, 0.32, L.yaw(0, -1) + r.f(-0.5, 0.5), { tilt: r.f(-0.3, 0.3) }); }
    }
    // the fruit: few, and counted
    const nfr = r.i(0, 3);
    for (let j = 0; j < nfr; j++) {
      const y = [0.7, 1.25, 1.8, 2.35][r.i(0, 3)] - 0.12, x = p + r.sign() * r.f(0.3, 1.0);
      if (pear) { g.mat('glaze', '#c8b84a', { rough: -0.2 }); L.ball(x, y, eq - 0.16, 0.035, 0.05, { segs: 8, rings: 6 }); pears++; }
      else { g.mat('glaze', j % 2 ? '#b8302a' : '#c84a2a', { rough: -0.25 }); L.ball(x, y, eq - 0.16, 0.04, 0.038, { segs: 8, rings: 6 }); apples++; }
    }
    s.flush({ tier: 'd', cast: true });
  }
  if (apples === 0) { g.mat('glaze', '#b8302a', { rough: -0.25 }); L.ball(e0 + 1.0, 1.13, eq - 0.16, 0.04, 0.038, { segs: 8, rings: 6 }); apples = 1; s.flush({ tier: 'd' }); }
  // their own lamps: a long fitting on brackets above the wires
  g.mat('cast', '#2a2622'); L.box(e0, 3.55, eq - 0.55, e1, 3.62, eq - 0.35, { faces: 'yYqQ' });
  g.mat('diffuser', '#fff4e0', { emissive: 2.2, lamp: true }); L.box(e0, 3.545, eq - 0.53, e1, 3.55, eq - 0.37, { faces: 'y' });
  for (let p = e0; p <= e1; p += 3) { g.mat('cast', '#2a2622'); L.tube([[p, 3.58, eq - 0.06], [p, 3.58, eq - 0.45]], 0.01, { segs: 4 }); }
  s.flush({ tier: 's', cast: false });
  const nl = Math.max(2, Math.round((e1 - e0) / 16));
  for (let k = 0; k < nl; k++) { const a = e0 + (e1 - e0) * k / nl, b = e0 + (e1 - e0) * (k + 1) / nl; L.light({ at: [a + 0.5, 3.45, eq - 0.6], to: [b - 0.5, 3.45, eq - 0.6], type: 'tube', color: '#fff2dc', power: 3.6, range: 4.0, radius: 0.15, clip, lamp: true, shadow: true }); }
  await tick();

  // ---------------- the aisles: the potting bench on one side, seats and tea on the other ----------------
  const pa = dP > W / 2 ? A / 2 : W - A / 2, pdir = pa < W / 2 ? -1 : 1, pq = QF + (D - QF) * 0.45;
  const pwall = pa + pdir * (A / 2 - 0.1);
  L.prop('counter', pwall - pdir * 0.4, 0, pq, L.yaw(-pdir, 0), { w: 3.6, d: 0.7, h: 0.88, body: '#5b4030', top: '#a8794f' });
  for (let k = 0; k < 6; k++) L.prop('court.pot', pwall - pdir * 0.4 + r.f(-0.15, 0.15), 0.88, pq - 1.5 + k * 0.6, r.f(0, 6), { size: r.f(0.3, 0.5), kind: ['fine', 'broad', 'flower', 'fern'][k % 4], pot: ['#a3563a', '#8a5a3c', '#c9a27a'][k % 3] }, { noCollide: true });
  L.prop('lots-quiet.tools', pwall - pdir * 0.3, 0.88, pq + 1.4, r.f(0, 6), {}, { noCollide: true });
  L.prop('crock', pwall - pdir * 0.55, 0.88, pq + 0.9, 0, { glaze: '#3a2a20', h: 0.3, r: 0.12 }, { noCollide: true });
  L.prop('shelving', pwall - pdir * 0.12, 0, pq + 3.2, L.yaw(-pdir, 0), { w: 2.0, h: 2.0, d: 0.3, shelves: 4, wood: '#6b4a2f', back: true });
  for (let k = 0; k < 6; k++) L.prop('crock', pwall - pdir * 0.2, 0.42 + Math.floor(k / 3) * 0.5, pq + 2.6 + (k % 3) * 0.55, 0, { glaze: ['#a3563a', '#c9a27a', '#6b7a3a'][k % 3], h: 0.2, r: 0.08 }, { noCollide: true });
  L.prop('lots-quiet.can', pwall - pdir * 1.1, 0, pq - 2.4, L.yaw(-pdir, 0), { c: '#5f7a6a' }); L.prop('lots-quiet.can', pwall - pdir * 1.2, 0, pq - 2.0, L.yaw(-pdir, 0.4), { c: '#a8412b' });
  L.prop('stool', pwall - pdir * 1.15, 0, pq + 0.4, 0, { wood: '#7a5a3a', h: 0.62 }, { noSpots: true });
  L.spot('work', pwall - pdir * 1.0, 0, pq - 0.5, L.yaw(pdir, 0), { tags: ['garden', 'notes', 'potting'] });
  L.lamp('globe', pa, HL, pq, { drop: 0.55, K: 3200, power: 0.9, clip, range: 6 });
  // the other aisle: benches facing the garden through the arches, a tea cupboard
  const sa = W - pa, sdir = -pdir, swall = sa + sdir * (A / 2 - 0.1);
  for (let q = QF + 2.2; q < D - 2; q += 4.4) {
    L.prop('bench', swall - sdir * 0.45, 0, q, L.yaw(-sdir, 0), { w: 2.2, back: true, wood: WOOD[r.i(0, 4)], metal: '#2f3a36' }, { noSpots: true });
    for (const u of [-0.6, 0.6]) L.spot('sit', swall - sdir * 0.45, 0.46, q + u, L.yaw(-sdir, 0), { tags: ['garden', 'elders'] });
  }
  wallRailQ(L, swall + sdir * 0.08, QF + 0.6, D - 0.6, sdir, { y: 0.9 });
  wallRailQ(L, pwall + pdir * 0.08, QF + 0.6, pq - 2.6, pdir, { y: 0.9 });
  L.prop('counter', swall - sdir * 0.35, 0, D - 1.4, L.yaw(-sdir, 0), { w: 1.4, d: 0.55, h: 0.9, body: '#3f4f2a', top: '#b98a5a' });
  g.mat('cast', '#b08a45', { rough: -0.2 }); L.lathe(swall - sdir * 0.35, D - 1.65, [[0, 0.9], [0.13, 0.9], [0.14, 1.2], [0.12, 1.32], [0.05, 1.36], [0, 1.37]], { segs: 14 }); s.flush({ tier: 'd' });
  for (let k = 0; k < 4; k++) L.prop('cup', swall - sdir * 0.4, 0.9, D - 1.3 + k * 0.1, 0, { glaze: ['#e9e2d0', '#d9c7a6'][k % 2], lid: PAINT[k] }, { noCollide: true });
  L.lamp('globe', sa, HL, (QF + D) / 2, { drop: 0.55, K: 2700, power: 0.8, clip, range: 7 });
  // the entrance: a bench, sticks on pegs, big pots
  g.mat('wood', '#5b4030'); L.box(0.18, 1.55, 1.2, 0.24, 1.62, 3.4); s.flush({ tier: 'd' });
  for (let k = 0; k < 5; k++) { g.mat('wood', WOOD[k % 5]); L.tube([[0.27, 1.6, 1.4 + k * 0.45], [0.33, 0.05, 1.45 + k * 0.45]], 0.014, { segs: 5 }); } s.flush({ tier: 'd' });
  for (const pp of [[1.0, QF - 0.9], [W - 1.0, QF - 0.9], [dP - 2.8, 1.2], [dP + 2.8, 1.2]]) L.prop('plant', pp[0], 0, pp[1], r.f(0, 6), { kind: r.chance(0.5) ? 'broad' : 'fine', size: r.f(1.3, 1.7), pot: PAINT[r.i(0, 8)] });
  L.lamp('globe', dP - 3.5, HL, QF / 2 + 0.2, { drop: 0.5, K: 2900, power: 0.9, clip, range: 7 }); L.lamp('globe', dP + 3.5, HL, QF / 2 + 0.2, { drop: 0.5, K: 2900, power: 0.9, clip, range: 7 });
  L.ambient(A, 0, QF, W - A, HT, D, { sky: '#4a5248', ground: '#4a3d30', power: 0.17, lamp: true, soft: 0.8, spec: 0.3 });
  // a faint warm wash on the high walls, so the height is felt in the dark
  for (const pp of [A + 0.4, W - A - 0.4]) L.light({ at: [pp, HT - 0.5, QF + 2], to: [pp, HT - 0.5, D - 1.5], type: 'tube', color: '#ffd9a8', power: 0.8, range: 3.0, radius: 0.3, clip, lamp: true, nospec: true });
  L.glow(0, 0, 0.4, W, HL, QF, { sky: '#ffe7c4', ground: '#b9ae98', power: 0.3 });
  L.glow(0, 0, QF, A, HL, D, { sky: '#ffe7c4', ground: '#b9ae98', power: 0.18 }); L.glow(W - A, 0, QF, W, HL, D, { sky: '#ffe7c4', ground: '#b9ae98', power: 0.18 });
  await tick();

  // ---------------- people and walkways ----------------
  L.path([[dP, 1.2], [dP, QW0]], { width: 1.6, tags: ['garden'] });
  L.path([[PW0, QW0], [dP, QW0], [mid, QW0], [PW1, QW0], [PW1, QWM], [PW1, QW1], [mid, QW1], [PW0, QW1], [PW0, QWM], [PW0, QW0]], { width: 1.5, tags: ['garden'] });
  L.path([[PW0, QWM], [PW1, QWM]], { width: 1.4 });
  L.path([[mid, QW0], [mid, bq - 0.7]], { width: 1.0 });
  for (const pl of pools) { L.path([[pl[0], QWM], [pl[0], pl[1] + (pl[1] < QWM ? 1.2 : -1.2)]], { width: 1.0 }); }
  L.path([[PW0, QWM], [pa, QWM]], { width: 1.2 }); L.path([[PW1, QWM], [sa, QWM]], { width: 1.2 });
  for (const pl of pools.slice(0, 3)) L.spot('work', pl[0] + 1.0, 0, pl[1] + (pl[1] < QWM ? -1.05 : 1.05), L.yaw(0, pl[1] < QWM ? 1 : -1), { tags: ['garden', 'notes', 'elders'] });
  L.spot('work', mid - 2.5, 0, QWM, L.yaw(1, 0), { tags: ['garden', 'sweep'] });
  for (let k = 0; k < 3; k++) L.spot('stand', e0 + 2 + k * (e1 - e0 - 4) / 2, 0, eq - 1.4, L.yaw(0, 1), { tags: ['garden', 'fruit'] });
  L.spot('stand', mid + 0.8, 0, bq - 0.4, L.yaw(-1, 0.3), { tags: ['garden', 'drink'] });

  // ---------------- things to do ----------------
  const seed = lot.seed;
  L.act(mid, 1.0, bq - 0.55, 1.2, 'Drink at the basin', (gm) => { L.sfx(gm, 'pour', mid, 1.0, bq); setTimeout(() => { L.sfx(gm, 'sip', mid, 1.5, bq - 0.5); note(gm, pick(seed, 51, [
    'Cold and soft. The rill comes down the whole garden at a walking pace for a snail, and ends here at the height of your hand.',
    'You drink from the cup on the chain. At ' + gS + ' of a g the water leaves the spout in a slow, fat curve.',
    'Cold, and faintly of stone. A card on the basin: "Built at this height so nobody has to bend. Rinse the cup."',
    'The basin is worn smooth on one side, where a century of hands has leaned on it to drink.',
  ])); }, 700); });
  L.act(e0 + (e1 - e0) * 0.5 - 1.6, 1.4, eq - 0.9, 1.6, 'Count the fruit on the wires', (gm) => say(gm, 'The wires', [pick(seed, 52, [
    apples + (apples === 1 ? ' apple' : ' apples') + (pears ? ' and ' + pears + (pears === 1 ? ' pear' : ' pears') : '') + ' on the wires. A card: the first goes to the oldest in the block, the second to the newest baby, and the rest are cut crosswise at the hall so everyone sees the star.',
    'You count ' + apples + (apples === 1 ? ' apple' : ' apples') + '. An apple is four kays and change, and these are not for sale. Someone has tied a ribbon round the stalk of the biggest.',
    'Trained flat on wires, under their own lamps, every arm level. ' + apples + (apples === 1 ? ' apple this year' : ' apples this year') + '. Somebody counts them every morning and writes it on the slate.',
    'The trees are older than most of the gardeners. ' + apples + (apples === 1 ? ' apple' : ' apples') + (pears ? ', ' + pears + (pears === 1 ? ' pear' : ' pears') : '') + '. An apple is never for one: the card says so.',
  ])]));
  L.act(pwall - pdir * 0.9, 1.1, pq, 1.4, 'Look at the potting bench', (gm) => note(gm, pick(seed, 53, [
    'Pots of every size, labels in six hands, a trowel with a handle mended in bright blue thread.',
    'Seedlings in trays, each labelled with a name and a date. One label just says "for Ada, when she is out of the clinic".',
    'Growing fibre in a bin, a sieve, a tray of cuttings in water. The bench is the height of a kitchen counter: nobody kneels here.',
    'A slate on the wall: who waters which bed this week. Three names have "hip" written next to them and a friend\'s name after.',
  ])));
  { const st = seats[1]; L.act(st[0], 0.7, st[1], 1.0, 'Sit by the bed a while', (gm) => sitAWhile(L, gm, st[0], st[1], st[2], st[3], 20, pick(seed, 54, [
    'Twenty minutes in the pool of light. Outside it the garden is dark and full of other people\'s quiet.',
    'You sit. An old woman beside you tells you the name of every plant in the bed, slowly, and then which of them she planted.',
    'Twenty minutes. Two gardeners argued about a cutting the whole time in voices so low it took you ten minutes to notice.',
    'A while on the bench. The lamp is warm on the back of your neck, and the bed smells of wet fibre and tomato leaves.',
  ]))); }
  await tick();
  noticeBoard(L, 0.17, 1.55, QF - 1.5, 1, 0, lot.seed);
  await tick();
  L.act(0.7, 1.5, QF - 1.5, 1.3, 'Read the notice', (gm) => say(gm, nice, [pick(seed, 55, [
    'Every bed is at waist height so nobody has to bend. Every walk has a rail. Every pool of light has a bench on both sides. That is the whole design.',
    'The garden is open every hour the lamps are. Beds go by the list at the block office, oldest first.',
    'Two decks tall, because the trees asked for it. The flats above gave up a floor of rooms for it, and get the first fruit of every second year.',
    'Light is dear: each pool is one lamp, and the dark between is on purpose. Bring a hand lamp after eleven.',
  ])]));

  L.zone({ place: 'city-special', name: nice, sub: info.name + ' · lamp garden · beds at waist height', ambience: 'quiet', reverb: 'room', cell: info.key, top: HT + 0.2, headroom: HT,
    env: { exposure: 1.0, autoKey: 0.13, autoMax: 1.7, bloom: 0.07, warmth: 0.3, contrast: 1.12 } });
  return L;
}

// What grows in a waist-high bed (cards, a few fruit).
function bedPlants(L, r, kind, p, q, bw, bd, y) {
  const g = L.g, hw = bw / 2 - 0.15, hd = bd / 2 - 0.12;
  const card = (layer, tint, pp, qq, w, h) => { g.mat(layer, tint, { sway: 0.4 }); const a = r.f(0, 3.14); L.card(pp, y, qq, w, h, a, { tilt: r.f(-0.2, 0.2) }); L.card(pp, y, qq, w, h, a + 1.57, { tilt: r.f(-0.2, 0.2) }); };
  const fruit = (col, pp, yy, qq, rad) => { g.mat('glaze', col, { rough: -0.3 }); L.ball(pp, yy, qq, rad, rad * 0.95, { segs: 7, rings: 5 }); };
  const nx = Math.round(bw / 0.3), nz = Math.round(bd / 0.34);
  if (kind === 'tomato' || kind === 'climbers') {
    for (let i = 0; i < 4; i++) {
      const pp = p - hw + (i + 0.5) * (2 * hw) / 4;
      g.mat('wood', '#b98a5a'); L.tube([[pp, y, q], [pp, y + 1.4, q]], 0.01, { segs: 4 });
      for (let j = 0; j < 4; j++) { g.mat('leafA', '#e8ffd8', { sway: 0.3 }); L.card(pp + r.f(-0.12, 0.12), y + 0.15 + j * 0.3, q + r.f(-0.15, 0.15), 0.42, 0.44, r.f(0, 6.28), { tilt: r.f(-0.3, 0.3) }); }
      if (kind === 'tomato') for (let j = 0; j < 3; j++) fruit(j === 0 ? '#e0a030' : '#c8352a', pp + r.f(-0.15, 0.15), y + r.f(0.4, 1.1), q + r.f(-0.15, 0.15), 0.036);
      else for (let j = 0; j < 4; j++) { g.mat('blossom', '#ffffff', { sway: 0.3 }); L.card(pp + r.f(-0.1, 0.1), y + r.f(0.3, 1.2), q, 0.16, 0.16, r.f(0, 6.28)); }
    }
  } else {
    for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
      const pp = p - hw + (a + 0.5) * (2 * hw) / nx + r.f(-0.05, 0.05), qq = q - hd + (b + 0.5) * (2 * hd) / nz + r.f(-0.05, 0.05);
      if (kind === 'flowers') card((a + b) % 3 ? 'blossom' : 'leafA', '#ffffff', pp, qq, r.f(0.4, 0.55), r.f(0.45, 0.75));
      else if (kind === 'herbs') card(r.chance(0.5) ? 'leafB' : 'leafA', mixHex('#ffffff', '#cfe8a0', r.next()), pp, qq, 0.4, 0.45);
      else if (kind === 'strawberry') { card('leafA', '#e8ffd8', pp, qq, 0.4, 0.26); if ((a + b) % 2 === 0) fruit('#d8302a', pp + 0.08, y + 0.05, qq, 0.026); }
      else card('leafA', mixHex('#ffffff', '#c8e8a0', r.next()), pp, qq, 0.42, 0.32);
    }
  }
  L.s.flush({ tier: 'd', cast: true });
}
