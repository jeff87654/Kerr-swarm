// Dulse, Kelp Row: the far side, 36.9 light-seconds from home. A hall drum that pulls its noodles on the end-wall
// terraces at a third of a g, because there a strand can hang three times as long before its own weight tears it
// (docs/wander-year.md, Day 185 and Method, "Third-g noodles"; games/three-nights/src/15-canon.js, Dulse: "kitchen
// terraces on the end walls, strung with drying noodles", the dawn "Broth gold", Abelone, "One noodle.").
// The flight begins in the air beside the rail of the front wall's Third, among cooks swinging loops of noodle out over
// the drop, comes in over the rail and down an aisle of drying racks past the breakfast tables, finds Abelone alone at
// the end of a counter drawing out a single strand, follows it out over the rail and down the face of the wall, pulls
// out to see the whole wall of kitchens hung with pale threads above the gold land, and comes back to leave through a
// drying hoop wound with noodle that stands at the rail.
//
// Not canon (the docs say only "kitchen terraces on the end walls, strung with drying noodles"):
//   - the layout of the kitchens on the Third: pulling bays out over the rail, long tables, two rows of tall drying
//     racks with strands strung across the aisle between them, counters and broth kettles against the houses;
//   - strands drying over the rail and down the face of the flats below, on most tiers right round the wall, and racks
//     on the other terraces; the longer hangs on the lighter tiers follow the canon physics (length goes as 1/g);
//   - Abelone's strand carried across the terrace over tall pegs and down over the rail, and the hoop of noodle at the rail;
//   - a few hanks of pale green kelp noodle among the wheat;
//   - the plan of Dulse's Hollow: lawns with the halls' long picnic tables, a long lake, lamp-lit herb beds under the walls.
import { Scene, BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, Sphere, Vector3, Color, DoubleSide, NormalBlending } from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, TIERS, NT, TIER_H, tierPlace } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { crowd, CLOTH, SKIN } from '../kit/folk.js';
import { Geo, instances } from '../kit/geo.js';
import { G, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, vec3col, glowPoints } from '../kit/mats.js';
import { makeRng, hash2, smoothstep, clamp } from '../core/rng.js';
import { DRUM } from '../kit/drum.js';

const DEG = 100;                                  // where round the front wall the flight's kitchens are
const A0 = (DEG * Math.PI) / 180;
const X0 = A0 * DRUM.RH;                          // the same as flat x on the Hollow floor
const THIRD = TIERS.third;
const KITCHENS = [];                              // the tiers with kitchens on them
for (let t = 3; t <= 24; t++) KITCHENS.push(t);
const gOf = (t) => (DRUM.RH - (t + 1) * TIER_H) / DRUM.R;          // weight on tier t, in g
const GM = 9.81;

// the Third, built in full between RX0 and RX1 (its own true metres; z = 0 at the rail, the houses at z = -30)
const RX0 = -90, RX1 = 330;
const ZT = [-6, -10.4];                           // the long tables
const ZR = [-13.6, -19.9];                        // the drying racks (two bars each, 0.25 m either side)
const ZA = (ZR[0] - 0.25 + ZR[1] + 0.25) / 2;     // the aisle between them
const ZC = -23.2;                                 // the counters
const GAPS = [[50, 62], [141.5, 163.5]];              // across the terrace: where the flight comes in, and Abelone's court
const inGap = (x0, x1) => GAPS.some(([a, b]) => x1 > a && x0 < b);
const AB = { x: 147.6, z: -21.6 };                // Abelone, at the end of her counter
const RAILPOST = [161, 0.25];                     // where her strand goes over the rail
const WHEEL_X = 238;                              // the hoop at the rail, the way out
const BAYS = [];
const OPEN_YAW = { 0: -0.75, 9: -0.6, 18: 0.4, 27: -0.5 };     // the first cooks the flight passes turn toward it
for (let x = -63; x <= 322; x += 9) if (!(x > 150 && x < 172) && Math.abs(x - WHEEL_X) > 14) BAYS.push(x);

const STRAND = '#f4e8c8', KELP = '#d2d8a8', WOOD = '#8a6644', WOOD2 = '#a98458';

// ---------------------------------------------------------------- shader text: bending per vertex
// Every strand and curtain carries its own frame (a0, z0, floor radius), so one draw call holds all the tiers.
const BENDV = /* glsl */`
vec3 kBendAt(vec3 p, vec3 b) { if (b.z <= 0.0) return p; float a = b.x + p.x / b.z, r = b.z - p.y; return vec3(r * cos(a), r * sin(a), b.y + p.z); }
vec3 kBendDir(vec3 p, vec3 n, vec3 b) { if (b.z <= 0.0) return n; float a = b.x + p.x / b.z, c = cos(a), s = sin(a); return vec3(-s * n.x - c * n.y, c * n.x - s * n.y, n.z); }`;

