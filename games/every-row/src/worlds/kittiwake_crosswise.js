// Kittiwake, Gull Row: crosswise lessons in the front flying hall, by day (docs/wander-year.md, Day 60, and Method,
// "Crosswise flight"; raft-habitat.md, "The sunline and the Spindle"; ashgrove.md, Day two, "The Spindle"; the
// Kittiwake entry in games/three-nights/src/15-canon.js: broth in bulbs at the gate, nine-year-old teachers, "big aunt").
// Inside the netted sock at the front end of the Spindle: within 75 m of the axis, from the end wall out to 300 m,
// netted off 150 m short of where the lit line begins. You weigh nothing. Flying along the axis is straight; across it,
// the drum turns under you. Every crosswise flyer here, and the camera itself, flies a straight line in the frame that
// does not turn (no forces), drawn as the turning drum sees it: a curve that bends about 23 m in 10 s at 4 m/s.
// The camera keeps its heading as the hall turns round it, and comes out at the hoop it aimed wide of.
//
// Not canon (the docs are silent): the gate's counter, sleeve board, canopy and shoe shelves on the top terrace by the
// front hub (shoes as the deposit is Sorrel's custom in sorrel.md, borrowed here); the padding and paint on the hub, the
// spar and the hub face; the stiff ribs that hold the sock open; the rings of padded hoops hung on lines to the net, and
// their colours; a class in matching sleeves following its teacher across, and another waiting at a low hoop; the
// Hollow's plan (falling lawns marked with rings, kite walks, greens where sleeve cloth is laid out, workshop sheds,
// hedged gardens, the lake's shape).
import {
  Scene, BufferGeometry, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, Mesh, ShaderMaterial,
  DoubleSide, Matrix4, Vector3, Sphere,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { G, CLIP_PARS, CLIP_FRAG, glowPoints, litMaterial, hollowRig } from '../kit/mats.js';
import { Geo, rgb } from '../kit/geo.js';
import { crowd, CLOTH, SKIN } from '../kit/folk.js';
import { DRUM } from '../kit/drum.js';
import { makeRng } from '../core/rng.js';

const W = DRUM.OMEGA;                 // the drum's turn, rad/s
const NET_R = 75, NET_Z0 = 11, NET_Z1 = 300;     // the sock: from the rail of the top terrace out to 300 m
const DEG = Math.PI / 180;
const cyl = (aDeg, r, z) => [r * Math.cos(aDeg * DEG), r * Math.sin(aDeg * DEG), z];
const inward = (aDeg) => [-Math.cos(aDeg * DEG), -Math.sin(aDeg * DEG), 0];
// the front hub: a cone from the hub face out along the spar (kit/hollow.js)
const HUB = [[46, 0], [40, 26], [22, 60], [9, 120], [4, 150]];
function hubR(z) {
  if (z < 0 || z > 150) return 1.4;
  for (let i = 0; i < HUB.length - 1; i++) if (z <= HUB[i + 1][1]) { const [r0, z0] = HUB[i], [r1, z1] = HUB[i + 1]; return r0 + (r1 - r0) * (z - z0) / (z1 - z0); }
  return 1.4;
}
// where a free flyer is, in the drum's frame, tau seconds after it was at p (drum frame) moving at u (drum frame)
function freeV(p, u) { return [u[0] - W * p[1], u[1] + W * p[0], u[2]]; }
function freeAt(p, V, tau, out = [0, 0, 0]) {
  const qx = p[0] + V[0] * tau, qy = p[1] + V[1] * tau, c = Math.cos(-W * tau), s = Math.sin(-W * tau);
  out[0] = c * qx - s * qy; out[1] = s * qx + c * qy; out[2] = p[2] + V[2] * tau;
  return out;
}

// ---------------------------------------------------------------- the Hollow's plan
// Shapes of one kind are gathered into one path and painted once: the canvas work is most of a Hollow's build.
const LX = 0.58 * C, LZ = 2050;
const LIGHT = { sun: '#f4f7ff', sunPower: 1.0, amb: '#b7c4d4', ambPower: 0.34, bounce: '#a9b49a', air: '#dde6ef', airDensity: 0.00006 };
export function* paintKittiwake(plan) {
  const rng = makeRng('kittiwake-plan');
  const many = (list, fn) => { const p = new Path2D(); for (const it of list) p.addPath(fn(it)); return p; };
  plan.fill(plan.band(0, L), { color: '#98ac8c', life: 0.3 });
  // patches of paler and darker lawn, a colour at a time (blurred patches cost a great deal of canvas time)
  const patchCols = ['#a7b89a', '#8ea284', '#b3bfa6', '#93a891', '#bcc4ae', '#9fae8c'], patches = patchCols.map(() => []);
  for (let i = 0; i < 300; i++) { const r = rng.f(90, 320); patches[i % 6].push(plan.blob(rng.f(0, C), rng.f(500, L - 500), r, r * rng.f(0.5, 1.1), { wobble: 0.3, lobes: 4, seed: i + 50, n: 16 })); }
  patches.forEach((list, k) => plan.fill(many(list, (b) => b), { color: patchCols[k], alpha: 0.32 }));
  // the Dim Ends
  plan.fill(plan.band(0, 690), { color: '#58725a', wood: 0.9, clear: ['life'] });
  plan.fill(plan.band(L - 690, L), { color: '#54705a', wood: 0.9, clear: ['life'] });
  yield;
  // the lake: long, lying along the axis
  const lake = plan.blob(LX, LZ, 330, 760, { wobble: 0.18, lobes: 6, seed: 21 });
  plan.stroke(lake, 40, { color: '#d6dde6', paved: 0.3, life: 0.9, clear: ['wood'] });
  plan.fill(lake, { color: '#7aa7b2', water: 1, clear: ['life', 'paved', 'wood'] });
  plan.fill(plan.blob(LX, LZ, 220, 600, { wobble: 0.2, lobes: 5, seed: 22 }), { color: '#3f7a8c', feather: 50 });
  // falling lawns, where children practise falling slowly: pale lawns marked with rings
  const lawns = [[0.08 * C, 1300], [0.2 * C, 2500], [0.36 * C, 1600], [0.83 * C, 2700], [0.94 * C, 1450], [0.46 * C, 900]];
  plan.fill(many(lawns, ([x, z]) => plan.ellipse(x, z, 250, 210)), { color: '#b7c8a0', life: 0.9, clear: ['wood'] });
  const rings = [];
  for (const [x, z] of lawns) for (let k = 0; k < 9; k++) { const cx = x + rng.f(-170, 170), cz = z + rng.f(-130, 130), r = rng.f(14, 28); rings.push([cx, cz, r], [cx, cz, r * 0.45]); }
  plan.stroke(many(rings, ([x, z, r]) => plan.ellipse(x, z, r, r)), 1.8, { color: '#f4f6f8' });
  yield;
  // kite walks: long straight tracks round the floor (kites are flown by walking)
  const kites = [[0.12 * C, 2050], [0.7 * C, 1050], [0.47 * C, 2900]];
  plan.fill(many(kites, ([x0, z0]) => plan.rect(x0 - 260, z0 - 130, x0 + 260, z0 + 130, 30)), { color: '#a6b892', life: 0.4, clear: ['wood'] });
  const tracks = [];
  for (const [x0, z0] of kites) for (let k = 0; k < 7; k++) tracks.push([[x0 - 250, z0 - 110 + k * 37], [x0 + 250, z0 - 110 + k * 37]]);
  plan.stroke(many(tracks, (t) => plan.line(t)), 3, { color: '#dfe2d8', paved: 0.4, life: 1 });
  // the greens where sleeve cloth is laid out: long strips in rows, the drum's colours from three kilometres off
  const cloth = ['#e8563a', '#f2c14e', '#3fa7a0', '#4d7fc4', '#fbfdff', '#a34b86', '#e98a3c', '#7fc4d9'];
  const greens = [];
  for (let i = 0; i < 14; i++) greens.push([((i * 0.0731 + 0.03 + (i % 3) * 0.21) % 1) * C, 820 + ((i * 523) % 2150), rng.f(160, 300), rng.chance(0.5)]);
  plan.fill(many(greens, ([x0, z0, w]) => plan.rect(x0 - 12, z0 - 12, x0 + w + 12, z0 + 362, 8)), { color: '#b4c2a6', life: 0.4, clear: ['wood'] });
  const strips = cloth.map(() => []);
  greens.forEach(([x0, z0, w, across], g) => {
    if (across) for (let i = 0; i < Math.floor(w / 11); i++) strips[(i * 3 + g) % cloth.length].push([x0 + i * 11, z0, x0 + i * 11 + 6, z0 + 350]);
    else for (let i = 0; i < 28; i++) strips[(i * 3 + g) % cloth.length].push([x0, z0 + i * 12.5, x0 + w, z0 + i * 12.5 + 6.5]);
  });
  strips.forEach((list, k) => plan.fill(many(list, ([a, b, c, d]) => plan.rect(a, b, c, d)), { color: cloth[k] }));
  yield;
  // workshop sheds: long pale roofs in yards, and small hedged gardens beside them
  const yards = [[0.31 * C, 2950], [0.66 * C, 800], [0.04 * C, 2250], [0.88 * C, 1850], [0.18 * C, 1000], [0.53 * C, 3010], [0.74 * C, 1500]];
  plan.fill(many(yards, ([x0, z0]) => plan.rect(x0 - 20, z0 - 20, x0 + 280, z0 + 210, 10)), { color: '#c9d0d6', paved: 0.9, life: 0.6, clear: ['wood'] });
  const roofs = [], ridges = [];
  for (const [x0, z0] of yards) for (let i = 0; i < 6; i++) { const zz = z0 + i * 31; roofs.push([x0, zz]); ridges.push([[x0, zz + 9], [x0 + 260, zz + 9]]); }
  plan.fill(many(roofs, ([x, z]) => plan.rect(x, z, x + 260, z + 19, 2)), { color: '#f6f8fb', clear: ['life'] });
  plan.stroke(many(ridges, (t) => plan.line(t)), 1.4, { color: '#8e9aa6' });
  for (const [x0, z0] of yards) plan.garden(x0 + 300, z0, x0 + 420, z0 + 120, ['#e7a7b8', '#f2d27a', '#c7d98f', '#b9a8dc', '#f4f6f8']);
  yield;
  // woods in clumps, painted a colour at a time
  const clumpCols = ['#7a9670', '#738f68', '#82a077', '#8aa57e'], clumps = clumpCols.map(() => []);
  for (let i = 0; i < 420; i++) {
    const x = rng.f(0, C), z = rng.f(720, L - 720), r = rng.f(12, 46);
    if (Math.abs(x - LX) < 430 && Math.abs(z - LZ) < 830) continue;
    clumps[i % 4].push(plan.blob(x, z, r, r * rng.f(0.6, 1.1), { wobble: 0.3, lobes: 4, seed: i + 1, n: 20 }));
  }
  clumps.forEach((list, k) => plan.fill(many(list, (p) => p), { color: clumpCols[k], wood: 0.85, clear: ['life', 'rows'] }));
  yield;
  // walks, and avenues along the long ones
  const ring = (z, wob) => { const a = []; for (let i = 0; i <= 120; i++) a.push([(i / 120) * C, z + Math.sin(i * 0.29 + z) * wob]); return a; };
  const walks = [], longs = [];
  for (let k = 0; k < 9; k++) walks.push(ring(760 + k * 280, 30));
  for (let i = 0; i < 16; i++) { const x = (i / 16) * C, w = [[x, 720], [x + 70, 1500], [x - 50, 2300], [x, L - 720]]; walks.push(w); longs.push(w); }
  plan.stroke(many(walks, (w) => plan.curve(w)), 6, { color: '#d3d9df', paved: 0.8, life: 0.8, clear: ['wood'] });
  const trees = [];
  for (const w of longs.filter((_, i) => i % 2 === 0)) for (let i = 0; i < w.length - 1; i++) {
    const [a, b] = [w[i], w[i + 1]], len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len * 9, nz = (b[0] - a[0]) / len * 9;
    for (let d = 0; d < len; d += 19) { const t = d / len, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; trees.push([x + nx, z + nz], [x - nx, z - nz]); }
  }
  plan.dots(trees, 4.2, { color: '#5f8257', wood: 1 });
}

// ---------------------------------------------------------------- a flyer in wing-sleeves: lying along +z, back up (+y)
// tint weight marks the part: 1 clothes, 0.6 sleeves, 0.3 skin, 0 fixed colour
function flyerGeo() {
  const g = new Geo();
  g.tint(1).box(-0.19, -0.1, -0.62, 0.19, 0.12, 0.14, '#ffffff');
  g.tint(0.3).blob(0, 0.03, 0.32, 0.13, 0, '#ffffff', { shadeBottom: 0.8 });
  g.tint(0).box(-0.17, -0.07, -1.45, -0.03, 0.07, -0.6, '#3a3f48').box(0.03, -0.07, -1.45, 0.17, 0.07, -0.6, '#3a3f48');
  // sleeves: fabric fins from wrist to hip, both faces
  g.tint(0.6);
  for (const s of [-1, 1]) {
    const sh = [0.2 * s, 0.02, 0.1], wr = [1.08 * s, 0.02, 0.32], hip = [0.2 * s, 0.0, -0.58], el = [0.62 * s, 0.02, 0.1];
    if (s > 0) { g.tri(sh, wr, el, '#ffffff'); g.tri(sh, el, hip, '#ffffff'); g.tri(el, wr, hip, '#ffffff'); g.tri(sh, el, wr, '#ffffff'); g.tri(sh, hip, el, '#ffffff'); g.tri(el, hip, wr, '#ffffff'); }
    else { g.tri(sh, el, wr, '#ffffff'); g.tri(sh, hip, el, '#ffffff'); g.tri(el, hip, wr, '#ffffff'); g.tri(sh, wr, el, '#ffffff'); g.tri(sh, el, hip, '#ffffff'); g.tri(el, wr, hip, '#ffffff'); }
  }
  g.tint(0.3).cube(1.12, 0.02, 0.34, 0.12, 0.08, 0.12, '#ffffff').cube(-1.12, 0.02, 0.34, 0.12, 0.08, 0.12, '#ffffff');
  g.tint(0);
  return g.build();
}

const FLY_VERT = /* glsl */`
attribute vec4 aCol; attribute float aEmit;
attribute vec3 aP0; attribute vec3 aV; attribute vec4 aLoop; attribute vec4 aHit; attribute vec3 aCloth; attribute vec3 aSleeve; attribute vec3 aSkin;
uniform float uTime, uFlight, uOmega;
varying vec3 vW; varying vec3 vN; varying vec3 vCol;
void main() {
  // aLoop: loop seconds (> 0 loops on the clock, 0 = scripted on the flight's own time, < 0 = hovering), phase or start time,
  //        1 if it flies free (a straight line in the frame the drum turns in) else 0, scale
  // aHit:  for loops, the second it reaches the net (it stays there); for scripted, the window it is seen in. flap rate, seed, roll rate
  float T = aLoop.x, tau = 0.0, show = 1.0, mode = aLoop.z;
  if (T > 0.0) { float u = fract(uTime / T + aLoop.y); tau = min(u * T, aHit.x); show = smoothstep(0.0, 0.035, u) * smoothstep(1.0, 0.965, u); }
  else if (T == 0.0) { tau = uFlight - aLoop.y; show = smoothstep(aHit.x, aHit.x + 1.5, tau) * smoothstep(aHit.y, aHit.y - 1.5, tau); }
  vec3 q = aP0 + aV * tau;
  float ang = -uOmega * tau * mode, c = cos(ang), s = sin(ang);
  vec3 pos = vec3(c * q.x - s * q.y, s * q.x + c * q.y, q.z);
  vec3 vI = vec3(c * aV.x - s * aV.y, s * aV.x + c * aV.y, aV.z);
  vec3 vel = vI - mode * uOmega * vec3(-pos.y, pos.x, 0.0);
  float sd0 = aHit.z * 17.0;
  if (T < 0.0) { pos += 0.3 * vec3(sin(uTime * 0.7 + sd0), cos(uTime * 0.6 + sd0 * 1.3), sin(uTime * 0.5 + sd0 * 0.7)); vel = aV; }
  vec3 f = normalize(vel + vec3(0.0, 0.0, 1e-4));
  vec3 o = vec3(pos.xy, 0.0);
  vec3 bk = -(o - f * dot(o, f));
  if (dot(bk, bk) < 1e-3) bk = cross(f, vec3(0.0, 1.0, 0.0));
  bk = normalize(bk);
  vec3 sd = cross(bk, f);
  float roll = aHit.w * tau + 0.22 * sin(uTime * 0.8 + sd0);
  float cr = cos(roll), sr = sin(roll);
  vec3 sd2 = sd * cr + bk * sr, bk2 = bk * cr - sd * sr;
  vec3 p = position;
  float flap = sin(uTime * aHit.y + sd0 * 3.0);
  p.y += flap * 0.5 * max(abs(p.x) - 0.25, 0.0);
  p *= aLoop.w * show;
  vec3 wpos = pos + sd2 * p.x + bk2 * p.y + f * p.z;
  vN = sd2 * normal.x + bk2 * normal.y + f * normal.z;
  float part = aCol.a;
  vec3 col = aCol.rgb;
  if (part > 0.8) col *= aCloth; else if (part > 0.45) col *= aSleeve; else if (part > 0.2) col *= aSkin;
  vCol = col;
  vW = wpos;
  gl_Position = projectionMatrix * viewMatrix * vec4(wpos, 1.0);
}`;
const flyFrag = (rig) => /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vN; varying vec3 vCol;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 Lg = kLight(vW, N, vW, N) * 0.75 + kLight(vW, vec3(0.0, 0.0, 1.0), vW, vec3(0.0, 0.0, 1.0)) * 0.25;
  gl_FragColor = vec4(kAir(vCol * Lg, vW), 1.0);
}`;

function flyerMesh(rig, items, uniforms) {
  const base = flyerGeo();
  const g = new InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'aCol', 'aEmit']) g.setAttribute(k, base.getAttribute(k));
  const n = items.length;
  const P0 = new Float32Array(n * 3), V = new Float32Array(n * 3), LO = new Float32Array(n * 4), HI = new Float32Array(n * 4);
  const CL = new Float32Array(n * 3), SL = new Float32Array(n * 3), SK = new Float32Array(n * 3);
  items.forEach((it, i) => {
    P0.set(it.p, i * 3); V.set(it.v, i * 3); LO.set(it.loop, i * 4); HI.set(it.hit, i * 4);
    CL.set(rgb(it.cloth), i * 3); SL.set(rgb(it.sleeve), i * 3); SK.set(rgb(it.skin), i * 3);
  });
  g.setAttribute('aP0', new InstancedBufferAttribute(P0, 3)); g.setAttribute('aV', new InstancedBufferAttribute(V, 3));
  g.setAttribute('aLoop', new InstancedBufferAttribute(LO, 4)); g.setAttribute('aHit', new InstancedBufferAttribute(HI, 4));
  g.setAttribute('aCloth', new InstancedBufferAttribute(CL, 3)); g.setAttribute('aSleeve', new InstancedBufferAttribute(SL, 3)); g.setAttribute('aSkin', new InstancedBufferAttribute(SK, 3));
  g.instanceCount = n;
  g.boundingSphere = new Sphere(new Vector3(0, 0, 150), 400);
  const m = new ShaderMaterial({ uniforms: { ...rig.uniforms, ...uniforms }, vertexShader: FLY_VERT, fragmentShader: flyFrag(rig), side: DoubleSide });
  const mesh = new Mesh(g, m);
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- the net: a sock of diamond mesh
const NET_VERT = /* glsl */`
attribute vec2 aM;
varying vec3 vW; varying vec2 vM; varying vec3 vN;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vM = aM; vN = normal;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const netFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform float uCell, uRope, uMainU, uMainV, uMainW, uOpacity; uniform vec3 uCol;
varying vec3 vW; varying vec2 vM; varying vec3 vN;
${rig.glsl}
// share of a pixel covered by lines of width w (in cells) on a lattice of unit cells, for a pixel p cells wide
float kLines(float t, float w, float p) {
  p = max(p, 1e-4);
  float a = t - 0.5 * p + 0.5 * w, b = t + 0.5 * p + 0.5 * w;
  float g1 = floor(a) * w + min(fract(a), w), g2 = floor(b) * w + min(fract(b), w);
  return clamp((g2 - g1) / p, 0.0, 1.0);
}
void main() {
  ${CLIP_FRAG}
  vec2 d = vec2(vM.x + vM.y, vM.x - vM.y) / uCell;
  vec2 pw = fwidth(d);
  float w = uRope / uCell;
  float c1 = kLines(d.x, w, pw.x), c2 = kLines(d.y, w, pw.y);
  vec2 mm = vM / vec2(uMainU, uMainV); vec2 pm = fwidth(mm);
  float c3 = kLines(mm.x, uMainW / uMainU, pm.x), c4 = kLines(mm.y, uMainW / uMainV, pm.y);
  float a = 1.0 - (1.0 - c1) * (1.0 - c2) * (1.0 - c3) * (1.0 - c4);
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN);
  float ndv = abs(dot(N, V));
  a = 1.0 - pow(max(1.0 - a * uOpacity, 0.0), 1.0 / max(ndv, 0.07));
  vec3 Lg = (kLight(vW, N, vW, N) + kLight(vW, -N, vW, -N)) * 0.5 + uAmb * 0.6;
  gl_FragColor = vec4(kAir(uCol * Lg, vW), a);
}`;

function netMesh(rig) {
  const pos = [], nrm = [], m = [], idx = [];
  const NA = 200, NZ = 16, circ = 2 * Math.PI * NET_R;
  // the sock
  for (let j = 0; j <= NZ; j++) {
    const z = NET_Z0 + (NET_Z1 - NET_Z0) * (j / NZ);
    for (let i = 0; i <= NA; i++) { const a = (i / NA) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(NET_R * c, NET_R * s, z); nrm.push(-c, -s, 0); m.push((i / NA) * circ, z); }
  }
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  // the net across its end
  const s0 = pos.length / 3, NR = 10;
  for (let j = 0; j <= NR; j++) {
    const r = 1.8 + (NET_R - 1.8) * Math.pow(j / NR, 0.8);
    for (let i = 0; i <= NA; i++) { const a = (i / NA) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(r * c, r * s, NET_Z1); nrm.push(0, 0, -1); m.push(r * c, r * s); }
  }
  for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { const a = s0 + j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('aM', new Float32BufferAttribute(m, 2));
  g.setIndex(idx);
  g.boundingSphere = new Sphere(new Vector3(0, 0, (NET_Z0 + NET_Z1) / 2), 190);
  const mat = new ShaderMaterial({
    uniforms: {
      ...rig.uniforms, uClip: G.uClip,
      uCell: { value: circ / 400 }, uRope: { value: 0.07 }, uMainU: { value: circ / 24 }, uMainV: { value: 24 }, uMainW: { value: 0.16 },
      uOpacity: { value: 0.9 }, uCol: { value: new Vector3(...rgb('#eef2f6')) },
    },
    vertexShader: NET_VERT, fragmentShader: netFrag(rig), side: DoubleSide, transparent: true, depthWrite: false,
  });
  const mesh = new Mesh(g, mat);
  mesh.renderOrder = 4;
  return mesh;
}

// ---------------------------------------------------------------- hoops
const HOOP_COLS = [['#e8563a', '#fbfdff'], ['#f2c14e', '#5e6b78'], ['#3fa7a0', '#fbfdff'], ['#4d7fc4', '#f2c14e'], ['#fbfdff', '#e8563a'], ['#a34b86', '#fbfdff']];
function basisAt(c, n, upHint) {
  const z = new Vector3(...n).normalize();
  let y = new Vector3(...upHint); y.addScaledVector(z, -y.dot(z));
  if (y.lengthSq() < 1e-6) y.set(0, 0, 1).addScaledVector(z, -z.z);
  y.normalize();
  const x = new Vector3().crossVectors(y, z);
  return new Matrix4().makeBasis(x, y, z).setPosition(c[0], c[1], c[2]);
}
// a ring in its own xy plane (Geo.tube cannot close a loop that turns through its up direction): R round, r thick
function torus(g, R, r, segs, sides, colAt, emit = 0) {
  const P = (a, b) => [(R + r * Math.cos(b)) * Math.cos(a), (R + r * Math.cos(b)) * Math.sin(a), r * Math.sin(b)];
  const N = (a, b) => [Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)];
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2, col = colAt(i);
    for (let j = 0; j < sides; j++) {
      const b0 = (j / sides) * Math.PI * 2, b1 = ((j + 1) / sides) * Math.PI * 2;
      g.tri(P(a0, b0), P(a1, b0), P(a1, b1), col, emit, N(a0, b0), N(a1, b0), N(a1, b1));
      g.tri(P(a0, b0), P(a1, b1), P(a0, b1), col, emit, N(a0, b0), N(a1, b1), N(a0, b1));
    }
  }
}
// a padded hoop in its own xy plane, and lines from its rim out to the net
function addHoop(g, m, R, pad, cols, bands, lines) {
  g.push(m);
  torus(g, R, pad, bands * 3, 6, (i) => cols[Math.floor(i / 3) % cols.length]);
  g.pop();
  const c = new Vector3().setFromMatrixPosition(m), X = new Vector3().setFromMatrixColumn(m, 0), Y = new Vector3().setFromMatrixColumn(m, 1);
  for (let k = 0; k < lines; k++) {
    const a = (k / lines) * Math.PI * 2 + 0.4, dir = X.clone().multiplyScalar(Math.cos(a)).addScaledVector(Y, Math.sin(a));
    const p = c.clone().addScaledVector(dir, R + pad);
    // run out along dir until the net
    const dx = dir.x, dy = dir.y, A = dx * dx + dy * dy, B = 2 * (p.x * dx + p.y * dy), Cc = p.x * p.x + p.y * p.y - NET_R * NET_R;
    if (A < 1e-4) continue;
    const s = (-B + Math.sqrt(Math.max(B * B - 4 * A * Cc, 0))) / (2 * A);
    const q = p.clone().addScaledVector(dir, s);
    if (q.z < NET_Z0 || q.z > NET_Z1) continue;
    g.tube([[p.x, p.y, p.z], [q.x, q.y, q.z]], 0.035, 3, '#c9d1da');
  }
}

// ---------------------------------------------------------------- the world
export const kittiwakeCrosswise = {
  id: 'kittiwake-crosswise',
  title: 'Crosswise in the flying hall', drum: 'Kittiwake', row: 'Gull Row', kind: 'a maker drum', light: 18.9,
  line: 'My teacher is nine. Across the axis the drum turns under you, so you aim wide, and on my fourth try I came out at the hoop I\'d aimed for.',
  tone: '#d6dde6', source: 'wander-year.md (Day 60), raft-habitat.md (The sunline and the Spindle), ashgrove.md (Day two)',
  sound: { root: 52, scale: 'lydian', pad: 0.4, air: 0.55, crowd: 0.35, bells: 0.12, bright: 0.7 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    yield* paintKittiwake(plan);
    yield 'kittiwake: hall';
    const houses = ['#e9edf2', '#c3ccd6', '#aab6c3', '#e6e1d8', '#b8c4cc', '#d4dbe3'];
    const wall = { lit: 0.05, crowd: 0.35, stone: '#dfe4ea', stone2: '#c9d1da', houses, houseMix: 0.55, glass: '#5e6b78', gardenColor: '#87a07c', awning: '#5e6b78', pave: '#d6dde6', tiers: { 27: { crowd: 0.8 }, 29: { crowd: 0.9 } } };
    const hollow = yield* buildHollow(ctx, {
      seed: 'kittiwake', plan,
      light: LIGHT,
      sunline: { power: 60 },
      ground: { canopy: '#6f8f62', people: 0.6, lamp: 0, sunRod: 26, water: '#a9c4cc', stripes: 0.05 },
      front: wall, back: { ...wall, crowd: 0.25 },
    });
    yield 'kittiwake: hall';
    const scene = new Scene();
    scene.add(hollow.group);
    const rng = makeRng('kittiwake-hall');
    // in the hall the whole lit land shines in from every side: things here get more of the Hollow's glow than things on the floor
    const rig = hollowRig({ ...LIGHT, amb: '#c9d2d6', ambPower: 0.85 });
    const hallLit = litMaterial(rig, {});

    // ---- the camera: along the top terrace past the gate, out along the hall, then a free crossing to a hoop
    const tc0 = 28, cA = 34, cR = 46, cZ = 156;
    const P0 = cyl(cA, cR, cZ);
    const inD = inward(cA), spin = [-Math.sin(cA * DEG), Math.cos(cA * DEG), 0];
    const wide = -0.2, speed = 5.4;
    let u0 = [inD[0] + spin[0] * wide, inD[1] + spin[1] * wide, 0.0];
    const ul = Math.hypot(u0[0], u0[1]); u0 = [u0[0] / ul * speed, u0[1] / ul * speed, 1.3];
    const Vc = freeV(P0, u0);
    // how long until it is back out at about 52 m from the axis
    let Tc = 0; { const q = [0, 0, 0]; let near = false; for (let t = 0.5; t < 30; t += 0.05) { freeAt(P0, Vc, t, q); const r = Math.hypot(q[0], q[1]); if (r < 25) near = true; if (near && r > 52) { Tc = t; break; } } }
    const aim0 = new Vector3(u0[0], u0[1], u0[2] + 2.6).normalize();
    const up0 = new Vector3(0, 0, 1).addScaledVector(aim0, -aim0.z).normalize();
    const rotZ = (v, a) => new Vector3(v.x * Math.cos(a) - v.y * Math.sin(a), v.x * Math.sin(a) + v.y * Math.cos(a), v.z);
    const E = freeAt(P0, Vc, Tc);
    // the body keeps its heading as the drum turns under it; the eyes go more and more to the hoop
    const crossKey = (tau) => {
      const p = freeAt(P0, Vc, tau), a = -W * tau;
      const d = rotZ(aim0, a), u = rotZ(up0, a);
      const toE = new Vector3(E[0] - p[0], E[1] - p[1], E[2] - p[2]), dist = toE.length();
      const s = Math.min(1, Math.max(0, (tau / Tc - 0.2) / 0.5));
      if (dist > 1.5) d.lerp(toE.normalize(), s * s * (3 - 2 * s)).normalize();
      else { const b = freeAt(P0, Vc, tau + 0.1); d.set(b[0] - p[0], b[1] - p[1], b[2] - p[2]).normalize(); }
      return { t: tc0 + tau, p, look: [p[0] + d.x * 60, p[1] + d.y * 60, p[2] + d.z * 60], up: [u.x, u.y, u.z] };
    };
    const keys = [
      { t: 0, p: cyl(-30, 67, 10), up: inward(-30) },
      { t: 5, p: cyl(-13, 65.5, 8.5), look: cyl(2, 62, 14), up: inward(-13) },
      { t: 10, p: cyl(-2, 60, 26), look: cyl(8, 25, 260), up: inward(-2) },
      { t: 16, p: cyl(10, 52, 66), look: cyl(4, 1150, 270), up: inward(10) },
      { t: 22, p: cyl(22, 48, 112), look: cyl(205, 1500, 2300), up: inward(22) },
      { t: 25, p: cyl(29, 47, 136), look: cyl(40, 20, 330), up: inward(29) },
    ];
    for (let tau = 0; tau < Tc - 1.2; tau += 2.5) keys.push(crossKey(tau));
    keys.push(crossKey(Tc - 1.0)); keys.push(crossKey(Tc));
    const endV = (() => { const a = freeAt(P0, Vc, Tc - 0.05), b = freeAt(P0, Vc, Tc + 0.05); return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.1; })();
    const exitR = endV / 1.15;
    const path = makePath(keys, { entryRadius: 2.4, exitRadius: exitR });
    const track = path.points(0.5, true);
    const nearTrack = (x, y, z, d) => { for (const q of track) { const dx = q.x - x, dy = q.y - y, dz = q.z - z; if (dx * dx + dy * dy + dz * dz < d * d) return true; } return false; };
    yield 'kittiwake: hall';

    // ---- the net
    scene.add(netMesh(hollow.rig));
    // stiff ribs that hold the sock open
    const ribs = new Geo();
    for (let z = NET_Z0 + 24; z <= NET_Z1; z += 36) { ribs.at(0, 0, Math.min(z, NET_Z1)); torus(ribs, NET_R + 0.3, z >= NET_Z1 - 1 ? 0.45 : 0.28, 96, 4, () => '#c3ccd6'); ribs.pop(); }
    scene.add(ribs.mesh(hallLit));
    // the hub and the spar, padded and painted where flyers meet them
    const dbl = litMaterial(rig, { side: 'double' });
    const pad = new Geo();
    pad.rot('x', Math.PI / 2);
    const prof = [[47.6, 0.3], [41.6, 26], [23.6, 60], [10.6, 120], [5.6, 150], [2.4, 156]];
    pad.lathe(0, 0, 0, prof, 48, (k) => ['#aab5c0', '#9da9b5', '#b9c3cc', '#a6b1bc', '#e8563a'][k]);
    pad.pop();
    for (const [z, c] of [[5, '#e8563a'], [14, '#fbfdff'], [23, '#f2c14e'], [38, '#e8563a'], [52, '#fbfdff'], [80, '#3fa7a0'], [104, '#f2c14e'], [134, '#e8563a']]) { pad.at(0, 0, z); torus(pad, hubR(z) + 2.0, 0.7, 48, 5, () => c); pad.pop(); }
    for (let z = 156, k = 0; z < NET_Z1; z += 6, k++) { pad.at(0, 0, z); pad.rot('x', Math.PI / 2); pad.cyl(0, 0, 0, 2.0, 2.0, 5.6, 10, k % 2 ? '#fbfdff' : '#e8563a', { cap: false }); pad.pop(); pad.pop(); }
    scene.add(pad.mesh(dbl));
    // a lining on the hub face, round the gate
    const lining = new Geo();
    for (let i = 0; i < 96; i++) {
      const a0 = (i / 96) * Math.PI * 2, a1 = ((i + 1) / 96) * Math.PI * 2, c = i % 2 ? '#8b97a4' : '#7f8b98';
      lining.quad([47.6 * Math.cos(a0), 47.6 * Math.sin(a0), 0.15], [74.9 * Math.cos(a0), 74.9 * Math.sin(a0), 0.15], [74.9 * Math.cos(a1), 74.9 * Math.sin(a1), 0.15], [47.6 * Math.cos(a1), 47.6 * Math.sin(a1), 0.15], c, 0.06);
    }
    scene.add(lining.mesh(dbl));
    const hubLamps = [];
    for (const [r, z] of [[47.8, 1], [41.8, 26], [23.8, 60], [10.8, 120], [62, 0.4]]) for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; hubLamps.push({ p: [r * Math.cos(a), r * Math.sin(a), z], color: '#fff1d6', power: 5, size: 0.35 }); }
    scene.add(glowPoints(hubLamps, { minPx: 1.2, maxPx: 30, soft: 1.8 }));
    yield 'kittiwake: hall';

    // ---- hoops, in rings hung across the hall
    const hoops = new Geo(), hoopLamps = [], hoopSpots = [];
    const ringsZ = [62, 112, 168, 222, 268];
    for (const z of ringsZ) {
      const nH = rng.i(5, 8), a0 = rng.f(0, 360);
      for (let k = 0; k < nH; k++) {
        const a = a0 + (k / nH) * 360 + rng.f(-12, 12), r = rng.f(22, 56), zz = z + rng.f(-10, 10);
        if (zz < 150 && r < hubR(zz) + 10) continue;
        const c = cyl(a, r, zz), R = rng.f(1.8, 3.2);
        if (nearTrack(c[0], c[1], c[2], R + 7)) continue;
        // facing round the drum, so you go through crosswise, tipped this way and that
        const sp = [-Math.sin(a * DEG), Math.cos(a * DEG), 0], ind = inward(a);
        const tilt = rng.f(-0.8, 0.8), tz = rng.f(-0.5, 0.5);
        const n = [sp[0] + ind[0] * tilt, sp[1] + ind[1] * tilt, tz];
        const m = basisAt(c, n, [0, 0, 1]);
        addHoop(hoops, m, R, 0.22, rng.pick(HOOP_COLS), 14, 3);
        hoopSpots.push({ c, n, R, a });
        if (rng.chance(0.5)) for (let i = 0; i < 8; i++) { const q = new Vector3(Math.cos(i / 8 * 6.283) * R, Math.sin(i / 8 * 6.283) * R, 0).applyMatrix4(m); hoopLamps.push({ p: [q.x, q.y, q.z], color: '#fff1d6', power: 4, size: 0.25 }); }
      }
      yield 'kittiwake: hall';
    }
    scene.add(hoops.mesh(hallLit));

    // ---- the exit: the hoop the camera aimed for
    const ex = path.exit, exM = new Matrix4().compose(ex.pos, ex.quat, new Vector3(1, 1, 1));
    const exG = new Geo();
    addHoop(exG, exM, exitR * 1.04, 0.42, ['#e8563a', '#fbfdff', '#e8563a', '#fbfdff', '#f2c14e', '#fbfdff'], 24, 4);
    scene.add(exG.mesh(hallLit));
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, q = new Vector3(Math.cos(a) * (exitR * 1.04 + 0.45), Math.sin(a) * (exitR * 1.04 + 0.45), 0.2).applyMatrix4(exM); hoopLamps.push({ p: [q.x, q.y, q.z], color: i % 2 ? '#ffe2b0' : '#fff6e8', power: 7, size: 0.32, twinkle: 0.1 }); }
    scene.add(glowPoints(hoopLamps, { minPx: 1.2, maxPx: 40, soft: 1.8 }));
    yield 'kittiwake: hall';

    // ---- flyers
    const sleeves = ['#e8563a', '#f2c14e', '#3fa7a0', '#4d7fc4', '#fbfdff', '#e98a3c', '#a34b86', '#d6dde6', '#7fc4d9', '#f08aa0'];
    const items = [];
    const person = (child) => ({ cloth: rng.pick(CLOTH), sleeve: rng.pick(sleeves), skin: rng.pick(SKIN), scale: child ? rng.f(0.5, 0.72) : rng.f(0.92, 1.08) });
    const q = [0, 0, 0];
    // along the hall: straight, there and back
    const nLong = Math.round(1100 * ctx.density);
    for (let i = 0, tries = 0; i < nLong && tries < nLong * 4; tries++) {
      const r = 8 + 66 * Math.sqrt(rng()), a = rng.f(0, 360), out = rng.chance(0.55), sp = rng.f(2.5, 7.5);
      if (r < 14) continue;
      const z0 = out ? 16 : 292, z1 = out ? 292 : 16;
      const pr = person(rng.chance(0.62));
      const p = cyl(a, r, z0), dr = rng.f(-0.12, 0.12), da = rng.f(-0.25, 0.25);
      const v = [(-Math.cos(a * DEG) * dr - Math.sin(a * DEG) * da), (-Math.sin(a * DEG) * dr + Math.cos(a * DEG) * da), out ? sp : -sp];
      let ok = true; const T = Math.abs(z1 - z0) / sp;
      for (let t = 0; t <= T; t += 2) { const x = p[0] + v[0] * t, y = p[1] + v[1] * t, z = p[2] + v[2] * t, rr = Math.hypot(x, y); if (rr > 73 || rr < hubR(z) + 2.5) { ok = false; break; } }
      if (!ok) continue;
      items.push({ p, v, loop: [T, rng(), 0, pr.scale], hit: [1e5, rng.f(2.2, 4.5), rng(), 0], ...pr });
      i++;
    }
    yield 'kittiwake: hall';
    // across: free flight, aimed wide; grown-ups mostly end in the net
    const nCross = Math.round(520 * ctx.density);
    for (let i = 0, tries = 0; i < nCross && tries < nCross * 6; tries++) {
      const a = rng.f(0, 360), r0 = rng.f(40, 70), z0 = rng.f(24, 285), sp = rng.f(3, 6.5), b = rng.f(6, 34) * (rng.chance(0.8) ? -1 : 1);
      const ind = inward(a), spn = [-Math.sin(a * DEG), Math.cos(a * DEG), 0];
      let d = [ind[0] * r0 + spn[0] * b, ind[1] * r0 + spn[1] * b]; const dl = Math.hypot(d[0], d[1]); d = [d[0] / dl, d[1] / dl];
      const p = cyl(a, r0, z0), u = [d[0] * sp, d[1] * sp, rng.f(-1.2, 1.2)], V = freeV(p, u);
      const adult = rng.chance(0.3);
      let tHit = 0, tEnd = 0, ok = true, inner = false;
      for (let t = 0.25; t < 45; t += 0.25) {
        freeAt(p, V, t, q); const rr = Math.hypot(q[0], q[1]);
        if (rr < 4 || q[2] < 14 || q[2] > 296 || (q[2] < 150 && rr < hubR(q[2]) + 2.5)) { ok = false; break; }
        if (rr < r0 - 10) inner = true;
        if (inner && !tEnd && rr > 64) tEnd = t;
        if (rr > 73.6) { tHit = t; break; }
      }
      if (!ok || !tHit || !inner) continue;
      const pr = person(!adult);
      if (adult && rng.chance(0.75)) items.push({ p, v: V, loop: [tHit + rng.f(3, 6), rng(), 1, pr.scale], hit: [tHit, rng.f(2.5, 4.5), rng(), rng.chance(0.4) ? rng.f(-0.6, 0.6) : 0], ...pr });
      else items.push({ p, v: V, loop: [tEnd || tHit - 0.5, rng(), 1, pr.scale], hit: [1e5, rng.f(2.5, 5), rng(), 0], ...pr });
      i++;
    }
    yield 'kittiwake: hall';
    // waiting by the hoops: small teachers and their pupils, hovering
    for (const h of hoopSpots) {
      if (!rng.chance(0.7)) continue;
      const n = rng.i(3, 8), ind = inward(h.a);
      for (let k = 0; k < n; k++) {
        const off = h.R + rng.f(1.5, 6), side = rng.sign();
        const p = [h.c[0] + h.n[0] * side * rng.f(2, 5) + ind[0] * rng.f(-3, 3) + rng.f(-1, 1), h.c[1] + h.n[1] * side * rng.f(2, 5) + ind[1] * rng.f(-3, 3) + rng.f(-1, 1), h.c[2] + rng.f(-off, off) * 0.6];
        const pr = person(rng.chance(0.75));
        items.push({ p, v: [-h.n[0] * side, -h.n[1] * side, rng.f(-0.3, 0.3)], loop: [-1, 0, 0, pr.scale], hit: [0, rng.f(1, 2.5), rng(), 0], ...pr });
      }
    }
    // a lesson beside the way out: a class waiting in a line at a low hoop, their teacher at its rim
    {
      const st = { pos: new Vector3(), quat: path.entry.quat.clone(), fov: 58, vel: new Vector3() };
      path.sample(19, st);
      const R1 = new Vector3(1, 0, 0).applyQuaternion(st.quat), U1 = new Vector3(0, 1, 0).applyQuaternion(st.quat), F1 = new Vector3(0, 0, -1).applyQuaternion(st.quat);
      const hc = st.pos.clone().addScaledVector(R1, -7.5).addScaledVector(U1, -2.5).addScaledVector(F1, 13);
      const hn = R1.clone().multiplyScalar(-0.55).addScaledVector(F1, 0.85).normalize();
      const sg = new Geo();
      addHoop(sg, basisAt([hc.x, hc.y, hc.z], [hn.x, hn.y, hn.z], [U1.x, U1.y, U1.z]), 2.2, 0.26, ['#f2c14e', '#fbfdff'], 12, 3);
      scene.add(sg.mesh(hallLit));
      const into = hn.clone().negate();
      for (let k = 0; k < 8; k++) {
        const p = hc.clone().addScaledVector(hn, 3 + k * 1.7).addScaledVector(U1, rng.f(-0.5, 0.5)).addScaledVector(F1, rng.f(-0.8, 0.8));
        const tch = k === 0;
        items.push({ p: [p.x, p.y, p.z], v: [into.x, into.y, into.z], loop: [-1, 0, 0, tch ? 0.74 : rng.f(0.5, 0.6)], hit: [0, rng.f(1.2, 2.4), rng(), 0], cloth: tch ? '#e8563a' : rng.pick(CLOTH), sleeve: tch ? '#fbfdff' : '#7fc4d9', skin: rng.pick(SKIN) });
      }
    }
    // just off the terrace by the gate: people in new sleeves, finding their feet in the air
    for (let i = 0, n = 0; i < 200 && n < 34; i++) {
      const a = rng.f(-24, 4), r = rng.f(58, 72), z = rng.f(13, 26), p = cyl(a, r, z);
      if (nearTrack(p[0], p[1], p[2], 3.5)) continue;
      const pr = person(rng.chance(0.5)), h = rng.f(0, Math.PI * 2);
      items.push({ p, v: [Math.cos(h), Math.sin(h), rng.f(-0.6, 0.9)], loop: [-1, 0, 0, pr.scale], hit: [0, rng.f(1.5, 4), rng(), rng.chance(0.25) ? rng.f(-0.5, 0.5) : 0], ...pr });
      n++;
    }
    // grown-ups in the net
    for (let i = 0; i < 30; i++) {
      const a = rng.f(0, 360), z = rng.f(30, 290), p = cyl(a, 73.8, z);
      const pr = person(false);
      items.push({ p, v: [-Math.sin(a * DEG) * rng.f(-1, 1), Math.cos(a * DEG) * rng.f(-1, 1), rng.f(-1, 1)], loop: [-1, 0, 0, pr.scale], hit: [0, rng.f(0.5, 1.5), rng(), 0], ...pr });
    }
    // the teacher and her pupils on the same crossing, slower: the camera overtakes them a third of the way over.
    // Each follows the one ahead along the same bent line, a beat behind, as the drum sees it.
    const tm = tc0 + Tc * 0.36;
    const pose = { pos: new Vector3(), quat: path.entry.quat.clone(), fov: 58, vel: new Vector3() };
    path.sample(tm, pose);
    const pm = pose.pos.clone(), vm = pose.vel.clone();
    const camR = new Vector3(1, 0, 0).applyQuaternion(pose.quat), camU = new Vector3(0, 1, 0).applyQuaternion(pose.quat);
    const lead = pm.clone().addScaledVector(camR, 2.4).addScaledVector(camU, -1.0).addScaledVector(vm.clone().normalize(), 1.5);
    const ug = vm.clone().multiplyScalar(0.5);
    const Vg = freeV([lead.x, lead.y, lead.z], [ug.x, ug.y, ug.z]);
    // how long the line stays clear of the spar, the hub and the net either side of the meeting
    let w0 = -16, w1 = 16;
    for (let t = 0; t > -16; t -= 0.25) { freeAt([lead.x, lead.y, lead.z], Vg, t, q); const rr = Math.hypot(q[0], q[1]); if (rr > 70 || rr < 3.5 || q[2] < 14) { w0 = t + 1.5; break; } }
    for (let t = 0; t < 16; t += 0.25) { freeAt([lead.x, lead.y, lead.z], Vg, t, q); const rr = Math.hypot(q[0], q[1]); if (rr > 70 || rr < 3.5 || q[2] > 296) { w1 = t - 1.5; break; } }
    const crew = [{ s: 0.74, cloth: '#e8563a', sleeve: '#fbfdff' }];
    for (let k = 0; k < 6; k++) crew.push({ s: rng.f(0.5, 0.6), cloth: rng.pick(CLOTH), sleeve: '#f2c14e' });     // the class, in matching sleeves
    crew.splice(4, 0, { s: 1.02, cloth: '#3f8a7a', sleeve: '#d6dde6', aunt: true });
    crew.forEach((c, k) => {
      const delay = k * 1.15, o = k ? new Vector3(rng.f(-0.7, 0.7), rng.f(-0.7, 0.7), rng.f(-0.7, 0.7)) : new Vector3();
      items.push({ p: [lead.x + o.x, lead.y + o.y, lead.z + o.z], v: Vg, loop: [0, tm + delay, 1, c.s], hit: [w0, w1, rng(), c.aunt ? 0.8 : 0], cloth: c.cloth, sleeve: c.sleeve, skin: rng.pick(SKIN) });
    });
    // traffic kept near the camera on the flight's own clock: lengthwise flyers it goes out among, then crossers that
    // cut over its line, each on its own bent path
    const okLine = (p, v, mode, t0, t1) => { for (let t = t0; t <= t1; t += 0.5) { if (mode) freeAt(p, v, t, q); else { q[0] = p[0] + v[0] * t; q[1] = p[1] + v[1] * t; q[2] = p[2] + v[2] * t; } const rr = Math.hypot(q[0], q[1]); if (rr > 72 || rr < 3 || q[2] < 12 || q[2] > 297 || (q[2] < 156 && rr < hubR(q[2]) + 2.5)) return false; } return true; };
    for (let k = 0, tries = 0; k < 70 && tries < 600; tries++) {
      const tk = rng.f(4, tc0 - 1);
      path.sample(tk, pose);
      const R1 = new Vector3(1, 0, 0).applyQuaternion(pose.quat), U1 = new Vector3(0, 1, 0).applyQuaternion(pose.quat), F1 = new Vector3(0, 0, -1).applyQuaternion(pose.quat);
      const side = rng.f(3, 16) * rng.sign(), up = rng.f(-8, 8), ahead = rng.f(4, 30);
      const p = pose.pos.clone().addScaledVector(R1, side).addScaledVector(U1, up).addScaledVector(F1, ahead);
      const v = [rng.f(-0.4, 0.4), rng.f(-0.4, 0.4), Math.max(2.5, pose.vel.z * rng.f(0.6, 1.25))];
      if (!okLine([p.x, p.y, p.z], v, 0, -9, 9)) continue;
      const pr = person(rng.chance(0.6));
      items.push({ p: [p.x, p.y, p.z], v, loop: [0, tk, 0, pr.scale], hit: [-9, 9, rng(), 0], ...pr });
      k++;
    }
    for (let k = 0, tries = 0; k < 40 && tries < 600; tries++) {
      const tk = rng.f(tc0 + 1, tc0 + Tc - 3);
      path.sample(tk, pose);
      const F1 = new Vector3(0, 0, -1).applyQuaternion(pose.quat), R1 = new Vector3(1, 0, 0).applyQuaternion(pose.quat), U1 = new Vector3(0, 1, 0).applyQuaternion(pose.quat);
      const p = pose.pos.clone().addScaledVector(F1, rng.f(4, 22)).addScaledVector(R1, rng.f(-4, 4)).addScaledVector(U1, rng.f(-3, 3));
      const a = rng.f(0, Math.PI * 2), sp = rng.f(3, 6);
      const u = [Math.cos(a) * sp, Math.sin(a) * sp, rng.f(-1, 1)], V = freeV([p.x, p.y, p.z], u);
      if (!okLine([p.x, p.y, p.z], V, 1, -7, 7)) continue;
      const pr = person(rng.chance(0.65));
      items.push({ p: [p.x, p.y, p.z], v: V, loop: [0, tk, 1, pr.scale], hit: [-7, 7, rng(), rng.chance(0.2) ? rng.f(-0.7, 0.7) : 0], ...pr });
      k++;
    }
    const flyU = { uClip: G.uClip, uTime: G.uTime, uFlight: { value: 0 }, uOmega: { value: W } };
    scene.add(flyerMesh(rig, items, flyU));
    yield 'kittiwake: hall';

    // ---- the gate on the top terrace, by the hub face
    const t29 = hollow.terrace(0, 29, -6);
    const gate = new Geo({ maxSeg: 1.5 });
    gate.box(-26, 0, -10.6, 26, 1.1, -8.6, '#d6dde6', { top: '#fbfdff' });                 // the counter
    gate.box(-26, 0, -11, 26, 5.2, -10.6, '#e9edf2', { emit: 0.35 });                     // the board behind it, lit
    for (let i = 0; i < 18; i++) gate.box(-27 + i * 3, 5.2, -11, -24 + i * 3, 5.4, -9.4, i % 2 ? '#fbfdff' : '#e8563a');   // a striped canopy
    for (let i = 0; i <= 12; i++) gate.box(-26 + i * 4.333 - 0.06, 0, -7.4, -26 + i * 4.333 + 0.06, 5.2, -7.28, '#c3ccd6');
    const gateLamps = [];
    for (let i = 0; i < 26; i++) gateLamps.push({ p: [-25 + i * 2, 4.9, -8.0], color: '#ffe7c4', power: 5, size: 0.3 });
    t29.glow(gateLamps, { minPx: 1.2, maxPx: 30, soft: 1.8 });
    for (let i = 0; i < 26; i++) for (let j = 0; j < 3; j++) {
      const x = -25 + i * 1.95, y = 1.6 + j * 1.2, c = sleeves[(i * 3 + j * 5) % sleeves.length];
      gate.tri([x, y + 1.0, -10.55], [x + 0.2, y, -10.55], [x + 1.7, y + 0.9, -10.55], c);   // sleeves pinned up to choose from
    }
    for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) {
      const x = 28 + i * 0.7, y = 0.25 + j * 0.5;                                           // shoes kept as the deposit
      gate.box(x, y - 0.25, -10.9, x + 0.66, y + 0.2, -10.2, '#c9d1da', { skip: 'n' });
      if ((i * 7 + j * 3) % 5) { const sc = ['#3a3f48', '#7a4a2e', '#c9563c', '#e7e1d3', '#2f3b45'][(i + j) % 5]; gate.box(x + 0.08, y - 0.2, -10.7, x + 0.3, y - 0.08, -10.4, sc); gate.box(x + 0.36, y - 0.2, -10.7, x + 0.58, y - 0.08, -10.4, sc); }
    }
    for (let i = 0; i < 18; i++) gate.blob(-24 + i * 2.7, 1.25, -9.6, 0.12, 0, '#f4ead2');   // bulbs of broth
    t29.add(gate.mesh(t29.lit, t29.frame));
    const spots = [];
    for (let i = 0; i < 70; i++) spots.push({ p: [rng.f(-30, 40), 0, rng.f(-8, -1)], walk: rng.chance(0.4) ? rng.f(0.5, 2) : 0, child: rng.chance(0.55), yaw: Math.PI });
    for (const m of crowd(spots, t29.walk, { frame: t29.frame, bob: 0.35, speed: 0.6 })) t29.add(m);
    yield 'kittiwake: hall';

    return {
      scene, path, hollow, near: 0.3, far: 9000,
      look: { exposure: 1.05, bloom: 0.22, threshold: 0.9, saturation: 1.0, vignette: 0.4, contrast: 1.04 },
      portal: { rim: false, mist: '#e9eef4' },
      update(t) { flyU.uFlight.value = t; },
    };
  },
};
