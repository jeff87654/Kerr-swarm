// The play hall (special.playhall): one tall hall for after school. A climbing wall up the end, ropes from the roof beam,
// two slides off a tower at the back (one runs spinward and comes down faster), a spinball court with its rings, a timing
// board lit over everything, a soft room for the small behind glass, and benches for whoever is minding.
// Palette: pale birch ply, ochre and teal felt, the court's red lines; a strong accent per block on the slides and the board.
import { say, note } from '../city/lots.js';
import { roomGlow, warm, stairs } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';
import { PAL } from './school_parts.js';
import { local, front, drawing, digits, banners, pegs, alt, KIDS, QF } from './lots_school_kit.js';

const SCHEMES = [
  { face: '#d9a05b', inner: '#f2e6cc', plinth: '#2f7f86', trim: '#1f4f5a', accent: '#e2553a', porchFloor: '#c98b5e', hall: '#efe8d8', floor: '#d6b07a', felt: ['#e9b23c', '#2f7f86', '#e2553a', '#7cab4e'], slide: '#e2553a', slide2: '#2f7f86' },
  { face: '#b9c4a0', inner: '#eef0dc', plinth: '#33407a', trim: '#26306b', accent: '#e9b23c', porchFloor: '#a8794f', hall: '#f0ecdc', floor: '#d8b282', felt: ['#2f3f7a', '#e9b23c', '#8a4a6a', '#5fb3b3'], slide: '#e9b23c', slide2: '#8a4a6a' },
  { face: '#e0b8a0', inner: '#f6e8d6', plinth: '#8a2f3c', trim: '#4a2a26', accent: '#5fb3b3', porchFloor: '#b9634a', hall: '#f3e8d8', floor: '#dab07c', felt: ['#8a2f3c', '#5fb3b3', '#e9b23c', '#2f3f7a'], slide: '#5fb3b3', slide2: '#e2553a' },
];
const NAMES = ['Ruth', 'Okon', 'Pilar', 'Henrik', 'Sadia', 'Wen', 'Marcus', 'Efua', 'Lars', 'Nadia', 'Taiwo', 'Ilka'];
const r2 = (x) => (Math.round(x * 100) / 100).toFixed(2);

