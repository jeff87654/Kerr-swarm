// The four kinds of hall, and the tables in them. Everything is in the lot's own (p, q) (see lots_halls_kit.js).
//   refectory  a low beamed room, dark wood and ochre plaster, one unbroken table under a row of enamel pendants
//   whitewash  tall for its deck, white to the ceiling, the table a long oval at the far end with the kitchen at its head
//   felts      three long tables side by side under rows of hung felt, cloth lanterns slung low
//   elders     a High-deck hall at half a g: panelled, felt above, settles with backs, cast lids heavier than the bowls
import { shadeHex, mixHex } from '../core/util.js';
import { pickBy } from './lots_halls_kit.js';

export const GLAZES = ['#e9e1cf', '#a9c6b0', '#d4a24a', '#3a4a7a', '#b5653a', '#8fb3c4'];
export const LIDS = ['#e9e1cf', '#c9552e', '#2f6c66', '#d6a640', '#33407a', '#8c2c26'];
const MATS = ['#b8a283', '#a99878', '#c9a77a', '#b9c4a8'];
export const COATS = ['#6e7f3a', '#2f6f8f', '#8a3a2e', '#d6a640', '#5b4060', '#3a3a44', '#c9552e', '#2a6a5a', '#9a7a5a'];

// Which kind a block's hall is: by its band, its style (0 to 5) and its seed.
export function pickKind(info, seed) {
  if (info.band === 'high') return pickBy(seed, 3, [0, 1, 2, 3, 4]) < 4 ? 'elders' : (info.style % 2 ? 'whitewash' : 'refectory');
  const base = ['refectory', 'refectory', 'whitewash', 'whitewash', 'felts', 'felts'][info.style] || 'refectory';
  if (pickBy(seed, 5, [0, 1, 2, 3]) === 0) return { refectory: 'whitewash', whitewash: 'felts', felts: 'refectory' }[base];
  return base;
}

