// Spelt, Grain Row: half past four on the Baker's Arcade. Spelt's lamps come up at 04:30, two hours before anyone
// else's, and "Grain Row says Spelt's day starts so early it meets the last one coming home". This is that half hour,
// on deck 17 (0.98 g), one of the Low decks by a station ring: the arcade in the lamp-night, every second front a
// bakery with its door open, the night crews going home the other way with loaves under their arms. Pell's is the long
// one. Benches where a dozen bakers shape loaves, proving racks on wheels, a wall of electric deck ovens, peels,
// cooling racks; and at the back the crock room, where every spoon of starter a wanderer leaves is kept under a card
// that gives its drum and its row, and the year's mother stands in a crock the size of a barrel
// (docs/wander-year.md, Day 290 and Day 365; games/three-nights/src/15-canon.js, Spelt: lamps "04:30", "Crock Room",
// "Ovenside", "Baker's Arcade", the palette "Crust", "Leave a spoon."; docs/eating-out.md, The Crock; docs/ashgrove.md,
// Day one: lamps "come up over twenty minutes, warm and then white"; docs/food-system.md and docs/cuisine.md: flour is
// Mill starch and vat gluten, grain is kept for ritual; docs/daily-life.md, Rhythm and Prices). worlds/spelt_loaf.js is
// the same morning in the Hollow: the docs put Pell's crock room indoors, by the Gate, and this is that room.
//
// y = 0 is the floor of deck 17. x is spinward: the camera goes in spinward and the night crews come home anti, which
// at a walk of 1.35 m/s makes each of them 2u/V = 2 x 1.35 / (0.0572 x 2,936) = 1.6% lighter than standing still.
// Nothing else of the drum's turning can be seen in a room 3 m high: flour dropped from a bench (0.9 m, 0.43 s) lands
// w g t^3 / 3 = 1.5 cm anti of plumb, which is less than a baker's thumb, so the flour here falls straight.
//
// Not canon (the docs give Pell, his crock room, the Gate and the strain library, the 212 drums and the heel for the
// road, the lamps at half past four and the names Baker's Arcade, Ovenside and Crock Room):
//   - the arcade's look: a bakery at every second front, their trades' names, the homes between them, a street clock
//   - the bakehouse's plan: 16 m wide and 40 m deep behind its front, benches, racks, the crock room opening off its
//     far end through an arch, that room being two decks tall, and its shelves on three walls
//   - the ovens: sixteen electric deck ovens of three decks each in one bank, their numbers, drop doors and hoods, and
//     which of them bakes what (the slate gives the raft loaf to the sixteenth, which is the way out of this world)
//   - "since two", and what is chalked on the bakery's slates (a loaf at about 1 kWh and a country loaf at 1.10 are
//     the docs' prices; the night's counts are not)
//   - the tally slate on the mother, and Pell chalking it while the flight watches: he is at the arch as the flight
//     comes by, comes in to the mother's table behind it while it reads the cards, and is found stooped to the slate,
//     where he makes the 213th stroke, puts a line through 212 and writes 213 under it (with his left hand); the
//     wanderer standing by with her spoon to watch
//   - the cloths over the crocks swelling and sinking in a few seconds (a starter rises, but over hours: the hours
//     are pressed into the minute, as the dawn is in spelt_loaf)
//   - the pencilled note "says it is Chervil" (the docs have Marit confess that her Chervil spoon was Lovage's, and
//     Pell say half the spoons are lies)
//   - which crocks stand where, their glazes, and a card on each (the drums and rows lettered are the docs'); a crock
//     for Spelt itself among them; the table of small jars "For the Gate" and "Back from the library"; the drum's
//     motto painted over the arch
//   - a baker handing loaves to the crews through a hatch in Pell's front; one of the young ones showing Pell a loaf;
//     the rack pushed up the oven lane; the notices about spoons and oven doors, and the sacks' labels
import { Scene, Matrix4, ShaderMaterial, Vector3, Color, InstancedBufferAttribute } from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, street, PALETTES } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, litMaterial, glowPoints } from '../kit/mats.js';
import { Geo, instances, shade, mixc } from '../kit/geo.js';
import { SKIN, CLOTH } from '../kit/folk.js';
import { makeRng, smoothstep, clamp } from '../core/rng.js';

// ---------------------------------------------------------------- the place, in the frame of deck 17
const AW = 4;                                 // half the arcade's width: its back fronts stand at z = AW
const BX0 = -8, BX1 = 8;                      // the bakehouse, behind its front on the arcade's back side
const BZ0 = AW + 0.3, BZ1 = 44.5, H = 3;      // its front wall's inner face, its far wall, its ceiling
const DOORW = 1.7;                            // half the width of Pell's door, which is at x = 0
const OVX = 6.9;                              // the face of the bank of ovens
const OV0 = 10, OVP = 2, NOV = 16;            // the first oven's middle, their pitch along z, how many
const DECKS = [0.62, 1.30, 1.98];             // the sills of an oven's three decks
const MW = 1.3, MH = 0.5;                     // an oven's mouth: the way out of this world is one of them
const HERO = 6, HEROZ = OV0 + HERO * OVP;     // the oven whose door opens on a loaded peel as the flight goes by
const EXITZ = OV0 + (NOV - 1) * OVP;          // the last oven: the flight leaves by its middle deck
const EXITY = DECKS[1] + MH / 2;
const ARCH = [37.0, 41.8];                    // the arch into the crock room, in the bakehouse's anti wall
const CX0 = -19.5, CX1 = BX0 - 0.3, CZ0 = 33.5, CZ1 = 44.5, CH = 7;      // the crock room: two decks tall
const SD = 0.4;                               // how deep its shelves are
const MOTHER = [-14, 39];                     // the table in the middle of it
const PELL = [-7.1, 35.9];                    // where Pell stands, by the arch
const TAU = Math.PI * 2;

// Spelt's paint is its dawn, "Crust": #231a10, #7d5630, #e9b979, #fff5e3
const CRUST = {
  ...PALETTES.warm,
  walls: ['#d9c3a0', '#cdb38c', '#e3d2b4', '#c6a880', '#d4bb96', '#e9dcc2'],
  dado: ['#7d5630', '#6c4a2c', '#8a6238', '#5f4228'],
  trim: ['#3a2a1a', '#4a3520', '#2f2216', '#553c24'],
  doors: ['#7d5630', '#9a6a36', '#5a4630', '#b9873e', '#6a5540', '#8f5a34', '#4f4a3c', '#a87a48'],
  awnings: [['#a8582e', '#f1e3c6'], ['#7d5630', '#efe0c0'], ['#c98f4a', '#fff5e3'], ['#5f4a34', '#e6d6b6'], ['#b9773a', '#f6ead0']],
  signs: [['#231a10', '#e9b979'], ['#3a2a1a', '#fff5e3'], ['#4a3018', '#f1d9a6'], ['#f1e4c8', '#3a2a1a'], ['#2f2418', '#ffd08a'], ['#5a3a20', '#fff5e3']],
  floor: '#8a7f70', strip: '#6a5f52', court: '#b9a98e', ceiling: '#4c3c2c', rib: '#8a6f50',
  rooms: ['#f0bf78', '#e9b979', '#f6cf90', '#e2a964', '#f3c684', '#ecb46e', '#f8d69c'],
  lamp: '#ffd9a8', window: ['#ffc070', '#ffcf8a', '#ffb860', '#f6c27e'], shop: '#ffbf6c',
  goods: 0.7,
};
const IRON = '#3b3530', IRON2 = '#2a2623', STEEL = '#a9a59c', BRASS = '#8a6e3a', WOOD = '#8a6a46', WOOD2 = '#6a4e32';
const FLOUR = '#f3eee4', ELEMENT = '#ff7a2a';
const LOAF = ['#8a4f2a', '#a5632f', '#b9773a', '#7a4424', '#c08a4a', '#9a5a2c'];
const DOUGH = ['#eadfc6', '#e6d8ba', '#f0e6d0'];
const GLAZE = ['#cbb894', '#b9a27c', '#8a6a48', '#e6dcc4', '#6f5a44', '#a9b0a8', '#c9a45c', '#9a8f80', '#d9c9a6', '#7f8c8a', '#b5704a', '#5a6a70', '#8f7fa0', '#7a9a7a'];

const lerp = (a, b, t) => a + (b - a) * t;
// a face at one z looking toward -z (face < 0) or +z; a face at one x looking toward -x or +x
function wallZ(g, x0, x1, y0, y1, z, face, col, e = 0) {
  if (face < 0) g.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], col, e); else g.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, e);
}
function wallX(g, z0, z1, y0, y1, x, face, col, e = 0) {
  if (face < 0) g.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, e); else g.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], col, e);
}
const arm = (g, a, b, r, col) => g.tube([a, b], r, 4, col, { smooth: false });

// ---------------------------------------------------------------- loaves, dough, crocks
// A round loaf and a long one, each scored; a piece of dough; faces painted with tint(1) take each copy's colour.
function bouleShape(g, col = '#ffffff') { g.tint(1).blob(0, 0.075, 0, [0.14, 0.085, 0.14], 1, col, { lump: 0.07, shadeBottom: 0.62 }); g.tint(0.4).box(-0.08, 0.148, -0.012, 0.08, 0.162, 0.012, mixc(col, '#f3e2c0', 0.7), { skip: 'b' }).tint(0); }
function batardShape(g, col = '#ffffff') { g.tint(1).blob(0, 0.07, 0, [0.21, 0.078, 0.105], 1, col, { lump: 0.06, shadeBottom: 0.62 }); g.tint(0.4); for (const x of [-0.09, 0, 0.09]) g.box(x - 0.035, 0.136, -0.03, x + 0.035, 0.15, -0.012, mixc(col, '#f3e2c0', 0.7), { skip: 'b' }); g.tint(0); }
function doughShape(g) { g.tint(1).blob(0, 0.045, 0, [0.12, 0.062, 0.12], 1, '#ffffff', { shadeBottom: 0.78 }).tint(0); }
// A crock with its card tied on: straight-sided under a lid, or shouldered under a cloth. Its front is toward -z.
// The card is blank but for two lines too small to read; the ones the flight passes close are lettered over it.
const CARD = [0.2, 0.125], CARD_Y = 0.15;
function cardBlank(g, r) {
  const z = -r - 0.014, y = CARD_Y, w = CARD[0] / 2, h = CARD[1] / 2;
  g.tint(0).quad([w, y - h, z], [-w, y - h, z], [-w, y + h, z], [w, y + h, z], '#d9ceb2');
  const lines = [[y + 0.022, 0.009, [[-0.07, -0.026], [-0.014, 0.028], [0.04, 0.068]]], [y - 0.026, 0.0065, [[-0.052, -0.006], [0.004, 0.046]]]];
  for (const [yy, hh, segs] of lines) for (const [a, b] of segs) g.quad([b, yy - hh, z - 0.002], [a, yy - hh, z - 0.002], [a, yy + hh, z - 0.002], [b, yy + hh, z - 0.002], '#8f8676');
  g.tube([[0, y + h, z], [0, 0.285, -r * 0.9]], 0.004, 3, '#b9a37c');
}
function crockShape(g) {
  const r = 0.135;
  g.tint(1).cyl(0, 0, 0, r * 0.93, r, 0.27, 9, '#ffffff', { smooth: true, cap: false });
  g.tint(0.75).cyl(0, 0.27, 0, r * 1.06, r * 1.06, 0.022, 9, '#e6e6e6', { smooth: false }).cyl(0, 0.292, 0, 0.03, 0.022, 0.03, 5, '#d0d0d0', { smooth: false });
  cardBlank(g, r);
}
function jarShape(g) {
  const r = 0.14;
  g.tint(1).cyl(0, 0, 0, r * 0.8, r, 0.11, 9, '#ffffff', { smooth: true, cap: false }).cyl(0, 0.11, 0, r, r * 0.86, 0.11, 9, '#f4f4f4', { smooth: true, cap: false }).cyl(0, 0.22, 0, r * 0.86, r * 0.62, 0.035, 9, '#e9e9e9', { smooth: true, cap: false });
  g.tint(0).cyl(0, 0.255, 0, r * 0.68, r * 0.7, 0.035, 8, '#eee6d2', { smooth: false, top: '#f6efe0' });
  cardBlank(g, r);
}

