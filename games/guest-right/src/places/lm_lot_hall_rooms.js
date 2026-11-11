// The lot hall's rooms round the Bowl: the foyer (three decks tall, the floor door, the stairs up to the rim and the
// gallery, the Urn), the cab lobby behind it, the Hatches (a corridor of offices, one clerk to a hatch) and at its end
// the Two Chairs, the small court where a quarrel sits before three neighbours drawn by lot.
import { floor, ceiling, wall, lamp, stairs } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { wallClock } from './civic_parts.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import {
  PI, SUB, B, FOY, M1, M2, LOB, HAT, CRT, SIDE_DOOR, DOOR_X, DOOR_W, C, FELTS,
  say, choose, toast, sfx, find, hour, day, tick, runX, wallRun, seat, brassPlate, berths, glassLathe, pickBy,
} from './lm_lot_hall_props.js';

const ENV_FOY = { exposure: 1.0, autoKey: 0.16, bloom: 0.07, warmth: 0.1 };
const ENV_ROOM = { exposure: 1.0, autoKey: 0.17, bloom: 0.05, warmth: 0.08 };
const FCLIP = [FOY.x0 - 0.1, -0.2, FOY.z0 - 0.1, FOY.x1 + 0.1, FOY.h + 0.1, FOY.z1 + 0.1];

