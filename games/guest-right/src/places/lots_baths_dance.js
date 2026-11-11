// The tea dance (the High decks, half a g, the dancers mostly past ninety): a curtained door on the street, a foyer with
// the cloak room on one side and the tea room on the other, then the hall: a sprung floor under a tall felt-hung room,
// tables round the edge, chairs along the walls, and at the back a band shell like an opened scallop, lit from inside.
import { local, chatRing, pickBy, sitPlayer, seatedAs } from './lots_baths_kit.js';
import { smoothArch, quadN, bathsParts } from './baths_parts.js';
import { danceProps } from './lots_baths_dance_props.js';
import { column } from '../world/kit2.js';
import { say, note } from '../city/lots.js';
import { Rng, shadeHex, mixHex, clamp } from '../core/util.js';

const SCHEMES = [
  { deep: '#3f2346', deep2: '#2a1630', rose: '#c46a6f', cream: '#f0e2c6', gilt: '#c9a24a', accent: '#2f7f7a', floor: '#b98652', carpet: '#6e2f45', felt: ['#7a2f45', '#c9893a', '#2f6a6a', '#4a3a7a'], seat: '#7a2f45' },
  { deep: '#1f3f4a', deep2: '#142a32', rose: '#d07a5a', cream: '#efe4cc', gilt: '#c8a04a', accent: '#b8463a', floor: '#c08f5a', carpet: '#2f4a5a', felt: ['#b8463a', '#d9a441', '#33407a', '#5a7a4a'], seat: '#2f6a6a' },
  { deep: '#3a3f22', deep2: '#262a16', rose: '#d9a441', cream: '#f1e6cc', gilt: '#c4983f', accent: '#8a2f3c', floor: '#b07a48', carpet: '#5a3a26', felt: ['#8a2f3c', '#2f6f73', '#d9a441', '#6b4a7a'], seat: '#8a2f3c' },
];
const NAMES = [['THE SLOW FLOOR', 'The Slow Floor'], ['THE LONG TURN', 'The Long Turn'], ['THE KETTLE ROOMS', 'The Kettle Rooms'], ['THE HIGH STEP', 'The High Step'], ['THE TEA FLOOR', 'The Tea Floor'], ['THE LIFT AND LAND', 'The Lift and Land']];
const DANCES = ['The Slow Round', 'Anti and Back', 'The Kettle Waltz', 'The Long Lift', 'Two Lids', 'Spinward Drift', 'The Hand’s Width', 'The Quiet Reel', 'The Aunts’ Turn', 'Hang and Land', 'The Lamp-Night Walk', 'Three Bars Up'];
const LANTERNS = ['#e8743b', '#f2c060', '#d4553a', '#7fc0a8', '#c96a9a', '#f2c060'];
const PENTA = [1, 1.125, 1.25, 1.5, 1.6667, 2, 2.25, 2.5];

