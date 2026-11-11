// The block's rooms for music: the choir room (every block has a choir) and, on the High decks, the tea dance's small room.
import { defineProp, bunting } from '../world/props.js';
import { Rng, shadeHex } from '../core/util.js';
import { say, note } from '../city/lots.js';
import { local, shell, ceilingWorks, trims, pickBy, fill, sayPick, hourOf, gHere, nameBy, nearLoop, KIT_T } from './lots_rooms_kit.js';
import { civicParts } from './civic_parts.js';

const FELTS = [['#8a1f2e', '#2a2f6b', '#d9962a', '#1f6a6a', '#5a2a52', '#b8442e'], ['#2f6f73', '#c9962e', '#8a2f3c', '#33407a', '#6b7a3a', '#b5532e'], ['#5b3a6e', '#e0a040', '#1f4f6b', '#a8412b', '#3f7f6a', '#d4878a']];

// ---------------------------------------------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------------------------------------------
// A rack of long heliox flutes standing against a wall: a footboard, a top rail with notches, n flutes 1.1 to 1.28 m.
// Front toward +z, the rack runs along x. p: { n, wood, seed }
defineProp('lots-rooms.fluterack', (g, p) => {
  const n = p.n || 9, w = n * 0.2 + 0.2, wood = p.wood || '#6a4529', r = new Rng(p.seed || 3);
  g.mat('wood', wood); g.box(-w / 2, 0, -0.16, w / 2, 0.1, 0.12, { bevel: 0.01 }); g.box(-w / 2, 1.32, -0.16, w / 2, 1.39, 0.02, { bevel: 0.01 });
  for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.03, 0, -0.16, sx * w / 2 + 0.03, 1.42, -0.1, { bevel: 0.008 });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.2 + i * 0.2, len = r.f(1.1, 1.28), r0 = r.f(0.014, 0.019), z = -0.03;
    g.mat('wood', ['#c9a46a', '#8a5a2e', '#e0c48a', '#6b4a2f', '#b5653a'][i % 5], { rough: -0.2 }); g.tube([[x, 0.1, z], [x + 0.01, 0.1 + len, z - 0.05]], [r0, r0 * 0.8], { segs: 7 });
    g.mat('cast', '#c8a45a'); g.tube([[x + 0.007, 0.1 + len * 0.7, z - 0.035], [x + 0.008, 0.1 + len * 0.72, z - 0.036]], r0 + 0.003, { segs: 7 });
  }
  return { solid: [[-w / 2, 0, -0.16, w / 2, 1.4, 0.12]], tier: 's' };
});

// A teapot with a lid (electric: it sat on the loop plate). p: { glaze }
defineProp('lots-rooms.teapot', (g, p) => {
  const c = p.glaze || '#2f6f73';
  g.mat('glaze', c); g.lathe(0, 0, [[0, 0], [0.05, 0], [0.075, 0.03], [0.085, 0.07], [0.07, 0.11], [0.045, 0.125]], { segs: 16, capTop: false });
  g.mat('glaze', shadeHex(c, 1.25)); g.lathe(0, 0, [[0.047, 0.122], [0.04, 0.135], [0.012, 0.142], [0.014, 0.155], [0, 0.158]], { segs: 14, capBottom: false });
  g.mat('glaze', c); g.tube([[0.07, 0.05, 0], [0.11, 0.09, 0], [0.13, 0.13, 0]], [0.016, 0.012, 0.009], { segs: 6 }); g.tube([[-0.07, 0.11, 0], [-0.12, 0.1, 0], [-0.11, 0.04, 0], [-0.075, 0.03, 0]], 0.009, { segs: 5 });
  return { cast: false };
});

// A sprung floor the size of a rug: a raised parquet panel on rubber feet, a brass edge, a chalk mark at its middle.
// Centred at the origin, w along x, d along z. p: { w, d, wood, edge }
defineProp('lots-rooms.sprung', (g, p) => {
  const w = p.w || 3, d = p.d || 2.2, h = 0.07, wood = p.wood || '#b98a5a';
  g.mat('plain', '#2a2622'); g.box(-w / 2 + 0.03, 0, -d / 2 + 0.03, w / 2 - 0.03, 0.02, d / 2 - 0.03);
  g.mat('planks', wood, { rough: -0.2 }); g.box(-w / 2, 0.02, -d / 2, w / 2, h, d / 2, { faces: 'Y' });
  g.mat('planks', shadeHex(wood, 0.85), { rough: -0.2 }); g.box(-w / 2 + 0.35, h, -d / 2 + 0.35, w / 2 - 0.35, h + 0.002, d / 2 - 0.35, { faces: 'Y' });
  g.mat('cast', p.edge || '#c8a45a', { rough: -0.25 }); g.box(-w / 2 - 0.03, 0, -d / 2 - 0.03, w / 2 + 0.03, h + 0.004, -d / 2, { bevel: 0.006 }); g.box(-w / 2 - 0.03, 0, d / 2, w / 2 + 0.03, h + 0.004, d / 2 + 0.03, { bevel: 0.006 });
  g.box(-w / 2 - 0.03, 0, -d / 2, -w / 2, h + 0.004, d / 2, { bevel: 0.006 }); g.box(w / 2, 0, -d / 2, w / 2 + 0.03, h + 0.004, d / 2, { bevel: 0.006 });
  g.mat('plain', '#f1e6cf'); g.box(-0.08, h + 0.003, -0.006, 0.08, h + 0.004, 0.006, { faces: 'Y' }); g.box(-0.006, h + 0.003, -0.08, 0.006, h + 0.004, 0.08, { faces: 'Y' });
  return { cast: false, tier: 's' };
});

