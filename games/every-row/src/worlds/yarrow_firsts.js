// Yarrow, Herb Row: the court of the School Quarter, at the end of Apprentice Street.
//
// Yarrow is "a maker drum further along Herb Row, with a craft-school quarter" (games/three-nights/src/15-canon.js,
// the Yarrow entry: neighbourhoods Lathe Yard and the School Quarter, Apprentice Street, the motto "Make it twice.",
// the palette "Workshop white", "a cool, clear ramp, good for seeing what you're making", and the custom "Apprentices
// sign the underside of the first thing they make that someone buys."). This page reads the motto so: an apprentice's
// first try at anything is hung on the wall of the school court, where everyone can see what is wrong with it. The
// second is the one they sell, and they sign it underneath. A new chair is 125 kWh of new mass (docs/daily-life.md),
// so a wall of first tries is a fortune kept on purpose. Making and mending are what people still pay a person for
// (docs/work.md, The tech level; docs/ashgrove.md, Dace's: "a cutting table, a sewing machine, a small fabricator, a
// lathe, and racks of offcuts"), and a flute is "tuned in the shop's own air" (docs/sorrel.md, Flute Row), a metre
// and more long, because a pipe in heliox wants nearly twice the length (sorrel.md, Swift Youth Hall: "heliox flutes
// 1.2 m long").
//
// The flight: along Apprentice Street on deck 58, no higher than a room, past the turners and the flute maker; out
// through its mouth at the foot of a wall of chairs and up it, close enough to read the tags; past the rolling tower
// whose hoist is taking somebody's first chair up to its peg; a slow turn from under the ceiling down the whole length
// of the court; across it at the height of the third terrace, over the lathes; down to the bench where a girl of about
// fifteen is signing the underside of her second chair with the buyer and half her school standing round; and out
// through a bentwood hoop in the far wall.
//
// The drum's turning, worked out (deck 58 is 2,772 m from the axis: 0.92 g, and the floor itself goes round at
// V = 0.0572 x 2,772 = 158.6 m/s):
//   - A thing let go h metres up keeps the speed of the place it left, which is less than the floor's, and the floor
//     gets ahead of it: it lands antispinward by R (tan f - f), where cos f = (R - h) / R; near enough (2h)^1.5 / (3 sqrt R).
//     From the tower's platforms at 4, 8, 12, 16 and 20 m that is 0.14, 0.41, 0.74, 1.15 and 1.60 m, and from the
//     jib at 23.4 m it is 2.03 m. So the tower's catch net is on its antispinward side only, and is that long.
//   - A load going up at v is pushed spinward at 2 x 0.0572 x v. At the hoist's 0.6 m/s that is 0.069 m/s2 against
//     9.07: the rope leans spinward by 2v / V = 0.0076 radians while it hauls, sixteen centimetres at the foot of
//     twenty-one metres of rope, and hangs true again when it stops. Both are drawn as worked.
//
// Not canon (the docs give Yarrow its quarter, its street, its motto and the custom of signing, and nothing else):
//   - this reading of the motto, and the wall of first tries: the peg rails, the kinds of wrong chair, the kites,
//     flutes, stools, lamps, the door and the table among them, the tags and all that is written on them, the given
//     names on them (thirty-two of this page's own: none is a person in the docs), and that old tries stay up
//   - the court: its place on the Low decks (which the docs give to schools), its size, three sheer walls and a fourth
//     side of stepped terraces of open workshops, the schools' names on the terraces, the kite loft, second tries for
//     sale under the first terrace at the docs' price for a new chair, the bentwood hoop in the far wall
//   - the rolling tower, its hoist and winch, the catch net and the plate on it (the sums above are the drum's)
//   - the staging of the signing: the bench in the court, the buyer, the school standing round, the girl's name
//     (Tamsin), the day as she writes it (a day of the booking year), the school's brand on the seat
//   - Apprentice Street as drawn: the open workshops and their boards (turners, a flute maker, chair menders), the
//     other trades, where the board for Nine stands (what it says is the docs')
import {
  Scene, Mesh, InstancedMesh, ShaderMaterial, BufferGeometry, Float32BufferAttribute, CanvasTexture, NoColorSpace,
  LinearMipmapLinearFilter, LinearFilter, ClampToEdgeWrapping, Vector3, Vector4, Matrix4, Quaternion, Color, Sphere, DoubleSide,
} from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DRUM, DEG } from '../kit/drum.js';
import { makeDeck, finish, street, Run, PALETTES } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG } from '../kit/mats.js';
import { Geo, instances, shade, mixc, rgb, fitBounds } from '../kit/geo.js';
import { figureGeo, SKIN } from '../kit/folk.js';
import { makeRng, smoothstep, clamp } from '../core/rng.js';

// ---------------------------------------------------------------- the place (flat: x spinward, y up, z aft)
const DECK = 58, RADIUS = deckRadius(DECK);     // y = 0 is the court's floor: deck 58, six decks to its ceiling
const CX0 = 0, CX1 = 66, CZ0 = -13, CZ1 = 13, TOP = 24;
const STEP = 2, DEPTH = 8, NT = 5;              // five terraces on the front side, each rail 2 m behind the one below
const railZ = (k) => CZ0 - STEP * (k - 1), backZ = (k) => railZ(k) - DEPTH;
const ZS = 8.5, SW = 7;                         // Apprentice Street: its centre line and its width
const NROW = 24, ROW0 = 0.93, PITCH = 0.58;     // peg rails a metre apart, four to a deck; a peg every 58 cm
const TOWER = { x0: 30, x1: 33, z0: 10.7, z1: 12.4 }, HOOK = [31.5, 10.05], JIB = 23.4;
const BENCH = [50, 0];                          // where the chair is signed
const HOIST_V = 0.6, HOIST_T0 = 7, HOIST_Y0 = 1.3, HOIST_Y1 = 21.1;
const VDECK = DRUM.OMEGA * RADIUS;              // the deck's own speed
// how far antispinward of the plumb line a thing lands that is let go h metres up
const fallAnti = (h) => { const f = Math.acos((RADIUS - h) / RADIUS); return RADIUS * (Math.tan(f) - f); };
const TAU = Math.PI * 2;

// Workshop white (15-canon.js): a cool, clear ramp. The colour in the place is its wood
const INK = '#1f2326', SLATE = '#55636b', WHITE = '#f6fbff';
const WALLC = '#cbd6db', SHADOW = '#4f5d66', RAILC = '#b79a70';
const WHITEPAL = {
  ...PALETTES.bright,
  walls: ['#d5dee2', '#c9d6dc', '#dde4e6', '#cfd8d9', '#c3cfd5', '#d9dfdd'],
  dado: ['#8d9aa1', '#7f8c93', '#9aa5a8', '#86939a'],
  trim: ['#55636b', '#4a565d', '#6b7a82', '#3f4a50'],
  doors: ['#b88d5e', '#8d6a48', '#c9a26a', '#55636b', '#a07a52', '#3f5f73', '#d9b98a', '#7a5a3c'],
  awnings: [['#55636b', '#f1f6f8'], ['#8fa3ab', '#f6fbff'], ['#b88d5e', '#f1ead8'], ['#3f5f73', '#e9f0f3'], ['#b5553f', '#f1ead8'], ['#c9a23a', '#f6fbff']],
  signs: [['#1f2326', '#f6fbff'], ['#f1f6f8', '#1f2326'], ['#55636b', '#f6fbff'], ['#e3eaed', '#3f4a50'], ['#2c3338', '#e9c877'], ['#f1ead8', '#3a2c22']],
  floor: '#aab4b8', strip: '#869198', court: '#c2cbce', ceiling: '#b9c4c9', rib: '#e3eaed',
  rooms: ['#e9eef0', '#dfe6e8', '#f1ead8', '#d9e2e6', '#eef2f3', '#e3dccb', '#d5dee2'],
  metal: '#7f8a90', brass: '#b9a070', glass: '#cfe2ea',
  lamp: '#f2f7ff', window: ['#f6fbff', '#eaf2f8', '#fff8ea', '#dfeaf2'], shop: '#f4f9ff', goods: 0.75,
};
// raw and oiled wood, pale to dark; a few painted
const WOODS = ['#ead6aa', '#e2c690', '#dcb97c', '#d2a968', '#c99a5b', '#bd8f58', '#b08552', '#a07646', '#93693f', '#85603c', '#775536', '#6a4a30', '#5c4029', '#cdb28a', '#c2a276'];
const PAINTS = ['#55636b', '#8fa3ab', '#b5553f', '#2f3b45', '#e9e4d6', '#3f6f73', '#c9a23a'];
// the schools' colours, as on the kite lawns (worlds/yarrow_kites.js)
const SCHOOLS = ['#e8402a', '#f5b800', '#1f6fd1', '#18a37a', '#ff7a1a', '#d03a8c', '#5bc8e8', '#7b4fc9'];
// given names for the tags: this page's own
const NAMES = ['Bryn', 'Linnet', 'Odile', 'Rafe', 'Esme', 'Roan', 'Calla', 'Merle', 'Sabel', 'Idris', 'Wyn', 'Mab', 'Kes', 'Lio', 'Pim', 'Sena',
  'Tove', 'Una', 'Wim', 'Yara', 'Gwil', 'Fenn', 'Bex', 'Opal', 'Nico', 'Vida', 'Hazel', 'Rowan', 'Alder', 'Cress', 'Brook', 'Ash'];

// ---------------------------------------------------------------- first tries
// A stick of square section from a to b, in whatever space the builder is in. Its ends are 'b' (at a) and 't' (at b).
const _sx = new Vector3(), _sy = new Vector3(), _sz = new Vector3();
function strut(g, a, b, s1, s2, col, skip = '') {
  _sy.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = _sy.length();
  _sy.divideScalar(len);
  if (Math.abs(_sy.y) > 0.7) _sx.set(1, 0, 0); else _sx.set(0, 1, 0);
  _sx.addScaledVector(_sy, -_sx.dot(_sy)).normalize();
  _sz.crossVectors(_sx, _sy);
  g.push(new Matrix4().makeBasis(_sx, _sy, _sz).setPosition(a[0], a[1], a[2]));
  g.box(-s1 / 2, 0, -s2 / 2, s1 / 2, len, s2 / 2, col, { skip });
  g.pop();
}
// Long faces are drawn in pieces short enough to bend: fn(from, to) draws one. (Left whole, the kit's builder halves a
// 66 m face until it fits, and makes 162 triangles where 22 do: a rail's worth of work for the collector.)
const pieces = (a, b, fn, step = 6) => { const n = Math.max(1, Math.ceil((b - a) / step - 1e-6)); for (let i = 0; i < n; i++) fn(a + (b - a) * i / n, a + (b - a) * (i + 1) / n); };
// a thin board between two points, seen from in front and from behind: hgt is its height
function board(g, a, b, hgt, col) {
  const h = hgt / 2;
  g.quad([b[0], b[1] - h, b[2]], [a[0], a[1] - h, a[2]], [a[0], a[1] + h, a[2]], [b[0], b[1] + h, b[2]], col);
  g.quad([a[0], a[1] - h, a[2]], [b[0], b[1] - h, b[2]], [b[0], b[1] + h, b[2]], [a[0], a[1] + h, a[2]], col);
}

// What a chair is, in metres, and the dozen ways it has gone wrong. hs: the seat's height; w, d: the frame; hb: the
// top of the back; rake: how far the back leans back. short: what each leg lacks (front left, front right, back
// left, back right); splay: how far the feet stand out; lean: the back gone sideways; seat: the seat board as a share
// of the frame; drop: the front of the seat lower than the back; rock: rockers (flat ones); arms: their two heights;
// rack: the whole frame out of square; skew: slats every way; miss: a leg not there; up: hung the other way up.
const BASE = { hs: 0.44, w: 0.42, d: 0.39, hb: 0.9, t: 0.034, rake: 0.06, short: [0, 0, 0, 0], splay: 0, lean: 0, seat: [1, 1], drop: 0, rock: 0, arms: null, rack: 0, skew: 0, miss: -1, slats: 3, up: 0 };
const CHAIRS = {
  short: { short: [0.085, 0, 0, 0] },
  lean: { lean: 0.14 },
  small: { seat: [0.55, 0.58] },
  splay: { splay: 0.12, hs: 0.4, hb: 0.86 },
  rocker: { rock: 1, d: 0.42 },
  good: { rake: 0.085, slats: 4, up: 1 },
  tall: { hs: 0.57, hb: 1.0, w: 0.34, d: 0.34 },
  rack: { rack: 0.12 },
  slats: { skew: 1 },
  arms: { arms: [0.62, 0.75], w: 0.46 },
  three: { miss: 1 },
  slope: { drop: 0.075 },
  hers: { rake: 0.085, slats: 4, plain: 1 },   // the second try on the bench: no stretchers
  bare: { slats: 0, bare: 1 },          // a frame glued up and waiting for its seat (on the benches, not on the wall)
};

// A chair standing on the floor at the origin, its front toward -z. lod 0: every stick; 1: fewer; 2: a few faces.
// Frame parts take a copy's colour whole (tint 1); the seat a little less, so it reads as another wood or as rush.
function drawChair(g, kind, lod, W = '#ffffff', S = '#f3ecda') {
  const o = { ...BASE, ...CHAIRS[kind] }, { hs, w, d, hb } = o, t = lod === 2 ? 0.042 : o.t, hw = w / 2 - o.t / 2, hd = d / 2 - o.t / 2;
  const sx = (y) => o.rack * (y / hb) + (y > hs ? o.lean * (y - hs) / (hb - hs) : 0);      // how far the frame has gone sideways at height y
  const sz = (y) => (y > hs ? o.rake * (y - hs) / (hb - hs) : 0);                            // and how far the back rakes
  const at = [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]];
  const top = (i) => (i < 2 ? hs - 0.03 - o.drop : hs), foot = (i) => o.short[i];
  // a point of leg i at height y: the feet splay
  const leg = (i, y) => { const k = (top(i) - y) / top(i); return [at[i][0] + Math.sign(at[i][0]) * o.splay * k + sx(y), y, at[i][1] + Math.sign(at[i][1]) * o.splay * k]; };
  const post = (i, y) => [at[i][0] + sx(y), y, at[i][1] + sz(y)];
  // near, a leg is square and its foot is closed (feet are seen from below); farther off it is three faces; across the
  // court a front leg is one face toward the court, and a back leg and its post are one stick
  const stick = (a, b, skip) => { if (lod) g.tube([a, b], t * 0.62, 3, W, { smooth: false }); else strut(g, a, b, t, t, W, skip); };
  const face = (a, b, h) => g.quad([b[0], b[1] - h, b[2]], [a[0], a[1] - h, a[2]], [a[0], a[1] + h, a[2]], [b[0], b[1] + h, b[2]], W);
  g.tint(1);
  if (lod === 2) {
    for (const i of [0, 1]) if (i !== o.miss && !o.arms) { const a = leg(i, foot(i)), b = leg(i, top(i)); g.quad([a[0] + t / 2, a[1], a[2]], [a[0] - t / 2, a[1], a[2]], [b[0] - t / 2, b[1], b[2]], [b[0] + t / 2, b[1], b[2]], W); }
    for (const i of [2, 3]) stick(i === o.miss ? post(i, hs) : leg(i, foot(i)), post(i, hb));
  } else {
    for (let i = 0; i < 4; i++) if (i !== o.miss) stick(leg(i, foot(i)), leg(i, top(i)), 't');
    for (const i of [2, 3]) stick(post(i, hs), post(i, hb), 'b');
  }
  // the seat: a board, tipped forward if the front legs came out short, small if the maker ran out
  const sw = w * o.seat[0] + 0.02, sd = d * o.seat[1] + 0.012;
  if (!o.bare) {
    g.push(new Matrix4().makeTranslation(sx(hs), hs, d / 2).multiply(new Matrix4().makeRotationX(-Math.atan2(o.drop, d))));
    g.tint(0.8).box(-sw / 2, -0.03, -d / 2 - sd / 2, sw / 2, 0, -d / 2 + sd / 2, S, lod === 2 ? { skip: 's' } : {}).tint(1);
    g.pop();
  }
  // the back: a top rail and slats between the posts
  const a0 = post(2, hb - 0.04), b0 = post(3, hb - 0.04);
  if (o.skew) { a0[1] -= 0.05; b0[1] += 0.005; }
  if (lod === 2) face(a0, b0, 0.038); else strut(g, a0, b0, 0.075, 0.024, W, lod === 0 ? '' : 'tb');
  for (let j = 0, n = o.slats, y0 = hs + 0.13, y1 = hb - 0.16; j < n; j++) {
    const y = n > 1 ? y0 + (y1 - y0) * j / (n - 1) : (y0 + y1) / 2, a = post(2, y), b = post(3, y);
    if (o.skew) { a[1] += [0.05, -0.045, 0.03, 0][j]; b[1] += [-0.035, 0.05, -0.05, 0][j]; }
    if (lod === 0) strut(g, a, b, 0.046, 0.012, W, 'tb'); else if (lod === 1) board(g, a, b, 0.046, W); else face(a, b, 0.024);
  }
  if (lod < 2) {
    // rails under the seat (the full model only), and stretchers lower down
    if (lod === 0) {
      const yf = top(0) - 0.035, yb = hs - 0.065;
      strut(g, leg(0, yf), leg(1, yf), 0.05, 0.018, W, 'tb'); strut(g, leg(2, yb), leg(3, yb), 0.05, 0.018, W, 'tb');
      strut(g, leg(0, yf), leg(2, yb), 0.05, 0.018, W, 'tb'); strut(g, leg(1, yf), leg(3, yb), 0.05, 0.018, W, 'tb');
      if (o.seat[0] < 0.9) strut(g, [-hw + sx(hs), hs - 0.045, 0], [hw + sx(hs), hs - 0.045, 0], 0.03, 0.05, W, 'tb');
    }
    for (const [i, j, ys] of [[0, 1, 0.16], [2, 3, 0.16], [0, 2, 0.24], [1, 3, 0.24]]) {
      if (o.plain || i === o.miss || j === o.miss || (lod === 1 && j !== 1)) continue;
      if (lod === 0) strut(g, leg(i, ys), leg(j, ys), 0.026, 0.02, W, 'tb'); else board(g, leg(i, ys), leg(j, ys), 0.028, W);
    }
  }
  if (o.arms) for (const s of [0, 1]) {
    const ha = o.arms[s], x = at[s][0];
    if (lod === 2) stick(leg(s, foot(s)), [x, ha, at[s][1]]); else stick(leg(s, top(s)), [x, ha, at[s][1]], 'tb');
    strut(g, [x, ha, -hd - 0.05], [x + sx(ha), ha, hd + sz(ha)], 0.028, 0.052, W, lod === 0 ? '' : 'tb');
  }
  if (o.rock) for (const s of [-1, 1]) strut(g, [s * hw, -0.025, -d / 2 - 0.17], [s * hw, -0.025, d / 2 + 0.24], 0.05, 0.03, W, lod === 2 ? 'tb' : '');
  g.tint(0);
  return o;
}

