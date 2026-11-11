// The Bellows' front of house and the rooms over it. Frame 'felt-organ' (see lm_felt_organ.js).
//   The foyer (deck 150, two decks tall): the cloak counter and its queue, the tea stall, the week's board.
//   The cab lobby behind it, where the cab sets you down.
//   Deck 152, over the foyer: the Cutting Room, where flutes are cut to length in the hall's own air, and the Wind Room,
//   where the reservoirs are, their weights cast for this deck.
//   Deck 153: the Sound Larder, a quiet corridor of listening booths round a room of catalogue drawers, ending in the
//   booth of the old air.
import { floor, ceiling, lamp, wall, block } from '../world/kit.js';
import { room, column, planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PI, DY, FOY, BACK, CUT, WIND, C, FELTS, say, choose, toast, sfx, tick, runX, wallRun, berth } from './lm_felt_organ_props.js';

const D2 = DY[2], D3 = DY[3];

export async function buildRooms(game, s, f, r) {
  foyer(game, s, f, r);
  await tick(game);
  lobby(game, s, f);
  await tick(game);
  backShell(s);
  cuttingRoom(game, s, f, r);
  await tick(game);
  windRoom(game, s, f, r);
  await tick(game);
  larder(game, s, f, r);
}

// ---------------------------------------------------------------------------------------------------------------
// the foyer
// ---------------------------------------------------------------------------------------------------------------
function foyer(game, s, f, r) {
  const g = s.g, X0 = FOY.x0, X1 = FOY.x1, Z0 = FOY.z0, Z1 = FOY.z1, H = FOY.h;
  const clip = [X0 - 0.1, -0.2, Z0 - 0.4, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, Z0, X1, Z1, 0, 'terrazzo', '#c9b490', { matOpts: { rough: 0.35 } });
  s.deco((gg) => {
    gg.mat('terrazzo', '#7a2f2a', { rough: 0.4 }); runX(-12, 12, 8, (a, b) => { gg.box(a, 0, 1.2, b, 0.004, 1.5, { faces: 'Y' }); gg.box(a, 0, 12.4, b, 0.004, 12.7, { faces: 'Y' }); });
    gg.mat('terrazzo', '#2f5d5a', { rough: 0.4 }); gg.box(-1.2, 0, 1.5, 1.2, 0.004, 11.4, { faces: 'Y' });
  });
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#e9d8b8');
  s.structure((gg) => { gg.mat('wood', '#6b4429'); runX(X0, X1, 8, (a, b) => { for (const z of [3.5, 7, 10.5]) gg.box(a, H - 0.4, z - 0.14, b, H, z + 0.14, { faces: 'yzZ' }); }); });
  const wo = { tint: '#e3cfa8', t: 0.2, dado: { h: 1.3, mat: 'panel', tint: '#7a2f2a' } };
  wallRun(s, 'z', X0 - 0.1, Z0, Z1, 0, H, wo);
  wallRun(s, 'z', X1 + 0.1, Z0, Z1, 0, H, wo, [[0.5, 7.0, 0, 3.0]]);
  wallRun(s, 'x', Z1 + 0.1, X0, X1, 0, H, wo);
  // columns under the lintel, where the foyer opens into the court, and the hall's name in gilt letters on it
  sign(s, { kind: 'letters', text: 'THE BELLOWS', palette: ['#d9b25c'] }, 0, FOY.h - 0.2, 0.33, { face: 'Z', w: 5.2, h: 0.62, glow: 0.4 });
  for (const x of [-8, -4, 4, 8]) column(s, x, 0, 0.0, FOY.h - 0.55, { r: 0.26, mat: 'stone', tint: '#c9b48e' });
  // the cloak counter on the anti wall: two counters, rails of coats behind, a brass disc for every peg
  for (const z of [4.3, 8.6]) prop(s, 'counter', -12.3, 0, z, PI / 2, { w: 3.6, d: 0.65, body: '#2f5d5a', top: '#8a6240' });
  s.detail((gg) => {
    gg.mat('cast', C.brass, { rough: -0.2 }); gg.tube([[-14.55, 1.95, 1.4], [-14.55, 1.95, 12.6]], 0.02, { segs: 6 }); gg.tube([[-13.75, 1.95, 1.4], [-13.75, 1.95, 12.6]], 0.02, { segs: 6 });
    for (const xr of [-14.55, -13.75]) for (let i = 0; i < 22; i++) {
      if (r.chance(0.18)) continue;
      const z = 1.7 + i * 0.5, c = r.pick(['#3f4a5a', '#7a3a2a', '#4a5a3a', '#6a5a4a', '#2f3f6a', '#8a6a3a', '#5a3a4a', C.madder]);
      gg.mat('weave', c); gg.box(xr - 0.05, 0.85, z - 0.2, xr + 0.05, 1.9, z + 0.2, { bevel: 0.03 });
      if (i % 3 === 0) { gg.mat('knit', r.pick([C.saffron, '#b5532e', '#2f6f73', '#7fe08a'])); gg.box(xr + 0.05, 1.15, z - 0.1, xr + 0.055, 1.25, z, { faces: 'X' }); }
      gg.mat('cast', C.brass); gg.cyl(xr, 1.9, z, 0.03, 0.005, { segs: 8 });
    }
    gg.mat('wood', '#5a3a24'); gg.box(-14.95, 2.35, 1.4, -13.4, 2.4, 12.6, { bevel: 0.01 });
    for (let i = 0; i < 9; i++) { gg.mat('felt', r.pick(FELTS)); gg.box(-14.8 + r.f(0, 0.8), 2.4, 1.8 + i * 1.2, -14.4 + r.f(0, 0.8), 2.55, 2.2 + i * 1.2, { bevel: 0.03 }); }
  });
  sign(s, { kind: 'hanging', text: 'COATS', sub: 'free · a disc for every peg', palette: ['#2f5d5a', '#f1e6c9', '#e8b84a'], emblem: 'thread' }, -11.6, 2.75, 6.45, { face: 'X', double: true, w: 0.8, h: 0.56 });
  lamp(s, 'globe', -12.3, 3.2, 4.3, { K: 2700, power: 0.8, drop: 3.6, r: 0.2, clip });
  lamp(s, 'globe', -12.3, 3.2, 8.6, { K: 2700, power: 0.8, drop: 3.6, r: 0.2, clip });
  for (let i = 0; i < 6; i++) s.spot('queue', -10.9 + i * 0.95, 0, 6.45 + (i % 2) * 0.12, -PI / 2, {});
  s.interact({ x: -11.2, y: 1.3, z: 6.4, radius: 1.5, prompt: 'Leave your coat', onUse: async (gm) => {
    await say(gm, 'Bram, at the cloak counter', [
      'Bram takes your coat, reads the mend at its elbow with interest, and hangs it on peg 214. He gives you a brass disc with 214 stamped on it. "Free. Everything that keeps the hall quiet is free."',
      '"A coat on a lap rustles, and in the Quilt you would hear it in the back row. You would hear a page turned. People here have heard a whisper from the stage, and said so in the interval, and been right about what it said."',
    ]);
    if (gm.audio) sfx(gm, 'coin', f, -12.3, 1.0, 6.4);
  } });
  // the tea stall on the spinward side, by the long foyer
  prop(s, 'counter', 12.4, 0, 11.2, -PI / 2, { w: 2.6, d: 0.6, body: '#7a2f2a', top: '#8a6240' });
  s.furniture((gg) => {
    gg.mat('cast', '#b8b4ac', { rough: -0.3 }); gg.lathe(12.5, 10.4, [[0.18, 0.92], [0.2, 0.95], [0.2, 1.42], [0.14, 1.5], [0.05, 1.55]], { segs: 16 });
    gg.mat('wood', '#5a3a24'); gg.box(14.6, 0, 9.4, 14.95, 2.2, 13.0, { bevel: 0.01 });
    gg.mat('wood', '#6b4429'); for (const y of [1.2, 1.6, 2.0]) gg.box(14.25, y, 9.5, 14.95, y + 0.03, 12.9);
  });
  for (let i = 0; i < 6; i++) prop(s, 'cup', 12.35, 0.92, 11.0 + i * 0.16, 0, { glaze: r.pick(['#d9cfb8', '#a3563a', '#2f6f73', '#e7b547']) });
  for (let i = 0; i < 3; i++) prop(s, 'bowl', 12.4, 0.92, 12.1 + i * 0.22, 0, { glaze: '#e9e1cf', lid: r.pick(['#a3563a', '#2f6f73']) });
  for (let i = 0; i < 8; i++) prop(s, 'cup', 14.55, 1.23 + Math.floor(i / 4) * 0.4, 9.8 + (i % 4) * 0.7, 0, { glaze: r.pick(['#d9cfb8', '#a3563a', '#2f6f73']) });
  sign(s, { kind: 'hanging', text: 'TEA', sub: 'long-pour 0.15 · bun 0.30', palette: ['#7a2f2a', '#f1e6c9', '#e8b84a'], emblem: 'cup' }, 11.4, 2.75, 11.2, { face: 'x', double: true, w: 0.7, h: 0.5 });
  lamp(s, 'globe', 12.4, 3.0, 11.2, { K: 2600, power: 0.9, drop: 3.8, r: 0.22, clip });
  s.interact({ x: 11.4, y: 1.3, z: 11.2, radius: 1.5, prompt: 'Buy tea at the stall', onUse: async (gm) => {
    if (!gm.ui || !gm.ui.menu) return;
    const items = [
      { id: 'tea', name: 'Long-pour tea', desc: 'Poured from arm\'s height into a lidded cup, so it cools on the way down.', price: 0.15 },
      { id: 'bun', name: 'Steamed bun', desc: 'Sesame and sweet bean paste, under a cloth lid.', price: 0.30 },
      { id: 'broth', name: 'Cup of broth', desc: 'Mill broth with a sprig of whatever came up from the Garden.', price: 0.30 },
    ];
    gm.busy++;
    let pick = null; try { pick = await gm.ui.menu({ kicker: 'The tea stall', title: 'Noor\'s urn', note: 'Drink it here or take it in: lids on in the Quilt.', items, wallet: gm.wallet ? gm.wallet.kwh : 0 }); } finally { gm.busy--; }
    if (!pick) return;
    const it = items.find((q) => q.id === pick); if (!it) return;
    if (gm.wallet && !gm.wallet.spend(it.price, it.name)) { toast(gm, 'Not enough kays.', 'info'); return; }
    if (gm.audio) sfx(gm, pick === 'tea' ? 'pour' : 'lid-up', f, 12.4, 1.0, 11.2);
    toast(gm, pick === 'tea' ? 'Noor pours it from the height of her shoulder, and the stream bends a little spinward on the way down. Nobody else in the queue notices.' : pick === 'bun' ? 'It comes under a cloth lid, warm through. Heliox would have it cold by the time you found a bench.' : 'A cup of broth, a green sprig floating in it, the lid on.', 'spend');
  } });
  s.spot('counter', 13.2, 0, 11.2, -PI / 2, { tags: ['serve'] });
  // the week's board, benches, plants under their own lamps
  sign(s, { kind: 'board', title: 'At the Bellows this week', lines: ['Thursday · the organ at noon|free', 'Thursday · the Ring Four choirs|19:30', 'The Quiet|the halls open, no concert', 'Booking Day|the feast is at your hall', 'Every day|the Sound Larder, deck 153', 'Tuesdays|beginners measured, deck 152'], palette: ['#22302c', '#f1e6c9', '#d9a64a'] }, -9.0, 2.0, Z1 - 0.01, { face: 'z', w: 2.2, h: 1.4 });
  s.interact({ x: -9.0, y: 1.6, z: Z1 - 0.9, radius: 1.5, prompt: 'Read the week\'s board', onUse: async (gm) => {
    await say(gm, 'At the Bellows this week', [
      'Thursday at noon, the organ, free; doors open, come and go. Thursday at half past seven, the Ring Four choirs in the Quilt. The Quiet: no concert and no rehearsal; the halls are open, and so is the court, for sitting in. Booking Day: the feast is at your own hall, and so is everyone.',
      'Every day: the Sound Larder, deck 153, the booths and the booth of the old air. Tuesdays: beginners measured for their flutes in the Cutting Room, deck 152. Bring your arms.',
    ]);
  } });
  for (const x of [-12.0, 6.6]) prop(s, 'bench', x, 0, Z1 - 0.5, PI, { w: 2.4, wood: '#7a5233', back: true });
  for (const x of [-4.6, 4.6]) planter(s, x, 0, Z1 - 0.45, { w: 1.2, d: 0.5, h: 0.6, plants: 'fern', tint: '#7a2f2a' });
  for (const [x, z] of [[-6, 4], [6, 4], [-6, 10], [6, 10]]) lamp(s, 'globe', x, 5.0, z, { K: 2800, power: 1.6, r: 0.36, drop: H - 5.0, clip });
  s.ambient({ box: clip, sky: '#ffd9a8', ground: '#c99a6c', power: 0.2, lamp: true });
  s.loop('murmur', 0, 1.3, 7, { vol: 0.3, radius: 10, param: 0.35 });
  // people: the queue, a crowd by the board, a pair by the tea, the walkways through
  s.spot('chat', -6.6, 0, 10.6, 0.4, {}); s.spot('chat', -5.8, 0, 11.4, -2.6, {}); s.spot('chat', -7.3, 0, 11.6, 2.2, {});
  s.spot('chat', 9.4, 0, 9.6, 1.2, {}); s.spot('chat', 10.2, 0, 8.8, -1.8, {});
  s.spot('stand', -9.0, 0, Z1 - 0.95, PI, { tags: ['board'] });
  s.path([[0, 12.6], [0, 7], [0, 4], [0, 0.6]], { width: 2.4 });
  s.path([[0, 7], [-6, 6.6], [-10.9, 6.45]], { width: 1.6 });
  s.path([[0, 7], [6, 6], [10.4, 8.8], [10.6, 11.2]], { width: 1.6 });
  s.path([[0, 4], [8, 4], [13.5, 4.0]], { width: 1.8 });
  s.zoneBox({ id: 'fo-foyer', place: 'felt-organ', box: [X0, -0.5, Z0 + 0.2, X1, H, Z1], name: 'The foyer', sub: 'The Bellows · deck 150 · Ring Four', ambience: 'arcade', reverb: 'room', headroom: H });
  void g;
}

