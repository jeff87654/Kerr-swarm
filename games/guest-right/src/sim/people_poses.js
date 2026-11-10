// People: poses and animation. Every pose is a function that writes target values for the skeleton's channels
// (see CH in people_rig.js) from a few things the mind has set on the person: what they are doing (p.pose, p.tag),
// how fast they are going (p.spd), their weight (p.g), the seat or work surface height, where they are looking,
// and whether they are speaking. The rig damps the channels toward the targets, so poses blend into each other.
// Arms are placed by where the hand should be (chest space, in arm reaches from the shoulder): an IK solves the elbow.
import { CH, BONE, bonePoint, eulerYXZ, emitOne } from './people_rig.js';
import { clamp, lerp, hexLin } from '../core/util.js';

const TAU = Math.PI * 2;
const ZERO3 = [0, 0, 0];
// every held thing has the same shape (the drawing loop stays fast)
function addItem(p, q) { p.items.push({ k: q.k, at: q.at, o: q.o || ZERO3, r: q.r || null, up: !!q.up, s: q.s || 0, cane: !!q.cane, col: q.col || null }); }
const AL = CH.AL, AR = CH.AR, LL = CH.LL, LR = CH.LR;
const bump = (x, c, w) => { let d = x - c; d -= Math.round(d); return Math.exp(-(d * d) / (w * w)); };
const tri = (x) => { const f = x - Math.floor(x); return f < 0.5 ? f * 2 : 2 - f * 2; };
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Put the wrist of arm `side` (1 left, -1 right) at a point in chest space, given in reference-chest metres (scaled to the person).
function hand(o, p, side, x, y, z, swivel, wp, wr) {
  const D = p.body.D, k = side > 0 ? AL : AR;
  const px = x * D.wSh, py = y * D.kTorso, pz = z * D.w;
  o[k] = (px - side * D.shX) / (side * D.reach); o[k + 1] = (py - D.shY) / D.reach; o[k + 2] = (pz + 0.005 * D.kTorso) / D.reach;
  if (swivel !== undefined) o[k + 3] = swivel; if (wp !== undefined) o[k + 4] = wp; if (wr !== undefined) o[k + 5] = wr;
}
// Hang an arm with gravity, whatever the chest is doing (bend = how far the chest leans forward, in radians)
function hang(o, side, bend, swing, out) {
  const k = side > 0 ? AL : AR, a = (swing || 0) - bend;
  o[k] = out === undefined ? 0.07 : out; o[k + 1] = -Math.cos(a) * 0.95; o[k + 2] = -Math.sin(a) * 0.95 + 0.04;
  o[k + 3] = 0; o[k + 4] = 0.12; o[k + 5] = 0;
}
function legs(o, side, flex, abd, twist, knee, ankle) { const k = side > 0 ? LL : LR; o[k] = flex; o[k + 1] = abd; o[k + 2] = twist; o[k + 3] = knee; o[k + 4] = ankle; }

// The base every pose starts from: standing, arms down, with the person's own stoop.
export function neutral(p, o) {
  o.fill(0);
  const L = p.body.L;
  o[CH.GROUND] = 1;
  o[CH.SB] = L.stoop; o[CH.HP] = -L.stoop * 0.75;
  hang(o, 1, L.stoop, 0); hang(o, -1, L.stoop, 0);
  legs(o, 1, 0.02 + L.stoop * 0.15, 0.04, 0.05, 0.05 + L.stoop * 0.3, -0.02); legs(o, -1, 0.02 + L.stoop * 0.15, 0.04, 0.05, 0.05 + L.stoop * 0.3, -0.02);
  o[CH.SB] += 0.012 * Math.sin(p.t * (1.3 + p.r1 * 0.4));        // breathing
}