// The look of each kind, three versions each, chosen by style and seed.
const LOOKS = {
  refectory: [
    { wall: '#d9b98a', dado: '#5a3a26', beam: '#3e2a1c', ceil: '#4a3222', floor: ['planks', '#a8794f'], table: '#5e3b24', bench: '#7a5233', runner: '#8c2c26', shade: '#2f6c66', front: '#c9b38e', rug: '#8c2c26' },
    { wall: '#e2c79c', dado: '#4b2f1f', beam: '#4a3020', ceil: '#553826', floor: ['planks', '#b98a5a'], table: '#6b4a2f', bench: '#8a6240', runner: '#283062', shade: '#8c2c26', front: '#d2bc96', rug: '#283062' },
    { wall: '#cdb08a', dado: '#3a4a36', beam: '#33261a', ceil: '#5a3e28', floor: ['planks', '#9a6e46'], table: '#4b2f1f', bench: '#6b4a2f', runner: '#3c5a3e', shade: '#d1952c', front: '#bfa682', rug: '#6b7a3a' },
  ],
  whitewash: [
    { wall: '#f1ece0', dado: '#2f6c66', ceil: '#f6f2e8', floor: ['terrazzo', '#e3dccb'], border: '#2f6c66', table: '#c9a77a', rim: '#2f6c66', bench: '#b98a5a', front: '#ece4d2', glow: '#fff1dc' },
    { wall: '#f3eee4', dado: '#8a2f3c', ceil: '#f8f4ec', floor: ['terrazzo', '#e8dcc6'], border: '#8a2f3c', table: '#d0ae80', rim: '#8a2f3c', bench: '#a87a50', front: '#efe6d4', glow: '#fff0d8' },
    { wall: '#eef0ea', dado: '#33407a', ceil: '#f4f5f0', floor: ['terrazzo', '#dcdcd2'], border: '#33407a', table: '#c4a07a', rim: '#d6a640', bench: '#9a7450', front: '#e6e6dc', glow: '#f6f2ea' },
  ],
  felts: [
    { wall: '#c9b48e', felt: '#4a3e34', dado: '#4b2f1f', ceil: '#2c2832', floor: ['planks', '#7a5233'], table: '#5a3a26', bench: '#6b4a2f', felts: ['#8c2c26', '#d1952c', '#2f6c66', '#283062', '#c9552e', '#5b3a6e'], lantern: '#f2b56b', front: '#b9a27e' },
    { wall: '#d2bc96', felt: '#383e42', dado: '#3a2a20', ceil: '#262a30', floor: ['planks', '#86603e'], table: '#4b2f1f', bench: '#5a3a26', felts: ['#33407a', '#e0b04a', '#8a2f3c', '#3f6f6a', '#d6a640', '#2a3a5a'], lantern: '#f6c27a', front: '#c4ad88' },
    { wall: '#c4ad8a', felt: '#46383a', dado: '#3a2a20', ceil: '#2e2629', floor: ['planks', '#6e4a30'], table: '#5e3b24', bench: '#7a5233', felts: ['#a8412b', '#6b7a3a', '#d6a640', '#5b3a6e', '#c9552e', '#2f6f73'], lantern: '#f0a868', front: '#b3a07c' },
  ],
  elders: [
    { wall: '#8a9a7e', panel: '#6b4a30', dado: '#5a3a26', ceil: '#7a5a3c', floor: ['planks', '#8a6240'], table: '#5a3a26', settle: '#4b2f1f', cushion: '#8c2c26', rug: '#5b3a6e', lid: '#a88445', front: '#c8b08a', curtain: '#5b3a6e' },
    { wall: '#9a8070', panel: '#5a3a26', dado: '#4b2f1f', ceil: '#6b4a30', floor: ['planks', '#7a5233'], table: '#4b2f1f', settle: '#3e2a1c', cushion: '#2f6c66', rug: '#8a2f3c', lid: '#8a8a82', front: '#c0a888', curtain: '#2f6c66' },
    { wall: '#7e8a94', panel: '#6b4a2f', dado: '#4b2f1f', ceil: '#7a5233', floor: ['planks', '#8a6a48'], table: '#5e3b24', settle: '#4a3020', cushion: '#d1952c', rug: '#283062', lid: '#b08a50', front: '#bfb09a', curtain: '#8c2c26' },
  ],
};
// Height of the ceiling inside each kind (the front is always drawn to the street's band at 3.2 and above).
const HEIGHTS = { refectory: 3.15, whitewash: 3.4, felts: 3.3, elders: 3.1 };
export function lookOf(kind, info, seed) {
  const list = LOOKS[kind], K = Object.assign({}, list[(info.style + pickBy(seed, 9, [0, 1, 2])) % list.length]);
  K.H = HEIGHTS[kind];
  return K;
}

// ---------------------------------------------------------------------------------------------------------------
// The front: arches (or a colonnade) along the court span
// ---------------------------------------------------------------------------------------------------------------
// openings along [c0, c1] for each kind: { at, w, h } with the spring of the arch
export function archesFor(kind, c0, c1) {
  const spec = { refectory: [3.0, 1.0, 2.75, 2.15], whitewash: [2.7, 0.5, 2.85, 2.85], felts: [3.4, 0.8, 2.8, 2.35], elders: [2.8, 1.0, 2.7, 2.1] }[kind];
  const [aw, pier, h, spring] = spec, len = c1 - c0 - 0.6;
  let n = Math.max(1, Math.floor((len + pier) / (aw + pier))); if (n % 2 === 0) n--;            // odd, so one opening is centred on the court
  const used = n * aw + (n - 1) * pier, start = c0 + 0.3 + (len - used) / 2;
  const out = []; for (let k = 0; k < n; k++) out.push({ at: start + k * (aw + pier), w: aw, h, spring });
  return out;
}
// Fill the corners of a round-headed opening (in a wall along p from q0 to q1) between its spring and its square top.
export function archFill(C, a, mat, tint, inner, q0, q1) {
  const { L, g, s } = C; const hw = a.w / 2, pc = a.at + hw, ys = a.spring, yt = a.h, n = 10;
  if (yt - ys < 0.05) return;
  const pts = []; for (let i = 0; i <= n; i++) { const u = -hw + 2 * hw * i / n; pts.push([pc + u, ys + (yt - ys) * Math.sqrt(Math.max(0, 1 - (u / hw) * (u / hw)))]); }
  g.mat(mat, tint);
  for (let i = 0; i < n; i++) {
    const A = pts[i], Bp = pts[i + 1];
    L.quad([A[0], A[1], q0], [Bp[0], Bp[1], q0], [Bp[0], yt, q0], [A[0], yt, q0], { double: true });
    L.quad([A[0], A[1], q0], [A[0], A[1], q1], [Bp[0], Bp[1], q1], [Bp[0], Bp[1], q0], { double: true });
  }
  g.mat(mat, inner || tint);
  for (let i = 0; i < n; i++) { const A = pts[i], Bp = pts[i + 1]; L.quad([A[0], A[1], q1], [Bp[0], Bp[1], q1], [Bp[0], yt, q1], [A[0], yt, q1], { double: true }); }
  s.flush({ tier: 's' });
  return pts;
}

