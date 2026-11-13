// Chervil, Herb Row: the Ring 2 hall at supper on a Thursday, a month after Marit Vell came home from her wander year
// and started cooking there. Four hundred seats at one long table, a paid cook and eleven volunteers, nine of them
// over seventy: "You'll be seated next to someone. That's the point" (eating-out.md, Marit Vell's Hall; wander-year.md,
// Day 365). Chervil is a hall drum, "Loud, crowded, fed by people", with one long table a block, live music every
// night somewhere in every block, a choir in every block and the Ledger at every station ring (open-drums.md).
//
// The flight comes along the Ledger Arcade by Station Ring 2 with the people arriving for supper, past the Ledger and
// the Ring Counter, and turns in at the hall's open front: the whole table at once, climbing away spinward. It drops
// to a seat's height at the head of the table, by the pass, then rises just over the dishes and flies the length of it
// between the two rows of faces (124 m of table, rising about 2.6 m on deck 14, so the far end stands up at the
// ceiling line), lifts past the band at the far end and goes out where the hall opens onto its block's court, the
// choir on the terraces with hand lamps. The way out is a round opening in the court's air.
//
// Not canon (the docs give the hall, its four hundred seats, its cook and volunteers, the Thursday ramen, the aunts'
// dishes and gin after six; the rest is this page's own):
//   - the hall's shape: one room 150 m long and 13 m wide, open to the arcade at one end and to its block's court at
//     the other; the table laid spinward; the pass by the door; the band's dais at the far end; the deck (14) and
//     where on it
//   - "the Ledger Arcade", "Aunts' Court" and "Long Table" are names from three-nights 15-canon.js (Chervil's streets
//     and neighbourhoods), placed here by this page; the notice to wanderers is that file's too
//   - a Ledger board in the arcade with the figures of Marit's homecoming night (wander-year.md, Day 365); the Ring
//     Counter's stall; the shops the kit fills in
//   - the band (two long heliox flutes, a fiddle, a cello, a frame drum) and the choir singing from the court's
//     terraces with hand lamps on a Thursday
//   - the wording of the boards and cards, the dishes passed hand to hand, and who sits where
//   - the hall's ceiling painted as a Hollow dawn in Oona's colours (she is a lamp-painter; that this is hers is not
//     said), the gin counter by the door, and the strings of small lamps across the court
import { Scene, InstancedMesh, DynamicDrawUsage, Sphere, Vector3, Color } from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, street, atrium, hall, trolley, Run, PALETTES } from '../kit/deck.js';
import { litMaterial } from '../kit/mats.js';
import { Geo, shade, mixc, rgb } from '../kit/geo.js';
import { SKIN, CLOTH } from '../kit/folk.js';
import { makeRng, smoothstep, clamp } from '../core/rng.js';

// ---------------------------------------------------------------- the place, in the frame of deck 14 (x spinward, z along the axis)
const AX = -7, AW = 8;                    // the Ledger Arcade: a street along the axis, its centre line at x = AX
const HX0 = AX + AW / 2, HX1 = 146;       // the hall: from the arcade's spin side to the court's anti side
const HZ = 6.5;                           // the hall's half-width
const TX0 = 8, SEATS = 200, PITCH = 0.62, TX1 = TX0 + SEATS * PITCH;     // the table: 200 seats a side
const TW = 0.85, BZ = 1.27;               // half the table's width; where the benches stand from its middle
const CX0 = 152, CX1 = 200, CZ = 25;      // Aunts' Court: its floor, on this deck, six decks high

// Chervil's paint: Oona's River dawn (brown-violet, rose, apricot, cream) worn into plaster and old wood
const CHERVIL = {
  ...PALETTES.warm,
  walls: ['#dcc3b0', '#d4b6a4', '#e0cbb6', '#cfb39f', '#d9bfae', '#e3cfbd'],
  dado: ['#6e4a56', '#7a5560', '#5f4350', '#84606a'],
  trim: ['#4a2f36', '#5a3a3f', '#3f2a30', '#62443e'],
  doors: ['#8a4f6a', '#3d6f73', '#b9734a', '#5d4a7a', '#7e3f33', '#4f6a5a', '#a8624a', '#3d2a3f'],
  awnings: [['#8a4f6a', '#f1e2cf'], ['#e3925f', '#f6ead6'], ['#3d2a3f', '#e8d6c4'], ['#5d7a62', '#efe2cc'], ['#b9734a', '#f3e6d2']],
  signs: [['#3d2a3f', '#f1dcb0'], ['#5a2f36', '#f3dcc0'], ['#2f3a3f', '#ead9c0'], ['#efe0c8', '#3d2a3f'], ['#3b2f30', '#e9b877'], ['#6a3a42', '#f6e3c4']],
  floor: '#8c7f74', strip: '#6c5f58', court: '#bba99a', ceiling: '#a88d7f', rib: '#d8c2b0',
  rooms: ['#d9a77a', '#c9a090', '#b98a7a', '#d0b090', '#e0b88a', '#c4a07e', '#b9947a'],
  lamp: '#ffc98a', window: ['#ffc07a', '#ffd6a0', '#ffe2bc', '#f6b070'], shop: '#ffd2a0',
};
const HAIR = ['#2a1f1a', '#3b2a20', '#5a3d28', '#1c1816', '#7a4a2a', '#d9d4cc', '#b9b4ac', '#8f8a84'];
const WEAR = ['#8a4f6a', '#e3925f', '#3d2a3f', '#c9563c', '#d98c2b', '#e2c14a', '#6f9a3e', '#3f8a7a', '#3a6ea5', '#5b4b9a', '#a34b86',
  '#d7d2c4', '#8c8577', '#2f3b45', '#b5553f', '#e7e1d3', '#7a4a2e', '#4f6f8f', '#c7a36a', '#b97a8a', '#6a7a5a'];

