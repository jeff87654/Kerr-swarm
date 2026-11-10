// The block office: where the block court's speaker keeps Candlewick's business between sittings. A long counter of
// ledgers, three big boards (this week's matters before the court, the flat lottery, the Hollow draw), the block's own
// small ledger of births against deaths and its room, a brass bell, a cabinet of key drawers, a kettle, chairs for
// waiting, and the speaker's stool hung on the wall until it is wanted in the court.
import { wall, lamp } from '../world/kit.js';
import { room, shopfront } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { SIGNS } from '../content/signs.js';
import { candlewick, say, choose, found, meet, sfx, seat, ceilingWorks, trims, rngFor, fy, shade } from './civic_parts.js';

const X0 = -39, X1 = -30, Z0 = -13.5, Z1 = -4, H = 3.2;
const PAL = { green: '#2f4a3c', green2: '#3f6250', oxblood: '#7a2a3a', saffron: '#e0a040', brass: '#c8a45a', cream: '#efe4cc', plaster: '#e6d8b8', walnut: '#5b3d27', floor: '#8a6240' };
const BOARD_PAL = ['#1f3329', '#f3e6c8', '#e0a040'];

const COURT = SIGNS['court.notices'] || { kind: 'board', title: 'Block court this week', lines: ['The Quiet, 19:00, Wick Court'] };
const LOTTERY = { kind: 'board', title: 'The flat lottery', lines: ['Terrace 19 · 14|Sela and Joon', 'Terrace 21 · 8|Mirela and Ade', "Hollow's edge 4|Hanne and Kit", 'Deck 17 · 22|Ola and Benedek', 'Lent five years|or till a place', 'Next draw|after Booking Day'], palette: BOARD_PAL };
const HOLLOW = { kind: 'board', title: 'The Hollow draw', lines: ['Lawns · the 4th|mornings', 'Lake · the 9th|to Hassock', 'Lake · the 11th|from Hassock', 'Orchard · the 15th|with brush crews', 'Kite field · the 22nd|children first', "The block's weight|full"], palette: BOARD_PAL };
const BIRTHS = { kind: 'board', title: 'Candlewick this year', lines: ['Born|26', 'Died|25', 'Thirds by leave|none yet', 'Room for a third|about one a year', 'Asking this week|Okonjo'], palette: ['#3a1e24', '#f3e6c8', '#e0a040'] };