// ---------------------------------------------------------------------------------------------------------------
// Tables. A straight run: top, trestles, runner, benches (or settles), a seat every 0.75 m, a laid place at every seat,
// and the things down the middle. Returns the seats: { p, q, a, spot, side }.
// ---------------------------------------------------------------------------------------------------------------
export async function tableRun(C, pa, pb, tq, o, tick) {
  const { L, g, s, r, K } = C; const hd = 0.45, seats = [];
  const top = o.top || K.table, leg = shadeHex(top, 0.8);
  // the top in boards of up to six metres, so it is culled in pieces and bends with the drum
  for (let a = pa; a < pb - 0.01; a += 6) {
    const b = Math.min(pb, a + 6);
    g.mat('wood', top, { rough: -0.1 }); L.box(a + 0.004, 0.71, tq - hd, b - 0.004, 0.75, tq + hd, { bevel: 0.012 });
    g.mat('wood', leg);
    for (let p = a + 0.4; p < b - 0.2; p += 2.4) {
      for (const sg of [-1, 1]) L.box(p - 0.045, 0.04, tq + sg * 0.3 - 0.04, p + 0.045, 0.71, tq + sg * 0.3 + 0.04, { bevel: 0.008 });
      L.box(p - 0.05, 0, tq - 0.4, p + 0.05, 0.06, tq + 0.4, { bevel: 0.01 }); L.box(p - 0.04, 0.64, tq - 0.4, p + 0.04, 0.71, tq + 0.4);
    }
    L.box(a + 0.4, 0.3, tq - 0.025, b - 0.4, 0.36, tq + 0.025);
    if (o.runner) { g.mat('stripe', o.runner); L.box(a + 0.2, 0.75, tq - 0.17, b - 0.2, 0.754, tq + 0.17, { faces: 'Y' }); }
    s.flush({ tier: 's', cast: true });
  }
  L.solid(pa, 0.3, tq - hd, pb, 0.75, tq + hd, { surf: 'wood' });
  if (tick) await tick();
  // benches both sides, in pieces about three metres long
  for (const sg of [-1, 1]) {
    const bq = tq + sg * 0.78, a = sg < 0 ? 0 : Math.PI;
    const n = Math.max(1, Math.round((pb - pa) / 3)), len = (pb - pa) / n;
    for (let k = 0; k < n; k++) {
      const a0 = pa + k * len + 0.03, a1 = pa + (k + 1) * len - 0.03, pm = (a0 + a1) / 2;
      if (o.settle) { L.prop('lots-halls.settle', pm, 0, bq, a, { len: +(a1 - a0).toFixed(2), wood: K.settle, cushion: K.cushion }, { noSpots: true }); continue; }
      const wood = o.paint && r.chance(0.18) ? r.pick(['#2f6c66', '#7a2f28', '#3c5a3e', '#c58a2c']) : shadeHex(o.bench || K.bench, r.f(0.9, 1.08));
      g.mat('wood', wood, { rough: -0.05 }); L.box(a0, 0.41, bq - 0.16, a1, 0.45, bq + 0.16);
      g.mat('wood', shadeHex(wood, 0.75));
      for (const lp of [a0 + 0.15, a1 - 0.15].concat(a1 - a0 > 2.2 ? [pm] : [])) L.box(lp - 0.03, 0, bq - 0.14, lp + 0.03, 0.41, bq + 0.14, { faces: 'xXzZ' });
      L.box(a0 + 0.15, 0.14, bq - 0.02, a1 - 0.15, 0.19, bq + 0.02, { faces: 'yYzZ' });
      if (o.cushions && r.chance(0.35)) { g.mat('felt', r.pick(o.cushions)); L.box(a0 + 0.05, 0.45, bq - 0.13, a1 - 0.05, 0.47, bq + 0.13, { bevel: 0.008 }); }
      s.flush({ tier: 's', cast: true });
      L.solid(a0, 0, bq - 0.16, a1, 0.45, bq + 0.16, { surf: 'wood' });
    }
    // a seat every 0.75 m, a laid place in front of each
    const ns = Math.floor((pb - pa - 0.15) / 0.75), off = (pb - pa - ns * 0.75) / 2 + 0.375;
    for (let i = 0; i < ns; i++) {
      const p = pa + off + i * 0.75;
      const spot = L.spot('sit', p, 0.45, bq, a, { tags: ['hall', 'eat', 'table'].concat(o.tags || []) });
      seats.push({ p, q: bq, a, spot, side: sg });
      const gi = (i * 7 + (sg > 0 ? 3 : 0) + C.salt) % GLAZES.length;
      L.prop('lots-halls.place', p + r.f(-0.03, 0.03), 0.75, tq + sg * 0.25, (sg < 0 ? Math.PI : 0) + r.f(-0.15, 0.15), { mat: MATS[(gi + C.salt) % 2], glaze: GLAZES[gi], lid: o.heavy ? K.lid : LIDS[gi], heavy: !!o.heavy }, { tint: [r.f(0.9, 1.04), r.f(0.9, 1.02), r.f(0.88, 1.0)] });
    }
    if (tick) await tick();
  }
  centre(C, pa, pb, [tq], o.every || 1.6, o);
  if (tick) await tick();
  return seats;
}

