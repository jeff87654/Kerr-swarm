// Station Ring 9, the rooms along the platform's back wall: the noodle counter (open all night), the night porter's
// desk, the back crews' room, the ring counter's hatch, the Ledger, and the alcove of sleeping benches with the lost
// glove board. Frame 'ring-nine'; the platform's back wall stands at z = 12.
import { floor, ceiling, wall, lamp, roomGlow, warm } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { signK, movable, PAL } from './station_parts.js';
import { painted, drawChalk } from './ledger_parts.js';
import { Rng, hashStr, smoothstep } from '../core/util.js';
import { PI, say, toast, sfx, found, hour, makeVault, ringLedger, seatOnBench, seatAt } from './lm_ring_parts.js';

export const R9 = { XE: 156, ZN: -12.6, ZS: 12, ZE: 5.5, SPRING: 6.5, CROWN: 11 };
R9.V = makeVault(R9.ZN, R9.ZS, R9.SPRING, R9.CROWN);
R9.bays = [-132, -108, -84, -60, -36, -12, 12, 36, 60, 84, 108, 132];
R9.loops = [-12, 36];
export const PAL9 = { green: '#2d4a3c', greenDark: '#1c3028', blood: '#7b2b25', cream: '#e6dcc4', vault: '#cbbd9c', brass: '#b08a45', yellow: '#d9a53a', lamp: '#ffcf8a', red: '#c0392b' };
const ZS = R9.ZS;
// is it the late hours? (the ring counter shuts at midnight; the noodle counter never does)
export function late(game) { const h = hour(game); return h < 5; }
const night = (game) => { const h = hour(game); return h >= 23 || h < 5; };

export function buildRooms(s, game, f) {
  noodles(s, game, f);
  porter(s, game, f);
  crewRoom(s, game, f);
  ringCounter(s, game, f);
  ledger(s, game);
  sleepers(s, game, f);
}

