// Gloaming, Weather Row: the rehearsal drum on the Painters' Arcade. A painted dusk is three hours of colour on the
// sunline and the land, composed by a lamp-painter and played once (docs/open-drums.md, Culture, light-painting), so
// before it is played the painter runs it through a model. Tonight's is by Hesk, about thirty and very sure of himself,
// who ends on forty minutes of sea-green (docs/wander-year.md, Day 96; games/three-nights/src/15-canon.js, Gloaming:
// the Painters' Arcade, Duskside, the posted name, the palette "Hesk's green dusk", the motto "Earn the dusk.").
//
// The model is Gloaming's Hollow at one to two hundred, and it is the Hollow of worlds/gloaming_dusk.js: the same plan
// (painted by that file's own painter, its colours at the size the Hollow's own are), the same thirty tiers on the end
// walls with the same houses, the same sequence, the same lamps lit in the same order.
// The flight starts on the Arcade at eye height, goes in at the door beside the name board to a dark hall where the
// tube lies on its cradles with its back cap swung away, turns and climbs the gantry steps, passes Hesk at the end of
// the gantry's tongue, goes over the rail and down to less than a metre above the painted land, and flies the length of
// it along one water mirror as the light goes from gold through white to green and the lamps come on: past a card on a
// stick by a joint in the board, a slate propped in the basin, a kneeling plank with a clip lamp. It ends at the front
// wall's Third, level over the heads in its seats and into an opening behind the back row. The next world begins in
// one of those seats.
//
// The sums. One to two hundred: 3,000 m across is 15 m, 3,750 m long is 18.75 m, 9.42 km round the floor is 47.1 m, a
// tier of 47.5 m is 23.75 cm, and the Third (1,025 m from the axis) is 5.125 m from the model's. A metre above the
// model's floor is two hundred metres up; the flight's 0.4 m/s along it is 80 m/s. A seated person is 4.7 mm by 2 mm,
// which is a grain of rice. Sixty times speed: three hours in three minutes, a minute a second, so Hesk's forty minutes
// of green last forty seconds here (the flight leaves thirty seconds into them). Light: the same lux from a lamp line
// a two-hundredth as long at a two-hundredth of the distance needs 1/40,000 of the light, which is why a dusk that is
// played once in the Hollow can be run nine times in an afternoon here. The model does not spin: its far bank is
// overhead only because the hall's floor is down, so nobody can stand in it but along its lowest line, and the
// painters watch from a gantry.
//
// y = 0 is the floor of deck 290 (0.61 g), the Arcade's and the hall's; the hall is cut five decks high.
//
// Not canon (the docs give the painted dusks, Hesk, the Painters' Arcade, Duskside and the posted name):
//   - the model, its hall, its scale, its cap on a hinge, its cradles, the gantry and its wing; the rehearsal itself,
//     sixty times speed, the nine runs and their tally; the score rail with a card for every minute of the dusk; the
//     opening in the model's front wall behind the Third's seats, and the ring of pin lamps round it; the lights that
//     climb the model's walls where the lifts' tracks are painted;
//   - the Arcade's look: studios known by their numbers with walls of lit proofs, the flags, the tea stall and the
//     slate shop, the bills and the name board (its last line, "played once", is the docs' phrase), deck 290;
//   - what lies about inside the model: the kneeling plank, the clip lamp, the pencil, the card on a stick and what is
//     written on it, the slate on the basin;
//   - everything worlds/gloaming_dusk.js lists as its own invention (the plan, the seats on the Third, Hesk's desk, the
//     sequence before the green, the order the lamps come up in), which this model copies at one to two hundred.
import {
  Scene, Group, Mesh, ShaderMaterial, BufferGeometry, BufferAttribute, Float32BufferAttribute, InstancedBufferGeometry, InstancedBufferAttribute,
  InstancedMesh, Matrix4, Vector2, Vector3, Vector4, Color, Sphere, AdditiveBlending, NormalBlending, FrontSide, DoubleSide,
} from 'three';
import { makePath } from '../core/path.js';
import { DRUM, makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { Plan, C, L, LAND_GLSL } from '../kit/plan.js';
import { NT, TIER_H, TIERS, WOOD_CELL, tierDepths, tierPlace } from '../kit/hollow.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, CELL_GLSL, litMaterial, glowPoints, vec3col } from '../kit/mats.js';
import { Geo, rgb, mixc, shade } from '../kit/geo.js';
import { makeDeck, finish, street, Run, PALETTES } from '../kit/deck.js';
import { figureGeo, crowd, CLOTH, SKIN } from '../kit/folk.js';
import { makeRng, smoothstep, clamp, lerp, hash2, cellRand } from '../core/rng.js';
import { paintGloaming } from './gloaming_dusk.js';

const TAU = Math.PI * 2;
// ---- the model: Gloaming's Hollow at one to two hundred, lying along the deck's z with its front wall at z = 0
const SC = 200;
const RM = DRUM.RH / SC;                      // 7.5 m: from its axis to its painted land
const LM = L / SC;                            // 18.75 m long
const YC = 8.8;                               // its axis above the hall floor: the land's lowest line is at y = 1.3
const TH = TIER_H / SC;                       // a tier: 23.75 cm
const DEPTHS = tierDepths();                  // the terraces' depths as the Hollow's own walls have them, metres
const WALL = DEPTHS.reduce((a, b) => a + b, 0) / SC;      // how far an end wall's steps reach in along the floor: 1.87 m
const ZM = LM - WALL;                         // the tube's open end: the back wall and its ring of floor are the cap, swung away
const X0 = C / 4;                             // the seats' line on the real floor (the dusk's camera sits at 90 degrees): the model's lowest line
const MIDZ = L / 2;                           // the middle of the floor, where the basins are (the mirror the flight follows lies 160 m round from the seats' line: x = 0.8 here)
const THIRD = tierPlace(DEPTHS, TIERS.third); // the Third: its floor's height, its rail and the foot of the riser behind
const TY = YC - THIRD.r / SC;                 // the model's Third: floor at y = 3.675,
const TRAIL = THIRD.zRail / SC, TFOOT = THIRD.zFoot / SC;   // rail at z = 1.375, the riser behind the seats at z = 1.225
// a place on the model from where it is on the real floor: metres round from the seats' line, metres above the land, metres from the front wall
const onModel = (x, h, z) => { const a = x / DRUM.RH, r = RM - h / SC; return [r * Math.sin(a), YC - r * Math.cos(a), z / SC]; };
// the same from an angle round the model (radians, 0 at its lowest line), a radius from its axis and a z, all in the model's own metres
const polar = (a, r, z) => [r * Math.sin(a), YC - r * Math.cos(a), z];

// ---- the hall, the Arcade, the gantry
const HX0 = -17, HX1 = 14.2, HZ0 = -4.5, HZ1 = 36.5, HH = 19.4;     // the hall: five decks high
const ZA = 32, AW = 7, AX0 = -36;             // the Arcade: an avenue along x at z = 32, ending at the hall's door
const DOORW = 3.6, DOORH = 2.6;
const GY = 3.9, GW = 1.3, GZ0 = 23.0, GZ1 = 14.8, SZ0 = 29.2;        // the gantry: its floor, half its width, where it starts and ends; the foot of its steps
const HINGE = [8.06, ZM], SWING = 100 * DEG;  // the cap's hinge (x, z) and how far it stands open
const SEAM = 11.25;                           // one of the joints between the tube's five lengths: the one with the pencil by it
const R_EXIT = 0.1;                           // the opening behind the Third's back row: 20 m across at the model's scale

// ---------------------------------------------------------------- the dusk
// Hesk's sequence as worlds/gloaming_dusk.js plays it: [t, sun, its power, the far bank's sun, its power, the Hollow's
// glow, its power, the rod, sharpness, lamps]. That world presses the forty green minutes into 27 seconds (25 to 52);
// here they take 40 (34 to 74 of this flight), and what comes before them is laid out to suit the walk in.
const SEQ = [
  [0, '#ffc480', 0.75, '#ffb478', 0.55, '#9a8070', 0.2, 30, 1.0, 0.0],
  [9, '#ffcf98', 0.72, '#e8a880', 0.45, '#8c7c74', 0.22, 30, 1.2, 0.0],
  [17, '#f2fff8', 0.6, '#a0a8c0', 0.22, '#6c8078', 0.24, 32, 1.8, 0.0],
  [25, '#6fc9a8', 0.9, '#2a3a5a', 0.06, '#2f5a5c', 0.4, 30, 2.6, 0.15],
  [33, '#55b090', 0.56, '#141c34', 0.015, '#22405a', 0.7, 26, 3.0, 0.4],
  [41, '#2a7a68', 0.3, '#0a0f1e', 0.0, '#1c3058', 1.1, 20, 3.0, 0.8],
  [47, '#1f5a52', 0.1, '#0a0f1e', 0.0, '#1a2c5c', 1.5, 9, 3.0, 1.0],
  [52, '#0c1a1c', 0.02, '#0a0f1e', 0.0, '#1c2e60', 1.9, 0.5, 3.0, 1.0],
  [70, '#0c1a1c', 0.0, '#0a0f1e', 0.0, '#1c2e60', 2.0, 0, 3.0, 1.0],
];
const SEQC = SEQ.map((k) => [new Color(k[1]), new Color(k[3]), new Color(k[5])]);
// this flight's second for a second of that world's dusk, and back
const WARP = [[0, 0], [9, 24], [17, 30], [25, 34], [52, 74], [70, 100.7]];
const warp = (x, a, b) => { let i = 0; while (i < WARP.length - 2 && WARP[i + 1][a] <= x) i++; const p = WARP[i], q = WARP[i + 1]; return p[b] + (q[b] - p[b]) * (x - p[a]) / (q[a] - p[a]); };
const toFlight = (tau) => warp(tau, 0, 1), toDusk = (t) => warp(t, 1, 0);
const LINE0 = 32, LINE1 = 50, SHRINK = 0.92;  // the line goes out from both ends toward the middle between these seconds of the dusk
const RUN_END = toFlight(52);                 // the run's three minutes are up at this second of the flight

// ---------------------------------------------------------------- shader text: the rod's light inside the model
// Everything in here works in the deck's flat co-ordinates, where the model is a true cylinder about the line x = 0,
// y = YC. mRodE is kit/mats.js's kSunE at this size: the light of a line of lamps on a surface, 1 on the land under the
// middle of the whole line.
const ROD_GLSL = /* glsl */`
uniform vec3 uRodA, uRodB, uGlow, uSpill; uniform vec2 uRodZ; uniform float uSharp;
const float kYC = ${YC.toFixed(3)}, kZM = ${ZM.toFixed(3)};
float mF(float a, float D) { return a * D / (D * D + a * a) + atan(a / D); }
// the line's colour as seen from a place: its bright face looks down at the model's lowest line, its other face up
vec3 mRodCol(vec3 F) { vec2 d = vec2(F.x, F.y - kYC); float c = -d.y / max(length(d), 1e-3); return mix(uRodB, uRodA, pow(clamp(0.5 + 0.5 * c, 0.0, 1.0), uSharp)); }
float mRodE(vec3 F, vec3 N) {
  vec2 d = vec2(-F.x, kYC - F.y); float D = max(length(d), 0.12);
  float nu = dot(N.xy, d / D), nz = N.z;
  float a1 = uRodZ.x - F.z, a2 = uRodZ.y - F.z;
  if (abs(nz) > 1e-3) { float a0 = -nu * D / nz; if (nz > 0.0) a1 = max(a1, a0); else a2 = min(a2, a0); }
  if (a2 <= a1) return 0.0;
  float e = nu * (mF(a2, D) - mF(a1, D)) / (2.0 * D) + nz * 0.5 * D * (1.0 / (D * D + a1 * a1) - 1.0 / (D * D + a2 * a2));
  return max(e, 0.0) * ${(2 * RM / 2.518).toFixed(3)};
}
vec3 mLight(vec3 F, vec3 N) {
  vec2 d = vec2(-F.x, kYC - F.y); float D = max(length(d), 0.12); vec3 U = vec3(d / D, 0.0);
  float nu = dot(N, U);
  vec3 sc = mRodCol(F);
  return sc * (min(mRodE(F, N), 6.0) + 0.05 * min(mRodE(F, U), 2.5) * (0.6 - 0.4 * nu)) + uGlow * (0.8 + 0.2 * nu);
}
// what comes out of the tube's open end into the hall: the lit land seen as a bright disc 15 m across
vec3 mSpill(vec3 F, vec3 N) {
  vec3 d = vec3(0.0, kYC, kZM) - F; float d2 = dot(d, d);
  return uSpill * (max(dot(N, d) * inversesqrt(d2), 0.0) * 0.8 + 0.2) * (${(RM * RM).toFixed(2)} / (${(RM * RM).toFixed(2)} + d2)) * smoothstep(kZM - 1.2, kZM + 0.5, F.z);
}`;

// ---------------------------------------------------------------- the model's land
// The inside of the tube: Gloaming's plan, drawn the way kit/hollow.js draws the real floor (the same grain, mown
// stripes, crowns, people and water, all worked in the real floor's metres: a metre of the model is two hundred of
// them), lit by the model's own rod. Over that, what a painted board has and land has not: the joints between the
// tube's five lengths, screw heads along them, a carpenter's pencil line. The water is glass and does not ripple.
const LAND_VERT = /* glsl */`
attribute vec2 aUv;       // where on the real floor: the way round as a share of a turn, the way along as a share of its length
${BEND_PARS}
varying vec3 vW; varying vec3 vF; varying vec2 vUv;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  vF = p; vUv = aUv;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const LAND_FRAG = /* glsl */`
${CLIP_PARS}
uniform sampler2D tAlb, tMask, tKind;
${LAND_GLSL}
uniform vec2 uSize;
uniform vec3 uEye, uLampCol, uWallTint;
uniform float uLamp, uRodPow, uTreeNear;
uniform vec2 uLod;        // how much smaller than a Hollow's own the colour canvas and the mask canvas are, in halvings (0 or less)
varying vec3 vW; varying vec3 vF; varying vec2 vUv;
${ROD_GLSL}
${NOISE_GLSL}
${CELL_GLSL}
// the nearest tree of a wood to a point (kit/hollow.js): xy = offset from its centre in metres, z = its crown's radius, w = a random number for it
vec4 kWoodTree(vec2 m, out float chance) {
  vec2 g = m / ${WOOD_CELL.toFixed(1)}; vec2 gi = floor(g);
  vec4 best = vec4(0.0, 0.0, 1.0, 0.0); float bd = 1e9; chance = 1.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cell = gi + vec2(float(i), float(j));
    vec4 r = kCell(cell);
    vec2 c = (cell + 0.15 + 0.7 * r.xy) * ${WOOD_CELL.toFixed(1)};
    float rad = ${WOOD_CELL.toFixed(1)} * (0.36 + 0.2 * r.w);
    vec2 d = m - c; float dd = length(d) / rad;
    if (dd < bd) { bd = dd; best = vec4(d, rad, r.w); chance = r.z; }
  }
  return best;
}
void main() {
  ${CLIP_FRAG}
  vec2 m = vUv * uSize;                                        // metres on the real floor
  float px = max(length(dFdx(m)), length(dFdy(m)));           // of them in this pixel
  vec3 up = vec3(-normalize(vec2(vF.x, vF.y - kYC)), 0.0);     // toward the model's axis
  vec3 T = vec3(up.y, -up.x, 0.0);
  vec3 Ve = uEye - vF;
  float dist = length(Ve) * ${SC.toFixed(1)};
  vec3 V = Ve / max(length(Ve), 1e-4);
  vec3 vl = vec3(dot(V, T), dot(V, up), V.z);
  vec2 par = vl.xz / max(vl.y, 0.2);
  float nearK = smoothstep(3.0, 0.5, px);
  vec2 wob = (vec2(kNoise(m * 0.13), kNoise(m * 0.13 + 31.7)) - 0.5) * 3.0 * nearK;
  vec2 uv = m / uSize, uv2 = (m + wob) / uSize;
  vec3 alb = kLand(texture2D(tAlb, uv2).rgb);
  vec3 mask = texture2D(tMask, uv2).rgb;
  vec3 kind = texture2D(tKind, uv2).rgb;
  float wat = mask.r;

  // ---- the grain of the land, and mown stripes turning from plot to plot
  vec3 c = alb * (0.9 + 0.2 * kFbm(m / 85.0));
  float grain = kNoise(m * 0.8) * 0.6 + kNoise(m * 2.9) * 0.4;
  c *= 1.0 + (grain - 0.5) * 0.2 * smoothstep(1.2, 0.2, px);
  float open = (1.0 - mask.g) * (1.0 - kind.r);
  float sdir = step(0.5, kHash(floor(m / 240.0)));
  float stripe = smoothstep(0.42, 0.5, abs(fract(mix(m.x, m.y, sdir) / 7.0) - 0.5));
  c *= 1.0 + (stripe - 0.5) * 0.07 * open * smoothstep(4.0, 1.0, px);
  if (kind.r > 0.02) {
    vec2 t = abs(fract(m / 2.4) - 0.5);
    c *= 1.0 - 0.12 * smoothstep(0.46, 0.5, max(t.x, t.y)) * kind.r * smoothstep(0.7, 0.15, px);
  }
  // ---- woods: a dark floor under the trees, then their crowns, slid toward the eye so that they stand up off the board
  float crownShow = smoothstep(uTreeNear * 0.55, uTreeNear, dist);   // near the eye small trees of wire and sponge stand instead
  float far = smoothstep(1.6, 4.5, px);
  if (mask.g > 0.02) {
    float ch; vec4 tr = kWoodTree(m, ch);
    float under = (1.0 - smoothstep(0.5, 1.25, length(tr.xy) / tr.z)) * step(ch, mask.g + 0.02);
    c *= mix(1.0, mix(mix(0.74, 0.42, under), 0.9, far), mask.g);
  }
  float life = kind.b * 0.9;
  if (life > 0.01) {                                           // people: a dot of paint each, then a speckle
    vec2 q = m / 2.2; vec2 qi = floor(q); vec2 h = kHash2(qi);
    float present = step(1.0 - life * 0.5, kHash(qi + 7.7));
    float d = length(fract(q) - 0.25 - h * 0.5) * 2.2;
    vec3 cloth = mix(vec3(0.74), 0.5 + 0.5 * cos(6.2831 * (h.x + vec3(0.0, 0.33, 0.67))), 0.66);
    float fade1 = smoothstep(0.9, 0.22, px) * crownShow;
    c = mix(c, c * 0.6, (1.0 - smoothstep(0.3, 0.7, d)) * present * fade1);
    c = mix(c, cloth, (1.0 - smoothstep(0.2, 0.36, d)) * present * fade1);
    float sp = kHash(floor(m / 1.6)) * step(1.0 - life * 0.5, kHash(floor(m / 1.6) + 7.7));
    c = mix(c, mix(c, vec3(0.86, 0.8, 0.72), 0.5), sp * (1.0 - fade1) * smoothstep(3.5, 0.9, px) * 0.8);
  }
  {
    vec2 mw = m + par * 7.0;
    vec3 mk = texture2D(tMask, mw / uSize).rgb;
    if (mk.g > 0.05) {
      float ch; vec4 tr = kWoodTree(mw, ch);
      float d = length(tr.xy) / tr.z;
      vec3 base = kLand(texture2D(tAlb, mw / uSize).rgb);
      vec3 cc = base * (1.02 + 0.5 * tr.w) * mix(vec3(1.08, 1.02, 0.86), vec3(0.9, 1.0, 1.06), fract(tr.w * 7.3));
      float dome = sqrt(max(1.0 - d * d, 0.0));
      float a = clamp((1.0 - d) * tr.z / max(px, 0.05), 0.0, 1.0) * step(ch, mk.g + 0.02) * crownShow;
      c = mix(c, cc * (0.6 + 0.58 * dome) * (0.88 + 0.24 * kNoise(mw * 1.1)), a * (1.0 - far));
    }
  }
  // ---- the board: a joint every 3.75 m of the model (750 of these metres), filled and painted over but never quite
  // gone, screws along it, and beside it the carpenter's line the next length was set to, with a tick every half metre
  float board = (1.0 - smoothstep(0.3, 0.55, wat)) * smoothstep(3.2, 0.7, px);
  float zs = (fract(m.y / 750.0 + 0.5) - 0.5) * 750.0;         // metres past the nearest joint
  float inJoint = step(100.0, m.y) * step(m.y, uSize.y - 100.0);
  c *= 1.0 + 0.035 * (kHash(vec2(floor(m.y / 750.0), 3.0)) - 0.5) * 2.0;                  // each length was painted in its own week
  c *= 1.0 - 0.5 * (1.0 - smoothstep(0.22, 0.3 + px * 0.8, abs(zs))) * board * inJoint;
  c *= 1.0 + 0.16 * (1.0 - smoothstep(0.3, 0.9 + px, abs(zs - 0.7))) * board * inJoint;       // the lip of the higher board catches the light
  vec2 sq = vec2((fract(m.x / 30.0) - 0.5) * 30.0, abs(zs) - 6.0);
  c *= 1.0 - 0.3 * (1.0 - smoothstep(0.45, 0.75 + px * 0.5, length(sq))) * board * inJoint * smoothstep(1.4, 0.5, px);
  float pen = (1.0 - smoothstep(0.1, 0.16 + px * 0.6, abs(zs - 14.0)))
            + (1.0 - smoothstep(0.1, 0.16 + px * 0.6, abs((fract(m.x / 100.0) - 0.5) * 100.0))) * step(8.0, zs) * step(zs, 20.0);
  c = mix(c, vec3(0.1, 0.1, 0.11), 0.6 * clamp(pen, 0.0, 1.0) * board * inJoint * smoothstep(1.3, 0.35, px));

  // ---- light: the rod, the model's own glow, and at lamp hours the pools round the pin lamps
  vec3 Lgt = mLight(vF, up);
  float halo = textureLod(tMask, uv, 2.2 + uLod.y).b * 0.5 + textureLod(tMask, uv, 3.4 + uLod.y).b + textureLod(tMask, uv, 5.0 + uLod.y).b * 0.7;
  vec3 sc = mRodCol(vF);
  float lampK = uLamp * (1.0 - smoothstep(0.06, 0.4, dot(sc, vec3(0.3, 0.55, 0.15))));      // lamps are lit where the line no longer shines
  vec3 lit = c * (Lgt + uLampCol * halo * lampK * 9.0);
  lit += uLampCol * mask.b * lampK * 3.0;

  // ---- the mirrors: strips of glass over blue paint, which hold the far bank and the rod as the real water does
  if (wat > 0.3) {
    vec2 tl = (vec2(kNoise(m * 0.021), kNoise(m * 0.021 + 9.1)) - 0.5) * 0.012;              // old glass, a little out of true
    vec3 Nw = normalize(up + T * tl.x + vec3(0.0, 0.0, 1.0) * tl.y);
    float fres = 0.04 + 0.96 * pow(1.0 - max(dot(Nw, V), 0.0), 5.0);
    vec3 R = reflect(-V, Nw);
    vec2 o = vec2(vF.x, vF.y - kYC);
    float tt = -2.0 * dot(o, R.xy) / max(dot(R.xy, R.xy), 1e-5);
    vec3 H = vF + R * tt;                                      // where the mirrored ray meets the far bank
    vec3 refl = uWallTint * (uGlow * 2.2 + sc * 0.25) * step(H.z, ${(LM / 2).toFixed(2)});     // by the front wall it shows the wall; by the open end, the dark hall
    float inside = tt > 0.0 ? smoothstep(${(WALL - 0.3).toFixed(2)}, ${(WALL + 0.45).toFixed(2)}, H.z) * smoothstep(${(ZM + 0.1).toFixed(2)}, ${(ZM - 0.4).toFixed(2)}, H.z) : 0.0;
    if (inside > 0.0) {
      vec2 huv = vec2(0.25 + atan(H.x, kYC - H.y) / 6.2831853, H.z / ${LM.toFixed(2)});
      vec3 ha = kLand(textureLod(tAlb, huv, 5.0 + uLod.x).rgb);
      ha = mix(ha, kLand(textureLod(tAlb, huv, 9.0 + uLod.x).rgb), smoothstep(0.0, 0.5, textureLod(tMask, huv, 6.0 + uLod.y).r) * 0.95);
      refl = mix(refl, ha * mLight(H, vec3(-normalize(vec2(H.x, H.y - kYC)), 0.0)), inside);
    }
    vec3 Mid = vF + R * (tt * 0.5);
    float dm = length(vec2(Mid.x, Mid.y - kYC)) * ${SC.toFixed(1)};
    float inLine = smoothstep(uRodZ.x - 0.2, uRodZ.x + 0.2, Mid.z) * smoothstep(uRodZ.y + 0.2, uRodZ.y - 0.2, Mid.z) * step(0.0, tt);
    float wdt = 22.0 * (1.0 + px * 0.35);
    vec3 rodRefl = sc * uRodPow * exp(-dm * dm / (wdt * wdt)) * inLine;
    vec3 body = alb * (Lgt * 0.9 + 0.02);
    lit = mix(lit, body * (1.0 - fres) + (refl + rodRefl) * fres, smoothstep(0.3, 0.55, wat));
  }
  gl_FragColor = vec4(lit, 1.0);
}`;

// ---------------------------------------------------------------- the model's end walls
// kit/hollow.js's wall at one to two hundred: the same houses in the same places all the way round (it is worked in
// the real wall's metres, with the real wall's own hashes), an arcade at each tier's foot and nine floors of windows
// over it. What differs is the lamp hours: here a lit window is a pin-prick, a hole drilled through the board with a lamp behind it.
const WALL_VERT = /* glsl */`
attribute vec3 aTier;     // tier, part (0 a riser, 1 a terrace, 2 the hub's face), and across a terrace 0 (rail) .. 1 (the foot of the next riser)
attribute vec3 aLoc;      // where on the wall as built: the angle round it (0 on the seats' line), metres from its axis, metres in from its end
${BEND_PARS}
varying vec3 vW; varying vec3 vF; varying vec3 vFN; varying vec3 vTier; varying vec3 vLoc;
void main() {
  vec3 p = position, n = normal;
  vF = p; vFN = n; vTier = aTier; vLoc = aLoc;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const WALL_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uStone, uStone2, uGlass, uGarden, uPave, uWinA, uWinB, uTrack, uAwning; uniform vec3 uHouse[6];
uniform float uHouseMix, uLit, uTime, uSide, uWinPower, uOpen;
uniform vec3 uDark;                        // for the cap, swung open in the hall: the hall's own dark (the rest of its light is what comes out of the tube's mouth)
uniform vec4 uTier[${NT}];                 // per tier: crowd 0..1, garden 0..1, the share of its windows lit, its depth in metres
uniform vec4 uSeats;                       // the seats on the Third: half their length round (m), from and to in from the rail (m), 1 if painted
varying vec3 vW; varying vec3 vF; varying vec3 vFN; varying vec3 vTier; varying vec3 vLoc;
${ROD_GLSL}
${NOISE_GLSL}
// lit windows far off: a scatter of soft points on a lattice q (kit/hollow.js)
vec3 kStars(vec2 q, float share) {
  vec2 c = floor(q); vec2 h = kHash2(c);
  float on = step(1.0 - share * 0.62, kHash(c + 7.7));
  float d = length(fract(q) - 0.5 - (h - 0.5) * 0.5);
  return mix(uWinA, uWinB, h.x) * on * smoothstep(0.42, 0.08, d) * (0.35 + 1.1 * h.y);
}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vFN);
  if (!gl_FrontFacing) N = -N;
  const float RH = ${DRUM.RH.toFixed(1)}, TIERH = ${TIER_H.toFixed(2)}, CIRC = ${C.toFixed(2)};
  float r = vLoc.y * ${SC.toFixed(1)};                         // the real wall's metres from here on
  float xu = ${X0.toFixed(2)} + vLoc.x * RH;                   // round the real floor from its own seam: below nought on the quarter of the model beyond it,
  float xr = xu < 0.0 ? xu + CIRC : xu;                        // so a turn is added there (xu is kept for measuring a pixel: it has no jump in it)
  float arc = xr * r / RH;
  float hgt = RH - r;
  float ti = floor(vTier.x + 0.5);
  vec4 tp = uTier[int(clamp(ti, 0.0, ${NT - 1}.0))];
  vec3 Lgt;
  if (uOpen > 0.5) Lgt = mSpill(vF, N) + uDark; else Lgt = mLight(vF, N);
  vec3 col; vec3 glow = vec3(0.0);
  // the lifts' tracks straight up the wall, and a light climbing each
  float trackU = xr / (CIRC / 8.0);
  float trackD = abs(fract(trackU) - 0.5) * (CIRC / 8.0) * r / RH;
  float trackId = floor(trackU);
  float onTrack = 1.0 - smoothstep(3.2, 4.4, trackD);
  float cab = fract(uTime * 12.0 / ${(DRUM.RH - DRUM.SPINDLE).toFixed(1)} * (0.8 + 0.4 * kHash(vec2(trackId, uSide))) + kHash(vec2(trackId, 3.0 + uSide))) * ${(DRUM.RH - DRUM.SPINDLE).toFixed(1)};
  float cabGlow = onTrack * (1.0 - smoothstep(2.0, 6.0, abs(hgt - cab)));
  float share = clamp(uLit + tp.z, 0.0, 1.0);
  if (vTier.y < 0.5) {
    // ---- a riser
    float rf = RH - ti * TIERH;
    float hy = rf - r;
    float arcR = xr * rf / RH;
    vec2 pu = vec2(xu * rf / RH, hy);
    float px = max(length(dFdx(pu)), length(dFdy(pu)));
    float flH = TIERH / 11.0;
    float fl = floor(hy / flH), fy = fract(hy / flH);
    float colx = arcR / 4.4; float ci = floor(colx), cx = fract(colx) - 0.5;
    float house = floor(arcR / 26.4);
    float hh = kHash(vec2(house, ti * 7.0 + uSide * 3.0));
    float hk = kHash(vec2(house, ti * 5.0 + 31.0 + uSide * 9.0));
    vec3 stone = mix(uStone, uStone2, hh);
    stone = mix(stone, uHouse[int(hk * 5.999)], step(1.0 - uHouseMix, kHash(vec2(house + 77.0, ti * 3.0 + uSide))));
    stone *= (0.9 + 0.2 * kHash(vec2(house, ti + 11.0))) * (0.97 + 0.06 * kNoise(vec2(arcR, hy) * 0.7));
    float party = smoothstep(0.47, 0.5, abs(fract(arcR / 26.4) - 0.5));
    vec2 wid = vec2(ci, fl + ti * 13.0 + uSide * 50.0);
    float wh = kHash(wid), wh2 = kHash(wid + 5.5);
    vec3 day = stone;
    float pin = 0.0; vec3 winCol = mix(uWinA, uWinB, wh2) * (0.55 + 0.9 * kHash(wid + 4.7));
    float on = step(1.0 - share, wh);
    if (fl < 0.5) {
      // the arcade: arches painted dark, and a lamp in every other one once the tier's lamps are lit
      float ax = abs(cx) / 0.38;
      float arch = step(ax, 1.0) * step(fy, 0.5 + 0.34 * sqrt(max(1.0 - ax * ax, 0.0)));
      day = mix(stone * 0.9, uGlass * 0.4 + vec3(0.07, 0.05, 0.03), arch);
      pin = (1.0 - smoothstep(0.2, 0.42 + px * 0.7, length(vec2(cx * 4.4, (fy - 0.42) * flH)))) * step(0.5, wh2 + 0.5 * on) * smoothstep(0.0, 0.03, share);
      winCol = mix(uWinA, uWinB, 0.3) * 0.9;
    } else if (fl < 9.5) {
      float win = step(abs(cx), 0.3) * step(0.24, fy) * step(fy, 0.82);
      float slab = step(fy, 0.07);
      float rail = step(0.07, fy) * step(fy, 0.24) * step(abs(cx), 0.42) * step(0.35, wh2);
      float plant = step(0.03, fy) * step(fy, 0.3) * step(abs(cx), 0.46) * step(0.42, kHash(wid + 3.3)) * step(kNoise(vec2(arcR * 1.7, hy * 1.5)), 0.6);
      float awn = step(abs(cx), 0.36) * step(0.82, fy) * step(fy, 0.93) * step(0.8, wh2);
      day = mix(day, uGlass, win);
      day = mix(day, stone * 1.12, slab);
      day = mix(day, stone * 0.8, rail * 0.6);
      day = mix(day, uGarden * (0.8 + 0.5 * wh), plant);
      day = mix(day, uAwning * (0.7 + 0.6 * hh), awn);
      pin = (1.0 - smoothstep(0.2, 0.42 + px * 0.7, length(vec2(cx * 4.4, (fy - 0.53) * flH)))) * on;
    } else {
      day = stone * (fy > 0.45 ? 1.1 : 0.94);
    }
    day = mix(day, stone * 0.72, party * 0.5);
    float hn = kNoise(vec2(arcR / 9.0, ti * 7.0)) * 0.65 + kNoise(vec2(arcR / 2.3, ti * 3.0 + 9.0)) * 0.35;
    float hang = smoothstep(0.0, 1.2, hy - (TIERH - (2.0 + 15.0 * hn * tp.y)));
    vec3 green = uGarden * (0.7 + 0.55 * kNoise(vec2(arcR * 0.5, hy * 0.5))) * mix(vec3(1.0), vec3(1.25, 1.1, 0.7), step(0.8, kNoise(vec2(arcR * 0.7, hy * 0.7) + 20.0)) * 0.5);
    float fade = smoothstep(2.4, 0.6, px);
    vec3 avg = mix(stone, uGlass, 0.15) * (0.93 + 0.1 * step(0.5, fract(hy / flH * 0.5)));
    avg = mix(avg, uGarden * 0.9, 0.2 * step(0.5, fl) * step(fl, 9.5));
    avg *= fl < 0.5 ? 0.72 : 1.0;
    col = mix(avg, day, fade);
    col = mix(col, green, hang * step(0.05, tp.y));
    col *= Lgt;
    float lv = log2(max(px * 1.7, 4.4) / 4.4), l0 = floor(lv);
    vec2 sq = vec2(arcR, hy + ti * 211.0 + uSide * 977.0) / (4.4 * exp2(l0));
    vec3 farGlow = mix(kStars(sq, share), kStars(sq * 0.5 + 31.0, share), lv - l0) * step(0.5, fl) * step(fl, 9.5);
    glow = uWinPower * mix(farGlow, winCol * pin * 4.5, fade) * (1.0 - hang);
    col = mix(col, uTrack * Lgt, onTrack * 0.85);
    glow = mix(glow, vec3(0.0), onTrack) + vec3(1.0, 0.82, 0.55) * 7.0 * cabGlow;
  } else if (vTier.y < 1.5) {
    // ---- a terrace: a rail, a walk along it, beds and small trees back to the houses; on the Third, the seats
    float de = vTier.z * tp.w;
    vec2 gq = vec2(arc, de), gu = vec2(xu * r / RH, de);
    float px = max(length(dFdx(gu)), length(dFdy(gu)));
    float bed = kFbm(gq / 7.0 + ti * 3.1);
    vec3 garden = uGarden * (0.7 + 0.6 * bed);
    garden = mix(garden, uGarden * vec3(1.5, 1.25, 0.6), step(0.74, kNoise(gq / 2.2 + 5.0)) * 0.5);
    vec2 tq = gq / 5.2; vec2 tc = fract(tq) - 0.5 - (kHash2(floor(tq) + ti) - 0.5) * 0.5;
    float tree = (1.0 - smoothstep(0.22, 0.34, length(tc))) * step(0.45, kHash(floor(tq) + ti * 3.0)) * step(4.0, de);
    garden = mix(garden, uGarden * 0.62, tree * smoothstep(1.6, 0.5, px));
    float walkW = min(3.4, tp.w * 0.34);
    float isWalk = step(de, walkW) + step(tp.w - 1.6, de);
    float beds = smoothstep(0.3, 0.6, kFbm(gq / 13.0 + 40.0 + ti)) * tp.y;
    vec3 ground = mix(uPave * (0.94 + 0.1 * kNoise(gq * 0.9)), garden, clamp(beds * 1.5, 0.0, 1.0) * (1.0 - clamp(isWalk, 0.0, 1.0)));
    ground = mix(ground, uStone * 1.1, step(de, 0.55));
    vec2 q = gq / 1.7; vec2 qi = floor(q); vec2 h = kHash2(qi + ti);
    float present = step(1.0 - tp.x * (0.35 + 0.65 * clamp(isWalk, 0.0, 1.0)), kHash(qi + 7.7 + ti));
    vec3 cloth = mix(vec3(0.72), 0.5 + 0.5 * cos(6.2831 * (h.x + vec3(0.0, 0.33, 0.67))), 0.62);
    float fadeP = smoothstep(1.2, 0.3, px);
    ground = mix(ground, cloth, (1.0 - smoothstep(0.2, 0.36, length(fract(q) - 0.25 - h * 0.5) * 1.7)) * present * fadeP * step(0.6, de));
    ground = mix(ground, mix(ground, vec3(0.6, 0.57, 0.55), 0.55), tp.x * 0.6 * (1.0 - fadeP));
    // the Third's seats, as paint: rows of benches with someone in every place (the grains themselves stand near the opening)
    float sx = vLoc.x * r;                                       // metres round the terrace from the seats' line
    if (uSeats.w > 0.5 && abs(ti - ${TIERS.third}.0) < 0.5 && abs(sx) < uSeats.x && de > uSeats.y && de < uSeats.z) {
      vec2 sq = vec2(sx / 0.62, (de - uSeats.y) / 0.9); vec2 si = floor(sq);
      float aisle = step(1.25, abs(sx - floor(sx / 28.0 + 0.5) * 28.0));
      vec3 sitter = mix(vec3(0.5, 0.42, 0.36), 0.5 + 0.5 * cos(6.2831 * (kHash(si) + vec3(0.0, 0.33, 0.67))), 0.6) * (0.55 + 0.6 * kHash(si + 3.1));
      vec3 rows = mix(vec3(0.45, 0.36, 0.28), sitter, step(0.25, fract(sq.y)) * step(fract(sq.y), 0.8) * step(0.12, fract(sq.x)) * step(fract(sq.x), 0.88) * smoothstep(1.0, 0.25, px));
      rows = mix(rows, vec3(0.44, 0.39, 0.34), smoothstep(0.25, 1.0, px) * 0.8);
      ground = mix(vec3(0.7, 0.66, 0.58), rows, aisle);
    }
    col = ground * Lgt;
    col = mix(col, uTrack * Lgt, onTrack * 0.85);
    glow = vec3(1.0, 0.8, 0.5) * uLit * 0.9 * step(0.975, kHash(floor(gq / 3.0) + ti)) * (1.0 - onTrack) + vec3(1.0, 0.82, 0.55) * 7.0 * cabGlow;
  } else {
    // ---- the hub's face
    col = uStone * 0.4 * Lgt;
    float ring = smoothstep(2.0, 0.0, abs(r - 62.0)) + smoothstep(1.5, 0.0, abs(r - 31.0));
    glow = vec3(1.0, 0.86, 0.6) * ring * (1.5 + 3.0 * uLit);
  }
  gl_FragColor = vec4(col + glow, 1.0);
}`;

// ---------------------------------------------------------------- the rod, and the pin lamps
// The lamp line down the model's axis: a strip that turns about the axis to face the eye (kit/hollow.js's rod, bent
// with the deck). It shows the colour of whichever of its two faces the eye is under.
const ROD_VERT = /* glsl */`
${BEND_PARS}
uniform float uRadius;
varying vec3 vW; varying float vSide; varying float vZ;
void main() {
  vec3 a = vec3(0.0, ${YC.toFixed(3)}, position.z), b = a + vec3(0.0, 0.0, 0.1), n = vec3(0.0, 1.0, 0.0), n2 = n;
  kBend(a, n); kBend(b, n2);
  vec3 side = normalize(cross(b - a, cameraPosition - a) + vec3(1e-6, 0.0, 0.0));
  vec3 p = a + side * position.x * uRadius;
  vW = p; vSide = position.x; vZ = position.z;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const ROD_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uPower, uCore, uEnds; uniform vec3 uEye;
varying vec3 vW; varying float vSide; varying float vZ;
${ROD_GLSL}
void main() {
  ${CLIP_FRAG}
  float a = abs(vSide);
  float prof = uCore > 0.5 ? 1.0 : (1.0 / (1.0 + 60.0 * a * a) - 1.0 / 61.0);
  float ends = smoothstep(uRodZ.x, uRodZ.x + uEnds, vZ) * smoothstep(uRodZ.y, uRodZ.y - uEnds, vZ);
  gl_FragColor = vec4(mRodCol(uEye) * uPower * prof * ends, 1.0);
}`;
// Small lights, each with the second of the flight it comes on at (it flares a little, then settles): worlds/
// gloaming_dusk.js's timed lamps without the lifting. One draw call for any number.
const LAMP_VERT = /* glsl */`
attribute vec3 aPos;      // where (flat)
attribute vec4 aColSize;  // rgb x strength, size in metres
attribute vec2 aWhen;     // when it comes on, and the seconds it takes
${BEND_PARS}
uniform float uT, uPx, uMinPx, uMaxPx, uPower, uFall; uniform vec2 uRes;
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  float on = smoothstep(aWhen.x, aWhen.x + aWhen.y, uT);
  vQ = position.xy; vC = vec3(0.0); vW = vec3(0.0);
  if (on <= 0.0) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
  vec3 p = aPos, n = vec3(0.0, 1.0, 0.0);
  kBend(p, n);
  vW = p;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float px = aColSize.w * uPx / max(-mv.z, 0.001);
  float shown = clamp(px, uMinPx, uMaxPx);
  float k = min(pow(px / shown, uFall), 1.0);
  float pop = 1.0 + 1.3 * on * (1.0 - smoothstep(0.0, 1.8, uT - aWhen.x - aWhen.y));
  vC = aColSize.rgb * k * on * pop * uPower;
  vec4 clip = projectionMatrix * mv;
  clip.xy += position.xy * shown / uRes * clip.w * 2.0;
  gl_Position = clip;
}`;
const LAMP_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uSoft;
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  ${CLIP_FRAG}
  float a = pow(max(1.0 - length(vQ) * 2.0, 0.0), uSoft);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;
const bendU = (frame) => ({ value: new Vector3(frame.a0, frame.z0, frame.floorR) });

// a growing list of timed lights: add(p (flat [x, y, z]), colour, power, size in metres, the second it comes on, the seconds it takes)
function lampList() {
  const P = [], CS = [], W = [], cache = new Map(), c = new Color();
  return {
    add(p, color, power, size, when, ramp = 0.8) {
      let k = cache.get(color); if (!k) { c.set(color); k = [c.r, c.g, c.b]; cache.set(color, k); }
      P.push(p[0], p[1], p[2]); CS.push(k[0] * power, k[1] * power, k[2] * power, size); W.push(when, ramp);
    },
    mesh(frame, o = {}) {
      const g = new InstancedBufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aPos', new InstancedBufferAttribute(new Float32Array(P), 3));
      g.setAttribute('aColSize', new InstancedBufferAttribute(new Float32Array(CS), 4));
      g.setAttribute('aWhen', new InstancedBufferAttribute(new Float32Array(W), 2));
      g.instanceCount = W.length / 2;
      const m = new Mesh(g, new ShaderMaterial({
        uniforms: { uClip: G.uClip, uPx: G.uPx, uRes: G.uRes, uT: { value: 0 }, uBend: bendU(frame), uMinPx: { value: o.minPx || 1.2 }, uMaxPx: { value: o.maxPx || 60 }, uSoft: { value: o.soft || 1.6 }, uPower: { value: 1 }, uFall: { value: o.fall || 2 } },
        vertexShader: LAMP_VERT, fragmentShader: LAMP_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
      }));
      m.frustumCulled = false; m.renderOrder = 10;
      return m;
    },
  };
}

// ---------------------------------------------------------------- geometry
// The tube's inside between its two walls' feet: a cylinder seen from within, its uv the real floor's.
function landGeo() {
  const NA = 192, NZ = 30, pos = [], uv = [], idx = [];
  for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NA; i++) {
    const a = -Math.PI + (i / NA) * TAU, z = WALL + (ZM - WALL) * (j / NZ), p = polar(a, RM, z);
    pos.push(p[0], p[1], p[2]); uv.push(0.25 + a / TAU, z / LM);
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + NA + 1, c = a + 1, d = b + 1; idx.push(a, b, c, b, d, c); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('aUv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
// An end wall as kit/hollow.js builds the real one, at one to two hundred: thirty risers and terraces and the hub's
// face. side 0 is the front wall, where it stands; side 1 the back wall, which `move` (a Matrix4) swings away on the
// cap's hinge.
function* wallGeo(side, move) {
  const NX = 192, NS = NT * 2 + 1, NV = NS * (NX + 1) * 2, v = new Vector3(), q = new Vector3(), sin = [], cos = [], ang = [];
  const pos = new Float32Array(NV * 3), nrm = new Float32Array(NV * 3), tier = new Float32Array(NV * 3), loc = new Float32Array(NV * 3), idx = new Uint32Array(NS * NX * 6);
  for (let i = 0; i <= NX; i++) { const a = -Math.PI + (i / NX) * TAU; ang.push(a); sin.push(Math.sin(a)); cos.push(Math.cos(a)); }
  let n = 0, ni = 0;
  const put = (i, r, zw, kind, t, part, e) => {
    v.set(r * sin[i], YC - r * cos[i], side === 0 ? zw : LM - zw);
    if (kind === 0) q.set(0, 0, side === 0 ? 1 : -1); else q.set(-sin[i], cos[i], 0);
    if (move) { v.applyMatrix4(move); q.transformDirection(move); }
    const k = n * 3;
    pos[k] = v.x; pos[k + 1] = v.y; pos[k + 2] = v.z; nrm[k] = q.x; nrm[k + 1] = q.y; nrm[k + 2] = q.z;
    tier[k] = t; tier[k + 1] = part; tier[k + 2] = e; loc[k] = ang[i]; loc[k + 1] = r; loc[k + 2] = zw;
    n++;
  };
  const strip = (r0, z0, r1, z1, kind, t, part, e0, e1) => {
    const s = n;
    for (let i = 0; i <= NX; i++) { put(i, r0, z0, kind, t, part, e0); put(i, r1, z1, kind, t, part, e1); }
    for (let i = 0; i < NX; i++) {
      const a = s + i * 2, b = a + 1, c = a + 2, d = a + 3;
      if (side === 0) { idx[ni++] = a; idx[ni++] = c; idx[ni++] = b; idx[ni++] = b; idx[ni++] = c; idx[ni++] = d; } else { idx[ni++] = a; idx[ni++] = b; idx[ni++] = c; idx[ni++] = b; idx[ni++] = d; idx[ni++] = c; }
    }
  };
  let z = WALL, r = RM;
  for (let t = 0; t < NT; t++) {
    strip(r, z, r - TH, z, 0, t, 0, 0, 0);                                 // riser
    strip(r - TH, z, r - TH, z - DEPTHS[t] / SC, 1, t, 1, 0, 1);            // terrace, from its rail to the foot of the next riser
    r -= TH; z -= DEPTHS[t] / SC;
    if (t % 6 === 5) yield 'model: wall';
  }
  strip(r, 0, 0.004, 0, 0, NT - 1, 2, 0, 0);                               // the hub's face
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('normal', new BufferAttribute(nrm, 3));
  g.setAttribute('aTier', new BufferAttribute(tier, 3));
  g.setAttribute('aLoc', new BufferAttribute(loc, 3));
  g.setIndex(new BufferAttribute(idx, 1));
  return g;
}
// the rod as a strip: x = which edge, z = along the axis
function rodGeo(z1, z2) {
  const n = 48, pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const z = z1 + (z2 - z1) * (i / n); pos.push(-1, 0, z, 1, 0, z); }
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
// a sphere that holds a stretch of the model, on the drum: for meshes whose shaders place their own vertices
const boundsOf = (frame, x0, y0, z0, x1, y1, z1) => { const a = frame.point(x0, y0, z0), b = frame.point(x1, y1, z1); return new Sphere(a.clone().add(b).multiplyScalar(0.5), a.distanceTo(b) / 2 + 0.5); };

// Many copies of one small thing in the model: each has a place p (flat), the angle a round the model that its own up
// lies along (0 on the lowest line: kit/geo.js's instances() only knows the deck's up), a yaw, a scale and a colour.
function minis(geometry, material, items, frame) {
  const mesh = new InstancedMesh(geometry, material, items.length);
  const m = new Matrix4(), rz = new Matrix4(), ry = new Matrix4(), s = new Vector3(), c = new Color(), pts = [];
  let maxS = 0;
  items.forEach((it, i) => {
    const sc = it.scale === undefined ? 1 : it.scale;
    if (typeof sc === 'number') s.set(sc, sc, sc); else s.set(sc[0], sc[1], sc[2]);
    m.makeTranslation(it.p[0], it.p[1], it.p[2]).multiply(rz.makeRotationZ(it.a || 0)).multiply(ry.makeRotationY(it.yaw || 0)).scale(s);
    mesh.setMatrixAt(i, m);
    const k = rgb(it.color || '#ffffff'); c.setRGB(k[0], k[1], k[2]); mesh.setColorAt(i, c);
    pts.push(frame.point(it.p[0], it.p[1], it.p[2]));
    maxS = Math.max(maxS, s.x, s.y, s.z);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  const sph = new Sphere().setFromPoints(pts);
  sph.radius += (geometry.boundingSphere ? geometry.boundingSphere.radius : 1) * maxS;
  mesh.boundingSphere = sph;
  return mesh;
}

// The light inside the model as a rig for the kit's lit material: the rod and the model's own glow, in flat
// co-ordinates. soft: how far every face is lit as if it faced the axis (small trees and people are lumps of sponge).
function modelRig(SH, soft) {
  return {
    kind: 'model',
    uniforms: { uRodA: SH.uRodA, uRodB: SH.uRodB, uGlow: SH.uGlow, uSpill: SH.uSpill, uRodZ: SH.uRodZ, uSharp: SH.uSharp, uDark: SH.uDark, uSoftM: { value: soft } },
    glsl: /* glsl */`