// A first try as it hangs: the origin is its peg, the wall 3 cm behind it (+z), the court in front (-z). A chair
// hangs by its top rail with its back feet against the wall, and finds its own plumb: one whose back leans hangs
// askew. The good one hangs by a stretcher, the other way up. Each carries a soft shadow on the wall under its seat
// (the court is lit from its ceiling, and nothing in the kit casts a shadow). Returns { geo, tag: where its tag is tied }.
const WALL_Z = 0.03;
const leanX = (o, y) => o.rack * (y / o.hb) + (y > o.hs ? o.lean * (y - o.hs) / (o.hb - o.hs) : 0);
function shadowCard(g, x0, x1, y0, y1, k) { const z = WALL_Z - 0.011; g.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], mixc(WALLC, SHADOW, k)); }
function drawHung(g, kind, lod, W, S, shadows = true) {
  const o = { ...BASE, ...CHAIRS[kind] }, hd = o.d / 2 - o.t / 2, hw = o.w / 2 + 0.03;
  const hang = o.up ? [0, 0.16, hd] : [leanX(o, o.hb - 0.04), o.hb - 0.078, hd + o.rake + 0.012];
  const rest = o.up ? [0, o.hb, hd + o.rake] : [0, 0, hd + o.splay];
  const pitch = Math.atan2(rest[2] - hang[2], Math.abs(rest[1] - hang[1]));
  const roll = o.up ? 0 : Math.atan2(hang[0] - leanX(o, o.hs), hang[1] - o.hs - 0.05);
  const ys = o.up ? hang[1] - o.hs : o.hs - hang[1], xs = o.up ? 0 : leanX(o, o.hs) - hang[0];
  g.rot('z', roll).tint(0);
  if (!shadows) { /* it hangs in the air */ } else if (lod === 2) shadowCard(g, xs - hw, xs + hw, ys - 0.3, ys - 0.02, 0.2);
  else {
    shadowCard(g, xs - hw, xs + hw, ys - 0.12, ys - 0.015, 0.36); shadowCard(g, xs - hw, xs + hw, ys - 0.24, ys - 0.12, 0.2);
    if (lod === 0) { shadowCard(g, xs - hw, xs + hw, ys - 0.4, ys - 0.24, 0.09); if (!o.up) shadowCard(g, -hw + 0.02, hw - 0.02, -0.075, -0.005, 0.24); }
  }
  g.rot('x', pitch);
  if (o.up) g.rot('z', Math.PI);
  g.at(-hang[0], -hang[1], -hang[2]);
  drawChair(g, kind, lod, W, S);
  const A = new Vector3(-0.1 + leanX(o, o.hs), o.hs - 0.05 - o.drop, -o.d / 2 - 0.025).applyMatrix4(g.m);
  g.pop(); if (o.up) g.pop();
  g.pop().pop();
  return A;
}
function hungChair(kind, lod) { const g = new Geo(), A = drawHung(g, kind, lod); return { geo: g.build(), tag: [A.x, A.y, A.z] }; }
// a stool, hung by a cord with its seat to the wall and its three legs, of three lengths, toward the court
function hungStool(lod) {
  const g = new Geo(), L = [0.46, 0.4, 0.31], W = '#ffffff';
  g.tint(0); shadowCard(g, -0.2, 0.22, -0.64, -0.37, 0.22);
  if (lod < 2) strut(g, [0, 0, 0], [0.01, -0.05, -0.004], 0.006, 0.006, '#d9d2c0', 'tb');
  g.tint(1).at(0.02, -0.21, -0.03).rot('x', Math.PI / 2);
  g.cyl(0, 0, 0, 0.165, 0.165, 0.035, lod === 2 ? 6 : 10, W, { smooth: false, base: true });
  g.pop().pop();
  for (let i = 0; i < 3; i++) {
    const a = i * TAU / 3 + 0.5, c = Math.cos(a), s = Math.sin(a), A = [0.02 + c * 0.09, -0.21 + s * 0.09, -0.03], B = [0.02 + c * 0.2, -0.21 + s * 0.2, -0.03 - L[i]];
    if (lod === 2) g.tube([A, B], 0.02, 3, W, { smooth: false }); else strut(g, A, B, 0.032, 0.032, W, 'b');
  }
  g.tint(0);
  return { geo: g.build(), tag: [0.12, -0.3, -0.14] };
}
// a kite, lopsided: its cross spar is off centre and not level. The top takes a school's colour
function hungKite(lod) {
  const g = new Geo(), z = -0.014, N = [0, -0.03, z], T = [0.02, -0.9, z], Lw = [-0.31, -0.3, z], Rw = [0.24, -0.37, z], C = [0, -0.33, z];
  const two = (a, b, c, col) => { g.tri(a, b, c, col, 0.1); g.tri(a, c, b, col, 0.1); };
  g.tint(1); two(N, Lw, C, '#ffffff'); two(N, C, Rw, '#e6e6e6');
  g.tint(0); two(Lw, T, C, '#f1ead8'); two(C, T, Rw, '#e0d8c6');
  if (lod < 2) {
    strut(g, N, T, 0.012, 0.012, '#c9b48e', 'tb'); strut(g, [Lw[0], Lw[1], z - 0.01], [Rw[0], Rw[1], z - 0.01], 0.012, 0.012, '#c9b48e', 'tb');
    g.tint(1);
    for (let i = 0; i < 3; i++) { const y = -0.96 - i * 0.085, x = 0.02 + (i % 2 ? 0.025 : -0.02); two([x - 0.045, y + 0.03, z], [x + 0.045, y - 0.03, z], [x + 0.045, y + 0.03, z], '#ffffff'); two([x - 0.045, y + 0.03, z], [x - 0.045, y - 0.03, z], [x + 0.045, y - 0.03, z], '#e6e6e6'); }
    g.tint(0);
  }
  return { geo: g.build(), tag: [0.15, -0.52, -0.03] };
}
// a heliox flute, 1.2 m of it, with its holes where the maker put them
function hungFlute(lod) {
  const g = new Geo(), z = -0.05;
  g.tint(1).cyl(0, -1.27, z, 0.017, 0.017, 1.2, lod === 2 ? 3 : 6, '#ffffff', { smooth: false, base: true }).tint(0);
  if (lod < 2) {
    g.cyl(0, -0.1, z, 0.021, 0.021, 0.03, 6, '#e9e2cf', { smooth: false }).cyl(0, -1.27, z, 0.021, 0.021, 0.025, 6, '#e9e2cf', { smooth: false, base: true });
    strut(g, [0, 0, 0], [0, -0.07, z], 0.005, 0.005, '#d9d2c0', 'tb');
    for (const [y, x] of [[-0.42, 0], [-0.5, 0.004], [-0.56, -0.004], [-0.7, 0.006], [-0.74, 0], [-0.93, -0.005], [-1.08, 0.004]]) g.quad([x + 0.007, y - 0.007, z - 0.0178], [x - 0.007, y - 0.007, z - 0.0178], [x - 0.007, y + 0.007, z - 0.0178], [x + 0.007, y + 0.007, z - 0.0178], '#1c1814');
  }
  return { geo: g.build(), tag: [0.02, -0.82, z - 0.03] };
}
// a table lamp on its cord, its shade askew
function hungLamp(lod) {
  const g = new Geo(), z = -0.19, n = lod === 2 ? 5 : 8;
  g.tint(0); shadowCard(g, -0.18, 0.22, -0.78, -0.52, 0.18);
  if (lod < 2) strut(g, [0, 0, 0], [0.01, -0.1, z], 0.005, 0.005, '#3a3b3c', 'tb');
  g.push(new Matrix4().makeTranslation(0.01, -0.1, z).multiply(new Matrix4().makeRotationZ(0.22)));
  g.tint(1).cyl(0, -0.17, 0, 0.15, 0.055, 0.17, n, '#ffffff', { smooth: false, base: true });
  g.tint(0).cyl(0, -0.45, 0, 0.012, 0.012, 0.3, 4, '#8f8a80', { smooth: false, cap: false });
  g.tint(0.6).cyl(0, -0.485, 0, 0.1, 0.085, 0.035, n, '#d9c9a8', { smooth: false, base: true }).tint(0);
  g.pop();
  return { geo: g.build(), tag: [0.13, -0.5, z - 0.07] };
}
const OTHERS = { stool: hungStool, kite: hungKite, flute: hungFlute, lamp: hungLamp };
const hungThing = (kind, lod) => (CHAIRS[kind] ? hungChair(kind, lod) : OTHERS[kind](lod));

