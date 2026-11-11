// The generated noodle bar (shop.noodles) and tea room (shop.tea): places to sit with something under a lid.
// Noodles: one short counter with stools, the cook behind it pulling this morning's dough, skeins drying on a rack,
// the broth held on the loop since yesterday. Tea: a counter of copper urns and lidded cups, a long pour, a few small tables.
import { defineProp, prop } from '../world/props.js';
import { Rng, hashStr, shadeHex } from '../core/util.js';
import { say, note } from '../city/lots.js';
import { frameOf, shell, windowBed, plateRail, counterAcross, shopPaths, queueSpots, lidBowlL, cupL, keeperName, bandOf, isOpen, hourOf, hourWord, buy, meter, LINEN, BRASS } from './lots_shops_food_kit.js';

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------
// A drying rack for pulled noodles: two uprights, three dowels, skeins hanging from each. Front toward +z. p: { w, h }
defineProp('shops-food.noodlerack', (g, p) => {
  const w = p.w || 1.2, h = p.h || 1.75, rng = new Rng(hashStr('nr' + w));
  g.mat('wood', '#7a5636', { rough: -0.05 });
  for (const sx of [-1, 1]) { g.box(sx * w / 2 - 0.025, 0, -0.025, sx * w / 2 + 0.025, h, 0.025, { faces: 'xXzZ' }); g.box(sx * w / 2 - 0.03, 0, -0.25, sx * w / 2 + 0.03, 0.04, 0.25, { faces: 'xXzZY' }); }
  const ys = [h - 0.05, h - 0.5, h - 0.95];
  g.mat('wood', '#c9a46a'); for (const y of ys) { g.push(); g.move(0, y, 0); g.rotZ(Math.PI / 2); g.cyl(0, -w / 2, 0, 0.012, w, { segs: 6 }); g.pop(); }
  g.mat('plaster', '#efe2bc', { rough: 0.2 });
  for (const y of ys) {
    let x = -w / 2 + 0.08;
    while (x < w / 2 - 0.06) { const L = rng.f(0.3, 0.42), n = 5; for (let i = 0; i < n; i++) { const xx = x + i * 0.012, dz = (i % 2 ? 0.006 : -0.006); g.box(xx - 0.002, y - L - rng.f(0, 0.04), dz - 0.002, xx + 0.002, y, dz + 0.002, { faces: 'xXzZ' }); } x += 0.1; }
  }
  return { solid: [[-w / 2 - 0.03, 0, -0.25, w / 2 + 0.03, h, 0.25]], tier: 's' };
});

// A stockpot on the loop: a tall pot with its lid, a ladle hooked on the rim. p: { r, h, metal }
defineProp('shops-food.stockpot', (g, p) => {
  const r = p.r || 0.2, h = p.h || 0.34;
  g.mat('brushed', p.metal || '#b9b2a6', { rough: -0.1 }); g.lathe(0, 0, [[r * 0.95, 0], [r, 0.02], [r, h], [r * 1.04, h + 0.01]], { segs: 12, capTop: false });
  g.mat('brushed', shadeHex(p.metal || '#b9b2a6', 0.85)); g.lathe(0, 0, [[r * 1.02, h], [r * 0.6, h + 0.04], [0.03, h + 0.05], [0.03, h + 0.08], [0, h + 0.08]], { segs: 12, capBottom: false });
  g.mat('cast', '#2e2a26'); for (const sx of [-1, 1]) g.box(sx * r - 0.03, h - 0.08, -0.02, sx * r + 0.03, h - 0.05, 0.02, { faces: 'xXyYzZ' });
  g.mat('wood', '#7a5636'); g.tube([[r * 0.7, h + 0.02, 0.05], [r * 1.1, h + 0.25, 0.08]], 0.012, { segs: 4 });
  return { posts: [[0, 0, r, 0, h]], cast: false };
});

// A copper tea urn on legs, with a tap and a lid, and a drip tray. p: { r, h, metal }
defineProp('shops-food.urn', (g, p) => {
  const r = p.r || 0.17, h = p.h || 0.48, m = p.metal || '#b8653a';
  g.mat('cast', '#3a3430'); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5; g.tube([[Math.cos(a) * r * 0.9, 0, Math.sin(a) * r * 0.9], [Math.cos(a) * r * 0.75, 0.08, Math.sin(a) * r * 0.75]], 0.008, { segs: 4 }); }
  g.mat('cast', m, { rough: -0.25 }); g.lathe(0, 0, [[r * 0.8, 0.08], [r, 0.14], [r * 1.02, h * 0.75], [r * 0.85, h * 0.95], [r * 0.5, h]], { segs: 14, capBottom: true, capTop: false });
  g.mat('cast', shadeHex(m, 1.2), { rough: -0.25 }); g.lathe(0, 0, [[r * 0.52, h], [r * 0.3, h + 0.05], [0.025, h + 0.07], [0.025, h + 0.1], [0, h + 0.1]], { segs: 12, capBottom: false });
  g.mat('cast', BRASS, { rough: -0.2 }); g.tube([[0, 0.17, r * 0.98], [0, 0.17, r + 0.08], [0, 0.12, r + 0.1]], 0.012, { segs: 5 }); g.box(-0.035, 0.2, r + 0.03, 0.035, 0.215, r + 0.05, { faces: 'xXyYzZ' });
  g.mat('brushed', '#9a948a'); g.box(-0.08, 0.0, r - 0.02, 0.08, 0.012, r + 0.16, { faces: 'xXyYzZ' });
  return { posts: [[0, 0, r, 0, h]], tier: 's' };
});