// ---------------------------------------------------------------------------------------------------------------
// the noodle counter: a kitchen behind the wall at x[-6, 6], its counter out on the platform under a canopy
// ---------------------------------------------------------------------------------------------------------------
const COOK = { name: 'Inge, at the noodle counter', colour: '#d9a53a' };
function noodles(s, game, f) {
  const g = s.g, P = PAL9, X0 = -6, X1 = 6, Z1 = 17.4, H = 3.2, ZC = 11.0;   // ZC: the counter's front
  const KC = [X0 - 0.1, -0.3, 9.4, X1 + 0.1, H + 0.1, Z1 + 0.1];
  // the kitchen
  floor(s, X0, ZS, X1, Z1, 0, 'tile', '#b9ad96');
  ceiling(s, X0, ZS, X1, Z1, H, 'paint', '#d9cdb2');
  const WK = { t: 0.24, mat: 'tile', tint: '#ece3cc', dado: { h: 1.2, mat: 'tile', tint: P.green }, skirt: '#1c1a17' };
  wall(s, X0 + 0.12, ZS, X0 + 0.12, Z1, 0, H, WK); wall(s, X1 - 0.12, ZS, X1 - 0.12, Z1, 0, H, WK); wall(s, X0, Z1 - 0.12, X1, Z1 - 0.12, 0, H, WK);
  // the range along the back: a steel bench with the stockpots held on the loop, a pulling board, shelves of bowls
  s.furniture(() => {
    g.mat('brushed', '#9ea3a3'); g.box(X0 + 0.3, 0, Z1 - 1.0, X1 - 0.3, 0.9, Z1 - 0.25, { bevel: 0.01 });
    g.mat('brushed', '#b8bcbc', { rough: -0.2 }); g.box(X0 + 0.28, 0.9, Z1 - 1.02, X1 - 0.28, 0.94, Z1 - 0.22);
    g.mat('wood', '#b08a5a'); g.box(-1.4, 0.94, Z1 - 0.95, 1.4, 0.99, Z1 - 0.35, { bevel: 0.01 });
    g.mat('wood', '#6b4a2f'); for (const yy of [1.7, 2.15, 2.6]) g.box(X0 + 0.3, yy, Z1 - 0.42, X1 - 0.3, yy + 0.03, Z1 - 0.15);
    // the hood over the pots
    g.mat('brushed', '#8d9292'); g.box(-5.4, 2.55, Z1 - 1.25, -1.8, 2.75, Z1 - 0.15, { bevel: 0.02 }); g.box(1.8, 2.55, Z1 - 1.25, 5.4, 2.75, Z1 - 0.15, { bevel: 0.02 });
    g.mat('grille', '#6d6f6c'); g.box(-5.3, 2.54, Z1 - 1.2, -1.9, 2.55, Z1 - 0.2, { faces: 'y' }); g.box(1.9, 2.54, Z1 - 1.2, 5.3, 2.55, Z1 - 0.2, { faces: 'y' });
  });
  s.solid(X0 + 0.3, 0, Z1 - 1.02, X1 - 0.3, 0.94, Z1 - 0.22);
  for (const x of [-4.8, -3.8, -2.7, 2.8, 3.9, 5.0]) prop(s, 'lmring.pot', x, 0.94, Z1 - 0.6, 0, { r: x > 0 && x < 3 ? 0.22 : 0.28, h: 0.4 });
  prop(s, 'station.cupRack', -0.2, 0, Z1 - 1.25, PI, {});
  const r = new Rng(hashStr('ring9bowls'));
  s.detail(() => {
    for (const yy of [1.73, 2.18, 2.63]) for (let x = X0 + 0.5; x < X1 - 0.5; x += 0.24) {
      if (r.chance(0.15)) continue;
      g.mat('glaze', r.pick(['#e7dfcf', '#2f6f73', '#c9552e', '#e7dfcf', '#3b4a7a']), { rough: -0.2 });
      g.lathe(x, Z1 - 0.28, [[0, yy], [0.05, yy], [0.09, yy + 0.06], [0.1, yy + 0.09]], { segs: 10 });
      g.mat('cast', '#b08a45'); g.lathe(x, Z1 - 0.28, [[0.1, yy + 0.09], [0.06, yy + 0.12], [0.015, yy + 0.13], [0, yy + 0.135]], { segs: 10 });
    }
    // a skein of pulled noodles over the board, and flour
    g.mat('paint', '#f2e7c4'); for (let k = 0; k < 9; k++) g.tube([[-1.1, 1.0, Z1 - 0.55 + k * 0.012], [0, 1.03, Z1 - 0.6 + k * 0.01], [1.1, 1.0, Z1 - 0.55 + k * 0.012]], 0.006, { segs: 3 });
    g.mat('plain', '#f6f0e2'); g.box(-0.9, 0.99, Z1 - 0.8, -0.3, 0.992, Z1 - 0.5, { faces: 'Y' });
  });
  // the counter: a long red-tiled front, a deep wooden top, out on the platform; the wall opening behind it
  s.furniture(() => {
    g.mat('tile', P.blood); g.box(X0 + 0.2, 0, ZC, X1 - 0.2, 0.98, ZC + 0.62, { bevel: 0.01 });
    g.mat('wood', '#4a2f20', { rough: -0.1 }); g.box(X0 + 0.1, 0.98, ZC - 0.25, X1 - 0.1, 1.05, ZC + 0.7, { bevel: 0.02 });
    g.mat('cast', P.brass, { rough: -0.2 }); g.box(X0 + 0.1, 0.18, ZC - 0.33, X1 - 0.1, 0.22, ZC - 0.29); for (let x = X0 + 0.6; x < X1 - 0.3; x += 1.2) g.box(x - 0.02, 0, ZC - 0.33, x + 0.02, 0.22, ZC - 0.05);
    g.mat('stone', '#cfc2a4'); g.box(X0 + 0.2, 0.9, ZC + 0.62, X1 - 0.2, 0.95, ZS + 0.3);
    g.mat('tile', '#d8cbb0'); g.box(X0 + 0.2, 0, ZC + 0.62, X1 - 0.2, 0.9, ZC + 0.66, { faces: 'Z' });
  });
  s.solid(X0 + 0.1, 0, ZC - 0.25, X1 - 0.1, 1.05, ZC + 0.7); s.solid(X0 + 0.2, 0, ZC + 0.62, X1 - 0.2, 0.95, ZS + 0.3);
  // the canopy over the counter, its fascia, its lanterns
  s.structure(() => {
    g.mat('panel', P.green); g.box(X0 - 0.2, 2.9, ZC - 1.1, X1 + 0.2, 3.1, ZS, { bevel: 0.03 });
    g.mat('cast', P.brass, { rough: -0.15 }); g.box(X0 - 0.25, 2.88, ZC - 1.16, X1 + 0.25, 2.93, ZC - 1.08);
    g.mat('panel', P.greenDark); for (const x of [X0 - 0.1, X1 + 0.1]) g.tube([[x, 3.0, ZC - 1.0], [x, 3.6, ZS - 0.4]], 0.03, { segs: 5 });
    g.mat('panel', P.blood); g.box(X0 - 0.2, 3.1, ZC - 1.12, X1 + 0.2, 3.65, ZC - 0.92, { bevel: 0.02 });
  });
  signK(s, { kind: 'fascia', text: 'NOODLES', sub: 'all night · under a lid · pulled at ten, at two and at six', palette: [P.blood, '#fff1d0', P.yellow] }, 0, 3.38, ZC - 1.13, { face: 'z', w: 5.2, h: 0.5, glow: 2.2, lamp: false, k: 1.6 });
  // two blade signs standing out from the wall at the counter's ends, so it can be seen all along the platform
  for (const bx of [X0 - 0.45, X1 + 0.45]) {
    s.structure(() => { g.mat('cast', P.brass); g.box(bx - 0.06, 3.3, 10.75, bx + 0.06, 5.9, 11.7, { bevel: 0.02 }); g.mat('cast', '#2a2d2e'); g.tube([[bx, 5.9, 11.2], [bx, 6.2, ZS - 0.3]], 0.02, { segs: 4 }); g.tube([[bx, 5.9, 10.8], [bx, 6.4, ZS - 0.3]], 0.015, { segs: 4 }); });
    for (const fc of ['x', 'X']) painted(s, 'ring9.blade', 0.86, 2.5, 110, drawBlade(), bx + (fc === 'X' ? 0.065 : -0.065), 4.6, 11.22, { face: fc, glow: 2.4 });
  }
  s.light({ at: [X0 - 0.45, 4.6, 11.2], color: '#ff9a5a', power: 2.0, range: 5, clip: [X0 - 6, -0.3, 6, X0 + 1, 7, ZS], radius: 0.5 });
  s.light({ at: [X1 + 0.45, 4.6, 11.2], color: '#ff9a5a', power: 2.0, range: 5, clip: [X1 - 1, -0.3, 6, X1 + 6, 7, ZS], radius: 0.5 });
  for (const x of [-4.5, -1.5, 1.5, 4.5]) lamp(s, 'lantern', x, 2.45, ZC - 0.6, { tint: x === -1.5 || x === 4.5 ? '#e8743b' : '#f2c879', clip: KC, power: 0.9, lampFlag: false, drop: 0.35, r: 0.18 });
  s.light({ at: [-3, 2.7, ZC - 0.2], color: warm(2700), power: 20, range: 10, type: 'tube', to: [3, 2.7, ZC - 0.2], clip: [X0 - 3, -0.3, ZC - 4.5, X1 + 3, 3.2, ZS], shadow: true, radius: 1.5 });
  s.light({ at: [-4, 2.8, ZC - 0.5], to: [4, 2.8, ZC - 0.5], type: 'tube', color: warm(2600), power: 10, range: 8, clip: [X0 - 4, -0.3, ZC - 6, X1 + 4, 3.2, ZS + 0.5], shadow: true, radius: 0.4 });
  lamp(s, 'panel', -3, H, Z1 - 2.2, { w: 1.6, d: 0.5, clip: KC, K: 3600, power: 1.2, lampFlag: false });
  lamp(s, 'panel', 3, H, Z1 - 2.2, { w: 1.6, d: 0.5, clip: KC, K: 3600, power: 1.2, lampFlag: false });
  s.ambient({ box: [X0 - 4, -0.3, ZC - 5, X1 + 4, 3.4, Z1], sky: '#ffcf8a', ground: '#a0583a', power: 0.35 });
  // steam: soft light over the pots, a glow above the counter
  for (const x of [-4.3, -3.2, 3.3, 4.4]) s.glowCard(x, 1.75, Z1 - 0.6, { face: 'z', color: '#ffe2b8', size: 1.3, strength: 0.16, follow: 'always' });
  s.glowCard(0, 2.0, ZC - 0.2, { face: 'z', color: '#ffc77a', size: 7, strength: 0.07, follow: 'always' });
  // the lidded bowls along the counter, chopsticks in a pot, a jar of chilli oil, the slate
  const bowls = [-4.6, -3.0, -1.4, 0.4, 2.0, 3.6];
  for (const x of bowls) prop(s, 'bowl', x, 1.05, ZC + 0.05, r.f(-0.4, 0.4), { glaze: r.pick(['#e7dfcf', '#2f6f73', '#c9552e']), lid: '#b08a45', r: 0.11 });
  for (const x of [-5.2, -0.5, 4.8]) { prop(s, 'crock', x, 1.05, ZC + 0.35, 0, { glaze: '#7a2a26', h: 0.16, r: 0.06 }); prop(s, 'cup', x + 0.25, 1.05, ZC + 0.4, 0, { glaze: '#e7dfcf' }); }
  painted(s, 'ring9.slate', 0.9, 1.05, 260, drawChalk({ title: 'Tonight', lines: ['Noodles in broth  0.96', 'With seared mycelium  1.38', 'Jook, ginger, spring onion  0.96', 'Long-pour tea  0.15', 'Pulled at ten, two and six'] }), X1 + 0.02, 1.85, ZC + 0.2, { face: 'X' });
  s.structure(() => { g.mat('wood', '#3a2a1e'); g.box(X1 - 0.03, 1.28, ZC - 0.32, X1 + 0.01, 2.42, ZC + 0.72); });
  // the stools
  const STOOL = ['#8a2f3c', '#2f6f73', '#c08a2e', '#8a2f3c', '#3b4a7a', '#6b8f4e', '#8a2f3c'];
  const sx0 = -4.8, pitch = 1.6;
  for (let i = 0; i < 7; i++) {
    const x = sx0 + i * pitch;
    prop(s, 'lmring.stool', x, 0, ZC - 0.75, 0, { seat: STOOL[i] });
    s.spot('sit', x, 0.79, ZC - 0.72, 0, { tags: ['eat', 'counter', 'night'] });
    seatAt(s, x, 0, ZC - 0.72, 0, 'Sit at the noodle counter', 0.77);
  }
  // the cook and the noodle-puller behind the counter; people waiting at its ends
  s.spot('stand', -0.2, 0, Z1 - 1.3, 0, { tags: ['pull-noodles'] }); s.spot('stand', 3.6, 0, Z1 - 1.35, 0, { tags: ['cook'] });
  s.spot('stand', -2.6, 0, ZS + 0.85, PI, { tags: ['serve'] }); s.spot('stand', 1.8, 0, ZS + 0.9, PI, { tags: ['serve'] }); s.spot('stand', -4.4, 0, ZS + 1.0, PI, { tags: ['cook'] });
  for (const q of [[X0 - 0.8, ZC - 0.5, PI / 2], [X0 - 1.2, ZC - 1.4, 1.2], [X1 + 0.9, ZC - 0.6, -PI / 2], [X1 + 1.3, ZC - 1.5, -1.0]]) s.spot('stand', q[0], 0, q[1], q[2], { tags: ['eat', 'wait'] });
  s.path([[-8, 8.8], [0, 9.0], [8, 8.8]], { width: 1.8 });
  s.zoneBox({ id: 'ring-nine-noodles', place: 'ring-nine', box: [X0 - 2, -0.5, ZC - 1.6, X1 + 2, H, Z1], name: 'The noodle counter', sub: 'Station Ring 9 · open all night', ambience: 'station', reverb: 'room', headroom: 2.9 });
  s.loop('kitchen', 0, 1.2, Z1 - 0.8, { vol: 0.32, radius: 14 }); s.loop('steam', -3.8, 1.5, Z1 - 0.6, { vol: 0.2, radius: 9 });
  // eating: buy a bowl, sit, lift the lid
  const MENU = [
    { id: 'noodles', name: 'Noodles in broth', desc: 'Pulled at ten, at two and at six, in a broth that has been on the loop since the cook before this one.', price: 0.96 },
    { id: 'mycelium', name: 'Noodles with seared mycelium', desc: 'The same bowl with a strip of mycelium steak seared on the one hotplate that costs anything.', price: 1.38 },
    { id: 'jook', name: 'Jook with ginger and spring onion', desc: 'Rice porridge, slow on the loop all day. What the back crews eat at three in the morning.', price: 0.96 },
    { id: 'tea', name: 'Long-pour tea', desc: 'Poured from a height into a lidded cup.', price: 0.15 },
  ];
  s.interact({ x: 0, y: 1.2, z: ZC - 0.5, radius: 2.4, wide: true, kind: 'talk', prompt: 'Order at the noodle counter', onUse: async (gm) => {
    if (!gm.ui || !gm.ui.menu) return;
    gm.busy++;
    let id = null; try { id = await gm.ui.menu({ kicker: 'Station Ring 9', title: 'The noodle counter', note: 'Open all night. Lift the lid when it reaches you.', items: MENU, wallet: gm.wallet ? gm.wallet.kwh : 0 }); } finally { gm.busy--; }
    const it = MENU.find((q) => q.id === id); if (!it) return;
    if (!(gm.wallet && gm.wallet.spend(it.price, it.name))) return;
    sfx(gm, 'ladle', f, 0, 1.1, ZC + 0.4);
    const h = hour(gm), lateHour = h >= 23 || h < 5;
    const lines = it.id === 'tea' ? ['The tea comes down from a foot above the cup in one long brown rope, and the lid goes on before it can cool.']
      : [it.id === 'jook' ? 'A deep bowl of jook, its lid beaded on the inside. Under it: ginger in threads, spring onion, a spoon of chilli oil if you want it.' : 'The bowl comes over the counter with its lid on. Lift it and the steam stands up in the heliox and goes in a second: noodles, broth, a soft egg from the Vats, spring onion.',
        lateHour ? 'At this hour you eat beside the back crews in their coats. Nobody talks much. Somebody slides the chilli oil along to you without being asked.' : 'By day the counter is quiet: a cleaner on her break, a pair going to Sorrel for the evening. It is after midnight that it fills.'];
    await say(gm, COOK, lines);
    found(gm, 'waste-heat');
  } });
  s.interact({ x: X1 + 0.3, y: 1.8, z: ZC + 0.2, radius: 1.4, prompt: 'Read the slate', onUse: (gm) => say(gm, 'The slate', ['Noodles in broth 0.96. With seared mycelium 1.38. Jook 0.96. Long-pour tea 0.15.', 'Pulled at ten, at two and at six. Under it, in another hand: "the only thing open in Chervil after one. Be nice to Inge."']) });
}