// ---------------------------------------------------------------- tags
// What the tags say: the fault, in the maker's own hand. Every one is read by somebody.
const TAGS = {
  short: ['One leg short.', 'Rocks. Not a rocker.', 'Three good legs.', 'Measured once.', 'Fine on a slope.'],
  lean: ['It leans.', 'Leans left. So do I now.', 'The back is not square.', 'Sit up straight. It will not.', 'Leans. Still stands.'],
  small: ['Seat too small.', 'I measured my brother.', 'For a narrow person.', 'Ran out of board.', 'Half a seat.'],
  splay: ['Legs splay.', 'Does the splits.', 'Wide stance.', 'Joints cut loose.', 'Sat on once. Lower now.'],
  rocker: ['Does not rock.', 'Flat rockers.', 'A rocker that stays put.', 'Forgot the curve.', 'A very still rocker.'],
  good: ['Nothing wrong. Hung wrong instead.', 'No faults. So it hangs this way up.', 'Too good. Upside down.'],
  tall: ['Too tall.', 'Feet do not reach.', 'Drew it. Did not measure it.', 'For someone taller.', 'High chair, by mistake.'],
  rack: ['Not one right angle.', 'Racked.', 'Square when I left it.', 'Glued it leaning.', 'A parallelogram, mostly.'],
  slats: ['Slats every way.', 'No two slats agree.', 'Top rail slipped.', 'Cut by eye.', 'The back is a guess.'],
  arms: ['Arms do not match.', 'One arm higher.', 'Two arms. Two heights.', 'Lean on the low one.', 'Made the arms on different days.'],
  three: ['Three legs.', 'Ran out of wood.', 'Fourth leg to follow.', 'Counted wrong.', 'Lean it on a wall.'],
  slope: ['Seat slopes.', 'You slide off.', 'Front legs short.', 'Good for leaving.', 'Tips you out.'],
  stool: ['Three legs, three lengths.', 'Wobbles.', 'Turned one leg a day.'],
  kite: ['Flew once. Down.', 'Spar off centre.', 'Turns left only.', 'Too heavy to tow.', 'Would not come up.'],
  flute: ['One note.', 'Holes in the wrong places.', 'Tuned in the wrong air.', 'Plays flat. All of it.'],
  lamp: ['Lights the ceiling.', 'Leans toward you.', 'Shade too small.'],
  door: ['Opens. Does not shut.'],
  table: ['Five legs. Asked for four.'],
};
const WHO = [', 14', ', first year', ', 13', '', ', 15', ', first year', ', 12', ', 14', '', ', 13'];
// The atlas, 2048 square: tags in cells of 256 x 152, eight across; under them the underside of the signed seat,
// twice (bare, and with her name on it), and a swatch of twine.
const AW = 2048, CW = 256, CH = 152, PANEL = { x: 0, y: 1528, w: 544, h: 512 }, TWINE = [1300, 1700];
const TAG_CELL = {};
{ let n = 0; for (const k in TAGS) TAG_CELL[k] = TAGS[k].map(() => n++); }
const HAND = (px) => `500 ${px}px 'Caveat', 'Segoe Print', cursive`;
const COND = (px) => `500 ${px}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;

// one tag: old card, a punched hole, the fault in a hand that fills the card, and whose it was
function paintTag(cx, x, y, text, who, seed) {
  const r = makeRng('tag' + seed), w = CW, h = CH;
  cx.save(); cx.beginPath(); cx.rect(x, y, w, h); cx.clip();
  cx.fillStyle = r.pick(['#efe9d6', '#f3eee0', '#e9e1c8', '#ece6d2', '#e4dabd']); cx.fillRect(x, y, w, h);
  for (let i = 0; i < 5; i++) { cx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(90,70,40,0.05)'; cx.fillRect(x, y + r() * h, w, h * (0.1 + 0.2 * r())); }
  cx.strokeStyle = 'rgba(70,58,44,0.4)'; cx.lineWidth = 2; cx.strokeRect(x + 6, y + 6, w - 12, h - 12);
  cx.fillStyle = '#bcae8e'; cx.beginPath(); cx.arc(x + w / 2, y + 18, 9, 0, TAU); cx.fill();
  cx.fillStyle = '#2f2a24'; cx.beginPath(); cx.arc(x + w / 2, y + 18, 4.5, 0, TAU); cx.fill();
  const words = text.split(' '), maxW = w - 30;
  let px = 50, lines = [text];
  for (; px >= 24; px -= 3) {
    cx.font = HAND(px); lines = [];
    let cur = '';
    for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (cur && cx.measureText(t).width > maxW) { lines.push(cur); cur = wd; } else cur = t; }
    lines.push(cur);
    if (lines.length <= 2 && lines.every((l) => cx.measureText(l).width <= maxW) && lines.length * px * 0.82 <= 80) break;
  }
  cx.fillStyle = r.pick(['#22303a', '#2a2a2e', '#3a2c22', '#27394a', '#1f2326']); cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.save(); cx.translate(x + w / 2, y + 74); cx.rotate(r.f(-0.035, 0.035)); cx.font = HAND(px);
  lines.forEach((l, i) => cx.fillText(l, 0, (i - (lines.length - 1) / 2) * px * 0.82));
  cx.restore();
  cx.globalAlpha = 0.72; cx.font = HAND(27); cx.fillText(who, x + w / 2, y + h - 21); cx.globalAlpha = 1;
  cx.restore();
}
// The underside of the seat she signs: the bare wood with the school's brand burnt in and a maker's pencil marks;
// and the same again with her name and the day. The canvas's right is the drum's aft, its top spinward.
function paintPanel(cx, x, y, signed, sig) {
  const r = makeRng('seat-underside'), w = PANEL.w, h = PANEL.h;
  cx.save(); cx.beginPath(); cx.rect(x, y, w, h); cx.clip();
  cx.fillStyle = '#c99a5b'; cx.fillRect(x, y, w, h);
  for (let i = 0; i < 90; i++) { const yy = y + r() * h, x0 = x + r() * w * 0.8 - 40, len = 80 + r() * 380; cx.strokeStyle = r() < 0.6 ? 'rgba(120,84,40,' + (0.05 + 0.1 * r()).toFixed(3) + ')' : 'rgba(255,240,200,0.09)'; cx.lineWidth = 1 + r() * 2.2; cx.beginPath(); cx.moveTo(x0, yy); cx.bezierCurveTo(x0 + len * 0.3, yy + r.f(-4, 4), x0 + len * 0.7, yy + r.f(-4, 4), x0 + len, yy + r.f(-3, 3)); cx.stroke(); }
  // the brand
  cx.strokeStyle = 'rgba(60,30,12,0.75)'; cx.fillStyle = 'rgba(60,30,12,0.85)'; cx.lineWidth = 2.5;
  cx.strokeRect(x + 26, y + 26, 232, 76); cx.textAlign = 'center'; cx.textBaseline = 'middle';
  if ('letterSpacing' in cx) cx.letterSpacing = '2px';
  cx.font = COND(27); cx.fillText('SCHOOL QUARTER, YARROW', x + 142, y + 50);
  cx.font = COND(24); cx.fillText('MAKE IT TWICE', x + 142, y + 80);
  if ('letterSpacing' in cx) cx.letterSpacing = '0px';
  // pencil: a ringed 2, and which way is front
  cx.strokeStyle = 'rgba(50,50,56,0.6)'; cx.fillStyle = 'rgba(50,50,56,0.66)'; cx.lineWidth = 2;
  cx.beginPath(); cx.arc(x + w - 62, y + 62, 27, 0.2, TAU + 0.05); cx.stroke();
  cx.font = HAND(46); cx.fillText('2', x + w - 62, y + 62);
  cx.font = HAND(30); cx.fillText('front', x + 62, y + h - 34);
  cx.beginPath(); cx.moveTo(x + 22, y + h - 60); cx.lineTo(x + 22, y + h - 14); cx.moveTo(x + 14, y + h - 26); cx.lineTo(x + 22, y + h - 14); cx.lineTo(x + 30, y + h - 26); cx.stroke();
  if (signed) {
    cx.fillStyle = '#141c24';
    const cxm = x + w / 2 + 6, y0 = y + 268, y1 = y + 392;
    cx.font = HAND(168); const w0 = cx.measureText('Tamsin').width; cx.fillText('Tamsin', cxm, y0);
    cx.font = HAND(82); const w1 = cx.measureText('day 131').width; cx.fillText('day 131', cxm + 48, y1);
    // where the two lines lie in the bare copy, for the pen to follow
    const ox = PANEL.x - x;
    sig.a.set((cxm - w0 / 2 + ox) / AW, (cxm + w0 / 2 + ox) / AW, (cxm + 48 - w1 / 2 + ox) / AW, (cxm + 48 + w1 / 2 + ox) / AW);
    sig.mid = (y + 336) / AW;
  }
  cx.restore();
}
// The atlas is painted a few cells a step. Returns { tex, paint (a generator), sig }.
function makeAtlas() {
  const cv = document.createElement('canvas');
  cv.width = AW; cv.height = AW;
  const cx = cv.getContext('2d'), tex = new CanvasTexture(cv);
  tex.colorSpace = NoColorSpace; tex.flipY = false; tex.wrapS = tex.wrapT = ClampToEdgeWrapping;
  tex.minFilter = LinearMipmapLinearFilter; tex.magFilter = LinearFilter; tex.generateMipmaps = true;
  tex.anisotropy = 8;       // (three holds it to what the card allows; asking the card here can stall a cold page)
  const sig = { a: new Vector4(0, 1, 0, 1), mid: 0.9 };
  function* paint() {
    cx.fillStyle = '#ece6d2'; cx.fillRect(0, 0, AW, PANEL.y);
    cx.fillStyle = '#c99a5b'; cx.fillRect(0, PANEL.y, AW, AW - PANEL.y);
    let n = 0;
    for (const k in TAGS) for (const line of TAGS[k]) {
      const who = NAMES[(n * 7 + 3) % NAMES.length] + (n % 13 === 5 ? ', teaches here now' : n % 17 === 9 ? ', 71 years ago' : WHO[n % WHO.length]);
      paintTag(cx, (n % 8) * CW, Math.floor(n / 8) * CH, line, who, n);
      n++;
      yield 'firsts: tags';
    }
    cx.fillStyle = '#8a7a5c'; cx.fillRect(TWINE[0] - 20, TWINE[1] - 20, 40, 40);
    paintPanel(cx, PANEL.x, PANEL.y, false, sig);
    paintPanel(cx, PANEL.x + PANEL.w, PANEL.y, true, sig);
    tex.needsUpdate = true;
  }
  return { tex, paint, sig };
}

// Paper: the tags (each turns a little on its string, in its own time) and the seat she signs, lettered from the
// atlas. A vertex carries what it hangs from and a phase (negative: it does not turn), and a mode (1: the signed seat,
// whose ink shows only as far as the pen has got).
const PAPER_VERT = /* glsl */`
attribute vec4 aPiv; attribute float aMode;
${BEND_PARS}
uniform float uTime;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vUv; varying float vMode;
void main() {
  vec3 p = position, n = normal;
  if (aPiv.w >= 0.0) {
    float a = 0.36 * sin(uTime * (0.5 + 0.45 * fract(aPiv.w * 7.31)) + aPiv.w * 6.2832) + 0.1 * sin(uTime * 1.9 + aPiv.w * 40.0);
    float c = cos(a), s = sin(a); vec3 d = p - aPiv.xyz;
    p = aPiv.xyz + vec3(d.x * c + d.z * s, d.y, -d.x * s + d.z * c);
    n = vec3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c);
  }
  vF = p; vFN = n; vUv = uv; vMode = aMode;
  kBend(p, n);
  vW = p; vN = n;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const paperFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tMap; uniform vec3 uPaper; uniform vec4 uSigA; uniform vec3 uSigB;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vUv; varying float vMode;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  // both copies of the seat are read, and one kept: a texture must not be read inside a branch
  vec3 a = texture2D(tMap, vUv).rgb, b = texture2D(tMap, vUv + vec2(uSigB.x, 0.0)).rgb;
  float line = step(uSigB.y, vUv.y), l0 = mix(uSigA.x, uSigA.z, line), l1 = mix(uSigA.y, uSigA.w, line);
  float shown = smoothstep(-0.025, 0.0, uSigB.z - line - (vUv.x - l0) / (l1 - l0));
  vec3 t = mix(a, mix(a, b, shown), step(0.5, vMode));
  if (!gl_FrontFacing) { N = -N; FN = -FN; t = mix(uPaper, t, step(0.5, vMode)); }
  t = mix(t / 12.92, pow((t + 0.055) / 1.055, vec3(2.4)), step(0.04045, t));
  gl_FragColor = vec4(kAir(t * kLight(vW, N, vF, FN), vW), 1.0);
}`;
// gathers quads of paper, then makes one mesh of them
function makePaper(deck, atlas) {
  const pos = [], nrm = [], uv = [], piv = [], mode = [];
  const P = {
    /** a quad: centre C, right r, top t (unit vectors), half sizes, the atlas rectangle [x, y, w, h] in pixels, what it hangs from (or null), a phase, a mode */
    quad(C, r, t, hw, hh, px, hung, phase, md = 0) {
      const n = [r[1] * t[2] - r[2] * t[1], r[2] * t[0] - r[0] * t[2], r[0] * t[1] - r[1] * t[0]];
      const u0 = (px[0] + 0.5) / AW, u1 = (px[0] + px[2] - 0.5) / AW, v0 = (px[1] + 0.5) / AW, v1 = (px[1] + px[3] - 0.5) / AW;
      const q = [[-1, -1, u0, v1], [1, -1, u1, v1], [1, 1, u1, v0], [-1, 1, u0, v0]];
      for (const i of [0, 1, 2, 0, 2, 3]) {
        const a = q[i][0] * hw, b = q[i][1] * hh;
        pos.push(C[0] + r[0] * a + t[0] * b, C[1] + r[1] * a + t[1] * b, C[2] + r[2] * a + t[2] * b); nrm.push(n[0], n[1], n[2]); uv.push(q[i][2], q[i][3]);
        if (hung) piv.push(hung[0], hung[1], hung[2], phase); else piv.push(0, 0, 0, -1);
        mode.push(md);
      }
    },
    /** a tag tied at A on a wall whose face looks along n = [nx, nz]: a card on a short string */
    tag(A, n, cell, phase, string) {
      const r = [n[1], 0, -n[0]], up = [0, 1, 0], s = 0.045 + 0.04 * ((phase * 7.3) % 1);
      if (string) P.quad([A[0], A[1] - s / 2, A[2]], r, up, 0.0022, s / 2 + 0.008, [TWINE[0] - 6, TWINE[1] - 6, 12, 12], A, phase);
      P.quad([A[0], A[1] - s - 0.0445, A[2]], r, up, 0.075, 0.0445, [(cell % 8) * CW, Math.floor(cell / 8) * CH, CW, CH], A, phase);
    },
    mesh() {
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
      g.setAttribute('uv', new Float32BufferAttribute(uv, 2)); g.setAttribute('aPiv', new Float32BufferAttribute(piv, 4)); g.setAttribute('aMode', new Float32BufferAttribute(mode, 1));
      const m = fitBounds(new Mesh(g, P.mat), deck.frame);
      m.renderOrder = 1;
      return m;
    },
    mat: new ShaderMaterial({
      uniforms: {
        ...deck.rig.uniforms, uClip: G.uClip, uTime: G.uTime, uBend: { value: new Vector3(deck.frame.a0, deck.frame.z0, deck.frame.floorR) },
        tMap: { value: atlas.tex }, uPaper: { value: new Vector3(0.925, 0.9, 0.82) }, uSigA: { value: atlas.sig.a }, uSigB: { value: new Vector3(PANEL.w / AW, 0.9, 0) },
      },
      vertexShader: PAPER_VERT, fragmentShader: paperFrag(deck.rig), side: DoubleSide,
    }),
  };
  return P;
}

// ---------------------------------------------------------------- what moves
// The deck kit merges what it draws into still meshes. What moves here (work turning on the lathes, saws and planes,
// the hoist's rope and the chair on it, the winch, kites turning on their strings, the hand that signs) is drawn into
// one mesh whose vertices each carry a pivot and a channel; a channel is a turn about an axis through the pivot, a
// stretch in y and a shift, set every frame (as worlds/sorrel_organ.js moves its shutters). One draw call.
const NCH = 16, CH_CHAIR = 1, CH_ROPE = 2, CH_LATHE = 3, CH_KITE = 7, CH_WINCH = 9, CH_PLANE = 11, CH_PEN = 12;
const MOVE_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit; attribute vec4 aMov;
${BEND_PARS}
uniform vec4 uAx[${NCH}]; uniform vec4 uTr[${NCH}];
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit;
vec3 kRot(vec3 v, vec4 A) { float c = cos(A.w), s = sin(A.w); return v * c + cross(A.xyz, v) * s + A.xyz * dot(A.xyz, v) * (1.0 - c); }
void main() {
  vec3 p = position, n = normal;
  int ch = int(aMov.w + 0.5);
  if (ch > 0) {
    vec4 A = uAx[ch], T = uTr[ch];
    vec3 d = p - aMov.xyz; d.y *= T.w;
    p = aMov.xyz + kRot(d, A) + T.xyz; n = kRot(n, A);
  }
  vF = p; vFN = normalize(n); vCol = aCol.rgb; vEmit = aEmit;
  kBend(p, n);
  vW = p; vN = normalize(n);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const moveFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  gl_FragColor = vec4(kAir(vCol * (kLight(vW, N, vF, FN) + vEmit), vW), 1.0);
}`;
function makeMover(deck) {
  const g = new Geo({ maxSeg: 8 }), mov = [], ax = [], tr = [];
  for (let i = 0; i < NCH; i++) { ax.push(new Vector4(1, 0, 0, 0)); tr.push(new Vector4(0, 0, 0, 1)); }
  const M = {
    g,
    /** everything fn(g) draws moves with channel ch about pivot */
    part(ch, pivot, fn) { const v0 = g.pos.length / 3; fn(g); for (let i = v0, v1 = g.pos.length / 3; i < v1; i++) mov.push(pivot[0], pivot[1], pivot[2], ch); return M; },
    turn(ch, axis, angle) { ax[ch].set(axis[0], axis[1], axis[2], angle); },
    shift(ch, x, y, z, sy = 1) { tr[ch].set(x, y, z, sy); },
    mesh() {
      const geo = g.build();
      geo.setAttribute('aMov', new Float32BufferAttribute(mov, 4));
      const mat = new ShaderMaterial({
        uniforms: { ...deck.rig.uniforms, uClip: G.uClip, uBend: { value: new Vector3(deck.frame.a0, deck.frame.z0, deck.frame.floorR) }, uAx: { value: ax }, uTr: { value: tr } },
        vertexShader: MOVE_VERT, fragmentShader: moveFrag(deck.rig), side: DoubleSide,
      });
      const m = fitBounds(new Mesh(geo, mat), deck.frame);
      geo.boundingSphere.radius += 24;      // the chair on the hoist goes the height of the court
      return m;
    },
  };
  return M;
}
// A piece of work turning between a lathe's centres, along x from x0 to x1 at height y: square where the leg will
// keep its corners, turned and beaded between, its faces in two tones so that the turning shows.
function turning(M, ch, x0, x1, y, z, wood, seed) {
  const r = makeRng('turn' + seed), c0 = shade(wood, 1.12), c1 = shade(wood, 0.8), len = x1 - x0, sq = 0.046 + 0.012 * r();
  M.part(ch, [x0, y, z], (g) => {
    const ring = (x, rad, n, ph) => { const a = []; for (let i = 0; i < n; i++) { const t = ph + i * TAU / n; a.push([x, y + Math.cos(t) * rad, z + Math.sin(t) * rad]); } return a; };
    const skin = (A, B) => { const n = A.length; for (let i = 0; i < n; i++) { const j = (i + 1) % n; g.quad(A[i], B[i], B[j], A[j], i % 2 ? c0 : c1); } };
    const k = 0.12 + 0.1 * r();                                   // how much of it is still square
    skin(ring(x0, sq, 4, 0.785), ring(x0 + len * k, sq, 4, 0.785));
    let x = x0 + len * k, rad = sq * 0.8;
    const n = 4 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) { const xb = i === n - 1 ? x1 : x + (x1 - x) / (n - i) * r.f(0.7, 1.3), rb = sq * r.f(0.45, 0.85); skin(ring(x, rad, 6, 0), ring(xb, rb, 6, 0)); x = xb; rad = rb; }
  });
}

// ---------------------------------------------------------------- the walls of first tries
// What hangs on a peg, by weight: chairs mostly. '' is a peg with nothing on it yet.
const MIX = [['short', 1], ['lean', 1], ['small', 1], ['splay', 1], ['rocker', 0.9], ['good', 0.09], ['tall', 0.6], ['rack', 1], ['slats', 1], ['arms', 0.9], ['three', 0.9], ['slope', 1], ['stool', 0.42], ['kite', 0.38], ['flute', 0.2], ['lamp', 0.26], ['', 0.3]];
function pickKind(rng, low, a, b) {
  const wt = (k, w) => (low && !CHAIRS[k] ? w * 0.3 : w);            // the first deck of pegs is nearly all chairs
  let total = 0;
  for (const [k, w] of MIX) total += wt(k, w);
  for (let tries = 0; tries < 6; tries++) {
    let t = rng() * total, kind = '';
    for (const [k, w] of MIX) { t -= wt(k, w); if (t <= 0) { kind = k; break; } }
    if (kind === '' || (kind !== a && kind !== b)) return kind;       // no two alike side by side, or one above the other
  }
  return 'slats';
}
// Where the flight comes close the long wall is hung by hand, by row and peg: the good chair, the table (two pegs
// wide), the door (two pegs wide and two rows deep), and the empty peg the chair on the hoist is going to.
const HEROES = { '4,20': 'good', '3,15': 'table', '3,16': null, '7,28': 'door', '7,29': null, '6,28': null, '6,29': null, '20,52': '', '20,53': '', '5,24': 'kite', '5,17': 'flute', '4,17': '', '6,22': 'rocker', '5,21': 'three', '6,25': 'lamp', '8,31': 'good' };
// a table, its top to the wall and its legs toward the court: all five of them
function drawTable(g) {
  const w = 1.08, h = 0.66, t = 0.032, L = 0.68, z0 = -0.012 - t, wood = '#d2a968', y1 = -0.06, y0 = y1 - h;
  shadowCard(g, -w / 2 - 0.04, w / 2 + 0.04, y0 - 0.3, y0, 0.28); shadowCard(g, -w / 2 - 0.04, w / 2 + 0.04, y0 - 0.5, y0 - 0.3, 0.12);
  g.box(-w / 2, y0, z0, w / 2, y1, z0 + t, wood, { sides: shade(wood, 0.85) });
  for (const [x, y] of [[-w / 2 + 0.07, y1 - 0.07], [w / 2 - 0.07, y1 - 0.07], [-w / 2 + 0.07, y0 + 0.07], [w / 2 - 0.07, y0 + 0.07], [0.1, y0 + 0.07]]) g.box(x - 0.027, y - 0.027, z0 - L, x + 0.027, y + 0.027, z0, shade(wood, 0.9), { skip: 's' });
  for (const y of [y1 - 0.07, y0 + 0.07]) g.box(-w / 2 + 0.07, y - 0.012, z0 - 0.09, w / 2 - 0.07, y + 0.012, z0, shade(wood, 0.8), { skip: 's' });
  for (const x of [-w / 2 + 0.07, w / 2 - 0.07]) g.box(x - 0.012, y0 + 0.07, z0 - 0.09, x + 0.012, y1 - 0.07, z0, shade(wood, 0.8), { skip: 's' });
  for (const x of [-0.29, 0.29]) g.box(x - 0.011, 0.004, -0.1, x + 0.011, 0.026, -0.02, shade(RAILC, 0.8), { skip: 's' });
  return [0.1, y0 + 0.04, z0 - L - 0.012];
}
// a door: racked, and its knob where no hand would look for it
function drawDoor(g) {
  const w = 0.8, h = 1.96, z = -0.05, c = '#b08552', c2 = '#c99a5b', y1 = -0.05, y0 = y1 - h, X = (x, y) => x + 0.11 * (y1 - y) / h;
  shadowCard(g, -w / 2 + 0.07, w / 2 + 0.15, y0 - 0.22, y0, 0.26);
  for (const sd of [-1, 1]) strut(g, [X(sd * (w / 2 - 0.05), y0), y0, z], [X(sd * (w / 2 - 0.05), y1), y1, z], 0.1, 0.04, c);
  for (const [y, hh] of [[y1 - 0.06, 0.12], [y1 - 0.98, 0.12], [y0 + 0.1, 0.2]]) strut(g, [X(-w / 2 + 0.1, y), y, z], [X(w / 2 - 0.1, y), y, z], hh, 0.038, c, 'tb');
  for (const [ya, yb] of [[y1 - 1.04, y1 - 0.12], [y0 + 0.2, y1 - 1.04]]) { const x0 = -w / 2 + 0.1, x1 = w / 2 - 0.1; g.quad([X(x1, ya), ya, z - 0.008], [X(x0, ya), ya, z - 0.008], [X(x0, yb), yb, z - 0.008], [X(x1, yb), yb, z - 0.008], c2); }
  g.cube(X(-0.27, y1 - 0.42), y1 - 0.42, z - 0.045, 0.05, 0.05, 0.05, '#b9a070');
  for (const x of [-0.29, 0.29]) g.box(x - 0.011, 0.004, -0.1, x + 0.011, 0.026, -0.02, shade(RAILC, 0.8), { skip: 's' });
  return [X(-0.27, y1 - 0.42), y1 - 0.45, z - 0.075];
}

