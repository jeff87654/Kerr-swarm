// Lot module for the generated laundry (shop.laundry): round doors, folded by morning, cheapest at the night price after
// eleven. Washers down the back wall and one side, a folding table under drying racks hung from the ceiling, shelves of
// parcels tied with string and tagged, an attendant's counter with the price board, a bench facing the round doors.
import { registerLot } from '../city/lots.js';
import { Rng, shadeHex } from '../core/util.js';
import { say, note } from '../city/lots.js';
import { civicParts } from './civic_parts.js';
import { frameOf, shell, windowBed, keeperName, bandOf, hourOf, meter, LINEN } from './lots_shops_food_kit.js';

const PALS = [
  { frame: '#2f5f9f', plinth: '#c9654a', accent: '#f2d27a', wall: '#f1dfa8', dado: '#c9654a', floor: ['pattern', '#e8dcc4'], awning: ['#f2d27a', '#f4ecd8'], sign: ['#2f5f9f', '#f4ecd8', '#f2d27a'], felt: ['#2f5f9f', '#f2d27a', '#c9654a'] },
  { frame: '#2f6f73', plinth: '#e07a5a', accent: '#f0c060', wall: '#eef0e2', dado: '#2f6f73', floor: ['tile', '#dcd4c0'], awning: ['#2f6f73', '#eef0e2'], sign: ['#2f6f73', '#f3efe0', '#f0c060'], felt: ['#e07a5a', '#2f6f73', '#f0c060'] },
  { frame: '#5b3a6e', plinth: '#3d2a4d', accent: '#9fd0b8', wall: '#f0e6d8', dado: '#9fd0b8', floor: ['terrazzo', '#dcd0bc'], awning: ['#5b3a6e', '#f0e6d8'], sign: ['#5b3a6e', '#f2e3cf', '#9fd0b8'], felt: ['#9fd0b8', '#5b3a6e', '#f2d27a'] },
];
const WASHERS = ['#efe6d2', '#9fd0b8', '#9cc4e4', '#f0a48a', '#f2d27a', '#e9e1cf', '#2f5f9f'];
const LOADS = ['#c9552e', '#2f6f73', '#e7b547', '#7a2a5a', '#3a5f9f', '#d4878a', '#6c9a4c', '#e8e2d0'];
const DYED = ['#c9552e', '#2f6f73', '#e7b547', '#7a2a5a', '#26306b', '#d4878a', '#6c9a4c', '#b5653a', '#f0d070', '#8a2f3c', '#3fa7a3', '#efe7d6'];
// the price of a load by the hour: dearest at lamp-noon, cheapest in the lamp-night
function priceAt(h) { return h >= 1 && h < 6.5 ? 0.12 : (h >= 23 || h < 1) ? 0.15 : (h >= 11 && h < 15) ? 0.24 : 0.2; }