// ---------------------------------------------------------------------------------------------------------------
// the cab lobby, where the cab sets you down: the court and the organ straight ahead through the foyer
// ---------------------------------------------------------------------------------------------------------------
function lobby(game, s, f) {
  const zw = FOY.z1;                       // the foyer's back wall: the berths are in it, the court straight ahead
  for (const x of [-2.2, 2.2]) {
    berth(s, x, zw - 0.16, PI);
    s.interact({ x, y: 1.2, z: zw - 0.9, radius: 1.4, prompt: 'Call a cab', onUse: (gm) => { sfx(gm, 'berth-door', f, x, 1.2, zw - 0.2); if (gm.cab) gm.cab.open('felt-organ'); } });
  }
  sign(s, { kind: 'plate', text: 'BERTHS 1 AND 2', sub: 'the Bellows · deck 150 · one party a cab' }, 0, 2.85, zw - 0.1, { face: 'z', w: 1.0, h: 0.3 });
  sign(s, { kind: 'board', title: 'The Bellows', lines: ['Bellows Court · the organ|ahead', 'The Quilt · concert hall|right, long foyer', 'The Kettle Room|end of the long foyer', 'The Cutting Room · Wind Room|deck 152', 'The Sound Larder|deck 153', 'Stairs|both sides of the court'], palette: ['#22302c', '#f1e6c9', '#d9a64a'] }, 9.6, 1.85, zw - 0.02, { face: 'z', w: 1.6, h: 1.0 });
  s.interact({ x: 9.6, y: 1.5, z: zw - 0.9, radius: 1.4, prompt: 'Read the board by the berths', onUse: async (gm) => {
    await say(gm, 'The Bellows', [
      'Straight ahead, Bellows Court and the organ. To the right, the long foyer to the Quilt\'s stalls door and, at its end, the Kettle Room. The stairs are either side of the court, on every deck.',
      'Deck 152: the console bridge, the Cutting Room and the Wind Room. Deck 153: the Sound Larder. The galleries on every deck look across at the pipes.',
    ]);
  } });
  s.deco((gg) => { gg.mat('rush', '#8a7a5a'); gg.box(-3.6, 0.002, 11.8, 3.6, 0.014, 13.7, { faces: 'Y' }); });
  // felt hangings high on the back wall, one each side of the berths and a long one over them, on brass rods
  s.deco((gg) => {
    const hang = (x0, x1, y0, y1, col, stripe) => {
      gg.mat('felt', col); gg.sheet([x0, y1, zw - 0.25], [x1, y1, zw - 0.25], [x1, y0, zw - 0.25], [x0, y0, zw - 0.25], { nu: 8, nv: 2, ripple: 0.04, rippleN: 6 });
      gg.mat('felt', stripe); gg.box(x0 + 0.1, y0 + 0.25, zw - 0.3, x1 - 0.1, y0 + 0.4, zw - 0.27, { faces: 'z' });
      gg.mat('cast', C.brass, { rough: -0.2 }); gg.tube([[x0 - 0.15, y1 + 0.04, zw - 0.25], [x1 + 0.15, y1 + 0.04, zw - 0.25]], 0.03, { segs: 6 });
      gg.tube([[x0 + 0.2, y1 + 0.04, zw - 0.25], [x0 + 0.2, FOY.h, zw - 0.2]], 0.006, { segs: 4 }); gg.tube([[x1 - 0.2, y1 + 0.04, zw - 0.25], [x1 - 0.2, FOY.h, zw - 0.2]], 0.006, { segs: 4 });
    };
    hang(-7.4, -5.4, 3.4, 6.9, C.madder, C.saffron);
    hang(5.4, 7.4, 3.4, 6.9, C.tealL, C.saffron);
    hang(-3.6, 3.6, 4.4, 6.6, C.plum, C.gilt);
  });
  sign(s, { kind: 'letters', text: 'PLAYED IN THIS AIR', palette: ['#e8c46a'] }, 0, 5.5, zw - 0.3, { face: 'z', w: 5.6, h: 0.5 });
  s.spot('stand', -1.2, 0, 12.8, PI, { tags: ['wait'] }); s.spot('stand', 3.6, 0, 12.5, PI * 0.9, { tags: ['wait'] });
  s.path([[0, 12.6], [-2.2, 13.0], [2.2, 13.0], [0, 12.6]], { width: 1.4 });
}