// ---------------------------------------------------------------- people of this page's own
// The kit's figures stand or sit as one piece. Seated at a table and seen from a metre or two, people want shoulders,
// arms on the table and hair, and they want to turn to their neighbours, lean in for a dish and sway to the band: so
// these are drawn here and moved by hand each frame (instance matrices, flat, before the bend). All face +z.
// pose: 'sit' (origin on the bench), 'stand', 'carry' (a tray held out), 'sing' (a hand lamp held up), 'flute', 'fiddle',
// 'cello' (sitting on a stool), 'drum'.
function personGeo(skin, hair, pose, o = {}) {
  const g = new Geo(), legs = o.legs || '#3a3540', grey = hair === HAIR[5] || hair === HAIR[6] || hair === HAIR[7];
  const arm = (a, b, c) => { g.tint(1).tube([a, b], 0.052, 4, '#ffffff', { smooth: false }).tube([b, c], 0.046, 4, '#ffffff', { smooth: false }); g.tint(0).cube(c[0], c[1], c[2], 0.07, 0.06, 0.09, skin); };
  const head = (y, z, tilt = 0) => {
    g.tint(0).cyl(0, y - 0.2, z - 0.01, 0.05, 0.05, 0.1, 5, skin, { smooth: false });
    g.blob(0, y, z, [0.112, 0.132, 0.12], 0, skin, { shadeBottom: 0.82, seed: 3 });
    // hair: a cap set back so the face shows; the old have less of it, and lighter
    if (grey && o.bald) g.blob(0, y + 0.07, z - 0.05, [0.1, 0.07, 0.1], 0, hair, { shadeBottom: 0.95, seed: 5 });
    else {
      g.blob(0, y + 0.07 + tilt, z - 0.045, [0.124, 0.085, 0.112], 0, hair, { shadeBottom: 0.95, seed: 7, lump: 0.15 });
      g.box(-0.1, y - (o.long ? 0.16 : 0.07), z - 0.13, 0.1, y + 0.06, z - 0.06, hair, { skip: 't' });
    }
  };
  if (pose === 'sit' || pose === 'cello') {
    const s = pose === 'cello' ? 0.0 : 0.0;
    g.tint(0).box(-0.17, s, -0.04, 0.17, s + 0.15, 0.44, legs, { skip: 'b' }).box(-0.15, s - 0.45, 0.32, 0.15, s, 0.45, legs, { skip: 'tb' });
    g.tint(1).cyl(0, s + 0.06, 0.0, 0.2, 0.18, 0.47, 6, '#ffffff', { smooth: false, squash: [1, 0.72] });
    g.box(-0.235, s + 0.46, -0.08, 0.235, s + 0.57, 0.09, '#ffffff');
    if (pose === 'sit') { for (const sd of [-1, 1]) arm([sd * 0.2, s + 0.52, 0.0], [sd * 0.23, s + 0.28, 0.17], [sd * 0.14, s + 0.31, 0.47]); }
    else {
      // a cello between the knees, the bow arm out
      for (const sd of [-1, 1]) arm([sd * 0.2, s + 0.52, 0.0], [sd * 0.25, s + 0.3, 0.16], sd < 0 ? [-0.1, s + 0.5, 0.36] : [0.32, s + 0.28, 0.4]);
      g.tint(0).blob(0, s + 0.05, 0.42, [0.2, 0.36, 0.09], 0, '#7a3f22', { shadeBottom: 0.7 }).box(-0.025, s + 0.3, 0.38, 0.025, s + 0.95, 0.42, '#2a1f1a').box(0.0, s + 0.27, 0.48, 0.5, s + 0.29, 0.5, '#c9b88a');
    }
    head(s + 0.79, 0.03);
  } else {
    g.tint(0).box(-0.15, 0, -0.09, -0.02, 0.86, 0.09, legs).box(0.02, 0, -0.09, 0.15, 0.86, 0.09, legs);
    g.tint(1).cyl(0, 0.8, 0, 0.21, 0.18, 0.6, 6, '#ffffff', { smooth: false, squash: [1, 0.72] });
    g.box(-0.24, 1.32, -0.08, 0.24, 1.43, 0.09, '#ffffff');
    if (pose === 'stand') for (const sd of [-1, 1]) arm([sd * 0.21, 1.38, 0], [sd * 0.25, 1.1, 0.02], [sd * 0.24, 0.84, 0.06]);
    else if (pose === 'carry') {
      for (const sd of [-1, 1]) arm([sd * 0.21, 1.38, 0], [sd * 0.24, 1.12, 0.08], [sd * 0.2, 1.04, 0.36]);
      g.tint(0).box(-0.3, 1.04, 0.22, 0.3, 1.07, 0.6, '#8a6a4a');
      for (const [x, z] of [[-0.16, 0.32], [0.0, 0.48], [0.16, 0.32], [-0.14, 0.5], [0.15, 0.5]]) g.cyl(x, 1.07, z, 0.045, 0.075, 0.07, 6, '#e9e2d4', { top: '#c9a26a', smooth: false });
    } else if (pose === 'sing') {
      arm([-0.21, 1.38, 0], [-0.25, 1.1, 0.02], [-0.24, 0.84, 0.06]);
      arm([0.21, 1.38, 0], [0.24, 1.14, 0.12], [0.12, 1.3, 0.32]);
      g.tint(0).cyl(0.12, 1.33, 0.32, 0.012, 0.012, 0.12, 4, '#3a3540').blob(0.12, 1.49, 0.32, [0.065, 0.08, 0.065], 0, '#ffd9a0', { emit: 5, shadeBottom: 1 });
    } else if (pose === 'flute') {
      // a heliox flute is long: pipes speak at nearly twice the pitch in heliox (open-drums.md, Heliox music)
      arm([-0.21, 1.38, 0], [-0.3, 1.2, 0.12], [-0.2, 1.48, 0.3]); arm([0.21, 1.38, 0], [0.3, 1.2, 0.12], [0.36, 1.46, 0.28]);
      g.tint(0).tube([[-0.06, 1.53, 0.16], [1.1, 1.36, 0.36]], 0.017, 5, '#c9b07a');
    } else if (pose === 'fiddle') {
      arm([-0.21, 1.38, 0], [-0.3, 1.25, 0.15], [-0.32, 1.5, 0.4]); arm([0.21, 1.38, 0], [0.38, 1.22, 0.1], [0.3, 1.4, 0.3]);
      g.tint(0).blob(-0.12, 1.45, 0.16, [0.1, 0.05, 0.19], 0, '#8a4a26', { shadeBottom: 0.7 }).box(-0.33, 1.47, 0.32, -0.29, 1.51, 0.42, '#2a1f1a').tube([[0.3, 1.4, 0.3], [-0.25, 1.62, 0.1]], 0.006, 3, '#d9c9a0');
    } else if (pose === 'drum') {
      arm([-0.21, 1.38, 0], [-0.3, 1.18, 0.14], [-0.22, 1.3, 0.34]); arm([0.21, 1.38, 0], [0.3, 1.16, 0.16], [0.18, 1.18, 0.4]);
      g.tint(0).cyl(-0.05, 1.18, 0.36, 0.26, 0.26, 0.06, 12, '#e6d6b4', { smooth: true, base: true, top: '#efe3c6' });
    }
    head(1.62, 0.02);
  }
  return g.build();
}

// A crowd of one kind drawn as one instanced mesh whose copies the world moves itself. items: { p, yaw, color, scale }.
// put(i, x, y, z, yaw, lean, scale) writes copy i: yaw about up, then lean forward about its own x.
function herd(group, geo, mat, items, frame) {
  const n = items.length, m = new InstancedMesh(geo, mat, Math.max(1, n));
  m.count = n;
  m.instanceMatrix.setUsage(DynamicDrawUsage);
  const e = m.instanceMatrix.array, c = new Color(), pts = [];
  const put = (i, x, y, z, yaw, lean = 0, s = 1) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(lean), sp = Math.sin(lean), o = i * 16;
    e[o] = cy * s; e[o + 1] = 0; e[o + 2] = -sy * s; e[o + 3] = 0;
    e[o + 4] = sy * sp * s; e[o + 5] = cp * s; e[o + 6] = cy * sp * s; e[o + 7] = 0;
    e[o + 8] = sy * cp * s; e[o + 9] = -sp * s; e[o + 10] = cy * cp * s; e[o + 11] = 0;
    e[o + 12] = x; e[o + 13] = y; e[o + 14] = z; e[o + 15] = 1;
  };
  items.forEach((it, i) => {
    put(i, it.p[0], it.p[1], it.p[2], it.yaw || 0, 0, it.scale || 1);
    const v = rgb(it.color || '#ffffff'); c.setRGB(v[0], v[1], v[2]); m.setColorAt(i, c);
    pts.push(frame.point(it.p[0], it.p[1], it.p[2]));
    if (it.path) for (const q of it.path) pts.push(frame.point(q[0], q[1], q[2]));
  });
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.boundingSphere = n ? new Sphere().setFromPoints(pts.length ? pts : [new Vector3()]) : new Sphere(new Vector3(), 1);
  m.boundingSphere.radius += 3;
  group.add(m);
  return { mesh: m, items, put, done() { m.instanceMatrix.needsUpdate = true; } };
}

// Where a walker on a polyline is after d metres: [x, z, heading, share of the way]
function along(path, lens, total, d) {
  d = ((d % total) + total) % total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const a = path[i], b = path[i + 1], t = lens[i] > 0 ? Math.min(1, d / lens[i]) : 0;
      return [a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t, Math.atan2(b[0] - a[0], b[2] - a[2])];
    }
    d -= lens[i];
  }
  return [path[0][0], path[0][2], 0];
}

