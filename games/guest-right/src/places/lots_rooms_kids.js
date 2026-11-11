// The Low decks' rooms for small children: the Warm Floor (a day nursery on a floor warmed by the food plant's loop) and
// the toys on loan, mended between borrowers.
import { defineProp } from '../world/props.js';
import { Rng } from '../core/util.js';
import { say } from '../city/lots.js';
import { local, shell, ceilingWorks, trims, partition, pickBy, fill, sayPick, hourOf, nameBy, nearLoop, KIT_T } from './lots_rooms_kit.js';
import { civicParts } from './civic_parts.js';

// ---------------------------------------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------------------------------------
// A cot for naps: slatted sides, a mattress, a knitted blanket, a name card. Long side along z. p: { wood, blanket }
defineProp('lots-rooms.cot', (g, p) => {
  const w = 0.68, d = 1.22, h = 0.82, wood = p.wood || '#c9a46a';
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * w / 2 - 0.025, 0, sz * d / 2 - 0.025, sx * w / 2 + 0.025, h, sz * d / 2 + 0.025, { bevel: 0.008 });
  for (const sz of [-1, 1]) { g.box(-w / 2, h - 0.05, sz * d / 2 - 0.015, w / 2, h, sz * d / 2 + 0.015, { bevel: 0.006 }); for (let x = -w / 2 + 0.11; x < w / 2 - 0.06; x += 0.11) g.box(x - 0.01, 0.3, sz * d / 2 - 0.01, x + 0.01, h - 0.05, sz * d / 2 + 0.01); }
  for (const sx of [-1, 1]) { g.box(sx * w / 2 - 0.015, h - 0.05, -d / 2, sx * w / 2 + 0.015, h, d / 2, { bevel: 0.006 }); for (let z = -d / 2 + 0.12; z < d / 2 - 0.06; z += 0.12) g.box(sx * w / 2 - 0.01, 0.3, z - 0.01, sx * w / 2 + 0.01, h - 0.05, z + 0.01); }
  g.box(-w / 2, 0.26, -d / 2, w / 2, 0.3, d / 2);
  g.mat('weave', '#f1ead8'); g.box(-w / 2 + 0.02, 0.3, -d / 2 + 0.02, w / 2 - 0.02, 0.38, d / 2 - 0.02, { bevel: 0.03 });
  g.mat('knit', p.blanket || '#e0735a'); g.box(-w / 2 + 0.03, 0.38, -0.05, w / 2 - 0.03, 0.41, d / 2 - 0.04, { bevel: 0.02 });
  g.mat('paper', '#f4efe4'); g.box(-0.08, h - 0.2, d / 2 + 0.012, 0.08, h - 0.1, d / 2 + 0.016);
  return { solid: [[-w / 2 - 0.03, 0, -d / 2 - 0.03, w / 2 + 0.03, h, d / 2 + 0.03]], tier: 's' };
});
// A low gate inside a doorway, latched open against the wall. Spans x. p: { w, col }
defineProp('lots-rooms.gate', (g, p) => {
  const w = p.w || 1.0; g.mat('paint', p.col || '#e8c27a');
  g.box(-w / 2, 0, -0.03, -w / 2 + 0.05, 0.75, 0.03, { bevel: 0.008 });
  g.push(); g.move(-w / 2 + 0.05, 0, 0); g.rotY(-1.4);
  g.box(0, 0.08, -0.015, w - 0.1, 0.12, 0.015); g.box(0, 0.66, -0.015, w - 0.1, 0.7, 0.015);
  for (let x = 0.04; x < w - 0.12; x += 0.1) g.box(x, 0.12, -0.01, x + 0.025, 0.66, 0.01);
  g.pop();
  return { cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// The Warm Floor
// ---------------------------------------------------------------------------------------------------------------
const NURSERY_PAL = [
  { wall: '#f3e2c4', dado: '#e0735a', floor: '#d9b48a', accent: '#2f8a85', soft: ['#e8705a', '#e9b23c', '#7cab4e', '#3b4f8f', '#d4878a', '#5fb3b3'], sign: ['#2f8a85', '#fff3dc', '#e9b23c'] },
  { wall: '#efe6d0', dado: '#6c9a4c', floor: '#d6ae80', accent: '#c9552e', soft: ['#e9b23c', '#2f8a85', '#d9534f', '#8a4a6a', '#f2c879', '#7cab4e'], sign: ['#4f6f2f', '#fff3dc', '#f2c879'] },
  { wall: '#f4e4d4', dado: '#5b7fb0', floor: '#dcb890', accent: '#e9b23c', soft: ['#d4878a', '#5fb3b3', '#e8705a', '#3b4f8f', '#f2c879', '#8a4a6a'], sign: ['#3b4f8f', '#fff3dc', '#f2c879'] },
];
const FLOOR_LINES = [
  ['You put a hand flat on the floor. It is warm, about as warm as a hand, all over, with no hot places.', 'Under the boards runs a loop of the food plant\'s waste heat, the same 65 degrees that holds the hall\'s pots and heats the baths, let down through an exchanger until it is only kind.'],
  ['Warm, everywhere. A baby is asleep face down on it in the middle of the room, arms out, as flat as a dropped coat.', 'The heat is free: it is the plant\'s, and would go to the radiators otherwise. A warm floor is one of the few warm things in the drum that costs nobody anything.'],
  ['The floor is warm through your socks. The minder says you are allowed to lie on it if you want: "Everybody does, the first time. Then they ask if we take adults."', 'They do not.'],
  ['A brass grille along the wall breathes warm air from the loop. The children\'s shoes are lined up along it to dry.', 'By the far wall, a glass hatch in the floor shows the pipes underneath, lagged in felt, with a child\'s drawing taped beside it: "THE WARM".'],
];
const MINDER_LINES = [
  ['Where did you sleep last night? Have you eaten? Sit on the floor, then. Mind the small ones; they bite when they are teething and they are always teething.', 'Every child here has a table: the parents, and three or four aunts who stood at the naming. Half the aunts in {name} have done a shift on this floor.'],
  ['Nobody posts a price for a child in Chervil. Two by right, a third by the block\'s leave. We take them all, the same.', 'That one is named for her great-great-aunt, whose share she carries. The aunt\'s family brought a cot to the naming. That one, by the wall.'],
  ['The block pays me, from the commons. The block hires its own people first. I was on this floor myself, forty years ago, and the minder then had been on it before her.', 'Bones grow best heavy, so the families live low. This floor is {g} of a g. They walk early here and fall hard.'],
  ['Children learn the rule before they can read: axis flies true, spin sinks, anti floats. Watch that one with the ball.', 'Every time she drops it, it lands a little anti. She has noticed. She is cross about it.'],
];
const COAT_LINES = [
  'Small coats on low hooks, each with a hand\'s width folded into every seam so it can be let out as the child grows. Inside one collar, two names: {a}, and above it, older, {b}.',
  'The coats are mended in bright thread, the mends left showing. A card above the hooks: "{a}: wrong shoes again." A small pair of shoes underneath that are clearly the wrong ones.',
  'Every coat has its child\'s name in the lining, and most have a second name above it: the one whose share the child carries. {a}\'s says {b}.',
  'Some of these coats were somebody\'s mother\'s. You can tell by how many times the hem has been let down and taken up again: four lines of stitching, four colours.',
];

export async function buildNursery(s, lot, plan, game, tick) {
  const L = local(s, lot, tick), info = plan.info, r = new Rng(lot.seed), W = L.W, D = L.D, g = s.g, H = 3.1, big = lot.onCourt || D > 11;
  const pal = NURSERY_PAL[r.i(0, NURSERY_PAL.length - 1)], minder = nameBy(lot.seed, 'minder');
  const dp = 1.5, ww = Math.min(4.4, W - 4.2);
  const clip = await shell(L, info, { H, floor: ['planks', pal.floor], ceil: ['paint', '#f6eedc'], wall: { tint: pal.wall, dado: { h: 0.9, mat: 'tile', tint: pal.dado }, skirt: '#7a3b2e' },
    glow: { sky: '#ffe2b8', ground: '#e8b880', power: 0.42 },
    front: { style: 'house', fin: { mat: 'plaster', tint: pal.dado, dado: { h: 0.6, mat: 'tile', tint: pal.accent }, trim: '#fff3dc', door: pal.accent }, door: { p: dp, w: 1.2 }, windows: [{ p: 2.7, w: ww, h: 1.6, sill: 0.55 }], sign: { emblem: 'star', palette: pal.sign }, mat: pal.accent } });
  await tick();
  ceilingWorks(L, H, { beam: '#f2e6cc', beamMat: 'paint', every: 2.4, duct: '#c4c0b6', pipe: '#c47a45', side: 'hi' });
  trims(L, H, { rail: 1.9, railTint: pal.accent, band: pal.soft[2], bandH: 0.2 });
  // a painted band of colour at a child's height, and brass grilles of the loop's warm air along the back wall
  L.deco(() => {
    g.mat('paint', pal.soft[0]); L.box(0.165, 0.9, D - 0.172, W - 0.165, 0.98, D - 0.165); L.box(0.165, 0.9, KIT_T + 0.3, 0.172, 0.98, D - 0.165); L.box(W - 0.172, 0.9, KIT_T + 0.3, W - 0.165, 0.98, D - 0.165);
    g.mat('cast', '#c8a45a', { rough: -0.2 }); for (let p = 1.0; p < W - 1.0; p += 2.2) L.box(p, 0.12, D - 0.18, p + 0.9, 0.3, D - 0.165);
    g.mat('plain', '#2a2622'); for (let p = 1.0; p < W - 1.0; p += 2.2) for (let k = 0; k < 6; k++) L.box(p + 0.06 + k * 0.14, 0.15, D - 0.166, p + 0.12 + k * 0.14, 0.27, D - 0.164);
  });
  // in the big room, a nap room at the back behind a partition with a doorway and a glazed upper part
  const qB = big ? D - 3.6 : D;
  if (big) {
    partition(L, qB, H, { tint: pal.wall, dado: { h: 0.9, mat: 'tile', tint: pal.dado }, skirt: '#7a3b2e', openings: [{ at: 0.84, w: 1.3, h: 2.1 }, { at: 3.0, w: Math.max(1.2, W - 6.6), h: 1.0, sill: 1.05 }] });
    L.glass(3.16, 1.05, qB, 3.16 + Math.max(1.2, W - 6.6), 2.05, qB, { tint: '#fff2dc', opacity: 0.35 });
  }
  // children's paintings pinned along the low side wall, above the cots
  L.deco(() => {
    const rp = new Rng(lot.seed ^ 77);
    for (let q = KIT_T + 1.4; q < qB - 0.8; q += 0.52) {
      const y = 1.15 + rp.f(-0.06, 0.06), w = rp.f(0.3, 0.4), h = rp.f(0.3, 0.42);
      g.mat('paper', ['#fff8ea', '#f6efe0', '#fff3dc'][rp.i(0, 2)]); L.box(0.166, y, q, 0.172, y + h, q + w);
      for (let m = 0; m < 3; m++) { g.mat('paint', pal.soft[rp.i(0, 5)]); const qq = q + rp.f(0.04, w - 0.14), yy = y + rp.f(0.04, h - 0.14), sz = rp.f(0.05, 0.12); L.box(0.172, yy, qq, 0.175, yy + sz, qq + sz * rp.f(0.6, 1.6)); }
      g.mat('cast', '#c8a45a'); L.box(0.172, y + h - 0.03, q + w / 2 - 0.01, 0.18, y + h - 0.01, q + w / 2 + 0.01);
    }
  });
  // a glass hatch in the floor over the warm pipes
  const hp = W - 2.2, hq = big ? qB - 1.7 : D - 2.6;
  L.structure(() => { g.mat('cast', '#c8a45a'); L.box(hp - 0.45, 0, hq - 0.3, hp + 0.45, 0.012, hq + 0.3); g.mat('felt', '#c9a46a'); for (const dq of [-0.12, 0.12]) L.tube([[hp - 0.42, -0.07, hq + dq], [hp + 0.42, -0.07, hq + dq]], 0.055, { segs: 8 }); g.mat('cast', '#c47a45'); L.tube([[hp - 0.42, -0.05, hq], [hp + 0.42, -0.05, hq]], 0.03, { segs: 8 }); });
  L.glass(hp - 0.42, 0.012, hq - 0.27, hp + 0.42, 0.012, hq + 0.27, { opacity: 0.2, tint: '#fff2dc' });
  await tick();

  // ---- the low gate inside the door, coats on low hooks beside it, small shoes on the floor under them
  L.prop('lots-rooms.gate', dp, 0, KIT_T + 0.45, 0, { w: 1.0, col: pal.soft[1] });
  const cq0 = KIT_T + 0.08, c1 = dp + 0.8 + Math.min(2.2, ww - 0.2);
  L.deco(() => { g.mat('wood', '#c9a46a'); L.box(dp + 0.8, 0.95, cq0, c1, 1.02, cq0 + 0.03); g.mat('cast', '#c8a45a'); for (let k = 0; k < 7; k++) { const p = dp + 0.95 + k * 0.3; if (p < c1) L.tube([[p, 0.99, cq0 + 0.03], [p, 1.0, cq0 + 0.1]], 0.009, { segs: 4 }); } });
  for (let k = 0; k < 7; k++) { const p = dp + 0.95 + k * 0.3; if (p < c1 && (((lot.seed >> k) & 1) || k < 2)) L.prop('school.coat', p, 0.99, cq0 + 0.06, 0, { a: pal.soft[(k + lot.seed) % 6], lining: pal.soft[(k + 3) % 6], len: 0.4, hood: k % 2 === 0, patch: k % 3 === 0 ? pal.soft[(k + 1) % 6] : null }); }
  L.detail(() => { const rs = new Rng(lot.seed ^ 3); for (let k = 0; k < 6; k++) { const p = dp + 0.95 + k * 0.32; if (p > c1) break; g.mat('paint', pal.soft[rs.i(0, 5)]); const q = cq0 + 0.25; L.box(p - 0.05, 0, q - 0.08, p - 0.005, 0.06, q + 0.06, { bevel: 0.015 }); L.box(p + 0.005, 0, q - 0.08, p + 0.05, 0.06, q + 0.06, { bevel: 0.015 }); } });
  L.interact({ p: dp + 1.6, q: KIT_T + 0.8, y: 1.0, radius: 1.1, prompt: 'Look at the coats', onUse: (gm) => say(gm, 'The coats', [fill(pickBy(lot.seed, 'coat', COAT_LINES), info, { a: nameBy(lot.seed, 'kid1'), b: nameBy(lot.seed, 'kid2') })]) });

  // ---- low shelves along the back wall: bins, picture books, dolls; cots for naps along the side
  const sh = big ? Math.min(W - 3.6, 6) : Math.min(W - 2.0, 6), shp = big ? (2.8 + W - 0.6) / 2 : W / 2, shq = big ? qB - 0.26 : D - 0.42;
  L.prop('shelving', shp, 0, shq, Math.PI, { w: sh, h: 0.75, d: 0.36, shelves: 2, wood: '#e8d2a8' });
  for (let k = 0; k < Math.floor(sh / 0.5); k++) {
    const p = shp - sh / 2 + 0.3 + k * 0.5;
    if (k % 3 === 0) L.prop('toys.bin', p, 0.1, shq - 0.02, Math.PI, { col: pal.soft[k % 6], fill: ['balls', 'blocks', 'mixed'][k % 3], seed: (k % 4) + 1 }, { noCollide: true });
    else if (k % 3 === 1) L.prop('civic.books', p, 0.44, shq - 0.02, Math.PI, { w: 0.42, seed: k % 4, cols: pal.soft });
    else L.prop('toys.doll', p, 0.785, shq - 0.02, Math.PI, { coat: pal.soft[k % 6], lining: pal.soft[(k + 2) % 6], patch: pal.soft[(k + 4) % 6], skin: ['#c98a5a', '#8a5a3a', '#e8c0a0'][k % 3], hair: '#3a2a20', sit: true }, { noCollide: true });
  }
  // cots for naps: along the side wall in a small room, in a row in the nap room of a big one
  const cots = [];
  if (big) {
    const ncb = Math.min(7, Math.floor((W - 3.4) / 0.95));
    for (let k = 0; k < ncb; k++) { const p = 0.75 + k * 0.95; L.prop('lots-rooms.cot', p, 0, D - 0.85, Math.PI, { wood: '#c9a46a', blanket: pal.soft[(k + lot.seed) % 3] }); cots.push([p, D - 0.85]); }
    // blankets on a shelf and a rocking chair for whoever sits with the sleepers, at the far end of the nap room
    const ep = W - 1.2;
    L.prop('shelving', ep, 0, D - 0.36, Math.PI, { w: 1.4, h: 1.6, shelves: 3, wood: '#e8d2a8' });
    for (let k = 1; k < 3; k++) for (let j = 0; j < 2; j++) L.prop('civic.folded', ep - 0.32 + j * 0.64, 0.08 + k * (1.6 - 0.11) / 3 + 0.025, D - 0.38, 0, { cols: [pal.soft[(k + j) % 6], '#fff3dc', pal.soft[(k + j + 2) % 6]], n: 3 }, { cast: false });
    L.prop('civic.armchair', ep - 0.4, 0, qB + 1.1, Math.PI * 0.8, { cloth: pal.soft[3], wood: '#7a5233', mend: pal.soft[1] }, { noSpots: true }); L.spot('sit', ep - 0.4, 0.43, qB + 1.1, Math.PI * 0.8, { tags: ['mind', 'nursery'] });
  }
  else for (let k = 0; k < 2; k++) { const q = D - 1.9 - k * 0.95; L.prop('lots-rooms.cot', 0.62, 0, q, Math.PI / 2, { wood: '#c9a46a', blanket: pal.soft[(k + lot.seed) % 6] }); cots.push([0.62, q]); }
  L.spot('work', big ? W / 2 : 1.4, 0, big ? D - 2.0 : D - 2.4, big ? 0 : -Math.PI / 2, { tags: ['mind', 'nursery'] });
  L.deco(() => { cots.forEach((c, k) => { if (k % 2 && big) return; g.mat('cast', '#c8a45a'); L.tube([[c[0], H, c[1]], [c[0], 1.95, c[1]]], 0.004, { segs: 3 }); L.tube([[c[0], 1.95, c[1] - 0.25], [c[0], 1.95, c[1] + 0.25]], 0.005, { segs: 3 }); for (let m = 0; m < 3; m++) { g.mat('felt', pal.soft[(m + k) % 6]); L.box(c[0] - 0.04, 1.78, c[1] - 0.24 + m * 0.2, c[0] + 0.04, 1.86, c[1] - 0.16 + m * 0.2, { bevel: 0.015 }); } }); });
  if (big) {
    // the aunts' bench along the low side wall, for whoever has come to collect
    L.prop('bench', 0.5, 0, 4.4, Math.PI / 2, { w: 2.4, back: true, wood: '#c9a46a' }, { noSpots: true });
    for (let i = 0; i < 4; i++) L.spot('sit', 0.5, 0.46, 3.5 + i * 0.6, Math.PI / 2, { tags: ['aunts', 'nursery'] });
    L.lamp('sconce', 0.2, 2.0, D - 1.8, { face: [1, 0], K: 2400, power: 0.25, clip });
  }
  await tick();

  // ---- the floor: a rug, cushions, blocks, a beanbag; children's places to play
  const fc = [W / 2 + 0.5, big ? 5.6 : 4.9];
  L.prop('rug', fc[0], 0, fc[1], 0, { w: Math.min(W - 3, big ? 5 : 3.4), d: big ? 3.6 : 2.6, a: pal.soft[3], b: pal.soft[1], mat: 'motif' }, { noCollide: true });
  for (let k = 0; k < (big ? 7 : 5); k++) { const a = k * 1.3 + 0.3, p = fc[0] + Math.sin(a) * 1.25, q = fc[1] + Math.cos(a) * 0.95; L.prop('school.cushion', p, 0, q, a, { a: pal.soft[k % 6], b: '#fff3dc', patch: k % 2 ? pal.soft[(k + 3) % 6] : null }, { noSpots: true }); L.spot('play', p, 0, q, a + Math.PI, { tags: ['kids', 'floor', 'nursery'] }); }
  for (let k = 0; k < 4; k++) { const a = k * 1.7, p = fc[0] + Math.sin(a) * 0.45, q = fc[1] + Math.cos(a) * 0.35; L.spot('play', p, 0, q, a, { tags: ['kids', 'floor', 'nursery'] }); }
  L.prop('school.blocks', fc[0] - 0.2, 0, fc[1] + 0.1, 0.4, { seed: lot.seed % 5 + 1, n: 5 });
  L.prop('toys.ball', fc[0] + 0.5, 0, fc[1] - 0.3, 0, { a: pal.soft[0], b: '#fff3dc' }, { noCollide: true });
  L.prop('toys.cab', fc[0] - 0.6, 0, fc[1] - 0.45, 1.2, { body: pal.soft[4], trim: '#fff3dc' }, { noCollide: true });
  L.prop('school.beanbag', W - 1.0, 0, Math.min(qB - 1.0, fc[1] + 1.5), -Math.PI / 2 - 0.4, { c: pal.soft[5], patch: pal.soft[1] }, { noSpots: true });
  L.interact({ p: fc[0], q: fc[1] - 1.4, y: 0.6, radius: 1.3, prompt: 'Feel the floor', onUse: (gm) => sayPick(gm, 'The Warm Floor', lot.seed ^ Math.floor(hourOf(gm)), 'floor', FLOOR_LINES, info) });
  // a low table with small chairs by the window, crayons and paper on it
  const tp = 2.7 + ww / 2, tq = KIT_T + 1.5;
  L.prop('school.lowtable', tp, 0, tq, 0, { w: 1.3, d: 0.6, h: 0.46, top: pal.soft[1] });
  for (const sg of [-1, 1]) for (const dp2 of [-0.35, 0.35]) { const p = tp + dp2, q = tq + sg * 0.5, a = sg < 0 ? 0 : Math.PI; L.prop('toys.chair', p, 0, q, a, { col: pal.soft[(dp2 > 0 ? 2 : 4) + (sg > 0 ? 1 : 0)] }, { noSpots: true }); L.spot('play', p, 0, q, a, { tags: ['kids', 'nursery'] }); }
  L.detail(() => { g.mat('paper', '#fff8ea'); L.box(tp - 0.4, 0.46, tq - 0.15, tp - 0.1, 0.465, tq + 0.1); g.mat('paint', pal.soft[0]); L.box(tp - 0.35, 0.465, tq - 0.08, tp - 0.15, 0.467, tq + 0.02); for (let k = 0; k < 4; k++) { g.mat('paint', pal.soft[k]); L.cyl(tp + 0.1 + k * 0.06, 0.46, tq - 0.05, 0.008, 0.1, { segs: 5 }); } });
  await tick();

  // ---- the minder's chair, a basket of mending, a kettle up out of reach
  const mp = W - 1.2, mq = big ? 4.0 : 3.2;
  L.prop('civic.armchair', mp, 0, mq, -Math.PI / 2 - 0.5, { cloth: pal.accent, wood: '#7a5233', mend: pal.soft[1] }, { noSpots: true });
  L.spot('counter', mp, 0.43, mq, -Math.PI / 2 - 0.5, { tags: ['mind', 'mend', 'nursery'] });
  L.prop('flats.basket', mp + 0.25, 0, mq + 0.75, 0.3, { r: 0.2, cloth: [pal.soft[0], pal.soft[3], '#fff3dc'] });
  L.furniture(() => { g.mat('wood', '#c9a46a'); L.box(W - 0.45, 1.55, mq - 1.4, W - 0.17, 1.59, mq - 0.4); });
  L.prop('civic.kettle', W - 0.3, 1.59, mq - 1.1, -Math.PI / 2, { enamel: pal.accent });
  for (let i = 0; i < 3; i++) L.prop('cup', W - 0.3, 1.59, mq - 0.85 + i * 0.13, 0, { glaze: pal.soft[i], lid: '#fff3dc' });
  L.interact({ p: mp - 0.9, q: mq, y: 1.0, radius: 1.2, kind: 'talk', prompt: 'Talk to the minder', onUse: (gm) => sayPick(gm, minder, lot.seed ^ Math.floor(hourOf(gm) / 3), 'minder', MINDER_LINES, info) });
  const DAY = { kind: 'notice', title: 'The day', lines: ['Half past seven: in.', 'Ten: the floor.', 'Twelve: lids lifted.', 'One: the cots.', 'Four: aunts.'], hand: true, paper: '#fff3dc' };
  L.sign(DAY, W - 0.17, 1.45, KIT_T + 1.0, [-1, 0], { w: 0.3, h: 0.42 });

  // ---- light: low, warm
  L.lamp('lantern', fc[0], 2.2, fc[1], { tint: pal.soft[1], clip, power: 0.6, drop: 0.7, r: 0.24 });
  L.lamp('globe', tp, 2.2, tq + 0.2, { K: 2700, power: 0.55, clip, drop: 0.7, r: 0.16 });
  if (!big) L.lamp('sconce', 0.2, 1.9, D - 2.4, { face: [1, 0], K: 2500, power: 0.3, clip });
  L.lamp('lantern', mp - 0.4, 2.2, mq, { tint: '#f2c879', clip, power: 0.4, drop: 0.7 });
  if (big) L.lamp('lantern', W * 0.25, 2.2, qB - 1.5, { tint: pal.soft[4], clip, power: 0.45, drop: 0.7 });

  // ---- walkways, people, sound, zone
  L.path([[dp, -0.7], [dp, 1.4], [fc[0] - 1.8, fc[1] - 1.4], [mp - 1.0, mq]], { width: 1.1 });
  if (big) L.path([[fc[0] - 1.8, fc[1] - 1.4], [1.5, qB - 1.0], [1.5, qB + 1.0], [W / 2, D - 2.0]], { width: 1.0 });
  else L.path([[fc[0] - 1.8, fc[1] - 1.4], [1.5, D - 2.4]], { width: 1.0 });
  L.spot('chat', 2.2, 0, qB - 1.4, Math.PI / 2, { tags: ['chat', 'nursery'] }); L.spot('chat', 2.9, 0, qB - 1.2, -Math.PI / 2 - 0.3, { tags: ['chat', 'nursery'] });
  nearLoop(L, 'kids', fc[0], 0.8, fc[1], (h) => (h >= 7.5 && h < 18 ? 0.22 : 0), { radius: 10, param: 0.3 });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: 'The Warm Floor', sub: info.name + ' · a day nursery', ambience: 'school', reverb: 'room', cell: info.key });
}

// ---------------------------------------------------------------------------------------------------------------
// Toys on loan
// ---------------------------------------------------------------------------------------------------------------
const TBRIGHT = ['#2f8a85', '#e8705a', '#e9b23c', '#7cab4e', '#3b4f8f', '#d9534f'], TTRIM = ['#f4ead2', '#2a2622', '#e9b23c'];
const TOYK = {
  cab: { name: 'toys.cab', w: 0.21, p: (r) => ({ body: r.pick(TBRIGHT), trim: r.pick(TTRIM) }) },
  top: { name: 'toys.top', w: 0.1, p: (r) => ({ a: r.pick(TBRIGHT), b: r.pick(TTRIM) }) },
  doll: { name: 'toys.doll', w: 0.13, p: (r) => ({ coat: r.pick(TBRIGHT), lining: r.pick(TTRIM), patch: r.pick(TBRIGHT), skin: r.pick(['#c98a5a', '#8a5a3a', '#e8c0a0']), hair: '#3a2a20', sit: true }) },
  blocks: { name: 'toys.blocks', w: 0.07, p: (r) => ({ seed: r.i(1, 4), n: r.i(2, 4) }) },
  ball: { name: 'toys.ball', w: 0.13, p: (r) => ({ a: r.pick(TBRIGHT), b: r.pick(TTRIM) }) },
  drum: { name: 'toys.drum', w: 0.15, p: (r) => ({ a: r.pick(TBRIGHT) }) },
  glide: { name: 'toys.glide', w: 0.22, p: (r) => ({ a: r.pick(TBRIGHT) }) },
  puzzle: { name: 'toys.puzzle', w: 0.31, p: (r) => ({ box: r.pick(['#e9dfc9', '#cfe0d8', '#f2d6c8']) }) },
};
const TOYS_PAL = [
  { wall: '#f0dcbc', dado: '#2f8a85', floor: ['planks', '#c49a6a'], wood: '#d2ab7a', dark: '#6b4a2f', sign: ['#2f8a85', '#f4ead2', '#e9b23c'] },
  { wall: '#efe2c6', dado: '#8a4a6a', floor: ['planks', '#b98a5a'], wood: '#c9a46a', dark: '#5b3d27', sign: ['#8a4a6a', '#f4ead2', '#e9b23c'] },
  { wall: '#e9e6d4', dado: '#3b4f8f', floor: ['planks', '#c49a6a'], wood: '#d8b88a', dark: '#4a3324', sign: ['#3b4f8f', '#f4ead2', '#e8705a'] },
];
const BORROW_LINES = [
  ['The keeper writes you in the ledger under "guest", with the name of your flat and a cab with one wheel missing, which you had been holding.', '"Back before you go," she says. "Mended or not. We mend them either way." Most toys here are older than their borrowers\' parents.'],
  ['You ask for the glide car. The keeper finds its card: forty-one borrowers since it was made, the last a boy on deck {deck} who kept it two years and brought it back with a new coat of paint.', '"New mass is twenty-five kays a kilo. A mended one is an afternoon." She writes your name under his.'],
  ['"Guests can borrow," says the keeper. "Guests mostly borrow tops." She hands you one. It spins long and slow at {g} of a g, and leans a little as the drum turns under it.', 'The ledger line says: top, red, guest, three days.'],
  ['You borrow a puzzle with a dawn on its lid: three bands of colour, brown-violet, rose, gold. Two pieces are hand-cut replacements, painted to match and not quite matching.', 'The ledger has a column for "pieces missing" and a column for "pieces made". The second is longer.'],
];
const MEND_LINES = [
  ['On the mending bench: a doll with a new arm turned from a chair leg, the glue still drying, a clamp holding it in a hug.', 'Every mend is left showing. The children like to find them. "Broken by Petra," a label says. "Mended by Petra\'s grandmother."'],
  ['A wooden cab with its little cabin off its pins, the pins laid out in a row. Whole, the cabin swings level in its yoke the way a real one leans against the turn.', 'The mender has drawn the yoke on a scrap of card, full size, with the word "level" underlined twice.'],
  ['A spinball with a split seam, being sewn shut with a curved needle and orange thread. It will be the only orange seam on it, and that will be how its borrowers know it.', 'The glue pot smells of the Mill\'s starch. Nothing here is made from an animal; nothing in the drum is.'],
  ['A kite with a torn sail and a patch of somebody\'s old shirt laid over the tear, pinned, ready to stitch.', 'The kite will fly worse and be loved more. The keeper says that is the usual trade.'],
];

export async function buildToys(s, lot, plan, game, tick) {
  const L = local(s, lot, tick), info = plan.info, r = new Rng(lot.seed), W = L.W, D = L.D, g = s.g, H = 3.2, big = lot.onCourt || D > 11;
  const pal = TOYS_PAL[r.i(0, TOYS_PAL.length - 1)], keeper = nameBy(lot.seed, 'toys');
  const dp = W - 1.5;
  const clip = await shell(L, info, { H, floor: pal.floor, ceil: ['paint', '#f4ead2'], wall: { tint: pal.wall, dado: { h: 0.8, mat: 'tile', tint: pal.dado }, skirt: '#6b4a2f' },
    glow: { sky: '#ffe2b8', ground: '#c49a6a', power: 0.38 },
    front: { style: 'glazed', door: { p: dp, w: 1.2 }, frame: pal.dado, plinth: pal.dark, awning: [pal.dado, '#f4ead2'], sign: { emblem: 'ball', palette: pal.sign }, doorTint: pal.dado } });
  await tick();
  ceilingWorks(L, H, { beam: '#efe2c6', beamMat: 'paint', every: 2.6, duct: '#c4c0b6', pipe: '#c47a45', side: 'lo' });
  await tick();

  // ---- shelves to the ceiling along the back wall and one side, full of toys; a rolling ladder
  const rt = new Rng(lot.seed ^ 0x51), kinds = Object.keys(TOYK), shH = 3.0, nS = 6;
  const backW = Math.min(W - 0.6, 12.8), b0 = (W - backW) / 2, nb = Math.max(1, Math.round(backW / 1.6)), bw = backW / nb;
  const shelfY = (k) => 0.08 + k * (shH - 0.11) / nS + 0.025;
  let count = 0;
  const cap = big ? 34 : 20, GAMES = ['#e9dfc9', '#cfe0d8', '#f2d6c8', '#e8705a', '#3b4f8f', '#e9b23c', '#7cab4e'];
  // a shelf: toys here and there, and between them boxed games stacked flat (cheap boxes, drawn in place)
  const fillShelf = (p0, p1, y, q, a, alongP) => {
    let u = p0 + 0.05;
    const dir = alongP ? 0 : 1, qd = (alongP ? (a === Math.PI ? 1 : -1) : (a === Math.PI / 2 ? -1 : 1));
    while (u < p1 - 0.08) {
      if (count < cap && rt.chance(0.55)) {
        const k = TOYK[rt.pick(kinds)]; if (u + k.w > p1 - 0.03) break;
        const m = u + k.w / 2;
        if (alongP) L.prop(k.name, m, y, q, a + rt.f(-0.3, 0.3), k.p(rt), { noCollide: true, cast: false });
        else L.prop(k.name, q, y, m, a + rt.f(-0.3, 0.3), k.p(rt), { noCollide: true, cast: false });
        u += k.w + rt.f(0.04, 0.12); count++;
      } else {
        const w = rt.f(0.18, 0.34); if (u + w > p1 - 0.03) break;
        const n = rt.i(1, 4); let yy = y;
        for (let m = 0; m < n; m++) { const h = rt.f(0.03, 0.07), dd = rt.f(0.18, 0.26); g.mat('paper', GAMES[rt.i(0, GAMES.length - 1)]); if (dir === 0) L.box(u, yy, q + qd * 0.02 - dd / 2, u + w, yy + h, q + qd * 0.02 + dd / 2, { faces: 'xXYzZ' }); else L.box(q + qd * 0.02 - dd / 2, yy, u, q + qd * 0.02 + dd / 2, yy + h, u + w, { faces: 'xXYzZ' }); yy += h + 0.002; }
        u += w + rt.f(0.03, 0.1);
      }
    }
    s.flush({ tier: 'd', cast: false });
  };
  for (let i = 0; i < nb; i++) {
    const pc = b0 + (i + 0.5) * bw;
    L.prop('shelving', pc, 0, D - 0.35, Math.PI, { w: bw - 0.04, h: shH, d: 0.32, shelves: nS, wood: pal.wood });
    for (let k = 1; k < nS; k++) fillShelf(pc - bw / 2 + 0.05, pc + bw / 2 - 0.05, shelfY(k), D - 0.4, Math.PI, true);
    if (i % 2 === 0) L.spot('browse', pc, 0, D - 1.1, 0, { tags: ['toys'] });
    await tick();
  }
  const sq0 = big ? 3.0 : 2.4, sq1 = D - 0.8, ns = Math.max(1, Math.round((sq1 - sq0) / 1.6)), sw = (sq1 - sq0) / ns;
  for (let i = 0; i < ns; i++) {
    const qc = sq0 + (i + 0.5) * sw;
    L.prop('shelving', 0.35, 0, qc, Math.PI / 2, { w: sw - 0.04, h: shH, d: 0.32, shelves: nS, wood: pal.wood });
    for (let k = 1; k < nS; k++) fillShelf(qc - sw / 2 + 0.05, qc + sw / 2 - 0.05, shelfY(k), 0.4, Math.PI / 2, false);
  }
  L.furniture(() => { g.mat('cast', '#c8a45a'); L.tube([[b0 + 0.3, shH + 0.05, D - 0.55], [b0 + backW - 0.3, shH + 0.05, D - 0.55]], 0.015, { segs: 6 }); });
  L.prop('food.ladder', b0 + backW * 0.62, 0, D - 0.7, Math.PI, { h: shH + 0.05, w: 0.45, lean: 0.55, wood: pal.dark });
  L.interact({ p: W * 0.4, q: D - 1.4, y: 1.4, radius: 1.5, prompt: 'Borrow a toy', onUse: (gm) => sayPick(gm, keeper, lot.seed ^ Math.floor(hourOf(gm)), 'borrow', BORROW_LINES, info) });
  await tick();

  // ---- the mending bench on the other side wall, under an arm lamp
  const mp = W - 0.75, mq = big ? 5.2 : 4.0;
  L.prop('craft.bench', mp, 0, mq, -Math.PI / 2, { w: 1.8, d: 0.7, wood: '#8a6a44' });
  L.prop('craft.gluepot', mp + 0.1, 0.86, mq - 0.55, 0, { glaze: '#2f6f73' });
  L.prop('toys.doll', mp - 0.05, 0.86, mq - 0.1, -Math.PI / 2 + 0.6, { coat: TBRIGHT[lot.seed % 6], lining: '#f4ead2', patch: '#e9b23c', skin: '#c98a5a', hair: '#3a2a20', sit: true }, { noCollide: true });
  L.prop('toys.cab', mp - 0.1, 0.86, mq + 0.35, 0.4, { body: TBRIGHT[(lot.seed + 2) % 6], trim: '#f4ead2' }, { noCollide: true });
  L.detail(() => { g.mat('cast', '#3a3630'); L.box(mp - 0.25, 0.86, mq + 0.55, mp - 0.05, 0.92, mq + 0.75); g.mat('weave', '#e8705a'); L.cyl(mp + 0.15, 0.86, mq + 0.6, 0.03, 0.05, { segs: 8 }); g.mat('weave', '#3b4f8f'); L.cyl(mp + 0.22, 0.86, mq + 0.52, 0.03, 0.05, { segs: 8 }); });
  L.prop('civic.armlamp', W - 0.2, 1.2, mq, -Math.PI / 2, { shade: pal.dado });
  L.lamp('spot', mp - 0.1, 1.85, mq, { K: 3200, power: 0.4, cone: [40, 18], range: 3, clip });
  L.prop('civic.rushstool', mp - 0.75, 0, mq, Math.PI / 2, { seat: pal.dado }, { noSpots: true });
  L.spot('work', mp - 0.7, 0, mq - 0.1, -Math.PI / 2, { tags: ['mend', 'toys'] });
  L.interact({ p: mp - 1.0, q: mq, y: 1.0, radius: 1.2, prompt: 'Watch the mending', onUse: (gm) => sayPick(gm, 'The mending bench', lot.seed ^ Math.floor(hourOf(gm) / 2), 'mend', MEND_LINES, info) });

  // ---- the keeper's desk and the ledger of who has what, by the door; kites over the room
  const kp = W - 1.9, kq = KIT_T + 1.6;
  L.prop('counter', kp, 0, kq, Math.PI, { w: 1.7, d: 0.55, h: 0.9, body: pal.dado, top: '#b98a5a' }, { noSpots: true });
  L.spot('counter', kp, 0, kq + 0.75, Math.PI, { tags: ['write', 'toys'] });
  L.spot('customer', kp - 0.3, 0, kq - 0.75, 0, { tags: ['toys'] });
  L.detail(() => { g.mat('leather', '#7a2a3a'); L.box(kp - 0.45, 0.9, kq - 0.2, kp + 0.25, 0.92, kq + 0.2); g.mat('paper', '#f1e6cc'); L.box(kp - 0.43, 0.92, kq - 0.18, kp - 0.11, 0.935, kq + 0.18); L.box(kp - 0.09, 0.92, kq - 0.18, kp + 0.23, 0.935, kq + 0.18); g.mat('plain', '#3a2c20'); for (let i = 0; i < 9; i++) { L.box(kp - 0.4, 0.936, kq - 0.15 + i * 0.035, kp - 0.15, 0.937, kq - 0.145 + i * 0.035); L.box(kp - 0.06, 0.936, kq - 0.15 + i * 0.035, kp + 0.2 - (i % 3) * 0.05, 0.937, kq - 0.145 + i * 0.035); } });
  L.prop('civic.drawers', kp + 1.05, 0, kq + 0.1, Math.PI, { w: 0.5, h: 1.0, d: 0.4, rows: 5, cols: 2, wood: pal.dark });
  L.prop('toys.top', kp + 0.55, 0.9, kq - 0.05, 0, { a: '#d9534f', b: '#f4ead2' });
  L.interact({ p: kp - 0.3, q: kq - 0.7, y: 1.1, radius: 1.2, prompt: 'Read the ledger', onUse: (gm) => {
    const a = nameBy(lot.seed, 'lg1'), b = nameBy(lot.seed, 'lg2'), c = nameBy(lot.seed, 'lg3');
    return say(gm, 'The ledger', ['Who has what, in a column of names and a column of toys: ' + a + ', a glide car. ' + b + ', the drum with the blue cord. ' + c + ', tops, three, "again".', 'A third column says what was mended when it came back, and by whom. Most lines have something in it. ' + pickBy(lot.seed, 'lg', ['One line just says: "returned with a better wheel than it went out with."', 'One entry, sixty years old, is a toy that has never come back. Somebody still writes "out" against it every year.', 'In the margin, a tally: toys mended this year. It runs on to the next page.', 'A note: "Nine thousand toys is not a lot. It is a lot to dust."'])]);
  } });
  for (let k = 0; k < (big ? 4 : 2); k++) { const p = W * (0.3 + k * (big ? 0.15 : 0.35)), q = 2.6 + k * 1.3; L.prop('toys.kite', p, H - 0.2, q, r.f(0, 3), { a: TBRIGHT[(k + lot.seed) % 6], b: '#f4ead2', patch: TBRIGHT[(k + 3) % 6], up: 0.7, tail: TBRIGHT[(k + 1) % 6] }, { tier: 'd' }); }
  await tick();

  // ---- a low table to try things at, children's chairs, play spots
  const tp = W / 2 - 0.3, tq = big ? 6.0 : 4.6;
  L.prop('rug', tp, 0, tq, 0, { w: 2.6, d: 1.8, a: pal.dado, b: '#e9b23c', mat: 'motif' }, { noCollide: true });
  L.prop('toys.table', tp, 0, tq, 0, { w: 1.1, d: 0.6, top: '#e9b23c', legs: '#f4ead2' });
  for (const sg of [-1, 1]) for (const dp2 of [-0.3, 0.3]) { const p = tp + dp2, q = tq + sg * 0.5, a = sg < 0 ? 0 : Math.PI; L.prop('toys.chair', p, 0, q, a, { col: TBRIGHT[(dp2 > 0 ? 1 : 3) + (sg > 0 ? 1 : 0)] }, { noSpots: true }); L.spot('play', p, 0, q, a, { tags: ['kids', 'toys'] }); }
  L.prop('toys.glide', tp - 0.2, 0.5, tq, 0.3, { a: '#e8705a' }, { noCollide: true });
  L.prop('toys.puzzle', tp + 0.25, 0.5, tq + 0.05, -0.2, { box: '#f2d6c8' }, { noCollide: true });
  for (let k = 0; k < 3; k++) L.spot('play', tp - 1.3 + k * 1.3, 0, tq + 1.4, Math.PI, { tags: ['kids', 'spin', 'toys'] });
  L.prop('toys.bin', tp + 1.3, 0, tq - 0.6, 0.4, { col: pal.dado, fill: 'mixed', seed: lot.seed % 4 + 1 });
  if (big) {
    const t2 = [W * 0.72, tq + 0.4];
    L.prop('rug', t2[0], 0, t2[1], Math.PI / 2, { w: 2.4, d: 1.8, a: '#e9b23c', b: pal.dado, mat: 'motif' }, { noCollide: true });
    L.prop('toys.table', t2[0], 0, t2[1], 0, { round: true, top: '#e8705a', legs: '#f4ead2' });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4, p = t2[0] + Math.sin(a) * 0.62, q = t2[1] + Math.cos(a) * 0.62; L.prop('toys.chair', p, 0, q, a + Math.PI, { col: TBRIGHT[k] }, { noSpots: true }); L.spot('play', p, 0, q, a + Math.PI, { tags: ['kids', 'toys'] }); }
    L.prop('toys.blocks', t2[0], 0.5, t2[1], 0.3, { seed: 2, n: 4 }, { noCollide: true });
    L.prop('school.rack', W * 0.45, 0, 2.6, 0, {});
    L.lamp('globe', t2[0], 2.45, t2[1], { K: 2900, power: 0.6, clip, drop: 0.6, r: 0.15 });
  }
  L.prop('bench', 1.6, 0, KIT_T + 0.6, 0, { w: 1.8, back: true, wood: pal.wood }, { noSpots: true }); for (let i = 0; i < 3; i++) L.spot('sit', 1.0 + i * 0.6, 0.46, KIT_T + 0.6, 0, { tags: ['waiting', 'toys'] });
  // two small signs: the rule of the room, and how to borrow
  L.sign({ kind: 'label', text: 'MENDED BETWEEN BORROWERS', sub: 'every mend shown · ask who did it', ink: pal.dark }, W - 0.17, 2.3, mq, [-1, 0], { w: 1.4, h: 0.12 });
  L.sign({ kind: 'notice', title: 'Borrowing', lines: ['Anything, any length', 'of time, by anyone.', 'Back mended or not.', 'Guests: tops.'], hand: true }, kp + 1.05, 1.45, kq + 0.32, [0, -1], { w: 0.3, h: 0.36 });

  // ---- light
  L.lamp('globe', tp, 2.45, tq, { K: 2900, power: 0.75, clip, drop: 0.6, r: 0.17 });
  L.lamp('strip', 0.9, H - 0.05, D - 0.9, { to: [W - 0.9, H - 0.05, D - 0.9], K: 3200, power: 0.5, clip, range: 4 });
  L.lamp('lantern', kp, 2.4, kq + 0.4, { tint: '#e9b23c', clip, power: 0.45, drop: 0.6 });
  if (big) L.lamp('lantern', W * 0.25, 2.4, 4.0, { tint: '#e8705a', clip, power: 0.45, drop: 0.6 });

  // ---- walkways, people, sound, zone
  L.path([[dp, -0.7], [dp, 1.2], [W / 2 + 0.6, tq - 1.4], [W * 0.4, D - 1.5]], { width: 1.1 });
  L.path([[W / 2 + 0.6, tq - 1.4], [mp - 1.1, mq]], { width: 1.0 });
  L.path([[W / 2 + 0.6, tq - 1.4], [1.3, sq0 + 0.6]], { width: 1.0 });
  L.spot('browse', 1.2, 0, sq0 + 0.8, -Math.PI / 2, { tags: ['toys'] });
  nearLoop(L, 'kids', tp, 0.8, tq, (h) => (h >= 8 && h < 19 ? 0.12 : 0), { radius: 9, param: 0.2 });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: 'Toys on loan', sub: info.name + ' · ' + lot.sub, ambience: 'shop', reverb: 'room', cell: info.key });
  void civicParts; void trims;
}