const _m4 = new Matrix4(), _q1 = new Quaternion(), _q2 = new Quaternion(), _p3 = new Vector3(), _t3 = new Vector3(), _s3 = new Vector3(), _yAx = new Vector3(0, 1, 0), _zAx = new Vector3(0, 0, 1), _col = new Color();
const place = (it) => { _q1.setFromAxisAngle(_yAx, it.yaw); _q2.setFromAxisAngle(_zAx, it.roll || 0); _q1.multiply(_q2); return _m4.compose(_p3.set(it.p[0], it.p[1], it.p[2]), _q1, _s3.set(it.scale[0], it.scale[1], it.scale[2])); };
// many copies of one model, each turned about the wall's own up and then rolled on its peg (a generator: the far
// model has two thousand copies, and they are placed a few hundred a step)
function* hung(deck, geo, items) {
  const m = new InstancedMesh(geo, deck.prop, items.length), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], pts = [];
  let t0 = performance.now();
  for (let i = 0; i < items.length; i++) {
    const it = items[i], c = rgb(it.color);
    m.setMatrixAt(i, place(it)); _col.setRGB(c[0], c[1], c[2]); m.setColorAt(i, _col);
    for (let k = 0; k < 3; k++) { if (it.p[k] < lo[k]) lo[k] = it.p[k]; if (it.p[k] > hi[k]) hi[k] = it.p[k]; }
    if ((i & 63) === 63 && performance.now() - t0 > 3) { yield 'firsts: hung'; t0 = performance.now(); }
  }
  m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
  // where they all are on the drum: the corners of the box they fill, and points between along it
  for (let i = 0; i <= 4; i++) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) pts.push(deck.frame.point(lo[0] + (hi[0] - lo[0]) * i / 4, y, z));
  m.boundingSphere = new Sphere().setFromPoints(pts); m.boundingSphere.radius += 2.5;
  return m;
}
// Three sheer walls, each a run (u along it, the court at v < 0), with peg rails a metre apart from the floor to the
// ceiling and something on nearly every peg. Near the flight a first try is modelled stick by stick; farther off
// with fewer sticks; across the court as a few faces. Returns how many hang, and how many chairs on the long wall's
// first deck (the card says more than four hundred).
function* hangWalls(deck, ctx, paper) {
  const rng = makeRng('first-tries'), kd = Math.min(1, Math.sqrt((ctx && ctx.density) || 1)), FULL = 7.5 * kd, MID = 14.5 * kd;
  const models = new Map(), FAR = { tall: 'tall', rocker: 'rocker', good: 'good', arms: 'arms' };
  const model = (kind, lod) => { let m = models.get(kind + lod); if (!m) { const h = hungThing(kind, lod); models.set(kind + lod, m = { geo: h.geo, tag: h.tag, items: [] }); } return m; };
  const walls = [
    { run: new Run(0, 0, CZ1, 0), u0: CX0 + 0.5, u1: CX1 - 0.5, main: true },
    { run: new Run(CX1, 0, 0, 1), u0: -CZ1 + 0.55, u1: -CZ0 - 0.2, cut: [-2.5, 2.5, 5.5] },
    { run: new Run(CX0, 0, 0, 3), u0: CZ0 + 0.2, u1: CZ1 - 0.55, cut: [ZS - SW / 2 - 0.3, ZS + SW / 2 + 0.3, 3.6] },
  ];
  const count = { things: 0, firstDeck: 0, lod: [0, 0, 0], tris: 0 };
  let t0 = performance.now();
  // every model first, one a step: the first to be asked for must not pay for them all
  for (const [k] of MIX) if (k) for (let l = 0; l < 3; l++) { if (l < 2 || !CHAIRS[k] || FAR[k] || k === 'short') model(k, l); yield 'firsts: models'; }
  for (const w of walls) {
    const run = w.run, n = Math.floor((w.u1 - w.u0) / PITCH), off = w.u0 + ((w.u1 - w.u0) - n * PITCH) / 2, nrm = run.dir(0, -1);
    let above = [];
    for (let j = NROW - 1; j >= 0; j--) {
      const yp = ROW0 + j, row = [], cut = w.cut && yp < w.cut[2] ? w.cut : null, P = deck.pen(run, (w.u0 + w.u1) / 2, 'wall'), g = P.g;
      const rail = (a, b) => g.box(a, yp - 0.03, -0.022, b, yp + 0.06, 0, j % 4 === 3 ? SLATE : RAILC, { skip: 'swe' });
      for (const [a, b] of cut ? [[w.u0 - 0.3, cut[0]], [cut[1], w.u1 + 0.3]] : [[w.u0 - 0.3, w.u1 + 0.3]]) { if (run.turn % 2) rail(a, b); else pieces(a, b, rail, 7.5); }
      for (let i = 0; i < n; i++) {
        const u = off + (i + 0.5) * PITCH, hero = w.main ? HEROES[j + ',' + i] : undefined;
        let kind;
        if (cut && u > cut[0] - 0.3 && u < cut[1] + 0.3) kind = null;                    // a way through: no peg
        else if (hero !== undefined) kind = hero;
        else if (above[i] === 'flute') kind = '';                                         // a flute hangs down past the next peg
        else kind = pickKind(rng, j < 4, row[i - 1], above[i]);
        row.push(kind);
        if (kind === null) continue;
        const p = run.pt(u, yp, -WALL_Z), d = deck.dist(p[0], p[1], p[2]), lod = d < FULL ? 0 : d < MID ? 1 : 2, r = rng;
        if (kind === '') { if (lod < 2) g.box(u - 0.011, yp + 0.004, -0.1, u + 0.011, yp + 0.026, -0.02, shade(RAILC, 0.8), { skip: 's' }); continue; }
        if (kind === 'table' || kind === 'door') {
          const uc = u + PITCH / 2;
          g.at(uc, yp, -WALL_Z);
          const a = kind === 'table' ? drawTable(g) : drawDoor(g);
          g.pop();
          paper.tag(run.pt(uc + a[0], yp + a[1], -WALL_Z + a[2]), nrm, TAG_CELL[kind][0], r(), true);
          count.things++;
          continue;
        }
        const chair = !!CHAIRS[kind], m = model(lod === 2 && chair ? (FAR[kind] || 'short') : kind, lod), s1 = r.f(0.85, 1.12);
        const scale = chair ? [r.f(0.9, 1.1), kind === 'tall' ? r.f(0.92, 1.0) : r.f(0.92, 1.06), r.f(0.92, 1.08)] : kind === 'flute' ? [1, r.f(0.85, 1), 1] : [s1, s1, s1];
        const roll = clamp(r.gauss() * 0.03, -0.1, 0.1) + (r() < 0.05 ? r.f(-0.13, 0.13) : 0), woodAt = clamp(Math.round(2.2 + 6.5 * j / NROW + r.gauss() * 2.4), 0, 12), odd = r();
        const color = kind === 'kite' ? r.pick(SCHOOLS) : kind === 'lamp' ? r.pick(['#e9e2cf', '#d9c9a8', '#c9d6dc', '#b5553f', '#8fa3ab', '#e2c14a']) : kind === 'flute' ? r.pick(['#d9d6ca', '#c9aa6a', '#a9a8a0', '#e3d9b0', '#8d6a48'])
          : odd < 0.05 ? r.pick(PAINTS) : odd < 0.19 ? r.pick(WOODS) : WOODS[woodAt];
        const it = { p, yaw: run.yaw, roll, scale, color };
        m.items.push(it);
        place(it);
        _t3.set(m.tag[0], m.tag[1], m.tag[2]).applyMatrix4(_m4);
        paper.tag([_t3.x, _t3.y, _t3.z], nrm, r.pick(TAG_CELL[kind]), r(), lod < 2);
        count.things++; count.lod[lod]++; count.tris += m.geo.getAttribute('position').count / 3;
        if (w.main && j < 4 && chair) count.firstDeck++;
        if ((i & 3) === 3 && performance.now() - t0 > 4) { yield 'firsts: pegs'; t0 = performance.now(); }
      }
      above = row;
      P.done();
      if (performance.now() - t0 > 4) { yield 'firsts: pegs'; t0 = performance.now(); }
    }
  }
  yield 'firsts: pegs';
  for (const m of models.values()) {
    if (m.items.length) deck.group.add(yield* hung(deck, m.geo, m.items));
    yield 'firsts: hung';
  }
  return count;
}

// ---------------------------------------------------------------- furnishings of this page's own
function addProtos(deck) {
  const iron = '#5c6a72', steel = '#8a959b', wood = '#a98a5f';
  // a wood lathe: its bed along x, the turner's side toward -z, its centres 1.05 m up. The work between them is turning()'s
  deck.proto('lathe', (g) => {
    for (const x of [-0.62, 0.62]) g.box(x - 0.05, 0, -0.24, x + 0.05, 0.78, 0.24, wood, { skip: 'b' });
    g.box(-0.62, 0.22, -0.03, 0.62, 0.3, 0.03, wood);
    g.box(-0.78, 0.78, -0.1, 0.78, 0.86, -0.03, iron).box(-0.78, 0.78, 0.03, 0.78, 0.86, 0.1, iron);
    g.box(-0.78, 0.86, -0.12, -0.52, 1.2, 0.12, iron, { skip: 'b' }).box(0.44, 0.86, -0.08, 0.6, 1.13, 0.08, iron, { skip: 'b' });
    g.box(-0.2, 0.86, -0.19, 0.16, 0.9, 0.0, iron).box(-0.3, 0.97, -0.2, 0.26, 1.0, -0.15, steel).box(-0.04, 0.9, -0.19, 0.0, 0.97, -0.15, iron);
    g.box(-0.78, 0.34, -0.16, -0.46, 0.62, 0.16, '#3f4a50');
    g.tint(1).box(-0.55, 0.0, -0.34, 0.5, 0.035, 0.36, '#ffffff', { skip: 'b' }).tint(0);        // shavings underfoot
  });
  deck.proto('wbench', (g) => {
    g.tint(0.4).box(-0.95, 0.8, -0.36, 0.95, 0.88, 0.36, '#d9c39a').tint(0);
    for (const x of [-0.85, 0.85]) for (const z of [-0.28, 0.28]) g.box(x - 0.04, 0, z - 0.04, x + 0.04, 0.8, z + 0.04, wood, { skip: 'tb' });
    g.box(-0.85, 0.2, -0.28, 0.85, 0.24, 0.28, shade(wood, 0.9)).box(-0.99, 0.66, -0.3, -0.95, 0.88, -0.1, iron);
  });
  // a white enamel shade on a cord (its top at the origin): the pool of light at every bench
  deck.proto('wlamp', (g) => {
    g.cyl(0, -0.5, 0, 0.011, 0.011, 0.5, 4, '#3a3f44', { cap: false }).cyl(0, -0.66, 0, 0.25, 0.06, 0.16, 10, '#eef3f5', { smooth: false });
    g.cyl(0, -0.665, 0, 0.21, 0.21, 0.012, 10, '#f6fbff', { emit: 5, smooth: false, base: true });
  });
  deck.proto('frame', (g) => { drawChair(g, 'bare', 1); });        // a frame glued up
  deck.proto('second', (g) => { drawChair(g, 'good', 1); });       // a second try, finished
  deck.proto('legs', (g) => {
    g.box(-0.6, 0.5, -0.05, 0.6, 0.54, 0, wood).box(-0.6, 1.5, -0.05, 0.6, 1.54, 0, wood).tint(1);
    for (let i = 0; i < 11; i++) g.cyl(-0.5 + i * 0.1, 0.54, -0.035, 0.02, 0.016, 0.9 + 0.06 * (i % 3), 5, i % 2 ? '#ffffff' : '#e2e2e2', { smooth: false });
    g.tint(0);
  });
  deck.proto('planks', (g) => {
    for (const x of [-0.9, 0.9]) g.box(x - 0.04, 0, -0.3, x + 0.04, 1.9, -0.22, iron, { skip: 'b' });
    g.tint(1);
    for (let k = 0; k < 4; k++) for (let i = 0; i < 3; i++) g.box(-1.2 + 0.1 * ((k + i) % 3), 0.2 + k * 0.45 + i * 0.045, -0.3, 1.15 - 0.12 * ((k * 2 + i) % 3), 0.24 + k * 0.45 + i * 0.045, 0, ['#ffffff', '#ececec', '#dcdcdc'][(i + k) % 3]);
    g.tint(0);
  });
  deck.proto('tools', (g) => {
    g.box(-0.9, 1.0, -0.03, 0.9, 2.1, 0, '#6b7a82', { skip: 's' });
    for (let i = 0; i < 8; i++) {
      const x = -0.78 + i * 0.22;
      if (i % 3 === 0) g.box(x - 0.02, 1.2, -0.05, x + 0.02, 1.75, -0.03, '#b08552').box(x - 0.07, 1.75, -0.055, x + 0.07, 1.9, -0.03, '#9aa3a8');
      else if (i % 3 === 1) g.box(x - 0.012, 1.4, -0.045, x + 0.012, 1.95, -0.03, '#c9b48e').box(x - 0.012, 1.15, -0.05, x + 0.012, 1.4, -0.03, '#9aa3a8');
      else g.box(x - 0.07, 1.3, -0.045, x + 0.07, 1.36, -0.03, INK).box(x - 0.07, 1.3, -0.045, x - 0.05, 1.8, -0.03, INK).box(x - 0.05, 1.5, -0.04, x + 0.09, 1.52, -0.03, '#9aa3a8');
    }
  });
}
const wallN = (g, u0, u1, y0, y1, v, col, e = 0) => g.quad([u1, y0, v], [u0, y0, v], [u0, y1, v], [u1, y1, v], col, e);