// ---------------------------------------------------------------- people at work
// As kit/folk.js draws them (1.75 m, facing +z; tint 1 clothes, 0.35 legs, 0 skin and whites), with arms, an apron
// and a cap, because what a baker's hands are doing is the point: 'shape' has both hands down on the bench, 'peel'
// holds a handle at chest height, 'push' has hands on a rack's rail, 'hand' holds a loaf out.
function bakerGeo(pose, skin) { const g = new Geo(); bakerShape(g, pose, skin); return g.build(); }
function bakerShape(g, pose, skin) {
  g.tint(0.35).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#7c7870');
  g.tint(1).cyl(0, 0.82, 0, 0.22, 0.18, 0.62, 6, '#ffffff', { smooth: false });
  g.tint(0).box(-0.15, 0.9, 0.1, 0.15, 1.3, 0.2, FLOUR, { skip: 'n' }).box(-0.18, 0.46, 0.0, 0.18, 0.92, 0.135, FLOUR, { skip: 'n' });      // an apron: bib and skirt
  g.blob(0, 1.6, 0, 0.145, 0, skin, { shadeBottom: 0.8 });
  g.cyl(0, 1.675, 0, 0.152, 0.14, 0.1, 7, FLOUR, { smooth: false });
  const sh = (s) => [s * 0.22, 1.38, 0.02];
  for (const s of [-1, 1]) {
    let el, hd;
    if (pose === 'shape') { el = [s * 0.25, 1.13, 0.17]; hd = [s * 0.12, 0.99, 0.44]; }
    else if (pose === 'peel') { el = [s * 0.24, 1.2, 0.16]; hd = [s * 0.07, 1.33, 0.46]; }
    else if (pose === 'push') { el = [s * 0.25, 1.16, 0.18]; hd = [s * 0.22, 1.08, 0.47]; }
    else { el = [s * 0.24, 1.16, 0.16]; hd = [s * 0.1, 1.2, 0.46]; }
    g.tint(1); arm(g, sh(s), el, 0.055, '#ffffff');
    g.tint(0); arm(g, el, hd, 0.048, FLOUR);                                // floury to the elbow
    g.blob(hd[0], hd[1], hd[2], 0.05, 0, skin, { shadeBottom: 0.9 });
  }
  if (pose === 'hand') g.at(0, 1.2, 0.5, 0, 0.9).tint(0).blob(0, 0.03, 0, [0.14, 0.085, 0.14], 1, LOAF[1], { lump: 0.07, shadeBottom: 0.62 }).pop();
  g.tint(0);
}
// The kit's people cannot move their arms, so the bakers at the benches move their hands with their backs: each
// leans into the dough from the hips and comes up again, in a time of their own, and stops now and then to look at
// it. This is the kit's lit material with one motion written into its vertex shader, before the copy is stood in its
// place (aPhase: one number to each copy, so that each keeps a time of its own).
const SHAPING = /* glsl */`
  float busy = smoothstep(-0.35, 0.1, sin(uTime * (0.31 + 0.2 * fract(aPhase * 7.3)) + aPhase * 40.0));
  float a = (0.075 + 0.05 * fract(aPhase * 3.1)) * busy * (0.5 - 0.5 * cos(uTime * (4.2 + 1.6 * fract(aPhase * 5.7)) + aPhase * 6.283)) * smoothstep(0.84, 1.0, p.y);
  float c = cos(a), s = sin(a), y = p.y - 0.9;
  p = vec3(p.x, 0.9 + y * c - p.z * s, y * s + p.z * c);
  n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c);`;
// A starter is alive: the cloth tied over a crock swells as the mother under it rises, and sinks again, over seven to
// fifteen seconds, each crock in its own time. The cloth is a disc that the shader lifts into a low dome (highest in
// the middle, nothing where it is tied). Nothing else comes off a crock: a mother is cool.
const COVER_R = 0.097;
const SWELLING = /* glsl */`
  float w = max(1.0 - dot(p.xz, p.xz) / ${(COVER_R * COVER_R).toFixed(6)}, 0.0);
  float h = 0.006 + (0.03 + 0.03 * fract(aPhase * 3.1)) * (0.5 - 0.5 * cos(uTime * (0.42 + 0.48 * fract(aPhase * 7.3)) + aPhase * 40.0));
  if (w > 0.0) { p.y += h * w; n = normalize(vec3(p.x, ${(COVER_R * COVER_R / 2).toFixed(6)} / h, p.z)); }`;
function coverGeo() {
  const g = new Geo(), n = 10, rings = [0, 0.4, 0.7, 0.9, 1].map((f) => f * COVER_R), P = (r, i) => [Math.cos(i / n * TAU) * r, 0, Math.sin(i / n * TAU) * r];
  g.tint(1);
  for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++) {
    if (k === 0) g.tri(P(0, 0), P(rings[1], i + 1), P(rings[1], i), '#ffffff');
    else g.quad(P(rings[k], i), P(rings[k], i + 1), P(rings[k + 1], i + 1), P(rings[k + 1], i), '#ffffff');
  }
  g.cyl(0, -0.034, 0, COVER_R * 1.03, COVER_R, 0.034, n, '#e4e4e4', { smooth: false, cap: false });      // where it is tied round the neck
  return g.build();
}
// give each copy in an instanced mesh its own number for the shader's clock
function phased(m, rng) { const ph = new Float32Array(m.count); for (let i = 0; i < m.count; i++) ph[i] = rng(); m.geometry = m.geometry.clone(); m.geometry.setAttribute('aPhase', new InstancedBufferAttribute(ph, 1)); return m; }
const liveVert = (motion) => /* glsl */`
attribute vec4 aCol; attribute float aEmit; attribute float aPhase;
${BEND_PARS}
uniform float uTime;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vSoft;
void main() {
  vec3 p = position, n = normal;
  ${motion}
  p = (instanceMatrix * vec4(p, 1.0)).xyz; n = normalize(mat3(instanceMatrix) * n);
  vF = p; vFN = n;
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vec3 col = aCol.rgb;
  #ifdef USE_INSTANCING_COLOR
    col = mix(col, col * instanceColor, aCol.a);
  #endif
  vCol = col; vEmit = aEmit; vSoft = aCol.a;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const workFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uBend;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vSoft;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  float soft = vSoft * 0.45;
  N = normalize(mix(N, kUp(vW), soft)); FN = normalize(mix(FN, vec3(0.0, 1.0, 0.0), soft));
  gl_FragColor = vec4(kAir(vCol * (kLight(vW, N, vF, FN) + vEmit), vW), 1.0);
}`;
function liveMaterial(deck, motion) {
  const f = deck.frame;
  return new ShaderMaterial({ uniforms: { ...deck.rig.uniforms, uClip: G.uClip, uTime: G.uTime, uBend: { value: new Vector3(f.a0, f.z0, f.floorR) } }, vertexShader: liveVert(motion), fragmentShader: workFrag(deck.rig) });
}

// Pell: broad, an apron to the shins, floury to the elbow, a crock under each arm (three-nights' canon has him
// "carrying a crock under each arm"). Stood at a scale of about half again as wide and a head taller.
// With lean (radians) he is stooped forward from the hips, as at the mother's slate, and the arm on his left is left
// out: that arm is a mesh of its own, which writes (pellWrites).
const PELL_HIP = 0.84, PELL_S = [1.42, 1.14, 1.36], SHIRT = '#8f8a7c';
function pellGeo(skin, lean = 0) {
  const g = new Geo();
  g.tint(0.35).box(-0.19, 0, -0.12, 0.19, 0.86, 0.12, '#6f6a62');
  g.tint(0).box(-0.24, 0.32, 0.0, 0.24, 0.94, 0.17, FLOUR, { skip: 'n' });
  if (lean) g.at(0, PELL_HIP, 0).rot('x', lean).at(0, -PELL_HIP, 0);
  g.tint(1).cyl(0, 0.8, 0, 0.27, 0.22, 0.66, 8, '#ffffff', { smooth: false });
  g.tint(0).box(-0.19, 0.92, 0.1, 0.19, 1.32, 0.25, FLOUR, { skip: 'n' });
  g.box(-0.25, 0.9, -0.01, 0.25, 0.95, 0.262, '#cfc5ae', { skip: 'n' });
  g.blob(0, 1.6, 0, 0.15, 0, skin, { shadeBottom: 0.8 });
  g.blob(0, 1.52, 0.09, [0.11, 0.08, 0.08], 0, '#e9e4da', { shadeBottom: 0.85 });         // a beard gone white, or flour
  g.cyl(0, 1.68, 0, 0.158, 0.15, 0.12, 8, FLOUR, { smooth: false });
  for (const s of lean ? [-1] : [-1, 1]) {
    const el = [s * 0.36, 1.1, 0.04], hd = [s * 0.26, 0.98, 0.36];
    g.tint(1); arm(g, [s * 0.26, 1.38, 0.02], el, 0.065, '#ffffff');
    g.tint(0); arm(g, el, hd, 0.058, FLOUR);
    g.blob(hd[0], hd[1], hd[2], 0.058, 0, skin, { shadeBottom: 0.9 });
    g.cyl(s * 0.34, 0.86, 0.2, 0.105, 0.115, 0.24, 8, s < 0 ? '#b9a27c' : '#8a6a48', { smooth: true, cap: false });
    g.cyl(s * 0.34, 1.1, 0.2, 0.122, 0.122, 0.02, 8, s < 0 ? '#cbb894' : '#9a7a56', { smooth: false });
  }
  if (lean) g.pop().pop().pop();
  return g.build();
}
// where a point of the stooped Pell's model is on the deck, when he stands at `at` [x, z] turned by yaw
function pellPoint(at, yaw, lean, m) {
  const y = m[1] - PELL_HIP, c = Math.cos(lean), s = Math.sin(lean), x = m[0] * PELL_S[0], z = (y * s + m[2] * c) * PELL_S[2], cy = Math.cos(yaw), sy = Math.sin(yaw);
  return [at[0] + x * cy + z * sy, (PELL_HIP + y * c - m[2] * s) * PELL_S[1], at[1] - x * sy + z * cy];
}
// A wanderer: a pack on the back, a small jar in one hand and a spoon held up in the other.
function wandererGeo(skin) {
  const g = new Geo();
  g.tint(0.35).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#5f646e');
  g.tint(1).cyl(0, 0.82, 0, 0.22, 0.17, 0.62, 6, '#ffffff', { smooth: false });
  g.tint(0).blob(0, 1.6, 0, 0.145, 0, skin, { shadeBottom: 0.8 });
  g.tint(0.25).box(-0.16, 0.95, -0.34, 0.16, 1.42, -0.15, '#b39b72').box(-0.18, 1.42, -0.32, 0.18, 1.5, -0.16, '#d8c8a4');
  g.tint(1); arm(g, [-0.22, 1.38, 0.02], [-0.25, 1.14, 0.14], 0.05, '#ffffff'); arm(g, [-0.25, 1.14, 0.14], [-0.14, 1.06, 0.36], 0.045, '#ffffff');
  arm(g, [0.22, 1.38, 0.02], [0.27, 1.16, 0.16], 0.05, '#ffffff'); arm(g, [0.27, 1.16, 0.16], [0.2, 1.3, 0.38], 0.045, '#ffffff');
  g.tint(0).cyl(-0.14, 1.02, 0.36, 0.05, 0.05, 0.1, 6, '#e8efe8').cyl(-0.14, 1.12, 0.36, 0.053, 0.053, 0.02, 6, '#8a5a34');
  g.blob(0.2, 1.3, 0.38, 0.045, 0, skin, { shadeBottom: 0.9 });
  g.tube([[0.2, 1.28, 0.38], [0.21, 1.56, 0.44]], 0.008, 4, '#d9d6cc', { emit: 0.3 }).blob(0.212, 1.585, 0.445, [0.028, 0.036, 0.014], 0, '#e9e6dc', { emit: 0.35, shadeBottom: 1 });
  return g.build();
}

// ---------------------------------------------------------------- the arcade
// What the other bakeries have over their doors: trades, not names (the docs name one baker in Spelt).
const TRADES = ['Bread', 'Sugar buns', 'Flatbreads', 'Pastry', 'Steamed cakes', 'Cheese puffs', 'Night loaves', 'Hard bread', 'Buns', 'Crackers', 'Sour loaves', 'Croissants', 'Rolls', 'Toast'];