// ---------------------------------------------------------------- the world
export const chervilHall = {
  id: 'chervil-hall',
  title: 'Four hundred at one table', drum: 'Chervil', row: 'Herb Row', kind: 'a hall drum', light: 0.0,
  line: 'My first Thursday at the Ring 2 hall: four hundred at one long table, climbing away from the pass until the far end is up among the lamps. Nine of my eleven volunteers are over seventy, and every one of them tasted the broth before I did.',
  tone: '#f0b880', source: 'eating-out.md (Marit Vell\'s Hall), wander-year.md (Day 365), open-drums.md (Kinds of open drum; Culture)',
  sound: { root: 50, scale: 'mixo', pad: 0.3, air: 0.12, hum: 0.15, crowd: 0.9, choir: 0.55, bells: 0.08, bright: 0.55 },
  *build(ctx) {
    const frame = makeFrame(40 * DEG, 625, deckRadius(14));          // Ring 2, deck 14: low, by the Keel's station ring
    const rng = makeRng('chervil-hall');
    // along the arcade with the people coming to supper; in at the hall's open front; down to a seat's height at the
    // head of the table; up just over the dishes and the length of it; past the band; out into the court and up
    const path = makePath([
      { t: 0, p: [-4.4, 1.75, -38] },
      { t: 5, p: [-4.4, 1.8, -24], look: [-4.6, 1.6, 0] },
      { t: 9.5, p: [-5.1, 1.95, -5.2], look: [6, 1.6, 2] },
      { t: 12.5, p: [-0.6, 1.95, -0.4], look: [40, 1.0, 0] },
      { t: 15.5, p: [5.0, 1.55, 0], look: [60, 0.5, 0] },
      { t: 19.5, p: [12.5, 2.42, 0], look: [50, -0.6, 0] },
      { t: 27, p: [51, 2.42, 0], look: [91, -0.7, -2.2], roll: 0.035 },
      { t: 35, p: [93, 2.42, 0], look: [133, -0.3, 1.8], roll: -0.035 },
      { t: 42, p: [130, 2.44, 0], look: [141, 1.2, -4.5] },
      { t: 45.5, p: [147.5, 2.5, 0], look: [175, 2.6, 0] },
      { t: 50.5, p: [162, 6.6, 0], look: [204, 11, 0] },
      { t: 56.5, p: [175, 10.0, 0] },
    ], { frame, entryRadius: 1.0, exitRadius: 3.2 });
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'chervil-hall', palette: CHERVIL, clock: 'flight',
      light: { level: 0.85, ambUp: '#5e4a4a', ambDown: '#3f3030' }, floor: { shine: 0.9, wear: 0.9 } });
    const pal = deck.pal, D = ctx.density || 1;
    yield 'chervil: path';

    // ---- the Ledger Arcade, along the axis by Station Ring 2: the Ledger and the Ring Counter on its anti side, the
    // hall's open front on its spin side
    const menu = ['Thursday', 'Ramen 1.77', 'Whatever the aunts made 0.5', 'Gin, after six 0.18', 'Free on guest-right'];
    const arcade = yield* street(deck, {
      axis: 'z', from: -120, to: 70, at: AX, y: 0, width: AW, rails: true, cloth: 0.85,
      lamps: { every: 5, kind: 'globe', power: 1.35, reach: 4.6 },
      plates: [{ at: -30, lines: ['The Ledger Arcade', 'Fourteen, Ring 2'] }],
      folk: { stand: 6, stroll: 4, walk: 0, kids: 0 },
      fronts: {
        spin: [
          { from: -HZ, to: HZ, kind: 'hall', id: 'hall', name: 'The Ring 2 Hall', bays: 1, ground: '#3d2a3f', ink: '#f1dcb0', font: 'serif' },
          { from: -11, to: -6.5, kind: 'wall', bench: false, notice: menu, noticeStyle: 'chalk' },
          { from: -17, to: -11, kind: 'shop', name: 'Lamps', goods: 'lamps', awning: false, lit: 1 },
          { from: -23, to: -17, kind: 'stair', sub: 'Up 15, down 13' },
          { from: -29, to: -23, kind: 'shop', name: 'Tea', goods: 'tea', awning: true, lit: 1 },
          { from: 6.5, to: 11, kind: 'wall', bench: false, notice: ['Wanderers on guest-right', 'The Ring 2 hall cooks for you', 'on Thursdays. Bring a spoon', 'of starter from the last', 'drum you slept in.'] },
        ],
        anti: [
          { from: -28, to: -14, kind: 'custom', id: 'ledger', draw: (P, b, run, H) => ledgerBoard(deck, P, b, run, H) },
          { from: -36, to: -29.5, kind: 'stall', name: 'Ring Counter', goods: 'pots', sub: ['Mill broth', 'and a rice ball'], lit: 1, awning: ['#8a4f6a', '#f1e2cf'] },
          { from: -6, to: 1, kind: 'shop', name: 'Bread', goods: 'bread', awning: true, lit: 1 },
        ],
      },
      fill: { mix: { shop: 2, home: 1.5, wall: 0.3, stall: 0.4 }, numbers: 20, lit: 0.9 },
    });
    // a car going our way to be overtaken; one coming back
    trolley(deck, { axis: 'z', from: -120, to: 70, at: AX, y: 0, speed: 1.4, cars: [-31, 12, -100], color: '#8a4f6a', riders: 0.75, rng });
    trolley(deck, { axis: 'z', from: -120, to: 70, at: AX, y: 0, speed: 1.4, dir: -1, cars: [40], color: '#3d6f73', riders: 0.6, rng });
    for (const [x, dir, n] of [[-9.3, 1, 30], [-10.2, -1, 22]]) deck.walkersAlong({ from: [x, 0, dir > 0 ? -120 : 70], to: [x, 0, dir > 0 ? 70 : -120], n: Math.round(n * D), spread: 0.3, rng });
    yield 'chervil: arcade';

    // ---- the hall: one room the length of the table, its lamps in two rows either side of it
    const room = yield* hall(deck, {
      x0: HX0, x1: HX1, z0: -HZ, z1: HZ, y: 0, open: { anti: true, spin: [[-HZ, HZ]] },
      wall: '#dcc3b0', dado: '#6e4a56', floor: '#8c7a6c', shine: 0.85,
      lamps: { spacing: [4, 6.6], kind: 'globe', power: 0.8, reach: 3.6 },
    });
    yield 'chervil: hall';

    // ---- Aunts' Court, the block's atrium, six decks high, at the hall's far end
    const court = yield* atrium(deck, {
      x0: CX0, x1: CX1, z0: -CZ, z1: CZ, y: 0, storeys: 6, step: 2, depth: 6,
      mouths: [{ side: 'anti', storey: 0, at: 0, width: 2 * HZ }],
      light: { power: 0.6, color: '#ffe0bc', terraces: 0.35, terraceColor: '#f0d8c0', walks: 0.3, gloss: 0.3 },
      ceiling: { emit: 0.6, color: '#ffd4a4' },
      fill: { mix: { flat: 1 }, bay: [5.2, 6.6], lit: 0.85, numbers: 101 },
      folk: { rail: 1.5, stroll: 2, floor: 2.2 }, floor: { bands: 8 }, planting: 0.75,
    });
    yield 'chervil: court';

    // ---- the table: 124 m of it in trestled lengths, a runner down the middle, a bench along each side
    deck.proto('ramen', (g) => {
      g.cyl(0, 0, 0, 0.055, 0.105, 0.075, 8, '#ebe3d4', { top: '#c08a4e', smooth: false });
      g.blob(0.035, 0.078, 0.02, [0.03, 0.014, 0.024], 0, '#f4ecd8', { shadeBottom: 1 }).blob(0.035, 0.084, 0.02, [0.013, 0.008, 0.012], 0, '#e9a630', { shadeBottom: 1 });
      g.blob(-0.035, 0.078, -0.025, [0.03, 0.01, 0.026], 0, '#7fa24f', { shadeBottom: 1 }).box(-0.07, 0.078, 0.05, 0.12, 0.084, 0.058, '#5a3a2a').box(-0.07, 0.078, 0.066, 0.12, 0.084, 0.074, '#5a3a2a');
    });
    deck.proto('loaf', (g) => { g.box(-0.2, 0, -0.13, 0.2, 0.025, 0.13, '#8a6a4a'); g.tint(0.3).blob(-0.04, 0.07, 0, [0.15, 0.065, 0.09], 0, '#b9783a', { shadeBottom: 0.7, seed: 4 }).blob(0.13, 0.06, 0.01, [0.045, 0.05, 0.08], 0, '#e6cfa0', { shadeBottom: 0.8 }).tint(0); });
    deck.proto('jug', (g) => { g.tint(0.5).lathe(0, 0, 0, [[0.05, 0], [0.065, 0.06], [0.055, 0.16], [0.04, 0.2], [0.045, 0.22]], 8, '#d9d4c4').tint(0); });
    deck.proto('cup', (g) => { g.cyl(0, 0, 0, 0.028, 0.033, 0.08, 6, '#e8e0cc', { smooth: false, top: '#d8c8a0' }); });
    {
      const n = 50, seg = (TX1 - TX0) / n, wood = '#9a7452', top = '#c9a47c', run = new Run(0, 0, 0, 0);
      for (let i = 0; i < n; i++) {
        const a = TX0 + i * seg, b = a + seg, P = deck.pen(run, (a + b) / 2, 'table'), g = P.g;
        const tc = shade(top, rng.f(0.92, 1.06));
        g.box(a + 0.004, 0.71, -TW, b - 0.004, 0.755, TW, tc, { skip: 'b', sides: shade(tc, 0.8) });
        g.box(a, 0.62, -TW + 0.08, b, 0.71, -TW + 0.11, wood, { skip: 'tb' }).box(a, 0.62, TW - 0.11, b, 0.71, TW - 0.08, wood, { skip: 'tb' });
        for (const x of [a + 0.25, b - 0.25]) g.box(x - 0.05, 0, -TW + 0.15, x + 0.05, 0.62, TW - 0.15, wood, { skip: 'tb' });
        g.box(a + 0.25, 0.22, -0.04, b - 0.25, 0.3, 0.04, wood, { skip: 'n' });
        // the runner: rose, with the stripe where it was let out and joined
        g.box(a, 0.755, -0.32, b, 0.759, 0.32, i % 7 === 3 ? '#9a5a72' : '#8a4f6a', { skip: 'b' }).box(a, 0.759, -0.26, b, 0.761, -0.22, '#e3c9a8', { skip: 'b' }).box(a, 0.759, 0.22, b, 0.761, 0.26, '#e3c9a8', { skip: 'b' });
        for (const sd of [-1, 1]) {
          const z = sd * BZ, bc = shade('#a8825e', rng.f(0.9, 1.08));
          g.box(a + 0.01, 0.42, z - 0.17, b - 0.01, 0.46, z + 0.17, bc, { skip: 'b' });
          for (const x of [a + 0.3, b - 0.3]) g.box(x - 0.035, 0, z - 0.14, x + 0.035, 0.42, z + 0.14, wood, { skip: 'tb' });
        }
        P.done();
      }
      // down the middle: dishes under their lids, pans, loaves, jugs; at every place a bowl of the Thursday ramen and a cup
      for (let x = TX0 + 0.5; x < TX1 - 0.3; x += rng.f(0.75, 1.05)) {
        const r = rng(), z = rng.f(-0.16, 0.16);
        if (r < 0.5) deck.put('dish', { p: [x, 0.761, z], yaw: rng() * 6.28, scale: rng.f(1.0, 1.35), color: mixc('#c9c8c2', '#b9a27a', rng() * 0.5) });
        else if (r < 0.7) deck.put('pan', { p: [x, 0.761, z], yaw: rng() * 6.28, scale: rng.f(0.45, 0.58), color: '#c9c8c2' });
        else if (r < 0.85) deck.put('loaf', { p: [x, 0.761, z], yaw: rng.f(-0.4, 0.4), scale: rng.f(0.9, 1.15) });
        else deck.put('jug', { p: [x, 0.761, z], yaw: rng() * 6.28, color: rng.pick(['#d9d4c4', '#8fb0b0', '#c98a6a']) });
      }
      for (let i = 0; i < SEATS; i++) for (const sd of [-1, 1]) {
        const x = TX0 + (i + 0.5) * PITCH;
        deck.put('ramen', { p: [x + rng.f(-0.05, 0.05), 0.758, sd * (TW - 0.33)], yaw: rng() * 6.28, scale: rng.f(0.95, 1.08) });
        if (rng() < 0.6) deck.put('cup', { p: [x + 0.2, 0.758, sd * (TW - 0.14)], yaw: 0 });
      }
    }
    yield 'chervil: table';

    // ---- four hundred people, every seat taken: strangers next to each other, a child here and there, the old
    const scene = new Scene();
    const folkMat = litMaterial(deck.rig, { bend: frame, soft: 0.45 });
    const kinds = [];
    for (let k = 0; k < 10; k++) {
      const old = k >= 7, skin = SKIN[(k * 5 + 1) % SKIN.length], hair = old ? HAIR[5 + (k % 3)] : HAIR[k % 5];
      kinds.push({ skin, hair, old, sit: personGeo(skin, hair, 'sit', { bald: k === 9, long: k % 3 === 1, legs: k % 2 ? '#3a3540' : '#4a3f38' }) });
    }
    const diners = [];
    for (let i = 0; i < SEATS; i++) for (const sd of [-1, 1]) {
      const kind = Math.floor(rng() * kinds.length), child = !kinds[kind].old && rng() < 0.11;
      diners.push({ idx: i * 2 + (sd < 0 ? 0 : 1), kind, sd, x: TX0 + (i + 0.5) * PITCH + rng.f(-0.06, 0.06), z: sd * (BZ + 0.05), yaw0: sd < 0 ? 0 : Math.PI, s: child ? 0.74 : rng.f(0.94, 1.06),
        color: rng.pick(WEAR), ph: rng() * 6.28, w: rng.f(0.25, 0.6), turn: rng.sign() * rng.f(0.3, 0.6), ph2: rng() * 6.28, w2: rng.f(0.3, 0.8), talk: rng.f(0.4, 1) });
    }
    const dinerHerds = kinds.map((k, ki) => {
      const list = diners.filter((d) => d.kind === ki);
      const h = herd(scene, k.sit, folkMat, list.map((d) => ({ p: [d.x, 0.46, d.z], yaw: d.yaw0, color: d.color, scale: d.s })), frame);
      h.list = list;
      return h;
    });
    yield 'chervil: diners';

    // ---- the room round the table: its painted ceiling and the table's lamps, the pass, the walls, the band, the gin
    paintCeiling(deck);
    const staff = thePass(deck, rng);
    theWalls(deck, rng);
    const band = theDais(deck);
    {
      // gin, after six, in the halls only (open-drums.md, Chervil): a counter by the door, and people at it
      const P = deck.pen(new Run(0, 0, 0, 0), 2, 'pass'), g = P.g;
      g.box(-1.6, 0, HZ - 1.25, 4.6, 1.05, HZ - 0.7, '#5a3a3f', { top: '#d8c8b0', skip: 'b' });
      g.box(-1.6, 1.3, HZ - 0.3, 4.6, 1.34, HZ, '#4a2f36').box(-1.6, 1.78, HZ - 0.3, 4.6, 1.82, HZ, '#4a2f36');
      for (const y of [1.34, 1.82]) for (let x = -1.4; x < 4.4; x += 0.2) { const c = rng.pick(['#8fb8b0', '#b9d0c8', '#d9c48a', '#7a9a8a']); g.cyl(x, y, HZ - 0.15, 0.04, 0.04, 0.2, 6, c, { emit: 0.5, smooth: false, cap: false }).cyl(x, y + 0.2, HZ - 0.15, 0.04, 0.015, 0.06, 6, c, { emit: 0.5 }); }
      P.done();
      deck.sign(['Chervil gin', 'after six'], { at: [1.5, 2.3, HZ - 0.02], n: [0, -1], w: 1.8, h: 0.5, style: 'board', font: 'italic', font2: 'cond', ground: '#3d2a3f', ink: '#f1dcb0' });
      deck.glow([{ p: [1.5, 1.6, HZ - 0.8], color: '#ffd29a', power: 0.5 * deck.glowK, size: 2.5 }]);
      for (const [x, z, yaw] of [[-0.6, 4.55, Math.PI + 0.3], [0.2, 4.4, 2.2], [1.9, 4.6, Math.PI], [3.1, 4.35, -2.5], [3.9, 4.6, Math.PI - 0.2]]) staff.push({ p: [x, 0, z], yaw, pose: 'stand', color: rng.pick(WEAR), old: rng() < 0.4 });
    }
    yield 'chervil: the room';

    // ---- everyone else, each kind one mesh moved by hand: the cook and volunteers, people coming in, the band, the choir
    const mobs = [];
    const mob = (geo, list) => { if (!list.length) return; mobs.push({ h: herd(scene, geo, folkMat, list.map((m) => ({ p: m.p || [0, 0, 0], yaw: m.yaw || 0, color: m.color, scale: m.s || 1, path: m.path })), frame), list }); };
    const young = [0, 1, 2].map((k) => personGeo(SKIN[(k * 2 + 1) % 6], HAIR[k * 2 % 5], 'stand', { long: k === 1 }));
    const elder = [0, 1, 2].map((k) => personGeo(SKIN[(k * 3) % 6], HAIR[5 + k], 'stand', { bald: k === 2 }));
    const carry = [personGeo(SKIN[0], HAIR[5], 'carry'), personGeo(SKIN[3], HAIR[6], 'carry'), personGeo(SKIN[1], HAIR[1], 'carry', { long: true })];
    const sing = [0, 1, 2, 3].map((k) => personGeo(SKIN[(k * 2 + 2) % 6], k === 3 ? HAIR[5] : HAIR[(k * 2 + 1) % 5], 'sing', { long: k % 2 === 1 }));
    const sway = (amp, rate) => (m) => { m.ph = rng() * 6.28; m.amp = amp; m.rate = rate * rng.f(0.85, 1.15); return m; };
    // standing: at the pass and the gin counter
    // and along the walls: aunts at the sideboards, people up from the table talking, a child or two looking for a parent
    for (let x = 14; x < TX1 - 4; x += rng.f(3.5, 7)) {
      const sd = rng.sign(), z = sd * (HZ - rng.f(1.0, 1.5)), n = rng() < 0.4 ? 2 : 1;
      for (let i = 0; i < n; i++) staff.push({ p: [x + i * 0.6, 0, z - sd * i * 0.3], yaw: (sd < 0 ? 0 : Math.PI) + rng.f(-1.2, 1.2), color: rng.pick(WEAR), old: rng() < 0.45, s: rng() < 0.12 ? 0.72 : rng.f(0.95, 1.05) });
    }
    const stands = staff.map(sway(0.12, 0.5));
    for (let k = 0; k < 3; k++) { mob(young[k], stands.filter((m, i) => !m.old && i % 3 === k)); mob(elder[k], stands.filter((m, i) => m.old && i % 3 === k)); }
    // walking: people coming in from the arcade for supper, and the volunteers out and back along the aisles with trays
    const walkers = [];
    const arrive = [[-9.6, 0, -70], [-9.6, 0, 0.5], [-3, 0, 2.8], [7, 0, 3.6], [128, 0, 3.8]];
    for (let i = 0, n = Math.round(26 * D); i < n; i++) walkers.push({ path: arrive, loop: true, off: (i / n) * 205 + rng.f(-2, 2), speed: rng.f(1.05, 1.35), side: rng.f(-0.35, 0.35), s: rng() < 0.15 ? 0.72 : rng.f(0.95, 1.05), color: rng.pick(WEAR), old: rng() < 0.3, kind: Math.floor(rng() * 3) });
    for (let i = 0; i < 9; i++) {
      const sd = i % 2 ? 1 : -1, z = sd * 2.45, x1 = 18 + (i * 37) % 112;
      walkers.push({ path: [[2.5, 0, -3.4], [7, 0, z], [x1, 0, z]], loop: false, off: rng() * 400, speed: rng.f(0.85, 1.1), side: 0, s: 1, color: rng.pick(['#8a4f6a', '#3d6f73', '#c7a36a', '#5d4a7a', '#e3925f']), carry: true, kind: i % 3 });
    }
    for (const w of walkers) { w.lens = []; for (let j = 0; j < w.path.length - 1; j++) w.lens.push(Math.hypot(w.path[j + 1][0] - w.path[j][0], w.path[j + 1][2] - w.path[j][2])); w.total = w.lens.reduce((a, b) => a + b, 0); w.ph = rng() * 6.28; }
    for (let k = 0; k < 3; k++) {
      mob(young[k], walkers.filter((w) => !w.carry && !w.old && w.kind === k));
      mob(elder[k], walkers.filter((w) => !w.carry && w.old && w.kind === k));
      mob(carry[k], walkers.filter((w) => w.carry && w.kind === k));
    }
    // the band, swaying in time
    for (const m of band) mob(personGeo(m.pose === 'cello' ? SKIN[2] : SKIN[(band.indexOf(m) * 2) % 6], HAIR[band.indexOf(m) % 5], m.pose), [Object.assign(m, { ph: band.indexOf(m) * 0.7, amp: 0.1, rate: 2.6, bob: 0.025 })]);
    // the block's choir on the court's terraces, each with a hand lamp
    const choir = [];
    for (const k of [1, 2]) {
      const y = 4 * k, r = 2 * k + 0.8;
      for (let x = CX0 + 6; x < CX1 - 6; x += 0.66) { choir.push({ p: [x + rng.f(-0.1, 0.1), y, -CZ - r], yaw: rng.f(-0.15, 0.15) }); choir.push({ p: [x + rng.f(-0.1, 0.1), y, CZ + r], yaw: Math.PI + rng.f(-0.15, 0.15) }); }
    }
    for (const k of [1, 2, 3]) for (let z = -17; z < 17; z += 0.66) choir.push({ p: [CX1 + 2 * k + 0.8, 4 * k, z + rng.f(-0.1, 0.1)], yaw: -Math.PI / 2 + rng.f(-0.15, 0.15) });
    choir.forEach((m) => {
      m.color = rng.pick(['#3d2a3f', '#8a4f6a', '#efe6d6', '#5d4a7a', '#3d6f73', '#e3925f']); m.ph = m.p[0] * 0.08 + m.p[2] * 0.05; m.amp = 0.07; m.rate = 1.1; m.kind = Math.floor(rng() * 4);
      const c = Math.cos(m.yaw), s = Math.sin(m.yaw);
      deck.glow([{ p: [m.p[0] + 0.12 * c + 0.32 * s, m.p[1] + 1.49, m.p[2] - 0.12 * s + 0.32 * c], color: '#ffd29a', power: 1.4 * deck.glowK, size: 0.4, twinkle: 0.12, phase: rng() }]);
    });
    for (let k = 0; k < 4; k++) mob(sing[k], choir.filter((m) => m.kind === k));
    // the court's floor full of people listening, turned toward the singers; strings of small lamps across the court
    {
      const spots = [];
      for (let i = 0, n = Math.round(380 * D); i < n; i++) {
        const x = CX0 + 4 + (CX1 - CX0 - 6) * Math.sqrt(rng()), z = rng.f(-CZ + 2, CZ - 2);
        if (!deck.clear(x, 1.3, z, 2.2)) continue;
        spots.push({ p: [x, 0, z], yaw: Math.atan2(CX1 + 4 - x, -z * 0.6) + rng.f(-0.5, 0.5), child: rng() < 0.14, color: rng.pick(WEAR) });
      }
      deck.people(spots);
      for (const x of [157, 186, 194]) {
        const top = 4 + 1.0, sag = x < 160 ? 2.2 : 3;
        for (let z = -CZ - 1.5; z <= CZ + 1.5; z += 0.9) {
          const u = z / (CZ + 1.5);
          deck.glow([{ p: [x + Math.sin(z * 0.7) * 0.05, top + 3.2 - sag * (1 - u * u), z], color: rng() < 0.2 ? '#ffb27a' : '#ffe0a8', power: 1.3 * deck.glowK, size: 0.32, twinkle: 0.08 }]);
        }
      }
    }
    yield 'chervil: people';

    // ---- dishes going down the table hand to hand, lids lifted on the aunts' dishes, steam off everything
    const lidGeo = (() => { const g = new Geo(); g.lathe(0, 0, 0, [[0.16, 0], [0.155, 0.03], [0.12, 0.075], [0.06, 0.1], [0.0, 0.105]], 10, '#b9b8b2'); g.cyl(0, 0.1, 0, 0.022, 0.022, 0.035, 5, '#6f6a60', { smooth: false }); return g.build(); })();
    const potGeo = (() => { const g = new Geo(); g.cyl(0, 0, 0, 0.2, 0.2, 0.015, 10, '#e9e4d8', { smooth: false }); g.cyl(0, 0.015, 0, 0.13, 0.16, 0.1, 10, '#a9aaa6', { top: '#b9783a' }); return g.build(); })();
    const passed = [], lids = [];
    for (let i = 0; i < 14; i++) passed.push({ sd: i % 2 ? 1 : -1, x0: TX0 + 4 + i * 9.1 + rng.f(-2, 2), dir: i % 3 ? 1 : -1, hop: rng.f(0.75, 0.95), ph: rng() });
    const dishH = herd(scene, potGeo, deck.prop, passed.map((d) => ({ p: [d.x0, 0.76, d.sd * 0.36], color: '#ffffff' })), frame);
    const dishLid = herd(scene, lidGeo, deck.prop, passed.map((d) => ({ p: [d.x0, 0.875, d.sd * 0.36], color: '#ffffff' })), frame);
    for (let x = TX0 + 2.2; x < TX1 - 1; x += rng.f(2.6, 4.2)) {
      const z = rng.f(-0.14, 0.14), sd = rng.sign();
      lids.push({ x, z, sd, P: rng.f(6, 11), ph: rng(), yaw: rng() * 6.28 });
      deck.glow([0, 1, 2, 3].map(() => ({ p: [x + rng.f(-0.06, 0.06), 0.9, z + rng.f(-0.06, 0.06)], color: '#fff6ec', power: rng.f(0.1, 0.16), size: rng.f(0.35, 0.6), move: [rng.f(-0.02, 0.02), rng.f(0.2, 0.3), rng.f(-0.02, 0.02)], loop: rng.f(2.6, 3.6), phase: rng() })));
    }
    const potH = herd(scene, potGeo, deck.prop, lids.map((l) => ({ p: [l.x, 0.761, l.z], yaw: l.yaw })), frame);
    const lidH = herd(scene, lidGeo, deck.prop, lids.map((l) => ({ p: [l.x, 0.876, l.z], yaw: l.yaw })), frame);
    potH.done();
    for (let i = 0; i < SEATS; i += 1) for (const sd of [-1, 1]) {
      if (rng() < 0.45) continue;
      const x = TX0 + (i + 0.5) * PITCH;
      deck.glow([{ p: [x, 0.84, sd * (TW - 0.33)], color: '#fff6ec', power: rng.f(0.07, 0.11), size: rng.f(0.24, 0.36), move: [rng.f(-0.02, 0.02), rng.f(0.12, 0.2), -sd * rng.f(0.0, 0.03)], loop: rng.f(2.5, 4), phase: rng() }]);
    }
    yield 'chervil: dishes';

    yield* finish(deck);
    scene.add(deck.group);

    // the movement of the room: people talking to their neighbours, leaning in, turning to a dish as it passes
    const look = { exposure: 1.4, bloom: 0.26, threshold: 0.95, saturation: 1.06, vignette: 0.5, contrast: 1.06 };
    const reach = new Float32Array(SEATS * 2), toward = new Float32Array(SEATS * 2);
    const update = (t) => {
      deck.tick(t);
      reach.fill(0); toward.fill(0);
      // a dish is passed one place at a time: lifted, carried across, set down
      passed.forEach((d, i) => {
        const span = TX1 - TX0 - 2, u = d.ph * span / PITCH + t / d.hop, k = Math.floor(u), f = u - k, e = smoothstep(0.2, 0.8, f);
        let s = ((k + e) * PITCH) % span; if (s < 0) s += span;
        const x = d.dir > 0 ? TX0 + 1 + s : TX1 - 1 - s, lift = Math.sin(Math.PI * e) * 0.1, fade = smoothstep(0, 1.2, s) * smoothstep(span, span - 1.2, s);
        dishH.put(i, x, 0.76 + lift, d.sd * (0.36 + 0.05 * Math.sin(Math.PI * e)), d.dir * 0.3 * e, 0, fade);
        dishLid.put(i, x, 0.875 + lift, d.sd * (0.36 + 0.05 * Math.sin(Math.PI * e)), d.dir * 0.3 * e, 0, fade);
        const j = Math.floor((x - TX0) / PITCH);
        for (let q = j - 1; q <= j + 1; q++) {
          if (q < 0 || q >= SEATS) continue;
          const sx = TX0 + (q + 0.5) * PITCH, w = clamp(1 - Math.abs(sx - x) / 0.95, 0, 1), id = q * 2 + (d.sd < 0 ? 0 : 1);
          if (w > reach[id]) { reach[id] = w; toward[id] = Math.sign(x - sx); }
        }
      });
      dishH.done(); dishLid.done();
      // lids come up, are held a moment for the steam and the smell, and go back
      lids.forEach((l, i) => {
        const c = ((t / l.P + l.ph) % 1 + 1) % 1, o = smoothstep(0.0, 0.12, c) * (1 - smoothstep(0.5, 0.62, c));
        lidH.put(i, l.x, 0.876 + 0.24 * o, l.z + l.sd * 0.16 * o, l.yaw, l.sd * 0.85 * o, 1);
      });
      lidH.done();
      for (const h of dinerHerds) {
        h.list.forEach((d, i) => {
          const id = d.idx, r = reach[id];
          const s = Math.sin(t * d.w + d.ph), turn = d.talk * d.turn * smoothstep(0.2, 0.8, Math.abs(s)) * Math.sign(s) * (1 - r);
          const lean = (0.05 + 0.13 * smoothstep(0.3, 1, Math.sin(t * d.w2 + d.ph2))) * (1 - r) + 0.32 * r;
          // turning toward a dish on its way: which way it comes from depends on the side they sit
          h.put(i, d.x, 0.46, d.z, d.yaw0 + turn + r * toward[id] * 0.55 * (d.sd < 0 ? 1 : -1), lean, d.s);
        });
        h.done();
      }
      for (const { h, list } of mobs) {
        list.forEach((m, i) => {
          if (m.path) {
            const dd = m.off + m.speed * t;
            let x, z, hd, sc = m.s;
            if (m.loop) { const q = ((dd % m.total) + m.total) % m.total; [x, z, hd] = along(m.path, m.lens, m.total, q); sc *= smoothstep(0, 2.5, q) * smoothstep(m.total, m.total - 2.5, q); }
            else {
              // out along the aisle and back again, stopping a moment at each end
              const per = 2 * m.total + 6, q = ((dd % per) + per) % per;
              if (q < m.total) [x, z, hd] = along(m.path, m.lens, m.total, q);
              else if (q < m.total + 3) { [x, z, hd] = along(m.path, m.lens, m.total, m.total - 0.01); hd += Math.PI * smoothstep(m.total, m.total + 2, q); }
              else if (q < 2 * m.total + 3) { [x, z, hd] = along(m.path, m.lens, m.total, 2 * m.total + 3 - q); hd += Math.PI; }
              else { [x, z, hd] = along(m.path, m.lens, m.total, 0.01); hd += Math.PI * (1 - smoothstep(2 * m.total + 3, 2 * m.total + 5, q)); }
            }
            const nx = Math.cos(hd), nz = -Math.sin(hd);
            h.put(i, x + nx * m.side, 0.035 * Math.abs(Math.sin(t * 5.4 + m.ph)), z + nz * m.side, hd, 0.04, sc);
          } else {
            const sw = Math.sin(t * m.rate + m.ph);
            h.put(i, m.p[0], m.p[1] + (m.bob || 0) * Math.abs(sw), m.p[2], m.yaw + m.amp * sw, (m.bob ? 0.06 : 0.02) * Math.sin(t * m.rate * 0.5 + m.ph), m.s || 1);
          }
        });
        h.done();
      }
    };
    update(0);
    return { scene, path, deck, near: 0.12, far: 900, look, update };
  },
};

