// The block's rooms for words that come from far off: the world room and the letter room (Middle decks), and the note
// room (High decks), where the yearly notes about children named for the dead come in by hand.
import { defineProp } from '../world/props.js';
import { Rng, shadeHex } from '../core/util.js';
import { say, note } from '../city/lots.js';
import { local, shell, ceilingWorks, trims, partitionQ, pickBy, fill, sayPick, hourOf, nameBy, NAMES, KIT_T } from './lots_rooms_kit.js';
import { civicParts } from './civic_parts.js';

// ---------------------------------------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------------------------------------
// Pigeon-holes: a wall case of square cubbies, some with letters rolled or folded in them, a name card under each.
// Front toward +z, standing on the floor. p: { w, h, cols, rows, wood, seed, drawers }
defineProp('lots-rooms.holes', (g, p) => {
  const w = p.w || 1.6, h = p.h || 2.0, cols = p.cols || 8, rows = p.rows || 8, d = 0.32, wood = p.wood || '#6b4a2f', r = new Rng(p.seed || 1), y0 = p.base || 0.7;
  g.mat('wood', wood, { rough: -0.05 }); g.box(-w / 2, 0, -d / 2, w / 2, y0, d / 2, { bevel: 0.01, aoBottom: 0.6 });
  g.mat('wood', shadeHex(wood, 0.6)); g.box(-w / 2 + 0.03, y0, -d / 2, w / 2 - 0.03, h, -d / 2 + 0.02);
  g.mat('wood', wood);
  const cw = (w - 0.04) / cols, rh = (h - y0 - 0.04) / rows;
  for (let i = 0; i <= cols; i++) g.box(-w / 2 + i * cw, y0, -d / 2, -w / 2 + i * cw + 0.02, h, d / 2);
  for (let j = 0; j <= rows; j++) g.box(-w / 2, y0 + j * rh, -d / 2, w / 2, y0 + j * rh + 0.02, d / 2);
  g.box(-w / 2 - 0.02, h, -d / 2, w / 2 + 0.02, h + 0.05, d / 2 + 0.02, { bevel: 0.01 });
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = -w / 2 + 0.02 + i * cw, yb = y0 + 0.02 + j * rh;
    if (p.drawers) {
      g.mat('wood', shadeHex(wood, 1.1 + ((i * 7 + j * 3) % 5) * 0.035)); g.box(x0 + 0.006, yb + 0.006, d / 2 - 0.02, x0 + cw - 0.026, yb + rh - 0.026, d / 2, { bevel: 0.003 });
      g.mat('paper', ['#efe6d2', '#f3e3d0', '#e8dcc0'][(i + j) % 3]); g.box(x0 + cw * 0.25, yb + rh * 0.45, d / 2, x0 + cw * 0.75 - 0.02, yb + rh * 0.75, d / 2 + 0.003);
      g.mat('cast', '#c8a45a'); g.box(x0 + cw / 2 - 0.02, yb + rh * 0.2, d / 2, x0 + cw / 2 + 0.005, yb + rh * 0.3, d / 2 + 0.015);
      continue;
    }
    g.mat('paper', '#efe6d2'); g.box(x0 + cw * 0.2, yb - 0.018, d / 2 - 0.004, x0 + cw * 0.8 - 0.02, yb - 0.004, d / 2 + 0.002);
    const k = r.next();
    if (k < 0.45) { g.mat('paper', ['#f3ead6', '#efe0c4', '#e8dcc0', '#f6efe0'][r.i(0, 3)]); const n = r.i(1, 3); for (let m = 0; m < n; m++) g.box(x0 + 0.03, yb + 0.005 + m * 0.012, -d / 2 + 0.04, x0 + cw - 0.05, yb + 0.012 + m * 0.012, d / 2 - 0.05); }
    else if (k < 0.7) { g.mat('paper', ['#f3ead6', '#e8dcc0'][r.i(0, 1)]); g.push(); g.move(x0 + cw / 2 - 0.01, yb + 0.035, 0); g.rotX(Math.PI / 2); g.cyl(0, -d / 2 + 0.05, 0, 0.03, d - 0.1, { segs: 8 }); g.pop(); g.mat('weave', ['#c9552e', '#2f6f73', '#e0a040', '#5b3a6e'][r.i(0, 3)]); g.box(x0 + cw / 2 - 0.045, yb + 0.03, 0.0, x0 + cw / 2 + 0.025, yb + 0.07, 0.02); }
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h + 0.05, d / 2]], tier: 's' };
});

