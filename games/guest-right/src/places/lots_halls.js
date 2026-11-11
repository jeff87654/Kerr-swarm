// The hall of a generated block: the most important room in it. Every block of about three thousand people eats at one
// long table; one cook's name is on the door, one dish is cooked each day, and guest-right gives any traveller a seat.
// Four kinds of hall (lots_halls_rooms.js), chosen by the block's style, band and seed, each in three looks; the kitchen
// behind the back wall (lots_halls_kitchen.js); the words in lots_halls_lines.js.
// Keeps everything plainHall (src/city/lots.js) does that other parts rely on: the 'Ask at the pass' prompt with its save
// key and events, the zone with place 'city-hall', walkways in through every arch and down both sides of every table, a
// seat spot every 0.75 m of bench, the cook's post at the pass, and the murmur loop.
import { registerLot, say, note } from '../city/lots.js';
import { Rng, shadeHex } from '../core/util.js';
import { warm } from '../world/kit.js';
import { local, pickBy, fill } from './lots_halls_kit.js';
import { pickKind, lookOf, archesFor, archFill, tableRun, ovalTable, dress, farEnd, COATS, GLAZES } from './lots_halls_rooms.js';
import { kitchen } from './lots_halls_kitchen.js';
import { ASK, DISH, DISH_MORE, DISH_KEYED, DISH_MORE_ANY, RULE, SEAT, AGAIN, NEIGHBOURS, NEIGHBOUR, LID_TOAST, CHALK_MORE, GUESTS, DRUMS, CORNER, BEAM, SLIDE, FELT, HEAVY, HUNDRED, KIDS, GIN } from './lots_halls_lines.js';

const T = 0.2, FH = 3.4;          // wall thickness; walls rise to the street's band whatever the ceiling inside

function trisOf(s) { let n = 0; for (const ch of s.chunks.values()) if (ch.bufs) for (const k in ch.bufs) n += ch.bufs[k].ni; return n / 3; }
// free stretches of [lo, hi] once the busy intervals are taken out
function freeOf(busy, lo, hi) {
  const b = busy.map((x) => [Math.max(lo, x[0]), Math.min(hi, x[1])]).filter((x) => x[1] > x[0]).sort((u, v) => u[0] - v[0]);
  const out = []; let a = lo; for (const x of b) { if (x[0] > a) out.push([a, x[0]]); a = Math.max(a, x[1]); } if (hi > a) out.push([a, hi]); return out;
}