// Pell's front, 16 m of the arcade's back side, drawn in the row's own co-ordinates (u along, v into the building):
// a wide door standing open, a glazed window of loaves on one hand and an open hatch on the other, where a baker
// hands the night crews their loaves.
function pellFront(deck, P, b, run, HH) {
  const g = P.g, k = deck.glowK, wall = '#cdb38c', trim = '#3a2a1a', dado = '#7d5630', sill = 0.9, head = 2.3, dh = 2.55, D = DOORW;
  for (const s of [-1, 1]) {
    const e0 = s * 7.3, e1 = s * 8, w0 = s * 2.5, d0 = s * D, lo = Math.min, hi = Math.max;
    g.box(lo(e0, e1), 0, -0.07, hi(e0, e1), HH, 0.3, wall, { skip: 'tb' });                      // the end pier
    g.box(lo(w0, d0), 0, -0.07, hi(w0, d0), HH, 0.3, wall, { skip: 'tb' });                      // the pier by the door
    g.box(lo(w0, d0), 0, -0.09, hi(w0, d0), 1.0, -0.07, dado, { skip: 'bs' });
    g.box(lo(e0, w0), 0, 0, hi(e0, w0), sill, 0.3, dado, { skip: 'b' });                          // under the window
    g.box(lo(e0, w0) - 0.02, sill, -0.1, hi(e0, w0) + 0.02, sill + 0.06, 0.62, shade(WOOD, 1.2));  // its sill, a shelf within
    g.box(lo(e0, w0), head, -0.02, hi(e0, w0), HH, 0.3, wall, { skip: 't' });                     // over it
    g.box(lo(e0, w0), head - 0.06, -0.05, hi(e0, w0), head, 0.3, trim);
    // a lamp on the pier by the door
    const pu = s * 2.1;
    g.box(pu - 0.05, 2.04, -0.17, pu + 0.05, 2.2, -0.07, '#ffe2b0', { emit: 3.4 * k, skip: 's' }).box(pu - 0.07, 2.2, -0.18, pu + 0.07, 2.23, -0.07, IRON);
    deck.glow([{ p: run.pt(pu, 2.12, -0.2), color: '#ffcf8a', power: 1.5 * k, size: 0.5 }]);
    // the door's two leaves, standing open into the room
    g.box(d0 - 0.03, 0.02, 0.3, d0 + 0.03, dh - 0.04, 1.25, '#7d5630', { skip: 'b' });
    for (const [y0, y1] of [[0.22, 1.0], [1.14, dh - 0.24]]) g.box(d0 - 0.042, y0, 0.44, d0 + 0.042, y1, 1.11, '#94683c', { skip: 'tb' });
  }
  g.box(-D, dh, -0.05, D, HH, 0.3, '#231a10', { skip: 't' });                                      // over the door: his name
  g.box(-D - 0.06, dh - 0.06, -0.08, D + 0.06, dh, 0.3, trim);
  deck.sign("Pell's", { run, at: run.pt(0, (dh + HH) / 2, -0.056), w: 2.2, h: 0.38, style: 'board', font: 'serif', ground: '#231a10', ink: '#e9b979', glow: 0.25 });
  // the window of loaves, on the anti side of the door: glass, three bars, loaves on the shelf and on a stand behind
  P.gl.quad([-2.5, sill + 0.06, 0.06], [-7.3, sill + 0.06, 0.06], [-7.3, head - 0.06, 0.06], [-2.5, head - 0.06, 0.06], deck.pal.glass);
  for (const u of [-6.1, -4.9, -3.7]) g.box(u - 0.025, sill + 0.06, 0.03, u + 0.025, head - 0.06, 0.09, trim, { skip: 'tb' });
  g.box(-7.2, 0, 0.75, -2.6, 1.32, 1.05, shade(WOOD, 0.9), { skip: 'b' });
  const rng = b.rng;
  for (let u = -7.05; u < -2.7; u += 0.34) {
    deck.put(rng() < 0.5 ? 'boule' : 'batard', { p: run.pt(u + rng.f(-0.03, 0.03), sill + 0.06, 0.36), yaw: rng.f(-0.4, 0.4), scale: rng.f(0.9, 1.1), color: rng.pick(LOAF) });
    deck.put('boule', { p: run.pt(u + 0.1, 1.32, 0.9), yaw: rng() * TAU, scale: rng.f(0.9, 1.15), color: rng.pick(LOAF) });
  }
  deck.sign(['Night loaf 1.00', 'Sour loaf 1.10', 'Bun 0.25'], { run, at: run.pt(-2.1, 1.5, -0.094), w: 0.66, h: 0.62, style: 'chalk', head: false });
  // the hatch, on the spin side: a counter heaped with loaves, a baker within holding one out, the crews without
  g.box(2.5, sill + 0.06, -0.3, 7.3, sill + 0.1, 0.3, shade(WOOD, 1.3));
  for (let u = 2.75; u < 7.2; u += 0.31) for (let j = 0; j < 2; j++) if (rng() < 0.86) deck.put(rng() < 0.6 ? 'boule' : 'batard', { p: run.pt(u + rng.f(-0.03, 0.03), sill + 0.1 + j * 0.13, 0.08 - j * 0.04 + (j ? rng.f(-0.03, 0.03) : 0)), yaw: rng.f(-0.5, 0.5), scale: rng.f(0.88, 1.08), color: rng.pick(LOAF) });
  deck.sign(['Wanderers', 'Leave a spoon.', 'Take a heel for the road.'], { run, at: run.pt(2.1, 1.5, -0.094), w: 0.7, h: 0.6, style: 'paper', font2: 'serif' });
  deck.glow([{ p: run.pt(0, 1.5, 0.7), color: '#ffc27a', power: 0.8 * k, size: 3.0 }]);
  for (const u of [-6.2, -4.9, -3.6, 3.6, 4.9, 6.2]) deck.glow([{ p: run.pt(u, 1.6, 0.5), color: '#ffc27a', power: 0.5 * k, size: 2.2 }]);
  // and its light on the paving outside the door
  deck.zone({ min: [-2.4, -0.2, AW - 3.6], max: [2.4, 2.7, AW + 0.4], soft: 1.5, color: '#ffbe6a', power: 0.75, side: 0.5, under: 0.3 });
}

// The arcade, its two rows of fronts, and its lamps. The lamps are this world's own (the kit's street is asked for
// none) so that they can come up during the flight: their panels are one mesh whose glow is turned up, their points
// of light another, and their light on the street one lattice. Returns what update() needs to do it.
function* buildArcade(deck, rng) {
  const frame = deck.frame, k = deck.glowK;
  let n = 0;
  const bakery = (c) => { const i = n++; return { from: c - 3, to: c + 3, kind: 'shop', name: TRADES[i % TRADES.length], goods: 'bread', open: true, lit: 1, awning: i % 3 === 0, blade: i % 3 === 1, doorSide: i % 2, props: i % 4 !== 0 }; };
  const back = [{ from: BX0, to: BX1, kind: 'custom', id: 'pell', piers: false, draw: (P, b, run, HH) => pellFront(deck, P, b, run, HH) }], front = [];
  // next door to Pell's, a stall of the drum's broth for the crews (three-nights' canon: "malty, with a crust of bread to dip")
  back.push({ from: -14.6, to: BX0, kind: 'stall', id: 'broth', name: 'Malt broth', goods: 'pots', lit: 1, ground: '#3a2a1a', ink: '#f1d9a6', font: 'serif' });
  for (let c = -80; c <= 79; c += 12) if (c < BX0 - 3 || c > BX1 + 3) back.push(bakery(c));
  for (let c = -86; c <= 85; c += 12) front.push(bakery(c));
  const st = yield* street(deck, {
    axis: 'x', from: -90, to: 90, at: 0, y: 0, width: AW * 2, lamps: false, ribs: { every: 6 }, floor: { shine: 1 },
    plates: [{ at: -20.9, lines: ["Baker's Arcade", 'Ovenside'] }],
    folk: { stand: 0, stroll: 0, walk: 0, kids: 0 },
    fronts: { back, front }, fill: { mix: { home: 3, wall: 0.5 }, bay: [5.4, 6.4], numbers: 31, lit: 0 },
  });
  yield 'bakehouse: arcade';
  // lamps: a panel between each pair of ribs
  const lg = new Geo({ maxSeg: 8 }), pts = [], tray = deck.bucket(0, 0, 'av').g, xs = [];
  for (let x = -87; x < 90; x += 6) {
    xs.push(x);
    lg.floor(x - 0.55, -0.19, x + 0.55, 0.19, H - 0.022, '#ffe6bf', { down: true, emit: 1 });
    tray.box(x - 0.62, H - 0.05, -0.26, x + 0.62, H, 0.26, deck.pal.metal, { skip: 't' });
    pts.push({ p: [x, H - 0.16, 0], color: '#ffd29a', power: 2.3, size: 0.75 });
  }
  const lampMat = litMaterial(deck.rig, { bend: frame, emit: 0 });
  const panels = lg.mesh(lampMat, frame), points = glowPoints(pts, { bend: frame, minPx: 1.4, maxPx: 150, soft: 1.9, power: 0 });
  deck.group.add(panels, points);
  const lat = { origin: [xs[0], H - 0.1, 0], spacing: [6, 50], count: [xs.length, 1], color: '#ffd29a', power: 0, reach: 4.2, drop: (H - 0.1) / 0.75 + 0.05 };
  const iLat = deck.lattice(lat);
  // the light of the bakeries' doors on the paving: one lamp's worth at each, a row down either side
  deck.lattice({ origin: [-80, 1.9, AW - 1.1], spacing: [12, 50], count: [14, 1], color: '#ffb45e', power: 1.0 / deck.level, reach: 2.0 });
  deck.lattice({ origin: [-86, 1.9, -AW + 1.1], spacing: [12, 50], count: [15, 1], color: '#ffb45e', power: 1.0 / deck.level, reach: 2.0 });
  // steam out of every bakery's door, rolling up along the ceiling
  const steam = [];
  for (const side of [st.sides.back, st.sides.front]) for (const b of side.bays) {
    if (b.goods !== 'bread' && b.id !== 'pell' && b.id !== 'broth') continue;
    const mid = b.at(0.5, 0, 0), d = deck.dist(mid[0], 1.5, mid[2]), dz = side === st.sides.back ? -1 : 1;
    if (d > 80) continue;
    for (let i = 0, m = d > 46 ? 5 : b.id === 'pell' ? 30 : 16; i < m; i++) {
      const t = b.id === 'pell' ? 0.5 + rng.f(-0.1, 0.1) : rng.f(0.15, 0.85), p = b.at(t, rng.f(1.9, 2.5), rng.f(-0.3, 0.5));
      steam.push({ p, color: '#ffdfb4', power: rng.f(0.09, 0.17), size: rng.f(0.9, 2.0), move: [rng.f(-0.07, 0.02), rng.f(0.03, 0.09), dz * rng.f(0.1, 0.26)], loop: rng.f(7, 12), phase: rng() });
    }
    if (b.id === 'broth') {
      // bowls on its counter, and two of the crews drinking theirs
      for (const t of [0.2, 0.34, 0.62, 0.8]) deck.put('bowl', { p: b.at(t, 0.95, -0.12), yaw: 0, scale: 1.2, color: '#d9cdb4' });
      deck.people([{ p: b.at(0.3, 0, -0.75), yaw: 0.2, color: CREW[1] }, { p: b.at(0.55, 0, -0.85), yaw: -0.3, color: CREW[6] }]);
    } else if (b.id !== 'pell' && d < 60) deck.glow([{ p: b.at(b.doorSide ? 0.88 : 0.12, 1.25, 0.5), color: '#ffb85e', power: 1.5 * k, size: 2.3 }, { p: b.at(0.5, 1.5, 0.8), color: '#ffc27a', power: 0.9 * k, size: 2.6 }]);
    // and a few of the night's crews at the door
    if (d < 46 && side === st.sides.front && mid[0] > -8 && rng() < 0.75) { const q = b.at(rng.f(0.3, 0.7), 0, -0.62); if (deck.clear(q[0], 1.2, q[2], 2.6)) deck.knot(q[0], 0, q[2], 2 + Math.floor(rng() * 2), rng); }
  }
  deck.glow(steam);
  // the street's clock, hung under the ceiling where the flight comes in: the lamps are just coming up
  const cg = deck.bucket(0, 0, 'av').g, cx = -12.6, cz = -2.3;
  cg.box(cx - 0.06, 2.3, cz - 0.44, cx + 0.06, 2.72, cz + 0.44, IRON2).box(cx - 0.015, 2.72, cz - 0.015, cx + 0.015, H, cz + 0.015, deck.pal.metal, { skip: 'tb' });
  deck.sign('04:30', { at: [cx - 0.072, 2.51, cz], n: [-1, 0], w: 0.8, h: 0.34, style: 'glow', font: 'cond', ink: '#ffcf8a', glow: 1.5, both: 0.144 });
  deck.glow([{ p: [cx - 0.12, 2.51, cz], color: '#ffc27a', power: 0.5 * k, size: 0.9 }]);
  yield 'bakehouse: arcade lamps';
  return { st, lampMat, points, lat, iLat };
}

