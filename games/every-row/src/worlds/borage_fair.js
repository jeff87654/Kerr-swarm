// Borage, Herb Row: the fair at Lanternfold. Borage is a fair drum, which "spends on light and spectacle and returns
// the rents to everyone", and when another raft swings by it cooks that raft's recipes the same week, "a fair held in
// light" (games/three-nights/src/15-canon.js, Borage; docs/eating-out.md, Lightfall; docs/open-drums.md, Kinds of open
// drum). The flight begins in the Lightfall Arcade on the Quaysides, dark and hung with lanterns, where every stall
// dates its dish by its light; comes out of the arcade's mouth into the fair court, six decks high with its ceiling
// lamps off; goes once round the swing ride at chair height; drops past the shies; and leaves through the middle of a
// wheel of lamps.
//
// y = 0 is deck 16, the first of the Low decks: 2,940 m from the axis, 0.98 g (9.62 m/s2), going round at
// V = 0.0572 x 2,940 = 168.2 m/s. The court's floor is that deck too, and its ceiling is 24 m up.
//
// THE SWING RIDE'S SUMS. Someone moving spinward at u is going round the axis at V + u and weighs (1 + u/V)^2 of
// their standing weight; moving antispinward, (1 - u/V)^2 (docs/ashgrove.md, "Weight is a map"; docs/sorrel.md, the
// Half-g Track's heavy bend). At 12 m/s that is 15% more and 14% less.
//   The ride: a crown whose 32 hinges go round 8.0 m from the mast and 9.2 m up, a chair on 4.8 m of chain from each,
//   one turn in 6.0 s (ten a minute).
//   In a gravity that stood still the chains would settle where tan(theta) = (speed)^2 / (radius x g): 53.5 degrees
//   from the vertical all the way round, the chairs 11.9 m out and flying at 12.4 m/s.
//   If each chair had time to settle to the weight it has at each point of the turn, the same sum with the spinward
//   and the anti weights gives 49 degrees on the side where the chairs fly spinward and 58 where they fly anti. But a
//   chair has six seconds a turn, and it is a pendulum that is going round: when it swings in it gets ahead of its
//   hinge and when it swings out it falls behind, as a skater's arms do, and that feeds back into the swing. For
//   most crowns and chains the answer to the drum's once-a-turn push is small or even backwards (6 m of crown and 7 m
//   of chain give a ring that hardly leans at all, half a degree the wrong way). So the sum is done properly here:
//   swingRound() below integrates one chair on its chain in the turning drum (the centrifugal and Coriolis terms
//   whole, and the drag of thin air) from standstill until it repeats, and every chair is drawn from that.
//   This ride is cut to lean. With 8.0 m of crown and 4.8 m of chain, the chair's slower swing takes 5.7 s against
//   the turn's 6.0, so it nearly keeps time with the push and answers it about four times over, on the same side:
//     flying spinward: chain 33 degrees from the vertical, seat 4.0 m under the hinges and 10.6 m out, 9.5 m/s,
//                      weight x 1.11 (an eighth more)
//     flying anti:     chain 72 degrees, seat 1.5 m under the hinges and 12.6 m out, 15.0 m/s, weight x 0.83 (a sixth less)
//   The ring of seats lies in a plane tilted 6.3 degrees, 2.6 m lower on the spinward-flying side (its lowest point
//   comes about a dozen degrees of turn late), and the chairs bunch and go slowly on the low side and string out and
//   go fast on the high one: chains lean 18 degrees ahead at the anti end of the ring and 21 behind at the spinward end.
//   Spin sinks, anti floats: the low side is the side where the chairs fly spinward.
//
// THE SHIES' SUMS. A ball is thrown at 14 m/s, 15 degrees up, from 1.7 m, at tins 12 m away. Each ball flies a
// straight line in the frame that does not turn and is drawn as the deck sees it (ballAt() below, and the same sum in
// the lamps' shader). Thrown spinward it comes to the tins 0.5 m off the floor; thrown antispinward, 1.7 m; along the
// axis, 1.1 m, and 3 cm to one side of straight (docs/ashgrove.md, Day one: "axis flies true, spin sinks, anti
// floats"). So the two shelves of one stall stand at different heights, and the paths painted on its back wall are
// the paths the balls fly.
//
// Not canon (the docs give Borage its arcade, Lightfall and its two dishes, its palette "Received light", its
// neighbourhoods' names and the custom of a fair held in light; nothing of how any of it looks):
//   - the Lightfall Arcade being on deck 16 on the Quaysides, its stalls, lanterns and cloth, and every dish but the
//     Seven-year soup and the cheese; the ages of all the lights but the soup's (the cheese's nine years, the days
//     of the passing raft's dishes); the wording of every card, board and notice
//   - the fair court of Lanternfold: its size, its terraces with their lamps down, the lantern strings
//   - the swing ride and everything about it but the physics: its size, its tuning, its crown, mast and fence, its
//     painted board; that a ride would be built to lean on purpose
//   - the shies: the stall, its two shelves, the painted paths, the lit balls, the lane along the axis
//   - the wheel of lamps
import {
  Scene, Mesh, ShaderMaterial, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, AdditiveBlending,
  DoubleSide, Vector3, Vector4, Matrix4,
} from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DRUM, DEG } from '../kit/drum.js';
import { makeDeck, finish, street, atrium, Run, PALETTES } from '../kit/deck.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG } from '../kit/mats.js';
import { Geo, shade, rgb } from '../kit/geo.js';
import { SKIN, CLOTH } from '../kit/folk.js';
import { makeRng } from '../core/rng.js';

const TAU = Math.PI * 2;
const R16 = deckRadius(16), W = DRUM.OMEGA;          // 2,940 m; the drum's turn, rad/s
// the court's floor (deck 16, y = 0) and how high it goes
const CX0 = -34, CX1 = 70, CZ0 = -25, CZ1 = 25, STOREYS = 6;
// the swing ride: its mast stands at the origin
const RIDE = { a: 8.0, L: 4.8, H: 9.2, turn: 6.0, seats: 32, fence: 14.6 };
const OM = TAU / RIDE.turn;                          // the crown's turn, rad/s: hinges go from spinward (+x) round by the back (+z)
// the wheel of lamps, at the spinward end: the way out goes through its middle
const WHEEL = { x: 60, y: 8.4, r0: 5.2, r1: 7.0 };
// the shies, along the court's front side: two lanes thrown toward a tower of shelves in the middle, and one along the axis
const SHY = { xm: 29, z0: -23.6, z1: -20.3, y: 1.7, speed: 14, up: 15 * DEG, far: 12, lanes: [-22.75, -21.55], axisX: 46.2, axisZ: -11.1 };
// the received palette (15-canon.js): night, blue, rose, pale; and the gold of a filament bulb
const PAL = { night: '#1d2233', blue: '#4f5f99', rose: '#e9a6c2', pale: '#fff4fb', gold: '#ffc470' };
const LANTERNS = ['#7f95ff', '#ff9cc6', '#fff1f8', '#ff9cc6', '#7f95ff', '#ffd9a8'];      // what the lanterns shine: the palette, lit from inside

// Borage's paint by night: night-blue plaster, rose and pale cloth, old gilt
const NIGHT = {
  ...PALETTES.dim,
  walls: ['#474c70', '#3f4466', '#50557a', '#444a6c', '#544f72', '#3c4268'],
  dado: ['#2b3050', '#322e52', '#282d4c', '#36365a'],
  trim: ['#1d2233', '#2c2646', '#1b2036', '#352a40'],
  doors: ['#4f5f99', '#e9a6c2', '#8a5f86', '#3a4a80', '#c98aa8', '#6a74b0', '#b8869c', '#2d3660'],
  awnings: [['#4f5f99', '#fff4fb'], ['#e9a6c2', '#fff4fb'], ['#2a3052', '#e9a6c2'], ['#4f5f99', '#e9a6c2'], ['#8a5f86', '#fff4fb']],
  signs: [['#1d2233', '#fff4fb'], ['#2a2f52', '#e9a6c2'], ['#fff4fb', '#1d2233'], ['#4f5f99', '#fff4fb'], ['#3a2a44', '#ffd9a0'], ['#e9a6c2', '#1d2233']],
  floor: '#464a64', strip: '#33374f', court: '#4e536e', ceiling: '#262a42', rib: '#3d4262',
  rooms: ['#d6ab72', '#c99a8a', '#d9b090', '#b9a8c8', '#dcc094', '#cfa88c', '#c4aec8'],
  metal: '#55586c', brass: '#b8944e', glass: '#9fb0d0',
  leaf: ['#3f5a58', '#3a5560', '#4a6460', '#35504e', '#456058', '#3d5868'],
  bloom: ['#e9a6c2', '#fff4fb', '#c9b6ff', '#f0c9da', '#b8c2f0'],
  tub: ['#3a3f5c', '#4a4764', '#2d3250', '#544a60'],
  lamp: '#ffc98a', window: ['#e9a6c2', '#fff4fb', '#ffd9a0', '#aab8ff'], shop: '#ffd29a',
  goods: 0.9,
};

// ---------------------------------------------------------------- the chairs' round
// One chair on its chain, hung from a hinge that goes round the mast, in a drum that turns. The seat is a point on a
// chain of length L; d is the unit vector from hinge to seat and w its rate. In the deck's own axes (x spinward, y
// toward the axis, z along it) the drum's turning gives every moving thing the centrifugal pull W^2 x (its distance
// from the axis, outward) and the Coriolis push (2 W vy, -2 W vx, 0): moving spinward presses you down, rising
// carries you spinward. The air drags as the square of the speed (0.0017 /m: a rider and seat of 85 kg and 0.7 m2 in
// heliox of 0.42 kg/m3). The crown is brought up to speed over 12 s and the chair followed for forty turns, by which
// time it repeats to a third of a degree; the last turn is kept as five terms of a Fourier series in the hinge's angle.
// Returns { co: [[outward cos, outward sin, forward cos, forward sin] x 5], lo, hi, far }: the series, the chain's
// angle, drop and reach where it hangs steepest and flattest, and the farthest a seat gets from the mast.
function* swingRound() {
  const { a, L, H, turn } = RIDE, Rc = R16 - H, kd = 0.0017, dt = 0.03, spin = 12, turns = 40, tEnd = spin + turns * turn, K = 5;
  const f = (t, s, o) => {
    const u = Math.min(1, t / spin), om = OM * u * u * (3 - 2 * u), al = t < spin ? OM * 6 * u * (1 - u) / spin : 0;
    const c = Math.cos(s[0]), sn = Math.sin(s[0]);
    // the seat's place and speed
    const px = a * c + L * s[1], py = L * s[2], vx = -a * om * sn + L * s[4], vy = L * s[5], vz = a * om * c + L * s[6], sp = Math.hypot(vx, vy, vz);
    // what pulls on it, less the hinge's own acceleration
    const fx = W * W * px + 2 * W * vy - kd * sp * vx + a * al * sn + a * om * om * c;
    const fy = W * W * (py - Rc) - 2 * W * vx - kd * sp * vy;
    const fz = -kd * sp * vz - a * al * c + a * om * om * sn;
    // the chain takes whatever lies along it
    const pull = fx * s[1] + fy * s[2] + fz * s[3] + L * (s[4] * s[4] + s[5] * s[5] + s[6] * s[6]);
    o[0] = om; o[1] = s[4]; o[2] = s[5]; o[3] = s[6];
    o[4] = (fx - pull * s[1]) / L; o[5] = (fy - pull * s[2]) / L; o[6] = (fz - pull * s[3]) / L;
  };
  const s = [0, 0, -1, 0, 0, 0, 0], q = new Array(7), k1 = new Array(7), k2 = new Array(7), k3 = new Array(7), k4 = new Array(7);
  const sum = []; for (let k = 0; k < K; k++) sum.push([0, 0, 0, 0]);
  const lo = { th: 9 }, hi = { th: -9 }, steps = Math.round(tEnd / dt), per = Math.round(turn / dt);
  let n = 0, far = 0, t0 = performance.now();
  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    f(t, s, k1);
    for (let j = 0; j < 7; j++) q[j] = s[j] + k1[j] * dt / 2;
    f(t + dt / 2, q, k2);
    for (let j = 0; j < 7; j++) q[j] = s[j] + k2[j] * dt / 2;
    f(t + dt / 2, q, k3);
    for (let j = 0; j < 7; j++) q[j] = s[j] + k3[j] * dt;
    f(t + dt, q, k4);
    for (let j = 0; j < 7; j++) s[j] += (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) * dt / 6;
    const l = Math.hypot(s[1], s[2], s[3]); s[1] /= l; s[2] /= l; s[3] /= l;
    const dw = s[1] * s[4] + s[2] * s[5] + s[3] * s[6]; s[4] -= dw * s[1]; s[5] -= dw * s[2]; s[6] -= dw * s[3];
    if (i >= steps - per) {
      const c = Math.cos(s[0]), sn = Math.sin(s[0]), out = s[1] * c + s[3] * sn, fwd = -s[1] * sn + s[3] * c, th = Math.acos(-s[2]);
      for (let k = 0; k < K; k++) { const ck = Math.cos(k * s[0]), sk = Math.sin(k * s[0]); sum[k][0] += out * ck; sum[k][1] += out * sk; sum[k][2] += fwd * ck; sum[k][3] += fwd * sk; }
      n++;
      const here = { th, drop: -L * s[2], reach: Math.hypot(a + L * out, L * fwd), at: ((s[0] % TAU) + TAU) % TAU };
      if (th < lo.th) Object.assign(lo, here);
      if (th > hi.th) Object.assign(hi, here);
      far = Math.max(far, here.reach);
    }
    if (i % 40 === 39 && performance.now() - t0 > 3) { yield 'fair: the round'; t0 = performance.now(); }
  }
  const co = sum.map((c, k) => c.map((v) => v * (k ? 2 : 1) / n));
  return { co, lo, hi, far };
}