// ---------------------------------------------------------------- the rolling tower and its hoist
// A ladder tower on rails the length of the long wall, a floor at every deck, a jib over its outer face. Its still
// parts go into the deck's own meshes; the rope, the load and the winch's drum are the mover's.
const HOOK_Y = HOIST_Y0 + 0.34, ROPE0 = JIB - 0.22 - HOOK_Y;       // the hook with the chair at the floor; the rope then
function* buildTower(deck, M) {
  const P = deck.pen(new Run(0, 0, 0, 0), 31, 'tower'), g = P.g, { x0, x1, z0, z1 } = TOWER;
  const wood = '#b39468', dark = '#8a7352', steel = '#6f7b82', board = '#c9ae84', cord = '#d9d2c0';
  for (const z of [z0 + 0.06, z1 - 0.06]) pieces(1, CX1 - 1, (a, b) => g.box(a, 0, z - 0.03, b, 0.028, z + 0.03, steel, { skip: 'bwe' }), 7.5);
  pieces(1, CX1 - 1, (a, b) => g.box(a, TOP - 0.2, z0 + 0.5, b, TOP - 0.08, z0 + 0.62, steel, { skip: 'we' }), 7.5);
  for (const x of [x0 + 0.07, x1 - 0.07]) for (const z of [z0 + 0.06, z1 - 0.06]) {
    g.box(x - 0.06, 0.2, z - 0.06, x + 0.06, TOP - 0.42, z + 0.06, wood, { skip: 'b' });
    g.at(x, 0.13, z - 0.04).rot('x', Math.PI / 2).cyl(0, 0, 0, 0.1, 0.1, 0.08, 10, '#3a3f44', { base: true }).pop().pop();
  }
  g.box(x0, 0.2, z0, x1, 0.3, z1, dark).box(x0, TOP - 0.5, z0, x1, TOP - 0.42, z1, dark).box(x0 + 1.3, TOP - 0.42, z0 + 0.5, x0 + 1.7, TOP - 0.2, z0 + 0.62, steel);
  for (let k = 1; k <= 5; k++) {
    const y = 4 * k;
    g.box(x0, y - 0.07, z0, x1, y, z1, board, { bottom: shade(board, 0.7) });
    for (const yy of [0.55, 1.05]) { g.box(x0, y + yy - 0.02, z0, x1, y + yy + 0.03, z0 + 0.045, wood); for (const x of [x0, x1 - 0.045]) g.box(x, y + yy - 0.02, z0, x + 0.045, y + yy + 0.03, z1, wood); }
    for (const x of [x0 + 0.75, x0 + 1.5, x0 + 2.25]) g.box(x - 0.02, y, z0, x + 0.02, y + 1.05, z0 + 0.04, wood, { skip: 'tb' });
    deck.sign(String(DECK + k), { at: [x1 - 0.45, y + 0.3, z0 - 0.012], n: [0, -1], h: 0.3, w: 0.52, style: 'plate', font: 'cond' });
  }
  yield 'firsts: tower';
  // a brace on each end and a ladder from every floor to the next, turn about
  for (let k = 0; k < 6; k++) {
    const y = 4 * k + (k ? 0 : 0.3), yt = k === 5 ? TOP - 0.5 : 4 * k + 3.93;
    for (const x of [x0 + 0.02, x1 - 0.02]) strut(g, [x, y, k % 2 ? z0 + 0.08 : z1 - 0.08], [x, yt, k % 2 ? z1 - 0.08 : z0 + 0.08], 0.03, 0.07, dark, 'tb');
    if (k === 5) continue;
    const lx = k % 2 ? x1 - 0.5 : x0 + 0.5, a = [lx, y, z0 + 0.5], b = [lx, 4 * k + 4.9, z1 - 0.35];
    for (const sd of [-0.2, 0.2]) strut(g, [a[0] + sd, a[1], a[2]], [b[0] + sd, b[1], b[2]], 0.035, 0.035, board, 'tb');
    for (let i = 1; i < 15; i++) { const t = i / 16, yy = a[1] + (b[1] - a[1]) * t, zz = a[2] + (b[2] - a[2]) * t; g.box(lx - 0.2, yy - 0.012, zz - 0.02, lx + 0.2, yy + 0.012, zz + 0.02, wood, { skip: 'we' }); }
  }
  yield 'firsts: tower';
  // the jib and its wheel; the winch on the base, and the fall of rope between them
  g.box(HOOK[0] - 0.07, JIB - 0.02, HOOK[1] - 0.22, HOOK[0] + 0.07, JIB + 0.14, z1, dark);
  g.at(HOOK[0] - 0.035, JIB - 0.12, HOOK[1]).rot('z', -Math.PI / 2).cyl(0, 0, 0, 0.11, 0.11, 0.07, 10, steel, { base: true }).pop().pop();
  g.box(x0 + 0.32, 0.3, z0 - 0.46, x0 + 0.98, 0.66, z0 - 0.04, dark, { skip: 'b' });
  for (const x of [x0 + 0.34, x0 + 0.96]) g.box(x - 0.025, 0.66, z0 - 0.32, x + 0.025, 0.95, z0 - 0.18, steel, { skip: 'b' });
  strut(g, [x0 + 0.65, 0.93, z0 - 0.25], [HOOK[0], JIB - 0.02, HOOK[1] + 0.11], 0.012, 0.012, cord, 'tb');
  // the catch net: on the antispinward side of the hoist only, and as long as a fall from the jib carries
  const nx0 = HOOK[0] - fallAnti(JIB) - 0.3, nx1 = HOOK[0] - 0.4, nz0 = HOOK[1] - 0.7, nz1 = z0 - 0.03, ny = (x) => 2.7 + 0.32 * (nx1 - x) / (nx1 - nx0);
  for (const z of [nz0, nz1]) strut(g, [nx1, ny(nx1), z], [nx0, ny(nx0), z], 0.07, 0.07, '#c9302a');
  for (const x of [nx0, nx1]) strut(g, [x, ny(x), nz0], [x, ny(x), nz1], 0.07, 0.07, '#c9302a');
  for (const [x, z] of [[nx0, nz0], [nx1, nz0], [nx0, nz1]]) strut(g, [x, ny(x), z], [x0 + (x > nx0 ? 0.9 : 0.07), 4 - 0.07, z0], 0.014, 0.014, cord, 'tb');
  for (let x = nx0 + 0.2; x < nx1 - 0.1; x += 0.2) P.c.quad([x - 0.014, ny(x) - 0.03, nz0], [x + 0.014, ny(x) - 0.03, nz0], [x + 0.014, ny(x) - 0.03, nz1], [x - 0.014, ny(x) - 0.03, nz1], SLATE);
  for (let z = nz0 + 0.19; z < nz1 - 0.1; z += 0.19) P.c.quad([nx0, ny(nx0) - 0.03, z - 0.014], [nx1, ny(nx1) - 0.03, z - 0.014], [nx1, ny(nx1) - 0.03, z + 0.014], [nx0, ny(nx0) - 0.03, z + 0.014], SLATE);
  P.done();
  deck.sign(['Stand spinward.', 'What falls from the top', 'lands two metres anti.'], { at: [x0 - 0.014, 12.67, (z0 + z1) / 2], n: [-1, 0], w: 1.56, h: 0.62, style: 'plate', font: 'cond' });
  yield 'firsts: tower';
  // the rope from the wheel to the hook, modelled at its longest; and the load: a hook block, a sling, and somebody's
  // first chair (its back leans) with its tag
  const top = [HOOK[0], JIB - 0.22, HOOK[1]];
  M.part(CH_ROPE, top, (mg) => mg.box(top[0] - 0.012, HOOK_Y, top[2] - 0.012, top[0] + 0.012, top[1], top[2] + 0.012, '#f1ede0', { skip: 'tb' }));
  M.part(CH_CHAIR, [HOOK[0], HOOK_Y, HOOK[1]], (mg) => {
    mg.box(HOOK[0] - 0.05, HOOK_Y - 0.12, HOOK[1] - 0.05, HOOK[0] + 0.05, HOOK_Y + 0.03, HOOK[1] + 0.05, '#c9302a');
    for (const sd of [-1, 1]) strut(mg, [HOOK[0], HOOK_Y - 0.1, HOOK[1]], [HOOK[0] + sd * 0.17, HOIST_Y0 + 0.07, HOOK[1] + 0.03], 0.022, 0.012, '#f5b800', 'tb');
    mg.at(HOOK[0], HOIST_Y0, HOOK[1]);
    const A = drawHung(mg, 'lean', 0, '#f1e0b4', '#e6d3a4', false);
    mg.pop();
    strut(mg, [A.x, A.y, A.z], [A.x, A.y - 0.07, A.z], 0.004, 0.004, '#8a7a5c', 'tb');
    mg.quad([A.x - 0.075, A.y - 0.16, A.z], [A.x + 0.075, A.y - 0.16, A.z], [A.x + 0.075, A.y - 0.07, A.z], [A.x - 0.075, A.y - 0.07, A.z], '#efe9d6');
  });
  // the winch's drum, with a crank on it so that its turning shows
  const dz = z0 - 0.25, dx = [x0 + 0.37, x0 + 0.93];
  M.part(CH_WINCH, [dx[0], 0.8, dz], (mg) => {
    for (let i = 0; i < 8; i++) { const a0 = i * TAU / 8, a1 = a0 + TAU / 8, r = 0.13; mg.quad([dx[0], 0.8 + Math.cos(a0) * r, dz + Math.sin(a0) * r], [dx[1], 0.8 + Math.cos(a0) * r, dz + Math.sin(a0) * r], [dx[1], 0.8 + Math.cos(a1) * r, dz + Math.sin(a1) * r], [dx[0], 0.8 + Math.cos(a1) * r, dz + Math.sin(a1) * r], i % 2 ? '#c9c2b0' : '#a39c8c'); }
    mg.box(dx[1], 0.78, dz - 0.02, dx[1] + 0.03, 1.02, dz + 0.02, steel).box(dx[1] + 0.03, 0.98, dz - 0.02, dx[1] + 0.16, 1.02, dz + 0.02, '#3a3f44');
  });
  // who is on it: three at the rail of the fifth floor watching the chair come up, one waiting for it above, one
  // on the way down, and one at the winch
  deck.people([
    { p: [x0 + 0.55, 16, z0 + 0.34], yaw: Math.PI - 0.2, color: '#3a6ea5' }, { p: [x0 + 1.05, 16, z0 + 0.36], yaw: Math.PI + 0.1, color: '#f5b800' }, { p: [x0 + 2.3, 16, z0 + 0.34], yaw: Math.PI + 0.4, color: '#d7d2c4' },
    { p: [x0 + 1.95, 20, z0 + 0.42], yaw: Math.PI, color: '#8c8577' }, { p: [x0 + 2.4, 8, z0 + 0.9], yaw: 2.2, color: '#c9563c' }, { p: [x0 + 0.65, 0, z0 - 0.98], yaw: 0, color: '#55636b' },
  ]);
}
// where the hoist is at second t of the flight: how far the chair has risen, how much rope is out, how far it leans
function hoistAt(t) {
  const span = HOIST_Y1 - HOIST_Y0, t1 = HOIST_T0 + span / HOIST_V, rise = clamp((t - HOIST_T0) * HOIST_V, 0, span);
  const hauling = smoothstep(HOIST_T0, HOIST_T0 + 1.2, t) * (1 - smoothstep(t1 - 0.2, t1 + 1.6, t));
  const lean = hauling * 2 * HOIST_V / VDECK, len = ROPE0 - rise;
  return { rise, lean, len, turns: rise / 0.13 };
}

// ---------------------------------------------------------------- the court
// Drawn by hand (the kit's court has planted terraces and cuts no way through a sheer wall): a floor, three sheer
// walls with the street's mouth in one and a hoop in another, a ceiling of lamps, and the light.
const HOOP_R = 1.62;
function* buildCourt(deck, hoopY) {
  const pal = deck.pal, fc = '#a2adb3', shine = 0.7, zt = TOWER.z0 - 0.5, rng = makeRng('firsts-court');
  let P = deck.pen(new Run(0, 0, 0, 0), 33, 'court'), g = P.g;
  // the floor: large slabs, a band of small ones every eleven metres, and along the long wall where the tower runs
  for (let i = 0; i < 6; i++) {
    const a = i * 11 + (i ? 0.55 : 0), b = (i + 1) * 11 - (i < 5 ? 0.55 : 0);
    P.f.tint(0.5).floor(a, CZ0, b, zt, 0, fc, { emit: shine });
    if (i < 5) P.f.tint(1).floor(b, CZ0, b + 1.1, zt, 0, shade(fc, 0.76), { emit: shine });
  }
  P.f.tint(1); pieces(CX0, CX1, (a, b) => P.f.floor(a, zt, b, CZ1, 0, shade(fc, 0.8), { emit: shine * 0.8 })); P.f.tint(0);
  // the ceiling: a field of lamps as bright as an overcast sky, cool white, with deep beams across
  const zc = backZ(NT), nx = 13, nz = 8, px = (CX1 - CX0) / nx, pz = (CZ1 - zc) / nz;
  pieces(CX0, CX1, (a, b) => g.floor(a, zc, b, CZ1, TOP, shade(pal.ceiling, 0.6), { down: true, emit: 0.25 }));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) g.floor(CX0 + i * px + 0.22, zc + j * pz + 0.22, CX0 + (i + 1) * px - 0.22, zc + (j + 1) * pz - 0.22, TOP - 0.06, mixc('#f4f9ff', '#d5e4f0', rng() < 0.1 ? 0.6 : 0.1 * rng()), { down: true, emit: 2.15 * (rng() < 0.04 ? 0.55 : rng.f(0.9, 1)) });
  for (let i = 0; i <= nx; i += 2) g.box(CX0 + i * px - 0.16, TOP - 0.6, zc, CX0 + i * px + 0.16, TOP, CZ1, shade(pal.ceiling, 0.7), { skip: 't' });
  P.done();
  yield 'firsts: court floor';
  // the long wall, bare: its rails and what hangs on them are hangWalls()'s
  P = deck.pen(new Run(0, 0, CZ1, 0), 33, 'court');
  for (let k = 0; k < 6; k++) pieces(CX0, CX1, (a, b) => wallN(P.g, a, b, 4 * k, 4 * k + 4, 0, shade(WALLC, k % 2 ? 0.972 : 1)));
  P.done();
  yield 'firsts: court walls';
  // the anti wall, with the street's mouth in it; it runs on as the end wall of the terraces
  const m0 = ZS - SW / 2, m1 = ZS + SW / 2;
  P = deck.pen(new Run(CX0, 0, 0, 3), 0, 'court'); g = P.g;
  wallN(g, zc, m0, 0, TOP, 0, WALLC); wallN(g, m1, CZ1, 0, TOP, 0, WALLC); wallN(g, m0, m1, 3, TOP, 0, WALLC);
  g.box(m0 - 0.26, 0, -0.07, m0, 3.3, 0, SLATE, { skip: 'bs' }).box(m1, 0, -0.07, m1 + 0.26, 3.3, 0, SLATE, { skip: 'bs' }).box(m0, 3, -0.07, m1, 3.3, 0, SLATE, { skip: 's' });
  P.done();
  deck.sign('Apprentice Street', { at: [CX0 + 0.084, 3.15, ZS], n: [1, 0], h: 0.2, style: 'plate', font: 'cond' });
  yield 'firsts: court walls';
  // the spin wall: the hoop is cut through it at the height the flight leaves by
  P = deck.pen(new Run(CX1, 0, 0, 1), 0, 'court'); g = P.g;
  const R = HOOP_R, hy = hoopY, sq = 2.3, top = hy + 2.2, angs = [];
  wallN(g, -CZ1, -sq, 0, TOP, 0, WALLC); wallN(g, sq, -zc, 0, TOP, 0, WALLC); wallN(g, -sq, sq, top, TOP, 0, WALLC);
  for (let i = 0; i < 40; i++) angs.push(i * TAU / 40);
  for (const [cu, cy] of [[sq, top - hy], [-sq, top - hy], [-sq, -hy], [sq, -hy]]) angs.push((Math.atan2(cy, cu) + TAU) % TAU);
  angs.sort((a, b) => a - b);
  const edge = (a) => { const c = Math.cos(a), s = Math.sin(a), t = Math.min(sq / Math.max(1e-6, Math.abs(c)), (s > 0 ? top - hy : hy) / Math.max(1e-6, Math.abs(s))); return [c * t, hy + s * t, 0]; };
  const pt = (a, r, v) => [Math.cos(a) * r, hy + Math.sin(a) * r, v];
  for (let i = 0; i < angs.length; i++) {
    const a = angs[i], b = i === angs.length - 1 ? angs[0] + TAU : angs[i + 1];
    if (b - a > 1e-5) g.quad(pt(a, R, 0), pt(b, R, 0), edge(b), edge(a), WALLC);
  }
  yield 'firsts: court walls';
  // the hoop itself: bent wood in five laminations, proud of the wall, and the hole lined with the same
  const lam = ['#dcb97c', '#b08552', '#e2c690', '#93693f', '#d2a968'];
  for (let i = 0; i < 40; i++) {
    const a = i * TAU / 40, b = a + TAU / 40;
    for (let k = 0; k < 5; k++) {
      const r0 = R + k * 0.046, r1 = r0 + 0.046, v0 = -0.08 + k * 0.118, v1 = v0 + 0.118;
      g.quad(pt(a, r0, -0.08), pt(b, r0, -0.08), pt(b, r1, -0.08), pt(a, r1, -0.08), lam[k]);
      g.quad(pt(b, R, v0), pt(a, R, v0), pt(a, R, v1), pt(b, R, v1), lam[(k + 2) % 5]);
    }
    g.quad(pt(a, R + 0.23, -0.08), pt(b, R + 0.23, -0.08), pt(b, R + 0.23, 0), pt(a, R + 0.23, 0), lam[1]);
    if (i % 10 === 9) yield 'firsts: hoop';
  }
  g.box(-1.5, 0, -1.0, 1.5, hy - R - 0.01, 0, '#b79a70', { skip: 'bs', top: '#c9ae84' });       // a step up to it
  P.done();
  deck.sign('Make it twice', { at: [CX1 - 0.012, hy + 2.6, 0], n: [-1, 0], h: 0.46, style: 'board', font: 'cond', ground: SLATE, ink: WHITE, track: 0.2 });
  // the light: the floor has the most of it, the terraces a share where they stand open to the ceiling, and each of
  // the three walls is washed from above so that every first try can be seen
  deck.zone({ min: [CX0 - 1.5, -0.5, CZ0 - 1.5], max: [CX1 + 1.5, TOP + 1, CZ1 + 1.5], soft: 1.5, color: '#f2f7fb', power: 0.84, side: 0.4, under: 0.5 });
  deck.zone({ min: [CX0 - 3, -0.5, CZ0 - 3], max: [CX1 + 3, TOP + 1, CZ1 + 3], soft: 3, flare: STEP / 4, color: '#e6eef4', power: 0.36, side: 0.55, under: 0.5 });
  deck.zone({ min: [CX0 - 1, -0.5, CZ1 - 1.2], max: [CX1 + 1, TOP + 0.6, CZ1 + 0.6], soft: 0.9, color: '#f6fbff', power: 0.5, side: 1, under: 0.85 });
  deck.zone({ min: [CX1 - 1.2, -0.5, CZ0 - 1], max: [CX1 + 0.6, TOP + 0.6, CZ1 + 1], soft: 0.9, color: '#f6fbff', power: 0.42, side: 1, under: 0.85 });
  deck.zone({ min: [CX0 - 0.6, -0.5, CZ0 - 1], max: [CX0 + 1.2, TOP + 0.6, CZ1 + 1], soft: 0.9, color: '#f6fbff', power: 0.42, side: 1, under: 0.85 });
  deck.sky({ x0: CX0, z0: zc, x1: CX1, z1: CZ1, y: TOP, floor: 0, color: '#f4f9ff', power: 0.5 });
  yield 'firsts: court walls';
}

