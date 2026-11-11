// Lots: the things that stand in a generated block's plan. A lot module builds everything inside its footprint.
//
//   registerLot('shop.baker', async (s, lot, plan, game, tick) => { ... });
//
// tick: `await tick()` between the parts of anything big (after the shell, after each row of furniture). It returns at
// once while there is time left in the frame and waits for the next frame when there is not, so a block can be built
// while the player walks. A lot that takes more than about 10 ms without a tick makes the game stutter.
//
// Keys, most particular first: 'special.<kind>', 'shop.<trade>', 'room.<use>', then 'shop', 'room', 'special',
// 'hall', 'lobby', 'court'. The plain builders at the bottom of this file are the fallbacks: a block is complete
// with them alone, and a better module simply takes over its key.
//
// A lot (see plan.js): { id, kind, x0, z0, x1, z1 (frame coordinates), front: 'n' | 's' | 'e' | 'w' (the side of the footprint
// its street is on: n = low z, s = high z, w = low x, e = high x), seed, name, sub, trade | use | special, onCourt }.
// Rules for a lot module:
//   - build only inside [x0, x1] x [z0, z1], from y = 0 up to at most 3.4 (a special may ask the plan for more decks);
//   - draw your own floor, ceiling, party walls and your front on the front line; leave a door and say where it is by
//     ending a walkway there: s.path([[doorX, doorZ just inside], ...]) (the street joins loose ends to itself);
//   - everything through the scope `s` (meshes, lights, colliders, spots, interactions, zones, s.loop, s.every, s.onDispose),
//     so the whole block can be taken down when the player has walked away. No game.spawns, no game.events.on without
//     s.onDispose, no globals;
//   - be the same every time for the same lot.seed (use new Rng(lot.seed));
//   - budget: a shop or room under 25,000 triangles and 6 lights; a hall or special under 90,000 and 16; build in under 60 ms.
import { room, shopfront, railing, planter } from '../world/kit2.js';
import { lamp, floor, ceiling, wall, roomGlow, warm } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { street, side, frontWall, pilaster, FIN } from '../places/street_parts.js';
import { LOT_H } from './plan.js';

const LOTS = new Map();
export function registerLot(key, fn) { LOTS.set(key, fn); }
export function lotBuilder(lot) {
  const keys = lot.kind === 'special' ? ['special.' + lot.special, 'special'] : lot.kind === 'shop' ? ['shop.' + lot.trade, 'shop'] : lot.kind === 'room' ? ['room.' + lot.use, 'room'] : [lot.kind];
  for (const k of keys) if (LOTS.has(k)) return LOTS.get(k);
  return null;
}
export function lotKeys() { return [...LOTS.keys()]; }

// ---------------------------------------------------------------------------------------------------------------
// helpers a lot module may use
// ---------------------------------------------------------------------------------------------------------------
// Local coordinates of a lot: p runs along its front (0 at the low end), q runs inward from the front line.
// o.P(p, q) -> [x, z]; o.W = frontage, o.D = depth; o.yawOut / o.yawIn: a prop's yaw to face the street / the back wall;
// o.alongX: the front runs along x; o.c: the front line; o.a0, o.a1: the front's range along its axis.
export function orient(lot) {
  const f = lot.front, alongX = f === 'n' || f === 's';
  const W = alongX ? lot.x1 - lot.x0 : lot.z1 - lot.z0, D = alongX ? lot.z1 - lot.z0 : lot.x1 - lot.x0;
  const P = f === 'n' ? (p, q) => [lot.x0 + p, lot.z0 + q] : f === 's' ? (p, q) => [lot.x0 + p, lot.z1 - q] : f === 'w' ? (p, q) => [lot.x0 + q, lot.z0 + p] : (p, q) => [lot.x1 - q, lot.z0 + p];
  const yawOut = f === 'n' ? Math.PI : f === 's' ? 0 : f === 'w' ? -Math.PI / 2 : Math.PI / 2;
  return { P, W, D, alongX, yawOut, yawIn: yawOut + Math.PI, c: f === 'n' ? lot.z0 : f === 's' ? lot.z1 : f === 'w' ? lot.x0 : lot.x1, a0: alongX ? lot.x0 : lot.z0, a1: alongX ? lot.x1 : lot.z1,
    box: (p0, q0, p1, q1) => { const a = P(p0, q0), b = P(p1, q1); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; } };
}
// The lot's front as a `side` for the street parts (src/places/street_parts.js: frontWall, unit, pilaster, noticeboard ...):
// positions on it are (a, d): a along the front in frame coordinates (o.a0 to o.a1), d the depth behind the front line.
export function frontSide(lot) {
  const f = lot.front, X = f === 'n' || f === 's';
  const st = street(X ? 'x' : 'z', 1, LOT_H, f === 'n' ? lot.z0 : f === 's' ? lot.z1 : f === 'w' ? lot.x0 : lot.x1);
  return side(st, 0, f === 'n' || f === 'w' ? -1 : 1);
}
export const PALETTES = [
  { wall: '#e7d9bf', dado: '#2f6f73', floor: ['tile', '#cdb99a'], frame: '#2d3b36', plinth: '#3a4a45', awning: ['#c9552e', '#f1e6cf'], sign: ['#2d3b36', '#f3e6c8', '#d8a657'] },
  { wall: '#efe2c6', dado: '#8a2f3c', floor: ['planks', '#a8794f'], frame: '#5a2e22', plinth: '#6e3a2a', awning: ['#8a2f3c', '#efe2c6'], sign: ['#5a2e22', '#f6e7c4', '#e3b456'] },
  { wall: '#dfe6dc', dado: '#33407a', floor: ['terrazzo', '#c9c0ae'], frame: '#26306b', plinth: '#33407a', awning: ['#33407a', '#e9e2d0'], sign: ['#26306b', '#f1ead6', '#e0b04a'] },
  { wall: '#f0e0c8', dado: '#6b7a3a', floor: ['planks', '#b98a5a'], frame: '#3f4f2a', plinth: '#55662f', awning: ['#6b7a3a', '#f3e6c8'], sign: ['#3f4f2a', '#f3e9cf', '#d6a640'] },
  { wall: '#ead7c8', dado: '#5b3a6e', floor: ['tile', '#bfa890'], frame: '#3d2a4d', plinth: '#5b3a6e', awning: ['#5b3a6e', '#e8c26a'], sign: ['#3d2a4d', '#f2e3cf', '#e8c26a'] },
  { wall: '#e5d3b0', dado: '#a8412b', floor: ['terrazzo', '#d8c8a8'], frame: '#3a2a20', plinth: '#a8412b', awning: ['#d6a640', '#3a2a20'], sign: ['#3a2a20', '#f3e6c8', '#c9552e'] },
];
// Say a few lines (safe without a UI).
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export function note(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: 6 }); }

