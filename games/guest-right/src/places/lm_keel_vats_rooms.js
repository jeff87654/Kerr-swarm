// The smaller places round the Flour Hall: the cab lobby, the Pass, the Trimmings, Curd Row, the blight door and the
// seed room behind it, and the Kettle at the spinward end. Frame 'keel-vats' (see lm_keel_vats.js).
import { floor, ceiling, wall, lamp, block } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door } from '../world/doors.js';
import { PI, C, LINE_COL, HALL, CURD, SEED, BLIGHT_X, say, toast, sfx, tick, runX, glyphRing } from './lm_keel_vats_props.js';

const RH = HALL.roomH;
const XA = HALL.x0 - 12;                 // the anti end block: x[XA, HALL.x0]
const KET = { x0: HALL.x1, x1: HALL.x1 + 24, z: 9, h: 10.4 };

export async function buildRooms(game, s, f, R, r) {
  endBlock(game, s, f);
  await tick(game);
  lobby(game, s, f);
  trimmings(game, s, f, r);
  await tick(game);
  pass(game, s, f, r);
  await tick(game);
  curdRow(game, s, f, R, r);
  await tick(game);
  seedRoom(game, s, f);
  kettle(game, s, f);
}

// ---------------------------------------------------------------------------------------------------------------
// the anti end block: the shell of the three rooms behind the hall's end wall
// ---------------------------------------------------------------------------------------------------------------
function endBlock(game, s, f) {
  const X1 = HALL.x0, Z = HALL.z;
  floor(s, XA, -Z, X1, -4.5, 0, 'tile', '#a9583c', { matOpts: { rough: -0.2 } });     // the Trimmings: quarry tile
  floor(s, XA, -4.5, X1, 4.5, 0, 'terrazzo', '#c9bca2');                              // the lobby
  floor(s, XA, 4.5, X1, Z, 0, 'planks', '#7a5a3a');                                   // the Pass
  ceiling(s, XA, -Z, X1, -4.5, RH, 'plaster', '#e6d8bc');
  ceiling(s, XA, -4.5, X1, 4.5, RH, 'panel', '#d9cfb8');
  ceiling(s, XA, 4.5, X1, Z, RH, 'felt', '#5b4060');
  // the hall's end wall, low part: canteen windows and door, the lobby open, the Pass's long window
  const hallSide = { mat: 'panel', tintA: '#2f5d5a', dado: { h: 2.4, mat: 'tile', tint: '#d8d0b4' }, skirt: '#3a3430' };
  wall(s, X1, -Z, X1, -4.5, 0, RH, Object.assign({}, hallSide, { tintB: '#e8d3a8', openings: [{ at: 0.6, w: 7, h: 1.7, sill: 0.9 }, { at: 8.6, w: 1.4, h: 2.3 }] }));
  wall(s, X1, 4.5, X1, Z, 0, RH, Object.assign({}, hallSide, { tintB: '#3b5a6a', openings: [{ at: 0.9, w: 10, h: 2.2, sill: 0.9 }] }));
  s.glass(X1, 0.9, -15.4, X1, 2.6, -8.4, { tint: '#d8e6de' }); s.glass(X1, 0.9, 5.4, X1, 3.1, 15.4, { tint: '#d8e6de' });
  s.structure((g) => {
    g.mat('cast', '#3d4245'); for (let z = -15.4; z <= -8.39; z += 1.75) g.box(X1 - 0.05, 0.9, z - 0.04, X1 + 0.05, 2.6, z + 0.04);
    for (let z = 5.4; z <= 15.41; z += 2) g.box(X1 - 0.05, 0.9, z - 0.04, X1 + 0.05, 3.1, z + 0.04);
    g.mat('wood', '#5b4636'); g.box(X1 - 0.25, 0.86, -15.4, X1 + 0.12, 0.92, -8.4); g.box(X1 - 0.3, 0.86, 5.4, X1 + 0.12, 0.92, 15.4);
    // the lobby's open front: a steel lintel and two posts
    g.mat('cast', '#3d4245'); g.box(X1 - 0.2, RH - 0.35, -4.6, X1 + 0.2, RH, 4.6); for (const z of [-4.5, 4.5]) g.box(X1 - 0.18, 0, z - 0.18, X1 + 0.18, RH, z + 0.18, { bevel: 0.02 });
  });
  // the back wall and the two ends
  wall(s, XA, -Z, XA, -4.5, 0, RH, { tint: '#e8d3a8', dado: { h: 1.0, mat: 'tile', tint: '#2f6f73' } });
  wall(s, XA, -4.5, XA, 4.5, 0, RH, { tint: '#d9cfb8', dado: { h: 1.2, mat: 'panel', tint: '#2f5d5a' } });
  wall(s, XA, 4.5, XA, Z, 0, RH, { tint: '#3b5a6a' });
  wall(s, XA, -Z, X1, -Z, 0, RH, { tint: '#e8d3a8', dado: { h: 1.0, mat: 'tile', tint: '#2f6f73' } });
  wall(s, XA, Z, X1, Z, 0, RH, { tint: '#3b5a6a' });
  // the lobby's side walls, with doors into the Trimmings and the Pass
  wall(s, XA, -4.5, X1, -4.5, 0, RH, { tintA: '#d9cfb8', tintB: '#e8d3a8', openings: [{ at: 3.4, w: 1.4, h: 2.3 }] });
  wall(s, XA, 4.5, X1, 4.5, 0, RH, { tintA: '#3b5a6a', tintB: '#d9cfb8', openings: [{ at: 5.6, w: 1.2, h: 2.3 }] });
  // the band of wall above the rooms, seen from the hall, is the hall's (shell); a sign over the lobby's mouth
  sign(s, { kind: 'street', text: 'Cabs · the Flour Hall', sub: 'the Pass · the Trimmings', palette: ['#22302c', '#f1ead8'] }, X1 + 0.06, RH + 0.45, 0, { face: 'X', w: 3.2, h: 0.62, glow: 0.8 });
}

// Two berth doors on a wall, the call button and the cab stop's interact. (x, z): the wall's centre point, yaw: the way the berths face.
function berths(game, s, f, x, z, yaw, stopId, clip) {
  const g = s.g;
  s.furniture(() => {
    g.at(x, 0, z, yaw);
    for (const bz of [-2.2, 2.2]) {
      const bw = 1.3;
      g.mat('stone', '#9c8f7c'); g.box(bz - bw / 2 - 0.18, 0, 0, bz + bw / 2 + 0.18, 2.62, 0.16, { bevel: 0.01 });
      g.mat('cast', C.brass, { rough: -0.1 }); g.box(bz - bw / 2, 0.02, 0.16, bz - 0.01, 2.36, 0.2); g.box(bz + 0.01, 0.02, 0.16, bz + bw / 2, 2.36, 0.2);
      g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(bz - bw / 2 + 0.06, yy, 0.2, bz + bw / 2 - 0.06, yy + 0.03, 0.215);
      g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(bz - 0.2, 2.44, 0.16, bz + 0.2, 2.52, 0.19);
      g.mat('cast', '#3a3430'); g.box(bz + bw / 2 + 0.25, 1.05, 0.0, bz + bw / 2 + 0.4, 1.3, 0.08, { bevel: 0.01 });
      g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.box(bz + bw / 2 + 0.3, 1.13, 0.08, bz + bw / 2 + 0.35, 1.2, 0.09);
    }
    g.pop();
  });
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  for (const bz of [-2.2, 2.2]) {
    const px = x + Math.cos(yaw) * bz, pz = z - Math.sin(yaw) * bz;
    s.interact({ x: px + fx * 0.6, y: 1.2, z: pz + fz * 0.6, radius: 1.7, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open(stopId); } });
  }
  void clip;
}

