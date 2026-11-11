// The two ends of the Loop Hall: at the anti end the cab lobby, the Watch Room and the crew room; at the spinward end
// the Taps, where the 65 degree loop leaves for the nine rings. Frame 'keel-heat' (see lm_keel_heat.js).
import { floor, ceiling, wall, lamp } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PI, HALL, END, TAPS, MAIN, C, say, sfx, tick, wheel, dial } from './lm_keel_heat_props.js';

const RH = END.h, XA = END.x0, XH = HALL.x0, Z = HALL.z;
const RINGS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const RING_COL = ['#b5532e', '#33407a', '#2f6f73', '#6b7a3a', '#c9962e', '#8a2f3c', '#a8432e', '#5b4060', '#2c5a55', '#3a3430'];

export async function buildEnds(game, s, f, r) {
  antiShell(s);
  lobby(game, s, f);
  await tick(game);
  watchRoom(game, s, f);
  crewRoom(game, s, f, r);
  await tick(game);
  taps(game, s, f, r);
}

// Two berth doors on a wall, their call buttons and the cab stop's interact. (x, z): the wall's centre, yaw: the way they face.
function berths(s, x, z, yaw, stopId) {
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
    s.spot('stand', px + fx * 1.1, 0, pz + fz * 1.1, yaw + PI, { tags: ['wait'] });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the anti end block: three rooms under the hall's end wall, and the end wall above them
// ---------------------------------------------------------------------------------------------------------------
function antiShell(s) {
  const g = s.g;
  floor(s, XA, -Z, XH, -4.5, 0, 'speckle', '#5d4a3c');                            // the crew room
  floor(s, XA, -4.5, XH, 4.5, 0, 'terrazzo', '#c9bca2');                           // the lobby
  floor(s, XA, 4.5, XH, Z, 0, 'planks', '#7a5a3a');                                // the Watch Room
  ceiling(s, XA, -Z, XH, -4.5, RH, 'plaster', '#e6d8bc');
  ceiling(s, XA, -4.5, XH, 4.5, RH, 'panel', '#d9cfb8');
  ceiling(s, XA, 4.5, XH, Z, RH, 'felt', '#6b2c28');
  // the hall side, low: the crew room's door, the lobby open, the Watch Room's long window
  const hallSide = { mat: 'block', tintA: '#cdb58a', dado: { h: 2.4, mat: 'tile', tint: '#24413f' }, skirt: '#2a2622' };
  wall(s, XH, -Z, XH, -4.5, 0, RH, Object.assign({}, hallSide, { tintB: '#d8c39a', openings: [{ at: 9.0, w: 1.2, h: 2.3 }] }));
  wall(s, XH, 4.5, XH, Z, 0, RH, Object.assign({}, hallSide, { tintB: '#e2d2b0', openings: [{ at: 0.9, w: 9.2, h: 1.9, sill: 0.9 }] }));
  s.glass(XH, 0.9, 5.4, XH, 2.8, 14.6, { tint: '#e6e0d0', opacity: 0.1 });
  s.structure(() => {
    g.mat('cast', '#3d4245'); for (let z = 5.4; z <= 14.61; z += 2.3) g.box(XH - 0.05, 0.9, z - 0.04, XH + 0.05, 2.8, z + 0.04);
    g.mat('wood', '#5b4636'); g.box(XH - 0.3, 0.86, 5.4, XH + 0.12, 0.92, 14.6);
    // the lobby's open front: a steel lintel and two posts, painted
    g.mat('cast', '#7a2e24'); g.box(XH - 0.2, RH - 0.4, -4.6, XH + 0.2, RH, 4.6, { bevel: 0.02 }); for (const z of [-4.5, 4.5]) g.box(XH - 0.18, 0, z - 0.18, XH + 0.18, RH, z + 0.18, { bevel: 0.02 });
  });
  // the end wall above, seen down the whole hall: its name, the two numbers
  wall(s, XH, -Z, XH, Z, RH, HALL.h - RH, { mat: 'block', tintA: '#cdb58a', tintB: '#cdb58a', skirt: false });
  sign(s, { kind: 'letters', text: 'The Loop Hall', palette: ['#f1e6c9'] }, XH + 0.06, 7.4, 0, { face: 'X', w: 15, h: 2.3, glow: 1.0 });
  sign(s, { kind: 'letters', text: '65 OUT · 41 BACK · NOTHING WASTED', font: 'caps', palette: ['#f2b56b'] }, XH + 0.06, 5.5, 0, { face: 'X', w: 11, h: 0.62, glow: 0.9 });
  sign(s, { kind: 'street', text: 'Cabs · the Loop Hall', sub: 'the Watch Room · the crew room', palette: ['#22302c', '#f1ead8'] }, XH + 0.06, RH + 0.45, 0, { face: 'X', w: 3.2, h: 0.62, glow: 0.8 });
  // the back wall and the two ends
  wall(s, XA, -Z, XA, -4.5, 0, RH, { tint: '#d8c39a', dado: { h: 1.0, mat: 'tile', tint: '#2f6f73' } });
  wall(s, XA, -4.5, XA, 4.5, 0, RH, { tint: '#d9cfb8', dado: { h: 1.2, mat: 'panel', tint: '#7a2e24' } });
  wall(s, XA, 4.5, XA, Z, 0, RH, { tint: '#e2d2b0', dado: { h: 1.0, mat: 'wood', tint: '#5b4636' } });
  wall(s, XA, -Z, XH, -Z, 0, RH, { tint: '#d8c39a', dado: { h: 1.0, mat: 'tile', tint: '#2f6f73' } });
  wall(s, XA, Z, XH, Z, 0, RH, { tint: '#e2d2b0', dado: { h: 1.0, mat: 'wood', tint: '#5b4636' } });
  wall(s, XA, -4.5, XH, -4.5, 0, RH, { tintA: '#d9cfb8', tintB: '#d8c39a', dado: { h: 1.2, mat: 'panel', tint: '#7a2e24' }, openings: [{ at: 3.4, w: 1.4, h: 2.3 }] });
  wall(s, XA, 4.5, XH, 4.5, 0, RH, { tintA: '#e2d2b0', tintB: '#d9cfb8', dado: { h: 1.2, mat: 'panel', tint: '#7a2e24' }, openings: [{ at: 5.6, w: 1.2, h: 2.3 }] });
  // the outside of the block's roof, seen from the hall: a cornice
  s.structure(() => { g.mat('cast', '#3d4245'); g.box(XH, RH, -Z, XH + 0.35, RH + 0.25, Z); });
}

// ---------------------------------------------------------------------------------------------------------------
// the cab lobby: where you arrive. Berths on the back wall, the hall straight ahead through the open front.
// ---------------------------------------------------------------------------------------------------------------
function lobby(game, s, f) {
  const g = s.g, clip = [XA - 0.2, -0.3, -4.7, XH + 3, RH + 0.2, 4.7];
  berths(s, XA + 0.08, 0, PI / 2, 'keel-heat');
  prop(s, 'bench', XA + 4.2, 0, -3.9, 0, { w: 2.2, wood: '#7a5233', back: true });
  prop(s, 'bench', XA + 4.2, 0, 3.9, PI, { w: 2.2, wood: '#6b4a2f', back: true });
  s.detail(() => { g.mat('rush', '#6b5a3a'); g.box(XH - 3.0, 0.002, -2.4, XH - 0.4, 0.012, 2.4, { faces: 'Y' }); });
  // a notice by the berths: what this place is, for visitors
  sign(s, { kind: 'notice', title: 'Visitors', lines: ['The Loop Hall is open to anyone.', 'Keep to the red aisle and the catwalk.', 'Do not touch a riser without a glove.', 'The Watch Room has a kettle on.', 'The Gin Kitchen sells nothing to you.', 'Cabs from here and from the Taps.'] }, XA + 0.1, 1.6, -0.0, { face: 'X', w: 0.62, h: 0.82 });
  sign(s, { kind: 'poster', title: 'Sixty-five', lines: ['every bath', 'every kitchen tap', 'for nothing'], motif: 'cup', palette: ['#7a2e24', '#f6e2b8', '#f2b56b'] }, XA + 9, 1.75, -4.4, { face: 'Z', w: 0.7, h: 1.0 });
  sign(s, { kind: 'poster', title: 'Gloves on the risers', lines: ['sixty-five degrees', 'is too hot to hold'], motif: 'drop', palette: ['#24413f', '#f3e6c8', '#ff9a6a'] }, XA + 12, 1.75, -4.4, { face: 'Z', w: 0.7, h: 1.0 });
  sign(s, { kind: 'poster', title: 'Lids on', lines: ['heliox takes the heat', 'four times as fast'], motif: 'ladle', palette: ['#2f4d6e', '#f3e6c8', '#f2c879'] }, XA + 10.5, 1.75, 4.4, { face: 'z', w: 0.7, h: 1.0 });
  lamp(s, 'panel', XA + 3.5, RH, 0, { w: 2.4, d: 0.6, K: 3000, power: 0.9, clip });
  lamp(s, 'panel', XA + 9.5, RH, 0, { w: 2.4, d: 0.6, K: 3000, power: 0.7, clip });
  s.ambient({ box: clip, sky: '#ffdcae', ground: '#c9a57c', power: 0.2, lamp: true });
  for (const p of [[XH + 3.2, -7.4, 0.7], [XH + 3.9, -6.6, -2.3], [XH + 4.3, -7.8, -0.8]]) s.spot('chat', p[0], 0, p[1], p[2], { tags: ['shift'] });
  s.path([[XA + 1.5, -2.2], [XA + 2.6, 0], [XA + 6, 0], [XH - 1, 0], [XH + 1, 0]]);
  s.path([[XA + 1.5, 2.2], [XA + 2.6, 0]]);
  s.path([[XA + 6, 0], [XA + 4.1, -2.5], [XA + 4.1, -5.6]]);
  s.path([[XA + 6, 0], [XA + 6.2, 2.5], [XA + 6.2, 5.6]]);
  s.zoneBox({ id: 'keel-heat-lobby', place: 'keel-heat', box: [XA, -0.5, -4.5, XH, RH, 4.5], name: 'Loop Hall cabs', sub: 'The Keel · deck 3 · Ring Seven', ambience: 'station', reverb: 'room', headroom: RH });
  void game; void f;
}

// ---------------------------------------------------------------------------------------------------------------
// the Watch Room: a desk at the window over the hall, a board of temperatures, the kettle
// ---------------------------------------------------------------------------------------------------------------
function watchRoom(game, s, f) {
  const g = s.g, z0 = 4.5, clip = [XA - 0.2, -0.3, z0 - 0.2, XH + 0.4, RH + 0.2, Z + 0.2];
  prop(s, 'keelheat.desk', XH - 1.0, 0, 9.9, -PI / 2, { w: 7 });
  for (const z of [7.6, 10.2, 12.4]) { prop(s, 'chair', XH - 1.9, 0, z, PI / 2, { wood: '#5b4636', back: 'slat' }, { noSpots: true }); s.spot('work', XH - 1.9, 0.45, z, PI / 2, { tags: ['write', 'watch'] }); }
  // the board of temperatures on the back wall
  const temps = { kind: 'board', title: 'The loop tonight', lines: ['Out to the rings|65', 'Back from the rings|41', 'Vat water in|69', 'Vat water home|47', 'Moat water in|4', 'Hall air|30', 'Exchangers on|29 of 32', 'Sent on to the back axle|5 parts in 6'], palette: ['#24413f', '#f3e6c8', '#f2b56b'] };
  sign(s, temps, XA + 0.12, 1.95, 9.8, { face: 'X', w: 2.8, h: 1.9 });
  s.interact({ x: XA + 1.1, y: 1.6, z: 9.8, radius: 1.8, prompt: 'Read the board of temperatures', onUse: async (gm) => {
    await say(gm, 'The loop tonight', [
      'Out to the rings, sixty-five. Back from the rings, forty-one. Every degree between is somebody\'s bath, somebody\'s held pot, a warm floor in a nursery.',
      'Why sixty-five: it is as hot as the vats can give it and still cool enough to send through a city without scalding anyone who opens a tap. Kitchens hold and brew on it for nothing, and only pay when they want something seared.',
      'Bottom line: sent on to the back axle, five parts in six. The city cannot use it all. It goes on along the Keel and out of the drum by the back axle as ammonia, with the rest of the drum\'s heat: about a hundred and sixty gigawatts, a river\'s worth.',
    ]);
  } });
  // the kettle, on its own little shelf beside the 65 tap
  s.detail(() => {
    g.mat('wood', '#5b4636'); g.box(XA + 4.5, 0.92, Z - 0.5, XA + 6.3, 0.96, Z - 0.08, { bevel: 0.01 });
    g.mat('cast', '#3a3430'); for (const x of [XA + 4.6, XA + 6.2]) g.box(x - 0.02, 0.6, Z - 0.3, x + 0.02, 0.92, Z - 0.1);
    g.mat('cast', C.loop); g.tube([[XA + 5.9, 0, Z - 0.12], [XA + 5.9, 1.3, Z - 0.12], [XA + 5.9, 1.3, Z - 0.3]], 0.04, { segs: 8 });
    g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[XA + 5.9, 1.3, Z - 0.3], [XA + 5.9, 1.34, Z - 0.38], [XA + 5.9, 1.24, Z - 0.42]], 0.022, { segs: 6 });
    g.box(XA + 5.84, 1.38, Z - 0.34, XA + 5.96, 1.4, Z - 0.28);
  });
  prop(s, 'keelheat.kettle', XA + 5.1, 0.96, Z - 0.3, PI, {});
  for (let i = 0; i < 4; i++) prop(s, 'cup', XA + 4.6 + i * 0.13, 0.96, Z - 0.2, 0, { glaze: ['#2f6f73', '#b5532e', '#e9e1cf', '#c9962e'][i] });
  s.interact({ x: XA + 5.2, y: 1.2, z: Z - 0.9, radius: 1.5, prompt: 'Put the kettle on', onUse: async (gm) => {
    sfx(gm, 'pour', f, XA + 5.9, 1.2, Z - 0.4);
    if (gm.journal) gm.journal.find('loop-tap');
    await say(gm, 'The Watch Room kettle', [
      'You fill it from the red tap. The water comes out at sixty-five degrees, already most of the way there, and the little element under the kettle has only thirty-five degrees left to do.',
      'Boiling a litre this way costs about 0.045 kWh. From the cold tap it would be twice that. This is why every kettle in Chervil is fed from the loop, and why nobody in Chervil thinks about it.',
      'A card propped against the cups, in a round hand: The watch makes the tea. Visitors may drink it. Lids on, please, it cools four times as fast in this air.',
    ]);
  } });
  // a felt hanging to quiet the room, a shelf of log books, a desk lamp or two
  s.detail(() => {
    g.mat('felt', '#c9962e'); g.box(XA + 0.05, 0.4, 5.2, XA + 0.1, 3.4, 7.8);
    g.mat('knit', '#a8432e'); g.box(XA + 0.1, 1.3, 6.0, XA + 0.12, 1.5, 6.6, { faces: 'X' });
    g.mat('wood', '#5b4636'); for (const y of [1.2, 1.6, 2.0, 2.4]) g.box(XA + 0.05, y, 11.6, XA + 0.4, y + 0.03, 14.6);
    const cols = ['#7a2e24', '#24413f', '#2f4d6e', '#c9962e', '#5b4060'];
    for (let k = 0; k < 4; k++) for (let i = 0; i < 26; i++) { g.mat('paper', cols[(i * 3 + k) % 5]); const z = 11.7 + i * 0.11; g.box(XA + 0.08, 1.23 + k * 0.4, z, XA + 0.34, 1.23 + k * 0.4 + 0.24 + ((i * 7) % 5) * 0.015, z + 0.09); }
  });
  // on the partition wall: the watch's clock and a drawing of the loop, framed
  s.detail(() => {
    const cx = -147.5, cz = 4.5 + 0.1;
    g.mat('wood', '#3b2a1e'); g.push(); g.move(cx, 2.55, cz); g.rotX(PI / 2); g.cyl(0, -0.04, 0, 0.3, 0.06, { segs: 20 }); g.pop();
    g.mat('paint', '#efe4c8', { emissive: 0.25 }); g.box(cx - 0.24, 2.31, cz + 0.02, cx + 0.24, 2.79, cz + 0.025, { faces: 'Z' });
    g.mat('paint', '#2a2622'); g.box(cx - 0.012, 2.55, cz + 0.026, cx + 0.012, 2.74, cz + 0.03, { faces: 'Z' }); g.box(cx, 2.545, cz + 0.026, cx + 0.15, 2.565, cz + 0.03, { faces: 'Z' });
  });
  sign(s, { kind: 'poster', title: 'The loop, drawn', lines: ['vats to exchangers', 'exchangers to the taps', 'taps to every ring', 'and back at forty-one'], motif: 'drum', palette: ['#24413f', '#f3e6c8', '#f2b56b'] }, -144.5, 1.75, 4.5 + 0.1, { face: 'Z', w: 0.9, h: 1.25 });
  for (const z of [6.4, 13.2]) lamp(s, 'globe', XH - 1.5, 2.1, z, { K: 2600, power: 0.8, drop: 1.6, r: 0.13, clip, lampFlag: false });
  lamp(s, 'panel', XA + 4, RH, 9.8, { w: 1.6, d: 0.6, K: 2800, power: 0.6, clip, lampFlag: false });
  s.ambient({ box: clip, sky: '#ffd2a0', ground: '#a8743e', power: 0.18, lamp: false });
  s.spot('sit', XA + 3.0, 0.46, Z - 1.2, PI, { tags: ['tea', 'watch'] });
  prop(s, 'stool', XA + 3.0, 0, Z - 1.2, 0, { wood: '#6b4a2f' }, { noSpots: true });
  s.spot('stand', XA + 5.2, 0, Z - 1.0, 0, { tags: ['tea'] });
  s.path([[XA + 6.2, 5.6], [XA + 6.2, 8], [XH - 2.6, 8], [XH - 2.6, 13]]);
  s.path([[XA + 6.2, 8], [XA + 5.2, 13.6]]);
  s.zoneBox({ id: 'keel-heat-watch', place: 'keel-heat', box: [XA, -0.5, z0, XH, RH, Z], name: 'The Watch Room', sub: 'The Loop Hall · the desk over the hall', ambience: 'shop', reverb: 'felt', headroom: RH });
  s.loop('hum-lamp', XH - 1, 1, 9.9, { vol: 0.12, radius: 6 });
  void game;
}

