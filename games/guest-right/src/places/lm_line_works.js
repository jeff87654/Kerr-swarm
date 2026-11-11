// The line works: line deck 38 to 39, the first line deck above Candlewick (two decks deep, 8 m clear, 0.95 g). Nobody
// lives here: the cabs do. Frame `line38`: x spinward, z toward the back cap, y up; the floor of deck 38 is y = 0.
//   The running hall: 800 m of hall along x, curving up out of sight both ways. Behind a long glass wall the two loop
//     tubes run side by side (anti nearest, spinward behind), and lit cabs go by in platoons. A cross-line passes over
//     the hall on the upper level, in a glass trough.
//   The Pass: a gallery on the upper level with a grille floor over the loops and a glass wall onto the cross-line.
//   The Cab Kitchen: where cabs are opened up and mended (a shell on the hoist, the felt benches, the test berth, the
//     wall of door gear).
//   Leftovers: the lost property hall, everything ever left in a cab, shelved by the deck it was left at.
//   The Plate Rack: the depot where the cabs not needed wait in the small hours, in rows, dark, one small lamp each.
import { floor, ceiling, wall, lamp, roomGlow, stairs } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { Rng } from '../core/util.js';
import { say, toast, sfx, seat, runX, lineX, platoon, lobby, frameWait } from './lm_line_parts.js';

const PI = Math.PI;
const H = 7.6;                                   // floor of deck 38 to the underside of deck 40
const XE = 400;                                  // the hall runs x[-XE, XE]
const TG = -13.6, TD = -19.8, TZ = -26;          // the glass wall, the divider between the tubes, the tubes' far wall
const TY = 0.4, TR = 3.6;                        // the tubes' floor and roof
const CX0 = -20, CX1 = -9;                       // the cross-line's two tubes, x[CX0, CX1], on the upper level
const PX0 = -8.2, PX1 = 0.2;                     // the Pass
const SUB = 'Line deck 38 · Ring Two';
const PAL = { teal: '#2c5a56', tealDark: '#1d3b39', cream: '#e2d6bc', ochre: '#d9a23a', oxide: '#b0502c', brass: '#b08a45', conc: '#8d8a80', steel: '#474c4e', tube: '#c3cbc4' };
const LIVERY = [['#e2d6bc', '#b0502c'], ['#d9cba8', '#2c5a56'], ['#c9b48a', '#8a2f3c'], ['#e8dcc4', '#d98a3a'], ['#d4c7a8', '#5b4060']];

export const place = {
  id: 'lm-line-works', name: 'The line works', order: 10,
  region: 'line-works',
  stops: [{ id: 'line-works', name: 'The line works', sub: 'line deck 38 · Ring Two · the Cab Kitchen, Leftovers', group: 'The line decks', spawn: 'line-works', deck: 38, zd: 625 }],
  async build(game) {
    const W = game.world;
    const f = W.frame('line38', deckRadius(38), 0.35, 625);
    const s = W.scope('line-works', f);
    hall(game, s); await frameWait();
    tubes(game, s); await frameWait();
    crossLine(game, s);
    pass(game, s); await frameWait();
    lobby(game, s, { x0: 4, x1: 20, z0: 0, z1: 12, h: 4.2, front: false, stop: 'line-works', title: 'Line deck 38 · cabs', sub: 'core 2,214 · four berths',
      board: { kind: 'board', title: 'The Lattice', lines: ['Lift cores|about 5,200', 'Channels a core|ten', 'Berths a lobby|four', 'Loops on this deck|74', 'Cross-lines|141', 'Door to door, mean|6.2 min', 'Worst in the drum|about 12 min'] } });
    s.zoneBox({ id: 'line-lobby', place: 'line-works', box: [4, -0.5, 0, 20, 4.2, 12], name: 'Line deck 38', sub: 'the lift lobby · ' + SUB, ambience: 'station', reverb: 'room' });
    lobbyReads(game, s);
    await frameWait();
    kitchen(game, s); await frameWait();
    leftovers(game, s); await frameWait();
    plateRack(game, s); await frameWait();
    movers(game, s);
    s.finish();
    game.spawns['line-works'] = { frame: f, x: 12, y: 0, z: 8.6, yaw: 0 };
  },
};

// ---------------------------------------------------------------------------------------------------------------
// shared pieces
// ---------------------------------------------------------------------------------------------------------------
// A wall along x at z from x0 to x1 in pieces of 16 m, with openings [{ a, b, h }] in absolute x. Lintels over openings.
function wallX(s, x0, x1, z, h, ops, o) {
  let x = x0;
  for (const op of ops.slice().sort((p, q) => p.a - q.a)) {
    if (op.a > x) runX(x, op.a, 16, (a, b) => wall(s, a, z, b, z, 0, h, o));
    if (op.h < h) wall(s, op.a, z, op.b, z, op.h, h - op.h, Object.assign({}, o, { skirt: false, dado: undefined }));
    x = op.b;
  }
  if (x < x1) runX(x, x1, 16, (a, b) => wall(s, a, z, b, z, 0, h, o));
}
// A steel frame round an opening in a wall along x (the hall side faces -z).
function portalX(s, a, b, z, h, tint) {
  const g = s.g; g.mat('cast', tint || PAL.steel, { rough: -0.1 });
  g.box(a - 0.22, 0, z - 0.14, a, h + 0.22, z + 0.14, { bevel: 0.015 }); g.box(b, 0, z - 0.14, b + 0.22, h + 0.22, z + 0.14, { bevel: 0.015 });
  g.box(a, h, z - 0.14, b, h + 0.22, z + 0.14, { bevel: 0.015 });
  g.mat('paint', PAL.ochre); for (const x of [a - 0.23, b + 0.01]) for (let y = 0.1; y < 1.2; y += 0.3) g.box(x, y, z - 0.145, x + 0.22, y + 0.14, z - 0.14, { faces: 'z' });
  s.flush({ tier: 's' });
}
// read lines as a sign's own speaker
async function read(game, who, lines) { await say(game, who, lines); }

// ---------------------------------------------------------------------------------------------------------------
// The running hall: the walk side, z[TG, 0], x[-XE, XE], 7.6 m tall.
// ---------------------------------------------------------------------------------------------------------------
function hall(game, s) {
  const g = s.g, r = new Rng(3838);
  const clip = [-XE, -0.5, TG - 0.1, XE, H + 0.1, 0.3];
  // floor, with a painted safety line by the glass, a walking lane and bay joints
  floor(s, -XE, TG, XE, 0, 0, 'concrete', '#8a877d');
  runX(-XE, XE, 16, (a, b) => {
    g.mat('paint', PAL.ochre, { rough: -0.1 }); g.box(a, 0, TG + 0.5, b, 0.006, TG + 0.62, { faces: 'Y' });
    g.mat('paint', '#d8d0bc'); g.box(a, 0, -8.2, b, 0.005, -8.1, { faces: 'Y' }); g.box(a, 0, -4.4, b, 0.005, -4.3, { faces: 'Y' });
    g.mat('concrete', '#7d7a71'); for (let x = Math.ceil(a / 8) * 8; x < b; x += 8) g.box(x - 0.02, 0, TG, x + 0.02, 0.004, 0, { faces: 'Y' });
    s.flush({ tier: 's', cast: false });
  });
  ceiling(s, -XE, TG, XE, 0, H, 'concrete', '#a9a597');
  // the back wall, with the rooms' openings
  const ops = [{ a: -118, b: -102, h: 6 }, { a: -46, b: -40, h: 3.4 }, { a: 5.2, b: 18.8, h: 3.6 }, { a: 40, b: 52, h: 6 }];
  wallX(s, -XE, XE, 0.08, H, ops, { tint: '#d6c6a4', tintB: '#c08a48', dado: { h: 1.25, mat: 'tile', tint: PAL.teal }, skirt: '#3a3430' });
  for (let x = -136; x <= 136; x += 32) { if (ops.some((op) => x > op.a - 3 && x < op.b + 3) || (x > -24 && x < 4)) continue; sign(s, { kind: 'letters', text: '38', palette: ['#f1e6c9'] }, x, 4.9, -0.02, { face: 'z', w: 2.2, h: 1.6 }); }
  runX(-XE, XE, 16, (a, b) => { g.mat('paint', PAL.cream); g.box(a, 3.3, -0.02, b, 3.42, 0.0, { faces: 'zY' }); g.mat('paint', PAL.tealDark); g.box(a, 6.5, -0.02, b, 6.6, 0.0, { faces: 'zY' }); s.flush({ tier: 's' }); });
  for (const op of ops) portalX(s, op.a, op.b, 0, op.h, op.h > 4 ? PAL.steel : '#3a3430');
  // the upper wall over the glass: painted panels from the tubes' roof to the ceiling, with openings for the Pass and the cross-line
  const up = [{ a: CX0, b: CX1 }, { a: PX0, b: PX1 }];
  let ux = -XE;
  for (const op of up) { runX(ux, op.a, 16, (a, b) => upperWall(s, a, b)); ux = op.b; }
  runX(ux, XE, 16, (a, b) => upperWall(s, a, b));
  // ceiling beams across the hall and two long ducts
  runX(-XE, XE, 16, (a, b) => {
    g.mat('cast', '#5a5e5c'); for (let x = Math.ceil(a / 8) * 8; x < b; x += 8) { g.box(x - 0.16, H - 0.55, TG, x + 0.16, H, 0, { faces: 'xXy' }); g.box(x - 0.24, H - 0.6, TG, x + 0.24, H - 0.55, 0, { faces: 'xXyY' }); }
    s.flush({ tier: 's' });
    g.mat('brushed', '#9a9a90'); g.tube(lineX(a, b, H - 1.05, -2.6, 2), 0.36, { segs: 10, caps: false }); g.mat('paint', PAL.oxide); g.tube(lineX(a, b, H - 0.95, -5.2, 2), 0.22, { segs: 8, caps: false });
    g.mat('cast', '#3d4a45'); g.box(a, H - 0.75, -9.4, b, H - 0.68, -8.6, { faces: 'yY' });
    s.flush({ tier: 's' });
  });
  // pilasters on the back wall and lamps down the hall: real light near the rooms, lit fittings only further off
  for (let x = -XE + 8; x < XE; x += 8) {
    if (ops.some((op) => x > op.a - 0.6 && x < op.b + 0.6)) continue;
    g.mat('paint', PAL.tealDark); g.box(x - 0.3, 0, -0.16, x + 0.3, H, 0.02, { faces: 'xXz' });
    g.mat('cast', PAL.brass); g.box(x - 0.32, 1.22, -0.18, x + 0.32, 1.3, 0.02, { faces: 'xXzY' });
    s.flush({ tier: 's' });
  }
  for (let x = -XE + 8; x < XE; x += 16) {
    const near = x > -150 && x < 150;
    if (near) lamp(s, 'panel', x, H - 0.62, -6.8, { w: 2.6, d: 0.5, K: 3600, power: 1.05, clip, range: 12, lampFlag: false });
    else { g.mat('brushed', '#8d8478'); g.box(x - 1.33, H - 0.66, -7.08, x + 1.33, H - 0.62, -6.52, { faces: 'xXzZy' }); g.mat('diffuser', '#fff0d8', { emissive: 5 }); g.box(x - 1.3, H - 0.67, -7.05, x + 1.3, H - 0.66, -6.55, { faces: 'y' }); s.flush({ tier: 's' }); }
  }
  roomGlow(s, -XE, 0, TG, XE, H, 0, { sky: '#ffe2b8', ground: '#8a7a5c', power: 0.1 });
  // the far ends: a crews' door into the interchange, where the hall turns
  for (const sx of [-1, 1]) {
    const x = sx * XE;
    wall(s, x, TG, x, 0, 0, H, { tint: '#bdb5a2', dado: { h: 1.25, mat: 'tile', tint: PAL.teal } });
    g.mat('paint', PAL.oxide); g.box(x - sx * 0.1 - 0.05, 0, -7.6, x - sx * 0.1 + 0.05, 2.3, -5.8); s.flush({ tier: 's' });
  }
  // benches facing the glass, crates and carts, mask racks, bollards
  for (let x = -120; x <= 120; x += 30) {
    if (x > -24 && x < 10) continue;
    prop(s, 'bench', x, 0, TG + 2.4, PI, { w: 2.2, back: true, wood: '#7a5233', metal: PAL.tealDark });
    seat(s, x, 0, TG + 2.4, PI, 'Sit and watch the cabs', { radius: 1.2 });
  }
  for (let x = -140; x <= 140; x += 22) {
    if ((x > -24 && x < 24) || Math.abs(x + 110) < 10 || Math.abs(x - 46) < 10) continue;
    const k = r.i(0, 2);
    if (k === 0) { prop(s, 'crate', x + r.f(-2, 2), 0, -1.0, r.f(-0.2, 0.2), { w: 0.8, h: 0.5, d: 0.6 }); prop(s, 'crate', x + r.f(-1, 1), 0.5, -1.0, r.f(-0.3, 0.3), { w: 0.6, h: 0.4, d: 0.5, wood: '#9a7a4e' }); }
    else if (k === 1) prop(s, 'lmline.cart', x + r.f(-2, 2), 0, -1.6, r.f(-0.15, 0.15) + PI / 2, { load: r.i(0, 2) });
    else prop(s, 'lmline.maskrack', x, 0, -0.16, 0, {});
  }
  // plates on the upper wall, every 48 m, naming the loops
  for (let x = -96; x <= 96; x += 48) {
    if (x > -24 && x < 4) continue;
    sign(s, { kind: 'street', text: 'Loop 38 · 41', sub: 'anti near · spinward far', palette: ['#1d3b39', '#f1ead8'] }, x, TR + 1.0, TG - 0.02, { face: 'z', w: 2.4, h: 0.5, glow: 0.9 });
  }
  s.zoneBox({ id: 'line-hall', place: 'line-works', box: [-XE, -0.5, TZ, XE, H, 0], name: 'The running hall', sub: SUB, ambience: 'station', reverb: 'station', headroom: H });
  // walkways and people
  s.path(lineX(-140, 140, 0, -6.2, 10).map((p) => [p[0], p[2]]));
  s.path([[12, -6.2], [12, -1.5]]); s.path([[-43, -6.2], [-43, -1.5]]); s.path([[46, -6.2], [46, -1.5]]); s.path([[-110, -6.2], [-110, -1.5]]);
  for (let x = -100; x <= 100; x += 12) { if (x > -22 && x < 8) continue; s.spot('stand', x + r.f(-1, 1), 0, TG + 0.9, PI, { tags: ['watch'] }); }
  s.spot('work', -60, 0, -3.5, PI / 2, { tags: ['sweep'] }); s.spot('work', 70, 0, -9, -PI / 2, { tags: ['sweep'] });
  s.spot('work', 30, 0, -1.8, PI / 2, { tags: ['porter'] }); s.spot('work', -84, 0, -2.0, -PI / 2, { tags: ['porter'] });
  for (const x of [-30, 24, 90]) { s.spot('chat', x, 0, -3.0, 0.4, { tags: ['crew'] }); s.spot('chat', x + 0.9, 0, -3.2, -2.4, { tags: ['crew'] }); }
}
function upperWall(s, a, b) {
  const g = s.g;
  g.mat('panel', PAL.teal); g.box(a, TR, TG - 0.12, b, H, TG + 0.02, { faces: 'Z' });
  g.mat('paint', PAL.ochre); g.box(a, TR + 0.32, TG + 0.02, b, TR + 0.42, TG + 0.035, { faces: 'ZyY' });
  g.mat('paint', PAL.cream); g.box(a, H - 1.4, TG + 0.02, b, H - 1.32, TG + 0.03, { faces: 'ZyY' });
  s.flush({ tier: 's' });
  s.solid(a, TR, TG - 0.12, b, H, TG + 0.02);
}