// ---------------------------------------------------------------------------------------------------------------
// Noodles
// ---------------------------------------------------------------------------------------------------------------
const NPALS = [
  { frame: '#8a1f1a', plinth: '#5a1410', accent: '#e8b23a', wall: '#ecd0a0', dado: '#2a2422', floor: ['hex', '#c9b89a'], awning: ['#8a1f1a', '#f3e2c4'], sign: ['#2a2422', '#f6e7c8', '#e8b23a'], felt: ['#8a1f1a', '#e8b23a', '#2a2422'], lantern: '#e85a3a' },
  { frame: '#1f4a3a', plinth: '#14322a', accent: '#e8a03a', wall: '#efe4cc', dado: '#1f4a3a', floor: ['tile', '#c8b494'], awning: ['#1f4a3a', '#efe4cc'], sign: ['#1f4a3a', '#f3ead0', '#e8a03a'], felt: ['#e8a03a', '#1f4a3a', '#c9452e'], lantern: '#f0a040' },
  { frame: '#2a2422', plinth: '#1a1614', accent: '#c9452e', wall: '#f0dcc0', dado: '#8a1f1a', floor: ['planks', '#9a6a44'], awning: ['#c9452e', '#2a2422'], sign: ['#2a2422', '#f6e7c8', '#c9452e'], felt: ['#c9452e', '#2a2422', '#e8b23a'], lantern: '#e84a3a' },
];
const NMENU = [
  { id: 'noodles', name: 'Pulled noodles in broth', desc: 'Pulled this morning, in broth held on the loop since yesterday. Under a lid.', price: 0.96, line: 'Under the lid. Lift it when it reaches you, not before.' },
  { id: 'steak-noodles', name: 'Noodles with seared mycelium steak', desc: 'The same bowl, with mycelium seared for exactly as long as the power is worth.', price: 1.4, line: 'Seared once, hot and short. Searing is the one thing here that costs.' },
  { id: 'cold-noodles', name: 'Cold noodles in black vinegar', desc: 'Tossed cold with chili oil and vinegar. The only bowl allowed no lid.', price: 0.8, line: 'Cold, and no lid. The aunts allow it once a week.' },
  { id: 'broth', name: 'A cup of broth', desc: 'Just the broth, in a lidded cup, for the walk.', price: 0.2, line: 'For the walk. The cup comes back to any shop with a lid on its sign.' },
  { id: 'small-bowl', name: "A child's bowl", desc: 'Half the noodles, cut short, the broth a little cooler.', price: 0.45, bands: ['low'], line: 'Cut short, and the broth a little cooler.' },
  { id: 'night-bowl', name: 'The lamp-night bowl', desc: 'A big bowl for the crews going on at midnight, with an egg from the Vats.', price: 1.1, bands: ['middle'], when: (h) => h >= 21 || h < 2, line: 'For the crews. The egg is from the Vats; it has never met a hen.' },
  { id: 'soft-noodles', name: 'Soft noodles, cut short', desc: 'Pulled anyway, then cut short and cooked soft, for elders.', price: 0.85, bands: ['high'], line: 'Pulled first. Cutting them short afterwards is allowed. Not pulling them is not.' },
];
const NASK = [
  ['Where did you sleep, and have you eaten? Sit. The stool by the pot is the warmest.', 'Pulled this morning. Forty turns, folded and pulled, until every strand is as fine as thread.'],
  ['Noodles are Mill starch, Vat protein, water and a cook\'s arms. Ninety-six hundredths a bowl, and most of that is arms.', 'The flour is free at the Mill. The arms are not.'],
  ['Everything comes under a lid. The air here takes the heat out of a bowl four times faster than you would think, so lift it when it reaches you and not before.'],
  ['The broth has sat on the loop at sixty-five degrees since yesterday. Holding is free. Boiling costs, so I boil once, at five, and never again.'],
  ['Six stools. That is the whole shop. A queue is a compliment; a crowd is a hall.', 'If you want company, go to the hall. If you want noodles, sit here.'],
  ['I learned to pull from a cook in Dulse, on a terrace at a third of a g. There the strand hangs a long time before it breaks.', 'Here it breaks sooner. You learn to be quicker than the weight.'],
];
const NBAND = {
  low: ['At nearly a full g the dough fights back. That is how you know the noodles will.', 'Children sit on the end stool with a small bowl and their legs not reaching.', 'School lets out at half past three and I sell forty small bowls by four.', 'Families take noodles home in a pot under a cloth and bring the pot back in the morning.'],
  middle: ['The lamp-night crews come at eleven for a bowl before work. I stay open for them.', 'Workers eat in nine minutes. I can tell the shift by the speed.', 'Lunch is a queue to the door. Nobody minds: you can watch me pull while you wait.', 'At this weight the strand stretches easier. I fold it forty times here instead of thirty-two.'],
  high: ['Up here at half a g a strand hangs and hangs before it breaks. I could pull them a metre longer, but the bowls are the same size.', 'Elders want them soft and short. I pull them anyway and cut them after. Pulling is the point.', 'My customers sit an hour over one bowl. I keep the broth hot for them under a second lid.', 'At this weight the dough stretches like cloth. I learned to pull at the rim; up here it feels like cheating.'],
};
const NCLOSED = [
  'The stools are up on the counter and the broth is holding under its lid. Open from eleven.',
  'Shut. The dough rests under a damp cloth for tomorrow. Eleven till half past eleven at night.',
  'Nobody behind the counter. The pots tick as they hold their heat. Back at eleven.',
  'A card on the counter: Pulled tomorrow morning. Eaten from eleven.',
];
const NBOARD = [
  'Under it: Everything under a lid. Lift it when it reaches you.',
  'Under it, smaller: Six stools. If they are full, the hall is open.',
  'Under it, in another hand: Searing costs. Holding is free. Hence the prices.',
  'At the bottom: Lids come back. Bowls come back. The noodles do not.',
];
const PULL = [
  'The cook rolls the dough into a rope, takes an end in each hand, swings it and pulls. It doubles, and doubles again. Forty turns and the rope is a skein of threads.',
  'Flour on the bench, the dough slapped down, folded, pulled. The strands go thinner every turn until you can see the lamp through them.',
  'The dough is pulled this morning, early, before the first bowl. What you see now is the cook showing off for whoever is on the stools.',
  'Each pull is a fold. Two strands, four, eight, sixteen. By the eleventh the noodles are the width of a thread and there are two thousand of them.',
];