// Down the middle of a table: herbs, jugs, the Nine, tureens, crocks of pickles. qs: the lines to put them on.
export function centre(C, pa, pb, qs, every, o) {
  const { L, r } = C; let i = C.salt;
  for (const q of qs) for (let p = pa + 0.8; p < pb - 0.5; p += every, i++) {
    const k = i % 5, qq = q + (i % 2 ? 0.07 : -0.07);
    if (k === 0) L.prop('lots-halls.herbs', p, 0.754, q, r.f(0, 6), { seed: i % 3, pot: ['#b4643e', '#a9573a', '#c47a4e'][i % 3], leaf: ['#cfe8a0', '#b8d890', '#e0f0b0'][i % 3] });
    else if (k === 1) L.prop('lots-halls.jug', p, 0.754, qq, r.f(0, 6), { glaze: ['#e9e1cf', '#a9c6b0', '#d4a24a', '#8fb3c4'][i % 4] });
    else if (k === 2) L.prop('lots-halls.nine', p, 0.754, qq, r.f(0, 6), {});
    else if (k === 3) L.prop('lots-halls.tureen', p, 0.754, qq, r.f(0, 6), { glaze: o && o.heavy ? '#8a8a82' : ['#b5653a', '#2f6c66', '#e9e1cf', '#3a4a7a'][i % 4] });
    else L.prop('lots-halls.crock', p, 0.754, qq, 0, { glaze: ['#8a5a3c', '#3a4a7a', '#c9a24a'][i % 3], h: 0.12, r: 0.05 });
  }
}