// ---------------------------------------------------------------- the terraces of workshops
// The court's fourth side: a floor of second tries for sale under five terraces of open workshops, each stepped two
// metres back from the one below, each named on the edge of the slab over it.
const LEVELS = ['Second tries', 'Joiners', 'Seat weavers', 'Turning school', 'Finishing', 'Kite loft'];
const SLATES = [
  ['Second tries', 'Signed underneath.', 'A chair, 125 kWh.'], ['Glue up square.', 'Check it. Then check', 'it again tomorrow.'], ['Seats', 'Pull every strand', 'as hard as the first.'],
  ['Today', 'Four legs.', 'The same four.'], ['Three coats.', 'Two is not three.'], ['Kites', 'Weigh the spar.', 'Then weigh it again.'],
];
function* buildTerraces(deck, M, dens) {
  const pal = deck.pal, rng = makeRng('firsts-terraces'), stone = shade(pal.court, 0.97), fascia = '#e9eef0', soffit = '#aab6bc', wood = '#b39468', steel = '#7f8a90';
  const folk = [], woodOf = () => WOODS[1 + Math.floor(rng() * 10)];
  let t0 = performance.now(), nl = 0;
  for (let k = 0; k <= NT; k++) {
    const y = 4 * k, zr = k ? railZ(k) : CZ0, zb = backZ(Math.max(1, k)), H = k === NT ? TOP - y : 3;
    const P = deck.pen(new Run(0, y, 0, 0), 33, 'terr' + k), g = P.g;
    P.f.tint(1); pieces(CX0, CX1, (a, b) => P.f.floor(a, zb, b, zr, 0, k ? stone : '#b4b7b0', { emit: 0.35 })); P.f.tint(0);
    if (k) {
      pieces(CX0, CX1, (a, b) => {
        g.quad([a, -1, zr], [b, -1, zr], [b, 0, zr], [a, 0, zr], fascia);                                // the slab's edge
        g.floor(a, k === 1 ? zb : zr - 6, b, zr, -1, soffit, { down: true, emit: 0.6 });                 // and its underside
      });
      for (const x of [13, 35, 57]) deck.sign(LEVELS[k - 1], { at: [x, y - 0.5, zr + 0.012], n: [0, 1], h: 0.46, style: 'board', font: 'cond', ground: fascia, ink: SLATE, track: 0.3 });
      for (let x = 0; x < 66; x += 3) {
        g.box(x, 0, zr - 0.12, x + 3, 0.1, zr, fascia, { skip: 'b' }).box(x, 1.0, zr - 0.1, x + 3, 1.06, zr - 0.02, wood).box(x - 0.02, 0.1, zr - 0.08, x + 0.02, 1.0, zr - 0.04, steel, { skip: 'tb' });
        P.gl.quad([x + 3, 0.1, zr - 0.06], [x, 0.1, zr - 0.06], [x, 1.0, zr - 0.06], [x + 3, 1.0, zr - 0.06], pal.glass);
      }
    }
    pieces(CX0, CX1, (a, b) => {
      g.quad([a, 0, zb], [b, 0, zb], [b, H, zb], [a, H, zb], k % 2 ? '#dfe6e8' : '#d3dce1', 0.12);            // the back wall
      g.quad([a, 0, zb + 0.02], [b, 0, zb + 0.02], [b, 0.95, zb + 0.02], [a, 0.95, zb + 0.02], pal.dado[k % 4], 0.08);
    });
    // posts under the edge of the slab above (piers, on the court's own floor)
    if (k < NT) for (let x = 0; x <= 66.01; x += 6) { const xx = clamp(x, 0.2, 65.8), s = k ? 0.11 : 0.2, zp = (k ? zr - STEP : CZ0) - 0.16 - s; g.box(xx - s, 0, zp - s, xx + s, 3, zp + s, k ? fascia : '#dfe6e8', { skip: 'tb' }); }
    else { pieces(20, 46, (a, b) => g.box(a, H - 0.9, zr - 0.06, b, H - 0.2, zr, fascia, { skip: 'we' }), 6.5); deck.sign(LEVELS[5], { at: [33, y + H - 0.55, zr + 0.012], n: [0, 1], h: 0.46, style: 'board', font: 'cond', ground: fascia, ink: SLATE, track: 0.3 }); }
    P.done();
    deck.sign(SLATES[k], { at: [k % 2 ? 22.5 : 40.5, y + 1.75, zb + 0.04], n: [0, 1], w: 1.9, h: 1.15, style: 'chalk' });
    yield 'firsts: terrace';
    // what is in it, bay by bay (a bay is six metres)
    const zf = k === 0 ? zr - 1.3 : k === NT ? zr - 2.2 : zr - 3.1, zl = [zf - 0.4, zf - 2.6];
    for (let b = 0; b < 11; b++) {
      const bx = 6 * b + 3, r = rng;
      for (const lx of [bx - 1.5, bx + 1.5]) for (const lz of zl) { deck.put('wlamp', { p: [lx, y + H, lz], yaw: 0 }); deck.glow([{ p: [lx, y + H - 0.69, lz], color: '#f2f7ff', power: 1.5, size: 0.62 }]); }
      const lathe = (x, z) => {
        const w = woodOf();
        deck.put('lathe', { p: [x, y, z], yaw: 0, color: shade(w, 1.1) });
        turning(M, CH_LATHE + (nl % 3), x - 0.52, x + 0.44, y + 1.05, z, w, nl++);
        if (r() < 0.88) folk.push({ p: [x + r.f(-0.1, 0.15), y, z - 0.6], yaw: r.f(-0.15, 0.15) });
        if (deck.dist(x, y, z) < 30) for (let i = 0; i < 3; i++) deck.glow([{ p: [x - 0.1 + 0.2 * i, y + 1.07, z + 0.02], color: '#fff2d2', power: 0.5, size: 0.035, move: [r.f(-0.25, 0.25), -0.75, r.f(0.2, 0.5)], loop: r.f(0.9, 1.5), phase: r() }]);
      };
      if (k === 3) {
        // the turning school: lathes in two rows with a turner at each, racks of legs and tools on the wall
        for (const [dx, z] of [[-1.95, zf], [0, zf], [1.95, zf], [-1.0, zf - 2.3], [1.0, zf - 2.3]]) lathe(bx + dx, z);
        deck.put('legs', { p: [bx - 1.6, y, zb + 0.07], yaw: Math.PI, color: woodOf() }); deck.put('tools', { p: [bx + 1.5, y, zb + 0.05], yaw: Math.PI });
        deck.put('crate', { p: [bx + 2.7, y, zf + 1.1], yaw: r() * 3, color: woodOf(), scale: 1.3 });
      } else if (k === 1) {
        // joiners: benches with frames on them, frames in clamps on the floor behind
        for (const dx of [-1.5, 1.5]) {
          deck.put('wbench', { p: [bx + dx, y, zf], yaw: 0 });
          if (r() < 0.6) deck.put('frame', { p: [bx + dx + r.f(-0.3, 0.3), y + 0.88, zf], yaw: r() * 6.28, color: woodOf() });
          else M.part(CH_PLANE, [0, 0, 0], (mg) => { mg.box(bx + dx - 0.5, y + 0.88, zf - 0.12, bx + dx - 0.22, y + 0.95, zf - 0.04, '#8d6a48'); mg.box(bx + dx - 0.42, y + 0.95, zf - 0.1, bx + dx - 0.38, y + 1.02, zf - 0.06, '#6e5238'); });
          if (r() < 0.85) folk.push({ p: [bx + dx + r.f(-0.3, 0.2), y, zf - 0.62], yaw: r.f(-0.2, 0.2) });
        }
        for (let i = 0; i < 4; i++) if (r() < 0.8) deck.put('frame', { p: [bx - 2.1 + i * 1.4, y, zf - 2.3 + r.f(-0.2, 0.2)], yaw: r.f(-0.4, 0.4), color: woodOf() });
        deck.put(b % 2 ? 'planks' : 'tools', { p: [bx, y, zb + (b % 2 ? 0.36 : 0.05)], yaw: Math.PI, color: woodOf() });
      } else if (k === 2) {
        // seat weavers: each on a stool with a frame before them, hanks of rush on a rail behind
        for (const dx of [-2.0, -0.2, 1.7]) {
          const z = zf + r.f(-0.3, 0.3);
          deck.put('stool', { p: [bx + dx, y, z - 0.75], yaw: r() * 6, color: woodOf() }); deck.put('second', { p: [bx + dx, y, z], yaw: Math.PI + r.f(-0.5, 0.5), color: woodOf() });
          if (r() < 0.8) folk.push({ p: [bx + dx, y + 0.44, z - 0.75], sit: true, yaw: r.f(-0.2, 0.2) });
        }
        for (let i = 0; i < 4; i++) deck.put('frame', { p: [bx - 2.2 + i * 1.45, y, zf - 2.5], yaw: Math.PI + r.f(-0.3, 0.3), color: woodOf() });
      } else if (k === 4) {
        // finishing: second tries in rows, oiled and drying, and shelves of oil
        for (let i = 0; i < 5; i++) for (const z of [zf, zf - 1.1, zf - 2.2]) if (r() < 0.85) deck.put('second', { p: [bx - 2.3 + i * 1.15, y, z], yaw: Math.PI + r.f(-0.12, 0.12), color: shade(woodOf(), 0.88) });
        deck.put('shelf', { p: [bx + (b % 2 ? 1.2 : -1.2), y, zb + 0.2], yaw: Math.PI, color: '#b9a070' });
        if (r() < 0.7) folk.push({ p: [bx + r.f(-2, 2), y, zf + 0.9], yaw: Math.PI + r.f(-0.5, 0.5) });
      } else if (k === 5) {
        // the kite loft: long tables of cloth, kites on strings from the ceiling, turning
        deck.put('tableLong', { p: [bx, y, zf - 1.2], yaw: 0, color: '#d9c6a4', scale: [1.6, 1, 1.3] });
        const c1 = SCHOOLS[(b * 3) % 8], c2 = SCHOOLS[(b * 3 + 5) % 8];
        const Q = deck.pen(new Run(0, y, 0, 0), bx, 'terr5');
        Q.c.quad([bx - 1.7, 0.762, zf - 1.6], [bx - 0.2, 0.762, zf - 1.6], [bx - 0.2, 0.762, zf - 0.8], [bx - 1.7, 0.762, zf - 0.8], c1); Q.c.quad([bx + 0.3, 0.764, zf - 1.5], [bx + 1.6, 0.764, zf - 1.5], [bx + 1.6, 0.764, zf - 0.95], [bx + 0.3, 0.764, zf - 0.95], c2);
        Q.done();
        for (const [dx, dz, hh] of [[-2.2, 1.5, 0.9], [-0.4, 1.3, 1.5], [1.6, 1.6, 0.7], [-1.4, 0.1, 1.2], [0.8, -0.4, 0.8], [2.5, -1.6, 1.4], [-2.4, -2.2, 1.0]]) {
          const kx = bx + dx, kz = zf + dz, ky = y + H - hh, col = SCHOOLS[Math.floor(r() * 8)], s = r.f(1.1, 1.7), yaw = r() * 3;
          M.part(CH_KITE + (b + Math.round(dx * 2)) % 2, [kx, ky, kz], (mg) => {
            mg.box(kx - 0.005, ky, kz - 0.005, kx + 0.005, y + H, kz + 0.005, '#d9d2c0', { skip: 'tb' });
            mg.at(kx, ky, kz, yaw, s);
            mg.tri([0, 0, 0], [-0.36, -0.36, 0], [0, -0.36, 0], col, 0.2).tri([0, 0, 0], [0, -0.36, 0], [0.36, -0.36, 0], shade(col, 0.85), 0.2);
            mg.tri([-0.36, -0.36, 0], [0, -1.0, 0], [0, -0.36, 0], '#f1ead8', 0.2).tri([0, -0.36, 0], [0, -1.0, 0], [0.36, -0.36, 0], '#e0d8c6', 0.2);
            for (let i = 0; i < 3; i++) mg.tri([-0.05, -1.08 - i * 0.12, 0], [0.05, -1.14 - i * 0.12, 0], [0.05, -1.04 - i * 0.12, 0], col, 0.2);
            mg.pop();
          });
        }
        if (r() < 0.9) folk.push({ p: [bx + r.f(-1.5, 1.5), y, zf - 0.45], yaw: Math.PI + r.f(-0.3, 0.3) });
        if (r() < 0.5) folk.push({ p: [bx + r.f(-1.5, 1.5), y, zf - 1.95], yaw: r.f(-0.3, 0.3), child: true });
      } else {
        // under the first terrace: second tries for sale, in rows facing the court, and timber along the back
        for (let i = 0; i < 5; i++) for (const z of [zf, zf - 1.3]) if (r() < 0.9) deck.put('second', { p: [bx - 2.2 + i * 1.1, 0, z], yaw: Math.PI + r.f(-0.1, 0.1), color: woodOf() });
        deck.put('planks', { p: [bx + 0.2, 0, zb + 0.36], yaw: Math.PI, color: woodOf(), scale: [1.6, 1.2, 1] });
        if (b % 3 === 1) { deck.put('counter', { p: [bx, 0, zf - 3.2], yaw: 0, color: '#b39468' }); folk.push({ p: [bx, 0, zf - 3.9], yaw: 0, color: '#55636b' }); deck.sign(['Second tries', '125 kWh'], { at: [bx, 1.12, zf - 2.89], n: [0, 1], w: 0.6, h: 0.3, style: 'card', font: 'serif', font2: 'cond', head: true }); }
        if (r() < 0.6) folk.push({ p: [bx + r.f(-2, 2), 0, zf + 0.9], yaw: Math.PI + r.f(-0.4, 0.4) });
      }
      if (k && r() < 0.3) deck.put('sheet', { p: [bx + r.f(-2, 2), y + 1.07, zr - 0.06], yaw: 0, scale: [r.f(0.7, 1.2), r.f(0.6, 1), 1], color: k === NT ? SCHOOLS[Math.floor(r() * 8)] : r.pick(['#e9e4d6', '#8fa3ab', '#55636b', '#c7a36a', '#d7d2c4']) });
      if (k && r() < 0.45 * dens) folk.push({ p: [bx + r.f(-2, 2), y, zr - 1.2 - r.f(0, 0.5)], walk: r.f(0.5, 0.75), child: r() < 0.15 });
      // someone at the rail, looking down into the court
      if (k && r() < 0.5 * dens) folk.push({ p: [bx + r.f(-2.5, 2.5), y, zr - 0.45], yaw: r.f(-0.3, 0.3), child: r() < 0.15 });
      if (performance.now() - t0 > 4) { yield 'firsts: workshops'; t0 = performance.now(); }
    }
  }
  deck.people(folk);
  // one grid of lamps for all six floors of workshops: a white pool at every bench
  deck.lattice({ origin: [1.5, 2.34, -28.5], spacing: [3, 2], count: [22, 8], storeys: 6, rise: 4, color: '#f4f9ff', power: 1.05, reach: 3.0 });
  yield 'firsts: terraces';
}

