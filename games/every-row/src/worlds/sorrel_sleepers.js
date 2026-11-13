// Sorrel, Herb Row: the Sleepers, on line deck 138 in Ring Nine, Otter. "A depot two decks tall where ten thousand cabs
// sleep in racks, and wake from the far end at half past four" (docs/sorrel.md, Line decks). A cab is about 3.5 m long,
// 2 m wide and 2.1 m tall, streamlined at both ends; on the trunks cabs close up nose to tail about a metre apart and
// run as platoons that never stop (docs/drum-transport.md, Cabs). Deck 138 lies at a radius of 2,452 m and 0.82 g; its
// spinward loops are posted at 29.5 m/s and its antispinward ones at 30 (drum-transport.md, Speed limits).
//
// How ten thousand fit. The hall is 470 m spinward, 313 m along the axis and 8 m high (two decks). Across the axis it
// is cut into 23 aisles, each 13.6 m wide: a rack, a lane, a walk, a lane, a rack. A rack holds two tiers of berths, 110
// berths a tier at 4 m (a cab and half a metre), so 220 cabs; 46 racks make 10,120 berths, and 120 stand empty. Every
// lane carries a guideway on each tier, and every guideway runs spinward to a tube mouth in the far wall.
//
// The flight: at head height on the walk of Aisle 12 in the dark, a keeper ahead with a hand lamp; up between the racks
// until the field of standby lights runs away up the curve to where the ceiling meets the floor; the waking comes down
// the hall from the far end, rack after rack, at about 18 m a second, and passes under; the cabs lift a hand's breadth,
// slide out onto the guideways a platoon at a time and run spinward; down beside one, at its speed, along the lane to the
// far wall, and in behind it through the mouth of its tube.
//
// Not canon (the docs give the depot's deck, Ring, Hour, its height, its ten thousand cabs and the hour it wakes):
//   - the layout: aisles of racks, two tiers of berths, a guideway on each tier of each lane, the walks between, the
//     tube mouths in the far wall (lower than a loop tube's ~3 m, one for each guideway), and which end is the far one
//   - that cabs have a window down each side and a standby light on the roof, and their paint: cream with one stripe
//   - the order of waking: rack by rack from the far end, then each rack's tier leaving a platoon at a time, the head
//     first, after a lift of a few centimetres; the depot speed of 10 m/s
//   - the night keepers who walk the aisles with hand lamps, masked as the docs' tube crews are (whether the depot
//     holds the tubes' helium is not said), and how they are dressed
//   - the lamps over the walks, low at night; the painted edges of the walks
//   - the wording of the signs: "Aisle 12", the notice by the walk, the plate over the tube mouths
import {
  Scene, Mesh, InstancedMesh, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, ShaderMaterial,
  Matrix4, Quaternion, Vector2, Vector3, AdditiveBlending, FrontSide,
} from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, PALETTES } from '../kit/deck.js';
import { Geo, rgb } from '../kit/geo.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, litMaterial, glowPoints, vec3col } from '../kit/mats.js';
import { makeRng, smoothstep } from '../core/rng.js';

// ---------------------------------------------------------------- the plan, in the frame of deck 138 (y = 0 is its floor)
const H = 8;                               // floor to ceiling: two decks
const NA = 23, AW = 13.6;                  // aisles, and how wide each is along the axis
const MC = 11;                             // the flight's aisle (Aisle 12)
const Z0 = -(MC * AW + AW / 2);            // so that the middle of the flight's walk is z = 0
const RACK = [1.55, 12.05];                // middle of each rack, across its aisle (A, B)
const LANE = [4.3, 9.3];                   // middle of the lane that serves it
const WALK = 6.8;                          // middle of the walk
const SLIDE = 2.75;                        // from berth to guideway, sideways
const NB = 110, BX0 = 12, BP = 4;          // berths a tier, the first berth's middle, the pitch
const TIER = [0.35, 2.95];                 // the floor of a cab on each tier
const CAB = { L: 3.5, W: 2.0, H: 2.1 };
const XWALL = 462, XNEAR = 4;              // the far wall with the tube mouths, the near wall
const MOUTH = { w: 4.4, y: [[0.0, 2.65], [2.8, 5.3]] };
// the waking: a front that leaves the far end at T_W and runs toward the near end at V_W
const T_W = 10, V_W = 18.5, X_FAR = 456;
const wakeAt = (x) => T_W + (X_FAR - x) / V_W;
// a cab's run: slide for SLIDE_T, then speed up at ACC to VMAX
const SLIDE_T = 1.2, ACC = 2.5, VMAX = 10, TACC = VMAX / ACC, XGONE = 525;
const aisleZ = (m) => Z0 + m * AW;
const berthX = (i) => BX0 + i * BP;

// The flight's run beside a cab: from T_RUN it holds VMAX along the lane, X_RUN at T_RUN, and the cab it keeps pace
// with is FOLLOW metres ahead (the last of its platoon, on the upper tier of rack A, Aisle 12).
const T_RUN = 34, X_RUN = 295, FOLLOW = 3, FOLLOW_I = 60;

/**
 * Every berth: where it is, which way its lane lies, and when its cab wakes, slides out and runs. A rack's tier leaves
 * as platoons: from the head (the far end) back, each platoon sliding out together once its last cab is awake, and
 * each cab in it a moment after the one ahead, so that the platoon opens to a metre between cabs.
 */
