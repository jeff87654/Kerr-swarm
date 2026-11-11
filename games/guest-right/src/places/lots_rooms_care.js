// The block's rooms for bodies and small children: the walk-in clinic, the day nursery (the Warm Floor) and the toys on loan.
import { defineProp } from '../world/props.js';
import { Rng, shadeHex } from '../core/util.js';
import { say, note } from '../city/lots.js';
import { local, shell, ceilingWorks, trims, partition, pickBy, fill, sayPick, hourOf, gHere, nameBy, KIT_T } from './lots_rooms_kit.js';
import { jar } from './civic_parts.js';

// ---------------------------------------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------------------------------------
// A curtained bay: a couch along one side, a rail round three sides (the back is the wall), curtains half drawn.
// Origin at the middle of the bay's open front edge's centre line; the bay runs back toward -z by d. p: { w, d, curtain, couch, left, drawn }
defineProp('lots-rooms.bay', (g, p) => {
  const w = p.w || 2.4, d = p.d || 2.6, cur = p.curtain || '#cfe3dc', cz = -d / 2, y = 2.3, H = p.H || 3.2;
  // the couch, head to the wall
  const x0 = -w / 2 + 0.35, x1 = x0 + 0.68, z0 = -d + 0.12, z1 = z0 + 1.85;
  g.mat('cast', '#c4c8c4', { rough: -0.1 }); for (const x of [x0 + 0.06, x1 - 0.06]) for (const z of [z0 + 0.08, z1 - 0.08]) g.tube([[x, 0, z], [x, 0.6, z]], 0.02, { segs: 6 });
  g.box(x0, 0.56, z0, x1, 0.6, z1);
  g.mat('paint', p.couch || '#5f9a8e', { rough: -0.25 }); g.box(x0 - 0.02, 0.6, z0, x1 + 0.02, 0.7, z1, { bevel: 0.03 }); g.box(x0 - 0.02, 0.7, z0, x1 + 0.02, 0.84, z0 + 0.42, { bevel: 0.04 });
  g.mat('paper', '#f6f2e8'); g.box(x0 + 0.04, 0.702, z0 + 0.42, x1 - 0.04, 0.708, z1 + 0.02); g.cyl((x0 + x1) / 2, 0.6, z1 + 0.05, 0.05, 0.04, { segs: 8 });
  g.mat('knit', p.blanket || '#e0735a'); g.box(x0 + 0.02, 0.708, z1 - 0.5, x1 - 0.02, 0.78, z1 - 0.06, { bevel: 0.02 });
  // a stool and a little trolley of lidded jars
  g.mat('cast', '#3a3630'); g.tube([[x1 + 0.45, 0, z0 + 0.9], [x1 + 0.45, 0.48, z0 + 0.9]], 0.02, { segs: 6 }); g.mat('paint', p.couch || '#5f9a8e'); g.cyl(x1 + 0.45, 0.48, z0 + 0.9, 0.17, 0.05, { segs: 14 });
  const tx = w / 2 - 0.35, tz = z0 + 0.3;
  g.mat('brushed', '#c9c4bb'); for (const y2 of [0.12, 0.5, 0.82]) g.box(tx - 0.2, y2, tz - 0.16, tx + 0.2, y2 + 0.02, tz + 0.16);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[tx + sx * 0.19, 0.04, tz + sz * 0.15], [tx + sx * 0.19, 0.84, tz + sz * 0.15]], 0.01, { segs: 4 });
  g.mat('plain', '#2a2622'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.ball(tx + sx * 0.19, 0.03, tz + sz * 0.15, 0.025, 0.025, 0.025, { segs: 6, rings: 4 });
  g.mat('glaze', '#f4efe4'); g.cyl(tx - 0.1, 0.84, tz, 0.04, 0.1, { segs: 10 }); g.mat('glaze', '#8cc0b6'); g.cyl(tx + 0.06, 0.84, tz - 0.04, 0.05, 0.08, { segs: 10 }); g.mat('glaze', '#e0735a'); g.cyl(tx + 0.06, 0.92, tz - 0.04, 0.052, 0.015, { segs: 10 });
  // the rail, on hangers to the ceiling
  g.mat('cast', '#c4c8c4');
  const rail = []; if (p.left !== false) rail.push([-w / 2 + 0.04, y, -d + 0.05]); rail.push([-w / 2 + 0.04, y, 0], [w / 2 - 0.04, y, 0], [w / 2 - 0.04, y, -d + 0.05]);
  g.tube(rail, 0.013, { segs: 6 });
  for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) g.tube([[x, y, 0], [x, H, 0]], 0.007, { segs: 4 });
  // the curtains: the front one half drawn, bunched toward one side; the side ones drawn
  g.mat('weave', cur, { sway: 0.2 });
  const dr = p.drawn === undefined ? 0.45 : p.drawn;
  g.sheet([w / 2 - 0.05, y - 0.02, 0.01], [w / 2 - 0.05 - (w - 0.1) * dr, y - 0.02, 0.01], [w / 2 - 0.05 - (w - 0.1) * dr, 0.25, 0.03], [w / 2 - 0.05, 0.25, 0.03], { ripple: 0.05, nu: 8, nv: 3 });
  g.sheet([-w / 2 + 0.05, y - 0.02, 0.01], [-w / 2 + 0.3, y - 0.02, 0.01], [-w / 2 + 0.32, 0.25, 0.04], [-w / 2 + 0.05, 0.25, 0.03], { ripple: 0.07, nu: 4, nv: 3 });
  g.sheet([w / 2 - 0.04, y - 0.02, -d + 0.08], [w / 2 - 0.04, y - 0.02, -0.04], [w / 2 - 0.05, 0.25, -0.04], [w / 2 - 0.05, 0.25, -d + 0.08], { ripple: 0.05, nu: 8, nv: 3 });
  if (p.left !== false) g.sheet([-w / 2 + 0.04, y - 0.02, -0.04], [-w / 2 + 0.04, y - 0.02, -d + 0.08], [-w / 2 + 0.05, 0.25, -d + 0.08], [-w / 2 + 0.05, 0.25, -0.04], { ripple: 0.05, nu: 8, nv: 3 });
  return { solid: [[x0 - 0.02, 0, z0, x1 + 0.02, 0.72, z1], [tx - 0.2, 0, tz - 0.16, tx + 0.2, 0.86, tz + 0.16]], posts: [[w / 2 - 0.04, -0.04, 0.03, 0.25, 2.3]], tier: 's', cast: false };
});

