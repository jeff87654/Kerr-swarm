// The block's reading rooms (special.reading, the Middle and High decks): what came in by light today. A tall front
// hall behind tall windows, where the day's columns are pinned up on long sloped desks and people stand to read them,
// each column with a small dial for how old it is, under a wall of big lag dials; behind it three quiet rooms: the
// paper room of books lent against your name (pencil in the margins going back centuries), the lamp room of
// armchairs, and the letter room, where a long letter can be dictated. Silence in the back rooms.
// The front hall is raised to y = 5.2 inside (the decks above are the block's flats); the back rooms are 3.3.
import { defineProp, hasProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { LOT_H } from '../city/plan.js';
import { Rng, mixHex, shadeHex, clamp } from '../core/util.js';
import { local, pickBy, someBy, say, sitHere, getUp, feltHang, baffle, openLeaves, FELTS } from './lots_theatre_kit.js';
import { COLUMNS, DIAL_TINTS, QUIET_COLUMNS, COLUMN_HABITS, BOOKS, LEND, LETTERS, LAMPS } from './lots_theatre_words.js';

const HF = 3.3, HT = 5.2;
const SCHEMES = [
  { wall: '#e6dcc4', dado: '#2f5d50', trim: '#d6a640', front: '#cfc4ae', frontDado: '#2f5d50', felt: '#2f5d50', felt2: '#b7832f', floor: '#9a7a52' },
  { wall: '#efe2c6', dado: '#6b2a35', trim: '#e0b04a', front: '#d8c8a8', frontDado: '#6b2a35', felt: '#6b2a35', felt2: '#1f4f55', floor: '#8a6a48' },
  { wall: '#e3e2d2', dado: '#33407a', trim: '#e3b456', front: '#c9c6b4', frontDado: '#26306b', felt: '#33407a', felt2: '#c9552e', floor: '#a8794f' },
  { wall: '#eadbc8', dado: '#4f2f45', trim: '#e8c26a', front: '#d2c2ae', frontDado: '#4f2f45', felt: '#4f2f45', felt2: '#3fa7a3', floor: '#94704c' },
];

// A long sloped reading desk with the day's columns pinned on it, each with a little dial. n columns a side (0.6 m each),
// two: a double desk with readers both sides (else single, the readers at +z). Along local x, centred.
defineProp('lots-theatre.desk', (g, p) => {
  const n = p.n || 8, two = !!p.two, len = n * 0.6 + 0.24, r = new Rng(4517 + n * 31 + (two ? 7 : 0) + (p.v || 0) * 977);
  const wood = p.wood || '#5a3a22', x0 = -len / 2;
  const yf = 1.0, yr = two ? 1.3 : 1.28, zf = two ? 0.56 : 0.3, zr = two ? 0.02 : -0.22;
  const sides = two ? [1, -1] : [1];
  // the frame: end standards, a stretcher, a back board on a single desk
  g.mat('wood', wood, { rough: -0.05 });
  const legs = [x0 + 0.06]; for (let x = x0 + 2.2; x < -x0 - 0.6; x += 2.2) legs.push(x); legs.push(-x0 - 0.06);
  for (const x of legs) { g.box(x - 0.04, 0, -zf + 0.08, x + 0.04, yf - 0.02, -zf + 0.16, { faces: 'xXzZ' }); g.box(x - 0.04, 0, zf - 0.16, x + 0.04, yf - 0.02, zf - 0.08, { faces: 'xXzZ' }); g.box(x - 0.05, 0, -zf + 0.04, x + 0.05, 0.06, zf - 0.04, { faces: 'xXzZY' }); }
  g.box(x0, 0.24, -0.03, -x0, 0.3, 0.03, { faces: 'yYzZ' });
  if (!two) { g.box(x0, yr - 0.02, zr - 0.04, -x0, yr + 0.22, zr, { faces: 'zZYxX' }); }
  else { g.mat('cast', '#b08a45', { rough: -0.2 }); g.box(x0, yr - 0.005, -0.025, -x0, yr + 0.03, 0.025, { faces: 'yYzZxX' }); }
  for (const s of sides) {
    const dz = zr - zf, dy = yr - yf, L = Math.hypot(dz, dy), nY = -dz / L, nZ = dy / L;     // the slope's unit normal (y, z), facing its reader
    const at = (x, t, off) => [x, yf + dy * t + nY * off, s * (zf + dz * t) + s * nZ * off];
    const quad = (A, B, C, E) => (s > 0 ? g.quad(A, B, C, E) : g.quad(A, E, C, B));       // wound to face this side's reader
    // the board, with a lip at its front edge for pencils
    g.mat('wood', shadeHex(wood, 1.2), { rough: -0.1 });
    quad(at(x0, 0, 0), at(-x0, 0, 0), at(-x0, 1, 0), at(x0, 1, 0));
    quad(at(x0, 0, -0.03), at(x0, 1, -0.03), at(-x0, 1, -0.03), at(-x0, 0, -0.03));
    g.mat('wood', wood); g.box(x0, yf - 0.03, s > 0 ? zf - 0.01 : -zf - 0.03, -x0, yf + 0.03, s > 0 ? zf + 0.03 : -zf + 0.01, { faces: 'yYzZxX' });
    g.mat('cast', '#b08a45', { rough: -0.2 }); g.box(x0 + 0.04, yf + 0.025, s > 0 ? zf - 0.005 : -zf - 0.025, -x0 - 0.04, yf + 0.04, s > 0 ? zf + 0.025 : -zf + 0.005, { faces: 'yYzZ' });
    for (let k = 0; k < n; k++) {
      if (r.chance(0.08)) continue;                       // a gap where a column has been taken down
      const cx = x0 + 0.12 + k * 0.6 + r.f(-0.03, 0.03), cw = 0.46, t0 = 0.1 + r.f(0, 0.04), t1 = 0.9 - r.f(0, 0.06), cls = r.i(0, 5);
      const Q = (xa, ta, xb, tb, off) => quad(at(xa, ta, off), at(xb, ta, off), at(xb, tb, off), at(xa, tb, off));
      g.mat('paper', r.pick(['#efe6d2', '#f2ead8', '#e8dcc0', '#f0e8d0'])); Q(cx, t0, cx + cw, t1, 0.004);
      g.mat('paint', DIAL_TINTS[cls] ? shadeHex(DIAL_TINTS[cls], 0.7) : '#8a6a48'); Q(cx, t1 - 0.06, cx + cw, t1 - 0.01, 0.006);
      g.mat('paint', '#3a3530');
      Q(cx + 0.03, t1 - 0.17, cx + r.f(0.25, 0.36), t1 - 0.12, 0.006);
      for (let l = 0; l < 7; l++) { const tl = t1 - 0.24 - l * 0.075; if (tl < t0 + 0.04) break; const two_ = r.chance(0.5); Q(cx + 0.03, tl, cx + (two_ ? 0.21 : r.f(0.25, cw - 0.03)), tl + 0.022, 0.006); if (two_) Q(cx + 0.24, tl, cx + r.f(0.3, cw - 0.03), tl + 0.022, 0.006); }
      if (r.chance(0.35)) { g.mat('paint', '#c9552e'); Q(cx + cw - 0.1, t0 + 0.05, cx + cw - 0.04, t0 + 0.08, 0.007); }
      // the dial: a brass ring, a tinted face and one hand, how old the column is
      const dc = [cx + cw - 0.08, t1 - 0.16], R0 = 0.055, ang = r.f(0, Math.PI * 2);
      const dir = (a, rr) => [dc[0] + Math.cos(a) * rr, dc[1] + Math.sin(a) * rr / L];
      const fan = (rr, off) => { for (let i = 0; i < 8; i++) { const a0 = i * Math.PI / 4, a1 = a0 + Math.PI / 4; const p0 = dir(a0, rr), pm = dir((a0 + a1) / 2, rr), p1 = dir(a1, rr); quad(at(dc[0], dc[1], off), at(p0[0], p0[1], off), at(pm[0], pm[1], off), at(p1[0], p1[1], off)); } };
      g.mat('cast', '#b08a45', { rough: -0.25 }); fan(R0, 0.009);
      g.mat('paint', DIAL_TINTS[cls]); fan(R0 * 0.8, 0.011);
      g.mat('paint', '#2a2622'); { const e = dir(ang, R0 * 0.72), sx = Math.sin(ang) * 0.004, sy = -Math.cos(ang) * 0.004 / L; quad(at(dc[0] - sx, dc[1] - sy, 0.013), at(dc[0] + sx, dc[1] + sy, 0.013), at(e[0] + sx, e[1] + sy, 0.013), at(e[0] - sx, e[1] - sy, 0.013)); }
    }
    // little green lamps along the ridge or the back board
    for (let x = x0 + 0.9; x < -x0 - 0.5; x += 1.8) {
      const za = two ? 0 : zr - 0.02, zl = two ? s * 0.18 : zr + 0.24, yl = yr + 0.24;
      g.mat('cast', '#b08a45'); g.box(x - 0.008, yr, za - 0.008, x + 0.008, yl, za + 0.008); g.box(x - 0.008, yl - 0.008, Math.min(za, zl), x + 0.008, yl + 0.008, Math.max(za, zl));
      g.mat('glaze', '#1d6a48', { rough: -0.3 }); g.box(x - 0.13, yl - 0.05, zl - 0.05, x + 0.13, yl + 0.02, zl + 0.05, { bevel: 0.015 });
      g.mat('diffuser', '#ffe0a8', { emissive: 3.5, lamp: true }); g.box(x - 0.11, yl - 0.052, zl - 0.035, x + 0.11, yl - 0.048, zl + 0.035, { faces: 'y' });
    }
  }
  return { solid: [[x0, 0, two ? -zf : zr - 0.05, -x0, yr, zf]], tier: 's' };
});

// A big lag dial for the wall: a brass bezel, a tinted face with twelve marks, one long hand. Front toward +z.
defineProp('lots-theatre.bigdial', (g, p) => {
  const R = 0.36;
  g.push(); g.rotX(Math.PI / 2);
  g.mat('cast', '#a88442', { rough: -0.25 }); g.lathe(0, 0, [[R + 0.05, 0], [R + 0.05, 0.03], [R + 0.02, 0.05], [R, 0.05]], { segs: 24 });
  g.mat('paint', p.face || '#e9dfc4'); g.lathe(0, 0, [[R, 0.035], [0, 0.04]], { segs: 24, capBottom: false, capTop: false });
  g.mat('paint', '#2a2622'); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a); g.cube(c * R * 0.84, 0.042, s * R * 0.84, i % 3 ? 0.012 : 0.022, 0.004, i % 3 ? 0.04 : 0.06); }
  const a = p.a || 0; g.push(); g.rotY(-a); g.box(-0.008, 0.044, -0.02, 0.008, 0.05, R * 0.78); g.pop();
  g.mat('cast', '#a88442'); g.cyl(0, 0.04, 0, 0.025, 0.015, { segs: 8 });
  g.pop();
  return { tier: 's', cast: false };
});