// ---------------------------------------------------------------------------------------------------------------
// the cab lobby: berths, lockers, coveralls on pegs, the shift board; the change of shift happens here
// ---------------------------------------------------------------------------------------------------------------
function lobby(game, s, f) {
  const g = s.g, clip = [XA - 0.2, -0.3, -4.7, HALL.x0 + 3, RH + 0.2, 4.7];
  berths(game, s, f, XA + 0.08, 0, PI / 2, 'keel-vats', clip);
  prop(s, 'bench', XA + 0.7, 0, 0, PI / 2, { w: 2.0, wood: '#7a5233', back: true });
  // lockers along the Trimmings side, coveralls on pegs along the Pass side
  prop(s, 'keelvats.lockers', HALL.x0 - 3.6, 0, -4.2, 0, { n: 10, paint: '#2f5d5a' });
  const CLOTH = ['#3a5a7a', '#5b4060', '#3a5a7a', '#6b7a3a', '#3a5a7a', '#8a2f3c', '#3a5a7a'];
  const MEND = ['#d6a640', '#b5532e', '#2f6f73', '#f2b56b', '#d6a640', '#7fe08a', '#c9962e'];
  s.detail(() => { g.mat('wood', '#5b4636'); g.box(HALL.x0 - 7.6, 1.92, 4.36, HALL.x0 - 1.2, 2.02, 4.42); g.mat('cast', C.brass); for (let i = 0; i < 9; i++) g.cyl(HALL.x0 - 7.3 + i * 0.75, 1.9, 4.3, 0.015, 0.1, { segs: 5 }); });
  CLOTH.forEach((c, i) => prop(s, 'keelvats.coverall', HALL.x0 - 7.3 + i * 0.95, 0.42, 4.3, PI, { cloth: c, mend: MEND[i] }));
  s.detail(() => { g.mat('rush', '#6b5a3a'); g.box(HALL.x0 - 2.6, 0.002, -2.4, HALL.x0 - 0.3, 0.012, 2.4, { faces: 'Y' }); g.mat('wood', '#4a3424'); g.box(HALL.x0 - 7.2, 0, 3.3, HALL.x0 - 3.2, 0.22, 3.9, { bevel: 0.01 }); });
  for (let i = 0; i < 6; i++) prop(s, 'crate', HALL.x0 - 6.9 + i * 0.65, 0.22, 3.6, 0, { w: 0.3, h: 0.16, d: 0.42, wood: ['#2a2622', '#3a3430', '#4a3a2a'][i % 3] });
  // the shift board
  const shifts = { kind: 'chalk', title: 'Shifts', lines: ['Six to two · two to ten · ten to six', 'Hand over at the board, not at the door', 'Line 9: steam crew stays on', 'Coveralls: your own peg, your own name', 'Trimmings open all hours'] };
  sign(s, shifts, XA + 3.3, 1.65, 4.32, { face: 'z', w: 1.5, h: 1.05 });
  s.interact({ x: XA + 3.3, y: 1.4, z: 3.6, radius: 1.5, prompt: 'Read the shift board', onUse: async (gm) => {
    await say(gm, 'The shift board', [
      'Shifts: six to two, two to ten, ten to six. Hand over at the board, not at the door.',
      'Under it, in a different chalk: the Flour Hall makes about eighty tonnes of dry flour a day when all twenty lines are up, four tonnes a line. With Line 9 down it is seventy-six, and the Mill makes up the rest.',
      'Coveralls on the pegs, each with a name in the lining and a knee mended in somebody\'s favourite colour.',
    ]);
  } });
  lamp(s, 'panel', XA + 3.5, RH, 0, { w: 2.4, d: 0.6, K: 3200, power: 0.9, clip });
  lamp(s, 'panel', XA + 8.5, RH, 0, { w: 2.4, d: 0.6, K: 3200, power: 0.8, clip });
  s.ambient({ box: clip, sky: '#ffdcae', ground: '#c9a57c', power: 0.22, lamp: true });
  // the change of shift: people standing about and talking
  for (const p of [[XA + 5.2, -1.6, 0.6], [XA + 5.9, -0.9, -2.2], [XA + 6.3, -2.0, -0.9]]) s.spot('chat', p[0], 0, p[1], p[2], { tags: ['shift'] });
  for (const p of [[HALL.x0 + 3.0, 2.2, -2.4], [HALL.x0 + 3.9, 1.5, 0.8], [HALL.x0 + 2.4, 1.2, 2.1]]) s.spot('chat', p[0], 0, p[1], p[2], { tags: ['shift'] });
  for (const p of [[XA + 3.0, 2.9, PI], [XA + 3.8, 3.0, PI]]) s.spot('stand', p[0], 0, p[1], p[2], { tags: ['board', 'shift'] });
  s.spot('stand', XA + 1.8, 0, -2.2, PI / 2, { tags: ['wait'] }); s.spot('stand', XA + 1.6, 0, 2.5, PI / 2, { tags: ['wait'] });
  s.path([[XA + 1.5, -2.2], [XA + 2.6, 0], [XA + 6, 0], [HALL.x0 - 1, 0], [HALL.x0 + 2, 0]]);
  s.path([[XA + 1.5, 2.2], [XA + 2.6, 0]]);
  s.path([[XA + 6, 0], [XA + 4.1, -2.5], [XA + 4.1, -5.6]]);
  s.path([[XA + 6, 0], [XA + 6.2, 2.5], [XA + 6.2, 5.6]]);
  s.zoneBox({ id: 'keel-vats-lobby', place: 'keel-vats', box: [XA, -0.5, -4.5, HALL.x0, RH, 4.5], name: 'Flour Hall cabs', sub: 'The Keel · deck 9 · Ring Five', ambience: 'station', reverb: 'room', headroom: RH });
}