// ---------------------------------------------------------------------------------------------------------------
// the night porter's desk: a niche at x[-25.6, -21.4], glazed above its counter, a lamp that stays on
// ---------------------------------------------------------------------------------------------------------------
function porter(s, game, f) {
  const g = s.g, P = PAL9, X0 = -25.6, X1 = -21.4, Z1 = 15.6, H = 2.8, LC = [X0 - 0.1, -0.3, ZS - 1.5, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, ZS, X1, Z1, 0, 'planks', '#7a5a3a'); ceiling(s, X0, ZS, X1, Z1, H, 'paint', '#d9cdb2');
  const WP = { t: 0.2, mat: 'panel', tint: '#d6c7a4', dado: { h: 1.0, mat: 'planks', tint: '#5b3e28' }, skirt: '#1c1a17' };
  wall(s, X0 + 0.1, ZS, X0 + 0.1, Z1, 0, H, WP); wall(s, X1 - 0.1, ZS, X1 - 0.1, Z1, 0, H, WP); wall(s, X0, Z1 - 0.1, X1, Z1 - 0.1, 0, H, WP);
  s.furniture(() => {
    g.mat('wood', '#4a3020'); g.box(X0 + 0.2, 0, ZS + 0.1, X1 - 0.2, 1.05, ZS + 0.6, { bevel: 0.02 });
    g.mat('wood', '#6b4a2f'); g.box(X0 + 0.15, 1.05, ZS - 0.05, X1 - 0.15, 1.1, ZS + 0.65, { bevel: 0.012 });
    g.mat('cast', P.brass); g.box(X0 + 0.2, 1.1, ZS + 0.05, X1 - 0.2, 2.6, ZS + 0.09, { faces: 'zZ' });
    g.mat('wood', '#3a2a1e'); g.box(X0 + 0.3, 0.72, Z1 - 0.7, X1 - 0.3, 0.76, Z1 - 0.15, { bevel: 0.01 });
  });
  s.solid(X0 + 0.15, 0, ZS - 0.05, X1 - 0.15, 1.1, ZS + 0.65);
  s.glass(X0 + 0.25, 1.1, ZS + 0.07, -23.6, 2.55, ZS + 0.07, { tint: '#e2ecdf', opacity: 0.1 });
  s.glass(-23.3, 1.1, ZS + 0.07, X1 - 0.25, 2.55, ZS + 0.07, { tint: '#e2ecdf', opacity: 0.1 });
  prop(s, 'station.keyBoard', -23.5, 1.2, Z1 - 0.12, 0, { rows: 4, cols: 6 });
  prop(s, 'station.deskLamp', -24.6, 1.1, ZS + 0.35, 0.6, {}); prop(s, 'station.openBook', -23.2, 1.1, ZS + 0.3, -0.2, {});
  prop(s, 'chair', -23.5, 0, ZS + 1.4, PI, { wood: '#5b3e28', seat: '#8a2f3c', back: 'slat' });
  prop(s, 'cup', -22.2, 1.1, ZS + 0.35, 0, { glaze: '#2f6f73' }); prop(s, 'crock', -25.1, 0.76, Z1 - 0.4, 0, { glaze: '#c08a2e', h: 0.2, r: 0.08 });
  lamp(s, 'globe', -23.5, 2.2, ZS + 1.2, { clip: LC, K: 2600, power: 0.9, drop: 0.6, lampFlag: false });
  s.light({ at: [-24.6, 1.5, ZS + 0.3], color: warm(2500), power: 2.5, range: 4, clip: [X0 - 1.5, -0.3, ZS - 2.5, X1 + 1.5, 3, Z1], radius: 0.1 });
  signK(s, { kind: 'plate', text: 'NIGHT PORTER', sub: 'knock on the glass · kettle on' }, -23.5, 2.85, ZS - 0.32, { face: 'z', w: 1.4, h: 0.36, glow: 0.6, lamp: false, k: 2.5 });
  s.spot('stand', -23.5, 0, ZS + 1.2, PI, { tags: ['porter', 'write'] });
  s.zoneBox({ id: 'ring-nine-porter', place: 'ring-nine', box: [X0 - 1, -0.5, ZS - 1.6, X1 + 1, H, Z1], name: 'The night porter', sub: 'Station Ring 9', ambience: 'station', reverb: 'room', headroom: H });
  const P1 = { name: 'Tobiah, the night porter', colour: '#8fb3c8' };
  s.interact({ x: -23.5, y: 1.3, z: ZS - 0.4, radius: 1.6, kind: 'talk', prompt: 'Knock on the porter\'s glass', onUse: async (gm) => {
    const h = hour(gm);
    let lines;
    if (h >= 1 && h < 5) lines = ['Last car\'s gone, at one. First is at five, freight in between, and the freight does not take passengers however nicely you ask.', 'The benches along there are for exactly this. I\'ll wake you at half four. Inge does a bowl of jook for the first car that is better than it needs to be.'];
    else if (h >= 23 || h < 1) lines = ['Last car to Sorrel is at one, from platform six. After that it is the bench or a cab home.', 'The back crews come through at twenty to four. You\'ll hear them before you see them: they talk loud for an hour after a shift on the axle.'];
    else lines = ['I\'m only on till six in the morning, officially. The day porter keeps the desk warm and the kettle cold.', 'Ring Nine is the back of the drum, 417 metres from Ring Eight and a short cab ride from the back wall. Quiet by day. Ask anyone what it\'s like after midnight.'];
    await say(gm, P1, lines);
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// the crew room: where the back crews hang their coats and their ear defenders, x[-19.4, -8.4] z[12, 21.6]
// ---------------------------------------------------------------------------------------------------------------
function crewRoom(s, game, f) {
  const g = s.g, P = PAL9, X0 = -19.4, X1 = -8.4, Z1 = 21.6, H = 3.0, LC = [X0 - 0.1, -0.3, ZS - 0.2, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, ZS, X1, Z1, 0, 'speckle', '#4a4a44'); ceiling(s, X0, ZS, X1, Z1, H, 'panel', '#c9c0a8');
  const WC = { t: 0.24, mat: 'panel', tint: '#c8cdb8', dado: { h: 1.2, mat: 'panel', tint: P.green }, skirt: '#1c1a17' };
  wall(s, X0 + 0.12, ZS, X0 + 0.12, Z1, 0, H, WC); wall(s, X1 - 0.12, ZS, X1 - 0.12, Z1, 0, H, WC); wall(s, X0, Z1 - 0.12, X1, Z1 - 0.12, 0, H, WC);
  // pegs along the back wall: a coat on each, ear defenders on the hook beside it, boots under
  const CLOTH = ['#3a5a7a', '#5b4060', '#2f4a3a', '#6b7a3a', '#3a5a7a', '#8a2f3c', '#46506a', '#5a4a3a', '#3a5a7a', '#6b3a2a'];
  const MEND = ['#d6a640', '#b5532e', '#2f6f73', '#f2b56b', '#d6a640', '#7fe08a', '#c9962e', '#e8743b', '#86c7c0', '#d95d7a'];
  const MUFF = ['#d6a640', '#c0392b', '#d6a640', '#2f6f73', '#d6a640', '#e8743b', '#d6a640', '#86c7c0', '#c0392b', '#d6a640'];
  s.detail(() => { g.mat('wood', '#5b3e28'); g.box(X0 + 0.5, 1.88, Z1 - 0.3, X1 - 0.5, 1.98, Z1 - 0.24); g.mat('wood', '#4a3424'); g.box(X0 + 0.5, 0.0, Z1 - 0.7, X1 - 0.5, 0.36, Z1 - 0.26, { bevel: 0.02 }); });
  for (let i = 0; i < 10; i++) {
    const x = X0 + 0.95 + i * 0.98;
    if (i !== 6) prop(s, 'lmring.coat', x, 1.92, Z1 - 0.32, 0, { cloth: CLOTH[i], mend: MEND[i], lining: MEND[(i + 3) % 10] });
    prop(s, 'lmring.muffs', x + 0.4, 1.92, Z1 - 0.3, 0, { c: MUFF[i] });
    if (i % 3 !== 1) prop(s, 'crate', x, 0.36, Z1 - 0.5, 0, { w: 0.34, h: 0.22, d: 0.3, wood: '#2a2622' });
  }
  prop(s, 'platform.lockers', X1 - 1.1, 0, ZS + 2.4, -PI / 2, { c: '#4a6a5a' }); prop(s, 'platform.lockers', X1 - 1.1, 0, ZS + 4.4, -PI / 2, { c: '#5b6b5a' });
  // the long table and its benches, mugs, a kettle on the loop tap
  prop(s, 'table', -14.4, 0, 17.2, 0, { w: 4.2, d: 0.9, wood: '#6b4a2f', top: '#8a6a44', legs: 'trestle' });
  for (const z of [16.35, 18.05]) { prop(s, 'bench', -14.4, 0, z, z < 17 ? 0 : PI, { w: 3.8, back: false, wood: '#5b3e28' }); }
  for (let k = 0; k < 6; k++) prop(s, 'cup', -16.0 + k * 0.62, 0.74, 17.0 + (k % 2) * 0.35, k, { glaze: ['#c9552e', '#2f6f73', '#e7dfcf'][k % 3] });
  prop(s, 'bowl', -13.0, 0.74, 17.2, 0, { glaze: '#e7dfcf', lid: '#b08a45' });
  s.furniture(() => { g.mat('brushed', '#9ea3a3'); g.box(X0 + 0.3, 0, ZS + 0.9, X0 + 0.95, 0.92, ZS + 3.2, { bevel: 0.01 }); g.mat('cast', '#a8432e'); g.cyl(X0 + 0.55, 0.92, ZS + 1.5, 0.11, 0.24, { segs: 12 }); g.mat('cast', P.brass); g.tube([[X0 + 0.32, 1.4, ZS + 2.4], [X0 + 0.55, 1.4, ZS + 2.4], [X0 + 0.55, 1.25, ZS + 2.4]], 0.02, { segs: 5 }); });
  s.solid(X0 + 0.3, 0, ZS + 0.9, X0 + 0.95, 0.92, ZS + 3.2);
  // the shift board and the decibel card
  sign(s, { kind: 'chalk', title: 'Back crews', lines: ['Axle shifts change at 03:40,', '11:40 and 19:40', 'Ear defenders ON past the second door', 'Your own peg, your own name', 'Last car 01:00 · first 05:00'] }, X1 - 0.13, 1.7, 19.6, { face: 'x', w: 1.4, h: 1.05 });
  sign(s, { kind: 'notice', title: 'At the back axle', lines: ['The loudest place in the drum.', 'Heat leaves Chervil there,', 'a river of it, all day and night.', 'Wear them. Then wear them', 'again on the way back.'] }, X0 + 0.13, 1.7, 19.2, { face: 'X' });
  lamp(s, 'panel', -14.4, H, 17.2, { w: 2.4, d: 0.5, clip: LC, K: 3600, power: 0.75, lampFlag: false });
  lamp(s, 'panel', -14.4, H, 13.6, { w: 1.4, d: 0.5, clip: LC, K: 3600, power: 0.4, lampFlag: false });
  roomGlow(s, X0, 0, ZS, X1, H, Z1, { sky: '#e8eedc', ground: '#7a7a6a', power: 0.2 });
  // people
  for (const [x, z, a] of [[-15.6, 16.35, 0], [-14.0, 16.35, 0], [-13.0, 18.05, PI], [-15.2, 18.05, PI]]) s.spot('sit', x, 0.45, z, a, { tags: ['eat', 'crew'] });
  for (const q of [[-17.2, 20.4, 0], [-11.6, 20.5, 0.2]]) s.spot('work', q[0], 0, q[1], q[2], { tags: ['crew'] });
  for (const q of [[-11.2, 14.4, -2.4], [-12.0, 13.6, 0.7], [-10.6, 13.6, -0.7]]) s.spot('chat', q[0], 0, q[1], q[2], { tags: ['crew'] });
  s.path([[-14.4, 9.6], [-14.4, 12.8], [-14.4, 15.0], [-12.0, 15.0]], { width: 1.2 });
  s.zoneBox({ id: 'ring-nine-crew', place: 'ring-nine', box: [X0, -0.5, ZS, X1, H, Z1], name: 'The crew room', sub: 'Station Ring 9 · the back crews', ambience: 'flat', reverb: 'room', headroom: H });
  s.loop('air', -14, 2.8, 20, { vol: 0.2, radius: 8 });
  s.interact({ x: -14.4, y: 1.5, z: Z1 - 0.9, radius: 2.4, wide: true, prompt: 'Look at the ear defenders', onUse: async (gm) => {
    await say(gm, 'The crew room', ['A coat on every peg, each with its owner\'s name in the lining and an elbow mended in somebody\'s favourite colour. Beside each, on its own hook, a pair of ear defenders, the cups worn shiny.',
      'The back axle is the loudest place in the drum. All the heat Chervil makes leaves through it, about a river\'s worth, and the pumps that send it out never stop. The crews say you hear it in your teeth.',
      'One peg is empty. The ear defenders are still on their hook.']);
  } });
  s.interact({ x: X1 - 0.5, y: 1.6, z: 19.6, radius: 1.5, prompt: 'Read the shift board', onUse: (gm) => say(gm, 'Back crews', ['Axle shifts change at twenty to four, twenty to twelve and twenty to eight. Odd hours, so the crews never meet the commuters coming the other way.', 'Ear defenders on past the second door. Your own peg, your own name. Last car at one, first at five.']) });
}

// ---------------------------------------------------------------------------------------------------------------
// the ring counter: a small hatch at x[8.6, 12.6], free broth until midnight, then its shutter comes down
// ---------------------------------------------------------------------------------------------------------------
function ringCounter(s, game, f) {
  const g = s.g, P = PAL9, X0 = 8.2, X1 = 13.0, Z1 = 15.2, H = 2.8, LC = [X0 - 0.1, -0.3, ZS - 1.2, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, ZS, X1, Z1, 0, 'tile', '#c9bda4'); ceiling(s, X0, ZS, X1, Z1, H, 'paint', '#ddd2b8');
  const WT = { t: 0.2, mat: 'tile', tint: '#ece3cc', dado: { h: 1.0, mat: 'tile', tint: P.blood }, skirt: '#1c1a17' };
  wall(s, X0 + 0.1, ZS, X0 + 0.1, Z1, 0, H, WT); wall(s, X1 - 0.1, ZS, X1 - 0.1, Z1, 0, H, WT); wall(s, X0, Z1 - 0.1, X1, Z1 - 0.1, 0, H, WT);
  s.furniture(() => { g.mat('stone', '#cfc2a4'); g.box(8.9, 0.86, ZS - 0.35, 12.3, 0.95, ZS + 0.45, { bevel: 0.015 }); g.mat('tile', P.blood); g.box(8.95, 0, ZS - 0.3, 12.25, 0.86, ZS - 0.15, { faces: 'zxX' }); });
  s.solid(8.9, 0, ZS - 0.35, 12.3, 0.95, ZS + 0.45);
  prop(s, 'station.urnTrolley', 10.0, 0, Z1 - 0.8, PI, {}); prop(s, 'station.pot', 11.8, 0, Z1 - 0.7, 0, {});
  sign(s, { kind: 'fascia', text: 'RING COUNTER', sub: 'broth, a rice ball, a sprig · free off any car', palette: [P.green, '#f2ead6', P.yellow] }, 10.6, 2.62, ZS - 0.32, { face: 'z', w: 3.6, h: 0.45, glow: 0.7 });
  lamp(s, 'globe', 10.6, 2.0, ZS + 1.2, { clip: LC, K: 2800, power: 0.7, drop: 0.7 });
  // the shutter: rolls down at midnight, up at five
  const shutter = movable(s, (gg) => {
    gg.mat('flute', '#6d7268'); gg.box(8.7, 0.96, ZS - 0.44, 12.5, 1.96, ZS - 0.38);
    gg.mat('paint', P.yellow); gg.box(8.7, 0.98, ZS - 0.45, 12.5, 1.08, ZS - 0.44, { faces: 'z' });
    gg.mat('cast', '#3a3d3e'); gg.box(10.45, 1.12, ZS - 0.47, 10.75, 1.22, ZS - 0.44, { faces: 'z' });
  }, [0, 0, 0], { center: [10.6, 1.5, ZS - 0.4], radius: 2.6 });
  s.structure(() => { g.mat('panel', P.greenDark); g.box(8.6, 1.95, ZS - 0.55, 12.6, 2.3, ZS - 0.15, { bevel: 0.02 }); });
  let open = -1;
  s.every((dt, gm) => {
    const want = late(gm) ? 0 : 1;
    if (open < 0) open = want;
    open += Math.max(-dt * 0.5, Math.min(dt * 0.5, want - open));
    shutter.userData.origin[1] = 1.0 * open; shutter.userData.hidden = open > 0.98;
  });
  s.spot('counter', 10.6, 0, ZS + 1.0, PI, { tags: ['serve'] });
  for (const q of [[10.6, ZS - 1.0], [10.9, ZS - 1.8], [11.4, ZS - 2.5]]) s.spot('queue', q[0], 0, q[1], PI, { tags: ['wait', 'queue'] });
  s.zoneBox({ id: 'ring-nine-counter', place: 'ring-nine', box: [X0, -0.5, ZS - 1.4, X1, H, Z1], name: 'The ring counter', sub: 'Station Ring 9', ambience: 'station', reverb: 'tile', headroom: H });
  const SPRIGS = ['shiso', 'mint', 'dill', 'coriander', 'lovage', 'tarragon', 'chervil, for once'];
  s.interact({ x: 10.6, y: 1.2, z: ZS - 0.8, radius: 1.6, kind: 'talk', prompt: (gm) => (late(gm) ? 'The ring counter is shuttered' : 'Ask for a cup of broth'), onUse: async (gm) => {
    if (late(gm)) { toast(gm, 'Shuttered at midnight, open again at five. The noodle counter along the platform never shuts.'); return; }
    const d = gm.clock ? gm.clock.day : 1, sprig = SPRIGS[(d * 5 + 2) % SPRIGS.length];
    sfx(gm, 'pour', f, 10.6, 1.0, ZS);
    if (gm.ui) gm.ui.toast('A cup of Mill broth, a sticky rice ball and a sprig of ' + sprig + '. Free, as at every ring on the Row.', { kind: 'gain' });
    found(gm, 'counter-sprig');
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// the Ledger: an alcove x[17, 29] z[12, 19.5]
// ---------------------------------------------------------------------------------------------------------------
function ledger(s, game) {
  const g = s.g, X0 = 16.4, X1 = 29.6, Z1 = 19.6, H = 5.6, LC = [X0 - 0.1, -0.3, ZS - 1.5, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, ZS, X1, Z1, 0, 'hex', '#b5a382'); ceiling(s, X0, ZS, X1, Z1, H, 'paint', '#d0c2a2');
  const WL = { t: 0.24, mat: 'tile', tint: '#e2d6bc', dado: { h: 1.2, mat: 'tile', tint: PAL9.blood }, skirt: '#1c1a17' };
  wall(s, X0 + 0.12, ZS, X0 + 0.12, Z1, 0, H, WL); wall(s, X1 - 0.12, ZS, X1 - 0.12, Z1, 0, H, WL); wall(s, X0, Z1 - 0.12, X1, Z1 - 0.12, 0, H, WL);
  ringLedger(s, game, { x: 23, y: 2.95, z: Z1 - 0.24, face: 'z', w: 8.4, key: 'ring9', ring: 'STATION RING 9 · DECK 1', brass: PAL9.brass,
    tail: 'At Ring Nine the Ledger is mostly read by the back crews at four in the morning, who check the born line the way other people check the weather in old books.' });
  for (const x of [20.5, 25.5]) { prop(s, 'bench', x, 0, 14.6, PI, { w: 2.6, back: false, wood: '#5b3e28', metal: PAL9.greenDark }); seatOnBench(s, x, 14.6, PI, 2.6, 'b9l' + x, 'Sit and read the Ledger'); }
  for (const x of [19.5, 26.5]) s.light({ at: [x, H - 0.4, 15.2], color: warm(3000), power: 7, range: 8, type: 'spot', dir: [0, -0.45, 1], cone: [55, 30], clip: LC, radius: 0.2, lamp: true });
  roomGlow(s, X0, 0, ZS, X1, H, Z1, { sky: '#ffe0b8', ground: '#8a6a50', power: 0.14 });
  sign(s, { kind: 'fascia', text: 'THE LEDGER', sub: 'Chervil · as at every station ring', palette: [PAL9.blood, '#f2e6c8', PAL9.yellow] }, 23, 4.55, ZS - 0.32, { face: 'z', w: 4.6, h: 0.55, glow: 0.7 });
  for (const p of [[21.2, 16.8], [24.6, 17.0]]) s.spot('stand', p[0], 0, p[1], 0, { tags: ['board', 'read'] });
  s.path([[23, 9.6], [23, 15.6]], { width: 1.8 });
  s.zoneBox({ id: 'ring-nine-ledger', place: 'ring-nine', box: [X0, -0.5, ZS, X1, H, Z1], name: 'The Ledger', sub: 'Station Ring 9', ambience: 'station', reverb: 'hall', headroom: H });
}

// ---------------------------------------------------------------------------------------------------------------
// the sleeping benches, for the first car at five, and the lost glove board: an alcove x[32.4, 43.6] z[12, 17]
// ---------------------------------------------------------------------------------------------------------------
function sleepers(s, game, f) {
  const g = s.g, P = PAL9, X0 = 32.4, X1 = 43.6, Z1 = 17.2, H = 3.4, LC = [X0 - 0.1, -0.3, ZS - 0.5, X1 + 0.1, H + 0.1, Z1 + 0.1];
  floor(s, X0, ZS, X1, Z1, 0, 'planks', '#6b4a30'); ceiling(s, X0, ZS, X1, Z1, H, 'paint', '#c9bda0');
  const WS = { t: 0.24, mat: 'panel', tint: '#c9b896', dado: { h: 1.0, mat: 'felt', tint: '#3a4a3a' }, skirt: '#1c1a17' };
  wall(s, X0 + 0.12, ZS, X0 + 0.12, Z1, 0, H, WS); wall(s, X1 - 0.12, ZS, X1 - 0.12, Z1, 0, H, WS); wall(s, X0, Z1 - 0.12, X1, Z1 - 0.12, 0, H, WS);
  // felt overhead, so the platform's ring does not keep you awake
  s.structure(() => { g.mat('felt', '#5b3a3a'); for (let k = 0; k < 5; k++) g.sheet([X0 + 0.4, H - 0.05, ZS + 0.6 + k * 0.9], [X1 - 0.4, H - 0.05, ZS + 0.6 + k * 0.9], [X1 - 0.4, H - 0.05, ZS + 1.0 + k * 0.9], [X0 + 0.4, H - 0.05, ZS + 1.0 + k * 0.9], { sag: 0.25 }); });
  const beds = [[35.2, 15.8], [40.8, 15.8]];
  for (const [x, z] of beds) prop(s, 'lmring.sleeper', x, 0, z, 0, { w: 2.2, pad: x < 38 ? '#2f5d50' : '#6b3a4a' });
  prop(s, 'lmring.sleeper', 38.0, 0, 13.4, PI, { w: 2.0, pad: '#3b4a7a' });
  lamp(s, 'sconce', 38, 2.2, Z1 - 0.13, { face: 'z', clip: LC, K: 2400, power: 0.5, lampFlag: false });
  signK(s, { kind: 'plate', text: 'FOR THE FIRST CAR AT FIVE', sub: 'the porter wakes you at half four' }, 38, 2.85, Z1 - 0.13, { face: 'z', w: 1.8, h: 0.4, k: 2.5 });
  // the lost glove board, on the anti wall
  s.structure(() => { g.mat('wood', '#3a2a1e'); g.box(X0 + 0.13, 0.9, ZS + 0.8, X0 + 0.2, 2.5, ZS + 3.8, { bevel: 0.015 }); g.mat('felt', '#2f4a3a'); g.box(X0 + 0.2, 0.95, ZS + 0.85, X0 + 0.22, 2.45, ZS + 3.75, { faces: 'X' }); });
  const r = new Rng(hashStr('gloves9')), GC = ['#3b4a7a', '#c9552e', '#e7b547', '#2f6f73', '#8a2f3c', '#6b8f4e', '#d8cdb8', '#5b4060'];
  for (let i = 0; i < 17; i++) { const zz = ZS + 1.05 + (i % 6) * 0.48 + r.f(-0.05, 0.05), yy = 2.2 - Math.floor(i / 6) * 0.48 + r.f(-0.04, 0.04); prop(s, 'lmring.glove', X0 + 0.22, yy, zz, PI / 2 + r.f(-0.3, 0.3) * 0, { c: r.pick(GC), cuff: r.pick(GC) }); }
  signK(s, { kind: 'plate', text: 'LOST GLOVES', sub: 'one each · take yours, leave theirs' }, X0 + 0.23, 2.62, ZS + 2.3, { face: 'X', w: 1.3, h: 0.3, k: 2.5 });
  roomGlow(s, X0, 0, ZS, X1, H, Z1, { sky: '#e8c89a', ground: '#6a5040', power: 0.16 });
  s.zoneBox({ id: 'ring-nine-benches', box: [X0, -0.5, ZS, X1, H, Z1], name: 'The sleeping benches', sub: 'Station Ring 9 · for the first car at five', ambience: 'quiet', reverb: 'felt', headroom: H });
  s.path([[38, 9.6], [38, 14.4]], { width: 1.4 });
  s.interact({ x: X0 + 0.5, y: 1.7, z: ZS + 2.3, radius: 1.8, prompt: 'Look at the lost glove board', onUse: (gm) => say(gm, 'Lost gloves', ['Seventeen gloves pinned to green felt, every one of them a left or a right without its partner. Knitted, mostly, from plant fibre, and mended at the fingertips.',
    'Gloves are for the back axle\'s pipe runs and the cold tunnels to the quay, where the hull is near. A card says: one each, take yours, leave theirs. Under it someone has written: the blue one with the yellow cuff has been here nine years and we are fond of it now.']) });
  for (const [x, z] of beds.concat([[38.0, 13.4]])) s.interact({ x, y: 0.6, z, radius: 1.4, prompt: 'Lie down until the first car', onUse: async (gm) => {
    if (!gm.ui || !gm.clock || !gm.ui.pickHour) return;
    const h = gm.clock.hours; let to = null;
    gm.busy++;
    try { to = await gm.ui.pickHour({ title: 'Sleep on the bench until', from: h, to: h < 5 ? 5 : 29, now: h }); } finally { gm.busy--; }
    if (to === null || to === undefined || to <= h) return;
    if (gm.ui.fade) await gm.ui.fade(true, 0.4);
    gm.clock.skipTo(to % 24);
    if (gm.ui.fade) await gm.ui.fade(false, 0.6);
    toast(gm, to % 24 >= 4.4 && to % 24 <= 5.2 ? 'A hand on your shoulder: half four. The porter has put a cup of tea on the floor by your head.' : 'You wake stiff, with the felt\'s quiet in your ears and the platform ringing faintly beyond it.');
  } });
  void night; void P; void smoothstep; void PAL;
}

// the blade sign: NOODLES down a red enamel strip, a cream border, a bowl with its lid at the top
function drawBlade() {
  return (ctx, w, h) => {
    ctx.fillStyle = '#9e2a22'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f6e3b4'; ctx.lineWidth = w * 0.05; ctx.strokeRect(w * 0.07, w * 0.07, w * 0.86, h - w * 0.14);
    ctx.fillStyle = '#f6e3b4'; ctx.beginPath(); ctx.arc(w / 2, w * 0.62, w * 0.26, 0, Math.PI); ctx.fill(); ctx.fillRect(w * 0.22, w * 0.5, w * 0.56, w * 0.06); ctx.beginPath(); ctx.arc(w / 2, w * 0.48, w * 0.06, 0, 7); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 ' + Math.round(w * 0.42) + "px 'Barlow Condensed', sans-serif";
    const L = 'NOODLES'; for (let i = 0; i < L.length; i++) ctx.fillText(L[i], w / 2, w * 1.15 + i * (h - w * 1.5) / L.length);
  };
}