// ---------------------------------------------------------------------------------------------------------------
// the crew room: lockers, coveralls on pegs, a long table with a pot under a lid, the shift board
// ---------------------------------------------------------------------------------------------------------------
function crewRoom(game, s, f, r) {
  const g = s.g, clip = [XA - 0.2, -0.3, -Z - 0.2, XH + 0.4, RH + 0.2, -4.3];
  prop(s, 'keelheat.lockers', XA + 7.5, 0, -Z + 0.35, 0, { n: 14, paint: '#2c5a55' });
  const CLOTH = ['#7a2e24', '#2f4d6e', '#7a2e24', '#6b7a3a', '#7a2e24', '#2c5a55', '#7a2e24', '#c9962e'];
  const MEND = ['#d6a640', '#7fe08a', '#2f6f73', '#f2b56b', '#3fe0d0', '#d6a640', '#b5532e', '#2f4d6e'];
  s.detail(() => { g.mat('wood', '#5b4636'); g.box(XA + 0.08, 1.92, -13.6, XA + 0.14, 2.02, -6.4); g.mat('cast', C.brass); for (let i = 0; i < 8; i++) g.cyl(XA + 0.2, 1.9, -13.2 + i * 0.95, 0.015, 0.1, { segs: 5 }); });
  CLOTH.forEach((c, i) => prop(s, 'keelheat.coverall', XA + 0.2, 0.42, -13.2 + i * 0.95, PI / 2, { cloth: c, mend: MEND[i] }));
  prop(s, 'table', XA + 9, 0, -9.6, 0, { w: 4.2, d: 0.9, wood: '#6b4a2f', legs: 'trestle' });
  prop(s, 'bench', XA + 9, 0, -10.55, 0, { w: 3.8, wood: '#7a5233' });
  prop(s, 'bench', XA + 9, 0, -8.65, PI, { w: 3.8, wood: '#6b4a2f' });
  prop(s, 'bowl', XA + 8.2, 0.74, -9.6, 0, { glaze: '#e9e1cf', lid: '#a8432e', r: 0.16 });
  for (let i = 0; i < 5; i++) prop(s, 'cup', XA + 7.4 + i * 0.5, 0.74, -9.6 + (i % 2 ? 0.25 : -0.25), 0, { glaze: ['#2f6f73', '#c9962e', '#e9e1cf', '#7a2e24', '#2f4d6e'][i] });
  const shifts = { kind: 'chalk', title: 'Shifts', lines: ['Six to two · two to ten · ten to six', 'No. 14 and 22 opened for gaskets', 'Ring Two riser: lagging off, mind', 'Gin Kitchen wants a hand Thursday', 'Salt to Ring Three by noon', 'Gloves on the risers. Always.'] };
  sign(s, shifts, XA + 13.5, 1.65, -4.68, { face: 'z', w: 1.5, h: 1.05 });
  s.interact({ x: XA + 13.5, y: 1.4, z: -5.4, radius: 1.5, prompt: 'Read the shift board', onUse: async (gm) => {
    await say(gm, 'The shift board', [
      'Shifts: six to two, two to ten, ten to six. Exchangers 14 and 22 opened for gaskets. Ring Two riser: lagging off for mending, mind your hands.',
      'Under it, in a different chalk: the loop does not stop for anything. When a pack is opened, the others take its share, and the baths upstairs never know.',
    ]);
  } });
  lamp(s, 'panel', XA + 9, RH, -9.6, { w: 2.4, d: 0.6, K: 3400, power: 0.9, clip });
  lamp(s, 'globe', XA + 3, 2.6, -11, { K: 2700, power: 0.6, drop: 1.0, clip });
  s.ambient({ box: clip, sky: '#ffdcae', ground: '#b58a5c', power: 0.2, lamp: true });
  s.spot('stand', XA + 7.5, 0, -14.1, PI, { tags: ['lockers'] });
  s.path([[XA + 4.1, -5.6], [XA + 4.1, -7.6], [XA + 12, -7.6], [XH - 1, -5.4], [XH + 1, -5.4]]);
  s.zoneBox({ id: 'keel-heat-crew', place: 'keel-heat', box: [XA, -0.5, -Z, XH, RH, -4.5], name: 'The crew room', sub: 'The Loop Hall · lockers and tea', ambience: 'shop', reverb: 'room', headroom: RH });
  void game; void f;
}

