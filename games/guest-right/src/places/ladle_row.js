// Ladle Row: Candlewick's avenue, running spinward through Wick Court. A long warm arcade under the ducts and beams of an
// old machine, a pool of lamplight every bay, lanterns and bunting up for Booking Day, and the floor curving up ahead of
// you toward a lit arch at each end, where the row runs on into Ropewalk and Pennyfold.
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { PLACES } from '../content/places.js';
import {
  street, side, shell, streetGlow, unit, pilaster, pier, thresholdArch, runOn, bench, drinkingTap, noticePillar, publicClock,
  noticeboard, letterFlaps, chalk, sweeperNiche, streetPlanter, frontWall, rowPath, stations, stitch, signBoard, FIN, read, found,
} from './street_parts.js';

const H = 3.4;

// A shuttered unit: a roller shutter down over the whole front, the old painted name above, and a card.
function shutterUnit(s, sd, a0, a1, fin, o) {
  const g = s.g, w = a1 - a0, m = 0.28, oh = 2.5;
  frontWall(s, sd, a0, a1, H, [{ at: m, w: w - 2 * m, h: oh }], fin);
  const p0 = a0 + m, p1 = a1 - m;
  g.mat('paint', o.shutter || '#9c4a3a', { rough: 0.1 });
  for (let y = 0.02; y < oh - 0.06; y += 0.078) sd.box(g, p0, p1, 0.05, 0.09, y, y + 0.066, { faces: 'fyY' });
  g.mat('brushed', '#8d897f'); sd.box(g, p0, p1, 0.035, 0.09, 0, 0.06, { faces: 'fY' });
  g.mat('paint', shadeOf(o.shutter || '#9c4a3a')); sd.box(g, p0 - 0.05, p1 + 0.05, -0.1, 0.06, oh - 0.06, oh + 0.1, { bevel: 0.012 });
  g.mat('cast', '#2f2c28'); for (const p of [p0, p1]) sd.box(g, p - 0.04, p + 0.04, -0.02, 0.06, 0, oh - 0.06, { faces: 'fyYaA' });
  // a padlock on the bottom bar
  g.mat('cast', '#c8a45a', { rough: -0.2 }); const lc = (p0 + p1) / 2; sd.box(g, lc - 0.04, lc + 0.04, 0.0, 0.03, 0.06, 0.15, { bevel: 0.01 });
  g.mat('brushed', '#9c978d'); sd.box(g, lc - 0.025, lc - 0.015, 0.005, 0.02, 0.15, 0.2); sd.box(g, lc + 0.015, lc + 0.025, 0.005, 0.02, 0.15, 0.2); sd.box(g, lc - 0.025, lc + 0.025, 0.005, 0.02, 0.19, 0.2);
  s.flush({ tier: 's' });
  sd.solid(s, p0, p1, 0.0, 0.2, 0, oh);
  sign(s, o.fascia, ...sd.pt((a0 + a1) / 2, (2.74 + H) / 2, -0.006), { face: sd.face, w: Math.min(3.6, w - 0.4), h: 0.5 });
  sign(s, o.card, ...sd.pt(lc + 0.5, 1.45, 0.044), { face: sd.face, w: 0.3, h: 0.4, board: false });
  const ip = sd.pt(lc + 0.5, 1.45, -0.4);
  s.interact({ x: ip[0], y: ip[1], z: ip[2], radius: 1.4, prompt: 'Read the card on the shutter', onUse(game) { read(game, 'A card on the shutter', o.cardText); } });
  s.spot('stand', ...sd.pt(lc + 0.4, 0, -0.75), sd.yaw + Math.PI, { tags: ['read', 'street'] });
}
function shadeOf(c) { const n = parseInt(c.slice(1), 16); const k = 0.72; const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k); return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join(''); }

const P = (text, sub) => ({ kind: 'street', text, sub });