// ----- standing
function armsHabit(o, p, habit, bend) {
  switch (habit) {
    case 'front': hand(o, p, 1, -0.05, 0.03, 0.17, -0.35, 0.15, 0.5); hand(o, p, -1, -0.03, 0.05, 0.19, 0.35, 0.15, 0.5); break;
    case 'back': hand(o, p, 1, 0.07, 0.03, -0.16, -0.9, -0.3, 0); hand(o, p, -1, 0.06, 0.05, -0.17, 0.9, -0.3, 0); break;
    case 'fold': hand(o, p, 1, -0.11, 0.21, 0.15, 1.1, 0.0, 0.4); hand(o, p, -1, -0.12, 0.25, 0.17, -1.1, 0.0, 0.4); break;
    case 'hips': hand(o, p, 1, 0.2, 0.0, 0.02, 1.4, 0.3, 0); hand(o, p, -1, 0.2, 0.0, 0.02, -1.4, 0.3, 0); break;
    default: hang(o, 1, bend, 0.04 * Math.sin(p.t * 0.7 + p.r2 * 4)); hang(o, -1, bend, 0.04 * Math.sin(p.t * 0.7 + p.r3 * 4));
  }
}
function stand(p, o, dt, habit) {
  const t = p.t, L = p.body.L;
  const w = Math.sin(t * (0.32 + 0.2 * p.r1) + p.r2 * 6.28) * 0.8 + Math.sin(t * 0.13 + p.r3 * 3) * 0.2;
  o[CH.RX] = 0.022 * w; o[CH.PR] = -0.045 * w; o[CH.SS] = 0.025 * w;
  const kl = 0.04 + 0.14 * Math.max(0, -w), kr = 0.04 + 0.14 * Math.max(0, w);
  legs(o, 1, 0.03 + kl * 0.4, 0.05 + 0.02 * w, 0.08, kl + L.stoop * 0.3, -kl * 0.3); legs(o, -1, 0.03 + kr * 0.4, 0.05 - 0.02 * w, 0.08, kr + L.stoop * 0.3, -kr * 0.3);
  armsHabit(o, p, habit || L.habit, o[CH.SB]);
}
function walk(p, o, dt) {
  const L = p.body.L, D = p.body.D, v = p.spd, g = clamp(p.g, 0.05, 1.2);
  const run = clamp((v - 2.0) / 1.2, 0, 1), lowg = clamp((0.85 - g) / 0.55, 0, 1);
  const legLen = D.hipY;
  let C = legLen * (1.25 + 0.62 * clamp(v - 0.5, 0, 3.5)) * (1 + 1.25 * lowg) * (0.92 + 0.16 * p.r1);
  if (L.elder) C *= 0.86;
  p.phase += v * dt / Math.max(C, 0.3);
  const amp = clamp(Math.asin(clamp(0.29 * C / legLen, 0, 0.95)), 0.06, 0.78) * clamp(v / 0.45, 0, 1);
  const ph = p.phase;
  for (let s = 0; s < 2; s++) {
    const side = s === 0 ? 1 : -1, f = ph + (s ? 0.5 : 0);
    const c2 = Math.cos(TAU * f);
    const hip = 0.06 + amp * c2 + run * 0.12 + lowg * 0.08;
    const knee = 0.06 + 0.16 * bump(f, 0.08, 0.08) * clamp(v, 0, 1) + (0.85 + 0.75 * run + 0.35 * lowg) * bump(f, 0.7, 0.14 + 0.03 * run) * clamp(v / 0.8, 0.25, 1) + L.stoop * 0.25;
    const ankle = -0.18 * bump(f, 0.0, 0.07) + 0.4 * bump(f, 0.58, 0.07) - 0.22 * bump(f, 0.78, 0.1);
    legs(o, side, hip, 0.035, 0.05, knee, ankle * clamp(v, 0, 1));
  }
  const c1 = Math.cos(TAU * ph);
  o[CH.PT] = -0.16 * amp * c1; o[CH.ST] = 0.12 * amp * c1; o[CH.HY] = 0.04 * amp * c1;
  o[CH.PR] = 0.035 * Math.sin(TAU * ph * 2) * (1 - run);
  o[CH.PP] = 0.03 + 0.08 * run; o[CH.SB] += 0.03 + 0.1 * run + 0.04 * lowg;
  // flight: a run, and the long floating lope of low weight
  const fl = (0.05 * run + 0.22 * lowg * clamp(v / 1.1, 0, 1)) * (1 + 0.3 * p.r2);
  o[CH.RY] = fl * Math.max(0, Math.sin(TAU * ph * 2 - 0.9));
  // arms counter-swing; running arms bend
  const bend = o[CH.SB];
  for (let s = 0; s < 2; s++) {
    const side = s === 0 ? 1 : -1, sw = -amp * (0.85 + 0.4 * run) * Math.cos(TAU * (ph + (s ? 0.5 : 0)));
    if (run > 0.2 || lowg > 0.5) {
      const k = side > 0 ? AL : AR; const a = sw * 1.1 - bend;
      o[k] = 0.1 + 0.15 * lowg; o[k + 1] = -0.55 * Math.cos(a) - 0.05 + 0.15 * lowg; o[k + 2] = 0.22 - 0.5 * Math.sin(a); o[k + 3] = -0.2 * side; o[k + 4] = 0.2; o[k + 5] = 0;
    } else hang(o, side, bend, sw, 0.08);
  }
  o[CH.FLARE] = amp * 0.6;
  o[CH.HP] += -0.03 * run;
  carry(p, o);
}
// carrying something while walking or standing
function carry(p, o) {
  switch (p.carry) {
    case 'crate': hand(o, p, 1, 0.24, -0.02, 0.27, 0.6, 0.6, 1.4); hand(o, p, -1, 0.24, -0.02, 0.27, -0.6, 0.6, 1.4); addItem(p, { k: 'crate', at: 'chest', o: [0, 0.02, 0.32], s: 0.9 }); o[CH.SB] -= 0.05; break;
    case 'basket': hand(o, p, -1, 0.12, 0.04, 0.06, 0.2, 0, 0); addItem(p, { k: 'basket', at: 'R', up: true, o: [0, -0.1, 0.0] }); break;
    case 'lamp': hand(o, p, -1, 0.14, 0.12, 0.3, 0.3, -0.5, 0); addItem(p, { k: 'lamp', at: 'R', up: true, o: [0, -0.1, 0.02] }); break;
    case 'cup': hand(o, p, -1, -0.02, 0.17, 0.25, 0.5, 0.5, 1.2); addItem(p, { k: 'cup', at: 'R', up: true, o: [0.04, -0.13, 0.02] }); break;
    case 'book': hand(o, p, 1, 0.12, 0.1, 0.16, 0.6, 0.3, 1.0); addItem(p, { k: 'book', at: 'L', o: [-0.03, -0.08, 0.04], r: [0, 0, 0] }); break;
    case 'cane': addItem(p, { k: 'cane', at: 'R', up: true, o: [0.0, -0.08, 0.02], cane: true }); { const k = AR; o[k] = 0.12; o[k + 1] = -0.82; o[k + 2] = 0.3; o[k + 4] = 0.4; } break;
    case 'broom': hand(o, p, 1, 0.0, 0.16, 0.25, 0.3, 0.2, 0.8); hand(o, p, -1, 0.03, -0.12, 0.3, -0.3, 0.2, 0.8); addItem(p, { k: 'broom', at: 'chest', o: [0.02, 0.0, 0.3], r: [0, 0.35, 0.15] }); break;
    case 'board': hand(o, p, 1, 0.1, 0.1, 0.18, 0.7, 0.2, 1.2); addItem(p, { k: 'board', at: 'L', o: [-0.04, -0.07, 0.05], r: [1.2, 0, 0] }); break;
    case 'plate': hand(o, p, -1, 0.0, 0.05, 0.3, 0.4, 0.9, 1.6); hand(o, p, 1, 0.0, 0.05, 0.3, -0.4, 0.9, 1.6); addItem(p, { k: 'plate', at: 'chest', o: [0, 0.03, 0.36] }); break;
    case 'flute': hand(o, p, 1, 0.1, 0.0, 0.05, 0.3, 0, 0); addItem(p, { k: 'flute', at: 'chest', o: [0.16, 0.1, 0.03], r: [0, 0, -1.35] }); break;
    default: break;
  }
}