// ---------------------------------------------------------------------------------------------------------------
// the Taps: the hall's spinward end. The mains come down the walls to a header, and ten risers go up from it through
// the roof, one to each ring and one for the Keel itself, each with its valve wheel and its name.
// ---------------------------------------------------------------------------------------------------------------
function taps(game, s, f, r) {
  const g = s.g, X0 = TAPS.x0, X1 = TAPS.x1, H = TAPS.h, clip = [X0 - 0.4, -0.3, -Z - 0.2, X1 + 0.2, H + 0.2, Z + 0.2];
  floor(s, X0, -Z, X1, Z, 0, 'terrazzo', '#b8a98e');
  ceiling(s, X0, -Z, X1, Z, H, 'panel', '#2e3436');
  s.structure(() => {
    g.mat('cast', C.brass, { rough: -0.2 }); g.box(X0 + 1, 0, -0.04, X1 - 1.2, 0.008, 0.04, { faces: 'Y' });
    g.mat('terrazzo', '#7a2e24'); g.box(X0 + 0.5, 0, -12.5, X1 - 0.6, 0.006, -12.0, { faces: 'Y' }); g.box(X0 + 0.5, 0, 12.0, X1 - 0.6, 0.006, 12.5, { faces: 'Y' });
  });
  const tw = { mat: 'panel', tint: '#e2cfa4', dado: { h: 2.4, mat: 'tile', tint: '#24413f' }, skirt: '#2a2622' };
  wall(s, X0, -Z, X1, -Z, 0, H, tw);
  wall(s, X0, Z, X1, Z, 0, H, tw);
  wall(s, X1, -Z, X1, Z, 0, H, Object.assign({}, tw, { tint: '#2f4d4a' }));
  s.structure(() => { g.mat('paint', '#a8432e'); for (const zs of [-1, 1]) g.box(X0 + 0.1, 2.4, zs * (Z - 0.09), X1 - 0.1, 2.6, zs * (Z - 0.08) - zs * 0.02, { faces: zs > 0 ? 'z' : 'Z' }); g.box(X1 - 0.1, 2.4, -Z, X1 - 0.08, 2.6, Z, { faces: 'x' }); });
  // the hall's end wall: solid at the sides, a great arch into the Taps
  const ew = { mat: 'block', tintA: '#e2cfa4', tintB: '#cdb58a', dado: { h: 2.4, mat: 'tile', tint: '#24413f' }, skirt: '#2a2622' };
  wall(s, X0, -Z, X0, -6, 0, H, ew); wall(s, X0, 6, X0, Z, 0, H, ew);
  wall(s, X0, -6, X0, 6, 9.6, H - 9.6, Object.assign({}, ew, { dado: null, skirt: false }));
  s.structure(() => {
    g.mat('cast', '#7a2e24'); for (const z of [-6.2, 6.2]) g.box(X0 - 0.3, 0, z - 0.25, X0 + 0.3, 9.6, z + 0.25, { bevel: 0.03 });
    g.box(X0 - 0.3, 9.4, -6.45, X0 + 0.3, 10.0, 6.45, { bevel: 0.03 });
    g.mat('cast', C.brass, { rough: -0.2 }); for (const z of [-6.2, 6.2]) g.box(X0 - 0.32, 1.0, z - 0.27, X0 + 0.32, 1.12, z + 0.27);
  });
  sign(s, { kind: 'letters', text: 'The Taps', palette: ['#f6e2b8'] }, X0 - 0.32, 10.9, 0, { face: 'x', w: 6.2, h: 1.1, glow: 1.4 });
  // the mains come in along both walls, drop to the floor at the back wall, and feed a header along it
  const RX = X1 - 1.0, RX2 = X1 - 0.45;              // the red risers, the teal returns beside them
  for (const sz of [-1, 1]) {
    s.structure(() => {
      g.mat('paint', C.loop, { rough: 0.1 });
      g.tube([[X0 - 0.2, MAIN.y, sz * MAIN.flowZ], [RX - 1.2, MAIN.y, sz * MAIN.flowZ]], MAIN.rf, { segs: 22, caps: false });
      g.tube([[RX - 1.2, MAIN.y, sz * MAIN.flowZ], [RX - 0.4, MAIN.y - 0.3, sz * MAIN.flowZ], [RX, MAIN.y - 1.2, sz * MAIN.flowZ], [RX, 1.6, sz * MAIN.flowZ], [RX, 1.0, sz * 12.9], [RX, 1.0, sz * 12.2]], 0.5, { segs: 18 });
      g.mat('paint', C.ret, { rough: 0.1 });
      g.tube([[X0 - 0.2, MAIN.y, sz * MAIN.retZ], [RX2 - 1.4, MAIN.y, sz * MAIN.retZ]], MAIN.rr, { segs: 22, caps: false });
      g.tube([[RX2 - 1.4, MAIN.y, sz * MAIN.retZ], [RX2 - 0.5, MAIN.y - 0.3, sz * MAIN.retZ], [RX2, MAIN.y - 1.2, sz * 12.3], [RX2, 0.9, sz * 12.3], [RX2, 0.45, sz * 11.9]], 0.3, { segs: 14 });
      g.mat('cast', C.brass, { rough: -0.25 });
      for (let x = X0 + 2; x < RX - 1.5; x += 4) { g.tube([[x - 0.09, MAIN.y, sz * MAIN.flowZ], [x + 0.09, MAIN.y, sz * MAIN.flowZ]], MAIN.rf + 0.035, { segs: 22, caps: false }); g.tube([[x - 0.09, MAIN.y, sz * MAIN.retZ], [x + 0.09, MAIN.y, sz * MAIN.retZ]], MAIN.rr + 0.035, { segs: 22, caps: false }); }
      for (const y of [3, 6, 9]) g.tube([[RX, y - 0.06, sz * MAIN.flowZ], [RX, y + 0.06, sz * MAIN.flowZ]], 0.54, { segs: 18, caps: false });
    });
  }
  // the headers along the back wall, on cast saddles
  s.structure(() => {
    g.mat('paint', C.loop, { rough: 0.1 }); g.tube([[RX, 1.0, -12.3], [RX, 1.0, 0], [RX, 1.0, 12.3]], 0.42, { segs: 18 });
    g.mat('paint', C.ret, { rough: 0.1 }); g.tube([[RX2, 0.45, -12.0], [RX2, 0.45, 0], [RX2, 0.45, 12.0]], 0.26, { segs: 14 });
    g.mat('cast', C.steel); for (let z = -11; z <= 11; z += 2.5) { g.box(RX - 0.5, 0, z - 0.12, RX2 + 0.3, 0.55, z + 0.12, { bevel: 0.02 }); }
  });
  // ten risers: Rings One to Nine and the Keel, each lagged, with a valve, a wheel, a name plate, brass at the roof
  const NAMES = RINGS.map((n) => 'Ring ' + n).concat(['The Keel']);
  for (let i = 0; i < 10; i++) {
    const z = -11.25 + i * 2.5, bare = i === 1;
    s.structure(() => {
      g.mat('paint', C.loop, { rough: 0.05 }); g.tube([[RX, 1.0, z], [RX, H, z]], 0.24, { segs: 14, caps: false });
      g.mat('weave', C.lag); if (bare) { g.tube([[RX, 2.35, z], [RX, H - 0.3, z]], 0.32, { segs: 14 }); } else g.tube([[RX, 2.0, z], [RX, H - 0.3, z]], 0.32, { segs: 14 });
      g.mat('paint', C.loop); for (const y of [5.5, 8, 10.5, 13]) g.tube([[RX, y - 0.08, z], [RX, y + 0.08, z]], 0.335, { segs: 14, caps: false });
      g.mat('paint', RING_COL[i]); g.tube([[RX, 3.7, z], [RX, 4.3, z]], 0.34, { segs: 14, caps: false });
      g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[RX, H - 0.35, z], [RX, H, z]], 0.38, { segs: 14, caps: false });
      // the valve body and its wheel, facing the room
      g.mat('cast', '#5a5650', { rough: -0.15 }); g.ball(RX, 1.7, z, 0.34, 0.3, 0.34, { segs: 12, rings: 8 }); g.tube([[RX, 1.7, z], [RX - 0.7, 1.7, z]], 0.05, { segs: 6 });
      g.push(); g.move(RX - 0.72, 1.7, z); g.rotY(-PI / 2); wheel(g, 0.42, i === 1 ? '#c9962e' : '#a63c28'); g.pop();
      // the return beside it
      g.mat('paint', C.ret, { rough: 0.05 }); g.tube([[RX2, 0.45, z + 0.62], [RX2, H, z + 0.62]], 0.15, { segs: 10, caps: false });
      g.mat('cast', C.brass); g.tube([[RX2, H - 0.3, z + 0.62], [RX2, H, z + 0.62]], 0.2, { segs: 10, caps: false });
      // a little dial on each
      g.push(); g.move(RX - 0.34, 2.75, z); g.rotY(-PI / 2); dial(g, 0.14, 0.4 + i * 0.07); g.pop();
    });
    sign(s, { kind: 'plate', text: NAMES[i], lines: [i < 9 ? 'riser ' + (i + 1) : 'the works', i === 6 ? 'over your head' : 'open'] }, RX - 0.36, 3.25, z, { face: 'x', w: 0.62, h: 0.32 });
    s.solid(RX - 0.45, 0, z - 0.4, X1, 2.2, z + 0.4);
    s.post(RX, z, 0.34, 0, H);
  }
  // Ring Two's riser, with its lagging off for mending: bare steel painted red, a chalk ring round it, a note
  const z2 = -11.25 + 2.5;
  s.detail(() => {
    g.mat('weave', C.lag); g.box(RX - 0.2, 0.0, z2 + 0.8, RX + 0.25, 0.5, z2 + 1.3, { bevel: 0.08 });
    g.mat('knit', '#3fe0d0'); g.tube([[RX, 2.33, z2 - 0.001], [RX, 2.38, z2]], 0.33, { segs: 14, caps: false });
    g.mat('paint', '#f3ead2'); g.tube([[RX, 1.96, z2], [RX, 1.99, z2]], 0.26, { segs: 14, caps: false });
  });
  sign(s, { kind: 'notice', title: 'Lagging off', lines: ['for mending, back Thursday', 'Ring Two riser', 'it is hot: gloves', 'or one finger, briefly'], hand: true }, RX - 0.3, 1.25, z2 + 0.95, { face: 'x', w: 0.3, h: 0.36 });
  s.interact({ x: RX - 1.0, y: 1.5, z: z2, radius: 1.3, prompt: 'Put a hand on the Ring Two riser', onUse: async (gm) => {
    await say(gm, 'Ring Two', [
      'The other nine are lagged and you feel nothing through the canvas. This one is bare for mending, red paint over steel, and the heat comes off it into your face before you touch it.',
      'You put your palm on it and count. At three you take it away. Sixty-five degrees, on its way up three thousand metres of riser to Ring Two, to Candlewick\'s baths and the long table\'s pots.',
      'Somebody has chalked a ring round the bare part, and under it, small: hello upstairs.',
    ]);
  } });
  // the big plate over the valve wall
  s.structure(() => {
    g.mat('cast', '#7a2e24'); g.box(X1 - 2.3, 11.6, -13.2, X1 - 1.9, 12.6, 13.2, { bevel: 0.03 });
    g.mat('cast', C.brass, { rough: -0.2 }); g.box(X1 - 2.32, 11.58, -13.2, X1 - 1.88, 11.66, 13.2); g.box(X1 - 2.32, 12.54, -13.2, X1 - 1.88, 12.62, 13.2);
    g.mat('cast', '#2c3133'); for (const z of [-12.5, -4, 4, 12.5]) g.tube([[X1 - 2.1, 12.6, z], [X1 - 2.1, H, z]], 0.03, { segs: 5 });
  });
  sign(s, { kind: 'fascia', text: '65 · to every ring', font: 'caps', palette: ['#7a2e24', '#fff0d6', '#d6a640'] }, X1 - 2.33, 12.1, 0, { face: 'x', w: 12.8, h: 0.9, glow: 1.4, board: false });
  sign(s, { kind: 'board', title: 'The Taps', lines: ['One riser to each ring|nine', 'And one for the Keel|the works', 'Up each riser|65', 'Down each return|41', 'Kitchens hold and brew on it|free', 'Searing is extra|by the kay', 'A litre boiled from the loop|0.045'], palette: ['#7a2e24', '#f3e6c8', '#f2b56b'] }, X0 + 3.6, 2.0, Z - 0.1, { face: 'z', w: 2.4, h: 1.7 });
  s.interact({ x: X0 + 3.6, y: 1.6, z: Z - 1.0, radius: 1.8, prompt: 'Read the board', onUse: async (gm) => {
    await say(gm, 'The Taps', [
      'One riser to each of the nine rings, and one for the Keel\'s own works and canteens. From the top of each riser the loop spreads along the line decks and up the lift cores to every block.',
      'Every bath in Chervil is warm from it, and every kitchen holds its pots and brews its tea on it for nothing. Only searing and frying draw power, which is why a dish with one seared thing on it is a treat.',
      'A litre boiled from the loop costs about 0.045 kWh. A kettle is fed from the 65 tap the way a plant is fed from a window, in drums that have them.',
    ]);
  } });
  // berths here too, so nobody has to walk back the length of the hall
  berths(s, 149.5, -Z + 0.08, 0, 'keel-heat-taps');
  sign(s, { kind: 'street', text: 'Cabs · the Taps', palette: ['#22302c', '#f1ead8'] }, 149.5, 3.25, -Z + 0.1, { face: 'Z', w: 2.4, h: 0.5, glow: 0.8 });
  // light: bright and warm on the valve wall, so the end of the hall shines
  s.light({ at: [X1 - 3.5, 8.0, -12], to: [X1 - 3.5, 8.0, 12], type: 'tube', color: [1.0, 0.74, 0.48], power: 42, range: 15, radius: 0.4, shadow: true, clip });
  for (const z of [-7, 0, 7]) lamp(s, 'globe', X1 - 4.5, 4.4, z, { K: 2600, power: 1.6, drop: 10.0, r: 0.26, clip, lampFlag: false });
  s.ambient({ box: clip, sky: '#ffcf96', ground: '#b5603e', power: 0.34, lamp: false });
  s.glowCard(X1 - 0.3, 6.0, 0, { face: 'x', color: '#ffd9a0', size: 16, strength: 0.05, follow: 'always' });
  // a brass rail to keep visitors a step back from the risers, with a gate in the middle; a bench to sit and look
  for (const zz of [[-13.2, -0.9], [0.9, 13.2]]) railing(s, [[RX - 2.4, zz[0]], [RX - 2.4, zz[1]]], 0, { h: 1.0, tint: '#3d4245', rail: C.brass, railMat: 'cast' });
  prop(s, 'bench', X0 + 7, 0, -6, PI / 2, { w: 2.4, wood: '#6b4a2f', back: true });
  prop(s, 'bench', X0 + 7, 0, 6, PI / 2, { w: 2.4, wood: '#7a5233', back: true });
  // people and walkways
  s.spot('work', RX - 1.4, 0, -3.75, PI / 2, { tags: ['crew', 'valves'] });
  s.spot('work', RX - 1.4, 0, 6.25, PI / 2, { tags: ['notes', 'valves'] });
  s.spot('work', X0 + 4.5, 0, 9, r.f(0, 6), { tags: ['sweep'] });
  s.spot('stand', X0 + 3.6, 0, Z - 1.2, 0, { tags: ['board'] });
  s.path([[HALL.x1 - 1, 0], [X0 + 2, 0], [X1 - 3, 0], [X1 - 3, -9]]); s.path([[X1 - 3, 0], [X1 - 3, 9]]);
  s.path([[X0 + 2, 0], [149.5, -12.6]]); s.path([[X0 + 2, 0], [X0 + 3.6, Z - 1.4]]);
  s.zoneBox({ id: 'keel-heat-taps', place: 'keel-heat', box: [X0, -0.5, -Z, X1, H, Z], name: 'The Taps', sub: 'The Loop Hall · where the loop leaves for the rings', ambience: 'station', reverb: 'ring', headroom: H });
  s.loop('tide', X1 - 2, 4, 0, { vol: 0.32, radius: 18 });
  game.spawns['keel-heat-taps'] = { frame: f, x: 149.5, y: 0, z: -Z + 1.6, yaw: PI };
}