${ROD_GLSL}
uniform float uSoftM; uniform vec3 uDark;
vec3 kUp(vec3 P) { return vec3(-normalize(P.xy + vec2(1e-5)), 0.0); }
vec3 kAir(vec3 c, vec3 P) { return c; }
vec3 kLight(vec3 P, vec3 N, vec3 F, vec3 FN) {
  vec3 U = vec3(normalize(vec2(-F.x, kYC - F.y) + vec2(0.0, 1e-5)), 0.0);
  vec3 n = normalize(mix(FN, U, uSoftM));
  return mLight(F, n) * smoothstep(kZM + 14.0, kZM + 1.0, F.z) + mSpill(F, n) + uDark;
}`,
  };
}

// ---------------------------------------------------------------- the flight
// Along the Arcade to the door; into the hall, the cap ahead and the tube's mouth to the left; left and up the gantry
// steps; along the gantry past Hesk and over its end rail; down to the mirror and along it, dipping to the card by the
// joint, past the slate on the basin, looking up once at the far bank; over the kneeling plank and low over the lamps
// in the Dim End's woods; up the wall to the rail of the Third, and level over its seats into the opening behind them.
// (ey, ez: where that opening is; dy, dz: a correction to the last two keys, see build.)
const yLand = (x) => YC - Math.sqrt(RM * RM - x * x);
function flightKeys(ey, ez, dy = 0, dz = 0) {
  const seats = [0, TY + 0.016, TRAIL - 0.045], card = [0.471, yLand(0.47) + 0.165, SEAM + 0.046], prop = [0.95, 1.5, MIDZ / SC + 0.02];
  // inside the model a key looks along the line to a thing, at a point a fixed way off: the things themselves are from
  // a hand's breadth to fourteen metres away, and a look that jumped between them would swing the view round
  const K = (t, p, to, d = 3.5) => { const v = [to[0] - p[0], to[1] - p[1], to[2] - p[2]], k = d / Math.hypot(v[0], v[1], v[2]); return { t, p, look: [p[0] + v[0] * k, p[1] + v[1] * k, p[2] + v[2] * k] }; };
  return [
    { t: 0, p: [-30.0, 1.6, 32.35], look: [-19, 1.75, 32.1] },
    { t: 3.6, p: [-23.8, 1.6, 32.25], look: [-12, 1.9, 31.6] },
    { t: 7.0, p: [-17.6, 1.62, 32.1], look: [2, 6.5, 24] },
    { t: 10.5, p: [-11.2, 1.68, 32.1], look: [3, 8.5, 19] },
    { t: 14.0, p: [-5.0, 1.75, 31.4], look: [0.5, 8.0, 16.9] },
    { t: 17.2, p: [-0.9, 2.2, 28.6], look: [0, 7.5, 16] },
    { t: 20.8, p: [0.15, 5.0, 23.9], look: [0, 7.0, 12] },
    { t: 24.2, p: [0.3, 5.52, 19.2], look: [0.2, 5.5, 8] },
    { t: 27.0, p: [0.42, 5.52, 16.1], look: [0.6, 4.0, 8] },
    { t: 28.6, p: [0.55, 5.5, 14.75], look: [0.75, 2.5, 8.5] },
    { t: 31.0, p: [0.75, 3.6, 13.2], look: [0.8, 1.6, 8.6] },
    K(33.6, [0.72, 2.3, 12.3], card),
    K(35.7, [0.64, yLand(0.64) + 0.42, SEAM + 0.52], card),
    K(38.0, [0.6, 1.8, 10.8], prop),
    K(40.2, [0.52, 1.98, 10.0], [0.8, 1.75, 7.0]),
    K(42.4, [0.55, 2.2, 8.95], [0.6, 6.0, 5.5]),
    K(44.8, [0.72, 2.3, 7.95], [0.3, 14.5, 2.5]),
    K(46.8, [0.77, 2.17, 7.17], [0.5, 5.4, 0.0]),
    K(48.8, [0.8, 2.0, 6.38], [0.75, 1.5, 5.3]),
    { t: 51.6, p: [0.72, 1.85, 5.0], look: [0.45, 2.1, 1.9] },
    { t: 53.6, p: [0.58, 1.98, 4.15], look: [0.3, 1.62, 2.55] },
    { t: 55.8, p: [0.36, 2.55, 3.15], look: [0.08, 3.1, 1.7] },
    { t: 58.0, p: [0.14, 3.42, 2.3], look: seats },
    { t: 60.2, p: [0.02, ey - 0.004, ez + 0.62], look: seats },
    { t: 62.0, p: [0, ey + dy * 0.5, ez + 0.235 + dz * 0.5], look: [0, ey - 0.05, ez + 0.02] },
    { t: 64.4, p: [0, ey + dy, ez - 0.092 + dz], look: [0, ey, ez - 0.6] },
  ];
}

// ---------------------------------------------------------------- small things
// Model trees, people, tents and lamp pins are made at the real thing's size and stood at a two-hundredth of it.
function miniTree(kind) {
  const g = new Geo();
  if (kind === 'poplar') { g.tint(0.3).cyl(0, 0, 0, 0.3, 0.2, 3.0, 4, '#5b4735', { cap: false }); g.tint(1).blob(0, 8.5, 0, [1.7, 6.4, 1.7], 0, '#ffffff', { lump: 0.14, seed: 7 }); }
  else {
    g.tint(0.3).cyl(0, 0, 0, 0.42, 0.26, 4.2, 4, kind === 'birch' ? '#e2dfd4' : '#8a735c', { cap: false });
    g.tint(1).blob(0, 7.1, 0, [3.6, 3.2, 3.6], 0, '#ffffff', { lump: 0.22, seed: 3, shadeBottom: 0.78 }).blob(1.7, 5.6, 0.9, [2.2, 1.8, 2.2], 0, '#ffffff', { lump: 0.2, seed: 5, shadeBottom: 0.78 });
  }
  return g.build();
}
// a tent of unit radius: a wall and a cone roof in eight gores, every other one the copy's colour, lit from inside at night
function miniTent(wall, roof) {
  const g = new Geo(), n = 8;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    g.tint(i % 2 ? 1 : 0);
    const col = i % 2 ? '#ffffff' : '#f2ebdc';
    g.quad([c1, 0, s1], [c0, 0, s0], [c0, wall, s0], [c1, wall, s1], col, 0.9);
    g.tri([c1 * 1.04, wall - 0.02, s1 * 1.04], [c0 * 1.04, wall - 0.02, s0 * 1.04], [0, wall + roof, 0], col, 0.45);
  }
  return g.tint(0).build();
}
// a walk lamp: a wire and a bead (the bead's light is a pin lamp of its own)
function miniPin() { const g = new Geo(); g.cyl(0, 0, 0, 0.13, 0.11, 4.2, 3, '#4a4b50', { cap: false }); g.cyl(0, 4.2, 0, 0.26, 0.2, 0.5, 4, '#fff0c8', { emit: 0.25 }); return g.build(); }
// someone in a seat on the Third: a body and a head, or (far along the rows) a front and a top
function grainGeo(whole) {
  const g = new Geo();
  if (whole) { g.tint(1).box(-0.2, 0, -0.13, 0.2, 0.66, 0.13, '#ffffff', { skip: 'b' }); g.tint(0).box(-0.11, 0.7, -0.1, 0.11, 0.95, 0.11, '#c99a72', { skip: 'b' }); }
  else { g.tint(1).quad([-0.2, 0, 0.13], [0.2, 0, 0.13], [0.2, 0.7, 0.13], [-0.2, 0.7, 0.13], '#ffffff'); g.tint(0.35).quad([-0.16, 0.7, 0.13], [0.16, 0.7, 0.13], [0.14, 0.95, -0.1], [-0.14, 0.95, -0.1], '#c99a72'); }
  return g.tint(0).build();
}
// a band round the model: n quads from angle a0 to a1 between the edge at (r0, z0) and the edge at (r1, z1). The first
// edge is the lower or nearer one: the face looks at the axis (a tread) or along +z (a riser)
function band(g, a0, a1, n, r0, z0, r1, z1, col, emit = 0) {
  for (let i = 0; i < n; i++) {
    const a = a0 + (a1 - a0) * (i / n), b = a0 + (a1 - a0) * ((i + 1) / n);
    g.quad(polar(a, r0, z0), polar(b, r0, z0), polar(b, r1, z1), polar(a, r1, z1), col, emit);
  }
}
// a row of lit cards on something held or propped: a painter's slate. Drawn in the Geo's own co-ordinates, on the plane
// z = 0 facing -z, w by h, its lower edge at y = 0
const SLIDES = ['#ffc480', '#ffd8a0', '#fff0dc', '#f2fff8', '#c8f0e0', '#8fd8bc', '#6fc9a8', '#45a088', '#1f5a52', '#16302e', '#2a3a5a', '#e8a880'];
function slate(g, w, h, o = {}) {
  const e = o.emit === undefined ? 2.2 : o.emit, cols = o.cols || 6, rows = o.rows || 2, m = w * 0.06, cw = (w - 2 * m) / cols, ch = (h * (o.tally ? 0.56 : 0.86) - m) / rows;
  g.box(-w / 2, 0, 0, w / 2, h, 0.012 * (w / 0.3), '#15191a');
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = -w / 2 + m + c * cw, y = h - m - (r + 1) * ch;
    g.quad([x + cw * 0.92, y, -0.003], [x, y, -0.003], [x, y + ch * 0.86, -0.003], [x + cw * 0.92, y + ch * 0.86, -0.003], SLIDES[(c + r * cols) % SLIDES.length], e * (1 - 0.12 * r));
  }
  if (o.tally) {
    // nine strokes: four and a bar across them, and four more
    const y0 = h * 0.1, y1 = h * 0.36, sw = w * 0.012, x0 = -w * 0.3, st = (x, a, b) => g.quad([x + sw, a, -0.003], [x - sw, a, -0.003], [x - sw, b, -0.003], [x + sw, b, -0.003], '#e9e6da', 1.6);
    for (let i = 0; i < 4; i++) { st(x0 + i * w * 0.05, y0, y1); st(x0 + w * 0.34 + i * w * 0.05, y0, y1); }
    g.quad([x0 + w * 0.19, y0 + h * 0.03, -0.0045], [x0 - w * 0.04, y1 - h * 0.07, -0.0045], [x0 - w * 0.04, y1 - h * 0.03, -0.0045], [x0 + w * 0.19, y0 + h * 0.07, -0.0045], '#e9e6da', 1.6);
  }
}

// ---------------------------------------------------------------- the model
// On the journey the dusk's painter is run here for the first time, and code run for the first time is slow: its first
// two steps took 40 to 50 ms in three builds out of five (once 190), which is a stutter in the world on screen. So,
// once a page, the kit's shape makers that it leans on are run beforehand in small pieces (shapes made and thrown
// away: nothing is painted). With that the painter's own steps stay under 30 ms.
let WARM = false;
function* warmPainter(plan) {
  if (WARM) return;
  WARM = true;
  for (let k = 0, seed = 300; k < 20; k++) {
    const p = new Path2D(), n = Math.min(50, 3 << k);                 // a few at first, then fifty to a step
    for (let i = 0; i < n; i++) p.addPath(plan.blob(100 + i * 50, 1000, 60, 40, { wobble: 0.35, lobes: 6, seed: seed++, n: 24 }));
    yield 'model: warming';
  }
  const p = new Path2D(), shift = new DOMMatrix().translate(C, 0), pts = [];
  for (let i = 0; i <= 240; i++) pts.push([(i / 240) * C, 500 + Math.sin(i * 0.41) * 34]);
  for (let i = 0; i < 60; i++) { p.addPath(plan.rect(i * 10, 0, i * 10 + 50, 50, 5), shift); p.addPath(plan.ellipse(i * 10, 100, 20, 20)); }
  for (let j = 0; j < 4; j++) { p.addPath(plan.line(pts)); p.addPath(plan.curve(pts)); }
  yield 'model: warming';
}
// Everything that is the model itself: the painted land, both walls (the back one swung away with the cap), the rod,
// the pin lamps in the order the real dusk lights them, and near the flight the small trees, people, tents and lamp
// pins that the paint stands in for farther off. Returns what the world must keep hold of to run the dusk through it.
function* buildModel(ctx, frame, SH, path, capMove) {
  const inside = new Group();                 // what is in the tube: not drawn while the flight is still on the Arcade
  // The land's colours are painted at the size a Hollow's are (the flight goes within half a metre of them, and at
  // half that size the flower beds' stripes run together); what the land is (water, woods, lamps) at half that, and
  // paving and people at a quarter. The kit's Plan paints colour and mask at one size, so it is opened at the smaller
  // and its colour canvas changed for a larger one before anything is painted: each layer is drawn at its canvas's own size.
  const W = ctx.q && ctx.q.plan && ctx.q.plan[0] >= 4096 ? 4096 : 2048;        // the colours' canvas is W by W / 2 (halve both numbers for a lighter build and softer paint)
  const plan = new Plan([W / 2, W / 4]);
  {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = W / 2;
    const cx = cv.getContext('2d'); cx.fillStyle = '#5d8a3c'; cx.fillRect(0, 0, W, W / 2);
    plan.cv.alb = cv; plan.cx.alb = cx;
  }
  const lamps = [], tents = [];
  yield 'model: plan';
  yield* warmPainter(plan);
  yield* paintGloaming(plan, lamps, tents);     // the dusk's own painter
  // (the painting it asks for is handed to the plan one piece a frame: the kit's own settle() does four, and four are a stutter in the world on screen)
  for (const piece of plan.queue.splice(0)) { plan.queue.push(piece); yield* plan.settle(); }
  // (and the graphics card is given a few frames to finish it before the plan is read back: the reading waits for it)
  for (let i = 0; i < 10; i++) yield '~model: plan settling';
  const at = yield* plan.reader();
  const tex = plan.textures(ctx.renderer);
  if (ctx.renderer && ctx.renderer.initTexture) for (const k of ['alb', 'mask', 'kind']) { yield '~model: plan'; ctx.renderer.initTexture(tex[k]); }
  yield '~model: plan sent';
  const U = (o) => ({ uClip: G.uClip, uBend: bendU(frame), uRodA: SH.uRodA, uRodB: SH.uRodB, uGlow: SH.uGlow, uSpill: SH.uSpill, uRodZ: SH.uRodZ, uSharp: SH.uSharp, ...o });
  const flatBounds = (g) => { g.computeBoundingSphere(); const c = g.boundingSphere.center; g.boundingSphere = new Sphere(frame.point(c.x, c.y, c.z), g.boundingSphere.radius + 0.4); return g; };

  // ---- the land
  const land = new Mesh(flatBounds(landGeo()), new ShaderMaterial({
    uniforms: U({ tAlb: { value: tex.alb }, tMask: { value: tex.mask }, tKind: { value: tex.kind }, uSize: { value: new Vector2(C, L) }, uEye: SH.uEye, uLampCol: { value: vec3col('#ffc68a') }, uWallTint: SH.uWallTint, uLamp: SH.uLamp, uRodPow: SH.uRodPow, uTreeNear: { value: 100 }, uLod: { value: new Vector2(Math.log2(W / 4096), Math.log2(W / 8192)) } }),
    vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, side: FrontSide,
  }));
  land.renderOrder = -5;
  inside.add(land);
  yield 'model: land';

  // ---- the walls, in the dusk's own paint
  const wallMat = (side, open) => {
    const tiers = [];
    for (let i = 0; i < NT; i++) tiers.push(new Vector4(i < 23 ? 1 : 0.7, i < 23 ? 0.25 : 0.8, 0, DEPTHS[i]));
    return new ShaderMaterial({
      uniforms: U({
        uStone: { value: vec3col('#e4dccc') }, uStone2: { value: vec3col('#d6c6aa') }, uGlass: { value: vec3col('#4e6470') }, uGarden: { value: vec3col('#77a352') }, uPave: { value: vec3col('#d2c8b2') },
        uWinA: { value: vec3col('#ffb060') }, uWinB: { value: vec3col('#ffe0b0') }, uTrack: { value: vec3col('#f1ece0') }, uAwning: { value: vec3col('#c9603c') },
        uHouse: { value: ['#d9c2a0', '#c9b49a', '#b4c4b8', '#e0d2ae', '#a9bcc4', '#d4b09c'].map((h) => vec3col(h)) }, uHouseMix: { value: 0.4 },
        uLit: { value: 0 }, uTime: G.uTime, uSide: { value: side }, uWinPower: { value: 2.0 }, uOpen: { value: open ? 1 : 0 }, uDark: SH.uDark,
        uTier: { value: tiers }, uSeats: { value: new Vector4(224, 3.4, 16, side === 0 ? 1 : 0) },
      }),
      vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, side: FrontSide,
    });
  };
  const front = new Mesh(flatBounds(yield* wallGeo(0, null)), wallMat(0, false));
  inside.add(front);
  yield 'model: front wall';
  const cap = new Mesh(flatBounds(yield* wallGeo(1, capMove)), wallMat(1, true));
  yield 'model: cap';

  // ---- the rod: a lit line and its glow (the spar that carries it is drawn with the model's fittings)
  const rodMat = (radius, core) => new ShaderMaterial({
    uniforms: U({ uRadius: { value: radius }, uPower: core ? SH.uRodPow : SH.uHaloPow, uCore: { value: core ? 1 : 0 }, uEnds: { value: core ? 0.01 : 0.45 }, uEye: SH.uEye }),
    vertexShader: ROD_VERT, fragmentShader: ROD_FRAG, side: DoubleSide, transparent: !core, depthWrite: core, blending: core ? NormalBlending : AdditiveBlending,
  });
  for (const core of [true, false]) {
    const m = new Mesh(rodGeo(DRUM.SUN0 / SC - 0.3, LM - DRUM.SUN0 / SC + 0.3), rodMat(core ? 3.2 / SC : 260 / SC, core));
    m.geometry.boundingSphere = boundsOf(frame, -1.4, YC - 1.4, 1.9, 1.4, YC + 1.4, ZM);
    m.renderOrder = core ? 0 : 8;
    inside.add(m);
  }

  // ---- the pin lamps, each at the second its lamp in the Hollow comes on (worked exactly as that world works it)
  const pins = lampList(), lrng = makeRng('gloaming-lamps');
  const LOOK = { lane: [6, 1.3], quay: [6, 1.2], ring: [9, 1.9], bowl: [8, 1.6], basin: [11, 1.8] };
  let tl = performance.now();
  for (const q of lamps) {
    const a = (q.x - X0) / DRUM.RH, f = (1 - Math.cos(a)) / 2, look = LOOK[q.kind];
    let when = q.when;
    if (q.kind !== 'basin' && q.kind !== 'bowl') when = Math.max(23.5 + lrng.f(0, 2.5), when - 11 * f * f);
    when += lrng.f(0, 0.7);
    if (q.z < WALL * SC + 6 || q.z > ZM * SC - 4) continue;       // under the front wall's steps, or gone with the cap
    pins.add(onModel(q.x - X0, q.kind === 'ring' ? 5.2 : 4.6, q.z), q.color, look[0], look[1] / SC, toFlight(when), 1.0);
    if (performance.now() - tl > 4) { yield 'model: lamps'; tl = performance.now(); }
  }
  yield 'model: lamps';

  // ---- near the flight: trees where the paint has crowns (kit/flora.js's rule, cell for cell), people, tents, lamp pins
  const flight = [];
  for (const p of path.points(0.25)) {
    if (p.z > ZM - 0.4 || p.z < WALL || Math.abs(p.x) > 3) continue;
    const r = Math.hypot(p.x, YC - p.y);
    flight.push({ x: X0 + Math.atan2(p.x, YC - p.y) * DRUM.RH, z: p.z * SC, h: (RM - r) * SC });
  }
  const low = flight.filter((q) => q.h < 300), dens = ctx.density || 1;
  const near = (x, z) => { let b = 1e18; for (const q of low) { const dx = q.x - x, dz = q.z - z, d = dx * dx + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)), fr = (x) => x - Math.floor(x);
  const span = (pad) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of low) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); } return [x0 - pad, x1 + pad, Math.max(WALL * SC + 6, z0 - pad), Math.min(ZM * SC - 6, z1 + pad)]; };
  const stand = (x, z) => ({ p: onModel(x - X0, 0, z), a: (x - X0) / DRUM.RH });
  const miniMat = litMaterial(modelRig(SH, 0.45), { bend: frame, soft: 0 });
  const tentMat = litMaterial(modelRig(SH, 0.3), { bend: frame, soft: 0, emit: 0 });
  const small = new Group();
  {
    const S = WOOD_CELL, R = 125, R2 = R * 1.5, [x0, x1, z0, z1] = span(R2), lists = { round: [], poplar: [], birch: [] };
    let t0 = performance.now(), count = 0;
    for (let gz = Math.floor(z0 / S); gz * S < z1 && count < 3000; gz++) {
      for (let gx = Math.floor(x0 / S); gx * S < x1; gx++) {
        const r = cellRand(gx, gz), x = (gx + 0.15 + 0.7 * r[0]) * S, z = (gz + 0.15 + 0.7 * r[1]) * S, s = at(x, z);
        if (s.wood < 0.05 || r[2] >= s.wood + 0.02 || s.water > 0.2 || hash2(gx, gz, 53) > dens) continue;
        const d = near(x, z);
        if (d > R2 || (d > R && hash2(gx, gz, 37) > 1 - (d - R) / (R2 - R))) continue;
        const w = hash2(gx, gz, 41) * 5, kind = w < 3 ? 'round' : w < 4 ? 'poplar' : 'birch', tint = kind === 'birch' ? [1.2, 1.15, 0.9] : [1, 1, 1];
        const sc = S * (0.36 + 0.2 * r[3]) / 3.6 / SC, f = fr(r[3] * 7.3), k = (1.02 + 0.5 * r[3]) * 1.05;
        lists[kind].push({ ...stand(x, z), yaw: hash2(gx, gz, 71) * 6.28, scale: [sc, sc * (0.9 + 0.35 * hash2(gx, gz, 83)), sc], color: [lin(s.r) * k * (1.08 - 0.18 * f) * tint[0], lin(s.g) * k * (1.02 - 0.02 * f) * tint[1], lin(s.b) * k * (0.86 + 0.2 * f) * tint[2]] });
        count++;
      }
      if (performance.now() - t0 > 4) { yield 'model: trees'; t0 = performance.now(); }
    }
    for (const kind in lists) if (lists[kind].length) small.add(minis(miniTree(kind), miniMat, lists[kind], frame));
    yield 'model: trees';
  }
  {
    const cell = 4, R = 100, [x0, x1, z0, z1] = span(R), lists = new Map(), k = 0.75 * Math.min(dens, 1.4) * cell * cell / 100;
    let t0 = performance.now(), count = 0;
    for (let gz = Math.floor(z0 / cell); gz * cell < z1 && count < 1500; gz++) {
      for (let gx = Math.floor(x0 / cell); gx * cell < x1; gx++) {
        const x = (gx + hash2(gx, gz, 5)) * cell, z = (gz + hash2(gx, gz, 9)) * cell, s = at(x, z);
        if (s.water > 0.25 || s.life < 0.05 || s.wood > 0.6) continue;
        const d = near(x, z);
        if (d > R || hash2(gx, gz, 13) > k * s.life * (1 - (d / R) * (d / R))) continue;
        const key = (hash2(gx, gz, 23) < 0.5 ? 1 : 3) + (hash2(gx, gz, 17) < 0.25 ? 'sit' : 'stand');
        let a = lists.get(key); if (!a) lists.set(key, a = []);
        a.push({ ...stand(x, z), yaw: hash2(gx, gz, 31) * 6.28, scale: (0.9 + 0.2 * hash2(gx, gz, 43)) / SC, color: CLOTH[Math.floor(hash2(gx, gz, 29) * CLOTH.length)] });
        count++;
      }
      if (performance.now() - t0 > 4) { yield 'model: people'; t0 = performance.now(); }
    }
    for (const [key, list] of lists) small.add(minis(figureGeo(SKIN[+key[0]], key.slice(1)), miniMat, list, frame));
    yield 'model: people';
  }
  {
    const tItems = [], topItems = [], pinItems = [], far = span(560), by = span(170);
    for (const q of tents) {
      if (q.x < far[0] || q.x > far[1] || q.z < far[2] || q.z > far[3] || near(q.x, q.z) > 560) continue;
      (q.top ? topItems : tItems).push({ ...stand(q.x, q.z), yaw: hash2(Math.round(q.x), Math.round(q.z), 3) * 6.28, scale: q.top ? [q.r / SC, q.r * 0.6 / SC, q.r / SC] : q.r / SC, color: q.color });
    }
    if (tItems.length) small.add(minis(miniTent(0.42, 0.56), tentMat, tItems, frame));
    if (topItems.length) small.add(minis(miniTent(0.36, 0.62), tentMat, topItems, frame));
    yield 'model: tents';
    for (const q of lamps) if (q.x > by[0] && q.x < by[1] && q.z > by[2] && q.z < by[3] && near(q.x, q.z) < 170) pinItems.push({ ...stand(q.x, q.z), scale: 1 / SC });
    if (pinItems.length) small.add(minis(miniPin(), miniMat, pinItems, frame));
    yield 'model: lamp pins';
  }
  inside.add(small);
  return { inside, small, land, front, cap, pins, at, tentMat, low };
}

// ---------------------------------------------------------------- what stands in and about the model, at our own size
// The gantry and its steps; the spar and hub; and what the painters have left on the land: a pencil by the joint and a
// card on a stick, a slate propped in the basin, a kneeling plank over the mirror with a clip lamp on it. Then the
// Third on the front wall as the dusk's world builds it, at a two-hundredth: fourteen raked rows, someone in every
// place, Hesk's desk by the rail with its one lamp. ex: where the flight leaves (flat); tOpen: when the opening shows.
// Returns the gantry (works), what is in the tube (props), the Third (seats, with seatMats to fade it and seatGlow to light it).
function* buildFittings(frame, SH, pins, ex, tOpen) {
  const rng = makeRng('rehearsal-fittings');
  const mat = litMaterial(modelRig(SH, 0), { bend: frame, soft: 0 });
  const wood = '#7a6648', wood2 = '#5a4a38', steel = '#4c4f52', rail = '#9a8562';
  // ---- the gantry: planks on two trestles in the hall, two struts under the tongue that reaches into the tube, and
  // off its side, outside the tube, a wing where the others stand to watch
  const w = new Geo({ maxSeg: 8 }), WX = 3.1, WZ0 = 17.7, WZ1 = 21.3;
  const railRun = (x0, z0, x1, z1) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.15)), xa = Math.min(x0, x1), xb = Math.max(x0, x1), za = Math.min(z0, z1), zb = Math.max(z0, z1);
    for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), z = lerp(z0, z1, i / n); w.box(x - 0.028, GY, z - 0.028, x + 0.028, GY + 1.04, z + 0.028, steel, { skip: 'b' }); }
    w.box(xa - 0.036, GY + 1.02, za - 0.036, xb + 0.036, GY + 1.08, zb + 0.036, rail).box(xa - 0.018, GY + 0.52, za - 0.018, xb + 0.018, GY + 0.56, zb + 0.018, steel);
  };
  w.box(-GW, GY - 0.09, GZ1, GW, GY, GZ0, wood, { top: '#927c5a' }).box(GW, GY - 0.09, WZ0, WX, GY, WZ1, wood, { top: '#8a7454' });
  for (let z = GZ1 + 0.3; z < GZ0; z += 0.3) w.box(-GW, GY, z - 0.006, z > WZ0 && z < WZ1 ? WX : GW, GY + 0.002, z + 0.006, '#4a3d2e', { skip: 'b' });
  railRun(-GW, GZ1, -GW, GZ0); railRun(GW, GZ1, GW, WZ0); railRun(GW, WZ1, GW, GZ0); railRun(-GW, GZ1, GW, GZ1);
  railRun(WX, WZ0, WX, WZ1); railRun(GW + 0.1, WZ0, WX, WZ0); railRun(GW + 0.1, WZ1, WX, WZ1);
  for (const z of [WZ0 + 0.25, WZ1 - 0.25]) { w.tube([[WX + 0.5, 0, z], [WX - 0.2, GY - 0.09, z]], 0.06, 4, wood2); w.tube([[WX + 0.35, 0.8, z], [GW, GY - 0.7, z]], 0.03, 4, steel); }
  w.box(WX - 0.09, GY - 0.26, WZ0, WX, GY - 0.09, WZ1, wood2).box(GW, GY - 0.26, WZ0, WX, GY - 0.09, WZ0 + 0.09, wood2).box(GW, GY - 0.26, WZ1 - 0.09, WX, GY - 0.09, WZ1, wood2);
  for (const s of [-1, 1]) {
    w.box(s * GW - 0.05, GY - 0.3, GZ1, s * GW + 0.05, GY - 0.09, GZ0, wood2);
    // the steps' stringer and handrail
    w.tube([[s * GW, -0.05, SZ0 + 0.08], [s * GW, GY - 0.16, GZ0 + 0.1]], 0.075, 4, wood2);
    w.tube([[s * GW, 1.02, SZ0 + 0.02], [s * GW, GY + 1.05, GZ0]], 0.03, 5, rail);
    for (let i = 0; i <= 4; i++) { const z = lerp(SZ0 - 0.1, GZ0 + 0.1, i / 4.6), y = (SZ0 - z) / (SZ0 - GZ0) * GY; w.box(s * GW - 0.025, y - 0.05, z - 0.025, s * GW + 0.025, y + 1.03, z + 0.025, steel, { skip: 'b' }); }
    // trestles, and the struts
    for (const z of [22.3, 18.3]) { w.tube([[s * 2.0, 0, z], [s * 1.2, GY - 0.3, z]], 0.07, 4, wood2); w.tube([[s * 1.86, 0.7, z], [-s * 1.3, GY - 0.9, z]], 0.035, 4, steel); }
    w.tube([[s * 1.05, GY - 0.3, 15.35], [s * 1.25, 1.75, 18.3]], 0.045, 4, steel);
  }
  for (const z of [22.3, 18.3]) w.box(-2.1, 0, z - 0.09, 2.1, 0.1, z + 0.09, wood2, { skip: 'b' });
  const NS = 22, run = (SZ0 - GZ0) / NS;
  for (let i = 1; i <= NS; i++) w.box(-GW, i * GY / NS - 0.045, SZ0 - i * run, GW, i * GY / NS, SZ0 - (i - 1) * run + 0.03, wood, { top: i % 2 ? '#927c5a' : '#8a7454' });
  // Hesk's slate, held up in front of him at the end of the tongue; and an apprentice's, on the wing
  w.at(-0.75, GY + 1.1, 14.98, Math.PI).rot('x', 0.87); slate(w, 0.3, 0.2, { cols: 6, rows: 2, emit: 2.6 }); w.pop().pop();
  w.at(2.05, GY + 1.02, 18.88, -2.7).rot('x', 0.95); slate(w, 0.26, 0.18, { cols: 4, rows: 2, emit: 1.6 }); w.pop().pop();
  const works = w.mesh(mat, frame);
  yield 'fittings: gantry';

  // ---- in the tube
  const g = new Geo({ maxSeg: 8 }), spar = YC + 0.02;
  g.tube([[0, spar, 0.6], [0, spar, ZM - 0.03]], 0.006, 5, '#2a2c30');
  g.tube([polar(Math.PI, RM - 0.01, ZM - 0.05), [0, spar, ZM - 0.05]], 0.004, 4, '#3a3c40');      // its open end hangs from the top of the rim
  g.at(0, YC, 0).rot('x', Math.PI / 2).lathe(0, 0, 0, [[0.23, 0], [0.2, 0.13], [0.11, 0.3], [0.045, 0.6], [0.02, 0.75]], 16, (k) => ['#8d8c88', '#77767a', '#5c5d63', '#44464c'][k]).pop().pop();
  // by the joint: the carpenter's pencil left beside its line, and a card on a stick (its words are a sign: see build)
  { const y = yLand(0.33) + 0.0076, z = SEAM + 0.106;
    g.tube([[0.26, y, z], [0.4, y, z + 0.012]], 0.0036, 6, '#e0ae38', { smooth: false });
    g.tube([[0.4, y, z + 0.012], [0.412, y, z + 0.013]], (t) => 0.0036 * (1 - t) + 0.0005, 6, '#d9b98c');
    g.tube([[0.247, y, z - 0.0011], [0.26, y, z]], 0.0038, 6, '#c9655a');
    g.box(0.469, yLand(0.47), SEAM + 0.038, 0.473, yLand(0.47) + 0.2, SEAM + 0.042, '#c9b48a');
    g.box(0.416, yLand(0.47) + 0.13, SEAM + 0.042, 0.526, yLand(0.47) + 0.2, SEAM + 0.0432, '#e9e2cf'); }
  // in the basin: a slate propped on a block, nine strokes chalked under its colours, and what the glass holds of it
  { const x = 0.95, z = MIDZ / SC + 0.02, y = yLand(x) + 0.002, yaw = 2.78;
    g.at(x, y, z, yaw).rot('x', 0.3); slate(g, 0.3, 0.21, { cols: 6, rows: 1, tally: true, emit: 2.0 }); g.box(-0.02, 0, 0.012, 0.02, 0.15, 0.07, '#3a3d3c'); g.pop().pop();
    g.at(x, y + 0.001, z, yaw);
    for (let c = 0; c < 6; c++) g.quad([-0.132 + c * 0.044, 0, -0.03], [-0.132 + c * 0.044 + 0.04, 0, -0.03], [-0.15 + c * 0.05 + 0.046, 0, -0.26], [-0.15 + c * 0.05, 0, -0.26], shade(SLIDES[c], 0.2), 2.2);
    g.pop(); }
  // over the mirror, toward the front wall: a kneeling plank on two padded blocks, a clip lamp on its end, a jar of brushes
  { const z0 = 5.22, z1 = 5.4, top = yLand(0.8) + 0.125;
    g.box(0.2, top - 0.025, z0, 1.42, top, z1, '#b89a6a', { top: '#c9ad7c' });
    g.box(0.24, yLand(0.24) - 0.004, z0 + 0.02, 0.36, top - 0.025, z1 - 0.02, '#8a7454').box(1.28, yLand(1.4) - 0.01, z0 + 0.02, 1.4, top - 0.025, z1 - 0.02, '#8a7454');
    g.box(0.23, yLand(0.24) - 0.004, z0 + 0.01, 0.37, yLand(0.36) + 0.012, z1 - 0.01, '#5a6a5c');                       // felt
    g.cyl(1.16, top, z0 + 0.09, 0.034, 0.034, 0.085, 8, '#9fb8b0', { top: '#6a7a78' });
    for (let i = 0; i < 4; i++) g.tube([[1.16 + rng.f(-0.012, 0.012), top + 0.02, z0 + 0.09 + rng.f(-0.012, 0.012)], [1.16 + rng.f(-0.05, 0.05), top + 0.2 + rng.f(0, 0.04), z0 + 0.09 + rng.f(-0.05, 0.05)]], 0.004, 4, ['#c9a36a', '#2f3b45', '#b5553f', '#e7e1d3'][i]);
    g.blob(0.74, top + 0.012, z0 + 0.1, [0.1, 0.014, 0.06], 0, '#b9b3a2', { lump: 0.3, seed: 4, shadeBottom: 0.9 });
    g.box(0.2, top - 0.04, z0 + 0.06, 0.26, top + 0.012, z0 + 0.11, steel);                                             // the clip
    g.tube([[0.23, top + 0.01, z0 + 0.085], [0.23, top + 0.2, z0 + 0.085], [0.27, top + 0.3, z0 + 0.12], [0.36, top + 0.31, z0 + 0.2]], 0.007, 5, '#2c2e30');
    g.at(0.36, top + 0.235, z0 + 0.2).cyl(0, 0, 0, 0.075, 0.03, 0.085, 10, '#2c3e3a', { smooth: false }).cyl(0, 0.004, 0, 0.066, 0.066, 0.004, 10, '#cfc9b8', { smooth: false, cap: false, base: true }).pop(); }
  yield 'fittings: left on the land';

  // ---- the Third: rows, a parapet, Hesk's desk; then the people
  const RT = THIRD.r, A = 224 / RT, onThird = (x, h, z) => polar(x / RT, (RT - h) / SC, (THIRD.zRail + z) / SC);
  const rowZ = (k) => -(3.4 + k * 0.9), rowH = (k) => (k + 1) * 0.36, NR = 14;
  const rr = (h) => (RT - h) / SC, zz = (z) => (THIRD.zRail + z) / SC;
  // (the Third has a light of its own besides the rod's: the lamps of the arcade behind its back row. seatGlow is set by the run)
  const seatSH = { ...SH, uDark: { value: new Vector3() } }, seatRig = modelRig(seatSH, 0.35), tg = new Geo({ maxSeg: 8 });
  for (let k = 0; k < NR; k++) {
    band(tg, -A, A, 44, rr(rowH(k)), zz(rowZ(k)), rr(rowH(k)), zz(rowZ(k + 1)), k % 2 ? '#d2c8b6' : '#dad0bd');
    band(tg, -A, A, 44, rr(k ? rowH(k - 1) : 0.02), zz(rowZ(k)), rr(rowH(k)), zz(rowZ(k)), '#b0a590');
    if (k % 5 === 4) yield 'fittings: the Third';
  }
  band(tg, -A * 1.6, A * 1.6, 64, rr(-0.3), zz(0.5), rr(1.05), zz(0.5), '#cfc5b2');
  band(tg, -A * 1.6, A * 1.6, 64, rr(1.05), zz(0.5), rr(1.05), zz(-0.24), '#efe7d8');
  { const p = onThird(-3.3, 0.04, -1.55);
    tg.at(p[0], p[1], p[2], 0, 1 / SC);
    tg.box(-0.72, 0, -0.32, 0.72, 0.9, 0.32, '#3a2e26', { skip: 'b' });
    for (let c = 0; c < 12; c++) tg.quad([-0.66 + c * 0.11, 0.93, -0.28], [-0.66 + c * 0.11, 1.1, 0.28], [-0.56 + c * 0.11, 1.1, 0.28], [-0.56 + c * 0.11, 0.93, -0.28], SLIDES[c], 2.4);
    tg.box(-0.2, 0, -0.84, 0.2, 1.42, -0.6, '#2c3a3c', { skip: 'b' }).box(-0.1, 1.44, -0.82, 0.1, 1.68, -0.62, SKIN[1], { skip: 'b' });
    tg.pop();
    pins.add(onThird(-3.3 + 0.36, 1.5, -1.53), '#fff0d0', 5, 0.28 / SC, -10, 0.5); }
  // the opening's surround on the riser behind the back row, and the ring of pin lamps that comes on round it
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU, b = ((i + 1) / 48) * TAU, r0 = R_EXIT + 0.0008, r1 = R_EXIT + 0.011, z = ex.z - 0.0016;
    g.quad([ex.x + Math.cos(a) * r0, ex.y + Math.sin(a) * r0, z], [ex.x + Math.cos(a) * r1, ex.y + Math.sin(a) * r1, z], [ex.x + Math.cos(b) * r1, ex.y + Math.sin(b) * r1, z], [ex.x + Math.cos(b) * r0, ex.y + Math.sin(b) * r0, z], '#efe7d8');
  }
  for (let i = 0; i < 30; i++) { const a = (i / 30) * TAU + 0.1; pins.add([ex.x + Math.cos(a) * (R_EXIT + 0.006), ex.y + Math.sin(a) * (R_EXIT + 0.006), ex.z + 0.0005], i % 2 ? '#ffe2b0' : '#fff0d8', 6, 0.0055, tOpen - 1.4 + 0.035 * i, 0.4); }
  yield 'fittings: the Third';
  const props = g.mesh(mat, frame);
  yield 'fittings: the Third';
  // (rows and people are drawn only from near by, and come in gently: from across the model each is a fraction of a
  // pixel and would shimmer, and there the wall's own paint has the seats)
  const seats = new Group(), whole = [], plain = [], stepMat = litMaterial(seatRig, { bend: frame, soft: 0, transparent: true, depthWrite: true }), miniMat = litMaterial(seatRig, { bend: frame, soft: 0, transparent: true, depthWrite: true });
  seats.add(tg.mesh(stepMat, frame));
  const inAisle = (x) => Math.abs(x - Math.round(x / 28) * 28) < 1.25;
  let ts = performance.now();
  for (let k = 0; k < NR; k++) for (let x = -224 + 0.4; x < 224 - 0.3; x += 0.6 + rng.f(-0.04, 0.06)) {
    if (performance.now() - ts > 4) { yield 'fittings: seats'; ts = performance.now(); }
    if (inAisle(x) || rng.chance(0.04)) continue;
    const it = { p: onThird(x + rng.f(-0.06, 0.06), rowH(k) + 0.2, rowZ(k) - 0.4), a: x / RT, yaw: rng.f(-0.25, 0.25), scale: [rng.f(0.9, 1.1) / SC, rng.f(0.9, 1.08) / SC, 1 / SC], color: rng.pick(CLOTH) };
    (Math.abs(x) < 64 ? whole : plain).push(it);
  }
  for (let x = -224; x < 224; x += rng.f(2.2, 6)) if (Math.abs(x + 3.3) > 11) whole.push({ p: onThird(x, 0.03, -rng.f(0.7, 2.8)), a: x / RT, yaw: rng.f(-0.6, 0.6), scale: [1 / SC, 1.75 / SC, 1 / SC], color: rng.pick(CLOTH) });
  yield 'fittings: seats';
  seats.add(minis(grainGeo(true), miniMat, whole, frame));
  yield 'fittings: seats';
  seats.add(minis(grainGeo(false), miniMat, plain, frame));
  return { works, props, seats, seatMats: [stepMat, miniMat], seatGlow: seatSH.uDark.value };
}

// ---------------------------------------------------------------- the Arcade
// Gloaming's paint here is its night: walls the colour of the far bank after the line has gone, so that what glows is
// the painters' work. Hesk's four colours are the palette's lights.
const DUSK = {
  ...PALETTES.dim,
  walls: ['#283231', '#2d3736', '#242d2e', '#313a38', '#2a3232', '#262f30'],
  dado: ['#1a2324', '#1e2727', '#182121', '#20292b'],
  trim: ['#101718', '#141b1c', '#0e1516', '#161d1d'],
  doors: ['#1f5a52', '#2a6a60', '#3a4a4c', '#6a5a36', '#27484a', '#4a3f52', '#5a3a30', '#2f3a34'],
  awnings: [['#1f5a52', '#cfe0d8'], ['#3a4a4c', '#d9d2c4'], ['#6a5a36', '#e3d6bd'], ['#27484a', '#c9d6d0'], ['#4a3f52', '#d6cfd6']],
  signs: [['#0c1a1c', '#f2fff8'], ['#101a1a', '#6fc9a8'], ['#1f5a52', '#f2fff8'], ['#0e1414', '#ffd9a0'], ['#16201f', '#cfe0d8'], ['#0c1a1c', '#ffe9c0']],
  floor: '#454a48', strip: '#30343a', court: '#4a4f4e', ceiling: '#1d2424', rib: '#2e3737',
  rooms: ['#6a5a40', '#4f5f58', '#5f4f44', '#4a5a5c', '#6f6248', '#5a5048', '#5f5a3c'],
  metal: '#3c4040', brass: '#8a7240', lamp: '#ffe0b8', shop: '#ffd9a2', goods: 0.7,
};
// the painters' proofs: a dusk from first light on the left to dark on the right
const PROOFS = {
  green: ['#ffc480', '#ffd8a0', '#f2fff8', '#6fc9a8', '#1f5a52', '#0c1a1c'],
  rose: ['#ffe0b0', '#ffb890', '#e8788a', '#a8508a', '#4a2f6a', '#141428'],
  ember: ['#fff0c8', '#ffd27a', '#ff9e4a', '#d9603f', '#6a2a2a', '#1a0f14'],
  blue: ['#ffe9c8', '#d8e0f0', '#9ab8e8', '#5a7ac8', '#2a3a7a', '#0c1024'],
};
const proof = (stops, t) => { const u = clamp(t, 0, 1) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(u)); return mixc(stops[i], stops[i + 1], u - i); };
// People who walk a line are staged: the deck keeps the flight's clock, and each walker is told where along its line
// it is as the flight begins, so that nobody is overtaken slowly at arm's length and nobody is seen to arrive out of
// nothing or shrink away (a line's two ends are where its walkers do that: each is passed at a second when the camera
// cannot see it). walkersAlong() scatters its walkers a few steps with the deck's random numbers; this stands in for
// those and always answers the same, so a walker starts exactly where it is put (k chooses clothes and skin).
const fixed = (k) => { const r = () => k; r.f = (lo, hi) => (lo + hi) / 2; return r; };
const pacer = (deck, from, to, speed, start, k, child = 0) => deck.walkersAlong({ from, to, n: 1, speed, start, child, rng: fixed(k) });
// a wall facing -v at depth v, in a pen's own co-ordinates (kit/deck.js keeps its own to itself)
const wq = (g, u0, u1, y0, y1, v, col, e = 0) => g.quad([u1, y0, v], [u0, y0, v], [u0, y1, v], [u1, y1, v], col, e);

// A studio's front: a doorway and a sill, open above it, and behind it a dark room whose walls are the painter's
// proofs: lit cards in rows, each row another try at the same dusk. o: { name, stops (the dusk's colours), card (a
// notice by the door), doorSide, who (the painter's clothes, or false: out), out (cards missing), play (a list to add this studio's marker to) }
function studio(deck, P, b, run, H, o) {
  const g = P.g, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24, mid = (u0 + u1) / 2, dep = 2.7, head = 2.42, sill = 0.42, hi = H - 0.14, dark = '#0d1112', k = deck.glowK;
  g.box(u0, head, -0.05, u1, H, 0.26, b.ground);
  // (the name stands higher than the street's ribs spring, so a rib that came down in front of it would cut it off: the
  // Arcade's ribs are spaced to fall between the names, and should the kit ever move them the name steps aside)
  const sy = (head + H) / 2 + 0.01, sg = deck.sign(o.name, { run, at: run.pt(mid, sy, -0.056), maxW: u1 - u0 - 0.4, h: 0.34, style: 'board', font: 'serif', ground: b.ground, ink: b.ink, track: 0.12, glow: 0.25 });
  if (b.clearOfRibs) sg.C = run.pt(b.clearOfRibs(mid, sg.w / 2, u0 + 0.1, u1 - 0.1), sy, -0.056);
  const dw = 0.95, d0 = o.doorSide ? u1 - dw : u0, d1 = d0 + dw, w0 = o.doorSide ? u0 : d1 + 0.12, w1 = o.doorSide ? d0 - 0.12 : u1;
  g.box(w0, 0, 0, w1, sill, 0.2, b.dado, { skip: 'b' }).box(w0 - 0.02, sill, -0.05, w1 + 0.02, sill + 0.05, 0.26, b.trim);
  g.box(o.doorSide ? d0 - 0.12 : d1, 0, -0.02, o.doorSide ? d0 : d1 + 0.12, head, 0.24, b.trim, { skip: 'tb' });
  // (no glass: a studio stands open above its sill, and the street has the light of its proofs)
  g.floor(u0, 0.2, u1, dep, 0.012, '#26292a');
  wq(g, u0, u1, 0, hi, dep, dark);
  g.quad([u0, 0, dep], [u0, 0, 0.26], [u0, hi, 0.26], [u0, hi, dep], dark).quad([u1, 0, 0.26], [u1, 0, dep], [u1, hi, dep], [u1, hi, 0.26], dark);
  g.floor(u0, 0.26, u1, dep, hi, dark, { down: true });
  // the proofs: cards from end to end of the back wall (first light on the left as you face them), and more on the
  // side wall that looks back up the Arcade, where the brightest hours of the dusk are pinned
  const cw = 0.27, ch = 0.27, y0 = 0.5, rows = 6, cols = Math.floor((u1 - u0 - 0.2) / cw), x0 = mid - cols * cw / 2, mean = [0, 0, 0], glow = o.glow || 1.9;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (o.out && o.out.includes(r * cols + c)) continue;                    // a card is out on the table
    const col = proof(o.stops, (1 - c / (cols - 1)) * (0.74 + 0.065 * r) + 0.03 * Math.sin(r * 2.1)), a = x0 + c * cw, y = y0 + r * (ch + 0.035);
    wq(g, a + 0.018, a + cw - 0.018, y, y + ch, dep - 0.03, col, glow);
    mean[0] += col[0]; mean[1] += col[1]; mean[2] += col[2];
  }
  const far = run.turn === 0, su = far ? u1 - 0.03 : u0 + 0.03, sc = Math.floor((dep - 0.5) / cw);
  for (let r = 0; r < rows; r++) for (let c = 0; c < sc; c++) {
    const col = proof(o.stops, 0.16 + (c / (sc + 1)) * 0.62 * (0.8 + 0.07 * r)), va = 0.36 + c * cw + 0.018, vb = 0.36 + (c + 1) * cw - 0.018, y = y0 + r * (ch + 0.035);
    if (far) g.quad([su, y, va], [su, y, vb], [su, y + ch, vb], [su, y + ch, va], col, glow * 0.8); else g.quad([su, y, vb], [su, y, va], [su, y + ch, va], [su, y + ch, vb], col, glow * 0.8);
  }
  if (o.play) { const a = run.pt(su + (far ? -0.025 : 0.025), y0, 0.36), b = run.pt(su, y0, 0.36 + cw); o.play.push({ x: a[0], z: a[2], dz: b[2] - a[2], n: sc, y0: y0 - 0.03, y1: y0 + rows * (ch + 0.035), every: 0.7 + 0.25 * o.play.length }); }
  // the painter's table, a slate on it, and the painter
  const tu = lerp(w0, w1, 0.5) + (o.doorSide ? -0.4 : 0.4), yaw = run.yaw;
  deck.put('table', { p: run.pt(tu, 0, 1.5), yaw, color: '#4a4036' });
  deck.put('stool', { p: run.pt(tu - 0.1, 0, 0.82), yaw, color: '#5a4a3a' });
  g.at(tu - 0.16, 0.76, 1.27).rot('x', 1.25); slate(g, 0.34, 0.24, { cols: 4, rows: 2, emit: 1.6 }); g.pop().pop();
  if (o.who !== false) deck.people([{ p: run.pt(tu - 0.1, 0.46, 0.82), sit: true, yaw, color: o.who || '#3a4a4c' }]);
  if (o.card) deck.sign(o.card, { run, at: run.pt(o.doorSide ? d0 - 0.06 : d1 + 0.06, 1.62, -0.03), h: 0.4, w: 0.82, style: 'card', font: 'cond', glow: 0.2 });
  // its light on the street: two lamps' worth of the proofs' own colour, just inside the sill
  const m = Math.max(mean[0], mean[1], mean[2], 1e-3), tone = new Color(mean[0] / m, mean[1] / m, mean[2] / m);
  const la = run.pt(mid - (u1 - u0) / 4, 1.75, 0.8), lb = run.pt(mid + (u1 - u0) / 4, 1.75, 0.8);
  deck.lattice({ origin: [Math.min(la[0], lb[0]), la[1], la[2]], spacing: [Math.abs(la[0] - lb[0]), 40], count: [2, 1], color: tone, power: 1.25, reach: 2.6 });
  deck.glow([{ p: run.pt(mid, 1.5, dep - 0.7), color: tone, power: 0.26 * k, size: 2.4 }]);
}

function* buildArcade(deck, rng) {
  const play = [];
  const st = (name, stops, o = {}) => ({ kind: 'custom', draw: (P, b, run, H) => studio(deck, P, b, run, H, { name, stops, ...o }) });
  yield* street(deck, {
    axis: 'x', from: AX0, to: HX0, at: ZA, y: 0, width: AW, height: 3,
    lamps: { every: 5.6, kind: 'panel', power: 0.72, color: '#ffe0b8', reach: 3.8 }, pipes: false,
    ribs: { every: 6.5 },      // at x = -36, -29.5 and -23: behind the first picture, and past the far end of Studio Nine's name and Studio Two's
    plates: [{ at: -26.6, lines: ["The Painters' Arcade", 'Duskside'], w: 2.5 }],
    folk: { stand: 0, stroll: 0, walk: 0 }, floor: { color: '#3d4241', strip: '#2c3030', shine: 1 },
    fronts: {
      back: [
        { from: AX0, to: -28.2, ...st('Studio Seven', PROOFS.rose, { doorSide: 1, who: '#6a4a5a' }), ground: '#1a1418', ink: '#f0c8c0' },
        { from: -28.2, to: -22.4, ...st('Studio Two', PROOFS.blue, { doorSide: 0, card: ['No dawns', 'Dawns are easy.'], who: false, play }), ground: '#10141c', ink: '#c8d8f0' },
        { from: -22.4, to: -19.8, kind: 'wall', bench: false, notice: ['Tonight: Hesk', 'Three hours, played once.', 'The seats are sold.'] },
        { from: -19.8, to: HX0, kind: 'stall', name: 'Tea', goods: 'tea', lit: 1, awning: false, ground: '#0c1a1c', ink: '#f2fff8' },
      ],
      front: [
        { from: AX0, to: -27.8, kind: 'shop', name: 'Slates', goods: 'paper', lit: 1, awning: false, blade: false, ground: '#16201f', ink: '#cfe0d8', font: 'serif', open: true },
        { from: -27.8, to: -22.0, ...st('Studio Nine', PROOFS.green, { doorSide: 0, card: ['Hesk', 'is at the drum.'], who: false, out: [5, 6, 26, 27, 48] }), ground: '#0c1a1c', ink: '#6fc9a8' },
        { from: -22.0, to: HX0, ...st('Studio Four', PROOFS.ember, { doorSide: 1, who: '#5a4a36', play }), ground: '#1a1410', ink: '#ffd9a0' },
      ],
    },
    fill: false, ends: ['open', 'open'],
  });
  // people on the Arcade: two at the bills, one at the slate shop, one looking in at Hesk's studio
  deck.people([
    { p: [-21.6, 0, ZA + 2.55], yaw: 0.2 }, { p: [-20.7, 0, ZA + 2.3], yaw: -0.5, child: true },
    { p: [-29.0, 0, ZA - 2.45], yaw: Math.PI + 0.2, color: '#c7a36a' }, { p: [-24.4, 0, ZA - 2.3], yaw: Math.PI - 0.3 },
  ]);
  ['#ffc480', '#ffe2b8', '#f2fff8', '#6fc9a8'].forEach((c, i) => { for (const dz of [-1.62, 1.62]) deck.put('bunting', { p: [-25.4 + i * 1.75, 2.93, ZA + dz], yaw: Math.PI / 2, scale: [1.05, 0.72, 1], color: c }); });
  // someone in a pale coat going in to watch, nine metres ahead of the camera all the way to the door and through it
  // (gone to the right as the view turns to the tube); and two coming the other way down the left side, one of them a
  // child dawdling, who pass at two and three seconds
  pacer(deck, [-29.6, 0, ZA + 1.15], [-3.0, 0, ZA + 1.15], 1.5, 8.6, 0.52);
  pacer(deck, [HX0 - 1.3, 0, ZA - 1.75], [-42, 0, ZA - 1.75], 1.15, 4.9, 0.28);
  pacer(deck, [HX0 - 1.3, 0, ZA - 1.75], [-42, 0, ZA - 1.75], 0.7, 3.4, 0.12, 1);
  deck.zone({ min: [AX0 - 2, -0.3, ZA - AW / 2 - 3.6], max: [HX0 + 0.15, 3.1, ZA + AW / 2 + 3.6], soft: 0.25, color: '#ffe6cc', power: 0.4, side: 0.85, under: 0.6 });

  // ---- the hall's wall across the end of the Arcade: the door, the name board, the bills
  const run = new Run(HX0, 0, ZA, 1), P = deck.pen(run, 0, 'door'), g = P.g, wall = '#232b2b', trim = '#0f1516', hw = DOORW / 2;
  g.box(-AW / 2, 0, 0, -hw, 3, 0.4, wall, { skip: 'b' }).box(hw, 0, 0, AW / 2, 3, 0.4, wall, { skip: 'b' }).box(-hw, DOORH, 0, hw, 3, 0.4, wall);
  g.box(-hw - 0.07, 0, -0.03, -hw, DOORH + 0.07, 0.43, trim, { skip: 'b' }).box(hw, 0, -0.03, hw + 0.07, DOORH + 0.07, 0.43, trim, { skip: 'b' }).box(-hw, DOORH, -0.03, hw, DOORH + 0.07, 0.43, trim);
  for (const s of [-1, 1]) g.box(s > 0 ? hw + 0.03 : -hw - hw + 0.05, 0.02, 0.42, s > 0 ? hw + hw - 0.05 : -hw - 0.03, DOORH - 0.02, 0.48, '#1f5a52', { skip: 'b' });      // the two leaves, folded back against the hall's side of the wall
  g.box(hw + 0.2, 0.86, -0.035, AW / 2 - 0.2, 2.62, 0, '#0a1011', { skip: 's' });
  g.box(hw + 0.45, 2.68, -0.16, AW / 2 - 0.45, 2.74, -0.02, '#3a3d3c').box(hw + 0.5, 2.655, -0.15, AW / 2 - 0.5, 2.68, -0.03, '#fff0d0', { emit: 3.2 });
  P.done();
  const bu = (hw + AW / 2) / 2;
  deck.sign('Tonight', { run, at: run.pt(bu, 2.34, -0.04), w: 1.15, h: 0.24, style: 'glow', font: 'cond', ground: '#0a1011', ink: '#cfe0d8', glow: 0.9, track: 0.3 });
  deck.sign('Hesk', { run, at: run.pt(bu, 1.76, -0.04), w: 1.18, h: 0.66, style: 'glow', font: 'serif', ground: '#0a1011', ink: '#f2fff8', glow: 1.5, track: 0.1, upper: true });
  deck.sign('played once', { run, at: run.pt(bu, 1.16, -0.04), w: 1.15, h: 0.24, style: 'glow', font: 'italic', ground: '#0a1011', ink: '#6fc9a8', glow: 0.9 });
  deck.glow([{ p: run.pt(bu, 2.6, -0.3), color: '#fff0d0', power: 1.4, size: 0.5 }]);
  deck.sign('The Rehearsal Drum', { run, at: run.pt(0, DOORH + 0.2, -0.012), h: 0.22, style: 'plate', font: 'cond', track: 0.16 });
  deck.sign(['Earn the dusk', 'A run is on.', 'Lamps are down inside.'], { run, at: run.pt(-bu, 1.62, -0.012), w: 1.1, h: 0.84, style: 'paper', font2: 'serif' });
  // what moves: steam off the tea, a robot at the floor, and in two studios a frame of light stepping along the proofs
  // as the painter plays them through (each frame is a mesh of its own, moved along the axis by the world's update)
  for (let i = 0; i < 16; i++) deck.glow([{ p: [rng.f(-19.2, -17.6), rng.f(1.0, 1.5), ZA + AW / 2 + rng.f(-0.25, 0.2)], color: '#f2fff8', power: rng.f(0.05, 0.11), size: rng.f(0.4, 0.9), move: [rng.f(-0.03, 0.03), rng.f(0.07, 0.14), rng.f(-0.06, 0)], loop: rng.f(6, 10), phase: rng() }]);
  deck.put('robot', { p: [AX0 + 1, 0, ZA - 2.95], yaw: Math.PI / 2, drift: [0.45, 0, 0, 36], phase: 0.463, color: '#cfe0d8' });      // (7.5 m along as the flight begins)
  const markers = play.map((q) => {
    const g = new Geo(), t = 0.022, z0 = Math.min(q.z, q.z + q.dz), z1 = Math.max(q.z, q.z + q.dz);
    for (const [ya, yb, za, zb] of [[q.y0, q.y0 + t, z0, z1], [q.y1 - t, q.y1, z0, z1], [q.y0, q.y1, z0, z0 + t], [q.y0, q.y1, z1 - t, z1]]) g.box(q.x - 0.008, ya, za, q.x + 0.008, yb, zb, '#fff6e0', { emit: 3.5 });
    return { mesh: g.mesh(deck.lit, deck.frame), dz: q.dz, n: q.n, every: q.every };
  });
  yield 'arcade: door';
  return markers;
}

// ---------------------------------------------------------------- the hall
// Five decks high and dark. In it: the tube on three cradles, seen from outside as board, ribs and a rim; the cap
// swung away on its hinge; the score rail along the tube's side, a card for every minute of the dusk and a lamp that
// rides along it a card a second; the desks; cables, a ladder, and lamps in the floor to walk by.
const XR = -9.6, ZS0 = -0.6;                  // the score rail: where it stands, and where its first card hangs
const MOUTH = { min: [-9, -0.4, ZM + 1.5], max: [9, 9, 30], soft: 3, side: 0.55, under: 0.3 };     // the pool of the model's light on the hall floor
// the colour of minute s of the dusk as the run plays it (the flight begins 106 seconds into the run, and leaves ten seconds before its end)
function cardColor(s) {
  const t = s - (180 - RUN_END);
  if (t < 0) return mixc('#fff0d8', SEQ[0][1], clamp(s / 90, 0, 1));
  const tau = toDusk(t);
  let i = 0; while (i < SEQ.length - 2 && SEQ[i + 1][0] <= tau) i++;
  const a = SEQ[i], b = SEQ[i + 1], u = smoothstep(a[0], b[0], tau);
  return shade(mixc(a[1], b[1], u), 0.25 + (a[2] + (b[2] - a[2]) * u) * 0.9);
}
function* buildHall(deck, capMove) {
  const B = deck.bucket(0, 16, 'hall'), g = B.g, X0h = HX0 + 0.4, wall = '#3a4347', slab = '#48525a';
  B.f.tint(0.5).floor(X0h, HZ0, HX1, HZ1, 0, '#5e6362', { emit: 0.9 }).tint(0);
  g.floor(X0h, HZ0, HX1, HZ1, HH, '#22282b', { down: true });
  const dz0 = ZA - AW / 2, dz1 = ZA + AW / 2;
  for (const [z0, z1, y0] of [[HZ0, dz0, 0], [dz0, dz1, 3], [dz1, HZ1, 0]]) g.quad([X0h, y0, z1], [X0h, y0, z0], [X0h, HH, z0], [X0h, HH, z1], wall);
  g.quad([HX1, 0, HZ0], [HX1, 0, HZ1], [HX1, HH, HZ1], [HX1, HH, HZ0], wall);
  g.quad([X0h, 0, HZ0], [HX1, 0, HZ0], [HX1, HH, HZ0], [X0h, HH, HZ0], wall).quad([HX1, 0, HZ1], [X0h, 0, HZ1], [X0h, HH, HZ1], [HX1, HH, HZ1], wall);
  for (let k = 1; k <= 4; k++) {                                            // the edges of the four decks the hall is cut through
    const y = k * 4 - 0.45;
    g.box(X0h, y, HZ0, X0h + 0.14, y + 0.45, HZ1, slab).box(HX1 - 0.14, y, HZ0, HX1, y + 0.45, HZ1, slab).box(X0h, y, HZ0, HX1, y + 0.45, HZ0 + 0.14, slab).box(X0h, y, HZ1 - 0.14, HX1, y + 0.45, HZ1, slab);
  }
  for (let z = HZ0 + 5; z < HZ1; z += 7.8) g.box(X0h, HH - 0.7, z - 0.16, HX1, HH, z + 0.16, '#1f2628', { skip: 't' });
  yield 'hall: walls';

  // ---- the tube from outside: a skin of board in five lengths, a rib every 1.25 m, the rim of its open end
  const T = deck.bucket(0, 8, 'tube').g, RO = RM + 0.05, RR = RO + 0.26, NA = 64, skin = '#a48d68', ribc = '#b9a27a';
  const rib = (z, col) => { band(T, -Math.PI, Math.PI, NA, RR, z - 0.06, RR, z + 0.06, col); band(T, -Math.PI, Math.PI, NA, RO, z - 0.06, RR, z - 0.06, shade(col, 0.8)); band(T, -Math.PI, Math.PI, NA, RR, z + 0.06, RO, z + 0.06, shade(col, 0.8)); };
  const skinOf = (z0, z1, seed) => { for (let i = 0; i < 40; i++) { const a = -Math.PI + (i / 40) * TAU; band(T, a, a + TAU / 40, 2, RO, z0, RO, z1, shade(skin, 0.84 + 0.3 * hash2(i, seed, 5))); } };
  const disc = (z, r, col, toward) => { for (let i = 0; i < NA; i++) { const a = -Math.PI + (i / NA) * TAU, b = a + TAU / NA; if (toward > 0) T.tri([0, YC, z], polar(a, r, z), polar(b, r, z), col); else T.tri([0, YC, z], polar(b, r, z), polar(a, r, z), col); } };
  const lens = [0, 3.75, 7.5, 11.25, 15, ZM];
  for (let j = 0; j < 5; j++) { skinOf(lens[j], lens[j + 1], j); yield 'hall: tube'; }
  for (let z = 0.07; z < ZM - 0.6; z += 1.25) { rib(z, ribc); yield 'hall: ribs'; }
  rib(ZM - 0.07, '#c9b48a');
  band(T, -Math.PI, Math.PI, NA, RR, ZM, RM, ZM, '#d4c096');
  disc(-0.03, RR, shade(skin, 0.8), -1);
  T.box(-RR, YC - 0.1, -0.2, RR, YC + 0.1, -0.03, ribc).box(-0.1, YC - RR, -0.2, 0.1, YC + RR, -0.03, ribc);
  yield 'hall: tube';
  // the cap, on its hinge: a ring of the same board and a back of it
  T.push(capMove);
  skinOf(ZM + 0.012, LM + 0.03, 7);
  rib(ZM + 0.08, '#c9b48a'); rib(LM - 0.05, ribc);
  band(T, -Math.PI, Math.PI, NA, RM, ZM + 0.012, RR, ZM + 0.012, '#d4c096');
  disc(LM + 0.03, RR, shade(skin, 0.8), 1);
  T.box(-RR, YC - 0.1, LM + 0.03, RR, YC + 0.1, LM + 0.2, ribc).box(-0.1, YC - RR, LM + 0.03, 0.1, YC + RR, LM + 0.2, ribc);
  T.pop();
  T.box(HINGE[0] + 0.02, 0, ZM - 0.16, HINGE[0] + 0.34, 15.6, ZM + 0.16, '#3a3d3e', { skip: 'b' });
  for (const y of [3.2, 8.8, 14.4]) T.box(HINGE[0] - 0.2, y - 0.3, ZM - 0.2, HINGE[0] + 0.36, y + 0.3, ZM + 0.2, '#55595a');
  { const a = new Vector3(0, 0.34, ZM + 0.25).applyMatrix4(capMove), b = new Vector3(0, 0.34, LM - 0.1).applyMatrix4(capMove);
    T.tube([[a.x, 0.34, a.z], [b.x, 0.34, b.z]], 0.3, 4, '#3a3d3e'); T.tube([[a.x, 0.7, a.z], [b.x, 0.7, b.z]], 0.16, 4, '#5d4f3e'); }
  yield 'hall: cap';
  // three cradles
  for (const z of [2.5, 8.75, 15.0]) {
    const a1 = 0.87, n = 12, cw = 0.15, yb = 0.2, col = '#8a7558', top = (a) => polar(a, RR + 0.012, z);
    for (let i = 0; i < n; i++) {
      const pa = top(-a1 + (i / n) * 2 * a1), pb = top(-a1 + ((i + 1) / n) * 2 * a1);
      T.quad([pa[0], yb, z + cw], [pb[0], yb, z + cw], [pb[0], pb[1], z + cw], [pa[0], pa[1], z + cw], col);
      T.quad([pb[0], yb, z - cw], [pa[0], yb, z - cw], [pa[0], pa[1], z - cw], [pb[0], pb[1], z - cw], col);
    }
    const e = top(a1);
    T.quad([-e[0], yb, z - cw], [-e[0], yb, z + cw], [-e[0], e[1], z + cw], [-e[0], e[1], z - cw], shade(col, 1.15));
    T.quad([e[0], yb, z + cw], [e[0], yb, z - cw], [e[0], e[1], z - cw], [e[0], e[1], z + cw], shade(col, 1.15));
    T.box(-6.5, 0, z - 0.26, 6.5, yb, z + 0.26, shade(col, 0.8), { skip: 'b' });
    for (const s of [-1, 1]) T.tube([[s * 6.3, 0.2, z + 0.2], [s * 6.0, 2.6, z + 1.1], [s * 6.9, 0.05, z + 1.7]], 0.05, 4, '#3a3d3e');
  }
  yield 'hall: cradles';

  // ---- the score: a rail on posts, 180 cards, and the lamp that rides it (a mesh of its own: it moves)
  g.box(XR - 0.02, 1.56, ZS0 - 0.3, XR + 0.02, 1.6, ZS0 + 18.2, '#3c4040');
  for (let z = ZS0 - 0.25; z < ZS0 + 18.3; z += 2.3) g.box(XR - 0.025, 0, z - 0.025, XR + 0.025, 1.56, z + 0.025, '#3c4040', { skip: 'b' });
  for (let s = 0; s < 180; s++) { const z = ZS0 + s * 0.1; g.quad([XR - 0.012, 1.42, z], [XR - 0.012, 1.42, z + 0.086], [XR - 0.012, 1.545, z + 0.086], [XR - 0.012, 1.545, z], cardColor(s), 0.75); }
  const cg = new Geo();
  cg.box(XR - 0.07, 1.38, -0.02, XR + 0.05, 1.68, 0.106, '#0e1213').box(XR - 0.26, 1.63, 0.02, XR - 0.07, 1.66, 0.066, '#0e1213');
  cg.box(XR - 0.26, 1.615, 0.022, XR - 0.14, 1.63, 0.064, '#fff4dc', { emit: 4 });
  const rider = [cg.mesh(deck.lit, deck.frame), glowPoints([{ p: [XR - 0.2, 1.6, 0.043], color: '#fff0d0', power: 2.2, size: 0.3 }, { p: [XR - 0.2, 1.5, 0.043], color: '#fff0d0', power: 0.5, size: 1.1 }], { bend: deck.frame, minPx: 1.4, maxPx: 120 })];
  // desks beside it, a painter's slate on each, three of them with someone at them
  for (let i = 0; i < 5; i++) {
    const x = -12.5 + (i % 2) * 0.5, z = 3.4 + i * 3.1;
    deck.put('table', { p: [x, 0, z], yaw: 0, color: '#4a4036' });
    deck.put('chair', { p: [x - 0.64, 0, z], yaw: -Math.PI / 2, color: ['#3a4a4c', '#5a3a30', '#2f3a34', '#6a5a36', '#27484a'][i] });
    g.at(x - 0.22, 0.76, z, Math.PI / 2).rot('x', 1.2); slate(g, 0.36, 0.26, { cols: 4, rows: 3, emit: 1.7 }); g.pop().pop();
    deck.glow([{ p: [x - 0.15, 1.02, z], color: '#bfe8d8', power: 0.28, size: 1.2 }]);
    if (i !== 1 && i !== 3) deck.people([{ p: [x - 0.64, 0.47, z], sit: true, yaw: Math.PI / 2 }]);
  }
  deck.people([
    { p: [-10.7, 0, 11.4], yaw: Math.PI / 2 }, { p: [-10.9, 0, 12.3], yaw: 1.2, color: '#c7a36a' }, { p: [-11.4, 0, 20.6], yaw: 0.9 },
    { p: [-5.0, 0, 28.5], yaw: 1.75 }, { p: [-5.4, 0, 27.7], yaw: 1.4, child: true }, { p: [-13.6, 0.44, 34.2], sit: true, yaw: -2.2 },
  ]);
  deck.put('stool', { p: [-13.6, 0, 34.2], yaw: 0, color: '#3a4a4c' });
  // three walking the length of the tube's side (their lines end by the door, where they are passed while the camera is on the gantry)
  pacer(deck, [-13.9, 0, 27.5], [-13.9, 0, 1.5], 0.9, 5, 0.6);
  pacer(deck, [-13.9, 0, 27.5], [-13.9, 0, 1.5], 0.9, 14, 0.9);
  pacer(deck, [-14.6, 0, 1.5], [-14.6, 0, 27.5], 1.0, 4, 0.33);
  yield 'hall: score';
  // a ladder against the tube, cables to the desks, lamps in the floor
  { const a = [-10.9, 0, 6.0], b = [-7.8, 9.3, 6.0];
    for (const dz of [0, 0.46]) g.tube([[a[0], a[1], a[2] + dz], [b[0], b[1], b[2] + dz]], 0.028, 4, '#8a7a5a');
    for (let i = 1; i < 32; i++) { const t = i / 32; g.tube([[lerp(a[0], b[0], t), lerp(a[1], b[1], t), 6.0], [lerp(a[0], b[0], t), lerp(a[1], b[1], t), 6.46]], 0.014, 4, '#a08c66'); } }
  for (const [z, s] of [[5.2, 0.4], [9.6, -0.5], [13.4, 0.3]]) g.tube([[-4.5, 1.0, z], [-6.5, 0.12, z + s], [-8.6, 0.04, z + s * 2], [-11.2, 0.04, z + s], [-12.2, 0.03, 3.4 + Math.round((z - 3.4) / 3.1) * 3.1 + 0.5]], 0.022, 4, '#15191b');
  const dots = [];
  for (let x = HX0 + 1.8; x < -1.9; x += 1.45) dots.push([x, ZA - 1.75], [x, ZA + 1.75]);
  for (let z = 27.6; z > 1; z -= 1.9) dots.push([-11.25, z]);
  for (let z = SZ0 + 0.5; z < ZA + 1.7; z += 1.3) dots.push([1.75, z]);
  deck.glow(dots.map((q) => ({ p: [q[0], 0.035, q[1]], color: '#ffcf8c', power: 1.0, size: 0.1 })));
  // words: what the tube is, and the tally at the foot of the steps
  deck.sign('Gloaming, one to two hundred', { at: [-(RR + 0.03), YC - 0.3, 12.6], n: [-1, 0], w: 5.0, h: 0.6, style: 'board', font: 'cond', ground: '#2c251e', ink: '#cdbf9f', glow: 0.1, track: 0.22 });
  deck.put('noticeboard', { p: [-3.6, 0, 28.3], yaw: 2.214, color: '#3a3128' });       // (clear of the flight, which turns onto the steps two metres from it)
  deck.sign(['Hesk', 'Run 7: no changes', 'Run 8: no changes', 'Run 9'], { at: [-3.624, 1.375, 28.318], n: [-0.8, 0.6], w: 1.2, h: 0.98, style: 'chalk', glow: 0.12 });
  // light: what comes in at the door, what comes out of the tube (set every frame), and the card inside it
  deck.zone({ min: [X0h + 0.1, -0.2, ZA - 1.7], max: [X0h + 6.5, 2.9, ZA + 1.7], soft: 1.5, color: '#ffdcb0', power: 0.3, side: 0.5, under: 0.4 });
  const mouthZone = deck.zone({ ...MOUTH, color: '#ffc480', power: 0.2 });
  deck.lattice({ origin: [XR - 0.35, 1.5, ZS0 + 1.1], spacing: [1, 2.3], count: [1, 8], color: '#ffe2c0', power: 0.55, reach: 2.3 });      // the score's own light on the tube's side
  const cardZone = deck.zone({ min: [0.3, yLand(0.47) + 0.05, SEAM - 0.2], max: [0.66, yLand(0.47) + 0.4, SEAM + 0.3], soft: 0.04, color: '#ffc480', power: 0.5, side: 1, under: 1 });
  deck.sky({ x0: -6.5, z0: ZM - 2.5, x1: 6.5, z1: ZM + 0.6, y: YC, color: '#ffc480', power: 0.5 });
  yield 'hall: light';
  return { rider, mouthZone, cardZone };
}

export const gloamingRehearsal = {
  id: 'gloaming-rehearsal',
  title: 'The rehearsal drum', drum: 'Gloaming', row: 'Weather Row', kind: 'a fair drum', light: 28.0,
  line: "The painters keep a model of the Hollow you can walk into, fifteen metres across, and run the night's dusk through it in three minutes to see where it drags. Hesk watched his nine times and changed nothing.",
  tone: '#6fc9a8', source: 'wander-year.md (Day 96), open-drums.md (Culture), 15-canon.js (Gloaming)',
  sound: { root: 43, scale: 'aeolian', pad: 0.6, air: 0.1, hum: 0.3, crowd: 0.1, bells: 0.1, bright: 0.3 },
  *build(ctx) {
    const frame = makeFrame(70 * DEG, 640, deckRadius(290));
    const rng = makeRng('rehearsal');
    // the opening: in the riser behind the Third's back row, clear of the heads in it. The path is made, its opening
    // measured, and its last keys moved by what is wanting, until the opening stands where the wall has been left for it
    const EY = TY + 0.036 + R_EXIT, EZ = TFOOT + 0.006, opts = { frame, entryRadius: 1.2, exitRadius: R_EXIT };
    let dy = 0, dz = 0, path = makePath(flightKeys(EY, EZ), opts);
    for (let i = 0; i < 5; i++) { dy += EY - path.exit.flat.y; dz += EZ - path.exit.flat.z; path = makePath(flightKeys(EY, EZ, dy, dz), opts); }
    yield 'rehearsal: path';
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'rehearsal', palette: DUSK, light: { level: 0.75, ambUp: '#39464e', ambDown: '#222b31', ambPower: 0.9 }, floor: { shine: 1, rough: 0.03, lampGlow: 2.4 }, clock: 'flight' });
    yield 'rehearsal: deck';
    // the dusk's numbers, shared by every shader that is lit by it
    const SH = {
      uRodA: { value: new Vector3() }, uRodB: { value: new Vector3() }, uGlow: { value: new Vector3() }, uSpill: { value: new Vector3() }, uDark: { value: vec3col('#2a343c', 0.35) },
      uRodZ: { value: new Vector2(2.25, 16.5) }, uSharp: { value: 1 }, uEye: { value: new Vector3() }, uLamp: { value: 0 }, uRodPow: { value: 30 }, uHaloPow: { value: 0.9 }, uWallTint: { value: vec3col('#e4dccc') },
    };
    const capMove = new Matrix4().makeTranslation(HINGE[0], 0, HINGE[1]).multiply(new Matrix4().makeRotationY(SWING)).multiply(new Matrix4().makeTranslation(-HINGE[0], 0, -HINGE[1]));
    const markers = yield* buildArcade(deck, rng);
    const hall = yield* buildHall(deck, capMove);
    const M = yield* buildModel(ctx, frame, SH, path, capMove);
    const tOpen = path.tCross - 9.4;            // when the opening in the wall shows itself
    const F = yield* buildFittings(frame, SH, M.pins, path.exit.flat, tOpen);
    // the card by the joint. Its words are a sign; so that they are lettered large enough to read at a hand's breadth,
    // the same sign stands once more under the floor, two hundred times the size (kit/deck.js letters each text once, at its largest)
    const cardSign = { style: 'paper', font: 'hand', font2: 'serif', head: false };
    deck.sign(['Drags here?', 'No.'], { ...cardSign, at: [0.471, yLand(0.47) + 0.165, SEAM + 0.046], n: [0, 1], w: 0.104, h: 0.066 });
    deck.sign(['Drags here?', 'No.'], { ...cardSign, at: [0.5, -3, SEAM], n: [0, -1], w: 1.7333, h: 1.1 });
    // on the gantry: Hesk at the end of its tongue with his slate, and four keeping back from him on the wing
    const folk = crowd([
      { p: [-0.75, GY, 15.35], yaw: Math.PI, color: '#2c3a3c', skin: SKIN[1] },
      { p: [2.55, GY, 18.25], yaw: -2.62 }, { p: [2.2, GY, 19.2], yaw: -2.7, color: '#4f6f8f' }, { p: [2.75, GY, 20.05], yaw: -2.75 }, { p: [2.3, GY, 20.85], yaw: -2.6, color: '#c7a36a', child: true },
    ], litMaterial(modelRig(SH, 0.25), { bend: frame, walk: true, soft: 0.5 }), { frame, seed: 'rehearsal-gantry' });
    yield* finish(deck);
    const lampsMesh = M.pins.mesh(frame, { maxPx: 50, fall: 1 });
    M.inside.add(F.props, F.seats, lampsMesh);
    const scene = new Scene();
    scene.add(deck.group, M.cap, M.inside, F.works, ...hall.rider, ...folk, ...markers.map((q) => q.mesh));
    yield 'rehearsal: made';

    // ---- the run
    const look = { exposure: 1.2, bloom: 0.26, threshold: 0.8, saturation: 1.05, vignette: 0.55, contrast: 1.04 };
    const EXPO = [[0, 1.2], [6.2, 1.2], [9.2, 2.3], [15, 2.2], [20, 1.9], [24, 1.6], [28, 1.5], [44, 1.5], [62, 1.9], [99, 1.9]];
    const sun = new Color(), farC = new Color(), amb = new Color(), zc = new Color(), cf = new Vector3();
    const winT = [0, 1].map((s) => { const a = []; for (let i = 0; i < NT; i++) a.push([39 + i * 0.22 + 2.5 * hash2(i, s, 3), 0.06 + 0.16 * hash2(i, s, 7) + (i < 10 ? 0.04 : 0)]); return a; });
    const stoneTint = vec3col('#e4dccc'), seaTint = new Vector3(0.5, 2.6, 2.1), HALF0 = (L / 2 - DRUM.SUN0) / SC;
    const small = M.small;
    function light(t) {
      const tau = toDusk(t);
      let i = 0; while (i < SEQ.length - 2 && SEQ[i + 1][0] <= tau) i++;
      const a = SEQ[i], b = SEQ[i + 1], u = smoothstep(a[0], b[0], tau), ca = SEQC[i], cb = SEQC[i + 1], m = (j) => a[j] + (b[j] - a[j]) * u;
      sun.copy(ca[0]).lerp(cb[0], u); farC.copy(ca[1]).lerp(cb[1], u); amb.copy(ca[2]).lerp(cb[2], u);
      SH.uRodA.value.set(sun.r, sun.g, sun.b).multiplyScalar(m(2));
      SH.uRodB.value.set(farC.r, farC.g, farC.b).multiplyScalar(m(4));
      SH.uGlow.value.set(amb.r, amb.g, amb.b).multiplyScalar(m(6));
      SH.uSharp.value = m(8); SH.uRodPow.value = m(7); SH.uHaloPow.value = m(7) * 0.03; SH.uLamp.value = m(9) * m(9);
      const half = HALF0 * (1 - SHRINK * smoothstep(LINE0, LINE1, tau));
      SH.uRodZ.value.set(LM / 2 - half, LM / 2 + half);
      SH.uSpill.value.copy(SH.uRodA.value).multiplyScalar(0.55).addScaledVector(SH.uGlow.value, 0.3);
      for (const [mesh, s] of [[M.front, 0], [M.cap, 1]]) {
        const U = mesh.material.uniforms;
        U.uLit.value = 0.05 * m(9);
        for (let k = 0; k < NT; k++) { const w = winT[s][k]; U.uTier.value[k].z = w[1] * smoothstep(w[0], w[0] + 6, tau); }
      }
      lampsMesh.material.uniforms.uT.value = t;
      M.tentMat.uniforms.uEmit.value = 0.9 * smoothstep(37, 45, tau);
      F.seatGlow.set(1.0, 0.7, 0.42).multiplyScalar(0.012 + 0.2 * smoothstep(33, 41, tau));
      SH.uWallTint.value.copy(stoneTint).lerp(seaTint, smoothstep(33, 42, tau) * (1 - 0.55 * smoothstep(50, 62, tau)));
      // the hall: what comes out of the tube's mouth onto its floor, and the card inside
      const sp = SH.uSpill.value, ra = SH.uRodA.value, gl = SH.uGlow.value;
      deck.rig.setZone(hall.mouthZone, { ...MOUTH, color: zc.setRGB(sp.x, sp.y, sp.z), power: 1.3 });
      deck.rig.setZone(hall.cardZone, { min: [0.3, yLand(0.47) + 0.05, SEAM - 0.2], max: [0.66, yLand(0.47) + 0.4, SEAM + 0.3], soft: 0.04, color: zc.setRGB(ra.x + gl.x, ra.y + gl.y, ra.z + gl.z), power: 1, side: 0.8, under: 1 });
      deck.floorMat.uniforms.uSkyC.value[0].set(sp.x * 1.5, sp.y * 1.5, sp.z * 1.5, 1);
      let e = 0; while (e < EXPO.length - 2 && t > EXPO[e + 1][0]) e++;
      look.exposure = lerp(EXPO[e][1], EXPO[e + 1][1], smoothstep(EXPO[e][0], EXPO[e + 1][0], t));
    }
    light(0);
    let gate = null;
    const api = {
      scene, path, deck, near: 0.04, far: 130, look,
      portal: { rim: false, mist: '#6fc9a8', mistPower: 0.9, openFor: 9.7 },
      update(t, dt, camera, engine) {
        light(t);
        // the walkers' clock: the flight's; and while this world is only seen through the last world's opening, the
        // seconds still to go (no more than three: before that they stand), so that each is in its place at nought
        const seen = engine && engine.cur && engine.cur.userData !== api;
        deck.tick(seen ? Math.max(-3, engine.cur.t - engine.cur.tCross) : t);
        frame.local(camera.position, cf);
        SH.uEye.value.copy(cf);
        const inTube = Math.abs(cf.x) < RM && cf.z < ZM + 2.5;
        M.inside.visible = cf.x > HX0 - 6;          // from farther back along the Arcade the tube's inside is behind the hall's wall
        small.visible = inTube || Math.hypot(cf.x, cf.y - YC, cf.z - ZM) < 14;      // (on while the steps still hide the land: nothing is seen to arrive)
        const sk = inTube ? smoothstep(2.9, 1.9, Math.hypot(cf.x, cf.y - TY, cf.z - TRAIL)) : 0;
        F.seats.visible = sk > 0.003;
        for (const m of F.seatMats) m.uniforms.uOpacity.value = sk;
        const near = inTube ? 0.04 : 0.2;
        if (Math.abs(camera.near - near) > 1e-4) { camera.near = near; camera.updateProjectionMatrix(); }
        for (const m of hall.rider) m.position.z = ZS0 + (t + 180 - RUN_END) * 0.1;
        for (const q of markers) q.mesh.position.z = q.dz * (Math.floor(G.uTime.value / q.every) % q.n);
        // the opening at the end of the flight: shut until the ring of lamps round it is lit, then opened like an iris
        if (gate) { const k = smoothstep(tOpen, tOpen + 1.6, t); gate.visible = k > 0.002; gate.scale.set(k, k, 1); }
      },
      onPortal(mesh) { gate = mesh; mesh.visible = false; },
    };
    return api;
  },
};
