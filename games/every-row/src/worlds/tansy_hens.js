// Tansy, Herb Row: a steady drum "proud of its vat lines and its strawberries", with the Row's only henhouse
// (docs/eating-out.md, Tansy; docs/glossary.md, Tansy). The flight begins in the Keel among Garden racks under
// red-weighted lamps, where strawberries grow in air too thin in oxygen for the crews to breathe and robots do the
// picking; goes out through a crate lock into a vat hall seven decks tall and most of a kilometre long, closed steel
// vats in ranks, jacketed and held at 65 degrees, the floor climbing away spinward until the ceiling hides it; dives
// to the floor between the vats and comes up past the Board, where a wall of lights shows every line; rises up a well
// with the risers of the warm loop, through the line deck, into a street on the first of the Low decks a little
// before ten; and there is the queue, the slate that says how many eggs are left, and forty hens behind a glass wall,
// the only animals anyone on Herb Row has ever seen. It ends at hen height, going in at the pop-hole.
// (docs/sorrel.md, The Keel: the Long Vats, the Red Racks, the Board; docs/food-system.md, Tier 2 and Tier 3;
// docs/eating-out.md, The Henhouse; atlas/sorrel places-keel.json for what such halls are like inside.)
//
// Not canon (the docs give Tansy its vat lines, its strawberries, its strain library and the Henhouse with its forty
// hens, its glass wall, its two dishes and their prices, and eggs that sell out by ten; they describe a food plant's
// halls only for Sorrel, next door; how Tansy's lie is this page's own):
//   - Tansy's vat hall is drawn on the pattern of Sorrel's Long Vats (decks 5 to 11, most of a kilometre, running
//     spinward, protein flour) and its racks on Sorrel's Red Racks (five decks of racks, low oxygen, crews in masks);
//     the Board is Sorrel's name for its watch room, and its lights (green while a line runs, white while it
//     regrows) and its four headings are Sorrel's too
//   - the layout: one aisle of racks, a lock and the vat hall end to end; four ranks of vats and a nave; gantries at
//     the vats' shoulders; the Board in a glazed room high on the hall's side; what is painted on vats, bays and decks
//   - robots that pick (in the docs the Garden's crews pollinate by hand; a robot is an appliance), each with a white
//     lamp of the kind Sorrel's crews carry to judge colour by; the crate lifts; the crews' hoods
//   - in the hall: the travelling crane and the pump casing on its hook, the tugs and their trailers of sacked flour,
//     the steam
//   - the well: a shaft from the vat hall's roof up through the line deck to the street, with the 65 degree loop's
//     risers in it and a rail at the top where people look down at the vat lines
//   - "Runnerfield" (the racks) and "Coopside" (the Henhouse's block) are names from three-nights 15-canon.js, placed
//     here by this page, as is the motto "Keep a copy."; that file puts the Henhouse on the Low decks by the Garden
//     racks, and this page makes that deck 16, the first above the Keel, with a square round the well's mouth
//   - inside the hens' run: litter, perches, nest boxes, feeders, a keeper and her half-door, and the pop-hole with
//     its ramp, which is the way out of this world; what colours the hens are
//   - the counter on the square, its griddle and basket; the wording of slates, cards and notices (the dishes, their
//     prices and the Henhouse's refusal to light its hens harder are the docs'); seven eggs left of twenty-six laid;
//     twenty-one in the queue; the clock at eight minutes to ten
//   - the shops the kit fills in, and a strawberry stall
import {
  Scene, ShaderMaterial, InstancedMesh, InstancedBufferAttribute, Matrix4, Quaternion, Vector3, Color, Sphere, FrontSide,
} from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, street, frontage, Run, PALETTES } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, litMaterial } from '../kit/mats.js';
import { Geo, instances, shade, mixc } from '../kit/geo.js';
import { makeRng, smoothstep, clamp } from '../core/rng.js';

// ---------------------------------------------------------------- the place, in the frame of deck 5
// x spinward, y above the vat hall's floor, z along the axis. Deck n's floor is y = 4 (n - 5).
const HX1 = 897;                          // the vat hall runs from x = 0 to here: 69 bays
const HZ = 36, HTOP = 27;                 // its half-width; its ceiling, the underside of deck 12
const BAY = 13, NB = 69;                  // a vat every 13 m along each rank
const RANKS = [-27.5, -14.5, 14.5, 27.5]; // four ranks of vats, and a nave 20 m wide between the middle two
const NAVE = 7.2;                         // half the clear width of the nave's floor
const GY = 15;                            // the gantries, at the vats' shoulders
const RX0 = -92, RX1 = -6;                // the rack aisle (Runnerfield), end on to the vat hall
const RY = 8, RH = 4.5;                   // its floor (deck 7) and half its width
const LOCK = [-6, 0];                     // the crate lock between them
const LY = 15;                            // the lock's floor, level with the gantries
const BOARD = [312, 377, 20, 26.6, 46];   // the Board's room on the hall's back side: from x, to x, floor, ceiling, and the z of its wall of lights
const LAND = 3.2;                         // how far the lock's landing stands out into the hall
const CRANE_END = 364;                    // the travelling crane's rails run from the lock end to here
const WX = 429, WR = 3.2;                 // the well: its middle and its radius
const SY = 44;                            // deck 16: the street's floor
const SQ = 13;                            // half the square round the well's mouth
const AW = 4.5;                           // half the avenue's width
const HEN = [444.6, 468.6];               // the hens' run along the avenue's back side
const DOOR = 456.6;                       // the keeper's half-door, in the middle of the glass
const TAU = Math.PI * 2;

// Tansy's paint: its dawn is a pink "nobody admits was painted for the strawberries" (15-canon.js: #2a1d1e, #8c4a4f,
// #f2a08c, #fff3ea), worn into cream plaster, strawberry-red ironwork and old wood
const IRON = '#9a4a50', IRON2 = '#7c3b42', CREAM = '#e9dccb', STEEL = '#aab1b6', COPPER = '#a8623e', METH = '#cfa93a', WATER = '#6f93a6';
const TANSY = {
  ...PALETTES.warm,
  walls: ['#ead9c8', '#e3cdbb', '#efe2d2', '#dcc4b2', '#e6d3c2', '#f1e6d8'],
  dado: ['#8c4a4f', '#7a5a52', '#94605a', '#6e4a48'],
  trim: ['#4a2a2e', '#5c3a36', '#3f2a2a', '#63443c'],
  doors: ['#8c4a4f', '#3f6f6a', '#b9734a', '#5d6a7a', '#7e3f33', '#4f7a5a', '#c98a5a', '#3d2f38'],
  awnings: [['#b5404a', '#f6ead8'], ['#8c4a4f', '#f1e2cf'], ['#e08a6c', '#fff3ea'], ['#4f7a5a', '#efe6d0'], ['#3f6f6a', '#f3e9d6']],
  signs: [['#3a2226', '#f3dcc0'], ['#5a2f36', '#f6e3c8'], ['#2f3a36', '#ead9c0'], ['#f1e4d0', '#4a2a2e'], ['#3b2f30', '#f2a08c'], ['#6a3a42', '#fff3ea']],
  floor: '#94887f', strip: '#72665f', court: '#c2b3a4', ceiling: '#ad9585', rib: '#e0cdbd',
  rooms: ['#e0b08a', '#d0a898', '#c9967e', '#d8b898', '#e8c09a', '#c8a688', '#d39a86'],
  lamp: '#ffd2a0', window: ['#ffc48a', '#ffd9aa', '#ffe6c8', '#f6b47e'], shop: '#ffd6a8',
};

// what the air fades to with distance, place by place
const HAZE = { racks: '#3d1a2b', hall: '#9a9c98', street: '#5a4a40' };

// ---------------------------------------------------------------- small things
const lerp = (a, b, t) => a + (b - a) * t;
// a face at one z looking toward -z (face < 0) or +z; a face at one x looking toward -x or +x
function wallZ(g, x0, x1, y0, y1, z, face, col, e = 0) {
  if (face < 0) g.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], col, e); else g.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, e);
}
function wallX(g, z0, z1, y0, y1, x, face, col, e = 0) {
  if (face < 0) g.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, e); else g.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], col, e);
}
// a small eight-faced stone: berries, buds, eyes
function gem(g, x, y, z, rx, ry, rz, col, e = 0) {
  const T = [x, y + ry, z], B = [x, y - ry, z], E = [x + rx, y, z], W = [x - rx, y, z], S = [x, y, z + rz], N = [x, y, z - rz];
  g.tri(T, S, E, col, e).tri(T, E, N, col, e).tri(T, N, W, col, e).tri(T, W, S, col, e);
  g.tri(B, E, S, col, e).tri(B, N, E, col, e).tri(B, W, N, col, e).tri(B, S, W, col, e);
}
// a round pipe lying along x
const pipeX = (g, x0, x1, y, z, r, col, n = 6) => g.tube([[x0, y, z], [x1, y, z]], r, n, col);

