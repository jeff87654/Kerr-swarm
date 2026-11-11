// The block's working rooms: the block office (the court clerk, the draws, on the High decks the hour desk) and the laundry.
import { Rng, shadeHex } from '../core/util.js';
import { say, note } from '../city/lots.js';
import { local, shell, ceilingWorks, trims, pickBy, fill, sayPick, hourOf, nameBy, NAMES, KIT_T } from './lots_rooms_kit.js';
import { jar, wallClock } from './civic_parts.js';

// ---------------------------------------------------------------------------------------------------------------
// The block office
// ---------------------------------------------------------------------------------------------------------------
const OFFICE_PAL = [
  { green: '#2f4a3c', green2: '#3f6250', ox: '#7a2a3a', saff: '#e0a040', plaster: '#e6d8b8', walnut: '#5b3d27', floor: '#8a6240', board: ['#1f3329', '#f3e6c8', '#e0a040'] },
  { green: '#26306b', green2: '#33407a', ox: '#a8412b', saff: '#e8c26a', plaster: '#e9e2d0', walnut: '#4a3324', floor: '#9a6a3a', board: ['#1d2550', '#f1ead6', '#e8c26a'] },
  { green: '#5a2e22', green2: '#6e3a2a', ox: '#2f6f73', saff: '#d6a640', plaster: '#efe2c6', walnut: '#3a2a20', floor: '#a8794f', board: ['#3a2018', '#f6e7c4', '#d6a640'] },
];
const CLERK_LINES = [
  ['Where did you sleep last night, and have you eaten? Good. I keep the block court\'s list, its minutes and its time, in that order.', 'About three thousand of us meet once a week in the court. Noise, heat, rooms, Hollow swaps. Out loud, in minutes, and then we go and eat.'],
  ['The flats on the board are the drum\'s, not ours. Chervil keeps nearly three million places back: guest flats like yours, first homes for young couples, refuge for people from dark drums.', 'The block only says who gets which. The terraces and the Hollow\'s edge go by draw. The dim decks go to whoever is left, and they make them lovely anyway.'],
  ['Nobody is fined here. When a block says yes to more thirds than it has room for, ten years running, the drum answers with small things it already holds.', 'Our weight in the Hollow draw. Our couples\' turn in the flat lottery. Our place on the Long Flight. Nobody wants to fly at half past two.'],
  ['Two children by right; a third by the block\'s leave, asked for out loud in the court. About one a year, for a block this size, and the whole court knows the family by the end of the evening.', 'Nobody posts a price for a child here. That is the thing Rue\'s councillors write down every Booking Day.'],
  ['A first home is lent for five years, or until one of the couple inherits a place. Most marry at about twenty-five and borrow one.', 'A place passes whole, to one heir, usually a great-grandchild. It cannot be sold. It can be let, a room at a time, and half of {name} is somebody\'s spare room.'],
];
const HOUR_LINES = [
  ['The hour desk: elders sign their spare Hollow hours over here, to grandchildren, neighbours, anyone who stayed late for them.', 'An hour in the Hollow is the classic gift. You cannot buy one. You can only be given it.'],
  ['The ledger is in a dozen hands, most of them shaky. "Two hours to my neighbour\'s girl, who carried my shopping up the stairs for a year and never once said so."', 'At the bottom of today\'s page, firmly: "To whoever sat with me at the clinic on Tuesday. I did not get your name."'],
  ['The clerk turns the book round so you can read it. "Three hours to the hall cook, for the soup when I was ill." "One hour to the boy on 31 who mends lamps."', '"They come up on the Hollow draw under the new names," she says. "The old ones like to see who goes."'],
  ['A box of signing cards and a pencil on a string. On the wall, the month\'s hours given: more than any month on the Low decks, because up here people have more of them than they can walk.', 'Most of the elders sign theirs over to someone young. A few sign them to each other.'],
];
const TEA_NOTE = [
  ['The kettle is still hot from the loop. You pour, put the lid on the cup quickly, as the note asks, and carry it round the counter.', 'Nobody asks you for anything. A guest\'s cup is free; so is everyone else\'s.'],
  ['The water comes off the 65 degree loop and the kettle only has to finish it, which it does with a small complaint.', 'You lid the cup. In this air an open cup is cold before you have found a chair.'],
  ['Somebody has labelled every cup on the tray with a strip of tape: names, and one that just says "GUEST". You take that one.', 'It has been mended twice, in two colours of glaze.'],
  ['A card propped against the kettle: "Help yourself. If you take the last of the tea, tell the clerk, who will tell the court, who will be told off by the clerk."', 'You leave a cupful in the pot.'],
];

