// The warm side of the strain library (see lm_keel_library.js): the cab lobby, the coat room and its blight board, the
// long window (the reading gallery), the reading room and its files, the cooks' doors, and the receiving bench behind
// glass. Walnut, brass, green shades and carpet; the cold blue of the stacks comes in through the window.
import { floor, ceiling, wall, lamp, warm } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door } from '../world/doors.js';
import { SIGNS } from '../content/signs.js';
import { PI, C, GAL, READ, COOK, RECV, COAT, CAB, WIN, GALDOOR, say, choose, toast, find, tick, runX } from './lm_keel_library_props.js';

const WARM = { exposure: 1.0, autoKey: 0.15, bloom: 0.06, warmth: 0.1, contrast: 1.05, saturation: 1.06 };
const GCLIP = [GAL.x0 - 0.2, -0.3, GAL.z0 + 0.05, GAL.x1 + 0.2, GAL.h + 0.1, GAL.z1 + 4];
const RCLIP = [READ.x0, -0.3, READ.z0 - 2, READ.x1 + 0.1, READ.h + 0.1, READ.z1];
const KCLIP = [COOK.x0 - 0.1, -0.3, COOK.z0 - 2, COOK.x1, COOK.h + 0.1, COOK.z1];

export async function buildRooms(game, s, f, r) {
  cabLobby(game, s);
  coatRoom(game, s);
  await tick(game);
  blightBoard(game, s);
  await tick(game);
  gallery(game, s);
  await tick(game);
  readingRoom(game, s);
  await tick(game);
  cooksDoors(game, s);
  await tick(game);
  receiving(game, s);
  walkways(s);
  void f; void r;
}

