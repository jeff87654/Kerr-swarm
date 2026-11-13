// Carillon, Bell Row: the Window during the Passing (docs/wander-year.md, Day 140: "Front: Selkie from Carillon's
// Window, black against the River"; ashgrove.md, Day four; sorrel.md, Beyond the drum). A long low dark gallery behind
// the radiators with seventy-five eight-year-olds in it, each beside the one adult they chose, and the whole of one
// wall is the sky. It is the only world of the journey that is not inside a drum's own light: after all the lamps
// and painted dawns, this is what is really out there. Against the River hangs another raft, Selkie, two fingers
// wide at arm's length. The flight starts at the back of the room, goes down an aisle until a child who has stretched
// up to the glass stands against the River, drifts across over the couches (nothing has weight out here) to a child
// who is measuring Selkie with two fingers, goes out past her hand through the metre and a half of water, turns once
// right round under the whole sky, looks back in at the faces, and then goes to Selkie.
//
// Axes: this gallery stands at the origin with its glass looking along +z, x along its length, y aft (up, in every
// picture), and the radiator plain is y = 0. The kit's raft (kit/outside.js) is moved to suit: Carillon's back axle is
// at z = -600. Small numbers near the camera keep close work steady.
//
// The card is Marit Vell's, and she is not in the room: by Day 226 she has not seen the River since she was eight.
//
// Not canon:
// - Carillon's Windows. The docs give Carillon Windows, a Passing and Selkie's size in the sky, and describe only
//   Sorrel's galleries (a dozen, long and low, about a hundred and fifty seats, couches in tiers, a long shutter,
//   glazed with a metre and a half of water, reached by a shielded track). Here there are seven, in an arc 600 m from
//   the back axle on the side where the River stands highest, in a shell like the kit's gallery but a little taller.
// - That Carillon sends its eight-year-olds as Sorrel does, seventy-five to a round, each with one adult, and that
//   they come home holding up two fingers. The docs have the measure ("two fingers wide at arm's length"), not who
//   makes it.
// - The room: three tiers of double couches with lap straps, bronze rails to pull yourself along, small red lamps at
//   the foot of each aisle, a dark polished floor in the aisles, a guide with a red hand lamp by the door. The docs
//   give the couches, the tiers, the guide and the red light.
// - Children who have let go of their couches and float, each held by an ankle; one of them stretched up to lay a
//   hand flat on the glass. The docs say the still side has no weight ("holding her sleeve so as not to drift away");
//   they do not say what a guide allows.
// - Motes in the water, and threads of light moving in it. Sealed water would be still and clear.
// - Where things stand in the sky: the River highest at about 22 degrees, Selkie on its bright middle.
// - Going to Selkie. It is two AU away. The opening at the end of the flight is laid over the black shape, which
//   holds darkness until the last four seconds; then the next world shows inside it, like an answer arriving. The
//   shape grows as if it were half a kilometre off, which it is not.
// - The back crew's sled on its ring track, the crews' lamps further out and the pools they throw on the panels, the
//   lamps at each gallery's ends, and the look of the shutter housing.
import {
  Scene, Group, Vector3, Matrix4, Mesh, BufferGeometry, Float32BufferAttribute, Uint8BufferAttribute, ShaderMaterial, DoubleSide, Sphere,
  CustomBlending, ZeroFactor, SrcColorFactor, AdditiveBlending,
} from 'three';
import { makePath } from '../core/path.js';
import { makeRng, clamp, smoothstep, smootherstep } from '../core/rng.js';
import { Geo, instances } from '../kit/geo.js';
import { G, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, litMaterial, glowPoints, vec3col } from '../kit/mats.js';
import { RAFT, buildSky, buildBack, backRig, skyDir, sledGeo, dockGeo, farLights } from '../kit/outside.js';

const Y = RAFT.DEPTH, AXLE = 600;
const RIVER = [93, 22];                   // where the River stands highest: bearing and elevation, degrees
const SELKIE = [95.5, 21.4];              // Selkie, on the River's bright middle
const SELKIE_DEG = 3;                     // "two fingers wide at arm's length"
const SQUASH = 0.37;                      // a flat raft lying level, seen from 21 degrees below its plane

// ---------------------------------------------------------------- the gallery in section
// y up, z out. The glazing is a slab of water 1.5 m thick leaning back at about 49 degrees: slab(s, w) is the point
// s metres up the slope and w metres in from the outer face, as [y, z].
const UY = 0.7498, UZ = -0.6616, NY = 0.6616, NZ = 0.7498, SLOPE = 9.069, WATER = 1.5;
const slab = (s, w) => [1.2 + UY * s - NY * w, 5.6 + UZ * s - NZ * w];
const paneZ = (y, w) => 5.6 + (UZ * (y - 1.2 + NY * w)) / UY - NZ * w;        // z of the plane w metres in, at height y
const GL = 46, HALF = 45.9, SEATS = 45.2, BAY = 92 / 12;
const HEAD = slab(SLOPE, WATER), CEIL = HEAD[0], FOOT = slab(0.8824 * WATER, WATER)[1];   // where the inner pane meets ceiling and floor
// three tiers of couches and a strip at the back, each a step higher than the one in front
const TIERS = [{ y: 1.2, z0: -0.1, z1: 3.6, row: 1.0 }, { y: 1.75, z0: -2.6, z1: -0.1, row: -1.5 }, { y: 2.3, z0: -5.1, z1: -2.6, row: -4.0 }];
const STRIP = { y: 2.85, z0: -6.6, z1: -5.1 };
const AISLES = [-34.5, -19.1667, -3.8333, 11.5, 26.8333], AISLE_W = 1.5;
const XA = AISLES[1];                     // the aisle the flight starts in

const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const mix = (a, b, t) => a + (b - a) * t;

// a prism lying along x: poly is its section as [z, y] corners, counter-clockwise with z to the right and y up
function prismX(g, poly, x0, x1, colour, emit = 0) {
  const n = poly.length;
  for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; g.quad([x0, a[1], a[0]], [x1, a[1], a[0]], [x1, b[1], b[0]], [x0, b[1], b[0]], colour, emit); }
  for (let i = 1; i < n - 1; i++) {
    g.tri([x0, poly[0][1], poly[0][0]], [x0, poly[i][1], poly[i][0]], [x0, poly[i + 1][1], poly[i + 1][0]], colour, emit);
    g.tri([x1, poly[0][1], poly[0][0]], [x1, poly[i + 1][1], poly[i + 1][0]], [x1, poly[i][1], poly[i][0]], colour, emit);
  }
}
// a round limb through points, its radius a number or a function of how far along (0..1). It is the kit's Geo.tube
// with its faces wound to look out. The kit's wind inward (as its blob's do), so under a one-sided material you see
// the inside of a tube's far half: nothing on a rail, and plain wrong on an arm lit from one side
function limb(g, pts, radius, sides, colour) {
  const P = pts.map((q) => new Vector3(q[0], q[1], q[2])), n = P.length, rings = [];
  let bx = null;
  for (let i = 0; i < n; i++) {
    const tan = new Vector3().subVectors(P[Math.min(i + 1, n - 1)], P[Math.max(i - 1, 0)]).normalize();
    if (!bx) bx = new Vector3().crossVectors(tan, Math.abs(tan.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0)).normalize();
    else bx = bx.clone().addScaledVector(tan, -bx.dot(tan)).normalize();
    const by = new Vector3().crossVectors(tan, bx), rad = typeof radius === 'function' ? radius(i / (n - 1)) : radius, ring = [];
    for (let j = 0; j < sides; j++) { const a = (j / sides) * 6.2832, nn = bx.clone().multiplyScalar(Math.cos(a)).addScaledVector(by, Math.sin(a)); ring.push([P[i].clone().addScaledVector(nn, rad), nn]); }
    rings.push(ring);
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
    const a = rings[i][j], b = rings[i][(j + 1) % sides], c = rings[i + 1][(j + 1) % sides], d = rings[i + 1][j];
    g.tri(a[0], b[0], c[0], colour, 0, a[1], b[1], c[1]); g.tri(a[0], c[0], d[0], colour, 0, a[1], c[1], d[1]);
  }
}
// a smooth ball of radii r about c. keep(direction) leaves facets out: a head of hair is the same ball, a little
// larger, without its face. swell(direction) scales the radius: hair that nothing weighs down is not a smooth cap
function ball(g, c, r, colour, nu = 8, nv = 6, keep = null, swell = null) {
  const P = (i, j) => { const a = (i / nu) * 6.2832, b = (j / nv) * Math.PI, s = Math.sin(b); return [s * Math.sin(a), Math.cos(b), s * Math.cos(a)]; };
  const q = (d) => { const w = swell ? swell(d) : 1; return [c[0] + d[0] * r[0] * w, c[1] + d[1] * r[1] * w, c[2] + d[2] * r[2] * w]; };
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const d00 = P(i, j), d10 = P(i + 1, j), d01 = P(i, j + 1), d11 = P(i + 1, j + 1);
    if (keep && !keep([(d00[0] + d11[0]) / 2, (d00[1] + d11[1]) / 2, (d00[2] + d11[2]) / 2])) continue;
    if (j > 0) g.tri(q(d00), q(d11), q(d10), colour, 0, d00, d11, d10);
    if (j < nv - 1) g.tri(q(d00), q(d01), q(d11), colour, 0, d00, d01, d11);
  }
}