// ---- curtains: a sheet of hanging strands drawn on one quad strip, threads near, hanks farther, a pale veil far off
const CURTAIN_VERT = /* glsl */`
attribute vec3 aBend; attribute vec4 aUV; attribute vec4 aSw; attribute vec2 aDir;
uniform float uTime, uSway;
varying vec3 vW; varying vec3 vN; varying vec4 vUV; varying float vOm;
${BENDV}
void main() {
  vec3 p = position;
  float d = clamp(aUV.y / aUV.z, 0.0, 1.0);
  float ph = aUV.w * 6.2831853;
  float s = aSw.w * uSway * d * d * (sin(uTime * aSw.z + ph + aUV.x * 0.23) + 0.3 * sin(uTime * aSw.z * 2.37 + ph * 3.1 + aUV.x * 0.61));
  p.x += aSw.x * s; p.z += aSw.y * s;
  vN = kBendDir(p, vec3(-aDir.y, 0.0, aDir.x), aBend);
  vW = kBendAt(p, aBend);
  vUV = aUV; vOm = aSw.z;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
}`;
const curtainFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uCol, uCol2; uniform float uTime, uCover, uGlow;
varying vec3 vW; varying vec3 vN; varying vec4 vUV; varying float vOm;
${rig.glsl}
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  float v = vUV.y, len = vUV.z, seed = vUV.w;
  float d = clamp(v / len, 0.0, 1.0);
  float u = vUV.x + 0.03 * d * sin(uTime * vOm * 1.9 + v * 1.1 + vUV.x * 5.0);
  float hk = u / 0.42; float hid = floor(hk), hf = fract(hk);
  float hlen = len * (0.8 + 0.2 * kHash(vec2(hid, seed * 97.0)));
  float q = u / 0.035; float id = floor(q);
  float fw = max(fwidth(q), 1e-3), fwh = fwidth(hk);
  float sl = hlen * (0.9 + 0.1 * kHash(vec2(id, seed * 31.0)));
  float hm = smoothstep(0.0, 0.07 + fwh, hf) * smoothstep(1.0, 0.93 - fwh, hf);
  float x = abs(fract(q) - 0.5);
  float thread = (1.0 - smoothstep(0.24 - 0.5 * fw, 0.24 + 0.5 * fw, x)) * step(v, sl) * hm;
  float hank = uCover * hm * (1.0 - smoothstep(hlen * 0.9, hlen, v));
  float far = uCover * 0.92 * (1.0 - smoothstep(len * 0.78, len, v));
  float a = mix(mix(thread, hank, smoothstep(0.3, 1.0, fw)), far, smoothstep(0.35, 1.0, fwh));
  if (a < 0.004) discard;
  vec3 base = mix(uCol, uCol2, step(0.86, kHash(vec2(hid, seed * 13.0)))) * (0.86 + 0.26 * kHash(vec2(id, seed)));
  vec3 up = kUp(vW); vec3 N = normalize(vN);
  vec3 Lg = max(kLight(vW, normalize(up * 0.55 + N * 0.45), vW, N), kLight(vW, normalize(up * 0.55 - N * 0.45), vW, -N));
  vec3 c = base * (Lg + uGlow);
  gl_FragColor = vec4(kAir(c, vW), a);
}`;

// ---- strands: thin ribbons that turn to face the eye, never thinner than a pixel (they fade instead), swinging about a pivot
const STRAND_VERT = /* glsl */`
attribute vec3 aBend, aPiv; attribute vec4 aTan, aSw, aMx;
uniform float uTime, uPx, uMinPx;
varying vec3 vW; varying float vA; varying float vX; varying float vArc; varying float vTone;
${BENDV}
vec3 kSwing(vec3 r, vec2 h, float th) {
  float rh = dot(r.xz, h); vec3 q = r - vec3(h.x * rh, r.y, h.y * rh);
  float c = cos(th), s = sin(th); float nh = rh * c - r.y * s, ny = rh * s + r.y * c;
  return q + vec3(h.x * nh, ny, h.y * nh);
}
void main() {
  vec2 h = vec2(cos(aSw.x), sin(aSw.x));
  vec3 r = position - aPiv;
  float th = aSw.y * sin(uTime * aSw.z + aSw.w - aMx.x * length(r));
  vec3 p = aPiv + kSwing(r, h, th);
  vec3 t = kSwing(aTan.xyz, h, th);
  vec3 w = kBendAt(p, aBend);
  vec3 W = kBendAt(p + t * 0.1, aBend) - w;
  vec3 V = cameraPosition - w; float dist = max(length(V), 0.01);
  vec3 S = cross(W, V); float sl = length(S);
  S = sl > 1e-7 ? S / sl : vec3(0.0, 0.0, 1.0);
  float px = aMx.z * uPx / dist;
  float shown = max(px, uMinPx);
  vA = px / shown; vX = aMx.y; vArc = aMx.w; vTone = aTan.w;
  w += S * (aMx.y * 0.5 * shown * dist / uPx);
  vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
const strandFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uCol; uniform float uGrow, uGlow;
varying vec3 vW; varying float vA; varying float vX; varying float vArc; varying float vTone;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  if (vArc > uGrow) discard;
  float a = vA * smoothstep(1.0, 0.5, abs(vX));
  vec3 up = kUp(vW);
  vec3 c = uCol * vTone * (kLight(vW, up, vW, up) * 0.85 + uGlow);
  gl_FragColor = vec4(kAir(c, vW), min(a, 1.0));
}`;

// A growing list of floats.
class Buf {
  constructor(n = 4096) { this.a = new Float32Array(n); this.n = 0; }
  room(k) { if (this.n + k > this.a.length) { const b = new Float32Array(Math.max(this.a.length * 2, this.n + k)); b.set(this.a.subarray(0, this.n)); this.a = b; } }
  p2(a, b) { this.room(2); this.a[this.n++] = a; this.a[this.n++] = b; }
  p3(a, b, c) { this.room(3); const A = this.a; A[this.n++] = a; A[this.n++] = b; A[this.n++] = c; }
  p4(a, b, c, d) { this.room(4); const A = this.a; A[this.n++] = a; A[this.n++] = b; A[this.n++] = c; A[this.n++] = d; }
  out() { return this.a.slice(0, this.n); }
}
class IBuf {
  constructor(n = 8192) { this.a = new Uint32Array(n); this.n = 0; }
  p3(a, b, c) { if (this.n + 3 > this.a.length) { const q = new Uint32Array(this.a.length * 2); q.set(this.a); this.a = q; } this.a[this.n++] = a; this.a[this.n++] = b; this.a[this.n++] = c; }
}

// Sheets of hanging strands.
class Curtains {
  constructor() { this.P = new Buf(1 << 18); this.B = new Buf(1 << 18); this.UV = new Buf(1 << 18); this.SW = new Buf(1 << 18); this.D = new Buf(1 << 17); this.I = new IBuf(1 << 18); this.nv = 0; }
  /** a sheet hanging len metres from a bar at height y running (x0, z0) to (x1, z1) in the frame bend = [a0, z0, R]. o: sway [sx, sz], om, amp, seed, rows, seg */
  add(bend, x0, z0, x1, z1, y, len, o) {
    const dx = x1 - x0, dz = z1 - z0, w = Math.hypot(dx, dz), ux = dx / w, uz = dz / w;
    const cols = Math.max(1, Math.ceil(w / (o.seg || 5))), rows = o.rows || 2, base = this.nv;
    const sw = o.sway || [-uz, ux], u0 = o.u0 || 0;
    for (let j = 0; j <= rows; j++) {
      const v = Math.pow(j / rows, 0.85) * len * 1.02;
      for (let i = 0; i <= cols; i++) {
        const u = (w * i) / cols;
        this.P.p3(x0 + ux * u, y - v, z0 + uz * u); this.B.p3(bend[0], bend[1], bend[2]);
        this.UV.p4(u + u0, v, len, o.seed); this.SW.p4(sw[0], sw[1], o.om, o.amp); this.D.p2(ux, uz);
        this.nv++;
      }
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = base + j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1; this.I.p3(a, c, b); this.I.p3(b, c, d); }
  }
  mesh(rig, opts) {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.P.out(), 3));
    g.setAttribute('aBend', new Float32BufferAttribute(this.B.out(), 3));
    g.setAttribute('aUV', new Float32BufferAttribute(this.UV.out(), 4));
    g.setAttribute('aSw', new Float32BufferAttribute(this.SW.out(), 4));
    g.setAttribute('aDir', new Float32BufferAttribute(this.D.out(), 2));
    g.setIndex(Array.from(this.I.a.subarray(0, this.I.n)));
    g.boundingSphere = new Sphere(new Vector3(0, 0, 200), DRUM.RH + 300);
    const m = new ShaderMaterial({
      uniforms: { ...rig.uniforms, uClip: G.uClip, uTime: G.uTime, uSway: { value: 1 }, uCol: { value: vec3col(STRAND) }, uCol2: { value: vec3col(KELP) }, uCover: { value: opts.cover || 0.55 }, uGlow: { value: opts.glow || 0.06 } },
      vertexShader: CURTAIN_VERT, fragmentShader: curtainFrag(rig), side: DoubleSide, transparent: true, depthWrite: false, blending: NormalBlending,
    });
    const mesh = new Mesh(g, m);
    mesh.renderOrder = 2;
    return mesh;
  }
}

// Single strands and loops.
class Strands {
  constructor() { this.P = new Buf(1 << 16); this.B = new Buf(1 << 16); this.PV = new Buf(1 << 16); this.T = new Buf(1 << 16); this.SW = new Buf(1 << 16); this.MX = new Buf(1 << 16); this.I = new IBuf(1 << 16); this.nv = 0; this.box = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; }
  /** pts: flat [x,y,z] in frame bend. o: piv, h (radians, the way it swings), amp, om, ph, lag, width, tone, arc0 (>= 0: hidden past uGrow) */
  add(pts, bend, o) {
    const n = pts.length, base = this.nv, piv = o.piv || pts[0];
    let arc = o.arc0 === undefined ? -1 : o.arc0;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
      if (i > 0 && arc >= 0) { const q = pts[i - 1]; arc += Math.hypot(pts[i][0] - q[0], pts[i][1] - q[1], pts[i][2] - q[2]); }
      for (const side of [-1, 1]) {
        this.P.p3(pts[i][0], pts[i][1], pts[i][2]); this.B.p3(bend[0], bend[1], bend[2]); this.PV.p3(piv[0], piv[1], piv[2]);
        this.T.p4(tx, ty, tz, o.tone || 1); this.SW.p4(o.h || 0, o.amp || 0, o.om || 1, o.ph || 0); this.MX.p4(o.lag || 0, side, o.width || 0.005, arc);
        this.nv++;
      }
    }
    for (let i = 0; i < n - 1; i++) { const a = base + 2 * i, b = a + 1, c = a + 2, d = a + 3; this.I.p3(a, b, c); this.I.p3(b, d, c); }
    const f = bend[2] > 0 ? (x, y, z) => { const ang = bend[0] + x / bend[2], r = bend[2] - y; return [r * Math.cos(ang), r * Math.sin(ang), bend[1] + z]; } : (x, y, z) => [x, y, z];
    for (const q of [pts[0], pts[n >> 1], pts[n - 1]]) { const w = f(q[0], q[1], q[2]); for (let k = 0; k < 3; k++) { this.box[k] = Math.min(this.box[k], w[k]); this.box[k + 3] = Math.max(this.box[k + 3], w[k]); } }
    return arc;
  }
  mesh(rig, opts = {}) {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.P.out(), 3));
    g.setAttribute('aBend', new Float32BufferAttribute(this.B.out(), 3));
    g.setAttribute('aPiv', new Float32BufferAttribute(this.PV.out(), 3));
    g.setAttribute('aTan', new Float32BufferAttribute(this.T.out(), 4));
    g.setAttribute('aSw', new Float32BufferAttribute(this.SW.out(), 4));
    g.setAttribute('aMx', new Float32BufferAttribute(this.MX.out(), 4));
    g.setIndex(Array.from(this.I.a.subarray(0, this.I.n)));
    const b = this.box, c = new Vector3((b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2);
    g.boundingSphere = new Sphere(c, Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]) / 2 + 60);
    const m = new ShaderMaterial({
      uniforms: { ...rig.uniforms, uClip: G.uClip, uTime: G.uTime, uPx: G.uPx, uMinPx: { value: opts.minPx || 1.3 }, uCol: { value: vec3col(opts.color || STRAND) }, uGrow: { value: 1e9 }, uGlow: { value: opts.glow || 0.08 } },
      vertexShader: STRAND_VERT, fragmentShader: strandFrag(rig), side: DoubleSide, transparent: true, depthWrite: false, blending: NormalBlending,
    });
    const mesh = new Mesh(g, m);
    mesh.renderOrder = 3;
    return mesh;
  }
}

// a U of noodle hanging from two hands (left and right, flat [x,y,z]), D metres deep: n points
function loopPts(l, r, D, n, bulge = [0, 0, 0]) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1), th = Math.PI * s, sn = Math.sin(th), k = Math.pow(sn, 0.42), b = 0.25 + 0.75 * sn;
    pts.push([l[0] + (r[0] - l[0]) * s + bulge[0] * b, l[1] + (r[1] - l[1]) * s - D * k, l[2] + (r[2] - l[2]) * s + bulge[2] * b]);
  }
  return pts;
}
// a cook at a bay at x = bx, turned yaw from facing straight out: where they stand, their hands, and how the loop swings
function bayHands(bx, yaw) {
  const cz = 1.22, c = Math.cos(yaw), s = Math.sin(yaw);
  const hand = (lx) => [bx + lx * c + 0.62 * s, 1.3, cz - lx * s + 0.62 * c];
  return { p: [bx, 0.08, cz], l: hand(-0.55), r: hand(0.55), piv: [bx + 0.62 * s, 1.3, cz + 0.62 * c], h: Math.atan2(c, s), ax: [c, -s] };
}
// a strand slung between two points, sagging sag metres
function swagPts(a, b, sag, n) {
  const pts = [];
  for (let i = 0; i < n; i++) { const u = i / (n - 1); pts.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - 4 * sag * u * (1 - u), a[2] + (b[2] - a[2]) * u]); }
  return pts;
}

// ---------------------------------------------------------------- the plan of the Hollow
// Shapes of one kind are merged into one path and painted once: the plan paints a little each frame, and every
// separate fill costs a turn.
export function* paintDulse(plan) {
  const rng = makeRng('dulse-plan');
  const merge = (list) => { const p = new Path2D(); for (const q of list) p.addPath(q); return p; };
  const lines = (list) => { const p = new Path2D(); for (const pts of list) pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); return p; };
  plan.fill(plan.band(0, L), { color: '#bdb07e', life: 0.5 });
  plan.mottle(['#c6b886', '#b0a474', '#cfc08e', '#a99d6e', '#c0ac78', '#aaa67a', '#c8ae76'], 200, 360, { alpha: 0.5, seed: 'dulse-m' });
  plan.mottle(['#bfb482', '#ada172', '#cbbb8b'], 160, 110, { alpha: 0.3, seed: 'dulse-m2' });
  // under the walls, where the line does not reach: herb beds under lamps, in long rows right round
  const beds = [[], [], [], []], lampLines = [];
  for (const [z0, z1] of [[380, 700], [L - 700, L - 380]]) {
    plan.fill(plan.band(z0, z1), { color: '#7f8a5c', alpha: 0.7, feather: 30, life: 0.25 });
    for (let z = z0 + 10, k = 0; z < z1 - 6; z += 13, k++) {
      beds[k % 4].push([[-60, z], [C + 60, z]]);
      if (k % 3 === 1) lampLines.push([[-60, z + 6], [C + 60, z + 6]]);
    }
  }
  ['#6f8a52', '#8a9a5a', '#a2a064', '#7a9466'].forEach((c, i) => plan.stroke(lines(beds[i]), 5, { color: c }));
  yield 'plan: herbs';
  // the long lakes: kelp-dark water, one on our bank and a longer one overhead
  const lakes = [[X0 + C / 2 + 150, 1950, 1250, 430, 3], [X0 + 1500, 2500, 520, 260, 7], [X0 - 1900, 1400, 420, 300, 9]];
  const shore = [], water = [], deep = [];
  for (const [lx, lz, rx, rz, s] of lakes) { const lake = plan.blob(lx, lz, rx, rz, { wobble: 0.18, lobes: 6, seed: s }); shore.push(lake); water.push(lake); deep.push(plan.blob(lx, lz, rx * 0.8, rz * 0.7, { wobble: 0.2, lobes: 5, seed: s + 1 })); }
  plan.stroke(merge(shore), 40, { color: '#d6c69c', paved: 0.3, life: 1, clear: ['wood'] });
  plan.fill(merge(water), { color: '#4f8478', water: 1, clear: ['life', 'paved', 'wood'] });
  plan.fill(merge(deep), { color: '#2f6460', feather: 50 });
  const offLake = (x, z, m) => { for (const [lx, lz, rx, rz] of lakes) { let dx = x - lx; dx = ((dx % C) + C * 1.5) % C - C / 2; if ((dx / (rx + m)) ** 2 + ((z - lz) / (rz + m)) ** 2 < 1) return false; } return true; };
  yield 'plan: lakes';
  // groves, in four colours
  const groves = [[], [], [], []];
  for (let i = 0; i < 420; i++) {
    const x = rng.f(0, C), z = rng.f(760, L - 760), r = rng.f(14, 70);
    if (!offLake(x, z, 90)) continue;
    groves[i % 4].push(plan.blob(x, z, r, r * rng.f(0.6, 1.1), { wobble: 0.3, lobes: 4, seed: i + 1, n: 20 }));
  }
  ['#7f8f58', '#88945c', '#76885a', '#93955e'].forEach((c, i) => plan.fill(merge(groves[i]), { color: c, wood: 1, clear: ['life'] }));
  yield 'plan: groves';
  // walks, lit: rings round the floor and lanes the length of it
  const ring = (z, wob) => { const a = []; for (let i = 0; i <= 120; i++) a.push([(i / 120) * C, z + Math.sin(i * 0.41 + z) * wob]); return a; };
  const wide = [ring(740, 0), ring(L - 740, 0)], narrow = [];
  for (const z of [1250, 1850, 2450, 3000]) narrow.push(ring(z, 30));
  for (let i = 0; i < 16; i++) { const x = (i / 16) * C + 90; narrow.push([[x, 740], [x + 40, 1500], [x - 30, 2300], [x, L - 740]]); }
  plan.stroke(lines(wide), 9, { color: '#d8caa2', paved: 0.8, life: 0.8, clear: ['wood'] });
  plan.stroke(lines(narrow), 5, { color: '#d8caa2', paved: 0.8, life: 0.8, clear: ['wood'] });
  const lampPts = [];
  const along = (pts, sp) => { let carry = 0; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); let d = carry; while (d < len) { const t = d / len; lampPts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += sp; } carry = d - len; } };
  for (const w of wide) along(w, 24);
  narrow.forEach((w, i) => { if (i < 4 || i % 2 === 0) along(w, 40); });
  for (const q of lampLines) along(q, 22);
  plan.dots(lampPts, 2.0, { lamp: 0.8 });
  for (const q of lampPts) plan.features.push({ type: 'lamp', x: ((q[0] % C) + C) % C, z: q[1], h: 4.5 });
  yield 'plan: walks';
  // the halls' long tables out on the lawns: pale lines of people in blocks
  const under = [], tabs = [];
  for (let i = 0; i < 80; i++) {
    const x = rng.f(0, C), z = rng.f(820, L - 820), n = rng.i(4, 9), len = rng.f(50, 140), a = rng.f(-0.3, 0.3) + (rng.chance(0.5) ? 0 : Math.PI / 2);
    if (!offLake(x, z, 160)) continue;
    const ca = Math.cos(a), sa = Math.sin(a);
    under.push([[x - ca * len / 2, z - sa * len / 2], [x + ca * len / 2, z + sa * len / 2]]);
    for (let k = 0; k < n; k++) { const o = (k - (n - 1) / 2) * 6.4; tabs.push([[x - ca * len / 2 - sa * o, z - sa * len / 2 + ca * o], [x + ca * len / 2 - sa * o, z + sa * len / 2 + ca * o]]); }
  }
  plan.stroke(lines(under), 50, { color: '#cbbd92', alpha: 0.6, life: 0.6, clear: ['wood'], cap: 'butt' });
  plan.stroke(lines(tabs), 2.6, { color: '#e6dab6', life: 1, paved: 0.4, cap: 'butt' });
  yield 'plan: tables';
}

// ---------------------------------------------------------------- people with arms: the cooks who pull
const cookCache = new Map();
function cookGeo(skin) {
  if (cookCache.has(skin)) return cookCache.get(skin);
  const g = new Geo();
  g.tint(0.25).box(-0.15, 0, -0.1, 0.15, 0.86, 0.1, '#4a4440');
  g.tint(1).cyl(0, 0.82, 0, 0.22, 0.18, 0.62, 6, '#ffffff', { smooth: false });
  g.tint(0).box(-0.17, 0.45, 0.13, 0.17, 1.28, 0.17, '#f3efe4');
  g.blob(0, 1.6, 0, 0.13, 0, skin, { shadeBottom: 0.8 });
  g.cyl(0, 1.66, 0, 0.12, 0.13, 0.12, 6, '#f6f2ea');
  g.tint(1);
  for (const s of [-1, 1]) g.tube([[s * 0.21, 1.38, 0], [s * 0.34, 1.16, 0.28], [s * 0.53, 1.3, 0.58]], 0.055, 5, '#ffffff');
  g.tint(0);
  for (const s of [-1, 1]) g.blob(s * 0.55, 1.3, 0.62, 0.06, 0, skin, { shadeBottom: 0.85 });
  const geo = g.build();
  cookCache.set(skin, geo);
  return geo;
}
// a cook seen from a tier away: body, apron, head and two arms held out, in boxes
let farCookGeo = null;
function farCook() {
  if (farCookGeo) return farCookGeo;
  const g = new Geo();
  g.tint(1).box(-0.19, 0, -0.12, 0.19, 1.42, 0.12, '#ffffff', { skip: 'b' });
  g.tint(0).box(-0.15, 0.5, 0.12, 0.15, 1.3, 0.15, '#f3efe4', { skip: 'bn' });
  g.box(-0.11, 1.45, -0.1, 0.11, 1.72, 0.12, '#c99a72', { skip: 'b' });
  g.tint(1).box(-0.6, 1.22, 0.05, -0.17, 1.34, 0.66, '#ffffff', { skip: 'b' }).box(0.17, 1.22, 0.05, 0.6, 1.34, 0.66, '#ffffff', { skip: 'b' });
  farCookGeo = g.build();
  return farCookGeo;
}
// someone standing, seen from a tier away: two boxes
let farStandGeo = null;
function farStand() {
  if (farStandGeo) return farStandGeo;
  const g = new Geo();
  g.tint(0.3).box(-0.16, 0, -0.1, 0.16, 0.85, 0.1, '#5a5650', { skip: 'b' });
  g.tint(1).box(-0.2, 0.85, -0.12, 0.2, 1.45, 0.12, '#ffffff', { skip: 'b' });
  g.tint(0).box(-0.11, 1.45, -0.1, 0.11, 1.7, 0.12, '#c99a72', { skip: 'b' });
  farStandGeo = g.build();
  return farStandGeo;
}
// a seated figure for the far tables: two boxes
function farSitter() {
  const g = new Geo();
  g.tint(1).box(-0.2, 0.0, -0.13, 0.2, 0.66, 0.13, '#ffffff', { skip: 'b' });
  g.tint(0).box(-0.11, 0.7, -0.1, 0.11, 0.95, 0.11, '#c99a72', { skip: 'b' });
  return g.build();
}
function bowlGeo(lid) {
  const g = new Geo();
  g.lathe(0, 0, 0, [[0.05, 0], [0.11, 0.035], [0.13, 0.08]], 6, '#ece4d2');
  if (lid) g.lathe(0, 0.08, 0, [[0.135, 0], [0.08, 0.045], [0.0, 0.06]], 6, '#d9cfba');
  else {
    g.extrude([[0.12, 0], [0.075, 0.094], [-0.027, 0.117], [-0.108, 0.052], [-0.108, -0.052], [-0.027, -0.117], [0.075, -0.094]].map((q) => [q[0], -q[1]]), 0.07, 0.001, '#b5853a', { noSides: true });
    g.extrude([[0.07, 0], [0.035, 0.06], [-0.035, 0.06], [-0.07, 0], [-0.035, -0.06], [0.035, -0.06]].map((q) => [q[0], -q[1]]), 0.072, 0.001, '#f2e6c2', { noSides: true });
  }
  return g.build();
}

// ---------------------------------------------------------------- the Third: kitchens in full
function* buildThird(hollow, T, ctx, strands, glows, steam) {
  const rng = makeRng('dulse-third');
  const g = new Geo({ maxSeg: 8 });
  let t0 = performance.now();
  // a paved floor over the terrace's beds
  g.floor(RX0, -29.9, RX1, -0.3, 0.07, '#a88d68');
  g.floor(RX0, -0.3, RX1, 0.05, 0.075, '#9c8462');
  // the rail between the bays, and the bays: slabs out over the drop where the cooks pull
  const railStops = []; for (const b of BAYS) railStops.push([b - 1.3, b + 1.3]);
  railStops.sort((a, b) => a[0] - b[0]);
  let rx = RX0;
  for (const [a, b] of [...railStops, [RX1, RX1]]) {
    if (a > rx + 0.2) {
      g.box(rx, 0, 0.05, a, 0.14, 0.32, '#cdbf9e', { skip: 'b' });
      g.box(rx, 0.98, 0.04, a, 1.08, 0.34, '#d9ccad', { skip: 'b', top: '#e8dcc0' });
      for (let x = rx + 0.4; x < a; x += 1.5) g.box(x - 0.045, 0.14, 0.14, x + 0.045, 0.98, 0.24, '#bfae8c', { skip: 'bt' });
    }
    rx = Math.max(rx, b);
  }
  for (const bx of BAYS) {
    g.box(bx - 1.25, -0.22, 0.0, bx + 1.25, 0.08, 1.45, WOOD, { top: WOOD2 });
    for (const s of [-1, 1]) {
      for (const pz of [0.35, 0.9, 1.4]) g.box(bx + s * 1.22 - 0.04, 0.03, pz - 0.04, bx + s * 1.22 + 0.04, 1.0, pz + 0.04, '#7a5c40', { skip: 'bt' });
      g.box(bx + s * 1.22 - 0.05, 0.98, 0.0, bx + s * 1.22 + 0.05, 1.06, 1.45, '#c8b48e', { skip: 'b' });
      g.tube([[bx + s * 1.0, -0.2, 1.3], [bx + s * 1.0, -1.7, 0.05]], 0.05, 4, '#6e5440');                    // struts under the slab
    }
    g.cyl(bx + 0.85, 0.03, 0.35, 0.24, 0.27, 0.5, 7, '#e9e1cc', { top: '#f7f3ea' });                       // flour tub
  }
  yield 'third: rail and bays';
  // the long tables, their benches, and lamp posts strung with lights
  const sit = [], bowls = [], lidded = [];
  for (const zt of ZT) {
    for (let x = RX0 + 2; x + 16 <= RX1; x += 18.5) {
      if (inGap(x - 1, x + 17)) continue;
      g.box(x, 0.72, zt - 0.45, x + 16, 0.78, zt + 0.45, '#a07a50', { top: '#bd935f' });
      for (let lx = x + 0.4; lx < x + 16; lx += 3.8) for (const s of [-1, 1]) g.box(lx - 0.05, 0, zt + s * 0.36 - 0.05, lx + 0.05, 0.72, zt + s * 0.36 + 0.05, '#6e5238', { skip: 'bt' });
      for (const s of [-1, 1]) {
        const zb = zt + s * 0.8;
        g.box(x, 0.4, zb - 0.17, x + 16, 0.46, zb + 0.17, '#8a6844', { top: '#9c7a52' });
        for (let lx = x + 0.4; lx < x + 16; lx += 3.8) g.box(lx - 0.05, 0, zb - 0.05, lx + 0.05, 0.4, zb + 0.05, '#6e5238', { skip: 'bt' });
        for (let px = x + 0.35; px < x + 15.8; px += 0.62 + rng.f(-0.03, 0.05)) {
          if (rng.chance(0.13)) continue;
          sit.push({ p: [px, 0.46, zb], sit: true, yaw: s < 0 ? 0 : Math.PI, color: rng.pick(CLOTH) });
          (rng.chance(0.25) ? lidded : bowls).push({ p: [px + rng.f(-0.05, 0.05), 0.78, zt - s * 0.22], yaw: rng.f(0, 6.28) });
        }
      }
      for (let k = 0; k < 5; k++) { const jx = x + rng.f(1, 15); g.cyl(jx, 0.78, zt + rng.f(-0.15, 0.15), 0.07, 0.05, 0.22, 6, rng.pick(['#7a8a8e', '#c9b48a', '#e8e0d0'])); }
      if (performance.now() - t0 > 4) { yield 'third: tables'; t0 = performance.now(); }
    }
  }
  const poles = [];
  for (let x = RX0 + 6; x < RX1; x += 12) if (!inGap(x - 1, x + 1) && Math.abs(x - WHEEL_X) > 6) poles.push(x);
  for (const x of poles) { g.cyl(x, 0, -3.4, 0.06, 0.05, 4.4, 5, '#5e4a38'); glows.push({ p: [x, 4.45, -3.4], color: '#ffd08a', power: 5, size: 0.3 }); }
  for (let i = 0; i < poles.length - 1; i++) {
    const a = poles[i], b = poles[i + 1]; if (b - a > 13) continue;
    for (let u = 0.08; u < 0.95; u += 0.1) glows.push({ p: [a + (b - a) * u, 4.3 - 1.1 * 4 * u * (1 - u), -3.4], color: rng.pick(['#ffcf86', '#ffe2b0', '#ffc070']), power: 3, size: 0.12, twinkle: 0.1 });
    strands.add(swagPts([a, 4.3, -3.4], [b, 4.3, -3.4], 1.1, 14), T.bend, { width: 0.008, tone: 0.5 });
  }
  yield 'third: lamps';
  // the drying racks: tall posts, two bars to a row, strands hanging from every bar (curtains are hung elsewhere)
  const rackAt = [];
  for (const zr of ZR) {
    for (let x = RX0; x + 6 <= RX1; x += 6) {
      if (inGap(x, x + 6)) continue;
      rackAt.push([x, zr]);
      g.box(x, 8.38, zr - 0.29, x + 6, 8.46, zr - 0.21, '#7a5c40'); g.box(x, 8.38, zr + 0.21, x + 6, 8.46, zr + 0.29, '#7a5c40');
      for (const px of [x, x + 6]) {
        g.box(px - 0.07, 0, zr - 0.36, px + 0.07, 8.7, zr - 0.22, '#6e5238', { skip: 'b' });
        g.box(px - 0.07, 0, zr + 0.22, px + 0.07, 8.7, zr + 0.36, '#6e5238', { skip: 'b' });
        g.box(px - 0.08, 8.7, zr - 0.4, px + 0.08, 8.85, zr + 0.4, '#7a5c40');
        g.box(px - 0.06, 0, zr - 0.7, px + 0.06, 0.12, zr + 0.7, '#5e4632');
      }
      for (let lx = x + 1.5; lx < x + 6; lx += 3) glows.push({ p: [lx, 8.15, zr], color: '#ffcf8a', power: 3.5, size: 0.2, twinkle: 0.05 });
    }
  }
  // ladders against the racks, a cook up each one hanging strands
  const ladders = [];
  for (let i = 0; i < 9; i++) {
    const [x, zr] = rng.pick(rackAt), lx = x + rng.f(1, 5), s = zr === ZR[0] ? 1 : -1;
    ladders.push([lx, zr + s * 0.9, s]);
    g.at(lx, 0, zr + s * 0.95, 0);
    for (const dx of [-0.32, 0.32]) g.box(dx - 0.03, 0, -0.03 + s * 0.45, dx + 0.03, 8.1, 0.03 + s * 0.45, '#b9a27c');
    g.pop();
  }
  yield 'third: racks';
  // strands strung across the aisle between the racks, where the flight passes under them
  for (let x = 61.5; x < 135; x += 1.15 + rng.f(-0.15, 0.2)) {
    const sag = rng.f(1.1, 1.8), a = [x, 8.42, ZR[0] - 0.25], b = [x + rng.f(-0.3, 0.3), 8.42, ZR[1] + 0.25], n = rng.i(1, 3);
    for (let k = 0; k < n; k++) {
      const pts = swagPts([a[0] + k * 0.04, a[1], a[2]], [b[0] + k * 0.04, b[1], b[2]], sag + k * 0.12, 22);
      strands.add(pts, T.bend, { piv: [(a[0] + b[0]) / 2, 8.42, (a[2] + b[2]) / 2], h: 0, amp: 0.07, om: Math.sqrt((GM * T.g) / (0.8 * sag)), ph: rng.f(0, 6.28), width: 0.005, tone: rng.chance(0.15) ? 0.9 : 1.05 });
    }
  }
  yield 'third: strung';
  // the kitchens against the houses: counters with pots, broth kettles, shelves of bowls
  const cooks = [];
  const counterRuns = [[RX0, 146.4], [176, RX1]];
  for (const [c0, c1] of counterRuns) {
    g.box(c0, 0, ZC - 0.6, c1, 0.92, ZC + 0.6, '#8a7a66', { top: '#cfc8b8' });
    for (let x = c0 + 1; x < c1 - 0.6; x += 2.3 + rng.f(-0.3, 0.4)) {
      if (x > 117 && x < 147) continue;                               // Abelone's end of the counter: hers, and empty
      const r = rng.f(0.26, 0.42), h = rng.f(0.3, 0.55);
      g.cyl(x, 0.92, ZC + rng.f(-0.2, 0.15), r, r * 0.96, h, 9, rng.pick(['#9a978e', '#a8a296', '#8c8a84']), { top: '#b8893c' });
      steam.push({ p: [x, 0.92 + h + 0.2, ZC], move: [rng.f(-0.03, 0.03), rng.f(0.18, 0.28), rng.f(0, 0.06)], loop: rng.f(6, 9), size: rng.f(0.6, 1.1), power: 0.2 });
      if (rng.chance(0.85)) cooks.push({ p: [x + rng.f(-0.3, 0.3), 0, ZC + 1.05], yaw: Math.PI + rng.f(-0.3, 0.3) });
    }
    for (let x = c0 + 3; x < c1 - 2; x += 7) {
      if (x > 112 && x < 150) continue;
      g.cyl(x, 0, -27.4, 0.95, 0.9, 1.45, 10, '#aaa69c', { top: '#8c887e' });
      g.cyl(x, 1.45, -27.4, 0.92, 0.3, 0.22, 10, '#c4beb2');
      for (let k = 0; k < 3; k++) steam.push({ p: [x + rng.f(-0.4, 0.4), 1.9, -27.4], move: [rng.f(-0.04, 0.04), rng.f(0.22, 0.32), rng.f(0.02, 0.1)], loop: rng.f(7, 10), size: rng.f(1.2, 2.0), power: 0.16 });
    }
    for (let x = c0; x < c1 - 0.1; x += 6) {
      const x1 = Math.min(c1, x + 5.6);
      g.box(x, 0, -29.85, x1, 2.4, -29.2, '#8a6a4a', { skip: 'b' });
      for (const y of [0.6, 1.2, 1.8]) g.box(x + 0.1, y, -29.6, x1 - 0.1, y + 0.32, -29.15, rng.pick(['#e8e0ce', '#ded4c0', '#efe8da']));
    }
    if (performance.now() - t0 > 4) { yield 'third: kitchens'; t0 = performance.now(); }
  }
  // Abelone: seventy-eight, alone at the end of her counter, drawing one strand out across the terrace
  const ayaw = Math.atan2(RAILPOST[0] - AB.x, RAILPOST[1] - AB.z);
  g.at(AB.x, 0, AB.z, ayaw);
  g.box(-0.15, 0, -0.1, 0.15, 0.8, 0.1, '#3e3a44');
  g.cyl(0, 0.78, 0, 0.24, 0.17, 0.6, 7, '#5c4a62', { smooth: false });
  g.box(-0.19, 0.4, 0.14, 0.19, 1.22, 0.18, '#f3efe4');
  g.blob(0, 1.5, 0.03, 0.13, 0, '#e3b48e', { shadeBottom: 0.8 });
  g.blob(0, 1.58, -0.06, [0.12, 0.1, 0.11], 0, '#d6d2ca'); g.blob(0, 1.62, -0.15, 0.07, 0, '#cfcac2');
  g.tube([[-0.22, 1.32, 0.02], [-0.3, 1.12, 0.24], [-0.12, 1.24, 0.42]], 0.05, 5, '#5c4a62');
  g.tube([[0.22, 1.32, 0.02], [0.32, 1.3, 0.3], [0.3, 1.44, 0.62]], 0.05, 5, '#5c4a62');
  g.blob(-0.12, 1.26, 0.46, 0.055, 0, '#e3b48e'); g.blob(0.3, 1.45, 0.66, 0.055, 0, '#e3b48e');
  g.pop();
  const ca = Math.cos(ayaw), sa = Math.sin(ayaw);
  const hand = [AB.x + 0.3 * ca + 0.66 * sa, 1.45, AB.z - 0.3 * sa + 0.66 * ca];
  // her bowl on the counter, the noodle going round it about forty times
  g.cyl(145.7, 0.92, ZC + 0.1, 0.16, 0.22, 0.12, 10, '#ece4d2', { top: '#b5853a' });
  for (let k = 0; k < 6; k++) g.cyl(145.7, 1.035 + k * 0.001, ZC + 0.1, 0.18 - k * 0.026, 0.18 - k * 0.026, 0.002, 12, k % 2 ? '#e8d8aa' : '#f6ecd0', { cap: false });
  g.box(141, 0.92, ZC - 0.4, 143.5, 0.97, ZC + 0.3, '#efe8d8');                                            // floured board
  for (let x = 120; x < 140; x += 0.75) {                                                                     // bowls waiting, one noodle each
    g.cyl(x, 0.92, ZC + 0.25, 0.1, 0.14, 0.09, 8, '#ece4d2', { top: x < 131 ? '#b5853a' : '#e2dccd' });
    if (x < 131) g.cyl(x, 1.012, ZC + 0.25, 0.08, 0.08, 0.002, 8, '#f3e7c2', { cap: true });
  }
  steam.push({ p: [145.7, 1.25, ZC + 0.1], move: [0, 0.12, 0.02], loop: 5, size: 0.35, power: 0.16 });
  for (let i = 0; i < 7; i++) g.blob(142.2 + (i % 4) * 0.62, 0.32 + Math.floor(i / 4) * 0.42, -25.6 + (i % 2) * 0.2, [0.32, 0.24, 0.26], 0, '#e8dfc8', { lump: 0.15, seed: i });
  g.box(150.5, 0.4, -24.6, 157.5, 0.46, -24.2, '#8a6844'); for (const lx of [151, 157]) g.box(lx - 0.05, 0, -24.5, lx + 0.05, 0.4, -24.3, '#6e5238');
  // the pegs her strand goes over, and the post at the rail
  const tops = [hand];
  for (const f of [0.3, 0.56, 0.8]) {
    const px = AB.x + (RAILPOST[0] - AB.x) * f, pz = AB.z + (RAILPOST[1] - AB.z) * f;
    g.cyl(px, 0, pz, 0.08, 0.06, 5.5, 6, '#6e5238'); g.box(px - 0.04, 5.45, pz - 0.18, px + 0.04, 5.6, pz + 0.18, '#7a5c40');
    g.cyl(px, 0, pz, 0.3, 0.3, 0.12, 6, '#5e4632');
    tops.push([px, 5.62, pz]);
  }
  g.cyl(RAILPOST[0], 0, RAILPOST[1], 0.09, 0.08, 2.3, 6, '#6e5238'); g.blob(RAILPOST[0], 2.32, RAILPOST[1], 0.11, 0, '#8a6a4a');
  tops.push([RAILPOST[0], 2.42, RAILPOST[1]]);
  let arc = 0;
  for (let i = 0; i < tops.length - 1; i++) {
    const a = tops[i], b = tops[i + 1], span = Math.hypot(b[0] - a[0], b[2] - a[2]), sag = 0.05 * span;
    const h = Math.atan2(b[0] - a[0], -(b[2] - a[2]));
    arc = strands.add(swagPts(a, b, sag, 30), T.bend, { piv: [(a[0] + b[0]) / 2, Math.max(a[1], b[1]), (a[2] + b[2]) / 2], h, amp: 0.05, om: 1.3, ph: i * 1.1, width: 0.022, tone: 2.6, arc0: arc });
  }
  // over the rail and down the face of the flats below: forty metres of one noodle
  const tail = [[RAILPOST[0], 2.42, RAILPOST[1]], [RAILPOST[0], 2.36, RAILPOST[1] + 0.12]];
  for (let y = 2.2; y > -42; y -= 1.2) tail.push([RAILPOST[0] + 0.05 * Math.sin(y * 0.4), y, RAILPOST[1] + 0.22]);
  const total = strands.add(tail, T.bend, { piv: tail[0], h: 0, amp: 0.035, om: Math.sqrt((GM * T.g) / 26), ph: 0.4, lag: 0.012, width: 0.022, tone: 2.6, arc0: arc });
  yield 'third: Abelone';
  // the cooks at the bays, each swinging a loop of noodle out over the drop
  const pullers = [];
  for (const bx of BAYS) {
    const short = bx === 18;                                    // a visiting cook: their strands break at about four metres
    const yaw = OPEN_YAW[bx] === undefined ? rng.f(-0.7, 0.7) : OPEN_YAW[bx], bh = bayHands(bx, yaw);
    pullers.push({ p: bh.p, yaw });
    const D = short ? 1.7 : rng.f(7.5, 11.5), rope = !short && rng.chance(0.3), n = short ? 4 : rope ? 2 : rng.i(10, 14);
    const om = Math.sqrt((GM * T.g) / (0.7 * D)), ph = rng.f(0, 6.28), amp = short ? 0.3 : rng.f(0.07, 0.12), tone = rng.chance(0.15) ? 1.25 : 1.5;
    for (let k = 0; k < n; k++) {
      const sp = rope ? (k - 0.5) * 0.08 : rng.f(-0.22, 0.22), out = rng.f(-0.1, 0.1);
      const pts = loopPts(bh.l, bh.r, D * (n > 1 ? rng.f(0.93, 1.04) : 1), 40, [bh.ax[0] * sp + bh.ax[1] * out, 0, bh.ax[1] * sp + bh.ax[0] * out]);
      strands.add(pts, T.bend, { piv: bh.piv, h: bh.h, amp, om, ph: ph + k * 0.03, lag: 0.015, width: rope ? 0.05 : 0.02, tone });
    }
    if (performance.now() - t0 > 4) { yield 'third: loops'; t0 = performance.now(); }
  }
  T.add(g.mesh(T.lit, T.frame));
  yield 'third: mesh';
  // people: breakfasters, cooks, onlookers by the bays, people walking with bowls
  const spots = [...sit];
  for (const [lx, lz, s] of ladders) spots.push({ p: [lx, 3.2 + rng.f(0, 2), lz + s * 0.25], walk: 0, yaw: s > 0 ? Math.PI : 0, color: '#efe9dc' });
  for (let x = RX0 + 1; x < RX1; x += rng.f(1.5, 4.5)) {
    if (x > -16 && x < 12) continue;                              // keep the first picture clear of passers-by
    spots.push({ p: [x, 0.03, -rng.f(0.7, 2.6)], walk: rng.chance(0.55) ? rng.f(1, 5) : 0, yaw: rng.f(-0.4, 0.4) + (rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2) });
  }
  for (let x = RX0 + 2; x < RX1; x += rng.f(4, 9)) { if (inGap(x - 2, x + 2) && x > 130) continue; spots.push({ p: [x, 0.03, rng.f(-12.6, -11.8)], walk: rng.chance(0.6) ? rng.f(1, 4) : 0 }); }
  for (let x = 66; x < 130; x += rng.f(5, 12)) spots.push({ p: [x, 0.03, ZA + rng.f(-1.6, 1.6)], walk: rng.chance(0.5) ? rng.f(0.8, 2) : 0 });
  for (let x = RX0 + 2; x < RX1; x += rng.f(6, 14)) spots.push({ p: [x, 0.03, rng.f(-25.5, -24.5)], walk: rng.chance(0.4) ? 1 : 0, yaw: Math.PI, color: '#ece6da' });
  for (let x = 150.9; x < 157.3; x += 0.62) spots.push({ p: [x, 0.46, -24.4], sit: true, yaw: -0.25 + rng.f(-0.1, 0.1) });
  for (let i = 0; i < 7; i++) { const px = AB.x + rng.f(4, 9), pz = AB.z + rng.f(0.5, 6); spots.push({ p: [px, 0.08, pz], walk: 0, yaw: Math.atan2(AB.x - px, AB.z - pz) + rng.f(-0.3, 0.3), color: rng.chance(0.5) ? '#ece6da' : undefined }); }
  const folk = crowd(spots, T.walk, { frame: T.frame, seed: 'dulse-third', bob: 0.22, speed: 0.7, cell: 120 });
  const cookItems = new Map();
  for (const c of [...cooks, ...pullers]) { const skin = rng.pick(SKIN); let a = cookItems.get(skin); if (!a) cookItems.set(skin, a = []); a.push({ ...c, color: rng.pick(['#e9e3d6', '#d8cfbe', '#c9563c', '#3f8a7a', '#e2c14a', '#7a4a2e']), scale: rng.f(0.94, 1.05) }); }
  for (const [skin, list] of cookItems) folk.push(...instances(cookGeo(skin), T.lit, list, { frame: T.frame, cell: 200 }));
  folk.push(...instances(bowlGeo(false), T.lit, bowls, { frame: T.frame, cell: 120 }));
  folk.push(...instances(bowlGeo(true), T.lit, lidded, { frame: T.frame, cell: 120 }));
  for (const b of bowls) if (rng.chance(0.3)) steam.push({ p: [b.p[0], 0.95, b.p[2]], move: [0, 0.1, 0.01], loop: rng.f(3.5, 5), size: 0.24, power: 0.12 });
  T.add(folk);
  return { folk, total, arcToRail: arc };
}

// ---------------------------------------------------------------- other tiers near the flight: bays, cooks, racks, tables
function* buildTier(hollow, k, strands, glows, xr) {
  const T = hollow.terrace(0, k, DEG), rng = makeRng('dulse-tier' + k);
  T.bend = [T.frame.a0, T.frame.z0, T.floorR];
  const g = new Geo({ maxSeg: 8 }), cooks = [], sitters = [], walkers = [];
  const R = T.floorR, x0 = xr[0] * R / 1025, x1 = xr[1] * R / 1025, d = T.depth;
  const bays = [];
  for (let x = x0; x < x1; x += rng.f(8, 15)) bays.push(x);
  let t0 = performance.now();
  for (const bx of bays) {
    if (performance.now() - t0 > 4) { yield 'tier ' + k + ': bays'; t0 = performance.now(); }
    g.box(bx - 1.2, -0.28, 0, bx + 1.2, 0.03, 1.6, WOOD, { top: WOOD2 });
    for (const s of [-1, 1]) g.box(bx + s * 1.2 - 0.05, 0.03, 0.05, bx + s * 1.2 + 0.05, 1.0, 1.6, '#a88a64', { skip: 'b' });
    const yaw = rng.f(-0.7, 0.7), bh = bayHands(bx, yaw);
    cooks.push({ p: bh.p, yaw, color: rng.pick(['#e9e3d6', '#d8cfbe', '#c9563c', '#3f8a7a']) });
    const D = rng.f(7, 11) * (gOf(THIRD) / T.g), n = rng.chance(0.2) ? 1 : rng.i(3, 5);
    const om = Math.sqrt((GM * T.g) / (0.7 * D)), ph = rng.f(0, 6.28), amp = rng.f(0.07, 0.11);
    for (let j = 0; j < n; j++) { const sp = rng.f(-0.35, 0.35); strands.add(loopPts(bh.l, bh.r, D * rng.f(0.94, 1.04), 18, [bh.ax[0] * sp, 0, bh.ax[1] * sp]), T.bend, { piv: bh.piv, h: bh.h, amp, om, ph: ph + j * 0.03, lag: 0.015, width: n === 1 ? 0.04 : 0.02, tone: 1.08 }); }
  }
  yield 'tier ' + k + ': bays';
  // racks: the same ones the curtains hang from
  for (const zr of rackRows(d)) {
    const i0 = Math.floor((x0 + Math.PI * R) / 6), i1 = Math.floor((x1 + Math.PI * R) / 6);
    for (let i = i0; i <= i1; i++) {
      if (!rackHere(k, i, zr)) continue;
      const x = -Math.PI * R + i * 6, bar = rackBar(d);
      g.box(x, bar - 0.04, zr - 0.04, x + 6, bar + 0.04, zr + 0.04, '#7a5c40');
      for (const px of [x, x + 6]) g.box(px - 0.06, 0, zr - 0.06, px + 0.06, bar + 0.2, zr + 0.06, '#6e5238', { skip: 'b' });
      glows.push({ k, p: [x + 3, bar - 0.25, zr], color: '#ffcf8a', power: 3, size: 0.2 });
    }
  }
  // a long table along the walk
  const zt = -Math.min(4.2, d * 0.38);
  if (k === 7 || k === 8 || k === 10 || k === 11) for (let x = -60 * R / 1025; x < 340 * R / 1025; x += 16 + rng.f(0, 6)) {
    g.box(x, 0.72, zt - 0.4, x + 14, 0.78, zt + 0.4, '#a07a50', { top: '#bd935f' });
    for (let px = x + 0.3; px < x + 13.8; px += 0.62) for (const s of [-1, 1]) if (rng.chance(0.6)) sitters.push({ p: [px, 0.42, zt + s * 0.75], yaw: s < 0 ? 0 : Math.PI, color: rng.pick(CLOTH), scale: [rng.f(0.9, 1.1), rng.f(0.9, 1.08), 1] });
  }
  for (let x = x0; x < x1; x += rng.f(3, 8)) walkers.push({ p: [x, 0.03, -rng.f(0.8, 2.4)], color: rng.pick(CLOTH), walk: [rng.chance(0.5) ? rng.f(1, 5) : 0, rng.f(0.4, 0.8) * (rng.chance(0.5) ? 1 : -1), rng.f(0, 6.28), 0.2], scale: rng.f(0.92, 1.06) });
  const out = [g.mesh(T.lit, T.frame)];
  out.push(...instances(farCook(), T.lit, cooks, { frame: T.frame, cell: 800 }));
  out.push(...instances(farSitter(), T.lit, sitters, { frame: T.frame, cell: 800 }));
  out.push(...instances(farStand(), T.walk, walkers, { frame: T.frame, cell: 800, walk: true }));
  T.add(out);
  yield 'tier ' + k;
  return { T, bays, meshes: out };
}
const rackRows = (d) => (d >= 24 ? [-d * 0.45, -d * 0.66] : d >= 16 ? [-d * 0.55] : [-Math.min(7.6, d * 0.68)]);
const rackBar = (d) => (d >= 16 ? 7.2 : 5.6);
const rackHere = (k, i, zr) => hash2(k * 7 + Math.round(-zr), i, 7) < 0.6;

// ---------------------------------------------------------------- curtains on every kitchen tier, right round the wall
function* hangCurtains(hollow, cur, bays) {
  const depths = hollow.wallDepths[0], rng = makeRng('dulse-curtains');
  let t0 = performance.now();
  for (const k of KITCHENS) {
    const tp = tierPlace(depths, k), R = DRUM.RH - tp.y, bend = [A0, tp.zRail, R], g = gOf(k), d = tp.depth;
    const half = Math.PI * R, bk = bays.get(k) || [];
    const nearBay = (a, b) => { for (const x of bk) if (b > x - 1.5 && a < x + 1.5) return true; return false; };
    // over the rail and down the face of the flats below: long hanks, longer on the lighter tiers
    for (let x = -half; x < half - 4;) {
      const w = rng.f(4, 13), gap = rng.f(1, 7);
      let a = x, b = Math.min(x + w, half);
      x = b + gap;
      if (k === THIRD && ((b > -40 && a < 60) || (b > RAILPOST[0] - 4 && a < RAILPOST[0] + 4) || (b > WHEEL_X - 10 && a < WHEEL_X + 10))) continue;
      if (nearBay(a, b)) { if (b - a < 6) continue; for (const bx of bk) if (bx > a - 1.5 && bx < b + 1.5) { if (bx - a > b - bx) b = bx - 1.6; else a = bx + 1.6; } if (b - a < 2) continue; }
      const len = Math.min(36, rng.f(0.7, 1.15) * 4.4 / g);
      const near = k >= 6 && k <= 13 && Math.abs(a) < 700;
      cur.add(bend, a, 0.42, b, 0.42, 1.02, len, { sway: [1, 0], om: Math.sqrt((GM * g) / (0.6 * len)), amp: 0.06 * len, seed: rng(), rows: near ? 3 : 1, seg: near ? 4 : 10 });
    }
    // racks on the terrace itself
    const bar = rackBar(d);
    for (const zr of k === THIRD ? ZR : rackRows(d)) {
      const n = Math.floor((2 * half) / 6);
      for (let i = 0; i < n; i++) {
        const x = -half + i * 6;
        if (k === THIRD) { if (x + 6 > RX0 && x < RX1) continue; if (hash2(k, i, Math.round(-zr)) > 0.6) continue; } else if (!rackHere(k, i, zr)) continue;
        const by = k === THIRD ? 8.42 : bar, len = by - rng.f(0.6, 1.2);
        for (const s of k === THIRD ? [-0.25, 0.25] : [0]) cur.add(bend, x + 0.08, zr + s, x + 5.92, zr + s, by, len, { sway: [0, 1], om: Math.sqrt((GM * g) / (0.5 * len)), amp: 0.025 * len, seed: rng(), rows: 1, seg: 6 });
      }
    }
    if (performance.now() - t0 > 4) { yield 'curtains'; t0 = performance.now(); }
  }
  // the Third's own racks, in full
  const tp = tierPlace(depths, THIRD), R = DRUM.RH - tp.y, bend = [A0, tp.zRail, R], g = gOf(THIRD);
  for (const zr of ZR) for (let x = RX0; x + 6 <= RX1; x += 6) {
    if (inGap(x, x + 6)) continue;
    for (const s of [-0.25, 0.25]) {
      const len = rng.f(7.3, 7.8);
      cur.add(bend, x + 0.1, zr + s, x + 5.9, zr + s, 8.36, len, { sway: [0, 1], om: Math.sqrt((GM * g) / (0.5 * len)), amp: 0.02 * len, seed: rng(), rows: 4, seg: 3, u0: x });
    }
  }
  yield 'curtains: third';
}

// ---------------------------------------------------------------- the hoop at the rail: the way out
function* buildHoop(hollow, T, path, strands) {
  const R = path.exit.radius, RR = R + 0.55, g = new Geo(), rng = makeRng('dulse-hoop');
  const ring = (r, z, n) => { const a = []; for (let i = 0; i <= n; i++) { const t = (i / n) * Math.PI * 2; a.push([Math.cos(t) * r, Math.sin(t) * r, z]); } return a; };
  g.tube(ring(RR, 0, 96), 0.2, 8, '#7a5636');
  g.tube(ring(RR + 0.42, 0, 96), 0.08, 5, '#8a6644');
  // one noodle wound round and round the hoop
  for (const [turns, ph, rad, col] of [[150, 0, 0.3, STRAND], [95, 1.3, 0.34, '#efe0b8']]) {
    yield 'hoop';
    const pts = [], N = turns * 7;
    for (let i = 0; i <= N; i++) { const f = (i / N) * Math.PI * 2, s = f * turns + ph; const rr = RR + rad * Math.cos(s); pts.push([Math.cos(f) * rr, Math.sin(f) * rr, rad * Math.sin(s)]); }
    g.tube(pts, 0.03, 4, col, { emit: 0.12 });
    yield 'hoop: winding';
  }
  // legs down to the rail
  const loc = T.frame.local(path.exit.pos, new Vector3());
  const floorY = -(loc.y), footZ = -(loc.z + 0.6);
  for (const s of [-1, 1]) {
    const a = -Math.PI / 2 + s * 0.55, px = Math.cos(a) * RR, py = Math.sin(a) * RR;
    g.tube([[px, py, 0], [px + s * 1.6, floorY, footZ]], 0.16, 6, '#6e5238');
    g.cyl(px + s * 1.6, floorY, footZ, 0.5, 0.4, 0.3, 6, '#5e4632');
  }
  const m = g.mesh(hollow.plain);
  m.position.copy(path.exit.pos); m.quaternion.copy(path.exit.quat);
  m.updateMatrixWorld(true);
  hollow.add(m);
  // lamps round the hoop, and hanks hung over its lower half, swinging slowly
  const lamps = [], v = new Vector3();
  for (let i = 0; i < 28; i++) { const t = (i / 28) * Math.PI * 2; v.set(Math.cos(t) * (RR + 0.5), Math.sin(t) * (RR + 0.5), 0.15).applyMatrix4(m.matrixWorld); lamps.push({ p: [v.x, v.y, v.z], color: '#ffd896', power: 6, size: 0.45, twinkle: 0.06, phase: i / 28 }); }
  const lampMesh = glowPoints(lamps, { maxPx: 80 });
  hollow.add(lampMesh);
  const om = Math.sqrt((GM * T.g) / 3);
  for (let i = 0; i < 26; i++) {
    const t = -Math.PI / 2 + rng.f(-1.25, 1.25), len = rng.f(2, 4.5);
    const top = [Math.cos(t) * (RR + 0.25), Math.sin(t) * (RR + 0.25), rng.f(-0.25, 0.25)];
    const pts = []; for (let j = 0; j <= 12; j++) pts.push([top[0] + rng.f(-0.01, 0.01), top[1] - (j / 12) * len, top[2]]);
    const wp = pts.map((q) => { v.set(q[0], q[1], q[2]).applyMatrix4(m.matrixWorld); return [v.x, v.y, v.z]; });
    const ax = new Vector3(0, 0, 1).transformDirection(m.matrixWorld);
    strands.add(wp, [0, 0, 0], { piv: wp[0], h: Math.atan2(ax.z, ax.x), amp: 0.08, om, ph: rng.f(0, 6.28), lag: 0.05, width: 0.008 });
  }
  return { mesh: m, lamps: lampMesh };
}

// ---------------------------------------------------------------- the dawn, slowly: [t, sun, power, far side, power, glow, power, rod, lamps, windows]
const SEQ = [
  [0, '#e7b866', 0.66, '#8a6634', 0.3, '#9a7848', 0.3, 18, 1.0, 0.2],
  [24, '#ecc278', 0.76, '#94703c', 0.34, '#a08050', 0.32, 22, 0.85, 0.17],
  [48, '#f0cc84', 0.88, '#9c7844', 0.38, '#a48858', 0.34, 27, 0.6, 0.14],
  [70, '#f4d494', 0.95, '#a07c48', 0.4, '#a88c5c', 0.35, 30, 0.5, 0.12],
];
const SEQC = SEQ.map((k) => [new Color(k[1]), new Color(k[3]), new Color(k[5])]);

export const dulseNoodle = {
  id: 'dulse-noodle',
  title: 'Hers don\'t break', drum: 'Dulse', row: 'Kelp Row', kind: 'a hall drum on the far side', light: 36.9,
  line: 'Abelone pulls one noodle per bowl. One. It goes round the bowl about forty times. My strands break at about four metres. Hers don\'t break.',
  tone: '#e7c27a', source: 'wander-year.md (Day 185: Dulse, Kelp Row), 15-canon.js (Dulse)',
  sound: { root: 47, scale: 'dorian', pad: 0.45, air: 0.25, crowd: 0.65, bells: 0.12, bright: 0.5, hum: 0.12 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    yield* paintDulse(plan);
    yield 'plan';
    const tiers = {};
    for (let i = 0; i < NT; i++) tiers[i] = KITCHENS.includes(i) ? { crowd: 0.85, garden: 0.12, lit: i === THIRD ? 0.05 : 0 } : { crowd: 0.35, garden: 0.7 };
    const wall = {
      lit: SEQ[0][9], crowd: 0.6, garden: 0.3, houseMix: 0.5, winA: '#ffa850', winB: '#ffd49a', winPower: 0.95,
      stone: '#c9b08a', stone2: '#b89a72', pave: '#a8906c', gardenColor: '#8f9c5a', awning: '#b8643a', glass: '#4a5560',
      houses: ['#b89a6e', '#9aa080', '#c08a5e', '#8e9c80', '#c8aa70', '#a87e62'], tiers,
    };
    const hollow = yield* buildHollow(ctx, {
      seed: 'dulse', plan, pavilions: false,
      light: { sun: SEQ[0][1], sunPower: SEQ[0][2], sunFar: SEQ[0][3], sunFarPower: SEQ[0][4], sunAngle: A0, sunSharp: 1.4, amb: SEQ[0][5], ambPower: SEQ[0][6], bounce: '#c9a860', bouncePower: 0.26, air: '#f0dcb0', airDensity: 0.00007, ground: '#ffb468', groundPower: 0.15 },
      sunline: { power: SEQ[0][7], halo: 300, haloPower: 0.04 },
      ground: { lamp: 0.6, lampColor: '#ffc27a', people: 1.0, sunRod: SEQ[0][7], wave: 0.012, stripes: 0.05, canopy: '#8a9a58' },
      front: wall, back: { ...wall },
    });
    yield 'hollow';
    const scene = new Scene();
    scene.add(hollow.group);
    const T = hollow.terrace(0, THIRD, DEG);
    T.bend = [T.frame.a0, T.frame.z0, T.floorR];
    const strands = new Strands(), cur = new Curtains(), glows = [], steam = [];
    const third = yield* buildThird(hollow, T, ctx, strands, glows, steam);
    // the tiers above and below, near the flight
    const bays = new Map([[THIRD, BAYS]]), tierGlows = [], near = [];
    for (const k of [6, 7, 8, 10, 11, 12]) {
      const r = yield* buildTier(hollow, k, strands, tierGlows, [-160, 440]);
      bays.set(k, r.bays); near.push(r);
    }
    yield* hangCurtains(hollow, cur, bays);
    const curMesh = cur.mesh(hollow.rig, { cover: 0.78, glow: 0.1 });
    hollow.add(curMesh);
    yield 'curtains: mesh';

    // ---- the flight
    const tf = (x, y, z) => { const v = hollow.frame.local(T.frame.point(x, y, z)); return [v.x, v.y, v.z]; };
    const k1 = DRUM.RH / T.floorR;
    const path = makePath([
      { t: 0, p: tf(-8, 2.6, 3.6) },
      { t: 6, p: tf(3, 1.4, 4.3), look: tf(10, -6, 2.0) },
      { t: 11, p: tf(30, 3.6, 2.4), look: tf(52, 2.4, -8) },
      { t: 15.5, p: tf(55.5, 3.3, -9.8), look: tf(70, 3.3, ZA) },
      { t: 20, p: tf(80, 3.3, ZA), look: tf(110, 3.5, ZA) },
      { t: 24.5, p: tf(128, 3.0, ZA), look: tf(AB.x, 1.4, AB.z) },
      { t: 28, p: tf(144, 1.85, -17.4), look: tf(AB.x + 0.6, 1.5, AB.z + 0.6) },
      { t: 31, p: tf(150, 4.0, -9), look: tf(RAILPOST[0], 2.2, 0) },
      { t: 33.5, p: tf(156, 4.4, 3), look: tf(RAILPOST[0], -10, 1) },
      { t: 37, p: tf(176, -6, 28), look: tf(156, -16, 0) },
      { t: 40.5, p: tf(200, 10, 85), look: tf(150, -5, 0) },
      { t: 43.5, p: [X0 + 340, 330, 540], look: [X0 + 260, 520, 0] },
      { t: 47, p: [X0 + 380, 280, 950], look: [X0 + 360, 850, 100], fov: 72 },
      { t: 51.5, p: [X0 + 360, 400, 600], look: tf(WHEEL_X, 10.4, 0), fov: 62 },
      { t: 55, p: tf(WHEEL_X, 24, 110), look: tf(WHEEL_X, 10.4, 0) },
      { t: 58, p: tf(WHEEL_X, 12, 36) },
      { t: 60.5, p: tf(WHEEL_X, 10.5, 11) },
      { t: 63, p: tf(WHEEL_X, 10.4, -6.5) },
    ], { frame: hollow.frame, entryRadius: 1.2, exitRadius: 8 });
    yield 'path';
    const hoop = yield* buildHoop(hollow, T, path, strands);
    yield 'hoop';
    const strandMesh = strands.mesh(hollow.rig, { glow: 0.08 });
    hollow.add(strandMesh);
    // lamps, and the steam off the pots
    const lampMesh = T.glow(glows, { maxPx: 70 });
    const steamMesh = T.glow(steam.map((s) => ({ ...s, color: '#fff2da', twinkle: 0 })), { minPx: 1, maxPx: 500, soft: 2.6 });
    const tierLamp = [];
    for (const r of near) { const list = tierGlows.filter((q) => r.T.tier === q.k); if (list.length) tierLamp.push(r.T.glow(list, { maxPx: 50 })); }
    yield 'lights';

    // ---- the dawn, slowly
    const rig = hollow.rig, sun = new Color(), farC = new Color(), amb = new Color();
    const growU = strandMesh.material.uniforms.uGrow;
    function light(t) {
      let i = 0; while (i < SEQ.length - 2 && SEQ[i + 1][0] <= t) i++;
      const a = SEQ[i], b = SEQ[i + 1], u = smoothstep(a[0], b[0], t), ca = SEQC[i], cb = SEQC[i + 1];
      const m = (j) => a[j] + (b[j] - a[j]) * u;
      sun.copy(ca[0]).lerp(cb[0], u); farC.copy(ca[1]).lerp(cb[1], u); amb.copy(ca[2]).lerp(cb[2], u);
      rig.set({ sun, sunPower: m(2), sunFar: farC, sunFarPower: m(4), amb, ambPower: m(6) });
      hollow.setRod(m(7));
      hollow.setNight(0.6 * m(8), m(9));
      lampMesh.material.uniforms.uPower.value = m(8);
      for (const l of tierLamp) l.material.uniforms.uPower.value = m(8);
      hoop.lamps.material.uniforms.uPower.value = 0.6 + 0.4 * m(8);
      // she draws it out and out
      growU.value = Math.min(third.total, third.arcToRail + 8 + 1.0 * t);
    }
    light(0);
    const mid3 = T.frame.point(150, 0, 0);
    return {
      scene, path, hollow, near: 0.12, far: 9000,
      look: { exposure: 1.6, bloom: 0.26, threshold: 0.8, saturation: 0.98, contrast: 1.07, vignette: 0.45, lift: [0.01, 0.006, 0.0], gain: [1.03, 1.0, 0.92] },
      portal: { rim: false, mist: '#e7c27a' },
      update(t, dt, camera) {
        light(t);
        // the crowds on the Third are too small to see from far out
        const far = camera.position.distanceTo(mid3) > 900;
        for (const mm of third.folk) mm.visible = !far;
        const away = camera.position.distanceTo(mid3) > 700;
        strandMesh.visible = !away;
        for (const r of near) for (const mm of r.meshes) mm.visible = !away;
      },
    };
  },
};