// ---------------------------------------------------------------------------------------------------------------
// the foyer
// ---------------------------------------------------------------------------------------------------------------
export async function buildFoyer(game, s, f, r) {
  const g = s.g, { x0, x1, z0, z1, h } = FOY;
  const wo = { tint: '#c4936a', t: 0.24, dado: { h: 1.2, mat: 'panel', tint: C.teal }, skirt: '#2a1c14' };
  const wh = { tint: '#2e4f4c', t: 0.24, dado: { h: 1.2, mat: 'flute', tint: C.walnut }, skirt: '#2a1c14' };
  const wu = { tint: '#2e4f4c', t: 0.24, skirt: false };
  // the hall side (z = 20): the floor door at the bottom, the doors to the rim and the gallery above
  wallRun(s, 'x', z0, x0, x1, 0, 4, wh, [[-B.THROAT, B.THROAT * 2, 0, B.TUN]]);
  wallRun(s, 'x', z0, x0, x1, 4, 4, Object.assign({}, wh, { level: 1, dado: { h: 1.0, mat: 'flute', tint: C.walnut } }), [[-DOOR_X - DOOR_W / 2, DOOR_W, 0, 2.3], [DOOR_X - DOOR_W / 2, DOOR_W, 0, 2.3]]);
  wallRun(s, 'x', z0, x0, x1, 8, h - 8, Object.assign({}, wu, { level: 2 }), [[-DOOR_X - DOOR_W / 2, DOOR_W, 0, 2.3], [DOOR_X - DOOR_W / 2, DOOR_W, 0, 2.3]]);
  // the back (z = 38): the arch to the cab lobby; the two sides with their doors to the Hatches and the Pin Room
  wallRun(s, 'x', z1, x0, x1, 0, h, Object.assign({}, wo, { tintB: '#d9cbb0' }), [[-4.4, 8.8, 0, 3.3]]);
  wallRun(s, 'z', x0, z0, z1, 0, h, wo, [[SIDE_DOOR.z0, SIDE_DOOR.w, 0, 2.7]]);
  wallRun(s, 'z', x1, z0, z1, 0, h, wo, [[SIDE_DOOR.z0, SIDE_DOOR.w, 0, 2.7]]);
  floor(s, x0, z0, x1, z1, 0, 'stone', '#a89c88');
  ceiling(s, x0, z0, x1, z1, h, 'paint', '#3a2622');
  // the floor: pale pavers, a great inlaid token in the middle, a madder runner from the lobby to the floor door
  s.deco(() => {
    g.mat('terrazzo', '#c9b490'); g.lathe(0, 30.2, [[3.2, 0.004], [0, 0.004]], { segs: 40, capBottom: false, capTop: false });
    g.mat('terrazzo', '#2a3a3a'); g.lathe(0, 30.2, [[3.4, 0.003], [3.2, 0.003]], { segs: 40, capBottom: false, capTop: false });
    g.mat('cast', C.brass, { rough: -0.2 }); g.lathe(0, 30.2, [[2.2, 0.006], [2.08, 0.006]], { segs: 40, capBottom: false, capTop: false });
    g.mat('terrazzo', C.madder); g.lathe(0, 30.2, [[0.7, 0.006], [0, 0.006]], { segs: 24, capBottom: false, capTop: false });
    g.mat('felt', C.madder); g.box(-0.7, 0, 34.0, 0.7, 0.008, z1, { faces: 'Y' }); g.box(-0.7, 0, z0, 0.7, 0.008, 26.4, { faces: 'Y' });
    g.mat('felt', C.saffron); for (const sx of [-1, 1]) { g.box(sx * 0.7 - 0.06, 0, 34.0, sx * 0.7 + 0.06, 0.01, z1, { faces: 'Y' }); g.box(sx * 0.7 - 0.06, 0, z0, sx * 0.7 + 0.06, 0.01, 26.4, { faces: 'Y' }); }
  });
  // ceiling beams
  s.structure(() => { g.mat('wood', '#4a2e1e'); for (let x = -15; x <= 15; x += 5) g.box(x - 0.16, h - 0.5, z0 + 0.1, x + 0.16, h, z1 - 0.1, { faces: 'xXy' }); g.mat('cast', C.gilt, { rough: -0.1 }); for (let x = -15; x <= 15; x += 5) g.box(x - 0.165, h - 0.53, z0 + 0.1, x + 0.165, h - 0.5, z1 - 0.1, { faces: 'y' }); }, 2);
  await tick(game);

  // ---------------- the mezzanines: M1 along the hall side at deck 201, M2 in the middle at deck 202 ----------------
  floor(s, x0, z0, x1, M1.z1, M1.y, 'planks', '#8a6040', { level: 1 });
  floor(s, -M2.x, z0, M2.x, M2.z1, M2.y, 'planks', '#8a6040', { level: 2 });
  s.structure(() => {
    // soffits and slab edges, teal with a gilt line
    g.mat('paint', '#e6d2b0'); g.box(x0, M1.y - 0.36, z0, x1, M1.y - 0.34, M1.z1, { faces: 'y' }); g.box(-M2.x, M2.y - 0.36, z0, M2.x, M2.y - 0.34, M2.z1, { faces: 'y' });
    g.mat('paint', C.teal); g.box(x0, M1.y - 0.36, M1.z1 - 0.02, x1, M1.y + 0.02, M1.z1 + 0.1, { faces: 'ZyY' });
    g.box(-M2.x, M2.y - 0.36, M2.z1 - 0.02, M2.x, M2.y + 0.02, M2.z1 + 0.1, { faces: 'ZyY' });
    for (const sx of [-1, 1]) g.box(Math.min(sx * M2.x, sx * (M2.x + 0.1)), M2.y - 0.36, z0, Math.max(sx * M2.x, sx * (M2.x + 0.1)), M2.y + 0.02, M2.z1, { faces: (sx > 0 ? 'X' : 'x') + 'yY' });
    g.mat('cast', C.gilt, { rough: -0.2 }); g.box(x0, M1.y - 0.15, M1.z1 + 0.1, x1, M1.y - 0.11, M1.z1 + 0.11, { faces: 'Z' }); g.box(-M2.x, M2.y - 0.15, M2.z1 + 0.1, M2.x, M2.y - 0.11, M2.z1 + 0.11, { faces: 'Z' });
  }, 1);
  // columns under M1's edge and up to M2
  for (const x of [-11, -4, 4, 11]) { s.structure(() => { g.mat('cast', C.teal); g.lathe(x, M1.z1 - 0.3, [[0.18, 0], [0.18, 0.15], [0.12, 0.25], [0.1, M1.y - 0.5], [0.13, M1.y - 0.4], [0.22, M1.y - 0.36]], { segs: 12 }); }); s.post(x, M1.z1 - 0.3, 0.15, 0, M1.y - 0.36); }
  for (const x of [-4, 4]) { s.structure(() => { g.mat('cast', C.teal); g.lathe(x, M2.z1 - 0.3, [[0.15, M1.y], [0.1, M1.y + 0.2], [0.09, M2.y - 0.5], [0.12, M2.y - 0.4], [0.2, M2.y - 0.36]], { segs: 12 }); }, 1); s.post(x, M2.z1 - 0.3, 0.13, M1.y, M2.y - 0.36); }
  // the stairs: up the side walls to M1, then a flight each side along M1 to M2
  stairs(s, x0 + 1.2, 0, 30.6, 'z', 4, 6.6, 1.6, { mat: 'stone', tint: '#b3a690', level: 0 });
  stairs(s, x1 - 1.2, 0, 30.6, 'z', 4, 6.6, 1.6, { mat: 'stone', tint: '#b3a690', level: 0 });
  stairs(s, -13.6, M1.y, 23.25, 'X', 4, 6.6, 1.5, { mat: 'planks', tint: '#7a5233', level: 1 });
  stairs(s, 13.6, M1.y, 23.25, 'x', 4, 6.6, 1.5, { mat: 'planks', tint: '#7a5233', level: 1 });
  // their open sides: a stringer, a sloping brass rail on iron balusters, and a solid to keep feet on the steps
  const flightRail = (pa, pb, lv) => {
    s.structure(() => {
      g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[pa[0], pa[1] + 1.0, pa[2]], [pb[0], pb[1] + 1.0, pb[2]]], 0.025, { segs: 8 });
      g.mat('cast', C.iron); const n = Math.round(Math.hypot(pb[0] - pa[0], pb[2] - pa[2]) / 0.5);
      for (let i = 0; i <= n; i++) { const t = i / n, x = pa[0] + (pb[0] - pa[0]) * t, y = pa[1] + (pb[1] - pa[1]) * t, z = pa[2] + (pb[2] - pa[2]) * t; g.tube([[x, y, z], [x, y + 1.0, z]], 0.012, { segs: 5 }); }
    }, lv);
  };
  for (const sx of [-1, 1]) {
    const xr = sx * (FOY.x1 - 2.0);
    flightRail([xr, 0, 30.6], [xr, 4, 24.0], 0);
    s.solid(Math.min(xr - sx * 0.05, xr + sx * 0.05), 0, 24.0, Math.max(xr - sx * 0.05, xr + sx * 0.05), 5.0, 30.6);
    flightRail([sx * 13.6, 4, 24.0], [sx * 7.0, 8, 24.0], 1);
    flightRail([sx * 13.6, 4, 22.5], [sx * 7.0, 8, 22.5], 1);
    s.solid(Math.min(sx * 13.6, sx * 7.0), 4, 24.0, Math.max(sx * 13.6, sx * 7.0), 9.1, 24.12);
    s.solid(Math.min(sx * 13.6, sx * 7.0), 4.4, 22.38, Math.max(sx * 13.6, sx * 7.0), 9.1, 22.5);
  }
  // rails at the open edges of M1 and M2
  const ro = (lv) => ({ h: 1.05, tint: C.iron, rail: C.brass, railMat: 'cast', level: lv });
  railing(s, [[-16.0, M1.z1 + 0.05], [-13.6, M1.z1 + 0.05]], M1.y, ro(1));
  railing(s, [[13.6, M1.z1 + 0.05], [16.0, M1.z1 + 0.05]], M1.y, ro(1));
  railing(s, [[-7.0, M1.z1 + 0.05], [7.0, M1.z1 + 0.05]], M1.y, ro(1));
  railing(s, [[-M2.x, 22.45], [-M2.x, z0 + 0.15]], M2.y, ro(2));
  railing(s, [[M2.x, 22.45], [M2.x, z0 + 0.15]], M2.y, ro(2));
  railing(s, [[-M2.x + 0.05, M2.z1 + 0.05], [M2.x - 0.05, M2.z1 + 0.05]], M2.y, ro(2));
  // the passages through the hall's wall at the rim (deck 201) and the gallery (deck 202)
  for (const y of [B.RIM, B.GY]) for (const sx of [-1, 1]) {
    const xa = sx * (DOOR_X - DOOR_W / 2), xb = sx * (DOOR_X + DOOR_W / 2), lv = y > 5 ? 2 : 1;
    floor(s, Math.min(xa, xb), 17.6, Math.max(xa, xb), z0, y, 'planks', '#7a4e2e', { level: lv });
    ceiling(s, Math.min(xa, xb) - 0.1, 17.6, Math.max(xa, xb) + 0.1, z0, y + 2.4, 'paint', '#4a2e22', { level: lv, noCollide: true });
    for (const x of [xa, xb]) wall(s, x, 17.4, x, z0, y, 2.4, { tint: '#6a3a32', t: 0.16, dado: { h: 1.0, mat: 'flute', tint: C.walnut }, level: lv });
    sign(s, { kind: 'plate', text: y > 5 ? 'THE GALLERY' : 'THE RIM', lines: [y > 5 ? 'the public gallery · deck 202' : 'standing room · deck 201'] }, sx * DOOR_X, y + 2.62, z0 + 0.14, { face: 'Z', w: 0.62, h: 0.24, level: lv });
  }
  await tick(game);

  // ---------------- the floor door: open double doors, the lintel's name, the doorkeeper's desk ----------------
  s.structure(() => {
    g.mat('wood', C.walnut); g.box(-B.THROAT - 0.25, 0, z0 + 0.08, -B.THROAT, B.TUN + 0.25, z0 + 0.3, { bevel: 0.01 }); g.box(B.THROAT, 0, z0 + 0.08, B.THROAT + 0.25, B.TUN + 0.25, z0 + 0.3, { bevel: 0.01 });
    g.box(-B.THROAT - 0.25, B.TUN, z0 + 0.08, B.THROAT + 0.25, B.TUN + 0.4, z0 + 0.32, { bevel: 0.01 });
    // the two leaves, folded back against the wall, studded
    for (const sx of [-1, 1]) {
      g.mat('wood', '#6b3a22'); g.box(Math.min(sx * (B.THROAT + 0.3), sx * (B.THROAT + 0.3 + 1.82)), 0.02, z0 + 0.14, Math.max(sx * (B.THROAT + 0.3), sx * (B.THROAT + 0.3 + 1.82)), B.TUN - 0.04, z0 + 0.22, { bevel: 0.01 });
      g.mat('cast', C.brass, { rough: -0.2 }); for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) g.ball(sx * (B.THROAT + 0.55 + i * 0.44), 0.35 + j * 0.45, z0 + 0.225, 0.02, 0.02, 0.01, { segs: 6, rings: 3 });
    }
  });
  sign(s, { kind: 'letters', text: 'THE FLOOR', palette: ['#e8c67a'] }, 0, B.TUN + 0.66, z0 + 0.34, { face: 'Z', w: 2.6, h: 0.44, glow: 0.7 });
  sign(s, { kind: 'banner', title: 'THE LOT HALL', lines: ['the assembly', 'of Chervil'], palette: [C.madder, C.cream, C.saffron], emblem: 'drum' }, -3.6, 9.95, z0 + 0.16, { face: 'Z', w: 1.1, h: 2.6, level: 2 });
  sign(s, { kind: 'banner', title: 'BY LOT', lines: ['by ledger', 'in public'], palette: [C.saffron, '#2a1c14', C.madder], emblem: 'drum' }, 3.6, 9.95, z0 + 0.16, { face: 'Z', w: 1.1, h: 2.6, level: 2 });
  // the doorkeeper's desk, under M1, beside the floor door
  prop(s, 'counter', -4.2, 0, 21.6, 0, { w: 1.8, d: 0.6, h: 1.0, body: C.teal });
  prop(s, 'stool', -4.2, 0, 21.0, 0, { h: 0.7, wood: C.walnut });
  prop(s, 'civic.bell', -3.6, 1.0, 21.75, 0, {});
  prop(s, 'civic.desklamp', -4.9, 1.0, 21.5, 0.3, { shade: '#2f6f4a' });
  s.detail(() => { g.mat('paper', C.paper); for (let i = 0; i < 5; i++) g.box(-4.45 + i * 0.012, 1.0 + i * 0.008, 21.55, -4.1 + i * 0.012, 1.003 + i * 0.008, 21.8); g.mat('weave', '#7a2a3a'); g.box(-3.95, 1.0, 21.45, -3.7, 1.04, 21.8, { bevel: 0.004 }); });
  lamp(s, 'bulb', -4.9, 1.35, 21.5, { K: 2700, power: 0.4, range: 3, clip: FCLIP });
  s.spot('counter', -4.2, 0, 21.05, 0, { tags: ['doorkeeper', 'door'] });
  s.interact({ x: -4.2, y: 1.2, z: 22.3, radius: 1.3, kind: 'talk', prompt: 'Talk to the doorkeeper', onUse: doorkeeper });
  sign(s, { kind: 'notice', title: 'At the floor door', lines: ['When the Bowl sits:', 'members by this door,', 'everyone else up the stairs.', 'When it does not sit:', 'walk in, sit anywhere,', 'turn the Churn gently.'], palette: [C.cream, C.ink, C.madder] }, -2.35, 1.55, z0 + 0.14, { face: 'Z', w: 0.4, h: 0.56 });

  // ---------------- the foyer's walls: felt hangings over the stairs, a clock over the lobby arch ----------------
  for (const sx of [-1, 1]) for (const [za, zb, ci] of [[24.4, 27.4, 0], [28.0, 31.0, 1], [34.2, 37.2, 2]]) {
    const xw = sx * (x1 - 0.14), col = FELTS[(ci * 5 + (sx > 0 ? 3 : 0)) % FELTS.length], col2 = FELTS[(ci * 7 + (sx > 0 ? 5 : 1)) % FELTS.length];
    s.deco(() => {
      g.mat('felt', col, { sway: 0.05 }); g.sheet([xw, 10.6, za], [xw, 10.6, zb], [xw, 5.6, zb], [xw, 5.6, za], { ripple: 0.02, nu: 3, nv: 2 });
      g.mat('felt', col2); g.box(Math.min(xw, xw - sx * 0.02), 6.1, za + 0.02, Math.max(xw, xw - sx * 0.02), 6.6, zb - 0.02, { faces: sx > 0 ? 'x' : 'X' });
      g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[xw - sx * 0.02, 10.65, za - 0.1], [xw - sx * 0.02, 10.65, zb + 0.1]], 0.025, { segs: 6 });
    }, 2);
  }
  wallClock(s, game, 0, 5.4, z1 - 0.16, 'z', { r: 0.62, rim: C.teal });
  sign(s, { kind: 'plate', text: 'THE BOWL SITS', lines: ['Thursdays at seven · Booking Day all day'] }, 0, 4.45, z1 - 0.14, { face: 'z', w: 1.0, h: 0.3 });
  // ---------------- the draw board, benches, plants ----------------
  const DRAW = { kind: 'board', title: "This year's thousand", lines: ['Drawn at Knotnight|1,000', 'Said no once, drawn again|41', 'Sitting this year|1,000', 'Youngest|19', 'Oldest|104', 'Sits next|19:00, Thursdays'], palette: ['#1f3329', '#f3e6c8', '#e0a040'] };
  sign(s, DRAW, x0 + 0.14, 2.0, 35.6, { face: 'X', w: 1.8, h: 1.25, back: C.walnut });
  s.interact({ x: x0 + 1.1, y: 1.6, z: 35.6, radius: 1.4, prompt: "Read this year's thousand", onUse(gm) {
    say(gm, "This year's thousand", [
      'Drawn at Knotnight, a thousand of them, from every resident of Chervil old enough to vote on Booking Day. No standing, no asking, no list of the willing.',
      'You may say no once. If your name comes out a second time, you sit. Forty-one of this year\'s were drawn twice.',
      'They are paid an hour\'s rate for every hour in the Bowl, from the commons, and their halls hold their place at the long table. The youngest is nineteen. The oldest is a hundred and four, and has asked for a cushion.',
    ]);
    find(gm, 'drawn-by-lot');
  } });
  for (const [x, z, yaw] of [[-9, 36.9, PI], [-5.5, 36.9, PI], [5.5, 36.9, PI]]) {
    prop(s, 'bench', x, 0, z, yaw, { w: 2.2, wood: pickBy(['#7a5233', '#5a3a24', '#8a6040'], Math.round(x)), back: true });
    for (const o of [-0.6, 0.6]) s.spot('sit', x + o, 0.46, z + 0.02, yaw, { tags: ['wait', 'foyer'] });
  }
  // benches round the inlaid token, back to back with it, for waiting on a sitting
  for (let i = 0; i < 4; i++) {
    const a = (i + 0.5) / 4 * PI * 2, x = Math.sin(a) * 4.3, z = 30.2 + Math.cos(a) * 4.3, yaw = a;
    prop(s, 'bench', x, 0, z, yaw, { w: 2.0, wood: pickBy(['#5a3a24', '#7a5233'], i), back: true });
    for (const o of [-0.5, 0.5]) s.spot('sit', x + Math.cos(a) * o + Math.sin(a) * 0.02, 0.46, z - Math.sin(a) * o + Math.cos(a) * 0.02, yaw, { tags: ['wait', 'foyer'] });
  }
  for (const [x, z, k] of [[-16.6, 36.8, 'broad'], [16.6, 36.8, 'fern'], [-8, 21, 'broad'], [8, 21, 'fern']]) prop(s, 'plant', x, 0, z, 0.4, { kind: k, size: 1.5, pot: pickBy([C.madder, C.saffron, C.tealL], Math.round(x)), seed: Math.round(x * 3) });
  s.spot('chat', -7.0, 0, 29.4, 2.0, { tags: ['foyer'] }); s.spot('chat', -6.0, 0, 28.7, -1.0, { tags: ['foyer'] }); s.spot('chat', -5.8, 0, 30.0, -2.3, { tags: ['foyer'] });
  s.spot('chat', 7.0, 0, 26.0, -2.4, { tags: ['foyer'] }); s.spot('chat', 6.1, 0, 26.7, 1.0, { tags: ['foyer'] });
  for (let i = 0; i < 4; i++) s.spot('stand', -2.2 + i * 1.4, M1.y, M1.z1 - 0.5, 0, { tags: ['rail', 'view'] });
  for (let i = 0; i < 3; i++) s.spot('stand', -3 + i * 3, M2.y, M2.z1 - 0.5, 0, { tags: ['rail', 'view'] });

  // ---------------- light: felt lanterns down the stairwell, sconces, the mezzanines' downlights ----------------
  const lc = [C.saffron, '#e07a3a', '#c4553a', '#e8b84a', C.saffron, '#c4553a'];
  let li = 0;
  for (const z of [27.4, 33.2]) for (const x of [-9.5, 0, 9.5]) { const y = 6.6 + (li % 3) * 0.9; lamp(s, 'lantern', x, y, z, { tint: lc[li], r: 0.42, hh: 0.7, drop: h - y - 0.4, power: 3.0, range: 13, K: 2600, clip: FCLIP }); li++; }
  for (const x of [-12, 12]) lamp(s, 'sconce', x, 2.6, z1 - 0.14, { face: 'z', K: 2900, power: 0.9, range: 6, clip: FCLIP });
  for (const z of [26, 35.5]) for (const sx of [-1, 1]) lamp(s, 'sconce', sx * (x1 - 0.14), 2.7, z, { face: sx > 0 ? 'x' : 'X', K: 2900, power: 0.8, range: 6, clip: FCLIP });
  for (const x of [-12, -6, 0, 6, 12]) lamp(s, 'spot', x, M1.y - 0.38, 22, { K: 3000, power: 0.5, range: 5, cone: [55, 30], clip: FCLIP });
  for (const x of [-4, 4]) lamp(s, 'globe', x, M2.y - 0.1, 22.4, { K: 2800, power: 0.8, range: 6, drop: 0.5, r: 0.16, clip: FCLIP });
  s.ambient({ box: FCLIP, sky: '#ffd2a0', ground: '#a07a58', power: 0.12, soft: 1.5, lamp: true });

  // ---------------- the Urn: tea in the foyer's corner ----------------
  urn(game, s, f);
  // ---------------- the cab lobby ----------------
  lobby(game, s, f);
  // ---------------- walkways ----------------
  s.path([[0, 41.4], [0, 38], [0, 33], [0, 21], [0, 20]], { width: 1.8 });
  s.path([[0, 33], [-8, 33.4], [-14.5, 33.5], [x0, 33.5], [x0 - 2, 33.5]], { width: 1.6 });
  s.path([[0, 33], [8, 33.4], [14.5, 33.5], [x1, 33.5], [x1 + 2, 33.5]], { width: 1.6 });
  for (const sx of [-1, 1]) {
    const xs = sx * (x1 - 1.2);
    s.path([[sx * 8, 0, 33.4], [xs, 0, 31.4], [xs, 4, 24.2], [xs, 4, 21.6], [sx * 14.2, 4, 21.6], [sx * 13.9, 4, 23.25], [sx * 7.2, 8, 23.25], [sx * 6.0, 8, 23.0], [sx * DOOR_X, 8, 21.4]], { width: 1.2 });
    s.path([[sx * 14.2, 4, 21.6], [sx * DOOR_X, 4, 21.6]], { width: 1.4 });
  }
  s.path([[0, 21], [-3.2, 22.6]], { width: 1.0 });
  s.zoneBox({ id: 'lh-foyer', place: 'lot-hall', box: [x0, -0.5, z0, x1, h, z1], name: 'The lot hall', sub: SUB, ambience: 'arcade', reverb: 'hall', headroom: M1.y - 0.4, env: ENV_FOY });
  s.loop('murmur', 0, 1.5, 30, { vol: 0.14, radius: 14, param: 0.25 });
  void r;
}