function schedule(rng) {
  const cabs = [];
  for (let m = 0; m < NA; m++) for (let r = 0; r < 2; r++) {
    const z = aisleZ(m) + RACK[r], side = r === 0 ? 1 : -1, jr = rng.f(-0.45, 0.45);
    for (let k = 0; k < 2; k++) {
      const follow = m === MC && r === 0 && k === 1;
      const row = [];
      for (let i = 0; i < NB; i++) {
        const empty = !follow && rng() < 0.0119;
        row.push({ i, x: berthX(i), y: TIER[k], z, side, wake: wakeAt(berthX(i)) + jr + rng.f(0, 0.3) + k * 0.12, empty, m, r, k });
      }
      // platoons from the head back
      let i = NB - 1, lastG = -1e9;
      while (i >= 0) {
        let n = 5 + Math.floor(rng() * 12);
        if (follow && i >= FOLLOW_I && i - n + 1 < FOLLOW_I) n = i - FOLLOW_I + 1;        // a platoon whose last cab is the one the flight keeps pace with
        if (follow && i < FOLLOW_I) n = i + 1;                                              // and the rest of that tier waits for a gap
        const grp = row.slice(Math.max(0, i - n + 1), i + 1).reverse();
        let tg = Math.max(...grp.map((c) => c.wake)) + rng.f(1.0, 3.6);
        if (follow && grp[grp.length - 1].i === FOLLOW_I) {
          const d = 0.06 * (grp.length - 1);
          tg = (berthX(FOLLOW_I) + 0.5 * ACC * TACC * TACC - X_RUN - FOLLOW) / VMAX + T_RUN - SLIDE_T - TACC - d;
        }
        if (follow && i < FOLLOW_I) tg = 1e4;
        tg = Math.max(tg, lastG + 0.3);
        lastG = tg;
        grp.forEach((c, j) => { c.when = [c.wake, tg, 0.06 * j]; });
        i -= n;
      }
      for (const c of row) if (!c.empty) cabs.push(c);
    }
  }
  return cabs;
}

// ---------------------------------------------------------------- the cab
// Modelled at the origin on its floor, long way along x, the lane on the +z side; a cab in a rack whose lane lies to -z
// is turned half round in the shader. A face's glow says what it is: 0 paint, 1 window, 3 the standby light. Faces
// drawn with tint 1 take the cab's stripe.
const BODY = '#c9bfab', NOSE = '#bdb39f', DARK = '#34312d';
function cabGeo(near) {
  const g = new Geo();
  const L2 = CAB.L / 2, B0 = 0.12, B1 = 2.0, W2 = CAB.W / 2, M = 1.25;
  if (!near) {
    g.box(-L2, B0, -W2, L2, B1, W2, BODY, { skip: 'b', top: '#aaa18f' });
    for (const s of [-1, 1]) {
      const z = s * (W2 + 0.012);
      if (s > 0) g.quad([-1.05, 0.95, z], [1.05, 0.95, z], [1.05, 1.68, z], [-1.05, 1.68, z], '#202326', 1);
      else g.quad([1.05, 0.95, z], [-1.05, 0.95, z], [-1.05, 1.68, z], [1.05, 1.68, z], '#202326', 1);
    }
    return g.build();
  }
  // the middle: a plain box, faired top and bottom
  g.box(-M, B0, -W2, M, B1, W2, BODY, { skip: 'we', top: '#b3aa97', bottom: '#5a5650' });
  // the two noses, narrowing to a rounded end
  for (const s of [-1, 1]) {
    const a = s * M, b = s * L2, ny0 = 0.42, ny1 = 1.72, nz = 0.74;
    const A = (y, z) => [a, y, z], Bp = (y, z) => [b, y, z];
    const q = (p, r, u, v, c) => (s > 0 ? g.quad(p, r, u, v, c) : g.quad(v, u, r, p, c));
    q(A(B1, W2), Bp(ny1, nz), Bp(ny1, -nz), A(B1, -W2), NOSE);          // top
    q(A(B0, -W2), Bp(ny0, -nz), Bp(ny0, nz), A(B0, W2), '#5a5650');     // bottom
    q(A(B0, W2), Bp(ny0, nz), Bp(ny1, nz), A(B1, W2), NOSE);            // +z side
    q(A(B1, -W2), Bp(ny1, -nz), Bp(ny0, -nz), A(B0, -W2), NOSE);        // -z side
    q(Bp(ny0, nz), Bp(ny0, -nz), Bp(ny1, -nz), Bp(ny1, nz), '#d8cfbc'); // the end
    const e = b + s * 0.004;                                            // a dark lamp strip on the end
    q([e, 0.98, 0.32], [e, 0.98, -0.32], [e, 1.12, -0.32], [e, 1.12, 0.32], '#2a2826');
  }
  for (const s of [-1, 1]) {
    const z = s * (W2 + 0.012), z2 = s * (W2 + 0.02);
    const face = (x0, y0, x1, y1, zz, c, e) => (s > 0 ? g.quad([x0, y0, zz], [x1, y0, zz], [x1, y1, zz], [x0, y1, zz], c, e) : g.quad([x1, y0, zz], [x0, y0, zz], [x0, y1, zz], [x1, y1, zz], c, e));
    face(-1.05, 0.95, 1.05, 1.68, z, '#202326', 1);                       // the window
    for (const x of [-0.36, 0.36]) face(x - 0.035, 0.95, x + 0.035, 1.68, z2, BODY, 0);
    face(-1.05, 1.68, 1.05, 1.73, z2, '#8f877a', 0);
    g.tint(1); face(-M, 0.6, M, 0.78, z, '#ffffff', 0); g.tint(0);       // the stripe
    if (s > 0) for (const x of [-0.56, 0.56]) face(x - 0.015, 0.14, x + 0.015, 1.9, z2, DARK, 0);   // the door's edges
  }
  g.box(-1.4, 0, -0.34, 1.4, B0, 0.34, '#2c2b2a', { skip: 'tb' });       // the guide shoe
  g.box(-0.13, B1, 0.66, 0.13, B1 + 0.07, 0.86, '#9fe8da', { emit: 3 });  // the standby light
  return g.build();
}