export async function buildOffice(s, lot, plan, game, tick) {
  const L = local(s, lot, tick), info = plan.info, r = new Rng(lot.seed), W = L.W, D = L.D, g = s.g, H = 3.2, big = lot.onCourt || D > 11, band = info.band;
  const pal = OFFICE_PAL[r.i(0, OFFICE_PAL.length - 1)], clerk = nameBy(lot.seed, 'clerk');
  const dp = W - 1.5, ww = Math.min(4.2, W - 4.4);
  const clip = await shell(L, info, { H, floor: ['planks', pal.floor], ceil: ['paint', '#e9dfc8'], wall: { tint: pal.plaster, dado: { h: 1.05, mat: 'flute', tint: pal.walnut }, skirt: '#2a1c14' },
    glow: { sky: '#ffdcae', ground: pal.floor, power: 0.24 },
    front: { style: 'house', fin: { mat: 'paint', tint: pal.green, dado: { h: 1.0, mat: 'tile', tint: pal.ox }, trim: '#efe4cc', door: pal.ox }, door: { p: dp, w: 1.2 }, windows: [{ p: 1.0, w: ww, h: 1.45, sill: 0.95 }], sign: { emblem: 'book', palette: [pal.green, '#f3e6c8', pal.saff], w: 2.3 }, mat: pal.ox } });
  await tick();
  ceilingWorks(L, H, { beam: pal.walnut, every: 2.3, duct: '#a9a49a', pipe: '#b07a45', side: 'lo' });
  trims(L, H, { rail: 2.45, railTint: pal.walnut, band: pal.green, bandH: 0.3 });
  L.prop('rug', W / 2 - 0.4, 0, 2.6, Math.PI / 2, { w: 3.6, d: 1.4, a: pal.ox, b: pal.saff, mat: 'motif' }, { noCollide: true });
  await tick();

  // ---- the long counter across the room, with a lifting flap at one end
  const CQ = big ? 7.4 : 5.4, c1 = W - 2.1;
  L.furniture(() => {
    g.mat('paint', pal.green, { rough: -0.1 }); L.box(0.2, 0.06, CQ - 0.3, c1, 1.0, CQ + 0.28);
    g.mat('paint', pal.green2); for (let p = 0.3; p < c1 - 0.6; p += 0.71) L.box(p + 0.04, 0.16, CQ - 0.32, p + 0.67, 0.88, CQ - 0.3);
    g.mat('wood', '#2a1c14'); L.box(0.22, 0, CQ - 0.27, c1 - 0.02, 0.06, CQ + 0.25);
    g.mat('wood', '#8a5a32', { rough: -0.15 }); L.box(0.18, 1.0, CQ - 0.36, c1 + 0.03, 1.05, CQ + 0.34, { bevel: 0.012 });
    g.mat('cast', '#c8a45a'); L.box(0.2, 0.9, CQ - 0.34, c1, 0.93, CQ - 0.31); L.tube([[0.3, 0.25, CQ - 0.42], [c1 - 0.1, 0.25, CQ - 0.42]], 0.018, { segs: 6 });
    g.mat('wood', '#8a5a32'); L.box(c1 + 0.03, 1.0, CQ - 0.36, c1 + 0.07, 1.72, CQ + 0.34);
    g.mat('paint', pal.green); L.box(c1 + 1.0, 0.06, CQ - 0.3, W - 0.2, 1.0, CQ + 0.28); g.mat('wood', '#8a5a32'); L.box(c1 + 0.97, 1.0, CQ - 0.36, W - 0.18, 1.05, CQ + 0.34, { bevel: 0.012 });
  });
  L.solid(0.18, 0, CQ - 0.45, c1 + 0.07, 1.05, CQ + 0.34); L.solid(c1 + 0.97, 0, CQ - 0.36, W - 0.18, 1.05, CQ + 0.34);
  // what is on it: two ledgers open, a stack of others, the bell, pens, a green lamp, a lidded cup, slips on a spike
  L.detail(() => {
    const ledger = (p, q, w, d, cover) => {
      g.mat('leather', cover); L.box(p - w / 2, 1.05, q - d / 2, p + w / 2, 1.068, q + d / 2);
      g.mat('paper', '#f1e6cc'); L.box(p - w / 2 + 0.02, 1.068, q - d / 2 + 0.015, p - 0.006, 1.085, q + d / 2 - 0.015); L.box(p + 0.006, 1.068, q - d / 2 + 0.015, p + w / 2 - 0.02, 1.085, q + d / 2 - 0.015);
      g.mat('plain', '#3a2c20'); for (let i = 0; i < 10; i++) { const qq = q - d / 2 + 0.05 + i * (d - 0.1) / 10; L.box(p - w / 2 + 0.05, 1.086, qq, p - 0.05 - r.f(0, 0.1), 1.087, qq + 0.006); L.box(p + 0.05, 1.086, qq, p + w / 2 - 0.05 - r.f(0, 0.1), 1.087, qq + 0.006); }
    };
    ledger(1.4, CQ, 0.62, 0.42, pal.ox); ledger(c1 - 1.2, CQ - 0.02, 0.56, 0.4, '#2f4f6b');
    let y = 1.05; for (let i = 0; i < 5; i++) { const t = r.f(0.04, 0.07); g.mat('leather', [pal.ox, pal.green, '#2f4f6b', '#6b4a2f', '#c9962e'][i]); L.box(c1 - 0.5, y, CQ - 0.2, c1 - 0.08, y + t, CQ + 0.14); y += t; }
    g.mat('glaze', '#1d2a3a'); L.cyl(2.2, 1.05, CQ + 0.12, 0.03, 0.05, { segs: 10 });
    g.mat('cast', '#c8a45a'); L.cyl(0.5, 1.05, CQ + 0.15, 0.04, 0.01, { segs: 10 }); g.mat('paper', '#f3ead6'); for (let i = 0; i < 6; i++) L.box(0.45, 1.07 + i * 0.012, CQ + 0.1, 0.55, 1.072 + i * 0.012, CQ + 0.2);
  });
  L.prop('civic.bell', W / 2 - 0.4, 1.05, CQ - 0.22, 0, {});
  L.prop('civic.desklamp', 0.6, 1.05, CQ + 0.2, 0, { shade: '#2f6f4a' });
  L.prop('cup', 2.7, 1.05, CQ + 0.2, 0, { glaze: pal.ox, lid: '#efe4cc' });
  L.prop('plant', c1 - 1.9, 1.05, CQ + 0.05, 0, { kind: 'fern', size: 0.5, pot: pal.saff, seed: 9 });
  L.spot('counter', W / 2 - 0.4, 0, CQ + 0.75, Math.PI, { tags: ['clerk', 'write', 'office'] });
  L.spot('customer', 1.6, 0, CQ - 0.95, 0, { tags: ['office', 'ask'] });
  L.spot('customer', W / 2 + 0.6, 0, CQ - 1.0, 0.2, { tags: ['office', 'ask'] });
  L.interact({ p: W / 2 - 0.4, q: CQ - 0.7, y: 1.1, radius: 1.1, kind: 'talk', prompt: 'Ring the bell for the clerk', onUse: async (gm) => { L.sfx(gm, 'bell', W / 2 - 0.4, 1.1, CQ - 0.22); await sayPick(gm, clerk, lot.seed ^ Math.floor(hourOf(gm) / 3), 'clerk', CLERK_LINES, info); if (gm.journal && gm.journal.find) gm.journal.find('block-court'); } });
  await tick();

  // ---- behind the counter: the clerk's desk, the minutes on shelves, the key drawers, the kettle
  const bq = D - 0.6;
  L.prop('table', 1.6, 0, bq - 0.4, 0, { w: 1.4, d: 0.7, wood: pal.walnut });
  L.prop('chair', 1.6, 0, bq - 1.0, 0, { wood: '#3a2a20', seat: pal.ox }, { noSpots: true }); L.spot('sit', 1.6, 0.46, bq - 1.0, 0, { tags: ['clerk', 'write', 'office'] });
  L.detail(() => { g.mat('leather', pal.green); L.box(1.1, 0.74, bq - 0.6, 1.8, 0.75, bq - 0.2); g.mat('paper', '#f3ead6'); for (let i = 0; i < 4; i++) L.box(1.9 + i * 0.01, 0.74 + i * 0.012, bq - 0.55, 2.2 + i * 0.01, 0.742 + i * 0.012, bq - 0.3); });
  L.prop('civic.desklamp', 2.1, 0.74, bq - 0.15, 0, { shade: '#2f6f4a' });
  L.lamp('bulb', 2.1, 1.05, bq - 0.15, { K: 2700, power: 0.3, range: 2.6, clip });
  L.prop('shelving', W / 2 + 0.6, 0, D - 0.36, Math.PI, { w: 2.2, h: 2.1, shelves: 5, wood: pal.walnut });
  for (let k = 1; k < 5; k++) L.prop('civic.books', W / 2 + 0.6, 0.08 + k * (2.1 - 0.11) / 5 + 0.025, D - 0.36, Math.PI, { w: 2.1, seed: 30 + k + (lot.seed % 7), cols: [pal.ox, pal.green, '#2f4f6b', '#6b4a2f', '#c9962e', '#3a2a20', '#e8dcc0'] });
  L.spot('work', W / 2 + 0.6, 0, D - 1.1, Math.PI, { tags: ['clerk', 'shelf', 'office'] });
  L.prop('civic.drawers', W - 0.45, 0, bq - 1.2, -Math.PI / 2, { w: 1.3, h: 1.35, d: 0.42, rows: 7, cols: 4, wood: '#6b4a2f' });
  L.prop('table', W - 0.5, 0, CQ + 0.9, -Math.PI / 2, { w: 0.9, d: 0.5, h: 0.8, wood: '#7a5233' });
  L.prop('civic.kettle', W - 0.55, 0.8, CQ + 0.65, 0.4, { enamel: pal.ox });
  for (let i = 0; i < 4; i++) L.prop('cup', W - 0.6 + (i % 2) * 0.13, 0.8, CQ + 0.95 + Math.floor(i / 2) * 0.13, 0, { glaze: ['#efe4cc', pal.saff, pal.green2, '#d4878a'][i], lid: '#efe4cc' });
  L.interact({ p: W - 1.2, q: CQ - 0.8, y: 1.0, radius: 1.0, prompt: 'Make a cup of tea', onUse: (gm) => { L.sfx(gm, 'pour', W - 0.55, 0.95, CQ + 0.65); return sayPick(gm, 'The kettle', lot.seed, 'kettle', TEA_NOTE, info); } });
  await tick();

  // ---- the boards: the flat lottery on one side wall, the court's week on the other, and the third (by band)
  const pick2 = (k) => { const a = nameBy(lot.seed, 'cpl' + k), b = pickBy(lot.seed, 'cpm' + k, NAMES.filter((n) => n !== a)); return a + ' and ' + b; };
  const d0 = info.d0, cpl = [pick2(1), pick2(2), pick2(3), pick2(4)];
  const tr1 = d0 + 1 + (lot.seed % 3), tr2 = d0 + 2 + (lot.seed % 2);
  const LOT = { kind: 'board', title: 'The flat lottery', lines: ['Terrace ' + tr1 + ' · ' + (4 + lot.seed % 19) + '|' + cpl[0], 'Terrace ' + tr2 + ' · ' + (2 + lot.seed % 23) + '|' + cpl[1], "Hollow's edge " + (1 + lot.seed % 9) + '|' + cpl[2], 'Deck ' + d0 + ' · ' + (10 + lot.seed % 40) + '|' + cpl[3], 'Lent five years|or till a place', 'Next draw|after Booking Day'], palette: pal.board };
  L.sign(LOT, 0.17, 1.75, big ? 4.2 : 3.2, [1, 0], { w: 0.8, h: 0.58, back: pal.walnut });
  L.lamp('strip', 0.42, 2.6, (big ? 4.2 : 3.2) - 0.7, { to: [0.42, 2.6, (big ? 4.2 : 3.2) + 0.7], K: 2900, power: 0.45, clip, range: 3 });
  L.interact({ p: 1.0, q: big ? 4.2 : 3.2, y: 1.5, radius: 1.3, prompt: 'Read the flat lottery', onUse: (gm) => {
    if (gm.journal && gm.journal.find) gm.journal.find('flat-draw');
    return say(gm, 'The flat lottery', ["The drum's lent flats in " + info.name + ', drawn this month. The terraces and the Hollow\'s edge go by draw; the dim decks go to whoever is left.', LOT.lines.slice(0, 4).map((l) => l.replace('|', ': ')).join('. ') + '.', 'Each is lent for five years, or until one of the couple inherits a place. ' + pickBy(lot.seed, 'lotx', ['Someone has drawn a small window next to the terrace names, and a lamp turned low next to the deck one.', 'Pencilled under the last name: "We will paint it yellow. You will see."', 'Somebody has pinned a ribbon beside the Hollow\'s edge. It is that kind of flat.', 'Two of the names have been written in by a different hand, the way names are when a swap was agreed in the court.'])]);
  } });
  const MATTERS = [['Noise', 'flute practice after ten'], ['Heat', 'deck ' + (d0 + 3) + ', spinward end, runs warm'], ['Rooms', (d0 + 1) + ' · 3 and ' + (d0 + 4) + ' · 6 wish to swap'], ['Hollow', 'a turn swap with the next block'], ['Leave', 'a family asks for a third'], ['Light', 'the court ceiling, a colour too pink'], ['Noise', 'the laundry at one in the morning'], ['Rooms', 'a spare room let for hours, not kays']];
  const mm = []; for (let k = 0; k < 4; k++) mm.push(MATTERS[(lot.seed + k * 3) % MATTERS.length]);
  const COURT = { kind: 'board', title: 'Block court this week', lines: mm.map((m) => m[0] + '|' + m[1]).concat(['Sitting|the court, 19:00']), palette: pal.board };
  L.sign(COURT, W - 0.17, 1.75, big ? 4.2 : 3.0, [-1, 0], { w: 0.8, h: 0.58, back: pal.walnut });
  L.interact({ p: W - 1.0, q: big ? 4.2 : 3.0, y: 1.5, radius: 1.3, prompt: 'Read this week\'s matters', onUse: (gm) => { if (gm.journal && gm.journal.find) gm.journal.find('blocks-leave'); return say(gm, 'Block court this week', [mm.map((m) => m[0] + ': ' + m[1]).join('. ') + '.', 'Sitting: in the court, at seven. Out loud and in minutes.']); } });
  if (band === 'high') {
    // the hour desk by the window, with its own small board
    const hp = 1.6, hq = KIT_T + 1.3;
    L.prop('table', hp, 0, hq, 0, { w: 1.2, d: 0.6, wood: pal.walnut });
    L.prop('chair', hp - 0.3, 0, hq + 0.6, Math.PI, { wood: '#3a2a20', seat: pal.saff }, { noSpots: true }); L.spot('sit', hp - 0.3, 0.46, hq + 0.6, Math.PI, { tags: ['office', 'write'] });
    L.prop('chair', hp + 0.35, 0, hq + 0.65, Math.PI + 0.2, { wood: pal.walnut, seat: pal.ox, back: 'slat' }, { noSpots: true }); L.spot('sit', hp + 0.35, 0.46, hq + 0.65, Math.PI + 0.2, { tags: ['office', 'wait'] });
    L.detail(() => { g.mat('leather', pal.green); L.box(hp - 0.3, 0.74, hq - 0.2, hp + 0.25, 0.76, hq + 0.15); g.mat('paper', '#f3ead6'); L.box(hp - 0.28, 0.76, hq - 0.18, hp + 0.23, 0.775, hq + 0.13); g.mat('plain', '#3a2c20'); for (let i = 0; i < 7; i++) L.box(hp - 0.24, 0.776, hq - 0.15 + i * 0.04, hp + 0.15 - (i % 3) * 0.05, 0.777, hq - 0.145 + i * 0.04); });
    const HB = { kind: 'notice', title: 'The hour desk', lines: ['Spare Hollow hours,', 'signed over here to', 'grandchildren, neighbours,', 'and anyone who stayed', 'late for you.'], paper: '#f3e3d0' };
    void HB;
    L.interact({ p: hp, q: hq + 0.9, y: 1.0, radius: 1.1, prompt: 'Read the hour desk\'s book', onUse: (gm) => sayPick(gm, 'The hour desk', lot.seed, 'hours', HOUR_LINES, info) });
  } else {
    const born = 20 + (lot.seed % 14), died = born - 2 + (lot.seed % 5);
    const BL = { kind: 'board', title: info.name + ' this year', lines: ['Born|' + born, 'Died|' + died, 'Thirds by leave|' + ['none yet', 'one', 'one, asked twice'][lot.seed % 3], 'Room for a third|about one a year'], palette: ['#3a1e24', '#f3e6c8', '#e0a040'] };
    L.deco(() => { g.mat('cast', '#c8a45a'); L.box(W / 2 - 2.1, 1.55, D - 0.2, W / 2 - 1.1, 2.35, D - 0.165); g.mat('paper', '#f3ead6'); L.box(W / 2 - 2.04, 1.61, D - 0.21, W / 2 - 1.16, 2.29, D - 0.2); g.mat('plain', '#3a2c20'); for (let i = 0; i < 6; i++) L.box(W / 2 - 1.98, 2.18 - i * 0.1, D - 0.212, W / 2 - 1.3 - (i % 3) * 0.08, 2.19 - i * 0.1, D - 0.21); });
    L.interact({ p: W / 2 - 1.6, q: CQ + 0.6, y: 1.5, radius: 1.1, prompt: 'Read the block\'s own ledger', onUse: (gm) => say(gm, BL.title, ['Born, ' + born + '. Died, ' + died + '. ' + BL.lines[2].replace('|', ': ') + '. Room for a third: about one a year.', 'The same lines stand on the Ledger at every station ring for every block in Chervil, births against deaths against room, where anyone can read them.']) });
  }
  await tick();

  await tick();
  // ---- waiting: mismatched chairs under the window, an armchair, plants
  const nc = big ? 5 : 3;
  for (let k = 0; k < nc; k++) {
    const p = 1.1 + k * 0.7, q = KIT_T + 0.55 + (band === 'high' && k < 2 ? 1.6 : 0);
    if (band === 'high' && p < 2.4) continue;
    L.prop('chair', p, 0, q, r.f(-0.1, 0.1), { wood: ['#6b4a2f', '#8a5a32', '#3a2a20'][k % 3], back: k % 2 ? 'slat' : 'hoop', seat: pal.saff }, { noSpots: true });
    L.spot('sit', p, 0.46, q, 0, { tags: ['waiting', 'office'] });
    if (k === nc - 1) L.seat(p, q, 0, 0, 'Sit and wait your turn');
  }
  L.prop('civic.armchair', W - 0.7, 0, KIT_T + 0.9, -Math.PI / 2 - 0.4, { cloth: pal.green2, wood: pal.walnut, mend: pal.saff }, { noSpots: true }); L.spot('sit', W - 0.7, 0.43, KIT_T + 0.9, -Math.PI / 2 - 0.4, { tags: ['waiting', 'office'] });
  L.prop('plant', 0.55, 0, CQ - 0.9, 1.0, { kind: 'broad', size: 1.5, pot: pal.ox, seed: 4 });
  if (big) { L.prop('plant', W - 0.6, 0, CQ - 1.0, 0.3, { kind: 'flower', size: 0.9, pot: pal.green, seed: 6 }); L.prop('bench', W / 2, 0, CQ - 2.2, 0, { w: 2.0, back: true, wood: '#7a5233' }, { noSpots: true }); for (let i = 0; i < 3; i++) L.spot('sit', W / 2 - 0.65 + i * 0.65, 0.46, CQ - 2.2, 0, { tags: ['waiting', 'office'] }); }

  // ---- light
  for (const p of [W * 0.28, W * 0.62]) L.lamp('globe', p, 2.2, CQ + 0.05, { K: 2800, power: 0.65, clip, drop: 0.95, r: 0.15, tint: '#2f6f4a' });
  L.lamp('globe', W / 2, 2.4, 2.4, { K: 2800, power: 0.55, clip, drop: 0.75, r: 0.17 });

  // ---- walkways, people, zone
  L.path([[dp, -0.7], [dp, 1.2], [W / 2 + 0.6, CQ - 1.2], [1.6, CQ - 1.2]], { width: 1.1 });
  L.path([[W / 2 + 0.6, CQ - 1.2], [c1 + 0.5, CQ - 0.8], [c1 + 0.5, CQ + 0.8], [W / 2, D - 1.2], [1.6, D - 1.4]], { width: 1.0 });
  L.spot('stand', 0.8, 0, big ? 4.2 : 3.2, Math.PI / 2, { tags: ['read', 'board', 'office'] });
  L.spot('stand', W - 0.8, 0, big ? 4.2 : 3.0, -Math.PI / 2, { tags: ['read', 'board', 'office'] });
  L.spot('chat', W / 2 - 0.5, 0, CQ - 1.9, 0.6, { tags: ['chat', 'office'] }); L.spot('chat', W / 2 + 0.3, 0, CQ - 1.7, -0.9, { tags: ['chat', 'office'] });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: 'The block office', sub: info.name + ' · ' + lot.sub, ambience: 'shop', reverb: 'room', cell: info.key });
  void note; void fill; void jar; void shadeHex;
}