// The Ledger at Station Ring 2 (open-drums.md, Chervil): shares, people, the Margin, guests that night, and the names,
// each newborn beside the dead whose share they carry. Drawn in the row's own co-ordinates: u along, v into the wall.
function ledgerBoard(deck, P, b, run, H) {
  const g = P.g, u0 = b.u0, u1 = b.u1, mid = (u0 + u1) / 2, k = deck.glowK, brass = deck.pal.brass;
  const wall = (a, c, y0, y1, v, col, e = 0) => g.quad([c, y0, v], [a, y0, v], [a, y1, v], [c, y1, v], col, e);
  wall(u0, u1, 0, H, 0, '#d4bba6'); g.box(u0, 0, -0.022, u1, 0.9, 0, '#5f4350', { skip: 'bs' });
  const a = u0 + 1.0, c = u1 - 1.0, y0 = 0.62, y1 = 2.78;
  g.box(a - 0.08, y0 - 0.08, -0.1, c + 0.08, y1 + 0.08, 0, brass, { skip: 's' });
  g.box(a, y0, -0.12, c, y1, -0.1, '#17110f', { skip: 's' });
  // the names: pairs of lines in two columns either side of the figures, small and close, read from near
  const ink = '#ffd9a0', dim = '#c99a6a';
  for (const [c0, c1] of [[a + 0.25, a + 4.1], [c - 4.1, c - 0.25]]) {
    for (let r = 0; r < 13; r++) {
      const y = y0 + 0.22 + r * 0.115, l = (c1 - c0) * 0.42;
      const w1 = l * (0.55 + 0.4 * ((r * 7 + c0 * 3) % 5) / 5), w2 = l * (0.5 + 0.45 * ((r * 3 + c1) % 7) / 7);
      wall(c0, c0 + w1, y, y + 0.05, -0.122, dim, 1.4 * k);
      wall(c0 + l + 0.3, c0 + l + 0.3 + w2, y, y + 0.05, -0.122, dim, 1.1 * k);
    }
  }
  deck.sign(['The Ledger', 'Station Ring 2'], { run, at: run.pt(mid, y1 - 0.38, -0.125), w: 3.4, h: 0.62, style: 'glow', font: 'serif', font2: 'cond', ink, glow: 1.3 });
  const figs = [['Shares', '200,000,000'], ['People', '194,052,000'], ['Margin', '5,948,000'], ['Guests tonight', '409,600']];
  figs.forEach((f, i) => deck.sign(f, { run, at: run.pt(mid, y1 - 0.95 - i * 0.36, -0.125), w: 2.6, h: 0.32, style: 'glow', font: 'cond', font2: 'cond', head: false, ink, glow: 1.1 }));
  deck.glow([{ p: run.pt(mid, 1.7, -0.9), color: '#ffcf96', power: 0.5 * k, size: 4.5 }]);
  for (const x of [a + 1.2, c - 1.2, mid]) { const p = run.pt(x, 0, -1.5); deck.knot(p[0], p[1], p[2], 3); }
}

