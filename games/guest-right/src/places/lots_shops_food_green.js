// The generated greengrocer (shop.greens) and herb shop (shop.herbs): things that grow under lamps.
// Greens: lit glass cases down both walls, a glass case of tomatoes in the middle, one tomato under a dome with its own
// lamp, a brass balance at the counter, everything sold by the gram. Herbs: staged benches of pots under grow bars,
// bundles drying overhead, a jug of host's sprigs tied with green thread, cuttings in jars, a potting bench at the back.
import { defineProp } from '../world/props.js';
import { Rng, hashStr, shadeHex } from '../core/util.js';
import { say, note } from '../city/lots.js';
import { dome } from './food_parts.js';
import { frameOf, shell, windowBed, plateRail, counterAcross, shopPaths, queueSpots, potL, jarL, crockL, keeperName, bandOf, isOpen, hourOf, hourWord, buy, meter, LINEN, BRASS } from './lots_shops_food_kit.js';

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------
// A lit growing case: a cupboard base, two or three shelves each lit from beneath the one above, greens on every shelf,
// glazed doors (or open, p.open). Front toward +z. p: { w, h, d, n, frame, back, kind: 'greens' | 'herbs' | 'shoots', seed, open }
defineProp('shops-food.growcase', (g, p) => {
  const w = p.w || 1.8, h = p.h || 2.1, d = p.d || 0.5, n = p.n || 3, fr = p.frame || '#1f4a36', rng = new Rng(hashStr('gc' + (p.kind || '') + (p.seed || 0) + w));
  g.mat('paint', fr, { rough: -0.08 });
  g.box(-w / 2, 0, -d / 2, -w / 2 + 0.05, h, d / 2, { faces: 'xXzZ' }); g.box(w / 2 - 0.05, 0, -d / 2, w / 2, h, d / 2, { faces: 'xXzZ' });
  g.box(-w / 2, 0.06, -d / 2, w / 2, 0.62, d / 2, { faces: 'zZY' });
  g.mat('paint', shadeHex(fr, 0.6)); g.box(-w / 2 + 0.03, 0, -d / 2 + 0.03, w / 2 - 0.03, 0.06, d / 2 - 0.04, { faces: 'zZ' });
  g.mat('paint', shadeHex(fr, 1.25)); for (let i = 0; i < Math.max(1, Math.round(w / 0.6)); i++) { const m = Math.max(1, Math.round(w / 0.6)), x0 = -w / 2 + 0.08 + i * (w - 0.16) / m + 0.03, x1 = -w / 2 + 0.08 + (i + 1) * (w - 0.16) / m - 0.03; g.box(x0, 0.12, d / 2, x1, 0.56, d / 2 + 0.012, { faces: 'xXyYZ' }); }
  g.box(-w / 2 - 0.03, h - 0.08, -d / 2, w / 2 + 0.03, h, d / 2 + 0.04, { faces: 'xXyYZ' });
  g.mat('paint', p.back || '#eef2e4'); g.box(-w / 2 + 0.05, 0.62, -d / 2, w / 2 - 0.05, h - 0.08, -d / 2 + 0.012, { faces: 'Z' });
  const ys = []; for (let i = 0; i < n; i++) ys.push(0.62 + i * (h - 0.7) / n);
  for (let si = 0; si < n; si++) {
    const y = ys[si], top = si + 1 < n ? ys[si + 1] : h - 0.08;
    if (si > 0) { g.mat('cast', BRASS, { rough: -0.1 }); g.box(-w / 2 + 0.05, y - 0.02, -d / 2, w / 2 - 0.05, y, d / 2 - 0.02, { faces: 'yYZ' }); }
    // the lamp under the shelf above
    g.mat('diffuser', p.kind === 'herbs' ? '#f4fff0' : '#fff6e6', { emissive: 2.2, lamp: true }); g.box(-w / 2 + 0.1, top - 0.035, -0.05, w / 2 - 0.1, top - 0.02, 0.05, { faces: 'y' });
    let x = -w / 2 + 0.12;
    while (x < w / 2 - 0.12) {
      const k = p.kind === 'herbs' ? 1 : p.kind === 'shoots' ? 2 : rng.i(0, 3);
      if (k === 0) { // a tray of cut-and-come leaves
        g.mat('wood', '#8a6a48'); g.box(x - 0.01, y, -0.14, x + 0.3, y + 0.05, 0.14, { faces: 'xXzZY' });
        g.mat('plain', rng.pick(['#5e9a3a', '#7fb04a', '#4f8a3a', '#8a4a6a']), { rough: 0.05 }); for (const dx of [0.06, 0.2]) for (const dz of [-0.07, 0.07]) g.ball(x + dx, y + 0.06, dz, 0.07, 0.035, 0.065, { segs: 6, rings: 2, bottom: -0.3 });
        x += 0.34;
      } else if (k === 1) { potL(g, x + 0.06, y, rng.f(-0.08, 0.08), 0.06, { rng, size: 0.18, n: 3, pot: rng.pick(['#b8613d', '#a3563a', '#c9734a']), leaf: rng.pick(['#ffffff', '#e6ffd8', '#d8f0c8']), layer: rng.chance(0.3) ? 'leafA' : 'leafB' }); x += 0.15; }
      else if (k === 2) { g.mat('cane', '#d9b98a'); g.box(x, y, -0.09, x + 0.2, y + 0.04, 0.09, { faces: 'xXzZY' }); g.mat('leafB', '#e8ffd0', { sway: 0.2 }); for (let c = 0; c < 3; c++) g.card(x + 0.04 + c * 0.06, y + 0.035, 0, 0.1, 0.09, c * 0.9, {}); x += 0.24; }
      else { // a lettuce in its square pot
        g.mat('glaze', '#3d6f8a', { rough: -0.2 }); g.box(x, y, -0.06, x + 0.12, y + 0.1, 0.06, { faces: 'xXzZ' });
        g.mat('plain', rng.pick(['#5e9a3a', '#6aa840', '#8ab84a']), { rough: 0.05 }); g.ball(x + 0.06, y + 0.15, 0, 0.09, 0.07, 0.09, { segs: 7, rings: 3 }); x += 0.17;
      }
    }
  }
  const glass = [];
  if (!p.open) {
    const m = Math.max(2, Math.round(w / 0.7));
    g.mat('cast', BRASS, { rough: -0.12 });
    for (let i = 0; i <= m; i++) { const x = -w / 2 + 0.05 + i * (w - 0.1) / m; g.box(x - 0.012, 0.62, d / 2 - 0.01, x + 0.012, h - 0.08, d / 2 + 0.01, { faces: 'xXZ' }); }
    for (let i = 0; i < m; i++) { const x0 = -w / 2 + 0.05 + i * (w - 0.1) / m + 0.012, x1 = -w / 2 + 0.05 + (i + 1) * (w - 0.1) / m - 0.012; glass.push([x0, 0.62, d / 2, x1, h - 0.08, d / 2, { opacity: 0.1 }]); }
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], glass, tier: 's' };
});