async function buildHall(s, lot, plan, game, tick) {
  const T0 = performance.now(); let busyMs = 0, mark = T0;
  const tk = async () => { const n = performance.now(); busyMs += n - mark; await tick(); mark = performance.now(); };
  const log = !!(game.params && game.params.citylog), tris0 = log ? trisOf(s) : 0, lights0 = s.lights.length;
  const L = local(s, lot), info = plan.info, r = new Rng(lot.seed), g = s.g, W = L.W, D = L.D;
  const phases = []; let lastT = tris0, lastB = 0; const ph = (name) => { if (!log) return; const n = trisOf(s), b = busyMs + performance.now() - mark; phases.push(name + ' ' + Math.round(n - lastT) + '/' + (b - lastB).toFixed(0) + 'ms'); lastT = n; lastB = b; };
  const kind = pickKind(info, lot.seed), K = lookOf(kind, info, lot.seed), H = K.H, salt = lot.seed % 97;
  // ---- where the court is (local p), which end is far, where the kitchen lies
  const cs = lot.courtSpan || [L.o.a0, L.o.a0 + Math.min(20, W)];
  const ca = L.o.alongX ? [cs[0] - lot.x0, cs[1] - lot.x0] : [cs[0] - lot.z0, cs[1] - lot.z0];
  const c0 = Math.max(0, Math.min(ca[0], ca[1])), c1 = Math.min(W, Math.max(ca[0], ca[1]));
  const courtLo = (c0 + c1) / 2 < W / 2, dir = courtLo ? 1 : -1, near = courtLo ? 0 : W, far = courtLo ? W : 0;
  const u2p = (u) => (courtLo ? u : W - u), span = (ua, ub) => [Math.min(u2p(ua), u2p(ub)), Math.max(u2p(ua), u2p(ub))];
  let k = null;
  if (lot.kitchen) {
    const a = L.inv(lot.kitchen.x0, lot.kitchen.z0), b = L.inv(lot.kitchen.x1, lot.kitchen.z1);
    k = { p0: Math.max(0, Math.min(a[0], b[0])), p1: Math.min(W, Math.max(a[0], b[0])), q0: D, q1: Math.max(a[1], b[1]) };
    if (k.p1 - k.p0 < 10 || k.q1 - k.q0 < 4) k = null;
  }
  const PW = { refectory: 7, whitewash: 8, felts: 8, elders: 6 }[kind];
  const kc = k ? (k.p0 + k.p1) / 2 : W / 2;
  const door = k ? (courtLo ? k.p1 - T - 1.0 : k.p0 + T + 1.0) : null;
  const pc = k ? kc - dir * 1.0 : W / 2, pass = [pc - PW / 2, pc + PW / 2];
  const C = { L, g, s, r, K, kind, W, D, t: T, salt, dir, near, far, info, lot, k, door, pc, pass, clip: L.clip(0, -0.3, 0, W, H + 0.1, D, 0.05) };
  // what stands against the back wall (local p intervals), so the rest can be filled
  const shelfP = pc - dir * (PW / 2 + 1.25), chalkP = pc + dir * (PW / 2 + 0.75), cornerP = pc + dir * (PW / 2 + 2.15);
  const backBusy = [[pass[0] - 0.3, pass[1] + 0.3], [shelfP - 0.85, shelfP + 0.85], [chalkP - 0.6, chalkP + 0.6], [cornerP - 0.75, cornerP + 0.75]];
  if (door !== null) backBusy.push([door - 0.9, door + 0.9]);
  C.backFree = freeOf(backBusy, T + 0.3, W - T - 0.3);

  // =============================================================== the shell
  const wallMat = { refectory: 'plaster', whitewash: 'plaster', felts: 'felt', elders: 'felt' }[kind];
  const wallTint = kind === 'felts' ? K.felt : K.wall;
  const dado = { refectory: { h: 1.2, mat: 'wood', tint: K.dado }, whitewash: { h: 1.35, mat: 'tile', tint: K.dado }, felts: { h: 1.1, mat: 'wood', tint: K.dado }, elders: { h: 1.0, mat: 'flute', tint: K.panel } }[kind];
  L.floor(0, 0, W, D, 0, K.floor[0], K.floor[1]);
  L.ceiling(0, 0, W, D, H, { refectory: 'wood', whitewash: 'plaster', felts: 'paint', elders: 'wood' }[kind], K.ceil);
  const arches = archesFor(kind, c0, c1);
  const colonnade = kind === 'whitewash';
  const frontOps = colonnade ? [{ at: arches[0].at - 0.25, w: arches[arches.length - 1].at + arches[arches.length - 1].w - arches[0].at + 0.5, h: 2.85 }] : arches.map((a) => ({ at: a.at, w: a.w, h: a.h }));
  L.wallP(T / 2, 0, W, 0, FH, { t: T, mat: wallMat, tint: wallTint, dado, openings: frontOps, outer: { mat: 'plaster', tint: K.front } });
  const backOps = k ? [{ at: pass[0], w: PW, h: 2.3 }, { at: door - 0.6, w: 1.2, h: 2.15 }] : [];
  L.wallP(D - T / 2, 0, W, 0, FH, { t: T, mat: wallMat, tint: wallTint, dado, openings: backOps });
  for (const p of [T / 2, W - T / 2]) L.wallQ(p, T, D - T, 0, FH, { t: T, mat: wallMat, tint: wallTint, dado });
  await tk();
  // the arches' heads, a moulding round each, a stone sill; or, for the whitewashed hall, a row of columns
  const midsA = arches.map((a) => a.at + a.w / 2);
  if (colonnade) {
    for (let i = 0; i < arches.length - 1; i++) {
      const p = arches[i].at + arches[i].w + 0.25;
      g.mat('plaster', K.front); L.cyl(p, 0, 0.26, 0.24, 0.12, { segs: 12 }); L.cyl(p, 0.12, 0.26, 0.15, 2.6, { segs: 12, r1: 0.13 });
      g.mat('paint', K.dado); L.cyl(p, 2.62, 0.26, 0.15, 0.08, { segs: 12, r1: 0.2 }); g.mat('plaster', K.front); L.box(p - 0.24, 2.7, 0.02, p + 0.24, 2.85, 0.5);
      s.flush({ tier: 's', cast: true }); L.solid(p - 0.17, 0, 0.1, p + 0.17, 2.7, 0.42);
    }
    g.mat('paint', K.dado); L.box(frontOps[0].at, 2.78, 0.0, frontOps[0].at + frontOps[0].w, 2.85, T); s.flush({ tier: 's' });
  } else {
    for (const a of arches) {
      const pts = archFill(C, a, 'plaster', K.front, wallTint, 0, T);
      if (pts) { g.mat('stone', shadeHex(K.front, 0.82)); L.tube(pts.map((v) => [v[0], v[1], 0.03]), 0.035, { segs: 5 }); L.box(a.at + a.w / 2 - 0.12, a.h - 0.18, 0.0, a.at + a.w / 2 + 0.12, a.h + 0.02, 0.06, { bevel: 0.01 }); }
      g.mat('stone', shadeHex(K.front, 0.75)); L.box(a.at - 0.06, 0, 0.0, a.at + a.w + 0.06, 0.015, T, { faces: 'Y' });
      s.flush({ tier: 's' });
      if (kind === 'elders') {
        // felt curtains drawn back to both sides of each arch, on a rod
        g.mat('cast', '#a88445'); L.tube([[a.at - 0.25, a.h + 0.05, T + 0.08], [a.at + a.w + 0.25, a.h + 0.05, T + 0.08]], 0.015, { segs: 5 });
        g.mat('felt', K.curtain);
        for (const e of [[a.at - 0.2, a.at + 0.35], [a.at + a.w - 0.35, a.at + a.w + 0.2]]) L.sheet([e[0], a.h + 0.03, T + 0.1], [e[1], a.h + 0.03, T + 0.1], [e[1], 0.05, T + 0.12], [e[0], 0.05, T + 0.12], { nu: 4, nv: 3, ripple: 0.05, rippleN: 5 });
        s.flush({ tier: 's' });
      }
    }
  }
  // the hall's name over the middle opening, on the court side
  { const pm = midsA[Math.floor(midsA.length / 2)]; L.sign({ kind: 'plate', text: info.hall.toUpperCase(), sub: 'one long table · ' + info.dish[0] }, pm, (colonnade ? 2.85 : arches[0].h) + 0.19, -0.01, [0, -1], { w: Math.min(2.6, arches[0].w), h: 0.26 }); }
  ph('shell'); await dress(C, tk); ph('dress');

  // =============================================================== the tables
  const tq = D / 2; let seats = []; const tubes = []; let aisles = [], gaps = [], ends = [];
  if (kind === 'refectory' || kind === 'elders') {
    const [pa, pb] = span(4.2, W - 2.6);
    if (kind === 'refectory') seats = await tableRun(C, pa, pb, tq, { runner: K.runner, paint: true, cushions: [K.runner, '#d1952c', '#2f6c66'] }, tk);
    else {
      const n = Math.max(1, Math.round((pb - pa) / 16)), len = (pb - pa - (n - 1) * 1.5) / n;
      for (let i = 0; i < n; i++) { const a = pa + i * (len + 1.5); seats = seats.concat(await tableRun(C, a, a + len, tq, { settle: true, heavy: true, every: 2.4, runner: K.rug }, tk)); if (i) gaps.push(a - 0.75); }
    }
    tubes.push([pa + 0.8, pb - 0.8, tq]); aisles = [tq - 1.62, tq + 1.62]; ends = [u2p(3.4), u2p(W - 1.25)];
  } else if (kind === 'whitewash') {
    const ua = Math.max(17, Math.min(W * 0.38, W - 24)), [pa, pb] = span(ua, W - 2.8);
    seats = await ovalTable(C, pa, pb, tq, 1.1, tk);
    tubes.push([pa + 1.2, pb - 1.2, tq]);
    aisles = [tq - 2.25, tq + 2.25]; ends = [u2p(0.9), u2p(W - 1.25)]; gaps.push(u2p(ua - 1.6));
    // small tables for four in the front of the room, between the columns and along the back
    const cafe = [];
    for (let i = 0; i < arches.length - 1; i++) { const p = arches[i].at + arches[i].w + 0.25, u = courtLo ? p : W - p; if (u > 1.8 && u < ua - 2.6) cafe.push([p, 2.55]); }
    const passU = courtLo ? pc : W - pc;
    for (let u = 2.6; u < Math.min(ua - 2.6, passU - PW / 2 - 4.2); u += 3.3) cafe.push([u2p(u), D - 2.55]);
    for (const c of cafe) {
      L.prop('table', c[0], 0, c[1], 0, { w: 0.85, h: 0.74, round: true, legs: 'pedestal', wood: shadeHex(K.bench, 0.8), top: K.table });
      for (let j = 0; j < 4; j++) {
        const a = j * Math.PI / 2 + Math.PI / 4, p = c[0] - Math.sin(a) * 0.66, q = c[1] - Math.cos(a) * 0.66;
        L.prop('lots-halls.chair', p, 0, q, a, { wood: shadeHex(K.bench, 0.85 + 0.05 * (j % 2)), seat: K.rim }, { noSpots: true });
        seats.push({ p, q, a, spot: L.spot('sit', p, 0.45, q, a, { tags: ['hall', 'eat', 'table'] }), side: 0, cafe: true });
        L.prop('lots-halls.place', c[0] - Math.sin(a) * 0.22, 0.74, c[1] - Math.cos(a) * 0.22, a + Math.PI, { mat: '#e8d8b8', glaze: GLAZES[(j + salt) % 6], lid: K.rim });
      }
      L.prop('lots-halls.herbs', c[0], 0.74, c[1], j0(c), { seed: 2, pot: K.rim, leaf: '#cfe8a0' });
    }
    if (cafe.length) { const cp = cafe.map((c) => c[0]); tubes.push([Math.min(...cp), Math.max(...cp) + 0.01, tq]); }
    await tk();
  } else {
    const ub = W - 2.6, ua = Math.max(14, ub - 34), [pa, pb] = span(ua, ub);
    const n = Math.max(1, Math.round((pb - pa) / 12.5)), len = (pb - pa - (n - 1) * 1.5) / n;
    const rows = [3.4, tq, D - 3.4];
    for (const q of rows) {
      for (let i = 0; i < n; i++) { const a = pa + i * (len + 1.5); seats = seats.concat(await tableRun(C, a, a + len, q, { every: 3.0, cushions: K.felts }, tk)); }
      tubes.push([pa + 0.8, pb - 0.8, q]);
    }
    for (let i = 1; i < n; i++) gaps.push(pa + i * (len + 1.5) - 0.75);
    aisles = [1.8, (rows[0] + rows[1]) / 2, (rows[1] + rows[2]) / 2, D - 1.8]; ends = [u2p(0.9), u2p(W - 1.25)]; gaps.push(u2p(ua - 1.4));
    // lanterns slung low over every table
    let i = salt;
    for (const q of rows) for (let p = pa + 1.2; p < pb - 0.8; p += 3.6, i++) L.prop('lots-halls.lantern', p, H - 0.05, q, 0, { drop: H - 2.2 - 0.05, col: i % 4 === 0 ? K.felts[i % 6] : K.lantern, r: 0.2 });
    await tk();
  }
  ph('tables');
  // lamps over the tables, by kind (fittings only: the light comes from the tubes below)
  if (kind === 'refectory') { let i = 0; for (let p = 2.5; p < W - 1; p += 2.5, i++) { if (Math.abs(p - tubes[0][0]) < 0.6 || p < tubes[0][0] - 1 || p > tubes[0][1] + 1) continue; L.prop('lots-halls.pendant', p, H - 0.01, tq, 0, { shade: i % 5 === 2 ? '#e3d7bc' : K.shade, drop: 0.72 }); } }
  else if (kind === 'whitewash') { for (const tb of tubes) for (let p = tb[0]; p <= tb[1] + 0.01; p += Math.max(2.6, (tb[1] - tb[0]) / Math.max(1, Math.round((tb[1] - tb[0]) / 3)))) L.prop('lots-halls.globe', p, H - 0.01, tq, 0, { drop: 1.05, glow: K.glow }); }
  else if (kind === 'elders') { for (let p = tubes[0][0] + 0.6; p < tubes[0][1]; p += 3.6) { L.prop('lots-halls.tablelamp', p, 0.754, tq, 0, { shade: '#e8c88a' }); L.prop('lots-halls.pendant', p + 1.8, H - 0.01, tq, 0, { shade: K.cushion, drop: 0.6 }); } }
  await tk();

  // =============================================================== the pass, the kitchen behind it
  let kitchenSpots = [];
  if (k) {
    // the counter straddles the wall: panelled wood on the hall side, steel on top, a heated gantry over it
    g.mat('wood', K.dado || '#4b2f1f'); L.box(pass[0], 0, D - 0.55, pass[1], 0.9, D - T, { aoBottom: 0.6 });
    g.mat('wood', shadeHex(K.dado || '#4b2f1f', 1.3)); for (let p = pass[0] + 0.15; p < pass[1] - 0.6; p += 0.85) L.box(p, 0.16, D - 0.565, p + 0.7, 0.78, D - 0.55);
    g.mat('paint', K.enamel || '#2c4a46'); L.box(pass[0], 0.1, D - T, pass[1], 0.9, D + 0.45);
    g.mat('brushed', '#c3beb4', { rough: 0.3 }); L.box(pass[0] - 0.02, 0.9, D - 0.6, pass[1] + 0.02, 0.94, D + 0.47, { bevel: 0.006 });
    g.mat('cast', '#b8863b', { rough: -0.2 }); L.box(pass[0], 0.92, D - 0.62, pass[1], 0.945, D - 0.58, { bevel: 0.004 });
    g.mat('brushed', '#a9a39a'); for (const p of [pass[0] + 0.15, pc, pass[1] - 0.15]) L.tube([[p, 0.94, D - 0.25], [p, 1.5, D - 0.25]], 0.014, { segs: 5 });
    g.mat('brushed', '#c3beb4'); L.box(pass[0] + 0.05, 1.48, D - 0.5, pass[1] - 0.05, 1.51, D - 0.02);
    g.mat('brushed', '#3a3632'); L.box(pass[0] + 0.05, 2.18, D - 0.45, pass[1] - 0.05, 2.3, D - 0.02);
    g.mat('diffuser', '#ffb070', { emissive: 4, lamp: true }); for (let p = pass[0] + 0.6; p < pass[1] - 0.3; p += 1.2) L.box(p - 0.2, 2.17, D - 0.35, p + 0.2, 2.18, D - 0.15, { faces: 'y' });
    s.flush({ tier: 's', cast: true });
    L.solid(pass[0], 0, D - 0.6, pass[1], 0.94, D + 0.47);
    let i = salt;
    for (let p = pass[0] + 0.3; p < pass[1] - 0.2; p += 0.34, i++) {
      if (i % 4 !== 1) L.prop('lots-halls.bowl', p, 0.94, D - 0.3 + (i % 2) * 0.12, i, { glaze: GLAZES[i % 6] });
      if (i % 3 === 0) L.prop('lots-halls.bowl', p + 0.1, 1.51, D - 0.25, i, { glaze: GLAZES[(i + 3) % 6] });
    }
    g.mat('paper', '#f1ead8'); for (let p = pass[0] + 0.4; p < pass[1] - 0.3; p += 0.55) L.box(p, 1.36, D - 0.5, p + 0.07, 1.47, D - 0.497); s.flush({ tier: 'd' });
    L.light({ at: [pass[0] + 0.4, 2.1, D - 0.25], to: [pass[1] - 0.4, 2.1, D - 0.25], type: 'tube', color: warm(2400), power: 3.6, range: 4.2, lamp: true, clip: L.clip(pass[0] - 1, -0.3, D - 3.2, pass[1] + 1, 3.0, D + 1.4), radius: 0.1 });
    // the kitchen door's frame, worn pale at hand height
    g.mat('wood', K.dado || '#4b2f1f');
    for (const e of [door - 0.6 - 0.12, door + 0.6]) L.box(e, 0, D - T - 0.04, e + 0.12, 2.25, D - T);
    L.box(door - 0.72, 2.15, D - T - 0.05, door + 0.72, 2.3, D - T);
    s.flush({ tier: 's' });
    await tk();
    ph('pass'); const kr = await kitchen(C, tk); kitchenSpots = kr.spots; ph('kitchen');
    // the cook's post behind the pass, and a volunteer on the hall side with the lids
    L.spot('counter', pc, 0, D + 0.8, Math.PI, { tags: ['hall', 'cook', 'pass'] });
    L.spot('work', pc - dir * 2.2, 0, D - 1.15, 0, { tags: ['hall', 'serve'] });
    for (let j = 0; j < 3; j++) L.spot('queue', pc + dir * (0.9 - j * 0.9), 0, D - 2.0 - (j % 2) * 0.15, 0, { tags: ['hall', 'pass'] });
  } else {
    // no kitchen box: a pass counter against the back wall, as the plain hall has
    L.prop('counter', pc, 0, D - 1.4, Math.PI, { w: PW, d: 0.7, h: 0.95, body: '#3a2a20', top: '#b98a5a' });
    L.spot('counter', pc, 0, D - 0.75, Math.PI, { tags: ['hall', 'cook', 'pass'] });
    for (const dp of [-2.4, 2.4]) L.spot('work', pc + dp, 0, D - 0.75, Math.PI, { tags: ['hall', 'cook'] });
  }

  // =============================================================== along the walls
  const backQ = D - T;
  // the guests' shelf: crocks with cloth caps, sprigs in water
  L.prop('shelving', shelfP, 0, backQ - 0.17, Math.PI, { w: 1.5, h: 1.8, d: 0.32, shelves: 4, wood: shadeHex(K.dado || '#5a3a26', 1.1) }, { noSpots: true });
  { let j = salt; for (let sh = 0; sh < 4; sh++) for (let x = -0.55; x <= 0.56; x += 0.22, j++) { const y = 0.105 + sh * 0.4225; if (sh === 3 || (j % 3 === 0 && sh > 0)) L.prop('lots-halls.sprig', shelfP + x, y, backQ - 0.17, j, { leaf: ['#cfe8a0', '#b8d890', '#e0f0b0', '#a8d080'][j % 4], fine: j % 2 === 0, seed: j % 5 }); else if (j % 5 !== 2) L.prop('lots-halls.guestcrock', shelfP + x, y, backQ - 0.17, Math.PI + (j % 3) * 0.3, { glaze: ['#8a5a3c', '#3a4a7a', '#2f6c66', '#c9a24a', '#b5653a', '#e9e1cf'][j % 6], cap: ['#e8d8b8', '#d9b25c', '#c9552e', '#a9c6b0'][j % 4], h: 0.14 + (j % 3) * 0.03 }); } }
  L.sign({ kind: 'label', text: 'GUESTS', sub: 'bring herbs, not gin' }, shelfP, 1.92, backQ - 0.01, [0, -1], { w: 0.7, h: 0.2 });
  L.spot('browse', shelfP, 0, backQ - 1.0, 0, { tags: ['hall', 'guests'] });
  // the day's dish chalked up, with a light over it
  L.sign({ kind: 'chalk', title: 'Today', lines: [info.dish[0], 'guests: a seat is yours', 'gin after six'] }, chalkP, 1.65, backQ - 0.02, [0, -1], { w: 0.9, h: 1.15 });
  L.lamp('sconce', chalkP, 2.5, backQ - 0.02, { face: [0, -1], K: 2700, power: 1.0, clip: C.clip });
  // the cook's own corner: a high stool, a little shelf with a lidded cup, an apron on a peg, a card pinned up
  L.prop('stool', cornerP, 0, backQ - 0.45, 0, { h: 0.68, wood: shadeHex(K.dado || '#5a3a26', 1.2) }, { noSpots: true });
  g.mat('wood', shadeHex(K.dado || '#5a3a26', 1.1)); L.box(cornerP - 0.4, 1.25, backQ - 0.22, cornerP + 0.4, 1.28, backQ, { bevel: 0.005 });
  g.mat('paper', '#efe4cc'); L.box(cornerP - 0.12, 1.5, backQ - 0.006, cornerP + 0.12, 1.66, backQ);
  g.mat('paint', '#3a4a7a'); L.box(cornerP - 0.1, 1.53, backQ - 0.008, cornerP + 0.1, 1.6, backQ - 0.006);
  g.mat('paper', '#d9c9a0'); L.box(cornerP + 0.15, 1.28, backQ - 0.18, cornerP + 0.33, 1.3, backQ - 0.05);
  s.flush({ tier: 'd' });
  L.prop('cup', cornerP - 0.2, 1.28, backQ - 0.12, 0, { glaze: '#2f6c66', lid: '#d6a640' });
  L.prop('hall.apron', cornerP + dir * 0.55, 1.85, backQ, Math.PI, { col: '#ece4d0', tie: K.runner || K.dado || '#c9552e' });
  // trolleys parked by the shelf
  for (const j of [0, 1]) { const p = shelfP - dir * (1.6 + j * 1.15); if ((courtLo ? p : W - p) < 1.5) continue; L.prop('hall.trolley', p, 0, backQ - 0.55, Math.PI, { wood: '#8a6240' }); L.prop('lots-halls.stack', p - 0.2, 0.885, backQ - 0.55, 0, { n: 8, glaze: GLAZES[(j + salt) % 6] }); L.prop('lots-halls.stack', p + 0.2, 0.325, backQ - 0.55, 0, { n: 6, glaze: '#e9e1cf', r: 0.11 }); L.prop('lots-halls.bowl', p + 0.25, 0.885, backQ - 0.55, 0, { glaze: GLAZES[(j + 2) % 6] }); }
  // coats on pegs on the court end's wall, a bench under them
  const ne = near + dir * T;
  g.mat('wood', shadeHex(K.dado || '#5a3a26', 0.9)); for (const qr of [[1.0, 4.4], [D - 4.4, D - 1.0]]) L.box(ne, 1.66, qr[0], ne + dir * 0.04, 1.78, qr[1], { bevel: 0.006 }); s.flush({ tier: 's' });
  { let j = salt; for (const qr of [[1.0, 4.4], [D - 4.4, D - 1.0]]) for (let q = qr[0] + 0.25; q < qr[1] - 0.1; q += 0.42, j++) if (j % 5 !== 1) L.prop('hall.coat', ne + dir * 0.02, 1.72, q, Math.atan2(dir, 0), { col: COATS[(j * 3) % COATS.length], patch: j % 3 === 0 ? ['#e0b04a', '#c9552e', '#3fa7a3', '#f1e6cf'][j % 4] : null, len: 0.8 + (j % 4) * 0.06 }); }
  L.prop('lots-halls.bench', ne + dir * 0.3, 0, D - 2.7, Math.atan2(dir, 0), { len: 2.6, wood: shadeHex(K.dado || '#5a3a26', 1.2) }, { spot: { tags: ['hall', 'wait'] } });
  // plants by the openings onto the court
  for (const p of [arches[0].at - 0.55, arches[arches.length - 1].at + arches[arches.length - 1].w + 0.55]) if (p > 0.6 && p < W - 0.6) L.prop('plant', p, 0, T + 0.4, 0, { kind: ['broad', 'fern', 'fine'][(salt + Math.round(p)) % 3], size: 1.3, pot: ['#b4643e', '#2f6c66', '#d4a24a'][salt % 3] });
  // sideboards (refectory, elders) or benches (whitewash, felts) along the free stretches of the back wall
  for (const fr of C.backFree) {
    const len = fr[1] - fr[0]; if (len < 2.8) continue;
    const n = Math.floor(len / 7.5) || 1;
    for (let i = 0; i < n; i++) {
      const p = fr[0] + len * (i + 0.5) / n;
      if (Math.abs(p - shelfP) < 2.2) continue;
      if (kind === 'refectory' || kind === 'elders') {
        L.prop('counter', p, 0, backQ - 0.27, Math.PI, { w: 2.2, d: 0.5, h: 0.88, body: [K.runner || '#2f6c66', '#2f6c66', '#7a2f28', '#3c5a3e'][(i + salt) % 4], top: shadeHex(K.dado, 1.2) }, { noSpots: true });
        for (let j = 0; j < 4; j++) { const x = p - 0.75 + j * 0.5; if ((j + i) % 2) L.prop('lots-halls.stack', x, 0.88, backQ - 0.3, 0, { n: 6 + (j % 2) * 2, glaze: GLAZES[(i + j + salt) % 6] }); else L.prop('lots-halls.crock', x, 0.88, backQ - 0.3, 0, { glaze: ['#8a5a3c', '#3a4a7a', '#c9a24a'][(i + j) % 3], h: 0.22, r: 0.08 }); }
      } else {
        L.prop('lots-halls.bench', p, 0, backQ - 0.3, Math.PI, { len: 2.0, back: true, wood: shadeHex(K.bench, 0.9) }, { spot: { tags: ['hall', 'wait'] } });
      }
    }
  }
  // the elders' hall: a brass handrail on the back wall, the clock, the hundred board
  if (kind === 'elders') {
    g.mat('cast', '#b08a50', { rough: -0.2 });
    for (const fr of C.backFree) if (fr[1] - fr[0] > 1) { L.tube([[fr[0] + 0.2, 0.92, backQ - 0.07], [fr[1] - 0.2, 0.92, backQ - 0.07]], 0.022, { segs: 6 }); for (let p = fr[0] + 0.4; p < fr[1] - 0.2; p += 1.5) L.box(p - 0.015, 0.9, backQ - 0.07, p + 0.015, 0.93, backQ); }
    s.flush({ tier: 's' });
    L.prop('lots-halls.clock', pc, 2.6, backQ - 0.01, Math.PI, { wood: K.panel });
  }
  // the children's table, on the Low decks: low, with stools, drawn on underneath
  let kidsAt = null;
  if (info.band === 'low') {
    const u = kind === 'felts' || kind === 'whitewash' ? Math.min(W * 0.2, 9.5) : 6.0, q = kind === 'felts' || kind === 'whitewash' ? tq : D - 2.4;
    const p = u2p(u); kidsAt = [p, q];
    L.prop('table', p, 0, q, 0, { w: 1.6, d: 0.7, h: 0.55, wood: '#c58a2c', top: '#e0b04a' });
    for (const sg of [-1, 1]) for (let j = 0; j < 3; j++) {
      const pp = p - 0.5 + j * 0.5, qq = q + sg * 0.55;
      L.prop('lots-halls.stool', pp, 0, qq, 0, { h: 0.34, wood: ['#2f6c66', '#c9552e', '#33407a'][j] }, { noSpots: true });
      L.spot('sit', pp, 0.34, qq, sg < 0 ? 0 : Math.PI, { tags: ['hall', 'eat', 'table', 'kids'] });
      L.prop('lots-halls.place', pp, 0.55, q + sg * 0.17, sg < 0 ? Math.PI : 0, { mat: '#e8d8b8', glaze: GLAZES[(j + 2) % 6], lid: '#d6a640' }, { scale: 0.85 });
    }
    for (let j = 0; j < 3; j++) L.spot('play', p + (j - 1) * 0.9, 0, q + (q > tq ? -1.3 : 1.3), j, { tags: ['kids', 'hall'] });
  }
  await tk();

  ph('walls');
  // =============================================================== light
  const tubeColor = warm(kind === 'whitewash' ? 3000 : kind === 'elders' ? 2550 : 2700), tubePower = { refectory: 3.6, whitewash: 4.6, felts: 3.6, elders: 3.4 }[kind], tubeY = kind === 'whitewash' ? 2.2 : 1.95;
  for (const tb of tubes) {
    const n = Math.max(1, Math.ceil((tb[1] - tb[0]) / (kind === 'felts' ? 42 : 21))), len = (tb[1] - tb[0]) / n;
    for (let i = 0; i < n; i++) L.light({ at: [tb[0] + i * len + 0.2, tubeY, tb[2]], to: [tb[0] + (i + 1) * len - 0.2, tubeY, tb[2]], type: 'tube', color: tubeColor, power: tubePower, range: kind === 'felts' ? 5.2 : 6.5, lamp: true, shadow: true, radius: 0.2, clip: C.clip });
  }
  // the court's light coming in through the openings
  L.light({ at: [c0 + 0.8, 2.5, 0.9], to: [c1 - 0.8, 2.5, 0.9], type: 'tube', color: '#fff0dc', power: 2.4, range: 6.5, lamp: true, radius: 0.8, clip: C.clip });
  L.ambient(c0, 0, 0, c1, 3.0, 4.5, { sky: '#fff1dc', ground: '#d9c4a4', power: 0.2, lamp: true, soft: 2.2 });
  farEnd(C);
  L.glowBox(0, 0, 0, W, H, D, { sky: kind === 'whitewash' ? '#fff1e0' : '#ffd8a6', ground: K.floor[1], power: { refectory: 0.2, whitewash: 0.34, felts: 0.17, elders: 0.18 }[kind] });

  ph('light');
  // =============================================================== walkways
  const qa = aisles[0], qb = aisles[aisles.length - 1];
  const lo = Math.min(ends[0], ends[1]), hi = Math.max(ends[0], ends[1]);
  const taps = new Map(aisles.map((q) => [q, [lo, hi]]));
  for (const q of aisles) for (const p of gaps) taps.get(q).push(p);
  for (const p of midsA) taps.get(qa).push(p);
  taps.get(qb).push(pc); if (door !== null) taps.get(qb).push(door);
  // the front aisle reaches every opening, even those beyond the tables' ends
  const flo = Math.min(lo, ...midsA), fhi = Math.max(hi, ...midsA);
  taps.get(qa).push(flo, fhi);
  for (const q of aisles) {
    const a0 = q === qa ? flo : lo, a1 = q === qa ? fhi : hi;
    const pts = taps.get(q).filter((p) => p >= a0 - 0.01 && p <= a1 + 0.01).sort((u, v) => u - v);
    const out = []; for (const p of pts) { if (out.length && p - out[out.length - 1] < 0.8) continue; if (out.length) { const last = out[out.length - 1]; const n = Math.floor((p - last) / 3.2); for (let i = 1; i <= n; i++) out.push(last + (p - last) * i / (n + 1)); } out.push(p); }
    L.path(out.map((p) => [p, q]), { width: 1.2 });
  }
  for (const p of [lo, hi].concat(gaps)) L.path(aisles.map((q) => [p, q]), { width: 1.1 });
  for (const m of midsA) L.path([[m, -0.8], [m, 0.9], [m, qa]], { width: 1.4 });
  if (k) { L.path([[pc, qb], [pc, D - 1.2]], { width: 1.2 }); L.path([[door, qb], [door, D - 0.2]], { width: 1.1 }); }
  // chat by the way in, volunteers walking the aisles with the lids
  for (let j = 0; j < 3; j++) { const a = j / 3 * Math.PI * 2 + salt, cp = u2p(2.0), cq = kind === 'refectory' || kind === 'elders' ? D - 3.4 : tq; L.spot('chat', cp + Math.sin(a) * 0.6, 0, cq + Math.cos(a) * 0.6, a + Math.PI, { tags: ['hall', 'door'] }); }
  for (let j = 0; j < 4; j++) { const p = u2p(W * (0.3 + j * 0.17)), q = j % 2 ? qa : qb; L.spot('work', p, 0, q, q < tq ? 0 : Math.PI, { tags: ['hall', 'serve', 'lids'] }); }
  await tk();

  // =============================================================== things to do
  const key = 'hall:' + info.key, first = info.cook.split(' ')[0], neighbour = pickBy(lot.seed, 21, NEIGHBOURS);
  const Dish = info.dish[0].charAt(0).toUpperCase() + info.dish[0].slice(1);
  const V = { dish: info.dish[0], Dish, line: info.dish[1], cook: info.cook, first, hall: info.hall, block: info.name, name: neighbour, g: info.g.toFixed(2), drum: pickBy(lot.seed, 23, DRUMS.filter((d) => d !== 'Spelt')) };
  const F = (line) => fill(line, V);
  const keyed = DISH_KEYED.find((e) => e[0].test(info.dish[0]));
  const more = pickBy(lot.seed, 31, DISH_MORE[info.dish[0]] || (keyed ? keyed[1] : DISH_MORE_ANY));
  let seated = null, lidUp = false;
  const isSeated = (gm) => !!(seated && gm.player && gm.player.seat && gm.player.seat.hall === lot.id);
  const sitAt = (gm, st) => {
    const pl = gm.player; if (!pl || !pl.sit) return false;
    if (pl.seat) pl.stand();
    const c = L.P(st.p, st.q);
    pl.sit({ x: c[0], y: 0, z: c[1], yaw: L.yaw(st.a), eye: 1.16, hall: lot.id });
    pl.yaw = L.pyaw(st.a); pl.pitch = -0.3;
    seated = st; lidUp = false;
    if (gm.audio) L.sfx(gm, 'clunk', st.p, 0.4, st.q, { vol: 0.25 });
    return true;
  };
  const standUp = (gm) => {
    const st = seated; seated = null; lidUp = false; const pl = gm.player; if (!pl) return;
    pl.stand();
    if (st) { const c = L.P(st.p - Math.sin(st.a) * 0.85, st.q - Math.cos(st.a) * 0.85); pl.place(s.frame, c[0], 0, c[1], L.pyaw(st.a), 0); }
  };
  const freeSeat = (st) => !st.spot.taken && !(st.spot.pp && st.spot.pp.blocked);
  // the seat the cook gives a guest: free, on the side of the table nearest the pass, nearest the pass
  const guestSeat = () => { let best = null, bs = 1e9; for (const st of seats) { if (!freeSeat(st) || st.cafe) continue; const sc = Math.abs(st.p - pc) + 0.7 * (D - st.q); if (sc < bs) { bs = sc; best = st; } } return best; };
  const nearSeat = (gm) => {
    const pl = gm.player; if (!pl || pl.frame !== s.frame) return null;
    const ya = pl.yaw, tx = pl.pos.x + Math.sin(ya) * 0.9, tz = pl.pos.z - Math.cos(ya) * 0.9, lp = L.inv(tx, tz);
    let best = null, bd = 1.3; for (const st of seats) { const d = Math.hypot(st.p - lp[0], st.q - lp[1]); if (d < bd && freeSeat(st)) { bd = d; best = st; } } return best;
  };
  L.interact({ p: pc, q: D - 1.3, y: 1.15, radius: 1.9, kind: 'talk', prompt: 'Ask at the pass', onUse: async (gm) => {
    const eaten = gm.flags[key];
    const lines = eaten ? [pickBy(lot.seed, 41, AGAIN)] : [pickBy(lot.seed, 11, ASK), F(pickBy(lot.seed, 13, DISH)), F(more) + ' ' + F(pickBy(lot.seed, 17, RULE)), F(pickBy(lot.seed, 19, SEAT))];
    const st = guestSeat();
    if (!st) lines.push('Every seat is taken. Eat it standing at the pass, then: it counts.');
    await say(gm, first, lines);
    if (!eaten) { gm.flags[key] = true; gm.flags.halls_eaten = (gm.flags.halls_eaten || 0) + 1; if (gm.audio) gm.sfx('lid-up', { vol: 0.5 }); note(gm, 'You lift the lid at ' + info.hall + ', ' + info.name + '. ' + gm.flags.halls_eaten + (gm.flags.halls_eaten === 1 ? ' hall' : ' halls') + ' so far.', 'gain'); gm.events.emit('hall:eat', { cell: info.key, name: info.hall, block: info.name, dish: info.dish[0], n: gm.flags.halls_eaten }); if (gm.story && gm.story.persist) gm.story.persist(); }
    else if (gm.audio) gm.sfx('lid-up', { vol: 0.5 });
    if (st && sitAt(gm, st)) {
      lidUp = true;
      if (eaten) note(gm, F(pickBy(lot.seed + (gm.flags.halls_eaten || 0), 43, LID_TOAST)));
      await say(gm, neighbour, [F(pickBy(lot.seed, 47, NEIGHBOUR[info.band] || NEIGHBOUR.middle))]);
    }
  } });
  s.interact({ radius: 1.3, prompt: 'Sit at the table', wide: true, enabled: (gm) => !isSeated(gm),
    pos: (gm) => { const st = nearSeat(gm); if (!st) return null; const c = L.P(st.p, st.q); return [c[0], 0.85, c[1]]; },
    onUse: (gm) => { const st = nearSeat(gm); if (st) sitAt(gm, st); } });
  s.interact({ radius: 1.1, priority: 0.8, prompt: 'Stand up', wide: true, enabled: isSeated,
    pos: (gm) => { if (!isSeated(gm)) return null; const pl = gm.player, c = L.P(seated.p, seated.q); return [c[0] + Math.sin(pl.yaw) * 0.7, 1.16, c[1] - Math.cos(pl.yaw) * 0.7]; },
    onUse: (gm) => standUp(gm) });
  s.interact({ radius: 1.0, priority: 1.0, prompt: () => (lidUp ? 'Put the lid back' : 'Lift the lid'), enabled: isSeated,
    pos: () => { if (!seated) return null; const c = L.P(seated.p + Math.sin(seated.a) * 0.5, seated.q + Math.cos(seated.a) * 0.5); return [c[0], 0.82, c[1]]; },
    onUse: (gm) => { lidUp = !lidUp; if (gm.audio) L.sfx(gm, lidUp ? 'lid-up' : 'lid-down', seated.p, 0.8, seated.q, { vol: 0.5 }); if (lidUp) note(gm, F(pickBy(lot.seed + Math.floor(gm.time || 0), 43, LID_TOAST))); } });
  // the chalkboard
  L.interact({ p: chalkP, q: backQ - 0.4, y: 1.6, radius: 1.5, prompt: 'Read the chalkboard', onUse: (gm) => {
    if (gm.audio) gm.sfx('chalk', { vol: 0.4 });
    const late = gm.clock && gm.clock.hours >= 18;
    if (gm.ui) gm.ui.card({ kicker: info.hall, title: 'Today: ' + info.dish[0], text: info.dish[1] + ' ' + (late ? pickBy(lot.seed, 53, GIN) : pickBy(lot.seed, 51, CHALK_MORE)), dur: 7 });
  } });
  L.interact({ p: shelfP, q: backQ - 0.5, y: 1.2, radius: 1.5, prompt: 'Look at the guests’ shelf', onUse: (gm) => say(gm, 'The guests’ shelf', pickBy(lot.seed, 61, GUESTS).map(F)) });
  L.interact({ p: cornerP, q: backQ - 0.4, y: 1.3, radius: 1.4, prompt: 'Look at the cook’s corner', onUse: (gm) => say(gm, first + '’s corner', pickBy(lot.seed, 63, CORNER).map(F)) });
  // one thing more, by kind
  if (kind === 'refectory') {
    let bp = 1.25; for (let p = 1.25; p < W - 0.5; p += 2.5) if (Math.abs(p - pc) < Math.abs(bp - pc)) bp = p;
    L.interact({ p: bp, q: D - 1.6, y: 2.6, radius: 2.0, wide: true, prompt: 'Read the names on the beam', onUse: (gm) => say(gm, 'The beam', pickBy(lot.seed, 71, BEAM).map(F)) });
  } else if (kind === 'whitewash') {
    const sp = seats.filter((st) => !st.cafe && st.side < 0).sort((u, v) => Math.abs(u.p - pc) - Math.abs(v.p - pc))[0];
    if (sp) L.interact({ p: sp.p, q: tq - 0.35, y: 0.95, radius: 1.5, prompt: 'Slide the jug along the table', onUse: (gm) => { if (gm.audio) L.sfx(gm, 'clunk', sp.p, 0.8, tq, { vol: 0.2 }); return say(gm, 'The oval table', pickBy(lot.seed, 73, SLIDE[info.band] || SLIDE.middle).map(F)); } });
  } else if (kind === 'felts') {
    let fp = 1.6; for (let p = 1.6; p < W - 1.0; p += 1.85) if (Math.abs(p - (c0 + c1) / 2) < Math.abs(fp - (c0 + c1) / 2)) fp = p;
    L.interact({ p: fp, q: T + 1.0, y: 2.5, radius: 1.9, wide: true, prompt: 'Read the tag on the felt', onUse: (gm) => say(gm, 'A felt', pickBy(lot.seed, 75, FELT).map(F)) });
  } else {
    const st = seats.filter((x) => x.side > 0)[Math.min(3, seats.length - 1)] || seats[0];
    if (st) L.interact({ p: st.p, q: tq + 0.25, y: 0.9, radius: 1.3, prompt: 'Lift one of the heavy lids', onUse: async (gm) => { if (gm.audio) L.sfx(gm, 'lid-up', st.p, 0.8, tq, { vol: 0.6 }); await say(gm, 'A cast lid', pickBy(lot.seed, 77, HEAVY).map(F)); if (gm.audio) L.sfx(gm, 'lid-down', st.p, 0.8, tq, { vol: 0.6 }); } });
    const hp = (pc + cornerP) / 2 + dir * 1.9;
    L.sign({ kind: 'board', title: 'One hundred', lines: ['this year|' + (2 + (lot.seed % 5)), 'the breakfast|Monday', 'the end seat|kept'], palette: ['#2a1c14', '#f3e6c8', '#d1952c'] }, hp, 1.6, backQ - 0.01, [0, -1], { w: 0.9, h: 0.65 });
    L.interact({ p: hp, q: backQ - 0.5, y: 1.5, radius: 1.4, prompt: 'Read the hundred board', onUse: (gm) => say(gm, 'The hundred board', pickBy(lot.seed, 79, HUNDRED).map(F)) });
  }
  if (kidsAt) L.interact({ p: kidsAt[0], q: kidsAt[1], y: 0.5, radius: 1.3, wide: true, prompt: 'Look under the children’s table', onUse: (gm) => say(gm, 'The children’s table', pickBy(lot.seed, 81, KIDS).map(F)) });

  // =============================================================== sound and the zone
  const mq = L.P(W / 2, tq), h = s.loop('murmur', mq[0], 1.2, mq[1], { vol: 0.4, radius: 26, param: 0.5 });
  let acc = 2;
  s.every((dt, gm) => {
    acc += dt; if (acc < 2) return; acc = 0;
    const hr = gm && gm.clock ? gm.clock.hours : 13, meal = (hr >= 12.2 && hr < 14.5) || (hr >= 18.2 && hr < 21) || (hr >= 6.9 && hr < 8.9);
    const night = hr >= 23 || hr < 6.5;
    if (h && h.set) h.set({ vol: night ? 0.12 : meal ? 0.5 : 0.26, param: night ? 0.12 : meal ? 0.85 : 0.3 });
  });
  s.zoneBox({ id: lot.id, place: 'city-hall', box: [lot.x0, -0.5, lot.z0, lot.x1, FH, lot.z1], name: info.hall, sub: 'the long table · ' + info.name, ambience: 'hall', reverb: kind === 'felts' || kind === 'elders' ? 'felt' : 'hall', cell: info.key,
    env: { exposure: 1.0, autoKey: kind === 'whitewash' ? 0.17 : 0.15, warmth: kind === 'whitewash' ? 0.2 : 0.38, bloom: 0.07 } });
  void kitchenSpots;
  busyMs += performance.now() - mark;
  if (log) console.log('[halls] ' + lot.id + ' ' + kind + ' W ' + W.toFixed(1) + ': ' + Math.round(trisOf(s) - tris0) + ' tris, ' + (s.lights.length - lights0) + ' lights, ' + seats.length + ' seats, ' + busyMs.toFixed(1) + ' ms work over ' + (performance.now() - T0).toFixed(0) + ' ms (' + phases.join(', ') + ')');
}
// a little deterministic angle from a point
function j0(c) { return (c[0] * 3.7 + c[1] * 1.3) % 6.28; }

registerLot('hall', buildHall);

// a place record so the file is loaded; it builds nothing itself
export const place = { id: 'lots-halls', name: 'Lots: halls', order: 2, always: true, build() {} };