// ---------------------------------------------------------------------------------------------------------------
// The laundry
// ---------------------------------------------------------------------------------------------------------------
const WASHERS = ['#efe6d2', '#9fd0b8', '#9cc4e4', '#f0a48a', '#f2d27a', '#efe6d2', '#2f5f9f', '#e9e1cf'];
const DYED = ['#c9552e', '#2f6f73', '#e7b547', '#7a2a5a', '#26306b', '#d4878a', '#6c9a4c', '#b5653a', '#33406e', '#f0d070', '#8a2f3c', '#3fa7a3'];
const LAUNDRY_PAL = [
  { wall: '#f1dfa8', tile: '#c9654a', floor: ['pattern', '#e8dcc4'], cobalt: '#2f5f9f', pine: '#c9a46a', sign: ['#2f5f9f', '#f4ecd8', '#f2d27a'], awning: ['#f2d27a', '#f4ecd8'] },
  { wall: '#e8efe6', tile: '#2f6f73', floor: ['tile', '#d8d2c2'], cobalt: '#8a2f3c', pine: '#b98a5a', sign: ['#8a2f3c', '#f4ecd8', '#e8c26a'], awning: ['#8a2f3c', '#f1e6cf'] },
  { wall: '#f2e6d6', tile: '#5b3a6e', floor: ['terrazzo', '#e3dccb'], cobalt: '#3f6f4a', pine: '#c9a46a', sign: ['#3f6f4a', '#f4ecd8', '#f2d27a'], awning: ['#3f6f4a', '#f4ecd8'] },
];
function priceNow(h) { return h >= 1 && h < 6.5 ? 0.12 : (h >= 23 || h < 1) ? 0.15 : (h >= 11 && h < 15) ? 0.24 : 0.2; }
const BASKET_NAMES = ['Quist', 'Halloran', 'Okafor', 'Brennan', 'Mbaye', 'Sato', 'Rautio', 'Lindqvist', 'Abara', 'Moreau', 'Tanaka', 'Oyelaran', 'Varga', 'Castellano', 'Ndiaye', 'Petrov', 'Haddad', 'Kowalski'];
const WASH_LOOK = [
  ['A round door, and behind it a little drum turning somebody\'s red shirts round and round, inside the big drum turning everybody round and round.', 'Somebody once painted "and so on" on the inside of one door, very small. Guests notice it every time.'],
  ['The washer is older than anyone who uses it. Its door seal has been replaced with one cut from a cab\'s old gasket, and a label says so.', 'A load is about 0.2 kays. The machines want the night, when power is cheapest, and so does the washing.'],
  ['Inside, a load of children\'s clothes, each seam with a hand\'s width folded in so it can be let out as they grow.', 'One small coat has two names in the lining: the child\'s, and an older one above it.'],
  ['The window in the door is scratched from centuries of buttons. You can just see a sock going round, alone, very fast.', 'Somebody has written on the wall above it: "Back by one, or it goes on the sock shelf."'],
];
const BASKET_LINES = [
  'Each basket has a name on a card tied to its handle: {a}, {b}, {c}. One just says {kid}, in a child\'s capitals, and holds one sock.',
  'Names on cards: {a}, {b}, {c}. One card has been turned over and rewritten so many times that it is mostly crossings out and one name at the end: {kid}.',
  'The baskets are lent like everything else. {a}\'s is mended with a strip of bright blue cane; {b}\'s has a second handle that does not match; {c}\'s has a bell on it, for reasons.',
  'Under the table, three baskets in a row: {a}, {b}, and {c}, with a note pinned between them: "These are not a queue."',
];