// ---------------------------------------------------------------------------------------------------------------
// the rooms over the foyer: floors, ceilings, outer walls, the wall between the two on deck 152
// ---------------------------------------------------------------------------------------------------------------
function backShell(s) {
  for (const [y, k] of [[D2, 2], [D3, 3]]) {
    floor(s, -15, BACK.z0 + 0.2, 15, BACK.z1, y, k === 2 ? 'planks' : 'carpet', k === 2 ? '#a07a50' : '#2a3a3a', { level: k });
    ceiling(s, -15, BACK.z0, 15, BACK.z1, y + BACK.h, 'paint', k === 2 ? '#e9e2d0' : '#24343a', { level: k });
    const wo = { tint: k === 2 ? '#cfd2b2' : '#2a4a4f', t: 0.2, level: k, dado: { h: 1.0, mat: 'panel', tint: k === 2 ? '#4a5a4a' : '#1e3236' } };
    wallRun(s, 'x', BACK.z1 + 0.1, -15, 15, y, 4, wo);
    wallRun(s, 'z', -15.1, BACK.z0, BACK.z1, y, 4, wo);
    wallRun(s, 'z', 15.1, BACK.z0, BACK.z1, y, 4, wo);
  }
  wallRun(s, 'z', 0, BACK.z0, BACK.z1, D2, BACK.h, { tintA: '#d9c9a4', tintB: '#cfd2b2', t: 0.2, level: 2, dado: { h: 1.0, mat: 'panel', tint: '#4a5a4a' } });
  // the rooms' names over their doors, on the gallery side
  sign(s, { kind: 'plate', text: 'THE CUTTING ROOM', sub: 'flutes cut in this air', palette: ['#2f5d5a', '#f1e6c9'] }, -7.55, D2 + 2.7, -0.02, { face: 'z', w: 1.1, h: 0.3, level: 2 });
  sign(s, { kind: 'plate', text: 'THE WIND', sub: 'the reservoirs and the blower', palette: ['#2f5d5a', '#f1e6c9'] }, 7.55, D2 + 2.7, -0.02, { face: 'z', w: 1.1, h: 0.3, level: 2 });
  sign(s, { kind: 'fascia', text: 'The Sound Larder', sub: 'every recording Chervil has kept', palette: ['#1e3236', '#f1e6c9', '#d9a64a'] }, 0, D3 + 2.85, -0.03, { face: 'z', w: 3.2, h: 0.45, level: 3 });
  sign(s, { kind: 'plate', text: 'STAFF', sub: 'the organ\'s loft · mind your head', palette: ['#3a2a20', '#f1e6c9'] }, 0, DY[4] + 2.6, -0.02, { face: 'z', w: 0.8, h: 0.24, level: 4 });
  s.structure((gg) => { gg.mat('wood', '#4a2e1e'); gg.box(-0.6, DY[4], -0.02, 0.6, DY[4] + 2.2, 0.0, { faces: 'z' }); gg.mat('cast', C.brass); gg.box(0.4, DY[4] + 1.0, -0.05, 0.48, DY[4] + 1.1, -0.02); }, 4);
}