// The hall's ceiling, painted by the block as a Hollow sky at dawn in Oona's colours: the brown-violet of the River at
// the door, through rose and apricot to cream over the band, and a painted sunline down the middle with the table's
// table's light coming from it, as one lattice of lamps hidden in the beams.
function paintCeiling(deck) {
  const run = new Run(0, 0, 0, 0), k = deck.glowK, stops = ['#4a3248', '#8a4f6a', '#d9845a', '#f3c48a', '#ffe9c6'];
  const colAt = (t) => { const s = clamp(t, 0, 1) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(s)); return mixc(stops[i], stops[i + 1], s - i); };
  const lamps = [];
  for (let x = HX0; x < HX1 - 0.01; x += 2) {
    const x1 = Math.min(HX1, x + 2), P = deck.pen(run, (x + x1) / 2, 'sky'), g = P.g, c = colAt((x + 1 - HX0) / (HX1 - HX0 - 10));
    for (const [z0, z1, s] of [[-HZ, -3.6, 0.62], [-3.6, -1.6, 0.8], [-1.6, -0.5, 0.95], [-0.5, 0.5, 1.08], [0.5, 1.6, 0.95], [1.6, 3.6, 0.8], [3.6, HZ, 0.62]]) {
      g.floor(x, z0, x1, z1, 2.984, shade(c, s), { down: true, emit: 0.5 * k });
    }
    g.floor(x, -0.04, x1, 0.04, 2.978, '#fff1d6', { down: true, emit: 1.1 * k });
    P.done();
  }
  for (let x = HX0 + 6; x < HX1 - 2; x += 4) {
    lamps.push(x);
  }
  deck.lattice({ origin: [lamps[0], 2.9, 0], spacing: [4, 1], count: [lamps.length, 1], power: 1.05, reach: 3.3, color: '#ffd9a6', drop: 3.9 });
}