export async function buildNoodles(s, lot, plan, game, tick0) {
  const M = meter(s, game, lot, tick0), tick = M.tick;
  const F = frameOf(lot), r = new Rng(lot.seed), info = plan.info, band = bandOf(info), pal = NPALS[r.i(0, NPALS.length - 1)];
  const iw = F.iw, D = F.D, H = F.H, bq = F.bq, doorSide = r.i(-1, 1), gs = r.sign();
  const SH = shell(s, F, lot, { floor: pal.floor, wall: pal.wall, wallMat: 'plaster', dado: { h: 1.1, mat: 'tile', tint: pal.dado }, skirt: pal.plinth, frame: pal.frame, plinth: pal.plinth,
    awning: pal.awning, sign: pal.sign, emblem: 'ladle', doorLx: doorSide * (iw - 1.5), beam: '#3a2a20', felt: pal.felt, awningOn: true, pipeSide: -gs, frieze: pal.frame,
    backWall: { dado: { h: 2.1, mat: 'tile', tint: pal.dado } }, glow: { sky: '#ffd8a8', ground: '#a87050', power: 0.17 } });
  const doorLx = SH.doorLx, clip = SH.clip, kname = keeperName(r), who = { name: kname, colour: '#f0a060' };
  await tick();
  // window: nests of noodles on trays, a lidded bowl, a cup
  let wide = null;
  for (const [l0, l1] of SH.beds) {
    const y = windowBed(s, F, l0, l1, { body: pal.frame, cloth: '#2a2422', valance: pal.accent });
    if (!wide || l1 - l0 > wide[1] - wide[0]) wide = [l0, l1];
    F.draw(s, 'detail', (g) => {
      const n = Math.max(1, Math.floor((l1 - l0) / 0.5));
      for (let i = 0; i < n; i++) {
        const x = l0 + (i + 0.5) * (l1 - l0) / n;
        if (i % 2 === 0) { g.mat('wood', '#c9a46a'); g.box(x - 0.2, y, 0.36, x + 0.2, y + 0.02, 0.64, { faces: 'xXzZY' }); g.mat('plaster', '#efe0b8', { rough: 0.2 }); for (const dx of [-0.1, 0.1]) for (const dz of [-0.07, 0.07]) g.ball(x + dx, y + 0.035, 0.5 + dz, 0.06, 0.025, 0.055, { segs: 7, rings: 2, bottom: -0.4 }); }
        else { lidBowlL(g, x - 0.06, y, 0.5, 0.1, '#e9e2d0', pal.frame); cupL(g, x + 0.12, y, 0.45, '#e9e2d0', pal.accent); }
      }
    });
  }
  if (wide) F.lamp(s, 'spot', (wide[0] + wide[1]) / 2, H - 0.02, 0.5, { clip: SH.spill, cone: [44, 18], power: 0.75, K: 2800 });
  F.prop(s, 'rug', doorLx, 0, 0.75, 0, { w: 1.2, d: 0.6, mat: 'rush', a: '#5a4a32', b: '#3a3020' });
  F.prop(s, 'rug', doorLx, 0, 1.95, 0, { w: 1.0, d: 1.8, a: pal.accent, b: pal.frame }, { noCollide: true });
  await tick();
  // the eating counter across the shop, tall, with stools; a lid and a cup at the places
  const qc = D - 2.9, C = counterAcross(s, F, { qc, gs, h: 1.0, d: 0.7, gap: 0.85, look: { body: pal.frame, top: '#9a6a3c', trim: pal.accent, panel: 'wood', panelTint: shadeHex(pal.frame, 1.3) } });
  const CT = C.CT, nst = Math.max(4, Math.min(7, Math.floor((C.cw - 0.4) / 0.62))), stools = [];
  for (let i = 0; i < nst; i++) { const x = C.c0 + 0.35 + (i + 0.5) * (C.cw - 0.7) / nst; stools.push(x); F.prop(s, 'stool', x, 0, qc - 0.62, 0, { wood: '#3a2a20', h: 0.72 }, { spot: { tags: ['shop', 'noodles', 'eat'] } }); }
  F.draw(s, 'detail', (g) => {
    stools.forEach((x, i) => { if (i % 3 === 1) return; lidBowlL(g, x, CT, qc - 0.18, 0.085, ['#e9e2d0', '#d9c7a6', '#3d6f8a'][i % 3], [pal.frame, pal.accent, '#2a2422'][i % 3]); g.mat('wood', '#c9a46a'); g.box(x + 0.11, CT, qc - 0.22, x + 0.115, CT + 0.006, qc - 0.02, { faces: 'yYxX' }); g.box(x + 0.125, CT, qc - 0.22, x + 0.13, CT + 0.006, qc - 0.02, { faces: 'yYxX' }); });
    // a pot of the Nine and a vinegar bottle every third place
    for (let i = 0; i < nst; i += 3) { const x = stools[i] + 0.31; g.mat('glaze', '#3a3a34'); g.cyl(x, CT, qc - 0.05, 0.035, 0.07, { segs: 8 }); g.mat('plain', '#2a1a14', { rough: -0.4 }); g.lathe(x + 0.08, qc - 0.05, [[0.025, CT], [0.025, CT + 0.12], [0.01, CT + 0.16]], { segs: 8 }); }
  });
  // two cloth lanterns over the counter
  for (const dx of [-0.25, 0.25]) F.lamp(s, 'lantern', C.cm + dx * C.cw, H - 0.75, qc - 0.1, { tint: pal.lantern, clip, power: 0.8, K: 2600, range: 4.2, drop: 0.45 });
  await tick();
  // behind: the pulling bench in the middle, the stockpots on a hob along the back wall, the drying rack in a corner
  const kx = C.cm + gs * 0.4;
  F.prop(s, 'shops-food.bench', -gs * 0.6, 0, qc + 1.25, Math.PI, { w: 1.6, d: 0.7, top: '#dcc092', frame: '#3a2a20' });
  F.draw(s, 'detail', (g) => { // pulled strands draped over the bench end
    g.mat('plaster', '#efe2bc', { rough: 0.2 }); const bx = -gs * 0.6 + 0.62, bz = qc + 1.25;
    for (let i = 0; i < 14; i++) { const dz = -0.2 + i * 0.03; g.tube([[bx - 0.25, 0.905, bz + dz], [bx + 0.05, 0.91, bz + dz], [bx + 0.18, 0.7, bz + dz + 0.01], [bx + 0.2, 0.45 - (i % 3) * 0.05, bz + dz]], 0.0035, { segs: 3, caps: false }); }
  });
  F.prop(s, 'shops-food.counter', -gs * 0.6, 0, bq - 0.35, Math.PI, { w: 1.8, d: 0.6, h: 0.82, body: '#2a2422', top: '#9a948a', topMat: 'brushed', trim: pal.accent, panel: 'paint' });
  for (const dx of [-0.45, 0.4]) F.prop(s, 'shops-food.stockpot', -gs * 0.6 + dx, 0.82, bq - 0.35, r.f(0, 3), { r: dx < 0 ? 0.22 : 0.18, h: dx < 0 ? 0.38 : 0.3 });
  F.light(s, -gs * 0.6, 0.95, bq - 0.6, { color: '#ffb070', power: 0.6, range: 1.8, radius: 0.2, clip, lamp: false });
  F.prop(s, 'shops-food.noodlerack', gs * (iw - 0.45), 0, bq - 0.6, -gs * Math.PI / 2, { w: 1.1, h: 1.8 });
  F.draw(s, 'deco', (g) => { g.mat('diffuser', '#fff4e0', { emissive: 1.2, lamp: true }); g.box(-gs * 0.6 - 0.8, 2.3, qc + 1.2, -gs * 0.6 + 0.8, 2.32, qc + 1.3, { faces: 'yxXzZ' }); g.mat('cast', '#3a3430'); g.box(-gs * 0.6 - 0.8, 2.32, qc + 1.24, -gs * 0.6 + 0.8, H, qc + 1.26, { faces: 'zZ' }); });
  F.light(s, -gs * 0.6 - 0.7, 2.25, qc + 1.25, { to: [-gs * 0.6 + 0.7, 2.25, qc + 1.25], type: 'tube', K: 3600, color: '#fff0dc', power: 2.2, range: 2.6, radius: 0.04, clip, lamp: true });
  F.prop(s, 'shops-food.shelf', -gs * 0.6, 1.3, bq - 0.12, Math.PI, { w: 1.8, h: 0.9, d: 0.24, n: 3, wood: '#3a2a20', fill: 'bowls', seed: 3 });
  await tick();
  // a ledge with two stools along the side wall away from the door, the board above it
  const ls = doorSide !== 0 ? -doorSide : -gs, lq0 = 1.3, lq1 = Math.min(qc - 1.3, 3.6);
  if (lq1 - lq0 > 1.0) {
    F.draw(s, 'furniture', (g) => { g.mat('wood', '#9a6a3c', { rough: -0.1 }); g.box(ls * iw - ls * 0.32, 1.0, lq0, ls * iw, 1.04, lq1, { faces: 'xXyYzZ' }); g.mat('cast', '#2a2422'); for (const q of [lq0 + 0.2, lq1 - 0.2]) g.box(ls * iw - ls * 0.04, 0.78, q - 0.015, ls * iw, 1.0, q + 0.015, { faces: 'xXzZ' }); });
    F.solid(s, ls * iw - ls * 0.32, 0.95, lq0, ls * iw, 1.04, lq1);
    for (let i = 0; i < 2; i++) { const q = lq0 + (i + 0.5) * (lq1 - lq0) / 2; F.prop(s, 'stool', ls * (iw - 0.62), 0, q, ls * Math.PI / 2, { wood: '#3a2a20', h: 0.72 }, { spot: { tags: ['shop', 'noodles', 'eat'] } }); F.draw(s, 'detail', (g) => lidBowlL(g, ls * (iw - 0.17), 1.04, q, 0.08, '#e9e2d0', pal.frame)); }
  }
  const board = { kind: 'notice', title: 'Pulled today', lines: ['Noodles in broth · 0.96', 'With seared steak · 1.40', 'Cold, in vinegar · 0.80', 'A cup of broth · 0.20', 'Everything under a lid'] };
  F.sign(s, board, ls * (iw - 0.01), 1.85, (lq0 + Math.max(lq1, lq0 + 1)) / 2, -ls * Math.PI / 2, { w: 0.2, h: 0.28 });
  plateRail(s, F, -ls, 1.2, Math.min(qc - 0.7, 3.8), 2.25, { wood: '#3a2a20', glazes: ['#e9e2d0', pal.frame, '#3d6f8a', '#d9c7a6'], seed: lot.seed });
  F.lamp(s, 'globe', 0, H, Math.max(1.6, qc - 2.2), { drop: 0.6, K: 2700, power: 0.55, clip, range: 4.5 });
  await tick();
  // people
  F.spot(s, 'counter', kx, 0, qc + 0.7, Math.PI, { tags: ['shop', 'noodles', 'cook'] });
  F.spot(s, 'work', -gs * 0.6, 0, qc + 0.62, 0, { tags: ['work', 'cook', 'pull', 'noodles'] });
  F.spot(s, 'work', -gs * 0.6, 0, bq - 1.0, 0, { tags: ['work', 'cook', 'noodles'] });
  queueSpots(s, F, C, (doorLx + C.cm) / 2, doorLx, ['shop', 'noodles', 'queue'], 3);
  shopPaths(s, F, C, doorLx, (doorLx + C.cm) / 2, kx, [[-gs * 0.6, qc + 0.62], [-gs * 0.6, bq - 1.0]]);
  F.path(s, [[doorLx, 1.2], [ls * (iw - 1.0), (lq0 + lq1) / 2]], { width: 0.9 });
  F.path(s, [[stools[0], qc - 1.1], [stools[stools.length - 1], qc - 1.1]], { width: 0.9 });
  // things to do
  const open = () => isOpen(game, [11, 23.5]);
  const ask = NASK[r.i(0, NASK.length - 1)], bl = NBAND[band][r.i(0, 3)];
  const sitAt = (gm) => { const x = stools[(lot.seed >>> 3) % stools.length]; F.sit(gm, x, 0.72, qc - 0.62, 0); };
  F.interact(s, (doorLx + C.cm) / 2, 1.1, qc - 0.75, { radius: 1.0, prompt: () => (open() ? 'Order a bowl' : 'The counter'), onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [NCLOSED[(lot.seed >>> 2) % NCLOSED.length]]); return; }
    const it = await buy(gm, F, lot.name, 'Pulled this morning. Everything under a lid.', NMENU, who, band);
    if (it && it.id !== 'broth') { sitAt(gm); if (gm.audio && gm.sfxAt) { const w = F.L(stools[0], qc); gm.sfxAt('lid-up', s.frame, w[0], 1.1, w[1]); } note(gm, 'You sit on the stool and lift the lid. The steam goes up and is gone in a breath.', 'info'); }
  } });
  F.interact(s, kx, 1.5, qc + 0.4, { radius: 1.3, kind: 'talk', prompt: 'Talk to ' + kname, onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [NCLOSED[((lot.seed >>> 2) + 2) % NCLOSED.length]]); return; }
    await say(gm, who, ask.concat([bl]));
  } });
  F.interact(s, -gs * 0.6, 1.3, qc - 0.5, { radius: 0.9, prompt: 'Watch the pulling', onUse: async (gm) => { await say(gm, lot.name, [PULL[(lot.seed >>> 5) % PULL.length], hourOf(gm) < 11 ? 'Too early: the dough is still resting under its cloth.' : NBAND[band][(r.i(0, 3) + 1) % 4]]); } });
  F.interact(s, ls * (iw - 0.5), 1.6, (lq0 + Math.max(lq1, lq0 + 1)) / 2, { radius: 1.0, prompt: 'Read the board', onUse: async (gm) => { await say(gm, lot.name, ['Pulled today: noodles in broth 0.96, with seared steak 1.40, cold in vinegar 0.80, a cup of broth 0.20.', NBOARD[(lot.seed >>> 5) % NBOARD.length], 'Open eleven till half past ' + hourWord(23) + ' at night, for the crews.']); } });
  s.loop('kitchen', ...(() => { const w = F.L(-gs * 0.6, bq - 0.6); return [w[0], 1.0, w[1]]; })(), { vol: 0.18, radius: 6 });
  s.zoneBox({ id: lot.id, place: 'city-shop', box: [lot.x0, -0.5, lot.z0, lot.x1, 3.4, lot.z1], name: lot.name, sub: info.name + ' · ' + (lot.onCourt ? 'on the court' : F.o.alongX ? info.avenue : info.street), ambience: 'shop', reverb: 'room', cell: info.key, trade: lot.trade, front: lot.front });
  void prop; void LINEN; void BRASS;
  M.done(F);
}