// ---------------------------------------------------------------------------------------------------------------
// the Cutting Room, deck 152
// ---------------------------------------------------------------------------------------------------------------
function cuttingRoom(game, s, f, r) {
  const y = D2, X0 = CUT.x0, X1 = CUT.x1, Z1 = BACK.z1, g = s.g;
  const clip = [X0, y - 0.2, 0, X1, y + BACK.h + 0.1, Z1];
  // the long bench along the back wall: blanks, flutes at every stage, a fine saw, files, the brass rule
  s.furniture((gg) => {
    gg.mat('wood', '#c9a878', { rough: -0.1 }); gg.box(X0 + 0.6, y + 0.86, Z1 - 0.95, X1 - 1.2, y + 0.92, Z1 - 0.15, { bevel: 0.01 });
    gg.mat('wood', '#7a5233'); for (let x = X0 + 1.0; x < X1 - 1.2; x += 2.4) gg.box(x, y, Z1 - 0.9, x + 0.08, y + 0.86, Z1 - 0.2);
    gg.box(X0 + 0.6, y + 0.15, Z1 - 0.9, X1 - 1.2, y + 0.18, Z1 - 0.2);
    gg.mat('cast', C.brass, { rough: -0.2 }); gg.box(X0 + 2, y + 0.92, Z1 - 0.85, X0 + 3.5, y + 0.925, Z1 - 0.8, { faces: 'Y' });
    gg.mat('cast', '#3a3a3a'); gg.box(X0 + 5.5, y + 0.92, Z1 - 0.7, X0 + 5.8, y + 1.1, Z1 - 0.45, { bevel: 0.01 });
  });
  s.solid(X0 + 0.6, y, Z1 - 0.95, X1 - 1.2, y + 0.92, Z1 - 0.15);
  for (let i = 0; i < 14; i++) {
    const L = [1.2, 1.07, 0.95, 0.9, 0.8, 0.71, 0.64, 0.6][i % 8] + (i > 9 ? 0.05 : 0);
    prop(s, 'feltorgan.flute', X0 + 0.9 + (i % 7) * 1.85, y + 0.92, Z1 - 0.75 + Math.floor(i / 7) * 0.3, 0, { L, wood: i % 3 === 0 ? '#8a5a34' : undefined });
  }
  // shavings on the bench and the floor
  s.detail((gg) => { gg.mat('wood', '#e0c49a'); for (let i = 0; i < 40; i++) { const x = r.f(X0 + 1, X1 - 2), z = Z1 - r.f(0.2, 0.9), yy = i < 20 ? y + 0.925 : y + 0.003, zz = i < 20 ? z : Z1 - r.f(1.0, 1.8); gg.box(x, yy, zz, x + 0.03, yy + 0.004, zz + 0.012, { faces: 'Y' }); } });
  // the rack of blanks on the anti wall, lengths sorted, a label at each shelf
  s.furniture((gg) => {
    gg.mat('wood', '#6b4a2f'); for (let k = 0; k < 5; k++) gg.box(X0 + 0.12, y + 0.5 + k * 0.4, 1.5, X0 + 0.4, y + 0.53 + k * 0.4, 9.5);
    for (let k = 0; k < 5; k++) for (let i = 0; i < 12; i++) { const L = [1.2, 1.07, 0.95, 0.9, 0.8, 0.71][(i + k) % 6], zz = 1.7 + Math.floor(i / 2) * 1.3, xx = X0 + 0.2 + (i % 2) * 0.1, yy = y + 0.56 + k * 0.4; gg.mat(k % 2 ? 'wood' : 'cast', k % 2 ? r.pick(['#8a5a34', '#a07040', '#6b4429']) : '#cfccc4', { rough: k % 2 ? 0 : -0.3 }); gg.tube([[xx, yy, zz], [xx, yy, zz + L]], 0.018, { segs: 6 }); }
  });
  s.solid(X0, y, 1.5, X0 + 0.42, y + 2.2, 9.5);
  // the chart: lengths against notes in this air
  sign(s, { kind: 'board', title: 'Lengths against notes · this air · 22°', lines: ['C|1.20 m · old air 0.67', 'D|1.07 · 0.60', 'E|0.95 · 0.53', 'F|0.90 · 0.50', 'G|0.80 · 0.45', 'A|0.71 · 0.40', 'B|0.64 · 0.36', 'C|0.60 · 0.34'], palette: ['#22302c', '#f1e6c9', '#d9a64a'] }, -5.2, y + 2.1, Z1 - 0.01, { face: 'z', w: 1.8, h: 1.2, level: 2 });
  // the measuring post for beginners: a board of marks at arm's height, names and dates pencilled
  s.furniture((gg) => { gg.mat('wood', '#c9a878'); gg.box(-0.42, y, 2.0, -0.22, y + 2.2, 2.6, { bevel: 0.01 }); gg.mat('paint', '#2a2420'); for (let i = 0; i < 16; i++) gg.box(-0.43, y + 1.0 + i * 0.06, 2.05 + (i % 3) * 0.1, -0.425, y + 1.004 + i * 0.06, 2.25 + (i % 3) * 0.1, { faces: 'x' }); });
  // the meter by the door: the helium share and the temperature, read every morning
  s.deco((gg) => { gg.mat('wood', '#3a2a20'); gg.box(-13.0, y + 1.5, 0.12, -11.8, y + 2.2, 0.16, { bevel: 0.01 }); gg.mat('diffuser', '#f1e6c9', { emissive: 0.9, lamp: true }); gg.cyl(-12.7, y + 1.85, 0.16, 0.16, 0.012); gg.cyl(-12.1, y + 1.85, 0.16, 0.16, 0.012); }, 2);
  s.deco((gg) => { gg.mat('cast', '#2a2420'); gg.push(); gg.move(-12.7, y + 1.85, 0.17); gg.rotX(PI / 2); gg.box(-0.004, 0, -0.004, 0.004, 0.12, 0.004); gg.pop(); gg.push(); gg.move(-12.1, y + 1.85, 0.17); gg.rotX(PI / 2); gg.rotY(0.9); gg.box(-0.004, 0, -0.004, 0.004, 0.12, 0.004); gg.pop(); }, 2);
  // stools, a flute case open on one
  for (const x of [X0 + 3, X0 + 7.6, X0 + 11]) prop(s, 'stool', x, y, Z1 - 1.5, 0, { wood: '#6b4a2f', h: 0.62 }, { level: 2, noSpots: true });
  // the wall of finished flutes on the wall between the rooms, hung by length like a flat of pipes, longest anti
  s.detail((gg) => {
    gg.mat('wood', '#5a3a24'); gg.box(-0.16, y + 2.95, 1.0, -0.1, y + 3.02, 9.8);
    for (let i = 0; i < 24; i++) {
      const z = 1.3 + i * 0.36, L = 1.2 * Math.pow(2, -i / 24), top = y + 2.92, wood = i % 4 === 1;
      gg.mat(wood ? 'wood' : 'brushed', wood ? '#8a5a34' : '#d8d5cc', { rough: wood ? -0.1 : -0.35 }); gg.tube([[-0.2, top, z], [-0.2, top - L, z]], 0.017, { segs: 7 });
      gg.mat('cast', C.brass); for (let k = 0; k < 6; k++) gg.box(-0.225, top - L * (0.45 + k * 0.07), z - 0.008, -0.215, top - L * (0.45 + k * 0.07) + 0.012, z + 0.008);
      gg.mat('wood', '#3a2418'); gg.box(-0.16, top - 0.04, z - 0.012, -0.12, top + 0.03, z + 0.012);
    }
  }, 2);
  // the middle bench: a vice, flutes half done, files, a lidded cup gone cold
  block(s, -11.2, y, 4.5, -4.2, y + 0.9, 5.6, 'wood', '#b99868', { bevel: 0.01, level: 2 });
  s.detail((gg) => {
    gg.mat('cast', '#3a3a3a'); gg.box(-10.6, y + 0.9, 4.6, -10.2, y + 1.08, 4.9, { bevel: 0.01 }); gg.box(-10.55, y + 1.08, 4.7, -10.25, y + 1.16, 4.8);
    gg.mat('cast', '#6a6a68'); for (let i = 0; i < 5; i++) gg.box(-8.8 + i * 0.12, y + 0.9, 5.25, -8.78 + i * 0.12, y + 0.91, 5.5, { faces: 'Y' });
    gg.mat('wood', '#e0c49a'); for (let i = 0; i < 18; i++) { const x = r.f(-11, -4.5), z = r.f(4.6, 5.5); gg.box(x, y + 0.902, z, x + 0.03, y + 0.906, z + 0.012, { faces: 'Y' }); }
  }, 2);
  for (let i = 0; i < 5; i++) prop(s, 'feltorgan.flute', -10.0 + i * 1.1, y + 0.9, 4.75 + (i % 2) * 0.35, 0.05 * (i - 2), { L: [1.2, 0.95, 1.07, 0.8, 0.71][i], wood: i === 2 ? '#8a5a34' : undefined }, { level: 2 });
  prop(s, 'cup', -5.0, y + 0.9, 5.3, 0, { glaze: '#a3563a' }, { level: 2 });
  for (const x of [-9.4, -6.2]) prop(s, 'stool', x, y, 4.0, 0, { wood: '#6b4a2f', h: 0.62 }, { level: 2, noSpots: true });
  // the lathe for the bores, by the measuring post
  s.furniture((gg) => {
    gg.mat('paint', '#4a5a4a'); gg.box(-4.4, y, 2.3, -1.6, y + 0.8, 3.1, { bevel: 0.02 });
    gg.mat('cast', '#3a3a3a'); gg.box(-4.4, y + 0.8, 2.45, -1.6, y + 0.88, 2.95); gg.box(-4.35, y + 0.88, 2.35, -3.8, y + 1.3, 3.05, { bevel: 0.02 }); gg.box(-2.1, y + 0.88, 2.45, -1.7, y + 1.18, 2.95, { bevel: 0.02 });
    gg.mat('wood', '#c9a878'); gg.tube([[-3.8, y + 1.08, 2.7], [-2.1, y + 1.08, 2.7]], 0.022, { segs: 8 });
  }, 2);
  s.solid(-4.4, y, 2.3, -1.6, y + 1.3, 3.1);
  // crates of blanks by the rack
  for (const [x, z] of [[-13.2, 0.75], [-12.4, 0.75]]) { prop(s, 'crate', x, y, z, 0, { w: 0.7, h: 0.45, d: 0.5 }, { level: 2 }); s.detail((gg) => { gg.mat('wood', '#a07040'); for (let i = 0; i < 7; i++) gg.tube([[x - 0.3, y + 0.42 + (i % 2) * 0.04, z - 0.18 + i * 0.06], [x + 0.32, y + 0.42 + (i % 2) * 0.04, z - 0.18 + i * 0.06]], 0.018, { segs: 6 }); }, 2); }
  lamp(s, 'panel', -10.5, y + BACK.h, 6, { w: 2.4, d: 0.6, K: 4000, power: 1.0, clip, level: 2 });
  lamp(s, 'panel', -4.5, y + BACK.h, 6, { w: 2.4, d: 0.6, K: 4000, power: 1.0, clip, level: 2 });
  lamp(s, 'strip', X0 + 1.5, y + 1.75, Z1 - 0.3, { to: [X1 - 2, y + 1.75, Z1 - 0.3], K: 3600, power: 0.35, glow: 1.6, clip, level: 2 });
  s.ambient({ box: clip, sky: '#f2ead8', ground: '#c9a878', power: 0.18, lamp: true });
  // the tuner and the carvers; a beginner being measured
  s.spot('work', X0 + 3, y, Z1 - 1.35, 0, { tags: ['carve'] });
  s.spot('work', X0 + 7.6, y, Z1 - 1.35, 0, { tags: ['carve'] });
  s.spot('work', -6.8, y, 4.6, -2.2, { tags: ['tune'] });
  s.spot('work', -9.2, y, 5.6, 1.4, { tags: ['tune'] });
  s.spot('stand', -0.9, y, 2.3, PI / 2, { tags: ['wait'] });
  s.path([[-7.55, y, -1.6], [-7.55, y, 1.2], [-7.55, y, 5.0], [-3.0, y, 5.0], [-1.2, y, 2.3]], { width: 1.2 });
  s.path([[-7.55, y, 5.0], [-11.5, y, 8.6]], { width: 1.2 });
  s.zoneBox({ id: 'fo-cutting', place: 'felt-organ', box: [X0, y - 0.2, 0.1, X1, y + BACK.h, Z1], name: 'The Cutting Room', sub: 'The Bellows · deck 152', ambience: 'shop', reverb: 'room' });
  s.interact({ x: -5.2, y: y + 1.6, z: Z1 - 1.2, radius: 1.5, prompt: 'Read the chart', onUse: async (gm) => {
    await say(gm, 'Lengths against notes', [
      'LENGTHS AGAINST NOTES, IN THIS AIR, AT TWENTY-TWO DEGREES. C, 1.20 m; in the old air it was 0.67. D, 1.07 (0.60). E, 0.95 (0.53). F, 0.90 (0.50). G, 0.80 (0.45). A, 0.71 (0.40). B, 0.64 (0.36). The C above, 0.60 (0.34).',
      'At the foot, painted bigger: A DEGREE WARMER AND EVERY FLUTE ON THE BENCH PLAYS THREE CENTS SHARP. KEEP THE DOOR SHUT.',
    ]);
  } });
  s.interact({ x: X0 + 4.6, y: y + 1.3, z: Z1 - 1.6, radius: 1.5, prompt: 'Watch a flute being cut', onUse: async (gm) => {
    await say(gm, 'Teodor, the tuner', [
      'Teodor has cut this one a finger too long on purpose. He plays it, frowns, takes a shaving off the end with a saw as fine as a comb, and plays it again. Four times. The fifth time he nods at nobody.',
      '"Every pipe is tuned in the air it will be played in. This room is kept like the Quilt: the same mix, twenty-two degrees. Weight does not touch it: a flute cut here plays the same in the Hollow at half a g. Heat does. And the helium share does, so we read the meter every morning."',
      '"Beginners are measured first. Your arms decide your flute. A metre twenty is a long reach at ten years old, so the little ones start on the high ones and grow into the long."',
    ]);
    if (gm.audio) sfx(gm, 'flute-note', f, X0 + 4.6, y + 1.3, Z1 - 0.8, { pitch: 0.75 });
  } });
  void g;
}

