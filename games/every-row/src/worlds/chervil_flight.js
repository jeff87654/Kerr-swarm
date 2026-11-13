// Chervil, Herb Row: the Long Flight, on Booking night, a little after 22:00. The sunline stays dark, the Spindle opens
// end to end, and everyone goes up with their block: wing-sleeves and a hand lamp each, about 660,000 in the air at once,
// a flyer to every 100 m3 within 75 m of the axis (docs/open-drums.md, The calendar, Booking Day in Chervil at 22:00,
// Method; wander-year.md, Day 60). The line is a dark cable down the middle and the lamps drift round it like a slow
// river. Wardens with red lamps hold the 75 m edge, because a flyer who drifts off the axis falls for minutes
// (sorrel.md, Open questions). Every block has a choir (open-drums.md, Culture), and somewhere in the river one is singing.
//
// The flight: along the top terrace by the front gate among one block making ready, out over the rail with them and a
// few seconds at their speed, then on ahead of them down the river, faster and faster: through another block's banner
// and its choir, out to the edge to look down a lit lane fifteen hundred metres below, along the edge past a warden,
// and in to the back flying hall, where the first flyers are coming down into the landing net.
//
// Not canon (the docs are silent):
//   - the gate on the front wall's top terrace: a counter hiring sleeves, a board of them, lamps on the rail
//   - how a block flies: families on loose lines, children on a line between two grown-ups, elders towed, a banner of
//     the block's colours carried at the front with lamps along its hems; that a flute is played in it
//   - the shape of the river: thickest between 6 and 45 m from the axis, thinner toward the edge; its pace, about
//     2.5 m/s, so the length takes 25 minutes; some of the first shift already coming back along the outside
//   - wardens' dress, and that they hold the edge in rings every 40 m; the landing net across the back flying hall
//     and the net crew; that the front of the river reaches it about now
//   - the shoes-as-deposit and sleeves-for-hire custom is Sorrel's; here sleeves are only shown on a board
//   - Chervil's Hollow plan (paintChervil, below, shared with chervil_dawn.js)
//   - the flight is pressed: the camera covers the length in under a minute; the flyers keep their own pace
import {
  Scene, Vector3, Quaternion, Matrix4, BufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute,
  Uint8BufferAttribute, Mesh, Points, ShaderMaterial, DoubleSide, AdditiveBlending, Sphere,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { G, CLIP_PARS, CLIP_FRAG, glowPoints, vec3col } from '../kit/mats.js';
import { Geo } from '../kit/geo.js';
import { crowd, SKIN } from '../kit/folk.js';
import { DRUM } from '../kit/drum.js';
import { makeRng, smoothstep } from '../core/rng.js';

export function paintChervil(plan) {
  const rng = makeRng('chervil-plan');
  plan.fill(plan.band(0, L), { color: '#85a268', life: 0.3 });
  plan.mottle(['#90aa70', '#7a9a60', '#98ae76', '#74935c'], 420, 160, { alpha: 0.4, seed: 'chervil-lawn' });
  plan.fill(plan.band(0, 700), { color: '#4f7448', wood: 0.9, clear: ['life'], feather: 30 });
  plan.fill(plan.band(L - 700, L), { color: '#4a6f47', wood: 0.9, clear: ['life'], feather: 30 });
  // a long lake the halls picnic beside, winding most of the length of the floor
  const spine = []; for (let i = 0; i <= 40; i++) { const z = 900 + (i / 40) * 1950; spine.push([0.31 * C + Math.sin(i * 0.33) * 210 + Math.sin(i * 0.11 + 1) * 120, z]); }
  plan.stroke(spine, 330, { color: '#cdbf9a', paved: 0.2, life: 0.9, clear: ['wood'] });
  plan.stroke(spine, 280, { color: '#5aa3a0', water: 1, clear: ['life', 'paved', 'wood'] });
  plan.stroke(spine, 150, { color: '#2f7890' });
  plan.clumps(900, 9, 34, { seed: 'chervil-clumps', z0: 720, z1: L - 720, colors: ['#5f8a48', '#55803f', '#6b9450'], keep: (x, z) => Math.abs(x - 0.31 * C) > 420 || z < 800 || z > 2950 });
  // walks, every one lit: rings round the floor, lanes along it, and the shore
  const lit = (pts, w, sp) => { plan.stroke(pts, w, { color: '#cbbf9f', paved: 0.8, life: 0.8, clear: ['wood'] }); plan.lamps(pts, sp || 24); };
  const ring = (z, wob) => { const a = []; for (let i = 0; i <= 120; i++) a.push([(i / 120) * C, z + Math.sin(i * 0.31 + z) * wob]); return a; };
  for (let k = 0; k < 11; k++) lit(ring(760 + k * 223, 34), 6, k % 2 ? 30 : 22);
  for (let i = 0; i < 18; i++) { const x = (i / 18) * C; lit([[x, 740], [x + 60, 1500], [x - 40, 2300], [x, L - 740]], 5, 28); }
  plan.lamps(spine.map((q) => [q[0] - 170, q[1]]), 16); plan.lamps(spine.map((q) => [q[0] + 170, q[1]]), 16);
  // long tables set out on the lawns for the feast, each under a line of lanterns
  for (let i = 0; i < 70; i++) {
    const x = rng.f(0, C), z = rng.f(820, L - 820), a = rng.f(0, Math.PI), len = rng.f(50, 120);
    if (Math.abs(x - 0.31 * C) < 330 && z > 850 && z < 2900) continue;
    const p0 = [x - Math.cos(a) * len / 2, z - Math.sin(a) * len / 2], p1 = [x + Math.cos(a) * len / 2, z + Math.sin(a) * len / 2];
    plan.stroke([p0, p1], 9, { color: '#b9ab8c', paved: 0.5, life: 1, clear: ['wood'], cap: 'butt' });
    plan.stroke([p0, p1], 2.2, { color: '#efe6d2', cap: 'butt' });
    plan.lamps([p0, p1], 7, { radius: 1.6, power: 0.9 });
  }
}

// ---------------------------------------------------------------- the Spindle's shape
const SPIN = DRUM.SPINDLE;                       // 75 m: the edge the wardens hold
const DEG = Math.PI / 180;
const HUB = [[46, 0], [40, 26], [22, 60], [9, 120], [4, 150]];      // the hub cones (kit/hollow.js): radius by distance from the wall
function hubR(z) {
  const d = Math.min(z, L - z);
  if (d > 150) return 1.4;
  for (let i = 0; i < HUB.length - 1; i++) if (d <= HUB[i + 1][1]) { const [r0, z0] = HUB[i], [r1, z1] = HUB[i + 1]; return r0 + (r1 - r0) * (d - z0) / (z1 - z0); }
  return 1.4;
}
// the landing net across the back flying hall: a shallow funnel from the hub cone out to the edge, sagging toward the wall
const NET_IN = 12, NET_ZC = L - 108, NET_ZE = L - 150;
const netZ = (r) => NET_ZC + (NET_ZE - NET_ZC) * Math.pow(Math.max(0, (r - NET_IN) / (SPIN - NET_IN)), 0.8);
const RIVER_V = 2.5;                             // the river's pace along the axis, m/s
const cyl = (deg, r, z) => [r * Math.cos(deg * DEG), r * Math.sin(deg * DEG), z];
const inward = (deg) => [-Math.cos(deg * DEG), -Math.sin(deg * DEG), 0];

// ---------------------------------------------------------------- shaders
// Everything that flies is drawn in the drum's own space (the axis is z) and placed on the flight's clock, so the
// camera can meet a family exactly where it was meant to. Each copy: iP where it is at t = 0, iV its velocity
// (w: the second it stops, in the landing net), iQ how it is turned, iS (seed, scale, stroke rate, sway).
const POSE = /* glsl */`
attribute vec3 iP; attribute vec4 iV; attribute vec4 iQ; attribute vec4 iS;
uniform float uTime, uFlight;
vec3 kQ(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
mat2 kR(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
// nothing has an up: each group turns slowly about its own way of travel
vec3 kSway(vec3 p) {
  float a = iS.w * sin(uTime * 0.19 + iS.x * 41.0), b = iS.w * 0.35 * sin(uTime * 0.13 + iS.x * 23.0);
  p.xy = kR(a) * p.xy; p.yz = kR(b) * p.yz; return p;
}
vec3 kAt() { return iP + iV.xyz * min(uFlight, iV.w) + kQ(iQ, vec3(0.0, 0.1 * sin(uTime * 0.5 + iS.x * 17.0), 0.0)); }
float kH(float n) { return fract(sin(n * 91.345 + 7.13) * 43758.5453); }
`;

const FLY_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit; attribute float aLamp; attribute vec4 aFlap; attribute float aMem;
${POSE}
uniform vec3 uCloth[16]; uniform vec3 uSleeve[12]; uniform vec3 uSkin[6]; uniform vec3 uHair[6]; uniform vec3 uTrou[8]; uniform vec3 uTints[6];
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vLamp; varying float vEmit;
void main() {
  vec3 p = position + aFlap.xyz * sin(uTime * iS.z + aFlap.w + iS.x * 31.0);
  p = kSway(p * iS.y);
  vec3 w = kAt() + kQ(iQ, p);
  vN = kQ(iQ, kSway(normal));
  float part = aCol.a, s = floor(iS.x * 977.0) + aMem * 7.31;
  vec3 c = aCol.rgb;
  if (part > 0.9) c *= uCloth[int(kH(s) * 15.999)];
  else if (part > 0.7) c *= uTrou[int(kH(s + 1.0) * 7.999)];
  else if (part > 0.45) c *= uSleeve[int(kH(s + 2.0) * 11.999)];
  else if (part > 0.22) c *= uSkin[int(kH(s + 3.0) * 5.999)];
  else if (part > 0.1) c *= uHair[int(kH(s + 4.0) * 5.999)];
  vCol = c; vEmit = aEmit; vW = w;
  vLamp = aLamp * uTints[int(kH(floor(iS.x * 977.0) + 0.5) * 5.999)];
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
const flyFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uFill; uniform float uLampK;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vLamp; varying float vEmit;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 Lg = kLight(vW, N, vW, N) + uFill + vLamp * uLampK;
  gl_FragColor = vec4(kAir(vCol * (Lg + vEmit), vW), 1.0);
}`;

// hand lamps on the flyers near the camera: soft discs placed by the same pose as their hands
const LAMP_VERT = /* glsl */`
attribute vec3 lPos; attribute vec4 lFlap; attribute vec4 lCol;
${POSE}
uniform float uPx, uMinPx, uMaxPx, uGlow; uniform vec2 uRes; uniform vec3 uTints[6];
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  vec3 p = lPos + lFlap.xyz * sin(uTime * iS.z + lFlap.w + iS.x * 31.0);
  p = kSway(p * iS.y);
  vec3 w = kAt() + kQ(iQ, p);
  vW = w;
  vec4 mv = viewMatrix * vec4(w, 1.0);
  float dist = max(-mv.z, 0.01);
  float px = lCol.w * uPx / dist, shown = clamp(px, uMinPx, uMaxPx), k = min((px * px) / (shown * shown), 1.0);
  vec3 tint = lFlap.w < -5.0 ? vec3(1.0) : uTints[int(kH(floor(iS.x * 977.0) + 0.5) * 5.999)];
  vC = lCol.rgb * tint * k * uGlow * (1.0 + 0.05 * sin(uTime * 6.0 + iS.x * 60.0));
  vQ = position.xy;
  vec4 clip = projectionMatrix * mv;
  clip.xy += position.xy * shown / uRes * clip.w * 2.0;
  gl_Position = clip;
}`;
const GLOW_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uSoft;
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  ${CLIP_FRAG}
  float a = pow(max(1.0 - length(vQ) * 2.0, 0.0), uSoft);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;

// the river far off: one point each, on the flight's clock. Unresolved, each stands for several lamps (uRep).
const RIVER_VERT = /* glsl */`
attribute vec4 aV; attribute vec4 aC;
uniform float uTime, uFlight, uPx, uMinPx, uMaxPx, uRep;
varying vec3 vW; varying vec3 vC;
void main() {
  float ph = fract(position.z * 0.137 + position.x * 0.71) * 6.2832;
  vec3 p = position + aV.xyz * min(uFlight, aV.w) + 0.3 * vec3(sin(uTime * 0.41 + ph), cos(uTime * 0.37 + ph * 1.7), 0.0);
  vW = p;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.01);
  float px = aC.w * uPx / dist, shown = clamp(px, uMinPx, uMaxPx), k = min((px * px) / (shown * shown), 1.0);
  vC = aC.rgb * k * mix(1.0, uRep, smoothstep(90.0, 600.0, dist)) * (1.0 + 0.08 * sin(uTime * 2.3 + ph * 9.0));
  gl_PointSize = shown;
  gl_Position = projectionMatrix * mv;
}`;
// the river itself, made up here: position holds three random numbers and aW a fourth, which say where each lamp
// starts, how fast it goes and what colour it is. Lamps inside uTube of the camera fade out: there the flyers are real.
const RIVER_GPU_VERT = /* glsl */`
attribute float aW;
uniform float uTime, uFlight, uPx, uMinPx, uMaxPx, uRep, uTube;
uniform float uCdf[33]; uniform vec3 uTints[6];
varying vec3 vW; varying vec3 vC;
float kHub(float z) {
  float d = min(z, ${L.toFixed(1)} - z);
  if (d > 150.0) return 1.4;
  if (d < 26.0) return mix(46.0, 40.0, d / 26.0);
  if (d < 60.0) return mix(40.0, 22.0, (d - 26.0) / 34.0);
  if (d < 120.0) return mix(22.0, 9.0, (d - 60.0) / 60.0);
  return mix(9.0, 4.0, (d - 120.0) / 30.0);
}
float kNet(float r) { return ${NET_ZC.toFixed(1)} + ${(NET_ZE - NET_ZC).toFixed(1)} * pow(max(0.0, (r - ${NET_IN.toFixed(1)}) / ${(SPIN - NET_IN).toFixed(1)}), 0.8); }
void main() {
  vec3 R = position;
  float u = R.x * 32.0; int k = int(min(floor(u), 31.0));
  float r = mix(uCdf[k], uCdf[k + 1], fract(u));
  float a = R.y * 6.2831853, z = mix(4.0, ${(L - 104).toFixed(1)}, R.z);
  float h1 = fract(aW * 7.31 + 0.13), h2 = fract(aW * 13.71 + 0.37), h3 = fract(aW * 29.17 + 0.71), h4 = fract(aW * 53.3 + 0.5);
  bool gather = z < 46.0;
  bool back = !gather && r > 50.0 && z > 160.0 && h1 < 0.28;
  float vz = gather ? mix(0.5, 2.4, h2) : (back ? -mix(1.3, 1.9, h2) : ${RIVER_V.toFixed(2)} + (h2 - 0.5) * 0.9);
  float lead = kNet(r) - 105.0 - 35.0 * (0.5 + 0.5 * sin(a * 3.0 + 1.3)) - r * 0.4;
  float ok = (r > kHub(z) + 1.7 && r < 73.5 && (gather || back || z < lead)) ? 1.0 : 0.0;
  float zz = z + vz * uFlight;
  if (vz > 0.0) zz = min(zz, kNet(r) - 0.6);
  vec3 p = vec3(r * cos(a), r * sin(a), zz) + 0.3 * vec3(sin(uTime * 0.41 + h3 * 40.0), cos(uTime * 0.37 + h3 * 23.0), 0.0);
  float near = smoothstep(uTube, uTube + 6.0, length(p - cameraPosition));
  vW = p;
  if (ok * near < 0.001) { vC = vec3(0.0); gl_PointSize = 0.0; gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.01);
  float px = 0.3 * uPx / dist, shown = clamp(px, uMinPx, uMaxPx), kk = min((px * px) / (shown * shown), 1.0);
  vec3 tint = h3 < 0.07 ? uTints[5] : uTints[int(fract(h3 * 17.0) * 4.999)];
  vC = tint * mix(2.0, 3.6, h4) * kk * near * mix(1.0, uRep, smoothstep(90.0, 600.0, dist)) * (1.0 + 0.08 * sin(uTime * 2.3 + h3 * 60.0));
  gl_PointSize = shown;
  gl_Position = projectionMatrix * mv;
}`;
const RIVER_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uSoft;
varying vec3 vW; varying vec3 vC;
void main() {
  ${CLIP_FRAG}
  float a = pow(max(1.0 - length(gl_PointCoord - 0.5) * 2.0, 0.0), uSoft);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;

// ---------------------------------------------------------------- figures
// A group is people who fly together, modelled once: each member lying along +z (head forward), back up (+y), arms
// along x, then placed in the group's own coordinates. Every vertex carries what part it is (colours are chosen per copy
// in the shader), how it strokes, which member it is, and the light its group's own lamps throw on it, worked out here.
const PART = { cloth: 1, trou: 0.8, sleeve: 0.6, skin: 0.3, hair: 0.15, fixed: 0 };
const WARM = '#ffd49a';
class Group {
  constructor() { this.P = []; this.N = []; this.Cl = []; this.E = []; this.F = []; this.M = []; this.lamps = []; this.rad = 1; this.mem = 0; }
  /** add a Geo modelled in member coordinates, placed by m. stroke: metres of beat per metre of reach past the shoulder; flap(v) overrides */
  add(g, m, stroke = 0, phase = 0, flap = null) {
    const v = new Vector3(), n = new Vector3(), up = new Vector3(0, 1, 0).transformDirection(m), sc = new Vector3().setFromMatrixScale(m).x;
    const mem = this.mem++;
    for (let i = 0; i < g.pos.length / 3; i++) {
      v.set(g.pos[i * 3], g.pos[i * 3 + 1], g.pos[i * 3 + 2]);
      const f = flap ? flap(v) : null, amp = stroke * Math.max(Math.abs(v.x) - 0.25, 0) * sc;
      v.applyMatrix4(m); n.set(g.nrm[i * 3], g.nrm[i * 3 + 1], g.nrm[i * 3 + 2]).transformDirection(m);
      this.P.push(v.x, v.y, v.z); this.N.push(n.x, n.y, n.z);
      this.Cl.push(g.col[i * 4], g.col[i * 4 + 1], g.col[i * 4 + 2], g.col[i * 4 + 3]);
      this.E.push(g.emit[i]); this.M.push(mem);
      if (f) this.F.push(f[0], f[1], f[2], f[3]); else this.F.push(up.x * amp, up.y * amp, up.z * amp, phase);
      this.rad = Math.max(this.rad, v.length());
    }
    return mem;
  }
  /** a lamp at a point of a member (member coordinates, placed by m), moving with that point's stroke */
  lamp(q, m, stroke, phase, color, power, size, tinted = true) {
    const v = new Vector3(q[0], q[1], q[2]), sc = new Vector3().setFromMatrixScale(m).x, up = new Vector3(0, 1, 0).transformDirection(m);
    const amp = stroke * Math.max(Math.abs(v.x) - 0.25, 0) * sc;
    v.applyMatrix4(m);
    const c = vec3col(color, power);
    this.lamps.push({ p: [v.x, v.y, v.z], flap: [up.x * amp, up.y * amp, up.z * amp, tinted ? phase : -10], col: [c.x, c.y, c.z, size], power });
  }
  build() {
    const n = this.P.length / 3, lamp = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = this.P[i * 3], y = this.P[i * 3 + 1], z = this.P[i * 3 + 2], nx = this.N[i * 3], ny = this.N[i * 3 + 1], nz = this.N[i * 3 + 2];
      if (this.E[i] > 0.5) continue;
      const fin = Math.abs(this.Cl[i * 4 + 3] - 153) < 3;
      let s = 0;
      for (const l of this.lamps) {
        const dx = l.p[0] - x, dy = l.p[1] - y, dz = l.p[2] - z, d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2) + 1e-4;
        const ndl = (nx * dx + ny * dy + nz * dz) / d;
        s += l.power * (0.25 + 0.75 * (fin ? Math.abs(ndl) : Math.max(ndl, 0))) / (d2 + 0.06);
      }
      lamp[i] = s;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.N, 3));
    g.setAttribute('aCol', new Uint8BufferAttribute(this.Cl, 4, true));
    g.setAttribute('aEmit', new Float32BufferAttribute(this.E, 1));
    g.setAttribute('aLamp', new Float32BufferAttribute(lamp, 1));
    g.setAttribute('aFlap', new Float32BufferAttribute(this.F, 4));
    g.setAttribute('aMem', new Float32BufferAttribute(this.M, 1));
    this.geo = g;
    return this;
  }
}
const _s = new Vector3();
// a placement: position, then turns about x, y, z (radians, applied z first), then scale
function place(x, y, z, rx = 0, ry = 0, rz = 0, s = 1) {
  const m = new Matrix4().makeRotationX(rx).multiply(new Matrix4().makeRotationY(ry)).multiply(new Matrix4().makeRotationZ(rz));
  m.scale(_s.set(s, s, s)); m.setPosition(x, y, z);
  return m;
}

// One flyer in wing-sleeves. o: lod, reach (the lamp hand held out ahead), side (which hand: 1 right, -1 left), fold (arms
// in: an elder being towed, in a blanket), flute, white (white hair), fixed: { cloth, sleeve, trou } colours that do not
// change per copy, lamp: 'hand' (default) | 'chest' | 'pole' | 'none'. Returns { g, lamp: where its lamp is, or null }
function flyer(o = {}) {
  const g = new Geo(), fx = o.fixed || {};
  const P = (part, key) => { g.tint(fx[key] ? 0 : PART[part]); return fx[key] || '#ffffff'; };
  const side = o.side || 1;
  if (o.lod) {
    g.box(-0.18, -0.1, -1.35, 0.18, 0.11, 0.15, P('cloth', 'cloth'));
    const sk = P('skin'), a = [-0.1, -0.06, 0.2], b = [0.1, -0.06, 0.2], c = [0, 0.12, 0.2], d = [0, 0.02, 0.46];
    g.tri(a, c, b, sk); g.tri(a, b, d, sk); g.tri(b, c, d, sk); g.tri(c, a, d, sk);
    if (!o.fold) { const sl = P('sleeve', 'sleeve'); g.tri([0.18, 0.02, 0.1], [1.05, 0.02, 0.3], [0.18, 0, -0.56], sl); g.tri([-0.18, 0.02, 0.1], [-1.05, 0.02, 0.3], [-0.18, 0, -0.56], sl); }
    g.tint(0);
    const lamp = o.lamp === 'none' ? null : o.lamp === 'chest' || o.fold || o.flute ? [0, -0.17, -0.1] : o.lamp === 'pole' ? [0.32 * side, -0.08, 1.95] : o.reach ? [0.32 * side, -0.14, 1.07] : [1.05 * side, -0.04, 0.42];
    return { g, lamp };
  }
  // body, head, hair, legs
  g.box(-0.19, -0.11, -0.58, 0.19, 0.12, 0.14, P('cloth', 'cloth'));
  if (o.fold) { g.tint(0); g.box(-0.24, -0.15, -1.3, 0.24, 0.16, -0.05, fx.blanket || '#8a4f6a'); }
  g.blob(0, 0, 0.33, [0.105, 0.115, 0.125], 0, P('skin'), { shadeBottom: 0.85 });
  const hc = o.white ? (g.tint(0), '#d9d4ca') : P('hair');
  g.box(-0.1, 0.03, 0.2, 0.1, 0.13, 0.4, hc, { skip: 'b' });
  const tr = P('trou', 'trou');
  g.box(-0.17, -0.08, -1.4, -0.03, 0.07, -0.56, tr, { skip: 's' }); g.box(0.03, -0.08, -1.4, 0.17, 0.07, -0.56, tr, { skip: 's' });
  // arms and sleeves: fabric fins from wrist to hip
  let lampAt = null;
  for (const s of [-1, 1]) {
    const sh = [0.2 * s, 0.02, 0.1], hip = [0.2 * s, 0, -0.56];
    let wr, el;
    if (o.fold) { wr = [0.14 * s, -0.16, -0.12]; el = [0.26 * s, -0.08, -0.15]; }
    else if (o.flute) { wr = s > 0 ? [0.3, -0.14, 0.44] : [-0.02, -0.14, 0.45]; el = [0.36 * s, -0.1, 0.2]; }
    else if (o.reach && s === side) { wr = [0.32 * s, -0.08, 0.95]; el = [0.3 * s, -0.02, 0.52]; }
    else { wr = [1.05 * s, 0.02, 0.3]; el = [0.62 * s, 0.03, 0.12]; }
    const sl = P('sleeve', 'sleeve');
    if (!o.fold) { g.tri(sh, wr, el, sl); g.tri(sh, el, hip, sl); g.tri(el, wr, hip, sl); }
    if (o.fold || o.flute || s === side) { const k = P('skin'), c = [wr[0], wr[1], wr[2] + 0.03]; g.tri([c[0] - 0.05, c[1] - 0.04, c[2] - 0.05], [c[0] + 0.05, c[1] - 0.04, c[2] - 0.05], [c[0], c[1] + 0.05, c[2] - 0.05], k); g.tri([c[0] - 0.05, c[1] - 0.04, c[2] - 0.05], [c[0], c[1], c[2] + 0.07], [c[0] + 0.05, c[1] - 0.04, c[2] - 0.05], k); g.tri([c[0] + 0.05, c[1] - 0.04, c[2] - 0.05], [c[0], c[1], c[2] + 0.07], [c[0], c[1] + 0.05, c[2] - 0.05], k); g.tri([c[0], c[1] + 0.05, c[2] - 0.05], [c[0], c[1], c[2] + 0.07], [c[0] - 0.05, c[1] - 0.04, c[2] - 0.05], k); }
    if (s === side && !o.fold && !o.flute && (o.lamp || 'hand') === 'hand') lampAt = [wr[0], wr[1] - 0.06, wr[2] + 0.12];
    if (s === side && o.lamp === 'pole') { g.tint(0).box(wr[0] - 0.015, wr[1] - 0.015, wr[2], wr[0] + 0.015, wr[1] + 0.015, wr[2] + 0.95, '#3a3836'); lampAt = [wr[0], wr[1], wr[2] + 1.0]; }
  }
  if (o.flute) { g.tint(0); g.box(-0.08, -0.15, 0.42, 0.52, -0.12, 0.45, '#d9c9a2'); }
  if (!lampAt) lampAt = [0, -0.17, -0.1];                     // clipped to the chest
  g.tint(0);
  if (o.lamp !== 'none') g.cyl(lampAt[0], lampAt[1] - 0.06, lampAt[2], 0.05, 0.045, 0.12, 4, o.lamp === 'pole' ? '#ff6a50' : '#ffe2b0', { emit: 4 });
  return { g, lamp: o.lamp === 'none' ? null : lampAt };
}

const LAMP_P = 1.0, LAMP_SIZE = 0.26;
// add one flyer to a group: m places it, stroke is its sleeves' beat; its lamp goes where its hand is
function addFlyer(G0, o, m, stroke, phase, lampPower = LAMP_P) {
  const f = flyer(o), st = o.fold || o.flute ? 0 : stroke;
  G0.add(f.g, m, st, phase);
  if (!f.lamp) return;
  if (o.lamp === 'pole') G0.lamp(f.lamp, m, st, phase, '#ff3a26', 3.2, 0.42, false);
  else G0.lamp(f.lamp, m, st, phase, WARM, lampPower, LAMP_SIZE);
}
function rope(G0, a, b, color = '#d8ccb0') {
  const g = new Geo();
  g.tint(0).tube([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.12, (a[2] + b[2]) / 2], b], 0.014, 3, color);
  G0.add(g, new Matrix4());
}

// A block's banner: a pole held top and bottom by two flyers, the cloth streaming back six metres to two more who hold
// its tail, lamps sewn along both hems. cols: [bands, field, disc]
function bannerGroup(cols, stroke) {
  const G0 = new Group();
  const pole = new Geo(); pole.tint(0).box(-0.025, -1.18, -0.025, 0.025, 1.18, 0.025, '#4a3c30');
  G0.add(pole, new Matrix4());
  const wr = [-0.32, -0.08, 0.95];
  for (const [y, z, ph] of [[1.12, 0, 0], [-1.12, 0, 1.7], [0.97, -6.5, 0.6], [-0.97, -6.5, 2.4]]) addFlyer(G0, { reach: true, side: -1 }, place(-wr[0], y - wr[1], z - wr[2], 0, 0, 0, 1), stroke, ph);
  const LEN = 6.5, H = 0.95, wave = (v) => { const u = Math.min(1, Math.max(0, -v.z / LEN)), a = 0.32 * Math.sin(Math.PI * u); return [a, 0, 0, v.z * 1.3]; };
  const cloth = new Geo();
  const colAt = (z, y) => { if (Math.abs(y) > 0.86) return '#f4e6c8'; if (Math.hypot(z + 3.25, y) < 0.5) return cols[2]; return Math.abs(y) > 0.52 ? cols[0] : cols[1]; };
  for (let z = 0; z > -LEN + 1e-6; z -= 0.25) for (let y = -H; y < H - 1e-6; y += 0.19) {
    const z1 = z - 0.25, y1 = y + 0.19;
    cloth.quad([0, y, z1], [0, y, z], [0, y1, z], [0, y1, z1], colAt(z - 0.125, y + 0.095));
  }
  G0.add(cloth, new Matrix4(), 0, 0, wave);
  for (let z = -0.6; z > -LEN + 0.4; z -= 0.95) for (const y of [H + 0.04, -H - 0.04]) {
    const v = new Vector3(0, y, z), w = wave(v);
    G0.lamps.push({ p: [0, y, z], flap: [w[0], 0, 0, w[3]], col: [...vec3col('#ffe0b0', 0.3).toArray(), 0.16], power: 0.3 });
  }
  return G0;
}

// a block's choir on the wing: singers in a loose ball, heads in, their lamps held toward the middle
function choirGroup(n, stroke) {
  const G0 = new Group(), rng = makeRng('choir');
  for (let k = 0; k < n; k++) {
    const y = 1 - (2 * (k + 0.5)) / n, rr = Math.sqrt(1 - y * y), a = k * 2.39996;
    const d = new Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), d.clone().negate());
    q.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), rng.f(0, 6.28)));
    const m = new Matrix4().compose(d.clone().multiplyScalar(rng.f(2.7, 3.3)), q, new Vector3(1, 1, 1).multiplyScalar(rng.chance(0.2) ? 0.66 : rng.f(0.95, 1.05)));
    addFlyer(G0, { reach: true, side: rng.sign() }, m, stroke, rng.f(0, 6.28), 1.1);
  }
  return G0;
}

const STROKE = 0.2;
// every kind of group, near (hi) and far (lo)
function* timed(gen, box) { for (;;) { const a = performance.now(), r = gen.next(); box.t += performance.now() - a; if (r.done) return r.value; yield r.value; } }
function* makeGroups() {
  const T = {}, I = new Matrix4();
  const one = (o, s = 1, st = STROKE) => { const G0 = new Group(); addFlyer(G0, o, place(0, 0, 0, 0, 0, 0, s), st, 0); return G0; };
  for (const lod of [false, true]) {
    const k = lod ? 'L' : '';
    T['solo' + k] = one({ lod });
    T['reach' + k] = one({ lod, reach: true, side: -1 });
    T['child' + k] = one({ lod, lamp: 'chest' }, 0.62, STROKE * 1.3);
    // two grown-ups on a loose line
    const pr = new Group();
    addFlyer(pr, { lod, reach: true, side: -1 }, place(-1.15, 0, 0), STROKE, 0);
    addFlyer(pr, { lod }, place(1.2, 0.15, -0.4, 0, 0, 0.2), STROKE, 1.3);
    if (!lod) rope(pr, [-0.96, 0, -0.3], [1.01, 0.15, -0.7]);
    T['pair' + k] = pr;
    // a child on a line between two grown-ups
    const fm = new Group();
    addFlyer(fm, { lod, side: -1 }, place(-1.75, 0, 0), STROKE, 0);
    addFlyer(fm, { lod, reach: true }, place(1.75, 0.12, 0.25, 0, 0, -0.15), STROKE, 0.9);
    addFlyer(fm, { lod, lamp: 'chest' }, place(0, 0.3, -0.45, 0, 0, 0, 0.62), STROKE * 1.3, 2.1);
    if (!lod) { rope(fm, [-1.56, 0, -0.3], [-0.1, 0.3, -0.62]); rope(fm, [1.56, 0.12, -0.05], [0.1, 0.3, -0.62]); }
    T['family' + k] = fm;
    yield 'flight: groups';
    // a warden: dark clothes, dark red sleeves, a red lamp on a short pole
    const wd = new Group();
    addFlyer(wd, { lod, reach: true, lamp: 'pole', fixed: { cloth: '#2e2a30', sleeve: '#6e2024', trou: '#26252a' } }, I.clone(), STROKE * 0.5, 0);
    T['warden' + k] = wd;
  }
  // an elder in a blanket, towed on a line
  const tw = new Group();
  addFlyer(tw, { reach: true }, place(0, 0, 0), STROKE, 0);
  addFlyer(tw, { fold: true, white: true }, place(0.25, 0.15, -3.3, 0, 0, 0.6), 0, 0, 0.8);
  rope(tw, [0.1, -0.02, -1.42], [0.36, 0.02, -3.38]);
  T.tow = tw;
  yield 'flight: groups';
  // somebody playing a flute as they go, on their back
  T.flute = one({ flute: true, lamp: 'chest' }, 1, 0);
  T.flute.P.forEach((_, i, a) => { if (i % 3 !== 2) a[i] = -a[i]; });       // turned over: back to the land
  T.flute.N.forEach((_, i, a) => { if (i % 3 !== 2) a[i] = -a[i]; });
  for (const l of T.flute.lamps) { l.p[0] = -l.p[0]; l.p[1] = -l.p[1]; }
  yield 'flight: groups';
  T.banner = bannerGroup(['#8a4f6a', '#f1e2c4', '#e3925f'], STROKE);
  T.banner2 = bannerGroup(['#2f6f78', '#efe2c6', '#d9a23c'], STROKE);
  yield 'flight: groups';
  T.choir = choirGroup(16, STROKE * 0.35);
  yield 'flight: groups';
  for (const g of Object.values(T)) { g.build(); yield 'flight: groups'; }
  return T;
}

// ---------------------------------------------------------------- drawing the groups
// items: { p:[x,y,z] at t = 0, v:[vx,vy,vz, stop], q: Quaternion, s:[seed, scale, stroke rate, sway] }
function instAttrs(g, items, pick = (it) => it) {
  const n = items.length, P = new Float32Array(n * 3), V = new Float32Array(n * 4), Q = new Float32Array(n * 4), S = new Float32Array(n * 4);
  items.forEach((x, i) => { const it = pick(x); P.set(it.p, i * 3); V.set(it.v, i * 4); Q[i * 4] = it.q.x; Q[i * 4 + 1] = it.q.y; Q[i * 4 + 2] = it.q.z; Q[i * 4 + 3] = it.q.w; S.set(it.s, i * 4); });
  g.setAttribute('iP', new InstancedBufferAttribute(P, 3)); g.setAttribute('iV', new InstancedBufferAttribute(V, 4));
  g.setAttribute('iQ', new InstancedBufferAttribute(Q, 4)); g.setAttribute('iS', new InstancedBufferAttribute(S, 4));
  g.instanceCount = n;
  g.boundingSphere = new Sphere(new Vector3(0, 0, L / 2), L);
}
function groupMesh(group, items, mat) {
  const g = new InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'aCol', 'aEmit', 'aLamp', 'aFlap', 'aMem']) g.setAttribute(k, group.geo.getAttribute(k));
  instAttrs(g, items);
  const m = new Mesh(g, mat); m.frustumCulled = false;
  return m;
}
// every lamp of every group drawn, in one call
function lampMesh(entries, mat) {
  const g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  instAttrs(g, entries, (e) => e.it);
  const n = entries.length, LP = new Float32Array(n * 3), LF = new Float32Array(n * 4), LC = new Float32Array(n * 4);
  entries.forEach((e, i) => { LP.set(e.l.p, i * 3); LF.set(e.l.flap, i * 4); LC.set(e.l.col, i * 4); });
  g.setAttribute('lPos', new InstancedBufferAttribute(LP, 3)); g.setAttribute('lFlap', new InstancedBufferAttribute(LF, 4)); g.setAttribute('lCol', new InstancedBufferAttribute(LC, 4));
  const m = new Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 10;
  return m;
}
const pal = (list) => list.map((c) => vec3col(c));
const CLOTHS = ['#c9563c', '#d98c2b', '#e2c14a', '#6f9a3e', '#3f8a7a', '#3a6ea5', '#5b4b9a', '#a34b86', '#d7d2c4', '#8a4f6a', '#e3925f', '#fff1d0', '#3d2a3f', '#b5553f', '#e7e1d3', '#4f6f8f'];
const SLEEVES = ['#e8563a', '#f2c14e', '#3fa7a0', '#4d7fc4', '#fbfdff', '#e98a3c', '#a34b86', '#d6dde6', '#7fc4d9', '#f08aa0', '#8a4f6a', '#e3925f'];
const HAIR = ['#2a1d16', '#4a3020', '#6b4a2e', '#a07848', '#1c1a1a', '#bdb6aa'];
const TROU = ['#2f3b45', '#3a3f48', '#4a3f38', '#5a5248', '#2a2a30', '#6a5a4a', '#3d2a3f', '#44505a'];
const TINTS = ['#ffd49a', '#ffc27a', '#ffe4b8', '#ffb070', '#ffdcae', '#dfe9ff'];

// ---------------------------------------------------------------- the nets of the back flying hall
const NET_VERT = /* glsl */`
attribute vec2 aM;
varying vec3 vW; varying vec2 vM; varying vec3 vN;
void main() { vW = position; vM = aM; vN = normal; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const netFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform float uCell, uRope, uOpacity; uniform vec3 uCol, uWarm;
varying vec3 vW; varying vec2 vM; varying vec3 vN;
${rig.glsl}
float kLines(float t, float w, float p) {
  p = max(p, 1e-4);
  float a = t - 0.5 * p + 0.5 * w, b = t + 0.5 * p + 0.5 * w;
  return clamp(((floor(b) * w + min(fract(b), w)) - (floor(a) * w + min(fract(a), w))) / p, 0.0, 1.0);
}
void main() {
  ${CLIP_FRAG}
  vec2 d = vec2(vM.x + vM.y, vM.x - vM.y) / uCell; vec2 pw = fwidth(d);
  float w = uRope / uCell, a = 1.0 - (1.0 - kLines(d.x, w, pw.x)) * (1.0 - kLines(d.y, w, pw.y));
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  a = 1.0 - pow(max(1.0 - a * uOpacity, 0.0), 1.0 / max(abs(dot(N, V)), 0.08));
  vec3 Lg = (kLight(vW, N, vW, N) + kLight(vW, -N, vW, -N)) * 0.5 + uWarm;
  gl_FragColor = vec4(kAir(uCol * Lg, vW), a);
}`;
// a surface of revolution about the axis: rings of (r, z) from a profile, its net coordinates in metres
function netMesh(rig, prof, nA, opts) {
  const pos = [], nrm = [], m = [], idx = [];
  let s = 0;
  for (let j = 0; j < prof.length; j++) {
    const [r, z] = prof[j];
    if (j) s += Math.hypot(r - prof[j - 1][0], z - prof[j - 1][1]);
    const [r0, z0] = prof[Math.max(0, j - 1)], [r1, z1] = prof[Math.min(prof.length - 1, j + 1)];
    const tr = r1 - r0, tz = z1 - z0, tl = Math.hypot(tr, tz) || 1;
    for (let i = 0; i <= nA; i++) {
      const a = (i / nA) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      pos.push(r * c, r * sn, z); nrm.push(c * (tz / tl), sn * (tz / tl), -tr / tl); m.push(a * 75, s);
    }
  }
  for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < nA; i++) { const a = j * (nA + 1) + i, b = a + 1, c = a + nA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new Float32BufferAttribute(nrm, 3)); g.setAttribute('aM', new Float32BufferAttribute(m, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  const mat = new ShaderMaterial({
    uniforms: { ...rig.uniforms, uClip: G.uClip, uCell: { value: opts.cell || 0.5 }, uRope: { value: opts.rope || 0.05 }, uOpacity: { value: opts.opacity || 0.85 }, uCol: { value: vec3col(opts.color || '#e9e2d4') }, uWarm: { value: vec3col('#ffb878', opts.warm || 0.05) } },
    vertexShader: NET_VERT, fragmentShader: netFrag(rig), side: DoubleSide, transparent: true, depthWrite: false,
  });
  const mesh = new Mesh(g, mat); mesh.renderOrder = 4;
  return mesh;
}

// ---------------------------------------------------------------- the world
export const chervilFlight = {
  id: 'chervil-flight',
  title: 'The Long Flight', drum: 'Chervil', row: 'Herb Row', kind: 'an open hall drum', light: 0.0,
  line: 'Booking night. The sunline stays dark and everyone goes up with their block. Almost four kilometres of small lights, like a slow river, and somewhere in it a choir.',
  tone: '#ffcf8a', source: 'open-drums.md (The calendar; Booking Day in Chervil; Method), sorrel.md (Open questions), wander-year.md (Day 60)',
  sound: { root: 45, scale: 'dorian', pad: 0.3, air: 0.35, hum: 0.04, water: 0, crowd: 0.05, choir: 0.75, bells: 0, bright: 0.22 },
  *build(ctx) {
    const prof = {}; let mark = performance.now();
    const Y = function* (label) { prof[label] = (prof[label] || 0) + performance.now() - mark; yield label; mark = performance.now(); };
    const plan = new Plan(ctx.q.plan);
    yield* Y('flight: canvas');
    paintChervil(plan);
    yield* Y('flight: plan');
    const NIGHT = { sun: '#000000', sunPower: 0, amb: '#1c2c52', ambPower: 2.0, ground: '#ffb468', groundPower: 0.25, air: '#2a3a5a', airDensity: 0.00005, bouncePower: 0 };
    const wall = { lit: 0.32, crowd: 0.35, houseMix: 0.6, winPower: 2.0, winA: '#ffab58', winB: '#ffdca8' };
    const kit = { t: 0 }, b0 = performance.now();
    const hollow = yield* timed(buildHollow(ctx, {
      seed: 'chervil', plan, light: NIGHT, sunline: { power: 0 },
      ground: { lamp: 1, lampColor: '#ffbe76', people: 0.5, sunRod: 0 },
      front: { ...wall, tiers: { 29: { crowd: 1, lit: 0.3 }, 28: { crowd: 0.9 }, 9: { crowd: 0.9, lit: 0.2 } } },
      back: { ...wall, lit: 0.2, winPower: 1.5, crowd: 0.6, tiers: { 9: { crowd: 1, lit: 0.3 }, 14: { crowd: 0.9 }, 29: { crowd: 1, lit: 0.3 } } },
    }), kit);
    mark = performance.now();
    yield* Y('flight: hollow');
    const scene = new Scene();
    scene.add(hollow.group);
    const rig = hollow.rig, dens = ctx.density;
    let t0 = performance.now();

    // ---- the flight, in the drum's own space: GA is the angle of the gate the block goes up from
    const GA = 160;
    const K = (t, deg, r, z, roll, look) => ({ t, p: cyl(GA + deg, r, z), up: inward(GA + deg + roll), ...(look ? { look: cyl(GA + look[0], look[1], look[2]) } : {}) });
    const path = makePath([
      K(0, 0, 72, 1.6, 0),
      K(6, 2, 70, 13, 4, [24, 66, 34]),
      K(12, 4, 64, 22, 20, [12, 48, 90]),
      K(19, 9, 58.5, 34, 40, [49, 50, 52]),
      K(25, 14, 50, 95, 70, [20, 32, 330]),
      K(31, 22, 44, 330, 100, [25, 15, 1500]),
      K(38, 30, 62, 950, 125, [34, 1500, 1500]),
      K(45, 38, 67, 1950, 150, [40, 30, 3700]),
      K(52, 44, 60, 3080, 175, [46, 50, 3650]),
      K(58, 47, 56, 3460, 190, [49, 58, 3650]),
      K(64, 48, 58, 3584, 200),
    ], { entryRadius: 2, exitRadius: 10 });
    const DUR = path.duration, DT = 0.1, NS = Math.floor(DUR / DT) + 1;
    const TX = new Float32Array(NS), TY = new Float32Array(NS), TZ = new Float32Array(NS), SPD = new Float32Array(NS);
    const pose = { pos: new Vector3(), quat: new Quaternion(), fov: 58, vel: new Vector3() };
    for (let i = 0; i < NS; i++) { path.sample(i * DT, pose); TX[i] = pose.pos.x; TY[i] = pose.pos.y; TZ[i] = pose.pos.z; SPD[i] = pose.vel.length(); }
    // how wide a tube round the flight is filled with real flyers: wide while the camera drifts with them, narrow at speed
    const tubeR = (t) => (t < 15 ? 30 : t < 27 ? 30 - 21 * smoothstep(15, 27, t) : t < 50 ? 9 : 9 + 15 * smoothstep(50, 58, t));
    // the camera's frame at a moment: right, up, ahead
    const frameAt = (t) => { path.sample(t, pose); const q = pose.quat; return { p: pose.pos.clone(), R: new Vector3(1, 0, 0).applyQuaternion(q), U: new Vector3(0, 1, 0).applyQuaternion(q), F: new Vector3(0, 0, -1).applyQuaternion(q), v: pose.vel.clone() }; };
    // closest approach of a thing at p0 moving at v (stopping at v[3]) to the camera, over samples i0..i1: [distance, time]
    const camDist = (p0, v, i0 = 0, i1 = NS - 1) => {
      let best = 1e9, bt = 0, px = 0, py = 0, pz = 0;
      for (let i = Math.max(0, i0); i <= Math.min(NS - 1, i1); i++) {
        const t = Math.min(i * DT, v[3]);
        const dx = p0[0] + v[0] * t - TX[i], dy = p0[1] + v[1] * t - TY[i], dz = p0[2] + v[2] * t - TZ[i];
        let d2 = dx * dx + dy * dy + dz * dz;
        if (i > i0) {
          const ex = dx - px, ey = dy - py, ez = dz - pz, l2 = ex * ex + ey * ey + ez * ez;
          if (l2 > 1e-9) { let u = -(px * ex + py * ey + pz * ez) / l2; u = u < 0 ? 0 : u > 1 ? 1 : u; const qx = px + ex * u, qy = py + ey * u, qz = pz + ez * u; d2 = Math.min(d2, qx * qx + qy * qy + qz * qz); }
        }
        if (d2 < best) { best = d2; bt = i * DT; }
        px = dx; py = dy; pz = dz;
      }
      return [Math.sqrt(best), bt];
    };
    // the same, but only where it could come within lim (a function of time): a coarse pass every half second first
    const SPW = new Float32Array(NS);
    for (let i = 0; i < NS; i++) { let m = 0; for (let j = Math.max(0, i - 5); j <= Math.min(NS - 1, i + 5); j++) m = Math.max(m, SPD[j]); SPW[i] = m; }
    const camNear = (p0, v, lim) => {
      let best = 1e9, bt = 0;
      for (let i = 0; i < NS; i += 5) {
        const t = Math.min(i * DT, v[3]), dx = p0[0] + v[0] * t - TX[i], dy = p0[1] + v[1] * t - TY[i], dz = p0[2] + v[2] * t - TZ[i];
        if (dx * dx + dy * dy + dz * dz < (lim(i * DT) + (SPW[i] + 4) * 0.5 + 0.5) ** 2) { const r = camDist(p0, v, i - 5, i + 5); if (r[0] < best) { best = r[0]; bt = r[1]; } }
      }
      return [best, bt];
    };
    // where flyers may be: inside the edge, off the hub cones and the cable, short of the landing net, over the gate terrace
    const roomFor = (x, y, z, rad) => { const r = Math.hypot(x, y); return z > 0.8 + rad && r < 73.8 - rad && r > hubR(z) + 1.4 + rad && z < netZ(r) - 0.2 - rad * 0.5; };
    const validMove = (p0, v, rad) => { for (let t = 0; t <= DUR + 0.01; t += 4) { const tt = Math.min(t, v[3]); if (!roomFor(p0[0] + v[0] * tt, p0[1] + v[1] * tt, p0[2] + v[2] * tt, rad)) return false; } return true; };
    // how thick the river is at a radius (a flyer to every 100 m3 on average)
    const thick = (r) => smoothstep(3.5, 8, r) * (1.25 - 0.85 * smoothstep(42, 72, r)) * (r < 74 ? 1 : 0);
    // the front of the river: the first flyers come down into the landing net during the minute
    const lead = (x, y, r) => netZ(r) - 105 - 35 * (0.5 + 0.5 * Math.sin(Math.atan2(y, x) * 3 + 1.3)) - r * 0.4;
    yield* Y('flight: path');

    // ---- the people near the flight: groups on the flight's own clock
    const grp = { t: 0 };
    const T = yield* timed(makeGroups(), grp);
    prof['flight: groups'] = grp.t; mark = performance.now();
    yield* Y('flight: groups');
    const rng = makeRng('long-flight');
    const items = {}, lampEntries = [], placed = new Map(), CELL = 8;
    const at = (it, t) => { const tt = Math.min(t, it.v[3]); return [it.p[0] + it.v[0] * tt, it.p[1] + it.v[1] * tt, it.p[2] + it.v[2] * tt]; };
    const keyN = (cx, cy, cz) => ((cx + 64) * 128 + (cy + 64)) * 4096 + (cz + 512);
    const keyOf = (x, y, z, t) => keyN(Math.floor(x / CELL), Math.floor(y / CELL), Math.floor((z - RIVER_V * t) / CELL));
    // is there room for a group of radius rad at time t among the groups already placed near there?
    const crowded = (X, t, rad) => {
      const cx = Math.floor(X[0] / CELL), cy = Math.floor(X[1] / CELL), cz = Math.floor((X[2] - RIVER_V * t) / CELL);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -2; c <= 2; c++) {
        const list = placed.get(keyN(cx + a, cy + b, cz + c)); if (!list) continue;
        for (const o of list) { const Y = at(o.it, t); if (Math.hypot(Y[0] - X[0], Y[1] - X[1], Y[2] - X[2]) < (o.rad + rad) * 0.75) return true; }
      }
      return false;
    };
    const put = (name, it, t, rad) => {
      (items[name] || (items[name] = [])).push(it);
      for (const l of T[name].lamps) lampEntries.push({ it, l });
      const X = at(it, t), k = keyOf(X[0], X[1], X[2], t);
      let list = placed.get(k); if (!list) placed.set(k, list = []); list.push({ it, rad });
    };
    // a turn that points a group's +z along dir with its back (+y) toward dorsal
    const qFor = (dir, dorsal) => {
      const z = dir.clone().normalize(), y = dorsal.clone().addScaledVector(z, -dorsal.dot(z));
      if (y.lengthSq() < 1e-6) y.set(z.z, 0, -z.x);
      y.normalize();
      return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3().crossVectors(y, z), y, z));
    };
    const randDir = () => { const z = rng.f(-1, 1), a = rng.f(0, 6.2832), s = Math.sqrt(1 - z * z); return new Vector3(Math.cos(a) * s, Math.sin(a) * s, z); };
    const sOf = (sway = 0.25) => [rng(), rng.f(0.93, 1.07), rng.f(0.8, 1.5), rng.f(0.6, 1.2) * sway];
    const stopAt = (p0, v) => { if (v[2] <= 0) return 1e5; const r = Math.hypot(p0[0], p0[1]), ts = (netZ(r) - 0.6 - p0[2]) / v[2]; return ts < DUR + 1 ? Math.max(ts, 0) : 1e5; };
    const EXIT = path.exit.pos;
    const exitClear = (it, rad) => { for (const t of [DUR - 3, DUR - 1.5, DUR - 0.8]) { const X = at(it, t); if (Math.hypot(X[0] - EXIT.x, X[1] - EXIT.y, X[2] - EXIT.z) < 12 + rad) return false; } return true; };

    // ---- first, the ones the camera is meant to meet, placed by where it will be
    const meet = (name, tk, right, up, ahead, o = {}) => {
      const f = frameAt(tk), v = o.v || new Vector3(0, 0, RIVER_V), rad = T[name].rad;
      let X, p, vv;
      // a little farther off each time it would come too near the lens at some other moment of the flight
      for (let k = 0; k < 10; k++, ahead += 1.2) {
        X = f.p.clone().addScaledVector(f.R, right).addScaledVector(f.U, up).addScaledVector(f.F, ahead);
        p = X.clone().addScaledVector(v, -tk);
        vv = [v.x, v.y, v.z, 0]; vv[3] = o.stop === undefined ? stopAt([p.x, p.y, p.z], vv) : o.stop;
        if (camDist([p.x, p.y, p.z], vv)[0] > 2.6 + rad * 0.6) break;
      }
      const dorsal = o.dorsal === 'right' ? f.R : o.dorsal === 'up' ? f.U : o.dorsal === 'away' ? f.F : o.dorsal || randDir();
      const dir = o.dir === 'back' ? f.F.clone().negate().add(randDir().multiplyScalar(0.25)) : o.dir || (v.lengthSq() > 0.01 ? v : new Vector3(0, 0, 1));
      const it = { p: [p.x, p.y, p.z], v: vv, q: qFor(dir, dorsal), s: sOf(o.sway) };
      put(name, it, tk, T[name].rad);
      return it;
    };
    meet('reach', 3.2, -1.1, -0.5, 4.4, { v: new Vector3(0.15, 0, 1.0), dir: 'back', dorsal: 'up', sway: 0.1 });       // turned back to see who is coming
    meet('pair', 8.6, 0.6, 0.7, 4.0, { v: new Vector3(0, 0, 2.2), dir: 'back', dorsal: 'up', sway: 0.1 });
    meet('child', 5.5, 1.2, 2.6, 6.5, { v: new Vector3(0.25, -0.1, 0.9), dorsal: 'right' });                  // just pushed off the terrace
    meet('family', 9.5, 3.4, -1.3, 4.2, { v: new Vector3(0, 0, 2.7), dorsal: 'right' });                        // a child on a line between two
    meet('flute', 14, -2.9, 1.3, 5.2, { v: new Vector3(0, 0, 2.7), dorsal: 'up' });
    meet('tow', 17.5, 3.0, -2.3, 7.0, { v: new Vector3(0, 0, 2.5), dorsal: 'right' });                          // an elder, towed
    meet('banner2', 20.5, 2.6, 3.0, 13, { v: new Vector3(0, 0, 2.6), dorsal: 'up', sway: 0.06 });               // the block's own banner
    meet('banner', 23.6, -4.2, -1.5, 16, { v: new Vector3(0, 0, 2.4), dorsal: 'up', sway: 0.06 });              // another block's, ahead
    meet('choir', 26.8, 6.5, 1.5, 14, { v: new Vector3(0, 0, 2.5), sway: 0.1 });                                 // its choir, singing
    yield* Y('flight: met');

    // ---- then the river round the flight: a tube about it, filled as the river carries flyers through it
    const KINDS = [['solo', 0.25], ['reach', 0.23], ['pair', 0.17], ['family', 0.12], ['child', 0.12], ['tow', 0.025]];
    const MEMBERS = { solo: 1, reach: 1, pair: 2, family: 3, child: 1, tow: 2 };
    let avg = 0; for (const [k, w] of KINDS) avg += w * MEMBERS[k];
    const LO = { solo: 'soloL', reach: 'reachL', pair: 'pairL', family: 'familyL', child: 'childL', tow: 'pairL' };
    const pickKind = () => { let u = rng() * 0.915; for (const [k, w] of KINDS) { if ((u -= w) < 0) return k; } return 'solo'; };
    const knot = frameAt(26.8), KNOT = knot.p.clone().addScaledVector(knot.F, 16).addScaledVector(knot.R, 1).sub(new Vector3(0, 0, RIVER_V * 26.8));
    const D0 = 0.01 * dens / avg;
    const e1 = new Vector3(), e2 = new Vector3(), A = new Vector3(), B = new Vector3(), Q = new Vector3();
    let acc = 0, near = 0, far = 0;
    const tryOne = (q, tu) => {
      const X = [q.x, q.y, q.z + RIVER_V * tu], r = Math.hypot(X[0], X[1]);
      if (rng() * 1.25 > thick(r) * (1 + 2.2 * Math.max(0, 1 - q.distanceTo(KNOT) / 17))) return;
      const gather = X[2] < 46 && tu < 24, back = !gather && r > 50 && X[2] > 160 && rng.chance(0.28);
      let v;
      if (gather) v = [rng.f(-0.35, 0.35), rng.f(-0.35, 0.35), rng.f(0.5, 2.4)];
      else if (back) v = [rng.gauss() * 0.05, rng.gauss() * 0.05, -rng.f(1.3, 1.9)];
      else v = [rng.gauss() * 0.06, rng.gauss() * 0.06, RIVER_V + rng.gauss() * 0.3];
      const p0 = [X[0] - v[0] * tu, X[1] - v[1] * tu, X[2] - v[2] * tu];
      if (!gather && !back && p0[2] > lead(p0[0], p0[1], Math.hypot(p0[0], p0[1]))) return;
      v.push(stopAt(p0, v));
      const kind = back ? (rng.chance(0.5) ? 'solo' : 'pair') : pickKind(), rad = T[kind].rad;
      if (!validMove(p0, v, rad * 0.6)) return;
      const [d, tm] = camNear(p0, v, () => 16);
      if (d < 2.4 + rad * 0.8 + (tm < 20 ? 1.4 : 0) + (tm < 3 ? 1.5 : 0)) return;
      const hi = d < 15 && SPD[Math.round(tm / DT)] < 45;
      const dir = gather ? new Vector3(v[0], v[1], v[2]).add(randDir().multiplyScalar(0.5)) : new Vector3(v[0], v[1], v[2]);
      const it = { p: p0, v, q: qFor(dir, randDir()), s: sOf(gather ? 0.5 : 0.25) };
      if (!exitClear(it, rad) || crowded(X, tu, rad)) return;
      put(hi ? kind : LO[kind], it, tu, rad);
      if (hi) near++; else far++;
    };
    for (let i = 0; i < NS - 1; i++) {
      const t = i * DT, R = tubeR(t);
      A.set(TX[i], TY[i], TZ[i] - RIVER_V * t); B.set(TX[i + 1], TY[i + 1], TZ[i + 1] - RIVER_V * (t + DT));
      const seg = A.distanceTo(B);
      let ball = 0;
      if (i === 0) ball = (4 / 3) * Math.PI * R * R * R;
      if (i === NS - 2) ball = (2 / 3) * Math.PI * R * R * R;
      acc += D0 * Math.PI * R * R * seg;
      if (seg > 1e-6) { Q.subVectors(B, A).normalize(); e1.set(Q.y, -Q.x, 0); if (e1.lengthSq() < 1e-6) e1.set(1, 0, 0); e1.normalize(); e2.crossVectors(Q, e1); }
      while (acc >= 1) {
        acc -= 1;
        const u = rng(), rr = R * Math.sqrt(rng()), a = rng.f(0, 6.2832);
        const q = A.clone().lerp(B, u).addScaledVector(e1, Math.cos(a) * rr).addScaledVector(e2, Math.sin(a) * rr);
        tryOne(q, t + u * DT);
      }
      for (let nb = Math.round(D0 * ball * (0.9 + 0.2 * rng())); nb > 0; nb--) {
        const d = randDir().multiplyScalar(R * Math.cbrt(rng()));
        tryOne((i === 0 ? A : B).clone().add(d), i === 0 ? 0 : t + DT);
        if (performance.now() - t0 > 5) { yield* Y('flight: river near'); t0 = performance.now(); }
      }
      if (performance.now() - t0 > 5) { yield* Y('flight: river near'); t0 = performance.now(); }
    }

    // samples of the flight that pass a given z: the camera only goes forward along the axis
    const ZMAX = new Float32Array(NS), ZMIN = new Float32Array(NS);
    for (let i = 0, m = -1e9; i < NS; i++) { m = Math.max(m, TZ[i]); ZMAX[i] = m; }
    for (let i = NS - 1, m = 1e9; i >= 0; i--) { m = Math.min(m, TZ[i]); ZMIN[i] = m; }
    const zRange = (z0, z1) => {
      let lo = 0, hi = NS - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (ZMAX[mid] < z0) lo = mid + 1; else hi = mid; }
      const i0 = lo; lo = 0; hi = NS - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ZMIN[mid] > z1) hi = mid - 1; else lo = mid; }
      return [i0, lo];
    };

    // ---- wardens holding the edge in rings every 40 m: red lamps far off, real wardens where the flight passes
    const red = [], wr = makeRng('wardens');
    for (let z = 320; z < L - 310; z += 40) {
      const a0 = wr.f(0, 360);
      for (let k = 0; k < 16; k++) {
        const deg = a0 + k * 22.5 + wr.f(-4, 4), zz = z + wr.f(-6, 6), p = cyl(deg, 73.6, zz), v = [0, 0, 0, 1e5];
        const [i0, i1] = zRange(zz - 60, zz + 60);
        const [d, tm] = i1 >= i0 ? camDist(p, v, i0, i1) : [1e9, 0];
        if (d < tubeR(tm) + 4 && d > 4.5) {
          const sp = new Vector3(-Math.sin(deg * DEG), Math.cos(deg * DEG), 0), out = new Vector3(Math.cos(deg * DEG), Math.sin(deg * DEG), 0);
          const it = { p, v, q: qFor(sp.multiplyScalar(wr.sign()).add(new Vector3(0, 0, wr.f(-0.4, 0.4))), out), s: sOf(0.15) };
          put(d < 22 && SPD[Math.round(tm / DT)] < 160 ? 'warden' : 'wardenL', it, tm, 1.6);
        } else if (d >= tubeR(tm) + 4) red.push(p);
      }
    }
    yield* Y('flight: wardens');

    // ---- the back flying hall: the landing net, the net crew, and the first flyers coming down into it
    const nets = netMesh(rig, (() => { const a = []; for (let r = NET_IN; r <= SPIN + 0.01; r += 3) a.push([r, netZ(r)]); return a; })(), 200, { cell: 1.1, rope: 0.16, opacity: 0.92, warm: 0.35 });
    const sock = netMesh(rig, [[SPIN + 0.3, L - 300], [SPIN + 0.3, L - 200], [SPIN + 0.3, L - 100], [SPIN + 0.3, L - 11]], 240, { cell: 0.7, rope: 0.06, opacity: 0.75, warm: 0.04 });
    scene.add(nets, sock);
    // the back hub face behind the net, padded and dark, so the landing net and the people in it stand out against it
    const pad = new Geo();
    for (let i = 0; i < 96; i++) {
      const a0 = (i / 96) * Math.PI * 2, a1 = ((i + 1) / 96) * Math.PI * 2, c = i % 2 ? '#34323a' : '#2e2c33';
      for (const [r0, r1] of [[45, 60], [60, 75.2]]) pad.quad([r0 * Math.cos(a1), r0 * Math.sin(a1), L - 0.3], [r1 * Math.cos(a1), r1 * Math.sin(a1), L - 0.3], [r1 * Math.cos(a0), r1 * Math.sin(a0), L - 0.3], [r0 * Math.cos(a0), r0 * Math.sin(a0), L - 0.3], c);
      // and the front one, behind the gate, the same
      for (const [r0, r1] of [[45, 60], [60, 74.9]]) pad.quad([r0 * Math.cos(a0), r0 * Math.sin(a0), 0.04], [r1 * Math.cos(a0), r1 * Math.sin(a0), 0.04], [r1 * Math.cos(a1), r1 * Math.sin(a1), 0.04], [r0 * Math.cos(a1), r0 * Math.sin(a1), 0.04], c);
    }
    scene.add(pad.mesh(hollow.plain));
    const rimLamps = [];
    for (let i = 0; i < 240; i++) { const a = (i / 240) * 360; rimLamps.push({ p: cyl(a, 74.4, netZ(74.4) - 0.3), color: '#ffd9a0', power: 5, size: 0.35 }); }
    const nr = makeRng('net');
    const fe = frameAt(DUR - 2);
    for (let n = 0, tries = 0; n < 46 * Math.min(1, dens + 0.2) && tries < 600; tries++) {
      // the net crew and those already down, lying on the net, backs to the river, some working out toward the rim
      const deg = GA + 48 + nr.f(-26, 26), r = nr.f(18, 72), crawl = nr.chance(0.4) ? nr.f(0.2, 0.45) : 0;
      const z = netZ(r) - 0.45, dzdr = (netZ(r + 0.5) - netZ(r - 0.5)), out = new Vector3(Math.cos(deg * DEG), Math.sin(deg * DEG), 0);
      const p = cyl(deg, r, z), v = [out.x * crawl, out.y * crawl, dzdr * crawl, 1e5];
      if (r + crawl * DUR > 72.5) continue;
      if (camDist(p, v, NS - 160, NS - 1)[0] < 6) continue;
      const it = { p, v, q: qFor(out.clone().applyAxisAngle(new Vector3(0, 0, 1), nr.f(-0.8, 0.8)).add(new Vector3(0, 0, dzdr)), new Vector3(0, 0, -1)), s: [nr(), nr.f(0.93, 1.07), nr.f(0.5, 1.1), 0.08] };
      if (crowded(p, DUR, 1.3)) continue;
      put(nr.chance(0.3) ? 'reach' : 'solo', it, DUR, 1.3); n++;
    }
    for (let n = 0, tries = 0; n < 34 * Math.min(1, dens + 0.2) && tries < 800; tries++) {
      // and the first of the river, arriving: each stops where it meets the net
      const deg = GA + 48 + nr.f(-20, 20), r = nr.f(16, 70), ts = nr.f(46, DUR - 1), vz = nr.f(1.8, 2.8);
      const N = cyl(deg, r, netZ(r) - 0.6), p = [N[0], N[1], N[2] - vz * ts], v = [0, 0, vz, ts];
      const kind = nr.pick(['solo', 'reach', 'pair', 'family', 'child']), rad = T[kind].rad;
      if (!validMove(p, v, rad * 0.6) || camDist(p, v)[0] < 3 + rad || crowded(N, ts, rad)) continue;
      const it = { p, v, q: qFor(new Vector3(0, 0, 1), randDir()), s: sOf(0.2) };
      if (!exitClear(it, rad)) continue;
      put(kind, it, ts, rad); n++;
    }
    yield* Y('flight: nets');

    // ---- the far river: lights only, a point each, made up on the graphics card from four random numbers apiece by the
    // same rules as the flyers (thickest mid-river, a front short of the landing net, stopping when they reach it), and
    // faded out inside the tube round the camera, where the flyers and their lamps are real
    const NL = Math.round(150000 * dens), RR = new Float32Array(NL * 3), RW = new Float32Array(NL);
    let hs = 0x2545f491;
    const hrand = () => { hs ^= hs << 13; hs ^= hs >>> 17; hs ^= hs << 5; return (hs >>> 0) / 4294967296; };
    for (let i = 0; i < NL * 3; i++) { RR[i] = hrand(); if ((i & 16383) === 0 && performance.now() - t0 > 5) { yield* Y('flight: river far'); t0 = performance.now(); } }
    for (let i = 0; i < NL; i++) RW[i] = hrand();
    // the radius out from the cable of each thirty-second part of the river's lamps
    const cum = []; let tot = 0;
    for (let i = 0; i <= 300; i++) { const r = (i / 300) * SPIN; tot += r * thick(r); cum.push(tot); }
    const cdf = [];
    for (let q = 0, i = 0; q <= 32; q++) { const want = (q / 32) * tot; while (i < 300 && cum[i] < want) i++; cdf.push((i / 300) * SPIN); }
    const rg = new BufferGeometry();
    rg.setAttribute('position', new Float32BufferAttribute(RR, 3)); rg.setAttribute('aW', new Float32BufferAttribute(RW, 1));
    rg.boundingSphere = new Sphere(new Vector3(0, 0, L / 2), L);
    const uFlight = { value: 0 }, uTube = { value: tubeR(0) + 1 };
    const riverMat = new ShaderMaterial({
      uniforms: { uClip: G.uClip, uTime: G.uTime, uFlight, uTube, uPx: G.uPx, uMinPx: { value: 1.0 }, uMaxPx: { value: 40 }, uRep: { value: 3.2 }, uSoft: { value: 1.7 }, uCdf: { value: cdf }, uTints: { value: pal(TINTS) } },
      vertexShader: RIVER_GPU_VERT, fragmentShader: RIVER_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const river = new Points(rg, riverMat); river.frustumCulled = false; river.renderOrder = 10;
    scene.add(river);
    // the wardens' red lamps, far off
    const RP = new Float32Array(red.length * 3), RV = new Float32Array(red.length * 4), RC = new Float32Array(red.length * 4), rc = vec3col('#ff3a26', 12);
    red.forEach((p, i) => { RP.set(p, i * 3); RV.set([0, 0, 0, 1e5], i * 4); RC.set([rc.x, rc.y, rc.z, 0.5], i * 4); });
    const wg = new BufferGeometry();
    wg.setAttribute('position', new Float32BufferAttribute(RP, 3)); wg.setAttribute('aV', new Float32BufferAttribute(RV, 4)); wg.setAttribute('aC', new Float32BufferAttribute(RC, 4));
    wg.boundingSphere = new Sphere(new Vector3(0, 0, L / 2), L);
    const redMat = new ShaderMaterial({
      uniforms: { uClip: G.uClip, uTime: G.uTime, uFlight, uPx: G.uPx, uMinPx: { value: 1.0 }, uMaxPx: { value: 40 }, uRep: { value: 2.0 }, uSoft: { value: 1.7 } },
      vertexShader: RIVER_VERT, fragmentShader: RIVER_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const reds = new Points(wg, redMat); reds.frustumCulled = false; reds.renderOrder = 10;
    scene.add(reds);
    yield* Y('flight: river far');

    scene.add(glowPoints(rimLamps, { minPx: 1.2, maxPx: 30, soft: 1.8 }));

    // ---- the gate: the front wall's top terrace, a ring 11 m wide at the Spindle's edge. Its x runs round it in true
    // metres from the gate's angle, y is height off its floor (toward the axis), z = 0 at the rail and -11 at the hub face
    const ter = hollow.terrace(0, 29, GA);
    ter.setGlow('#ffb070', 0.55);
    let gate = new Geo({ maxSeg: 3 });
    gate.box(-60, 1.0, 0.12, 60, 1.08, 0.3, '#d8ccb4');                                   // the rail
    gate.box(-60, 0, 0.16, 60, 0.12, 0.28, '#b9ad96');
    for (let x = -60; x <= 60; x += 2.4) gate.box(x - 0.035, 0.12, 0.19, x + 0.035, 1.0, 0.25, '#9c917e');
    const tLamps = [];
    for (let x = -58; x <= 60; x += 9) { gate.cyl(x, 0, 0.9, 0.06, 0.045, 2.6, 5, '#3c3b3a'); gate.cyl(x, 2.55, 0.9, 0.16, 0.12, 0.26, 6, '#fff0c8', { emit: 3 }); tLamps.push({ p: [x, 2.7, 0.9], color: '#ffc983', power: 6, size: 0.8 }); }
    ter.add(gate.mesh(ter.lit, ter.frame));
    yield* Y('flight: gate');
    // the counter where sleeves are hired, and the board of them behind it
    gate = new Geo({ maxSeg: 3 });
    const SX0 = 6, SX1 = 38;
    gate.box(SX0, 0, -9.6, SX1, 1.05, -8.4, '#7a5a40', { top: '#d9c7a2' });
    gate.box(SX0, 0, -10.95, SX1, 4.4, -10.7, '#5a4a3e', { emit: 0.05 });
    for (let i = 0; i <= 16; i++) gate.box(SX0 - 0.6 + i * 2.05, 4.4, -10.95, SX0 + 0.4 + i * 2.05, 4.6, -9.6, i % 2 ? '#f1e2c4' : '#8a4f6a');
    for (let i = 0; i < 15; i++) for (let j = 0; j < 3; j++) {
      const x = SX0 + 0.6 + i * 2.1, y = 1.4 + j * 0.95, c = SLEEVES[(i * 5 + j * 3) % SLEEVES.length];
      gate.tri([x, y + 0.8, -10.65], [x + 0.18, y, -10.65], [x + 1.6, y + 0.72, -10.65], c);
    }
    for (let i = 0; i < 12; i++) { const x = SX0 + 1 + i * 2.7; gate.cyl(x, 1.05, -9.0, 0.05, 0.045, 0.13, 6, '#ffe2b0', { emit: 4 }); tLamps.push({ p: [x, 1.12, -9.0], color: '#ffd49a', power: 3, size: 0.25 }); }
    for (let i = 0; i < 16; i++) tLamps.push({ p: [SX0 + 1 + i * 2, 4.3, -10.4], color: '#ffe7c4', power: 4, size: 0.28 });
    ter.add(gate.mesh(ter.lit, ter.frame));
    yield* Y('flight: gate');
    ter.glow(tLamps, { minPx: 1.2, maxPx: 60, soft: 2.0 });
    // the block making ready on the terrace: a queue at the counter, people pulling sleeves on, children held by the hand
    const tr = makeRng('gate-crowd'), spots = [], hand = [];
    const camX = (t) => { path.sample(t, pose); const a = Math.atan2(pose.pos.y, pose.pos.x) / DEG - GA; return [a * DEG * 75, 75 - Math.hypot(pose.pos.x, pose.pos.y), pose.pos.z - 11]; };
    const camTrack = []; for (let t = 0; t < 14; t += 0.5) camTrack.push(camX(t));
    const clearOfCam = (x, z, h) => camTrack.every((c) => Math.hypot(c[0] - x, c[1] - h, c[2] - z) > 2.4);
    for (let i = 0; i < 26; i++) { const x = SX0 + 1 + i * 1.1 + tr.f(-0.2, 0.2), z = -7.6 + tr.f(-0.3, 0.3); spots.push({ p: [x, 0, z], yaw: tr.f(-0.5, 0.5) + Math.PI, child: tr.chance(0.15) }); }
    for (let i = 0; i < Math.round(170 * Math.min(1.2, dens + 0.2)); i++) {
      const x = tr.chance(0.7) ? tr.f(-30, 40) : tr.f(-75, 75), z = tr.f(-7.2, -0.8), child = tr.chance(0.22), sit = !child && tr.chance(0.15);
      if (!clearOfCam(x, z, child ? 1.1 : 1.6) || (x > -16 && x < 18 && tr.chance(0.55))) continue;
      spots.push({ p: [x, 0, z], walk: tr.chance(0.25) ? tr.f(0.5, 1.5) : 0, child, sit });
      if (tr.chance(0.45)) hand.push({ p: [x + tr.f(-0.3, 0.3), sit ? 0.5 : child ? 0.65 : 0.95, z + tr.f(-0.3, 0.3)], color: tr.pick(['#ffd49a', '#ffc27a', '#ffe4b8', '#ffb070']), power: tr.f(2.5, 4), size: 0.2, twinkle: 0.08 });
    }
    for (const m of crowd(spots, ter.walk, { frame: ter.frame, cell: 2000, bob: 0.35, speed: 0.5, seed: 'gate' })) ter.add(m);
    ter.glow(hand, { minPx: 1.2, maxPx: 50, soft: 2.0 });
    // some of the block already in their sleeves, standing with their lamps held up, and the first pushing off
    for (let i = 0, n = 0; i < 500 && n < 50 * Math.min(1.2, dens + 0.2); i++) {
      const x = tr.f(-16, 18), z = tr.f(-9.8, -0.6), kind = tr.chance(0.25) ? 'child' : tr.chance(0.55) ? 'reach' : 'solo';
      const lift = tr.chance(0.4) ? tr.f(0.4, 3.5) : 0, h = (kind === 'child' ? 0.9 : 1.42) + lift, a = GA * DEG + x / 75;
      const inn = new Vector3(-Math.cos(a), -Math.sin(a), 0), p = [(75 - h) * Math.cos(a), (75 - h) * Math.sin(a), 11 + z];
      const v = lift ? [inn.x * 0.3, inn.y * 0.3, tr.f(0.3, 0.9), 1e5] : [0, 0, 0, 1e5], rad = T[kind].rad;
      if (camDist(p, v, 0, 260)[0] < (lift ? 4.8 : 2.8) + rad * 0.8 || crowded(p, 0, rad)) continue;
      const it = { p, v, q: qFor(inn.clone().add(new Vector3(0, 0, lift ? 0.7 : tr.f(-0.15, 0.15))), new Vector3(0, 0, -1).applyAxisAngle(inn, tr.f(-1.3, 1.3))), s: [tr(), tr.f(0.93, 1.07), tr.f(0.4, 0.8), lift ? 0.15 : 0.04] };
      put(kind, it, 0, rad); n++;
    }
    yield* Y('flight: gate');

    // ---- draw them
    const flyMat = new ShaderMaterial({
      uniforms: {
        ...rig.uniforms, uClip: G.uClip, uTime: G.uTime, uFlight,
        uCloth: { value: pal(CLOTHS) }, uSleeve: { value: pal(SLEEVES) }, uSkin: { value: pal(SKIN) }, uHair: { value: pal(HAIR) }, uTrou: { value: pal(TROU) }, uTints: { value: pal(TINTS) },
        uFill: { value: vec3col('#ffb070', 0.035) }, uLampK: { value: 0.55 },
      },
      vertexShader: FLY_VERT, fragmentShader: flyFrag(rig), side: DoubleSide,
    });
    const lampMat = new ShaderMaterial({
      uniforms: { uClip: G.uClip, uTime: G.uTime, uFlight, uPx: G.uPx, uRes: G.uRes, uMinPx: { value: 1.2 }, uMaxPx: { value: 44 }, uSoft: { value: 1.8 }, uTints: { value: pal(TINTS) }, uGlow: { value: 3.0 } },
      vertexShader: LAMP_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    let figures = 0, ftris = 0;
    for (const [name, list] of Object.entries(items)) { scene.add(groupMesh(T[name], list, flyMat)); figures += list.length * T[name].mem; ftris += list.length * T[name].P.length / 9; }
    scene.add(lampMesh(lampEntries, lampMat));
    yield* Y('flight: drawn');
    if (typeof window !== 'undefined' && /debug/.test(window.location.search)) console.log(`[every-row] long flight: ${figures} flyers near (${near} groups near, ${far} far), ${lampEntries.length} hand lamps, ${NL} river lights, ${red.length} red lamps far, ${Math.round(ftris)} flyer triangles; the Hollow (kit) took ${Math.round(kit.t)} ms of work; mine: ${Object.entries(prof).map(([k, v]) => k.slice(8) + ' ' + Math.round(v)).join(', ')}`);

    const backLit = hollow.walls[1].material.uniforms.uLit;
    const look = { exposure: 1.5, bloom: 0.32, threshold: 0.6, saturation: 1.08, vignette: 0.5 };
    return {
      scene, path, hollow, near: 0.3, far: 9000, look,
      portal: { mist: '#ffcf8a' },
      update(t) { uFlight.value = t; uTube.value = tubeR(t) + 1; look.exposure = 1.5 - 0.3 * smoothstep(44, 58, t); backLit.value = 0.22 - 0.17 * smoothstep(40, 56, t); },
    };
  },
};