// The long oval: a stadium of scrubbed wood from pa to pb, half-width R, with chairs round its ends.
export async function ovalTable(C, pa, pb, tq, R, tick) {
  const { L, g, s, r, K } = C; const seats = [];
  const s0 = pa + R, s1 = pb - R;
  // the top: the straight middle in pieces, and a half-disc at each end
  for (let a = s0; a < s1 - 0.01; a += 4) { const b = Math.min(s1, a + 4); g.mat('wood', K.table, { rough: -0.12 }); L.box(a, 0.71, tq - R, b, 0.75, tq + R); s.flush({ tier: 's', cast: true }); }
  for (const end of [-1, 1]) {
    const pc = end < 0 ? s0 : s1;
    // the half-disc: points from (pc, tq - R) round the outside to (pc, tq + R)
    const half = []; for (let i = 0; i <= 10; i++) { const t = -Math.PI / 2 + Math.PI * i / 10; half.push([pc + end * Math.cos(t) * R, tq + Math.sin(t) * R]); }
    g.mat('wood', K.table, { rough: -0.12 }); L.prism(half, 0.71, 0.75);
    g.mat('paint', K.rim); L.tube(half.map((v) => [v[0], 0.735, v[1]]), 0.022, { segs: 5, caps: false });
    s.flush({ tier: 's', cast: true });
    L.solid(pc + (end < 0 ? -R * 0.92 : 0), 0.3, tq - R * 0.6, pc + (end < 0 ? 0 : R * 0.92), 0.75, tq + R * 0.6);
    L.solid(pc + (end < 0 ? -R * 0.6 : 0), 0.3, tq - R * 0.92, pc + (end < 0 ? 0 : R * 0.6), 0.75, tq + R * 0.92);
  }
  // a painted rim along the straight sides, pedestals underneath
  g.mat('paint', K.rim); for (const sg of [-1, 1]) L.box(s0, 0.712, tq + sg * R - 0.022, s1, 0.756, tq + sg * R + 0.022);
  g.mat('wood', shadeHex(K.table, 0.7));
  for (let p = s0; p <= s1 + 0.01; p += Math.max(2.5, (s1 - s0) / Math.max(1, Math.round((s1 - s0) / 3)))) { L.cyl(p, 0, tq, 0.3, 0.05, { segs: 10 }); L.cyl(p, 0.05, tq, 0.08, 0.66, { segs: 8, r1: 0.06 }); L.box(p - 0.04, 0.66, tq - R + 0.15, p + 0.04, 0.71, tq + R - 0.15); }
  s.flush({ tier: 's', cast: true });
  L.solid(s0, 0.3, tq - R, s1, 0.75, tq + R, { surf: 'wood' });
  if (tick) await tick();
  // benches along the straights
  for (const sg of [-1, 1]) {
    const bq = tq + sg * (R + 0.33), a = sg < 0 ? 0 : Math.PI;
    const n = Math.max(1, Math.round((s1 - s0) / 3)), len = (s1 - s0) / n;
    for (let k = 0; k < n; k++) {
      const a0 = s0 + k * len + 0.03, a1 = s0 + (k + 1) * len - 0.03;
      const wood = shadeHex(K.bench, r.f(0.92, 1.06));
      g.mat('wood', wood, { rough: -0.05 }); L.box(a0, 0.41, bq - 0.16, a1, 0.45, bq + 0.16);
      g.mat('paint', K.rim); for (const lp of [a0 + 0.15, a1 - 0.15]) L.box(lp - 0.03, 0, bq - 0.14, lp + 0.03, 0.41, bq + 0.14, { faces: 'xXzZ' });
      s.flush({ tier: 's', cast: true });
      L.solid(a0, 0, bq - 0.16, a1, 0.45, bq + 0.16, { surf: 'wood' });
    }
    const ns = Math.floor((s1 - s0 - 0.1) / 0.75), off = (s1 - s0 - ns * 0.75) / 2 + 0.375;
    for (let i = 0; i < ns; i++) {
      const p = s0 + off + i * 0.75;
      seats.push({ p, q: bq, a, spot: L.spot('sit', p, 0.45, bq, a, { tags: ['hall', 'eat', 'table'] }), side: sg });
      const gi = (i * 5 + (sg > 0 ? 2 : 0) + C.salt) % GLAZES.length;
      L.prop('lots-halls.place', p, 0.75, tq + sg * (R - 0.24), sg < 0 ? Math.PI : 0, { mat: MATS[(gi + C.salt) % 2], glaze: GLAZES[gi], lid: LIDS[gi] }, { tint: [r.f(0.9, 1.04), r.f(0.9, 1.02), r.f(0.88, 1.0)] });
    }
    if (tick) await tick();
  }
  // chairs round the ends, facing in
  for (const end of [-1, 1]) {
    const pc = end < 0 ? s0 : s1, rr = R + 0.4, n = Math.max(3, Math.floor(Math.PI * rr / 0.75));
    for (let i = 0; i < n; i++) {
      const t = -Math.PI / 2 + Math.PI * (i + 0.5) / n, dp = end * Math.cos(t), dq = Math.sin(t);
      const p = pc + dp * rr, q = tq + dq * rr, a = Math.atan2(-dp, -dq);
      L.prop('lots-halls.chair', p, 0, q, a, { wood: shadeHex(K.bench, 0.85), seat: K.rim }, { noSpots: true });
      seats.push({ p, q, a, spot: L.spot('sit', p, 0.45, q, a, { tags: ['hall', 'eat', 'table'] }), side: 0 });
      L.prop('lots-halls.place', pc + dp * (R - 0.24), 0.75, tq + dq * (R - 0.24), a + Math.PI, { mat: MATS[(i + C.salt) % 2], glaze: GLAZES[(i + C.salt) % 6], lid: LIDS[(i + C.salt) % 6] });
    }
  }
  // two lines of things down the middle, and a big herb pot at each end
  centre(C, s0, s1, [tq - 0.4, tq + 0.4], 1.7, null);
  for (const pc of [s0, s1]) L.prop('plant', pc, 0.754, tq, 0, { kind: 'fine', size: 0.55, pot: K.rim });
  if (tick) await tick();
  return seats;
}