// ---------------------------------------------------------------------------------------------------------------
// the Wind Room, deck 152
// ---------------------------------------------------------------------------------------------------------------
function windRoom(game, s, f, r) {
  const y = D2, X0 = WIND.x0, X1 = WIND.x1, Z1 = BACK.z1;
  const clip = [X0, y - 0.2, 0, X1, y + BACK.h + 0.1, Z1];
  prop(s, 'feltorgan.bellows', 4.0, y, 6.4, 0, { w: 2.6, d: 1.8, open: 0.5 }, { level: 2 });
  prop(s, 'feltorgan.bellows', 8.4, y, 6.4, 0, { w: 2.6, d: 1.8, open: 0.38 }, { level: 2 });
  prop(s, 'feltorgan.bellows', 12.6, y, 4.0, PI / 2, { w: 2.2, d: 1.6, open: 0.44 }, { level: 2 });
  // the blower in its box, and the trunks: square wooden ducts to the wall, toward the organ
  s.furniture((gg) => {
    gg.mat('paint', '#2f5d5a'); gg.box(11.4, y, 8.4, 14.6, y + 1.6, 10.7, { bevel: 0.02 });
    gg.mat('cast', '#5a5652'); gg.push(); gg.move(13.0, y + 0.8, 8.38); gg.rotX(PI / 2); gg.cyl(0, -0.02, 0, 0.6, 0.04, { segs: 18 }); gg.pop();
    gg.mat('grille', '#8a8880'); gg.push(); gg.move(13.0, y + 0.8, 8.35); gg.rotX(PI / 2); gg.cyl(0, -0.02, 0, 0.5, 0.01, { segs: 18 }); gg.pop();
    // the wind lines: from each reservoir up to the ceiling and out through the wall toward the chests, painted by pressure
    gg.mat('paint', '#7a2f2a', { rough: -0.1 });
    for (const x of [4.0, 8.4]) gg.tube([[x, y + 1.05, 6.4], [x, y + 2.85, 6.4], [x, y + 2.85, 0.15]], 0.17, { segs: 12 });
    gg.tube([[12.6, y + 1.0, 4.0], [12.6, y + 2.85, 4.0], [12.6, y + 2.85, 0.15]], 0.15, { segs: 12 });
    gg.tube([[13.0, y + 1.6, 8.8], [13.0, y + 2.4, 8.8], [12.6, y + 2.6, 4.2]], 0.2, { segs: 12 });
    gg.mat('cast', C.brass); for (const [x, z] of [[4.0, 3.2], [8.4, 3.2], [12.6, 2.0]]) gg.lathe(x, z, [[0.2, y + 2.85 - 0.22], [0.2, y + 2.85 + 0.22]], { segs: 12 });
  });
  s.solid(11.4, y, 8.4, 14.6, y + 1.6, 10.7);
  // a bench along the back wall: proofed cloth on a roll, a pot of glue on a hotplate, spare weights stacked under it
  block(s, 1.2, y, Z1 - 0.8, 6.5, y + 0.88, Z1 - 0.15, 'wood', '#a07a50', { bevel: 0.01, level: 2 });
  s.detail((gg) => {
    gg.mat('weave', '#4a3a2e'); gg.push(); gg.move(2.2, y + 1.0, Z1 - 0.48); gg.rotZ(PI / 2); gg.cyl(0, -0.6, 0, 0.12, 1.2, { segs: 12 }); gg.pop();
    gg.mat('cast', '#3a3a3a'); gg.box(4.6, y + 0.88, Z1 - 0.6, 5.0, y + 0.95, Z1 - 0.3); gg.mat('glaze', '#8a5a3c'); gg.cyl(4.8, y + 0.95, Z1 - 0.45, 0.09, 0.14, { segs: 10 });
    gg.mat('cast', '#2a2c2c'); for (let i = 0; i < 6; i++) gg.box(1.6 + (i % 3) * 0.5, y + (i < 3 ? 0 : 0.15), Z1 - 0.7, 2.0 + (i % 3) * 0.5, y + (i < 3 ? 0.15 : 0.3), Z1 - 0.35, { bevel: 0.008 });
  }, 2);
  // the wind gauge: a glass U of tinted water against a scale
  s.deco((gg) => {
    gg.mat('wood', '#e6d6b0'); gg.box(1.0, y + 0.8, Z1 - 0.06, 1.6, y + 2.3, Z1 - 0.02);
    gg.mat('paint', '#2a2420'); for (let i = 0; i < 14; i++) gg.box(1.08, y + 0.9 + i * 0.1, Z1 - 0.065, 1.2 + (i % 5 === 0 ? 0.08 : 0), y + 0.905 + i * 0.1, Z1 - 0.06, { faces: 'z' });
    gg.mat('diffuser', '#5aa8c8', { emissive: 0.6 }); gg.box(1.3, y + 0.95, Z1 - 0.1, 1.33, y + 1.55, Z1 - 0.07, { faces: 'zxX' }); gg.box(1.45, y + 0.95, Z1 - 0.1, 1.48, y + 1.75, Z1 - 0.07, { faces: 'zxX' });
  }, 2);
  sign(s, { kind: 'notice', title: 'The weights', lines: ['Cast for deck 150 · 0.80 g.', 'Do not move them to', 'another deck. On the rim', 'they would press a quarter', 'harder; on the High decks', 'a quarter softer.'] }, 4.0, y + 2.0, Z1 - 0.02, { face: 'z', w: 0.6, h: 0.66, level: 2 });
  lamp(s, 'panel', 7, y + BACK.h, 5, { w: 2.2, d: 0.6, K: 3400, power: 0.9, clip, level: 2 });
  lamp(s, 'bulb', 13, y + 2.4, 7.6, { K: 3000, power: 0.4, range: 4, clip, level: 2 });
  s.ambient({ box: clip, sky: '#f0e2c8', ground: '#a07a50', power: 0.16, lamp: true });
  s.loop('air', 13.0, y + 0.8, 8.0, { vol: 0.22, radius: 6 });
  s.spot('work', 12.6, y, 7.7, PI, { tags: ['crew'] });
  s.spot('stand', 6.2, y, 4.0, 0.3, { tags: ['view'] });
  s.path([[7.55, y, -1.6], [7.55, y, 1.6], [6.2, y, 3.6], [10.4, y, 7.6]], { width: 1.2 });
  s.zoneBox({ id: 'fo-wind', place: 'felt-organ', box: [X0, y - 0.2, 0.1, X1, y + BACK.h, Z1], name: 'The Wind', sub: 'The Bellows · deck 152', ambience: 'quiet', reverb: 'room' });
  s.interact({ x: 4.0, y: y + 1.5, z: Z1 - 0.9, radius: 1.5, prompt: 'Read the label on the weights', onUse: async (gm) => {
    await say(gm, 'The weights', [
      'THE WEIGHTS ON THESE RESERVOIRS WERE CAST FOR DECK 150, AT 0.80 g. DO NOT MOVE THEM TO ANOTHER DECK.',
      'The Bellows is blown by weight: iron bricks on the top board of each reservoir press the air into the pipes. Weight is what the deck gives you. The same bricks on the rim would press a quarter harder, and on the High decks a quarter softer, and every pipe would speak wrong.',
      'The blower draws the court\'s own air and the pipes give it back. The organ breathes heliox like everyone else in the building; that is what it is tuned to.',
    ]);
  } });
  void r;
}