async function doorkeeper(gm) {
  if (!gm.flags.lhDoor) {
    gm.flags.lhDoor = true;
    await say(gm, { name: 'The doorkeeper', colour: '#3fa7a3' }, ['A guest. Where did you sleep last night, and have you eaten. Good. Then you may go anywhere in the building, and you will, because everybody does.']);
  }
  const pick = await choose(gm, { name: 'The doorkeeper', colour: '#3fa7a3' }, 'The doorkeeper puts down a pencil.', [
    { label: 'Who sits in the Bowl?', value: 'who' },
    { label: 'Why is it called the floor door?', value: 'door' },
    { label: 'What do you do, exactly?', value: 'job' },
    { label: 'Where can I get tea?', value: 'tea' },
  ]);
  if (pick === 'who') {
    await say(gm, { name: 'The doorkeeper', colour: '#3fa7a3' }, ['A thousand people drawn by lot at Knotnight, from everybody. Cooks, a lamp-painter or two, a pump fitter from the Keel, a woman of a hundred and four. Nobody asked to come.', 'They sit a year, set the commons, give their split on Booking Day, and send the one question they cannot settle to the whole drum. Then they go home and watch from the gallery like the rest of us.']);
    find(gm, 'drawn-by-lot');
  } else if (pick === 'door') {
    await say(gm, { name: 'The doorkeeper', colour: '#3fa7a3' }, ['Because it comes out on the floor of the Bowl, at the bottom, in front of everyone. Members walk in under the back rows and come up into the light with a thousand chairs round them.', 'It is meant to be a little alarming. It works on me, and I have stood here eleven years.']);
  } else if (pick === 'job') {
    await say(gm, { name: 'The doorkeeper', colour: '#3fa7a3' }, ['I keep the door, I keep the time, and I carry notes from the gallery down to the floor, folded once. Nobody may call down from the gallery. Anybody may write.', 'Most of the notes say the same thing. Speak up.']);
  } else if (pick === 'tea') {
    await say(gm, { name: 'The doorkeeper', colour: '#3fa7a3' }, ['The Urn, in the corner by the lobby. Lids on, the air takes the heat out of a cup in no time. Bring the cup back or the Urn will come and find you.']);
  }
}