// ---------------------------------------------------------------- steel
// The vats are brushed steel: besides the light that falls on them they hold the hall's lamps as long soft streaks,
// which slide as the camera goes by. Drawn from Geo geometry; a vertex's tint weight says how far it is bare metal.
const STEEL_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit;
${BEND_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vMetal;
void main() {
  vec3 p = position, n = normal;
  #ifdef USE_INSTANCING
    p = (instanceMatrix * vec4(p, 1.0)).xyz; n = mat3(instanceMatrix) * n;
  #endif
  n = normalize(n);
  vF = p; vFN = n;
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vec3 c = aCol.rgb;
  #ifdef USE_INSTANCING_COLOR
    c *= mix(vec3(1.0), instanceColor, aCol.a);
  #endif
  vCol = c; vEmit = aEmit; vMetal = aCol.a;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const steelFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uBend; uniform vec3 uEnvHi; uniform vec3 uEnvLo; uniform float uRough; uniform float uLampK; uniform float uDiff;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vMetal;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  vec3 L = kLight(vW, N, vF, FN);
  vec3 c = vCol * (L + vEmit);
  if (vMetal > 0.01) {
    // the way to the eye in the flat model, mirrored in the steel
    vec3 Vw = normalize(cameraPosition - vW), V = Vw;
    if (uBend.z > 0.0) { float a = uBend.x + vF.x / uBend.z, ca = cos(a), sa = sin(a); V = vec3(-sa * Vw.x + ca * Vw.y, -ca * Vw.x - sa * Vw.y, Vw.z); }
    vec3 R = reflect(-V, FN);
    float fres = 0.55 + 0.45 * pow(1.0 - clamp(dot(V, FN), 0.0, 1.0), 4.0);
    vec3 env = mix(uEnvLo, uEnvHi, smoothstep(-0.3, 0.4, R.y));
    // each long row of lamps is held as one line of light: where the mirrored ray passes near it, the steel shines
    vec3 spec = vec3(0.0);
    vec2 r2 = R.yz; float rl = length(r2);
    if (rl > 1e-3) {
      r2 /= rl;
      for (int i = 0; i < LATTICES; i++) {
        vec4 A = uLatA[i], B = uLatB[i], C = uLatC[i];
        if (C.w < 0.5 || B.z < 6.0) continue;
        vec2 lb = kLatBand(vF.y, A, uLatD[i]);
        if (lb.y <= 0.0) continue;
        for (int j = 0; j < 2; j++) {
          if (float(j) > B.w - 0.5) break;
          vec2 q = vec2(lb.x - vF.y, A.z + float(j) * B.y - vF.z);
          float along = dot(q, r2);
          if (along <= 0.0) continue;
          float d = abs(q.x * r2.y - q.y * r2.x), sig = 0.2 + uRough * along;
          float xh = vF.x + R.x * along / rl, xe = A.x + (B.z - 1.0) * B.x;
          spec += C.rgb * exp(-d * d / (sig * sig)) * (0.35 + 0.65 * rl) * smoothstep(A.x - 12.0, A.x + 6.0, xh) * smoothstep(xe + 12.0, xe - 6.0, xh);
        }
      }
    }
    c = mix(c, vCol * (L * uDiff + env * fres) + spec * (uLampK * fres) * mix(vec3(1.0), vCol, 0.4) + vCol * vEmit, vMetal);
  }
  gl_FragColor = vec4(kAir(c, vW), 1.0);
}`;
function steelMaterial(deck) {
  const f = deck.frame, rig = deck.rig;
  return new ShaderMaterial({
    uniforms: {
      ...rig.uniforms, uClip: G.uClip, uBend: { value: new Vector3(f.a0, f.z0, f.floorR) },
      uEnvHi: { value: new Vector3(0.62, 0.6, 0.56) }, uEnvLo: { value: new Vector3(0.14, 0.12, 0.1) }, uRough: { value: 0.26 }, uLampK: { value: 1.9 }, uDiff: { value: 0.36 },
    },
    defines: { LATTICES: rig.lattices }, vertexShader: STEEL_VERT, fragmentShader: steelFrag(rig), side: FrontSide,
  });
}

// ---------------------------------------------------------------- the racks
// Runnerfield: one aisle of Garden racks, nineteen tiers a side, each a white gutter of strawberry plants under its own
// bar of red-weighted lamps. Under those lamps leaves go dark and fruit glows; a picking robot carries a white lamp to
// judge colour by, and in its pool the leaves are green again (the pools are lit from the world's update()).
const TIERS = 19, TIER = 0.95;
const HERO = [8, -46.5, 0.45];            // the picker the flight passes close: its lowest tier, where it is as the flight begins, metres a second
const tierY = (i) => RY + 0.9 + TIER * i;
// a face seen from both sides
const both3 = (g, a, b, c, col, e = 0) => { g.tri(a, b, c, col, e); g.tri(a, c, b, col, e); };
// a strawberry leaf: a kite folded along its midrib, out from the crown along angle a (0 is +x, a quarter turn is +z)
function leaf(g, a, len, rise, k) {
  const c = Math.cos(a), s = Math.sin(a), w = len * 0.4, m = len * 0.55;
  const base = [c * 0.02, 0.03, s * 0.02], tip = [c * len, rise * 0.5, s * len];
  const L = [c * m - s * w, rise, s * m + c * w], R = [c * m + s * w, rise * 0.86, s * m - c * w], mid = [c * m, rise * 1.12, s * m];
  both3(g, base, L, mid, shade('#ffffff', k)); both3(g, mid, L, tip, shade('#ffffff', k * 0.92)); both3(g, base, mid, R, shade('#ffffff', k * 0.8)); both3(g, mid, tip, R, shade('#ffffff', k * 0.74));
}
// a picking robot: a mast that rides the rails of three tiers at once, and at each an arm over the plants, a white
// lamp to judge colour by and a punnet of what it has picked (its lowest rail at the origin, the rack toward +z)
function pickerShape(g) {
  g.box(-0.34, -0.06, -0.46, 0.34, 0.22, -0.1, '#d9d4c8', { top: '#c9c3b6' }).box(-0.06, 0.2, -0.34, 0.06, 2 * TIER + 0.72, -0.22, '#8f908c', { skip: 'b' });
  g.box(0.14, 0.06, -0.47, 0.24, 0.13, -0.46, '#9fe0b0', { emit: 3 });
  for (let i = 0; i < 3; i++) {
    const y = i * TIER;
    g.box(-0.36, y, -0.1, 0.36, y + 0.06, 0.0, '#3a3b3c').box(-0.05, y + 0.6, -0.3, 0.05, y + 0.66, 0.16, '#8f908c').box(-0.035, y + 0.42, 0.1, 0.035, y + 0.6, 0.16, '#3a3b3c');
    g.box(-0.22, y + 0.64, -0.18, 0.22, y + 0.7, -0.05, '#fff6e6', { emit: 6 }).box(-0.3, y + 0.24, -0.44, -0.02, y + 0.31, -0.14, '#b5404a');
    for (let j = 0; j < 3; j++) gem(g, -0.23 + j * 0.07, y + 0.33, -0.3 + (j % 2) * 0.07, 0.026, 0.026, 0.026, '#d8261a', 0.3);
  }
}
function* buildRacks(deck, rng) {
  const clk = deck.clk, k = deck.glowK, LED = '#ff6aa6', panel = '#6a5560';
  const RED = '#d8261a', flower = (g, x, y, z) => { gem(g, x, y, z, 0.036, 0.036, 0.011, '#ffffff', 0.3); g.tri([x + 0.012, y - 0.01, z - 0.013], [x - 0.012, y - 0.01, z - 0.013], [x, y + 0.012, z - 0.013], '#f2c12e', 0.4); };
  // a plant in its gutter, the aisle toward -z: leaves round a crown, fruit hung over the gutter's edge, flowers above
  deck.proto('berry', (g) => {
    g.tint(1);
    [[-1.9, 0.25, 0.2, 1], [-1.2, 0.24, 0.24, 0.9], [-0.4, 0.26, 0.17, 1.05], [0.5, 0.22, 0.26, 0.85], [1.7, 0.2, 0.3, 0.95], [2.8, 0.25, 0.19, 1], [3.6, 0.23, 0.25, 0.9]].forEach(([a, l, r, sh]) => leaf(g, a, l, r, sh));
    g.tint(0);
    for (const [x, y, z, col] of [[-0.12, -0.08, -0.2, RED], [0.02, -0.15, -0.22, RED], [0.13, -0.06, -0.2, '#e59a6a']]) { gem(g, x, y, z, 0.025, 0.033, 0.025, col, 0.3); both3(g, [x, y + 0.03, z], [x * 0.3, 0.06, -0.1], [x + 0.008, y + 0.03, z], '#7fa060'); }
    flower(g, -0.14, 0.24, -0.13); flower(g, 0.09, 0.3, -0.1);
  }, { leafy: true });
  deck.proto('berry2', (g) => {
    g.tint(1);
    [[-2.3, 0.24, 0.22, 0.95], [-1.5, 0.27, 0.18, 1.05], [-0.7, 0.22, 0.28, 0.85], [0.2, 0.25, 0.2, 1], [1.2, 0.21, 0.3, 0.9], [2.2, 0.24, 0.22, 1], [3.2, 0.26, 0.2, 0.92]].forEach(([a, l, r, sh]) => leaf(g, a, l, r, sh));
    g.tint(0);
    for (const [x, y, z, col] of [[-0.05, -0.12, -0.21, RED], [0.11, -0.07, -0.2, '#e9e2b8']]) { gem(g, x, y, z, 0.024, 0.032, 0.024, col, 0.3); both3(g, [x, y + 0.03, z], [x * 0.3, 0.06, -0.1], [x + 0.008, y + 0.03, z], '#7fa060'); }
    flower(g, -0.16, 0.22, -0.14); flower(g, 0.0, 0.32, -0.08); flower(g, 0.15, 0.25, -0.12);
  }, { leafy: true });
  // the same from a few metres: four leaves, the fruit and a flower as single faces
  deck.proto('berryMid', (g) => {
    g.tint(1);
    for (const [a, l, r, sh] of [[-1.6, 0.27, 0.24, 1], [-0.2, 0.26, 0.2, 0.9], [1.6, 0.22, 0.3, 0.85], [3.0, 0.26, 0.2, 0.95]]) {
      const c = Math.cos(a), s = Math.sin(a), w = l * 0.42, m = l * 0.55, base = [0, 0.03, 0], tip = [c * l, r * 0.5, s * l], L = [c * m - s * w, r, s * m + c * w], R = [c * m + s * w, r * 0.86, s * m - c * w];
      both3(g, base, L, tip, shade('#ffffff', sh)); both3(g, base, tip, R, shade('#ffffff', sh * 0.78));
    }
    g.tint(0).tri([-0.09, -0.1, -0.21], [0.03, -0.1, -0.21], [-0.03, -0.17, -0.21], RED, 0.3).tri([0.05, -0.04, -0.2], [0.15, -0.04, -0.2], [0.1, -0.1, -0.2], RED, 0.3);
    g.tri([0.06, 0.2, -0.12], [-0.06, 0.2, -0.12], [0, 0.31, -0.1], '#ffffff', 0.3);
  }, { leafy: true });
  deck.proto('berryFar', (g) => {
    const a = [-0.22, 0.02, -0.12], b = [0.22, 0.02, -0.12], c = [0, 0.27, 0.05], d = [0, 0.02, 0.18];
    g.tint(1).tri(b, a, c, '#ffffff').tri(d, b, c, '#d0d0d0').tri(a, d, c, '#d0d0d0').tint(0);
    g.tri([0.1, -0.15, -0.2], [-0.1, -0.15, -0.2], [0, -0.03, -0.19], RED, 0.3).tri([0.05, 0.16, -0.1], [-0.05, 0.16, -0.1], [0, 0.26, -0.09], '#ffffff', 0.3);
  }, { leafy: true });
  deck.proto('picker', pickerShape);
  // a crate of fruit on its way out
  deck.proto('fruit', (g) => {
    g.box(-0.28, 0, -0.2, 0.28, 0.2, 0.2, '#d8d2c6', { skip: 't' }).box(-0.25, 0.14, -0.17, 0.25, 0.19, 0.17, '#c22a1e');
    for (let i = 0; i < 6; i++) gem(g, -0.18 + (i % 3) * 0.18, 0.21, -0.08 + Math.floor(i / 3) * 0.16, 0.06, 0.04, 0.06, i % 4 ? '#d8261a' : '#e2452a', 0.2);
  });
  // the aisle's floor is dark and polished: it holds the bars of lamps, which are drawn again upside down beneath it
  const n = 10, dx = (RX1 - RX0) / n, fg = new Geo({ maxSeg: 8 });
  for (let i = 0; i < n; i++) {
    const x0 = RX0 + i * dx, x1 = x0 + dx, b = deck.bucket((x0 + x1) / 2, 0, 'racks'), g = b.g;
    fg.floor(x0, -RH - 0.9, x1, RH + 0.9, RY, '#6a5562');
    g.floor(x0, -5.4, x1, 5.4, HTOP, '#5a5258', { down: true, emit: 0.1 });
    g.box(x0, HTOP - 0.5, -0.25, x1, HTOP - 0.3, 0.25, '#4a444c', { skip: 'we' });        // a cable tray down the middle of the ceiling
    for (const s of [-1, 1]) {
      wallZ(g, x0, x1, RY - 20, HTOP, s * 5.4, -s, panel);
      for (let t = 0; t < TIERS; t++) {
        const y = tierY(t), za = s * 4.5, zb = s * 4.88, yl = y + TIER - 0.2;
        g.box(x0, y - 0.11, Math.min(za, zb), x1, y, Math.max(za, zb), '#c9c4ca', { skip: 'we' });
        g.box(x0, yl, s * 4.7 - 0.045, x1, yl + 0.07, s * 4.7 + 0.045, LED, { emit: 2.8 * k, skip: 'wet' });
        g.box(x0, 2 * RY - yl - 0.07, s * 4.7 - 0.045, x1, 2 * RY - yl, s * 4.7 + 0.045, LED, { emit: 2.8 * k, skip: 'web' });
        g.box(x0, y - 0.27, s * 4.5 - 0.02, x1, y - 0.22, s * 4.5 + 0.02, '#3a363c', { skip: 'we' });
        if (clk.due()) { yield 'tansy: rack tiers'; clk.go(); }
      }
      for (let x = x0; x < x1 - 0.1; x += dx / 2) { const za = s * 4.45, zb = s * 4.55; g.box(x - 0.05, RY, Math.min(za, zb), x + 0.05, HTOP, Math.max(za, zb), '#3d3840', { skip: 'tb' }); }
      if (clk.due()) { yield 'tansy: racks'; clk.go(); }
    }
    if (clk.due()) { yield 'tansy: racks'; clk.go(); }
  }
  wallX(deck.bucket(RX0 + 1, 0, 'racks').g, -5.4, 5.4, RY, HTOP, RX0, 1, panel);
  const floor = fg.mesh(litMaterial(deck.rig, { bend: deck.frame, transparent: true, opacity: 0.8 }), deck.frame);
  floor.renderOrder = 3; deck.group.add(floor);
  // the plants: modelled in full where the flight passes close, in a few faces from the middle distance, as five beyond
  const greens = ['#3f6a4a', '#44705a', '#2f5a48', '#4f7a5c', '#3a6650'];
  for (const s of [-1, 1]) for (let t = 0; t < TIERS; t++) {
    const y = tierY(t);
    for (let x = RX0 + 0.3; x < RX1 - 0.2; x += 0.46) {
      const xx = x + rng.f(-0.06, 0.06), d = deck.dist(xx, y, s * 4.6);
      deck.put(d < 5.6 ? (rng() < 0.6 ? 'berry' : 'berry2') : d < 12.5 ? 'berryMid' : 'berryFar', { p: [xx, y, s * 4.69], yaw: s > 0 ? 0 : Math.PI, scale: rng.f(0.9, 1.2), color: shade(rng.pick(greens), rng.f(0.85, 1.15)) });
    }
    if (clk.due()) { yield 'tansy: strawberries'; clk.go(); }
  }
  // the pickers, each on its own tier, going one way or the other; they vanish into the end wall and come round again
  const pickers = [], span = (RX1 + 5) - (RX0 - 6);
  const tiersUsed = [[1, 13], [-1, 9], [1, 3], [-1, 5], [1, 0], [-1, 13], [1, 16], [-1, 1], [1, 4], [-1, 16], [1, 12], [-1, 8], [1, 15], [-1, 6]];
  tiersUsed.forEach(([s, t], i) => {
    const v = (i % 3 === 1 ? -1 : 1) * rng.f(0.5, 1.0), loop = span / Math.abs(v), x = v > 0 ? RX0 - 6 : RX1 + 5, y = tierY(t) - 0.25, z = s * 4.5;
    const phase = ((i * 0.381966 + 0.1) % 1), item = { p: [x, y, z], yaw: s > 0 ? 0 : Math.PI, drift: [v, 0, 0, loop], phase };
    deck.put('picker', item);
    for (let j = 0; j < 3; j++) deck.glow([{ p: [x, y + 0.62 + j * TIER, s * 4.38], color: '#fff3e0', power: 2.0, size: 0.42, move: [v, 0, 0], loop, phase }]);
    pickers.push({ x, y: y + 0.35, z: s * 4.62, v, loop, phase });
  });
  // one more, on the tiers the flight passes: a mesh of its own, so that the eye meets it where the world chooses
  const hg = new Geo({ maxSeg: 8 }), hy = tierY(HERO[0]) - 0.25;
  hg.at(0, hy, 4.5); pickerShape(hg); hg.pop();
  const hero = hg.mesh(deck.prop, deck.frame);
  deck.group.add(hero);
  pickers.push({ hero, y: hy + 0.35, z: 4.62, at: (t) => HERO[1] + HERO[2] * t });
  // light: each tier is lit by its own bar (one lattice, a storey to a tier), and the aisle has a little of their colour
  deck.lattice({ origin: [RX0 + 0.5, tierY(0) + TIER - 0.2, -4.7], spacing: [1, 9.4], count: [Math.round(RX1 - RX0), 2], storeys: TIERS, rise: TIER, drop: TIER - 0.12, above: 0.1, color: '#ff5a98', power: 1.9, reach: 0.75 });
  deck.zone({ min: [RX0 - 8, RY - 0.5, -5.5], max: [RX1 + 0.3, HTOP + 0.2, 5.5], soft: 0.3, color: '#ff4f9a', power: 0.42, side: 0.9, under: 0.8 });
  yield 'tansy: racks';
  return { pickers };
}

// The crate lock: the racks' air is not for breathing, so the way out is a small room with a door at each end. Its
// leaves are meshes of their own, parted by set(a, b): a for the racks' door, b for the hall's, 0 shut and 1 open.
function buildLock(deck, steel) {
  const b = deck.bucket(-3, 0, 'lock'), g = b.g, k = deck.glowK;
  const x0 = LOCK[0], x1 = LOCK[1], zw = 1.6, y0 = LY, y1 = LY + 2.9, dh = 2.6, dw = 1.3, wall = '#c9c4bc', panel = '#6a5560', LW = 2.6;
  // the aisle's end wall round the door, its name on it, and a landing in front of the door
  wallX(g, -5.4, -zw, RY - 20, HTOP, x0, -1, panel); wallX(g, zw, 5.4, RY - 20, HTOP, x0, -1, panel); wallX(g, -zw, zw, RY - 20, y0, x0, -1, panel); wallX(g, -zw, zw, y1, HTOP, x0, -1, panel);
  deck.sign(['Runnerfield', 'Aisle 7'], { at: [x0 - 0.03, 21.4, 0], n: [-1, 0], w: 7.2, h: 2.6, style: 'board', font: 'serif', font2: 'cond', ground: panel, ink: '#f6d6e2', glow: 0.5 });
  g.box(x0 - 4, y0 - 0.12, -LW, x0, y0, LW, '#4f5254', { top: '#5c6063' });
  for (const s of [-1, 1]) {
    const a = s * 1.7, e = s * LW;
    g.box(x0 - 4.03, y0 + 1.04, Math.min(a, e), x0 - 3.97, y0 + 1.1, Math.max(a, e), IRON).box(x0 - 4.02, y0 + 0.52, Math.min(a, e), x0 - 3.98, y0 + 0.56, Math.max(a, e), IRON2);
    g.box(x0 - 4, y0 + 1.04, e - 0.03, x0, y0 + 1.1, e + 0.03, IRON).box(x0 - 4, y0 + 0.52, e - 0.02, x0, y0 + 0.56, e + 0.02, IRON2);
    for (const x of [x0 - 4, x0 - 2.7, x0 - 1.4, x0 - 0.1]) g.box(x - 0.03, y0, e - 0.03, x + 0.03, y0 + 1.04, e + 0.03, IRON, { skip: 'tb' });
    g.box(x0 - 4.03, y0, a - 0.03, x0 - 3.97, y0 + 1.04, a + 0.03, IRON, { skip: 'tb' });
    g.tube([[x0 - 3.9, y0 - 0.15, s * 2.2], [x0 - 0.1, y0 - 2.6, s * 2.2]], 0.06, 4, IRON2);
    // a crate lift either side of the landing: fruit going up from the aisle's floor to a hatch in the wall
    const lz = s * 3.5;
    for (const dz of [-0.36, 0.36]) g.box(x0 - 0.75, RY, lz + dz - 0.03, x0 - 0.69, y0 + 1.5, lz + dz + 0.03, '#3d3840', { skip: 'tb' });
    wallX(g, lz - 0.4, lz + 0.4, y0 + 0.5, y0 + 1.3, x0 - 0.02, -1, '#1c1418');
    for (let i = 0; i < 6; i++) deck.put('fruit', { p: [x0 - 0.42, RY + 0.2, lz], yaw: 0, drift: [0, 0.55, 0, 7.5 / 0.55], phase: (i / 6 + (s > 0 ? 0 : 0.08)) % 1 });
  }
  // the crews here go hooded and masked: two on the landing, three far below on the aisle's floor
  deck.proto('hood', (g2) => { g2.blob(0, 1.6, 0, [0.2, 0.31, 0.2], 1, '#e9e4dc', { shadeBottom: 0.8 }).box(-0.13, 1.56, 0.15, 0.13, 1.7, 0.215, '#2a2a30'); });
  const crew = [{ p: [x0 - 1.1, y0, -2.0], yaw: 2.4 }, { p: [x0 - 2.6, y0, 2.05], yaw: -1.2 }, { p: [x0 - 30, RY, 2.6], yaw: 1.2 }, { p: [x0 - 31.2, RY, 2.2], yaw: -1.9 }, { p: [x0 - 52, RY, -2.4], yaw: 0.4 }];
  for (const c of crew) { deck.put('hood', { p: c.p, yaw: c.yaw }); c.color = '#d9d4c8'; }
  deck.people(crew);
  deck.sign(['Racks', 'Masks on before the inner door.'], { at: [(x0 + x1) / 2, y0 + 1.75, -zw + 0.012], n: [0, 1], w: 1.5, h: 0.62, style: 'paper', font2: 'serif' });
  // the room: pale walls, a strip of light along each, a grating floor
  b.f.tint(0).floor(x0, -zw, x1, zw, y0, '#8f8c88', { emit: 0.7 });
  g.floor(x0, -zw, x1, zw, y1, '#f1ede6', { down: true, emit: 0.5 });
  wallZ(g, x0, x1, y0, y1, zw, -1, wall); wallZ(g, x0, x1, y0, y1, -zw, 1, wall);
  for (const s of [-1, 1]) { const za = s * (zw - 0.06), zb = s * zw; g.box(x0 + 0.4, y1 - 0.34, Math.min(za, zb), x1 - 0.4, y1 - 0.22, Math.max(za, zb), '#fff6ea', { emit: 3.2 * k, skip: 'we' }); wallZ(g, x0, x1, y0, y0 + 0.9, s * (zw - 0.012), -s, shade(IRON, 0.9)); }
  deck.glow([{ p: [(x0 + x1) / 2, y1 - 0.3, 0], color: '#fff3e0', power: 1.2 * k, size: 1.6 }]);
  // a frame round each door, and a lamp over it
  for (const [x, f] of [[x0, -1], [x1, 1]]) {
    const xa = Math.min(x, x + f * 0.16), xb = Math.max(x, x + f * 0.16);
    g.box(xa, y0, -zw, xb, y0 + dh, -dw, IRON2, { skip: 'b' }).box(xa, y0, dw, xb, y0 + dh, zw, IRON2, { skip: 'b' }).box(xa, y0 + dh, -zw, xb, y1, zw, IRON2);
    g.box(x + f * 0.16, y0 + dh + 0.08, -0.22, x + f * 0.2, y0 + dh + 0.2, 0.22, '#b9f0c0', { emit: 3 * k });
    deck.glow([{ p: [x + f * 0.24, y0 + dh + 0.14, 0], color: '#b9f0c0', power: 1.3 * k, size: 0.5 }]);
  }
  deck.zone({ min: [x0 + 0.1, y0 - 0.2, -zw], max: [x1 - 0.1, y1 + 0.1, zw], soft: 0.25, color: '#fff4e6', power: 0.3, side: 0.85, under: 0.5 });
  // the four leaves: steel, each with a square of glass, sliding along the wall's outer face
  const leaves = [];
  for (const [x, f, which] of [[x0, -1, 0], [x1, 1, 1]]) for (const sd of [-1, 1]) {
    const lg = new Geo({ maxSeg: 8 }), za = sd < 0 ? -dw : 0.006, zb = sd < 0 ? -0.006 : dw, xa = Math.min(x + f * 0.02, x + f * 0.1), xb = Math.max(x + f * 0.02, x + f * 0.1), zm = (za + zb) / 2;
    lg.tint(1).box(xa, y0 + 0.02, za, xb, y0 + dh, zb, STEEL);
    lg.tint(0).box(xa - 0.006, y0 + 0.05, za + 0.04, xb + 0.006, y0 + 0.4, zb - 0.04, METH, { skip: 'tb' });
    lg.box(xa - 0.008, y0 + 1.42, zm - 0.24, xb + 0.008, y0 + 1.9, zm + 0.24, which ? '#ffd9a0' : '#ff7fb4', { emit: 1.6, skip: 'tb' });
    const m = lg.mesh(steel, deck.frame); deck.group.add(m); leaves.push([m, sd, which]);
  }
  return { leaves: leaves.map((l) => l[0]), set(a, c) { for (const [m, sd, which] of leaves) m.position.z = sd * (dw + 0.04) * clamp(which ? c : a, 0, 1); } };
}

// ---------------------------------------------------------------- the vat hall
// A vat: closed steel, jacketed, 16 m to the top of its dome, standing on a skirt. Modelled at the origin with its
// working side (gauge, ladder, pipes) toward -z. level 0 is for near, 1 for the middle distance, 2 for far off.
function vatGeo(level) {
  const g = new Geo(), n = level === 0 ? 20 : level === 1 ? 14 : 8, R = 4.4;
  const st = STEEL, st2 = shade(STEEL, 0.9), dk = shade(STEEL, 0.6);
  if (level < 2) g.tint(0).cyl(0, 0, 0, R + 0.35, R + 0.35, 0.35, n, '#8d8880', { smooth: false, top: '#9a958d' });
  g.tint(0.6).cyl(0, 0.35, 0, R - 0.3, R - 0.3, 2.05, n, dk, { cap: false, smooth: true });
  g.tint(1);
  if (level === 0) {
    // the body in four courses of plate, and hoops where the jacket is banded
    const ys = [2.4, 5.3, 8.2, 11.1, 14.0];
    for (let k = 0; k < 4; k++) g.cyl(0, ys[k], 0, R, R, ys[k + 1] - ys[k], n, k % 2 ? st2 : st, { cap: false });
    for (const y of [2.4, 8.1, 13.8]) g.cyl(0, y, 0, R + 0.07, R + 0.07, 0.22, n, shade(STEEL, 0.78), { cap: false });
  } else g.cyl(0, 2.4, 0, R, R, 11.6, n, st, { cap: false, smooth: true });
  g.cyl(0, 14.0, 0, R, 1.5, 1.7, n, shade(STEEL, 1.05), { cap: false, smooth: true });
  g.cyl(0, 15.7, 0, 1.5, 0.75, 0.35, n, st2, { cap: level === 2, smooth: true });
  if (level === 2) return g.build();
  g.tint(0.8).cyl(0, 16.05, 0, 0.75, 0.75, 0.4, 10, dk, { top: st2, smooth: true });
  g.tint(0).box(-0.5, 16.45, -0.5, 0.5, 17.25, 0.5, IRON, { skip: 'b' }).box(-0.14, 17.25, -0.14, 0.14, 17.42, 0.14, '#2f2a2a', { skip: 'b' });
  // the level glass: how full it stands
  g.box(-1.32, 3.2, -R - 0.09, -1.1, 13.2, -R + 0.05, '#2b2f33', { skip: 's' });
  g.box(-1.27, 3.3, -R - 0.11, -1.15, 10.4, -R - 0.08, '#ffd9a0', { emit: 1.5, skip: 's' });
  if (level === 1) return g.build();
  g.tint(1).cyl(1.6, 15.0, 1.3, 0.17, 0.17, 3.3, 6, st2, { cap: false }).tint(0.6).cyl(1.6, 18.3, 1.3, 0.32, 0.06, 0.26, 6, dk);
  // a ladder up the working side, the feed coming down in yellow, the warm loop going out and back in copper
  g.tint(0);
  for (const x of [1.95, 2.45]) g.box(x - 0.03, 0.35, -R - 0.34, x + 0.03, 15.2, -R - 0.28, METH, { skip: 'tb' });
  for (let y = 1.0; y < 15; y += 1.15) g.box(1.95, y - 0.02, -R - 0.33, 2.45, y + 0.02, -R - 0.29, shade(METH, 0.85), { skip: 'we' });
  g.cyl(-2.7, 2.5, -3.62, 0.13, 0.13, 11.75, 6, METH, { cap: false }).tube([[-2.7, 14.2, -3.6], [-2.7, 14.3, -5.4]], 0.13, 6, METH);
  g.cyl(-2.7, 3.1, -3.62, 0.3, 0.3, 0.07, 8, '#b5404a', { smooth: false, base: true });
  for (const [x, z] of [[3.1, -3.25], [3.6, -2.7]]) { g.cyl(x, 2.5, z, 0.16, 0.16, 11.7, 6, COPPER, { cap: false }).tube([[x, 14.15, z], [x, 14.35, -5.6]], 0.16, 6, COPPER); g.cyl(x, 3.4, z, 0.3, 0.3, 0.07, 8, '#b5404a', { smooth: false, base: true }); }
  g.box(-0.6, 4.55, -R - 0.06, 0.6, 5.45, -R + 0.05, '#2f2a2a', { skip: 's' });
  return g.build();
}

// a walkway of steel grating along x with a rail on one or both edges (rails: 1 the z0 edge, 2 the z1 edge, 3 both)
function walk(g, x0, x1, z0, z1, y, fine, rails = 3) {
  g.box(x0, y - 0.1, z0, x1, y, z1, '#6c6f72', { skip: 'we', top: '#84888b' });
  for (const [z, on] of [[z0, rails & 1], [z1, rails & 2]]) {
    if (!on) continue;
    g.box(x0, y + 1.04, z - 0.03, x1, y + 1.1, z + 0.03, IRON, { skip: 'we' });
    if (!fine) continue;
    g.box(x0, y + 0.52, z - 0.02, x1, y + 0.56, z + 0.02, IRON2, { skip: 'we' }).box(x0, y, z - 0.012, x1, y + 0.12, z + 0.012, IRON2, { skip: 'we' });
    for (let x = x0; x < x1 - 0.5; x += 2.6) g.box(x - 0.03, y, z - 0.03, x + 0.03, y + 1.04, z + 0.03, IRON, { skip: 'tb' });
  }
}
// the same lying along z, w to either side of x
function crossWalk(g, x, z0, z1, y, fine, w = 0.7) {
  g.box(x - w, y - 0.1, z0, x + w, y, z1, '#6c6f72', { skip: 'ns', top: '#84888b' });
  for (const xr of [x - w, x + w]) {
    g.box(xr - 0.03, y + 1.04, z0, xr + 0.03, y + 1.1, z1, IRON, { skip: 'ns' });
    if (!fine) continue;
    g.box(xr - 0.02, y + 0.52, z0, xr + 0.02, y + 0.56, z1, IRON2, { skip: 'ns' });
    for (let z = z0 + 0.4; z < z1; z += 2.4) g.box(xr - 0.03, y, z - 0.03, xr + 0.03, y + 1.04, z + 0.03, IRON, { skip: 'tb' });
  }
}

// The hall: a nave between four ranks of vats, gantries at their shoulders, the roof on frames every second bay.
function* buildHall(deck, rng) {
  const clk = deck.clk, k = deck.glowK;
  const wallC = '#b3a594', dadoC = '#77706a', floorN = '#a69f97', floorV = '#8a857f', roofC = '#a09689', beamC = '#b0a496';
  const lamps = [], vats = [[], [], []];
  for (let i = 0; i < NB; i++) {
    const x0 = i * BAY, x1 = x0 + BAY, xm = x0 + BAY / 2, b = deck.bucket(xm, 0, 'hall'), g = b.g, f = b.f;
    const d = deck.dist(xm, 10, 0), fine = d < 140, mid = d < 330;
    // the floor: polished screed down the nave between two painted lines, duller under the vats
    f.tint(0).floor(x0, -NAVE, x1 - 0.07, NAVE, 0, floorN, { emit: 0.9 }).floor(x1 - 0.07, -NAVE, x1, NAVE, 0, shade(floorN, 0.55), { emit: 0.3 });
    for (const s of [-1, 1]) {
      const a = s * NAVE, c = s * (NAVE + 0.3), e = s * HZ;
      f.floor(x0, Math.min(a, c), x1, Math.max(a, c), 0, METH, { emit: 0.5 }).floor(x0, Math.min(c, e), x1, Math.max(c, e), 0, floorV, { emit: 0.4 });
      // the wall: a dado, plaster above, a ledge at every deck, and here and there the lit window of a plant room
      const board = s > 0 && x0 >= BOARD[0] - 1 && x1 <= BOARD[1] + 1;
      wallZ(g, x0, x1, 0, 2.2, e, -s, dadoC);
      if (board) { wallZ(g, x0, x1, 2.2, BOARD[2] + 0.8, e, -s, wallC); wallZ(g, x0, x1, BOARD[3] - 0.6, HTOP, e, -s, wallC); } else wallZ(g, x0, x1, 2.2, HTOP, e, -s, wallC);
      for (let dk = 1; dk <= 6; dk++) {
        const y = dk * 4, zi = e - s * 0.2;
        if (mid && !(board && dk >= 5)) g.box(x0, y - 0.3, Math.min(zi, e), x1, y, Math.max(zi, e), shade(wallC, 0.82), { skip: 'we' + (s > 0 ? 's' : 'n') });
        if (dk >= 3 && !(board && dk >= 4) && rng() < 0.3) { const u = x0 + rng.f(1, 4), w = rng.f(3, 7); wallZ(g, u, Math.min(x1 - 0.5, u + w), y + 1.0, y + 2.5, e - s * 0.03, -s, rng.pick(TANSY.window), rng.f(0.8, 2.2) * k); }
      }
      if (clk.due()) { yield 'tansy: hall walls'; clk.go(); }
      // gantries: one along the nave side of each rank, one along the wall
      const z1 = s * 8.3, z2 = s * 9.9, z3 = s * 20.0, z4 = s * 21.6, z5 = s * 34.4;
      walk(g, x0, x1, Math.min(z1, z2), Math.max(z1, z2), GY, fine, 3);
      walk(g, x0, x1, Math.min(z3, z4), Math.max(z3, z4), GY, fine, 3);
      if (mid) walk(g, x0, x1, Math.min(z5, e), Math.max(z5, e), GY, fine, s > 0 ? 1 : 2);
      if (clk.due()) { yield 'tansy: hall gantries'; clk.go(); }
      // the headers slung under them: the warm loop in copper, methanol in yellow, water in blue
      if (mid) { pipeX(g, x0, x1, GY - 0.55, s * 8.8, 0.3, COPPER, 8); pipeX(g, x0, x1, GY - 0.45, s * 9.55, 0.19, METH, 6); pipeX(g, x0, x1, GY - 0.5, s * 20.5, 0.22, WATER, 6); pipeX(g, x0, x1, GY - 0.55, s * 21.15, 0.3, shade(COPPER, 0.8), 8); }
      // an air duct along the wall
      if (mid) { const za = s * 34.7, zb = s * 35.9; g.box(x0, 18.4, Math.min(za, zb), x1, 19.5, Math.max(za, zb), '#c3c7c9', { skip: 'we' }); if (fine) wallZ(g, x0 + 5, x0 + 8, 18.6, 19.3, za - s * 0.02, -s, '#3a3d40'); }
      g.box(x0, 26.15, s * 7.75 - 0.2, x1, HTOP, s * 7.75 + 0.2, beamC, { skip: 'twe' }).box(x0, 26.15, s * 22.4 - 0.2, x1, HTOP, s * 22.4 + 0.2, beamC, { skip: 'twe' });
      // the crane's rail, as far as it runs
      if (x1 <= CRANE_END) { g.box(x0, 22.2, s * 7.5 - 0.1, x1, 22.48, s * 7.5 + 0.1, IRON2, { skip: 'we' }); if (i % 2 === 0) g.box(x0 - 0.25, 21.8, s * 7.5 - 0.2, x0 + 0.25, 22.2, s * 7.5 + 0.2, IRON2); }
    }
    if (clk.due()) { yield 'tansy: hall pipes'; clk.go(); }
    // the roof, left open where the well goes up
    const holeA = WX - 4, holeB = WX + 4;
    if (x1 <= holeA || x0 >= holeB) g.floor(x0, -HZ, x1, HZ, HTOP, roofC, { down: true, emit: 0.1 });
    else {
      const a = Math.max(x0, holeA), c = Math.min(x1, holeB);
      if (a > x0) g.floor(x0, -HZ, a, HZ, HTOP, roofC, { down: true, emit: 0.1 });
      if (c < x1) g.floor(c, -HZ, x1, HZ, HTOP, roofC, { down: true, emit: 0.1 });
      g.floor(a, -HZ, c, -4, HTOP, roofC, { down: true, emit: 0.1 }).floor(a, 4, c, HZ, HTOP, roofC, { down: true, emit: 0.1 });
    }
    if (clk.due()) { yield 'tansy: hall roof'; clk.go(); }
    if (i % 2 === 0) {
      // a frame: four columns and a girder across, with a lamp hung by each outer column
      g.box(x0 - 0.3, 25.5, -HZ, x0 + 0.3, HTOP, HZ, beamC, { skip: 't' });
      for (const z of [-22.4, -7.75, 7.75, 22.4]) g.box(x0 - 0.28, 0, z - 0.28, x0 + 0.28, 25.5, z + 0.28, beamC, { skip: 'tb' });
      for (const s of [-1, 1]) { g.box(x0 - 0.2, GY - 0.5, s * 7.9 - 0.4, x0 + 0.2, GY - 0.1, s * 7.9 + 0.4, IRON2); lamps.push([x0, s * 20.8, mid]); if (mid) crossWalk(g, x1, Math.min(s * 9.9, s * 20.0), Math.max(s * 9.9, s * 20.0), GY, fine); }
    } else for (const s of [-1, 1]) { g.box(x0 - 0.08, 0, s * 8.3 - 0.08, x0 + 0.08, GY - 0.1, s * 8.3 + 0.08, IRON2, { skip: 'tb' }); if (mid) crossWalk(g, x1, Math.min(s * 21.6, s * 34.4), Math.max(s * 21.6, s * 34.4), GY, fine); }
    if (clk.due()) { yield 'tansy: hall frames'; clk.go(); }
    for (const s of [-1, 1]) lamps.push([xm, s * 4.5, true]);
    // a bridge over the nave every eighth bay
    if (i % 8 === 4) crossWalk(g, x0, -8.3, 8.3, GY, mid, 0.8);
    for (let r = 0; r < 4; r++) { const z = RANKS[r], dv = deck.dist(xm, 9, z); vats[dv < 95 ? 0 : dv < 300 ? 1 : 2].push({ p: [xm, 0, z], yaw: z > 0 ? 0 : Math.PI, color: shade(mixc('#ffffff', '#f2e2c8', rng() * rng()), rng.f(0.86, 1.04)), bay: i, rank: r, near: dv }); }
    if (clk.due()) { yield 'tansy: hall vats'; clk.go(); }
  }
  return { lamps, vats };
}

// The hall's lamps and light, its end walls, the vats themselves, steam, and the crews.
function* dressHall(deck, hall, rng, steel) {
  const clk = deck.clk, k = deck.glowK, frame = deck.frame, wallC = '#b3a594', vatMeshes = [];
  for (const [x, z, near] of hall.lamps) {
    deck.glow([{ p: [x, 24.3, z], color: '#ffe6c0', power: 1.9 * k, size: 0.85 }]);
    if (!near || deck.dist(x, 20, z) > 230) continue;
    const g = deck.bucket(x, 0, 'hall').g;
    g.cyl(x, 24.42, z, 0.5, 0.36, 0.34, 8, '#3a3b3c', { smooth: false }).cyl(x, 24.4, z, 0.46, 0.46, 0.03, 8, '#fff1d6', { emit: 7 * k, smooth: false, base: true, cap: false });
    g.box(x - 0.025, 24.76, z - 0.025, x + 0.025, 26.2, z + 0.025, '#3a3b3c', { skip: 'tb' });
    if (clk.due()) { yield 'tansy: lamps'; clk.go(); }
  }
  yield 'tansy: lamps';
  {
    // the anti end: the lock's door at gantry level, and a landing in front of it that joins the two nave gantries
    const g = deck.bucket(1, 0, 'hall').g;
    wallX(g, -HZ, -1.6, 0, HTOP, 0, 1, wallC); wallX(g, 1.6, HZ, 0, HTOP, 0, 1, wallC); wallX(g, -1.6, 1.6, 0, LY, 0, 1, wallC); wallX(g, -1.6, 1.6, LY + 2.9, HTOP, 0, 1, wallC);
    g.box(0, LY - 0.12, -8.3, LAND, LY, 8.3, '#4f5254', { top: '#5c6063' });
    for (const s of [-1, 1]) {
      const a = s * 1.9, e = s * 8.3;
      g.box(LAND - 0.03, LY + 1.04, Math.min(a, e), LAND + 0.03, LY + 1.1, Math.max(a, e), IRON).box(LAND - 0.02, LY + 0.52, Math.min(a, e), LAND + 0.02, LY + 0.56, Math.max(a, e), IRON2);
      for (let z = 1.9; z < 8.4; z += 1.6) g.box(LAND - 0.03, LY, s * z - 0.03, LAND + 0.03, LY + 1.04, s * z + 0.03, IRON, { skip: 'tb' });
      g.box(0.2, LY - 0.12 - 2.4, s * 6 - 0.08, 0.36, LY - 0.12, s * 6 + 0.08, IRON2).tube([[0.3, LY - 2.4, s * 6], [LAND - 0.2, LY - 0.2, s * 6]], 0.07, 4, IRON2);
    }
    wallX(deck.bucket(HX1 - 1, 0, 'hall').g, -HZ, HZ, 0, HTOP, HX1, -1, wallC);
  }
  // light: the roof's own even light, and the lamps over the nave and between the ranks, which the steel and the floor hold
  deck.zone({ min: [0, -1, -HZ], max: [HX1, HTOP + 0.3, HZ], soft: 2.5, color: '#dfe8ec', power: 0.2, side: 0.5, under: 0.9 });
  deck.lattice({ origin: [BAY / 2, 24.4, -4.5], spacing: [BAY, 9], count: [NB, 2], color: '#ffd6a2', power: 2.2, reach: 15, drop: 26 });
  deck.lattice({ origin: [0, 24.4, -20.8], spacing: [2 * BAY, 41.6], count: [35, 2], color: '#ffe6c8', power: 1.5, reach: 15, drop: 26 });
  // the vats, by distance
  for (let l = 0; l < 3; l++) { for (const m of instances(vatGeo(l), steel, hall.vats[l], { frame, cell: 420 })) { deck.group.add(m); vatMeshes.push(m); } yield 'tansy: vats'; }
  for (const list of hall.vats) for (const v of list) {
    const [x, , z] = v.p, s = z > 0 ? 1 : -1;
    deck.glow([{ p: [x, 17.6, z], color: '#8df0a8', power: 2.0, size: 0.5 }]);
    if (v.near < 46) deck.sign('ABCD'[v.rank] + ' ' + (v.bay + 1), { at: [x, 5.0, z - s * 4.47], n: [0, -s], w: 1.1, h: 0.8, style: 'plate', font: 'cond' });
    // steam from a vent here and there, going up to the roof
    if ((v.bay * 7 + v.rank * 3) % 9 === 0 && v.near < 260) for (let j = 0; j < 12; j++) deck.glow([{ p: [x + s * 1.6 + rng.f(-0.3, 0.3), 18.6 + rng.f(0, 0.6), z + s * 1.3 + rng.f(-0.3, 0.3)], color: '#fff3e6', power: rng.f(0.09, 0.17), size: rng.f(1.4, 4.2), move: [rng.f(0.05, 0.3), rng.f(0.5, 0.85), rng.f(-0.1, 0.1)], loop: rng.f(7.5, 10.5), phase: rng() }]);
    if (clk.due()) { yield 'tansy: vats'; clk.go(); }
  }
  // on the floor: sacked flour on pallets along the nave's edges, tugs with two trailers each going up and down one
  // side of it, cleaning robots crossing, hands in twos and threes
  deck.proto('sacks', (g) => {
    g.box(-0.62, 0, -0.52, 0.62, 0.12, 0.52, '#8a6a44');
    for (let l = 0; l < 4; l++) { const i = l % 2 ? 0.04 : 0; g.box(-0.58 + i, 0.12 + l * 0.21, -0.48 + i, 0.58 - i, 0.33 + l * 0.21, 0.48 - i, l % 2 ? '#e9e2d2' : '#dbd2bf', { skip: 'b' }); }
    g.tint(1).box(-0.59, 0.5, -0.49, 0.59, 0.58, 0.49, '#ffffff', { skip: 'tb' }).tint(0);
  });
  deck.proto('tug', (g) => {
    g.tint(1).box(-0.8, 0.12, -0.42, 0.8, 0.62, 0.42, '#ffffff', { skip: 'b' }).tint(0).box(0.2, 0.62, -0.36, 0.7, 1.0, 0.36, '#3a3b3c', { skip: 'b' });
    g.box(0.74, 0.3, -0.3, 0.81, 0.42, 0.3, '#fff0c8', { emit: 4 }).box(0.3, 1.0, -0.06, 0.42, 1.14, 0.06, '#ffb24a', { emit: 5 });
    for (const x of [-2.7, -5.0]) { g.box(x - 1.0, 0.2, -0.46, x + 1.0, 0.3, 0.46, '#5a5c5e'); for (const dx of [-0.48, 0.48]) g.box(x + dx - 0.42, 0.3, -0.4, x + dx + 0.42, 0.3 + (dx < 0 ? 0.84 : 0.63), 0.4, dx < 0 ? '#e3dccb' : '#d6cdb8', { skip: 'b' }); g.box(x + 1.0, 0.24, -0.03, x + 1.5, 0.28, 0.03, '#3a3b3c'); }
  });
  const lineCol = ['#8c4a4f', '#3f6f6a', '#cfa93a', '#51627a'];
  for (let i = 1; i < NB; i++) for (const s of [-1, 1]) {
    const x = i * BAY + (i % 2 ? 3.2 : -3.2), z = s * (NAVE - 0.95);
    if (rng() < 0.42 && deck.dist(x, 1, z) < 200 && deck.clear(x, 1.2, z, 3)) for (let j = 0; j < 1 + Math.floor(rng() * 3); j++) deck.put('sacks', { p: [x + j * 1.4, 0, z + rng.f(-0.1, 0.1)], yaw: rng.f(-0.06, 0.06), color: lineCol[(i >> 3) % 4] });
  }
  for (let i = 0; i < 9; i++) for (const d of [1, -1]) {
    const v = d * rng.f(1.9, 2.5), loop = (HX1 - 8) / Math.abs(v);
    deck.put('tug', { p: [d > 0 ? 4 : HX1 - 4, 0, d > 0 ? 3.4 : 5.7], yaw: d > 0 ? 0 : Math.PI, color: rng.pick(['#cfa93a', '#8c4a4f', '#d9d4c8']), drift: [v, 0, 0, loop], phase: (i / 9 + (d > 0 ? 0.03 : 0.5) + rng.f(-0.02, 0.02)) % 1 });
  }
  for (let i = 0; i < 16; i++) { const x = 60 + i * 31 + rng.f(-8, 8), d = rng.sign(); deck.put('robot', { p: [x, 0, -d * 7], yaw: d > 0 ? Math.PI : 0, drift: [0, 0, d * 0.45, 14 / 0.45], phase: rng(), color: '#d9d4c8' }); }
  const hands = [];
  for (let i = 0; i < 26; i++) {
    const x = rng.f(20, 420), s = rng.sign(), z = s * rng.f(5.6, 6.8);
    if (!deck.clear(x, 1.2, z, 3.2)) continue;
    // two or three standing talking (no children on the vat floor)
    const n = 2 + Math.floor(rng() * 2), a0 = rng.f(0, TAU);
    for (let j = 0; j < n; j++) { const a = a0 + (j / n) * TAU + rng.f(-0.25, 0.25), px = x + Math.cos(a) * 0.7, pz = z + Math.sin(a) * 0.7; hands.push({ p: [px, 0, pz], yaw: Math.atan2(x - px, z - pz) }); }
    if (rng() < 0.4) hands.push({ p: [x + rng.f(-3, 3), 0, s * rng.f(8.7, 9.3)], walk: rng.f(0.4, 0.7) });
  }
  deck.people(hands);
  {
    // the drum's motto, on a frame over the first bridge, for whoever comes out of the lock
    const g = deck.bucket(52, 0, 'hall'), bx = 51.2;
    for (const z of [-5.6, 5.6]) g.g.box(bx - 0.05, GY + 1.1, z - 0.05, bx + 0.05, GY + 3.1, z + 0.05, IRON2, { skip: 'b' });
    g.c.quad([bx, GY + 1.5, 5.5], [bx, GY + 1.5, -5.5], [bx, GY + 3.05, -5.5], [bx, GY + 3.05, 5.5], '#7c3b42');
    deck.sign('Keep a copy.', { at: [bx - 0.02, GY + 2.28, 0], n: [-1, 0], w: 10.6, h: 1.4, style: 'board', font: 'serif', ground: '#7c3b42', ink: '#fff3ea', both: 0.04 });
  }
  // crews: walking the gantries, standing at the rails, crossing the bridges
  for (const s of [-1, 1]) {
    deck.walkersAlong({ from: [-2, GY, s * 9.1], to: [640, GY, s * 9.1], n: Math.round(9 * deck.density), spread: 0.35, rng, child: 0 });
    deck.walkersAlong({ from: [640, GY, s * 20.8], to: [-2, GY, s * 20.8], n: Math.round(7 * deck.density), spread: 0.35, rng, child: 0 });
  }
  const crew = [];
  for (let i = 0; i < 46; i++) {
    const x = rng.f(8, 560), s = rng.sign(), row = rng() < 0.6 ? 8.75 : 20.45, z = s * (row + rng.f(-0.15, 0.15));
    if (deck.clear(x, GY + 1.2, z, 2.4)) crew.push({ p: [x, GY, z], yaw: rng() < 0.6 ? (s > 0 ? Math.PI : 0) + rng.f(-0.5, 0.5) : rng.f(0, TAU) });
  }
  for (const xb of [52, 156, 260, 364, 468]) for (let j = 0; j < 2; j++) { const z = rng.f(-6, 6); if (deck.clear(xb, GY + 1.2, z, 2.4)) crew.push({ p: [xb + rng.f(-0.3, 0.3), GY, z], yaw: rng.sign() * Math.PI / 2 + rng.f(-0.4, 0.4) }); }
  deck.people(crew);
  yield 'tansy: crews';
  return vatMeshes;
}

// A travelling crane over the nave, on rails along the columns: two girders, a trolley, and on the hook a pump's
// casing on its way to be rebuilt. One mesh, modelled at x = 0 and moved along the hall by place(x).
function buildCrane(deck) {
  const g = new Geo({ maxSeg: 8 }), yel = '#cfa93a', tz = 4.4;
  for (const dx of [-0.95, 0.95]) g.box(dx - 0.22, 22.5, -7.7, dx + 0.22, 23.3, 7.7, yel);
  for (const s of [-1, 1]) { g.box(-1.7, 22.48, s * 7.5 - 0.3, 1.7, 22.9, s * 7.5 + 0.3, '#3a3b3c'); g.box(-0.1, 23.3, s * 7.1 - 0.1, 0.1, 23.46, s * 7.1 + 0.1, '#ffb24a', { emit: 5 }); }
  g.box(-1.0, 23.3, tz - 0.6, 1.0, 23.78, tz + 0.6, '#5a5c5e');
  for (const dx of [-0.3, 0.3]) g.box(dx - 0.015, 19.9, tz - 0.015, dx + 0.015, 23.3, tz + 0.015, '#2f2f30', { skip: 'tb' });
  g.box(-0.45, 19.5, tz - 0.2, 0.45, 19.9, tz + 0.2, yel);
  g.cyl(0, 17.7, tz, 0.72, 0.72, 1.2, 12, '#51627a', { top: '#3f4f66' }).cyl(0, 18.9, tz, 0.95, 0.95, 0.1, 12, '#6a7a90', { smooth: false, base: true }).cyl(0.72, 18.1, tz, 0.3, 0.3, 0.5, 8, '#51627a', { smooth: false });
  for (const [dx, dz] of [[-0.8, -0.5], [0.8, -0.5], [-0.8, 0.5], [0.8, 0.5]]) g.tube([[dx * 0.3, 19.5, tz + dz * 0.3], [dx, 19.0, tz + dz]], 0.018, 4, '#2f2f30');
  const mesh = g.mesh(deck.prop, deck.frame);
  deck.group.add(mesh);
  return { mesh, place(x) { mesh.rotation.z = x / deck.frame.floorR; } };
}

// ---------------------------------------------------------------- the Board
// The food plant's watch room: felt-hung and dim, a long desk, and a wall with a light for every line the drum runs:
// vat lines, rack bays, Mill trains, reserve banks. Green while a line runs, white while it regrows from library stock.
function* buildBoard(deck, rng) {
  const [x0, x1, y0, y1, zb] = BOARD, zf = HZ, k = deck.glowK, clk = deck.clk, felt = '#4a3f44', dark = '#1d1b1f';
  const b = deck.bucket((x0 + x1) / 2, zf + 4, 'board'), g = b.g;
  g.floor(x0, zf, x1, zb, y0, '#3a3438').floor(x0, zf, x1, zb, y1, '#2a2629', { down: true });
  wallZ(g, x0, x1, y0, y1, zb, -1, dark); wallX(g, zf, zb, y0, y1, x0, 1, felt); wallX(g, zf, zb, y0, y1, x1, -1, felt);
  // the window on the hall: a sill, a head, a post every bay and a half
  g.box(x0, y0 + 0.5, zf - 0.12, x1, y0 + 0.8, zf + 0.12, IRON2, { skip: 'we' }).box(x0, y1 - 0.6, zf - 0.12, x1, y1 - 0.35, zf + 0.12, IRON2, { skip: 'we' });
  for (let x = x0; x <= x1 + 0.01; x += 6.5) g.box(x - 0.09, y0 + 0.8, zf - 0.1, x + 0.09, y1 - 0.6, zf + 0.1, IRON2, { skip: 'tb' });
  for (let x = x0; x < x1 - 0.01; x += 6.5) b.gl.quad([x + 6.5, y0 + 0.8, zf], [x, y0 + 0.8, zf], [x, y1 - 0.6, zf], [x + 6.5, y1 - 0.6, zf], deck.pal.glass);
  deck.sign('The Board', { at: [(x0 + x1) / 2, y1 - 0.47, zf - 0.13], n: [0, -1], h: 0.22, style: 'plate', font: 'cond', track: 0.2 });
  yield 'tansy: the Board';
  // the lights: blocks of them under four headings. One vat line is regrowing; one rack bay is dark
  const heads = [['Vats', 0.46], ['Racks', 0.2], ['Mill', 0.2], ['Reserve', 0.14]], pitch = 0.3, lx0 = x0 + 1.2, lx1 = x1 - 1.2, ly0 = y0 + 0.9, rows = 15;
  let x = lx0, glowN = 0;
  for (const [name, share] of heads) {
    const w = (lx1 - lx0) * share - 0.9, cols = Math.floor(w / pitch);
    deck.sign(name, { at: [x + w / 2, ly0 + rows * pitch + 0.42, zb - 0.03], n: [0, -1], h: 0.36, style: 'glow', font: 'cond', ground: dark, ink: '#d8f0dc', glow: 1.2, track: 0.2 });
    for (let c = 0; c < cols; c++) {
      const lineWhite = name === 'Vats' && c >= 31 && c <= 33, gap = c % 12 === 11;
      if (gap) continue;
      for (let r = 0; r < rows; r++) {
        const off = (name === 'Racks' && c === 7 && r > 3 && r < 9) || rng() < 0.012, white = lineWhite || (!off && rng() < 0.006);
        const px = x + (c + 0.5) * pitch, py = ly0 + (r + 0.5) * pitch, col = off ? '#243028' : white ? '#ffffff' : '#7dffa4';
        wallZ(g, px - 0.055, px + 0.055, py - 0.055, py + 0.055, zb - 0.02, -1, col, off ? 0.2 : white ? 4.5 : 3.2);
        if (!off && (glowN++ % 3 === 0 || white)) deck.glow([{ p: [px, py, zb - 0.05], color: white ? '#ffffff' : '#7dffa4', power: white ? 1.5 : 0.9, size: 0.34, twinkle: white ? 0.5 : rng() < 0.22 ? 0.45 : 0 }]);
      }
      if (clk.due()) { yield 'tansy: the Board'; clk.go(); }
    }
    x += (lx1 - lx0) * share;
  }
  // the desk, a screen at each place, the watch sitting at it; and a table at the back where the cards come out
  const zd = zf + 4.2;
  g.box(x0 + 3, y0 + 0.7, zd, x1 - 3, y0 + 0.76, zd + 0.9, '#5a4a3c').box(x0 + 3, y0, zd + 0.82, x1 - 3, y0 + 0.7, zd + 0.9, '#3d3330');
  const seats = [];
  for (let sx = x0 + 5; sx < x1 - 4; sx += 3.1) {
    g.box(sx - 0.42, y0 + 0.78, zd + 0.5, sx + 0.42, y0 + 1.3, zd + 0.56, '#2a2a2e', { skip: 'b' });
    wallZ(g, sx - 0.38, sx + 0.38, y0 + 0.82, y0 + 1.26, zd + 0.495, -1, rng() < 0.2 ? '#f1e6c8' : '#9fe8c0', 1.6);
    deck.glow([{ p: [sx, y0 + 1.05, zd + 0.4], color: '#9fe8c0', power: 0.5, size: 1.0 }]);
    if (rng() < 0.62) { deck.put('chair', { p: [sx, y0, zd - 0.45], yaw: Math.PI, color: '#5a4a52' }); seats.push({ p: [sx, y0 + 0.48, zd - 0.45], sit: true, yaw: 0 }); }
  }
  for (const [px, pz] of [[x0 + 16, zf + 2.2], [x0 + 17.2, zf + 2.6], [x1 - 21, zf + 2.4]]) seats.push({ p: [px, y0, pz], yaw: 0 });
  deck.put('tableRound', { p: [x1 - 6, y0, zf + 2.4], yaw: 0, color: '#5a4a3c' });
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4, cx = x1 - 6 + Math.sin(a) * 0.8, cz = zf + 2.4 + Math.cos(a) * 0.8; deck.put('chair', { p: [cx, y0, cz], yaw: a, color: '#5a4a52' }); seats.push({ p: [cx, y0 + 0.48, cz], sit: true, yaw: a + Math.PI }); }
  deck.people(seats);
  // light: only the desk's own lamps; the rest is what the Board gives
  deck.lattice({ origin: [x0 + 5, y0 + 2.3, zd - 0.2], spacing: [6.2, 1], count: [10, 1], color: '#ffd9a8', power: 0.5, reach: 2.4, drop: 2.6 });
  yield 'tansy: the Board';
}

// ---------------------------------------------------------------- the well
// A shaft from the hall's roof up through the line deck to the street: the warm loop's risers go up it to every bath
// and kitchen tap, and the street looks down it at the vat lines.
function inwardRing(g, cx, cz, r, y0, y1, n, col, e = 0) {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, p0 = [cx + Math.cos(a0) * r, cz + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, cz + Math.sin(a1) * r];
    g.quad([p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]], typeof col === 'function' ? col(i) : col, e);
  }
}
// the flat between a square of half-side h and a circle of radius r inside it, at height y, facing up or down
function squareRing(g, cx, cz, h, r, y, col, down, n = 24, e = 0) {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, q = (a) => { const c = Math.cos(a), s = Math.sin(a), m = h / Math.max(Math.abs(c), Math.abs(s)); return [[cx + c * r, y, cz + s * r], [cx + c * m, y, cz + s * m]]; };
    const [c0, s0] = q(a0), [c1, s1] = q(a1);
    if (down) g.quad(c0, s0, s1, c1, col, e); else g.quad(c0, c1, s1, s0, col, e);
  }
}
function* buildWell(deck, rng) {
  const k = deck.glowK, b = deck.bucket(WX, 0, 'well'), g = b.g, wall = '#d6c9b8', band = shade(IRON, 0.9);
  squareRing(g, WX, 0, 4, WR, HTOP, '#a09689', true, 24, 0.1);
  // its mouth in the hall's roof: a red collar hung a metre down, and a ring of lamps under it
  inwardRing(g, WX, 0, WR, HTOP - 1.1, HTOP, 24, wall);
  g.cyl(WX, HTOP - 1.1, 0, WR + 0.22, WR + 0.22, 1.1, 24, IRON, { cap: false, smooth: false }).cyl(WX, HTOP - 0.75, 0, WR + 0.24, WR + 0.24, 0.3, 24, CREAM, { cap: false, smooth: false });
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * TAU, a1 = ((i + 1) / 24) * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), y = HTOP - 1.1, r1 = WR + 0.22;
    g.quad([WX + c0 * WR, y, s0 * WR], [WX + c0 * r1, y, s0 * r1], [WX + c1 * r1, y, s1 * r1], [WX + c1 * WR, y, s1 * WR], '#fff0d6', 4 * k);
    if (i % 3 === 0) deck.glow([{ p: [WX + c0 * (WR + 0.1), y - 0.06, s0 * (WR + 0.1)], color: '#ffe6c0', power: 1.8 * k, size: 0.7 }]);
  }
  // the shaft: plaster in four-metre lifts, a red band and a ring of lamps at every deck it passes
  inwardRing(g, WX, 0, WR, HTOP, SY, 24, (i) => shade(wall, i % 2 ? 1 : 0.95));
  for (let dk = 12; dk <= 15; dk++) {
    const y = 4 * (dk - 5);
    inwardRing(g, WX, 0, WR - 0.04, y - 0.25, y + 0.25, 24, band);
    inwardRing(g, WX, 0, WR - 0.06, y + 2.9, y + 3.02, 24, '#fff0d6', 1.7 * k);
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * TAU; deck.glow([{ p: [WX + Math.cos(a) * (WR - 0.15), y + 2.96, Math.sin(a) * (WR - 0.15)], color: '#ffe6c0', power: 1.0 * k, size: 0.5 }]); }
    deck.sign('Deck ' + dk, { at: [WX + WR - 0.07, y + 1.5, 0], n: [-1, 0], w: 1.5, h: 0.5, style: 'plate', font: 'cond' });
  }
  yield 'tansy: the well';
  // the risers: four pipes in copper lagging, come over from the gantries' headers and gone up through the street's ceiling
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = WX + sx * 1.8, z = sz * 1.8;
    g.tube([[x, GY - 0.55, sz * 8.8], [x, 18.6, sz * 8.8], [x, 19.2, sz * 8.2], [x, 19.2, sz * 2.4], [x, 19.8, z], [x, 30, z], [x, SY - 1.9, z]], 0.3, 8, COPPER);
    for (let y = 22; y < SY - 3; y += 4) g.cyl(x, y, z, 0.36, 0.36, 0.12, 8, shade(COPPER, 0.7), { smooth: false, base: true });
  }
  // at the top the four join a ring main under the street
  const main = [];
  for (let i = 0; i <= 26; i++) { const a = (i / 24) * TAU; main.push([WX + Math.cos(a) * 2.546, SY - 1.9, Math.sin(a) * 2.546]); }
  g.tube(main, 0.3, 8, COPPER);
  // a ladder up the anti side
  for (const z of [-0.25, 0.25]) g.box(WX - WR + 0.1, HTOP, z - 0.025, WX - WR + 0.15, SY, z + 0.025, METH, { skip: 'tb' });
  for (let y = HTOP + 0.4; y < SY; y += 0.7) g.box(WX - WR + 0.1, y, -0.25, WX - WR + 0.14, y + 0.04, 0.25, shade(METH, 0.85), { skip: 'ns' });
  deck.lattice({ origin: [WX - 1.2, 4 * 7 + 2.9, -1.2], spacing: [2.4, 2.4], count: [2, 2], storeys: 4, rise: 4, drop: 3.95, above: 0.2, color: '#ffe0b4', power: 0.42, reach: 3.6 });
  yield 'tansy: the well';
}

// ---------------------------------------------------------------- the Henhouse
// Its counter, on the square: one fried egg on sourdough, the yolk left to run. A griddle, loaves, a basket with the
// eggs that are left (seven, as the slate says), and the cook. Drawn in the row's own co-ordinates (u, y, v).
function counterFront(deck, P, b, run, H) {
  const g = P.g, k = deck.glowK, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24, mid = (u0 + u1) / 2, dep = 2.2, red = '#8c4a4f', dark = '#5a2f36', room = '#f1dcb8';
  g.box(u0, 0, -0.26, u1, 0.92, 0.34, red, { skip: 'b' }).box(u0 - 0.03, 0.92, -0.32, u1 + 0.03, 0.97, 0.4, '#efe6d2');
  g.box(u0, 2.25, -0.05, u1, 2.85, 0.26, dark, { skip: 'b' }).box(u0, 2.85, 0, u1, H, 0.26, b.wall, { skip: 'tb' });
  deck.sign('The Henhouse', { run, at: run.pt(mid, 2.55, -0.056), h: 0.46, style: 'board', font: 'serif', ground: dark, ink: '#fff3ea' });
  // the room behind
  wallZ(g, u0 - 0.12, u1 + 0.12, 0, H - 0.2, dep, -1, room, 0.5 * k);
  g.quad([u0 - 0.12, 0, dep], [u0 - 0.12, 0, 0.26], [u0 - 0.12, H - 0.2, 0.26], [u0 - 0.12, H - 0.2, dep], room, 0.35 * k).quad([u1 + 0.12, 0, 0.26], [u1 + 0.12, 0, dep], [u1 + 0.12, H - 0.2, dep], [u1 + 0.12, H - 0.2, 0.26], room, 0.35 * k);
  g.floor(u0 - 0.12, 0.3, u1 + 0.12, dep, 0.015, '#8f7c66').floor(u0 - 0.12, 0.26, u1 + 0.12, dep, H - 0.2, shade(room, 0.85), { down: true, emit: 0.3 * k });
  g.floor(mid - 1.4, 0.9, mid + 1.4, 1.2, H - 0.21, '#fff0d0', { down: true, emit: 3.5 * k });
  deck.glow([{ p: run.pt(mid, H - 0.4, 1.0), color: deck.pal.shop, power: 1.2 * k, size: 2.2 }]);
  // shelves of sourdough along the back wall
  for (let s = 0; s < 3; s++) {
    const y = 1.05 + s * 0.48; g.box(u0 + 0.2, y, dep - 0.34, u1 - 0.2, y + 0.035, dep, '#5c3a36', { skip: 's' });
    for (let x = u0 + 0.5; x < u1 - 0.4; x += 0.46) g.blob(x, y + 0.13, dep - 0.18, [0.17, 0.1, 0.13], 0, mixc('#cf9a55', '#8f5f30', ((x * 7 + s * 3) % 5) / 5), { seed: x + s, shadeBottom: 0.75, emit: 0.2 });
  }
  // the griddle, three eggs on it; plates; and the basket
  g.box(mid - 0.75, 0.97, -0.2, mid + 0.75, 1.02, 0.28, '#2f2f30');
  for (const [du, dv, r] of [[-0.42, 0.02, 0.1], [0.02, 0.06, 0.11], [0.45, -0.01, 0.1]]) { g.cyl(mid + du, 1.02, dv, r, r * 0.92, 0.008, 9, '#fbf7ee', { smooth: false, emit: 0.3 }); g.blob(mid + du + 0.01, 1.036, dv, [0.034, 0.02, 0.034], 0, '#f2b01e', { emit: 0.9, shadeBottom: 0.9 }); }
  for (let i = 0; i < 6; i++) g.cyl(u1 - 0.7, 0.97 + i * 0.016, 0.02, 0.13, 0.13, 0.012, 9, i % 2 ? '#e9e4d8' : '#f6f1e6', { smooth: false });
  g.box(u0 + 0.35, 0.97, -0.16, u0 + 0.95, 1.07, 0.22, '#8a6a44', { skip: 't' });
  for (let i = 0; i < 7; i++) gem(g, u0 + 0.47 + (i % 4) * 0.12 + (i > 3 ? 0.06 : 0), 1.1 + (i > 3 ? 0.035 : 0), -0.04 + (i > 3 ? 0.13 : 0.0), 0.034, 0.044, 0.034, i % 3 ? '#e9d3b4' : '#f3e6d2', 0.25);
  deck.sign(['One fried egg on sourdough 1.6', 'The two-egg birthday omelette 3.2'], { run, at: run.pt(mid, 0.5, -0.27), w: 2.6, h: 0.5, style: 'chalk', head: false });
  deck.people([{ p: run.pt(mid - 0.2, 0, 1.0), yaw: run.yaw + Math.PI, color: '#f1ece0' }, { p: run.pt(u1 - 1.2, 0, 1.3), yaw: run.yaw + Math.PI + 0.5, color: '#f1ece0' }]);
  // an awning in Tansy's red and cream
  const n = 14, out = 1.15;
  for (let i = 0; i < n; i++) {
    const a = lerp(u0 - 0.1, u1 + 0.1, i / n), c = lerp(u0 - 0.1, u1 + 0.1, (i + 1) / n), col = i % 2 ? '#f6ead8' : '#b5404a';
    P.c.quad([a, 2.26, -0.06], [c, 2.26, -0.06], [c, 2.0, -out], [a, 2.0, -out], col).quad([a, 2.0, -out], [c, 2.0, -out], [c, 1.84, -out], [a, 1.84, -out], shade(col, 0.9));
  }
}

// A hen, standing at the origin and facing +z, about 0.48 m to the top of her comb. Each vertex's glow says which
// part of her it belongs to (0 body, 1 neck and head, 2 and 3 her legs), which is what the shader below moves.
function henGeo() {
  const g = new Geo(), W = '#ffffff', RED = '#c8281e', HORN = '#e0b040';
  const B = 0, N = 1;
  g.tint(1);
  g.blob(0, 0.265, -0.005, [0.1, 0.1, 0.165], 1, W, { shadeBottom: 0.78, emit: B });                 // body
  g.blob(0, 0.27, -0.13, [0.085, 0.09, 0.09], 0, '#f0f0f0', { shadeBottom: 0.8, emit: B, seed: 3 });   // the fluff behind
  for (const s of [-1, 1]) g.blob(s * 0.092, 0.275, -0.015, [0.028, 0.07, 0.115], 0, '#dcdcdc', { shadeBottom: 0.8, emit: B, seed: 5 });      // wings
  // the tail: three feathers standing up and back
  for (const [x, top] of [[-0.035, 0.47], [0, 0.52], [0.035, 0.47]]) both3(g, [x - 0.03, 0.3, -0.17], [x + 0.03, 0.3, -0.17], [x * 1.6, top, -0.29], x ? '#cfcfcf' : '#e6e6e6', B);
  g.tube([[0, 0.29, 0.085], [0, 0.375, 0.135], [0, 0.435, 0.15]], (t) => 0.068 - 0.03 * t, 6, W, { emit: N });      // neck
  g.blob(0, 0.455, 0.165, [0.04, 0.042, 0.05], 1, W, { shadeBottom: 0.85, emit: N });                // head
  g.tint(0);
  // beak, comb, wattles, eyes
  const tip = [0, 0.447, 0.245], bk = [[0.016, 0.458, 0.205], [0, 0.47, 0.205], [-0.016, 0.458, 0.205], [0, 0.44, 0.205]];
  for (let i = 0; i < 4; i++) g.tri(bk[i], bk[(i + 1) % 4], tip, i < 2 ? HORN : shade(HORN, 0.8), N);
  const comb = [[0.215, 0.492], [0.2, 0.535], [0.18, 0.5], [0.165, 0.545], [0.145, 0.502], [0.128, 0.535], [0.115, 0.49]];
  for (let i = 0; i + 2 < comb.length; i += 2) both3(g, [0, comb[i][1], comb[i][0]], [0, comb[i + 1][1], comb[i + 1][0]], [0, comb[i + 2][1], comb[i + 2][0]], RED, N);
  both3(g, [0, 0.492, 0.215], [0, 0.49, 0.115], [0, 0.47, 0.165], RED, N);
  for (const s of [-1, 1]) { gem(g, s * 0.012, 0.418, 0.2, 0.01, 0.02, 0.012, RED, N); gem(g, s * 0.037, 0.468, 0.185, 0.006, 0.008, 0.008, '#1c1614', N); }
  // legs: a shank and three toes each
  for (const s of [-1, 1]) {
    const x = s * 0.045, e = s < 0 ? 2 : 3;
    g.box(x - 0.009, 0.0, -0.004, x + 0.009, 0.19, 0.014, HORN, { skip: 'tb', emit: e });
    for (const [dx, dz] of [[0, 0.075], [s * 0.045, 0.05], [-s * 0.035, 0.055]]) both3(g, [x - 0.008, 0.004, 0.004], [x + 0.008, 0.004, 0.004], [x + dx, 0.004, dz + 0.004], shade(HORN, 0.9), e);
  }
  return g.build();
}

// The hens' own material: instanced, bent and lit like everything else, and each bird given a small life. A round of
// hers: peck three times, walk a few steps out, peck and look about, turn, walk back, turn. aHen is (metres she walks
// out, seconds for the round, where in it she begins, and whether she walks 0, only stands 1, or sits 2).
const HEN_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit; attribute vec4 aHen;
uniform float uTime;
${BEND_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vSoft;
void rx(inout vec3 p, inout vec3 n, vec3 o, float a) { float c = cos(a), s = sin(a); p -= o; p = vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c) + o; n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c); }
void ry(inout vec3 p, inout vec3 n, vec3 o, float a) { float c = cos(a), s = sin(a); p -= o; p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c) + o; n = vec3(n.x * c + n.z * s, n.y, -n.x * s + n.z * c); }
void main() {
  vec3 p = position, n = normal;
  float part = aEmit, T = aHen.y, u = fract(uTime / T + aHen.z), mode = aHen.w, seed = aHen.z * 37.0;
  float walks = step(mode, 0.5);
  float walking = (step(0.27, u) * step(u, 0.40) + step(0.75, u) * step(u, 0.88)) * walks;
  float along = aHen.x * (smoothstep(0.27, 0.40, u) - smoothstep(0.75, 0.88, u)) * walks;
  float turn = (smoothstep(0.65, 0.73, u) - smoothstep(0.92, 1.0, u)) * 3.14159265 * walks;
  float turning = (step(0.65, u) * step(u, 0.73) + step(0.92, u)) * walks;
  // pecking: three dips before she sets off, two more when she gets there
  float peck = pow(abs(sin(clamp(u / 0.24, 0.0, 1.0) * 9.42478)), 2.5) + pow(abs(sin(clamp((u - 0.43) / 0.17, 0.0, 1.0) * 6.28319)), 2.5);
  peck *= mode < 0.5 ? 1.0 : mode < 1.5 ? 0.22 : 0.0;
  float idle = 1.0 - clamp(peck * 3.0, 0.0, 1.0);
  float step_ = uTime * 9.0 + seed;
  if (part > 0.5 && part < 1.5) {
    // the head: looks about in jerks when she is not pecking, and nods on each step as hens do
    float look = (smoothstep(-0.15, 0.15, sin(uTime * 0.83 + seed)) - 0.5) * 1.5 + (smoothstep(-0.1, 0.1, sin(uTime * 2.1 + seed * 1.7)) - 0.5) * 0.5;
    ry(p, n, vec3(0.0, 0.3, 0.09), look * idle);
    p.z += 0.022 * sin(step_ * 2.0) * (walking + 0.5 * turning);
    rx(p, n, vec3(0.0, 0.3, 0.09), peck * 1.15);
  }
  if (part > 1.5) {
    float sw = (part < 2.5 ? 1.0 : -1.0) * sin(step_) * (0.55 * walking + 0.3 * turning);
    rx(p, n, vec3(0.0, 0.19, 0.005), sw);
    if (mode > 1.5) p = vec3(p.x, 0.19, 0.005);
  } else {
    rx(p, n, vec3(0.0, 0.18, 0.0), peck * 0.7);
    p.y += 0.007 * abs(sin(step_)) * walking;
  }
  if (mode > 1.5) p.y -= 0.15;
  ry(p, n, vec3(0.0), turn);
  p.z += along;
  p = (instanceMatrix * vec4(p, 1.0)).xyz; n = normalize(mat3(instanceMatrix) * n);
  vF = p; vFN = n;
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vCol = mix(aCol.rgb, aCol.rgb * instanceColor, aCol.a); vSoft = aCol.a;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const henFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vSoft;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  // feathers are soft: they take the light as if they faced it a little
  float soft = vSoft * 0.45;
  N = normalize(mix(N, kUp(vW), soft)); FN = normalize(mix(FN, vec3(0.0, 1.0, 0.0), soft));
  gl_FragColor = vec4(kAir(vCol * kLight(vW, N, vF, FN), vW), 1.0);
}`;
// hens: [{ p: [x, y, z], yaw, color, walk (metres), round (seconds), phase, mode, scale }]
function henMesh(deck, hens) {
  const f = deck.frame, rig = deck.rig, geo = henGeo(), n = hens.length;
  const mat = new ShaderMaterial({ uniforms: { ...rig.uniforms, uClip: G.uClip, uTime: G.uTime, uBend: { value: new Vector3(f.a0, f.z0, f.floorR) } }, vertexShader: HEN_VERT, fragmentShader: henFrag(rig), side: FrontSide });
  const mesh = new InstancedMesh(geo, mat, n), aHen = new Float32Array(n * 4), m = new Matrix4(), q = new Quaternion(), up = new Vector3(0, 1, 0), s = new Vector3(), pos = new Vector3(), c = new Color(), pts = [];
  hens.forEach((h, i) => {
    const sc = h.scale || 1;
    m.compose(pos.set(h.p[0], h.p[1], h.p[2]), q.setFromAxisAngle(up, h.yaw || 0), s.set(sc, sc, sc)); mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, c.set(h.color || '#a8502a'));
    aHen.set([h.walk || 0, h.round || 10, h.phase === undefined ? (i * 0.618034) % 1 : h.phase, h.mode || 0], i * 4);
    pts.push(f.point(h.p[0], h.p[1], h.p[2]));
  });
  mesh.geometry.setAttribute('aHen', new InstancedBufferAttribute(aHen, 4));
  mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
  const sphere = new Sphere().setFromPoints(pts); sphere.radius += 3; mesh.boundingSphere = sphere;
  return mesh;
}