// ---------------------------------------------------------------------------------------------------------------
// the Sound Larder, deck 153: the catalogue room in the middle, a corridor of booths each side, the booth of the old air
// ---------------------------------------------------------------------------------------------------------------
const CZ0 = 4.2, CZ1 = 6.6;              // the booths' corridor
function larder(game, s, f, r) {
  const y = D3, g = s.g, Z1 = BACK.z1, H = BACK.h;
  const clipAll = [-15, y - 0.2, 0, 15, y + H + 0.1, Z1];
  // the catalogue room's walls (x = -3.4 and 3.4) with the corridor openings
  for (const sx of [-1, 1]) wallRun(s, 'z', sx * 3.4, BACK.z0 + 0.2, Z1, y, H, { tint: '#2a4a4f', t: 0.16, level: 3, dado: { h: 1.0, mat: 'wood', tint: '#4a2e1e' } }, [[CZ0, CZ1 - CZ0, 0, 2.4]]);
  // the drawers, the desk, a lamp
  for (const [x, z, yaw] of [[-2.3, 10.7, PI], [0, 10.7, PI], [2.3, 10.7, PI], [-3.05, 8.3, PI / 2], [3.05, 8.3, -PI / 2], [-3.05, 2.1, PI / 2], [3.05, 2.1, -PI / 2]]) prop(s, 'feltorgan.drawers', x, y, z, yaw, { cols: 6, rows: 8 }, { level: 3 });
  prop(s, 'table', 0, y, 6.2, 0, { w: 1.6, d: 0.8, wood: '#5a3a24' }, { level: 3 });
  prop(s, 'chair', 0, y, 6.95, PI, { wood: '#5a3a24', seat: '#2f6f73', back: 'slat' }, { level: 3, noSpots: true });
  s.detail((gg) => {
    gg.mat('paper', '#efe6d0'); for (let i = 0; i < 6; i++) gg.box(-0.6 + i * 0.12, y + 0.74, 5.95 + (i % 2) * 0.06, -0.5 + i * 0.12, y + 0.76 + (i % 3) * 0.01, 6.1 + (i % 2) * 0.06, { faces: 'YxXzZ' });
    gg.mat('wood', '#5a3a24'); gg.box(0.3, y + 0.74, 5.9, 0.7, y + 0.86, 6.2, { bevel: 0.01 });
    gg.mat('cast', '#2a2622'); gg.tube([[0.55, y + 0.86, 6.0], [0.55, y + 1.25, 6.0], [0.4, y + 1.35, 6.0]], 0.01, { segs: 5 });
  }, 3);
  lamp(s, 'globe', 0.4, y + 1.33, 6.0, { K: 2700, power: 0.6, r: 0.08, drop: 0.02, range: 4, clip: [-3.4, y - 0.2, 0, 3.4, y + H, Z1] });
  s.spot('sit', 0, y + 0.46, 6.95, PI, { tags: ['write'] });
  s.spot('work', -2.3, y, 9.9, PI, { tags: ['write'] });
  s.spot('browse', 2.3, y, 9.9, PI, {});
  s.spot('browse', -2.3, y, 2.9, -PI / 2 + PI, {});
  lamp(s, 'panel', 0, y + H, 4.0, { w: 1.4, d: 0.5, K: 2800, power: 0.55, clip: [-3.4, y - 0.2, 0, 3.4, y + H, Z1], level: 3 });
  s.deco((gg) => { gg.mat('felt', '#1e3236'); gg.box(-10.5, y, CZ0 + 0.3, 14.8, y + 0.008, CZ1 - 0.3, { faces: 'Y' }); }, 3);
  // the booths: three a side in the anti wing (the old air's lock closes its end), four a side in the spinward wing
  const booths = [];
  const wing = (x0, x1, n) => { const w = (x1 - x0) / n; for (let i = 0; i < n; i++) { booths.push({ x0: x0 + i * w, x1: x0 + (i + 1) * w, side: -1 }); booths.push({ x0: x0 + i * w, x1: x0 + (i + 1) * w, side: 1 }); } };
  wing(-10.6, -3.4, 3); wing(3.4, 14.9, 4);
  booths.forEach((b, i) => booth(s, b, i, r, y));
  // corridor lamps, low, and the light of the occupied booths
  for (const x of [-7, 6.2, 11.6]) lamp(s, 'globe', x, y + H - 0.6, (CZ0 + CZ1) / 2, { K: 2600, power: 0.45, r: 0.14, drop: 0.5, range: 5, clip: clipAll });
  s.ambient({ box: clipAll, sky: '#c89060', ground: '#2a3a3a', power: 0.1, lamp: true });
  oldAir(game, s, f, y);
  // the walkways
  s.path([[0, y, -1.6], [0, y, 1.0], [0, y, 4.0], [-2.0, y, (CZ0 + CZ1) / 2], [-6, y, (CZ0 + CZ1) / 2], [-10.0, y, (CZ0 + CZ1) / 2]], { width: 1.2 });
  s.path([[0, y, 4.0], [2.0, y, (CZ0 + CZ1) / 2], [8, y, (CZ0 + CZ1) / 2], [14.2, y, (CZ0 + CZ1) / 2]], { width: 1.2 });
  s.path([[0, y, 4.0], [0, y, 9.0], [-2.3, y, 9.6]], { width: 1.0 });
  s.zoneBox({ id: 'fo-larder', place: 'felt-organ', box: [-15, y - 0.2, 0.1, 15, y + H, Z1], name: 'The Sound Larder', sub: 'The Bellows · deck 153 · every recording Chervil has kept', ambience: 'quiet', reverb: 'felt' });
  // the drawers and a booth to listen in
  s.interact({ x: 2.3, y: y + 1.3, z: 9.7, radius: 1.4, prompt: 'Pull out a drawer', onUse: async (gm) => {
    await say(gm, 'Ama, the archivist', [
      'Index cards, thousands of them, typed and in hand. Every block in Chervil has a choir, and every choir is recorded once a year, on an evening the block chooses. The card goes in the drawer under the block\'s name. The recordings themselves are in the data halls; the Larder keeps the cards, and the booths to hear them in.',
      'This drawer is one block: forty-one years of its choir, a card a year. On one of them somebody has written, in green: the year we had the good tenor.',
    ]);
  } });
  const lb = booths[7];
  s.interact({ x: (lb.x0 + lb.x1) / 2, y: y + 1.2, z: CZ1 - 0.3, radius: 1.3, prompt: 'Listen in a booth', onUse: async (gm) => {
    const bx = (lb.x0 + lb.x1) / 2;
    if (gm.player && gm.player.sit) { gm.player.sit({ x: bx, y, z: CZ1 + 1.55, yaw: 0 }); gm.player.yaw = PI; gm.player.pitch = -0.05; }
    await say(gm, 'Booth eight', [
      'The lamp comes up as you sit. The card in the frame says: RECORDING 1,906,442. MADE IN THE OLD AIR. A CHOIR OF NINE, IN A LANGUAGE NOBODY HERE SPEAKS. SENT BY LIGHT.',
      'It sounds the way the oldest recordings do, as if they were singing through a blanket: low, soft-edged, close. The women in it sound like men in Chervil, and the men sound like the floor of the drum.',
      'Under the card, in pencil, in many hands: lovely. Slow. Play it twice. My grandmother\'s favourite. Why do they sound so sad. They do not, they sound warm.',
    ]);
  } });
  void g;
}