// ---------------------------------------------------------------- the bakehouse: its shell and its ovens
// One room 16 m by 40 m under a 3 m ceiling. Its front wall is Pell's front; the arch to the crock room is in its
// anti wall near the far end; the ovens stand in one bank along its spin wall.
function buildShell(deck) {
  const b = deck.bucket(0, 24, 'bake'), g = b.g, k = deck.glowK, pal = deck.pal;
  const wall = '#cdb48a', tile = '#9a7a52', band = '#5f4228', stone = '#7c6c5a';
  b.f.tint(0.5).floor(BX0, BZ0, BX1, BZ1, 0, stone, { emit: 0.45 }).floor(CX1, ARCH[0], BX0, ARCH[1], 0, stone, { emit: 0.45 }).tint(0);
  // where flour falls and is trodden in, the floor is paler and has lost its polish: round the benches, before the ovens
  for (const [x0, z0, x1, z1, f] of [[-7.5, 8.9, -1.6, 25.3, 0.12], [-7.0, 9.3, -2.1, 24.9, 0.22], [-6.6, 9.8, -5.4, 24.4, 0.32], [-3.7, 9.8, -2.5, 24.4, 0.32], [5.5, OV0 - 1, OVX, EXITZ + 1, 0.24], [4.4, OV0 - 0.6, 5.5, EXITZ + 0.6, 0.11]]) b.f.tint(0.5).floor(x0, z0, x1, z1, 0.004 + f * 0.01, mixc(stone, '#e6dcc8', f), { emit: 0.45 * (1 - f * 1.6) }).tint(0);
  g.floor(BX0, BZ0, BX1, BZ1, H, '#6a5640', { down: true, emit: 0.12 * k });
  for (let z = BZ0 + 2; z < BZ1 - 1; z += 4.4) g.box(BX0, H - 0.2, z - 0.1, BX1, H, z + 0.1, '#7a6248', { skip: 't' });
  // walls: tile to shoulder height, a band, plaster above
  for (const [y0, y1, c] of [[0, 1.25, tile], [1.25, 1.31, band], [1.31, H, wall]]) {
    wallX(g, BZ0, ARCH[0], y0, y1, BX0, 1, c); wallX(g, ARCH[1], BZ1, y0, y1, BX0, 1, c); wallZ(g, BX0, BX1, y0, y1, BZ1, -1, c);
    wallX(g, BZ0, OV0 - OVP / 2, y0, y1, BX1, -1, c); wallX(g, EXITZ + OVP / 2, BZ1, y0, y1, BX1, -1, c);
  }
  wallX(g, ARCH[0], ARCH[1], 2.7, H, BX0, 1, wall);
  wallZ(g, CX1, BX0, 0, 2.7, ARCH[0], 1, tile); wallZ(g, CX1, BX0, 0, 2.7, ARCH[1], -1, tile);
  g.floor(CX1, ARCH[0], BX0, ARCH[1], 2.7, wall, { down: true });
  g.box(BX0 - 0.02, 0, ARCH[0] - 0.14, BX0 + 0.05, 2.84, ARCH[0], band, { skip: 'b' }).box(BX0 - 0.02, 0, ARCH[1], BX0 + 0.05, 2.84, ARCH[1] + 0.14, band, { skip: 'b' }).box(BX0 - 0.02, 2.7, ARCH[0], BX0 + 0.05, 2.84, ARCH[1], band);
  deck.sign('The Crock Room', { at: [BX0 + 0.066, 2.87, (ARCH[0] + ARCH[1]) / 2], n: [1, 0], w: 2.5, h: 0.2, style: 'board', font: 'serif', ground: '#231a10', ink: '#e9b979' });
  deck.sign(['Spoons', 'Through the Gate first.', 'Then the strain library.', 'Then the mother.'], { at: [BX0 + 0.012, 1.72, ARCH[1] + 0.75], n: [1, 0], w: 0.84, h: 0.7, style: 'paper', font2: 'serif' });
  deck.sign(['Ovens', 'Doors shut between loads.', 'Heat is kays.'], { at: [BX1 - 0.012, 1.85, 6.3], n: [-1, 0], w: 0.9, h: 0.56, style: 'paper', font2: 'serif' });
  deck.sign(['Since two', 'Night loaf 2,400', 'Sour loaf 900', 'Raft loaf 60'], { at: [BX0 + 0.045, 1.85, 6.6], n: [1, 0], w: 1.2, h: 0.98, style: 'chalk' });
  g.box(BX0, 1.3, 5.92, BX0 + 0.03, 2.4, 7.28, '#4a3520', { skip: 'w' });
  // work lamps on cords, five rows of nine (none by the arch, where the flight looks up), and the light they give
  // (turned up from update()). No row hangs over the aisle the flight keeps to
  const lat = { origin: [-6.3, H - 0.5, 7.2], spacing: [3.0, 4.4], count: [5, 9], color: '#ffdcae', power: 0.8, reach: 3.0, drop: 3.9 }, lamps = [];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 9; j++) {
    const x = lat.origin[0] + i * lat.spacing[0], z = lat.origin[2] + j * lat.spacing[1];
    if (j === 7 && i < 2) continue;
    deck.put('workLamp', { p: [x, H, z], yaw: 0, color: '#b9a27c' });
    deck.glow([{ p: [x, H - 0.52, z], color: pal.lamp, power: 0.7, size: 0.42 }]);
    lamps.push([x, H - 0.5, z]);
  }
  return { lat, lamps, iLat: deck.lattice({ ...lat, power: lat.power / deck.level }) };
}

// A door of an oven, shut, as it stands in the bank's face: black enamel, a strip of glass with the elements' glow
// behind it, a steel bar to pull it down by.
function doorShape(g, zc, s, hot) {
  g.box(OVX - 0.05, s + 0.012, zc - MW / 2 + 0.012, OVX + 0.012, s + MH - 0.012, zc + MW / 2 - 0.012, '#26221f');
  g.box(OVX - 0.056, s + 0.19, zc - 0.44, OVX - 0.05, s + 0.33, zc + 0.44, hot ? ELEMENT : '#3a2a20', { emit: hot ? 2.4 : 0.08, skip: 'e' });
  g.tube([[OVX - 0.13, s + MH - 0.1, zc - 0.5], [OVX - 0.13, s + MH - 0.1, zc + 0.5]], 0.016, 5, STEEL);
  for (const dz of [-0.46, 0.46]) g.box(OVX - 0.13, s + MH - 0.114, zc + dz - 0.012, OVX - 0.05, s + MH - 0.086, zc + dz + 0.012, STEEL, { skip: 'e' });
}
// The inside of an oven whose door opens: the sole, the roof with its elements glowing, the sides, and a back
// (the way out of this world has none: the opening stands there).
function cavity(g, zc, s, xe, open) {
  const a = zc - MW / 2, c = zc + MW / 2, y1 = s + MH;
  g.floor(OVX, a, xe, c, s, '#c2703a', { emit: 0.9 });
  g.floor(OVX, a, xe, c, y1, '#8a4420', { down: true, emit: 1.0 });
  for (let x = OVX + 0.12; x < xe - 0.04; x += 0.19) g.box(x - 0.028, y1 - 0.034, a + 0.04, x + 0.028, y1 - 0.01, c - 0.04, ELEMENT, { emit: 5.5, skip: 't' });
  for (const z of [a + 0.03, c - 0.05]) g.box(OVX + 0.05, s + 0.004, z, xe - 0.02, s + 0.022, z + 0.02, ELEMENT, { emit: 4.5, skip: 'b' });
  wallZ(g, OVX, xe, s, y1, a, 1, '#a8501f', 1.3); wallZ(g, OVX, xe, s, y1, c, -1, '#a8501f', 1.3);
  if (!open) wallX(g, a, c, s, y1, xe, -1, '#d0621f', 2.0);
}
// The doors that open during the flight: which oven, which deck, when (seconds into the flight) and when it shuts.
// The first is seen far down the room from the street door; the second is the one with the peel; the third opens
// beside the way out during the run at it; the last is the way out, and update() opens it by the flight's end.
const OPENERS = [{ i: 2, d: 1, at: 12.2, shut: 17.4 }, { i: HERO, d: 1, at: 19.0, shut: 1e9 }, { i: 13, d: 1, at: 50, shut: 57 }, { i: NOV - 1, d: 1, at: -1, shut: 1e9 }];

function* buildOvens(deck, rng, ex) {
  const b = deck.bucket(0, 24, 'bake'), g = b.g, glows = [], frame = deck.frame;
  const z0 = OV0 - OVP / 2, z1 = EXITZ + OVP / 2, TOP = 2.62, hood = '#4a433c';
  wallZ(g, OVX, BX1, 0, H, z0, -1, IRON); wallZ(g, OVX, BX1, 0, H, z1, 1, IRON);
  g.box(OVX - 0.04, 0, z0, OVX, 0.1, z1, BRASS, { skip: 'be' });
  g.box(OVX - 0.6, TOP, z0, OVX, H, z1, hood, { skip: 'te' }).box(OVX - 0.62, TOP - 0.03, z0, OVX - 0.56, TOP + 0.03, z1, BRASS, { skip: 'ns' });
  const leaves = [];
  for (let i = 0; i < NOV; i++) {
    const zc = OV0 + i * OVP, za = zc - OVP / 2, zb = zc + OVP / 2, ma = zc - MW / 2, mb = zc + MW / 2;
    wallX(g, za, zb, 0, DECKS[0], OVX, -1, IRON2);
    g.box(OVX - 0.02, 0.1, zb - 0.03, OVX, TOP, zb + 0.03, shade(STEEL, 0.75), { skip: 'tbe' });                  // the seam between one oven and the next
    for (let d = 0; d < 3; d++) {
      const s = DECKS[d], top = d < 2 ? DECKS[d + 1] : TOP, hot = rng() < 0.86, op = OPENERS.find((o) => o.i === i && o.d === d);
      wallX(g, za, ma, s, s + MH, OVX, -1, IRON); wallX(g, mb, zb, s, s + MH, OVX, -1, IRON); wallX(g, za, zb, s + MH, top, OVX, -1, IRON);
      g.box(OVX - 0.022, s + MH + 0.03, za + 0.06, OVX, s + MH + 0.075, zb - 0.06, STEEL, { skip: 'e' });
      // its controls: a dial, and a lamp that is orange while the deck is at heat
      g.box(OVX - 0.03, s + 0.1, mb + 0.08, OVX, s + 0.4, mb + 0.27, '#57504a', { skip: 'e' }).box(OVX - 0.05, s + 0.14, mb + 0.13, OVX - 0.03, s + 0.22, mb + 0.21, '#d9d2c2', { skip: 'e' });
      g.box(OVX - 0.04, s + 0.3, mb + 0.14, OVX - 0.03, s + 0.34, mb + 0.2, hot || op ? '#ff9a3a' : '#4a3c30', { emit: hot || op ? 3.2 : 0, skip: 'e' });
      if (hot || op) glows.push({ p: [OVX - 0.07, s + 0.32, mb + 0.17], color: '#ff9a3a', power: 0.55, size: 0.17 });
      if (!op) { doorShape(g, zc, s, hot); continue; }
      const last = i === NOV - 1;
      cavity(g, zc, s, last ? ex.x + 0.03 : OVX + 1.22, last);
      if (!last) glows.push({ p: [OVX + 0.3, s + MH / 2, zc], color: '#ff7a2a', power: 1.2, size: 1.4 });
      // the leaf is a mesh of its own, hinged a little under its sill, so that let down it lies level with the
      // oven's sole and a peel slides out over it: turn(0) shut, turn(1) down
      const lg = new Geo({ maxSeg: 8 }); doorShape(lg, zc, s, true);
      const m = lg.mesh(deck.lit, frame); m.matrixAutoUpdate = false; deck.group.add(m);
      const B = frame.stand(OVX - 0.02, zc, { h: s - 0.032 }), Bi = B.clone().invert(), R = new Matrix4();
      leaves.push({ ...op, zc, s, turn(q) { m.matrix.copy(B).multiply(R.makeRotationZ(clamp(q, 0, 1) * Math.PI / 2)).multiply(Bi); m.matrixWorldNeedsUpdate = true; } });
    }
    deck.sign(String(i + 1), { at: [OVX - 0.008, TOP - 0.11, zc], n: [-1, 0], w: 0.24, h: 0.14, style: 'plate', font: 'cond' });
    if (i % 4 === 3) yield 'bakehouse: ovens';
  }
  deck.glow(glows);
  // the seep of the ovens' glow onto the floor along the bank
  deck.lattice({ origin: [OVX - 0.5, 1.4, OV0], spacing: [50, OVP], count: [1, NOV], color: '#ff8f4a', power: 0.2 / deck.level, reach: 1.5 });
  return leaves;
}

// ---------------------------------------------------------------- what stands in the bakehouse
const RACK_Y = (k) => 0.3 + 0.225 * k;            // a rack's seven trays
// a rack on wheels, 0.92 m wide and 0.7 m deep: proving racks and cooling racks are the same thing
function rackShape(g) {
  g.tint(0.2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.46 - 0.018, 0.1, sz * 0.35 - 0.018, sx * 0.46 + 0.018, 1.86, sz * 0.35 + 0.018, STEEL, { skip: 'b' }).box(sx * 0.46 - 0.03, 0, sz * 0.35 - 0.05, sx * 0.46 + 0.03, 0.1, sz * 0.35 + 0.05, '#2f2f30', { skip: 'b' });
  for (let k = 0; k < 7; k++) g.box(-0.45, RACK_Y(k) - 0.014, -0.34, 0.45, RACK_Y(k), 0.34, '#b9b2a2');
  g.box(-0.46, 1.84, -0.35, 0.46, 1.86, 0.35, STEEL).tint(0);
}
// a point (lx, lz) of something standing at (x, z) and turned by yaw
const rot = (x, z, yaw, lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];

function protos(deck) {
  deck.proto('boule', (g) => bouleShape(g));
  deck.proto('batard', (g) => batardShape(g));
  deck.proto('dough', (g) => doughShape(g));
  deck.proto('loafGo', (g) => bouleShape(g));
  deck.proto('crock', (g) => crockShape(g));
  deck.proto('jar', (g) => jarShape(g));
  deck.proto('rack', (g) => rackShape(g));
  // a work lamp on a short cord (its top at the origin): smaller in the eye than the kit's pendant, which the flight passes under
  deck.proto('workLamp', (g) => { g.cyl(0, -0.34, 0, 0.01, 0.01, 0.34, 4, '#2f2a26', { cap: false }); g.tint(0.6).cyl(0, -0.48, 0, 0.18, 0.05, 0.14, 8, '#ffffff', { smooth: false, cap: false }); g.tint(0).cyl(0, -0.49, 0, 0.15, 0.15, 0.01, 8, '#ffe6c0', { emit: 2.8, smooth: false, base: true }); });
  deck.proto('sack', (g) => { g.tint(1).blob(0, 0.13, 0, [0.36, 0.14, 0.25], 0, '#ffffff', { lump: 0.14, shadeBottom: 0.72 }).tint(0); });
  // a baker's bench, 2.4 m of it: a thick top scrubbed pale, bins on a shelf beneath
  deck.proto('bakeBench', (g) => {
    g.tint(0.15); for (const sx of [-1.1, 1.1]) for (const sz of [-0.36, 0.36]) g.box(sx - 0.04, 0, sz - 0.04, sx + 0.04, 0.83, sz + 0.04, WOOD2, { skip: 'tb' });
    g.box(-1.14, 0.2, -0.38, 1.14, 0.24, 0.38, WOOD).box(-1.16, 0.72, -0.4, 1.16, 0.83, 0.4, WOOD, { skip: 't' });
    g.tint(0.35).box(-1.2, 0.83, -0.43, 1.2, 0.9, 0.43, '#ffffff');
    g.tint(0).box(-0.9, 0.24, -0.3, -0.35, 0.56, 0.3, '#c9bfa8', { skip: 'b' }).box(0.2, 0.24, -0.28, 0.85, 0.5, 0.28, '#8f7a60', { skip: 'b' });
  });
}

