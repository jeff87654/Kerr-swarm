// The generated baker (shop.baker): a bread wall down one side, a counter with a glass case of warm things, the ovens
// glowing at the back under their hood, a proving rack, the bench where the dough is worked, heels free in a basket,
// and the night loaf, out at ten and again at two for the people who work the lamp-night.
import { prop } from '../world/props.js';
import { Rng } from '../core/util.js';
import { say, note } from '../city/lots.js';
import { dome } from './food_parts.js';
import { frameOf, shell, windowBed, plateRail, basketL, crockL, loafL, keeperName, bandOf, pickN, isOpen, hourOf, hourWord, buy, meter, LINEN } from './lots_shops_food_kit.js';

const PALS = [
  { frame: '#7a2a22', plinth: '#5a1e18', accent: '#c9452e', wall: '#efcf8c', dado: '#f1e9d8', floor: ['pattern', '#e2b48e'], awning: ['#c9452e', '#f3e6cc'], sign: ['#7a2a22', '#f6e7c8', '#e8b85a'], felt: ['#c9452e', '#d9a548', '#7a2a22'] },
  { frame: '#24504f', plinth: '#1a3a39', accent: '#d6a640', wall: '#f0e2c4', dado: '#e8dcc0', floor: ['tile', '#d8c4a0'], awning: ['#24504f', '#efe2c4'], sign: ['#24504f', '#f3e9cf', '#e0b04a'], felt: ['#d6a640', '#24504f', '#c9552e'] },
  { frame: '#3d2a4d', plinth: '#2b1e36', accent: '#e8a03a', wall: '#f2e0c8', dado: '#efe4d0', floor: ['planks', '#b98a5a'], awning: ['#5b3a6e', '#e8c26a'], sign: ['#3d2a4d', '#f2e3cf', '#e8c26a'], felt: ['#e8a03a', '#5b3a6e', '#c9552e'] },
  { frame: '#2f3f6e', plinth: '#222e52', accent: '#c9552e', wall: '#f3e6cc', dado: '#dfe6ee', floor: ['terrazzo', '#d8c8a8'], awning: ['#2f3f6e', '#f3e6cc'], sign: ['#2f3f6e', '#f1ead6', '#e0b04a'], felt: ['#c9552e', '#2f3f6e', '#d6a640'] },
];
const CRUSTS = ['#b8763a', '#a8662e', '#c08446', '#9a5a28'];
const DAY = [4, 20], NIGHT = [22, 3];