// A weighing post: a plate on the floor, a post marked in bands, a brass slider, a round dial. Front toward +z. p: { wood, bands }
defineProp('lots-rooms.scale', (g, p) => {
  const wood = p.wood || '#c9a77a';
  g.mat('wood', wood); g.box(-0.08, 0, -0.06, 0.08, 2.2, 0.04, { bevel: 0.01 });
  const bands = p.bands || ['#2f6f73', '#5f9a8e', '#8cc0b6', '#e8c27a', '#e0735a'];
  for (let i = 0; i < bands.length; i++) { g.mat('paint', bands[i]); g.box(-0.06, 0.6 + i * 0.3, 0.04, 0.06, 0.88 + i * 0.3, 0.046); }
  g.mat('plain', '#24403d'); for (let k = 0; k <= 20; k++) g.box(0.06, 0.2 + k * 0.1, 0.04, k % 5 === 0 ? 0.08 : 0.07, 0.205 + k * 0.1, 0.045);
  g.mat('cast', '#c8a45a', { rough: -0.2 }); g.box(-0.1, 1.6, 0.0, 0.1, 1.72, 0.07, { bevel: 0.01 }); g.box(-0.08, 1.64, 0.07, 0.08, 1.67, 0.32, { bevel: 0.006 });
  g.mat('speckle', '#3e4a48'); g.box(-0.4, 0, 0.06, 0.4, 0.06, 0.72, { bevel: 0.015 });
  g.mat('cast', '#c8a45a'); g.box(-0.35, 0.06, 0.11, 0.35, 0.064, 0.67);
  g.push(); g.move(0, 1.05, 0.045); g.rotX(Math.PI / 2);
  g.mat('cast', '#c8a45a'); g.cyl(0, 0, 0, 0.14, 0.03, { segs: 22 });
  g.mat('paint', '#f4efe4', { emissive: 0.35, lamp: true }); g.cyl(0, 0.03, 0, 0.12, 0.004, { segs: 22 });
  g.pop();
  g.mat('plain', '#1d1b18'); for (let k = 0; k < 10; k++) { const a = -2.2 + k * 0.49; g.box(Math.sin(a) * 0.1 - 0.003, 1.05 + Math.cos(a) * 0.1 - 0.003, 0.08, Math.sin(a) * 0.1 + 0.003, 1.05 + Math.cos(a) * 0.1 + 0.003, 0.082); }
  g.mat('plain', '#e0735a'); g.tube([[0, 1.05, 0.083], [0.05, 1.13, 0.083]], 0.004, { segs: 4 });
  return { solid: [[-0.4, 0, 0.06, 0.4, 0.06, 0.72]], posts: [[0, -0.01, 0.1, 0, 2.2]], tier: 's' };
});

// A weighing chair for the old: an armchair on a brass platform with a dial on a stalk beside it. Front toward +z. p: { cloth }
defineProp('lots-rooms.chairscale', (g, p) => {
  g.mat('cast', '#c8a45a', { rough: -0.2 }); g.box(-0.42, 0, -0.42, 0.42, 0.08, 0.42, { bevel: 0.02 });
  g.mat('wood', '#5b3d27'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.26, 0.08, sz * 0.24], [sx * 0.25, 0.42, sz * 0.23]], 0.022, { segs: 6 });
  g.mat('weave', p.cloth || '#8cc0b6'); g.box(-0.3, 0.42, -0.3, 0.3, 0.52, 0.3, { bevel: 0.04 }); g.box(-0.3, 0.52, -0.34, 0.3, 1.05, -0.2, { bevel: 0.05 });
  g.mat('wood', '#5b3d27'); for (const sx of [-1, 1]) g.box(sx * 0.3 - 0.04, 0.68, -0.3, sx * 0.3 + 0.04, 0.72, 0.3, { bevel: 0.015 });
  g.mat('cast', '#3a3630'); g.tube([[0.5, 0.08, -0.1], [0.5, 1.2, -0.1]], 0.02, { segs: 6 }); g.box(0.4, 0, -0.42, 0.6, 0.08, 0.2, { bevel: 0.01 });
  g.push(); g.move(0.5, 1.28, -0.08); g.rotX(Math.PI / 2);
  g.mat('cast', '#c8a45a'); g.cyl(0, 0, 0, 0.14, 0.04, { segs: 20 }); g.mat('paint', '#f4efe4', { emissive: 0.35, lamp: true }); g.cyl(0, 0.04, 0, 0.12, 0.004, { segs: 20 });
  g.pop();
  return { solid: [[-0.42, 0, -0.42, 0.42, 0.5, 0.42]], posts: [[0.5, -0.1, 0.05, 0, 1.4]], spots: [{ type: 'sit', x: 0, y: 0.52, z: 0.02, yaw: 0, tags: ['measure', 'clinic'] }], tier: 's' };
});