// Benches, the dozen who shape at them, racks of dough waiting for the ovens and racks of loaves by the hundred
// cooling at the far end. folk(pose, item) stands a baker.
function* furnish(deck, rng, folk) {
  const b = deck.bucket(0, 24, 'bake'), g = b.g, clk = deck.clk;
  const WHITES = ['#b9c0c2', '#c9b79a', '#aeb5a6', '#c4a98a', '#a9b3bd', '#cfc6b4'];       // their shirts: the aprons, caps and forearms are white
  const put = (kind, p, yaw, scale, color) => deck.put(kind, { p, yaw, scale, color });
  // ---- two rows of six benches down the anti half of the room
  const slots = [];
  for (const bx of [-6.0, -3.1]) for (let j = 0; j < 6; j++) {
    const z = 10.7 + j * 2.4;
    put('bakeBench', [bx, 0, z], Math.PI / 2, 1, mixc('#efe6d2', '#d9c9a6', rng()));
    for (const s of [-1, 1]) slots.push({ bx, z: z + rng.f(-0.45, 0.45), s });
    for (let i = 0; i < 9; i++) put('dough', [bx + (i < 5 ? -0.2 : 0.2) + rng.f(-0.06, 0.06), 0.9, z - 1.0 + (i % 5) * 0.5 + rng.f(-0.08, 0.08)], rng() * TAU, rng.f(0.8, 1.15), rng.pick(DOUGH));
    if (j === 5) yield 'bakehouse: benches';
    put('dough', [bx + rng.f(-0.12, 0.12), 0.885, z + rng.f(-0.2, 0.2)], 0, [1.7, 0.45, 1.5], FLOUR);                  // a heap of flour
    g.box(bx - 0.07, 0.9, z + 1.02, bx + 0.07, 0.925, z + 1.13, STEEL).box(bx - 0.3, 0.9, z - 1.16, bx - 0.02, 1.02, z - 0.96, '#57504a');    // a scraper, a scale
  }
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)), t = slots[i]; slots[i] = slots[j]; slots[j] = t; }
  for (const q of slots.slice(0, 12)) folk('shape', { p: [q.bx + q.s * 0.67, 0, q.z], yaw: q.s < 0 ? Math.PI / 2 : -Math.PI / 2, color: rng.pick(WHITES) });
  yield 'bakehouse: benches';
  // ---- racks. A rack is stood only where the flight leaves it room
  const rack = (x, z, yaw, kind, fill = 0.92) => {
    if (!deck.clear(x, 1.0, z, 1.3)) return;
    put('rack', [x, 0, z], yaw, 1, '#b9b2a2');
    for (let s = 0; s < 7; s++) for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      if (rng() > fill) continue;
      const q = rot(x, z, yaw, -0.3 + i * 0.3 + rng.f(-0.02, 0.02), -0.16 + j * 0.32);
      if (kind === 'dough') put('dough', [q[0], RACK_Y(s), q[1]], rng() * TAU, rng.f(0.85, 1.1), rng.pick(DOUGH));
      else put(rng() < 0.62 ? 'boule' : 'batard', [q[0], RACK_Y(s), q[1]], yaw + rng.f(-0.3, 0.3), rng.f(0.9, 1.1), rng.pick(LOAF));
    }
  };
  for (const [x, z] of [[-6.0, 8.7], [-3.1, 8.7], [-6.0, 25.3], [-4.55, 25.3], [-3.1, 25.3]]) rack(x, z, 0, 'dough');
  for (const z of [10.3, 11.5, 16.4, 17.6, 18.8]) rack(5.3, z, Math.PI / 2, 'dough');
  for (const z of [27.2, 29.0, 30.8, 32.6]) { for (const x of [-6.6, -5.5, -4.4, -3.3, -2.2, -1.1]) if (z < 32 || x > -3.9) rack(x, z, 0, 'loaf'); if (clk.due()) { yield 'bakehouse: racks'; clk.go(); } }
  for (let x = -6.6; x < 5.8; x += 1.1) rack(x, BZ1 - 0.6, 0, 'loaf', 0.8);
  yield 'bakehouse: racks';
  // ---- sacks: what flour is here (the Mill's starch, the Vats' gluten)
  for (const [z, word] of [[7.9, 'Mill starch'], [8.8, 'Vat gluten']]) {
    for (let i = 0; i < 6; i++) put('sack', [BX0 + 0.5 + rng.f(-0.03, 0.03), i * 0.2, z + rng.f(-0.03, 0.03)], Math.PI / 2 + rng.f(-0.12, 0.12), 1, mixc('#e6dcc4', '#cfc2a4', rng()));
    deck.sign(word, { at: [BX0 + 0.86, 0.72, z], n: [1, 0], w: 0.46, h: 0.13, style: 'card', font: 'cond' });
  }
  // ---- peels stood against the wall at either end of the bank, blades up
  for (const [z0, n] of [[5.3, 5], [EXITZ + OVP / 2 + 1.75, 3]]) for (let i = 0; i < n; i++) {
    const z = z0 + i * 0.62, len = rng.f(2.3, 2.75);
    g.tube([[BX1 - 0.4, 0, z], [BX1 - 0.06, len - 0.5, z]], 0.02, 5, WOOD);
    g.box(BX1 - 0.09, len - 0.5, z - 0.24, BX1 - 0.03, len, z + 0.24, '#c9a878');
  }
  yield 'bakehouse: stores';
  // ---- by the last oven, the night's slate: which ovens bake what. Sixteen, the way out of this world, has the raft loaf
  g.box(BX1 - 0.03, 1.28, EXITZ + OVP / 2 + 0.2, BX1, 2.42, EXITZ + OVP / 2 + 1.34, '#4a3520', { skip: 'e' });
  deck.sign(['Tonight', '1 to 9 night loaf', '10 to 13 sour loaf', '14 and 15 buns', '16 the raft loaf'], { at: [BX1 - 0.045, 1.85, EXITZ + OVP / 2 + 0.77], n: [-1, 0], w: 1.02, h: 1.02, style: 'chalk' });
  // ---- flour in the air over the benches, where it is thrown
  for (const bx of [-6.0, -3.1]) for (let j = 0; j < 6; j++) {
    const z = 10.7 + j * 2.4;
    if (deck.dist(bx, 1.5, z) > 14) continue;
    for (let i = 0; i < 3; i++) deck.glow([{ p: [bx + rng.f(-0.4, 0.4), rng.f(1.0, 1.5), z + rng.f(-1, 1)], color: '#ffe9c8', power: rng.f(0.04, 0.075), size: rng.f(0.8, 1.5), move: [rng.f(-0.04, 0.04), rng.f(0.02, 0.07), rng.f(-0.04, 0.04)], loop: rng.f(6, 11), phase: rng() }]);
    for (let i = 0; i < 12; i++) deck.glow([{ p: [bx + rng.f(-0.6, 0.6), rng.f(0.95, 2.0), z + rng.f(-1.2, 1.2)], color: '#fff1da', power: rng.f(0.5, 1.3), size: rng.f(0.006, 0.013), move: [rng.f(-0.03, 0.03), rng.f(-0.04, 0.02), rng.f(-0.03, 0.03)], loop: rng.f(6, 12), twinkle: 0.4, phase: rng() }]);
  }
  yield 'bakehouse: flour over the benches';
  // ---- the bakers at the ovens whose doors open: each with a peel, loaded, waiting on the door
  for (const o of OPENERS) {
    if (o.i === HERO || o.i === NOV - 1) continue;
    const zc = OV0 + o.i * OVP, y = DECKS[o.d] + 0.004;
    folk('peel', { p: [4.0, 0, zc], yaw: Math.PI / 2, color: rng.pick(WHITES) });
    g.box(5.2, y, zc - 0.56, 6.3, y + 0.016, zc + 0.56, '#c9a878').tube([[5.24, y + 0.016, zc], [4.46, 1.33, zc]], 0.02, 5, WOOD);
    for (let i = 0; i < 3; i++) for (const dz of [-0.27, 0.27]) put('dough', [5.42 + i * 0.33, y + 0.016, zc + dz], rng() * TAU, 1.05, rng.pick(DOUGH));
  }
  // one of the young ones showing Pell a loaf, for the size of him
  folk('hand', { p: [-5.95, 0, 34.9], yaw: Math.atan2(PELL[0] + 5.95, PELL[1] - 34.9), color: WHITES[2], scale: 0.96 });
  // a baker within the hatch, holding a loaf out to the street; and the crews at it
  folk('hand', { p: [4.4, 0, BZ0 + 0.62], yaw: Math.PI, color: WHITES[0] });
  const crews = [];
  for (const [x, z, yaw, loaf] of [[4.35, AW - 0.72, 0.1, 0], [5.3, AW - 0.9, -0.3, 0], [3.4, AW - 1.05, 1.9, 1], [6.3, AW - 0.75, -0.6, 0], [5.9, AW - 1.75, -2.4, 1], [6.9, AW - 1.3, 2.6, 1]]) {
    if (!deck.clear(x, 1.2, z, 1.3)) continue;
    crews.push({ p: [x, 0, z], yaw, color: rng.pick(CREW) });
    if (loaf) put('boule', [x + Math.cos(yaw) * 0.26, 1.06, z - Math.sin(yaw) * 0.26], yaw, 1.05, rng.pick(LOAF));      // those who have theirs
  }
  deck.people(crews);
  yield 'bakehouse: bakers';
}
// what the night crews wear: work colours, worn
const CREW = ['#4f6f8f', '#5a6a70', '#7a6a4a', '#8c8577', '#3f5a6a', '#6f7a5a', '#a0764a', '#59606a', '#8a5a44', '#c7a36a'];

// The peel at the oven the flight passes: a board on a long handle, the baker who works it, and six loaves. Two
// rigid meshes (the peel with its baker, and the loaves), moved round the drum by rotation.z (brief-rooms.md: x metres
// is x / floorR radians). The door comes down; he runs the board in under the loaves; he draws them out, six at a
// time, over the let-down door.
const GO = 1.25;                                 // how far the peel travels
function heroPeel(deck, rng, t0) {
  const frame = deck.frame, R = frame.floorR, zc = HEROZ, y = DECKS[1] + 0.004, bx1 = OVX - 0.12, bx0 = bx1 - 1.05;
  const pg = new Geo({ maxSeg: 8 }), lg = new Geo({ maxSeg: 8 });
  pg.box(bx0, y, zc - 0.56, bx1, y + 0.016, zc + 0.56, '#c9a878');
  pg.tube([[bx0 + 0.05, y + 0.016, zc], [bx0 - 1.5, 1.33, zc]], 0.02, 5, WOOD);
  pg.at(bx0 - 1.96, 0, zc, Math.PI / 2); bakerShape(pg, 'peel', SKIN[2]); pg.pop();
  for (let i = 0; i < 3; i++) for (const dz of [-0.27, 0.27]) { lg.at(bx0 + 0.2 + i * 0.33, y + 0.016, zc + dz, rng.f(-0.4, 0.4), rng.f(0.98, 1.1)); bouleShape(lg, LOAF[(i * 2 + (dz > 0 ? 1 : 0)) % LOAF.length]); lg.pop(); }
  const peel = pg.mesh(deck.lit, frame), loaves = lg.mesh(deck.lit, frame);
  deck.group.add(peel, loaves);
  // steam: a breath as the door comes down, and more off the loaves as they come out
  const rs = makeRng('pell-steam'), pts = [];
  for (let i = 0; i < 46; i++) pts.push({ p: [OVX - rs.f(0.0, 0.7), DECKS[1] + rs.f(0.25, 0.6), zc + rs.f(-0.6, 0.6)], color: '#ffe1c2', power: rs.f(0.07, 0.16), size: rs.f(0.45, 1.1), move: [rs.f(-0.3, -0.05), rs.f(0.3, 0.55), rs.f(-0.08, 0.08)], loop: rs.f(2.4, 4.2), phase: rs() });
  const steam = glowPoints(pts, { bend: frame, minPx: 1.4, maxPx: 260, soft: 2.2, power: 0 });
  deck.group.add(steam);
  const iZone = deck.zone({ min: [OVX - 3.2, -0.2, zc - 1.7], max: [OVX + 0.2, 2.7, zc + 1.7], soft: 1.0, color: '#ff9448', power: 0, side: 1, under: 0.5 });
  return (t, open) => {
    const out = smoothstep(t0 + 3.4, t0 + 5.9, t);
    peel.rotation.z = GO * (smoothstep(t0 + 1.5, t0 + 2.9, t) - out) / R;
    loaves.rotation.z = GO * (1 - out) / R;
    steam.material.uniforms.uPower.value = open * (0.55 + 0.45 * out) * (1 - 0.5 * smoothstep(t0 + 8, t0 + 14, t));
    deck.rig.setZone(iZone, { min: [OVX - 3.2, -0.2, zc - 1.7], max: [OVX + 0.2, 2.7, zc + 1.7], soft: 1.0, color: '#ff9448', power: 0.85 * open, side: 1, under: 0.5 });
  };
}

