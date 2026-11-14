// Sloe, Hedge Row: Hush, at breakfast. Sloe is a wood drum: "Dim woods instead of bright squares; long silences;
// quiet callings held in honour", "a monastery the size of a nation" (open-drums.md, Kinds of open drum). In heliox a
// whisper carries, so nobody talks; "Everyone carries a slate and a stick of chalk", and "The hall serves the Mill
// table in silence, and it's the best jook on Hedge Row, because you actually taste it" (wander-year.md, Day 22;
// three-nights 15-canon.js, Sloe: the neighbourhood Hush, the Quiet Arcade, lamps at 07:00, gin "sold only by the
// glass, and never in the wood", the Wood dusk palette). The breakfast is Ashgrove Mill Hall's lamp-dawn jook with
// chili crisp, sour-starch puffs and milk tea, 0.96 kWh, "served hot under lids at long tables" (eating-out.md).
//
// The flight: along the Quiet Arcade, hung in felt, between two neighbours having an argument across it in chalk;
// out through a hanging drawn aside into the block's wood, four decks high; along a bark path among birches and yews
// standing in beds of pale grit, up among the trunks and down again past someone on a bench with their eyes shut; in
// at the open side of the hall, down one of its five long tables reading the slates propped by the bowls, to a boy
// holding his up; and out by the door at the far end, with four hundred people looking at you.
//
// The sums. A block's park light is about 53 W a head: 2.6 m2 each lit like an overcast day (10,000 lux), "or ten
// times the area at 1,000 lux": "one bright square ... or a dim wood ... Which one is a civic choice" (daily-life.md,
// Light). Hush's wood is 200 m by 56 m, 11,200 m2: 3.7 m2 for each of 3,000 people at about 2 W a square metre, a
// seventh of their park light. The rest goes to the drum's other woods. Sorrel keeps woods indoors too: Hazeldim,
// "lit like a cloudy evening", and Stillwood, "in a four-deck atrium, where past the second birch nobody speaks"
// (sorrel.md). The wood's floor is deck 121, 2,520 m from the axis, where things weigh 0.84 of what they do at the
// rim. It lies spinward, so it curves up: 100 m ahead the floor stands 100 x 100 / (2 x 2,520) = 2 m higher, and the
// hall at the end of the path is seen a little from below. Steam going up at 0.3 m/s is pushed spinward at
// 2 x 0.0572 x 0.3 = 0.034 m/s2: in three seconds it has leaned 15 cm that way, and it is drawn leaning.
//
// Not canon (the docs give the drum, its silence, its slates, the hall's jook, and the names Hush and the Quiet
// Arcade; the rest is this page's own):
//   - the block and its plan: that Hush is a block with a wood in place of a court, 200 m long and four decks high,
//     the Arcade along one side of it and the hall at its end; the deck it stands on; galleries faced in felt
//   - the indoor wood itself (the docs say a wood drum's parks are "one long dim wood", and give Sorrel woods indoors)
//   - felt on everything (Sorrel's Felt Hall and Still Room are hung in it; that Sloe's arcade is, is this page's)
//   - every slate's words, the shops and what they sell, and the tally of silent days. Only the gin counter's
//     slate is the docs' rule, reworded; LISTEN is the docs' word (Sloe's motto, and what its woodwarden wrote), and
//     hanging it over the path a letter to a slate is this page's
//   - the people: the two neighbours, the mother and child, the child who asks, the one on the bench, the two at
//     noughts and crosses, the old woman at the table's end, the keeper at the door, the boy with PASS THE CRISP
//   - the grit kept raked, in rings round the trunks, and someone whose calling that is (the docs say only "quiet
//     callings held in honour"); a robot buffing the Arcade's floor
//   - pale lamps in the arcade and the wood, and warm ones only over the hall's tables; five tables of eighty
//   - that four hundred heads turn: the card says they looked, and here they do, 57 seconds in
import { Scene, InstancedMesh, DynamicDrawUsage, Sphere, Vector3, Vector4, Matrix4, Color, ShaderMaterial, CanvasTexture, Mesh,
  LinearMipmapLinearFilter, LinearFilter, ClampToEdgeWrapping, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, AdditiveBlending } from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, street, hall, Run, PALETTES } from '../kit/deck.js';
import { litMaterial, G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL } from '../kit/mats.js';
import { Geo, instances, shade, mixc, rgb } from '../kit/geo.js';
import { treeGeo } from '../kit/flora.js';
import { SKIN } from '../kit/folk.js';
import { makeRng, smoothstep, clamp, fbm2 } from '../core/rng.js';

// ---------------------------------------------------------------- the place, in the frame of deck 121 (x spinward, z along the axis)
const AW = 8, AH = 3;                               // the Quiet Arcade: an avenue along x at z = 0
const WX0 = -100, WX1 = 100, WZ0 = 4.33, WZ1 = 60, WTOP = 16;      // the wood: behind the Arcade's back side, four decks high
const MOUTH = [-4, 2];                              // the bay of the Arcade whose hanging is drawn aside
const HX0 = 100, HZ0 = 20, HZ1 = 44, HH = 3;        // the hall: at the wood's spinward end, open to it
const SBW = (WZ1 - WZ0) / 10, OPEN0 = WZ0 + 3 * SBW, OPEN1 = WZ0 + 7 * SBW;     // four bays of the wood's end wall stand open on the hall
const TX0 = 104.5, TX1 = 129.5, ROWS = 5, SEATS = 40, PITCH = 0.62;     // five long tables, forty places a side
const TZ = (r) => HZ0 + (HZ1 - HZ0) * (r + 0.5) / ROWS;               // a table's centre line (the kit's own rule)
const HERO = 2, CZ = TZ(HERO);                      // the table the flight goes down: z = 32
const T_LAUGH = 57.7;                               // the second the wanderer laughs out loud

// Wood dusk: #14191a #2f3d36 #8a9a84 #eef1e6 (three-nights 15-canon.js, Sloe)
const HUSH = {
  ...PALETTES.dim,
  walls: ['#7d8578', '#747d72', '#868b7c', '#6f786f', '#7f8474', '#787f76'],
  dado: ['#4a554b', '#434e47', '#525a4c', '#3f4a42'],
  trim: ['#2f3530', '#363b33', '#2a302c', '#3a3d33'],
  doors: ['#3f5247', '#35484a', '#4d5a48', '#5a5a44', '#3d4750', '#4a4f47', '#55604f', '#2f3d36'],
  awnings: [['#4a554b', '#8a9a84'], ['#3f4a42', '#868f7c'], ['#566055', '#9aa392'], ['#454e47', '#8f9788'], ['#5e6658', '#a0a694']],
  signs: [['#2c3330', '#e9e6da'], ['#2a302e', '#e6e4d6'], ['#30363a', '#e9e6da'], ['#2c3330', '#dfe2d4'], ['#262c2a', '#eef1e6'], ['#2f3632', '#e9e6da']],
  floor: '#6c7067', strip: '#4a4f48', court: '#8a8d80', ceiling: '#535b53', rib: '#7a8276',
  rooms: ['#9aa38f', '#8f9a8c', '#a3a694', '#8a9488', '#a0a08c', '#939c90', '#a8ab98'],
  metal: '#505450', brass: '#8a8468', glass: '#9fb0aa',
  leaf: ['#4f6a4c', '#456248', '#5a7352', '#3f5a44', '#557052', '#4a6852'],
  bloom: ['#d2d4c6', '#bfc4b0', '#c9c6b4', '#b9c0b2', '#cfd2c2'],
  tub: ['#6a6f62', '#7f8376', '#5a5f55', '#74786a'],
  lamp: '#eef1e6', window: ['#d3dacb', '#e2e7d9', '#c9d0c0', '#dadfd0'], shop: '#e4eadb',
  goods: 0.45,
};
const FELT = ['#6f7b6c', '#5f6b60', '#7d8876', '#667262', '#8a917c', '#59645a', '#757f6e', '#848b78'];
const CLOTHES = ['#6d766a', '#8a8476', '#5d6a6e', '#9b9584', '#4f5854', '#7b6e5f', '#a9a99b', '#65705f', '#7f7a6b', '#5a6057', '#8f9a8c', '#746a5c', '#b9b7a8', '#3f4744', '#93876f', '#6f7f86', '#c4c2b4', '#57504a'];
const HAIR = ['#2a211b', '#3b2c21', '#5c4631', '#1d1a18', '#8d8880', '#d5d2c8', '#b9b4aa', '#6b5444'];
const SKINS = SKIN.slice(0, 5);
const STONE = '#2c3330', FRAME = '#a59a82', CHALK = '#e9e6da', WOODC = '#6b5a48', SHOE = '#8f8f80';
const PALE = '#eef1e6', WARM = '#ffbd7c';
const MIRROR = new Matrix4().makeScale(-1, 1, 1);
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- slates
// A slate: dark stone in a wooden frame, lettered in the kit's chalk. o: at (the middle of its face), d [dx, dz] (the
// way it looks), w, h, tilt (how far it leans back, radians), px (how tall its lettering should be drawn, in pixels,
// for a slate the camera passes close to), frame (false for none, or a colour), head, ink, marks (with no words: so
// many scribbled lines). Every slate that is given words is counted in `lettered`.
let lettered = 0;
function slate(deck, g, text, o) {
  const l = Math.hypot(o.d[0], o.d[1]) || 1, dx = o.d[0] / l, dz = o.d[1] / l, tl = o.tilt || 0, ct = Math.cos(tl), st = Math.sin(tl);
  const n = [dx * ct, st, dz * ct], top = [-dx * st, ct, -dz * st], r = [dz, 0, -dx], C = o.at, w = o.w, h = o.h;
  const fw = o.frame === false ? 0 : Math.min(0.032, h * 0.085);
  g.push(new Matrix4().makeBasis(new Vector3(r[0], r[1], r[2]), new Vector3(top[0], top[1], top[2]), new Vector3(n[0], n[1], n[2])).setPosition(C[0], C[1], C[2]));
  g.tint(0).box(-w / 2, -h / 2, -0.02, w / 2, h / 2, -0.006, STONE);
  if (fw) {
    const f = o.frame || FRAME;
    g.box(-w / 2 - fw, h / 2, -0.026, w / 2 + fw, h / 2 + fw, 0.004, f).box(-w / 2 - fw, -h / 2 - fw, -0.026, w / 2 + fw, -h / 2, 0.004, f);
    g.box(-w / 2 - fw, -h / 2, -0.026, -w / 2, h / 2, 0.004, f).box(w / 2, -h / 2, -0.026, w / 2 + fw, h / 2, 0.004, f);
  }
  if (!text) for (let i = 0; i < (o.marks || 0); i++) g.box(-w * 0.36, h * (0.2 - i * 0.2), -0.008, w * (0.06 + 0.13 * ((i * 2) % 3)), h * (0.2 - i * 0.2) + 0.014, -0.004, CHALK, { skip: 'n' });
  g.pop();
  if (!text) return;
  const so = { n: [dx, dz], w, h, style: 'chalk', head: !!o.head, ink: o.ink || CHALK, ground: STONE };
  const s = deck.sign(text, { ...so, at: C });
  s.n = n; s.top = top; s.r = r;
  // the kit letters a sign by its size in the world. A slate in the hand is small and is read from a metre off, so a
  // second copy of the same words, larger, lies face up under the floor: the atlas keeps one drawing for both, the larger
  const k = (o.px || 0) / (300 * h);
  if (k > 1.05) deck.sign(text, { ...so, at: [C[0], -1.2, C[2]], up: 0, w: w * k, h: h * k });
  lettered++;
}
// a slate on a short stake, standing in a bed
function stake(deck, g, text, x, z, d, o = {}) {
  const w = o.w || 0.5, h = o.h || 0.34, y = o.y || 0.78;
  g.tint(0).box(x - 0.025, 0, z - 0.025, x + 0.025, y + h * 0.4, z + 0.025, WOODC, { skip: 'b' });
  const l = Math.hypot(d[0], d[1]);
  slate(deck, g, text, { at: [x + d[0] / l * 0.045, y + h / 2, z + d[1] / l * 0.045], d, w, h, tilt: 0.14, px: o.px || 150, head: o.head });
}
// a board that stands on the floor on two legs, leaning back: what a shop puts out
function aboard(deck, g, text, x, z, d, o = {}) {
  const w = o.w || 0.62, h = o.h || 0.84, l = Math.hypot(d[0], d[1]), dx = d[0] / l, dz = d[1] / l, tl = 0.2;
  const cy = 0.12 + h / 2 * Math.cos(tl), back = h / 2 * Math.sin(tl);
  slate(deck, g, text, { at: [x - dx * back, cy, z - dz * back], d, w, h, tilt: tl, px: o.px || 0, head: o.head, ink: o.ink, frame: WOODC });
  const hb = 2 * back + 0.035, hy = 0.1 + h * Math.cos(tl);          // the hinge at the board's top, behind it
  for (const sd of [-1, 1]) {
    const ox = x + dz * sd * (w / 2 - 0.03), oz = z - dx * sd * (w / 2 - 0.03), top = [ox - dx * hb, hy, oz - dz * hb];
    g.tint(0).tube([[ox - dx * 0.03, 0, oz - dz * 0.03], top], 0.016, 4, WOODC, { smooth: false }).tube([[ox - dx * (hb + 0.38), 0, oz - dz * (hb + 0.38)], top], 0.016, 4, WOODC, { smooth: false });
  }
}