// ---------------------------------------------------------------------------------------------------------------
// The loop tubes: two one-way tubes, 6 m wide and 3.2 m tall, behind the glass wall, with guide rails and ring lamps.
// ---------------------------------------------------------------------------------------------------------------
function tubes(game, s) {
  const g = s.g;
  runX(-XE, XE, 16, (a, b) => {
    // the plinth the glass stands on, the tubes' floor and far wall, the guide rails
    g.mat('paint', PAL.tealDark); g.box(a, 0, TG - 0.2, b, TY, TG + 0.05, { faces: 'ZY' });
    g.mat('concrete', '#3b3f3c'); g.box(a, TY - 0.02, TZ, b, TY, TG, { faces: 'Y' });
    g.mat('panel', '#46524f'); g.box(a, TY, TZ - 0.2, b, TR, TZ, { faces: 'Z' });
    g.mat('paint', '#2b3331'); g.box(a, TY, TZ, b, TY + 0.6, TZ + 0.02, { faces: 'Z' });
    g.mat('diffuser', '#3fe0d0', { emissive: 2.6 }); g.box(a, 1.35, TZ + 0.02, b, 1.39, TZ + 0.04, { faces: 'Z' }); g.box(a, 2.9, TZ + 0.02, b, 2.93, TZ + 0.04, { faces: 'Z' });
    g.mat('brushed', '#a9b2ae', { rough: -0.2 });
    for (const zc of [-22.9, -16.7]) for (const dz of [-0.55, 0.55]) g.box(a, TY, zc + dz - 0.09, b, TY + 0.05, zc + dz + 0.09, { faces: 'YzZ' });
    // the roof: glass under the Pass, plate everywhere else
    const roof = (x0, x1) => { if (x1 <= x0) return; g.mat('panel', '#3f4a48'); g.box(x0, TR, TZ, x1, TR + 0.3, TG, { faces: 'yZ' }); };
    if (b <= PX0 || a >= PX1) roof(a, b); else { roof(a, PX0); roof(PX1, b); }
    s.flush({ tier: 's' });
    // ring lamps across both tubes every 8 m (light from fittings only; the tubes' glow is an ambient)
    g.mat('diffuser', '#e0fff6', { emissive: 7 });
    for (let x = Math.ceil(a / 8) * 8 + 4; x < b; x += 8) { if (x > PX0 - 1 && x < PX1 + 1) continue; g.box(x - 0.08, TR - 0.06, TZ + 0.3, x + 0.08, TR, TD - 0.3, { faces: 'y' }); g.box(x - 0.08, TR - 0.06, TD + 0.3, x + 0.08, TR, TG - 0.3, { faces: 'y' }); }
    s.flush({ tier: 's' });
  });
  s.solid(-XE, 0, TG - 0.12, XE, TR, TG + 0.05);
  // the glass wall and the glass divider between the tubes, with their posts
  for (let x = -XE; x < XE; x += 8) {
    s.glass(x, TY, TG, x + 8, TR, TG, { tint: '#a8cfc6', opacity: 0.05, rough: 0.3 });
  }
  runX(-XE, XE, 16, (a, b) => {
    g.mat('cast', '#3a4442', { rough: -0.1 });
    for (let x = Math.ceil(a / 4) * 4; x < b; x += 4) {
      if (x > -2 && x < 7.4 && x % 8 !== 0) continue;
      g.box(x - 0.06, TY, TG - 0.06, x + 0.06, TR, TG + 0.06, { faces: 'xXzZ' });
      if (x % 8 === 0) g.box(x - 0.05, TY, TD - 0.05, x + 0.05, TR, TD + 0.05, { faces: 'xXzZ' });
    }
    g.mat('cast', PAL.brass, { rough: -0.15 }); g.box(a, TR - 0.08, TG - 0.02, b, TR, TG + 0.1, { faces: 'ZyY' }); g.box(a, TY, TG, b, TY + 0.06, TG + 0.1, { faces: 'ZY' });
    s.flush({ tier: 's' });
  });
  s.ambient({ box: [-XE, TY, TZ, XE, TR, TG], sky: '#8fd0c4', ground: '#3d4a46', power: 0.1, soft: 0.4 });
  // the far tube's hum at a few places near the rooms, and the near tube's
  for (const x of [-110, -40, 20, 70]) s.loop('cab-hum', x, 1.6, -18, { vol: 0.34, radius: 34 });
  s.loop('air', 12, 5, -6, { vol: 0.2, radius: 60 });
  // the hall ends: the tubes go on into the interchange's dark
  g.mat('plain', '#07090a'); for (const sx of [-1, 1]) g.box(sx * XE - 0.1, TY, TZ, sx * XE + 0.1, TR, TG); s.flush({ tier: 's' });
}