// ---------------------------------------------------------------------------------------------------------------
// the Trimmings: the shift canteen, open at all hours, where the plant's seconds are eaten
// ---------------------------------------------------------------------------------------------------------------
const COOK = { name: 'Ode Marr', colour: '#c9962e' };
function trimmings(game, s, f, r) {
  const g = s.g, X1 = HALL.x0, Z0 = -HALL.z, Z1 = -4.5;
  const clip = [XA - 0.2, -0.3, Z0 - 0.2, X1 + 0.3, RH + 0.2, Z1 + 0.2];
  // the serving counter along the back, lidded trays on it, shelves of crocks behind
  block(s, XA + 1.4, 0, -15.2, XA + 2.2, 0.9, -9.6, 'wood', '#6b4a2f', { bevel: 0.01 });
  s.furniture(() => { g.mat('brushed', '#cfcdc6', { rough: -0.2 }); g.box(XA + 1.35, 0.9, -15.25, XA + 2.3, 0.94, -9.55, { bevel: 0.01 }); g.mat('paint', '#b5532e'); g.box(XA + 2.2, 0.1, -15.2, XA + 2.21, 0.85, -9.6, { faces: 'X' }); });
  const LIDS = ['#b5532e', '#2f6f73', '#c9962e', '#33407a', '#6b7a3a'];
  for (let i = 0; i < 6; i++) prop(s, 'bowl', XA + 1.8, 0.94, -14.7 + i * 0.95, 0, { glaze: '#e9e1cf', lid: LIDS[i % LIDS.length], r: 0.16 });
  s.detail(() => {
    g.mat('wood', '#5b4636'); for (const y of [1.3, 1.75, 2.2]) g.box(XA + 0.08, y, -15.6, XA + 0.42, y + 0.04, -10.2);
    for (let i = 0; i < 18; i++) { const y = [1.34, 1.79, 2.24][i % 3], z = -15.4 + Math.floor(i / 3) * 0.85 + r.f(0, 0.2); g.mat('glaze', ['#2f6f73', '#b5532e', '#e9e1cf', '#c9962e'][i % 4], { rough: -0.3 }); g.lathe(XA + 0.25, z, [[0, y], [0.1, y], [0.12, y + 0.18], [0.09, y + 0.24], [0.09, y + 0.28], [0, y + 0.28]], { segs: 10 }); }
  });
  sign(s, { kind: 'chalk', title: 'Trimmings', lines: ['Flour loaves, lopsided', 'Steak from the Tray Hall, wrong colour', 'Curd, broken', 'Broth on the loop, always', 'Free on shift · free off it', 'Lids back on the rack'] }, XA + 0.06, 2.0, -12.4, { face: 'X', w: 1.4, h: 1.15 });
  // the loop tap and a sink on the end wall
  prop(s, 'keelvats.tap', XA + 4.0, 0, Z0 + 0.08, 0, {});
  s.detail(() => { g.mat('brushed', '#b9b4a8', { rough: -0.2 }); g.box(XA + 5.2, 0.82, Z0 + 0.1, XA + 6.6, 0.92, Z0 + 0.7, { bevel: 0.01 }); g.mat('cast', '#3d4245'); g.box(XA + 5.3, 0, Z0 + 0.15, XA + 6.5, 0.82, Z0 + 0.65); g.mat('cast', C.brass); g.tube([[XA + 5.9, 0.92, Z0 + 0.12], [XA + 5.9, 1.2, Z0 + 0.12], [XA + 5.9, 1.2, Z0 + 0.4]], 0.018, { segs: 5 }); });
  s.solid(XA + 5.2, 0, Z0, XA + 6.6, 0.92, Z0 + 0.7);
  // three long tables
  for (const z of [-14.2, -11.2, -8.2]) prop(s, 'keelvats.longtable', HALL.x0 - 5.0, 0, z, 0, { w: 4.2, wood: '#6b4a2f', lids: [LIDS[r.i(0, 4)], LIDS[r.i(0, 4)], LIDS[r.i(0, 4)]] });
  for (const z of [-14.2, -11.2, -8.2]) lamp(s, 'globe', HALL.x0 - 5.0, 2.55, z, { K: 2600, power: 0.8, drop: 1.2, clip });
  lamp(s, 'panel', XA + 2.6, RH, -12.4, { w: 1.2, d: 0.6, K: 3000, power: 0.7, clip });
  s.ambient({ box: clip, sky: '#ffd29a', ground: '#b5603e', power: 0.24, lamp: true });
  // its name over the door on the hall side: the cook's name is on the door
  sign(s, { kind: 'fascia', text: 'The Trimmings', sub: 'shift canteen · all hours · cook: Ode Marr', palette: ['#7a2a26', '#f3e6c8', '#d6a640'] }, X1 + 0.06, 3.15, -11.5, { face: 'X', w: 3.6, h: 0.62, glow: 0.6 });
  // people: the cook, a helper, the washer, a queue, the tables (from the props)
  s.spot('counter', XA + 0.85, 0, -12.4, PI / 2, { tags: ['cook', 'serve'] });
  s.spot('work', XA + 0.85, 0, -14.6, PI / 2, { tags: ['cook'] });
  s.spot('work', XA + 5.9, 0, Z0 + 1.05, PI, { tags: ['wash'] });
  for (let i = 0; i < 3; i++) s.spot('queue', XA + 2.85, 0, -13.6 + i * 1.1, -PI / 2, { tags: ['trimmings'] });
  s.path([[XA + 4.1, -5.6], [XA + 3.4, -8], [XA + 3.3, -13], [XA + 3.3, -15]]);
  s.path([[X1 + 1.5, -6.7], [X1 - 1.0, -6.7], [XA + 3.4, -8]]);
  s.path([[X1 + 1.5, -6.7], [X1 + 1.4, 0]]);
  // things to do: a plate, the board, the tap
  s.interact({ x: XA + 2.4, y: 1.0, z: -12.4, radius: 1.6, prompt: 'Take a plate of trimmings', onUse: async (gm) => {
    if (!gm.ui) return;
    gm.busy++;
    let pick = null;
    try { pick = await gm.ui.choose(COOK, 'Help yourself. It is all free, it is all safe, and none of it is the right shape.', [
      { label: 'A lopsided flour loaf', sub: 'free', value: 'loaf' },
      { label: 'A grey-green mycelium steak', sub: 'free', value: 'steak' },
      { label: 'Broken curd, warm', sub: 'free', value: 'curd' },
      { label: 'Nothing, thank you', value: null },
    ]); } finally { gm.busy--; }
    if (!pick) return;
    sfx(gm, 'lid-up', f, XA + 1.8, 1.0, -12.4);
    const lines = {
      loaf: ['The flour that came out a point too wet. It rose sideways. It tastes the same as the straight ones, and the straight ones went up the lift this morning to a hall with a cook\'s name on the door.', 'Lid on it, wanderer. In this air it is cold before you sit down.'],
      steak: ['The Tray Hall grew a sheet a shade too green last night. A cook up the city would send it back. Down here we fry it in the loop\'s fat and say nothing.', 'A good steak at a hall is eighty-four hundredths of a kay. That one is nothing, and it is the same steak.'],
      curd: ['Curd Row\'s press tore it. Casein from yeast, whey from yeast, a cheese that never met a cow. Torn, it is still curd.', 'Eat it warm. It will not keep, which is the only reason it is here.'],
    }[pick];
    await say(gm, COOK, lines);
    toast(gm, 'A plate of trimmings, under a lid. Free, on shift or off it.');
  } });
  s.interact({ x: XA + 0.9, y: 1.6, z: -10.6, radius: 1.3, prompt: 'Read the trimmings board', onUse: async (gm) => {
    await say(gm, 'The Trimmings', [
      'Today: flour loaves, lopsided. Steak from the Tray Hall, the wrong colour. Curd, broken. Broth on the loop, always.',
      'Free on shift, free off it. What comes out of the plant safe but wrong is eaten here, by the people who made it, at any hour, under a lid like anything else.',
      'Signed at the bottom: Ode Marr, cook. Under that, in another hand: and the best fried steak in the Keel.',
    ]);
  } });
  s.interact({ x: XA + 4.0, y: 1.2, z: Z0 + 0.7, radius: 1.3, prompt: 'Fill a cup from the loop tap', onUse: async (gm) => {
    sfx(gm, 'pour', f, XA + 4.0, 1.2, Z0 + 0.4);
    await say(gm, 'The loop tap', [
      'Water off the 65 degree loop, hot enough for tea and too hot to hold for long. It comes from the vats you just walked past.',
      'Boiling a litre from a tap like this costs four and a half hundredths of a kay, anywhere in the drum. Down here, nobody bothers to boil it.',
    ]);
  } });
  s.zoneBox({ id: 'keel-vats-trimmings', place: 'keel-vats', box: [XA, -0.5, Z0, X1, RH, Z1], name: 'The Trimmings', sub: 'The Flour Hall · shift canteen, open at all hours', ambience: 'hall', reverb: 'room', headroom: RH });
  s.loop('murmur', XA + 7, 1.3, -11, { vol: 0.28, radius: 14, param: 0.3 });
  s.loop('kitchen', XA + 1.2, 1.2, -12.4, { vol: 0.22, radius: 8 });
}