// ---------------------------------------------------------------------------------------------------------------
// Tea
// ---------------------------------------------------------------------------------------------------------------
const TPALS = [
  { frame: '#26306b', plinth: '#1a2250', accent: '#b8653a', wall: '#d4e0d6', dado: '#26306b', floor: ['planks', '#a8794f'], awning: ['#26306b', '#e6e8d8'], sign: ['#26306b', '#f1ead6', '#d89a5a'], felt: ['#b8653a', '#26306b', '#9fc4a8'] },
  { frame: '#6a2a3a', plinth: '#4a1c28', accent: '#c9a45c', wall: '#f0e6d0', dado: '#6a2a3a', floor: ['pattern', '#d8c4a4'], awning: ['#6a2a3a', '#f0e6d0'], sign: ['#6a2a3a', '#f4ead8', '#d8b46a'], felt: ['#c9a45c', '#6a2a3a', '#2f6f73'] },
  { frame: '#2f6f73', plinth: '#22504f', accent: '#c9552e', wall: '#ead6b6', dado: '#2f6f73', floor: ['planks', '#b98a5a'], awning: ['#c9552e', '#efe6d2'], sign: ['#2f6f73', '#f3e9cf', '#e8a060'], felt: ['#c9552e', '#2f6f73', '#d6a640'] },
];
const TMENU = [
  { id: 'tea', name: 'Jasmine tea, poured long', desc: 'Poured from a height into a lidded cup. Watch it land a little anti.', price: 0.15, line: 'Watch it land. A little anti, always.' },
  { id: 'coffee', name: 'Coffee', desc: 'Cell-culture coffee, black or with Vat milk.', price: 0.15, line: 'Grown in a vat, cell by cell. It tastes like coffee to everybody who has never had any other kind, which is everybody.' },
  { id: 'milk-tea', name: 'Milk tea', desc: 'Black tea with Vat milk and Mill sugar, pulled long.', price: 0.2, line: 'Pulled twice, cup to jug and back, for the froth.' },
  { id: 'amazake', name: 'Warm amazake', desc: 'Rice and koji, brewed overnight at sixty degrees, sweet and thick.', price: 0.2, line: 'Brewed overnight on the loop. It costs me a pot and the night.' },
  { id: 'cake', name: 'Honeycomb steamed cake', desc: 'A slice, yeast-raised and full of holes, under a linen lid.', price: 0.3, line: 'Keep the linen on it till you sit.' },
  { id: 'puff', name: 'A sour-starch puff', desc: 'One, warm, for the walk.', price: 0.05, line: 'One. Warm. Go on.' },
  { id: 'kids-amazake', name: 'Amazake for a child, lid on tight', desc: 'Half a cup, cooler, with a lid that clicks.', price: 0.1, bands: ['low'], line: 'The lid clicks. They lift it anyway.' },
  { id: 'thyme-tea', name: 'Lemon thyme tea, a pot', desc: 'A small pot for one, for the evening. The pot stays at the table.', price: 0.2, bands: ['high'], line: 'A pot for one. Sit as long as you like; the pot will not mind.' },
];
const TASK = [
  ['Where did you sleep, and have you eaten? Then sit, and I will pour it long.', 'A long pour cools it a little and puts air in it. It also lands a little anti, so I stand a little spinward of the cup.'],
  ['Coffee is grown in a vat, cell by cell. Fifteen hundredths, the same as the tea. We do not argue about it.'],
  ['The cups are lent. Take one out with you and bring it back to any shop with a lid on its sign, and the next person drinks from it.', 'We count the cups on Booking Day. We are always three over and nobody knows why.'],
  ['Every cup has a lid. The air would take the heat out of it in a minute otherwise. Lift the lid, drink, put the lid back.'],
  ['The tea is grown in the Keel under lamps and picked by hand, two leaves and a bud. That is the line on every tin on the Row, and it is true.'],
  ['Amazake is rice and koji, brewed overnight at sixty degrees on the loop. It costs me a pot and the night.', 'People who cannot sleep come in for it at six. People who cannot wake come in for coffee at seven.'],
];
const TBAND = {
  low: ['Mornings it is parents after the school drop, two to a table, saying nothing for ten minutes.', 'Children get warm amazake with the lid on tight. They lift it anyway.', 'The tables fill at half past three, when the school lets out and the aunts take over.', 'Down here at nearly a full g the pour falls fast and lands nearly true.'],
  middle: ['Workers take it to go, in a lent cup, and the cups come back from every lift in the block.', 'The long pour is for show at lunch and for speed at seven.', 'People hold their meetings at that table. The block court started there once, before it moved to the court.', 'At this weight the pour falls slower and lands a little further anti. I moved my feet years ago.'],
  high: ['Up here at half a g the stream hangs in the air long enough to watch. The elders come for that.', 'Elders sit three hours over one pot. I fill it again and leave it.', 'The tables up here are full by nine and empty by eleven, when everyone has gone to sleep or to the Hollow.', 'At this weight a long pour drifts a good finger anti. I stand that much spinward of the cup.'],
};
const POUR = [
  'The keeper lifts the pot to shoulder height and pours. The stream is a metre long and lands in the cup without a splash, a finger anti of where it was aimed.',
  'A long pour from a copper pot: the stream bends, very slightly, the way everything falling in a drum bends. The keeper has stopped noticing.',
  'The keeper pours with the cup low and the pot high, then brings them together without spilling. It takes half a second and twenty years.',
  'From the pot, a long thin stream into a lidded cup. The lid goes on before the steam has finished rising.',
];
const TCLOSED = [
  'The urns are cold-side and the cups are on their hooks. Tea from six.',
  'Shut. The pouring pot is upside down on a cloth. Six in the morning till nine at night.',
  'Nobody behind the counter. The amazake is brewing overnight on the loop. Open at six.',
  'The chairs are up on the tables. A card: Cups back to any shop with a lid on its sign.',
];
const CUPS = ['The lent cups hang on hooks, each with a lid on a string. Somebody has painted a different small mark on every lid.', 'A shelf of lidded cups, mismatched: celadon, brown, white with a blue rim. Mended ones have gold in the cracks.', 'A card by the hooks: Cups lent. Bring them back to any cart, any shop, any hall. They know the way.', 'Over the cups, in pencil on the wall, a tally: cups out, cups back. The two columns never agree.'];