// A stepped bench of pots: three tiers, a lamp bar on two posts above it. Front toward +z. p: { w, wood, seed, flowers }
defineProp('shops-food.potbench', (g, p) => {
  const w = p.w || 1.8, wood = p.wood || '#8a6a48', rng = new Rng(hashStr('pb' + w + (p.seed || 0)));
  const tiers = [[0.42, 0.18], [0.72, 0.0], [1.02, -0.18]];
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.03, 0, -0.3, sx * w / 2 + 0.03, 1.02, 0.3, { faces: 'xXzZY' });
  for (const [y, z] of tiers) g.box(-w / 2, y - 0.03, z - 0.13, w / 2, y, z + 0.13, { faces: 'yYzZ' });
  // the lamp bar
  g.mat('cast', '#3a3632'); for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.02, 1.02, -0.28, sx * w / 2 + 0.02, 1.95, -0.24, { faces: 'xXzZ' });
  g.box(-w / 2, 1.92, -0.3, w / 2, 1.97, 0.12, { faces: 'xXyYzZ' });
  g.mat('diffuser', '#f6ffe8', { emissive: 2.4, lamp: true }); g.box(-w / 2 + 0.06, 1.91, -0.22, w / 2 - 0.06, 1.92, 0.06, { faces: 'y' });
  const POTS = ['#b8613d', '#a3563a', '#c9734a', '#3d6f8a', '#e6dcc4'];
  for (const [y, z] of tiers) {
    let x = -w / 2 + 0.1;
    while (x < w / 2 - 0.08) { const r = rng.f(0.05, 0.07); potL(g, x, y, z + rng.f(-0.03, 0.03), r, { rng, size: r * rng.f(2.6, 3.6), n: 3, pot: rng.pick(POTS), leaf: rng.pick(['#ffffff', '#e6ffd8', '#d8f0c8', '#f0e0f0']), layer: rng.pick(['leafB', 'leafB', 'leafA', 'fern']), flower: p.flowers && rng.chance(0.15) ? rng.pick(['#8fb0ff', '#f0f0ff', '#ffd0e0']) : null }); x += r * 2 + 0.04; }
  }
  return { solid: [[-w / 2, 0, -0.3, w / 2, 1.05, 0.3]], tier: 's' };
});

// ---------------------------------------------------------------------------------------------------------------
// Greens
// ---------------------------------------------------------------------------------------------------------------
const GPALS = [
  { frame: '#1f4a36', plinth: '#173a2a', accent: '#c9566a', wall: '#d6e2c4', dado: '#eef0e2', floor: ['terrazzo', '#d8d0bc'], awning: ['#1f4a36', '#eef0e2'], sign: ['#1f4a36', '#f3efe0', '#d8b25a'], felt: ['#c9566a', '#1f4a36', '#d8b25a'] },
  { frame: '#2f3f6e', plinth: '#232f52', accent: '#6aa840', wall: '#e8d8b8', dado: '#dfe6ee', floor: ['pattern', '#d8ccb4'], awning: ['#6aa840', '#f0ead8'], sign: ['#2f3f6e', '#f1ead6', '#9fd06a'], felt: ['#6aa840', '#2f3f6e', '#e0b04a'] },
  { frame: '#5a2e3a', plinth: '#40202a', accent: '#5e9a3a', wall: '#f2e6d6', dado: '#e8dccc', floor: ['tile', '#cdbfa6'], awning: ['#5e9a3a', '#f2e6d6'], sign: ['#5a2e3a', '#f6e7d0', '#a8d070'], felt: ['#5e9a3a', '#5a2e3a', '#e8c26a'] },
];
const GMENU = [
  { id: 'tomato', name: 'A tomato', desc: 'About a hundred and twenty grams of red, alone on its cloth. Half a kay.', price: 0.5, give: 'tomato', line: 'In a cloth. Cut it into as many pieces as there are people.' },
  { id: 'cherry', name: 'A cherry tomato', desc: 'Warm from the lamp. Eat it whole, here.', price: 0.1, line: 'Eat it here. It is better warm from the lamp.' },
  { id: 'leaves', name: 'Leaves for a salad, 150 grams', desc: 'Cut from the cases while you wait, wrapped in a damp cloth.', price: 0.59, line: 'A hundred and fifty grams. I cut them; the plants go on growing.' },
  { id: 'shoots', name: 'Pea shoots, 40 grams', desc: 'Sweet and green, a handful in tissue.', price: 0.16, line: 'Forty grams on the balance, and a shoot over for luck.' },
  { id: 'cucumber', name: 'A cucumber', desc: 'Cold and firm. Cut it thick and salt it.', price: 0.45, line: 'Up from the Garden decks on the night carts. Cut it thick.' },
  { id: 'radish', name: 'A radish', desc: 'For eating with butter, slowly.', price: 0.3, line: 'With butter. Slowly.' },
  { id: 'herbs', name: 'Herbs, 5 grams', desc: 'Basil, shiso, coriander or chives, cut while you wait.', price: 0.03, line: 'Five grams. The balance barely moves.' },
  { id: 'strawberries', name: 'Tansy strawberries, a punnet', desc: 'Through the Gate on the first glide. Gone by eleven.', price: 0.9, when: (h) => h < 11, line: 'From Tansy this morning. You are lucky: it is not eleven yet.' },
  { id: 'cress', name: 'A tray of cress for a naming', desc: 'Grown on a cloth in a week. The table cuts it with scissors.', price: 0.25, bands: ['low'], line: 'For the naming. Cut it at the table, everybody a snip.' },
  { id: 'shiso-leaf', name: 'One shiso leaf', desc: 'A single leaf in tissue, for wrapping one rice ball.', price: 0.04, bands: ['high'], line: 'One leaf. Wrapped as if it were the tomato.' },
];
const GASK = [
  ['Where did you sleep, and have you eaten? Then look all you like. Point; do not tap the glass.', 'Everything in the cases is still growing. I cut it when you buy it, by the gram.'],
  ['A leaf costs more in lamplight than in anything else. The cases run twelve hours a day as bright as a court, and the meter does not care that it is lettuce.', 'Four thousandths of a kay a gram, the salad leaves. A side salad is about a hundred and fifty grams.'],
  ['People buy one tomato here the way people somewhere else would buy a ring. They carry it home in a cloth and cut it into as many pieces as there are people.', 'Half a kay. About a hundred and twenty grams of red.'],
  ['The cucumbers come up from the Garden decks in the Keel on the night carts. The leaves we grow ourselves, here, under these lamps.', 'A lit shelf costs this shop more than its rent.'],
  ['Never wash a leaf in front of a customer. They want to see it come straight off the plant.', 'I cut with scissors, never a knife. The plant goes on growing.'],
  ['Strawberries come through the Gate from Tansy on the first glide. Ninety hundredths a punnet, and they are gone by eleven.', 'Tansy grows them under its own lamps. We have never grown one here that tasted of anything.'],
];
const GBAND = {
  low: ['A family buys a tomato when there is something to mark: a naming, a homecoming, a third child\'s leave.', 'Pea shoots are the children\'s favourite. Forty grams, sixteen hundredths, and they eat them like sweets.', 'The school sends a child with a list on Thursdays. One cucumber, to be cut in eight.', 'Down here at nearly a full g the vines need tying every week. Up in the High decks they hardly need it.'],
  middle: ['Workers buy leaves on the way home and take them to the hall, so they can say they brought something.', 'Lunch is the busy hour. People come to look at the tomatoes with a coffee and buy a radish.', 'Most of my customers buy forty grams of something green twice a week. It is the cheapest way to feel rich.', 'A cucumber costs about what it costs to light a small garden for two hours. People do that sum out loud at the counter.'],
  high: ['The brass balance reads the same at any weight; that is why we keep it. A spring scale up here would cheat everyone by half.', 'Up here the elders keep their own tomato vines in bright corners. They come in to compare, not to buy.', 'The elders buy by the single leaf. One leaf of shiso, four hundredths, wrapped in tissue.', 'Most of my customers are past a hundred. They remember when this case had nothing in it but cress.'],
};
const GCLOSED = [
  'The cases are lit, because the plants do not know the shop is shut. The counter opens at eight.',
  'A cloth over the balance and the scissors in a jar. The leaves go on growing. Open at eight.',
  'Nobody at the counter. The cases glow on, a little dimmer for the night. Eight till seven.',
  'Shut. A card on the glass: The tomato is still here. So are we, at eight.',
];
const GBOARD = [
  'Under it, in smaller chalk: Lit shelves cost more than the leaves on them. Thank you for not tapping the glass.',
  'Under it, smaller: Scissors, never a knife. The plant goes on growing.',
  'At the bottom, rubbed and rewritten: Strawberries in by the first glide, gone by eleven.',
  'Under the prices, in a different hand: One tomato is a purchase. Two is a party.',
];
const HCLOSED = [
  'The bars are dimmed for the night and the pots are watered. Herbs from seven.',
  'The jug of sprigs stands in the dark with its threads hanging. Back at seven.',
  'Shut. A card on the counter: Bring herbs, not gin. Come back at seven for the herbs.',
  'Nobody behind the counter. The cuttings drink in their jars. Seven till seven.',
];
const HGIVE = [
  'Bring herbs, not gin. Take it to whoever feeds you tonight.',
  'Give it at the door, not at the table. The door is where it counts.',
  'Lay it by the cook\'s place. They will know what it means.',
  'Hold it by the thread, not the stem. It will last the evening.',
];
const TOMATO = [
  'One tomato, alone on a red cushion under a glass dome, with a lamp all of its own. A brass card: 0.50.',
  'The tomato under the dome has been turned so its best side faces the street. Somebody does that every morning.',
  'Under the dome, one tomato. There is a smear on the glass exactly where a child\'s nose would be.',
  'A tomato is half a kay. A sugar bun is forty hundredths. People who have eaten both say the tomato is better value.',
  'The cushion is velvet, worn pale in the middle where a hundred years of tomatoes have sat.',
];