const MENU = [
  { id: 'sugar-bun', name: 'Sugar bun', desc: 'Soft, sticky, and cheaper than a tomato.', price: 0.4, when: (h) => h >= DAY[0] && h < DAY[1], line: 'Forty hundredths. It will hold you till the hall.' },
  { id: 'croissant', name: 'Croissant', desc: 'Laminated with Vat butter. Eat it over the paper.', price: 0.55, when: (h) => h >= DAY[0] && h < DAY[1], line: 'Hold the paper a little anti. That is where the flakes land.' },
  { id: 'puffs', name: 'Sour-starch cheese puffs, six', desc: 'Fermented starch that puffs hollow in the oven. Best in the first ten minutes.', price: 0.3, when: (h) => h >= DAY[0] && h < DAY[1], line: 'Six in the bag. Walk slowly and eat them all before the door.' },
  { id: 'cake', name: 'Honeycomb steamed cake', desc: 'Yeast-raised and full of holes, under a linen lid while it is warm.', price: 0.3, when: (h) => h >= DAY[0] && h < DAY[1], line: 'Keep the cloth on it. The air will have the warmth out of it in a minute.' },
  { id: 'boule', name: 'Country boule', desc: 'Round and floured, about eight hundred grams, in its own linen.', price: 0.7, when: (h) => h >= DAY[0] && h < DAY[1], line: 'Bring the linen back and the next one goes home in it.' },
  { id: 'batard', name: 'Batard', desc: 'Long, scored once, a crust that talks when you squeeze it.', price: 0.6, when: (h) => h >= DAY[0] && h < DAY[1], line: 'Squeeze it on the way out. Everyone does.' },
  { id: 'tin', name: 'Tin loaf', desc: 'Square, soft, for slicing thin at a long table.', price: 0.5, when: (h) => h >= DAY[0] && h < DAY[1], line: 'Twenty slices if you cut it like an aunt.' },
  { id: 'school-rolls', name: 'A bag of school rolls', desc: 'Six small rolls, the size the school asks for at half past ten.', price: 0.45, bands: ['low'], when: (h) => h >= DAY[0] && h < DAY[1], line: 'Spinball makes them hungry. The rolls are the right size for a pocket.' },
  { id: 'shift-batard', name: 'A batard for the shift', desc: 'Split and spread with miso butter, wrapped for the lift.', price: 0.75, bands: ['middle'], when: (h) => h >= DAY[0] && h < DAY[1], line: 'Wrapped for the lift. The cloth comes back tonight, or tomorrow.' },
  { id: 'soft-loaf', name: 'A small soft loaf', desc: 'Half the size, a soft crust, for one elder and a guest.', price: 0.35, bands: ['high'], when: (h) => h >= DAY[0] && h < DAY[1], line: 'Soft crust. Most of my customers have had their teeth a hundred years.' },
  { id: 'rusks', name: 'Rusks for the tin', desc: 'Twice baked. They keep a year and taste of it.', price: 0.25, bands: ['high'], when: (h) => h >= DAY[0] && h < DAY[1], line: 'For the back of the shelf. Everyone up here keeps a tin.' },
  { id: 'night-loaf', name: 'The night loaf', desc: 'Out at ten and again at two, for the lamp-night crews: dense, dark, wrapped in a cloth you bring back.', price: 0.6, when: (h) => h >= NIGHT[0] || h < NIGHT[1], line: 'Still warm. The crews eat it walking, under the cloth.' },
  { id: 'heels', name: "Yesterday's heels", desc: 'Loaf ends for the soup or the larder. Free to anyone who asks.', price: 0, line: 'Free. Nobody in this block pays for the end of a loaf.' },
];

const ASK = [
  ['Where did you sleep, and have you eaten? Have a bun first. It is forty hundredths and it will hold you till the hall.', 'We bake from four. By seven the street has had its bread and the ovens drop to holding.'],
  ['Everything warm goes under linen. Heliox takes the heat out of a loaf four times faster than air, so the cloth is half the recipe.', 'The heels are free. Nobody here pays for the end of a loaf.'],
  ['Bread is Mill starch and a little gluten from the Vats. It costs us next to nothing. The oven is what costs, so we bake big and we bake early.', 'Searing and baking draw power. Proving is free: the rack sits on the loop pipe.'],
  ['The mother in the crock is older than I am. She is registered with the strain library, so if she died they could grow her back in a week.', 'I would still sit with the empty crock for a day.'],
  ['We keep the ovens on for the night loaf. It comes out at ten and again at two, for the crews who work while the lamps are down.', 'If you are up, knock at the hatch. Sixty hundredths, and the cloth comes back.'],
  ['The linen is older than the shop. Every cloth has a name stitched in one corner, and most of the names are dead.', 'We wash them on the night price and fold them by morning.'],
  ['A loaf is about half a kay of somebody\'s morning. Bread has never been dear here. Lamplight is dear. Bread is starch and a warm shelf.', 'At the greengrocer, one tomato costs what a tin loaf costs here.'],
];
const BAND = {
  low: [
    'Half my trade before eight is children on the way to school. There is always a broken bun if a child is looking at the tray.',
    'The families buy the big tins. A tin feeds a table of six and its aunts.',
    'The school takes forty rolls at half past ten. Spinball is hungry work.',
    'Down here at nearly a full g the loaves come out squat and honest. Nobody complains.',
  ],
  middle: [
    'Most of the street buys on the way to the lifts. The queue is longest at twenty past seven.',
    'The shift crews take a batard each and bring the cloth back at night. We count the cloths, not the loaves.',
    'At this weight the dough proves a little quicker than at the rim. We moved the clock, not the recipe.',
    'Workers, mostly. They want it fast, warm and under a cloth, and they want it to last till four.',
  ],
  high: [
    'Up here a loaf rises taller in the oven. We bake it shorter on purpose, so it fits in an elder\'s bread bin.',
    'My customers are mostly past ninety. They want a soft crust, a small loaf, and ten minutes of talk with it.',
    'At this weight the crumb comes up open. The elders say the bread was better at the rim. They say it every morning.',
    'Half a g. You can carry four loaves up here and feel like you are carrying two. Nobody buys four.',
  ],
};
const HEELS = [
  "You take a heel from the basket. Yesterday's, and still good.",
  'A heel of a batard, crust on three sides. The basket is free; the card on it says so twice.',
  'The end of a boule, floured. It is the best part, and they give it away.',
  'A heel of the tin loaf, square and soft. Somebody has already pulled the middle out of the next one.',
  'You take the smallest heel. The basket is for whoever comes in after you as well.',
];
const HEELS_AGAIN = ['One heel each, the keeper says without looking up. The basket is for the next person too.', 'You have had your heel. The basket looks at you.', 'The heels are free, not endless.', 'Another heel. The keeper lets it go, this once.'];
const CLOSED = [
  'The counter is wiped and the lids are stacked. The ovens are holding warm. Bread from four in the morning.',
  'A card on the case: Back at four. The heels are in the basket by the door.',
  'Nobody at the counter. A cloth lies over the case, and the board says four.',
  'Closed between eight and ten. The night loaf is from ten until it is gone.',
];
const BOARD = [
  'The board is chalked in a careful hand. The bottom line has been rubbed out and written again so often the slate is pale there.',
  'Somebody has drawn a loaf beside the prices, scored once, with steam lines. The steam is the one thing in the drawing that is wrong: it never gets the chance.',
  'The prices have not changed in years. Bread is starch and a warm shelf, and nobody has ever made money from either.',
  'Under the prices, smaller: Cloths back, please. We count the cloths, not the loaves.',
];

