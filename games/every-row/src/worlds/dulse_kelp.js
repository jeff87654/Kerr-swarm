// Dulse, Kelp Row: the far side, 36.9 light-seconds from home, a little after four in the morning and three
// kilometres below the terraces where breakfast will be eaten at six. Dulse is known for one dish, a deep kelp broth
// with a single noodle coiled in it (games/three-nights/src/15-canon.js, Dulse: the broth, "Breakfast is at six.",
// Abelone, "kays" said like "keys"; docs/wander-year.md, Day 185: nine days of breakfasts). This is where the broth
// starts: the Kelp Stacks, a nave on deck 8 in the Keel (docs/sorrel.md, The Keel: food plant at the rim, no homes),
// five decks tall and 300 m long, running along the drum's axis so that it does not curve, dark between two ranks of
// forty glass tanks in which kelp grows eighteen metres tall under lamps (docs/food-system.md, Tier 3: the Garden is
// what grows under lamps; its seaweeds the docs grow dark, in vats, so kelp in lit glass is this page's own).
//
// The flight: out of the apron room onto the wet floor by the first tank, where a bundle of cut kelp lands in its
// bin; up and along the nave; into one tank through the glass and up through the kelp to break the surface among the
// cutters on the gantry; out over the rail and along it, past a visiting cook in the wrong colour of apron as the
// cutter teaching her lets a bundle go; a look down the whole drop as another falls; then the length of the nave to
// the breakfast kitchen at its far end, between the kettles, along the pass where the bowls stand with one coiled
// noodle each, and out through the doors of a lift cab that is being loaded with breakfast.
//
// The drop is done honestly. Deck 8 turns at radius 2,972 m, so things weigh 9.72 m/s2 there (omega = 0.0572 rad/s).
// A bundle let go 18 m up takes t = sqrt(2 h / g) = 1.92 s to fall, and the floor turns under it meanwhile: it lands
// omega g t^3 / 3 = 1.32 m antispinward of the mark beneath it. (Seen from outside, the bundle goes straight at the
// speed it had on the gantry while the floor, 18 m further out and so faster, turns past it. The bundles' vertex
// shader does that sum exactly, which gives 1.93 s and 1.33 m.) So every bin stands 1.3 m antispinward of its plumb
// line; and since both ranks drop inward over the nave and both drift the same way, the spinward rank's bins stand
// out in the nave and the antispinward rank's are tucked in by the glass. A cord with a bob hangs from every flap to
// a painted cross that nothing has ever landed on: a still cord hangs true, because nothing pushes sideways on what
// does not move.
//
// Not canon (the docs give Dulse its broth with one coiled noodle, breakfast at six, Abelone at 78, visiting cooks who
// stay as long as they cook, the far side's "keys", the Keel as where food plant goes, and that a dropped thing lands
// antispinward; the rest is this page's):
//   - the Kelp Stacks: the nave on deck 8, its eighty tanks and their size, the lamps up the aisle side of each
//     glass; kelp grown under lamps at all, and a kelp bred to grow the height of the glass at two metres a day
//   - the morning cut: a third of the tanks each day (so each is cut every third day, and its slate names the
//     day), the gantry, hoists, tables and flaps, the bins, the plumb cords, the cross and the ring, the cutters'
//     rules, the apron room, gold oilskin aprons and a blue one kept for visitors, what an apron costs
//   - a visiting cook from Chervil among the cutters at S 22, nine mornings in and still tearing it, and the
//     slate the cutters have hung beside her
//   - the breakfast kitchen in the Keel at the nave's end: six kettles on the 65 degree loop, three steeping at 60
//     (kelp gives its best to water that never boils: cooks' knowledge, not the docs') and three finishing on
//     their elements, 540 litres apiece; the pass; bowls that do not match; racks of 144 covered bowls; the count
//     for the morning (5,400 bowls, 900 to a kettle); the cabs that take breakfast up
//   - that the noodles pulled on the terraces the evening before come down in hanks and are coiled into their
//     bowls here, and who may touch one; every slate and notice
//   - the day and the hour: a Thursday, seven minutes past four
import {
  Scene, ShaderMaterial, Mesh, InstancedMesh, BufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute,
  Vector3, Matrix4, Quaternion, Color, DoubleSide, BackSide, FrontSide,
} from 'three';
import { makePath } from '../core/path.js';
import { DRUM, makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, lobby, PALETTES, DOOR_IN } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, vec3col, glowPoints } from '../kit/mats.js';
import { Geo, shade, mixc } from '../kit/geo.js';
import { makeRng, smoothstep } from '../core/rng.js';

// ---------------------------------------------------------------- the place, in the frame of deck 8
// x spinward, y above the nave's floor, z along the axis from the apron room to the kitchen. Looking the way the
// flight goes (+z), spinward is on the left.
const R8 = deckRadius(8), OMG = DRUM.OMEGA;                              // 2,972 m; 0.0572 rad/s: things weigh OMG^2 R8 = 9.72 m/s2
const NT = 40, PITCH = 7.5, Z0 = 3.75, NAVE = NT * PITCH;                 // forty tanks a side, 300 m of nave
const TX = 8.7, TR = 1.5;                                                 // where a rank stands; a tank's radius
const PY = 0.7, RIM = 18, WY = 17.62;                                     // a tank's plinth, its rim, its water
const GY = 17.4, HY = 20, HW = 12.7;                                      // the gantry's deck, the ceiling, the hall's half-width
const EDGE = 5.2, POST = 5.32;                                            // the gantry's edge over the nave, and its posts
const DXC = 4.8;                                                          // the flaps hang this far from the nave's middle
const Y_LET = 18.5, Y_HEAP = 0.5;                                         // a bundle is let go here and lands here: 18 m
const T_LAND = Math.sqrt((R8 - Y_HEAP) ** 2 - (R8 - Y_LET) ** 2) / (OMG * (R8 - Y_LET));     // 1.93 s
const DRIFT = (OMG * T_LAND - Math.atan(OMG * T_LAND)) * R8;                                 // 1.33 m antispinward
const T_LET = 2.6;                                                        // seconds into a tank's round that its bundle goes
const tankZ = (k) => Z0 + k * PITCH;
// the rota: tanks are cut in pairs, every third day. It is Thursday: 0 is being cut this morning (last cut on
// Monday), 1 was cut yesterday, 2 the day before. The shaders know the same rule (kDay).
const dayOf = (side, k) => ((k >> 1) + (side > 0 ? 2 : 0)) % 3;
const DAYS = ['Monday', 'Wednesday', 'Tuesday'];
const kelpTop = (d) => (d === 0 ? WY : WY - 6 + 2 * d);                   // it is cut back 6 m and grows 2 m a day
const tankName = (side, k) => (side > 0 ? 'S ' : 'A ') + (k + 1);
const HERO = { side: 1, k: 20 };                                          // the tank the flight goes up through: S 21
const GUEST = { side: 1, k: 21 };                                         // the one the visiting cook is cutting at: S 22
// bundles the flight is there to see: [side, tank, the second of the flight it lands at]. A 1 through the door, A 2
// close by, the one the visiting cook's teacher lets go as the flight passes, and S 27's, watched all the way down
const LANDS = [[-1, 0, 2.3], [-1, 1, 5.3], [1, 21, 37.7], [1, 26, 42.63]];
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const fx = (v) => v.toFixed(4);

// colours: Dulse's dawn is "Broth gold" (15-canon.js: #211a10, #7a5a2c, #e7c27a, #fff6df). Down here the gold is in
// the lamps and the kelp, and the water between them is green.
const GLOW = '#6a9a4a', LAMP = '#ffcf78', WARM = '#ffcf8a';
const STEEL = '#2a2f30', STEEL2 = '#3a4040', IRON = '#1c2021', BRASS = '#b08d4a', COPPER = '#a8623e', RAIL = '#5a6262', RAIL2 = '#4a5252';
const OILSKIN = '#e0b23e', VISITOR = '#2f6a8a';
const KELPS = ['#8a6a22', '#9a7a2a', '#7a6420', '#a08430', '#74621e', '#8f7a34'];

// ---------------------------------------------------------------- shader text shared by everything in the water
// kWet: of the straight line from the eye E to a point E + r in a tank whose axis stands at c, the share that is
// under water. The eye may be outside the glass, over the open top, or in the water itself.
const WATER_GLSL = /* glsl */`
const float TR = ${fx(TR)}, WY = ${fx(WY)}, PY = ${fx(PY)}, SIG = 0.34;
float kWet(vec3 E, vec3 r, vec2 c) {
  vec2 o = E.xz - c, h = r.xz;
  float a = dot(h, h), cc = dot(o, o) - TR * TR, t0 = 0.0;
  if (a > 1e-8) { float b = dot(o, h), disc = b * b - a * cc; if (disc > 0.0) t0 = max((-b - sqrt(disc)) / a, 0.0); else if (cc > 0.0) return 0.0; }
  else if (cc > 0.0) return 0.0;
  if (E.y > WY && r.y < -1e-5) t0 = max(t0, (WY - E.y) / r.y);
  return clamp(1.0 - t0, 0.0, 1.0);
}
float kDay(float s, float k) { return mod(floor(k * 0.5) + (s > 0.0 ? 2.0 : 0.0), 3.0); }
float kTop(float d) { return d < 0.5 ? WY : WY - 6.0 + 2.0 * d; }
`;

// ---------------------------------------------------------------- the wet floor
// Steel plate with water standing on it. It holds the lit glass the way a wet street holds shop windows: each tank
// is mirrored in it as a long streak that points at the eye, sharp where the water stands and soft where the plate
// is only damp. The mirror is worked out, not painted: the line of sight is turned over in the floor and followed to
// the rank it meets. The marks are in the floor's own shader too: under every flap a plumb cross, crisp because
// nothing lands on it, and 1.33 m anti of it the ring where everything does, worn through to the steel.
const FLOOR_VERT = /* glsl */`
${BEND_PARS}
varying vec3 vW; varying vec3 vF;
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  vF = p;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const floorFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uBend, uGlow, uLamp, uWarm; uniform float uKitchen;
varying vec3 vW; varying vec3 vF;
${rig.glsl}
${NOISE_GLSL}
${WATER_GLSL}
const float TX = ${fx(TX)}, Z0 = ${fx(Z0)}, PITCH = ${fx(PITCH)}, NT = ${fx(NT)}, DXC = ${fx(DXC)}, DRIFT = ${fx(DRIFT)};
// one rank in the mirror. o: the place on the floor; d: the mirrored line's heading on the plan; m: its climb in a
// metre; rough: how far the plate scatters the line sideways and (much further, as wet ground does) up and down, in
// metres to the metre. Returns the light it finds (rgb) and how much of the line a tank stopped (a)
vec4 kRank(float s, vec2 o, vec2 d, float m, vec2 rough) {
  float cx = s * TX, reach = TR + 0.6;
  // where the line comes into the rank's band (at once, if it starts in it), or that it never does
  float outside = step(reach, abs(o.x - cx)), dx = abs(d.x) < 1e-4 ? 1e-4 : d.x;
  float t0 = outside * (cx - sign(dx) * reach - o.x) / dx;
  float live = 1.0 - outside * max(step(abs(d.x), 1e-4), step(t0, 0.0));
  float dir = d.y >= 0.0 ? 1.0 : -1.0, zin = (o.y + t0 * d.y - Z0) / PITCH;
  float k0 = dir > 0.0 ? ceil(zin) : floor(zin);
  vec3 sum = vec3(0.0); float cover = 0.0;
  for (int i = -1; i <= 1; i++) {
    float k = k0 + dir * float(i);
    vec2 c = vec2(cx, Z0 + k * PITCH) - o;
    float along = dot(c, d), al = max(along, 1e-3);
    float off = abs(c.x * d.y - c.y * d.x), blur = 0.02 + rough.x * al;
    float w = smoothstep(TR + blur, TR - blur, off) * step(0.0, k) * step(k, NT - 1.0) * step(1e-6, along);
    // the height the line meets the glass at, and the share of its scatter that falls on the lit part
    float y = m * (al - sqrt(max(TR * TR - off * off, 0.0))), S = 0.05 + rough.y * al;
    w *= clamp((min(y + S, WY) - max(y - S, PY)) / (2.0 * S), 0.0, 1.0) * (1.0 - cover);
    // what the glass shows there: its lamps on the aisle side, green water toward the nave, kelp up to where its day
    // leaves it and clear water over that
    float top = kTop(kDay(s, k)), aisle = smoothstep(-0.5, 0.9, -s * sign(c.x * d.y - c.y * d.x) * sign(d.y) * off / TR);
    float clear = smoothstep(top - 0.5 - S, top + 0.5 + S, y);
    vec3 col = mix(uGlow * 0.75, uGlow * 0.35 + uLamp * 0.5, aisle * (0.45 + 0.55 * clear));
    col *= mix(0.85, 1.0, clear);
    sum += col * w; cover += w;
  }
  return vec4(sum, cover) * live;
}
// the ranks as damp steel holds them: no columns, only how much lit glass the scattered line finds. Each of the
// five lines it is scattered into can meet only the rank it is heading for (or, from behind a rank, that one)
vec3 kSheen(vec2 o, vec2 d, float m) {
  float sum = 0.0, own = abs(o.x) > TX - TR ? sign(o.x) : 0.0;
  for (int i = 0; i < 5; i++) {
    float a = (float(i) - 2.0) * 0.24, ca = cos(a), sa = sin(a);
    vec2 e = vec2(d.x * ca - d.y * sa, d.x * sa + d.y * ca);
    float xw = (own != 0.0 ? own : (e.x >= 0.0 ? 1.0 : -1.0)) * (TX - TR);
    float t = (xw - o.x) / (abs(e.x) > 1e-4 ? e.x : 1e-4), tt = max(t, 0.0);
    float y = m * tt, z = o.y + e.y * tt, S = 0.4 + 0.22 * tt;
    sum += step(1e-6, t) * (1.0 - 0.3 * abs(float(i) - 2.0)) * clamp((min(y + S, WY) - max(y - S, PY)) / (2.0 * S), 0.0, 1.0) * smoothstep(-4.0, 4.0, z) * smoothstep(NT * PITCH + 4.0, NT * PITCH - 4.0, z);
  }
  return uGlow * (0.4 / 3.2) * sum;
}
void main() {
  ${CLIP_FRAG}
  vec2 m = vF.xz;
  float px = max(length(dFdx(m)), length(dFdy(m)));
  // the plate: sheets 2.54 m by 3.75 m, each a little its own colour, seams between, and never one shade throughout
  vec2 pl = m / vec2(2.54, 3.75), pid = floor(pl), pf = fract(pl);
  float seam = min(min(pf.x, 1.0 - pf.x) * 2.54, min(pf.y, 1.0 - pf.y) * 3.75);
  float tone = 0.8 + 0.4 * kHash(pid) + 0.25 * (kFbm(m * 0.37) - 0.5);
  vec3 base = vec3(0.021, 0.025, 0.027) * tone * (1.0 - 0.6 * (1.0 - smoothstep(0.0, 0.012 + px * 1.5, seam)) * smoothstep(0.5, 0.05, px));
  float wet = smoothstep(0.37, 0.5, kFbm(m * 0.16 + 3.7) + 0.16 * (kHash(pid + 9.0) - 0.5));
  // the marks, for the tank this stretch of floor belongs to
  float k = clamp(floor((m.y - Z0) / PITCH + 0.5), 0.0, NT - 1.0), zc = Z0 + k * PITCH, ink = 0.0, worn = 0.0, bin = 0.0;
  float aa = 0.006 + px;
  {
    // (the spinward rank's marks are all on the spinward side of the nave's middle, and the other rank's on the other)
    float s = m.x >= 0.0 ? 1.0 : -1.0;
    vec2 q = abs(m - vec2(s * DXC, zc + 0.3));
    ink = max(smoothstep(0.035 + aa, 0.035, q.x) * smoothstep(0.34 + aa, 0.34, q.y), smoothstep(0.035 + aa, 0.035, q.y) * smoothstep(0.34 + aa, 0.34, q.x));
    vec2 r = m - vec2(s * DXC - DRIFT, zc);
    float rr = length(r), chip = smoothstep(0.3, 0.62, kNoise(m * 7.0 + 11.0) * 0.6 + kNoise(m * 23.0) * 0.4);
    ink = max(ink, smoothstep(0.05 + aa, 0.05, abs(rr - 1.0)) * (0.25 + 0.75 * chip));
    worn = smoothstep(1.05, 0.5, rr);
    // a dashed line from the one mark to the other
    float between = step(abs(r.y), 0.02 + aa * 0.5) * step(1.0, rr) * step(r.x, DRIFT - 0.34) * step(0.0, r.x) * step(0.5, fract(r.x * 6.0));
    ink = max(ink, between * 0.6);
    if (kDay(s, k) < 0.5) bin = smoothstep(0.86, 0.6, max(abs(r.x), abs(r.y)));
  }
  base = mix(base, base * 1.9 + 0.01, worn * 0.7);                      // scuffed bright where the bins are dragged
  vec3 paint = vec3(0.62, 0.46, 0.13);
  base = mix(base, paint, ink * 0.9);
  wet = clamp(wet + worn * 0.5, 0.0, 1.0) * (1.0 - ink * 0.6);
  base *= 1.0 - 0.75 * bin;
  vec3 c = base * kLight(vW, kUp(vW), vF, vec3(0.0, 1.0, 0.0)) * (1.0 - 0.35 * wet);
  // the mirror
  vec3 Vw = normalize(cameraPosition - vW), V = Vw;
  if (uBend.z > 0.0) { float a = uBend.x + vF.x / uBend.z, ca = cos(a), sa = sin(a); V = vec3(-sa * Vw.x + ca * Vw.y, -ca * Vw.x - sa * Vw.y, Vw.z); }
  vec3 R = vec3(-V.x, max(V.y, 0.02), -V.z);
  R.xz += (kHash2(pid) - 0.5) * 0.0025 + (vec2(kNoise(m * 2.3), kNoise(m * 2.3 + 31.0)) - 0.5) * mix(0.01, 0.003, wet);     // no plate lies quite flat
  float hl = max(length(R.xz), 1e-4), climb = R.y / hl;
  vec2 d = R.xz / hl, rough = mix(vec2(0.012, 0.3), vec2(0.003, 0.02), wet);
  // (between the ranks the mirrored line can only meet the one it is heading for; in among a rank's tanks, or behind them, that rank)
  vec4 ra = kRank(abs(m.x) > TX - TR - 0.6 ? sign(m.x) : (d.x >= 0.0 ? 1.0 : -1.0), m, d, climb, rough);
  vec3 spec = ra.rgb * mix(0.2, 1.0, wet) + kSheen(m, d, climb) * mix(0.8, 0.18, wet);
  // and the kitchen at the nave's end: its lit wall, as a warm road down the middle
  if (d.y > 0.02) {
    float t = (uKitchen - m.y) / d.y, hx = m.x + d.x * t, hy = climb * t, S = 0.3 + rough.y * t, sb = 0.3 + rough.x * t * 3.0;
    float cov = clamp((min(hy + S, 19.0) - max(hy - S, 0.2)) / (2.0 * S), 0.0, 1.0);
    spec += uWarm * cov * smoothstep(${fx(HW)} + sb, ${fx(HW)} - sb, abs(hx)) * (0.3 + 0.7 * smoothstep(10.0 + S, 2.0, hy)) * (1.0 - min(ra.a, 1.0));
  }
  // from inside the apron room the floor can hold only what shows through the door
  if (m.y < -0.3) {
    float t = d.y > 1e-3 ? (-0.15 - m.y) / d.y : 1e4, xd = m.x + d.x * t;
    spec *= smoothstep(${fx(DOOR[0])} - 0.05, ${fx(DOOR[0])} + 0.05, xd) * smoothstep(${fx(DOOR[1])} + 0.05, ${fx(DOOR[1])} - 0.05, xd) * step(climb * t, ${fx(DOOR[2])});
  }
  float fres = 0.2 + 0.8 * pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0);
  spec *= 0.74 + 0.52 * kNoise(vec2(dot(m, vec2(-d.y, d.x)) * 2.6, dot(m, d) * 0.12));      // dragged out toward the eye in streaks, as wet ground does
  c += spec * fres * (1.0 - 0.9 * bin) * (1.0 - 0.7 * ink);
  gl_FragColor = vec4(kAir(c, vW), 1.0);
}`;