// ---------------------------------------------------------------------------------------------------------------
// Ceilings and walls for each kind
// ---------------------------------------------------------------------------------------------------------------
export async function dress(C, tick) {
  const { L, g, s, K, kind, W, D, r } = C, H = K.H, t = C.t;
  if (kind === 'refectory') {
    // beams across the room every 2.5 m, a wall plate along both long walls
    g.mat('wood', K.beam, { rough: 0.05 });
    for (let p = 1.25; p < W - 0.5; p += 2.5) L.box(p - 0.12, H - 0.3, t, p + 0.12, H, D - t, { bevel: 0.015 });
    for (const q of [t, D - t - 0.16]) L.box(0, H - 0.22, q, W, H, q + 0.16, { bevel: 0.01 });
    s.flush({ tier: 's' });
    // a plate shelf on the back wall at 1.95 wherever the wall is free, plates stood along it
    let k = C.salt;
    for (const fr of C.backFree) {
      if (fr[1] - fr[0] < 1.2) continue;
      g.mat('wood', K.dado); L.box(fr[0] + 0.1, 1.92, D - t - 0.16, fr[1] - 0.1, 1.96, D - t, { bevel: 0.006 }); L.box(fr[0] + 0.1, 1.86, D - t - 0.03, fr[1] - 0.1, 1.92, D - t);
      s.flush({ tier: 's' });
      for (let p = fr[0] + 1.0; p < fr[1] - 0.9; p += 2.4, k++) L.prop('lots-halls.platerow', p, 1.96, D - t - 0.08, Math.PI, { k: k % 6 });
    }
  } else if (kind === 'whitewash') {
    // a stepped cornice all round, pilasters on the back wall, a coloured border in the floor
    g.mat('plaster', shadeHex(K.wall, 0.97));
    for (const q of [t, D - t - 0.14]) { L.box(0, H - 0.16, q, W, H, q + 0.14); }
    L.box(t, H - 0.16, t, t + 0.14, H, D - t); L.box(W - t - 0.14, H - 0.16, t, W - t, H, D - t);
    g.mat('plaster', shadeHex(K.wall, 0.93)); for (const q of [t, D - t - 0.07]) L.box(0, H - 0.28, q, W, H - 0.16, q + 0.07);
    s.flush({ tier: 's' });
    g.mat('terrazzo', K.border); for (const q of [t + 0.25, D - t - 0.45]) L.box(t + 0.25, 0.001, q, W - t - 0.25, 0.006, q + 0.2, { faces: 'Y' });
    s.flush({ tier: 's' });
    // a painted band at the height of the doors, and shallow pilasters on the back wall's free stretches, white on white
    g.mat('paint', K.border); L.box(t, 2.36, D - t - 0.006, W - t, 2.42, D - t, { faces: 'z' }); L.box(t, 2.36, t, W - t, 2.42, t + 0.006, { faces: 'Z' });
    s.flush({ tier: 's' });
    g.mat('plaster', shadeHex(K.wall, 0.96));
    for (const fr of C.backFree) for (let p = fr[0] + 0.6; p < fr[1] - 0.4; p += 4.2) { L.box(p - 0.2, 0, D - t - 0.1, p + 0.2, H - 0.28, D - t, { faces: 'xXz' }); }
    s.flush({ tier: 's' });
  } else if (kind === 'felts') {
    // rows of hung felt across the room, each on its own rod
    let k = C.salt;
    for (let p = 1.6; p < W - 1.0; p += 1.85, k++) {
      const col = K.felts[k % K.felts.length], drop = 0.3 + (k % 3) * 0.06;
      g.mat('cast', '#2a2420'); L.tube([[p, H - 0.05, t + 0.3], [p, H - 0.05, D - t - 0.3]], 0.014, { segs: 5, caps: false });
      g.mat('felt', col); L.sheet([p, H - 0.06, t + 0.45], [p, H - 0.06, D - t - 0.45], [p, H - 0.06 - drop, D - t - 0.45], [p, H - 0.06 - drop, t + 0.45], { nu: 6, nv: 2, sag: 0.08, ripple: 0.025, rippleN: 7 });
      s.flush({ tier: 's' });
      if (k % 6 === 0 && tick) await tick();
    }
  } else {
    // the elders' hall: a panelled ceiling with shallow coffers, a handrail round the walls on brackets
    g.mat('wood', shadeHex(K.ceil, 0.8));
    for (let p = 1.5; p < W - 0.5; p += 3) L.box(p - 0.08, H - 0.14, t, p + 0.08, H, D - t, { bevel: 0.01 });
    for (const q of [D * 0.33, D * 0.67]) L.box(0, H - 0.12, q - 0.07, W, H, q + 0.07);
    s.flush({ tier: 's' });
  }
  if (tick) await tick();
  void r;
}