// ----- sitting
function seatBase(p, o, hS, opts) {
  const D = p.body.D, L = p.body.L, t = p.t;
  o[CH.GROUND] = 0;
  const lean = (opts && opts.lean !== undefined) ? opts.lean : -0.05;
  o[CH.RY] = hS + 0.075 * D.wLimb + 0.012; o[CH.RZ] = -0.07 * D.kLeg;
  o[CH.PP] = -0.08; o[CH.SB] = L.stoop * 0.8 + lean; o[CH.HP] = -L.stoop * 0.6 + 0.04;
  // legs: thighs along the seat, feet to the floor (or dangling, for the small)
  const hipH = o[CH.RY] - 0.02 * D.kTorso;
  const zf = D.thigh * 0.93 + 0.03 + 0.05 * Math.sin(p.r2 * 9);
  const dy = hipH - D.ankle, d = Math.hypot(zf, dy), a = D.thigh, b = D.shin;
  let flex, knee;
  if (d >= a + b - 0.01) { flex = 1.42; knee = 0.95 + 0.35 * Math.sin(t * 2.4 + p.r1 * 5) * (L.child ? 1 : 0.2); }
  else {
    const phi = Math.atan2(zf, dy); const cb = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1);
    flex = phi + Math.acos(cb); knee = Math.PI - Math.acos(clamp((a * a + b * b - d * d) / (2 * a * b), -1, 1));
    flex = Math.min(flex, 1.75);
  }
  const spread = L.child ? 0.18 : 0.1 + 0.08 * p.r3;
  const cross = (opts && opts.cross) || (!L.child && p.r1 > 0.78 && !(opts && opts.nocross));
  legs(o, 1, flex, spread, 0.1, knee, -0.1); legs(o, -1, flex, spread, 0.1, knee, -0.1);
  if (cross) { legs(o, -1, flex + 0.25, -0.12, 0.25, knee - 0.25, 0.35); }
  // hands on the thighs
  hand(o, p, 1, 0.12, -0.03, 0.3, 0.3, 0.75, 0.4); hand(o, p, -1, 0.12, -0.03, 0.31, -0.3, 0.75, 0.4);
  if (L.habit === 'front' || L.habit === 'fold') { hand(o, p, 1, 0.0, -0.02, 0.3, -0.2, 0.6, 0.9); hand(o, p, -1, -0.02, 0.0, 0.32, 0.2, 0.6, 0.9); }
  p.sit = true;
}
function sitFloor(p, o) {
  const D = p.body.D;
  o[CH.GROUND] = 0; o[CH.RY] = 0.09 * D.kLeg + 0.02; o[CH.RZ] = 0; o[CH.PP] = -0.12; o[CH.SB] = 0.12;
  legs(o, 1, 1.35, 0.75, 0.75, 2.5, 0.2); legs(o, -1, 1.35, 0.75, 0.75, 2.5, 0.2);
  p.sit = true;
}

