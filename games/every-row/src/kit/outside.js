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
// What the kit gives a world:
//   buildHall(ctx, opts)      the mid-raft as a glide car sees it: both layers, some 6,600 drums out to forty cells
//                             each way, their rings of quay lights, the trains on every lane, truss lights, the Yards,
//                             and the glow where it all meets on the horizon line. A generator: use yield*.
//   nearDrum(opts)            one drum to stand beside: its flank, its nine quays and their lamps. Turn it yourself.
//   quayPiece(opts), trainGeo(), tunnelGeo()      the things a camera on a quay is close to
//   buildSky(ctx, opts)       the sky behind the raft: the River, the Shelf, the dust the crews call bruise, and the
//                             black shapes of other rafts
//   buildBack(ctx, opts)      the radiator layer from behind, to a flat horizon: panel rows, service tracks, the back
//                             axles' docks every CELL, sleds' lamps
//   sledGeo(), galleryGeo()   a back crew's closed sled; a Window (a long low gallery glazed with water)
//
// Far planes. Seen from a quay the hall runs out to about 1,000 km, so a world built on this kit sets far = 1.3e6 and
// near = 2 or more. That is far beyond ARCHITECTURE.md's far/near of 30,000, and it is safe here for two reasons:
// depth resolution at a distance d is about d * d / (near * 2^24) whatever far is (10 m at 20 km with near = 2.5), and
// every small light in this file is drawn a little nearer the eye than it stands (PULL, below), so it never fights
// the surface it is mounted on. Keep the camera 1.5 x near away from anything solid.
import {
  BufferGeometry, Float32BufferAttribute, Mesh, Points, ShaderMaterial, Vector2, Vector3, Vector4, Group, Color, Matrix4,
  DoubleSide, FrontSide, BackSide, AdditiveBlending, NormalBlending, InstancedMesh, Sphere,
} from 'three';
import { G, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, CELL_GLSL, plainRig, litMaterial, glowPoints, vec3col } from './mats.js';
import { Geo, instances } from './geo.js';
import { makeRng, cellRand } from '../core/rng.js';

export const RAFT = {
  CELL: 24500,      // spacing of drums on the square grid, m
  DEPTH: 3750,      // rectenna layer to radiator layer: a drum's length
  HULL: 3000,       // the rim deck
  FLANK: 3046,      // the moat's outer wall: what a drum's side looks like from outside
  QUAY: 3050,       // the band of track round the waist
  LANE: 3056,       // the line a released train falls along
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
/** the colour of drum (i, j)'s quay lights: opts.tints = { 'i,j': colour } overrides the kit's choice */
export function quayTint(i, j, tints) {
  const k = i + ',' + j;
  if (tints && tints[k]) return tints[k];
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
${PULL}
varying vec3 vW; varying vec3 vC;
void main() {
  float a = aTurn.x + (aTurn.y > 0.5 && aTurn.y < 1.5 ? uSpin * uTime : 0.0);
  vec3 n = vec3(sin(a), 0.0, cos(a));
  vec3 p = vec3(aAxis.x, aAxis.w, aAxis.y) + n * aAxis.z;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vec3 toEye = cameraPosition - wp.xyz;
  float dist = length(toEye);
  float face = aTurn.y > 0.5 ? smoothstep(-0.08, 0.22, dot(normalize(mat3(modelMatrix) * n), toEye / dist)) : 1.0;
  float px = aColSize.w * uPx / dist;
  float shown = clamp(px, uMinPx, uMaxPx);
  float k = min((px * px) / (shown * shown), 1.0);
  float tw = 1.0 + aTurn.z * sin(uTime * (0.7 + 1.9 * fract(aTurn.x * 7.31)) + aTurn.x * 40.0);
  vC = aColSize.rgb * k * face * tw * uPower * exp(-dist / uReach);
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
 *   add(x, y, z, colour, power, size)                          a light that stays where it is
 *   ring(cx, cz, y, radius, angle, colour, power, size, turn)  a lamp on a drum's quay: turn = true rides round with the drum
 * opts: minPx (default 1.3), maxPx (64), soft (1.7), spin (rad/s, default OMEGA), reach (metres over which the hall
 * swallows a light: drums stand in the way; default 9e5), power, pull [fraction, metres]
 */
export function farLights(opts = {}) {
  const axis = [], turn = [], cs = [], c = new Color();
  const put = (cx, cz, r, y, a, kind, colour, power, size, tw) => {
    axis.push(cx, cz, r, y); turn.push(a, kind, tw || 0);
    c.set(colour); cs.push(c.r * power, c.g * power, c.b * power, size);
  };
  return {
    get count() { return turn.length / 3; },
    add(x, y, z, colour, power, size, twinkle) { put(x, z, 0, y, 0, 0, colour, power, size, twinkle); },
    ring(cx, cz, y, radius, angle, colour, power, size, rides) { put(cx, cz, radius, y, angle, rides === false ? 2 : 1, colour, power, size, 0); },
    mesh() {
      const g = new BufferGeometry(), n = turn.length / 3;
      g.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute('aAxis', new Float32BufferAttribute(axis, 4));
      g.setAttribute('aTurn', new Float32BufferAttribute(turn, 3));
      g.setAttribute('aColSize', new Float32BufferAttribute(cs, 4));
      g.boundingSphere = new Sphere(new Vector3(), 1e9);
      const m = new ShaderMaterial({
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