// ---------------------------------------------------------------------------------------------------------------
// The cross-line: two one-way tubes along z on the upper level, in a glass trough over the hall, x[CX0, CX1].
// ---------------------------------------------------------------------------------------------------------------
function crossLine(game, s) {
  const g = s.g, Y0 = 3.9, Y1 = 4.2, Y2 = 7.35, mid = (CX0 + CX1) / 2;
  // the steel trough under it, deep beams, hangers from the ceiling over the walk
  g.mat('cast', '#3d4440', { rough: -0.05 }); g.box(CX0 - 0.3, Y0, TZ, CX1 + 0.3, Y1, 0, { faces: 'xXyY' });
  g.mat('paint', PAL.oxide); g.box(CX0 - 0.32, Y0 - 0.5, TG, CX0 - 0.1, Y1, 0); g.box(CX1 + 0.1, Y0 - 0.5, TG, CX1 + 0.32, Y1, 0);
  g.mat('paint', PAL.ochre); for (let z = TG + 1; z < 0; z += 2.4) { g.box(CX0 - 0.33, Y0 - 0.48, z, CX0 - 0.32, Y0 - 0.3, z + 1.2, { faces: 'x' }); g.box(CX1 + 0.32, Y0 - 0.48, z, CX1 + 0.33, Y0 - 0.3, z + 1.2, { faces: 'X' }); }
  s.flush({ tier: 's' });
  g.mat('concrete', '#3b3f3c'); g.box(CX0, Y1, TZ, CX1, Y1 + 0.02, 0, { faces: 'Y' });
  g.mat('brushed', '#a9b2ae'); for (const xc of [CX0 + 2.65, CX1 - 2.65]) for (const dx of [-0.55, 0.55]) g.box(xc + dx - 0.09, Y1, TZ, xc + dx + 0.09, Y1 + 0.05, 0, { faces: 'YxX' });
  g.mat('cast', '#3a4442'); for (let z = TZ; z <= 0; z += 3.2) for (const x of [CX0, mid, CX1]) g.box(x - 0.06, Y1, z - 0.06, x + 0.06, Y2, z + 0.06);
  g.mat('diffuser', '#e0fff6', { emissive: 7 }); for (let z = TZ + 1.6; z < 0; z += 4) g.box(CX0 + 0.3, Y2 - 0.05, z - 0.08, CX1 - 0.3, Y2, z + 0.08, { faces: 'y' });
  g.mat('panel', '#3f4a48'); g.box(CX0 - 0.3, Y2, TZ, CX1 + 0.3, H, 0, { faces: 'y' });
  s.flush({ tier: 's' });
  // glass on both sides and down the middle
  for (let z = TZ; z < 0; z += 6.5) { const z1 = Math.min(0, z + 6.5); s.glass(CX0, Y1, z, CX0, Y2, z1, { tint: '#a8cfc6', opacity: 0.05, rough: 0.3 }); s.glass(CX1, Y1, z, CX1, Y2, z1, { tint: '#a8cfc6', opacity: 0.05, rough: 0.3 }); s.glass(mid, Y1, z, mid, Y2, z1, { tint: '#a8cfc6', opacity: 0.04, rough: 0.3 }); }
  // the portals where it goes into the walls
  g.mat('plain', '#07090a'); g.box(CX0, Y1, 0.1, CX1, Y2, 0.3); g.box(CX0, Y1, TZ - 0.3, CX1, Y2, TZ - 0.1); s.flush({ tier: 's' });
  wall(s, CX0 - 0.3, TZ, CX0 - 0.3, TG, TR + 0.3, H - TR - 0.3, { tint: '#2b3331', skirt: false });
  g.mat('panel', PAL.tealDark); g.box(CX0 - 0.3, TR + 0.3, TZ - 0.3, PX1, H, TZ - 0.12, { faces: 'Z' }); s.flush({ tier: 's' });
  s.ambient({ box: [CX0, Y1, TZ, CX1, Y2, 0], sky: '#8fd0c4', ground: '#3d4a46', power: 0.1, soft: 0.3 });
  sign(s, { kind: 'street', text: 'Cross-line 38 · 77', sub: 'front · back · thirty metres a second', palette: ['#1d3b39', '#f1ead8'] }, CX0 - 0.35, Y0 - 0.25, -6.8, { face: 'x', w: 3.0, h: 0.4, glow: 0.9 });
  s.loop('cab-hum', mid, 5.6, -7, { vol: 0.28, radius: 22 });
}

// ---------------------------------------------------------------------------------------------------------------
// The Pass: up a stair from the hall to the upper level. A grille floor over the loops, glass onto the cross-line.
// ---------------------------------------------------------------------------------------------------------------
function pass(game, s) {
  const g = s.g, Y = 4, clip = [PX0 - 0.6, Y - 0.6, TZ - 0.1, PX1 + 0.1, H + 0.1, -11.3];
  // the stair along the glass, climbing anti, with a glass balustrade
  stairs(s, 7.2, 0, -12.45, 'x', Y, 7.0, 1.5, { tint: '#8a877d', nosing: PAL.ochre });
  g.mat('cast', PAL.steel); g.box(0.2, 0, -11.66, 7.2, 0.25, -11.58);
  g.tube([[7.2, 1.05, -11.62], [0.2, Y + 1.05, -11.62]], 0.03, { segs: 6 }); g.mat('wood', '#7a5233'); g.tube([[7.2, 1.08, -11.62], [0.2, Y + 1.08, -11.62]], 0.034, { segs: 8 });
  g.mat('cast', PAL.steel); for (let x = 0.2; x <= 7.2; x += 1.4) { const yb = Y * (7.2 - x) / 7.0; g.tube([[x, Math.max(0, yb), -11.62], [x, yb + 1.05, -11.62]], 0.02, { segs: 5 }); }
  s.flush({ tier: 's' });
  g.mat('paint', '#5a5e5c'); g.prism([[0.2, -11.7], [7.2, -11.7], [7.2, -11.55], [0.2, -11.55]], 0, 0.25); s.flush({ tier: 's' });
  g.mat('grille', '#3d4440'); for (let i = 0; i < 5; i++) { const xa = 0.2 + i * 1.4, xb = xa + 1.4, ya = Y * (7.2 - xb) / 7.0; g.box(xa, Math.max(0.25, ya + 0.1), -11.63, xb, ya + 1.0, -11.61, { faces: 'zZ' }); } s.flush({ tier: 'd' });
  s.solid(0.2, 0, -11.7, 6.9, 5.2, -11.5);
  for (let i = 0; i < 6; i++) { const xa = 0.2 + i, top = Y * (7.2 - (xa + 1)) / 7.0 - 0.3; if (top > 0.3) s.solid(xa, 0, -13.2, xa + 1, top, -11.7); }
  // the floor: grille over the tubes, deck plate over the hall, a steel frame under it all
  floor(s, PX0, TZ, PX1, TG, Y, 'grille', '#5a6260');
  floor(s, PX0, TG, PX1, -11.4, Y, 'deckplate', '#7a7c76');
  g.mat('cast', '#3d4440'); g.box(PX0, Y - 0.22, TG, PX1, Y - 0.02, -11.4, { faces: 'yzZxX' });
  for (let z = TZ + 1.5; z < TG; z += 1.5) g.box(PX0, Y - 0.2, z - 0.05, PX1, Y - 0.02, z + 0.05, { faces: 'yzZ' });
  for (const x of [PX0 + 0.1, (PX0 + PX1) / 2, PX1 - 0.1]) g.box(x - 0.06, Y - 0.2, TZ, x + 0.06, Y - 0.02, TG, { faces: 'yxX' });
  s.flush({ tier: 's' });
  // the tubes' glass roof under the grille
  s.glass(PX0, TR + 0.1, TZ, PX1, TR + 0.1, TG, { opacity: 0.1 });
  // walls: the far wall, the spinward wall, a glass wall onto the cross-line, the ceiling
  wall(s, PX0, TZ + 0.08, PX1, TZ + 0.08, Y, H - Y, { tint: '#cfc6b4', dado: { h: 1.0, mat: 'panel', tint: PAL.teal }, skirt: '#3a3430' });
  wall(s, PX1 - 0.08, TZ, PX1 - 0.08, TG, Y, H - Y, { tint: '#cfc6b4', dado: { h: 1.0, mat: 'panel', tint: PAL.teal }, skirt: '#3a3430' });
  for (let z = TZ; z < -11.4; z += 2.9) s.glass(PX0, Y + 0.12, z, PX0, H - 0.25, Math.min(-11.4, z + 2.9), { opacity: 0.09 });
  g.mat('cast', '#3a4442'); for (let z = TZ; z <= -11.4; z += 2.9) g.box(PX0 - 0.6, Y, z - 0.06, PX0 + 0.06, H, z + 0.06);
  g.box(PX0 - 0.8, Y - 0.1, TZ, PX0, Y + 0.12, -11.4); g.box(PX0 - 0.8, H - 0.25, TZ, PX0, H, -11.4);
  s.flush({ tier: 's' }); s.solid(PX0 - 0.05, Y, TZ, PX0 + 0.05, H, -11.4);
  ceiling(s, PX0, TZ, PX1, TG, H, 'concrete', '#9a978a');
  // the balcony rail over the hall
  railing(s, [[PX0, -11.45], [PX1 - 0.05, -11.45]], Y, { tint: PAL.steel, glass: true });
  // benches facing the cross-line, a plate, two low lamps (the cabs give the rest)
  for (const z of [-17.2, -22.6]) { prop(s, 'bench', PX0 + 1.6, Y, z, -PI / 2, { w: 2.4, back: true, wood: '#7a5233', metal: PAL.tealDark }); seat(s, PX0 + 1.6, Y, z, -PI / 2, 'Sit and watch the lines cross', { radius: 1.2, onSit: (gm) => passSit(gm) }); }
  for (const z of [-15, -20, -24.8]) lamp(s, 'sconce', PX1 - 0.2, Y + 2.3, z, { face: 'x', K: 2700, power: 0.5, clip });
  roomGlow(s, PX0, Y, TZ, PX1, H, TG, { sky: '#cfe0dc', ground: '#4d5653', power: 0.12 });
  sign(s, { kind: 'plate', text: 'THE PASS', lines: ['where the loops go under', 'and the cross-line goes by'] }, PX1 - 0.12, Y + 1.5, -18.2, { face: 'x', w: 0.62, h: 0.36 });
  s.interact({ x: PX0 + 0.6, y: Y + 1.4, z: -19.8, radius: 1.6, prompt: 'Watch the lines cross', onUse: async (gm) => {
    await read(gm, 'The Pass', ['Under your feet, through the grille and the glass roof, the loops: anti nearest at thirty metres a second, spinward behind at twenty. In front of you the cross-line, going front and back at thirty, and its weight never changes, because along the axis nothing does.',
      'Loops run on one level and cross-lines on the other, so they never meet on the flat. Every lift core in Chervil sits on a crossing like this one: about 5,200 of them on every line deck.',
      'Where a cab has to turn from one to the other it slows to ten metres a second on a seventy-metre curve. About twenty seconds a turn. You can feel it in a cab, a long lean, if you know to wait for it.']);
    gm.flags['line.pass'] = true;
  } });
  s.zoneBox({ id: 'line-pass', place: 'line-works', box: [PX0 - 0.1, Y - 0.4, TZ, PX1, H, -11.4], name: 'The Pass', sub: 'the upper level · ' + SUB, ambience: 'station', reverb: 'ring', headroom: H - Y });
  for (const z of [-14.5, -19.6, -24.2]) s.spot('stand', PX0 + 0.55, Y, z, -PI / 2, { tags: ['watch'] });
  s.spot('stand', -3.6, Y, -12.2, PI, { tags: ['watch'] });
  s.path([[7.8, -12.45], [0.2, -12.45], [-3.5, -12.6], [-4, -19.8], [-4, -24.5]], { y: Y });
}
function passSit(gm) { if (!gm.flags['line.pass.sat']) { gm.flags['line.pass.sat'] = true; toast(gm, 'A platoon of four goes under your feet and the grille hums for a moment after.'); } }