// The Urn: a tea stall with a copper urn on the loop's warm plate, a chalk board, small tables.
function urn(game, s, f) {
  const g = s.g, cx = 12.0, cz = 36.6;
  prop(s, 'counter', cx, 0, cz, PI, { w: 3.2, d: 0.7, h: 0.95, body: C.madder });
  prop(s, 'lothall.urn', cx - 0.8, 0.95, cz - 0.05, 0, { r: 0.19 });
  prop(s, 'civic.kettle', cx + 0.5, 0.95, cz - 0.1, 0.4, { enamel: C.teal });
  for (let i = 0; i < 8; i++) prop(s, 'cup', cx + 0.9 + (i % 4) * 0.12, 0.95, cz - 0.2 + Math.floor(i / 4) * 0.13, 0, { glaze: pickBy(['#efe4cc', C.saffron, '#2f6f73', '#d4878a'], i), lid: '#efe4cc' });
  s.detail(() => { g.mat('wood', '#c9a06a'); g.box(cx - 0.2, 0.95, cz - 0.25, cx + 0.2, 0.98, cz + 0.05, { bevel: 0.006 }); g.mat('cane', '#c9a46a'); g.cyl(cx + 0.05, 0.98, cz - 0.1, 0.12, 0.06, { segs: 14 }); });
  // a striped canopy on two iron posts, a shelf of lent cups on the wall behind, a crate of clean lids
  s.furniture(() => {
    g.mat('cast', C.iron); for (const sx of [-1, 1]) g.tube([[cx + sx * 1.65, 0, cz - 0.55], [cx + sx * 1.65, 2.75, cz - 0.55]], 0.025, { segs: 6 });
    g.tube([[cx - 1.65, 2.75, cz - 0.55], [cx + 1.65, 2.75, cz - 0.55]], 0.02, { segs: 6 });
    for (let i = 0; i < 8; i++) { g.mat('stripe', i % 2 ? C.cream : C.madder, { sway: 0.03 }); const xa = cx - 1.7 + i * 0.425; g.sheet([xa, 2.78, cz - 0.6], [xa + 0.425, 2.78, cz - 0.6], [xa + 0.425, 3.05, 37.85], [xa, 3.05, 37.85], { sag: 0.04, nu: 2, nv: 2 }); g.mat('stripe', i % 2 ? C.cream : C.madder); g.sheet([xa, 2.78, cz - 0.6], [xa + 0.425, 2.78, cz - 0.6], [xa + 0.425, 2.5, cz - 0.62], [xa, 2.5, cz - 0.62], { ripple: 0.02, nu: 2, nv: 1 }); }
    g.mat('wood', C.walnut); g.box(cx + 0.6, 1.55, 37.6, cx + 1.7, 1.58, 37.86, { bevel: 0.006 });
  });
  for (let i = 0; i < 6; i++) prop(s, 'cup', cx + 0.7 + i * 0.17, 1.58, 37.72, 0, { glaze: pickBy(['#efe4cc', C.saffron, '#2f6f73', '#d4878a', C.madder], i + 1), lid: '#efe4cc' });
  prop(s, 'crate', cx - 1.3, 0, 37.5, 0.1, { w: 0.5, h: 0.36, d: 0.36, wood: '#a07a50' });
  sign(s, { kind: 'chalk', title: 'The Urn', lines: ['Tea, poured long  0.15', 'Coffee  0.15', 'A bowl of the Nine  0.17', 'Steamed bun, lidded  0.30', 'Members after the sitting:', 'the second pot is free'] }, cx, 1.85, 37.86, { face: 'z', w: 0.9, h: 1.1 });
  sign(s, { kind: 'hanging', text: 'THE URN', sub: 'tea · lids on', emblem: 'cup', palette: [C.cream, C.madder, C.saffron] }, cx - 1.9, 2.5, cz - 0.2, { face: 'X', double: true, w: 0.5, h: 0.5 });
  s.deco(() => { g.mat('cast', '#2f2c28'); g.tube([[cx - 1.9, 2.8, cz - 0.2], [cx - 1.9, 3.3, cz - 0.2]], 0.01, { segs: 5 }); });
  lamp(s, 'globe', cx - 0.6, 2.3, cz - 0.2, { K: 2600, power: 0.9, range: 5, drop: 1.0, r: 0.18, clip: FCLIP });
  lamp(s, 'globe', cx + 0.8, 2.3, cz - 0.2, { K: 2600, power: 0.7, range: 5, drop: 1.0, r: 0.15, clip: FCLIP });
  s.spot('counter', cx, 0, cz + 0.6, PI, { tags: ['tea', 'urn'] });
  for (const [x, z] of [[10.2, 33.0], [13.8, 33.4]]) {
    prop(s, 'table', x, 0, z, 0, { w: 0.8, d: 0.8, round: true, wood: '#6b4429' });
    prop(s, 'cup', x + 0.12, 0.74, z - 0.1, 0, { glaze: C.saffron, lid: '#efe4cc' });
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + 0.4; prop(s, 'stool', x + Math.sin(a) * 0.62, 0, z + Math.cos(a) * 0.62, a + PI, { h: 0.46, wood: '#7a5233' }); }
  }
  s.spot('customer', cx - 0.4, 0, cz - 1.0, PI, { tags: ['tea', 'queue'] }); s.spot('queue', cx - 0.4, 0, cz - 1.9, PI, { tags: ['tea'] });
  s.interact({ x: cx, y: 1.1, z: cz - 0.9, radius: 1.4, prompt: 'Buy tea at the Urn', async onUse(gm) {
    if (!gm.ui || !gm.ui.menu) return;
    const items = [
      { id: 'tea', name: 'Tea, poured long', desc: 'Poured from a height into a lidded cup. The stream lands a little anti.', price: 0.15 },
      { id: 'coffee', name: 'Coffee', desc: 'Cell-culture coffee, black, from the Vats.', price: 0.15 },
      { id: 'nine', name: 'A bowl of the Nine', desc: 'Bitter greens from the Mill table. Somebody will tell you to have some anyway.', price: 0.17 },
      { id: 'bun', name: 'A steamed bun', desc: 'Under a cloth lid, sweet bean in the middle.', price: 0.3 },
    ];
    gm.busy++;
    try {
      const id = await gm.ui.menu({ kicker: 'The Urn', title: 'Tea in the lot hall', note: 'Lids on. The air takes the heat out of a cup in no time.', items, wallet: gm.wallet ? gm.wallet.kwh : 0 });
      const it = items.find((q) => q.id === id); if (!it) return;
      if (gm.wallet && !gm.wallet.spend(it.price, it.name)) return;
      sfx(gm, it.id === 'bun' ? 'lid-up' : 'pour', f, cx - 0.8, 1.2, cz);
      toast(gm, it.id === 'tea' ? 'Poured from arm\'s height, and the stream bends a hand\'s width before it lands. The lid goes on at once.' : it.id === 'nine' ? 'Bitter, green, good for you. The woman behind the urn watches until you have eaten some.' : it.id === 'bun' ? 'Under its cloth lid, still warm. The bean paste is from a Vat line on deck 6.' : 'Black, from the Vats, in a cup with a dented lid.');
    } finally { gm.busy--; }
  } });
  s.loop('steam', cx - 0.8, 1.3, cz, { vol: 0.06, radius: 5 });
  void game;
}

// The cab lobby: two berths on its back wall, a bench, a plan of the building.
function lobby(game, s, f) {
  const g = s.g, { x0, x1, z0, z1, h } = LOB;
  const clip = [x0 - 0.1, -0.2, z0 - 0.4, x1 + 0.1, h + 0.1, z1 + 0.1];
  floor(s, x0, z0, x1, z1, 0, 'terrazzo', '#b8a58a');
  ceiling(s, x0, z0, x1, z1, h, 'paint', '#e6d8b8');
  const wo = { tint: '#d9cbb0', t: 0.2, dado: { h: 1.1, mat: 'panel', tint: C.teal } };
  wall(s, x0, z0, x0, z1, 0, h, wo); wall(s, x1, z0, x1, z1, 0, h, wo); wall(s, x0, z1, x1, z1, 0, h, wo);
  s.structure(() => { g.mat('wood', '#4a2e1e'); for (const z of [40, 43]) g.box(x0, h - 0.24, z - 0.1, x1, h, z + 0.1, { faces: 'yzZ' }); });
  berths(s, 0, z1 - 0.12, PI, 'lot-hall');
  sign(s, { kind: 'street', text: 'Cabs · the lot hall', sub: 'deck 200 · Ring Five', palette: ['#22302c', '#f1ead8'] }, 0, 2.95, z1 - 0.14, { face: 'z', w: 2.4, h: 0.4, glow: 0.8 });
  prop(s, 'bench', x0 + 0.5, 0, 42, PI / 2, { w: 2.4, wood: '#5a3a24', back: true });
  for (const z of [41.4, 42.6]) s.spot('sit', x0 + 0.52, 0.46, z, PI / 2, { tags: ['wait', 'lobby'] });
  const PLAN = { kind: 'board', title: 'The lot hall', lines: ['The Bowl|through the floor door', 'The rim|deck 201, up the stairs', 'The gallery|deck 202', 'The Hatches|anti, past the plants', 'The Two Chairs|end of the Hatches', 'The Pin Room|spinward', 'The Urn|in the corner'], palette: ['#1f3329', '#f3e6c8', '#e0a040'] };
  sign(s, PLAN, x1 - 0.12, 1.8, 42, { face: 'x', w: 1.5, h: 1.1, back: C.walnut });
  lamp(s, 'panel', 0, h, 40.6, { w: 1.6, d: 0.5, K: 3200, power: 0.9, clip });
  lamp(s, 'panel', 0, h, 44.2, { w: 1.6, d: 0.5, K: 3200, power: 0.8, clip });
  s.zoneBox({ id: 'lh-lobby', place: 'lot-hall', box: [x0, -0.5, z0, x1, h, z1], name: 'The lot hall', sub: 'the cab lobby · deck 200 · Ring Five', ambience: 'arcade', reverb: 'room', env: ENV_ROOM });
  void game; void f;
}