// ---------------------------------------------------------------- the glass
// A tank is drawn as the inside of its far wall (and its floor): what the eye sees through the water. The water is
// lit, so the farther the line of sight goes through it the more of its green it takes; the lamps stand in strips up
// the aisle side of the glass, behind the kelp as the nave sees it. Every tank but one is drawn solid. The one the
// flight goes into is drawn so that it can be seen out of: from inside, the nave shows through the green.
const TANK_VERT = /* glsl */`
attribute vec4 aTank;      // where it stands (x, z), which way its lamps are (the sign of x), the day it was last cut
${BEND_PARS}
varying vec3 vW; varying vec3 vF; varying vec4 vTank;
void main() {
  vec3 p = position + vec3(aTank.x, 0.0, aTank.y), n = vec3(0.0, 1.0, 0.0);
  vF = p; vTank = aTank;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const tankFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uEye, uGlow, uLamp; uniform float uSee;
varying vec3 vW; varying vec3 vF; varying vec4 vTank;
${rig.glsl}
${WATER_GLSL}
void main() {
  ${CLIP_FRAG}
  vec2 c = vTank.xy, q = vF.xz - c;
  vec3 r = vF - uEye; float len = length(r);
  float path = kWet(uEye, r, c) * len;
  // from outside, the water bends the line of sight inward: even at the glass's edge it goes through 1.3 radii of it
  vec2 o = uEye.xz - c; float hl = max(length(r.xz), 1e-4);
  float b = clamp(abs(o.x * r.z - o.y * r.x) / (hl * TR), 0.0, 1.0);
  float outside = step(TR * TR, dot(o, o)) * step(uEye.y, WY + 0.4);
  path = mix(path, max(path, 2.0 * TR * sqrt(1.0 - b * b / 1.77) * len / hl), outside);
  float fog = 1.0 - exp(-SIG * path);
  float side = step(PY + 0.03, vF.y);
  float az = atan(q.y, q.x * vTank.z);
  float panel = smoothstep(1.15, 1.02, abs(az)) * side * smoothstep(PY + 0.2, PY + 0.45, vF.y) * smoothstep(WY - 0.04, WY - 0.3, vF.y);
  float strip = smoothstep(0.5, 0.1, abs(fract(az * 4.1 + 0.5) - 0.5)) * (0.86 + 0.14 * step(0.06, fract(vF.y / 0.62)));
  float hoop = side * smoothstep(0.1, 0.07, abs(mod(vF.y - PY + 1.45, 2.9) - 1.45));
  float top = kTop(vTank.w);
  vec3 wall = uLamp * panel * (0.5 + 0.5 * strip) + uGlow * 0.07;
  // the tank's own floor: a grating the holdfasts are tied to
  if (side < 0.5) wall = vec3(0.012, 0.016, 0.012) + uGlow * 0.05 * step(0.5, fract(q.x * 5.0)) * step(0.5, fract(q.y * 5.0));
  wall = mix(wall, vec3(0.006, 0.008, 0.008), hoop);
  // the water's own light: more of it where no kelp stands in it, and in soft shafts off the strips of lamps
  vec3 col = uGlow * fog * (0.72 + 0.4 * smoothstep(top - 1.0, top + 1.0, vF.y)) * (0.92 + 0.08 * sin(az * 8.2 + 1.0)) + wall * (1.0 - fog);
  col += (uGlow * 0.5 + uLamp * 0.08) * pow(b, 10.0) * outside;
  float alpha = 1.0;
  if (uSee > 0.5) alpha = 1.0 - (1.0 - fog) * (1.0 - clamp(panel * 0.9 + hoop + (1.0 - side), 0.0, 1.0));
  gl_FragColor = vec4(kAir(col, vW), alpha);
}`;

// ---------------------------------------------------------------- the kelp
// One blade is a ribbon three points wide; every blade in the nave is a copy of it, rooted, sized and timed by what
// its copy carries, and moved in the vertex shader: it leans and wanders in the slow turn of the water, more the
// higher it goes, turns as it climbs, ruffles along its edges, and where it has grown past the top it lies along the
// water and trails round. A blade is lit by its tank's lamps, which stand behind it as the nave sees it, so the
// light comes through: gold where the blade faces you, a dark line where it is edge on, a darker rib down the middle.
// The same ribbon hangs from a hoist as a cut length on its way out (aTank.w = 1).
const kelpVert = (rig) => /* glsl */`
attribute vec4 aRoot;      // where it is rooted (x, y, z), and how long it has grown
attribute vec4 aLeaf;      // the blade's width, a number of its own, how far it sways, the turn it starts at
attribute vec4 aTank;      // its tank's axis (x, z), which way that tank's lamps are, and 0 growing or 1 on a hoist
attribute vec3 aTint;
${BEND_PARS}
uniform float uTime;
varying vec3 vW; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vLit; varying vec3 vUV; varying vec4 vTank;
${rig.glsl}
${WATER_GLSL}
void main() {
  float u = position.x, s = position.y, L = aRoot.w, w = aLeaf.x, ph = aLeaf.y * 6.2832, h = s * L, t = uTime;
  vec2 c = aTank.xy;
  float th = aLeaf.w + h * 0.3 + 0.7 * sin(t * 0.19 + ph + h * 0.27);
  vec3 across = vec3(cos(th), 0.0, sin(th)), nrm = vec3(-sin(th), 0.0, cos(th)), p;
  // a stalk for the first metre, then the blade; it is cut square across the top, and grows from the bottom
  float taper = (0.12 + 0.88 * smoothstep(0.3, 2.0, h)) * (1.0 - 0.4 * smoothstep(0.985, 1.0, s)), run = t * 0.5;
  if (aTank.w < 0.5) {
    vec2 sway = aLeaf.z * pow(s, 1.2) * vec2(sin(t * 0.29 + ph + h * 0.22), cos(t * 0.23 + ph * 1.7 + h * 0.18));
    sway += 0.07 * s * vec2(sin(t * 0.83 + ph * 3.0 + h * 0.9), cos(t * 0.71 + ph * 2.0 + h * 1.1));
    p = vec3(aRoot.x + sway.x, aRoot.y + h, aRoot.z + sway.y);
    vec2 r = p.xz - c; float rl = length(r), lim = TR - 0.2 - 0.4 * w;
    if (rl > lim) { r *= lim / rl; rl = lim; }
    float over = max(p.y - (WY - 0.07), 0.0);
    if (over > 0.0) {
      float a = over / max(rl, 0.5), ca = cos(a), sa = sin(a), k = clamp(over * 4.0, 0.0, 1.0);
      r = vec2(r.x * ca - r.y * sa, r.x * sa + r.y * ca);
      p.y = WY - 0.07 - 0.02 * sin(over * 3.0 + t * 0.8 + ph);
      across = normalize(mix(across, vec3(r.x, 0.0, r.y) / max(rl, 0.01), k));
      nrm = normalize(mix(nrm, vec3(0.0, 1.0, 0.0), k));
    }
    p.xz = c + r;
  } else {
    // a cut length going up over the roller: it swings a little, and its ruffles climb
    p = vec3(aRoot.x, aRoot.y - h, aRoot.z) + s * 0.05 * vec3(sin(t * 1.3 + ph), 0.0, cos(t * 1.1 + ph));
    run = -t * 2.4; taper = 1.0;
  }
  float ruf = (sin(h * 6.5 + ph * 5.0 - run) + 0.5 * sin(h * 14.0 + ph * 9.0 + u * 2.0 - run)) * 0.07 * abs(u) * taper;
  p += across * (u * w * 0.5 * taper) + nrm * (ruf + (1.0 - abs(u)) * 0.05 * taper);
  vec3 n = normalize(nrm * 0.6 + vec3(0.0, 0.5, 0.0));
  vF = p; vFN = nrm; vCol = aTint; vUV = vec3(u, h, aLeaf.y); vTank = aTank;
  vec3 wn = n;
  kBend(p, wn);
  vW = p;
  vLit = kLight(p, wn, vF, n);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const kelpFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uEye, uGlow, uLamp, uKelpL;
varying vec3 vW; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vLit; varying vec3 vUV; varying vec4 vTank;
${rig.glsl}
${NOISE_GLSL}
${WATER_GLSL}
void main() {
  ${CLIP_FRAG}
  vec3 r = vF - uEye; float len = max(length(r), 1e-4);
  vec3 V = -r / len, N = normalize(cross(dFdx(vF), dFdy(vF)));
  float facing = abs(dot(N, V)), u = vUV.x;
  // the margin is frilled: the ribbon is cut to a scalloped edge here, not in its geometry
  float edge = 0.8 + 0.2 * sin(vUV.y * 6.3 + vUV.z * 40.0 + sign(u) * 1.9) * (0.55 + 0.45 * sin(vUV.y * 2.1 + vUV.z * 13.0));
  if (abs(u) > edge) discard;
  float au = abs(u) / edge, rib = smoothstep(0.45, 0.1, au), frill = smoothstep(0.55, 1.0, au);
  float mott = kNoise(vec2(u * 2.1 + vUV.z * 17.0, vUV.y * 2.7)), vein = 0.5 + 0.5 * sin(vUV.y * 41.0 + au * 8.0);
  float blot = kNoise(vec2(u * 6.0 + vUV.z * 31.0, vUV.y * 11.0)), stri = 0.5 + 0.5 * sin(u * 30.0 + 4.0 * kNoise(vec2(vUV.y * 2.5, vUV.z * 53.0)));
  vec3 kelp = vCol * (0.6 + 0.6 * mott) * (1.0 - 0.6 * rib) * (1.0 + 0.6 * frill) * (0.9 + 0.1 * vein) * (0.78 + 0.44 * blot) * (0.9 + 0.2 * stri);
  vec3 c;
  if (vTank.w < 0.5) {
    float back = 0.5 - 0.5 * dot(V.xz, vec2(vTank.z, 0.0)) / max(length(V.xz), 1e-3);       // 1: the lamps are behind the blade
    float deep = clamp(0.5 + (vF.x - vTank.x) * vTank.z / (2.0 * TR), 0.0, 1.0);           // 1: hard by the lamps
    vec3 through = kelp * vec3(1.2, 1.0, 0.35) * (0.2 + 0.8 * facing);
    vec3 onto = kelp * vec3(0.46, 0.62, 0.3) * (0.4 + 0.6 * facing);
    // blades toward the nave stand in the shade of the rest
    c = mix(onto, through, back) * uKelpL * (0.16 + 0.84 * deep * deep) + kelp * vLit * 0.5;
    float fog = 1.0 - exp(-SIG * kWet(uEye, r, vTank.xy) * len);
    c = mix(c, uGlow, fog);
  } else c = kelp * vLit * 1.5;
  gl_FragColor = vec4(kAir(c, vW), 1.0);
}`;

// ---------------------------------------------------------------- the water's surface
// The top of each tank, seen from the gantry and from underneath. From above it is lit water with the kelp showing
// through it, rings going out from where a length is being drawn up; from below it is a bright ceiling with a darker
// window straight overhead, which is how the underside of water looks: past 48 degrees it shows only the tank.
const SURF_VERT = /* glsl */`
attribute vec4 aTank;
${BEND_PARS}
varying vec3 vW; varying vec3 vF; varying vec4 vTank;
void main() {
  vec3 p = position + vec3(aTank.x, 0.0, aTank.y), n = vec3(0.0, 1.0, 0.0);
  vF = p; vTank = aTank;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const surfFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uEye, uGlow, uLamp, uWarm; uniform float uTime;
varying vec3 vW; varying vec3 vF; varying vec4 vTank;
${rig.glsl}
${NOISE_GLSL}
${WATER_GLSL}
void main() {
  ${CLIP_FRAG}
  vec2 q = vF.xz - vTank.xy;
  vec3 r = vF - uEye; float len = max(length(r), 1e-4);
  vec3 V = -r / len;
  // where the hoist draws a length up, on the nave side of a tank being cut
  vec2 hq = q + vec2(vTank.z * 0.9, 0.0);
  float busy = step(vTank.w, 0.5), hd = length(hq);
  float rip = busy * sin(hd * 11.0 - uTime * 3.2) * exp(-hd * 0.9) + 0.35 * sin(q.x * 3.1 + uTime * 0.7) * sin(q.y * 2.7 - uTime * 0.53) + 0.3 * (kNoise(q * 4.0 + uTime * 0.3) - 0.5);
  vec3 col; float alpha;
  if (uEye.y > WY) {
    float fres = 0.03 + 0.97 * pow(1.0 - clamp(V.y, 0.0, 1.0), 4.0);
    col = uGlow * (1.15 + 0.4 * rip) + uLamp * 0.16 + uWarm * 0.3 * smoothstep(0.55, 1.0, rip) * fres;
    alpha = clamp(0.5 + 0.45 * fres + 0.1 * rip, 0.0, 1.0);
  } else {
    float up = clamp(-V.y, 0.0, 1.0);
    float window = smoothstep(0.6, 0.74, up + 0.05 * rip);
    col = mix(uGlow * (1.25 + 0.35 * rip) + uLamp * 0.12, vec3(0.02, 0.03, 0.02) + uWarm * (0.1 + 0.2 * smoothstep(0.3, 1.0, rip)), window);
    col = mix(col, uGlow, 1.0 - exp(-SIG * len));
    alpha = 0.94;
  }
  gl_FragColor = vec4(kAir(col, vW), alpha);
}`;