export async function buildGreens(s, lot, plan, game, tick0) {
  const M = meter(s, game, lot, tick0), tick = M.tick;
  const F = frameOf(lot), r = new Rng(lot.seed), info = plan.info, band = bandOf(info), pal = GPALS[r.i(0, GPALS.length - 1)];
  const iw = F.iw, D = F.D, H = F.H, bq = F.bq, doorSide = r.i(-1, 1), gs = r.sign();
  const SH = shell(s, F, lot, { floor: pal.floor, wall: pal.wall, wallMat: 'paint', dado: { h: 1.0, mat: 'tile', tint: pal.dado }, skirt: pal.plinth, frame: pal.frame, plinth: pal.plinth,
    awning: pal.awning, sign: pal.sign, emblem: 'leaf', doorLx: doorSide * (iw - 1.5), beam: '#5a4a3a', felt: pal.felt, awningOn: true, pipeSide: -gs, frieze: pal.frame,
    glow: { sky: '#f4f0e0', ground: '#c8c0a0', power: 0.2 } });
  const doorLx = SH.doorLx, clip = SH.clip, kname = keeperName(r), who = { name: kname, colour: '#a8d070' };
  await tick();
  // window: velvet beds with cucumbers, lettuces in pots, a tomato on a cushion
  let wide = null;
  for (const [l0, l1] of SH.beds) {
    const y = windowBed(s, F, l0, l1, { body: pal.frame, cloth: '#3a5a3a', valance: pal.accent, y: 0.55 });
    if (!wide || l1 - l0 > wide[1] - wide[0]) wide = [l0, l1];
    F.draw(s, 'detail', (g) => {
      const n = Math.max(1, Math.floor((l1 - l0) / 0.45)); const rr = new Rng(lot.seed + l0 * 10);
      for (let i = 0; i < n; i++) {
        const x = l0 + (i + 0.5) * (l1 - l0) / n, k = i % 3;
        if (k === 0) { g.mat('wood', '#8a6a48'); g.box(x - 0.17, y, 0.35, x + 0.17, y + 0.03, 0.62, { faces: 'xXzZY' }); g.mat('plain', '#2f5a24', { rough: 0.05 }); for (let c = 0; c < 4; c++) g.ball(x - 0.12 + c * 0.08, y + 0.05, 0.48, 0.025, 0.022, 0.12, { segs: 6, rings: 3 }); }
        else if (k === 1) { g.mat('glaze', '#3d6f8a', { rough: -0.2 }); g.box(x - 0.07, y, 0.42, x + 0.07, y + 0.11, 0.56, { faces: 'xXzZ' }); g.mat('plain', rr.pick(['#5e9a3a', '#6aa840']), { rough: 0.05 }); g.ball(x, y + 0.17, 0.49, 0.11, 0.08, 0.11, { segs: 8, rings: 3 }); }
        else { g.mat('felt', pal.accent); g.box(x - 0.08, y, 0.42, x + 0.08, y + 0.08, 0.58, { faces: 'xXzZY' }); g.mat('plain', '#c8281c', { rough: -0.4 }); g.ball(x, y + 0.11, 0.5, 0.035, 0.029, 0.035, { segs: 10, rings: 6 }); g.mat('plain', '#4d7a2a'); g.cyl(x, y + 0.138, 0.5, 0.004, 0.012, { segs: 4 }); }
        // a row of herb pots behind, against the inside of the glass
        if (i % 2 === 0) potL(g, x + 0.2, y, 0.68, 0.055, { rng: rr, size: 0.17, n: 3, pot: rr.pick(['#b8613d', '#3d6f8a', '#e6dcc4']), layer: rr.pick(['leafB', 'leafA']), leaf: '#ffffff' });
      }
    });
  }
  if (wide) F.lamp(s, 'spot', (wide[0] + wide[1]) / 2, H - 0.02, 0.5, { clip: SH.spill, cone: [44, 18], power: 0.8, K: 3100 });
  F.prop(s, 'rug', doorLx, 0, 0.75, 0, { w: 1.2, d: 0.6, mat: 'rush', a: '#6a7650', b: '#4a5a32' });
  F.prop(s, 'rug', doorLx, 0, 1.95, 0, { w: 1.0, d: 1.8, a: pal.accent, b: pal.frame }, { noCollide: true });
  await tick();
  // the lit cases down both walls
  const qc = D - 3.0, cq0 = 1.0, cL = Math.max(1.6, Math.min(3.4, qc - 0.8 - cq0)), cqm = cq0 + cL / 2;
  for (const sd of [-1, 1]) {
    F.prop(s, 'shops-food.growcase', sd * (iw - 0.27), 0, cqm, -sd * Math.PI / 2, { w: +cL.toFixed(1), h: 2.1, d: 0.5, n: 3, frame: pal.frame, kind: sd > 0 ? 'greens' : 'shoots', seed: (lot.seed >>> 4) % 3 });
    F.light(s, sd * (iw - 0.6), 1.9, cq0 + 0.2, { to: [sd * (iw - 0.6), 1.9, cq0 + cL - 0.2], type: 'tube', K: 4000, color: '#f4f6ec', power: 2.4, range: 2.8, radius: 0.05, clip, lamp: true });
    await tick();
  }
  // the tomato case in the middle, on its cabinet
  const tLx = (doorLx > 0.3 ? -1 : doorLx < -0.3 ? 1 : gs) * Math.min(1.1, iw - 2.2), tQ = Math.max(2.1, qc - 2.4);
  F.prop(s, 'shops-food.cupboard', tLx, 0, tQ, Math.PI, { w: 1.3, h: 0.86, d: 0.6, body: pal.frame, top: '#9a6a3c' });
  F.prop(s, 'shops-food.case', tLx, 0.86, tQ, Math.PI, { w: 1.2, d: 0.52, h: 0.36, frame: BRASS, lining: '#3a5a3a', fill: 'greens', seed: lot.seed % 5 });
  await tick();
  // the counter: a brass balance, tissue, a ledger; the one tomato on its pedestal at the end, under a dome and a lamp
  const C = counterAcross(s, F, { qc, gs, look: { body: pal.frame, top: '#b98a5a', trim: BRASS, panel: 'paint', panelTint: shadeHex(pal.frame, 1.3) } });
  const CT = C.CT, servLx = C.cm - gs * 0.4, keepLx = C.cm + gs * 0.6;
  F.prop(s, 'food.scale', servLx, CT, qc - 0.05, Math.PI, { kind: 'balance', col: BRASS });
  F.draw(s, 'detail', (g) => {
    const tx = C.cm + gs * 0.35; g.mat('cast', BRASS); g.box(tx - 0.16, CT, qc - 0.02, tx - 0.15, CT + 0.2, qc + 0.12, { faces: 'xXzZ' }); g.box(tx + 0.15, CT, qc - 0.02, tx + 0.16, CT + 0.2, qc + 0.12, { faces: 'xXzZ' });
    g.push(); g.move(tx, CT + 0.12, qc + 0.05); g.rotZ(Math.PI / 2); g.mat('paper', '#f4efe4'); g.cyl(0, -0.15, 0, 0.06, 0.3, { segs: 10 }); g.pop();
    const lx = C.wallEnd - gs * -0.45; g.mat('paper', '#e8dcc0'); g.box(lx - 0.15, CT, qc - 0.05, lx + 0.15, CT + 0.03, qc + 0.17, { faces: 'xXzZY' }); g.mat('leather', '#5a2e22'); g.box(lx - 0.155, CT + 0.03, qc - 0.055, lx + 0.155, CT + 0.04, qc + 0.175, { faces: 'xXzZY' });
    for (let i = 0; i < 3; i++) { g.mat('cane', '#d9b98a'); g.box(C.wallEnd + gs * 0.35 + gs * i * 0.24 - 0.09, CT, qc + 0.12, C.wallEnd + gs * 0.35 + gs * i * 0.24 + 0.09, CT + 0.05, qc + 0.26, { faces: 'xXzZY' }); g.mat('plain', '#c41e2a', { rough: -0.3 }); g.ball(C.wallEnd + gs * 0.35 + gs * i * 0.24, CT + 0.055, qc + 0.19, 0.07, 0.014, 0.05, { segs: 6, rings: 2, bottom: 0 }); }
  });
  const jx = C.wallEnd + gs * 0.42, jq = qc - 0.95;
  F.draw(s, 'furniture', (g) => { g.mat('wood', '#5a3e28'); g.lathe(jx, jq, [[0.16, 0], [0.12, 0.05], [0.05, 0.12], [0.045, 0.95], [0.12, 1.0], [0.15, 1.04]], { segs: 10 }); });
  F.solid(s, jx - 0.16, 0, jq - 0.16, jx + 0.16, 1.04, jq + 0.16);
  F.prop(s, 'food.cushion', jx, 1.04, jq, 0, { col: '#7c2430', w: 0.13, d: 0.13 });
  F.prop(s, 'food.tomato', jx, 1.065, jq, 0.4, { r: 0.04 });
  { const w = F.L(jx, jq); dome(s, w[0], 1.04, w[1], 0.11, 0.15); }
  F.lamp(s, 'spot', jx, H - 0.02, jq, { clip, cone: [16, 7], power: 0.5, K: 2700 });
  F.sign(s, { kind: 'plate', text: '0.50', lines: ['one tomato'] }, jx, 0.98, jq - 0.165, Math.PI, { w: 0.1, h: 0.046 });
  // the back: an open growing rack of lettuces, punnets on a shelf, a green pendant over the balance
  F.prop(s, 'shops-food.growcase', -gs * (iw - 1.3) * 0.5, 0, bq - 0.27, Math.PI, { w: +Math.min(2.6, iw).toFixed(1), h: 2.0, d: 0.46, n: 3, frame: '#7a6a50', kind: 'greens', open: true, seed: 7 });
  F.prop(s, 'shops-food.shelf', gs * (iw - 0.9), 0, bq - 0.2, Math.PI, { w: 1.4, h: 1.9, d: 0.3, n: 4, wood: '#8a6a48', fill: 'tins', seed: 2 });
  F.prop(s, 'shops-food.shade', servLx, H, qc, 0, { L: 1.05, col: pal.frame, inner: '#f8f4e0' });
  F.lamp(s, 'bulb', servLx, H - 1.15, qc, { clip, power: 0.8, K: 3000, range: 3.8 });
  plateRail(s, F, -gs, 1.0, Math.min(qc - 0.6, 3.6), 2.3, { wood: '#5a4a3a', glazes: ['#e9e2d0', '#3d6f8a', '#6b7a3a', '#d9c7a6'], seed: lot.seed });
  await tick();
  // the board
  const board = { kind: 'notice', title: 'By the gram', lines: ['Salad leaves · 0.004 a gram', 'Pea shoots · 0.16 for 40 g', 'Cucumber · 0.45', 'Radish · 0.30', 'Cherry tomato · 0.10', 'Tomato · 0.50'] };
  const bdx = -gs * (iw - 0.01), bdq = Math.min(qc - 0.7, cq0 + cL + 0.45);
  F.sign(s, board, gs * (iw - 0.01), 1.75, Math.min(qc - 0.55, cq0 + cL + 0.42), -gs * Math.PI / 2, { w: 0.2, h: 0.28 });
  void bdx; void bdq;
  // people
  F.spot(s, 'counter', keepLx, 0, qc + 0.72, Math.PI, { tags: ['shop', 'greens'] });
  F.spot(s, 'work', -gs * (iw - 1.3) * 0.5, 0, bq - 0.95, 0, { tags: ['work', 'tend', 'greens'] });
  F.spot(s, 'customer', servLx, 0, qc - 0.85, 0, { tags: ['shop', 'greens'] });
  for (const sd of [-1, 1]) { F.spot(s, 'browse', sd * (iw - 1.05), 0, cqm - 0.5, sd * Math.PI / 2, { tags: ['shop', 'greens'] }); F.spot(s, 'browse', sd * (iw - 1.05), 0, cqm + 0.6, sd * Math.PI / 2, { tags: ['shop', 'greens'] }); }
  F.spot(s, 'browse', tLx, 0, tQ - 0.85, 0, { tags: ['shop', 'greens', 'tomato'] });
  F.spot(s, 'browse', jx - gs * 0.1, 0, jq - 0.6, 0, { tags: ['shop', 'greens', 'tomato'] });
  const aisle = Math.abs(tLx - doorLx) < 1.3 ? tLx - Math.sign(tLx || 1) * 1.35 : doorLx;
  queueSpots(s, F, C, servLx, aisle, ['shop', 'greens', 'queue'], 2);
  shopPaths(s, F, C, doorLx, servLx, keepLx, [[-gs * (iw - 1.3) * 0.5, bq - 0.95]], aisle);
  F.path(s, [[aisle, 2.0], [-gs * (iw - 1.05), cqm], [gs * (iw - 1.05), cqm]], { width: 0.9 });
  // things to do
  const open = () => isOpen(game, [8, 19]);
  const ask = GASK[r.i(0, GASK.length - 1)], bl = GBAND[band][r.i(0, 3)];
  F.interact(s, servLx, 1.1, qc - 0.5, { radius: 1.0, prompt: () => (open() ? 'Buy something green' : 'The counter'), onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [GCLOSED[(lot.seed >>> 2) % GCLOSED.length]]); return; }
    await buy(gm, F, lot.name, 'Point; do not tap the glass. Everything is cut while you wait.', GMENU, who, band);
  } });
  F.interact(s, keepLx, 1.5, qc + 0.45, { radius: 1.25, kind: 'talk', prompt: 'Talk to ' + kname, onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [GCLOSED[((lot.seed >>> 2) + 1) % GCLOSED.length]]); return; }
    await say(gm, who, ask.concat([bl]));
  } });
  F.interact(s, jx, 1.1, jq - 0.3, { radius: 0.85, prompt: 'Look at the tomato', onUse: async (gm) => {
    await say(gm, lot.name, [TOMATO[(lot.seed >>> 3) % TOMATO.length], TOMATO[((lot.seed >>> 3) + 2) % TOMATO.length]]);
  } });
  F.interact(s, gs * (iw - 0.6), 1.6, Math.min(qc - 0.55, cq0 + cL + 0.42), { radius: 1.0, prompt: 'Read the board', onUse: async (gm) => {
    await say(gm, lot.name, ['By the gram: salad leaves four thousandths of a kay a gram, pea shoots sixteen hundredths for forty grams, a cucumber forty-five hundredths, a radish thirty, a cherry tomato ten. A tomato, half a kay.', GBOARD[(lot.seed >>> 5) % GBOARD.length], 'Open eight till ' + hourWord(19) + '.']);
  } });
  s.loop('hum-lamp', ...(() => { const w = F.L(0, cqm); return [w[0], 1.8, w[1]]; })(), { vol: 0.08, radius: 5 });
  s.zoneBox({ id: lot.id, place: 'city-shop', box: [lot.x0, -0.5, lot.z0, lot.x1, 3.4, lot.z1], name: lot.name, sub: info.name + ' · ' + (lot.onCourt ? 'on the court' : F.o.alongX ? info.avenue : info.street), ambience: 'shop', reverb: 'room', cell: info.key, trade: lot.trade, front: lot.front });
  void note; void hourOf; void jarL; void crockL; void LINEN;
  M.done(F);
}

