// The children's lots of the Low decks: the block school (special.school), the play hall (special.playhall), the cradle
// arcade (special.cradle) and the naming rooms (special.naming). The school is here; the others are in lots_school_play.js
// and lots_school_small.js, and the shared parts in lots_school_kit.js.
//
// The school, in one sentence: a long tall hall where everything happens at half past three, with classrooms off both
// sides, a warm floor for the smallest, a kitchen hatch, and a physics corner where the lesson is the drum itself.
// Palette: cream plaster, the school's teal tiles, honey wood, the four house colours, and one strong accent per block.
import { registerLot, say, note } from '../city/lots.js';
import { roomGlow, warm } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { Rng, shadeHex } from '../core/util.js';
import { PAL, HOUSES, dynMesh } from './school_parts.js';
import { local, front, drawing, banners, pegs, slate, bookRow, wallBars, alt, KIDS, QF } from './lots_school_kit.js';
import { buildPlayhall } from './lots_school_play.js';
import { buildCradle, buildNaming } from './lots_school_small.js';

const SCHEMES = [
  { face: '#e3b469', inner: '#f1e4c8', plinth: '#2f7f86', trim: '#1f5a60', accent: '#e2553a', porchFloor: '#cf8f62', hall: '#efe6d4', floor: '#ddb47c', court: '#2f7f86', court2: '#e2553a', dado: '#3a8a8e' },
  { face: '#d98f6a', inner: '#f3e2c4', plinth: '#2f3f7a', trim: '#26306b', accent: '#e9b23c', porchFloor: '#b9634a', hall: '#f2e8d2', floor: '#d8ad78', court: '#2f3f7a', court2: '#e9b23c', dado: '#3d4f8a' },
  { face: '#c9cf9a', inner: '#eef0dc', plinth: '#6b7a3a', trim: '#3f4f2a', accent: '#8a4a6a', porchFloor: '#a8794f', hall: '#f0eedc', floor: '#d6b07a', court: '#3f6f3a', court2: '#8a4a6a', dado: '#5c7a3a' },
  { face: '#e8c7a0', inner: '#f6ead2', plinth: '#8a2f3c', trim: '#5a2e22', accent: '#2f7f86', porchFloor: '#c98b5e', hall: '#f4e9d6', floor: '#dcb27a', court: '#8a2f3c', court2: '#2f7f86', dado: '#8a3f48' },
];
const NAMES = ['Abena', 'Teodor', 'Ines', 'Rukmini', 'Bram', 'Halima', 'Osei', 'Liesl', 'Tomasz', 'Yewande', 'Calum', 'Mei', 'Farida', 'Joss', 'Anouk', 'Kwesi'];
const r1 = (x) => Math.round(x * 10) / 10;

// the drum's numbers at this block: r, the floor's speed, how far a drop lands anti, what a scale reads at a run
export function drumNumbers(info) {
  const r = 3000 - 4 * (info.d0 - 1), w = 0.0572, vr = w * r, g = 9.81 * info.g;
  return { r, vr, g, drift: (h) => Math.pow(2 * h, 1.5) / (3 * Math.sqrt(r)), fall: (h) => Math.sqrt(2 * h / g), run: (v, m) => [m * info.g, m * info.g * Math.pow(1 + v / vr, 2), m * info.g * Math.pow(1 - v / vr, 2)] };
}

// split [a0, a1] into bays of about `target` metres
function bays(a0, a1, target) { const n = Math.max(1, Math.round((a1 - a0) / target)), out = []; for (let i = 0; i < n; i++) out.push([a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n]); return out; }

