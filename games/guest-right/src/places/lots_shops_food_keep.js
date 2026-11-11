// The generated larder (shop.larder): ferments, vat cheese, things that keep. A darker, cooler shop than its neighbours:
// crock shelves floor to rail down both walls, barrels with slate lids, a table of cheese under a cloth, cured mycelium
// hung over the counter, and at the back, behind a felt curtain half drawn, the cool dark back shelf.
import { Rng, shadeHex } from '../core/util.js';
import { say, note } from '../city/lots.js';
import { frameOf, shell, windowBed, counterAcross, shopPaths, queueSpots, crockL, jarL, keeperName, bandOf, isOpen, hourWord, buy, meter, LINEN, BRASS } from './lots_shops_food_kit.js';

const PALS = [
  { frame: '#5a2e22', plinth: '#3a1e16', accent: '#c9734a', wall: '#d9c9a8', dado: '#5a3e28', floor: ['stone', '#9a9284'], awning: ['#5a2e22', '#d9c9a8'], sign: ['#3a2a20', '#f3e6c8', '#c9734a'], felt: ['#5a2e22', '#8a6a3a', '#3a4a48'] },
  { frame: '#3a4a48', plinth: '#2a3634', accent: '#d6a640', wall: '#d8cfb8', dado: '#4a3a2a', floor: ['tile', '#8f8676'], awning: ['#3a4a48', '#d8cfb8'], sign: ['#2a3634', '#efe6cf', '#d6a640'], felt: ['#3a4a48', '#7a5a3a', '#a8412b'] },
  { frame: '#4a2a3a', plinth: '#321c28', accent: '#b8925a', wall: '#dccab0', dado: '#4a3226', floor: ['stone', '#a09484'], awning: ['#4a2a3a', '#dccab0'], sign: ['#4a2a3a', '#f2e3cf', '#c9a45c'], felt: ['#4a2a3a', '#8a6a3a', '#3a4a48'] },
];
const GLAZES = ['#7a5236', '#4a5a6a', '#a8563a', '#2f5a4a', '#c9a04a', '#6a3a4a', '#e6dcc4', '#3a3a34', '#8a7a5a'];
const MENU = [
  { id: 'cheese-slice', name: 'A slice of aged cheese', desc: 'Thirty grams of a Vat cheese aged two years in the cellars.', price: 0.33, line: 'Thirty grams. Two years in the cellars, and you will finish it in two minutes.' },
  { id: 'board', name: 'A keeping board', desc: 'Three aged cheeses, cured mycelium cut thin as paper, a miso-glazed curd, hard rusks.', price: 1.1, line: 'Sit at the hall with it. A board like this is for passing along a table.' },
  { id: 'miso', name: 'White miso, a small jar', desc: 'A hundred grams, koji-sweet. The jar comes back.', price: 0.55, line: 'The jar comes back. Wash it or not; we wash it again.' },
  { id: 'black-garlic', name: 'Black garlic, one head', desc: 'Aged five weeks on the loop until it is soft and sweet as fruit.', price: 0.2, line: 'Five weeks on the pipe. People eat it like fruit.' },
  { id: 'sour', name: "Last year's larder sour", desc: "Lactic and pale, from the block's Knotnight crocks.", price: 0.15, line: 'From last Knotnight. The block made it together, in the dark.' },
  { id: 'pickles', name: 'Pickled greens, a twist of paper', desc: 'Mustard greens, salted and soured, enough for a bowl of jook.', price: 0.12, line: 'For the jook. One twist is enough for two bowls.' },
  { id: 'rusks', name: 'Hard rusks, a bag', desc: 'They keep a year and taste of it.', price: 0.25, line: 'They keep a year. Most people eat them in a week.' },
  { id: 'nine', name: 'A tin of the Nine', desc: "A day's worth for the back of the shelf, in case.", price: 0.17, line: 'In case. Everybody keeps one.' },
  { id: 'crock', name: 'A crock, on loan', desc: 'Glazed, lidded, older than the shop. It goes back.', price: 0, tag: 'loan', line: 'Lent. It has been round this block more times than I have.' },
  { id: 'naming-jar', name: 'A naming jar of plums', desc: 'Preserved plums in a lidded jar, the gift the table brings to a naming.', price: 0.6, bands: ['low'], line: 'For a naming. Somebody new has come, and somebody old will be glad of the plums.' },
  { id: 'soft-cheese', name: 'Soft cheese, a small round', desc: 'Young and mild, for elders who have given up the hard ones.', price: 0.3, bands: ['high'], line: 'Young and soft. The hard ones are for people who still have the teeth for an argument.' },
];
const ASK = [
  ['Where did you sleep, and have you eaten? Then have a slice of this. Two years in the cellars, thirty grams, thirty-three hundredths.', 'Everything here keeps. That is the whole of the trade.'],
  ['The crocks are lent. You pay for what is in them and bring the crock back, and it goes out again. Some of these have been round the block a thousand times.', 'Clay is dear. New mass is twenty-five kays a kilogram, and a big crock is four kilograms.'],
  ['Black garlic sits five weeks on the loop at sixty-five degrees until it goes soft and sweet. It costs nothing but time and the pipe.', 'Twenty hundredths a head. People eat it like fruit.'],
  ['Knotnight is when the block makes its larder together, lamps down, all at once. The crocks on the back shelf are last Knotnight\'s.', 'We open one a month. Somebody always says it was better the year before.'],
  ['The hams are mycelium, cured. Nothing in this shop was ever an animal. People still call it ham because their great-grandparents did.', 'Cut thin as paper. You can read through a slice.'],
  ['Ferments are the cheapest thing in the drum and the slowest. The sour in that crock is a year old and cost less than the cloth over it.', 'Keeping is the opposite of new mass. Everything here was made once and is still being eaten.'],
];
const BAND = {
  low: ['Families come in for a jar of sour and a crock to keep it in. The crock comes back with a child to carry it.', 'Down here the halls buy most of my cheese. Four hundred people and a wheel lasts a week.', 'Children are allowed one taste from the sour crock. They make a face and come back for another.', 'A naming feast takes three crocks of pickles. The dead\'s family brings one, the table brings two.'],
  middle: ['Shift crews buy rusks and a tin of the Nine for the locker. In case, they say.', 'People buy one slice at lunch and eat it standing here, looking at the crocks. That is most of my trade.', 'The halls on this street take their cheese on Thursdays. I carry it myself; the wheel weighs less than it did on the Low decks.', 'Workers bring the crocks back on the way to the lifts and collect them full on the way home.'],
  high: ['Up here the elders keep larders of their own and come in to compare. Everyone\'s sour is better than mine, I am told.', 'Elders buy the soft cheeses, and they bring the crocks back washed, which nobody on the Low decks ever does.', 'My customers have made ninety Knotnight larders each. They tell me which year the crocks were best, and they do not agree.', 'At half a g a full crock is easy to carry. The elders take two and say it is for the exercise.'],
};
const BACK = [
  'Behind the felt curtain the back shelf has no lamp. It stays three degrees cooler than the shop, which is all a crock asks.',
  'Big crocks under cloth, each with a paper tag on string: a family name, a year, a Knotnight number.',
  'Wheels of cheese on slatted boards, turned by hand. A chalk tally on each board counts the turns.',
  'A hand lamp hangs on a nail at the end of the shelf. Nobody lights it except on Knotnight.',
  'It smells of salt and koji and cold clay. Somebody has written on the wall in pencil, very small: open the oldest first.',
];
const CLOSED = [
  'A cloth over the cheese and the lids on everything. The larder opens at eight.',
  'Shut. The crocks keep without anybody watching them, which is the point of crocks. Eight till eight.',
  'Nobody at the counter. A slate: Back at eight. Everything here will still be here.',
  'The lamps are low and the curtain is drawn right across. Open at eight.',
];
const TASTE = [
  'A spoon of last year\'s sour from a crock on the counter: lactic, pale and very sharp. Your face does something on its own.',
  'The keeper hands you a sliver of the oldest cheese on the end of a knife. It tastes of salt and nuts and a cellar you will never see.',
  'A clove of black garlic, soft as a date and sweet. It does not taste of garlic at all, until afterwards.',
  'A pickled mustard leaf, folded twice. Salt first, sour second, and then a long green bitterness that is the point.',
];