// ---------------------------------------------------------------- people of this page's own
// The kit's figures have no arms, and here everything is said with what the hands hold. All face +z.
// A head: its origin is the base of the neck. o: bald, long, bun, shut (eyes), tint (the hair takes an instance's colour)
function drawHead(g, skin, hair, o = {}) {
  g.tint(0).cyl(0, -0.04, 0, 0.046, 0.042, 0.12, 6, shade(skin, 0.9), { smooth: false, cap: false });
  const hc = o.tint ? '#ffffff' : hair;
  g.push(MIRROR);                      // the kit's blobs wind inward; mirrored they wind outward, so the face stands in front of the hair
  g.blob(0, 0.175, 0.012, [0.085, 0.112, 0.098], 1, skin, { shadeBottom: 0.84, seed: 3 });
  g.tint(o.tint ? 1 : 0);
  if (o.bald) g.blob(0, 0.182, -0.05, [0.088, 0.075, 0.075], 0, hc, { shadeBottom: 0.9, seed: 5 });
  else g.blob(0, 0.217, -0.026, [0.093, 0.088, 0.104], 1, hc, { shadeBottom: 0.82, seed: 7, lump: 0.1 });
  if (o.bun) g.blob(0, 0.285, -0.09, [0.048, 0.044, 0.048], 0, hc, { seed: 2 });
  g.pop();
  if (o.long) g.box(-0.083, 0.0, -0.118, 0.083, 0.18, -0.045, hc, { skip: 't' });
  g.tint(0);
  const ey = o.shut ? 0.004 : 0.011;
  for (const sx of [-1, 1]) g.box(sx * 0.034 - 0.01, 0.186 - ey / 2, 0.085, sx * 0.034 + 0.01, 0.186 + ey / 2, 0.1035, '#2b2420', { skip: 'n' });
  g.box(-0.01, 0.14, 0.095, 0.01, 0.172, 0.121, shade(skin, 0.93), { skip: 'n' });
  g.box(-0.017, 0.108, 0.086, 0.017, 0.113, 0.096, shade(skin, 0.7), { skip: 'n' });      // a mouth, shut
}
// A body. pose: 'stand' (arms down, a slate hung at the hip), 'hold' (a slate at the chest), 'high' (a slate held up over
// the head), 'bench' (sitting, hands in the lap), 'up' (sitting, both hands up), 'eat' (sitting at table with the right
// forearm left off: that part moves). Standing, the origin is at the feet; sitting, on the seat. cloth: a colour, or
// leave it out for an instance's own
function drawBody(g, skin, pose, o = {}) {
  const legs = o.legs || '#3b3e3a', cl = o.cloth || '#ffffff';
  const arm = (a, b, c) => { g.tint(1).tube([a, b], 0.05, 4, cl, { smooth: false }).tube([b, c], 0.044, 4, cl, { smooth: false }); g.tint(0).cube(c[0], c[1], c[2], 0.07, 0.06, 0.085, skin); };
  if (pose === 'bench' || pose === 'eat' || pose === 'up') {
    g.tint(0).box(-0.17, 0, -0.04, 0.17, 0.15, 0.44, legs, { skip: 'b' }).box(-0.15, -0.45, 0.32, 0.15, 0, 0.45, legs, { skip: 'tb' });
    g.tint(1).cyl(0, 0.06, 0, 0.2, 0.18, 0.47, 6, cl, { smooth: false, squash: [1, 0.72] }).box(-0.235, 0.46, -0.08, 0.235, 0.57, 0.09, cl);
    if (pose === 'bench') for (const sd of [-1, 1]) arm([sd * 0.2, 0.52, 0], [sd * 0.24, 0.3, 0.1], [sd * 0.08, 0.2, 0.3]);
    else if (pose === 'up') for (const sd of [-1, 1]) arm([sd * 0.2, 0.52, 0], [sd * 0.29, 0.72, 0.16], [sd * 0.24, 1.12, 0.26]);      // both hands up, holding a slate over the head
    else { arm([-0.2, 0.52, 0], [-0.25, 0.3, 0.16], [-0.16, 0.335, 0.44]); g.tint(1).tube([[0.2, 0.52, 0], [0.2, 0.3, 0.2]], 0.05, 4, cl, { smooth: false }); }
    g.tint(0);
    return;
  }
  g.tint(0).box(-0.15, 0.06, -0.09, -0.02, 0.86, 0.09, legs, { skip: 'b' }).box(0.02, 0.06, -0.09, 0.15, 0.86, 0.09, legs, { skip: 'b' });
  g.box(-0.16, 0, -0.1, -0.01, 0.07, 0.17, SHOE, { skip: 'b' }).box(0.01, 0, -0.1, 0.16, 0.07, 0.17, SHOE, { skip: 'b' });      // felt soles
  g.tint(1).cyl(0, 0.8, 0, 0.21, 0.18, 0.6, 6, cl, { smooth: false, squash: [1, 0.72] }).box(-0.24, 1.32, -0.08, 0.24, 1.43, 0.09, cl);
  if (pose === 'hold') for (const sd of [-1, 1]) arm([sd * 0.21, 1.38, 0], [sd * 0.28, 1.14, 0.12], [sd * 0.19, 1.24, 0.36]);
  else if (pose === 'high') for (const sd of [-1, 1]) arm([sd * 0.21, 1.39, 0], [sd * 0.3, 1.5, 0.14], [sd * 0.27, 1.76, 0.2]);
  else {
    for (const sd of [-1, 1]) arm([sd * 0.21, 1.38, 0], [sd * 0.25, 1.1, 0.02], [sd * 0.24, 0.84, 0.06]);
    // the slate everyone carries: at the right hip, on a strap from the other shoulder
    g.tint(0).tube([[-0.17, 1.44, 0.03], [0.03, 1.2, 0.135], [0.25, 0.98, 0.04]], 0.012, 3, '#2f2a25', { smooth: false });
    g.box(0.262, 0.77, -0.13, 0.282, 1.09, 0.13, FRAME).box(0.27, 0.79, -0.11, 0.292, 1.07, 0.11, STONE);
    g.box(0.292, 0.99, -0.07, 0.2935, 1.0, 0.06, CHALK, { skip: 'w' }).box(0.292, 0.94, -0.07, 0.2935, 0.95, 0.02, CHALK, { skip: 'w' }).box(0.292, 0.89, -0.05, 0.2935, 0.9, 0.07, CHALK, { skip: 'w' });
  }
  g.tint(0);
}
// the right forearm of someone eating, a spoon in its hand: its origin is the elbow, and it swings up to the mouth
function drawSpoonArm(g, skin) {
  g.tint(1).tube([[0, 0, 0], [-0.13, 0.045, 0.24]], 0.044, 4, '#ffffff', { smooth: false });
  g.tint(0).cube(-0.13, 0.05, 0.25, 0.07, 0.06, 0.085, skin);
  g.box(-0.2, 0.07, 0.24, -0.13, 0.082, 0.35, '#b9b8ae').cyl(-0.2, 0.062, 0.36, 0.03, 0.02, 0.014, 6, '#c9c8be', { smooth: false });
}
const geoCache = new Map();
// a whole person as one model: the clothes take an instance's colour, and the hair is the model's own (an instance has one colour to give)
function personGeo(k, pose, o = {}) {
  const key = k + pose + (o.child ? 'c' : '');
  if (geoCache.has(key)) return geoCache.get(key);
  const g = new Geo(), skin = SKINS[k % SKINS.length], hair = HAIR[(k * 3 + (o.child ? 1 : 0)) % HAIR.length], sit = pose === 'bench';
  drawBody(g, skin, pose, { legs: k % 2 ? '#3b3e3a' : '#474238' });
  g.at(0, sit ? 0.575 : 1.405, sit ? 0.02 : 0.01, 0, o.child ? 1.18 : 1); drawHead(g, skin, hair, { long: k % 3 === 1, bun: k % 5 === 2, bald: k % 7 === 6 }); g.pop();
  const geo = g.build();
  geoCache.set(key, geo);
  return geo;
}
// one person drawn straight into a mesh of the deck's, where they stand: for the few the flight comes close to
function person(g, p, yaw, pose, o = {}) {
  const s = o.scale || 1, sit = pose === 'bench', skin = o.skin || SKINS[1];
  g.at(p[0], p[1], p[2], yaw, s);
  drawBody(g, skin, pose, { cloth: o.cloth || CLOTHES[0], legs: o.legs });
  g.at(0, sit ? 0.575 : 1.405, sit ? 0.02 : 0.01, o.turn || 0, o.head || 1);
  if (o.nod) g.rot('x', o.nod);
  drawHead(g, skin, o.hair || HAIR[0], o);
  if (o.nod) g.pop();
  g.pop(); g.pop();
}