// A rack of loaves pushed up the oven lane to the cooling end: rack, loaves and baker are one rigid mesh, moved
// along the axis by position.z.
function* pushedRack(deck, rng) {
  const pg = new Geo({ maxSeg: 8 }), x = 4.4, z = 25.6;
  pg.at(x, 0, z, 0); rackShape(pg);
  for (let s = 0; s < 7; s++) {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { pg.at(-0.3 + i * 0.3, RACK_Y(s), -0.16 + j * 0.32, rng.f(-0.4, 0.4), rng.f(0.9, 1.08)); if ((s + i + j) % 3) bouleShape(pg, rng.pick(LOAF)); else batardShape(pg, rng.pick(LOAF)); pg.pop(); }
    if (s % 2) yield 'bakehouse: the rack';
  }
  pg.pop();
  pg.at(x, 0, z - 0.85, 0); bakerShape(pg, 'push', SKIN[4]); pg.pop();
  const m = pg.mesh(deck.lit, deck.frame);
  deck.group.add(m);
  return (t) => { m.position.z = 8.6 * smoothstep(20, 35, t); };
}

// Flour hanging in the lamp light: specks that drift, and a faint bloom of it under each lamp near the flight.
function* flourAir(deck, rng, lamps) {
  const pts = [];
  for (let i = 0, n = Math.round(1500 * deck.density); i < n; i++) {
    if (i % 400 === 399) yield 'bakehouse: flour';
    const x = rng.f(BX0 + 0.3, OVX - 0.3), z = rng.f(BZ0 + 0.2, BZ1 - 0.3);
    if (deck.dist(x, 1.6, z) > 9) continue;
    pts.push({ p: [x, rng.f(0.5, 2.25), z], color: '#fff1da', power: rng.f(0.35, 1.0), size: rng.f(0.006, 0.014), move: [rng.f(-0.03, 0.03), rng.f(-0.025, 0.012), rng.f(-0.03, 0.03)], loop: rng.f(8, 15), twinkle: 0.35, phase: rng() });
  }
  for (const l of lamps) {
    if (deck.dist(l[0], 1.6, l[2]) > 12) continue;
    for (let i = 0; i < 4; i++) pts.push({ p: [l[0] + rng.f(-0.45, 0.45), rng.f(1.2, 2.2), l[2] + rng.f(-0.45, 0.45)], color: '#ffe2b8', power: rng.f(0.035, 0.065), size: rng.f(1.1, 2.0), move: [rng.f(-0.03, 0.03), rng.f(-0.03, 0.01), rng.f(-0.03, 0.03)], loop: rng.f(9, 15), phase: rng() });
  }
  deck.glow(pts);
}

// ---------------------------------------------------------------- the crock room
// The cards the flight comes close enough to read: the drums of this journey and their rows, and four rows the docs
// name without a drum. Every other card in the room is too small or too far off.
const CARDS = [
  ['Sloe', 'Hedge Row'], ['Kittiwake', 'Gull Row'], ['Gloaming', 'Weather Row'], ['Squall', 'Weather Row'], ['Carillon', 'Bell Row'], ['Dulse', 'Kelp Row'], ['Madder', 'Pigment Row'],
  ['Sorrel', 'Herb Row'], ['Tansy', 'Herb Row'], ['Chervil', 'Herb Row'], ['Lovage', 'Herb Row'], ['Rue', 'Herb Row'], ['Yarrow', 'Herb Row'], ['Borage', 'Herb Row'],
  ['Ochre', 'Pigment Row'], ['Thimble Row'], ['Spelt', 'Grain Row'], ['Cooper Row'], ['Kite Row'], ['Quill Row'],
];
const SHELF_Y = (k) => 0.32 + 0.44 * k, NSHELF = 15, PITCH = 0.34;
const CARD_X0 = -12.1;                         // the first lettered crock on the back wall's shelves; they run anti from it
const PAPERS = ['#efe6cf', '#e6dcc0', '#f1ead8', '#e3d6b8', '#dfe3da'], INKS = ['#2f2a26', '#34385a', '#5a3020', '#33483a'];

function* buildCrockRoom(deck, rng) {
  const b = deck.bucket(-14, 39, 'crock'), g = b.g, k = deck.glowK, clk = deck.clk;
  const dark = '#4a3824', wood = '#6a5238', edge = '#8a6c48', plaster = '#cdb894';
  b.f.tint(0.5).floor(CX0, CZ0, CX1, CZ1, 0, '#8f7a62', { emit: 0.45 }).tint(0);
  g.floor(CX0, CZ0, CX1, CZ1, CH, '#8a7458', { down: true, emit: 0.2 * k });
  for (let z = CZ0 + 1.8; z < CZ1 - 1; z += 2.4) g.box(CX0, CH - 0.24, z - 0.1, CX1, CH, z + 0.1, '#6a5238', { skip: 't' });
  wallZ(g, CX0, CX1, 0, CH, CZ1, -1, dark); wallZ(g, CX0, CX1, 0, CH, CZ0, 1, dark); wallX(g, CZ0, CZ1, 0, CH, CX0, 1, dark);
  wallX(g, CZ0, ARCH[0], 0, CH, CX1, -1, plaster); wallX(g, ARCH[1], CZ1, 0, CH, CX1, -1, plaster); wallX(g, ARCH[0], ARCH[1], 2.7, CH, CX1, -1, plaster);
  deck.sign('Leave a spoon.', { at: [CX1 - 0.05, 3.75, (ARCH[0] + ARCH[1]) / 2], n: [-1, 0], w: 4.2, h: 0.62, style: 'board', font: 'italic', ground: '#231a10', ink: '#e9b979' });
  g.box(CX1 - 0.035, 3.38, ARCH[0] - 0.1, CX1, 4.12, ARCH[1] + 0.1, '#3a2a1a', { skip: 'e' });
  // panelling to shoulder height either side of the arch, and a wooden frame round it
  for (const [za, zb] of [[CZ0 + SD, ARCH[0]], [ARCH[1], CZ1 - SD]]) {
    g.box(CX1 - 0.03, 0, za, CX1, 1.3, zb, wood, { skip: 'be' }).box(CX1 - 0.05, 1.3, za, CX1, 1.36, zb, edge, { skip: 'e' });
    for (let z = za + 0.5; z < zb - 0.2; z += 0.62) g.box(CX1 - 0.04, 0.12, z - 0.02, CX1 - 0.03, 1.24, z + 0.02, edge, { skip: 'e' });
  }
  g.box(CX1 - 0.06, 0, ARCH[0] - 0.14, CX1, 2.84, ARCH[0], edge, { skip: 'be' }).box(CX1 - 0.06, 0, ARCH[1], CX1, 2.84, ARCH[1] + 0.14, edge, { skip: 'be' }).box(CX1 - 0.06, 2.7, ARCH[0], CX1, 2.84, ARCH[1], edge, { skip: 'e' });
  yield 'bakehouse: crock room';
  // ---- shelves on three walls: boards every 44 cm from the floor to the ceiling, uprights between
  for (let s = 0; s < NSHELF; s++) {
    const y = SHELF_Y(s);
    g.box(CX0, y - 0.03, CZ1 - SD, CX1, y, CZ1, wood, { skip: 's', sides: edge }).box(CX0, y - 0.03, CZ0, CX1, y, CZ0 + SD, wood, { skip: 'n', sides: edge }).box(CX0, y - 0.03, CZ0 + SD, CX0 + SD, y, CZ1 - SD, wood, { skip: 'w', sides: edge });
    if (clk.due()) { yield 'bakehouse: shelves'; clk.go(); }
  }
  yield 'bakehouse: shelves';
  // (an upright after every fourth crock, midway between two)
  for (let x = CARD_X0 + 8.5 * PITCH; x > CX0 + SD; x -= 4 * PITCH) for (const z of [CZ0, CZ1 - SD]) g.box(x - 0.022, 0, z, x + 0.022, CH, z + SD, wood, { skip: 'tb', sides: edge });
  for (let z = CZ0 + SD + 0.3 - PITCH / 2; z < CZ1 - SD; z += 4 * PITCH) g.box(CX0, 0, z - 0.022, CX0 + SD, CH, z + 0.022, wood, { skip: 'tb', sides: edge });
  g.box(CX0, 0, CZ1 - SD, CX1, SHELF_Y(0) - 0.03, CZ1, wood, { skip: 'bs' }).box(CX0, 0, CZ0, CX1, SHELF_Y(0) - 0.03, CZ0 + SD, wood, { skip: 'bn' }).box(CX0, 0, CZ0 + SD, CX0 + SD, SHELF_Y(0) - 0.03, CZ1 - SD, wood, { skip: 'bw' });
  yield 'bakehouse: shelves';
  // ---- the crocks. On the back wall, at eye height where the flight passes, twenty have cards that can be read
  const lettered = new Map();
  CARDS.forEach((c, i) => lettered.set((2 + (i < 7 ? 2 : i < 14 ? 1 : 0)) + '_' + (i % 7), c));     // shelf _ place along it
  const jars = [];        // the crocks under cloth: those near the flight are given a cloth that swells and sinks
  const stand = (p, yaw, plain) => { const w = rng.f(0.86, 1.04), kind = plain || rng() < 0.6 ? 'crock' : 'jar', it = deck.put(kind, { p, yaw, scale: plain ? 1 : [w, rng.f(0.8, 1.12), w], color: rng.pick(GLAZE) }); if (kind === 'jar') jars.push(it); };
  for (let s = 0; s < NSHELF; s++) {
    const y = SHELF_Y(s);
    for (let x = CARD_X0 + 9 * PITCH; x > CX0 + SD + 0.2; x -= PITCH) {
      const c = Math.round((CARD_X0 - x) / PITCH), card = lettered.get(s + '_' + c);
      if (card) {
        stand([x, y, CZ1 - 0.2], 0, true);
        const ground = PAPERS[(s + c * 3) % PAPERS.length], ink = INKS[(s * 2 + c) % INKS.length], o = { n: [0, -1], style: 'card', font: 'hand', ground, ink };
        deck.sign(card, { ...o, at: [x, y + CARD_Y, CZ1 - 0.2 - 0.158], w: 0.204, h: 0.129 });
        deck.sign(card, { ...o, at: [x, y + CARD_Y, CZ1 + 0.4], w: 0.816, h: 0.516 });                 // the same card large, behind the wall: it is lettered at this size
        if (card[0] === 'Lovage') {
          const p = { n: [0, -1], style: 'card', font: 'hand', ground: '#f1ead8', ink: '#7a756c' };
          deck.sign('says it is Chervil', { ...p, at: [x + 0.012, y + 0.053, CZ1 - 0.2 - 0.162], w: 0.22, h: 0.052 });
          deck.sign('says it is Chervil', { ...p, at: [x, y + 0.053, CZ1 + 0.4], w: 1.54, h: 0.364 });
        }
      } else if (rng() < 0.94) stand([x + rng.f(-0.02, 0.02), y, CZ1 - 0.2 + rng.f(-0.02, 0.03)], rng.f(-0.25, 0.25));
      if (rng() < 0.94) stand([x + rng.f(-0.02, 0.02), y, CZ0 + 0.2 + rng.f(-0.03, 0.02)], Math.PI + rng.f(-0.25, 0.25));
    }
    for (let z = CZ0 + SD + 0.3; z < CZ1 - SD - 0.2; z += PITCH) if (rng() < 0.94) stand([CX0 + 0.2 + rng.f(-0.03, 0.02), y, z + rng.f(-0.02, 0.02)], -Math.PI / 2 + rng.f(-0.25, 0.25));
    if (clk.due()) { yield 'bakehouse: crocks'; clk.go(); }
  }
  // by the arch, a table of spoons on their way: small jars for the Gate, and jars come back from the library
  {
    const tx = CX1 - 0.55, t0 = 34.3, t1 = 36.5;
    g.box(tx - 0.36, 0.78, t0, tx + 0.36, 0.84, t1, '#8a6a46').box(tx - 0.3, 0, t0 + 0.08, tx - 0.24, 0.78, t0 + 0.14, wood, { skip: 'tb' }).box(tx + 0.24, 0, t0 + 0.08, tx + 0.3, 0.78, t0 + 0.14, wood, { skip: 'tb' }).box(tx - 0.3, 0, t1 - 0.14, tx - 0.24, 0.78, t1 - 0.08, wood, { skip: 'tb' }).box(tx + 0.24, 0, t1 - 0.14, tx + 0.3, 0.78, t1 - 0.08, wood, { skip: 'tb' });
    for (const [zc, lid, word] of [[34.85, '#8a5a34', 'For the Gate'], [35.95, '#5a7a6a', 'Back from the library']]) {
      g.box(tx - 0.26, 0.84, zc - 0.36, tx + 0.26, 0.87, zc + 0.36, '#b9a27c');
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.cyl(tx - 0.12 + j * 0.24, 0.87, zc - 0.25 + i * 0.165, 0.045, 0.045, 0.1, 6, '#dfe8e2', { smooth: false, top: lid });
      deck.sign(word, { at: [tx - 0.365, 0.72, zc], n: [-1, 0], w: 0.5, h: 0.1, style: 'card', font: 'hand' });
    }
  }
  // a ladder to the high shelves, on the anti wall
  for (const dz of [-0.24, 0.24]) g.tube([[CX0 + 1.5, 0, 36.6 + dz], [CX0 + SD + 0.06, 6.7, 36.6 + dz]], 0.028, 5, '#9a7a50');
  for (let i = 1; i < 20; i++) { const t = i / 20.5; g.box(lerp(CX0 + 1.5, CX0 + SD + 0.06, t) - 0.03, 6.7 * t - 0.015, 36.36, lerp(CX0 + 1.5, CX0 + SD + 0.06, t) + 0.03, 6.7 * t + 0.015, 36.84, '#b08f60'); }
  yield 'bakehouse: crocks';
  // ---- lamps: nine under the ceiling, and one let down on a long cord over the mother
  const lat = { origin: [CX0 + 2.8, CH - 0.5, CZ0 + 2.6], spacing: [2.9, 2.9], count: [3, 3], color: '#ffc98a', power: 0.55, reach: 4.6 };
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const x = lat.origin[0] + i * 2.9, z = lat.origin[2] + j * 2.9;
    deck.put('workLamp', { p: [x, CH, z], yaw: 0, color: '#b9a27c' });
    deck.glow([{ p: [x, CH - 0.52, z], color: '#ffc98a', power: 1.0, size: 0.5 }]);
  }
  deck.lattice({ ...lat, power: lat.power / deck.level });
  const [mx, mz] = MOTHER;
  g.cyl(mx, 2.72, mz, 0.008, 0.008, CH - 2.72, 4, '#3a3b3c', { cap: false }).cyl(mx, 2.5, mz, 0.3, 0.08, 0.22, 10, '#b9a27c', { smooth: false, cap: false }).cyl(mx, 2.49, mz, 0.25, 0.25, 0.012, 10, '#ffe6c0', { emit: 3, smooth: false, base: true });
  deck.glow([{ p: [mx, 2.44, mz], color: '#ffd9a8', power: 1.0, size: 0.6 }]);
  deck.zone({ min: [mx - 1.5, -0.2, mz - 1.5], max: [mx + 1.5, 2.45, mz + 1.5], soft: 1.3, color: '#ffe2b8', power: 0.5, side: 0.7, under: 0.2 });
  for (let i = 0; i < 70; i++) deck.glow([{ p: [mx + rng.f(-1.6, 1.6), rng.f(0.6, 2.4), mz + rng.f(-1.6, 1.6)], color: '#fff1da', power: rng.f(0.5, 1.4), size: rng.f(0.006, 0.013), move: [rng.f(-0.02, 0.02), rng.f(-0.02, 0.012), rng.f(-0.02, 0.02)], loop: rng.f(8, 15), twinkle: 0.35, phase: rng() }]);
  theMother(deck, g);
  // the live cloths: on the crocks under cloth within a few metres of the flight, and a great one on the mother
  const rc = makeRng('cloths'), cloths = ['#eee6d2', '#e6dcc4', '#f1ead8', '#ded3b8', '#e9e2d0'];
  const covers = jars.filter((it) => deck.dist(it.p[0], it.p[1], it.p[2]) < 3.3).map((it) => ({ p: [it.p[0], it.p[1] + 0.29 * it.scale[1] + 0.002, it.p[2]], yaw: rc() * TAU, scale: [it.scale[0], 1, it.scale[0]], color: rc.pick(cloths) }));
  covers.push({ p: [mx, 0.46 + 1.012, mz], yaw: 0, scale: [4.38, 1.7, 4.38], color: '#d8cdb2' });
  return { covers };
}