// ----- everything people do. Each pose: (p, o, dt)
export const POSES = {
  stand(p, o, dt) { stand(p, o, dt); carry(p, o); },
  walk,
  queue(p, o, dt) { stand(p, o, dt, p.body.L.habit === 'fold' ? 'fold' : p.body.L.habit === 'hips' ? 'hang' : p.body.L.habit); o[CH.SB] += 0.03; carry(p, o); },
  sit(p, o, dt) {
    seatBase(p, o, p.seatH, { lean: -0.06 });
    if (p.carry === 'cane') { hand(o, p, -1, -0.02, 0.0, 0.36, 0.4, 0.3, 0.6); hand(o, p, 1, -0.06, 0.04, 0.36, -0.4, 0.3, 0.6); addItem(p, { k: 'cane', at: 'R', up: true, o: [0, -0.08, 0.02], cane: true }); }
  },
  sitfloor(p, o) { sitFloor(p, o); hand(o, p, 1, 0.12, -0.1, 0.32, 0.4, 0.8, 0.3); hand(o, p, -1, 0.12, -0.1, 0.32, -0.4, 0.8, 0.3); o[CH.HP] += 0.2; },
  eat(p, o, dt) {
    seatBase(p, o, p.seatH, { lean: 0.16, nocross: true });
    const t = p.t, per = 6.5 + 2.5 * p.r1, f = ((t + p.r2 * per) / per) % 1;
    const up = ss(0.58, 0.7, f) * (1 - ss(0.8, 0.94, f));
    const ty = p.tableH - p.seatH;             // table top above the seat
    const by = ty - 0.12, bz = 0.36;           // the bowl, relative to the waist
    const sticks = p.r3 > 0.5, R = p.body.L.handed > 0 ? -1 : 1;
    const stir = Math.sin(t * 5) * 0.025 * (1 - up);
    hand(o, p, R, lerp(0.02 + stir, -0.02, up), lerp(by + 0.03, 0.42, up), lerp(bz + stir, 0.2, up), lerp(-0.6, -0.2, up) * R, lerp(0.7, 1.2, up), lerp(1.0, 1.6, up));
    if (sticks) { const lift = up * 0.5; hand(o, p, -R, lerp(0.06, 0.02, lift), lerp(by + 0.01, 0.25, lift), lerp(bz - 0.02, 0.24, lift), 0.5 * -R, 0.9, 1.4); }
    else hand(o, p, -R, 0.14, by + 0.0, bz - 0.05, 0.6 * -R, 0.9, 0.6);
    addItem(p, { k: sticks ? 'sticks' : 'spoon', at: R > 0 ? 'L' : 'R', o: [-R * 0.03, -0.09, 0.02], r: [0, -1.1, 0] });
    if (sticks && up > 0.05) addItem(p, { k: 'bowl', at: R > 0 ? 'R' : 'L', up: true, o: [R * 0.06, -0.13, 0.04], s: 0.9 });
    o[CH.SB] += 0.06 * (1 - up); o[CH.HP] += 0.28 * (1 - up) - 0.05 * up;
    // a drink now and then
    const dr = ((t + p.r3 * 40) % 23) / 23;
    if (dr > 0.85) { const u = Math.sin((dr - 0.85) / 0.15 * Math.PI); hand(o, p, -R, 0.02, lerp(by + 0.05, 0.42, u), lerp(0.3, 0.17, u), -0.3 * -R, 1.0, 1.6); addItem(p, { k: 'cup', at: R > 0 ? 'R' : 'L', up: true, o: [R * 0.055, -0.13, 0.03] }); o[CH.HP] -= 0.25 * u; }
  },
  drink(p, o, dt) {
    if (p.seatH > 0.2) seatBase(p, o, p.seatH, { lean: 0 }); else stand(p, o, dt);
    const dr = ((p.t + p.r3 * 10) % 9) / 9, u = dr > 0.7 ? Math.sin((dr - 0.7) / 0.3 * Math.PI) : 0;
    hand(o, p, -1, 0.0, lerp(0.15, 0.42, u), lerp(0.26, 0.17, u), 0.4, 1.0, 1.5);
    addItem(p, { k: 'cup', at: 'R', up: true, o: [0.055, -0.13, 0.03] }); o[CH.HP] -= 0.25 * u;
  },
  talk(p, o, dt) { stand(p, o, dt); gesture(p, o, 1); },
  sittalk(p, o, dt) { seatBase(p, o, p.seatH, { lean: 0.02 }); gesture(p, o, 0.7); },
  counter(p, o, dt) {
    stand(p, o, dt, 'hang');
    const t = p.t, wy = p.workH - p.body.D.hipY - p.body.D.waist + 0.04;
    const f = ((t + p.r1 * 30) % 14) / 14, serve = bump(f, 0.5, 0.08);
    hand(o, p, 1, 0.2, wy / p.body.D.kTorso, 0.3, 0.4, 1.0, 0.2); hand(o, p, -1, 0.18 - 0.1 * serve, wy / p.body.D.kTorso + 0.08 * serve, 0.3 + 0.25 * serve, -0.4, lerp(1.0, 0.5, serve), lerp(0.2, 1.4, serve));
    if (serve > 0.2) addItem(p, { k: 'cup', at: 'R', up: true, o: [0.055, -0.13, 0.03] });
    o[CH.SB] += 0.06;
    if (p.talking) gesture(p, o, 0.6);
  },
  work(p, o, dt) { (WORK[p.tag] || WORK.crew)(p, o, dt); },
  browse(p, o, dt) {
    stand(p, o, dt, 'back');
    const t = p.t, f = ((t + p.r2 * 20) % 11) / 11, reach = ss(0.55, 0.65, f) * (1 - ss(0.85, 0.95, f));
    if (reach > 0) { hand(o, p, -1, 0.05, lerp(0.0, 0.25 + 0.4 * p.r3, reach), lerp(0.1, 0.5, reach), -0.2, -0.2, 0.3); if (reach > 0.8) addItem(p, { k: p.r1 > 0.5 ? 'book' : 'cup', at: 'R', up: p.r1 <= 0.5, o: p.r1 > 0.5 ? [0.04, -0.09, 0.04] : [0.055, -0.13, 0.03] }); }
    o[CH.HP] += 0.12 + 0.15 * Math.sin(t * 0.4 + p.r1 * 4);
  },
  read(p, o, dt) {
    if (p.seatH > 0.2) seatBase(p, o, p.seatH, { lean: 0.05, nocross: true }); else stand(p, o, dt, 'hang');
    const t = p.t, turn = bump(((t + p.r1 * 30) % 9) / 9, 0.5, 0.05);
    hand(o, p, 1, 0.14, 0.12, 0.28, 0.5, 0.4, 1.2); hand(o, p, -1, lerp(0.14, -0.04, turn), 0.12 + 0.04 * turn, 0.28, -0.5, 0.4, 1.2);
    addItem(p, { k: 'bookopen', at: 'chest', o: [0, 0.16, 0.3], r: [0, -0.95, 0] });
    o[CH.HP] += 0.45; o[CH.SB] += 0.05;
  },
  readboard(p, o, dt) { stand(p, o, dt, 'back'); o[CH.HP] -= 0.12 + 0.05 * Math.sin(p.t * 0.3); },
  device(p, o, dt) {
    if (p.seatH > 0.2) seatBase(p, o, p.seatH, { lean: 0.08 }); else stand(p, o, dt, 'hang');
    hand(o, p, 1, 0.06, 0.06, 0.24, 0.6, 0.6, 1.4); hand(o, p, -1, 0.06, 0.06, 0.24, -0.6, 0.6, 1.4);
    addItem(p, { k: 'slate', at: 'chest', o: [0, 0.13, 0.27], r: [0, -0.9, 0] });
    o[CH.HP] += 0.55;
  },
  play(p, o, dt) { (PLAY[p.tag] || PLAY.run)(p, o, dt); },
  perform(p, o, dt) { (PERFORM[p.tag] || PERFORM.flute)(p, o, dt); },
  clap(p, o, dt) {
    if (p.seatH > 0.2 && p.spot && p.spot.type === 'sit') seatBase(p, o, p.seatH, { lean: 0.02, nocross: true }); else stand(p, o, dt, 'hang');
    const c = Math.abs(Math.sin(p.t * 7.5 + p.r1 * 3));
    hand(o, p, 1, -0.02 + 0.07 * c, 0.24, 0.3, -0.4, 0.2, 1.2); hand(o, p, -1, -0.02 + 0.07 * c, 0.24, 0.3, 0.4, 0.2, 1.2);
    o[CH.HP] -= 0.08;
  },
  wave(p, o, dt) { stand(p, o, dt); const w = Math.sin(p.t * 9); hand(o, p, -1, 0.3 + 0.07 * w, 0.95, 0.12, -1.2, 0, 0.4 * w); },
  lean(p, o, dt) {
    stand(p, o, dt, 'hang');
    o[CH.SB] = 0.38 + p.body.L.stoop * 0.5; o[CH.HP] = -0.32;
    const ry = (p.workH || 1.05) - p.body.D.hipY - p.body.D.waist;
    hand(o, p, 1, 0.1, ry / p.body.D.kTorso + 0.2, 0.45, 1.2, 1.2, 1.4); hand(o, p, -1, 0.1, ry / p.body.D.kTorso + 0.2, 0.47, -1.2, 1.2, 1.4);
    legs(o, -1, 0.12, -0.14, 0.2, 0.3, 0.45);
    o[CH.RZ] = -0.08;
  },
  bath(p, o) {
    seatBase(p, o, Math.max(0.15, p.seatH), { lean: -0.12, nocross: true });
    legs(o, 1, 1.15, 0.2, 0.15, 0.5, 0.2); legs(o, -1, 1.15, 0.2, 0.15, 0.5, 0.2);
    hand(o, p, 1, 0.3, -0.1, 0.12, 0.6, 0.4, 0); hand(o, p, -1, 0.3, -0.1, 0.12, -0.6, 0.4, 0);
    o[CH.HP] -= 0.1 + 0.05 * Math.sin(p.t * 0.4);
  },
  bed(p, o) {
    o[CH.GROUND] = 0; o[CH.RY] = (p.seatH || 0.5) + 0.12; o[CH.RPITCH] = -Math.PI / 2 + 0.06; o[CH.RZ] = 0.05;
    o[CH.SB] = 0.02 + 0.01 * Math.sin(p.t * 0.9); o[CH.HP] = 0.25;
    legs(o, 1, 0.08, 0.08, 0.1, 0.12, -0.6); legs(o, -1, 0.15, 0.06, 0.1, 0.25, -0.6);
    hang(o, 1, 0, 0, 0.12); hang(o, -1, 0, 0, 0.12); hand(o, p, -1, 0.06, 0.08, 0.14, 0.4, 0.3, 0.6);
    p.sit = true;
  },
  dance(p, o, dt) {
    const t = p.t + p.r1 * 2, per = 1.9, f = (t / per) % 1, n = Math.floor(t / per) % 2;
    neutral(p, o);
    const air = Math.sin(Math.PI * clamp((f - 0.12) / 0.76, 0, 1));
    o[CH.RY] = air * (0.42 + 0.12 * p.r2);
    const lift = air, side = n ? 1 : -1;
    legs(o, side, 0.3 + 0.9 * lift, 0.12, 0.1, 0.25 + 1.4 * lift, 0.4 * lift); legs(o, -side, -0.15 * lift, 0.1, 0.1, 0.15 + 0.3 * lift, 0.5 * lift);
    const crouch = 1 - ss(0.0, 0.14, f) * (1 - ss(0.88, 1.0, f));
    if (crouch > 0.3) { legs(o, 1, 0.45, 0.08, 0.1, 0.8, -0.3); legs(o, -1, 0.45, 0.08, 0.1, 0.8, -0.3); }
    hand(o, p, 1, 0.55, 0.55 + 0.3 * air, 0.15, 0.6, 0, 0.3); hand(o, p, -1, 0.55, 0.55 + 0.3 * air, 0.15, -0.6, 0, 0.3);
    o[CH.SB] = -0.06; o[CH.HP] = -0.12 - 0.1 * air; o[CH.ST] = 0.15 * Math.sin(TAU * f);
    o[CH.FLARE] = 0.3 * air;
  },
  talkto(p, o, dt) { stand(p, o, dt, 'hang'); gesture(p, o, p.talking ? 1 : 0); },
};
POSES.customer = POSES.queue;
POSES.chat = POSES.talk;