// The run: a long room behind a glass wall on the avenue, litter on its floor, perches, feeders, a row of nest boxes
// on the back wall, and in that wall the pop-hole the flight goes out by. D is how deep the run is, from the glass to
// the pop-hole's wall; the keeper's half-door stands in the middle of the glass with its top leaf open.
function runFront(deck, P, b, run, H, D) {
  const g = P.g, k = deck.glowK, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24, dc = run.u(DOOR), DW = 0.7, red = '#8c4a4f', dark = '#5a2f36', cream = '#efe2cc', board = '#e6d8c0';
  // the glass wall: a red sill, a head, a post every pane, and the name twice along the fascia
  for (const [a, c] of [[u0, dc - DW], [dc + DW, u1]]) {
    g.box(a, 0, -0.05, c, 0.32, 0.17, red, { skip: 'b', top: '#a8626a' });
    const n = 6, w = (c - a) / n;
    for (let i = 0; i <= n; i++) g.box(a + i * w - 0.04, 0.32, 0, a + i * w + 0.04, 2.42, 0.12, dark, { skip: 'tb' });
    for (let i = 0; i < n; i++) P.gl.quad([a + (i + 1) * w, 0.32, 0.06], [a + i * w, 0.32, 0.06], [a + i * w, 2.42, 0.06], [a + (i + 1) * w, 2.42, 0.06], deck.pal.glass);
    deck.sign('The Henhouse', { run, at: run.pt((a + c) / 2, 2.73, -0.066), h: 0.32, style: 'board', font: 'serif', ground: dark, ink: '#fff3ea', track: 0.08 });
  }
  g.box(u0, 2.42, -0.05, u1, 2.56, 0.17, dark).box(u0, 2.56, -0.06, u1, H, 0.26, dark, { skip: 'tb' });
  // the half-door: its lower leaf shut, its upper folded right back against the inside of the glass
  for (const s of [-1, 1]) g.box(dc + s * DW - 0.045, 0, -0.02, dc + s * DW + 0.045, 2.42, 0.14, dark, { skip: 'b' });
  g.box(dc - DW + 0.045, 0.02, 0.03, dc + DW - 0.045, 0.9, 0.09, red, { skip: 'b' }).box(dc - DW + 0.16, 0.14, 0.015, dc + DW - 0.16, 0.78, 0.03, '#a8626a', { skip: 's' }).box(dc - DW + 0.045, 0.9, 0.0, dc + DW - 0.045, 0.94, 0.12, dark);
  for (const [ya, yb] of [[0.96, 1.06], [2.28, 2.38]]) g.box(dc - 3 * DW + 0.09, ya, 0.16, dc - DW - 0.045, yb, 0.21, red);
  for (const ua of [dc - 3 * DW + 0.09, dc - DW - 0.13]) g.box(ua, 1.06, 0.16, ua + 0.085, 2.28, 0.21, red, { skip: 'tb' });
  P.gl.quad([dc - DW - 0.13, 1.06, 0.185], [dc - 3 * DW + 0.17, 1.06, 0.185], [dc - 3 * DW + 0.17, 2.28, 0.185], [dc - DW - 0.13, 2.28, 0.185], deck.pal.glass);
  // inside: litter, pale walls, a boarded back wall with the pop-hole in it, warm lamps
  const litter = '#cfc2a0', a0 = b.u0 + 0.12, a1 = b.u1 - 0.12, hy = 0.5, hr = 0.27, hh = 0.5;
  g.floor(a0, 0.18, a1, D, 0.03, litter);
  const lr = makeRng('litter');
  for (let i = 0; i < 30; i++) { const x = lr.f(a0 + 0.6, a1 - 0.6), v = lr.f(0.6, D - 0.5), r = lr.f(0.3, 0.7); g.cyl(x, 0.03, v, r, r * 0.8, 0.004 + (i % 3) * 0.001, 7, shade(litter, i % 2 ? 0.94 : 1.05), { smooth: false, squash: [1, lr.f(0.5, 0.9)], phase: lr() * 6 }); }
  for (let i = 0; i < 700; i++) {
    // shavings: slivers lying every way
    const x = i % 2 ? dc + lr.f(-3.2, 3.2) : lr.f(a0 + 0.2, a1 - 0.2), v = lr.f(0.25, D - 0.08), a = lr.f(0, Math.PI), l = lr.f(0.03, 0.1), w = lr.f(0.007, 0.02), y = 0.037 + (i % 5) * 0.0006, c = Math.cos(a), s = Math.sin(a);
    g.quad([x - l * c + w * s, y, v - l * s - w * c], [x - l * c - w * s, y, v - l * s + w * c], [x + l * c - w * s, y, v + l * s + w * c], [x + l * c + w * s, y, v + l * s - w * c], shade(litter, lr.f(0.74, 1.18)));
  }
  g.quad([a0, 0, D], [a0, 0, 0.26], [a0, H, 0.26], [a0, H, D], cream, 0.08).quad([a1, 0, 0.26], [a1, 0, D], [a1, H, D], [a1, H, 0.26], cream, 0.08);
  g.floor(a0, 0.26, a1, D, H - 0.04, shade(cream, 0.9), { down: true, emit: 0.12 });
  for (let x = a0 + 3; x < a1 - 1; x += 6) { g.floor(x - 0.7, D * 0.5 - 0.22, x + 0.7, D * 0.5 + 0.22, H - 0.05, '#fff0d0', { down: true, emit: 3.6 * k }); deck.glow([{ p: run.pt(x, H - 0.12, D * 0.5), color: '#ffe6c0', power: 1.6 * k, size: 0.8 }]); }
  wallZ(g, a0, dc - hh, 0, H, D, -1, board); wallZ(g, dc + hh, a1, 0, H, D, -1, board); wallZ(g, dc - hh, dc + hh, hy + hh, H, D, -1, board); wallZ(g, dc - hh, dc + hh, 0, hy - hh, D, -1, board);
  for (let i = 0; i < 32; i++) {
    const t0 = (i / 32) * TAU, t1 = ((i + 1) / 32) * TAU, q = (t, r) => [dc + Math.cos(t) * r, hy + Math.sin(t) * r], sq = (t) => { const c = Math.cos(t), s = Math.sin(t), m = hh / Math.max(Math.abs(c), Math.abs(s)); return [dc + c * m, hy + s * m]; };
    const c0 = q(t0, hr), c1 = q(t1, hr), s0 = sq(t0), s1 = sq(t1), o0 = q(t0, hr + 0.07), o1 = q(t1, hr + 0.07);
    g.quad([c0[0], c0[1], D], [c1[0], c1[1], D], [s1[0], s1[1], D], [s0[0], s0[1], D], board);
    g.quad([c0[0], c0[1], D - 0.02], [c1[0], c1[1], D - 0.02], [o1[0], o1[1], D - 0.02], [o0[0], o0[1], D - 0.02], red).quad([c0[0], c0[1], D + 0.05], [c1[0], c1[1], D + 0.05], [c1[0], c1[1], D - 0.02], [c0[0], c0[1], D - 0.02], dark);
  }
  g.box(a0, 0, D - 0.03, dc - 0.6, 0.34, D, red, { skip: 'bs' }).box(dc + 0.6, 0, D - 0.03, a1, 0.34, D, red, { skip: 'bs' });
  for (let x = a0 + 0.6; x < a1; x += 0.6) if (Math.abs(x - dc) > 0.6) g.box(x - 0.006, 0.34, D - 0.012, x + 0.006, H, D, shade(board, 0.78), { skip: 'tbs' });
  // the ramp up to it: a plank with cleats, stopping a hop short of the hole
  const rt = hy - hr - 0.07;
  g.quad([dc - 0.19, 0.04, D - 1.3], [dc - 0.19, rt, D - 0.06], [dc + 0.19, rt, D - 0.06], [dc + 0.19, 0.04, D - 1.3], '#b89a6c');
  for (let i = 1; i < 7; i++) { const t = i / 7.5, y = lerp(0.04, rt, t), v = lerp(D - 1.3, D - 0.06, t); g.box(dc - 0.19, y, v - 0.012, dc + 0.19, y + 0.022, v + 0.012, '#8a6a44'); }
  // nest boxes on the back wall: eight of them under a sloping lid, a rail to hop up to
  const nb0 = dc + 2.4, nw = 0.44;
  g.box(nb0 - 0.04, 0.72, D - 0.44, nb0 + 8 * nw + 0.04, 0.78, D, '#b89a6c').quad([nb0 - 0.06, 1.2, D - 0.5], [nb0 - 0.06, 1.42, D], [nb0 + 8 * nw + 0.06, 1.42, D], [nb0 + 8 * nw + 0.06, 1.2, D - 0.5], red);
  for (let i = 0; i <= 8; i++) g.box(nb0 + i * nw - 0.02, 0.78, D - 0.44, nb0 + i * nw + 0.02, 1.22, D, board, { skip: 'tb' });
  for (let i = 0; i < 8; i++) { wallZ(g, nb0 + i * nw + 0.02, nb0 + (i + 1) * nw - 0.02, 0.78, 1.2, D - 0.06, -1, '#3a2a20'); g.box(nb0 + i * nw + 0.02, 0.78, D - 0.44, nb0 + (i + 1) * nw - 0.02, 0.88, D - 0.41, '#b89a6c'); }
  g.tube([[nb0 - 0.1, 0.62, D - 0.7], [nb0 + 8 * nw + 0.1, 0.62, D - 0.7]], 0.022, 5, '#8a6a44');
  for (const x of [nb0, nb0 + 8 * nw]) g.box(x - 0.02, 0, D - 0.72, x + 0.02, 0.62, D - 0.68, '#8a6a44', { skip: 'tb' });
  for (const [bx, dv] of [[nb0 + 2.5 * nw, 0], [nb0 + 2.5 * nw + 0.1, 0.07], [nb0 + 6.5 * nw - 0.04, 0.02]]) gem(g, bx, 0.92, D - 0.3 + dv, 0.03, 0.04, 0.03, '#f1e2c8', 0.5);
  // two roosts of three poles, two feeders hung from the ceiling, a drinker, a tray of dust to bathe in
  for (const r0 of [dc - 9.6, dc + 7.2]) {
    for (let i = 0; i < 3; i++) g.tube([[r0, 0.45 + i * 0.36, D - 2.5 + i * 0.42], [r0 + 2.6, 0.45 + i * 0.36, D - 2.5 + i * 0.42]], 0.022, 5, '#8a6a44');
    for (const x of [r0 + 0.1, r0 + 2.5]) g.tube([[x, 0.03, D - 2.75], [x, 1.25, D - 1.55]], 0.025, 4, '#7a5c40').tube([[x, 0.03, D - 1.4], [x, 1.25, D - 1.55]], 0.025, 4, '#7a5c40');
  }
  for (const [fx, fv] of [[dc - 4.2, 2.1], [dc + 5.6, 1.7]]) {
    g.cyl(fx, 0.2, fv, 0.3, 0.3, 0.05, 10, red, { smooth: false }).cyl(fx, 0.24, fv, 0.17, 0.17, 0.42, 10, '#e9e2d2', { smooth: false, cap: false }).cyl(fx, 0.66, fv, 0.2, 0.03, 0.12, 10, red, { smooth: false });
    g.box(fx - 0.008, 0.78, fv - 0.008, fx + 0.008, H - 0.04, fv + 0.008, '#4a4b4c', { skip: 'tb' }).cyl(fx, 0.25, fv, 0.27, 0.27, 0.012, 10, '#d9b56a', { smooth: false });
  }
  g.cyl(dc + 2.6, 0.03, 3.0, 0.2, 0.2, 0.06, 10, red, { smooth: false }).cyl(dc + 2.6, 0.09, 3.0, 0.15, 0.06, 0.26, 10, '#eef0ee', { smooth: false });
  g.box(dc - 7.4, 0.03, 1.0, dc - 6.1, 0.13, 1.9, '#8a6a44', { skip: 'tb' }).floor(dc - 7.36, 1.04, dc - 6.14, 1.86, 0.1, '#c9b79a');
  // a head of greens hung on a string at the height of a beak
  g.box(dc - 2.106, 0.62, 3.094, dc - 2.094, H - 0.04, 3.106, '#4a4b4c', { skip: 'tb' }).blob(dc - 2.1, 0.5, 3.1, [0.13, 0.14, 0.13], 1, '#7fa860', { lump: 0.25, seed: 6, shadeBottom: 0.7 });
}

