// The rooms round the Simmer (see lm_up_decks.js): the cab lobby, Second Pot (the tea room), the Up Table (where Ring
// Three's elders are given their flats), Potherb Lane with its doors and the one garden left open, and at the lane's end
// the Carver and the foot of the Lake Stair. Frame 'up-decks'.
import { floor, ceiling, wall, lamp, roomGlow, block } from '../world/kit.js';
import { room } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { shadeHex, mixHex } from '../core/util.js';
import { PI, LOBBY, TEA, TABLE, LANE, FOOT, GARDEN, HALL, PAL, say, toast, card, sfx, custom, tick, run, pick } from './lm_up_decks_props.js';

export async function buildRooms(game, s, f) {
  lobby(game, s, f);
  await tick(game);
  teaRoom(game, s, f);
  await tick(game);
  upTable(game, s, f);
  await tick(game);
  lane(game, s, f);
  await tick(game);
  garden(game, s, f);
  foot(game, s, f);
}

// ---------------------------------------------------------------------------------------------------------------
// the cab lobby: two berths, a bench each side, the deck plate, the way to everything
// ---------------------------------------------------------------------------------------------------------------
function lobby(game, s, f) {
  const g = s.g, L = LOBBY, clip = [L.x0 - 0.1, -0.2, L.z0 - 0.1, L.x1 + 0.1, L.h + 0.1, L.z1 + 1.5];
  floor(s, L.x0, L.z0, L.x1, L.z1, 0, 'terrazzo', '#d6c6a4');
  ceiling(s, L.x0, L.z0, L.x1, L.z1, L.h, 'paint', '#e9dfc8');
  const w = { mat: 'tile', tint: PAL.cream, dado: { h: 1.2, mat: 'tile', tint: PAL.teal }, skirt: PAL.deep };
  wall(s, L.x0, L.z0, L.x1, L.z0, 0, L.h, w);
  wall(s, L.x0, L.z0, L.x0, L.z1, 0, L.h, w);
  wall(s, L.x1, L.z0, L.x1, L.z1, 0, L.h, w);
  s.structure(() => {
    g.mat('tile', PAL.coral); g.box(L.x0 + 0.08, 1.2, L.z0 + 0.08, L.x1 - 0.08, 1.28, L.z0 + 0.1, { faces: 'Z' });
    g.box(L.x0 + 0.08, 1.2, L.z0 + 0.08, L.x0 + 0.1, 1.28, L.z1, { faces: 'X' }); g.box(L.x1 - 0.1, 1.2, L.z0 + 0.08, L.x1 - 0.08, 1.28, L.z1, { faces: 'x' });
    g.mat('wood', PAL.dark); for (let z = L.z0 + 2; z < L.z1; z += 2.5) g.box(L.x0 + 0.08, L.h - 0.22, z - 0.09, L.x1 - 0.08, L.h, z + 0.09, { bevel: 0.012 });
    // a compass of the drum's own words set in the floor: spinward, anti, front, back, a ring for up
    g.mat('mosaic', PAL.deep); g.box(-1.3, 0, -41.3, 1.3, 0.004, -38.7, { faces: 'Y' });
    g.mat('mosaic', PAL.cream); g.box(-1.15, 0.004, -41.15, 1.15, 0.007, -38.85, { faces: 'Y' });
    g.mat('mosaic', PAL.coral); g.box(-0.06, 0.007, -41.0, 0.06, 0.01, -39.0, { faces: 'Y' }); g.box(-1.0, 0.007, -40.06, 1.0, 0.01, -39.94, { faces: 'Y' });
    g.mat('mosaic', PAL.ochre); g.box(-0.22, 0.01, -40.22, 0.22, 0.013, -39.78, { faces: 'Y' });
  });
  // the berths in the back wall
  s.furniture(() => {
    for (const bx of [-2.3, 2.3]) {
      const bw = 1.3, z = L.z0 + 0.08;
      g.mat('stone', '#9c8f7c'); g.box(bx - bw / 2 - 0.2, 0, z, bx + bw / 2 + 0.2, 2.66, z + 0.16, { bevel: 0.01 });
      g.mat('cast', PAL.brass, { rough: -0.1 }); g.box(bx - bw / 2, 0.02, z + 0.16, bx - 0.01, 2.36, z + 0.2); g.box(bx + 0.01, 0.02, z + 0.16, bx + bw / 2, 2.36, z + 0.2);
      g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(bx - bw / 2 + 0.06, yy, z + 0.2, bx + bw / 2 - 0.06, yy + 0.03, z + 0.215);
      g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(bx - 0.2, 2.45, z + 0.16, bx + 0.2, 2.53, z + 0.19);
      g.mat('cast', '#3a3430'); g.box(bx + bw / 2 + 0.26, 1.05, z, bx + bw / 2 + 0.42, 1.3, z + 0.08, { bevel: 0.01 });
      g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.box(bx + bw / 2 + 0.31, 1.13, z + 0.08, bx + bw / 2 + 0.37, 1.2, z + 0.09);
    }
  });
  for (const bx of [-2.3, 2.3]) s.interact({ x: bx, y: 1.2, z: L.z0 + 0.8, radius: 1.7, prompt: 'Call a cab', onUse: (gm) => { sfx(gm, 'berth-door', f, bx, 1.2, L.z0 + 0.3); if (gm.cab) gm.cab.open('up-decks'); } });
  sign(s, { kind: 'street', text: 'Cabs · deck 340', sub: 'Ring Three', palette: ['#1d4a4f', '#f1ead8'] }, 0, 2.95, L.z0 + 0.1, { face: 'Z', w: 1.8, h: 0.4, glow: 0.8 });
  // benches with a rail along each side wall, sticks, ferns
  for (const sx of [-1, 1]) {
    prop(s, 'updecks.bench', sx * (L.x1 - 0.42), 0, -41.5, sx > 0 ? -PI / 2 : PI / 2, { w: 2.4, wood: '#7a5233', cushion: sx > 0 ? PAL.plum : PAL.ochre }, { spot: { tags: ['lobby'] } });
    s.detail(() => { g.mat('cast', PAL.brass, { rough: -0.2 }); const x = sx * (L.x1 - 0.14); g.tube([[x, 0.92, L.z0 + 0.6], [x, 0.92, L.z1 - 0.4]], 0.022, { segs: 8 }); for (let z = L.z0 + 0.8; z < L.z1 - 0.3; z += 1.6) g.tube([[x, 0.92, z], [sx * (L.x1 - 0.08), 0.92, z]], 0.012, { segs: 5 }); });
    prop(s, 'baths.fernpot', sx * (L.x1 - 0.5), 0, L.z0 + 0.6, 0.4, { pot: sx > 0 ? PAL.coral : PAL.teal, size: 1.15 });
    prop(s, 'baths.fernpot', sx * (L.x1 - 0.5), 0, -36.2, 1.4, { pot: PAL.ochre, size: 0.95 });
  }
  prop(s, 'updecks.sticks', -5.6, 0, -38.0, 0.3, { n: 5, seed: 1 });
  // the deck plate and the way board
  sign(s, { kind: 'plate', text: 'Deck 340', lines: ['Ring Three', '1,644 m from the axis', '0.55 g'] }, L.x0 + 0.1, 1.65, -38.3, { face: 'X', w: 0.62, h: 0.4 });
  const WAY = { kind: 'board', title: 'This way', lines: ['The Simmer · straight on', 'Second Pot, tea · the Simmer, anti side', 'The Up Table · the Simmer, anti side', 'Potherb Lane · the Simmer, spinward side', 'The Carver · the end of the lane', 'The Lake Stair · the end of the lane'], palette: [PAL.deep, '#f2e8d2', PAL.coral] };
  sign(s, WAY, L.x1 - 0.1, 1.7, -38.6, { face: 'x', w: 1.3, h: 0.9 });
  s.interact({ x: L.x0 + 0.8, y: 1.4, z: -38.3, radius: 1.4, prompt: 'Read the deck plate', onUse(gm) {
    card(gm, 'A brass plate by the berths', 'Deck 340', 'Ring Three, the High decks. 1,644 metres from the axis, so 0.55 of a g: you weigh a little over half what you weighed on the glide platform, and a fall here carries a little over half the hurt. That is why the old come up. The Hollow\'s floor is thirty-six decks over your head.');
    custom(gm, 'The High decks');
  } });
  s.interact({ x: L.x1 - 0.8, y: 1.4, z: -38.6, radius: 1.4, prompt: 'Read the way board', onUse(gm) { say(gm, { name: 'This way', colour: '#FFD9A0' }, ['The Simmer, straight on. Second Pot and the Up Table off the Simmer\'s anti side; Potherb Lane off its spinward side, and at the lane\'s end the Carver and the Lake Stair.', 'Chalked at the bottom: ramen Thursday, the long table on 341, guests eat free.']); } });
  // light: two panels, the berths' own glow, and the hall's light through the arch
  for (const z of [-43.2, -38.2]) lamp(s, 'panel', 0, L.h - 0.02, z, { w: 1.6, d: 0.6, clip, K: 2900, power: 0.75 });
  roomGlow(s, L.x0, 0, L.z0, L.x1, L.h, L.z1, { sky: '#ffe0b8', ground: '#c9b08a', power: 0.28 });
  for (const sx of [-1, 1]) s.spot('stand', sx * 3.6, 0, -44.8, 0, { tags: ['wait', 'lobby'] });
  s.spot('stand', 0.9, 0, -44.9, 0, { tags: ['wait', 'lobby'] });
  s.path([[0, -45.2], [0, -42.2], [0, -39.5], [0, -36.5]]);
  s.path([[0, -42.2], [-2.3, -45.0]], { width: 1.2 }); s.path([[0, -42.2], [2.3, -45.0]], { width: 1.2 });
  s.zoneBox({ id: 'up-decks-lobby', place: 'up-decks', box: [L.x0, -0.5, L.z0, L.x1, L.h, L.z1], name: 'The Simmer', sub: 'Cabs · deck 340 · Ring Three', ambience: 'baths', reverb: 'room' });
}