// ---------------------------------------------------------------------------------------------------------------
// shared: felt hangings on the walls (local sheets in bands of colour) and felt baffles under the ceiling
// ---------------------------------------------------------------------------------------------------------------
function feltWalls(L, H, felt, r, o = {}) {
  const g = L.g, W = L.W, D = L.D, y0 = o.y0 || 0.95, t = 0.19, q0 = o.q0 || KIT_T + 1.0, skipP = o.skip || [];
  L.deco(() => {
    let i = 0;
    const panel = (a, b, c, d2, ya, yb, col) => { g.mat('felt', col, { sway: 0.05 }); L.sheet([a[0], yb, a[1]], [b[0], yb, b[1]], [b[0], ya, b[1]], [a[0], ya, a[1]], { sag: 0.01, ripple: 0.025, nu: 5, nv: 2 }); void c; void d2; };
    for (let q = q0; q < D - 1.2; q += 1.25) { if (skipP.some((s) => s[0] === 'lo' && q + 1.1 > s[1] && q < s[2])) continue; panel([t, q + 1.1], [t, q], 0, 0, y0 + r.f(0, 0.12), H - 0.12, felt[i++ % felt.length]); }
    for (let q = q0; q < D - 1.2; q += 1.25) { if (skipP.some((s) => s[0] === 'hi' && q + 1.1 > s[1] && q < s[2])) continue; panel([W - t, q], [W - t, q + 1.1], 0, 0, y0 + r.f(0, 0.12), H - 0.12, felt[i++ % felt.length]); }
    if (!o.noBack) for (let p = 0.45; p < W - 1.0; p += 1.25) panel([p + 1.1, D - t], [p, D - t], 0, 0, y0 + r.f(0, 0.12), H - 0.12, felt[i++ % felt.length]);
    g.mat('cast', '#c8a45a'); L.tube([[t + 0.03, H - 0.1, q0], [t + 0.03, H - 0.1, D - 0.3]], 0.012, { segs: 5 }); L.tube([[W - t - 0.03, H - 0.1, q0], [W - t - 0.03, H - 0.1, D - 0.3]], 0.012, { segs: 5 });
    if (!o.noBack) L.tube([[0.3, H - 0.1, D - t - 0.03], [W - 0.3, H - 0.1, D - t - 0.03]], 0.012, { segs: 5 });
  });
  L.deco(() => {
    for (let k = 0, q = 1.6; q < D - 0.8; q += 1.9, k++) {
      const y = H - 0.36 - (k % 2) * 0.1; g.mat('felt', felt[(k * 2 + 1) % felt.length], { sway: 0.1 });
      L.sheet([0.9, y, q - 0.45], [W - 0.9, y, q - 0.45], [W - 0.9, y, q + 0.45], [0.9, y, q + 0.45], { sag: 0.06, nu: 6, nv: 2 });
      g.mat('weave', '#d8cdb8'); for (const p of [1.1, W - 1.1]) for (const dq of [-0.4, 0.4]) L.tube([[p, y, q + dq], [p, H, q + dq]], 0.004, { segs: 3, caps: false });
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// The choir room
// ---------------------------------------------------------------------------------------------------------------
const LISTEN_EVE = [
  ['They are working on a round. Each voice comes in a bar behind the last, bright and a little edged in this air, every note where it should be.', 'The felt on the walls drinks the echo. In a bare room heliox rings like a pot; in here it sounds close enough to touch.'],
  ['The leader stops them at the same bar four times. The fifth time nobody breathes in the wrong place, and she says nothing at all, which is praise.', 'Every block has a choir. You could tell {name} by this one blindfold: loud, a little sharp, and proud of both.'],
  ['The flutes come in under the voices: pipes as long as a child is tall, because in this air a pipe sings about ten semitones above its length.', 'An old man on the top step sings the low part with his eyes shut. The young woman beside him is reading it off his face.'],
  ['They sing a song with nothing in it but the names of things you can see from the Hollow\'s lawns. The far bank. The sunline. The lake. The long table.', 'At the end somebody laughs, because the drum came in a beat late, and then everybody does.'],
];
const LISTEN_DAY = [
  ['Nobody is singing now. Two of the choir are stacking part books and arguing, very quietly, about a single note.', 'Live music every night somewhere in every block, the saying goes. Tonight it is here.'],
  ['The room is empty and the felt holds it so quiet that you can hear the lamp.', 'On the conductor\'s stand somebody has left a pencil and a note: "Middles: you know what you did."'],
  ['A child is sitting on the bottom step practising one phrase on a flute that reaches past her head. She stops when she sees you, then starts again.', 'The rehearsal is in the evening. The steps are worn pale where the same feet have stood for a long time.'],
  ['Someone is tuning the drum, tapping and turning, tapping and turning.', '"Come back at half past seven," she says without looking up. "Bring your voice. Nobody here is too flat."'],
];
const FLUTE_LINES = [
  ['It stands to your chin. In this air sound runs nearly twice as fast, so a pipe sings about ten semitones sharp for its length, and a flute has to be about 1.2 metres long to sing the old notes.', 'You blow one note. The felt takes it and gives nothing back.'],
  ['A long flute, lent to members, a name and a date on a paper tag tied to it. Somebody has mended a crack near the foot with bright red thread, wound tight and lacquered over.', 'You hold it like a broom and do not try.'],
  ['Each pipe on the rack is tuned in this room\'s own air. A flute brought up from the Low decks would need tuning again, because the air is the same and the singers are not.', 'Somebody has written on the rack: "Back in the slot you took it from."'],
  ['The flute is lighter than it looks. At {g} of a g most things are.', 'The holes are a long reach apart. Children learn on a short one and are let near these at twelve.'],
];
const DRUM_TOAST = ['A dry, quick sound. The felt eats the ring of it.', 'The drum answers once and the room keeps none of it.', 'Somebody behind you says "On the beat, wanderer," without unkindness.', 'Tap. The skin is a woven cloth stretched tight and painted, not a hide: nobody here has seen an animal.'];

export async function buildChoir(s, lot, plan, game, tick) {
  const L = local(s, lot, tick), info = plan.info, r = new Rng(lot.seed), W = L.W, D = L.D, g = s.g, H = 3.3, big = lot.onCourt || D > 11, band = info.band;
  const felt = FELTS[r.i(0, FELTS.length - 1)], wood = ['#a8743f', '#8a5a32', '#c9a46a'][r.i(0, 2)];
  const leader = nameBy(lot.seed, 'choir');
  const dp = W - 1.5, ww = Math.min(4.6, W - 4.4);
  const clip = await shell(L, info, { H, floor: ['planks', '#5a3a24'], ceil: ['felt', shadeHex(felt[4], 0.55)], wall: { mat: 'felt', tint: shadeHex(felt[0], 0.85), dado: { h: 0.9, mat: 'wood', tint: '#4a2e1e' }, skirt: '#2a1c14' },
    glow: { sky: '#ffcf9a', ground: '#7a4a2a', power: 0.22 },
    front: { style: 'house', fin: { mat: 'paint', tint: felt[1], dado: { h: 1.0, mat: 'wood', tint: '#3a2a20' }, trim: '#e8c26a', door: felt[0] }, door: { p: dp, w: 1.2 }, windows: [{ p: 1.0, w: ww, h: 1.45, sill: 0.9 }], sign: { emblem: 'flute', palette: [felt[1], '#f1e6cf', '#e8b04a'] }, mat: felt[2] } });
  feltWalls(L, H, felt, r, { skip: [['lo', 2.6, 5.4]] });
  await tick();

  // ---- the risers: three steps across the back, the singers' places on them
  const RD = 0.86, qR0 = D - 0.2 - 3 * RD, rw = Math.min(W - 2.4, big ? 11 : 9), rp0 = (W - rw) / 2;
  for (let k = 0; k < 3; k++) {
    const q0 = qR0 + k * RD, top = 0.2 * (k + 1);
    L.block(rp0, 0, q0, rp0 + rw, top, D - 0.2, 'wood', shadeHex(wood, 0.92 + k * 0.05), { cast: false, surf: 'wood' });
    L.furniture(() => { g.mat('wood', '#3a2418'); L.box(rp0, top - 0.025, q0 - 0.015, rp0 + rw, top + 0.004, q0 + 0.02); g.mat('felt', felt[k + 1]); L.box(rp0 + 0.3, top + 0.002, q0 + 0.12, rp0 + rw - 0.3, top + 0.008, q0 + RD - 0.12); });
    const n = Math.floor((rw - 0.6) / 0.75);
    for (let i = 0; i < n; i++) L.spot('perform', rp0 + 0.6 + i * (rw - 1.2) / Math.max(1, n - 1) + r.f(-0.05, 0.05), top, q0 + RD * 0.45, Math.PI + r.f(-0.15, 0.15), { tags: ['sing', 'choir'] });
  }
  // rush stools at the ends of the top step for whoever needs to sit out a verse
  for (const p of [rp0 + 0.3, rp0 + rw - 0.3]) { L.prop('civic.rushstool', p, 0.6, D - 0.55, Math.PI, { seat: felt[2] }, { noSpots: true }); L.spot('sit', p, 1.06, D - 0.55, Math.PI, { tags: ['choir', 'rest'] }); }
  await tick();

  // ---- the leader's podium and stand, facing the risers
  const cq = qR0 - 1.7;
  L.furniture(() => { const c = L.P(W / 2, cq); g.mat('wood', '#4a2e1e'); g.cyl(c[0], 0, c[1], 0.5, 0.12, { segs: 20 }); g.mat('felt', felt[0]); g.cyl(c[0], 0.12, c[1], 0.45, 0.01, { segs: 20 }); });
  L.solid(W / 2 - 0.45, 0, cq - 0.45, W / 2 + 0.45, 0.12, cq + 0.45, { surf: 'felt' });
  L.prop('civic.stand', W / 2, 0, cq + 0.75, Math.PI, { metal: '#2a2620', desk: '#6a4529', h: 1.18 });
  L.spot('perform', W / 2, 0.12, cq, 0, { tags: ['sing', 'conduct', 'choir'] });
  L.lamp('spot', W / 2, H - 0.05, cq + 0.3, { K: 2900, power: 0.5, cone: [32, 14], range: 4.5, clip });
  // the band's corner beside the risers: drums at one end, a stand or two for the flutes at the other
  const dpq = [rp0 - 0.15 > 0.9 ? rp0 - 0.5 : W - 0.75, qR0 - 0.3];
  L.prop('civic.drum', dpq[0], 0, dpq[1], Math.PI, { kind: 'goblet', body: '#7a3b2e' });
  L.prop('civic.drum', dpq[0] - 0.45, 0, dpq[1] + 0.05, Math.PI, { kind: 'goblet', body: '#a8743f' });
  L.prop('civic.drum', dpq[0] - 0.2, 0, dpq[1] - 0.45, Math.PI, { kind: 'frame', body: '#9a6a3a' });
  L.spot('perform', dpq[0] - 0.25, 0, dpq[1] - 0.9, Math.PI * 0.9, { tags: ['drum', 'choir'] });
  L.interact({ p: dpq[0] - 0.2, q: dpq[1] - 0.7, y: 0.8, radius: 0.9, prompt: 'Tap the hand drum', onUse: (gm) => { L.sfx(gm, 'drum-tap', dpq[0], 0.5, dpq[1]); note(gm, pickBy(lot.seed ^ Math.floor(hourOf(gm) * 7), 'drum', DRUM_TOAST)); } });
  for (const p of [rp0 + 0.6, rp0 + 1.4]) { L.prop('civic.stand', p, 0, qR0 - 0.75, Math.PI, { metal: '#2a2620', desk: '#6a4529', h: 1.1 }); L.spot('perform', p, 0, qR0 - 0.3, Math.PI, { tags: ['flute', 'choir'] }); }
  await tick();

  // ---- the flute rack on the low side wall, part books on the other
  L.prop('lots-rooms.fluterack', 0.35, 0, 4.0, Math.PI / 2, { n: 11, wood: '#6a4529', seed: lot.seed % 13 });
  L.sign({ kind: 'label', text: 'FLUTES · 1.2 m', sub: 'lent to members · tuned in this air', ink: '#f1e6cf' }, 0.18, 1.62, 4.0, [1, 0], { w: 1.2, h: 0.13 });
  L.lamp('sconce', 0.2, 2.2, 4.0, { face: [1, 0], K: 2700, power: 0.45, clip });
  L.interact({ p: 1.2, q: 4.0, y: 1.0, radius: 1.2, prompt: 'Lift down a flute', onUse: async (gm) => { L.sfx(gm, 'flute-note', 0.5, 1.2, 4.0); await sayPick(gm, 'A choir flute', lot.seed, 'flute', FLUTE_LINES, info); if (gm.journal && gm.journal.find) gm.journal.find('long-flute'); } });
  const bp = W - 0.36, bq = Math.max(KIT_T + 1.4, qR0 - 2.6);
  L.prop('shelving', bp, 0, bq, -Math.PI / 2, { w: 1.8, h: 2.0, shelves: 4, wood: '#6a4529' });
  for (let k = 1; k < 4; k++) L.prop('civic.books', bp, 0.08 + k * (2.0 - 0.11) / 4 + 0.025, bq, -Math.PI / 2, { w: 1.7, seed: 50 + k + (lot.seed % 5), cols: ['#f1e6cf', '#e8dcc0', felt[2], felt[1], felt[0], '#efe4cc'] });
  L.detail(() => { const rc = new Rng(lot.seed ^ 31); for (let i = 0; i < 6; i++) { g.mat('felt', felt[i % felt.length]); const p = W - 0.6 + rc.f(-0.12, 0.12), q = bq + 1.25 + rc.f(-0.1, 0.1); L.box(p - 0.21, i * 0.07, q - 0.21, p + 0.21, i * 0.07 + 0.08, q + 0.21, { bevel: 0.03 }); } });
  await tick();

  // ---- the board: what the choir sings and when (by band)
  const ex = plan.exits || {}, nb1 = (ex.spin && ex.spin.name) || 'the next block', nb2 = (ex.anti && ex.anti.name) || 'the court';
  const BOARD = band === 'high' ? { kind: 'board', title: 'Elders\' choir', lines: ['Afternoons|three o\'clock', 'Tea after|in the small room', 'Nobody too old|ever', 'Low parts|wanted', 'Long Flight|from the terrace'], palette: [felt[1], '#f1e6cf', '#e8b04a'] }
    : band === 'middle' ? { kind: 'board', title: 'Every evening somewhere', lines: ['Here|half past seven', nb1 + '|eight', nb2 + '|nine', 'The court|Thursdays', 'Long Flight|first shift'], palette: [felt[1], '#f1e6cf', '#e8b04a'] }
      : { kind: 'board', title: 'Rehearsals', lines: ['Tuesdays|half past seven', 'Thursdays|the court', 'Children|half past five', 'Booking Day|a round before the feast', 'Long Flight|first shift'], palette: [felt[1], '#f1e6cf', '#e8b04a'] };
  L.sign(BOARD, W - 0.18, 1.7, bq + 1.9 > qR0 - 0.4 ? bq - 1.4 : bq + 1.9, [-1, 0], { w: 1.2, h: 0.85 });
  L.interact({ p: W - 1.0, q: bq, y: 1.4, radius: 1.3, prompt: 'Read the choir\'s board', onUse: (gm) => say(gm, BOARD.title, [BOARD.lines.map((l) => l.replace('|', ': ')).join('. ') + '.', fill(pickBy(lot.seed, 'board', ['Underneath, in chalk: "Sleeves are not for singing in. They are for flying in while singing."', 'Pinned below: a list of who has which part book, two names crossed out and written back in.', 'Somebody has added, small: "{leader} says breathe where the pencil says, not where your lungs say."', 'At the bottom: "Every block has a choir. Ours is the loud one."']), info, { leader })]) });

  // ---- listeners' chairs by the window, a lamp over them
  const nl = big ? 5 : 3;
  for (let k = 0; k < nl; k++) {
    const p = 1.2 + k * 0.85, q = 1.6 + (k % 2) * 0.25, a = (W / 2 - p) * 0.08;
    L.prop('chair', p, 0, q, a, { wood: k % 2 ? '#6a4529' : '#3a2a20', seat: felt[(k + 2) % felt.length], back: k % 2 ? 'slat' : 'hoop' }, { noSpots: true });
    L.spot('sit', p, 0.46, q, a, { tags: ['listen', 'choir'] });
    if (k === 1) L.seat(p, q, 0, a, 'Sit and listen', { onSit: (gm) => { const h = hourOf(gm); sayPick(gm, 'Listening', lot.seed ^ Math.floor(h), 'listen', h >= 17 && h < 22.5 ? LISTEN_EVE : LISTEN_DAY, info); if (h >= 17 && h < 22.5 && gm.journal && gm.journal.find) gm.journal.find('bright-voices'); } });
  }
  L.prop('plant', W - 0.6, 0, KIT_T + 0.6, 0.8, { kind: 'broad', size: 1.4, pot: felt[1], seed: 22 });
  L.lamp('lantern', 2.0, 2.4, 1.9, { tint: '#e8b04a', clip, power: 0.5, drop: 0.55 });

  // ---- light over the risers
  const ng = big ? 3 : 2;
  for (let k = 0; k < ng; k++) L.lamp('globe', rp0 + rw * (k + 0.5) / ng, 2.55, qR0 + 1.2, { K: 2700, power: 0.8, clip, drop: 0.55, r: 0.17 });
  if (big) {
    L.lamp('lantern', W - 2.0, 2.4, 3.0, { tint: '#e2574a', clip, power: 0.5, drop: 0.6 });
    // rows of benches for whoever comes to sit in on the rehearsal, an aisle up the middle
    for (const q of [cq - 2.2, cq - 3.4]) {
      if (q < KIT_T + 2.4) continue;
      for (const sg of [-1, 1]) {
        const p = W / 2 + sg * 1.9;
        L.prop('bench', p, 0, q, 0, { w: 2.6, back: true, wood: '#6a4529' }, { noSpots: true });
        for (let i = 0; i < 4; i++) L.spot('sit', p - 0.95 + i * 0.63, 0.46, q, 0, { tags: ['listen', 'choir'] });
      }
    }
    L.lamp('globe', W / 2, 2.5, cq - 2.8, { K: 2700, power: 0.55, clip, drop: 0.6, r: 0.15 });
  }

  // ---- walkways, people, sound, zone
  L.path([[dp, -0.7], [dp, 1.2], [W / 2 + 0.9, cq - 0.6], [W / 2 + 0.9, qR0 - 0.3]], { width: 1.1 });
  L.path([[W / 2 + 0.9, cq - 0.6], [1.5, 2.6], [1.2, 4.0]], { width: 1.0 });
  L.spot('chat', W - 1.6, 0, cq - 0.8, -Math.PI / 2 - 0.4, { tags: ['chat', 'choir'] });
  L.spot('chat', W - 2.3, 0, cq - 0.5, Math.PI / 2 + 0.3, { tags: ['chat', 'choir'] });
  nearLoop(L, 'choir', W / 2, 1.4, qR0 + 1.0, (h) => (h >= 17.4 && h < 22.4 ? 0.34 : band === 'high' && h >= 14.5 && h < 16.5 ? 0.3 : 0), { radius: 14 });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: band === 'high' ? 'The elders\' choir' : 'The choir room', sub: info.name + ' · ' + lot.sub, ambience: 'shop', reverb: 'felt', cell: info.key });
  void civicParts; void gHere; void trims; void ceilingWorks;
}

// ---------------------------------------------------------------------------------------------------------------
// The tea dance's small room (High decks)
// ---------------------------------------------------------------------------------------------------------------
const TEA_PAL = [
  { wall: '#efe0c8', dado: '#7a2a3a', floor: ['planks', '#8a6240'], accent: '#c9962e', cloth: '#e8dcc0', frame: '#3a2a20', sign: ['#7a2a3a', '#f6e7c4', '#e3b456'], awning: ['#7a2a3a', '#efe2c6'] },
  { wall: '#e6ece0', dado: '#2f6f73', floor: ['planks', '#a8794f'], accent: '#e0735a', cloth: '#f0e6d2', frame: '#24403d', sign: ['#24403d', '#f4efe4', '#e8b04a'], awning: ['#2f6f73', '#f1e6cf'] },
  { wall: '#f0e2d2', dado: '#33407a', floor: ['planks', '#9a6a3a'], accent: '#d4878a', cloth: '#efe4cc', frame: '#26306b', sign: ['#26306b', '#f1ead6', '#d4878a'], awning: ['#33407a', '#efe4cc'] },
];
const DANCE_LINES = [
  ['A partner of ninety-odd takes your hands without asking and steps you round the floor. At {g} of a g every step hangs a moment longer than your legs expect.', 'You come down from the turn a hand\'s width spinward of where you meant to. "Everybody does," she says. "That is the dance."'],
  ['The floor gives under you like a held breath. It is sprung on rubber feet so knees past a hundred can dance on it all afternoon.', 'Your partner counts the beats slower than the band plays them, because at this weight the band plays slow and the dancers hang.'],
  ['You are taught the first figure by a retired cab fitter who apologises for his feet, which are excellent.', '"A good share of the High decks\' marriages begin on a floor like this," he says. "Not mine. Mine began in a queue for jook."'],
  ['Two steps, a lift, and a long fall. The lift is nothing here and the fall takes its time.', 'When the music stops, everybody claps the band, and the band claps the floor.'],
];
const TEA_LINES = [
  ['Long-pour tea, 0.15. She pours from a height and the stream bends a little spinward on its way down, as poured tea does in a turning drum.', 'The lid goes on at once. Heliox takes the heat out of a cup four times faster than air.'],
  ['The tea comes in a lidded cup on a saucer with a crack mended in gold-coloured glaze. The lid is from a different set.', '"Lift the lid when you want it," she says, "not before. Nothing stays hot up here unless you let it."'],
  ['A cup of tea and a slice of steamed cake under a cloth. The cake is lighter than any cake below: things rise taller as the weight drops.', '0.15 for the tea. The cake is the band\'s, and they say it is for everybody.'],
  ['The keeper pours with her eyes on the dancers and does not spill. "Sixty years," she says. "You learn where the tea goes."', 'Spinward, it turns out. A little.'],
];
const WATCH_LINES = [
  ['From the chairs you watch the floor: four couples on a square the size of a rug, turning slowly, leaping slowly, laughing at the same moment.', 'Half a g makes old knees young for an afternoon, and nobody here wastes it.'],
  ['The band is a flute as long as a broom, a hand drum and a plucked thing with a long neck. They play the old tunes slower than the old tunes were written.', 'Every so often one of the dancers calls a name, and the band changes tune without stopping.'],
  ['A couple of a hundred and ten sit out a dance holding hands under the table. Their cups have the same mended lid.', 'Somebody tells you they met here. Somebody else says that is what everyone says.'],
  ['The dancers at the edge of the floor drift spinward a hand\'s width every leap, and step back anti between figures without thinking about it.', 'Children taught this as a rule: axis flies true, spin sinks, anti floats. Old people dance it.'],
];

export async function buildTea(s, lot, plan, game, tick) {
  const L = local(s, lot, tick), info = plan.info, r = new Rng(lot.seed), W = L.W, D = L.D, g = s.g, H = 3.3, big = lot.onCourt || D > 11;
  const pal = TEA_PAL[r.i(0, TEA_PAL.length - 1)], keeper = nameBy(lot.seed, 'tea');
  const dp = 1.5;
  const clip = await shell(L, info, { H, floor: pal.floor, ceil: ['paint', '#f2e8d4'], wall: { tint: pal.wall, dado: { h: 1.0, mat: 'flute', tint: pal.dado }, skirt: '#2a1c14' },
    glow: { sky: '#ffdcae', ground: '#a8794f', power: 0.32 },
    front: { style: 'glazed', door: { p: dp, w: 1.2 }, frame: pal.frame, plinth: pal.dado, awning: pal.awning, sign: { emblem: 'cup', palette: pal.sign }, doorTint: pal.dado } });
  await tick();
  ceilingWorks(L, H, { beam: '#efe4cc', beamMat: 'paint', every: 2.6, duct: '#b9b4aa', pipe: '#b07a45', side: 'hi' });
  trims(L, H, { rail: 2.3, railTint: pal.frame, band: pal.accent, bandH: 0.2 });
  await tick();

  // ---- the sprung floor in the middle, a ring of small tables round it
  const fw = big ? 5.0 : 3.2, fd = big ? 3.6 : 2.4, fc = [W / 2 + (big ? 0 : 0.4), big ? 6.0 : 4.6];
  L.prop('lots-rooms.sprung', fc[0], 0, fc[1], 0, { w: fw, d: fd, wood: '#b98a5a', edge: '#c8a45a' });
  L.solid(fc[0] - fw / 2, 0, fc[1] - fd / 2, fc[0] + fw / 2, 0.07, fc[1] + fd / 2, { surf: 'wood' });
  for (let k = 0; k < (big ? 6 : 4); k++) { const a = k / (big ? 6 : 4) * Math.PI * 2 + 0.4, p = fc[0] + Math.sin(a) * fw * 0.3, q = fc[1] + Math.cos(a) * fd * 0.3; L.spot('stand', p, 0.07, q, a + Math.PI, { tags: ['dance', 'tea'] }); }
  L.interact({ p: fc[0], q: fc[1], y: 0.9, radius: 1.4, prompt: 'Dance a figure', onUse: (gm) => { L.sfx(gm, 'land', fc[0], 0.1, fc[1]); return sayPick(gm, 'The floor', lot.seed ^ Math.floor(hourOf(gm) * 3), 'dance', DANCE_LINES, info); } });
  const tables = [];
  const tq = [1.5, D - 1.5], tps = [];
  for (const q of tq) for (let p = 1.6; p < W - 1.4; p += big ? Math.max(2.6, (W - 3) / 4) : 2.4) tps.push([p, q]);
  if (big) for (const p of [1.4, W - 1.4]) tps.push([p, fc[1]]);
  for (const t of tps) {
    if (Math.abs(t[0] - dp) < 1.0 && t[1] < 3) continue;
    if (t[1] > D - 2.5 && t[0] > W - 3.6) continue;            // the band's corner
    tables.push(t);
    L.prop('table', t[0], 0, t[1], 0, { round: true, w: 0.66, h: 0.72, wood: '#5b3d27', top: '#7a5233' });
    L.detail(() => { g.mat('weave', pal.cloth); const c = L.P(t[0], t[1]); g.cyl(c[0], 0.72, c[1], 0.36, 0.006, { segs: 18 }); });
    const ac = r.f(0, 1);
    for (const sg of [-1, 1]) { const a = Math.PI / 2 * sg + ac * 0.3, p = t[0] - Math.sin(a) * 0.55, q = t[1] - Math.cos(a) * 0.55; L.prop('chair', p, 0, q, a, { wood: sg > 0 ? '#5b3d27' : '#3a2a20', seat: sg > 0 ? pal.accent : pal.dado, back: sg > 0 ? 'hoop' : 'slat' }, { noSpots: true }); L.spot('sit', p, 0.46, q, a, { tags: ['tea', 'watch'] }); }
    L.prop('cup', t[0] - 0.12, 0.726, t[1] + 0.06, 0, { glaze: ['#f4efe4', pal.accent, '#8cc0b6'][tables.length % 3], lid: '#f4efe4' });
    L.prop('cup', t[0] + 0.12, 0.726, t[1] - 0.05, 0, { glaze: '#f4efe4', lid: pal.dado });
    if (tables.length % 2) L.prop('lots-rooms.teapot', t[0], 0.726, t[1] + 0.14, r.f(0, 3), { glaze: [pal.dado, pal.accent, '#2f6f73'][tables.length % 3] });
    else L.prop('bowl', t[0] + 0.02, 0.726, t[1] + 0.15, 0, { glaze: '#e9e1cf', lid: pal.accent, r: 0.08 });
  }
  const wt = tables[0] || [1.6, 1.5];
  L.seat(wt[0] - 0.55, wt[1], 0, Math.PI / 2, 'Sit and watch the dancers', { onSit: (gm) => sayPick(gm, 'The tea dance', lot.seed ^ Math.floor(hourOf(gm)), 'watch', WATCH_LINES, info) });
  await tick();

  // ---- the band's corner: a low dais, a long flute on its stand, a drum, a plucked thing, stands and chairs
  const bc = [W - 1.7, D - 1.45];
  L.block(bc[0] - 1.45, 0, bc[1] - 1.1, W - 0.2, 0.18, D - 0.2, 'wood', '#4a2e1e', { cast: false, surf: 'wood' });
  L.furniture(() => { g.mat('felt', pal.dado); L.box(bc[0] - 1.35, 0.18, bc[1] - 1.0, W - 0.3, 0.186, D - 0.3); });
  L.prop('court.flute', bc[0] - 0.9, 0.18, bc[1] - 0.6, 0, {});
  L.prop('court.drum', bc[0] + 0.7, 0.18, bc[1] - 0.2, 0, {});
  L.prop('civic.lute', W - 0.32, 1.6, bc[1] - 0.2, -Math.PI / 2, { body: '#8a5a2e', face: '#d9b57a' }, { tier: 'd' });
  for (const p of [bc[0] - 0.9, bc[0] + 0.1]) L.prop('civic.stand', p, 0.18, bc[1] - 0.75, Math.PI, { metal: '#2a2620', desk: '#6a4529', h: 1.05 });
  L.spot('perform', bc[0] - 0.9, 0.18, bc[1] - 0.25, Math.PI, { tags: ['flute', 'tea'] });
  L.spot('perform', bc[0] + 0.1, 0.18, bc[1] - 0.25, Math.PI + 0.3, { tags: ['sing', 'tea'] });
  L.spot('perform', bc[0] + 0.7, 0.18, bc[1] + 0.25, Math.PI - 0.4, { tags: ['drum', 'tea'] });
  L.lamp('spot', bc[0] - 0.3, H - 0.05, bc[1] - 0.4, { K: 2800, power: 0.45, cone: [40, 18], range: 4, clip });
  await tick();

  // ---- the tea counter on the low side: an urn on the loop, cups in rows, the keeper
  const kq = Math.min(D - 2.6, big ? 4.0 : 3.4), kp = 0.75;
  L.prop('counter', kp, 0, kq, Math.PI / 2, { w: 1.9, d: 0.6, h: 0.92, body: pal.dado, top: '#b98a5a' }, { noSpots: true });
  L.spot('counter', 0.3, 0, kq, Math.PI / 2, { tags: ['serve', 'tea'] });
  L.spot('customer', kp + 0.85, 0, kq + 0.2, -Math.PI / 2, { tags: ['tea'] });
  L.detail(() => {
    const c = L.P(kp - 0.05, kq - 0.55);
    g.mat('cast', '#c8a45a', { rough: -0.25 }); g.lathe(c[0], c[1], [[0.13, 0.92], [0.15, 1.0], [0.15, 1.32], [0.11, 1.4], [0.04, 1.44], [0.05, 1.48], [0, 1.49]], { segs: 16 });
    g.mat('plain', '#2a2622'); L.box(kp - 0.08, 0.98, kq - 0.42, kp - 0.02, 1.0, kq - 0.38);
  });
  for (let i = 0; i < 6; i++) L.prop('cup', kp + (i % 2) * 0.12 - 0.06, 0.92, kq + 0.05 + Math.floor(i / 2) * 0.13, 0, { glaze: ['#f4efe4', pal.accent, '#8cc0b6', pal.dado][i % 4], lid: '#f4efe4' });
  L.prop('lots-rooms.teapot', kp, 0.92, kq + 0.6, 0.6, { glaze: pal.dado });
  L.lamp('globe', kp + 0.1, 2.35, kq, { K: 2700, power: 0.6, clip, drop: 0.85, r: 0.15 });
  L.interact({ p: kp + 0.9, q: kq, y: 1.1, radius: 1.2, prompt: 'Ask for a cup of tea (0.15)', onUse: async (gm) => {
    if (gm.wallet && !gm.wallet.spend(0.15, 'Long-pour tea')) { await say(gm, keeper, ['Put that away. A guest\'s first cup is the band\'s.']); return; }
    L.sfx(gm, 'pour', kp, 1.0, kq); await sayPick(gm, keeper, lot.seed, 'tea', TEA_LINES, info);
  } });
  // a notice by the counter: the one small sign inside
  const TN = { kind: 'notice', title: 'Thursdays', lines: ['Tea at three.', 'The floor at half past.', 'Partners not required.', 'Sticks under the chairs,', 'not on the floor.'], hand: true };
  L.sign(TN, 0.18, 1.6, kq + 1.4, [1, 0], { w: 0.3, h: 0.4 });

  // ---- a long mirror on the back wall behind the floor, and paper garlands across the room
  {
    const m0 = Math.max(0.5, fc[0] - fw / 2), m1 = Math.min(bc[0] - 1.7, fc[0] + fw / 2);
    if (m1 - m0 > 1.0) {
      L.furniture(() => { g.mat('wood', '#c8a45a', { rough: -0.2 }); L.box(m0 - 0.06, 0.95, D - 0.2, m1 + 0.06, 2.35, D - 0.16, { bevel: 0.01 }); g.mat('diffuser', '#c9d4d0', { rough: -0.5 }); L.box(m0, 1.0, D - 0.16, m1, 2.3, D - 0.15); });
    }
    const cols = [pal.accent, pal.dado, '#f1e6cf', '#e8b04a', '#2f6f73'];
    const a = L.pt(0.4, 2.7, 1.2), b = L.pt(W - 0.4, 2.7, D - 1.4), c = L.pt(0.4, 2.75, D - 1.4), d = L.pt(W - 0.4, 2.75, 1.2);
    bunting(s, a, b, { colors: cols, sag: 0.25 }); bunting(s, c, d, { colors: cols, sag: 0.25 });
  }
  // ---- light: pendants over the floor and a lantern at the window
  L.lamp('globe', fc[0] - fw * 0.22, 2.5, fc[1], { K: 2700, power: 0.8, clip, drop: 0.7, r: 0.18 });
  L.lamp('globe', fc[0] + fw * 0.22, 2.5, fc[1], { K: 2700, power: 0.8, clip, drop: 0.7, r: 0.18 });
  L.lamp('lantern', W * 0.6, 2.4, 1.3, { tint: pal.accent, clip, power: 0.45, drop: 0.6 });
  if (big) L.lamp('lantern', W * 0.25, 2.4, D - 1.5, { tint: '#e8b04a', clip, power: 0.45, drop: 0.6 });

  // ---- walkways, people, sound, zone
  L.path([[dp, -0.7], [dp, 1.0], [kp + 1.1, kq], [fc[0] - fw / 2 - 0.4, fc[1]]], { width: 1.1 });
  L.path([[fc[0] - fw / 2 - 0.4, fc[1]], [fc[0], fc[1] + fd / 2 + 0.5], [bc[0] - 1.6, bc[1] - 1.2]], { width: 1.0 });
  L.spot('chat', fc[0] + fw / 2 + 0.5, 0, fc[1] - 0.3, -Math.PI / 2, { tags: ['chat', 'tea'] });
  L.spot('chat', fc[0] + fw / 2 + 0.6, 0, fc[1] + 0.5, -Math.PI / 2 - 0.5, { tags: ['chat', 'tea'] });
  nearLoop(L, 'murmur', fc[0], 1.2, fc[1], (h) => (h >= 13 && h < 19 ? 0.22 : h >= 9 && h < 22 ? 0.1 : 0), { radius: 10, param: 0.3 });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: 'The tea dance', sub: info.name + ' · ' + lot.sub, ambience: 'shop', reverb: 'room', cell: info.key });
  void gHere; void fill;
}