// One booth: two side walls, a back wall, a front with a door gap and a pane, felt inside, a chair and a lamp.
function booth(s, b, i, r, y) {
  const g = s.g, H = 2.6, front = b.side < 0 ? CZ0 : CZ1, back = b.side < 0 ? 1.4 : 9.4, zf = front, zb = back;
  const z0 = Math.min(zf, zb), z1 = Math.max(zf, zb), w = b.x1 - b.x0, cx = (b.x0 + b.x1) / 2;
  const wo = { tint: '#1e3236', t: 0.12, level: 3, skirt: '#3a2a20' };
  wall(s, b.x0 + 0.06, z0, b.x0 + 0.06, z1, y, H, wo);
  wall(s, b.x1 - 0.06, z0, b.x1 - 0.06, z1, y, H, wo);
  wall(s, b.x0, zb, b.x1, zb, y, H, wo);
  wall(s, b.x0, zf, b.x1, zf, y, H, Object.assign({}, wo, { openings: [{ at: 0.25, w: 0.85, h: 2.1 }, { at: 1.3, w: Math.max(0.3, w - 1.6), h: 0.7, sill: 1.1 }] }));
  // the window: a felt curtain drawn across it while somebody is listening
  if (i % 3 === 0) s.deco((gg) => { gg.mat('felt', FELTS[(i * 7 + 2) % FELTS.length]); const zc = zf - b.side * 0.1; gg.sheet([b.x0 + 1.25, y + 1.85, zc], [b.x0 + 1.35 + Math.max(0.3, w - 1.6), y + 1.85, zc], [b.x0 + 1.35 + Math.max(0.3, w - 1.6), y + 1.05, zc], [b.x0 + 1.25, y + 1.05, zc], { nu: 6, nv: 1, ripple: 0.03, rippleN: 6 }); }, 3);
  s.deco((gg) => { gg.mat('cast', C.brass); gg.box(b.x0 + 0.55, y + 2.18, Math.min(zf, zf - b.side * 0.1), b.x0 + 0.8, y + 2.24, Math.max(zf, zf - b.side * 0.1)); gg.mat('diffuser', i % 3 === 0 ? '#ffb85a' : '#5a4a3a', { emissive: i % 3 === 0 ? 3 : 0.2, lamp: true }); gg.ball(b.x0 + 0.675, y + 2.16, zf - b.side * 0.1, 0.05, 0.05, 0.05, { segs: 8, rings: 5 }); }, 3);
  // a lid over the top: the booths are rooms in a room
  s.structure((gg) => { gg.mat('wood', '#3a2a20'); gg.box(b.x0, y + H, z0, b.x1, y + H + 0.08, z1, { faces: 'yY' }); }, 3);
  // felt inside, a speaker panel on the back wall, a chair facing it, a lamp on a stand, the number on the door
  s.deco((gg) => {
    const col = FELTS[(i * 5) % FELTS.length];
    gg.mat('felt', col); gg.box(b.x0 + 0.13, y + 0.1, z0 + 0.1, b.x1 - 0.13, y + H - 0.1, z0 + 0.14, { faces: 'Z' }); gg.box(b.x0 + 0.13, y + 0.1, z1 - 0.14, b.x1 - 0.13, y + H - 0.1, z1 - 0.1, { faces: 'z' });
    gg.mat('felt', '#2a3a3a'); gg.box(b.x0 + 0.12, y + 0.1, z0 + 0.1, b.x0 + 0.13, y + H - 0.1, z1 - 0.1, { faces: 'X' }); gg.box(b.x1 - 0.13, y + 0.1, z0 + 0.1, b.x1 - 0.12, y + H - 0.1, z1 - 0.1, { faces: 'x' });
    gg.mat('grille', '#6a6460'); const zs = b.side < 0 ? z0 + 0.15 : z1 - 0.15; gg.box(cx - 0.4, y + 1.0, Math.min(zs, zs + b.side * -0.02), cx + 0.4, y + 1.6, Math.max(zs, zs + b.side * -0.02), { faces: b.side < 0 ? 'Z' : 'z' });
  }, 3);
  const cz = b.side < 0 ? z0 + 1.3 : z1 - 1.3;
  prop(s, 'chair', cx, y, cz, b.side < 0 ? PI : 0, { wood: '#5a3a24', seat: FELTS[(i * 3) % FELTS.length], back: 'hoop' }, { level: 3, noSpots: true });
  s.furniture((gg) => {
    const lx = b.x1 - 0.45, lz = cz;
    gg.mat('cast', '#2a2622'); gg.cyl(lx, y, lz, 0.14, 0.02, { segs: 10 }); gg.tube([[lx, y, lz], [lx, y + 1.25, lz]], 0.012, { segs: 5 });
    gg.mat('paper', '#f2c37a', { emissive: i % 3 === 0 ? 2.0 : 0.25, lamp: true }); gg.lathe(lx, lz, [[0.16, y + 1.18], [0.09, y + 1.42]], { segs: 12 });
  }, 3);
  if (i % 3 === 0) s.light({ at: [b.x1 - 0.45, y + 1.3, cz], color: [1, 0.72, 0.42], power: 1.4, range: 3.2, radius: 0.1, lamp: true, clip: [b.x0, y, z0, b.x1, y + H, z1] });
  sign(s, { kind: 'label', text: String(i + 1), palette: ['#1e3236', '#d9a64a'] }, b.x0 + 0.68, y + 2.25, zf + (b.side < 0 ? 0.07 : -0.07), { face: b.side < 0 ? 'Z' : 'z', w: 0.22, h: 0.16, level: 3 });
  if (i % 4 === 1) s.spot('sit', cx, y + 0.46, cz, b.side < 0 ? PI : 0, { tags: ['listen'] });
  void g; void r;
}