// conversation: the speaker's hands move; listeners nod
function gesture(p, o, k) {
  const t = p.t;
  if (p.talking) {
    const R = p.body.L.handed > 0 ? -1 : 1, g1 = Math.sin(t * 2.3 + p.r1 * 5), g2 = Math.sin(t * 3.7 + p.r2 * 4), g3 = Math.sin(t * 1.1);
    const ry = p.sit ? 0.12 : 0.16;
    hand(o, p, R, lerp(0.15, 0.24 + 0.08 * g1, k), lerp(0.02, ry + 0.07 * g2, k), lerp(0.2, 0.33 + 0.04 * g3, k), (0.2 - 0.3 * g1) * R, 0.4, lerp(0.3, 1.3 + 0.3 * g2, k));
    if (p.r3 > 0.45) hand(o, p, -R, lerp(0.15, 0.2 - 0.06 * g2, k * 0.8), lerp(0.02, ry - 0.05 + 0.05 * g1, k * 0.8), lerp(0.2, 0.28, k * 0.8), -0.2 * R, 0.4, 1.2);
    o[CH.HP] += 0.04 * Math.sin(t * 4.1); o[CH.HR] += 0.05 * g3;
  } else {
    o[CH.HP] += 0.09 * bump((t * 0.31 + p.r2) % 1, 0.5, 0.05);
    o[CH.HR] += 0.04 * Math.sin(t * 0.4 + p.r3 * 6);
  }
}