// ---------------------------------------------------------------------------------------------------------------
// the plain builders
// ---------------------------------------------------------------------------------------------------------------
// What a plain shop has out: things on the counter, crates by the wall, a rug, a plant by the door.
function stock(s, o, r, kind, pal, cw) {
  const n = 3 + r.i(0, 2), GL = ['#e9e2d0', '#a3563a', '#3d6f8a', '#6b7a3a', '#d9c7a6'], LID = ['#c9552e', '#2f6f73', '#d6a640', '#33407a'];
  for (let k = 0; k < n; k++) {
    const q = o.P(o.W / 2 - cw / 2 + 0.35 + k * (cw - 0.7) / Math.max(1, n - 1), o.D - 2.2 + r.f(-0.08, 0.08));
    if (kind === 'food') prop(s, k % 2 ? 'bowl' : 'crock', q[0], 0.9, q[1], r.f(0, 3), k % 2 ? { glaze: GL[r.i(0, 4)], lid: LID[r.i(0, 3)], r: 0.09 } : { glaze: GL[r.i(0, 4)], h: r.f(0.16, 0.24), r: r.f(0.07, 0.1) }, { noCollide: true });
    else if (kind === 'craft') prop(s, 'crate', q[0], 0.9, q[1], r.f(-0.3, 0.3), { w: 0.34, h: 0.14, d: 0.24, wood: ['#a8794f', '#8a6240', '#b98a5a'][k % 3] }, { noCollide: true });
    else prop(s, k % 2 ? 'cup' : 'plate', q[0], 0.9, q[1], r.f(0, 3), k % 2 ? { glaze: GL[r.i(0, 4)], lid: LID[r.i(0, 3)] } : { glaze: GL[r.i(0, 4)] }, { noCollide: true });
  }
  for (let k = 0; k < 3; k++) { const q = o.P(0.6, o.D * 0.3 + k * 0.62); prop(s, 'crate', q[0], 0, q[1], r.f(-0.15, 0.15), { w: 0.5, h: 0.32, d: 0.4, wood: '#a8794f' }); if (k === 1) prop(s, 'crate', q[0], 0.32, q[1], r.f(-0.3, 0.3), { w: 0.44, h: 0.26, d: 0.36, wood: '#8a6240' }, { noCollide: true }); }
  const rq = o.P(o.W / 2, o.D * 0.42); prop(s, 'rug', rq[0], 0, rq[1], o.alongX ? 0 : Math.PI / 2, { w: Math.min(2.6, o.W - 2.4), d: 1.5, a: pal.dado, b: '#e9dcc0' }, { noCollide: true });
  const pq = o.P(o.W - 0.6, 0.7); prop(s, 'plant', pq[0], 0, pq[1], 0, { kind: ['broad', 'fern', 'fine'][r.i(0, 2)], size: r.f(1.0, 1.4), pot: GL[1 + r.i(0, 2)] });
  if (kind === 'service') { const q = o.P(o.W * 0.25, o.D * 0.6); prop(s, 'bench', q[0], 0, q[1], o.yawIn + Math.PI / 2, { w: 1.6, back: true, wood: '#7a5233' }); }
}
const SHOP_LINES = {
  food: ['Everything on the counter is under a lid. The lids are older than the keeper.', 'A card by the till: "Guests eat at the hall. This is for the walk home."'],
  craft: ['Offcuts sorted by fibre and colour, and a drawer of things waiting to be called for.', 'A card on the wall: "New mass is dear. Bring the old one in."'],
  service: ['A price board with four prices, the cheapest after eleven.', 'Somebody has left a note: "Back in five. The kettle is on the loop."'],
};

