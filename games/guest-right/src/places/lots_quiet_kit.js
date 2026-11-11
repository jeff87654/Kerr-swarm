// A small kit for the quiet special lots (the dim wood, the bright square, the still room, the lamp garden, the lamp row):
// everything in the lot's own coordinates, so one plan fits a footprint mirrored or turned any way. p runs along the front
// from its low end, q runs inward from the front line. A local frame may also be mirrored (p -> W - p), so a plan drawn
// with its entrance on the left serves blocks where it is on the right.
import { orient, frontSide, note } from '../city/lots.js';
import { LOT_H } from '../city/plan.js';
import { floor, ceiling, wall, lamp, roomGlow } from '../world/kit.js';
import { archway } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { frontWall, pilaster } from './street_parts.js';
import { Rng, hashStr, mixHex, shadeHex } from '../core/util.js';

export function local(s, lot, mirror) {
  const o = orient(lot), g = s.g, f = lot.front, W = o.W, D = o.D;
  const sp = mirror ? -1 : 1;
  const Pv = (f === 'n' || f === 's') ? [sp, 0] : [0, sp];
  const Qv = f === 'n' ? [0, 1] : f === 's' ? [0, -1] : f === 'w' ? [1, 0] : [-1, 0];
  const P = (p, q) => o.P(mirror ? W - p : p, q);
  const B = (p0, q0, p1, q1) => { const a = P(p0, q0), b = P(p1, q1); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; };
  const dir = (dp, dq) => [dp * Pv[0] + dq * Qv[0], dp * Pv[1] + dq * Qv[1]];
  const face = (dp, dq) => { const d = dir(dp, dq); return Math.abs(d[0]) > Math.abs(d[1]) ? (d[0] > 0 ? 'X' : 'x') : (d[1] > 0 ? 'Z' : 'z'); };
  const FM = { p: face(-1, 0), P: face(1, 0), q: face(0, -1), Q: face(0, 1) };
  const F = (str) => str.replace(/[pPqQ]/g, (c) => FM[c]);
  const pt = (p, y, q) => { const a = P(p, q); return [a[0], y, a[1]]; };
  const L = { o, s, g, lot, W, D, P, B, dir, face, F, pt, mirror: !!mirror };
  // a prop's yaw (front toward +z at yaw 0) facing local direction (dp, dq); the player's yaw looking along it
  L.yaw = (dp, dq) => { const d = dir(dp, dq); return Math.atan2(d[0], d[1]); };
  L.look = (dp, dq) => { const d = dir(dp, dq); return Math.atan2(d[0], -d[1]); };
  L.a = (p) => o.a0 + (mirror ? W - p : p);          // a point on the front line, as the street parts want it
  L.box = (p0, y0, q0, p1, y1, q1, opts) => { const b = B(p0, q0, p1, q1); if (opts && opts.faces) opts = Object.assign({}, opts, { faces: F(opts.faces) }); g.box(b[0], y0, b[1], b[2], y1, b[3], opts); };
  L.solid = (p0, y0, q0, p1, y1, q1, opts) => { const b = B(p0, q0, p1, q1); return s.solid(b[0], y0, b[1], b[2], y1, b[3], opts); };
  L.block = (p0, y0, q0, p1, y1, q1, mat, tint, opts = {}) => {
    g.mat(mat, tint, opts.m); L.box(p0, y0, q0, p1, y1, q1, { bevel: opts.bevel, aoBottom: opts.ao === undefined ? 0.7 : opts.ao, faces: opts.faces });
    s.flush({ tier: opts.tier || 's', cast: opts.cast !== false });
    if (!opts.noCollide) L.solid(p0, y0, q0, p1, y1, q1, { surf: opts.surf });
  };
  L.post = (p, q, r, y0, y1) => { const a = P(p, q); return s.post(a[0], a[1], r, y0, y1); };
  L.cyl = (p, y, q, r, h, opts) => { const a = P(p, q); g.cyl(a[0], y, a[1], r, h, opts); };
  L.lathe = (p, q, prof, opts) => { const a = P(p, q); g.lathe(a[0], a[1], prof, opts); };
  L.ball = (p, y, q, r, ry, opts) => { const a = P(p, q); g.ball(a[0], y, a[1], r, ry, r, opts); };
  L.tube = (pts, r, opts) => g.tube(pts.map((v) => pt(v[0], v[1], v[2])), r, opts);
  L.card = (p, y, q, w, h, yaw, opts) => { const a = P(p, q); g.card(a[0], y, a[1], w, h, yaw, opts); };
  L.quad = (a, b, c, d, opts) => g.quad(pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(c[0], c[1], c[2]), pt(d[0], d[1], d[2]), opts);
  L.sheet = (a, b, c, d, opts) => g.sheet(pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(c[0], c[1], c[2]), pt(d[0], d[1], d[2]), opts);
  L.prop = (name, p, y, q, yaw, params, opts) => { const a = P(p, q); return prop(s, name, a[0], y, a[1], yaw, params, opts); };
  L.spot = (type, p, y, q, yaw, opts) => { const a = P(p, q); return s.spot(type, a[0], y, a[1], yaw, opts); };
  L.lamp = (kind, p, y, q, opts = {}) => {
    const a = P(p, q), op = Object.assign({}, opts);
    if (op.toPQ) { op.to = pt(op.toPQ[0], op.toPQ[1], op.toPQ[2]); delete op.toPQ; }
    if (op.faceL) { op.face = face(op.faceL[0], op.faceL[1]); delete op.faceL; }
    return lamp(s, kind, a[0], y, a[1], op);
  };
  L.light = (op) => {
    const oo = Object.assign({}, op); oo.at = pt(op.at[0], op.at[1], op.at[2]);
    if (op.to) oo.to = pt(op.to[0], op.to[1], op.to[2]);
    if (op.dir) { const d = dir(op.dir[0], op.dir[2]); oo.dir = [d[0], op.dir[1], d[1]]; }
    return s.light(oo);
  };
  L.clip = (p0, q0, p1, q1, y0, y1, pad) => { const b = B(p0, q0, p1, q1), d = pad === undefined ? 0.06 : pad; return [b[0] - d, y0, b[1] - d, b[2] + d, y1, b[3] + d]; };
  L.glow = (p0, y0, q0, p1, y1, q1, op) => { const b = B(p0, q0, p1, q1); return roomGlow(s, b[0], y0, b[1], b[2], y1, b[3], op); };
  L.ambient = (p0, y0, q0, p1, y1, q1, op) => { const b = B(p0, q0, p1, q1); return s.ambient(Object.assign({}, op, { box: [b[0], y0, b[1], b[2], y1, b[3]] })); };
  L.path = (pts, op) => s.path(pts.map((v) => P(v[0], v[1])), op);
  L.act = (p, y, q, radius, prompt, onUse, extra) => { const a = P(p, q); return s.interact(Object.assign({ x: a[0], y, z: a[1], radius, prompt, onUse }, extra)); };
  L.sign = (spec, p, y, q, dl, opts) => { const a = P(p, q); return sign(s, spec, a[0], y, a[1], Object.assign({ face: face(dl[0], dl[1]) }, opts)); };
  L.floor = (p0, q0, p1, q1, y, mat, tint, op) => { const b = B(p0, q0, p1, q1); floor(s, b[0], b[1], b[2], b[3], y, mat, tint, op); };
  L.ceil = (p0, q0, p1, q1, y, mat, tint, op) => { const b = B(p0, q0, p1, q1); ceiling(s, b[0], b[1], b[2], b[3], y, mat, tint, op); };
  // a wall along p at depth q from p0 to p1 (openings' `at` from p0, in +p), and one along q at p from q0 to q1
  L.wallP = (q, p0, p1, y0, h, op) => { const a = P(Math.min(p0, p1), q), b = P(Math.max(p0, p1), q); wall(s, a[0], a[1], b[0], b[1], y0, h, op || {}); };
  L.wallQ = (p, q0, q1, y0, h, op) => { const a = P(p, Math.min(q0, q1)), b = P(p, Math.max(q0, q1)); wall(s, a[0], a[1], b[0], b[1], y0, h, op || {}); };
  L.glass = (p0, y0, q0, p1, y1, q1, op) => { const a = P(p0, q0), b = P(p1, q1); return s.glass(a[0], y0, a[1], b[0], y1, b[1], op); };
  L.loop = (name, p, y, q, op) => { const a = P(p, q); return s.loop(name, a[0], y, a[1], op); };
  L.sfx = (game, name, p, y, q, op) => { if (!game.sfxAt) return; const a = P(p, q); game.sfxAt(name, s.frame, a[0], y, a[1], op); };
  L.flush = (op) => s.flush(op);
  L.zone = (op) => s.zoneBox(Object.assign({ id: lot.id, box: [lot.x0, -0.5, lot.z0, lot.x1, op.top || 3.4, lot.z1] }, op));
  return L;
}