// ----- work, by the spot's tag
const surf = (p) => (p.workH - p.body.D.hipY - p.body.D.waist) / p.body.D.kTorso;        // the work surface, chest space
const WORK = {
  cook(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t, y = surf(p) + 0.08; o[CH.SB] += 0.12; o[CH.HP] += 0.3;
    const sw = ((t + p.r1 * 40) % 12) / 12, aside = bump(sw, 0.6, 0.08);
    hand(o, p, -1, 0.02 + 0.06 * Math.cos(t * 3.2) - 0.25 * aside, y + 0.1 + 0.03 * Math.sin(t * 3.2), 0.36 + 0.05 * Math.sin(t * 3.2), -0.3, 0.6, 0.6);
    hand(o, p, 1, 0.18, y + 0.02, 0.32, 0.4, 0.9, 0.3);
    addItem(p, { k: 'ladle', at: 'R', o: [0.03, -0.08, 0.01], r: [0, 0.3, 0] });
  },
  plate(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t, y = surf(p) + 0.06; o[CH.SB] += 0.1; o[CH.HP] += 0.28;
    const f = ((t + p.r1 * 20) % 4) / 4, x = lerp(0.3, -0.25, ss(0.2, 0.6, f)), lift = bump(f, 0.4, 0.15);
    hand(o, p, -1, x, y + 0.08 * lift, 0.34, -0.3, 0.9, 1.4); hand(o, p, 1, 0.15, y, 0.32, 0.4, 0.9, 0.3);
    if (f > 0.18 && f < 0.62) addItem(p, { k: 'bowl', at: 'R', up: true, o: [0.05, -0.12, 0.04] });
  },
  wash(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t, y = surf(p) - 0.02; o[CH.SB] += 0.2; o[CH.HP] += 0.35;
    hand(o, p, 1, 0.06 + 0.05 * Math.cos(t * 5), y + 0.03 * Math.sin(t * 5), 0.34, 0.3, 0.8, 0.8); hand(o, p, -1, 0.06 + 0.04 * Math.cos(t * 5 + 2), y + 0.02 * Math.sin(t * 5 + 2), 0.36, -0.3, 0.8, 0.8);
    addItem(p, { k: 'bowl', at: 'L', up: true, o: [-0.06, -0.12, 0.04] });
  },
  'pull-noodles'(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t, f = ((t / 1.7) % 1), y = surf(p) + 0.22;
    const sp = ss(0.1, 0.5, f) * (1 - ss(0.6, 0.95, f));
    hand(o, p, 1, lerp(0.02, 0.42, sp), y + 0.12 * Math.sin(TAU * f), 0.32 - 0.06 * sp, 0.5, 0.4, 1.1); hand(o, p, -1, lerp(0.02, 0.42, sp), y + 0.12 * Math.sin(TAU * f), 0.32 - 0.06 * sp, -0.5, 0.4, 1.1);
    o[CH.SB] += 0.06 + 0.04 * Math.sin(TAU * f); o[CH.HP] += 0.18;
  },
  mend(p, o, dt) {
    if (p.seatH > 0.2) seatBase(p, o, p.seatH, { lean: 0.14, nocross: true }); else { stand(p, o, dt, 'hang'); o[CH.SB] += 0.15; }
    const t = p.t, f = ((t + p.r1 * 10) % 2.6) / 2.6, pull = bump(f, 0.55, 0.12), y = p.sit ? 0.04 : surf(p) + 0.1;
    hand(o, p, 1, 0.04, y, 0.32, 0.4, 0.6, 1.0); hand(o, p, -1, lerp(0.02, 0.2, pull), y + 0.22 * pull, lerp(0.32, 0.26, pull), -0.4, 0.5, 1.0);
    addItem(p, { k: 'cloth', at: p.sit ? 'pelvis' : 'chest', o: p.sit ? [0, 0.1, 0.24] : [0, y * p.body.D.kTorso - 0.02, 0.33] });
    o[CH.HP] += 0.5;
  },
  dye(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t, y = surf(p) - 0.05, d = Math.sin(t * 1.6); o[CH.SB] += 0.18; o[CH.HP] += 0.3;
    hand(o, p, 1, 0.08, y + 0.1 * d, 0.38, 0.4, 0.6, 1.2); hand(o, p, -1, 0.08, y + 0.1 * d, 0.38, -0.4, 0.6, 1.2);
    addItem(p, { k: 'cloth', at: 'chest', o: [0, (y + 0.1 * d) * p.body.D.kTorso - 0.06, 0.42], r: [0, 0, 0] });
  },
  carve(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t, y = surf(p) + 0.08, st = tri(t * 0.9); o[CH.SB] += 0.16; o[CH.HP] += 0.4;
    hand(o, p, 1, 0.08, y, 0.36, 0.4, 0.8, 0.6); hand(o, p, -1, 0.0, y + 0.02, lerp(0.44, 0.3, st), -0.4, 0.6, 0.4);
    addItem(p, { k: 'knife', at: 'R', o: [0.03, -0.08, 0.01], r: [0, -1.2, 0] });
  },
  tune(p, o, dt) { const f = ((p.t + p.r1 * 9) % 10) / 10; if (f < 0.6) PERFORM.flute(p, o, dt); else { stand(p, o, dt, 'hang'); hand(o, p, -1, 0.05, 0.22, 0.3, -0.3, 0, 0.8); hand(o, p, 1, 0.12, 0.05, 0.3, 0.3, 0, 0.8); addItem(p, { k: 'flute', at: 'chest', o: [-0.02, 0.18, 0.3], r: [0, 0.2, -1.2] }); o[CH.HP] += 0.3; } },
  sweep(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t, sw = Math.sin(t * 2.2);
    hand(o, p, 1, 0.0 + 0.05 * sw, 0.14, 0.26, 0.3, 0.2, 0.8); hand(o, p, -1, 0.05 - 0.12 * sw, -0.1, 0.32, -0.3, 0.2, 0.8);
    addItem(p, { k: 'broom', at: 'chest', o: [0.02 - 0.1 * sw, 0.0, 0.3], r: [0.0, 0.42, 0.2 + 0.3 * sw] });
    o[CH.SB] += 0.12; o[CH.HP] += 0.25; o[CH.ST] = -0.15 * sw;
  },
  write(p, o, dt) {
    if (p.seatH > 0.2) seatBase(p, o, p.seatH, { lean: 0.2, nocross: true }); else { stand(p, o, dt, 'hang'); o[CH.SB] += 0.15; }
    const t = p.t, y = p.sit ? (p.tableH - p.seatH - 0.1) : surf(p) + 0.06;
    hand(o, p, -1, 0.02 + 0.03 * Math.sin(t * 6.5) + 0.06 * tri(t * 0.15), y, 0.34 + 0.01 * Math.sin(t * 9), -0.4, 1.0, 1.2); hand(o, p, 1, 0.15, y - 0.02, 0.32, 0.4, 1.0, 0.4);
    addItem(p, { k: 'brush', at: 'R', o: [0.02, -0.08, 0.02], r: [0, -0.5, 0] });
    o[CH.HP] += 0.5;
  },
  stall(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t, f = ((t + p.r2 * 30) % 7) / 7, r = bump(f, 0.5, 0.12), y = surf(p) + 0.06;
    const tx = 0.3 * Math.sin(Math.floor((t + p.r2 * 30) / 7) * 2.7);
    hand(o, p, -1, lerp(0.15, 0.12 + tx, r), y + 0.05 * (1 - r), lerp(0.25, 0.48, r), -0.3, 0.8, 0.6); hand(o, p, 1, 0.16, y, 0.26, 0.3, 0.8, 0.3);
    o[CH.SB] += 0.05 + 0.1 * r; o[CH.HP] += 0.15 * r;
    if (p.talking) gesture(p, o, 0.6);
  },
  porter(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t, f = ((t + p.r1 * 9) % 8) / 8, down = bump(f, 0.5, 0.14);
    legs(o, 1, 0.9 * down, 0.12, 0.1, 1.6 * down, -0.6 * down); legs(o, -1, 0.9 * down, 0.12, 0.1, 1.6 * down, -0.6 * down);
    o[CH.SB] += 0.35 * down;
    hand(o, p, 1, 0.24, lerp(-0.02, -0.1, down), 0.27, 0.6, 0.6, 1.4); hand(o, p, -1, 0.24, lerp(-0.02, -0.1, down), 0.27, -0.6, 0.6, 1.4);
    addItem(p, { k: 'crate', at: 'chest', o: [0, 0.02, 0.32], s: 0.9 });
  },
  crew(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t, f = ((t + p.r1 * 20) % 9) / 9, r = bump(f, 0.5, 0.15);
    hand(o, p, -1, 0.12, lerp(0.05, 0.6, r), lerp(0.25, 0.4, r), -0.3, 0.3, 0.4); hand(o, p, 1, 0.14, 0.08, 0.26, 0.3, 0.5, 0.4);
    o[CH.HP] -= 0.25 * r;
    addItem(p, { k: 'board', at: 'L', o: [-0.04, -0.07, 0.05], r: [1.2, 0, 0] });
  },
  notes(p, o, dt) {
    stand(p, o, dt, 'hang'); const t = p.t;
    hand(o, p, 1, 0.06, 0.12, 0.27, 0.6, 0.7, 1.3); hand(o, p, -1, 0.0 + 0.03 * Math.sin(t * 5), 0.17 + 0.02 * Math.sin(t * 3), 0.28, -0.6, 0.7, 1.3);
    addItem(p, { k: 'board', at: 'chest', o: [0.02, 0.14, 0.3], r: [0, -0.8, 0] });
    addItem(p, { k: 'brush', at: 'R', o: [0.02, -0.08, 0.02], r: [0, -0.7, 0] });
    o[CH.HP] += 0.42;
  },
  sew(p, o, dt) { WORK.mend(p, o, dt); },
  serve(p, o, dt) { POSES.counter(p, o, dt); },
};