// ---------------------------------------------------------------------------------------------------------------
// Second Pot: the tea room behind glass, looking onto the water
// ---------------------------------------------------------------------------------------------------------------
const TEA_KEEPER = { name: 'Roza at Second Pot', colour: '#e8b86a' };
const NOTES = [
  ['A yearly note, in a child\'s print', 'To whoever was Abel Marsh before me. I am seven. I have your share and a cat drawn on my bag. We do not have cats, so it is drawn. I can swim the long way in the Simmer with a float. Mum says say thank you, so thank you.'],
  ['A yearly note, two hands', 'For the family of Teodora Vance. Our Teo is eleven this year and already taller than her father. She cooks the Thursday rice at her school hall and burns it twice a month, which we are told is the proper rate. She asks every year whether Teodora liked rice. Did she.'],
  ['A yearly note, on blue card', 'To Dunya Okafor\'s people, from Dunya the younger, nineteen. I go on my wander year in the spring. I will carry her name round the Row and bring it back. Somebody has to tell me which drums she liked, so I can go to the others first.'],
  ['A yearly note, very short', 'Mirela is three. She says no to everything. We think Mirela the elder would have approved. Love from the Pashas, Ring Six.'],
  ['A yearly note, folded small', 'From the table of little Jonah Reyes, four, to the family of Jonah Reyes, ninety-eight. He has your laugh, people say, though none of us heard it. Would you come to his naming day lunch, on the long table on 112. There will be lids. There will be noise.'],
];
function teaRoom(game, s, f) {
  const g = s.g, T = TEA, clip = [T.x0 - 0.1, -0.2, T.z0 - 0.1, T.x1 + 0.6, T.h + 0.1, T.z1 + 0.1];
  room(s, { x0: T.x0, z0: T.z0, x1: T.x1, z1: T.z1, h: T.h, floor: ['planks', '#9a6a42'], ceil: ['paint', '#e8d8b8'], wall: { tint: '#e3b46a', mat: 'plaster', dado: { h: 1.0, mat: 'flute', tint: PAL.plum }, skirt: PAL.dark }, open: { e: false }, glow: { sky: '#ffd6a0', ground: '#9a6a42', power: 0.3 } });
  s.structure(() => {
    g.mat('wood', PAL.dark); for (let z = T.z0 + 2; z < T.z1; z += 2.6) g.box(T.x0 + 0.08, T.h - 0.2, z - 0.09, T.x1 - 0.08, T.h, z + 0.09, { bevel: 0.012 });
    g.mat('tile', PAL.coral); g.box(T.x0 + 0.08, 1.0, T.z0 + 0.08, T.x0 + 0.1, 1.06, T.z1 - 0.08, { faces: 'X' });
  });
  // felt baffles, plum and ochre, between the beams
  s.deco(() => { for (let k = 0; k < 5; k++) { g.mat('felt', [PAL.ochre, PAL.plum, PAL.teal, PAL.coral, PAL.ochre][k]); const z = T.z0 + 3.3 + k * 2.6; g.sheet([T.x0 + 0.6, T.h - 0.22, z], [T.x1 - 0.6, T.h - 0.22, z], [T.x1 - 0.6, T.h - 0.62, z], [T.x0 + 0.6, T.h - 0.62, z], { nu: 8, nv: 2, sag: 0.06 }); } });
  // the counter along the back wall: urns on the loop, pots and cups on the shelves
  prop(s, 'counter', T.x0 + 1.4, 0, -14, PI / 2, { w: 4.2, d: 0.7, body: PAL.teal, top: '#8a6240' }, { noSpots: true });
  s.spot('counter', T.x0 + 0.75, 0, -14, PI / 2, { tags: ['keeper', 'serve', 'tea'] });
  s.spot('work', T.x0 + 0.75, 0, -15.6, PI / 2, { tags: ['serve', 'tea'] });
  for (const z of [-15.2, -13.6, -12.4]) s.spot('customer', T.x0 + 2.35, 0, z, -PI / 2, { tags: ['tea'] });
  prop(s, 'baths.urn', T.x0 + 1.45, 0.92, -15.4, PI / 2, {});
  prop(s, 'baths.urn', T.x0 + 1.45, 0.92, -12.6, PI / 2, {});
  const glz = [PAL.cream, PAL.sea, PAL.ochre, PAL.coral, '#e8d9b8', PAL.plum];
  for (let i = 0; i < 6; i++) prop(s, 'baths.teapot', T.x0 + 1.4, 0.92, -14.6 + i * 0.22, 0.5 * i, { glaze: glz[i] });
  for (const shz of [-17.6, -10.4]) {
    prop(s, 'shelving', T.x0 + 0.2, 0, shz, PI / 2, { w: 1.8, h: 2.1, d: 0.32, shelves: 4, wood: '#6b4a2f' });
    for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) prop(s, i % 3 === 0 ? 'baths.teapot' : 'cup', T.x0 + 0.22, 0.105 + r * 0.495, shz - 0.7 + i * 0.28, i * 0.6, i % 3 === 0 ? { glaze: glz[(r + i) % 6] } : { glaze: glz[(r * 2 + i) % 6], lid: glz[(r + i + 3) % 6] });
  }
  sign(s, { kind: 'chalk', title: 'Second Pot', lines: ['Long-pour tea · 0.15', 'A pot for the table · 0.25', 'Ginger biscuit · 0.05', 'Broth · free', 'Guests · on the house'] }, T.x0 + 0.1, 2.15, -14, { face: 'X', w: 0.9, h: 1.0 });
  sign(s, { kind: 'letters', text: 'Second Pot', palette: [PAL.plum] }, T.x0 + 0.1, 2.95, -14, { face: 'X', w: 2.2, h: 0.36 });
  // tables by the glass and in the room, chairs with backs, lidded cups, a game of cards half played
  const tables = [[-17.2, -19.6], [-17.2, -15.0], [-17.2, -10.6], [-21.6, -18.2], [-21.6, -12.0], [-24.6, -8.4]];
  tables.forEach((tb, k) => {
    prop(s, 'table', tb[0], 0, tb[1], 0, { w: 0.9, round: true, wood: '#5a3d28', top: ['#8a6240', '#9a7448', '#7a5233'][k % 3] });
    const n = k === 5 ? 4 : 3;
    for (let c = 0; c < n; c++) { const a = c / n * PI * 2 + k; prop(s, 'chair', tb[0] + Math.sin(a) * 0.72, 0, tb[1] + Math.cos(a) * 0.72, a + PI, { wood: ['#6b4a2f', '#7a5233', '#5a3d28'][(k + c) % 3], back: 'slat', seat: ['#d9c08a', '#c9a46a'][c % 2] }, { spot: { tags: ['tea'] } }); }
    prop(s, 'baths.teapot', tb[0], 0.74, tb[1], k, { glaze: glz[k % 6] });
    prop(s, 'cup', tb[0] + 0.22, 0.74, tb[1] - 0.1, 0, { glaze: glz[(k + 2) % 6], lid: glz[(k + 4) % 6] });
    prop(s, 'cup', tb[0] - 0.2, 0.74, tb[1] + 0.14, 0, { glaze: glz[(k + 3) % 6], lid: glz[(k + 1) % 6] });
  });
  s.detail(() => { g.mat('paper', '#f2e8d2'); for (let i = 0; i < 5; i++) g.box(-21.9 + i * 0.09, 0.741, -12.2 + (i % 2) * 0.05, -21.84 + i * 0.09, 0.745, -12.11 + (i % 2) * 0.05); g.mat('paper', PAL.coral); g.box(-21.4, 0.741, -11.85, -21.3, 0.75, -11.7); });
  // two armchairs and a fern in the far corner
  prop(s, 'updecks.armchair', -27.8, 0, -7.2, PI * 0.8, { cloth: PAL.plum, mend: PAL.ochre }, { spot: { tags: ['tea'] } });
  prop(s, 'updecks.armchair', -26.4, 0, -6.9, PI * 1.15, { cloth: PAL.teal }, { spot: { tags: ['tea'] } });
  prop(s, 'baths.fernpot', -28.3, 0, -21.3, 0, { pot: PAL.coral, size: 1.2 });
  prop(s, 'baths.fernpot', -16.0, 0, -6.6, 1, { pot: PAL.ochre, size: 1.0 });
  // the glass onto the Simmer: frames in the hall's wall openings
  s.structure(() => {
    g.mat('wood', PAL.dark);
    for (const z0 of [-21, -17, -13]) { for (const z of [z0, z0 + 1.9, z0 + 3.8]) g.box(-15.06, 0.75, z - 0.04, -14.94, 2.5, z + 0.04, { bevel: 0.006 }); g.box(-15.12, 0.7, z0, -14.88, 0.78, z0 + 3.8, { bevel: 0.008 }); g.box(-15.06, 2.46, z0, -14.94, 2.52, z0 + 3.8, { bevel: 0.006 }); }
  });
  for (const z0 of [-21, -17, -13]) { s.glass(-15, 0.78, z0 + 0.04, -15, 2.46, z0 + 1.86, { tint: '#e2efe8', opacity: 0.1 }); s.glass(-15, 0.78, z0 + 1.94, -15, 2.46, z0 + 3.76, { tint: '#e2efe8', opacity: 0.1 }); s.solid(-15.08, 0, z0, -14.92, 2.55, z0 + 3.8); }
  sign(s, { kind: 'label', text: 'Second Pot · tea', ink: '#f1e6c9' }, -14.86, 2.62, -7.9, { face: 'X', w: 1.1, h: 0.16 });
  // the yearly notes: a rack of pigeonholes on the front wall, cards in most of them
  s.furniture(() => {
    const z = T.z0 + 0.1, x0 = -26.5, x1 = -23.3, y0 = 1.0, y1 = 2.2;
    g.mat('wood', '#5a3d28'); g.box(x0, y0, z, x1, y1, z + 0.26, { faces: 'Z' });
    g.box(x0 - 0.05, y0 - 0.05, z, x1 + 0.05, y0, z + 0.28, { bevel: 0.008 }); g.box(x0 - 0.05, y1, z, x1 + 0.05, y1 + 0.05, z + 0.28, { bevel: 0.008 });
    for (let i = 0; i <= 8; i++) { const x = x0 + (x1 - x0) * i / 8; g.box(x - 0.012, y0, z, x + 0.012, y1, z + 0.26); }
    for (let j = 1; j < 4; j++) { const y = y0 + (y1 - y0) * j / 4; g.box(x0, y - 0.01, z, x1, y + 0.01, z + 0.26); }
    const cc = [PAL.paper, '#cfe0f0', '#f2d9c0', PAL.paper, '#e8e0f0', '#d9ecd0'];
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { if ((i * 3 + j * 5) % 7 === 0) continue; const x = x0 + (x1 - x0) * (i + 0.5) / 8, y = y0 + (y1 - y0) * j / 4 + 0.012; g.mat('paper', cc[(i + j) % 6]); g.box(x - 0.14, y, z + 0.06, x + 0.14, y + 0.2 - (i % 2) * 0.04, z + 0.075 + (j % 2) * 0.02); }
  });
  s.solid(-26.55, 0.95, T.z0 + 0.08, -23.25, 2.25, T.z0 + 0.38);
  sign(s, { kind: 'label', text: 'Yearly notes · read them here, put them back', ink: '#2a2218' }, -24.9, 2.42, T.z0 + 0.11, { face: 'Z', w: 2.3, h: 0.16, board: false });
  prop(s, 'updecks.armchair', -24.9, 0, -20.4, PI, { cloth: PAL.coral }, { spot: { tags: ['tea', 'read'] } });
  s.interact({ x: -24.9, y: 1.5, z: T.z0 + 0.9, radius: 1.6, prompt: 'Read one of the yearly notes', onUse(gm) {
    const k = (gm.flags.upNotes || 0) % NOTES.length; gm.flags.upNotes = k + 1;
    sfx(gm, 'paper', f, -24.9, 1.6, T.z0 + 0.3);
    card(gm, NOTES[k][0], 'The yearly notes', NOTES[k][1] + ' (Once a year, by hand, from each family whose child carries one of the dead\'s shares, to that person\'s family. Up here they are read over tea, and then aloud.)');
    custom(gm, 'Yearly notes');
  } });
  // ordering tea
  s.interact({ x: T.x0 + 2.4, y: 1.2, z: -14, radius: 1.8, kind: 'talk', prompt: 'Ask Roza for tea', async onUse(gm) {
    if (!gm.ui) return;
    if (!gm.flags.upTeaMet) { gm.flags.upTeaMet = true; await say(gm, TEA_KEEPER, ['Where did you sleep. A Margin flat, good. Have you eaten. Then tea.', 'Guests drink on the house up here. The old ones pay, because they like to, and argue about the change.']); }
    gm.busy++; let c = null;
    try { c = await gm.ui.choose(TEA_KEEPER, 'She has the pot in one hand and a cup in the other already.', [{ label: 'A long-pour tea', sub: 'on the house for a guest, 0.15 for anyone else', value: 'tea' }, { label: 'Pay for it anyway', cost: 0.15, value: 'pay' }, { label: 'Nothing, thank you', value: null }]); } finally { gm.busy--; }
    if (!c) return;
    if (c === 'pay' && gm.wallet && gm.wallet.spend && !gm.wallet.spend(0.15, 'Long-pour tea')) { toast(gm, 'Not enough in the wallet. Roza pours it anyway.'); }
    sfx(gm, 'pour', f, T.x0 + 1.6, 1.2, -14); sfx(gm, 'lid-down', f, T.x0 + 1.6, 1.0, -14);
    toast(gm, 'She pours from a hand\'s height above her shoulder. The stream falls slowly and lands a hair anti of where she aims, so she aims a hair spinward. A lid on it straight away: heliox steals the heat.', 'gain');
    custom(gm, 'Lids');
    if (c === 'pay') await say(gm, TEA_KEEPER, ['Fifteen hundredths. You did not have to. The man by the window will tell you it was twelve when he came up.']);
  } });
  // lanterns over the tables, a globe over the counter
  const lt = [[-17.2, -19.6, PAL.ochre], [-17.2, -10.6, PAL.coral], [-21.6, -18.2, '#f2c879'], [-21.6, -12.0, PAL.ochre], [-24.6, -8.4, PAL.coral]];
  for (const l of lt) lamp(s, 'lantern', l[0], 2.25, l[1], { tint: l[2], drop: T.h - 2.4, clip, K: 2500, power: 0.75 });
  lamp(s, 'globe', T.x0 + 1.4, 2.3, -14, { r: 0.16, drop: 0.9, clip, K: 2700, power: 0.8 });
  // walkways
  s.path([[-15.8, -7.9], [-17.4, -8.0], [-19.4, -9.0], [-19.4, -14.0], [T.x0 + 2.6, -14.0]], { width: 1.2 });
  s.path([[-19.4, -14.0], [-19.4, -18.8], [-24.9, -19.4]], { width: 1.1 }); s.path([[-19.4, -9.0], [-23.0, -9.6], [-26.6, -8.6]], { width: 1.0 });
  s.zoneBox({ id: 'up-decks-tea', place: 'up-decks', box: [T.x0, -0.5, T.z0, T.x1, T.h, T.z1], name: 'Second Pot', sub: 'Tea by the Simmer · deck 340', ambience: 'shop', reverb: 'felt' });
}