// ---------------------------------------------------------------------------------------------------------------
// lines and time
// ---------------------------------------------------------------------------------------------------------------
// One of a list, chosen by the lot's seed and a salt, so two lines in one block do not move together.
export function pick(seed, salt, list) { const r = new Rng(((seed >>> 0) ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0); r.next(); return list[Math.floor(r.next() * list.length) % list.length]; }

// Let some minutes go by (sitting, standing in the light): a slow fade, the clock moved on, a fade back.
export async function passTime(game, mins) {
  const c = game.clock; if (!c) return;
  const step = () => { c.minutes += mins; while (c.minutes >= 1440) { c.minutes -= 1440; c.day++; game.events.emit('clock:day', c.day); } game.events.emit('clock:jump'); };
  if (game.ui && game.ui.fade) { game.busy++; try { await game.ui.fade(true, 1.1); step(); await new Promise((r) => setTimeout(r, 500)); await game.ui.fade(false, 1.4); } finally { game.busy--; } }
  else step();
}

// Sit the player on a seat whose prop faces local (dp, dq); a few minutes go by and a line is shown.
export async function sitAWhile(L, game, p, q, dp, dq, mins, text, seatY) {
  const pl = game.player; if (!pl || !pl.sit) return;
  const a = L.P(p, q);
  pl.sit({ x: a[0], y: seatY || 0, z: a[1], yaw: L.yaw(dp, dq) }); pl.yaw = L.look(dp, dq); pl.pitch = -0.06;
  if (mins) await passTime(game, mins);
  if (text) note(game, text);
}

// ---------------------------------------------------------------------------------------------------------------
// fronts
// ---------------------------------------------------------------------------------------------------------------
// A plain front with one deep doorway that cannot be seen through: the door opens into a dim lobby whose way on is in its
// side wall, behind a felt curtain. o: { doorP, doorW (1.6), fin, H (room height), name, sub, letters (colour), lobby: {
// tint, felt, floor: [mat, tint] }, signs: true, troughs: 'fern' | null, lampK }. Returns { exitP, exitQ, lobbyClip }.
export async function deepFront(L, plan, o, tick) {
  const tk = tick || (async () => {});
  const s = L.s, g = L.g, lot = L.lot, sd = frontSide(lot), W = L.W, H = o.H || 3.4;
  const dw = o.doorW || 1.6, dP = o.doorP, dh = 2.45;
  // the front wall to the street band: the opening's `at` is measured in frame order along the front
  const fa = (p0, p1) => { const a = L.a(p0) - L.o.a0, b = L.a(p1) - L.o.a0; return Math.min(a, b); };
  frontWall(s, sd, L.o.a0, L.o.a1, LOT_H, [{ at: fa(dP - dw / 2, dP + dw / 2), w: dw, h: dh }], o.fin);
  pilaster(s, sd, L.o.a0 + 0.2, LOT_H + 0.37, o.fin.pil); pilaster(s, sd, L.o.a1 - 0.2, LOT_H + 0.37, o.fin.pil);
  // the inside face of the front, to the ceiling, with the same opening (the reveal is half a metre deep)
  const lin = Object.assign({ t: 0.28, openings: [{ at: dP - dw / 2, w: dw, h: dh }], skirt: false }, o.inner);
  L.wallP(0.34, 0, W, 0, H, lin);
  await tk();
  // a stone surround that stands out into the street
  { const c = L.pt(dP, 0, 0.12); archway(s, c[0], 0, c[2], dw, dh, L.o.alongX ? 'x' : 'z', { depth: 0.62, tint: o.fin.arch || '#b8ad96' }); }
  // a threshold stone
  L.block(dP - dw / 2 - 0.1, 0, -0.32, dP + dw / 2 + 0.1, 0.03, 0.48, 'stone', o.fin.step || '#8f8572', { cast: false, noCollide: true, bevel: 0.01 });
  // the lobby: 3.6 wide, 2.6 deep, low; its way on is in its +p wall
  const lb = o.lobby || {}, LW = 1.8, Q0 = 0.48, Q1 = 3.1, LH = 2.6;
  const lt = lb.tint || '#3a3530';
  L.wallQ(dP - LW, Q0, Q1, 0, H, { tint: lt, mat: lb.mat || 'felt', skirt: false });
  L.wallQ(dP + LW, Q0, Q1, 0, H, { tint: lt, mat: lb.mat || 'felt', skirt: false, openings: [{ at: 0.95, w: 1.35, h: 2.25 }] });
  L.wallP(Q1, dP - LW - 0.08, dP + LW + 0.08, 0, H, { tint: lt, mat: lb.mat || 'felt', skirt: false });
  L.floor(dP - LW, 0.34, dP + LW, Q1, 0.012, (lb.floor && lb.floor[0]) || 'rush', (lb.floor && lb.floor[1]) || '#8a7a5a', { noCollide: true });
  g.mat('paint', shadeHex(lt, 0.7)); L.box(dP - LW, LH, Q0 - 0.14, dP + LW, LH + 0.06, Q1, { faces: 'yY' }); s.flush({ tier: 's' });
  // the curtain over the way on, and a heavy one across the back of the lobby
  const ct = lb.felt || '#5b3a3a';
  g.mat('felt', ct, { sway: 0.15 });
  L.sheet([dP + LW - 0.12, 2.25, Q0 + 0.95], [dP + LW - 0.12, 2.25, Q0 + 0.95 + 1.35], [dP + LW - 0.12, 0.04, Q0 + 0.95 + 1.35], [dP + LW - 0.12, 0.04, Q0 + 0.95], { sag: 0.04, ripple: 0.05, nu: 6, nv: 4 });
  g.mat('felt', shadeHex(ct, 0.8)); L.sheet([dP - LW + 0.1, LH - 0.02, Q1 - 0.1], [dP + LW - 0.2, LH - 0.02, Q1 - 0.1], [dP + LW - 0.2, 0.02, Q1 - 0.1], [dP - LW + 0.1, 0.02, Q1 - 0.1], { sag: 0.03, ripple: 0.06, nu: 10, nv: 4 });
  g.mat('cast', '#3a3530'); L.tube([[dP + LW - 0.12, 2.27, Q0 + 0.9], [dP + LW - 0.12, 2.27, Q0 + 2.35]], 0.015, { segs: 6 });
  s.flush({ tier: 'd', cast: false });
  await tk();
  // a dim lamp in the lobby (it is what the street sees through the door)
  const lobbyClip = L.clip(dP - LW, -0.6, dP + LW, Q1, -0.2, LH + 0.1, 0.02);
  L.lamp('sconce', dP - LW + 0.1, 1.9, (Q0 + Q1) / 2, { faceL: [1, 0], clip: lobbyClip, power: o.lobbyPower || 0.35, K: o.lampK || 2500, range: 3.5 });
  // the name on the front and a plate by the door
  if (o.name) L.sign({ kind: 'letters', text: o.name, font: 'caps', palette: [o.letters || '#e9dcc0'] }, dP, 2.98, -0.035, [0, -1], { w: Math.min(4.2, W - 2), h: 0.3, glow: o.lettersGlow || 0.9 });
  await tk();
  if (o.plate) L.sign({ kind: 'plate', text: o.plate[0], lines: [o.plate[1]] }, dP + dw / 2 + 0.75, 1.5, -0.008, [0, -1], { w: 0.42, h: 0.18 });
  await tk();
  // two lamps on the street face
  const sc = L.clip(dP - 4, -4.2, dP + 4, 0.04, -0.2, LOT_H + 0.1, 0);
  for (const sg of [-1, 1]) L.lamp('sconce', dP + sg * (dw / 2 + 0.55), 2.15, -0.02, { faceL: [0, -1], clip: sc, power: 0.7, K: o.lampK || 2600, range: 4 });
  // troughs of plants against the street face
  if (o.troughs) {
    for (const tp of [[0.8, dP - dw / 2 - 1.1], [dP + dw / 2 + 1.4, W - 0.8]]) {
      if (tp[1] - tp[0] < 1.2) continue;
      L.block(tp[0], 0, -0.5, tp[1], 0.5, 0, 'stone', o.fin.trough || '#9b917c', { bevel: 0.02 });
      g.mat('soil', '#ffffff'); L.box(tp[0] + 0.05, 0.48, -0.45, tp[1] - 0.05, 0.51, -0.05, { faces: 'Y' }); s.flush({ tier: 's', cast: false });
      const r = new Rng(hashStr('trough' + lot.seed + tp[0]));
      for (let p = tp[0] + 0.3; p < tp[1] - 0.2; p += 0.6) L.prop(o.troughs === 'fern' ? 'fernery.fern' : 'court.pot', p + r.f(-0.08, 0.08), 0.5, -0.26, r.f(0, 6.28), o.troughs === 'fern' ? { s: 0.7, v: r.i(0, 3) } : { size: 0.6, kind: o.troughs, pot: '#a3563a' }, { noCollide: true });
    }
  }
  // the walk in: from the street, through the lobby, round the curtain
  const exitP = dP + LW + 0.7, exitQ = Q0 + 0.95 + 0.67;
  L.path([[dP, -0.7], [dP, 1.2], [dP + 0.6, exitQ], [exitP, exitQ]], { width: 1.1 });
  return { exitP, exitQ, lobbyClip, Q1, LW };
}

// A bright front: a wide open doorway with tall windows either side between pilasters, the name in lit letters above.
// o: { doorP, doorW (3.2), fin, H, name, sub, palette, windows: true, sill, glassTint, plate }. Returns { doorP }.
export async function brightFront(L, plan, o, tick) {
  const tk = tick || (async () => {});
  const s = L.s, g = L.g, lot = L.lot, sd = frontSide(lot), W = L.W, H = o.H || 3.4;
  const dw = o.doorW || 3.2, dP = o.doorP, dh = 2.7;
  const ops = [{ p0: dP - dw / 2, p1: dP + dw / 2, h: dh, door: true }];
  if (o.windows !== false) {
    const bays = (lo, hi) => { const n = Math.floor((hi - lo) / 3.4); for (let k = 0; k < n; k++) { const c = lo + (hi - lo) * (k + 0.5) / n; ops.push({ p0: c - 1.15, p1: c + 1.15, h: 1.75, sill: o.sill || 0.75 }); } };
    bays(0.5, dP - dw / 2 - 0.4); bays(dP + dw / 2 + 0.4, W - 0.5);
  }
  const fops = ops.map((op) => ({ at: Math.min(L.a(op.p0), L.a(op.p1)) - L.o.a0, w: op.p1 - op.p0, h: op.h, sill: op.sill }));
  frontWall(s, sd, L.o.a0, L.o.a1, LOT_H, fops, o.fin);
  pilaster(s, sd, L.o.a0 + 0.2, LOT_H + 0.37, o.fin.pil); pilaster(s, sd, L.o.a1 - 0.2, LOT_H + 0.37, o.fin.pil);
  for (const op of ops) for (const e of [op.p0, op.p1]) pilaster(s, sd, L.a(e) + (L.a(e) > L.a((op.p0 + op.p1) / 2) ? 0.16 : -0.16), LOT_H + 0.37, o.fin.pil);
  await tk();
  // the inside face
  L.wallP(0.34, 0, W, 0, H, Object.assign({ t: 0.28, skirt: false, openings: ops.map((op) => ({ at: op.p0, w: op.p1 - op.p0, h: op.h, sill: op.sill })) }, o.inner));
  for (const op of ops) {
    if (!op.sill) continue;
    L.glass(op.p0 + 0.03, op.sill, 0.1, op.p1 - 0.03, op.sill + op.h, 0.1, { opacity: 0.12, tint: o.glassTint });
    // glazing bars and an inside sill
    g.mat('paint', o.fin.bar || '#2d3b36');
    const n = 3; for (let k = 1; k < n; k++) { const p = op.p0 + (op.p1 - op.p0) * k / n; L.box(p - 0.025, op.sill, 0.06, p + 0.025, op.sill + op.h, 0.14); }
    L.box(op.p0, op.sill + op.h * 0.62, 0.06, op.p1, op.sill + op.h * 0.62 + 0.04, 0.14);
    g.mat('wood', o.fin.sillT || '#8a6240'); L.box(op.p0 - 0.05, op.sill - 0.04, 0.2, op.p1 + 0.05, op.sill, 0.6, { bevel: 0.008 });
    s.flush({ tier: 's' });
  }
  await tk();
  // a broad step and a mat in the doorway
  L.block(dP - dw / 2 - 0.12, 0, -0.35, dP + dw / 2 + 0.12, 0.025, 0.5, 'stone', o.fin.step || '#b5aa94', { cast: false, noCollide: true, bevel: 0.01 });
  if (o.name) L.sign({ kind: 'fascia', text: o.name, sub: o.sub, palette: o.palette || ['#2d3b36', '#f3e6c8', '#d8a657'] }, dP, 2.96, -0.035, [0, -1], { w: Math.min(4.6, W - 2), h: 0.42, glow: 0.8 });
  if (o.plate) L.sign({ kind: 'plate', text: o.plate[0], lines: [o.plate[1]] }, dP + dw / 2 + 0.55, 1.55, -0.008, [0, -1], { w: 0.42, h: 0.18 });
  L.path([[dP, -0.7], [dP, 1.2]], { width: 1.6 });
  return { doorP: dP, ops };
}

// ---------------------------------------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------------------------------------
// A small tree that fits under a deck's ceiling. p: { h, w (crown radius), v, kind: 'birch' | 'broad' | 'fine' | 'fruit',
// fruit (colour), nf (fruit count), leaf (tint) }
defineProp('lots-quiet.tree', (g, p) => {
  const h = p.h || 2.8, kind = p.kind || 'broad', r = new Rng(hashStr('qtree' + kind + p.v + h)), cw = p.w || h * 0.36;
  const trunkH = h * (kind === 'birch' ? 0.5 : 0.4), r0 = p.r || (kind === 'birch' ? 0.075 : 0.065);
  const pts = [], rad = []; let x = 0, z = 0;
  for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push([x, t * trunkH, z]); rad.push(r0 * (1 - t * 0.5)); x += r.f(-0.04, 0.04); z += r.f(-0.04, 0.04); }
  if (kind === 'birch') g.mat('paint', '#e8e3d6', { rough: 0.25 }); else g.mat('bark', '#ffffff');
  g.tube(pts, rad, { segs: 7 });
  if (kind === 'birch') { g.mat('plain', '#25221f'); for (let i = 0; i < 12; i++) { const t = r.f(0.05, 0.95), y = t * trunkH, th = r.f(0, 6.28), w = r.f(0.02, 0.05), cr = r0 * (1 - t * 0.5); g.box(Math.cos(th) * cr - w / 2, y - 0.007, Math.sin(th) * cr - w / 2, Math.cos(th) * cr + w / 2, y + 0.007, Math.sin(th) * cr + w / 2); } }
  const top = pts[5], tips = [], cy = trunkH + (h - trunkH) * 0.5;
  g.mat('bark', '#8a7a68');
  const nb = kind === 'fine' ? 7 : 6;
  for (let i = 0; i < nb; i++) {
    const th = i / nb * Math.PI * 2 + r.f(-0.3, 0.3), len = cw * r.f(0.6, 1.0), y0 = trunkH * r.f(0.8, 1.0);
    const p0 = [top[0], y0, top[2]], p1 = [Math.cos(th) * len * 0.5, y0 + (h - y0) * 0.35, Math.sin(th) * len * 0.5], p2 = [Math.cos(th) * len, Math.min(h - 0.2, y0 + (h - y0) * 0.6), Math.sin(th) * len];
    g.tube([p0, p1, p2], [0.028, 0.016, 0.007], { segs: 4 });
    tips.push(p1, p2);
  }
  tips.push([top[0], h * 0.86, top[2]]);
  const layer = kind === 'broad' || kind === 'fruit' ? 'leafA' : 'leafB';
  const per = kind === 'fine' ? 7 : 6;
  for (const tp of tips) {
    for (let j = 0; j < per; j++) {
      g.mat(layer, mixHex(p.leaf || '#ffffff', kind === 'birch' ? '#e2f2a8' : '#cfe0a0', r.next() * 0.5), { sway: 0.35 });
      const sz = r.f(0.32, 0.55) * (h / 2.8 + 0.2);
      const cyy = Math.min(h - sz * 0.8, Math.max(trunkH * 0.9, tp[1] + r.f(-0.35, 0.25)));
      g.card(tp[0] + r.f(-0.35, 0.35) * cw / 1.0, cyy - sz * 0.4, tp[2] + r.f(-0.35, 0.35) * cw, sz, sz * 1.1, r.f(0, 6.28), { tilt: r.f(-0.35, 0.35) });
    }
  }
  if (kind === 'fruit' && p.nf) {
    g.mat('glaze', p.fruit || '#c8452e', { rough: -0.25 });
    for (let i = 0; i < p.nf; i++) { const tp = tips[(i * 3 + 1) % tips.length]; const fr = p.fs || 0.04; g.ball(tp[0] + r.f(-0.2, 0.2), Math.min(h - 0.3, tp[1]) - r.f(0.15, 0.35), tp[2] + r.f(-0.2, 0.2), fr, fr * 0.95, fr, { segs: 8, rings: 6 }); }
  }
  void cy;
  return { tier: 's', cast: true, posts: [[0, 0, r0 + 0.05, 0, trunkH]] };
});