// ---------------------------------------------------------------- Coopside: the square round the well's mouth
// The well comes up in the middle of a square on deck 16, the first deck with homes on it. People lean on its rail to
// look down at the vat lines. On the spinward side is the Henhouse's counter, and the queue for it.
function* buildSquare(deck, rng, counter) {
  const pal = deck.pal, k = deck.glowK, H = 3, x0 = WX - SQ, x1 = WX + SQ, KR = WR + 0.3, RR = WR + 0.15;
  const b = deck.bucket(WX, 0, 'square'), g = b.g, f = b.f, stone = pal.court;
  f.tint(0.5).floor(x0, -SQ, x1, -5, SY, stone, { emit: 0.6 }).floor(x0, 5, x1, SQ, SY, stone, { emit: 0.6 }).floor(x0, -5, WX - 5, 5, SY, stone, { emit: 0.6 }).floor(WX + 5, -5, x1, 5, SY, stone, { emit: 0.6 });
  f.tint(1); squareRing(f, WX, 0, 5, KR, SY, shade(stone, 0.8), false, 24, 0.6); f.tint(0);
  // the mouth: a stone kerb, a brass rail on posts, glass between
  inwardRing(g, WX, 0, WR, SY, SY + 0.3, 24, '#c2b6a4');
  g.cyl(WX, SY, 0, KR, KR, 0.3, 24, '#b9ad9a', { cap: false, smooth: false });
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * TAU, a1 = ((i + 1) / 24) * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), y = SY + 0.3;
    g.quad([WX + c0 * WR, y, s0 * WR], [WX + c1 * WR, y, s1 * WR], [WX + c1 * KR, y, s1 * KR], [WX + c0 * KR, y, s0 * KR], '#cfc3b0');
    b.gl.quad([WX + c0 * RR, y, s0 * RR], [WX + c1 * RR, y, s1 * RR], [WX + c1 * RR, SY + 1.02, s1 * RR], [WX + c0 * RR, SY + 1.02, s0 * RR], pal.glass);
    if (i % 2 === 0) g.box(WX + c0 * RR - 0.03, y, s0 * RR - 0.03, WX + c0 * RR + 0.03, SY + 1.03, s0 * RR + 0.03, pal.metal, { skip: 'tb' });
  }
  const top = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU; top.push([WX + Math.cos(a) * RR, SY + 1.05, Math.sin(a) * RR]); }
  g.tube(top, 0.035, 5, pal.brass);
  deck.sign('Coopside', { at: [WX + WR - 0.07, SY - 1.2, 0], n: [-1, 0], w: 2.0, h: 0.52, style: 'plate', font: 'serif' });
  // the ceiling, with a round of light over the well where the risers go on up
  g.floor(x0, -SQ, x1, SQ, SY + H, pal.ceiling, { down: true, emit: 0.26 * k });
  // beams both ways, cut short where the round of light is; strings of flags from it out to the walls
  const OR = WR + 0.62;
  for (const o of [-10.83, -6.5, -2.17, 2.17, 6.5, 10.83]) {
    const cut = Math.abs(o) < OR ? Math.sqrt(OR * OR - o * o) : 0;
    for (const [a, c] of cut ? [[-SQ, -cut], [cut, SQ]] : [[-SQ, SQ]]) g.box(WX + a, SY + H - 0.24, o - 0.14, WX + c, SY + H, o + 0.14, pal.rib, { skip: 't' }).box(WX + o - 0.14, SY + H - 0.24, a, WX + o + 0.14, SY + H, c, pal.rib, { skip: 't' });
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.26, r = 8.2, p = [WX + Math.cos(a) * r, SY + H - 0.34, Math.sin(a) * r];
    if (deck.clear(p[0], p[1] - 0.3, p[2], 1.5)) deck.put('bunting', { p, yaw: -a, scale: [2.9, 1, 1], color: i % 2 ? '#b5404a' : '#f1e2cf' });
  }
  g.cyl(WX, SY + H - 0.06, 0, WR + 0.25, WR + 0.25, 0.04, 24, '#fff6e4', { emit: 3.0 * k, base: true, cap: false, smooth: false });
  g.cyl(WX, SY + H - 0.26, 0, WR + 0.5, WR + 0.5, 0.26, 24, pal.rib, { cap: false, smooth: false });
  deck.glow([{ p: [WX, SY + H - 0.3, 0], color: '#fff0d8', power: 0.5 * k, size: 6 }]);
  for (const [dx, dz] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]]) {
    const p = [WX + dx * 8.4, SY + H, dz * 8.4];
    deck.put('pendant', { p, yaw: 0 }); deck.glow([{ p: [p[0], SY + H - 0.66, p[2]], color: pal.lamp, power: 2.3 * k, size: 0.75 }]);
  }
  deck.lattice({ origin: [WX - 8.4, SY + H - 0.62, -8.4], spacing: [8.4, 8.4], count: [3, 3], power: 1.05, reach: 4.6, drop: (H - 0.1) / 0.75 + 0.05 });
  yield 'tansy: the square';
  // its four sides: shops and a few doors; the avenue goes on spinward between a strawberry stall and the Henhouse
  const fill = { mix: { shop: 3, stall: 1, home: 1.4 }, bay: [4.6, 6.2], lit: 1, awnings: 0.6, blades: 0.4, numbers: 3 };
  yield* frontage(deck, new Run(0, SY, SQ, 0), { from: x0, to: x1, fill, part: 'square' });
  yield* frontage(deck, new Run(0, SY, -SQ, 2), { from: -x1, to: -x0, fill, part: 'square' });
  yield* frontage(deck, new Run(x0, SY, 0, 3), { from: -SQ, to: SQ, fill: false, part: 'square', paint: { wall: pal.walls[1], dado: pal.dado[0], trim: pal.trim[0] } });
  yield* frontage(deck, new Run(x1, SY, 0, 1), {
    from: -SQ, to: SQ, fill, part: 'square',
    fronts: [
      { from: -AW, to: AW, kind: 'gap' },
      { from: -SQ, to: -AW, kind: 'stall', name: 'Strawberries', goods: 'greens', awning: ['#b5404a', '#f6ead8'], ground: '#5a2f36', ink: '#fff3ea', font: 'italic', lit: 1 },
      { from: AW, to: SQ, kind: 'custom', id: 'counter', wall: pal.walls[0], draw: counter },
    ],
  });
  // benches and tubs, and the people who have come to look down
  for (const [x, z, yaw] of [[WX - 7, -6.5, 0.6], [WX - 8, 5.5, 2.4], [WX + 3, -8.6, 0], [WX - 2, 9.6, Math.PI]]) if (deck.clear(x, SY + 1.2, z, 2)) { deck.put('bench', { p: [x, SY, z], yaw, color: '#8c4a4f' }); if (rng() < 0.8) deck.people([{ p: [x, SY + 0.45, z], sit: true, yaw: yaw + Math.PI }]); }
  for (const [x, z] of [[x0 + 1.2, -SQ + 1.2], [x0 + 1.2, SQ - 1.2], [x1 - 1.2, -SQ + 1.2], [WX - 6, 0.5], [WX + 1, -6.2]]) deck.put('tubTree', { p: [x, SY, z], yaw: rng() * TAU, scale: rng.f(0.85, 1.0), color: rng.pick(pal.leaf) });
  const lean = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU + rng.f(-0.06, 0.06), r = RR + 0.42;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.75 || rng() < 0.35) continue;      // nobody where the flight goes out over the rail
    lean.push({ p: [WX + Math.cos(a) * r, SY, Math.sin(a) * r], yaw: Math.atan2(-Math.cos(a), -Math.sin(a)), child: rng() < 0.3 });
  }
  deck.people(lean);
  yield 'tansy: the square';
}

