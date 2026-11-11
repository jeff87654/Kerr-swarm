// The two smaller children's lots of the Low decks.
//  - The cradle arcade (special.cradle): an arcade of columns with pram berths down one side, warm benches over the loop
//    down the other under a wall of outgrown shoes, a weighing corner at the back, a lending shelf of small clothes and a
//    quiet room hung with felt.
//  - The naming rooms (special.naming): where a child is named with both families in the room. Two rooms off a foyer, each
//    with a table, two rows of chairs facing each other across it, the book of names at the head, and a sideboard for the
//    dish each family brings.
import { say, note } from '../city/lots.js';
import { roomGlow } from '../world/kit.js';
import { column, archway, planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';
import { PAL } from './school_parts.js';
import { local, front, drawing, pegs, arch, alt, KIDS, QF } from './lots_school_kit.js';

const GIVEN = ['Ama', 'Teo', 'Lumi', 'Ravi', 'Ines', 'Kofi', 'Mira', 'Oskar', 'Nia', 'Elio', 'Saoirse', 'Femi', 'Yara', 'Hugo', 'Abeni', 'Kenji', 'Tova', 'Idris', 'Maren', 'Sefa', 'Bo', 'Priya', 'Arlo', 'Zara', 'Lio', 'Hana'];
const FAMILY = ['Halloran', 'Oyelaran', 'Castellane', 'Okafor', 'Lindqvist', 'Asante', 'Duarte', 'Marr', 'Achebe', 'Moreau', 'Novak', 'Mensah', 'Kowal', 'Ferro', 'Quist', 'Iyer', 'Haddad', 'Okonjo', 'Pellier', 'Abara', 'Varga', 'Adeyemi', 'Kaur', 'Holm', 'Diallo', 'Silva'];
const KEEPERS = ['Dorothea', 'Emeka', 'Solveig', 'Anil', 'Grete', 'Kwabena', 'Lucia', 'Tamsin'];
const r1 = (x) => (Math.round(x * 10) / 10).toFixed(1);

// ===============================================================================================================
// The cradle arcade
// ===============================================================================================================
export async function buildCradle(s, lot, plan, game, tick) {
  const L = local(s, lot), r = new Rng(lot.seed ^ 0xc4ad1e), info = plan.info, g = s.g, W = L.W, D = L.D;
  const H = 3.3, B = 5.6, qb = D - B, E = 5.0, pe0 = Math.round((W - E) / 2 * 2) / 2, pe1 = pe0 + E;
  const C = alt(r, [
    { face: '#e8c7a0', inner: '#f6ead6', plinth: '#5fb3b3', trim: '#2f5d5a', accent: '#e9b23c', porchFloor: '#d9a27a', floor: '#c9a070', aisle: '#e9b23c', felt: ['#5fb3b3', '#e9b23c', '#d4878a', '#7cab4e'] },
    { face: '#d8d0e8', inner: '#f2eef6', plinth: '#5b3a6e', trim: '#3d2a4d', accent: '#e8c26a', porchFloor: '#bfa890', floor: '#b98a5a', aisle: '#8a4a6a', felt: ['#8a4a6a', '#e8c26a', '#5fb3b3', '#d9534f'] },
    { face: '#cfe0cf', inner: '#eef4ea', plinth: '#3d6f5a', trim: '#2a4a3a', accent: '#f08a4b', porchFloor: '#c9b08a', floor: '#c49464', aisle: '#f08a4b', felt: ['#3d6f5a', '#f08a4b', '#e9b23c', '#2f3f7a'] },
  ]);
  const DADO = { h: 1.0, mat: 'tile', tint: C.plinth };
  const nm = alt(r, ['CRADLE ARCADE', 'THE CRADLE ARCADE', 'CRADLE ARCADE', 'THE PRAM ARCADE']);
  const FR = await front(L, { name: nm, sub: alt(r, ['pram berths · warm benches · the weighing corner', 'warm benches · small clothes lent', 'open all hours · the quiet room at the back', info.name + ' · pram berths and the weighing book']), seed: lot.seed, porchW: E, porchAt: pe0, porchD: 1.6,
    windows: [[1.0, pe0 - 1.0, 0.75, 2.3], [pe1 + 1.0, W - 1.0, 0.75, 2.3]], pal: { face: C.face, inner: C.inner, plinth: C.plinth, trim: C.trim, accent: C.accent, porchFloor: C.porchFloor }, stripe: C.felt, lanterns: [C.accent, C.felt[0]] }, tick);
  const qi = FR.qIn, doorP = FR.doorP;
  // the shell
  L.floor(0, QF, W, qb, 0, 'planks', C.floor);
  L.floor(0, qb, W, D, 0, 'carpet', shadeHex(C.felt[0], 0.75));
  L.ceil(0, QF, W, D, H, 'paint', '#f6efe2');
  L.wallP(0.08, QF + 0.08, D - 0.08, H, { tint: C.inner, dado: DADO }); L.wallP(W - 0.08, QF + 0.08, D - 0.08, H, { tint: C.inner, dado: DADO });
  L.wallQ(D - 0.08, 0.16, W - 0.16, H, { tint: C.inner, dado: DADO });
  // the back: the quiet room (closed, felt) on one side, the weighing corner open on the other, the lending shelf between
  const qp1 = Math.min(10, W * 0.42), wp0 = W - Math.min(8, W * 0.34);
  L.wallQ(qb, 0.16, qp1, H, { deep: shadeHex(C.felt[0], 0.85), shallow: C.inner, dado: DADO, openings: [{ at: qp1 - 0.16 - 1.6, w: 1.1, h: 2.1 }, { at: 1.0, w: 2.0, sill: 1.0, h: 1.0 }] });
  L.wallP(qp1, qb, D - 0.08, H, { lo: shadeHex(C.felt[0], 0.85), hi: C.inner, dado: DADO });
  L.wallQ(qb, qp1, wp0, H, { tint: C.inner, dado: DADO });
  L.wallP(wp0, qb, D - 0.08, H, { lo: C.inner, hi: mixHex(C.inner, C.felt[1], 0.25), dado: DADO });
  L.frame(qp1 - 1.05, qb, 1.1, 2.1, 'p', { tint: C.trim });
  { const a = L.xz(1.16, qb), b = L.xz(3.16, qb); s.glass(a[0], 1.0, a[1], b[0], 2.0, b[1], { tint: '#e8dcc8', opacity: 0.35 }); }
  await tick();

  // the arcade: two lines of columns down its length, arches between them, lanterns in the aisle
  const ap0 = W * 0.34, ap1 = W * 0.66, aq0 = qi + 1.6, aq1 = qb - 1.0, n = Math.max(3, Math.round((aq1 - aq0) / 3.2));
  const clipA = L.clip(0.16, QF, W - 0.16, qb, H);
  roomGlow(s, clipA[0], 0, clipA[2], clipA[3], H, clipA[5], { sky: '#ffe0b8', ground: '#c9a070', power: 0.5 });
  for (const p of [ap0, ap1]) for (let i = 0; i <= n; i++) { const q = aq0 + (aq1 - aq0) * i / n, a = L.xz(p, q); column(s, a[0], 0, a[1], H, { r: 0.15, mat: 'plaster', tint: C.inner }); }
  for (const p of [ap0, ap1]) for (let i = 0; i < n; i++) { const qa = aq0 + (aq1 - aq0) * i / n + 0.17, qb2 = aq0 + (aq1 - aq0) * (i + 1) / n - 0.17; arch(L, p, qa, qb2, 2.3, H - 0.3, 0.26, 'plaster', shadeHex(C.inner, 0.96)); }
  s.structure(() => { g.mat('paint', C.trim); for (const p of [ap0, ap1]) L.bx(p - 0.13, aq0, H - 0.3, p + 0.13, aq1, H, { bevel: 0.01 }); for (let i = 0; i <= n; i++) { const q = aq0 + (aq1 - aq0) * i / n; L.bx(ap0, q - 0.1, H - 0.22, ap1, q + 0.1, H, { bevel: 0.01 }); } });
  for (let i = 0; i < n; i++) L.lamp('lantern', W / 2, aq0 + (aq1 - aq0) * (i + 0.5) / n, 2.45, { tint: C.felt[i % 4], clip: clipA, power: 0.9, drop: 0.55, r: 0.22 });
  s.structure(() => { g.mat('motif', shadeHex(C.aisle, 0.7)); L.bx(W / 2 - 1.0, aq0 - 0.8, 0, W / 2 + 1.0, aq1 + 0.4, 0.012); g.mat('weave', '#f1ead8'); L.bx(W / 2 - 0.92, aq0 - 0.8, 0.012, W / 2 - 0.84, aq1 + 0.4, 0.014); L.bx(W / 2 + 0.84, aq0 - 0.8, 0.012, W / 2 + 0.92, aq1 + 0.4, 0.014); });
  await tick();

  // pram berths down the low side: low partitions with a coloured post each, a pram in most
  const bw = 1.75, nb = Math.floor((aq1 - aq0 + 1.0) / bw);
  for (let i = 0; i < nb; i++) {
    const q = aq0 - 0.5 + i * bw;
    s.furniture(() => { g.mat('wood', '#b98a5a'); L.bx(0.16, q - 0.03, 0, 1.9, q + 0.03, 0.9, { bevel: 0.006 }); g.mat('paint', C.felt[i % 4]); L.bx(1.84, q - 0.06, 0, 1.96, q + 0.06, 1.25, { bevel: 0.01 }); });
    L.solid(0.16, q - 0.03, 0, 1.9, q + 0.03, 0.9);
    if (i < nb - 1 && r.chance(0.72)) { L.prop('lots-school.pram', 1.0, q + bw / 2, 0, L.yaw(1, 0) + r.f(-0.15, 0.15), { c: r.pick(['#2f3f7a', '#8a2f3c', '#3d6f5a', '#5b3a6e', '#c9962e', '#2f7f86']), lining: r.pick(['#f1ead8', '#f3d9a8', '#e9dcc0']) }); L.spot('stand', 2.2, q + bw / 2, 0, L.yaw(-1, 0), { tags: ['pram', 'cradle'] }); }
  }
  s.deco(() => { const wf = L.onWall('p', 0.16, 1); for (let q = aq0; q < aq1; q += 0.6) drawing(g, wf, q, r.f(1.5, 1.8), 0.4, 0.3, lot.seed + Math.round(q * 19), r.pick([0, 1, 5, 6])); });
  await tick();
  // warm benches down the high side, over the loop's grille, under the wall of outgrown shoes
  const sq0 = aq0 - 0.4, sq1 = aq1;
  s.structure(() => {
    g.mat('grille', '#c8a45a'); L.bx(W - 0.9, sq0, 0.0, W - 0.16, sq1, 0.05);
    g.mat('cast', '#b87333', { rough: -0.2 }); { const a = L.xz(W - 0.3, sq0), b = L.xz(W - 0.3, sq1); g.tube([[a[0], 0.14, a[1]], [b[0], 0.14, b[1]]], 0.035, { segs: 8 }); g.tube([[a[0], 0.25, a[1]], [b[0], 0.25, b[1]]], 0.035, { segs: 8 }); }
  });
  for (let q = sq0 + 1.0; q < sq1 - 0.8; q += 2.0) { L.prop('bench', W - 0.6, q, 0, L.yaw(-1, 0), { w: 1.8, back: true, wood: '#8a6240', metal: C.trim }, { spot: { tags: ['cradle', 'rest', 'warm'] } }); const a = L.xz(W - 0.62, q + r.f(-0.5, 0.5)); prop(s, 'school.cushion', a[0], 0.46, a[1], 0, { a: r.pick(C.felt), b: '#f6ecd6' }, { noCollide: true, noSpots: true }); }
  // the wall of shoes: rows of small shelves, a pair on each, outgrown and left for the next
  s.furniture(() => {
    const wf = L.onWall('p', W - 0.16, -1);
    for (let row = 0; row < 5; row++) { const y = 1.25 + row * 0.34; g.mat('wood', '#e3cfa8'); wf(sq0, y, sq1, y + 0.025, 0, 0.22); g.mat('paint', C.felt[row % 4]); wf(sq0, y - 0.03, sq1, y + 0.025, 0.22, 0.235); }
  });
  s.detail(() => {
    const wf = L.onWall('p', W - 0.16, -1), shoeF = wf.front + 'Y' + (L.alongX ? 'zZ' : 'xX');
    for (let row = 0; row < 5; row++) {
      const y = 1.275 + row * 0.34;
      for (let q = sq0 + 0.1; q < sq1 - 0.3; q += r.f(0.22, 0.3)) {
        if (r.chance(0.08)) continue;
        const col = r.pick(KIDS.concat(['#6b4a2f', '#3a3a44', '#f1ead8'])), L1 = r.f(0.11, 0.19), hh = r.f(0.06, 0.1), ww = r.f(0.06, 0.085);
        g.mat('weave', col); wf(q, y, q + ww, y + hh, 0.02, 0.02 + L1, { faces: shoeF }); wf(q + ww + 0.012, y, q + 2 * ww + 0.012, y + hh, 0.02, 0.02 + L1, { faces: shoeF });
        if (r.chance(0.3)) { g.mat('paint', r.pick(KIDS)); wf(q + 0.02, y + 0.055, q + 0.045, y + 0.06, 0.03, 0.05); }
      }
    }
  });
  await tick();

  await tick();
  // the lending shelf for small clothes, on the back wall between the quiet room and the weighing corner
  const lp0 = qp1 + 0.6, lp1 = Math.min(wp0 - 0.6, lp0 + 4.4);
  if (lp1 - lp0 > 1.2) {
    for (let p = lp0 + 0.7; p < lp1 - 0.5; p += 1.45) L.prop('shelving', p, qb - 0.24, 0, L.yaw(0, -1), { w: 1.4, h: 1.8, d: 0.34, shelves: 4, wood: '#a8794f' });
    for (let p = lp0 + 0.7, k = 0; p < lp1 - 0.5; p += 1.45) for (let sh = 0; sh < 4; sh++) for (const dp of [-0.4, 0.0, 0.4]) { if (r.chance(0.2)) continue; const a = L.xz(p + dp, qb - 0.26), y = 0.105 + (sh + 1) * (1.8 - 0.11) / 4 - (1.8 - 0.11) / 4 + 0.025; prop(s, 'lots-school.folds', a[0], y, a[1], L.yaw(0, -1), { seed: (k++ % 7) + 1, n: 2 + (k % 3) }, { noCollide: true }); }
    // small coats on a rail beside it
    s.furniture(() => { g.mat('cast', '#c8a45a'); const a = L.xz(lp1 + 0.1, qb - 0.3), b = L.xz(Math.min(wp0 - 0.2, lp1 + 1.6), qb - 0.3); g.tube([[a[0], 1.6, a[1]], [b[0], 1.6, b[1]]], 0.014, { segs: 6 }); });
    for (let p = lp1 + 0.3; p < Math.min(wp0 - 0.3, lp1 + 1.5); p += 0.3) L.prop('lots-school.coat', p, qb - 0.36, 1.6, L.yaw(0, -1), { a: r.pick(KIDS), lining: r.pick(['#e9b23c', '#f6ecd6', '#7cab4e']), len: 0.45, hood: r.chance(0.5) }, { noCollide: true });
    L.spot('browse', (lp0 + lp1) / 2, qb - 1.0, 0, L.yaw(0, 1), { tags: ['cradle', 'clothes'] });
    const shLines = alt(r, [
      ['Take what fits, bring back what does not. Every seam has a hand\'s width folded into it, so most things fit for a year longer than they look.'],
      ['A card on the shelf: These have been worn by the children of this block since before the hall was re-floored. Some have been dyed four times. Look in the collars for the names.'],
      ['Small clothes cost the drum new mass, about twenty-five kays a kilo. So nobody here has bought a baby\'s coat in living memory, and nobody has gone without one.'],
      ['The mends are in bright thread on purpose: one table\'s red, another\'s yellow. You can read a little vest like a family tree.'],
    ]);
    L.act((lp0 + lp1) / 2, qb - 1.0, 1.2, 1.6, 'Look at the lending shelf', (gm) => say(gm, 'The lending shelf', shLines));
  }

  await tick();
  // the weighing corner: a counter with the scale, the height chart, the book, a chair for whoever is holding the baby
  {
    const pa = wp0 + 0.1, pb = W - 0.16, q0 = qb + 0.08, q1 = D - 0.16, pm = (pa + pb) / 2;
    const clip = L.clip(pa - 0.6, qb - 1.0, pb, q1, H);
    L.lamp('panel', pm, (q0 + q1) / 2, H, { w: 1.4, d: 0.6, K: 3600, power: 1.1, clip });
    roomGlow(s, clip[0], 0, clip[2], clip[3], H, clip[5], { sky: '#fff0dc', ground: '#a8c8c0', power: 0.32 });
    s.structure(() => {
      const wf = L.onWall('q', q1, -1);
      for (let p = pa + 0.2, k = 0; p < pb - 0.3; p += 1.25, k++) { g.mat('felt', C.felt[(k + 1) % 4]); wf(p, 1.6, Math.min(pb - 0.15, p + 1.1), 2.9, 0, 0.05, { bevel: 0.015 }); }
      // the sling scale: a brass dial on a hook from the ceiling, a cloth sling under it
      const c = L.xz(pa + 0.9, q0 + 1.6);
      g.mat('cast', '#c8a45a', { rough: -0.25 }); g.tube([[c[0], H, c[1]], [c[0], 2.15, c[1]]], 0.01, { segs: 5 }); g.cyl(c[0], 1.95, c[1], 0.12, 0.2, { segs: 16 });
      g.mat('paint', '#f6ecd6'); g.ball(c[0], 2.05, c[1], 0.1, 0.1, 0.1, { segs: 10, rings: 6 });
      g.mat('cast', '#8a6d3b'); g.tube([[c[0], 1.95, c[1]], [c[0], 1.55, c[1]]], 0.006, { segs: 4 }); for (const d of [-0.2, 0.2]) g.tube([[c[0], 1.55, c[1]], [c[0] + d, 1.25, c[1]]], 0.005, { segs: 4 });
      g.mat('weave', C.felt[1]); g.sheet([c[0] - 0.2, 1.25, c[1] - 0.15], [c[0] + 0.2, 1.25, c[1] - 0.15], [c[0] + 0.2, 1.25, c[1] + 0.15], [c[0] - 0.2, 1.25, c[1] + 0.15], { nu: 3, nv: 2, sag: 0.08 });
    });
    // the changing table with folded cloths, against the side wall
    L.prop('lots-school.sideboard', wp0 + 0.34, (q0 + q1) / 2 + 0.4, 0, L.yaw(1, 0), { w: 1.6, c: '#e9e2d0', top: '#f3e2c4' });
    for (let k = 0; k < 3; k++) { const a = L.xz(wp0 + 0.34, (q0 + q1) / 2 - 0.2 + k * 0.4); prop(s, 'lots-school.folds', a[0], 0.86, a[1], L.yaw(1, 0), { seed: k + 2, n: 3 + k % 2 }, { noCollide: true }); }
    L.prop('counter', pm, q1 - 0.45, 0, L.yaw(0, -1), { w: Math.min(3, pb - pa - 1), d: 0.6, h: 0.86, body: C.trim, top: '#e9e2d0', topMat: 'tile' }, { noSpots: true });
    { const a = L.xz(pm - 0.5, q1 - 0.45); prop(s, 'lots-school.scale', a[0], 0.86, a[1], L.yaw(0, -1), { c: '#e9e2d0' }, { noCollide: true }); }
    { const a = L.xz(pm + 0.6, q1 - 0.45); g.mat('weave', C.felt[2]); g.box(a[0] - 0.25, 0.86, a[1] - 0.18, a[0] + 0.25, 0.9, a[1] + 0.18, { bevel: 0.01 }); g.mat('paper', '#f6efdc'); g.box(a[0] - 0.22, 0.9, a[1] - 0.15, a[0] + 0.22, 0.915, a[1] + 0.15); s.flush({ tier: 'd' }); }
    L.prop('lots-school.chart', pb - 0.02, (q0 + q1) / 2 - 0.6, 0, L.yaw(-1, 0), {});
    L.prop('lots-school.chart', pb - 0.02, (q0 + q1) / 2 + 0.2, 0, L.yaw(-1, 0), { wood: '#f3e2c4' });
    L.prop('chair', pm - 0.2, q0 + 1.2, 0, L.yaw(0, 1), { wood: '#6b4a2f', seat: C.felt[1] }, { spot: { tags: ['cradle', 'weigh'] } });
    L.spot('counter', pm, q1 - 1.05, 0, L.yaw(0, -1), { tags: ['weigh', 'cradle', 'keeper'] });
    L.spot('customer', pm + 0.6, q0 + 0.6, 0, L.yaw(0, 1), { tags: ['weigh', 'cradle'] });
    const babies = []; const rb = new Rng(lot.seed + 11);
    for (let i = 0; i < 3; i++) { const kg = rb.f(3.4, 8.8), wk = Math.round(kg * 3.1 - 8 + rb.f(-2, 2)); babies.push(rb.pick(GIVEN) + ', ' + Math.max(1, wk) + ' weeks: ' + r1(kg) + ' kilograms, the dial reading ' + r1(kg * info.g)); }
    const wLines = alt(r, [
      'Every scale in the drum reads the weight of its own deck, so the book is kept in kilograms and the dial in what the floor feels. On this deck the difference is ' + Math.round((1 - info.g) * 100) + ' in a hundred.',
      'The book goes back further than the counter. The first pages are in a hand nobody in the block can name, and the babies in them are elders now, on the High decks, weighing half what they did.',
      'Weighing is free and so is the advice, which comes whether you want it or not.',
      'A note in the margin, many times: caught at ' + info.g.toFixed(2) + ' g. Every baby here was born on the Low decks, at nearly full weight, where bones grow right.',
    ]);
    L.act(pm, q0 + 0.9, 1.1, 1.6, 'Read the weighing book', (gm) => say(gm, 'The weighing book', ['Today\'s page. ' + babies.join('. ') + '.', wLines]));
    s.zoneBox({ id: lot.id + '/weigh', place: 'city-special', box: [clip[0], -0.5, clip[2], clip[3], H, clip[5]], name: 'The weighing corner', sub: nm.charAt(0) + nm.slice(1).toLowerCase() + ' · the book and the scale', ambience: 'quiet', reverb: 'felt', cell: info.key });
  }
  await tick();

  // the quiet room: felt on every wall, two armchairs, a cot, one dim lamp
  {
    const pa = 0.16, pb = qp1 - 0.08, q0 = qb + 0.08, q1 = D - 0.16, pm = (pa + pb) / 2, qm = (q0 + q1) / 2;
    const clip = L.clip(pa, q0, pb, q1, H);
    roomGlow(s, clip[0], 0, clip[2], clip[3], H, clip[5], { sky: '#e8c8a0', ground: '#7a5a48', power: 0.22 });
    L.lamp('lantern', pm, qm, 2.2, { tint: '#f2c58a', clip, power: 0.45, drop: 0.8 });
    s.structure(() => {
      for (const [axis, c, sg, u0, u1] of [['q', q1, -1, pa, pb], ['p', pa, 1, q0, q1]]) { const wf = L.onWall(axis, c, sg); for (let u = u0 + 0.1, k = 0; u < u1 - 0.2; u += 1.2, k++) { g.mat('felt', k % 2 ? shadeHex(C.felt[0], 0.8) : shadeHex(C.felt[3], 0.75)); wf(u, 0.3, Math.min(u1 - 0.1, u + 1.15), 2.9, 0, 0.05, { bevel: 0.02 }); } }
    });
    L.prop('rug', pm, qm, 0, L.yaw(1, 0), { w: Math.min(3.6, pb - pa - 1.4), d: Math.min(2.6, q1 - q0 - 1.4), a: shadeHex(C.felt[1], 0.8), b: '#e9dcc0' }, { noCollide: true });
    L.prop('school.armchair', pa + 0.8, q1 - 0.9, 0, L.yaw(1, -1), { c: shadeHex(C.felt[0], 0.85) }, { spot: { tags: ['quiet', 'feed', 'cradle'] } });
    L.prop('school.armchair', pb - 0.9, q1 - 0.9, 0, L.yaw(-1, -1), { c: shadeHex(C.felt[2], 0.85) }, { spot: { tags: ['quiet', 'feed', 'cradle'] } });
    L.prop('lots-school.pram', pm, q1 - 0.8, 0, L.yaw(0, -1), { c: '#e9dcc0', lining: '#f3d9a8', hood: true });
    s.zoneBox({ id: lot.id + '/quiet', place: 'city-special', box: [clip[0], -0.5, clip[2], clip[3], H, clip[5]], name: 'The quiet room', sub: 'Felt on every wall · voices low', ambience: 'quiet', reverb: 'felt', cell: info.key });
  }

  await tick();
  // life: parents on the warm benches, toddlers in the aisle, somebody pushing a pram
  for (let i = 0; i < 5; i++) L.spot('play', W / 2 + r.f(-1.4, 1.4), r.f(aq0, aq1), 0, r.f(-3, 3), { tags: ['kids', 'small', i % 2 ? 'floor' : 'hop', 'cradle'] });
  for (let i = 0; i < 3; i++) { const cx = W / 2 + (i - 1) * 1.6, cq = aq0 + 1.2 + i * 3.2; for (let k = 0; k < 2; k++) L.spot('chat', cx + (k ? 0.45 : -0.45), cq, 0, L.yaw(k ? -1 : 1, 0), { tags: ['cradle', 'parents'] }); }
  L.prop('lots-school.pram', W / 2 + 0.8, aq0 + 2.2, 0, L.yaw(0, 1) + 0.3, { c: '#c9962e', lining: '#f1ead8' });
  // the shoes and the benches: two more things to do
  const shoeLines = alt(r, [
    ['Every pair a child has grown out of, left for the next. A card: Take a pair, leave a pair, and if you have no pair to leave, take one anyway.'],
    ['The smallest shoes are knitted and the biggest are nearly the size of yours. In between, every colour the dyers had.'],
    ['Some pairs have a name chalked inside, the first owner\'s, and under it the next, and the next. One pair has six.'],
    ['New shoes are twenty kays. These have walked the Low decks for a long time at nearly full weight, and they are still good.'],
  ]);
  L.act(W - 1.6, (sq0 + sq1) / 2 - 1.0, 1.6, 1.8, 'Look at the wall of shoes', (gm) => say(gm, 'The wall of shoes', shoeLines));
  const bq = sq0 + 1.0 + 2.0 * Math.floor((sq1 - sq0 - 2) / 4);
  L.act(W - 1.2, bq + 1.6, 0.9, 1.2, 'Sit on a warm bench', (gm) => {
    if (gm.player && gm.player.sit) { const a = L.xz(W - 0.6, bq + 0.3); gm.player.sit({ x: a[0], y: 0, z: a[1], eye: 1.15 }); gm.player.yaw = L.look(-1, 0); gm.player.pitch = -0.05; }
    note(gm, alt(new Rng(lot.seed + 5), ['Warm from underneath: the food plant\'s loop runs under the bench at sixty-five degrees and comes through the slats at about the warmth of a hand.', 'The bench is warm. The loop that heats the baths and holds the hall\'s pots runs under it, and costs nobody anything.', 'Warm slats, a cushion somebody has mended twice, and a view of every pram in the berths.', 'You sit. The bench is as warm as a cup held for a minute. A baby two benches along falls asleep, and so, nearly, do you.']));
  });
  await tick();
  // walkways
  L.path([[doorP, -0.7], [doorP, 1.2], [doorP, qi + 0.6], [W / 2, aq0 - 0.4], [W / 2, (aq0 + aq1) / 2], [W / 2, aq1 + 0.5]], { width: 1.6 });
  L.path([[W / 2, aq1 + 0.5], [qp1 - 1.05, qb - 0.8], [qp1 - 1.05, qb + 1.2], [(0.16 + qp1) / 2, (qb + D) / 2]], { width: 1.1 });
  L.path([[W / 2, aq1 + 0.5], [(wp0 + W) / 2, qb + 0.8]], { width: 1.2 });
  L.path([[W / 2, (aq0 + aq1) / 2], [ap0 - 0.9, (aq0 + aq1) / 2], [2.4, (aq0 + aq1) / 2]], { width: 1.1 });
  L.path([[W / 2, (aq0 + aq1) / 2], [ap1 + 0.9, (aq0 + aq1) / 2], [W - 1.6, (aq0 + aq1) / 2]], { width: 1.1 });
  L.path([[W / 2, aq0 - 0.4], [2.4, aq0 - 0.4]], { width: 1.1 }); L.path([[W / 2, aq0 - 0.4], [W - 1.6, aq0 - 0.4]], { width: 1.1 });
  s.zoneBox({ id: lot.id, place: 'city-special', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: nm.charAt(0) + nm.slice(1).toLowerCase(), sub: info.name + ' · pram berths, warm benches', ambience: 'quiet', reverb: 'felt', cell: info.key });
  void planter; void pegs; void PAL; void mixHex; void game;
}

// ===============================================================================================================
// The naming rooms
// ===============================================================================================================
export async function buildNaming(s, lot, plan, game, tick) {
  const L = local(s, lot), r = new Rng(lot.seed ^ 0x2a11ed), info = plan.info, g = s.g, W = L.W, D = L.D;
  const H = 3.3, F = 6.0, E = 4.6, pe0 = Math.round((W - E) / 2 * 2) / 2, pe1 = pe0 + E;
  const C = alt(r, [
    { face: '#e6d2b0', inner: '#f4ead6', plinth: '#6e2f3f', trim: '#3a2a20', accent: '#c9962e', porchFloor: '#bfa890', floor: '#9c7450', famA: '#8a2f3c', famB: '#2f5d5a' },
    { face: '#d8c8b8', inner: '#f2e8dc', plinth: '#2f3f6a', trim: '#26304a', accent: '#e8c26a', porchFloor: '#c9b08a', floor: '#a8794f', famA: '#2f3f7a', famB: '#c9962e' },
    { face: '#e0d6bc', inner: '#f3eedc', plinth: '#4a5a2a', trim: '#2f3a20', accent: '#d9534f', porchFloor: '#b9a080', floor: '#8a6240', famA: '#5b3a6e', famB: '#6b7a3a' },
  ]);
  const DADO = { h: 1.1, mat: 'wood', tint: '#6b4a2f' };
  const FR = await front(L, { name: 'NAMING ROOMS', sub: alt(r, ['both families in the room', 'by the book · both tables', info.name + ' · both families in the room', 'two rooms · the book of names']), seed: lot.seed, porchW: E, porchAt: pe0, porchD: 1.6,
    windows: [[1.2, pe0 - 1.2, 1.0, 2.3], [pe1 + 1.2, W - 1.2, 1.0, 2.3]], pal: { face: C.face, inner: C.inner, plinth: C.plinth, trim: C.trim, accent: C.accent, porchFloor: C.porchFloor }, stripe: [C.famA, C.accent, C.famB, '#f1ead8'], lanterns: [C.accent], signPal: [C.trim, '#f6ecd6', C.accent] }, tick);
  const qi = FR.qIn, doorP = FR.doorP;
  // the foyer across the front, two rooms behind: the big one and the small one
  const split = Math.round(W * 0.58 * 2) / 2;
  L.floor(0, QF, W, F, 0, 'terrazzo', '#d8ccb4'); L.floor(0, F, W, D, 0, 'planks', C.floor);
  L.ceil(0, QF, W, F, H - 0.2, 'paint', '#f3ead8'); L.ceil(0, F, W, D, H, 'wood', '#8a6240');
  L.wallP(0.08, QF + 0.08, D - 0.08, H, { tint: C.inner, dado: DADO }); L.wallP(W - 0.08, QF + 0.08, D - 0.08, H, { tint: C.inner, dado: DADO });
  L.wallQ(D - 0.08, 0.16, W - 0.16, H, { tint: C.inner, dado: DADO });
  const dA = split / 2 - 0.8, dB = split + (W - split) / 2 - 0.6;
  L.wallQ(F, 0.16, W - 0.16, H, { tint: C.inner, dado: DADO, openings: [{ at: dA - 0.16, w: 1.6, h: 2.3 }, { at: dB - 0.16, w: 1.2, h: 2.2 }] });
  L.wallP(split, F + 0.08, D - 0.08, H, { tint: C.inner, dado: DADO });
  L.frame(dA + 0.8, F, 1.6, 2.3, 'p', { tint: C.trim }); L.frame(dB + 0.6, F, 1.2, 2.2, 'p', { tint: C.trim });
  await tick();
  // the foyer: a coat rail, a bench, a planter, a lamp; children waiting to be good
  {
    const clip = L.clip(0.16, QF, W - 0.16, F, H);
    roomGlow(s, clip[0], 0, clip[2], clip[3], H, clip[5], { sky: '#ffe2b8', ground: '#c8b49a', power: 0.4 });
    L.lamp('globe', W * 0.25, (qi + F) / 2, 2.5, { K: 2700, power: 1.0, clip, drop: 0.55 }); L.lamp('globe', W * 0.75, (qi + F) / 2, 2.5, { K: 2700, power: 1.0, clip, drop: 0.55 });
    pegs(L, 'p', 0.16, 1, QF + 0.6, F - 0.5, lot.seed + 9);
    // the foyer's long wall: a row of the families' cloths from past namings, a planter under each pair, a rug down the middle
    s.deco(() => {
      const wf = L.onWall('q', F - 0.08, -1);
      for (let p = 1.6, k = 0; p < W - 2.2; p += 1.5, k++) { if (Math.abs(p + 0.45 - dA - 0.8) < 1.4 || Math.abs(p + 0.45 - dB - 0.6) < 1.2) continue; g.mat('felt', [C.famA, C.famB, C.accent, '#7cab4e', '#5fb3b3', '#8a4a6a'][k % 6]); wf(p, 1.25, p + 0.9, 2.55, 0, 0.03, { bevel: 0.01 }); g.mat('felt', '#f1ead8'); wf(p + 0.35, 1.7, p + 0.55, 2.0, 0.03, 0.035); }
    });
    L.prop('rug', doorP, (qi + F) / 2, 0, L.yaw(1, 0), { w: Math.min(8, W - 6), d: 1.6, a: C.famA, b: C.accent }, { noCollide: true });
    for (const p of [dA - 0.9, dB + 2.2]) { if (p < 1 || p > W - 1) continue; const a = L.xz(p, F - 0.45); planter(s, a[0], 0, a[1], { w: L.alongX ? 1.0 : 0.45, d: L.alongX ? 0.45 : 1.0, h: 0.5, plants: 'flower', tint: C.plinth, mat: 'tile' }); }
    L.prop('bench', W - 1.0, (QF + F) / 2, 0, L.yaw(-1, 0), { w: 1.8, back: true, wood: '#6b4a2f', metal: C.trim }, { spot: { tags: ['naming', 'wait'] } });
    for (let i = 0; i < 3; i++) L.spot('play', doorP + r.f(-3, 3), r.f(qi + 0.6, F - 0.8), 0, r.f(-3, 3), { tags: ['kids', i % 2 ? 'hop' : 'spin', 'naming'] });
    s.zoneBox({ id: lot.id + '/foyer', place: 'city-special', box: [clip[0], -0.5, clip[2], clip[3], H, clip[5]], name: 'Naming rooms', sub: info.name + ' · both families in the room', ambience: 'quiet', reverb: 'room', cell: info.key });
  }

  await tick();
  // one naming room
  const keeper = KEEPERS[r.i(0, KEEPERS.length - 1)];
  const roomN = { k: 0 };
  async function namingRoom(pa, pb, big) {
    const k = roomN.k++, rr = new Rng(lot.seed + k * 97), q0 = F + 0.08, q1 = D - 0.16, pm = (pa + pb) / 2, qm = (q0 + q1) / 2;
    const clip = L.clip(pa, q0, pb, q1, H), famA = k ? C.famB : C.famA, famB = k ? C.famA : C.famB;
    roomGlow(s, clip[0], 0, clip[2], clip[3], H, clip[5], { sky: '#ffdcae', ground: '#8a6240', power: 0.42 });
    // the table runs along q (from the door toward the back), the book at its far head, the two families either side
    const tl = Math.min(q1 - q0 - 3.6, big ? 7.2 : 5.0), tq0 = qm - tl / 2 + 0.2, tq1 = qm + tl / 2 + 0.2;
    s.furniture(() => {
      g.mat('wood', '#6b4a2f', { rough: -0.1 }); L.bx(pm - 0.5, tq0, 0.7, pm + 0.5, tq1, 0.76, { bevel: 0.012 });
      g.mat('wood', '#4a3426'); for (const q of [tq0 + 0.3, (tq0 + tq1) / 2, tq1 - 0.3]) L.bx(pm - 0.42, q - 0.05, 0, pm + 0.42, q + 0.05, 0.7, { bevel: 0.006 });
      g.mat('weave', '#f1ead8'); L.bx(pm - 0.22, tq0 + 0.2, 0.76, pm + 0.22, tq1 - 0.2, 0.764);
      g.mat('weave', famA); L.bx(pm - 0.22, tq0 + 0.2, 0.764, pm - 0.16, tq1 - 0.2, 0.766); g.mat('weave', famB); L.bx(pm + 0.16, tq0 + 0.2, 0.764, pm + 0.22, tq1 - 0.2, 0.766);
    });
    L.solid(pm - 0.5, tq0, 0, pm + 0.5, tq1, 0.76);
    for (const sg of [-1, 1]) for (let q = tq0 + 0.45; q < tq1 - 0.3; q += 0.72) L.prop('chair', pm + sg * 0.85, q, 0, L.yaw(-sg, 0), { wood: sg < 0 ? '#5a3a26' : '#7a5233', back: sg < 0 ? 'slat' : 'hoop', seat: sg < 0 ? famA : famB }, { spot: { tags: ['naming', 'family', sg < 0 ? 'famA' : 'famB'] } });
    for (let q = tq0 + 0.8; q < tq1 - 0.5; q += 1.6) { const a = L.xz(pm + (rr.chance(0.5) ? -0.12 : 0.12), q); prop(s, 'cup', a[0], 0.766, a[1], 0, { glaze: rr.pick(['#e9e2d0', '#d9c7a6', famA, famB]) }, { noCollide: true }); }
    // a picture rail, and under it a frieze of small framed plates: one for every child named in this room (no words, just the families' colours)
    s.deco(() => {
      for (const [axis, c, sg, u0, u1] of [['q', q1, -1, pa + 0.3, pb - 0.3], ['p', pa, 1, q0 + 0.3, q1 - 0.3], ['p', pb, -1, q0 + 0.3, q1 - 0.3]]) {
        const wf = L.onWall(axis, c, sg);
        g.mat('wood', '#4a3426'); wf(u0, 2.62, u1, 2.67, 0, 0.03);
        for (let u = u0 + 0.1; u < u1 - 0.3; u += 0.34) {
          if (axis === 'p' && Math.abs(u - qm) < 1.15) continue;
          g.mat('wood', '#6b4a2f'); wf(u, 2.2, u + 0.24, 2.5, 0, 0.015);
          g.mat('paint', rr.chance(0.5) ? famA : famB); wf.flat(u + 0.04, 2.24, u + 0.2, 2.46, 0.016);
          g.mat('paint', '#f1ead8'); wf.flat(u + 0.07, 2.3, u + 0.17, 2.36, 0.018);
        }
      }
      g.mat('wood', '#5a3a26'); for (let q = q0 + 1.2; q < q1 - 0.5; q += 2.2) L.bx(pa, q - 0.1, H - 0.22, pb, q + 0.1, H, { bevel: 0.01 });
    });
    // the lamp low over the table
    for (const q of big ? [tq0 + tl * 0.25, tq0 + tl * 0.75] : [(tq0 + tq1) / 2]) L.lamp('globe', pm, q, 1.95, { drop: 1.2, K: 2650, power: 1.25, r: 0.2, clip });
    // the book of names on its lectern at the far head, with the keeper's place; a cradle basket beside it
    L.prop('lots-school.lectern', pm, tq1 + 0.75, 0, L.yaw(0, -1), { cloth: C.accent === '#c9962e' ? '#7a2f2a' : '#3a2d4a' });
    L.lamp('sconce', pm, q1, 2.15, { face: L.face(0, -1), K: 2600, power: 0.8, clip });
    s.deco(() => { const wf = L.onWall('q', q1, -1); g.mat('felt', C.accent); wf(pm - 0.9, 0.95, pm + 0.9, 2.0, 0, 0.03, { bevel: 0.01 }); g.mat('felt', shadeHex(C.accent, 0.7)); wf(pm - 0.75, 1.05, pm + 0.75, 1.1, 0.03, 0.035); });
    L.spot('counter', pm, tq1 + 1.25, 0, L.yaw(0, -1), { tags: ['naming', 'keeper', 'book'] });
    s.furniture(() => { const a = L.xz(pm + 1.2, tq1 + 0.7); g.mat('cane', '#d9c08a'); g.lathe(a[0], a[1], [[0.18, 0.3], [0.3, 0.36], [0.33, 0.6], [0.3, 0.62], [0.27, 0.4], [0.0, 0.34]], { segs: 16 }); g.mat('wood', '#6b4a2f'); for (const sx of [-1, 1]) g.box(a[0] + sx * 0.2 - 0.02, 0, a[1] - 0.02, a[0] + sx * 0.2 + 0.02, 0.34, a[1] + 0.02); g.mat('weave', '#f3e6c8'); g.ball(a[0], 0.56, a[1], 0.22, 0.05, 0.22, { segs: 10, rings: 4 }); });
    await tick();
    // the families' sideboards, one against each long wall, with the dish each family brought under its lid
    for (const sg of [-1, 1]) {
      const p = sg < 0 ? pa + 0.32 : pb - 0.32, fam = sg < 0 ? famA : famB, sbw = Math.min(2.4, tl - 1.0);
      L.prop('lots-school.sideboard', p, qm, 0, L.yaw(-sg, 0), { w: sbw, c: sg < 0 ? '#5a3a26' : '#6b4a2f' });
      for (let i = 0; i < 3; i++) { const a = L.xz(p, qm - sbw / 2 + 0.4 + i * (sbw - 0.8) / 2); prop(s, i === 1 ? 'crock' : 'bowl', a[0], 0.86, a[1], rr.f(0, 3), i === 1 ? { glaze: fam, h: 0.28, r: 0.15, lid: '#e9e2d0' } : { glaze: rr.pick(['#e9e2d0', '#d9c7a6', '#a3563a']), lid: fam, r: 0.14 }, { noCollide: true }); }
      // the family's cloth hung on the wall above its sideboard
      s.deco(() => { const wf = L.onWall('p', sg < 0 ? pa : pb, -sg); g.mat('felt', fam); wf(qm - 1.0, 1.4, qm + 1.0, 2.9, 0, 0.03, { bevel: 0.01 }); g.mat('felt', shadeHex(fam, 1.5)); wf(qm - 0.8, 1.55, qm + 0.8, 1.62, 0.03, 0.035); wf(qm - 0.8, 2.68, qm + 0.8, 2.75, 0.03, 0.035); g.mat('felt', C.accent); wf(qm - 0.12, 1.95, qm + 0.12, 2.35, 0.03, 0.036); });
      // the aunts stand behind their row
      for (let i = 0; i < (big ? 3 : 2); i++) L.spot('stand', pm + sg * 1.65, tq0 + 0.8 + i * 1.6, 0, L.yaw(-sg, 0), { tags: ['naming', 'aunt', sg < 0 ? 'famA' : 'famB'] });
    }
    await tick();
    // the gift: what the dead's family brings, usually a remade heirloom, on a small table by the door
    const gp = pm + (big ? -1.6 : -1.2), gq = tq0 - 0.9;
    L.prop('table', gp, gq, 0, L.yaw(0, 1), { w: 0.9, d: 0.55, wood: '#5a3a26' });
    const giftKind = rr.i(0, 3);
    s.detail(() => {
      const a = L.xz(gp, gq);
      if (giftKind === 0) { g.mat('weave', famA); g.box(a[0] - 0.3, 0.74, a[1] - 0.2, a[0] + 0.3, 0.8, a[1] + 0.2, { bevel: 0.02 }); for (let i = 0; i < 4; i++) { g.mat('weave', KIDS[i * 2]); g.box(a[0] - 0.3 + i * 0.15, 0.8, a[1] - 0.2, a[0] - 0.18 + i * 0.15, 0.805, a[1] + 0.2); } }
      else if (giftKind === 1) { g.mat('wood', '#8a5a34'); g.box(a[0] - 0.14, 0.74, a[1] - 0.14, a[0] + 0.14, 0.95, a[1] + 0.14, { bevel: 0.01 }); g.box(a[0] - 0.14, 0.95, a[1] + 0.1, a[0] + 0.14, 1.2, a[1] + 0.14, { bevel: 0.01 }); g.mat('paint', C.accent); g.box(a[0] - 0.141, 0.82, a[1] - 0.02, a[0] - 0.135, 0.9, a[1] + 0.04); }
      else if (giftKind === 2) { g.mat('glaze', '#e9e2d0'); g.lathe(a[0], a[1], [[0, 0.74], [0.05, 0.74], [0.08, 0.82], [0.07, 0.86], [0.0, 0.85]], { segs: 14 }); g.mat('cast', '#c8a45a'); g.lathe(a[0], a[1], [[0.071, 0.79], [0.082, 0.8], [0.082, 0.81], [0.072, 0.82]], { segs: 14 }); }
      else { g.mat('wood', '#c49464'); g.box(a[0] - 0.2, 0.74, a[1] - 0.12, a[0] + 0.2, 0.86, a[1] + 0.12, { bevel: 0.02 }); g.mat('cast', '#c8a45a'); g.box(a[0] - 0.04, 0.8, a[1] + 0.12, a[0] + 0.04, 0.83, a[1] + 0.125); }
    });
    await tick();
    // the book's names: each newborn beside the dead whose share they carry
    const entries = []; for (let i = 0; i < 3; i++) { const dead = rr.pick(GIVEN) + ' ' + rr.pick(FAMILY), first = rr.chance(0.6) ? dead.split(' ')[0] : rr.pick(GIVEN); entries.push(first + ' ' + rr.pick(FAMILY) + ', named for ' + dead + ', who died at ' + rr.i(96, 121)); }
    if (k === 0) {
      L.act(pm, tq1 + 0.1, 1.1, 1.4, 'Read the book of names', (gm) => say(gm, 'The book of names', ['The last three entries, in three hands. ' + entries.join('. ') + '.', alt(rr, [
        'Under each name, the names of the table who stood at the naming: two parents and three or four aunts, and an aunt can be anyone.',
        'The same names go up on the Ledger at the station ring on Booking Day: every newborn beside the dead whose share they carry.',
        'The first pages are older than the block\'s hall. The paper has been re-bound twice and the old binding kept in the back, in case.',
        'Every birth in this book closes somebody\'s funeral. The keeper reads that line aloud at the end of every naming, and both families say it back.',
      ])]));
      const gLines = [
        ['A quilt, remade from a dead woman\'s coats: you can still see the pockets. Her family brought it to the naming, as the dead\'s family does.'],
        ['A small chair, remade from a big one. The old seat is still under the new, and the mend at the leg is in red, on purpose.'],
        ['A cup, the glaze crazed with age, mended with a bright seam where it once broke. It goes to the child with the share.'],
        ['A box made from the lid of a chest that belonged to the person the child is named for. Inside: nothing yet. That is the point of it.'],
      ][giftKind];
      L.act(gp, gq - 0.6, 1.0, 1.3, 'Look at the gift', (gm) => say(gm, 'The gift', gLines.concat(['Every birth closes someone\'s funeral. The gift is how the other family says so.'])));
      const sbLines = alt(rr, [
        ['Two sideboards, two families, two dishes under two lids. Each family brings what its own table cooks best, and each eats the other\'s first. That is the custom, and nobody can say who started it.'],
        ['On one sideboard a crock of something slow from the loop; on the other a dish with a lid tied down with string. The string is a joke between the families, and has been for three namings.'],
        ['The lids are the rooms\' own, numbered on the underside. The dishes under them are not: those come from both families\' kitchens and go home empty.'],
        ['A card on the sideboard: The dead\'s family serves first. In this air everything is lidded until the moment it is passed, or it is cold by the end of the table.'],
      ]);
      L.act(pa + 1.2, qm, 1.0, 1.4, 'Look at the sideboard', (gm) => say(gm, 'The sideboard', sbLines));
      const kpLines = alt(rr, [
        ['Both families in the room, that is the whole of it. The child\'s family on that side, the family of the one whose share the child carries on this. Then the aunts stand, and I read.'],
        ['A child has a table: parents, and the three or four who stand at the naming. Aunts, whatever they are. Mostly people whose own children are grown, and people without a place of their own.'],
        ['I have kept the book for nineteen years. The thing I remember is never the names. It is the moment the two families pass the dishes across, and nobody quite knows whose turn it is.'],
        ['Guests are welcome at the back. A naming with a stranger in the room is thought lucky in this block, though nobody can tell you why.'],
      ]);
      L.act(pm + 0.9, tq1 + 1.0, 1.1, 1.6, 'Ask the keeper of the rooms', (gm) => say(gm, keeper + ', keeper of the rooms', kpLines));
    }
    s.zoneBox({ id: lot.id + '/room' + k, place: 'city-special', box: [clip[0], -0.5, clip[2], clip[3], H, clip[5]], name: big ? 'The naming room' : 'The small naming room', sub: info.name + ' · both families in the room', ambience: 'quiet', reverb: 'felt', cell: info.key });
    return { pm, tq0 };
  }
  const A = await namingRoom(0.16, split - 0.08, true); await tick();
  const Bm = await namingRoom(split + 0.08, W - 0.16, false); await tick();
  // walkways
  L.path([[doorP, -0.7], [doorP, 1.2], [doorP, qi + 0.6], [doorP, (qi + F) / 2]], { width: 1.5 });
  L.path([[1.2, (qi + F) / 2], [dA + 0.8, (qi + F) / 2], [doorP, (qi + F) / 2], [dB + 0.6, (qi + F) / 2], [W - 1.6, (qi + F) / 2]], { width: 1.4 });
  L.path([[dA + 0.8, (qi + F) / 2], [dA + 0.8, F + 0.8], [A.pm - 1.4, A.tq0 + 0.4], [A.pm - 1.4, D - 1.4]], { width: 1.1 });
  L.path([[dA + 0.8, F + 0.8], [A.pm + 1.4, A.tq0 + 0.4], [A.pm + 1.4, D - 1.4]], { width: 1.1 });
  L.path([[dB + 0.6, (qi + F) / 2], [dB + 0.6, F + 0.8], [Bm.pm - 1.4, Bm.tq0 + 0.4], [Bm.pm - 1.4, D - 1.4]], { width: 1.1 });
  L.path([[dB + 0.6, F + 0.8], [Bm.pm + 1.4, Bm.tq0 + 0.4], [Bm.pm + 1.4, D - 1.4]], { width: 1.1 });
  s.zoneBox({ id: lot.id, place: 'city-special', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: 'Naming rooms', sub: info.name + ' · both families in the room', ambience: 'quiet', reverb: 'felt', cell: info.key });
  void note; void planter; void drawing; void PAL; void mixHex; void game; void column; void archway;
}