// The pass by the door: a back counter of stockpots on the warm loop, shelves of bowls, the pass itself under its heat
// lamps with the next bowls waiting, and a slate. Returns where the cook and the volunteers at it stand.
function thePass(deck, rng) {
  const run = new Run(0, 0, 0, 0), k = deck.glowK, P = deck.pen(run, 2.5, 'pass'), g = P.g;
  const xa = -1.4, xb = 7.4, steel = '#b9b6aa', zb = -HZ, zp = -4.2;
  g.box(xa, 0, zb, xb, 0.9, zb + 0.66, '#7a6a5e', { top: steel, skip: 'b' });
  const pots = [];
  for (let x = xa + 0.7; x < xb - 0.5; x += 1.35) {
    g.box(x - 0.34, 0.9, zb + 0.06, x + 0.34, 0.93, zb + 0.6, '#2f2c2c', { skip: 'b' });
    g.cyl(x, 0.93, zb + 0.33, 0.25, 0.27, 0.48, 10, '#a9aaa6', { top: '#b27a42' });
    g.cyl(x, 1.41, zb + 0.33, 0.27, 0.27, 0.03, 10, '#8f908c', { cap: false });
    pots.push([x, 1.45, zb + 0.33]);
  }
  for (const y of [1.55, 2.02]) {
    g.box(xa, y, zb, 3.4, y + 0.035, zb + 0.32, '#6a4a3a');
    for (let x = xa + 0.25; x < 3.2; x += 0.34) { const n = 3 + Math.floor(rng() * 4); for (let i = 0; i < n; i++) g.cyl(x, y + 0.035 + i * 0.055, zb + 0.17, 0.06, 0.11, 0.055, 8, '#ebe3d4', { top: '#f3ede2', smooth: false }); }
  }
  deck.sign(['Thursday', 'Ramen', 'Whatever the aunts made', 'Gin, after six'], { at: [5.6, 1.95, zb + 0.02], n: [0, 1], w: 2.6, h: 1.25, style: 'chalk' });
  // the pass: a counter with the bowls going out, a shelf over it on posts with the warm lamps under
  g.box(xa, 0, zp - 0.55, xb, 1.0, zp, '#6e4a56', { skip: 'b' }).box(xa - 0.04, 1.0, zp - 0.6, xb + 0.04, 1.045, zp + 0.05, '#ddd5c6');
  for (const x of [xa + 0.05, 2.5, xb - 0.05]) g.box(x - 0.03, 1.045, zp - 0.3, x + 0.03, 1.86, zp - 0.24, '#4a4b4c', { skip: 'tb' });
  g.box(xa, 1.86, zp - 0.45, xb, 1.92, zp - 0.1, '#4a4b4c');
  g.floor(xa + 0.1, zp - 0.4, xb - 0.1, zp - 0.15, 1.855, '#ffb874', { down: true, emit: 4 * k });
  for (let x = xa + 0.3; x < xb - 0.2; x += 0.34) deck.put('ramen', { p: [x, 1.045, zp - 0.28 + rng.f(-0.06, 0.06)], yaw: rng() * 6.28 });
  for (let x = xa + 0.8; x < xb; x += 2.2) deck.glow([{ p: [x, 1.6, zp - 0.28], color: '#ffb070', power: 1.1 * k, size: 1.4 }]);
  P.done();
  // steam off the pots, and off the bowls waiting on the pass
  for (const p of pots) for (let i = 0; i < 10; i++) deck.glow([{ p: [p[0] + rng.f(-0.12, 0.12), p[1], p[2] + rng.f(-0.1, 0.1)], color: '#fff4e8', power: rng.f(0.08, 0.14), size: rng.f(0.5, 1.0), move: [rng.f(-0.03, 0.03), rng.f(0.22, 0.34), rng.f(0.02, 0.08)], loop: rng.f(3.5, 5.5), phase: rng() }]);
  for (let x = xa + 0.3; x < xb - 0.2; x += 0.68) deck.glow([{ p: [x, 1.12, zp - 0.28], color: '#fff4e8', power: 0.06, size: 0.35, move: [0, 0.16, 0.02], loop: 4, phase: rng() }]);
  // who works it: Marit at the pass, the volunteers either side of her and at the pots
  return [
    { p: [2.5, 0, zp - 0.95], yaw: 0, pose: 'stand', color: '#efe8dc', who: 'cook' },
    { p: [-0.6, 0, zp - 0.95], yaw: 0.2, pose: 'stand', color: '#8a4f6a', old: true },
    { p: [5.2, 0, zp - 0.95], yaw: -0.15, pose: 'stand', color: '#3d6f73', old: true },
    { p: [0.65, 0, zb + 1.0], yaw: Math.PI, pose: 'stand', color: '#c7a36a', old: true },
    { p: [4.7, 0, zb + 1.0], yaw: Math.PI + 0.3, pose: 'stand', color: '#5d4a7a', old: true },
  ];
}