// A wooden wainscot proud of one face of a wall along x (at z = zc, the face toward sz) or along z, with a top rail.
function wainscotX(s, x0, x1, zc, sz, h, tint) {
  const g = s.g;
  runX(x0, x1, 8, (a, b) => s.structure(() => {
    const z0 = zc + sz * 0.08, z1 = zc + sz * 0.1;
    g.mat('wood', tint || C.walnut, { rough: -0.08 }); g.box(a, 0, Math.min(z0, z1), b, h, Math.max(z0, z1), { faces: sz > 0 ? 'ZY' : 'zY' });
    for (let x = a + 0.6; x < b - 0.2; x += 1.2) g.box(x - 0.03, 0.12, Math.min(z1, z1 + sz * 0.015), x + 0.03, h - 0.1, Math.max(z1, z1 + sz * 0.015), { faces: (sz > 0 ? 'Z' : 'z') + 'xX' });
    g.mat('wood', '#3a2a1e'); g.box(a, h, Math.min(zc, zc + sz * 0.14), b, h + 0.06, Math.max(zc, zc + sz * 0.14), { bevel: 0.01 });
  }));
}
function wainscotZ(s, z0, z1, xc, sx, h, tint) {
  const g = s.g;
  s.structure(() => {
    const x0 = xc + sx * 0.08, x1 = xc + sx * 0.1;
    g.mat('wood', tint || C.walnut, { rough: -0.08 }); g.box(Math.min(x0, x1), 0, z0, Math.max(x0, x1), h, z1, { faces: sx > 0 ? 'XY' : 'xY' });
    for (let z = z0 + 0.6; z < z1 - 0.2; z += 1.2) g.box(Math.min(x1, x1 + sx * 0.015), 0.12, z - 0.03, Math.max(x1, x1 + sx * 0.015), h - 0.1, z + 0.03, { faces: (sx > 0 ? 'X' : 'x') + 'zZ' });
    g.mat('wood', '#3a2a1e'); g.box(Math.min(xc, xc + sx * 0.14), h, z0, Math.max(xc, xc + sx * 0.14), h + 0.06, z1, { bevel: 0.01 });
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the cab lobby: two berths, a bench, the name over the way in
// ---------------------------------------------------------------------------------------------------------------
function cabLobby(game, s) {
  const g = s.g, B = CAB, clip = [B.x0, -0.3, B.z0, B.x1 + 1.5, B.h + 0.1, B.z1];
  floor(s, B.x0, B.z0, B.x1, B.z1, 0, 'terrazzo', '#c9bca2', { matOpts: { rough: 0.25 } });
  ceiling(s, B.x0, B.z0, B.x1, B.z1, B.h, 'plaster', '#e6d8bc');
  s.structure(() => { g.mat('wood', '#4a3424'); for (let x = B.x0 + 2; x < B.x1; x += 2.5) g.box(x - 0.1, B.h - 0.24, B.z0, x + 0.1, B.h, B.z1, { faces: 'yxX' }); });
  s.detail(() => { g.mat('motif', '#6e2a2a'); g.box(B.x0 + 1.4, 0, -1.1, B.x1, 0.012, 1.1, { faces: 'YxXzZ' }); g.mat('weave', '#c9962e'); for (const z of [-1.1, 1.02]) g.box(B.x0 + 1.4, 0, z, B.x1, 0.014, z + 0.08, { faces: 'Y' }); });
  for (const z of [0, -3.6, 3.6]) lamp(s, 'sconce', B.x0 + 0.1, 2.2, z, { face: 'X', K: 2700, power: 0.7, clip });
  const w = { tint: '#e2d6bc', dado: { h: 1.2, mat: 'panel', tint: '#2f5d5a' }, skirt: '#3a3430' };
  wall(s, B.x0, B.z0, B.x0, B.z1, 0, B.h, w);
  wall(s, B.x0, B.z0, B.x1, B.z0, 0, B.h, w);
  wall(s, B.x0, B.z1, B.x1, B.z1, 0, B.h, w);
  prop(s, 'keellib.berths', B.x0 + 0.08, 0, 0, PI / 2, {});
  for (const bz of [-1.6, 1.6]) s.interact({ x: B.x0 + 0.8, y: 1.2, z: bz, radius: 1.7, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open('keel-library'); } });
  prop(s, 'bench', -47, 0, B.z0 + 0.45, 0, { w: 2.4, wood: '#7a5233', back: true });
  prop(s, 'plant', -44.2, 0, B.z0 + 0.5, 0, { size: 1.1, kind: 'broad', pot: '#2f5d5a' });
  sign(s, { kind: 'plate', text: 'Deck 11 · Ring Three', lines: ['the Keel · the strain library'] }, B.x0 + 0.1, 1.55, 3.6, { face: 'X', w: 0.5, h: 0.22 });
  sign(s, { kind: 'street', text: 'The strain library', sub: 'coats · the long window · the reading room', palette: ['#22302c', '#f1ead8'] }, B.x1 - 0.11, 3.06, 0, { face: 'x', w: 2.4, h: 0.46, glow: 0.7 });
  sign(s, { kind: 'poster', title: 'Two of everything', lines: ['the strain library', 'kept cold · written down', 'deck 11 · Ring Three'], palette: ['#1d2a24', '#efe4c8', '#c9962e'] }, -47, 1.6, B.z1 - 0.1, { face: 'z', w: 0.7, h: 1.0 });
  sign(s, { kind: 'poster', title: 'Nothing alive without the Gate', lines: ['a phage is a famine', 'every crate sealed and certified'], palette: ['#6e2a2a', '#f3e6c8', '#d6a640'] }, -44.6, 1.6, B.z1 - 0.1, { face: 'z', w: 0.7, h: 1.0 });
  for (const z of [-2.2, 2.2]) lamp(s, 'globe', -46.5, B.h - 0.5, z, { K: 2900, power: 0.8, drop: 0.5, clip });
  s.spot('stand', -45.6, 0, 3.4, -2.4, { tags: ['wait'] });
  s.zoneBox({ id: 'keel-library-cabs', place: 'keel-library', box: [B.x0, -0.5, B.z0, B.x1, B.h, B.z1], name: 'The strain library', sub: 'Cabs · deck 11 · Ring Three', ambience: 'quiet', reverb: 'room', headroom: B.h, env: WARM });
}

// ---------------------------------------------------------------------------------------------------------------
// the coat room: coats on pegs, overshoes in cubbies, the bench, a sticky mat, the door into the gallery
// ---------------------------------------------------------------------------------------------------------------
const COATS = ['#2f5a44', '#8a2f3c', '#c9962e', '#2f4a6a', '#6e2a2a', '#3a7a6a', '#b5532e', '#5b4060', '#2f5a44', '#8a6a2a', '#2c4a52', '#a8432e', '#4a5a2a'];
const MENDS = ['#c9962e', '#2f7a6a', '#8a2f3c', '#e0b85a', '#3a8a7a', '#d6a640', '#2f4a6a', '#e0b85a', '#b5532e', '#2f5a44', '#c9962e', '#6b8a3a', '#d6a640'];
const FELTS = ['#6b7a8a', '#8a6a5a', '#5a6a5a', '#7a6a8a', '#8a8a7a'];
function coatRoom(game, s) {
  const g = s.g, B = COAT, clip = [B.x0, -0.3, B.z0, B.x1, B.h + 0.1, B.z1];
  floor(s, B.x0, B.z0, B.x1, B.z1, 0, 'terrazzo', '#d2cab6', { matOpts: { rough: 0.25 } });
  ceiling(s, B.x0, B.z0, B.x1, B.z1, B.h, 'plaster', '#ece2cc');
  const w = { tint: '#e8dcc0', dado: { h: 1.1, mat: 'tile', tint: '#2f6f73' }, skirt: '#3a3430' };
  wall(s, B.x0, B.z0, B.x1, B.z0, 0, B.h, w);
  wall(s, B.x0, B.z1, B.x1, B.z1, 0, B.h, w);
  wall(s, B.x0, B.z0, B.x0, B.z1, 0, B.h, Object.assign({}, w, { tintB: '#e2d6bc', openings: [{ at: 5.8, w: 2.4, h: 2.6 }] }));
  s.structure(() => { g.mat('wood', C.walnut); g.box(B.x0 - 0.12, 2.6, -1.3, B.x0 + 0.12, 2.78, 1.3, { bevel: 0.01 }); for (const z of [-1.3, 1.3]) g.box(B.x0 - 0.12, 0, z - 0.08, B.x0 + 0.12, 2.78, z + 0.08, { bevel: 0.01 }); });
  // the wall into the gallery and the reading room (its gallery face is the gallery's): a door through it
  wall(s, GAL.x0, GAL.z0, GAL.x0, GAL.z1, 0, GAL.h, { tintA: C.plaster, tintB: '#e8dcc0', openings: [{ at: GALDOOR.z0 - GAL.z0, w: GALDOOR.z1 - GALDOOR.z0, h: 2.3 }], skirt: '#3a3430' });
  wall(s, READ.x0, READ.z0, READ.x0, READ.z1, 0, READ.h, { tintA: '#cdb48a', tintB: '#e8dcc0', skirt: '#3a3430' });
  s.structure(() => { g.mat('tile', '#2f6f73'); g.box(B.x1 - 0.1, 0, B.z0, B.x1 - 0.08, 1.1, GALDOOR.z0, { faces: 'x' }); g.box(B.x1 - 0.1, 0, GALDOOR.z1, B.x1 - 0.08, 1.1, B.z1, { faces: 'x' }); });
  door(s, { x: GAL.x0, y: 0, z: GALDOOR.z0, w: 0.9, h: 2.3, along: 'z', dir: 1, kind: 'slide', style: 'glazed', auto: true, tint: C.walnut });
  door(s, { x: GAL.x0, y: 0, z: GALDOOR.z1, w: 0.9, h: 2.3, along: 'z', dir: -1, kind: 'slide', style: 'glazed', auto: true, tint: C.walnut });
  s.structure(() => { g.mat('wood', C.walnut); g.box(GAL.x0 - 0.14, 2.3, GALDOOR.z0 - 0.12, GAL.x0 + 0.14, 2.46, GALDOOR.z1 + 0.12, { bevel: 0.01 }); for (const z of [GALDOOR.z0 - 0.06, GALDOOR.z1 + 0.06]) g.box(GAL.x0 - 0.14, 0, z - 0.06, GAL.x0 + 0.14, 2.46, z + 0.06, { bevel: 0.01 }); });
  // the sticky mat and the clean line
  s.detail(() => { g.mat('speckle', '#3a5a8a', { rough: 0.2 }); g.box(B.x1 - 2.2, 0, GALDOOR.z0 - 0.3, B.x1 - 0.12, 0.012, GALDOOR.z1 + 0.3, { faces: 'YxXzZ' }); g.mat('paint', '#d6a640'); g.box(B.x1 - 2.4, 0, GALDOOR.z0 - 0.5, B.x1 - 2.3, 0.004, GALDOOR.z1 + 0.5, { faces: 'Y' }); });
  // coats on brass pegs along the back wall, each with its mend and a name in the lining
  s.detail(() => { g.mat('wood', C.walnut); g.box(B.x0 + 0.5, 1.84, B.z1 - 0.12, B.x1 - 0.5, 1.98, B.z1 - 0.08, { bevel: 0.008 }); g.mat('cast', C.brass); for (let i = 0; i < COATS.length; i++) g.tube([[B.x0 + 1.0 + i * 0.8, 1.92, B.z1 - 0.08], [B.x0 + 1.0 + i * 0.8, 1.94, B.z1 - 0.2]], 0.012, { segs: 5 }); });
  COATS.forEach((c, i) => { if (i === 6) return; prop(s, 'keellib.coat', B.x0 + 1.0 + i * 0.8, 1.9, B.z1 - 0.24, 0, { cloth: c, mend: MENDS[i] }); });
  // overshoes in cubbies on the front wall, a bin for worn ones, the bench in the middle
  prop(s, 'shelving', -36, 0, B.z0 + 0.22, 0, { w: 4.2, h: 1.0, d: 0.34, shelves: 2, wood: C.walnut });
  for (let i = 0; i < 12; i++) prop(s, 'keellib.overshoes', -37.8 + (i % 6) * 0.72, 0.1 + Math.floor(i / 6) * 0.46, B.z0 + 0.24, 0, { felt: FELTS[i % FELTS.length] });
  s.detail(() => { g.mat('weave', '#6b5a3a'); g.lathe(-33.2, B.z0 + 0.45, [[0.3, 0], [0.32, 0.5], [0.33, 0.55]], { segs: 14, capTop: false }); g.mat('felt', '#6b7a8a'); g.ball(-33.2, 0.48, B.z0 + 0.45, 0.26, 0.08, 0.26, { segs: 10, rings: 4 }); });
  sign(s, { kind: 'label', text: 'Worn', ink: '#efe6d0' }, -33.2, 0.3, B.z0 + 0.77, { face: 'Z', w: 0.3, h: 0.1 });
  prop(s, 'bench', -36.5, 0, 3.6, PI, { w: 3.0, wood: '#7a5233' });
  for (let i = 0; i < 3; i++) prop(s, 'keellib.overshoes', -37.6 + i * 1.1, 0, 3.15, 0.3 * i, { felt: FELTS[(i + 2) % FELTS.length] });
  sign(s, { kind: 'notice', title: 'Coats and overshoes', lines: ['Coats for the cold walk.', 'Overshoes on every floor.', 'Your own peg back, please.', 'Worn overshoes in the bin:', 'they are washed at one,', 'when the kays are cheapest.'] }, B.x0 + 1.0 + 6 * 0.8, 1.45, B.z1 - 0.1, { face: 'z', w: 0.5, h: 0.66 });
  // take a coat: the toggle lives in the flags, so the cold walk can tell
  s.interact({ x: -36.2, y: 1.2, z: B.z1 - 0.9, radius: 2.2, prompt: (gm) => (gm.flags && gm.flags.keelLibCoat ? 'Hang the coat back on its peg' : 'Take a coat and overshoes'), onUse: async (gm) => {
    if (!gm.flags) return;
    if (gm.flags.keelLibCoat) { gm.flags.keelLibCoat = false; toast(gm, 'Back on the same peg, as the card asks. The overshoes go in the bin marked Worn.'); return; }
    gm.flags.keelLibCoat = true;
    await say(gm, 'The coat room', [
      'A long quilted coat off the pegs, mended at one elbow in a brighter colour, with a name tape in the lining that is not yours. Felt overshoes over your boots.',
      'The coats are for the cold walk, which is kept at minus twenty. The overshoes are for every floor in the library: it keeps grit out of its air as carefully as it keeps the cold in.',
    ]);
  } });
  for (const p of [[-38.5, -2.2], [-38.5, 3.0]]) lamp(s, 'globe', p[0], B.h - 0.55, p[1], { K: 2900, power: 0.7, drop: 0.5, clip });
  lamp(s, 'sconce', B.x1 - 0.1, 2.3, 5.6, { face: 'x', K: 2700, power: 0.6, clip });
  lamp(s, 'sconce', B.x0 + 0.1, 2.3, -4.2, { face: 'X', K: 2700, power: 0.6, clip });
  s.detail(() => { g.mat('motif', '#2f5a44'); g.box(B.x0 + 0.3, 0, -1.0, -33.5, 0.012, 0.9, { faces: 'YxXzZ' }); g.box(-34.5, 0, -4.9, -33.5, 0.012, 0.9, { faces: 'YxXzZ' }); g.mat('weave', '#c9962e'); g.box(B.x0 + 0.3, 0, -1.0, -33.5, 0.014, -0.92, { faces: 'Y' }); g.box(B.x0 + 0.3, 0, 0.82, -33.5, 0.014, 0.9, { faces: 'Y' }); });
  prop(s, 'plant', B.x1 - 0.6, 0, B.z1 - 0.6, 0, { size: 1.3, kind: 'fern', pot: '#a3563a' });
  prop(s, 'plant', B.x0 + 0.6, 0, B.z0 + 1.2, 0, { size: 1.0, kind: 'broad', pot: '#2f6f73' });
  s.spot('stand', -37.4, 0, 5.4, 0, { tags: ['coat'] });
  s.spot('sit', -36.0, 0.46, 3.38, PI, { tags: ['wait'] });
  s.zoneBox({ id: 'keel-library-coats', place: 'keel-library', box: [B.x0, -0.5, B.z0, B.x1, B.h, B.z1], name: 'The coat room', sub: 'The strain library · coats and overshoes', ambience: 'quiet', reverb: 'felt', headroom: B.h, env: WARM });
}

// ---------------------------------------------------------------------------------------------------------------
// the blight board: on the coat room's inner wall, where every cook who comes in reads it first
// ---------------------------------------------------------------------------------------------------------------
const BOARD = { x: GAL.x0 - 0.1, z: 1.5, y: 1.95, w: 5.4, h: 1.93 };
function blightBoard(game, s) {
  const g = s.g, B = BOARD;
  const pic = game.atlas ? game.atlas.add(1024, 366, paintBoard, 'keellib.blightboard') : null;
  // the frame: walnut, with a brass picture light over it
  s.structure(() => {
    g.mat('wood', C.walnut, { rough: -0.1 }); g.box(B.x - 0.06, B.y - B.h / 2 - 0.1, B.z - B.w / 2 - 0.1, B.x + 0.02, B.y + B.h / 2 + 0.1, B.z + B.w / 2 + 0.1, { bevel: 0.02 });
    g.mat('wood', '#3a2a1e'); g.box(B.x - 0.14, B.y - B.h / 2 - 0.16, B.z - B.w / 2 - 0.12, B.x, B.y - B.h / 2 - 0.1, B.z + B.w / 2 + 0.12, { bevel: 0.01 });
    g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[B.x, B.y + B.h / 2 + 0.3, B.z - 2.2], [B.x - 0.3, B.y + B.h / 2 + 0.38, B.z - 2.2]], 0.015, { segs: 5 }); g.tube([[B.x, B.y + B.h / 2 + 0.3, B.z + 2.2], [B.x - 0.3, B.y + B.h / 2 + 0.38, B.z + 2.2]], 0.015, { segs: 5 });
    g.push(); g.move(B.x - 0.32, B.y + B.h / 2 + 0.38, B.z); g.rotX(PI / 2); g.cyl(0, -2.4, 0, 0.06, 4.8, { segs: 10 }); g.pop();
  });
  s.deco(() => { g.mat('diffuser', '#fff0c8', { emissive: 5 }); g.box(B.x - 0.36, B.y + B.h / 2 + 0.31, B.z - 2.35, B.x - 0.28, B.y + B.h / 2 + 0.33, B.z + 2.35, { faces: 'y' }); });
  if (pic) s.deco(() => {
    g.atlas(pic.page, { emissive: 0.25, rough: 0.55 });
    const x = B.x - 0.065, y0 = B.y - B.h / 2, y1 = B.y + B.h / 2, z0 = B.z - B.w / 2, z1 = B.z + B.w / 2;
    // facing -x: seen from the coat room (looking +x), its right is toward +z
    g.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], { uv: [pic.u0, pic.v1, pic.u1, pic.v0] });
  });
  // the red lamp on Line 9's row, and the green one for every other line
  s.deco(() => { g.mat('diffuser', '#ff4a38', { emissive: 4 }); g.ball(B.x - 0.08, B.y + 0.28, B.z + B.w / 2 + 0.04, 0.035, 0.035, 0.02, { segs: 8, rings: 5 }); g.mat('diffuser', '#7fe08a', { emissive: 3 }); g.ball(B.x - 0.08, B.y - 0.02, B.z + B.w / 2 + 0.04, 0.035, 0.035, 0.02, { segs: 8, rings: 5 }); });
  s.light({ at: [B.x - 0.5, B.y + B.h / 2 + 0.2, B.z - 2.2], to: [B.x - 0.5, B.y + B.h / 2 + 0.2, B.z + 2.2], type: 'tube', color: warm(3000), power: 1.6, range: 3.0, radius: 0.05, lamp: true, clip: [COAT.x0, -0.3, COAT.z0, COAT.x1, COAT.h, COAT.z1] });
  s.interact({ x: B.x - 1.0, y: 1.4, z: B.z, radius: 2.2, prompt: 'Read the blight board', onUse: async (gm) => {
    await say(gm, 'The blight board', [
      'LINE 9, protein flour, the Flour Hall under Ring Five. Phage found eleven days ago. The vats were drained and steamed and are being steamed again. A vial went out of the stacks to the hall\'s seed room on day two.',
      'TO GO: about three days, once the vats are clean. Flour is the quick one. A yeast or a fungus takes about a week from a vial, and a cell line for the steak halls a month or more.',
      'THE MILL SERVES: the halls Line 9 feeds are on the blight menu. The Mill makes up the calories with free amino acids and starch, so dinner goes on; what it costs is the taste. Halls remember a blight year by what they ate.',
      'Underneath, in chalk: Every other line in the drum is up. Chalked at six and at six.',
    ]);
    find(gm, 'blight-menu');
  } });
  s.spot('stand', B.x - 1.4, 0, B.z - 1.2, -PI / 2 + 0.15, { tags: ['read', 'board'] });
  s.spot('stand', B.x - 1.5, 0, B.z + 1.0, -PI / 2 - 0.1, { tags: ['read', 'board'] });
}
function paintBoard(ctx, w, h) {
  const CAPS = "'Barlow Condensed', sans-serif", SERIF = "'Cormorant Garamond', serif", HAND = "'Caveat', cursive";
  ctx.fillStyle = '#1d2a24'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { const x = (i * 97.13) % w, y = (i * 61.7 + (i % 7) * 13) % h; ctx.fillStyle = i % 3 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.08)'; ctx.fillRect(x, y, 2, 1); }
  ctx.strokeStyle = 'rgba(214,166,64,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#efe4c8'; ctx.textAlign = 'left'; ctx.font = 'italic 600 46px ' + SERIF; ctx.fillText('The blight board', 30, 44);
  ctx.textAlign = 'right'; ctx.fillStyle = '#d6a640'; ctx.font = '500 19px ' + CAPS; ctx.fillText('EVERY LINE IN CHERVIL, AS THE HALLS REPORT IT · CHALKED AT SIX AND AT SIX', w - 30, 44);
  ctx.fillStyle = '#d6a640'; ctx.fillRect(30, 72, w - 60, 2);
  const cols = [30, 230, 470, 590, 820];
  const head = ['LINE', 'WHERE', 'DOWN', 'THE MILL SERVES', 'TO GO'];
  ctx.textAlign = 'left'; ctx.font = '600 18px ' + CAPS; ctx.fillStyle = '#b9ab88'; head.forEach((t, i) => ctx.fillText(t, cols[i], 92));
  // the row that is down
  ctx.fillStyle = '#7a2a26'; ctx.fillRect(22, 106, w - 44, 50);
  ctx.fillStyle = '#ff6a50'; ctx.beginPath(); ctx.arc(w - 40, 131, 8, 0, 7); ctx.fill();
  ctx.fillStyle = '#f6ead0'; ctx.font = '600 27px ' + CAPS;
  ['FLOUR · LINE 9', 'THE FLOUR HALL · RING FIVE', '11 DAYS', 'AMINO BROTH FOR FLOUR', '3 DAYS ONCE CLEAN'].forEach((t, i) => ctx.fillText(t, cols[i], 131));
  // everything else
  ctx.fillStyle = 'rgba(127,224,138,0.12)'; ctx.fillRect(22, 162, w - 44, 40);
  ctx.fillStyle = '#7fe08a'; ctx.beginPath(); ctx.arc(w - 40, 182, 8, 0, 7); ctx.fill();
  ctx.fillStyle = '#cfe8c8'; ctx.font = '500 23px ' + CAPS; ctx.fillText('EVERY OTHER LINE IN THE DRUM', cols[0], 182); ctx.fillText('UP', cols[2], 182);
  // regrowing from a vial
  ctx.fillStyle = '#d6a640'; ctx.fillRect(30, 220, w - 60, 1.5);
  ctx.fillStyle = '#b9ab88'; ctx.font = '600 18px ' + CAPS; ctx.fillText('REGROWING FROM A VIAL', 30, 240);
  const rg = [['PROTEIN FLOUR', 'ABOUT 3 DAYS'], ['YEASTS AND FUNGI', 'ABOUT A WEEK'], ['CELL LINES', 'A MONTH OR MORE']];
  rg.forEach((p, i) => {
    const x = 30 + i * 330; ctx.strokeStyle = 'rgba(239,228,200,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, 256, 310, 54);
    ctx.fillStyle = '#efe4c8'; ctx.font = '500 21px ' + CAPS; ctx.fillText(p[0], x + 14, 274); ctx.fillStyle = '#d6a640'; ctx.font = '600 21px ' + CAPS; ctx.fillText(p[1], x + 14, 296);
  });
  ctx.fillStyle = '#e8e2d0'; ctx.font = '500 27px ' + HAND; ctx.textAlign = 'left'; ctx.fillText('A blight takes one line, never the dinner.', 30, 338);
  ctx.textAlign = 'right'; ctx.font = '500 22px ' + HAND; ctx.fillText('vial out to the seed room, day 2', w - 30, 338);
}