export async function buildTea(s, lot, plan, game, tick0) {
  const M = meter(s, game, lot, tick0), tick = M.tick;
  const F = frameOf(lot), r = new Rng(lot.seed), info = plan.info, band = bandOf(info), pal = TPALS[r.i(0, TPALS.length - 1)];
  const iw = F.iw, D = F.D, H = F.H, bq = F.bq, doorSide = r.i(-1, 1), gs = r.sign();
  const SH = shell(s, F, lot, { floor: pal.floor, wall: pal.wall, wallMat: 'paint', dado: { h: 1.0, mat: 'wood', tint: pal.dado }, skirt: shadeHex(pal.dado, 0.6), frame: pal.frame, plinth: pal.plinth,
    awning: pal.awning, sign: pal.sign, emblem: 'cup', doorLx: doorSide * (iw - 1.5), beam: '#5a3e28', felt: pal.felt, awningOn: true, pipeSide: gs, frieze: pal.frame,
    glow: { sky: '#ffdcae', ground: '#a8794f', power: 0.17 } });
  const doorLx = SH.doorLx, clip = SH.clip, kname = keeperName(r), who = { name: kname, colour: '#d89a5a' };
  await tick();
  // window: a tea tray, tins, a pot
  let wide = null;
  for (const [l0, l1] of SH.beds) {
    const y = windowBed(s, F, l0, l1, { body: pal.frame, cloth: '#e6dcc4', valance: pal.accent });
    if (!wide || l1 - l0 > wide[1] - wide[0]) wide = [l0, l1];
    F.draw(s, 'detail', (g) => {
      const n = Math.max(1, Math.floor((l1 - l0) / 0.45));
      for (let i = 0; i < n; i++) {
        const x = l0 + (i + 0.5) * (l1 - l0) / n;
        if (i % 2) { for (let j = 0; j < 3; j++) { g.mat('paint', ['#2f6f73', pal.accent, '#26306b', '#6b7a3a'][(i + j) % 4], { rough: -0.1 }); g.cyl(x - 0.1 + j * 0.1, y, 0.5, 0.045, 0.12 + j * 0.02, { segs: 8 }); g.mat('cast', '#b9b0a0'); g.cyl(x - 0.1 + j * 0.1, y + 0.12 + j * 0.02, 0.5, 0.047, 0.012, { segs: 8 }); } }
        else { g.mat('wood', '#6a4a30'); g.box(x - 0.17, y, 0.36, x + 0.17, y + 0.02, 0.62, { faces: 'xXzZY' }); g.mat('glaze', '#9fc4a8', { rough: -0.3 }); g.lathe(x - 0.06, 0.48, [[0.04, y + 0.02], [0.075, y + 0.08], [0.06, y + 0.13], [0.025, y + 0.15]], { segs: 10 }); cupL(g, x + 0.08, y + 0.02, 0.44, '#e9e2d0', pal.frame); cupL(g, x + 0.1, y + 0.02, 0.56, '#9fc4a8', pal.accent); }
      }
    });
  }
  if (wide) F.lamp(s, 'spot', (wide[0] + wide[1]) / 2, H - 0.02, 0.5, { clip: SH.spill, cone: [44, 18], power: 0.75, K: 2800 });
  F.prop(s, 'rug', doorLx, 0, 0.75, 0, { w: 1.2, d: 0.6, mat: 'rush', a: '#6a5a40', b: '#4a3a28' });
  F.prop(s, 'rug', doorLx, 0, 1.95, 0, { w: 1.0, d: 1.8, a: pal.accent, b: pal.frame }, { noCollide: true });
  await tick();
  // the counter: urns, a case of cups and cake, the long-pour post
  const qc = D - 3.0, C = counterAcross(s, F, { qc, gs, look: { body: pal.frame, top: '#9a6a3c', trim: pal.accent, panel: 'wood', panelTint: shadeHex(pal.frame, 1.3) } });
  const CT = C.CT, servLx = C.cm - gs * 0.3, keepLx = C.cm + gs * 0.7;
  F.prop(s, 'shops-food.urn', C.wallEnd + gs * 0.35, CT, qc - 0.02, Math.PI, { r: 0.17, h: 0.5 });
  F.prop(s, 'shops-food.urn', C.wallEnd + gs * 0.8, CT, qc + 0.02, Math.PI, { r: 0.14, h: 0.42, metal: '#a8582e' });
  F.prop(s, 'shops-food.case', servLx - gs * 0.1, CT, qc, Math.PI, { w: 0.9, d: 0.46, h: 0.34, frame: BRASS, lining: '#e6dcc4', fill: 'cups' });
  F.draw(s, 'detail', (g) => { // the pouring pot and a stack of lids at the keeper's post, a dome of cake
    const x = keepLx; g.mat('cast', pal.accent, { rough: -0.25 }); g.lathe(x, qc - 0.05, [[0.05, CT], [0.08, CT + 0.06], [0.07, CT + 0.14], [0.03, CT + 0.18]], { segs: 10 }); g.tube([[x, CT + 0.08, qc + 0.02], [x, CT + 0.16, qc + 0.14], [x, CT + 0.2, qc + 0.18]], 0.008, { segs: 4 });
    for (let i = 0; i < 5; i++) { g.mat('glaze', ['#e9e2d0', '#9fc4a8', pal.accent][i % 3], { rough: -0.3 }); g.cyl(x + gs * 0.25, CT + i * 0.012, qc + 0.1, 0.04, 0.01, { segs: 8 }); }
  });
  F.prop(s, 'shops-food.shelf', C.cm, 1.1, bq - 0.14, Math.PI, { w: +Math.min(3.2, 2 * iw - 1.2).toFixed(1), h: 1.2, d: 0.26, n: 3, wood: '#5a3e28', lip: pal.accent, fill: 'cups', seed: lot.seed % 4 });
  F.prop(s, 'shops-food.cupboard', C.cm, 0, bq - 0.3, Math.PI, { w: +Math.min(3.2, 2 * iw - 1.2).toFixed(1), h: 0.9, d: 0.5, body: pal.frame, top: '#9a6a3c' });
  F.prop(s, 'shops-food.urn', C.cm - 0.6, 0.9, bq - 0.3, Math.PI, { r: 0.2, h: 0.55 });
  F.prop(s, 'shops-food.shade', keepLx, H, qc, 0, { L: 1.0, col: pal.accent });
  F.lamp(s, 'bulb', keepLx, H - 1.1, qc, { clip, power: 0.75, K: 2700, range: 3.6 });
  await tick();
  // the tables: a banquette along the wall away from the door, two or three small round tables, chairs
  const ts = doorSide !== 0 ? -doorSide : -gs, tq0 = 1.3, tq1 = qc - 1.0, nt = Math.max(2, Math.min(3, Math.floor((tq1 - tq0) / 1.3)));
  F.draw(s, 'furniture', (g) => { // the banquette: a padded seat on a boarded base, a cushioned back on the wall
    g.mat('wood', '#5a3e28'); g.box(ts * iw - ts * 0.5, 0, tq0, ts * iw, 0.4, tq1, { faces: 'xXzZ' });
    g.mat('weave', pal.frame); g.box(ts * iw - ts * 0.52, 0.4, tq0, ts * iw, 0.47, tq1, { faces: 'xXyYzZ', bevel: 0.02 });
    g.mat('weave', shadeHex(pal.frame, 1.2)); g.box(ts * iw - ts * 0.12, 0.47, tq0, ts * iw, 0.95, tq1, { faces: 'xXyYzZ', bevel: 0.02 });
  });
  F.solid(s, ts * iw - ts * 0.5, 0, tq0, ts * iw, 0.47, tq1);
  const tables = [];
  for (let i = 0; i < nt; i++) {
    const q = tq0 + (i + 0.5) * (tq1 - tq0) / nt, tx = ts * (iw - 1.0); tables.push([tx, q]);
    F.prop(s, 'table', tx, 0, q, 0, { round: true, w: 0.66, h: 0.72, wood: '#3a2a20', top: '#9a6a3c' });
    F.spot(s, 'sit', ts * (iw - 0.3), 0.47, q, -ts * Math.PI / 2, { tags: ['shop', 'tea', 'drink'] });
    F.prop(s, 'chair', ts * (iw - 1.6), 0, q, ts * Math.PI / 2, { wood: ['#5a3a26', '#6b4a2f', '#3a2a20'][i % 3], back: i % 2 ? 'slat' : 'hoop' }, { spot: { tags: ['shop', 'tea', 'drink'] } });
    F.draw(s, 'detail', (g) => { cupL(g, tx - ts * 0.12, 0.72, q - 0.1, '#e9e2d0', pal.accent); if (i % 2 === 0) cupL(g, tx + ts * 0.12, 0.72, q + 0.12, '#9fc4a8', pal.frame); });
    if (i < 2) { F.prop(s, 'shops-food.shade', tx, H, q, 0, { L: 1.4, col: pal.accent }); F.lamp(s, 'bulb', tx, H - 1.5, q, { clip, power: 0.55, K: 2600, range: 3.0 }); }
  }
  plateRail(s, F, ts, tq0, tq1, 2.0, { wood: '#5a3e28', glazes: ['#e9e2d0', '#9fc4a8', pal.accent, '#d9c7a6', '#3d6f8a'], seed: lot.seed });
  // one more table by the window on the door's other side, if there is room
  const ow = -ts, owx = ow * (iw - 1.0);
  if (Math.abs(owx - doorLx) > 1.6) { const q = 1.6; F.prop(s, 'table', owx, 0, q, 0, { round: true, w: 0.62, h: 0.72, wood: '#3a2a20', top: '#9a6a3c' }); for (const sd of [-1, 1]) F.prop(s, 'chair', owx + sd * 0.55, 0, q, -sd * Math.PI / 2, { wood: '#5a3a26', back: 'slat' }, { spot: { tags: ['shop', 'tea', 'drink'] } }); }
  const board = { kind: 'notice', title: 'Poured long', lines: ['Jasmine tea · 0.15', 'Coffee · 0.15', 'Milk tea · 0.20', 'Amazake · 0.20', 'Cups lent · bring them back'] };
  F.sign(s, board, -ts * (iw - 0.01), 1.75, Math.min(qc - 0.6, 3.0), ts * Math.PI / 2, { w: 0.2, h: 0.28 });
  await tick();
  // people
  F.spot(s, 'counter', keepLx, 0, qc + 0.72, Math.PI, { tags: ['shop', 'tea', 'pour'] });
  F.spot(s, 'work', C.cm - 0.6, 0, bq - 0.95, 0, { tags: ['work', 'tea', 'brew'] });
  F.spot(s, 'customer', servLx, 0, qc - 0.85, 0, { tags: ['shop', 'tea'] });
  F.spot(s, 'chat', -ts * (iw - 1.2), 0, Math.min(qc - 0.9, 3.4), ts * Math.PI / 2, { tags: ['shop', 'tea'] });
  F.spot(s, 'chat', -ts * (iw - 1.9), 0, Math.min(qc - 0.9, 3.4), -ts * Math.PI / 2, { tags: ['shop', 'tea'] });
  const aisle = 0;
  queueSpots(s, F, C, servLx, aisle, ['shop', 'tea', 'queue'], 2);
  shopPaths(s, F, C, doorLx, servLx, keepLx, [[C.cm - 0.6, bq - 0.95]], aisle);
  F.path(s, [[aisle, 2.0], [ts * (iw - 2.0), (tq0 + tq1) / 2]], { width: 0.9 });
  // things to do
  const open = () => isOpen(game, [6, 21]);
  const ask = TASK[r.i(0, TASK.length - 1)], bl = TBAND[band][r.i(0, 3)];
  F.interact(s, servLx, 1.1, qc - 0.5, { radius: 1.0, prompt: () => (open() ? 'Order a cup' : 'The counter'), onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [TCLOSED[(lot.seed >>> 2) % TCLOSED.length]]); return; }
    const it = await buy(gm, F, lot.name, 'Ask for a long pour. Bring the cup back to any cart in the block.', TMENU, who, band);
    if (it) { const t = tables[(lot.seed >>> 2) % tables.length]; F.sit(gm, ts * (iw - 0.3), 0.47, t[1], -ts * Math.PI / 2); note(gm, 'You take the cup to the banquette and lift the lid.', 'info'); }
  } });
  F.interact(s, keepLx, 1.5, qc + 0.45, { radius: 1.25, kind: 'talk', prompt: 'Talk to ' + kname, onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [TCLOSED[((lot.seed >>> 2) + 2) % TCLOSED.length]]); return; }
    await say(gm, who, ask.concat([bl]));
  } });
  F.interact(s, keepLx - gs * 0.7, 1.3, qc - 0.45, { radius: 0.8, prompt: () => (open() ? 'Watch the long pour' : 'The pouring pot'), onUse: async (gm) => {
    if (!open()) { await say(gm, lot.name, [TCLOSED[((lot.seed >>> 2) + 1) % TCLOSED.length]]); return; }
    await say(gm, lot.name, [POUR[(lot.seed >>> 4) % POUR.length], TBAND[band][3]]);
  } });
  F.interact(s, C.cm, 1.6, qc - 0.1, { radius: 0.7, prompt: (gm) => (gm.inv && gm.inv.has && gm.inv.has('lidded-cup') ? 'Give back the lent cup' : 'Borrow a lidded cup'), onUse: async (gm) => {
    const has = gm.inv && gm.inv.has && gm.inv.has('lidded-cup');
    if (has) { if (gm.inv.take) gm.inv.take('lidded-cup'); await say(gm, who, ['Back where it belongs. Any shop with a lid on its sign would have taken it.', CUPS[(lot.seed >>> 6) % CUPS.length]]); }
    else { if (gm.inv && gm.inv.give) gm.inv.give('lidded-cup'); await say(gm, who, ['Lent, not sold. Bring it back to any cart or shop with a lid on its sign.', CUPS[((lot.seed >>> 6) + 1) % CUPS.length]]); }
  } });
  s.loop('murmur', ...(() => { const w = F.L(ts * (iw - 1.0), (tq0 + tq1) / 2); return [w[0], 1.2, w[1]]; })(), { vol: 0.12, radius: 6, param: 0.2 });
  s.zoneBox({ id: lot.id, place: 'city-shop', box: [lot.x0, -0.5, lot.z0, lot.x1, 3.4, lot.z1], name: lot.name, sub: info.name + ' · ' + (lot.onCourt ? 'on the court' : F.o.alongX ? info.avenue : info.street), ambience: 'shop', reverb: 'felt', cell: info.key, trade: lot.trade, front: lot.front });
  void prop; void LINEN; void hourWord;
  M.done(F);
}