// ---------------------------------------------------------------------------------------------------------------
// the Hatches: a corridor of offices, each a hatch with a brass plate and one clerk
// ---------------------------------------------------------------------------------------------------------------
const OFFICES = [
  { id: 'hours', x0: -26.5, x1: -20, name: 'HOURS', sub: 'given and swapped', wall: '#e3d3b0', accent: C.saffron },
  { id: 'heat', x0: -33, x1: -26.5, name: 'HEAT', sub: 'unmetered light', wall: '#d9c8a8', accent: C.madder },
  { id: 'batches', x0: -39.5, x1: -33, name: 'BATCHES', sub: 'in by eleven · out by seven', wall: '#d8d0b8', accent: C.tealL },
  { id: 'lawns', x0: -46, x1: -39.5, name: 'LAWNS', sub: "the Hollow's grass, by the hour", wall: '#dfd6b0', accent: C.moss },
];
export async function buildHatches(game, s, f, r) {
  const g = s.g, { x0, x1, z0, z1, h, oz0 } = HAT;
  const clip = [x0 - 0.1, -0.2, z0 - 0.1, x1 + 0.1, h + 0.1, z1 + 0.1];
  floor(s, x0, z0, x1, z1, 0, 'terrazzo', '#a8987a');
  ceiling(s, x0, z0, x1, z1, h, 'paint', '#e9dfc8');
  s.deco(() => {
    g.mat('terrazzo', '#2a3a3a'); runX(x0, x1, 8, (a, b) => { g.box(a, 0, z0 + 0.5, b, 0.003, z0 + 0.6, { faces: 'Y' }); g.box(a, 0, z1 - 0.6, b, 0.003, z1 - 0.5, { faces: 'Y' }); });
    g.mat('felt', C.teal); runX(x0 + 1, x1 - 0.5, 8, (a, b) => g.box(a, 0, 33.0, b, 0.008, 34.0, { faces: 'Y' }));
  });
  // the hatch wall (z = 31) with each office's hatch and door; the long wall opposite; the end wall with the court's door
  const holes = [];
  for (const o of OFFICES) { const cx = (o.x0 + o.x1) / 2 - 0.4; o.cx = cx; holes.push([cx - 0.7, 1.4, 0.95, 0.95]); holes.push([o.x1 - 1.45, 0.95, 0, 2.1]); }
  wallRun(s, 'x', z0, x0, x1, 0, h, { tint: '#e3d5b8', tintA: '#e3d5b8', t: 0.2, dado: { h: 0.95, mat: 'panel', tint: C.teal }, skirt: '#2a1c14' }, holes.map((q) => [q[0], q[1], q[2], q[3]]));
  wallRun(s, 'x', z1, x0, x1, 0, h, { tint: '#e3d5b8', t: 0.2, dado: { h: 0.95, mat: 'panel', tint: C.teal }, skirt: '#2a1c14' });
  wallRun(s, 'z', x0, z0 - 0.1, z1 + 0.1, 0, h, { tint: '#e3d5b8', tintA: '#e3d5b8', tintB: '#5b3a5e', t: 0.2, dado: { h: 0.95, mat: 'panel', tint: C.teal } }, [[32.6, 1.8, 0, 2.3]]);
  s.structure(() => { g.mat('wood', '#4a2e1e'); runX(x0, x1, 6, (a, b) => { g.box(a, h - 0.22, z0 + 0.12, b, h, z0 + 0.3, { faces: 'yZ' }); g.box(a, h - 0.22, z1 - 0.3, b, h, z1 - 0.12, { faces: 'yz' }); }); for (let x = x0 + 3; x < x1; x += 3) g.box(x - 0.08, h - 0.2, z0 + 0.1, x + 0.08, h, z1 - 0.1, { faces: 'xXy' }); });
  // a pipe and a cable tray along the ceiling, as everywhere in the drum
  s.deco(() => { g.mat('cast', '#b07a45', { rough: -0.15 }); runX(x0, x1, 8, (a, b) => g.tube([[a, h - 0.12, z1 - 0.45], [b, h - 0.12, z1 - 0.45]], 0.03, { segs: 8, caps: false })); g.mat('cast', '#5a5650'); runX(x0, x1, 8, (a, b) => g.box(a, h - 0.3, z1 - 0.95, b, h - 0.27, z1 - 0.65, { faces: 'yY' })); });
  for (const o of OFFICES) office(game, s, f, o);
  await tick(game);
  // the long wall: benches for waiting, a drinking tap, a notice board, plants
  for (const x of [-44, -36.5, -29, -22]) {
    prop(s, 'bench', x, 0, z1 - 0.45, PI, { w: 2.0, wood: pickBy(['#7a5233', '#5a3a24', '#8a6040'], Math.round(x)), back: true });
    for (const o of [-0.55, 0.55]) s.spot('sit', x + o, 0.46, z1 - 0.43, PI, { tags: ['wait', 'hatches'] });
  }
  // every year's thousand, drawn in pencil and framed, along the long wall
  s.deco(() => {
    for (let i = 0; i < 12; i++) {
      const x = -46.4 + i * 2.35; if (Math.abs(x + 32.8) < 1.2) continue;
      const w = 0.72 + (i % 3) * 0.08, hgt = 0.5 + (i % 2) * 0.08, y = 2.15;
      g.mat('wood', pickBy([C.walnut, '#6b4a2f', '#2c1a12', C.gilt], i)); g.box(x - w / 2 - 0.05, y - hgt / 2 - 0.05, z1 - 0.14, x + w / 2 + 0.05, y + hgt / 2 + 0.05, z1 - 0.1, { faces: 'zxXyY' });
      g.mat('paper', i % 4 === 0 ? '#e2cfa2' : '#efe6d0'); g.box(x - w / 2, y - hgt / 2, z1 - 0.145, x + w / 2, y + hgt / 2, z1 - 0.14, { faces: 'z' });
      g.mat('plain', '#5a4a3e'); for (let rr = 0; rr < 5; rr++) for (let c = 0; c < 9; c++) { const px = x - w / 2 + 0.06 + c * (w - 0.12) / 8, py = y - hgt / 2 + 0.08 + rr * (hgt - 0.16) / 4; g.box(px - 0.012, py - 0.012, z1 - 0.147, px + 0.012, py + 0.014, z1 - 0.146, { faces: 'z' }); }
    }
  });
  s.interact({ x: -40.0, y: 1.6, z: z1 - 0.9, radius: 1.2, prompt: 'Look at the framed drawings', onUse(gm) {
    say(gm, "Every year's thousand", ["Framed down the long wall, one drawing a year: the whole of that year's assembly in rows, a pencil dot and a name for each, done by whoever in it could draw. Some years nobody could, and it shows.", 'The frames go back along the corridor and round the corner and, the doorkeeper says, through two cupboards.']);
  } });
  const NOTES = { kind: 'board', title: 'Notices', lines: ['Lost|a grey felt cap, deck 207', 'Found|one glove, mended thumb', 'Hours wanted|lake mornings, for a naming', 'Swap|kite field Tuesday for any orchard', 'The Urn|cups back, please', 'Choir|basses wanted, Ring Five'], palette: ['#2a1e14', '#f3e6c8', '#e0a040'] };
  sign(s, NOTES, -32.8, 1.7, z1 - 0.12, { face: 'z', w: 1.6, h: 1.1, back: C.walnut });
  prop(s, 'plant', -25.4, 0, z1 - 0.45, 0.2, { kind: 'broad', size: 1.4, pot: C.saffron, seed: 21 });
  prop(s, 'plant', -40.2, 0, z1 - 0.45, 0.6, { kind: 'fern', size: 1.2, pot: C.madder, seed: 22 });
  s.structure(() => { g.mat('cast', '#c9a24a', { rough: -0.25 }); g.box(-47.2, 0.6, z1 - 0.3, -46.4, 0.95, z1 - 0.1, { bevel: 0.01 }); g.tube([[-46.8, 0.95, z1 - 0.15], [-46.8, 1.15, z1 - 0.15], [-46.8, 1.15, z1 - 0.25]], 0.012, { segs: 5 }); });
  // the queue at the Lawns hatch: a brass rail along the hatch wall and five places to stand
  const lw = OFFICES[3];
  railing(s, [[lw.cx + 1.0, z0 + 1.45], [lw.cx + 6.4, z0 + 1.45]], 0, { h: 0.95, tint: C.iron, rail: C.brass, railMat: 'cast', posts: 1.8 });
  s.spot('queue', lw.cx, 0, z0 + 0.75, PI, { tags: ['queue', 'hatch', 'lawns'] });
  for (let i = 0; i < 5; i++) s.spot('queue', lw.cx + 1.4 + i * 0.9, 0, z0 + 0.85, -PI / 2, { tags: ['queue', 'hatch', 'lawns'] });
  // light: globes down the corridor, warm, and the hatches lit from inside
  for (const x of [-43, -36, -29, -22]) lamp(s, 'globe', x, h - 0.15, 33.5, { K: 2800, power: 0.9, range: 6, drop: 0.7, r: 0.17, clip });
  s.ambient({ box: clip, sky: '#ffdcae', ground: '#8a6a4a', power: 0.12, lamp: true });
  // walkways and the zone
  s.path([[x1 + 2, 33.5], [x1, 33.5], [-22, 33.5], [-29, 33.5], [-36, 33.5], [-43, 33.5], [x0 + 1, 33.5], [x0 - 2, 33.5]], { width: 1.8 });
  for (const o of OFFICES) { s.path([[o.cx, 33.5], [o.cx, z0 + 0.8]], { width: 1.0 }); s.path([[o.x1 - 0.95, 33.5], [o.x1 - 0.95, z0 + 0.6], [o.x1 - 0.95, 29.8], [o.cx, 29.6]], { width: 0.9 }); }
  s.zoneBox({ id: 'lh-hatches', place: 'lot-hall', box: [x0, -0.5, z0, x1, h, z1], name: 'The Hatches', sub: SUB, ambience: 'shop', reverb: 'room', env: ENV_ROOM });
  s.loop('murmur', -34, 1.3, 33.5, { vol: 0.1, radius: 12, param: 0.15 });
  void oz0; void r;
}