export async function buildPlayhall(s, lot, plan, game, tick) {
  const L = local(s, lot), r = new Rng(lot.seed ^ 0x51ed), info = plan.info, g = s.g, W = L.W, D = L.D;
  const C = SCHEMES[r.i(0, SCHEMES.length - 1)];
  const F = 7.6, HH = 6.9, HF = 3.2, E = 6.4, pe0 = Math.round((W - E) / 2 * 2) / 2, pe1 = pe0 + E;
  const DADO = { h: 1.1, mat: 'felt', tint: shadeHex(C.felt[1], 0.85) };
  const minderName = NAMES[r.i(0, NAMES.length - 1)];

  // ---------------------------------------------------------------------------------------------------------
  // the front, the shell
  // ---------------------------------------------------------------------------------------------------------
  const softW = [0.0, pe0], mindW = [pe1, W];
  const wins = [[1.0, pe0 - 1.0, 0.6, 2.3], [pe1 + 1.0, W - 1.0, 0.8, 2.3]];
  const FR = await front(L, { name: 'PLAY HALL', sub: alt(r, ['slides · ropes · the wall · spinball', 'after school until lamp-night', info.name + ' · ropes, slides and a timing board', 'open till eight · minders welcome']), seed: lot.seed, porchW: E, porchAt: pe0, porchD: 1.9, windows: wins,
    pal: { face: C.face, inner: C.inner, plinth: C.plinth, trim: C.trim, accent: C.accent, porchFloor: C.porchFloor }, stripe: C.felt, lanterns: [C.accent, C.felt[1]] }, tick);
  const qi = FR.qIn, doorP = FR.doorP;
  s.deco(() => { const wf = L.onWall('q', QF + 0.1, -1); for (const w of wins) for (let p = w[0] + 0.2; p < w[1] - 0.6; p += r.f(0.7, 1.3)) if (r.chance(0.6)) drawing(g, wf, p, r.f(0.9, 1.3), 0.42, 0.32, lot.seed + Math.round(p * 9)); });
  L.floor(0, QF, pe0, F, 0, 'carpet', '#c97a5a'); L.floor(pe1, QF, W, F, 0, 'planks', '#a8794f'); L.floor(pe0, qi, pe1, F, 0, 'speckle', '#b9634a');
  L.floor(0, F, W, D, 0, 'planks', C.floor);
  L.ceil(0, QF, W, F, HF, 'paint', '#f3ead8'); L.ceil(0, F, W, D, HH, 'panel', '#cdc6b8');
  for (const p of [0.08, W - 0.08]) { L.wallP(p, QF + 0.08, F - 0.08, HF, { tint: C.inner, dado: DADO }); L.wallP(p, F - 0.08, D - 0.08, HH, { tint: C.hall, dado: DADO }); }
  L.wallQ(D - 0.08, 0.16, W - 0.16, HH, { tint: C.hall, dado: DADO });
  L.wallP(pe0, qi, F - 0.08, HF, { tint: C.inner, dado: DADO }); L.wallP(pe1, qi, F - 0.08, HF, { tint: C.inner, dado: DADO });
  // the hall's front wall: the lobby's wide mouth, big windows from the soft room and the minders' room
  const fOpen = [{ at: pe0 + 0.9, w: E - 1.8, h: 2.6 }, { at: 1.2, w: Math.max(2, pe0 - 4.0), sill: 0.55, h: 1.75 }, { at: pe0 - 2.2, w: 1.2, h: 2.15 }, { at: pe1 + 1.0, w: 1.1, h: 2.15 }, { at: pe1 + 2.8, w: Math.max(2, W - pe1 - 4.0), sill: 0.9, h: 1.4 }];
  L.wallQ(F, 0.16, W - 0.16, HH, { deep: C.hall, shallow: C.inner, dado: DADO, openings: fOpen.map((x) => Object.assign({}, x, { at: x.at - 0.16 })) });
  for (const x of fOpen) { if (x.sill) { const a = L.xz(x.at, F), b = L.xz(x.at + x.w, F); s.glass(a[0], x.sill, a[1], b[0], x.sill + x.h, b[1], { opacity: 0.1 }); } else if (x.w < 2) L.frame(x.at + x.w / 2, F, x.w, x.h, 'p', { tint: C.trim }); }
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // the hall: light, felt, the stripe, banners
  // ---------------------------------------------------------------------------------------------------------
  const clipH = L.clip(0.16, F, W - 0.16, D - 0.16, HH), hm = (F + D) / 2;
  roomGlow(s, clipH[0], 0, clipH[2], clipH[3], HH, clipH[5], { sky: '#ffeccc', ground: '#d6b07a', power: 0.6 });
  const nl = Math.max(4, Math.round(W / 9));
  for (let i = 0; i < nl; i++) L.lamp('globe', W * (i + 0.5) / nl, hm - 2 + (i % 2) * 4, 5.0, { r: 0.42, drop: 1.8, K: 3100, power: 2.5, range: 13, clip: clipH });
  s.structure(() => {
    g.mat('wood', '#7a5233'); for (let p = 2.5; p < W - 1; p += 4.5) L.bx(p - 0.13, F, HH - 0.42, p + 0.13, D - 0.16, HH, { bevel: 0.01 });
    for (const [q, sg] of [[F + 0.08, 1], [D - 0.16, -1]]) { const wf = L.onWall('q', q, sg); for (let p = 0.6, k = 0; p < W - 3; p += 3.2, k++) { g.mat('felt', C.felt[k % 4]); wf(p, 3.6, p + 2.5, 6.0, 0, 0.06, { bevel: 0.02 }); } }
  });
  s.deco(() => banners(L, 2, W - 2, hm, HH - 0.45, Math.max(3, Math.round(W / 9)), C.felt, 1.2));

  // ---------------------------------------------------------------------------------------------------------
  // the climbing wall, up the end of the hall, with mats under it
  // ---------------------------------------------------------------------------------------------------------
  const cwq0 = F + 1.6, cwq1 = D - 1.6;
  s.furniture(() => {
    const wf = L.onWall('p', 0.16, 1);
    g.mat('wood', '#e3cfa8', { rough: -0.05 }); wf(cwq0, 0.15, cwq1, 6.4, 0, 0.06, { bevel: 0.01 });
    // each route's band painted pale in its colour, so you can see the way up from the door
    const routes = Math.max(4, Math.floor((cwq1 - cwq0) / 2.2));
    for (let k = 0; k < routes; k++) { g.mat('paint', mixHex(KIDS[(k * 2) % KIDS.length], '#f1e6cc', 0.62)); wf(cwq0 + (cwq1 - cwq0) * k / routes + 0.06, 0.15, cwq0 + (cwq1 - cwq0) * (k + 1) / routes - 0.06, 6.4, 0.06, 0.064); }
    g.mat('wood', '#c9b088'); for (let q = cwq0 + 1.22; q < cwq1 - 0.1; q += 1.22) wf(q - 0.01, 0.15, q + 0.01, 6.4, 0.06, 0.065);
    for (let y = 1.37; y < 6.3; y += 1.22) wf(cwq0, y - 0.01, cwq1, y + 0.01, 0.06, 0.065);
  });
  s.detail(() => {
    // routes: each its own colour, from easy at the near end to hard at the far end
    const routes = Math.max(4, Math.floor((cwq1 - cwq0) / 2.2));
    for (let k = 0; k < routes; k++) {
      const col = KIDS[(k * 2) % KIDS.length], qc = cwq0 + (cwq1 - cwq0) * (k + 0.5) / routes;
      g.mat('paint', col, { rough: 0.2 });
      for (let y = 0.4; y < 6.2; y += r.f(0.3, 0.5) + k * 0.025) {
        const q = qc + r.f(-0.75, 0.75), sz = r.f(0.08, 0.16) * (k < 2 ? 1.2 : 1), a = L.xz(0.22, q);
        g.ball(a[0], y, a[1], sz * (L.alongX ? 0.55 : 1), sz * 0.8, sz * (L.alongX ? 1 : 0.55), { segs: 7, rings: 4 });
      }
      // one or two big wedges per route, for resting on
      for (const y of [1.8 + k * 0.3, 4.2 - k * 0.2]) { const wv = L.onWall('p', 0.22, 1), q = qc + r.f(-0.5, 0.5); g.mat('paint', shadeHex(col, 0.85)); wv(q - 0.25, y, q + 0.25, y + 0.3, 0, 0.16, { bevel: 0.03 }); }
    }
    // the bell at the top of the wall
    const b = L.xz(0.4, (cwq0 + cwq1) / 2); g.mat('cast', '#c8a45a', { rough: -0.3 }); g.lathe(b[0], b[1], [[0.13, 6.4], [0.11, 6.5], [0.06, 6.62], [0.0, 6.64]], { segs: 14 });
  });
  for (let q = cwq0 + 0.9; q < cwq1 - 0.5; q += 2.0) L.prop('lots-school.mat', 1.4, q, 0, L.yaw(1, 0), { c: C.felt[(Math.round(q) % 4)], w: 2.0, d: 2.0, h: 0.2 });
  s.light({ at: (() => { const a = L.xz(4.5, (cwq0 + cwq1) / 2); return [a[0], HH - 0.4, a[1]]; })(), type: 'spot', dir: (() => { const d = [-L.Pv[0] * 0.55, -0.83, -L.Pv[1] * 0.55]; return d; })(), cone: [55, 30], color: warm(3600), power: 16, range: 11, shadow: false, lamp: true, clip: clipH });
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // ropes from a beam, with a mat under each
  // ---------------------------------------------------------------------------------------------------------
  const rp = Math.min(8.5, W * 0.2), rq0 = F + 2.0, nRopes = 5;
  s.structure(() => { g.mat('cast', '#3a4a45'); L.bx(rp - 0.12, rq0 - 0.8, HH - 0.7, rp + 0.12, rq0 + nRopes * 1.3, HH - 0.42); });
  for (let i = 0; i < nRopes; i++) { const q = rq0 + i * 1.3; L.prop('lots-school.rope', rp, q, 0, 0, { h: HH - 0.7, c: i % 2 ? '#d8c49a' : '#c9b07a' }); L.prop('lots-school.mat', rp, q, 0, L.yaw(0, 1), { c: C.felt[i % 4], w: 1.2, d: 1.2, h: 0.14 }); }
  s.detail(() => { for (let i = 0; i < nRopes; i++) { const a = L.xz(rp, rq0 + i * 1.3); g.mat('paint', KIDS[i * 2 % KIDS.length]); g.box(a[0] - 0.05, HH - 1.05, a[1] - 0.05, a[0] + 0.05, HH - 0.95, a[1] + 0.05); } });

  // ---------------------------------------------------------------------------------------------------------
  // the slide tower: a platform three metres up, a stair to it, two chutes down (one spinward, one anti or along the axis)
  // ---------------------------------------------------------------------------------------------------------
  const tp = Math.max(9.5, Math.min(W * 0.36, W - 24)), tq = D - 2.4, TY = 3.0, SL = 6.2;
  const spinDot = (dp) => dp * L.spin[0];                     // +1: going +p is spinward
  const heading = (dp) => Math.abs(L.spin[0]) > 0.5 ? (spinDot(dp) > 0 ? 'spinward' : 'anti') : 'axis';
  s.furniture(() => {
    g.mat('paint', C.trim);
    for (const dp of [-1.1, 1.1]) for (const dq of [-1.1, 1.1]) L.bx(tp + dp - 0.07, tq + dq - 0.07, 0, tp + dp + 0.07, tq + dq + 0.07, TY + 1.05, { bevel: 0.01 });
    g.mat('wood', '#c9a46a', { rough: -0.05 }); L.bx(tp - 1.2, tq - 1.2, TY - 0.12, tp + 1.2, tq + 1.2, TY, { bevel: 0.01 });
    g.mat('paint', C.accent); L.bx(tp - 1.22, tq - 1.22, TY - 0.3, tp + 1.22, tq + 1.22, TY - 0.12);
    // the canopy: four posts on up, a striped cloth roof pitched along the slides
    g.mat('paint', C.trim); for (const dp of [-1.1, 1.1]) for (const dq of [-1.1, 1.1]) L.bx(tp + dp - 0.05, tq + dq - 0.05, TY + 1.05, tp + dp + 0.05, tq + dq + 0.05, TY + 2.0);
    for (let i = 0; i < 6; i++) {
      const q0 = tq - 1.35 + i * 0.45, q1 = q0 + 0.45, cA = L.xz(tp - 1.35, q0), cB = L.xz(tp - 1.35, q1), cC = L.xz(tp, q1), cD = L.xz(tp, q0), cE = L.xz(tp + 1.35, q0), cF = L.xz(tp + 1.35, q1);
      g.mat('weave', i % 2 ? '#f1ead8' : C.slide);
      g.quad([cA[0], TY + 1.95, cA[1]], [cB[0], TY + 1.95, cB[1]], [cC[0], TY + 2.55, cC[1]], [cD[0], TY + 2.55, cD[1]], { double: true });
      g.quad([cD[0], TY + 2.55, cD[1]], [cC[0], TY + 2.55, cC[1]], [cF[0], TY + 1.95, cF[1]], [cE[0], TY + 1.95, cE[1]], { double: true });
    }
    // painted panels between the posts under the platform
    for (const dq of [-1.12, 1.12]) for (let k = 0; k < 3; k++) { g.mat('paint', C.felt[(k + (dq > 0 ? 1 : 0)) % 4]); L.bx(tp - 1.0 + k * 0.7, tq + dq - 0.02, 0.3, tp - 0.4 + k * 0.7, tq + dq + 0.02, TY - 0.45); }
  });
  L.solid(tp - 1.2, tq - 1.2, TY - 0.3, tp + 1.2, tq + 1.2, TY);
  for (const dp of [-1.1, 1.1]) for (const dq of [-1.1, 1.1]) { const a = L.xz(tp + dp, tq + dq); s.post(a[0], a[1], 0.07, 0, TY - 0.3); }
  // the stair up from the hall side
  { const run = 4.4, a = L.xz(tp, tq - 1.2 - run); stairs(s, a[0], 0, a[1], L.face(0, 1), TY, run, 1.0, { mat: 'wood', tint: '#b98a5a', nosing: C.accent }); }
  // railings round the platform, leaving the stair and the two chute mouths open
  { const P = (p, q) => L.xz(p, q);
    railing(s, [P(tp - 1.15, tq - 1.15), P(tp - 1.15, tq - 0.4)], TY, { h: 0.95, tint: C.trim, rail: C.accent });
    railing(s, [P(tp - 1.15, tq + 0.4), P(tp - 1.15, tq + 1.15), P(tp + 1.15, tq + 1.15), P(tp + 1.15, tq + 0.4)], TY, { h: 0.95, tint: C.trim, rail: C.accent });
    railing(s, [P(tp + 1.15, tq - 0.4), P(tp + 1.15, tq - 1.15), P(tp + 0.55, tq - 1.15)], TY, { h: 0.95, tint: C.trim, rail: C.accent });
    railing(s, [P(tp - 0.55, tq - 1.15), P(tp - 1.15, tq - 1.15)], TY, { h: 0.95, tint: C.trim, rail: C.accent });
  }
  // the chutes
  const ang = Math.atan2(TY - 0.4, SL), Ls = Math.hypot(TY - 0.4, SL);
  const slides = [];
  for (const sg of [-1, 1]) {
    const p0 = tp + sg * 1.2, col = sg > 0 ? C.slide : C.slide2, a = L.xz(p0, tq), yaw = L.yaw(sg, 0);
    s.furniture(() => {
      g.at(a[0], TY, a[1], yaw); g.rotX(ang);
      g.mat('paint', col, { rough: -0.25 }); g.box(-0.33, -0.06, 0, 0.33, 0.0, Ls, { bevel: 0.01 });
      g.mat('paint', shadeHex(col, 0.8)); g.box(-0.36, -0.06, 0, -0.3, 0.3, Ls, { bevel: 0.01 }); g.box(0.3, -0.06, 0, 0.36, 0.3, Ls, { bevel: 0.01 });
      g.mat('brushed', '#cfcac0', { rough: -0.3 }); g.box(-0.3, 0.0, 0.05, 0.3, 0.004, Ls - 0.05);
      g.pop();
      // the run-out at the bottom and the legs
      const b = L.xz(p0 + sg * SL, tq);
      g.mat('paint', col); g.at(b[0], 0, b[1], yaw); g.box(-0.36, 0, 0, 0.36, 0.4, 0.8, { bevel: 0.02 }); g.mat('brushed', '#cfcac0'); g.box(-0.3, 0.4, 0, 0.3, 0.404, 0.8); g.pop();
      g.mat('paint', C.trim); for (const t of [0.35, 0.7]) { const c = L.xz(p0 + sg * SL * t, tq); const y = TY - (TY - 0.4) * t; g.box(c[0] - 0.05, 0, c[1] - 0.05, c[0] + 0.05, y - 0.08, c[1] + 0.05); }
    });
    { const b0 = L.xz(p0, tq - 0.36), b1 = L.xz(p0 + sg * (SL + 0.8), tq + 0.36), x0 = Math.min(b0[0], b1[0]), x1 = Math.max(b0[0], b1[0]), z0 = Math.min(b0[1], b1[1]), z1 = Math.max(b0[1], b1[1]);
      const lowEndIsStart = (L.alongX ? (b0[0] < b1[0]) : (b0[1] < b1[1]));
      const rb = L.xz(p0 + sg * SL, tq), xm = L.alongX ? rb[0] : null, zm = L.alongX ? null : rb[1];
      // the chute itself is walkable (people walk up the stair and slide down, the player too)
      if (L.alongX) { if (lowEndIsStart) s.ramp(x0, z0, xm, z1, TY, 0.4, 'x'); else s.ramp(xm, z0, x1, z1, 0.4, TY, 'x'); }
      else { if (lowEndIsStart) s.ramp(x0, z0, x1, zm, TY, 0.4, 'z'); else s.ramp(x0, zm, x1, z1, 0.4, TY, 'z'); }
      const e = L.box(p0 + sg * SL, tq - 0.36, p0 + sg * (SL + 0.8), tq + 0.36); s.solid(e[0], 0, e[1], e[2], 0.4, e[3]);
    }
    slides.push({ sg, p0, head: heading(sg), col });
  }
  // walls of colour behind the tower: the slide tower's own banner
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // the timing board, high on the back wall over the tower, lit; four rows: the two slides, the rope, the wall
  // ---------------------------------------------------------------------------------------------------------
  const base = 2.4 + r.f(-0.12, 0.12), dn = (h) => Math.sqrt(2 * h / (9.81 * info.g));
  const tSpin = base * (1 - 0.03), tAnti = base * (1 + 0.03), tRope = r.f(7.2, 9.8), tWall = r.f(36, 58);
  const rowsT = slides.map((sl) => [sl.col, sl.head === 'anti' ? tAnti : sl.head === 'spinward' ? tSpin : base]).concat([[KIDS[4], tRope], [KIDS[5], tWall]]);
  const BW = 4.4, BH = 2.5, bu0 = Math.min(W - BW - 1.5, tp + SL + 1.6), bv0 = 3.7;
  s.structure(() => {
    const wf = L.onWall('q', D - 0.16, -1);
    g.mat('wood', '#3a2d22'); wf(bu0 - 0.1, bv0 - 0.1, bu0 + BW + 0.1, bv0 + BH + 0.1, 0, 0.06, { bevel: 0.01 });
    g.mat('plain', '#141615'); wf(bu0, bv0, bu0 + BW, bv0 + BH, 0.06, 0.07);
    g.mat('cast', '#c8a45a', { rough: -0.2 }); wf(bu0 - 0.1, bv0 + BH + 0.1, bu0 + BW + 0.1, bv0 + BH + 0.16, 0, 0.08);
  });
  s.deco(() => {
    const wf = L.onWall('q', D - 0.16 - 0.06, -1);
    const left = wf.ltr ? bu0 : bu0 + BW, R = (a, b, y0, y1, d) => { if (wf.ltr) wf.flat(left + a, y0, left + b, y1, d); else wf.flat(left - b, y0, left - a, y1, d); };
    rowsT.forEach((rw, i) => {
      const v = bv0 + BH - 0.58 - i * 0.58;
      g.mat('diffuser', rw[0], { emissive: 1.6, lamp: true }); R(0.2, 1.3, v, v + 0.38, 0.012);
      digits(g, wf, rw[1] >= 10 ? rw[1].toFixed(1) : r2(rw[1]), wf.ltr ? left + 1.9 : left - 1.9, v, 0.38, '#ffcf6a', 2.6);
    });
  });
  const tbLines = alt(r, [
    'The spinward slide is always the faster. Going spinward you weigh a little more, so you come down a little harder. Every child in the block knows it, and every child tries the anti slide anyway, in case.',
    'The board has numbers and no letters. Which colour is which is chalked on the wall under it, and the names of the record holders beside that, rubbed out and chalked again about once a week.',
    'The times are taken by a beam of light at the top and another at the bottom. The board was made in the block\'s workshop out of a lift lobby\'s old deck counter.',
    'Under the board, in a teacher\'s hand: Times are for beating, not for crying. Under that, in a child\'s: some crying allowed.',
  ]);
  const nmSl = (sl) => sl.head === 'axis' ? (sl.sg > 0 ? 'the red-side slide' : 'the other slide') : 'the ' + sl.head + ' slide';
  L.act(bu0 + BW / 2, tq - 3.0, 1.6, 3.2, 'Read the timing board', (gm) => say(gm, 'The timing board', ['This week\'s best: ' + nmSl(slides[1]) + ' ' + r2(rowsT[1][1]) + ' seconds, ' + nmSl(slides[0]) + ' ' + r2(rowsT[0][1]) + ', the rope to the knot at the top ' + rowsT[2][1].toFixed(1) + ', the wall to the bell ' + rowsT[3][1].toFixed(1) + '.', tbLines]));
  // going down a slide: the player rides the chute, and the board's beam times it
  // one ride at a time, moved along by one per-frame update that lives as long as the block
  const ride = { on: false, t: 0, T: 1, sl: null, seat: null, done: null };
  s.every((dt) => {
    if (!ride.on) return;
    ride.t += dt; const sl = ride.sl, k = Math.min(1, ride.t / ride.T), e = k * k, run = (SL + 0.5) * e;
    const a = L.xz(sl.p0 + sl.sg * run, tq); ride.seat.x = a[0]; ride.seat.z = a[1]; ride.seat.y = TY - (TY - 0.4) * Math.min(1, run / SL);
    if (k >= 1) { ride.on = false; if (ride.done) ride.done(); }
  });
  for (const sl of slides) {
    const top = L.xz(sl.p0 - sl.sg * 0.5, tq);
    L.act(sl.p0 - sl.sg * 0.6, tq, TY + 1.0, 1.0, 'Go down ' + nmSl(sl), async (gm) => {
      if (ride.on || !gm.player || !gm.player.sit) return;
      const t0 = sl.head === 'anti' ? tAnti : sl.head === 'spinward' ? tSpin : base, T = t0 * (1.04 + 0.08 * Math.random());
      const look = L.look(sl.sg, 0), seat = { x: top[0], y: TY + 0.05, z: top[1], eye: 0.95 };
      gm.player.sit(seat); gm.player.yaw = look; gm.player.pitch = -0.25; gm.player.locked = true;
      if (gm.sfxAt) gm.sfxAt('whoosh', s.frame, top[0], TY, top[1], { vol: 0.5 });
      await new Promise((res) => { Object.assign(ride, { on: true, t: 0, T, sl, seat, done: res }); });
      const end = L.xz(sl.p0 + sl.sg * (SL + 1.6), tq);
      gm.player.locked = false; gm.player.place(s.frame, end[0], 0, end[1], look, 0);
      note(gm, 'Down ' + nmSl(sl) + ' in ' + r2(T) + ' seconds. The week\'s best is ' + r2(t0) + '.' + (sl.head === 'spinward' ? ' You came down heavier than you went up.' : sl.head === 'anti' ? ' A little lighter on the way down, and a little slower.' : ''));
    });
  }
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // the spinball court: lines on the floor, a ring on the end wall and one on a post
  // ---------------------------------------------------------------------------------------------------------
  const cp0 = Math.max(tp + SL + 3.2, W * 0.42), cp1 = W - 2.0, cq0 = F + 1.8, cq1 = Math.min(D - 5.0, F + 1.8 + 13), cm = (cq0 + cq1) / 2;
  if (cp1 - cp0 > 8) {
    s.deco(() => {
      const ln = (a, b, c, d, col) => { g.mat('paint', col, { rough: -0.1 }); L.bx(a, b, 0.001, c, d, 0.004, { faces: 'Y' }); };
      const col = C.accent, col2 = C.felt[1];
      ln(cp0, cq0, cp1, cq0 + 0.1, col); ln(cp0, cq1 - 0.1, cp1, cq1, col); ln(cp0, cq0, cp0 + 0.1, cq1, col); ln(cp1 - 0.1, cq0, cp1, cq1, col);
      ln((cp0 + cp1) / 2 - 0.035, cq0, (cp0 + cp1) / 2 + 0.035, cq1, col);
      for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI * 2, p = (cp0 + cp1) / 2 + Math.cos(a) * 1.8, q = cm + Math.sin(a) * 1.8; ln(p - 0.1, q - 0.1, p + 0.1, q + 0.1, col2); }
      for (const e of [cp0, cp1]) for (let i = 0; i < 18; i++) { const a = -Math.PI / 2 + i / 17 * Math.PI, sg = e === cp0 ? 1 : -1, p = e + sg * Math.cos(a) * 3.0, q = cm + Math.sin(a) * 3.0; ln(p - 0.06, q - 0.06, p + 0.06, q + 0.06, col); }
    });
    L.prop('school.ring', W - 0.16, cm, 2.75, L.yaw(-1, 0), { c: C.accent });
    s.furniture(() => { const a = L.xz(cp0 - 0.9, cm); g.mat('paint', C.trim); g.cyl(a[0], 0, a[1], 0.08, 3.25, { segs: 10 }); g.cyl(a[0], 0, a[1], 0.32, 0.12, { segs: 14, r1: 0.26 }); });
    { const a = L.xz(cp0 - 0.9, cm); s.post(a[0], a[1], 0.1, 0, 3.3); }
    L.prop('school.ring', cp0 - 0.82, cm, 2.75, L.yaw(1, 0), { c: C.felt[1] });
    L.prop('school.rack', cp1 - 1.2, cq1 + 1.2, 0, L.yaw(0, -1), {});
    for (let k = 0; k < 5; k++) L.prop('school.ball', r.f(cp0 + 1, cp1 - 1), r.f(cq0 + 0.5, cq1 - 0.5), 0, r.f(0, 6), (() => { const k = r.i(0, KIDS.length - 1); return { a: KIDS[k], b: '#f6ecd6', c: KIDS[(k + 3) % KIDS.length] }; })(), { noCollide: true });
    const tags = ['catch', 'run', 'catch', 'spin', 'hop', 'catch'];
    for (let i = 0; i < 14; i++) L.spot('play', r.f(cp0 + 1, cp1 - 1), r.f(cq0 + 0.6, cq1 - 0.6), 0, r.f(-3, 3), { tags: ['kids', tags[i % tags.length], 'spinball', 'playhall'] });
    // throwing one: which way you face decides what the ball does
    L.act(cp0 + 1.4, cq1 - 1.0, 1.0, 1.6, 'Throw a spinball', async (gm) => {
      if (!gm.ui || !gm.ui.choose) return;
      gm.busy++;
      let k;
      try { k = await gm.ui.choose('The court', 'Which way do you throw', [{ label: 'Along the axis' }, { label: 'Spinward' }, { label: 'Anti' }]); } finally { gm.busy--; }
      if (k == null || k < 0) return;
      if (gm.sfxAt) { const a = L.xz(cp0 + 1.4, cq1 - 1.0); gm.sfxAt('ball-throw', s.frame, a[0], 1.4, a[1], { vol: 0.5 }); }
      await say(gm, 'The court', [[
        'It flies true and straight, and a child under the ring takes it without looking. Axis flies true.',
        'In flight it gains about a sixth of its weight and dives, short of the ring and into the boards. Spin sinks. Somebody small says "anti, you have to throw anti" in the voice of a person who has said it before.',
        'In flight it loses about a sixth of its weight and sails up and over the ring and into the felt. Anti floats. Two children cheer it anyway, out of kindness.',
      ][k]]);
    });
  }
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  s.deco(() => {
    const ln = (a, b, c, d, col) => { g.mat('paint', col, { rough: -0.1 }); L.bx(Math.min(a, c), Math.min(b, d), 0.001, Math.max(a, c), Math.max(b, d), 0.004, { faces: 'Y' }); };
    // a hopscotch of eight squares in the felt colours, leading from the soft room's door into the hall
    for (let k = 0; k < 8; k++) { const q = F + 1.2 + k * 0.62, two = k === 3 || k === 6; for (const dp of two ? [-0.33, 0.33] : [0]) ln(pe0 - 2.1 + dp - 0.28, q, pe0 - 2.1 + dp + 0.28, q + 0.56, C.felt[k % 4]); }
    // a running loop round the middle of the floor, for races antispinward
    const lp0 = rp + 2.2, lp1 = Math.min(cp0 - 1.6, tp + SL), lq0 = F + 2.4, lq1 = Math.min(tq - 1.8 - 4.6, D - 8), col = C.slide2;
    if (lp1 - lp0 > 4 && lq1 - lq0 > 3) {
      ln(lp0, lq0, lp1, lq0 + 0.1, col); ln(lp0, lq1 - 0.1, lp1, lq1, col); ln(lp0, lq0, lp0 + 0.1, lq1, col); ln(lp1 - 0.1, lq0, lp1, lq1, col);
      ln(lp0 + 0.6, lq0 + 0.6, lp1 - 0.6, lq0 + 0.68, col); ln(lp0 + 0.6, lq1 - 0.68, lp1 - 0.6, lq1 - 0.6, col); ln(lp0 + 0.6, lq0 + 0.6, lp0 + 0.68, lq1 - 0.6, col); ln(lp1 - 0.68, lq0 + 0.6, lp1 - 0.6, lq1 - 0.6, col);
      for (let i = 0; i < 4; i++) ln(lp0 + 0.1, lq0 + 0.1 + i * 0.13, lp0 + 0.6, lq0 + 0.16 + i * 0.13, i % 2 ? '#f6ecd6' : '#2a2622');
    }
  });
  // inside the loop: a balance beam on trestles and a run of stepping posts, each a hand higher than the last
  {
    const lp0 = rp + 2.2, lp1 = Math.min(cp0 - 1.6, tp + SL), lq0 = F + 2.4, lq1 = Math.min(tq - 1.8 - 4.6, D - 8);
    if (lp1 - lp0 > 7 && lq1 - lq0 > 3.6) {
      const bq = lq0 + 1.5, b0 = lp0 + 1.4, b1 = Math.min(lp1 - 1.4, b0 + 4.5), sq = lq1 - 1.4;
      s.furniture(() => {
        g.mat('wood', '#c9a46a', { rough: -0.1 }); L.bx(b0, bq - 0.06, 0.42, b1, bq + 0.06, 0.52, { bevel: 0.01 });
        g.mat('paint', C.trim); for (const p of [b0 + 0.3, b1 - 0.3]) { L.bx(p - 0.04, bq - 0.3, 0, p + 0.04, bq + 0.3, 0.05); L.bx(p - 0.04, bq - 0.05, 0.05, p + 0.04, bq + 0.05, 0.42); }
        for (let k = 0; k < 7; k++) { const p = b0 + k * 0.7, a = L.xz(p, sq); if (p > lp1 - 1) break; g.mat('paint', C.felt[k % 4]); g.cyl(a[0], 0, a[1], 0.17, 0.12 + k * 0.06, { segs: 12 }); g.mat('wood', '#e3cfa8'); g.cyl(a[0], 0.12 + k * 0.06, a[1], 0.16, 0.012, { segs: 12 }); }
      });
      L.solid(b0, bq - 0.08, 0, b1, bq + 0.08, 0.52);
      for (let k = 0; k < 7; k++) { const p = b0 + k * 0.7, a = L.xz(p, sq); if (p > lp1 - 1) break; s.post(a[0], a[1], 0.17, 0, 0.13 + k * 0.06); }
      for (let k = 0; k < 3; k++) L.spot('play', b0 + 0.6 + k * 1.4, bq + 0.5, 0, L.yaw(1, 0), { tags: ['kids', 'hop', 'beam', 'playhall'] });
    }
  }
  // the soft room for the small (front band, behind glass), the minders' room, the lobby
  // ---------------------------------------------------------------------------------------------------------
  {
    const pa = 0.16, pb = pe0 - 0.08, q0 = QF + 0.1, q1 = F - 0.08, pm = (pa + pb) / 2, qm = (q0 + q1) / 2;
    const clip = L.clip(pa, q0, pb, q1, HF);
    roomGlow(s, clip[0], 0, clip[2], clip[3], HF, clip[5], { sky: '#ffd9a8', ground: '#c97a5a', power: 0.5 });
    L.lamp('lantern', pm - (pb - pa) * 0.2, qm, 2.4, { tint: C.felt[0], clip, power: 0.9, drop: 0.6 });
    L.lamp('lantern', pm + (pb - pa) * 0.2, qm, 2.45, { tint: C.felt[2], clip, power: 0.8, drop: 0.55 });
    for (let p = pa + 1.0, k = 0; p < pb - 0.9; p += 1.9, k++) L.prop('lots-school.mat', p, qm, 0, L.yaw(0, 1), { c: C.felt[k % 4], w: 1.8, d: Math.min(3.4, q1 - q0 - 1.6), h: 0.1 });
    for (let i = 0; i < 6; i++) L.prop('school.cushion', pa + 0.8 + r.f(0, pb - pa - 1.6), qm + r.f(-1.2, 1.2), 0.1, 0, { a: KIDS[i % KIDS.length], b: '#f6ecd6' }, { spot: { tags: ['kids', 'small', 'floor', 'playhall'] } });
    L.prop('school.beanbag', pb - 0.8, q1 - 0.9, 0, L.yaw(-1, -1), { c: C.felt[1], patch: C.felt[0] });
    L.prop('school.beanbag', pa + 0.8, q1 - 0.9, 0, L.yaw(1, -1), { c: C.felt[3], patch: C.felt[2] });
    for (let i = 0; i < 6; i++) { const a = L.xz(pa + 1 + r.f(0, pb - pa - 2), qm + r.f(-1, 1)); prop(s, 'school.blocks', a[0], 0.1, a[1], r.f(0, 3), { seed: 11 + i, n: 1 + i % 3, s: 0.09 }, { noCollide: true }); }
    // a low padded fence along the hall wall's window: soft, and just too high to climb
    s.furniture(() => { g.mat('weave', C.felt[2]); L.bx(pa + 0.2, q1 - 0.36, 0, pb - 0.2, q1 - 0.14, 0.62, { bevel: 0.05 }); });
    L.solid(pa + 0.2, q1 - 0.36, 0, pb - 0.2, q1 - 0.14, 0.62);
    s.deco(() => { const wf = L.onWall('p', pa, 1); for (let q = q0 + 0.4; q < q1 - 0.8; q += 0.6) drawing(g, wf, q, r.f(0.7, 1.0), 0.42, 0.32, lot.seed + Math.round(q * 23), r.pick([0, 1, 5, 6])); });
    for (let i = 0; i < 4; i++) L.spot('play', pm + r.f(-1.5, 1.5), qm + r.f(-1, 1), 0.1, r.f(-3, 3), { tags: ['kids', 'small', i % 2 ? 'hop' : 'floor', 'playhall'] });
    L.spot('sit', pa + 0.5, q0 + 0.6, 0.46, L.yaw(1, 1), { tags: ['mind', 'playhall'] }); L.prop('chair', pa + 0.5, q0 + 0.6, 0, L.yaw(1, 1), { wood: '#6b4a2f' }, { noSpots: true });
    s.zoneBox({ id: lot.id + '/soft', place: 'city-special', box: [clip[0], -0.5, clip[2], clip[3], HF, clip[5]], name: 'The soft room', sub: 'Play hall · for the small, and whoever carries them', ambience: 'school', reverb: 'felt', cell: info.key });
  }
  await tick();
  {
    const pa = pe1 + 0.08, pb = W - 0.16, q0 = QF + 0.1, q1 = F - 0.08, pm = (pa + pb) / 2, qm = (q0 + q1) / 2;
    const clip = L.clip(pa, q0, pb, q1, HF);
    roomGlow(s, clip[0], 0, clip[2], clip[3], HF, clip[5], { sky: '#ffdcae', ground: '#a8794f', power: 0.45 });
    L.lamp('globe', pm, qm, 2.45, { drop: 0.7, K: 2700, power: 1.1, clip });
    // benches facing the big window onto the hall
    for (let p = pa + 2.6; p < pb - 1.2; p += 2.2) L.prop('bench', p, q1 - 1.0, 0, L.yaw(0, 1), { w: 1.8, back: true, wood: '#8a6240', metal: C.trim }, { spot: { tags: ['mind', 'playhall', 'watch'] } });
    pegs(L, 'q', q0 + 0.08, 1, pa + 0.4, Math.min(pb - 2.2, pa + 6), lot.seed + 7);
    L.prop('counter', pb - 0.4, qm - 0.4, 0, L.yaw(-1, 0), { w: 1.6, d: 0.55, h: 0.9, body: C.trim, top: '#b98a5a' }, { noSpots: true });
    { const a = L.xz(pb - 0.4, qm - 0.1); prop(s, 'school.kettle', a[0], 0.9, a[1], L.yaw(-1, 0), {}, { noCollide: true }); for (let k = 0; k < 4; k++) { const c = L.xz(pb - 0.42, qm - 0.9 + k * 0.14); prop(s, 'cup', c[0], 0.9, c[1], 0, { glaze: KIDS[k] }, { noCollide: true }); } }
    L.spot('work', pb - 1.05, qm - 0.4, 0, L.yaw(1, 0), { tags: ['tea', 'playhall'] });
    s.zoneBox({ id: lot.id + '/minders', place: 'city-special', box: [clip[0], -0.5, clip[2], clip[3], HF, clip[5]], name: 'The minders\' room', sub: 'Play hall · tea on the loop · the window onto the hall', ambience: 'shop', reverb: 'felt', cell: info.key });
    const mLines = alt(r, [
      ['Mine is the one in red on the wall, three holds from the bell. She comes down when she is hungry, which in this hall is about every forty minutes.'],
      ['We take turns minding, a table at a time. Today is my table\'s turn and two others\', which is why there are three of us and eleven of them.'],
      ['The mats get mended twice a year. Each table takes one home and brings it back with its patch, so you can tell whose table did which.'],
      ['The small ones stay behind the soft fence until they can say the rule: axis flies true, spin sinks, anti floats. Most of them can say it before they can say their aunts\' names.'],
    ]);
    L.act(pm, q1 - 1.6, 1.1, 1.8, 'Ask the minder', (gm) => say(gm, minderName + ', minding', mLines));
  }
  await tick();
  {
    // the lobby: shoes and coats on both walls
    const clip = L.clip(pe0 + 0.08, qi, pe1 - 0.08, F + 0.6, HF);
    roomGlow(s, clip[0], 0, clip[2], clip[3], HF, clip[5], { sky: '#ffe2b8', ground: '#b9634a', power: 0.4 });
    L.lamp('globe', doorP, (qi + F) / 2, 2.45, { K: 2800, clip, power: 0.95, drop: 0.7, r: 0.2 });
    pegs(L, 'p', pe0 + 0.08, 1, qi + 0.3, F - 0.3, lot.seed + 3);
    pegs(L, 'p', pe1 - 0.08, -1, qi + 0.3, F - 0.3, lot.seed + 4);
    for (const dq of [0.9, 2.2]) { L.spot('stand', doorP - 1.0, qi + dq, 0, L.yaw(0, 1), { tags: ['wait', 'playhall'] }); L.spot('stand', doorP + 1.0, qi + dq + 0.3, 0, L.yaw(0, 1), { tags: ['wait', 'playhall'] }); }
  }
  await tick();

  // ---------------------------------------------------------------------------------------------------------
  // benches round the hall for whoever is minding; children everywhere; walkways
  // ---------------------------------------------------------------------------------------------------------
  const fBusy = (p) => fOpen.some((x) => !x.sill && p > x.at - 1.2 && p < x.at + x.w + 1.2);
  for (let p = 3.2; p < W - 2; p += 2.6) { if (fBusy(p) || (p > rp - 1.6 && p < rp + 1.6)) continue; L.prop('bench', p, F + 0.45, 0, L.yaw(0, 1), { w: 1.8, back: true, wood: '#a8794f', metal: C.trim }, { spot: { tags: ['mind', 'playhall', 'watch'] } }); }
  s.deco(() => { const wf = L.onWall('q', F + 0.08, 1); for (let p = 1.0; p < W - 1.2; p += r.f(0.6, 0.9)) { if (fOpen.some((x) => p + 0.5 > x.at - 0.15 && p < x.at + x.w + 0.15)) continue; drawing(g, wf, p, r.f(1.3, 1.55), 0.44, 0.34, lot.seed * 5 + Math.round(p * 13)); } });
  await tick();
  for (let i = 0; i < 4; i++) L.spot('play', r.f(0.9, 2.2), r.f(cwq0 + 0.5, cwq1 - 0.5), 0.2, L.yaw(-1, 0), { tags: ['kids', 'climb', 'hop', 'playhall'] });
  for (let i = 0; i < nRopes; i += 2) L.spot('play', rp + 0.6, rq0 + i * 1.3, 0.14, L.yaw(-1, 0), { tags: ['kids', 'rope', 'spin', 'playhall'] });
  for (const sl of slides) L.spot('play', sl.p0 + sl.sg * (SL + 1.6), tq + 0.6, 0, r.f(-3, 3), { tags: ['kids', 'slide', 'run', 'playhall'] });
  L.spot('play', tp + 0.4, tq + 0.3, TY, L.yaw(0, -1), { tags: ['kids', 'slide', 'hop', 'playhall'] });
  L.spot('play', tp, tq - 1.2 - 5.0, 0, L.yaw(0, 1), { tags: ['kids', 'queue', 'hop', 'playhall'] });
  for (let i = 0; i < 6; i++) L.spot('play', r.f(rp + 2.5, Math.max(rp + 3, cp0 - 2)), r.f(F + 2, D - 6), 0, r.f(-3, 3), { tags: ['kids', i % 2 ? 'run' : 'catch', 'playhall'] });
  L.spot('stand', rp + 1.6, rq0 + 2.5, 0, L.yaw(-1, 0), { tags: ['mind', 'playhall', 'watch'] });
  L.spot('stand', tp + 2.0, tq - 2.4, 0, L.yaw(-0.5, 1), { tags: ['mind', 'playhall', 'watch'] });
  const kids = s.loop('kids', ...(() => { const a = L.xz(W / 2, hm); return [a[0], 1.4, a[1]]; })(), { vol: 0.4, radius: 32 });
  s.every((dt, gm) => { if (!gm || !gm.clock || !kids.set) return; const h = gm.clock.hours; kids.set({ vol: h > 9 && h < 20.5 ? (h > 15.2 ? 0.55 : 0.3) : 0.0 }); });
  await tick();
  L.path([[doorP, -0.7], [doorP, 1.2], [doorP, qi + 0.6], [doorP, F + 1.0], [doorP, hm]], { width: 1.6 });
  const spine = []; for (let p = 3.2; p < W - 1.8; p += 3) spine.push([p, hm]); spine.push([doorP, hm]); spine.sort((a, b) => a[0] - b[0]);
  L.path(spine.filter((v, i, a) => i === 0 || v[0] - a[i - 1][0] > 0.75), { width: 1.8 });
  L.path([[pe0 - 1.6, hm], [pe0 - 1.6, F + 0.8], [pe0 - 1.6, F - 0.9], [(0.16 + pe0) / 2, (QF + F) / 2]], { width: 1.1 });
  L.path([[pe1 + 1.55, hm], [pe1 + 1.55, F + 0.8], [pe1 + 1.55, F - 0.9], [(pe1 + W) / 2, (QF + F) / 2 + 0.6]], { width: 1.1 });
  await tick();
  L.path([[tp, hm], [tp, tq - 1.2 - 5.0]], { width: 1.2 });
  L.path([[3.0, hm], [2.8, cwq0 + 0.5]], { width: 1.2 }); L.path([[3.0, hm], [2.8, cwq1 - 0.5]], { width: 1.2 });
  for (const sl of slides) L.path([[sl.p0 + sl.sg * (SL + 1.6), hm], [sl.p0 + sl.sg * (SL + 1.6), tq]], { width: 1.2 });

  s.zoneBox({ id: lot.id, place: 'city-special', box: [lot.x0, -0.5, lot.z0, lot.x1, HF, lot.z1], name: 'The play hall', sub: info.name + ' · slides, ropes, the wall, spinball', ambience: 'school', reverb: 'room', cell: info.key });
  s.zoneBox({ id: lot.id + '/hall', place: 'city-special', box: [clipH[0], -0.5, clipH[2], clipH[3], HH, clipH[5]], name: 'The play hall', sub: info.name + ' · the wall, the ropes, the slides, the court', ambience: 'school', reverb: 'hall', headroom: HH - 0.5, cell: info.key });
  void dn; void PAL; void game; void plan;
}