// ---------------------------------------------------------------------------------------------------------------
// The lobby's own reads: a board of numbers and why nobody lives here.
// ---------------------------------------------------------------------------------------------------------------
function lobbyReads(game, s) {
  s.interact({ x: 19.2, y: 1.5, z: 5.6, radius: 1.5, prompt: 'Read the Lattice board', onUse: async (gm) => {
    await read(gm, 'The Lattice', ['About 5,200 lift cores, one every hundred metres or so, each running through all 376 decks with ten channels: two express and three collectors each way. Four berths in every lobby, about a hundred people to a lobby on each deck.',
      'On every line deck, 74 loops go round the drum and 141 cross-lines go along it. The tubes take about a third of the deck. The rest is depots, workshops and freight sorting.',
      'Door to door anywhere in Chervil: six minutes on average, about twelve at the very worst.']);
  } });
  sign(s, { kind: 'notice', title: 'Nobody lives here', lines: ['A line deck is two decks deep and full of tubes.', 'No flat in Chervil is more than twelve decks from one.', 'The tubes hold helium, not air.', 'Crews wear masks when the tubes are opened.', 'Lamps here keep the crews\' hours, not the sunline\'s.'] }, 4.1, 1.55, 6.6, { face: 'X', w: 0.7, h: 0.95 });
  s.interact({ x: 4.8, y: 1.5, z: 6.6, radius: 1.2, prompt: 'Read the notice', onUse: async (gm) => {
    await read(gm, 'Nobody lives here', ['A line deck is two decks deep and mostly tube. The loops, the cross-lines, the berths and the depots leave no room for anybody\'s table.', 'No flat in Chervil is more than twelve decks from one, so the cabs that serve you are never far from their beds.', 'The tubes hold pure helium: less drag, and nothing can burn in it. Nobody can breathe it either, so the crews wear masks whenever a tube is opened.']);
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// The Cab Kitchen: x[26, 80], z[0, 34]
// ---------------------------------------------------------------------------------------------------------------
defineProp('lmline.cart', (g, p) => {
  g.mat('paint', '#2c5a56'); g.box(-0.9, 0.22, -0.45, 0.9, 0.3, 0.45, { bevel: 0.015 });
  g.mat('cast', '#3a3430'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.cyl(sx * 0.7, 0, sz * 0.36, 0.09, 0.2, { segs: 10 });
  g.mat('cast', '#b08a45'); g.tube([[-0.9, 0.3, -0.42], [-1.0, 1.0, -0.42], [-1.0, 1.0, 0.42], [-0.9, 0.3, 0.42]], 0.018, { segs: 5 });
  if (p.load === 1) { for (let i = 0; i < 3; i++) { g.mat('felt', ['#8a7a5c', '#5a2f3a', '#2c5a56'][i]); g.push(); g.move(0, 0.47, -0.28 + i * 0.28); g.rotZ(PI / 2); g.cyl(0, -0.6, 0, 0.15, 1.2, { segs: 10 }); g.pop(); } }
  else if (p.load === 2) { g.mat('wood', '#b08d5e'); g.box(-0.8, 0.3, -0.4, 0.2, 0.7, 0.4, { bevel: 0.01 }); g.mat('cast', '#b08a45'); g.box(0.3, 0.3, -0.3, 0.8, 0.5, 0.3, { bevel: 0.01 }); }
  else { g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(-0.75, 0.3, -0.35, 0.75, 0.36, 0.35); g.box(-0.7, 0.36, -0.3, 0.7, 0.4, 0.3); }
  return { solid: [[-1.0, 0, -0.45, 0.9, 1.0, 0.45]], tier: 'd' };
});
defineProp('lmline.maskrack', (g) => {
  g.mat('wood', '#5b3a26'); g.box(-0.7, 1.1, 0.0, 0.7, 1.9, 0.05, { bevel: 0.01 });
  for (let i = 0; i < 5; i++) {
    const x = -0.56 + i * 0.28; g.mat('cast', '#3a3430'); g.tube([[x, 1.75, 0.05], [x, 1.75, 0.14]], 0.012, { segs: 4 });
    g.mat('paint', ['#d9a23a', '#2c5a56', '#b0502c', '#e2d6bc', '#5b4060'][i]); g.ball(x, 1.58, 0.15, 0.1, 0.12, 0.07, { segs: 8, rings: 5 });
    g.mat('plain', '#1d2426'); g.box(x - 0.07, 1.6, 0.21, x + 0.07, 1.66, 0.225);
    g.mat('weave', '#3a3430'); g.tube([[x, 1.48, 0.17], [x + 0.02, 1.3, 0.12], [x + 0.06, 1.2, 0.08]], 0.014, { segs: 4 });
  }
  return { tier: 'd' };
});
defineProp('lmline.doorgear', (g, p) => {
  // a berth door's gear on a backing board: two leaves on a runner, the motor box, the seal
  g.mat('wood', '#4a3a2a'); g.box(-0.62, -0.55, 0, 0.62, 0.55, 0.04, { bevel: 0.008 });
  g.mat('brushed', '#9aa3a0', { rough: -0.2 }); g.tube([[-0.55, 0.42, 0.08], [0.55, 0.42, 0.08]], 0.02, { segs: 6 });
  g.mat('cast', p.brass || '#b08a45', { rough: -0.1 }); g.box(-0.5, -0.38, 0.06, -0.03, 0.36, 0.09, { bevel: 0.006 }); g.box(0.03, -0.38, 0.06, 0.5, 0.36, 0.09, { bevel: 0.006 });
  g.mat('cast', '#8a6d3b'); g.box(-0.46, -0.04, 0.09, -0.07, -0.02, 0.095); g.box(0.07, -0.04, 0.09, 0.46, -0.02, 0.095);
  g.mat('paint', p.motor || '#2c5a56'); g.box(-0.58, 0.44, 0.04, -0.3, 0.53, 0.16, { bevel: 0.01 });
  g.mat('plain', '#1d1b18'); g.box(-0.5, -0.4, 0.088, 0.5, -0.38, 0.1);
  g.mat('paper', '#efe6d2'); g.box(0.3, -0.52, 0.04, 0.5, -0.42, 0.045);
  return { tier: 'd', cast: false };
});

function kitchen(game, s) {
  const g = s.g, r = new Rng(3801), X0 = 26, X1 = 80, Z1 = 34;
  const clip = [X0, -0.5, -0.5, X1, H + 0.1, Z1];
  floor(s, X0, 0, X1, Z1, 0, 'deckplate', '#7b7c74');
  g.mat('paint', PAL.ochre); for (const z of [5, 17, 20]) g.box(X0 + 1, 0, z, X1 - 1, 0.006, z + 0.12, { faces: 'Y' });
  for (const x of [29, 45, 63]) g.box(x, 0, 5, x + 0.12, 0.006, 17, { faces: 'Y' });
  s.flush({ tier: 's', cast: false });
  ceiling(s, X0, 0, X1, Z1, H, 'concrete', '#a39f92');
  const wt = { tint: '#cdb07a', dado: { h: 2.4, mat: 'block', tint: '#2c5a56' }, skirt: '#3a3430' };
  wall(s, X0 + 0.08, 0, X0 + 0.08, Z1, 0, H, wt); wall(s, X1 - 0.08, 0, X1 - 0.08, Z1, 0, H, wt); wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, wt);
  // beams and the gantry crane's rails, with its bridge over the hoist
  g.mat('cast', '#5a5e5c'); for (let x = X0 + 6; x < X1; x += 6) g.box(x - 0.15, H - 0.5, 0, x + 0.15, H, Z1, { faces: 'xXy' });
  g.mat('paint', PAL.ochre); for (const z of [3, 27]) g.box(X0, 6.2, z - 0.2, X1, 6.5, z + 0.2, { bevel: 0.02 });
  g.box(36.4, 6.5, 3, 37.6, 6.85, 27, { bevel: 0.02 });
  g.mat('cast', '#3a3430'); g.box(36.6, 6.0, 10.6, 37.4, 6.5, 11.4, { bevel: 0.03 });
  s.flush({ tier: 's' });
  for (const dx of [-0.25, 0.25]) { g.mat('cast', '#2b2e30'); g.tube([[37 + dx, 6.0, 11], [37 + dx, 4.2, 11]], 0.025, { segs: 5 }); }
  s.flush({ tier: 'd' });
  // lamps: high work panels and a few low lamps over the benches
  for (const x of [33, 46, 59, 72]) for (const z of [9, 24]) lamp(s, 'panel', x, H - 0.55, z, { w: 2.2, d: 0.6, K: 4000, power: 0.8, clip, range: 11, lampFlag: false });
  for (const z of [8, 13.5]) lamp(s, 'globe', 54, 2.4, z, { K: 2900, power: 0.9, clip, drop: 4.6, r: 0.22 });
  roomGlow(s, X0, 0, 0, X1, H, Z1, { sky: '#ffe8c8', ground: '#8a7a5c', power: 0.12 });
  // linings drying on lines across the felt bay
  s.detail(() => {
    const cols = ['#8a7a5c', '#5a2f3a', '#2c5a56', '#d9a23a', '#b0502c', '#c9b48a', '#5b4060'];
    for (const z of [5.6, 10.8, 16]) {
      g.mat('cast', '#3a3430'); g.tube([[46.5, 4.2, z], [62, 4.2, z]], 0.008, { segs: 3 });
      for (let i = 0; i < 5; i++) { const x = 47.5 + i * 2.9 + r.f(-0.3, 0.3), w = r.f(1.1, 1.9), d = r.f(1.0, 1.6); g.mat('felt', cols[r.i(0, cols.length - 1)]); g.sheet([x, 4.2, z], [x + w, 4.2, z], [x + w, 4.2 - d, z + 0.02], [x, 4.2 - d, z + 0.02], { sag: 0.05, nu: 3, nv: 2 }); }
    }
  });

  // ---- bay one: the hoist, a cab shell on it with its near panel off, the panel on a stand
  const HX = 37, HZ = 11, HY = 1.35;
  g.mat('paint', PAL.ochre); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.box(HX + sx * 2.2 - 0.12, 0, HZ + sz * 1.3 - 0.12, HX + sx * 2.2 + 0.12, 2.4, HZ + sz * 1.3 + 0.12, { bevel: 0.015 }); s.post(HX + sx * 2.2, HZ + sz * 1.3, 0.14, 0, 2.4); }
  g.mat('cast', '#3a4442'); g.box(HX - 2.3, HY - 0.12, HZ - 1.25, HX + 2.3, HY, HZ + 1.25, { bevel: 0.02 }); for (const sz of [-1, 1]) g.box(HX - 2.3, HY - 0.3, HZ + sz * 1.0 - 0.1, HX + 2.3, HY - 0.12, HZ + sz * 1.0 + 0.1);
  s.flush({ tier: 's', cast: true });
  s.solid(HX - 2.3, 0, HZ - 1.25, HX + 2.3, HY, HZ + 1.25);
  prop(s, 'lmline.cab', HX, HY, HZ, 0, { open: true, body: '#d9cba8', band: PAL.teal, lamp: 0 });
  g.mat('cast', '#3a3430'); g.box(HX - 1.2, 0, HZ - 3.2, HX + 1.2, 0.08, HZ - 2.6); g.tube([[HX - 1.1, 0.08, HZ - 2.9], [HX - 1.1, 1.9, HZ - 2.7]], 0.02, { segs: 5 }); g.tube([[HX + 1.1, 0.08, HZ - 2.9], [HX + 1.1, 1.9, HZ - 2.7]], 0.02, { segs: 5 });
  g.mat('paint', '#d9cba8', { rough: -0.25 }); g.box(HX - 1.6, 0.4, HZ - 2.75, HX + 1.6, 2.0, HZ - 2.65, { bevel: 0.03 });
  g.mat('paint', PAL.teal); g.box(HX - 1.6, 1.12, HZ - 2.77, HX + 1.6, 1.24, HZ - 2.75);
  g.mat('cast', PAL.brass); g.box(HX - 0.4, 0.5, HZ - 2.79, HX + 0.4, 0.62, HZ - 2.77);
  s.flush({ tier: 'd', cast: true }); s.solid(HX - 1.6, 0, HZ - 3.2, HX + 1.6, 2.0, HZ - 2.6);
  prop(s, 'lmline.cart', HX + 3.6, 0, HZ - 2.4, 0.2, { load: 2 });
  prop(s, 'crate', HX - 3.4, 0, HZ + 2.6, 0.1, { w: 0.7, h: 0.5, d: 0.5 });
  s.spot('work', HX - 0.6, 0, HZ - 1.9, 0, { tags: ['mend'] }); s.spot('work', HX + 2.8, 0, HZ + 0.2, -PI / 2, { tags: ['tune'] });
  s.interact({ x: HX, y: 1.5, z: HZ - 2.2, radius: 2.4, prompt: 'Look at the cab on the hoist', onUse: async (gm) => {
    await read(gm, 'The hoist', ['A cab with its near panel off, up on the hoist at a working height. Inside: two wooden benches, a felt lining the colour of strong tea, brass rails, the cabin\'s gimbal ring behind the floor.',
      'It weighs about 300 kilograms empty. It has no ropes, wheels or engine: the tube moves it, with linear motors, and magnets keep it off the walls. What wears is the felt, the seals, the door gear and the benches, and all of those are mended here.',
      'A new cab would be about 7,500 kWh: three hundred kilograms of new mass at twenty-five a kilogram. This one is older than anybody on the crew, and it will be out again by lamp-dawn.']);
  } });

  // ---- bay two: the felt benches, linings being cut and stitched, a cab bench being re-covered, carving
  for (const bz of [8, 13.5]) {
    prop(s, 'table', 54, 0, bz, 0, { w: 4.2, d: 1.2, h: 0.86, wood: '#6f4e33', top: '#8a6240', legs: 'trestle' });
    s.detail(() => {
      const cols = ['#8a7a5c', '#5a2f3a', '#2c5a56', '#7a5233', '#b0502c', '#d9a23a'];
      g.mat('felt', cols[r.i(0, 5)]); g.box(52.2, 0.86, bz - 0.45, 54.8, 0.88, bz + 0.4);
      g.mat('felt', cols[r.i(0, 5)]); g.box(54.9, 0.86, bz - 0.3, 55.9, 0.875, bz + 0.45);
      g.mat('cast', '#9aa3a0'); g.box(53.2, 0.88, bz + 0.1, 53.5, 0.9, bz + 0.13);
      for (let i = 0; i < 4; i++) { g.mat('weave', ['#d9a23a', '#3fe0d0', '#b0502c', '#e2d6bc'][i]); g.cyl(55.6 + i * 0.12, 0.86, bz - 0.4, 0.03, 0.07, { segs: 8 }); }
    });
    s.spot('work', 54, 0, bz + 0.95, PI, { tags: ['mend'] }); s.spot('work', 52.6, 0, bz - 0.9, 0, { tags: ['mend'] });
  }
  // rolls of felt stood on end in a rack against the front of the bay
  g.mat('cast', '#3a3430'); g.box(48, 0, 1.7, 60, 0.08, 3.1); g.box(48, 1.1, 1.7, 60, 1.16, 1.78); g.box(48, 1.1, 3.02, 60, 1.16, 3.1); s.flush({ tier: 's' });
  { const cols = ['#8a7a5c', '#5a2f3a', '#2c5a56', '#7a5233', '#8a2f3c', '#d9a23a', '#c9b48a', '#3a4a6a'];
    s.detail(() => { for (let i = 0; i < 24; i++) { g.mat('felt', cols[(i * 5) % cols.length]); g.cyl(48.3 + i * 0.48, 0.08, 2.4 + ((i % 2) ? 0.2 : -0.2), 0.17, r.f(1.3, 1.6), { segs: 10 }); } });
    s.solid(48, 0, 1.7, 60, 1.6, 3.1); }
  // a cab bench on trestles, its seat stripped, new slats being carved
  prop(s, 'table', 60, 0, 12.0, PI / 2, { w: 1.8, d: 0.7, h: 0.8, wood: '#5b3a26', legs: 'trestle' });
  s.detail(() => {
    g.mat('wood', '#c9a46a'); for (let i = 0; i < 4; i++) g.box(59.8 - 0.25, 0.8, 11.3 + i * 0.4, 60.2 + 0.25, 0.83, 11.6 + i * 0.4, { bevel: 0.005 });
    g.mat('wood', '#e0c48a'); for (let i = 0; i < 9; i++) g.box(60.6 + r.f(-0.3, 0.3), 0.002, 11 + r.f(0, 2.5), 60.64 + r.f(-0.3, 0.3), 0.012, 11.1 + r.f(0, 2.5));
  });
  s.spot('work', 61, 0, 12.0, -PI / 2, { tags: ['carve'] });
  s.interact({ x: 54, y: 1.1, z: 10.8, radius: 2.2, prompt: 'Watch the felt being cut', onUse: async (gm) => {
    const lines = [['The felt comes out of a cab in one piece and goes back in four, with the old seams kept where they still hold. The new piece is always a slightly different colour. Nobody tries to match it.'],
      ['Every cab is re-felted about every eleven years. Heliox makes a bare room ring, and a cab is a small room, so the felt is not for comfort. It is so you can hear the person next to you.'],
      ['Someone has stitched a line of bright yellow thread along a mend, a hand long. A name in small letters at the end of it: whoever did the last lining, forty years ago.']];
    await read(gm, 'The felt benches', lines[(gm.flags['line.felt'] = ((gm.flags['line.felt'] || 0) + 1)) % lines.length]);
  } });

  // ---- bay three: the test berth. A berth door in a short wall, a cab docked behind it, the pressure board
  const TX = 71, TZ1 = 16;
  wall(s, 65, TZ1, 77, TZ1, 0, 3.4, { tint: '#bdb5a2', dado: { h: 1.1, mat: 'tile', tint: PAL.teal }, openings: [{ at: 5.3, w: 1.4, h: 2.36 }] });
  g.mat('stone', '#9c8f7c'); g.box(TX - 0.9, 0, TZ1 - 0.2, TX + 0.9, 2.62, TZ1 - 0.08, { faces: 'xXzY' });
  g.mat('cast', PAL.brass, { rough: -0.1 }); g.box(TX - 1.32, 0.02, TZ1 - 0.12, TX - 0.7, 2.36, TZ1 - 0.09); g.box(TX + 0.7, 0.02, TZ1 - 0.12, TX + 1.32, 2.36, TZ1 - 0.09);
  s.flush({ tier: 's' });
  prop(s, 'lmline.cab', TX, 0, TZ1 + 1.3, 0, { body: '#e8dcc4', band: '#d98a3a', lit: 1.4, lamp: 0 });
  s.solid(TX - 0.7, 0, TZ1 - 0.05, TX + 0.7, 2.36, TZ1 + 0.1);
  // the pressure board: three dials and a lamp that goes green when the seal holds
  g.mat('wood', '#3a2d22'); g.box(74.0, 1.0, TZ1 - 0.12, 76.4, 2.2, TZ1 - 0.08, { bevel: 0.01 });
  for (let i = 0; i < 3; i++) { g.push(); g.move(74.45 + i * 0.75, 1.6, TZ1 - 0.14); g.rotX(PI / 2); g.mat('paint', '#efe6d2', { emissive: 0.7 }); g.cyl(0, 0, 0, 0.26, 0.03, { segs: 18 }); g.mat('cast', PAL.brass); g.cyl(0, -0.01, 0, 0.29, 0.02, { segs: 18 }); g.pop(); g.mat('plain', '#1d1b18'); g.box(74.45 + i * 0.75 - 0.01, 1.6, TZ1 - 0.18, 74.45 + i * 0.75 + 0.01, 1.82, TZ1 - 0.17); }
  g.mat('diffuser', '#8fd694', { emissive: 4 }); g.ball(75.2, 2.0, TZ1 - 0.14, 0.06, 0.06, 0.04, { segs: 8, rings: 5 });
  s.flush({ tier: 'd' });
  sign(s, { kind: 'plate', text: 'TEST BERTH', lines: ['seal · pressure · gimbal', 'nothing leaves untested'] }, 72.6, 2.85, TZ1 - 0.1, { face: 'z', w: 0.7, h: 0.32 });
  s.spot('work', 75.2, 0, TZ1 - 0.8, 0, { tags: ['tune'] }); s.spot('work', 69.0, 0, TZ1 - 0.9, 0.3, { tags: ['tune'] });
  s.interact({ x: TX, y: 1.2, z: TZ1 - 0.9, radius: 2.2, prompt: 'Watch the seal test', onUse: async (gm) => {
    sfx(gm, 'berth-door', s.frame, TX, 1.2, TZ1);
    await read(gm, 'The test berth', ['The berth doors close on the cab\'s doors and the needles climb a little and stop. The lamp goes green. Somebody chalks a tick on the cab\'s skirt.',
      'A cab carries its own air: heliox for six, about an hour of it before the CO2 builds up, with scrubbers and an oxygen hood under each bench. The tubes outside hold helium, which nobody can breathe, so the seal is the whole point.',
      'Then the gimbal: the cabin is tipped on its ring to see that it leans three-quarters of the way against a climb\'s push, and no further. Going all the way makes more riders sick.']);
  } });

  // ---- the back wall: the wall of door gear, three rows, every unit tagged
  for (let row = 0; row < 3; row++) for (let i = 0; i < 26; i++) {
    const x = 30.5 + i * 1.62; if (x > 76.5) continue;
    prop(s, 'lmline.doorgear', x, 1.1 + row * 1.3, Z1 - 0.13, PI, { brass: row === 1 && i % 5 === 2 ? '#d4b06a' : '#b08a45', motor: ['#2c5a56', '#b0502c', '#5b4060'][(i + row) % 3] }, { noCollide: true });
  }
  sign(s, { kind: 'street', text: 'Door gear', sub: 'one set from every berth on the deck, in turn', palette: ['#1d3b39', '#f1ead8'] }, 53.5, 5.2, Z1 - 0.12, { face: 'z', w: 4.4, h: 0.5 });
  s.interact({ x: 53.5, y: 1.5, z: Z1 - 1.0, radius: 3.0, prompt: 'Look at the wall of door gear', onUse: async (gm) => {
    await read(gm, 'The door gear', ['Seventy-odd sets of berth door gear, each on a board with a paper tag: the core, the deck, the berth, the date it came in. The cabs\' own doors seal against these, so a worn runner anywhere means a sticky door everywhere.',
      'One set is newer brass than the rest. Its tag says: Deck 112, berth 3. Replaced, not mended: bent by a pram that would not wait.']);
  } });
  s.spot('work', 40, 0, Z1 - 0.9, 0, { tags: ['tune'] }); s.spot('work', 66, 0, Z1 - 0.9, 0, { tags: ['mend'] });
  // the anti wall: a tool board, shelving with parts
  g.mat('wood', '#6b4a2f'); g.box(X0 + 0.16, 1.0, 20, X0 + 0.2, 2.6, 26, { bevel: 0.01 }); s.flush({ tier: 's' });
  s.detail(() => { for (let i = 0; i < 14; i++) { const z = 20.3 + i * 0.4, y = 1.3 + (i % 3) * 0.45; g.mat(i % 4 === 0 ? 'paint' : 'cast', ['#b0502c', '#3a3430', '#9aa3a0', '#b08a45'][i % 4]); g.box(X0 + 0.2, y, z - 0.03, X0 + 0.24, y + 0.32 + (i % 2) * 0.2, z + 0.03); } });
  for (const z of [7, 9.6, 12.2]) { prop(s, 'shelving', X0 + 0.35, 0, z, PI / 2, { w: 2.4, h: 2.4, shelves: 4, wood: '#5b3a26' }); s.detail(() => { for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) { g.mat('wood', ['#b08d5e', '#9a7a4e', '#2c5a56', '#b0502c'][(k + i) % 4]); g.box(X0 + 0.22, 0.12 + k * 0.57, z - 1.0 + i * 0.5, X0 + 0.48, 0.38 + k * 0.57, z - 0.62 + i * 0.5, { bevel: 0.01 }); } }); }
  // the spinward wall: the day's chalk board, and the crews' tea corner
  sign(s, { kind: 'chalk', title: 'In for mending', lines: ['Cabs in today: 41', 'Out by lamp-dawn: 38', 'Felt: 6 · seals: 19', 'Gimbals: 4 · doors: 12', 'Masks back on the rack'] }, X1 - 0.1, 1.8, 24.5, { face: 'x', w: 1.4, h: 1.1 });
  prop(s, 'table', 76.5, 0, 28.5, 0, { round: true, w: 0.9, h: 0.74, wood: '#4a3a2a', top: '#7a5233' });
  for (const a of [0.3, 2.3, 4.3]) prop(s, 'stool', 76.5 + Math.sin(a) * 0.75, 0, 28.5 + Math.cos(a) * 0.75, a + PI, { h: 0.5 });
  s.detail(() => {
    g.mat('cast', '#b08a45', { rough: -0.1 }); g.lathe(78.9, 30.5, [[0, 0.9], [0.18, 0.9], [0.2, 1.3], [0.16, 1.42], [0.05, 1.5], [0, 1.52]], { segs: 14 });
    g.mat('cast', '#3a3430'); g.box(78.6, 0, 30.2, 79.2, 0.9, 30.8, { bevel: 0.01 });
  });
  for (const p of [[76.3, 28.4], [76.7, 28.65]]) prop(s, 'cup', p[0], 0.74, p[1], 0, { glaze: '#e9e1cf', lid: '#2c5a56' });
  s.loop('steam', 78.9, 1.4, 30.5, { vol: 0.12, radius: 5 });
  for (const a of [0.3, 2.3, 4.3]) s.spot('sit', 76.5 + Math.sin(a) * 0.75, 0.5, 28.5 + Math.cos(a) * 0.75, a + PI, { tags: ['crew', 'chat'] });
  s.interact({ x: 78.9, y: 1.1, z: 30.0, radius: 1.4, prompt: 'Ask about the masks', onUse: async (gm) => {
    await read(gm, 'A crew lead', ['Masks? Helium. The tubes are full of it, about the same pressure as the air in here, and it is lighter and slipperier than heliox, so a cab drags less. Nothing burns in it, which is the other reason.', 'You cannot breathe it, though, so when we open a tube we wear these, with an hour of good air on the back. You learn to talk with your hands. Half the crew still do it at dinner.']);
  } });
  s.spot('work', 70, 0, 6, PI / 2, { tags: ['sweep'] }); s.spot('work', 42, 0, 22, -PI / 2, { tags: ['porter'] }); s.spot('work', 32, 0, 18, 0, { tags: ['crew'] });
  prop(s, 'lmline.cart', 44, 0, 22.5, 0, { load: 1 }); prop(s, 'lmline.cart', 67, 0, 21.5, 0.15, { load: 0 });
  // cabs waiting their turn, nose to tail on the floor rails, chalked with what each needs
  g.mat('brushed', '#80888a'); for (const dz of [-0.55, 0.55]) g.box(47, 0, 26.5 + dz - 0.09, 62, 0.02, 26.5 + dz + 0.09, { faces: 'Y' }); s.flush({ tier: 's', cast: false });
  [[50, 0], [53.8, 2], [57.6, 4]].forEach((c) => prop(s, 'lmline.cab', c[0], 0, 26.5, 0, { body: LIVERY[c[1]][0], band: LIVERY[c[1]][1], lamp: 0 }));
  ['felt', 'seal · door', 'gimbal'].forEach((t, i) => sign(s, { kind: 'label', text: t, ink: '#f4efe2' }, 50 + i * 3.8, 0.62, 25.52, { face: 'z', w: 0.7, h: 0.16 }));
  sign(s, { kind: 'fascia', text: 'The Cab Kitchen', sub: 'cabs mended · re-felted · resealed', palette: ['#1d3b39', '#f3e6c8', '#d9a23a'], font: 'caps' }, 46, 6.6, -0.12, { face: 'z', w: 6.0, h: 0.8, glow: 0.8 });
  s.zoneBox({ id: 'line-kitchen', place: 'line-works', box: [X0, -0.5, 0, X1, H, Z1], name: 'The Cab Kitchen', sub: SUB, ambience: 'arcade', reverb: 'ring', headroom: H });
  s.loop('platform', 52, 3, 18, { vol: 0.22, radius: 30 });
  s.path([[46, -1.5], [46, 4], [46, 18.5], [36, 18.5], [36, 24], [70, 24], [70, 18.5], [46, 18.5]]);
}

// ---------------------------------------------------------------------------------------------------------------
// Leftovers: the lost property hall, x[-62, -24], z[0, 24]
// ---------------------------------------------------------------------------------------------------------------
function leftovers(game, s) {
  const g = s.g, r = new Rng(4040), X0 = -62, X1 = -24, Z1 = 24;
  const clip = [X0, -0.5, -0.5, X1, H + 0.1, Z1];
  floor(s, X0, 0, X1, Z1, 0, 'planks', '#8a6a48');
  ceiling(s, X0, 0, X1, Z1, H, 'paint', '#d9cfba');
  const wt = { tint: '#d8c8a8', dado: { h: 1.0, mat: 'wood', tint: '#5b3a26' }, skirt: '#3a2d22' };
  wall(s, X0 + 0.08, 0, X0 + 0.08, Z1, 0, H, wt); wall(s, X1 - 0.08, 0, X1 - 0.08, Z1, 0, H, wt); wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, wt);
  g.mat('wood', '#5b3a26'); for (let x = X0 + 4; x < X1; x += 4) g.box(x - 0.12, H - 0.36, 0, x + 0.12, H, Z1, { faces: 'xXy' }); s.flush({ tier: 's' });
  // the stacks: tall shelving in rows along z, two decks high, a rolling ladder, every thing with its card
  const ROWS = [-58.5, -54.5, -50.5, -34, -30, -26.5];
  const LABELS = ['Decks 1 to 40', 'Decks 41 to 90', 'Decks 91 to 150', 'Decks 151 to 230', 'Decks 231 to 300', 'Decks 301 to 375 · the Hollow'];
  const GOODS = ['#8a2f3c', '#2c5a56', '#d9a23a', '#5b4060', '#b0502c', '#e2d6bc', '#3a4a6a', '#6b8f4e', '#c9763e', '#7a5233'];
  ROWS.forEach((rx, ri) => {
    for (let z = 8.5; z < 22.5; z += 2.4) {
      prop(s, 'shelving', rx, 0, z, -PI / 2, { w: 2.35, h: 5.6, d: 0.5, shelves: 9, wood: '#5b3a26' });
      prop(s, 'shelving', rx + 0.52, 0, z, PI / 2, { w: 2.35, h: 5.6, d: 0.5, shelves: 9, wood: '#5b3a26' });
      s.detail(() => {
        for (let k = 0; k < 9; k++) {
          const y = 0.1 + k * (5.6 - 0.11) / 9;
          for (const side of [-1, 1]) {
            let u = -1.05;
            while (u < 1.0) {
              const w = r.f(0.14, 0.42); if (u + w > 1.05) break;
              const x = rx + 0.26 + side * 0.25, c = GOODS[r.i(0, GOODS.length - 1)], kind = r.i(0, 5);
              if (kind < 3) { g.mat(kind === 0 ? 'knit' : kind === 1 ? 'weave' : 'paper', c); g.box(x - 0.17, y + 0.026, z + u, x + 0.17, y + 0.026 + r.f(0.1, 0.42), z + u + w, { faces: (side < 0 ? 'x' : 'X') + 'YzZ' }); }
              else if (kind === 3) { g.mat('glaze', c); g.cyl(x, y + 0.026, z + u + w / 2, Math.min(0.12, w / 2.2), r.f(0.12, 0.3), { segs: 8 }); }
              else { g.mat('cast', r.chance(0.5) ? '#b08a45' : '#3a3430'); g.box(x - 0.12, y + 0.026, z + u, x + 0.12, y + 0.026 + r.f(0.08, 0.2), z + u + w, { faces: (side < 0 ? 'x' : 'X') + 'YzZ' }); }
              // its card
              g.mat('paper', '#f3ead4'); g.box(x + side * 0.2 - 0.004, y + 0.04, z + u + w / 2 - 0.04, x + side * 0.2 + 0.004, y + 0.11, z + u + w / 2 + 0.04, { faces: side < 0 ? 'x' : 'X' });
              u += w + r.f(0.02, 0.08);
            }
          }
        }
      });
    }
    sign(s, { kind: 'label', text: LABELS[ri], ink: '#f1e6c9' }, rx + 0.26, 6.0, 7.2, { face: 'z', w: 1.6, h: 0.24 });
    g.mat('wood', '#3a2d22'); g.box(rx - 0.55, 5.8, 7.24, rx + 1.07, 6.2, 7.26); s.flush({ tier: 'd' });
  });
  // the rolling ladder and its rail
  g.mat('cast', PAL.brass); g.tube([[-50.75, 5.3, 8.3], [-50.75, 5.3, 22.2]], 0.025, { segs: 6 }); s.flush({ tier: 'd' });
  g.mat('wood', '#7a5233'); for (const dz of [-0.25, 0.25]) g.tube([[-50.75, 5.3, 15 + dz], [-51.9, 0, 15 + dz]], 0.03, { segs: 5 });
  for (let k = 1; k < 16; k++) { const t = k / 16; g.box(-50.75 - 1.15 * (1 - t) - 0.02, 5.3 * t - 0.02, 14.7, -50.75 - 1.15 * (1 - t) + 0.02, 5.3 * t + 0.02, 15.3); }
  s.flush({ tier: 's', cast: true }); s.solid(-52, 0, 14.7, -51.3, 1.6, 15.3);
  // the desk by the door, with the keeper's bell, the book and a lamp
  prop(s, 'counter', -43, 0, 4.4, PI, { w: 3.4, d: 0.75, body: '#5b4060', top: '#8a6240' });
  s.detail(() => {
    g.mat('paper', '#efe6d2'); g.box(-43.6, 0.92, 4.2, -42.9, 0.96, 4.7, { bevel: 0.004 }); g.mat('paper', '#e2d6bc'); g.box(-43.62, 0.96, 4.22, -43.27, 0.962, 4.68);
    g.mat('cast', PAL.brass, { rough: -0.2 }); g.lathe(-42.1, 4.2, [[0.06, 0.92], [0.055, 0.96], [0.03, 0.99], [0.008, 1.0], [0.008, 1.03], [0, 1.035]], { segs: 12 });
    g.mat('paper', '#f3ead4'); for (let i = 0; i < 6; i++) g.box(-44.5 + i * 0.08, 0.92, 4.5, -44.46 + i * 0.08, 1.05, 4.62);
  });
  lamp(s, 'globe', -43, 2.3, 4.6, { K: 2700, power: 0.9, clip, drop: 5.0, r: 0.2 });
  lamp(s, 'globe', -41, 2.6, 6.4, { K: 2700, power: 0.6, clip, drop: 4.7, r: 0.16 });
  for (const rx of ROWS) lamp(s, 'sconce', rx + 0.26, 3.4, 7.15, { face: 'z', K: 2800, power: 0.8, clip });
  for (const x of [-56.5, -52.5, -42, -32, -28.2]) lamp(s, 'globe', x, 5.6, 15, { K: 2900, power: 0.75, clip, drop: 1.6, r: 0.18 });
  roomGlow(s, X0, 0, 0, X1, H, Z1, { sky: '#ffdcae', ground: '#a8794f', power: 0.24 });
  // a bench by the door to wait on, a cart of things going to the menders, a plant
  prop(s, 'bench', -48, 0, 1.0, 0, { w: 2.0, back: true, wood: '#7a5233' });
  prop(s, 'lmline.cart', -37.5, 0, 2.6, 0.2, { load: 2 });
  sign(s, { kind: 'label', text: 'To the menders', ink: '#2a2420' }, -37.5, 1.15, 2.14, { face: 'z', w: 0.7, h: 0.14 });
  prop(s, 'plant', -45.8, 0, 1.0, 0, { kind: 'fern', size: 1.1, pot: '#2f6f73' });
  // the things with stories, on a long table under their own lamp
  prop(s, 'table', -41, 0, 7.4, 0, { w: 3.2, d: 0.9, h: 0.8, wood: '#5b3a26', top: '#7a5233' });
  // the coat on its stand
  g.mat('cast', '#3a3430'); g.tube([[-38.6, 0, 7.4], [-38.6, 1.75, 7.4]], 0.02, { segs: 5 }); g.lathe(-38.6, 7.4, [[0.25, 0], [0.2, 0.03], [0.03, 0.05]], { segs: 12 }); g.tube([[-38.9, 1.65, 7.4], [-38.3, 1.65, 7.4]], 0.015, { segs: 4 }); s.flush({ tier: 'd' });
  s.detail(() => {
    g.mat('weave', '#a8502c'); g.prism([[-38.95, 7.25], [-38.25, 7.25], [-38.2, 7.55], [-39.0, 7.55]], 0.55, 1.62);
    g.mat('knit', '#d9a23a'); g.box(-38.5, 0.9, 7.24, -38.3, 1.5, 7.255);
    g.mat('weave', '#2c5a56'); g.box(-38.95, 0.75, 7.245, -38.75, 0.8, 7.255);
    g.mat('paper', '#f3ead4'); g.box(-38.65, 1.2, 7.235, -38.5, 1.28, 7.245);
  });
  s.post(-38.6, 7.4, 0.3, 0, 1.75);
  // the flute in its felt bag, a crock of starter, the toy cab
  s.detail(() => {
    g.mat('felt', '#5b4060'); g.push(); g.move(-42.2, 0.84, 7.3); g.rotZ(PI / 2 - 0.02); g.cyl(0, -0.62, 0, 0.045, 1.24, { segs: 10 }); g.pop();
    g.mat('paper', '#f3ead4'); g.box(-41.7, 0.8, 7.05, -41.55, 0.802, 7.15);
    g.mat('wood', '#c9a46a'); g.box(-40.3, 0.8, 7.55, -40.0, 0.92, 7.68, { bevel: 0.02 }); g.mat('paint', '#b0502c'); g.box(-40.3, 0.86, 7.545, -40.0, 0.875, 7.685); g.mat('plain', '#1d2426'); g.box(-40.26, 0.89, 7.54, -40.04, 0.91, 7.69);
  });
  prop(s, 'crock', -40.9, 0.8, 7.25, 0, { glaze: '#2f6f73', h: 0.26, r: 0.1 });
  lamp(s, 'globe', -40.6, 2.0, 7.4, { K: 2600, power: 0.6, clip, drop: 5.4, r: 0.14 });
  sign(s, { kind: 'fascia', text: 'Leftovers', sub: 'lost property · kept a year and a day', palette: ['#5b4060', '#f3e6c8', '#d9a23a'], emblem: 'cup' }, -43, 4.0, -0.12, { face: 'z', w: 4.2, h: 0.75, glow: 0.8 });
  // the keeper and the interacts
  s.spot('counter', -43, 0, 5.3, PI, { tags: ['keeper'] });
  s.spot('customer', -43.4, 0, 3.5, 0, { tags: ['browse'] });
  for (const rx of ROWS) { s.spot('browse', rx - 0.6, 0, 12 + r.f(0, 6), PI / 2, { tags: ['browse'] }); }
  s.spot('work', -52.5, 0, 20, PI, { tags: ['porter'] }); s.spot('work', -31.5, 0, 9.5, PI / 2, { tags: ['sweep'] });
  s.spot('sit', -48.5, 0.46, 1.0, 0, { tags: ['wait'] });
  seat(s, -47.5, 0, 1.0, 0, 'Sit and wait', { radius: 1.1 });
  s.interact({ x: -43, y: 1.2, z: 3.4, radius: 1.8, prompt: 'Talk to the keeper', onUse: keeper });
  s.interact({ x: -38.6, y: 1.2, z: 6.6, radius: 1.0, prompt: 'Read the coat\'s card', onUse: async (gm) => {
    await read(gm, 'A card, pinned to the cuff', ['Coat, rust, heavy vat-grown cloth. Relined three times. Four names inside the lining in four hands: Ama, Teodor, Ama again, and Lise in fresh blue thread.', 'Left in a cab at deck 212 at twenty to eight in the morning, eleven months ago. Not claimed.', 'Under it, in the keeper\'s pencil: Somebody will. The lining is too good.']);
    gm.flags['line.coat'] = true;
  } });
  s.interact({ x: -40.9, y: 1.0, z: 6.7, radius: 1.0, prompt: 'Read the crock\'s card', onUse: async (gm) => {
    await read(gm, 'A card, tied round the lid', ['A lidded crock of starter, left at deck 63 by someone on their way to a naming, nine months ago.', 'The keeper feeds it on Thursdays with flour from the free table. It has outlived its card twice. Spoons of it have gone home with eleven people who asked, and it is still here.']);
    gm.flags['line.crock'] = true;
  } });
  s.interact({ x: -42.2, y: 1.0, z: 6.7, radius: 1.0, prompt: 'Read the flute\'s card', onUse: async (gm) => {
    await read(gm, 'A card, through the drawstring', ['A heliox flute, 1.2 metres, in a felt bag. Deck 30, a youth hall\'s second flute. Claimed three times and left four.', 'Below that, a later note: Fourth time, her teacher came for it. Fifth time, the keeper has decided to keep it on the desk.']);
  } });
  s.interact({ x: -40.15, y: 1.0, z: 7.0, radius: 0.9, prompt: 'Read the toy cab\'s card', onUse: async (gm) => {
    await read(gm, 'A card, under the wheels', ['A wooden toy cab, red band, a lending tag from a block toy library on deck 104: due back eleven weeks ago.', 'The keeper has written to the library. The library wrote back that it is not worried, and that the child will be.']);
  } });
  s.zoneBox({ id: 'line-leftovers', place: 'line-works', box: [X0, -0.5, 0, X1, H, Z1], name: 'Leftovers', sub: 'lost property · ' + SUB, ambience: 'shop', reverb: 'felt', headroom: H });
  s.loop('air', -43, 5, 12, { vol: 0.08, radius: 20 });
  s.path([[-43, -1.5], [-43, 2.2], [-46, 6], [-46, 22]]); s.path([[-46, 6], [-38, 6], [-38, 22]]); s.path([[-46, 22], [-38, 22]]);
}
async function keeper(gm) {
  if (!gm.ui) return;
  const who = { name: 'The keeper', colour: '#d9a23a' };
  gm.busy++;
  try {
    await gm.ui.say(who, gm.flags['line.keeper'] ? ['Back again. Lost something this time, or just looking.'] : ['If you have lost something, sit down. It is usually here before you are.']);
    gm.flags['line.keeper'] = true;
    for (;;) {
      const pick = await gm.ui.choose(who, 'Ask', [
        { label: 'What gets left?', value: 'what' }, { label: 'How long do you keep it?', value: 'long' },
        { label: 'How do you sort it?', value: 'sort' }, { label: 'Thank you', value: null }]);
      if (!pick) break;
      if (pick === 'what') await gm.ui.say(who, ['Gloves, cups, lids. Lids most of all. People put a lid down on the bench to drink and forget it, and a lid is the one thing nobody can manage without.', 'Then coats, flutes, books, a cheese once, a child\'s first shoes, starter, a whole long letter not yet sent. We read the address and sent it. That was allowed.']);
      else if (pick === 'long') await gm.ui.say(who, ['A year and a day. Then it goes on that cart to the menders, and from them to whoever needs it. A coat with four names in it gets a fifth.', 'Nothing is thrown away. A thing that has been lost has already cost somebody something.']);
      else await gm.ui.say(who, ['By the deck where the cab found it, then by the day. The cab knows where it was when a thing was left: the floor reads the weight, and the next crew to open it brings it down here with a ticket.', 'So when you come in and say a green cup, deck 140 or so, Tuesday, I walk to that stack and it is usually on the third shelf.']);
    }
  } finally { gm.busy--; }
}

// ---------------------------------------------------------------------------------------------------------------
// The Plate Rack: x[-150, -70], z[0, 40]. The cabs not needed, in rows on two tiers, dark, one small lamp each.
// ---------------------------------------------------------------------------------------------------------------
function plateRack(game, s) {
  const g = s.g, r = new Rng(1388), X0 = -150, X1 = -70, Z1 = 40, Y2 = 4.0;
  const clip = [X0, -0.5, -0.5, X1, H + 0.1, Z1];
  floor(s, X0, 0, X1, Z1, 0, 'concrete', '#5d5f5a');
  ceiling(s, X0, 0, X1, Z1, H, 'concrete', '#6a6c66');
  const wt = { tint: '#7d8580', dado: { h: 1.2, mat: 'block', tint: '#3d4a45' }, skirt: '#2b2e30' };
  wall(s, X0 + 0.08, 0, X0 + 0.08, Z1, 0, H, wt); wall(s, X1 - 0.08, 0, X1 - 0.08, Z1, 0, H, wt); wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, wt);
  const ROWZ = [8, 14.5, 21, 27.5, 34];
  // guide rails in the floor, the upper tier's beams and posts
  for (const rz of ROWZ) {
    runX(X0 + 2, X1 - 2, 16, (a, b) => {
      g.mat('brushed', '#80888a'); for (const dz of [-0.55, 0.55]) g.box(a, 0, rz + dz - 0.09, b, 0.03, rz + dz + 0.09, { faces: 'Y' });
      g.mat('cast', '#3d4440'); for (const dz of [-0.95, 0.95]) g.box(a, Y2 - 0.32, rz + dz - 0.12, b, Y2, rz + dz + 0.12, { faces: 'yYzZ' });
      g.mat('brushed', '#80888a'); for (const dz of [-0.55, 0.55]) g.box(a, Y2 - 0.02, rz + dz - 0.09, b, Y2 + 0.02, rz + dz + 0.09, { faces: 'Y' });
      g.mat('cast', '#3d4440'); for (let x = Math.ceil(a / 7.6) * 7.6; x < b; x += 7.6) { g.box(x - 0.12, Y2 - 0.32, rz - 0.95, x + 0.12, Y2 - 0.12, rz + 0.95, { faces: 'yYxX' }); }
      s.flush({ tier: 's' });
    });
    for (let x = X0 + 2 + 3.8; x < X1 - 2; x += 15.2) for (const dz of [-1.08, 1.08]) { g.mat('cast', '#3d4440'); g.box(x - 0.1, 0, rz + dz - 0.1, x + 0.1, Y2, rz + dz + 0.1); s.post(x, rz + dz, 0.14, 0, Y2); }
    s.flush({ tier: 's', cast: true });
  }
  // the cabs: nose to tail, two tiers, all asleep
  for (const rz of ROWZ) {
    for (let x = X0 + 4; x < X1 - 3; x += 3.8) {
      const c = LIVERY[r.i(0, LIVERY.length - 1)];
      prop(s, 'lmline.cab', x, 0, rz, 0, { body: c[0], band: c[1], sleep: 2.4, lamp: 0 }, { noSpots: true });
      if (r.chance(0.92)) prop(s, 'lmline.cab', x, Y2, rz, 0, { body: c[0], band: c[1], sleep: 2.4, lamp: 0 }, { noSpots: true, noCollide: true });
    }
  }
  // a few dim blue lamps high up, low amber lamps at the row ends to walk by
  for (let x = X0 + 10; x < X1; x += 20) for (const z of [11, 24.5, 37]) s.light({ at: [x, H - 0.6, z], color: '#9fb4d8', power: 2.4, range: 13, clip, radius: 0.4 });
  g.mat('diffuser', '#c9d8ff', { emissive: 2 }); for (let x = X0 + 10; x < X1; x += 20) for (const z of [11, 24.5, 37]) g.box(x - 0.6, H - 0.52, z - 0.1, x + 0.6, H - 0.5, z + 0.1, { faces: 'y' }); s.flush({ tier: 's' });
  for (const rz of ROWZ) { g.mat('cast', '#2b2e30'); g.box(X1 - 2.6, 0, rz - 1.4, X1 - 2.3, 0.6, rz - 1.25); g.mat('diffuser', '#ffb45a', { emissive: 3 }); g.box(X1 - 2.58, 0.5, rz - 1.42, X1 - 2.32, 0.58, rz - 1.4); s.light({ at: [X1 - 2.45, 0.7, rz - 1.6], color: '#ffb45a', power: 0.5, range: 3.5, clip, radius: 0.1 }); }
  s.flush({ tier: 'd' });
  s.ambient({ box: [X0, 0, 0, X1, H, Z1], sky: '#5a6a8a', ground: '#2a2e33', power: 0.2, soft: 0.6 });
  // the wake board by the way in, and its keeper's desk
  sign(s, { kind: 'board', title: 'The Plate Rack · wake order', lines: ['Row one|04:15 · the bakers\' halls', 'Row two|04:30 · Keel shifts', 'Row three|05:00 · the stations', 'Row four|05:40 · the schools', 'Row five|06:10 · everyone else', 'Upper tier|as the morning wants'], palette: ['#101614', '#f3e6c8', '#ffb45a'] }, -98, 2.0, 1.2, { face: 'Z', w: 1.9, h: 1.3, glow: 1.2 });
  g.mat('cast', '#2b2e30'); g.box(-99, 0, 1.0, -97, 0.05, 1.1); g.tube([[-98.9, 0, 1.15], [-98.9, 1.3, 1.15]], 0.02, { segs: 4 }); g.tube([[-97.1, 0, 1.15], [-97.1, 1.3, 1.15]], 0.02, { segs: 4 }); s.flush({ tier: 'd' });
  s.solid(-99, 0, 1.0, -97, 2.7, 1.3);
  s.interact({ x: -98, y: 1.6, z: 2.2, radius: 1.6, prompt: 'Read the wake order', onUse: async (gm) => {
    await read(gm, 'The Plate Rack', ['Overnight, most of Chervil\'s cabs sleep in the berths of the lobbies they last served. The rest come here, a few thousand on this deck alone, in rows on two tiers, nose to tail, each with one small lamp so the crews can count them.',
      'They wake from the far end, a row at a time: the bakers\' halls first at a quarter past four, because the bread has to be up before anybody else is. Then the Keel shifts, the stations, the schools, and everyone else.',
      'In the lamp-night the empty ones carry the freight instead: flour up from the Keel, the day\'s goods out to the lobbies, a few kilograms a person. Nothing here is ever really asleep.']);
    gm.flags['line.rack'] = true;
  } });
  s.interact({ x: -110, y: 1.2, z: 4.0, radius: 2.2, prompt: 'Look along the rows', onUse: async (gm) => {
    const h = gm.clock ? gm.clock.hours : 12;
    const lines = h >= 23 || h < 4.25 ? ['Row after row of dark cabs, nose to tail, curving up and away with the deck. One small amber lamp on each. It is very quiet. Somewhere at the far end a crew lead is counting them under her breath.']
      : h < 7 ? ['The far rows are already empty: you can see the rails shine where the bakers\' cabs were. The near ones are still dark, each with its one small lamp, waiting their turn.']
      : ['Most of the racks are full by day too: these are the spares, rested between services, mended in turn. The lamps stay on. A cab is never put away without one.'];
    await read(gm, 'The Plate Rack', lines);
  } });
  s.zoneBox({ id: 'line-rack', place: 'line-works', box: [X0, -0.5, 0, X1, H, Z1], name: 'The Plate Rack', sub: 'the depot · ' + SUB, ambience: 'quiet', reverb: 'station', headroom: H, env: { exposure: 1.25 } });
  for (const rz of ROWZ) { s.spot('work', X0 + 6 + r.f(0, 60), 0, rz + 3.2, PI / 2, { tags: ['crew'] }); }
  s.spot('work', -104, 0, 3.4, PI, { tags: ['crew'] });
  s.path([[-110, -1.5], [-110, 4.2], [-145, 4.2], [-145, 37.3], [-74, 37.3], [-74, 4.2], [-110, 4.2]]);
  for (const rz of ROWZ.slice(0, 4)) s.path([[-145, rz + 3.25], [-74, rz + 3.25]]);
  s.loop('air', -110, 5, 20, { vol: 0.1, radius: 30 });
}