// ---------------------------------------------------------------- light in the room
// Nothing lights the room but the Window: a band of sky ninety metres long, so its light is soft, comes round the
// edges of things, and puts a line of gold on whatever stands between you and it. And a few red lamps at the foot
// of each aisle: red leaves eyes dark. Three rigs share one set of numbers: `plain` for people, whose edges against
// the Window take the light's own colour; `couch`; and `room` for the room itself, where a face's tint weight says
// how polished it is and the polished ones hold the River.
function windowRig(sky) {
  const uniforms = {
    uWinDir: { value: skyDir(74, 30).normalize() },
    uWinCol: { value: vec3col('#ffe4c2', 0.1) }, uWinRim: { value: vec3col('#ffe8cc', 0.17) },
    uRedCol: { value: vec3col('#ff2a12', 0.085) }, uRoomUp: { value: vec3col('#3a2f28', 0.1) }, uRoomDown: { value: vec3col('#2a2422', 0.06) },
    uHand: { value: [0, -99, 0, 1.4] }, uHandCol: { value: vec3col('#ff3a1a', 0.06) }, uShine: { value: 2.2 },
    uRiver: sky.uniforms.uRiver, uGold: sky.uniforms.uGold, uShelf: sky.uniforms.uShelf, uGlow: sky.uniforms.uGlow,
  };
  const red = [[STRIP.y - 0.27, TIERS[2].z1 - 2.46], [TIERS[2].y - 0.27, TIERS[1].z1 - 2.46], [TIERS[1].y - 0.27, TIERS[0].z0 + 0.04], [TIERS[0].y + 0.1, 3.3]];
  const glsl = (gloss, gold) => /* glsl */`
uniform vec3 uWinDir, uWinCol, uWinRim, uRedCol, uRoomUp, uRoomDown, uGold, uShelf, uHandCol; uniform vec4 uHand; uniform mat3 uRiver; uniform float uGlow, uShine;
vec3 kUp(vec3 P) { return vec3(0.0, 1.0, 0.0); }
vec3 kAir(vec3 c, vec3 P) { return c; }
vec3 kRiverSoft(vec3 d) { float b = asin(clamp((uRiver * d).z, -1.0, 1.0)); return (uGold * (0.8 * exp(-b * b / 0.012) + 0.6 * exp(-b * b / 0.003)) + 0.5 * uShelf * exp(-abs(b) / 0.38)) * uGlow; }
vec3 kLamp(vec3 P, vec3 N, vec3 at, float r2) { vec3 q = at - P; float d2 = dot(q, q); return vec3(max(dot(N, q) * inversesqrt(d2 + 0.01) * 0.75 + 0.25, 0.0) / (1.0 + d2 / r2)); }
vec3 kLight(vec3 P, vec3 N, vec3 F, vec3 FN) {
  vec3 V = normalize(cameraPosition - P);
  float d = dot(N, uWinDir);
  float wrap = pow(max(d * 0.8 + 0.2, 0.0), 2.5);
  float rim = pow(1.0 - abs(dot(N, V)), 2.3) * ${gold ? '1.25' : '1.0'} * smoothstep(-0.4, 0.35, d) * smoothstep(-0.1, 0.5, -dot(V, uWinDir));   // only against the light
  float deep = mix(0.5, 1.0, smoothstep(-7.0, 1.5, P.z));          // less of the sky is seen from the back of the room
  vec3 L = (uWinCol * wrap + uWinRim * rim${gold ? ' * (0.4 + 0.6 / max(vCol, vec3(0.002)))' : ''}) * deep;      // on people the line of light is the light's own colour, dark hair or not
  float xa = clamp(floor((P.x + 34.5) / 15.33333 + 0.5), 0.0, 4.0) * 15.33333 - 34.5;
  L += uRedCol * (${red.map((q) => `kLamp(P, N, vec3(xa, ${q[0].toFixed(3)}, ${q[1].toFixed(3)}), 0.24)`).join(' + ')});
  L += uHandCol * kLamp(P, N, uHand.xyz, uHand.w * uHand.w);
  L += mix(uRoomDown, uRoomUp, 0.5 + 0.5 * N.y);
  ${gloss ? `if (vSoft > 0.01) {
    vec3 R = reflect(-V, N);
    float way = smoothstep(0.0, 0.2, R.z) * smoothstep(0.01, 0.1, R.y) * smoothstep(0.92, 0.7, R.y);
    float fres = 0.1 + 0.9 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    L += kRiverSoft(R) * (way * fres * vSoft * uShine) / max(vCol, vec3(0.02));
  }` : ''}
  return L;
}`;
  return { uniforms, plain: { uniforms, glsl: glsl(false, true), kind: 'window' }, couch: { uniforms, glsl: glsl(false, false), kind: 'window' }, room: { uniforms, glsl: glsl(true, false), kind: 'window' } };
}