export const place = {
  id: 'block-office', name: 'The block office', order: 59,
  build(game) {
    const f = candlewick(game), s = game.world.scope('block-office', f), g = s.g;
    const clip = room(s, { x0: X0, z0: Z0, x1: X1, z1: Z1, y: 0, h: H, floor: ['planks', PAL.floor], ceil: ['paint', '#e9dfc8'],
      wall: { tint: PAL.plaster, dado: { h: 1.05, mat: 'flute', tint: PAL.walnut }, skirt: '#2a1c14' }, open: { s: false }, glow: { sky: '#ffdcae', ground: '#8a6240', power: 0.16 } });

    // ---------------- the front ----------------
    const sf = shopfront(s, { side: 's', a0: X0, a1: X1, c: Z1, y: 0, h: H, door: { at: 5.9, w: 1.1, kind: 'hinge', style: 'glazed', tint: PAL.green },
      fascia: { kind: 'fascia', text: 'Block Office', sub: 'Candlewick block court · the speaker is in', emblem: 'book', palette: [PAL.green, '#f3e6c8', PAL.saffron] },
      palette: { frame: PAL.green, plinth: PAL.oxblood, awning: [PAL.oxblood, '#efe4cc'] }, awning: false, plinth: 0.6, glow: 0.5 });
    void sf;
    sign(s, { kind: 'plate', text: 'BLOCK OFFICE', lines: ['open while the kettle is on'] }, -31.4, 1.5, Z1 + 0.075, { face: 'Z', w: 0.4, h: 0.18 });
    sign(s, { kind: 'hanging', text: 'BLOCK COURT', sub: 'ask here', emblem: 'book', palette: [PAL.cream, PAL.green, PAL.oxblood] }, -38.6, 2.3, Z1 + 0.55, { face: 'X', double: true, w: 0.5, h: 0.5 });
    s.deco(() => { g.mat('cast', '#2f2c28'); g.tube([[-38.6, 2.62, Z1 + 0.1], [-38.6, 2.62, Z1 + 0.85]], 0.012, { segs: 6 }); });

    // ---------------- ceiling, trims, floor runner ----------------
    ceilingWorks(s, X0 + 0.16, Z0 + 0.16, X1 - 0.16, Z1, H, { beam: PAL.walnut, every: 2.25, duct: '#a9a49a', ductZ: Z0 + 0.55, pipe: '#b07a45', pipeZ: Z0 + 0.95 });
    trims(s, X0, Z0, X1, Z1, { skip: 's', rail: 2.45, railTint: PAL.walnut, band: PAL.green, bandH: 0.3, H });
    prop(s, 'rug', -35.6, 0, -6.4, 0, { w: 4.6, d: 1.5, a: PAL.oxblood, b: PAL.saffron, mat: 'motif' });

    // ---------------- the long counter, with its flap ----------------
    const CZ = -8.7;
    s.furniture(() => {
      g.mat('paint', PAL.green, { rough: -0.1 }); g.box(-38.75, 0.06, CZ - 0.3, -33.7, 1.0, CZ + 0.28, { aoBottom: 0.6 });
      g.mat('paint', PAL.green2); for (let i = 0; i < 7; i++) { const x0 = -38.65 + i * 0.71; g.box(x0 + 0.04, 0.16, CZ + 0.28, x0 + 0.67, 0.88, CZ + 0.3, { bevel: 0.01 }); }
      g.mat('wood', '#2a1c14'); g.box(-38.72, 0, CZ - 0.27, -33.73, 0.06, CZ + 0.25);
      g.mat('wood', '#8a5a32', { rough: -0.15 }); g.box(-38.85, 1.0, CZ - 0.34, -33.62, 1.05, CZ + 0.36, { bevel: 0.012 });
      g.mat('cast', PAL.brass); g.box(-38.85, 0.9, CZ + 0.3, -33.62, 0.93, CZ + 0.33); g.tube([[-38.8, 0.25, CZ + 0.42], [-33.7, 0.25, CZ + 0.42]], 0.018, { segs: 6 });
      for (const x of [-38.5, -36.2, -34.0]) g.box(x - 0.02, 0.24, CZ + 0.3, x + 0.02, 0.27, CZ + 0.44);
      // the flap: a hinged lid lifted against the wall end, and a half door under it
      g.mat('wood', '#8a5a32'); g.box(-33.62, 1.0, CZ - 0.34, -33.58, 1.72, CZ + 0.36, { bevel: 0.006 });
      g.mat('paint', PAL.green); g.box(-32.05, 0.06, CZ - 0.3, -30.2, 1.0, CZ + 0.28, { aoBottom: 0.6 });
      g.mat('wood', '#8a5a32', { rough: -0.15 }); g.box(-32.12, 1.0, CZ - 0.34, -30.16, 1.05, CZ + 0.36, { bevel: 0.012 });
      g.mat('paint', PAL.green2); g.box(-31.95, 0.16, CZ + 0.28, -30.3, 0.88, CZ + 0.3, { bevel: 0.01 });
    });
    s.solid(-38.85, 0, CZ - 0.34, -33.62, 1.05, CZ + 0.44); s.solid(-32.12, 0, CZ - 0.34, -30.16, 1.05, CZ + 0.36);
    // what is on it: two ledgers open, a stack of others, the bell, a pen tray, a green-shaded lamp, a lidded cup, a plant
    const r = rngFor('bo-counter');
    s.detail(() => {
      const ledger = (x, z, w, d, cover, open) => {
        g.mat('leather', cover); g.box(x - w / 2, 1.05, z - d / 2, x + w / 2, 1.068, z + d / 2, { bevel: 0.004 });
        if (open) { g.mat('paper', '#f1e6cc'); g.box(x - w / 2 + 0.02, 1.068, z - d / 2 + 0.015, x - 0.006, 1.085, z + d / 2 - 0.015); g.box(x + 0.006, 1.068, z - d / 2 + 0.015, x + w / 2 - 0.02, 1.085, z + d / 2 - 0.015);
          g.mat('plain', '#3a2c20'); for (let i = 0; i < 12; i++) { const zz = z - d / 2 + 0.05 + i * (d - 0.1) / 12; g.box(x - w / 2 + 0.05, 1.086, zz, x - 0.04 - r.f(0, 0.1), 1.087, zz + 0.006); g.box(x + 0.04, 1.086, zz, x + w / 2 - 0.05 - r.f(0, 0.12), 1.087, zz + 0.006); } }
      };
      ledger(-37.6, CZ + 0.02, 0.62, 0.42, PAL.oxblood, true);
      ledger(-35.4, CZ - 0.02, 0.56, 0.4, '#2f4f6b', true);
      let y = 1.05; for (let i = 0; i < 6; i++) { const t = r.f(0.04, 0.07); g.mat('leather', [PAL.oxblood, PAL.green, '#2f4f6b', '#6b4a2f', '#c9962e', '#3a2a20'][i]); g.box(-34.55 + r.f(-0.03, 0.03), y, CZ - 0.2 + r.f(-0.02, 0.02), -34.12 + r.f(-0.03, 0.03), y + t, CZ + 0.12, { bevel: 0.004 }); y += t; }
      g.mat('wood', '#3a2a20'); g.box(-36.6, 1.05, CZ + 0.05, -36.3, 1.07, CZ + 0.2, { bevel: 0.004 });
      g.mat('plain', '#1d1b18'); for (let i = 0; i < 3; i++) g.tube([[-36.58 + i * 0.03, 1.08, CZ + 0.08], [-36.4 + i * 0.03, 1.08, CZ + 0.17]], 0.004, { segs: 4 });
      // ink pot, blotter, paper slips on a spike
      g.mat('glaze', '#1d2a3a'); g.cyl(-36.15, 1.05, CZ + 0.12, 0.03, 0.05, { segs: 10 });
      g.mat('cast', PAL.brass); g.cyl(-33.95, 1.05, CZ + 0.15, 0.04, 0.01, { segs: 10 }); g.tube([[-33.95, 1.06, CZ + 0.15], [-33.95, 1.2, CZ + 0.15]], 0.003, { segs: 3 });
      g.mat('paper', '#f3ead6'); for (let i = 0; i < 6; i++) g.box(-34.0, 1.07 + i * 0.012, CZ + 0.1, -33.9, 1.072 + i * 0.012, CZ + 0.2);
    });
    prop(s, 'civic.bell', -36.0, 1.05, CZ + 0.22, 0, {});
    prop(s, 'civic.desklamp', -38.3, 1.05, CZ - 0.18, 0, { shade: '#2f6f4a' });
    lamp(s, 'bulb', -38.3, 1.38, CZ - 0.1, { K: 2800, power: 0.35, range: 3, clip });
    prop(s, 'cup', -37.0, 1.05, CZ - 0.2, 0, { glaze: PAL.oxblood, lid: '#efe4cc' });
    prop(s, 'plant', -30.6, 1.05, CZ, 0, { kind: 'fern', size: 0.55, pot: PAL.saffron, seed: 9 });
    s.spot('counter', -36.2, 0, CZ - 0.75, 0, { who: 'halima', tags: ['clerk', 'block-office'] });
    s.spot('customer', -37.4, 0, CZ + 0.95, Math.PI, { tags: ['block-office', 'ask'] });
    s.spot('customer', -35.0, 0, CZ + 1.0, Math.PI - 0.2, { tags: ['block-office', 'ask'] });

    // ---------------- the three big boards and the small ledger ----------------
    sign(s, COURT, X0 + 0.17, 1.75, -6.6, { face: 'X', w: 1.7, h: 1.15, back: PAL.walnut });
    sign(s, LOTTERY, X1 - 0.17, 1.75, -6.6, { face: 'x', w: 1.7, h: 1.15, back: PAL.walnut });
    sign(s, HOLLOW, -37.0, 1.85, Z0 + 0.17, { face: 'Z', w: 1.7, h: 1.15, back: PAL.walnut });
    sign(s, BIRTHS, -34.9, 1.95, Z0 + 0.17, { face: 'Z', w: 1.05, h: 0.85, back: PAL.brass });
    s.deco(() => {
      g.mat('cast', PAL.brass);
      // brass rails over each big board, with a little picture lamp each
      for (const b of [[X0 + 0.17, -6.6, 'X'], [X1 - 0.17, -6.6, 'x'], [-37.0, Z0 + 0.17, 'Z']]) {
        if (b[2] === 'Z') { g.box(b[0] - 0.9, 2.45, b[1], b[0] + 0.9, 2.48, b[1] + 0.06); g.tube([[b[0], 2.47, b[1] + 0.02], [b[0], 2.62, b[1] + 0.28]], 0.01, { segs: 5 }); }
        else { const sx = b[2] === 'X' ? 1 : -1; g.box(b[0], 2.45, b[1] - 0.9, b[0] + sx * 0.06, 2.48, b[1] + 0.9); g.tube([[b[0] + sx * 0.02, 2.47, b[1]], [b[0] + sx * 0.28, 2.62, b[1]]], 0.01, { segs: 5 }); }
      }
    });
    lamp(s, 'strip', X0 + 0.42, 2.6, -7.3, { to: [X0 + 0.42, 2.6, -5.9], K: 2900, power: 0.45, clip, range: 3 });
    lamp(s, 'strip', X1 - 0.42, 2.6, -7.3, { to: [X1 - 0.42, 2.6, -5.9], K: 2900, power: 0.45, clip, range: 3 });
    lamp(s, 'strip', -37.7, 2.6, Z0 + 0.42, { to: [-36.3, 2.6, Z0 + 0.42], K: 2900, power: 0.45, clip, range: 3 });
    s.interact({ x: X0 + 1.0, y: 1.5, z: -6.6, radius: 1.4, prompt: 'Read this week\'s matters', async onUse(gm) {
      await say(gm, 'Block court this week', ['Noise: flute practice after ten. The Long Pipe asks for felt; Mags has offered to hang it.', 'Heat: deck 20, spinward end, runs warm. A pump is coming.', 'Rooms: 18 · 3 and 21 · 6 wish to swap. Both agreed. The stairs did not get a vote.', 'Hollow: a turn swap with Hassock.', "Leave: Nell and Arturo Okonjo ask the block's leave for a third.", 'Sitting: the Quiet, 19:00, Wick Court. Out loud and in minutes.']);
      found(gm, 'blocks-leave');
    } });
    s.interact({ x: X1 - 1.0, y: 1.5, z: -6.6, radius: 1.4, prompt: 'Read the flat lottery', async onUse(gm) {
      await say(gm, 'The flat lottery', ["The block's lent flats, drawn this month. The terraces and the Hollow's edge go by draw; the dim decks go to whoever is left.", 'Terrace 19 · 14: Sela and Joon. Terrace 21 · 8: Mirela and Ade. The Hollow\'s edge, 4: Hanne and Kit. Deck 17 · 22: Ola and Benedek.', 'Each is lent five years, or until one of the couple inherits a place. Next draw after Booking Day.', 'Someone has drawn a small window next to the terrace names, and someone else a lamp turned low next to the deck 17 one.']);
      found(gm, 'flat-draw');
    } });
    s.interact({ x: -37.0, y: 1.6, z: Z0 + 1.0, radius: 1.3, prompt: 'Read the Hollow draw', async onUse(gm) {
      await say(gm, 'The Hollow draw', ['Hollow time this month, by lottery. Lawns on the 4th, mornings. The lake on the 9th, swapped to Hassock for the 11th, which has the lake too.', 'The orchard rows on the 15th, with the brush crews. The kite field on the 22nd, children first.', "And at the bottom, underlined: the block's weight in the draw, full."]);
      found(gm, 'hollow-share');
    } });
    s.interact({ x: -34.9, y: 1.6, z: Z0 + 1.0, radius: 1.1, prompt: 'Read the block\'s own ledger', async onUse(gm) {
      await say(gm, 'Candlewick this year', ['Born, 26. Died, 25. Thirds given by leave: none yet. Room for a third: about one a year.', 'Asking this week: Okonjo.', "The same three lines stand on the Ledger at the station for every block in Chervil, births against deaths against room, where anyone can read them."]);
      found(gm, 'mild-sanctions');
    } });

    // ---------------- behind the counter: the speaker's desk, the key drawers, the kettle, the stool on its pegs ----------------
    prop(s, 'table', -36.6, 0, -11.6, 0, { w: 1.5, d: 0.75, wood: PAL.walnut });
    prop(s, 'chair', -36.6, 0, -11.0, Math.PI, { wood: '#3a2a20', seat: PAL.oxblood }, { spot: { who: 'halima', tags: ['clerk', 'write', 'block-office'] } });
    s.detail(() => {
      g.mat('leather', PAL.green); g.box(-37.2, 0.74, -11.85, -36.5, 0.75, -11.35);
      g.mat('paper', '#f3ead6'); for (let i = 0; i < 4; i++) g.box(-36.3 + i * 0.012, 0.74 + i * 0.012, -11.9 + i * 0.02, -35.95 + i * 0.012, 0.742 + i * 0.012, -11.6 + i * 0.02);
      g.mat('leather', PAL.oxblood); g.box(-37.25, 0.75, -11.9, -36.85, 0.81, -11.62, { bevel: 0.004 });
    });
    prop(s, 'civic.desklamp', -36.0, 0.74, -11.85, 0, { shade: '#2f6f4a' });
    lamp(s, 'bulb', -36.0, 1.05, -11.8, { K: 2700, power: 0.3, range: 2.6, clip });
    prop(s, 'civic.drawers', -32.6, 0, Z0 + 0.38, 0, { w: 1.3, h: 1.35, d: 0.42, rows: 7, cols: 4, wood: '#6b4a2f' });
    s.detail(() => {
      // keys on hooks in a glazed case over the drawers, a tag on every ring
      g.mat('wood', PAL.walnut); g.box(-33.2, 1.5, Z0 + 0.16, -32.0, 2.3, Z0 + 0.26, { bevel: 0.01 });
      g.mat('felt', PAL.green); g.box(-33.15, 1.55, Z0 + 0.26, -32.05, 2.25, Z0 + 0.262);
      const rk = rngFor('bo-keys');
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
        if (rk.chance(0.18)) continue;
        const x = -33.05 + i * 0.18, y = 2.15 - j * 0.18;
        g.mat('cast', PAL.brass); g.box(x - 0.004, y - 0.004, Z0 + 0.262, x + 0.004, y + 0.004, Z0 + 0.29);
        g.mat('cast', rk.chance(0.5) ? '#c8a45a' : '#a9a49a'); g.box(x - 0.008, y - 0.1, Z0 + 0.28, x + 0.008, y - 0.01, Z0 + 0.287);
        g.mat('paper', ['#efe4cc', '#e0a040', '#d4878a', '#a9d8c8'][rk.i(0, 3)]); g.box(x - 0.025, y - 0.16, Z0 + 0.282, x + 0.025, y - 0.1, Z0 + 0.285);
      }
    });
    s.glass(-33.2, 1.5, Z0 + 0.3, -32.0, 2.3, Z0 + 0.3, { opacity: 0.12 });
    sign(s, { kind: 'label', text: 'KEYS', sub: 'lent flats · store rooms · the court piano', ink: '#efe4cc' }, -32.6, 2.37, Z0 + 0.27, { face: 'Z', w: 0.9, h: 0.1 });
    prop(s, 'table', -30.75, 0, -12.3, Math.PI / 2, { w: 1.0, d: 0.5, h: 0.8, wood: '#7a5233' });
    prop(s, 'civic.kettle', -30.75, 0.8, -12.55, 0.4, { enamel: PAL.oxblood });
    for (let i = 0; i < 4; i++) prop(s, 'cup', -30.65 + (i % 2) * 0.13, 0.8, -12.15 + Math.floor(i / 2) * 0.13, 0, { glaze: ['#efe4cc', PAL.saffron, PAL.green2, '#d4878a'][i], lid: '#efe4cc' });
    s.detail(() => { g.mat('glaze', '#e0a040'); g.cyl(-30.8, 0.8, -11.95, 0.07, 0.12, { segs: 12 }); g.mat('glaze', '#efe4cc'); g.cyl(-30.8, 0.92, -11.95, 0.072, 0.02, { segs: 12 }); });
    sign(s, { kind: 'notice', title: 'Kettle', lines: ['Help yourself.', 'Lids on, heliox is quick.', 'Cups back on the tray.'], hand: true }, X1 - 0.17, 1.5, -12.3, { face: 'x', w: 0.24, h: 0.3, board: false });
    s.interact({ x: -31.0, y: 1.0, z: -12.3, radius: 1.0, prompt: 'Make a cup of tea', onUse(gm) { sfx(gm, 'pour', f, -30.75, 0.95, -12.5); say(gm, 'The kettle', ['The kettle is still hot from the loop. You pour, put the lid on the cup quickly, as the note asks, and carry it back round the counter.', 'Nobody asks you for anything.']); } });
    // the speaker's stool, hung on two pegs between sittings
    s.furniture(() => {
      g.mat('wood', PAL.walnut); for (const z of [-11.2, -10.5]) g.tube([[X1 - 0.17, 2.05, z], [X1 - 0.32, 2.07, z]], 0.018, { segs: 6 });
      g.at(X1 - 0.33, 1.25, -10.85, -Math.PI / 2); g.rotX(-0.08);
      g.mat('wood', '#3a2a20'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.18, 0, sz * 0.16], [sx * 0.15, 0.62, sz * 0.13]], 0.02, { segs: 6 });
      g.box(-0.17, 0.25, -0.15, 0.17, 0.27, -0.13); g.box(-0.17, 0.25, 0.13, 0.17, 0.27, 0.15);
      g.mat('leather', PAL.oxblood); g.box(-0.2, 0.62, -0.18, 0.2, 0.68, 0.18, { bevel: 0.02 });
      g.mat('cast', PAL.brass); g.box(-0.05, 0.68, 0.17, 0.05, 0.7, 0.19);
      g.pop();
    });
    sign(s, { kind: 'plate', text: "THE SPEAKER'S STOOL", lines: ['down for the sitting · back after'] }, X1 - 0.17, 2.3, -10.85, { face: 'x', w: 0.42, h: 0.16 });
    s.interact({ x: X1 - 0.9, y: 1.4, z: -10.85, radius: 1.2, prompt: "Look at the speaker's stool", onUse(gm) { say(gm, "The speaker's stool", ['A tall stool with a worn red oilcloth seat, hung on two pegs like a coat. On sitting nights the speaker carries it out to Wick Court and sits on it where everyone can see her.', 'Under the seat, scratched small: the names of the speakers before Halima, eleven of them, the oldest nearly gone.']); } });
    prop(s, 'shelving', -38.6, 0, -11.6, Math.PI / 2, { w: 1.8, h: 2.1, shelves: 5, wood: PAL.walnut });
    for (let k = 1; k < 5; k++) prop(s, 'civic.books', -38.6, 0.08 + k * (2.1 - 0.11) / 5 + 0.025, -11.6, Math.PI / 2, { w: 1.7, seed: 30 + k, cols: [PAL.oxblood, PAL.green, '#2f4f6b', '#6b4a2f', '#c9962e', '#3a2a20', '#e8dcc0'] });
    sign(s, { kind: 'label', text: 'MINUTES', sub: 'every sitting since the Count', ink: '#efe4cc' }, -38.43, 2.2, -11.6, { face: 'X', w: 0.9, h: 0.1 });
    s.spot('work', -38.0, 0, -11.0, -Math.PI / 2, { tags: ['clerk', 'shelf', 'block-office'] });

    // ---------------- waiting: mismatched chairs under the court board, a plant, a lamp ----------------
    const chairs = [[-38.55, -4.75, '#6b4a2f', 'hoop'], [-38.55, -5.45, '#8a5a32', 'slat'], [-38.55, -7.75, '#3a2a20', 'hoop']];
    for (const c of chairs) { prop(s, 'chair', c[0], 0, c[1], Math.PI / 2 + r.f(-0.08, 0.08), { wood: c[2], back: c[3], seat: PAL.saffron }, { spot: { tags: ['waiting', 'block-office'] } }); seat(s, c[0], 0, c[1], Math.PI / 2, 'Sit and wait your turn'); }
    prop(s, 'civic.armchair', -30.6, 0, -5.0, -Math.PI / 2 - 0.3, { cloth: PAL.green2, wood: PAL.walnut, mend: PAL.saffron }, { spot: { tags: ['waiting', 'block-office'] } });
    seat(s, -30.6, 0, -5.0, -Math.PI / 2 - 0.3, 'Sit in the armchair');
    prop(s, 'plant', -30.55, 0, -7.85, 1.0, { kind: 'broad', size: 1.6, pot: PAL.oxblood, seed: 4 });
    prop(s, 'plant', -38.55, 0, -6.6, 0.3, { kind: 'flower', size: 0.8, pot: PAL.green, seed: 6 });

    // ---------------- light ----------------
    for (const x of [-37.4, -35.0]) lamp(s, 'globe', x, 2.2, CZ + 0.1, { K: 2800, power: 0.7, clip, drop: 0.95, r: 0.15, tint: '#2f6f4a' });
    lamp(s, 'globe', -34.5, 2.35, -6.0, { K: 2800, power: 0.6, clip, drop: 0.8, r: 0.18 });
    lamp(s, 'sconce', -34.9, 2.4, Z0 + 0.17, { face: 'Z', K: 2700, power: 0.5, clip });

    // ---------------- the bell, Halima ----------------
    s.interact({ x: -36.0, y: 1.1, z: CZ + 0.5, radius: 1.0, kind: 'talk', prompt: 'Ring the bell', onUse(gm) { sfx(gm, 'bell', f, -36.0, 1.1, CZ + 0.22); speakerTalk(gm); } });

    // ---------------- zone, paths ----------------
    s.zoneBox({ id: 'block-office', place: 'block-office', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The block office', sub: 'Ladle Row', ambience: 'shop', reverb: 'room' });
    s.path([[-32.55, -2.9], [-32.55, -5.2], [-35.6, -6.6], [-36.3, CZ + 1.0]]);
    s.path([[-35.6, -6.6], [-37.9, -5.6]], { width: 1.2 });
    s.path([[-35.6, -6.6], [-31.4, -6.6]], { width: 1.2 });
    s.path([[-32.55, -5.2], [-33.1, CZ + 0.8], [-33.1, CZ - 0.9], [-35.0, -10.6], [-37.6, -10.6]], { width: 1.0 });
    s.path([[-33.1, CZ - 0.9], [-31.4, -11.6]], { width: 1.0 });
    s.spot('chat', -34.4, 0, -6.2, fy(-1, 0.3), { tags: ['chat', 'block-office'] });
    s.spot('chat', -35.2, 0, -5.6, fy(0.7, -0.6), { tags: ['chat', 'block-office'] });
    s.spot('stand', -37.6, 0, -6.5, -Math.PI / 2, { tags: ['read', 'block-office'] });
    s.spot('stand', -31.4, 0, -6.4, Math.PI / 2, { tags: ['read', 'block-office'] });
    s.finish();
    game.spawns['block-office'] = { frame: f, x: -32.55, y: 0, z: -2.4, yaw: 0 };
  },
};