// ---------------------------------------------------------------------------------------------------------------
// The things that move: platoons on the loops (anti near, spinward far) and on the cross-line.
// ---------------------------------------------------------------------------------------------------------------
function movers(game, s) {
  const tubeClip = [-XE, TY, TZ, XE, TR, TG];
  // near tube: anti, 30 m/s (0.63 g for the riders); far tube: spinward, 20 m/s (1.2 g)
  const near = [[4, -300], [1, -40], [2, 160]], far = [[3, -250], [2, 30], [1, 230]];
  s.lmPlatoons = [];
  near.forEach((p, i) => s.lmPlatoons.push(platoon(s, { n: p[0], dir: -1, speed: 30, a0: -XE - 20, a1: XE + 20, at: p[1], y: TY, c: -16.7, colours: LIVERY, seed: i, light: { color: '#ffe2b8', power: 2.6, range: 8, clip: tubeClip }, whoosh: true, near: 8 })));
  far.forEach((p, i) => s.lmPlatoons.push(platoon(s, { n: p[0], dir: 1, speed: 20, a0: -XE - 20, a1: XE + 20, at: p[1], y: TY, c: -22.9, colours: LIVERY, seed: i + 2, light: { color: '#ffe2b8', power: 2.2, range: 8, clip: tubeClip }, whoosh: false })));
  // the cross-line: one platoon each way
  const crossClip = [CX0, 4, -230, CX1, H, 90];
  platoon(s, { axis: 'z', n: 3, dir: 1, speed: 30, a0: -220, a1: 80, at: -60, y: 4.2, c: CX0 + 2.65, colours: LIVERY, seed: 1, light: { color: '#ffe2b8', power: 2.4, range: 8, clip: crossClip }, whoosh: true, near: 4 });
  platoon(s, { axis: 'z', n: 2, dir: -1, speed: 30, a0: -220, a1: 80, at: 20, y: 4.2, c: CX1 - 2.65, colours: LIVERY, seed: 3, light: { color: '#ffe2b8', power: 2.4, range: 8, clip: crossClip }, whoosh: true, near: 4 });
}