// A shrub: a mound of leaf cards. p: { s (height), v, kind: 'leafA' | 'leafB' | 'blossom' | 'fern', leaf }
defineProp('lots-quiet.shrub', (g, p) => {
  const sz = p.s || 0.9, r = new Rng(hashStr('qshrub' + p.kind + p.v + sz)), n = 9 + (p.v % 3) * 2;
  for (let i = 0; i < n; i++) {
    const a = r.f(0, 6.28), rr = r.f(0, sz * 0.35), hh = sz * r.f(0.55, 0.95);
    g.mat(i % 4 === 3 && p.kind === 'blossom' ? 'leafA' : (p.kind || 'leafA'), mixHex(p.leaf || '#ffffff', '#b9d48a', r.next() * 0.3), { sway: 0.3 });
    g.card(Math.cos(a) * rr, 0, Math.sin(a) * rr, hh * 0.95, hh, a + r.f(-0.6, 0.6), { tilt: r.f(-0.25, 0.25) });
  }
  return { tier: 'd', cast: true };
});

// A wooden stake with a painted name board (the name itself is read, not drawn). p: { c (paint), wood }
defineProp('lots-quiet.stake', (g, p) => {
  g.mat('wood', p.wood || '#8a6240'); g.box(-0.018, 0, -0.018, 0.018, 0.5, 0.018, { bevel: 0.004 });
  g.mat('paint', p.c || '#e9dcc0'); g.push(); g.move(0, 0.47, 0.02); g.rotX(-0.35); g.box(-0.1, -0.05, 0, 0.1, 0.05, 0.012, { bevel: 0.004 }); g.pop();
  g.mat('plain', '#2a2622'); g.push(); g.move(0, 0.47, 0.02); g.rotX(-0.35); for (let i = 0; i < 2; i++) g.box(-0.07, -0.02 + i * 0.03, 0.0125, 0.03 + i * 0.03, -0.01 + i * 0.03, 0.014); g.pop();
  return { tier: 'd', cast: false };
});