export async function buildLarder(s, lot, plan, game, tick0) {
  const M = meter(s, game, lot, tick0), tick = M.tick;
  const F = frameOf(lot), r = new Rng(lot.seed), info = plan.info, band = bandOf(info), pal = PALS[r.i(0, PALS.length - 1)];
  const iw = F.iw, D = F.D, H = F.H, bq = F.bq, doorSide = r.i(-1, 1), gs = r.sign();
  const SH = shell(s, F, lot, { floor: pal.floor, ceil: ['wood', '#6a4a30'], wall: pal.wall, wallMat: 'plaster', dado: { h: 1.1, mat: 'wood', tint: pal.dado }, skirt: shadeHex(pal.dado, 0.6), frame: pal.frame, plinth: pal.plinth,
    awning: pal.awning, sign: pal.sign, doorLx: doorSide * (iw - 1.5), beam: '#3a2a20', felt: pal.felt, awningOn: true, pipeSide: -gs, frieze: pal.frame,
    glow: { sky: '#e8c8a0', ground: '#7a6048', power: 0.13 } });
  const doorLx = SH.doorLx, clip = SH.clip, kname = keeperName(r), who = { name: kname, colour: '#d6a640' };
  await tick();
  // window: crocks with cloth lids on a bed, a cut wheel under a cloth, jars
  let wide = null;
  for (const [l0, l1] of SH.beds) {
    const y = windowBed(s, F, l0, l1, { body: pal.frame, cloth: '#d8cdb0', valance: pal.accent });
    if (!wide || l1 - l0 > wide[1] - wide[0]) wide = [l0, l1];
    F.draw(s, 'detail', (g) => {
      const rr = new Rng(lot.seed + Math.round(l0 * 10)); let x = l0 + 0.15;
      while (x < l1 - 0.15) {
        const k = rr.i(0, 2);
        if (k === 0) { const rad = rr.f(0.1, 0.14); crockL(g, x + rad, y, 0.5, rad, rr.f(0.18, 0.28), rr.pick(GLAZES), 'cloth', rr.pick([LINEN, '#e6d2b0', '#d9a0a0'])); x += rad * 2 + 0.08; }
        else if (k === 1) { g.mat('wood', '#6a4a30'); g.cyl(x + 0.17, y, 0.5, 0.17, 0.025, { segs: 12 }); g.mat('plaster', '#c99a4a', { rough: 0.2 }); g.cyl(x + 0.17, y + 0.025, 0.5, 0.14, 0.09, { segs: 12 }); g.mat('weave', '#efe7d6'); g.ball(x + 0.17, y + 0.1, 0.5, 0.15, 0.04, 0.15, { segs: 10, rings: 2, bottom: 0 }); x += 0.42; }
        else { for (let j = 0; j < 3; j++) jarL(g, x + 0.05 + j * 0.09, y, 0.45 + (j % 2) * 0.1, 0.04, rr.f(0.12, 0.16), rr.pick(['#a8402a', '#e8d27a', '#6a1e3a', '#8a9a4a', '#3a2a20']), rr.chance(0.5) ? 'metal' : '#d9c79a'); x += 0.32; }
      }
    });
  }
  if (wide) F.lamp(s, 'spot', (wide[0] + wide[1]) / 2, H - 0.02, 0.5, { clip: SH.spill, cone: [40, 16], power: 0.7, K: 2700 });
  F.prop(s, 'rug', doorLx, 0, 0.75, 0, { w: 1.2, d: 0.6, mat: 'rush', a: '#6a5a40', b: '#4a3a28' });
  F.prop(s, 'rug', doorLx, 0, 1.95, 0, { w: 1.0, d: 1.8, a: pal.accent, b: pal.frame }, { noCollide: true });
  await tick();
  // crock shelves down both walls, floor to the rail
  const qc = D - 3.0, sq0 = 1.0, sL = Math.max(1.6, Math.min(3.4, qc - 0.8 - sq0)), sqm = sq0 + sL / 2;
  for (const sd of [-1, 1]) {
    F.prop(s, 'shops-food.shelf', sd * (iw - 0.2), 0, sqm, -sd * Math.PI / 2, { w: +sL.toFixed(1), h: 2.2, d: 0.38, n: 4, wood: '#5a3e28', lip: pal.frame, fill: sd > 0 ? 'crocks' : 'jars', seed: (lot.seed >>> (sd > 0 ? 3 : 7)) % 4, glazes: GLAZES });
    await tick();
  }
  F.light(s, -(iw - 0.7), 2.0, sq0 + 0.2, { to: [-(iw - 0.7), 2.0, sq0 + sL - 0.2], type: 'tube', K: 2700, color: '#ffd8a0', power: 1.4, range: 2.4, radius: 0.04, clip, lamp: true });
  F.draw(s, 'deco', (g) => { g.mat('diffuser', '#ffe8c0', { emissive: 0.8, lamp: true }); g.box(-(iw - 0.45) - 0.015, 2.22, sq0 + 0.1, -(iw - 0.45) + 0.015, 2.24, sq0 + sL - 0.1, { faces: 'yxX' }); });
  // the middle: two barrels with slates, a cheese table under a cloth
  const tLx = (doorLx > 0.3 ? -1 : doorLx < -0.3 ? 1 : gs) * Math.min(1.0, iw - 2.4), tQ = Math.max(2.2, qc - 2.4);
  F.prop(s, 'table', tLx, 0, tQ, 0, { w: 1.2, d: 0.7, h: 0.76, wood: '#5a3e28', legs: 'trestle' });
  F.prop(s, 'food.cheese', tLx - 0.3, 0.76, tQ, 0, { kind: 'wheel', r: 0.17, h: 0.11, rind: '#c99a4a' });
  F.prop(s, 'food.cheese', tLx + 0.12, 0.76, tQ + 0.1, 0.4, { kind: 'half', r: 0.15, h: 0.1, rind: '#b8823a', paste: '#f0d48a' });
  F.prop(s, 'food.cheese', tLx + 0.35, 0.76, tQ - 0.15, 1.2, { kind: 'tall', r: 0.07, h: 0.13, wax: '#8a2420' });
  F.draw(s, 'detail', (g) => { g.mat('weave', '#efe7d6'); g.ball(tLx - 0.3, 0.87, tQ, 0.19, 0.05, 0.19, { segs: 10, rings: 2, bottom: 0 }); g.mat('wood', '#c9a46a'); g.box(tLx + 0.05, 0.76, tQ - 0.25, tLx + 0.35, 0.78, tQ - 0.05, { faces: 'yYxXzZ' }); });
  for (let i = 0; i < 2; i++) F.prop(s, 'shops-food.barrel', tLx + (tLx > 0 ? -1 : 1) * (1.0 + i * 0.6), 0, tQ + 0.6 - i * 0.2, 0, { r: 0.24, h: 0.62, wood: i ? '#7a5636' : '#6a4a30' });
  F.lamp(s, 'spot', tLx, H - 0.02, tQ, { clip, cone: [34, 14], power: 0.55, K: 2600 });
  await tick();
  // the counter, the hanging rail of cured things over it, a cheese board with a knife
  const C = counterAcross(s, F, { qc, gs, look: { body: pal.frame, top: '#8a6240', trim: pal.accent, panel: 'wood', panelTint: shadeHex(pal.frame, 1.3) } });
  const CT = C.CT, servLx = C.cm - gs * 0.3, keepLx = C.cm + gs * 0.65;
  F.prop(s, 'food.cheese', servLx, CT, qc - 0.02, 0.3, { kind: 'half', r: 0.17, h: 0.1, rind: '#c99a4a' });
  F.draw(s, 'detail', (g) => {
    g.mat('wood', '#9a6a3c'); g.box(servLx - 0.3, CT, qc - 0.2, servLx + 0.3, CT + 0.025, qc + 0.18, { faces: 'xXzZY' });
    g.mat('brushed', '#c9c4bb', { rough: -0.2 }); g.box(servLx + 0.15, CT + 0.025, qc - 0.12, servLx + 0.17, CT + 0.03, qc + 0.08, { faces: 'Y' });
    const rr = new Rng(lot.seed + 5);
    for (let i = 0; i < 3; i++) crockL(g, C.wallEnd + gs * (0.3 + i * 0.27), CT, qc + 0.05, 0.1, 0.22, rr.pick(GLAZES), i === 1 ? 'wood' : 'glaze');
    g.mat('cast', '#3a3430'); g.tube([[C.c0 + 0.2, 2.55, qc], [C.c1 - 0.2, 2.55, qc]], 0.015, { segs: 6 }); for (const x of [C.c0 + 0.25, C.c1 - 0.25]) g.box(x - 0.01, 2.55, qc - 0.01, x + 0.01, H, qc + 0.01);
  });
  for (let i = 0; i < 4; i++) { const x = C.c0 + 0.6 + i * (C.cw - 1.2) / 3; if (Math.abs(x - servLx) < 0.4) continue; F.prop(s, 'food.ham', x, 2.54, qc, i * 0.9, { col: ['#8a3e26', '#7a3a22', '#9a4a2a'][i % 3], len: 0.2 + (i % 2) * 0.12, size: 0.85 }, { noCollide: true }); }
  for (const dx of [-0.28, 0.28]) { const x = C.cm + dx * C.cw; F.prop(s, 'shops-food.shade', x, H, qc + 0.25, 0, { L: 1.1, col: pal.accent, inner: '#f8e8d0' }); F.lamp(s, 'bulb', x, H - 1.2, qc + 0.25, { clip, power: 0.65, K: 2600, range: 3.4 }); }
  await tick();
  // the cool dark back shelf behind its curtain
  const bw = Math.min(3.8, 2 * iw - 0.6);
  F.prop(s, 'shops-food.shelf', 0, 0, bq - 0.24, Math.PI, { w: +bw.toFixed(1), h: 2.3, d: 0.46, n: 4, wood: '#3a2a20', fill: 'cellar', seed: lot.seed % 5, glazes: ['#3a3a34', '#4a5a6a', '#7a5236', '#2f5a4a', '#e6dcc4'] });
  F.draw(s, 'structure', (g) => { g.mat('wood', '#3a2a20'); for (const sd of [-1, 1]) g.box(Math.min(sd * bw / 2, sd * iw), 0, bq - 0.47, Math.max(sd * bw / 2, sd * iw), 2.3, bq - 0.01, { faces: 'xXyYz' }); });
  F.draw(s, 'deco', (g) => {
    const qcu = bq - 0.62; g.mat('cast', BRASS); g.tube([[-iw, 2.45, qcu], [iw, 2.45, qcu]], 0.012, { segs: 6 });
    // the curtain: drawn across one half, gathered at the other
    const ds = -gs; g.mat('felt', pal.frame);
    g.sheet([ds * iw, 2.44, qcu], [ds * 0.2, 2.44, qcu], [ds * 0.25, 0.15, qcu + 0.02], [ds * iw, 0.15, qcu + 0.02], { nu: 10, nv: 2, ripple: 0.03, rippleN: 9 });
    g.sheet([gs * iw, 2.44, qcu], [gs * (iw - 0.45), 2.44, qcu], [gs * (iw - 0.4), 0.15, qcu + 0.02], [gs * iw, 0.15, qcu + 0.02], { nu: 4, nv: 2, ripple: 0.04, rippleN: 5 });
    // the hand lamp on its nail
    const hx = gs * (iw - 0.65); g.mat('cast', BRASS); g.cyl(hx, 1.5, bq - 0.05, 0.05, 0.03, { segs: 8 }); g.mat('diffuser', '#e8e0c8', { rough: -0.2 }); g.lathe(hx, bq - 0.05, [[0.035, 1.53], [0.045, 1.6], [0.03, 1.68]], { segs: 8 }); g.mat('cast', '#3a3430'); g.cyl(hx, 1.68, bq - 0.05, 0.03, 0.02, { segs: 8 });
  });
  await tick();
  // people
  F.spot(s, 'counter', keepLx, 0, qc + 0.72, Math.PI, { tags: ['shop', 'larder'] });
  F.spot(s, 'work', gs * (iw - 1.1), 0, bq - 0.95, 0, { tags: ['work', 'larder', 'stock'] });
  F.spot(s, 'customer', servLx, 0, qc - 0.85, 0, { tags: ['shop', 'larder'] });
  for (const sd of [-1, 1]) { F.spot(s, 'browse', sd * (iw - 1.05), 0, sqm - 0.5, sd * Math.PI / 2, { tags: ['shop', 'larder'] }); F.spot(s, 'browse', sd * (iw - 1.05), 0, sqm + 0.6, sd * Math.PI / 2, { tags: ['shop', 'larder'] }); }
  F.spot(s, 'browse', tLx, 0, tQ - 0.75, 0, { tags: ['shop', 'larder'] });
  const aisle = Math.abs(tLx - doorLx) < 1.3 ? tLx - Math.sign(tLx || 1) * 1.35 : doorLx;
  queueSpots(s, F, C, servLx, aisle, ['shop', 'larder', 'queue'], 2);
  shopPaths(s, F, C, doorLx, servLx, keepLx, [[gs * (iw - 1.1), bq - 0.95]], aisle);
  F.path(s, [[aisle, 2.0], [-(iw - 1.05), sqm], [iw - 1.05, sqm]], { width: 0.9 });
  // the board
  const board = { kind: 'notice', title: 'Keeping well', lines: ['Aged cheese, a slice · 0.33', 'A keeping board · 1.10', 'Black garlic · 0.20', 'Larder sour · 0.15', 'Rusks · 0.25', 'Crocks lent, crocks back'] };
  const bdq = Math.min(qc - 0.5, sq0 + sL + 0.42);
  F.sign(s, board, gs * (iw - 0.01), 1.75, bdq, -gs * Math.PI / 2, { w: 0.2, h: 0.28 });
  // things to do
  const open = () => isOpen(game, [8, 20]);
  const ask = ASK[r.i(0, ASK.length - 1)], bl = BAND[band][r.i(0, 3)];
  F.interact(s, servLx, 1.1, qc - 0.5, { radius: 1.0, prompt: () => (open() ? 'Buy something that keeps' : 'The counter'), onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [CLOSED[(lot.seed >>> 2) % CLOSED.length]]); return; }
    await buy(gm, F, lot.name, 'Everything here keeps. So do the crocks: they come back.', MENU, who, band);
  } });
  F.interact(s, keepLx, 1.5, qc + 0.45, { radius: 1.2, kind: 'talk', prompt: 'Talk to ' + kname, onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [CLOSED[((lot.seed >>> 2) + 2) % CLOSED.length]]); return; }
    await say(gm, who, ask.concat([bl]));
  } });
  F.interact(s, C.wallEnd + gs * 0.55, 1.1, qc - 0.45, { radius: 0.8, prompt: () => (open() ? 'Ask for a taste' : 'The tasting crocks'), onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, ['The tasting crocks are lidded for the night.']); return; }
    const key = 'taste:' + lot.id; const first = !gm.flags[key]; gm.flags[key] = true;
    await say(gm, who, first ? [TASTE[(lot.seed >>> 2) % TASTE.length], 'Free. A taste is how a crock gets sold.'] : [TASTE[((lot.seed >>> 2) + 1) % TASTE.length], 'That is two. The third one costs a slice.']);
  } });
  F.interact(s, 0, 1.4, bq - 0.9, { radius: 1.3, prompt: 'Look behind the curtain', onUse: async (gm) => {
    const i = (lot.seed >>> 9) % BACK.length; await say(gm, lot.name, [BACK[i], BACK[(i + 2) % BACK.length]]);
  } });
  s.zoneBox({ id: lot.id, place: 'city-shop', box: [lot.x0, -0.5, lot.z0, lot.x1, 3.4, lot.z1], name: lot.name, sub: info.name + ' · ' + (lot.onCourt ? 'on the court' : F.o.alongX ? info.avenue : info.street), ambience: 'shop', reverb: 'felt', cell: info.key, trade: lot.trade, front: lot.front, env: { autoKey: 0.14 } });
  void note;
  M.done(F);
}