// ---------------------------------------------------------------- Apprentice Street
// An open-fronted workshop behind a street's front: a beam over the opening with its name on it, a lit room behind,
// white lamps over the benches. What its trade puts in it is drawn by the three fit-outs below.
const SHOP_DEEP = 5.6;
function openShop(deck, P, b, run, H, o) {
  const g = P.g, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24, dep = SHOP_DEEP, wall = o.wall || '#e3e9ec', head = 2.44, hi = H - 0.14, beam = o.beam || SLATE;
  g.box(u0, head, -0.07, u1, H, 0.3, beam, { skip: 't' });
  deck.sign(o.name, { run, at: run.pt((u0 + u1) / 2, (head + H) / 2 + 0.01, -0.078), maxW: u1 - u0 - 0.6, h: 0.38, style: 'board', font: 'cond', ground: beam, ink: WHITE, track: 0.16 });
  g.floor(b.u0 + 0.12, 0.26, b.u1 - 0.12, dep, 0.012, '#bfae90');
  wallN(g, b.u0 + 0.12, b.u1 - 0.12, 0, hi, dep, wall, 0.14);
  g.quad([b.u0 + 0.12, 0, dep], [b.u0 + 0.12, 0, 0.26], [b.u0 + 0.12, hi, 0.26], [b.u0 + 0.12, hi, dep], wall, 0.1);
  g.quad([b.u1 - 0.12, 0, 0.26], [b.u1 - 0.12, 0, dep], [b.u1 - 0.12, hi, dep], [b.u1 - 0.12, hi, 0.26], wall, 0.1);
  g.floor(b.u0 + 0.12, 0.26, b.u1 - 0.12, dep, hi, shade(wall, 0.82), { down: true, emit: 0.12 });
  g.box(b.u0 + 0.12, 0, dep - 0.03, b.u1 - 0.12, 0.95, dep, deck.pal.dado[1], { skip: 'bs' });
  for (let u = u0 + 1.2; u < u1 - 0.7; u += 2.6) for (const v of [1.5, 3.9]) { deck.put('wlamp', { p: run.pt(u, hi, v), yaw: 0 }); deck.glow([{ p: run.pt(u, hi - 0.69, v), color: '#f2f7ff', power: 1.6, size: 0.62 }]); }
  if (o.sub) { g.box(u1 - 1.2, head - 0.52, -0.04, u1 - 0.14, head - 0.04, -0.02, '#f1ead8'); deck.sign(o.sub, { run, at: run.pt(u1 - 0.67, head - 0.28, -0.046), w: 0.98, h: 0.42, style: 'card', font: 'serif' }); }
}
const facing = (run) => { const d = run.dir(0, -1); return Math.atan2(d[0], d[1]); };       // the yaw of someone looking out of a front
// turners: a row of lathes at the front, each with its turner behind it and the work between them turning
function fitTurners(deck, M, b, run) {
  const u0 = b.u0 + 0.5, u1 = b.u1 - 0.5, r = makeRng('turners'), n = Math.max(2, Math.floor((u1 - u0) / 2.5)), out = run.dir(0, -1), yo = facing(run);
  for (let i = 0; i < n; i++) {
    const u = u0 + (i + 0.5) * (u1 - u0) / n, v = 1.3 + 0.3 * (i % 2), w = WOODS[2 + (i * 3) % 9], a = run.pt(u - 0.44, 1.05, v), c = run.pt(u + 0.52, 1.05, v);
    deck.put('lathe', { p: run.pt(u, 0, v), yaw: run.yaw + Math.PI, color: shade(w, 1.1) });
    turning(M, CH_LATHE + i % 3, Math.min(a[0], c[0]), Math.max(a[0], c[0]), 1.05, a[2], w, 'street' + i);
    deck.people([{ p: run.pt(u - 0.05, 0, v + 0.62), yaw: yo + r.f(-0.15, 0.15), color: ['#55636b', '#8c8577', '#3f6f8a', '#d7d2c4'][i % 4] }]);
    for (let k = 0; k < 4; k++) deck.glow([{ p: run.pt(u - 0.15 + 0.1 * k, 1.07, v - 0.02), color: '#fff2d2', power: 0.55, size: 0.035, move: [out[0] * r.f(0.2, 0.5) + r.f(-0.2, 0.2), -0.8, out[1] * r.f(0.2, 0.5)], loop: r.f(0.9, 1.4), phase: r() }]);
  }
  for (let u = u0 + 0.9, i = 0; u < u1 - 2.4; u += 2.9, i++) deck.put('legs', { p: run.pt(u, 0, SHOP_DEEP - 0.08), yaw: run.yaw, color: WOODS[3 + (i * 4) % 8] });
  deck.put('tools', { p: run.pt(u1 - 1.2, 0, SHOP_DEEP - 0.06), yaw: run.yaw });
  deck.put('crate', { p: run.pt(u0 + 0.2, 0, 3.4), yaw: 0.4, color: '#c99a5b', scale: 1.4 });
  deck.put('crate', { p: run.pt(u1 - 0.3, 0, 3.1), yaw: 1.1, color: '#a07646', scale: 1.3 });
  // legs for sale, stood in a tub at the front
  const P = deck.pen(run, u0 + 0.2, 'av'), g = P.g;
  g.cyl(u0 + 0.15, 0, 0.55, 0.3, 0.34, 0.5, 8, '#8d9aa1', { smooth: false, top: '#3f4a50' });
  for (let i = 0; i < 11; i++) { const a = i * 2.4, rr = 0.07 + 0.045 * (i % 4); g.tube([[u0 + 0.15 + Math.cos(a) * rr, 0.45, 0.55 + Math.sin(a) * rr], [u0 + 0.15 + Math.cos(a) * rr * 2.2, 1.0 + 0.05 * (i % 3), 0.55 + Math.sin(a) * rr * 2.2]], 0.021, 5, WOODS[1 + (i * 3) % 10], { smooth: false }); }
  P.done();
}
// the flute maker: a rack of heliox flutes, a metre and more of each; a bench of them; the maker trying one
function fitFlutes(deck, b, run) {
  const P = deck.pen(run, (b.u0 + b.u1) / 2, 'av'), g = P.g, u0 = b.u0 + 0.5, u1 = b.u1 - 0.5, r = makeRng('flutes'), cols = ['#d9d6ca', '#c9aa6a', '#a9a8a0', '#e3d9b0', '#8d6a48', '#d2a968'], yo = facing(run), D = SHOP_DEEP;
  g.box(u0, 1.56, D - 0.2, u1, 1.61, D - 0.04, '#8d6a48').box(u0, 0.28, D - 0.3, u1, 0.33, D - 0.04, '#8d6a48');
  for (let u = u0 + 0.15; u < u1 - 0.1; u += 0.16) g.tube([[u, 0.33, D - 0.24], [u + 0.01, 0.33 + r.f(1.1, 1.36), D - 0.1]], 0.018, 5, r.pick(cols), { emit: 0.12 });
  // and a row hung in the front of the shop, where the street can see how long they are
  g.box(u0 + 2.6, 2.3, 0.42, u1 - 0.2, 2.35, 0.48, '#8d6a48');
  for (let u = u0 + 2.75; u < u1 - 0.3; u += 0.19) {
    const L = r.f(1.08, 1.34), c = r.pick(cols);
    g.tube([[u, 2.25 - L, 0.45], [u, 2.25, 0.45]], 0.019, 6, c, { emit: 0.16 });
    g.box(u - 0.003, 2.25, 0.447, u + 0.003, 2.3, 0.453, '#d9d2c0', { skip: 'tb' });
    for (let k = 0; k < 6; k++) g.box(u - 0.006, 2.25 - L * (0.3 + 0.1 * k), 0.43, u + 0.006, 2.25 - L * (0.3 + 0.1 * k) + 0.012, 0.4315, '#1c1814', { skip: 's' });
  }
  deck.put('wbench', { p: run.pt(u0 + 1.5, 0, 1.55), yaw: run.yaw });
  deck.put('wbench', { p: run.pt(u1 - 1.4, 0, 3.6), yaw: run.yaw });
  for (let i = 0; i < 5; i++) g.tube([[u0 + 0.7, 0.9, 1.33 + i * 0.1], [u0 + 0.7 + r.f(1.1, 1.3), 0.9, 1.36 + i * 0.1]], 0.017, 5, cols[i % 6], { emit: 0.1 });
  const pu = (u0 + u1) / 2 + 1.1, pv = 2.0;
  deck.people([{ p: run.pt(pu, 0, pv), yaw: yo, color: '#3f6f8a' }, { p: run.pt(u0 + 1.4, 0, 2.25), yaw: yo + 0.2, color: '#8c8577' }, { p: run.pt(pu - 1.5, 0, 1.2), yaw: yo + Math.PI - 0.5, child: true }]);
  g.tube([[pu - 0.12, 1.5, pv - 0.16], [pu + 1.12, 1.44, pv - 0.3]], 0.017, 5, '#e3d9b0', { emit: 0.15 });
  P.done();
}
// chair menders: old chairs in to be re-glued, upside down on trestles; mended ones waiting along the wall
function fitMenders(deck, b, run) {
  const P = deck.pen(run, (b.u0 + b.u1) / 2, 'av'), g = P.g, u0 = b.u0 + 0.5, u1 = b.u1 - 0.5, r = makeRng('menders'), yo = facing(run);
  for (const [u, v, kind, col] of [[u0 + 1.3, 1.5, 'short', '#8d6a48'], [u0 + 4.6, 1.9, 'rack', '#6a4a30']]) {
    for (const du of [-0.4, 0.4]) g.box(u + du - 0.04, 0, v - 0.35, u + du + 0.04, 0.7, v + 0.35, '#a98a5f', { skip: 'b' });
    g.at(u, 1.14, v, 0.4).rot('z', Math.PI);
    drawChair(g, kind, 0, col, shade(col, 1.3));
    g.pop().pop();
  }
  deck.put('wbench', { p: run.pt(u1 - 1.4, 0, 1.7), yaw: run.yaw });
  for (let i = 0; i < 6; i++) deck.put('second', { p: run.pt(u0 + 0.5 + i * 0.75, 0, SHOP_DEEP - 0.7), yaw: run.yaw + r.f(-0.15, 0.15), color: WOODS[4 + (i * 5) % 9] });
  deck.put('shelf', { p: run.pt(u1 - 0.9, 0, SHOP_DEEP - 0.24), yaw: run.yaw, color: '#b9a070' });
  // mended and waiting to go home, set out by the door
  for (let i = 0; i < 3; i++) { const q = run.pt(u1 - 3.3 + i * 0.7, 0, 0.75); if (deck.clear(q[0], 1.2, q[2], 1.3)) deck.put('second', { p: q, yaw: run.yaw + r.f(-0.3, 0.3), color: WOODS[9 + i] }); }
  deck.people([{ p: run.pt(u0 + 1.3, 0, 2.25), yaw: yo, color: '#55636b' }, { p: run.pt(u1 - 1.4, 0, 2.35), yaw: yo + 0.1, color: '#d7d2c4' }, { p: run.pt(u0 + 3.2, 0, 0.9), yaw: yo + Math.PI + 0.3 }]);
  P.done();
}

// ---------------------------------------------------------------- the signing
// On the court's floor: a bench, her second chair turned over on it (its seat on the bench, its back hanging over the
// spinward edge, its legs in the air), and a girl of about fifteen bent over it with a pen. The underside of the
// seat is the paper's (see paintPanel); her forearm and the pen are the mover's, and follow the ink. Returns write(t).
const SEAT = 0.86 + 0.031, PANEL_W = 0.34, PANEL_H = 0.32;
function buildSigning(deck, M, paper, atlas) {
  const [bx, bz] = BENCH, P = deck.pen(new Run(0, 0, 0, 0), bx, 'signing'), g = P.g, top = 0.86, wood = '#b39468', cx = bx + 0.25, cz = bz;
  g.box(bx - 0.38, top - 0.09, bz - 1.0, bx + 0.38, top, bz + 1.0, '#a98f6a', { top: '#b9a27c' });
  for (const sx of [-0.3, 0.3]) for (const sz of [-0.9, 0.9]) g.box(bx + sx - 0.045, 0, bz + sz - 0.045, bx + sx + 0.045, top - 0.09, bz + sz + 0.045, wood, { skip: 'tb' });
  g.box(bx - 0.3, 0.2, bz - 0.9, bx + 0.3, 0.24, bz + 0.9, shade(wood, 0.9));
  g.box(bx - 0.2, top, bz + 0.62, bx - 0.02, top + 0.012, bz + 0.86, '#e9e4d6').cyl(bx + 0.1, top, bz + 0.72, 0.045, 0.04, 0.09, 8, '#55636b', { smooth: false });   // a cloth and the oil
  g.at(cx, top + 0.44, cz, Math.PI / 2).rot('z', Math.PI);
  drawChair(g, 'hers', 0, '#b9864a', '#c99a5b');
  g.pop().pop();
  paper.quad([cx, SEAT, cz], [0, 0, 1], [1, 0, 0], PANEL_W / 2, PANEL_H / 2, [PANEL.x, PANEL.y, PANEL.w, PANEL.h], null, 0, 1);
  deck.sign(['Sold', '125 kWh'], { at: [bx - 0.16, top + 0.004, bz - 0.66], up: Math.PI / 2, w: 0.22, h: 0.13, style: 'card', font: 'serif', font2: 'cond', head: true });
  // the girl: to one side of the chair and bent to it, a yellow scarf over her hair, her left hand steadying the
  // chair by a leg, her right arm in between the two legs nearest her
  const X0 = bx - 0.58, Z0 = bz - 0.4, smock = '#3f6f8a', skin = SKIN[1];
  const ball = (x, y, z, r, col, o) => { g.at(0, 0, 0, 0, [-1, 1, 1]); g.blob(-x, y, z, r, 1, col, o); g.pop(); };
  for (const sz of [-0.15, 0.03]) g.box(X0 - 0.08, 0, Z0 + sz, X0 + 0.08, 0.8, Z0 + sz + 0.12, '#4a4f58', { skip: 'b' }).box(X0 - 0.09, 0, Z0 + sz - 0.005, X0 + 0.14, 0.06, Z0 + sz + 0.125, '#2a2422', { skip: 'b' });
  g.push(new Matrix4().makeTranslation(X0, 0.76, Z0 + 0.03).multiply(new Matrix4().makeRotationZ(-0.44)));
  g.cyl(0, 0, 0, 0.2, 0.165, 0.6, 6, smock, { smooth: false, squash: [0.78, 1.08] });
  g.pop();
  g.box(X0 + 0.2, 1.21, Z0 - 0.18, X0 + 0.32, 1.31, Z0 + 0.24, smock);
  g.cyl(X0 + 0.32, 1.29, Z0 + 0.05, 0.05, 0.05, 0.07, 6, skin, { smooth: false });
  ball(X0 + 0.39, 1.42, Z0 + 0.07, [0.1, 0.112, 0.1], skin, { shadeBottom: 0.82 });
  ball(X0 + 0.36, 1.47, Z0 + 0.07, [0.112, 0.085, 0.115], '#f5b800', { shadeBottom: 0.9, lump: 0.1 });
  g.cube(X0 + 0.25, 1.43, Z0 + 0.07, 0.07, 0.09, 0.08, '#e2a800');
  const arm = (gg, pts, col) => gg.tube(pts, 0.04, 5, col, { smooth: false });
  const lh = [cx - 0.178, top + 0.33, cz - 0.193];
  arm(g, [[X0 + 0.27, 1.26, Z0 - 0.15], [X0 + 0.5, 1.1, Z0 - 0.02], [lh[0] - 0.04, lh[1] + 0.01, lh[2] - 0.03]], smock);
  ball(lh[0] - 0.03, lh[1], lh[2] - 0.02, 0.052, skin, { shadeBottom: 0.85 });
  P.done();
  // her writing arm: the elbow stays, the forearm turns about it, and the pen's tip is where the ink has got to
  const S = [X0 + 0.27, 1.26, Z0 + 0.23], E = [bx - 0.12, 1.02, cz - 0.07], T0 = [cx, SEAT + 0.003, cz], wr = [cx - 0.115, SEAT + 0.045, cz + 0.05];
  M.part(0, S, (mg) => arm(mg, [S, E], smock));
  M.part(CH_PEN, E, (mg) => {
    arm(mg, [E, wr], smock);
    mg.at(0, 0, 0, 0, [-1, 1, 1]); mg.blob(-(wr[0] + 0.045), wr[1] - 0.012, wr[2], [0.045, 0.028, 0.04], 1, skin, { shadeBottom: 0.85 }); mg.pop();
    mg.tube([[T0[0] - 0.105, T0[1] + 0.15, T0[2] + 0.055], [T0[0] - 0.012, T0[1] + 0.017, T0[2] + 0.006]], 0.0055, 5, '#e2b23a', { smooth: false });
    mg.tube([[T0[0] - 0.012, T0[1] + 0.017, T0[2] + 0.006], T0], 0.004, 4, INK, { smooth: false });
  });
  const R0 = Math.hypot(T0[0] - E[0], T0[2] - E[2]), A0 = Math.atan2(T0[2] - E[2], T0[0] - E[0]);
  // where the pen's tip is for line i of the lettering when a share f of that line is written
  const lineX = [cx + (0.5 - 268 / PANEL.h) * PANEL_H, cx + (0.5 - 392 / PANEL.h) * PANEL_H];
  const tipAt = (i, f) => { const a = atlas.sig.a, u0 = i ? a.z : a.x, u1 = i ? a.w : a.y, u = u0 + (u1 - u0) * f; return [lineX[i], cz + ((u * AW - PANEL.x) / PANEL.w - 0.5) * PANEL_W]; };
  return (t) => {
    const w0 = clamp((t - 48.4) / 2.0, 0, 1), w1 = clamp((t - 50.75) / 0.9, 0, 1), between = smoothstep(50.4, 50.75, t), writing = (w0 > 0 && w0 < 1) || (w1 > 0 && w1 < 1) ? 1 : 0;
    const a = tipAt(0, w0), b = tipAt(1, w1), tx = a[0] + (b[0] - a[0]) * between + writing * 0.012 * Math.sin(t * 17), tz = a[1] + (b[1] - a[1]) * between;
    const lift = 0.012 * (1 - writing) + 0.02 * Math.sin(Math.PI * between), ang = Math.atan2(tz - E[2], tx - E[0]), rad = Math.hypot(tx - E[0], tz - E[2]);
    // a turn about the elbow's own up puts the tip on the right bearing; a small shift along it, at the right reach
    M.turn(CH_PEN, [0, 1, 0], A0 - ang);
    M.shift(CH_PEN, (rad - R0) * Math.cos(ang), lift, (rad - R0) * Math.sin(ang));
    paper.mat.uniforms.uSigB.value.set(PANEL.w / AW, atlas.sig.mid, w0 + w1);
  };
}

// people of any height, standing: the kit's crowd makes everyone full grown, and half of these are fourteen
function standers(deck, spots, seed) {
  const r = makeRng(seed), by = new Map();
  for (const s of spots) { const skin = SKIN[Math.floor(r() * SKIN.length)]; let a = by.get(skin); if (!a) by.set(skin, a = []); a.push({ p: s.p, yaw: s.yaw, scale: s.scale || 1, color: s.color, walk: [0, 0, 0, 0] }); }
  for (const [skin, items] of by) for (const m of instances(figureGeo(skin, 'stand'), deck.walk, items, { frame: deck.frame, walk: true })) deck.group.add(m);
}
// who is in the court: the buyer, the teacher and half the school round the bench; people looking up at the walls;
// people crossing; a few on benches
function* peopleCourt(deck, dens, pts) {
  const r = makeRng('firsts-folk'), [bx, bz] = BENCH, ring = [];
  const smocks = ['#d7d2c4', '#c9d6dc', '#8c8577', '#e7e1d3', '#8fa3ab', '#d7d2c4', '#3f6f8a', '#c7a36a', '#e2c14a', '#55636b', '#b5553f', '#6f9a3e', '#2f3b45', '#d98c2b'];
  // nobody stands under the flight where it is low (the kit's own test is a sphere, and the flight comes down from above)
  const low = pts.filter((p) => p.y < 3.8 && p.x > CX0 + 1), off = (x, z, rad) => low.every((p) => (p.x - x) ** 2 + (p.z - z) ** 2 > rad * rad);
  const free = (x, z) => off(x, z, x > bx + 0.6 ? 1.7 : 1.15) && !(Math.abs(x - bx) < 0.75 && Math.abs(z - bz) < 1.3) && Math.hypot(x - bx + 0.58, z - bz + 0.4) > 0.8 && !ring.some((q) => Math.hypot(q.p[0] - x, q.p[2] - z) < 0.5);
  const face = (x, z, j = 0.2) => Math.atan2(bx + 0.25 - x, bz - z) + r.f(-j, j);
  ring.push({ p: [bx + 0.3, 0, bz + 1.5], yaw: Math.PI, color: '#b5402a', scale: 1.04 }, { p: [bx + 0.85, 0, bz + 1.45], yaw: Math.PI + 0.3, color: '#e2c14a', scale: 0.62 });      // the buyer, and whoever the chair is for
  ring.push({ p: [bx - 0.2, 0, bz - 1.65], yaw: 0.1, color: '#55636b', scale: 1.03 });                                                                                          // her teacher
  for (let i = 0, n = Math.round(70 * Math.min(1.2, dens)); i < 400 && ring.length < n; i++) {
    const a = r() * TAU, rad = 1.45 + 2.4 * r() * r(), x = bx + 0.25 + Math.cos(a) * rad, z = bz + Math.sin(a) * rad * 1.15;
    if (free(x, z)) ring.push({ p: [x, 0, z], yaw: face(x, z), color: r.pick(smocks), scale: r() < 0.72 ? r.f(0.8, 0.93) : r.f(0.95, 1.04) });
  }
  yield 'firsts: people';
  standers(deck, ring, 'firsts-ring');
  yield 'firsts: people';
  const spots = [];
  // looking up at the long wall, and at the other two
  for (let i = 0; i < 26 * dens; i++) { const x = r.f(34, 64), z = r.f(8.6, 10.2); if (deck.clear(x, 1.5, z, 1.4) && (x < 28.5 || x > 34.5)) spots.push({ p: [x, 0, z], yaw: r.f(-0.3, 0.3), child: r() < 0.2 }); }
  for (let i = 0; i < 9 * dens; i++) { const z = r.f(-10, 10), x = CX1 - r.f(1.6, 3); if (Math.abs(z) > 3 && deck.clear(x, 1.5, z, 1.4)) spots.push({ p: [x, 0, z], yaw: Math.PI / 2 + r.f(-0.3, 0.3), child: r() < 0.2 }); }
  for (let i = 0; i < 8 * dens; i++) { const z = r.f(-10, 3.5), x = CX0 + r.f(1.6, 3); if (deck.clear(x, 1.5, z, 1.4)) spots.push({ p: [x, 0, z], yaw: -Math.PI / 2 + r.f(-0.3, 0.3), child: r() < 0.2 }); }
  // crossing the floor, and standing about on it
  const lane = (x, z, m) => x < 36 && Math.abs(z - 6.45) < m;      // where people come out of the street
  for (let i = 0; i < 26 * dens; i++) { const x = r.f(4, 62), z = r.f(-11, 7.5), rad = r.f(0.8, 2.6); if (Math.hypot(x - bx, z - bz) > 7 && !lane(x, z, rad + 0.8) && deck.clear(x, 1.5, z, rad + 1.4)) spots.push({ p: [x, 0, z], walk: rad, child: r() < 0.2 }); }
  for (let i = 0; i < 9 * dens; i++) { const x = r.f(5, 60), z = r.f(-10.5, 6); if (Math.hypot(x - bx, z - bz) > 7 && !lane(x, z, 1.6) && deck.clear(x, 1.5, z, 2.2)) deck.knot(x, 0, z, 2 + Math.floor(r() * 3), r); }
  for (let i = 0; i < 2; i++) deck.put('robot', { p: [3, 0, -10.5 + i * 3.2], yaw: Math.PI / 2, drift: [0.5, 0, 0, 120], phase: 0.12 + i * 0.41, color: '#d9d4c8' });      // sweeping up shavings
  for (const [x, z, yaw] of [[14, -4.5, 0], [22, 1.5, Math.PI], [38, -7.5, 0], [58, 5.5, Math.PI], [8, 3, Math.PI / 2]]) if (deck.clear(x, 1.4, z, 2.2)) {
    deck.put('bench', { p: [x, 0, z], yaw, color: '#b39468' });
    if (r() < 0.85) spots.push({ p: [x + r.f(-0.4, 0.4) * Math.cos(yaw), 0.45, z], sit: true, yaw: yaw + Math.PI });
  }
  deck.people(spots);
}