// The avenue, spinward from the square: the Henhouse's glass along its back side, then shops and doors; the forty
// hens; the children at the glass; the queue, the slate and the clock.
const FEATHER = ['#a8502a', '#b8663a', '#8a3f22', '#d9a868', '#e8d8b8', '#f1ece0', '#f1ece0', '#2a2826', '#3a3432', '#8f8a84', '#5a3a28', '#c98a4a'];
function* buildAvenue(deck, rng, D) {
  const pal = deck.pal, k = deck.glowK, x0 = WX + SQ, x1 = WX + 250, W0 = pal.walls[0];
  yield* street(deck, {
    axis: 'x', from: x0, to: x1, at: 0, y: SY, width: 2 * AW, cloth: 0.5,
    lamps: { every: 6, kind: 'globe', power: 0.95 },
    plates: [{ at: x0 + 3.4, lines: ['Coopside', 'Deck 16'] }],
    folk: { stand: 3, stroll: 0, walk: 5, kids: 0 },
    fronts: {
      back: [
        { from: x0, to: HEN[0], kind: 'custom', wall: W0, piers: false, draw: (P, b, run, H) => { wallZ(P.g, b.u0, b.u1, 0, H, 0, -1, W0); P.g.box(b.u0, 0, -0.022, b.u1, 1.0, 0, '#8c4a4f', { skip: 'bs' }).box(b.u0 + 0.6, 1.2, -0.03, b.u1 - 0.6, 2.3, 0, '#4a2a2e', { skip: 's' }); deck.sign(['The Henhouse', 'The hens lay when they like.', 'We will not light them harder.'], { run, at: run.pt((b.u0 + b.u1) / 2, 1.75, -0.036), w: b.u1 - b.u0 - 1.36, h: 0.98, style: 'paper', font2: 'serif' }); } },
        { from: HEN[0], to: HEN[1], kind: 'custom', id: 'run', wall: W0, draw: (P, b, run, H) => runFront(deck, P, b, run, H, D) },
        { from: HEN[1], to: HEN[1] + 6, kind: 'shop', name: 'Bread', goods: 'bread', awning: true, lit: 1 },
      ],
      front: [
        { from: x0, to: x0 + 6.4, kind: 'shop', name: 'Tea', goods: 'tea', lit: 1, awning: false, blade: true },
        { from: x0 + 6.4, to: x0 + 10.4, kind: 'stair', sub: 'Up 17, down 15' },
        { from: x0 + 10.4, to: x0 + 16.4, kind: 'shop', name: 'Toys', goods: 'toys', lit: 1, awning: true },
        { from: x0 + 16.4, to: x0 + 21, kind: 'home' },
        { from: x0 + 21, to: x0 + 27, kind: 'shop', name: 'Preserves', goods: 'jars', lit: 1, blade: true, awning: false },
      ],
    },
    fill: { mix: { shop: 2, home: 2.4, wall: 0.3, stall: 0.4 }, numbers: 21 },
  });
  deck.zone({ min: [HEN[0], SY - 0.3, AW + 0.12], max: [HEN[1], SY + 3.1, AW + D + 0.2], soft: 0.3, color: '#ffe4bc', power: 0.8, side: 0.8, under: 0.5 });
  yield 'tansy: the avenue';
  // ---- forty hens. Five on the roosts, two on nests, one in the dust, thirty-two about the floor
  const hens = [], y0 = SY + 0.034, zOf = (v) => AW + v, col = () => rng.pick(FEATHER), life = () => ({ round: rng.f(7, 13), phase: rng(), scale: rng.f(0.9, 1.08) });
  for (const [r0, list] of [[DOOR - 9.6, [[2, 0.5], [2, 1.5], [1, 2.1]]], [DOOR + 7.2, [[2, 0.8], [0, 1.9]]]]) for (const [i, dx] of list) hens.push({ p: [r0 + dx, SY + 0.45 + i * 0.36 + 0.022, zOf(D - 2.5 + i * 0.42)], yaw: Math.PI + rng.f(-0.5, 0.5), color: col(), mode: 1, ...life() });
  for (const i of [1, 5]) hens.push({ p: [DOOR + 2.4 + (i + 0.5) * 0.44, SY + 0.78, zOf(D - 0.3)], yaw: Math.PI, color: col(), mode: 2, ...life() });
  hens.push({ p: [DOOR - 6.75, SY + 0.1, zOf(1.45)], yaw: 2.2, color: col(), mode: 2, ...life() });
  // the floor: nowhere the flight goes, nor inside a feeder, a roost or the tray
  const free = (u, v) => u > HEN[0] + 0.5 && u < HEN[1] - 0.5 && v > 0.42 && v < D - 0.35 && Math.abs(u - DOOR) > 0.8
    && !(Math.abs(u - DOOR) < 1.0 && v < 0.9)
    && Math.hypot(u - (DOOR - 4.2), v - 2.1) > 0.5 && Math.hypot(u - (DOOR + 5.6), v - 1.7) > 0.5 && Math.hypot(u - (DOOR + 2.6), v - 3.0) > 0.4
    && !(v > D - 2.9 && (u > DOOR - 9.9 && u < DOOR - 6.7 || u > DOOR + 6.9 && u < DOOR + 10.1))
    && !(u > DOOR - 7.6 && u < DOOR - 5.9 && v > 0.8 && v < 2.1) && !(u > DOOR + 2.1 && u < DOOR + 6.2 && v > D - 0.95);
  const floorHen = (u, v, yaw, walk) => {
    const eu = u + Math.sin(yaw) * walk, ev = v + Math.cos(yaw) * walk;
    for (let t = 0; t <= 1.001; t += 0.25) if (!free(lerp(u, eu, t), lerp(v, ev, t))) return false;
    for (const h of hens) if (h.mode !== 1 && Math.hypot(h.p[0] - u, h.p[2] - zOf(v)) < 0.42) return false;
    hens.push({ p: [u, y0, zOf(v)], yaw, color: col(), walk, mode: 0, ...life() });
    return true;
  };
  // a few where the eye will pass close, some by the glass where the children are, two at the feeders, the rest anywhere
  for (const [du, v, yaw, walk] of [[-1.15, 2.0, 0.3, 0.9], [1.1, 1.3, 2.6, 0.7], [1.3, 3.3, -0.4, 0.8], [-1.0, 4.1, -1.9, 0.6], [1.0, 4.9, 2.6, 0.5], [-1.9, 0.75, -1.57, 0.8], [-4.2, 1.42, 0, 0], [5.6, 1.02, 0, 0], [-4.88, 2.1, 1.57, 0], [6.3, 1.7, -1.57, 0], [-2.5, 3.1, 1.57, 0], [-1.72, 3.2, -1.4, 0]]) floorHen(DOOR + du, v, yaw, walk);
  for (let tries = 0; hens.length < 28 && tries < 400; tries++) floorHen(rng.f(HEN[0] + 0.6, HEN[1] - 0.6), rng.f(0.45, 1.5), rng.f(0, TAU), rng.f(0.3, 1.0));
  for (let tries = 0; hens.length < 40 && tries < 2000; tries++) floorHen(rng.f(HEN[0] + 0.6, HEN[1] - 0.6), rng.f(0.5, D - 0.5), rng.f(0, TAU), rng.f(0.35, 1.4));
  if (hens.length !== 40) console.warn('[tansy] ' + hens.length + ' hens, and there should be forty');
  deck.group.add(henMesh(deck, hens));
  // the keeper, with a basket, at the nest boxes
  deck.people([{ p: [DOOR + 2.95, SY + 0.03, zOf(D - 1.35)], yaw: 0.25, color: '#8c4a4f' }]);
  deck.put('crate', { p: [DOOR + 3.6, SY + 0.03, zOf(D - 1.2)], yaw: 0.4, scale: 0.8, color: '#e9d3b4' });
  deck.sign(['Laid today', '26'], { at: [DOOR + 1.55, SY + 1.55, zOf(D - 0.014)], n: [0, -1], w: 0.74, h: 0.62, style: 'chalk', head: false });
  deck.put('crate', { p: [DOOR - 2.6, SY + 0.03, zOf(3.4)], yaw: 1.1, color: '#6f9a58' });
  yield 'tansy: forty hens';
  // ---- children pressed to the glass, a parent here and there behind them
  const watch = [];
  for (let u = HEN[0] + 0.7; u < HEN[1] - 0.5; u += rng.f(0.55, 1.5)) {
    if (Math.abs(u - DOOR) < 1.3) continue;
    watch.push({ p: [u, SY, zOf(-0.36 - rng.f(0, 0.08))], yaw: rng.f(-0.25, 0.25), child: true });
    if (rng() < 0.16 && Math.abs(u - DOOR) > 4) watch.push({ p: [u + 0.45, SY, zOf(-0.42)], yaw: rng.f(-0.3, 0.3) });
  }
  deck.people(watch.filter((s) => deck.clear(s.p[0], s.p[1] + 1.3, s.p[2], 1.25)));
  // ---- the queue: from the counter back across the square and round the well
  const line = [[x0 - 0.85, 8.75], [x0 - 8.5, 8.9], [x0 - 15, 7.4], [x0 - 19, 3.2], [x0 - 19.8, -2.5]], queue = [];
  let seg = 0, at = 0;
  for (let i = 0; i < 21; i++) {
    while (seg < line.length - 2 && at > Math.hypot(line[seg + 1][0] - line[seg][0], line[seg + 1][1] - line[seg][1])) { at -= Math.hypot(line[seg + 1][0] - line[seg][0], line[seg + 1][1] - line[seg][1]); seg++; }
    const a = line[seg], c = line[seg + 1], l = Math.hypot(c[0] - a[0], c[1] - a[1]), t = at / l;
    queue.push({ p: [lerp(a[0], c[0], t) + rng.f(-0.12, 0.12), SY, lerp(a[1], c[1], t) + rng.f(-0.14, 0.14)], yaw: Math.atan2(a[0] - c[0], a[1] - c[1]) + rng.f(-0.35, 0.35), child: i > 2 && rng() < 0.22 });
    at += rng.f(0.66, 0.86);
  }
  // children who will not stand in it
  for (const [qx, qz, r] of [[x0 - 5.2, 6.6, 0.7], [x0 - 11.5, 10.6, 0.6], [x0 - 16.4, 9.6, 0.8]]) queue.push({ p: [qx, SY, qz], walk: r, child: true });
  deck.people(queue);
  // the slate, on a stand where the queue can read it
  const sn = [-0.9, -0.44], sp = [x0 - 1.5, SY, 5.6];
  deck.put('noticeboard', { p: sp, yaw: Math.atan2(-sn[0], -sn[1]), color: '#5a2f36' });
  deck.sign('Eggs left', { at: [sp[0] + sn[0] * 0.026, SY + 1.7, sp[2] + sn[1] * 0.026], n: sn, w: 1.18, h: 0.34, style: 'chalk' });
  deck.sign('7', { at: [sp[0] + sn[0] * 0.027, SY + 1.2, sp[2] + sn[1] * 0.027], n: sn, w: 1.18, h: 0.68, style: 'chalk' });
  // the clock at the avenue's mouth: a little before ten
  {
    const g = deck.bucket(x0, 0, 'square').g, cx = x0 - 0.5, cy = SY + 2.42, cz = -2.7, r = 0.36;
    g.box(cx - 0.02, cy + r, cz - 0.02, cx + 0.02, SY + 3, cz + 0.02, pal.metal, { skip: 'tb' });
    const disc = (x, rr, col, e, face) => { for (let i = 0; i < 20; i++) { const a0 = (i / 20) * TAU, a1 = ((i + 1) / 20) * TAU, p0 = [x, cy + Math.cos(a0) * rr, cz + Math.sin(a0) * rr], p1 = [x, cy + Math.cos(a1) * rr, cz + Math.sin(a1) * rr]; if (face > 0) g.tri([x, cy, cz], p0, p1, col, e); else g.tri([x, cy, cz], p1, p0, col, e); } };
    disc(cx - 0.05, r, '#f6efe0', 0.9 * k, -1); disc(cx + 0.05, r, '#f6efe0', 0.9 * k, 1);
    for (let i = 0; i < 20; i++) { const a0 = (i / 20) * TAU, a1 = ((i + 1) / 20) * TAU; g.quad([cx - 0.05, cy + Math.cos(a0) * r, cz + Math.sin(a0) * r], [cx - 0.05, cy + Math.cos(a1) * r, cz + Math.sin(a1) * r], [cx + 0.05, cy + Math.cos(a1) * r, cz + Math.sin(a1) * r], [cx + 0.05, cy + Math.cos(a0) * r, cz + Math.sin(a0) * r], pal.brass); }
    // hands and hour marks, on the face that looks back at the square (clockwise is from up toward +z there)
    const hand = (ang, len, w) => { const dy = Math.cos(ang), dz = Math.sin(ang), x = cx - 0.056; g.quad([x, cy - dz * w, cz + dy * w], [x, cy + dy * len - dz * w * 0.5, cz + dz * len + dy * w * 0.5], [x, cy + dy * len + dz * w * 0.5, cz + dz * len - dy * w * 0.5], [x, cy + dz * w, cz - dy * w], '#2a2224'); };
    hand((52 / 60) * TAU, r * 0.84, 0.014); hand(((9 + 52 / 60) / 12) * TAU, r * 0.56, 0.02);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, dy = Math.cos(a), dz = Math.sin(a), x = cx - 0.054, w = 0.012; g.quad([x, cy + dy * r * 0.8 - dz * w, cz + dz * r * 0.8 + dy * w], [x, cy + dy * r * 0.93 - dz * w, cz + dz * r * 0.93 + dy * w], [x, cy + dy * r * 0.93 + dz * w, cz + dz * r * 0.93 - dy * w], [x, cy + dy * r * 0.8 + dz * w, cz + dz * r * 0.8 - dy * w], '#4a3a3c'); }
    deck.glow([{ p: [cx - 0.1, cy, cz], color: '#fff0d8', power: 0.6 * k, size: 0.9 }]);
  }
  yield 'tansy: the queue';
}