// A small shop: a glazed front with its name, a counter, shelves, a keeper, two customers' worth of floor.
function plainShop(s, lot, plan, game) {
  const o = orient(lot), r = new Rng(lot.seed), pal = PALETTES[r.i(0, PALETTES.length - 1)], info = plan.info, H = LOT_H;
  const clip = room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: pal.floor, ceil: ['paint', '#efe6d6'], wall: { tint: pal.wall, dado: { h: 1.0, mat: 'tile', tint: pal.dado } }, open: { [lot.front]: false }, glow: { sky: '#ffe2b8', ground: '#b88c64', power: 0.5 } });
  shopfront(s, { side: lot.front, a0: o.a0 + 0.25, a1: o.a1 - 0.25, c: o.c, y: 0, h: H, fascia: { text: lot.name, sub: lot.sub, palette: pal.sign }, palette: { frame: pal.frame, plinth: pal.plinth, awning: pal.awning }, door: { kind: 'slide', at: Math.max(0.6, (o.W - 0.5) / 2 - 0.55 + r.f(-1, 1)) }, awning: lot.onCourt ? false : r.chance(0.6), glow: 0.6 });
  // side returns beside the glazing
  const g = s.g; g.mat('paint', pal.frame);
  for (const p of [0, o.W - 0.25]) { const b = o.box(p, -0.1, p + 0.25, 0.1); g.box(b[0], 0, b[1], b[2], H, b[3]); s.solid(b[0], 0, b[1], b[2], H, b[3]); }
  s.flush({ tier: 's' });
  // the counter across the back, with the keeper behind it; shelving on the back wall
  const cw = Math.min(o.W - 2.2, 3.4), cq = o.P(o.W / 2, o.D - 2.2);
  prop(s, 'counter', cq[0], 0, cq[1], o.yawOut, { w: cw, d: 0.6, h: 0.9, body: pal.plinth, top: '#b98a5a' });
  const sq = o.P(o.W / 2, o.D - 0.32);
  prop(s, 'shelving', sq[0], 0, sq[1], o.yawOut, { w: Math.min(o.W - 1, 5), h: 2.1, d: 0.34, shelves: 4, wood: '#7a5233', back: true });
  stock(s, o, r, lot.tradeKind || 'craft', pal, cw);
  const kp = o.P(o.W / 2, o.D - 1.35);
  s.spot('counter', kp[0], 0, kp[1], o.yawOut, { tags: ['shop', lot.trade || 'shop'] });
  for (const p of [0.3, 0.7]) { const q = o.P(o.W * p, o.D - 3.3); s.spot('customer', q[0], 0, q[1], o.yawIn, { tags: ['shop'] }); }
  for (const p of [0.18, 0.82]) { const q = o.P(o.W * p, 1.6); s.spot('browse', q[0], 0, q[1], p < 0.5 ? o.yawIn + 1.2 : o.yawIn - 1.2, { tags: ['shop'] }); }
  for (const p of [0.3, 0.7]) { const q = o.P(o.W * p, o.D * 0.5); lamp(s, 'globe', q[0], H, q[1], { drop: 0.5, K: 2800, power: 1.0, clip, range: 6 }); }
  // the way in for people: from just outside the door to the counter
  const dq = o.P(o.W / 2, -0.7), iq = o.P(o.W / 2, 1.2), fq = o.P(o.W / 2, o.D - 3.2);
  s.path([dq, iq, fq], { width: 1.1 });
  const ip = o.P(o.W / 2, o.D - 2.9);
  s.interact({ x: ip[0], y: 1.1, z: ip[1], radius: 1.7, prompt: 'Look round ' + lot.name, onUse: (gm) => say(gm, lot.name, SHOP_LINES[lot.tradeKind] || SHOP_LINES.craft) });
  s.zoneBox({ id: lot.id, place: 'city-shop', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: lot.name, sub: info.name + ' · ' + (o.alongX ? info.avenue : info.street), ambience: 'shop', reverb: 'room', cell: info.key });
  void game;
}

// One of the block's own rooms: a door, a sign over it, a lit room with somewhere to sit.
function plainRoom(s, lot, plan, game) {
  const o = orient(lot), r = new Rng(lot.seed), pal = PALETTES[r.i(0, PALETTES.length - 1)], info = plan.info, H = LOT_H;
  const dAt = Math.max(0.8, o.W / 2 - 0.6);
  const clip = room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: ['planks', '#a8794f'], ceil: ['paint', '#efe6d6'], wall: { tint: pal.wall, dado: { h: 0.95, mat: 'wood', tint: shadeHex(pal.dado, 0.8) } },
    open: { [lot.front]: [{ at: dAt, w: 1.2, h: 2.2 }, { at: Math.min(o.W - 2.4, dAt + 2.0), w: 1.6, h: 1.3, sill: 0.9 }] }, glow: { sky: '#ffe2b8', ground: '#b88c64', power: 0.55 } });
  const fq = o.P(o.W / 2, -0.03);
  sign(s, { kind: 'fascia', text: lot.name, sub: lot.sub, palette: pal.sign }, fq[0], 2.72, fq[1], { face: lot.front === 'n' ? 'z' : lot.front === 's' ? 'Z' : lot.front === 'w' ? 'x' : 'X', w: Math.min(3.4, o.W - 0.6), h: 0.42, glow: 0.5 });
  const wq0 = o.P(Math.min(o.W - 2.4, dAt + 2.0), 0), wq1 = o.P(Math.min(o.W - 2.4, dAt + 2.0) + 1.6, 0);
  s.glass(wq0[0], 0.9, wq0[1], wq1[0], 2.2, wq1[1], { opacity: 0.14 });
  const tq = o.P(o.W / 2, o.D * 0.55);
  prop(s, 'table', tq[0], 0, tq[1], o.yawOut, { w: Math.min(2.4, o.W - 3), d: 0.9, h: 0.74, wood: '#7a5233', legs: 'trestle' });
  for (const dp of [-0.7, 0.7]) for (const dq of [-0.75, 0.75]) { const q = o.P(o.W / 2 + dp, o.D * 0.55 + dq); prop(s, 'chair', q[0], 0, q[1], dq < 0 ? o.yawIn : o.yawOut, { wood: '#5a3a26', back: 'slat' }); s.spot('sit', q[0], 0.45, q[1], dq < 0 ? o.yawIn : o.yawOut, { tags: ['room', lot.use] }); }
  const bq = o.P(0.5, o.D - 0.5); prop(s, 'plant', bq[0], 0, bq[1], 0, { kind: 'broad', size: 1.3, pot: '#a3563a' });
  for (const p of [0.3, 0.7]) { const q = o.P(o.W * p, o.D * 0.5); lamp(s, 'globe', q[0], H, q[1], { drop: 0.55, K: 2750, power: 1.0, clip, range: 6 }); }
  s.path([o.P(dAt + 0.6, -0.7), o.P(dAt + 0.6, 1.2), o.P(o.W / 2, o.D * 0.3)], { width: 1.1 });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: lot.name.charAt(0) + lot.name.slice(1).toLowerCase(), sub: info.name + ' · ' + lot.sub, ambience: 'shop', reverb: 'felt', cell: info.key });
  void game;
}