// ---------------------------------------------------------------------------------------------------------------
// the Pass: the desk that watches every line, under a wall-sized board
// ---------------------------------------------------------------------------------------------------------------
const DESK = { name: 'Bettina Sall', colour: '#2f6f73' };
function pass(game, s, f, r) {
  const g = s.g, X1 = HALL.x0, Z0 = 4.5, Z1 = HALL.z;
  const clip = [XA - 0.2, -0.3, Z0 - 0.2, X1 + 0.3, RH + 0.2, Z1 + 0.2];
  // the board: one painted picture, lit from within
  const BZ0 = 5.4, BZ1 = 15.6, BY0 = 0.9, BY1 = 3.4;
  const B = game.atlas ? game.atlas.add(1224, 300, paintBoard, 'keelvats.board') : null;
  s.structure(() => {
    g.mat('cast', '#2c3133'); g.box(XA + 0.08, BY0 - 0.12, BZ0 - 0.12, XA + 0.2, BY1 + 0.12, BZ1 + 0.12, { bevel: 0.01 });
    if (B) { g.atlas(B.page, { emissive: 1.25 }); g.quad([XA + 0.205, BY0, BZ1], [XA + 0.205, BY0, BZ0], [XA + 0.205, BY1, BZ0], [XA + 0.205, BY1, BZ1], { uv: [B.u0, B.v1, B.u1, B.v0] }); }
  });
  s.light({ at: [XA + 0.9, 2.2, BZ0 + 0.4], to: [XA + 0.9, 2.2, BZ1 - 0.4], type: 'tube', color: [0.55, 0.95, 0.75], power: 3.2, range: 6, radius: 0.5, clip });
  // the desk and its chairs
  prop(s, 'keelvats.desk', XA + 4.4, 0, 10.5, PI / 2, { w: 6 });
  for (const z of [8.6, 10.5, 12.4]) prop(s, 'chair', XA + 5.35, 0, z, -PI / 2, { wood: '#5b4636', back: 'slat' }, { spot: { tags: ['write'] } });
  s.detail(() => {
    g.mat('paper', '#efe6d2'); g.box(XA + 4.5, 0.77, 9.2, XA + 4.85, 0.8, 9.75); g.mat('leather', '#5b2a26'); g.box(XA + 4.48, 0.765, 9.18, XA + 4.87, 0.775, 9.77);
    g.mat('glaze', '#2f6f73'); g.lathe(XA + 4.6, 11.9, [[0, 0.77], [0.045, 0.77], [0.05, 0.86], [0, 0.86]], { segs: 10 }); g.mat('cast', C.brass); g.lathe(XA + 4.6, 11.9, [[0.055, 0.86], [0.03, 0.88], [0, 0.885]], { segs: 10, capBottom: false });
  });
  // shelves of ledgers on the end wall, a felt hanging to quiet the room, a side table with a kettle off the loop
  s.detail(() => {
    g.mat('wood', '#5b4636'); for (const y of [0.4, 0.95, 1.5, 2.05]) g.box(XA + 6.5, y, Z1 - 0.4, X1 - 1.0, y + 0.04, Z1 - 0.08);
    for (let i = 0; i < 60; i++) { const y = [0.44, 0.99, 1.54, 2.09][i % 4], x = XA + 6.6 + Math.floor(i / 4) * 0.27 + r.f(0, 0.05); if (x > X1 - 1.2) continue; g.mat('paper', ['#7a2a26', '#2f5d5a', '#c9962e', '#33407a', '#5b4636'][i % 5]); g.box(x, y, Z1 - 0.36, x + 0.06, y + r.f(0.3, 0.42), Z1 - 0.1); }
    g.mat('felt', '#c9962e'); g.box(XA + 6.6, 2.4, Z1 - 0.1, X1 - 1.2, 3.5, Z1 - 0.06, { faces: 'z' });
  });
  prop(s, 'table', X1 - 1.6, 0, 6.2, 0, { w: 0.9, d: 0.6, h: 0.9, wood: '#5b4636' });
  prop(s, 'bowl', X1 - 1.8, 0.9, 6.2, 0, { glaze: '#e9e1cf', lid: '#b5532e', r: 0.12 });
  prop(s, 'cup', X1 - 1.4, 0.9, 6.1, 0, { glaze: '#2f6f73' });
  lamp(s, 'spot', XA + 4.6, RH, 9.0, { K: 3000, power: 0.6, clip });
  lamp(s, 'spot', XA + 4.6, RH, 12.0, { K: 3000, power: 0.6, clip });
  lamp(s, 'globe', X1 - 1.6, 2.6, 6.2, { K: 2700, power: 0.5, drop: 1.0, clip });
  s.ambient({ box: clip, sky: '#a8d0c0', ground: '#7a5a3a', power: 0.14, lamp: true });
  sign(s, { kind: 'plate', text: 'The Pass', lines: ['on watch: Bettina Sall', 'knock and come in'] }, XA + 6.8, 1.55, Z0 - 0.1, { face: 'z', w: 0.5, h: 0.24 });
  // people: the watchers at the desk (the chairs), one at the board, one at the ledgers
  s.spot('work', XA + 1.3, 0, 7.6, -PI / 2, { tags: ['notes'] });
  s.spot('work', XA + 9.6, 0, Z1 - 0.9, 0, { tags: ['write'] });
  s.path([[XA + 6.2, 5.6], [XA + 6.6, 8], [XA + 6.6, 13], [XA + 9.6, 14.6]]);
  s.path([[XA + 6.6, 8], [XA + 2.5, 7.0]]);
  // things to do: read the board, ask at the desk
  s.interact({ x: XA + 1.4, y: 1.8, z: 10.5, radius: 2.4, prompt: 'Read the board', onUse: async (gm) => {
    await say(gm, 'The board', [
      'A wall of small lamps, one for every vat: twenty lines of eight in the Flour Hall, fourteen lines of two in Curd Row. Green is running, amber is being emptied or filled, red is sealed.',
      'Line 9 is a row of red. Everything else is green, with an amber here and there where a vat is being harvested.',
      'Along the bottom: LOOP OUT 65.2 · RETURN 41.0 · FEAST LINES: TRAY HALL 3, STOCK ROOM 2, BREW ROW 6 · BOOKING DAY.',
    ]);
  } });
  s.interact({ x: XA + 5.6, y: 1.1, z: 10.5, radius: 1.8, kind: 'talk', prompt: 'Ask at the desk', onUse: async (gm) => {
    if (!gm.ui) return;
    gm.busy++;
    let q = null;
    try { q = await gm.ui.choose(DESK, 'Where have you slept, and have you eaten. Good. What do you want to know.', [
      { label: 'What does the desk watch for', value: 'watch' },
      { label: 'Why is there no line 4', value: 'four' },
      { label: 'What are the feast lines', value: 'feast' },
      { label: 'Nothing. Thank you', value: null },
    ]); } finally { gm.busy--; }
    if (q === 'watch') await say(gm, DESK, ['A lamp going amber when it should not. A vat a degree too cold. A phage shows up as a line that stops eating its methanol, an hour before it shows up as anything else.', 'When a light goes red I call the blight menu, the Mill takes the line\'s share, and the line regrows from library stock. That is the whole job, and most nights nothing happens. I like most nights.']);
    else if (q === 'four') await say(gm, DESK, ['Our yeasts came from Sorrel\'s library, three hundred years ago, and their numbering came with them. Sorrel\'s Line Four blighted in the year it counted, and nobody there has used the number since.', 'We never had a Line Four to lose. We skip it anyway. It is manners.']);
    else if (q === 'feast') await say(gm, DESK, ['Booking Day\'s feast is grown and brewed in the weeks before. Three trays of steak in the Tray Hall, two in the Stock Room for the cultivated, six brews on Brew Row, and the aged cheese down in Curd Row since the dark end of last year.', 'Every hall in Chervil eats it the same afternoon. We will eat it here, in the Trimmings, cold. Somebody has to mind the lamps.']);
  } });
  s.zoneBox({ id: 'keel-vats-pass', place: 'keel-vats', box: [XA, -0.5, Z0, X1, RH, Z1], name: 'The Pass', sub: 'The Flour Hall · the desk that watches every line', ambience: 'quiet', reverb: 'felt', headroom: RH });
}