// A cushion. p: { c, w, d, t }
defineProp('lots-quiet.cushion', (g, p) => {
  const w = p.w || 0.5, d = p.d || 0.5, t = p.t || 0.1;
  g.mat(p.mat || 'weave', p.c || '#8a2f3c');
  if (p.round) { g.ball(0, t * 0.5, 0, w / 2, t * 0.5, d / 2, { segs: 12, rings: 6 }); g.mat('weave', p.c2 || '#e9dcc0'); g.cyl(0, t * 0.96, 0, w * 0.08, 0.012, { segs: 8 }); }
  else g.box(-w / 2, 0, -d / 2, w / 2, t, d / 2, { bevel: t * 0.45 });
  return { tier: 'd', cast: false };
});

// A watering can, mended. p: { c }
defineProp('lots-quiet.can', (g, p) => {
  const c = p.c || '#5f7a6a';
  g.mat('brushed', c); g.lathe(0, 0, [[0, 0], [0.11, 0], [0.12, 0.02], [0.12, 0.22], [0.1, 0.24], [0, 0.24]], { segs: 12 });
  g.tube([[0.1, 0.06, 0], [0.24, 0.24, 0], [0.3, 0.3, 0]], [0.016, 0.012, 0.01], { segs: 5 });
  g.cyl(0.3, 0.29, 0, 0.03, 0.03, { segs: 8 });
  g.tube([[-0.1, 0.22, 0], [-0.06, 0.34, 0], [0.04, 0.34, 0], [0.08, 0.24, 0]], 0.009, { segs: 4 });
  g.mat('cast', '#c8a45a'); g.box(-0.122, 0.08, -0.05, -0.118, 0.14, 0.05);
  return { tier: 'd', cast: true, posts: [[0, 0, 0.12, 0, 0.3]] };
});