// Where a cab is at the flight's second uT, and how lit: slide sideways for SLIDE_T, then speed up at ACC to VMAX.
// schedule() times the platoon the flight keeps pace with by the same sums.
const MOTION = /* glsl */`
uniform float uT;
vec3 kCabAt(vec4 berth, vec4 when, out float gone) {
  float lift = smoothstep(when.y - 0.8, when.y, uT) * 0.05;
  float sl = smoothstep(when.y, when.y + ${SLIDE_T.toFixed(2)}, uT);
  float tau = max(uT - when.y - ${SLIDE_T.toFixed(2)} - when.z, 0.0);
  float run = tau < ${TACC.toFixed(2)} ? 0.5 * ${ACC.toFixed(2)} * tau * tau : ${(0.5 * ACC * TACC * TACC).toFixed(2)} + ${VMAX.toFixed(2)} * (tau - ${TACC.toFixed(2)});
  vec3 o = vec3(berth.x + run, berth.y + lift, berth.z + berth.w * ${SLIDE.toFixed(2)} * sl);
  gone = step(${XGONE.toFixed(1)}, o.x);
  return o;
}
float kLitAt(vec4 when) { return smoothstep(when.x, when.x + 0.3, uT); }
float kFlash(vec4 when) { float d = uT - when.x; return d > 0.0 ? exp(-d * 1.5) : 0.0; }
`;