// A stand of walking sticks. p: {}
defineProp('lots-rooms.sticks', (g) => {
  g.mat('cast', '#3a3630'); g.lathe(0, 0, [[0.14, 0], [0.15, 0.02], [0.13, 0.5], [0.14, 0.52], [0.12, 0.52]], { segs: 14, capTop: false });
  const r = new Rng(7), cols = ['#5b3d27', '#8a5a2e', '#2f2c28', '#a8743f', '#c9552e'];
  for (let i = 0; i < 5; i++) { const a = i * 1.3, x = Math.cos(a) * 0.06, z = Math.sin(a) * 0.06, tx = x * 2.2, tz = z * 2.2; g.mat('wood', cols[i]); g.tube([[x, 0.02, z], [tx, 0.86 + r.f(0, 0.06), tz]], 0.012, { segs: 5 }); g.tube([[tx, 0.86 + 0.03, tz], [tx + 0.05, 0.92, tz], [tx + 0.1, 0.88, tz]], 0.013, { segs: 5 }); }
  return { posts: [[0, 0, 0.15, 0, 0.9]] };
});

// ---------------------------------------------------------------------------------------------------------------
// The clinic
// ---------------------------------------------------------------------------------------------------------------
const CLINIC_PAL = [
  { wall: '#e4ece7', tile: '#8cc0b6', floor: '#c5cfca', accent: '#2f6f73', warm: '#e0735a', birch: '#c9a77a', curtain: '#cfe3dc', couch: '#5f9a8e', sign: ['#2f6f73', '#f4efe4', '#9fe0d0'] },
  { wall: '#e9e6dc', tile: '#9cb4d8', floor: '#cfcabd', accent: '#33407a', warm: '#e0a040', birch: '#c9a46a', curtain: '#dfe6f2', couch: '#4a5f9a', sign: ['#26306b', '#f1ead6', '#e0b04a'] },
  { wall: '#eee6df', tile: '#c8a8b8', floor: '#cdc4bc', accent: '#5b3a6e', warm: '#6c9a4c', birch: '#b98a5a', curtain: '#f0e2e6', couch: '#7a5a8a', sign: ['#3d2a4d', '#f2e3cf', '#c8a8b8'] },
];
const NURSE_LINES = [
  ['Where did you sleep last night? Have you eaten? Then sit. The kettle is on the loop and the cups have lids.', 'The clinic is commons, like the air and the lit streets. Nobody here has ever been asked for a kay.', 'If you only came in to sit somewhere with someone in it, that is allowed. Half of {name} does it.'],
  ['A guest. I can tell by the shoes. Nobody in {name} wears shoes with that much tread.', 'I have nursed this block {years} years. Chervil hires its own people first, so the clinic knows everybody, and everybody knows which of us lies about their knees.', 'Have some Nine before you go. You look peaky, and it is free on the hall table.'],
  ['People live about a hundred and twenty years here, so mostly I see the same faces for a very long time.', 'Bones grow best heavy. That is why the families live low, and why the old come down for their bone days.', 'You are {g} of what you would weigh at the rim, here. Stand on the plate if you want the dial to say it.'],
  ['Every birth in the block is seen here and written in the book, proofread or not. A child is a child.', 'Two names on every naming: the child\'s, and the name of the one whose share they carry. I write both. My hand is very tired by Booking Day.', 'Sit down if you are dizzy. Guests often are, the first week, from the turning.'],
  ['Nothing here is new. The couch covers are on their fourth set of seams, and you can see every one.', 'A new couch is a hundred kilos of mass at twenty-five kays a kilo. We would rather mend the old one and spend the kays on a nurse\'s hours.', 'An hour of anyone\'s time in Chervil is about six kays. Mine is paid from the commons, so yours costs you nothing.'],
];
const HIGH_NURSE = [
  ['Up here it is mostly the old, and mostly their bones. Half a g is kind to knees and unkind to everything inside them.', 'Bone days are on the board: a morning down on the Low decks, at nearly a full weight, walking about and complaining. They come back hungry, which is the point.'],
  ['Most of my people are past a hundred. They come for the scale, the chair and the talk, in about that order of importance to them, and the reverse to me.', 'The elders\' choir rehearses next door. When they are flat I know someone has a cold before they do.'],
];
const BAY_LINES = [
  ['Behind the curtain: a couch with a fresh length of paper pulled over it, a blanket folded at the foot, a trolley of lidded jars.', 'The curtain has been mended along its hem in a different blue. Somebody has written the date of the mend on the tape.'],
  ['The bay is empty. On the couch somebody has left a paper crane folded out of the couch paper, very small.', 'The curtain rail squeaks on the third hanger. There is a note on the trolley: "Oil the third hanger. Third time of asking."'],
  ['A child\'s shoe under the couch, waiting to be noticed. The paper is torn where small heels drummed on it.', 'It smells of nothing at all, which in a drum takes effort.'],
  ['The curtain is half drawn for somebody\'s privacy that is not there. A blanket on the couch, knitted in four colours of leftover yarn.', 'On the trolley, a jar of plasters cut in the shapes of cabs and spinballs.'],
];
const SCALE_LINES = [
  'A card on the post: "This dial is set for {name}, {g} of a g. The same body weighs its full weight at the rim and half of it on the Hollow\'s floor."',
  'Under the dial, in pencil, the children\'s marks: names and heights going back further than the paint.',
  'The bands on the post are for children. A child who grows up past the top band was raised heavy enough, or so every parent believes.',
  'Somebody has scratched a small arrow on the dial: "where Ottilie was at a hundred". It is a long way round.',
];