// A low bench with a felt top. p: { w, wood, felt }
defineProp('lots-quiet.lowbench', (g, p) => {
  const w = p.w || 1.6;
  g.mat('wood', p.wood || '#4a3426'); g.box(-w / 2, 0.3, -0.27, w / 2, 0.36, 0.27, { bevel: 0.01 });
  for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.12) - 0.04, 0, -0.24, sx * (w / 2 - 0.12) + 0.04, 0.3, 0.24, { bevel: 0.006 });
  g.mat('felt', p.felt || '#5b4a3e'); g.box(-w / 2 + 0.02, 0.36, -0.26, w / 2 - 0.02, 0.4, 0.26, { bevel: 0.015 });
  return { tier: 's', cast: true, solid: [[-w / 2, 0, -0.27, w / 2, 0.4, 0.27]] };
});

// A trowel, a dibber and a bundle of labels: what is left on a potting bench.
defineProp('lots-quiet.tools', (g) => {
  g.mat('brushed', '#9c978d'); g.push(); g.rotY(0.4); g.box(-0.04, 0, -0.08, 0.04, 0.008, 0.06, { bevel: 0.003 }); g.mat('wood', '#8a6240'); g.box(-0.012, 0.004, 0.06, 0.012, 0.024, 0.18, { bevel: 0.004 }); g.pop();
  g.mat('wood', '#b98a5a'); g.tube([[0.14, 0.012, -0.1], [0.14, 0.012, 0.08]], 0.012, { segs: 5 });
  g.mat('paint', '#efe6d2'); for (let i = 0; i < 5; i++) g.box(-0.2 + i * 0.012, 0, 0.1 + i * 0.006, -0.18 + i * 0.012, 0.004, 0.2 + i * 0.006);
  return { tier: 'd', cast: false };
});