// The booth of the old air: at the anti end of the corridor, a lock and then the booth. Sealed; the archivist takes you in.
function oldAir(game, s, f, y) {
  const X0 = -15, XL = -11.8, XO = -10.6, H = BACK.h, zc = (CZ0 + CZ1) / 2;
  const wo = { tint: '#d8d2c0', mat: 'panel', t: 0.3, level: 3, skirt: '#3a3430' };
  // the outer face of the lock: a heavy door with a round window and a wheel; gauges; the rules
  wall(s, XO, 1.4, XO, CZ0, y, H, wo); wall(s, XO, CZ1, XO, 9.4, y, H, wo);
  wall(s, XO, CZ0, XO, CZ1, y, H, Object.assign({}, wo, { openings: [{ at: 0.6, w: 1.2, h: 2.1 }] }));
  wall(s, X0, 1.4, XO, 1.4, y, H, wo); wall(s, X0, 9.4, XO, 9.4, y, H, wo);
  s.structure((gg) => {
    gg.mat('panel', '#5a6a62', { rough: -0.1 }); gg.box(XO - 0.1, y, CZ0 + 0.6, XO + 0.12, y + 2.1, CZ0 + 1.8, { bevel: 0.02 });
    gg.mat('cast', '#2a2c2c'); gg.box(XO + 0.12, y + 1.4, CZ0 + 0.95, XO + 0.14, y + 1.8, CZ0 + 1.45, { faces: 'X' });
    gg.mat('cast', C.brass, { rough: -0.25 });
    gg.push(); gg.move(XO + 0.16, y + 1.05, CZ0 + 1.2); gg.rotZ(PI / 2);
    gg.lathe(0, 0, [[0.22, -0.02], [0.24, 0], [0.22, 0.02]], { segs: 18 }); gg.tube([[0, 0, -0.22], [0, 0, 0.22]], 0.015, { segs: 5 }); gg.tube([[-0.22, 0, 0], [0.22, 0, 0]], 0.015, { segs: 5 });
    gg.pop();
    gg.box(XO + 0.1, y + 1.95, CZ0 + 0.6, XO + 0.14, y + 2.12, CZ0 + 1.8, { faces: 'XY' });
  }, 3);
  s.glass(XO + 0.13, y + 1.42, CZ0 + 0.97, XO + 0.13, y + 1.78, CZ0 + 1.43, { tint: '#ffe8c0', opacity: 0.3, level: 3 });
  s.solid(XO - 0.1, y, CZ0 + 0.6, XO + 0.12, y + 2.1, CZ0 + 1.8);
  // inside, lit warm: the light comes out of the round window
  s.light({ at: [-13.4, y + 2.1, zc], color: [1, 0.74, 0.46], power: 2.2, range: 4.2, radius: 0.15, lamp: true, clip: [X0, y, 1.4, XO + 1.6, y + H, 9.4] });
  s.structure((gg) => { gg.mat('felt', '#6a3a2a'); gg.box(X0 + 0.2, y + 0.1, 2.4, XL - 0.2, y + H - 0.1, 2.45, { faces: 'Z' }); gg.box(X0 + 0.2, y + 0.1, 8.35, XL - 0.2, y + H - 0.1, 8.4, { faces: 'z' }); gg.box(XL - 0.25, y, 2.4, XL - 0.15, y + H, 8.4, { faces: 'xX' }); }, 3);
  prop(s, 'chair', -13.6, y, zc, PI / 2, { wood: '#5a3a24', seat: '#b9552e', back: 'hoop' }, { level: 3, noSpots: true });
  // the gauges by the door: OXYGEN 21 · NITROGEN 78 · in the booth; the clock, ten minutes
  s.deco((gg) => {
    gg.mat('wood', '#3a2a20'); gg.box(XO + 0.12, y + 1.0, CZ1 + 0.2, XO + 0.16, y + 2.0, CZ1 + 1.4, { bevel: 0.01 });
    gg.mat('diffuser', '#f1e6c9', { emissive: 1.0, lamp: true }); for (const [yy, zz] of [[1.65, CZ1 + 0.5], [1.65, CZ1 + 1.1], [1.25, CZ1 + 0.8]]) { gg.push(); gg.move(XO + 0.17, y + yy, zz); gg.rotZ(-PI / 2); gg.cyl(0, 0, 0, 0.13, 0.01, { segs: 16 }); gg.pop(); }
    gg.mat('cast', '#3a5a6a'); gg.tube([[XO + 0.2, y + 2.4, CZ1 + 1.6], [XO + 0.2, y + 2.4, 9.2], [XO + 0.2, y + 0.4, 9.2]], 0.05, { segs: 8 });
  }, 3);
  sign(s, { kind: 'notice', title: 'The old air', lines: ['One at a time. Ten minutes.', 'The door shuts behind you;', 'the lock flushes both ways.', 'Children with a grown-up.', 'Ask at the desk.', 'Nothing gets out.'] }, XO + 0.15, y + 1.55, CZ0 - 0.55, { face: 'X', w: 0.62, h: 0.7, level: 3 });
  sign(s, { kind: 'plate', text: 'THE OLD AIR', sub: 'oxygen 21 · nitrogen 78 · as it was', palette: ['#3a2a20', '#f1e6c9'] }, XO + 0.15, y + 2.4, zc, { face: 'X', w: 1.0, h: 0.26, level: 3 });
  s.spot('stand', XO + 0.9, y, CZ0 + 0.4, -PI / 2, { tags: ['wait'] });
  s.interact({ x: XO + 0.6, y: y + 1.3, z: zc, radius: 1.5, prompt: 'Go into the booth of the old air', onUse: async (gm) => {
    const first = !(gm.flags && gm.flags['fo-oldair']);
    if (first) await say(gm, 'Ama, the archivist', [
      '"The booth of the old air. Air as it was on old Earth: the same oxygen as out here, and nitrogen where we have helium. It weighs three times as much: 1.2 kilograms a cubic metre, against our 0.4."',
      '"The rules are on the door. One at a time, ten minutes, and I keep the clock. The door shuts behind you and the lock flushes before the inner door opens, and again before you come out."',
      '"There are three and a half kilograms of nitrogen in there: more than in two people. Every gram that got into the drum\'s air would have to be caught and fixed again, at about ten kays a kilogram, so none gets out. That is the whole reason for the lock and the clock."',
      '"Anyone may go in. Children with a grown-up. People come from all over Chervil to hear what their great-grandparents\' recordings were meant to sound like."',
    ]);
    const go = await choose(gm, 'The booth of the old air', 'Ama has the door open and her hand on the clock.', [{ label: 'Go in', sub: 'ten minutes, the door shut behind you', value: 'y' }, { label: 'Not now', value: 'n' }]);
    if (go !== 'y') return;
    if (gm.flags) gm.flags['fo-oldair'] = (gm.flags['fo-oldair'] || 0) + 1;
    const ui = gm.ui, au = gm.audio;
    if (au) sfx(gm, 'hatch', f, XO, y + 1.2, zc);
    if (ui && ui.fade) await ui.fade(true, 0.5);
    if (gm.player && gm.player.sit) { gm.player.sit({ x: -13.6, y, z: zc, yaw: PI / 2, eye: 1.12 }); gm.player.yaw = PI / 2; gm.player.pitch = 0; }
    if (au) { au.reverb('none'); au.ambience('none', { fade: 0.4 }); }
    if (ui && ui.fade) await ui.fade(false, 0.7);
    await say(gm, 'The booth of the old air', [
      'The inner door closes with a soft, heavy sound, and the room goes still. It is warm and close in here: nitrogen does not pull the heat off your skin the way helium does, and the drum runs warm to make up for helium.',
      'A card on the wall, at the height of your eyes, says: SAY SOMETHING.',
    ]);
    if (au && au.voice) { const syl = 'helloisthisitreallyme'; for (let k = 0; k < syl.length; k++) setTimeout(() => { try { au.voice({ pitch: 0.8, speed: 0.9, timbre: 'low' }, syl[k]); } catch (e) { /* optional */ } }, 120 * k); }
    await say(gm, 'The booth of the old air', [
      'Your voice comes out lower, or seems to. The note is the same, but the bright edge has gone off it, as if you were talking through a blanket. Every old recording in the Larder sounds like this. This is the air they were made in.',
      'Through the round window Ama holds up eight fingers, then nine, then ten.',
    ]);
    if (ui && ui.fade) await ui.fade(true, 0.5);
    if (gm.player && gm.player.stand) gm.player.stand();
    if (au) { const z = gm.zone; au.reverb((z && z.reverb) || 'felt'); au.ambience((z && z.ambience) || 'quiet', { fade: 0.6 }); sfx(gm, 'hatch', f, XO, y + 1.2, zc); }
    if (ui && ui.fade) await ui.fade(false, 0.6);
    toast(gm, 'Out in the corridor your voice is your own again, thin and bright. For a minute it sounds like somebody else\'s.');
  } });
}