// ----- children at play
const PLAY = {
  run(p, o, dt) { walk(p, o, dt); },
  hop(p, o, dt) {
    neutral(p, o); const t = p.t, per = 0.75, f = (t / per) % 1, n = Math.floor(t / per);
    const air = Math.sin(Math.PI * clamp((f - 0.2) / 0.6, 0, 1)), one = n % 3 !== 2;
    o[CH.RY] = air * 0.16 / Math.max(0.3, p.g);
    const s = n % 2 ? 1 : -1;
    if (one) { legs(o, s, 0.5, 0.05, 0, 1.4, 0.4); legs(o, -s, 0.2 * air, 0.05, 0, 0.2 + 0.4 * air, 0.3 * air); }
    else { legs(o, 1, 0.2 * air, 0.15, 0, 0.2 + 0.4 * air, 0.2); legs(o, -1, 0.2 * air, 0.15, 0, 0.2 + 0.4 * air, 0.2); }
    if (f < 0.2 || f > 0.8) { legs(o, 1, 0.35, 0.1, 0, 0.6, -0.3); if (!one) legs(o, -1, 0.35, 0.1, 0, 0.6, -0.3); }
    hand(o, p, 1, 0.5, 0.25, 0.1, 0.5, 0, 0); hand(o, p, -1, 0.5, 0.25, 0.1, -0.5, 0, 0);
    o[CH.SB] = 0.1; o[CH.HP] = 0.25;
  },
  catch(p, o, dt) {
    stand(p, o, dt, 'hang');
    const b = p.ball; if (!b) return;
    const mine = b.holder === p, coming = !mine && b.to === p;
    if (mine) {
      const f = clamp(b.hold / b.holdT, 0, 1), wind = ss(0.5, 0.85, f);
      hand(o, p, -1, 0.1, lerp(0.05, -0.2, wind) + 0.5 * ss(0.85, 1, f), lerp(0.3, -0.05, wind) + 0.6 * ss(0.85, 1, f), -0.3, 0.3, 1.0);
      hand(o, p, 1, 0.1, 0.05, 0.28, 0.3, 0.3, 1.0);
      o[CH.SB] += 0.1 * wind;
    } else if (coming) {
      hand(o, p, 1, 0.08, 0.15, 0.4, 0.4, 0.5, 1.4); hand(o, p, -1, 0.08, 0.15, 0.4, -0.4, 0.5, 1.4);
      o[CH.HP] -= 0.1;
    }
  },
  floor(p, o, dt) { POSES.sitfloor(p, o, dt); const t = p.t; hand(o, p, -1, 0.05 + 0.05 * Math.sin(t * 1.3), -0.12, 0.34 + 0.04 * Math.sin(t * 2.1), -0.4, 0.8, 0.3); },
  spin(p, o, dt) { stand(p, o, dt, 'hang'); hand(o, p, 1, 0.75, 0.25, 0.0, 0.5, 0, 0); hand(o, p, -1, 0.75, 0.25, 0.0, -0.5, 0, 0); o[CH.HP] = -0.2; },
};