const ASK = [
  ['Where did you sleep, and have you eaten? Then leave your bag. Folded by morning.', 'After eleven is the night price. The machines like the lamp-night, and so does your wallet.'],
  ['Every basket has a name tag. Nothing has been lost in this room since my mother ran it, apart from socks.', 'The socks go on the shelf. They wait a year and then they go to the menders.'],
  ['The water comes back clean from the recyclers and the heat comes off the loop. What you pay for is the turning.', 'Twenty hundredths a load in the day. Twelve after one in the morning, when the drum has power to spare.'],
  ['Round doors, because the drums inside are round. Guests always laugh at a little drum turning inside the big one. We stopped hearing the joke a long time ago.'],
  ['Lids on the soap crocks. Soap left open in this air dries to a cake by morning.', 'A spoon a load. More soap is not more clean. It is only more rinsing.'],
  ['Most of the block washes at one in the morning without getting up: you set it, you sleep, I fold.', 'Folded by morning means by seven. I have never been late. I have been early.'],
];
const BAND = {
  low: ['Families wash every night down here. Children grow out of a shirt a month, and we let the seams out on the folding table: a hand\'s width in every seam.', 'School shirts go through on Tuesday nights. The whole block smells of the same soap on Wednesday.', 'A naming means a month of night loads. Babies are the best customers I have.', 'The children fold. Matching socks is a game down here, and the winner gets the odd ones.'],
  middle: ['Workers bring a week at once and collect it at seven on the way to the lifts.', 'The lamp-night crews wash in the afternoon at the noon price. They say it is worth it to sleep.', 'Overalls from the Keel come in on Fridays. They take two washes and a long rinse.', 'People leave a bag on the way to work and a note: hot, cold, mend the cuff. I do the first two.'],
  high: ['Up here the elders bring one shirt at a time and stay for the talk.', 'Clothes up here are old and good. I wash a coat older than the block on Thursdays, by hand, cold.', 'Elders fold better than anyone. They have had a hundred years of practice, and they tell me so.', 'At half a g the baskets are light and the stairs are easy. Nobody hurries, and the night loads still get done by seven.'],
};
const WASHER = [
  'A round door, and behind it a little drum turning somebody\'s red shirts, inside the big drum turning everybody.',
  'The washer\'s panel shows the price it will charge when it starts. It is waiting for the night price, like everybody else.',
  'Inside the round door a load of blue cloth goes round, slowly, because slowly is cheaper.',
  'Somebody has painted, very small, on the inside of the door: and so on.',
  'The door glass is warm. The heat comes off the loop pipe behind the wall, for nothing.',
];
const LOAD = [
  'Your shirt, your other shirt, the socks from three drums ago. The round door clunks shut and the little drum starts to turn.',
  'Everything you own that is not on you goes in: two shirts, a jacket lining, the travelling socks. The door clunks shut.',
  'You load the washer and add a spoon of soap from the crock, and put the lid back on the crock. The drum begins to turn.',
  'The round door swallows a wander year of laundry. The panel shows the price and the little drum starts, slowly, because slowly is cheaper.',
];
const FOLDED = [
  'Parcels of folded clothes on the shelves, each tied with string and tagged with a name and a flat number. Folded by morning.',
  'The parcels are folded the block\'s way: shirts in thirds, sleeves behind, collars up so the mends show.',
  'One shelf is all odd socks, sorted by colour. A card: Called for within the year, or to the menders.',
  'A parcel tagged for someone who moved to the High decks three years ago. Nobody has had the heart to send it on.',
];