export const tansyHens = {
  id: 'tansy-hens',
  title: 'Forty hens behind glass', drum: 'Tansy', row: 'Herb Row', kind: 'a steady drum', light: 0.0,
  line: 'Tansy has a vat hall most of a kilometre long, and the queue is upstairs, for forty hens behind a glass wall. The slate said seven eggs left and there were twenty of us.',
  tone: '#f2a08c', source: 'eating-out.md (Tansy: The Henhouse), sorrel.md (The Keel), food-system.md (Tier 2; Tier 3), three-nights 15-canon.js (Tansy)',
  sound: { root: 50, scale: 'major', pad: 0.4, air: 0.3, hum: 0.5, crowd: 0.4, bells: 0.1, bright: 0.5 },
  *build(ctx) {
    const frame = makeFrame(48 * DEG, 1870, deckRadius(5));
    const rng = makeRng('tansy-hens');
    const path = makePath([
      { t: 0, p: [-74, 19.2, 0.4] },
      { t: 3.6, p: [-58, 18.2, 2.0], look: [-46, 17.5, 4.5] },
      { t: 6.4, p: [-41, 17.4, 2.7], look: [-29, 17.0, 4.6] },
      { t: 8.6, p: [-24, 16.8, 0.8], look: [-6, 16.5, 0] },
      { t: 10.2, p: [-10.5, 16.5, 0], look: [3, 16.5, 0] },
      { t: 11.8, p: [-3.2, 16.5, 0], look: [20, 16.6, 0] },
      { t: 13.2, p: [4, 16.7, 0], look: [80, 17, 0] },
      { t: 15.3, p: [28, 20, -0.5], look: [300, 8, -2], fov: 52 },
      { t: 18.4, p: [84, 20.4, -5.6], look: [230, 9, -9.5], fov: 46 },
      { t: 22, p: [160, 9.5, 1.5], look: [330, 5, -1] },
      { t: 25.5, p: [222, 2.8, -2.5], look: [300, 7, -8] },
      { t: 28.2, p: [264, 13, 0], look: [330, 22, 30] },
      { t: 30.2, p: [284, 20.4, 5], look: [336, 23, 40] },
      { t: 31.8, p: [300, 22.7, 21.5], look: [340, 23.4, 46] },
      { t: 33.6, p: [322, 23.3, 27.8], look: [346, 23.4, 46] },
      { t: 37.2, p: [363, 23.4, 27.8], look: [392, 23.3, 39] },
      { t: 38.6, p: [378, 23.3, 21.3], look: [410, 22.5, 12] },
      { t: 40.1, p: [401, 22.7, 5.6], look: [429, 24.5, 0] },
      { t: 41.6, p: [424.6, 23.5, 0.8], look: [431, 30.5, 0] },
      { t: 43.0, p: [428.6, 30, 0], look: [431, 45, 0.5] },
      { t: 44.7, p: [429, 39, 0], look: [433, 47, 1.2] },
      { t: 45.9, p: [429.3, SY - 0.2, 0.1], look: [440, SY + 2.2, 3] },
      { t: 47.1, p: [430.4, SY + 1.72, 0.35], look: [446, SY + 0.95, 5.5] },
      { t: 49.5, p: [439.6, SY + 1.55, 1.4], look: [447, SY + 1.0, 6.5] },
      { t: 52.9, p: [449, SY + 1.5, 2.0], look: [455, SY + 0.8, 7], fov: 50 },
      { t: 55.8, p: [455.4, SY + 1.5, 2.4], look: [457.5, SY + 0.7, 8], fov: 50 },
      { t: 57.8, p: [DOOR, SY + 1.45, 4.6], look: [DOOR, SY + 0.5, 10], fov: 60 },
      { t: 60.3, p: [DOOR, SY + 0.62, 7.3], fov: 62 },
      { t: 62.8, p: [DOOR, SY + 0.5, 9.3], fov: 60 },
      { t: 64.8, p: [DOOR, SY + 0.5, 10.4] },
    ], { frame, entryRadius: 3.2, exitRadius: 0.3 });
    const ex = path.exit.flat, D = ex.z - 0.03 - AW;     // how deep the hens' run is: the pop-hole's wall stands just in front of the opening
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'tansy', palette: TANSY, light: { level: 0.9, haze: HAZE.racks, hazeDensity: 0.004 }, floor: { rough: 0.016, lampGlow: 3 } });
    const steel = steelMaterial(deck), rig = deck.rig;
    yield 'tansy: path';
    const racks = yield* buildRacks(deck, rng);
    const lock = buildLock(deck, steel);
    // two pools of white light, to be moved under whichever pickers are nearest
    const pools = [0, 1].map(() => deck.zone({ min: [0, -90, 0], max: [1, -89, 1], power: 0 }));
    yield 'tansy: the lock';
    const hall = yield* buildHall(deck, rng);
    const vatMeshes = yield* dressHall(deck, hall, rng, steel);
    const crane = buildCrane(deck);
    yield* buildBoard(deck, rng);
    yield* buildWell(deck, rng);
    yield* buildSquare(deck, rng, (P, b, run, H) => counterFront(deck, P, b, run, H));
    yield* buildAvenue(deck, rng, D);
    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);
    // What is behind a wall is not drawn: the racks until the lock is behind the flight, the hall from when its door
    // parts until the well, the street from the well on. A mesh belongs to one of the three if everything in it
    // (its flat extent, or where its copies stand) lies there; the lock, the well and what is mixed are always drawn.
    const hero = racks.pickers.find((p) => p.hero).hero;
    const parts = { racks: [hero], hall: [...vatMeshes, crane.mesh], street: [] }, placed = new Set([hero, crane.mesh, ...vatMeshes, ...lock.leaves]);
    for (const m of deck.group.children) {
      if (placed.has(m)) continue;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      if (m.isInstancedMesh) { const a = m.instanceMatrix.array; for (let i = 0; i < m.count; i++) { const x = a[i * 16 + 12], y = a[i * 16 + 13]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      else if (m.geometry && m.geometry.boundingBox) { const b = m.geometry.boundingBox; x0 = b.min.x; x1 = b.max.x; y0 = b.min.y; y1 = b.max.y; }
      if (x1 < x0) continue;
      if (x1 < LOCK[0] + 0.1) parts.racks.push(m); else if (x0 > -1 && y1 < 30) parts.hall.push(m); else if (y0 > 40) parts.street.push(m);
    }
    let shown = '';
    const show = (racks, hallOn, streetOn) => { const key = '' + racks + hallOn + streetOn; if (key === shown) return; shown = key; for (const m of parts.racks) m.visible = racks; for (const m of parts.hall) m.visible = hallOn; for (const m of parts.street) m.visible = streetOn; };
    const look = { exposure: 1.5, bloom: 0.24, threshold: 1.0, saturation: 1.04, vignette: 0.5, contrast: 1.08 };
    const eye = new Vector3(), hazeNow = new Color(), hazeA = new Color(HAZE.racks), hazeB = new Color(HAZE.hall), hazeC = new Color(HAZE.street);
    lock.set(1, 0);
    return {
      scene, path, deck, near: 0.1, far: 1000, look,
      portal: { rim: false, mist: '#3a2a1c', mistPower: 0.5, openFor: 9 },
      update(t) {
        show(t < 11.7, t > 10.7 && t < 48.9, t > 40.5);
        crane.place(88 + t);
        // the lock: its far door parts as the flight comes in at the near one, which shuts behind it
        lock.set(1 - smoothstep(11.6, 12.6, t), smoothstep(10.9, 12.3, t));
        // the air: plum-dark in the racks, pale in the hall, warm and clear in the street
        const k = smoothstep(10.6, 12.6, t), k2 = smoothstep(42.8, 46.8, t);
        rig.set({ haze: hazeNow.copy(hazeA).lerp(hazeB, k).lerp(hazeC, k2), hazeDensity: lerp(lerp(0.004, 0.0019, k), 0.0006, k2) });
        look.exposure = lerp(lerp(1.5, 1.45, k), 1.3, k2);
        if (t < 14) {
          // white light for the two pickers nearest ahead of the eye
          path.flat(t, eye);
          const now = G.uTime.value;
          for (const p of racks.pickers) {
            if (p.hero) { p.cx = p.at(t); p.hero.rotation.z = p.cx / frame.floorR; } else { const du = ((now / p.loop + p.phase) % 1 + 1) % 1; p.cx = p.x + p.v * du * p.loop; }
            p.d = Math.hypot(p.cx - eye.x - 5, (p.y - eye.y) * 1.5, p.z - eye.z);
          }
          const near = racks.pickers.slice().sort((a, b) => a.d - b.d);
          for (let i = 0; i < 2; i++) { const p = near[i], s = p.z > 0 ? 1 : -1; rig.setZone(pools[i], { min: [p.cx - 1.2, p.y - 1.0, Math.min(p.z - s * 0.7, p.z + s * 0.32)], max: [p.cx + 1.2, p.y + 2.7, Math.max(p.z - s * 0.7, p.z + s * 0.32)], soft: 0.35, color: '#fff6ea', power: 1.1 * smoothstep(26, 13, p.d), side: 1, under: 0.8 }); }
        } else for (const i of pools) rig.setZone(i, null);
      },
    };
  },
};