// A private booth for a slow world: two felt-lined side screens, a shelf desk, a chair, a small slate, and the lag lamp.
// Front (open) toward +z; the booth runs back toward -z by d. p: { w, d, felt, wood, lamp: 'amber' | 'green' | 'off', screen }
defineProp('lots-rooms.booth', (g, p) => {
  const w = p.w || 1.2, d = p.d || 1.3, felt = p.felt || '#2f6f73', wood = p.wood || '#6b4a2f', h = 1.85;
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) { g.box(sx * w / 2 - 0.03, 0, -d, sx * w / 2 + 0.03, h, 0, { bevel: 0.01 }); }
  g.mat('felt', felt); for (const sx of [-1, 1]) { g.box(sx * w / 2 - sx * 0.03 - 0.006, 0.3, -d + 0.02, sx * w / 2 - sx * 0.03 + 0.006, h - 0.08, -0.04); }
  g.mat('wood', shadeHex(wood, 1.15)); g.box(-w / 2 + 0.03, 0.74, -d + 0.02, w / 2 - 0.03, 0.78, -d + 0.48, { bevel: 0.008 });
  g.mat('felt', shadeHex(felt, 0.7)); g.box(-w / 2 + 0.03, 0.78, -d + 0.02, w / 2 - 0.03, h - 0.1, -d + 0.04);
  // a lintel across the top of the open front, and a felt roof
  g.mat('wood', wood); g.box(-w / 2 - 0.03, h - 0.12, -0.06, w / 2 + 0.03, h, 0.0, { bevel: 0.008 });
  g.mat('felt', shadeHex(felt, 0.8)); g.box(-w / 2 + 0.03, h - 0.04, -d, w / 2 - 0.03, h - 0.02, -0.06);
  // the chair
  g.mat('wood', '#3a2a20'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.18, 0, -d + 0.95 + sz * 0.18], [sx * 0.17, 0.44, -d + 0.95 + sz * 0.17]], 0.016, { segs: 5 });
  g.mat('felt', felt); g.box(-0.2, 0.44, -d + 0.75, 0.2, 0.5, -d + 1.15, { bevel: 0.02 }); g.mat('wood', '#3a2a20'); g.box(-0.2, 0.5, -d + 1.12, 0.2, 0.92, -d + 1.16, { bevel: 0.01 });
  // the slate: a small private thing lying on the desk, face up, dim
  g.mat('plain', '#1d2226', { rough: -0.4 }); g.box(-0.13, 0.78, -d + 0.2, 0.13, 0.79, -d + 0.38, { bevel: 0.004 });
  g.mat('diffuser', '#9fc4c8', { emissive: p.lamp === 'off' ? 0.05 : 0.5, lamp: true }); g.box(-0.115, 0.79, -d + 0.215, 0.115, 0.792, -d + 0.365);
  // the lag lamp: a small globe on a brass stalk at the desk's corner
  g.mat('cast', '#c8a45a', { rough: -0.2 }); g.cyl(w / 2 - 0.18, 0.78, -d + 0.15, 0.04, 0.012, { segs: 10 }); g.tube([[w / 2 - 0.18, 0.79, -d + 0.15], [w / 2 - 0.18, 1.05, -d + 0.15]], 0.006, { segs: 4 });
  const lc = p.lamp === 'green' ? '#8fe8a0' : p.lamp === 'amber' ? '#ffb347' : '#5a5046';
  g.mat('diffuser', lc, p.lamp === 'off' ? { rough: -0.3 } : { emissive: 3.5, lamp: false }); g.ball(w / 2 - 0.18, 1.09, -d + 0.15, 0.045, 0.045, 0.045, { segs: 10, rings: 6 });
  // a lidded cup somebody left
  g.mat('glaze', '#e9e1cf'); g.cyl(-w / 2 + 0.2, 0.78, -d + 0.3, 0.035, 0.08, { segs: 10 }); g.mat('glaze', felt); g.cyl(-w / 2 + 0.2, 0.86, -d + 0.3, 0.038, 0.012, { segs: 10 });
  return { solid: [[-w / 2 - 0.03, 0, -d, -w / 2 + 0.03, h, 0], [w / 2 - 0.03, 0, -d, w / 2 + 0.03, h, 0], [-w / 2, 0.4, -d, w / 2, 0.78, -d + 0.48]], tier: 's', cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// The world room (Middle decks)
// ---------------------------------------------------------------------------------------------------------------
const WORLD_PAL = [
  { wall: '#d9d2c2', felt: '#2f6f73', felt2: '#8a2f3c', floor: ['carpet', '#5a4a3a'], wood: '#5b3d27', sign: ['#1f3b3c', '#f1ead6', '#ffb347'] },
  { wall: '#d8d6cc', felt: '#33407a', felt2: '#c9962e', floor: ['carpet', '#4a3f4a'], wood: '#4a3324', sign: ['#1d2550', '#f1ead6', '#ffb347'] },
  { wall: '#e0d4c0', felt: '#5b3a6e', felt2: '#6b7a3a', floor: ['carpet', '#5a3a3a'], wood: '#6b4a2f', sign: ['#2a1f36', '#f2e3cf', '#ffb347'] },
];
const WORLDS = [['The Orchard Game', 'Herb Row', 'none', 0], ['Spinball by post', 'four rows over', 'a hundredth', 0], ['Long Harbour', 'down the row', '3.3 s', 3.3], ['The Kelp Row ladder', 'Kelp Row', '11 s', 11], ['Weather Row maps', 'Weather Row', '40 s', 40], ['The Slow Garden', 'a passing raft', '5 h', 18000], ['Gull Row songs', 'Gull Row', '2 min', 120], ['The Patient Chess', 'a raft passing', '9 h', 32400]];
const BOOTH_LINES = [
  ['You sit. The slate wakes, small and private, and shows a world built to wait: a garden two players tend, one move a turn.', 'You plant one row. The lag lamp goes amber while your move crosses to {far}, {lag} away by light, and green when the answer comes back.', 'Nothing in the room shows a moving picture on a wall. Everyone\'s world is on the slate in their own hands.'],
  ['The booth is warm and quiet, felt on both sides. A paper card on the desk: "Slow worlds. Say your move, then wait. The lamp will tell you."', 'The lamp burns amber for a long time. Somebody in the next booth laughs at something seven seconds old.'],
  ['The world on the slate is a harbour on a lake. Somebody {lag} away has moved a boat in the lamp-night; you move one back.', 'The booth is the block\'s and costs nothing. The world runs on your own compute, which is the biggest line on anybody\'s wallet and the first one people cut.'],
  ['You sit and leave the slate dark. On the desk, under the cup, a black thread: somebody going dark for a while, with nowhere to put it.', 'A black thread round the left wrist means: do not message me, I will not see it. The booth keeps your seat either way.'],
];
const KEEPER_WORLDS = [
  ['The lamps are for the lag. A friend down the row is three seconds away by light; one on a passing raft is hours. A slow world is a game built not to mind.', 'Across the Shade is years. Nobody plays across the Shade. They write.'],
  ['Shared worlds close by run with no lag at all: a few thousand kilometres is a hundredth of a second. Those you play at home. People come here for the slow ones.', 'And for the quiet. At home there is always somebody who wants you.'],
  ['On the Quiet this room is dark. No worlds, no messages, the whole drum. People sit in the halls and talk instead, and we save nine kays a head and eat it on Booking Day.', 'The booths get dusted. That is the only day they do.'],
  ['We had a girl in booth four who played the same harbour with a friend eleven seconds away for nine years. They met last spring, on the friend\'s wander year.', 'They were shy for a whole day, she said. Then they found out they talked exactly the same, with the wait taken out.'],
];

export async function buildWorlds(s, lot, plan, game, tick) {
  const L = local(s, lot, tick), info = plan.info, r = new Rng(lot.seed), W = L.W, D = L.D, g = s.g, H = 3.2, big = lot.onCourt || D > 11;
  const pal = WORLD_PAL[r.i(0, WORLD_PAL.length - 1)], keeper = nameBy(lot.seed, 'worlds');
  const dp = 1.5;
  const clip = await shell(L, info, { H, floor: pal.floor, ceil: ['felt', shadeHex(pal.felt, 0.6)], wall: { tint: pal.wall, dado: { h: 1.0, mat: 'wood', tint: pal.wood }, skirt: '#2a1c14' },
    glow: { sky: '#d8c8b0', ground: '#5a4a3a', power: 0.2 },
    front: { style: 'house', fin: { mat: 'paint', tint: pal.felt, dado: { h: 1.0, mat: 'wood', tint: '#3a2a20' }, trim: '#e8c26a', door: pal.felt2 }, door: { p: dp, w: 1.2 }, windows: [{ p: 2.7, w: Math.min(3.6, W - 4.6), h: 1.4, sill: 0.95 }], sign: { emblem: 'lamp', palette: pal.sign }, mat: pal.felt2 } });
  await tick();
  ceilingWorks(L, H, { beam: pal.wood, every: 2.4, duct: '#8d8478', pipe: '#b07a45', side: 'lo' });
  trims(L, H, { rail: 2.2, railTint: pal.wood, band: pal.felt2, bandH: 0.18 });
  await tick();

  // ---- booths: a row along the back wall and one down the far side, each with its lag lamp
  const bw = 1.25, bd = 1.35, nb = Math.floor((W - 0.5) / bw), lamps = ['amber', 'green', 'off', 'amber', 'green', 'amber'];
  const b0 = (W - nb * bw) / 2;
  const booths = [];
  for (let i = 0; i < nb; i++) {
    const p = b0 + (i + 0.5) * bw, lmp = lamps[(i + lot.seed) % lamps.length];
    L.prop('lots-rooms.booth', p, 0, D - 0.18 - bd, Math.PI, { w: bw, d: bd, felt: i % 2 ? pal.felt : pal.felt2, wood: pal.wood, lamp: lmp });
    L.spot('sit', p, 0.5, D - 0.18 - 0.95, 0, { tags: ['read', 'worlds'] });
    booths.push([p, D - 0.18 - 0.95]);
  }
  const side = big ? 5 : 3;
  for (let i = 0; i < side; i++) {
    const q = D - 0.18 - bd - 0.4 - (i + 0.5) * bw; if (q < 3.0) break;
    L.prop('lots-rooms.booth', W - 0.18 - bd, 0, q, -Math.PI / 2, { w: bw, d: bd, felt: i % 2 ? pal.felt2 : pal.felt, wood: pal.wood, lamp: lamps[(i + 2 + lot.seed) % lamps.length] });
    L.spot('sit', W - 0.18 - 0.95, 0.5, q, Math.PI / 2, { tags: ['read', 'worlds'] });
  }
  const bt = booths[Math.min(1, booths.length - 1)];
  L.seat(bt[0], bt[1], 0.04, 0, 'Sit in a booth', { onSit: (gm) => {
    if (gm.clock && gm.clock.day === 2) return say(gm, 'The booth', ['The slate stays dark. It is the Quiet: no worlds and no messages anywhere in the drum, until Booking Day.', 'The booth is still warm and still quiet, and you are allowed to sit in it.']);
    const w = WORLDS[2 + (lot.seed % 6)];
    return sayPick(gm, 'A booth', lot.seed ^ Math.floor(hourOf(gm)), 'booth', BOOTH_LINES, info, { far: w[1], lag: w[2] === 'none' ? 'no time at all' : w[2] });
  } });
  await tick();

  // ---- the long table for the slow worlds in the middle (big rooms), every seat with its small lamp
  if (big) {
    const tp0 = 2.6, tp1 = W - 3.2, tq = 6.6;
    L.prop('table', (tp0 + tp1) / 2, 0, tq, Math.PI / 2, { w: 0.9, d: tp1 - tp0, wood: pal.wood, legs: 'trestle' });
    for (let p = tp0 + 0.5; p < tp1 - 0.3; p += 0.9) for (const sg of [-1, 1]) {
      const a = sg < 0 ? 0 : Math.PI;
      L.prop('chair', p, 0, tq + sg * 0.75, a, { wood: '#3a2a20', seat: sg < 0 ? pal.felt : pal.felt2, back: 'slat' }, { noSpots: true }); L.spot('sit', p, 0.46, tq + sg * 0.75, a, { tags: ['read', 'worlds'] });
      L.detail(() => { const c = L.P(p, tq + sg * 0.25); g.mat('cast', '#c8a45a'); g.cyl(c[0], 0.74, c[1], 0.03, 0.01, { segs: 8 }); g.tube([[c[0], 0.75, c[1]], [c[0], 0.92, c[1]]], 0.005, { segs: 4 }); g.mat('diffuser', ((p * 3) | 0) % 3 ? '#ffb347' : '#8fe8a0', { emissive: 3 }); g.ball(c[0], 0.95, c[1], 0.03, 0.03, 0.03, { segs: 8, rings: 5 }); });
    }
    L.lamp('globe', (tp0 + tp1) / 2, 2.3, tq, { K: 2600, power: 0.6, clip, drop: 0.9, r: 0.16 });
  }

  // ---- the keeper's desk by the door, and the lag lamp over it that breathes with the lag
  const kp = W - 1.8, kq = KIT_T + 1.5;
  L.prop('counter', kp, 0, kq, Math.PI, { w: 1.8, d: 0.55, h: 0.92, body: pal.wood, top: '#8a5a32' }, { noSpots: true });
  L.spot('counter', kp, 0, kq + 0.75, Math.PI, { tags: ['write', 'worlds'] });
  L.spot('customer', kp - 0.3, 0, kq - 0.75, 0, { tags: ['worlds'] });
  L.prop('civic.desklamp', kp + 0.6, 0.92, kq, 0, { shade: '#2f6f4a' });
  L.detail(() => { g.mat('leather', pal.felt2); L.box(kp - 0.5, 0.92, kq - 0.15, kp, 0.94, kq + 0.15); g.mat('paper', '#f3ead6'); L.box(kp - 0.48, 0.94, kq - 0.13, kp - 0.02, 0.95, kq + 0.13); });
  const lagLamp = L.P(kp - 0.3, kq + 0.1);
  L.deco(() => { g.mat('cast', '#c8a45a'); g.tube([[lagLamp[0], H, lagLamp[1]], [lagLamp[0], 2.3, lagLamp[1]]], 0.006, { segs: 4 }); g.mat('diffuser', '#ffb347', { emissive: 2.5, lamp: false }); g.ball(lagLamp[0], 2.24, lagLamp[1], 0.09, 0.09, 0.09, { segs: 12, rings: 8 }); });
  const ll = s.light({ at: [lagLamp[0], 2.2, lagLamp[1]], color: '#ffb347', power: 1.6, range: 4.5, radius: 0.09, clip, lamp: false });
  const base = ll.color.slice(), lag = WORLDS[2 + (lot.seed % 3)][3] || 3.3;
  s.every((dt) => { const t = (performance.now() / 1000) % (lag * 2); const k = t < lag ? 0.55 + 0.45 * Math.sin(t / lag * Math.PI) : 0.25; ll.color[0] = base[0] * k; ll.color[1] = base[1] * k; ll.color[2] = base[2] * k; void dt; });
  L.interact({ p: kp - 0.3, q: kq - 0.7, y: 1.1, radius: 1.2, kind: 'talk', prompt: 'Talk to the keeper', onUse: (gm) => sayPick(gm, keeper, lot.seed ^ Math.floor(hourOf(gm) / 4), 'keeper', KEEPER_WORLDS, info) });

  // ---- the board of open worlds, and the one notice
  const ws = []; for (let k = 0; k < 6; k++) ws.push(WORLDS[(lot.seed + k * 3) % WORLDS.length]);
  ws.sort((a, b) => a[3] - b[3]);
  const BOARD = { kind: 'board', title: 'Open tonight', lines: ws.slice(0, 5).map((w) => w[0] + '|' + w[1] + ' · ' + w[2]), palette: pal.sign };
  const bq = Math.max(3.4, (D - bd) / 2 + 0.6);
  L.sign(BOARD, 0.17, 1.7, bq, [1, 0], { w: 1.6, h: 1.0, back: pal.wood });
  L.lamp('strip', 0.42, 2.55, bq - 0.7, { to: [0.42, 2.55, bq + 0.7], K: 2800, power: 0.4, clip, range: 3 });
  L.interact({ p: 1.0, q: bq, y: 1.5, radius: 1.3, prompt: 'Read the board of open worlds', onUse: (gm) => say(gm, 'Open tonight', [ws.slice(0, 5).map((w) => w[0] + ': ' + w[1] + ', ' + (w[2] === 'none' ? 'no lag' : w[2] + ' each way')).join('. ') + '.', 'Written underneath: "The Quiet: nothing. Not even the garden. It will wait; that is what it is for."']) });
  L.sign({ kind: 'notice', title: 'Slow worlds', lines: ['Say your move.', 'Then wait.', 'The lamp will tell you.', 'Talk softly:', 'the felt is thin.'], hand: true }, 0.17, 1.55, bq + 1.6, [1, 0], { w: 0.3, h: 0.4 });

  // ---- a bench under the window for whoever is waiting for a booth, plants, a lantern
  L.prop('bench', 2.7 + Math.min(3.6, W - 4.6) / 2, 0, KIT_T + 0.55, 0, { w: 2.0, back: true, wood: pal.wood }, { noSpots: true });
  for (let i = 0; i < 3; i++) L.spot('sit', 2.7 + Math.min(3.6, W - 4.6) / 2 - 0.65 + i * 0.65, 0.46, KIT_T + 0.55, 0, { tags: ['waiting', 'worlds'] });
  L.prop('plant', 0.55, 0, KIT_T + 0.6, 0.5, { kind: 'fern', size: 1.1, pot: pal.felt2, seed: 8 });
  L.lamp('lantern', W / 2, 2.45, D * 0.45, { tint: '#e8b04a', clip, power: 0.45, drop: 0.5 });
  L.lamp('globe', b0 + nb * bw * 0.3, 2.5, D - bd - 0.6, { K: 2600, power: 0.5, clip, drop: 0.6, r: 0.14 });
  L.lamp('globe', b0 + nb * bw * 0.7, 2.5, D - bd - 0.6, { K: 2600, power: 0.5, clip, drop: 0.6, r: 0.14 });

  // ---- walkways, people, zone
  L.path([[dp, -0.7], [dp, 1.2], [W / 2 - 0.5, D - bd - 1.0], [W - bd - 1.0, D - bd - 1.0]], { width: 1.1 });
  L.path([[dp, 1.2], [kp - 0.3, kq - 1.0]], { width: 1.0 });
  L.spot('chat', 1.4, 0, bq + 0.3, Math.PI / 2 - 0.4, { tags: ['chat', 'worlds'] }); L.spot('chat', 2.2, 0, bq + 0.1, -Math.PI / 2 + 0.3, { tags: ['chat', 'worlds'] });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: 'The world room', sub: info.name + ' · ' + lot.sub, ambience: 'quiet', reverb: 'felt', cell: info.key });
  void note; void fill; void partitionQ; void civicParts; void NAMES;
}