// The lift core's lobby: a wide mouth on the avenue, two berths, the stair, and the block's board.
function plainLobby(s, lot, plan, game) {
  const o = orient(lot), info = plan.info, H = 3.0, g = s.g;
  const clip = room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: ['terrazzo', '#e3dccb'], ceil: ['paint', '#f0e8d6'], wall: { tint: '#d9d2bf', mat: 'tile', dado: { h: 1.1, mat: 'tile', tint: '#2f6f73' } }, open: { [lot.front]: [{ at: 2.5, w: o.W - 5, h: 2.7 }] }, glow: { sky: '#fff0d8', ground: '#d8c8a8', power: 0.7 } });
  const fq = o.P(o.W / 2, -0.04), face = lot.front === 'n' ? 'z' : lot.front === 's' ? 'Z' : lot.front === 'w' ? 'x' : 'X';
  sign(s, { kind: 'fascia', text: 'CABS', sub: info.name + ' core · lifts · stairs · decks ' + info.d0 + ' to ' + info.d1, font: 'caps', palette: ['#14211f', '#ffe3a8', '#3fe0d0'] }, fq[0], 2.86, fq[1], { face, w: Math.min(3.2, o.W - 6), h: 0.26, glow: 3 });
  // the block's own colour in a band above the dado, a ring in the floor where the cabs set you down, felt overhead, plants
  {
    const tint = ['#c9552e', '#8a2f3c', '#33407a', '#6b7a3a', '#5b3a6e', '#d6a640'][info.style % 6];
    g.mat('tile', tint);
    for (const b of [o.box(0.09, 0.4, 0.1, o.D - 0.09), o.box(o.W - 0.1, 0.4, o.W - 0.09, o.D - 0.09), o.box(0.09, o.D - 0.1, o.W - 0.09, o.D - 0.09)]) g.box(b[0], 1.1, b[1], b[2], 1.3, b[3]);
    s.flush({ tier: 's' });
    const c = o.P(o.W / 2, o.D * 0.5);
    g.mat('mosaic', tint); g.lathe(c[0], c[1], [[2.3, 0.004], [1.9, 0.004]], { segs: 40 });
    g.mat('cast', '#b8914a', { rough: -0.2 }); g.lathe(c[0], c[1], [[2.34, 0.006], [2.3, 0.006]], { segs: 40 }); g.lathe(c[0], c[1], [[1.9, 0.006], [1.86, 0.006]], { segs: 40 });
    s.flush({ tier: 's' });
    g.mat('felt', tint); for (const pp of [0.25, 0.5, 0.75]) { const b = o.box(o.W * pp - 0.03, 1.2, o.W * pp + 0.03, o.D - 1.2); g.box(b[0], H - 0.42, b[1], b[2], H - 0.02, b[3], { bevel: 0.01 }); }
    s.flush({ tier: 's' });
    for (const pp of [0.9, o.W - 0.9]) { const q = o.P(pp, o.D - 0.8); prop(s, 'plant', q[0], 0, q[1], 0, { kind: pp < 2 ? 'broad' : 'fern', size: 1.5, pot: '#a3563a' }); }
  }
  // berth doors in the back wall
  const berths = [o.W * 0.3, o.W * 0.7];
  for (const p of berths) {
    const a = o.box(p - 0.6, o.D - 0.2, p + 0.6, o.D - 0.16);
    g.mat('brushed', '#b9b4aa'); g.box(a[0], 0, a[1], a[2], 2.2, a[3]);
    const fr = o.box(p - 0.72, o.D - 0.24, p + 0.72, o.D - 0.16);
    g.mat('cast', '#c8a45a'); g.box(fr[0], 2.2, fr[1], fr[2], 2.32, fr[3]);
    const lq = o.P(p, o.D - 0.26); g.mat('diffuser', '#9fffd8', { emissive: 5, lamp: true }); g.box(lq[0] - 0.07, 2.42, lq[1] - 0.07, lq[0] + 0.07, 2.56, lq[1] + 0.07);
    s.flush({ tier: 's' });
    const ip = o.P(p, o.D - 0.9);
    s.interact({ x: ip[0], y: 1.2, z: ip[1], radius: 1.5, prompt: 'Call a cab', onUse: (gm) => { if (gm.city && gm.city.callCab) gm.city.callCab({ L: info.L, i: info.i, j: info.j }); } });
    s.spot('stand', ip[0], 0, ip[1] , o.yawIn, { tags: ['wait', 'cab'] });
  }
  // the stair door on one side wall, the block's board on the other
  const sp = o.P(0.25, o.D * 0.55), bp = o.P(o.W - 0.2, o.D * 0.5);
  const sideFace = (low) => (o.alongX ? (low ? 'X' : 'x') : (low ? 'Z' : 'z'));
  g.mat('wood', '#6b4a2f'); { const b = o.box(0.16, o.D * 0.55 - 0.55, 0.24, o.D * 0.55 + 0.55); g.box(b[0], 0, b[1], b[2], 2.15, b[3]); } s.flush({ tier: 's' });
  sign(s, { kind: 'plate', text: 'STAIRS', lines: ['up and down · mind your weight'] }, sp[0], 2.35, sp[1], { face: sideFace(true), w: 0.5, h: 0.2 });
  const up = game.city ? game.city.above({ L: info.L, i: info.i, j: info.j }, 1) : null, dn = game.city ? game.city.above({ L: info.L, i: info.i, j: info.j }, -1) : null;
  const stairAt = o.P(0.9, o.D * 0.55);
  const topDecks = !up && game.city && info.L === game.city.LAYERS.length - 1;
  if (up) s.interact({ x: stairAt[0], y: 1.5, z: stairAt[1], radius: 1.4, priority: 0.1, prompt: () => 'Climb the stairs to ' + game.city.info(up).name, onUse: (gm) => gm.city.stairs(up, 1) });
  else if (topDecks) s.interact({ x: stairAt[0], y: 1.5, z: stairAt[1], radius: 1.4, priority: 0.1, prompt: 'Climb the last stair to the Hollow', onUse: (gm) => gm.city.toHollow({ L: info.L, i: info.i, j: info.j }) });
  if (dn) { const q = o.P(0.9, o.D * 0.55 + 1.1); s.interact({ x: q[0], y: 0.9, z: q[1], radius: 1.2, prompt: () => 'Go down the stairs to ' + game.city.info(dn).name, onUse: (gm) => gm.city.stairs(dn, -1) }); }
  sign(s, { kind: 'board', title: info.name, lines: ['decks ' + info.d0 + ' to ' + info.d1 + '|' + info.g.toFixed(2) + ' g', 'Ring ' + info.ringName + '|' + info.bandName, 'the hall|' + info.dish[0], 'about ' + Math.round(info.people / 100) * 100 + ' people|one long table'], palette: ['#22362b', '#f3e6c8', '#d6a640'] }, bp[0], 1.6, bp[1], { face: sideFace(false), w: 1.1, h: 0.74 });
  const rp = o.P(o.W - 1.0, o.D * 0.5);
  s.interact({ x: rp[0], y: 1.5, z: rp[1], radius: 1.6, prompt: 'Read the block board', onUse: (gm) => say(gm, info.name, [info.name + ': decks ' + info.d0 + ' to ' + info.d1 + ', Ring ' + info.ringName + ', ' + info.g.toFixed(2) + ' of a g. About ' + Math.round(info.people / 100) * 100 + ' people.', 'The hall is ' + info.hall + '. Today: ' + info.dish[0] + '.', info.pride]) });
  // where the ways out of the block lead, on the wall between the berths
  {
    const ex = plan.exits, way = (k, label) => (ex[k] && ex[k].open ? label + '|' + ex[k].name : label + '|' + (ex[k] && ex[k].cap ? 'the ' + ex[k].cap + ' cap' : 'no way through'));
    const upI = up ? game.city.info(up) : null, dnI = dn ? game.city.info(dn) : null;
    const wq = o.P(o.W * 0.5, o.D - 0.19);
    sign(s, { kind: 'board', title: 'From ' + info.name, lines: [way('spin', 'spinward'), way('anti', 'anti'), way('front', 'toward the front'), way('back', 'toward the back'), 'up the stair|' + (upI ? upI.name : topDecks ? 'the Hollow' : 'the line deck'), 'down the stair|' + (dnI ? dnI.name : 'the line deck')], palette: ['#14211f', '#f3e6c8', '#3fe0d0'] }, wq[0], 1.62, wq[1], { face, w: 1.1, h: 0.78 });
    const iq = o.P(o.W * 0.5, o.D - 0.9);
    s.interact({ x: iq[0], y: 1.5, z: iq[1], radius: 1.3, priority: -0.1, prompt: 'Read the ways board', onUse: (gm) => say(gm, info.name + ' core', ['Spinward is ' + (ex.spin.open ? ex.spin.name : 'closed') + ', anti is ' + (ex.anti.open ? ex.anti.name : 'closed') + '. Toward the front: ' + (ex.front.open ? ex.front.name : ex.front.cap ? 'the front cap, and nothing' : 'no way through') + '. Toward the back: ' + (ex.back.open ? ex.back.name : ex.back.cap ? 'the back cap, and nothing' : 'no way through') + '.', (upI ? 'Up the stair is ' + upI.name + ', decks ' + upI.d0 + ' to ' + upI.d1 + '. ' : topDecks ? 'Up the stair is the floor of the Hollow. ' : 'Up the stair is a line deck, where nobody lives. ') + (dnI ? 'Down it is ' + dnI.name + '.' : 'Down it is a line deck.'), 'A cab from either berth goes to any block there is. There are ' + game.city.count.toLocaleString('en-GB') + ' of them.']) });
  }
  const bn = o.P(o.W - 1.2, 1.4); prop(s, 'bench', bn[0], 0, bn[1], o.alongX ? (lot.front === 'n' ? 0 : Math.PI) : (lot.front === 'w' ? Math.PI / 2 : -Math.PI / 2), { w: 1.6, back: true, wood: '#6b4a2f' });
  for (const p of [0.3, 0.7]) { const q = o.P(o.W * p, o.D * 0.5); lamp(s, 'panel', q[0], H, q[1], { w: 1.4, d: 0.6, power: 2.0, K: 3700, clip }); }
  s.path([o.P(o.W / 2, -0.7), o.P(o.W / 2, o.D * 0.5), o.P(berths[0], o.D - 1.2)], { width: 1.4 });
  s.path([o.P(o.W / 2, o.D * 0.5), o.P(berths[1], o.D - 1.2)], { width: 1.4 });
  s.loop('cab-hum', ...(() => { const q = o.P(o.W / 2, o.D - 0.5); return [q[0], 1.5, q[1]]; })(), { vol: 0.16, radius: 9 });
  s.zoneBox({ id: lot.id, place: 'city-lobby', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: info.name + ' core', sub: 'cabs and stairs · ' + info.address, ambience: 'arcade', reverb: 'tile', cell: info.key });
  // where a cab sets you down
  const ar = o.P(o.W / 2, o.D * 0.45);
  lot.arrive = { x: ar[0], y: 0, z: ar[1], yaw: o.yawOut === 0 ? Math.PI : o.yawOut === Math.PI ? 0 : o.yawOut === Math.PI / 2 ? Math.PI / 2 : -Math.PI / 2 };
}