// The bright thing at the far end of the room, by kind. Returns the light it adds (one).
export function farEnd(C) {
  const { L, g, s, K, kind, D, t } = C; const pe = C.far, dir = -C.dir, pf = pe + dir * (t + 0.02);     // pf: the face of the far wall, dir: into the room
  const tq = D / 2, clip = C.clip;
  if (kind === 'refectory') {
    // a tall dresser of bowls and lids, lit from above
    const w = 2.4, d = 0.42;
    g.mat('wood', K.dado); L.box(pf, 0, tq - w / 2, pf + dir * d, 0.9, tq + w / 2, { bevel: 0.01 }); L.box(pf, 0.9, tq - w / 2, pf + dir * 0.06, 2.35, tq + w / 2);
    for (const qq of [tq - w / 2, tq + w / 2 - 0.05]) L.box(pf, 0.9, qq, pf + dir * 0.3, 2.4, qq + 0.05);
    for (const y of [1.3, 1.75, 2.2]) L.box(pf, y, tq - w / 2, pf + dir * 0.3, y + 0.03, tq + w / 2);
    L.box(pf, 2.35, tq - w / 2 - 0.05, pf + dir * 0.36, 2.45, tq + w / 2 + 0.05, { bevel: 0.01 });
    g.mat('paint', shadeHex(K.dado, 1.3)); for (const qq of [tq - 0.6, tq + 0.6]) L.box(pf + dir * d, 0.12, qq - 0.55, pf + dir * (d + 0.01), 0.8, qq + 0.55);
    s.flush({ tier: 's', cast: true });
    L.solid(Math.min(pf, pf + dir * d), 0, tq - w / 2, Math.max(pf, pf + dir * d), 0.9, tq + w / 2);
    for (const y of [0.903, 1.333, 1.783, 2.233]) for (let k = 0; k < 5; k++) {
      const qq = tq - w / 2 + 0.3 + k * (w - 0.6) / 4;
      if ((k + y * 10) % 3 < 1) L.prop('lots-halls.stack', pf + dir * 0.17, y, qq, 0, { n: 4 + (k % 2) * 2, glaze: GLAZES[k % 6] });
      else L.prop('lots-halls.bowl', pf + dir * 0.17, y, qq, 0, { glaze: GLAZES[(k + 2) % 6], lid: LIDS[k % 6] });
    }
    return L.light({ at: [pf + dir * 0.6, 2.7, tq], color: '#ffd9a0', power: 4.5, range: 5.5, lamp: true, clip, radius: 0.3 });
  }
  if (kind === 'whitewash') {
    // a light-painting lent by the block's painters: a dawn in bands, brown-violet to rose to gold, in a plain frame
    const w = 4.2, y0 = 0.95, y1 = 2.75, bands = ['#4a3550', '#6a4060', '#9a5a6a', '#d0806a', '#f0b070', '#ffe0a0'];
    g.mat('wood', '#3a2a20'); L.box(pf, y0 - 0.08, tq - w / 2 - 0.08, pf + dir * 0.06, y1 + 0.08, tq + w / 2 + 0.08, { bevel: 0.01 });
    s.flush({ tier: 's' });
    for (let i = 0; i < bands.length; i++) {
      const ya = y0 + (y1 - y0) * i / bands.length, yb = y0 + (y1 - y0) * (i + 1) / bands.length;
      g.mat('diffuser', bands[i], { emissive: 1.6 + i * 0.5, lamp: true }); L.box(pf + dir * 0.06, ya, tq - w / 2, pf + dir * 0.065, yb, tq + w / 2);
    }
    s.flush({ tier: 's' });
    return L.light({ at: [pf + dir * 1.2, 1.9, tq], color: '#ffc890', power: 3.2, range: 6, lamp: true, clip, radius: 0.8 });
  }
  if (kind === 'felts') {
    // a great striped hanging, wall to ceiling, washed with light from below
    const w = 5.0, cols = K.felts;
    g.mat('cast', '#2a2420'); L.tube([[pf + dir * 0.08, K.H - 0.15, tq - w / 2 - 0.2], [pf + dir * 0.08, K.H - 0.15, tq + w / 2 + 0.2]], 0.02, { segs: 6 });
    for (let i = 0; i < 6; i++) {
      const qa = tq - w / 2 + w * i / 6, qb = tq - w / 2 + w * (i + 1) / 6;
      g.mat('felt', cols[i % cols.length]); L.sheet([pf + dir * 0.1, K.H - 0.18, qa], [pf + dir * 0.1, K.H - 0.18, qb], [pf + dir * 0.1, 0.45, qb], [pf + dir * 0.1, 0.45, qa], { nu: 2, nv: 4, ripple: 0.02, rippleN: 2 });
    }
    s.flush({ tier: 's' });
    return L.light({ at: [pf + dir * 0.9, 0.5, tq], color: '#ffd09a', power: 4.0, range: 5.5, lamp: true, clip, radius: 0.4 });
  }
  // elders: a bright alcove of herbs under a grow lamp, and two armchairs
  const w = 3.2;
  g.mat('wood', K.panel); L.box(pf, 0, tq - w / 2, pf + dir * 0.55, 0.6, tq + w / 2, { bevel: 0.01 });
  g.mat('soil', '#ffffff'); L.box(pf + dir * 0.05, 0.6, tq - w / 2 + 0.05, pf + dir * 0.5, 0.605, tq + w / 2 - 0.05, { faces: 'Y' });
  g.mat('brushed', '#5c5852'); L.box(pf, 2.35, tq - w / 2, pf + dir * 0.5, 2.4, tq + w / 2);
  g.mat('diffuser', '#ffe6f6', { emissive: 5, lamp: false }); L.box(pf + dir * 0.08, 2.345, tq - w / 2 + 0.1, pf + dir * 0.42, 2.35, tq + w / 2 - 0.1, { faces: 'y' });
  s.flush({ tier: 's', cast: true });
  L.solid(Math.min(pf, pf + dir * 0.55), 0, tq - w / 2, Math.max(pf, pf + dir * 0.55), 0.6, tq + w / 2);
  for (let k = 0; k < 7; k++) L.prop('lots-halls.herbs', pf + dir * (0.18 + (k % 2) * 0.2), 0.6, tq - w / 2 + 0.3 + k * (w - 0.6) / 6, k, { seed: k % 3, pot: ['#b4643e', '#2f6c66', '#c47a4e'][k % 3], leaf: ['#cfe8a0', '#b8d890', '#e0f0b0'][k % 3] }, { scale: 1.6 });
  for (const sg of [-1, 1]) { const q = tq + sg * (w / 2 + 0.55), p = pf + dir * 0.6, a = Math.atan2(dir, -sg * 0.5); L.prop('chair', p, 0, q, a, { wood: K.settle, seat: K.cushion, back: 'slat' }, { noSpots: true }); L.spot('sit', p, 0.46, q, a, { tags: ['hall', 'rest'] }); }
  return L.light({ at: [pf + dir * 0.5, 2.15, tq], color: '#ffe8f0', power: 3.4, range: 4.5, lamp: false, clip, radius: 0.5 });
}

export function mix(a, b, t) { return mixHex(a, b, t); }