// One office behind its hatch: the clerk's ledge, shelves of files, a lamp, and the thing it is known for.
function office(game, s, f, o) {
  const g = s.g, { z0: hz, oz0, h } = HAT, cx = o.cx;
  const clip = [o.x0 - 0.05, -0.2, oz0 - 0.05, o.x1 + 0.05, h + 0.1, hz + 0.6];
  floor(s, o.x0, oz0, o.x1, hz, 0, 'planks', '#8a6240');
  ceiling(s, o.x0, oz0, o.x1, hz, h, 'paint', '#efe6d6');
  const wo = { tint: o.wall, t: 0.16, dado: { h: 1.0, mat: 'flute', tint: C.walnut } };
  wall(s, o.x0, oz0, o.x1, oz0, 0, h, wo);
  wall(s, o.x0, oz0, o.x0, hz, 0, h, wo); wall(s, o.x1, oz0, o.x1, hz, 0, h, wo);
  // the hatch: a wooden surround, a ledge both sides, a shutter raised on its runners, the plate beside
  s.furniture(() => {
    g.mat('wood', C.walnut); g.box(cx - 0.8, 0.88, hz - 0.45, cx + 0.8, 0.95, hz + 0.32, { bevel: 0.01 });
    g.box(cx - 0.82, 0.95, hz - 0.12, cx - 0.7, 1.95, hz + 0.16, { bevel: 0.008 }); g.box(cx + 0.7, 0.95, hz - 0.12, cx + 0.82, 1.95, hz + 0.16, { bevel: 0.008 });
    g.box(cx - 0.82, 1.9, hz - 0.12, cx + 0.82, 2.06, hz + 0.18, { bevel: 0.008 });
    g.mat('paint', o.accent); g.box(cx - 0.7, 1.92, hz + 0.1, cx + 0.7, 2.3, hz + 0.14, { bevel: 0.006 });
    g.mat('cast', C.brass, { rough: -0.2 }); for (const sx of [-1, 1]) g.box(cx + sx * 0.69 - 0.01, 1.0, hz + 0.14, cx + sx * 0.69 + 0.01, 2.3, hz + 0.17);
  });
  s.solid(cx - 0.8, 0, hz - 0.45, cx + 0.8, 0.95, hz + 0.32);
  sign(s, { kind: 'plate', text: o.name, lines: [o.sub] }, cx + 1.25, 1.55, hz + 0.115, { face: 'Z', w: 0.42, h: 0.18, board: false });
  s.detail(() => brassPlate(g, cx + 1.25, 1.55, hz + 0.1, 0.46, 0.22, 'Z'));
  prop(s, 'civic.bell', cx + 0.5, 0.95, hz + 0.18, 0, {});
  // the clerk's side: a high stool, a desk lamp, files, a lidded cup
  prop(s, 'stool', cx, 0, hz - 0.95, 0, { h: 0.72, wood: '#5a3a24' });
  s.spot('work', cx, 0, hz - 0.85, 0, { tags: ['write', 'notes', 'clerk', 'hatch'] });
  prop(s, 'civic.desklamp', cx - 0.55, 0.95, hz - 0.3, 0.4, { shade: o.id === 'heat' ? '#7a2a3a' : '#2f6f4a' });
  lamp(s, 'bulb', cx - 0.5, 1.3, hz - 0.25, { K: 2700, power: 0.55, range: 3.5, clip });
  lamp(s, 'globe', (o.x0 + o.x1) / 2, h - 0.1, (oz0 + hz) / 2, { K: 3000, power: 0.6, range: 5, drop: 0.5, r: 0.14, clip });
  prop(s, 'cup', cx + 0.3, 0.95, hz - 0.32, 0, { glaze: pickBy(['#efe4cc', C.saffron, C.tealL], o.x0 | 0), lid: '#efe4cc' });
  s.detail(() => { g.mat('paper', C.paper); for (let i = 0; i < 4; i++) g.box(cx - 0.25 + i * 0.01, 0.95 + i * 0.01, hz - 0.35, cx + 0.05 + i * 0.01, 0.953 + i * 0.01, hz - 0.1); });
  // the back wall: shelves of files in coloured boards, a cabinet of drawers
  prop(s, 'shelving', (o.x0 + o.x1) / 2 - 1.2, 0, oz0 + 0.22, 0, { w: 2.2, h: 2.3, shelves: 5, wood: C.walnut });
  for (let k = 1; k < 5; k++) prop(s, 'civic.books', (o.x0 + o.x1) / 2 - 1.2, 0.08 + k * (2.3 - 0.11) / 5 + 0.025, oz0 + 0.24, 0, { w: 2.1, seed: (o.x0 | 0) * 7 + k, cols: [o.accent, C.walnut, '#2f4f6b', '#e8dcc0', '#6b4a2f', C.madder] });
  prop(s, 'civic.drawers', (o.x0 + o.x1) / 2 + 1.4, 0, oz0 + 0.3, 0, { w: 1.2, h: 1.3, d: 0.42, rows: 7, cols: 4, wood: '#6b4a2f' });
  if (o.id === 'heat') heatOffice(game, s, f, o);
  else if (o.id === 'hours') hoursOffice(game, s, f, o);
  else if (o.id === 'batches') batchOffice(game, s, f, o);
  else lawnOffice(game, s, f, o);
  s.zoneBox({ id: 'lh-office-' + o.id, place: 'lot-hall', box: [o.x0, -0.5, oz0, o.x1, h, hz], name: o.name.charAt(0) + o.name.slice(1).toLowerCase(), sub: 'the Hatches · ' + SUB, ambience: 'shop', reverb: 'room', env: ENV_ROOM });
}

function heatOffice(game, s, f, o) {
  const g = s.g, hz = HAT.z0, cx = o.cx;
  // the tomato, under its glass dome on the ledge, its file tied with string beside it
  const tx = cx + 0.12, ty = 0.95, tz = hz + 0.02;
  s.detail(() => {
    g.mat('wood', '#3a2418'); g.cyl(tx, ty, tz, 0.13, 0.03, { segs: 20 });
    g.mat('cast', C.brass, { rough: -0.25 }); g.cyl(tx, ty + 0.03, tz, 0.125, 0.008, { segs: 20 });
    g.mat('glaze', '#d0412a', { rough: -0.35 }); g.ball(tx, ty + 0.085, tz, 0.05, 0.043, 0.05, { segs: 14, rings: 8 });
    g.mat('plain', '#4f7a2e'); for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; g.box(tx + Math.sin(a) * 0.012 - 0.006, ty + 0.124, tz + Math.cos(a) * 0.012 - 0.006, tx + Math.sin(a) * 0.03 + 0.006, ty + 0.13, tz + Math.cos(a) * 0.03 + 0.006); }
    g.mat('paper', '#e6d6b0'); g.box(cx - 0.62, ty, tz - 0.16, cx - 0.2, ty + 0.11, tz + 0.14, { bevel: 0.01 });
    g.mat('weave', '#c9a06a'); g.box(cx - 0.62, ty + 0.11, tz - 0.012, cx - 0.2, ty + 0.115, tz + 0.012); g.box(cx - 0.42, ty + 0.11, tz - 0.16, cx - 0.4, ty + 0.115, tz + 0.14);
    g.mat('paper', C.paper); g.box(cx - 0.55, ty + 0.115, tz - 0.06, cx - 0.32, ty + 0.117, tz + 0.06);
  });
  glassLathe(s, tx, ty + 0.035, tz, [[0.11, 0], [0.11, 0.12], [0.095, 0.2], [0.06, 0.25], [0.0, 0.265]], { opacity: 0.12 });
  // the heat map on the wall behind: a section of the drum with pins where warmth showed up where none should be
  const MAP = { kind: 'board', title: 'Warm where it should not be', lines: ['Deck 231 · landing|a grow lamp, 40 W', 'Deck 188 · store room|a heater, forgotten', 'Deck 209 · a garden|three hours too long', 'Deck 244 · a bath|kept hot all night', 'Found this year|212', 'Asked to pay|9'], palette: ['#3a1e24', '#f3e6c8', '#e0a040'] };
  sign(s, MAP, o.x0 + 0.1, 1.75, (HAT.oz0 + hz) / 2, { face: 'X', w: 1.6, h: 1.15, back: C.walnut });
  s.interact({ x: cx, y: 1.2, z: hz + 0.75, radius: 1.2, kind: 'talk', prompt: 'Ask at the Heat hatch', async onUse(gm) {
    sfx(gm, 'bell', f, cx + 0.5, 1.0, hz + 0.18);
    await say(gm, { name: 'The Heat clerk', colour: '#d95d7a' }, [
      'Heat. Every watt anybody uses ends up as warmth on the drum\'s radiators, and they read it, block by block, every hour. A lamp nobody is paying for shows up as warmth where none should be. We go and knock.',
      'Mostly it is a grow lamp somebody\'s grandfather forgot. We say so, they say oh, and we go home. Nine this year were asked to pay. Nobody was fined. We do not fine.',
    ]);
    const pick = await choose(gm, { name: 'The Heat clerk', colour: '#d95d7a' }, 'The clerk sees you looking at the dome.', [{ label: 'Is that a tomato?', value: 't' }, { label: 'Thank you.', value: 'n' }]);
    if (pick === 't') await say(gm, { name: 'The Heat clerk', colour: '#d95d7a' }, [
      'That is the tomato. Grown on a landing on deck 231 under forty watts nobody paid for, by a man who said the light was his because the lamp was. Half a kay of tomato and a file of three hundred pages.',
      'The Two Chairs gave it back to him. He will not take it: he says it is the drum\'s now. So we keep it, as evidence of nothing.',
      'It is not the same tomato. The file says each one is kept until it softens, and then eaten at the hatch by whoever is on, and he sends another. This is the fourth. They are very good tomatoes.',
    ]);
  } });
}

function hoursOffice(game, s, f, o) {
  const g = s.g, hz = HAT.z0, cx = o.cx;
  // pigeonholes of hour slips on the side wall, a slip board, the date stamp
  s.furniture(() => {
    const x = o.x0 + 0.2, zc = (HAT.oz0 + hz) / 2;
    g.mat('wood', '#6b4a2f'); g.box(x - 0.1, 0.9, zc - 1.0, x + 0.25, 2.3, zc + 1.0, { bevel: 0.01 });
    g.mat('wood', '#2a1c14'); for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) g.box(x + 0.25, 0.98 + j * 0.22, zc - 0.95 + i * 0.24, x + 0.252, 1.17 + j * 0.22, zc - 0.74 + i * 0.24, { faces: 'X' });
    g.mat('paper', C.paper); for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) if ((i * 3 + j * 5) % 4) g.box(x + 0.15, 0.99 + j * 0.22, zc - 0.92 + i * 0.24, x + 0.26, 1.04 + j * 0.22, zc - 0.77 + i * 0.24, { faces: 'XY' });
  });
  s.solid(o.x0 + 0.1, 0, (HAT.oz0 + hz) / 2 - 1.0, o.x0 + 0.45, 2.3, (HAT.oz0 + hz) / 2 + 1.0);
  s.interact({ x: cx, y: 1.2, z: hz + 0.75, radius: 1.2, kind: 'talk', prompt: 'Ask at the Hours hatch', async onUse(gm) {
    sfx(gm, 'bell', f, cx + 0.5, 1.0, hz + 0.18);
    await say(gm, { name: 'The Hours clerk', colour: '#e8b84a' }, [
      'Hours. The Hollow\'s hours come by lottery, and once they are yours they are yours to give. People bring them here and sign them over: to a grandchild, a neighbour, whoever stayed late for them.',
      'An hour in the Hollow is the old gift. The drum has about three-quarters of an hour a week of it each, so it is not nothing.',
      pickBy([
        'The gentleman before you gave his lake morning to his granddaughter\'s naming table. He has given it to them for eleven years. They have never once asked.',
        'This morning a woman gave four orchard hours to the cook of her hall, for the ramen. The cook did not know yet. I like the ones where they do not know yet.',
        'You hold none, being a guest, so you cannot give any. But if you are still here at Knotnight, ask your hall. Halls give their guests an hour sometimes. I have seen it.',
      ], day(gm)),
    ]);
  } });
}