// The far end: a low dais either side of the way out to the court, and tonight's band on it (live music every night
// somewhere in every block: open-drums.md). Returns the players.
function theDais(deck) {
  const run = new Run(0, 0, 0, 0), P = deck.pen(run, 138, 'dais'), g = P.g, x0 = TX1 + 2.2, x1 = x0 + 6.4;
  for (const sd of [-1, 1]) {
    const za = sd * 1.5, zb = sd * (HZ - 0.3);
    g.box(x0, 0, Math.min(za, zb), x1, 0.28, Math.max(za, zb), '#6e4a56', { top: '#8a6a58', skip: 'b' });
    g.box(x0 - 0.02, 0.28, Math.min(za, zb), x0 + 0.04, 0.3, Math.max(za, zb), '#c9a46a', { skip: 'b' });
  }
  g.box(x0 + 2.7, 0.28, 3.55, x0 + 3.1, 0.73, 3.95, '#5a3a2a', { skip: 'b' });
  P.done();
  deck.put('tub', { p: [x0 + 5.6, 0.28, -5.6], yaw: 0, scale: 1.3, color: '#7f9b63' });
  deck.put('tub', { p: [x0 + 5.6, 0.28, 5.6], yaw: 2, scale: 1.3, color: '#86a06a' });
  const w = -Math.PI / 2;
  return [
    { pose: 'flute', p: [x0 + 1.4, 0.28, -2.3], yaw: w + 0.35, color: '#3d2a3f' },
    { pose: 'flute', p: [x0 + 2.9, 0.28, -3.9], yaw: w + 0.25, color: '#e3925f' },
    { pose: 'drum', p: [x0 + 4.3, 0.28, -2.6], yaw: w + 0.1, color: '#5d7a62' },
    { pose: 'fiddle', p: [x0 + 1.4, 0.28, 2.4], yaw: w - 0.35, color: '#8a4f6a' },
    { pose: 'cello', p: [x0 + 2.9, 0.73, 3.75], yaw: w - 0.25, color: '#c7a36a' },
  ];
}