// ---------------------------------------------------------------- a thrown ball
// Where a ball is tau seconds after it leaves p0 = [x, y, z] at v = [spinward, up, along the axis] m/s: a straight
// line in the frame that does not turn, seen from the deck (flat metres, as everything here is modelled).
function ballAt(p0, v, tau) {
  const R0 = R16 - p0[1], Vt = W * R0 + v[0], qx = R0 - v[1] * tau, qy = Vt * tau;
  return [p0[0] + (Math.atan2(qy, qx) - W * tau) * R16, R16 - Math.hypot(qx, qy), p0[2] + v[2] * tau];
}
// the seconds a ball takes to go `far` metres along its lane (x, or z for the lane along the axis)
function ballTime(p0, v, far, axis) {
  let lo = 0, hi = 3;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2, p = ballAt(p0, v, m); if (Math.abs(axis ? p[2] - p0[2] : p[0] - p0[0]) < far) lo = m; else hi = m; }
  return lo;
}

// ---------------------------------------------------------------- shaders
// Where a chair is. Shared by the chairs themselves and by the bulbs on their chains.
const SWING_GLSL = /* glsl */`
uniform vec4 uSw[5];     // the round, from swingRound(): for k turns of the hinge's angle, the chain's lean outward (cos, sin) and forward (cos, sin)
uniform vec4 uRide;      // crown radius, hinge height, the mast's x and z
uniform float uPhi;      // the crown's angle now
// the axes of the chair whose hinge is at angle phi (x across, y up its chain, z the way it flies), and its hinge
mat3 kChair(float phi, out vec3 hinge) {
  float lo = uSw[0].x, lf = uSw[0].z;
  for (int k = 1; k < 5; k++) { float c = cos(float(k) * phi), s = sin(float(k) * phi); lo += uSw[k].x * c + uSw[k].y * s; lf += uSw[k].z * c + uSw[k].w * s; }
  vec3 er = vec3(cos(phi), 0.0, sin(phi)), et = vec3(-er.z, 0.0, er.x);
  vec3 up = vec3(0.0, sqrt(max(1.0 - lo * lo - lf * lf, 0.0)), 0.0) - er * lo - et * lf;
  vec3 fw = normalize(et - up * dot(et, up));
  hinge = vec3(uRide.z, uRide.y, uRide.w) + er * uRide.x;
  return mat3(cross(up, fw), up, fw);
}`;

// The chairs: one model, thirty-two copies, each hung where the sums put it. Lit by the deck's own lamps.
const CHAIR_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit;
attribute float aPart;     // 1: the rider (who may be small, or not there)
attribute vec4 aSeat;      // each chair's: its hinge's angle on the crown, its rider's size (0: nobody)
attribute vec3 aCloth; attribute vec3 aSkin; attribute vec3 aShell;
${BEND_PARS}
${SWING_GLSL}
uniform float uL;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vSoft;
void main() {
  vec3 m = position, n = normal, hinge, seat = vec3(0.0, -uL, 0.0);
  if (aPart > 0.5) m = seat + (m - seat) * aSeat.y;
  mat3 B = kChair(uPhi + aSeat.x, hinge);
  vec3 p = hinge + B * m; n = B * n;
  vF = p; vFN = n;
  kBend(p, n);
  vW = p; vN = n;
  vec3 c = aCol.rgb;
  if (aCol.a > 0.85) c *= aCloth; else if (aCol.a > 0.5) c *= aSkin; else if (aCol.a > 0.17) c *= aShell;
  vCol = c; vEmit = aEmit; vSoft = step(0.85, aCol.a);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const chairFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vSoft;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  float soft = vSoft * 0.5;
  N = normalize(mix(N, kUp(vW), soft)); FN = normalize(mix(FN, vec3(0.0, 1.0, 0.0), soft));
  gl_FragColor = vec4(kAir(vCol * (kLight(vW, N, vF, FN) + vEmit), vW), 1.0);
}`;

// Lamps that move: bulbs on the turning crown, bulbs down the chains, lamps that chase round the wheel, and the lit
// balls of the shies with the lights that trail them. One mesh, drawn as the kit draws its small lights.
const LAMP_VERT = /* glsl */`
attribute vec3 aPos;       // kind 0: where it is. 1: where on the crown, from the mast, the crown at angle 0. 2: where on a chair, in the chair's own axes. 3: where a ball leaves the hand
attribute vec4 aColSize;   // rgb x strength, size in metres
attribute vec4 aKind;      // the kind; then for 0 to 2: the hinge's angle (chairs), where it is in a chase (below 0: steady), how much it flickers;
                           // for 3: the second its throw begins, the seconds it flies, the seconds between throws