// ---------------------------------------------------------------------------------------------------------------
// the long window: the warm gallery along the stacks, 7.8 m tall, benches and standard lamps, a brass rail
// ---------------------------------------------------------------------------------------------------------------
function gallery(game, s) {
  const g = s.g, X0 = GAL.x0, X1 = GAL.x1, Z0 = GAL.z0, H = GAL.h;
  floor(s, X0, Z0, X1, GAL.z1, 0, 'carpet', '#2c4a3a');
  ceiling(s, X0, Z0, X1, GAL.z1, H, 'felt', '#4a2c26');
  // a strip of oak along the window, and a border inlaid in the carpet
  runX(X0, X1, 12, (a, b) => s.structure(() => {
    g.mat('planks', '#7a5a3a', { rough: -0.15 }); g.box(a, 0, Z0 + 0.08, b, 0.008, Z0 + 1.2, { faces: 'Y' });
    g.mat('carpet', '#a8823e'); g.box(a, 0, Z0 + 1.2, b, 0.006, Z0 + 1.34, { faces: 'Y' }); g.box(a, 0, -0.5, b, 0.006, -0.36, { faces: 'Y' });
  }));
  // the coffered ceiling: walnut beams across, a pair along
  runX(X0, X1, 12, (a, b) => s.structure(() => {
    g.mat('wood', '#4a3424', { rough: -0.05 });
    for (const z of [Z0 + 2.6, Z0 + 5.4]) g.box(a, H - 0.42, z - 0.14, b, H, z + 0.14, { faces: 'yzZ' });
    for (let x = Math.ceil(a / 4) * 4; x < b; x += 4) g.box(x - 0.14, H - 0.42, Z0, x + 0.14, H, GAL.z1, { faces: 'yxX' });
    g.mat('cast', C.brass); for (let x = Math.ceil(a / 4) * 4 - 2; x < b; x += 4) if (x > a) g.cyl(x, H - 0.48, Z0 + 4, 0.08, 0.06, { segs: 10 });
  }));
  // the band of wall over the reading room's open side, and the beam and columns along it
  wall(s, X0, GAL.z1, X1, GAL.z1, READ.h, H - READ.h, { tint: C.plaster, skirt: false });
  runX(X0, X1, 12, (a, b) => s.structure(() => { g.mat('wood', '#4a3424'); g.box(a, READ.h - 0.36, GAL.z1 - 0.2, b, READ.h + 0.12, GAL.z1 + 0.2, { bevel: 0.015 }); g.mat('wood', '#3a2a1e'); g.box(a, READ.h + 0.12, GAL.z1 - 0.12, b, READ.h + 0.22, GAL.z1 - 0.08); }));
  for (const x of [-22, -14, -6, 2, 18, 26]) {
    s.structure(() => {
      g.mat('wood', C.walnut, { rough: -0.1 }); g.box(x - 0.24, 0, -0.24, x + 0.24, READ.h - 0.36, 0.24, { bevel: 0.03 });
      g.mat('wood', '#3a2a1e'); g.box(x - 0.3, 0, -0.3, x + 0.3, 0.3, 0.3, { bevel: 0.02 }); g.box(x - 0.3, READ.h - 0.5, -0.3, x + 0.3, READ.h - 0.36, 0.3, { bevel: 0.02 });
    });
    s.post(x, 0, 0.3, 0, READ.h);
  }
  s.structure(() => { g.mat('wood', C.walnut); g.box(COOK.x0 - 0.3, 0, -0.3, COOK.x0 + 0.3, READ.h - 0.36, 0.3, { bevel: 0.03 }); });
  s.post(COOK.x0, 0, 0.32, 0, READ.h);
  // the window from the warm side: walnut below the sill, a deep sill, bronze mullions and transoms, an architrave
  for (const sp of WIN.spans) {
    const a = sp[0], b = sp[1];
    s.glass(a, WIN.y0, Z0, b, WIN.y1, Z0, { tint: '#cfe6f2', opacity: 0.035, rough: 0.12 });
    wainscotX(s, a, b, Z0, 1, WIN.y0 - 0.06, C.walnut);
    s.structure(() => {
      g.mat('wood', '#6b4a2f', { rough: -0.2 }); g.box(a - 0.1, WIN.y0 - 0.06, Z0 - 0.02, b + 0.1, WIN.y0, Z0 + 0.42, { bevel: 0.012 });
      g.mat('wood', C.walnut); g.box(a - 0.24, WIN.y1, Z0, b + 0.24, WIN.y1 + 0.3, Z0 + 0.12, { bevel: 0.012 });
      for (const x of [a - 0.12, b + 0.12]) g.box(x - 0.12, WIN.y0, Z0, x + 0.12, WIN.y1, Z0 + 0.12, { bevel: 0.012 });
      g.mat('cast', '#5a4a32', { rough: -0.15 });
      const n = Math.round((b - a) / 2.5);
      for (let i = 1; i < n; i++) { const x = a + (b - a) * i / n; g.box(x - 0.04, WIN.y0, Z0 - 0.1, x + 0.04, WIN.y1, Z0 + 0.06); }
      for (const y of [2.6, 4.8]) g.box(a, y - 0.035, Z0 - 0.1, b, y + 0.035, Z0 + 0.06);
    });
    // the brass rail, on posts, so nobody leans on the glass
    s.detail(() => {
      g.mat('cast', C.brass, { rough: -0.25 }); g.tube([[a + 0.2, 1.02, Z0 + 0.56], [b - 0.2, 1.02, Z0 + 0.56]], 0.026, { segs: 8 });
      g.mat('cast', '#5a4a32'); for (let x = a + 0.2; x <= b - 0.19; x += (b - a - 0.4) / Math.round((b - a - 0.4) / 2.5)) { g.tube([[x, 0, Z0 + 0.56], [x, 1.02, Z0 + 0.56]], 0.02, { segs: 6 }); g.cyl(x, 0, Z0 + 0.56, 0.05, 0.03, { segs: 8 }); }
    });
    s.solid(a, 0, Z0 + 0.5, b, 1.05, Z0 + 0.62);
  }
  // the pier between the windows: walnut, the cold walk's door, its plate, a clock of the stacks' temperature
  s.structure(() => {
    g.mat('wood', C.walnut, { rough: -0.08 }); g.box(-2.0, 0, Z0 + 0.08, -1.1, H, Z0 + 0.16); g.box(1.1, 0, Z0 + 0.08, 2.0, H, Z0 + 0.16); g.box(-1.1, 2.3, Z0 + 0.08, 1.1, H, Z0 + 0.16);
    g.mat('wood', '#3a2a1e'); g.box(-1.3, 2.3, Z0 + 0.08, 1.3, 2.48, Z0 + 0.24, { bevel: 0.01 }); for (const x of [-1.2, 1.2]) g.box(x - 0.1, 0, Z0 + 0.08, x + 0.1, 2.48, Z0 + 0.24, { bevel: 0.01 });
  });
  // a dial thermometer of the stacks over the door, its needle at minus eighty
  s.structure(() => {
    g.push(); g.move(0, 3.5, Z0 + 0.16); g.rotX(PI / 2);
    g.mat('cast', C.brass, { rough: -0.2 }); g.cyl(0, 0, 0, 0.42, 0.05, { segs: 24 });
    g.mat('paint', '#efe4c8'); g.cyl(0, 0.05, 0, 0.36, 0.01, { segs: 24 });
    g.pop();
    const zf = Z0 + 0.225;
    g.mat('paint', '#2a2622'); for (let i = 0; i <= 10; i++) { const a = -2.3 + i * 0.46; g.tube([[Math.sin(a) * 0.3, 3.5 + Math.cos(a) * 0.3, zf], [Math.sin(a) * 0.34, 3.5 + Math.cos(a) * 0.34, zf]], 0.006, { segs: 3, caps: false }); }
    g.mat('paint', '#7a2a26'); g.tube([[0, 3.5, zf + 0.004], [Math.sin(-1.84) * 0.29, 3.5 + Math.cos(-1.84) * 0.29, zf + 0.004]], 0.01, { segs: 4 });
    g.mat('cast', C.brass); g.cyl(0, 3.5, zf, 0.02, 0.01, { segs: 8 });
  });
  sign(s, { kind: 'plate', text: 'The cold walk', lines: ['minus twenty · coats on, please'] }, 0, 2.7, Z0 + 0.25, { face: 'Z', w: 0.62, h: 0.26 });
  sign(s, { kind: 'label', text: 'Stacks', lines: ['minus eighty'], ink: '#3a2c14' }, 0, 3.36, Z0 + 0.235, { face: 'Z', w: 0.3, h: 0.12 });
  // the end walls: the library's name over the coat room door; over the receiving glass, what is behind it
  wainscotZ(s, Z0 + 0.1, GALDOOR.z0 - 0.2, X0, 1, 2.4, C.walnut); wainscotZ(s, GALDOOR.z1 + 0.2, GAL.z1 - 0.3, X0, 1, 2.4, C.walnut);
  sign(s, { kind: 'letters', text: 'The strain library', palette: ['#e8d3a0'] }, X0 + 0.1, 5.0, -4, { face: 'X', w: 6.4, h: 1.0, glow: 0.7 });
  sign(s, { kind: 'letters', text: 'two of everything · kept cold · written down', font: 'caps', palette: ['#c9a45a'] }, X0 + 0.1, 4.15, -4, { face: 'X', w: 5.2, h: 0.32, glow: 0.5 });
  sign(s, { kind: 'letters', text: 'The receiving bench', palette: ['#e8d3a0'] }, X1 - 0.1, 5.0, -4, { face: 'x', w: 5.6, h: 0.9, glow: 0.7 });
  // benches facing the window, standard lamps between them
  const CLOTH = [C.oxblood, '#2f6f73', '#8a6a2a', '#2f6f73', C.oxblood, '#5b4060'];
  [-21, -13, -6, 6, 13, 21].forEach((x, i) => {
    prop(s, 'keellib.bench', x, 0, Z0 + 2.9, PI, { w: 2.4, cloth: CLOTH[i] }, i % 2 ? { noSpots: true } : { spot: { tags: ['read'] } });
    s.interact({ x, y: 0.7, z: Z0 + 2.75, radius: 1.3, prompt: 'Sit and watch the stacks', onUse(gm) { if (gm.player && gm.player.sit) gm.player.sit({ x, y: 0, z: Z0 + 2.8, yaw: 0 }); } });
  });
  for (const x of [-17, -9.5, 9.5, 17, -26.5, 26.5]) {
    prop(s, 'keellib.floorlamp', x, 0, Z0 + 3.0, 0, {});
    s.light({ at: [x, 1.38, Z0 + 3.0], color: warm(2600), power: 3.6, range: 5.5, radius: 0.2, lamp: true, clip: GCLIP });
  }
  // warm sconces on the columns, and the cold of the stacks coming through the glass
  for (const x of [-22, -14, -6, 2, 18, 26]) lamp(s, 'sconce', x, 2.7, -0.26, { face: 'z', K: 2600, power: 0.9, clip: GCLIP });
  s.light({ at: [-26, 3.2, Z0 + 0.35], to: [26, 3.2, Z0 + 0.35], type: 'tube', color: [0.55, 0.72, 0.95], power: 7, range: 6, radius: 2.5, nospec: true, clip: GCLIP });
  s.ambient({ box: [X0, 0, Z0, X1, H, GAL.z1], sky: '#ffd9a8', ground: '#5a4030', power: 0.14, soft: 0.6, spec: 0.4, lamp: true });
  s.loop('air', 0, 2.5, Z0 + 0.4, { vol: 0.22, radius: 18 });
  // look into the stacks
  s.interact({ x: -12, y: 1.3, z: Z0 + 0.9, radius: 1.8, prompt: 'Look into the stacks', onUse: async (gm) => {
    const h = gm.clock ? gm.clock.hours : 12;
    await say(gm, 'The long window', [
      'The stacks go down two decks below your feet and up two above your head: decks nine to thirteen, all one cold room, all of it at minus eighty.',
      'Thirty-six carousels in three rows. Fifteen shelves to a carousel, eleven tins to a shelf, thirty-three vials to a tin: about a hundred and ninety-six thousand vials, near enough one for every thousand people in Chervil. The librarians say that is a coincidence, and are pleased about it anyway.',
      h >= 23 || h < 6.5 ? 'The cranes work through the lamp-night like everything else in the Keel. The lamp-night belongs to the machines.' : 'Every lid is coloured for its row: gold for the vat cultures, green for the fungi and the plants, violet for the cell lines and the starters.',
    ]);
  } });
  s.interact({ x: 14, y: 1.3, z: Z0 + 0.9, radius: 1.8, prompt: 'Watch the crane', onUse: async (gm) => {
    await say(gm, 'The long window', [
      'A stacker crane runs the middle aisle on one rail, slower than you would walk on your knees. It stops at a carousel, climbs, puts out two steel tines and takes one tin by its waist.',
      'It carries the tin to the port at the end of its aisle, where tins go out to the receiving bench or down to a seed room, and brings another back. The crane is older than anyone in the gallery.',
      'Nine days ago a tin from row A went out of the other crane\'s port to the Flour Hall\'s seed room, for Line 9. The blight board in the coat room says how it is getting on.',
    ]);
  } });
  for (const p of [[-16.5, 0.15], [-3.4, -0.2], [10.5, 0.2], [24, -0.1]]) s.spot('stand', p[0], 0, Z0 + 0.95, PI + p[1], { tags: ['rail'] });
  // the courier at the receiving hatch with a cold box, waiting for a signature
  prop(s, 'keellib.coldbox', X1 - 0.75, 0, -1.9, 0.3, {});
  s.spot('stand', X1 - 1.0, 0, -3.0, PI / 2, { tags: ['wait', 'courier'] });
  s.interact({ x: X1 - 1.2, y: 1.0, z: -2.4, radius: 1.5, kind: 'talk', prompt: 'Ask about the cold box', onUse: async (gm) => {
    await say(gm, 'The courier', [
      'Today\'s second copies. When the receiver signs, this box goes to the far vault under Ring Eight, about two kilometres back along the Keel. The cab takes four minutes and the box holds minus eighty for six hours, so nobody runs.',
      'Twice a day, at ten and at four. In three hundred years the far vault has only ever been a place to put things. That is what it is for.',
    ]);
  } });
  s.zoneBox({ id: 'keel-library-gallery', place: 'keel-library', box: [X0, -0.5, Z0, X1, H, GAL.z1], name: 'The long window', sub: 'The strain library · the reading gallery', ambience: 'quiet', reverb: 'felt', headroom: H, env: WARM });
}

