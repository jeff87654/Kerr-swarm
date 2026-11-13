// Chervil, Herb Row: Station Ring 2 at lamp-dawn, the day Marit Vell comes home (docs/wander-year.md, Day 365).
//
// The same station as every drum's (docs/drum-transport.md, Station rings; worlds/rue_count.js draws Rue's at its
// morning rush): four decks deep, right round the drum, glide trains hung in vacuum berths behind glass on the front
// side, three galleries of cab doors on the back side, boards hung down the middle of the platform. Here it is
// another drum and another hour. The hall's own lamps are still low, and the light on the platform is a block's
// hand lamps: "Wanderers back from their year are met at the station ring by their block and their table"
// (docs/open-drums.md, The calendar), "with hand lamps at lamp-dawn, my table at the front, and Oona with a jar of
// bruise she'd already ground herself. Jory had brought an apple. He cut it crosswise on the platform and held up the
// star" (wander-year.md). The boards are the Ledger (open-drums.md, Chervil): shares, people, the Margin, places, the
// year's births and deaths, guests that night, and the names, each newborn beside the dead whose share they carry.
//
// The flight begins at lamp height in the way the block has left open through itself, under the Ledger's leaf of
// names, comes slowly down it to the clear floor by the capsule's open door, and stops at the star. It rises over the
// lamps to read the Ledger's figures, comes down past a second, smaller knot of lamps round another open door, goes
// on under the old Count as an early train comes to rest behind the glass, crosses to the Ring Counter's hatch
// (docs/eating-out.md, The Ring Counters), and leaves over the first gallery's rail by a cab door, which opens on the
// dawn Oona painted for the day Marit left: "I saw the gold part through the lift glass" (wander-year.md, Day 1).
//
// The Ledger's figures (wander-year.md, Day 365 and Method; open-drums.md, Chervil and Method):
//   shares 200,000,000, people 194,052,000, so the Margin is 5,948,000; guests tonight 409,600; wanderers home 37
//   places 90,000,000, and the drum holds 5,948,000 / (200 / 90) = 2,676,600 of them (the docs' own sum for Booking Day)
//   1,626,000 born and 1,617,000 died a year is one of each every 19.4 s: in the minute of the flight three are
//   born and three die, the last figure of People goes down and up, and the Margin with it the other way
//   the year's births and deaths so far, eight months after Booking Day: about 1,092,000 and 1,085,000
//
// Not canon (the docs give the ring, the homecoming, the hand lamps, the apple, the jar, the Ledger and what it shows,
// the old Count board, the Ring Counter and its sprig; how they lie is this page's own):
//   - the hall itself, as in rue_count.js: four decks open to one another, piers and berths, trains hung from a rail,
//     galleries, escalators, a ceiling of lamps. The docs say only that a ring is a station four decks deep
//   - capsules coming in at round doors in a pier's face, five to a pier, under a plate that says "Capsules, the slow
//     line"; a capsule as a padded tube with one couch. The docs give a capsule of about 200 kg with you in it that
//     docks with the slow line's train, and Marit's leaving from this platform; they do not draw one
//   - that several of the night's thirty-seven came in at this ring in the same hour, each to a knot of lamps
//   - the way left open through the crowd with spare lamps stood on the floor down its edges, where everyone
//     stands, how many came down (nearly seven hundred here of a
//     block of three thousand), people watching from the galleries, the look of a hand lamp, and that some have
//     already gone along for broth or up for a cab home
//   - Marit's bag and coat, Jory's and Oona's clothes, that Oona is small and white-haired (she is 81), the second
//     half of the apple in Jory's other hand
//   - the Ledger's layout as two leaves hung turn about (figures, names), its clock and the hour (the flight begins at
//     06:29:15, and Chervil's lamps come up at 06:30, which is three-nights' canon), the year's births and deaths to
//     date, and "held by the drum" worked for this night
//   - the names on the Ledger: twenty given names and twelve family names of this page's own, paired by chance and
//     lettered small. The docs give no name for it but Marit Vell's, which is not among them
//   - the old Count hung here, on a hanger of its own two along from the figures, dark, its tiles turned blank. The
//     docs hang it "in the Ledger hall beside the Ledger" and do not say where that hall is
//   - the Ring Counter as a hatch under the first gallery, its awning and its slate's wording, "coriander" as the
//     day's sprig (it is the herb Marit took to the slow line's stockpot on Day 7)
//   - trees in tubs and benches down the middle of the platform, the night's cleaning robots still out
//   - the trains' hours, the trades of the other fronts, the wording of the plates, the lock and door numbers, a bank
//     of four cab doors standing proud of the first gallery's wall (the kit's lobby)
//   - that the hall's lamps begin to come up, rose before gold, as the flight ends
import {
  Scene, Mesh, InstancedMesh, DynamicDrawUsage, ShaderMaterial, BufferGeometry, Float32BufferAttribute, CanvasTexture, SRGBColorSpace,
  LinearMipmapLinearFilter, LinearFilter, ClampToEdgeWrapping, RepeatWrapping, Vector3, Vector4, Color, Sphere, DoubleSide, FrontSide,
} from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DRUM, DEG } from '../kit/drum.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, litMaterial, glowPoints } from '../kit/mats.js';
import { Geo, shade, mixc, rgb, fitBounds } from '../kit/geo.js';
import { SKIN } from '../kit/folk.js';
import { makeDeck, finish, frontage, lobby, Run, PALETTES, DOOR_IN } from '../kit/deck.js';
import { makeRng, smoothstep, clamp } from '../core/rng.js';

// ---------------------------------------------------------------- the hall's measures (flat: x spinward, y up, z aft)
// These are rue_count.js's: every drum's station rings are built alike.
const P = 312, PIER = 104;            // round the ring: a pier, then a hall of two berths; and so on
const KS = [-1, 0, 1, 2];             // the stretches modelled: x from -312 to 936
const X0 = KS[0] * P, X1 = (KS[KS.length - 1] + 1) * P;
const MOD = 13;                       // a structural bay
const H = 16;                         // four decks
const ZG = -18.2;                     // the glass between platform and berths
const ZP = -14.4;                     // a pier's face
const ZT = -32.6;                     // the berths' far wall
const ZE = 14;                        // the galleries' edge
const ZF = 20;                        // the fronts under the first gallery
const ZW = 26;                        // the walls of cab doors
const ZB = -4;                        // the row of boards
const TY = 6.2, TZ = -24.6;           // the middle of a train, and of a bore
const BORE = 9.5;
const CAR = 19, GAP = 1.25, PITCH = CAR + GAP;        // a train is five cars: 100 m
const berthX = (k, b) => k * P + (b ? 260 : 156);    // the middle of berth A (the front one, b = 1) or B of hall k
const TAU = Math.PI * 2;

// Capsule doors: five round ports in each pier's face (places along a pier), and which of them stand open tonight.
const CAPS = [26, 39, 52, 65, 78], CR = 0.95, CY = 1.12;
const OPEN = { '-1': [2], 0: [1, 4], 1: [0, 3], 2: [1, 2, 4] };
const DX = CAPS[1];                   // the door Marit came in by, on the pier that begins at x = 0

// Chervil's paint: Oona's River dawn (brown-violet, rose, apricot, cream) worn into plaster, as in chervil_hall.js
const CHERVIL = {
  ...PALETTES.warm,
  walls: ['#dcc3b0', '#d4b6a4', '#e0cbb6', '#cfb39f', '#d9bfae', '#e3cfbd'],
  dado: ['#6e4a56', '#7a5560', '#5f4350', '#84606a'],
  trim: ['#4a2f36', '#5a3a3f', '#3f2a30', '#62443e'],
  doors: ['#8a4f6a', '#3d6f73', '#b9734a', '#5d4a7a', '#7e3f33', '#4f6a5a', '#a8624a', '#3d2a3f'],
  awnings: [['#8a4f6a', '#f1e2cf'], ['#e3925f', '#f6ead6'], ['#3d2a3f', '#e8d6c4'], ['#5d7a62', '#efe2cc'], ['#b9734a', '#f3e6d2']],
  signs: [['#3d2a3f', '#f1dcb0'], ['#5a2f36', '#f3dcc0'], ['#2f3a3f', '#ead9c0'], ['#efe0c8', '#3d2a3f'], ['#3b2f30', '#e9b877'], ['#6a3a42', '#f6e3c4']],
  floor: '#a8968a', strip: '#6e5560', court: '#bba99a', ceiling: '#a88d7f', rib: '#d8c2b0',
  rooms: ['#d9a77a', '#c9a090', '#b98a7a', '#d0b090', '#e0b88a', '#c4a07e', '#b9947a'],
  glass: '#c9d6dc', lamp: '#ffc98a', window: ['#ffc07a', '#ffd6a0', '#ffe2bc', '#f6b070'], shop: '#ffd2a0',
};
const PLASTER = '#d9bfae', PALE = '#e6d2c0', PLUM = '#6e4a56', DARK = '#241a20', STEEL = '#7d7672', IRON = '#3f3840', BRASS = '#b08d4a';
const HAIR = ['#2a1f1a', '#3b2a20', '#5a3d28', '#1c1816', '#7a4a2a', '#d9d4cc', '#b9b4ac', '#8f8a84'];
const WEAR = ['#8a4f6a', '#e3925f', '#3d2a3f', '#c9563c', '#d98c2b', '#e2c14a', '#6f9a3e', '#3f8a7a', '#3a6ea5', '#5b4b9a', '#a34b86',
  '#d7d2c4', '#8c8577', '#2f3b45', '#b5553f', '#e7e1d3', '#7a4a2e', '#4f6f8f', '#c7a36a', '#b97a8a', '#6a7a5a'];