const CAB_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit;
attribute vec4 aBerth; attribute vec4 aWhen; attribute vec4 aPaint;
${BEND_PARS}
${MOTION}
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vLoc; varying float vRole; varying float vLit;
void main() {
  vec3 p = position, n = normal;
  vLoc = p;
  p.xz *= aBerth.w; n.xz *= aBerth.w;
  float gone; vec3 o = kCabAt(aBerth, aWhen, gone);
  p = p * (1.0 - gone) + o;
  vF = p; vFN = n;
  kBend(p, n);
  vW = p; vN = n;
  vCol = aCol.a > 0.5 ? aPaint.rgb : aCol.rgb * aPaint.w;
  vRole = aEmit;
  vLit = kLitAt(aWhen) + 0.9 * kFlash(aWhen);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const cabFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uCabin, uStandby, uReady;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying vec3 vLoc; varying float vRole; varying float vLit;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  vec3 L = kLight(vW, N, vF, FN);
  vec3 c = vCol * L;
  if (vRole > 0.5 && vRole < 1.5) {
    // dark glass; then a lit room, with the backs of its six seats against the light and a lamp along its ceiling
    float u = fract((vLoc.x + 1.05) / 0.7) - 0.5;
    float seat = step(abs(u), 0.33) * step(vLoc.y, 1.17 - 0.5 * max(abs(u) - 0.25, 0.0));
    float lamp = 0.75 + 0.6 * smoothstep(1.5, 1.66, vLoc.y);
    c = vCol * L * 2.0 + uCabin * vLit * lamp * mix(1.0, 0.16, seat);
  } else if (vRole > 2.5) {
    c = mix(uStandby, uReady, clamp(vLit, 0.0, 1.0));
  }
  gl_FragColor = vec4(kAir(c, vW), 1.0);
}`;

// the standby lights and the light that spills from each lit cab, as small lights that keep the cabs' clock
const LIGHT_VERT = /* glsl */`
attribute vec4 aBerth; attribute vec4 aWhen; attribute vec4 aOff;      // aOff: where on the cab, and which light (w: 0 standby, 1 cabin)
${BEND_PARS}
${MOTION}
uniform float uPx, uMinPx, uMaxPx; uniform vec2 uRes; uniform vec3 uStandby, uReady, uCabin; uniform vec2 uSize;
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  float gone; vec3 o = kCabAt(aBerth, aWhen, gone);
  vec3 off = aOff.xyz; off.xz *= aBerth.w;
  vec3 p = o + off, n = vec3(0.0, 1.0, 0.0);
  kBend(p, n);
  vW = p;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float lit = kLitAt(aWhen), fl = kFlash(aWhen), size;
  vec3 col;
  if (aOff.w < 0.5) { col = mix(uStandby, uReady, lit); size = uSize.x; }
  else { col = uCabin * (lit + 1.6 * fl) * smoothstep(22.0, 60.0, -mv.z); size = uSize.y; }
  col *= 1.0 - gone;
  float dist = max(-mv.z, 0.01);
  float px = size * uPx / dist;
  float shown = clamp(px, uMinPx, uMaxPx);
  vC = col * min((px * px) / (shown * shown), 1.0);
  vQ = position.xy;
  vec4 clip = projectionMatrix * mv;
  clip.xy += position.xy * shown / uRes * clip.w * 2.0;
  gl_Position = clip;
}`;
const LIGHT_FRAG = /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  ${CLIP_FRAG}
  float a = pow(max(1.0 - length(vQ) * 2.0, 0.0), 1.9);
  if (a <= 0.0 || dot(vC, vC) < 1e-8) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;

// Paint: a cream body, worn to different shades, and one stripe from a few old colours
const STRIPES = ['#3f6f73', '#9a4f3a', '#b08a3e', '#51627a', '#5d7a62', '#7a5a6a', '#3f5a48'];

/** the cabs: near ones modelled, far ones plain boxes, and every cab's two small lights; all keep one clock (uT) */
function cabMeshes(cabs, rig, frame, isNear) {
  const T = { value: 0 };
  const bend = { value: new Vector3(frame.a0, frame.z0, frame.floorR) };
  const mat = new ShaderMaterial({
    uniforms: { ...rig.uniforms, uClip: G.uClip, uBend: bend, uT: T, uCabin: { value: vec3col('#ffcf94', 1.25) }, uStandby: { value: vec3col('#7fe8d6', 3.2) }, uReady: { value: vec3col('#cdf3c4', 1.1) } },
    vertexShader: CAB_VERT, fragmentShader: cabFrag(rig), side: FrontSide,
  });
  const rng = makeRng('sleepers paint');
  const paint = cabs.map(() => { const s = rgb(STRIPES[Math.floor(rng() * STRIPES.length)]), k = rng.f(0.82, 1.08); return [s[0] * k, s[1] * k, s[2] * k, rng() < 0.06 ? rng.f(0.7, 0.8) : k]; });
  const out = [];
  for (const near of [true, false]) {
    const list = [], pl = [];
    cabs.forEach((c, i) => { if (isNear(c) === near) { list.push(c); pl.push(paint[i]); } });
    if (!list.length) continue;
    const base = cabGeo(near), g = new InstancedBufferGeometry();
    for (const k of ['position', 'normal', 'aCol', 'aEmit']) g.setAttribute(k, base.getAttribute(k));
    const B = new Float32Array(list.length * 4), W = new Float32Array(list.length * 4), P = new Float32Array(list.length * 4);
    list.forEach((c, i) => { B.set([c.x, c.y, c.z, c.side], i * 4); W.set([c.when[0], c.when[1], c.when[2], 0], i * 4); P.set(pl[i], i * 4); });
    g.setAttribute('aBerth', new InstancedBufferAttribute(B, 4));
    g.setAttribute('aWhen', new InstancedBufferAttribute(W, 4));
    g.setAttribute('aPaint', new InstancedBufferAttribute(P, 4));
    g.instanceCount = list.length;
    const m = new Mesh(g, mat); m.frustumCulled = false;
    out.push(m);
  }
  // two lights a cab: the standby light on its roof, and the glow of its lit room spilling into the lane
  const n = cabs.length, q = new InstancedBufferGeometry();
  q.setAttribute('position', base4());
  q.setIndex([0, 1, 2, 0, 2, 3]);
  const B = new Float32Array(n * 8), W = new Float32Array(n * 8), O = new Float32Array(n * 8);
  cabs.forEach((c, i) => {
    for (let j = 0; j < 2; j++) {
      const k = (i * 2 + j) * 4;
      B.set([c.x, c.y, c.z, c.side], k); W.set([c.when[0], c.when[1], c.when[2], 0], k);
      O.set(j === 0 ? [0, CAB.H + 0.1, 0.76, 0] : [0, 1.25, 1.35, 1], k);
    }
  });
  q.setAttribute('aBerth', new InstancedBufferAttribute(B, 4));
  q.setAttribute('aWhen', new InstancedBufferAttribute(W, 4));
  q.setAttribute('aOff', new InstancedBufferAttribute(O, 4));
  q.instanceCount = n * 2;
  const lm = new ShaderMaterial({
    uniforms: {
      uClip: G.uClip, uPx: G.uPx, uRes: G.uRes, uBend: bend, uT: T, uMinPx: { value: 1.4 }, uMaxPx: { value: 90 },
      uStandby: { value: vec3col('#5fe0c8', 3.4) }, uReady: { value: vec3col('#cdf3c4', 0.9) }, uCabin: { value: vec3col('#ffc98a', 0.55) }, uSize: { value: new Vector2(0.26, 2.8) },
    },
    vertexShader: LIGHT_VERT, fragmentShader: LIGHT_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const lights = new Mesh(q, lm); lights.frustumCulled = false; lights.renderOrder = 10;
  out.push(lights);
  return { meshes: out, T, lights: lm };
}
// a plain square: all a light needs
const base4 = () => new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3);

// ---------------------------------------------------------------- racks, guideways, the hall
const STEEL = '#4b4d4f', STEEL2 = '#5d5c58', RAIL = '#7d7a72', YEL = '#a88a3e';
// One bay of rack: 8 m of it, two berths on each tier, its post at x = -4. The rack's middle is z = 0 and its lane lies
// to +z, where the bay also carries both tiers of the lane's guideway (SLIDE metres out) and the arm that holds the upper one.
function bayGeo(g, near) {
  const R = 1.25, top = 5.45, gz = SLIDE;
  const post = (z0, z1) => g.box(-4.12, 0, z0, -3.88, top, z1, STEEL, { skip: 'tb' });
  post(R - 0.15, R + 0.05);
  if (near) {
    post(-R - 0.05, -R + 0.15);
    g.box(-4.12, top, -R - 0.05, -3.88, top + 0.06, R + 0.05, STEEL2);
    for (const zz of [-0.55, 0.55]) {
      g.box(-4, 0.2, zz - 0.07, 4, TIER[0], zz + 0.07, RAIL, { skip: 'bwe' });
      g.box(-4, TIER[1] - 0.15, zz - 0.07, 4, TIER[1], zz + 0.07, RAIL, { skip: 'we' });
    }
    g.box(-4.12, 0, -R, -3.88, 0.2, R, YEL, { skip: 'bwe' });
    g.box(-4.12, TIER[1] - 0.38, -R, -3.88, TIER[1] - 0.12, gz + 0.3, STEEL2, { skip: 'we' });
    for (const zz of [-R + 0.05, R - 0.05]) g.box(-4, top - 0.14, zz - 0.06, 4, top, zz + 0.06, STEEL2, { skip: 'we' });
    // the guideways: one on the floor, one on the arms
    g.box(-4, 0, gz - 0.3, 4, 0.3, gz + 0.3, '#3d3c3a', { skip: 'bwe', top: '#5b5852' });
    g.box(-4, TIER[1] - 0.3, gz - 0.3, 4, TIER[1] - 0.02, gz + 0.3, '#3d3c3a', { skip: 'we', top: '#5b5852' });
    for (const y of [0.3, TIER[1] - 0.02]) g.box(-4, y, gz - 0.05, 4, y + 0.02, gz + 0.05, '#9a958a', { skip: 'bwe' });
    // a small plate on the post: the bay's number is lettered on the near ones (see racks())
  } else {
    // far off: the shelves and guideways as their tops and the faces toward the lane
    g.box(-4, TIER[1] - 0.15, -0.65, 4, TIER[1], 0.65, RAIL, { skip: 'bwen' });
    g.box(-4, 0, gz - 0.3, 4, 0.3, gz + 0.3, '#3d3c3a', { skip: 'bwen', top: '#5b5852' });
    g.box(-4, TIER[1] - 0.3, gz - 0.3, 4, TIER[1] - 0.02, gz + 0.3, '#3d3c3a', { skip: 'bwen', top: '#5b5852' });
  }
}

function protos(deck) {
  deck.proto('bayNear', (g) => bayGeo(g, true));
  deck.proto('bayFar', (g) => bayGeo(g, false));
  deck.proto('column', (g) => { g.box(-0.26, 0, -0.26, 0.26, H, 0.26, '#55534e', { skip: 'tb' }); g.box(-0.34, 0, -0.34, 0.34, 0.5, 0.34, YEL, { skip: 'b' }); });
  // a lamp under the ceiling over a walk: a housing and a panel, kept low at night
  deck.proto('ceilLamp', (g) => { g.box(-0.7, -0.16, -0.2, 0.7, 0, 0.2, '#3f3d3a', { skip: 't' }); g.floor(-0.62, -0.14, 0.62, 0.14, -0.165, '#ffd9a8', { down: true, emit: 1.3 }); });
}

/** the racks: near ones (by the flight's aisle) in full, the rest plainly */
function racks(deck, isNearAisle) {
  for (let m = 0; m < NA; m++) for (let r = 0; r < 2; r++) {
    const near = isNearAisle(m), z = aisleZ(m) + RACK[r];
    for (let k = 0; k < NB / 2; k++) {
      const xc = BX0 + 2 + k * 8;
      deck.put(near ? 'bayNear' : 'bayFar', { p: [xc, 0, z], yaw: r === 0 ? 0 : Math.PI });
    }
  }
}

/** floor, ceiling, walls, the columns, the far wall's tube mouths and the tubes behind them */
function* hall(deck, exitMouth) {
  const ZA = aisleZ(0), ZB = aisleZ(NA), clk = deck.clk;
  clk.go();
  // the floor, aisle by aisle, in 80 m lengths: racks and lanes in plain concrete, the walk paler, with painted edges
  for (let m = 0; m < NA; m++) {
    const z0 = aisleZ(m);
    for (let x = 0; x < XWALL; x += 80) {
      const x1 = Math.min(XWALL, x + 80), b = deck.bucket(x + 40, z0 + 7);
      b.f.tint(0.5);
      b.f.floor(x, z0, x1, z0 + WALK - 1, 0, '#5c5952', { emit: 0.35 });
      b.f.floor(x, z0 + WALK + 1, x1, z0 + AW, 0, '#5c5952', { emit: 0.35 });
      b.f.tint(1).floor(x, z0 + WALK - 1, x1, z0 + WALK + 1, 0, '#7f786b', { emit: 0.6 }).tint(0);
      for (const s of [-1, 1]) b.g.floor(x, z0 + WALK + s * 0.94 - 0.05, x1, z0 + WALK + s * 0.94 + 0.05, 0.012, YEL, { emit: 0.25 });
      b.g.floor(x, z0, x1, z0 + AW, H, '#5e5850', { down: true });
    }
    if (clk.due()) { yield 'sleepers: floor'; clk.go(); }
  }
  // the beams under the ceiling, the columns between back-to-back racks, the lamps over the walks
  for (let j = 0; j < 28; j++) {
    const x = 18 + j * 16;
    for (let m = 0; m < NA; m++) {
      const z0 = aisleZ(m), b = deck.bucket(x, z0 + 7);
      b.g.box(x - 0.3, H - 0.62, z0, x + 0.3, H, z0 + AW, '#6a645a', { skip: 'tns' });
      if (m > 0) deck.put('column', { p: [x, 0, z0], yaw: 0 });
      if (deck.clear(x + 8, H - 0.3, z0 + WALK, 2.6)) {
        deck.put('ceilLamp', { p: [x + 8, H - 0.05, z0 + WALK], yaw: 0 });
        deck.glow([{ p: [x + 8, H - 0.3, z0 + WALK], color: '#ffc98a', power: 1.3, size: 0.55 }]);
      }
      for (const s of [-1, 1]) deck.glow([{ p: [x, 0.04, z0 + WALK + s * 0.94], color: '#ff9a40', power: 0.7, size: 0.11 }]);
    }
    if (clk.due()) { yield 'sleepers: beams'; clk.go(); }
  }
  // the side walls and the near wall
  for (let x = 0; x < XWALL; x += 40) {
    const x1 = Math.min(XWALL, x + 40);
    deck.bucket(x + 20, ZA).g.quad([x1, 0, ZA], [x, 0, ZA], [x, H, ZA], [x1, H, ZA], '#4a4741');
    deck.bucket(x + 20, ZB).g.quad([x, 0, ZB], [x1, 0, ZB], [x1, H, ZB], [x, H, ZB], '#4a4741');
    for (const z of [ZA, ZB]) deck.bucket(x + 20, z).g.box(x, 0, z - 0.25, x1, 0.6, z + 0.25, YEL, { skip: 'bwe' });
  }
  for (let m = 0; m < NA; m++) { const z0 = aisleZ(m); deck.bucket(XNEAR, z0 + 7).g.quad([XNEAR, 0, z0 + AW], [XNEAR, 0, z0], [XNEAR, H, z0], [XNEAR, H, z0 + AW], '#4a4741'); }
  yield 'sleepers: walls';
  // the far wall: two mouths a lane, one for each tier, each framed in small lamps; a short tube behind each
  const X = XWALL, wall = '#56524b';
  const face = (g, z0, z1, y0, y1) => g.quad([X, y0, z0], [X, y0, z1], [X, y1, z1], [X, y1, z0], wall);
  for (let m = 0; m < NA; m++) {
    const z0 = aisleZ(m), b = deck.bucket(X, z0 + 7, 'mouths'), g = b.g;
    const holes = LANE.map((c) => [z0 + c - MOUTH.w / 2, z0 + c + MOUTH.w / 2]);
    face(g, z0, holes[0][0], 0, H); face(g, holes[0][1], holes[1][0], 0, H); face(g, holes[1][1], z0 + AW, 0, H);
    for (const [a, c] of holes) {
      face(g, a, c, MOUTH.y[0][1], MOUTH.y[1][0]); face(g, a, c, MOUTH.y[1][1], H);
      for (const [y0, y1] of MOUTH.y) {
        const mine = exitMouth && Math.abs(exitMouth.z - (a + c) / 2) < 0.5 && Math.abs(exitMouth.y - (y0 + y1) / 2) < 0.6;
        const len = mine ? 70 : 34;
        // the tube: dark inside, its guideway down the middle
        b.c.box(X, y0, a, X + len, y1, c, '#2a2a2d', { skip: 'w' });
        g.box(X, y0, (a + c) / 2 - 0.3, X + len, y0 + (y0 > 1 ? 0.15 : 0.3), (a + c) / 2 + 0.3, '#3d3c3a', { skip: 'bwe' });
        // its frame of lamps
        for (let k = 0; k <= 10; k++) deck.glow([{ p: [X - 0.08, y1 + 0.1, a + (c - a) * k / 10], color: '#ffd9a0', power: 0.7, size: 0.16 }]);
        for (const zz of [a - 0.1, c + 0.1]) for (let k = 0; k <= 4; k++) deck.glow([{ p: [X - 0.08, y0 + (y1 - y0) * k / 4, zz], color: '#ffd9a0', power: 0.7, size: 0.16 }]);
        if (mine) for (let x = X + 6; x < X + len; x += 7) deck.glow([{ p: [x, y1 - 0.12, (a + c) / 2], color: '#cfe0ff', power: 1.1, size: 0.5 }]);
      }
    }
    if (clk.due()) { yield 'sleepers: mouths'; clk.go(); }
  }
  yield 'sleepers: far wall';
}


// ---------------------------------------------------------------- the night keepers
// A keeper in a work coat and a mask, the right arm held out with a hand lamp. Front toward -z, as the kit models people.
function keeperGeo() {
  const g = new Geo();
  for (const s of [-1, 1]) g.box(s * 0.1 - 0.07, 0, -0.08, s * 0.1 + 0.07, 0.84, 0.08, '#2c2f33');
  g.cyl(0, 0.76, 0, 0.24, 0.19, 0.72, 7, '#3e5260', { smooth: false });
  g.box(-0.21, 1.36, -0.1, 0.21, 1.47, 0.1, '#3e5260');
  g.blob(0, 1.6, 0, 0.125, 0, '#b07b52', { shadeBottom: 0.8 });
  g.box(-0.085, 1.5, -0.16, 0.085, 1.61, -0.07, '#3a3d3f');                 // the mask
  g.cyl(0, 1.68, 0, 0.135, 0.125, 0.08, 7, '#2b2e30', { smooth: false });   // a cap
  g.tube([[-0.23, 1.42, 0], [-0.27, 1.12, 0.02], [-0.25, 0.86, 0.04]], 0.05, 5, '#3e5260');
  g.tube([[0.23, 1.42, 0], [0.31, 1.12, -0.2], [0.3, 1.02, -0.4]], 0.05, 5, '#3e5260');
  g.box(0.24, 0.84, -0.52, 0.36, 1.0, -0.38, '#8f877a');                   // the lamp
  g.box(0.255, 0.86, -0.525, 0.345, 0.98, -0.515, '#fff3d0', { emit: 6 });
  return g.build();
}
const KEEPERS = [
  { m: MC, dz: 0.95, x0: 244, v: -0.7 },
  { m: MC - 3, dz: -0.2, x0: 284, v: 0.9 },
  { m: MC + 4, dz: 0.3, x0: 338, v: -0.85 },
];

export const sorrelSleepers = {
  id: 'sorrel-sleepers',
  title: 'The Sleepers at half past four', drum: 'Sorrel', row: 'Herb Row', kind: 'a steady drum', light: 0.0,
  line: 'Ten thousand cabs asleep in one dark room, a little green light on each. At half past four they wake from the far end, and every one is a lit room going off to fetch somebody.',
  tone: '#e8c99a', source: 'sorrel.md (Line decks: the Sleepers); drum-transport.md (Cabs; Line decks)',
  sound: { root: 40, scale: 'aeolian', pad: 0.3, air: 0.35, hum: 0.9, bells: 0.06, bright: 0.3 },
  *build(ctx) {
    const frame = makeFrame(190 * DEG, 3500, deckRadius(138));       // Ring Nine, the Hour of the Otter, line deck 138
    const ZL = aisleZ(MC) + LANE[0];                                   // the lane the flight leaves by
    const path = makePath([
      { t: 0, p: [228, 1.6, -0.5] },
      { t: 4, p: [233.4, 1.66, -0.5], look: [262, 1.6, 0.4] },
      { t: 8.5, p: [239, 2.7, -0.55], look: [275, 2.9, -0.3] },
      { t: 13, p: [244, 5.6, 0], look: [320, 4.6, -18] },
      { t: 17.5, p: [247.5, 6.6, 0], look: [320, 4.4, -52], fov: 64 },
      { t: 22, p: [250.5, 6.6, 0], look: [325, 4.2, 26], fov: 64 },
      { t: 26.5, p: [254, 6.2, 0], look: [272, 3.4, -3.5] },
      { t: 30, p: [266, 4.6, 0], look: [298, 3.9, -1.8] },
      { t: T_RUN, p: [X_RUN, 4.0, 0], look: [X_RUN + 30, 3.9, -1.6] },
      { t: 37.5, p: [X_RUN + 35, 4.25, 0], look: [X_RUN + 65, 4.2, -1.4] },
      { t: 41, p: [X_RUN + 70, 6.45, 0], look: [460, 4.2, 0], fov: 64 },
      { t: 44.5, p: [X_RUN + 104, 6.2, 0], look: [470, 4.0, -1] },
      { t: 48, p: [427, 4.3, -0.4], look: [470, 4.05, -2.2] },
      { t: 51, p: [447, 4.03, -1.7] },
      { t: 53.5, p: [457.5, 4.04, -2.45] },
      { t: 56, p: [463.5, 4.05, ZL] },
    ], { frame, entryRadius: 1.1, exitRadius: 1.25 });
    const deck = makeDeck(ctx, {
      frame, near: path.points(0.5), seed: 'sleepers', palette: PALETTES.dim, clock: 'flight', detail: 30,
      light: { level: 0.6, ambUp: '#3b3833', ambDown: '#2b2926', ambPower: 0.4, haze: '#0a0908', hazeDensity: 0.0015 },
      floor: { slab: [1.5, 1.5], wear: 0.5, shine: 0.7, rough: 0.05 },
    });
    yield 'sleepers: path';
    const rng = makeRng('sleepers');
    const cabs = schedule(rng);
    yield 'sleepers: schedule';
    const nearAisle = (m) => Math.abs(m - MC) <= 1;
    protos(deck);
    racks(deck, nearAisle);
    yield 'sleepers: racks';
    yield* hall(deck, { y: (MOUTH.y[1][0] + MOUTH.y[1][1]) / 2, z: ZL });

    // ---- signs: the depot's name over the walk, the aisles' numbers, a notice, the plates over the tube mouths
    {
      const b = deck.bucket(240, 0, 'signs').g;
      b.box(240.03, 5.85, -1.75, 240.12, 6.85, 1.75, '#1c1a17');
      for (const z of [-1.4, 1.4]) b.box(240.05, 6.85, z - 0.02, 240.09, H, z + 0.02, '#4a4b4c', { skip: 'tb' });
      deck.sign(['The Sleepers', 'A hundred and thirty-eight, Nine, Otter'], { at: [240.02, 6.35, 0], n: [-1, 0], w: 3.4, h: 0.92, style: 'glow', font: 'serif', font2: 'cond', glow: 1.6, ink: '#ffd9a0', ground: '#15120e' });
      for (let m = 0; m < NA; m++) {
        const z = aisleZ(m) + WALK, g = deck.bucket(300, z, 'signs').g;
        g.box(300.03, 6.35, z - 0.85, 300.1, 6.85, z + 0.85, '#141615');
        for (const zz of [z - 0.6, z + 0.6]) g.box(300.05, 6.85, zz - 0.015, 300.08, H, zz + 0.015, '#4a4b4c', { skip: 'tb' });
        deck.sign('Aisle ' + (m + 1), { at: [300.02, 6.6, z], n: [-1, 0], w: 1.6, h: 0.44, style: 'glow', font: 'cond', glow: 1.1, ink: '#9fe8da', ground: '#0e1312', track: 0.18 });
      }
      const nb = [245, 0, 0.98], nn = [-Math.sin(Math.PI / 3), -Math.cos(Math.PI / 3)];
      deck.put('noticeboard', { p: nb, yaw: Math.PI / 3, color: '#5f4630' });
      deck.sign(['Half past four', 'They wake from the far end.', 'Keep to the walk.'], { at: [nb[0] + nn[0] * 0.03, 1.375, nb[2] + nn[1] * 0.03], n: nn, w: 1.2, h: 0.98, style: 'paper', font2: 'serif' });
      deck.glow([{ p: [nb[0] + nn[0] * 0.25, 2.05, nb[2] + nn[1] * 0.25], color: '#ffe0b0', power: 1.4, size: 0.3 }]);
      for (let m = MC - 3; m <= MC + 3; m++) for (const c of LANE) deck.sign(['To the loops', 'Spinward 29.5, anti 30'], { at: [XWALL - 0.03, 5.85, aisleZ(m) + c], n: [-1, 0], w: 2.4, h: 0.6, style: 'plate', font: 'cond', font2: 'cond', ground: '#d9d2c0', ink: '#27394a' });
    }
    // the lamps over the walks, kept low at night; the light of the woken cabs and of the keepers' lamps (set in update)
    deck.lattice({ origin: [26, H - 0.3, aisleZ(0) + WALK], spacing: [16, AW], count: [28, NA], color: '#ffc98a', power: 0.32, reach: 4.2, drop: H + 0.2 });
    const waveZone = deck.zone({ min: [1e4, -1, 0], max: [1e4 + 1, 9, 1], power: 0 });
    const keeperZones = KEEPERS.map(() => deck.zone({ min: [1e4, -1, 0], max: [1e4 + 1, 2, 1], power: 0 }));
    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);

    // ---- the cabs
    const cm = cabMeshes(cabs, deck.rig, frame, (c) => nearAisle(c.m));
    for (const m of cm.meshes) scene.add(m);
    yield 'sleepers: cabs';

    // ---- the keepers and their lamps
    const kmat = litMaterial(deck.rig, { bend: frame, soft: 0.45 });
    const kmesh = new InstancedMesh(keeperGeo(), kmat, KEEPERS.length);
    kmesh.frustumCulled = false;
    scene.add(kmesh);
    const lampPts = [];
    for (let i = 0; i < KEEPERS.length; i++) lampPts.push({ p: [0, 0, 0], color: '#fff0d0', power: 3.2, size: 0.22 }, { p: [0, 0, 0], color: '#ffd9a0', power: 0.5, size: 1.6 });
    const lamps = glowPoints(lampPts, { bend: frame, minPx: 1.4, maxPx: 160, soft: 1.9 });
    scene.add(lamps);
    const m4 = new Matrix4(), qu = new Quaternion(), one = new Vector3(1, 1, 1), pv = new Vector3(), yAxis = new Vector3(0, 1, 0);
    const look = { exposure: 1.9, bloom: 0.3, threshold: 0.9, spread: 1, vignette: 0.55, grain: 0.035, saturation: 1.05, contrast: 1.05 };
    const zoneW = { min: [0, -1, aisleZ(0) - 2], max: [540, 9.5, aisleZ(NA) + 2], soft: 16, color: '#ffcf98', power: 0, side: 0.75, under: 0.9 };

    function place(t) {
      const ap = lamps.geometry.getAttribute('aPos');
      KEEPERS.forEach((k, i) => {
        const x = k.x0 + k.v * t, z = aisleZ(k.m) + WALK + k.dz, fw = Math.sign(k.v), bob = 0.025 * Math.abs(Math.sin(t * 5.2 + i));
        qu.setFromAxisAngle(yAxis, fw > 0 ? -Math.PI / 2 : Math.PI / 2);
        m4.compose(pv.set(x, bob, z), qu, one);
        kmesh.setMatrixAt(i, m4);
        const sway = 0.03 * Math.sin(t * 2.6 + i * 2);
        const lx = x + fw * 0.52, ly = 0.92 + bob + sway * 0.3, lz = z + fw * (0.3 + sway);
        ap.setXYZ(i * 2, lx + fw * 0.03, ly, lz); ap.setXYZ(i * 2 + 1, lx + fw * 0.03, ly, lz);
        deck.rig.setZone(keeperZones[i], { min: [lx - 2.4, -0.5, lz - 2.4], max: [lx + 2.4, 1.6, lz + 2.4], soft: 2.2, color: '#ffd9a8', power: 0.9, side: 0.9, under: 1 });
      });
      kmesh.instanceMatrix.needsUpdate = true;
      ap.needsUpdate = true;
    }
    place(0);

    return {
      scene, path, deck, near: 0.1, far: 900, look,
      portal: { shape: 'rect', width: 4.0, height: 2.1, rim: false, mist: '#ffd9a0' },
      update(t) {
        deck.tick(t);
        cm.T.value = t;
        place(t);
        // the light of the woken cabs follows the front down the hall
        const xf = X_FAR - V_W * (t - T_W);
        zoneW.min[0] = xf - 6; zoneW.power = 0.2 * smoothstep(T_W - 1, T_W + 3, t);
        deck.rig.setZone(waveZone, zoneW);
        look.exposure = 2.05 - 0.6 * smoothstep(T_W + 7, T_W + 16, t);
      },
    };
  },
};