function batchOffice(game, s, f, o) {
  const g = s.g, hz = HAT.z0, cx = o.cx;
  // the stamp and its pad on the ledge, wire trays IN and OUT, a slip box
  s.detail(() => {
    g.mat('wood', '#3a2418'); g.box(cx - 0.55, 0.95, hz - 0.05, cx - 0.35, 0.97, hz + 0.1, { bevel: 0.004 });
    g.mat('felt', '#26306b'); g.box(cx - 0.53, 0.97, hz - 0.03, cx - 0.37, 0.975, hz + 0.08);
    g.mat('wood', '#c9a06a'); g.cyl(cx - 0.2, 0.95, hz + 0.02, 0.035, 0.07, { segs: 10 }); g.mat('wood', '#3a2418'); g.lathe(cx - 0.2, hz + 0.02, [[0.02, 1.02], [0.03, 1.08], [0.035, 1.12], [0, 1.13]], { segs: 10 });
  });
  for (const [x, lbl] of [[o.x0 + 0.9, 'IN'], [o.x0 + 1.9, 'OUT']]) {
    s.detail(() => {
      g.mat('cast', '#3a3632'); g.box(x - 0.35, 0.95, hz - 0.85, x + 0.35, 1.08, hz - 0.45, { faces: 'xXzZ' });
      g.mat('paper', C.paper); for (let i = 0; i < (lbl === 'IN' ? 9 : 4); i++) g.box(x - 0.3, 0.96 + i * 0.01, hz - 0.8, x + 0.28, 0.963 + i * 0.01, hz - 0.5);
    });
    prop(s, 'table', x, 0, hz - 0.65, 0, { w: 0.9, d: 0.5, h: 0.95, wood: '#5a3a24' });
  }
  sign(s, { kind: 'notice', title: 'Batches', lines: ['In by 23:00.', 'Worked in the lamp-night,', 'when a kay is cheapest,', 'up the line on the raft.', 'Answers by 07:00.', 'Nothing is worked here.'], palette: [C.cream, C.ink, C.tealL] }, cx - 1.25, 1.55, hz + 0.115, { face: 'Z', w: 0.36, h: 0.48 });
  s.interact({ x: cx, y: 1.2, z: hz + 0.75, radius: 1.2, kind: 'talk', prompt: 'Ask at the Batches hatch', async onUse(gm) {
    sfx(gm, 'bell', f, cx + 0.5, 1.0, hz + 0.18);
    await say(gm, { name: 'The Batches clerk', colour: '#3fa7a3' }, [
      'Batches. In by eleven tonight, answers by seven. Nothing is worked in the building: it goes up the line to the data halls on the raft, which do everybody\'s long sums in the lamp-night, when a kay is cheapest.',
      'The assembly\'s questions go in the same queue as everyone else\'s. What an extra hour of sun costs the lamps, what a bigger hall fund feeds. They mind waiting. I find that good for them.',
    ]);
    sfx(gm, 'clunk', f, cx - 0.2, 1.0, hz);
    toast(gm, 'The clerk stamps your wrist, IN 23:00, without being asked, and goes back to the slips.');
  } });
}