// The year's mother: a crock the size of a barrel on a low table, under a cloth, with a slate hung on it by a cord.
// The slate keeps the tally of drums in strokes of chalk, five to a gate. As the flight finds it there are forty-two
// gates and two strokes, and 212 under them. The 213th stroke, the line through 212 and the 213 are written while
// the flight watches (pellWrites).
function theMother(deck, g) {
  const [mx, mz] = MOTHER, ty = 0.46, X = mx - 0.492, chalk = '#e9e6da';
  g.cyl(mx, ty - 0.06, mz, 0.86, 0.86, 0.06, 14, WOOD, { smooth: false, base: true });
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.6, x = mx + Math.cos(a) * 0.62, z = mz + Math.sin(a) * 0.62; g.box(x - 0.04, 0, z - 0.04, x + 0.04, ty - 0.06, z + 0.04, WOOD2, { skip: 'tb' }); }
  g.lathe(mx, ty, mz, [[0.36, 0], [0.43, 0.2], [0.45, 0.5], [0.43, 0.8], [0.39, 0.96]], 18, (i) => (i < 1 ? '#7a5a3c' : i < 3 ? '#b9a27c' : '#a08a66'));
  g.cyl(mx, ty + 0.94, mz, 0.415, 0.43, 0.07, 18, '#cfc4a8', { smooth: false, top: '#d8cdb2' });
  g.cyl(mx, ty + 0.9, mz, 0.4, 0.4, 0.016, 18, '#8a6238', { smooth: false, cap: false });
  // the slate, on the anti side, where someone coming round the table reads it
  g.box(X, 0.6, mz - 0.32, mx - 0.47, 1.4, mz + 0.32, '#2c3330', { skip: 'e' });
  for (const [y0, y1, z0, z1] of [[0.58, 0.61, -0.34, 0.34], [1.39, 1.42, -0.34, 0.34], [0.58, 1.42, -0.34, -0.31], [0.58, 1.42, 0.31, 0.34]]) g.box(X - 0.012, y0, mz + z0, mx - 0.47, y1, mz + z1, '#7a5a3a', { skip: 'e' });
  for (const s of [-1, 1]) g.tube([[X + 0.01, 1.42, mz + s * 0.26], [mx - 0.4, ty + 0.93, mz + s * 0.12]], 0.006, 3, '#b9a37c');
  const stroke = (z0, y0, z1, y1, w, e = 0.12) => { const dz = z1 - z0, dy = y1 - y0, l = Math.hypot(dz, dy), pz = -dy / l * w / 2, py = dz / l * w / 2, x = X - 0.009; g.quad([x, y0 - py, z0 - pz], [x, y1 - py, z1 - pz], [x, y1 + py, z1 + pz], [x, y0 + py, z0 + pz], chalk, e); };
  const rs = makeRng('tally');
  for (let n = 0, left = 212; left > 0; n++) {
    const zc = mz - 0.26 + ((n % 9) + 0.5) * 0.0578, yc = 1.235 - (Math.floor(n / 9) + 0.5) * 0.072, m = Math.min(5, left);
    for (let i = 0; i < Math.min(4, m); i++) { const z = zc + (i - 1.5) * 0.0095; stroke(z + rs.f(-0.002, 0.002), yc - 0.023, z + rs.f(-0.002, 0.002), yc + 0.023, 0.0036); }
    if (m === 5) stroke(zc - 0.023, yc - 0.017 + rs.f(-0.004, 0.004), zc + 0.023, yc + 0.017 + rs.f(-0.004, 0.004), 0.0036);
    left -= m;
  }
  const o = { n: [-1, 0], style: 'chalk', ground: '#2c3330' };
  deck.sign('The mother', { ...o, at: [X - 0.004, 1.315, mz], w: 0.5, h: 0.1 });
  deck.sign('212', { ...o, at: [X - 0.004, 0.795, mz - 0.05], w: 0.26, h: 0.1, ink: '#bdbbb0' });
}

// "He chalked two hundred and thirteen on the mother's crock while I watched." Pell comes in to the mother's table
// behind the flight, while it reads the cards, and is found stooped to the slate. A figure cannot move its arms, so
// the arm that writes is a mesh of its own, turned about his shoulder to follow the chalk; and what the chalk has
// written is one mesh of short strokes in the order he makes them, drawn as far as he has got: the 213th stroke of
// the tally, a line through 212, and 213 under it. Returns { show(on), at(t) } for the world's update().
// (the figures' strokes are FIG1..FIG3, not ONE..THREE: in the built page a module's `THREE` would shadow three.js itself)
const WRITE0 = 46.3, FIG2 = [[0.06, 0.74], [0.18, 0.93], [0.4, 1.0], [0.62, 0.9], [0.66, 0.68], [0.5, 0.44], [0.26, 0.22], [0.04, 0.0], [0.34, 0.02], [0.74, 0.0]];
const FIG1 = [[0.18, 0.74], [0.42, 1.0], [0.42, 0.0]], FIG3 = [[0.1, 0.88], [0.3, 1.0], [0.56, 0.96], [0.68, 0.78], [0.56, 0.58], [0.34, 0.52], [0.58, 0.46], [0.72, 0.26], [0.6, 0.06], [0.36, 0.0], [0.12, 0.1]];
// a smooth line through points (Catmull-Rom), n pieces to each span
function smoothLine(p, n = 5) {
  const out = [];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(i - 1, 0)], b = p[i], c = p[i + 1], d = p[Math.min(i + 2, p.length - 1)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((j) => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t3))); }
  }
  out.push(p[p.length - 1]);
  return out;
}
function pellWrites(deck, figMat) {
  const frame = deck.frame, [mx, mz] = MOTHER, X = mx - 0.492 - 0.009;
  // ---- what he writes, in order: [points on the slate (z, y), the line's width, seconds to make it, seconds the chalk is off the slate before it]
  const zt = mz - 0.26 + 6.5 * 0.0578 + 0.5 * 0.0095, yt = 1.235 - 4.5 * 0.072;
  const digit = (pts, z0, n) => smoothLine(pts.map(([u, v]) => [z0 + (u + 0.14 * v) * 0.108, 0.62 + v * 0.125]), n);
  const strokes = [
    [[[zt, yt + 0.023], [zt + 0.001, yt - 0.023]], 0.0036, 0.3, 0],
    [[[mz - 0.17, 0.77], [mz - 0.05, 0.798], [mz + 0.07, 0.822]], 0.009, 0.5, 0.45],
    [digit(FIG2, mz - 0.09), 0.009, 0.62, 0.45], [digit(FIG1, mz + 0.027, 1), 0.009, 0.34, 0.14], [digit(FIG3, mz + 0.118), 0.009, 0.66, 0.14],
  ];
  const g = new Geo(), starts = [], tips = [];          // when each short stroke begins; where the chalk is: [time, z, y, lifted on the way here]
  let tm = WRITE0;
  for (const [pts, w, dur, lift] of strokes) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    tm += lift; tips.push([tm, pts[0][0], pts[0][1], 1]);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), dz = (b[0] - a[0]) / l, dy = (b[1] - a[1]) / l, e = w * 0.45, pz = -dy * w / 2, py = dz * w / 2;
      const z0 = a[0] - dz * e, y0 = a[1] - dy * e, z1 = b[0] + dz * e, y1 = b[1] + dy * e;
      g.quad([X, y0 - py, z0 - pz], [X, y1 - py, z1 - pz], [X, y1 + py, z1 + pz], [X, y0 + py, z0 + pz], '#e9e6da', 0.16);
      starts.push(tm); tm += dur * l / len; tips.push([tm, b[0], b[1], 0]);
    }
  }
  tips.push([tm + 0.5, mz + 0.27, 0.65, 1]);          // and the stub of chalk comes to rest at the end of the line
  const chalk = g.mesh(deck.lit, frame);
  // ---- Pell, stooped to the slate from beside it (so that his arm never hides what he has written), and the arm that writes
  const at = [-14.87, 40.0], yaw = Math.atan2(X - at[0], mz + 0.05 - at[1]), LEAN = 0.62;
  const shown = instances(pellGeo(SKIN[1], LEAN), figMat, [{ p: [at[0], 0, at[1]], yaw, scale: PELL_S, color: SHIRT }], { frame });
  const S = pellPoint(at, yaw, LEAN, [0.27, 1.38, 0.02]), d0 = [X - S[0], tips[0][2] - S[1], tips[0][1] - S[2]], L0 = Math.hypot(d0[0], d0[1], d0[2]);
  const on = (f, o = [0, 0, 0]) => [S[0] + d0[0] * f + o[0], S[1] + d0[1] * f + o[1], S[2] + d0[2] * f + o[2]];
  const ag = new Geo({ maxSeg: 8 }), elbow = on(0.47, [-0.07, -0.02, 0.05]);
  ag.tube([S, elbow], 0.085, 5, SHIRT, { smooth: false }).tube([elbow, on(0.9)], 0.07, 5, FLOUR, { smooth: false });
  ag.blob(...on(0.91), 0.075, 0, SKIN[1], { shadeBottom: 0.9 }).tube([on(0.93), on(1)], 0.011, 4, '#f6f3ea', { emit: 0.5 });
  const armMesh = ag.mesh(deck.lit, frame);
  armMesh.matrixAutoUpdate = false; shown.push(armMesh, chalk);
  for (const m of shown) deck.group.add(m);
  const ZERO = new Vector3(), UP = new Vector3(0, 1, 0), d = new Vector3(), sc = new Vector3(), Q = new Matrix4(), R = new Matrix4();
  const B = frame.stand(S[0], S[2], { h: S[1] }), Bi = B.clone().invert(), Q0i = new Matrix4().lookAt(d.set(d0[0], d0[1], d0[2]), ZERO, UP).invert();
  return {
    show(on2) { for (const m of shown) m.visible = on2; },
    at(t) {
      let k = 0; while (k < starts.length && starts[k] <= t) k++;
      chalk.geometry.setDrawRange(0, k * 6);
      let i = 0; while (i < tips.length - 2 && tips[i + 1][0] <= t) i++;
      const a = tips[i], b = tips[i + 1], u = clamp((t - a[0]) / Math.max(b[0] - a[0], 1e-3), 0, 1), s = b[3] ? u * u * (3 - 2 * u) : u, off = t < WRITE0 ? 1 : b[3] ? Math.sin(Math.PI * u) : 0;
      d.set(X - 0.004 - 0.03 * off - S[0], lerp(a[2], b[2], s) - S[1], lerp(a[1], b[1], s) - S[2]);
      R.copy(Q.lookAt(d, ZERO, UP)).scale(sc.set(1, 1, d.length() / L0)).multiply(Q0i);
      armMesh.matrix.copy(B).multiply(R).multiply(Bi); armMesh.matrixWorldNeedsUpdate = true;
    },
  };
}