// A pair of shoes, left at a door. p: { c }
defineProp('lots-quiet.shoes', (g, p) => {
  g.mat('weave', p.c || '#3a3530');
  for (const sx of [-0.06, 0.06]) { g.box(sx - 0.045, 0, -0.13, sx + 0.045, 0.06, 0.13, { bevel: 0.02 }); g.box(sx - 0.04, 0.05, 0.02, sx + 0.04, 0.09, 0.13, { bevel: 0.02 }); }
  g.mat('plain', '#2a2622'); for (const sx of [-0.06, 0.06]) g.box(sx - 0.046, 0, -0.131, sx + 0.046, 0.012, 0.131);
  return { tier: 'd', cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// shapes drawn in place
// ---------------------------------------------------------------------------------------------------------------
// A notice board drawn, not written: a framed cork board with papers pinned to it and lines of writing as strokes (the
// words are read through its prompt). On a wall at (p, q), facing local (dp, dq). Saves a sign on the block's atlas page.
export function noticeBoard(L, p, y, q, dp, dq, seed) {
  const g = L.g, r = new Rng(seed >>> 0), w = 0.9, h = 0.7;
  const A = (u, v, d) => (dp !== 0 ? [p + dp * d, y + v, q + u] : [p + u, y + v, q + dq * d]);
  const bx = (u0, v0, u1, v1, d0, d1) => { const a = A(u0, v0, d0), b = A(u1, v1, d1); L.box(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])); };
  g.mat('wood', '#5b4030'); bx(-w / 2 - 0.05, -h / 2 - 0.05, w / 2 + 0.05, h / 2 + 0.05, 0, 0.03);
  g.mat('rush', '#b58a5a'); bx(-w / 2, -h / 2, w / 2, h / 2, 0.03, 0.035);
  const papers = [[-0.3, 0.1, 0.24, 0.32], [0.02, 0.14, 0.26, 0.2], [0.3, 0.05, 0.2, 0.28], [-0.12, -0.2, 0.3, 0.2], [0.27, -0.24, 0.22, 0.14]];
  papers.forEach((pp, i) => {
    const cu = pp[0] + r.f(-0.02, 0.02), cv = pp[1] + r.f(-0.02, 0.02);
    g.mat('paper', ['#f1e8d4', '#e9dcc0', '#f4d9a8', '#dfe6d8', '#f1e8d4'][i]); bx(cu - pp[2] / 2, cv - pp[3] / 2, cu + pp[2] / 2, cv + pp[3] / 2, 0.035, 0.038);
    g.mat('plain', '#3a3330'); for (let k = 0; k < Math.floor(pp[3] / 0.05); k++) { const lv = cv + pp[3] / 2 - 0.04 - k * 0.045, lw = pp[2] * r.f(0.5, 0.8); bx(cu - pp[2] / 2 + 0.03, lv - 0.005, cu - pp[2] / 2 + 0.03 + lw, lv + 0.005, 0.038, 0.039); }
    g.mat('cast', ['#c9552e', '#2f6f73', '#d6a640'][i % 3]); { const c = A(cu, cv + pp[3] / 2 - 0.02, 0.042); L.ball(c[0], c[1], c[2], 0.008, 0.008, { segs: 5, rings: 3 }); }
  });
  L.s.flush({ tier: 'd', cast: false });
}

// A stepping stone (cheap: a flat lathe).
export function steppingStone(L, p, q, r, tint) {
  L.g.mat('stone', tint, { rough: 0.1 });
  L.lathe(p, q, [[0, 0.012], [r, 0.014], [r * 1.03, 0.04], [r * 0.8, 0.052], [0, 0.054]], { segs: 9 });
}

// A channel of running water between two points on a straight run (shares p or q). o: { w, edge, bed, water }
export function rill(L, a, b, o = {}) {
  const g = L.g, w = (o.w || 0.5) / 2, alongQ = Math.abs(a[0] - b[0]) < 1e-3;
  const p0 = Math.min(a[0], b[0]) - w, p1 = Math.max(a[0], b[0]) + w, q0 = Math.min(a[1], b[1]) - w, q1 = Math.max(a[1], b[1]) + w;
  g.mat('stone', o.edge || '#7a8070', { rough: 0.1 });
  if (alongQ) { L.box(p0, 0, q0, p0 + 0.12, 0.16, q1, { bevel: 0.015 }); L.box(p1 - 0.12, 0, q0, p1, 0.16, q1, { bevel: 0.015 }); }
  else { L.box(p0, 0, q0, p1, 0.16, q0 + 0.12, { bevel: 0.015 }); L.box(p0, 0, q1 - 0.12, p1, 0.16, q1, { bevel: 0.015 }); }
  g.mat('stone', o.bed || '#4d5248'); L.box(p0 + 0.1, 0, q0 + 0.1, p1 - 0.1, 0.03, q1 - 0.1, { faces: 'Y' });
  g.mat('plain', o.water || '#1f3d38', { rough: -0.48 }); L.box(p0 + 0.11, 0.09, q0 + 0.11, p1 - 0.11, 0.095, q1 - 0.11, { faces: 'Y' });
  L.s.flush({ tier: 's', cast: false });
  return [p0, q0, p1, q1];
}

// Distance from (p, q) to a polyline of [p, q].
export function distToPath(pts, p, q) {
  let d = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p - a[0]) * dx + (q - a[1]) * dz) / l2));
    d = Math.min(d, Math.hypot(p - a[0] - dx * t, q - a[1] - dz * t));
  }
  return d;
}