// The board: every line's vats as small lamps, Line 9 dark red, a few amber; the loop's temperatures along the foot.
function paintBoard(ctx, w, h) {
  ctx.fillStyle = '#0f1614'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2f5d5a'; ctx.lineWidth = 3; ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = '#d6a640'; ctx.font = "600 26px 'Barlow Condensed', sans-serif"; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('THE FLOUR HALL · LINES 1 TO 21', 24, 30);
  ctx.textAlign = 'right'; ctx.fillText('CURD ROW · C1 TO C15', w - 24, 30);
  const L = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const lamp = (x, y, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 2.5, 0, 7); ctx.fill(); };
  ctx.textAlign = 'center'; ctx.font = "600 20px 'Barlow Condensed', sans-serif";
  L.forEach((n, i) => {
    const x = 40 + i * 38;
    ctx.fillStyle = n === 9 ? '#ff6a58' : '#efe4c8'; ctx.fillText(String(n), x, 64);
    for (let k = 0; k < 8; k++) { const amber = (n * 7 + k * 3) % 23 === 0; lamp(x, 90 + k * 20, n === 9 ? '#c0302a' : amber ? '#f2b56b' : '#5fd07a'); }
  });
  const CL = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  CL.forEach((n, i) => {
    const x = 830 + (i % 7) * 52, y0 = i < 7 ? 64 : 160;
    ctx.fillStyle = '#efe4c8'; ctx.fillText('C' + n, x, y0);
    for (let k = 0; k < 2; k++) lamp(x, y0 + 26 + k * 22, (n * 5 + k) % 17 === 0 ? '#f2b56b' : '#5fd07a');
  });
  ctx.fillStyle = '#2f5d5a'; ctx.fillRect(18, h - 52, w - 36, 2);
  ctx.fillStyle = '#efe4c8'; ctx.textAlign = 'left'; ctx.font = "600 22px 'Barlow Condensed', sans-serif";
  ctx.fillText('LOOP OUT 65.2 · RETURN 41.0 · LINE 9 SEALED, DAY 11', 24, h - 28);
  ctx.textAlign = 'right'; ctx.fillStyle = '#d6a640'; ctx.fillText('FEAST LINES: TRAY HALL 3 · STOCK ROOM 2 · BREW ROW 6', w - 24, h - 28);
}

// ---------------------------------------------------------------------------------------------------------------
// Curd Row: the yeast dairy behind glass. Casein, whey, and the curd for the feast's aged cheese. Lines skip a four.
// ---------------------------------------------------------------------------------------------------------------
function curdRow(game, s, f, R, r) {
  const g = s.g, { x0, x1, z0, z1, h } = CURD;
  const clip = [x0 - 0.2, -0.3, z0 - 0.2, x1 + 0.2, h + 0.2, z1 + 0.2];
  floor(s, x0, z0, x1, z1, 0, 'speckle', '#9fb5a6');
  ceiling(s, x0, z0, x1, z1, h, 'panel', '#e8e4d8');
  runX(x0, x1, 12, (a, b) => wall(s, a, z0, b, z0, 0, h, { mat: 'tile', tint: '#dfe6dc', skirt: '#7a8a80' }));
  wall(s, x0, z0, x0, z1, 0, h, { mat: 'tile', tint: '#dfe6dc', skirt: '#7a8a80' });
  wall(s, x1, z0, x1, z1, 0, h, { mat: 'tile', tint: '#dfe6dc', skirt: '#7a8a80' });
  // the glass onto the hall, with its mullions
  runX(CURD.glass[0], CURD.glass[1], 10, (a, b) => s.glass(a, 0.9, z1, b, 2.7, z1, { tint: '#dceae4', opacity: 0.1 }));
  s.structure(() => { g.mat('brushed', '#b9b4a8'); for (let x = CURD.glass[0]; x <= CURD.glass[1] + 0.01; x += 2.5) g.box(x - 0.04, 0.9, z1 - 0.05, x + 0.04, 2.7, z1 + 0.05); g.box(CURD.glass[0], 0.84, z1 - 0.12, CURD.glass[1], 0.9, z1 + 0.12); });
  // the pots: fourteen lines of two, numbered C1 to C15 with no C4
  const CL = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  CL.forEach((n, i) => {
    const x = -149 + i * 3, band = LINE_COL[(i + 2) % LINE_COL.length];
    for (const z of [-25.0, -20.6]) {
      prop(s, 'keelvats.pot', x, 0, z, 0, { band });
      s.structure(() => { g.at(x, 0, z, 0); glyphRing(g, R, 'C' + n, 0, 1.9, 0.735, 0.17, 0.26); g.pop(); });
    }
    if (i % 3 === 0) s.spot('work', x + 0.2, 0, -19.3, PI, { tags: ['crew', 'curd'] });
    if (i % 4 === 1) s.spot('work', x - 0.3, 0, -23.7, 0, { tags: ['notes', 'curd'] });
  });
  // benches along the back with lidded sample jars, a filtration skid at the far end, sacks of casein by the door
  for (let x = -147; x < -110; x += 6.5) {
    prop(s, 'keelvats.bench', x, 0, z0 + 0.45, 0, { w: 2.4, d: 0.6, h: 0.9 });
    s.detail(() => { for (let k = 0; k < 6; k++) { const jx = x - 1.0 + k * 0.38; g.mat('glaze', '#f3efe6', { rough: -0.4 }); g.cyl(jx, 0.9, z0 + 0.4, 0.05, 0.14, { segs: 10 }); g.mat('cast', LINE_COL[k % 6]); g.cyl(jx, 1.04, z0 + 0.4, 0.055, 0.025, { segs: 10 }); } });
    s.spot('work', x + 0.3, 0, z0 + 1.15, PI, { tags: ['notes', 'curd'] });
  }
  s.furniture(() => {
    g.mat('brushed', '#cfcdc6'); g.box(x0 + 0.3, 0, -26.5, x0 + 1.6, 0.3, -18.5, { bevel: 0.02 });
    for (let k = 0; k < 6; k++) { g.mat('plain', '#f3efe6'); g.tube([[x0 + 0.5 + (k % 2) * 0.6, 0.6 + Math.floor(k / 2) * 0.55, -26.2], [x0 + 0.5 + (k % 2) * 0.6, 0.6 + Math.floor(k / 2) * 0.55, -18.8]], 0.12, { segs: 10 }); }
    g.mat('brushed', '#b9b4a8'); for (const z of [-26.3, -22.5, -18.7]) g.box(x0 + 0.3, 0.3, z - 0.05, x0 + 1.6, 2.0, z + 0.05);
  });
  s.solid(x0 + 0.3, 0, -26.5, x0 + 1.6, 2.0, -18.5);
  for (let i = 0; i < 5; i++) prop(s, 'crate', x1 - 2.6 + (i % 3) * 0.7, Math.floor(i / 3) * 0.45, z0 + 1.0, 0.1 * i, { w: 0.6, h: 0.45, d: 0.6, wood: '#e8dcc0' });
  // the gowning corner inside the door: white coveralls on pegs, a basin, a red mat
  const gx = (CURD.door[0] + CURD.door[1]) / 2;
  for (let i = 0; i < 4; i++) prop(s, 'keelvats.coverall', x1 - 0.12, 0.42, -18.0 - i * 0.6, -PI / 2, { cloth: '#ecebe4', mend: ['#2f6f73', '#b5532e', '#c9962e', '#33407a'][i] });
  s.detail(() => { g.mat('rush', '#8a2f3c'); g.box(gx - 1.0, 0.002, z1 - 1.8, gx + 1.0, 0.012, z1 - 0.15, { faces: 'Y' }); g.mat('brushed', '#cfcdc6'); g.box(x1 - 0.6, 0.85, -21.6, x1 - 0.05, 0.93, -20.6, { bevel: 0.01 }); g.box(x1 - 0.5, 0, -21.5, x1 - 0.1, 0.85, -20.7); });
  s.solid(x1 - 0.6, 0, -21.6, x1, 0.93, -20.6);
  s.spot('work', x1 - 0.95, 0, -21.1, PI / 2, { tags: ['wash'] });
  // lamps: cold and even, the only room in the hall that is
  for (const x of [-144, -134, -124, -114]) lamp(s, 'panel', x, h, -22.8, { w: 2.4, d: 0.6, K: 4200, power: 0.9, clip });
  s.ambient({ box: clip, sky: '#e8f0ec', ground: '#a8c0b0', power: 0.3, lamp: true });
  // the hall side: a plate on the glass, the name over the door
  sign(s, { kind: 'street', text: 'Curd Row', sub: 'casein · whey · curd · lines C1 to C15, no C4', palette: ['#2f5d5a', '#f1ead8'] }, gx, 2.85, z1 + 0.1, { face: 'Z', w: 2.6, h: 0.5, glow: 0.5 });
  s.interact({ x: -130, y: 1.6, z: z1 + 0.6, radius: 2.2, prompt: 'Look through the glass', onUse: async (gm) => {
    await say(gm, 'Curd Row', [
      'A long white room, cool and quiet after the hall. Two rows of small polished pots, waist-high to the crews in their white coveralls, each with a coloured band and a number.',
      'Yeast in every pot, fed on methanol like the flour, making casein and whey and nothing else. A cheese that never met a cow starts here, as a powder in a sack.',
      'The numbers run C1, C2, C3, C5. There is no C4 in Curd Row, and no Line 4 in the hall either.',
    ]);
  } });
  s.interact({ x: gx, y: 1.4, z: z1 - 1.0, radius: 1.4, prompt: 'Read the gowning notice', onUse: async (gm) => {
    await say(gm, 'Curd Row · gowning', [
      'Clean side. Coverall, hair, hands, mat. One phage on a sleeve can cost a line a week: yeast regrows from library stock in about seven days, and the halls it feeds eat blight cheese till then.',
      'On the line numbers, since everyone asks: our yeasts came from Sorrel\'s strain library, and so did the numbering. Sorrel\'s Line Four has stood empty since its Count. Every drum that took its dairy yeasts skips a four.',
    ]);
  } });
  s.path([[gx, z1 + 1.6], [gx, z1 + 0.4], [gx, z1 - 1.0], [gx - 1.5, -22.8], [-125, -22.8], [-148, -22.8]]);
  s.path([[gx, z1 + 1.6], [-104, -8.7], [-96, -8.7]]);
  s.zoneBox({ id: 'keel-vats-curd', place: 'keel-vats', box: [x0, -0.5, z0, x1, h, z1], name: 'Curd Row', sub: 'The Flour Hall · the yeast dairy', ambience: 'quiet', reverb: 'room', headroom: h });
  s.loop('air', -128, 3.2, -22.5, { vol: 0.14, radius: 16 });
}