export async function buildDance(s, lot, plan, game, tick) {
  void danceProps; void bathsParts;
  const L = local(s, lot), g = s.g, W = L.W, D = L.D, info = plan.info, r = new Rng(lot.seed);
  let tLast = performance.now(), twork = 0, tmax = 0;
  let tn = 0; const slow = [];
  const T = async () => { const d = performance.now() - tLast; twork += d; if (d > tmax) tmax = d; tn++; if (d > 7) slow.push(tn + ':' + d.toFixed(1)); if (tick) await tick(); tLast = performance.now(); };
  const DBG = () => { let n = 0; for (const ch of s.chunks.values()) if (ch.bufs) for (const k in ch.bufs) n += ch.bufs[k].ni / 3; return [Math.round(n), s.lights.length]; }, dbg0 = DBG(), tb0 = performance.now();
  const S = SCHEMES[r.i(0, SCHEMES.length - 1)], seed = lot.seed;
  const NM = pickBy(seed, 1, NAMES), gw = info.g.toFixed(2);
  const cx = W / 2, F = 7.2;
  const A = clamp(W * 0.15, 5.4, 7.5);                       // the side aisles of the hall
  const fw = clamp(W * 0.36, 13, 18), f0 = cx - fw / 2, f1 = cx + fw / 2;
  const cloakLeft = r.chance(0.5), toF = cloakLeft ? 1 : -1;
  const cloakW = 9;
  let cl0, cl1, st0 = 0, st1 = 0, te0, te1;
  if (cloakLeft) { cl1 = f0; cl0 = f0 - cloakW < 2.4 ? 0 : f0 - cloakW; st1 = cl0; te0 = f1; te1 = W; } else { cl0 = f1; cl1 = W - f1 - cloakW < 2.4 ? W : f1 + cloakW; st0 = cl1; st1 = cl1 < W ? W : cl1; te0 = 0; te1 = f0; }
  const cloakWall = cloakLeft ? f0 : f1, teaWall = cloakLeft ? f1 : f0, teaOut = cloakLeft ? 1 : -1;
  const pa = (A * 0.5 + 0.85 + A - 0.3) / 2;                 // the walkway down each aisle
  const pTeaDoor = cloakLeft ? W - pa : pa;
  const H1 = 3.3, HH = 6.9;
  const clipFoy = L.clip(f0, -0.3, 0, f1, 3.45, F), clipCl = L.clip(cl0, -0.3, 0, cl1, 3.45, F), clipTea = L.clip(te0, -0.3, 0, te1, 3.45, F);
  const clipHall = L.clip(0, -0.4, F, W, 7.0, D), clipAisleL = L.clip(0, -0.3, F, A, 3.45, D), clipAisleR = L.clip(W - A, -0.3, F, W, 3.45, D);

  // ================================================================================================
  // the front on the street: dark paint and tile, lit windows into the foyer and the tea room, a curtained door
  // ================================================================================================
  const ops = [{ at: cx - 1.05, w: 2.1, h: 2.55 }], wins = [];
  const wd = Math.min(2.2, fw / 2 - 2.8);
  if (wd > 1.0) { wins.push([cx + 1.05 + 0.9, wd, 0.95, 1.45]); wins.push([cx - 1.05 - 0.9 - wd, wd, 0.95, 1.45]); }
  { const n = Math.max(1, Math.floor((te1 - te0 - 1.4) / 2.9)); for (let k = 0; k < n; k++) wins.push([te0 + (te1 - te0 - n * 2.9) / 2 + 0.55 + k * 2.9, 1.8, 0.8, 1.65]); }
  if (cl1 - cl0 > 3) wins.push([(cl0 + cl1) / 2 - 0.8, 1.6, 0.95, 1.45]);
  for (const w of wins) ops.push({ at: w[0], w: w[1], h: w[3], sill: w[2] });
  L.wallP(0.08, 0, W, 0, 3.2, { tint: S.cream, inner: { tint: S.cream, mat: 'plaster' }, outer: { tint: S.deep, mat: 'paint' }, dado: { h: 0.8, mat: 'tile', tint: S.deep2 }, skirt: S.deep2, openings: ops });
  s.structure(() => {
    for (const w of wins) {
      g.mat('cast', S.gilt, { rough: -0.2 });
      const n = Math.max(2, Math.round(w[1] / 0.6));
      for (let k = 1; k < n; k++) L.box(w[0] + k * w[1] / n - 0.015, w[2], 0.06, w[0] + k * w[1] / n + 0.015, w[2] + w[3], 0.1);
      L.box(w[0], w[2] + w[3] * 0.72, 0.06, w[0] + w[1], w[2] + w[3] * 0.72 + 0.03, 0.1);
      g.mat('tile', S.rose); L.box(w[0] - 0.08, w[2] - 0.07, -0.08, w[0] + w[1] + 0.08, w[2], 0.0, { bevel: 0.01 });
      g.mat('tile', S.cream); L.box(w[0] - 0.1, w[2] + w[3], -0.07, w[0] + w[1] + 0.1, w[2] + w[3] + 0.1, 0.0, { bevel: 0.01 });
    }
    // pilasters and a gilt cornice along the whole front
    g.mat('tile', S.deep2);
    const np = Math.max(2, Math.round(W / 4.5));
    for (let k = 0; k <= np; k++) { const p = clamp(k * W / np, 0.2, W - 0.2); if (Math.abs(p - cx) < 1.4) continue; let hit = false; for (const w of wins) if (p > w[0] - 0.25 && p < w[0] + w[1] + 0.25) hit = true; if (hit) continue; L.box(p - 0.16, 0, -0.1, p + 0.16, 3.2, 0.0, { bevel: 0.012 }); }
    g.mat('cast', S.gilt, { rough: -0.2 }); L.box(0, 3.06, -0.1, W, 3.12, 0.0); L.box(0, 0.8, -0.03, W, 0.84, 0.0);
    // the door's surround
    g.mat('tile', S.rose); L.box(cx - 1.32, 0, -0.1, cx - 1.05, 2.8, 0.0, { bevel: 0.015 }); L.box(cx + 1.05, 0, -0.1, cx + 1.32, 2.8, 0.0, { bevel: 0.015 }); L.box(cx - 1.32, 2.55, -0.1, cx + 1.32, 2.8, 0.0, { bevel: 0.015 });
    g.mat('mosaic', S.gilt); L.box(cx - 1.0, 0.002, -0.6, cx + 1.0, 0.006, 0.6, { faces: 'Y' });
    g.mat('mosaic', S.deep); L.box(cx - 0.85, 0.006, -0.48, cx + 0.85, 0.009, 0.48, { faces: 'Y' });
  });
  await T();
  for (const w of wins) L.glass(w[0], w[2], 0.08, w[0] + w[1], w[2] + w[3], 0.08, { opacity: 0.12 });
  L.sign({ kind: 'fascia', text: NM[0], sub: pickBy(seed, 2, ['tea dance · ' + gw + ' g · all afternoon', 'tea and a turn · ' + gw + ' g', 'the band from two · tea under a lid', 'dancing at ' + gw + ' g · come and sit']), palette: [S.deep2, '#f6e7c8', S.gilt], emblem: 'cup' }, cx, 2.97, -0.11, [0, -1], { w: Math.min(5.2, W * 0.3), h: 0.42, glow: 2 });
  await T();
  // felt curtains drawn back to both sides of the doorway, tied with gilt cord
  s.deco(() => {
    g.mat('cast', S.gilt); L.tube([[cx - 1.2, 2.5, 0.24], [cx + 1.2, 2.5, 0.24]], 0.016, { segs: 6 });
    for (const sd of [-1, 1]) {
      const a = cx + sd * 1.02, b = cx + sd * 0.62;
      g.mat('felt', S.rose); L.sheet([Math.min(a, b), 2.48, 0.25], [Math.max(a, b), 2.48, 0.25], [Math.max(a, b) + (sd < 0 ? -0.18 : 0.0), 0.02, 0.27], [Math.min(a, b) + (sd > 0 ? 0.18 : 0.0), 0.02, 0.27], { nu: 4, nv: 6, ripple: 0.04, rippleN: 5 });
      g.mat('cast', S.gilt); L.tube([[cx + sd * 0.7, 1.05, 0.28], [cx + sd * 1.04, 1.1, 0.22]], 0.012, { segs: 4 });
    }
  });
  const clipOut = L.clip(cx - 4, -0.3, -3, cx + 4, 3.4, 0.05);
  L.lamp('sconce', cx - 1.7, 2.25, -0.1, { face: [0, -1], clip: clipOut, K: 2600, power: 0.8 });
  L.lamp('sconce', cx + 1.7, 2.25, -0.1, { face: [0, -1], clip: clipOut, K: 2600, power: 0.8 });
  await T();

  // ================================================================================================
  // band 1: the foyer, the cloak room, the tea room (and a lamp store, shut)
  // ================================================================================================
  await T();
  L.floor(f0, 0, f1, F, 0, 'pattern', mixHex(S.cream, S.rose, 0.25));
  L.ceiling(f0, 0, f1, F, H1, 'paint', S.cream);
  L.floor(cl0, 0, cl1, F, 0, 'planks', '#9a6a42'); L.ceiling(cl0, 0, cl1, F, H1, 'paint', '#e9dcc0');
  L.floor(te0, 0, te1, F, 0, 'tile', mixHex(S.cream, S.rose, 0.4)); L.ceiling(te0, 0, te1, F, H1, 'paint', S.cream);
  const wall1 = { tint: S.cream, mat: 'plaster', dado: { h: 1.0, mat: 'wood', tint: shadeHex(S.deep, 1.1) }, skirt: S.deep2 };
  L.wallQ(cloakWall, 0.16, F - 0.08, 0, H1, Object.assign({}, wall1, { openings: [{ at: 1.2, w: 3.6, h: 2.3 }, { at: F - 1.75, w: 0.95, h: 2.15 }] }));
  L.wallQ(teaWall, 0.16, F - 0.08, 0, H1, Object.assign({}, wall1, { openings: [{ at: 1.5, w: 3.6, h: 2.7 }] }));
  if (Math.abs(st1 - st0) > 0.5) L.wallQ(cloakLeft ? cl0 : cl1, 0.16, F - 0.08, 0, H1, wall1);
  await T();
  // the wall between the front rooms and the hall rises the hall's full height
  L.wallP(F, 0, W, 0, 7.0, { tint: S.cream, mat: 'plaster', dado: { h: 1.0, mat: 'wood', tint: shadeHex(S.deep, 1.1) }, skirt: S.deep2,
    openings: [{ at: cx - 2.2, w: 4.4, h: 3.0 }, { at: pTeaDoor - 1.0, w: 2.0, h: 2.5 }].sort((a, b) => a.at - b.at) });
  smoothArch(s, L.P(cx, F)[0], 0, L.P(cx, F)[1], 4.4, 3.0, L.o.alongX ? 'x' : 'z', { tint: S.cream, line: S.rose, key: S.gilt, depth: 0.36, rise: 1.1 });
  smoothArch(s, L.P(teaWall, 3.3)[0], 0, L.P(teaWall, 3.3)[1], 3.6, 2.7, L.o.alongX ? 'z' : 'x', { tint: S.cream, line: S.accent, key: S.gilt, depth: 0.3, rise: 0.8 });
  await T();
  // foyer: beams, a runner from the door to the arch, benches under the windows, ferns, the programme
  s.deco(() => { g.mat('wood', shadeHex(S.deep, 0.9)); for (let p = f0 + 1.4; p < f1 - 0.6; p += 2.3) L.box(p - 0.09, H1 - 0.2, 0.2, p + 0.09, H1, F - 0.1, { bevel: 0.012 }); });
  L.prop('rug', cx, 0, F / 2, Math.PI / 2, { w: F - 1.0, d: 1.7, a: S.deep, b: S.gilt });
  for (const sd of [-1, 1]) { const p = cx + sd * (fw / 2 - 2.0); L.prop('bench', p, 0, 0.5, 0, { w: 1.8, back: true, wood: '#5a3d28', metal: '#2a2622' }, { spot: { tags: ['teadance', 'wait'] } }); }
  L.prop('baths.fernpot', f0 + 0.6, 0, F - 0.6, 0, { pot: S.rose, size: 1.1 }); L.prop('baths.fernpot', f1 - 0.6, 0, F - 0.6, 0, { pot: S.accent, size: 1.0 });
  L.prop('baths.fernpot', cx - 1.75, 0, F - 0.55, 0, { pot: S.gilt, size: 0.8 }); L.prop('baths.fernpot', cx + 1.75, 0, F - 0.55, 0, { pot: S.gilt, size: 0.8 });
  await T();
  const dances = []; { const pool = DANCES.slice(); const rr = new Rng(seed ^ 0x51ed); rr.shuffle(pool); for (let k = 0; k < 5; k++) dances.push(pool[k]); }
  const times = ['two', 'half past two', 'three', 'four', 'five'];
  const bp = cx + Math.min(3.4, fw / 2 - 1.6);
  L.sign({ kind: 'board', title: pickBy(seed, 3, ['This afternoon', 'The dances today', 'On the floor', 'The programme']), lines: dances.map((d, i) => d + '|' + times[i]), palette: [S.deep2, '#f3e6c8', S.gilt] }, bp, 1.55, F - 0.1, [0, -1], { w: 1.25, h: 1.0 });
  await T();
  L.spot('stand', bp, 0, F - 0.8, Math.PI, { tags: ['read', 'board'] }); L.spot('stand', bp - 0.7, 0, F - 0.9, Math.PI - 0.3, { tags: ['read', 'board'] });
  chatRing(L, cx - 3.0, F * 0.45, 3, 0.6, ['teadance']);
  s.structure(() => {
    g.mat('tile', S.rose);
    L.box(f0 + 0.08, 1.0, F - 0.1, f1 - 0.08, 1.07, F - 0.07); L.box(f0 + 0.08, 1.0, 0.16, f1 - 0.08, 1.07, 0.19);
    L.box(f0 + 0.08, 1.0, 0.16, f0 + 0.11, 1.07, F - 0.08); L.box(f1 - 0.11, 1.0, 0.16, f1 - 0.08, 1.07, F - 0.08);
    g.mat('wood', shadeHex(S.deep, 0.9));
    L.box(f0 + 0.08, 2.55, F - 0.12, f1 - 0.08, 2.6, F - 0.07); L.box(f0 + 0.08, 2.55, 0.16, f1 - 0.08, 2.6, 0.21);
    L.box(f0 + 0.08, 2.55, 0.16, f0 + 0.13, 2.6, F - 0.08); L.box(f1 - 0.13, 2.55, 0.16, f1 - 0.08, 2.6, F - 0.08);
  });
  s.deco(() => {
    const qf = F - 0.12;
    for (const sd of [-1, 1]) {
      const a0 = cx + sd * 2.5, a1 = sd < 0 ? f0 + 0.5 : f1 - 0.5; if (Math.abs(a1 - a0) < 1.2) continue;
      const b0 = sd > 0 ? Math.max(a0, bp + 0.8) : a0; if (Math.abs(a1 - b0) < 1.0) continue;
      g.mat('felt', S.felt[sd > 0 ? 3 : 1]); L.sheet([Math.min(b0, a1), 2.5, qf], [Math.max(b0, a1), 2.5, qf], [Math.max(b0, a1), 1.1, qf - 0.02], [Math.min(b0, a1), 1.1, qf - 0.02], { nu: 4, nv: 3, ripple: 0.02, rippleN: 5 });
    }
  });
  L.lamp('globe', f0 + fw * 0.28, 2.75, F * 0.5, { r: 0.2, drop: 0.5, clip: clipFoy, K: 2700, power: 1.1 });
  L.lamp('globe', f1 - fw * 0.28, 2.75, F * 0.5, { r: 0.2, drop: 0.5, clip: clipFoy, K: 2700, power: 1.1 });
  L.glowBox(f0, 0, 0, f1, H1, F, { sky: '#ffdcae', ground: S.rose, power: 0.3 });
  await T();

  // the cloak room: a counter in the wide hatch, rails of coats behind, a board of brass tickets
  L.prop('counter', cloakWall - toF * 0.45, 0, 3.0, toF * Math.PI / 2, { w: 3.4, d: 0.6, h: 0.95, body: S.deep, top: '#8a6240' }, { noSpots: true });
  L.spot('counter', cloakWall - toF * 1.15, 0, 3.0, toF * Math.PI / 2, { tags: ['keeper', 'teadance'] });
  L.spot('customer', cloakWall + toF * 0.75, 0, 2.4, -toF * Math.PI / 2, { tags: ['teadance'] }); L.spot('customer', cloakWall + toF * 0.75, 0, 3.7, -toF * Math.PI / 2, { tags: ['teadance'] });
  await T();
  let k = 0;
  for (let d = 2.2; d < Math.abs(cl1 - cl0) - 0.5; d += 1.5) { L.prop('lots-baths.dance-coats', cloakWall - toF * d, 0, F * 0.5 - 0.2, Math.PI / 2, { w: F - 2.4, n: 12, seed: (seed + k++) % 7 }); if (k > 2) break; }
  await T();
  s.detail(() => {
    // the ticket board on the counter's end wall: rows of brass discs on hooks, a few gone
    const tq = 0.2, pc = cloakWall - toF * 1.6, rt = new Rng(seed ^ 77);
    g.mat('wood', '#4a3220'); L.box(pc - 0.6, 1.2, tq, pc + 0.6, 2.1, tq + 0.04, { bevel: 0.01 });
    g.mat('cast', S.gilt, { rough: -0.2 });
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { if (rt.chance(0.3)) continue; const p = pc - 0.5 + i * 0.143, y = 1.32 + j * 0.2; L.box(p - 0.035, y - 0.035, tq + 0.04, p + 0.035, y + 0.035, tq + 0.05, { bevel: 0.01 }); }
    // on the counter: a tray of tickets, a brush for lint, a lidded cup
    const kp = cloakWall - toF * 0.45;
    g.mat('wood', '#8a6240'); L.box(kp - 0.15, 0.95, 2.0, kp + 0.15, 0.98, 2.4, { bevel: 0.006 });
    g.mat('paper', '#f1e8d4'); L.box(kp - 0.12, 0.98, 2.05, kp + 0.12, 0.99, 2.35);
  });
  L.prop('cup', cloakWall - toF * 0.4, 0.95, 4.1, 0, { glaze: S.cream, lid: S.accent }, { noCollide: true });
  await T();
  L.sign({ kind: 'plate', text: 'CLOAKS' }, cloakWall + toF * 0.1, 2.55, 3.0, [toF, 0], { w: 0.46, h: 0.13 });
  L.lamp('globe', (cl0 + cl1) / 2, 2.8, F * 0.5, { r: 0.16, drop: 0.45, clip: clipCl, K: 2800, power: 0.9 });
  L.glowBox(cl0, 0, 0, cl1, H1, F, { sky: '#ffdcae', ground: '#9a6a42', power: 0.26 });
  await T();

  // the tea room: a counter with the urn and lidded cups in rows, shelves of cups, little tables by the windows
  const tw = te1 - te0, tcw = Math.min(3.6, tw - pa - 3.6), tcc = teaWall + teaOut * (0.9 + tcw / 2), tq = F - 1.25;
  L.prop('counter', tcc, 0, tq, Math.PI, { w: tcw, d: 0.6, h: 0.92, body: S.accent, top: '#7a5233' }, { noSpots: true });
  L.prop('baths.urn', tcc - teaOut * (tcw / 2 - 0.35), 0.92, tq + 0.05, 0, {});
  await T();
  const cupc = [S.cream, '#d9cfb8', S.rose, S.accent, '#e8d9b8', S.gilt];
  for (let i = 0; i < Math.floor((tcw - 1.0) / 0.26); i++) for (let j = 0; j < 1; j++) L.prop('cup', tcc + teaOut * (tcw / 2 - 0.25) - teaOut * i * 0.26, 0.92, tq - 0.12 + j * 0.2, 0, { glaze: cupc[(i + j) % 6], lid: shadeHex(cupc[(i + j + 2) % 6], 0.85) }, { noCollide: true });
  L.spot('work', tcc, 0, F - 0.5, Math.PI, { tags: ['serve', 'teadance'] });
  for (const dp of [-0.8, 0.8]) L.spot('customer', tcc + dp, 0, tq - 0.9, 0, { tags: ['teadance', 'tea'] });
  s.furniture(() => {
    g.mat('wood', '#5a3d28');
    for (const y of [1.45, 1.85]) L.box(tcc - tcw / 2, y, F - 0.36, tcc + tcw / 2, y + 0.03, F - 0.08, { bevel: 0.006 });
  });
  for (let i = 0; i < Math.floor(tcw / 0.42); i++) for (const y of [1.48, 1.88]) L.prop('cup', tcc - tcw / 2 + 0.2 + i * 0.42, y, F - 0.22, 0, { glaze: cupc[(i + (y > 1.6 ? 3 : 0)) % 6], lid: shadeHex(cupc[(i + 4) % 6], 0.9) }, { noCollide: true });
  await T();
  await T();
  const teaSeats = [];
  for (const q of [1.9, 4.0]) {
    for (let p = te0 + 1.5; p < te1 - 1.3; p += 2.5) {
      if (q > 3 && Math.abs(p - tcc) < tcw / 2 + 1.0) continue;
      if (Math.abs(p - pTeaDoor) < 1.3 && q > 3) continue;
      L.prop('lots-baths.dance-table', p, 0, q, r.f(0, 3), { cloth: S.cream, cup: S.cream, lid: pickBy(p * 7 + q, 1, [S.accent, S.rose, S.gilt]) });
      for (const sd of [-1, 1]) { L.prop('lots-baths.dance-chair', p + sd * 0.55, 0, q, -sd * Math.PI / 2, { wood: '#2a1c14', seat: S.seat, gilt: S.gilt }, { spot: { tags: ['teadance', 'tea'] } }); teaSeats.push([p + sd * 0.55, q, -sd * Math.PI / 2]); }
    }
    await T();
  }
  L.prop('baths.fernpot', teaOut > 0 ? te1 - 0.6 : te0 + 0.6, 0, F - 0.6, 0, { pot: S.rose, size: 1.2 });
  L.prop('baths.fernpot', teaOut > 0 ? te1 - 0.6 : te0 + 0.6, 0, 0.6, 0, { pot: S.accent, size: 0.9 });
  {
    // a dresser of odd cups and pots on the far end wall, felt either side of it
    const pe = teaOut > 0 ? te1 - 0.36 : te0 + 0.36, dw = Math.min(2.6, F - 3.4), aIn = -teaOut * Math.PI / 2;
    L.prop('shelving', pe, 0, F * 0.5, aIn, { w: dw, h: 2.1, d: 0.36, shelves: 4, wood: '#5a3d28' });
    for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) {
      const q = F * 0.5 - dw / 2 + 0.25 + i * (dw - 0.5) / 5, y = 0.08 + (j + 1) * (2.1 - 0.11) / 4 + 0.025;
      if ((i + j) % 3 === 2) L.prop('baths.teapot', pe - teaOut * 0.04, y, q, 0.4 * i, { glaze: S.felt[(i + j) % 4] }, { noCollide: true });
      else L.prop('cup', pe - teaOut * 0.04, y, q, 0, { glaze: cupc[(i + j * 2) % 6], lid: shadeHex(cupc[(i + 3) % 6], 0.85) }, { noCollide: true });
    }
    s.deco(() => {
      const pw = pe + teaOut * 0.3 - teaOut * 0.12;
      for (const sd of [-1, 1]) { const qa = F * 0.5 + sd * (dw / 2 + 0.2), qb = F * 0.5 + sd * (F / 2 - 0.5); g.mat('felt', S.felt[sd > 0 ? 0 : 2]); L.sheet([pw, 3.0, Math.min(qa, qb)], [pw, 3.0, Math.max(qa, qb)], [pw, 0.9, Math.max(qa, qb)], [pw, 0.9, Math.min(qa, qb)], { nu: 3, nv: 4, ripple: 0.025, rippleN: 4 }); }
    });
  }
  L.lamp('globe', te0 + tw * 0.3, 2.75, F * 0.45, { r: 0.18, drop: 0.5, clip: clipTea, K: 2650, power: 1.0 });
  L.lamp('globe', te0 + tw * 0.7, 2.75, F * 0.45, { r: 0.18, drop: 0.5, clip: clipTea, K: 2650, power: 1.0 });
  L.glowBox(te0, 0, 0, te1, H1, F, { sky: '#ffd9a8', ground: S.rose, power: 0.3 });
  s.deco(() => { g.mat('wood', shadeHex(S.deep, 0.9)); for (let p = te0 + 1.2; p < te1 - 0.6; p += 2.5) L.box(p - 0.08, H1 - 0.18, 0.2, p + 0.08, H1, F - 0.1, { bevel: 0.01 }); });
  await T();

  // ================================================================================================
  // band 2: the hall. Aisles under a low ceiling behind an arcade, a tall middle, the sprung floor, the band shell
  // ================================================================================================
  L.floor(0, F, A, D, 0, 'carpet', S.carpet); L.floor(W - A, F, W, D, 0, 'carpet', S.carpet);
  L.floor(A, F, W - A, D, 0, 'planks', S.floor);
  L.ceiling(0, F, A, D, 3.4, 'paint', S.cream); L.ceiling(W - A, F, W, D, 3.4, 'paint', S.cream);
  L.ceiling(A, F, W - A, D, HH, 'paint', shadeHex(S.deep, 1.15));
  const sideWall = { tint: S.cream, mat: 'plaster', dado: { h: 0.75, mat: 'wood', tint: shadeHex(S.deep, 1.1) }, skirt: S.deep2 };
  L.wallQ(0.08, 0.16, D, 0, 3.4, sideWall); L.wallQ(W - 0.08, 0.16, D, 0, 3.4, sideWall);
  L.wallP(D - 0.08, 0, W, 0, 7.0, { tint: S.cream, mat: 'plaster', dado: { h: 0.75, mat: 'wood', tint: shadeHex(S.deep, 1.1) }, skirt: S.deep2 });
  L.wallQ(A, F, D - 0.08, 3.4, HH - 3.4, { tint: S.cream, mat: 'plaster', skirt: false });
  L.wallQ(W - A, F, D - 0.08, 3.4, HH - 3.4, { tint: S.cream, mat: 'plaster', skirt: false });
  await T();
  // the arcade: columns and their lintels, a gilt line; glowing panels of frosted glass high in the walls (lamps, not windows)
  const nb = Math.max(3, Math.round((D - F) / 4.2)), bay = (D - F) / nb;
  for (const pc of [A, W - A]) {
    for (let i = 1; i < nb; i++) column(s, L.P(pc, F + i * bay)[0], 0, L.P(pc, F + i * bay)[1], 3.15, { r: 0.17, mat: 'stone', tint: S.cream });
    s.structure(() => {
      g.mat('wood', shadeHex(S.deep, 1.1)); L.box(pc - 0.17, 3.12, F + 0.1, pc + 0.17, 3.42, D - 0.1, { bevel: 0.015 });
      g.mat('cast', S.gilt, { rough: -0.2 }); L.box(pc - 0.18, 3.1, F + 0.1, pc + 0.18, 3.14, D - 0.1);
      const sd = pc < cx ? 1 : -1;
      for (let i = 0; i < nb; i++) {
        const q0 = F + i * bay + 0.7, q1 = F + (i + 1) * bay - 0.7;
        g.mat('diffuser', i % 2 ? '#f6dfb4' : '#f2d4a0', { emissive: 1.2, lamp: true }); L.box(pc + sd * 0.08, 4.3, q0, pc + sd * 0.1, 5.9, q1);
        g.mat('cast', S.gilt); L.box(pc + sd * 0.08, 4.22, q0 - 0.08, pc + sd * 0.13, 4.3, q1 + 0.08); L.box(pc + sd * 0.08, 5.9, q0 - 0.08, pc + sd * 0.13, 5.98, q1 + 0.08);
        for (let u = 1; u < 4; u++) L.box(pc + sd * 0.1, 4.3, q0 + u * (q1 - q0) / 4 - 0.015, pc + sd * 0.13, 5.9, q0 + u * (q1 - q0) / 4 + 0.015);
      }
      g.mat('tile', S.rose); L.box(pc + sd * 0.08 - 0.02, 6.35, F + 0.1, pc + sd * 0.11, 6.45, D - 0.1);
    });
    await T();
  }
  // the nave ceiling: deep beams across, a gilt line along each
  s.deco(() => {
    for (let i = 0; i <= nb; i++) { const q = F + i * bay; g.mat('wood', shadeHex(S.deep, 0.8)); L.box(A, HH - 0.32, Math.max(F + 0.1, q - 0.14), W - A, HH, Math.min(D - 0.1, q + 0.14), { bevel: 0.02 }); g.mat('cast', S.gilt); L.box(A, HH - 0.34, Math.max(F + 0.1, q - 0.02), W - A, HH - 0.32, Math.min(D - 0.1, q + 0.02)); }
  });
  await T();

  // the band shell: a quarter dome of ribs on a low stage at the back, its inside striped like a scallop
  const R = clamp((W - 2 * A) / 2 - 2.6, 3.4, 6.0), ys = 0.45, Hs = Math.min(R * 1.18, 6.45 - ys), Qc = D - 0.28 - R;
  {
    // the stage: slices of a rounded apron in front of the dome's footing
    const n = 22, pw = (2 * R + 1.0) / n;
    for (let i = 0; i < n; i++) {
      const p0 = cx - R - 0.5 + i * pw, p1 = p0 + pw, u = (p0 + p1) / 2 - cx, ext = Math.sqrt(Math.max(0, (R + 0.5) * (R + 0.5) - u * u)) * 0.32;
      L.block(p0, 0, Qc - ext, p1, ys, D - 0.16, 'planks', shadeHex(S.floor, 0.8), { cast: false });
    }
    s.structure(() => {
      g.mat('cast', S.gilt, { rough: -0.2 });
      for (let i = 0; i < n; i++) { const p0 = cx - R - 0.5 + i * pw, p1 = p0 + pw, u = (p0 + p1) / 2 - cx, ext = Math.sqrt(Math.max(0, (R + 0.5) * (R + 0.5) - u * u)) * 0.32; L.box(p0, ys - 0.06, Qc - ext - 0.02, p1, ys, Qc - ext + 0.03); g.mat('paint', S.deep); L.box(p0, 0, Qc - ext - 0.012, p1, ys - 0.06, Qc - ext); g.mat('cast', S.gilt, { rough: -0.2 }); }
    });
  }
  await T();
  const M = 7, N = 16, shellP = (ph, th) => L.pt(cx + R * Math.cos(ph) * Math.cos(th), ys + Hs * Math.sin(th), Qc + R * Math.sin(ph) * Math.cos(th));
  await T();
  const C0 = L.pt(cx, ys + Hs * 0.3, Qc);
  s.structure(() => {
    for (let k = 0; k < N; k++) {
      const a0 = Math.PI * k / N, a1 = Math.PI * (k + 1) / N;
      for (let j = 0; j < M; j++) {
        const t0 = Math.PI / 2 * j / M, t1 = Math.PI / 2 * (j + 1) / M;
        const a = shellP(a0, t0), b = shellP(a1, t0), c = shellP(a1, t1), d = shellP(a0, t1);
        const m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
        g.mat('paint', k % 2 ? S.cream : mixHex(S.rose, S.cream, 0.35 + 0.08 * j), { emissive: 0.18 + j * 0.03, lamp: true });
        quadN(g, a, b, c, d, [C0[0] - m[0], C0[1] - m[1], C0[2] - m[2]]);
        g.mat('paint', S.deep2); quadN(g, a, b, c, d, [m[0] - C0[0], m[1] - C0[1], m[2] - C0[2]]);
      }
    }
  });
  await T();
  s.furniture(() => {
    g.mat('cast', S.gilt, { rough: -0.25 });
    for (let k = 0; k <= N; k++) { const pts = []; for (let j = 0; j <= M; j++) { const a = Math.PI * k / N, t = Math.PI / 2 * j / M; const c = [cx + (R - 0.05) * Math.cos(a) * Math.cos(t), ys + (Hs - 0.05) * Math.sin(t), Qc + (R - 0.05) * Math.sin(a) * Math.cos(t)]; pts.push(c); } L.tube(pts, k === 0 || k === N ? 0.07 : 0.035, { segs: 6 }); }
    // the rim of the opening: a gilt arch carrying a row of little lamps
    const rim = []; for (let i = 0; i <= 24; i++) { const t = Math.PI * i / 24; rim.push([cx + (R + 0.08) * Math.cos(t), ys + (Hs + 0.08) * Math.sin(t), Qc - 0.04]); }
    L.tube(rim, 0.07, { segs: 8 });
  });
  s.deco(() => {
    g.mat('diffuser', '#ffe6b8', { emissive: 5, lamp: true });
    for (let i = 1; i < 24; i++) { const t = Math.PI * i / 24; L.ball(cx + (R + 0.08) * Math.cos(t), ys + (Hs + 0.08) * Math.sin(t), Qc - 0.13, 0.045, 0.045, 0.045, { segs: 6, rings: 4 }); }
  });
  L.light({ at: [cx, ys + 2.2, Qc + R * 0.45], color: '#ffd8a8', power: 3.2, range: 8, clip: clipHall, lamp: true, radius: 0.6 });
  L.glow(cx, ys + 1.6, Qc - 0.2, [0, -1], { color: '#ffe0b8', size: R * 1.7, strength: 0.05, follow: 'lamps' });
  // the band's places, chairs and stands
  const perf = [['flute', -0.55], ['sing', -0.2], ['drum', 0.2], ['flute', 0.55]];
  for (const pf of perf) {
    const p = cx + pf[1] * R * 1.3, q = Qc + 0.6 + Math.abs(pf[1]) * 0.4;
    L.spot('perform', p, ys, q, Math.PI + pf[1] * 0.5, { tags: [pf[0], 'band'] });
    if (pf[0] === 'flute') L.prop('lots-baths.dance-stand', p - 0.05, ys, q - 0.6, Math.PI - pf[1] * 0.3, {});
    if (pf[0] === 'drum') s.furniture(() => { g.mat('wood', '#8a5634'); L.lathe(p + 0.45, q + 0.1, [[0, ys], [0.18, ys], [0.2, ys + 0.05], [0.21, ys + 0.5], [0.19, ys + 0.52], [0, ys + 0.52]], { segs: 14 }); g.mat('weave', '#efe2c6'); L.lathe(p + 0.45, q + 0.1, [[0.19, ys + 0.52], [0, ys + 0.525]], { segs: 14, capBottom: false }); });
  }
  await T();

  // the sprung floor's inlay: a dark border, a gilt line, a rosette in the middle
  const fp0 = A + 1.9, fp1 = W - A - 1.9, fq0 = F + 3.6, fq1 = Qc - (R + 0.5) * 0.32 - 1.4, fcq = (fq0 + fq1) / 2;
  s.structure(() => {
    const dk = shadeHex(S.floor, 0.5);
    const band = (ins, wd, mat, tint) => { g.mat(mat, tint); L.box(fp0 + ins, 0.002, fq0 + ins, fp1 - ins, 0.0045, fq0 + ins + wd, { faces: 'Y' }); L.box(fp0 + ins, 0.002, fq1 - ins - wd, fp1 - ins, 0.0045, fq1 - ins, { faces: 'Y' }); L.box(fp0 + ins, 0.002, fq0 + ins + wd, fp0 + ins + wd, 0.0045, fq1 - ins - wd, { faces: 'Y' }); L.box(fp1 - ins - wd, 0.002, fq0 + ins + wd, fp1 - ins, 0.0045, fq1 - ins - wd, { faces: 'Y' }); };
    band(0, 0.22, 'wood', dk); band(0.36, 0.05, 'cast', S.gilt); band(0.5, 0.12, 'wood', S.deep);
    const c = L.pt(cx, 0, fcq), up = [0, 1, 0];
    const ring = (r0, r1, col, n) => { g.mat('wood', col); for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; quadN(g, [c[0] + Math.cos(a0) * r1, 0.005, c[2] + Math.sin(a0) * r1], [c[0] + Math.cos(a1) * r1, 0.005, c[2] + Math.sin(a1) * r1], [c[0] + Math.cos(a1) * r0, 0.005, c[2] + Math.sin(a1) * r0], [c[0] + Math.cos(a0) * r0, 0.005, c[2] + Math.sin(a0) * r0], up); } };
    ring(1.55, 1.75, dk, 48); ring(1.42, 1.48, S.gilt, 48);
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, b = a + Math.PI / 12, e = a - Math.PI / 12, R1 = i % 2 ? 1.0 : 1.38; g.mat('wood', i % 2 ? S.deep : dk); quadN(g, [c[0], 0.006, c[2]], [c[0] + Math.cos(e) * 0.32, 0.006, c[2] + Math.sin(e) * 0.32], [c[0] + Math.cos(a) * R1, 0.006, c[2] + Math.sin(a) * R1], [c[0] + Math.cos(b) * 0.32, 0.006, c[2] + Math.sin(b) * 0.32], up); }
    ring(0.0, 0.22, S.gilt, 20);
  });
  await T();

  // felt: panels along the aisle walls, tall hangings either side of the shell, baffles across the high ceiling
  const panels = [];
  for (let q = F + 0.6; q + 2.3 < D - 0.3; q += 3.3) panels.push(q);
  s.deco(() => {
    let i = 0;
    for (const q of panels) for (const sd of [0, 1]) {
      const p = sd ? W - 0.2 : 0.2; g.mat('felt', S.felt[(i++) % S.felt.length]);
      L.sheet([p, 3.0, q], [p, 3.0, q + 2.3], [p + (sd ? -0.02 : 0.02), 0.7, q + 2.3], [p + (sd ? -0.02 : 0.02), 0.7, q], { nu: 5, nv: 4, ripple: 0.025, rippleN: 6 });
    }
    for (const sd of [-1, 1]) {
      const pa0 = cx + sd * (R + 0.7), pb0 = sd < 0 ? A + 0.3 : W - A - 0.3, n = Math.max(1, Math.round(Math.abs(pb0 - pa0) / 2.4));
      for (let j = 0; j < n; j++) { const a0 = pa0 + (pb0 - pa0) * j / n, a1 = pa0 + (pb0 - pa0) * (j + 1) / n - (pb0 > pa0 ? 0.12 : -0.12); g.mat('felt', S.felt[(j + (sd > 0 ? 2 : 0)) % S.felt.length]); L.sheet([a0, 6.5, D - 0.2], [a1, 6.5, D - 0.2], [a1, 0.6, D - 0.22], [a0, 0.6, D - 0.22], { nu: 4, nv: 6, ripple: 0.03, rippleN: 6 }); }
      g.mat('cast', S.gilt); L.tube([[pa0, 6.55, D - 0.18], [pb0, 6.55, D - 0.18]], 0.018, { segs: 5 });
      const fa = cx + sd * 3.0, fb = sd < 0 ? A + 0.3 : W - A - 0.3, fn = Math.max(1, Math.round(Math.abs(fb - fa) / 2.6));
      for (let j = 0; j < fn; j++) { const a0 = fa + (fb - fa) * j / fn, a1 = fa + (fb - fa) * (j + 1) / fn - (fb > fa ? 0.12 : -0.12); g.mat('felt', S.felt[(j + (sd > 0 ? 1 : 3)) % S.felt.length]); L.sheet([a1, 6.4, F + 0.2], [a0, 6.4, F + 0.2], [a0, 1.2, F + 0.22], [a1, 1.2, F + 0.22], { nu: 4, nv: 6, ripple: 0.03, rippleN: 6 }); }
      g.mat('cast', S.gilt); L.tube([[fa, 6.45, F + 0.18], [fb, 6.45, F + 0.18]], 0.018, { segs: 5 });
    }
  });
  await T();
  s.deco(() => {
    for (let i = 0; i < 3; i++) { const q = F + (D - F) * (0.2 + i * 0.27); g.mat('felt', S.felt[(i + 1) % S.felt.length]); L.sheet([A + 0.3, 6.6, q], [W - A - 0.3, 6.6, q], [W - A - 0.3, 6.2, q], [A + 0.3, 6.2, q], { nu: 10, nv: 2, sag: 0.18 }); }
  });
  await T();

  // tables round the edge: a row along the floor's near side, a row down each aisle; chairs along the walls
  const seats = [], tableAt = [];
  for (let p = A + 1.4; p < W - A - 1.2; p += 2.6) { if (Math.abs(p - cx) < 2.4) continue; tableAt.push([p, F + 2.2]); }
  for (let q = F + 1.9; q < D - 1.2; q += 3.0) { tableAt.push([A * 0.5, q]); tableAt.push([W - A * 0.5, q]); }
  let ti = 0;
  for (const t of tableAt) {
    L.prop('lots-baths.dance-table', t[0], 0, t[1], r.f(0, 3), { cloth: pickBy(t[0] * 3 + t[1], 2, [S.cream, '#e9dcc0', mixHex(S.cream, S.rose, 0.3)]), cup: S.cream, lid: pickBy(t[0] * 5 + t[1], 3, [S.accent, S.rose, S.gilt, S.deep]) });
    for (const sd of [-1, 1]) { const p = t[0] + sd * 0.56, a = -sd * Math.PI / 2; L.prop('lots-baths.dance-chair', p, 0, t[1], a, { wood: '#2a1c14', seat: S.seat, gilt: S.gilt }, { spot: { tags: ['teadance', 'tea'] } }); seats.push([p, t[1], a]); }
    if (++ti % 4 === 0) await T();
  }
  for (const sd of [0, 1]) {
    const p = sd ? W - 0.42 : 0.42, a = sd ? -Math.PI / 2 : Math.PI / 2;
    for (let q = F + 0.75, n = 0; q < D - 0.6; q += (++n % 3 === 0 ? 1.5 : 0.62)) { L.prop('lots-baths.dance-chair', p, 0, q, a, { wood: '#3a2a1e', seat: S.felt[sd ? 2 : 0], gilt: S.gilt }, { spot: { tags: ['teadance', 'watch'] } }); if (n % 12 === 0) await T(); }
    await T();
  }
  // ferns at the shell's feet and by the arch
  for (const sd of [-1, 1]) { L.prop('baths.fernpot', cx + sd * (R + 1.0), 0, D - 0.7, 0, { pot: S.gilt, size: 1.3 }); L.prop('baths.fernpot', cx + sd * 2.6, 0, F + 0.6, 0, { pot: S.rose, size: 1.0 }); }
  await T();

  // light: coloured lanterns on long drops over the floor's edges, one big globe in the middle, sconces in the aisles
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
    const p = cx + sd * (W - 2 * A) * 0.3, q = fq0 + (fq1 - fq0) * (0.1 + i * 0.4);
    L.lamp('lantern', p, 4.5, q, { tint: LANTERNS[(i + (sd > 0 ? 3 : 0) + seed) % LANTERNS.length], drop: HH - 4.5 - 0.23, r: 0.32, hh: 0.46, clip: clipHall, K: 2600, power: 1.3, range: 9 });
  }
  // the middle: a gilt ring hung on three chains carrying a crown of small globes, one lamp inside
  {
    const yc = 5.2, rc = 0.85, cq = fcq;
    s.furniture(() => {
      g.mat('cast', S.gilt, { rough: -0.2 });
      const ring = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; ring.push([cx + Math.cos(a) * rc, yc, cq + Math.sin(a) * rc]); } L.tube(ring, 0.035, { segs: 6 });
      const ring2 = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 2; ring2.push([cx + Math.cos(a) * rc * 0.5, yc - 0.35, cq + Math.sin(a) * rc * 0.5]); } L.tube(ring2, 0.025, { segs: 6 });
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; L.tube([[cx + Math.cos(a) * rc, yc, cq + Math.sin(a) * rc], [cx, HH, cq]], 0.008, { segs: 3 }); L.tube([[cx + Math.cos(a) * rc, yc, cq + Math.sin(a) * rc], [cx + Math.cos(a) * rc * 0.5, yc - 0.35, cq + Math.sin(a) * rc * 0.5]], 0.012, { segs: 4 }); }
    });
    s.deco(() => {
      g.mat('diffuser', '#ffe2b0', { emissive: 4.5, lamp: true });
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; L.ball(cx + Math.cos(a) * rc, yc + 0.1, cq + Math.sin(a) * rc, 0.075, 0.09, 0.075, { segs: 8, rings: 5 }); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; L.ball(cx + Math.cos(a) * rc * 0.5, yc - 0.27, cq + Math.sin(a) * rc * 0.5, 0.06, 0.075, 0.06, { segs: 8, rings: 5 }); }
    });
    L.light({ at: [cx, yc - 0.1, cq], color: '#ffd9a0', power: 14, range: 16, clip: clipHall, lamp: true, radius: 0.8, shadow: true });
  }
  for (const sd of [0, 1]) for (const k2 of [0.3, 0.72]) {
    let q = F + (D - F) * k2; for (const pq of panels) if (q > pq - 0.3 && q < pq + 2.6) q = pq + 2.8;
    L.lamp('sconce', sd ? W - 0.12 : 0.12, 2.35, q, { face: [sd ? -1 : 1, 0], clip: sd ? clipAisleR : clipAisleL, K: 2700, power: 0.8 });
  }
  await T();
  L.glowBox(0, -0.2, F, W, HH, D, { sky: '#ffd9a8', ground: S.floor, power: 0.28 });
  L.glowBox(A, 3.4, F, W - A, HH, D, { sky: '#ffcf96', ground: '#ffd9a8', power: 0.14 });
  await T();

  // ================================================================================================
  // people
  // ================================================================================================
  const dspots = [];
  {
    const fwid = fp1 - fp0 - 2.4, fdep = fq1 - fq0 - 2.4;
    const cols = clamp(Math.floor(fwid / 3.0) + 1, 3, 6), rows = clamp(Math.floor(fdep / 3.0) + 1, 2, 4);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (dspots.length >= 20) break;
      const p = fp0 + 1.2 + (cols > 1 ? i * fwid / (cols - 1) : fwid / 2), q = fq0 + 1.2 + (rows > 1 ? j * fdep / (rows - 1) : fdep / 2);
      if (Math.abs(p - cx) < 1.2 && Math.abs(q - fcq) < 1.2) continue;
      const a = r.f(-Math.PI, Math.PI); L.spot('stand', p, 0, q, a, { tags: ['dance'] }); dspots.push([p, q]);
    }
  }
  chatRing(L, pa, F + (D - F) * 0.55, 2, 0.5, ['teadance']); chatRing(L, W - pa, F + (D - F) * 0.4, 3, 0.6, ['teadance']);
  L.spot('work', cx + 3.0, 0, fq1 + 0.6, Math.PI, { tags: ['sweep', 'teadance'] });
  // walkways: in at the door, through the foyer and the arch, round the floor and down both aisles
  L.path([[cx, -0.7], [cx, 1.2], [cx, F * 0.5], [cx, F - 0.6], [cx, F + 1.0]], { width: 1.6 });
  L.path([[cx, F + 1.0], [cx + 2.0, F + 1.0], [W - pa, F + 1.0], [W - pa, (F + D) / 2], [W - pa, D - 1.0]], { width: 1.1 });
  L.path([[cx, F + 1.0], [cx - 2.0, F + 1.0], [pa, F + 1.0], [pa, (F + D) / 2], [pa, D - 1.0]], { width: 1.1 });
  L.path([[cx - 2.0, F + 1.0], [fp0 - 0.4, fq0 - 0.4], [fp0 - 0.4, fq1 + 0.3], [cx - R - 0.9, fq1 + 0.3]], { width: 1.0 });
  L.path([[cx + 2.0, F + 1.0], [fp1 + 0.4, fq0 - 0.4], [fp1 + 0.4, fq1 + 0.3], [cx + R + 0.9, fq1 + 0.3]], { width: 1.0 });
  L.path([[cx, F + 1.0], [cx, fq0 + 0.4], [cx, fcq - 2.0]], { width: 1.2 });
  L.path([[cx, F * 0.5], [cloakWall + toF * 0.8, 3.0]], { width: 1.1 });
  L.path([[cx, F - 0.6], [cloakWall + toF * 0.7, F - 1.2], [cloakWall - toF * 0.8, F - 1.2], [cloakWall - toF * 1.2, 3.0]], { width: 0.9 });
  L.path([[cx, F * 0.5], [teaWall + teaOut * 1.0, 3.3], [tcc, F - 2.1], [pTeaDoor, F - 1.1], [pTeaDoor, F + 1.0]], { width: 1.1 });
  L.path([[tcc, F - 2.1], [tcc + teaOut * (tcw / 2 + 0.5), F - 0.5], [tcc, F - 0.5]], { width: 0.9 });
  L.path([[teaWall + teaOut * 1.0, 3.3], [(te0 + te1) / 2, 3.0]], { width: 1.0 });
  await T();

  // ================================================================================================
  // things to do
  // ================================================================================================
  const server = pickBy(seed, 6, ['Ama', 'Teodor', 'Ilse', 'Benno', 'Rukmini', 'Oskar', 'Wren', 'Celestine']);
  const keeper = pickBy(seed, 7, ['Halvard', 'Noor', 'Magda', 'Piet', 'Saoirse', 'Ugo', 'Yevgenia']);
  const coatKey = 'danceCoat:' + lot.id, seatKey = 'dance:' + lot.id, ticket = 10 + (seed % 89);
  // tea at the counter
  L.interact({ p: tcc, y: 1.1, q: tq - 0.9, radius: 1.9, prompt: 'Buy a lidded cup of tea · 0.15 kWh', async onUse(gm) {
    if (gm.wallet && !gm.wallet.spend(0.15, 'Tea')) { await say(gm, server, [pickBy(seed, 8, ['Short of fifteen hundredths. Sit down anyway; someone will pour you one.', 'Your wallet says no. The pot on table four is anybody’s.', 'Then have it on the house. A guest does not dance dry.', 'Never mind the kays. Bring the cup back with the lid on.'])]); return; }
    L.sfx(gm, 'pour', tcc, 1.1, tq); L.sfx(gm, 'lid-down', tcc, 1.0, tq, { delay: 0.9 });
    await say(gm, server, [pickBy(seed, 9, [
      'Lid on between sips. This air takes the heat out of a cup four times faster than you would think.',
      'Pour slowly up here. Pour toward the middle and it bends spinward and finds your sleeve.',
      'Two leaves and a bud, from the Keel racks. Fifteen hundredths, and the lid is older than me.',
      'At ' + gw + ' of a g the tea climbs the spout if you tip it fast. Little tips.',
      'There you are. If you dance, leave it on the table: nobody here would drink a stranger’s tea.'])]);
  } });
  // the cloak room
  L.interact({ p: cloakWall + toF * 0.8, y: 1.1, q: 3.0, radius: 1.8, prompt: (gm) => gm.flags[coatKey] ? 'Collect your coat · ticket ' + ticket : 'Leave your coat at the cloak room', async onUse(gm) {
    if (!gm.flags[coatKey]) {
      gm.flags[coatKey] = true; L.sfx(gm, 'cup', cloakWall, 1.0, 3.0, { vol: 0.4 });
      await say(gm, keeper, [pickBy(seed, 10, [
        'Number ' + ticket + '. Brass, so you will not lose it. It weighs more than your coat does up here.',
        'Number ' + ticket + '. If your hems are weighted for the low decks I will not tell anybody.',
        'Ticket ' + ticket + '. Spare shoes go under the rail. Half of them are dancing shoes nobody came back for.',
        'There. Number ' + ticket + '. A coat is a nuisance in a turn at ' + gw + ' g: it keeps going after you stop.'])]);
    } else {
      gm.flags[coatKey] = false;
      await say(gm, keeper, [pickBy(seed, 11, ['Number ' + ticket + '. Mind the step on the way out: the street is no heavier, it only feels it.', 'Here. I brushed the shoulder; somebody leaned on it.', 'Number ' + ticket + ', back on its hook. Come on a Thursday, the band is better.', 'Your coat. Did you dance. Good.'])]);
    }
  } });
  // the programme
  L.interact({ p: bp, y: 1.5, q: F - 0.75, radius: 1.5, prompt: 'Read the programme', onUse(gm) {
    say(gm, { name: NM[1], colour: '#FFD9A0' }, [dances.map((d, i) => d + ' at ' + times[i]).join('. ') + '.', pickBy(seed, 12, [
      'Under it in pencil: "Two lifts in the Long Lift only. We are not as young as the floor."',
      'A note pinned to the corner: "Spare shoes in the cloak room. Return them mended."',
      'At the bottom: "Guests welcome. Partners found. Tea under a lid, 0.15."',
      'Somebody has written beside the last dance: "and then home, slowly."'])]);
  } });
  // sit out a dance at the nearest table
  const sitNear = (gm) => {
    if (seatedAs(gm, seatKey) || (gm.player && gm.player.seat)) { if (gm.player) gm.player.stand(); return; }
    const w = L.where(gm); if (!w) return; let best = seats[0], bd = 1e9;
    for (const st of seats.concat(teaSeats)) { const view = st[1] > F ? Math.sin(st[2]) * (cx - st[0]) + Math.cos(st[2]) * (fcq - st[1]) : 1; const d = Math.hypot(st[0] - w[0], st[1] - w[1]) + (view > 0 ? 0 : 4); if (d < bd) { bd = d; best = st; } }
    sitPlayer(L, gm, best[0], 0.48, best[1], best[2], 0.68, seatKey, -0.04);
    if (gm.ui) gm.ui.subtitle(null, pickBy(seed + Math.round(best[1]), 13, [
      'You sit out the dance. Out on the floor a couple go up on the beat and come down most of a bar later.',
      'From here the whole floor turns slowly, like something in deep water.',
      'The chair is cushioned and nobody hurries you. Someone slides a lidded cup to your side of the table.',
      'A man of ninety lifts his partner a hand above the floor and simply waits for her to come back.']), 6);
  };
  const sitPts = [[pa, F + (D - F) * 0.3], [pa, F + (D - F) * 0.7], [W - pa, F + (D - F) * 0.3], [W - pa, F + (D - F) * 0.7], [A + 3.0, F + 2.2], [W - A - 3.0, F + 2.2], [(te0 + te1) / 2, 3.0]];
  for (const sp of sitPts) L.interact({ p: sp[0], y: 0.8, q: sp[1], radius: 2.4, prompt: (gm) => seatedAs(gm, seatKey) ? 'Get up' : 'Sit out a dance at a table', onUse: sitNear });
  // ask someone to dance
  const partner = pickBy(seed, 14, ['Imre, ninety-four', 'Halla, eighty-eight', 'Joaquim, ninety-one', 'Sunniva, a hundred and two', 'Teo, eighty-six', 'Marguerite, ninety-seven']);
  L.interact({ p: cx, y: 1.0, q: fq0 + 1.2, radius: 2.8, prompt: 'Ask someone to dance', async onUse(gm) {
    if (gm.player && gm.player.seat) gm.player.stand();
    gm.busy++;
    try {
      if (gm.ui) await gm.ui.say(partner, [pickBy(seed, 15, [
        'A guest. Good. Count four for the lift and three for the landing, and do not jump: at ' + gw + ' g a jump puts you among the lanterns.',
        'Gladly. Lead if you like, but let the floor do the turning. It is sprung, and up here it has more patience than we do.',
        'You will find the landing comes late. Do not chase it. Wait, and it comes to you.',
        'Hold on lightly. Everything goes up further than you meant it to here, and comes down a little spinward.'])]);
      if (gm.ui && gm.ui.fade) await gm.ui.fade(true, 0.6);
      if (gm.clock && gm.clock.skipTo) gm.clock.skipTo((gm.clock.hours + 1 / 3) % 24);
      L.sfx(gm, 'applause', cx, 1.5, fcq, { vol: 0.35 });
      if (gm.ui && gm.ui.fade) await gm.ui.fade(false, 0.8);
    } finally { gm.busy--; }
    note(gm, pickBy(seed, 16, [
      'Twenty minutes. A turn at ' + gw + ' g takes most of a bar: you go up, you wait, you come down a hand’s width spinward of where you meant to.',
      'Twenty minutes and three dances. Your partner never once hurried. You did, twice, and floated for it.',
      'The Long Lift: you lifted, and for a long breath nothing happened at all. Then the floor came gently back.',
      'Twenty minutes. Your legs say an hour. Up here the dancing is all in the waiting.']), 'gain');
  } });
  // the band
  L.interact({ p: cx, y: 1.2, q: fq1 + 0.4, radius: 2.0, prompt: 'Ask the band for a tune', onUse(gm) {
    say(gm, pickBy(seed, 17, ['The drummer', 'The singer', 'The older flute', 'The band']), [pickBy(seed, 18, [
      'We play slower up here. The dancers need the time to come down.',
      'The flute is longer than she is. In this air a short one squeaks.',
      'Ask for anything with a long bar. Nothing that wants a quick foot: there are no quick feet on this floor.',
      'Next is the Slow Round. It is always next. They like it.'])]);
  } });

  // overheard while you sit
  const OVER = [
    'At my age the floor does half the work. At this weight it does the other half too.',
    'Count four for the lift and three for the landing. The landing is always late up here.',
    'She came up from the Low decks for this. Says nobody has lifted her properly in sixty years.',
    'Lean into the turn and it carries you a hand’s width spinward. Everyone pretends that was the step.',
    'My knees were ninety-one this spring. Up here they think they are sixty.',
    'Lid on, please. Tea goes cold in no time in this air.',
    'Thursdays I dance with Imre. Sundays with whoever is still standing.',
    'Do not jump. Lift. A jump at half a g and you are up among the lanterns, waving.',
    'My granddaughter says it looks like dancing under water. I tell her water is heavier.',
    'The drummer is a hundred and four. He counts in his sleep.',
  ];
  let tNext = 6, oi = seed % OVER.length;
  s.every((dt, gm) => {
    if (!gm || !gm.ui || !seatedAs(gm, seatKey)) { tNext = Math.max(tNext, 5); return; }
    tNext -= dt; if (tNext > 0) return; tNext = 13 + (oi % 5) * 1.5;
    gm.ui.subtitle(pickBy(oi, 19, ['A woman at the next table', 'Someone behind you', 'An old man in a mended jacket', 'Two dancers going by']), OVER[oi++ % OVER.length], 6);
  });

  // the band: a slow tune of single notes from the shell, only while the player is here and the afternoon is on
  const bandAt = L.P(cx, Qc + R * 0.35), BEAT = 0.82 + (0.6 - info.g) * 0.8;
  const mel = []; { const rm = new Rng(seed ^ 0x7a11); let m = 2; for (let i = 0; i < 32; i++) { if (rm.chance(0.3)) { mel.push(-1); continue; } m = clamp(m + rm.i(-2, 2), 0, 7); mel.push(m); } }
  const CH = [[0, 2, 4], [3, 5, 0], [1, 3, 5], [0, 2, 4]];
  let bt = 0, bi = 0;
  s.every((dt, gm) => {
    if (!gm || !gm.audio || !gm.sfxAt || !gm.clock) return;
    const h = gm.clock.hours; if (h < 14 || h > 22.5 || !L.inside(gm, 0, 0, W, D)) { bt = 0.5; return; }
    bt -= dt; if (bt > 0) return; bt += BEAT; if (bt < -1) bt = BEAT;
    const k = bi++ % 32, b = k % 4, ch = CH[Math.floor(k / 8) % 4];
    if (b === 0) gm.sfxAt('drum-tap', s.frame, bandAt[0], 1.0, bandAt[1], { vol: 0.2, pitch: 0.75 });
    else if (b === 2) gm.sfxAt('drum-tap', s.frame, bandAt[0], 1.0, bandAt[1], { vol: 0.09, pitch: 1.05 });
    gm.sfxAt('pluck', s.frame, bandAt[0] + 0.8, 1.0, bandAt[1], { vol: 0.11, pitch: PENTA[ch[b % 3]] * 0.5 });
    const m = mel[k]; if (m >= 0) gm.sfxAt('flute-note', s.frame, bandAt[0] - 0.8, 1.3, bandAt[1], { vol: 0.13, pitch: PENTA[m] });
  });

  // sound and zones
  L.loop('murmur', cx, 1.2, (F + D) / 2, { vol: 0.32, radius: 24, param: 0.4 });
  L.loop('murmur', (te0 + te1) / 2, 1.2, F * 0.5, { vol: 0.14, radius: 9, param: 0.2 });
  const zb = (p0, q0, p1, q1, y1) => { const b = L.B(p0, q0, p1, q1); return [b[0], -0.5, b[1], b[2], y1, b[3]]; };
  s.zoneBox({ id: lot.id, place: 'city-special', box: zb(0, F, W, D, 7.0), name: NM[1], sub: info.name + ' · the tea dance', ambience: 'hall', reverb: 'felt', headroom: HH, env: { warmth: 0.3 }, cell: info.key });
  s.zoneBox({ id: lot.id + '/foyer', place: 'city-special', box: zb(f0, 0, f1, F, H1), name: NM[1], sub: info.name + ' · the foyer · tea and cloaks', ambience: 'shop', reverb: 'felt', cell: info.key });
  s.zoneBox({ id: lot.id + '/tea', place: 'city-special', box: zb(te0, 0, te1, F, H1), name: 'The tea room', sub: NM[1] + ' · ' + info.name, ambience: 'shop', reverb: 'felt', cell: info.key });
  s.zoneBox({ id: lot.id + '/cloaks', place: 'city-special', box: zb(cl0, 0, cl1, F, H1), name: 'The cloak room', sub: NM[1] + ' · ' + info.name, ambience: 'shop', reverb: 'felt', cell: info.key });
  void game; void dspots;
  if (typeof location !== 'undefined' && /citylog/.test(location.search)) { const d = DBG(); console.log('[dance] ' + lot.id + ' W ' + W.toFixed(1) + ' D ' + D.toFixed(1) + ' tris ' + (d[0] - dbg0[0]) + ' lights ' + (d[1] - dbg0[1]) + ' wall ' + Math.round(performance.now() - tb0) + ' ms work ' + Math.round(twork + performance.now() - tLast) + ' ms worst slice ' + tmax.toFixed(1) + ' ms slow ' + slow.join(',')); }
}