// A smooth path through waypoints (Catmull-Rom), sampled every `step` metres.
export function smoothPath(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1].slice());
  return out;
}

// A handrail on brackets along a wall (along p at depth q, the wall on the side `side` = +1 deeper / -1 shallower), y = 0.9.
export function wallRail(L, q, p0, p1, side, o = {}) {
  const g = L.g, y = o.y || 0.9, off = 0.07 * side;
  g.mat(o.mat || 'wood', o.tint || '#8a6240', { rough: -0.1 }); L.tube([[p0, y, q - off], [p1, y, q - off]], 0.024, { segs: 7 });
  g.mat('cast', o.metal || '#3d4a45');
  for (let p = p0 + 0.2; p <= p1 - 0.1; p += 1.4) L.tube([[p, y - 0.06, q], [p, y - 0.06, q - off * 0.6], [p, y - 0.01, q - off]], 0.008, { segs: 4 });
  L.s.flush({ tier: 'd', cast: false });
}
// The same, along q at p (the wall on the side `side` = +1 higher p / -1 lower p).
export function wallRailQ(L, p, q0, q1, side, o = {}) {
  const g = L.g, y = o.y || 0.9, off = 0.07 * side;
  g.mat(o.mat || 'wood', o.tint || '#8a6240', { rough: -0.1 }); L.tube([[p - off, y, q0], [p - off, y, q1]], 0.024, { segs: 7 });
  g.mat('cast', o.metal || '#3d4a45');
  for (let q = q0 + 0.2; q <= q1 - 0.1; q += 1.4) L.tube([[p, y - 0.06, q], [p - off * 0.6, y - 0.06, q], [p - off, y - 0.01, q]], 0.008, { segs: 4 });
  L.s.flush({ tier: 'd', cast: false });
}