// ---------------------------------------------------------------------------------------------------------------
// the Up Table: one long table where Ring Three's elders are given their flats up here, a board of who came up this
// year, chairs for the families, the notice that says who is offered and when
// ---------------------------------------------------------------------------------------------------------------
const CLERK = { name: 'Haruto, clerk of the Up Table', colour: '#c9a0d8' };
const MOVES = [
  'Ama Boateng, 96 · from 77 · to 344, a balcony flat',
  'Piet and Lena Varga, 97 and 94 · from 140 · to 352',
  'Sundar Iyer, 95 · from 61 · to 341',
  'Noor Haddad, 101 · from 23 · to 340, Potherb Lane',
  'Esteban Ruiz, 95 · from 208 · to 347',
  'Kalinda Moss, 89 · from 18, knees · to 343',
  'Olu and Bram Adeyemi-Holt, 95 and 99 · from 96 · to 350',
  'Yevgenia Sato, 95 · from 133 · to 341',
];
function upTable(game, s, f) {
  const g = s.g, T = TABLE, clip = [T.x0 - 0.1, -0.2, T.z0 - 0.1, T.x1 + 0.6, T.h + 0.1, T.z1 + 0.1];
  room(s, { x0: T.x0, z0: T.z0, x1: T.x1, z1: T.z1, h: T.h, floor: ['planks', '#7a5233'], ceil: ['paint', '#e6d4b0'], wall: { tint: '#ecd9b2', mat: 'plaster', dado: { h: 1.1, mat: 'flute', tint: PAL.deep }, skirt: PAL.dark }, open: { e: false }, glow: { sky: '#ffd8a8', ground: '#7a5233', power: 0.3 } });
  s.structure(() => {
    g.mat('wood', PAL.dark); for (let x = T.x0 + 2.2; x < T.x1; x += 2.75) g.box(x - 0.1, T.h - 0.24, T.z0 + 0.08, x + 0.1, T.h, T.z1 - 0.08, { bevel: 0.014 });
    g.mat('tile', PAL.ochre); g.box(T.x0 + 0.08, 1.1, T.z0 + 0.08, T.x1 - 0.08, 1.16, T.z0 + 0.1, { faces: 'Z' }); g.box(T.x0 + 0.08, 1.1, T.z1 - 0.1, T.x1 - 0.08, 1.16, T.z1 - 0.08, { faces: 'z' });
    // a runner down the room under the table, plum with an ochre border
    g.mat('motif', PAL.plum); g.box(-34, 0.004, 8.4, -18.4, 0.012, 11.6, { faces: 'Y' });
    g.mat('weave', PAL.ochre); g.box(-34, 0.004, 8.3, -18.4, 0.014, 8.45, { faces: 'Y' }); g.box(-34, 0.004, 11.55, -18.4, 0.014, 11.7, { faces: 'Y' });
  });
  // felt hangings on the long walls, in Chervil's loud colours
  s.deco(() => {
    const cols = [PAL.coral, PAL.ochre, PAL.teal, PAL.plum, '#8a2f3c', PAL.ochre];
    for (let k = 0; k < 6; k++) { const x0 = T.x0 + 1.6 + k * 3.4; for (const sz of [-1, 1]) { const z = sz < 0 ? T.z0 + 0.1 : T.z1 - 0.1; g.mat('felt', cols[(k + (sz > 0 ? 3 : 0)) % 6]); g.sheet([x0, 3.2, z], [x0 + 1.6, 3.2, z], [x0 + 1.6, 1.4, z], [x0, 1.4, z], { nu: 5, nv: 4, ripple: 0.02, rippleN: 6 }); } }
  });
  // the long table: fourteen metres of it, the clerk's end by the board
  s.furniture(() => {
    g.mat('wood', '#6b4a2f', { rough: -0.08 }); g.box(-33.0, 0.7, 9.4, -19.0, 0.76, 10.6, { bevel: 0.015 });
    g.mat('wood', PAL.dark); for (let x = -32.4; x <= -19.5; x += 2.15) for (const z of [9.55, 10.45]) g.box(x - 0.04, 0, z - 0.04, x + 0.04, 0.7, z + 0.04, { bevel: 0.006 });
    g.box(-32.9, 0.6, 9.5, -19.1, 0.7, 9.56); g.box(-32.9, 0.6, 10.44, -19.1, 0.7, 10.5);
  });
  s.solid(-33.0, 0, 9.4, -19.0, 0.76, 10.6, { surf: 'wood' });
  // chairs both sides: elders on the room side, the clerk and the ring's people at the head
  for (let i = 0; i < 9; i++) {
    const x = -31.6 + i * 1.5;
    prop(s, 'chair', x, 0, 8.75, 0, { wood: ['#6b4a2f', '#5a3d28', '#7a5233'][i % 3], back: i % 2 ? 'slat' : 'hoop', seat: '#c9a46a' }, { spot: { tags: ['uptable'] } });
    prop(s, 'chair', x + 0.4, 0, 11.25, PI, { wood: ['#5a3d28', '#7a5233', '#6b4a2f'][i % 3], back: 'slat', seat: '#d9c08a' }, { spot: { tags: ['uptable'] } });
  }
  prop(s, 'updecks.armchair', -33.7, 0, 10, PI / 2, { cloth: PAL.plum, mend: PAL.ochre }, { noSpots: true });
  s.spot('work', -33.5, 0.49, 10, PI / 2, { tags: ['notes', 'uptable'] });
  s.spot('sit', -33.5, 0.49, 10, PI / 2, { tags: ['uptable', 'clerk'] });
  // on the table: lidded dishes (it is a hall drum: there is always food), the ledger of places, key rings in a tray, a bell
  const glz = [PAL.cream, PAL.sea, PAL.ochre, PAL.coral, '#e8d9b8', PAL.plum];
  for (let i = 0; i < 6; i++) prop(s, 'bowl', -30.6 + i * 2.2, 0.76, 10.0, 0, { glaze: glz[i], lid: glz[(i + 3) % 6], r: 0.12 });
  for (let i = 0; i < 10; i++) prop(s, 'cup', -31.4 + i * 1.3, 0.76, i % 2 ? 9.65 : 10.35, 0, { glaze: glz[(i + 1) % 6], lid: glz[(i + 4) % 6] });
  s.detail(() => {
    g.mat('paper', '#e9dcc0'); g.box(-32.8, 0.76, 9.7, -32.2, 0.8, 10.3, { bevel: 0.006 });
    g.mat('weave', PAL.deep); g.box(-32.82, 0.76, 9.68, -32.18, 0.775, 10.32, { faces: 'xXzZ' });
    g.mat('wood', '#4a3220'); g.box(-31.9, 0.76, 9.7, -31.4, 0.8, 10.0, { bevel: 0.006 });
    g.mat('cast', PAL.brass, { rough: -0.2 });
    for (let k = 0; k < 6; k++) { const x = -31.8 + (k % 3) * 0.14, z = 9.78 + Math.floor(k / 3) * 0.12; g.tube([[x - 0.035, 0.81, z], [x, 0.815, z - 0.035], [x + 0.035, 0.81, z], [x, 0.815, z + 0.035]], 0.004, { segs: 4, closed: true }); g.box(x + 0.03, 0.805, z - 0.006, x + 0.09, 0.815, z + 0.006); }
    g.lathe(-32.5, 10.45, [[0, 0.76], [0.045, 0.76], [0.045, 0.77], [0.032, 0.8], [0.01, 0.83], [0.008, 0.845], [0, 0.845]], { segs: 12 });
  });
  // the board of the year's moves up, on the end wall over the clerk
  const BOARD = { kind: 'board', title: 'Up this week · Ring Three', lines: MOVES, palette: [PAL.deep, '#f2e8d2', PAL.ochre] };
  sign(s, BOARD, T.x0 + 0.1, 2.15, 10, { face: 'X', w: 3.4, h: 1.75 });
  sign(s, { kind: 'plate', text: 'This year', lines: ['this table: 3,118 came up', 'Ring Three: 162,400', 'asked for another year: 1 in 9'] }, T.x0 + 0.1, 0.95, 10, { face: 'X', w: 0.9, h: 0.42 });
  sign(s, { kind: 'letters', text: 'The Up Table', palette: [PAL.ochre] }, T.x0 + 0.1, 3.2, 10, { face: 'X', w: 2.6, h: 0.36 });
  // the families' chairs: a row along each long wall, a little apart from the table
  for (let i = 0; i < 8; i++) {
    const cl = [PAL.coral, PAL.teal, PAL.ochre, PAL.plum][i % 4];
    prop(s, 'updecks.armchair', -32.2 + i * 1.75, 0, T.z1 - 0.62, PI, { cloth: cl, mend: i % 3 === 0 ? PAL.ochre : null }, { spot: { tags: ['uptable', 'family'] } });
    if (i < 6) prop(s, 'chair', -31.4 + i * 2.0, 0, T.z0 + 0.55, 0, { wood: '#6b4a2f', back: 'slat', seat: '#c9a46a' }, { spot: { tags: ['uptable', 'family'] } });
  }
  prop(s, 'baths.fernpot', -16.0, 0, T.z1 - 0.6, 0.3, { pot: PAL.coral, size: 1.2 });
  prop(s, 'baths.fernpot', -16.0, 0, T.z0 + 0.6, 1.1, { pot: PAL.teal, size: 1.1 });
  prop(s, 'updecks.sticks', -16.2, 0, 12.4, 0.5, { n: 6, seed: 4 });
  // the notice by the door
  const RULE = { kind: 'notice', title: 'Who comes up', lines: ['Offered the year you turn ninety-five', 'Sooner for knees and hips: the clinic signs', 'Couples come up together, on the elder\'s year', 'Your place below goes to your heir that day', 'The drum lends you a flat up here for life', 'Say no as often as you like', 'Lunch after, at the long table'], palette: ['#f2e8d2', PAL.ink, PAL.coral] };
  sign(s, RULE, -15.3, 1.55, 12.6, { face: 'x', w: 0.62, h: 0.86 });
  s.interact({ x: -16.1, y: 1.4, z: 12.6, radius: 1.3, prompt: 'Read the notice by the door', onUse(gm) {
    say(gm, { name: 'Who comes up', colour: '#FFD9A0' }, [
      'A flat on the High decks is offered the year you turn ninety-five, sooner for knees and hips if the clinic signs for them. Couples come up together, on the elder\'s year.',
      'The day you come up, your place below goes to your heir: you see them have it. The drum lends you a flat up here for life, from the Margin, and takes it back after.',
      'Say no as often as you like. About one in nine asks for another year, most of them to keep cooking. Lunch after, at the long table.',
    ]);
    custom(gm, 'Coming up');
  } });
  s.interact({ x: T.x0 + 1.4, y: 1.6, z: 10, radius: 1.8, prompt: 'Read the board of who came up', onUse(gm) {
    say(gm, { name: 'Up this week · Ring Three', colour: '#FFD9A0' }, [MOVES.slice(0, 4).join('. ') + '.', MOVES.slice(4).join('. ') + '.', 'Under it, a brass plate: this table, this year, 3,118 came up; Ring Three, 162,400. One in nine asked for another year.']);
  } });
  s.interact({ x: -31.0, y: 1.0, z: 10, radius: 1.6, kind: 'talk', prompt: 'Speak to the clerk', async onUse(gm) {
    await say(gm, CLERK, [
      'A wanderer at the Up Table. Sit, there is soup under that lid and nobody will mind.',
      'Most days I give out eight or nine flats. I read the flat, the deck, the key. Then the family hands over the keys of the old place to whoever has it next, here, at the table. That is the part people cry at.',
      'Then we eat. You cannot move a household up thirty decks on an empty stomach, and you cannot stop Chervil feeding a table that has people at it.',
    ]);
  } });
  s.interact({ x: -26.0, y: 0.8, z: T.z1 - 1.2, radius: 2.4, prompt: (gm) => gm.player && gm.player.seat && gm.player.seat.upFamily ? 'Get up' : 'Sit with the families a while', onUse(gm) {
    const p = gm.player; if (!p) return;
    if (p.seat && p.seat.upFamily) { p.stand(); return; }
    p.sit({ x: -26.95, y: 0.49, z: T.z1 - 0.62, yaw: PI, upFamily: true }); p.yaw = 0; p.pitch = -0.08;
    if (gm.ui) {
      gm.ui.subtitle('A woman beside you', pick(['My grandmother. She said no four years running. This year she said yes because the lane up here has a herb shop.', 'My father is ninety-five today. We have brought his chair up, the one with the cushion. He has brought the cushion.', 'We are here for my aunt. She is giving her place to my son. He is twenty-eight and terrified.', 'Both of them, together. Sixty-eight years married. They have asked for a flat with two doors.'], Math.floor(Math.random() * 1000)), 7);
    }
  } });
  // lamps low over the table, sconces by the board
  for (const x of [-31, -27, -23, -19.6]) lamp(s, 'globe', x, 1.95, 10, { r: 0.2, drop: T.h - 2.0, clip, K: 2650, power: 0.95 });
  for (const z of [7.6, 12.4]) lamp(s, 'sconce', T.x0 + 0.1, 2.3, z, { face: 'X', clip, K: 2700, power: 0.7 });
  lamp(s, 'sconce', -15.2, 2.5, 7.0, { face: 'x', clip, K: 2700, power: 0.6 });
  // people and walkways
  group(s, -17.6, 6.2, 3, 0.6, ['uptable']); group(s, -21.8, 14.6, 2, 0.5, ['uptable']);
  s.spot('work', -20.5, 0, 12.2, 0, { tags: ['serve', 'uptable'] });
  s.path([[-15.9, 10], [-17.8, 10], [-17.8, 12.4], [-25.0, 12.4], [-32.6, 12.4], [-34.4, 11.6]], { width: 1.2 });
  s.path([[-17.8, 10], [-17.8, 7.6], [-25.0, 7.6], [-32.6, 7.6], [-34.4, 8.4]], { width: 1.2 });
  s.path([[-25.0, 12.4], [-25.0, 16.4]], { width: 1.0 }); s.path([[-25.0, 7.6], [-25.0, 3.6]], { width: 1.0 });
  s.zoneBox({ id: 'up-decks-table', place: 'up-decks', box: [T.x0, -0.5, T.z0, T.x1, T.h, T.z1], name: 'The Up Table', sub: 'Where Ring Three comes up · deck 340', ambience: 'hall', reverb: 'felt' });
}

