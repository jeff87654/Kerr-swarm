// Outside: the raft and the sky behind it. The one place where the immensity is of drums rather than of a drum.
//
// Nothing here is bent. It is open space in plain world coordinates, in metres:
//   x  along a row of drums          z  along a column (from row to row)
//   y  aft: 0 is the rectenna layer (the front, toward the Lantern), DEPTH = 3,750 is the radiator layer, and
//      everything above that is behind the raft, under the sky. A camera's up is +y in both places.
// Drum (i, j) stands on the line x = i * CELL, z = j * CELL: a squat column from layer to layer. Every drum turns the
// same way, +OMEGA about +y, so its +z side moves toward +x. Hence the Glide's lanes (raft-transport.md, The Glide):
//   the lane on the +z side of a row runs toward +x, the one on its -z side toward -x;
//   the lane on the +x side of a column runs toward -z, the one on its -x side toward +z.
// There are nine lane levels along a drum's length, LEVELS[0..8], Ring One at the front to Ring Nine at the back
// (sorrel.md, The nine Rings): rows glide on Rings One, Three, Seven and Nine, columns on Two, Four, Six and Eight, and
// Ring Five is the shielded tube. A hop is one CELL in 140 s; trains leave a SLOT (350 m, two seconds) apart.
//
// What the kit gives a world (generators are marked *: call them with yield*):
//  the mid-raft, as a glide car sees it (worlds/the_glide.js is the worked example)
//   buildHall*(ctx, opts)     both layers, some 5,100 drums out to forty cells from the camera's, their quay lights,
//                             the trains on every lane, truss lights, the Yards, and the glow on the horizon line
//   nearDrum*(opts)           one drum to stand beside: its flank, the ledges of its nine quays, up to 4,320 lamps
//   quayPiece*(opts)          a stretch of one quay close to: band, rails, lamp posts, cradles, trains, a tunnel
//   trainGeo(into, from, to)  a 1,000-seat train        nearTrains(lanes)   real trains standing on the painted ones
//   laneRibbon(opts), laneNumber(), trainSlots(), trainAt()     one lane on its own clock; which slots hold trains
//   farLights(opts)           any number of far lamps as points, drawn a little toward the eye (see below)
//  behind the raft (worlds/ochre_backcrew.js)
//   buildSky*(ctx, opts)      the River, the Shelf, the dust the crews call bruise, other rafts as black shapes
//   buildBack*(ctx, opts)     the radiator layer from behind, to a flat horizon: panel rows, service tracks, trunk
//                             pipes, a dock's lights at every back axle, sleds' lamps
//   backRig(opts)             light for things standing there: up to eight work lamps, and the River
//   sledGeo(), galleryGeo(), dockGeo*()      a back crew's closed sled; a Window; the still side's dock
//   skyDir(bearing, elevation)               a direction in that sky
//
// Far planes. Seen from a quay the hall runs out to about 1,000 km, so a world built on this kit sets far = RAFT.FAR
// (1.3e6) and near = 1.5 to 2.5. That is far beyond ARCHITECTURE.md's far/near of 30,000, and it is safe here for two
// reasons: depth resolution at a distance d is about d * d / (near * 2^24) whatever far is (10 m at 20 km with near =
// 2.5), and every small light in this file is drawn a little nearer the eye than it stands (PULL, below), so it never
// fights the surface it is mounted on. Keep the camera 1.5 x near away from anything solid, and use farLights() rather
// than the kit's glowPoints() for anything more than a few hundred metres off.
//
// By canon nobody is seen out here. The hall is flooded with hard X-rays and the back takes the glow of other rafts:
// people are inside trains, sleds, galleries and docks, and what shows of them is lamps and windows. The hall has no
// stars (the layers hide the sky), and radiators at 283 to 330 K give off nothing an eye can see.
import {
  BufferGeometry, Float32BufferAttribute, Uint8BufferAttribute, Mesh, Points, ShaderMaterial, Vector2, Vector3, Vector4, Group, Color, Matrix3, Matrix4,
  DoubleSide, FrontSide, AdditiveBlending, InstancedMesh, Sphere,
} from 'three';
import { G, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, CELL_GLSL, plainRig, lampRig, litMaterial, glowPoints, vec3col } from './mats.js';
import { makeFrame } from './drum.js';
import { Geo, instances, rgb } from './geo.js';
import { makeRng, cellRand } from '../core/rng.js';

export const RAFT = {
  CELL: 24500,      // spacing of drums on the square grid, m
  DEPTH: 3750,      // rectenna layer to radiator layer: a drum's length
  HULL: 3000,       // the rim deck
  FLANK: 3046,      // the moat's outer wall: what a drum's side looks like from outside
  QUAY: 3050,       // the band of track round the waist
  LANE: 3058,       // the line a released train falls along: 8 m out from the quay's face, where trains hang
  SPEED: 174.4,     // m/s: the quay's speed, and every train's
  OMEGA: 0.0572,    // rad/s: one turn in 110 s
  SLOT: 350,        // metres between trains at the peak: two seconds
  SLOTS: 70,        // slots to a hop (70 x 350 m = one CELL)
  TRAIN: 100,       // a 1,000-seat train, m
  FAR: 1.3e6,       // what a world's far plane should be
};
export const HOP = RAFT.CELL / RAFT.SPEED;                                             // 140.5 s
export const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ((2 * i + 1) * RAFT.DEPTH) / 18);    // Ring One .. Ring Nine
export const ROW_LEVELS = [0, 2, 6, 8];       // Rings One, Three, Seven, Nine: along the row
export const COL_LEVELS = [1, 3, 5, 7];       // Rings Two, Four, Six, Eight: along the column
export const TUBE_LEVEL = 4;                  // Ring Five: the tubes

// Colours of quay light. The docs give every drum a ring of quay lights and say nothing of their colour; the kit lets
// drums differ a little, as they do in everything else. Mostly warm.
export const QUAY_TINTS = ['#ffb86a', '#ffc98a', '#ffd9a8', '#ffe9c8', '#ffa862', '#ffcf9a', '#fff0d8', '#ffbe7a', '#e8e2ff', '#c8f0e8', '#ffb0a0', '#ffd27a'];
/** the colour of drum (i, j)'s quay lights. tints = { 'i,j': n } gives a drum the n-th of QUAY_TINTS instead of the kit's choice */
export function quayTint(i, j, tints) {
  const k = i + ',' + j;
  if (tints && tints[k] !== undefined) return QUAY_TINTS[tints[k]];
  return QUAY_TINTS[Math.floor(cellRand(i, j)[0] * QUAY_TINTS.length)];
}

// ---------------------------------------------------------------- shared shader text
// Small lights are drawn this fraction of their distance nearer the eye (at most uPull.y metres), which leaves them
// exactly where they were on screen and in front of whatever they are fixed to.
const PULL = /* glsl */`
uniform vec2 uPull;
vec4 kPull(vec4 mv) { float d = length(mv.xyz); mv.xyz *= 1.0 - min(uPull.x, uPull.y / max(d, 1.0)); return mv; }`;