export async function buildClinic(s, lot, plan, game, tick) {
  const L = local(s, lot, tick), info = plan.info, r = new Rng(lot.seed), W = L.W, D = L.D, g = s.g, H = 3.2, big = lot.onCourt || D > 11;
  const pal = CLINIC_PAL[r.i(0, CLINIC_PAL.length - 1)], band = info.band;
  const nurse = nameBy(lot.seed, 'nurse');
  // the front: a door near one end and a wide window to look in through
  const dp = 1.5, ww = Math.min(4.2, W - 4.0);
  const clip = await shell(L, info, { H, floor: ['speckle', pal.floor], ceil: ['paint', '#eef2ee'], wall: { tint: pal.wall, dado: { h: 1.15, mat: 'tile', tint: pal.tile }, skirt: pal.accent },
    glow: { sky: '#eef4ff', ground: pal.floor, power: 0.3 },
    front: { style: 'house', fin: { mat: 'paint', tint: shadeHex(pal.tile, 1.12), dado: { h: 0.95, mat: 'tile', tint: pal.accent }, trim: '#f4efe4', door: pal.accent }, door: { p: dp, w: 1.2 }, windows: [{ p: 2.7, w: ww, h: 1.5, sill: 0.85 }], sign: { emblem: 'drop', palette: pal.sign }, mat: pal.accent } });
  await tick();
  ceilingWorks(L, H, { beam: '#dfe7e2', beamMat: 'paint', every: 2.4, duct: '#c4c8c4', pipe: '#b07a45', side: 'lo' });
  trims(L, H, { rail: 2.15, railTint: pal.birch, band: shadeHex(pal.tile, 1.15), bandH: 0.22 });
  await tick();

  // ---- the back: curtained bays along the back wall (a back room behind a glazed partition when the room is big)
  const bayW = 2.5, bayD = 2.5, b0 = big ? 0.4 : W * 0.4, nb = Math.max(2, Math.floor((W - 0.3 - b0) / bayW));
  const bx0 = W - 0.2 - nb * bayW;
  for (let k = 0; k < nb; k++) {
    const p = bx0 + (k + 0.5) * bayW;
    L.prop('lots-rooms.bay', p, 0, D - 0.18 - bayD, Math.PI, { w: bayW, d: bayD, curtain: pal.curtain, couch: pal.couch, left: k === 0, drawn: [0.4, 0.55, 0.3, 0.5][(k + lot.seed) % 4], blanket: [pal.warm, '#e8c27a', '#8cc0b6'][k % 3] });
    L.spot('sit', p - bayW / 2 + 0.69, 0.72, D - 1.2, Math.PI / 2, { tags: ['patient', 'clinic'] });
    if (k % 2 === 0) L.spot('work', p + 0.4, 0, D - bayD + 0.5, -Math.PI / 2 + 0.6, { tags: ['nurse', 'clinic'] });
  }
  L.interact({ p: bx0 + bayW * 0.5, q: D - bayD - 0.4, y: 1.0, radius: 1.3, prompt: 'Look behind the curtain', onUse: (gm) => sayPick(gm, 'A bay', lot.seed, 'bay', BAY_LINES, info) });
  await tick();
  if (big) {
    // a glazed partition across the room, with two open doorways, between the waiting room and the bays
    const qP = D - bayD - 2.0;
    partition(L, qP, H, { tint: pal.wall, dado: { h: 1.15, mat: 'tile', tint: pal.tile }, skirt: pal.accent, openings: [{ at: 1.2, w: 1.4, h: 2.2 }, { at: W - 0.32 - 2.6, w: 1.4, h: 2.2 }, { at: 3.4, w: Math.max(1, W - 0.32 - 7.0), h: 0.95, sill: 1.25 }] });
    L.glass(3.56, 1.25, qP, 3.56 + Math.max(1, W - 0.32 - 7.0), 2.2, qP, { tint: '#e8f2ee', opacity: 0.45 });
    // a consulting desk and a cabinet in the back room, at the low end
    L.prop('table', 1.4, 0, qP + 1.3, 0, { w: 1.2, d: 0.65, wood: pal.birch });
    L.prop('chair', 1.4, 0, qP + 1.95, Math.PI, { wood: '#7a5233', seat: pal.tile }, { noSpots: true }); L.spot('sit', 1.4, 0.46, qP + 1.95, Math.PI, { tags: ['nurse', 'write', 'clinic'] });
    L.prop('chair', 2.3, 0, qP + 1.0, -Math.PI / 2, { wood: pal.birch, back: 'slat' }, { noSpots: true }); L.spot('sit', 2.3, 0.46, qP + 1.0, -Math.PI / 2, { tags: ['patient', 'clinic'] });
    L.prop('civic.desklamp', 1.0, 0.74, qP + 1.15, 0, { shade: pal.accent });
    L.lamp('bulb', 1.0, 1.05, qP + 1.15, { K: 2900, power: 0.3, range: 2.6, clip });
    L.lamp('panel', W * 0.6, H - 0.04, (qP + D) / 2, { w: 1.6, d: 0.6, K: 4000, power: 0.6, clip, range: 7 });
    L.path([[1.9, qP - 1.0], [1.9, qP + 0.6], [W * 0.55, qP + 0.8]], { width: 1.1 });
  } else {
    L.lamp('panel', bx0 + nb * bayW / 2, H - 0.04, D - bayD * 0.55, { w: Math.min(2.2, nb * bayW - 0.6), d: 0.5, K: 4000, power: 0.55, clip, range: 6 });
  }
  // the cabinet of small drawers and a shelf of lidded jars on the back wall's other end (or the side wall)
  {
    const cp = big ? W - 0.4 : 0.4, ca = big ? -Math.PI / 2 : Math.PI / 2, cq = big ? 4.2 : D - 1.3;
    L.prop('civic.drawers', cp, 0, cq, ca, { w: 1.3, h: 1.2, d: 0.42, rows: 5, cols: 3, wood: '#e9efe9', pull: pal.accent });
    L.detail(() => { for (let i = 0; i < 4; i++) { const c = L.P(cp + (big ? 0.02 : -0.02), cq - 0.45 + i * 0.3); jar(g, c[0], 1.23, c[1], 0.05, 0.14, '#dfeae6', [pal.warm, pal.tile, pal.accent, '#f4efe4'][i], i % 2 ? '#f4efe4' : null); } });
    L.spot('work', cp + (big ? -0.75 : 0.75), 0, cq, ca, { tags: ['nurse', 'shelf', 'clinic'] });
  }
  await tick();

  // ---- the nurse's desk, turned to face the door, the jars behind it
  const dq = big ? 4.2 : 3.3, deskP = W - 1.95;
  L.prop('counter', deskP, 0, dq, -Math.PI / 2, { w: 2.0, d: 0.6, h: 0.92, body: '#e9efe9', top: pal.birch }, { noSpots: true });
  L.spot('counter', deskP + 0.8, 0, dq, -Math.PI / 2, { tags: ['nurse', 'write', 'clinic'] });
  L.spot('customer', deskP - 0.85, 0, dq + 0.3, Math.PI / 2, { tags: ['clinic'] });
  L.spot('queue', deskP - 1.6, 0, dq + 0.9, Math.PI / 2 - 0.3, { tags: ['clinic'] });
  L.prop('civic.desklamp', deskP + 0.05, 0.92, dq - 0.7, 0, { shade: pal.accent });
  L.lamp('bulb', deskP + 0.05, 1.25, dq - 0.7, { K: 3000, power: 0.25, range: 2.5, clip });
  L.prop('civic.bell', deskP - 0.1, 0.92, dq + 0.75, 0, {});
  L.prop('cup', deskP + 0.1, 0.92, dq + 0.45, 0, { glaze: pal.warm, lid: '#f4efe4' });
  L.detail(() => {
    // the day book open on the desk, a cup of pens, a coiled cuff in a tray
    g.mat('paper', '#f3ead6'); L.box(deskP - 0.2, 0.92, dq - 0.35, deskP + 0.2, 0.935, dq + 0.15); g.mat('leather', pal.accent); L.box(deskP - 0.21, 0.915, dq - 0.36, deskP + 0.21, 0.921, dq + 0.16);
    g.mat('plain', '#3a3a44'); for (let i = 0; i < 8; i++) L.box(deskP - 0.15, 0.936, dq - 0.3 + i * 0.05, deskP + 0.12 - (i % 3) * 0.05, 0.937, dq - 0.29 + i * 0.05);
    g.mat('glaze', pal.accent); L.cyl(deskP + 0.15, 0.92, dq + 0.25, 0.035, 0.1, { segs: 10 });
    g.mat('weave', '#3a4f6b'); L.tube([[deskP - 0.1, 0.94, dq + 0.3], [deskP, 0.95, dq + 0.42], [deskP + 0.05, 0.94, dq + 0.32]], 0.016, { segs: 5 });
  });
  L.prop('shelving', W - 0.35, 0, dq, -Math.PI / 2, { w: 2.2, h: 2.0, d: 0.3, shelves: 4, wood: pal.birch });
  L.detail(() => {
    const rj = new Rng(lot.seed ^ 77), glazes = ['#e9efe9', pal.tile, '#f4efe4', pal.warm, pal.accent, '#d6c49a'];
    for (let k = 1; k < 4; k++) {
      const y = 0.08 + k * (2.0 - 0.11) / 4 + 0.025; let q = dq - 1.0;
      while (q < dq + 0.9) { const rr = rj.f(0.04, 0.065), hh = rj.f(0.1, 0.2); const c = L.P(W - 0.35 + rj.f(-0.03, 0.03), q + rr); jar(g, c[0], y, c[1], rr, hh, rj.chance(0.5) ? '#dfeae6' : '#f0ead8', glazes[rj.i(0, glazes.length - 1)], rj.chance(0.6) ? ['#f4efe4', '#e8c27a', '#d4878a', '#a9d8c8'][rj.i(0, 3)] : null); q += rr * 2 + rj.f(0.03, 0.08); }
    }
  });
  const nurseTalk = async (gm) => {
    const sets = band === 'high' ? HIGH_NURSE.concat(NURSE_LINES.slice(0, 2)) : NURSE_LINES;
    await sayPick(gm, nurse, lot.seed, 'nurse', sets, info, { years: 6 + (lot.seed % 23) });
  };
  L.interact({ p: deskP - 0.9, q: dq, y: 1.2, radius: 1.3, kind: 'talk', prompt: 'Talk to the nurse', onUse: nurseTalk });
  L.interact({ p: deskP - 0.4, q: dq + 0.75, y: 1.0, radius: 0.7, prompt: 'Ring the desk bell', onUse: (gm) => { L.sfx(gm, 'bell', deskP - 0.1, 1.0, dq + 0.75); note(gm, pickBy(lot.seed, 'bell', ['A small bright ding. Somebody behind a curtain says, "Coming."', 'Ding. "One minute, I have a hundred and four year old on the scale."', 'Ding. A voice from the back: "Sit down, I can hear you are not bleeding."', 'Ding. Nobody comes, but the kettle clicks off, which seems like an answer.'])); } });
  await tick();

  // ---- the waiting bench along the side wall, cushions on it, a side table with water under a cloth
  const benchQ0 = 1.5, benchLen = big ? 3.2 : 2.4, bq = benchQ0 + benchLen / 2 + 0.6;
  L.prop('bench', 0.45, 0, bq, Math.PI / 2, { w: benchLen, back: true, wood: pal.birch, metal: pal.accent }, { noSpots: true });
  for (let i = 0; i < Math.floor(benchLen / 0.6); i++) { const q = bq - benchLen / 2 + 0.3 + i * 0.6; L.spot('sit', 0.45, 0.46, q, Math.PI / 2, { tags: ['waiting', 'clinic'] }); }
  L.detail(() => { for (let i = 0; i < 3; i++) { g.mat('weave', [pal.warm, pal.tile, '#d6c49a'][i]); const q = bq - benchLen / 2 + 0.45 + i * (benchLen - 0.9) / 2; L.box(0.28, 0.46, q - 0.2, 0.63, 0.52, q + 0.2, { bevel: 0.03 }); } });
  L.seat(0.45, bq, 0, Math.PI / 2, 'Sit and wait');
  L.prop('table', 0.45, 0, benchQ0, Math.PI / 2, { w: 0.55, d: 0.4, h: 0.7, wood: pal.birch });
  L.detail(() => { const c = L.P(0.45, benchQ0 - 0.08); g.mat('diffuser', '#dfeae6', { rough: -0.4 }); g.lathe(c[0], c[1], [[0.05, 0.7], [0.07, 0.75], [0.065, 0.92], [0.04, 0.96], [0.045, 0.99]], { segs: 12, capTop: false }); g.mat('weave', pal.tile); L.box(0.39, 0.99, benchQ0 - 0.14, 0.51, 1.0, benchQ0 - 0.02); });
  L.prop('cup', 0.5, 0.7, benchQ0 + 0.12, 0, { glaze: '#f4efe4', lid: pal.tile }); L.prop('cup', 0.38, 0.7, benchQ0 + 0.14, 0, { glaze: '#f4efe4', lid: pal.warm });
  if (big) {
    // a second bench back to back with a planter, facing the desk
    const p2 = W * 0.42;
    L.prop('bench', p2, 0, 3.0, 0, { w: 2.4, back: true, wood: pal.birch, metal: pal.accent }, { noSpots: true });
    for (let i = 0; i < 4; i++) L.spot('sit', p2 - 0.9 + i * 0.6, 0.46, 3.0, 0, { tags: ['waiting', 'clinic'] });
    L.prop('plant', p2 + 1.6, 0, 3.0, 0.3, { kind: 'broad', size: 1.4, pot: pal.accent, seed: 3 });
  }
  await tick();

  // ---- the scale: a post for standing on below, a weighing chair for the old up high
  const sq = big ? D - bayD - 3.3 : 5.3;
  const scaleAt = band === 'high' ? [1.0, sq, Math.PI / 2] : [0.3, sq, Math.PI / 2];
  if (band === 'high') L.prop('lots-rooms.chairscale', scaleAt[0], 0, scaleAt[1], scaleAt[2], { cloth: pal.tile }, { noSpots: true });
  else L.prop('lots-rooms.scale', scaleAt[0], 0, scaleAt[1], scaleAt[2], { wood: pal.birch, bands: [pal.accent, shadeHex(pal.tile, 0.8), pal.tile, '#e8c27a', pal.warm] });
  L.spot(band === 'high' ? 'sit' : 'stand', scaleAt[0] + (band === 'high' ? 0 : 0.4), band === 'high' ? 0.52 : 0, scaleAt[1], Math.PI / 2, { tags: ['measure', 'clinic'] });
  L.sign({ kind: 'label', text: 'MEASURED AT ' + info.g.toFixed(2) + ' g', sub: 'deck ' + info.d0 + ' · ' + (band === 'high' ? 'sit, do not stand' : 'socks on the plate'), ink: '#24403d' }, 0.18, 2.45, scaleAt[1], [1, 0], { w: 0.66, h: 0.16 });
  L.interact({ p: scaleAt[0] + 0.55, q: scaleAt[1], y: 1.0, radius: 1.1, prompt: band === 'high' ? 'Sit in the weighing chair' : 'Be weighed', onUse: async (gm) => {
    const gg = gHere(gm, info), kg = 64, reads = (kg * gg).toFixed(1);
    L.sfx(gm, 'clunk', scaleAt[0] + 0.3, 0.2, scaleAt[1]);
    const first = band === 'high' ? 'You sit. The brass platform sinks a finger\'s width and the dial on its stalk swings round and settles at ' + reads + '.' : 'You step on the plate in your socks. The slider comes down to the top of your head, and the dial swings and settles at ' + reads + '.';
    await say(gm, 'The scale', [first, 'You weigh ' + Math.round(gg * 100) + ' parts in a hundred of yourself at the rim. ' + fill(pickBy(lot.seed, 'scale', SCALE_LINES), info), pickBy(lot.seed, 'scale2', ['You are a guest, so nobody writes it in the book.', 'The nurse glances over and says, "You have been eating. Good."', 'A child in the queue reads it out loud to everyone.', 'The dial has been mended: a brass patch over the glass, soldered neatly, with a date scratched in.'])]);
    if (band === 'low' && gm.journal && gm.journal.find) gm.journal.find('low-deck-bones');
  } });
  await tick();

  // ---- the corner by the window: children below, armchairs and sticks above, a plant and a lamp in the middle decks
  const cp = Math.min(2.7 + ww / 2, W - 3.6), cq = 1.5;
  if (band === 'low') {
    L.prop('rug', cp, 0, cq, 0, { w: 2.0, d: 1.4, a: pal.warm, b: '#f2c879', mat: 'motif' }, { noCollide: true });
    L.prop('toys.table', cp, 0, cq, 0, { round: true, top: '#e8c27a' });
    const cc = ['#2f6f73', '#e0735a', '#f2c879'];
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.5, p = cp + Math.sin(a) * 0.62, q = cq + Math.cos(a) * 0.55; L.prop('toys.chair', p, 0, q, a + Math.PI, { col: cc[k] }, { noSpots: true }); L.spot('play', p, 0, q, a + Math.PI, { tags: ['kids', 'floor', 'clinic'] }); }
    L.prop('toys.bin', cp + 1.1, 0, cq - 0.6, 0.3, { col: pal.accent, fill: 'mixed', seed: lot.seed % 7 });
    L.lamp('lantern', cp, 2.3, cq, { tint: '#f2a48f', clip, power: 0.5, drop: 0.7 });
  } else if (band === 'high') {
    L.prop('civic.armchair', cp - 0.5, 0, cq, Math.PI * 0.85, { cloth: '#d4878a', wood: '#7a5233', mend: pal.accent }, { noSpots: true });
    L.prop('civic.armchair', cp + 0.6, 0, cq + 0.1, -Math.PI * 0.85, { cloth: pal.tile, wood: '#5b3d27', mend: pal.warm }, { noSpots: true });
    L.spot('sit', cp - 0.5, 0.43, cq, Math.PI * 0.85 + Math.PI, { tags: ['waiting', 'talk', 'clinic'] }); L.spot('sit', cp + 0.6, 0.43, cq + 0.1, -Math.PI * 0.85 + Math.PI, { tags: ['waiting', 'talk', 'clinic'] });
    L.prop('lots-rooms.sticks', cp + 1.5, 0, cq - 0.4, 0, {});
    L.lamp('lantern', cp, 2.3, cq + 0.3, { tint: '#f0d9a8', clip, power: 0.5, drop: 0.7 });
  } else {
    L.prop('chair', cp - 0.5, 0, cq, Math.PI * 0.9, { wood: '#7a5233', seat: pal.tile, back: 'slat' }, { noSpots: true }); L.spot('sit', cp - 0.5, 0.46, cq, Math.PI * 0.9 + Math.PI, { tags: ['waiting', 'clinic'] });
    L.prop('chair', cp + 0.5, 0, cq, -Math.PI * 0.9, { wood: pal.birch, seat: pal.warm }, { noSpots: true }); L.spot('sit', cp + 0.5, 0.46, cq, -Math.PI * 0.9 + Math.PI, { tags: ['waiting', 'clinic'] });
    L.prop('plant', cp + 1.4, 0, cq - 0.3, 0.6, { kind: 'fern', size: 1.0, pot: pal.warm, seed: 5 });
    L.lamp('lantern', cp, 2.3, cq + 0.3, { tint: '#f0d9a8', clip, power: 0.5, drop: 0.7 });
  }
  // pegs by the door with coats on them, a window box of herbs outside, a plate on the door jamb
  L.deco(() => { g.mat('wood', pal.birch); L.box(dp + 0.75, 1.62, KIT_T + 0.07, dp + 1.75, 1.7, KIT_T + 0.1); g.mat('cast', '#c8a45a'); for (let k = 0; k < 4; k++) L.tube([[dp + 0.88 + k * 0.25, 1.66, KIT_T + 0.1], [dp + 0.88 + k * 0.25, 1.68, KIT_T + 0.17]], 0.01, { segs: 4 }); });
  for (let k = 0; k < 3; k++) if ((lot.seed >> k) & 1 || k === 0) L.prop('school.coat', dp + 0.88 + k * 0.25, 1.66, KIT_T + 0.12, 0, { a: ['#26306b', '#8a2f3c', '#6b7a3a', '#c9962e'][(lot.seed + k) % 4], lining: pal.warm, len: band === 'low' && k === 2 ? 0.42 : 0.68, patch: k === 1 ? pal.tile : null });
  L.block(2.7, 0.62, -0.32, 2.7 + ww, 0.84, -0.04, 'wood', pal.accent, { bevel: 0.01, cast: false });
  L.detail(() => { const rh = new Rng(lot.seed ^ 9); g.mat('soil', '#ffffff'); L.box(2.75, 0.84, -0.29, 2.65 + ww, 0.86, -0.07); for (let p = 2.9; p < 2.6 + ww; p += 0.22) { g.mat(rh.chance(0.5) ? 'leafB' : 'leafA', '#ffffff', { sway: 0.4 }); const c = L.P(p + rh.f(-0.05, 0.05), -0.18); g.card(c[0], 0.85, c[1], 0.22, rh.f(0.18, 0.3), rh.f(0, 3)); } });
  L.sign({ kind: 'plate', text: 'ALWAYS FREE', lines: ['from the commons · walk in'] }, dp - 0.75, 1.45, -0.02, [0, -1], { w: 0.42, h: 0.18 });
  // the notice by the door (one sign: bone days, by band)
  const BONE = band === 'high' ? { kind: 'notice', title: 'Bone days', lines: ['Tuesdays: a cab down to', 'the Low decks, a morning', 'at nearly a full weight.', 'Back for the hall lunch.', 'Sticks provided.'] }
    : band === 'low' ? { kind: 'notice', title: 'Bone days', lines: ['Every child measured once', 'a year, in their birthday', 'week, here at ' + info.g.toFixed(2) + ' g.', 'Shoes off. Bring an aunt.', 'Nobody is too old. Ask.'] }
      : { kind: 'notice', title: 'The nurse is in', lines: ['Seven till seven: ' + nurse, 'Lamp-night: ring the bell', 'and someone comes down.', 'Always free.', 'Have some Nine.'] };
  L.sign(BONE, W - 0.18, 1.55, KIT_T + 0.9, [-1, 0], { w: 0.34, h: 0.46 });
  L.interact({ p: W - 0.8, q: KIT_T + 0.9, y: 1.5, radius: 0.9, prompt: 'Read the notice', onUse: (gm) => say(gm, BONE.title, [BONE.lines.join(' ').replace(/\s+/g, ' ')]) });
  L.prop('plant', W - 0.55, 0, big ? D - bayD - 2.6 : KIT_T + 1.8, 0.4, { kind: 'broad', size: 1.4, pot: pal.accent, seed: 2 });
  // light: a cool panel over the waiting room, the warm lamps already placed
  L.lamp('panel', W * 0.45, H - 0.04, big ? 3.0 : 3.6, { w: 1.2, d: 0.6, K: 4000, power: 0.6, clip, range: 6 });

  // ---- people, walkways, sound, zone
  L.path([[dp, -0.7], [dp, 1.2], [dp + 0.6, 3.0], [deskP - 1.2, dq + 0.2]], { width: 1.1 });
  L.path([[dp + 0.6, 3.0], [1.4, bq]], { width: 1.0 });
  L.path([[dp + 0.6, 3.0], [scaleAt[0] + 1.0, scaleAt[1]], [bx0 + bayW * 0.5, D - bayD - 0.4]], { width: 1.0 });
  L.spot('chat', W * 0.5 - 0.3, 0, big ? 5.0 : 4.6, Math.PI / 2, { tags: ['chat', 'clinic'] });
  L.spot('chat', W * 0.5 + 0.4, 0, big ? 5.1 : 4.7, -Math.PI / 2, { tags: ['chat', 'clinic'] });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: 'The clinic', sub: info.name + ' · ' + lot.sub, ambience: 'shop', reverb: 'room', env: { warmth: -0.12 }, cell: info.key });
}