// Along both walls: sideboards with the aunts' dishes on them, and coats on pegs in runs, as people hung them coming in.
function theWalls(deck, rng) {
  deck.proto('coat', (g) => {
    g.box(-0.03, -0.02, -0.12, 0.03, 0.02, 0.0, '#3a2e28');
    g.tint(1).cyl(0, -0.95, -0.07, 0.15, 0.13, 0.93, 6, '#ffffff', { smooth: false, squash: [1, 0.45] }).box(-0.16, -0.12, -0.12, 0.16, -0.02, -0.02, '#f2f2f2').tint(0);
  });
  for (const sd of [-1, 1]) {
    const zw = sd * HZ, yaw = sd < 0 ? Math.PI : 0;
    for (let x = 12; x < TX1 - 4; x += rng.f(9, 14)) {
      deck.put('counter', { p: [x, 0, zw - sd * 0.32], yaw, scale: [1.4, 1, 1], color: '#8a6a58' });
      for (let i = 0; i < 4; i++) {
        const dx = -1.1 + i * 0.72 + rng.f(-0.1, 0.1), r = rng();
        deck.put(r < 0.45 ? 'dish' : r < 0.7 ? 'pan' : 'loaf', { p: [x + dx, 0.95, zw - sd * 0.32], yaw: rng() * 6.28, scale: r < 0.45 ? 1.2 : r < 0.7 ? 0.55 : 1, color: '#c9c8c2' });
      }
      deck.glow([{ p: [x, 1.4, zw - sd * 0.4], color: '#ffd9a6', power: 0.25 * deck.glowK, size: 2.2 }]);
      x += 3;
      for (let n = 3 + Math.floor(rng() * 7), i = 0; i < n; i++) deck.put('coat', { p: [x + i * 0.42, 1.92, zw - sd * 0.02], yaw: yaw + rng.f(-0.12, 0.12), scale: [rng.f(0.9, 1.15), rng.f(0.85, 1.1), 1], color: rng.pick(WEAR) });
    }
  }
}