// ---------------------------------------------------------------------------------------------------------------
// the blight door, and the seed room behind it where Line 9 is regrowing
// ---------------------------------------------------------------------------------------------------------------
function seedRoom(game, s, f) {
  const g = s.g, { x0, x1, z0, z1, h } = SEED, bx = BLIGHT_X;
  const clip = [x0 - 0.2, -0.3, z0 - 0.1, x1 + 0.2, h + 0.2, z1 + 0.2];
  floor(s, x0, z0, x1, z1, 0, 'speckle', '#c9d2cc');
  ceiling(s, x0, z0, x1, z1, h, 'panel', '#e8e4d8');
  wall(s, x0, z1, x1, z1, 0, h, { mat: 'tile', tint: '#e6ebe6' });
  wall(s, x0, z0, x0, z1, 0, h, { mat: 'tile', tint: '#e6ebe6' });
  wall(s, x1, z0, x1, z1, 0, h, { mat: 'tile', tint: '#e6ebe6' });
  // the door: frosted glass in a red frame, sealed, with hazard paint round it
  door(s, { x: bx - 0.6, y: 0, z: HALL.z, w: 1.2, h: 2.25, along: 'x', style: 'glazed', tint: '#a8432e', mat: 'panel', locked: true, lockedText: 'Read the blight door', onLocked: (gm) => blightNotice(gm) });
  s.structure(() => {
    for (let i = 0; i < 12; i++) { g.mat('paint', i % 2 ? C.warn : '#262220'); const y = i * 0.22; g.box(bx - 0.95, y, HALL.z - 0.12, bx - 0.72, y + 0.22, HALL.z - 0.08); g.box(bx + 0.72, y, HALL.z - 0.12, bx + 0.95, y + 0.22, HALL.z - 0.08); }
    for (let i = 0; i < 9; i++) { g.mat('paint', i % 2 ? C.warn : '#262220'); g.box(bx - 0.95 + i * 0.211, 2.3, HALL.z - 0.12, bx - 0.95 + (i + 1) * 0.211, 2.52, HALL.z - 0.08); }
    g.mat('cast', C.brass); g.box(bx + 1.5, 1.12, HALL.z - 0.12, bx + 2.7, 1.2, HALL.z - 0.06); g.box(bx + 1.5, 2.0, HALL.z - 0.12, bx + 2.7, 2.08, HALL.z - 0.06);
  });
  s.glass(bx + 1.6, 1.2, HALL.z, bx + 2.6, 2.0, HALL.z, { tint: '#dceae4', opacity: 0.08 });
  sign(s, { kind: 'notice', title: 'Blight door', lines: ['Line 9 regrowing', 'from library stock', 'Gowned and named only', 'Do not open for steam,', 'for tea or for anybody'] }, bx - 1.45, 1.55, HALL.z - 0.13, { face: 'z', w: 0.42, h: 0.5 });
  // inside: the seed train, from vial to vat
  s.furniture(() => {
    // a cold cabinet of vials
    g.mat('panel', '#d9dcd6'); g.box(x0 + 0.2, 0, z1 - 1.0, x0 + 1.6, 1.9, z1 - 0.1, { bevel: 0.02 });
    g.mat('diffuser', '#9fd8ff', { emissive: 1.6 }); g.box(x0 + 0.35, 0.3, z1 - 1.01, x0 + 1.45, 1.75, z1 - 1.0, { faces: 'z' });
    // the shaker table with its flasks
    g.mat('brushed', '#cfcdc6'); g.box(x0 + 3.0, 0, z1 - 1.2, x0 + 5.6, 0.85, z1 - 0.2, { bevel: 0.01 });
    for (let i = 0; i < 6; i++) { const fx = x0 + 3.3 + (i % 3) * 0.8, fz = z1 - 0.95 + Math.floor(i / 3) * 0.5; g.mat('glaze', '#e8f0ec', { rough: -0.45 }); g.lathe(fx, fz, [[0, 0.85], [0.13, 0.85], [0.14, 0.9], [0.05, 1.08], [0.035, 1.2], [0, 1.2]], { segs: 12 }); g.mat('diffuser', '#f0c070', { emissive: 0.8 }); g.lathe(fx, fz, [[0, 0.86], [0.12, 0.86], [0.1, 0.93], [0, 0.93]], { segs: 10 }); }
  });
  s.solid(x0 + 0.2, 0, z1 - 1.0, x0 + 1.6, 1.9, z1); s.solid(x0 + 3.0, 0, z1 - 1.2, x0 + 5.6, 0.85, z1 - 0.2);
  prop(s, 'keelvats.pot', x1 - 2.2, 0, z1 - 2.6, PI, { band: '#c0302a' });
  prop(s, 'keelvats.bench', x1 - 4.6, 0, z0 + 1.0, PI, { w: 2.0, d: 0.6, h: 0.9 });
  lamp(s, 'panel', (x0 + x1) / 2, h, (z0 + z1) / 2, { w: 1.6, d: 0.6, K: 4500, power: 0.8, clip });
  s.ambient({ box: clip, sky: '#e8f0f4', ground: '#b8c8c0', power: 0.25, lamp: true });
  s.interact({ x: bx + 2.1, y: 1.6, z: HALL.z - 0.8, radius: 1.4, prompt: 'Look through the port', onUse: async (gm) => {
    await say(gm, 'The seed room', [
      'Through the port: a white room, a cabinet glowing cold blue, a shaker table of flasks the colour of weak tea, and one small pot with a red band.',
      'That is Line 9 now. A vial from the library, then the flasks, then the pot, then the eight vats out here, each a few hundred times bigger than the last. About twenty-seven doublings from vial to vat.',
    ]);
  } });
}
async function blightNotice(gm) {
  await say(gm, 'The blight door', [
    'Sealed. A notice on the glass: Line 9 regrowing from library stock. Gowned and named only. Do not open for steam, for tea or for anybody.',
    'Below it, the arithmetic in pencil: flour, three days from the vial. Yeast and fungi, a week. Cell lines for the cultivated meat, a month or more. Then steam the vats, and steam them again.',
    'A blight takes out one line, never the calories. The Mill carries the day. What it costs is the taste: a hall on the blight menu eats amino-acid broth where the flour would be, and remembers the year.',
  ]);
}