// ---------------------------------------------------------------------------------------------------------------
// The letter room (Middle decks)
// ---------------------------------------------------------------------------------------------------------------
const LETTER_PAL = [
  { wall: '#efe2c6', dado: '#5b3a26', floor: ['planks', '#8a6240'], accent: '#8a2f3c', cloth: '#c9962e', sign: ['#3a2a20', '#f6e7c4', '#e3b456'] },
  { wall: '#e6e0d0', dado: '#26306b', floor: ['planks', '#9a6a3a'], accent: '#2f6f73', cloth: '#d4878a', sign: ['#26306b', '#f1ead6', '#e0b04a'] },
  { wall: '#f0e0c8', dado: '#3f4f2a', floor: ['planks', '#a8794f'], accent: '#a8412b', cloth: '#6b7a3a', sign: ['#3f4f2a', '#f3e9cf', '#d6a640'] },
];
const LETTERS = [
  ['"Dear {to}. By the time this reaches you it will be eleven minutes old, which is nothing, and I will already have changed my mind about the soup."', 'The reader stops, as the room expects, so that everyone can laugh, and then goes on through four pages about a kitchen in Spelt.'],
  ['"Dear {to}. We passed close enough this week that our lamps were a few hours apart, and I wanted to write while it was still only hours."', 'Nobody in the ring speaks. The raft the letter came from is already further away than when it was sent.'],
  ['The reader opens the paper slowly. It came across the Shade, eight years each way. The woman it is for is listening with her eyes shut.', '"Dear {to}," it begins, "you will be grown when you read this." She is. She is seventy. Her grandmother wrote it.'],
  ['"Dear {to}. I am writing this long because you said long letters were the only kind worth the light. So here is the whole of my year."', 'It is a whole year: a wedding, a move, a recipe for steamed cake that the reader reads twice, because somebody in the ring asks.'],
  ['"Dear {to}. The children asked what your drum smells of. I said bread and machine oil and somebody else\'s soup. Was I right."', 'There is no question mark. Letters by light never ask: there is no time for the answer to matter.'],
];
const READER_LINES = [
  ['A letter is read once, aloud, to whoever it is for and whoever they ask to sit in. Then it goes in the drawer for them, or back to them, or nowhere. Their choice.', 'Where did you sleep last night? Have you eaten? Then sit in, if you like. Nobody here minds a stranger in the ring.'],
  ['Friends on a passing raft are hours away by light. Across the Shade it is years. People write long, because a short letter that took eight years is an insult.', 'I have read the same family\'s letters for thirty years. I know their handwriting, though I have only ever heard it.'],
  ['The light brings them in as text; I copy them out by hand for the reading. It is slower than it needs to be. That is the point of the room.', 'On the Quiet nothing comes in at all. The pigeon-holes look very full the day after.'],
  ['Wanderers send one card home from every row, sent by light and postmarked with the delay. We get a lot of those. I read them in the voice of whoever is twenty in the ring.', 'You will send one, I suppose. Make it longer than a card. They always want more than you think.'],
];