// ---------------------------------------------------------------- things that move: the bundles, and people at work
// The kit's lit material with a motion of its own in the vertex shader, and one more light: the lamp on the rail by
// every flap that is in use, which makes a warm pool round each tank being cut. DROP: a tied bundle of kelp, one to
// each tank being cut. Its whole life is a function of the flight's own clock (uT), so the same second of the flight
// always shows the same bundle in the same place: set on the flap, let go, falling, landed in the bin, sunk into the
// heap. WORK: a cutter or a cook, who leans to the work from the hips and comes up again in a time of their own.
// Neither: the gantry itself, its tables and hoists, which only want the lamps.
const ACT_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit;
attribute vec4 aAct;       // DROP: where it is let go (x, z), the seconds its tank's round takes, where in the round it starts
${BEND_PARS}
uniform float uTime, uT;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vSoft;
const float R8 = ${fx(R8)}, OMG = ${fx(OMG)}, Y_LET = ${fx(Y_LET)}, T_LET = ${fx(T_LET)}, T_LAND = ${fx(T_LAND)};
void main() {
  vec3 p = position, n = normal;
  #ifdef DROP
    float P = aAct.z, c = mod(uT + aAct.w, P), tau = c - T_LET, fall = clamp(tau, 0.0, T_LAND);
    float shown = smoothstep(0.25, 0.5, c) * (1.0 - smoothstep(P - 0.5, P - 0.15, c));
    // it turns over as it falls, and lands soft
    float a = fall * (1.2 + fract(aAct.w * 0.37)), ca = cos(a), sa = sin(a);
    p = vec3(p.x * ca - p.y * sa, p.x * sa + p.y * ca, p.z); n = vec3(n.x * ca - n.y * sa, n.x * sa + n.y * ca, n.z);
    float splat = step(T_LAND, tau) * exp(-(tau - T_LAND) * 5.0);
    p.y *= 1.0 - 0.35 * splat; p.xz *= 1.0 + 0.2 * splat;
    p *= shown;
    // seen from outside it goes straight, at the speed the gantry had, while the floor, further out, turns past
    // under it. r is how far from the axis it has got; atan(wt) the angle it has gone round; wt the angle the drum has
    float r0 = R8 - Y_LET, wt = OMG * fall, rr = r0 * sqrt(1.0 + wt * wt);
    p += vec3(aAct.x + (atan(wt) - wt) * R8, R8 - rr - 0.22 * smoothstep(T_LAND + 1.0, P - T_LET, tau), aAct.y);
  #elif defined(WORK)
    float busy = smoothstep(-0.35, 0.1, sin(uTime * (0.31 + 0.2 * fract(aAct.x * 7.3)) + aAct.x * 40.0));
    float a = (0.07 + 0.05 * fract(aAct.x * 3.1)) * busy * (0.5 - 0.5 * cos(uTime * (2.6 + 1.2 * fract(aAct.x * 5.7)) + aAct.x * 6.283)) * smoothstep(0.84, 1.0, p.y);
    float ca = cos(a), sa = sin(a), y = p.y - 0.9;
    p = vec3(p.x, 0.9 + y * ca - p.z * sa, y * sa + p.z * ca); n = vec3(n.x, n.y * ca - n.z * sa, n.y * sa + n.z * ca);
    p = (instanceMatrix * vec4(p, 1.0)).xyz; n = mat3(instanceMatrix) * n;
  #endif
  n = normalize(n);
  vF = p; vFN = n;
  kBend(p, n);
  vW = p; vN = n;
  vec3 col = aCol.rgb;
  #ifdef USE_INSTANCING_COLOR
    col = mix(col, col * instanceColor, aCol.a);
  #endif
  vCol = col; vEmit = aEmit; vSoft = aCol.a;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const actFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vSoft;
${rig.glsl}
${WATER_GLSL}
const float Z0 = ${fx(Z0)}, PITCH = ${fx(PITCH)}, NT = ${fx(NT)}, GY = ${fx(GY)}, DONE = ${fx(HERO.k)};
vec3 kCutLamp(vec3 F, vec3 FN) {
  if (F.y < 16.0) return vec3(0.0);
  float s = F.x > 0.0 ? 1.0 : -1.0, k0 = floor((F.z - Z0 - 0.59) / PITCH + 0.5);
  vec3 sum = vec3(0.0);
  for (int i = -1; i <= 1; i++) {
    float k = k0 + float(i);
    if (k < 0.0 || k > NT - 1.0 || kDay(s, k) > 0.5 || (s > 0.0 && abs(k - DONE) < 0.5)) continue;
    vec3 d = vec3(s * 5.39, GY + 1.72, Z0 + k * PITCH + 0.59) - F; float d2 = dot(d, d);
    sum += vec3(1.0, 0.76, 0.46) * (0.3 + 0.7 * max(dot(FN, d) * inversesqrt(d2 + 1e-4), 0.0)) / (1.0 + d2 / 5.0);
  }
  return sum * 1.5;
}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  float soft = vSoft * 0.4;
  N = normalize(mix(N, kUp(vW), soft)); FN = normalize(mix(FN, vec3(0.0, 1.0, 0.0), soft));
  gl_FragColor = vec4(kAir(vCol * (kLight(vW, N, vF, FN) + kCutLamp(vF, FN) + vEmit), vW), 1.0);
}`;

// ---------------------------------------------------------------- cords
// The plumb lines, and the hoists' lines: ribbons that turn to face the eye and are never drawn thinner than a pixel
// (they fade instead), so that 18 m of cord does not sparkle.
const CORD_VERT = /* glsl */`
attribute vec3 aDir; attribute vec2 aSide;      // the way the cord runs; which edge of the ribbon, and how thick the cord is
${BEND_PARS}
uniform float uPx;
varying vec3 vW; varying vec3 vF; varying float vA;
void main() {
  vec3 p = position, q = position + aDir * 0.2, n = vec3(0.0, 1.0, 0.0), n2 = n;
  vF = p;
  kBend(p, n); kBend(q, n2);
  vec3 V = cameraPosition - p; float dist = max(length(V), 0.01);
  vec3 S = cross(q - p, V); float sl = length(S);
  S = sl > 1e-7 ? S / sl : vec3(1.0, 0.0, 0.0);
  float px = aSide.y * uPx / dist, shown = max(px, 1.3);
  vA = px / shown;
  p += S * (aSide.x * 0.5 * shown * dist / uPx);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const cordFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uCol;
varying vec3 vW; varying vec3 vF; varying float vA;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 up = kUp(vW);
  vec3 c = uCol * (kLight(vW, up, vF, vec3(0.0, 1.0, 0.0)) + 0.05);
  gl_FragColor = vec4(kAir(c, vW), min(vA, 1.0));
}`;
class Cords {
  constructor() { this.pos = []; this.dir = []; this.side = []; this.idx = []; this.n = 0; }
  /** a straight cord from a to b (flat points), w metres thick */
  add(a, b, w = 0.008) {
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(d[0], d[1], d[2]) || 1, v = this.n;
    for (const p of [a, b]) for (const s of [-1, 1]) { this.pos.push(p[0], p[1], p[2]); this.dir.push(d[0] / l, d[1] / l, d[2] / l); this.side.push(s, w); this.n++; }
    this.idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
  }
  mesh(mat) {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3));
    g.setAttribute('aDir', new Float32BufferAttribute(this.dir, 3));
    g.setAttribute('aSide', new Float32BufferAttribute(this.side, 2));
    g.setIndex(this.idx);
    const m = new Mesh(g, mat);
    m.frustumCulled = false; m.renderOrder = 5;
    return m;
  }
}

// ---------------------------------------------------------------- materials and shared numbers
function makeMats(deck, zKitchen) {
  const f = deck.frame, rig = deck.rig;
  const U = {
    eye: { value: new Vector3(0, 2, -20) }, T: { value: 0 }, see: { value: 0 },
    glow: { value: vec3col(GLOW, 0.8) }, lamp: { value: vec3col(LAMP, 1.9) }, warm: { value: vec3col(WARM, 1.3) }, kelpL: { value: new Vector3(1.8, 1.5, 0.9) },
  };
  const base = () => ({ ...rig.uniforms, uClip: G.uClip, uTime: G.uTime, uBend: { value: new Vector3(f.a0, f.z0, f.floorR) } });
  const water = () => ({ ...base(), uEye: U.eye, uGlow: U.glow, uLamp: U.lamp, uWarm: U.warm, uKelpL: U.kelpL });
  return {
    U,
    floor: new ShaderMaterial({ uniforms: { ...water(), uKitchen: { value: zKitchen } }, vertexShader: FLOOR_VERT, fragmentShader: floorFrag(rig), side: FrontSide }),
    tank: new ShaderMaterial({ uniforms: { ...water(), uSee: { value: 0 } }, vertexShader: TANK_VERT, fragmentShader: tankFrag(rig), side: BackSide }),
    hero: new ShaderMaterial({ uniforms: { ...water(), uSee: U.see }, vertexShader: TANK_VERT, fragmentShader: tankFrag(rig), side: BackSide, transparent: true, premultipliedAlpha: true, depthWrite: true }),
    kelp: new ShaderMaterial({ uniforms: water(), vertexShader: kelpVert(rig), fragmentShader: kelpFrag(rig), side: DoubleSide }),
    surf: new ShaderMaterial({ uniforms: water(), vertexShader: SURF_VERT, fragmentShader: surfFrag(rig), side: DoubleSide, transparent: true, depthWrite: false }),
    drop: new ShaderMaterial({ uniforms: { ...base(), uT: U.T }, defines: { DROP: 1 }, vertexShader: ACT_VERT, fragmentShader: actFrag(rig), side: FrontSide }),
    work: new ShaderMaterial({ uniforms: { ...base(), uT: U.T }, defines: { WORK: 1 }, vertexShader: ACT_VERT, fragmentShader: actFrag(rig), side: FrontSide }),
    gantry: new ShaderMaterial({ uniforms: { ...base(), uT: U.T }, vertexShader: ACT_VERT, fragmentShader: actFrag(rig), side: FrontSide }),
    bowl: new ShaderMaterial({ uniforms: base(), vertexShader: BOWL_VERT, fragmentShader: bowlFrag(rig), side: FrontSide }),
    cord: new ShaderMaterial({ uniforms: { ...base(), uPx: G.uPx, uCol: { value: vec3col('#cfc8b0') } }, vertexShader: CORD_VERT, fragmentShader: cordFrag(rig), side: DoubleSide, transparent: true, depthWrite: false }),
  };
}

// many copies of one geometry, each carrying numbers of its own: attrs is { name: [flat list, how many to a copy] }
function copies(base, attrs, n) {
  const g = new InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'aCol', 'aEmit']) if (base.getAttribute(k)) g.setAttribute(k, base.getAttribute(k));
  if (base.index) g.setIndex(base.index);
  for (const k in attrs) g.setAttribute(k, new InstancedBufferAttribute(new Float32Array(attrs[k][0]), attrs[k][1]));
  g.instanceCount = n;
  const m = new Mesh(g, null);
  m.frustumCulled = false;
  return m;
}
// the ribbon a blade is drawn on: x across (-1, 0, 1), y along (0 to 1)
function ribbon(rows) {
  const pos = [], idx = [];
  for (let i = 0; i <= rows; i++) for (const u of [-1, 0, 1]) pos.push(u, i / rows, 0);
  for (let i = 0; i < rows; i++) for (let j = 0; j < 2; j++) { const a = i * 3 + j, b = a + 1, c = a + 3, d = a + 4; idx.push(a, b, c, b, d, c); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}
// a face at one z looking toward -z (face < 0) or +z; a face at one x looking toward -x or +x
function wallZ(g, x0, x1, y0, y1, z, face, col, e = 0) {
  if (face < 0) g.quad([x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], col, e); else g.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], col, e);
}
function wallX(g, z0, z1, y0, y1, x, face, col, e = 0) {
  if (face < 0) g.quad([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], col, e); else g.quad([x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], col, e);
}
// a box given by any two corners
const bx = (g, x0, y0, z0, x1, y1, z1, col, o) => g.box(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1), col, o);
const SIDES = [1, -1];
const isHero = (side, k) => side === HERO.side && k === HERO.k;
const part = (z) => 'n' + Math.max(0, Math.min(3, Math.floor(z / 75)));
const newGantry = () => ({ n0: new Geo({ maxSeg: 8 }), n1: new Geo({ maxSeg: 8 }), n2: new Geo({ maxSeg: 8 }), n3: new Geo({ maxSeg: 8 }) });

// ---------------------------------------------------------------- the nave: floor, walls, roof, the apron room, the gantries
const DOOR = [-3.2, -0.8, 2.8], ROOM = [-4.3, 3.5, -9.4, 3.0];      // the door in the end wall (x, x, its height); the apron room (x, x, its back wall, its ceiling)
function* buildNave(deck, M, zEnd, gan) {
  const clk = deck.clk, wallC = '#2c3232', ribC = '#3c4444', roofC = '#30373a';
  // the floor: one sheet of wet steel from the apron room to the kitchen's threshold
  {
    const xs = [-HW, -HW / 2, 0, HW / 2, HW], zs = [], pos = [], idx = [];
    for (let z = ROOM[2] - 0.2; z < NAVE + 4; z += 31.4) zs.push(z);
    zs.push(NAVE + 4);
    for (const z of zs) for (const x of xs) pos.push(x, 0, z);
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < 4; i++) { const a = j * 5 + i, b = a + 1, c = a + 5, d = a + 6; idx.push(a, c, b, b, c, d); }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    const m = new Mesh(g, M.floor);
    m.frustumCulled = false; m.renderOrder = -1;
    deck.group.add(m);
  }
  for (let i = 0; i < NT; i++) {
    const z0 = i * PITCH, z1 = z0 + PITCH, zt = z0 + PITCH / 2, b = deck.bucket(0, zt, part(zt)), g = b.g;
    // walls and roof
    g.floor(-HW, z0, HW, z1, HY, roofC, { down: true });
    g.box(-HW, HY - 0.3, z0 - 0.14, HW, HY, z0 + 0.14, ribC, { skip: 't' });
    for (const s of SIDES) {
      wallX(g, z0, z1, 0, HY, s * HW, -s, wallC);
      bx(g, s * (HW - 0.22), 0, z0 - 0.16, s * HW, HY, z0 + 0.16, ribC, { skip: 'tb' });
      g.tube([[s * (HW - 0.34), 2.6, z0], [s * (HW - 0.34), 2.6, z1]], 0.15, 6, COPPER);                 // the warm loop, on its way to the kettles
      g.tube([[s * (HW - 0.3), 3.15, z0], [s * (HW - 0.3), 3.15, z1]], 0.08, 5, '#4a5052');
      bx(g, s * (HW - 0.95), 14.9, z0, s * HW, 15.9, z1, '#262c2c', { skip: 'ns' });                       // air
      bx(g, s * EDGE - 0.16, HY - 0.42, z0, s * EDGE + 0.16, HY, z1, ribC, { skip: 'tns' });
      // the gantry: a walk along the nave's edge, one along the wall, and a deck between each tank and the next
      const top = '#4a5252', und = '#343c3c';
      const q = gan[part(zt)];
      bx(q, s * EDGE, GY - 0.2, z0, s * (TX - TR), GY, z1, und, { top, skip: 'ns' });
      bx(q, s * (TX + TR), GY - 0.2, z0, s * HW, GY, z1, und, { top, skip: 'ns' });
      bx(q, s * (TX - TR), GY - 0.2, z0, s * (TX + TR), GY, zt - 1.62, und, { top, skip: 'n' });
      bx(q, s * (TX - TR), GY - 0.2, zt + 1.62, s * (TX + TR), GY, z1, und, { top, skip: 's' });
      bx(g, s * (EDGE - 0.03), GY - 0.66, z0, s * (EDGE + 0.15), GY - 0.2, z1, IRON, { skip: 'ns' });       // its beam along the edge
      bx(g, s * POST - 0.09, 0, z0 - 0.09, s * POST + 0.09, GY - 0.66, z0 + 0.09, IRON, { skip: 'tb' });    // and a post under it between tanks
      bx(g, s * POST - 0.2, 0, z0 - 0.2, s * POST + 0.2, 0.06, z0 + 0.2, '#30383a', { skip: 'b' });
      // the rail, open where each tank's flap hangs out over the nave
      const xr = s * (EDGE + 0.05);
      for (const [a, c] of [[z0, zt - 0.55], [zt + 0.55, z1]]) {
        bx(q, xr - 0.03, GY + 1.02, a, xr + 0.03, GY + 1.08, c, RAIL, { skip: 'ns' });
        bx(q, xr - 0.02, GY + 0.5, a, xr + 0.02, GY + 0.54, c, RAIL2, { skip: 'ns' });
      }
      for (const zp of [z0, zt - 2.2, zt - 0.55, zt + 0.55, zt + 2.2]) bx(q, xr - 0.03, GY, zp - 0.03, xr + 0.03, GY + 1.02, zp + 0.03, RAIL, { skip: 'tb' });
    }
    if (clk.due()) { yield 'kelp: nave'; clk.go(); }
  }
  // the end wall, the door in it, and the apron room behind
  {
    const g = deck.bucket(0, 0, 'room').g, [da, db, dh] = DOOR, [ra, rb, rz, rh] = ROOM, plaster = '#3c3e36', dark = '#2a2e2a';
    wallZ(g, -HW, da, 0, HY, 0, 1, wallC); wallZ(g, db, HW, 0, HY, 0, 1, wallC); wallZ(g, da, db, dh, HY, 0, 1, wallC);
    bx(g, da - 0.12, 0, -0.3, da, dh + 0.12, 0.06, IRON, { skip: 'b' }); bx(g, db, 0, -0.3, db + 0.12, dh + 0.12, 0.06, IRON, { skip: 'b' }); bx(g, da, dh, -0.3, db, dh + 0.12, 0.06, IRON);
    wallZ(g, ra, da, 0, rh, -0.3, -1, plaster); wallZ(g, db, rb, 0, rh, -0.3, -1, plaster); wallZ(g, da, db, dh, rh, -0.3, -1, plaster);
    wallZ(g, ra, rb, 0, rh, rz, 1, plaster); wallX(g, rz, -0.3, 0, rh, ra, 1, plaster); wallX(g, rz, -0.3, 0, rh, rb, -1, plaster);
    g.floor(ra, rz, rb, -0.3, rh, dark, { down: true });
    for (const [a, c] of [[ra, da], [db, rb]]) bx(g, a, 0, -0.34, c, 1.0, -0.3, '#3a3a30', { skip: 'bs' });
    // pegs along the wall by the door: gold oilskin aprons, and one peg empty, because the visitors' blue one is out
    bx(g, db + 0.25, 1.86, -0.37, rb - 0.2, 1.93, -0.3, '#5a4a32');
    for (let i = 0; i < 7; i++) {
      const x = db + 0.6 + i * 0.52;
      bx(g, x - 0.02, 1.8, -0.44, x + 0.02, 1.84, -0.3, BRASS);
      if (i === 4) { deck.sign('Visitor', { at: [x, 2.03, -0.31], n: [0, -1], w: 0.34, h: 0.1, style: 'card', font: 'cond' }); continue; }
      const c = shade(OILSKIN, 0.62 + 0.3 * ((i * 7) % 5) / 5), c2 = shade(c, 0.8), lean = ((i * 5) % 3 - 1) * 0.02, z = -0.37 - 0.01 * (i % 2);
      g.quad([x + 0.13, 1.42, z], [x - 0.13, 1.42, z], [x - 0.1, 1.74, z], [x + 0.1, 1.74, z], c);                                           // the bib
      g.quad([x + 0.27 + lean, 0.72, z - 0.03], [x - 0.27 + lean, 0.72, z - 0.03], [x - 0.15, 1.42, z], [x + 0.15, 1.42, z], c);            // the skirt, in two folds
      g.quad([x + 0.02 + lean, 0.72, z - 0.05], [x - 0.27 + lean, 0.72, z - 0.03], [x - 0.15, 1.42, z], [x, 1.42, z - 0.012], c2);
      for (const sx of [-1, 1]) g.tube([[x + sx * 0.1, 1.74, z], [x, 1.83, -0.4]], 0.008, 3, c2);
      bx(g, x - 0.14, 0.02, -0.58, x - 0.02, 0.36, -0.33, '#1c2224'); bx(g, x + 0.02, 0.02, -0.56, x + 0.14, 0.32, -0.33, '#1c2224');      // and boots under each
    }
    bx(g, -2.3, rh - 0.1, -1.4, -1.7, rh - 0.04, -1.1, '#ffe2b0', { emit: 3 });
    deck.glow([{ p: [-2.0, rh - 0.14, -1.25], color: '#ffd9a0', power: 1.3, size: 0.6 }]);
    deck.lattice({ origin: [-2.0, rh - 0.1, -1.25], spacing: [3, 3], count: [1, 1], color: '#ffd9a0', power: 1.0, reach: 4.2, drop: 3.4 });
    deck.sign(['The Kelp Stacks', 'Deck 8, the Keel'], { at: [(da + db) / 2, dh + 0.1, -0.31], n: [0, -1], w: 1.7, h: 0.4, style: 'plate', font: 'serif', font2: 'cond' });
    deck.sign(['Aprons on.', 'It is wet in there.', 'It has always been wet in there.'], { at: [db + 0.95, 2.45, -0.31], n: [0, -1], w: 1.35, h: 0.62, style: 'paper', font2: 'serif' });
    bx(g, ra, 1.32, -2.05, ra + 0.03, 2.08, -0.45, '#2c3330');
    deck.sign(['Lose an apron: 12 kays.', 'We say keys. So will you.'], { at: [ra + 0.035, 1.7, -1.25], n: [1, 0], w: 1.5, h: 0.66, style: 'chalk', head: false, glow: 0.25 });
  }
  // the far end of the nave above the kitchen's own walls is the kitchen's to draw; close the gantries off here
  for (const s of SIDES) {
    const g = deck.bucket(s * 8, NAVE - 1, 'n3').g, xr = s * (EDGE + 0.05);
    bx(g, xr, GY + 1.02, NAVE - 0.03, s * HW, GY + 1.08, NAVE + 0.03, STEEL2); bx(g, xr, GY + 0.5, NAVE - 0.02, s * HW, GY + 0.54, NAVE + 0.02, STEEL);
    for (let x = EDGE + 0.05; x < HW; x += 1.5) bx(g, s * x - 0.03, GY, NAVE - 0.03, s * x + 0.03, GY + 1.02, NAVE + 0.03, STEEL2, { skip: 'tb' });
    bx(g, s * EDGE, GY - 0.66, NAVE - 0.1, s * HW, GY, NAVE + 0.1, IRON);
  }
  // walls and roof on over the kitchen
  for (let z0 = NAVE; z0 < zEnd - 0.01; z0 += 8) {
    const z1 = Math.min(zEnd, z0 + 8), g = deck.bucket(0, (z0 + z1) / 2, 'k').g;
    g.floor(-HW, z0, HW, z1, HY, roofC, { down: true });
    g.box(-HW, HY - 0.3, z0 - 0.14, HW, HY, z0 + 0.14, ribC, { skip: 't' });
  }
  yield 'kelp: nave';
}

// ---------------------------------------------------------------- the tanks
function* buildTanks(deck, M, rng) {
  const clk = deck.clk, n = 20, dens = deck.density;
  // what is steel about a tank: the plinth it stands on, a hoop every 2.9 m, a collar round its open top. Its front
  // (the proto's -z) is the side toward the nave.
  deck.proto('tank', (g) => {
    g.cyl(0, 0, 0, TR + 0.16, TR + 0.12, PY, n, STEEL, { smooth: true, cap: false });
    g.cyl(0, PY - 0.06, 0, TR + 0.12, TR + 0.03, 0.1, n, IRON, { smooth: true, cap: false });
    for (let y = PY + 2.9; y < 16; y += 2.9) g.cyl(0, y - 0.07, 0, TR + 0.04, TR + 0.04, 0.14, n, IRON, { cap: false, smooth: true });
    g.cyl(0, WY - 0.08, 0, TR + 0.06, TR + 0.06, RIM - WY + 0.08, n, STEEL2, { cap: false, smooth: true });
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), ri = TR - 0.02, ro = TR + 0.06;
      g.quad([c0 * ri, WY - 0.08, s0 * ri], [c1 * ri, WY - 0.08, s1 * ri], [c1 * ri, RIM, s1 * ri], [c0 * ri, RIM, s0 * ri], STEEL);        // the collar's inside
      g.quad([c0 * ri, RIM, s0 * ri], [c1 * ri, RIM, s1 * ri], [c1 * ro, RIM, s1 * ro], [c0 * ro, RIM, s0 * ro], '#566060');                // and its lip
    }
    // on the plinth, toward the nave: a boss for the number and the slate, a valve, a drain
    g.box(-0.52, 0.1, -(TR + 0.2), 0.52, 0.64, -(TR + 0.06), IRON, { skip: 's' });
    g.cyl(0.95, 0.18, -(TR + 0.05), 0.07, 0.07, 0.3, 6, COPPER).cyl(0.95, 0.48, -(TR + 0.05), 0.13, 0.13, 0.03, 8, BRASS, { smooth: false, base: true });
    g.box(-1.2, 0, -(TR + 0.32), -0.8, 0.05, -(TR + 0.02), '#30383a');
  });
  const shell = new Geo(), disc = new Geo();
  shell.cyl(0, PY, 0, TR, TR, WY - PY, 28, '#ffffff', { cap: false, base: true, smooth: false });
  for (let i = 0; i < 24; i++) { const a0 = (i / 24) * TAU, a1 = ((i + 1) / 24) * TAU, r = TR - 0.01; disc.tri([0, WY, 0], [Math.cos(a1) * r, WY, Math.sin(a1) * r], [Math.cos(a0) * r, WY, Math.sin(a0) * r], '#ffffff'); }
  const all = [], hero = [], roots = [], leaves = [], tanks = [], tints = [], hRoots = [], hLeaves = [], hTanks = [], hTints = [];
  for (const side of SIDES) for (let k = 0; k < NT; k++) {
    if (clk.due()) { yield 'kelp: tanks'; clk.go(); }
    const cx = side * TX, cz = tankZ(k), d = dayOf(side, k);
    const row = [cx, cz, side, d], top = kelpTop(d), y0 = PY + 0.1, big = isHero(side, k);
    deck.put('tank', { p: [cx, 0, cz], yaw: side * Math.PI / 2 });
    deck.glow([{ p: [cx - side * (TR + 0.13), 0.57, cz - side * 0.95], color: '#c8f5a8', power: 1.4, size: 0.09 }]);      // its valve's pilot light
    (big ? hero : all).push(...row);
    // its kelp: rooted on the tank's floor, grown to where its day leaves it; where a tank is being cut, some blades
    // are already down to 6 m under the top and the rest trail along the water
    for (let f = 0, nf = big ? 22 : Math.max(8, Math.round(18 * dens)); f < nf; f++) {
      const a = rng() * TAU, rad = big ? rng.f(0.82, 1.2) : rng.f(0.25, 1.15);
      let len = top - y0 + (d === 0 ? rng.f(0.2, 2.8) : -rng.f(0, 1.8));
      if (d === 0 && f % 3 === 0) len = WY - 6 - y0 + rng.f(-0.6, 0.4);
      const c = shade(rng.pick(KELPS), rng.f(0.8, 1.25));
      (big ? hRoots : roots).push(cx + Math.cos(a) * rad, y0, cz + Math.sin(a) * rad, len);
      (big ? hLeaves : leaves).push(rng.f(0.26, 0.52), rng(), big ? rng.f(0.08, 0.15) : rng.f(0.12, 0.3), rng() * TAU);
      (big ? hTanks : tanks).push(cx, cz, side, 0);
      (big ? hTints : tints).push(c[0], c[1], c[2]);
    }
    // air let in at the foot of it, going up in threads
    for (let j = 0, nb = big ? 9 : Math.max(1, Math.round(3 * dens)); j < nb; j++) {
      const a = rng() * TAU, rad = rng.f(0.2, 1.25), v = rng.f(0.3, 0.5), x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad;
      for (let q = 0, nq = big ? 9 : 5; q < nq; q++) deck.glow([{ p: [x + rng.f(-0.04, 0.04), y0 + 0.1, z + rng.f(-0.04, 0.04)], color: '#e6f5c0', power: rng.f(0.5, 1.1), size: rng.f(0.03, 0.065), move: [0, v, 0], loop: (WY - y0 - 0.2) / v, phase: rng() }]);
    }
  }
  yield 'kelp: tanks';
  const add = (mesh, mat, order) => { mesh.material = mat; if (order !== undefined) mesh.renderOrder = order; deck.group.add(mesh); return mesh; };
  const shellG = shell.build(), discG = disc.build();
  const meshes = {
    walls: add(copies(shellG, { aTank: [all, 4] }, all.length / 4), M.tank),
    hero: add(copies(shellG, { aTank: [hero, 4] }, 1), M.hero, 2),
    tops: add(copies(discG, { aTank: [[...all, ...hero], 4] }, NT * 2), M.surf, 3),
    kelp: add(copies(ribbon(28), { aRoot: [roots, 4], aLeaf: [leaves, 4], aTank: [tanks, 4], aTint: [tints, 3] }, roots.length / 4), M.kelp),
    heroKelp: add(copies(ribbon(150), { aRoot: [hRoots, 4], aLeaf: [hLeaves, 4], aTank: [hTanks, 4], aTint: [hTints, 3] }, hRoots.length / 4), M.kelp),
  };
  // the light the glass gives: a lamp to each tank on every other deck of its height, and the glow off its open top
  deck.lattice({ origin: [-TX, 2.5, Z0], spacing: [2 * TX, PITCH], count: [2, NT], storeys: 4, rise: 4, drop: 3.9, above: 2.7, color: '#dcd49a', power: 0.85, reach: 6.5 });
  deck.lattice({ origin: [-TX, 18.3, Z0], spacing: [2 * TX, PITCH], count: [2, NT], drop: 1.3, above: 2.2, color: '#f0d8a0', power: 1.9, reach: 4.0 });
  if (clk.due()) { yield 'kelp: glass'; clk.go(); }
  return meshes;
}

// ---------------------------------------------------------------- people at work
// As kit/folk.js draws them (1.7 m tall, facing +z), with arms, an apron and a hat, because what the hands are doing
// is the point. The apron, its ties and the hat take the copy's colour: gold oilskin on the cutters, cream on the
// cooks, the visitors' blue on one, who has a kerchief of it in place of a hat. 'hook' works a hooked pole down
// into the water; 'cut' has both hands on the table and a knife; 'let' holds a bundle out; 'stir' has a paddle in a
// kettle; 'coil' sets something down with care; 'push' has both hands on a rack.
const SKINS = ['#e3b48e', '#b07b52', '#8a5a3a', '#d9a87c'];
const arm = (g, a, b, r, col) => g.tube([a, b], r, 5, col);
function workerGeo(pose, skin, hat) {
  const g = new Geo(), shirt = '#5e5c50';
  g.tint(0).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#2a2e2e');
  g.cyl(0, 0.82, 0, 0.22, 0.18, 0.62, 6, shirt, { smooth: false });
  g.tint(1).box(-0.17, 0.4, 0.1, 0.17, 1.28, 0.2, '#ffffff', { skip: 'n' });
  g.tint(0).blob(0, 1.6, 0, 0.14, 0, skin, { shadeBottom: 0.8 });
  g.tint(1).box(-0.2, 1.0, -0.19, 0.2, 1.07, 0.11, '#e6e6e6', { skip: 's' }).box(-0.05, 0.8, -0.2, 0.05, 1.0, -0.185, '#dcdcdc').tint(0);
  if (hat) g.tint(1).cyl(0, 1.66, 0, 0.21, 0.14, 0.05, 7, '#f2f2f2', { smooth: false }).cyl(0, 1.7, 0, 0.14, 0.1, 0.09, 7, '#ffffff', { smooth: false }).tint(0);
  else { g.tint(1).at(0, 0, 0, 0, [1, 1, -1]); g.blob(0, 1.66, 0.03, [0.16, 0.115, 0.165], 0, '#ffffff', { shadeBottom: 0.8 }); g.pop(); g.tri([-0.1, 1.6, -0.15], [0.1, 1.6, -0.15], [0, 1.42, -0.21], '#e8e8e8').tri([0.1, 1.6, -0.15], [-0.1, 1.6, -0.15], [0, 1.42, -0.21], '#e8e8e8').tint(0); }
  let hands = [[-0.2, 1.12, 0.5], [0.2, 1.12, 0.5]];
  if (pose === 'hook' || pose === 'stir') {
    const butt = pose === 'hook' ? [0.14, 1.66, -0.16] : [0.12, 1.6, -0.05], tip = pose === 'hook' ? [-0.06, -0.7, 1.52] : [0, 0.85, 1.0];
    const at = (t) => [lerp(butt[0], tip[0], t), lerp(butt[1], tip[1], t), lerp(butt[2], tip[2], t)];
    hands = [at(0.2), at(0.46)];
    g.tube([butt, tip], 0.018, 5, '#a58a5a');
    if (pose === 'hook') g.tube([tip, [tip[0] + 0.1, tip[1] - 0.06, tip[2] + 0.02], [tip[0] + 0.12, tip[1] + 0.06, tip[2] - 0.04]], 0.014, 4, BRASS);
    else g.box(tip[0] - 0.09, tip[1] - 0.2, tip[2] - 0.02, tip[0] + 0.09, tip[1] + 0.04, tip[2] + 0.02, '#a58a5a');
  } else if (pose === 'cut') { hands = [[-0.16, 1.0, 0.42], [0.15, 1.02, 0.44]]; g.box(0.13, 1.0, 0.44, 0.16, 1.04, 0.72, '#c9ccc8'); }
  else if (pose === 'coil') hands = [[-0.1, 1.04, 0.46], [0.12, 1.1, 0.42]];
  else if (pose === 'push') hands = [[-0.24, 1.08, 0.46], [0.24, 1.08, 0.46]];
  else if (pose === 'let') { g.at(0, 1.14, 0.55); bundleShape(g, 0.85); g.pop(); }
  hands.forEach((hd, i) => {
    const s = i ? 1 : -1, sh = [s * 0.22, 1.38, 0.02], el = [s * 0.27, 1.14, 0.16 + 0.1 * (hd[1] > 1.2 ? -1 : 1)];
    arm(g, sh, el, 0.055, shirt); arm(g, el, hd, 0.048, shirt);
    g.blob(hd[0], hd[1], hd[2], 0.05, 0, skin, { shadeBottom: 0.9 });
  });
  return g.build();
}
// a tied bundle of cut kelp, about a metre long, lying along x. (A blob's faces wind inward: it is drawn in a mirror.)
function bundleShape(g, k = 1) {
  const dark = '#4f4c1a', mid = '#77702a', tie = '#c9b98a';
  g.at(0, 0, 0, 0, [k, k, -k]); g.blob(0, 0, 0, [0.44, 0.17, 0.2], 1, mid, { lump: 0.18, seed: 4, shadeBottom: 0.6 }); g.pop();
  for (const x of [-0.2, 0.2]) g.box((x - 0.016) * k, -0.18 * k, -0.21 * k, (x + 0.016) * k, 0.18 * k, 0.21 * k, tie);
  for (const [x, dz] of [[-0.42, 0.06], [0.42, -0.05]]) {
    const a = [x * k, -0.02 * k, (dz - 0.14) * k], b = [x * 1.75 * k, -0.12 * k, dz * k], c = [x * 1.65 * k, 0.03 * k, (dz + 0.17) * k], d = [x * k, 0.05 * k, (dz + 0.1) * k];
    g.quad(a, b, c, d, dark); g.quad(d, c, b, a, dark);
  }
}
// stand a list of workers: [{ pose, skin (0 to 3), hat, p, yaw, color, scale }]. A generator: one kind of them to a step
const _m4 = new Matrix4(), _qt = new Quaternion(), _p3 = new Vector3(), _s3 = new Vector3(), _up = new Vector3(0, 1, 0), _col = new Color();
function* standWorkers(deck, M, list) {
  const groups = new Map(), out = [];
  for (const w of list) { const key = w.pose + '|' + (w.skin || 0) + '|' + (w.hat === false ? 0 : 1); let a = groups.get(key); if (!a) groups.set(key, a = []); a.push(w); }
  for (const [key, items] of groups) {
    const [pose, skin, hat] = key.split('|'), mesh = new InstancedMesh(workerGeo(pose, SKINS[+skin], hat === '1'), M.work, items.length), act = new Float32Array(items.length * 4);
    items.forEach((w, i) => {
      const sc = w.scale || 1;
      _m4.compose(_p3.set(w.p[0], w.p[1], w.p[2]), _qt.setFromAxisAngle(_up, w.yaw || 0), _s3.set(sc, sc, sc));
      mesh.setMatrixAt(i, _m4);
      mesh.setColorAt(i, _col.set(w.color || OILSKIN));
      act[i * 4] = Math.abs(i * 0.618 + w.p[2] * 0.37 + w.p[0] * 0.11) % 1;
    });
    mesh.geometry.setAttribute('aAct', new InstancedBufferAttribute(act, 4));
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    deck.group.add(mesh); out.push(mesh);
    yield 'kelp: hands';
  }
  return out;
}

// ---------------------------------------------------------------- the morning cut
// Every tank has its number, its slate, a hoist over its rim, a flap out over the nave with a plumb cord hung from
// it, and the cross and the ring on the floor. A tank that is being cut this morning has people at it as well: one
// working a hook down into the water, one cutting at a table, sometimes one at the flap; a length of kelp coming up
// over the hoist's roller; a bin on its ring; and a bundle on its way down, again and again.
function* buildCut(deck, M, rng, gan) {
  const clk = deck.clk, cords = new Cords(), work = [], drops = [], H = { roots: [], leaves: [], tanks: [], tints: [] };
  const binShape = (g, full) => {
    const w = 0.62, h = 0.74, steel = '#46504c', inner = '#161a18';
    g.tint(0).box(-w, 0.12, -w, w, h, w, steel, { skip: 't' });
    g.tint(1).box(-w - 0.006, 0.5, -w - 0.006, w + 0.006, 0.6, w + 0.006, '#ffffff', { skip: 'tb' }).tint(0);
    for (const [a, b, c, d] of [[[-w, h, -w], [w, h, -w], [w, h, w], [-w, h, w]]]) { g.box(a[0], h - 0.04, a[2] - 0.03, b[0], h, a[2] + 0.03, '#69736f'); g.box(d[0], h - 0.04, d[2] - 0.03, c[0], h, d[2] + 0.03, '#69736f'); g.box(a[0] - 0.03, h - 0.04, a[2], a[0] + 0.03, h, d[2], '#69736f'); g.box(b[0] - 0.03, h - 0.04, b[2], b[0] + 0.03, h, c[2], '#69736f'); }
    const q = w - 0.04, y0 = 0.26;
    g.floor(-q, -q, q, q, y0, inner);
    wallZ(g, -q, q, y0, h, -q, 1, inner); wallZ(g, -q, q, y0, h, q, -1, inner); wallX(g, -q, q, y0, h, -q, 1, inner); wallX(g, -q, q, y0, h, q, -1, inner);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.5 - 0.05, 0, sz * 0.5 - 0.07, sx * 0.5 + 0.05, 0.14, sz * 0.5 + 0.07, '#1c1e1e');
    g.box(-0.3, 0.86, w + 0.02, 0.3, 0.9, w + 0.06, '#69736f').box(-0.3, 0.6, w, -0.26, 0.9, w + 0.06, '#69736f').box(0.26, 0.6, w, 0.3, 0.9, w + 0.06, '#69736f');      // a handle to push it by
    if (!full) return;
    g.at(0, 0, 0, 0, [1, 1, -1]); g.blob(0, 0.33, 0, [0.52, 0.17, 0.52], 1, '#57521e', { lump: 0.22, seed: 3, shadeBottom: 0.7 }); g.pop();
    for (const [x, z, a] of [[-0.18, 0.12, 0.5], [0.2, -0.16, 2.1], [0.02, 0.26, 1.2]]) { g.at(x, 0.46, z, a); bundleShape(g, 0.9); g.pop(); }
  };
  deck.proto('bin', (g) => binShape(g, true));
  deck.proto('binGo', (g) => binShape(g, true));
  deck.proto('binBack', (g) => binShape(g, false));
  deck.proto('bob', (g) => { g.cyl(0, 0, 0, 0.004, 0.05, 0.16, 8, BRASS, { cap: false }).cyl(0, 0.16, 0, 0.05, 0.016, 0.06, 8, BRASS); });
  const ink = '#c9a23a', floorC = '#14181a';
  for (const s of SIDES) for (let k = 0; k < NT; k++) {
    if (clk.due()) { yield 'kelp: stations'; clk.go(); }
    const cx = s * TX, zt = tankZ(k), d = dayOf(s, k);
    const g = gan[part(zt)], name = tankName(s, k), xf = s * DXC, xr = s * (EDGE + 0.05), hero = isHero(s, k);
    // its number on the plinth and up on the gantry's beam, and the slate that says when it was last cut
    deck.sign(name, { at: [cx - s * (TR + 0.21), 0.47, zt - s * 0.27], n: [-s, 0], w: 0.5, h: 0.2, style: 'plate', font: 'cond' });
    deck.sign(['Last cut', DAYS[d]], { at: [cx - s * (TR + 0.21), 0.37, zt + s * 0.25], n: [-s, 0], w: 0.5, h: 0.36, style: 'chalk' });
    deck.sign(name, { at: [s * (EDGE - 0.036), GY - 0.43, zt], n: [-s, 0], w: 0.8, h: 0.32, style: 'plate', font: 'cond' });
    deck.sign('PLUMB', { at: [xf + 0.78, 0.007, zt + 0.3], up: 0, w: 0.98, h: 0.3, style: 'card', font: 'cond', ground: floorC, ink, track: 0.22 });
    deck.sign('IT LANDS HERE', { at: [xf - DRIFT, 0.007, zt - 1.42], up: 0, w: 1.9, h: 0.3, style: 'card', font: 'cond', ground: floorC, ink, track: 0.16 });
    // the flap: a tray hung out past the rail, which tips; and the cord from its corner down to the cross
    bx(g, xr, Y_LET - 0.22, zt - 0.32, s * (DXC - 0.42), Y_LET - 0.18, zt + 0.32, '#59605c');
    for (const dz of [-0.33, 0.33]) { bx(g, xr, Y_LET - 0.18, zt + dz - 0.015, s * (DXC - 0.42), Y_LET - 0.1, zt + dz + 0.015, '#59605c'); g.tube([[xr, GY + 1.02, zt + (dz < 0 ? -0.55 : 0.55)], [s * (DXC - 0.3), Y_LET - 0.2, zt + dz]], 0.018, 4, STEEL2); }
    cords.add([xf, Y_LET - 0.22, zt + 0.3], [xf, 0.42, zt + 0.3], 0.007);
    deck.put('bob', { p: [xf, 0.2, zt + 0.3], yaw: 0 });
    // the hoist: two posts on the walk by the rim, an arm from each out over the water, a roller between
    const xp = cx - s * (TR + 0.24), xo = cx - s * 0.9, yr = GY + 1.95;
    for (const dz of [-0.8, 0.8]) { bx(g, xp - 0.04, GY, zt + dz - 0.04, xp + 0.04, yr, zt + dz + 0.04, STEEL2, { skip: 'b' }); g.tube([[xp, yr - 0.03, zt + dz], [xo, yr, zt + dz]], 0.03, 4, STEEL2); }
    g.tube([[xo, yr, zt - 0.8], [xo, yr, zt + 0.8]], 0.05, 6, BRASS);
    if (d !== 0) continue;
    // ---- a tank that is being cut. Its table stands along the rail with the cutter behind it, facing out over
    // the nave; the one on the hook stands at the rim; the one at the flap lets the bundles go
    const guest = s === GUEST.side && k === GUEST.k, timed = LANDS.find((q) => q[0] === s && q[1] === k);
    if (!hero) { H.roots.push(xo + s * 0.03, yr + 0.04, zt, 2.75); H.leaves.push(0.42, rng(), 0, Math.PI / 2); H.tanks.push(cx, zt, s, 1); const kc = shade(rng.pick(['#5c5a22', '#66602a', '#52561f']), 0.8); H.tints.push(kc[0], kc[1], kc[2]); }
    const wet = '#3d3c16', wet2 = '#4a471a';
    // the table, the cut lengths on it, and the length on its way to it from the roller, over the walk
    const x0 = s * 5.36, x1 = s * 6.0, ta = zt - 3.4, tb = zt - 1.3, ty = GY + 0.9, xm = (x0 + x1) / 2;
    bx(g, x0, ty - 0.05, ta, x1, ty, tb, '#6a6048', { top: '#857a5c' });
    for (const tz of [ta, tb]) { bx(g, x0 + s * 0.02, GY, tz - 0.03, x0 + s * 0.08, ty - 0.05, tz + 0.03, STEEL2, { skip: 'tb' }); bx(g, x1 - s * 0.08, GY, tz - 0.03, x1 - s * 0.02, ty - 0.05, tz + 0.03, STEEL2, { skip: 'tb' }); }
    if (!hero) for (const [a, c] of [[[xo, yr + 0.05, zt - 0.15], [xm, ty + 0.35, tb + 0.1]], [[xm, ty + 0.35, tb + 0.1], [xm, ty + 0.02, tb - 0.35]]]) { g.quad([a[0], a[1], a[2] - 0.2], [a[0], a[1], a[2] + 0.2], [c[0], c[1], c[2] + 0.2], [c[0], c[1], c[2] - 0.2], wet2); g.quad([c[0], c[1], c[2] - 0.2], [c[0], c[1], c[2] + 0.2], [a[0], a[1], a[2] + 0.2], [a[0], a[1], a[2] - 0.2], wet); }
    if (guest) {
      // the visiting cook's table: short ends, torn across, and more of them round her feet; and the slate the
      // cutters have hung on the rail beside her, lettered on both sides
      for (let i = 0; i < 8; i++) { const z = ta + 0.15 + i * 0.2, l = rng.f(0.1, 0.22), a = rng.f(-0.5, 0.5); g.at(xm + rng.f(-0.1, 0.1), ty + 0.012 + i * 0.002, z, a); g.quad([-0.2, 0, -l], [-0.17, 0, l * 0.6], [0.02, 0, l], [0.21, 0, l * 0.4], i % 2 ? wet : wet2).quad([0.21, 0, l * 0.4], [0.16, 0, -l * 0.7], [-0.04, 0, -l * 0.4], [-0.2, 0, -l], i % 2 ? wet : wet2); g.pop(); }
      for (let i = 0; i < 8; i++) { const sx = s * 6.5 + rng.f(-0.4, 0.4), sz = zt - 2.3 + rng.f(-1.1, 1.1); bx(g, sx, GY + 0.004, sz, sx + rng.f(0.1, 0.26), GY + 0.012, sz + rng.f(0.08, 0.3), i % 2 ? wet : wet2); }
      const sz0 = zt - 4.3;
      for (const dz of [-0.72, 0.72]) bx(g, xr - 0.03, GY + 1.08, sz0 + dz - 0.03, xr + 0.03, GY + 2.14, sz0 + dz + 0.03, RAIL, { skip: 'b' });
      bx(g, xr - 0.02, GY + 1.2, sz0 - 0.74, xr + 0.02, GY + 2.12, sz0 + 0.74, '#2c3330');
      deck.sign(['Visiting cook', 'Nine mornings.', 'Still tearing it.'], { at: [xr + s * 0.025, GY + 1.66, sz0], n: [s, 0], w: 1.4, h: 0.88, style: 'chalk', glow: 0.55, both: 0.05 });
    } else {
      for (let i = 0; i < 3; i++) g.box(xm - 0.22, ty + 0.001 + i * 0.035, ta + 0.1, xm + 0.22, ty + 0.035 + i * 0.035, ta + 1.2 - i * 0.1, i % 2 ? wet : wet2);
      g.at(xm, ty + 0.17, tb - 0.9, Math.PI / 2); bundleShape(g, 0.9); g.pop();
    }
    // a lamp to cut by, on the rail (the shader that lights the gantry knows where: 0.59 m along from the flap)
    bx(g, xr - 0.02, GY + 1.08, zt + 0.57, xr + 0.02, GY + 1.85, zt + 0.61, RAIL, { skip: 'b' });
    bx(g, xr - s * 0.02, GY + 1.78, zt + 0.5, xr + s * 0.3, GY + 1.84, zt + 0.68, hero ? '#6a6658' : '#ffe6b8', { emit: hero ? 0 : 4 });
    if (!hero) deck.glow([{ p: [xr + s * 0.14, GY + 1.74, zt + 0.59], color: WARM, power: 1.5, size: 0.5 }]);
    // who is at it. The visiting cook is in the visitors' blue, kerchief and apron; the cutter teaching her is at
    // the flap with a bundle tied as it should be. S 21 is done for the morning: its lamp is out and nobody is there
    const face = s * Math.PI / 2;
    if (guest) work.push({ pose: 'cut', skin: 3, hat: false, color: VISITOR, p: [s * 6.38, GY, zt - 2.2], yaw: -face });
    else if (!hero) work.push({ pose: 'cut', skin: rng.i(0, 2), p: [s * 6.38, GY, zt - rng.f(1.9, 2.9)], yaw: -face + rng.f(-0.1, 0.1) });
    deck.put('bin', { p: [xf - DRIFT, 0, zt], yaw: rng.f(-0.12, 0.12), color: rng.pick(['#c9a23a', '#8a9a5a', '#b8b0a0']) });
    if (hero) continue;
    work.push({ pose: 'hook', skin: rng.i(0, 2), p: [cx - s * (TR + 0.62), GY, zt + (guest ? 1.0 : rng.f(-0.25, 0.45))], yaw: face + rng.f(-0.12, 0.12) });
    if (guest || timed || rng() < 0.6) work.push({ pose: 'let', skin: guest ? 1 : rng.i(0, 2), p: [s * 5.95, GY, zt + (guest ? 0.1 : rng.f(-0.1, 0.25))], yaw: -face + (guest ? 0 : rng.f(-0.2, 0.2)) });
    else deck.people([{ p: [s * rng.f(6.3, 6.9), GY, zt + rng.f(1.6, 3.0)], walk: rng.f(0.3, 0.5), color: OILSKIN }]);
    // its bin, on the ring; and the bundle that is on its way to it. A tank's round takes 8 to 11 seconds
    const P = 8 + 3 * rng();
    drops.push(xf, zt, P, timed ? (((T_LET + T_LAND - timed[2]) % P) + P) % P : rng() * P);
  }
  yield 'kelp: stations';
  const cm = cords.mesh(M.cord); deck.group.add(cm);
  const bg = new Geo(); bundleShape(bg);
  const dm = copies(bg.build(), { aAct: [drops, 4] }, drops.length / 4); dm.material = M.drop; deck.group.add(dm);
  const hm = copies(ribbon(12), { aRoot: [H.roots, 4], aLeaf: [H.leaves, 4], aTank: [H.tanks, 4], aTint: [H.tints, 3] }, H.roots.length / 4); hm.material = M.kelp; deck.group.add(hm);
  yield 'kelp: cords';
  const meshes = [cm, dm, hm, ...(yield* standWorkers(deck, M, work))];
  yield 'kelp: cutters';
  // by the first bin the flight comes to: a word about the bins, on a slate behind it; and the cutters' rules, on a
  // board up between the next two tanks, turned to face the door
  {
    const g = deck.bucket(-6.6, 13, 'n0').g, zs = 12.65;
    for (const px of [-7.0, -4.72]) bx(g, px - 0.03, 0, zs, px + 0.03, 2.3, zs + 0.06, IRON, { skip: 'b' });
    bx(g, -7.03, 1.25, zs + 0.01, -4.69, 2.29, zs + 0.05, '#2c3330');
    deck.sign(['The bins are not crooked.', 'The drum turns.'], { at: [-5.86, 1.77, zs], n: [0, -1], w: 2.26, h: 0.98, style: 'chalk', head: false, glow: 0.2 });
    const C = [-8.2, 4.3, 15.0], n = [0.439, -0.898], r = [n[1], -n[0]], w = 3.3, h = 2.3;
    const P = (a, y, back) => [C[0] + r[0] * a - n[0] * back, y, C[2] + r[1] * a - n[1] * back];
    for (const sd of [-1, 1]) { const q = P(sd * (w / 2 + 0.06), 0, 0.06); bx(g, q[0] - 0.05, 0, q[2] - 0.05, q[0] + 0.05, C[1] + h / 2 + 0.06, q[2] + 0.05, IRON, { skip: 'b' }); }
    const a0 = P(-w / 2 - 0.05, C[1] - h / 2 - 0.05, 0.03), a1 = P(w / 2 + 0.05, C[1] - h / 2 - 0.05, 0.03), a2 = P(w / 2 + 0.05, C[1] + h / 2 + 0.05, 0.03), a3 = P(-w / 2 - 0.05, C[1] + h / 2 + 0.05, 0.03);
    g.quad(a0, a1, a2, a3, '#211a10'); g.quad(a3, a2, a1, a0, '#211a10');
    deck.sign(['Cutters', 'One length a tank.', 'Look down first.', 'It lands 1.3 m anti.', 'Nobody stands in a ring.'], { at: C, n, w, h, style: 'board', font: 'serif', font2: 'serif', ground: '#211a10', ink: '#e7c27a', glow: 0.3 });
    for (const s of SIDES) for (let z = 30; z < NAVE; z += 60) deck.sign(s > 0 ? 'Spinward' : 'Anti', { at: [s * (EDGE - 0.036), GY - 0.43, z], n: [-s, 0], w: s > 0 ? 2.3 : 1.3, h: 0.34, style: 'card', font: 'cond', ground: IRON, ink, track: 0.3 });
  }
  // floor robots, which are appliances, pushing the water about: each crosses the nave between two tanks and comes
  // round again. They keep the flight's clock: the first crosses its way as it comes out of the door
  [[1, 0.9545], [3, 0.4], [6, 0.1], [10, 0.62], [15, 0.3], [21, 0.8], [28, 0.5], [34, 0.15]].forEach(([k, ph], i) => {
    const d = i % 2 ? -1 : 1;
    deck.put('robot', { p: [-4.4 * d, 0, k * PITCH], yaw: -d * Math.PI / 2, drift: [0.4 * d, 0, 0, 22], phase: ph, color: '#d9d4c8' });
  });
  // bins on their way to the kettles, pushed; and empty ones coming back
  for (const [x, v, kind, phases] of [[-1.9, 1.25, 'binGo', [0.14, 0.31, 0.52, 0.7]], [0.7, -1.3, 'binBack', [0.2, 0.45, 0.72]]]) for (const ph of phases) {
    const len = NAVE + 4, loop = len / Math.abs(v), z0 = v > 0 ? 2 : NAVE + 6, drift = [0, 0, v, loop], yaw = v > 0 ? Math.PI : 0;
    deck.put(kind, { p: [x, 0, z0], yaw, drift, phase: ph, color: '#c9a23a' });
    deck.pacers.push({ p: [x, 0, z0 - Math.sign(v) * 1.05], yaw: v > 0 ? 0 : Math.PI, drift, phase: ph, color: OILSKIN, skin: rng.pick(SKINS), scale: rng.f(0.95, 1.05) });
  }
  const hands = [];
  for (let i = 0, n = Math.round(16 * deck.density); i < n; i++) { const z = rng.f(20, NAVE - 10), x = rng.pick([-4.4, -3.6, 1.4, 1.9]) + rng.f(-0.3, 0.3); if (deck.clear(x, 1.2, z, 3)) hands.push({ p: [x, 0, z], walk: rng() < 0.5 ? rng.f(0.5, 1.2) : 0, color: rng() < 0.7 ? OILSKIN : '#8a8a78' }); }
  deck.people(hands);
  if (clk.due()) { yield 'kelp: floor hands'; clk.go(); }
  return meshes;
}

// ---------------------------------------------------------------- the breakfast kitchen
// The nave's last forty metres. Tiles underfoot in place of wet steel, lamps hung low from the roof, six kettles in
// two rows on the warm loop, and the pass: a long counter where the bowls stand in hundreds, a noodle coiled in each
// as far as the cooks have got, lids on the furthest. Racks of covered bowls go from its end into the cabs.
const KZ = NAVE + 4;                                       // where the steel stops and the tiles begin
const KETTLE = { x: 5.6, z: [307.2, 311.8, 316.4], r: 0.8, rim: 1.15 };
const PASS = { x0: -2.65, x1: 0.15, z0: 320.5, z1: 335.5, y: 0.92 };
const BOWL_PITCH = 0.26, NOODLE_R = 0.0695;
// the bowls do not match: sixty years of them, in whatever glaze the potters of the day had
const CREAMS = ['#8f7d5a', '#6f7f70', '#a08c64', '#5f6c6c', '#b8aa88', '#7a6a50', '#94866a', '#76826c'];

// A bowl, and the one noodle coiled in it. The coil is drawn by the shader on a disc a little under the rim, so it
// is as sharp from a hand's width as it is calm from across the room: a spiral of eight turns where there is room
// to see them, and a pale round where there is not. aBowl is (0 bare or 1 with its noodle, which way it winds).
const BOWL_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit; attribute vec2 aBowl;
${BEND_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vL; varying vec2 vBowl;
void main() {
  vec3 p = position, n = normal;
  vL = vec3(p.xz, aEmit); vBowl = aBowl;
  if (aEmit > 0.5) p.xz *= aBowl.x;
  p = (instanceMatrix * vec4(p, 1.0)).xyz; n = normalize(mat3(instanceMatrix) * n);
  vF = p; vFN = n;
  kBend(p, n);
  vW = p; vN = n;
  vec3 c = aCol.rgb;
  #ifdef USE_INSTANCING_COLOR
    c = mix(c, c * instanceColor, aCol.a);
  #endif
  vCol = c;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const bowlFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vL; varying vec2 vBowl;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN), col = vCol;
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  if (vL.z > 0.5) {
    float r = length(vL.xy) / ${fx(NOODLE_R)}, th = atan(vL.y, vL.x) * vBowl.y;
    float ph = r * 8.4 - th / 6.2832, fw = fwidth(r * 8.4);
    float x = abs(fract(ph) - 0.5) * 2.0, body = sqrt(max(1.0 - x * x, 0.0));
    float on = step(0.7, ph) * step(ph, 7.75);                        // from its inner end to its outer
    vec3 pale = vec3(0.74, 0.65, 0.46), gap = vCol * 0.42;
    vec3 fine = mix(gap, pale * (0.3 + 0.7 * body * body), smoothstep(1.0, 0.72, x) * on);
    vec3 far = mix(gap, pale * 0.7, 0.8 * step(0.09, r) * step(r, 0.93));
    col = mix(fine, far, smoothstep(0.22, 0.6, fw));
  }
  gl_FragColor = vec4(kAir(col * kLight(vW, N, vF, FN), vW), 1.0);
}`;
function bowlGeo() {
  const g = new Geo(), n = 10;
  g.tint(1);
  g.lathe(0, 0, 0, [[0.036, 0], [0.042, 0.01], [0.074, 0.042], [0.088, 0.072]], n, '#ffffff');                // outside
  g.lathe(0, 0, 0, [[0.088, 0.072], [0.081, 0.072]], n, '#f6f6f6');                                           // the rim
  g.lathe(0, 0, 0, [[0.081, 0.072], [0.066, 0.04], [0.034, 0.014], [0, 0.014]], n, '#ececec');                // inside
  g.tint(0);
  for (let i = 0; i < n; i++) { const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, r = NOODLE_R; g.tri([0, 0.048, 0], [Math.cos(a1) * r, 0.048, Math.sin(a1) * r], [Math.cos(a0) * r, 0.048, Math.sin(a0) * r], '#ffffff', 1); }
  return g.build();
}
// A kettle: copper, 1.6 m across, half a ball below a short wall, on the trunnions it tips by, its lid hinged at the
// back and standing open. Its front (the proto's -z) is the side the aisle sees. Six of them hold 540 litres each
// when half full, which is 900 bowls of six tenths of a litre.
function kettleShape(g) {
  const R = KETTLE.r, rim = KETTLE.rim, cu = '#b06a3a', cu2 = '#bf7a44', tin = '#c9c2ae', iron = '#3a3a36';
  g.lathe(0, 0, 0, [[0.0, rim - 0.86], [0.34, rim - 0.82], [0.6, rim - 0.64], [0.75, rim - 0.4], [R, rim - 0.12], [R, rim]], 16, (k) => (k % 2 ? cu : cu2));
  g.lathe(0, 0, 0, [[R + 0.04, rim - 0.03], [R + 0.04, rim + 0.03]], 16, BRASS);
  g.lathe(0, 0, 0, [[R + 0.04, rim + 0.03], [R - 0.04, rim + 0.03]], 16, '#c9a45a');
  g.lathe(0, 0, 0, [[R - 0.04, rim + 0.03], [R - 0.04, rim - 0.22]], 16, tin);
  for (let i = 0; i < 16; i++) { const a0 = (i / 16) * TAU, a1 = ((i + 1) / 16) * TAU, r = R - 0.04; g.tri([0, rim - 0.22, 0], [Math.cos(a1) * r, rim - 0.22, Math.sin(a1) * r], [Math.cos(a0) * r, rim - 0.22, Math.sin(a0) * r], '#6a4c18', 0.3); }
  for (const sx of [-1, 1]) {
    const x = sx * (R + 0.14);
    g.tube([[x, 0, -0.42], [x, rim - 0.3, 0]], 0.035, 5, iron); g.tube([[x, 0, 0.42], [x, rim - 0.3, 0]], 0.035, 5, iron);
    bx(g, sx * R, rim - 0.37, -0.07, x + sx * 0.05, rim - 0.23, 0.07, BRASS);
    g.box(x - 0.06, 0, -0.5, x + 0.06, 0.04, 0.5, iron);
  }
  g.tube([[0, rim - 0.86, 0], [0, 0.16, 0], [0, 0.16, 1.15]], 0.06, 6, COPPER);                             // the loop comes in underneath, at the back
  g.cyl(0, 0.3, 0.7, 0.11, 0.11, 0.03, 8, BRASS, { smooth: false, base: true });
  g.at(0, rim + 0.03, R + 0.02); g.rot('x', 1.22);
  g.lathe(0, 0, -R, [[R + 0.03, 0], [0.62, 0.15], [0.3, 0.25], [0, 0.28]], 16, cu);
  g.lathe(0, 0, -R, [[0, 0.27], [0.3, 0.24], [0.62, 0.14], [R + 0.02, -0.01]], 16, tin);
  g.pop(); g.pop();
}
// A rack on castors: eight shelves of eighteen covered bowls, a hundred and forty-four, pushed end on
function rackShape(g) {
  const w = 0.31, d = 0.6, steel = '#8a8c86';
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.box(sx * w - 0.015, 0.1, sz * d - 0.015, sx * w + 0.015, 1.76, sz * d + 0.015, steel, { skip: 'b' }); g.cyl(sx * w, 0, sz * d, 0.04, 0.04, 0.1, 6, '#26262a', { smooth: false }); }
  g.box(-w, 1.76, -d, w, 1.78, d, steel);
  g.tube([[-w, 1.1, -d - 0.07], [w, 1.1, -d - 0.07]], 0.014, 4, steel);
  for (let k = 0; k < 8; k++) {
    const y = 0.2 + k * 0.195;
    g.tint(0).box(-w, y - 0.012, -d, w, y, d, '#a6a8a0', { skip: 'b' });
    for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) {
      const x = (i - 1) * 0.2, z = (j - 2.5) * 0.2;
      g.tint(1).cyl(x, y, z, 0.05, 0.086, 0.062, 6, '#ffffff', { smooth: false, cap: false });
      g.tint(0.7).cyl(x, y + 0.062, z, 0.09, 0.0, 0.05, 6, '#f0f0f0', { smooth: false });
    }
  }
  g.tint(0);
}
const APRON = '#e9dfc8';                                    // the cooks' aprons: cream, where the cutters' are gold
// a slate on a stand, facing back down the nave: its middle is at (x, 1.5, z)
function slate(deck, g, x, z, lines, w = 1.8, h = 1.25) {
  for (const sx of [-1, 1]) bx(g, x + sx * (w / 2 + 0.03) - 0.03, 0, z, x + sx * (w / 2 + 0.03) + 0.03, 1.5 + h / 2 + 0.04, z + 0.06, '#4a3820', { skip: 'b' });
  bx(g, x - w / 2 - 0.03, 1.5 - h / 2 - 0.03, z + 0.01, x + w / 2 + 0.03, 1.5 + h / 2 + 0.03, z + 0.05, '#2c3330');
  deck.sign(lines, { at: [x, 1.5, z], n: [0, -1], w, h, style: 'chalk' });
}
function* buildKitchen(deck, M, rng, ZW) {
  const clk = deck.clk, b = deck.bucket(0, 320, 'k'), g = b.g, dg = deck.bucket(0, 320, 'km').g, dc = deck.bucket(0, 320, 'km').c;
  const tile = '#8c7650', cream = '#c2a468', dark = '#2c3232', steam = [], work = [];
  // ---- the room: tiles, walls, the wall over the cab doors
  b.f.tint(1).floor(-HW, KZ, HW, ZW, 0, tile, { emit: 0.85 }).tint(0);
  bx(g, -HW, 0, KZ - 0.06, HW, 0.012, KZ + 0.06, BRASS, { skip: 'b' });
  for (const s of SIDES) {
    wallX(g, NAVE, ZW, 0, 4.4, s * HW, -s, cream); wallX(g, NAVE, ZW, 4.4, HY, s * HW, -s, dark);
    bx(g, s * (HW - 0.05), 4.4, NAVE, s * HW, 4.52, ZW, BRASS, { skip: 'ns' });
    bx(g, s * (HW - 0.03), 0, NAVE, s * HW, 1.0, ZW, '#6a4e26', { skip: 'nsb' });
    g.tube([[s * (HW - 0.34), 2.6, NAVE], [s * (HW - 0.34), 2.6, KETTLE.z[2]]], 0.15, 6, COPPER);
  }
  wallZ(g, -HW, HW, 3.2, 9.2, ZW, -1, '#7a6238'); wallZ(g, -HW, HW, 9.2, HY, ZW, -1, dark);
  bx(g, -HW, 9.2, ZW - 0.06, HW, 9.36, ZW, BRASS, { skip: 'we' });
  yield 'kelp: kitchen walls';
  // ---- lamps: brass shades hung low on rods from the roof, four rows of six
  const LX = [-9.5, -3.17, 3.17, 9.5], LY = 6.2;
  for (const lx of LX) for (let j = 0; j < 6; j++) {
    const lz = 306 + j * 6.2;
    g.box(lx - 0.02, LY + 0.3, lz - 0.02, lx + 0.02, HY, lz + 0.02, '#3a352c', { skip: 'tb' });
    g.cyl(lx, LY, lz, 0.5, 0.12, 0.3, 10, BRASS, { smooth: false });
    g.cyl(lx, LY - 0.012, lz, 0.44, 0.44, 0.02, 10, '#fff0d0', { emit: 3.2, base: true, cap: false, smooth: false });
    deck.glow([{ p: [lx, LY - 0.06, lz], color: '#ffd9a0', power: 1.5, size: 1.0 }]);
  }
  deck.lattice({ origin: [LX[0], LY, 306], spacing: [6.33, 6.2], count: [4, 6], color: '#ffd29a', power: 1.05, reach: 7, drop: 7.4, above: 1.5 });
  deck.zone({ min: [-HW, -0.5, NAVE + 3], max: [HW, 12, ZW + 0.5], soft: 3, color: '#ffcf8a', power: 0.16, side: 0.9, under: 0.5 });
  yield 'kelp: kitchen lamps';
  // ---- the kettles: 1 to 3 on the spinward side, steeping at sixty degrees with the kelp still in; 4 to 6
  // finishing on their elements. A branch of the warm loop comes across to each from the main along the wall
  deck.proto('kettle', kettleShape);
  deck.proto('element', (q) => { for (let i = 0; i < 12; i++) { const a0 = (i / 12) * TAU, a1 = ((i + 1) / 12) * TAU; q.tube([[Math.cos(a0) * 0.42, 0.2, Math.sin(a0) * 0.42], [Math.cos(a1) * 0.42, 0.2, Math.sin(a1) * 0.42]], 0.025, 4, '#ffb04a', { emit: 4 }); } });
  let kn = 0;
  for (const s of SIDES) for (let i = 0; i < 3; i++) {
    const kz = KETTLE.z[i], x = s * KETTLE.x, rim = KETTLE.rim;
    kn++;
    deck.put('kettle', { p: [x, 0, kz], yaw: s * Math.PI / 2 });
    g.tube([[s * (HW - 0.34), 2.6, kz], [s * (KETTLE.x + 1.17), 2.6, kz], [s * (KETTLE.x + 1.17), 0.18, kz]], 0.06, 6, COPPER);
    bx(dg, x - s * 1.06, 0, kz + 0.72, x - s * 1.03, 0.68, kz + 0.78, '#3a3a36', { skip: 'b' });
    deck.sign(String(kn), { at: [x - s * 1.065, 0.52, kz + 0.75], n: [-s, 0], w: 0.26, h: 0.26, style: 'plate', font: 'cond' });
    if (s < 0) { deck.put('element', { p: [x, 0, kz], yaw: 0 }); deck.glow([{ p: [x, 0.22, kz], color: '#ffa63a', power: 1.3, size: 1.4 }]); }
    else for (let j = 0; j < 4; j++) {
      // lengths of kelp hung over the rim into the water
      const a = 0.4 + j * 1.5 + i, c = Math.cos(a), sn = Math.sin(a), w = 0.1, col = shade('#3d3c16', 0.9 + 0.3 * rng());
      const P = (r, y, e) => [x + c * r - sn * e, y, kz + sn * r + c * e];
      for (const [r0, y0, r1, y1] of [[0.5, rim - 0.2, 0.85, rim + 0.05], [0.85, rim + 0.05, 0.9, rim - 0.2 - 0.3 * rng()]]) dc.quad(P(r0, y0, -w), P(r0, y0, w), P(r1, y1, w), P(r1, y1, -w), col);
    }
    for (let j = 0, n = Math.max(6, Math.round(13 * deck.density)); j < n; j++) steam.push({ p: [x + rng.f(-0.45, 0.45), rim + rng.f(0, 0.4), kz + rng.f(-0.45, 0.45)], color: '#ffe6c4', power: rng.f(0.13, 0.24) * (s < 0 ? 1.2 : 0.8), size: rng.f(1.4, 3.8), move: [rng.f(-0.08, 0.08), rng.f(0.7, 1.15), rng.f(-0.06, 0.1)], loop: rng.f(9, 14), phase: rng() });
    if (i !== 1 || s < 0) { const out = (i + (s > 0 ? 0 : 1)) % 2 === 0; work.push({ pose: 'stir', skin: rng.i(0, 3), color: APRON, p: [x + (out ? s : -s) * 1.27, 0, kz], yaw: (out ? -s : s) * Math.PI / 2 }); }
  }
  slate(deck, dg, 3.4, 304.6, ['Kettles 1 to 3', 'Sixty degrees.', 'It must not boil.'], 1.7, 1.2);
  slate(deck, dg, -3.4, 304.6, ['Kettles 4 to 6', 'Kelp is out.', 'Salt, then lids.'], 1.7, 1.2);
  for (const [bxx, bz] of [[7.6, 306.2], [7.9, 309.9], [7.5, 314.6]]) deck.put('bin', { p: [bxx, 0, bz], yaw: rng.f(-0.3, 0.3), color: '#c9a23a' });
  yield 'kelp: kettles';
  // ---- the pass
  const px = (PASS.x0 + PASS.x1) / 2, by = 1.98;
  bx(dg, PASS.x0 + 0.08, 0, PASS.z0 + 0.08, PASS.x1 - 0.08, PASS.y - 0.06, PASS.z1 - 0.08, '#3d2e1c', { skip: 'tb' });
  bx(dg, PASS.x0, PASS.y - 0.06, PASS.z0, PASS.x1, PASS.y, PASS.z1, '#4a3820', { top: '#3a2c1c', skip: 'b' });
  for (const ex of [PASS.x0, PASS.x1]) bx(dg, ex - 0.012, PASS.y - 0.07, PASS.z0, ex + 0.012, PASS.y + 0.012, PASS.z1, BRASS);
  deck.sign('One noodle.', { at: [px, 0.5, PASS.z0 + 0.07], n: [0, -1], w: 1.7, h: 0.36, style: 'plate', font: 'serif' });
  // a rail of warm lamps over it, on brass posts from the cooks' side
  bx(dg, px - 0.05, by, PASS.z0 + 0.3, px + 0.05, by + 0.05, PASS.z1 - 0.3, '#4a4030');
  dg.floor(px - 0.04, PASS.z0 + 0.4, px + 0.04, PASS.z1 - 0.4, by - 0.002, '#ffd9a0', { down: true, emit: 5 });
  for (let z = PASS.z0 + 0.5; z < PASS.z1; z += 4.66) {
    bx(dg, PASS.x0 - 0.03, 0, z - 0.03, PASS.x0 + 0.03, by + 0.05, z + 0.03, BRASS, { skip: 'b' }); bx(dg, PASS.x0, by + 0.01, z - 0.02, px, by + 0.04, z + 0.02, BRASS);
    deck.glow([{ p: [px, by - 0.05, z + 1.2], color: '#ffd9a0', power: 1.2, size: 0.7 }, { p: [px, by - 0.05, z + 3.4], color: '#ffd9a0', power: 1.2, size: 0.7 }]);
  }
  deck.lattice({ origin: [px, by, PASS.z0 + 0.6], spacing: [1, 2.04], count: [1, 8], color: '#ffd9a0', power: 0.5, reach: 2.4, drop: 2.2, above: 0.05 });
  // the bowls: bare at the near end where they are still being set out, a noodle in each from there on, lids at the far end
  deck.proto('lid', (q) => { q.tint(0.7).cyl(0, 0, 0, 0.092, 0.03, 0.04, 8, '#f2f2f2', { smooth: false }).cyl(0, 0.04, 0, 0.018, 0.022, 0.022, 6, '#ffffff', { smooth: false }).tint(0); });
  const nz = Math.floor((PASS.z1 - PASS.z0 - 0.4) / BOWL_PITCH), bowls = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < 10; i++) {
    const x = PASS.x0 + 0.23 + i * BOWL_PITCH + rng.f(-0.012, 0.012), z = PASS.z0 + 0.25 + j * BOWL_PITCH + rng.f(-0.012, 0.012);
    const f = j + rng.f(-1.5, 1.5) + 0.5 * i, col = rng.pick(CREAMS);
    if (f < 2 && rng() < 0.5) continue;
    bowls.push({ x, z, kind: f < 7 ? 0 : 1, hand: rng() < 0.5 ? 1 : -1, yaw: rng() * TAU, col });
    if (f > nz - 7) deck.put('lid', { p: [x, PASS.y + 0.072, z], yaw: rng() * TAU, color: col });
  }
  const bm = new InstancedMesh(bowlGeo(), M.bowl, bowls.length), ab = new Float32Array(bowls.length * 2);
  bowls.forEach((q, i) => {
    _m4.compose(_p3.set(q.x, PASS.y, q.z), _qt.setFromAxisAngle(_up, q.yaw), _s3.set(1, 1, 1)); bm.setMatrixAt(i, _m4);
    bm.setColorAt(i, _col.set(q.col)); ab[i * 2] = q.kind; ab[i * 2 + 1] = q.hand;
  });
  bm.geometry.setAttribute('aBowl', new InstancedBufferAttribute(ab, 2));
  bm.instanceMatrix.needsUpdate = true; bm.instanceColor.needsUpdate = true; bm.frustumCulled = false;
  deck.group.add(bm);
  yield 'kelp: the pass';
  // the cooks along its far side, each coiling one noodle into one bowl; behind them the evening's noodles, a hank
  // to a bowl, on a rail
  for (let z = PASS.z0 + 1.3; z < PASS.z1 - 3.2; z += 1.72) work.push({ pose: 'coil', skin: rng.i(0, 3), color: APRON, p: [PASS.x0 - 0.42, 0, z + rng.f(-0.2, 0.2)], yaw: Math.PI / 2 + rng.f(-0.15, 0.15) });
  const hx0 = -4.55;
  bx(dg, hx0 - 0.02, 2.04, PASS.z0 + 0.8, hx0 + 0.02, 2.08, PASS.z1 - 2.4, '#7a5c40');
  for (let z = PASS.z0 + 0.8; z < PASS.z1 - 2.3; z += 2.9) bx(dg, hx0 - 0.03, 0, z - 0.03, hx0 + 0.03, 2.04, z + 0.03, '#6e5238', { skip: 'b' });
  for (let z = PASS.z0 + 1.0; z < PASS.z1 - 2.6; z += rng.f(0.2, 0.34)) {
    if (rng() < 0.22) continue;
    const len = rng.f(0.9, 1.35), w = rng.f(0.05, 0.08), col = mixc('#f4e8c8', '#e2d2a4', rng());
    dc.quad([hx0 - 0.03, 2.08 - len, z - w], [hx0 - 0.03, 2.08 - len, z + w], [hx0 - 0.03, 2.08, z + w * 0.6], [hx0 - 0.03, 2.08, z - w * 0.6], col, 0.12);
    dc.quad([hx0 + 0.03, 2.08 - len * 0.96, z - w], [hx0 + 0.03, 2.08 - len * 0.96, z + w], [hx0 + 0.03, 2.08, z + w * 0.6], [hx0 + 0.03, 2.08, z - w * 0.6], shade(col, 0.92), 0.12);
  }
  slate(deck, dg, -4.3, PASS.z0 - 0.9, ['Who may touch a noodle', 'Abelone.', 'Whoever she says.', 'Not you yet.'], 1.9, 1.4);
  slate(deck, dg, 2.6, PASS.z0 - 0.9, ['This morning', '5,400 bowls'], 1.8, 1.1);
  const folk = [];
  for (const s of SIDES) for (const z of [306.5, 312.6, 321.4, 326.2, 333.8]) folk.push({ p: [s * (HW - 1.05) + rng.f(-0.1, 0.1), 0, z + rng.f(-0.8, 0.8)], yaw: s * Math.PI / 2 + rng.f(-0.3, 0.3), color: APRON });
  for (const [x, z, r] of [[8.4, 318.6, 1.2], [-8.2, 309.4, 1.0], [-7.6, 323.5, 1.4], [8.8, 324.6, 0.9], [-6.4, 302.4, 1.1], [6.8, 302.8, 0.9]]) folk.push({ p: [x, 0, z], walk: r, color: z < 304 ? OILSKIN : APRON });
  deck.people(folk);
  yield 'kelp: cooks';
  return { steam, work, bowls: bm };
}
// The far end: racks of covered bowls waiting and going, shelves of bowls along the walls, the cab doors, the board
// over them, and the clock. One rack is on its way into a cab as the flight comes by (it keeps the flight's clock).
const RACK_GO = { x: 2.96, v: 0.36, loop: 60, phase: 0.2833 };
function* buildCabs(deck, M, rng, ZW, tEnd) {
  const g = deck.bucket(0, 320, 'k').g, sg = deck.bucket(0, 320, 'kd').g, work = [], cream = '#cdb78c';
  deck.proto('rack', rackShape); deck.proto('rackGo', rackShape);
  deck.proto('stack', (q) => { q.tint(1).cyl(0, 0, 0, 0.085, 0.09, 1, 6, '#ffffff', { smooth: false }).tint(0); });      // bowls, one in the next: a metre of them, to be squashed
  const rack = (x, z, yaw = 0) => deck.put('rack', { p: [x, 0, z], yaw, color: rng.pick(CREAMS) });
  for (const z of [328.2, 330.2, 332.2]) rack(2.6, z);
  for (const z of [327.1, 329.1, 331.1, 333.1]) rack(4.3, z);
  for (const z of [329.4, 331.4]) rack(6.0, z);
  rack(-1.7, PASS.z1 + 1.25, Math.PI / 2);                 // one at the pass's end, being filled
  work.push({ pose: 'coil', skin: 2, color: APRON, p: [-3.3, 0, PASS.z1 + 0.45], yaw: Math.PI / 2 + 0.5 });
  work.push({ pose: 'push', skin: 1, color: APRON, p: [4.3, 0, 325.97], yaw: 0 });
  work.push({ pose: 'push', skin: 0, color: APRON, p: [6.0, 0, 328.27], yaw: 0 });
  // shelves of bowls along both walls: the ones that are not on the pass yet
  for (const s of SIDES) {
    const xa = s * (HW - 0.42), xb = s * (HW - 0.04), xm = (xa + xb) / 2;
    for (let k = 0; k < 4; k++) {
      const y = 0.45 + k * 0.5;
      bx(sg, xa, y - 0.03, 305, xb, y, 337.5, '#7a5c40');
      for (let z = 305.2; z < 337.4; z += 0.25) { if (rng() < 0.12) continue; deck.put('stack', { p: [xm + rng.f(-0.03, 0.03), y, z], yaw: rng() * TAU, scale: [1, rng.f(0.08, 0.36), 1], color: rng.pick(CREAMS) }); }
      if (deck.clk.due()) { yield 'kelp: shelves'; deck.clk.go(); }
    }
    for (let z = 305; z <= 337.6; z += 2.5) bx(sg, xa, 0, z - 0.03, xb, 2.3, z + 0.03, '#6e5238', { skip: 'b' });
  }
  yield 'kelp: shelves';
  // the cab doors: five, the middle one the way out, the ones either side of it standing open on a lit cab
  const n0 = deck.spots.length;
  const lifts = lobby(deck, { at: [0, ZW], y: 0, face: 'front', doors: 5, pitch: 2.6, width: 2 * HW, height: 3.2, hole: 2, open: [1, 3], name: 'Cabs', lines: ['Breakfast goes up first.'], door: '#7a5a2c', wall: cream, part: 'k' });
  deck.spots.length = n0;                                  // nobody stands waiting for a cab at four in the morning
  for (const [x, z] of [[-2.96, ZW + 1.05], [-2.24, ZW + 1.05], [2.24, ZW + 1.05]]) rack(x, z);
  const drift = [0, 0, RACK_GO.v, RACK_GO.loop], gz = ZW + 1.05 - RACK_GO.v * RACK_GO.loop * ((tEnd / RACK_GO.loop + RACK_GO.phase) % 1);
  deck.put('rackGo', { p: [RACK_GO.x, 0, gz], yaw: 0, color: CREAMS[0], drift, phase: RACK_GO.phase });
  deck.pacers.push({ p: [RACK_GO.x, 0, gz - 1.13], yaw: 0, drift, phase: RACK_GO.phase, color: APRON, skin: SKINS[1], scale: 1 });
  // over the doors: the board, and the clock at seven minutes past four
  bx(g, -4.55, 4.35, ZW - 0.08, 4.55, 5.85, ZW, '#211a10');
  deck.sign('Breakfast is at six.', { at: [0, 5.1, ZW - 0.085], n: [0, -1], w: 8.8, h: 1.3, style: 'board', font: 'serif', ground: '#211a10', ink: '#e7c27a', glow: 0.55 });
  deck.sign(['Lids on.', 'The cab leans.'], { at: [1.3, 1.72, ZW - 0.016], n: [0, -1], w: 0.86, h: 0.5, style: 'paper', font2: 'serif' });
  const cy = 7.55, cr = 0.95, cz = ZW - 0.07, ring = [];
  for (let i = 0; i < 28; i++) { const a0 = (i / 28) * TAU, a1 = ((i + 1) / 28) * TAU; g.tri([0, cy, cz], [Math.cos(a1) * cr, cy + Math.sin(a1) * cr, cz], [Math.cos(a0) * cr, cy + Math.sin(a0) * cr, cz], '#f3ead2', 0.9); }
  for (let i = 0; i <= 28; i++) { const a = (i / 28) * TAU; ring.push([Math.cos(a) * (cr + 0.03), cy + Math.sin(a) * (cr + 0.03), cz - 0.01]); }
  g.tube(ring, 0.05, 5, BRASS);
  // seen from the kitchen, clockwise is toward -x: the viewer looks along +z, with spinward on the left
  const dial = (turn, r, dz) => [-Math.sin(turn * TAU) * r * cr, cy + Math.cos(turn * TAU) * r * cr, cz - dz];
  for (let i = 0; i < 12; i++) g.tube([dial(i / 12, 0.8, 0.02), dial(i / 12, 0.93, 0.02)], i % 3 ? 0.014 : 0.024, 4, '#3a2c1a');
  g.tube([[0, cy, cz - 0.035], dial(7 / 60, 0.82, 0.035)], 0.02, 4, '#211a10');
  g.tube([[0, cy, cz - 0.045], dial((4 + 7 / 60) / 12, 0.55, 0.045)], 0.03, 4, '#211a10');
  deck.glow([{ p: [0, cy, cz - 0.3], color: '#fff0d8', power: 0.45, size: 2.6 }]);
  yield 'kelp: cabs';
  return { lifts, work };
}