// ---------------------------------------------------------------- the hall's own material
// What repeats every 312 m is modelled once and drawn once for each stretch, turned round the drum's axis to its own
// place (as in rue_count.js). The kit's lit material would light every copy by where the model stands, so a knot of
// lamps at one pier would shine on all of them: this one is told how far round its copy is (uShift), and lights it by
// where it really is. Faces drawn with tint(1) are the hall's own lamps: uLamp is their colour and how far up they are.
const SHELL_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit;
${BEND_PARS}
uniform float uShift;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vLamp;
void main() {
  vec3 p = position, n = normalize(normal);
  vF = p + vec3(uShift, 0.0, 0.0); vFN = n; vLamp = aCol.a;
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vCol = aCol.rgb; vEmit = aEmit;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const shellFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform float uOpacity; uniform vec4 uLamp;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vLamp;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  vec3 e = mix(vec3(vEmit), uLamp.rgb * (vEmit * uLamp.w), step(0.5, vLamp));
  gl_FragColor = vec4(kAir(vCol * (kLight(vW, N, vF, FN) + e), vW), uOpacity);
}`;
function shellMaterial(deck, lamp, shift, glass) {
  return new ShaderMaterial({
    uniforms: {
      ...deck.rig.uniforms, uClip: G.uClip, uBend: { value: new Vector3(deck.frame.a0, deck.frame.z0, deck.frame.floorR) },
      uShift: { value: shift }, uLamp: lamp, uOpacity: { value: glass ? 0.16 : 1 },
    },
    vertexShader: SHELL_VERT, fragmentShader: shellFrag(deck.rig), side: glass ? DoubleSide : FrontSide, transparent: !!glass, depthWrite: !glass,
  });
}

// ---------------------------------------------------------------- walls that look one way, and long things in lengths
const wallS = (g, x0, x1, y0, y1, z, col, e = 0) => g.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, e);      // faces aft (+z)
const wallN = (g, x0, x1, y0, y1, z, col, e = 0) => g.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], col, e);      // faces the front (-z)
const wallE = (g, x, z0, z1, y0, y1, col, e = 0) => g.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], col, e);      // faces spinward (+x)
const wallW = (g, x, z0, z1, y0, y1, col, e = 0) => g.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, e);      // faces anti (-x)
// long things are cut into lengths of 6.5 m, since a long face left to the Geo to cut costs many times the triangles
const lengths = (x0, x1, fn) => { for (let a = x0; a < x1 - 0.01; a += MOD / 2) fn(a, Math.min(x1, a + MOD / 2)); };
const beam = (g, x0, x1, y0, z0, y1, z1, col, opts = {}) => lengths(x0, x1, (a, b) => g.box(a, y0, z0, b, y1, z1, col, { ...opts, skip: (opts.skip || '') + (a > x0 ? 'w' : '') + (b < x1 ? 'e' : '') }));
// a wall facing aft with a round hole in it: rays from the hole's middle, through the corners too, so its outer edge is the rectangle's
function holedWall(g, x0, x1, y0, y1, z, cx, cy, r, col) {
  const as = [];
  for (let i = 0; i < 24; i++) as.push(i * TAU / 24);
  for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) as.push((Math.atan2(y - cy, x - cx) + TAU) % TAU);
  as.sort((a, b) => a - b);
  const out = (a) => {
    const c = Math.cos(a), s = Math.sin(a); let t = 1e9;
    if (c > 1e-6) t = Math.min(t, (x1 - cx) / c); else if (c < -1e-6) t = Math.min(t, (x0 - cx) / c);
    if (s > 1e-6) t = Math.min(t, (y1 - cy) / s); else if (s < -1e-6) t = Math.min(t, (y0 - cy) / s);
    return [cx + c * t, cy + s * t, z];
  };
  for (let i = 0; i < as.length; i++) {
    const a = as[i], b = i === as.length - 1 ? as[0] + TAU : as[i + 1];
    if (b - a < 1e-5) continue;
    g.quad([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z], out(a), out(b), [cx + Math.cos(b) * r, cy + Math.sin(b) * r, z], col);
  }
}
// the brass ring round a capsule door, and the reveal behind it
function portRing(g, cx, cy, z, r, col, dark) {
  const n = 24, Q = (rad, zz, a) => [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, zz];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, b = (i + 1) / n * TAU;
    g.quad(Q(r, z + 0.06, a), Q(r + 0.17, z + 0.06, a), Q(r + 0.17, z + 0.06, b), Q(r, z + 0.06, b), i % 2 ? col : shade(col, 0.9));
    g.quad(Q(r + 0.17, z + 0.06, a), Q(r + 0.17, z, a), Q(r + 0.17, z, b), Q(r + 0.17, z + 0.06, b), shade(col, 0.7));
    g.quad(Q(r, z - 0.5, a), Q(r, z + 0.06, a), Q(r, z + 0.06, b), Q(r, z - 0.5, b), dark);
  }
}

// ---------------------------------------------------------------- a glide train (as rue_count.js draws it)
// One car, its middle at x: a tank of sealed water round a cabin, 19 m long, hung from the rail in the berth's roof.
// Its only windows are two long panes in the aft face, which is the face the platform sees. At this hour few ride.
function drawCar(g, x, fine, rng, tail, head, link) {
  const hull = '#8f939c', aft = '#7c8089', dark = '#35363d', a = x - CAR / 2, b = x + CAR / 2;
  const y0 = TY - 6, y1 = TY + 6, z0 = TZ - 6.5, z1 = TZ + 5.2, pa = a + 3.4, pb = b - 3.4, panes = [[TY - 4.4, TY - 1], [TY + 1, TY + 4.4]];
  g.box(a + 0.6, y0, z0, b - 0.6, y1, z1, hull, { skip: 'ns' });
  wallN(g, a + 0.6, b - 0.6, y0, y1, z0, dark);
  g.box(a, TY - 5.4, TZ - 5.9, a + 0.6, TY + 5.4, TZ + 4.6, dark, { skip: 'e' }).box(b - 0.6, TY - 5.4, TZ - 5.9, b, TY + 5.4, TZ + 4.6, dark, { skip: 'w' });
  for (const rx of [a + 2.9, b - 2.9]) g.box(rx - 0.3, y0 - 0.15, z0 - 0.15, rx + 0.3, y1 + 0.15, z1 + 0.12, dark);
  if (!fine) {
    wallS(g, a + 0.6, b - 0.6, y0, y1, z1, aft);
    for (const [ya, yb] of panes) g.box(pa, ya, z1, pb, yb, z1 + 0.1, '#ffd29a', { emit: 1.3, skip: 'n' });
  } else {
    wallS(g, a + 0.6, b - 0.6, y0, panes[0][0], z1, aft); wallS(g, a + 0.6, b - 0.6, panes[0][1], panes[1][0], z1, aft); wallS(g, a + 0.6, b - 0.6, panes[1][1], y1, z1, aft);
    for (const [ya, yb] of panes) {
      wallS(g, a + 0.6, pa, ya, yb, z1, aft); wallS(g, pb, b - 0.6, ya, yb, z1, aft);
      const zc = z1 - 3.3, water = '#8fc4bb';
      wallS(g, pa, pb, ya, yb, zc, '#e6b98a', 0.55);
      g.floor(pa, zc, pb, z1, ya, water, { emit: 0.16 }).floor(pa, zc, pb, z1, yb, '#ffdcae', { down: true, emit: 0.7 });
      wallE(g, pa, zc, z1, ya, yb, water, 0.16); wallW(g, pb, zc, z1, ya, yb, water, 0.16);
      // two rows of seats facing the pane, the back row raised, and the few who ride this early
      for (let r = 0; r < 2; r++) {
        const sy = ya + 0.5 + r * 0.85, zr = z1 - 1.5 - r * 0.9;
        g.box(pa + 0.15, ya, zr - 0.3, pb - 0.15, sy, zr + 0.28, '#4a3d3a', { skip: 'bn', emit: 0.35 });
        for (let sx = pa + 0.55; sx < pb - 0.4; sx += 0.62) {
          if (rng() > 0.22) continue;
          const cl = WEAR[Math.floor(rng() * WEAR.length)], sk = SKIN[Math.floor(rng() * SKIN.length)], lean = (rng() - 0.5) * 0.08;
          g.box(sx - 0.21, sy, zr - 0.12, sx + 0.21, sy + 0.58, zr + 0.14, cl, { skip: 'bn', emit: 0.55 });
          g.box(sx - 0.11 + lean, sy + 0.62, zr - 0.08, sx + 0.11 + lean, sy + 0.86, zr + 0.13, sk, { skip: 'bn', emit: 0.55 });
        }
      }
    }
  }
  for (let k = 0; k <= 2; k++) { const mx = pa + k * (pb - pa) / 2; g.box(mx - 0.12, TY - 4.6, z1, mx + 0.12, TY + 4.6, z1 + 0.3, dark, { skip: 'n' }); }
  g.box(pa - 0.2, TY - 0.5, z1, pb + 0.2, TY + 0.5, z1 + 0.3, dark, { skip: 'n' });
  // a door at each end of the car, where the docking hatches come to it
  for (const dx of [a + 2, b - 2]) { g.box(dx - 1.0, y0 + 0.05, z1, dx + 1.0, y0 + 2.5, z1 + 0.14, dark, { skip: 'n' }); wallS(g, dx - 0.8, dx + 0.8, y0 + 0.15, y0 + 2.35, z1 + 0.15, '#ffe2bc', 1.0); }
  // the hangers, and their trucks on the rail
  for (const hx of [x - 6, x + 6]) g.box(hx - 0.35, y1, TZ - 0.5, hx + 0.35, y1 + 2.3, TZ + 0.5, dark, { skip: 'tb' }).box(hx - 1.2, y1 + 2.0, TZ - 0.9, hx + 1.2, y1 + 2.95, TZ + 0.9, '#4f5058');
  if (link) g.box(b, TY - 2.6, TZ - 2.2, b + GAP, TY + 2.6, TZ + 2.2, dark, { skip: 'we' });
  for (const dy of [-3.9, 3.9]) {
    if (head) g.box(b, TY + dy - 0.7, TZ - 0.7, b + 0.3, TY + dy + 0.7, TZ + 0.7, '#fff0d0', { emit: 7, skip: 'w' });
    if (tail) g.box(a - 0.3, TY + dy - 0.6, TZ - 0.6, a, TY + dy + 0.6, TZ + 0.6, '#ff5030', { emit: 6, skip: 'e' });
  }
}
// a whole train, modelled with its middle at x = 0: it is stood in its berth by turning it round the drum's axis
function trainGeo(fine, seed) {
  const g = new Geo(), rng = makeRng(seed);
  for (let c = 0; c < 5; c++) drawCar(g, (c - 2) * PITCH, fine, rng, c === 0, c === 4, c < 4);
  return g;
}
// where the docking hatches of a berth stand, for a train whose middle is at x
const hatchesOf = (x) => { const a = []; for (let c = 0; c < 5; c++) for (const s of [-7.5, 7.5]) a.push(x + (c - 2) * PITCH + s); return a; };
// The trains: hall k, berth b, the second it comes to rest (it was there all along if none) and the second it leaves.
// One leaves as the flight begins; one pulls out up the hall as the camera turns to the Ledger; one comes to rest
// behind the glass beside the camera as it goes on up the platform.
const TRAINS = [
  { k: -1, b: 1 }, { k: 0, b: 0, dep: 6 }, { k: 0, b: 0, arr: 44.5 }, { k: 0, b: 1, dep: 27 }, { k: 1, b: 0 }, { k: 1, b: 1, arr: 33 }, { k: 2, b: 0, dep: 38 },
];
// where such a train's middle is at t: it brakes into its berth at 0.8 m/s2 and pulls out at 1 m/s2
function trainX(tr, t) {
  const x = berthX(tr.k, tr.b);
  if (tr.arr !== undefined && t < tr.arr) { const d = tr.arr - t; return x - 0.4 * d * d; }
  if (tr.dep !== undefined && t > tr.dep) { const d = t - tr.dep; return x + 0.5 * d * d; }
  return x;
}

// ---------------------------------------------------------------- one stretch of the hall
// Modelled once, for x from 0 to 312: a pier (0 to 104) and a hall of two berths. rue_count.js has the same parts in
// Rue's paint; here the lamps are faces of their own (tint 1), so that they can stand low and come up.
const BW = 7.6, BH = 3.8, BY = 5.6;                                              // a board, and the height of its middle
const ESC_U = 27, RUN = 4 / Math.tan(30 * DEG), EZ0 = 10.5, EZ1 = 13.65;        // the escalators: where they begin, a flight's run, their two edges
const landing = (L) => [ESC_U + (3 - L) * (RUN + 3), ESC_U + 3 + (3 - L) * (RUN + 3)];      // where deck L + 1's gallery opens onto them
const DOORP = MOD / 3;                                                           // a cab berth's share of kerb
function* shellGeo(pal) {
  const front = new Geo(), back = new Geo(), gl = new Geo(), HA = PIER, HB = P, LAMP = '#ffffff';
  let g = front, t0 = performance.now();
  const due = () => { if (performance.now() - t0 < 5) return false; t0 = performance.now(); return true; };
  // ---- the berth wall: glass from floor to roof, a heavy rail over the hatches, mullions above it
  beam(g, HA, HB, 2.9, ZG - 0.2, 3.3, ZG + 0.2, STEEL);
  beam(g, HA, HB, 8.0, ZG - 0.1, 8.22, ZG + 0.12, STEEL, { skip: 'n' }); beam(g, HA, HB, 12.4, ZG - 0.1, 12.62, ZG + 0.12, STEEL, { skip: 'n' });
  beam(g, HA, HB, 15.0, ZG - 0.3, H, ZG + 0.3, PALE, { skip: 't' });
  for (let u = HA; u <= HB + 0.01; u += MOD / 2) g.box(u - 0.1, 3.3, ZG - 0.14, u + 0.1, 15.0, ZG + 0.16, '#958d8a', { skip: 'tb' });
  lengths(HA, HB, (a, b) => wallS(gl, a, b, 3.3, 15.0, ZG, pal.glass));
  let at = HA;
  for (const hx of [...hatchesOf(156), ...hatchesOf(260)]) {
    if (hx - 1.25 > at) wallS(gl, at, hx - 1.25, 0, 2.9, ZG, pal.glass);
    at = hx + 1.25;
    // a docking hatch: a portal, a bar of light over it, and a short collar out to the car's door
    g.box(hx - 1.25, 0, ZG - 0.3, hx - 0.95, 2.9, ZG + 0.3, IRON, { skip: 'b' }).box(hx + 0.95, 0, ZG - 0.3, hx + 1.25, 2.9, ZG + 0.3, IRON, { skip: 'b' }).box(hx - 0.95, 2.4, ZG - 0.3, hx + 0.95, 2.9, ZG + 0.3, IRON);
    g.tint(1); wallS(g, hx - 0.7, hx + 0.7, 2.52, 2.78, ZG + 0.31, LAMP, 3.0); g.tint(0);
    const zc = ZG - 1.02;
    g.floor(hx - 0.95, zc, hx + 0.95, ZG - 0.3, 0.02, '#544e50').floor(hx - 0.95, zc, hx + 0.95, ZG - 0.3, 2.4, '#ffe2bc', { down: true, emit: 0.7 });
    wallE(g, hx - 0.95, zc, ZG - 0.3, 0, 2.4, '#8f8684', 0.2); wallW(g, hx + 0.95, zc, ZG - 0.3, 0, 2.4, '#8f8684', 0.2);
    g.box(hx - 1.05, -0.1, zc, hx + 1.05, 2.5, ZG - 0.3, IRON, { skip: 'ns' });
    if (due()) yield 'home: berth wall';
  }
  if (at < HB) wallS(gl, at, HB, 0, 2.9, ZG, pal.glass);
  yield 'home: berth wall';
  // ---- the berths: a long hall kept at vacuum, where the trains hang from the rail in its roof
  lengths(HA, HB, (a, b) => {
    g.floor(a, ZT, b, ZG, -0.5, '#2f3238'); wallN(g, a, b, -0.5, 0, ZG, IRON); wallS(g, a, b, -0.5, 15.3, ZT, '#4a4f5a');
    g.floor(a, ZT, b, ZG, 15.3, '#2c2f35', { down: true });
  });
  for (let u = HA + MOD / 2; u < HB; u += MOD) g.box(u - 0.3, -0.5, ZT, u + 0.3, 15.3, ZT + 0.45, '#3d414a', { skip: 'tbn' });
  for (const y of [4.2, 10.6]) beam(g, HA, HB, y, ZT, y + 0.22, ZT + 0.5, '#b9c8ea', { emit: 0.8, skip: 'n' });
  beam(g, HA, HB, TY + 8.3, TZ - 0.35, TY + 8.8, TZ + 0.35, '#51555d', { skip: 't' });
  for (const [u0, u1] of [[HA, HA + 0.8], [HB - 0.8, HB]]) g.box(u0, -0.5, ZT, u1, 15.3, ZT + 0.7, IRON, { skip: 'tb' }).box(u0, -0.5, ZG - 0.5, u1, 15.3, ZG - 0.02, IRON, { skip: 'tb' });
  yield 'home: berths';
  // ---- the pier: solid, with the bores inside it. Five capsule doors in its face, a band of lamps along its head
  // (in upright strips, each the full height, so that the wall over a door meets the wall beside it corner to corner)
  const cuts = [...new Set([...Array.from({ length: 17 }, (_, i) => i * MOD / 2), ...CAPS.flatMap((cx) => [cx - 1.3, cx + 1.3])])].sort((a, b) => a - b);
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1], cx = CAPS.find((c) => Math.abs(c - (a + b) / 2) < 1.3);
    wallS(g, a, b, 2.6, H, ZP, PLASTER); g.box(a, 14.9, ZP, b, 15.3, ZP + 0.2, PALE, { skip: 'nwe' });
    if (cx === undefined) { wallS(g, a, b, 0, 2.6, ZP, PLASTER); g.box(a, 0, ZP, b, 1.15, ZP + 0.05, PLUM, { skip: 'bnwe' }); continue; }
    if (a > cx - 1.31 && a < cx - 1.29) {
      holedWall(g, cx - 1.3, cx + 1.3, 0, 2.6, ZP, cx, CY, CR, PLASTER);
      portRing(g, cx, CY, ZP, CR, BRASS, '#2a2428');
      g.box(cx - 0.75, 0, ZP, cx + 0.75, 0.16, ZP + 0.5, STEEL, { skip: 'bn' });                       // a step up to the sill
      g.box(cx - 0.3, 2.34, ZP, cx + 0.3, 2.54, ZP + 0.05, DARK, { skip: 'n' });                       // where its number and its lamp go
      yield 'home: pier';
    }
    if (due()) yield 'home: pier';
  }
  for (let u = MOD / 2; u < PIER; u += MOD) {
    g.box(u - 0.45, 1.15, ZP, u + 0.45, 14.9, ZP + 0.22, PALE, { skip: 'tbn' });
    if (u + MOD < PIER + 1) { g.tint(1); wallS(g, u + 1.2, u + MOD - 1.2, 12.3, 13.9, ZP + 0.03, LAMP, 1.5); g.tint(0); }
  }
  wallW(g, 0, ZG, ZP, 0, H, PLASTER); wallE(g, PIER, ZG, ZP, 0, H, PLASTER);
  // benches against it, at its two ends
  for (const [u0, u1] of [[4, 22], [81, 100]]) {
    beam(g, u0, u1, 0.42, ZP + 0.06, 0.5, ZP + 0.6, '#6f5244', { skip: 'n' });
    for (let u = u0 + 0.2; u < u1; u += 3) g.box(u - 0.05, 0, ZP + 0.1, u + 0.05, 0.42, ZP + 0.56, IRON, { skip: 'tb' });
  }
  yield 'home: pier';
  // ---- the ceiling: the underside of deck five, a field of lamps between beams
  for (let i = 0; i < 48; i++) {
    const u = i * MOD / 2, zs = u < PIER ? ZP : ZG, w = (ZE - zs) / 5;
    g.floor(u, zs, u + MOD / 2, ZE, H, '#4c3f44', { down: true });
    g.tint(1);
    for (let j = 0; j < 5; j++) g.floor(u + 0.45, zs + j * w + 0.45, u + MOD / 2 - 0.45, zs + (j + 1) * w - 0.45, H - 0.05, LAMP, { down: true, emit: 2.5 });
    g.tint(0);
    if (i % 2 === 0) g.box(u - 0.22, H - 0.75, zs, u + 0.22, H, ZE, '#5f5054', { skip: 't' });
    if (due()) yield 'home: ceiling';
  }
  yield 'home: ceiling';
  // ---- a board every 26 m: its casing and the rods it hangs on (the faces are one mesh for the whole hall)
  for (let u = 0; u < P; u += 2 * MOD) {
    g.box(u - 0.16, BY - BH / 2 - 0.14, ZB - BW / 2 - 0.14, u + 0.16, BY + BH / 2 + 0.14, ZB + BW / 2 + 0.14, DARK);
    for (const z of [ZB - 2.7, ZB + 2.7]) g.box(u - 0.05, BY + BH / 2 + 0.14, z - 0.05, u + 0.05, H - 0.7, z + 0.05, IRON, { skip: 'tb' });
  }
  // ---- the galleries: decks two, three and four, each with its wall of cab doors (a second mesh: see the end)
  g = back;
  for (let L = 1; L <= 4; L++) {
    const y = L * 4, ys = y - 1;
    lengths(0, P, (a, b) => g.floor(a, ZE, b, ZW, ys, '#a8948a', { down: true, emit: 0.1 }));          // the ceiling of the deck below
    g.tint(1);
    for (let u = MOD / 4; u < P; u += MOD / 2) for (const z of [17, 23]) g.floor(u - 0.55, z - 0.2, u + 0.55, z + 0.2, ys - 0.03, LAMP, { down: true, emit: 4 });
    g.tint(0);
    if (L === 4) { beam(g, 0, P, ys, ZE - 0.35, H, ZE, PALE, { skip: 'ts' }); break; }
    beam(g, 0, P, ys, ZE - 0.35, y + 0.12, ZE, PALE, { skip: 's' });                                    // the slab's edge
    // the rail: glass under a steel bar, open where the escalators land
    const gap = landing(L);
    for (const [u0, u1] of [[0, gap[0]], [gap[1], P]]) {
      lengths(u0, u1, (a, b) => wallS(gl, a, b, y + 0.12, y + 1.05, ZE - 0.18, pal.glass));
      beam(g, u0, u1, y + 1.05, ZE - 0.24, y + 1.1, ZE - 0.12, STEEL);
    }
    for (let u = 0; u < P; u += MOD / 4) if (u < gap[0] - 0.1 || u > gap[1] + 0.1) g.box(u - 0.03, y + 0.12, ZE - 0.21, u + 0.03, y + 1.05, ZE - 0.15, STEEL, { skip: 'tb' });
    // the wall of cab doors: one to every 4.3 m of kerb, an amber lamp over a cab that waits, green over one that stands open
    lengths(0, P, (a, b) => { wallN(g, a, b, y, y + 3, ZW, PLASTER); g.box(a, y, ZW - 0.04, b, y + 0.16, ZW, PLUM, { skip: 'bswe' }); });
    for (let i = 0; i < 72; i++) {
      const u = (i + 0.5) * DOORP, open = (i * 7 + L * 3) % 9 === 0;
      wallN(g, u - 0.87, u + 0.87, y, y + 2.32, ZW - 0.03, IRON);
      if (open) { wallN(g, u - 0.75, u + 0.75, y + 0.02, y + 2.2, ZW - 0.05, '#ffd29a', 1.3); wallN(g, u - 0.75, u + 0.75, y + 0.02, y + 0.5, ZW - 0.06, '#7a4f56', 0.5); }
      else for (const s of [-1, 1]) wallN(g, u + (s < 0 ? -0.75 : 0.01), u + (s < 0 ? -0.01 : 0.75), y + 0.02, y + 2.2, ZW - 0.05, i % 3 ? '#6a4a5a' : '#4f5a60');
      wallN(g, u - 0.17, u + 0.17, y + 2.44, y + 2.54, ZW - 0.04, open ? '#b9f0c0' : '#ffb870', 3.2);
      if (due()) yield 'home: gallery';
    }
    yield 'home: gallery';
  }
  // columns under the galleries' edge, floor to roof
  for (let u = MOD / 2; u < P; u += MOD) g.box(u - 0.3, 0, ZE + 0.1, u + 0.3, 15, ZE + 0.7, PLASTER, { skip: 'tb' });
  // ---- the escalators: three flights from deck four to the platform, hung along the galleries' edge
  const zm = (EZ0 + EZ1) / 2, N = 20, dx = RUN / N, dy = 4 / N;
  for (let f = 0; f < 3; f++) {
    const ua = ESC_U + 3 + f * (RUN + 3), ub = ua + RUN, ya = 12 - f * 4, yb = ya - 4;
    g.box(ua - 3, ya - 0.3, EZ0, ua, ya, ZE - 0.35, PALE);
    wallS(gl, ua - 3, ua, ya, ya + 1.0, EZ0 + 0.04, pal.glass); wallW(gl, ua - 2.96, EZ0, ZE - 0.35, ya, ya + 1.0, pal.glass);
    // the steps, and the truss under them
    for (let i = 0; i < N; i++) { const x = ua + i * dx, y = ya - (i + 1) * dy; g.floor(x, EZ0 + 0.1, x + dx, EZ1 - 0.1, y, i % 2 ? '#b0a8a6' : '#a09896'); wallE(g, x, EZ0 + 0.1, EZ1 - 0.1, y, y + dy, '#5f5a5c'); }
    g.quad([ua, ya - 0.75, EZ0], [ub, yb - 0.75, EZ0], [ub, yb - 0.75, EZ1], [ua, ya - 0.75, EZ1], PLUM);
    g.quad([ub, yb - 0.75, EZ0], [ua, ya - 0.75, EZ0], [ua, ya + 0.3, EZ0], [ub, yb + 0.3, EZ0], PALE);
    g.quad([ua, ya - 0.75, EZ1], [ub, yb - 0.75, EZ1], [ub, yb + 0.3, EZ1], [ua, ya + 0.3, EZ1], PALE);
    for (const z of [EZ0 + 0.04, zm, EZ1 - 0.04]) {
      gl.quad([ua, ya + 0.3, z], [ub, yb + 0.3, z], [ub, yb + 0.95, z], [ua, ya + 0.95, z], pal.glass);
      g.tube([[ua - 0.3, ya + 1.0, z], [ua, ya + 0.99, z], [ub, yb + 0.99, z], [ub + 0.3, yb + 1.0, z]], 0.05, 4, '#2f2a2c');
    }
    yield 'home: escalators';
  }
  // two meshes, not one: each is quicker to hand to the card, and the galleries are not drawn when out of sight
  return { solid: [front, back], gl };
}

// ---------------------------------------------------------------- what is made in place
const inPier = (x) => (((x % P) + P) % P) < PIER - 0.01;

// The floors: polished stone in long bands, rose-grey, with a plum line between them; and the galleries'.
function* layFloors(deck) {
  const lane = '#b3a094', mid = '#a59288', edge = '#98857a', line = '#6e5560';
  for (let x = X0; x < X1 - 0.01; x += 8) {
    const x1 = x + 8, pier = inPier(x + 4), zs = pier ? ZP : ZG, f = deck.bucket(x + 4, 0, 'hall').f;
    f.tint(1).floor(x, zs, x1, pier ? -13.7 : -16.75, 0, edge, { emit: 0.75 });
    if (!pier) f.tint(0).floor(x, -16.75, x1, -16.55, 0, BRASS, { emit: 0.3 }).tint(1).floor(x, -16.55, x1, -13.7, 0, edge, { emit: 0.75 });
    f.tint(0).floor(x, -13.7, x1, -13.55, 0, line, { emit: 0.4 });
    f.tint(0.5).floor(x, -13.55, x1, -7.75, 0, lane, { emit: 0.9 });
    f.tint(0).floor(x, -7.75, x1, -7.6, 0, line, { emit: 0.4 });
    f.tint(1).floor(x, -7.6, x1, 3.65, 0, mid, { emit: 0.85 });
    f.tint(0).floor(x, 3.65, x1, 3.8, 0, line, { emit: 0.4 });
    f.tint(0.5).floor(x, 3.8, x1, 9.75, 0, lane, { emit: 0.9 });
    f.tint(0).floor(x, 9.75, x1, 9.9, 0, line, { emit: 0.4 });
    f.tint(1).floor(x, 9.9, x1, ZF + 0.3, 0, edge, { emit: 0.7 });
    for (let L = 1; L <= 3; L++) f.tint(1).floor(x, ZE, x1, ZW, L * 4, mid, { emit: 0.6 });
    f.tint(0);
    if (deck.clk.due()) { yield 'home: floors'; deck.clk.go(); }
  }
}

// The ends of the bores, seen from the berths: a dark tube going back into each pier, with a hoop or two of light.
function* boreStub(deck, x, dir) {
  const c = deck.bucket(x + dir * 12, TZ, 'bore').c;
  for (let i = 0; i < 5; i++) { c.tube([[x + dir * i * 6, TY, TZ], [x + dir * (i + 1) * 6, TY, TZ]], BORE, 20, '#30333a'); yield 'home: bores'; }
  for (const d of [1, 13, 25]) { c.tube([[x + dir * d, TY, TZ], [x + dir * (d + 1), TY, TZ]], BORE - 0.25, 20, '#4a4f58'); if (d > 1) c.tube([[x + dir * (d + 1), TY, TZ], [x + dir * (d + 1.3), TY, TZ]], BORE - 0.2, 20, '#ffbe84', { emit: 0.9 }); }
  yield 'home: bores';
  c.box(Math.min(x, x + dir * 30), TY + 8.3, TZ - 0.35, Math.max(x, x + dir * 30), TY + 8.8, TZ + 0.35, '#51555d');
  const xe = x + dir * 30;
  for (let i = 0; i < 20; i++) { const a0 = i / 20 * TAU, a1 = (i + 1) / 20 * TAU; c.tri([xe, TY, TZ], [xe, TY + Math.sin(a0) * BORE, TZ + Math.cos(a0) * BORE], [xe, TY + Math.sin(a1) * BORE, TZ + Math.cos(a1) * BORE], '#141518'); }
}

// A capsule door, at x on a pier's face. Shut: a round leaf with a dark pane and an amber lamp over it. Open: the leaf
// has gone into the wall, and the capsule stands docked behind the ring, a padded tube with one couch, lit, its lamp green.
function capsuleDoor(deck, x, open, number, hero) {
  const g = deck.bucket(x, ZP, 'caps').g, k = deck.glowK, n = 16, Q = (r, z, a) => [x + Math.cos(a) * r, CY + Math.sin(a) * r, z];
  const zf = ZP - 0.16;
  if (!open) {
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, b = (i + 1) / n * TAU;
      g.quad(Q(0.34, zf + 0.05, a), Q(CR, zf, a), Q(CR, zf, b), Q(0.34, zf + 0.05, b), i % 2 ? '#553a48' : '#4d3442');
      g.tri([x, CY, zf + 0.02], Q(0.34, zf + 0.05, a), Q(0.34, zf + 0.05, b), '#1c1a22', 0.15);
    }
    g.box(x - CR + 0.06, CY - 0.05, zf + 0.03, x - 0.38, CY + 0.05, zf + 0.09, BRASS, { skip: 'n' }).box(x + 0.38, CY - 0.05, zf + 0.03, x + CR - 0.06, CY + 0.05, zf + 0.09, BRASS, { skip: 'n' });
  } else {
    const r = 0.86, z0 = ZP - 0.42, z1 = ZP - 2.7, cols = ['#e6c9a8', '#d6b592'], e = (hero ? 0.62 : 0.5) * k;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, b = (i + 1) / n * TAU;
      g.quad(Q(r, z0, a), Q(CR, z0, a), Q(CR, z0, b), Q(r, z0, b), STEEL);                                       // the capsule's own rim
      for (let j = 0; j < 3; j++) { const za = z0 + (z1 - z0) * j / 3, zb = z0 + (z1 - z0) * (j + 1) / 3; g.quad(Q(r, zb, a), Q(r, za, a), Q(r, za, b), Q(r, zb, b), cols[(i + j) % 2], e); }
      g.tri([x, CY, z1], Q(r, z1, a), Q(r, z1, b), '#cfae94', e * 0.8);
    }
    g.box(x - 0.11, CY + 0.36, z1 + 0.01, x + 0.11, CY + 0.56, z1 + 0.04, '#fff0d0', { emit: 4 * k, skip: 'n' });
    // the couch, its head rest, the straps let go, and the net where a year's things rode
    g.box(x - 0.32, CY - 0.6, z1 + 0.25, x + 0.32, CY - 0.44, z0 - 0.35, '#8a4f6a', { emit: e * 0.6 });
    g.box(x - 0.3, CY - 0.44, z1 + 0.2, x + 0.3, CY + 0.25, z1 + 0.36, '#8a4f6a', { emit: e * 0.6, skip: 'b' }).box(x - 0.16, CY + 0.25, z1 + 0.2, x + 0.16, CY + 0.46, z1 + 0.34, '#7a4560', { emit: e * 0.6 });
    for (const sx of [-0.2, 0.2]) g.box(x + sx - 0.02, CY - 0.44, z1 + 0.6, x + sx + 0.02, CY - 0.42, z0 - 0.5, '#3d2a3f');
    g.box(x - 0.8, CY - 0.1, z1 + 0.5, x - 0.74, CY + 0.3, z0 - 0.6, '#c9b08a', { emit: e * 0.5 });
    deck.glow([{ p: [x, CY + 0.1, ZP - 1.2], color: '#ffd9a6', power: (hero ? 0.8 : 0.6) * k, size: 2.2 }]);
  }
  const lampCol = open ? '#b9f0c0' : '#ffb870';
  g.box(x + 0.16, 2.4, ZP + 0.05, x + 0.24, 2.48, ZP + 0.07, lampCol, { emit: 3.2 * k, skip: 'n' });
  deck.glow([{ p: [x + 0.2, 2.44, ZP + 0.12], color: lampCol, power: 1.1 * k, size: 0.4 }]);
  deck.sign(String(number), { at: [x - 0.08, 2.44, ZP + 0.056], n: [0, 1], h: 0.15, w: 0.3, style: 'plate', font: 'cond', ground: '#241a20', ink: '#f1dcb0' });
}

// Lamps' glows, the plates on the piers and the galleries, and the light itself. Returns what update() changes as
// the hall's lamps come up: the hall's zone and the galleries' lattice.
function* lightAndLetter(deck) {
  const glows = [];
  // at lamp-dawn the hall's ceiling is low and rose; the berths have their work lamps, cool and dim
  const hall = { min: [X0 - 80, -1, ZG + 0.4], max: [X1 + 80, H + 1, ZE], soft: 1.6, color: '#e0a8a0', power: 0.15, side: 0.5, under: 0.5 };
  const iHall = deck.zone(hall);
  deck.zone({ min: [X0 - 80, -5, ZT - 2], max: [X1 + 80, H, ZG - 0.4], soft: 1.2, color: '#9fb0d8', power: 0.34, side: 0.9, under: 0.6 });
  const gal = { origin: [X0 + MOD / 4, 2.94, 17], spacing: [MOD / 2, 6], count: [Math.round((X1 - X0) / (MOD / 2)), 2], storeys: 4, rise: 4, color: '#ffc08a', power: 0.26, reach: 3.6 };
  const iGal = deck.lattice(gal);
  deck.sky({ x0: X0, z0: ZG, x1: X1, z1: ZE, y: H, floor: -0.2, color: '#e9b0a0', power: 0.1 });
  for (const k of KS) {
    const x0 = k * P;
    // amber lamps round each opening into a pier
    for (const xo of [x0 + PIER + 0.9, x0 + P - 0.9]) for (let i = 0; i < 9; i++) for (const z of [ZT + 0.9, ZG - 0.7]) glows.push({ p: [xo, 0.6 + i * 1.75, z], color: '#ffb060', power: 1.6, size: 0.5 });
    // the bar of light over every hatch
    for (const b of [0, 1]) for (const hx of hatchesOf(berthX(k, b))) glows.push({ p: [hx, 2.65, ZG + 0.4], color: '#ffc890', power: 0.7, size: 0.8 });
    // what a pier says: the ring, the numbers of its two locks, and what its five doors are for
    const lock = 5 + 2 * k, dark = '#3d2a3f', cream = '#f1dcb0';
    deck.sign(['Station Ring 2', 'Chervil'], { at: [x0 + 52, 7.6, ZP + 0.06], n: [0, 1], w: 16, h: 3.4, style: 'plate', font: 'cond', font2: 'serif', head: true, ground: '#eadbc6', ink: dark });
    deck.sign('Lock ' + (lock - 1), { at: [x0 + 13, 4.2, ZP + 0.06], n: [0, 1], w: 6.4, h: 1.5, style: 'plate', font: 'cond', ground: dark, ink: cream });
    deck.sign('Lock ' + lock, { at: [x0 + 91, 4.2, ZP + 0.06], n: [0, 1], w: 6.4, h: 1.5, style: 'plate', font: 'cond', ground: dark, ink: cream });
    deck.sign(['Capsules', 'The slow line'], { at: [x0 + 52, 3.72, ZP + 0.06], n: [0, 1], w: 5.6, h: 1.5, style: 'plate', font: 'cond', font2: 'serif', head: true, ground: dark, ink: cream });
    yield 'home: plates';
    for (let i = 0; i < CAPS.length; i++) { capsuleDoor(deck, x0 + CAPS[i], (OPEN[k] || []).includes(i), (k + 4) * 5 + i + 1, k === 0 && i === 1); if (i % 2) yield 'home: doors'; }
    // and the galleries' edges: which deck, and what is there
    for (let L = 1; L <= 3; L++) for (const u of [78, 182, 286]) deck.sign('Deck ' + (L + 1) + '   Cabs', { at: [x0 + u, L * 4 - 0.44, ZE - 0.36], n: [0, -1], w: 4.6, h: 0.62, style: 'plate', font: 'cond', ground: dark, ink: cream });
    // the bores' ends
    yield 'home: plates';
    yield* boreStub(deck, x0 + PIER, -1);
    yield 'home: bores';
    yield* boreStub(deck, x0 + P, 1);
    yield 'home: bores';
  }
  deck.glow(glows);
  return { hall, iHall, gal, iGal };
}

// ---------------------------------------------------------------- the Ledger
// It hangs where Rue hangs its Count, on every hanger down the platform, as two leaves turn about: the figures, then
// the names. One hanger carries the old Count instead, dark, as Chervil has kept it for 340 years.
const SHARES = 200000000, PEOPLE = 194052000, GUESTS = 409600, HOME = 37, PLACES = 90000000, HELD = 2676600, BORN = 1091846, DIED = 1085212;
const DEATHS = [12.3, 22.9, 46.1], BIRTHS = [20.2, 27.6, 57.0];      // seconds into the flight: one of each every 19 s or so
const CLOCK0 = 6 * 3600 + 29 * 60 + 15;                              // the lamps come up at half past six, 45 s into the flight
const LAMPS_UP = 45;
const COUNT_AT = 104;                                                // the hanger that carries the old Count
const INK = '#ffd9a0', DIM = '#c99a6a', GOLD = '#ffc46a', FRAME = '#8a6c3a', GROUND = '#15100e';
const ROW0 = 142, ROWP = 58, CELL = 34, RIGHT = 982;                 // the figures' rows on a face 1024 x 512, and their cells
const NAMES_TOP = 146, NAME_ROWS = 30, NAME_P = 1024 / NAME_ROWS;
const group3 = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const cond = (px) => `500 ${px}px 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif`;
const sans = (px) => `500 ${px}px 'Barlow', 'Segoe UI', Arial, sans-serif`;
const serif = (px) => `400 ${px}px 'Cormorant Garamond', Georgia, serif`;
const track = (cx, px) => { if ('letterSpacing' in cx) cx.letterSpacing = px + 'px'; };
// the names: given and family names of this page's own, paired by chance
const GIVEN = ['Aksel', 'Brida', 'Corin', 'Edda', 'Embla', 'Finn', 'Greta', 'Halle', 'Ilse', 'Jens', 'Karin', 'Lorne', 'Maeve', 'Nils', 'Orla', 'Perrin', 'Runa', 'Signe', 'Tam', 'Ysolde'];
const FAMILY = ['Marrow', 'Orrin', 'Halloran', 'Voss', 'Sedge', 'Tarn', 'Lind', 'Brandt', 'Aske', 'Rook', 'Winter', 'Holm'];

function ledgerHead(cx, sub) {
  cx.fillStyle = GROUND; cx.fillRect(0, 0, 1024, 512);
  cx.strokeStyle = FRAME; cx.lineWidth = 4; cx.strokeRect(12, 12, 1000, 488);
  cx.textBaseline = 'middle'; cx.textAlign = 'left'; cx.fillStyle = INK; cx.font = serif(62); track(cx, 8);
  cx.fillText('THE LEDGER', 44, 60);
  const w = cx.measureText('THE LEDGER').width;
  cx.fillStyle = DIM; cx.font = cond(27); track(cx, 3);
  cx.fillText(sub, 44 + w + 30, 65);
  cx.fillStyle = FRAME; cx.fillRect(44, 100, 936, 3);
}
// a number in cells, as lamp letters stand: its last figure ends at RIGHT
function cells(cx, text, y, ink) {
  cx.font = sans(56); track(cx, 0); cx.textAlign = 'center'; cx.fillStyle = ink;
  let x = RIGHT;
  for (let i = text.length - 1; i >= 0; i--) { const ch = text[i], w = ch === ',' ? CELL / 2 : CELL; cx.fillText(ch, x - w / 2, y + (ch === ',' ? -4 : 3)); x -= w; }
}
// the leaf of figures
function paintFigures(cx, people, born, died, secs) {
  ledgerHead(cx, 'STATION RING 2');
  const hh = Math.floor(secs / 3600) % 24, mm = Math.floor(secs / 60) % 60, ss = Math.floor(secs) % 60, two = (v) => String(v).padStart(2, '0');
  const clock = two(hh) + ':' + two(mm) + ':' + two(ss);
  cx.textAlign = 'center'; cx.fillStyle = INK; cx.font = sans(38); track(cx, 0);
  for (let i = 0; i < clock.length; i++) cx.fillText(clock[i], RIGHT - (clock.length - i) * 22 + 11, 64);
  const rows = [['SHARES', SHARES], ['PEOPLE', people], ['THE MARGIN', SHARES - people], ['GUESTS TONIGHT', GUESTS], ['WANDERERS HOME', HOME]];
  rows.forEach(([label, n], r) => {
    const y = ROW0 + r * ROWP;
    cx.textAlign = 'left'; cx.fillStyle = r === 4 ? GOLD : DIM; cx.font = cond(44); track(cx, 5);
    cx.fillText(label, 44, y + 2);
    cells(cx, group3(n), y, r === 4 ? GOLD : INK);
  });
  cx.fillStyle = FRAME; cx.fillRect(44, 405, 936, 2);
  cx.font = cond(29); track(cx, 3); cx.fillStyle = DIM;
  cx.textAlign = 'left'; cx.fillText('PLACES ' + group3(PLACES), 44, 434); cx.fillText('BORN THIS YEAR ' + group3(born), 44, 472);
  cx.textAlign = 'right'; cx.fillText('HELD BY THE DRUM ' + group3(HELD), 980, 434); cx.fillText('DIED THIS YEAR ' + group3(died), 980, 472);
  track(cx, 0);
}
// what does not change: the names' leaf without its names (the top half of a canvas 1024 square), and the old Count (the
// bottom half). A generator, like paintNames(): a typeface's first letters are slow to come, and each has a step to itself
function* paintStill(cx) {
  ledgerHead(cx, 'THE NAMES');
  yield 'home: the names';
  cx.font = cond(22); track(cx, 3); cx.fillStyle = DIM; cx.textAlign = 'left';
  cx.fillText('BORN', 44, 124); cx.fillText('CARRYING THE SHARE OF', 262, 124); cx.fillText('HOUSEHOLDER', 540, 124); cx.fillText('IN THE PLACE OF', 770, 124);
  cx.fillStyle = FRAME; cx.fillRect(44, 140, 936, 2); cx.fillRect(511, 110, 2, 382);
  yield 'home: the names';
  // the Count as Rue still hangs it (rue_count.js), its lamps off and its tiles turned to their blank side
  cx.save(); cx.translate(0, 512);
  cx.fillStyle = '#39342d'; cx.fillRect(0, 0, 1024, 512);
  cx.strokeStyle = '#8a8272'; cx.lineWidth = 4; cx.strokeRect(12, 12, 1000, 488);
  cx.textAlign = 'left'; cx.fillStyle = '#e6dcc6'; cx.font = serif(64); track(cx, 8); cx.fillText('THE COUNT', 44, 66);
  cx.fillStyle = '#8a8272'; cx.fillRect(44, 108, 936, 3);
  cx.restore();
  yield 'home: the old Count';
  cx.save(); cx.translate(0, 512);
  ['PEOPLE', 'SHARES', 'OVER'].forEach((label, r) => {
    const y = 164 + r * 102;
    cx.textAlign = 'left'; cx.fillStyle = '#c4baa4'; cx.font = cond(52); track(cx, 5); cx.fillText(label, 44, y + 2);
    for (let i = 0; i < 11; i++) { const x = 934 - (10 - i) * 54; cx.fillStyle = '#6f685c'; cx.fillRect(x, y - 46, 50, 92); cx.fillStyle = '#39342d'; cx.fillRect(x, y - 1, 50, 2); }
  });
  cx.restore(); track(cx, 0);
}
// the names themselves, on a strip 1024 square that goes round and round behind the leaf
function* paintNames(cx, rng) {
  cx.fillStyle = '#000000'; cx.fillRect(0, 0, 1024, 1024);
  yield 'home: the names';
  for (let r = 0; r < NAME_ROWS; r++) for (let h = 0; h < 2; h++) {
    if (h === 0 && r % 2 === 0) { if (r) yield 'home: the names'; cx.textBaseline = 'middle'; cx.textAlign = 'left'; cx.font = cond(25); track(cx, 1); }
    const y = (r + 0.5) * NAME_P, fam = rng.pick(FAMILY), a = rng.pick(GIVEN);
    // a child is often named for the dead whose share it carries; a householder keeps their own name
    const b = h === 0 && rng() < 0.5 ? a : rng.pick(GIVEN), fam2 = h === 1 && rng() < 0.4 ? rng.pick(FAMILY) : fam;
    cx.fillStyle = INK; cx.fillText(a + ' ' + fam, h ? 540 : 44, y);
    cx.fillStyle = '#b08a60'; cx.fillText(b + ' ' + fam2, h ? 770 : 262, y);
  }
  track(cx, 0);
}

const BOARD_VERT = /* glsl */`
attribute float aPage;
${BEND_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vUv; varying float vPage;
void main() {
  vec3 p = position, n = normal;
  vF = p; vFN = n; vUv = uv; vPage = aPage;
  kBend(p, n);
  vW = p; vN = n;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const boardFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tFig, tNames, tStill; uniform float uGlow, uFlash, uPulse, uScroll; uniform vec4 uTickA, uTickB, uHome;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec2 vUv; varying float vPage;
${rig.glsl}
float kIn(vec4 r, vec2 q) { return step(r.x, q.x) * step(q.x, r.z) * step(r.y, q.y) * step(q.y, r.w); }
void main() {
  ${CLIP_FRAG}
  // all three leaves are read, and one is kept: a texture must not be read inside a branch
  vec3 fig = texture2D(tFig, vUv).rgb * (1.0 + uFlash * (kIn(uTickA, vUv) + kIn(uTickB, vUv)) + uPulse * kIn(uHome, vUv));
  float win = smoothstep(${(NAMES_TOP / 512).toFixed(4)}, ${((NAMES_TOP + 14) / 512).toFixed(4)}, vUv.y) * smoothstep(0.962, 0.938, vUv.y);
  vec3 nam = texture2D(tStill, vec2(vUv.x, vUv.y * 0.5)).rgb + texture2D(tNames, vec2(vUv.x, (vUv.y * 512.0 - ${NAMES_TOP.toFixed(1)}) / 1024.0 + uScroll)).rgb * win;
  vec3 old = texture2D(tStill, vec2(vUv.x, 0.5 + vUv.y * 0.5)).rgb;
  float isOld = step(1.5, vPage);
  vec3 c = mix(mix(fig, nam, step(0.5, vPage)), old, isOld);
  vec3 L = kLight(vW, normalize(vN), vF, normalize(vFN));
  gl_FragColor = vec4(kAir(c * (L * mix(0.3, 1.8, isOld) + uGlow * (1.0 - isOld)), vW), 1.0);
}`;

// Every face in the hall is one mesh. set(t, age) turns the figures: t is the flight's seconds, age the seconds since
// the world was first drawn (it is watched through the last world's opening before the flight begins).
function* ledgerBoards(deck, xs) {
  const canvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  const texOf = (cv, wrap) => {
    const tex = new CanvasTexture(cv);
    tex.colorSpace = SRGBColorSpace; tex.flipY = false; tex.wrapS = ClampToEdgeWrapping; tex.wrapT = wrap ? RepeatWrapping : ClampToEdgeWrapping;
    tex.minFilter = LinearMipmapLinearFilter; tex.magFilter = LinearFilter; tex.generateMipmaps = true; tex.anisotropy = 8;
    return tex;
  };
  const cvF = canvas(1024, 512), cxF = cvF.getContext('2d'), cvS = canvas(1024, 1024), cvN = canvas(1024, 1024);
  const tFig = texOf(cvF), tStill = texOf(cvS), tNames = texOf(cvN, true);
  const paintRest = () => { for (const gen of [paintStill(cvS.getContext('2d')), paintNames(cvN.getContext('2d'), makeRng('ledger-names'))]) for (const step of gen) { /* all at once: it is quick once the type is in */ } tStill.needsUpdate = true; tNames.needsUpdate = true; };
  yield 'home: canvases';
  yield* paintStill(cvS.getContext('2d')); tStill.needsUpdate = true;
  yield 'home: the old Count';
  yield* paintNames(cvN.getContext('2d'), makeRng('ledger-names')); tNames.needsUpdate = true;
  yield 'home: the names';
  const pos = [], nrm = [], uv = [], page = [], y0 = BY - BH / 2, y1 = BY + BH / 2, za = ZB - BW / 2, zb = ZB + BW / 2;
  for (const x of xs) for (const sd of [-1, 1]) {
    // the face that looks anti (sd = -1) is read by someone walking spinward, whose right hand is aft
    const xf = x + sd * 0.17, l = sd < 0 ? za : zb, r = sd < 0 ? zb : za, pg = x === COUNT_AT ? 2 : Math.abs(Math.round(x / 26)) % 2;
    const q = [[xf, y0, l, 0, 1], [xf, y0, r, 1, 1], [xf, y1, r, 1, 0], [xf, y1, l, 0, 0]];
    for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(q[i][0], q[i][1], q[i][2]); nrm.push(sd, 0, 0); uv.push(q[i][3], q[i][4]); page.push(pg); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setAttribute('aPage', new Float32BufferAttribute(page, 1));
  const band = (r, n) => new Vector4((RIGHT - n * CELL - 3) / 1024, (ROW0 + r * ROWP - 31) / 512, (RIGHT + 3) / 1024, (ROW0 + r * ROWP + 31) / 512);
  const mat = new ShaderMaterial({
    uniforms: {
      ...deck.rig.uniforms, uClip: G.uClip, uBend: { value: new Vector3(deck.frame.a0, deck.frame.z0, deck.frame.floorR) },
      tFig: { value: tFig }, tNames: { value: tNames }, tStill: { value: tStill }, uGlow: { value: 1.25 }, uFlash: { value: 0 }, uPulse: { value: 0 }, uScroll: { value: 0 },
      uTickA: { value: band(1, 2) }, uTickB: { value: band(2, 2) }, uHome: { value: band(4, 2) },
    },
    vertexShader: BOARD_VERT, fragmentShader: boardFrag(deck.rig),
  });
  const mesh = fitBounds(new Mesh(g, mat), deck.frame);
  mesh.renderOrder = 1;
  let shownP = -1, shownS = -1;
  const set = (t, age) => {
    let people = PEOPLE, born = BORN, died = DIED, last = -99;
    for (const d of DEATHS) if (t >= d) { people--; died++; last = Math.max(last, d); }
    for (const b of BIRTHS) if (t >= b) { people++; born++; last = Math.max(last, b); }
    const secs = Math.floor(CLOCK0 + t);
    if (people !== shownP || secs !== shownS) { paintFigures(cxF, people, born, died, secs); tFig.needsUpdate = true; shownP = people; shownS = secs; }
    // a figure that has just turned is bright for a moment, on every leaf at once; tonight's wanderers breathe
    mat.uniforms.uFlash.value = 2.4 * Math.max(0, 1 - (t - last) / 0.9);
    mat.uniforms.uPulse.value = 0.35 + 0.35 * Math.sin(age * 2.1);
    mat.uniforms.uScroll.value = (age * 15 / 1024) % 1;
  };
  yield 'home: the leaves';
  set(0, 0);
  // the page's own type may not have arrived when this is first painted: letter it again when it has
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!tFig.userData.gone) { paintRest(); shownS = -1; } });
  tFig.addEventListener('dispose', () => { tFig.userData.gone = true; });
  return { mesh, set };
}

// ---------------------------------------------------------------- people of this page's own
// The kit's figures are one piece. These are seen from two or three metres with lamps in their hands, so they have
// arms, hands and hair (chervil_hall.js draws its diners the same way). One is modelled standing at the origin facing
// +z, about 1.7 m tall. o: skin, hair, legs (colours); long, bun, bald (hair); coat (a long coat's skirt); arms:
// [[elbow, hand], [elbow, hand]] (left, right); glow: how far its front is lit by the lamp it carries; head: 1 for a
// rounder head; eyes; flush (a face gone red); turn (the head's own yaw: who it looks at).
const ARM_DOWN = [[[-0.25, 1.1, 0.02], [-0.24, 0.84, 0.06]], [[0.25, 1.1, 0.02], [0.24, 0.84, 0.06]]];
// The kit's blob() winds its faces inward, so that what is seen of a ball is the inside of its far half, and anything
// within it shows through. Drawn through a mirror its faces turn outward: a head then hides what is behind its face.
const ball = (g, x, y, z, r, detail, col, opts) => { g.at(0, 0, 0, 0, [-1, 1, 1]); g.blob(-x, y, z, r, detail, col, opts); g.pop(); };
function drawPerson(g, o = {}) {
  const skin = o.skin || SKIN[1], hair = o.hair || HAIR[0], legs = o.legs || '#3a3540', e = o.glow === undefined ? 0.24 : o.glow;
  const arm = (sd, el, hd) => {
    g.tint(1).tube([[sd * 0.21, 1.38, 0], el], 0.052, 4, '#ffffff', { smooth: false, emit: e }).tube([el, hd], 0.046, 4, '#ffffff', { smooth: false, emit: e });
    g.tint(0).cube(hd[0], hd[1], hd[2], 0.07, 0.07, 0.085, skin, { emit: e * 1.5 });
  };
  g.tint(0).box(-0.15, 0.05, -0.09, -0.02, 0.86, 0.09, legs, { skip: 'b', emit: e * 0.3 }).box(0.02, 0.05, -0.09, 0.15, 0.86, 0.09, legs, { skip: 'b', emit: e * 0.3 });
  g.box(-0.16, 0, -0.1, -0.01, 0.07, 0.17, '#2a2422', { skip: 'b' }).box(0.01, 0, -0.1, 0.16, 0.07, 0.17, '#2a2422', { skip: 'b' });
  g.tint(1);
  if (o.coat) g.cyl(0, 0.4, 0, 0.27, 0.2, 0.48, 6, '#e2e2e2', { smooth: false, squash: [1, 0.74], emit: e * 0.6, cap: false });
  g.cyl(0, 0.8, 0, 0.21, 0.18, 0.6, 6, '#ffffff', { smooth: false, squash: [1, 0.72], emit: e });
  g.box(-0.24, 1.32, -0.08, 0.24, 1.43, 0.09, '#ffffff', { emit: e });
  const A = o.arms || ARM_DOWN;
  arm(-1, A[0][0], A[0][1]); arm(1, A[1][0], A[1][1]);
  const hy = 1.62, hz = 0.02, face = o.flush ? mixc(skin, '#c8463c', 0.42) : skin, d = o.head || 0;
  g.tint(0).cyl(0, hy - 0.2, hz - 0.01, 0.05, 0.05, 0.1, 5, skin, { smooth: false, emit: e });
  g.at(0, 0, 0, o.turn || 0);
  ball(g, 0, hy, hz, [0.112, 0.132, 0.12], d, face, { shadeBottom: 0.82, seed: 3, emit: e * 1.3 });
  if (o.bald) ball(g, 0, hy + 0.07, hz - 0.05, [0.1, 0.07, 0.1], 0, hair, { shadeBottom: 0.95, seed: 5, emit: e * 0.5 });
  else {
    ball(g, 0, hy + 0.07, hz - 0.045, [0.124, 0.085, 0.112], d, hair, { shadeBottom: 0.95, seed: 7, lump: 0.15, emit: e * 0.5 });
    g.box(-0.1, hy - (o.long ? 0.16 : 0.07), hz - 0.13, 0.1, hy + 0.06, hz - 0.06, hair, { skip: 't', emit: e * 0.5 });
    if (o.bun) ball(g, 0, hy + 0.11, hz - 0.15, 0.062, 0, hair, { shadeBottom: 0.9, emit: e * 0.5 });
  }
  if (o.eyes) for (const sx of [-0.043, 0.043]) g.box(sx - 0.013, hy + 0.012, hz + 0.09, sx + 0.013, hy + 0.032, hz + 0.117, '#2a1f1a', { skip: 'n' });
  g.pop();
}
// a hand lamp, hanging by its bail from a hand at (x, y, z): cap, glass, foot. Its light is 0.19 m under the hand
const LAMP_DROP = 0.19;
function drawLamp(g, x, y, z, col) {
  g.tint(0).box(x - 0.004, y - 0.11, z - 0.03, x + 0.004, y - 0.02, z + 0.03, '#4a4032');
  g.cyl(x, y - 0.13, z, 0.03, 0.05, 0.03, 6, '#7a6a48', { smooth: false });
  g.cyl(x, y - 0.25, z, 0.05, 0.05, 0.12, 6, col, { smooth: false, emit: 2.4, cap: false });
  g.cyl(x, y - 0.275, z, 0.04, 0.05, 0.025, 6, '#7a6a48', { smooth: false, base: true });
}
// how a lamp is carried: the arms, and the hand it hangs from
const CARRY = {
  chest: { arms: [ARM_DOWN[0], [[0.27, 1.14, 0.12], [0.16, 1.3, 0.34]]], hand: [0.16, 1.3, 0.34] },
  high: { arms: [ARM_DOWN[0], [[0.33, 1.68, 0.06], [0.3, 2.0, 0.12]]], hand: [0.3, 2.0, 0.12] },
  low: { arms: [ARM_DOWN[0], [[0.27, 1.1, 0.04], [0.27, 0.86, 0.1]]], hand: [0.27, 0.86, 0.1] },
  both: { arms: [[[-0.25, 1.12, 0.12], [-0.05, 1.2, 0.32]], [[0.25, 1.12, 0.12], [0.05, 1.2, 0.32]]], hand: [0, 1.2, 0.33] },
};
const LOOKS = [
  { skin: SKIN[1], hair: HAIR[0] }, { skin: SKIN[3], hair: HAIR[1], long: true }, { skin: SKIN[0], hair: HAIR[4], bun: true, coat: true },
  { skin: SKIN[2], hair: HAIR[5], old: true }, { skin: SKIN[5], hair: HAIR[6], bun: true, coat: true, old: true }, { skin: SKIN[4], hair: HAIR[3], legs: '#4a3f38' },
];
const LAMP_COLS = ['#ffc888', '#ffb868', '#ffd6a0', '#ffac5c'];
function lampBearer(look, pose, i) {
  const g = new Geo(), c = CARRY[pose];
  drawPerson(g, { ...look, arms: c.arms });
  drawLamp(g, c.hand[0], c.hand[1], c.hand[2], LAMP_COLS[i % LAMP_COLS.length]);
  return { geo: g.build(), lamp: [c.hand[0], c.hand[1] - LAMP_DROP, c.hand[2]], col: LAMP_COLS[i % LAMP_COLS.length], old: !!look.old, pose };
}

// Half an orchard apple, cut crosswise: the cut face toward +z, its middle at the origin. Pale flesh, the red skin's
// edge round it, and the five seed cells that make the star (eating-out.md, Manners: "Cut it crosswise, show the star").
function drawApple(g, R = 0.046) {
  const n = 20, at = (r, a, z = 0) => [Math.cos(a) * r, Math.sin(a) * r, z], flesh = '#f8efcc', e = 0.5;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, b = (i + 1) / n * TAU;
    g.tri([0, 0, 0], at(R * 0.55, a), at(R * 0.55, b), '#f1e7b8', e);
    g.quad(at(R * 0.55, a), at(R * 0.93, a), at(R * 0.93, b), at(R * 0.55, b), flesh, e);
    g.quad(at(R * 0.93, a), at(R, a), at(R, b), at(R * 0.93, b), '#a8242a', 0.25);
  }
  // the star: five cells of the core, each with its seed
  for (let k = 0; k < 5; k++) {
    const a = Math.PI / 2 + k * TAU / 5, z = 0.0012, side = (r, w) => [at(Math.hypot(r, w), a + Math.atan2(w, r), z), at(Math.hypot(r, w), a - Math.atan2(w, r), z)];
    const [l1, r1] = side(R * 0.3, R * 0.125);
    g.quad(at(R * 0.07, a, z), r1, at(R * 0.62, a, z), l1, '#b58d48', 0.3);
    const [l2, r2] = side(R * 0.33, R * 0.062);
    g.quad(at(R * 0.2, a, z * 2), r2, at(R * 0.5, a, z * 2), l2, '#3a2212', 0.05);
  }
  // the skin: a dome behind the cut, dimpled at its pole, streaked as an apple is
  g.rot('x', -Math.PI / 2);
  const prof = [[R, 0], [R * 0.98, R * 0.3], [R * 0.84, R * 0.62], [R * 0.52, R * 0.85], [R * 0.17, R * 0.9], [R * 0.04, R * 0.78]];
  for (let i = 0; i < 10; i++) g.lathe(0, 0, 0, prof, 2, ['#b3262a', '#c0392f', '#a11f26', '#c95a38', '#b3262a'][i % 5], { arc: [i * TAU / 10, (i + 1) * TAU / 10], emit: 0.12 });
  g.pop();
}

// A crowd of one kind drawn as one instanced mesh whose copies the world moves itself (as in chervil_hall.js).
// items: { p, yaw, color, scale }. put(i, x, y, z, yaw, lean, scale) writes copy i: yaw about up, then a lean forward.
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
  });
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.boundingSphere = n ? new Sphere().setFromPoints(pts) : new Sphere(new Vector3(), 1);
  m.boundingSphere.radius += 3;
  group.add(m);
  return { mesh: m, items, put, done() { m.instanceMatrix.needsUpdate = true; } };
}

// The three in the clear space, and the wanderers at the other doors. Each is a geometry of its own.
function joryGeo() {
  const g = new Geo();
  drawPerson(g, { skin: SKIN[1], hair: HAIR[1], head: 1, eyes: true, flush: true, turn: -0.42, glow: 0.12, legs: '#3d3340',
    arms: [[[-0.27, 1.12, 0.08], [-0.19, 1.04, 0.3]], [[0.3, 1.5, 0.2], [0.23, 1.76, 0.4]]] });
  // the star, held up and a little down toward whoever is looking; the other half in his other hand, cut face up
  g.at(0.23, 1.8, 0.455); g.rot('x', 0.2); drawApple(g); g.pop(); g.pop();
  g.at(-0.19, 1.085, 0.3); g.rot('x', -1.25); drawApple(g); g.pop(); g.pop();
  return g.build();
}
function maritGeo() {
  const g = new Geo();
  drawPerson(g, { skin: SKIN[1], hair: HAIR[2], bun: true, coat: true, head: 1, eyes: true, turn: -0.4, glow: 0.12, legs: '#4a3f38',
    arms: [[[-0.24, 1.16, 0.14], [-0.07, 1.47, 0.16]], [[0.24, 1.16, 0.14], [0.07, 1.47, 0.16]]] });
  // a year's bag across her back, on its strap
  g.tint(0); ball(g, -0.04, 1.02, -0.22, [0.2, 0.3, 0.13], 0, '#3d6f73', { shadeBottom: 0.7, seed: 2, emit: 0.08 });
  g.quad([-0.2, 0.86, 0.1], [-0.13, 0.84, 0.115], [0.22, 1.4, 0.1], [0.15, 1.42, 0.085], '#c9b08a', 0.15);
  return g.build();
}
function oonaGeo() {
  const g = new Geo();
  drawPerson(g, { skin: SKIN[5], hair: HAIR[5], bun: true, coat: true, head: 1, eyes: true, turn: 0.35, glow: 0.12, legs: '#3a3540',
    arms: [[[-0.25, 1.14, 0.12], [-0.055, 1.22, 0.3]], [[0.25, 1.14, 0.12], [0.055, 1.22, 0.3]]] });
  // the jar of bruise: brown-violet, ground by hand, under a cork
  g.tint(0).cyl(0, 1.2, 0.31, 0.036, 0.036, 0.07, 8, '#6a4263', { emit: 0.7 }).cyl(0, 1.27, 0.31, 0.03, 0.03, 0.018, 8, '#c9a878', { emit: 0.3 });
  return g.build();
}
function wandererGeo() {
  const g = new Geo();
  drawPerson(g, { skin: SKIN[3], hair: HAIR[0], long: true, coat: true, glow: 0.3, arms: [[[-0.3, 1.2, 0.14], [-0.3, 1.16, 0.4]], [[0.3, 1.2, 0.14], [0.3, 1.16, 0.4]]] });
  g.tint(0); ball(g, 0, 1.02, -0.22, [0.2, 0.3, 0.13], 0, '#7a5a3a', { shadeBottom: 0.7, seed: 4, emit: 0.08 });
  return g.build();
}

// ---------------------------------------------------------------- the block on the platform
// A block is some 3,000 people; nearly seven hundred of this one have come down. They stand a pace and a half apart
// over sixty metres of platform in front of the pier, a way left open through them, and a clear floor by the door. Their lamps are a lattice of light (the kit's, 1.3 m up, a lamp at every corner of the cells
// they stand in), a soft zone over it for what the lamps do together, and one small glow for each lamp carried.
const TH = 35 * DEG, AX = [-Math.cos(TH), Math.sin(TH)];        // the open way runs out from the door along this (x, z)
const CELLW = 1.25, GX0 = 12, GNX = 48, GZ0 = ZP + 0.9, GNZ = 18;        // the cells: x from 12 to 72, z from -13.5 to 9
const A0 = [DX + 2.6, ZP];                                     // its foot, on the pier's face beside the door: Jory stands on it, the door at his shoulder
const JORY = [A0[0] + AX[0] * 2.6, A0[1] + AX[1] * 2.6], YAW_J = Math.atan2(AX[0], AX[1]);
const along = (x, z) => (x - A0[0]) * AX[0] + (z - A0[1]) * AX[1], across = (x, z) => Math.abs((x - A0[0]) * AX[1] - (z - A0[1]) * AX[0]);

function* theBlock(deck, scene, ctx, rng, folkMat, queue, tubs) {
  const D = ctx.density, frame = deck.frame, kinds = [];
  for (let li = 0; li < LOOKS.length; li++) { ['chest', 'high', 'low'].forEach((pose, pi) => kinds.push(lampBearer(LOOKS[li], pose, li + pi))); yield 'home: lamp bearers'; }
  kinds.push(lampBearer(LOOKS[3], 'both', 1), lampBearer(LOOKS[4], 'both', 2));
  yield 'home: lamp bearers';
  const young = [0, 1, 2, 3, 4, 5, 6, 7, 8, 15, 16, 17], old = [9, 10, 11, 12, 13, 14, 18, 19], folk = [];
  // someone with a lamp at (x, z), looking toward (tx, tz)
  const add = (x, y, z, tx, tz, o = {}) => {
    const elder = o.old === undefined ? rng() < 0.3 : o.old, child = !elder && rng() < (o.child === undefined ? 0.09 : o.child);
    let kind = rng.pick(elder ? old : young);
    if (!o.pose) o.pose = rng.pick(['high', 'high', 'high', 'chest', 'chest', 'low']);
    // those who stand far from the block (at the Counter, at the cabs) are of a few kinds only, in herds of their own
    const pool = o.group ? [0, 2, 5, 7, 11, 13, 17] : kinds.map((k, i) => i);
    { const want = pool.filter((i) => kinds[i].pose === o.pose && (o.group || kinds[i].old === elder)); kind = want.length ? rng.pick(want) : o.group ? rng.pick(pool) : kind; }
    folk.push({ x, y, z, kind, group: o.group || 0, yaw0: Math.atan2(tx - x, tz - z) + (o.turn || 0) + rng.f(-0.2, 0.2), s: child ? rng.f(0.6, 0.74) : rng.f(0.93, 1.06) * (elder ? 0.96 : 1), color: rng.pick(WEAR),
      ph: rng() * TAU, w: rng.f(0.22, 0.55), turn: rng.sign() * rng.f(0.25, 0.7) * (o.still ? 0.3 : 1), talk: rng() < 0.55 ? rng.f(0.5, 1) : 0.12, ph2: rng() * TAU, w2: rng.f(0.3, 0.8) });
  };
  // the block: every cell but the clear floor by the door and the way through, thinning toward its two ends
  const keep = Math.min(1, 0.5 + 0.5 * D);
  let t0 = performance.now();
  for (let i = 0; i < GNX; i++) for (let j = 0; j < GNZ; j++) {
    if (j === 0 && performance.now() - t0 > 5) { yield 'home: the block stands'; t0 = performance.now(); }
    const x = GX0 + (i + 0.5) * CELLW + rng.f(-0.4, 0.4), z = GZ0 + (j + 0.5) * CELLW + rng.f(-0.4, 0.4), r = Math.hypot(x - DX - 1.2, z - ZP), a = along(x, z), w = across(x, z);
    if (r < 4.9 || (a > 3 && w < (a > 23 ? 2.4 : 1.8))) continue;
    if (rng() > keep * clamp(1.42 - Math.hypot((x - DX) / 34, (z - ZP) / 36), 0.3, 1)) continue;
    if (!deck.clear(x, 1.5, z, 1.55) || tubs.some((q) => Math.hypot(q[0] - x, q[2] - z) < 0.95)) continue;
    const front = r < 6.2;
    // those along the open way stand half turned to it
    const side = Math.sign((x - A0[0]) * AX[1] - (z - A0[1]) * AX[0]);
    add(x, 0, z, JORY[0], JORY[1], front ? { old: rng() < 0.6, child: 0, pose: rng() < 0.5 ? 'both' : 'high', still: true } : a > 6 && w < 3.4 ? { turn: -side * rng.f(0.3, 0.8), child: 0.04 } : {});
  }
  // spare lamps stood on the floor down both edges of the open way, to show her where it is
  deck.proto('floorLamp', (g) => drawLamp(g, 0, 0.3, 0, LAMP_COLS[0]));
  // (and on the pier's bench beyond the second knot, beside a few who have sat down to wait for somebody else's capsule)
  for (const x of [88.2, 89.1, 91.6, 94.4, 95.2, 97.9]) {
    deck.people([{ p: [x, 0.5, ZP + 0.34], sit: true, yaw: rng.f(-0.3, 0.3), color: rng.pick(WEAR) }]);
    if (x * 10 % 2 < 1) { deck.put('floorLamp', { p: [x + 0.48, 0.5, ZP + 0.36], yaw: 0 }); deck.glow([{ p: [x + 0.48, 0.62, ZP + 0.36], color: rng.pick(LAMP_COLS), power: 1.0, size: 0.62, twinkle: 0.1, phase: rng() }]); }
  }
  for (const sd of [-1, 1]) for (let a = 6.4; a < 34.5; a += rng.f(1.0, 1.4)) {
    const w = sd * (1.42 + rng.f(-0.07, 0.07)), x = A0[0] + AX[0] * a + AX[1] * w, z = A0[1] + AX[1] * a - AX[0] * w;
    if (x < GX0 - 1.5) continue;
    deck.put('floorLamp', { p: [x, 0, z], yaw: rng() * TAU });
    deck.glow([{ p: [x, 0.12, z], color: rng.pick(LAMP_COLS), power: 1.0, size: 0.62, twinkle: 0.1, phase: rng() }]);
  }
  yield 'home: the block stands';
  // a second, smaller knot at the far door of this pier, round somebody else's wanderer and whoever has hold of them
  const DX2 = CAPS[4], away = [];
  for (let i = 0; i < 10; i++) for (let j = 0; j < 6; j++) {
    const x = DX2 - 6.25 + (i + 0.5) * CELLW + rng.f(-0.3, 0.3), z = GZ0 + (j + 0.5) * CELLW + rng.f(-0.3, 0.3), r = Math.hypot(x - DX2, z - ZP);
    if (r < 2.7 || r > 7 || rng() > keep * 0.9 || !deck.clear(x, 1.5, z, 1.9)) continue;
    add(x, 0, z, DX2, ZP + 1.6, { child: 0.14 });
  }
  away.push({ p: [DX2 + 0.15, 0, ZP + 1.45], yaw: 0.25, color: '#7e3f33' }, { p: [DX2 + 0.42, 0, ZP + 2.05], yaw: Math.PI + 0.5, color: '#3d6f73', scale: 0.94 });
  // some of the block watch from the first gallery's rail, and from the second
  for (const [L, n] of [[1, 26], [2, 9]]) for (let i = 0; i < n * keep; i++) {
    const x = rng.f(14, 74), gap = landing(L);
    if ((x > gap[0] - 0.8 && x < gap[1] + 0.8) || !deck.clear(x, L * 4 + 1.5, ZE + 0.5, 2.2)) continue;
    add(x, L * 4, ZE + 0.52, x + rng.f(-3, 3), 0, { child: 0.15, pose: rng() < 0.6 ? 'chest' : 'high' });
  }
  // and some have gone along to the Ring Counter and stand in its queue, or wait for a cab home, lamps at their sides
  for (const q of queue) if (deck.clear(q.p[0], q.p[1] + 1.5, q.p[2], 1.7)) add(q.p[0], q.p[1], q.p[2], q.to[0], q.to[1], { ...q.o, group: q.p[1] > 1 ? 2 : 1 });
  // the light they make together
  const amber = '#ffbe74';
  deck.lattice({ origin: [GX0, 1.3, GZ0], spacing: [CELLW, CELLW], count: [GNX + 1, GNZ + 1], color: amber, power: 0.24 / deck.level, reach: 1.5 });
  deck.lattice({ origin: [DX2 - 6.25, 1.3, GZ0], spacing: [CELLW, CELLW], count: [11, 7], color: amber, power: 0.24 / deck.level, reach: 1.5 });
  deck.zone({ min: [GX0 - 1, -1, ZP - 1], max: [GX0 + GNX * CELLW + 1, 2.4, GZ0 + GNZ * CELLW + 1], soft: 6, color: '#ffb064', power: 0.07, side: 1, under: 1.5 });
  // the door she came in by stands open and lit behind them
  deck.lattice({ origin: [DX, 1.5, ZP + 0.5], spacing: [1, 1], count: [1, 1], color: '#ffd2a0', power: 0.42 / deck.level, reach: 2.4 });

  yield 'home: lamplight';
  // one mesh for each kind of lamp bearer, and one small glow for every lamp
  const herds = [];
  for (const grp of [0, 1, 2]) kinds.forEach((k, ki) => {
    const list = folk.filter((f) => f.kind === ki && f.group === grp);
    if (!list.length) return;
    const h = herd(scene, k.geo, folkMat, list.map((f) => ({ p: [f.x, f.y, f.z], yaw: f.yaw0, color: f.color, scale: f.s })), frame);
    h.list = list; h.lamp = k.lamp;
    herds.push(h);
  });
  yield 'home: herds';
  const glows = [];
  for (const h of herds) for (const f of h.list) { f.gi = glows.length; glows.push({ p: [f.x, f.y + 1.2, f.z], color: kinds[f.kind].col, power: 1.1, size: 0.7 }); }
  const lamps = glowPoints(glows, { bend: frame, minPx: 1.5, maxPx: 90, soft: 2.1 });
  scene.add(lamps);
  const gp = lamps.geometry.attributes.aPos;

  yield 'home: lamps';
  // Jory with the star held up, Marit at the hand that holds the other half, and Oona with the jar
  const sx = Math.cos(YAW_J), sz = -Math.sin(YAW_J), at = (dx, dz) => [JORY[0] + sx * dx + AX[0] * dz, JORY[1] + sz * dx + AX[1] * dz];
  const M = at(-0.74, 0.2), O = at(1.05, 0.45), star = at(0.23, 0.46);
  const three = [
    { geo: joryGeo(), p: JORY, yaw: YAW_J, color: '#a45f3c', s: 1.02, amp: 0.045, rate: 0.7, lean: 0.02 },
    { geo: maritGeo(), p: M, yaw: Math.atan2(star[0] - M[0], star[1] - M[1]), color: '#8a4f6a', s: 0.98, amp: 0.2, rate: 0.42, lean: 0.06 },
    { geo: oonaGeo(), p: O, yaw: Math.atan2(M[0] - O[0], M[1] - O[1]), color: '#5d4a7a', s: 0.88, amp: 0.1, rate: 0.5, lean: 0.05 },
  ].map((q) => ({ ...q, h: herd(scene, q.geo, folkMat, [{ p: [q.p[0], 0, q.p[1]], yaw: q.yaw, color: q.color, scale: q.s }], frame) }));
  herd(scene, wandererGeo(), folkMat, away.map((w) => ({ scale: 1, ...w })), frame).done();
  yield 'home: the three';

  // people turn to one another and back to the door, shift their feet, and their lamps go with them
  const update = (t) => {
    for (const h of herds) {
      const L = h.lamp, a = gp.array;
      for (let i = 0; i < h.list.length; i++) {
        const f = h.list[i], s = Math.sin(t * f.w + f.ph);
        const yaw = f.yaw0 + f.talk * f.turn * smoothstep(0.25, 0.85, Math.abs(s)) * Math.sign(s), lean = 0.03 + 0.03 * Math.sin(t * f.w2 + f.ph2);
        const y = f.y + 0.012 * Math.abs(Math.sin(t * f.w2 * 1.7 + f.ph));
        h.put(i, f.x, y, f.z, yaw, lean, f.s);
        const cy = Math.cos(yaw), sy = Math.sin(yaw), o = f.gi * 3;
        a[o] = f.x + (L[0] * cy + L[2] * sy) * f.s; a[o + 1] = y + L[1] * f.s; a[o + 2] = f.z + (L[2] * cy - L[0] * sy) * f.s;
      }
      h.done();
    }
    gp.needsUpdate = true;
    three.forEach((q, i) => {
      const s = Math.sin(t * q.rate + i * 1.9);
      q.h.put(0, q.p[0], 0.004 * Math.sin(t * 1.3 + i), q.p[1], q.yaw + q.amp * (i === 1 ? smoothstep(-0.6, 0.6, s) - 0.35 : s), q.lean + 0.012 * Math.sin(t * 0.9 + i * 2.2), q.s);
      q.h.done();
    });
  };
  return { update, count: folk.length };
}

// A knot of lamps at an open door on another pier, too far off for anything but the kit's figures and a glow each.
function farKnot(deck, x, n, rng, lit) {
  const spots = [], glows = [];
  for (let i = 0; i < n; i++) {
    const a = rng.f(0.12, Math.PI - 0.12), r = 2.3 + 4.6 * Math.sqrt(rng()), px = x + Math.cos(a) * r, pz = ZP + 0.5 + Math.sin(a) * r, yaw = Math.atan2(x - px, ZP + 1.5 - pz);
    spots.push({ p: [px, 0, pz], yaw, color: rng.pick(WEAR), child: rng() < 0.1 });
    glows.push({ p: [px + Math.sin(yaw) * 0.3, rng.f(1.0, 2.0), pz + Math.cos(yaw) * 0.3], color: rng.pick(LAMP_COLS), power: 2.0, size: 0.85, twinkle: 0.14, phase: rng() });
  }
  glows.push({ p: [x, 1.6, ZP + 3], color: '#ffb466', power: 0.22, size: 11 }, { p: [x, CY, ZP - 0.6], color: '#ffd9a6', power: 1.6, size: 2.4 });
  spots.push({ p: [x, 0, ZP + 1.5], yaw: 0, color: '#7e3f33' });
  deck.people(spots); deck.glow(glows);
  if (lit) deck.lattice({ origin: [x - 5.25, 1.3, ZP + 0.9], spacing: [1.5, 1.5], count: [8, 5], color: '#ffbe74', power: 0.3 / deck.level, reach: 1.5 });
}

// ---------------------------------------------------------------- the Ring Counter, and the fronts under the first gallery
// "Every station ring on Herb Row keeps a hatch for crews and commuters: a cup of Mill broth and a sticky rice ball ...
// Chervil's comes with a sprig of whatever the hall cut that day" (eating-out.md). Drawn in its row's own
// co-ordinates: u along, v into the building. queue: where the people waiting stand, for the world to give lamps to.
const RCX = 117;
function ringCounter(deck, Pn, b, run, HH, rng, queue) {
  const g = Pn.g, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24, mid = (u0 + u1) / 2, k = deck.glowK, dep = 2.7, tile = '#d9b48c', em = 0.85 * k, plum = '#3d2a3f';
  // the room behind the hatch: lit tile, a shelf of cups along the back, the slate
  g.floor(b.u0, 0.3, b.u1, dep, 0.015, '#7a6a60');
  wallN(g, b.u0, b.u1, 0, HH - 0.2, dep, tile, em);
  wallE(g, b.u0 + 0.12, 0.3, dep, 0, HH - 0.2, tile, em * 0.7); wallW(g, b.u1 - 0.12, 0.3, dep, 0, HH - 0.2, tile, em * 0.7);
  g.floor(b.u0, 0.3, b.u1, dep, HH - 0.2, shade(tile, 0.85), { down: true, emit: em * 0.5 });
  g.box(mid + 0.9, 1.5, dep - 0.3, u1 - 0.3, 1.54, dep, '#6a4a3a', { skip: 's' });
  for (let x = mid + 1.05; x < u1 - 0.4; x += 0.2) for (let i = 0, n = 2 + Math.floor(rng() * 3); i < n; i++) g.cyl(x, 1.54 + i * 0.05, dep - 0.15, 0.05, 0.065, 0.05, 6, '#ebe3d4', { smooth: false, emit: 0.2 });
  g.box(mid - 2.3, 1.38, dep - 0.05, mid + 0.5, 2.54, dep, '#3f3128', { skip: 's' });
  deck.sign(['Ring Counter', 'Mill broth and a rice ball', 'Today: a sprig of coriander', 'Drink it on the platform'], { run, at: run.pt(mid - 0.9, 1.96, dep - 0.058), w: 2.6, h: 1.04, style: 'chalk' });
  // the hatch: a wall to the counter's height, the counter, and its name on the board over it
  g.box(u0, 0, -0.06, u1, 1.0, 0.3, PLUM, { skip: 'b' }).box(u0 - 0.05, 1.0, -0.46, u1 + 0.05, 1.06, 0.5, '#e6d2c0');
  g.box(u0, 2.3, -0.06, u1, HH - 0.06, 0.26, plum, { skip: 't' });
  deck.sign('Ring Counter', { run, at: run.pt(mid, 2.62, -0.07), h: 0.5, style: 'board', font: 'italic', ground: plum, ink: '#f1dcb0' });
  // two urns of broth on the warm loop, the day's bunch in a jar, a tray of rice balls, and cups set out with a sprig in each
  const steam = (x, y, v, n, size) => { for (let i = 0; i < n; i++) deck.glow([{ p: run.pt(x + rng.f(-0.1, 0.1), y + rng.f(0, 0.2), v + rng.f(-0.08, 0.08)), color: '#fff2e2', power: rng.f(0.16, 0.28), size: size * rng.f(0.7, 1.3), move: [rng.f(-0.05, 0.05), rng.f(0.16, 0.26), rng.f(-0.1, -0.02)], loop: rng.f(3, 4.2), phase: rng() }]); };
  for (const x of [mid - 2.5, mid - 1.65]) {
    g.cyl(x, 1.06, 0.12, 0.22, 0.22, 0.5, 10, '#a9aaa6', { top: '#8f908c' }).cyl(x, 1.56, 0.12, 0.23, 0.06, 0.09, 10, '#b9b8b2').box(x - 0.03, 1.14, -0.16, x + 0.03, 1.2, -0.09, '#5f5d58');
    steam(x, 1.66, 0.12, 18, 1.0);
  }
  g.cyl(mid - 0.6, 1.06, 0.1, 0.085, 0.085, 0.2, 8, '#b9d6cc', { emit: 0.35, smooth: false, cap: false });
  for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.03 + 0.012 * i; g.blob(mid - 0.6 + Math.cos(a) * r, 1.34 + 0.035 * i, 0.1 + Math.sin(a) * r, [0.075, 0.09, 0.075], 0, i % 3 ? '#7fa650' : '#93b862', { lump: 0.3, seed: i + 1, shadeBottom: 0.75, emit: 0.3 }); }
  g.box(mid + 0.2, 1.06, -0.16, mid + 1.2, 1.09, 0.36, '#8a6a4a', { skip: 'b' });
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) g.blob(mid + 0.32 + i * 0.19, 1.14, -0.06 + j * 0.17, [0.07, 0.055, 0.07], 0, '#f3ece0', { shadeBottom: 0.85, emit: 0.25 });
  for (let x = u0 + 0.35; x < u1 - 0.3; x += 0.36) {
    if (x > mid + 1.35 && x < mid + 2.0) continue;                 // where somebody is being served
    g.cyl(x, 1.06, -0.26, 0.034, 0.044, 0.09, 6, '#ebe3d4', { smooth: false, top: '#c59a52' });
    g.box(x + 0.005, 1.14, -0.262, x + 0.013, 1.22, -0.254, '#5f7f45').blob(x + 0.012, 1.235, -0.258, [0.03, 0.04, 0.03], 0, '#86ae5a', { shadeBottom: 0.8, emit: 0.3 });
    if (rng() < 0.7) steam(x, 1.17, -0.26, 1, 0.34);
  }
  // its own lamps, inside the hatch, and their light on the floor outside
  for (const x of [mid - 1.9, mid, mid + 1.9]) { deck.put('pendant', { p: run.pt(x, HH - 0.2, 0.2), yaw: 0 }); deck.glow([{ p: run.pt(x, HH - 0.84, 0.2), color: '#ffc27a', power: 2.3 * k, size: 0.8 }]); }
  deck.lattice({ origin: run.pt(mid - 1.7, 2.3, -0.6), spacing: [3.4, 3], count: [2, 1], color: '#ffc98a', power: 1.0 / deck.level, reach: 3.2 });
  deck.glow([{ p: run.pt(mid, 1.7, 0.6), color: '#ffcf96', power: 0.55 * k, size: 4.5 }]);
  // a striped cloth over the hatch, one stripe of it newer than the rest
  for (let i = 0, n = 13; i < n; i++) {
    const a = u0 + (u1 - u0) * i / n, c = u0 + (u1 - u0) * (i + 1) / n, col = i === 8 ? '#a8627a' : i % 2 ? '#f1e2cf' : '#8a4f6a';
    Pn.c.quad([a, 2.32, -0.06], [c, 2.32, -0.06], [c, 2.06, -1.0], [a, 2.06, -1.0], col, 0.12); Pn.c.quad([a, 2.06, -1.0], [c, 2.06, -1.0], [c, 1.92, -1.0], [a, 1.92, -1.0], shade(col, 0.9), 0.12);
  }
  // whoever serves; someone being served, and the queue behind them, out across the arcade; two who have theirs already
  deck.people([{ p: run.pt(mid + 0.7, 0, 1.2), yaw: Math.PI, color: '#efe8dc' }, { p: run.pt(mid - 2.05, 0, 1.3), yaw: Math.PI + 0.4, color: '#c7a36a' }]);
  for (let i = 0; i < 6; i++) { const q = run.pt(mid + 1.65 + 0.09 * i + rng.f(-0.06, 0.06), 0, -1.22 - i * 0.8); queue.push({ p: q, to: [q[0] - 0.4, q[2] + 4], o: { pose: i % 2 ? 'low' : 'chest', child: i === 3 ? 1 : 0 } }); }
  for (const [du, dv, yaw] of [[3.9, -2.3, 2.4], [4.7, -1.7, -1.9]]) { const q = run.pt(mid + du, 0, dv); queue.push({ p: q, to: [q[0] + Math.sin(yaw), q[2] + Math.cos(yaw)], o: { pose: 'low', child: 0 } }); }
}

function* quayFronts(deck, rng, queue) {
  return yield* frontage(deck, new Run(0, 0, ZF, 0), {
    from: X0 + 1, to: X1 - 1, height: 3, part: 'quay',
    fill: { mix: { shop: 2, stall: 0.5, wall: 0.8 }, bay: [4.8, 6.4], lit: 0.14, awnings: 0.3, blades: 0.45 },
    fronts: [
      { from: RCX - 9.6, to: RCX - 3.6, kind: 'shop', name: 'Bread', goods: 'bread', awning: false, lit: 1, props: false },
      { from: RCX - 3.6, to: RCX + 3.6, kind: 'custom', id: 'counter', wall: PLASTER, draw: (Pn, b, r, HH) => ringCounter(deck, Pn, b, r, HH, rng, queue) },
      { from: RCX + 3.6, to: RCX + 8.4, kind: 'wall', bench: false, wall: PLASTER, notice: ['Guest-right', 'Three nights in a Margin flat', 'and a seat at the halls,', 'for any traveller from a drum', 'that grants the same.'] },
    ],
  });
}

// ---------------------------------------------------------------- trains, stood and moved
// Each is a single mesh modelled at x = 0 and turned round the drum's axis to wherever it is; its material is told
// where that is, so that it takes the light of the place it has come to.
function standTrains(deck, lampU) {
  const R = deck.frame.floorR, fine = trainGeo(true, 'home-train-a').build(), plain = trainGeo(false, 'home-train-b').build();
  for (const gq of [fine, plain]) fitBounds({ geometry: gq }, deck.frame);
  const list = TRAINS.map((def) => { const m = new Mesh(def.k === 0 ? fine : plain, shellMaterial(deck, lampU, 0)); deck.group.add(m); return { def, mesh: m }; });
  return (t) => {
    for (const { def, mesh } of list) {
      const x = trainX(def, t);
      mesh.rotation.z = x / R; mesh.material.uniforms.uShift.value = x;
      // a train inside a pier is out of sight: it is not drawn until its nose is at the opening, nor once its tail is through
      mesh.visible = x + 50 > def.k * P + PIER - 4 && x - 50 < (def.k + 1) * P + 4;
    }
  };
}

// ---------------------------------------------------------------- who else is about at this hour
// Crews and the first commuters: a few walking the far platform, a few at the hatches, a few reading the Ledger, a few
// riding down the escalators (those on this pier's with lamps: more of the block, late).
function earlyFolk(deck, ctx, rng) {
  const D = ctx.density, spots = [], ok = (x, y, z) => deck.clear(x, y + 1.5, z, 2.3);
  for (const [z, dir] of [[-11.2, 1], [6.9, -1]]) deck.walkersAlong({ from: [dir > 0 ? 150 : X1 - 14, 0, z], to: [dir > 0 ? X1 - 14 : 150, 0, z], n: Math.round(22 * D), speed: 1.35, spread: 0.5, child: 0.03, rng });
  for (const [k, b, share] of [[0, 0, 0.5], [0, 1, 0.3], [1, 1, 0.4], [-1, 1, 0.2]]) for (const hx of hatchesOf(berthX(k, b))) {
    if (rng() > share) continue;
    for (let j = 0, n = rng.i(1, 3); j < n; j++) spots.push({ p: [hx + rng.f(-0.12, 0.12) + (j % 2 ? 0.34 : -0.34), 0, ZG + 1.2 + Math.floor(j / 2) * 0.72 + rng.f(-0.08, 0.08)], yaw: Math.PI + rng.f(-0.15, 0.15) });
  }
  for (let i = 0, n = Math.round(46 * D); i < n; i++) {
    const x = rng.f(112, 520), z = rng.f(-6.9, 2.9);
    if (!ok(x, 0, z)) continue;
    const bx = Math.round(x / 26) * 26 + (rng() < 0.5 ? 0 : 26 * rng.sign());
    spots.push({ p: [x, 0, z], yaw: Math.atan2(bx - x, ZB - z) + rng.f(-0.3, 0.3), walk: rng() < 0.2 ? rng.f(0.5, 1.1) : 0 });
  }
  for (let i = 0, n = Math.round(60 * D); i < n; i++) {
    const x = rng() < 0.3 ? rng.f(-150, 8) : rng.f(84, 560), z = rng.f(10.6, 19), u = ((x % P) + P) % P;
    if ((u > ESC_U - 1 && u < ESC_U + 3 * (RUN + 3) + 2 && z < EZ1 + 0.8) || (z > 13.6 && z < 15.2) || (x > RCX - 12 && x < RCX + 6 && z > 13) || !ok(x, 0, z)) continue;
    spots.push({ p: [x, 0, z], yaw: rng() * TAU, walk: rng() < 0.45 ? rng.f(0.5, 1.3) : 0 });
  }
  for (let L = 1; L <= 3; L++) {
    const y = L * 4, gap = landing(L);
    for (let x = 80; x < 560; x += rng.f(7, 22) / Math.max(0.4, D)) {
      const u = ((x % P) + P) % P;
      if ((u > gap[0] - 0.8 && u < gap[1] + 0.8) || !ok(x, y, ZE + 0.5)) continue;
      spots.push({ p: [x, y, ZE + 0.52], yaw: Math.PI + rng.f(-0.35, 0.35) });
    }
    if (L > 1) for (const [z, dir] of [[19.2, 1], [22.6, -1]]) deck.walkersAlong({ from: [dir > 0 ? X0 + 12 : X1 - 12, y, z], to: [dir > 0 ? X1 - 12 : X0 + 12, y, z], n: Math.round(16 * D), speed: 1.4, spread: 0.6, child: 0, rng });
  }
  deck.people(spots);
  const sp = 0.62, vy = sp * Math.tan(30 * DEG), loop = RUN / sp;
  for (const k of KS) for (let f = 0; f < 3; f++) {
    const ua = k * P + ESC_U + 3 + f * (RUN + 3), ya = 12 - f * 4;
    for (let i = 0, n = k === 0 ? 3 : 1; i < n; i++) for (const dn of [1, 0]) {
      if (!dn && rng() < 0.6) continue;
      const item = { yaw: dn ? Math.PI / 2 : -Math.PI / 2, phase: (i + 0.8 * rng()) / n, pose: 'stand', skin: rng.pick(SKIN), color: rng.pick(WEAR), scale: rng.f(0.93, 1.06) };
      if (dn) {
        deck.riders.push({ ...item, p: [ua, ya, EZ0 + 0.85], drift: [sp, -vy, 0, loop] });
        if (k === 0) deck.rideGlows.push({ p: [ua + 0.3, ya + 1.15, EZ0 + 0.6], color: rng.pick(LAMP_COLS), power: 1.5, size: 0.42, move: [sp, -vy, 0], loop, phase: item.phase });
      } else deck.riders.push({ ...item, p: [ua + RUN, ya - 4, EZ1 - 0.85], drift: [-sp, vy, 0, loop] });
    }
  }
}

// Chervil keeps a tree in a tub at either end of every hanger, and benches back to back between hangers (Rue's platform
// is bare for its rush). Returns where the tubs stand, so that nobody is stood in one.
function furnish(deck, rng) {
  const tubs = [], leaf = deck.pal.leaf, spots = [];
  for (let x = X0 + 26; x < X1; x += 26) {
    if (x < -140 || x > 660 || (x > 0 && x < 78) || x === COUNT_AT) continue;        // none where the block stands, nor under the old Count
    for (const dz of [-4.7, 4.7]) {
      const q = [x + rng.f(-0.15, 0.15), 0, ZB + dz];
      if (!deck.clear(q[0], 2.2, q[2], 3.4)) continue;
      tubs.push(q); deck.put('tubTree', { p: q, yaw: rng() * TAU, scale: rng.f(0.95, 1.14), color: shade(rng.pick(leaf), 0.85) });
    }
    for (const sd of [-1, 1]) {
      const q = [x + 13, 0, ZB + sd * 0.28];
      if (!deck.clear(q[0], 1.2, q[2], 2.2)) continue;
      deck.put('bench', { p: q, yaw: sd < 0 ? 0 : Math.PI, scale: [1.5, 1, 1], color: rng.pick(deck.pal.doors) });
      if (rng() < 0.4) spots.push({ p: [q[0] + rng.f(-0.7, 0.7), 0.45, q[2] - sd * 0.05], sit: true, yaw: sd < 0 ? Math.PI : 0 });
    }
  }
  deck.people(spots);
  // the night's cleaners, not yet gone home to their sockets
  for (let i = 0; i < 9; i++) { const x = rng.f(90, 420), z = rng.f(-15, 12); if (deck.clear(x, 0.5, z, 2.5) && !inPier(x)) deck.put('robot', { p: [x, 0, z], yaw: rng() * TAU }); }
  return tubs;
}

// ---------------------------------------------------------------- the world
export const chervilHome = {
  id: 'chervil-home',
  title: 'An apple cut crosswise', drum: 'Chervil', row: 'Herb Row', kind: 'a hall drum', light: 0.0,
  line: 'My block came down to Ring 2 before lamp-dawn with a hand lamp each, and Jory held up the star in front of all of them. He knows what it means, and so did they.',
  tone: '#a9627f', source: 'wander-year.md (Day 365, Day 1), open-drums.md (Chervil; The calendar), eating-out.md (The Ring Counters), drum-transport.md (Station rings)',
  sound: { root: 41, scale: 'mixo', pad: 0.5, air: 0.12, hum: 0.2, crowd: 0.2, choir: 0.7, bells: 0.04, bright: 0.28 },
  *build(ctx) {
    const frame = makeFrame(40 * DEG, 3 * DRUM.L / 18, deckRadius(1));       // Station Ring 2, on the rim deck, under the Ring 2 hall
    const rng = makeRng('chervil-home'), R = frame.floorR;
    // a place d metres out from the door along the open way, `side` metres to the right of someone walking in
    const S = (d, y, side = 0) => [A0[0] + AX[0] * d + AX[1] * side, y, A0[1] + AX[1] * d - AX[0] * side];
    const STAR = S(3.07, 1.84, 0.23), THREE = S(2.7, 1.5, -0.5), NEAR = S(2.85, 1.72, -0.1), LED = [51.8, 5.5, -4.1];
    // down the open way to the star; up over the lamps to the Ledger; down past a second knot of lamps and under the
    // old Count; across to the Ring Counter; out, up over the gallery's rail, and square in at a cab door
    const path = makePath([
      { t: 0, p: S(30.5, 1.45) },
      { t: 6, p: S(21.5, 1.5), look: STAR },
      { t: 11.5, p: S(12.5, 1.52), look: THREE, fov: 54 },
      { t: 16.5, p: S(6.7, 1.56, -0.3), look: THREE, fov: 46 },
      { t: 20, p: S(5.0, 1.6, -0.25), look: NEAR, fov: 38 },
      { t: 23, p: S(4.6, 1.62, -0.2), look: NEAR, fov: 34 },
      { t: 24, p: S(4.62, 1.68, -0.2), look: NEAR, fov: 34 },
      { t: 27, p: [39.5, 4.4, -8.6], look: [44.2, 4.8, -6.9], fov: 50 },
      { t: 30.5, p: [43.4, 5.7, -5.0], look: LED, fov: 50 },
      { t: 34, p: [51.5, 5.2, -11.3], look: [64, 3.0, -12.6] },
      { t: 37.5, p: [64.5, 3.7, -9.3], look: [78.5, 1.6, -13.2] },
      { t: 40, p: [76.4, 2.7, -8.5], look: [82, 1.6, -13.4] },
      { t: 43.6, p: [94.5, 3.0, -5.2], look: [104, 5.1, -5.4] },
      { t: 46.6, p: [107, 2.6, 4.0], look: [RCX - 1, 1.6, 19] },
      { t: 50, p: [RCX - 0.4, 2.0, 12.7], look: [RCX + 2, 1.45, 20] },
      { t: 53, p: [RCX + 10.5, 4.6, 7.8], look: [RCX + 24.5, 5.1, 22] },
      { t: 56, p: [RCX + 22.6, 5.95, 11.0], look: [RCX + 25.8, 5.1, 22] },
      { t: 58.4, p: [RCX + 26, 5.3, 18.0], look: [RCX + 26, 5.1, 27] },
      { t: 60.9, p: [RCX + 26, 5.1, 26.8] },
    ], { frame, entryRadius: 1.1, exitRadius: 1.1 });
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'chervil-home', palette: CHERVIL, detail: 44,
      light: { level: 0.5, lamp: '#ffc98a', ambUp: '#55424e', ambDown: '#382a33', ambPower: 0.9 }, floor: { shine: 1, slab: [0.9, 0.9], lampGlow: 1.6 } });
    yield 'home: path';

    yield* layFloors(deck);
    // the hall, a stretch at a time: one model, turned to each stretch's place and lit by where that is
    const lampU = { value: new Vector4(1, 0.6, 0.55, 0.13) };
    const sh = yield* shellGeo(deck.pal);
    const parts = [];
    for (const q of [...sh.solid, sh.gl]) { const geo = q.build(); fitBounds({ geometry: geo }, frame); parts.push(geo); yield 'home: shell'; }
    for (const k of KS) {
      const solid = shellMaterial(deck, lampU, k * P);
      parts.forEach((geo, i) => {
        const m = new Mesh(geo, i < 2 ? solid : shellMaterial(deck, lampU, k * P, true));
        m.rotation.z = k * P / R; if (i === 2) m.renderOrder = 4;
        deck.group.add(m);
      });
    }
    yield 'home: stretches';
    const lights = yield* lightAndLetter(deck);
    yield 'home: light';
    const queue = [];
    yield* quayFronts(deck, rng, queue);
    yield 'home: fronts';
    const xs = []; for (let x = X0 + 26; x < X1; x += 26) xs.push(x);
    const boards = yield* ledgerBoards(deck, xs);
    deck.group.add(boards.mesh);
    yield 'home: the Ledger';

    // the way out: a bank of four cab doors on the first gallery, standing a little proud of its wall
    const ex = path.exit.flat, zl = ex.z - DOOR_IN;
    const lifts = lobby(deck, { at: [ex.x + 1.3, zl], y: 4, face: 'front', doors: 4, pitch: 2.6, hole: 1, open: [3], lines: ['Two, Ring 2'], door: '#8a4f6a', wall: PALE });
    { const g = deck.bucket(ex.x, ZW, 'lobby').g, x0 = ex.x + 1.3 - lifts.width / 2, x1 = ex.x + 1.3 + lifts.width / 2; wallW(g, x0, zl, ZW, 4, 7, PALE); wallE(g, x1, zl, ZW, 4, 7, PALE); }
    // some of the block are on their way home already: at the cab doors, and at the rail for one more look
    const cx = ex.x + 1.3;
    for (const [du, dz, look, child] of [[-4.5, -1.4, 0.3, 0], [1.1, -1.6, -0.2, 0], [2.9, -1.3, 0, 0], [3.5, -2.0, -0.4, 1], [5.2, -2.7, -2.4, 0], [-6.4, -2.2, 1.2, 0]]) queue.push({ p: [cx + du, 4, zl + dz], to: [cx + du + Math.sin(look), zl + dz + Math.cos(look)], o: { pose: child ? 'chest' : 'low', child } });
    for (const dx of [-12.2, -10.9, -8.8, 2.4, 3.3, 5.6, 9.4]) queue.push({ p: [ex.x + dx, 4, ZE + 0.52], to: [ex.x + dx - 22, -6], o: { pose: dx > 3 ? 'high' : 'chest', child: dx === 3.3 ? 1 : 0 } });
    deck.zone({ min: [cx - 7.5, 3.9, zl - 5.5], max: [cx + 7.5, 7.2, zl + 0.4], soft: 1.8, color: '#ffc890', power: 0.3, side: 0.75, under: 0.6 });
    for (const sd of [-1, 1]) deck.put('tubTree', { p: [cx + sd * (lifts.width / 2 + 0.75), 4, zl - 0.55], yaw: sd, scale: 0.84, color: shade(deck.pal.leaf[sd < 0 ? 1 : 3], 0.9) });
    const tubs = furnish(deck, rng);
    yield 'home: cabs';

    const scene = new Scene();
    const folkMat = litMaterial(deck.rig, { bend: frame, soft: 0.45 });
    const block = yield* theBlock(deck, scene, ctx, rng, folkMat, queue, tubs);
    yield 'home: the block';
    farKnot(deck, P + CAPS[0], Math.round(34 * ctx.density), rng, true);
    farKnot(deck, P + CAPS[3], Math.round(22 * ctx.density), rng, true);
    farKnot(deck, 2 * P + CAPS[1], Math.round(26 * ctx.density), rng, true);
    farKnot(deck, 2 * P + CAPS[2], Math.round(16 * ctx.density), rng, false);
    farKnot(deck, 2 * P + CAPS[4], Math.round(30 * ctx.density), rng, false);
    farKnot(deck, -P + CAPS[2], Math.round(24 * ctx.density), rng, false);
    earlyFolk(deck, ctx, rng);
    yield 'home: people';
    const moveTrains = standTrains(deck, lampU);
    yield 'home: trains';
    yield* finish(deck);
    scene.add(deck.group);

    const look = { exposure: 1.75, bloom: 0.3, threshold: 0.9, saturation: 1.05, contrast: 1.05, vignette: 0.55 };
    const T = path.tCross, rose = new Color('#e58a8a'), gold = new Color('#ffc890'), now = new Color();
    let pre = 0, shown = -1;
    const update = (t, dt) => {
      if (t <= 0) pre += dt || 0;            // seen through the last world's opening: people shift and the names go by all the same
      const age = t + pre;
      boards.set(t, age);
      moveTrains(t);
      block.update(age);
      lifts.slide(smoothstep(T - 6.5, T - 3.0, t));
      // half past six: the hall's lamps begin to come up, rose before gold
      const up = smoothstep(LAMPS_UP, LAMPS_UP + 16, t);
      if (up === shown) return;
      shown = up;
      now.copy(rose).lerp(gold, 0.8 * up);
      lampU.value.set(now.r, now.g, now.b, 0.13 + 0.17 * up);
      deck.rig.setZone(lights.iHall, { ...lights.hall, color: now, power: 0.15 + 0.13 * up });
      deck.rig.setLattice(lights.iGal, { ...lights.gal, power: (0.26 + 0.2 * up) * deck.level });
      look.exposure = 1.75 - 0.1 * up;
    };
    update(0, 0);
    return { scene, path, deck, count: block.count, near: 0.12, far: 1500, look, portal: { shape: 'rect', width: 1.5, height: 2.2, rim: false, mist: '#e3925f' }, update };
  },
};