export const yarrowFirsts = {
  id: 'yarrow-firsts',
  title: 'Make it twice', drum: 'Yarrow', row: 'Herb Row', kind: 'a maker drum', light: 0.0,
  line: 'Yarrow says make it twice. Your first try goes up on the court wall, where everyone can see what is wrong with it, and the second you sign underneath and sell. I counted chairs on that wall until four hundred and had not got off the first storey.',
  tone: '#c9d6dc', source: '15-canon.js (Yarrow), daily-life.md (Mass is the price), work.md (The tech level), sorrel.md (Flute Row)',
  sound: { root: 53, scale: 'lydian', pad: 0.4, air: 0.2, hum: 0.3, crowd: 0.4, bells: 0.2, bright: 0.75 },
  *build(ctx) {
    const frame = makeFrame(204 * DEG, 1620, RADIUS), dens = ctx.density || 1, HY = 1.8, [bx, bz] = BENCH;
    // along the street past the turners and the flute maker; out at the foot of the long wall and up it, close; past
    // the tower as the chair on its hoist comes level; a look down the court's whole length; across it over the lathes
    // of the third terrace; down to the bench, over the girl's shoulder, onto the name; and out along the floor
    // through the hoop.
    // The view never turns faster than about thirty degrees a second (tools/gaze.mjs: mean 9, peak 29). Every look
    // point is six to ten metres from its own key, the first key has one too (left to itself it looks sixty metres
    // ahead, and the curve through the look points then swings back), and the one long turn, from the hoist on one
    // wall to the terraces opposite, is spread over the whole crossing and goes by way of the court's far end.
    // The signing's seconds are the same in buildSigning(): the name from 48.4 to 50.4, the day from 50.75 to 51.65.
    const keys = (xe) => [
      { t: 0, p: [-34.6, 1.65, 7.7], look: [-27, 1.6, 9.0] },
      { t: 2.6, p: [-31.3, 1.65, 8.2], look: [-24.6, 1.3, 12.0] },
      { t: 4.6, p: [-28.0, 1.65, 8.5], look: [-21.6, 1.3, 12.5] },
      { t: 6.3, p: [-23.7, 1.65, 8.4], look: [-16, 1.45, 7.9] },
      { t: 8, p: [-18.5, 1.65, 8.3], look: [-11.5, 1.45, 5.0] },
      { t: 10.5, p: [-10, 1.68, 8.5], look: [-3, 1.5, 10.9] },
      { t: 12.6, p: [-3.2, 1.75, 8.9], look: [7, 2.6, 12.6] },
      { t: 14.6, p: [2.4, 1.9, 9.5], look: [10, 12, 13] },
      { t: 18.5, p: [8, 3.0, 11.0], look: [13.5, 4.6, 13], fov: 50 },
      { t: 22.5, p: [14.5, 6.2, 11.25], look: [19.5, 7.6, 13], fov: 48 },
      { t: 26.5, p: [22, 10.2, 9.4], look: [30, 12.6, 11.3] },
      { t: 29.3, p: [27.3, 13.2, 7.7], look: [31.5, 14.9, 10.4] },
      { t: 31.6, p: [31.6, 14.8, 4.6], look: [39.6, 14.0, 5.2] },
      { t: 34.2, p: [36.6, 15.2, -1.6], look: [44.5, 13.6, -5.8] },
      { t: 36.6, p: [41.6, 15.0, -8.4], look: [48, 13.2, -15.0] },
      { t: 38.5, p: [45.3, 14.3, -13.2], look: [51.8, 12.9, -19.2] },
      { t: 40.6, p: [46.0, 12.6, -10.6], look: [55.5, 8.5, -11.5] },
      { t: 42.6, p: [45.5, 9.4, -6.2], look: [53, 2.5, -3.2] },
      { t: 44.4, p: [45.0, 6.0, -1.9], look: [50.6, 1.0, -0.3] },
      { t: 46.2, p: [47.0, 3.0, 0.9], look: [50.3, 1.0, -0.05], fov: 52 },
      { t: 48, p: [bx - 1.15, 1.86, bz + 0.42], look: [bx + 0.27, SEAT, bz], fov: 42 },
      { t: 49, p: [bx - 0.7, 1.68, bz + 0.2], look: [bx + 0.27, SEAT, bz], fov: 36 },
      { t: 49.8, p: [bx - 0.6, 1.66, bz + 0.16], look: [bx + 0.27, SEAT, bz], fov: 34 },
      { t: 51.9, p: [bx - 0.55, 1.66, bz + 0.15], look: [bx + 0.3, SEAT, bz], fov: 33 },
      { t: 52.5, p: [bx - 0.42, 1.7, bz + 0.12], look: [bx + 0.62, SEAT + 0.08, bz], fov: 40 },
      { t: 53.0, p: [bx - 0.2, 1.77, bz + 0.09], look: [bx + 1.35, 1.12, 0], fov: 50 },
      { t: 53.5, p: [bx + 0.15, 1.86, bz + 0.04], look: [bx + 2.9, 1.36, 0], fov: 56 },
      { t: 54.0, p: [bx + 0.7, 1.99, bz - 0.04], look: [bx + 5, 1.62, 0] },
      { t: 54.9, p: [bx + 2.2, 2.22, bz - 0.18], look: [bx + 8, 1.8, -0.05] },
      { t: 58.5, p: [bx + 10, 1.85, -0.05], look: [CX1 + 1, HY, 0] },
      { t: 62, p: [xe, HY, 0] },
    ];
    const popts = { frame, entryRadius: 1.2, exitRadius: 1.6 };
    let path = makePath(keys(CX1 + 1.8), popts);
    path = makePath(keys(CX1 + 1.8 + (CX1 + 0.3 - path.exit.flat.x)), popts);        // so that the opening stands inside the hoop
    yield 'firsts: path';
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'yarrow-firsts', palette: WHITEPAL, light: { level: 1.1, ambUp: '#5c676e', ambDown: '#3f484e', ambPower: 0.8 }, floor: { shine: 0.9 }, detail: 44, clock: 'flight' });
    yield 'firsts: deck';
    addProtos(deck);
    const M = makeMover(deck), atlas = makeAtlas();
    yield 'firsts: atlas';
    const paper = makePaper(deck, atlas);
    yield 'firsts: paper';

    // ---- Apprentice Street: it runs spinward (so it climbs away ahead) and comes out in the court's corner
    const court = ['The court', 'First tries go on the wall.', 'Second tries are for sale.'];
    const nine = ['Nine', 'Twelve courses,', 'all from the Mill.', 'You pay for the cooks.'];
    const fits = [];      // what is in each open workshop: done after the street, a step each
    yield* street(deck, {
      axis: 'x', from: -96, to: CX0, at: ZS, y: 0, width: SW, cloth: 0.5,
      lamps: { every: 6, kind: 'panel', power: 1.0 },
      plates: [{ at: -25, lines: ['Apprentice Street', 'School Quarter, Yarrow'], w: 2.6 }],
      folk: { stand: 5, stroll: 4, walk: 0, kids: 0 },
      fronts: {
        back: [
          { from: -38.5, to: -31, kind: 'shop', name: 'Offcuts', sub: ['Sorted by wood', 'and by colour'], goods: 'toys', awning: false, blade: true, lit: 1, open: true, doorSide: 0 },
          { from: -31, to: -20, kind: 'custom', id: 'turners', draw: (P, b, run, H) => { openShop(deck, P, b, run, H, { name: 'Turners', sub: ['Legs and rungs', 'while you wait'] }); fits.push(() => fitTurners(deck, M, b, run)); } },
          { from: -20, to: -17, kind: 'stair', sub: 'Up 59, down 57' },
          { from: -17, to: -12.6, kind: 'wall', bench: false, notice: court },
          { from: -12.6, to: -1.4, kind: 'custom', id: 'menders', draw: (P, b, run, H) => { openShop(deck, P, b, run, H, { name: 'Chair menders', sub: ['Re-glued, re-sprung', 'and re-covered'], beam: '#3f5f73' }); fits.push(() => fitMenders(deck, b, run)); } },
          { from: -1.4, to: 0, kind: 'wall', bench: false },
        ],
        front: [
          { from: -31, to: -25.5, kind: 'shop', name: 'Glue and pegs', goods: 'jars', awning: false, blade: false, lit: 1 },
          { from: -25.5, to: -21, kind: 'home' },
          { from: -21, to: -11.5, kind: 'custom', id: 'flutes', draw: (P, b, run, H) => { openShop(deck, P, b, run, H, { name: 'Flutes', sub: ['Tuned in', 'our own air'], beam: '#6b5a3c' }); fits.push(() => fitFlutes(deck, b, run)); } },
          { from: -11.5, to: -7, kind: 'wall', bench: false, notice: nine, noticeStyle: 'chalk' },
          { from: -7, to: -1.6, kind: 'shop', name: 'Kite cloth', goods: 'cloth', awning: false, blade: false, lit: 1, props: false },
          { from: -1.6, to: 0, kind: 'wall', bench: false },
        ],
      },
      fill: { mix: { shop: 2.4, home: 1.6, wall: 0.3, stall: 0.4 }, numbers: 31, trades: [['Seat cane', 'cloth'], ['Tea', 'tea'], ['Tool grinder', 'pots'], ['Paper and string', 'paper'], ['Noodles', 'noodles'], ['Lamps', 'lamps'], ['Varnish', 'bottles'], ['Bread', 'bread']] },
    });
    for (const fit of fits) { fit(); yield 'firsts: workshops'; }
    deck.lattice({ origin: [-30.5, 2.3, 2.3], spacing: [2.6, 12.4], count: [10, 2], color: '#f4f9ff', power: 1.1, reach: 3.3, drop: 3.4 });
    // People walking the street and on into the court, and out of it again, on the flight's own clock: where a line
    // of walkers ends they fade, and each line here ends where the flight is not looking when anyone gets there
    const wr = makeRng('firsts-walkers');
    for (const x0 of [-74, -62, -52, -43, -32, -21, -16]) deck.walkersAlong({ from: [-96, 0, 6.45], to: [34, 0, 6.45], n: x0 % 2 ? 2 : 1, spread: 0.2, speed: 1.2, start: x0 + 96, rng: wr });
    for (const x0 of [-3, -9, 8, 17]) deck.walkersAlong({ from: [26, 0, 10.6], to: [-96, 0, 10.6], n: x0 % 2 ? 1 : 2, spread: 0.2, speed: 1.25, start: 26 - x0, rng: wr });
    deck.walkersAlong({ from: [26, 0, 10.45], to: [-96, 0, 10.45], n: 4, spread: 0.3, speed: 3.6, child: 1, start: 26 + 6, rng: wr });      // children race anti: that way they weigh a little less
    // Two apprentices on their way to the hoist, each with a first try upside down on their head: they keep ahead of
    // the flight all down the street and it follows them out into the court. And coming the other way, somebody
    // taking a second try home.
    deck.proto('carried', (g) => { g.at(0, 0.44, 0).rot('z', Math.PI); drawChair(g, 'lean', 1); g.pop().pop(); });
    deck.proto('bought', (g) => { g.at(0, 0.44, 0).rot('z', Math.PI); drawChair(g, 'good', 1); g.pop().pop(); });
    [[-11.5, 6.3, '#ead6aa', '#3f6f8a', 0.92, 1], [-7, 6.75, '#dcb97c', '#d7d2c4', 0.86, 1], [-15, 10.6, '#b9864a', '#6f9a3e', 1.02, -1]].forEach(([x0, z, wood, cloth, k, dir], i) => {
      const from = dir > 0 ? -96 : 26, len = dir > 0 ? 130 : 122, v = dir > 0 ? 1.2 : 1.25, drift = [dir * v, 0, 0, len / v], phase = Math.abs(x0 - from) / len;
      deck.pacers.push({ p: [from, 0, z], yaw: dir * Math.PI / 2, drift, phase, color: cloth, child: false, skin: SKIN[1 + i * 2], scale: k });
      deck.put(dir > 0 ? 'carried' : 'bought', { p: [from, 1.745 * k, z], yaw: -dir * Math.PI / 2, drift, phase, color: wood, scale: k });
    });
    yield 'firsts: street';

    // ---- the court, its walls of first tries, the tower, the terraces, the signing
    yield* buildCourt(deck, HY);
    const count = yield* hangWalls(deck, ctx, paper);
    yield* buildTower(deck, M);
    yield 'firsts: tower';
    yield* buildTerraces(deck, M, dens);
    const write = buildSigning(deck, M, paper, atlas);
    deck.zone({ min: [bx - 1.7, -0.5, bz - 1.9], max: [bx + 1.9, 2.6, bz + 1.9], soft: 1.3, color: '#ffffff', power: 0.22, side: 0.8, under: 0.6 });
    yield* peopleCourt(deck, dens, path.points(0.2));
    yield 'firsts: people';
    yield* atlas.paint();
    yield '~firsts: atlas';
    // the page's own type may not have arrived when the tags were first lettered: letter them again when it has
    if (typeof document !== 'undefined' && document.fonts && document.fonts.status !== 'loaded' && document.fonts.ready) {
      document.fonts.ready.then(() => { if (atlas.tex.userData.gone) return; const it = atlas.paint(), step = () => { if (!atlas.tex.userData.gone && !it.next().done) requestAnimationFrame(step); }; step(); });
    }
    atlas.tex.addEventListener('dispose', () => { atlas.tex.userData.gone = true; });
    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);
    scene.add(paper.mesh());
    yield 'firsts: paper';
    scene.add(M.mesh());
    if (ctx.engine && ctx.engine.opts && ctx.engine.opts.debug) console.log(`[yarrow-firsts] ${count.things} first tries hung (${count.lod.join(' / ')} by detail, ${Math.round(count.tris / 1000)}k triangles); ${count.firstDeck} chairs on the first deck of the long wall`);

    const up = [0, 1, 0], along = [1, 0, 0];
    const update = (t) => {
      const now = G.uTime.value, h = hoistAt(t);
      deck.tick(t);
      M.turn(CH_ROPE, [0, 0, 1], h.lean); M.shift(CH_ROPE, 0, 0, 0, h.len / ROPE0);
      M.turn(CH_CHAIR, up, 0.3 * Math.sin(now * 0.5)); M.shift(CH_CHAIR, h.len * Math.sin(h.lean), h.rise + h.len * (1 - Math.cos(h.lean)), 0);
      M.turn(CH_WINCH, along, -h.turns);
      for (let i = 0; i < 3; i++) M.turn(CH_LATHE + i, along, (now * [13.1, -10.3, 15.7][i]) % TAU);
      M.turn(CH_KITE, up, 0.7 * Math.sin(now * 0.45)); M.turn(CH_KITE + 1, up, 0.6 * Math.sin(now * 0.37 + 1.3));
      M.shift(CH_PLANE, 0.22 + 0.2 * Math.sin(now * 2.7), 0, 0);
      write(t);
    };
    update(0);
    return {
      scene, path, deck, near: 0.1, far: 420,
      look: { exposure: 1.18, bloom: 0.16, threshold: 1.0, saturation: 1.03, vignette: 0.42, contrast: 1.04, gain: [0.985, 1.0, 1.03] },
      portal: { rim: false, mist: '#c9d6dc' },
      update,
    };
  },
};