// ---------------------------------------------------------------------------------------------------------------
// the reading room: four long tables under green lamps, the files on two walls, the issue desk, two day books
// ---------------------------------------------------------------------------------------------------------------
const TABLES = [[-20, 5.6], [-4, 5.6], [-20, 10.4], [-4, 10.4]];
const COVERS = ['#6e2a2a', '#2f5a44', '#2f4a6a', '#8a6a2a', '#5b4060'];
function readingRoom(game, s) {
  const g = s.g, X0 = READ.x0, X1 = READ.x1, Z0 = READ.z0, Z1 = READ.z1, H = READ.h;
  floor(s, X0, Z0, COOK.x1, Z1, 0, 'carpet', '#5e2626');
  ceiling(s, X0, Z0, COOK.x1, Z1, H, 'plaster', '#e6d8bc');
  wall(s, X0, Z1, COOK.x1, Z1, 0, H, { tint: '#cdb48a', skirt: '#3a2a1e' });
  wall(s, X1, 4, X1, Z1, 0, H, { tintA: '#d8c3a0', tintB: '#cdb48a', skirt: '#3a2a1e' });
  // a border of oak and ochre round the carpet, beams across the ceiling with felt between
  runX(X0, X1, 10, (a, b) => s.structure(() => {
    g.mat('carpet', '#a8823e'); g.box(a, 0, Z0 + 0.6, b, 0.006, Z0 + 0.74, { faces: 'Y' }); g.box(a, 0, Z1 - 1.2, b, 0.006, Z1 - 1.06, { faces: 'Y' });
    g.mat('wood', '#4a3424', { rough: -0.05 }); for (let x = Math.ceil(a / 4) * 4; x < b; x += 4) g.box(x - 0.12, H - 0.3, Z0, x + 0.12, H, Z1, { faces: 'yxX' });
    g.mat('felt', '#5b4060'); g.box(a, H - 0.04, Z0 + 0.3, b, H - 0.02, Z1 - 0.3, { faces: 'y' });
  }));
  // the files: tall shelves of ledgers along the back wall and the anti wall, one line per strain
  for (let k = 0; k < 16; k++) prop(s, 'keellib.files', X0 + 1.3 + k * 2.4, 0, Z1 - 0.28, PI, { w: 2.4, h: 3.6, seed: k });
  for (let k = 0; k < 5; k++) prop(s, 'keellib.files', X0 + 0.28, 0, Z0 + 1.6 + k * 2.4, PI / 2, { w: 2.4, h: 3.6, seed: 20 + k });
  // a rolling ladder on a brass rail along the back files
  s.structure(() => { g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[X0 + 0.3, 3.3, Z1 - 0.62], [X1 - 1.6, 3.3, Z1 - 0.62]], 0.018, { segs: 6 }); });
  s.furniture(() => {
    const x = -11.6;
    g.mat('wood', '#6b4a2f');
    for (const dx of [-0.25, 0.25]) g.tube([[x + dx, 0, Z1 - 1.5], [x + dx, 3.32, Z1 - 0.64]], 0.025, { segs: 5 });
    for (let i = 1; i < 11; i++) { const t = i / 11; g.box(x - 0.25, 3.32 * t - 0.012, Z1 - 1.5 + 0.86 * t - 0.03, x + 0.25, 3.32 * t + 0.012, Z1 - 1.5 + 0.86 * t + 0.05); }
    g.mat('cast', '#2a2622'); for (const dx of [-0.25, 0.25]) g.cyl(x + dx, 0, Z1 - 1.5, 0.04, 0.06, { segs: 8 });
  });
  // the tables, their chairs, their lamps and the light of each
  TABLES.forEach((t, ti) => {
    const [tx, tz] = t;
    prop(s, 'keellib.readtable', tx, 0, tz, 0, { w: 11 });
    for (let i = 0; i < 8; i++) {
      const x = tx - 4.9 + i * 1.4;
      // only some chairs are anybody's: it is a quiet room
      prop(s, 'chair', x, 0, tz - 0.86, 0, { wood: (i + ti) % 3 ? '#6b4a2f' : '#5a3e2a', back: 'slat' }, (i * 3 + ti) % 6 === 0 ? { spot: { tags: ['read'] } } : { noSpots: true });
      prop(s, 'chair', x + 0.1, 0, tz + 0.86, PI, { wood: (i + ti) % 4 ? '#6b4a2f' : '#7a5a3a', back: 'slat' }, (i * 5 + ti) % 8 === 3 ? { spot: { tags: ['read'] } } : { noSpots: true });
      if ((i * 3 + ti) % 4 === 0) prop(s, 'keellib.ledger', x + 0.05, 0.753, tz - 0.36, 0.06 * (i % 3) - 0.05, { open: true, cover: COVERS[(i + ti) % COVERS.length] });
      if ((i * 5 + ti) % 6 === 1) prop(s, 'keellib.ledger', x + 0.15, 0.753, tz + 0.38, PI + 0.1, { open: true, cover: COVERS[(i + ti + 2) % COVERS.length] });
      if ((i + ti) % 5 === 3) { prop(s, 'keellib.ledger', x - 0.3, 0.753, tz - 0.36, 0.3, { cover: COVERS[i % COVERS.length] }); prop(s, 'keellib.ledger', x - 0.3, 0.813, tz - 0.36, 0.1, { cover: COVERS[(i + 3) % COVERS.length] }); }
    }
    for (const dx of [-4.1, -1.4, 1.4, 4.1]) {
      prop(s, 'keellib.greenlamp', tx + dx, 0.83, tz, 0, { h: 0.4 });
      s.light({ at: [tx + dx, 1.14, tz], color: warm(2500), power: 2.2, range: 3.4, radius: 0.15, lamp: true, clip: RCLIP });
    }
  });
  s.ambient({ box: [X0, 0, Z0, COOK.x1, H, Z1], sky: '#ffd5a0', ground: '#6a3424', power: 0.17, soft: 0.6, spec: 0.35, lamp: true });
  // the issue desk by the gallery, the card index behind it, the librarian
  s.furniture(() => {
    g.mat('wood', C.walnut, { rough: -0.1 }); g.box(-27.4, 0, 1.7, -23.6, 0.95, 2.3, { bevel: 0.015 });
    g.mat('weave', '#2f5a44', { rough: 0.1 }); g.box(-27.3, 0.95, 1.75, -23.7, 0.965, 2.25, { faces: 'Y' });
    g.mat('wood', '#3a2a1e'); g.box(-27.5, 0, 1.65, -23.5, 0.12, 2.35);
    g.mat('cast', C.brass, { rough: -0.2 }); g.lathe(-24.2, 2.0, [[0.05, 0.965], [0.05, 0.98], [0.04, 1.0], [0.02, 1.05], [0, 1.06]], { segs: 12 });
    g.mat('wood', C.walnut); g.box(-27.2, 0, 3.4, -24.0, 1.1, 3.9, { bevel: 0.012 });
    g.mat('cast', C.brass); for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) g.box(-27.0 + i * 0.4, 0.2 + j * 0.24, 3.39, -26.86 + i * 0.4, 0.24 + j * 0.24, 3.4, { faces: 'z' });
  });
  prop(s, 'keellib.ledger', -25.6, 0.965, 2.0, PI, { open: true, cover: '#6e2a2a' });
  prop(s, 'keellib.greenlamp', -26.8, 0.965, 2.05, 0.4, { h: 0.42 });
  s.light({ at: [-26.8, 1.35, 2.05], color: warm(2500), power: 2, range: 3, radius: 0.15, lamp: true, clip: RCLIP });
  prop(s, 'chair', -25.6, 0, 2.95, PI, { wood: '#5a3e2a', back: 'slat' }, { noSpots: true });
  s.spot('work', -25.6, 0, 2.95, PI, { tags: ['write', 'notes'] });
  sign(s, { kind: 'plate', text: 'Issue desk', lines: ['any file · any hour the halls keep'] }, -25.5, 0.62, 1.68, { face: 'z', w: 0.5, h: 0.22 });
  s.interact({ x: -25.5, y: 1.0, z: 1.1, radius: 1.7, kind: 'talk', prompt: 'Ask the librarian', onUse: async (gm) => {
    const LIB = 'The librarian';
    const q = await choose(gm, LIB, 'Where have you slept, and have you eaten. Good. You may read anything in here. What would you like.', [
      { label: 'How many copies do you keep', value: 'copies' },
      { label: 'Why must everything pass the Gate', value: 'gate' },
      { label: 'Who comes here to read', value: 'who' },
      { label: 'Nothing. Thank you', value: null },
    ]);
    if (q === 'copies') await say(gm, LIB, ['Two of everything, cold. One here, and one in the far vault under Ring Eight, about two kilometres back, so that nothing that happens at one end of the drum can happen to both.', 'The genome is written down twice as well: in the ledgers on these shelves, and lodged with Tansy, who keep the longest strain library on the Row and like to be asked.']);
    else if (q === 'gate') await say(gm, LIB, ['Because here a phage is a famine. A vat line is one strain in a few hundred cubic metres of broth, and one virus that suits it takes the lot.', 'So nothing alive comes into a drum except through the Gate at the station rings: sealed, certified, sequenced, a crate in fifty opened on the bench. What passes is filed here the day it passes, with the name of whoever carried it.']);
    else if (q === 'who') await say(gm, LIB, ['Cooks, mostly, and the old. People come to read what their hall\'s yeast is descended from, find it came from Sorrel three hundred years ago, and are a little put out.', 'Anyone may ask for any file. Nothing in here is secret except the temperature, and that is written on the door.']);
  } });
  // two day books on lecterns in the cross aisle
  const lectern = (x, z, cover) => {
    s.furniture(() => {
      g.mat('wood', C.walnut, { rough: -0.1 }); g.lathe(x, z, [[0.3, 0], [0.3, 0.05], [0.08, 0.1], [0.06, 1.0], [0.1, 1.05]], { segs: 12 });
      g.push(); g.move(x, 1.08, z); g.rotX(-0.32); g.box(-0.36, -0.03, -0.26, 0.36, 0.02, 0.26, { bevel: 0.01 }); g.mat('wood', '#3a2a1e'); g.box(-0.36, -0.03, 0.24, 0.36, 0.06, 0.28); g.pop();
    });
    s.detail(() => { g.push(); g.move(x, 1.1, z); g.rotX(-0.32); g.mat('weave', cover); g.box(-0.32, 0, -0.22, 0.32, 0.012, 0.22); g.mat('paper', '#efe6d0'); g.box(-0.3, 0.012, -0.21, -0.005, 0.03, 0.21, { faces: 'xXzZY' }); g.box(0.005, 0.012, -0.21, 0.3, 0.03, 0.21, { faces: 'xXzZY' }); g.mat('paint', '#3a3430'); for (let k = 0; k < 10; k++) { g.box(-0.27, 0.031, -0.17 + k * 0.034, -0.04, 0.0312, -0.166 + k * 0.034, { faces: 'Y' }); g.box(0.04, 0.031, -0.17 + k * 0.034, 0.26 - (k % 4) * 0.04, 0.0312, -0.166 + k * 0.034, { faces: 'Y' }); } g.pop(); });
    s.post(x, z, 0.32, 0, 1.2);
  };
  lectern(-12, 5.6, '#6e2a2a'); lectern(-12, 10.4, '#2f5a44');
  for (const z of [5.6, 10.4]) lamp(s, 'globe', -12, 2.6, z, { K: 2600, power: 0.8, drop: 1.4, clip: RCLIP });
  s.interact({ x: -12, y: 1.1, z: 4.9, radius: 1.4, prompt: 'Read the flour ledger', onUse: async (gm) => {
    await say(gm, 'The flour ledger', [
      'Open at Line 9. One line for every event in the strain\'s life, in a dozen hands over three hundred years.',
      'The first line: received from Sorrel\'s library through the Gate, with the yeasts, when Chervil set up its vat lines. Two vials here, two under Ring Eight, the genome written out at the back of the book.',
      'Regrown four times since: three blights and one bad batch of steam. Each time about three days from vial to vat, once the hall was clean.',
      'The newest line, in fresh ink: Line 9, phage, day eleven. One vial issued to the Flour Hall\'s seed room on day two. Stock renewed: eight new vials laid down the same week. The far copy not touched. It never has been.',
    ]);
  } });
  s.interact({ x: -12, y: 1.1, z: 9.7, radius: 1.4, prompt: "Read the starters' ledger", onUse: async (gm) => {
    await say(gm, "The starters' ledger", [
      'Open at this month. One line for each household starter registered, in the receiver\'s hand.',
      'A wholemeal mother from a block hall on deck 140, filed by its cook, who is ninety-three, so that the grandchildren cannot lose it. A rice ferment brought by a family from Rue, filed the week they came, with the Gate\'s seal number beside it.',
      'A crock marked only Gran\'s. Four vials, two here and two under Ring Eight. In the margin, in pencil: Do not ask.',
      'At the foot of the page, printed: A registered starter is kept as a frozen vial and a genome. Registering costs nothing. A starter that has not been through the Gate is not registered, however good the bread.',
    ]);
  } });
  s.spot('work', -11.6, 0, Z1 - 1.1, 0, { tags: ['notes'] });
  s.spot('stand', -5.0, 0, Z1 - 0.9, 0, { tags: ['read', 'board'] });
  s.zoneBox({ id: 'keel-library-reading', place: 'keel-library', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The reading room', sub: 'The strain library · the files', ambience: 'quiet', reverb: 'felt', headroom: H, env: WARM });
}

// ---------------------------------------------------------------------------------------------------------------
// the cooks' doors: a wall of small brass doors, one for every hall that asked; the keeper's counter; one name to read
// ---------------------------------------------------------------------------------------------------------------
const NAMED = { x: 20.15, y: 0.45 + 3.5 * 0.3 };
function cooksDoors(game, s) {
  const g = s.g, X0 = COOK.x0, X1 = COOK.x1, Z0 = COOK.z0, Z1 = COOK.z1, H = COOK.h;
  // oak boards over the carpet here, and a rug
  s.structure(() => { g.mat('planks', '#7a5a3a', { rough: 0.15 }); g.box(X0 + 0.2, 0, Z0 + 0.4, X1 - 0.1, 0.01, Z1 - 0.1, { faces: 'Y' }); });
  prop(s, 'rug', 21, 0.012, 7.6, 0, { w: 9, d: 5, a: '#8a2f3c', b: '#d6a640', mat: 'motif' });
  // the end wall: glass to the receiving bench for its first six metres, then doors
  wall(s, X1, Z0, X1, 6, 0, H, { tintA: '#e6ebe8', tintB: '#cdb48a', openings: [{ at: 0.4, w: 5.2, h: 2.3, sill: 0.9 }], skirt: '#3a2a1e' });
  wall(s, X1, 6, X1, Z1, 0, H, { tintA: '#e6ebe8', tintB: '#cdb48a', skirt: '#3a2a1e' });
  s.glass(X1, 0.9, Z0 + 0.4, X1, 3.2, 5.6, { tint: '#e6f0ec', opacity: 0.08 });
  s.structure(() => { g.mat('wood', C.walnut); g.box(X1 - 0.12, 0.84, Z0 + 0.3, X1 + 0.02, 0.9, 5.7, { bevel: 0.01 }); for (const z of [Z0 + 0.3, 3.0, 5.7]) g.box(X1 - 0.1, 0.9, z - 0.05, X1 + 0.02, 3.2, z + 0.05); });
  // the wall of doors: five sections on the back wall, two on the end wall, two on the partition (the new wall)
  for (let k = 0; k < 5; k++) prop(s, 'keellib.doors', X0 + 2.4 + k * 3.8, 0.45, Z1 - 0.1, PI, { cols: 12, rows: 10 });
  for (let k = 0; k < 2; k++) prop(s, 'keellib.doors', X1 - 0.1, 0.45, 8.6 + k * 3.8, -PI / 2, { cols: 12, rows: 10 });
  prop(s, 'keellib.doors', X0 + 0.1, 0.45, 12.6, PI / 2, { cols: 12, rows: 10 });
  prop(s, 'keellib.doors', X0 + 0.1, 0.45, 8.7, PI / 2, { cols: 12, rows: 10, blank: 68 });
  // a ledge under them with crocks waiting for the Gate's seal, and a stack of new doors still dull
  s.structure(() => { g.mat('wood', C.walnut, { rough: -0.1 }); g.box(X0 + 0.4, 0.36, Z1 - 0.38, X1 - 0.4, 0.42, Z1 - 0.1, { bevel: 0.01 }); });
  for (let i = 0; i < 9; i++) prop(s, 'crock', 12.8 + i * 1.9 + (i % 2) * 0.3, 0.42, Z1 - 0.25, i * 0.7, { glaze: ['#a3563a', '#2f6f73', '#d9cfb8', '#6b7a3a', '#8a6a2a'][i % 5], h: 0.24 + (i % 3) * 0.04 });
  s.detail(() => { g.mat('cast', '#7a6a4a', { rough: 0.2 }); for (let i = 0; i < 6; i++) g.box(X0 + 0.5, 0.012 * i * 2.6, 5.4 + (i % 2) * 0.02, X0 + 0.8, 0.012 * i * 2.6 + 0.028, 5.68 + (i % 2) * 0.02); });
  // the named door: polished pale by hands, a red card, a pencil note pinned under it
  s.detail(() => {
    const x = NAMED.x, y = NAMED.y, z = Z1 - 0.1 - 0.026;
    g.mat('cast', '#e2c486', { rough: -0.35 }); g.box(x - 0.13, y - 0.13, z - 0.004, x + 0.13, y + 0.13, z, { faces: 'z' });
    g.mat('paper', '#c9553e'); g.box(x - 0.08, y + 0.02, z - 0.006, x + 0.08, y + 0.08, z - 0.004, { faces: 'z' });
    g.mat('paper', '#f3ead2'); g.box(x - 0.1, y - 0.33, z - 0.004, x + 0.08, y - 0.15, z - 0.002, { faces: 'z' });
    g.mat('cast', C.brass); g.cyl(x - 0.01, y - 0.17, z - 0.01, 0.008, 0.01, { segs: 6 });
  });
  sign(s, { kind: 'letters', text: "The cooks' doors", palette: ['#c9a45a'] }, 20, 3.86, Z1 - 0.12, { face: 'z', w: 4.4, h: 0.5, glow: 0.5 });
  sign(s, { kind: 'plate', text: 'One door for every hall that asked', lines: ['1,012 halls · two vials behind each door · two under Ring Eight'] }, 13.6, 3.68, Z1 - 0.12, { face: 'z', w: 1.2, h: 0.3 });
  sign(s, { kind: 'notice', title: 'The new wall', lines: ['Brass remade from old', 'door plates, a door at a time.', 'A hall that asks gets the', 'next slot. No charge.'] }, X0 + 0.14, 2.1, 6.2, { face: 'X', w: 0.4, h: 0.5 });
  // the keeper's counter, side-on by the partition, and a chair for cooks who need to sit
  s.furniture(() => {
    g.mat('wood', C.walnut, { rough: -0.1 }); g.box(12.6, 0, 4.8, 13.3, 1.0, 9.0, { bevel: 0.015 });
    g.mat('weave', '#6e2a2a', { rough: 0.1 }); g.box(12.55, 1.0, 4.75, 13.35, 1.02, 9.05, { bevel: 0.006 });
    g.mat('wood', '#3a2a1e'); g.box(12.5, 0, 4.7, 13.4, 0.1, 9.1);
    g.mat('cast', C.brass, { rough: -0.2 }); g.lathe(13.0, 8.6, [[0.05, 1.02], [0.05, 1.04], [0.03, 1.07], [0, 1.09]], { segs: 12 });
  });
  prop(s, 'keellib.ledger', 12.95, 1.02, 6.3, PI / 2, { open: true, cover: '#2f5a44' });
  prop(s, 'cup', 13.1, 1.02, 7.6, 0, {});
  prop(s, 'chair', 11.8, 0, 6.6, PI / 2, { wood: '#5a3e2a', back: 'slat' }, { noSpots: true });
  s.spot('work', 11.8, 0, 6.6, PI / 2, { tags: ['write'] });
  prop(s, 'chair', 15.4, 0, 6.2, -PI / 2 + 0.3, { wood: '#7a5a3a', seat: '#c9963e' }, { spot: { tags: ['wait'] } });
  s.spot('customer', 13.9, 0, 7.6, -PI / 2, { tags: ['ask'] });
  prop(s, 'keellib.bench', 21.5, 0, 10.6, 0, { w: 3.0, cloth: '#2f6f73' }, { spot: { tags: ['read'] } });
  prop(s, 'plant', 28.9, 0, 1.0, 0, { size: 1.2, kind: 'fine', pot: '#a3563a' });
  prop(s, 'plant', 17.0, 0, 13.9, 0, { size: 0.8, kind: 'fern', pot: '#2f6f73' });
  for (const x of [15.2, 24.6]) s.spot('browse', x, 0, Z1 - 0.95, 0, { tags: ['read'] });
  // light: a warm wash down the door wall, a lamp over the counter
  // brass picture lights on arms over the doors, each throwing its pool down the brass
  for (let k = 0; k < 5; k++) {
    const x = X0 + 2.4 + k * 3.8;
    s.deco(() => {
      g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[x, 3.62, Z1 - 0.1], [x, 3.72, Z1 - 0.42]], 0.014, { segs: 5 });
      g.push(); g.move(x, 3.72, Z1 - 0.46); g.rotZ(PI / 2); g.cyl(0, -0.9, 0, 0.055, 1.8, { segs: 10 }); g.pop();
      g.mat('diffuser', '#ffe6b8', { emissive: 3 }); g.box(x - 0.85, 3.665, Z1 - 0.49, x + 0.85, 3.67, Z1 - 0.43, { faces: 'y' });
    });
    s.light({ at: [x, 3.6, Z1 - 0.6], type: 'spot', dir: [0, -0.85, 0.53], cone: [62, 30], color: warm(2700), power: 5, range: 4.2, lamp: true, clip: KCLIP });
  }
  s.light({ at: [X1 - 0.6, H - 0.4, 6.4], to: [X1 - 0.6, H - 0.4, Z1 - 0.8], type: 'tube', color: warm(2700), power: 1.6, range: 3.2, radius: 0.08, lamp: true, clip: KCLIP });
  lamp(s, 'globe', 13.0, 2.4, 7.0, { K: 2600, power: 0.9, drop: 1.6, clip: KCLIP });
  for (const z of [8.6, 12.4]) s.light({ at: [X1 - 0.6, 3.6, z], type: 'spot', dir: [0.53, -0.85, 0], cone: [62, 30], color: warm(2700), power: 4, range: 4, lamp: true, clip: KCLIP });
  s.deco(() => { for (const z of [8.6, 12.4]) { g.mat('cast', C.brass, { rough: -0.2 }); g.push(); g.move(X1 - 0.46, 3.72, z); g.rotX(PI / 2); g.cyl(0, -0.9, 0, 0.055, 1.8, { segs: 10 }); g.pop(); g.mat('diffuser', '#ffe6b8', { emissive: 3 }); g.box(X1 - 0.49, 3.665, z - 0.85, X1 - 0.43, 3.67, z + 0.85, { faces: 'y' }); } });
  s.interact({ x: NAMED.x, y: NAMED.y, z: Z1 - 0.7, radius: 1.2, prompt: 'Read the door with a name on it', onUse: async (gm) => {
    await say(gm, 'Door 388', [
      'The brass is worn pale round the knob. The card behind its little window reads: the Crumb Street hall, deck 64, Ring Three. Cook: Ines Varga-Holm. One rye mother, filed two hundred and twelve years ago by the cook before the cook before last.',
      'Pinned under the card, a note in pencil: Not dead yet. Do not open. I.V.H. And under that, in a different hand: Noted. Not opened. The library.',
    ]);
  } });
  s.interact({ x: 13.9, y: 1.0, z: 7.0, radius: 1.6, kind: 'talk', prompt: 'Ask the keeper of the doors', onUse: async (gm) => {
    const K = 'The keeper of the doors';
    const opts = [
      { label: 'Whose doors are these', value: 'whose' },
      { label: 'How does a hall get a door', value: 'how' },
      { label: 'What happens when a crock dies', value: 'dies' },
    ];
    if (gm.inv && gm.inv.has && gm.inv.has('spelt-mother')) opts.push({ label: "I am carrying a spoon of Spelt's mother", value: 'spelt' });
    opts.push({ label: 'Nothing. Thank you', value: null });
    const q = await choose(gm, K, 'Where have you slept, and have you eaten. Good. Every door on this wall is a hall being proud of itself. Ask.', opts);
    if (q === 'whose') await say(gm, K, ['One for every hall in Chervil that has asked for one: a thousand and twelve, out of sixty-five thousand halls. The rest cook from the Vats\' lines and the Mill and are perfectly happy. These are the proud ones.', 'The new wall by the counter has its first hundred and seventy-two. The brass for the rest is being remade from old door plates. New brass would be twenty-five kays a kilo, and no hall would let us.']);
    else if (q === 'how') await say(gm, K, ['The cook brings a spoon of the crock in a sealed pot. It goes through the Gate like anything alive, has its genome read, and comes back here as four vials: two behind the door and two under Ring Eight. The door costs the hall nothing.', 'The name card costs the cook a speech at the next block court about why their bread is better than everyone else\'s. Most of them have it ready.']);
    else if (q === 'dies') await say(gm, K, ['The cook comes here, usually not saying much. We open the door, take out one vial, and in about a week the hall\'s crock is back, the same mother to the cell. Then we lay down a new vial, so the door is full again.', 'Doors have been opened for eleven halls in all the years the wall has stood. Every one of those cooks sat in that chair for a while afterwards. A starter is an heirloom as well as a file.']);
    else if (q === 'spelt') await say(gm, K, ['With a Gate seal on the pot already. Good. Then it has been read at Spelt and again at the station, and it is safe to carry to whoever it is for.', 'If their hall wants it kept, they bring us a spoon and it gets a door. There is no mother from Grain Row on this wall yet. We would put it at eye height.']);
  } });
  s.zoneBox({ id: 'keel-library-cooks', place: 'keel-library', box: [X0, -0.5, Z0, X1, H, Z1], name: "The cooks' doors", sub: 'The strain library · mothers and starters', ambience: 'quiet', reverb: 'felt', headroom: H, env: WARM });
}