// Dulse's paint down here: steel and wet in the nave, broth gold, brass and old cream plaster in the kitchen
const DULSE = {
  ...PALETTES.warm,
  walls: ['#cdb78c', '#c4ad82', '#d3bf96', '#bfa67a', '#c9b48a', '#d8c6a0'],
  dado: ['#7a5a2c', '#6f5630', '#84643a', '#665028'],
  trim: ['#3a2c1a', '#4a3820', '#33281a', '#51402a'],
  doors: ['#7a5a2c', '#5a6a4a', '#8a6a34', '#4a5a52', '#6f5630', '#3f5a4a', '#94743c', '#33281a'],
  signs: [['#211a10', '#e7c27a'], ['#33281a', '#fff6df'], ['#2a3020', '#e7c27a'], ['#e9dcc0', '#211a10'], ['#3a2c1a', '#f0d9a0'], ['#4a3820', '#fff6df']],
  floor: '#8a7a5c', strip: '#6a5c44', court: '#a8946c', ceiling: '#3a352c', rib: '#5a5040',
  metal: '#8f7a4a', brass: BRASS, lamp: '#ffd9a0', window: ['#ffc98a', '#ffdcae', '#ffe9c8', '#f6c27e'], shop: '#ffd9a2',
};

export const dulseKelp = {
  id: 'dulse-kelp',
  title: 'Where the broth starts', drum: 'Dulse', row: 'Kelp Row', kind: 'a hall drum on the far side', light: 36.9,
  line: 'Dulse grows its kelp in glass down in the Keel, a hall of it five decks tall, and breakfast starts there at four. I have cut kelp for nine mornings. Abelone says I may touch a noodle when I stop tearing it.',
  tone: '#e7c27a', source: 'wander-year.md (Day 185: Dulse, Kelp Row), three-nights 15-canon.js (Dulse), food-system.md (Tier 3), sorrel.md (The Keel)',
  sound: { root: 47, scale: 'dorian', pad: 0.5, air: 0.15, hum: 0.5, water: 0.6, crowd: 0.2, bells: 0.1, bright: 0.4 },
  *build(ctx) {
    const frame = makeFrame(212 * DEG, 420, R8);
    const rng = makeRng('dulse-kelp');
    const hx = HERO.side * TX, hz = tankZ(HERO.k);
    // Out of the apron room to the first bin as a bundle lands in it; up and along the nave; into S 21 through its
    // glass and up through the kelp to the surface; out over its flap and along the outside of the gantry's rail,
    // past the visiting cook as her teacher lets a bundle go; on to watch S 27's fall the whole 18 m; down the
    // nave's length to the kitchen, between the kettles, along the pass, and out by a cab's doors. Where the view
    // turns, it looks at points some forty metres off, so that it turns slowly.
    const path = makePath([
      { t: 0, p: [-0.1, 1.3, -3.6] },
      { t: 2.4, p: [-2.0, 1.3, 0.2], look: [-7.0, 2.2, 10.2] },
      { t: 5.4, p: [-3.3, 1.22, 6.4], look: [-7.3, 2.1, 15.2] },
      { t: 8.2, p: [-2.5, 1.9, 14.5], look: [-3.2, 3.4, 26.5] },
      { t: 11, p: [-1.4, 4.6, 33], look: [-1.1, 6.6, 63], fov: 64 },
      { t: 15, p: [-1.0, 6.0, 84], look: [-0.7, 7.1, 114], fov: 64 },
      { t: 18.5, p: [1.5, 4.3, 128], look: [7.7, 4.8, 157.3] },
      { t: 21.2, p: [5.0, 3.15, 149.2], look: [23.9, 4.2, 172.5] },
      { t: 22.7, p: [7.75, 3.2, 152.6], look: [26.65, 4.8, 175.9] },
      { t: 24.0, p: [hx, 4.0, hz], look: [27.5, 14, 189] },
      { t: 26.3, p: [hx, 8.2, hz], look: [11.5, 31.2, 193.7] },
      { t: 28.6, p: [hx, 12.6, hz], look: [-3.7, 37.6, 191.8] },
      { t: 30.3, p: [hx, 16.0, hz], look: [-9.5, 26, 189.4] },
      { t: 31.5, p: [8.55, 18.15, hz - 0.05], look: [-11.45, 16.75, 188.3] },
      { t: 32.6, p: [7.3, 18.65, hz - 0.05], look: [-5.1, 14.45, 191.5] },
      { t: 34.0, p: [4.9, 18.95, hz - 0.15], look: [7.7, 13.35, 193.55] },
      { t: 35.6, p: [3.2, 19.0, 156.6], look: [18.2, 12.7, 193.7] },
      { t: 37.4, p: [3.0, 19.0, 164.5], look: [11.3, 11.4, 203.0] },
      { t: 39.2, p: [3.1, 19.0, 173.5], look: [7.8, 8.6, 212.0] },
      { t: 40.6, p: [3.5, 19.0, 181.5], look: [6.3, -4.1, 221.4], fov: 66 },
      { t: 42.0, p: [3.4, 19.0, 187.0], look: [6.9, -9.0, 226.8], fov: 66 },
      { t: 43.2, p: [3.1, 18.7, 192.0], look: [5.9, -8.3, 231.9], fov: 64 },
      { t: 44.6, p: [2.5, 16.8, 204.5], look: [2.5, 6.8, 244.5] },
      { t: 46.2, p: [1.7, 12.8, 229], look: [1.0, 8.6, 269] },
      { t: 48.0, p: [0.9, 8.3, 266], look: [0.4, 4.8, 306] },
      { t: 49.2, p: [0.6, 6.2, 289], look: [0.2, 2.9, 329] },
      { t: 50.3, p: [0.45, 4.9, 302.5], look: [0, 1.6, 342] },
      { t: 51.6, p: [0.3, 3.5, 310.5], look: [-1.1, 0.7, 350.5] },
      { t: 53.2, p: [0.1, 2.0, 318.5], look: [-2.0, -1.15, 348.4] },
      { t: 55.0, p: [0, 1.5, 324.5], look: [-4.2, -4.9, 354.2] },
      { t: 56.6, p: [0, 1.3, 328.6], look: [-5.7, -14.0, 358] },
      { t: 58.2, p: [0, 1.42, 332.6], look: [-1.6, -2.8, 362.6] },
      { t: 59.8, p: [0, 1.3, 336.4] },
      { t: 61.2, p: [0, 1.1, 339.2] },
      { t: 62.2, p: [0, 1.1, 340.6] },
    ], { frame, entryRadius: 1.0, exitRadius: 1.1 });
    const ZW = path.exit.flat.z - DOOR_IN;                 // the wall of cab doors at the kitchen's end
    yield 'kelp: path';
    const deck = makeDeck(ctx, {
      frame, near: path.points(0.5), seed: 'dulse-kelp', palette: DULSE, clock: 'flight', detail: 40,
      light: { level: 1, ambUp: '#232b20', ambDown: '#151a14', ambPower: 0.6, haze: '#070a06', hazeDensity: 0.0016 },
      floor: { slab: [0.3, 0.3], wear: 0.6, shine: 1, rough: 0.02, lampGlow: 2.6 },
    });
    yield 'kelp: deck';
    const M = makeMats(deck, ZW);
    yield 'kelp: materials';
    const gan = newGantry();
    yield* buildNave(deck, M, ZW, gan);
    const tanks = yield* buildTanks(deck, M, rng);
    const cut = yield* buildCut(deck, M, rng, gan);
    for (const key in gan) { const m = gan[key].mesh(M.gantry, frame); deck.group.add(m); cut.push(m); yield 'kelp: gantry'; }
    const kit = yield* buildKitchen(deck, M, rng, ZW);
    const cabs = yield* buildCabs(deck, M, rng, ZW, path.tCross);
    const cooks = yield* standWorkers(deck, M, [...kit.work, ...cabs.work]);
    const steam = glowPoints(kit.steam, { bend: frame, minPx: 1, maxPx: 520, soft: 2.4 });
    deck.group.add(steam);
    yield 'kelp: cooks';
    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);
    // What the nave hides from the kitchen, and what is too small in the kitchen to be seen from the nave, is not
    // drawn: the glass and the cutters once the flight is among the kettles; the kitchen's people and furniture
    // until it is half way down the nave; its bowls and shelves until the last eighty metres.
    const naveOnly = [tanks.walls, tanks.hero, tanks.tops, tanks.kelp, tanks.heroKelp, ...cut], small = [kit.bowls], mid = [...cooks];
    for (const m of deck.group.children) {
      if (naveOnly.includes(m) || small.includes(m) || mid.includes(m)) continue;
      if (m.isInstancedMesh) {
        const a = m.instanceMatrix.array; let z0 = 1e9;
        for (let i = 0; i < m.count; i++) z0 = Math.min(z0, a[i * 16 + 14]);
        if (z0 > NAVE) (m.count > 30 ? small : mid).push(m);
      } else if (m.geometry && m.geometry.boundingBox) { const bb = m.geometry.boundingBox; if (bb.min.z > NAVE - 1 && bb.max.y < 3 && bb.max.x > 10) small.push(m); }
    }
    const show = (list, on) => { for (const m of list) m.visible = on; };
    // (All of it is left showing until the first update: the engine draws every mesh once before the world is seen,
    // so that the card has it ready, and it cannot draw what is hidden.)
    let inNave = true, inMid = true, inSmall = true;
    const look = { exposure: 1.6, bloom: 0.3, threshold: 0.9, saturation: 1.05, vignette: 0.5, contrast: 1.06, lift: [0, 0, 0], gain: [1, 1, 1] };
    const eye = M.U.eye.value, rig = deck.rig, hazeNave = new Color('#070a06'), hazeKitchen = new Color('#1c1408'), haze = new Color();
    const open0 = path.tCross - 6.5, open1 = path.tCross - 3.0;
    cabs.lifts.slide(0);
    return {
      scene, path, deck, near: 0.1, far: 700, look,
      portal: { shape: 'rect', width: 1.5, height: 2.2, rim: false, mist: '#e7c27a', openFor: 8 },
      update(t, dt, camera) {
        deck.tick(t);
        M.U.T.value = t;
        frame.local(camera.position, eye);
        // in the water of the tank the flight goes up through, the glass can be seen out of, and the picture is
        // another one: less light, more of it green. Going through the glass, and through the surface, flashes
        const r = Math.hypot(eye.x - hx, eye.z - hz), under = eye.y < WY, within = r < TR;
        M.U.see.value = within && under && eye.y > PY ? 1 : 0;
        const wet = smoothstep(TR + 0.1, TR - 0.3, r) * smoothstep(WY + 0.15, WY - 0.35, eye.y);
        const flash = Math.max(under && eye.y > PY ? Math.exp(-(((r - TR) / 0.2) ** 2)) : 0, within ? Math.exp(-(((eye.y - WY) / 0.16) ** 2)) : 0);
        const warm = smoothstep(270, 312, eye.z);
        look.exposure = lerp(1.6, 1.2, wet) * lerp(1, 0.8, warm) * (1 + 1.3 * flash);
        look.bloom = lerp(0.3, 0.42, wet) + 0.3 * flash;
        look.saturation = lerp(1.05, 1.16, wet);
        look.vignette = lerp(0.5, 0.62, wet);
        look.gain[0] = lerp(1, 0.94, wet); look.gain[2] = lerp(1, 0.92, wet);
        rig.set({ haze: haze.copy(hazeNave).lerp(hazeKitchen, warm), hazeDensity: lerp(0.0016, 0.001, warm) });
        const a = eye.z < KZ + 8, b = eye.z > 110, c = eye.z > 236;
        if (a !== inNave) { inNave = a; show(naveOnly, a); }
        if (b !== inMid) { inMid = b; show(mid, b); }
        if (c !== inSmall) { inSmall = c; show(small, c); }
        cabs.lifts.slide(smoothstep(open0, open1, t));
      },
    };
  },
};