async function buildLaundry(s, lot, plan, game, tick0) {
  const M = meter(s, game, lot, tick0), tick = M.tick;
  void civicParts;
  const F = frameOf(lot), r = new Rng(lot.seed), info = plan.info, band = bandOf(info), pal = PALS[r.i(0, PALS.length - 1)];
  const iw = F.iw, D = F.D, H = F.H, bq = F.bq, doorSide = r.pick([-1, 1]), cs = -doorSide;
  const SH = shell(s, F, lot, { floor: pal.floor, wall: pal.wall, wallMat: 'paint', dado: { h: 1.25, mat: 'tile', tint: pal.dado }, skirt: shadeHex(pal.dado, 0.6), frame: pal.frame, plinth: pal.plinth,
    awning: pal.awning, sign: pal.sign, emblem: 'drop', doorLx: doorSide * (iw - 1.4), beam: '#efe4cc', felt: pal.felt, awningOn: true, pipeSide: -cs, frieze: pal.frame,
    glow: { sky: '#fff0d8', ground: '#e8d2a8', power: 0.24 } });
  const doorLx = SH.doorLx, clip = SH.clip, kname = keeperName(r), who = { name: kname, colour: '#9cc4e4' };
  await tick();
  // window: folded stacks and a basket on a bed
  for (const [l0, l1] of SH.beds) {
    const y = windowBed(s, F, l0, l1, { body: pal.frame, cloth: '#e8e2d0', valance: pal.accent });
    const n = Math.max(1, Math.floor((l1 - l0) / 0.5));
    for (let i = 0; i < n; i++) { const x = l0 + (i + 0.5) * (l1 - l0) / n; if (i % 2) F.prop(s, 'civic.basket', x, y, 0.5, r.f(-0.3, 0.3), { r: 0.17, h: 0.2, fill: DYED[(i * 3 + lot.seed) % DYED.length] }); else F.prop(s, 'civic.folded', x, y, 0.5, r.f(-0.2, 0.2), { cols: [DYED[(i + lot.seed) % 12], DYED[(i + 5) % 12], DYED[(i + 8) % 12]], n: 4 }); }
    F.lamp(s, 'spot', (l0 + l1) / 2, H - 0.02, 0.5, { clip: SH.spill, cone: [44, 18], power: 0.7, K: 3200 });
  }
  F.prop(s, 'rug', doorLx, 0, 0.75, 0, { w: 1.2, d: 0.6, mat: 'rush', a: '#7a7060', b: '#5a5040' });
  F.prop(s, 'rug', doorLx, 0, 1.95, 0, { w: 1.0, d: 1.8, a: pal.accent, b: pal.frame }, { noCollide: true });
  await tick();
  // the washers: a row along the back wall, a column down the door side in the back half; copper pipes to each
  const nb = Math.max(4, Math.floor((2 * iw - 0.3) / 0.72)), wq = bq - 0.34;
  for (let i = 0; i < nb; i++) { const x = -iw + 0.15 + (i + 0.5) * (2 * iw - 0.3) / nb; F.prop(s, 'shops-food.washer', x, 0, wq, Math.PI, { body: WASHERS[(i + lot.seed) % WASHERS.length], load: LOADS[(i * 3 + lot.seed) % LOADS.length] }); }
  const sq0 = D * 0.5, ns = Math.max(2, Math.floor((wq - 0.75 - sq0) / 0.72));
  for (let i = 0; i < ns; i++) { const q = sq0 + i * 0.72; F.prop(s, 'shops-food.washer', -cs * (iw - 0.34), 0, q, cs * Math.PI / 2, { body: WASHERS[(i + 3 + lot.seed) % WASHERS.length], load: LOADS[(i * 5 + 1) % LOADS.length] }); }
  F.draw(s, 'deco', (g) => {
    g.mat('cast', '#c47a45', { rough: -0.2 }); g.tube([[-iw + 0.2, 1.45, bq - 0.06], [iw - 0.2, 1.45, bq - 0.06]], 0.025, { segs: 6 });
    g.mat('felt', '#3a5f9f'); g.tube([[-iw + 0.2, 1.58, bq - 0.07], [iw - 0.2, 1.58, bq - 0.07]], 0.04, { segs: 6 });
    for (let i = 0; i < nb; i++) { const x = -iw + 0.15 + (i + 0.5) * (2 * iw - 0.3) / nb + 0.22; g.mat('cast', '#c47a45'); g.tube([[x, 1.45, bq - 0.06], [x, 0.86, bq - 0.06], [x, 0.86, bq - 0.1]], 0.012, { segs: 4 }); }
    // a shelf over the back row: soap crocks with lids, a jar of pegs
    g.mat('wood', '#c9a46a'); g.box(-iw + 0.2, 1.95, bq - 0.3, iw - 0.2, 1.99, bq, { faces: 'yYz' });
    for (let i = 0; i < 6; i++) { const x = -iw + 0.6 + i * (2 * iw - 1.2) / 5; g.mat('glaze', [pal.frame, '#c9654a', '#e8e2d0', '#6c9a4c', '#e7b547', '#7a2a5a'][i], { rough: -0.15 }); g.cyl(x, 1.99, bq - 0.15, 0.08, 0.18 + (i % 3) * 0.04, { segs: 8 }); g.mat('glaze', '#e8e2d0'); g.cyl(x, 2.17 + (i % 3) * 0.04, bq - 0.15, 0.084, 0.02, { segs: 8 }); }
  });
  await tick();
  // the attendant's counter on the side away from the door, the price board over it
  const cq = 2.3, cL = Math.min(1.8, D * 0.5 - 1.6);
  F.prop(s, 'shops-food.counter', cs * (iw - 0.95), 0, cq, -cs * Math.PI / 2, { w: +cL.toFixed(1), d: 0.6, h: 0.95, body: pal.frame, top: '#c9a46a', trim: pal.accent, panel: 'tile', panelTint: pal.dado });
  F.draw(s, 'detail', (g) => { g.mat('paper', '#efe6cf'); g.box(cs * (iw - 1.05) - 0.12, 0.95, cq - 0.3, cs * (iw - 1.05) + 0.12, 0.98, cq + 0.05, { faces: 'xXzZY' }); g.mat('leather', pal.frame); g.box(cs * (iw - 1.05) - 0.125, 0.98, cq - 0.305, cs * (iw - 1.05) + 0.125, 0.99, cq + 0.055, { faces: 'xXzZY' }); });
  F.prop(s, 'civic.folded', cs * (iw - 0.95), 0.95, cq + cL / 2 - 0.25, 0.2, { cols: [DYED[lot.seed % 12], DYED[(lot.seed + 4) % 12], '#efe7d6'], n: 3 }, { noCollide: true });
  const board = { kind: 'notice', title: 'A load', lines: ['Lamp-noon · 0.24', 'Mornings, evenings · 0.20', 'After eleven · 0.15', 'One till lamp-dawn · 0.12', 'Folded by morning'] };
  F.sign(s, board, cs * (iw - 0.01), 1.85, cq, -cs * Math.PI / 2, { w: 0.2, h: 0.28 });
  // the shelves of folded parcels down the counter side, in the back half
  const fq0 = cq + cL / 2 + 0.5, fL = Math.max(1.2, Math.min(3.2, wq - 0.75 - fq0));
  F.prop(s, 'shops-food.shelf', cs * (iw - 0.2), 0, fq0 + fL / 2, -cs * Math.PI / 2, { w: +fL.toFixed(1), h: 2.1, d: 0.36, n: 5, wood: '#c9a46a', lip: pal.frame, fill: 'folded', seed: lot.seed % 4 });
  await tick();
  // the folding table in the middle, under the drying racks; baskets with name tags; the bench facing the washers
  const tQ = D * 0.42, tLx = cs * 0.2;
  F.prop(s, 'table', tLx, 0, tQ, 0, { w: 1.9, d: 0.85, h: 0.86, wood: '#c9a46a', legs: 'trestle' });
  for (let i = 0; i < 3; i++) F.prop(s, 'civic.folded', tLx - 0.6 + i * 0.6, 0.86, tQ + (i % 2 ? 0.12 : -0.15), i * 0.4, { cols: [DYED[(i * 4 + lot.seed) % 12], DYED[(i * 4 + 2) % 12], DYED[(i + 7) % 12], '#efe7d6'], n: 3 + (i % 2) }, { noCollide: true });
  for (let i = 0; i < 3; i++) F.prop(s, 'civic.basket', -cs * (iw - 1.2) + i * cs * 0.55, 0, sq0 - 0.55, r.f(0, 3), { r: 0.2, h: 0.26, fill: i === 1 ? null : DYED[(i * 5 + lot.seed) % 12] });
  F.prop(s, 'bench', 0, 0, wq - 1.35, 0, { w: 1.6, back: true, wood: '#c9a46a', metal: pal.frame }, { spot: { tags: ['shop', 'laundry', 'wait'] } });
  F.draw(s, 'detail', (g) => { // two drying racks on pulleys over the table, hung with the block's colours
    for (const dq of [-0.45, 0.45]) {
      const q = tQ + dq, y = 2.78; g.mat('wood', '#9a7448'); for (const dz of [-0.18, 0.18]) g.tube([[tLx - 1.1, y, q + dz], [tLx + 1.1, y, q + dz]], 0.016, { segs: 5 });
      g.mat('weave', '#e6dcc6'); for (const x of [tLx - 1.0, tLx + 1.0]) g.tube([[x, y, q], [x, H, q]], 0.005, { segs: 3, caps: false });
      let x = tLx - 1.0; const rr = new Rng(lot.seed + Math.round(dq * 10));
      while (x < tLx + 0.9) { const w = rr.f(0.3, 0.55), d = rr.f(0.28, 0.52), dz = rr.chance(0.5) ? 0.18 : -0.18; g.mat(rr.chance(0.3) ? 'stripe' : 'weave', rr.pick(DYED), { sway: 0.35 }); g.sheet([x, y, q + dz], [x + w, y, q + dz], [x + w, y - d, q + dz + 0.02], [x, y - d, q + dz + 0.02], { sag: 0.02, nu: 2, nv: 2 }); x += w + rr.f(0.05, 0.2); }
    }
  });
  F.lamp(s, 'panel', 0, H, tQ, { w: 1.2, d: 0.5, power: 0.9, K: 3900, clip });
  F.lamp(s, 'panel', 0, H, wq - 1.2, { w: 1.2, d: 0.5, power: 0.8, K: 3900, clip });
  await tick();
  // people
  F.spot(s, 'counter', cs * (iw - 0.35), 0, cq, -cs * Math.PI / 2, { tags: ['shop', 'laundry'] });
  F.spot(s, 'work', tLx - 0.45, 0, tQ - 0.72, 0, { tags: ['work', 'fold', 'laundry'] });
  F.spot(s, 'work', tLx + 0.45, 0, tQ + 0.72, Math.PI, { tags: ['work', 'fold', 'laundry'] });
  for (let i = 0; i < nb; i += 2) { const x = -iw + 0.15 + (i + 0.5) * (2 * iw - 0.3) / nb; F.spot(s, 'work', x, 0, wq - 0.85, 0, { tags: ['wash', 'laundry'] }); }
  F.spot(s, 'customer', cs * (iw - 1.65), 0, cq, cs * Math.PI / 2, { tags: ['shop', 'laundry'] });
  F.spot(s, 'browse', cs * (iw - 1.0), 0, fq0 + fL / 2, cs * Math.PI / 2, { tags: ['shop', 'laundry'] });
  F.path(s, [[doorLx, -0.7], [doorLx, 1.2], [cs * (iw - 1.65), cq], [0, tQ - 0.9], [0, wq - 0.9]], { width: 1.1 });
  F.path(s, [[cs * (iw - 1.65), cq], [cs * (iw - 1.65), cq + cL / 2 + 0.4], [cs * (iw - 0.35), cq + cL / 2 + 0.4], [cs * (iw - 0.35), cq]], { width: 0.7 });
  F.path(s, [[0, tQ - 0.9], [tLx - 0.45, tQ - 0.72]], { width: 0.8 }); F.path(s, [[0, wq - 0.9], [-cs * (iw - 1.2), sq0 + 0.5]], { width: 0.8 });
  // things to do
  const ask = ASK[r.i(0, ASK.length - 1)], bl = BAND[band][r.i(0, 3)];
  const att = () => { const h = hourOf(game); return h >= 7 && h < 23; };
  F.interact(s, -cs * (iw - 1.3), 0.9, sq0 + 0.3, { radius: 1.2, prompt: (gm) => 'Wash your travelling clothes (' + priceAt(hourOf(gm)).toFixed(2) + ')', onUse: async (gm) => {
    const p = priceAt(hourOf(gm));
    if (gm.wallet && !gm.wallet.spend(p, 'A load of washing')) { if (gm.audio) gm.audio.ui('deny'); await say(gm, 'The washer', ['The panel blinks: not enough in your wallet. Somebody on the bench says the night price is kinder.']); return; }
    if (gm.sfxAt) { const w = F.L(-cs * (iw - 0.34), sq0); gm.sfxAt('clunk', s.frame, w[0], 0.5, w[1]); }
    gm.flags['washed:' + lot.id] = hourOf(gm);
    await say(gm, 'The washer', [LOAD[(lot.seed >>> 4) % LOAD.length], p <= 0.15 ? 'Night price. The machines have the drum to themselves at this hour, and so do you.' : 'Day price. After eleven it is cheaper, and after one cheaper still.', 'Folded by morning. The attendant writes your name on a tag: wanderer, from Spelt.']);
  } });
  F.interact(s, cs * (iw - 1.4), 1.4, cq, { radius: 1.1, kind: 'talk', prompt: () => (att() ? 'Talk to ' + kname : 'The counter'), onUse: async (gm) => {
    if (!att()) { await say(gm, lot.name, ['The counter is empty and a card stands on the ledger: Back at seven. The washers take your kays without me. Folded by morning.']); return; }
    const washed = gm.flags['washed:' + lot.id] !== undefined;
    await say(gm, who, (washed ? ['Yours is the one with the socks from three drums. Folded by seven.'] : []).concat(ask, [bl]));
  } });
  F.interact(s, 0, 0.9, wq - 0.75, { radius: 1.1, prompt: 'Look into a washer', onUse: async (gm) => { await say(gm, 'A washer', [WASHER[(lot.seed >>> 3) % WASHER.length], WASHER[((lot.seed >>> 3) + 3) % WASHER.length]]); } });
  F.interact(s, cs * (iw - 0.9), 1.5, fq0 + fL / 2, { radius: 1.1, prompt: 'Look at the folded parcels', onUse: async (gm) => {
    const h = hourOf(gm), t = gm.flags['washed:' + lot.id];
    const mine = t !== undefined ? [h >= 7 && h < 12 && (t >= 12 || t < 7) ? 'On the end of the shelf, a parcel tied with string, tagged: wanderer, from Spelt. Folded by morning, as promised.' : 'Your parcel is not on the shelf yet. Folded by morning means by seven.'] : [];
    await say(gm, lot.name, [FOLDED[(lot.seed >>> 5) % FOLDED.length]].concat(mine));
  } });
  s.loop('tide', ...(() => { const w = F.L(0, wq - 0.5); return [w[0], 0.6, w[1]]; })(), { vol: 0.07, radius: 6 });
  s.zoneBox({ id: lot.id, place: 'city-shop', box: [lot.x0, -0.5, lot.z0, lot.x1, 3.4, lot.z1], name: lot.name, sub: info.name + ' · ' + (lot.onCourt ? 'on the court' : F.o.alongX ? info.avenue : info.street), ambience: 'shop', reverb: 'tile', cell: info.key, trade: lot.trade, front: lot.front });
  void note; void LINEN;
  M.done(F);
}

registerLot('shop.laundry', buildLaundry);

export const place = { id: 'lots-shops-service', name: 'Lots: service shops', order: 2, always: true, build() {} };
