// The Spice Rack and the Spouts: Chervil's climbing atrium and its slides, on the Low decks under Ring Six. Sport in a
// drum is the drum's physics made into games, and these two are the falling ones.
//   The Spice Rack (the climbing shaft, lm_chimney_rack.js): fourteen metres square and eight decks tall, with nine
//     routes of coloured holds, galleries at every deck, a bridge across the top and a mat whose target is laid anti.
//   The Spouts (the slide hall, lm_chimney_spouts.js): Sink, Float and True, down sixteen metres from a tower.
//   This file: the frame, the cab lobby where you arrive, and the counter between them: chalk and shoes on loan, the
//     changing room, the first-aid corner, the board of records and the rule about ropes.
// Frame `chimney`: deck 40 at y = 0, theta 1.5, z0 2290; x spinward, z toward the back cap, y up; deck 40 + k at y = 4k.
// The numbers are in lm_chimney_phys.js.
import { floor, ceiling, wall, lamp, roomGlow } from '../world/kit.js';
import { room, planter } from '../world/kit2.js';
import { prop, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { Rng, shadeHex } from '../core/util.js';
import { FOY, LOB, CORE, GO, SH, PAL, STOP, SUB, toast, sfx, say, read, seat, buy, frameWait } from './lm_chimney_parts.js';
import { buildRack } from './lm_chimney_rack.js';
import { buildSpouts } from './lm_chimney_spouts.js';
import { driftFrom, f2, MAT_TOP } from './lm_chimney_phys.js';

const PI = Math.PI;

export const place = {
  id: 'lm-chimney', name: 'The Spice Rack and the Spouts', order: 10,
  region: 'chimney',
  stops: [{ id: STOP, name: 'The Spice Rack and the Spouts', sub: 'the Low decks · deck 40 · Ring Six · climbing and slides', group: 'The Low decks', spawn: 'chimney', deck: 40, zd: 2290 }],
  async build(game) {
    const t0 = performance.now();
    const W = game.world;
    const f = W.frame('chimney', deckRadius(40), 1.5, 2290);
    const s = W.scope('chimney', f);
    foyer(game, s); await frameWait(game);
    lobby(game, s); await frameWait(game);
    await buildRack(game, s); await frameWait(game);
    await buildSpouts(game, s); await frameWait(game);
    while (s.finish(24)) await frameWait(game);
    game.spawns.chimney = { frame: f, x: LOB.x0 + 3.2, y: 0, z: 0, yaw: PI / 2 };
    console.log('[lm-chimney] built in ' + (performance.now() - t0).toFixed(0) + ' ms');
  },
};

// ---------------------------------------------------------------------------------------------------------------
// the cab lobby: four berths on its anti wall, and through its open side the counter and, past it, the Rack
// ---------------------------------------------------------------------------------------------------------------
function lobby(game, s) {
  const g = s.g, x0 = LOB.x0, x1 = LOB.x1, z0 = LOB.z0, z1 = LOB.z1, h = LOB.h;
  const clip = room(s, { x0, z0, x1, z1, y: 0, h, floor: ['terrazzo', '#b9ae98'], ceil: ['paint', '#e4dccb'], wall: { tint: '#d9cdb2', dado: { h: 1.1, mat: 'tile', tint: PAL.teal } }, open: { e: false }, glow: { sky: '#ffe2b8', ground: '#b9a27a', power: 0.3 } });
  // four berths in the anti wall: brass doors in stone frames, lit indicators, call plates
  const bw = 1.3, n = 4, gap = (z1 - z0 - n * bw) / (n + 1);
  for (let i = 0; i < n; i++) {
    const bz = z0 + gap * (i + 1) + bw * (i + 0.5), wx = x0 + 0.08;
    g.mat('stone', '#9c8f7c'); g.box(wx, 0, bz - bw / 2 - 0.2, wx + 0.18, 2.62, bz + bw / 2 + 0.2, { faces: 'XzZY', bevel: 0.01 });
    g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(wx + 0.18, 0.02, bz - bw / 2, wx + 0.22, 2.36, bz - 0.008); g.box(wx + 0.18, 0.02, bz + 0.008, wx + 0.22, 2.36, bz + bw / 2);
    g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(wx + 0.22, yy, bz - bw / 2 + 0.06, wx + 0.235, yy + 0.03, bz + bw / 2 - 0.06);
    g.mat('cast', '#c8a45a', { rough: -0.2 }); g.box(wx + 0.22, 0, bz - bw / 2 - 0.1, wx + 0.9, 0.008, bz + bw / 2 + 0.1, { faces: 'Y' });
    g.mat('diffuser', i === 2 ? '#3fe0d0' : '#ffd9a0', { emissive: i === 2 ? 3 : 2.2, lamp: true }); g.box(wx + 0.2, 2.46, bz - 0.22, wx + 0.22, 2.54, bz + 0.22);
    g.mat('cast', '#3a3430'); g.box(wx + 0.08, 1.02, bz + bw / 2 + 0.26, wx + 0.14, 1.3, bz + bw / 2 + 0.42, { bevel: 0.01 });
    g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.cyl(wx + 0.15, 1.14, bz + bw / 2 + 0.34, 0.032, 0.012, { segs: 8 });
    s.flush({ tier: 's' });
  }
  sign(s, { kind: 'street', text: 'Deck 40 · cabs', sub: 'the Spice Rack · the Spouts · ' + SUB, palette: ['#22302c', '#f1ead8'] }, x0 + 0.1, 2.95, 0, { face: 'X', w: 4.2, h: 0.42, glow: 1.2 });
  for (const zz of [-1.2, 1.4]) s.interact({ x: x0 + 0.9, y: 1.2, z: zz, radius: 1.8, prompt: 'Call a cab', onUse: (gm) => { sfx(gm, 'berth-door', s.frame, x0 + 0.3, 1.2, zz); if (gm.cab) gm.cab.open(STOP); } });
  lamp(s, 'panel', (x0 + x1) / 2, h - 0.02, 0, { w: 0.6, d: 4.5, K: 3300, power: 1.0, clip });
  prop(s, 'bench', (x0 + x1) / 2 + 0.6, 0, z1 - 0.45, PI, { w: 2.4, back: true, wood: PAL.wood });
  prop(s, 'plant', x1 - 0.5, 0, z0 + 0.5, 0, { kind: 'broad', size: 1.3, pot: PAL.teal });
  g.mat('rush', '#8a7a5a'); g.box(x0 + 0.5, 0.002, -2.2, x0 + 2.2, 0.014, 2.2, { faces: 'Y' }); s.flush({ tier: 'd', cast: false });
  sign(s, { kind: 'board', title: 'From deck 40', lines: ['Candlewick|about 3 min', 'Station Ring 2|about 4 min', 'The Hollow|about 4 min', 'Anywhere in Chervil|under 12 min', 'Cabs|free, as ever', 'The Rack and the Spouts|free'] }, (x0 + x1) / 2, 1.6, z0 + 0.1, { face: 'Z', w: 1.5, h: 1.05 });
  for (let i = 0; i < 3; i++) s.spot('stand', x0 + 1.4, 0, -1.8 + i * 1.6, PI / 2 + PI, { tags: ['wait'] });
  s.path([[x0 + 1.6, 0, 0], [x1 + 1, 0, 0]]);
  s.zoneBox({ id: 'chimney-lobby', box: [x0, -0.5, z0, x1, h, z1], name: 'Deck 40', sub: 'the lift lobby · ' + SUB, ambience: 'station', reverb: 'room' });
}

// ---------------------------------------------------------------------------------------------------------------
// the foyer between the cabs and the Rack: x[-26, -10], z[-10, 10]
// ---------------------------------------------------------------------------------------------------------------
function foyer(game, s) {
  const g = s.g, r = new Rng(40), h = FOY.h, x0 = FOY.x0, x1 = FOY.x1, z0 = FOY.z0, z1 = FOY.z1;
  const clip = [x0 - 0.1, -0.3, z0 - 0.1, x1 + 3.2, h + 0.1, z1 + 0.1];
  floor(s, x0, z0, x1, z1, 0, 'pattern', '#c9b08a');
  ceiling(s, x0, z0, x1, z1, h, 'paint', '#e8dfcc');
  s.structure((gg) => { gg.mat('paint', PAL.teal); for (let x = x0 + 2; x < x1; x += 3.2) gg.box(x - 0.1, h - 0.28, z0, x + 0.1, h - 0.01, z1, { faces: 'xXy' }); });
  // walls: the anti wall open to the lobby, the back wall solid, the front wall the Spouts' (built there); the spinward
  // side is open to the Rack between the columns, and closed past its back corner
  const wt = { tint: '#e6d8bf', dado: { h: 1.2, mat: 'tile', tint: PAL.red }, skirt: '#3a2d22' };
  wall(s, x0 - 0.08, z0, x0 - 0.08, z1, 0, h, Object.assign({}, wt, { openings: [{ at: z0 * -1 - 5, w: 10, h: 3.0 }] }));
  wall(s, x0, z1 + 0.08, x1, z1 + 0.08, 0, h, wt);
  wall(s, x1 + 0.08, SH.z1, x1 + 0.08, z1, 0, h, wt);
  // the stair core in the corner, its door on the Rack's side (lm_chimney_rack.js)
  wall(s, CORE.x0, CORE.z1 - 0.08, CORE.x1, CORE.z1 - 0.08, 0, h, Object.assign({}, wt, { dado: { h: 1.2, mat: 'tile', tint: PAL.teal } }));
  wall(s, CORE.x0 + 0.08, CORE.z0, CORE.x0 + 0.08, CORE.z1, 0, h, Object.assign({}, wt, { dado: { h: 1.2, mat: 'tile', tint: PAL.teal } }));
  // the rule about ropes, on the stair core facing the foyer
  sign(s, { kind: 'board', title: 'The rule about ropes', lines: ['Above the first gallery|on a rope', 'Every rope|checked at the counter', 'Belay from the anti side|always', 'Ropes hang straight|falls do not', 'Off the mat|shoes on'], palette: ['#22302c', '#f3e6c8', '#e9c43d'] }, (CORE.x0 + CORE.x1) / 2, 1.75, CORE.z1 + 0.01, { face: 'Z', w: 1.5, h: 1.1 });
  s.interact({ x: (CORE.x0 + CORE.x1) / 2, y: 1.5, z: CORE.z1 + 0.9, radius: 1.3, prompt: 'Read the rule about ropes', onUse: (gm) => read(gm, 'The rule about ropes', [
    'Above the first gallery, four metres, nobody climbs without a rope. That is the whole rule. The rest is reasons.',
    'Belay from the anti side of your climber. If they come off, they drop a little anti of the line before the rope takes them, and swing; ' + f2(driftFrom(4 + MAT_TOP)) + ' m of drop is nothing, but from the top a loose rope lets them come ' + f2(driftFrom(30 + MAT_TOP)) + ' m anti before it bites.',
    'The ropes themselves hang straight down. A thing that is held hangs true; only a thing that is falling drifts. Children are told this every week and check it every week with their shoes.',
    'Every rope is checked at the counter before the first climb of the day, and its date is chalked on the board. A rope is retired after four hundred falls and goes to the menders for bag straps.',
  ]) });
  // the counter: chalk and shoes on loan
  prop(s, 'counter', -20.5, 0, -7.6, 0, { w: 4.2, d: 0.65, body: PAL.indigo, top: '#8a6240' });
  prop(s, 'lmchimney.shoewall', -20.5, 0, z0 + 0.2, 0, { cols: 12, rows: 7, seed: 9 });
  prop(s, 'lmchimney.chalk', -22.0, 0.92, -7.6, 0, { tub: PAL.teal }, { noCollide: true });
  prop(s, 'lmchimney.chalk', -21.4, 0.92, -7.7, 0.5, { tub: PAL.ochre }, { noCollide: true });
  s.detail((gg) => {
    // coiled ropes on pegs, harnesses, a ledger book, a bell
    for (let i = 0; i < 5; i++) {
      const x = -17.6 + i * 0.5; gg.mat('cast', '#b08a45'); gg.tube([[x, 2.1, z0 + 0.02], [x, 2.1, z0 + 0.14]], 0.012, { segs: 5 });
      gg.mat('weave', ['#c8452e', '#2f9fa8', '#e9c43d', '#7a4aa0', '#4fa65a'][i]); const coil = []; for (let m = 0; m <= 24; m++) { const a = m / 8 * PI * 2; coil.push([x + Math.cos(a) * 0.18, 1.85 + Math.sin(a) * 0.24 - m * 0.002, z0 + 0.1 + (m % 8) * 0.004]); } gg.tube(coil, 0.012, { segs: 4 });
    }
    gg.mat('paper', '#efe6d0'); gg.box(-19.4, 0.92, -7.8, -19.0, 0.95, -7.5, { bevel: 0.005 }); gg.mat('leather', '#5a2f3a'); gg.box(-19.42, 0.95, -7.82, -18.98, 0.97, -7.48, { faces: 'Y' });
    gg.mat('cast', '#b08a45', { rough: -0.2 }); gg.lathe(-18.7, -7.7, [[0.05, 0.92], [0.06, 0.94], [0.035, 1.0], [0.012, 1.02], [0, 1.03]], { segs: 10 });
  });
  sign(s, { kind: 'board', title: 'On loan', lines: ['Climbing shoes|free, one hour', 'Harness and rope|free, signed out', 'Chalk|0.02 a scoop', 'A slide sack|free', 'Lost a shoe|ask, we have it'], palette: ['#2a1d14', '#f3e6c8', '#e9c43d'] }, -24.3, 1.9, z0 + 0.06, { face: 'Z', w: 1.3, h: 0.9 });
  for (let i = 0; i < 3; i++) s.spot('queue', -21.5 + i * 0.9, 0, -6.4 - (i % 2) * 0.3, PI, {});
  const KEEP = { name: 'Bo, at the counter', colour: '#e9c43d' };
  s.interact({ x: -20.5, y: 1.2, z: -6.7, radius: 1.6, prompt: 'Ask at the counter', onUse: async (gm) => {
    const it = await buy(gm, { title: 'The Spice Rack · on loan', note: 'Shoes, harness and ropes are the commons. Chalk is the one thing that is used up.', items: [
      { id: 'shoes', name: 'Climbing shoes, your size', desc: 'Resoled more times than anyone has counted. Back in an hour.', price: 0 },
      { id: 'chalk', name: 'A scoop of chalk', desc: 'In a borrowed bag. Mined nowhere: made in the Keel.', price: 0.02 },
      { id: 'sack', name: 'A slide sack', desc: 'Waxed cloth with a handle. Faster than overalls by a tenth of a second.', price: 0 },
    ] }, 'The counter');
    if (!it) { await say(gm, KEEP, ['Where have you slept, and have you eaten? Good. Then you can climb.', (gm.flags['chimney.counter'] = (gm.flags['chimney.counter'] || 0) + 1) > 1 ? 'Shoes are in the wall, by size. Bring them back with the laces done up, it saves me a minute.' : 'You are the wanderer from Spelt. Somebody on the cab said. Ask for anything: it is all on loan.']); return; }
    if (it.id === 'shoes') { gm.flags['chimney.shoes'] = true; await say(gm, KEEP, ['Size by the label, not by your feet. The labels are right, the feet are never sure.', 'Those have been resoled eleven times. New, a pair is twenty kays. Mended, it is an hour of somebody\'s evening.']); }
    else if (it.id === 'chalk') { sfx(gm, 'chalk', s.frame, -21.7, 1.0, -7.6); await say(gm, KEEP, ['There you are. Chalk is the one thing here that is used up: most of it ends up on the holds, and the holds are washed into the Keel\'s water every month.']); }
    else { await say(gm, KEEP, ['Sit on it, hold the handle, feet first. Float is the fast one, True is the fair one. The children will tell you the rest whether you ask or not.']); }
  } });
  // benches for the parents, and children's things
  prop(s, 'bench', -15.5, 0, -2.0, PI / 2, { w: 2.4, back: true, wood: PAL.wood });
  prop(s, 'bench', -15.5, 0, 2.0, PI / 2, { w: 2.4, back: true, wood: shadeHex(PAL.wood, 1.12) });
  seat(s, -15.5, 0, 2.0, PI / 2, 'Sit with the parents', { pitch: 0.05 });
  prop(s, 'table', -24.4, 0, -3.6, PI / 2, { w: 1.4, d: 0.8, wood: '#6f4e33' }); for (const dz of [-0.45, 0.45]) prop(s, 'chair', -24.4 + 0.72, 0, -3.6 + dz, -PI / 2, { wood: '#7a5a3a' });
  prop(s, 'cup', -24.3, 0.74, -3.9, 0, { glaze: '#2f7d7a' }, { noCollide: true }); prop(s, 'cup', -24.5, 0.74, -3.2, 0, { glaze: '#c8452e' }, { noCollide: true }); prop(s, 'bowl', -24.4, 0.74, -3.55, 0, { glaze: '#e9c43d', lid: '#d9a23a' }, { noCollide: true });
  planter(s, -25.3, 0, -8.6, { w: 0.9, d: 0.9, h: 0.6, plants: 'broad', tint: PAL.teal });
  planter(s, -10.9, 0, 8.6, { w: 1.2, d: 0.7, h: 0.5, plants: 'fern', tint: PAL.red });
  // the changing room: x[-26, -18], z[4.5, 10], its door on the foyer
  const cr = room(s, { x0: -26, z0: 4.5, x1: -18, z1: z1, y: 0, h, floor: ['tile', '#bcc6c0'], ceil: ['paint', '#e8e2d4'], wall: { tint: '#dfe3dc', dado: { h: 1.3, mat: 'tile', tint: '#2f7d7a' } }, open: { n: [{ at: 5.0, w: 1.2, h: 2.2 }], w: false, s: false }, noFloor: true, noCeiling: true, glow: { sky: '#eef2ee', ground: '#9fb0aa', power: 0.25 } });
  s.structure((gg) => { gg.mat('tile', '#bcc6c0'); gg.box(-26, 0, 4.5, -18, 0.006, z1, { faces: 'Y' }); });
  prop(s, 'lmchimney.lockers', -22.2, 0, z1 - 0.3, PI, { n: 8, seed: 21 });
  prop(s, 'bench', -22.2, 0, 7.2, 0, { w: 3.2, back: false, wood: '#a57a52' });
  prop(s, 'bench', -22.2, 0, 6.0, PI, { w: 3.2, back: false, wood: '#a57a52' });
  prop(s, 'lmchimney.hooks', -25.9, 0, 7.2, PI / 2, { w: 3.0, seed: 3 });
  prop(s, 'lmchimney.hooks', -18.1, 0, 7.2, -PI / 2, { w: 3.0, seed: 8 });
  lamp(s, 'panel', -22, h - 0.02, 7.2, { w: 2.2, d: 0.5, K: 3600, power: 0.9, clip: cr });
  for (let i = 0; i < 3; i++) s.spot('sit', -23.4 + i * 1.1, 0.46, 7.2, 0, { tags: ['change'] });
  s.interact({ x: -22.2, y: 1.2, z: 8.6, radius: 1.4, prompt: 'Open a locker', onUse: (gm) => {
    const n = (gm.flags['chimney.locker'] = ((gm.flags['chimney.locker'] || 0) + 1));
    const lines = ['In the locker: a card with a name in three hands, the oldest crossed out, and a sock that belongs to none of them.', 'The locker door has been re-hung on new hinges and painted over the old colour; the old colour shows at the edges, three colours deep.', 'A note taped inside: BACK THURSDAY, DO NOT LEND MY SHOES. Under it, in pencil: SORRY, LENT THEM.'];
    toast(gm, lines[(n - 1) % lines.length]);
  } });
  s.zoneBox({ id: 'chimney-change', place: 'chimney', box: [-26, -0.5, 4.5, -18, h, z1], name: 'The changing room', sub: 'the Spice Rack · ' + SUB, ambience: 'baths', reverb: 'tile' });
  // the first-aid corner: x[-15.5, -10.2], z[6, 10]: low walls, a cabinet, a cot, the nurse's chair
  wall(s, -15.5, 6.0, -12.4, 6.0, 0, 1.5, { tint: '#ece6da', cap: true, skirt: '#5a6a66' });
  wall(s, -15.5 + 0.08, 6.0, -15.5 + 0.08, z1, 0, 1.5, { tint: '#ece6da', cap: true, skirt: '#5a6a66' });
  prop(s, 'lmchimney.aid', -13.0, 0, z1 - 0.25, PI, {});
  prop(s, 'lmchimney.cot', -14.4, 0, 8.4, PI / 2, { blanket: '#8a2f3c' });
  prop(s, 'chair', -11.6, 0, 7.4, -PI / 2 - 0.4, { wood: '#6b4a2f' });
  s.detail((gg) => {
    gg.mat('glaze', '#e8e0cc'); gg.box(-11.3, 0.0, 8.8, -10.7, 0.62, 9.6, { bevel: 0.02 });
    gg.mat('weave', '#c8302a'); gg.box(-11.25, 0.62, 9.0, -10.95, 0.7, 9.3, { bevel: 0.02 });
    gg.mat('paper', '#f4efe2'); gg.box(-11.0, 0.62, 9.2, -10.8, 0.7, 9.45, { bevel: 0.01 });
  });
  sign(s, { kind: 'notice', title: 'First aid', lines: ['Bumps, blisters, rope burn.', 'Most of it is fright.', 'The nurse is here when the', 'Rack is open. After hours,', 'the clinic on deck 41.'], paper: '#f4efe2' }, -15.42, 1.25, 7.6, { face: 'X', w: 0.5, h: 0.5 });
  lamp(s, 'globe', -13.2, h - 0.4, 8.0, { K: 4000, power: 0.9, clip: [-15.6, -0.3, 5.9, -10.1, h, z1], drop: 0.4 });
  s.spot('work', -11.6, 0.46, 7.4, -PI / 2 - 0.4, { tags: ['nurse'] });
  const NURSE = { name: 'Ama, the nurse', colour: '#FFD9A0' };
  s.interact({ x: -12.2, y: 1.2, z: 7.2, radius: 1.6, prompt: 'Talk to the nurse', onUse: (gm) => {
    const n = (gm.flags['chimney.nurse'] = ((gm.flags['chimney.nurse'] || 0) + 1));
    const sets = [
      ['Sit, sit. You are not hurt, you are a visitor; I can tell by how you look at the walls.', 'I have been at this corner thirty-one years. I have seen everything that can happen to a person on a wall, and most of it was a blister.'],
      ['The worst I see is the Spouts, not the Rack. People come off Float faster than they expected and land in the blocks laughing with a lip bitten through.', 'Lean back, keep your arms in, and nobody bleeds. Have some Nine if you are peaky.'],
      ['When I started, the mat was laid straight under the routes. Then a girl dropped her shoe from the top and it missed the mat by a hand. We moved the target the next Knotnight.', 'She is a setter now. Long Ladle is hers.'],
    ];
    return say(gm, NURSE, sets[(n - 1) % sets.length]);
  } });
  s.zoneBox({ id: 'chimney-aid', place: 'chimney', box: [-15.5, -0.5, 6, -10, h, z1], name: 'First aid', sub: 'the Spice Rack · ' + SUB, ambience: 'flat', reverb: 'room' });
  // the board of records, on the back wall
  sign(s, { kind: 'board', title: 'Records of the Rack', lines: ['The Nine, top in|3 min 41 s', 'held by|Yusuf Marr, 34', 'Brine, youngest to top|aged 6', 'held by|Pia Szabo, now 19', 'Most tops, one day|52', 'held by|the Thursday club', 'Chalk bags on the target|every one, so far'], palette: ['#2a1d14', '#f3e6c8', '#e9c43d'] }, -16.8, 1.8, z1 - 0.02, { face: 'z', w: 1.5, h: 1.25 });
  s.interact({ x: -16.8, y: 1.5, z: z1 - 0.9, radius: 1.3, prompt: 'Read the board of records', onUse: (gm) => read(gm, 'Records of the Rack', [
    'The Nine, bottom to top: 3 min 41 s, Yusuf Marr, aged 34, who climbs it every Thursday after the ramen and says it is the ramen.',
    'Youngest to top any route: Pia Szabo, aged 6, on Brine. She is nineteen now and still the youngest.',
    'At 0.948 of a g a climber here weighs about a twentieth less than in the Keel. Records set on the High decks, at half a g, go on a separate board, and nobody here reads it.',
    'Chalk bags dropped from the bridge that landed on the target: all of them. People keep trying to miss, and the drum keeps not letting them.',
  ]) });
  // the way: a blue line on the floor to the mat, a yellow one to the Spouts' door; names hung over both
  s.detail((gg) => {
    gg.mat('paint', '#2f5f9a', { rough: 0.1 }); gg.box(LOB.x1 + 0.4, 0, -0.12, GO.x - 0.2, 0.004, 0.12, { faces: 'Y' });
    gg.mat('paint', '#e2ae2e', { rough: 0.1 }); gg.box(-20.5, 0, 0.3, -15.4, 0.004, 0.54, { faces: 'Y' }); gg.box(-15.52, 0, -9.9, -15.28, 0.004, 0.54, { faces: 'Y' });
  });
  sign(s, { kind: 'street', text: 'The Spice Rack', sub: 'nine routes · thirty-one metres · eight decks', palette: ['#2f5f9a', '#f6ecd6'] }, -11.6, 2.85, 0, { face: 'X', w: 2.6, h: 0.5, double: true, glow: 0.5 });
  sign(s, { kind: 'street', text: 'The Spouts', sub: 'Sink · True · Float', palette: ['#b0502c', '#f6ecd6'] }, -15.4, 2.85, z0 + 0.12, { face: 'Z', w: 1.9, h: 0.42, glow: 0.5 });
  s.deco((gg) => { gg.mat('cast', '#3d4a45'); for (const dz of [-1.1, 1.1]) gg.tube([[-11.6, 3.1, dz], [-11.6, h, dz]], 0.008, { segs: 4 }); });
  for (const z of [-4.2, 4.2]) bunting(s, [LOB.x1 + 0.3, 3.15, z], [GO.x - 0.4, 3.15, z * 0.6], { colors: ['#c8452e', '#f1e6cf', '#2f97b4', '#e2ae2e', '#4f8a52', '#6b3d5e'], sag: 0.35, drop: 0.18 });
  // children's drawings of the Rack, pinned on the changing room's wall: crayon walls, crayon climbers, a great many holds
  s.deco((gg) => {
    const dr = new Rng(77), ink = ['#c8452e', '#2f5f9a', '#e2ae2e', '#4f8a52', '#6b3d5e', '#2f97b4'];
    for (let i = 0; i < 9; i++) {
      const x = -25.6 + (i % 5) * 0.86 + dr.f(-0.05, 0.05), y = 1.35 + Math.floor(i / 5) * 0.62 + dr.f(-0.05, 0.05), w = dr.f(0.5, 0.62), hh = dr.f(0.38, 0.48), z = 4.5 - 0.09;
      gg.mat('paper', dr.pick(['#f4efe2', '#efe6d0', '#e8eef0'])); gg.box(x - w / 2, y - hh / 2, z - 0.004, x + w / 2, y + hh / 2, z, { faces: 'z' });
      gg.mat('paint', ink[i % ink.length]); gg.box(x - w * 0.36, y - hh * 0.4, z - 0.006, x - w * 0.3, y + hh * 0.4, z - 0.004, { faces: 'z' });
      for (let k = 0; k < 7; k++) { gg.mat('paint', dr.pick(ink)); const hx = x + dr.f(-w * 0.25, w * 0.4), hy = y + dr.f(-hh * 0.4, hh * 0.4); gg.box(hx - 0.012, hy - 0.012, z - 0.006, hx + 0.012, hy + 0.012, z - 0.004, { faces: 'z' }); }
      gg.mat('paint', dr.pick(ink)); const cx2 = x + dr.f(-0.05, 0.1), cy2 = y + dr.f(-0.05, 0.08); gg.box(cx2 - 0.02, cy2 - 0.06, z - 0.007, cx2 + 0.02, cy2 + 0.04, z - 0.005, { faces: 'z' });
      gg.mat('cast', '#c8302a'); gg.box(x - 0.01, y + hh / 2 - 0.03, z - 0.012, x + 0.01, y + hh / 2 - 0.01, z - 0.004);
    }
  });
  // light: panels over the counter and the benches, a warm lamp over the table
  lamp(s, 'panel', -20.5, h - 0.02, -7.8, { w: 3.2, d: 0.5, K: 3300, power: 1.0, clip });
  lamp(s, 'panel', -15.5, h - 0.02, 0, { w: 0.6, d: 3.2, K: 3200, power: 0.9, clip });
  lamp(s, 'globe', -24.4, 2.2, -3.6, { K: 2800, power: 0.9, clip, drop: 1.1 });
  lamp(s, 'panel', -22, h - 0.02, -1, { w: 1.2, d: 1.2, K: 3200, power: 0.7, clip });
  roomGlow(s, x0, 0, z0, x1, h, z1, { power: 0.26 });
  // people: parents on the benches (from the props), a chat by the table, children in and out
  { const cx = -22.6, cz = 1.8; for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + 0.3; s.spot('chat', cx + Math.sin(a) * 0.7, 0, cz + Math.cos(a) * 0.7, a + PI, { tags: ['talk'] }); } }
  for (let i = 0; i < 3; i++) s.spot('play', -22.5 + i * 1.2, 0, -3.5 + (i % 2) * 0.8, i, { tags: ['kids', 'hop'] });
  s.path([[LOB.x1 + 1, 0, 0], [-20.5, 0, -0.2], [-15.4, 0, -4.5], [GO.x - 2, 0, 0]]);
  s.path([[-20.5, 0, -0.2], [-20.5, 0, -6.0]]);
  s.path([[-20.5, 0, -0.2], [-20.4, 0, 3.2], [-20.4, 0, 6.2]]);
  s.path([[-15.4, 0, -4.5], [-15.4, 0, -9.2], [-15.4, 0, -11.2]]);
  s.path([[-15.4, 0, 0], [-13.0, 0, 4.4], [-12.6, 0, 7.0]]);
  s.zoneBox({ id: 'chimney-foyer', place: 'chimney', box: [x0, -0.5, z0, x1, h, z1], name: 'The Spice Rack', sub: 'the counter · ' + SUB, ambience: 'shop', reverb: 'room' });
  void r;
}