// ---------------------------------------------------------------------------------------------------------------
// the receiving bench: behind glass at the gallery's end; a glove box, a crate from the Gate, the readers, the cold door
// ---------------------------------------------------------------------------------------------------------------
function receiving(game, s) {
  const g = s.g, B = RECV, clip = [B.x0, -0.3, B.z0, B.x1, B.h + 0.1, B.z1];
  floor(s, B.x0, B.z0, B.x1, B.z1, 0, 'speckle', '#cdd5d1');
  ceiling(s, B.x0, B.z0, B.x1, B.z1, B.h, 'panel', '#e2e6e3');
  const w = { tint: '#e6ebe8', dado: { h: 1.2, mat: 'tile', tint: '#b9d4c8' }, skirt: '#5d6e78' };
  wall(s, B.x0, B.z0, B.x1, B.z0, 0, B.h, w);
  wall(s, B.x1, B.z0, B.x1, B.z1, 0, B.h, w);
  wall(s, B.x0, B.z1, B.x1, B.z1, 0, B.h, w);
  // the glass wall from the gallery: walnut below on the gallery side, steel above
  wall(s, B.x0, GAL.z0, B.x0, GAL.z1, 0, GAL.h, { tintA: '#e6ebe8', tintB: C.plaster, openings: [{ at: 0.5, w: 7.0, h: 2.3, sill: 0.9 }], skirt: '#3a2a1e' });
  s.glass(B.x0, 0.9, GAL.z0 + 0.5, B.x0, 3.2, GAL.z0 + 7.5, { tint: '#e6f0ec', opacity: 0.08 });
  wainscotZ(s, GAL.z0 + 0.2, GAL.z1 - 0.3, B.x0, -1, 0.84, C.walnut);
  s.structure(() => {
    g.mat('wood', C.walnut); g.box(B.x0 - 0.3, 0.84, GAL.z0 + 0.4, B.x0 + 0.02, 0.9, GAL.z0 + 7.6, { bevel: 0.01 });
    g.mat('cast', '#5d6e78'); for (const z of [GAL.z0 + 0.5, GAL.z0 + 2.83, GAL.z0 + 5.17, GAL.z0 + 7.5]) g.box(B.x0 - 0.04, 0.9, z - 0.04, B.x0 + 0.04, 3.2, z + 0.04);
    // the pass hatch through the glass: a steel box with a door each side
    g.mat('brushed', '#c9cfcc', { rough: -0.15 }); g.box(B.x0 - 0.35, 0.9, -3.45, B.x0 + 0.35, 1.5, -2.55, { bevel: 0.015 });
    g.mat('brushed', '#a9b0ad'); g.box(B.x0 - 0.36, 0.95, -3.35, B.x0 - 0.35, 1.45, -2.65, { faces: 'x' }); g.box(B.x0 + 0.35, 0.95, -3.35, B.x0 + 0.36, 1.45, -2.65, { faces: 'X' });
    g.mat('cast', '#3a4248'); g.box(B.x0 - 0.38, 1.18, -2.75, B.x0 - 0.36, 1.22, -2.68);
  });
  sign(s, { kind: 'label', text: 'Pass hatch', lines: ['ring and wait'], ink: '#2a2622' }, B.x0 - 0.37, 1.6, -3.0, { face: 'x', w: 0.42, h: 0.14 });
  // the glove box against the stacks' wall, the receiver at it; the crate from the Gate on its trolley
  prop(s, 'keellib.glovebox', 33.6, 0, B.z0 + 0.6, 0, {});
  s.light({ at: [33.6, 1.6, B.z0 + 0.6], color: [0.86, 0.94, 1.0], power: 1.2, range: 2.4, radius: 0.3, clip });
  s.spot('work', 33.6, 0, B.z0 + 1.55, PI, { tags: ['crew', 'gloves'] });
  prop(s, 'keellib.trolley', 35.8, 0, B.z0 + 2.3, -0.2, {});
  if (SIGNS['quayside.crate.starter']) sign(s, SIGNS['quayside.crate.starter'], 35.8 + 0.02, 0.5, B.z0 + 2.3 + 0.31, { face: 'Z', w: 0.5, h: 0.16 });
  // the readers: a bench of instruments that read a genome, and the log desk
  prop(s, 'keellib.steelbench', B.x1 - 0.4, 0, -3.6, -PI / 2, { w: 3.6, d: 0.7 });
  [['#7fe0d0', -5.0], ['#f2b56b', -4.1], ['#7fe0d0', -3.2], ['#7fe08a', -2.3]].forEach((q) => prop(s, 'keellib.reader', B.x1 - 0.42, 0.9, q[1], -PI / 2, { w: 0.6, lit: q[0] }));
  s.spot('work', B.x1 - 1.3, 0, -3.6, PI / 2, { tags: ['notes'] });
  prop(s, 'keellib.steelbench', 35.5, 0, B.z1 - 0.4, PI, { w: 2.2, d: 0.6 });
  prop(s, 'keellib.ledger', 35.2, 0.9, B.z1 - 0.42, PI, { open: true, cover: '#2f4a6a' });
  prop(s, 'stool', 35.4, 0, B.z1 - 1.0, 0, {});
  // the day's arrivals in chalk, a rack of sealed pots waiting their turn, the receiver's coat on its peg
  sign(s, { kind: 'chalk', title: 'From the Gate today', lines: ['Starters · 14 pots', 'Tansy · 2 yeast lines', 'Sorrel · 3 tea cuttings', 'Rue · 1 rice ferment', 'All seals checked'] }, 32.4, 1.75, B.z1 - 0.1, { face: 'z', w: 1.0, h: 1.3 });
  prop(s, 'shelving', 38.4, 0, B.z1 - 0.25, PI, { w: 2.2, h: 2.0, d: 0.4, shelves: 4, wood: '#8d989e' });
  for (let i = 0; i < 15; i++) prop(s, 'crock', 37.5 + (i % 5) * 0.42, 0.105 + Math.floor(i / 5) * 0.475, B.z1 - 0.28, i, { glaze: ['#d9cfb8', '#a3563a', '#2f6f73', '#e6e0d0', '#6b7a3a'][i % 5], h: 0.2 + (i % 3) * 0.03, r: 0.08 });
  s.detail(() => { g.mat('paint', C.red); for (let i = 0; i < 15; i++) { const x = 37.5 + (i % 5) * 0.42, y = 0.105 + Math.floor(i / 5) * 0.475; g.box(x - 0.03, y + 0.1, B.z1 - 0.37, x + 0.03, y + 0.15, B.z1 - 0.36, { faces: 'z' }); } });
  prop(s, 'keellib.coat', 31.0, 1.95, B.z1 - 0.2, PI, { cloth: '#3a5a7a', mend: '#d6a640' });
  // the cold door to the stacks: thick, insulated, frost at its seals
  s.furniture(() => {
    g.mat('panel', '#c9d0cc'); g.box(36.3, 0, B.z0 + 0.08, 38.0, 2.3, B.z0 + 0.3, { bevel: 0.03 });
    g.mat('cast', '#3a4248'); g.box(36.15, 0, B.z0 + 0.08, 36.3, 2.42, B.z0 + 0.34); g.box(38.0, 0, B.z0 + 0.08, 38.15, 2.42, B.z0 + 0.34); g.box(36.15, 2.3, B.z0 + 0.08, 38.15, 2.42, B.z0 + 0.34);
    g.mat('cast', '#d6a640'); g.tube([[37.7, 1.1, B.z0 + 0.3], [37.7, 1.1, B.z0 + 0.42], [37.3, 1.1, B.z0 + 0.42]], 0.02, { segs: 6 });
  });
  for (let y = 0.3; y < 2.3; y += 0.55) for (const x of [36.25, 38.05]) s.glowCard(x, y, B.z0 + 0.38, { face: 'Z', color: '#f2f8ff', size: 0.45, strength: 0.12, follow: 'always' });
  sign(s, { kind: 'plate', text: 'Cold room', lines: ['to the stacks · minus eighty'] }, 37.15, 1.65, B.z0 + 0.31, { face: 'Z', w: 0.5, h: 0.22 });
  // the freight shutter from the Gate's lift
  s.structure(() => { g.mat('panel', '#8d989e'); g.box(B.x1 - 0.12, 0, 0.6, B.x1 - 0.08, 2.6, 3.6); g.mat('cast', '#5d6e78'); for (let y = 0.1; y < 2.6; y += 0.13) g.box(B.x1 - 0.13, y, 0.6, B.x1 - 0.12, y + 0.04, 3.6, { faces: 'x' }); g.mat('paint', '#d6a640'); g.box(B.x1 - 0.13, 0, 0.6, B.x1 - 0.12, 0.1, 3.6, { faces: 'x' }); });
  sign(s, { kind: 'plate', text: 'From the Gate', lines: ['freight lift · sealed crates only'] }, B.x1 - 0.14, 2.9, 2.1, { face: 'x', w: 0.6, h: 0.24 });
  for (const p of [[33.2, -3.0], [37.2, 1.4]]) lamp(s, 'panel', p[0], B.h, p[1], { K: 4000, w: 1.4, d: 0.6, power: 0.9, clip });
  s.path([[B.x1 - 0.7, 2.1], [36.0, 1.6], [34.2, -2.8], [33.6, B.z0 + 1.9]]);
  s.path([[36.0, 1.6], [B.x1 - 1.3, -2.2]]);
  s.interact({ x: B.x0 - 0.7, y: 1.3, z: -5.6, radius: 1.8, prompt: 'Watch the receiving bench', onUse: async (gm) => {
    await say(gm, 'The receiving bench', [
      'Behind the glass a receiver works with both arms in a glove box. On a trolley beside them stands a crate from the Gate, its seal still on: STARTERS, for the strain library, via the Gate.',
      'One pot at a time goes into the box. The receiver checks the Gate\'s seal against its paper, opens the pot inside the glass, takes a loop of it into four vials, and writes the line: what it is, whose, from which drum, carried by whom, passed on which day.',
      'Nothing alive comes into a drum except through the Gate, because here a phage is a famine. What the Gate passes is filed here the day it passes. Two vials go to the stacks, and two into the courier\'s box for the far vault.',
    ]);
  } });
  s.zoneBox({ id: 'keel-library-receiving', place: 'keel-library', box: [B.x0, -0.5, B.z0, B.x1, B.h, B.z1], name: 'The receiving bench', sub: 'The strain library · from the Gate', ambience: 'quiet', reverb: 'room', headroom: B.h, env: WARM });
}

// ---------------------------------------------------------------------------------------------------------------
// walkways: from the berths through the coat room, down the gallery, into the reading room and to the cooks' doors
// ---------------------------------------------------------------------------------------------------------------
function walkways(s) {
  s.path([[CAB.x0 + 1.4, 0], [-46, 0], [-42, 0], [-38, -1.8], [-33.2, -4.5], [-30, -4.5], [-27, -3.2]], { width: 1.4 });
  s.path([[-27, -3.2], [-12, -2.8]], { width: 1.6 });
  s.path([[-12, -2.8], [0, -3.2]], { width: 1.6 });
  s.path([[0, -3.2], [12, -2.8]], { width: 1.6 });
  s.path([[12, -2.8], [GAL.x1 - 1.6, -3.0]], { width: 1.6 });
  s.path([[-27, -3.2], [-25.5, 1.0]]);
  s.path([[-12, -2.8], [-12, 1.2], [-12, 8]], { width: 1.2 });
  s.path([[-12, 8], [-12, 13.4]]);
  s.path([[-12, 8], [-27, 8]]);
  s.path([[12, -2.8], [14.4, 2.2], [15.6, 7.0], [20, 13.6]]);
}