attribute vec4 aVel;       // a ball's velocity, m/s, and how far behind the ball this light trails, s
${BEND_PARS}
${SWING_GLSL}
uniform float uTime, uT, uChase, uPx, uMinPx, uMaxPx, uOmega; uniform vec2 uRes;
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  vec3 p = aPos; float kind = aKind.x, fade = 1.0;
  vW = vec3(0.0); vC = vec3(0.0); vQ = vec2(0.0);
  if (kind > 2.5) {
    // a straight line in the frame that does not turn, as the deck sees it
    float tau = mod(uT - aKind.y, aKind.w) - aVel.w;
    if (tau < 0.0 || tau > aKind.z) { gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
    float R0 = uBend.z - aPos.y, Vt = uOmega * R0 + aVel.x;
    vec2 q = vec2(R0 - aVel.y * tau, Vt * tau);
    p = vec3(aPos.x + (atan(q.y, q.x) - uOmega * tau) * uBend.z, uBend.z - length(q), aPos.z + aVel.z * tau);
  } else {
    if (kind > 1.5) { vec3 hinge; mat3 B = kChair(uPhi + aKind.y, hinge); p = hinge + B * aPos; }
    else if (kind > 0.5) { float c = cos(uPhi), s = sin(uPhi); p = vec3(uRide.z + aPos.x * c - aPos.z * s, aPos.y, uRide.w + aPos.x * s + aPos.z * c); }
    if (aKind.z >= 0.0) { float w = fract(aKind.z - uT * uChase); fade = 0.22 + 0.78 * smoothstep(0.0, 0.1, w) * smoothstep(0.6, 0.45, w); }
    fade *= 1.0 + aKind.w * sin(uTime * (1.7 + 2.3 * fract(aPos.x * 3.71 + aPos.z * 1.93)) + aPos.y * 31.0 + aPos.x * 17.0);
  }
  vec3 n = vec3(0.0, 1.0, 0.0);
  kBend(p, n);
  vW = p;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float px = aColSize.w * uPx / max(-mv.z, 0.01), shown = clamp(px, uMinPx, uMaxPx);
  vC = aColSize.rgb * min(px * px / (shown * shown), 1.0) * fade;
  vQ = position.xy;
  vec4 clip = projectionMatrix * mv;
  clip.xy += position.xy * shown / uRes * clip.w * 2.0;
  gl_Position = clip;
}`;
const LAMP_FRAG = /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  ${CLIP_FRAG}
  float a = pow(max(1.0 - length(vQ) * 2.0, 0.0), 1.9);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;

// the uniforms both of those share: set each frame from the flight's clock
function rideUniforms(frame, round) {
  return {
    uClip: G.uClip, uTime: G.uTime, uPx: G.uPx, uRes: G.uRes,
    uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) },
    uSw: { value: round.co.map((c) => new Vector4(c[0], c[1], c[2], c[3])) },
    uRide: { value: new Vector4(RIDE.a, RIDE.H, 0, 0) }, uPhi: { value: 0 }, uT: { value: 0 }, uL: { value: RIDE.L },
  };
}
// lamps: [{ p, color, power, size, kind, a, chase, tw, vel, lag, from, flies, every }]
function lampMesh(lamps, U) {
  const n = lamps.length, g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const aPos = new Float32Array(n * 3), aCS = new Float32Array(n * 4), aKind = new Float32Array(n * 4), aVel = new Float32Array(n * 4);
  lamps.forEach((q, i) => {
    const c = rgb(q.color || PAL.gold), k = q.power === undefined ? 1 : q.power, kind = q.kind || 0;
    aPos.set(q.p, i * 3);
    aCS.set([c[0] * k, c[1] * k, c[2] * k, q.size || 0.2], i * 4);
    if (kind === 3) { aKind.set([3, q.from, q.flies, q.every], i * 4); aVel.set([q.vel[0], q.vel[1], q.vel[2], q.lag || 0], i * 4); }
    else aKind.set([kind, q.a || 0, q.chase === undefined ? -1 : q.chase, q.tw || 0], i * 4);
  });
  g.setAttribute('aPos', new InstancedBufferAttribute(aPos, 3));
  g.setAttribute('aColSize', new InstancedBufferAttribute(aCS, 4));
  g.setAttribute('aKind', new InstancedBufferAttribute(aKind, 4));
  g.setAttribute('aVel', new InstancedBufferAttribute(aVel, 4));
  g.instanceCount = n;
  const m = new Mesh(g, new ShaderMaterial({
    uniforms: { ...U, uChase: { value: 1.25 }, uMinPx: { value: 1.5 }, uMaxPx: { value: 140 }, uOmega: { value: W } },
    vertexShader: LAMP_VERT, fragmentShader: LAMP_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
  }));
  m.frustumCulled = false; m.renderOrder = 10;
  return m;
}

// ---------------------------------------------------------------- the swing ride
// One chair on its chains, modelled hanging straight down from its hinge at the origin: x across, y up the chain,
// z the way it flies. Vertices painted with tint 1 take the rider's clothes, 0.66 their skin, 0.33 the seat's paint.
function chairGeo() {
  const g = new Geo(), L = RIDE.L, part = [], sy = -L;
  const mark = (v, fn) => { const n0 = g.pos.length / 3; fn(); for (let i = n0, n1 = g.pos.length / 3; i < n1; i++) part.push(v); };
  mark(0, () => {
    g.box(-0.05, -0.16, -0.3, 0.05, 0.04, 0.3, '#3d4052');                                      // the shackle under the crown's rim
    // four chains: from the front of the shackle to the front of the seat, from the back to the top of its back
    for (const sx of [-1, 1]) {
      g.tube([[0, -0.12, 0.24], [sx * 0.25, sy + 0.02, 0.2]], 0.016, 3, '#c9c2ae', { emit: 0.25 });
      g.tube([[0, -0.12, -0.24], [sx * 0.25, sy + 0.5, -0.22]], 0.016, 3, '#c9c2ae', { emit: 0.25 });
      g.box(sx * 0.25 - 0.018, sy - 0.02, -0.235, sx * 0.25 + 0.018, sy + 0.5, -0.2, '#8f8a80', { skip: 'b' });      // the back's two uprights
    }
    g.tint(0.33);
    g.box(-0.25, sy - 0.05, -0.21, 0.25, sy, 0.2, '#ffffff');                                   // the pan
    g.box(-0.25, sy + 0.2, -0.24, 0.25, sy + 0.29, -0.21, '#f2f2f2').box(-0.25, sy + 0.41, -0.24, 0.25, sy + 0.5, -0.21, '#f2f2f2');     // two slats for a back
    g.tint(0);
    g.box(-0.26, sy + 0.27, 0.18, 0.26, sy + 0.3, 0.21, '#c9a85a', { emit: 0.2 });               // the bar across the lap
    g.tint(0.33).box(-0.07, sy + 0.5, -0.27, 0.07, sy + 0.58, -0.2, '#ffffff', { emit: 2.4 }).tint(0);        // a lamp on the back
  });
  mark(1, () => {
    // the rider: sitting, holding the front chains, legs hanging
    g.tint(1).cyl(0, sy, -0.06, 0.2, 0.17, 0.54, 6, '#ffffff', { smooth: false });
    for (const sx of [-1, 1]) {
      g.tint(0);
      g.box(sx * 0.11 - 0.078, sy, -0.04, sx * 0.11 + 0.078, sy + 0.15, 0.42, '#8a90a8');           // thigh
      g.box(sx * 0.11 - 0.065, sy - 0.46, 0.3, sx * 0.11 + 0.065, sy + 0.02, 0.42, '#7c839c', { skip: 't' });    // shin, hanging
      g.box(sx * 0.11 - 0.07, sy - 0.55, 0.3, sx * 0.11 + 0.07, sy - 0.46, 0.56, '#2f2b36');         // shoe
      g.tint(1).tube([[sx * 0.21, sy + 0.47, -0.05], [sx * 0.28, sy + 0.36, 0.12], [sx * 0.2, sy + 0.5, 0.21]], 0.047, 4, '#f0f0f0');
      g.tint(0.66).blob(sx * 0.2, sy + 0.53, 0.21, 0.052, 0, '#ffffff', { shadeBottom: 0.85 });
    }
    g.tint(0.66).blob(0, sy + 0.71, -0.05, 0.13, 0, '#ffffff', { shadeBottom: 0.8 });
    g.tint(0).box(-0.115, sy + 0.72, -0.18, 0.115, sy + 0.86, -0.07, '#2b2522');                  // hair
  });
  const geo = g.build();
  geo.setAttribute('aPart', new Float32BufferAttribute(part, 1));
  return geo;
}

// the thirty-two chairs as one mesh, and the bulbs that go with each (into `lamps`)
function chairMesh(deck, U, rng, lamps) {
  const src = chairGeo(), g = new InstancedBufferGeometry(), n = RIDE.seats;
  g.index = src.index; for (const k of ['position', 'normal', 'aCol', 'aEmit', 'aPart']) g.setAttribute(k, src.getAttribute(k));
  const seat = new Float32Array(n * 4), cloth = new Float32Array(n * 3), skin = new Float32Array(n * 3), shell = new Float32Array(n * 3);
  const paints = [PAL.rose, '#7f8fd0', PAL.pale, '#c98aa8'];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, r = rng(), size = i % 11 === 6 ? 0 : r < 0.36 ? rng.f(0.7, 0.84) : rng.f(1.0, 1.12);      // three empty; a third of the riders are children
    seat.set([a, size, 0, 0], i * 4);
    cloth.set(rgb(rng.pick(CLOTH)), i * 3); skin.set(rgb(rng.pick(SKIN)), i * 3);
    shell.set(rgb(i === 19 ? '#8d909c' : paints[i % 4]), i * 3);                                // one seat is a replacement, never painted
    // four bulbs down each front chain
    for (const sx of [-1, 1]) for (let k = 1; k <= 4; k++) { const f = k / 5; lamps.push({ p: [sx * 0.25 * f, -0.12 + (-RIDE.L + 0.14) * f, 0.24 - 0.04 * f], kind: 2, a, color: PAL.gold, power: 3.2, size: 0.15, tw: 0.08 }); }
    lamps.push({ p: [0, -RIDE.L + 0.54, -0.28], kind: 2, a, color: i === 19 ? '#fff1f8' : ['#ff9cc6', '#8fa2ff', '#fff1f8', '#ff9cc6'][i % 4], power: 3.0, size: 0.3 });
  }
  g.setAttribute('aSeat', new InstancedBufferAttribute(seat, 4));
  g.setAttribute('aCloth', new InstancedBufferAttribute(cloth, 3));
  g.setAttribute('aSkin', new InstancedBufferAttribute(skin, 3));
  g.setAttribute('aShell', new InstancedBufferAttribute(shell, 3));
  g.instanceCount = n;
  const m = new Mesh(g, new ShaderMaterial({ uniforms: { ...deck.rig.uniforms, ...U }, vertexShader: CHAIR_VERT, fragmentShader: chairFrag(deck.rig), side: DoubleSide }));
  m.frustumCulled = false;
  return m;
}

// The crown: everything that turns as one piece, modelled round the mast with its first hinge spinward. It is one
// mesh in the deck's own bent paint, and update() turns it about the mast.
function crownGeo(lamps) {
  const g = new Geo(), { a, H } = RIDE, N = 32, r0 = a + 0.1, r1 = a + 0.42, top = H + 1.42;
  const P = (r, ang, y) => [r * Math.cos(ang), y, r * Math.sin(ang)];
  const stripe = [PAL.blue, PAL.rose], gilt = '#c9a85a';
  for (let i = 0; i < N; i++) {
    const a0 = (i - 0.5) / N * TAU, a1 = (i + 0.5) / N * TAU, am = (a0 + a1) / 2;
    // the rounding board over each hinge: a panel leaning out, blue and rose by turns, one of them a patch
    g.quad(P(r0, a0, H + 0.12), P(r0, a1, H + 0.12), P(r1, a1, top), P(r1, a0, top), i === 11 ? '#8f86a8' : stripe[i % 2], 0.35);
    g.quad(P(r0 + 0.01, a0, H + 0.12), P(r0 + 0.01, a1, H + 0.12), P(r0 + 0.03, a1, H + 0.21), P(r0 + 0.03, a0, H + 0.21), gilt, 0.5);
    g.quad(P(r1, a0, top - 0.09), P(r1, a1, top - 0.09), P(r1 + 0.03, a1, top + 0.03), P(r1 + 0.03, a0, top + 0.03), gilt, 0.5);
    // a pale lozenge painted in the middle of each
    const lz = (da, y) => P((r0 + r1) / 2 + 0.03 + (y - H - 0.77) * 0.245, am + da, y);
    g.quad(lz(0, H + 0.42), lz(0.045, H + 0.77), lz(0, H + 1.12), lz(-0.045, H + 0.77), PAL.pale, 0.6);
    // the valance under it: two scallops of cloth
    for (let k = 0; k < 2; k++) { const b0 = a0 + (a1 - a0) * k / 2, b1 = a0 + (a1 - a0) * (k + 1) / 2; g.tri(P(r0, b0, H + 0.12), P(r0 + 0.02, (b0 + b1) / 2, H - 0.3), P(r0, b1, H + 0.12), (i + k) % 2 ? PAL.pale : PAL.rose, 0.3); }
    // the roof: gores of cloth up to the mast, seen from the terraces; and its lining, lit from inside
    g.quad(P(r1, a0, top), P(r1, a1, top), P(0.7, a1, H + 3.5), P(0.7, a0, H + 3.5), i % 2 ? '#3d4a80' : PAL.pale, i % 2 ? 0.12 : 0.22);
    g.quad(P(r0, a1, H + 0.3), P(r0, a0, H + 0.3), P(0.9, a0, H + 0.95), P(0.9, a1, H + 0.95), i % 2 ? '#f6e3e9' : '#e9d6e2', 0.42);
    // bulbs: a row along the top of the board and one along its foot, chasing opposite ways; one on each scallop's point
    for (let k = 0; k < 3; k++) {
      const b = a0 + (a1 - a0) * (k + 0.5) / 3, j = i * 3 + k;
      lamps.push({ p: P(r1 + 0.07, b, top + 0.02), kind: 1, power: 3.4, size: 0.17, chase: (j % 4) / 4 });
      lamps.push({ p: P(r0 + 0.06, b, H + 0.2), kind: 1, power: 3.0, size: 0.15, chase: ((400 - j) % 4) / 4 });
    }
    for (let k = 0; k < 2; k++) lamps.push({ p: P(r0 + 0.04, a0 + (a1 - a0) * (k + 0.5) / 2, H - 0.32), kind: 1, color: (i + k) % 2 ? '#fff1f8' : '#ff9cc6', power: 2.6, size: 0.16 });
    lamps.push({ p: lz(0, H + 0.77), kind: 1, color: '#fff1f8', power: 2.2, size: 0.2 });
  }
  // sixteen arms under the lining, a bulb every metre along each; ribs with bulbs on the roof
  for (let i = 0; i < 16; i++) {
    const ang = (i + 0.5) / 16 * TAU, c = Math.cos(ang), s = Math.sin(ang);
    g.tube([P(0.8, ang, H + 0.86), P(r0 - 0.05, ang, H + 0.22)], 0.07, 4, '#3d4052');
    for (let k = 1; k <= 7; k++) { const r = 0.9 + k * 0.98; lamps.push({ p: [r * c, H + 0.72 - (r - 0.8) * 0.088, r * s], kind: 1, power: 3.2, size: 0.15, chase: i % 2 ? undefined : ((k + i * 2) % 4) / 4 }); }
    for (let k = 1; k <= 5; k++) { const t = k / 6, r = r1 + (0.7 - r1) * t; lamps.push({ p: [r * c, top + (H + 3.5 - top) * t + 0.06, r * s], kind: 1, color: i % 2 ? '#ff9cc6' : PAL.gold, power: 2.4, size: 0.15 }); }
  }
  // the hub that rides up the mast, and a lantern on top
  g.cyl(0, H - 0.5, 0, 0.92, 0.92, 1.5, 12, '#55586c', { cap: false });
  g.cyl(0, H + 3.5, 0, 0.72, 0.5, 0.5, 12, gilt, { emit: 0.3 });
  g.blob(0, H + 4.5, 0, [0.55, 0.62, 0.55], 1, '#ff9cc6', { emit: 2.6, shadeBottom: 1 });
  lamps.push({ p: [0, H + 4.5, 0], kind: 1, color: '#ff9cc6', power: 3, size: 1.5 });
  return g;
}

// a board with a frame of chasing bulbs, standing at c = [x, y, z] (its middle) and facing n = [nx, nz]
function bulbBoard(deck, g, lamps, c, n, w, h, lines, o = {}) {
  const yaw = Math.atan2(-n[0], -n[1]), ground = o.ground || PAL.night;
  g.at(c[0], c[1], c[2], yaw);
  g.box(-w / 2 - 0.12, -h / 2 - 0.12, 0, w / 2 + 0.12, h / 2 + 0.12, 0.1, '#3d4052');
  g.box(-w / 2 - 0.12, -h / 2 - 0.12, -0.012, w / 2 + 0.12, h / 2 + 0.12, 0, '#c9a85a', { emit: 0.25, skip: 's' });
  g.box(-w / 2, -h / 2, -0.01, w / 2, h / 2, 0, ground, { skip: 's', emit: 0.3 });
  for (const sx of o.posts === false ? [] : [-1, 1]) g.box(sx * (w / 2 - 0.3) - 0.06, -c[1], 0.1, sx * (w / 2 - 0.3) + 0.06, -h / 2 - 0.1, 0.2, '#3d4052', { skip: 'tb' });
  g.pop();
  const cy = Math.cos(yaw), sy = Math.sin(yaw), at = (u, v, out) => [c[0] + u * cy - out * sy, c[1] + v, c[2] - u * sy - out * cy];
  deck.sign(lines, { at: at(0, 0, 0.022), n, w, h, style: 'board', font: o.font || 'cond', font2: o.font2 || 'serif', head: lines.length > 1, ground, ink: o.ink || PAL.pale, glow: o.glow === undefined ? 0.5 : o.glow, track: 0.1 });
  const per = 2 * (w + h) + 0.96, nb = Math.round(per / 0.32);
  for (let i = 0; i < nb; i++) {
    let s = (i / nb) * per, u, v;
    const W2 = w + 0.24, H2 = h + 0.24;
    if (s < W2) { u = -W2 / 2 + s; v = H2 / 2; } else if ((s -= W2) < H2) { u = W2 / 2; v = H2 / 2 - s; } else if ((s -= H2) < W2) { u = W2 / 2 - s; v = -H2 / 2; } else { u = -W2 / 2; v = -H2 / 2 + (s - W2); }
    lamps.push({ p: at(u, v, 0.05), kind: 0, color: o.bulb || PAL.gold, power: 2.8, size: 0.13, chase: (i % 4) / 4 });
  }
}

// What stands still of the ride: the stage the chairs come down to when the crown is lowered, the mast, the fence
// and its gate, the booth, and the painted board that says why
function* rideStands(deck, lamps) {
  const P = deck.pen(new Run(0, 0, 0, 0), 0, 'ride'), g = P.g, { H, fence } = RIDE, gilt = '#c9a85a', iron = '#3d4052';
  const pt = (r, ang, y) => [r * Math.cos(ang), y, r * Math.sin(ang)];
  for (const [r, y0, y1, col, top] of [[10.5, 0, 0.18, '#353a54', '#3f4460'], [10.1, 0.18, 0.36, '#3b405c', '#454a68'], [9.7, 0.36, 0.54, '#5a4f66', '#6a5f58']]) g.cyl(0, y0, 0, r, r, y1 - y0, 48, col, { smooth: false, top });
  // boards on the stage, laid in rings, a few of them newer
  for (let i = 0; i < 48; i++) { const a0 = i / 48 * TAU, a1 = (i + 1) / 48 * TAU; g.quad(pt(9.6, a0, 0.545), pt(2.0, a0, 0.545), pt(2.0, a1, 0.545), pt(9.6, a1, 0.545), i % 7 === 3 ? '#7d7488' : i % 2 ? '#5d566c' : '#565066'); }
  // the engine house round the foot of the mast, and the mast: a sleeve the crown's hub rides up
  g.cyl(0, 0.54, 0, 1.9, 1.9, 1.5, 16, '#4f5f99', { smooth: false, top: '#3a4674', emit: 0.12 });
  for (let i = 0; i < 16; i++) { const a0 = (i + 0.2) / 16 * TAU, a1 = (i + 0.8) / 16 * TAU; g.quad(pt(1.92, a1, 0.8), pt(1.92, a0, 0.8), pt(1.92, a0, 1.8), pt(1.92, a1, 1.8), i % 2 ? PAL.rose : PAL.pale, 0.3); }
  g.cyl(0, 2.04, 0, 0.78, 0.7, 4.6, 16, '#e6dde6', { cap: false, emit: 0.1 });
  g.cyl(0, 6.64, 0, 0.56, 0.5, H + 3.4 - 6.64, 12, '#cfc6d2', { cap: false });
  for (const y of [2.04, 3.5, 5.0, 6.5]) g.cyl(0, y, 0, 0.82, 0.82, 0.16, 16, gilt, { emit: 0.25, cap: false });
  for (let i = 0; i < 6; i++) for (let k = 0; k < 8; k++) deck.glow([{ p: pt(0.84 - k * 0.012, i / 6 * TAU + k * 0.11, 2.3 + k * 0.56), color: PAL.gold, power: 3, size: 0.15, twinkle: 0.1 }]);
  for (let i = 0; i < 16; i++) deck.glow([{ p: pt(2.0, (i + 0.5) / 16 * TAU, 1.95), color: i % 2 ? '#ff9cc6' : PAL.gold, power: 2.8, size: 0.16 }]);
  yield 'fair: the stage';
  // the fence: posts and two rails, open at the gate (toward the arcade) and at the way out beside it
  const NP = 60, gate = (ang) => Math.abs(ang - Math.PI) < 0.115 || Math.abs(ang - 2.72) < 0.07;
  for (let i = 0; i < NP; i++) {
    const a0 = i / NP * TAU, a1 = (i + 1) / NP * TAU, p0 = pt(fence, a0, 0), am = (a0 + a1) / 2;
    g.cyl(p0[0], 0, p0[2], 0.05, 0.04, 1.2, 5, iron, { smooth: false });
    if (i % 3 === 0) { g.blob(p0[0], 1.36, p0[2], [0.13, 0.15, 0.13], 0, i % 2 ? '#ff9cc6' : '#8fa2ff', { emit: 2.4, shadeBottom: 1 }); deck.glow([{ p: [p0[0], 1.36, p0[2]], color: i % 2 ? '#ff9cc6' : '#8fa2ff', power: 2.6, size: 0.5, twinkle: 0.12 }]); }
    if (gate(am)) continue;
    for (const y of [0.55, 1.08]) g.tube([pt(fence, a0, y), pt(fence, a1, y)], 0.028, 4, y > 1 ? gilt : iron, { emit: y > 1 ? 0.2 : 0 });
    // a board along the foot here and there, mended in whatever paint there was
    if (i % 5 === 2) g.quad(pt(fence + 0.03, a1, 0.12), pt(fence + 0.03, a0, 0.12), pt(fence + 0.03, a0, 0.5), pt(fence + 0.03, a1, 0.5), ['#4f5f99', '#8a5f86', '#c98aa8', '#5a4f66'][i % 4], 0.15);
  }
  // the gate: two posts and a beam with the ride's name, and beside it the booth
  for (const sz of [-1.7, 1.7]) g.box(-fence - 0.12, 0, sz - 0.12, -fence + 0.12, 3.5, sz + 0.12, '#55476a', { skip: 'b', emit: 0.1 });
  bulbBoard(deck, g, lamps, [-fence - 0.14, 3.95, 0], [-1, 0], 4.4, 0.9, ['The Swing Ride', 'ten turns a minute'], { posts: false, font: 'serif', font2: 'italic', ground: '#2a2f52', bulb: '#ff9cc6' });
  g.box(-19.0, 0, 3.4, -17.2, 2.3, 5.2, '#4f5f99', { skip: 'b', emit: 0.14 });
  g.box(-19.02, 1.05, 3.7, -19.0, 1.95, 4.9, '#f0c890', { emit: 0.9, skip: 'e' });
  const roof = [[-19.2, 3.2], [-19.2, 5.42], [-17.0, 5.42], [-17.0, 3.2]];
  for (let e = 0; e < 4; e++) { const [ax, az] = roof[e], [bx, bz] = roof[(e + 1) % 4]; for (let i = 0; i < 6; i++) P.c.tri([ax + (bx - ax) * i / 6, 2.3, az + (bz - az) * i / 6], [-18.1, 3.2, 4.3], [ax + (bx - ax) * (i + 1) / 6, 2.3, az + (bz - az) * (i + 1) / 6], (i + e) % 2 ? PAL.pale : PAL.rose, 0.3); }
  deck.sign(['A ride', '0.10'], { at: [-19.03, 2.12, 4.3], n: [-1, 0], w: 1.0, h: 0.3, style: 'card', font: 'serif', ground: PAL.pale, ink: PAL.night, glow: 0.6, head: false });
  deck.glow([{ p: [-19.1, 1.6, 4.3], color: '#ffd9a0', power: 0.7, size: 1.4 }]);
  // why it leans: painted on a board on the fence, facing the way people come in
  const ba = 205 * DEG;
  bulbBoard(deck, g, lamps, [(fence + 0.16) * Math.cos(ba), 1.78, (fence + 0.16) * Math.sin(ba)], [Math.cos(ba), Math.sin(ba)], 5.2, 1.5, ['Why it leans', 'Spinward you weigh an eighth more.', 'Anti, a sixth less.']);
  // and which side is which, over the fence where the chairs pass
  for (const [ang, word, y] of [[270 * DEG, 'Heavy side', 3.7], [90 * DEG, 'Light side', 5.9]]) {
    for (const d of [-1.7, 1.7]) { const q = pt(fence + 0.05, ang + d / fence, 0); g.box(q[0] - 0.05, 1.2, q[2] - 0.05, q[0] + 0.05, y + 0.4, q[2] + 0.05, iron, { skip: 'tb' }); }
    bulbBoard(deck, g, lamps, pt(fence + 0.12, ang, y), [Math.cos(ang), Math.sin(ang)], 3.3, 0.62, [word], { posts: false, ground: ang > 3 ? '#3a2a44' : '#2a2f52', bulb: ang > 3 ? PAL.gold : '#aab8ff' });
  }
  P.done();
  yield 'fair: the fence';
}

// The wheel of lamps: two rings laced together, standing across the spinward end of the court. Its lamps chase round
// it, six arms one way on the inner ring and eight the other way on the outer.
function* wheelStands(deck, lamps) {
  const { x, y, r0, r1 } = WHEEL, P = deck.pen(new Run(0, 0, 0, 0), x, 'wheel'), g = P.g, steel = '#4a4e66', gilt = '#c9a85a';
  const pt = (r, ang, dx = 0) => [x + dx, y + r * Math.sin(ang), r * Math.cos(ang)];
  for (const dx of [-0.3, 0.3]) for (const r of [r0, r1]) { const ring = []; for (let i = 0; i <= 64; i++) ring.push(pt(r, i / 64 * TAU, dx)); g.tube(ring, 0.1, 5, r === r0 ? gilt : steel, { emit: r === r0 ? 0.3 : 0.05 }); }
  yield 'fair: the wheel';
  for (let i = 0; i < 48; i++) {
    const a0 = i / 48 * TAU, a1 = (i + 1) / 48 * TAU;
    for (const dx of [-0.3, 0.3]) g.tube([pt(r0, a0, dx), pt(r1, (a0 + a1) / 2, dx), pt(r0, a1, dx)], 0.04, 3, steel);
    g.tube([pt(r1, (a0 + a1) / 2, -0.3), pt(r1, (a0 + a1) / 2, 0.3)], 0.04, 3, steel);
    if (i % 2 === 0) g.tube([pt(r0, a0, -0.3), pt(r0, a0, 0.3)], 0.04, 3, steel);
  }
  // it stands in a cradle: a plinth under it and two legs to each side
  g.box(x - 1.3, 0, -4.4, x + 1.3, 1.25, 4.4, '#3a3f5c', { skip: 'b', top: '#454a68' });
  g.box(x - 1.34, 0.9, -4.44, x + 1.34, 1.02, 4.44, gilt, { emit: 0.25 });
  for (const sz of [-1, 1]) for (const dx of [-1.6, 1.6]) g.tube([[x + dx, 0, sz * 8.3], [x + dx * 0.2, y - 2.6, sz * 6.55]], 0.14, 5, steel);
  for (const sz of [-1, 1]) g.box(x - 2.0, 0, sz * 8.3 - 0.5, x + 2.0, 0.3, sz * 8.3 + 0.5, '#3a3f5c', { skip: 'b' });
  // the lamps, on the face the court sees
  const f = -0.46;
  for (let i = 0; i < 96; i++) lamps.push({ p: pt(r0 - 0.02, i / 96 * TAU, f), kind: 0, color: '#fff1f8', power: 4.2, size: 0.2, chase: (i / 96) * 6 });
  for (let i = 0; i < 120; i++) lamps.push({ p: pt(r1 + 0.02, i / 120 * TAU, f), kind: 0, color: i % 2 ? PAL.gold : '#ff9cc6', power: 4, size: 0.2, chase: 8 - (i / 120) * 8 });
  for (let i = 0; i < 48; i++) { const am = (i + 0.5) / 48 * TAU; lamps.push({ p: pt((r0 + r1) / 2, i / 48 * TAU, f), kind: 0, color: '#8fa2ff', power: 3.4, size: 0.2, tw: 0.25 }); lamps.push({ p: pt(r0 + (r1 - r0) * 0.75, am, f), kind: 0, color: '#8fa2ff', power: 2.6, size: 0.16, chase: (i / 48) * 6 + 0.5 }); }
  bulbBoard(deck, g, lamps, [x - 1.36, 0.5, 0], [-1, 0], 5.4, 0.62, ['The Wheel of Lamps'], { posts: false, ground: '#2a2f52', font: 'serif', bulb: '#fff1f8' });
  P.done();
  yield 'fair: the wheel';
}

// ---------------------------------------------------------------- the shies
// One long stall along the court's front side. People throw from both ends at a tower of shelves in the middle: from
// the anti end the ball flies spinward and sinks, from the spinward end it flies anti and floats, so the two shelves
// stand at the heights the balls come in at, and the paths painted on the back wall are the ones they fly. Beside it
// a third lane is laid along the axis.
function* shies(deck, lamps, rng) {
  const { xm, z0, z1, y: hy, speed, up, far, lanes, axisX, axisZ } = SHY, xs = xm - 0.45 - far, xa = xm + 0.45 + far, X0 = xs - 1.6, X1 = xa + 1.6;
  const P = deck.pen(new Run(0, 0, 0, 0), xm, 'shies'), g = P.g, c = P.c, gilt = '#c9a85a', iron = '#3d4052';
  const vS = [speed * Math.cos(up), speed * Math.sin(up), 0], vA = [-vS[0], vS[1], 0], vX = [0, vS[1], -vS[0]];
  const tS = ballTime([xs, hy, 0], vS, far), tA = ballTime([xa, hy, 0], vA, far), tX = ballTime([axisX, hy, axisZ], vX, far, true);
  const hS = ballAt([xs, hy, 0], vS, tS)[1], hA = ballAt([xa, hy, 0], vA, tA)[1], hX = ballAt([axisX, hy, axisZ], vX, tX)[1];
  const TIN = ['#c9a2b6', '#8f9bd0', '#e6dfe6', '#b8944e', '#9a86a8'];
  // a stack of six tins, three, two and one, the row across the lane; `down`: knocked about instead
  const stack = (x, y, z, ax, down) => {
    let n = 0;
    for (let k = 0; k < 3; k++) for (let j = 0; j < 3 - k; j++) {
      const o = (j - (2 - k) / 2) * 0.19, col = TIN[(n++ + Math.abs(Math.round(x + z))) % 5];
      if (down && k > 0) { const dx = rng.f(-0.3, 0.3), dz = rng.f(-0.4, 0.4); g.rot('z', Math.PI / 2).cyl(y + 0.085, -(x + dx) - 0.085, z + dz, 0.085, 0.085, 0.17, 8, col, { smooth: false, top: shade(col, 0.6), base: true }).pop(); continue; }
      g.cyl(ax ? x + o : x, y + k * 0.17, ax ? z : z + o, 0.085, 0.085, 0.17, 8, col, { smooth: false, top: shade(col, 0.6), emit: 0.12 });
    }
  };
  // the floor cloth, the back wall, the padded tower and its two shelves
  g.box(X0, 0, z0, X1, 0.02, z1 + 0.42, '#3a2f4a', { skip: 'b' });
  g.box(X0, 0, z0 - 0.14, X1, 3.7, z0, '#333a66', { skip: 'b', emit: 0.1 });
  g.box(xm - 0.3, 0, z0, xm + 0.3, 3.3, z1 - 0.25, '#8a5f86', { skip: 'b', emit: 0.1 });
  for (const [sd, h, col] of [[-1, hS, '#ff9cc6'], [1, hA, '#aab8ff']]) {
    const xa0 = xm + sd * 0.3, xa1 = xm + sd * 1.0, top = h - 0.255;
    g.box(Math.min(xa0, xa1), top - 0.07, z0, Math.max(xa0, xa1), top, z1 - 0.25, '#55476a');
    g.box(Math.min(xa0, xa1), Math.max(0, top - 0.42), z1 - 0.31, Math.max(xa0, xa1), top, z1 - 0.25, '#2a2f52', { emit: 0.2 });
    g.box(xm + sd * 0.92 - 0.04, 0, z1 - 0.33, xm + sd * 0.92 + 0.04, top - 0.07, z1 - 0.25, iron, { skip: 'tb' });
    deck.sign([h.toFixed(1) + ' m'], { at: [xm + sd * 0.65, top - 0.19, z1 - 0.245], n: [0, 1], w: 0.62, h: 0.3, style: 'plate', font: 'cond', ground: '#1d2233', ink: col, glow: 0.7 });
    lanes.forEach((zl, li) => stack(xm + sd * 0.64, top, zl, false, sd < 0 && li === 1));
  }
  // the paths, painted on the back wall: rose for the spinward throw, blue for the anti one, and a line at the hand's height
  const paint = (p0, v, T, col) => { let a = null; for (let i = 0; i <= 30; i++) { const b = ballAt(p0, v, T * i / 30); if (a) { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * 0.07, ny = dx / l * 0.07; c.quad([a[0] - nx, a[1] - ny, z0 + 0.012], [b[0] - nx, b[1] - ny, z0 + 0.012], [b[0] + nx, b[1] + ny, z0 + 0.012], [a[0] + nx, a[1] + ny, z0 + 0.012], col, 1.3); } a = b; } };
  paint([xs, hy, 0], vS, tS, '#ff9cc6'); paint([xa, hy, 0], vA, tA, '#aab8ff');
  for (let x = X0 + 0.6; x < X1 - 0.6; x += 0.5) if (Math.abs(x - xm) > 0.4) c.quad([x, hy - 0.015, z0 + 0.008], [x + 0.26, hy - 0.015, z0 + 0.008], [x + 0.26, hy + 0.015, z0 + 0.008], [x, hy + 0.015, z0 + 0.008], '#8a90b8', 0.5);
  for (let i = 0; i <= 12; i++) for (const sd of [-1, 1]) { const x = xm + sd * (0.45 + i); c.quad([x - 0.012, 0, z0 + 0.008], [x + 0.012, 0, z0 + 0.008], [x + 0.012, i % 6 ? 0.14 : 0.3, z0 + 0.008], [x - 0.012, i % 6 ? 0.14 : 0.3, z0 + 0.008], '#8a90b8', 0.5); }
  yield 'fair: the shies';
  // a cloth roof in stripes, a beam along the front with the two boards, posts, and a rail to lean on
  const fz = z1 + 0.92;
  for (let x = X0, i = 0; x < X1 - 0.01; x += 1.25, i++) c.quad([x, 3.72, z0 - 0.14], [Math.min(X1, x + 1.25), 3.72, z0 - 0.14], [Math.min(X1, x + 1.25), 3.42, fz + 0.2], [x, 3.42, fz + 0.2], i % 2 ? '#4f5f99' : '#b9b2c6', 0.08);
  g.box(X0, 3.3, fz - 0.07, X1, 3.44, fz + 0.07, '#55476a', { emit: 0.1 });
  for (const x of [X0, xs + 1.3, xm - 1.6, xm + 1.6, xa - 1.3, X1]) g.box(x - 0.07, 0, fz - 0.07, x + 0.07, 3.3, fz + 0.07, '#55476a', { skip: 'tb' });
  bulbBoard(deck, g, lamps, [xm - 0.45 - far / 2, 2.98, fz], [0, 1], 8.2, 0.7, ['Spin sinks'], { posts: false, ground: '#3a2a44', bulb: '#ff9cc6' });
  bulbBoard(deck, g, lamps, [xm + 0.45 + far / 2, 2.98, fz], [0, 1], 8.2, 0.7, ['Anti floats'], { posts: false, ground: '#2a2f52', bulb: '#aab8ff' });
  for (let x = X0 + 0.2, i = 0; x < X1; x += 0.36, i++) lamps.push({ p: [x, 3.5, fz + 0.1], kind: 0, power: 3, size: 0.14, chase: (i % 4) / 4 });
  g.box(X0, 0.96, z1 + 0.36, X1, 1.03, z1 + 0.44, gilt, { emit: 0.2 });
  for (let x = X0; x <= X1 + 0.01; x += (X1 - X0) / 14) g.box(x - 0.03, 0, z1 + 0.37, x + 0.03, 0.96, z1 + 0.43, iron, { skip: 'tb' });
  // where they throw from: a step at each end, a basket of lit balls, the price
  for (const [x, sd, col] of [[xs, -1, '#ff9cc6'], [xa, 1, '#aab8ff']]) {
    g.box(Math.min(x, x + sd * 1.5), 0, z0, Math.max(x, x + sd * 1.5), 0.12, z1, '#55476a', { skip: 'b' });
    g.box(x + sd * 0.2 - 0.3, 0.12, z1 - 0.75, x + sd * 0.2 + 0.3, 0.75, z1 - 0.2, '#6a5f58', { skip: 'b', top: '#2a2420' });
    for (let k = 0; k < 7; k++) { const q = [x + sd * 0.2 + rng.f(-0.2, 0.2), 0.78 + rng.f(0, 0.06), z1 - 0.47 + rng.f(-0.18, 0.18)]; g.blob(q[0], q[1], q[2], 0.05, 0, col, { emit: 3, shadeBottom: 1 }); }
    deck.glow([{ p: [x + sd * 0.2, 0.85, z1 - 0.47], color: col, power: 1.6, size: 0.8 }]);
    deck.sign(['Three balls', '0.05'], { at: [x + sd * 1.56, 1.5, (z0 + z1) / 2], n: [sd, 0], w: 1.0, h: 0.5, style: 'card', font: 'serif', ground: PAL.pale, ink: PAL.night, glow: 0.5 });
    g.box(x + sd * 1.52 - 0.02, 0, (z0 + z1) / 2 - 0.55, x + sd * 1.52 + 0.02, 1.8, (z0 + z1) / 2 + 0.55, '#55476a', { skip: 'b' });
  }
  // the throws: a pair from the two ends at once, in one lane and then the other
  const ball = (p0, vel, flies, from, color) => { for (let j = 0; j < 16; j++) lamps.push({ kind: 3, p: p0, vel, lag: j * 0.009, from, flies, every: 2.4, color, power: j ? 5.5 * Math.pow(1 - j / 16, 1.4) : 10, size: j ? 0.21 - j * 0.007 : 0.32 }); };
  lanes.forEach((zl, li) => { ball([xs, hy, zl], vS, tS, li * 1.2, '#ff9cc6'); ball([xa, hy, zl], vA, tA, li * 1.2, '#aab8ff'); });
  // the lane along the axis: a line on the floor, ropes with bulbs, a wall at the end with the tins in front of it
  const zt = axisZ - far;
  g.box(axisX - 2.7, 0, zt - 0.75, axisX + 2.7, 3.4, zt - 0.6, '#333a66', { skip: 'b', emit: 0.1 });
  g.box(axisX - 0.8, hX - 0.33, zt - 0.6, axisX + 0.8, hX - 0.255, zt + 0.05, '#55476a');
  stack(axisX, hX - 0.255, zt - 0.2, true, false);
  g.box(axisX - 0.035, 0, zt - 0.5, axisX + 0.035, 0.012, axisZ + 0.3, PAL.pale, { skip: 'b', emit: 0.6 });
  bulbBoard(deck, g, lamps, [axisX, 2.95, zt - 0.6], [0, 1], 5.0, 0.7, ['Axis flies true'], { posts: false, ground: '#2f3a3a', bulb: '#fff1f8' });
  for (const sx of [-1.15, 1.15]) {
    for (let z = axisZ + 0.6; z > zt - 0.5; z -= 2.6) g.box(axisX + sx - 0.03, 0, z - 0.03, axisX + sx + 0.03, 1.0, z + 0.03, iron, { skip: 'b' });
    g.tube([[axisX + sx, 0.98, axisZ + 0.6], [axisX + sx, 0.98, zt - 0.5]], 0.02, 3, gilt);
    for (let z = axisZ + 0.5; z > zt - 0.5; z -= 0.6) lamps.push({ p: [axisX + sx, 1.06, z], kind: 0, color: '#fff1f8', power: 2.4, size: 0.12, tw: 0.15 });
  }
  ball([axisX, hy, axisZ], vX, tX, 0.6, '#fff1f8');
  P.done();
  // who is there: someone throwing at each mark (the anti end's are children: small, and they throw anti), the keeper,
  // people along the rail, a line waiting at each end
  const folk = [];
  lanes.forEach((zl, li) => { folk.push({ p: [xs - 0.42, 0.12, zl], yaw: Math.PI / 2, child: li === 1 }, { p: [xa + 0.42, 0.12, zl], yaw: -Math.PI / 2, child: true }); });
  folk.push({ p: [xm, 0, z1 + 0.05], yaw: 0 }, { p: [axisX, 0, axisZ + 0.45], yaw: Math.PI }, { p: [axisX + 0.7, 0, axisZ + 1.3], yaw: Math.PI, child: true }, { p: [axisX - 0.5, 0, axisZ + 1.7], yaw: 2.9 });
  for (let x = X0 + 0.5; x < X1 - 0.5; x += rng.f(0.55, 1.5)) if (Math.abs(x - xm) > 0.7) folk.push({ p: [x, 0, z1 + rng.f(0.85, 1.9)], yaw: Math.PI + rng.f(-0.4, 0.4), child: rng() < 0.35 });
  for (const [x, sd] of [[xs, -1], [xa, 1]]) for (let k = 0; k < 6; k++) folk.push({ p: [x + sd * (2.3 + k * 0.62 + rng.f(-0.1, 0.1)), 0, z1 - 1.2 + rng.f(-0.5, 0.5) + k * 0.25], yaw: -sd * Math.PI / 2 + rng.f(-0.3, 0.3), child: rng() < 0.5 });
  deck.people(folk.filter((s) => deck.clear(s.p[0], s.p[1] + 1.3, s.p[2], 1.6)));
  deck.lattice({ origin: [X0 + 2.4, 2.7, (z0 + z1) / 2 + 0.3], spacing: [(X1 - X0 - 4.8) / 4, 1], count: [5, 1], color: '#ffcf8a', power: 0.9, reach: 4.4 });
  yield 'fair: the shies';
}

// ---------------------------------------------------------------- lanterns
// a paper lantern hung from the origin (the deck draws every copy in one call, each lit in its own colour); and a
// string of them from a to b, sagging, with one every `gap` metres. Returns false if any of it would hang in the
// flight's way or in the ride's.
function lanternProto(deck) {
  deck.proto('lantern', (g) => {
    g.cyl(0, -0.12, 0, 0.01, 0.01, 0.12, 3, '#2a2d3a', { cap: false });
    g.tint(1).cyl(0, -0.3, 0, 0.17, 0.08, 0.18, 5, '#d0d0d0', { emit: 0.85, smooth: false, top: '#3a3040' }).cyl(0, -0.48, 0, 0.08, 0.17, 0.18, 5, '#ffffff', { emit: 1.5, smooth: false, cap: false }).tint(0);
    g.cyl(0, -0.56, 0, 0.02, 0.0, 0.1, 3, '#c9a85a', { smooth: false, cap: false });
  });
}
const inRide = (x, y, z) => (Math.hypot(x, z) < 15.4 && y < 14.9) || (Math.abs(x - WHEEL.x) < 2.2 && Math.hypot(y - WHEEL.y, z) < 8.6);
function lanternString(deck, g, rng, a, b, o = {}) {
  const span = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), sag = o.sag === undefined ? span * rng.f(0.045, 0.075) : o.sag < 1 ? span * o.sag : o.sag;
  const n = Math.max(3, Math.round(span / (o.gap || 2.5))), pts = [], k0 = Math.floor(rng() * 6), size = o.size || 1.25;
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]); }
  for (const p of pts) if ((!o.any && inRide(p[0], p[1] - 0.6, p[2])) || !deck.clear(p[0], p[1] - 0.5, p[2], o.clear || 2.4)) return false;
  g.tube(pts, 0.018, 3, '#2a2d3a');
  for (let i = 1; i < n; i++) {
    const p = pts[i], col = LANTERNS[(k0 + i) % LANTERNS.length], s = size * rng.f(0.85, 1.2);
    deck.put('lantern', { p, yaw: rng() * TAU, scale: s, color: col });
    deck.glow([{ p: [p[0], p[1] - 0.39 * s, p[2]], color: col, power: 1.7, size: 0.4 * s, twinkle: 0.12 }]);
  }
  return true;
}

// The court's lanterns: some eighty strings from terrace to terrace across it, a fan of them from the top of the
// wheel, and one on a bracket every few metres along every terrace's rail.
function* hangLanterns(deck, court, rng, density) {
  const P = deck.pen(new Run(0, 0, 0, 0), 0, 'strings'), g = P.g;
  let t0 = performance.now();
  const post = (side, k, x) => [x, k * 4 + 1.25, court.rail(side, k) + (side === 'front' ? 0.2 : -0.2)];
  const across = (x, k, o) => lanternString(deck, g, rng, post('front', k, x + rng.f(-0.5, 0.5)), post('back', k, x + rng.f(-0.5, 0.5)), o);
  // three tiers, each a row of swags across the court: the top one over everything, the middle one clear of the swing
  // ride, the low one over the spinward half, where the flight climbs through it
  const step = 2.8 / Math.min(1.2, Math.max(0.5, density));
  for (let x = CX0 + 2, i = 0; x < CX1 - 1; x += step, i++) {
    across(x, 5, { sag: rng.f(0.03, 0.042) });
    if (Math.abs(x + step / 2) > 17.5) across(x + step / 2, i % 2 ? 3 : 4, { sag: rng.f(0.04, 0.06) });
    if (x > 19) across(x + step / 4, i % 2 ? 1 : 2, { sag: rng.f(0.03, 0.05), clear: 2.0 });
    if (performance.now() - t0 > 4) { yield 'fair: lantern strings'; t0 = performance.now(); }
  }
  // along the two ends, from one corner of a terrace to the other
  for (const [side, k] of [['spin', 1], ['anti', 3], ['spin', 2], ['spin', 4], ['anti', 5]]) { const x = court.rail(side, k) + (side === 'anti' ? 0.2 : -0.2); lanternString(deck, g, rng, [x, k * 4 + 1.25, court.rail('front', k) + 0.5], [x, k * 4 + 1.25, court.rail('back', k) - 0.5], { sag: 0.7, gap: 1.9, clear: 1.6 }); }
  // from the top of the wheel out to the terraces
  for (const [k, sd, dx] of [[3, -1, -9], [4, -1, -2], [5, -1, 5], [3, 1, -9], [4, 1, -2], [5, 1, 5], [2, -1, -15], [2, 1, -15]]) lanternString(deck, g, rng, [WHEEL.x, WHEEL.y + WHEEL.r1 + 0.9, sd * 0.4], post(sd < 0 ? 'front' : 'back', k, WHEEL.x + dx), { sag: 1.2, gap: 2.0, clear: 1.4, size: 1.5, any: true });
  g.box(WHEEL.x - 0.06, WHEEL.y + WHEEL.r1, -0.06, WHEEL.x + 0.06, WHEEL.y + WHEEL.r1 + 0.95, 0.06, '#4a4e66', { skip: 'b' });
  // and a lantern on a bracket every few metres along every terrace's rail
  for (let k = 1; k < STOREYS; k++) {
    const y = k * 4, xa = court.rail('anti', k), xb = court.rail('spin', k), za = court.rail('front', k), zb = court.rail('back', k);
    const hang = (x, z) => {
      const col = LANTERNS[Math.floor(rng() * LANTERNS.length)];
      g.box(x - 0.025, y + 0.78, z - 0.025, x + 0.025, y + 2.2, z + 0.025, '#2a2d3a', { skip: 'tb' });
      deck.put('lantern', { p: [x, y + 2.2, z], yaw: rng() * TAU, scale: 0.95, color: col });
      deck.glow([{ p: [x, y + 1.85, z], color: col, power: 1.5, size: 0.42, twinkle: 0.12 }]);
    };
    for (let x = xa + 3.2; x < xb - 2; x += 6.5) { hang(x, za - 0.25); hang(x + 3.25, zb + 0.25); }
    for (let z = za + 3.2; z < zb - 2; z += 6.5) { if (Math.abs(z) > 5 || k > 1) hang(xa - 0.25, z); hang(xb + 0.25, z + 3.25 > zb - 1 ? z : z + 3.25); }
    if (performance.now() - t0 > 4) { yield 'fair: lantern strings'; t0 = performance.now(); }
  }
  g.box(CX0 - 4.9, 2.9, -0.65, CX0 - 4.3, 2.975, 0.65, '#262a42');      // a plate under the court's own lamp at the arcade's mouth: it is off tonight
  P.done();
  yield 'fair: lantern strings';
}

// ---------------------------------------------------------------- the Lightfall Arcade
// Its stalls from the court's end going anti, the back side's and then the front side's: [the word on the board, what
// is set out on the counter, the card]. Lightfall dates each dish by its light: how long ago it left its raft
// (eating-out.md). The soup and the cheese are the docs' own, with their prices; the rest are cooked this week from the
// raft that is going by, or are old arrivals.
const AX0 = -112, AX1 = CX0 - 6, BAY = 4;
const DISHES = {
  back: [
    ['Buns', 'bread', ['Steamed buns', 'Light left 3 days ago', '0.25']],
    ['Dumplings', 'pots', ['Sour dumplings', 'from the raft going by', 'Light left 3 days ago', '0.30']],
    ['Tea', 'tea', ['Salt tea', 'Light left 5 days ago', '0.10']],
    ['Bread', 'bread', ['Seed flatbread', 'Light left 2 days ago', '0.20']],
    ['Soup', 'pots', ['Seven-year soup', 'Light left 7 years ago', '0.90']],
    null,
    ['Pickles', 'jars', ['Pickled stems', 'Light left 31 years ago', '0.15']],
    ['Noodles', 'noodles', ['Cold noodles', 'Light left 4 days ago', '0.35']],
    ['Brittle', 'jars', ['Sesame brittle', 'Light left 6 days ago', '0.12']],
  ],
  front: [
    ['Fry', 'bread', ['Fried dough, salted', 'Light left 5 days ago', '0.18']],
    ['Gin', 'bottles', ['A spirit from a file', 'Small batch', 'Light left 12 years ago', '0.60']],
    ['Cheese', 'jars', ['A cheese nobody', 'on Merrow has tasted', 'Regrown from a file', 'Light left 9 years ago', '0.40']],
    ['Broth', 'pots', ['Green broth', 'Light left 6 days ago', '0.28']],
    ['Noodles', 'noodles', ['Hand-cut noodles', 'Light left 4 days ago', '0.32']],
    ['Custard', 'jars', ['Cold custard', 'Light left 40 years ago', '0.22']],
    ['Tea', 'tea', ['Leaf tea, twice poured', 'Light left 5 days ago', '0.10']],
    ['Buns', 'bread', ['Fried buns', 'Light left 3 days ago', '0.25']],
    ['Soup', 'pots', ['Sour soup', 'Light left 2 days ago', '0.30']],
  ],
};
const NOTICE = ['Leave a recipe', 'on the card.', 'We send one back', 'for every one we cook.'];
function arcadeFronts(side) {
  return DISHES[side].map((d, i) => {
    const to = AX1 - i * BAY, from = to - BAY;
    if (!d) return { from, to, kind: 'wall', bench: false, notice: NOTICE, wall: '#474c70' };
    return { from, to, kind: 'stall', id: side + i, name: d[0], goods: d[1], lit: 1, awning: true, font: i % 3 === 1 ? 'italic' : 'serif', props: !/Seven-year|nobody/.test(d[2][0]) };
  });
}
// a card on each named stall's counter, and the arcade's lanterns: three rows under the ceiling, clear of the ribs
function dressArcade(deck, st, rng) {
  for (const side of ['back', 'front']) DISHES[side].forEach((d, i) => {
    const bay = d && st.sides[side].find(side + i);
    if (!bay) return;
    const lines = d[2], big = lines.length > 4, read = /Seven-year|nobody/.test(lines[0]), h = big ? 0.9 : lines.length > 3 ? 0.7 : 0.56, w = big ? 1.3 : 1.0;
    const t = read ? (side === 'back' ? 0.7 : 0.3) : bay.rnd[0] < 0.5 ? 0.3 : 0.7;
    deck.sign(lines, { run: st.sides[side].run, at: bay.at(t, 0.97 + h / 2, -0.39), w, h, style: 'card', font: big ? 'sans' : 'italic', font2: big ? 'sans' : 'cond', head: !big, upper: false, ground: PAL.pale, ink: PAL.night, glow: 0.62 });
    const P = deck.pen(st.sides[side].run, (bay.u0 + bay.u1) / 2, 'av'), u = bay.u0 + (bay.u1 - bay.u0) * t;
    P.g.box(u - w / 2 - 0.03, 0.95, -0.385, u + w / 2 + 0.03, 0.99 + h, -0.36, '#55476a', { skip: 'b' });
    P.done();
  });
  for (let x = AX0 + 1; x < AX1 - 0.4; x += 1.5) for (const z of [-2.55, 0, 2.55]) {
    const xx = x + (z ? 0.75 : 0) + rng.f(-0.2, 0.2), rib = Math.abs(((xx - AX0) % 6 + 6) % 6 - 3);
    if (rib > 2.62 || Math.abs(xx + 60) < 0.8 || Math.abs(xx + 43) < 0.8 || (!z && xx > -67.5 && xx < -60)) continue;
    const drop = z ? rng.f(0.0, 0.22) : rng.f(0.0, 0.1), s = rng.f(0.85, 1.1), y = (z ? 2.86 : 2.97) - drop, col = LANTERNS[Math.floor(rng() * LANTERNS.length)];
    if (!deck.clear(xx, y - 0.45, z, 0.62)) continue;
    deck.put('lantern', { p: [xx, y, z], yaw: rng() * TAU, scale: s, color: col });
    deck.glow([{ p: [xx, y - 0.39 * s, z], color: col, power: 1.7, size: 0.42, twinkle: 0.1 }]);
  }
  // people at the stalls, never within arm's reach of the flight, and none in front of the two cards it reads
  const folk = [];
  for (let x = AX0 + 2; x < AX1 - 1; x += rng.f(1.1, 3.2)) {
    const sd = rng.sign(), z = sd * rng.f(2.35, 3.0), x2 = x + rng.f(0.5, 0.8), z2 = z - sd * rng.f(0, 0.3);
    const free = (px, pz) => !(sd > 0 && px > -61 && px < -55.2) && !(sd < 0 && px > -53 && px < -47.2) && deck.clear(px, 1.3, pz, 2.3);
    if (!free(x, z)) continue;
    folk.push({ p: [x, 0, z], yaw: (sd > 0 ? 0 : Math.PI) + rng.f(-0.5, 0.5), child: rng() < 0.25 });
    if (rng() < 0.5 && free(x2, z2)) folk.push({ p: [x2, 0, z2], yaw: (sd > 0 ? 0 : Math.PI) + rng.f(-0.9, 0.9), child: rng() < 0.4 });
  }
  deck.people(folk);
}

// ---------------------------------------------------------------- the court's people
// Watching at the fence, waiting at the gate, standing about and strolling everywhere else, a few stalls with their
// keepers; and children running the length of the court.
const FAIR_TRADES = [['Lanterns', 'lamps'], ['Toys', 'toys'], ['Tea', 'tea'], ['Noodles', 'noodles'], ['Brittle', 'jars'], ['Lamps', 'lamps'], ['Buns', 'bread'], ['Dumplings', 'pots'], ['Paper', 'paper'], ['Sleeves', 'cloth'], ['Gin', 'bottles'], ['Flutes', 'flutes']];
function fairFolk(deck, rng, density) {
  const out = [], F = RIDE.fence;
  const free = (x, z) => Math.hypot(x, z) > F + 0.5 && !(x > 13.6 && x < 49.4 && z < SHY.z1 + 2.3) && !(Math.abs(x - WHEEL.x) < 3.2 && Math.abs(z) < 9.6)
    && !(Math.abs(x - SHY.axisX) < 1.7 && z < SHY.axisZ + 2.6) && !(x > -20 && x < -16.4 && z > 2.8 && z < 6);
  const ok = (x, z, r = 1.5) => free(x, z) && deck.clear(x, 1.3, z, Math.max(r, x < -20 ? 3.0 : 2.2));
  for (let i = 0, n = Math.round(170 * density); i < n; i++) {
    const a = rng.f(0, TAU), r = F + 0.45 + rng() * rng() * 3.6, x = r * Math.cos(a), z = r * Math.sin(a);
    if (Math.abs(a - Math.PI) < 0.2 || Math.abs(a - 205 * DEG) < 0.22 || !ok(x, z, 1.7)) continue;
    out.push({ p: [x, 0, z], yaw: Math.atan2(-x, -z) + rng.f(-0.3, 0.3), child: rng() < 0.3 });
  }
  // the line at the gate, out past the booth
  for (let k = 0; k < 18; k++) { const x = -F - 1.0 - k * 0.6, z = 1.3 + 0.9 * Math.sin(k * 0.45); if (ok(x, z, 1.2)) out.push({ p: [x + rng.f(-0.1, 0.1), 0, z + rng.f(-0.15, 0.15)], yaw: Math.PI / 2 + rng.f(-0.3, 0.3), child: rng() < 0.45 }); }
  out.push({ p: [-18.1, 0, 4.3], yaw: -Math.PI / 2 });
  for (let i = 0, n = Math.round(80 * density); i < n; i++) { const x = rng.f(CX0 + 1.5, CX1 - 1.5), z = rng.f(CZ0 + 1.2, CZ1 - 1.2); if (ok(x, z, 2.0)) deck.knot(x, 0, z, 2 + Math.floor(rng() * 3), rng); }
  for (let i = 0, n = Math.round(110 * density); i < n; i++) { const rad = rng.f(0.7, 2.4), x = rng.f(CX0 + 3, CX1 - 3), z = rng.f(CZ0 + 3, CZ1 - 3); if (ok(x, z, rad + 1.5) && free(x + rad, z) && free(x - rad, z) && free(x, z + rad) && free(x, z - rad)) out.push({ p: [x, 0, z], walk: rad, child: rng() < 0.35 }); }
  // stalls on the court's floor, along its back side and by the wheel
  for (const [x, z, yaw] of [[22, 21.2, 0], [29, 21.6, 0], [36, 21.2, 0], [43.5, 21.6, 0], [51, 21.2, 0], [-27, 19.5, 0.5], [-28, -19.5, 2.6], [52, -19, Math.PI], [66.2, -13, -Math.PI / 2], [66.2, 13, -Math.PI / 2], [-9, -22.3, Math.PI], [-3, -22.6, Math.PI], [3, -22.3, Math.PI], [9, -22.6, Math.PI]]) {
    if (!ok(x, z, 2.6)) continue;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), at = (u, v) => [x + u * cy + v * sy, z - u * sy + v * cy];
    deck.put('stall', { p: [x, 0, z], yaw, color: deck.pal.awnings[Math.floor(rng() * 5)][0] });
    for (let k = 0; k < 3; k++) { const q = at(-0.7 + k * 0.7, 0); deck.put('crate', { p: [q[0], 0.83, q[1]], yaw, color: ['#c9914e', '#d9c48a', '#b98a9a', '#8f9bd0', '#e6dfe6'][Math.floor(rng() * 5)] }); }
    const k = at(0.2, 1.05), c1 = at(-0.4, -1.15), c2 = at(0.5, -1.4), lamp = at(0, -0.6);
    out.push({ p: [k[0], 0, k[1]], yaw: yaw + Math.PI }, { p: [c1[0], 0, c1[1]], yaw, child: rng() < 0.4 });
    if (rng() < 0.7) out.push({ p: [c2[0], 0, c2[1]], yaw: yaw + rng.f(-0.4, 0.4), child: rng() < 0.4 });
    deck.put('lantern', { p: [lamp[0], 2.0, lamp[1]], yaw: 0, scale: 1.2, color: LANTERNS[Math.floor(rng() * 6)] });
    deck.glow([{ p: [lamp[0], 1.55, lamp[1]], color: '#ffd9a8', power: 2.4, size: 0.9 }]);
  }
  deck.people(out);
  // children run the length of the court along its back side, anti: that way they weigh less (ashgrove.md, Weight is a map)
  const L0 = [CX1 + 4, 0, 22.9], L1 = [CX0 - 5, 0, 22.9], len = L0[0] - L1[0];
  for (const [z, start] of [[22.9, 70], [21.7, 105], [22.3, 25]]) deck.walkersAlong({ from: [L0[0], 0, z], to: [L1[0], 0, z], n: 4, spread: 0.4, speed: 3.6, child: 1, start: start % len, rng });
  // people walking under the first terrace, both ways, and in and out of the arcade
  for (const z of [CZ1 + 3.4, CZ0 - 3.4]) { deck.walkersAlong({ from: [CX0 - 4.5, 0, z], to: [CX1 + 4.5, 0, z], n: Math.round(12 * density), spread: 0.5, speed: 1.15, rng }); deck.walkersAlong({ from: [CX1 + 4.5, 0, z + 1.2], to: [CX0 - 4.5, 0, z + 1.2], n: Math.round(10 * density), spread: 0.4, speed: 1.2, rng }); }
  // (they keep the flight's clock, and are set off so that nobody is passing the soup's card or the cheese's while it is
  // read, or is under the flight as it comes out of the arcade's mouth)
  for (const x of [-100, -88, -76, -66, -41, -36, -30]) deck.walkersAlong({ from: [AX0, 0, -2.35], to: [-15.4, 0, -2.35], n: 1, spread: 0.2, speed: 1.2, start: x - AX0, rng });
  for (const x of [-40, -34, -28, -70, -82, -96]) deck.walkersAlong({ from: [-16.5, 0, 2.9], to: [AX0, 0, 2.9], n: 1, spread: 0.12, speed: 1.2, start: -16.5 - x, rng });
}

export const borageFair = {
  id: 'borage-fair',
  title: 'The swing ride leans', drum: 'Borage', row: 'Herb Row', kind: 'a fair drum', light: 0.0,
  line: 'The swing ride at Lanternfold leans. Flying spinward you are an eighth heavier and sink, flying anti you are a sixth lighter and float out, so the whole ring of chairs goes round tilted. I went on four times.',
  tone: '#e9a6c2', source: '15-canon.js (Borage); eating-out.md (Lightfall); ashgrove.md (Weight is a map; Day one); sorrel.md (the Half-g Track)',
  sound: { root: 50, scale: 'lydian', pad: 0.4, air: 0.1, hum: 0.2, crowd: 0.85, bells: 0.5, bright: 0.7 },
  *build(ctx) {
    const frame = makeFrame(152 * DEG, 1310, R16);
    const rng = makeRng('lanternfold'), dens = ctx.density || 1;
    // along the arcade at head height, past the soup's card and the cheese's; out of its mouth; up to the chairs and
    // once round with them, the heavy side and then the light; round again low, along the shies and then out from
    // them to see both lanes at once; and up the court to the wheel, through its middle
    const path = makePath([
      { t: 0, p: [-66.5, 1.6, 0.9], look: [-61, 1.55, 1.6] },
      { t: 3.6, p: [-59.5, 1.6, 1.5], look: [-57.0, 1.35, 3.6] },
      { t: 5.2, p: [-56.6, 1.6, 1.1], look: [-48, 1.7, 0] },
      { t: 7, p: [-52.6, 1.6, -0.5], look: [-49.4, 1.35, -3.6] },
      { t: 9.6, p: [-46, 1.65, -0.3], look: [-20, 5.5, -2] },
      { t: 12.4, p: [-35.5, 2.0, -0.6], look: [0, 7.6, 0] },
      { t: 15.8, p: [-24.5, 4.4, -7.0], look: [0, 7.0, -1] },
      { t: 19.6, p: [-8.0, 5.0, -15.0], look: [5, 5.2, -8.5] },
      { t: 23.4, p: [9.0, 5.5, -14.4], look: [8, 6.6, -2] },
      { t: 26.8, p: [17.8, 6.6, -2.2], look: [0, 7.0, 0.5] },
      { t: 30.2, p: [10.6, 7.9, 11.6], look: [-6, 7.9, 9.5] },
      { t: 33.6, p: [-5.2, 8.0, 16.6], look: [-5, 5.6, 0] },
      { t: 37, p: [-18.8, 6.6, 7.2], look: [-4, 6.2, -3] },
      { t: 40.4, p: [-15.5, 3.8, -11.5], look: [-2, 6.4, -8] },
      { t: 43.8, p: [4.5, 2.6, -16.6], look: [22, 1.9, -22] },
      { t: 46.8, p: [19.5, 3.0, -12.6], look: [25.5, 1.8, -22.6] },
      { t: 48.8, p: [30, 4.0, -9.4], look: [29, 1.9, -22.8] },
      { t: 52.4, p: [40.5, 6.6, -2.4], look: [WHEEL.x, WHEEL.y, 0] },
      { t: 55.8, p: [WHEEL.x - 8.05, WHEEL.y, 0], look: [WHEEL.x + 10, WHEEL.y, 0] },
      { t: 56.9, p: [WHEEL.x - 1.725, WHEEL.y, 0], look: [WHEEL.x + 16, WHEEL.y, 0] },
      { t: 58, p: [WHEEL.x + 4.6, WHEEL.y, 0], look: [WHEEL.x + 22, WHEEL.y, 0] },
    ], { frame, entryRadius: 1.2, exitRadius: 5 });
    const deck = makeDeck(ctx, {
      frame, near: path.points(0.5), seed: 'lanternfold', palette: NIGHT, detail: 38, clock: 'flight',
      light: { level: 0.55, ambUp: '#39416c', ambDown: '#232848', ambPower: 0.8, haze: '#151a2c', hazeDensity: 0.004 },
      floor: { shine: 1, wear: 0.7 },
    });
    yield 'fair: path';
    const round = yield* swingRound();
    yield 'fair: the round';

    // ---- the Lightfall Arcade: dark, hung with lanterns, a stall on both sides every four metres
    const st = yield* street(deck, {
      axis: 'x', from: AX0, to: AX1, at: 0, y: 0, width: 8, lamps: false, cloth: 0.75,
      plates: [{ at: -60.2, lines: ['The Lightfall Arcade', 'What arrives, we cook.'], w: 3.0 }, { at: -43.4, lines: ['Lanternfold', 'A fair held in light'], w: 2.6 }],
      folk: { stand: 0, stroll: 0, walk: 0, kids: 0 },
      fronts: { back: arcadeFronts('back'), front: arcadeFronts('front') },
      fill: { mix: { stall: 3, shop: 1, wall: 0.3 }, bay: [3.6, 4.4], lit: 0.9, awnings: 0.8, blades: 0.3, trades: FAIR_TRADES },
      floor: { color: '#3f4460', strip: '#2e3249', shine: 0.95 },
    });
    lanternProto(deck);
    dressArcade(deck, st, rng);
    deck.lattice({ origin: [AX0 + 3, 2.7, -2.55], spacing: [12, 5.1], count: [7, 2], color: '#ff9cc6', power: 0.85, reach: 4.0, drop: 3.7 });
    deck.lattice({ origin: [AX0 + 9, 2.7, -2.55], spacing: [12, 5.1], count: [6, 2], color: '#8fa2ff', power: 0.85, reach: 4.0, drop: 3.7 });
    yield 'fair: the arcade';

    // ---- the fair court: six decks high, its own lamps off
    const g0 = deck.glows.length;
    const court = yield* atrium(deck, {
      x0: CX0, x1: CX1, z0: CZ0, z1: CZ1, y: 0, storeys: STOREYS, step: 2, depth: 6,
      mouths: [{ side: 'anti', storey: 0, at: 0, width: 8 }],
      light: { power: 0.3, terraces: 0.7, walks: 0.07, gloss: 0, color: '#aab4e6', terraceColor: '#a59ad6' },
      ceiling: { emit: 0.03, color: '#3a4266' },
      floor: { color: '#4a4f6a', shine: 0.9, bands: 13 },
      folk: { rail: 14, stroll: 2, floor: 0 },
      planting: 0.35,
      fill: { mix: { flat: 1 }, bay: [5.2, 6.6], lit: 0.2, numbers: 101 },
      ground: { mix: { stall: 2, shop: 1.2, wall: 0.3 }, lit: 0.9, awnings: 0.8, blades: 0, trades: FAIR_TRADES },
    });
    for (let i = g0; i < deck.glows.length; i++) { const q = deck.glows[i]; q.power *= Math.hypot(q.p[0] - CX0 + 4.6, q.p[2]) < 1 && q.p[1] < 3.2 ? 0 : 0.45; }      // the terraces' own lamps are turned down too
    yield 'fair: the court';

    // ---- the fair
    const lamps = [];
    yield* rideStands(deck, lamps);
    yield* wheelStands(deck, lamps);
    yield* shies(deck, lamps, rng);
    yield* hangLanterns(deck, court, rng, dens);
    fairFolk(deck, rng, dens);
    // what the rides throw: gold from under the crown, pale rose from the wheel
    deck.lattice({ origin: [0, RIDE.H - 0.3, 0], spacing: [1, 1], count: [1, 1], color: '#ffcf8a', power: 2.4, reach: 11, drop: 12.5, above: 1.6 });
    deck.zone({ min: [-15, -0.5, -15], max: [15, RIDE.H + 1, 15], soft: 5, color: '#ffc98a', power: 0.5, side: 0.9, under: 0.8 });
    deck.lattice({ origin: [WHEEL.x - 1.5, WHEEL.y, 0], spacing: [1, 1], count: [1, 1], color: '#ffd9ec', power: 1.8, reach: 10, drop: 12, above: 8 });
    {
      // a short avenue of lantern posts from the arcade's mouth toward the gate
      const P = deck.pen(new Run(0, 0, 0, 0), CX0, 'ride');
      for (let i = 0; i < 3; i++) for (const z of [-5.2, 5.2]) {
        const x = CX0 + 2.5 + i * 5.2, col = LANTERNS[(i + (z > 0 ? 1 : 0)) % 2];
        if (!deck.clear(x, 3.0, z, 2.6) || (i === 2 && z < 0)) continue;      // (one would stand between the flight and the board that says why)
        P.g.cyl(x, 0, z, 0.07, 0.05, 3.3, 5, '#3d4052', { smooth: false });
        P.g.box(x - 0.02, 3.26, Math.min(z, z * 0.9), x + 0.02, 3.3, Math.max(z, z * 0.9), '#3d4052');
        deck.put('lantern', { p: [x, 3.27, z * 0.9], yaw: 0, scale: 1.5, color: col });
        deck.glow([{ p: [x, 2.72, z * 0.9], color: col, power: 2.2, size: 0.7, twinkle: 0.1 }]);
      }
      P.done();
      deck.lattice({ origin: [CX0 + 2.5, 2.9, -4.7], spacing: [5.2, 9.4], count: [3, 2], color: '#e9b0d8', power: 1.1, reach: 3.6, drop: 3.9 });
    }
    deck.lattice({ origin: [-9, 2.6, -21.4], spacing: [6, 1], count: [4, 1], color: '#ffcf9a', power: 0.9, reach: 3.4, drop: 3.6 });      // over the stalls along the front side
    deck.sky({ x0: CX0 - 4, z0: CZ0 - 4, x1: CX1 + 4, z1: CZ1 + 4, y: 20, floor: -0.5, color: '#a894d8', power: 0.3 });
    yield 'fair: light';

    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);
    const U = rideUniforms(frame, round);
    const crown = crownGeo(lamps).mesh(deck.litDouble, frame);
    crown.matrixAutoUpdate = false;
    scene.add(crown);
    yield 'fair: the crown';
    scene.add(chairMesh(deck, U, rng, lamps));
    scene.add(lampMesh(lamps, U));
    yield 'fair: the chairs';

    // the crown turns about the mast; the chairs and the lamps follow the same clock. It is the flight's own, but it
    // goes on running when the flight is held at the opening and while this world is only seen through the last one's
    // (the people walking keep the flight's seconds and nothing else, so that they are where the flight wants them)
    const B = frame.stand(0, 0), Binv = B.clone().invert(), Rm = new Matrix4();
    let extra = 0, last = G.uTime.value;
    const look = { exposure: 2.0, bloom: 0.3, threshold: 0.9, saturation: 1.08, vignette: 0.55, contrast: 1.05, lift: [0.004, 0.006, 0.02] };
    function update(t, dt, camera, engine) {
      const now = G.uTime.value, real = Math.max(0, Math.min(0.1, now - last));
      last = now;
      if (t === 0) extra += dt; else if (engine && !engine.freeze) extra += Math.max(0, real * (engine.pace || 1) - dt);
      const clock = t + extra, phi = (clock * OM) % TAU;
      U.uPhi.value = phi; U.uT.value = clock;
      crown.matrix.copy(B).multiply(Rm.makeRotationY(-phi)).multiply(Binv);
      crown.matrixWorldNeedsUpdate = true;
      deck.tick(t);
    }
    update(0, 0, null, null);
    return { scene, path, deck, round, near: 0.12, far: 800, look, portal: { rim: false, mist: PAL.night }, update };
  },
};