// ----- music
const PERFORM = {
  flute(p, o, dt) {
    if (p.seatH > 0.2) seatBase(p, o, p.seatH, { lean: 0.04, nocross: true }); else stand(p, o, dt, 'hang');
    const t = p.t, sway = Math.sin(t * 0.9 + p.r1 * 3);
    // the flute runs from the lips out to the right, a little down and forward; the hands sit along it
    const D = p.body.D;
    const mx = 0.0, my = (D.neck + 0.085 * D.kHead) / D.kTorso, mz = (0.105 * D.kHead) / D.w;
    const dx = -0.94, dy = -0.2, dz = 0.28;
    hand(o, p, 1, (mx + dx * 0.24 * 1.0 + 0.0) , my + dy * 0.24 - 0.12, mz + dz * 0.24 + 0.05, 1.3, 0.2, 1.4);
    hand(o, p, -1, -(mx + dx * 0.56), my + dy * 0.56 - 0.1, mz + dz * 0.56 + 0.04, -0.6, 0.0, 1.4);
    addItem(p, { k: 'flute', at: 'chest', o: [mx * D.wSh + 0.04, my * D.kTorso - 0.005, mz * D.w], r: [-0.29, 0, 0.2], flute: true });
    o[CH.HY] = -0.2; o[CH.HP] = 0.1 + 0.04 * sway; o[CH.HR] = 0.12; o[CH.SS] = 0.04 * sway; o[CH.ST] = 0.06 * sway;
    p.noLook = true;
  },
  sing(p, o, dt) {
    if (p.seatH > 0.2) seatBase(p, o, p.seatH, { lean: -0.02, nocross: true }); else stand(p, o, dt, 'hang');
    const t = p.t, phrase = 0.5 + 0.5 * Math.sin(t * 0.45 + p.r1 * 5);
    hand(o, p, 1, 0.45 + 0.15 * phrase, 0.12 + 0.2 * phrase, 0.35, 0.6, -0.2, 1.4); hand(o, p, -1, 0.45 + 0.15 * phrase, 0.12 + 0.2 * phrase, 0.35, -0.6, -0.2, 1.4);
    o[CH.SB] = -0.05; o[CH.HP] = -0.12 - 0.08 * phrase; o[CH.SS] = 0.04 * Math.sin(t * 0.9);
    p.talking = 1;
  },
  drum(p, o, dt) {
    const t = p.t, b1 = Math.abs(Math.sin(t * 6.3)), b2 = Math.abs(Math.sin(t * 6.3 + 1.3));
    if (p.seatH > 0.2) {
      seatBase(p, o, p.seatH, { lean: 0.18, nocross: true });
      legs(o, 1, 1.4, 0.3, 0.2, 1.6, -0.1); legs(o, -1, 1.4, 0.3, 0.2, 1.6, -0.1);
      hand(o, p, 1, 0.06, 0.0 + 0.12 * b1, 0.4, 0.6, 1.0, 1.4); hand(o, p, -1, 0.06, 0.0 + 0.12 * b2, 0.4, -0.6, 1.0, 1.4);
      addItem(p, { k: 'drum', at: 'pelvis', o: [0, 0.04, 0.36], r: [0, -0.25, 0] });
    } else {
      stand(p, o, dt, 'hang');
      hand(o, p, 1, 0.22, 0.06, 0.12, 0.8, 0.3, 1.2);
      hand(o, p, -1, 0.12, 0.08 + 0.13 * b1, 0.24, -0.6, 1.0, 1.4);
      addItem(p, { k: 'drum', at: 'chest', o: [0.12, 0.02, 0.16], r: [0, -0.5, 0.35] });
    }
    o[CH.HP] += 0.15 + 0.04 * b1;
  },
};

// The full target for a person this frame: their pose, then the look on top.
export function poseTarget(p, dt, o) {
  p.items.length = 0; p.sit = false; p.noLook = false;
  neutral(p, o);
  const tmp = p.tmpUntil > p.t ? p.tmpPose : null;
  const f = (p.override && POSES[p.override]) || (tmp && POSES[tmp]) || POSES[p.pose] || POSES.stand;
  f(p, o, dt);
  if (!p.noLook) {
    const ly = clamp(p.lookYaw, -1.6, 1.6), lp = clamp(p.lookPitch, -0.6, 0.6);
    o[CH.HY] += ly * 0.75; o[CH.ST] += ly * 0.25 * (p.sit ? 0.6 : 1); o[CH.HP] += lp;
  }
}

// ----- held things: where they go each frame
export const ITEM_COL = {};
const _ic = (k, hex) => { const c = hexLin(hex); ITEM_COL[k] = [c[0], c[1], c[2], 1]; };
_ic('cup', '#d9cfb8'); _ic('bowl', '#e9e1cf'); _ic('plate', '#ece5d6'); _ic('basket', '#c9a86a'); _ic('flute', '#8a5a33'); _ic('book', '#8a2f3c'); _ic('bookopen', '#2f4f6a');
_ic('lamp', '#b08a45'); _ic('crate', '#b08d5e'); _ic('ball', '#e0607a'); _ic('spoon', '#ffffff'); _ic('sticks', '#6b4a2f'); _ic('cane', '#5a3a22'); _ic('broom', '#7a5233');
_ic('slate', '#ffffff'); _ic('board', '#8a6240'); _ic('ladle', '#ffffff'); _ic('drum', '#7a4a2a'); _ic('cloth', '#3a8a8a'); _ic('brush', '#6b4a2f'); _ic('knife', '#4a3020');
const _p = [0, 0, 0], _R = new Float64Array(9), _Rb = new Float64Array(9), _Ro = new Float64Array(9);
function mul3(A, B, out) { for (let k = 0; k < 3; k++) { const b0 = B[k * 3], b1 = B[k * 3 + 1], b2 = B[k * 3 + 2]; out[k * 3] = A[0] * b0 + A[3] * b1 + A[6] * b2; out[k * 3 + 1] = A[1] * b0 + A[4] * b1 + A[7] * b2; out[k * 3 + 2] = A[2] * b0 + A[5] * b1 + A[8] * b2; } return out; }
export function emitItems(p, list, byName, origin, stats) {
  const Bm = p.bones, D = p.body.D;
  for (let i = 0; i < p.items.length; i++) {
    const it = p.items[i]; const pm = byName.get('item-' + it.k); if (!pm) continue;
    const bone = it.at === 'L' ? BONE.HA_L : it.at === 'R' ? BONE.HA_R : it.at === 'chest' ? BONE.CHEST : it.at === 'pelvis' ? BONE.PELVIS : it.at === 'head' ? BONE.HEAD : -1;
    const o = it.o || [0, 0, 0];
    let x, y, z;
    if (bone >= 0) { bonePoint(Bm, bone, o[0], o[1], o[2], _p); x = _p[0]; y = _p[1]; z = _p[2]; } else { x = o[0]; y = o[1]; z = o[2]; }
    let sy = it.s || (it.k === 'flute' || it.k === 'broom' ? Math.max(0.75, D.H / 1.7) : D.kArm);
    if (it.up || bone < 0) {
      eulerYXZ(p.yaw + (it.r ? it.r[0] : 0), it.r ? it.r[1] : 0, it.r ? it.r[2] : 0, _R);
      let sx = sy, sz = sy, syy = sy;
      if (it.cane) { syy = Math.max(0.3, (y - p.y) / 0.87); }
      emitOne(pm, _R, sx, syy, sz, x, y, z, it.col || ITEM_COL[it.k], origin);
    } else {
      const bi = bone * 12; for (let k = 0; k < 9; k++) _Rb[k] = Bm[bi + k];
      eulerYXZ(it.r ? it.r[0] : 0, it.r ? it.r[1] : 0, it.r ? it.r[2] : 0, _R);
      mul3(_Rb, _R, _Ro);
      emitOne(pm, _Ro, sy, sy, sy, x, y, z, it.col || ITEM_COL[it.k], origin);
    }
    if (stats) stats.parts++;
  }
}