// The night crews going home along the arcade, anti, each with a loaf under one arm. A walker and a loaf are two
// copies that travel the same line on the same clock (the kit's walkers, and a furnishing given the same drift).
// They keep to the front side of the street; the flight keeps to the back.
function nightCrews(deck, rng) {
  const X0 = 88, len = 176, lanes = [-1.35, -1.9, -2.45], gold = ['#c08a4a', '#b9773a', '#d09a56', '#a5632f'];
  for (let i = 0, n = Math.round(56 * deck.density); i < n; i++) {
    const z = lanes[i % 3] + rng.f(-0.12, 0.12), sp = 1.35 * rng.f(0.9, 1.1), drift = [-sp, 0, 0, len / sp], phase = rng(), side = rng() < 0.5 ? -1 : 1;
    deck.walkers.push({ p: [X0, 0, z], yaw: -Math.PI / 2, drift, phase, color: rng.pick(CREW), child: false, skin: rng.pick(SKIN), scale: rng.f(0.94, 1.06) });
    deck.put('loafGo', { p: [X0 - 0.02, 1.07, z + side * 0.26], yaw: rng.f(-0.3, 0.3), scale: rng.f(1.0, 1.18), color: rng.pick(gold), drift, phase });
  }
}

// ---------------------------------------------------------------- the world
// Along the dark arcade toward the gold of the doors; in at Pell's; up the room between the benches and the ovens,
// past the oven whose door comes down on a loaded peel; past the cooling racks and Pell into the crock room; along the
// cards; round by the anti wall to the mother, where Pell has come in behind the flight and chalks 213 on her slate
// (the view keeps three metres and more from him); out south of her table, across the bakehouse, and into the mouth
// of the last oven.
const KEYS = [
  { t: 0, p: [-30, 1.6, 0.4] },
  { t: 4.6, p: [-23, 1.6, 0.4] },
  { t: 8.6, p: [-14.6, 1.6, 0.4], look: [0, 1.5, 3.2] },
  { t: 11.6, p: [-7.2, 1.6, 0.5], look: [0.5, 1.45, 6] },
  { t: 13.6, p: [-2.6, 1.6, 1.7], look: [0.9, 1.4, 10] },
  { t: 15.6, p: [-0.1, 1.6, 5.4], look: [0.6, 1.3, 14] },
  { t: 18.6, p: [0.7, 1.62, 11], look: [-3.1, 1.05, 17] },
  { t: 21.4, p: [1.0, 1.6, 15.6], look: [6.6, 1.45, 21.8] },
  { t: 24.4, p: [2.0, 1.5, 19.2], look: [6.7, 1.42, 22.0], fov: 52 },
  { t: 26.4, p: [0.95, 1.58, 23.2], look: [3.9, 1.4, 31.3] },
  { t: 28.2, p: [0.9, 1.6, 26.4], look: [-0.5, 1.3, 32.0] },
  { t: 30.6, p: [0.2, 1.6, 31.5], look: [-7, 1.5, 36.5] },
  { t: 33.6, p: [-3.4, 1.6, 37.6], look: [-13, 2.6, 40] },
  { t: 36.2, p: [-8.6, 1.62, 40.5], look: [-15, 3.6, 43.2] },
  { t: 38.4, p: [-11.4, 1.8, 42.5], look: [-12.6, 1.97, 44.14], fov: 50 },
  { t: 41.8, p: [-14.4, 1.8, 42.5], look: [-13.9, 1.95, 44.14], fov: 50 },
  { t: 43.5, p: [-16.3, 1.84, 42.55], look: [-14.9, 2.2, 44.6] },
  { t: 45.1, p: [-17.75, 1.82, 41.4], look: [-15.2, 1.7, 41.9] },
  { t: 46.6, p: [-18.2, 1.76, 39.6], look: [-14.55, 1.02, 39.15], fov: 39 },
  { t: 48.5, p: [-18.17, 1.74, 39.15], look: [-14.52, 0.98, 39.12], fov: 37 },
  { t: 50.3, p: [-18.05, 1.72, 38.6], look: [-14.5, 0.96, 39.1], fov: 36 },
  { t: 52.1, p: [-15.3, 1.64, 36.25], look: [-12.2, 1.35, 38.5] },
  { t: 53.8, p: [-11.5, 1.6, 37.0], look: [-5.5, 1.7, 39.6] },
  { t: 55.5, p: [-7.9, 1.57, 39.3], look: [OVX, EXITY, EXITZ] },
  { t: 57.9, p: [-2.2, EXITY, EXITZ] },
  { t: 60.3, p: [2.6, EXITY, EXITZ] },
  { t: 62.7, p: [6.0, EXITY, EXITZ] },
  { t: 65.0, p: [8.0, EXITY, EXITZ] },
];
const PELL_GO = 39.6;                         // when Pell leaves the arch for the mother's table: the flight has its back to both

export const speltBakehouse = {
  id: 'spelt-bakehouse',
  title: "Half past four at Pell's",
  drum: 'Spelt', row: 'Grain Row', kind: 'a maker drum', light: 23.7,
  line: "Spelt's lamps come up at half past four, two hours before ours, and Pell has been at the ovens since two. He chalked two hundred and thirteen on the mother's crock while I watched. The night crews go home past his door and every one of them leaves with a loaf.",
  tone: '#e9b979',
  source: 'wander-year.md (Day 290, Day 365), three-nights 15-canon.js (Spelt), eating-out.md (The Crock), ashgrove.md (Day one)',
  sound: { root: 45, scale: 'mixo', pad: 0.45, air: 0.15, hum: 0.3, crowd: 0.35, bells: 0.15, bright: 0.5 },
  *build(ctx) {
    const frame = makeFrame(212 * DEG, 2292, deckRadius(17));           // a Low deck over a station ring
    const rng = makeRng('pell');
    const path = makePath(KEYS, { frame, entryRadius: 1.1, exitRadius: 0.65 });
    const ex = path.exit.flat, T = path.tCross;
    const deck = makeDeck(ctx, {
      frame, near: path.points(0.5), seed: 'pell', palette: CRUST, detail: 46,
      light: { level: 1.3, lamp: '#ffd9a8', ambUp: '#6a5642', ambDown: '#43352a', ambPower: 0.1, haze: '#0c0906', hazeDensity: 0.012 },
      floor: { shine: 1, lampGlow: 2.4 },
    });
    yield 'bakehouse: path';
    protos(deck);
    yield 'bakehouse: deck';
    const arc = yield* buildArcade(deck, rng);
    const shell = buildShell(deck);
    yield 'bakehouse: shell';
    const leaves = yield* buildOvens(deck, rng, ex);
    yield 'bakehouse: ovens';
    const groups = new Map();
    const folk = (pose, item) => { const skin = SKIN[Math.floor(rng() * 5)], key = pose + '|' + skin; let a = groups.get(key); if (!a) groups.set(key, a = { pose, skin, items: [] }); a.items.push({ scale: rng.f(0.94, 1.06), ...item }); };
    yield* furnish(deck, rng, folk);
    const peel = heroPeel(deck, rng, OPENERS[1].at);
    yield 'bakehouse: the peel';
    const push = yield* pushedRack(deck, rng);
    yield 'bakehouse: the rack';
    yield* flourAir(deck, rng, shell.lamps);
    yield 'bakehouse: flour';
    const room = yield* buildCrockRoom(deck, rng);
    nightCrews(deck, rng);
    yield 'bakehouse: crews';
    // the bakers, Pell at the arch (a head taller and half again as wide as anyone), a wanderer by the mother
    const figMat = litMaterial(deck.rig, { bend: frame, soft: 0.45 });
    yield 'bakehouse: bakers';
    const workMat = liveMaterial(deck, SHAPING);
    yield 'bakehouse: bakers';
    for (const q of groups.values()) {
      for (const m of instances(bakerGeo(q.pose, q.skin), q.pose === 'shape' ? workMat : figMat, q.items, { frame })) deck.group.add(q.pose === 'shape' ? phased(m, rng) : m);
      yield 'bakehouse: bakers';
    }
    // the cloths over the crocks near the flight, and the mother's own, swelling and sinking
    for (const m of instances(coverGeo(), liveMaterial(deck, SWELLING), room.covers, { frame })) deck.group.add(phased(m, makeRng('covers')));
    yield 'bakehouse: covers';
    const pellArch = instances(pellGeo(SKIN[1]), figMat, [{ p: [PELL[0], 0, PELL[1]], yaw: 0.9, scale: PELL_S, color: SHIRT }], { frame });
    for (const m of pellArch) deck.group.add(m);
    yield 'bakehouse: Pell';
    const writing = pellWrites(deck, figMat);
    yield 'bakehouse: the slate';
    // the wanderer stands behind him and watches, the spoon still in her hand
    for (const m of instances(wandererGeo(SKIN[3]), figMat, [{ p: [-13.6, 0, 41.0], yaw: Math.atan2(MOTHER[0] - 0.5 + 13.6, MOTHER[1] - 41.0), color: CLOTH[4] }], { frame })) deck.group.add(m);
    yield 'bakehouse: a wanderer';
    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);

    const rig = deck.rig, exitLeaf = leaves.find((l) => l.i === NOV - 1);
    const zExit = { min: [OVX - 3.4, -0.2, EXITZ - 1.8], max: [OVX + 0.2, 2.7, EXITZ + 1.8], soft: 1.1, color: '#ff9a4c', side: 1, under: 0.5 };
    const iExit = deck.zone({ ...zExit, power: 0 });
    // the glow at the last oven's mouth, and its breath of steam as the door comes down
    const rs = makeRng('last-oven'), halo = [{ p: [OVX - 0.06, EXITY, EXITZ], color: '#ff8a3a', power: 0.5, size: 2.4 }];
    for (let i = 0; i < 30; i++) halo.push({ p: [OVX - rs.f(0.0, 0.6), DECKS[1] + rs.f(0.3, 0.6), EXITZ + rs.f(-0.6, 0.6)], color: '#ffe1c2', power: rs.f(0.06, 0.13), size: rs.f(0.45, 1.0), move: [rs.f(-0.28, -0.05), rs.f(0.3, 0.5), rs.f(-0.08, 0.08)], loop: rs.f(2.6, 4.4), phase: rs() });
    const exitGlow = glowPoints(halo, { bend: frame, minPx: 1.4, maxPx: 380, soft: 2.2, power: 0 });
    scene.add(exitGlow);
    const look = { exposure: 1.55, bloom: 0.3, threshold: 0.95, saturation: 1.06, contrast: 1.06, vignette: 0.55 };
    const opened = (o, t) => smoothstep(o.at, o.at + 1.25, t) - smoothstep(o.shut, o.shut + 1.1, t);
    const hazeNight = new Color('#0c0906'), hazeFlour = new Color('#b0926a'), hazeNow = new Color();
    let shown = -1;
    const update = (t) => {
      // the ovens' doors, the peel, the rack going up the lane
      let hero = 0, last = 0;
      for (const l of leaves) { const q = l === exitLeaf ? smoothstep(T - 9.6, T - 8.2, t) : opened(l, t); l.turn(q); if (l.i === HERO) hero = q; if (l === exitLeaf) last = q; }
      peel(t, hero); push(t);
      // Pell is at the arch as the flight comes by; while it reads the cards, its back to the room, he comes in to
      // the mother's table, and is at the slate when the view comes round
      const there = t >= PELL_GO;
      for (const m of pellArch) m.visible = !there;
      writing.show(there); writing.at(t);
      rig.setZone(iExit, { ...zExit, power: 1.2 * last });
      exitGlow.material.uniforms.uPower.value = last * (1 - smoothstep(T - 4.5, T - 1.5, t));
      // half past four: the arcade's lamps come up from a glimmer (half of the way while the flight is in the street
      // to see it), and the whole deck with them
      const up = smoothstep(2, 50, t), street = 0.5 * smoothstep(1.5, 14.5, t) + 0.5 * smoothstep(14.5, 46, t), within = smoothstep(14.2, 17.6, t);
      if (up + within * 8 === shown) return;
      shown = up + within * 8;
      arc.lampMat.uniforms.uEmit.value = 0.22 + 3.4 * street;
      arc.points.material.uniforms.uPower.value = 0.1 + 0.75 * street;
      rig.setLattice(arc.iLat, { ...arc.lat, power: 0.03 + 0.62 * street });
      rig.setLattice(shell.iLat, { ...shell.lat, power: 0.62 + 0.3 * up });
      // the air: night in the street, where far things sink into the dark; within, flour hanging in the lamp light
      rig.set({ ambUp: '#6a5642', ambDown: '#43352a', ambPower: 0.05 + 0.45 * up, haze: hazeNow.copy(hazeNight).lerp(hazeFlour, within), hazeDensity: lerp(0.012 - 0.006 * street, 0.0065, within) });
      look.exposure = 1.55 - 0.25 * up;
    };
    update(0);
    return { scene, path, deck, near: 0.1, far: 320, look, update, portal: { shape: 'rect', width: MW, height: MH, rim: false, mist: '#e9b979', openFor: 10 } };
  },
};