async function speakerTalk(gm) {
  meet(gm, 'halima');
  if (!gm.flags.metHalima) {
    gm.flags.metHalima = true;
    await say(gm, 'halima', ['Coming. Coming. Ah: a guest. Where did you sleep last night, and have you eaten?', 'Good. I am Halima. I speak for the block court, which means I keep the list, keep the time and keep the peace, in that order.']);
  }
  const pick = await choose(gm, 'halima', 'Halima puts her pen down.', [
    { label: 'What does the block court do?', value: 'court' },
    { label: 'What happens if a block says yes too often?', value: 'teeth' },
    { label: 'Who gets the lent flats?', value: 'flats' },
    { label: 'Will the Okonjos get their leave?', value: 'leave' },
  ]);
  if (pick === 'court') {
    await say(gm, 'halima', ['About three thousand of us meet once a week in Wick Court. Noise, heat, rooms, Hollow swaps. Out loud, in minutes, and then we go and eat.', 'Nobody is fined. The court decides and moves on. Mostly the flute shop.']);
    found(gm, 'block-court');
  } else if (pick === 'teeth') {
    await say(gm, 'halima', ['The Ledger shows every block\'s births against its deaths and its room. Say yes to more thirds than you have room for, for ten years, and everybody can see it.', 'Then the drum answers with small things it already holds. Our weight in the Hollow draw. Our couples\' turn in the flat lottery. Our place on the Long Flight. Nobody wants to fly at half past two.']);
    found(gm, 'mild-sanctions');
  } else if (pick === 'flats') {
    await say(gm, 'halima', ['The drum lends first homes to young couples for five years, or until one of them inherits. The terraces and the Hollow\'s edge go by draw, because everybody wants a window. The dim decks go to whoever is left, and they make them lovely anyway.', 'Your flat came out of the same kind of draw. You were lucky.']);
    found(gm, 'flat-draw');
  } else if (pick === 'leave') {
    await say(gm, 'halima', ['That is for the court, not for me. I only keep the list.', 'But I will tell you that Arturo has rehearsed what he wants to say eleven times, and Nell has told him to stop rehearsing, and the bakery has been sending me buns. I am not a fool. I eat the buns.']);
    found(gm, 'blocks-leave');
  }
}