// ---------------------------------------------------------------------------------------------------------------
// Herbs
// ---------------------------------------------------------------------------------------------------------------
const HPALS = [
  { frame: '#4f6a3a', plinth: '#3a4f2a', accent: '#e0a12e', wall: '#e6dcae', dado: '#4f6a3a', floor: ['planks', '#a8794f'], awning: ['#e0a12e', '#eef0dc'], sign: ['#4f6a3a', '#f3f0dc', '#e0a12e'], felt: ['#e0a12e', '#4f6a3a', '#c9552e'] },
  { frame: '#6b3a5a', plinth: '#4f2a42', accent: '#9fc46a', wall: '#f0e8dc', dado: '#6b3a5a', floor: ['tile', '#c9b89a'], awning: ['#9fc46a', '#f0e8dc'], sign: ['#6b3a5a', '#f4ead8', '#b8d880'], felt: ['#9fc46a', '#6b3a5a', '#e0a12e'] },
  { frame: '#2f6f73', plinth: '#22504f', accent: '#e8c26a', wall: '#e8d4b4', dado: '#2f6f73', floor: ['planks', '#b98a5a'], awning: ['#2f6f73', '#f2ead6'], sign: ['#2f6f73', '#f3e9cf', '#e8c26a'], felt: ['#e8c26a', '#2f6f73', '#c9552e'] },
];
const HMENU = [
  { id: 'host-sprig', name: "A host's sprig, tied", desc: 'Chervil tied with green thread, ready to give at a hall door.', price: 0.03, give: 'host-sprig', line: 'Tied. A half hitch, so the host can untie it with one hand while holding the door.' },
  { id: 'chervil', name: 'Chervil', desc: "The drum's own herb: soft, a little of aniseed.", price: 0.03, line: 'The drum\'s own. You cannot go wrong with chervil in Chervil.' },
  { id: 'sorrel', name: 'Sorrel', desc: 'Sharp and lemony, a leaf at a time.', price: 0.03, line: 'For the neighbours. Sharp, like them.' },
  { id: 'lovage', name: 'Lovage', desc: 'Strong and celery-ish. Lovage the drum is louder.', price: 0.03, line: 'Lovage. Take it to someone who will laugh.' },
  { id: 'coriander', name: 'Coriander', desc: 'Cut this morning. People either ask what it is or ask for more.', price: 0.03, line: 'Cut this morning.' },
  { id: 'shiso', name: 'Shiso', desc: 'Purple-green and minty, for wrapping rice.', price: 0.03, line: 'For a rice ball. One leaf each.' },
  { id: 'rue', name: 'Rue', desc: 'Very bitter. Bought mostly as a joke, and never eaten twice.', price: 0.03, line: 'A joke. Make sure the cook is in on it.' },
  { id: 'row-sprigs', name: 'The Row in sprigs', desc: 'One each of chervil, sorrel, lovage, borage, yarrow and rue, tied in a bundle.', price: 0.18, line: 'Six herbs, six drums. Somebody is leaving, or arriving.' },
  { id: 'cutting', name: 'A rooted basil cutting', desc: 'For a herb shelf under a home lamp. The pot is lent.', price: 0.06, line: 'The pot comes back. The basil does not have to.' },
  { id: 'chives-pot', name: 'A pot of chives for a family shelf', desc: 'Cut it every day and it keeps coming.', price: 0.12, bands: ['low'], line: 'Cut it every day. It will outlast the pot.' },
  { id: 'soft-thyme', name: 'Lemon thyme, a soft bunch', desc: 'For tea, for elders who say it helps with sleep.', price: 0.05, bands: ['high'], line: 'For the tea. It helps, or the tea does.' },
];
const HASK = [
  ['Where did you sleep, and have you eaten? Good. Then you are a guest, and a guest brings a sprig.', 'Bring herbs, not gin. Gin is too cheap to be a present. A sprig says you thought about the table.'],
  ['Three hundredths of a kay a sprig. Tied with green thread, the same price. The thread is the part people remember.', 'I tie them with a half hitch so the host can untie it with one hand while holding the door.'],
  ['Chervil for the drum, sorrel for the neighbours, lovage if you want an argument.', 'Rue is for a joke. Never take rue to a hall unless you know the cook very well.'],
  ['Everything here grows under those bars. The light is dearer than the pots, the soil and me.', 'The cuttings are lent with the pot. Bring the pot back and the next guest gets a basil.'],
  ['The ring counters lay a sprig on every cup of broth. The halls cut theirs that morning. I sell the rest of the drum its sprigs.', 'A guest who brings a sprig to a hall gets seated next to the cook. That is not a rule. It is just what happens.'],
  ['Herbs are the one green thing nearly everybody can afford. A pot on a shelf under a home lamp, and you can cut it every day.', 'Most of the block has a herb shelf a metre long. I sell the pots, and then nobody needs me, which is how it should be.'],
];
const HBAND = {
  low: ['Children come in with three hundredths for a sprig to take to their aunts. I tie theirs with two threads.', 'Down here everybody grows chives. I sell them the pot and they never come back, which is the point.', 'Families buy coriander by the bunch for the hall. The cooks send a child with a note.', 'A child once bought rue for her teacher. The teacher kept it on her desk all year.'],
  middle: ['Most of my trade is at six, people on the way to a hall with a sprig for the cook.', 'Workers buy the Row in sprigs for someone leaving. Six herbs, six drums, eighteen hundredths.', 'Lunch hour is cuttings: people with a shelf at work and a lamp nobody else uses.', 'People who work in the Keel buy basil. They say it smells of anything but the Keel.'],
  high: ['The elders buy one sprig and stay twenty minutes. That is fair: I need the talk more than the three hundredths.', 'At this weight the stems grow longer and softer. I cut them short so they stand up in a jug.', 'The elders bring their own thread. They have been tying sprigs longer than I have been alive.', 'At half a g a watering can is easy and a pot is easy. The shop is mostly a place to sit.'],
};
const TIE = [
  'A sprig of chervil, a loop of green thread, a half hitch. It takes the keeper four seconds and looks like it took forty.',
  'The keeper cuts the sprig, wets the stem in a jar, ties it with green thread and lays it on a square of tissue.',
  'Chervil, tied with green thread, the end of the thread snipped to the length of a fingernail.',
  'The keeper picks the best sprig from the jug, not the first one, and ties it as if somebody were watching. Somebody is.',
];
const CUTTINGS = [
  'Jars of water along the counter, a rooted cutting in each: basil, mint, shiso, a lemon geranium. Tags on string say who the pot belongs to when it comes back.',
  'The cuttings stand in old jam jars with the labels soaked off. The roots are white and very fine, like thread.',
  'A tray of cuttings waiting for pots. A card in pencil: Lent with the pot. The pot comes back.',
  'Every cutting here came from a pot in somebody\'s flat in the block. The keeper takes one in return for every pot lent.',
];