export async function buildReading(s, lot, plan, game, tick) {
  const L = local(s, lot), W = L.W, D = L.D, info = plan.info, r = new Rng(lot.seed), g = s.g, o = L.o;
  const S = SCHEMES[(lot.seed >>> 5) % SCHEMES.length], high = info.band === 'high', pc = W / 2;
  const QF = D >= 34 ? 14 : 13, SB = clamp((W - 22) / 2, 7, 18), P1 = SB, P2 = W - SB;
  const lampLeft = (lot.seed & 2) === 0, lampA = lampLeft ? 0 : P2, lampB = lampLeft ? P1 : W, letA = lampLeft ? P2 : 0, letB = lampLeft ? W : P1;
  const clipF = L.clip(0, -0.2, -2.4, W, HT + 0.1, QF);

  // ---------------------------------------------------------------- shell
  L.floor(0, 0, W, QF, 0, 'planks', S.floor);
  L.floor(0, QF, W, D, 0, 'planks', shadeHex(S.floor, 0.85));
  L.ceiling(0, 0, W, QF, HT, 'felt', mixHex(S.felt, '#d8cdb4', 0.55));
  L.ceiling(0, QF, W, D, HF, 'paint', '#e6dcc8');
  await tick('floors');
  const dado = { h: 1.05, mat: 'wood', tint: '#4a3222' };
  L.wallQ(0.08, 0.16, D - 0.16, 0, HF, { tint: S.wall, dado }); L.wallQ(W - 0.08, 0.16, D - 0.16, 0, HF, { tint: S.wall, dado });
  L.wallQ(0.08, 0.16, QF, HF, HT - HF, { tint: S.wall, skirt: false }); L.wallQ(W - 0.08, 0.16, QF, HF, HT - HF, { tint: S.wall, skirt: false });
  L.wallP(D - 0.08, 0, W, 0, HF, { tint: S.wall, dado });
  // the front hall's back wall: an arch into the paper room, a door into each side room; above the doors, the lag dials
  const archAt = pc - 1.4, dLamp = (lampA + lampB) / 2 - 0.6, dLet = (letA + letB) / 2 - 0.6;
  L.wallP(QF, 0, W, 0, HF, { tint: S.wall, dado: { h: 1.05, mat: 'wood', tint: S.dado }, openings: [{ at: archAt, w: 2.8, h: 2.75 }, { at: dLamp, w: 1.2, h: 2.2 }, { at: dLet, w: 1.2, h: 2.2 }] });
  L.wallP(QF, 0, W, HF, HT - HF, { tint: S.wall, skirt: false });
  // the walls between the back rooms
  for (const p of [P1, P2]) L.wallQ(p, QF + 0.08, D - 0.16, 0, HF, { tint: S.wall, dado });
  await tick('walls');

  // ---------------------------------------------------------------- the front: tall windows, a glazed door, the name over it
  {
    const ops = [], dw = 2.4, dAt = pc - dw / 2, wins = [];
    ops.push({ at: dAt, w: dw, h: 2.6 });
    for (const span of [[0.9, dAt - 0.7], [dAt + dw + 0.7, W - 0.9]]) {
      const n = Math.max(1, Math.floor((span[1] - span[0] + 0.7) / 2.3)), step = (span[1] - span[0]) / n;
      for (let k = 0; k < n; k++) { const at = span[0] + k * step + (step - 1.6) / 2; ops.push({ at, w: 1.6, h: 2.35, sill: 0.5 }); wins.push(at); }
    }
    L.wallP(0.1, 0, W, 0, LOT_H, { inner: { tint: S.wall, mat: 'plaster' }, outer: { tint: S.front, mat: 'stone' }, dado: { h: 0.5, mat: 'stone', tint: shadeHex(S.front, 0.72) }, openings: ops });
    await tick('front wall');
    L.wallP(0.3, 0, W, LOT_H, HT - LOT_H, { tint: S.wall, skirt: false, noCollide: true });
    s.structure(() => {
      // window frames: a transom, two mullions, a stone sill; pilasters between; a cornice
      for (const at of wins) {
        g.mat('paint', S.frontDado); L.box(at, 0.5, -0.06, at + 1.6, 0.56, 0.2, { faces: 'yYzZ' }); L.box(at, 2.3, 0.04, at + 1.6, 2.36, 0.16); for (const m of [0.53, 1.07]) L.box(at + m - 0.025, 0.56, 0.06, at + m + 0.025, 2.85, 0.14); L.box(at, 2.82, 0.04, at + 1.6, 2.85, 0.16);
        g.mat('stone', '#bfb39a'); L.box(at - 0.08, 0.44, -0.12, at + 1.68, 0.5, 0.06, { bevel: 0.01 });
      }
      g.mat('stone', shadeHex(S.front, 0.9)); for (let k = 0; k < wins.length; k++) { const p = wins[k] - 0.35; if (p > 0.3) L.box(p - 0.16, 0, -0.1, p + 0.16, LOT_H, 0.02, { bevel: 0.012 }); }
      for (const p of [dAt - 0.3, dAt + dw + 0.3]) L.box(p - 0.2, 0, -0.12, p + 0.2, LOT_H, 0.02, { bevel: 0.012 });
      g.mat('wood', S.trim); L.box(0, 2.95, -0.08, W, 3.03, 0.02, { bevel: 0.01 });
    });
    await tick('window frames');
    for (const at of wins) for (const m of [[0.03, 0.53], [0.56, 1.07], [1.1, 1.57]]) L.glass(at + m[0], 0.56, 0.1, at + m[1], 2.85, 0.1, { opacity: 0.1 });
    L.glass(dAt + 0.05, 2.25, 0.1, dAt + dw - 0.05, 2.58, 0.1, { opacity: 0.1 });
    openLeaves(L, 0.0, dAt, dw, 2.2, S.frontDado);
    sign(s, { kind: 'fascia', text: 'Reading Rooms', sub: 'what came in by light today', palette: [S.frontDado, '#f3e6c8', S.trim], emblem: 'book' }, ...(() => { const c = L.P(pc, -0.04); return [c[0], 2.62, c[1]]; })(), { face: L.face(0, -1), w: 3.6, h: 0.42, glow: 0.9 });
    for (const sg of [-1, 1]) L.lamp('sconce', pc + sg * (dw / 2 + 0.55), 2.15, -0.1, { face: [0, -1], K: 2800, power: 0.8, clip: L.clip(pc - 4, -0.2, -3, pc + 4, 3.3, 0.05), range: 4.5 });
    L.path([[pc, -0.7], [pc, 1.4], [pc, QF * 0.5]], { width: 2.0 });
  }
  await tick('front');

  // ---------------------------------------------------------------- the front hall: rows of sloped desks, the columns
  {
    // desk rows: a single desk under the windows (its readers face the street), then double desks
    const rowsQ = [{ q: 1.25, two: false }, { q: QF >= 14 ? 5.3 : 5.0, two: true }, { q: QF >= 14 ? 9.2 : 8.7, two: true }];
    const runs = (lo, hi) => { const out = []; const len = hi - lo; const n = Math.max(1, Math.ceil(len / 6.6)); const seg = (len - (n - 1) * 1.4) / n; for (let k = 0; k < n; k++) { const a = lo + k * (seg + 1.4); const cols = Math.max(3, Math.floor((seg - 0.24) / 0.6)); out.push({ mid: a + seg / 2, cols }); } return out; };
    const segs = [...runs(1.1, pc - 1.5), ...runs(pc + 1.5, W - 1.1)];
    let v = 0, readers = 0;
    for (const row of rowsQ) {
      for (const [si, sg] of segs.entries()) {
        if (si > 0 && si % 2 === 0) await tick('desks');
        L.prop('lots-theatre.desk', sg.mid, 0, row.q, 0, { n: sg.cols, two: row.two, v: (v++ + lot.seed) % 2, wood: '#5a3a22' }, { noSpots: true });
        const half = sg.cols * 0.3;
        for (const side of row.two ? [1, -1] : [1]) for (const t of [-0.3, 0.3]) {
          if (sg.cols < 5 && t > 0) continue;
          L.spot('stand', sg.mid + t * half * 1.4, 0, row.q + side * (row.two ? 0.95 : 0.7), side > 0 ? Math.PI : 0, { tags: ['read', 'board'] }); readers++;
        }
      }
      // a long green-shaded strip lamp hung over the row
      L.lamp('strip', 1.4, 2.75, row.q + (row.two ? 0 : 0.35), { to: [W - 1.4, 2.75, row.q + (row.two ? 0 : 0.35)], K: 3100, power: row.two ? 1.3 : 1.0, clip: clipF, range: 6 });
      s.deco(() => {
        g.mat('glaze', '#1d5a42', { rough: -0.25 }); const q = row.q + (row.two ? 0 : 0.35);
        L.box(1.3, 2.78, q - 0.16, W - 1.3, 2.84, q + 0.16, { faces: 'yYxXzZ' }); L.box(1.3, 2.72, q - 0.17, W - 1.3, 2.84, q - 0.15); L.box(1.3, 2.72, q + 0.15, W - 1.3, 2.84, q + 0.17);
        g.mat('brushed', '#5a5046'); for (let p = 3; p < W - 2; p += 6) L.tube([[p, 2.84, q], [p, HT, q]], 0.008, { segs: 4, caps: false });
      });
      await tick('desk row');
    }
    void readers;
    // the lag wall over the back doors: a row of big dials, and the board that says what they mean
    const nd = Math.max(6, Math.min(12, Math.floor((W - 4) / 3.4))), lagAges = [0.2, 0.9, 1.6, 2.4, 3.3, 4.4, 5.2, 0.5, 2.0, 3.9, 1.2, 4.8];
    for (let k = 0; k < nd; k++) {
      const p = 2 + (k + 0.5) * (W - 4) / nd; if (Math.abs(p - pc) < 1.4) continue;
      L.prop('lots-theatre.bigdial', p, 3.95, QF - 0.08, Math.PI, { face: DIAL_TINTS[k % 6], a: lagAges[k % 12] }, { noCollide: true });
    }
    await tick('dials');
    sign(s, { kind: 'board', title: 'By light', lines: ['Herb Row|under a thousandth of a second', 'down the row|seconds', 'across Merrow|under a minute', 'a passing raft|minutes to hours', 'across the Shade|up to eight years', 'the frontier|centuries'], palette: ['#1d2a26', '#f3e6c8', S.trim] }, ...(() => { const c = L.P(pc, QF - 0.1); return [c[0], 3.85, c[1]]; })(), { face: L.face(0, -1), w: 1.3, h: 0.85 });
    s.deco(() => { g.mat('cast', S.trim, { rough: -0.2 }); L.box(1.2, 3.42, QF - 0.12, W - 1.2, 3.46, QF - 0.08); L.box(1.2, 4.46, QF - 0.12, W - 1.2, 4.5, QF - 0.08); });
    L.lamp('strip', 1.4, HT - 0.06, QF - 1.2, { to: [W - 1.4, HT - 0.06, QF - 1.2], K: 3300, power: 0.9, clip: clipF, range: 6 });
    // beams across the tall ceiling, felt between them, banners of felt down the side walls
    s.structure(() => { g.mat('wood', '#6b4a2f'); for (let p = 3; p < W - 1; p += 4.2) L.box(p - 0.1, HT - 0.3, 0.3, p + 0.1, HT, QF - 0.1); });
    await tick('lag wall');
    for (const sp of [[0.12, 1], [W - 0.12, -1]]) feltHang(L, [sp[0], 1.4], [sp[0], QF - 1.6], HT - 0.4, 2.2, S.felt, [sp[1] * 0.05, 0], { band: S.trim, nu: 8 });
    await tick('board');
    // felt and benches along the back wall between its doors, under the dials
    {
      const busy = [[archAt - 0.4, archAt + 3.2], [dLamp - 0.4, dLamp + 1.6], [dLet - 0.4, dLet + 1.6], [pc + 1.8, pc + 5.0]];
      let k = 0;
      for (let p = 1.0; p + 2.2 < W - 0.8; p += 2.9) {
        if (busy.some((b) => p + 2.2 > b[0] && p < b[1])) continue;
        feltHang(L, [p, QF - 0.08], [p + 2.2, QF - 0.08], 2.95, 1.2, [S.felt, S.felt2, FELTS[(k + lot.seed) % 8]][k % 3], [0, -0.05], { nu: 6, band: k % 2 ? S.trim : null });
        if (k % 2 === 0) { L.prop('bench', p + 1.1, 0, QF - 0.5, Math.PI, { w: 1.8, back: true, wood: '#5a3a22' }, { noSpots: true }); for (const dp of [-0.5, 0.5]) L.spot('sit', p + 1.1 + dp, 0.46, QF - 0.55, Math.PI, { tags: ['read'] }); }
        if (++k % 4 === 0) await tick('back wall');
      }
    }
    // the keeper's loans desk beside the arch, where the columns are taken in and books go out
    const kp = pc + 3.4, kq = QF - 1.1;
    L.prop('counter', kp, 0, kq, Math.PI, { w: 2.4, d: 0.6, h: 0.95, body: S.dado, top: '#b98a5a' }, { noSpots: true });
    L.prop('lots-theatre.holes', kp, 1.1, QF - 0.1, Math.PI, { cols: 7, rows: 6 }, { noCollide: true });
    s.detail(() => {
      g.mat('paper', '#efe6d2'); L.box(kp - 0.7, 0.95, kq - 0.2, kp - 0.2, 0.99, kq + 0.15, { faces: 'YxXzZ' });
      g.mat('paper', '#2f4f6f'); L.box(kp + 0.1, 0.95, kq - 0.18, kp + 0.55, 1.0, kq + 0.12, { bevel: 0.005 });
      g.mat('cast', '#b08a45'); L.cyl(kp + 0.85, 0.95, kq, 0.035, 0.07, { segs: 8 });
    });
    if (hasProp('books.greenlamp')) L.prop('books.greenlamp', kp - 0.9, 0.95, kq - 0.05, Math.PI, {});
    L.spot('counter', kp, 0, kq + 0.75, Math.PI, { tags: ['write', 'reading'] });
    L.spot('customer', kp - 0.3, 0, kq - 0.9, 0, { tags: ['reading'] });
    // reading today's columns: one place at the window desk, one at the far row
    const colLines = (gm, salt) => {
      const day = gm.clock ? gm.clock.day : 1;
      if (day === 2) return QUIET_COLUMNS.slice();
      const pick = someBy((lot.seed >>> 0) + day * 7919, salt, COLUMNS, 3);
      return [...pick.map((c) => 'From ' + c.f + ', ' + c.age + ' old. ' + c.t), pickBy(lot.seed + day, salt + 3, COLUMN_HABITS)];
    };
    L.interact({ p: segs[Math.floor(segs.length / 2) - 1].mid, y: 1.3, q: rowsQ[0].q + 0.6, radius: 1.8, prompt: 'Read today’s columns', onUse: (gm) => say(gm, 'Today’s columns', colLines(gm, 21)) });
    L.interact({ p: segs[segs.length - 1].mid, y: 1.3, q: rowsQ[2].q - 0.9, radius: 1.8, prompt: 'Read the columns on this desk', onUse: (gm) => say(gm, 'The columns', colLines(gm, 37)) });
    L.glowBox(0, 0, 0, W, HT, QF, { sky: '#fff0d8', ground: S.floor, power: 0.36 });
    L.zone(0, -0.5, 0, W, HT, QF, { id: lot.id + '/columns', place: 'city-special', name: 'The reading rooms', sub: info.name + ' · what came in by light today', ambience: 'quiet', reverb: 'felt', cell: info.key, headroom: HT - 0.4 });
    // walkways: along between the rows, to the arch and the side doors
    for (const q of [3.1, QF >= 14 ? 7.25 : 6.85, QF - 2.0]) L.path([[1.0, q], [pc, q], [W - 1.0, q]], { width: 1.3 });
    L.path([[pc, -0.7], [pc, 3.1]]); L.path([[pc, 3.1], [pc, QF >= 14 ? 7.25 : 6.85], [pc, QF - 2.0], [pc, QF + 1.2]], { width: 1.6 });
    L.path([[dLamp + 0.6, QF - 2.0], [dLamp + 0.6, QF + 1.0]]); L.path([[dLet + 0.6, QF - 2.0], [dLet + 0.6, QF + 1.0]]);
    L.spot('work', 1.6, 0, 3.1, Math.PI / 2, { tags: ['sweep'] });
  }
  await tick('front hall');

  // ---------------------------------------------------------------- the paper room: books lent against your name
  {
    const a = P1 + 0.08, b = P2 - 0.08, q0 = QF + 0.08, q1 = D - 0.16, mid = (a + b) / 2, clip = L.clip(a, -0.2, q0, b, HF + 0.1, q1);
    // shelves along the back wall and the side walls, in runs of four bays
    const runs = [];
    { const nb = Math.floor((b - a - 0.2) / 0.9), n4 = Math.ceil(nb / 4); let left = nb, p = a + 0.1 + (b - a - 0.2 - nb * 0.9) / 2; for (let k = 0; k < n4; k++) { const n = Math.min(4, left); runs.push([p + n * 0.45, q1 - 0.02, Math.PI, n]); p += n * 0.9; left -= n; } }
    for (const side of [[a + 0.02, Math.PI / 2], [b - 0.02, -Math.PI / 2]]) { const qa = q0 + Math.max(1.5, (q1 - q0) * 0.42), nb = Math.min(8, Math.floor((q1 - 1.0 - qa) / 0.9)); for (let k = 0; k < nb; k += 4) { const n = Math.min(4, nb - k); runs.push([side[0], qa + (k + n / 2) * 0.9, side[1], n]); } }
    let i = 0;
    for (const ru of runs) {
      L.propMid('lots-theatre.bay', ru[3] * 0.9, ru[0], 0, ru[1], ru[2], { n: ru[3], v: (i + lot.seed) % 3, h: 2.6, wood: '#4a3222' }, { cast: false });
      await tick('bays');
    }
    await tick('paper bays');
    // two freestanding stacks, back to back, either side of the reading table
    const sl = Math.min(5, Math.floor((q1 - q0 - 5) / 0.9)), sq0 = q0 + 3.0;
    for (const p of [mid - 3.6, mid + 3.6]) {
      L.propMid('lots-theatre.bay', sl * 0.9, p - 0.01, 0, sq0 + sl * 0.45, -Math.PI / 2, { n: sl, v: 1, h: 2.0, wood: '#5e3f29' }, { cast: false });
      L.propMid('lots-theatre.bay', sl * 0.9, p + 0.01, 0, sq0 + sl * 0.45, Math.PI / 2, { n: sl, v: 2, h: 2.0, wood: '#5e3f29' }, { cast: false });
      for (const sg of [-1, 1]) L.spot('browse', p + sg * 0.85, 0, sq0 + 0.4 + sl * 0.45, sg > 0 ? -Math.PI / 2 : Math.PI / 2, { tags: ['books', 'read'] });
      await tick('stack');
    }
    // the long reading table, chairs that do not match, green lamps
    const tl = Math.min(sl * 0.9, 4.4), tq = sq0 + sl * 0.45;
    L.prop('table', mid, 0, tq, Math.PI / 2, { w: tl, d: 1.0, wood: '#5a3a22', legs: 'trestle' });
    for (const sg of [-1, 1]) for (let k = 0; k < Math.floor(tl / 0.9); k++) {
      const q = tq - tl / 2 + 0.45 + k * 0.9, p = mid + sg * 0.75;
      L.prop('lots-theatre.seat', p, 0, q, sg > 0 ? -Math.PI / 2 : Math.PI / 2, { k: (k + (sg > 0 ? 1 : 3)) % 4, fab: FELTS[(k * 3 + (sg > 0 ? 1 : 0)) % 8] }, { noSpots: true });
      L.spot('sit', p, 0.46, q, sg > 0 ? -Math.PI / 2 : Math.PI / 2, { tags: ['read', 'books'] });
    }
    if (hasProp('books.greenlamp')) for (const dq of [-tl / 4, tl / 4]) L.prop('books.greenlamp', mid, 0.74, tq + dq, Math.PI / 2, {});
    s.detail(() => { for (let k = 0; k < 5; k++) { g.mat('paper', FELTS[(k + 2) % 8]); const q = tq - tl / 2 + 0.6 + k * (tl - 1.2) / 4; L.box(mid - 0.3 + (k % 2) * 0.35, 0.74, q - 0.1, mid - 0.06 + (k % 2) * 0.35, 0.77, q + 0.08, { bevel: 0.004 }); } });
    L.lamp('globe', mid, HF, tq - 1.0, { drop: 0.85, K: 2700, power: 1.2, clip, range: 7 });
    L.lamp('globe', mid, HF, tq + 1.4, { drop: 0.85, K: 2700, power: 1.0, clip, range: 7 });
    L.lamp('globe', mid, HF, q1 - 1.6, { drop: 0.5, K: 2900, power: 0.9, clip, range: 8 });
    L.glowBox(a, 0, q0, b, HF, q1, { sky: '#ffd8a8', ground: '#6b4a2f', power: 0.24 });
    for (let p = a + 2.5; p < b - 2; p += 4.5) baffle(L, [p, q0 + 0.8], [p + 0.1, q1 - 0.8], HF, '#3a2a22', 0.22);
    // silence, and the borrowing
    L.sign({ kind: 'plate', text: 'Silence', lines: ['in the back rooms'] }, pc, 2.95, QF + 0.1, [0, 1], { w: 0.36, h: 0.15 });
    L.sign({ kind: 'plate', text: 'Silence', lines: ['in the back rooms'] }, pc, 2.95, QF - 0.1, [0, -1], { w: 0.36, h: 0.15 });
    L.interact({ p: mid - 3.6 + 0.85, y: 1.2, q: sq0 + 0.4 + sl * 0.45, radius: 1.8, prompt: 'Borrow a book', onUse: (gm) => {
      const n = (gm.flags.lotsTheatreBorrowed = ((gm.flags.lotsTheatreBorrowed || 0) + 1)), bk = BOOKS[((lot.seed >>> 2) + n * 5) % BOOKS.length];
      if (gm.audio) gm.sfx && gm.sfx('book', { vol: 0.4 });
      return say(gm, bk.t, [pickBy(lot.seed + n, 23, LEND), bk.m]);
    } });
    L.spot('work', mid, 0, q1 - 1.2, 0, { tags: ['sweep'] });
    L.path([[pc, QF + 1.2], [mid, tq - tl / 2 - 0.9], [mid - 2.3, tq], [mid - 2.3, q1 - 1.0], [mid + 2.3, q1 - 1.0], [mid + 2.3, tq], [mid, tq - tl / 2 - 0.9]], { width: 1.1 });
    L.zone(a, -0.5, q0, b, HF, q1, { id: lot.id + '/paper', place: 'city-special', name: 'The paper room', sub: 'books lent against your name · silence', ambience: 'quiet', reverb: 'felt', cell: info.key });
  }
  await tick('paper room');

  // ---------------------------------------------------------------- the lamp room: armchairs in pools of light
  {
    const a = lampA + 0.16, b = lampB - 0.16, q0 = QF + 0.08, q1 = D - 0.16, wd = b - a, clip = L.clip(a, -0.2, q0, b, HF + 0.1, q1);
    const cols = Math.max(1, Math.min(2, Math.floor((wd - 0.6) / 3.6))), rows = Math.max(2, Math.min(3, Math.floor((q1 - q0 - 1.6) / 4.2)));
    const FAB = ['#7a2f2a', '#1f4f55', '#b7832f', '#4f2f45', '#2f5d50', '#8c3b26', '#33407a'];
    const ARM = [{ fabric: '#7a2f2a', mend: '#e0b04a', patch: '#3fa7a3', mendAt: 'arm' }, { fabric: '#1f4f55', wing: true, mend: '#d95d7a', patch: '#e0b04a', mendAt: 'seat' }, { fabric: '#b7832f', mend: '#3fa7a3', patch: '#8c3b26', mendAt: 'back' }, { fabric: '#4f2f45', wing: true, mend: '#e0b04a', patch: '#2f5d50', mendAt: 'arm' }];
    let lit = 0, sat = 0;
    for (let rI = 0; rI < rows; rI++) {
      for (let c = 0; c < cols; c++) {
        const cp = a + (c + 0.5) * wd / cols, cq = q0 + 1.6 + (rI + 0.5) * (q1 - q0 - 2.2) / rows, k = rI * cols + c;
        L.prop('rug', cp, 0, cq, 0, { w: 2.4, d: 1.8, a: FAB[(k + 2) % 7], b: '#e9dcc0' });
        const chairs = [[cp - 0.7, cq + 0.15, Math.PI / 2 + 0.5], [cp + 0.7, cq + 0.1, -Math.PI / 2 - 0.5]];
        chairs.forEach((ch, j) => {
          const tv = 0.85 + ((k * 7 + j * 3) % 5) * 0.06;
          if (hasProp('books.armchair')) L.prop('books.armchair', ch[0], 0, ch[1], ch[2], ARM[(k * 2 + j + lot.seed) % 4], { noSpots: true, tint: [tv, tv, tv * 0.97] });
          else L.prop('lots-theatre.seat', ch[0], 0, ch[1], ch[2], { k: 2, fab: FAB[(k * 2 + j) % 7] }, { noSpots: true });
          L.spot('sit', ch[0], 0.47, ch[1], ch[2], { tags: ['read', 'lamp'] }); sat++;
        });
        if (hasProp('books.standard')) L.prop('books.standard', cp, 0, cq - 0.45, 0, { shade: ['#d9a24e', '#e0b88a', '#c9962e', '#e8c26a'][k % 4], h: 1.45 });
        L.prop('table', cp, 0, cq + 0.35, 0, { w: 0.5, round: true, h: 0.55, wood: '#5a3a22' });
        s.detail(() => { g.mat('paper', FAB[(k + 4) % 7]); L.box(cp - 0.1, 0.55, cq + 0.25, cp + 0.12, 0.59, cq + 0.43, { bevel: 0.004 }); g.mat('glaze', '#e9e2d0'); L.lathe(cp + 0.12, cq + 0.5, [[0, 0.55], [0.035, 0.55], [0.04, 0.62], [0.03, 0.635], [0, 0.635]], { segs: 8 }); });
        if (lit < 4 && (k % 2 === 0 || cols * rows <= 4)) { L.light({ at: [cp, 1.12, cq - 0.45], color: '#ffd29a', power: 2.0, range: 4.5, radius: 0.12, shadow: true, clip, lamp: true }); lit++; }
        if (k === 0) {
          const ch = chairs[0];
          L.interact({ p: ch[0], y: 0.9, q: ch[1], radius: 1.2, priority: 0.2, prompt: 'Sit under the lamp', onUse: (gm) => { if (sitHere(L, gm, ch[0] + Math.sin(ch[2]) * 0.05, 0, ch[1] + Math.cos(ch[2]) * 0.05, ch[2], 'reading-lamp')) return say(gm, 'The lamp room', someBy(lot.seed, 31, LAMPS, 2)); return null; } });
        }
      }
      await tick('lamp row');
    }
    void sat;
    // books on the outer wall, felt on the inner
    const outer = lampLeft ? a + 0.02 : b - 0.02, inw = lampLeft ? 1 : -1;
    { const nb = Math.min(12, Math.floor((q1 - q0 - 2.0) / 0.9)); for (let k = 0; k < nb; k += 4) { const n = Math.min(4, nb - k); L.propMid('lots-theatre.bay', n * 0.9, outer, 0, q0 + 1.2 + (k + n / 2) * 0.9, inw > 0 ? Math.PI / 2 : -Math.PI / 2, { n, v: k % 3, h: 1.2, wood: '#4a3222' }, { cast: false }); } }
    feltHang(L, [lampLeft ? b - 0.02 : a + 0.02, q0 + 1.6], [lampLeft ? b - 0.02 : a + 0.02, q1 - 1.0], HF - 0.25, 0.4, S.felt2, [-inw * 0.05, 0], { mend: ['#e0b04a', '#d95d7a'] });
    L.glowBox(a, 0, q0, b, HF, q1, { sky: '#ffcf90', ground: '#5a3a22', power: 0.12 });
    L.zone(a, -0.5, q0, b, HF, q1, { id: lot.id + '/lamps', place: 'city-special', name: 'The lamp room', sub: 'armchairs and lamps · silence', ambience: 'quiet', reverb: 'felt', cell: info.key });
    L.path([[dLamp + 0.6, QF + 1.0], [(a + b) / 2, q0 + 1.6], [(a + b) / 2, q1 - 1.0]], { width: 1.0 });
  }
  await tick('lamp room');

  // ---------------------------------------------------------------- the letter room: the writer's desk, pigeonholes, a long table
  {
    const a = letA + 0.16, b = letB - 0.16, q0 = QF + 0.08, q1 = D - 0.16, wd = b - a, mid = (a + b) / 2, clip = L.clip(a, -0.2, q0, b, HF + 0.1, q1);
    const outer = lampLeft ? b - 0.02 : a + 0.02, inw = lampLeft ? -1 : 1;
    // pigeonholes along the outer wall, letters waiting to be collected
    const nh = Math.max(2, Math.min(6, Math.floor((q1 - q0 - 3) / 2.0)));
    for (let k = 0; k < nh; k++) L.prop('lots-theatre.holes', outer, 0.85, q0 + 2.2 + k * (q1 - q0 - 3.2) / nh + 0.8, inw > 0 ? Math.PI / 2 : -Math.PI / 2, { cols: 7, rows: 8, wood: '#5e3f29' }, { noCollide: true });
    s.structure(() => { g.mat('wood', '#4a3222'); L.box(outer, 0, q0 + 2.0, outer + inw * 0.32, 0.85, q1 - 1.0, { faces: 'yYxXzZ' }); });
    L.solid(Math.min(outer, outer + inw * 0.32), 0, q0 + 2.0, Math.max(outer, outer + inw * 0.32), 0.85, q1 - 1.0);
    // the writer's desk near the door, facing the room: the writer behind it, a chair for whoever dictates
    const dp = mid - inw * Math.min(2.2, wd / 2 - 1.3), dq = q0 + 2.4;
    L.prop('table', dp, 0, dq, 0, { w: 1.6, d: 0.8, wood: '#4a3222', legs: 'four' });
    s.detail(() => {
      g.mat('paper', '#f2ead8'); for (let k = 0; k < 6; k++) L.box(dp - 0.55 + k * 0.004, 0.74 + k * 0.002, dq - 0.28, dp - 0.12 + k * 0.004, 0.742 + k * 0.002, dq + 0.02);
      g.mat('paper', '#efe6d2'); L.box(dp + 0.05, 0.74, dq - 0.3, dp + 0.4, 0.745, dq + 0.15, { faces: 'Y' });
      g.mat('paint', '#3a3530'); for (let l = 0; l < 9; l++) L.box(dp + 0.08, 0.746, dq - 0.26 + l * 0.04, dp + 0.08 + r.f(0.18, 0.3), 0.747, dq - 0.25 + l * 0.04, { faces: 'Y' });
      g.mat('cast', '#2a2622'); L.box(dp + 0.42, 0.74, dq - 0.2, dp + 0.44, 0.75, dq + 0.05);
    });
    if (hasProp('books.greenlamp')) L.prop('books.greenlamp', dp - 0.6, 0.74, dq - 0.2, 0, {});
    L.prop('lots-theatre.seat', dp, 0, dq - 0.75, 0, { k: 1, fab: '#2f5d50' }, { noSpots: true });
    L.prop('lots-theatre.seat', dp + 0.2, 0, dq + 0.85, Math.PI, { k: 2, fab: '#8c3b26' }, { noSpots: true });
    L.spot('work', dp, 0, dq - 0.75, 0, { tags: ['write', 'letters'] });
    L.spot('sit', dp + 0.2, 0.46, dq + 0.85, Math.PI, { tags: ['letters'] });
    L.interact({ p: dp, y: 1.0, q: dq + 0.7, radius: 1.6, prompt: 'Ask about dictating a letter', onUse: (gm) => say(gm, 'The letter desk', someBy(lot.seed, 41, LETTERS, 3)) });
    // long tables where people write their own, a lamp over each; as many as the room is wide
    const nt = clamp(Math.floor((wd - 3.0) / 3.4), 1, 3), tl = Math.min(Math.floor((q1 - dq - 3.0) * 2) / 2, 6.0), tq = dq + 1.9 + tl / 2;
    L.prop('rug', dp, 0, dq, 0, { w: 2.6, d: 2.2, a: S.felt, b: '#e9dcc0' });
    if (tl > 1.6) for (let t = 0; t < nt; t++) {
      const tp = outer + inw * (1.9 + (t + 0.5) * (wd - 2.4) / nt);
      L.prop('table', tp, 0, tq, Math.PI / 2, { w: tl, d: 0.9, wood: t % 2 ? '#6b4a2f' : '#5a3a22', legs: 'trestle' });
      for (const sg of [-1, 1]) for (let k = 0; k < Math.floor(tl / 0.85); k++) {
        const q = tq - tl / 2 + 0.42 + k * 0.85, p = tp + sg * 0.7;
        L.prop('lots-theatre.seat', p, 0, q, sg > 0 ? -Math.PI / 2 : Math.PI / 2, { k: (k + t + 2) % 5, fab: FELTS[(k + t * 3 + 5) % 8] }, { noSpots: true });
        L.spot('sit', p, 0.46, q, sg > 0 ? -Math.PI / 2 : Math.PI / 2, { tags: ['letters', 'read'] });
        if ((k + t) % 2 === 0) s.detail(() => { g.mat('paper', '#f2ead8'); L.box(tp + sg * 0.32 - 0.12, 0.74, q - 0.15, tp + sg * 0.32 + 0.12, 0.743, q + 0.15, { faces: 'Y' }); g.mat('paint', '#3a3530'); L.box(tp + sg * 0.32 - 0.1, 0.743, q - 0.1, tp + sg * 0.32 + 0.06, 0.745, q - 0.09, { faces: 'Y' }); });
      }
      L.lamp('globe', tp, HF, tq, { drop: 0.9, K: 2700, power: 1.2, clip, range: 7 });
      s.detail(() => { g.mat('glaze', '#1d6a48'); for (const dq2 of [-tl / 3, tl / 3]) L.lathe(tp, tq + dq2, [[0.07, 0.74], [0.05, 0.76], [0.015, 0.78], [0.015, 0.98], [0.11, 1.02], [0.02, 1.1], [0, 1.1]], { segs: 10 }); });
      await tick('letter table');
    }
    // a pin board of letters on the inner wall, a paper chest by the desk, plants under a grow lamp
    {
      const iw = lampLeft ? a + 0.02 : b - 0.02, ii = -inw, bl = Math.min(4.0, q1 - q0 - 6), b0 = q0 + 4.4;
      s.structure(() => {
        g.mat('wood', '#4a3222'); L.box(iw, 1.0, b0, iw + ii * 0.04, 2.3, b0 + bl);
        g.mat('weave', '#b08a5a'); L.box(iw + ii * 0.04, 1.06, b0 + 0.06, iw + ii * 0.05, 2.24, b0 - 0.06 + bl, { faces: ii > 0 ? 'X' : 'x' });
        for (let k = 0; k < Math.round(bl * 5); k++) { g.mat('paper', ['#f2ead8', '#efe6d2', '#e6d8b8', '#cfe0d8', '#f0d8c8'][k % 5]); const qq = b0 + 0.2 + r.f(0, bl - 0.45), yy = r.f(1.15, 1.85); L.box(iw + ii * 0.05, yy, qq, iw + ii * 0.055, yy + r.f(0.22, 0.32), qq + r.f(0.18, 0.26), { faces: ii > 0 ? 'X' : 'x' }); }
      });
      L.interact({ p: iw + ii * 0.8, y: 1.5, q: b0 + bl / 2, radius: 1.6, prompt: 'Read the pin board', onUse: (gm) => say(gm, 'The pin board', [pickBy(lot.seed, 43, ['Notes pinned for anyone: "Writing to Selkie. Anyone with a choir part to send, give it to the desk by Friday."', 'A card: "If you are writing across the Shade, write the date in full. They will want to know what year it was here."', 'A list of relay days for the long letters, and beside it a list of who is waiting for an answer, with the years they have waited.']), pickBy(lot.seed, 44, ['A child’s letter to a raft eight years away, pinned up to be admired before it goes. It asks what they eat.', 'A note in a careful hand: "My mother’s answer came today. She wrote it before I was born. Thank you to the desk."'])]) });
      L.prop('plant', iw + ii * 0.5, 0, q1 - 0.5, 0, { kind: 'fern', size: 1.1, pot: '#2f6f73' }); L.prop('plant', iw + ii * 1.2, 0, q1 - 0.45, 0, { kind: 'broad', size: 1.4, pot: '#a3563a' });
      s.deco(() => { g.mat('diffuser', '#fff4d8', { emissive: 4, lamp: true }); L.box(iw + ii * 0.3, 2.3, q1 - 0.8, iw + ii * 1.5, 2.33, q1 - 0.25); g.mat('brushed', '#5a5046'); L.box(iw + ii * 0.28, 2.33, q1 - 0.82, iw + ii * 1.52, 2.36, q1 - 0.23); });
      L.prop('crate', dp + 1.35, 0, dq - 0.1, 0.1, { w: 0.6, h: 0.7, d: 0.45, wood: '#6b4a2f' });
      L.spot('stand', iw + ii * 0.75, 0, b0 + bl * 0.3, ii > 0 ? Math.PI / 2 : -Math.PI / 2, { tags: ['read', 'board'] });
    }
    L.glowBox(a, 0, q0, b, HF, q1, { sky: '#ffdcae', ground: '#6b4a2f', power: 0.24 });
    for (let p = a + 1.5; p < b - 1; p += 5) baffle(L, [p, q0 + 1.0], [p + 0.1, q1 - 1.0], HF, shadeHex(S.felt, 0.6), 0.22);
    L.zone(a, -0.5, q0, b, HF, q1, { id: lot.id + '/letters', place: 'city-special', name: 'The letter room', sub: 'long letters, read once', ambience: 'quiet', reverb: 'felt', cell: info.key });
    L.path([[dLet + 0.6, QF + 1.0], [mid, q0 + 1.3], [dp, dq + 1.3], [dp, q1 - 1.0]], { width: 1.0 });
  }
  await tick('letter room');

  L.zone(0, -0.5, 0, W, HT, D, { id: lot.id, place: 'city-special', name: 'The reading rooms', sub: info.name + (high ? ' · the High decks read slowly' : ' · what came in by light today'), ambience: 'quiet', reverb: 'felt', cell: info.key });
  void mixHex;
}