export const place = {
  id: 'ladle-row', name: 'Ladle Row', order: 70,
  build(game) {
    const W = game.world, f = W.frame('candlewick', deckRadius(16), 0, 625);
    const s = W.scope('ladle-row', f);
    const st = street('x', 4, H);
    const N = side(st, -4, 1), S = side(st, 4, -1);
    const clipE = [27.4, -0.3, -4.5, 105.5, H + 0.3, 4.5], clipW = [-105.5, -0.3, -4.5, -27.4, H + 0.3, 4.5];
    const nb = PLACES.neighbours || [];
    const noteOf = (name, d) => { const n = nb.find((q) => q.name === name); return n ? n.note : d; };
    const doorsN = [], doorsS = [];
    const keep = (arr, o) => { for (const d of o.doors) arr.push(d); };

    // ---------------- the shell: floor, ceiling bays, lamps, lanterns and bunting ----------------
    // corbels only under beams that land on our own plain fronts
    const plain = { '-1': [[28, 30], [92, 98.2], [102.6, 104.6], [-30, -28], [-68, -65.5], [-104.6, -104]], '1': [[28, 30], [40, 42], [100, 104.6], [-104.6, -60], [-36, -28]] };
    const corbel = (a, sg) => plain[String(sg)].some((r) => a >= r[0] - 0.2 && a <= r[1] + 0.2);
    const linesE = shell(s, st, 28, 105, { n: 13, clip: clipE, festive: true, endBeam: false, seed: 0, noBaffle: [0], corbel });
    const linesW = shell(s, st, -105, -28, { n: 13, clip: clipW, festive: true, startBeam: false, seed: 2, corbel });
    streetGlow(s, st, 28, 105); streetGlow(s, st, -105, -28);

    // ---------------- east arm, north side: the pier by the court with the tap; slivers; the stretch past the clinic ----------------
    frontWall(s, N, 28, 30, H, [], FIN[5]);
    drinkingTap(s, N, 29.0);
    sign(s, SIGNS['ladle-row.street'], ...N.pt(29, 2.3, -0.045), { face: N.face, w: 0.9, h: 0.2 });
    pier(s, N, 61.5, 62, H); pier(s, N, 65.5, 66, H);
    pilaster(s, N, 92, H);
    keep(doorsN, unit(s, N, 92, 95.6, { fin: 0, name: 'Haddad', num: '16 · 92', clip: clipE }));
    pilaster(s, N, 95.6, H);
    keep(doorsN, unit(s, N, 95.6, 98.2, { kind: 'stair', fin: 4, name: 'STAIR', num: 'decks 17 to 21', clip: clipE, prompt: 'Try the stair door', knock: 'The residents\' stair, locked from this side. The court stair is quicker, and it has the view.' }));
    pilaster(s, N, 98.2, H);
    shutterUnit(s, N, 98.2, 102.6, FIN[2], {
      shutter: '#a24b3b',
      fascia: { kind: 'fascia', text: 'Knots and Laces', sub: 'cord · twine · laces · by the metre', palette: ['#3a2a20', '#efe2c6', '#c9962e'] },
      card: { kind: 'notice', hand: true, title: 'Back after', lines: ['Booking Day.', 'Gone to my sister', 'for the feast.', 'Laces: knock at 16 · 92.'] },
      cardText: ['Back after Booking Day. Gone to my sister for the feast. Laces: knock at 16 · 92.', 'Under it, in another hand: "She means Haddad. He has the key and no idea about laces."'],
    });
    pilaster(s, N, 102.6, H);
    frontWall(s, N, 102.6, 104.55, H, [], FIN[3]);
    letterFlaps(s, N, 102.75, 104.45, {
      plate: { kind: 'plate', text: 'LETTERS', lines: ['Ladle Row · 88 to 104'] },
      who: 'Letter flaps',
      lines: ['Haddad. Lindqvist. Okafor. Brennan, twice, in two hands. "Knots and Laces (closed)".', 'One flap is polished brighter than the rest. Its name is a child\'s, written in pen on tape: "Pip, private".'],
    });

    // ---------------- east arm, south side ----------------
    frontWall(s, S, 28, 30, H, [], FIN[6]);
    noticeboard(s, S, 28.08, 29.92, 0.92, 2.08, [
      { spec: { kind: 'notice', title: 'Booking Day', lines: ['06:00 Dawn, back terraces', '08:30 The Ledger, Ring 2', '10:00 The question', '13:00 The feast, every hall', '17:00 The vote', '22:00 The Long Flight'] }, a: 28.4, y: 1.62, w: 0.3, h: 0.44 },
      { spec: { kind: 'notice', title: 'Felt rehang', lines: ['The Ladle Row baffles come', 'down for washing after the', 'feast. Expect a loud week:', 'the street rings bare.'] }, a: 28.8, y: 1.28, w: 0.3, h: 0.4 },
      { spec: { kind: 'notice', hand: true, title: 'Lent', lines: ['Long ladder, from 16 · 41.', 'Bring it back before', 'the Flight, please.', 'We need it for the felt.'] }, a: 29.2, y: 1.7, w: 0.28, h: 0.38 },
      { spec: { kind: 'notice', title: 'Wanted', lines: ['Someone who can reglaze', 'a bread crock. We have', 'the crock, and soup', 'for whoever comes.'] }, a: 29.6, y: 1.32, w: 0.28, h: 0.38 },
    ], { title: 'LADLE ROW NOTICES', lines: [
      'Booking Day: dawn at six from the back terraces, the Ledger read at half past eight at Station Ring 2, the question at ten, the feast at one, the vote at five, the Long Flight at ten.',
      'Felt rehang: the Ladle Row baffles come down for washing after the feast. Expect a loud week: the street rings bare.',
      'Lent: the long ladder, from 16 · 41. Bring it back before the Flight, please. We need it for the felt.',
      'Wanted: someone who can reglaze a bread crock. We have the crock, and soup for whoever comes.',
    ] });
    sign(s, SIGNS['deck16.plate'], ...S.pt(29, 2.38, -0.01), { face: S.face, w: 0.36, h: 0.16 });
    pilaster(s, S, 40, H);
    keep(doorsS, unit(s, S, 40, 42, { fin: 1, name: 'Okafor', num: '16 · 41', clip: clipE, win: false, door: 0.45 }));
    pilaster(s, S, 42, H);
    pilaster(s, S, 100, H);
    keep(doorsS, unit(s, S, 100, 104.55, { fin: 6, name: 'Lindqvist', num: '16 · 101', clip: clipE }));
    bench(s, 103.0, 3.45, Math.PI, { tags: ['street', 'ladle-row'] });

    // ---------------- east arm: furniture ----------------
    publicClock(s, st, 28 + 77 / 13 * 0.5, 0, 2.62, { r: 0.3, label: { kind: 'plate', text: 'LADLE ROW', lines: ['wound on the Quiet'] } });
    noticePillar(s, 86.0, 1.4, [SIGNS['poster.flight'], SIGNS['poster.sun'], SIGNS['poster.dawn'], SIGNS['poster.fund']], { notes: [SIGNS['court.lost.lid'], SIGNS['poster.quiet'] ? { kind: 'notice', title: 'The Quiet', lines: ['No worlds. No messages.', 'Sit in the halls and talk.'] } : null].filter(Boolean) });
    {
      const ip = [86.0, 1.4, 1.4];
      s.interact({ x: ip[0], y: ip[1], z: ip[2] - 0.5, radius: 1.6, prompt: 'Read the notice pillar', onUse(g2) { read(g2, 'The notice pillar', [
        'The Long Flight: ten at night till lamp-dawn, the Spindle end to end. Wing-sleeves, hand lamps.',
        'One More Hour of full sun in the Hollow: vote sun. Pasted over it, at exactly the same height: The Hall Fund. More cooks, more seats.',
        "Oona's Dawn: Booking Day at six, from the back terraces. A year in the making.",
        'Found: a hall lid, numbered 211. Marit Vell\'s Hall will want it.',
      ]); } });
      for (const q of [[86.0, 0.6, 0], [87.1, 1.4, -Math.PI / 2], [85.0, 2.3, Math.PI * 0.8]]) s.spot('stand', q[0], 0, q[1], q[2], { tags: ['read', 'street'] });
    }
    streetPlanter(s, 47.0, 3.48, 1.6, 0.45, 'flower'); streetPlanter(s, 76.0, 3.48, 1.6, 0.45, 'broad'); streetPlanter(s, 94.5, 3.48, 1.4, 0.45, 'fern');
    bench(s, 79.0, 3.45, Math.PI, { tags: ['street', 'ladle-row'] });
    bench(s, 49.2, 3.45, Math.PI, { tags: ['street', 'ladle-row'], w: 1.4 });
    prop(s, 'streets.bicycle', 99.4, 0, -3.6, 0, { c: '#c9552e', basket: '#d6a640' });
    prop(s, 'streets.bicycle', 101.4, 0, -3.62, Math.PI, { c: '#2f6f73' });
    prop(s, 'streets.bicycle', 55.5, 0, 3.6, 0.04, { c: '#33407a', basket: '#5f8a3a' });
    prop(s, 'streets.handcart', 70.0, 0, 3.42, Math.PI, { c: '#8a5634', load: 'crates' });
    signBoard(s, st, 28 + 77 / 13, -2.0,
      [P('WICK COURT', 'anti · the block court'), P('THE LONG TABLE', 'the hall · through the court'), P('THREAD STREET', 'through the court · the menders')],
      [P('CORE A · CABS', 'spinward · lifts and stairs'), P('THE SCHOOL', 'spinward · the long hall'), SIGNS['pointer.ropewalk']]);
    signBoard(s, st, 28 + 77 / 13 * 11, 2.0,
      [P('CORE A · CABS', 'anti · lifts and stairs'), P('WICK COURT', 'anti · the hall'), P('THE BATHS', 'anti · past the court')],
      [SIGNS['pointer.ropewalk'], P('CANDLEWICK CLINIC', 'here · walk in')]);

    // ---------------- the east end: the arch into Ropewalk, and the row running on ----------------
    thresholdArch(s, st, 105, 1, 'ROPEWALK', noteOf('Ropewalk', 'decks 16 to 21'), 'CANDLEWICK', [99, -0.3, -4.5, 111, H + 0.3, 4.5]);
    if (!game.city) runOn(s, st, { a0: 105, a1: 145, dir: 1, clip: [104.6, -0.3, -4.5, 145.2, H + 0.3, 4.5], name: 'Ropewalk', seed: 1,
      lobbyPlate: { kind: 'plate', text: 'ROPEWALK CORE', lines: ['cabs · decks 16 to 21'] },
      cabText: 'A Ropewalk cab is waiting in the berth. Candlewick is just back down the row, under the arch.' });

    // ---------------- west arm, north side: slivers between the block's rooms ----------------
    frontWall(s, N, -30, -28, H, [], FIN[8]);
    sign(s, SIGNS['ladle-row.street'], ...N.pt(-29, 2.3, -0.01), { face: N.face, w: 0.9, h: 0.2 });
    sign(s, SIGNS['deck16.plate'], ...N.pt(-29, 1.6, -0.01), { face: N.face, w: 0.36, h: 0.16 });
    streetPlanter(s, -29.0, -3.5, 1.5, 0.42, 'herbs');
    pier(s, N, -62, -61.5, H);
    pilaster(s, N, -68, H); pilaster(s, N, -65.5, H);
    keep(doorsN, unit(s, N, -68, -65.5, { fin: 7, name: 'Ishikawa', num: '16 · 66', clip: clipW, win: false, door: 0.7 }));
    pier(s, N, -104.6, -104, H);

    // ---------------- west arm, south side: the long run of houses ----------------
    const runS = [
      [-104.55, -100.6, { fin: 0, name: 'Asante', num: '16 · 104' }],
      [-100.6, -96.4, { fin: 1, name: 'Ruiz', num: '16 · 100' }],
      [-96.4, -93.6, { kind: 'stair', fin: 4, name: 'STAIR', num: 'decks 17 to 21', prompt: 'Try the stair door', knock: 'The residents\' stair. Locked, and somebody has chalked a small arrow on it pointing to the court stair.' }],
      [-93.6, -90.6, { kind: 'niche' }],
      [-90.6, -86.0, { fin: 2, name: 'Novak', num: '16 · 90' }],
      [-86.0, -81.8, { fin: 3, name: 'Kaur', num: '16 · 86' }],
      [-81.8, -77.6, { fin: 5, name: 'Mensah', num: '16 · 82' }],
      [-77.6, -73.8, { fin: 8, name: 'Benedek', num: '16 · 78' }],
      [-73.8, -69.8, { fin: 7, name: 'Duarte', num: '16 · 74' }],
      [-69.8, -65.2, { fin: 0, name: 'Varga', num: '16 · 70', win2: 3.15, win: 0.2, door: 1.75 }],
      [-65.2, -60.0, { fin: 2, name: 'Moreau', num: '16 · 66' }],
    ];
    for (const u of runS) {
      pilaster(s, S, u[0], H);
      if (u[2].kind === 'niche') sweeperNiche(s, S, u[0], u[1], FIN[6]);
      else keep(doorsS, unit(s, S, u[0], u[1], Object.assign({ clip: clipW }, u[2])));
    }
    pilaster(s, S, -36, H);
    keep(doorsS, unit(s, S, -36, -31.4, { fin: 8, name: 'Tova', num: '16 · 34', clip: clipW }));
    pilaster(s, S, -31.4, H);
    keep(doorsS, unit(s, S, -31.4, -28.4, { kind: 'stair', fin: 4, name: 'STAIR', num: 'decks 17 to 21', clip: clipW, prompt: 'Try the stair door', knock: 'Locked. Through the glass, a stair with a runner worn to the weave in the middle of every tread.' }));
    pier(s, S, -28.4, -28, H);

    // ---------------- west arm: furniture ----------------
    bench(s, -98.4, 3.45, Math.PI, { tags: ['street', 'ladle-row'], knitting: '#c9552e' });
    bench(s, -67.6, 3.45, Math.PI, { tags: ['street', 'ladle-row'], w: 1.4 });
    bench(s, -33.6, 3.45, Math.PI, { tags: ['street', 'ladle-row'], w: 1.4 });
    chalk(s, st, -85.6, 2.2, { flip: true });
    prop(s, 'streets.bicycle', -79.0, 0, 3.6, Math.PI, { c: '#d6a640' });
    prop(s, 'streets.bicycle', -74.9, 0, 3.62, 0.03, { c: '#8a2f3c', basket: '#2f6f73' });
    prop(s, 'streets.bicycle', -102.2, 0, 3.6, 0, { c: '#5f8a3a' });
    prop(s, 'streets.handcart', -52.5, 0, -3.42, 0, { c: '#6b7a3a', load: 'cloth' });
    streetPlanter(s, -71.8, 3.48, 1.5, 0.45, 'flower'); streetPlanter(s, -88.3, 3.48, 1.2, 0.45, 'broad');
    noticePillar(s, -63.0, 1.4, [SIGNS['poster.booking'], SIGNS['poster.feast'], SIGNS['poster.reels'], SIGNS['poster.choir']], { tint: '#6e2f2a', notes: [SIGNS['court.lost.thread'], SIGNS['court.lost.cab']] });
    {
      s.interact({ x: -63.0, y: 1.4, z: 0.9, radius: 1.6, prompt: 'Read the notice pillar', onUse(g2) { read(g2, 'The notice pillar', [
        'Booking Day: the beam is booked, the Ledger is read, one question is put.',
        'The Feast: every hall at one. Steak, salad, cheese, half an apple each. Grown for six weeks.',
        'Reels on the Third, from three on Booking Day. Land a hand spinward.',
        'Found: one black thread, left wrist, small. Ask at the baths.',
      ]); } });
      for (const q of [[-63.0, 0.6, 0], [-61.9, 1.4, -Math.PI / 2], [-64.0, 2.2, Math.PI * 0.8]]) s.spot('stand', q[0], 0, q[1], q[2], { tags: ['read', 'street'] });
    }
    signBoard(s, st, -28 - 77 / 13, 2.0,
      [P('THE BATHS', 'anti · warm all day'), P('THE FERNERY', 'anti · a dim wood'), SIGNS['pointer.pennyfold']],
      [P('WICK COURT', 'spinward · the block court'), P('THE LONG TABLE', 'the hall · through the court'), P('CORE B · CABS', 'Thread Street · to the Hollow')]);
    signBoard(s, st, -28 - 77 / 13 * 11, -2.0,
      [SIGNS['pointer.pennyfold']],
      [P('WICK COURT', 'spinward · the hall'), P('CORE A · CABS', 'spinward · past the court'), P('THE SCHOOL', 'spinward · past the court')]);

    // ---------------- the west end: the arch into Pennyfold ----------------
    thresholdArch(s, st, -105, -1, 'PENNYFOLD', noteOf('Pennyfold', 'decks 16 to 21'), 'CANDLEWICK', [-111, -0.3, -4.5, -99, H + 0.3, 4.5]);
    if (!game.city) runOn(s, st, { a0: -105, a1: -145, dir: -1, clip: [-145.2, -0.3, -4.5, -104.6, H + 0.3, 4.5], name: 'Pennyfold', seed: 4,
      lobbyPlate: { kind: 'plate', text: 'PENNYFOLD CORE', lines: ['cabs · decks 16 to 21'] },
      cabText: 'A Pennyfold cab is waiting in the berth. You leave it be: the baths are back under the arch, and so is lunch.' });

    // ---------------- people: walkways, groups, places to stand ----------------
    const vS = 2.55;
    const far = game.city ? 105 : 145;       // with the city, Ropewalk and Pennyfold are real blocks that begin at the arches
    for (const arm of [[28, far, linesE, doorsN, doorsS], [-far, -28, linesW, doorsN, doorsS]]) {
      const [a0, a1, lines] = arm;
      const inArm = (a) => a >= a0 - 0.1 && a <= a1 + 0.1;
      const dn = arm[3].filter(inArm), ds = arm[4].filter(inArm);
      const mid = stations(a0, a1, 3, lines);
      rowPath(s, st, 0, mid.concat([a0 < 0 ? -28 : 28]));
      rowPath(s, st, -vS, stations(a0 + 0.6, a1 - 2.5, 3, lines.concat(dn)));
      rowPath(s, st, vS, stations(a0 + 0.6, a1 - 2.5, 3, lines.concat(ds)));
      for (const a of lines) s.path([st.xz(a, -vS), st.xz(a, 0), st.xz(a, vS)]);
      for (const a of dn) s.path([st.xz(a, -3.35), st.xz(a, -vS)], { width: 1.0 });
      for (const a of ds) s.path([st.xz(a, 3.35), st.xz(a, vS)], { width: 1.0 });
    }
    // chat groups at the corners and by the stairs
    const group = (x, z, n, r, tags) => { for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2 + 0.4; const px = x + Math.cos(t) * r, pz = z + Math.sin(t) * r; s.spot('chat', px, 0, pz, Math.atan2(x - px, z - pz), { tags: tags || ['street', 'ladle-row'] }); } };
    group(32.6, 2.0, 3, 0.6); group(66.8, -2.2, 3, 0.65); group(97.0, -2.0, 2, 0.55); group(-34.8, 2.1, 3, 0.6); group(-95.0, 2.2, 4, 0.7); group(-58.0, 1.4, 3, 0.6);

    // ---------------- zones, sound, discoveries ----------------
    s.zoneBox({ id: 'ladle-row-east', place: 'ladle-row', box: [28, -0.5, -4, 105, H, 4], name: 'Ladle Row', sub: 'Candlewick · deck 16 · runs spinward', ambience: 'arcade', reverb: 'ring' });
    s.zoneBox({ id: 'ladle-row-west', place: 'ladle-row', box: [-105, -0.5, -4, -28, H, 4], name: 'Ladle Row', sub: 'Candlewick · deck 16 · runs anti', ambience: 'arcade', reverb: 'ring' });
    if (!game.city) {
      s.zoneBox({ id: 'ropewalk-row', box: [105, -0.5, -4, 148.6, H, 4], name: 'Ropewalk', sub: 'the next block · Ladle Row runs on', ambience: 'arcade', reverb: 'ring' });
      s.zoneBox({ id: 'pennyfold-row', box: [-148.6, -0.5, -4, -105, H, 4], name: 'Pennyfold', sub: 'the next block · Ladle Row runs on', ambience: 'arcade', reverb: 'ring' });
    }
    let airOn = false;
    game.events.on('zone', (e) => {
      const z = e && (e.zone || e); if (airOn || !z || z.scope !== s || !game.audio) return; airOn = true;
      for (const x of [52, 88, -52, -88]) game.loopAt('air', f, x, 3.0, st.hw - 1.0, { vol: 0.25, radius: 14 });
    });
    // the floor curving up ahead: noticed by walking spinward down the east arm
    s.trigger({ box: [64, -0.5, -4, 105, 2.5, 4], onEnter(g2) { if (Math.sin(g2.player.yaw) > 0.6) found(g2, 'curve-ahead'); } });
    // heavier spinward, lighter anti: noticed by running the row
    W.dynamics.push({ scope: s, t: 0, update(dt) {
      const p = game.player; if (!p || p.frame !== f || Math.abs(p.pos.z) > 4 || Math.abs(p.pos.x) < 28 || Math.abs(p.pos.x) > 145) { this.t = 0; return; }
      if (Math.abs(p.vel.x) > 4.2) { this.t += dt; if (this.t > 1.6) { found(game, 'spin-heavier'); this.t = -1e9; } } else if (this.t > 0) this.t = 0;
    } });

    s.finish();
    // join the shops' and passages' door paths to the street once everything is built
    stitch(s, st, [28, 105], [2.4, 5.6]); stitch(s, st, [-105, -28], [2.4, 5.6]);
    let stitched = false;
    game.events.on('update', () => { if (stitched) return; stitched = true; stitch(s, st, [28, 105], [2.4, 5.6]); stitch(s, st, [-105, -28], [2.4, 5.6]); });

    game.spawns['ladle-row'] = { frame: f, x: 31.5, y: 0, z: 0.6, yaw: Math.PI / 2 };
    game.spawns['ladle-west'] = { frame: f, x: -31.5, y: 0, z: -0.6, yaw: -Math.PI / 2 };
    game.spawns['ladle-east-end'] = { frame: f, x: 100, y: 0, z: 0, yaw: -Math.PI / 2 };
  },
};