// ---------------------------------------------------------------------------------------------------------------
// the Kettle: where the 65 degree loop leaves for the city
// ---------------------------------------------------------------------------------------------------------------
function kettle(game, s, f) {
  const g = s.g, X0 = KET.x0, X1 = KET.x1, Z = KET.z, H = KET.h;
  const clip = [X0 - 0.3, -0.3, -Z - 0.2, X1 + 0.2, H + 0.2, Z + 0.2];
  floor(s, X0, -Z, X1, Z, 0, 'tile', '#9a5a40', { matOpts: { rough: -0.25 } });
  ceiling(s, X0, -Z, X1, Z, H, 'panel', '#3b4446');
  const kw = { mat: 'panel', tint: '#e2cfa4', dado: { h: 2.4, mat: 'tile', tint: '#2f6f73' }, skirt: '#3a3430' };
  wall(s, X0, -Z, X1, -Z, 0, H, kw); wall(s, X0, Z, X1, Z, 0, H, kw); wall(s, X1, -Z, X1, Z, 0, H, kw);
  s.structure(() => { g.mat('paint', '#a8432e'); for (const zs of [-1, 1]) g.box(X0 + 0.1, 2.4, zs * (Z - 0.09), X1 - 0.1, 2.62, zs * (Z - 0.08) - zs * 0.02, { faces: zs > 0 ? 'z' : 'Z' }); g.box(X1 - 0.1, 2.4, -Z, X1 - 0.08, 2.62, Z, { faces: 'x' }); });
  // the hall's spinward end wall: solid at the sides, an arch into the Kettle, a long window above it
  const ew = { mat: 'panel', tint: '#2f5d5a', tintA: '#e2cfa4', dado: { h: 2.4, mat: 'tile', tint: '#d8d0b4' }, skirt: '#3a3430' };
  wall(s, X0, -HALL.z, X0, -8, 0, H, ew); wall(s, X0, 8, X0, HALL.z, 0, H, ew);
  wall(s, X0, -8, X0, 8, 0, 5.5, Object.assign({}, ew, { openings: [{ at: 4, w: 8, h: 4.6 }] }));
  wall(s, X0, -8, X0, 8, 9.8, H - 9.8, Object.assign({}, ew, { dado: null, skirt: false }));
  s.glass(X0, 5.5, -8, X0, 9.8, 8, { tint: '#f0dcc0', opacity: 0.1 });
  s.structure(() => { g.mat('cast', '#3d4245'); for (let z = -8; z <= 8.01; z += 2) g.box(X0 - 0.06, 5.5, z - 0.05, X0 + 0.06, 9.8, z + 0.05); g.box(X0 - 0.1, 7.6, -8, X0 + 0.1, 7.68, 8); });
  sign(s, { kind: 'letters', text: 'The Kettle', palette: ['#f6e2b8'] }, X0 - 0.06, 5.0, 0, { face: 'x', w: 5.2, h: 0.75, glow: 1.6 });
  sign(s, { kind: 'letters', text: '65 · UP TO THE CITY', font: 'caps', palette: ['#ff9a6a'] }, X0 - 0.06, 10.15, 0, { face: 'x', w: 6, h: 0.5, glow: 1.8 });
  // the exchangers and the great pipes rising from them through the roof
  for (const p of [[177, -6.6], [186, -6.6], [177, 6.6], [186, 6.6]]) prop(s, 'keelvats.exchanger', p[0], 0, p[1], 0, { plates: 36 });
  for (const zs of [-1, 1]) {
    const zc = zs * 7.9;
    s.structure(() => {
      for (const q of [[174.2, C.loop, 0.5], [175.5, C.ret, 0.45], [183.2, C.loop, 0.5], [184.5, C.ret, 0.45]]) {
        g.mat('cast', q[1], { rough: -0.1 }); g.tube([[q[0], 1.9, zs * 6.6], [q[0], 1.9, zc - zs * 0.3], [q[0], 2.4, zc], [q[0], H, zc]], q[2], { segs: 16, caps: false });
        g.mat('cast', C.strap); for (const y of [3, 5, 7, 9]) g.tube([[q[0], y - 0.05, zc], [q[0], y + 0.05, zc]], q[2] + 0.04, { segs: 16 });
        g.mat('cast', C.brass); g.cyl(q[0], H - 0.25, zc, q[2] + 0.12, 0.25, { segs: 16 });
      }
    });
    sign(s, { kind: 'label', text: zs < 0 ? '65 · TO THE CITY' : '41 · BACK FROM THE CITY', ink: '#f1e6c9' }, 179, 3.2, zs * (Z - 0.1), { face: zs < 0 ? 'Z' : 'z', w: 2.4, h: 0.3 });
  }
  // the gauge board and the tap on the back wall, the cab berths beside them
  s.furniture(() => {
    g.mat('wood', '#5b4636'); g.box(X1 - 0.12, 1.3, -6.2, X1 - 0.02, 2.6, -3.8, { bevel: 0.01 });
    for (let i = 0; i < 6; i++) {
      const z = -5.8 + (i % 3) * 0.8, y = 1.65 + Math.floor(i / 3) * 0.6;
      g.mat('cast', C.brass, { rough: -0.2 }); g.push(); g.move(X1 - 0.12, y, z); g.rotZ(PI / 2); g.cyl(0, 0, 0, 0.22, 0.08, { segs: 16 }); g.pop();
      g.mat('paint', C.cream, { emissive: 0.5 }); g.box(X1 - 0.21, y - 0.17, z - 0.17, X1 - 0.2, y + 0.17, z + 0.17, { faces: 'x' });
      g.mat('paint', '#a63c28'); g.box(X1 - 0.215, y - 0.01, z - 0.13, X1 - 0.212, y + 0.01, z + 0.02, { faces: 'x' });
    }
  });
  prop(s, 'keelvats.tap', X1 - 0.1, 0, 4.4, -PI / 2, {});
  // the kettle the room is named for: copper, dented, on its own stand by the tap
  s.detail(() => {
    g.mat('cast', '#3a3430'); g.box(X1 - 0.75, 0, 3.2, X1 - 0.15, 0.85, 3.8, { faces: 'xXzZY' });
    g.mat('cast', '#b8733a', { rough: -0.25 }); g.lathe(X1 - 0.45, 3.5, [[0, 0.85], [0.2, 0.86], [0.24, 0.96], [0.23, 1.08], [0.16, 1.16], [0.06, 1.2], [0.06, 1.24], [0, 1.25]], { segs: 16 });
    g.tube([[X1 - 0.45, 0.92, 3.3], [X1 - 0.45, 1.02, 3.12], [X1 - 0.45, 1.1, 3.06]], [0.04, 0.03, 0.02], { segs: 6 });
    g.mat('wood', '#2a2622'); g.tube([[X1 - 0.45, 1.14, 3.32], [X1 - 0.45, 1.36, 3.42], [X1 - 0.45, 1.38, 3.58], [X1 - 0.45, 1.14, 3.68]], 0.018, { segs: 5 });
  });
  s.solid(X1 - 0.75, 0, 3.2, X1 - 0.15, 0.85, 3.8);
  // headers across the roof joining the exchangers, valve wheels on the risers
  s.structure(() => {
    for (const q of [[6.4, C.loop, 0.3], [7.2, C.ret, 0.26]]) { g.mat('cast', q[1], { rough: -0.1 }); g.tube([[178.8, q[0], -7.9], [178.8, q[0], 0], [178.8, q[0], 7.9]], q[2], { segs: 12, caps: false }); g.tube([[187.8, q[0], -7.9], [187.8, q[0], 0], [187.8, q[0], 7.9]], q[2], { segs: 12, caps: false }); }
    g.mat('cast', C.strap); for (const x of [178.8, 187.8]) for (const z of [-4, 0, 4]) g.box(x - 0.05, 6.0, z - 0.05, x + 0.05, H, z + 0.05);
  });
  s.detail(() => {
    for (const p of [[174.2, -7.0], [183.2, -7.0], [174.2, 7.0], [183.2, 7.0]]) { g.mat('cast', C.brass); g.tube([[p[0], 2.3, p[1]], [p[0], 2.75, p[1]]], 0.04, { segs: 6 }); g.mat('cast', '#a63c28'); g.push(); g.move(p[0], 2.75, p[1]); g.lathe(0, 0, [[0.3, -0.02], [0.32, 0], [0.3, 0.02]], { segs: 18, capTop: false, capBottom: false }); for (let i = 0; i < 3; i++) { const a = i * PI / 3; g.tube([[Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3], [-Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]], 0.012, { segs: 4 }); } g.pop(); }
  });
  // the circulating pumps in the middle of the floor: two motors on plinths, their pipes up to the headers
  for (const pz of [-2.2, 2.2]) {
    block(s, 179.6, 0, pz - 0.7, 184.4, 0.3, pz + 0.7, 'concrete', '#8b8478');
    s.furniture(() => {
      g.mat('paint', '#2f5d5a'); g.push(); g.move(182.8, 0.95, pz); g.rotZ(PI / 2); g.cyl(0, -1.0, 0, 0.45, 1.6, { segs: 16 }); g.pop();
      g.mat('cast', '#3d4245'); for (let k = 0; k < 8; k++) { g.push(); g.move(182.8, 0.95, pz); g.rotX(k * PI / 4); g.box(-1.0, 0.43, -0.03, 0.6, 0.5, 0.03); g.pop(); }
      g.mat('cast', pz < 0 ? C.loop : C.ret, { rough: -0.1 }); g.lathe(180.6, pz, [[0.5, 0.3], [0.55, 0.5], [0.55, 1.3], [0.4, 1.5], [0.2, 1.6]], { segs: 16 });
      g.tube([[180.6, 1.5, pz], [180.6, 6.4 + (pz > 0 ? 0.8 : 0), pz], [178.8, 6.4 + (pz > 0 ? 0.8 : 0), pz]], 0.22, { segs: 12 });
      g.mat('cast', C.strap); g.box(181.0, 0.3, pz - 0.5, 181.8, 1.0, pz + 0.5);
    });
    s.solid(179.6, 0, pz - 0.7, 184.4, 1.5, pz + 0.7);
  }
  sign(s, { kind: 'plate', text: 'Pumps 1 and 2', lines: ['one runs, one rests', 'swap on the first of the month'] }, 184.45, 0.75, 0, { face: 'X', w: 0.4, h: 0.2 });
  sign(s, { kind: 'hanging', text: 'The Kettle', emblem: 'cup', palette: ['#f0e2c0', '#2d3b36', '#a8432e'] }, 182, 3.2, 0, { face: 'x', double: true, w: 0.9, h: 0.9 });
  s.structure(() => { g.mat('cast', '#2c3133'); for (const dz of [-0.3, 0.3]) g.tube([[182, 3.65, dz], [182, H, dz]], 0.012, { segs: 4 }); });
  prop(s, 'bench', X1 - 3.4, 0, 6.0, PI, { w: 2.2, wood: '#7a5233', back: false });
  s.detail(() => { g.mat('cast', '#3a3430'); g.box(X1 - 0.45, 0.9, 5.0, X1 - 0.08, 0.94, 5.9); for (let i = 0; i < 4; i++) { g.mat('glaze', ['#2f6f73', '#b5532e', '#e9e1cf', '#c9962e'][i]); g.lathe(X1 - 0.27, 5.15 + i * 0.22, [[0, 0.94], [0.045, 0.94], [0.05, 1.04], [0, 1.04]], { segs: 10 }); } });
  berths(game, s, f, X1 - 0.08, 0, -PI / 2, 'keel-vats-kettle', clip);
  // light: bright and warm, so the end of the hall shines
  s.light({ at: [X0 + 3, 8.6, 0], to: [X1 - 3, 8.6, 0], type: 'tube', color: [1.0, 0.78, 0.55], power: 40, range: 16, radius: 0.5, shadow: true, clip });
  for (const z of [-4.5, 4.5]) lamp(s, 'globe', 181, 4.2, z, { K: 2700, power: 1.4, drop: 6.0, r: 0.25, clip });
  s.ambient({ box: clip, sky: '#ffcf96', ground: '#b5603e', power: 0.32, lamp: true });
  s.glowCard(X0 + 0.3, 7.6, 0, { face: 'x', color: '#ffd9a0', size: 14, strength: 0.06, follow: 'lamps' });
  // people and walkways
  s.spot('work', X1 - 0.8, 0, -5.0, PI / 2, { tags: ['notes', 'kettle'] });
  s.spot('work', 181, 0, -5.4, PI, { tags: ['crew', 'kettle'] });
  s.spot('sit', X1 - 3.4, 0.46, 5.95, PI, { tags: ['kettle'] });
  s.path([[HALL.x1 - 2, 0], [X0 + 1, 0], [X1 - 2, 0], [X1 - 1.5, -2.2]]); s.path([[X1 - 2, 0], [X1 - 1.5, 2.2]]); s.path([[X0 + 4, 0], [X0 + 6, -5]]);
  // things to do: the gauges, the tap
  s.interact({ x: X1 - 0.8, y: 1.9, z: -5.0, radius: 1.6, prompt: 'Read the gauges', onUse: async (gm) => {
    await say(gm, 'The Kettle', [
      'Six brass dials. LOOP OUT: sixty-five degrees, steady. RETURN: forty-one. The difference is every bath and kitchen tap and warm floor between here and the decks above.',
      'The food plant throws off about a third of a kilowatt of heat for every person in the drum, at around sixty degrees. For Chervil that is near seventy million kilowatts, and this is one of the doors it leaves by.',
      'Pinned under the glass, a card in a careful hand: The vats do the cooking. The city does the eating. We just mind the kettle.',
    ]);
  } });
  s.interact({ x: X1 - 0.7, y: 1.2, z: 4.4, radius: 1.3, prompt: 'Draw a cup from the 65 tap', onUse: async (gm) => {
    sfx(gm, 'pour', f, X1 - 0.4, 1.2, 4.4);
    await say(gm, 'The 65 tap', [
      'Straight off the loop. Every kitchen in Chervil holds its pots and brews its tea on water like this, for nothing, and only pays when it wants something seared.',
      'You drink it with a lid on, standing up, watching the pipes go up through the roof.',
    ]);
  } });
  s.zoneBox({ id: 'keel-vats-kettle', place: 'keel-vats', box: [X0, -0.5, -Z, X1, H, Z], name: 'The Kettle', sub: 'The Flour Hall · where the loop leaves for the city', ambience: 'station', reverb: 'ring', headroom: H });
  s.loop('tide', 180, 4, 0, { vol: 0.3, radius: 18 });
}