export async function buildBaker(s, lot, plan, game, tick0) {
  const M = meter(s, game, lot, tick0), tick = M.tick;
  const F = frameOf(lot), r = new Rng(lot.seed), info = plan.info, band = bandOf(info), pal = PALS[r.i(0, PALS.length - 1)];
  const iw = F.iw, D = F.D, H = F.H, bq = F.bq;
  const bs = r.sign(), gs = -bs, doorSide = r.i(-1, 1);
  const SH = shell(s, F, lot, { floor: pal.floor, wall: pal.wall, wallMat: 'plaster', dado: { h: 1.2, mat: 'tile', tint: pal.dado }, skirt: pal.plinth,
    frame: pal.frame, plinth: pal.plinth, awning: pal.awning, sign: pal.sign, emblem: 'loaf', doorLx: doorSide * (iw - 1.5), beam: '#8a5a32', felt: pal.felt, awningOn: true, pipeSide: bs,
    backWall: { dado: { h: 2.2, mat: 'tile', tint: pal.dado } }, frieze: pal.accent, glow: { sky: '#ffd8a8', ground: '#d9a070', power: 0.2 } });
  const doorLx = SH.doorLx, clip = SH.clip;
  const kname = keeperName(r), who = { name: kname, colour: '#e8a070' };
  await tick();

  // ---- the window beds: baskets, a plait under a dome, a steamer stack, linen ----
  // one dome in the whole window (the plait under it), steamers, then baskets; the lamp over the wider bed
  let slot = r.i(0, 3), domed = false, steam = 0, wide = null;
  for (const [l0, l1] of SH.beds) {
    const y = windowBed(s, F, l0, l1, { body: pal.frame, valance: pal.accent });
    const n = Math.max(1, Math.floor((l1 - l0) / 0.62));
    if (!wide || l1 - l0 > wide[1] - wide[0]) wide = [l0, l1];
    for (let i = 0; i < n; i++) {
      const x = l0 + (i + 0.5) * (l1 - l0) / n; let k = (slot++) % 4;
      if (k === 1 && domed) k = 0; if (k === 3 && steam >= 2) k = 2;
      if (k === 1) { domed = true; const w = F.L(x, 0.5); dome(s, w[0], y, w[1], 0.15, 0.19); F.prop(s, 'food.loaf', x, y + 0.03, 0.5, 0.4, { kind: 'plait', crust: '#c07a36' }); }
      else if (k === 3) { steam++; F.prop(s, 'food.steamer', x, y, 0.5, 0, { r: 0.13, n: 3 }); }
      else F.draw(s, 'detail', (g) => basketL(g, x, y, 0.5, 0.46, 0.34, k === 0 ? 'boule' : 'batard', { cover: k === 2 ? LINEN : null, crust: CRUSTS }));
    }
  }
  if (wide) F.lamp(s, 'spot', (wide[0] + wide[1]) / 2, H - 0.02, 0.5, { clip: SH.spill, cone: [44, 18], power: 0.85, K: 2900 });
  F.prop(s, 'rug', doorLx, 0, 0.75, 0, { w: 1.2, d: 0.6, mat: 'rush', a: '#8a7650', b: '#5a4a32' });
  F.prop(s, 'rug', doorLx, 0, 1.95, 0, { w: 1.0, d: 1.8, a: pal.accent, b: pal.frame }, { noCollide: true });
  await tick();

  // ---- the counter, its glass case of warm things, the heels, the scale ----
  const qc = D - 3.0, cd = 0.64, gap = 0.9, CT = 0.92;
  const c0 = gs < 0 ? -iw + gap : -iw, c1 = gs < 0 ? iw : iw - gap, cm = (c0 + c1) / 2, cw = c1 - c0;
  F.prop(s, 'shops-food.counter', cm, 0, qc, Math.PI, { w: +cw.toFixed(2), d: cd, h: CT, body: pal.frame, top: '#9a6a3c', trim: pal.accent, panel: 'tile', panelTint: pal.dado });
  const caseW = Math.min(1.7, cw - 1.9), caseLx = cm - gs * 0.3, keepLx = cm + gs * (caseW / 2 + 0.1);
  F.prop(s, 'shops-food.case', caseLx, CT, qc, Math.PI, { w: +caseW.toFixed(1), d: 0.5, h: 0.42, frame: '#b08a45', lining: '#f3e6cc', fill: 'bake' });
  const hx = gs < 0 ? c1 - 0.38 : c0 + 0.38, sx = gs < 0 ? c0 + 0.35 : c1 - 0.35;
  F.draw(s, 'detail', (g) => {
    basketL(g, hx, CT, qc - 0.05, 0.46, 0.38, 'batard', { crust: ['#9a5a28', '#8a4e22'], cane: '#a8784a', liner: '#e6d2b0' });
    // paper bags and a cone of string by the scale
    g.mat('paper', '#c9a87a'); for (let i = 0; i < 8; i++) g.box(sx - 0.1 + (i % 2) * 0.006, CT + i * 0.006, qc + 0.05, sx + 0.1, CT + i * 0.006 + 0.005, qc + 0.3, { faces: 'yYxXzZ' });
    g.mat('weave', pal.accent); g.lathe(sx + 0.16, qc - 0.14, [[0.034, CT], [0.026, CT + 0.07], [0.008, CT + 0.11]], { segs: 8 });
  });
  F.prop(s, 'food.scale', sx, CT, qc - 0.12, Math.PI, { kind: 'dial', col: '#efe2c4' });
  // between the case and the heels: the mother in her crock, a steamer stack, a cake under a dome
  const mx = (caseLx + (gs < 0 ? 1 : -1) * caseW / 2 + hx) / 2;
  F.draw(s, 'detail', (g) => { crockL(g, mx, CT, qc + 0.1, 0.1, 0.24, '#4a5a6a', 'cloth', LINEN); g.mat('wood', '#c9a46a'); g.tube([[mx + 0.06, CT + 0.2, qc + 0.06], [mx + 0.1, CT + 0.34, qc + 0.0]], 0.008, { segs: 4 }); });
  F.prop(s, 'food.steamer', mx, CT, qc - 0.16, 0.4, { r: 0.12, n: 2 });
  F.sign(s, { kind: 'plate', text: 'Free', lines: ["yesterday's heels"] }, hx, CT + 0.035, qc - cd / 2 - 0.045, Math.PI, { w: 0.1, h: 0.046, board: false });
  // two enamel pendants low over the counter
  for (const dx of [-0.26, 0.26]) { const x = cm + dx * cw; F.prop(s, 'shops-food.shade', x, H, qc, 0, { L: 1.0, col: pal.accent }); F.lamp(s, 'bulb', x, H - 1.1, qc, { clip, power: 0.8, K: 2700, range: 3.8 }); }
  await tick();

  // ---- the bread wall: a low cupboard, three shelves of loaves above it ----
  const qb0 = 1.15, Lb = Math.max(1.6, Math.min(3.2, qc - 0.75 - qb0)), qbm = qb0 + Lb / 2, bx = bs * (iw - 0.27);
  F.prop(s, 'shops-food.cupboard', bs * (iw - 0.26), 0, qbm, -bs * Math.PI / 2, { w: +Lb.toFixed(1), h: 0.85, d: 0.5, body: pal.frame, top: '#9a6a3c' });
  F.prop(s, 'shops-food.shelf', bs * (iw - 0.18), 0.85, qbm, -bs * Math.PI / 2, { w: +Lb.toFixed(1), h: 1.4, d: 0.34, n: 4, wood: '#9a6a3c', lip: pal.accent, fill: 'loaves', seed: r.i(0, 3) });
  // a glow strip under the cornice, the way the Ladle Row bakery lights its loaves
  F.draw(s, 'deco', (g) => { g.mat('diffuser', '#fff1d8', { emissive: 1.0, lamp: true }); g.box(bx - bs * 0.16 - 0.015, 2.16, qb0 + 0.1, bx - bs * 0.16 + 0.015, 2.18, qb0 + Lb - 0.1, { faces: 'yxX' }); });
  F.light(s, bx - bs * 0.2, 2.12, qb0 + 0.15, { to: [bx - bs * 0.2, 2.12, qb0 + Lb - 0.15], type: 'tube', K: 2900, color: '#ffd9a8', power: 2.4, range: 2.6, radius: 0.04, clip, lamp: true });
  // baskets of rolls on top
  F.draw(s, 'detail', (g) => { for (let i = 0; i < 2; i++) basketL(g, bx - bs * 0.02, 2.25, qb0 + Lb * (0.25 + i * 0.5), 0.3, 0.42, 'roll', { cover: i ? null : '#e6d2b0' }); });
  await tick();

  // ---- the other wall: a bench to wait on, the board, the notice for the night loaf ----
  const ox = -bs * (iw - 0.3), qbe = Math.min(qc - 1.4, 2.3);
  F.prop(s, 'bench', ox, 0, qbe, bs * Math.PI / 2, { w: 1.4, back: true, wood: '#9a6a3c', metal: pal.plinth }, { spot: { tags: ['shop', 'baker', 'wait'] } });
  const board = { kind: 'notice', title: band === 'high' ? 'Soft and small' : band === 'low' ? 'Warm now' : 'Today', lines: ['Country boule · 0.70', 'Batard · 0.60', 'Tin loaf · 0.50', 'Sugar bun · 0.40', "Heels · free", 'Night loaf · from ten'] };
  F.sign(s, board, -bs * (iw - 0.01), 1.78, qbe, bs * Math.PI / 2, { w: 0.2, h: 0.28 });
  // tall floor baskets of batards standing on end, by the window
  F.draw(s, 'furniture', (g) => {
    for (let i = 0; i < 2; i++) {
      const x = -bs * (iw - 0.28), q = 0.95 + i * 0.42; g.mat('cane', i ? '#b48a52' : '#a8784a'); g.cyl(x, 0, q, 0.17, 0.5, { segs: 10, r1: 0.19, capTop: false });
      g.mat('weave', LINEN); g.cyl(x, 0.44, q, 0.175, 0.02, { segs: 10 });
      for (let k = 0; k < 4; k++) { const a = k * 1.6 + i; g.push(); g.move(x + Math.cos(a) * 0.08, 0.62, q + Math.sin(a) * 0.08); g.rotZ(0.15 * Math.cos(a)); g.rotX(0.15 * Math.sin(a)); g.mat('plaster', CRUSTS[(k + i) % 4], { rough: 0.1 }); g.ball(0, 0, 0, 0.055, 0.24, 0.05, { segs: 7, rings: 4 }); g.pop(); }
    }
  });
  F.solid(s, -bs * iw, 0, 0.75, -bs * (iw - 0.48), 0.6, 1.6);
  plateRail(s, F, -bs, qbe + 1.0, Math.min(qc - 0.6, qbe + 2.6), 2.05, { wood: '#8a5a32', seed: lot.seed });
  // the stall in the middle: buns and puffs under linen, a cake under glass
  const stLx = (doorLx > 0.3 ? -1 : doorLx < -0.3 ? 1 : bs) * Math.min(1.35, iw - 2.0), stQ = Math.max(2.0, qc - 2.3);
  F.prop(s, 'food.stall', stLx, 0, stQ, Math.PI, { w: 1.3, d: 0.62, h: 0.74, cloth: pal.accent, trim: '#f3e6cc', wood: '#9a6a3c' });
  F.draw(s, 'detail', (g) => { basketL(g, stLx - 0.33, 0.74, stQ + 0.05, 0.44, 0.34, 'bun', { cover: LINEN, crust: ['#b86a2c'] }); basketL(g, stLx + 0.25, 0.74, stQ - 0.08, 0.4, 0.3, 'roll', { crust: ['#c08446', '#b8763a'] }); });
  { const w = F.L(stLx + 0.3, stQ + 0.14); dome(s, w[0], 0.74, w[1], 0.11, 0.14);
    F.draw(s, 'detail', (g) => { const x = stLx + 0.3, q = stQ + 0.14, y = 0.766; g.mat('plaster', '#f0d27a', { rough: 0.2 }); g.lathe(x, q, [[0, y], [0.075, y], [0.077, y + 0.04], [0.068, y + 0.05], [0, y + 0.052]], { segs: 12 }); }); }
  F.lamp(s, 'globe', stLx * 0.4, H, stQ, { drop: 0.75, K: 2700, power: 0.7, clip, range: 5 });
  await tick();

  // ---- the bakehouse: ovens under a hood, the proving rack, the bench, sacks and tins ----
  const ovLx = -bs * 0.35, ovW = Math.min(1.6, iw - 1.1), ovQ = bq - 0.47;
  F.prop(s, 'food.oven', ovLx, 0, ovQ, Math.PI, { w: +ovW.toFixed(1), d: 0.9, decks: 3, body: '#d6cfc2', trim: pal.frame });
  F.draw(s, 'structure', (g) => {
    g.mat('brushed', '#b9b2a6', { rough: 0.05 }); g.box(ovLx - ovW / 2 - 0.15, 2.38, bq - 1.05, ovLx + ovW / 2 + 0.15, 2.5, bq, { faces: 'xXyzZ' });
    g.box(ovLx - ovW / 2 + 0.05, 2.5, bq - 0.75, ovLx + ovW / 2 - 0.05, 2.7, bq, { faces: 'xXz' });
    g.box(ovLx - 0.2, 2.7, bq - 0.45, ovLx + 0.2, H, bq, { faces: 'xXz' });
  });
  F.light(s, ovLx, 1.0, ovQ - 0.7, { color: '#ff9a4a', power: 1.2, range: 2.6, radius: 0.3, clip });
  F.prop(s, 'shops-food.rack', -bs * (iw - 0.42), 0, bq - 0.4, Math.PI, { fill: 'proof', n: 6 });
  F.prop(s, 'shops-food.bench', bs * (iw - 0.4), 0, bq - 0.95, -bs * Math.PI / 2, { w: 1.5, d: 0.72 });
  const skx = bs * (iw - 1.25);
  for (let i = 0; i < 2; i++) F.prop(s, 'food.sack', skx - bs * i * 0.42, 0, bq - 0.28, r.f(-0.3, 0.3), { tint: i ? '#c9ae7a' : '#b99c6c', band: i ? null : pal.accent, h: 0.6, r: 0.19 });
  F.draw(s, 'deco', (g) => { // a shelf of tins over the sacks, a linen airer over the bench
    g.mat('wood', '#9a6a3c'); g.box(skx - bs * 0.75, 1.75, bq - 0.3, skx + bs * 0.3, 1.78, bq, { faces: 'yYz' });
    for (let i = 0; i < 4; i++) { g.mat('paint', ['#2f6f73', pal.accent, '#d6a640', '#33407a'][i]); g.cyl(skx + bs * 0.15 - bs * i * 0.26, 1.78, bq - 0.14, 0.075, 0.2, { segs: 8 }); }
    // two long peels hung on the back wall beside the oven, blades up
    for (let i = 0; i < 2; i++) { const x = ovLx - bs * (ovW / 2 + 0.3 + i * 0.32); g.mat('wood', i ? '#c9a46a' : '#b8925a'); g.box(x - 0.018, 0.5, bq - 0.04, x + 0.018, 1.95, bq - 0.01, { faces: 'xXzYy' }); g.box(x - 0.14, 1.95, bq - 0.035, x + 0.14, 2.32, bq - 0.02, { faces: 'xXzYy' }); }
    g.mat('cast', '#3a3430'); g.box(ovLx - bs * (ovW / 2 + 0.15) - 0.4, 1.9, bq - 0.06, ovLx - bs * (ovW / 2 + 0.15) + 0.4, 1.92, bq - 0.01, { faces: 'yYz' });
  });
  F.draw(s, 'deco', (g) => { // the linen airer over the work bench, on two cords
    const x = bs * (iw - 0.5), q0 = bq - 1.7, q1 = bq - 0.25;
    g.mat('weave', '#d8cdb0'); for (const q of [q0 + 0.1, q1 - 0.1]) g.tube([[x, H, q], [x, 2.45, q]], 0.004, { segs: 3, caps: false });
    g.mat('wood', '#c9a46a'); for (const dx of [-0.2, 0, 0.2]) g.box(x + dx - 0.015, 2.43, q0, x + dx + 0.015, 2.46, q1, { faces: 'xXyYzZ' });
    const cols = [LINEN, '#e8dcc0', pal.accent, LINEN, '#d9c79a'];
    for (let i = 0; i < 4; i++) { const qa = q0 + 0.1 + i * 0.36, dz = [-0.2, 0, 0.2][i % 3]; g.mat('weave', cols[(i + lot.seed) % cols.length]); g.sheet([x + dz, 2.43, qa], [x + dz, 2.43, qa + 0.3], [x + dz + 0.01, 2.1 - (i % 2) * 0.08, qa + 0.3], [x + dz + 0.01, 2.1 - (i % 2) * 0.08, qa], { nu: 2, nv: 1, sag: 0.01 }); }
  });
  await tick();

  // ---- people ----
  F.spot(s, 'counter', keepLx, 0, qc + 0.72, Math.PI, { tags: ['shop', 'baker'] });
  F.spot(s, 'work', ovLx, 0, ovQ - 0.8, 0, { tags: ['work', 'bake', 'baker'] });
  F.spot(s, 'work', bs * (iw - 1.15), 0, bq - 0.95, bs * Math.PI / 2, { tags: ['work', 'knead', 'baker'] });
  F.spot(s, 'customer', caseLx, 0, qc - 0.85, 0, { tags: ['shop', 'baker'] });
  F.spot(s, 'customer', hx, 0, qc - 0.8, 0, { tags: ['shop', 'baker'] });
  const pLx = Math.abs(stLx - doorLx) < 1.2 ? doorLx - Math.sign(stLx - doorLx || 1) * 0.4 : doorLx;
  const qLx = (pLx + caseLx) / 2;
  for (let k = 1; k <= 3; k++) { const q = qc - 0.85 - k * 0.72; if (q < 1.3) break; F.spot(s, 'queue', qLx, 0, q, 0, { tags: ['shop', 'baker', 'queue'] }); }
  F.spot(s, 'browse', bs * (iw - 1.0), 0, qbm - 0.5, bs * Math.PI / 2, { tags: ['shop', 'baker'] });
  F.spot(s, 'browse', bs * (iw - 1.0), 0, qbm + 0.6, bs * Math.PI / 2, { tags: ['shop', 'baker'] });
  F.spot(s, 'browse', stLx, 0, stQ - 0.75, 0, { tags: ['shop', 'baker'] });
  F.path(s, [[doorLx, -0.7], [doorLx, 1.2], [pLx, 2.0], [qLx, qc - 1.5], [caseLx, qc - 0.85]], { width: 1.1 });
  const gx = gs * (iw - gap / 2);
  F.path(s, [[caseLx, qc - 0.85], [gx, qc - 0.85], [gx, qc + 0.75], [keepLx, qc + 0.72], [ovLx, ovQ - 0.8]], { width: 0.8 });
  F.path(s, [[pLx, 2.0], [bs * (iw - 1.0), qbm]], { width: 0.9 });

  // ---- things to do ----
  const lines = (pool, n) => pickN(new Rng(lot.seed + pool.length), pool, n);
  const myAsk = ASK[r.i(0, ASK.length - 1)], myBand = BAND[band][r.i(0, 3)];
  const open = () => isOpen(game, DAY) || isOpen(game, NIGHT);
  F.interact(s, caseLx, 1.1, qc - 0.5, { radius: 1.0, prompt: () => (open() ? 'Buy bread' : 'The counter'), onUse: async (gm) => {
    if (!open()) { await say(gm, kname, [CLOSED[(lot.seed >>> 3) % CLOSED.length]]); return; }
    const night = isOpen(gm, NIGHT);
    await buy(gm, F, lot.name, night ? 'The night loaf, from the hatch. Cloths back, please.' : 'Lids on the warm things. Heels free.', MENU, who, band);
  } });
  F.interact(s, keepLx, 1.5, qc + 0.45, { radius: 1.25, kind: 'talk', prompt: 'Talk to ' + kname, onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, ['Nobody behind the counter. The ovens are holding, and the board says ' + (hourOf(gm) < 4 ? 'four.' : 'ten, for the night loaf.')]); return; }
    const h = hourOf(gm), extra = isOpen(gm, NIGHT) ? ['You are up late. The night loaf is just out. The crews come at eleven, so you are early, which is the best time.'] : h < 7 ? ['You are up early. The first batch is still under its cloths.'] : [];
    await say(gm, who, extra.concat(myAsk, [myBand]));
  } });
  F.interact(s, hx, 1.0, qc - 0.45, { radius: 0.75, prompt: 'Take a heel', onUse: async (gm) => {
    const key = 'heel:' + lot.id;
    if (gm.flags[key]) { await say(gm, lot.name, [HEELS_AGAIN[(lot.seed >>> 5) % HEELS_AGAIN.length]]); return; }
    gm.flags[key] = true; if (gm.sfxAt) gm.sfxAt('paper', s.frame, F.L(hx, qc)[0], 1, F.L(hx, qc)[1]);
    await say(gm, lot.name, [HEELS[(lot.seed >>> 7) % HEELS.length]]);
  } });
  F.interact(s, -bs * (iw - 0.7), 1.6, qbe + 0.3, { radius: 1.1, prompt: 'Read the board', onUse: async (gm) => {
    const h = hourOf(gm), when = isOpen(gm, DAY) ? 'Open till ' + hourWord(DAY[1]) + ', and again at ' + hourWord(NIGHT[0]) + ' for the night loaf.' : isOpen(gm, NIGHT) ? 'The night loaf is out. The hatch is open till ' + hourWord(NIGHT[1]) + '.' : 'Closed. Bread from ' + hourWord(h >= 20 ? NIGHT[0] : DAY[0]) + '.';
    await say(gm, lot.name, [board.title + ': country boule 0.70, batard 0.60, tin loaf 0.50, sugar bun 0.40, croissant 0.55. Heels free.', lines(BOARD, 1)[0], 'At the bottom: the night loaf is out at ten and again at two, for the lamp-night crews. Knock at the hatch. Bring the cloth back. ' + when]);
  } });
  s.loop('kitchen', ...(() => { const w = F.L(ovLx, ovQ - 0.6); return [w[0], 1.0, w[1]]; })(), { vol: 0.16, radius: 6 });
  s.zoneBox({ id: lot.id, place: 'city-shop', box: [lot.x0, -0.5, lot.z0, lot.x1, 3.4, lot.z1], name: lot.name, sub: info.name + ' · ' + (lot.onCourt ? 'on the court' : F.o.alongX ? info.avenue : info.street), ambience: 'shop', reverb: 'room', cell: info.key, trade: lot.trade, front: lot.front });
  void prop; void note; void loafL;
  M.done(F);
}