// ---------------------------------------------------------------- far lights
// Any number of small lights in one draw call, as points (no triangles): quay lamps on far drums, truss lights, lamps
// on the radiator plain. Like glowPoints, a light too far off to fill a pixel dims instead of shrinking. Unlike
// glowPoints, a light can ride round a drum's axis with its quay, and is put out when its side of the drum faces away.
const FAR_VERT = /* glsl */`
attribute vec4 aAxis;     // the axis it turns about: x, z; its radius from that axis; its y
attribute vec3 aTurn;     // angle at time 0, kind (0 free, 1 on a turning drum, 2 on a drum but not turning), twinkle
attribute vec4 aColSize;  // rgb x strength, size in metres
uniform float uTime, uPx, uMinPx, uMaxPx, uSpin, uReach, uPower;
#ifdef MOVING
attribute vec4 aMove;     // velocity (m/s) and the seconds before it starts over (0 = still)
#endif
${PULL}
varying vec3 vW; varying vec3 vC;
void main() {
  float a = aTurn.x + (aTurn.y > 0.5 && aTurn.y < 1.5 ? uSpin * uTime : 0.0);
  vec3 n = vec3(sin(a), 0.0, cos(a));
  vec3 p = vec3(aAxis.x, aAxis.w, aAxis.y) + n * aAxis.z;
  float going = 1.0;
  #ifdef MOVING
    if (aMove.w > 0.0) { float u = fract(uTime / aMove.w + fract(aAxis.x * 0.0137 + aAxis.y * 0.0071)); p += aMove.xyz * (u * aMove.w); going = smoothstep(0.0, 0.05, u) * smoothstep(1.0, 0.95, u); }
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vec3 toEye = cameraPosition - wp.xyz;
  float dist = length(toEye);
  float face = aTurn.y > 0.5 ? smoothstep(-0.08, 0.22, dot(normalize(mat3(modelMatrix) * n), toEye / dist)) : 1.0;
  float px = aColSize.w * uPx / dist;
  float shown = clamp(px, uMinPx, uMaxPx);
  float k = min((px * px) / (shown * shown), 1.0);
  float tw = 1.0 + aTurn.z * sin(uTime * (0.7 + 1.9 * fract(aTurn.x * 7.31)) + aTurn.x * 40.0);
  vC = aColSize.rgb * k * face * tw * going * uPower * exp(-dist / uReach);
  gl_PointSize = shown;
  gl_Position = projectionMatrix * kPull(viewMatrix * wp);
  if (face <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const FAR_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uSoft;
varying vec3 vW; varying vec3 vC;
void main() {
  ${CLIP_FRAG}
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(max(1.0 - r, 0.0), uSoft);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;

/**
 * A cloud of far lights. Fill it with add(), then call mesh() once.
 *   add(x, y, z, colour, power, size, twinkle, move)           a light that stays where it is, or (with opts.moving)
 *                                                              travels: move = [vx, vy, vz, seconds before it starts over]
 *   ring(cx, cz, y, radius, angle, colour, power, size, turn)  a lamp on a drum's quay: turn = true rides round with the drum
 * opts: minPx (default 1.3), maxPx (64), soft (1.7), spin (rad/s, default OMEGA), reach (metres over which the hall
 * swallows a light: drums stand in the way; default 9e5), power, pull [fraction, metres], moving, capacity (how many
 * lights to make room for at the start)
 */
export function farLights(opts = {}) {
  // the lights are written straight into arrays of numbers, which double when full (opts.capacity saves the doubling)
  let cap = opts.capacity || 4096, n = 0;
  let axis = new Float32Array(cap * 4), turn = new Float32Array(cap * 3), cs = new Float32Array(cap * 4), mv = opts.moving ? new Float32Array(cap * 4) : null;
  const wider = (a, k) => { const b = new Float32Array(cap * k); b.set(a); return b; };
  const put = (cx, cz, r, y, a, kind, colour, power, size, tw, move) => {
    if (n === cap) { cap *= 2; axis = wider(axis, 4); turn = wider(turn, 3); cs = wider(cs, 4); if (mv) mv = wider(mv, 4); }
    const c = rgb(colour), i = n * 4, j = n * 3;
    axis[i] = cx; axis[i + 1] = cz; axis[i + 2] = r; axis[i + 3] = y;
    turn[j] = a; turn[j + 1] = kind; turn[j + 2] = tw || 0;
    cs[i] = c[0] * power; cs[i + 1] = c[1] * power; cs[i + 2] = c[2] * power; cs[i + 3] = size;
    if (mv && move) { mv[i] = move[0]; mv[i + 1] = move[1]; mv[i + 2] = move[2]; mv[i + 3] = move[3]; }
    n++;
  };
  return {
    get count() { return n; },
    add(x, y, z, colour, power, size, twinkle, move) { put(x, z, 0, y, 0, 0, colour, power, size, twinkle, move); },
    ring(cx, cz, y, radius, angle, colour, power, size, rides) { put(cx, cz, radius, y, angle, rides === false ? 2 : 1, colour, power, size, 0); },
    mesh() {
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute('aAxis', new Float32BufferAttribute(axis.subarray(0, n * 4), 4));
      g.setAttribute('aTurn', new Float32BufferAttribute(turn.subarray(0, n * 3), 3));
      g.setAttribute('aColSize', new Float32BufferAttribute(cs.subarray(0, n * 4), 4));
      if (mv) g.setAttribute('aMove', new Float32BufferAttribute(mv.subarray(0, n * 4), 4));
      g.boundingSphere = new Sphere(new Vector3(), 1e9);
      const m = new ShaderMaterial({
        defines: opts.moving ? { MOVING: 1 } : {},
        uniforms: {
          uClip: G.uClip, uTime: G.uTime, uPx: G.uPx,
          uMinPx: { value: opts.minPx === undefined ? 1.3 : opts.minPx }, uMaxPx: { value: opts.maxPx || 64 }, uSoft: { value: opts.soft || 1.7 },
          uSpin: { value: opts.spin === undefined ? RAFT.OMEGA : opts.spin }, uReach: { value: opts.reach || 9e5 }, uPower: { value: opts.power === undefined ? 1 : opts.power },
          uPull: { value: new Vector2(opts.pull ? opts.pull[0] : 0.004, opts.pull ? opts.pull[1] : 400) },
        },
        vertexShader: FAR_VERT, fragmentShader: FAR_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
      });
      const mesh = new Points(g, m);
      mesh.frustumCulled = false; mesh.renderOrder = 9;
      return mesh;
    },
  };
}

// ---------------------------------------------------------------- the two layers
// The rectenna layer (y = 0, seen from behind) and the radiator layer (y = DEPTH, seen from below: "a ceiling over
// the world"). Each is one sheet to the horizon. Nothing lights them but the drums: every drum throws a collar of its
// own quay light onto both, and at a grazing angle they give back the glow of everything beyond.
const SHEET_VERT = /* glsl */`
varying vec3 vW; varying vec3 vL;
void main() { vL = position; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const TINT_GLSL = /* glsl */`
uniform vec3 uTints[12]; uniform vec4 uOver[4];
vec3 kQuayTint(vec2 ci) {
  float k = floor(kCell(ci).x * 12.0);
  for (int i = 0; i < 4; i++) if (uOver[i].w > 0.5 && abs(uOver[i].x - ci.x) < 0.5 && abs(uOver[i].y - ci.y) < 0.5) k = uOver[i].z;
  return uTints[int(clamp(k, 0.0, 11.0))];
}`;
const LAYER_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uBase, uTruss, uSheen; uniform float uCollar, uRingOff, uCell;
varying vec3 vW; varying vec3 vL;
${NOISE_GLSL}
${CELL_GLSL}
${TINT_GLSL}
float kLine(float x, float period, float w, float px) {
  float d = abs(fract(x / period + 0.5) - 0.5) * period;
  return smoothstep(w * 0.5 + px, w * 0.5, d) * clamp(w / px, 0.0, 1.0);
}
void main() {
  ${CLIP_FRAG}
  vec2 m = vL.xz;                                               // the sheet's own metres: a world may turn the whole hall
  float px = max(length(dFdx(m)), length(dFdy(m)));
  vec3 V = cameraPosition - vW; float dist = length(V); V /= dist;
  vec2 ci = floor(m / uCell + 0.5);
  vec2 d = m - ci * uCell; float rho = length(d);
  // the sheet itself: bays of truss, each a little different, with chords every 245 m and every 1,225 m
  vec2 bay = floor(m / 245.0);
  float tone = 0.75 + 0.5 * kHash(bay) * smoothstep(400.0, 60.0, px);
  vec3 c = uBase * tone * (0.8 + 0.4 * kNoise(m / 3100.0));
  float lines = max(kLine(m.x, 245.0, 5.0, px), kLine(m.y, 245.0, 5.0, px)) * 0.6 + max(kLine(m.x, 1225.0, 16.0, px), kLine(m.y, 1225.0, 16.0, px));
  c += uTruss * lines;
  // each drum's collar of quay light, in that drum's colour
  float e = max(rho - 3050.0, 0.0);
  float collar = uRingOff * uRingOff / (uRingOff * uRingOff + e * e);
  c += kQuayTint(ci) * uCollar * (collar + 0.05 * exp(-e / 2600.0)) * (0.7 + 0.3 * lines + 0.3 * tone);
  // at a grazing angle the sheet gives back the far lights
  c += uSheen * pow(1.0 - abs(V.y), 7.0);
  if (rho < 3040.0) c *= 0.0;
  gl_FragColor = vec4(c, 1.0);
}`;

function sheetMesh(y, down, uniforms, frag) {
  const s = 2.6e6, g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-s, y, -s, s, y, -s, s, y, s, -s, y, s], 3));
  g.setIndex(down ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
  g.boundingSphere = new Sphere(new Vector3(0, y, 0), 1e9);
  const m = new Mesh(g, new ShaderMaterial({ uniforms, vertexShader: SHEET_VERT, fragmentShader: frag || LAYER_FRAG, side: FrontSide }));
  m.frustumCulled = false; m.renderOrder = -6;
  return m;
}

// ---------------------------------------------------------------- drums as dark columns
// A drum from outside is the outer wall of its moat: dark, with a dull sheen, banded by the light of its nine quays.
// One unit cylinder, drawn once for every drum in the middle distance.
const COLUMN_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vTint;
void main() {
  vec4 lp = vec4(position, 1.0); vec3 n = vec3(position.x, 0.0, position.z);
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
  #endif
  vTint = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
    vTint = instanceColor;
  #endif
  vL = position;
  vec4 wp = modelMatrix * lp; vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const COLUMN_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uBody, uSheen, uTint; uniform float uBand, uTime, uSpin, uDepth, uMouths; uniform vec4 uHole;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vTint;
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN);
  vec3 V = cameraPosition - vW; float dist = length(V); V /= dist;
  float y = vL.y * uDepth;
  float a = atan(vL.x, vL.z) - uSpin * uTime;                     // the angle round the drum, turning with it
  float arc = a * 3046.0;
  float px = dist / 650.0;                                         // about a pixel, in metres
  // the moat's tanks: staves 53 m wide, hoops every 104 m
  float stave = kHash(vec2(floor(arc / 53.2), floor(y / 104.2)));
  float fine = smoothstep(60.0, 8.0, px);
  vec3 c = uBody * (0.7 + 0.6 * stave * fine);
  float seam = smoothstep(1.2 + px, 1.2, abs(fract(arc / 53.2) - 0.5) * 53.2 - 25.4) + smoothstep(1.2 + px, 1.2, abs(fract(y / 104.2) - 0.5) * 104.2 - 50.9);
  float seams = clamp(seam, 0.0, 1.0) * clamp(3.0 / px, 0.0, 1.0);
  // nine quays: each lights a band of the flank, in pools under its lamps when you are near enough to tell them apart
  float lv = (y / uDepth) * 9.0 - 0.5, dy = (lv - floor(lv + 0.5)) * (uDepth / 9.0);
  float band = 1.0 / (1.0 + dy * dy / 900.0) + 0.3 / (1.0 + dy * dy / 30000.0) + 0.05;
  float pool = pow(0.5 + 0.5 * cos(a * 480.0), 2.0);
  float lampy = mix(1.0, 0.3 + 1.5 * pool, smoothstep(30.0, 6.0, px) * smoothstep(90.0, 20.0, abs(dy)));
  vec3 tint = vTint * uTint;
  float wall = mix(1.0, 0.7 + 0.42 * stave, fine) * (1.0 - 0.55 * seams) * (0.85 + 0.3 * kNoise(vec2(arc, y) / 7.0) * fine);
  c += tint * uBand * band * lampy * wall;
  // the Minutes: sixty dark mouths to a quay, five to an Hour, each with a lamp over it
  if (uMouths > 0.5 && abs(dy) < 12.0) {
    float q = (fract(a / 0.10471976 + 0.5) - 0.5) * 0.10471976 * 3046.0;
    float mouth = smoothstep(9.0 + px, 9.0, length(vec2(q / 4.4, dy)));
    c = mix(c, vec3(0.0), mouth * clamp(16.0 / px, 0.0, 1.0));
  }
  // the one mouth the camera uses is a real hole, with a real tunnel behind it
  if (uHole.z > 0.0) {
    float ha = atan(vL.x, vL.z) - uHole.x; ha = mod(ha + 3.14159265, 6.2831853) - 3.14159265;
    if (length(vec2(ha * 3046.0 / uHole.z, (y - uHole.y) / uHole.w)) < 1.0) discard;
  }
  // the dull sheen of half a metre of water behind its wall: the hall's lights slide round the limb
  float ndv = max(dot(N, V), 0.0);
  c += uSheen * (pow(1.0 - ndv, 4.0) + 0.06) * (0.6 + 0.4 * stave) * (1.0 - 0.4 * seams);
  gl_FragColor = vec4(c, 1.0);
}`;

function columnGeo(sides) {
  const pos = [], idx = [];
  for (let i = 0; i <= sides; i++) { const a = (i / sides) * Math.PI * 2; pos.push(Math.sin(a), 0, Math.cos(a), Math.sin(a), 1, Math.cos(a)); }
  for (let i = 0; i < sides; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(0, 0.5, 0), 1.2);
  return g;
}
function columnMaterial(o = {}) {
  return new ShaderMaterial({
    uniforms: {
      uClip: G.uClip, uTime: G.uTime, uBody: { value: vec3col(o.body || '#0a0d12') }, uSheen: { value: vec3col(o.sheen || '#2a2620', o.sheenPower === undefined ? 1 : o.sheenPower) },
      uTint: { value: vec3col(o.tint || '#ffffff') }, uBand: { value: o.band === undefined ? 0.05 : o.band }, uSpin: { value: o.spin === undefined ? RAFT.OMEGA : o.spin },
      uDepth: { value: RAFT.DEPTH }, uMouths: { value: o.mouths ? 1 : 0 }, uHole: { value: new Vector4(0, 0, 0, 1) },
    },
    vertexShader: COLUMN_VERT, fragmentShader: COLUMN_FRAG, side: FrontSide,
  });
}

// ---------------------------------------------------------------- the lanes
// Every lane is one straight line through a whole row or column, drawn as a ribbon that turns to face the eye. The
// trains are painted along it: a 100 m dash in each 350 m slot that holds one, all moving at 174.4 m/s. Near the eye
// they are dashes, farther off beads, and at the horizon a thread. Slot n of lane L holds a train when
// cellRand(n mod SLOTS, L)[0] < fill, in the shader and in trainSlots() alike, so real trains can stand on the dashes.
const LANE_VERT = /* glsl */`
attribute vec3 aDir;      // the way its trains run
attribute vec4 aLane;     // distance along the lane from its origin, side (-1, 1), lane number, kind (0 trains, 1 tube)
uniform float uPx, uMinPx, uWidth;
varying vec3 vW; varying float vOff; varying float vS; varying vec2 vLane;
void main() {
  vec3 p = position + aDir * aLane.x;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 dir = normalize(mat3(modelMatrix) * aDir);
  vec3 toEye = cameraPosition - wp.xyz;
  vec3 sideV = normalize(cross(dir, toEye) + vec3(0.0, 1e-4, 0.0));
  float w = max(uWidth, uMinPx * length(toEye) / uPx) * 1.7;
  wp.xyz += sideV * aLane.y * w * 0.5;
  vW = wp.xyz; vOff = aLane.y * w * 0.5; vS = aLane.x; vLane = aLane.zw;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LANE_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uTime, uPx, uMinPx, uWidth, uPower, uFill, uReach, uSpeed; uniform vec2 uNear; uniform vec3 uWarm, uCool, uTail, uTube;
varying vec3 vW; varying float vOff; varying float vS; varying vec2 vLane;
${CELL_GLSL}
void main() {
  ${CLIP_FRAG}
  float dist = length(vW - cameraPosition);
  float pxm = dist / uPx;                                       // metres to a pixel here
  float shown = max(uWidth, uMinPx * pxm);
  float prof = max(1.0 - abs(vOff) / (shown * 0.5), 0.0);
  if (prof <= 0.0) discard;
  prof = prof * prof * (uWidth / shown);
  float pxs = max(abs(dFdx(vS)) + abs(dFdy(vS)), 0.01);          // metres of lane to a pixel
  vec3 c;
  if (vLane.y > 0.5) {
    // the tube: a shielded pipe with a marker lamp every 175 m
    float f = abs(fract(vS / 175.0) - 0.5) * 175.0;
    float dot1 = clamp(0.5 + (6.0 - f) / max(pxs, 1.0), 0.0, 1.0);
    c = uTube * mix(dot1, 12.0 / 175.0, smoothstep(40.0, 150.0, pxs)) * 0.6;
  } else {
    float u = (vS - uSpeed * uTime) / 350.0 + floor(vLane.x + 0.5) * 0.137;
    float slot = floor(u), f = fract(u) * 350.0;
    vec4 r = kCell(vec2(mod(slot, 70.0), floor(vLane.x + 0.5)));
    float there = step(r.x, uFill);
    float g = abs(f - 50.0) - 50.0;                              // negative inside the train
    float dash = clamp(0.5 - g / max(pxs, 0.5), 0.0, 1.0);
    vec3 tc = mix(uWarm, uCool, r.z) * (0.55 + 0.9 * r.y);
    float fine = smoothstep(14.0, 3.0, pxs);
    tc = mix(tc, uTail, fine * smoothstep(12.0, 4.0, f));       // tail lamps, when it is near enough to see them
    tc *= 1.0 + fine * 1.5 * smoothstep(90.0, 97.0, f);         // and the lamp at its head
    vec3 one = tc * dash * there;
    vec3 many = mix(uWarm, uCool, 0.5) * (100.0 / 350.0) * uFill;
    c = mix(one, many, smoothstep(90.0, 300.0, pxs));
  }
  c *= prof * uPower * smoothstep(uNear.x, uNear.y, dist) * exp(-dist / uReach);
  gl_FragColor = vec4(c, 1.0);
}`;

/** which slots of a lane hold trains: the numbers n in 0..SLOTS-1 for lane number L (see laneNumber) */
export function trainSlots(L, fill = 0.72) { const a = []; for (let n = 0; n < RAFT.SLOTS; n++) if (cellRand(n, L)[0] < fill) a.push(n); return a; }
/** the number of a lane: axis 0 = along a row (x), 1 = along a column (z); index = the row's j or the column's i; side = +1 or -1; level 0..8 */
export function laneNumber(axis, index, side, level) { return ((index + 200) * 2 + (side > 0 ? 1 : 0)) * 9 + level + axis * 8000; }
/** where the train in slot n of lane L is along its lane at time t (metres from the lane's origin, modulo a hop) */
export function trainAt(L, n, t) { const u = n - L * 0.137 + (RAFT.SPEED * t) / RAFT.SLOT; return (((u % RAFT.SLOTS) + RAFT.SLOTS) % RAFT.SLOTS) * RAFT.SLOT; }

function* laneStrips(o) {
  const C = RAFT.CELL, reach = o.reach, fx = o.fx, fz = o.fz;
  let t0 = performance.now();
  const pos = [], dir = [], lane = [], idx = [];
  const nodes = [-1e6, -5e5, -2.5e5, -1.2e5, -6e4, -3e4, -1.5e4, -6000, 0, 6000, 1.5e4, 3e4, 6e4, 1.2e5, 2.5e5, 5e5, 1e6];
  const one = (ox, oy, oz, dx, dz, L, kind, mid) => {
    if (o.skip && o.skip.includes(L)) return;
    const base = pos.length / 3;
    for (const s of nodes) for (const side of [-1, 1]) { pos.push(ox, oy, oz); dir.push(dx, 0, dz); lane.push(s + mid, side, L, kind); }
    for (let k = 0; k < nodes.length - 1; k++) { const a = base + k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  };
  const levels = [...ROW_LEVELS, ...COL_LEVELS, TUBE_LEVEL];
  if (o.single) one(o.single.origin[0], o.single.origin[1], o.single.origin[2], o.single.dir[0], o.single.dir[1], o.single.number, 0, o.single.mid || 0);
  else for (let q = Math.floor(fz - reach); q <= Math.ceil(fz + reach); q++) for (const side of [1, -1]) for (const k of levels) {
    const row = ROW_LEVELS.includes(k) || k === TUBE_LEVEL, col = COL_LEVELS.includes(k) || k === TUBE_LEVEL, kind = k === TUBE_LEVEL ? 1 : 0;
    // rows: the +z side runs toward +x. The lane's origin is where it touches drum (0, q); s grows the way the trains go
    if (row) one(0, LEVELS[k], q * C + side * RAFT.LANE, side, 0, laneNumber(0, q, side, k), kind, side * fx * C);
    // columns: the +x side runs toward -z
    const qi = q - Math.round(fz) + Math.round(fx);
    if (col) one(qi * C + side * RAFT.LANE, LEVELS[k], 0, 0, -side, laneNumber(1, qi, side, k), kind, -side * fz * C);
    if (performance.now() - t0 > 4) { yield 'lanes'; t0 = performance.now(); }
  }
  yield 'lanes';
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('aDir', new Float32BufferAttribute(dir, 3));
  g.setAttribute('aLane', new Float32BufferAttribute(lane, 4));
  g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(), 1e9);
  const m = new ShaderMaterial({
    uniforms: {
      uClip: G.uClip, uTime: o.clock || G.uTime, uPx: G.uPx, uMinPx: { value: 1.25 }, uWidth: { value: o.width || 9 }, uPower: { value: o.power === undefined ? 1 : o.power },
      uFill: { value: o.fill === undefined ? 0.72 : o.fill }, uReach: { value: 6e5 }, uSpeed: { value: RAFT.SPEED }, uNear: { value: new Vector2(o.near ? o.near[0] : -2, o.near ? o.near[1] : -1) },
      uWarm: { value: vec3col('#ffc98a', 3.4) }, uCool: { value: vec3col('#fff0d8', 3.4) }, uTail: { value: vec3col('#ff5a3a', 2.6) }, uTube: { value: vec3col('#8fc0ff', 1.2) },
    },
    vertexShader: LANE_VERT, fragmentShader: LANE_FRAG, side: DoubleSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const mesh = new Mesh(g, m);
  mesh.frustumCulled = false; mesh.renderOrder = 8;
  return mesh;
}

/**
 * One lane on its own ribbon, for a world that needs a lane to keep its own time (the camera's train must be let go
 * on the second, whatever the page's clock says). opts: origin [x, y, z] (where the lane touches a drum), dir [dx, dz]
 * (the way its trains run), number (laneNumber), mid (metres along it that the camera stays near), clock ({ value:
 * seconds }), near [from, to], power, fill. Leave the same lane out of buildHall with skipLanes.
 */
export function laneRibbon(opts) {
  const it = laneStrips({ reach: 0, fx: 0, fz: 0, single: opts, power: opts.power, near: opts.near, fill: opts.fill, clock: opts.clock });
  let r = it.next(); while (!r.done) r = it.next();
  return r.value;
}

/**
 * Real trains near the eye, standing exactly on the dashes the lanes paint: a pool of trainGeo() copies moved each frame.
 * lanes: [{ number, origin: [x, y, z], dir: [dx, dz], clock, gate }] where clock is { value: seconds } (default: the
 *   page's) and gate(slot, s) may return false to leave one train out (s = metres along the lane to its middle)
 * opts: count (the pool, default 72), range (metres either side of the eye, default 1,600), fill, rig
 * returns { mesh, update(eye) }: call update each frame with the eye's place in the hall's own coordinates (a Vector3).
 */
export function nearTrains(lanes, opts = {}) {
  const n = opts.count || 72, range = opts.range || 1600, fill = opts.fill === undefined ? 0.72 : opts.fill;
  const rig = opts.rig || plainRig({ dir: [0.2, 1, 0.3], color: '#ffd9a8', power: 0.05, ambUp: '#24262c', ambDown: '#121317' });
  const mesh = new InstancedMesh(trainGeo().build(), litMaterial(rig, {}), n);
  mesh.frustumCulled = false; mesh.count = 0;
  const has = lanes.map((l) => { const a = new Uint8Array(RAFT.SLOTS); for (const q of trainSlots(l.number, fill)) a[q] = 1; return a; });
  const m4 = new Matrix4(), yaw = new Matrix4();
  return {
    mesh, rig,
    update(eye) {
      let k = 0;
      for (let i = 0; i < lanes.length && k < n; i++) {
        const l = lanes[i], t = l.clock ? l.clock.value : G.uTime.value, o = l.origin, dx = l.dir[0], dz = l.dir[1];
        const se = (eye.x - o[0]) * dx + (eye.z - o[2]) * dz;
        const px = o[0] + dx * se - eye.x, pz = o[2] + dz * se - eye.z, off = Math.hypot(px, o[1] - eye.y, pz);
        if (off > range) continue;
        const half = Math.sqrt(range * range - off * off), shift = (RAFT.SPEED * t) / RAFT.SLOT - l.number * 0.137;
        yaw.makeRotationY(Math.atan2(-dz, dx));
        for (let slot = Math.floor((se - half - 100) / RAFT.SLOT - shift); slot <= Math.floor((se + half) / RAFT.SLOT - shift) && k < n; slot++) {
          if (!has[i][((slot % RAFT.SLOTS) + RAFT.SLOTS) % RAFT.SLOTS]) continue;
          const s = (slot + shift) * RAFT.SLOT + 50;
          if (l.gate && !l.gate(slot, s)) continue;
          m4.copy(yaw).setPosition(o[0] + dx * s, o[1], o[2] + dz * s);
          mesh.setMatrixAt(k++, m4);
        }
      }
      mesh.count = k; mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

// Where the hall runs out: beyond the last drums drawn there are three hundred billion more, and all their light
// lies in a line.
const HORIZON_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uColor; uniform float uPower;
varying vec3 vW; varying vec3 vL;
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  float az = atan(vL.z, vL.x);
  float n = 0.55 + 0.9 * kNoise(vec2(az * 40.0, 1.7)) * kNoise(vec2(az * 9.0, 8.3));
  gl_FragColor = vec4(uColor * uPower * n, 1.0);
}`;
function horizonBand(power) {
  const n = 96, r = 1.02e6, pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r, Math.cos(a) * r, RAFT.DEPTH, Math.sin(a) * r); }
  for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(), 1e9);
  const mesh = new Mesh(g, new ShaderMaterial({
    uniforms: { uClip: G.uClip, uColor: { value: vec3col('#ffc890') }, uPower: { value: power } },
    vertexShader: SHEET_VERT, fragmentShader: HORIZON_FRAG, side: DoubleSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 7;
  return mesh;
}

// ---------------------------------------------------------------- the hall
/**
 * The mid-raft, from a car's window to the horizon. A generator: `const hall = yield* buildHall(ctx, opts)`.
 * opts:
 *   focus     [i, j] (may be fractions): the cell the camera stays near. Detail falls away from it. Default [0, 0]
 *   skip      [[i, j], ...] drums the world stands beside and builds itself with nearDrum()
 *   tints     { 'i,j': n } gives drum (i, j) the n-th of QUAY_TINTS (at most four)
 *   reach     how many cells out the drums go (default 40: about 1,000 km)
 *   lamp      strength of a quay lamp (default 60)       band   how brightly a quay lights its drum's flank (0.05)
 *   trains    strength of the trains' lights (default 1; 0 leaves the lanes out)
 *   trainsNear  [from, to] metres: the painted trains fade in over this distance from the eye, where nearTrains() stands real ones
 *   skipLanes   [lane numbers] to leave out, for a lane the world draws itself with laneRibbon() on its own clock
 *   truss, yards, glow   strengths of the truss lights, the Yards' lights and the horizon's glow (default 1 each)
 * returns { group, lights, lanes, columns, ceiling, floor, horizon, set({ lamp, trains, glow }) }
 * As measured in worlds/the_glide.js: 7 draw calls, 197,000 points and 71,000 triangles.
 */
export function* buildHall(ctx, opts = {}) {
  const group = new Group();
  const C = RAFT.CELL, D = RAFT.DEPTH, reach = opts.reach || 40, fx = (opts.focus || [0, 0])[0], fz = (opts.focus || [0, 0])[1];
  const skip = new Set((opts.skip || []).map((q) => q[0] + ',' + q[1])), tints = opts.tints || {};
  const lampP = opts.lamp === undefined ? 60 : opts.lamp, lampSize = 7;
  let t0 = performance.now();
  const over = [0, 1, 2, 3].map(() => new Vector4());
  let no = 0; for (const k in tints) if (no < 4) { const q = k.split(',').map(Number); over[no++].set(q[0], q[1], tints[k], 1); }
  const tintU = { uTints: { value: QUAY_TINTS.map((c) => vec3col(c)) }, uOver: { value: over } };
  const layerU = (o) => ({ uClip: G.uClip, ...tintU, uBase: { value: vec3col(o.base) }, uTruss: { value: vec3col(o.truss) }, uSheen: { value: vec3col(o.sheen) }, uCollar: { value: o.collar }, uRingOff: { value: D / 18 }, uCell: { value: C } });
  const ceiling = sheetMesh(D, true, layerU({ base: '#080a0f', truss: '#0d1016', sheen: '#5a4226', collar: 0.1 }));
  const floor = sheetMesh(0, false, layerU({ base: '#070709', truss: '#0e0c0a', sheen: '#4c3922', collar: 0.08 }));
  group.add(ceiling, floor);
  yield 'layers';

  // every drum: a dark column out to 14 cells, and its lamps: fewer and stronger with distance, so that a quay's light
  // is the same from anywhere
  const lights = farLights({ minPx: 1.3, maxPx: 40, reach: 7e5, capacity: 210000 });
  const nearCols = [], farCols = [], col = new Color(), m4 = new Matrix4();
  const i0 = Math.floor(fx - reach), i1 = Math.ceil(fx + reach), j0 = Math.floor(fz - reach), j1 = Math.ceil(fz + reach);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const d = Math.hypot(i - fx, j - fz);
    if (d > reach + 0.5 || skip.has(i + ',' + j)) continue;
    const tint = quayTint(i, j, tints), cx = i * C, cz = j * C;
    if (d <= 14.5) (d <= 2.3 ? nearCols : farCols).push({ cx, cz, tint });
    const vary = 0.75 + 0.5 * cellRand(i, j)[1];
    if (d <= 6.5) {
      const n = d <= 2.3 ? 160 : 40, p = lampP * vary * (480 / n), ph = cellRand(i, j)[2] * 6.2832;
      for (let k = 0; k < 9; k++) for (let q = 0; q < n; q++) lights.ring(cx, cz, LEVELS[k], RAFT.QUAY, ph + (q / n) * 6.2831853, tint, p * (k === TUBE_LEVEL ? 0.35 : 1), lampSize, true);
    } else {
      // far off only the side toward the eye matters, and the nine quays run together
      const a0 = Math.atan2(fx * C - cx, fz * C - cz), far = d > 14.5, lv = far ? [1, 4, 7] : [0, 1, 2, 3, 4, 5, 6, 7, 8], n = far ? 5 : 9;
      const p = lampP * vary * (480 / (2 * n)) * (far ? 3 : 1);
      for (const k of lv) for (let q = 0; q < n; q++) lights.ring(cx, cz, LEVELS[k], RAFT.QUAY, a0 + ((q + 0.5) / n - 0.5) * 2.9, tint, p, lampSize, false);
    }
    if (performance.now() - t0 > 4) { yield 'drums'; t0 = performance.now(); }
  }
  const columns = [];
  for (const [list, sides] of [[nearCols, 40], [farCols, 14]]) {
    if (!list.length) continue;
    const mesh = new InstancedMesh(columnGeo(sides), columnMaterial({ band: opts.band, mouths: sides > 20 }), list.length);
    list.forEach((q, n) => { m4.makeScale(RAFT.FLANK, D, RAFT.FLANK).setPosition(q.cx, 0, q.cz); mesh.setMatrixAt(n, m4); mesh.setColorAt(n, col.set(q.tint)); });
    mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false;
    group.add(mesh); columns.push(mesh);
  }
  yield 'columns';

  // work lights on the truss: a lattice under the radiators and over the rectennas, and masts of them from layer to
  // layer at the corners of the cells, which is what shows the hall is nearly four kilometres deep
  const tr = opts.truss === undefined ? 1 : opts.truss, rng = makeRng('hall-truss');
  if (tr > 0) {
    for (let j = -60; j < 60; j++) for (let i = -60; i < 60; i++) {
      const x = (Math.round(fx) + (i + 0.5) / 5) * C, z = (Math.round(fz) + (j + 0.5) / 5) * C;
      const dx = x / C - Math.round(x / C), dz = z / C - Math.round(z / C);
      if (Math.hypot(dx, dz) * C < 3500) continue;
      const far = Math.max(Math.abs(i), Math.abs(j)) > 30;
      if (far && ((i & 1) || (j & 1))) continue;
      lights.add(x, D - 14, z, '#bcd0ff', (far ? 16 : 6) * tr, 5);
      if (!far || !((i & 3) || (j & 3))) lights.add(x, 14, z, '#ffd9b0', (far ? 12 : 3.5) * tr, 5);
      if (performance.now() - t0 > 4) { yield 'truss'; t0 = performance.now(); }
    }
    for (let j = -20; j < 20; j++) for (let i = -20; i < 20; i++) {
      const x = (Math.round(fx) + i + 0.5) * C, z = (Math.round(fz) + j + 0.5) * C, near = Math.max(Math.abs(i + 0.5), Math.abs(j + 0.5)) < 6;
      const n = near ? 16 : 4;
      for (let k = 0; k < n; k++) lights.add(x, 120 + ((k + 0.5) / n) * (D - 240), z, k % 4 === 0 ? '#ff8a6a' : '#cfe0ff', (near ? 10 : 28) * tr, 6);
    }
  }
  yield 'truss';
  // the Yards and the data halls stand between drums, half a cell from each: work lights round dark boxes
  const yd = opts.yards === undefined ? 1 : opts.yards;
  if (yd > 0) for (let j = -14; j <= 14; j++) for (let i = -14; i <= 14; i++) for (const side of [0, 1]) {
    const gi = Math.round(fx) + i, gj = Math.round(fz) + j, r = cellRand(gi * 2 + side, gj), near = Math.hypot(i, j) < 5;
    const x = (gi + (side ? 0.5 : 0)) * C + (r[0] - 0.5) * 2600, z = (gj + (side ? 0 : 0.5)) * C + (r[1] - 0.5) * 2600, y = 700 + r[2] * 2300;
    const yard = r[3] < 0.5, n = near ? (yard ? 34 : 14) : 3;
    for (let k = 0; k < n; k++) {
      const s = yard ? [1500, 420, 900] : [700, 300, 700];
      lights.add(x + rng.f(-0.5, 0.5) * s[0], y + rng.f(-0.5, 0.5) * s[1], z + rng.f(-0.5, 0.5) * s[2], yard ? rng.pick(['#ffb070', '#ff9a58', '#ffd8a0', '#ff7a4a']) : rng.pick(['#9fd0ff', '#c8e0ff', '#7ab8ff']), (near ? 1.5 : 7) * yd * rng.f(0.5, 1.4), yard ? 7 : 5, yard ? 0.15 : 0);
    }
    if (performance.now() - t0 > 4) { yield 'yards'; t0 = performance.now(); }
  }
  const lightMesh = lights.mesh();
  group.add(lightMesh);
  yield 'lights';
  const trainsP = opts.trains === undefined ? 1 : opts.trains;
  const lanes = trainsP > 0 ? yield* laneStrips({ reach, fx, fz, power: trainsP, near: opts.trainsNear, fill: opts.fill, skip: opts.skipLanes }) : null;
  if (lanes) group.add(lanes);
  yield 'lanes';
  const horizon = horizonBand(opts.glow === undefined ? 2.5 : opts.glow);
  group.add(horizon);
  const hall = {
    group, lights: lightMesh, columns, ceiling, floor, lanes, horizon,
    set(p) {
      if (p.lamp !== undefined) lightMesh.material.uniforms.uPower.value = p.lamp;
      if (p.trains !== undefined && hall.lanes) hall.lanes.material.uniforms.uPower.value = p.trains;
      if (p.glow !== undefined && hall.horizon) hall.horizon.material.uniforms.uPower.value = p.glow;
    },
  };
  return hall;
}

// ---------------------------------------------------------------- a glide train
/**
 * A train of five cars, 100 m long, as a Geo: x along the train (head at +x), y aft, z out from the drum it stands on.
 * Each car is a tank of sealed water round a cabin: 6 m of it toward the Lantern, less on the flanks, and 1.3 m aft,
 * which is clear, so the only windows are two long panes in the aft face. Call .build() for instances().
 * trainGeo(into, from, to) draws cars from..to-1 into a Geo of the caller's (through whatever transform it has), so a
 * build can stop between cars: the tail lamps come with car 0 and the head lamps with car 4.
 */
export function trainGeo(into, from = 0, to = 5) {
  const g = into || new Geo(), hull = '#8d9298', dark = '#33373e', pane = '#ffd9a0';
  const n = 5, L = 19, gap = 1.25;
  for (let c = from; c < to; c++) {
    const x0 = -50 + c * (L + gap), x1 = x0 + L;
    g.box(x0 + 0.6, -6.5, -6, x1 - 0.6, 5.2, 6, hull, { top: '#70757c', bottom: dark });
    g.box(x0, -5.9, -5.4, x0 + 0.6, 4.6, 5.4, dark); g.box(x1 - 0.6, -5.9, -5.4, x1, 4.6, 5.4, dark);
    for (let k = 1; k < 4; k++) g.box(x0 + (k * L) / 4 - 0.3, -6.65, -6.15, x0 + (k * L) / 4 + 0.3, 5.3, 6.15, dark);
    for (const z of [-2.7, 2.7]) g.box(x0 + 1.6, 5.2, z - 1.7, x1 - 1.6, 5.32, z + 1.7, pane, { emit: 1.5, skip: 'b' });
    for (let k = 0; k <= 6; k++) { const x = x0 + 1.6 + (k * (L - 3.2)) / 6; g.box(x - 0.14, 5.2, -4.6, x + 0.14, 5.5, 4.6, dark, { skip: 'b' }); }
    g.box(x0 + 1.4, 5.2, -0.5, x1 - 1.4, 5.5, 0.5, dark, { skip: 'b' });
    if (c < n - 1) g.box(x1, -2.2, -2.6, x1 + gap, 2.2, 2.6, dark);
  }
  for (const z of [-3.9, 3.9]) {
    if (to === n) g.box(50, -0.7, z - 0.7, 50.3, 0.7, z + 0.7, '#fff2d8', { emit: 7, skip: 'w' });
    if (from === 0) g.box(-50.3, -0.6, z - 0.6, -50, 0.6, z + 0.6, '#ff5030', { emit: 6, skip: 'e' });
  }
  return g;
}

// ---------------------------------------------------------------- a drum to stand beside
/**
 * One drum in full: its flank, the ledges of its nine quays and every quay lamp. A generator: `yield* nearDrum(opts)`
 * returns { group, flank, lamps, ledges, rig, setHole }.
 * The group's origin is on the drum's axis at the rectenna layer; the kit does not turn it. A world that stands on its
 * quay keeps it still and turns the hall instead; otherwise set group.rotation.y = RAFT.OMEGA * seconds.
 * opts:
 *   at        [i, j] the drum's place on the grid          tint   the colour of its quay lights
 *   lamp      strength of a quay lamp (default 70)         band   how brightly a quay lights the flank (default 0.05)
 *   dark      [{ level, from, to }] arcs (radians) of a quay to leave unlit, where a quayPiece() stands its own lamps
 * Angles here run the drum's own way round: a point at angle a is (sin a, cos a) x radius from the axis in (x, z).
 */
// The nine ledges of a drum's quays, written straight into arrays (31,000 vertices) rather than facet by facet with
// Geo, which makes several short-lived objects for every corner.
function ledgeGeo(dark) {
  const n = 192, r0 = RAFT.FLANK - 1, r1 = RAFT.QUAY, max = 9 * n * 18;
  const pos = new Float32Array(max * 3), nrm = new Float32Array(max * 3), col = new Uint8Array(max * 4);
  const tone = ['#2c2f36', '#3a3d44', '#1c1e22'].map((c) => rgb(c));
  let k = 0;
  // one corner: angle, radius, height; which way its face looks (0 out from the drum, 1 aft, -1 toward the Lantern)
  const put = (a, r, y, ny, t) => {
    const s = Math.sin(a), c = Math.cos(a);
    pos[k * 3] = s * r; pos[k * 3 + 1] = y; pos[k * 3 + 2] = c * r;
    nrm[k * 3] = ny ? 0 : s; nrm[k * 3 + 1] = ny; nrm[k * 3 + 2] = ny ? 0 : c;
    col[k * 4] = t[0] * 255; col[k * 4 + 1] = t[1] * 255; col[k * 4 + 2] = t[2] * 255;
    k++;
  };
  for (let lv = 0; lv < 9; lv++) for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, y = LEVELS[lv];
    if (dark.some((d) => d.level === lv && a0 >= d.from && a1 <= d.to)) continue;
    // each face is two triangles, corners counter-clockwise seen from its own side: the outer face, the aft, the fore
    put(a0, r1, y - 16, 0, tone[0]); put(a1, r1, y - 16, 0, tone[0]); put(a1, r1, y + 16, 0, tone[0]);
    put(a0, r1, y - 16, 0, tone[0]); put(a1, r1, y + 16, 0, tone[0]); put(a0, r1, y + 16, 0, tone[0]);
    put(a0, r0, y + 16, 1, tone[1]); put(a0, r1, y + 16, 1, tone[1]); put(a1, r1, y + 16, 1, tone[1]);
    put(a0, r0, y + 16, 1, tone[1]); put(a1, r1, y + 16, 1, tone[1]); put(a1, r0, y + 16, 1, tone[1]);
    put(a0, r1, y - 16, -1, tone[2]); put(a0, r0, y - 16, -1, tone[2]); put(a1, r0, y - 16, -1, tone[2]);
    put(a0, r1, y - 16, -1, tone[2]); put(a1, r0, y - 16, -1, tone[2]); put(a1, r1, y - 16, -1, tone[2]);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos.subarray(0, k * 3), 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm.subarray(0, k * 3), 3));
  g.setAttribute('aCol', new Uint8BufferAttribute(col.subarray(0, k * 4), 4, true));
  g.setAttribute('aEmit', new Float32BufferAttribute(new Float32Array(k), 1));
  g.boundingSphere = new Sphere(new Vector3(0, RAFT.DEPTH / 2, 0), 4000);
  return g;
}

export function* nearDrum(opts = {}) {
  const at = opts.at || [0, 0], group = new Group(), D = RAFT.DEPTH, tint = opts.tint || QUAY_TINTS[0];
  group.position.set(at[0] * RAFT.CELL, 0, at[1] * RAFT.CELL);
  const flank = new Mesh(columnGeo(288), columnMaterial({ band: opts.band, mouths: true, spin: 0, tint }));
  flank.scale.set(RAFT.FLANK, D, RAFT.FLANK);
  group.add(flank);
  // the quays: nine ledges standing 4 m off the moat
  const dark = opts.dark || [];
  const rig = plainRig({ dir: [0, 1, 0], color: tint, power: 0.05, ambUp: tint, ambDown: tint, ambPower: 0.03 });
  yield 'drum';
  const ledges = new Mesh(ledgeGeo(dark), litMaterial(rig, {}));
  ledges.frustumCulled = false;
  group.add(ledges);
  yield 'ledges';
  // lamps: one every 40 m on each quay, on alternate edges of the band
  const lights = farLights({ minPx: 1.3, maxPx: 56, spin: 0, reach: 9e9, capacity: 4400 }), lampP = opts.lamp === undefined ? 70 : opts.lamp;
  for (let k = 0; k < 9; k++) for (let q = 0; q < 480; q++) {
    const a = (q / 480) * Math.PI * 2;
    if (dark.some((d) => d.level === k && a >= d.from && a <= d.to)) continue;
    lights.ring(0, 0, LEVELS[k] + (q & 1 ? 15 : -15), RAFT.QUAY + 9, a, tint, lampP * (k === TUBE_LEVEL ? 0.35 : 1), 7, false);
  }
  yield 'lamps';
  const lamps = lights.mesh();
  group.add(lamps);
  yield 'lamps';
  return {
    group, flank, lamps, ledges, rig,
    /** cut the mouth of a real tunnel in the flank: at angle a and height y, halfLen metres round the drum by halfWid along it */
    setHole(a, y, halfLen, halfWid) { flank.material.uniforms.uHole.value.set(a, y, halfLen, halfWid); },
  };
}

// ---------------------------------------------------------------- a stretch of quay, close to
/**
 * A stretch of one quay with everything a camera riding it is near: the band and its rails, lamp posts, cradles with
 * trains hanging in them, and (if asked) the mouth of a tunnel through the jacket with the tunnel behind it.
 * It is modelled FLAT like a deck and bent by a kit frame: x = metres round the quay, spinward; y = metres IN from the
 * quay's face (so everything hanging off the quay has y < 0: out is down, and a train hangs under its cradle like a
 * lamp under a ceiling); z = metres aft of the quay's own level.
 * opts:
 *   drum      what nearDrum() returned (the piece is added to its group, and the tunnel's hole is cut in its flank)
 *   level     0..8        angle   where on the drum x = 0 is (the same angle as nearDrum's `dark`)
 *   from, to  the stretch in x (default -300 .. 900). Pass the same arc to nearDrum as `dark`
 *   cradles   [x, ...] centres of cradles        trains   [x, ...] the cradles that hold a train
 *   tunnel    { x, dir, slope, length }: the mouth is at x, the tunnel runs back from it toward dir (+1 or -1) and inward
 *   tint, lamp   colour and strength of the lamps
 * A generator: `yield* quayPiece(opts)`
 * returns { group, frame, rig, lit, local(x, y, z), tunnelPoint(s, up), glow(points, opts), hangTrain(x) }: local() gives a flat
 * point's place in the drum's own coordinates (add the drum group's position, and turn by its rotation, for the world).
 */
export function* quayPiece(opts = {}) {
  const drum = opts.drum, k = opts.level === undefined ? 6 : opts.level, a0 = opts.angle || 0, x0 = opts.from === undefined ? -300 : opts.from, x1 = opts.to === undefined ? 900 : opts.to;
  const tint = opts.tint || QUAY_TINTS[0], lampP = opts.lamp === undefined ? 5 : opts.lamp;
  const frame = makeFrame(a0 - Math.PI / 2, LEVELS[k], RAFT.QUAY);
  const group = new Group();
  group.rotation.x = -Math.PI / 2;                      // the kit's drums lie along z; out here they stand along y
  const nl = Math.floor((x1 - x0) / 40) + 1;
  const rig = lampRig({ ambUp: '#1a1c22', ambDown: '#101116', lattices: [{ origin: [x0, -9, -15], spacing: [40, 30], count: [nl, 2], color: tint, power: opts.light === undefined ? 0.9 : opts.light, reach: 15 }] });
  const lit = litMaterial(rig, { bend: frame }), litBoth = litMaterial(rig, { bend: frame, side: 'double' });
  const g = new Geo({ maxSeg: 48 }), steel = '#565b63', deckc = '#3d4148', darkc = '#24272c';
  const tn = opts.tunnel || null, sb = tn ? Math.sin(tn.slope || 0.245) : 0, cb = tn ? Math.cos(tn.slope || 0.245) : 1;
  // the band: a slab 32 m wide whose outer face carries the rails, laid in lengths of 40 m or less, each of which
  // keeps within 7 cm of the drum's curve. (As one long box for Geo to cut down, it was a single step of the build
  // with no place to stop in.) Where the tunnel comes down through the band, a cutting
  const cut = tn ? [tn.x + tn.dir * -8 * cb, tn.x + tn.dir * 96 * cb].sort((p, q) => p - q) : null;
  const marks = cut ? [cut[0], cut[1]] : [];
  for (let x = x0; x < x1; x += 40) marks.push(x);
  marks.push(x1); marks.sort((p, q) => p - q);
  let t0 = performance.now();
  for (let i = 0; i < marks.length - 1; i++) {
    const xa = marks[i], xb = marks[i + 1], mid = (xa + xb) / 2;
    if (xb - xa < 0.01 || xa < x0 || xb > x1) continue;
    const strips = cut && mid > cut[0] && mid < cut[1] ? [[-16, -9.6], [9.6, 16]] : [[-16, 16]];
    for (const z of strips) g.box(xa, -0.05, z[0], xb, 4.5, z[1], deckc, { bottom: '#4a4e56', skip: 'twe' });
    if (strips.length === 1) for (const z of [-4.6, 4.6]) g.box(xa, -0.5, z - 0.3, xb, 0, z + 0.3, steel, { skip: 'we' });
    if (performance.now() - t0 > 4) { yield 'band'; t0 = performance.now(); }
  }
  for (let x = x0 + 10; x < x1; x += 20) {
    if (!cut || x < cut[0] || x > cut[1]) g.box(x - 0.4, -0.25, -15.5, x + 0.4, 0, 15.5, darkc);
    if (performance.now() - t0 > 4) { yield 'band'; t0 = performance.now(); }
  }
  yield 'band';
  t0 = performance.now();
  // lamp posts along both edges, hanging 9 m out
  const lamps = [];
  for (let i = 0; i < nl; i++) for (const z of [-15, 15]) {
    const x = x0 + i * 40;
    g.box(x - 0.25, -8.6, z - 0.25, x + 0.25, 0, z + 0.25, steel);
    g.box(x - 0.9, -9.3, z - 0.9, x + 0.9, -8.6, z + 0.9, '#fff0d0', { emit: 5 });
    lamps.push({ p: [x, -9.4, z], color: tint, power: lampP, size: 2.6 });
    if (performance.now() - t0 > 4) { yield 'posts'; t0 = performance.now(); }
  }
  yield 'posts';
  // a train as it hangs here (out is down), made once, a car at a time; a copy goes to each cradle that holds one
  const hang = new Geo();
  hang.rot('x', Math.PI / 2);
  for (let c = 0; c < 5; c++) { trainGeo(hang, c, c + 1); yield 'train'; }
  hang.pop();
  const hangGeo = hang.build();
  const hangTrain = (xs) => { const ms = instances(hangGeo, lit, xs.map((x) => ({ p: [x, -8.2, 0] })), { frame, cell: 1e6 }); for (const m of ms) group.add(m); return ms[0]; };
  yield 'train';
  // cradles: a carriage under the rails and six pairs of arms
  for (const cx of opts.cradles || []) {
    g.box(cx - 52, -1.5, -5.6, cx + 52, -0.5, 5.6, steel, { bottom: darkc });
    for (let q = 0; q < 6; q++) for (const s of [-1, 1]) {
      const x = cx - 45 + q * 18;
      g.box(x - 0.7, -11, s * 6.5, x + 0.7, -1.5, s * 7.4, '#6a6f78');
      g.box(x - 0.7, -15.4, s * 4.6, x + 0.7, -14.6, s * 7.4, '#6a6f78');
      g.box(x - 0.7, -14.6, s * 6.5, x + 0.7, -11, s * 7.4, '#6a6f78');
    }
    yield 'cradles';
  }
  for (const x of opts.trains || []) hangTrain([x]);
  // the tunnel: a bore 19 m across coming down through the jacket at a slope, hooded where it breaks out
  let tunnelPoint = null;
  if (tn) {
    const dv = new Vector3(tn.dir * cb, sb, 0), nv = new Vector3(-tn.dir * sb, cb, 0), zv = new Vector3(0, 0, tn.dir), len = tn.length || 170;
    const tm = new Matrix4().makeBasis(dv, nv, zv).setPosition(tn.x, -8.2, 0);
    tunnelPoint = (s, up = 0, side = 0) => [tn.x + dv.x * s + nv.x * up, -8.2 + dv.y * s + nv.y * up, zv.z * side];
    const t = new Geo({ maxSeg: 24 });
    t.push(tm);
    t.tube([[30, 0, 0], [len, 0, 0]], 9.5, 28, '#3a3f47');
    // ribs every 10 m; every other one carries a hoop of light, dimmer the deeper in
    for (let s = 30; s <= len; s += 10) {
      t.tube([[s - 0.5, 0, 0], [s + 0.5, 0, 0]], 9.25, 28, s === 30 ? '#8a8f98' : '#565c66');
      if (s > 30 && (s / 10) % 2 === 0) t.tube([[s + 0.5, 0, 0], [s + 0.8, 0, 0]], 9.3, 28, '#ffcf98', { emit: 0.5 + 0.9 * Math.max(0, 1 - (s - 30) / 150) });
      if (performance.now() - t0 > 4) { yield 'tunnel'; t0 = performance.now(); }
    }
    t.tube([[29, 0, 0], [30.5, 0, 0]], 10.4, 28, '#7c8088');                                  // the portal ring
    t.box(26, 8.3, -0.35, len, 8.8, 0.35, steel);                                              // the rail in the roof
    t.rot('z', Math.PI / 2); t.cyl(0, -len - 0.5, 0, 9.5, 9.5, 0.5, 28, '#1c1e22', { base: true }); t.pop();
    t.pop();
    yield 'tunnel';
    group.add(t.mesh(litBoth, frame));
    yield 'tunnel';
    for (let q = 0; q < 14; q++) { const a = (q / 14) * Math.PI * 2, p = tunnelPoint(29, Math.cos(a) * 10.6, Math.sin(a) * 10.6); lamps.push({ p, color: '#ffcf8a', power: lampP * 0.7, size: 1.6 }); }
    if (drum) drum.setHole(a0 + (tn.x + tn.dir * (12.2 / sb) * cb) / RAFT.QUAY, LEVELS[k], 9.7 / sb + 2, 9.7);
  }
  yield 'quay';
  group.add(g.mesh(lit, frame));
  const glow = (points, o = {}) => { const m = glowPoints(points, { maxPx: 150, ...o, bend: frame }); group.add(m); return m; };
  glow(lamps, { soft: 1.8 });
  if (drum) drum.group.add(group);
  const v = new Vector3();
  return {
    group, frame, rig, lit, litBoth, tunnelPoint, glow,
    /** hang one more train, in the cradle at x: returns its mesh, so a world can take it away when it is let go */
    hangTrain: (x) => hangTrain([x]),
    /** a flat point (x, y, z) of this piece in the drum's own coordinates: [x, y, z] from the foot of its axis */
    local(x, y, z) { frame.point(x, y, z, v); return new Vector3(v.x, v.z, -v.y); },
  };
}

// ---------------------------------------------------------------- the sky behind the raft
// "There's no near star at all... What fills the Window instead is what the back crews call the River: a broad band of
// stars right across the sky, more than anyone could count, pale gold, the brightest of them orange, thick and bright
// in the middle and frayed at the edges, with dark rifts of dust lying across it. Above and below it hangs a fainter
// glow the crews call the Shelf" (ashgrove.md, Day four). The dusty edges are brown-violet: bruise (wander-year.md).
// The sky is worked out in the River's own angles: l along it, b across it (radians). The same dust dims the glow, dims
// and reddens each star, and darkens the River's reflection in the radiator panels, so the rifts agree everywhere.
const RIVER_GLSL = /* glsl */`
uniform mat3 uRiver; uniform vec3 uGold, uShelf, uBruise; uniform float uDust, uGlow;
float kDust(float l, float b) {
  vec2 q = vec2(l * 5.0, b * 20.0);
  float warp = kNoise(q * 0.6 + 3.1) - 0.5;
  float n1 = kFbm(vec2(q.x * 0.6 + warp * 1.2, q.y + warp * 1.6) + 11.0);
  float n2 = kFbm(q * 1.7 + 40.0);
  float lanes = smoothstep(0.8, 0.98, 1.0 - abs(2.0 * n1 - 1.0));      // long rifts lying along the River
  float mid = exp(-b * b / 0.0009), body = exp(-b * b / 0.012);
  float edge = exp(-pow((abs(b) - 0.115) / 0.045, 2.0));                 // where it frays into the Shelf
  return (lanes * (0.9 * body + 0.8 * edge) + 0.6 * mid * smoothstep(0.4, 0.75, n2) + 0.8 * edge * smoothstep(0.5, 0.85, n2)) * uDust;
}
vec3 kExt(float tau) { return exp(-tau * vec3(2.3, 3.0, 3.5)); }      // dust takes the blue first
vec3 kSky(vec3 d) {
  vec3 r = uRiver * d; float b = asin(clamp(r.z, -1.0, 1.0)), l = atan(r.y, r.x);
  float tau = kDust(l, b);
  float bb = b / (1.0 + 0.45 * (kNoise(vec2(l * 3.0, 2.0)) - 0.5));    // broader here, narrower there
  float grain = 0.75 + 0.5 * kNoise(vec2(l, b) * 230.0);              // star clouds too far and too many to tell apart
  float river = exp(-bb * bb / 0.009) * (0.7 + 0.6 * kFbm(vec2(l * 4.0, b * 14.0) + 5.0)) * grain;
  float core = exp(-bb * bb / 0.0018) * (0.6 + 0.8 * kFbm(vec2(l * 9.0, b * 30.0) + 2.0)) * grain;
  float shelf = exp(-abs(b) / 0.38);
  vec3 c = (uGold * (river + 0.9 * core) + uShelf * shelf) * kExt(tau);
  c += uBruise * tau * exp(-tau * 1.2) * (river * 1.6 + 0.6 * shelf + 0.25);  // and gives a little violet back: bruise
  return c * uGlow;
}
// the same without its detail: what a dull panel holds of it
vec3 kSkySoft(vec3 d) {
  float b = asin(clamp((uRiver * d).z, -1.0, 1.0));
  return (uGold * (0.8 * exp(-b * b / 0.012) + 0.6 * exp(-b * b / 0.003)) + 0.5 * uShelf * exp(-abs(b) / 0.38)) * uGlow;
}`;
const DOME_VERT = /* glsl */`
varying vec3 vDir; varying vec3 vW;
void main() {
  vDir = mat3(modelMatrix) * position; vW = cameraPosition + vDir * 1e5;
  vec4 p = projectionMatrix * viewMatrix * vec4(vW, 1.0);
  gl_Position = vec4(p.xy, p.w * 0.999999, p.w);
}`;
const DOME_FRAG = /* glsl */`
${CLIP_PARS}
varying vec3 vDir; varying vec3 vW;
${NOISE_GLSL}
${RIVER_GLSL}
void main() {
  ${CLIP_FRAG}
  gl_FragColor = vec4(kSky(normalize(vDir)), 1.0);
}`;
const STAR_VERT = /* glsl */`
attribute vec4 aColSize;  // rgb x brightness, size in pixels at 720 lines
uniform float uStars, uPx;
varying vec3 vW; varying vec3 vC;
${NOISE_GLSL}
${RIVER_GLSL}
void main() {
  vec3 d = normalize(mat3(modelMatrix) * position);
  vec3 r = uRiver * d;
  vC = aColSize.rgb * kExt(kDust(atan(r.y, r.x), asin(clamp(r.z, -1.0, 1.0))) * 1.3) * uStars;
  vW = cameraPosition + d * 1e5;
  vec4 p = projectionMatrix * viewMatrix * vec4(vW, 1.0);
  gl_Position = vec4(p.xy, p.w * 0.99999, p.w);
  gl_PointSize = aColSize.w * uPx / 650.0;
}`;
const STAR_FRAG = /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vC;
void main() {
  ${CLIP_FRAG}
  float r = length(gl_PointCoord - 0.5) * 2.0, a = max(1.0 - r, 0.0);
  gl_FragColor = vec4(vC * a * a, 1.0);
}`;
// other rafts: flat black, drawn over the stars
const RAFT_VERT = /* glsl */`
attribute float aSize;    // for specks: width in radians
uniform float uPx;
varying vec3 vW;
void main() {
  vec3 d = normalize(mat3(modelMatrix) * position);
  vW = cameraPosition + d * 1e5;
  vec4 p = projectionMatrix * viewMatrix * vec4(vW, 1.0);
  gl_Position = vec4(p.xy, p.w * 0.9999, p.w);
  gl_PointSize = max(aSize * uPx * 1.3, 1.5);
}`;
const RAFT_FRAG = /* glsl */`
${CLIP_PARS}
varying vec3 vW;
void main() {
  ${CLIP_FRAG}
  #ifdef SPECK
    vec2 q = (gl_PointCoord - 0.5) * vec2(2.0, 4.4);          // a lens lying level, like the larger shapes
    if (dot(q, q) > 1.0) discard;
  #endif
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}`;

/** a direction in the sky from a bearing (degrees round from +x toward +z) and an elevation (degrees above the raft's flat horizon) */
export function skyDir(bearing, elevation) {
  const a = (bearing * Math.PI) / 180, e = (elevation * Math.PI) / 180;
  return new Vector3(Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a));
}
// a raft seen from another: a flat sheet lying parallel to this one, so the lower in the sky the thinner it looks
function raftShape(pos, idx, c, width, squash, rng) {
  const h = new Vector3(0, 1, 0).cross(c).normalize(), v = new Vector3().crossVectors(c, h), base = pos.length / 3, n = 8, turn = rng.f(-0.4, 0.4);
  pos.push(c.x, c.y, c.z);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + turn, ca = Math.cos(a), sa = Math.sin(a), r = (0.5 * width * rng.f(0.86, 1.1)) / Math.pow(Math.pow(Math.abs(ca), 4) + Math.pow(Math.abs(sa), 4), 0.25);
    const p = new Vector3().copy(c).addScaledVector(h, r * Math.cos(a - turn)).addScaledVector(v, r * Math.sin(a - turn) * squash).normalize();
    pos.push(p.x, p.y, p.z);
  }
  for (let i = 0; i < n; i++) idx.push(base, base + 1 + i, base + 1 + ((i + 1) % n));
}
function raftMesh(pos, idx, points) {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  if (idx) g.setIndex(idx);
  if (points) g.setAttribute('aSize', new Float32BufferAttribute(points, 1));
  g.boundingSphere = new Sphere(new Vector3(), 1e9);
  const m = new ShaderMaterial({ defines: points ? { SPECK: 1 } : {}, uniforms: { uClip: G.uClip, uPx: G.uPx }, vertexShader: RAFT_VERT, fragmentShader: RAFT_FRAG, side: DoubleSide, transparent: true, depthWrite: false });
  const mesh = points ? new Points(g, m) : new Mesh(g, m);
  mesh.frustumCulled = false; mesh.renderOrder = -28;
  return mesh;
}

/**
 * The sky behind the raft. A generator: `const sky = yield* buildSky(ctx, opts)`. Add sky.group to the scene.
 * opts:
 *   apex    [bearing, elevation] in degrees of the River's highest point (default [0, 34]). It meets the horizon a
 *           quarter turn to either side of that bearing; the half of it below the raft is never seen
 *   stars   how many (default 150,000, times the picture quality's density)
 *   glow, dust, starPower   strengths of the River's glow, of its dust, and of the stars (default 1 each)
 *   rafts   the share of the sky that other rafts hide (default a sixth). Only a few hundredths of the sky is drawn
 *           as shapes (those over 0.4 of a degree wide, and specks down to 0.2): a sixth of it in shapes that size
 *           is so many that the River reads as dirty, not as holed. The rest of the share is taken off the
 *           brightness of the glow and of every star; sky.shown says what fraction the shapes came to
 *   red     { at: [bearing, elevation], power }: a red star set where the world wants it
 * returns { group, uniforms (hand them to buildBack so the panels can hold the River), dome, stars, rafts, specks,
 *           shown, raft(at, widthDegrees, squash) }: raft() adds one more black shape, as its own mesh, for the world to move
 *           (turn it with mesh.rotation; a few thousandths of a radian is a creep).
 */
export function* buildSky(ctx, opts = {}) {
  const group = new Group(), rng = makeRng(opts.seed || 'the-river'), dens = ctx && ctx.density ? ctx.density : 1;
  const apex = opts.apex || [0, 34], share = opts.rafts === undefined ? 1 / 6 : opts.rafts;
  const e1 = skyDir(apex[0], apex[1]), e2 = skyDir(apex[0] + 90, 0), nn = new Vector3().crossVectors(e2, e1);
  const uniforms = {
    uRiver: { value: new Matrix3().set(e1.x, e1.y, e1.z, e2.x, e2.y, e2.z, nn.x, nn.y, nn.z) },
    uGold: { value: vec3col(opts.gold || '#ffd8a6', 0.1) }, uShelf: { value: vec3col(opts.shelf || '#cdb898', 0.03) }, uBruise: { value: vec3col(opts.bruise || '#7a5078', 0.09) },
    uDust: { value: opts.dust === undefined ? 1 : opts.dust }, uGlow: { value: opts.glow === undefined ? 1 : opts.glow },
  };
  const cube = new BufferGeometry();
  cube.setAttribute('position', new Float32BufferAttribute([-1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1], 3));
  cube.setIndex([0, 1, 2, 0, 2, 3, 5, 4, 7, 5, 7, 6, 4, 0, 3, 4, 3, 7, 1, 5, 6, 1, 6, 2, 3, 2, 6, 3, 6, 7, 4, 5, 1, 4, 1, 0]);
  cube.boundingSphere = new Sphere(new Vector3(), 1e9);
  const dome = new Mesh(cube, new ShaderMaterial({ uniforms: { uClip: G.uClip, ...uniforms }, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: DoubleSide, depthWrite: false, depthTest: false }));
  dome.frustumCulled = false; dome.renderOrder = -30;
  group.add(dome);
  yield 'sky';
  // the stars: most of them in the River, thick toward its middle; many faint, few bright; pale gold, the brightest orange
  const N = Math.round((opts.stars || 150000) * dens), pos = new Float32Array(N * 3), cs = new Float32Array(N * 4), c = new Color(), d = new Vector3();
  const faint = ['#ffe6b8', '#ffdca6', '#fff0d0', '#ffd49a', '#ffe9c4', '#ffcf94'], bright = ['#ffb070', '#ffa868', '#ffc080', '#ff9a60', '#ff7a58', '#ffd9a6'];
  let k = 0, t0 = performance.now();
  while (k < N) {
    const u = rng(), b = u < 0.62 ? rng.gauss() * 0.075 : u < 0.87 ? rng.gauss() * 0.3 : Math.asin(rng.f(-1, 1)), l = rng.f(-Math.PI, Math.PI), cb = Math.cos(b);
    d.set(0, 0, 0).addScaledVector(e1, cb * Math.cos(l)).addScaledVector(e2, cb * Math.sin(l)).addScaledVector(nn, Math.sin(b));
    if (d.y < -0.02) continue;
    const B = Math.min(0.07 * Math.pow(rng(), -0.7), 10);
    c.set(B > 1.1 ? rng.pick(bright) : rng.chance(0.12) ? rng.pick(bright) : rng.pick(faint));
    pos[k * 3] = d.x; pos[k * 3 + 1] = d.y; pos[k * 3 + 2] = d.z;
    cs[k * 4] = c.r * B; cs[k * 4 + 1] = c.g * B; cs[k * 4 + 2] = c.b * B; cs[k * 4 + 3] = 1.4 + Math.min(3.0, Math.sqrt(B) * 1.0);
    k++;
    if ((k & 1023) === 0 && performance.now() - t0 > 4) { yield 'stars'; t0 = performance.now(); }
  }
  if (opts.red) { const q = skyDir(opts.red.at[0], opts.red.at[1]), B = opts.red.power || 7; c.set('#ff5a3c'); pos[0] = q.x; pos[1] = q.y; pos[2] = q.z; cs[0] = c.r * B; cs[1] = c.g * B; cs[2] = c.b * B; cs[3] = 4.6; }
  const sg = new BufferGeometry();
  sg.setAttribute('position', new Float32BufferAttribute(pos, 3)); sg.setAttribute('aColSize', new Float32BufferAttribute(cs, 4));
  sg.boundingSphere = new Sphere(new Vector3(), 1e9);
  const stars = new Points(sg, new ShaderMaterial({
    uniforms: { uClip: G.uClip, uPx: G.uPx, ...uniforms, uStars: { value: opts.starPower === undefined ? 1 : opts.starPower } },
    vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  stars.frustumCulled = false; stars.renderOrder = -29;
  group.add(stars);
  yield 'stars';
  // other rafts. Their number falls as the cube of their width, which is what a sky full of rafts of all distances gives
  const K = 1180 * share * 6, DEG = Math.PI / 180, rp = [], ri = [], sp = [], ss = [];
  let drawn = 0;                                                    // steradians of sky the shapes cover
  const width = (lo, hi) => 1 / Math.sqrt(1 / (lo * lo) - rng() * (1 / (lo * lo) - 1 / (hi * hi)));
  const anywhere = () => { const y = rng(), a = rng.f(0, Math.PI * 2), s = Math.sqrt(1 - y * y); return d.set(s * Math.cos(a), y, s * Math.sin(a)); };
  for (let i = 0, n = Math.round((K * (1 / 0.16 - 1 / 1.21)) / 2); i < n; i++) {
    anywhere();
    const w = width(0.4, 1.1) * DEG, q = Math.max(0.12, d.y) * rng.f(0.75, 1);
    raftShape(rp, ri, d, w, q, rng); drawn += 0.89 * w * w * q;
    if ((i & 255) === 0 && performance.now() - t0 > 4) { yield 'rafts'; t0 = performance.now(); }
  }
  for (let i = 0, n = Math.round((K * (1 / 0.04 - 1 / 0.16)) / 2); i < n; i++) { anywhere(); const w = width(0.2, 0.4) * DEG * Math.sqrt(Math.max(0.2, d.y)); sp.push(d.x, d.y, d.z); ss.push(w); drawn += 0.357 * 1.69 * w * w; }
  const rafts = raftMesh(rp, ri, null), specks = raftMesh(sp, null, ss);
  group.add(rafts, specks);
  // the shapes come to a few hundredths of the sky. The rest of the rafts' share is specks too small to draw, and
  // comes off the brightness of the River and of every star alike
  const shown = drawn / (2 * Math.PI), dim = 1 - Math.max(0, share - shown);
  uniforms.uGlow.value *= dim; stars.material.uniforms.uStars.value *= dim;
  yield 'rafts';
  return {
    group, uniforms, dome, stars, rafts, specks, shown,
    raft(at, widthDeg, squash) {
      const p = [], ix = [], q = skyDir(at[0], at[1]);
      raftShape(p, ix, q, widthDeg * DEG, squash === undefined ? Math.max(0.12, q.y) : squash, makeRng('raft' + at[0] + at[1]));
      const mesh = raftMesh(p, ix, null); mesh.renderOrder = -27; group.add(mesh);
      return mesh;
    },
  };
}

// ---------------------------------------------------------------- the back of the raft
/**
 * Light behind the raft, for litMaterial and for the radiator plain: up to eight work lamps, each a point of light
 * with a reach, the River as one faint light from where it stands highest, and what little else there is.
 * opts: lamps [{ p: [x, y, z], color, power, reach }], river (colour), riverPower, riverDir (a Vector3), ambUp, ambDown
 * rig.lamp(i, { p, color, power, reach }) moves or changes one while flying.
 */
export function backRig(opts = {}) {
  const P = [], Cc = [];
  for (let i = 0; i < 8; i++) { P.push(new Vector4(0, -1e6, 0, 1)); Cc.push(new Vector3()); }
  const uniforms = {
    uLampP: { value: P }, uLampC: { value: Cc },
    uRivDir: { value: (opts.riverDir || skyDir(0, 34)).clone().normalize() }, uRivCol: { value: vec3col(opts.river || '#ffd8a6', opts.riverPower === undefined ? 0.02 : opts.riverPower) },
    uAmbUp: { value: vec3col(opts.ambUp || '#1c1915') }, uAmbDown: { value: vec3col(opts.ambDown || '#090908') },
  };
  const glsl = /* glsl */`
uniform vec4 uLampP[8]; uniform vec3 uLampC[8]; uniform vec3 uRivDir, uRivCol, uAmbUp, uAmbDown;
vec3 kUp(vec3 P) { return vec3(0.0, 1.0, 0.0); }
vec3 kAir(vec3 c, vec3 P) { return c; }
vec3 kLamps(vec3 P, vec3 N) {
  vec3 L = vec3(0.0);
  for (int i = 0; i < 8; i++) { vec3 d = uLampP[i].xyz - P; float d2 = dot(d, d); L += uLampC[i] * max(dot(N, d) * inversesqrt(d2 + 0.01) * 0.85 + 0.15, 0.0) / (1.0 + d2 / (uLampP[i].w * uLampP[i].w)); }
  return L;
}
vec3 kLight(vec3 P, vec3 N, vec3 F, vec3 FN) { return kLamps(P, N) + uRivCol * max(dot(N, uRivDir), 0.0) + mix(uAmbDown, uAmbUp, 0.5 + 0.5 * N.y); }`;
  const rig = {
    uniforms, glsl, kind: 'back',
    lamp(i, l) { if (l.p) P[i].set(l.p[0], l.p[1], l.p[2], l.reach || P[i].w); if (l.reach) P[i].w = l.reach; if (l.color || l.power !== undefined) Cc[i].copy(vec3col(l.color || '#ffd9a8', l.power === undefined ? 1 : l.power)); },
  };
  (opts.lamps || []).slice(0, 8).forEach((l, i) => rig.lamp(i, { reach: 12, ...l }));
  return rig;
}

// The radiator layer from behind: "a black plain of panels across the whole back of the raft" (sorrel.md). Rows of
// panels 46 m wide with a service track between each pair; round every drum's back axle the rows run in rings, and
// trunk pipes run out from it like spokes and on along the rows and columns to the next. Panels at 283 to 330 K give
// off nothing an eye can see, so the plain shows only what falls on it: the River, held dully in each panel at its own
// slight tilt, and the pool of a work lamp.
const plainFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uPanel, uTrack, uPipe, uHubCol; uniform float uCell, uShine, uHub;
varying vec3 vW; varying vec3 vL;
${rig.glsl}
${NOISE_GLSL}
${RIVER_GLSL}
float kEdge(float x, float w, float px) { return clamp((w - abs(x)) / max(px, 0.02) + 0.5, 0.0, 1.0); }
void main() {
  ${CLIP_FRAG}
  vec2 m = vL.xz;
  float px = max(length(dFdx(m)), length(dFdy(m)));
  vec3 V = cameraPosition - vW; float dist = length(V); V /= dist;
  vec2 ci = floor(m / uCell + 0.5); vec2 dq = m - ci * uCell; float rho = length(dq), ang = atan(dq.y, dq.x);
  bool rings = rho < 3050.0;
  float across = rings ? rho : m.y;
  float row = floor(across / 54.0), fa = (fract(across / 54.0) - 0.5) * 54.0;
  float along = rings ? ang * (row + 0.5) * 54.0 : m.x;
  float pan = floor(along / 30.0), fl = (fract(along / 30.0) - 0.5) * 30.0;
  vec2 id = vec2(pan, row) + ci * 37.0 + (rings ? 500.0 : 0.0);
  vec2 h = kHash2(id); float h3 = kHash(id + 7.7);
  float fine = smoothstep(26.0, 6.0, px);
  float panel = mix(0.83, kEdge(fa, 23.0, px) * kEdge(fl, 14.6, px), fine);
  // a panel: near black, each at its own slight tilt; some rows are the hotter loops' and a shade different
  vec3 N = normalize(vec3((h.x - 0.5) * 0.05 * fine, 1.0, (h.y - 0.5) * 0.05 * fine));
  float hot = step(0.72, kHash(vec2(floor(row / 6.0), floor(pan / 40.0)) + ci));
  vec3 alb = uPanel * (0.75 + 0.5 * h3 * fine) * mix(vec3(1.0), vec3(0.8, 0.9, 1.25), hot);
  // a panel is a comb of fins 1.2 m apart in a frame: near to, the fins take the light in stripes
  float close = smoothstep(0.9, 0.2, px), fin = abs(fract(fl / 1.2) - 0.5) * 2.0;
  alb *= mix(1.0, 0.55 + 0.6 * fin, close);
  float rimP = 1.0 - kEdge(fa, 22.2, px) * kEdge(fl, 13.9, px);
  alb *= 1.0 + 0.9 * rimP * panel * smoothstep(3.0, 0.5, px);
  float gloss = (0.55 + 0.45 * h3) * mix(1.0, 0.35 + 0.9 * fin, close);
  // the track between rows: two rails, sleepers, a marker stud every 30 m
  float tr = abs(fa) - 23.0;
  vec3 trackC = uTrack * (0.8 + 0.2 * step(0.5, fract(along / 2.5)) * smoothstep(1.2, 0.3, px));
  float rail = (kEdge(tr - 1.6, 0.16, px) + kEdge(tr - 6.4, 0.16, px)) * clamp(0.5 / px, 0.0, 1.0);
  trackC += uTrack * 3.0 * rail;
  vec3 glow = vec3(1.0, 0.72, 0.38) * 0.5 * kEdge(length(vec2(fl, tr - 4.0)), 0.28, px) * smoothstep(1.5, 0.3, px);
  // trunk pipes: spokes from each back axle, then on along rows and columns to the next; headers across the rows
  float spoke = abs(fract(ang / 0.5235988) - 0.5) * 0.5235988 * rho;
  float dp = rings ? spoke : min(min(abs(dq.x), abs(dq.y)), abs(fract(m.x / 1225.0 + 0.5) - 0.5) * 1225.0 + 3.0);
  float pw = rings ? 7.0 : (min(abs(dq.x), abs(dq.y)) < 9.0 ? 7.0 : 3.0);
  float pipe = kEdge(dp, pw, px) * clamp(pw * 2.5 / px, 0.0, 1.0);
  vec3 Np = normalize(vec3(0.0, sqrt(max(1.0 - dp * dp / (pw * pw), 0.0)) + 0.25, 0.0) + vec3(0.3, 0.0, 0.3) * (dp / pw));
  alb = mix(mix(trackC, alb, panel), uPipe * (0.8 + 0.4 * kNoise(m / 9.0)), pipe);
  N = normalize(mix(N, Np, pipe)); gloss = mix(mix(0.25 + 2.5 * rail, gloss, panel), 0.8, pipe);
  // light: the River in the panel, the lamps, the dock's lights
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  float fres = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 c = alb * kLight(vW, N, vL, N);
  c += kSkySoft(R) * uShine * gloss * (0.03 + 0.97 * fres) * mix(0.9, 1.0, panel);
  vec3 sp = vec3(0.0);
  for (int i = 0; i < 8; i++) { vec3 d = uLampP[i].xyz - vW; float d2 = dot(d, d); sp += uLampC[i] * pow(max(dot(R, d) * inversesqrt(d2 + 0.01), 0.0), 40.0) / (1.0 + d2 / (uLampP[i].w * uLampP[i].w)); }
  c += sp * gloss * 0.6;
  c += alb * uHubCol * uHub * (1.0 / (1.0 + rho * rho / 40000.0) + 0.06 / (1.0 + rho * rho / 4.0e6));
  c += glow * (1.0 - panel) * (1.0 - pipe);
  gl_FragColor = vec4(c, 1.0);
}`;

/**
 * The back of the raft: the radiator plain to a flat horizon, a dock's lights at every drum's back axle out to forty
 * cells, and the lamps of sleds at work. A generator: `const back = yield* buildBack(ctx, opts)`.
 * The plain lies at y = RAFT.DEPTH. Drum (i, j)'s back axle is at (i * CELL, DEPTH, j * CELL); service tracks run along
 * x on the lines z = 54 n (outside the 3,050 m of rings round each axle); panels are 46 m by 29.
 * opts:
 *   sky      what buildSky() returned (required: the panels hold the River)
 *   rig      a backRig() with the work lamps the camera passes (default: none)
 *   focus    [i, j] the cell the camera stays near          reach   cells of docks drawn (default 40)
 *   shine    how strongly a panel holds the sky (default 3)   hub   strength of a dock's lights on the plain (default 1)
 *   sleds    how many far sleds' lamps to scatter (default 900 x density), a third of them moving
 *   galleries   metres from each axle to its ring of Windows' red lights (default 600; 0 for none)
 * returns { group, plain, rig, lit (a material for things standing on it), litDrift (the same for instances that
 *           travel), lights, glow(points, opts), y }
 */
export function* buildBack(ctx, opts = {}) {
  const group = new Group(), C = RAFT.CELL, Y = RAFT.DEPTH, rig = opts.rig || backRig({}), dens = ctx && ctx.density ? ctx.density : 1;
  const fx = (opts.focus || [0, 0])[0], fz = (opts.focus || [0, 0])[1], reach = opts.reach || 40, gr = opts.galleries === undefined ? 600 : opts.galleries;
  const plain = sheetMesh(Y, false, {
    uClip: G.uClip, ...rig.uniforms, ...opts.sky.uniforms, uCell: { value: C }, uShine: { value: opts.shine === undefined ? 3 : opts.shine }, uHub: { value: opts.hub === undefined ? 1 : opts.hub },
    uPanel: { value: vec3col(opts.panel || '#101114') }, uTrack: { value: vec3col('#2e2f33') }, uPipe: { value: vec3col('#3a3c42') }, uHubCol: { value: vec3col('#ffd0a0', 0.5) },
  }, plainFrag(rig));
  group.add(plain);
  yield 'plain';
  const lights = farLights({ minPx: 1.3, maxPx: 48, spin: 0, reach: 9e5, pull: [0.003, 300], moving: true, capacity: 16384 }), rng = makeRng('back-crews');
  let t0 = performance.now();
  for (let j = Math.floor(fz - reach); j <= Math.ceil(fz + reach); j++) for (let i = Math.floor(fx - reach); i <= Math.ceil(fx + reach); i++) {
    const d = Math.hypot(i - fx, j - fz), cx = i * C, cz = j * C, r = cellRand(i, j);
    if (d > reach + 0.5) continue;
    if (d <= 3.5) {
      for (let q = 0; q < 24; q++) { const a = (q / 24) * 6.2832; lights.add(cx + Math.cos(a) * 128, Y + 9 + (q % 3) * 7, cz + Math.sin(a) * 128, q % 6 === 0 ? '#ff8a5a' : '#ffd9a8', 5, 5); }
      for (let q = 0; q < 6; q++) lights.add(cx, Y + 40 + q * 16, cz, q === 5 ? '#ff6a4a' : '#cfe0ff', 6, 5);
      for (let q = 0; q < 12 && gr > 0; q++) { const a = (q / 12) * 6.2832 + 0.2618; lights.add(cx + Math.cos(a) * (gr + 6), Y + 4, cz + Math.sin(a) * (gr + 6), '#ff5a40', 2.2, 6); }
    } else {
      const n = d <= 12 ? 6 : 2, p = d <= 12 ? 26 : 90;
      for (let q = 0; q < n; q++) lights.add(cx + (q - n / 2) * 30, Y + 12 + q * 12, cz + (r[q % 4] - 0.5) * 200, q === 0 ? '#ff8a5a' : '#ffd9a8', p, 5);
    }
    if (performance.now() - t0 > 4) { yield 'docks'; t0 = performance.now(); }
  }
  // sleds at work between here and the horizon: a lamp on a service track, some of them travelling along it
  const ns = Math.round((opts.sleds === undefined ? 900 : opts.sleds) * dens);
  for (let q = 0; q < ns; q++) {
    const rr = 600 + 60000 * Math.pow(rng(), 1.8), a = rng.f(0, 6.2832), x = fx * C + Math.cos(a) * rr, z = Math.round((fz * C + Math.sin(a) * rr) / 54) * 54;
    const ddx = x / C - Math.round(x / C), ddz = z / C - Math.round(z / C);
    if (Math.hypot(ddx, ddz) * C < 3100) continue;
    const go = rng.chance(0.35) ? rng.sign() * rng.f(2, 6) : 0;
    lights.add(x, Y + 4.4, z, rng.pick(['#ffd9a8', '#ffe6c4', '#ffc98a']), rng.f(3, 9), 3, 0, go ? [go, 0, 0, rng.f(60, 160)] : null);
  }
  const lightMesh = lights.mesh();
  group.add(lightMesh);
  yield 'lamps';
  return {
    group, plain, rig, lights: lightMesh, y: Y, lit: litMaterial(rig, {}), litBoth: litMaterial(rig, { side: 'double' }), litDrift: litMaterial(rig, { drift: true }),
    /** lamps near the camera (kit glowPoints: world coordinates) */
    glow(points, o = {}) { const m = glowPoints(points, { maxPx: 140, ...o }); group.add(m); return m; },
  };
}

/**
 * A back crew's closed sled as a Geo: 9 m long, x the way it runs, y aft (up, on the plain), standing on rails 4.8 m
 * apart. Thick and plain, since it is all shielding; one pane of water in the roof, looking aft; work lamps on two
 * short masts; a boom reaching over the panels on its +z side. Nobody works out here in a suit.
 */
export function sledGeo() {
  const g = new Geo(), hull = '#8a8f96', dark = '#2c2f34';
  for (const x of [-2.8, 2.8]) g.box(x - 0.9, 0.15, -2.7, x + 0.9, 0.7, 2.7, dark);
  g.box(-4.2, 0.7, -2.2, 4.2, 3.6, 2.2, hull, { top: '#9a9fa6', bottom: dark });
  g.box(-4.7, 1.0, -1.8, -4.2, 3.2, 1.8, '#7c8188'); g.box(4.2, 1.0, -1.8, 4.7, 3.2, 1.8, '#7c8188');
  for (const x of [-2.1, 0, 2.1]) g.box(x - 0.12, 0.7, -2.28, x + 0.12, 3.68, 2.28, dark);
  g.box(-4.21, 2.45, -2.21, 4.21, 2.7, 2.21, '#c9a45a');
  g.box(-1.6, 3.6, -1.1, 1.6, 3.7, 1.1, '#ffcf98', { emit: 1.1, skip: 'b' });
  for (const z of [-1.2, 1.1]) g.box(-1.75, 3.6, z, 1.75, 3.82, z + 0.1, dark, { skip: 'b' });
  for (const x of [-1.75, 1.65]) g.box(x, 3.6, -1.2, x + 0.1, 3.82, 1.2, dark, { skip: 'b' });
  for (const z of [-1.9, 1.9]) { g.box(4.3, 3.2, z - 0.1, 4.5, 4.6, z + 0.1, dark); g.box(4.2, 4.5, z - 0.3, 4.9, 4.9, z + 0.3, '#fff2d6', { emit: 6 }); }
  g.box(-4.6, 3.6, -0.1, -4.4, 4.4, 0.1, dark); g.box(-4.8, 4.3, -0.25, -4.3, 4.6, 0.25, '#ffb060', { emit: 4 });
  g.box(1.0, 2.7, 2.2, 1.4, 3.1, 6.6, dark); g.box(0.8, 1.3, 6.2, 1.6, 3.1, 6.9, '#6d7178'); g.box(0.95, 1.0, 6.3, 1.45, 1.3, 6.8, '#ffb060', { emit: 2.5 });
  return g;
}

/**
 * A Window as a Geo: a long low gallery (96 m along x, some 11 m deep, 7 m high) whose glazed face, sloping back,
 * looks out along +z and up. Behind 1.5 m of water the room is dim and red. A shielded track leaves its back.
 */
export function galleryGeo() {
  const g = new Geo(), wall = '#3b3e45', dark = '#1d1f23';
  g.box(-48, 0, -6, 48, 1.1, 5.4, wall);
  g.box(-48, 1.1, -6, 48, 6.6, 0.4, wall, { top: '#474a52' });
  g.quad([-46, 1.1, 5.2], [46, 1.1, 5.2], [46, 6.4, 0.5], [-46, 6.4, 0.5], '#ff4a30', 0.4);
  for (let x = -46; x <= 46; x += 7.67) g.quad([x - 0.25, 1.1, 5.3], [x + 0.25, 1.1, 5.3], [x + 0.25, 6.5, 0.6], [x - 0.25, 6.5, 0.6], dark);
  for (const x of [-48, 46]) g.box(x, 0, -6, x + 2, 6.6, 5.4, wall);
  g.box(-48, 6.6, -6.4, 48, 7.1, 0.9, '#2a2c31');
  g.rot('x', Math.PI / 2); g.cyl(30, -60, -2.6, 2.6, 2.6, 54, 10, '#33363c', { cap: false }); g.pop();
  return g;
}

/**
 * The still side: the back crews' dock behind a drum's back axle, as a Geo standing at the origin on the plain (a
 * generator: `(yield* dockGeo(opts)).mesh(material)`). A round
 * housing 110 m in radius and 30 m high with twelve berths round it, each a round port 22 m across with lamps round
 * it; a boss and a mast on top; twelve trunk pipes leaving between the berths. Berth n faces the bearing 180 + 30 n
 * degrees, so berth 0 faces -x; its port is centred 15 m up, and its lip is 114 m from the axis.
 * opts.open: a berth to leave without its door (a world's way out).
 */
export function* dockGeo(opts = {}) {
  const g = new Geo(), R = 110, H = 30, dark = '#24262b';
  const tones = [dark, '#3a3d44', '#4a4d55', '#565a62', '#3f4249', '#4a4d55', '#3a3d44', '#55595f', dark];
  g.lathe(0, 0, 0, [[R + 10, 0], [R + 10, 2.5], [R, 2.5], [R, H - 3], [R - 5, H], [46, H + 3], [42, H + 16], [14, H + 19], [10, H + 60], [0, H + 60]], 48, (k) => tones[k]);
  for (let q = 0; q < 12; q++) {
    g.push(new Matrix4().makeRotationY(-(Math.PI + (q * Math.PI) / 6)));        // local +x now points out through berth q
    g.at(0, 15, 0); g.rot('z', -Math.PI / 2);                                    // and local +y along it
    g.cyl(0, R - 2, 0, 12.8, 12.8, 5.5, 28, '#7b7f87', { cap: false });
    g.lathe(0, R + 3.5, 0, [[12.8, 0], [11, 0]], 28, '#8d9199');
    if (opts.open !== q) g.cyl(0, R + 0.4, 0, 11, 11, 0.6, 28, '#2c2e34', { top: '#34373e' });
    g.pop(); g.pop();
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.39, c = Math.cos(a) * 14.4, s = Math.sin(a) * 14.4; g.box(R + 2.4, 15 + c - 0.5, s - 0.5, R + 3.2, 15 + c + 0.5, s + 0.5, '#ffe2b0', { emit: opts.open === q ? 7 : 3 }); }
    g.box(R - 0.5, 2.5, -15, R + 6, 3.4, 15, '#5a5e66');
    g.pop();
    g.push(new Matrix4().makeRotationY(-(Math.PI + ((q + 0.5) * Math.PI) / 6)));
    g.tube([[R + 6, 3.5, 0], [330, 3.5, 0]], 7, 10, '#3a3c41');
    g.pop();
    yield 'dock';
  }
  for (let k = 0; k < 5; k++) g.box(-10.4, H + 24 + k * 8, -0.5, -9.9, H + 25 + k * 8, 0.5, k === 4 ? '#ff6a4a' : '#dfe8ff', { emit: 6 });
  return g;
}