// The hall: one long table, benches, lids, a pass with somebody always cooking. Open to the court along part of its front.
async function plainHall(s, lot, plan, game, tick) {
  const o = orient(lot), r = new Rng(lot.seed), info = plan.info, H = 3.4, g = s.g, pal = PALETTES[info.style];
  const cs = lot.courtSpan, c0 = (o.alongX ? cs[0] - lot.x0 : cs[0] - lot.z0), c1 = (o.alongX ? cs[1] - lot.x0 : cs[1] - lot.z0);
  const arches = []; for (let a = c0 + 0.6; a + 3.4 <= c1; a += 4.2) arches.push({ at: a, w: 3.4, h: 2.8 });
  const clip = room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: ['planks', '#a8794f'], ceil: ['wood', '#8a5634'], wall: { tint: pal.wall, dado: { h: 1.1, mat: 'wood', tint: '#6b4a2f' } }, open: { [lot.front]: arches }, glow: { sky: '#ffdcae', ground: '#a8794f', power: 0.6 } });
  // the table down the middle, a runner on it, benches both sides, a lid at every place
  const t0 = 2.2, t1 = o.W - 2.2, tq = o.D * 0.5;
  const tb = o.box(t0, tq - 0.45, t1, tq + 0.45);
  g.mat('wood', '#7a5233', { rough: -0.1 }); g.box(tb[0], 0.7, tb[1], tb[2], 0.76, tb[3], { bevel: 0.012 });
  g.mat('wood', '#5a3a26'); for (let p = t0 + 0.4; p < t1; p += 2.4) { const lb = o.box(p - 0.06, tq - 0.38, p + 0.06, tq + 0.38); g.box(lb[0], 0, lb[1], lb[2], 0.7, lb[3]); }
  const rb = o.box(t0 + 0.3, tq - 0.16, t1 - 0.3, tq + 0.16); g.mat('stripe', ['#2f6f73', '#8a2f3c', '#6b7a3a', '#33407a', '#c9962e', '#5b3a6e'][info.style]); g.box(rb[0], 0.76, rb[1], rb[2], 0.765, rb[3], { faces: 'Y' });
  s.flush({ tier: 's', cast: true }); s.solid(tb[0], 0, tb[1], tb[2], 0.76, tb[3]);
  if (tick) await tick();
  for (const sg of [-1, 1]) {
    const bb = o.box(t0, tq + sg * 0.78 - 0.16, t1, tq + sg * 0.78 + 0.16);
    g.mat('wood', '#8a6240'); g.box(bb[0], 0.4, bb[1], bb[2], 0.45, bb[3], { bevel: 0.01 });
    g.mat('wood', '#5a3a26'); for (let p = t0 + 0.3; p < t1; p += 2.0) { const lb = o.box(p - 0.05, tq + sg * 0.78 - 0.13, p + 0.05, tq + sg * 0.78 + 0.13); g.box(lb[0], 0, lb[1], lb[2], 0.4, lb[3]); }
    s.flush({ tier: 's', cast: true }); s.solid(bb[0], 0, bb[1], bb[2], 0.45, bb[3]);
    for (let p = t0 + 0.5; p < t1 - 0.3; p += 0.75) {
      const sq = o.P(p, tq + sg * 0.78); s.spot('sit', sq[0], 0.45, sq[1], sg < 0 ? o.yawIn : o.yawOut, { tags: ['hall', 'eat', 'table'] });
      if (Math.round(p * 4) % 3 === 0) { const lq = o.P(p, tq + sg * 0.3); prop(s, 'bowl', lq[0], 0.765, lq[1], r.f(0, 3), { glaze: ['#e9e2d0', '#d9c7a6', '#a3563a', '#3d6f8a', '#6b7a3a'][r.i(0, 4)], lid: ['#c9552e', '#2f6f73', '#d6a640', '#33407a'][r.i(0, 3)], r: 0.09 }, { noCollide: true }); }
    }
  }
  if (tick) await tick();
  // pots of herbs down the table
  for (let p = t0 + 3; p < t1 - 2; p += 6.5) { const q = o.P(p, tq); prop(s, 'plant', q[0], 0.765, q[1], 0, { kind: 'fine', size: 0.34, pot: '#a3563a' }, { noCollide: true }); }
  // the pass on the back wall, the cook behind it, the day's dish chalked up
  const pw = Math.min(10, o.W * 0.3), pc = o.W * 0.5, pq = o.P(pc, o.D - 1.4);
  prop(s, 'counter', pq[0], 0, pq[1], o.yawOut, { w: pw, d: 0.7, h: 0.95, body: '#3a2a20', top: '#b98a5a' });
  for (let k = 0; k < 5; k++) { const q = o.P(pc - pw / 2 + 0.6 + k * (pw - 1.2) / 4, o.D - 1.4); prop(s, 'crock', q[0], 0.95, q[1], 0, { glaze: ['#3a2a20', '#a3563a', '#d9c7a6'][k % 3], h: 0.3, r: 0.17 }, { noCollide: true }); }
  const kq = o.P(pc, o.D - 0.75); s.spot('counter', kq[0], 0, kq[1], o.yawOut, { tags: ['hall', 'cook', 'pass'] });
  for (const dp of [-2.4, 2.4]) { const q = o.P(pc + dp, o.D - 0.75); s.spot('work', q[0], 0, q[1], o.yawOut, { tags: ['hall', 'cook'] }); }
  const backFace = lot.front === 'n' ? 'z' : lot.front === 's' ? 'Z' : lot.front === 'w' ? 'x' : 'X';
  const chq = o.P(pc, o.D - 0.19);
  sign(s, { kind: 'chalk', title: 'Today', lines: [info.dish[0], 'guests: a seat is yours', 'gin after six'] }, chq[0], 2.1, chq[1], { face: backFace, w: 0.9, h: 1.2 });
  const nmq = o.P(o.W * 0.5, -0.05);
  void nmq;
  // lamps: a row of shaded pendants over the table
  for (let p = t0 + 2; p < t1; p += 7) { const q = o.P(p, tq); lamp(s, 'globe', q[0], H, q[1], { drop: 0.9, K: 2700, power: 1.5, clip, range: 7.5 }); }
  // eating: guest-right gives you a seat and the day's dish
  const ip = o.P(pc, o.D - 2.3);
  s.interact({ x: ip[0], y: 1.1, z: ip[1], radius: 1.9, prompt: 'Ask at the pass', onUse: async (gm) => {
    const key = 'hall:' + info.key, eaten = gm.flags[key];
    await say(gm, info.cook.split(' ')[0], eaten ? ['Back again. Sit anywhere. You will be seated next to someone.'] : ['Where have you slept? And have you eaten?', 'Then sit. Today it is ' + info.dish[0] + '. ' + info.dish[1], 'A guest has a seat at any hall. That is the whole of the rule.']);
    if (!eaten) { gm.flags[key] = true; gm.flags.halls_eaten = (gm.flags.halls_eaten || 0) + 1; if (gm.audio) gm.sfx('lid-up', { vol: 0.5 }); note(gm, 'You lift the lid at ' + info.hall + ', ' + info.name + '. ' + gm.flags.halls_eaten + (gm.flags.halls_eaten === 1 ? ' hall' : ' halls') + ' so far.', 'gain'); gm.events.emit('hall:eat', { cell: info.key, name: info.hall, block: info.name, dish: info.dish[0], n: gm.flags.halls_eaten }); if (gm.story && gm.story.persist) gm.story.persist(); }
  } });
  // walkways: in through the arches, down both sides of the table
  const mid = (a) => a.at + a.w / 2;
  for (const sg of [-1, 1]) { const pts = []; for (let p = t0 - 0.6; p <= t1 + 0.7; p += 3) pts.push(o.P(p, tq + sg * 1.6)); s.path(pts, { width: 1.2 }); }
  s.path([o.P(t0 - 0.6, tq - 1.6), o.P(t0 - 0.6, tq + 1.6)]); s.path([o.P(t1 + 0.6, tq - 1.6), o.P(t1 + 0.6, tq + 1.6)]);
  for (const a of arches) { s.path([o.P(mid(a), -0.8), o.P(mid(a), 0.9), o.P(mid(a), tq - 1.6)], { width: 1.4 }); }
  s.loop('murmur', ...(() => { const q = o.P(o.W / 2, tq); return [q[0], 1.2, q[1]]; })(), { vol: 0.4, radius: 26, param: 0.5 });
  s.zoneBox({ id: lot.id, place: 'city-hall', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: info.hall, sub: 'the long table · ' + info.name, ambience: 'hall', reverb: 'hall', cell: info.key });
  void mixHex;
}