export async function buildLetters(s, lot, plan, game, tick) {
  const L = local(s, lot, tick), info = plan.info, r = new Rng(lot.seed), W = L.W, D = L.D, g = s.g, H = 3.2, big = lot.onCourt || D > 11;
  const pal = LETTER_PAL[r.i(0, LETTER_PAL.length - 1)], reader = nameBy(lot.seed, 'reader');
  const dp = W - 1.5;
  const clip = await shell(L, info, { H, floor: pal.floor, ceil: ['paint', '#efe6d2'], wall: { tint: pal.wall, dado: { h: 1.0, mat: 'wood', tint: pal.dado }, skirt: '#2a1c14' },
    glow: { sky: '#ffdcae', ground: '#8a6240', power: 0.22 },
    front: { style: 'house', fin: { mat: 'plaster', tint: pal.accent, dado: { h: 1.0, mat: 'wood', tint: pal.dado }, trim: '#efe2c6', door: pal.dado }, door: { p: dp, w: 1.2 }, windows: [{ p: 1.0, w: Math.min(3.8, W - 4.4), h: 1.45, sill: 0.95 }], sign: { emblem: 'book', palette: pal.sign }, mat: pal.cloth } });
  await tick();
  ceilingWorks(L, H, { beam: '#5b3d27', every: 2.4, duct: '#a9a49a', pipe: '#b07a45', side: 'hi' });
  trims(L, H, { rail: 2.3, railTint: pal.dado, band: pal.accent, bandH: 0.22 });
  await tick();

  // ---- the reading chair at the back middle, a lamp and a little table beside it, a rug under the ring
  const rc = [W / 2, D - 1.3];
  L.prop('rug', rc[0], 0, big ? 7.6 : 5.6, 0, { w: Math.min(W - 2.4, big ? 6.5 : 4.6), d: big ? 5.5 : 4.2, a: pal.accent, b: pal.cloth, mat: 'motif' }, { noCollide: true });
  L.prop('books.armchair', rc[0], 0, rc[1], Math.PI, { fabric: pal.accent, wood: '#5b3d27', wing: true, mend: pal.cloth, mendAt: 'arm' }, { noSpots: true });
  L.spot('sit', rc[0], 0.45, rc[1] - 0.05, Math.PI, { tags: ['read', 'letters'] });
  L.prop('books.standard', rc[0] + 0.8, 0, rc[1] + 0.2, 0, { shade: '#f0d9a8' });
  L.lamp('bulb', rc[0] + 0.8, 1.5, rc[1] + 0.2, { K: 2600, power: 0.6, range: 4, clip });
  L.prop('table', rc[0] - 0.75, 0, rc[1] - 0.1, 0, { round: true, w: 0.5, h: 0.6, wood: '#5b3d27' });
  L.prop('cup', rc[0] - 0.8, 0.6, rc[1] - 0.15, 0, { glaze: pal.cloth, lid: '#f4efe4' });
  L.detail(() => { g.mat('paper', '#f3ead6'); for (let i = 0; i < 5; i++) L.box(rc[0] - 0.68 + i * 0.006, 0.6 + i * 0.004, rc[1] - 0.02 + i * 0.01, rc[0] - 0.5 + i * 0.006, 0.603 + i * 0.004, rc[1] + 0.22 + i * 0.01); });
  // ---- the ring of seats facing the chair
  const ring = [], R = big ? 3.4 : 2.5, cx = rc[0], cq = rc[1] - 0.2;
  const n = big ? 11 : 7;
  for (let k = 0; k < n; k++) {
    const a = -1.15 + 2.3 * k / (n - 1), p = cx + Math.sin(a) * R, q = cq - Math.cos(a) * R;
    if (q < KIT_T + 0.8 || p < 0.6 || p > W - 0.6) continue;
    const fy = Math.atan2(cx - p, cq - q);
    L.prop('chair', p, 0, q, fy, { wood: ['#5b3d27', '#3a2a20', '#8a5a32'][k % 3], seat: [pal.cloth, pal.accent, '#e8dcc0'][k % 3], back: k % 2 ? 'slat' : 'hoop' }, { noSpots: true });
    L.spot('sit', p, 0.46, q, fy, { tags: ['listen', 'letters'] }); ring.push([p, q, fy]);
  }
  const mid = ring[Math.floor(ring.length / 2)] || [W / 2, 3, 0];
  L.seat(mid[0], mid[1], 0, mid[2], 'Sit in the ring', { onSit: (gm) => {
    const h = hourOf(gm);
    if (gm.clock && gm.clock.day === 2) return say(gm, 'The letter room', ['It is the Quiet. Nothing has come in by light today, and the chair stays empty.', 'People sit in the ring anyway and talk, the way they do in the halls.']);
    if (h < 9 || h >= 22) return say(gm, 'The letter room', ['Nobody is reading at this hour. The pigeon-holes hold what came in, folded, each under a name.']);
    const to = nameBy(lot.seed ^ Math.floor(h), 'to');
    return sayPick(gm, 'A letter, read aloud', lot.seed ^ Math.floor(h * 2), 'letter', LETTERS, info, { to });
  } });
  L.interact({ p: rc[0], q: rc[1] - 1.0, y: 1.1, radius: 1.0, kind: 'talk', prompt: 'Talk to the reader', onUse: (gm) => sayPick(gm, reader, lot.seed ^ Math.floor(hourOf(gm) / 3), 'reader', READER_LINES, info) });
  await tick();

  // ---- the pigeon-holes on one side wall, a writing desk on the other
  const hq = Math.min(D - 2.4, big ? 5.0 : 3.8);
  L.prop('lots-rooms.holes', 0.35, 0, hq, Math.PI / 2, { w: big ? 2.4 : 1.8, h: 2.3, cols: big ? 12 : 9, rows: 8, wood: '#6b4a2f', seed: lot.seed % 17 });
  L.spot('work', 1.1, 0, hq, -Math.PI / 2, { tags: ['write', 'letters'] });
  L.lamp('sconce', 0.2, 2.45, hq + (big ? 1.5 : 1.2), { face: [1, 0], K: 2700, power: 0.45, clip });
  L.interact({ p: 1.2, q: hq, y: 1.3, radius: 1.3, prompt: 'Look at the pigeon-holes', onUse: (gm) => {
    const a = nameBy(lot.seed, 'ph1'), b = nameBy(lot.seed, 'ph2'), c = nameBy(lot.seed, 'ph3');
    return say(gm, 'The pigeon-holes', ['A square for every household that has asked for one, a name card under each. Some hold a single folded sheet, some a fat roll tied with coloured tape.', 'On the cards, in pencil, the delay each came with: ' + a + ', eleven minutes. ' + b + ', six hours. ' + c + ', eight years and four months.', pickBy(lot.seed, 'ph', ['One square holds nothing but a note: "Read. Kept. Thank you."', 'One square is stuffed so full that the letters have been tied in a bundle with a shoelace.', 'One card has two names on it, one crossed through and the newer one written above, in the same hand.', 'An empty square has a card that says only: "Waiting."'])]);
  } });
  const wp = W - 0.55, wq = Math.max(KIT_T + 2.2, hq - 0.2);
  L.prop('table', wp - 0.1, 0, wq, -Math.PI / 2, { w: 1.2, d: 0.6, wood: '#5b3d27' });
  L.prop('chair', wp - 0.75, 0, wq, Math.PI / 2, { wood: '#3a2a20', seat: pal.accent }, { noSpots: true }); L.spot('sit', wp - 0.75, 0.46, wq, Math.PI / 2, { tags: ['write', 'letters'] });
  L.prop('books.greenlamp', wp, 0.74, wq - 0.4, -Math.PI / 2, {});
  L.lamp('bulb', wp, 1.0, wq - 0.4, { K: 2700, power: 0.3, range: 2.5, clip });
  L.detail(() => { g.mat('paper', '#f3ead6'); L.box(wp - 0.4, 0.74, wq - 0.1, wp - 0.05, 0.75, wq + 0.25); g.mat('plain', '#3a2c20'); for (let i = 0; i < 9; i++) L.box(wp - 0.37, 0.751, wq - 0.06 + i * 0.035, wp - 0.1 - (i % 3) * 0.04, 0.752, wq - 0.055 + i * 0.035); g.mat('glaze', '#1d2a3a'); L.cyl(wp - 0.05, 0.74, wq + 0.4, 0.03, 0.05, { segs: 10 }); });
  // ---- the board: what came in by light today
  const fromList = [['From Spelt', '11 minutes'], ['From a passing raft', '6 hours'], ['From Gull Row', '2 minutes'], ['From across the Shade', '8 years'], ['From Kelp Row', '40 seconds'], ['From a cycler', '3 days'], ['From the far side', '9 years'], ['From Weather Row', '1 minute']];
  const fl = []; for (let k = 0; k < 4; k++) fl.push(fromList[(lot.seed + k * 5) % fromList.length]);
  const BOARD = { kind: 'board', title: 'Came in by light today', lines: fl.map((f) => f[0] + '|' + f[1]).concat(['Readings|ask at the chair']), palette: pal.sign };
  L.sign(BOARD, W - 0.17, 1.75, Math.min(D - 1.9, wq + 1.9), [-1, 0], { w: 1.4, h: 0.95, back: '#5b3d27' });
  L.interact({ p: W - 1.0, q: Math.min(D - 1.9, wq + 1.9), y: 1.5, radius: 1.2, prompt: 'Read what came in today', onUse: (gm) => say(gm, 'Came in by light today', [fl.map((f) => f[0] + ', ' + f[1] + ' on the way').join('. ') + '.', 'Underneath, in a different hand: "Read once. Ask before you bring a friend. Bring a friend."']) });
  L.sign({ kind: 'notice', title: 'Readings', lines: ['Once, aloud,', 'to whoever it is for,', 'and whoever they ask.', 'Then it is theirs.'], hand: true }, W - 0.17, 1.5, KIT_T + 1.4, [-1, 0], { w: 0.3, h: 0.38 });

  // ---- light: pendants over the ring, a lantern by the window
  L.lamp('globe', cx - 1.2, 2.4, cq - R * 0.6, { K: 2700, power: 0.55, clip, drop: 0.75, r: 0.15 });
  L.lamp('globe', cx + 1.2, 2.4, cq - R * 0.6, { K: 2700, power: 0.55, clip, drop: 0.75, r: 0.15 });
  L.lamp('lantern', 2.0, 2.4, 1.4, { tint: pal.cloth, clip, power: 0.4, drop: 0.6 });
  L.prop('plant', W - 0.6, 0, D - 0.6, 0.4, { kind: 'broad', size: 1.5, pot: pal.accent, seed: 13 });
  L.prop('plant', 0.6, 0, D - 0.6, 0.9, { kind: 'fern', size: 1.0, pot: pal.cloth, seed: 14 });

  // ---- walkways, people, zone
  L.path([[dp, -0.7], [dp, 1.2], [W / 2 + 0.4, cq - R - 0.4], [1.3, hq]], { width: 1.1 });
  L.path([[W / 2 + 0.4, cq - R - 0.4], [wp - 1.2, wq]], { width: 1.0 });
  L.spot('chat', 1.3, 0, KIT_T + 1.6, 0.8, { tags: ['chat', 'letters'] }); L.spot('chat', 2.0, 0, KIT_T + 2.0, -1.4, { tags: ['chat', 'letters'] });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: 'The letter room', sub: info.name + ' · ' + lot.sub, ambience: 'quiet', reverb: 'felt', cell: info.key });
}