export async function buildHerbs(s, lot, plan, game, tick0) {
  const M = meter(s, game, lot, tick0), tick = M.tick;
  const F = frameOf(lot), r = new Rng(lot.seed), info = plan.info, band = bandOf(info), pal = HPALS[r.i(0, HPALS.length - 1)];
  const iw = F.iw, D = F.D, H = F.H, bq = F.bq, doorSide = r.i(-1, 1), gs = r.sign();
  const SH = shell(s, F, lot, { floor: pal.floor, wall: pal.wall, wallMat: 'plaster', dado: { h: 0.95, mat: 'wood', tint: pal.dado }, skirt: shadeHex(pal.dado, 0.7), frame: pal.frame, plinth: pal.plinth,
    awning: pal.awning, sign: pal.sign, emblem: 'leaf', doorLx: doorSide * (iw - 1.5), beam: '#6a4a30', felt: pal.felt, awningOn: true, pipeSide: gs, frieze: pal.accent,
    glow: { sky: '#f4f0dc', ground: '#b8a078', power: 0.2 } });
  const doorLx = SH.doorLx, clip = SH.clip, kname = keeperName(r), who = { name: kname, colour: '#b8d880' };
  await tick();
  // window: pots on stepped boards, a watering can
  let wide = null;
  for (const [l0, l1] of SH.beds) {
    const y = windowBed(s, F, l0, l1, { body: pal.frame, cloth: '#d8cdb0', valance: pal.accent });
    if (!wide || l1 - l0 > wide[1] - wide[0]) wide = [l0, l1];
    F.draw(s, 'detail', (g) => {
      const rr = new Rng(lot.seed + Math.round(l0 * 10));
      g.mat('wood', '#8a6a48'); g.box(l0 + 0.1, y, 0.5, l1 - 0.1, y + 0.16, 0.74, { faces: 'xXzZY' });
      const stp = Math.max(0.22, (l1 - l0 - 0.3) / 13); for (let x = l0 + 0.18, c = 0; x < l1 - 0.12 && c < 14; x += stp, c++) potL(g, x, y + (x * 7 % 2 < 1 ? 0.16 : 0), x * 7 % 2 < 1 ? 0.62 : 0.36, 0.06, { rng: rr, size: 0.2, n: 3, pot: rr.pick(['#b8613d', '#a3563a', '#c9734a']), layer: rr.pick(['leafB', 'leafA', 'fern']), leaf: rr.pick(['#ffffff', '#e6ffd8']) });
    });
  }
  if (wide) F.lamp(s, 'spot', (wide[0] + wide[1]) / 2, H - 0.02, 0.5, { clip: SH.spill, cone: [44, 18], power: 0.8, K: 3000 });
  F.prop(s, 'rug', doorLx, 0, 0.75, 0, { w: 1.2, d: 0.6, mat: 'rush', a: '#7a7650', b: '#5a5a32' });
  F.prop(s, 'rug', doorLx, 0, 1.95, 0, { w: 1.0, d: 1.8, a: pal.accent, b: pal.frame }, { noCollide: true });
  await tick();
  // the pot benches down both walls, under their bars
  const qc = D - 3.0, pq0 = 1.0, pL = Math.max(1.4, Math.min(3.2, qc - 0.8 - pq0)), pqm = pq0 + pL / 2;
  for (const sd of [-1, 1]) {
    F.prop(s, 'shops-food.potbench', sd * (iw - 0.34), 0, pqm, -sd * Math.PI / 2, { w: +pL.toFixed(1), wood: '#8a6a48', seed: (lot.seed >>> (sd > 0 ? 2 : 6)) % 3, flowers: sd > 0 });
    F.light(s, sd * (iw - 0.45), 1.86, pq0 + 0.15, { to: [sd * (iw - 0.45), 1.86, pq0 + pL - 0.15], type: 'tube', K: 4300, color: '#f2f8e8', power: 2.2, range: 2.6, radius: 0.05, clip, lamp: true });
    await tick();
  }
  // bundles drying on a rail across the front of the shop
  F.draw(s, 'deco', (g) => { g.mat('wood', '#6a4a30'); g.tube([[-iw + 0.6, 2.75, 1.2], [iw - 0.6, 2.75, 1.2]], 0.02, { segs: 6 }); g.mat('cast', '#3a3632'); for (const x of [-iw + 0.7, iw - 0.7]) g.box(x - 0.01, 2.75, 1.19, x + 0.01, H, 1.21); });
  for (let i = 0; i < 6; i++) { const x = -iw + 1.0 + i * (2 * iw - 2.0) / 5; F.prop(s, 'food.bundle', x, 2.73, 1.2, i * 0.7, { len: 0.06 + (i % 3) * 0.04, leaf: ['#c9d89a', '#a8c080', '#d8e0a8', '#b8c8a0'][i % 4], thread: i % 2 ? '#3f7a3a' : pal.accent, seed: i % 3 }, { noCollide: true }); }
  // the middle: a handcart of pots
  const cLx = (doorLx > 0.3 ? -1 : doorLx < -0.3 ? 1 : gs) * Math.min(1.1, iw - 2.3), cQ = Math.max(2.2, qc - 2.3);
  F.prop(s, 'food.cart', cLx, 0, cQ, Math.PI, { w: 1.2, d: 0.6, paint: pal.frame, wood: '#9a7048' });
  F.draw(s, 'detail', (g) => { const rr = new Rng(lot.seed + 99); for (let i = 0; i < 6; i++) { const front = i < 3; potL(g, cLx - 0.4 + (i % 3) * 0.4, front ? 0.62 : 0.86, cQ + (front ? -0.12 : 0.14), 0.07, { rng: rr, size: 0.26, n: 4, pot: rr.pick(['#b8613d', '#a3563a']), layer: rr.pick(['leafA', 'leafB']), leaf: '#ffffff', flower: i === 4 ? '#8fb0ff' : null }); } });
  F.lamp(s, 'globe', cLx * 0.5, H, cQ, { drop: 0.7, K: 2800, power: 0.6, clip, range: 5 });
  await tick();
  // the counter: a jug of sprigs, spools, shears, cuttings in jars
  const C = counterAcross(s, F, { qc, gs, look: { body: pal.frame, top: '#d8c8a0', trim: pal.accent, panel: 'wood', panelTint: shadeHex(pal.frame, 1.25) } });
  const CT = C.CT, servLx = C.cm - gs * 0.3, keepLx = C.cm + gs * 0.65, jugX = servLx;
  F.draw(s, 'detail', (g) => {
    g.mat('glaze', '#9fc4a8', { rough: -0.3 }); g.lathe(jugX, qc - 0.05, [[0.05, CT], [0.075, CT + 0.08], [0.06, CT + 0.17], [0.045, CT + 0.2]], { segs: 10, capTop: false });
    g.mat('leafB', '#e6ffd8', { sway: 0.2 }); for (let i = 0; i < 6; i++) g.card(jugX, CT + 0.16, qc - 0.05, 0.12, 0.2, i * 0.55, { tilt: (i % 2 ? 0.25 : -0.25) });
    g.mat('weave', '#3f7a3a'); g.cyl(jugX, CT + 0.2, qc - 0.05, 0.03, 0.01, { segs: 6 });
    for (let i = 0; i < 4; i++) { const x = servLx + gs * (0.35 + i * 0.09); g.mat('wood', '#c9a46a'); g.cyl(x, CT, qc + 0.12, 0.025, 0.06, { segs: 8 }); g.mat('weave', ['#3f7a3a', '#5a9a4a', pal.accent, '#2f6f73'][i]); g.cyl(x, CT + 0.008, qc + 0.12, 0.028, 0.044, { segs: 8 }); }
    g.mat('cast', '#9a948a'); g.box(servLx + gs * 0.5 - 0.08, CT, qc - 0.18, servLx + gs * 0.5 + 0.08, CT + 0.008, qc - 0.16, { faces: 'yYzZ' }); g.mat('paint', '#3f7a3a'); g.box(servLx + gs * 0.5 + 0.08, CT, qc - 0.19, servLx + gs * 0.5 + 0.16, CT + 0.012, qc - 0.15, { faces: 'yYzZxX' });
    const rr = new Rng(lot.seed + 7); const cx0 = C.wallEnd - gs * -0.25;
    for (let i = 0; i < 5; i++) { const x = cx0 + gs * i * 0.13; jarL(g, x, CT, qc - 0.02, 0.04, 0.12, '#cfe0d8', 'none'); g.mat('leafB', rr.pick(['#ffffff', '#e6ffd8']), { sway: 0.2 }); g.card(x, CT + 0.1, qc - 0.02, 0.1, 0.13, rr.f(0, 3), {}); }
  });
  F.prop(s, 'shops-food.shade', servLx, H, qc, 0, { L: 1.0, col: pal.accent });
  F.lamp(s, 'bulb', servLx, H - 1.1, qc, { clip, power: 0.75, K: 2800, range: 3.8 });
  // the back: a potting bench, a stack of pots, watering cans, a shelf of crocks of compost
  const bx = -gs * (iw - 0.4), bqm = bq - 0.95;
  F.prop(s, 'shops-food.bench', bx, 0, bqm, gs * Math.PI / 2, { w: 1.5, d: 0.7, top: '#b8a07a', frame: '#5a4a32', flour: false, dough: false });
  F.prop(s, 'shops-food.growcase', gs * 0.35, 0, bq - 0.25, Math.PI, { w: +Math.min(2.2, iw - 0.6).toFixed(1), h: 1.75, d: 0.44, n: 2, frame: pal.frame, kind: 'herbs', open: true, seed: 5 });
  for (let i = 0; i < 4; i++) F.prop(s, 'food.bundle', bx + gs * 0.1, 2.6, bqm - 0.6 + i * 0.4, i * 0.8, { len: 0.1 + (i % 2) * 0.06, leaf: ['#c9d89a', '#a8c080', '#d8e0a8', '#b8c8a0'][i], thread: pal.accent, seed: i % 3 }, { noCollide: true });
  F.draw(s, 'detail', (g) => {
    const rr = new Rng(lot.seed + 3);
    g.mat('cast', '#3a3632'); g.tube([[bx + gs * 0.1, 2.62, bqm - 0.8], [bx + gs * 0.1, 2.62, bqm + 0.8]], 0.012, { segs: 5 });
    g.mat('soil', '#ffffff'); g.box(bx - 0.18, 0.9, bqm - 0.6, bx + 0.18, 0.96, bqm - 0.05, { faces: 'xXzZY' });
    for (let i = 0; i < 3; i++) potL(g, bx, 0.9, bqm + 0.15 + i * 0.15, 0.055, { rng: rr, size: 0.16, n: 2, layer: 'leafB' });
    for (let k = 0; k < 2; k++) { g.mat('glaze', '#b8613d', { rough: 0.25 }); for (let i = 0; i < 6; i++) g.lathe(gs * (iw - 0.35) - gs * k * 0.32, bq - 0.3, [[0.08, i * 0.07], [0.1, i * 0.07 + 0.09]], { segs: 8, capTop: false, capBottom: i === 0 }); }
    for (let i = 0; i < 2; i++) { const x = gs * (iw - 1.1) - gs * i * 0.35; g.mat('paint', i ? '#2f6f73' : pal.accent, { rough: -0.1 }); g.lathe(x, bq - 0.3, [[0.09, 0], [0.1, 0.2], [0.085, 0.24]], { segs: 8 }); g.tube([[x, 0.22, bq - 0.22], [x, 0.34, bq - 0.3], [x, 0.22, bq - 0.38]], 0.008, { segs: 4 }); g.tube([[x, 0.12, bq - 0.39], [x, 0.3, bq - 0.6]], 0.012, { segs: 4 }); }
  });
  F.prop(s, 'shops-food.shelf', gs * (iw - 0.18), 1.2, bq - 0.95, -gs * Math.PI / 2, { w: 1.2, h: 1.0, d: 0.26, n: 3, wood: '#8a6a48', fill: 'crocks', seed: 4, glazes: ['#b8613d', '#e6dcc4', '#3d6f8a', '#a3563a'] });
  await tick();
  const board = { kind: 'notice', title: 'A sprig · 0.03', lines: ['Chervil · Sorrel · Lovage', 'Borage · Yarrow · Rue', 'Coriander · Shiso · Basil', 'Tied for a host, same price', 'The Row in sprigs · 0.18'] };
  const bdq = Math.min(qc - 0.55, pq0 + pL + 0.42);
  F.sign(s, board, gs * (iw - 0.01), 1.75, bdq, -gs * Math.PI / 2, { w: 0.2, h: 0.28 });
  // people
  F.spot(s, 'counter', keepLx, 0, qc + 0.72, Math.PI, { tags: ['shop', 'herbs'] });
  F.spot(s, 'work', bx + gs * 0.75, 0, bqm, -gs * Math.PI / 2, { tags: ['work', 'pot', 'herbs'] });
  F.spot(s, 'work', gs * 0.35, 0, bq - 0.9, 0, { tags: ['work', 'tend', 'herbs'] });
  F.spot(s, 'customer', servLx, 0, qc - 0.85, 0, { tags: ['shop', 'herbs'] });
  for (const sd of [-1, 1]) F.spot(s, 'browse', sd * (iw - 1.15), 0, pqm, sd * Math.PI / 2, { tags: ['shop', 'herbs'] });
  F.spot(s, 'browse', cLx, 0, cQ - 0.95, 0, { tags: ['shop', 'herbs'] });
  const aisle = Math.abs(cLx - doorLx) < 1.3 ? cLx - Math.sign(cLx || 1) * 1.4 : doorLx;
  queueSpots(s, F, C, servLx, aisle, ['shop', 'herbs', 'queue'], 2);
  shopPaths(s, F, C, doorLx, servLx, keepLx, [[gs * 0.35, bq - 0.9], [bx + gs * 0.75, bqm]], aisle);
  F.path(s, [[aisle, 2.0], [-(iw - 1.15), pqm], [iw - 1.15, pqm]], { width: 0.9 });
  // things to do
  const open = () => isOpen(game, [7, 19]);
  const ask = HASK[r.i(0, HASK.length - 1)], bl = HBAND[band][r.i(0, 3)];
  F.interact(s, servLx - gs * 0.3, 1.1, qc - 0.5, { radius: 0.9, prompt: () => (open() ? 'Buy herbs' : 'The counter'), onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [HCLOSED[(lot.seed >>> 2) % HCLOSED.length]]); return; }
    await buy(gm, F, lot.name, 'A sprig is three hundredths of a kay. It says more than a bottle.', HMENU, who, band);
  } });
  F.interact(s, jugX + gs * 0.35, 1.1, qc - 0.5, { radius: 0.8, prompt: () => (open() ? "Have a host's sprig tied (0.03)" : "The jug of sprigs"), onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [HCLOSED[((lot.seed >>> 2) + 1) % HCLOSED.length]]); return; }
    if (gm.wallet && !gm.wallet.spend(0.03, "A host's sprig")) { if (gm.audio) gm.audio.ui('deny'); return; }
    if (gm.inv && gm.inv.give && !(gm.inv.has && gm.inv.has('host-sprig'))) gm.inv.give('host-sprig');
    await say(gm, who, [TIE[(lot.seed >>> 4) % TIE.length], HGIVE[(lot.seed >>> 7) % HGIVE.length]]);
  } });
  F.interact(s, keepLx, 1.5, qc + 0.45, { radius: 1.2, kind: 'talk', prompt: 'Talk to ' + kname, onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [HCLOSED[((lot.seed >>> 2) + 3) % HCLOSED.length]]); return; }
    await say(gm, who, ask.concat([bl]));
  } });
  F.interact(s, C.wallEnd - gs * -0.5, 1.1, qc - 0.45, { radius: 0.75, prompt: 'Look at the cuttings', onUse: async (gm) => { await say(gm, lot.name, [CUTTINGS[(lot.seed >>> 6) % CUTTINGS.length]]); } });
  s.loop('hum-lamp', ...(() => { const w = F.L(0, pqm); return [w[0], 1.8, w[1]]; })(), { vol: 0.06, radius: 5 });
  s.zoneBox({ id: lot.id, place: 'city-shop', box: [lot.x0, -0.5, lot.z0, lot.x1, 3.4, lot.z1], name: lot.name, sub: info.name + ' · ' + (lot.onCourt ? 'on the court' : F.o.alongX ? info.avenue : info.street), ambience: 'shop', reverb: 'felt', cell: info.key, trade: lot.trade, front: lot.front });
  void note; void hourOf; void crockL; void LINEN; void plateRail;
  M.done(F);
}