// A special lot with nothing registered for it yet: a quiet planted room behind a glazed front, named for what it will be.
async function plainSpecial(s, lot, plan, game, tick) {
  const o = orient(lot), info = plan.info, H = 3.3, r = new Rng(lot.seed);
  const dim = lot.special === 'dimwood' || lot.special === 'stillroom';
  const clip = room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: dim ? ['soil', '#6b5a48'] : ['terrazzo', '#d8ccb4'], ceil: ['paint', dim ? '#1d2a24' : '#efe6d6'], wall: { tint: dim ? '#24362e' : '#e7d9bf' }, open: { [lot.front]: false }, glow: { sky: dim ? '#9fd8b0' : '#fff0d8', ground: dim ? '#27402f' : '#d8c8a8', power: dim ? 0.25 : 0.8 } });
  // the front: a wide doorway in the middle and a row of tall windows either side, between pilasters
  {
    const sd = frontSide(lot), fin = FIN[(plan.info.style * 2 + 4) % FIN.length], dAt = Math.max(1, o.W / 2 - 1.6), ops = [{ at: dAt, w: 3.2, h: 2.7 }];
    const bays = (lo, hi) => { const n = Math.floor((hi - lo) / 3.6); for (let k = 0; k < n; k++) ops.push({ at: lo + (hi - lo) * (k + 0.5) / n - 1.0, w: 2.0, h: 1.5, sill: 0.95 }); };
    bays(0.4, dAt - 0.3); bays(dAt + 3.5, o.W - 0.4);
    frontWall(s, sd, o.a0, o.a1, LOT_H, ops, fin);
    for (const op of ops) {
      if (op.sill) { const a = sd.pt(o.a0 + op.at, op.sill, 0.1), b = sd.pt(o.a0 + op.at + op.w, op.sill + op.h, 0.1); s.glass(a[0], a[1], a[2], b[0], b[1], b[2], { opacity: 0.14 }); }
      pilaster(s, sd, o.a0 + op.at - (op.sill ? 0.5 : 0.25), LOT_H + 0.37);
    }
    pilaster(s, sd, o.a1 - 0.2, LOT_H + 0.37);
    if (tick) await tick();
  }
  const label = { dimwood: ['DIM WOOD', 'lit like a cloudy evening'], square: ['BRIGHT SQUARE', 'lit like an overcast day'], school: ['SCHOOL', 'the long hall at half past three'], baths: ['BATHS', 'warm from the loop'], playhall: ['PLAY HALL', 'slides · ropes · a timing board'], inn: ['INN', 'guest-right beds'], market: ['SECOND MARKET', 'every thing with its card'], workshops: ['WORKSHOPS', 'benches by the hour'], theatre: ['THEATRE', 'nobody shouts'], reading: ['READING ROOMS', 'what came in by light today'], garden: ['LAMP GARDEN', 'pooled light'], dancehall: ['TEA DANCE', 'half a g'], naming: ['NAMING ROOMS', 'both families in the room'], cradle: ['CRADLE ARCADE', 'pram berths · warm benches'], stillroom: ['STILL ROOM', 'felt, and nothing said'], studio: ['LIGHT STUDIOS', 'pooled light, taken in turns'], lamprow: ['LAMP ROW', 'fourteen gardens in one strip'] }[lot.special] || ['ROOMS', ''];
  const fq = o.P(o.W / 2, -0.04);
  sign(s, { kind: 'fascia', text: label[0], sub: label[1], palette: dim ? ['#1d2a24', '#e9f0d8', '#9fd8b0'] : ['#2d3b36', '#f3e6c8', '#d8a657'] }, fq[0], 2.9, fq[1], { face: lot.front === 'n' ? 'z' : lot.front === 's' ? 'Z' : lot.front === 'w' ? 'x' : 'X', w: Math.min(4, o.W - 1), h: 0.46, glow: 0.8 });
  if (tick) await tick();
  for (let k = 0; k < Math.round(o.W * o.D / 40); k++) { if (tick && k % 4 === 3) await tick(); const q = o.P(r.f(1.2, o.W - 1.2), r.f(2.2, o.D - 1.2)); planter(s, q[0], 0, q[1], { w: 1.6, d: 0.9, h: 0.5, plants: dim ? 'fern' : ['flower', 'broad', 'herbs'][r.i(0, 2)], tint: '#a99c86', density: 16 }); }
  for (let k = 0; k < Math.max(2, Math.round(o.W / 7)); k++) { const q = o.P(1.5 + k * (o.W - 3) / Math.max(1, Math.round(o.W / 7) - 1 || 1), o.D * 0.45); prop(s, 'bench', q[0], 0, q[1], o.yawOut, { w: 1.6, back: true, wood: '#7a5233' }, { noSpots: true }); s.spot('sit', q[0], 0.46, q[1], o.yawOut, { tags: ['special'] }); lamp(s, 'globe', q[0], H, q[1], { drop: 0.5, K: dim ? 4200 : 3000, power: dim ? 0.5 : 1.4, clip, range: 8 }); }
  s.path([o.P(o.W / 2, -0.7), o.P(o.W / 2, 1.5), o.P(o.W / 2, o.D * 0.45)], { width: 1.3 });
  s.zoneBox({ id: lot.id, place: 'city-special', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: label[0].charAt(0) + label[0].slice(1).toLowerCase(), sub: info.name + (label[1] ? ' · ' + label[1] : ''), ambience: dim ? 'quiet' : 'shop', reverb: 'felt', cell: info.key });
  void game; void floor; void ceiling; void wall; void roomGlow; void warm; void railing;
}

registerLot('shop', plainShop);
registerLot('room', plainRoom);
registerLot('lobby', plainLobby);
registerLot('hall', plainHall);
registerLot('special', plainSpecial);