// ---------------------------------------------------------------------------------------------------------------
// The note room (High decks)
// ---------------------------------------------------------------------------------------------------------------
const NOTE_PAL = [
  { wall: '#e9e2d0', dado: '#3f4f43', floor: ['planks', '#8a6240'], accent: '#7a2a3a', wood: '#5b3d27', sign: ['#2f3b33', '#f1ead6', '#d6a640'] },
  { wall: '#efe4d0', dado: '#4a3324', floor: ['planks', '#9a6a3a'], accent: '#33407a', wood: '#6b4a2f', sign: ['#3a2a20', '#f6e7c4', '#c9962e'] },
  { wall: '#e4e4da', dado: '#5b3a6e', floor: ['planks', '#a8794f'], accent: '#2f6f73', wood: '#4a3324', sign: ['#2a1f36', '#f2e3cf', '#e8c26a'] },
];
const NOTES = [
  ['"{child} is four. She will not eat anything green and she sings all the time, mostly about cabs. She has his laugh, everybody says so, though none of us can say how we know."', 'Signed by the child\'s mother, and under it, in crayon, a cab with too many wheels.'],
  ['"{child} turned eleven in the spring. Bone day went well: he is tall for the Low decks. He asked who {dead} was and we told him: the one who taught half the block to swim. He wants to learn."', 'The elder reading it has to stop twice. Then she reads it again, because there is no one to stop her.'],
  ['"Dear family of {dead}. {child} started at the school this year and says the long hall is too long. He carries {dead}\'s share very carefully, the way he carries a full cup."', 'A pressed sprig of something green is folded into it. Herbs, not gin.'],
  ['"{child} is twenty and on her wander year, so this note is from us and not from her. Her card from Gull Row said only: tell them I am all right. So: she is all right."', 'The old man who came for it laughs out loud in the quiet room, and nobody minds.'],
  ['"Nothing much this year. {child} is well. She grew. She lost a tooth and found it again. We thought you would want to know even the nothing."', 'In this room, the nothing is what people come up for.'],
];
const NOTE_KEEPER = [
  ['A child here is named for the dead whose share they carry. Their family sends a note once a year, by hand, to the family of the one they were named for. The notes come in here.', 'The old come up to read them. Some of them have three or four children named for people they loved.'],
  ['When a share passes, the Register gives the dead one\'s family a card, and it comes back within the year with the child\'s name on it. After that, the notes.', 'Every birth closes someone\'s funeral, they say in Chervil. This is the room where it stays closed.'],
  ['By hand, always. A note could go by light in a second. Nobody wants that. Somebody carries it up, and somebody signs for it, and it sits in its drawer until it is read.', 'I keep the drawers. I do not read the notes. I know them all anyway, from the faces.'],
  ['The dead\'s family brings a gift to the naming, usually something remade from something of theirs. Then the child\'s family owes them news, for as long as both families last.', 'Some families have sent notes for ninety years. The children are old themselves by then, and write their own.'],
];