// ---------------------------------------------------------------- the water
// The glazing as it is seen through: two panes and the water between them, drawn as seven sheets that each take a
// little of the light, the red end of it first, in slow uneven patches. From the room the stars swim a very little;
// from outside they do not. A second copy of the outer pane holds the sky, as the radiator panels do.
const GLASS_VERT = /* glsl */`
attribute vec2 aKind;     // 0 the inner pane, 1 water, 2 the outer pane; which sheet
varying vec3 vW; varying vec3 vN; varying vec2 vK;
void main() { vK = aKind; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * wp; }`;
const WATER_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uTime, uDeep;
varying vec3 vW; varying vec3 vN; varying vec2 vK;
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  vec3 t = vec3(0.985, 0.99, 0.992);
  if (vK.x > 0.5 && vK.x < 1.5) {
    vec2 q = vec2(vW.x, vW.y * ${UY} + vW.z * ${UZ});
    float n = kNoise(q * 0.8 + vec2(uTime * 0.05 + vK.y * 3.7, vK.y * 5.1 - uTime * 0.035));
    n = 0.6 * n + 0.4 * kNoise(q * 2.7 - vec2(uTime * 0.07, uTime * 0.045) + vK.y * 11.0);
    t = pow(vec3(0.962, 0.984, 0.99), vec3(uDeep * (0.25 + 1.5 * n)));
  }
  gl_FragColor = vec4(t, 1.0);
}`;
const SHEEN_FRAG = /* glsl */`
${CLIP_PARS}
uniform mat3 uRiver; uniform vec3 uGold, uShelf; uniform float uGlow, uRefl;
varying vec3 vW; varying vec3 vN; varying vec2 vK;
void main() {
  ${CLIP_FRAG}
  vec3 V = normalize(cameraPosition - vW);
  float ndv = dot(vN, V);
  if (ndv <= 0.0) discard;                                          // from the room it holds only the room, which is dark
  // what it holds is taken as if the pane stood nearly upright (less so seen along it): then, from before the room,
  // the River lies along the top of the glass, over the faces
  vec3 R = reflect(-V, normalize(normalize(vec3(vN.x, 0.0, vN.z)) + vec3(0.0, mix(0.035, 0.25, smoothstep(0.5, 0.15, ndv)), 0.0)));
  float b = asin(clamp((uRiver * R).z, -1.0, 1.0));
  vec3 sky = (uGold * (0.8 * exp(-b * b / 0.012) + 0.6 * exp(-b * b / 0.003)) + 0.5 * uShelf * exp(-abs(b) / 0.38)) * uGlow * smoothstep(-0.02, 0.06, R.y);
  float fres = 0.07 + 0.93 * pow(1.0 - ndv, 5.0);
  gl_FragColor = vec4(sky * fres * uRefl, 1.0);
}`;
// Light at play in the water: wavering threads on sheets a hand apart, drawn only within arm's reach of the eye, so
// that from the room and from outside the water is clear, and from inside it you are plainly in something.
const CAUSTIC_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uTime; uniform vec3 uColor;
varying vec3 vW; varying vec3 vN; varying vec2 vK;
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  float dist = length(vW - cameraPosition);
  float fade = smoothstep(0.12, 0.4, dist) * smoothstep(1.25, 0.55, dist);
  if (fade <= 0.0) discard;
  vec2 q = vec2(vW.x, vW.y * ${UY} + vW.z * ${UZ}) * 2.1;
  q += 0.4 * vec2(kNoise(q * 0.7 + uTime * 0.11 + vK.y), kNoise(q.yx * 0.7 - uTime * 0.09 + vK.y * 3.0));
  float n = kNoise(q + vec2(uTime * 0.13, vK.y * 7.3)), m = kNoise(q * 1.9 - vec2(vK.y * 4.1, uTime * 0.17));
  float veins = pow(1.0 - abs(2.0 * n - 1.0), 12.0) + 0.6 * pow(1.0 - abs(2.0 * m - 1.0), 14.0);
  gl_FragColor = vec4(uColor * (veins * fade), 1.0);
}`;
function buildGlass(sky) {
  const sheet = (list) => {
    const pos = [], nrm = [], kind = [];
    for (const [w, k, ph] of list) {
      const a = slab(0.8824 * w, w), b = slab(SLOPE, w);
      const P = [[-GL, a[0], a[1]], [GL, a[0], a[1]], [GL, b[0], b[1]], [-GL, b[0], b[1]]];
      for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(P[i][0], P[i][1], P[i][2]); nrm.push(0, NY, NZ); kind.push(k, ph); }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new Float32BufferAttribute(nrm, 3)); g.setAttribute('aKind', new Float32BufferAttribute(kind, 2));
    g.boundingSphere = new Sphere(new Vector3(0, 4.5, 2.5), 48);
    return g;
  };
  const water = new Mesh(sheet([[WATER, 0, 0], [1.25, 1, 0], [1.0, 1, 1], [0.75, 1, 2], [0.5, 1, 3], [0.25, 1, 4], [0, 2, 0]]), new ShaderMaterial({
    uniforms: { uClip: G.uClip, uTime: G.uTime, uDeep: { value: 1 } }, vertexShader: GLASS_VERT, fragmentShader: WATER_FRAG,
    side: DoubleSide, transparent: true, depthWrite: false, blending: CustomBlending, blendSrc: ZeroFactor, blendDst: SrcColorFactor,
  }));
  water.renderOrder = 11;
  const sheen = new Mesh(sheet([[0, 2, 0]]), new ShaderMaterial({
    uniforms: { uClip: G.uClip, uRiver: sky.uniforms.uRiver, uGold: sky.uniforms.uGold, uShelf: sky.uniforms.uShelf, uGlow: sky.uniforms.uGlow, uRefl: { value: 2.4 } },
    vertexShader: GLASS_VERT, fragmentShader: SHEEN_FRAG, side: DoubleSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  sheen.renderOrder = 12;
  const caustics = new Mesh(sheet([1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => [i * 0.15, 1, i])), new ShaderMaterial({
    uniforms: { uClip: G.uClip, uTime: G.uTime, uColor: { value: vec3col('#f4ecc8', 0.036) } },
    vertexShader: GLASS_VERT, fragmentShader: CAUSTIC_FRAG, side: DoubleSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  caustics.renderOrder = 13; caustics.visible = false;
  return { water, sheen, caustics };
}

// ---------------------------------------------------------------- the room and its shell
// Inside: tiers, back wall, ceiling, the ribs of the glazing, bronze rails, red lamps. Outside: the same long low
// box the kit's galleries are, a little taller, with the shutter rolled into a housing over the glass.
function* buildRoom(rig, back, lamps) {
  const g = new Geo(), e = new Geo();
  const wall = '#2b2622', carpet = '#342d27', polish = '#1c1b1c', ceil = '#1d1b1a', riser = '#3a322b', brass = '#9a7840', rib = '#191715';
  let t0 = performance.now();
  const levels = [TIERS[0], TIERS[1], TIERS[2], STRIP];
  // floors: carpet under the couches, and in each aisle a strip of dark polished floor that holds the sky
  const xs = [-HALF];
  for (const a of AISLES) xs.push(a - AISLE_W / 2, a + AISLE_W / 2);
  xs.push(HALF);
  for (const L of levels) for (let i = 0; i < xs.length - 1; i++) { const aisle = i % 2 === 1; g.tint(aisle ? 0.9 : 0); g.floor(xs[i], L.z0, xs[i + 1], L.z1, L.y, aisle ? polish : carpet); }
  g.tint(0);
  for (let k = 0; k < 3; k++) { const z = levels[k].z0, y0 = levels[k].y, y1 = levels[k + 1].y; g.quad([-HALF, y0, z], [HALF, y0, z], [HALF, y1, z], [-HALF, y1, z], riser); }
  g.quad([-HALF, STRIP.y, -6.6], [HALF, STRIP.y, -6.6], [HALF, CEIL, -6.6], [-HALF, CEIL, -6.6], wall);
  g.floor(-HALF, -6.6, HALF, HEAD[1], CEIL, ceil, { down: true });
  // the room's two ends, in section: back wall, steps, floor, glass, ceiling
  const sec = [[-6.6, CEIL], [-6.6, STRIP.y], [-5.1, STRIP.y], [-5.1, 2.3], [-2.6, 2.3], [-2.6, 1.75], [-0.1, 1.75], [-0.1, 1.2], [FOOT, 1.2], [HEAD[1], CEIL]];
  for (let i = 1; i < sec.length - 1; i++) {
    g.tri([HALF, sec[0][1], sec[0][0]], [HALF, sec[i][1], sec[i][0]], [HALF, sec[i + 1][1], sec[i + 1][0]], wall);
    g.tri([-HALF, sec[0][1], sec[0][0]], [-HALF, sec[i + 1][1], sec[i + 1][0]], [-HALF, sec[i][1], sec[i][0]], wall);
  }
  // under the water and over it
  g.floor(-GL, FOOT, GL, 5.6, 1.2, rib);
  g.quad([-GL, HEAD[0], HEAD[1]], [GL, HEAD[0], HEAD[1]], [GL, 8.0, -0.4], [-GL, 8.0, -0.4], rib);
  yield 'room';
  // the glazing's frame every 7.67 m: a bar on the inner pane and one a hand proud of the outer, with the water whole
  // between them; and a beam under the ceiling behind each
  const bar = (w0, w1) => { const a = slab(0.8824 * Math.max(w1, 0), w1), b = slab(0.8824 * Math.max(w0, 0), w0), c = slab(SLOPE, w0), d = slab(SLOPE, w1); return [[a[1], a[0]], [b[1], b[0]], [c[1], c[0]], [d[1], d[0]]]; };
  const inBar = bar(WATER - 0.1, WATER), outBar = bar(-0.1, 0.06);
  for (let k = 0; k <= 12; k++) {
    const x = -GL + k * BAY;
    prismX(g, inBar, x - 0.035, x + 0.035, rib); prismX(e, outBar, x - 0.05, x + 0.05, rib);
    g.box(x - 0.14, CEIL - 0.3, -6.6, x + 0.14, CEIL, HEAD[1] - 0.05, '#242120', { skip: 't' });
    if (performance.now() - t0 > 4) { yield 'ribs'; t0 = performance.now(); }
  }
  // bronze to pull yourself along: a rail before the glass, one down each side of every aisle, one along the back wall
  g.tint(1);
  limb(g, [[-HALF + 0.4, 2.0, 2.5], [HALF - 0.4, 2.0, 2.5]], 0.02, 6, brass);
  limb(g, [[-HALF + 0.4, 4.05, -6.48], [HALF - 0.4, 4.05, -6.48]], 0.018, 6, brass);
  for (let x = -GL + BAY / 2; x < GL; x += BAY / 2) g.box(x - 0.02, 1.2, 2.48, x + 0.02, 2.0, 2.52, brass, { skip: 'tb' });
  for (const a of AISLES) for (const s of [-1, 1]) {
    const x = a + s * (AISLE_W / 2 + 0.04);
    limb(g, [[x, STRIP.y + 0.85, -5.13], [x, 2.05, -0.1]], 0.015, 6, brass);
    for (let k = 0; k < 3; k++) g.box(x - 0.012, k === 2 ? STRIP.y : levels[k].y, levels[k].z0 - 0.012 - (k === 2 ? 0.03 : 0), x + 0.012, mix(STRIP.y + 0.85, 2.05, (levels[k].z0 + 5.1) / 5), levels[k].z0 + 0.012 - (k === 2 ? 0.03 : 0), brass, { skip: 'tb' });
    if (performance.now() - t0 > 4) { yield 'rails'; t0 = performance.now(); }
  }
  g.tint(0);
  // red lamps: one on each riser at each aisle, and a stud at the foot of the glass
  for (const a of AISLES) for (let k = 0; k < 4; k++) {
    const y = k < 3 ? levels[2 - k + 1].y - 0.27 : 1.2, z = k < 3 ? levels[2 - k].z0 : 3.3;
    if (k < 3) g.box(a - 0.1, y - 0.03, z, a + 0.1, y + 0.03, z + 0.025, '#ff2a14', { emit: 1.6, skip: 'n' });
    else g.box(a - 0.05, y, z - 0.05, a + 0.05, y + 0.02, z + 0.05, '#ff2a14', { emit: 1.6, skip: 'b' });
    lamps.push({ p: [a, y + (k < 3 ? 0 : 0.04), z + (k < 3 ? 0.05 : 0)], color: '#ff3a1c', power: 0.5, size: 0.09 });
  }
  // the door the armoured car leaves you at, shut, with a line of amber under it
  g.box(-1.6, STRIP.y, -6.6, -0.4, 5.0, -6.55, '#231f1c', { skip: 'nb' });
  g.box(-1.6, STRIP.y, -6.55, -0.4, STRIP.y + 0.012, -6.5, '#ffb060', { emit: 0.5, skip: 'nb' });
  g.box(-1.06, 5.1, -6.6, -0.94, 5.16, -6.57, '#ff2a14', { emit: 1.5, skip: 'n' });
  lamps.push({ p: [-1.0, 5.13, -6.52], color: '#ff3a1c', power: 0.4, size: 0.1 });
  yield 'room';

  // ---- outside: the shell that every gallery of the arc wears
  const shell = '#3b3e45', dark = '#1d1f23', roof = '#2a2c31';
  e.box(-48, 0, -7.4, 48, 1.2, 5.8, shell, { skip: 'tb' });
  e.floor(-48, 5.6, 48, 5.8, 1.2, '#2c2e33'); e.floor(-48, -7.4, 48, -7.2, 1.2, '#2c2e33');
  e.quad([48, 1.2, -7.2], [-48, 1.2, -7.2], [-48, 8.0, -7.2], [48, 8.0, -7.2], shell);
  e.floor(-48, -7.2, 48, -0.4, 8.0, roof);
  const end = [[-7.2, 1.2], [5.6, 1.2], [-0.4, 8.0], [-7.2, 8.0]];
  prismX(e, end, 46, 48, shell); prismX(e, end, -48, -46, shell);
  // the shutter, rolled up over the glass, and its guides down each rib
  e.box(-47.4, 8.0, -2.3, 47.4, 8.8, -0.2, roof, { top: '#34373d', skip: 'b' });
  for (let k = 0; k <= 12; k++) { const x = -GL + k * BAY; e.box(x - 0.3, 8.0, -2.5, x + 0.3, 8.95, 0.0, dark, { skip: 'b' }); }
  for (const x of [-40, -12, 18, 39]) e.box(x - 1.6, 8.0, -6.6, x + 1.6, 8.7, -4.2, '#33363c', { skip: 'b' });
  // where the shielded track comes in at the back, and a short mast at each end with a red lamp on it
  e.box(28.6, 1.2, -9.4, 31.4, 6.2, -7.2, '#33363c', { skip: 'b' });
  for (const x of [-47, 47]) { e.box(x - 0.12, 8.0, -3.6, x + 0.12, 10.4, -3.36, dark, { skip: 'b' }); e.box(x - 0.22, 10.4, -3.7, x + 0.22, 10.7, -3.26, '#ff3a20', { emit: 5 }); lamps.push({ p: [x, 10.55, -3.48], color: '#ff5038', power: 0.8, size: 0.4 }); }
  yield 'shell';
  const shellGeo = e.build();
  return { inner: g.mesh(litMaterial(rig.room, { soft: 0 })), outer: new Mesh(shellGeo, back.lit), shellGeo };
}

// ---------------------------------------------------------------- couches and people
const SKINS = ['#f1c9a5', '#d9a87c', '#b07b52', '#8a5a3a', '#5e3b26', '#e8b894'];
const HAIRS = ['#1b1512', '#2b1d14', '#4a3524', '#6b5338', '#8c8880', '#aca598', '#c2bcb0'];
// clothes as starlight leaves them: what colour there is, greyed
const CLOTHS = ['#7a4438', '#8a6a3c', '#8f8050', '#566a44', '#3f625c', '#3c5270', '#4f466e', '#6e4460', '#9a958a', '#6c675e', '#3e4a54', '#7c4a3e', '#a8a296', '#5c4030', '#465a70', '#8c7a58'];
const COUCHES = ['#4a2620', '#42341f', '#283238', '#343c2c', '#443628', '#38242c', '#2e2c34', '#4c4230'];

// a double couch, reclined for looking up, low enough in the back that a head shows over it, with a strap across
// each lap; its cloth takes the instance's colour
function couchGeo() {
  const g = new Geo(), frame = '#2a2725', strap = '#857b6c';
  g.box(-0.62, 0, -0.32, 0.62, 0.3, 0.3, frame, { skip: 'b' });
  g.tint(1); g.box(-0.76, 0.3, -0.38, 0.76, 0.46, 0.4, '#ffffff', { skip: 'b' });
  g.at(0, 0.44, -0.36); g.rot('x', -0.6);
  g.box(-0.76, 0, -0.07, 0.76, 0.66, 0.07, '#ffffff');
  g.box(-0.72, 0.66, -0.1, -0.06, 0.8, 0.07, '#cfc6b8'); g.box(0.06, 0.66, -0.1, 0.72, 0.8, 0.07, '#cfc6b8');
  g.pop(); g.pop();
  g.tint(1); g.at(0, 0.4, 0.4); g.rot('x', 0.42); g.box(-0.76, -0.07, 0, 0.76, 0.06, 0.66, '#ffffff'); g.pop(); g.pop();
  g.tint(0);
  g.box(-0.8, 0.3, -0.36, -0.74, 0.62, 0.42, frame); g.box(0.74, 0.3, -0.36, 0.8, 0.62, 0.42, frame); g.box(-0.03, 0.46, -0.3, 0.03, 0.6, 0.38, frame);
  for (const s of [-1, 1]) g.box(s * 0.37 - 0.3, 0.66, -0.02, s * 0.37 + 0.3, 0.685, 0.05, strap);
  return g.build();
}

// two bones from a shoulder S to a hand at T, the elbow pushed toward `bend`: the upper and the lower as vectors
function reach(S, T, l1, l2, bend) {
  let v = [T[0] - S[0], T[1] - S[1], T[2] - S[2]], L = Math.hypot(v[0], v[1], v[2]);
  const most = (l1 + l2) * 0.995;
  if (L > most) { v = v.map((q) => (q * most) / L); L = most; }
  const dir = unit(v), a = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const bd = bend[0] * dir[0] + bend[1] * dir[1] + bend[2] * dir[2], perp = unit([bend[0] - dir[0] * bd, bend[1] - dir[1] * bd, bend[2] - dir[2] * bd]);
  const E = [dir[0] * a + perp[0] * h, dir[1] * a + perp[1] * h, dir[2] * a + perp[2] * h];
  return [E, [v[0] - E[0], v[1] - E[1], v[2] - E[2]]];
}
// where a figure's shoulder is, about its pelvis (s = 1 its left, at +x)
const shoulder = (k, lean, s) => [s * 0.175 * k, 0.455 * k * Math.cos(lean), -0.455 * k * Math.sin(lean)];

// One person about the pelvis, facing +z, left at +x. k is 1 for an adult and 0.74 at eight. The pose o gives: lean
// (radians back from upright), face [turn to the left, tilt up], armL and armR and legL and legR as a direction for
// each bone, hair ('crop', 'bob', 'bun', 'tail', 'cloud', 'bald'), and colours. With o.tint the clothes are white
// and take an instance's colour. o.bare[0 or 1] leaves a hand off for the caller to make. Returns wrists and ankles.
function person(g, k, o) {
  const lean = o.lean || 0, sp = [0, Math.cos(lean), -Math.sin(lean)], top = o.tint ? '#ffffff' : o.top, tw = o.tint ? 1 : 0;
  const rr = [0.135, 0.108, 0.15, 0.08], sh = add([0, 0, 0], sp, 0.5 * k), out = { wrist: [], ankle: [], fore: [] }, fine = o.fine || 0, nb = [5, 7, 9][fine], hu = [8, 12, 16][fine], hv = [6, 8, 11][fine];
  g.tint(tw);
  limb(g, [add([0, 0, 0], sp, -0.07 * k), add([0, 0, 0], sp, 0.16 * k), add([0, 0, 0], sp, 0.37 * k), sh], (u) => k * rr[Math.round(u * 3)], [7, 9, 12][fine], top);
  for (const s of [1, -1]) {
    const a = s > 0 ? o.armL : o.armR, S = shoulder(k, lean, s), E = add(S, unit(a[0]), 0.27 * k), W = add(E, unit(a[1]), 0.25 * k);
    g.tint(tw); limb(g, [S, E], (u) => k * (0.054 - 0.01 * u), nb, top); limb(g, [E, add(E, unit(a[1]), 0.21 * k)], (u) => k * (0.043 - 0.007 * u), nb, top);
    if (fine) limb(g, [add(E, unit(a[1]), 0.185 * k), add(E, unit(a[1]), 0.212 * k)], 0.041 * k, nb, top);
    g.tint(0); limb(g, [add(E, unit(a[1]), 0.2 * k), W], (u) => k * (0.031 - 0.004 * u), nb, o.skin);
    if (!(o.bare && o.bare[s > 0 ? 0 : 1])) { const hf = unit(a[1]); limb(g, [W, add(W, hf, 0.03 * k), add(W, hf, 0.075 * k), add(W, hf, 0.1 * k)], (u) => k * [0.027, 0.036, 0.03, 0.012][Math.round(u * 3)], nb, o.skin); }
    out.wrist.push(W); out.fore.push(unit(a[1]));
  }
  for (const s of [1, -1]) {
    const l = s > 0 ? o.legL : o.legR, H = [s * 0.085 * k, -0.02 * k, 0.02 * k], K = add(H, unit(l[0]), 0.41 * k), A = add(K, unit(l[1]), 0.42 * k);
    limb(g, [H, K], (u) => k * (0.08 - 0.02 * u), nb, o.legs); limb(g, [K, A], (u) => k * (0.057 - 0.015 * u), nb, o.legs);
    limb(g, [A, add(A, unit(l[2] || [0, 0.45, 0.9]), 0.15 * k)], 0.043 * k, 4, o.shoe || '#221d1a');
    out.ankle.push(A);
  }
  // neck and head: the head is held up a little even on a reclined back, and turns and tips about the top of the
  // neck, so that a face turned up to the sky goes back over the shoulders
  const rh = k < 0.9 ? 0.094 : 0.105, hn = unit(add(sp, [0, 0.5, 0.15])), hc = add(sh, hn, 0.07 * k), hair = o.hairCol;
  limb(g, [sh, add(sh, hn, 0.12 * k)], 0.046 * k, nb, o.skin);
  g.at(hc[0], hc[1], hc[2], o.face ? o.face[0] : 0); g.rot('x', -(o.face ? o.face[1] : 0)); g.at(0, rh * 0.92, rh * 0.12);
  ball(g, [0, 0, 0], [rh * 0.9, rh * 1.1, rh], o.skin, hu, hv);
  if (o.nose) ball(g, [0, -0.12 * rh, 0.97 * rh], [0.15 * rh, 0.2 * rh, 0.2 * rh], o.skin, 4, 3);
  if (fine) for (const s of [-1, 1]) {
    ball(g, [s * 0.88 * rh, -0.06 * rh, -0.04 * rh], [0.07 * rh, 0.17 * rh, 0.11 * rh], o.skin, 5, 4);
    ball(g, [s * 0.33 * rh, 0.06 * rh, 0.87 * rh], [0.15 * rh, 0.12 * rh, 0.08 * rh], '#140e0b', 6, 4);
  }
  const style = o.hair || 'crop';
  // hair comes forward to the temples and over the brow, so that a face turned up to the sky still has it round it;
  // where nothing has weight it stands off the head in a loose puff
  const puff = o.puff ? (d) => 1.12 + 0.1 * Math.sin(3.3 * d[0] + 4.1 * d[1] + 0.7) + 0.08 * Math.sin(5.2 * d[1] - 3.7 * d[2] + 2.1) + 0.06 * Math.sin(6.1 * d[0] * d[2] + 1.3) : null;
  const long = style === 'bob' || style === 'cloud', line = (d) => d[2] < (long ? 0.34 : 0.16) || (d[1] > (long ? 0.42 : 0.5) && d[2] < 0.86) || d[1] > 0.8;
  if (style !== 'bald') ball(g, [0, rh * 0.08, -rh * 0.08], [rh * 0.99, rh * 1.17, rh * 1.09], hair, o.puff ? 26 : hu, o.puff ? 17 : hv, line, puff);
  if (style === 'bun') ball(g, [0, rh * 0.75, -rh * 0.85], [rh * 0.42, rh * 0.42, rh * 0.42], hair, 5, 4);
  // with no weight a tail of hair stands off the head, and loose hair is a cloud
  if (style === 'tail') limb(g, [[0, rh * 0.5, -rh * 0.9], [0, rh * 1.3, -rh * 1.6], [rh * 0.15, rh * 2.3, -rh * 1.9], [rh * 0.4, rh * 3.2, -rh * 1.8]], (u) => rh * (0.3 - 0.22 * u), 5, hair);
  if (style === 'cloud') for (const q of [[-0.9, 0.5, -0.9], [0.9, 0.6, -0.8], [-0.5, 1.2, -1.0], [0.5, 1.3, -0.9], [0, 0.4, -1.5], [-1.2, -0.3, -0.5], [1.2, -0.2, -0.6]]) limb(g, [[q[0] * rh * 0.5, q[1] * rh * 0.5, q[2] * rh * 0.6], [q[0] * rh * 1.5, q[1] * rh * 1.5 + rh * 0.3, q[2] * rh * 1.6]], (u) => rh * (0.42 - 0.3 * u), 5, hair);
  g.pop(); g.pop(); g.pop();
  out.head = hc; out.sh = sh;
  return out;
}

// a hand. 'flat': open against the glass, its palm at W on the pane, fingers up the slope. 'two': a fist carrying on
// from the wrist W along `fore`, with two fingers up; returns where their tips are
function hand(g, W, fore, kind, k, skin) {
  const f = unit(fore);
  if (kind === 'flat') {
    g.push(new Matrix4().makeBasis(new Vector3(1, 0, 0), new Vector3(0, UY, UZ), new Vector3(0, NY, NZ)).setPosition(W[0], W[1], W[2]));
    g.box(-0.04 * k, -0.045 * k, -0.028 * k, 0.04 * k, 0.04 * k, -0.004 * k, skin);
    for (let i = 0; i < 4; i++) g.box((-0.04 + i * 0.021) * k, 0.04 * k, -0.022 * k, (-0.023 + i * 0.021) * k, (0.1 + (i === 1 || i === 2 ? 0.012 : i === 3 ? -0.014 : 0)) * k, -0.004 * k, skin);
    g.box(0.04 * k, -0.03 * k, -0.022 * k, 0.075 * k, -0.012 * k, -0.004 * k, skin);
    g.pop();
  } else {
    // in the hand's own frame x is toward the thumb, y up the fingers, z away through the palm
    const yaw = Math.atan2(f[0], f[2]), o = add(W, f, 0.012 * k), cy = Math.cos(yaw), sy = Math.sin(yaw), tip = [o[0] + 0.017 * k * cy, o[1] + 0.166 * k, o[2] - 0.017 * k * sy];
    g.at(o[0], o[1], o[2], yaw, k);
    ball(g, [0, 0.036, 0], [0.039, 0.042, 0.017], skin, 10, 7);
    for (const [x, y0, len, r] of [[0.027, 0.066, 0.079, 0.0095], [0.0068, 0.07, 0.086, 0.0098]]) { limb(g, [[x, y0, 0], [x, y0 + len, 0]], r, 8, skin); ball(g, [x, y0 + len, 0], [r, r, r], skin, 8, 5); }
    ball(g, [-0.0135, 0.074, 0.003], [0.0105, 0.0105, 0.011], skin, 7, 5); ball(g, [-0.0325, 0.066, 0.004], [0.0095, 0.0095, 0.01], skin, 7, 5);
    limb(g, [[-0.0135, 0.07, 0.008], [-0.012, 0.04, 0.02]], 0.0095, 6, skin); limb(g, [[-0.0325, 0.062, 0.008], [-0.03, 0.036, 0.019]], 0.0088, 6, skin);
    limb(g, [[0.04, 0.02, 0.004], [0.034, 0.046, 0.017], [0.012, 0.056, 0.024]], 0.0105, 6, skin);
    g.pop();
    return tip;
  }
  return W;
}

// the ways of lying on a couch. s = 1: the other one of the pair is on this one's left
function lying(kind, s) {
  const rest = (q) => [[q * 0.12, -0.92, 0.3], [-q * 0.3, -0.3, 0.9]];
  const legs = { legL: [[0.07, 0.12, 1], [0.02, -0.38, 0.92]], legR: [[-0.07, 0.12, 1], [-0.02, -0.38, 0.92]] };
  const one = (mine) => ({ armL: s > 0 ? mine : rest(1), armR: s < 0 ? mine : rest(-1) });
  if (kind === 'turn') return { lean: 0.55, face: [0.95 * s, 0.05], ...one([[0.9 * s, 0, -0.25], [0.8 * s, -0.2, 0.4]]), ...legs };
  if (kind === 'point') return { lean: 0.5, face: [0.1 * s, 0.4], ...one([[0.25 * s, 0.5, 0.8], [0.1 * s, 0.45, 0.9]]), ...legs };
  if (kind === 'back') return { lean: 0.66, face: [0, 0.5], armL: [[0.85, 0.5, -0.15], [-0.75, 0.55, -0.35]], armR: [[-0.85, 0.5, -0.15], [0.75, 0.55, -0.35]], ...legs };
  if (kind === 'sit') return { lean: 0.1, face: [0.1 * s, 0.36], armL: [[0.2, -0.85, 0.5], [0, -0.6, 0.8]], armR: [[-0.2, -0.85, 0.5], [0, -0.6, 0.8]], legL: [[0.08, 0.05, 1], [0.02, -0.75, 0.65]], legR: [[-0.08, 0.05, 1], [-0.02, -0.75, 0.65]] };
  // sitting up with one arm raised to a floating child's ankle, watching the child and not the sky
  if (kind === 'hold') return { lean: 0.2, face: [0.5 * s, 0.75], ...one(reach(shoulder(1, 0.2, s), [s * 0.42, 0.79, 0.15], 0.27, 0.25, [s * 0.3, -0.4, 0.9])), ...legs };
  return { lean: 0.6, face: [0.08 * s, 0.42], armL: rest(1), armR: rest(-1), ...legs };
}
// who there is to draw many of: eight adults, then six eight-year-olds
const KINDS = [
  { k: 1, kind: 'up', s: 1, skin: 0, hairCol: 4, hair: 'bun', legs: '#3a3f48' }, { k: 1, kind: 'up', s: -1, skin: 2, hairCol: 0, hair: 'crop', legs: '#4a4038' },
  { k: 1, kind: 'turn', s: 1, skin: 1, hairCol: 6, hair: 'crop', legs: '#33363c' }, { k: 1, kind: 'turn', s: -1, skin: 3, hairCol: 1, hair: 'bob', legs: '#473c34' },
  { k: 1, kind: 'point', s: -1, skin: 5, hairCol: 5, hair: 'crop', legs: '#3a3f48' }, { k: 1, kind: 'back', s: 1, skin: 4, hairCol: 4, hair: 'crop', legs: '#2f3b45' },
  { k: 1, kind: 'hold', s: 1, skin: 1, hairCol: 5, hair: 'bun', legs: '#3d3a44' }, { k: 1, kind: 'hold', s: -1, skin: 2, hairCol: 4, hair: 'crop', legs: '#3a3f48' },
  { k: 0.74, kind: 'up', s: 1, skin: 1, hairCol: 1, hair: 'crop', legs: '#4f5f6f' }, { k: 0.74, kind: 'up', s: -1, skin: 3, hairCol: 0, hair: 'tail', legs: '#5a4a3a' },
  { k: 0.74, kind: 'point', s: 1, skin: 0, hairCol: 3, hair: 'bob', legs: '#3f4a55' }, { k: 0.74, kind: 'point', s: -1, skin: 4, hairCol: 0, hair: 'crop', legs: '#4a4f3a' },
  { k: 0.74, kind: 'sit', s: 1, skin: 2, hairCol: 2, hair: 'tail', legs: '#55505a' }, { k: 0.74, kind: 'back', s: 1, skin: 5, hairCol: 1, hair: 'cloud', legs: '#3f4a55' },
];
// front-row couches (block:place) whose child has let go, and how each floats
const FLOAT = { '1:2': 'two', '2:0': 'glass', '0:1': 'a', '2:4': 'b', '3:1': 'c', '3:3': 'a', '4:2': 'b', '5:1': 'c', '5:4': 'a' };

function* seatPeople(scene, rig, lamps) {
  const rng = makeRng('carillon-round'), mat = litMaterial(rig.plain, { soft: 0.12 }), geos = [];
  let t0 = performance.now();
  for (const v of KINDS) {
    const g = new Geo();
    person(g, v.k, { ...lying(v.kind, v.s), tint: true, fine: 1, skin: SKINS[v.skin], hairCol: HAIRS[v.hairCol], hair: v.hair, legs: v.legs });
    geos.push({ geo: g.build(), items: [] });
    if (performance.now() - t0 > 4) { yield 'people'; t0 = performance.now(); }
  }
  // six blocks of couches between five aisles, fewer to a block in the tiers behind: seventy-five couches
  const edges = [-SEATS];
  for (const a of AISLES) edges.push(a - AISLE_W / 2 - 0.1, a + AISLE_W / 2 + 0.1);
  edges.push(SEATS);
  const counts = [[3, 5, 5, 5, 5, 6], [3, 4, 5, 5, 4, 5], [2, 3, 4, 4, 3, 4]], couches = [], floaters = [];
  for (let t = 0; t < 3; t++) for (let b = 0; b < 6; b++) for (let i = 0; i < counts[t][b]; i++) {
    const T = TIERS[t], x = edges[b * 2] + 0.85 + (i / (counts[t][b] - 1)) * (edges[b * 2 + 1] - edges[b * 2] - 1.7);
    const fl = t === 0 ? FLOAT[b + ':' + i] : undefined, sc = fl === 'two' || fl === 'glass' ? 1 : rng.sign();      // sc: which side the child has
    couches.push({ p: [x, T.y, T.row], color: rng.pick(COUCHES) });
    const seat = (s, h) => ({ p: [x + s * 0.37, T.y + h, T.row - 0.2], yaw: rng.f(-0.1, 0.1), scale: rng.f(0.95, 1.05), color: rng.pick(CLOTHS) });
    const r = rng(), q = rng();
    if (fl !== 'two' && fl !== 'glass') geos[fl ? (sc > 0 ? 6 : 7) : r < 0.3 ? (sc > 0 ? 2 : 3) : r < 0.62 ? (sc > 0 ? 0 : 1) : r < 0.76 ? 4 : r < 0.9 ? 5 : (sc > 0 ? 1 : 0)].items.push(seat(-sc, 0.57));
    if (fl) floaters.push({ kind: fl, x, sc, T });
    else geos[q < 0.3 ? (sc > 0 ? 9 : 8) : q < 0.5 ? (sc > 0 ? 8 : 9) : q < 0.66 ? 10 : q < 0.8 ? 11 : q < 0.9 ? 12 : 13].items.push(seat(sc, 0.56));
  }
  for (const v of geos) if (v.items.length) for (const m of instances(v.geo, mat, v.items)) scene.add(m);
  for (const m of instances(couchGeo(), litMaterial(rig.couch, { soft: 0.12 }), couches)) scene.add(m);
  yield 'couches';

  // the children who have let go. Each is held by an ankle; the two the flight looks at closely keep still, the rest sway
  const solid = new Geo(), fmat = litMaterial(rig.plain, { soft: 0.1 }), sway = [], found = { tip: null, palm: null, head: null, pair: null };
  for (const f of floaters) {
    const A = [f.x - f.sc * 0.37, f.T.y + 0.57, f.T.row - 0.2];                                  // where this child's adult sits
    if (f.kind === 'two') {
      solid.at(A[0], A[1], A[2]);
      person(solid, 1, { ...lying('hold', f.sc), fine: 2, nose: true, skin: SKINS[2], hairCol: HAIRS[0], hair: 'crop', top: '#3e4a54', legs: '#3a3f48' });
      solid.pop();
    }
    const k = f.kind === 'two' || f.kind === 'glass' ? 0.74 : 0.74 * rng.f(0.95, 1.06), s = -f.sc, hold = [f.x + f.sc * 0.05, f.T.y + 1.36, f.T.row - 0.05];
    const col = { skin: rng.pick(SKINS), hairCol: rng.pick(HAIRS.slice(0, 4)), top: rng.pick(CLOTHS), legs: rng.pick(['#4f5f6f', '#5a4a3a', '#3f4a55', '#55505a']), nose: true };
    if (f.kind === 'two') Object.assign(col, { skin: SKINS[1], hairCol: HAIRS[1], top: '#8c7a58', fine: 2, puff: true });
    if (f.kind === 'glass') Object.assign(col, { skin: SKINS[0], hairCol: HAIRS[2], top: '#465a70', fine: 2, puff: true });
    const rel = { two: [0.32, 0.23, -0.207], glass: [0.15, 0.46, 0.17], a: [f.sc * 0.1, 0.5, 0.05], b: [f.sc * 0.08, 0.38, 0], c: [f.sc * 0.1, 0.42, -0.25] }[f.kind];
    const pelvis = add(hold, rel), hip = (q) => [q * 0.085 * k, -0.02 * k, 0.02 * k], down = [0, -0.55, 0.83];
    const held = [...reach(hip(s), [-rel[0], -rel[1], -rel[2]], 0.41 * k, 0.42 * k, [0, 0.2, 1]), down];
    const free = [...reach(hip(-s), [-rel[0] - s * 0.2, -rel[1] + 0.06, -rel[2] - 0.13], 0.41 * k, 0.42 * k, [0, 0.3, 1]), down];
    const legs = { legL: s > 0 ? held : free, legR: s > 0 ? free : held }, arm = (S, T, bend) => reach(S, T, 0.27 * k, 0.25 * k, bend);
    if (f.kind === 'two') {
      // upright, the right arm out toward Selkie with two fingers up
      const S = shoulder(k, 0.08, -1), o = { ...col, ...legs, lean: 0.08, face: [-0.12, 0.36], hair: 'bob', armL: [[0.15, -0.9, 0.3], [0, -0.5, 0.85]], armR: arm(S, add(S, unit([-0.252, 0.756, 0.605]), 0.36), [-0.5, -0.7, -0.2]), bare: [false, true] };
      solid.at(pelvis[0], pelvis[1], pelvis[2]);
      const out = person(solid, k, o);
      found.tip = add(pelvis, hand(solid, out.wrist[1], out.fore[1], 'two', k, col.skin)); found.head = add(pelvis, out.head);
      solid.pop();
    } else if (f.kind === 'glass') {
      // stretched up from her couch to lay a hand flat on the glass over it; her adult has her by an ankle, and is
      // watching her and not the sky
      const q = f.sc, grip = [q * 0.28, 0.93, 0.1], P = add(add(A, grip), [q * 0.02, 0.6, 0]), lean = -0.25, yp = 3.9;
      solid.at(A[0], A[1], A[2]);
      person(solid, 1, { ...lying('hold', q), lean: 0.12, face: [0.3 * q, 0.8], [q > 0 ? 'armL' : 'armR']: reach(shoulder(1, 0.12, q), grip, 0.27, 0.25, [q * 0.3, -0.4, 0.9]),
        fine: 2, nose: true, skin: SKINS[5], hairCol: HAIRS[6], hair: 'bun', top: '#7c4a3e', legs: '#3a3f48' });
      solid.pop();
      const palm = [P[0] + q * 0.17, yp, paneZ(yp, WATER)], T = [palm[0] - P[0], palm[1] - 0.05 * k * UY - 0.022 * NY - P[1], palm[2] - 0.05 * k * UZ - 0.022 * NZ - P[2]];
      const up = arm(shoulder(k, lean, q), T, [q * 0.7, -0.5, -0.4]), loose = [[-q * 0.45, -0.75, 0.25], [-q * 0.25, -0.5, 0.7]];
      const gripped = [...reach(hip(-q), [-q * 0.02, -0.6, 0], 0.41 * k, 0.42 * k, [0, 0.2, 1]), down], trailing = [[q * 0.12, -0.9, 0.35], [q * 0.03, -0.85, -0.45], down];
      solid.at(P[0], P[1], P[2]);
      person(solid, k, { ...col, lean, face: [0.05 * q, 0.5], hair: 'tail', armL: q > 0 ? up : loose, armR: q > 0 ? loose : up, legL: q > 0 ? trailing : gripped, legR: q > 0 ? gripped : trailing, bare: [q > 0, q < 0] });
      solid.pop();
      hand(solid, palm, [0, UY, UZ], 'flat', k, col.skin);
      found.pair = [P[0] - q * 0.12, 3.2, 0.95];
      found.palm = palm;
    } else {
      const o = f.kind === 'a' ? { lean: -0.15, face: [0, 0.5], hair: rng.pick(['tail', 'crop']), armL: [[0.3, 0.6, 0.7], [-0.1, 0.7, 0.6]], armR: [[-0.3, 0.6, 0.7], [0.1, 0.7, 0.6]] }
        : f.kind === 'b' ? { lean: 0.25, face: [0.1, 0.62], hair: rng.pick(['cloud', 'bob']), armL: [[0.2, -0.5, 0.8], [-0.5, -0.2, 0.6]], armR: [[-0.2, -0.5, 0.8], [0.5, -0.2, 0.6]] }
          : { lean: 0.9, face: [0, 0.95], hair: rng.pick(['cloud', 'crop']), armL: [[0.9, 0.1, 0.3], [0.7, 0.3, 0.5]], armR: [[-0.9, 0.1, 0.3], [-0.7, 0.3, 0.5]] };
      const g = new Geo();
      g.at(rel[0], rel[1], rel[2]); person(g, k, { ...col, ...legs, ...o }); g.pop();
      const m = g.mesh(fmat);
      m.position.set(hold[0], hold[1], hold[2]);
      scene.add(m); sway.push({ m, y: hold[1], ph: rng.f(0, 6.28) });
    }
    if (performance.now() - t0 > 4) { yield 'floaters'; t0 = performance.now(); }
  }
  // the guide, by the door at the back, with a red hand lamp
  const gp = [0.6, STRIP.y + 0.96, -6.05];
  solid.at(gp[0], gp[1], gp[2], 0.5);
  const go = person(solid, 1, { skin: SKINS[1], hairCol: HAIRS[1], top: '#8a6a3a', legs: '#2f3b45', hair: 'bun', nose: true, lean: 0.03, face: [0.3, 0.12], armL: [[0.2, -0.95, 0.1], [0.05, -0.9, 0.3]], armR: [[-0.2, -0.8, 0.5], [0.5, 0.25, 0.8]], legL: [[0.03, -1, 0.06], [0, -1, -0.04], [0, -0.2, 1]], legR: [[-0.03, -1, 0.02], [0, -1, -0.05], [0, -0.2, 1]] });
  solid.box(go.wrist[1][0] - 0.03, go.wrist[1][1] + 0.05, go.wrist[1][2] + 0.03, go.wrist[1][0] + 0.03, go.wrist[1][1] + 0.11, go.wrist[1][2] + 0.09, '#ff2a14', { emit: 3 });
  solid.pop();
  found.lamp = [gp[0] + 0.05, gp[1] + 0.25, gp[2] + 0.42];
  lamps.push({ p: found.lamp, color: '#ff3a1c', power: 0.8, size: 0.14 });
  scene.add(solid.mesh(fmat));
  yield 'floaters';
  return { sway, ...found };
}

// ---------------------------------------------------------------- outside
// The other six galleries of the arc, in the same shell as this one, three of them still waiting in their red light;
// shielded tracks fanning in to the still side's dock; sleds on the ring tracks, one of them at work and moving.
const ARC = [60, 70, 80, 90, 100, 110, 120], WAITING = [60, 80, 110];
const ring = (r, deg, y = 0) => { const a = (deg * Math.PI) / 180; return [r * Math.cos(a), y, r * Math.sin(a) - AXLE]; };
function* buildOutside(scene, back, shellGeo, sheen) {
  const rig = back.rig, shells = [], blinds = [], far = farLights({ spin: 0, minPx: 1.3, maxPx: 40, reach: 9e9, capacity: 1024 });
  const tr = new Geo(), blind = new Geo(), b0 = slab(0.06, 0.03), b1 = slab(SLOPE - 0.06, 0.03);
  // behind another gallery's glass: nothing to be seen but its red light, if it is still waiting in it
  blind.tint(1); blind.quad([-GL, b0[0], b0[1]], [GL, b0[0], b0[1]], [GL, b1[0], b1[1]], [-GL, b1[0], b1[1]], '#ffffff', 0.18);
  let n = 1;
  for (const deg of ARC) {
    const a = (deg * Math.PI) / 180, yaw = Math.PI / 2 - a, p = ring(AXLE, deg), c = Math.cos(yaw), s = Math.sin(yaw), own = deg === 90;
    const at = (lx, ly, lz) => [p[0] + lx * c + lz * s, ly, p[2] - lx * s + lz * c];          // a point of that gallery
    if (!own) {
      shells.push({ p, yaw }); blinds.push({ p, yaw, color: WAITING.includes(deg) ? '#7a2418' : '#0b0c0e' });
      const glass = new Mesh(sheen.geometry, sheen.material);
      glass.position.set(p[0], p[1], p[2]); glass.rotation.y = yaw; glass.renderOrder = 12;
      scene.add(glass);
      // red light spilt on the panels before a waiting gallery; a red lamp at each end of every one
      if (WAITING.includes(deg) && n < 4) rig.lamp(n++, { p: at(0, 2.5, 19), color: '#ff4028', power: 0.4, reach: 26 });
      for (const lx of [-47, 47]) far.add(...at(lx, 10.55, -3.48), '#ff5038', 3.2, 0.7);
    }
    // its shielded track, on to the dock, with a small lamp every sixty metres
    const from = at(30, 3.1, -9.4), b = Math.atan2(from[2] + AXLE, from[0]), to = [112 * Math.cos(b), 3.1, 112 * Math.sin(b) - AXLE];
    limb(tr, [from, to], 2.6, 8, '#33363c');
    for (let q = 1; q < 8; q++) far.add(mix(from[0], to[0], q / 8), 6.2, mix(from[2], to[2], q / 8), '#cfe0ff', 1.3, 0.5);
    yield 'arc';
  }
  for (const m of instances(shellGeo, back.lit, shells)) scene.add(m);
  for (const m of instances(blind.build(), litMaterial(rig, {}), blinds)) scene.add(m);
  scene.add(tr.mesh(back.lit));
  yield 'arc';
  // the still side: the dock behind the back axle, all its berths shut
  const dock = (yield* dockGeo({})).mesh(back.lit);
  dock.position.set(0, 0, -AXLE);
  scene.add(dock);
  rig.lamp(4, { p: [0, 48, -AXLE + 132], color: '#ffe2b8', power: 2.8, reach: 75 });
  yield 'dock';
  // sleds standing on the ring tracks (every 54 m out from the axle), their lamps lit; and one that is working
  const sled = sledGeo().build(), parked = [], rng = makeRng('carillon-sleds');
  for (const [r, deg] of [[702, 97.5], [810, 71], [864, 104], [918, 86.5], [1026, 112], [1134, 79], [1350, 93], [972, 58], [1242, 126]]) {
    const p = ring(r, deg), a = (deg * Math.PI) / 180, yaw = -Math.PI / 2 - a + (rng.chance(0.5) ? Math.PI : 0), c = Math.cos(yaw), s = Math.sin(yaw);
    parked.push({ p, yaw });
    for (const lz of [-1.9, 1.9]) far.add(p[0] + 4.6 * c + lz * s, 4.7, p[2] - 4.6 * s + lz * c, '#ffe9c8', 4.5, 0.7);
    far.add(p[0] - 4.55 * c, 4.45, p[2] + 4.55 * s, '#ffb060', 2.2, 0.5);
  }
  for (const m of instances(sled, back.lit, parked)) scene.add(m);
  yield 'sleds';
  // crews at work further out, on the side the flight leaves by: a lamp or two each, and the pool it throws on the
  // panels. Ring tracks out to 3,050 m from the axle, straight ones beyond
  const pools = [];
  for (let i = 0; i < 96; i++) {
    const r = i < 46 ? 1300 + 3300 * Math.pow(rng(), 1.15) : 4200 + 8500 * Math.pow(rng(), 1.3), b = ((93 + clamp(rng.gauss() * (i < 46 ? 7 : 11), -24, 24)) * Math.PI) / 180, n = rng.i(1, 3), along = rng.f(-1, 1);
    for (let q = 0; q < n; q++) {
      let x, z;
      if (r < 3000) { const rr = Math.round(r / 54) * 54 + (q === 2 ? 54 : 0), a = b + ((q - along) * rng.f(26, 60)) / rr; x = rr * Math.cos(a); z = rr * Math.sin(a) - AXLE; }
      else { x = r * Math.cos(b) + (q - along) * rng.f(26, 60); z = Math.round((r * Math.sin(b)) / 54) * 54 - AXLE + (q === 2 ? 54 : 0); }
      far.add(x, 4.7, z, rng.pick(['#ffe2b8', '#ffd9a8', '#ffe9c8']), rng.f(3.5, 6.5), 0.8);
      if (rng.chance(0.6)) far.add(x + rng.f(-5, 5), 4.4, z + rng.f(-5, 5), '#ffb060', 2.4, 0.5);
      pools.push([x + rng.f(-4, 4), z + rng.f(-4, 4), rng.f(13, 22), rng.f(0.7, 1.3)]);
    }
  }
  yield 'crews';
  scene.add(poolMesh(pools, litMaterial(rig, { additive: true })));
  yield 'crews';
  rig.lamp(7, { p: [parked[0].p[0], 4.6, parked[0].p[2] + 7], color: '#ffe2b8', power: 1.5, reach: 15 });
  const worker = new Mesh(sled, back.lit);
  scene.add(worker, far.mesh());
  yield 'sleds';
  return {
    /** the working sled creeps round its ring track 156 m out from the glass; its lamp goes with it */
    move(t) {
      const phi = -0.058 + (3.4 * t) / 756, x = 756 * Math.sin(phi), z = 756 * Math.cos(phi) - AXLE;
      worker.position.set(x, 0, z); worker.rotation.y = phi;
      rig.lamp(0, { p: [x + 7 * Math.cos(phi), 4.6, z - 7 * Math.sin(phi)], color: '#ffe2b8', power: 1.9, reach: 17 });
    },
  };
}

// Pools of lamplight on the panels, for lamps too many and too far off to be among the rig's eight: a disc for each
// [x, z, radius, strength], bright in the middle and nothing at the rim, added to what the plain already shows.
function poolMesh(list, material) {
  const pos = [], nrm = [], col = [], emit = [], n = 14, c = [26, 19, 12, 0];
  const put = (x, z, e) => { pos.push(x, 0.25, z); nrm.push(0, 1, 0); col.push(c[0], c[1], c[2], c[3]); emit.push(e); };
  for (const [x, z, r, e] of list) for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 6.2832, a1 = ((i + 1) / n) * 6.2832, s0 = Math.sin(a0), c0 = Math.cos(a0), s1 = Math.sin(a1), c1 = Math.cos(a1), h = r * 0.42;
    put(x, z, 1.3 * e); put(x + s0 * h, z + c0 * h, 0.45 * e); put(x + s1 * h, z + c1 * h, 0.45 * e);
    put(x + s0 * h, z + c0 * h, 0.45 * e); put(x + s0 * r, z + c0 * r, 0); put(x + s1 * r, z + c1 * r, 0);
    put(x + s0 * h, z + c0 * h, 0.45 * e); put(x + s1 * r, z + c1 * r, 0); put(x + s1 * h, z + c1 * h, 0.45 * e);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('aCol', new Uint8BufferAttribute(col, 4, true)); g.setAttribute('aEmit', new Float32BufferAttribute(emit, 1));
  g.boundingSphere = new Sphere(new Vector3(0, 0, 2000), 6000);
  material.polygonOffset = true; material.polygonOffsetFactor = -2; material.polygonOffsetUnits = -8;
  const mesh = new Mesh(g, material);
  mesh.renderOrder = 4;
  return mesh;
}

// ---------------------------------------------------------------- Selkie
// Another raft: a flat black shape a little uneven at the edge, lying level. It is made the size of the opening the
// flight ends in (half-width `a` metres), as a rim round that opening and a fill for before the opening is shown.
function buildSelkie(mat, a) {
  const n = 60, b = a * SQUASH, rim = new Geo(), fill = new Geo(), black = '#000000';
  const edge = (i) => { const t = (i / n) * 6.2832, c = Math.cos(t), s = Math.sin(t), r = (1.04 / Math.pow(Math.pow(Math.abs(c), 2.3) + Math.pow(Math.abs(s), 2.3), 1 / 2.3)) * (1 + 0.014 * Math.sin(3 * t + 1.3) + 0.008 * Math.sin(7 * t + 0.4)); return [[c * a * 0.985, s * b * 0.985, 0], [c * a * r, s * b * r, 0]]; };
  for (let i = 0; i < n; i++) {
    const p = edge(i), q = edge(i + 1);
    rim.quad(p[0], p[1], q[1], q[0], black);
    fill.tri([0, 0, 0], p[0], q[0], black);
  }
  const group = new Group(), fm = fill.mesh(mat);
  group.add(rim.mesh(mat), fm);
  return { group, fill: fm };
}

// ---------------------------------------------------------------- the flight
function flight(found) {
  const dv = skyDir(SELKIE[0], SELKIE[1]), d = [dv.x, dv.y, dv.z];
  const aim = (p, bearing, elev, L = 40) => { const q = skyDir(bearing, elev); return [p[0] + q.x * L, p[1] + q.y * L, p[2] + q.z * L]; };
  const on = (t, p, more) => ({ t, p, look: add(p, d, 40), ...more });                          // looking at Selkie
  const pan = (t, p, bearing, elev, more) => ({ t, p, look: aim(p, bearing, elev), ...more });
  // looking at a thing: every look is a point forty metres off, so that the curve through them keeps its shape
  const at = (t, p, q, more) => ({ t, p, look: add(p, unit([q[0] - p[0], q[1] - p[1], q[2] - p[2]]), 40), ...more });
  // from just behind the measuring child's shoulder her two fingers stand under Selkie, and are as wide as it is
  const hero = add(add(found.tip, [0, 0.0065, 0]), d, -0.5);
  const girl = found.pair;                                                                    // the child at the glass, and her adult
  const keys = [
    // from the back wall, over the heads of the last row; down the aisle until the child at the glass stands against
    // the River; then up and across over the second tier
    { t: 0, p: [XA, 3.95, -6.3], fov: 62 },
    at(3.6, [XA - 0.1, 3.3, -3.7], [girl[0] + 0.1, 3.6, 1.0], { fov: 62 }),
    at(6.4, [XA - 0.3, 2.75, -1.7], [girl[0] + 0.1, 3.6, 1.0], { fov: 56 }),
    pan(8.3, [XA - 0.5, 3.5, -2.1], 76, 14, { fov: 60 }),
    pan(10.3, [-23.0, 3.7, -2.3], 90, 2, { fov: 62 }),
    pan(12.5, [-26.83, 3.4, -2.2], 95.5, 9, { fov: 60 }),
    // onto the line of the other child's sight, and slowly up it: her two fingers stay under Selkie all the way in
    on(14.2, add(hero, d, -1.5), { fov: 56 }),
    on(15.2, add(hero, d, -1.1), { fov: 54 }),
    on(17.6, hero, { fov: 52 }),
    on(19.1, [hero[0] - 0.33, hero[1] + 0.2, hero[2] + 0.47], { fov: 55 }),
    on(20.1, [hero[0] - 0.37, 3.75, paneZ(3.75, WATER)], { fov: 52 }),                       // the inner pane
    on(20.8, [hero[0] - 0.445, 4.035, (paneZ(3.75, WATER) + paneZ(4.32, 0)) / 2], { fov: 44 }),
    on(21.5, [hero[0] - 0.52, 4.32, paneZ(4.32, 0)], { fov: 46 }),                           // the outer pane
    on(22.9, [hero[0] - 0.8, 5.05, 5.0], { fov: 64 }),
    // once right round, to the left: the River's foot; this gallery's own glass with the River lying in it; in close
    // to the child at the glass and the adult watching her; the whole room; the arc and the dock from higher; the
    // River's other foot, and up it to Selkie
    pan(25.6, [-27.0, 5.8, 8.6], 55, 12, { fov: 66 }),
    pan(28.3, [-25.2, 5.9, 10.9], 11, 5, { fov: 66 }),
    pan(31.1, [-22.8, 5.2, 11.8], -37, -8, { fov: 60 }),
    at(33.5, [girl[0] - 1.7, 4.0, 7.0], girl, { fov: 40 }),
    at(35.9, [girl[0] + 0.9, 3.6, 6.3], [girl[0], girl[1] - 0.25, girl[2]], { fov: 31 }),
    at(38.2, [-13.5, 6.2, 13.5], [-17.5, 4.4, -2], { fov: 50 }),
    at(40.4, [-7, 13, 25], [-20, 3.5, -5], { fov: 58 }),
    pan(42.7, [0, 24, 41], -150, -9, { fov: 64 }),
    pan(45.0, [6, 33, 56], 168, 0, { fov: 64 }),
    pan(47.1, [11, 40, 70], 128, 6, { fov: 63 }),
  ];
  // The run at Selkie, in two parts. First low over the plain, gathering speed and bending upward, the look rising
  // from the horizon to the black shape. Then, from J, dead along the line to it, easing down to the speed its
  // opening is crossed at, so that it grows steadily: the rate k is found so that from J it stands three degrees wide.
  const R = 14, vE = 1.15 * R, T = 9, D0 = R / Math.tan(((SELKIE_DEG / 2) * Math.PI) / 180), h = 0.01;
  let lo = 0.02, hi = 1.5;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if ((vE / mid) * (Math.exp(mid * T) - 1) < D0) lo = mid; else hi = mid; }
  const k = (lo + hi) / 2, vJ = vE * Math.exp(k * T), t0 = 49.3, tJ = t0 + 5.4, hz = unit([d[0], 0, d[2]]), eS = (SELKIE[1] * Math.PI) / 180;
  let q = [14, 44, 84];
  for (let n = 0, every = 60; n * h < tJ - t0 + h / 2; n++) {
    const u = (n * h) / (tJ - t0), v = mix(7, vJ, smootherstep(0, 1, u)), phi = mix(0.06, eS, smoothstep(0, 1, u));
    if (n % every === 0 && u < 0.999) keys.push(pan(t0 + n * h, q.slice(), SELKIE[0], mix(7, SELKIE[1], smoothstep(0.05, 0.9, u)), { fov: mix(62, 56, u) }));
    q = [q[0] + hz[0] * v * Math.cos(phi) * h, q[1] + v * Math.sin(phi) * h, q[2] + hz[2] * v * Math.cos(phi) * h];
  }
  const J = q, port = add(J, d, D0), left = (tau) => (vE / k) * (Math.exp(k * tau) - 1);       // metres still to go, tau seconds before the opening
  keys.push(on(tJ, J, { fov: 56 }));
  for (let tau = T - 0.7; tau >= 1.5; tau -= 0.7) keys.push({ t: tJ + T - tau, p: add(port, d, -left(tau)), fov: tau > 4 ? 56 : 58 });
  keys.push({ t: tJ + T - 0.8, p: add(port, d, -left(0.8)), fov: 58 }, { t: tJ + T, p: port, fov: 58 }, { t: tJ + T + 0.8, p: add(port, d, 0.8 * vE), fov: 58 });
  const path = makePath(keys, { up: [0, 1, 0], entryRadius: 0.8, exitRadius: R, entryDir: [0, 0.087, 0.996], exitDir: d, fov: 58 });
  return { path, tJ, port, d: dv, D0, R, hero };
}

// ---------------------------------------------------------------- the world
export const carillonWindow = {
  id: 'carillon-window',
  title: 'Selkie, two fingers wide', drum: 'Carillon', row: 'Bell Row', kind: 'a hall drum', light: 32.6,
  line: 'Every child who comes back from the Window this week holds two fingers up at arm\'s length, to show you how wide Selkie is. Ask them about the River and they can\'t say.',
  tone: '#d9c29a', source: 'wander-year.md (Day 140), ashgrove.md (Day four), sorrel.md (Beyond the drum)',
  sound: { root: 50, scale: 'mixo', pad: 0.16, air: 0.03, hum: 0.07, water: 0, crowd: 0, choir: 0.3, bells: 0, bright: 0.15 },
  *build(ctx) {
    const scene = new Scene();
    const sky = yield* buildSky(ctx, { apex: RIVER, seed: 'the-river', rafts: 0.1, stars: 170000 });
    scene.add(sky.group);
    yield 'sky';
    // the plain, the docks out to the horizon and far sleds are the kit's, moved so that this gallery is the origin
    const back = yield* buildBack(ctx, { sky, rig: backRig({ riverDir: skyDir(RIVER[0], RIVER[1]), riverPower: 0.06 }), focus: [0, AXLE / RAFT.CELL], galleries: 0, shine: 1.1, hub: 6 });
    back.group.position.set(0, -Y, -AXLE);
    // Nothing is ever behind the plain, so it need not be in the depth buffer; and it must not be, here. Its corners
    // are thousands of kilometres off, where a number cannot hold the near plane's few centimetres, so with the eye
    // in a room (near = 0.12) the sheet lands nearer than it lies and shows through the floor of the gallery.
    back.plain.material.depthWrite = false;
    scene.add(back.group);
    yield 'plain';
    const rig = windowRig(sky), lamps = [];
    const room = yield* buildRoom(rig, back, lamps);
    scene.add(room.inner, room.outer);
    const glass = buildGlass(sky);
    scene.add(glass.water, glass.sheen, glass.caustics);
    yield 'glass';
    const folk = yield* seatPeople(scene, rig, lamps);
    rig.uniforms.uHand.value = [folk.lamp[0], folk.lamp[1], folk.lamp[2], 1.3];
    const out = yield* buildOutside(scene, back, room.shellGeo, glass.sheen);
    for (const x of [-47, 47]) back.rig.lamp(x < 0 ? 5 : 6, { p: [x, 10.4, -3.2], color: '#ff5038', power: 0.45, reach: 8 });
    scene.add(glowPoints(lamps, { maxPx: 90, soft: 1.8 }));
    yield 'lamps';
    const fl = flight(folk), path = fl.path;
    yield 'flight';
    // motes in the water of the bay the flight leaves by: too small to see from the room, bright when the eye is among them
    const mrng = makeRng('motes'), motes = [];
    for (let i = 0; i < 1800; i++) {
      const q = slab(mrng.f(2.9, 6.0), mrng.f(0.05, 1.45));
      motes.push({ p: [fl.hero[0] - 0.45 + mrng.f(-1.7, 1.7), q[0], q[1]], color: mrng.pick(['#ffe9c8', '#e8f0e0', '#fff4e0']), power: mrng.f(0.12, 0.5), size: mrng.f(0.002, 0.006), move: [mrng.f(-0.006, 0.006), mrng.f(-0.004, 0.004), mrng.f(-0.004, 0.004)], loop: mrng.f(14, 30), twinkle: 0.5 });
    }
    yield 'motes';
    scene.add(glowPoints(motes, { minPx: 1.1, maxPx: 34, soft: 1.5 }));
    yield 'motes';
    // Selkie: kept at one place in the sky until the flight turns to it, then left standing where the opening is
    const selkie = buildSelkie(back.litBoth, fl.R), port = new Vector3(fl.port[0], fl.port[1], fl.port[2]), dS = fl.d;
    selkie.group.quaternion.copy(path.exit.quat);
    scene.add(selkie.group);
    out.move(0);
    yield 'selkie';
    const look = { exposure: 3.4, bloom: 0.32, threshold: 0.7, vignette: 0.45, saturation: 1.1, gain: [1, 1, 1] };
    // the eye opens a little more when it turns from the sky to the dark room behind the glass
    const EXPO = [[0, 3.5], [21.3, 3.5], [23.3, 3.3], [29.3, 3.4], [32.8, 5.4], [37.4, 5.4], [42.8, 3.5], [47.8, 3.3], [70, 3.3]];
    const tmp = new Vector3();
    let gate = null;
    return {
      scene, path, sky, back, near: 0.12, far: RAFT.FAR, look,
      portal: { rim: false, mist: '#000000', openFor: 4.3 },
      update(t, dt, camera) {
        const cp = camera.position, going = t >= fl.tJ, time = G.uTime.value;
        // the opening the engine hangs at the end of the flight: squashed to Selkie's shape, and not shown until the
        // flight is on the line to it
        if (!gate) gate = scene.children.find((o) => o.isMesh && o.material && o.material.uniforms && o.material.uniforms.tNext) || null;
        if (gate) { gate.visible = going; gate.scale.set(1, SQUASH, 1); }
        selkie.fill.visible = !going || !gate;
        if (going) selkie.group.position.copy(port).addScaledVector(dS, 0.6);
        else selkie.group.position.copy(cp).addScaledVector(dS, fl.D0);
        // the near plane: close work in the room, the far plain outside, and never beyond the opening
        const clear = Math.hypot(Math.max(Math.abs(cp.x) - 48, 0), Math.max(cp.y - 8.9, 0), Math.max(cp.z - 5.8, -7.4 - cp.z, 0));
        let near = clamp(0.12 + (clear - 1.5) * 0.14, 0.12, 1.5);
        if (cp.y > 60) near = mix(1.5, 6, smoothstep(60, 400, cp.y));
        near = Math.min(near, Math.max(0.12, 0.25 * tmp.copy(port).sub(cp).dot(dS)));
        if (Math.abs(near - camera.near) > 1e-4) { camera.near = near; camera.updateProjectionMatrix(); }
        // in the water the picture cools and blooms
        const w = -((cp.y - 1.2) * NY + (cp.z - 5.6) * NZ), wet = Math.abs(cp.x) < GL ? smoothstep(-0.04, 0.08, w) * smoothstep(WATER + 0.04, WATER - 0.08, w) : 0;
        look.gain[0] = 1 - 0.26 * wet; look.gain[1] = 1 - 0.05 * wet; look.gain[2] = 1 + 0.02 * wet;
        look.bloom = 0.32 + 0.3 * wet;
        glass.caustics.visible = Math.abs(cp.x) < GL + 2 && w > -2.2 && w < WATER + 2.2;
        let e = 0; while (e < EXPO.length - 2 && t > EXPO[e + 1][0]) e++;
        look.exposure = mix(EXPO[e][1], EXPO[e + 1][1], smoothstep(EXPO[e][0], EXPO[e + 1][0], t));
        // children on their tethers, and the sled at its work
        for (const f of folk.sway) { f.m.rotation.x = 0.05 * Math.sin(time * 0.31 + f.ph); f.m.rotation.z = 0.06 * Math.sin(time * 0.23 + f.ph * 2); f.m.position.y = f.y + 0.012 * Math.sin(time * 0.4 + f.ph); }
        out.move(t);
      },
    };
  },
};