// ---------------------------------------------------------------- the wood: its paths
// a smooth line through points [[x, z], ...], as points about a metre apart
function spline(ctrl, step = 1) {
  const out = [], n = ctrl.length, P = (i) => ctrl[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const a = P(i - 1), b = P(i), c = P(i + 1), d = P(i + 2), m = Math.max(1, Math.round(Math.hypot(c[0] - b[0], c[1] - b[1]) / step));
    for (let k = 0; k < m; k++) {
      const t = k / m, t2 = t * t, t3 = t2 * t, f = (j) => 0.5 * (2 * b[j] + (c[j] - a[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (3 * b[j] - a[j] - 3 * c[j] + d[j]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  out.push([ctrl[n - 1][0], ctrl[n - 1][1]]);
  return out;
}
// The bark paths, as a net of stretches between meeting points. The stretch the flight follows is cut from the flight
// itself, so the camera keeps to the bark. Returns { E: stretches by name, loops: rounds people walk, all: every point }
function woodPaths(path) {
  const at = (t) => { const p = path.flat(t); return [p.x, p.z]; };
  const when = (test) => { for (let t = 8; t < path.duration; t += 0.05) { const p = path.flat(t); if (test(p)) return t; } return path.duration; };
  const T = { M: when((p) => p.z > WZ0 + 0.1), J0: when((p) => p.z > 12.4), J: when((p) => p.z > 21), K1: when((p) => p.x > 29), K2: when((p) => p.x > 46), K3: when((p) => p.x > 78), H: when((p) => p.x > 96.5), X: when((p) => p.x > HX0) };
  const N = { W0: [-98, 31], A: [-58, 29], B: [-38, 32.5], F0: [-98, 50], F1: [-48, 52], F2: [22, 49], F3: [66, 49.5], Hn: [96.5, 46.5], Hs: [96.5, 17.5], N0: [-98, 13], N1: [-40, 12.5], N3: [60, 13.5] };
  for (const k in T) N[k] = at(T[k]);
  const E = {};
  const edge = (name, a, b, via, w) => { E[name] = { pts: spline([N[a], ...(via || []), N[b]]), w: w || 2.0 }; };
  const piece = (name, a, b) => { const pts = []; for (let t = T[a]; t < T[b] - 0.01; t += 0.2) pts.push(at(t)); pts.push(at(T[b])); E[name] = { pts, w: 2.9 }; };
  piece('fM', 'M', 'J0'); piece('f0', 'J0', 'J'); piece('f1', 'J', 'K1'); piece('f2', 'K1', 'K2'); piece('f3', 'K2', 'K3'); piece('f4', 'K3', 'H'); piece('f5', 'H', 'X');
  edge('e1', 'W0', 'A', [[-78, 33.5]], 2.4); edge('e2', 'A', 'B', [[-48, 30]], 2.4); edge('e3', 'B', 'J', [[-18, 29.8], [-4, 27.2]], 2.4);
  edge('e4', 'F0', 'F1', [[-72, 48]]); edge('e5', 'F1', 'F2', [[-24, 49], [0, 52]]); edge('e6', 'F2', 'F3', [[44, 52.5]]); edge('e7', 'F3', 'Hn', [[84, 52]]);
  edge('e8', 'N0', 'N1', [[-66, 15]]); edge('e9', 'N1', 'J0', [[-18, 15], [-6, 13.4]]); edge('e10', 'J0', 'N3', [[18, 14.5], [40, 16]]); edge('e11', 'N3', 'Hs', [[80, 16]]);
  edge('e12', 'F0', 'W0', [[-95.5, 40]]); edge('e13', 'W0', 'N0', [[-95.5, 22]]);
  edge('c1', 'A', 'F1', [[-52, 40]]); edge('c2', 'B', 'N1', [[-40.5, 22]]); edge('c3', 'K1', 'F2', [[27, 41]]); edge('c4', 'K2', 'N3', [[52, 22]]); edge('c5', 'K3', 'F3', [[72, 41]]);
  edge('an', 'H', 'Hn', null, 4.6); edge('as', 'H', 'Hs', null, 4.6);       // the apron of bark before the hall's open side
  const rounds = [
    [['c3', 0], ['e6', 0], ['c5', 1], ['f3', 1], ['f2', 1]], [['f1', 0], ['c3', 0], ['e5', 1], ['c1', 1], ['e2', 0], ['e3', 0]],
    [['e10', 0], ['c4', 1], ['f2', 1], ['f1', 1], ['f0', 1]], [['c2', 0], ['e9', 0], ['f0', 0], ['e3', 1]],
    [['e1', 0], ['c1', 0], ['e4', 1], ['e12', 0]], [['e13', 0], ['e8', 0], ['c2', 1], ['e2', 1], ['e1', 1]],
    [['f4', 0], ['an', 0], ['e7', 1], ['c5', 1]], [['c4', 0], ['e11', 0], ['as', 1], ['f4', 1], ['f3', 1]],
  ];
  const loops = rounds.map((r) => {
    const pts = [];
    for (const [name, rev] of r) { const p = rev ? E[name].pts.slice().reverse() : E[name].pts; for (let i = 0; i < p.length - 1; i++) pts.push(p[i]); }
    const cum = [0];
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    return { pts, cum, len: cum[pts.length] };
  });
  const all = [];
  for (const k in E) for (const q of E[k].pts) all.push([q[0], q[1], E[k].w / 2]);
  return { E, N, T, loops, all };
}
// where someone is who has gone d metres round a loop: [x, z, heading]
function onLoop(lp, d, out) {
  d = ((d % lp.len) + lp.len) % lp.len;
  let lo = 0, hi = lp.pts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lp.cum[mid] <= d) lo = mid; else hi = mid - 1; }
  const a = lp.pts[lo], b = lp.pts[(lo + 1) % lp.pts.length], sl = lp.cum[lo + 1] - lp.cum[lo], t = sl > 1e-6 ? (d - lp.cum[lo]) / sl : 0;
  out[0] = a[0] + (b[0] - a[0]) * t; out[1] = a[1] + (b[1] - a[1]) * t; out[2] = Math.atan2(b[0] - a[0], b[1] - a[1]);
  return out;
}

// ---------------------------------------------------------------- the wood: its trees
// Birches for an indoor wood under a sixteen-metre ceiling: a pale stem going up twelve or thirteen metres with dark
// marks on it and a small light crown at the top. v: 0 one stem, 1 two from one foot, 2 a young one
function birchGeo(v) {
  const g = new Geo(), rng = makeRng('hush-birch' + v), pale = '#d6d4c8', mark = '#3d3a34';
  const stems = v === 1 ? [[-0.2, 0.045, 0.03, 0.17, 12.8], [0.18, -0.035, -0.025, 0.15, 11.8]] : v === 2 ? [[0, 0.012, 0.01, 0.13, 10.2]] : [[0, 0.01, -0.008, 0.2, 13.5]];
  for (const [bx, lx, lz, r0, H] of stems) {
    const cen = (y) => [bx + lx * y + 0.1 * Math.sin(y * 0.45 + bx * 9 + v), y, lz * y + 0.08 * Math.sin(y * 0.33 + 1.3 + v)];
    const pts = [];
    for (let i = 0; i <= 7; i++) pts.push(cen(H * i / 7));
    g.tint(0).tube(pts, (t) => r0 * (1 - 0.7 * t), 6, pale, { smooth: false });
    for (let k = 0; k < 9; k++) { const y = rng.f(0.3, H * 0.82), c = cen(y), r = r0 * (1 - 0.7 * y / H) * 1.05; g.cyl(c[0], y, c[2], r, r * 0.98, rng.f(0.03, 0.11), 6, k % 3 ? mark : '#5a564e', { smooth: false, cap: false, phase: -Math.PI / 2 }); }
    // the crown: clumps of leaf out on thin boughs down the top four metres of the stem, lighter and darker
    for (let k = 0, nb = v === 2 ? 5 : 7; k < nb; k++) {
      const y = H - 0.4 - k * (3.8 / nb) + rng.f(-0.25, 0.25), a = k * 2.4 + rng.f(-0.4, 0.4), rr = rng.f(0.95, 1.4) * (0.75 + 0.6 * k / nb), d = 0.5 + 0.34 * k, c = cen(y);
      const px = c[0] + Math.cos(a) * d, pz = c[2] + Math.sin(a) * d;
      g.tint(1).blob(px, y + 0.2, pz, [rr * 1.15, rr * 0.68, rr * 1.15], 0, ['#ffffff', '#e0e0e0', '#c9c9c9'][k % 3], { lump: 0.32, seed: k * 3 + v * 7 + 2, shadeBottom: 0.55 });
      g.tint(0).tube([[c[0], y - 0.5, c[2]], [px, y + 0.1, pz]], 0.028, 3, '#b9b7aa', { smooth: false });
    }
  }
  return g.build();
}
// Old yews, as in the Hollow: a short thick trunk of several stems grown together, a broad dark crown you can walk under
function yewGeo() {
  const g = new Geo(), bark = '#4c3b30';
  g.tint(0).cyl(0, 0, 0, 0.62, 0.4, 3.4, 7, bark, { smooth: false, cap: false });
  g.cyl(0.3, 0, 0.12, 0.4, 0.2, 2.7, 5, shade(bark, 0.88), { smooth: false, cap: false }).cyl(-0.22, 0, -0.26, 0.36, 0.2, 2.3, 5, shade(bark, 1.12), { smooth: false, cap: false });
  g.tube([[0, 2.7, 0], [1.7, 4.1, 0.5]], 0.15, 5, bark, { smooth: false }).tube([[0, 2.5, 0], [-1.5, 3.7, -1.0]], 0.14, 5, shade(bark, 0.9), { smooth: false }).tube([[0, 2.8, 0], [0.4, 3.9, 1.7]], 0.12, 5, bark, { smooth: false });
  g.tint(1);
  g.blob(0, 5.5, 0, [3.7, 2.4, 3.7], 1, '#ffffff', { lump: 0.28, seed: 11, shadeBottom: 0.5 });
  g.blob(1.3, 7.5, 0.5, [2.4, 2.0, 2.4], 0, '#ffffff', { lump: 0.3, seed: 13, shadeBottom: 0.6 });
  g.blob(-1.8, 4.5, -1.2, [2.3, 1.6, 2.3], 0, '#ffffff', { lump: 0.3, seed: 17, shadeBottom: 0.45 });
  g.blob(0.9, 4.2, 2.0, [2.0, 1.4, 2.0], 0, '#ffffff', { lump: 0.3, seed: 19, shadeBottom: 0.45 });
  g.tint(0);
  return g.build();
}
// Stand the trees: in the beds between the paths, clear of the flight, birches and yews in drifts.
function* plantWood(deck, net, path, rng, dens, extra) {
  const fl = path.points(0.25).filter((q) => q.z > WZ0 - 1 && q.x < WX1 + 2), lists = { b0: [], b1: [], b2: [], kb: [], yew: [], ky: [] }, all = [];
  const offPath = (x, z, r) => { for (const q of net.all) { const dx = q[0] - x, dz = q[1] - z, rr = q[2] + r; if (dx * dx + dz * dz < rr * rr) return false; } return true; };
  const offFlight = (x, z, yew) => { for (const q of fl) { const dx = q.x - x, dz = q.z - z, r = yew && q.y > 2.3 ? 5.8 : 2.3; if (dx * dx + dz * dz < r * r) return false; } return true; };
  // room for a bench, for people standing, for slates on stakes
  const keep = [[85.2, 29.0, 3.4], [25.6, 33.2, 3.0], [36.2, 29.4, 2.6], [97.6, 34.4, 3.2], [71.6, 35.6, 2.6], [74.6, 36.2, 2.2], [3.4, 9.6, 1.5], [12.2, 22.4, 1.6], [21.0, 27.3, 1.4], [39.9, 33.6, 1.6], [56.0, 26.1, 2.8]];
  const place = (x, z, kind, s) => {
    const yew = kind === 'yew' || kind === 'ky';
    const col = yew ? shade(mixc('#33423a', '#47573f', rng()), rng.f(0.88, 1.1)) : shade(mixc('#77836a', '#929e82', rng()), rng.f(0.9, 1.08));
    const sc = kind === 'kb' ? [1.25 * s, 1.38 * s, 1.25 * s] : kind === 'ky' ? [0.8 * s, 0.86 * s, 0.8 * s] : yew ? [s, s * rng.f(0.95, 1.12), s] : [s, s * rng.f(0.95, 1.05), s];     // nothing taller than the ceiling
    lists[kind].push({ p: [x, 0, z], yaw: rng() * TAU, scale: sc, color: col });
    all.push([x, z, yew ? (kind === 'ky' ? 2.6 : 4.0 * s) : 0.9, yew]);
  };
  const heroes = [[-2.9, 8.6, 'b0'], [3.7, 9.3, 'b1'], [-3.6, 14.4, 'b1'], [6.4, 13.4, 'b2'], [-2.4, 20.4, 'b0'], [10.8, 16.4, 'b0'], [0.8, 25.4, 'b1'], [14.6, 21.8, 'b0'],
    [-8.5, 11.5, 'yew'], [13.5, 10.0, 'yew'], [20.5, 25.0, 'b2'], [19.0, 34.5, 'b0'], [30.5, 28.4, 'b1'], [31.5, 35.6, 'b0'], ...(extra || [])];
  for (const [x, z, kind] of heroes) {
    if (offPath(x, z, 1.1) && offFlight(x, z, kind === 'yew')) place(x, z, kind, 1);
    else if (/debug/.test(location.search)) console.log('[hush] a tree set by hand stands in the way', x, z);
  }
  const S = 5.3;
  for (let gz = 0; WZ0 + 2.4 + gz * S < WZ1 - 2.6; gz++) {
    for (let gx = 0; WX0 + 2 + gx * S < WX1 - 2.2; gx++) {
      const x = WX0 + 2 + (gx + rng.f(0.14, 0.86)) * S, z = WZ0 + 2.4 + (gz + rng.f(0.14, 0.86)) * S, r5 = rng(), r6 = rng(), r7 = rng();
      if (r5 > 0.62 + 0.38 * dens) continue;
      const yew = fbm2(x / 30, z / 30, 3, 7) > 0.54, wall = Math.min(z - WZ0, WZ1 - z, x - WX0, WX1 - x);
      const kind = yew ? (wall < 6 ? 'ky' : 'yew') : (r6 < 0.36 ? 'b0' : r6 < 0.6 ? 'b1' : r6 < 0.8 ? 'b2' : 'kb');
      if (yew && wall >= 6 && r7 < 0.75 && fl.some((q) => Math.hypot(q.x - x, q.z - z) < 11)) continue;       // along the flight's path the birches have it: yews are for the depths
      if (wall < (yew ? 4.4 : 2.8) && kind !== 'ky') continue;
      if (x > 93 && z > HZ0 - 2 && z < HZ1 + 2) continue;                    // the apron before the hall
      if (!offPath(x, z, yew ? 1.5 : 1.25) || !offFlight(x, z, yew)) continue;
      if (keep.some((k) => Math.hypot(k[0] - x, k[1] - z) < k[2] + (yew ? 1.2 : 0))) continue;
      if (all.some((q) => Math.hypot(q[0] - x, q[1] - z) < (yew || q[3] ? 3.3 : 1.7))) continue;
      place(x, z, kind, yew ? 0.92 + 0.3 * r7 : 0.88 + 0.16 * r7);
    }
    if (deck.clk.due()) { yield 'hush: planting'; deck.clk.go(); }
  }
  return { lists, all };
}

// ---------------------------------------------------------------- the wood: its ground
// One picture of the whole floor, 10 pixels to the metre: red where there is bark, green where moss has taken on the
// grit, blue where a crown keeps the light off. The ground's shader makes grit, chips of bark and edges out of it.
const PW = 2048, PH = 576;
function* paintPlan(net, trees, rng) {
  const cv = document.createElement('canvas');
  cv.width = PW; cv.height = PH;
  const cx = cv.getContext('2d'), S = PW / (WX1 - WX0), X = (x) => (x - WX0) * S, Z = (z) => (z - WZ0) * PH / (WZ1 - WZ0);
  cx.fillStyle = '#000000'; cx.fillRect(0, 0, PW, PH);
  cx.globalCompositeOperation = 'lighter'; cx.lineCap = 'round'; cx.lineJoin = 'round';
  for (const k in net.E) {
    const e = net.E[k];
    for (const [grow, a] of [[0.7, 0.3], [0.35, 0.3], [0, 0.4]]) {
      cx.strokeStyle = 'rgba(255,0,0,' + a + ')'; cx.lineWidth = (e.w + grow) * S;
      cx.beginPath();
      e.pts.forEach((q, i) => (i ? cx.lineTo(X(q[0]), Z(q[1])) : cx.moveTo(X(q[0]), Z(q[1]))));
      cx.stroke();
    }
  }
  yield 'hush: paths painted';
  const blob = (x, z, r, ch, a) => {
    const gx = X(x), gz = Z(z), gr = r * S, gd = cx.createRadialGradient(gx, gz, 0, gx, gz, gr);
    gd.addColorStop(0, 'rgba(' + ch + ',' + a + ')'); gd.addColorStop(0.55, 'rgba(' + ch + ',' + (a * 0.6).toFixed(3) + ')'); gd.addColorStop(1, 'rgba(' + ch + ',0)');
    cx.fillStyle = gd; cx.fillRect(gx - gr, gz - gr, 2 * gr, 2 * gr);
  };
  let n = 0;
  for (const t of trees) {
    blob(t[0], t[1], t[3] ? t[2] * 1.15 : 1.3, '0,0,255', t[3] ? 0.8 : 0.5);
    if (t[3]) blob(t[0] + rng.f(-1, 1), t[1] + rng.f(-1, 1), t[2] * 1.3, '0,255,0', 0.7);
    if ((++n & 63) === 0) yield 'hush: shade painted';
  }
  for (let i = 0; i < 150; i++) { blob(rng.f(WX0, WX1), rng.f(WZ0, WZ1), rng.f(1.5, 5), '0,255,0', rng.f(0.3, 0.75)); if ((i & 63) === 63) yield 'hush: moss painted'; }
  const tex = new CanvasTexture(cv);
  tex.flipY = false; tex.wrapS = tex.wrapT = ClampToEdgeWrapping; tex.minFilter = LinearMipmapLinearFilter; tex.magFilter = LinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
  return tex;
}
const GROUND_VERT = /* glsl */`
${BEND_PARS}
varying vec3 vW; varying vec3 vF;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  vF = p;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const groundFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tPlan; uniform vec4 uRect; uniform vec3 uGrit, uBark, uMoss;
varying vec3 vW; varying vec3 vF;
${rig.glsl}
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  vec2 m = vF.xz;
  vec4 pl = texture2D(tPlan, (m - uRect.xy) * uRect.zw);
  float px = max(length(dFdx(m)), length(dFdy(m)));
  float fine = smoothstep(0.09, 0.012, px), mid = smoothstep(0.5, 0.08, px);
  float n1 = kNoise(m * 1.9), n2 = kNoise(m * 7.3 + 11.0);
  float e = pl.r + ((n1 - 0.5) * 0.3 + (n2 - 0.5) * 0.14) * mid;
  float bark = smoothstep(0.46, 0.54 + px, e);
  // grit: pale, a speckle of single stones, drifts of lighter and darker
  float sp = kHash(floor(m * 55.0)), sp2 = kHash(floor(m * 21.0) + 7.7);
  vec3 grit = uGrit * (0.86 + 0.26 * kFbm(m * 0.31)) * (1.0 + fine * (sp - 0.5) * 0.34 + mid * (sp2 - 0.5) * 0.12);
  // and it is kept raked: rings round every trunk, long furrows between
  float furrow = sin((m.y + 0.5 * kNoise(m * 0.17)) * 36.0), ring = sin(pl.b * 52.0);
  grit *= 1.0 - 0.17 * smoothstep(0.07, 0.016, px) * (0.5 + 0.5 * mix(furrow, ring, smoothstep(0.03, 0.14, pl.b)));
  // bark: chips lying every way
  vec2 q = vec2(0.8 * m.x + 0.6 * m.y, 0.8 * m.y - 0.6 * m.x);
  float ch = kHash(floor(vec2(q.x * 26.0, q.y * 9.0) + kNoise(m * 4.0) * 3.0)), ch2 = kHash(floor(vec2(m.x * 8.0, m.y * 23.0)) + 3.0);
  vec3 brk = uBark * (0.8 + 0.34 * kFbm(m * 0.9 + 5.0)) * (1.0 + fine * (ch - 0.5) * 0.55 + mid * (ch2 - 0.5) * 0.25);
  float moss = smoothstep(0.3, 0.75, pl.g + (kFbm(m * 0.8 + 9.0) - 0.5) * 0.7 * mid) * (1.0 - bark);
  vec3 c = mix(grit, uMoss * (0.75 + 0.5 * n2), moss * 0.9);
  c = mix(c, brk, bark);
  // where bark meets grit there is a board on edge: a dark line
  c *= 1.0 - 0.42 * (1.0 - smoothstep(0.0, 0.07, abs(e - 0.5))) * mid;
  c *= 1.0 - 0.52 * pl.b;
  gl_FragColor = vec4(kAir(c * kLight(vW, kUp(vW), vF, vec3(0.0, 1.0, 0.0)), vW), 1.0);
}`;

// ---------------------------------------------------------------- the wood: its walls, galleries and ceiling
const wallN = (g, u0, u1, y0, y1, v, col, e = 0) => g.quad([u1, y0, v], [u0, y0, v], [u0, y1, v], [u1, y1, v], col, e);
// Three decks of flats look into the wood from galleries faced in felt. A flat on a court has windows (deck.js), and
// here they are kept pale: the warm light is the hall's.
function* woodShell(deck, rng) {
  const pal = deck.pal, BW = 5.5, k0 = deck.glowK;
  const sides = [
    { run: new Run(0, 0, WZ1, 0), a: WX0, b: WX1, ground: true },             // the far long wall
    { run: new Run(0, 0, WZ0, 2), a: -WX1, b: -WX0, ground: false },          // over the Arcade
    { run: new Run(WX0, 0, 0, 3), a: WZ0, b: WZ1, ground: true },             // the anti end
    { run: new Run(WX1, 0, 0, 1), a: -WZ1, b: -WZ0, ground: true, hall: true },   // the spinward end, over the hall
  ];
  for (const sd of sides) {
    const run = sd.run, n = Math.round((sd.b - sd.a) / BW), bw = (sd.b - sd.a) / n;
    for (let i = 0; i < n; i++) {
      const u0 = sd.a + i * bw, u1 = u0 + bw, um = (u0 + u1) / 2, P = deck.pen(run, um, 'wood'), g = P.g, pm = run.pt(um, 6, 0);
      const near = deck.dist(pm[0], 4, pm[2]) < 62, wall = shade(rng.pick(pal.walls), rng.f(0.8, 0.95));
      if (!sd.ground) wallN(g, u0, u1, AH, 4, 0, wall);              // over the Arcade's beam, up to the first gallery
      for (let k = sd.ground ? 0 : 1; k < 4; k++) {
        const y = k * 4, inHall = sd.hall && k === 0 && -um > OPEN0 && -um < OPEN1;
        if (inHall) { wallN(g, u0, u1, HH, 4, 0, wall); continue; }
        wallN(g, u0, u1, y, y + 4, 0, wall);
        const ds = rng() < 0.5, d0 = ds ? u0 + 0.7 : u1 - 1.65, w0 = ds ? u0 + 2.4 : u0 + 0.8, lit = rng() < 0.3, dc = shade(rng.pick(pal.doors), 0.85);
        wallN(g, d0, d0 + 0.95, y, y + 2.08, -0.014, dc);
        wallN(g, w0, w0 + 2.2, y + 0.95, y + 2.12, -0.014, lit ? rng.pick(pal.window) : '#2a3530', lit ? rng.f(0.22, 0.5) * k0 : 0.05);
        if (near) { g.box(w0 - 0.06, y + 0.89, -0.05, w0 + 2.26, y + 0.95, 0, pal.trim[0], { skip: 's' }).box(w0 + 1.08, y + 0.95, -0.03, w0 + 1.12, y + 2.12, -0.014, pal.trim[1], { skip: 's' }); wallN(g, w0, w0 + 0.3, y + 0.95, y + 2.12, -0.02, rng.pick(FELT), lit ? 0.2 : 0); }
        if (k === 0) continue;
        // the gallery: a slab, a rail hung with felt (no two lengths the same age), posts
        g.box(u0, y - 0.3, -1.5, u1, y, 0, shade(pal.ceiling, 1.25), { skip: 's', top: shade(pal.floor, 0.8) });
        const felt = shade(rng.pick(FELT), rng.f(0.85, 1.2));
        g.box(u0 + 0.05, y + 0.06, -1.5, u1 - 0.05, y + 0.98, -1.46, felt, { skip: 'b' }).box(u0, y + 0.98, -1.54, u1, y + 1.04, -1.42, pal.trim[2]);
        if (near) { g.box(u0 - 0.05, y, -1.52, u0 + 0.05, y + 1.04, -1.44, pal.trim[2], { skip: 'tb' }); if (rng() < 0.25) wallN(g, um - 0.5, um + 0.4, y + 0.3, y + 0.8, -1.512, shade(felt, rng.f(0.7, 1.35))); }
        if (near && rng() < 0.16) { const q = run.pt(rng.f(u0 + 0.5, u1 - 0.5), y, -1.05); deck.people([{ p: q, yaw: run.yaw + Math.PI + rng.f(-0.3, 0.3), color: rng.pick(CLOTHES) }]); }
      }
      P.done();
      if (deck.clk.due()) { yield 'hush: galleries'; deck.clk.go(); }
    }
  }
  // the ceiling: dark, with a field of panels that give a tenth of a court's light
  for (let x = WX0; x < WX1; x += 8) {
    const g = deck.bucket(x + 4, 30, 'wood').g;
    g.floor(x, WZ0, x + 8, WZ1, WTOP, '#232a26', { down: true });
    g.box(x - 0.2, WTOP - 0.55, WZ0, x + 0.2, WTOP, WZ1, '#1c2220', { skip: 't' });
    for (let j = 0; j < 8; j++) { const z0 = WZ0 + 0.9 + j * 6.9; g.floor(x + 0.9, z0, x + 7.1, z0 + 5.2, WTOP - 0.04, mixc('#727e72', '#5f6b61', rng()), { down: true, emit: (rng() < 0.08 ? 0.015 : rng.f(0.04, 0.06)) }); }
    if (deck.clk.due()) { yield 'hush: ceiling'; deck.clk.go(); }
  }
  yield 'hush: the wood built';
}

// ---------------------------------------------------------------- the Quiet Arcade
// One bay of the Arcade's back side: two piers and a beam, and between them a hanging of felt, which keeps the Arcade's
// lamps out of the wood and its footsteps in. Drawn in the row's own co-ordinates (u along, v into the wood).
function feltBay(deck, P, b, open) {
  const g = P.g, c = P.c, u0 = b.u0, u1 = b.u1, rng = b.rng, top = 2.5, pal = deck.pal, pier = shade(pal.walls[2], 0.8), base = rng.pick(FELT);
  g.tint(0).box(u0, 0, -0.07, u0 + 0.22, AH, 0.33, pier, { skip: 'tb' }).box(u1 - 0.22, 0, -0.07, u1, AH, 0.33, pier, { skip: 'tb' });
  g.box(u0 + 0.22, top, -0.05, u1 - 0.22, AH, 0.33, shade(pier, 0.9), { skip: 't' }).box(u0 + 0.22, top - 0.05, 0.09, u1 - 0.22, top, 0.2, pal.trim[0]);
  c.tint(1);
  const fold = (a, w, i, deep, col) => { const va = 0.1 + deep * (i % 2), vb = 0.1 + deep * ((i + 1) % 2); c.quad([a, 0.03, va], [a + w, 0.03, vb], [a + w, top - 0.03, vb], [a, top - 0.03, va], col); };
  if (open) {
    // drawn aside, and tied back at each pier
    for (const ua of [u0 + 0.24, u1 - 0.74]) { for (let i = 0; i < 5; i++) fold(ua + i * 0.1, 0.1, i, 0.15, shade(base, 0.86 + 0.09 * (i % 3))); g.box(ua - 0.02, 1.22, 0.05, ua + 0.54, 1.27, 0.29, '#8a8468'); }
  } else {
    let u = u0 + 0.24, i = 0;
    while (u < u1 - 0.26) { const w = Math.min(u1 - 0.24 - u, rng.f(0.36, 0.6)); fold(u, w, i, 0.09, shade(base, (i % 2 ? 0.84 : 1.08) * rng.f(0.95, 1.05))); u += w; i++; }
    c.quad([u0 + 0.24, 0.03, 0.085], [u1 - 0.24, 0.03, 0.085], [u1 - 0.24, 0.16, 0.085], [u0 + 0.24, 0.16, 0.085], shade(base, 0.7));       // a hem, darker with years of floor
    if (b.fine && rng() < 0.55) { const pu = rng.f(u0 + 0.8, u1 - 1.4), py = rng.f(0.5, 1.6); c.quad([pu, py, 0.07], [pu + 0.5, py, 0.07], [pu + 0.5, py + 0.42, 0.07], [pu, py + 0.42, 0.07], shade(rng.pick(FELT), rng.f(0.72, 1.3))); }
  }
  c.tint(0);
}
const TRADES = [['Felt', 'cloth'], ['Books', 'books'], ['Bread', 'bread'], ['Paper', 'paper'], ['Jars', 'jars'], ['Pots and lids', 'pots'], ['Greens', 'greens'], ['Mending', 'cloth'], ['Tea', 'tea']];
const RED = '#f27a5c';                // one stick of red chalk in a grey-green drum

function* buildArcade(deck, rng, folk) {
  const pal = deck.pal, k = deck.glowK, SL = { style: 'chalk', font: 'hand' }, own = { font: 'hand', ground: STONE, ink: CHALK, awning: false };
  const shop = (from, to, name, goods, more) => ({ from, to, kind: 'shop', name, goods, sign: SL, ...own, blade: false, lit: 0.6, open: false, props: false, ...more });
  const back = [];
  for (let x = WX0; x < WX1 - 0.1; x += 6) back.push({ from: x, to: x + 6, kind: 'custom', piers: false, draw: (P, b) => feltBay(deck, P, b, x === MOUTH[0]) });
  const arcade = yield* street(deck, {
    axis: 'x', from: WX0, to: WX1, at: 0, y: 0, width: AW, height: AH, lamps: false, pipes: false, ribs: { every: 6 }, floor: { shine: 0.45 },
    folk: { stand: 0, stroll: 0, walk: 0, kids: 0 }, ends: ['wall', 'wall'],
    fronts: {
      back,
      front: [
        { from: -46, to: -40, kind: 'home' }, { from: -40, to: -34, kind: 'home' },
        { from: -34, to: -28, kind: 'stall', name: 'Tea', goods: 'tea', ...own, lit: 0.45 },
        shop(-28, -22, 'Slates and chalk', 'none', { id: 'slates', doorSide: 0, door: '#3f5247' }),
        shop(-22, -16, 'Lamps mended', 'lamps', { doorSide: 1 }),
        shop(-16, -10, 'Haircuts', 'bottles', { doorSide: 0 }),
        shop(-10, -4, 'Soft soles', 'shoes', { doorSide: 1 }),
        { from: -4, to: 2, kind: 'stall', name: 'Gin', goods: 'bottles', ...own, lit: 0.5 },
        shop(2, 8, 'Books', 'books', {}), { from: 8, to: 12, kind: 'stair' }, shop(12, 18, 'Felt', 'cloth', {}), { from: 18, to: 22, kind: 'home' },
      ],
    },
    fill: { back: false, front: { mix: { shop: 2, home: 2, wall: 0.4 }, bay: [5.9, 6.1], trades: TRADES, lit: 0.7, awnings: 0, blades: 0, numbers: 31 } },
  });
  deck.spots.length = 0;                 // the kit stands its own people at stalls: here everyone is this page's, with a slate
  yield 'hush: arcade';

  // lamps under felt shades, and their light
  deck.proto('feltLamp', (g) => {
    g.cyl(0, -0.3, 0, 0.012, 0.012, 0.3, 4, '#3a3b3c', { cap: false });
    g.tint(1).cyl(0, -0.56, 0, 0.3, 0.26, 0.26, 10, '#ffffff', { smooth: false });
    g.tint(0).cyl(0, -0.565, 0, 0.21, 0.21, 0.012, 10, '#f1f5e6', { emit: 1.7, smooth: false, base: true, cap: false });
  });
  for (let x = WX0 + 3; x < WX1; x += 6) { deck.put('feltLamp', { p: [x, AH, 0], yaw: 0, color: shade(rng.pick(FELT), 1.25) }); deck.glow([{ p: [x, 2.4, 0], color: PALE, power: 0.95 * k, size: 0.7 }]); }
  deck.lattice({ origin: [WX0 + 3, 2.42, 0], spacing: [6, 40], count: [33, 1], color: PALE, power: 1.35, reach: 4.4, drop: 3.92 });
  // felt hung across under the ceiling between the ribs, a runner down the middle of the floor, the pipes lagged
  for (let x = WX0 + 2; x < WX1; x += 2) {
    if (deck.clk.due()) { yield 'hush: felt'; deck.clk.go(); }
    if (Math.round(x - WX0) % 6 === 0 || x === -30 || x === -12 || x === -36 || x === -38 || deck.dist(x, 2.8, 0) > 100) continue;
    const c = deck.bucket(x, 0, 'av').c;
    c.tint(1);
    for (let z = -3.7, i = 0; z < 3.6; i++) {
      // each length is cut to a point at the bottom, and no two hang to the same height
      const w = Math.min(3.7 - z, rng.f(1.0, 1.8)), y0 = rng.f(2.52, 2.7), col = shade(rng.pick(FELT), (i % 2 ? 0.78 : 1.12) * rng.f(0.9, 1.1));
      c.quad([x, y0, z], [x, y0, z + w], [x, 2.99, z + w], [x, 2.99, z], col).tri([x, y0, z], [x, y0 - 0.16, z + w / 2], [x, y0, z + w], col);
      z += w;
    }
    c.tint(0);
  }
  for (let x = WX0; x < WX1; x += 8) {
    const g = deck.bucket(x + 4, 0, 'av').g, x1 = Math.min(WX1, x + 8);
    g.tint(0).box(x, 0.003, -1.15, x1, 0.013, 1.15, '#434e45', { skip: 'b' }).box(x, 0.013, -1.15, x1, 0.016, -1.02, FELT[4], { skip: 'b' }).box(x, 0.013, 1.02, x1, 0.016, 1.15, FELT[4], { skip: 'b' });
    g.box(x, 2.74, -3.64, x1, 2.9, -3.48, FELT[6], { skip: 'we' }).box(x, 2.76, 3.3, x1, 2.9, 3.44, FELT[2], { skip: 'we' });
  }
  { const g = deck.bucket(99, 0, 'av').g; g.quad([99.94, 0, -1.6], [99.94, 0, 1.6], [99.94, 2.4, 1.6], [99.94, 2.4, -1.6], '#ffc890', 1.7 * k); deck.glow([{ p: [99.5, 1.4, 0], color: WARM, power: 1.2 * k, size: 2.4 }]); }
  yield 'hush: felt';

  // ---- the slates of the Arcade
  const g = deck.bucket(-20, 0, 'slates').g;
  const hung = (text, x, z, w, h, o = {}) => {      // a slate hung under the ceiling on two cords, facing back down the Arcade
    const y = o.y || 2.41;
    slate(deck, g, text, { at: [x, y, z], d: [-1, 0], w, h, px: o.px || 0, head: o.head, ink: o.ink });
    for (const s of [-1, 1]) g.box(x + 0.008, y + h / 2, z + s * (w / 2 - 0.12) - 0.006, x + 0.02, AH, z + s * (w / 2 - 0.12) + 0.006, '#2f2a25', { skip: 'tb' });
  };
  hung('THE QUIET ARCADE', -29, 0, 2.7, 0.42);
  hung('QUIET, PLEASE', -11, 0, 1.9, 0.4);
  hung('WE KNOW', -11.02, 1.32, 0.5, 0.2, { y: 2.05, px: 110 });
  // what the shops put out, each facing the way people come
  aboard(deck, g, ['THE KETTLE', 'DOES NOT', 'WHISTLE'], -30.4, -2.9, [-1, 0.12]);
  aboard(deck, g, ['RED CHALK', 'FOR SHOUTING'], -22.7, -3.0, [-1, 0.2], { ink: RED });
  aboard(deck, g, ['DIM', 'IS NOT', 'BROKEN'], -17.7, -3.1, [-1, 0.15]);
  aboard(deck, g, ['GIN', 'BY THE GLASS.', 'NOT IN THE WOOD.', 'not at breakfast either'], -3.7, -2.75, [-1, 0.2], { head: true, w: 0.72, h: 0.92 });
  aboard(deck, g, ['FOUND:', 'A SLATE.', 'IT SAYS', 'MINE.'], -8.6, 3.15, [-1, -0.25]);
  aboard(deck, g, ['LOST: MY CHALK', 'WRITE IF FOUND'], -26.4, 3.2, [-1, -0.22], { w: 0.92, h: 0.62 });
  for (const [text, x] of [[['HAIRCUTS', 'NO CONVERSATION'], -15.6], [['SOFT SOLES', 'FELT. CORK. NO NAILS.'], -9.6]]) {
    slate(deck, g, text, { at: [x, 2.22, -3.32], d: [-1, 0], w: 0.96, h: 0.46, head: true });
    g.box(x + 0.006, 2.5, -3.93, x + 0.03, 2.54, -2.8, '#3a3b3c');
  }
  yield 'hush: boards';
  // the wood's own slate, hung in its mouth and turned to those coming along the Arcade
  slate(deck, g, 'WALK IT SILENT', { at: [-1, 2.27, 4.06], d: [-0.6, -0.8], w: 1.9, h: 0.4 });
  for (const s of [-1, 1]) g.box(-1 - s * 0.66 - 0.008, 2.47, 4.06 + s * 0.5 - 0.008, -1 - s * 0.66 + 0.008, 2.52, 4.06 + s * 0.5 + 0.008, '#2f2a25', { skip: 'tb' });
  // the slate shop's window: slates by size
  const sb = arcade.sides.front.find('slates');
  if (sb) {
    const P = deck.pen(arcade.sides.front.run, (sb.u0 + sb.u1) / 2, 'slates'), u = sb.u0 + 1.5;
    P.g.tint(0).box(u, 0.62, 0.14, sb.u1 - 0.3, 0.7, 0.7, pal.trim[1], { skip: 'b' });
    for (let i = 0; i < 9; i++) P.g.box(u + 0.2 + i * 0.05, 0.7, 0.2, u + 0.235 + i * 0.05, 0.725, 0.34, i === 4 ? RED : CHALK, { skip: 'b' });      // sticks of chalk, and the red one
    P.done();
    const at = (du, y) => arcade.sides.front.run.pt(sb.u0 + du, y, 0.48);
    slate(deck, g, ['A', 'LONG', 'STORY'], { at: at(2.35, 0.7 + 0.5), d: [-0.5, 0.87], w: 0.8, h: 0.96, tilt: 0.1 });
    slate(deck, g, ['A FULL', 'ANSWER'], { at: at(3.5, 0.7 + 0.28), d: [-0.5, 0.87], w: 0.64, h: 0.5, tilt: 0.1 });
    slate(deck, g, ['SMALL', 'TALK'], { at: at(4.45, 0.7 + 0.2), d: [-0.5, 0.87], w: 0.44, h: 0.34, tilt: 0.1 });
  }
  yield 'hush: shop window';
  // slates pinned to the hangings, benches against them, a few ferns in tubs
  for (const [x, w, h, n] of [[-33.2, 0.4, 0.3, 3], [-31.4, 0.3, 0.22, 2], [-20.6, 0.44, 0.32, 3], [-15.3, 0.3, 0.4, 3], [-5.4, 0.36, 0.26, 2], [5.6, 0.4, 0.3, 3], [7.0, 0.28, 0.2, 2]]) slate(deck, g, null, { at: [x, 1.5 + 0.2 * ((x * 7) % 1), 4.06], d: [0, -1], w, h, marks: n });
  for (const [x, n] of [[-19.4, 1], [4.2, 2]]) {
    deck.put('bench', { p: [x, 0, 3.58], yaw: 0, color: '#6f7868' });
    for (let i = 0; i < n; i++) person(g, [x - 0.36 + i * 0.7, 0.45, 3.54], Math.PI + (i ? -0.3 : 0.2), 'bench', { cloth: CLOTHES[(i * 5 + 3 + n) % CLOTHES.length], skin: SKINS[(i + n) % 5], hair: HAIR[(i * 3 + n + 3) % 8], nod: 0.25, long: i === 1 });
  }
  for (const x of [-27.7, -21.8, -9.8, -3.75, 2.3, 8.2, 14.3]) deck.put('tub', { p: [x, 0, 3.5], yaw: rng() * TAU, scale: rng.f(0.9, 1.2), color: shade(rng.pick(pal.leaf), rng.f(0.9, 1.2)) });
  yield 'hush: arcade slates';

  // ---- two neighbours in the middle of an argument, across the Arcade, and the flight goes between them
  const ya = Math.atan2(-0.6, 0.8), yb = Math.atan2(-0.6, -0.8), A = [-14.6, 0, -2.5], B = [-14.3, 0, 1.3];
  person(g, A, ya, 'high', { cloth: '#7b6e5f', skin: SKINS[1], hair: HAIR[4], bald: true });
  slate(deck, g, ['I AM NOT', 'SHOUTING'], { at: [A[0] + 0.22 * Math.sin(ya), 1.97, A[2] + 0.22 * Math.cos(ya)], d: [Math.sin(ya), Math.cos(ya)], w: 0.7, h: 0.5, ink: RED, px: 200 });
  person(g, B, yb, 'hold', { cloth: '#5d6a6e', skin: SKINS[3], hair: HAIR[0], long: true });
  slate(deck, g, 'YOU ARE', { at: [B[0] + 0.4 * Math.sin(yb), 1.27, B[2] + 0.4 * Math.cos(yb)], d: [Math.sin(yb), Math.cos(yb)], w: 0.4, h: 0.25, px: 170 });
  yield 'hush: neighbours';
  // people about: at the tea counter, at a window, by the felt; each with a slate at the hip
  for (const [x, z, yaw, ch] of [[-32.4, -2.85, Math.PI, 0], [-33.2, -2.6, Math.PI - 0.3, 0], [-31.0, -5.0, 0, 0], [-1.0, -5.0, 0.2, 0], [-30.4, 3.2, 1.45, 0], [-29.3, 3.3, -1.7, 0],
    [-5.3, 3.1, 2.4, 1], [-4.6, 3.3, -2.6, 0], [4.6, -3.0, 2.9, 0], [9.8, 3.0, -1.6, 0], [10.5, 3.2, 1.7, 1], [15.5, -2.9, 3.0, 0], [21.5, 3.1, 1.5, 0], [22.2, 2.9, -1.4, 0], [30.5, -3.0, 0.2, 0], [38, 3.1, -1.9, 0]])
    folk.add('stand', { p: [x, 0, z], yaw, walk: [0, 0, 0, 0] }, ch);
  // going the flight's way ahead of it, and coming the other way on the far side: none of them reaches the wood's mouth while the flight is turning in
  for (const [x0, z, v] of [[-9, -1.9, 1.05], [5, -2.1, 1.15], [21, -1.8, 1.0], [36, -2.0, 1.1], [29, 2.3, -1.1], [47, 2.2, -1.0], [69, 2.4, -1.15], [88, 2.2, -1.05]])
    folk.add('pace', { p: [v > 0 ? WX0 : WX1, 0, z], yaw: v > 0 ? Math.PI / 2 : -Math.PI / 2, drift: [v, 0, 0, 200 / Math.abs(v)], phase: (v > 0 ? x0 - WX0 : WX1 - x0) / 200 }, 0);
  // two children running the other way in felt soles as the flight begins, and a robot buffing the floor by the runner
  for (const [x0, z] of [[-27, 2.45], [-25.3, 2.75]]) folk.add('pace', { p: [WX1, 0, z], yaw: -Math.PI / 2, drift: [-3.3, 0, 0, 200 / 3.3], phase: (WX1 - x0) / 200 }, 1);
  deck.put('robot', { p: [WX0, 0, 1.55], yaw: Math.PI / 2, drift: [0.42, 0, 0, 200 / 0.42], phase: (-20.2 - WX0) / 200, color: '#b9bbb0' });
  yield 'hush: arcade people';
  return arcade;
}

// ---------------------------------------------------------------- the wood: what stands along the path
// a place beside the flight's own path through the wood: at x along it, off metres to the right (the left is negative)
function trackSide(path) {
  const pts = path.points(0.1).filter((p) => p.z > WZ0 && p.x < HX0 + 4);
  return (x, off = 0) => {
    let i = 0;
    while (i < pts.length - 2 && pts[i + 1].x < x) i++;
    const a = pts[i], b = pts[i + 1], hx = b.x - a.x, hz = b.z - a.z, l = Math.hypot(hx, hz) || 1, t = clamp((x - a.x) / (Math.abs(hx) > 1e-6 ? hx : 1e-6), 0, 1);
    return { x: a.x + hx * t - hz / l * off, z: a.z + hz * t + hx / l * off, yaw: Math.atan2(hx, hz), h: [hx / l, hz / l] };
  };
}
// room to stand beside the path: a little more bark
function bay(net, side, x0, x1, off, w) {
  const pts = [];
  for (let x = x0; x <= x1 + 0.01; x += 0.5) { const q = side(x, off); pts.push([q.x, q.z]); }
  net.E['bay' + x0] = { pts, w };
  for (const q of pts) net.all.push([q[0], q[1], w / 2]);
}
function* dressWood(deck, side, rng, folk) {
  const g = deck.bucket(40, 30, 'woodthings').g, dir = (yaw) => [Math.sin(yaw), Math.cos(yaw)];
  stake(deck, g, ['NINE DAYS', 'SINCE ANYONE', 'SPOKE'], 2.4, 8.3, [-0.55, -0.83], { w: 0.66, h: 0.5, px: 170 });
  stake(deck, g, ['KEEP TO THE BARK', 'THE GRIT CRUNCHES'], 12.2, 22.4, [-0.95, -0.3], { w: 0.92, h: 0.5, px: 150 });
  { const q = side(20.4, -2.3); stake(deck, g, ['WHISPERING', 'IS TALKING'], q.x, q.z, [-q.h[0] - 0.45 * q.h[1], -q.h[1] + 0.45 * q.h[0]], { w: 0.74, h: 0.46, px: 150 }); }
  { const q = side(39.8, 2.4); stake(deck, g, ['IF A TREE FALLS HERE', 'EVERYONE HEARS IT'], q.x, q.z, [-q.h[0] + 0.5 * q.h[1], -q.h[1] - 0.5 * q.h[0]], { w: 1.1, h: 0.54, y: 1.0, px: 150 }); }
  {
    // a mother and her child coming along the path, in the middle of the oldest conversation there is
    const m = side(26.1, 2.05), c = side(25.5, 1.3), ym = m.yaw + Math.PI - 0.4, yc = c.yaw + Math.PI + 0.1, s = 0.72;
    person(g, [m.x, 0, m.z], ym, 'hold', { cloth: '#8f9a8c', skin: SKINS[2], hair: HAIR[1], bun: true, turn: -0.45, nod: 0.25 });
    slate(deck, g, 'BECAUSE', { at: [m.x + 0.4 * Math.sin(ym), 1.27, m.z + 0.4 * Math.cos(ym)], d: dir(ym), w: 0.4, h: 0.22, px: 200 });
    person(g, [c.x, 0, c.z], yc, 'high', { scale: s, head: 1.18, cloth: '#a9a99b', skin: SKINS[2], hair: HAIR[1], turn: 0.5, nod: -0.3 });
    slate(deck, g, 'WHY', { at: [c.x + 0.22 * s * Math.sin(yc), 1.95 * s, c.z + 0.22 * s * Math.cos(yc)], d: dir(yc), w: 0.3, h: 0.22, px: 210 });
  }
  yield 'hush: the path';
  {
    // a child who has been told a wanderer is coming
    const c = side(34.6, -2.0), yc = c.yaw + Math.PI + 0.4, s = 0.76;
    person(g, [c.x, 0, c.z], yc, 'high', { scale: s, head: 1.15, cloth: '#9b9584', skin: SKINS[0], hair: HAIR[2], long: true });
    slate(deck, g, ['ARE YOU', 'THE WANDERER'], { at: [c.x + 0.22 * s * Math.sin(yc), 1.97 * s, c.z + 0.22 * s * Math.cos(yc)], d: dir(yc), w: 0.44, h: 0.3, px: 200 });
  }
  {
    // an old yew, and what its keepers have to say about it
    const q = side(74.6, 2.9), d = [-q.h[0] + 0.5 * q.h[1], -q.h[1] - 0.5 * q.h[0]];
    stake(deck, g, ['YEW. 140 YEARS.', 'HAS NEVER', 'SAID A WORD.'], q.x, q.z, d, { w: 0.84, h: 0.58, px: 150 });
    const r = side(76.0, 2.0);
    folk.add('stand', { p: [r.x, 0, r.z], yaw: Math.atan2(q.x - r.x, q.z - r.z), walk: [0, 0, 0, 0] }, 0);
  }
  yield 'hush: the path';
  {
    // the bench, and someone on it with their eyes shut
    const b = side(85.2, -2.5), yb = Math.atan2(-b.h[1], b.h[0]), fx = Math.sin(yb), fz = Math.cos(yb);     // the bench looks across the path
    deck.put('bench', { p: [b.x, 0, b.z], yaw: yb + Math.PI, color: '#6f7868' });
    person(g, [b.x + b.h[0] * 0.34 + fx * 0.04, 0.45, b.z + b.h[1] * 0.34 + fz * 0.04], yb, 'bench', { cloth: '#7f7a6b', skin: SKINS[1], hair: HAIR[5], shut: true, nod: -0.24, legs: '#474238' });
    slate(deck, g, ['NOT ASLEEP.', 'LISTENING.'], { at: [b.x - b.h[0] * 0.4 + fx * 0.38, 0.26, b.z - b.h[1] * 0.4 + fz * 0.38], d: [fx - 0.75 * b.h[0], fz - 0.75 * b.h[1]], w: 0.7, h: 0.48, tilt: 0.36, px: 190 });
  }
  yield 'hush: the path';
  {
    // two on a second bench, with a game going on the slate between them
    const b = side(71.4, 2.3), yb = Math.atan2(-b.h[0] + 0.45 * b.h[1], -b.h[1] - 0.45 * b.h[0]), fx = Math.sin(yb), fz = Math.cos(yb);      // it looks back along the path
    deck.put('bench', { p: [b.x, 0, b.z], yaw: yb + Math.PI, color: '#69735f' });
    person(g, [b.x + fz * 0.52 + fx * 0.04, 0.45, b.z - fx * 0.52 + fz * 0.04], yb - 0.45, 'bench', { cloth: '#5d6a6e', skin: SKINS[3], hair: HAIR[3], turn: -0.5, nod: 0.3 });
    person(g, [b.x - fz * 0.52 + fx * 0.04, 0.45, b.z + fx * 0.52 + fz * 0.04], yb + 0.45, 'bench', { cloth: '#9b9584', skin: SKINS[0], hair: HAIR[6], long: true, turn: 0.5, nod: 0.3 });
    slate(deck, g, ['X  O  X', 'O  X  O', 'O  X  X'], { at: [b.x - fx * 0.09, 0.45 + 0.2, b.z - fz * 0.09], d: [fx, fz], w: 0.4, h: 0.38, tilt: 0.4, px: 210 });
  }
  {
    // someone whose calling it is to rake the grit, at work in a bed
    const q = side(56, -5.8), yr = q.yaw + 2.5, fx = Math.sin(yr), fz = Math.cos(yr);
    person(g, [q.x, 0, q.z], yr, 'hold', { cloth: '#746a5c', skin: SKINS[3], hair: HAIR[6], nod: 0.3 });
    g.tint(0).tube([[q.x + fx * 0.3, 1.26, q.z + fz * 0.3], [q.x + fx * 1.75, 0.05, q.z + fz * 1.75]], 0.016, 4, '#8a7a62', { smooth: false });
    g.tube([[q.x + fx * 1.75 - fz * 0.3, 0.04, q.z + fz * 1.75 + fx * 0.3], [q.x + fx * 1.75 + fz * 0.3, 0.04, q.z + fz * 1.75 - fx * 0.3]], 0.024, 4, '#6b5a48', { smooth: false });
  }
  yield 'hush: the path';
  {
    // the drum's one word, a letter to a slate, on a cord between two birches, where the path is at its highest
    const a = side(60.5, -3.4), b = side(60.5, 3.4), y = 6.0;
    g.tint(0).tube([[a.x, y + 0.56, a.z], [(a.x + b.x) / 2, y + 0.44, (a.z + b.z) / 2], [b.x, y + 0.56, b.z]], 0.012, 3, '#2f2a25', { smooth: false });
    'LISTEN'.split('').forEach((ch, i) => { const t = (i + 0.5) / 6 * 0.72 + 0.14, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t; slate(deck, g, ch, { at: [x, y + 0.04 * Math.abs(i - 2.5), z], d: [-a.h[0], -a.h[1]], w: 0.56, h: 0.78, tilt: -0.12 }); });
    lettered -= 5;       // six slates, one word
  }
  // where the path comes to the hall
  aboard(deck, g, ['WELCOME,', 'WANDERER.', 'EAT.'], 97.7, 34.3, [-1, -0.28], { w: 0.84, h: 1.04, px: 300 });
  aboard(deck, g, ['BREAKFAST', 'JOOK', 'CHILI CRISP', 'SOUR PUFFS', 'MILK TEA', '0.96'], 99.0, 29.7, [-1, 0.3], { w: 0.8, h: 1.1, head: true });
  // people standing where paths meet, and on the apron before the hall: listening, or on their way in to breakfast
  for (const [x, z, yaw, ch] of [[21.2, 48.2, 2.0, 0], [22.4, 49.6, -1.2, 0], [60.4, 14.4, 0.4, 0], [-37, 31.6, 1.4, 0], [-57.2, 28.2, 0.3, 1], [-56.6, 29.6, -2.5, 0], [65.2, 48.6, 2.8, 0],
    [95.6, 25.6, 1.3, 0], [96.6, 38.8, 1.9, 0], [97.4, 24.4, 1.7, 1], [95.2, 41.2, 1.2, 0], [96.2, 40.5, -1.9, 0], [47.5, 29.0, 2.2, 0], [-18, 15.6, 0.2, 0], [0.6, 51.2, 3.0, 0]])
    folk.add('stand', { p: [x, 0, z], yaw, walk: [0, 0, 0, 0] }, ch);
  yield 'hush: the path';
}
// People walking the paths, slowly: each goes round a loop of them and keeps to the right. Where each is at each second
// of the flight is known as the world is built, and anyone who would come within two metres of the camera is not sent out.
function walkerAt(net, w, t, out) {
  onLoop(net.loops[w.loop], w.d0 + w.dir * w.v * t, out);
  const h = out[2] + (w.dir < 0 ? Math.PI : 0);
  out[0] -= Math.cos(h) * w.off; out[1] += Math.sin(h) * w.off; out[2] = h;
  return out;
}
// loops: which of the net's rounds to walk; near(t): how close to the camera anyone may come at second t
function* makeWalkers(deck, net, path, rng, n, loops, t0, t1, near, o = {}) {
  const out = [], p = [0, 0, 0], cam = [];
  for (let t = t0; t < t1; t += 0.3) { const c = path.flat(t); cam.push([t, c.x, c.y, c.z]); }
  for (let i = 0; i < n * 3 && out.length < n; i++) {
    const w = { loop: loops[i % loops.length], dir: rng() < 0.5 ? 1 : -1, v: rng.f(0.75, 1.05) * (o.slow || 1), d0: rng() * 1000, off: rng.f(0.5, 0.75) * (o.close || 1), k: i % 7, ph: rng() * TAU, s: rng.f(0.94, 1.05), color: rng.pick(CLOTHES) };
    let ok = true;
    for (const c of cam) { if (c[2] >= 4.2) continue; walkerAt(net, w, c[0], p); if (Math.hypot(c[1] - p[0], c[3] - p[1]) < near(c[0])) { ok = false; break; } }
    if (ok) out.push(w);
    if (deck.clk.due()) { yield 'hush: walkers'; deck.clk.go(); }
  }
  return out;
}
// a round to walk, from its corners
function roundOf(corners) {
  const pts = [], n = corners.length;
  for (let i = 0; i < n; i++) { const a = corners[i], b = corners[(i + 1) % n], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.6)); for (let k = 0; k < m; k++) pts.push([a[0] + (b[0] - a[0]) * k / m, a[1] + (b[1] - a[1]) * k / m]); }
  const cum = [0];
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  return { pts, cum, len: cum[pts.length] };
}
// A crowd of one model drawn as one mesh whose copies the world moves itself, each frame (as chervil_hall.js does).
// put(i, x, y, z, yaw, lean, scale): yaw about up, then lean about its own x (forward is positive).
function herd(group, geo, mat, n, ball) {
  const m = new InstancedMesh(geo, mat, Math.max(1, n));
  m.count = n;
  m.instanceMatrix.setUsage(DynamicDrawUsage);
  m.boundingSphere = ball;
  const e = m.instanceMatrix.array, c = new Color();
  group.add(m);
  return {
    mesh: m,
    put(i, x, y, z, yaw, lean, s) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(lean), sp = Math.sin(lean), o = i * 16;
      e[o] = cy * s; e[o + 1] = 0; e[o + 2] = -sy * s; e[o + 3] = 0;
      e[o + 4] = sy * sp * s; e[o + 5] = cp * s; e[o + 6] = cy * sp * s; e[o + 7] = 0;
      e[o + 8] = sy * cp * s; e[o + 9] = -sp * s; e[o + 10] = cy * cp * s; e[o + 11] = 0;
      e[o + 12] = x; e[o + 13] = y; e[o + 14] = z; e[o + 15] = 1;
    },
    color(i, col) { const v = rgb(col); c.setRGB(v[0], v[1], v[2]); m.setColorAt(i, c); m.instanceColor.needsUpdate = true; },
    done() { m.instanceMatrix.needsUpdate = true; },
  };
}

// ---------------------------------------------------------------- steam
// Steam off a bowl, and the cloud that comes up when a lid is lifted. Each puff is a soft disc that faces the eye:
// it starts at t0, lives `life` seconds, and comes again every `every` seconds (0: once). The clock is the flight's.
const STEAM_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aLife; attribute vec4 aMove;
${BEND_PARS}
uniform float uT, uPx; uniform vec2 uRes;
varying vec3 vW; varying float vA; varying vec2 vQ;
void main() {
  float age = uT - aLife.x;
  if (aLife.z > 0.0) age = mod(age, aLife.z);
  float u = age / aLife.y;
  vA = (u > 0.0 && u < 1.0) ? aMove.w * smoothstep(0.0, 0.18, u) * (1.0 - u) * (1.0 - u) : 0.0;
  // going up it slows, spreads, and leans spinward: 2 x 0.0572 rad/s x its speed
  vec3 p = aPos + vec3(aMove.x * age + 0.057 * aMove.y * age * age, aMove.y * age * (1.0 - 0.3 * u), aMove.z * age);
  vec3 n = vec3(0.0, 1.0, 0.0);
  kBend(p, n);
  vW = p;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float px = clamp(aLife.w * (0.6 + 1.6 * u) * uPx / max(-mv.z, 0.05), 0.0, 420.0);
  vQ = position.xy;
  vec4 clip = projectionMatrix * mv;
  clip.xy += position.xy * px / uRes * clip.w * 2.0;
  gl_Position = vA > 0.0 ? clip : vec4(2.0, 2.0, 2.0, 1.0);
}`;
const STEAM_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uColor;
varying vec3 vW; varying float vA; varying vec2 vQ;
void main() {
  ${CLIP_FRAG}
  float a = max(1.0 - length(vQ) * 2.0, 0.0);
  gl_FragColor = vec4(uColor * (vA * a * a), 1.0);
}`;
function steamMesh(puffs, frame) {
  const n = puffs.length, g = new InstancedBufferGeometry(), aPos = new Float32Array(n * 3), aLife = new Float32Array(n * 4), aMove = new Float32Array(n * 4);
  g.setAttribute('position', new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  puffs.forEach((q, i) => { aPos.set(q.p, i * 3); aLife.set([q.t0, q.life, q.every || 0, q.size], i * 4); aMove.set([q.v[0], q.v[1], q.v[2], q.power], i * 4); });
  g.setAttribute('aPos', new InstancedBufferAttribute(aPos, 3)); g.setAttribute('aLife', new InstancedBufferAttribute(aLife, 4)); g.setAttribute('aMove', new InstancedBufferAttribute(aMove, 4));
  g.instanceCount = n;
  const mat = new ShaderMaterial({
    uniforms: { uClip: G.uClip, uPx: G.uPx, uRes: G.uRes, uT: { value: 0 }, uColor: { value: new Vector3(1.0, 0.86, 0.68) }, uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) } },
    vertexShader: STEAM_VERT, fragmentShader: STEAM_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const mesh = new Mesh(g, mat);
  mesh.frustumCulled = false; mesh.renderOrder = 9;
  return mesh;
}

// ---------------------------------------------------------------- the hall
// The kit's hall() makes the room and lays the tables and benches; the lamps, the people, what is on the tables and
// the two end walls are this page's. Returns tick(t, eye): the spoons, the lids, and four hundred heads.
function* buildHall(deck, path, rng, scene) {
  const k = deck.glowK, frame = deck.frame, HX1 = path.exit.flat.x - 0.3, wallC = '#8d8a78', dadoC = '#565a4c', wood = '#7d6a52';
  yield* hall(deck, { x0: HX0, x1: HX1, z0: HZ0, z1: HZ1, y: 0, height: HH, open: { anti: 'none', spin: 'none' }, wall: wallC, dado: dadoC, floor: '#7a7362', shine: 0.5, lamps: false,
    tables: { axis: 'x', rows: ROWS, from: TX0, to: TX1, taken: 0, dishes: false } });
  deck.spots.length = 0;
  yield 'hush: hall';
  const g = deck.bucket(HX0 + 2, CZ, 'hall').g;
  // the side open to the wood: four bays under a beam, the two in the middle thrown into one
  for (const z of [OPEN0, OPEN0 + SBW, OPEN1 - SBW, OPEN1]) g.tint(0).box(HX0 - 0.28, 0, z - 0.3, HX0 + 0.28, HH, z + 0.3, wallC, { skip: 'tb' });
  g.box(HX0 - 0.24, 2.56, OPEN0, HX0 + 0.24, HH, OPEN1, shade(wallC, 0.9), { skip: 't' }).box(HX0 - 0.3, 0, OPEN0, HX0 + 0.3, 0.02, OPEN1, wood, { skip: 'b' });
  for (const [a, b] of [[HZ0, OPEN0], [OPEN1, HZ1]]) g.quad([HX0, 0, b], [HX0, 0, a], [HX0, HH, a], [HX0, HH, b], wallC);
  // the far end: a wall, and in it a doorway with a deep frame of old wood and no door
  const wx = HX1, d0 = CZ - 0.8, d1 = CZ + 0.8, dh = 2.32, rev = 0.42;
  const wX = (za, zb, ya, yb, col) => g.quad([wx, ya, za], [wx, ya, zb], [wx, yb, zb], [wx, yb, za], col);
  wX(HZ0, d0, 0, HH, wallC); wX(d1, HZ1, 0, HH, wallC); wX(d0, d1, dh, HH, wallC);
  g.box(wx - 0.022, 0, HZ0, wx, 1.0, d0 - 0.12, dadoC, { skip: 'be' }).box(wx - 0.022, 0, d1 + 0.12, wx, 1.0, HZ1, dadoC, { skip: 'be' });
  g.quad([wx, 0, d0], [wx + rev, 0, d0], [wx + rev, dh, d0], [wx, dh, d0], wood).quad([wx + rev, 0, d1], [wx, 0, d1], [wx, dh, d1], [wx + rev, dh, d1], wood);
  g.floor(wx, d0, wx + rev, d1, dh, shade(wood, 0.8), { down: true }).floor(wx, d0, wx + rev, d1, 0.002, shade(wood, 0.9));
  g.box(wx - 0.04, 0, d0 - 0.12, wx, dh + 0.12, d0, wood, { skip: 'be' }).box(wx - 0.04, 0, d1, wx, dh + 0.12, d1 + 0.12, wood, { skip: 'be' }).box(wx - 0.04, dh, d0, wx, dh + 0.12, d1, wood, { skip: 'e' });
  slate(deck, g, ['THE BIG WOOD', 'WALK IT SILENT'], { at: [wx - 0.035, 1.62, d1 + 1.28], d: [-1, 0], w: 0.94, h: 0.56, head: true, px: 200 });
  yield 'hush: the room';
  {
    // a hanging of felt drawn back either side of the doorway, the hall's keeper beside it, and chairs nobody matched
    const c = deck.bucket(HX0 + 2, CZ, 'hall').c;
    c.tint(1);
    for (const za of [d0 - 0.62, d1 + 0.16]) for (let i = 0; i < 5; i++) { const a = za + i * 0.092, xa = wx - 0.06 - 0.1 * (i % 2), xb = wx - 0.06 - 0.1 * ((i + 1) % 2); c.quad([xa, 0.03, a], [xb, 0.03, a + 0.092], [xb, 2.5, a + 0.092], [xa, 2.5, a], shade(FELT[3], 0.8 + 0.1 * (i % 3))); }
    c.tint(0);
    g.box(wx - 0.09, 2.5, d0 - 0.7, wx - 0.05, 2.54, d1 + 0.7, '#3a3b3c');
    const kp = [wx - 0.9, 0, d0 - 1.25], ky = Math.atan2(-0.82, 0.57);
    person(g, kp, ky, 'hold', { cloth: '#6f7f86', skin: SKINS[2], hair: HAIR[4], bald: true, turn: 0.15, nod: 0.05 });
    slate(deck, g, 'SHH', { at: [kp[0] + 0.4 * Math.sin(ky), 1.27, kp[2] + 0.4 * Math.cos(ky)], d: [Math.sin(ky), Math.cos(ky)], w: 0.36, h: 0.24, px: 210 });
    deck.put('chair', { p: [wx - 0.5, 0, HZ0 + 3.2], yaw: Math.PI / 2, color: '#6f7f86' }); deck.put('armchair', { p: [wx - 0.6, 0, HZ0 + 4.4], yaw: Math.PI / 2 + 0.2, color: '#7b6e5f' });
    deck.put('stool', { p: [wx - 0.45, 0, HZ0 + 5.5], yaw: 0, color: '#a59a82' }); deck.put('chair', { p: [wx - 0.5, 0, HZ1 - 3.4], yaw: Math.PI / 2 - 0.15, color: '#93876f' }); deck.put('chair', { p: [wx - 0.52, 0, HZ1 - 4.3], yaw: Math.PI / 2, color: '#4f5854' });
    for (const s of [-1, 1]) { deck.put('hushLamp', { p: [wx - 1.1, HH, CZ + s * 2.3], yaw: 0, color: shade(FELT[4], 1.3) }); deck.glow([{ p: [wx - 1.1, HH - 0.9, CZ + s * 2.3], color: WARM, power: 1.0 * k, size: 0.45 }]); }
    deck.zone({ min: [wx - 3.4, -0.5, CZ - 4.2], max: [wx + 0.6, HH, CZ + 4.2], soft: 1.6, color: WARM, power: 0.3, side: 1, under: 0.5 });
  }
  // felt on the walls, in lengths of different ages
  for (const [zw, sgn] of [[HZ0, 1], [HZ1, -1]]) for (let x = HX0 + 0.8; x < HX1 - 1.4;) { const w = rng.f(1.5, 2.6); g.box(x, 1.12, zw + (sgn > 0 ? 0 : -0.035), Math.min(HX1 - 0.4, x + w), 2.74, zw + (sgn > 0 ? 0.035 : 0), shade(rng.pick(FELT), rng.f(0.8, 1.05)), { skip: sgn > 0 ? 'n' : 's' }); x += w + 0.06; }
  for (const [za, zb] of [[HZ0 + 0.6, d0 - 0.9], [d1 + 2.1, HZ1 - 0.6]]) for (let z = za; z < zb - 0.8;) { const w = Math.min(zb - z, rng.f(1.5, 2.6)); g.box(wx - 0.035, 1.12, z, wx, 2.74, z + w, shade(rng.pick(FELT), rng.f(0.8, 1.05)), { skip: 'e' }); z += w + 0.06; }
  // a counter along one wall where the pans stand
  for (let i = 0; i < 4; i++) { deck.put('counter', { p: [TX0 + 3 + i * 6.2, 0, HZ1 - 0.5], yaw: 0, scale: [2.6, 1, 1.2], color: '#8a7a62' }); for (let j = 0; j < 3; j++) deck.put('pan', { p: [TX0 + 1.4 + i * 6.2 + j * 1.6, 0.95, HZ1 - 0.5], yaw: 0, scale: 0.9, color: '#c9c8c2' }); }
  yield 'hush: the room';

  // small warm lamps hung low over the tables: the only warm light in the block
  deck.proto('hushLamp', (q) => {
    q.cyl(0, -0.8, 0, 0.008, 0.008, 0.8, 4, '#2f2a25', { cap: false });
    q.tint(1).cyl(0, -0.93, 0, 0.17, 0.05, 0.13, 8, '#ffffff', { smooth: false, cap: false });
    q.tint(0).push(MIRROR); q.cyl(0, -0.93, 0, 0.165, 0.045, 0.13, 8, '#ffd9a0', { smooth: false, cap: false, emit: 0.9 }); q.pop();
    q.blob(0, -0.9, 0, [0.05, 0.055, 0.05], 0, '#ffe6bc', { emit: 5, shadeBottom: 1 });
  });
  const lampY = HH - 0.9;
  for (let r = 0; r < ROWS; r++) for (let i = 0; i < 10; i++) { const x = TX0 + 1.25 + i * 2.5, z = TZ(r); deck.put('hushLamp', { p: [x, HH, z], yaw: rng() * TAU, color: shade(rng.pick(FELT), 1.3) }); deck.glow([{ p: [x, lampY, z], color: WARM, power: 1.0 * k, size: 0.45 }]); }
  deck.lattice({ origin: [TX0 + 1.25, lampY, TZ(0)], spacing: [2.5, TZ(1) - TZ(0)], count: [10, ROWS], color: WARM, power: 2.2, reach: 2.3, drop: 3.0 });
  deck.zone({ min: [HX0 + 1.5, -0.5, HZ0 + 1.5], max: [HX1 - 1.5, HH + 0.2, HZ1 - 1.5], soft: 1.5, color: '#ffb878', power: 0.07, side: 1, under: 1 });

  // what is on the tables
  deck.proto('jook', (q) => { q.cyl(0, 0, 0, 0.058, 0.105, 0.075, 8, '#e7e2d6', { top: '#efe7d2', smooth: false }); });
  deck.proto('jookCrisp', (q) => { q.cyl(0, 0, 0, 0.058, 0.105, 0.075, 8, '#e7e2d6', { top: '#efe7d2', smooth: false }); q.blob(0.02, 0.078, 0.01, [0.035, 0.008, 0.03], 0, '#c9472c', { shadeBottom: 1, emit: 0.3 }); });
  deck.proto('lidS', (q) => { q.tint(0.4).lathe(0, 0, 0, [[0.11, 0], [0.1, 0.022], [0.065, 0.046], [0.0, 0.056]], 8, '#b9b8ae'); q.tint(0).cyl(0, 0.05, 0, 0.018, 0.018, 0.026, 5, '#6f6a60', { smooth: false }); });
  deck.proto('cup', (q) => { q.cyl(0, 0, 0, 0.03, 0.037, 0.075, 6, '#dcd8cc', { smooth: false, top: '#b9906a' }); });
  deck.proto('teapot', (q) => { q.tint(1).push(MIRROR); q.blob(0, 0.075, 0, [0.085, 0.075, 0.085], 1, '#ffffff', { shadeBottom: 0.7 }); q.pop(); q.cyl(0, 0.14, 0, 0.035, 0.03, 0.02, 6, '#ffffff', { smooth: false }).tube([[0.07, 0.07, 0], [0.14, 0.12, 0]], 0.014, 4, '#ffffff', { smooth: false }); q.tint(0); });
  deck.proto('crisp', (q) => { q.cyl(0, 0, 0, 0.045, 0.045, 0.085, 8, '#c9472c', { smooth: false, emit: 0.5, cap: false }).cyl(0, 0.085, 0, 0.048, 0.048, 0.02, 8, '#d9d2c0', { smooth: false }); });
  deck.proto('puffs', (q) => { q.cyl(0, 0, 0, 0.09, 0.14, 0.05, 8, '#8f7a5c', { smooth: false, cap: false }); for (let i = 0; i < 6; i++) q.blob(Math.cos(i * 1.1) * 0.06, 0.05 + 0.012 * (i % 2), Math.sin(i * 1.1) * 0.06, [0.04, 0.03, 0.04], 0, '#efe6cc', { seed: i + 1, shadeBottom: 0.85 }); });
  deck.proto('slateFlat', (q) => { q.box(-0.15, 0, -0.11, 0.15, 0.012, 0.11, FRAME).box(-0.13, 0.012, -0.09, 0.13, 0.016, 0.09, STONE, { skip: 'b' }); for (let i = 0; i < 3; i++) q.box(-0.1, 0.016, -0.055 + i * 0.045, 0.02 + 0.03 * ((i * 2) % 3), 0.0175, -0.045 + i * 0.045, CHALK, { skip: 'b' }); });
  deck.proto('pot', (q) => { q.cyl(0, 0, 0, 0.19, 0.19, 0.014, 10, '#e3ded2', { smooth: false }); q.tint(0.4).cyl(0, 0.014, 0, 0.12, 0.15, 0.09, 10, '#a9aaa2', { top: '#efe7d2' }); q.tint(0); });
  const seat = (i) => TX0 + 0.35 + i * PITCH, IW = 32, IS = 7, IO = 37;       // on the flight's table: the wanderer's place (the boy sits across from it), a place a slate is keeping, the old woman
  const PROPPED = [3, IS, 10, 12, 16, 19, 23, 26, 29, IO];      // the places on that table with a slate propped by the bowl
  const whenX = (x) => { for (let t = 40; t < path.duration; t += 0.05) if (path.flat(t).x > x) return t; return path.duration; };
  const diners = [], puffs = [], pots = [];
  for (let r = 0; r < ROWS; r++) for (const sd of [-1, 1]) for (let i = 0; i < SEATS; i++) {
    const x = seat(i), c = TZ(r), hero = r === HERO, empty = hero && sd < 0 && (i === IW || i === IS), boy = hero && sd > 0 && i === IW, lidOn = empty || rng() < 0.3;
    deck.put(rng() < 0.4 ? 'jookCrisp' : 'jook', { p: [x, 0.75, c + sd * 0.27], yaw: rng() * TAU });
    if (lidOn) deck.put('lidS', { p: [x, 0.826, c + sd * 0.27], yaw: rng() * TAU, color: '#c9c8c0' });
    else if (rng() < 0.6) deck.put('lidS', { p: [x + 0.2, 0.752, c + sd * 0.37], yaw: rng() * TAU, color: '#c9c8c0' });
    if (rng() < 0.75) deck.put('cup', { p: [x + (hero ? 0.2 : -0.18), 0.75, c + sd * 0.17], yaw: 0 });
    if (!hero && rng() < 0.4) deck.put('slateFlat', { p: [x + 0.27, 0.75, c + sd * 0.31], yaw: rng.f(-0.5, 0.5) + (sd > 0 ? Math.PI : 0) });
    if (!lidOn && rng() < 0.8 && !(hero && PROPPED.some((j) => Math.abs(j - i) < 2))) {
      const every = rng.f(3.6, 5), t0 = rng() * 5, pw = hero ? 0.6 : 0.95;
      for (let j = 0; j < 3; j++) puffs.push({ p: [x + rng.f(-0.03, 0.03), 0.85, c + sd * 0.27 + rng.f(-0.03, 0.03)], t0: t0 + j * every / 3, life: every * rng.f(0.8, 0.98), every, size: rng.f(0.2, 0.32), v: [rng.f(-0.015, 0.015), rng.f(0.11, 0.17), -sd * rng.f(0, 0.02)], power: pw * rng.f(0.5, 0.8) });
    }
    if (i === 0 && deck.clk.due()) { yield 'hush: places'; deck.clk.go(); }
    if (empty || boy) continue;
    const old = hero && sd < 0 && i === IO, z = c + sd * 0.72;
    diners.push({ x, z, yaw: sd < 0 ? 0 : Math.PI, k: Math.floor(rng() * SKINS.length), s: rng.f(0.94, 1.05), cloth: rng.pick(CLOTHES), hair: old ? HAIR[5] : rng.pick(HAIR), eats: !lidOn && rng() < 0.86,
      T: rng.f(3.4, 6.2), ph: rng(), w2: rng.f(0.15, 0.32), ph2: rng() * TAU, delay: 0.1 + Math.hypot(x - seat(IW), z - CZ) / 42 + rng() * 0.3 });
  }
  // down the middle of each table: pots of tea, puffs, the crisp, and serving dishes under lids that are lifted now and then
  for (let r = 0; r < ROWS; r++) for (let x = TX0 + 0.7; x < TX1 - 0.4; x += 1.24) {
    const q = rng(), z = TZ(r) + rng.f(-0.05, 0.05);
    if (r === HERO && (Math.abs(x - seat(IW) + 0.4) < 0.7 || PROPPED.some((i) => x > seat(i) - 0.95 && x < seat(i) + 0.05))) continue;      // nothing stands in front of a slate
    if (q < 0.34) deck.put('teapot', { p: [x, 0.75, z], yaw: rng() * TAU, color: rng.pick(['#7f8a78', '#a9a99b', '#5d6a6e', '#8a8476']) });
    else if (q < 0.58) deck.put('puffs', { p: [x, 0.75, z], yaw: rng() * TAU });
    else if (q < 0.76) deck.put('crisp', { p: [x, 0.75, z], yaw: 0 });
    else { deck.put('pot', { p: [x, 0.75, z], yaw: 0, color: '#c9c8c2' }); pots.push({ x, z, sd: rng.sign(), yaw: rng() * TAU, t0: whenX(x - (r === HERO ? 9.6 : 5.2) - 0.8 * Math.abs(r - HERO)) + rng.f(-0.4, 0.4) }); }
  }
  deck.put('crisp', { p: [seat(IW) - 0.42, 0.75, CZ - 0.04], yaw: 0, scale: 1.25 });       // the crisp, on the wanderer's side of the table
  for (const q of pots) for (let j = 0; j < 7; j++) puffs.push({ p: [q.x + rng.f(-0.07, 0.07), 0.9, q.z + rng.f(-0.07, 0.07)], t0: q.t0 + 0.3 + j * 0.2, life: rng.f(2.6, 3.6), every: 14, size: rng.f(0.3, 0.5), v: [rng.f(-0.05, 0.05), rng.f(0.24, 0.4), rng.f(-0.05, 0.05)], power: rng.f(0.32, 0.5) });
  yield 'hush: tables laid';

  // ---- the slates propped by the bowls, down the table the flight follows
  const prop = (text, sd, i, w) => slate(deck, g, text, { at: [seat(i) - 0.115, 0.862, CZ + sd * 0.13], d: [-1, -sd * 0.22], w: w || 0.3, h: 0.22, tilt: 0.3, px: 165 });
  prop('MORE TEA', 1, 3); prop(['SAVE ME', 'A SEAT'], -1, IS); prop(['SHE SAID', 'YES'], 1, 10); prop('TO WHAT', -1, 12); prop(['SECONDS,', 'PLEASE'], 1, 16);
  prop(['YOUR SPOON', 'IS LOUD'], -1, 19, 0.34); prop(['NOT BEFORE', 'TEA'], 1, 23); prop(['HAPPY BIRTHDAY,', 'GRAN'], -1, 26, 0.36); prop(['IS THAT', 'HER'], 1, 29); prop('WANDERERS.', -1, IO, 0.36);
  slate(deck, g, 'NO SOUND BUT SPOONS', { at: [HX0 - 0.26, 2.78, CZ], d: [-1, 0], w: 3.4, h: 0.34, frame: false });
  yield 'hush: slates';
  {
    // the boy, across from the wanderer's empty place, half turned on the bench to hold his slate up to her
    const bx = seat(IW), bz = CZ + 0.72, yb = Math.PI + 0.75, s = 0.76;
    g.at(bx, 0.45, bz, yb, s); drawBody(g, SKINS[1], 'up', { cloth: '#8f9a8c' }); g.at(0, 0.575, 0.02, 0, 1.15); drawHead(g, SKINS[1], HAIR[2], {}); g.pop(); g.pop();
    slate(deck, g, ['PASS THE', 'CRISP'], { at: [bx + s * 0.28 * Math.sin(yb), 0.45 + s * 1.18, bz + s * 0.28 * Math.cos(yb)], d: [Math.sin(yb), Math.cos(yb)], w: 0.36, h: 0.26, px: 220 });
  }
  yield 'hush: slates';

  // ---- everyone at breakfast: bodies that sit still, and heads and spoon arms that this page moves
  const folkMat = litMaterial(deck.rig, { bend: frame, soft: 0.45 }), ball = new Sphere(frame.point((HX0 + HX1) / 2, 1, CZ), 32), parts = [];
  for (let s = 0; s < SKINS.length; s++) {
    const list = diners.filter((d) => d.k === s), gb = new Geo(), gh = new Geo(), ga = new Geo();
    if (!list.length) continue;
    drawBody(gb, SKINS[s], 'eat', { legs: s % 2 ? '#3b3e3a' : '#474238' }); drawHead(gh, SKINS[s], null, { tint: true, long: s % 3 === 1, bun: s === 2 }); drawSpoonArm(ga, SKINS[s]);
    for (const m of instances(gb.build(), folkMat, list.map((d) => ({ p: [d.x, 0.45, d.z], yaw: d.yaw, scale: d.s, color: d.cloth })), { frame, cell: 4000 })) scene.add(m);
    const heads = herd(scene, gh.build(), folkMat, list.length, ball), arms = herd(scene, ga.build(), folkMat, list.length, ball);
    list.forEach((d, i) => { heads.color(i, d.hair); arms.color(i, d.cloth); });
    parts.push({ list, heads, arms });
    yield 'hush: diners';
  }
  const lidGeo = new Geo();
  lidGeo.lathe(0, 0, 0, [[0.16, 0], [0.15, 0.03], [0.11, 0.07], [0.05, 0.095], [0.0, 0.1]], 10, '#b9b8b0').cyl(0, 0.095, 0, 0.022, 0.022, 0.035, 5, '#6f6a60', { smooth: false });
  const lids = herd(scene, lidGeo.build(), deck.prop, pots.length, ball), steam = steamMesh(puffs, frame);
  scene.add(steam);
  const tick = (t, ex, ey, ez) => {
    steam.material.uniforms.uT.value = t;
    for (const { list, heads, arms } of parts) {
      for (let i = 0; i < list.length; i++) {
        const d = list[i], s = d.s, sn = Math.sin(d.yaw), cs = Math.cos(d.yaw);
        // the spoon: down to the bowl, up to the mouth, a pause. At the laugh it stops where it is
        const te = Math.min(t, T_LAUGH + d.delay), u = (te / d.T + d.ph) % 1, lift = d.eats ? smoothstep(0, 0.2, u) * (1 - smoothstep(0.34, 0.52, u)) : 0;
        let hy = 0.22 * Math.sin(te * d.w2 + d.ph2), hp = 0.2 + 0.16 * lift;
        // and every head comes round, the nearest first, and stays on the wanderer
        const w = smoothstep(d.delay, d.delay + 0.42, t - T_LAUGH);
        if (w > 0) {
          let a = Math.atan2(ex - d.x, ez - d.z) - d.yaw;
          a = clamp(a - Math.round(a / TAU) * TAU, -1.9, 1.9);
          hy += (a - hy) * w; hp += (clamp(-Math.atan2(ey - 0.45 - 0.79 * s, Math.hypot(ex - d.x, ez - d.z)), -0.5, 0.5) - hp) * w;
        }
        heads.put(i, d.x + 0.02 * s * sn, 0.45 + 0.575 * s, d.z + 0.02 * s * cs, d.yaw + hy, hp, s);
        arms.put(i, d.x + s * 0.2 * (cs + sn), 0.45 + 0.3 * s, d.z + s * 0.2 * (cs - sn), d.yaw, 0.1 - 1.4 * lift, s);
      }
      heads.done(); arms.done();
    }
    pots.forEach((q, i) => { const age = (((t - q.t0) % 14) + 14) % 14, o = smoothstep(0, 0.5, age) * (1 - smoothstep(2.5, 3.2, age)); lids.put(i, q.x, 0.855 + 0.2 * o, q.z + q.sd * 0.16 * o, q.yaw, 0.7 * o, 1); });
    lids.done();
  };
  tick(0, 0, 1.6, 0);
  return { tick, count: diners.length, lettered };
}

// ---------------------------------------------------------------- the world
export const sloeHush = {
  id: 'sloe-hush',
  title: 'Breakfast without a word', drum: 'Sloe', row: 'Hedge Row', kind: 'a wood drum', light: 8.7,
  line: 'Four hundred at breakfast and the only sound was spoons. A boy across the table chalked PASS THE CRISP on his slate and held it up. I laughed out loud, and all four hundred of them looked at me.',
  tone: '#8a9a84', source: 'wander-year.md (Day 22), daily-life.md (Light), eating-out.md (Ashgrove Mill Hall)',
  sound: { root: 41, scale: 'aeolian', pad: 0.08, air: 0.5, hum: 0.6, crowd: 0, choir: 0, bells: 0, bright: 0.1 },
  *build(ctx) {
    const frame = makeFrame(212 * DEG, 1420, deckRadius(121));         // deck 121: the floor of the wood, 0.84 g
    const rng = makeRng('sloe-hush'), dens = ctx.density || 1, dbg = /debug/.test(location.search);
    lettered = 0;
    // along the Arcade between the two neighbours; out through the hanging drawn aside; the bark path, up among the
    // trunks and down to the bench; in at the hall's open side; down the middle table to the boy; out by the far door
    const path = makePath([
      { t: 0, p: [-36, 1.6, -0.4] },
      { t: 3.2, p: [-31.6, 1.6, -0.45], look: [-24.2, 1.35, -3.5], fov: 54 },
      { t: 5.8, p: [-26.2, 1.6, -0.5], look: [-23.2, 1.2, -4.0], fov: 52 },
      { t: 7.7, p: [-21.4, 1.6, -0.45], look: [-14.4, 1.66, -0.6] },
      { t: 9.7, p: [-16.4, 1.6, -0.4], look: [-8, 1.9, 0.4] },
      { t: 11.7, p: [-10.4, 1.6, -0.3], look: [-1.4, 2.05, 4.6] },
      { t: 13.9, p: [-3.7, 1.6, 1.6], look: [0.5, 4.6, 16], fov: 62 },
      { t: 16.1, p: [-1.0, 1.65, 6.0], look: [2.5, 9, 26], fov: 66 },
      { t: 18.6, p: [0.9, 1.7, 12.2], look: [15, 6, 31], fov: 64 },
      { t: 21.6, p: [6.6, 1.7, 20.8], look: [40, 2.4, 31.5] },
      { t: 24.6, p: [17.2, 1.7, 28.6], look: [40, 1.5, 32.6] },
      { t: 27.4, p: [28.5, 1.8, 31.4], look: [52, 2.0, 30.6] },
      { t: 30.2, p: [40, 3.4, 31.0], look: [72, 1.5, 33] },
      { t: 33.0, p: [53.5, 5.4, 31.6], look: [88, 0.8, 32] },
      { t: 35.8, p: [67, 3.6, 33.0], look: [76, 0.7, 35.0] },
      { t: 38.7, p: [78.6, 1.75, 31.9], look: [87, 1.0, 29.9], fov: 52 },
      { t: 41.2, p: [87.6, 1.65, 32.0], look: [103, 1.5, 32.6] },
      { t: 43.9, p: [96.6, 1.62, 32.0], look: [112, 1.2, 32] },
      { t: 46.2, p: [103, 1.55, 32.0], look: [118, 0.95, 32], fov: 54 },
      { t: 49.6, p: [109.4, 1.32, 32.0], look: [116.4, 0.92, 32.0], fov: 50 },
      { t: 53.8, p: [116, 1.3, 31.97], look: [122.6, 0.95, 32.1], fov: 50 },
      { t: 57.1, p: [121.5, 1.3, 31.72], look: [124.6, 1.28, 32.5], fov: 50 },
      { t: 58.9, p: [124.3, 1.33, 31.72], look: [130.5, 1.25, 32.0], fov: 54 },
      { t: 61.5, p: [130.3, 1.3, 32.0] },
      { t: 63.9, p: [135.9, 1.17, 32.0] },
      { t: 64.7, p: [137.0, 1.17, 32.0] },
    ], { frame, entryRadius: 1.1, exitRadius: 1.15 });
    yield 'hush: flight';
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'sloe-hush', palette: HUSH, clock: 'flight', detail: 38,
      light: { level: 0.45, lamp: PALE, ambUp: '#919d8f', ambDown: '#646e67', ambPower: 1.15, haze: '#414b44', hazeDensity: 0.004 }, floor: { shine: 0.8, wear: 0.9, lampGlow: 1.8 } });
    const scene = new Scene(), folkMat = litMaterial(deck.rig, { bend: frame, soft: 0.45 });
    // people who stand about or walk a line: gathered here by build and made into a few meshes at the end
    const crowd = new Map(), frng = makeRng('hush-folk');
    const folk = { add(kind, item, child) {
      const k = Math.floor(frng() * 7), key = kind + k + (child ? 'c' : '');
      let a = crowd.get(key);
      if (!a) crowd.set(key, a = { kind, k, child: !!child, items: [] });
      item.color = item.color || frng.pick(CLOTHES); item.scale = (child ? 0.72 : 1) * frng.f(0.95, 1.05);
      a.items.push(item);
    } };
    yield 'hush: path';

    yield* buildArcade(deck, rng, folk);
    const room = yield* buildHall(deck, path, rng, scene);

    // ---- the wood
    const net = woodPaths(path), side = trackSide(path);
    bay(net, side, 24.6, 27.4, 1.3, 3.2); bay(net, side, 33.8, 35.4, -1.5, 2.8); bay(net, side, 83.6, 86.8, -1.9, 3.4); bay(net, side, 70.4, 72.6, 1.7, 3.0);
    yield 'hush: paths';
    yield* woodShell(deck, rng);
    const wood = yield* plantWood(deck, net, path, rng, dens, [-3.4, 3.4].map((o) => { const q = side(60.5, o); return [q.x, q.z, 'b0']; }));
    const plan = yield* paintPlan(net, wood.all, rng);
    yield '~hush: plan';
    const gg = new Geo({ maxSeg: 4 });
    for (let x = WX0; x < WX1; x += 8) gg.floor(x, WZ0, x + 8, WZ1, 0, '#ffffff');
    const v3 = (c) => { const q = rgb(c); return new Vector3(q[0], q[1], q[2]); };
    const ground = gg.mesh(new ShaderMaterial({
      uniforms: { ...deck.rig.uniforms, uClip: G.uClip, uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) }, tPlan: { value: plan },
        uRect: { value: new Vector4(WX0, WZ0, 1 / (WX1 - WX0), 1 / (WZ1 - WZ0)) }, uGrit: { value: v3('#b9baad') }, uBark: { value: v3('#6a5646') }, uMoss: { value: v3('#5b6b4e') } },
      vertexShader: GROUND_VERT, fragmentShader: groundFrag(deck.rig),
    }), frame);
    ground.renderOrder = -1;
    scene.add(ground);
    yield 'hush: ground';
    const tg = { b0: () => birchGeo(0), b1: () => birchGeo(1), b2: () => birchGeo(2), kb: () => treeGeo('birch'), yew: yewGeo, ky: () => treeGeo('yew') };
    let trees = 0;
    for (const kind in wood.lists) { trees += wood.lists[kind].length; if (wood.lists[kind].length) for (const m of instances(tg[kind](), deck.lit, wood.lists[kind], { frame, cell: 400 })) scene.add(m); yield 'hush: trees'; }
    yield* dressWood(deck, side, rng, folk);
    {
      // ferns in the grit at the feet of the trees, and birch leaves coming down: in still air they fall straight
      const frn = makeRng('hush-fern'), fl = path.points(1).filter((q) => q.z > WZ0 && q.x < WX1), clearOf = (x, z, r) => !net.all.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + r);
      // a fern: fronds arching out from one foot, each drawn both ways up
      deck.proto('fern', (q) => {
        q.tint(1);
        for (let i = 0; i < 7; i++) {
          const a = i * 0.9 + 0.3 * Math.sin(i * 2.1), c = Math.cos(a), s = Math.sin(a), L = 0.42 + 0.14 * ((i * 3) % 4) / 3, w = 0.075, col = i % 2 ? '#ffffff' : '#dcdcdc';
          const P = (t, sd) => [c * L * t - s * w * sd * (1 - t * 0.7), 0.05 + 0.34 * t * (1.55 - t), s * L * t + c * w * sd * (1 - t * 0.7)];
          for (const [t0, t1] of [[0, 0.5], [0.5, 1]]) { q.quad(P(t0, -1), P(t0, 1), P(t1, 1), P(t1, -1), col); q.quad(P(t1, -1), P(t1, 1), P(t0, 1), P(t0, -1), col); }
        }
        q.tint(0);
      }, { leafy: true });
      for (const t of wood.all) {
        if (deck.clk.due()) { yield 'hush: ferns'; deck.clk.go(); }
        if (frn() > 0.6 || !fl.some((q) => Math.hypot(q.x - t[0], q.z - t[1]) < 34)) continue;
        for (let k = 0, n = t[3] ? 3 : 2; k < n; k++) { const a = frn() * TAU, r = t[3] ? frn.f(0.9, 2.4) : frn.f(0.45, 1.2), x = t[0] + Math.cos(a) * r, z = t[1] + Math.sin(a) * r, s = frn.f(0.7, 1.35); if (clearOf(x, z, 0.5)) deck.put('fern', { p: [x, 0, z], yaw: a, scale: [s, s * frn.f(0.7, 1.1), s], color: shade(frn.pick(deck.pal.leaf), t[3] ? frn.f(0.7, 0.95) : frn.f(0.9, 1.25)) }); }
      }
      deck.proto('leaf', (q) => { q.tint(1).blob(0, 0, 0, [0.04, 0.012, 0.026], 0, '#ffffff', { shadeBottom: 0.9 }).tint(0); });
      for (let i = 0, n = Math.round(120 * dens); i < n; i++) { const q = fl[Math.floor(frn() * fl.length)], x = q.x + frn.f(-15, 15), z = clamp(q.z + frn.f(-15, 15), WZ0 + 2, WZ1 - 2), v = frn.f(0.4, 0.62); deck.put('leaf', { p: [x, 14.6, z], yaw: frn() * TAU, scale: frn.f(0.8, 1.5), color: frn.pick(['#c9cf9a', '#b9c58f', '#d6d3a0', '#aebb86']), drift: [frn.f(-0.03, 0.03), -v, frn.f(-0.03, 0.03), 15 / v], phase: frn() }); }
    }
    yield 'hush: ferns';
    // the light of a cloudy evening: most of it on the pale grit, less on the trunks as they go up, none at the ceiling
    for (const [top, pw] of [[5, 0.16], [9, 0.1], [14, 0.07]]) deck.zone({ min: [WX0 - 3, -0.5, WZ0 + 3], max: [WX1 - 3, top, WZ1 + 3], soft: 3, color: '#e6ebe0', power: pw, side: 0.78, under: 0.45 });

    // ---- people on the paths, and everyone standing about
    const walkers = yield* makeWalkers(deck, net, path, rng, Math.round(38 * dens), [0, 1, 2, 3, 4, 5, 6, 7], Math.max(0, net.T.M - 3), net.T.X + 2, (t) => (t < net.T.J ? 7 : t > net.T.K3 ? 11 : 2.6));
    // and in the hall, people going round the aisles to their places and back for more tea
    const aisle = (r) => (TZ(r) + TZ(r + 1)) / 2;
    for (const r of [1, 2]) net.loops.push(roundOf([[103.4, aisle(r - 1)], [130.9, aisle(r - 1)], [130.9, aisle(r)], [103.4, aisle(r)]]));
    net.loops.push(roundOf([[103.4, aisle(2)], [130.9, aisle(2)], [130.9, aisle(3)], [103.4, aisle(3)]]));
    const inHall = yield* makeWalkers(deck, net, path, rng, 7, [8, 9, 10], 40, path.duration, () => 1.9, { slow: 0.8, close: 0.5 });
    for (const w of inHall) walkers.push(w);
    const wBall = new Sphere(frame.point(20, 2, 32), 140), wHerds = [];
    yield 'hush: walkers';
    for (let k = 0; k < 7; k++) {
      const list = walkers.filter((w) => w.k === k);
      if (!list.length) continue;
      const h = herd(scene, personGeo(k, 'stand'), folkMat, list.length, wBall);
      list.forEach((w, i) => h.color(i, w.color));
      wHerds.push({ list, h });
      if (deck.clk.due()) { yield 'hush: walkers'; deck.clk.go(); }
    }
    for (const a of crowd.values()) {
      const geo = personGeo(a.k, 'stand', { child: a.child }), pace = a.kind === 'pace';
      for (const m of instances(geo, pace ? deck.pace : deck.walk, a.items, { frame, cell: 4000, drift: pace, walk: !pace })) scene.add(m);
      if (deck.clk.due()) { yield 'hush: standing'; deck.clk.go(); }
    }
    yield 'hush: people';
    yield* finish(deck);
    scene.add(deck.group);
    if (dbg) console.log(`[hush] ${lettered} slates lettered, ${room.count} at table, ${trees} trees, ${walkers.length} walking`);

    const look = { exposure: 2.3, bloom: 0.2, threshold: 1.0, saturation: 0.9, contrast: 1.03, vignette: 0.5 };
    const eye = new Vector3(), wp = [0, 0, 0];
    const update = (t, dt, camera) => {
      deck.tick(t);
      frame.local(camera.position, eye);
      // the eye opens in the wood, and closes down again for the hall's lamps
      const inHall = smoothstep(90, 106, eye.x), inWood = smoothstep(2.5, 7, eye.z) * (1 - inHall);
      look.exposure = 2.3 + 0.15 * inWood - 0.8 * inHall;
      deck.rig.set({ hazeDensity: 0.0025 + 0.0035 * inWood - 0.0015 * inHall });
      for (const { list, h } of wHerds) {
        for (let i = 0; i < list.length; i++) { const w = list[i]; walkerAt(net, w, t, wp); h.put(i, wp[0], 0.03 * Math.abs(Math.sin(t * 4.6 * w.v + w.ph)), wp[1], wp[2], 0.03, w.s); }
        h.done();
      }
      if (eye.x > 58) room.tick(t, eye.x, eye.y, eye.z);          // from farther off than that nobody can tell a spoon from a bowl
    };
    update(0, 0, { position: path.entry.pos });
    return { scene, path, deck, near: 0.12, far: 520, look, portal: { shape: 'rect', width: 1.6, height: 2.3, rim: false, mist: '#46524b', openFor: 12 }, update };
  },
};