// ---------------------------------------------------------------------------------------------------------------
// Potherb Lane: a quiet corridor of elders' front doors, a rail along each wall, and under every door the light of
// whatever garden is behind it
// ---------------------------------------------------------------------------------------------------------------
const DOORX = []; for (let i = 0; i < 10; i++) DOORX.push(18.6 + i * 4.6);
const NAMES_N = ['Marsh', 'Okonkwo', 'Lindqvist', 'Tamura', 'Garden open', 'Abara', 'Fonseca', 'Kowal', 'Rahim', 'Delacroix'];
const NAMES_S = ['Haddad', 'Pereira', 'Novak and Ito', 'Mensah', 'Byrne', 'Sorensen', 'Achebe', 'Quint', 'Yilmaz', 'Oduya'];
// how bright the garden behind each door is (0 = none kept), and its light
const GLOW_N = [0.2, 2.6, 0.0, 1.2, 0, 0.5, 3.0, 0.0, 1.6, 0.3];
const GLOW_S = [1.8, 0.0, 2.4, 0.4, 0.0, 3.2, 0.9, 0.2, 0.0, 2.0];
function lane(game, s, f) {
  const g = s.g, L = LANE, clip = [L.x0, -0.2, L.z0 - 0.1, L.x1 + 0.2, L.h + 0.1, L.z1 + 0.1];
  run(L.x0, L.x1, 8.1, (a, b) => {
    floor(s, a, L.z0, b, L.z1, 0, 'planks', '#8a6240');
    ceiling(s, a, L.z0, b, L.z1, L.h, 'paint', '#e3dcc6');
    const lw = { mat: 'plaster', tint: '#cfd3b4', dado: { h: 0.95, mat: 'flute', tint: '#5f7f6a' }, skirt: PAL.dark };
    const gd = GARDEN.door - 0.5;
    wall(s, a, L.z0, b, L.z0, 0, L.h, Object.assign({}, lw, gd > a && gd < b ? { openings: [{ at: gd - a, w: 1.0, h: 2.1 }] } : {}));
    wall(s, a, L.z1, b, L.z1, 0, L.h, lw);
    s.structure(() => {
      g.mat('carpet', '#8a2f3c'); g.box(a, 0.002, -0.7, b, 0.012, 0.7, { faces: 'Y' });
      g.mat('weave', PAL.ochre); g.box(a, 0.002, -0.78, b, 0.014, -0.7, { faces: 'Y' }); g.box(a, 0.002, 0.7, b, 0.014, 0.78, { faces: 'Y' });
      g.mat('wood', PAL.dark); for (const sz of [-1, 1]) g.box(a, 2.2, Math.min(sz * 1.52, sz * 1.5), b, 2.25, Math.max(sz * 1.52, sz * 1.5), { faces: sz > 0 ? 'zyY' : 'ZyY' });
    });
    // the rails, brass on brackets, both walls
    s.detail(() => {
      g.mat('cast', PAL.brass, { rough: -0.2 });
      for (const sz of [-1, 1]) { const z = sz * 1.42; g.tube([[a + 0.05, 0.9, z], [b - 0.05, 0.9, z]], 0.022, { segs: 8, caps: false }); for (let x = a + 0.6; x < b; x += 1.6) g.tube([[x, 0.9, z], [x, 0.9, sz * 1.52]], 0.01, { segs: 4 }); }
    });
  });
  // the doors: a painted leaf in a frame, a name plate, a mat, and the strip of light under it
  const doorCols = [PAL.coral, PAL.deep, PAL.ochre, PAL.plum, '#3f6f8a', '#6b7a3a', '#8a2f3c', PAL.teal, '#c9a46a', PAL.coral];
  for (const sz of [-1, 1]) DOORX.forEach((dx, i) => {
    const north = sz < 0, name = north ? NAMES_N[i] : NAMES_S[i], glow = north ? GLOW_N[i] : GLOW_S[i];
    if (north && i === 4) return;                 // the open door is the garden's (below)
    const z = sz * (L.z1 - 0.08), fz = -sz;    // the wall face, and the way the door faces (into the lane)
    s.structure(() => {
      g.mat('wood', PAL.dark); g.box(dx - 0.55, 0, Math.min(z, z + fz * 0.06), dx - 0.47, 2.2, Math.max(z, z + fz * 0.06), { bevel: 0.008 }); g.box(dx + 0.47, 0, Math.min(z, z + fz * 0.06), dx + 0.55, 2.2, Math.max(z, z + fz * 0.06), { bevel: 0.008 });
      g.box(dx - 0.55, 2.12, Math.min(z, z + fz * 0.07), dx + 0.55, 2.22, Math.max(z, z + fz * 0.07), { bevel: 0.008 });
      const c = doorCols[(i + (north ? 0 : 5)) % doorCols.length];
      g.mat('paint', c, { rough: -0.1 }); g.box(dx - 0.47, 0.03, Math.min(z, z + fz * 0.035), dx + 0.47, 2.12, Math.max(z, z + fz * 0.035), { faces: north ? 'Z' : 'z' });
      g.mat('paint', shadeHex(c, 1.18)); for (const pn of [[0.2, 0.95], [1.1, 1.95]]) g.box(dx - 0.36, pn[0], Math.min(z + fz * 0.035, z + fz * 0.045), dx + 0.36, pn[1], Math.max(z + fz * 0.035, z + fz * 0.045), { bevel: 0.006 });
      g.mat('cast', PAL.brass, { rough: -0.2 }); g.box(dx + 0.3, 0.98, Math.min(z + fz * 0.04, z + fz * 0.1), dx + 0.38, 1.04, Math.max(z + fz * 0.04, z + fz * 0.1), { bevel: 0.01 });
      g.box(dx - 0.16, 1.32, Math.min(z + fz * 0.045, z + fz * 0.055), dx + 0.16, 1.36, Math.max(z + fz * 0.045, z + fz * 0.055));
      // the mat, and the gap at the foot of the door with the garden's light in it
      g.mat('rush', ['#8a6d3b', '#6b5a3a', '#9a7448'][i % 3]); g.box(dx - 0.42, 0.012, Math.min(z + fz * 0.08, z + fz * 0.6), dx + 0.42, 0.024, Math.max(z + fz * 0.08, z + fz * 0.6), { bevel: 0.01 });
      g.mat('diffuser', glow > 0 ? mixHex('#ffd9a0', '#f4fff0', Math.min(1, glow / 3)) : '#2a2218', glow > 0 ? { emissive: 0.4 + glow * 2.2, lamp: false } : {});
      g.box(dx - 0.45, 0.0, Math.min(z + fz * 0.03, z + fz * 0.045), dx + 0.45, 0.03, Math.max(z + fz * 0.03, z + fz * 0.045), { faces: north ? 'Z' : 'z' });
    });
    if (glow > 0.3) s.glowCard(dx, 0.015, z + fz * 0.3, { face: 'y', color: glow > 2 ? '#f6ffe8' : '#ffe2b0', size: 0.6 + glow * 0.22, strength: 0.03 + glow * 0.035, follow: 'always' });
    sign(s, { kind: 'plate', text: name, lines: ['340 · ' + (north ? 'L' : 'R') + String(i + 1)] }, dx, 1.62, z + fz * 0.05, { face: north ? 'Z' : 'z', w: 0.26, h: 0.12 });
    // something left outside: shoes, a pot, a stool, a stick
    const k = (i * 3 + (north ? 1 : 2)) % 5;
    const ox = dx + 0.85, oz = z + fz * 0.28;
    if (k === 0) prop(s, 'plant', ox, 0, oz, i, { pot: PAL.coral, kind: 'fern', size: 0.7, seed: i });
    else if (k === 1) prop(s, 'stool', ox, 0, oz, i, { wood: '#7a5a3a' }, { noSpots: true });
    else if (k === 2) prop(s, 'plant', ox, 0, oz, i, { pot: PAL.teal, kind: 'broad', size: 0.6, seed: i + 7 });
    else if (k === 3) prop(s, 'updecks.can', ox, 0, oz, i, { c: '#5f7f6a' });
  });
  // two benches in the lane, for the walk to the end being long at any weight
  prop(s, 'updecks.bench', 39.0, 0, 1.15, PI, { w: 1.4, wood: '#7a5233', cushion: PAL.ochre }, { spot: { tags: ['lane'] } });
  prop(s, 'updecks.bench', 53.4, 0, -1.15, 0, { w: 1.4, wood: '#6b4a2f' }, { spot: { tags: ['lane'] } });
  // a plate at the lane's mouth
  sign(s, { kind: 'street', text: 'Potherb Lane', sub: 'deck 340 · flats 1 to 20', palette: [PAL.deep, '#f1ead8'] }, 15.3, 2.55, -1.3, { face: 'X', w: 1.1, h: 0.26 });
  s.structure(() => { g.mat('wood', PAL.dark); g.box(15.0, 2.9, -1.6, 15.12, 3.0, 1.6, { bevel: 0.01 }); });
  // the strip of pooled light down the middle of the ceiling: low, warm, a little dim; the doors do the rest
  for (const x of [19.5, 28.7, 37.9, 47.1, 56.3]) lamp(s, 'globe', x, 2.55, 0, { r: 0.13, drop: L.h - 2.6, clip, K: 2600, power: 0.55, range: 6 });
  roomGlow(s, L.x0, 0, L.z0, L.x1, L.h, L.z1, { sky: '#ffd8a8', ground: '#8a6240', power: 0.16 });
  s.interact({ x: 27.8, y: 0.6, z: -1.0, radius: 1.3, prompt: 'Look at the light under the door', onUse(gm) {
    toast(gm, 'White light, almost hard, a lamp strong enough to grow under. Somebody in there keeps a garden lit like an overcast day: four square metres of it costs about 1.9 kays a day, a tenth of a wallet. You can tell who keeps a bright garden by the light under the door.');
    custom(gm, 'Bright gardens');
  } });
  s.interact({ x: 32.6, y: 0.6, z: 1.0, radius: 1.3, prompt: 'Look at the dark under the door', onUse(gm) {
    toast(gm, 'No light under this one at all. A note pinned at eye height: Gone to my granddaughter\'s naming, back Thursday, water the fern if you are passing. A fern, outside, slightly dry.');
  } });
  s.interact({ x: 15.9, y: 2.0, z: -1.0, radius: 1.5, prompt: 'Read the lane\'s plate', onUse(gm) {
    toast(gm, 'Potherb Lane, flats one to twenty. Under it, smaller: lent for life from the Margin, as are all the flats on this deck. The last tenant\'s name stays on the plate a year.');
  } });
  // people: a neighbour at a door, two talking, a sweeper, a child visiting
  s.spot('chat', 46.2, 0, -0.5, -PI / 2 + 0.3, { tags: ['lane'] }); s.spot('chat', 45.0, 0, -0.2, PI / 2 + 0.2, { tags: ['lane'] });
  for (const x of [22.4, 34.0, 50.2]) s.spot('stand', x, 0, 1.0, PI, { tags: ['rail', 'lane'] });
  s.spot('stand', 58.0, 0, -1.0, 0, { tags: ['rail', 'lane'] });
  s.spot('work', 30.5, 0, 0.2, PI / 2, { tags: ['sweep', 'lane'] });
  s.spot('play', 42.4, 0, -0.6, 0.5, { tags: ['hop'] });
  s.path([[15.9, 0], [20, 0], [28, 0], [36, 0], [41.6, 0], [48, 0], [56, 0], [63.0, 0]]);
  s.path([[41.6, 0], [41.6, -1.9]], { width: 1.0 });
  s.zoneBox({ id: 'up-decks-lane', place: 'up-decks', box: [L.x0, -0.5, L.z0, L.x1, L.h, L.z1], name: 'Potherb Lane', sub: 'Elders\' flats · deck 340', ambience: 'flat', reverb: 'room' });
}