async function buildSchool(s, lot, plan, game, tick) {
  const L = local(s, lot), r = new Rng(lot.seed), info = plan.info, g = s.g, W = L.W, D = L.D;
  const C = SCHEMES[r.i(0, SCHEMES.length - 1)], dn = drumNumbers(info);
  const F = 9.4, B = D >= 34 ? 10.4 : 9.6, HH = 6.8, HF = 3.2, HB = 3.3, hq0 = F, hq1 = D - B, hm = (hq0 + hq1) / 2;
  const E = 6.4, pe0 = Math.round((W - E) / 2 * 2) / 2, pe1 = pe0 + E;
  const DADO = { h: 1.05, mat: 'tile', tint: C.dado };
  const say2 = (gm, who, lines) => say(gm, who, lines);

  // ---------------------------------------------------------------------------------------------------------
  // the plan: rooms along the front (the porch and entrance in the middle), the long hall, rooms along the back
  // ---------------------------------------------------------------------------------------------------------
  const frontRooms = bays(0, pe0, 9).concat(bays(pe1, W, 9));
  const teachSide = r.chance(0.5) ? 0 : 1;        // the teachers' room is the front bay next to the porch on one side
  const tIdx = teachSide === 0 ? bays(0, pe0, 9).length - 1 : bays(0, pe0, 9).length;
  const ww = Math.max(8, Math.min(12, W * 0.24));   // the warm floor
  const kp0 = Math.round((W / 2 - 2.6) * 2) / 2, kp1 = kp0 + 5.2;
  const backRooms = [{ kind: 'warm', p0: 0, p1: ww }].concat(bays(ww, kp0, 8.5).map((b) => ({ kind: 'class', p0: b[0], p1: b[1] })), [{ kind: 'kitchen', p0: kp0, p1: kp1 }], bays(kp1, W, 8.5).map((b) => ({ kind: 'class', p0: b[0], p1: b[1] })));
  const fr = frontRooms.map((b, i) => ({ kind: i === tIdx ? 'teach' : 'class', p0: b[0], p1: b[1] }));
  const nClass = fr.filter((x) => x.kind === 'class').length + backRooms.filter((x) => x.kind === 'class').length;
  const name = info.name.toUpperCase() + ' SCHOOL';
  const sub = alt(r, ['the long hall at half past three', nClass + ' classes and a warm floor', 'spinball at break · broth at half past three', 'all ages · the long hall · the warm floor']);

  // ---------------------------------------------------------------------------------------------------------
  // the front
  // ---------------------------------------------------------------------------------------------------------
  const wins = fr.map((b) => { const w = Math.min(b.p1 - b.p0 - 1.6, 4.6); const c = (b.p0 + b.p1) / 2; return [c - w / 2, c + w / 2, b.kind === 'teach' ? 0.95 : 0.7, 2.3]; });
  const FR = await front(L, { name, sub, seed: lot.seed, porchW: E, porchAt: pe0, porchD: 1.9, windows: wins, piers: fr.map((b) => b.p1 - 0.25).filter((p) => Math.abs(p - pe0) > 0.5 && Math.abs(p - pe1) > 0.5 && p < W - 1),
    pal: { face: C.face, inner: C.inner, plinth: C.plinth, trim: C.trim, accent: C.accent, porchFloor: C.porchFloor }, stripe: HOUSES.map((h) => h[1]), lanterns: [C.accent, PAL.saffron] }, tick);
  const qi = FR.qIn, doorP = FR.doorP;
  // drawings stuck in the classroom windows, facing the street
  s.deco(() => {
    const wf = L.onWall('q', QF + 0.1, -1);
    wins.forEach((w, i) => { if (fr[i].kind !== 'class') return; for (let p = w[0] + 0.25; p < w[1] - 0.6; p += r.f(0.6, 1.1)) if (r.chance(0.7)) drawing(g, wf, p, r.f(0.95, 1.25), 0.42, 0.32, lot.seed + i * 31 + Math.round(p * 7)); });
  });
  // planters either side of the porch
  for (const p of [FR.porch[0] - 1.0, FR.porch[1] + 1.0]) { if (p < 1 || p > W - 1) continue; const a = L.xz(p, QF + 0.55); planter(s, a[0], 0, a[1], { w: L.alongX ? 1.2 : 0.5, d: L.alongX ? 0.5 : 1.2, h: 0.45, plants: r.pick(['flower', 'herbs', 'broad']), tint: C.plinth, mat: 'tile' }); }
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // shell: floors, ceilings, walls
  // ---------------------------------------------------------------------------------------------------------
  for (const b of fr) L.floor(b.p0, QF, b.p1, F, 0, 'planks', b.kind === 'teach' ? '#9c7450' : '#c79a62');
  L.floor(pe0, qi, pe1, F, 0, 'terrazzo', '#d9c8a6');
  L.floor(0, F, W, hq1, 0, 'planks', C.floor);
  for (const b of backRooms) L.floor(b.p0, hq1, b.p1, D, 0, b.kind === 'warm' ? 'speckle' : b.kind === 'kitchen' ? 'tile' : 'planks', b.kind === 'warm' ? '#c9745a' : b.kind === 'kitchen' ? '#dccbab' : '#bf9060');
  L.ceil(0, QF, pe0, F, HF, 'paint', '#f7f0e2'); L.ceil(pe1, QF, W, F, HF, 'paint', '#f7f0e2'); L.ceil(pe0, qi, pe1, F, HF, 'paint', '#f3ead8');
  L.ceil(0, hq1, W, D, HB, 'paint', '#f7f0e2');
  L.ceil(0, F, W, hq1, HH, 'panel', '#c9c2b4');
  await tick();
  // the side party walls, in three heights
  for (const p of [0.08, W - 0.08]) {
    const tint = C.inner;
    L.wallP(p, QF + 0.08, F - 0.08, HF, { tint, dado: DADO });
    L.wallP(p, F - 0.08, hq1 + 0.08, HH, { tint: C.hall, dado: DADO });
    L.wallP(p, hq1 + 0.08, D - 0.08, HB, { tint, dado: DADO });
  }
  L.wallQ(D - 0.08, 0, W, HB, { tint: C.inner, dado: DADO });
  // front-band partitions
  for (const b of fr) for (const p of [b.p0, b.p1]) { if (p < 0.2 || p > W - 0.2 || Math.abs(p - pe0) < 0.01 || Math.abs(p - pe1) < 0.01) continue; L.wallP(p, QF + 0.08, F - 0.08, HF, { tint: C.inner, dado: DADO }); }
  L.wallP(pe0, qi, F - 0.08, HF, { tint: C.inner, dado: DADO }); L.wallP(pe1, qi, F - 0.08, HF, { tint: C.inner, dado: DADO });
  for (const b of backRooms) { if (b.p0 < 0.2) continue; L.wallP(b.p0, hq1 + 0.08, D - 0.08, HB, { tint: C.inner, dado: DADO }); }
  // the hall's two long walls: doors, interior windows, the entrance and the kitchen hatch
  const fOpen = [{ at: pe0 + 1.0, w: E - 2.0, h: 2.6 }], bOpen = [], doors = [doorP];
  for (const b of fr) {
    const dp = b.p0 < pe0 ? b.p1 - 1.6 : b.p0 + 0.6; fOpen.push({ at: dp, w: 1.1, h: 2.15 }); doors.push(dp + 0.55); b.door = dp + 0.55;
    if (b.kind === 'class' && b.p1 - b.p0 > 5.5) { const wp = b.p0 < pe0 ? b.p0 + 1.0 : b.p0 + 2.4; fOpen.push({ at: wp, w: Math.min(2.6, b.p1 - b.p0 - 4.2), sill: 1.0, h: 1.1 }); }
  }
  for (const b of backRooms) {
    if (b.kind === 'kitchen') { bOpen.push({ at: b.p0 + 0.9, w: 2.4, sill: 0.95, h: 1.05 }, { at: b.p1 - 1.4, w: 1.0, h: 2.1 }); b.door = b.p1 - 0.9; doors.push(b.door); continue; }
    const dp = b.kind === 'warm' ? b.p1 - 2.4 : b.p0 + 0.7; bOpen.push({ at: dp, w: b.kind === 'warm' ? 1.6 : 1.1, h: 2.15 }); b.door = dp + (b.kind === 'warm' ? 0.8 : 0.55); doors.push(b.door);
    if (b.kind === 'class' && b.p1 - b.p0 > 5.5) bOpen.push({ at: b.p0 + 2.4, w: Math.min(2.6, b.p1 - b.p0 - 4.0), sill: 1.0, h: 1.1 });
    if (b.kind === 'warm') bOpen.push({ at: b.p0 + 1.2, w: Math.min(3.2, b.p1 - b.p0 - 4.4), sill: 0.75, h: 1.2 });
  }
  L.wallQ(F, 0.16, W - 0.16, HH, { deep: C.hall, shallow: C.inner, dado: DADO, openings: fOpen.map((x) => Object.assign({}, x, { at: x.at - 0.16 })) });
  L.wallQ(hq1, 0.16, W - 0.16, HH, { deep: C.inner, shallow: C.hall, dado: DADO, openings: bOpen.map((x) => Object.assign({}, x, { at: x.at - 0.16 })) });
  // glass in the interior windows, frames on the doors
  for (const x of fOpen.concat(bOpen)) {
    const q = fOpen.indexOf(x) >= 0 ? F : hq1;
    if (x.sill && !(q === hq1 && backRooms.some((b) => b.kind === 'kitchen' && Math.abs(x.at - b.p0 - 0.9) < 0.01))) { const a = L.xz(x.at, q), b2 = L.xz(x.at + x.w, q); s.glass(a[0], x.sill, a[1], b2[0], x.sill + x.h, b2[1], { opacity: 0.1 }); }
    if (!x.sill) L.frame(x.at + x.w / 2, q, x.w, x.h, 'p', { tint: C.trim });
  }
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // the long hall
  // ---------------------------------------------------------------------------------------------------------
  const clipH = L.clip(0.16, F, W - 0.16, hq1, HH);
  roomGlow(s, clipH[0], 0, clipH[2], clipH[3], HH, clipH[5], { sky: '#ffe6c0', ground: '#d9b07c', power: 0.55 });
  const nl = Math.max(3, Math.round(W / 11));
  for (let i = 0; i < nl; i++) L.lamp('globe', W * (i + 0.5) / nl, hm, 4.9, { r: 0.42, drop: 1.9, K: 3000, power: 2.6, range: 13, clip: clipH });
  s.structure(() => {
    // beams across, a duct along, the house stripe all round, felt panels high on the long walls
    g.mat('wood', '#7a5233'); for (let p = 3; p < W - 1; p += 4) L.bx(p - 0.12, F, HH - 0.38, p + 0.12, hq1, HH, { bevel: 0.01 });
    g.mat('brushed', '#a8a296'); { const a = L.xz(0.3, hq1 - 1.1), b = L.xz(W - 0.3, hq1 - 1.1); g.tube([[a[0], HH - 0.6, a[1]], [b[0], HH - 0.6, b[1]]], 0.24, { segs: 10 }); }
    for (const [q, sg] of [[F + 0.08, 1], [hq1 - 0.08, -1]]) {
      const wf = L.onWall('q', q, sg);
      for (let p = 0.2, k = 0; p < W - 0.2; p += 1.5, k++) { g.mat('paint', HOUSES[k % 4][1]); wf(p, 3.0, Math.min(W - 0.2, p + 1.5), 3.16, 0, 0.02); }
      for (let p = 1.0, k = r.i(0, 3); p < W - 3; p += 3.4, k++) { if (sg > 0 && p < doorP + 1.25 && p + 2.6 > doorP - 1.25) continue; g.mat('felt', [C.court, C.court2, PAL.saffron, PAL.indigo, PAL.leaf][k % 5]); wf(p, 3.7, p + 2.6, 5.9, 0, 0.06, { bevel: 0.02 }); }
    }
    for (const [p, sg] of [[0.16, 1], [W - 0.16, -1]]) { const wf = L.onWall('p', p, sg); for (let q = F + 0.1, k = 0; q < hq1 - 0.1; q += 1.5, k++) { g.mat('paint', HOUSES[k % 4][1]); wf(q, 3.0, Math.min(hq1 - 0.1, q + 1.5), 3.16, 0, 0.02); } }
  });
  s.deco(() => banners(L, 2, W - 2, hm, HH - 0.4, Math.max(3, Math.round(W / 8)), [C.court2, PAL.saffron, C.court, PAL.leaf, PAL.plum], 1.3));
  await tick();
  // the spinball court on the floor: the outline, the halfway line, the centre ring and the two break arcs
  const cp0 = 3, cp1 = W - 3, cq0 = hq0 + 1.4, cq1 = Math.min(hq1 - 4.6, hq0 + 1.4 + 10), cm = (cq0 + cq1) / 2;
  s.deco(() => {
    const ln = (a, b, c, d, col) => { g.mat('paint', col, { rough: -0.1 }); L.bx(a, b, 0.001, c, d, 0.004, { faces: 'Y' }); };
    ln(cp0, cq0, cp1, cq0 + 0.09, C.court); ln(cp0, cq1 - 0.09, cp1, cq1, C.court); ln(cp0, cq0, cp0 + 0.09, cq1, C.court); ln(cp1 - 0.09, cq0, cp1, cq1, C.court);
    ln(W / 2 - 0.045, cq0, W / 2 + 0.045, cq1, C.court);
    // the throwing boxes at each end, filled in the house colours
    for (const [e, sg] of [[cp0, 1], [cp1, -1]]) for (let k = 0; k < 4; k++) ln(Math.min(e + sg * 0.09, e + sg * 1.2), cq0 + 0.09 + (cq1 - cq0 - 0.18) * k / 4, Math.max(e + sg * 0.09, e + sg * 1.2), cq0 + 0.09 + (cq1 - cq0 - 0.18) * (k + 1) / 4, HOUSES[k][1]);
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, p = W / 2 + Math.cos(a) * 1.6, q = cm + Math.sin(a) * 1.6; ln(p - 0.09, q - 0.09, p + 0.09, q + 0.09, C.court2); }
    // the break arcs from each end: a throw spinward dives, a throw anti sails
    for (const e of [cp0 + 0.8, cp1 - 0.8]) { const sg = e < W / 2 ? 1 : -1; for (let i = 0; i < 14; i++) { const t = i / 13, p = e + sg * t * 6, q = cm + (sg > 0 ? 1 : -1) * t * t * 2.2; ln(p - 0.08, q - 0.05, p + 0.08, q + 0.05, PAL.saffron); } }
  });
  for (const [p, sg] of [[0.16, 1], [W - 0.16, -1]]) L.prop('school.ring', p, cm, 2.75, L.yaw(sg, 0), { c: sg > 0 ? C.court2 : C.court });
  wallBars(L, 'p', 0.16, 1, F + 0.9, cm - 1.0, 2.6, C.court); if (hq1 - 2.4 - (cm + 1.0) > 0.9) wallBars(L, 'p', 0.16, 1, cm + 1.0, hq1 - 2.4, 2.6, C.court);
  // benches along the front long wall, for whoever is waiting
  const fBusy = (p) => fOpen.some((x) => p > x.at - 1.3 && p < x.at + x.w + 1.3);
  for (let p = 2.2; p < W - 2.2; p += 2.4) { if (fBusy(p)) continue; L.prop('bench', p, F + 0.45, 0, L.yaw(0, 1), { w: 1.8, back: true, wood: '#a8794f', metal: C.trim }, { spot: { tags: ['school', 'wait', 'hall'] } }); }
  await tick();
  // children's drawings in a long frieze on both long walls, wherever there is wall
  s.deco(() => {
    for (const [q, sg, ops] of [[F + 0.08, 1, fOpen], [hq1 - 0.08, -1, bOpen]]) {
      const wf = L.onWall('q', q, sg);
      for (let p = 0.8; p < W - 1.2; p += r.f(0.68, 0.95)) { if (ops.some((x) => p + 0.62 > x.at - 0.15 && p < x.at + x.w + 0.15)) continue; drawing(g, wf, p, r.f(1.12, 1.36) + (sg > 0 ? 0.0 : 0.05), r.f(0.5, 0.62), r.f(0.38, 0.46), lot.seed * 7 + Math.round(p * 13) + sg); }
    }
  });
  // the clock over the way in: the hour from three to four painted red, and hands of brass beads that keep the time
  {
    const cP = doorP, cY = 4.6, R = 0.95, face = L.xz(cP, F + 0.09), yaw = L.yaw(0, 1);
    const right = [L.Qv[1], -L.Qv[0]], out = [L.Qv[0], L.Qv[1]];
    s.furniture(() => {
      g.at(face[0], cY, face[1], yaw); g.rotX(Math.PI / 2);
      g.mat('cast', '#c8a45a', { rough: -0.25 }); g.cyl(0, 0, 0, R + 0.12, 0.07, { segs: 32 });
      g.mat('paint', C.trim); g.cyl(0, 0.07, 0, R, 0.012, { segs: 32 });
      g.pop();
      const at = (a, rr, d) => [face[0] + (right[0] * Math.sin(a) + 0) * rr + out[0] * d, cY + Math.cos(a) * rr, face[1] + right[1] * Math.sin(a) * rr + out[1] * d];
      g.mat('paint', C.court2); for (let i = 0; i <= 12; i++) { const a = (3 + i / 12) / 12 * Math.PI * 2, c = at(a, R * 0.8, 0.085); g.ball(c[0], c[1], c[2], 0.075, 0.075, 0.03, { segs: 6, rings: 3 }); }
      g.mat('paint', '#f6ecd6'); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, c = at(a, R * 0.93, 0.085), s2 = i % 3 ? 0.03 : 0.055; g.box(c[0] - s2, c[1] - s2, c[2] - s2, c[0] + s2, c[1] + s2, c[2] + s2); }
    });
    const beads = [];
    for (let i = 0; i < 11; i++) { const hour = i < 4, m = dynMesh(s, [face[0], cY, face[1]], (g2) => { g2.mat('cast', hour ? '#e9b23c' : '#f6ecd6', { rough: -0.2 }); const rb = hour ? 0.07 : 0.05; g2.ball(0, 0, 0, rb, rb, rb, { segs: 8, rings: 5 }); }, { radius: 0.1, far: 60 }); if (m) beads.push({ m, hour, rr: hour ? 0.1 + i * 0.13 : 0.1 + (i - 4) * 0.115 }); }
    s.every((dt, gm) => {
      if (!gm || !gm.clock || !beads.length) return;
      const h = gm.clock.hours, am = (h % 1) * Math.PI * 2, ah = ((h % 12) / 12) * Math.PI * 2;
      for (const b of beads) { const a = b.hour ? ah : am, o = b.m.userData.origin; o[0] = face[0] + right[0] * Math.sin(a) * b.rr + out[0] * 0.13; o[1] = cY + Math.cos(a) * b.rr; o[2] = face[1] + right[1] * Math.sin(a) * b.rr + out[1] * 0.13; }
    });
  }
  // the ball rack and balls about the floor
  L.prop('school.rack', 1.4, hq1 - 1.4, 0, L.yaw(1, 0), {});
  for (let k = 0; k < 6; k++) L.prop('school.ball', r.f(cp0 + 1, cp1 - 1), r.f(cq0 + 0.5, cq1 - 0.5), 0, r.f(0, 6), (() => { const k = r.i(0, KIDS.length - 1); return { a: KIDS[k], b: '#f6ecd6', c: KIDS[(k + 3) % KIDS.length] }; })(), { noCollide: true });
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // the physics corner, at the far end of the hall: the drop tower, the turntable, the scale trolley's lane
  // ---------------------------------------------------------------------------------------------------------
  const TP = W - 2.2, TQ = hq1 - 2.0, TH = 6.2;
  const anti = [-L.spin[0], -L.spin[1]];
  s.furniture(() => {
    g.mat('paint', C.court2, { rough: -0.1 });
    for (const dp of [-0.5, 0.5]) for (const dq of [-0.5, 0.5]) L.bx(TP + dp - 0.06, TQ + dq - 0.06, 0, TP + dp + 0.06, TQ + dq + 0.06, TH, { bevel: 0.012 });
    // a metre scale up the front post, in bands
    g.mat('paint', '#f6ecd6'); for (let y = 0.5; y < TH - 0.2; y += 1.0) L.bx(TP - 0.5 - 0.065, TQ - 0.5 - 0.065, y, TP - 0.5 + 0.065, TQ - 0.5 + 0.065, y + 0.5);
    g.mat('paint', C.court, { rough: -0.1 });
    for (let y = 0.6; y < TH; y += 1.2) { L.bx(TP - 0.5, TQ - 0.52, y, TP + 0.5, TQ - 0.48, y + 0.05); L.bx(TP - 0.5, TQ + 0.48, y, TP + 0.5, TQ + 0.52, y + 0.05); L.bx(TP + 0.48, TQ - 0.5, y, TP + 0.52, TQ + 0.5, y + 0.05); }
    g.mat('wood', '#8a6240'); L.bx(TP - 0.62, TQ - 0.62, TH, TP + 0.62, TQ + 0.62, TH + 0.08, { bevel: 0.01 });
    g.mat('cast', '#c8a45a', { rough: -0.2 }); L.bx(TP - 0.1, TQ - 0.1, TH - 0.18, TP + 0.1, TQ + 0.1, TH, { bevel: 0.02 });
  });
  s.detail(() => {
    // the plumb line and its bob, the cord down to the release handle
    const a = L.xz(TP, TQ); g.mat('weave', '#e8e0cc'); g.tube([[a[0], TH - 0.2, a[1]], [a[0], 0.12, a[1]]], 0.003, { segs: 3 });
    g.mat('cast', '#c8a45a', { rough: -0.25 }); g.lathe(a[0], a[1], [[0, 0.04], [0.03, 0.08], [0.02, 0.12], [0, 0.13]], { segs: 10 });
    const b = L.xz(TP + 0.5, TQ - 0.5); g.mat('weave', C.court2); g.tube([[b[0], TH - 0.1, b[1]], [b[0], 1.05, b[1]]], 0.006, { segs: 4 }); g.ball(b[0], 1.02, b[1], 0.03, 0.05, 0.03, { segs: 8, rings: 5 });
  });
  for (const dp of [-0.5, 0.5]) for (const dq of [-0.5, 0.5]) { const a = L.xz(TP + dp, TQ + dq); s.post(a[0], a[1], 0.08, 0, TH); }
  // on the end wall above the tower, painted big: the drum's floor as an arc, the ball's straight fall, where it lands
  s.deco(() => {
    const wf = L.onWall('p', W - 0.16, -1), cq = TQ - 2.6, cy = 4.7, R = 1.5;
    g.mat('paint', '#f6ecd6'); wf.flat(cq - 2.0, 3.35, cq + 2.0, 6.1, 0.0);
    g.mat('paint', C.court); for (let i = 0; i < 22; i++) { const a = Math.PI * (1.1 + 0.8 * i / 21), u = cq + Math.cos(a) * R, v = cy + 0.2 + Math.sin(a) * R * 0.9; wf.flat(u - 0.05, v - 0.05, u + 0.05, v + 0.05, 0.005); }
    g.mat('paint', PAL.saffron); wf.flat(cq - 0.03, cy - 0.6, cq + 0.03, cy + 0.9, 0.006); wf.flat(cq - 0.09, cy + 0.85, cq + 0.09, cy + 1.03, 0.006);
    g.mat('paint', C.court2); for (let i = 0; i < 6; i++) { const u = cq - 0.06 * i * i * 0.12 - i * 0.02, v = cy - 0.62 - i * 0.07; wf.flat(u - 0.04, v - 0.04, u + 0.04, v + 0.04, 0.007); }
    g.mat('paint', '#2a2622'); for (let i = 0; i < 9; i++) wf.flat(cq - 1.7 + i * 0.2, 3.5, cq - 1.62 + i * 0.2, 3.58 + (i % 3) * 0.04, 0.006);
  });
  // the target on the floor: rings round the plumb, and the scuffs where the balls really land, all anti
  const drift = dn.drift(TH - 0.2);
  s.deco(() => {
    const ln = (pp, qq, rr, col) => { g.mat('paint', col, { rough: -0.1 }); L.bx(pp - rr, qq - rr, 0.001, pp + rr, qq + rr, 0.0045, { faces: 'Y' }); };
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; ln(TP + Math.cos(a) * 0.3, TQ + Math.sin(a) * 0.3, 0.025, '#f6ecd6'); ln(TP + Math.cos(a) * 0.15, TQ + Math.sin(a) * 0.15, 0.018, '#f6ecd6'); }
    ln(TP, TQ, 0.03, C.court2);
    for (let i = 0; i < 18; i++) { const sp = r.f(-0.04, 0.04), d = drift + r.f(-0.03, 0.03); ln(TP + anti[0] * d + anti[1] * sp, TQ + anti[1] * d + anti[0] * sp, 0.012, '#5a4a3a'); }
    // an arrow chalked on the floor: this way is anti
    for (let i = 0; i < 6; i++) ln(TP + anti[0] * (0.45 + i * 0.08), TQ + anti[1] * (0.45 + i * 0.08) + 0.25 * (anti[0] ? 1 : 0), 0.02, '#f4ecd2');
  });
  const tq0 = L.xz(TP, TQ);
  s.light({ at: [tq0[0], HH - 0.3, tq0[1]], type: 'spot', dir: [0, -1, 0], cone: [24, 12], color: warm(4000), power: 22, range: 8, shadow: false, lamp: true, clip: clipH });
  // the falling ball: its own mesh, moved every frame while it falls
  const ball = dynMesh(s, [tq0[0], TH - 0.24, tq0[1]], (g2) => { g2.mat('leather', C.court2, { rough: 0.1 }); g2.ball(0, 0, 0, 0.07, 0.07, 0.07, { segs: 12, rings: 8 }); g2.mat('leather', '#f6ecd6'); const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ring.push([Math.cos(a) * 0.071, 0, Math.sin(a) * 0.071]); } g2.tube(ring, 0.006, { segs: 4, closed: true }); }, { radius: 0.2, far: 50 });
  const drop = { t: -1, T: dn.fall(TH - 0.3) };
  const endXZ = L.xz(TP + anti[0] * drift, TQ + anti[1] * drift);
  s.every((dt, gm) => {
    if (!ball || drop.t < 0) return;
    drop.t += dt; const k = Math.min(1, drop.t / drop.T), o = ball.userData.origin;
    o[1] = (TH - 0.24) - (TH - 0.31) * k * k; o[0] = tq0[0] + (endXZ[0] - tq0[0]) * k * k * k; o[2] = tq0[1] + (endXZ[1] - tq0[1]) * k * k * k;
    if (k >= 1) { drop.t = -1; if (gm && gm.sfxAt) gm.sfxAt('ball-bounce', s.frame, o[0], 0.1, o[2], { vol: 0.5 }); setTimeout(() => { if (ball && s.active) { ball.userData.origin[0] = tq0[0]; ball.userData.origin[1] = TH - 0.24; ball.userData.origin[2] = tq0[1]; } }, 2600); }
  });
  const dropLines = alt(r, [
    ['The children call the plumb mark "where it ought to land" and the scuffs "where it does". The teacher lets them.'],
    ['Chalked on the post at child height: axis flies true, spin sinks, anti floats. Under it, smaller: and drops go anti.'],
    ['A card on the frame keeps the term\'s count. Not one drop has landed spinward. Somebody has added, in pencil: yet.'],
    ['The ball is a spinball with its mend showing. By the tally on the post it has been dropped some thousands of times, and it has never once argued.'],
  ]);
  L.act(TP + anti[0] * 1.1 - 0.0, TQ + anti[1] * 1.1 - 1.0 * (anti[0] ? 1 : 0), 1.2, 1.8, 'Drop a ball from the tower', async (gm) => {
    if (drop.t >= 0) return;
    drop.t = 0; if (gm.sfxAt) gm.sfxAt('clunk', s.frame, tq0[0], TH - 0.2, tq0[1], { vol: 0.4 });
    await new Promise((res) => setTimeout(res, drop.T * 1000 + 400));
    await say2(gm, 'The drop tower', ['From ' + r1(TH - 0.2) + ' metres the ball takes ' + (drop.T < 1 ? r1(drop.T) + ' of a second' : r1(drop.T) + ' seconds') + ' to fall. In that time the floor, being further out, runs ahead of it: it lands ' + Math.round(drift * 100) + ' centimetres anti of the plumb mark, in the scuff with all the others.'].concat(dropLines));
  });
  // the turntable: the drum in small. Three marbles ride round on it; a chalk curl shows the path a rolled one takes.
  const TTp = W - 5.0, TTq = hq1 - 1.4;
  L.prop('table', TTp, TTq, 0, 0, { w: 1.3, round: true, wood: '#6b4a2f', top: '#8a6240' });
  s.detail(() => {
    const c = L.xz(TTp, TTq);
    g.mat('paint', '#f1e9d6', { rough: -0.1 }); g.cyl(c[0], 0.74, c[1], 0.58, 0.03, { segs: 28 });
    g.mat('paint', C.court); g.cyl(c[0], 0.771, c[1], 0.07, 0.006, { segs: 12 });
    g.mat('paint', C.court2); for (let i = 0; i < 12; i++) { const t = i / 11, a = t * 1.6, rr = 0.55 * (1 - t); g.box(c[0] + Math.cos(a) * rr - 0.012, 0.771, c[1] + Math.sin(a) * rr - 0.012, c[0] + Math.cos(a) * rr + 0.012, 0.775, c[1] + Math.sin(a) * rr + 0.012); }
    g.mat('paint', '#2a2622'); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; g.box(c[0] + Math.cos(a) * 0.55 - 0.006, 0.771, c[1] + Math.sin(a) * 0.55 - 0.006, c[0] + Math.cos(a) * 0.55 + 0.006, 0.774, c[1] + Math.sin(a) * 0.55 + 0.006); }
    g.mat('cast', '#c8a45a'); g.tube([[c[0] + 0.62, 0.76, c[1]], [c[0] + 0.7, 0.76, c[1]], [c[0] + 0.7, 0.9, c[1]]], 0.012, { segs: 5 });
  });
  const marbles = [];
  { const c = L.xz(TTp, TTq); for (let i = 0; i < 3; i++) { const m = dynMesh(s, [c[0], 0.79, c[1]], (g2) => { g2.mat('glaze', [PAL.saffron, C.court2, PAL.leaf][i]); g2.ball(0, 0, 0, 0.022, 0.022, 0.022, { segs: 8, rings: 6 }); }, { radius: 0.05, far: 25 }); if (m) marbles.push({ m, a: i * 2.1, rr: 0.18 + i * 0.12 }); } }
  { const c = L.xz(TTp, TTq); s.every((dt) => { for (const mb of marbles) { mb.a += dt * Math.PI * 2 / 11; const o = mb.m.userData.origin; o[0] = c[0] + Math.cos(mb.a) * mb.rr; o[2] = c[1] + Math.sin(mb.a) * mb.rr; } }); }
  const ttLines = alt(r, [
    ['A round table that turns: the drum in small. Roll a marble from the rim to the middle and it curls away against the turn. A painted line shows the path it ought to take; the chalk shows the one it does.'],
    ['A card under the glass: The table turns once in eleven seconds. The drum turns once in a hundred and ten. Ten times faster, and ten times easier to see.'],
    ['Three marbles ride round on the rim. Somebody has drawn a tiny person beside them in felt pen, and the tiny person has been round more times than anybody in the block.'],
    ['A crank at the side and a note in a teacher\'s hand: Turn it slowly. You are the drum, and the drum does not hurry.'],
  ]);
  L.act(TTp - 0.9, TTq, 1.0, 1.4, 'Look at the turntable', (gm) => say2(gm, 'The turntable', ttLines));
  // the scale trolley's lane: a straight stripe on the floor, spinward, and a platform scale on wheels at one end
  const lane = L.alongX ? { a: [W - 15, hq1 - 3.2], b: [W - 7.0, hq1 - 3.2] } : { a: [W - 8.5, hq0 + 1.6], b: [W - 8.5, hq1 - 3.4] };
  s.deco(() => {
    const dp = lane.b[0] - lane.a[0], dq = lane.b[1] - lane.a[1], len = Math.hypot(dp, dq), ux = dp / len, uq = dq / len;
    g.mat('paint', PAL.saffron, { rough: -0.1 }); L.bx(Math.min(lane.a[0], lane.b[0]) - Math.abs(uq) * 0.45, Math.min(lane.a[1], lane.b[1]) - Math.abs(ux) * 0.45, 0.001, Math.max(lane.a[0], lane.b[0]) + Math.abs(uq) * 0.45, Math.max(lane.a[1], lane.b[1]) + Math.abs(ux) * 0.45, 0.004, { faces: 'Y' });
    g.mat('paint', C.floor, { rough: -0.1 }); L.bx(Math.min(lane.a[0], lane.b[0]) - Math.abs(uq) * 0.38, Math.min(lane.a[1], lane.b[1]) - Math.abs(ux) * 0.38, 0.0045, Math.max(lane.a[0], lane.b[0]) + Math.abs(uq) * 0.38, Math.max(lane.a[1], lane.b[1]) + Math.abs(ux) * 0.38, 0.006, { faces: 'Y' });
    // chevrons: red pointing spinward at the spinward end, teal pointing anti at the other
    for (let k = 0; k < 3; k++) for (const [t, col, sg] of [[0.82 - k * 0.05, C.court2, 1], [0.18 + k * 0.05, C.court, -1]]) {
      const pc = lane.a[0] + dp * t, qc = lane.a[1] + dq * t, sp = (L.spin[0] * ux + L.spin[1] * uq) > 0 ? sg : -sg;
      for (const side of [-1, 1]) { const p = pc - ux * 0.12 * sp + uq * side * 0.18, q = qc - uq * 0.12 * sp + ux * side * 0.18; g.mat('paint', col); L.bx(p - 0.07, q - 0.07, 0.0062, p + 0.07, q + 0.07, 0.0075, { faces: 'Y' }); }
      g.mat('paint', col); L.bx(pc - 0.08, qc - 0.08, 0.0062, pc + 0.08, qc + 0.08, 0.0075, { faces: 'Y' });
    }
  });
  const trolleyAt = [lane.a[0] + (lane.b[0] - lane.a[0]) * 0.08, lane.a[1] + (lane.b[1] - lane.a[1]) * 0.08];
  s.furniture(() => {
    const c = L.xz(trolleyAt[0], trolleyAt[1]);
    g.mat('cast', '#3a3a40'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.cyl(c[0] + sx * 0.28, 0, c[1] + sz * 0.28, 0.05, 0.1, { segs: 10 });
    g.mat('paint', C.court); g.box(c[0] - 0.36, 0.1, c[1] - 0.36, c[0] + 0.36, 0.18, c[1] + 0.36, { bevel: 0.02 });
    g.mat('speckle', '#3a3a3a'); g.box(c[0] - 0.3, 0.18, c[1] - 0.3, c[0] + 0.3, 0.2, c[1] + 0.3);
    g.mat('brushed', '#b9b4aa'); g.tube([[c[0], 0.18, c[1] - 0.32], [c[0], 1.0, c[1] - 0.34]], 0.02, { segs: 6 });
    g.mat('paint', '#f6ecd6'); g.cyl(c[0], 0.98, c[1] - 0.34, 0.16, 0.05, { segs: 18 }); g.mat('paint', C.court2); g.cyl(c[0], 1.03, c[1] - 0.34, 0.012, 0.006, { segs: 6 });
    g.mat('wood', '#8a6240'); g.tube([[c[0] - 0.3, 0.95, c[1] + 0.38], [c[0] + 0.3, 0.95, c[1] + 0.38]], 0.018, { segs: 6 }); for (const sx of [-1, 1]) g.tube([[c[0] + sx * 0.3, 0.2, c[1] + 0.34], [c[0] + sx * 0.3, 0.95, c[1] + 0.38]], 0.014, { segs: 5 });
  });
  { const c = L.xz(trolleyAt[0], trolleyAt[1]); s.solid(c[0] - 0.38, 0, c[1] - 0.38, c[0] + 0.38, 0.2, c[1] + 0.38); }
  const mass = [24, 31, 19, 27][r.i(0, 3)], rd = dn.run(5, mass);
  const scLines = alt(r, [
    'The child it belongs to weighs the same the whole way down the lane. Only the floor changes its mind.',
    'Pushed spinward you are going round a little faster than the drum, and the floor has to press harder to keep you. Pushed anti, it can ease off.',
    'The record for the biggest swing on the dial is chalked on the trolley\'s handle, with a name and a date and a note: pushed by three aunts.',
    'The teacher\'s rule is one push each and nobody runs anti into the tower.',
  ]);
  L.act(trolleyAt[0], trolleyAt[1], 1.0, 1.5, 'Ride the scale trolley down the lane', async (gm) => {
    if (gm.sfxAt) { const c = L.xz(trolleyAt[0], trolleyAt[1]); gm.sfxAt('clunk', s.frame, c[0], 0.3, c[1], { vol: 0.3 }); }
    await say2(gm, 'The scale trolley', ['A child of ' + mass + ' kilograms stands on it. Still, the dial reads ' + r1(rd[0]) + '. Pushed spinward at a run, ' + r1(rd[1]) + '. Pushed anti at the same run, ' + r1(rd[2]) + '. The floor here is going round at ' + Math.round(dn.vr) + ' metres a second.', scLines]);
  });
  // a bench to watch from, and the corner's own lamp
  L.prop('bench', W - 9.5, hq1 - 0.45, 0, L.yaw(0, -1), { w: 1.8, back: true, wood: '#a8794f', metal: C.trim }, { spot: { tags: ['school', 'watch', 'hall'] } });
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // the kitchen and its hatch onto the hall
  // ---------------------------------------------------------------------------------------------------------
  const K = backRooms.find((b) => b.kind === 'kitchen');
  {
    const clipK = L.clip(K.p0 + 0.08, hq1, K.p1 - 0.08, D, HB);
    roomGlow(s, clipK[0], 0, clipK[2], clipK[3], HB, clipK[5], { sky: '#fff0d8', ground: '#d8c8a8', power: 0.4 });
    L.lamp('panel', (K.p0 + K.p1) / 2, (hq1 + D) / 2, HB, { w: 1.6, d: 0.6, K: 3400, power: 1.1, clip: clipK });
    L.prop('counter', (K.p0 + K.p1) / 2, D - 0.5, 0, L.yaw(0, -1), { w: K.p1 - K.p0 - 0.6, d: 0.62, h: 0.9, body: C.trim, top: '#b9b4aa' }, { noSpots: true });
    s.detail(() => {
      for (let p = K.p0 + 0.7; p < K.p1 - 0.5; p += 0.55) { const c = L.xz(p, D - 0.5); g.mat('brushed', '#9a9488'); g.box(c[0] - 0.2, 0.9, c[1] - 0.2, c[0] + 0.2, 0.93, c[1] + 0.2); }
    });
    for (let p = K.p0 + 0.7, k = 0; p < K.p1 - 0.5; p += 0.55, k++) { const c = L.xz(p, D - 0.5); prop(s, 'crock', c[0], 0.93, c[1], 0, { glaze: ['#3a2a20', '#a3563a', '#d9c7a6', '#2f7f86'][k % 4], h: 0.34, r: 0.17 }, { noCollide: true }); }
    // the hatch: a ledge on the hall side with the lidded cups set out
    const hp0 = K.p0 + 0.9, hp1 = hp0 + 2.4;
    s.furniture(() => { g.mat('wood', '#b98a5a', { rough: -0.1 }); L.bx(hp0 - 0.1, hq1 - 0.42, 0.92, hp1 + 0.1, hq1 + 0.42, 0.97, { bevel: 0.01 }); g.mat('paint', C.trim); L.bx(hp0 - 0.1, hq1 - 0.08, 0, hp1 + 0.1, hq1 - 0.04, 0.92); });
    L.solid(hp0 - 0.1, hq1 - 0.42, 0, hp1 + 0.1, hq1 - 0.04, 0.97);
    for (let k = 0; k < 6; k++) { const p = hp0 + 0.25 + k * 0.38, a = L.xz(p, hq1 - 0.24 + (k % 2) * 0.1); prop(s, 'cup', a[0], 0.97, a[1], 0, { glaze: ['#d9cfb8', '#2f7f86', '#c9552e', '#e9b23c'][k % 4] }, { noCollide: true }); }
    for (let k = 0; k < 3; k++) { const a = L.xz(hp0 + 0.5 + k * 0.7, hq1 + 0.2); prop(s, 'bowl', a[0], 0.97, a[1], 0, { glaze: '#e9e2d0', lid: [C.court2, PAL.saffron, C.court][k], r: 0.12 }, { noCollide: true }); }
    s.loop('kitchen', ...(() => { const a = L.xz((K.p0 + K.p1) / 2, D - 1); return [a[0], 1.2, a[1]]; })(), { vol: 0.18, radius: 8 });
    L.spot('work', (hp0 + hp1) / 2, hq1 + 0.75, 0, L.yaw(0, -1), { tags: ['cook', 'school', 'hatch'] });
    L.spot('work', K.p0 + 1.2, D - 1.1, 0, L.yaw(0, 1), { tags: ['cook', 'school'] });
    for (let k = 0; k < 4; k++) L.spot('queue', (hp0 + hp1) / 2 + (k % 2 ? 0.4 : -0.4), hq1 - 0.9 - k * 0.6, 0, L.yaw(0, 1), { tags: ['school', 'kids', 'hatch'] });
    const cook = NAMES[r.i(0, NAMES.length - 1)];
    const kLines = alt(r, [
      ['Somebody will have asked you where you slept already. I only ask whether you have eaten, and I can see you have not. Half past three is a cup of broth and a rice ball for anyone under twelve and anyone who looks hungry.', 'Lid on until you sit. In this air it goes cold before you are halfway down the hall.'],
      ['Everything in here is held on the loop at sixty-five degrees, for nothing. The rice balls are the only thing that costs, and they cost my hands.', 'Take a cup. The lid is the school\'s; bring it back.'],
      ['Two hundred cups at half past three, and every one comes back to this hatch with its lid on or I hear about it from the lid.', 'The broth is Mill broth with a sprig of whatever the hall cut today. Today it is chervil, which the children think is a joke.'],
      ['Guests count as under twelve on their first day. That is not a rule. It is the hatch\'s rule.', 'Mind the little ones by the hatch; they come in under your elbows.'],
    ]);
    L.act((hp0 + hp1) / 2, hq1 - 0.9, 1.1, 1.6, 'Ask at the kitchen hatch', async (gm) => { await say2(gm, cook + ' at the hatch', kLines); if (gm.sfxAt) { const a = L.xz((hp0 + hp1) / 2, hq1 - 0.2); gm.sfxAt('lid-up', s.frame, a[0], 1.0, a[1], { vol: 0.4 }); } });
  }
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // classrooms
  // ---------------------------------------------------------------------------------------------------------
  const lessonRoom = { done: false };
  const teacherName = NAMES[(r.i(0, NAMES.length - 1) + 5) % NAMES.length];
  async function classroom(b, side, k) {
    // side: 'front' (the room runs from the street wall to the hall) or 'back' (from the hall to the back wall)
    const q0 = side === 'front' ? QF + 0.1 : hq1 + 0.08, q1 = side === 'front' ? F - 0.08 : D - 0.16, H = side === 'front' ? HF : HB;
    const pa = b.p0 + (b.p0 < 0.2 ? 0.16 : 0.08), pb = b.p1 - (b.p1 > W - 0.2 ? 0.16 : 0.08);
    const hallQ = side === 'front' ? q1 : q0, farQ = side === 'front' ? q0 : q1, inward = side === 'front' ? -1 : 1;   // inward: from the hall into the room
    const slateLow = (b.door - pa) > (pb - b.door);    // the slate on the side wall away from the door
    const sp = slateLow ? pa : pb, sdir = slateLow ? 1 : -1;
    const small = k % 3 === 0;                          // every third room is for the younger ones
    const clip = L.clip(pa, Math.min(q0, q1), pb, Math.max(q0, q1), H);
    roomGlow(s, clip[0], 0, clip[2], clip[3], H, clip[5], { sky: '#ffe8c8', ground: '#c99a62', power: 0.42 });
    L.lamp('panel', (pa + pb) / 2, (q0 + q1) / 2, H, { w: Math.min(2.4, pb - pa - 2), d: 0.6, K: 3300, power: 1.25, clip });
    const qm = (q0 + q1) / 2, sw = Math.min(3.4, Math.abs(q1 - q0) - 3.2);
    slate(L, 'p', sp, sdir, qm - sw / 2, sw, lot.seed + k * 17, k % 3);
    // the teacher's desk by the slate, toward the far wall
    const tdP = sp + sdir * 1.0, tdQ = qm + inward * -1 * 0 + (farQ - qm) * 0.55;
    L.prop('table', tdP, tdQ, 0, L.yaw(0, 1), { w: 1.2, d: 0.6, wood: '#6b4a2f', top: '#8a6240' });
    L.prop('chair', tdP - sdir * 0.55, tdQ, 0, L.yaw(sdir, 0), { back: 'slat', wood: '#5b4636' }, { noSpots: true });
    L.spot('counter', sp + sdir * 0.7, qm, 0, L.yaw(sdir, 0), { tags: ['teach', 'school', 'keeper'] });
    prop(s, 'cup', ...(() => { const a = L.xz(tdP + 0.2, tdQ + 0.1); return [a[0], 0.74, a[1]]; })(), 0, { glaze: r.pick(['#c9552e', '#2f7f86', '#e9b23c']) }, { noCollide: true });
    // double desks in rows facing the slate, two children at each
    const rows = [], cols = [];
    for (let p = sp + sdir * 2.3; sdir > 0 ? p < pb - 0.8 : p > pa + 0.8; p += sdir * 1.25) rows.push(p);
    const qa = Math.min(hallQ, farQ) + (hallQ < farQ ? 1.5 : 0.9), qb = Math.max(hallQ, farQ) - (hallQ > farQ ? 1.5 : 0.9);
    for (let q = qa + 0.6; q < qb - 0.55 && cols.length < 4; q += 1.75) cols.push(q);
    const fy = L.yaw(-sdir, 0);
    let n = 0;
    for (const p of rows.slice(0, 3)) for (const q of cols) {
      if (n >= 8) break; n++;
      L.prop('lots-school.deskset', p, q, 0, L.yaw(sdir, 0), { top: ['#b8875a', '#c49464', '#a87a4c', '#bf8c5c'][n % 4], frame: n % 3 ? PAL.teal : PAL.indigo, book: KIDS[n % 4], h: small ? 0.56 : 0.66, c1: HOUSES[(n * 2) % 4][1], c2: HOUSES[(n * 2 + 1) % 4][1], cf: '#3a3a3a', ch: small ? 0.34 : 0.42 }, { spot: { tags: ['class', 'school', 'desk'] } });
    }
    await tick();
    if (!lessonRoom.done && rows.length && cols.length) {
      lessonRoom.done = true;
      const p = rows[rows.length > 1 ? 1 : 0], q = cols[cols.length - 1];
      const seat = L.xz(p + sdir * 0.42, q + 0.29), lk = L.look(-sdir, 0);
      const lesson = alt(r, [
        ['Today: why you are heavier running spinward. Yes, Femi. You are going round a little faster than the floor, so the floor has to push harder to keep you on it. Write that down, and then run it in the hall and see.'],
        ['Today we drop things. Mira drops the cup: it lands anti. It will always land anti, on every deck, in every drum. Good. Now the hard part: by how much, from a metre, on this deck.'],
        ['Today is the River. None of you has seen it yet. You will at eight, through a Window, and you will all be very quiet. Draw what you think it looks like, and keep the drawing until then.'],
        ['Today is kays. A wallet is twenty-one point six a day. A tomato is half of one. That is forty-three tomatoes, and nobody buys forty-three tomatoes, because then there is nothing left for the cab, the baths or anyone\'s time.'],
      ]);
      L.act(p + sdir * 0.42, q, 0.9, 1.3, 'Sit in on the lesson', async (gm) => {
        if (gm.player && gm.player.sit) { gm.player.sit({ x: seat[0], y: 0, z: seat[1], eye: 1.05 }); gm.player.yaw = lk; gm.player.pitch = -0.06; }
        await say2(gm, teacherName + ', teaching', lesson.concat([alt(new Rng(lot.seed + 3), ['A guest at the back. Everybody say good afternoon to the guest. Now back to it.', 'You can stay. Guests are good for a class: they ask the questions the children are too proud to.', 'Sit as long as you like. The chairs were made for eleven-year-olds, so your knees will tell you when.', 'Spelt, is it. Then you know about leaven, and after the bell you can tell them.'])]));
      });
    }
    await tick();
    // shelves of books on the wall behind the class, drawings on the far wall, a plant, a model on the sill
    const backP = slateLow ? pb : pa, bdir = -sdir;
    const shQ = qm, shW = Math.min(2.4, Math.abs(q1 - q0) - 3.4);
    if (shW > 1.0) {
      L.prop('shelving', backP + bdir * 0.18, shQ, 0, L.yaw(bdir, 0), { w: shW, h: 1.5, d: 0.32, shelves: 3, wood: '#7a5233' });
      s.detail(() => { for (let kk = 0; kk <= 2; kk++) bookRow(L, 'p', backP, bdir, shQ - shW / 2 + 0.05, shQ + shW / 2 - 0.05, 0.105 + kk * (1.5 - 0.11) / 3 + 0.025, lot.seed + kk + k * 5, 0.26); });
    }
    await tick();
    s.deco(() => {
      const wf = L.onWall('q', farQ, -inward);
      for (let p = pa + 0.4; p < pb - 0.6; p += r.f(0.55, 0.8)) { if (side === 'front' && p > wins[fr.indexOf(b)][0] - 0.6 && p < wins[fr.indexOf(b)][1] + 0.1) continue; drawing(g, wf, p, r.f(1.2, 1.5), 0.42, 0.32, lot.seed + k * 101 + Math.round(p * 11)); }
      const wf2 = L.onWall('p', backP, bdir);
      for (let q = Math.min(q0, q1) + 0.5; q < Math.max(q0, q1) - 0.6; q += r.f(0.5, 0.75)) { if (Math.abs(q - shQ) < shW / 2 + 0.1 && shW > 1.0) continue; drawing(g, wf2, q, r.f(1.25, 1.55), 0.4, 0.3, lot.seed + k * 211 + Math.round(q * 17)); }
    });
    L.prop('plant', backP + bdir * 0.5, farQ - inward * 0.6, 0, 0, { kind: r.pick(['broad', 'fern', 'fine']), size: r.pick([0.9, 1.1, 1.3]), pot: r.pick(['#a3563a', '#2f7f86', '#e9b23c']) });
    if (k === 2) L.prop('school.easel', backP + bdir * 0.7, hallQ + inward * 1.6, 0, L.yaw(-bdir, 0), { c: r.pick(KIDS) });
    s.zoneBox({ id: lot.id + '/class' + k, place: 'city-special', box: [clip[0], -0.5, clip[2], clip[3], H, clip[5]], name: small ? 'The small class' : 'A classroom', sub: info.name + ' school · ' + (small ? 'six and seven' : alt(new Rng(lot.seed + k), ['nine and ten', 'eight and nine', 'eleven and twelve', 'ten and eleven'])), ambience: 'school', reverb: 'room', cell: info.key });
  }
  let ck = 0;
  for (const b of fr) if (b.kind === 'class') await classroom(b, 'front', ck++);
  for (const b of backRooms) if (b.kind === 'class') await classroom(b, 'back', ck++);

  // ---------------------------------------------------------------------------------------------------------
  // the teachers' room
  // ---------------------------------------------------------------------------------------------------------
  const T = fr.find((b) => b.kind === 'teach');
  if (T) {
    const pa = T.p0 + (T.p0 < 0.2 ? 0.16 : 0.08), pb = T.p1 - (T.p1 > W - 0.2 ? 0.16 : 0.08), q0 = QF + 0.1, q1 = F - 0.08, pm = (pa + pb) / 2, qm = (q0 + q1) / 2;
    const clip = L.clip(pa, q0, pb, q1, HF);
    roomGlow(s, clip[0], 0, clip[2], clip[3], HF, clip[5], { sky: '#ffdcae', ground: '#a8794f', power: 0.4 });
    L.lamp('globe', pm, qm, 2.5, { drop: 0.7, K: 2700, power: 1.0, clip });
    L.prop('rug', pm, qm, 0, L.yaw(0, 1), { w: Math.min(3, pb - pa - 1.4), d: 2.2, a: C.court2, b: '#e9dcc0' }, { noCollide: true });
    L.prop('table', pm, qm + 0.6, 0, L.yaw(1, 0), { w: 1.6, d: 0.8, wood: '#6b4a2f', top: '#8a6240' });
    for (const [dp, dq] of [[-0.45, -0.6], [0.45, -0.6], [-0.45, 0.6], [0.45, 0.6]]) L.prop('chair', pm + dp, qm + 0.6 + dq * 1.15, 0, L.yaw(0, -Math.sign(dq)), { wood: '#5a3a26', back: r.chance(0.5) ? 'slat' : 'hoop' }, { spot: { tags: ['teachers', 'school', 'rest'] } });
    L.prop('school.armchair', pa + 0.6, q0 + 1.2, 0, L.yaw(1, 0.6), { c: r.pick([PAL.plum, PAL.teal, '#8a2f3c']) });
    L.prop('school.armchair', pb - 0.6, q0 + 1.2, 0, L.yaw(-1, 0.6), { c: r.pick([PAL.indigo, PAL.saffron, '#6b7a3a']) });
    L.prop('counter', pb - 0.4, q1 - 1.6, 0, L.yaw(-1, 0), { w: 1.4, d: 0.55, h: 0.9, body: C.trim, top: '#b98a5a' }, { noSpots: true });
    { const a = L.xz(pb - 0.4, q1 - 1.4); prop(s, 'school.kettle', a[0], 0.9, a[1], L.yaw(-1, 0), {}, { noCollide: true }); }
    L.spot('work', pb - 1.05, q1 - 1.6, 0, L.yaw(1, 0), { tags: ['tea', 'school', 'teachers'] });
    // pigeonholes on the hall wall, one for every teacher, papers in most
    s.furniture(() => {
      const wf = L.onWall('q', q1, -1), u0 = pa + 0.5, cols = Math.max(3, Math.min(7, Math.floor((pb - pa - 2.0) / 0.32)));
      g.mat('wood', '#7a5233'); wf(u0, 1.0, u0 + cols * 0.32, 2.0, 0, 0.3, { bevel: 0.006 });
      g.mat('wood', '#4a3426'); for (let i = 0; i < cols; i++) for (let j = 0; j < 3; j++) wf(u0 + i * 0.32 + 0.02, 1.03 + j * 0.32, u0 + (i + 1) * 0.32 - 0.02, 1.03 + (j + 1) * 0.32 - 0.04, 0.02, 0.301);
      for (let i = 0; i < cols; i++) for (let j = 0; j < 3; j++) if (r.chance(0.6)) { g.mat('paper', r.pick(['#fbf3e0', '#f6efdc', '#eef4f2', '#f3d9a8'])); wf(u0 + i * 0.32 + 0.05, 1.03 + j * 0.32, u0 + (i + 1) * 0.32 - 0.05, 1.03 + j * 0.32 + r.f(0.06, 0.18), 0.05, 0.27); }
    });
    s.zoneBox({ id: lot.id + '/teach', place: 'city-special', box: [clip[0], -0.5, clip[2], clip[3], HF, clip[5]], name: 'The teachers\' room', sub: info.name + ' school · tea on the loop', ambience: 'school', reverb: 'felt', cell: info.key });
  }
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // the warm floor: the smallest ones' room, on loop-warmed boards
  // ---------------------------------------------------------------------------------------------------------
  const Wm = backRooms.find((b) => b.kind === 'warm');
  {
    const pa = Wm.p0 + 0.16, pb = Wm.p1 - 0.08, q0 = hq1 + 0.08, q1 = D - 0.16, pm = (pa + pb) / 2, qm = (q0 + q1) / 2;
    const clip = L.clip(pa, q0, pb, q1, HB);
    roomGlow(s, clip[0], 0, clip[2], clip[3], HB, clip[5], { sky: '#ffd9a8', ground: '#c9745a', power: 0.5 });
    L.lamp('lantern', pm - (pb - pa) * 0.22, qm, 2.45, { tint: PAL.saffron, clip, power: 0.7, drop: 0.6 });
    L.lamp('lantern', pm + (pb - pa) * 0.22, qm + 0.6, 2.4, { tint: C.court2, clip, power: 0.6, drop: 0.7 });
    s.structure(() => {
      const wf = L.onWall('p', pa, 1);
      for (let q = q0 + 0.3, k = 0; q < q1 - 0.4; q += 1.3, k++) { g.mat('felt', [PAL.saffron, C.court, PAL.plum, PAL.leaf][k % 4]); wf(q, 1.15, Math.min(q1 - 0.2, q + 1.15), 2.9, 0, 0.05, { bevel: 0.015 }); }
      // the Hollow, painted low along the back wall where the small can touch it: green floor rising at both ends, the lake, trees
      const wb = L.onWall('q', q1, -1), u0 = pa + 0.3, u1 = pb - 0.3;
      g.mat('paint', '#7cb55a'); wb.flat(u0, 0.25, u1, 0.5, 0); wb.flat(u0, 0.5, u0 + 0.8, 0.75, 0); wb.flat(u1 - 0.8, 0.5, u1, 0.75, 0);
      g.mat('paint', '#3f8fc8'); wb.flat((u0 + u1) / 2 - 0.7, 0.3, (u0 + u1) / 2 + 0.5, 0.45, 0.003);
      for (let u = u0 + 0.5; u < u1 - 0.4; u += 0.9) { g.mat('paint', '#6b4a2f'); wb.flat(u - 0.03, 0.5, u + 0.03, 0.72, 0.003); g.mat('paint', '#3f7a3a'); wb.flat(u - 0.16, 0.7, u + 0.16, 0.98, 0.003); }
    });
    // the loop under the floor shows as a brass grille along the walls, and the pipes come up at the corner
    s.structure(() => {
      g.mat('grille', '#c8a45a'); L.bx(pa, q1 - 0.3, 0.0, pb, q1 - 0.02, 0.012, { faces: 'Y' });
      g.mat('cast', '#b87333', { rough: -0.2 }); for (const dq of [0.08, 0.2]) { const a = L.xz(pa + 0.12, q1 - dq), b = L.xz(pa + 0.12, q0 + 0.6); g.tube([[a[0], 0.12, a[1]], [b[0], 0.12, b[1]], [b[0], HB, b[1]]], 0.03, { segs: 8 }); }
    });
    // soft floor: big rugs, cushions in a ring, beanbags, low tables
    L.prop('rug', pm, qm, 0, L.yaw(1, 0), { w: Math.min(4.2, pb - pa - 1.2), d: Math.min(3.4, q1 - q0 - 2.2), a: PAL.saffron, b: C.court2, mat: 'weave' }, { noCollide: true });
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, p = pm + Math.cos(a) * 1.25, q = qm + Math.sin(a) * 1.0; L.prop('school.cushion', p, q, 0, 0, { a: KIDS[i % KIDS.length], b: '#f6ecd6', patch: i % 3 ? null : PAL.leaf }, { spot: { tags: ['kids', 'small', 'floor', 'school'] } }); }
    L.prop('school.lowtable', pa + 1.3, q0 + 1.3, 0, L.yaw(0, 1), { w: 1.2, d: 0.6, h: 0.46, top: PAL.saffron });
    L.prop('school.lowtable', pb - 1.4, q1 - 1.2, 0, L.yaw(1, 0), { w: 1.1, d: 0.6, h: 0.46, top: C.court });
    L.prop('school.beanbag', pb - 0.8, q0 + 1.2, 0, L.yaw(-1, 1), { c: PAL.plum, patch: PAL.saffron });
    L.prop('school.armchair', pa + 0.7, q1 - 0.8, 0, L.yaw(1, -1), { c: '#6b7a3a' });
    for (let i = 0; i < 4; i++) { const a = L.xz(pa + 1.0 + i * 0.35, q0 + 1.3 + (i % 2) * 0.12); prop(s, 'school.blocks', a[0], 0.46, a[1], r.f(0, 3), { seed: 1 + i, n: 2 + i % 3, s: 0.05 }, { noCollide: true }); }
    for (let i = 0; i < 5; i++) { const a = L.xz(pm + r.f(-1.6, 1.6), qm + r.f(-1.2, 1.2)); prop(s, 'school.blocks', a[0], 0.014, a[1], r.f(0, 3), { seed: 6 + i, n: 1 + i % 3, s: 0.07, arch: i === 2 }, { noCollide: true }); }
    // a low shelf of toys along the side wall
    L.prop('shelving', pb - 0.2, qm, 0, L.yaw(-1, 0), { w: Math.min(2.6, q1 - q0 - 2.4), h: 0.9, d: 0.32, shelves: 2, wood: '#a8794f' });
    for (let i = 0; i < 6; i++) { const a = L.xz(pb - 0.3, qm - 1.0 + i * 0.4); prop(s, 'crate', a[0], 0.1 + (i % 2) * 0.43, a[1], L.yaw(-1, 0), { w: 0.3, h: 0.2, d: 0.24, wood: KIDS[i % KIDS.length] }, { noCollide: true }); }
    // small shoes in a row by the door: shoes off on a warm floor
    s.detail(() => { for (let i = 0; i < 9; i++) { const p = Wm.door - 1.6 + i * 0.22, a = L.xz(p, q0 + 0.25); g.mat('weave', KIDS[(i * 5) % KIDS.length]); g.box(a[0] - 0.04, 0, a[1] - 0.07, a[0] + 0.04, 0.05, a[1] + 0.07, { bevel: 0.015 }); } });
    s.deco(() => {
      const wf = L.onWall('q', q1, -1);
      for (let p = pa + 0.4; p < pb - 0.6; p += r.f(0.5, 0.7)) drawing(g, wf, p, r.f(1.2, 1.45), 0.38, 0.3, lot.seed * 3 + Math.round(p * 7), r.pick([0, 1, 5, 6]));
    });
    for (let i = 0; i < 4; i++) L.spot('play', pm + r.f(-1.8, 1.8), qm + r.f(-1.2, 1.2), 0, r.f(-3, 3), { tags: ['kids', 'small', i % 2 ? 'floor' : 'hop', 'school'] });
    L.spot('stand', pm + 0.8, q0 + 1.0, 0, L.yaw(0, 1), { tags: ['mind', 'school', 'small'] });
    const minder = NAMES[(r.i(0, NAMES.length - 1) + 9) % NAMES.length];
    const mLines = alt(r, [
      ['The floor is on the loop, the same water that warms the baths. Shoes off at the door, socks if you like. They sleep better on a warm floor, and so do I.'],
      ['Seven of them today, the smallest eleven months. The aunts start coming at half past three and take them home one table at a time.'],
      ['The blocks are older than me. Every one has been chewed by somebody who now has children of their own, and some of those children are on this rug.'],
      ['Quiet voices in here. In this air a shout runs round a bare room twice before it stops, which is why the walls are felt and the floor is soft.'],
    ]);
    L.act(pm + 0.8, q0 + 1.6, 1.2, 1.6, 'Ask the minder on the warm floor', (gm) => say2(gm, minder + ', minding', mLines));
    s.zoneBox({ id: lot.id + '/warm', place: 'city-special', box: [clip[0], -0.5, clip[2], clip[3], HB, clip[5]], name: 'The warm floor', sub: info.name + ' school · the smallest ones', ambience: 'school', reverb: 'felt', cell: info.key });
  }
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // the entrance: pegs at three heights on both walls, a mat, the aunts waiting
  // ---------------------------------------------------------------------------------------------------------
  {
    const clip = L.clip(pe0 + 0.08, qi, pe1 - 0.08, F + 1.0, HF);
    roomGlow(s, clip[0], 0, clip[2], clip[3], HF, clip[5], { sky: '#ffe2b8', ground: '#e0d0b4', power: 0.38 });
    L.lamp('globe', doorP, (qi + F) / 2, 2.45, { K: 2800, clip, power: 1.0, drop: 0.7, r: 0.2 });
    pegs(L, 'p', pe0 + 0.08, 1, qi + 0.4, F - 0.4, lot.seed + 1);
    pegs(L, 'p', pe1 - 0.08, -1, qi + 0.4, F - 0.4, lot.seed + 2);
    s.structure(() => { g.mat('rush', '#a88c5a'); L.bx(doorP - 1.4, qi + 0.05, 0, doorP + 1.4, qi + 1.2, 0.012); g.mat('terrazzo', C.court); L.bx(pe0 + 0.5, F - 0.6, 0, pe1 - 0.5, F - 0.48, 0.003, { faces: 'Y' }); });
    s.deco(() => { for (const [c, sg] of [[pe0 + 0.08, 1], [pe1 - 0.08, -1]]) { const wf = L.onWall('p', c, sg); for (let q = qi + 0.4; q < F - 0.8; q += 0.6) drawing(g, wf, q, 2.1, 0.46, 0.34, lot.seed + Math.round(q * 31) + sg); } });
    for (const dq of [0.8, 2.0, 3.2]) { L.spot('stand', doorP - 1.2, qi + dq, 0, L.yaw(0.3, 1), { tags: ['wait', 'school', 'aunt'] }); L.spot('stand', doorP + 1.2, qi + dq + 0.4, 0, L.yaw(-0.3, 1), { tags: ['wait', 'school', 'aunt'] }); }
    for (let i = 0; i < 4; i++) L.spot('play', doorP + r.f(-1.6, 1.6), qi + 1.5 + i * 1.0, 0, r.f(-3, 3), { tags: ['kids', 'pegs', 'school', 'hop'] });
    s.zoneBox({ id: lot.id + '/entrance', place: 'city-special', box: [clip[0], -0.5, clip[2], clip[3], HF, clip[5] - 1.0], name: info.name + ' school', sub: 'the pegs · ' + info.avenue, ambience: 'school', reverb: 'room', cell: info.key });
  }
  // the porch: aunts wait here at half past three
  for (const dp of [-1.8, 1.8]) L.spot('stand', doorP + dp, QF + 1.0, 0, L.yaw(0, 1), { tags: ['wait', 'school', 'aunt'] });
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // the hall's life: children all over the court at half past three, teachers and aunts at the edges
  // ---------------------------------------------------------------------------------------------------------
  const tags = ['run', 'catch', 'hop', 'spin', 'catch', 'run'];
  for (let i = 0; i < 18; i++) L.spot('play', r.f(cp0 + 1, cp1 - 1), r.f(cq0 + 0.6, cq1 - 0.6), 0, r.f(-3, 3), { tags: ['kids', tags[i % tags.length], 'school', 'hall'] });
  for (let i = 0; i < 3; i++) L.spot('play', W - 6 - i * 1.4, hq1 - 3.0 - (i % 2), 0, L.yaw(1, 0), { tags: ['kids', 'school', 'physics', 'hop'] });
  L.spot('stand', W / 2 + 3.2, cq0 - 0.7, 0, L.yaw(-0.4, 1), { tags: ['teach', 'school', 'referee'] });
  L.spot('stand', TP + anti[0] * 1.0 - 0.6, TQ + anti[1] * 1.0 - 0.9, 0, L.yaw(0.5, 0.5), { tags: ['teach', 'school', 'physics'] });
  for (const p of [cp0 + 1, cp1 - 1.5]) L.spot('stand', p, cq1 + 0.7, 0, L.yaw(0, -1), { tags: ['watch', 'school', 'hall'] });
  // group of aunts talking near the entrance mouth
  { const cx = doorP + 2.6, cq = F + 1.6; for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.4, p = cx + Math.cos(a) * 0.7, q = cq + Math.sin(a) * 0.7; L.spot('chat', p, q, 0, L.yaw(cx - p, cq - q), { tags: ['school', 'aunt', 'hall'] }); } }
  const kids = s.loop('kids', ...(() => { const a = L.xz(W / 2, hm); return [a[0], 1.4, a[1]]; })(), { vol: 0.35, radius: 30 });
  s.every((dt, gm) => { if (!gm || !gm.clock || !kids.set) return; const h = gm.clock.hours, on = h > 8 && h < 19; kids.set({ vol: on ? (h > 15.2 && h < 17.5 ? 0.5 : 0.28) : 0.0 }); });

  // ---------------------------------------------------------------------------------------------------------
  await tick();
  // walkways: in through the porch, down the hall, into every room
  // ---------------------------------------------------------------------------------------------------------
  L.path([[doorP, -0.7], [doorP, 1.2], [doorP, qi + 0.6], [doorP, F + 1.2], [doorP, hm]], { width: 1.6 });
  const spine = [...new Set([1.8, W - 1.8].concat(doors).concat(bays(1.8, W - 1.8, 3).map((b) => b[0])).map((p) => Math.round(p * 10) / 10))].sort((a, b) => a - b).filter((p, i, a) => i === 0 || p - a[i - 1] > 0.75);
  L.path(spine.map((p) => [p, hm]), { width: 1.8 });
  await tick();
  for (const b of fr) L.path([[b.door, hm], [b.door, F + 0.8], [b.door, F - 1.0], [(b.p0 + b.p1) / 2, (QF + F) / 2]], { width: 1.1 });
  for (const b of backRooms) L.path([[b.door, hm], [b.door, hq1 - 0.8], [b.door, hq1 + 1.0], [(b.p0 + b.p1) / 2, (hq1 + D) / 2]], { width: 1.1 });
  L.path([[TP + anti[0] * 1.6, hm], [TP + anti[0] * 1.6, TQ - 1.0]], { width: 1.2 });
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // zones
  // ---------------------------------------------------------------------------------------------------------
  s.zoneBox({ id: lot.id, place: 'city-special', box: [lot.x0, -0.5, lot.z0, lot.x1, HB, lot.z1], name: info.name + ' school', sub: info.name + ' · ' + sub, ambience: 'school', reverb: 'room', cell: info.key });
  s.zoneBox({ id: lot.id + '/hall', place: 'city-special', box: [clipH[0], -0.5, clipH[2], clipH[3], HH, clipH[5]], name: 'The long hall', sub: info.name + ' school · spinball, broth, the drop tower', ambience: 'school', reverb: 'hall', headroom: HH - 0.4, cell: info.key });
  void note;
}

registerLot('special.school', buildSchool);
registerLot('special.playhall', buildPlayhall);
registerLot('special.cradle', buildCradle);
registerLot('special.naming', buildNaming);

// a place record so the file is loaded; it builds nothing itself
export const place = { id: 'lots-school', name: 'Lots: the school, the play hall, the cradle arcade, the naming rooms', order: 2, always: true, build() {} };