function lawnOffice(game, s, f, o) {
  const g = s.g, hz = HAT.z0, cx = o.cx, zc = (HAT.oz0 + hz) / 2;
  // the lawns on a pegboard: a long green plan of the Hollow's floor, pegs of colour by block
  s.furniture(() => {
    const x = o.x0 + 0.12;
    g.mat('wood', C.walnut); g.box(x, 0.85, zc - 1.6, x + 0.06, 2.45, zc + 1.6, { bevel: 0.01 });
    g.mat('felt', '#5f7a3a'); g.box(x + 0.06, 0.95, zc - 1.5, x + 0.065, 2.35, zc + 1.5, { faces: 'X' });
    g.mat('felt', '#3f5a8a'); g.box(x + 0.065, 1.45, zc - 0.6, x + 0.07, 1.75, zc + 0.3, { faces: 'X' });
    const cols = ['#e8b84a', '#c9552e', '#e9e2d0', '#3fa7a3', '#d95d7a'];
    for (let i = 0; i < 70; i++) { const yy = 1.0 + ((i * 37) % 130) / 100, zz = zc - 1.45 + ((i * 53) % 290) / 100; g.mat('plain', cols[i % 5]); g.box(x + 0.07, yy, zz, x + 0.1, yy + 0.025, zz + 0.025); }
  });
  s.interact({ x: cx, y: 1.2, z: hz + 0.75, radius: 1.2, kind: 'talk', prompt: 'Ask at the Lawns hatch', async onUse(gm) {
    sfx(gm, 'bell', f, cx + 0.5, 1.0, hz + 0.18);
    await say(gm, { name: 'The Lawns clerk', colour: '#8fd694' }, [
      'Lawns. The lottery gives each block its hours in the Hollow. We give it the grass: which lawn, which hour, which end, so two blocks of three thousand do not arrive at the same picnic.',
      'The Hollow holds about a million and a half at once and is open sixteen hours a day. Shared out over the whole drum, that is three-quarters of an hour a week each. Hence the queue.',
      day(gm) >= 3 ? 'Today the whole green is the feast\'s, and tonight the axis is the Flight\'s, and I am going home early to fly.' : 'Booking Day the green is booked for the feast already. Everyone in this queue wants the hour after.',
    ]);
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// the Two Chairs: three neighbours drawn by lot at a table, two particular chairs before them, the thing in question
// ---------------------------------------------------------------------------------------------------------------
const QUARRELS = [
  { title: 'Okafor and Lind, deck 214', lines: ['A chair left on a landing for the remakers,', 'taken in and remade by a neighbour,', 'and now wanted back.', 'The chair is in the room.'],
    say: ['Okafor put a broken chair out on the landing for the remakers. Lind took it in, remade it over a winter, new seat, new rail, and put it in her hall. Okafor saw it there at the Thursday ramen and wants it back.', 'The chair is in the room, on the rug between the two chairs, with a paper tag on it that says THE CHAIR. Each side has spoken once. The three neighbours have asked to see underneath it.'] },
  { title: 'Moreau and Achterberg, deck 219', lines: ['Whether a flute played', 'through a shared wall on the Quiet', 'counts as a message.', 'The flute is in the room.'],
    say: ['On the Quiet there are no worlds and no messages. Achterberg played his flute through the wall at nine, the tune Moreau\'s mother used to hum. Moreau says that is a message. Achterberg says it is a flute.', 'The flute is in the room: one point two metres of it, because in this air a flute is long. Nobody has been allowed to play it yet.'] },
  { title: 'Ruiz and Ruiz, deck 202', lines: ['One orchard apple at the feast,', 'cut crosswise for every two,', 'and three sisters.', 'The apple is in the room.'],
    say: ['The feast gives one orchard apple for every two people, cut crosswise, so everyone sees the star. The Ruiz sisters are three. The third came late from the Ledger.', 'The apple is in the room, uncut, on a plate under a lid. The neighbours have sent for a knife and a ruler.'] },
];
export async function buildCourt(game, s, f, r) {
  const g = s.g, { x0, x1, z0, z1, h } = CRT, zc = (z0 + z1) / 2;
  const clip = [x0 - 0.1, -0.2, z0 - 0.1, x1 + 0.1, h + 0.1, z1 + 0.1];
  floor(s, x0, z0, x1, z1, 0, 'planks', '#7a5233');
  ceiling(s, x0, z0, x1, z1, h, 'paint', '#3a2622');
  const wo = { tint: '#5b3a5e', t: 0.2, dado: { h: 1.15, mat: 'flute', tint: C.walnut }, skirt: '#2a1c14' };
  wall(s, x0, z0, x1, z0, 0, h, wo); wall(s, x0, z1, x1, z1, 0, h, wo); wall(s, x0, z0, x0, z1, 0, h, wo);
  // the end toward the Hatches: the corridor's end wall is the middle of it (with the door); these are the two ends
  wall(s, x1, z0, x1, HAT.z0 - 0.1, 0, h, wo); wall(s, x1, HAT.z1 + 0.1, x1, z1, 0, h, wo);
  // the far wall hung in felt, the room's own colour; a band of gilt
  s.deco(() => {
    for (let i = 0; i < 5; i++) { const za = z0 + 0.6 + i * 2.8; g.mat('felt', FELTS[(i * 3 + 2) % FELTS.length], { sway: 0.04 }); g.sheet([x0 + 0.13, 3.0, za], [x0 + 0.13, 3.0, za + 2.6], [x0 + 0.13, 1.25, za + 2.6], [x0 + 0.13, 1.25, za], { ripple: 0.02, nu: 3, nv: 2 }); }
    g.mat('cast', C.gilt, { rough: -0.2 }); g.box(x0 + 0.11, 3.03, z0 + 0.5, x0 + 0.13, 3.06, z1 - 0.5, { faces: 'X' });
  });
  s.structure(() => { g.mat('wood', '#4a2e1e'); for (let x = x0 + 2.5; x < x1; x += 2.8) g.box(x - 0.1, h - 0.24, z0 + 0.1, x + 0.1, h, z1 - 0.1, { faces: 'xXy' }); });
  // the dais and the neighbours' table: three chairs, three lidded cups, three cards with the quarrel's names
  const dx0 = x0 + 0.2, dx1 = x0 + 3.0;
  s.structure(() => { g.mat('wood', '#5a3a24'); g.box(dx0, 0, zc - 3.4, dx1, 0.3, zc + 3.4, { bevel: 0.01, faces: 'xXzZY' }); g.mat('cast', C.brass, { rough: -0.2 }); g.box(dx1 - 0.02, 0.27, zc - 3.4, dx1 + 0.01, 0.3, zc + 3.4, { faces: 'XY' }); });
  s.solid(dx0, 0, zc - 3.4, dx1, 0.3, zc + 3.4, { surf: 'wood' });
  prop(s, 'table', x0 + 1.9, 0.3, zc, PI / 2, { w: 3.4, d: 0.9, wood: C.walnut });
  s.detail(() => { g.mat('felt', C.teal); g.box(x0 + 1.5, 1.04, zc - 1.65, x0 + 2.3, 1.045, zc + 1.65, { faces: 'Y' }); });
  for (let i = 0; i < 3; i++) {
    const z = zc - 1.1 + i * 1.1;
    prop(s, 'chair', x0 + 1.2, 0.3, z, PI / 2, { wood: pickBy(['#3a2a20', '#6b4a2f', '#5a3a24'], i), back: pickBy(['hoop', 'slat', 'hoop'], i), seat: pickBy([C.madder, C.saffron, C.tealL], i) });
    s.spot('sit', x0 + 1.2, 0.3 + 0.46, z, PI / 2, { tags: ['court', 'neighbour'] });
    prop(s, 'cup', x0 + 1.75, 1.04, z + 0.25, 0, { glaze: '#efe4cc', lid: C.walnut });
    s.detail(() => { g.mat('paper', C.paper); g.box(x0 + 2.05, 1.045, z - 0.2, x0 + 2.25, 1.05, z + 0.2); });
  }
  lamp(s, 'globe', x0 + 1.9, h - 0.1, zc - 1.1, { K: 2700, power: 0.7, drop: 0.9, r: 0.16, range: 5, clip });
  lamp(s, 'globe', x0 + 1.9, h - 0.1, zc + 1.1, { K: 2700, power: 0.7, drop: 0.9, r: 0.16, range: 5, clip });
  // the Two Chairs, side by side, facing the three; a low table between with a jug and two lidded cups
  const qx = x0 + 6.3;
  prop(s, 'lothall.quarrelchair', qx, 0, zc - 0.95, -PI / 2, { c: C.madder, mend: C.saffron });
  prop(s, 'lothall.quarrelchair', qx, 0, zc + 0.95, -PI / 2, { c: '#2f6f73', mend: '#d95d7a' });
  prop(s, 'table', qx - 0.1, 0, zc, 0, { w: 0.5, d: 0.5, h: 0.55, round: true, wood: '#3a2418' });
  prop(s, 'cup', qx - 0.05, 0.55, zc - 0.12, 0, { glaze: C.madder, lid: '#efe4cc' }); prop(s, 'cup', qx - 0.05, 0.55, zc + 0.12, 0, { glaze: C.tealL, lid: '#efe4cc' });
  for (const sz of [-1, 1]) seat(s, qx, 0, zc + sz * 0.95, -PI / 2, 'Sit in one of the Two Chairs', { onSit: twoChairs });
  // the thing in question, on a rug between the chairs and the dais: a remade chair, a flute or an apple, by the day
  const ix = x0 + 4.4, qi = Math.max(0, Math.min(2, day(game) - 1)), Q = QUARRELS[qi];
  prop(s, 'rug', ix, 0, zc, PI / 2, { w: 1.4, d: 1.0, a: C.indigo, b: C.saffron });
  if (qi === 0) {
    prop(s, 'lothall.chair', ix, 0, zc, PI / 2 + 0.3, { k: 4, a: 3, c: C.saffron });
    s.detail(() => { g.mat('paper', '#efe6d0'); g.box(ix + 0.1, 0.62, zc + 0.24, ix + 0.22, 0.7, zc + 0.245); g.mat('weave', '#c9a06a'); g.tube([[ix + 0.16, 0.7, zc + 0.245], [ix + 0.12, 0.8, zc + 0.23]], 0.003, { segs: 3 }); });
  } else {
    prop(s, 'table', ix, 0, zc, 0, { w: 0.5, d: 0.5, h: 0.6, round: true, wood: '#5a3a24' });
    if (qi === 1) s.detail(() => { g.mat('weave', C.madder); g.box(ix - 0.3, 0.6, zc - 0.2, ix + 0.3, 0.605, zc + 0.2); g.mat('wood', '#8a5a34', { rough: -0.1 }); g.tube([[ix - 0.15, 0.625, zc - 0.6], [ix + 0.05, 0.625, zc + 0.6]], 0.018, { segs: 8 }); g.mat('cast', C.brass); for (let i = 0; i < 8; i++) { const t = 0.4 + i * 0.06; g.cyl(ix - 0.15 + 0.2 * t, 0.64, zc - 0.6 + 1.2 * t, 0.009, 0.006, { segs: 6 }); } });
    else { prop(s, 'plate', ix, 0.6, zc, 0, { r: 0.13, glaze: '#efe4cc' }); s.detail(() => { g.mat('glaze', '#c8402a', { rough: -0.3 }); g.ball(ix, 0.66, zc, 0.045, 0.042, 0.045, { segs: 12, rings: 7 }); }); prop(s, 'bowl', ix, 0.6, zc, 0, { r: 0.11, glaze: C.madder }); }
    s.detail(() => { g.mat('paper', '#efe6d0'); g.box(ix + 0.14, 0.601, zc + 0.12, ix + 0.24, 0.604, zc + 0.2); });
  }
  s.interact({ x: ix + 0.6, y: 0.8, z: zc, radius: 1.0, prompt: 'Look at the thing in question', onUse(gm) {
    say(gm, 'The thing in question', [Q.say[1], 'The two chairs it sits between are older than anybody in the room. Quarrellers sit in them, nobody else, and they are never moved, so that the neighbours always see a quarrel from the same place.']);
  } });
  // the clerk's desk at the side, the public's benches at the door end
  prop(s, 'lothall.clerkdesk', x0 + 7.0, 0, z1 - 1.1, PI, { w: 1.3 });
  prop(s, 'chair', x0 + 7.0, 0, z1 - 0.5, PI, { wood: '#3a2a20', seat: C.teal });
  s.spot('work', x0 + 7.0, 0, z1 - 0.55, PI, { tags: ['write', 'notes', 'clerk', 'court'] });
  for (let row = 0; row < 3; row++) for (const sz of [-1, 1]) {
    const bx = x1 - 3.4 + row * 1.15, bz = zc + sz * 2.6;
    prop(s, 'bench', bx, 0, bz, -PI / 2, { w: 2.6, wood: pickBy(['#7a5233', '#5a3a24', '#8a6040'], row + sz), back: true });
    for (const o of [-0.7, 0, 0.7]) s.spot('sit', bx + 0.02, 0.46, bz + o, -PI / 2, { tags: ['court', 'public'] });
  }
  // how it works, on the wall
  const HOW = { kind: 'board', title: 'The Two Chairs', lines: ['Three neighbours|drawn by lot, from both decks', 'Each side speaks|once, sitting', 'Each answers|once', 'The three decide|two of three, out loud', 'Nobody pays|nobody is fined', 'Not settled|to the Bowl, by note'], palette: ['#2a1e14', '#f3e6c8', '#e0a040'] };
  sign(s, HOW, x0 + 7.4, 1.8, z0 + 0.12, { face: 'Z', w: 1.6, h: 1.1, back: C.walnut });
  s.interact({ x: x0 + 7.4, y: 1.5, z: z0 + 1.0, radius: 1.3, prompt: 'Read how the Two Chairs works', onUse(gm) {
    say(gm, 'The Two Chairs', [
      'For a quarrel too big for a block court and too small for the Bowl. Three neighbours are drawn by lot from the decks of both sides, and sit for the one quarrel, and go home.',
      'Each side speaks once, sitting. Each answers the other once. Then the three decide, two of three, out loud, before anybody stands up. Nobody pays to bring a quarrel, and nobody is fined at the end of one.',
      'What the three cannot settle goes to the Bowl as a note. In living memory that has happened twice, both times about a wall.',
    ]);
  } });
  // the door from the Hatches, and today's quarrel on the corridor side of it
  sign(s, { kind: 'notice', title: 'The Two Chairs today', lines: [Q.title].concat(Q.lines), palette: [C.cream, C.ink, C.madder] }, x1 + 0.13, 1.55, 31.75, { face: 'X', w: 0.42, h: 0.58 });
  sign(s, { kind: 'plate', text: 'THE TWO CHAIRS', lines: ['sitting · come in quietly'] }, x1 + 0.13, 2.55, 33.5, { face: 'X', w: 0.62, h: 0.22 });
  s.interact({ x: x1 + 0.9, y: 1.4, z: 31.8, radius: 1.2, prompt: "Read today's quarrel", onUse(gm) {
    say(gm, 'The Two Chairs today', [Q.title + '. ' + Q.say[0]]);
  } });
  lamp(s, 'globe', qx - 0.6, h - 0.1, zc, { K: 2800, power: 0.8, drop: 0.7, r: 0.18, range: 5.5, clip });
  lamp(s, 'globe', x1 - 2.2, h - 0.1, zc, { K: 2800, power: 0.6, drop: 0.5, r: 0.15, range: 5, clip });
  lamp(s, 'sconce', x0 + 7.4, 2.8, z0 + 0.14, { face: 'Z', K: 2700, power: 0.5, range: 4, clip });
  s.ambient({ box: clip, sky: '#ffcf96', ground: '#7a5a3a', power: 0.1, lamp: true });
  s.path([[x1 + 3, 33.5], [x1 - 0.5, 33.5], [x1 - 2.2, zc], [qx + 1.0, zc], [ix + 1.0, zc - 1.6], [x0 + 3.4, zc - 1.6], [x0 + 3.4, zc + 1.6]], { width: 1.2 });
  s.path([[x1 - 2.2, zc], [x0 + 7.0, z1 - 1.0]], { width: 0.9 });
  s.zoneBox({ id: 'lh-court', place: 'lot-hall', box: [x0, -0.5, z0, x1, h, z1], name: 'The Two Chairs', sub: SUB, ambience: 'quiet', reverb: 'felt', env: ENV_ROOM });
  void r; void hour; void tick;
}

async function twoChairs(gm) {
  if (gm.flags.lhTwoChairs) { toast(gm, 'The chair is deep and old and nobody else\'s. Across the room the three look at you, then back at their cards.'); return; }
  gm.flags.lhTwoChairs = true;
  await say(gm, 'The Two Chairs', [
    'You sit. It is deeper than it looks and smells of old felt and polish. The arm under your hand has been gripped smooth.',
    'From here the three neighbours\' table is a little above you, close enough to pass a cup across. It is set so that nobody has to raise their voice.',
  ]);
}