// ---------------------------------------------------------------------------------------------------------------
// the garden behind the door left open: four square metres lit like an overcast day, a tomato vine, herbs, a chair
// ---------------------------------------------------------------------------------------------------------------
function garden(game, s, f) {
  const g = s.g, G = GARDEN, clip = [G.x0 - 0.05, -0.2, G.z0 - 0.05, G.x1 + 0.05, 2.75, G.z1 + 0.9];
  floor(s, G.x0, G.z0, G.x1, G.z1 - 0.08, 0, 'tile', '#b9a07a');
  ceiling(s, G.x0, G.z0, G.x1, G.z1, 2.7, 'paint', '#f0ecdf');
  const gw = { mat: 'plaster', tint: '#eef0e2', dado: { h: 0.6, mat: 'tile', tint: '#6b7a3a' }, skirt: false };
  wall(s, G.x0, G.z0, G.x1, G.z0, 0, 2.7, gw);
  wall(s, G.x0, G.z0, G.x0, G.z1 - 0.08, 0, 2.7, gw);
  wall(s, G.x1, G.z0, G.x1, G.z1 - 0.08, 0, 2.7, gw);
  s.structure(() => { g.mat('plaster', '#cfd3b4'); g.box(G.x0, 2.25, G.z1 - 0.16, G.x1, 2.7, G.z1 - 0.08, { faces: 'Z' }); });
  // the door, left open about a third, and its frame
  s.structure(() => {
    const dx = G.door - 0.5, z = G.z1 - 0.08;
    g.mat('wood', PAL.dark); g.box(dx - 0.08, 0, z - 0.04, dx, 2.2, z + 0.1, { bevel: 0.008 }); g.box(dx + 1.0, 0, z - 0.04, dx + 1.08, 2.2, z + 0.1, { bevel: 0.008 }); g.box(dx - 0.08, 2.1, z - 0.04, dx + 1.08, 2.2, z + 0.1, { bevel: 0.008 });
    g.push(); g.move(dx + 0.02, 0, z - 0.02); g.rotY(0.75);
    g.mat('paint', PAL.ochre, { rough: -0.1 }); g.box(0, 0.03, -0.05, 0.94, 2.08, -0.01, { bevel: 0.006 });
    g.mat('paint', shadeHex(PAL.ochre, 1.15)); g.box(0.12, 0.2, -0.012, 0.82, 0.95, 0.0); g.box(0.12, 1.1, -0.012, 0.82, 1.95, 0.0);
    g.mat('cast', PAL.brass); g.box(0.82, 0.98, 0.0, 0.9, 1.04, 0.05, { bevel: 0.01 });
    g.pop();
  });
  s.solid(G.door - 0.5, 0, G.z1 - 0.75, G.door - 0.4, 2.1, G.z1 - 0.05);
  sign(s, { kind: 'plate', text: 'Ines Abara', lines: ['340 · L5 · come in'] }, G.door + 0.95, 1.62, G.z1 + 0.0, { face: 'Z', w: 0.26, h: 0.12 });
  // the garden along the back wall: a raised bed with a tomato vine on canes, herbs in a trough, lettuces
  s.furniture(() => {
    g.mat('wood', '#6b4a2f'); g.box(G.x0 + 0.1, 0, G.z0 + 0.1, G.x1 - 0.1, 0.55, G.z0 + 0.8, { bevel: 0.015, aoBottom: 0.6 });
    g.mat('soil', '#ffffff'); g.box(G.x0 + 0.16, 0.5, G.z0 + 0.16, G.x1 - 0.16, 0.53, G.z0 + 0.74, { faces: 'Y' });
    g.mat('cane', '#b08d5e'); for (let k = 0; k < 4; k++) { const x = G.x0 + 0.6 + k * 0.9; g.tube([[x, 0.5, G.z0 + 0.45], [x + 0.05, 2.35, G.z0 + 0.35]], 0.012, { segs: 4 }); }
    g.tube([[G.x0 + 0.55, 2.0, G.z0 + 0.36], [G.x1 - 0.55, 2.0, G.z0 + 0.36]], 0.01, { segs: 4 });
  });
  s.solid(G.x0 + 0.1, 0, G.z0 + 0.1, G.x1 - 0.1, 0.55, G.z0 + 0.8);
  s.detail(() => {
    g.mat('leafA', '#ffffff', { sway: 0.4 });
    for (let k = 0; k < 26; k++) { const x = G.x0 + 0.45 + (k * 0.37) % 3.1, y = 0.65 + ((k * 0.61) % 1.6), a = k * 1.7; g.card(x, y, G.z0 + 0.42 + (k % 3) * 0.06, 0.32, 0.36, a, { tilt: 0.3 }); }
    g.mat('glaze', '#c8321e', { rough: -0.35 }); for (const t of [[0.9, 1.2], [1.0, 1.05], [1.85, 1.5], [2.7, 0.95], [2.8, 1.12], [3.3, 1.7]]) g.ball(G.x0 + t[0], t[1], G.z0 + 0.5, 0.045, 0.042, 0.045, { segs: 10, rings: 7 });
    g.mat('glaze', '#e0902a', { rough: -0.35 }); g.ball(G.x0 + 1.9, 1.3, G.z0 + 0.52, 0.04, 0.038, 0.04, { segs: 10, rings: 7 });
    g.mat('glaze', '#6b9a3a', { rough: -0.3 }); g.ball(G.x0 + 2.2, 1.75, G.z0 + 0.48, 0.035, 0.033, 0.035, { segs: 8, rings: 6 });
  });
  for (let k = 0; k < 4; k++) prop(s, 'plant', G.x0 + 0.5 + k * 0.32, 0.53, G.z0 + 0.7, k, { pot: '#8a6d3b', kind: 'fine', size: 0.32, seed: k + 20, leaf: '#d8f0a0' }, { noCollide: true });
  // a chair, a little table with a saucer of seed twists, the can
  prop(s, 'chair', G.x1 - 0.7, 0, G.z1 - 1.3, -PI * 0.75, { wood: '#6b4a2f', back: 'hoop', seat: '#d9c08a' }, { spot: { tags: ['garden'] } });
  prop(s, 'table', G.x0 + 0.7, 0, G.z1 - 1.2, 0, { w: 0.5, round: true, h: 0.6, wood: '#5a3d28' });
  prop(s, 'plate', G.x0 + 0.7, 0.6, G.z1 - 1.2, 0, { r: 0.09, glaze: PAL.teal });
  s.detail(() => { g.mat('paper', '#f2e8d2'); for (let k = 0; k < 3; k++) g.box(G.x0 + 0.64 + k * 0.04, 0.612, G.z1 - 1.24 + k * 0.02, G.x0 + 0.68 + k * 0.04, 0.63, G.z1 - 1.2 + k * 0.02, { bevel: 0.006 }); });
  prop(s, 'updecks.can', G.x0 + 1.4, 0, G.z1 - 0.9, 2.2, { c: '#3f6f8a' });
  // the light: one grow panel, white, strong, a lamp you can tell from the lane
  lamp(s, 'panel', (G.x0 + G.x1) / 2, 2.68, G.z0 + 0.9, { w: 2.6, d: 0.8, clip, K: 4300, power: 2.2, lampFlag: false });
  roomGlow(s, G.x0, 0, G.z0, G.x1, 2.7, G.z1, { sky: '#f4fff0', ground: '#b9a07a', power: 0.45, lamp: false });
  s.glowCard(G.door, 0.015, -1.15, { face: 'y', color: '#f6ffe8', size: 1.4, strength: 0.12, follow: 'always' });
  s.interact({ x: G.door, y: 1.2, z: -1.2, radius: 1.5, prompt: 'Look round the open door', async onUse(gm) {
    sfx(gm, 'door', f, G.door, 1.0, G.z1);
    await say(gm, { name: 'A voice from the garden', colour: '#d8f0a0' }, [
      'Come in, it is open so people do. Mind the tomato, it leans.',
      'Four square metres, lit like the Hollow under cloud, twelve hours a day. One point nine kays a day. I eat less light than I used to and I spend it here.',
      'Take a twist of seed from the saucer. It came up from my own place downstairs, from my mother\'s plant. Plant it anywhere with a lamp.',
    ]);
    if (!gm.flags.upSeed) { gm.flags.upSeed = true; if (gm.inv && gm.inv.give) gm.inv.give('tomato-seed'); toast(gm, 'A twist of tomato seed', 'gain'); }
    custom(gm, 'Bright gardens');
  } });
  s.zoneBox({ id: 'up-decks-garden', place: 'up-decks', box: [G.x0, -0.5, G.z0, G.x1, 2.7, G.z1 - 0.1], name: 'A garden behind a door', sub: 'Potherb Lane · four square metres', ambience: 'flat', reverb: 'room' });
  s.path([[G.door, -1.9], [G.door, -2.8], [G.x1 - 0.9, G.z1 - 1.9]], { width: 0.9 });
}