export async function buildNotes(s, lot, plan, game, tick) {
  const L = local(s, lot, tick), info = plan.info, r = new Rng(lot.seed), W = L.W, D = L.D, g = s.g, H = 3.2, big = lot.onCourt || D > 11;
  const pal = NOTE_PAL[r.i(0, NOTE_PAL.length - 1)], keeper = nameBy(lot.seed, 'notekeeper');
  const dp = 1.5;
  const clip = await shell(L, info, { H, floor: pal.floor, ceil: ['paint', '#ece4d2'], wall: { tint: pal.wall, dado: { h: 1.05, mat: 'flute', tint: pal.dado }, skirt: '#2a1c14' },
    glow: { sky: '#ffe0b8', ground: '#8a6240', power: 0.24 },
    front: { style: 'house', fin: { mat: 'paint', tint: pal.dado, dado: { h: 1.0, mat: 'tile', tint: pal.accent }, trim: '#efe4cc', door: pal.accent }, door: { p: dp, w: 1.2 }, windows: [{ p: 2.7, w: Math.min(3.6, W - 4.6), h: 1.4, sill: 0.95 }], sign: { emblem: 'leaf', palette: pal.sign }, mat: pal.accent } });
  await tick();
  ceilingWorks(L, H, { beam: pal.wood, every: 2.4, duct: '#a9a49a', pipe: '#b07a45', side: 'hi' });
  trims(L, H, { rail: 2.35, railTint: pal.wood, band: pal.dado, bandH: 0.2 });
  await tick();

  // ---- the wall of drawers along the back: one for every family that waits for notes
  const dw = Math.min(W - 1.6, big ? 8 : 6.4), nd = Math.max(2, Math.round(dw / 1.6));
  for (let k = 0; k < nd; k++) { const p = (W - dw) / 2 + (k + 0.5) * dw / nd; L.prop('lots-rooms.holes', p, 0, D - 0.36, Math.PI, { w: dw / nd - 0.04, h: 2.3, cols: 5, rows: 8, wood: pal.wood, drawers: true, base: 0.3, seed: k % 2 }); }
  L.spot('work', W / 2 - 0.8, 0, D - 1.1, Math.PI, { tags: ['notes', 'notes-room'] });
  L.lamp('strip', (W - dw) / 2 + 0.3, H - 0.1, D - 0.9, { to: [(W + dw) / 2 - 0.3, H - 0.1, D - 0.9], K: 2800, power: 0.45, clip, range: 3.5 });
  L.interact({ p: W / 2, q: D - 1.3, y: 1.4, radius: 1.4, prompt: 'Look at the drawers', onUse: (gm) => say(gm, 'The drawers', ['Hundreds of small drawers, each with a card in a brass frame. On every card, a name: not the child\'s, but the name of the dead the child was named for.', pickBy(lot.seed, 'dr', ['Some cards are so old that the name has been written over twice, in fresher ink, so it does not fade before the family does.', 'One drawer has a ribbon tied to its pull. Its notes have all been read this year.', 'A few drawers are labelled in a child\'s writing, the child grown old and now doing the labelling.', 'The pulls on the lowest row are bright from hands; the top rows are dull, and there is a little step for them.'])]) });
  await tick();

  // ---- the sorting counter by the door, where the notes come in by hand
  const kp = W - 1.6, kq = KIT_T + 1.7;
  L.prop('counter', kp, 0, kq, Math.PI, { w: 1.9, d: 0.55, h: 0.92, body: pal.dado, top: '#8a5a32' }, { noSpots: true });
  L.spot('counter', kp, 0, kq + 0.75, Math.PI, { tags: ['notes', 'write', 'notes-room'] });
  L.spot('customer', kp + 0.2, 0, kq - 0.75, 0, { tags: ['notes-room'] });
  L.prop('civic.basket', kp - 0.55, 0.92, kq, 0.3, { cane: '#c9a46a', fill: '#f3ead6', tag: '#f2d27a' });
  L.detail(() => { g.mat('paper', '#f3ead6'); for (let i = 0; i < 7; i++) L.box(kp + 0.1 + i * 0.01, 0.92 + i * 0.006, kq - 0.18 + (i % 2) * 0.02, kp + 0.36 + i * 0.01, 0.923 + i * 0.006, kq + 0.02 + (i % 2) * 0.02); g.mat('leather', pal.accent); L.box(kp + 0.45, 0.92, kq - 0.15, kp + 0.85, 0.94, kq + 0.15); g.mat('paper', '#f1e6cc'); L.box(kp + 0.47, 0.94, kq - 0.13, kp + 0.83, 0.95, kq + 0.13); });
  L.prop('civic.bell', kp + 0.75, 0.92, kq - 0.2, 0, {});
  L.prop('school.satchel', W - 0.2, 1.7, kq + 0.9, -Math.PI / 2, { a: pal.accent, flap: '#3a2a20' });
  L.deco(() => { g.mat('cast', '#c8a45a'); L.tube([[W - 0.17, 1.72, kq + 0.9], [W - 0.32, 1.74, kq + 0.9]], 0.012, { segs: 5 }); });
  L.interact({ p: kp, q: kq - 0.7, y: 1.1, radius: 1.2, kind: 'talk', prompt: 'Talk to the keeper of the notes', onUse: (gm) => sayPick(gm, keeper, lot.seed ^ Math.floor(hourOf(gm) / 3), 'nk', NOTE_KEEPER, info) });

  // ---- reading tables with green lamps, elders reading
  const tq = big ? [4.2, 7.0] : [4.3], tps = big ? [W * 0.3, W * 0.62] : [W * 0.42];
  let nt = 0;
  for (const q of tq) for (const p of tps) {
    L.prop('table', p, 0, q, 0, { w: 1.8, d: 0.85, wood: pal.wood });
    for (const sg of [-1, 1]) for (const dp2 of [-0.45, 0.45]) {
      const a = sg < 0 ? 0 : Math.PI, pq = [p + dp2, q + sg * 0.72];
      L.prop('chair', pq[0], 0, pq[1], a, { wood: '#3a2a20', seat: sg < 0 ? pal.accent : '#e8dcc0', back: (nt + dp2 > 0 ? 1 : 0) ? 'slat' : 'hoop' }, { noSpots: true });
      L.spot('sit', pq[0], 0.46, pq[1], a, { tags: ['read', 'notes-room'] });
    }
    L.prop('books.greenlamp', p, 0.74, q, 0, {});
    L.detail(() => { g.mat('paper', '#f3ead6'); for (const sg of [-1, 1]) { L.box(p - 0.6 + nt * 0.1, 0.74, q + sg * 0.25 - 0.1, p - 0.38 + nt * 0.1, 0.746, q + sg * 0.25 + 0.06); } });
    L.prop('cup', p + 0.5, 0.74, q - 0.2, 0, { glaze: '#f4efe4', lid: pal.accent });
    if (nt === 0) L.seat(p - 0.45, q - 0.72, 0, 0, 'Sit and read a note', { onSit: (gm) => { const child = nameBy(lot.seed ^ Math.floor(hourOf(gm)), 'child'), dead = nameBy(lot.seed ^ Math.floor(hourOf(gm)), 'dead'); return sayPick(gm, 'A yearly note', lot.seed ^ Math.floor(hourOf(gm) * 2), 'note', NOTES, info, { child, dead }); } });
    nt++;
  }
  for (const p of tps) L.lamp('globe', p, 2.3, tq[0], { K: 2700, power: 0.6, clip, drop: 0.85, r: 0.15 });
  L.lamp('bulb', tps[0], 1.05, tq[0], { K: 2700, power: 0.3, range: 2.4, clip });

  // ---- the board, and a notice
  const BOARD = { kind: 'board', title: 'The yearly notes', lines: ['Come in|by hand, never by light', 'Kept|until read', 'Read|by the family of the named', 'Carried|by anybody going up', 'This year|' + (300 + lot.seed % 400) + ' so far'], palette: pal.sign };
  L.sign(BOARD, 0.17, 1.7, big ? 5.4 : 4.2, [1, 0], { w: 1.4, h: 0.95, back: pal.wood });
  L.interact({ p: 1.0, q: big ? 5.4 : 4.2, y: 1.5, radius: 1.2, prompt: 'Read the board', onUse: (gm) => say(gm, 'The yearly notes', ['They come in by hand, never by light. They are kept until read, and read by the family of the one the child was named for.', 'Carried by anybody going up. This year: ' + (300 + lot.seed % 400) + ' so far.']) });
  L.sign({ kind: 'notice', title: 'Going up', lines: ['If you are going to', 'the High decks, ask at', 'the Low decks\' office', 'if there are notes', 'to carry.'], hand: true }, 0.17, 1.5, KIT_T + 1.3, [1, 0], { w: 0.3, h: 0.4 });
  L.prop('civic.armchair', 1.0, 0, D - 1.2, Math.PI * 0.75, { cloth: pal.accent, wood: pal.wood, mend: '#e8c26a' }, { noSpots: true }); L.spot('sit', 1.0, 0.43, D - 1.2, Math.PI * 0.75, { tags: ['read', 'notes-room'] });
  L.prop('plant', W - 0.6, 0, D - 0.7, 0.3, { kind: 'flower', size: 1.0, pot: pal.accent, seed: 3 });
  L.prop('plant', 0.6, 0, KIT_T + 0.6, 0.3, { kind: 'broad', size: 1.3, pot: pal.dado, seed: 5 });

  // ---- walkways, people, zone
  L.path([[dp, -0.7], [dp, 1.2], [kp - 1.0, kq - 0.9], [W / 2, D - 1.6]], { width: 1.1 });
  L.path([[dp, 1.2], [1.2, big ? 5.4 : 4.2]], { width: 1.0 });
  L.spot('chat', W / 2 - 0.3, 0, KIT_T + 1.9, 1.2, { tags: ['chat', 'notes-room'] }); L.spot('chat', W / 2 + 0.5, 0, KIT_T + 2.1, -1.6, { tags: ['chat', 'notes-room'] });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: 'The note room', sub: info.name + ' · ' + lot.sub, ambience: 'quiet', reverb: 'felt', cell: info.key });
  void note; void fill;
}