export async function buildLaundry(s, lot, plan, game, tick) {
  const L = local(s, lot, tick), info = plan.info, r = new Rng(lot.seed), W = L.W, D = L.D, g = s.g, H = 3.2, big = lot.onCourt || D > 11;
  const pal = LAUNDRY_PAL[r.i(0, LAUNDRY_PAL.length - 1)];
  const dp = 1.5;
  const clip = await shell(L, info, { H, floor: pal.floor, ceil: ['paint', '#f4ecd8'], wall: { tint: pal.wall, dado: { h: 1.25, mat: 'tile', tint: pal.tile }, skirt: '#7a3b2e' },
    glow: { sky: '#ffe6bf', ground: '#e8d2a8', power: 0.36 },
    front: { style: 'glazed', door: { p: dp, w: 1.2 }, frame: pal.cobalt, plinth: pal.tile, awning: pal.awning, sign: { emblem: 'drop', palette: pal.sign }, doorTint: pal.cobalt } });
  await tick();
  ceilingWorks(L, H, { beam: '#efe4cc', beamMat: 'paint', every: 2.3, duct: '#b9b4aa', pipe: '#c47a45', side: 'hi' });
  trims(L, H, { rail: 2.05, railTint: '#7a3b2e', band: pal.cobalt, bandH: 0.18 });
  await tick();

  // ---- the washers: a row along the back wall, another down one side, the water main over them
  const nb = Math.floor((W - 1.2) / 0.74), wq = D - 0.52;
  for (let i = 0; i < nb; i++) {
    const p = 0.75 + i * 0.74;
    L.prop('civic.washer', p, 0, wq, Math.PI, { body: WASHERS[(i + lot.seed) % WASHERS.length], load: DYED[(i * 3 + lot.seed) % DYED.length] });
    if (i % 2 === 0) L.spot('work', p, 0, wq - 0.85, 0, { tags: ['wash', 'laundry'] });
  }
  L.deco(() => {
    g.mat('cast', '#c47a45', { rough: -0.2 }); L.tube([[0.3, 1.55, D - 0.25], [W - 0.3, 1.55, D - 0.25]], 0.025, { segs: 8 });
    g.mat('felt', pal.cobalt); L.tube([[0.3, 1.68, D - 0.26], [W - 0.3, 1.68, D - 0.26]], 0.04, { segs: 8 });
    g.mat('cast', '#c47a45'); for (let i = 0; i < nb; i++) { const p = 0.75 + i * 0.74 + 0.22; L.tube([[p, 1.55, D - 0.27], [p, 0.88, D - 0.27], [p, 0.88, D - 0.22]], 0.012, { segs: 5 }); }
  });
  // a shelf over the back row: soap in lidded crocks, jars of pegs
  L.furniture(() => { g.mat('wood', pal.pine); L.box(0.3, 1.95, D - 0.45, W - 0.3, 1.99, D - 0.16); });
  for (let i = 0; i < Math.min(6, nb - 1); i++) L.prop('crock', 0.7 + i * 0.8, 1.99, D - 0.3, 0, { glaze: [pal.cobalt, pal.tile, '#e8e2d0', '#6c9a4c', '#e7b547', '#7a2a5a'][i], h: 0.22 + (i % 3) * 0.04, r: 0.08 });
  L.detail(() => { for (let i = 0; i < 3; i++) { const c = L.P(W - 1.6 + i * 0.25, D - 0.3); jar(g, c[0], 1.99, c[1], 0.06, 0.16, '#dfeae6', '#f4ecd8', ['#e7b547', '#c9654a', '#9fd0b8'][i]); } });
  const sideN = big ? 6 : 4;
  for (let i = 0; i < sideN; i++) {
    const q = D - 1.6 - i * 0.74; if (q < 3.2) break;
    L.prop('civic.washer', W - 0.52, 0, q, -Math.PI / 2, { body: WASHERS[(i + 3 + lot.seed) % WASHERS.length], load: DYED[(i * 5 + 1) % DYED.length] });
    if (i % 2) L.spot('work', W - 1.35, 0, q, Math.PI / 2, { tags: ['wash', 'laundry'] });
  }
  L.interact({ p: W / 2, q: wq - 0.9, y: 0.9, radius: 1.3, prompt: 'Look into a washer', onUse: (gm) => sayPick(gm, 'A washer', lot.seed, 'washer', WASH_LOOK, info) });
  L.interact({ p: W - 1.3, q: D - 2.2, y: 0.9, radius: 1.2, prompt: (gm) => 'Wash your travelling clothes (' + priceNow(hourOf(gm)).toFixed(2) + ')', onUse: async (gm) => {
    const p = priceNow(hourOf(gm));
    if (gm.wallet && !gm.wallet.spend(p, 'A load of washing')) { if (gm.audio) gm.audio.ui('deny'); await say(gm, 'The washer', ['The little panel blinks: not enough in your wallet. Somebody on the bench says the night price is kinder.']); return; }
    L.sfx(gm, 'clunk', W - 0.6, 0.5, D - 2.2);
    await say(gm, 'The washer', [pickBy(lot.seed, 'wash', ['Your shirt, your other shirt, the socks from three drums ago. The round door clunks shut and the little drum starts to turn.', 'Everything you own that is not on you goes in: two shirts, the trousers with the mended knee, a scarf from Grain Row. The door clunks shut.', 'You load the drum. Somebody on the bench leans over and moves your red sock to the next machine without a word, and you understand.', 'In it all goes. The washer weighs the load, says nothing, and starts turning: a little drum inside the big one.']), p <= 0.15 ? 'Night price, ' + p.toFixed(2) + '. The machines have the drum to themselves at this hour, and so do you.' : 'Day price, ' + p.toFixed(2) + '. After eleven it is cheaper, and after one cheaper still.']);
  } });
  await tick();

  // ---- folding tables in the middle, baskets with names under and beside them, folded stacks
  const tp = big ? [W * 0.3, W * 0.6] : [W * 0.45], tq0 = big ? 6.2 : 4.6;
  const nm = []; for (let k = 0; k < 9; k++) nm.push(BASKET_NAMES[(lot.seed + k * 7) % BASKET_NAMES.length]);
  for (const p of tp) {
    L.prop('table', p, 0, tq0, 0, { w: 2.4, d: 0.9, h: 0.86, wood: pal.pine, legs: 'trestle' });
    L.spot('work', p - 0.5, 0, tq0 - 0.8, 0, { tags: ['fold', 'laundry'] }); L.spot('work', p + 0.6, 0, tq0 + 0.8, Math.PI, { tags: ['fold', 'laundry'] });
    for (let k = 0; k < 3; k++) L.prop('civic.folded', p - 0.8 + k * 0.8 + r.f(-0.1, 0.1), 0.86, tq0 + r.f(-0.2, 0.2), r.f(-0.2, 0.2), { cols: [DYED[r.i(0, 11)], DYED[r.i(0, 11)], '#e8e2d0'], n: 3 + (k % 3) });
    for (let k = 0; k < 4; k++) L.prop('civic.basket', p - 0.9 + k * 0.6 + r.f(-0.05, 0.05), 0, tq0 + (k % 2 ? 0.75 : -0.75), r.f(-0.4, 0.4), { cane: shadeHex('#c9a46a', r.f(0.85, 1.1)), fill: DYED[(k * 5 + lot.seed) % DYED.length], tag: ['#f4ecd8', '#f2d27a', '#9fd0b8', '#f0a48a'][k % 4] });
  }
  L.interact({ p: tp[0], q: tq0 - 1.0, y: 1.0, radius: 1.4, prompt: 'Read the names on the baskets', onUse: (gm) => say(gm, 'Baskets', [fill(pickBy(lot.seed, 'basket', BASKET_LINES), info, { a: nm[0], b: nm[1], c: nm[2], kid: nm[3].toUpperCase() })]) });
  // the drying rack on pulleys over the tables, hung with dyed clothes
  {
    const y = 2.45, q = tq0, p0 = Math.max(0.6, tp[0] - 1.5), p1 = Math.min(W - 1.4, tp[tp.length - 1] + 1.5);
    L.furniture(() => {
      g.mat('wood', '#9a7448', { rough: -0.05 }); for (const dq of [-0.22, 0.22]) L.tube([[p0, y, q + dq], [p1, y, q + dq]], 0.018, { segs: 6 });
      g.mat('weave', '#e6dcc6'); for (const p of [p0 + 0.08, p1 - 0.08]) { L.tube([[p, y + 0.03, q - 0.22], [p, H - 0.1, q]], 0.005, { segs: 4, caps: false }); L.tube([[p, y + 0.03, q + 0.22], [p, H - 0.1, q]], 0.005, { segs: 4, caps: false }); }
      g.mat('cast', '#5a5046'); for (const p of [p0 + 0.08, p1 - 0.08]) L.cyl(p, H - 0.16, q, 0.05, 0.14, { segs: 10 });
    });
    L.detail(() => {
      const n = Math.floor((p1 - p0) / 0.55);
      for (let i = 0; i < n; i++) {
        const pa = p0 + (i + 0.5) * (p1 - p0) / n, w = r.f(0.28, 0.44), d = r.f(0.2, 0.42), dq = r.chance(0.5) ? 0.22 : -0.22;
        g.mat(r.chance(0.25) ? 'stripe' : r.chance(0.2) ? 'motif' : 'weave', r.chance(0.35) ? '#efe6d2' : DYED[r.i(0, 11)], { sway: 0.35 });
        L.sheet([pa - w / 2, y, q + dq], [pa + w / 2, y, q + dq], [pa + w / 2, y - d, q + dq + 0.02], [pa - w / 2, y - d, q + dq + 0.02], { sag: 0.02, ripple: 0.02, nu: 3, nv: 3 });
      }
    });
  }
  await tick();

  await tick();
  // ---- the price board, the clock, the sock shelf, the bench by the window
  const PRICES = { kind: 'board', palette: ['#2a2622', '#f4ecd8', '#f2d27a'], title: 'A load', lines: ['Lamp-noon · 0.24', 'Mornings, evenings · 0.20', 'After eleven · 0.15', 'One till lamp-dawn · 0.12', 'The machines want the night.', 'So does your washing.'] };
  const pq = big ? 5.2 : 3.6;
  L.sign(PRICES, 0.17, 1.65, pq, [1, 0], { w: 0.9, h: 0.75 });
  wallClock(s, game, ...(() => { const c = L.P(0.17, pq + 1.1); return [c[0], 2.45, c[1]]; })(), L.face(1, 0), { r: 0.22, rim: pal.cobalt });
  L.interact({ p: 0.9, q: pq, y: 1.5, radius: 1.2, prompt: 'Read the price board', onUse: (gm) => { const h = hourOf(gm), p = priceNow(h); return say(gm, 'A load', ['Lamp-noon, 0.24. Mornings and evenings, 0.20. After eleven, 0.15. One till lamp-dawn, 0.12.', 'Now: ' + p.toFixed(2) + '. Power costs most at lamp-noon and least in the lamp-night, when the drum belongs to the machines.', pickBy(lot.seed, 'price', ['Chalked underneath: "Set it going at one and sleep. Everybody does."', 'Underneath, a tally of loads done after one in the morning this week: a long one.', 'Somebody has added: "Socks at any price."', 'A note: "Lids on the soap or it dries to a cake."'])]); } });
  const sp = 0.4, sq = big ? 3.2 : 2.0;
  L.furniture(() => { g.mat('wood', pal.pine); L.box(0.16, 1.5, sq - 0.6, 0.45, 1.53, sq + 0.6); g.mat('cast', '#3a3630'); for (const dq of [-0.5, 0.5]) L.box(0.16, 1.42, sq + dq - 0.015, 0.4, 1.5, sq + dq + 0.015); });
  L.detail(() => { const rs = new Rng(lot.seed ^ 5); for (let i = 0; i < 9; i++) { g.mat('knit', DYED[rs.i(0, 11)]); const q = sq - 0.5 + i * 0.12; L.box(sp - 0.1, 1.53, q - 0.04, sp + 0.08, 1.56 + rs.f(0, 0.02), q + 0.04); } });
  L.sign({ kind: 'label', text: 'SOCKS NOBODY CAME BACK FOR', sub: 'take one · they are all odd', ink: '#2a2622' }, 0.17, 1.72, sq, [1, 0], { w: 1.2, h: 0.12 });
  L.prop('bench', 2.0 + (big ? 1.4 : 0.6), 0, KIT_T + 0.55, 0, { w: 2.0, back: true, wood: pal.pine, metal: pal.cobalt }, { noSpots: true });
  for (let i = 0; i < 3; i++) L.spot('sit', 2.0 + (big ? 1.4 : 0.6) - 0.65 + i * 0.65, 0.46, KIT_T + 0.55, 0, { tags: ['waiting', 'laundry'] });
  L.seat(2.0 + (big ? 1.4 : 0.6), KIT_T + 0.55, 0, 0, 'Sit and watch the washers');
  L.prop('plant', W - 0.6, 0, KIT_T + 0.6, 0.7, { kind: 'broad', size: 1.3, pot: pal.tile, seed: 11 });

  // ---- the mending corner: a chair, a basket of socks to darn, an ironing board with its iron
  {
    const mp = W - 1.0, mq = KIT_T + 1.9;
    L.prop('chair', mp, 0, mq, -Math.PI / 2 - 0.3, { wood: '#5b3d27', seat: pal.tile, back: 'slat' }, { noSpots: true }); L.spot('sit', mp, 0.46, mq, -Math.PI / 2 - 0.3, { tags: ['mend', 'laundry'] });
    L.prop('flats.basket', mp + 0.1, 0, mq + 0.55, 0.2, { r: 0.18, cloth: [DYED[lot.seed % 12], '#efe6d2', DYED[(lot.seed + 5) % 12]] });
    const ip = W / 2 + 0.3, iq = big ? 3.4 : 2.6;
    L.furniture(() => {
      g.mat('cast', '#3a3630'); L.tube([[ip - 0.5, 0, iq - 0.1], [ip + 0.5, 0.86, iq + 0.1]], 0.012, { segs: 5 }); L.tube([[ip + 0.5, 0, iq - 0.1], [ip - 0.5, 0.86, iq + 0.1]], 0.012, { segs: 5 });
      g.mat('stripe', pal.cobalt); L.box(ip - 0.7, 0.86, iq - 0.18, ip + 0.7, 0.9, iq + 0.18, { bevel: 0.03 });
      g.mat('paint', pal.tile, { rough: -0.3 }); L.box(ip + 0.25, 0.9, iq - 0.06, ip + 0.5, 0.98, iq + 0.06, { bevel: 0.02 }); g.mat('wood', '#3a2a20'); L.box(ip + 0.3, 0.98, iq - 0.02, ip + 0.45, 1.02, iq + 0.02);
    });
    L.solid(ip - 0.7, 0, iq - 0.2, ip + 0.7, 0.9, iq + 0.2);
    L.spot('work', ip, 0, iq + 0.55, Math.PI, { tags: ['iron', 'laundry'] });
  }
  await tick();
  // ---- light: warm globes over the tables, a strip over the washers
  for (const p of tp) L.lamp('globe', p, 2.55, tq0 + 0.9, { K: 3000, power: 0.75, clip, drop: 0.55, r: 0.17 });
  L.lamp('strip', 1.0, H - 0.05, D - 1.2, { to: [W - 1.0, H - 0.05, D - 1.2], K: 3400, power: 0.55, clip, range: 4 });
  L.lamp('lantern', W - 1.4, 2.4, 1.6, { tint: '#f2d27a', clip, power: 0.45, drop: 0.6 });

  // ---- walkways, people, zone
  L.path([[dp, -0.7], [dp, 1.4], [dp + 0.3, tq0 - 1.3], [W - 1.5, tq0 - 1.3], [W - 1.5, D - 1.3], [1.0, D - 1.3]], { width: 1.1 });
  L.spot('chat', W / 2 + 0.6, 0, KIT_T + 1.6, -0.5, { tags: ['chat', 'laundry'] }); L.spot('chat', W / 2 - 0.2, 0, KIT_T + 1.9, 0.9, { tags: ['chat', 'laundry'] });
  s.zoneBox({ id: lot.id, place: 'city-room', box: [lot.x0, -0.5, lot.z0, lot.x1, H, lot.z1], name: 'The laundry', sub: info.name + ' · ' + lot.sub, ambience: 'shop', reverb: 'tile', cell: info.key });
  void note; void nameBy; void KIT_T;
}