// ---------------------------------------------------------------------------------------------------------------
// the lane's end: the Carver in its alcove, benches, the door of the Lake Stair
// ---------------------------------------------------------------------------------------------------------------
const CARVER = [
  ['Grandmother Ama Okafor', 'a hundred and nineteen, the eldest on the deck', 'She came up at ninety-five and has buried two of the clerks who gave her the key. She cooks the Thursday rice on 341 by telling other people how.'],
];
function foot(game, s, f) {
  const g = s.g, F = FOOT, clip = [F.x0 - 0.5, -0.2, F.z0 - 0.1, F.x1 + 0.1, F.h + 0.1, F.z1 + 0.1];
  floor(s, F.x0, F.z0, F.x1, F.z1, 0, 'pattern', '#d9c9a6');
  ceiling(s, F.x0, F.z0, F.x1, F.z1, F.h, 'paint', '#e6dcc4');
  const fw = { mat: 'plaster', tint: '#e6cf9e', dado: { h: 1.0, mat: 'flute', tint: PAL.deep }, skirt: PAL.dark };
  wall(s, F.x0, F.z0, F.x0, LANE.z0, 0, F.h, fw); wall(s, F.x0, LANE.z1, F.x0, F.z1, 0, F.h, fw);
  s.structure(() => { g.mat('plaster', '#e6cf9e'); g.box(F.x0 - 0.08, LANE.h, LANE.z0, F.x0 + 0.08, F.h, LANE.z1); });
  wall(s, F.x0, F.z1, F.x1, F.z1, 0, F.h, fw);
  wall(s, F.x0, F.z0, F.x1, F.z0, 0, F.h, Object.assign({}, fw, { openings: [{ at: 3.3, w: 5.4, h: 2.9 }] }));
  wall(s, F.x1, F.z0, F.x1, F.z1, 0, F.h, Object.assign({}, fw, { openings: [{ at: 4.6, w: 2.8, h: 2.6 }] }));
  // the alcove behind the north opening: the Carver on its low step, felt behind it, its card
  const A = { x0: 66.3, x1: 71.7, z0: -8.6, z1: -6 };
  floor(s, A.x0, A.z0, A.x1, A.z1, 0, 'pattern', '#d9c9a6');
  ceiling(s, A.x0, A.z0, A.x1, A.z1, 2.9, 'paint', '#3a2a3a');
  wall(s, A.x0, A.z0, A.x1, A.z0, 0, F.h, { mat: 'plaster', tint: PAL.plum, skirt: false });
  wall(s, A.x0, A.z0, A.x0, A.z1, 0, F.h, { mat: 'plaster', tint: PAL.plum, skirt: false }); wall(s, A.x1, A.z0, A.x1, A.z1, 0, F.h, { mat: 'plaster', tint: PAL.plum, skirt: false });
  block(s, 67.4, 0, -8.5, 70.6, 0.16, -6.5, 'wood', '#5a3d28', { bevel: 0.012 });
  s.deco(() => { g.mat('felt', '#8a2f3c'); g.sheet([67.2, 2.75, -8.44], [70.8, 2.75, -8.44], [70.8, 0.2, -8.42], [67.2, 0.2, -8.42], { nu: 8, nv: 5, ripple: 0.025, rippleN: 9 }); g.mat('cast', PAL.brass); g.tube([[67.0, 2.78, -8.44], [71.0, 2.78, -8.44]], 0.015, { segs: 5 }); });
  prop(s, 'updecks.carver', 69, 0.16, -7.7, 0, {});
  s.structure(() => { g.mat('cast', PAL.brass); g.tube([[67.5, 0.16, -6.45], [67.5, 0.75, -6.45], [70.5, 0.75, -6.45], [70.5, 0.16, -6.45]], 0.014, { segs: 6 }); g.mat('weave', PAL.ochre); for (let x = 67.9; x < 70.3; x += 0.45) g.tube([[x, 0.75, -6.45], [x + 0.22, 0.66, -6.45], [x + 0.45, 0.75, -6.45]], 0.012, { segs: 4 }); });
  sign(s, { kind: 'notice', title: 'The Carver', lines: ['This year: Ama Okafor, 119', 'the eldest on deck 340', 'Next to sit in it: whoever', 'is eldest on Booking Day', 'Kept two hundred years', 'mended in three woods'], palette: ['#f2e8d2', PAL.ink, PAL.coral] }, 70.95, 1.25, -6.6, { face: 'Z', w: 0.42, h: 0.58 });
  s.structure(() => { g.mat('wood', PAL.dark); g.tube([[70.95, 0.16, -6.62], [70.95, 0.94, -6.62]], 0.012, { segs: 5 }); });
  lamp(s, 'spot', 69, 2.88, -7.4, { clip: [A.x0, -0.2, A.z0, A.x1, 3.0, A.z1 + 0.8], K: 2500, power: 0.7, cone: [40, 18] });
  s.interact({ x: 69, y: 0.9, z: -6.2, radius: 1.6, prompt: 'The Carver is kept for the eldest this year', onUse(gm) {
    const c = CARVER[0];
    card(gm, 'A card on a little stand', 'The Carver', 'This year it is ' + c[0] + '\'s, ' + c[1] + '. ' + c[2] + ' Nobody else sits in it, not the clerk, not a great-grandchild, not a guest, however tired. Next Booking Day it goes to whoever is eldest on the deck that morning, and the year after to whoever follows.');
    if (gm.ui) gm.ui.subtitle('A man on the bench', 'Not you, wanderer. Not me either, and I am a hundred and six. Sit here with me instead; the bench is very good.', 7);
    custom(gm, 'The Carver');
  } });
  // benches along the south wall, a rail, ferns, a stand of sticks
  prop(s, 'updecks.bench', 66.4, 0, F.z1 - 0.42, PI, { w: 2.2, wood: '#7a5233', cushion: PAL.coral }, { spot: { tags: ['stair', 'wait'] } });
  prop(s, 'updecks.bench', 71.4, 0, F.z1 - 0.42, PI, { w: 2.2, wood: '#6b4a2f', cushion: PAL.teal }, { spot: { tags: ['stair', 'wait'] } });
  s.detail(() => { g.mat('cast', PAL.brass, { rough: -0.2 }); g.tube([[63.4, 0.9, F.z1 - 0.12], [74.6, 0.9, F.z1 - 0.12]], 0.022, { segs: 8 }); });
  prop(s, 'baths.fernpot', 74.3, 0, -5.3, 0.4, { pot: PAL.coral, size: 1.2 }); prop(s, 'baths.fernpot', 74.3, 0, 5.3, 1.4, { pot: PAL.ochre, size: 1.2 });
  prop(s, 'updecks.sticks', 63.8, 0, 5.2, 0, { n: 6, seed: 3 });
  // the Lake Stair: double doors in deep blue, a plate, a lamp over them
  s.structure(() => {
    const x = F.x1 - 0.08, z0 = -1.4, z1 = 1.4;
    g.mat('paint', '#24395a', { rough: -0.1 }); g.box(x - 0.05, 0, z0, x + 0.02, 2.6, -0.02, { faces: 'x' }); g.box(x - 0.05, 0, 0.02, x + 0.02, 2.6, z1, { faces: 'x' });
    g.mat('cast', PAL.brass); g.box(x - 0.12, 1.0, -0.2, x - 0.05, 1.06, -0.06, { bevel: 0.01 }); g.box(x - 0.12, 1.0, 0.06, x - 0.05, 1.06, 0.2, { bevel: 0.01 });
    for (const zz of [[-1.25, -0.15], [0.15, 1.25]]) { g.mat('paint', '#2f4a70'); g.box(x - 0.07, 0.25, zz[0], x - 0.05, 1.0, zz[1], { bevel: 0.006 }); g.box(x - 0.07, 1.2, zz[0], x - 0.05, 2.4, zz[1], { bevel: 0.006 }); }
    g.mat('wood', PAL.dark); g.box(x - 0.14, 0, z0 - 0.1, x, 2.7, z0, { bevel: 0.008 }); g.box(x - 0.14, 0, z1, x, 2.7, z1 + 0.1, { bevel: 0.008 }); g.box(x - 0.14, 2.6, z0 - 0.1, x, 2.72, z1 + 0.1, { bevel: 0.008 });
  });
  sign(s, { kind: 'plate', text: 'The Lake Stair', lines: ['lift to 370 · then six flights on foot', 'to the floor of the Hollow', 'at lamp-dawn the lift waits'] }, F.x1 - 0.1, 1.65, -2.1, { face: 'x', w: 0.62, h: 0.32 });
  sign(s, { kind: 'letters', text: 'The Lake Stair', palette: ['#f1e6c9'] }, F.x1 - 0.1, 2.98, 0, { face: 'x', w: 2.2, h: 0.32, glow: 0.9 });
  lamp(s, 'sconce', F.x1 - 0.1, 2.35, -1.95, { face: 'x', clip, K: 2600, power: 0.8 });
  lamp(s, 'sconce', F.x1 - 0.1, 2.35, 1.95, { face: 'x', clip, K: 2600, power: 0.8 });
  lamp(s, 'globe', 68.4, 2.6, 1.6, { r: 0.18, drop: F.h - 2.65, clip, K: 2650, power: 0.9 });
  roomGlow(s, F.x0, 0, F.z0, F.x1, F.h, F.z1, { sky: '#ffd8a8', ground: '#a88a62', power: 0.22 });
  s.interact({ x: F.x1 - 0.9, y: 1.2, z: 0, radius: 1.7, prompt: 'Take the Lake Stair up to the Hollow', async onUse(gm) {
    const h = gm.clock ? gm.clock.hours : 12;
    const dawn = h >= 5 && h < 7.5;
    const st = gm.city && gm.city.hollowStop ? gm.city.hollowStop({ L: 57, i: 2, j: 5 }) : null;
    if (!st) { toast(gm, 'The Lake Stair\'s lift is not answering. A card on the door: back after the paddle stops.'); return; }
    sfx(gm, 'door', f, F.x1, 1.2, 0);
    if (gm.ui && gm.ui.fade) await gm.ui.fade(true, 0.5);
    if (gm.player) gm.player.place(st.frame, st.x, st.y, st.z, st.yaw);
    if (gm.ui && gm.ui.fade) await gm.ui.fade(false, 0.6);
    toast(gm, dawn ? 'Up the lift to 370, and the six flights on foot with a crowd of old people in robes, nobody hurrying, everybody talking. At the top the light is coming along the lake.' : 'Up the lift to 370 and six flights on foot, alone: at this hour the stair is yours. At lamp-dawn it is full.');
  } });
  s.interact({ x: F.x1 - 0.7, y: 1.6, z: -2.1, radius: 1.2, prompt: 'Read the plate by the stair', onUse(gm) {
    say(gm, { name: 'The Lake Stair', colour: '#FFD9A0' }, ['Lift to deck 370, then six flights on foot to the floor of the Hollow, by the lake.', 'At lamp-dawn the lift waits with its doors open, and the stair is full of people in robes going up to watch the light come along the water. It takes the old about a quarter of an hour. Nobody minds.']);
  } });
  // people and walkways
  s.spot('stand', 70.0, 0, -5.1, PI, { tags: ['carver'] }); s.spot('stand', 68.0, 0, -5.2, PI + 0.3, { tags: ['carver'] });
  group(s, 72.2, 2.6, 2, 0.55, ['stair']);
  s.path([[63.0, 0], [66.0, 0], [69.0, -0.5], [69.0, -4.8]], { width: 1.4 });
  s.path([[69.0, -0.5], [73.6, 0]], { width: 1.4 }); s.path([[66.0, 0], [66.4, 4.2]], { width: 1.0 }); s.path([[69.0, -0.5], [71.4, 4.2]], { width: 1.0 });
  s.zoneBox({ id: 'up-decks-foot', place: 'up-decks', box: [F.x0, -0.5, F.z0, F.x1, F.h, F.z1], name: 'The foot of the Lake Stair', sub: 'The Carver · deck 340', ambience: 'quiet', reverb: 'felt' });
  s.zoneBox({ id: 'up-decks-carver', place: 'up-decks', box: [A.x0, -0.5, A.z0, A.x1, F.h, A.z1], name: 'The Carver', sub: 'Kept for the eldest on the deck', ambience: 'quiet', reverb: 'felt' });
  void HALL;
}

function group(s, x, z, n, r, tags) {
  for (let i = 0; i < n; i++) { const t = i / n * PI * 2 + 0.4; const px = x + Math.cos(t) * r, pz = z + Math.sin(t) * r; s.spot('chat', px, 0, pz, Math.atan2(x - px, z - pz), { tags: tags || ['simmer'] }); }
}
