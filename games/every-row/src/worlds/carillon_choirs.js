// Carillon, Bell Row: the evening of a sending, in the Hollow. Selkie is passing, seventeen light-minutes out, so every
// evening the choirs send it a piece and wait thirty-three minutes for the answer to begin (docs/wander-year.md, Day 140
// and Method, "The Passing"). Carillon is a hall drum and a drum of choirs: every block has one, and a round is sung at
// every naming, against itself (open-drums.md, Culture; games/three-nights/src/15-canon.js, Carillon). Its Hollow has
// "a choir lawn in a bowl of the floor, and lake terraces where rounds are practised"; its palette is Bell bronze.
//
// The flight starts on the bowl's lawns behind the backs of the highest rank, goes over the singers' heads and down
// across the ranks to the conductor as the piece ends and every singer raises a small light in a wave from the middle
// outward, lifts out over the far rim, runs down the reach where small choirs face each other across the water
// practising rounds, and climbs in a long turn over the lake to see the bowl as one ring of colour and light in the
// bronze land. Everyone in it is waiting.
//
// Not canon (the docs give the Hollow only the one line):
//   - the bowl: its size and shape (a round floor, thirty stepped ranks, four lawn terraces, a rim walk and a grass bank
//     outside), sixteen choirs standing in it in wedges by voice, each in its own two colours, two of them children's
//   - the conductor's stand in the middle, the banners with a small bronze bell on each pole, the lamps down the aisles
//   - the raised lights: every singer with a hand lamp lifts it as the piece is sent, and holds it through the gap;
//     lamp floats let go on the reach and the lake
//   - the reach: a curved water from the bowl to a lake, stepped stone terraces down both banks to the water, and the
//     small choirs on them facing each other across it
//   - the plan of the rest of the floor: lawns with small round choir lawns all over (one for each block's choir), walks,
//     groves, gardens, lakes, and woods in the Dim Ends
import {
  Scene, Color, ShaderMaterial, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, Mesh, Vector3, AdditiveBlending,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, NT, pavilionGeo } from '../kit/hollow.js';
import { makePath, nearPath } from '../core/path.js';
import { scatterTrees } from '../kit/flora.js';
import { crowd, figureGeo, SKIN } from '../kit/folk.js';
import { Geo, instances, mixc } from '../kit/geo.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG } from '../kit/mats.js';
import { makeRng, smoothstep, hash2 } from '../core/rng.js';

// ---------------------------------------------------------------- the shape of things
const BX = 3000, BZ = 1300;                 // the middle of the bowl
const R0 = 20;                              // its round floor
const NR = 30, RD = 1.45, RISE = 0.3;       // the singers' ranks: how many, how deep, how high each
const RS = R0 + NR * RD;                    // 63.5 m: back of the last rank
const YS = NR * RISE;                       // 9 m
const NLT = 4, LD = 6, LRISE = 0.75;        // lawn terraces for the listeners
const RL = RS + NLT * LD;                   // 87.5 m
const YR = YS + NLT * LRISE;                // 12 m: the rim
const RR = RL + 6;                          // the rim walk's outer edge
const RB = 142;                             // the foot of the bank outside
const NCH = 16;                             // choirs, one to a wedge, with an aisle between each
const AISLE = 0.8;                          // half the width of an aisle, metres
const NSEG = 256;                           // pieces round the bowl
// each choir in its own two colours: [A, B]; ranks by voice from the front: sopranos A, altos B, tenors A, basses B
const CHOIRS = [
  ['#b8322c', '#efe2c4'], ['#e2a232', '#6a2e22'], ['#2f8c88', '#e8d8b0'], ['#38479a', '#d8b860'],
  ['#efe6d2', '#9a2e3a'], ['#7c3a72', '#e6c088'], ['#4f8a3a', '#f0e2b8'], ['#5a9ccc', '#24325a'],
  ['#c4602a', '#e8b448'], ['#d9788c', '#5a2a3a'], ['#c9a24a', '#2c4a46'], ['#3c5a6c', '#e8b070'],
  ['#9c2a4a', '#f2c860'], ['#e8d49a', '#4a6a2a'], ['#2a6a5a', '#f0a050'], ['#6a4aa0', '#efe0c0'],
];
const CHILD_CHOIRS = [5, 12];
const VOICE = (k) => (k < 8 ? 0 : k < 15 ? 1 : k < 23 ? 0 : 1);
const VSHADE = (k) => (k < 8 ? 1.06 : k < 15 ? 1.0 : k < 23 ? 0.82 : 0.86);

// the reach: a curved water from the foot of the bowl's bank to the lake, with terraces down both banks
const REACH_KEYS = [[BX + 125, BZ], [BX + 260, BZ + 6], [BX + 385, BZ + 58], [BX + 462, BZ + 170], [BX + 465, BZ + 300], [BX + 400, BZ + 405], [BX + 320, BZ + 470]];
const RW = 28;                              // half the reach's width
const NSTEP = 5, SD = 2.2, SR = 0.4;        // terrace steps up from the water
const PROM = 7;                             // the walk along the top
const LAKE = { x: BX + 170, z: BZ + 540, rx: 290, rz: 165 };
const BRONZE = '#a8743a', BRONZE2 = '#c89a5a';

// a smooth line through points (Catmull-Rom), sampled about every `step` metres: [{ x, z, tx, tz, s }]
function sampleCurve(keys, step) {
  const out = [];
  const P = (i) => keys[Math.max(0, Math.min(keys.length - 1, i))];
  let s = 0, last = null;
  for (let i = 0; i < keys.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.ceil(len / step));
    for (let j = 0; j < n; j++) {
      const u = j / n, u2 = u * u, u3 = u2 * u;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      const x = f(p0[0], p1[0], p2[0], p3[0]), z = f(p0[1], p1[1], p2[1], p3[1]);
      if (last) s += Math.hypot(x - last.x, z - last.z);
      last = { x, z, s }; out.push(last);
    }
  }
  const e = keys[keys.length - 1]; s += Math.hypot(e[0] - last.x, e[1] - last.z); out.push({ x: e[0], z: e[1], s });
  for (let i = 0; i < out.length; i++) {
    const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    out[i].tx = (b.x - a.x) / l; out[i].tz = (b.z - a.z) / l;
  }
  return out;
}
const REACH = sampleCurve(REACH_KEYS, 6);
// a point beside the reach: side +1 is to the left going downstream, off = metres from the middle
const bank = (q, side, off) => [q.x - q.tz * side * off, q.z + q.tx * side * off];

// ---------------------------------------------------------------- the plan
const gather = () => { const m = new Map(); m.put = (key, shape) => { let p = m.get(key); if (!p) m.set(key, p = new Path2D()); p.addPath(shape); return m; }; return m; };
const nearBowl = (x, z, pad) => Math.hypot(x - BX, z - BZ) < RB + pad;
const nearLake = (x, z, pad) => ((x - LAKE.x) / (LAKE.rx + pad)) ** 2 + ((z - LAKE.z) / (LAKE.rz + pad)) ** 2 < 1;
function nearReach(x, z, pad) { for (let i = 0; i < REACH.length; i += 2) if (Math.hypot(REACH[i].x - x, REACH[i].z - z) < RW + pad) return true; return false; }
const busy = (x, z, pad) => nearBowl(x, z, pad) || nearLake(x, z, pad) || nearReach(x, z, pad + 30);

const WATERS = [[BX + C * 0.33, 2000, 360, 220, 21], [BX + C * 0.58, 1500, 300, 260, 22], [BX + C * 0.8, 2300, 420, 200, 23], [BX - 1300, 2500, 260, 180, 24]];
const inWater = (x, z) => WATERS.some(([ox, oz, rx, rz]) => { let dx = (((x - ox) % C) + C * 1.5) % C - C / 2; return (dx / (rx * 1.25 + 30)) ** 2 + ((z - oz) / (rz * 1.25 + 30)) ** 2 < 1; });
function* paintCarillon(plan) {
  const rng = makeRng('carillon-plan');
  plan.fill(plan.band(0, L), { color: '#929e70', life: 0.45 });
  plan.mottle(['#a6a87c', '#949e70', '#b0ac80', '#9aa474', '#b6b088', '#8e9a6c'], 110, 320, { alpha: 0.45, seed: 'carillon-lawn' });
  // the Dim Ends: woods under the walls, with lamplit walks through them
  plan.fill(plan.band(0, 700), { color: '#76805a', wood: 0.9, clear: ['life'] });
  plan.fill(plan.band(L - 700, L), { color: '#727c56', wood: 0.9, clear: ['life'] });
  const glades = gather();
  for (let i = 0; i < 40; i++) glades.put(rng.pick(['#8c9264', '#97986a', '#83895e']), plan.blob(rng.f(0, C), rng.chance(0.5) ? rng.f(380, 680) : rng.f(L - 680, L - 380), rng.f(40, 100), rng.f(30, 60), { seed: i + 3, n: 32 }));
  for (const [c, p] of glades) plan.fill(p, { color: c, clear: ['wood'], life: 0.4 });

  yield 'plan: ground';
  // walks: rings round the floor and lanes along it, lit
  const walks = gather(), lampLines = [];
  const ring = (z, wob) => { const a = []; for (let i = 0; i <= 128; i++) a.push([(i / 128) * C, z + Math.sin(i * 0.41 + z) * wob]); return a; };
  for (const z of [700, 1000, 1700, 2150, 2600, 3050]) { const r = ring(z, 24); walks.put(6, plan.line(r)); lampLines.push(r); }
  walks.put(9, plan.line(ring(L - 700, 0))); lampLines.push(ring(L - 700, 0));
  for (let i = 0; i < 32; i++) {
    const x = (i / 32) * C + 40, pts = [];
    for (let k = 0; k <= 24; k++) pts.push([x + Math.sin(k * 0.6 + i) * 28, 380 + (k / 24) * (L - 760)]);
    if (pts.some((q) => busy(q[0], q[1], 20))) continue;
    walks.put(5, plan.line(pts)); if (i % 2 === 0) lampLines.push(pts);
  }
  // wandering paths
  for (let i = 0; i < 60; i++) {
    let x = rng.f(0, C), z = rng.f(760, L - 760), a = rng.f(0, 6.28); const pts = [];
    for (let k = 0; k < 10; k++) { pts.push([x, z]); a += rng.f(-0.5, 0.5); x += Math.cos(a) * 36; z += Math.sin(a) * 36; }
    if (pts.some((q) => busy(q[0], q[1], 10))) continue;
    walks.put(3, plan.line(pts));
  }
  // the bowl's own walks: a ring round the foot of its bank, and avenues out from it
  const bring = []; for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; bring.push([BX + Math.cos(a) * (RB + 14), BZ + Math.sin(a) * (RB + 14)]); }
  walks.put(10, plan.line(bring)); lampLines.push(bring);
  const spokes = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const pts = [[BX + Math.cos(a) * (RB + 14), BZ + Math.sin(a) * (RB + 14)], [BX + Math.cos(a) * 520, BZ + Math.sin(a) * 520]];
    if ([0.25, 0.5, 0.75, 1].some((u) => { const x = BX + Math.cos(a) * (RB + 14 + u * 370), z = BZ + Math.sin(a) * (RB + 14 + u * 370); return nearLake(x, z, 40) || nearReach(x, z, 60); })) continue;
    walks.put(8, plan.line(pts)); lampLines.push(pts); spokes.push(pts);
  }
  for (const [w, p] of walks) plan.stroke(p, w, { color: '#d2c09a', paved: 0.8, life: 0.8, clear: ['wood', 'rows'] });
  for (const pts of lampLines) plan.lamps(pts, 28);
  for (const pts of spokes) plan.avenue(pts, 9, 12, { color: '#7e8a52' });
  plan.avenue(bring, 12, 13, { color: '#808a54' });

  yield 'plan: walks';
  // clumps and groves, gardens
  const clumps = gather();
  for (let i = 0; i < 620; i++) {
    const x = rng.f(0, C), z = rng.f(760, L - 760), r = rng.f(9, 34);
    if (busy(x, z, r + 30)) continue;
    clumps.put(rng.pick(['#86905a', '#909860', '#7c8854']), plan.blob(x, z, r, r * rng.f(0.6, 1.1), { wobble: 0.3, lobes: 4, seed: i + 1, n: 24 }));
  }
  for (const [c, p] of clumps) plan.fill(p, { color: c, wood: 1, clear: ['life', 'rows'] });
  for (let i = 0; i < 22; i++) {
    const x = rng.f(0, C), z = rng.f(850, L - 850), w = rng.f(80, 140), h = rng.f(60, 100);
    if (busy(x, z, 120)) continue;
    plan.garden(x - w / 2, z - h / 2, x + w / 2, z + h / 2, ['#d9a07a', '#e6c46a', '#c99aa0', '#b9b47a', '#e8b08a'], { seed: 'cg' + i, hedge: '#556240', gravel: '#d8c6a0' });
  }
  yield 'plan: clumps';
  // other waters round the floor
  for (const [ox, oz, rx, rz, s] of WATERS) {
    const b = plan.blob(ox, oz, rx, rz, { wobble: 0.2, lobes: 6, seed: s });
    plan.stroke(b, 26, { color: '#d8c6a0', paved: 0.7, life: 0.9, clear: ['wood'] });
    plan.fill(b, { color: '#6f9a92', water: 1, clear: ['life', 'paved', 'wood', 'rows'] });
    plan.fill(plan.blob(ox, oz, rx * 0.8, rz * 0.75, { wobble: 0.2, lobes: 5, seed: s + 9 }), { color: '#3f7a80' });
  }
  paintChoirLawns(plan, rng);
  yield 'plan: choir lawns';
  paintBowlAndReach(plan);
}

// every block has a choir: small round lawns all over the floor, each with its choir standing in a ring
function paintChoirLawns(plan, rng) {
  const lawn = new Path2D(), path = new Path2D(), rings = gather(), lamps = [];
  for (let i = 0; i < 150; i++) {
    const x = rng.f(0, C), z = rng.f(780, L - 780), r = rng.f(14, 26);
    if (busy(x, z, r + 40)) continue;
    lawn.addPath(plan.ellipse(x, z, r, r));
    path.addPath(plan.ellipse(x, z, r + 2, r + 2));
    rings.put(rng.pick(CHOIRS)[0], plan.ellipse(x, z, r * 0.45, r * 0.45));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; lamps.push([x + Math.cos(a) * (r + 2), z + Math.sin(a) * (r + 2)]); }
    plan.features.push({ type: 'choir', x, z, r });
  }
  plan.stroke(path, 3, { color: '#d8c6a0', paved: 0.8, life: 0.9, clear: ['wood'] });
  plan.fill(lawn, { color: '#b2ac7c', life: 0.5, clear: ['wood', 'rows'] });
  for (const [c, p] of rings) plan.stroke(p, 3.2, { color: c, life: 1 });
  plan.dots(lamps, 1.8, { lamp: 0.9 });
}

// the bowl's footprint (kept clear: the bowl is built), the reach with its terraces, and the lake it runs into
function paintBowlAndReach(plan) {
  const left = (off) => REACH.map((q) => bank(q, 1, off)), right = (off) => REACH.map((q) => bank(q, -1, off));
  const band = (o0, o1, side) => plan.poly([...(side > 0 ? left(o0) : right(o0)), ...(side > 0 ? left(o1) : right(o1)).reverse()]);
  const TW = NSTEP * SD + PROM;
  for (const side of [1, -1]) {
    plan.fill(band(RW - 2, RW + TW + 6, side), { color: '#8f9660', clear: ['life', 'wood', 'rows', 'lamp', 'water'] });
    plan.fill(band(RW - 2, RW + TW, side), { color: '#cdb48c', paved: 1 });
    plan.avenue(side > 0 ? left(RW + TW + 14) : right(RW + TW + 14), 0.1, 12, { color: '#7e8650' });
    plan.stroke(plan.line(side > 0 ? left(RW + TW + 24) : right(RW + TW + 24)), 6, { color: '#d2c09a', paved: 0.8, life: 0.9, clear: ['wood'] });
  }
  // the lake: a shore walk, lamps, and the water
  const lake = plan.blob(LAKE.x, LAKE.z, LAKE.rx, LAKE.rz, { wobble: 0.14, lobes: 6, seed: 41 });
  plan.stroke(lake, 40, { color: '#d6c29a', paved: 0.8, life: 1, clear: ['wood', 'rows'] });
  const shore = []; for (let i = 0; i <= 90; i++) { const a = (i / 90) * Math.PI * 2; shore.push([LAKE.x + Math.cos(a) * (LAKE.rx + 26), LAKE.z + Math.sin(a) * (LAKE.rz + 22)]); }
  plan.lamps(shore, 26);
  plan.avenue(shore.filter((_, i) => i % 2 === 0), 14, 15, { color: '#7e8650' });
  plan.fill(lake, { color: '#6a948e', water: 1, clear: ['life', 'paved', 'wood', 'rows', 'lamp'] });
  for (const [k, a] of [[0.86, 0.35], [0.7, 0.35], [0.52, 0.35]]) plan.fill(plan.blob(LAKE.x, LAKE.z, LAKE.rx * k, LAKE.rz * k, { wobble: 0.16, lobes: 5, seed: 42 }), { color: '#3a6c72', alpha: a });
  // the reach's water, darker down the middle
  plan.fill(plan.poly([...left(RW), ...right(RW).reverse()]), { color: '#5f8c88', water: 1, clear: ['life', 'paved', 'wood', 'rows', 'lamp'] });
  plan.stroke(plan.line(REACH.map((q) => [q.x, q.z])), RW * 1.1, { color: '#3d6f72', alpha: 0.7 });
  // the bowl's footprint: not quite water, which keeps the ground's own trees, people and pavilions off it
  plan.fill(plan.ellipse(BX, BZ, RB + 3, RB + 3), { color: '#8f9660', water: 0.28, clear: ['life', 'wood', 'rows', 'lamp', 'paved', 'water'] });
  plan.features.push({ type: 'bowl', x: BX, z: BZ });
}

// lift pavilions where cabs come up through the floor: painted everywhere, built only near the flight (the kit would build
// all eleven hundred, and the far bank shows most of them all the time)
function paintPavilions(plan) {
  const rng = makeRng('carillon-pav'), pav = [];
  for (let z = 820; z < L - 760; z += 170) for (let x = 0; x < C - 80; x += C / 55) {
    const px = x + rng.f(-28, 28), pz = z + rng.f(-28, 28);
    if (inWater(px, pz) || busy(px, pz, 30)) continue;
    pav.push([px, pz]);
  }
  plan.dots(pav, 9, { color: '#cbbb98', alpha: 0.9, paved: 1, clear: ['wood', 'rows'] });
  plan.dots(pav, 2.2, { lamp: 0.9 });
  return pav;
}

// ---------------------------------------------------------------- small helpers
const P = (r, a, y) => [BX + Math.cos(a) * r, y, BZ + Math.sin(a) * r];
// a four-sided face turned to look along `want` (a direction), whatever order its corners come in
function face(g, a, b, c, d, color, want, emit = 0) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
  if (nx * want[0] + ny * want[1] + nz * want[2] >= 0) g.quad(a, b, c, d, color, emit); else g.quad(a, d, c, b, color, emit);
}
const UP = [0, 1, 0];
const lin = (hex) => { const c = new Color(hex); return [c.r, c.g, c.b]; };
const scale3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// Lights that are raised: each comes on at its own moment, at the waist, and is lifted over the head and held there.
// The kit's glow points, with a start time per light. One draw call for all of them.
const RAISE_VERT = /* glsl */`
attribute vec3 aPos;      // where it is held before it is raised (flat)
attribute vec4 aCS;       // rgb x strength, size in metres
attribute vec3 aWhen;     // when it is raised (seconds of flight), a random number, how far it is lifted (metres)
${BEND_PARS}
uniform float uT, uTime, uPx, uMinPx, uMaxPx, uPower, uFar, uFade, uFadeNear, uFadeFar; uniform vec2 uRes;
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  float u = clamp((uT - aWhen.x) / 2.8, 0.0, 1.0);
  float e = u * u * (3.0 - 2.0 * u);
  float on = smoothstep(0.0, 0.2, u) * (0.3 + 0.7 * e) * (1.0 + 0.1 * sin(uTime * 2.3 + aWhen.y * 31.0));
  vec3 p = aPos + vec3(0.06 * sin(uTime * 0.8 + aWhen.y * 6.28) * e, aWhen.z * e + 0.04 * sin(uTime * 1.1 + aWhen.y * 40.0) * e, 0.0);
  vec3 n = vec3(0.0, 1.0, 0.0);
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vec4 mv = viewMatrix * wp;
  float dist = max(-mv.z, 0.01);
  float px = aCS.w * uPx / dist;
  float shown = clamp(px, uMinPx, uMaxPx);
  float k = min(pow(px / shown, uFar), 1.0);              // too far to fill a pixel: dim instead of shrinking (uFar = 2 is exact)
  k *= mix(uFade, 1.0, smoothstep(uFadeFar, uFadeNear, dist));    // a field of them far off should not wash out what holds them
  vC = aCS.rgb * k * on * uPower;
  vQ = position.xy;
  vec4 clip = projectionMatrix * mv;
  clip.xy += position.xy * shown / uRes * clip.w * 2.0;
  gl_Position = on > 0.0 ? clip : vec4(2.0, 2.0, 2.0, 1.0);
}`;
const RAISE_FRAG = /* glsl */`
${CLIP_PARS}
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  ${CLIP_FRAG}
  float r = length(vQ) * 2.0;
  float a = pow(max(1.0 - r, 0.0), 1.8);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;
function raisedLights(points, frame, opts = {}) {
  const n = points.length, g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const aPos = new Float32Array(n * 3), aCS = new Float32Array(n * 4), aWhen = new Float32Array(n * 3), c = new Color();
  for (let i = 0; i < n; i++) {
    const q = points[i];
    aPos.set(q.p, i * 3);
    c.set(q.color); aCS[i * 4] = c.r * q.power; aCS[i * 4 + 1] = c.g * q.power; aCS[i * 4 + 2] = c.b * q.power; aCS[i * 4 + 3] = q.size;
    aWhen[i * 3] = q.when; aWhen[i * 3 + 1] = q.phase; aWhen[i * 3 + 2] = q.lift;
  }
  g.setAttribute('aPos', new InstancedBufferAttribute(aPos, 3));
  g.setAttribute('aCS', new InstancedBufferAttribute(aCS, 4));
  g.setAttribute('aWhen', new InstancedBufferAttribute(aWhen, 3));
  g.instanceCount = n;
  const m = new ShaderMaterial({
    uniforms: {
      uClip: G.uClip, uTime: G.uTime, uPx: G.uPx, uRes: G.uRes, uT: { value: 0 },
      uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) },
      uMinPx: { value: opts.minPx || 1.3 }, uMaxPx: { value: opts.maxPx || 40 }, uPower: { value: 1 }, uFar: { value: opts.far || 1.5 }, uFade: { value: opts.fade === undefined ? 1 : opts.fade }, uFadeNear: { value: opts.fadeNear || 100 }, uFadeFar: { value: opts.fadeFar || 500 },
    },
    vertexShader: RAISE_VERT, fragmentShader: RAISE_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const mesh = new Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  return mesh;
}

// ---------------------------------------------------------------- figures
// A singer for the far ranks: a robe and a head, facing +z. Twenty triangles.
const farCache = new Map();
function farSinger(skin) {
  if (farCache.has(skin)) return farCache.get(skin);
  const g = new Geo();
  g.tint(1).box(-0.2, 0, -0.13, 0.2, 1.4, 0.13, '#ffffff', { skip: 'b' });
  g.tint(0).box(-0.1, 1.42, -0.1, 0.1, 1.68, 0.1, skin, { skip: 'b' });
  const geo = g.build(); farCache.set(skin, geo); return geo;
}
// A listener sitting on the grass, seen from behind or far off
const sitCache = new Map();
function farSitter(skin) {
  if (sitCache.has(skin)) return sitCache.get(skin);
  const g = new Geo();
  g.tint(1).box(-0.21, 0, -0.28, 0.21, 0.78, 0.14, '#ffffff', { skip: 'b' });
  g.tint(0).box(-0.1, 0.8, -0.1, 0.1, 1.04, 0.1, skin, { skip: 'b' });
  const geo = g.build(); sitCache.set(skin, geo); return geo;
}
// A conductor with both arms up, at the moment of holding the last chord: facing +z
function conductor(g, x, y, z, yaw, coat, k = 1) {
  g.at(x, y, z, yaw, k);
  g.box(-0.15, 0, -0.1, 0.15, 0.88, 0.1, '#2a2420');
  g.cyl(0, 0.82, 0, 0.27, 0.2, 0.68, 7, coat, { smooth: false });
  g.blob(0, 1.62, 0, 0.13, 0, SKIN[2], { shadeBottom: 0.8 });
  for (const s of [-1, 1]) {
    g.tube([[s * 0.2, 1.4, 0], [s * 0.42, 1.72, 0.12], [s * 0.5, 2.02, 0.2]], 0.05, 4, coat);
    g.blob(s * 0.5, 2.08, 0.22, [0.05, 0.07, 0.04], 0, SKIN[2]);
  }
  g.pop();
}

// ---------------------------------------------------------------- the bowl
const DA = (Math.PI * 2) / NCH;
const aisleAt = (c) => (c + 0.5) * DA;                 // aisles between the choirs; a choir's middle is at c * DA
const inAisle = (a, r, pad) => { const d = ((a / DA - 0.5) % 1 + 1) % 1; const m = Math.min(d, 1 - d) * DA * r; return m < AISLE + pad; };
const choirAt = (a) => ((Math.round(a / DA) % NCH) + NCH) % NCH;

function* buildBowl(hollow, lights, lod, statics) {
  const g = new Geo({ maxSeg: 16 }), rng = makeRng('carillon-bowl');
  let t0 = performance.now();
  const seg = (i) => (i / NSEG) * Math.PI * 2;
  const choirTint = CHOIRS.map((c) => lin(c[0]));
  const stone = lin('#c9ae86'), stone2 = lin('#b89c74'), riserC = lin('#6e5034'), lawnC = lin('#8c955a'), lawn2 = lin('#99a064');
  // the round floor: paving in rings, a bronze ring let into it
  const rings = [[0, 3.2, '#d6c6a4'], [3.2, 7.8, '#cbb690'], [7.8, 8.2, BRONZE2], [8.2, 13.5, '#d2c09c'], [13.5, 13.9, BRONZE2], [13.9, R0, '#c6b08a']];
  for (const [r0, r1, col] of rings) for (let i = 0; i < NSEG; i += 2) {
    const a0 = seg(i), a1 = seg(i + 2);
    if (r0 === 0) g.tri(P(0, 0, 0.06), P(r1, a1, 0.06), P(r1, a0, 0.06), col);
    else face(g, P(r0, a0, 0.06), P(r0, a1, 0.06), P(r1, a1, 0.06), P(r1, a0, 0.06), col, UP);
  }
  // the ranks: thirty steps of stone, each choir's wedge faintly in its colour, risers dark
  for (let k = 0; k < NR; k++) {
    const r0 = R0 + k * RD, r1 = r0 + RD, y0 = k ? k * RISE : 0.06, y1 = (k + 1) * RISE;
    for (let i = 0; i < NSEG; i++) {
      const a0 = seg(i), a1 = seg(i + 1), am = (a0 + a1) / 2;
      const j = 0.94 + 0.12 * hash2(k, i, 3), base = (k + i) % 2 ? stone : stone2;
      const tc = inAisle(am, r0, 0) ? lin('#e2d0aa') : mixc(base, choirTint[choirAt(am)], 0.16).map((v) => v * j);
      face(g, P(r0, a0, y1), P(r0, a1, y1), P(r1, a1, y1), P(r1, a0, y1), tc, UP);
      face(g, P(r0, a0, y0), P(r0, a1, y0), P(r0, a1, y1), P(r0, a0, y1), scale3(riserC, j), [-Math.cos(am), 0, -Math.sin(am)]);
    }
    if (performance.now() - t0 > 4) { yield 'bowl: ranks'; t0 = performance.now(); }
  }
  // the listeners' lawns, the rim walk, and the grass bank outside
  for (let j = 0; j < NLT; j++) {
    const r0 = RS + j * LD, r1 = r0 + LD, y0 = YS + j * LRISE, y1 = y0 + LRISE;
    for (let i = 0; i < NSEG; i++) {
      const a0 = seg(i), a1 = seg(i + 1), am = (a0 + a1) / 2, jj = 0.92 + 0.14 * hash2(j, i, 5);
      face(g, P(r0, a0, y1), P(r0, a1, y1), P(r1, a1, y1), P(r1, a0, y1), inAisle(am, r0, 0) ? lin('#d8c49e') : scale3((i + j) % 2 ? lawnC : lawn2, jj), UP);
      face(g, P(r0, a0, y0), P(r0, a1, y0), P(r0, a1, y1), P(r0, a0, y1), scale3(stone2, jj * 0.9), [-Math.cos(am), 0, -Math.sin(am)]);
    }
  }
  for (let i = 0; i < NSEG; i++) {
    const a0 = seg(i), a1 = seg(i + 1), am = (a0 + a1) / 2, jj = 0.92 + 0.14 * hash2(9, i, 5);
    face(g, P(RL, a0, YR), P(RL, a1, YR), P(RR, a1, YR), P(RR, a0, YR), scale3(lin('#d8c6a0'), jj), UP);
    face(g, P(RR, a0, YR), P(RR, a1, YR), P(RR, a1, YR + 0.5), P(RR, a0, YR + 0.5), lin('#c2a47a'), [-Math.cos(am), 0, -Math.sin(am)]);
    face(g, P(RR, a0, YR + 0.5), P(RR, a1, YR + 0.5), P(RR + 0.6, a1, YR + 0.5), P(RR + 0.6, a0, YR + 0.5), lin('#e2d2b0'), UP);
    const mid = RR + 0.6 + (RB - RR) * 0.45;
    face(g, P(RR + 0.6, a0, YR + 0.5), P(RR + 0.6, a1, YR + 0.5), P(mid, a1, YR * 0.42), P(mid, a0, YR * 0.42), scale3(lawnC, jj), [Math.cos(am), 1, Math.sin(am)]);
    face(g, P(mid, a0, YR * 0.42), P(mid, a1, YR * 0.42), P(RB, a1, 0.03), P(RB, a0, 0.03), scale3(lawn2, jj), [Math.cos(am), 1, Math.sin(am)]);
  }
  yield 'bowl: lawns';
  // stairs up the aisles of the lawns, and lamps at the foot of every step of every aisle
  for (let c = 0; c < NCH; c++) {
    const a = aisleAt(c), ca = Math.cos(a), sa = Math.sin(a);
    for (let k = 0; k < NR; k++) {
      const r = R0 + k * RD + 0.12, y = k * RISE + 0.14;
      for (const s of [-1, 1]) { const w = s * (AISLE + 0.12); lights.static.push({ p: [BX + ca * r - sa * w, y, BZ + sa * r + ca * w], color: '#ffc47a', power: 3.2, size: 0.16 }); }
    }
    for (let j = 0; j < NLT; j++) { const r = RS + j * LD + 0.12, y = YS + j * LRISE + 0.3; for (const s of [-1, 1]) { const w = s * (AISLE + 0.12); lights.static.push({ p: [BX + ca * r - sa * w, y, BZ + sa * r + ca * w], color: '#ffc47a', power: 3.2, size: 0.18 }); } }
  }
  // the conductor's stand
  g.cyl(BX, 0.06, BZ, 1.7, 1.6, 0.5, 16, '#8a6a48', { top: '#c9b089' });
  g.cyl(BX, 0.56, BZ, 1.55, 1.55, 0.06, 16, BRONZE, { emit: 0.05 });
  conductor(g, BX, 0.62, BZ, -Math.PI / 2, '#3a2c24');
  // banners at the rim, one in each choir's colours, a small bronze bell on top of each pole
  const gd = new Geo({ maxSeg: 16 });
  for (let c = 0; c < NCH; c++) {
    const a = c * DA, r = RL + 3, ca = Math.cos(a), sa = Math.sin(a), x = BX + ca * r, z = BZ + sa * r, tx = -sa, tz = ca;
    g.cyl(x, YR, z, 0.14, 0.1, 11.5, 6, '#4a3a2a');
    g.box(x - 0.1, YR + 10.9, z - 0.1, x + 0.1, YR + 11.1, z + 0.1, '#4a3a2a');
    const at = (w, y) => [x + tx * w, YR + y, z + tz * w];
    gd.quad(at(-1.0, 10.8), at(1.0, 10.8), at(1.0, 7.0), at(-1.0, 7.0), CHOIRS[c][0]);
    gd.quad(at(-1.0, 7.0), at(1.0, 7.0), at(1.0, 5.2), at(-1.0, 5.2), CHOIRS[c][1]);
    gd.tri(at(-1.0, 5.2), at(1.0, 5.2), at(0, 4.2), CHOIRS[c][1]);
    gd.tube([at(-1.15, 10.9), at(1.15, 10.9)], 0.06, 4, '#4a3a2a');
    gd.lathe(x, YR + 11.55, z, [[0.05, 0.75], [0.2, 0.66], [0.27, 0.38], [0.36, 0.06], [0.42, 0]], 10, BRONZE2, { emit: 0.08 });
  }
  statics.push(hollow.add(g.mesh(hollow.lit, hollow.frame)), hollow.add(gd.mesh(hollow.litDouble, hollow.frame)));
  // lamps round the rim walk
  const post = new Geo(); post.cyl(0, 0, 0, 0.08, 0.06, 3.4, 5, '#3e342a'); post.cyl(0, 3.4, 0, 0.22, 0.16, 0.42, 6, '#ffe2b0', { emit: 2.5 });
  const posts = [];
  for (let i = 0, n = Math.round((Math.PI * 2 * (RR - 0.5)) / 7); i < n; i++) {
    const a = (i / n) * Math.PI * 2, x = BX + Math.cos(a) * (RR - 0.5), z = BZ + Math.sin(a) * (RR - 0.5);
    posts.push({ p: [x, YR, z] }); lights.lamps.push({ p: [x, YR + 3.65, z], color: '#ffcf8a', power: 6, size: 0.9 });
  }
  statics.push(...hollow.add(instances(post.build(), hollow.lit, posts, { frame: hollow.frame, cell: 400 })));
  yield 'bowl: banners';
  yield* bowlPeople(hollow, lights, lod, rng);
}

// The singers, standing in their ranks facing the conductor; the listeners on the lawns and the rim; their lights.
// Whole figures near the line the camera flies down, plain ones elsewhere.
const SEND = 14.5;           // the moment the piece ends and the first lights go up, seconds into the flight
const WAVE = 5.0;            // metres a second the raised lights spread outward through the bowl
function* bowlPeople(hollow, lights, lod, rng) {
  const near = new Map(), far = new Map(), sitNear = [], sitFar = new Map();
  const put = (m, k, it) => { let a = m.get(k); if (!a) m.set(k, a = []); a.push(it); };
  const FARSKIN = [SKIN[0], SKIN[2], SKIN[4]];
  const nearLine = (z) => Math.abs(z - BZ) < 11;
  let t0 = performance.now();
  for (let k = 0; k < NR; k++) {
    const r = R0 + k * RD + RD * 0.42, y = (k + 1) * RISE;
    for (let c = 0; c < NCH; c++) {
      const child = CHILD_CHOIRS.includes(c), sp = child ? 0.5 : 0.62, sc = child ? 0.68 : 1;
      const pad = (AISLE + 0.35) / r, a0 = c * DA - DA / 2 + pad, a1 = c * DA + DA / 2 - pad;
      const n = Math.floor(((a1 - a0) * r) / sp), base = lin(CHOIRS[c][VOICE(k)]), sh = VSHADE(k);
      for (let i = 0; i < n; i++) {
        if (rng() < 0.035) continue;
        const a = a0 + ((i + 0.5) / n) * (a1 - a0) + rng.f(-0.12, 0.12) / r, ca = Math.cos(a), sa = Math.sin(a);
        const rr = r + rng.f(-0.12, 0.12), x = BX + ca * rr, z = BZ + sa * rr;
        const yaw = Math.atan2(-ca, -sa) + rng.f(-0.12, 0.12), kk = sh * rng.f(0.9, 1.08);
        const item = { p: [x, y, z], yaw, color: scale3(base, kk), scale: sc * rng.f(0.93, 1.06) };
        const skin = rng.pick(SKIN);
        if (nearLine(z)) put(near, skin, item); else put(far, FARSKIN[Math.floor(rng() * 3)], item);
        if (rng() < 0.9) {
          const d = 0.3 * sc;
          lights.raise.push({ p: [x - ca * d, y + 1.0 * sc, z - sa * d], color: rng.pick(['#ffd08a', '#ffc070', '#ffe0b0', '#ffd8a0', '#fff0d0']), power: rng.f(7, 10), size: 0.3,
            when: SEND + (rr - R0) / WAVE + rng.f(0, 0.9) + 0.35 * Math.sin(a * 3 + 1), phase: rng(), lift: 1.0 * sc + rng.f(-0.1, 0.15) });
        }
      }
    }
    if (performance.now() - t0 > 4) { yield 'singers'; t0 = performance.now(); }
  }
  // listeners sitting on the lawn terraces, most with lamps too, raised after the singers'
  for (let j = 0; j < NLT; j++) {
    const y = YS + (j + 1) * LRISE, ra = RS + j * LD + 0.6, rb = RS + (j + 1) * LD - 0.4;
    const n = Math.round(Math.PI * (rb * rb - ra * ra) * 0.3);
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2, r = Math.sqrt(ra * ra + rng() * (rb * rb - ra * ra));
      if (inAisle(a, r, 0.6)) continue;
      const ca = Math.cos(a), sa = Math.sin(a), x = BX + ca * r, z = BZ + sa * r;
      if (x < BX - 58 && Math.abs(z - BZ) < 5.5) continue;                    // the way the camera comes in
      const yaw = Math.atan2(-ca, -sa) + rng.f(-0.4, 0.4), color = rng.pick(['#c9563c', '#d98c2b', '#e2c14a', '#6f9a3e', '#3f8a7a', '#3a6ea5', '#a34b86', '#e7e1d3', '#8c8577', '#7a4a2e', '#c7a36a', '#efe6d2']);
      const child = rng() < 0.15;
      if (nearLine(z) && x < BX) sitNear.push({ p: [x, y, z], sit: !child, child, yaw, color });
      else put(sitFar, FARSKIN[Math.floor(rng() * 3)], { p: [x, y, z], yaw, color, scale: child ? 0.7 : rng.f(0.92, 1.08) });
      if (rng() < 0.45) lights.raise.push({ p: [x - ca * 0.35, y + 0.6, z - sa * 0.35], color: rng.pick(['#ffd08a', '#ffc070', '#ffe0b0']), power: rng.f(4, 6), size: 0.2,
        when: SEND + (r - R0) / WAVE + 0.8 + rng.f(0, 2), phase: rng(), lift: rng.f(0.9, 1.4) });
    }
    yield 'listeners';
  }
  // people standing all round the rim walk, a few strolling, some with lamps
  const rim = [];
  for (let i = 0; i < 520; i++) {
    const a = rng() * Math.PI * 2, r = rng.f(RL + 0.6, RR - 1.2), ca = Math.cos(a), sa = Math.sin(a), x = BX + ca * r, z = BZ + sa * r;
    if (x < BX - 60 && Math.abs(z - BZ) < 3.2) continue;
    const walk = rng() < 0.25 ? rng.f(1, 4) : 0;
    rim.push({ p: [x, YR, z], walk, yaw: Math.atan2(-ca, -sa) + rng.f(-0.5, 0.5), child: rng() < 0.12 });
    if (!walk && rng() < 0.4) lights.raise.push({ p: [x - ca * 0.3, YR + 1.0, z - sa * 0.3], color: '#ffd8a0', power: 5, size: 0.2, when: SEND + 10 + rng.f(0, 3), phase: rng(), lift: rng.f(1.0, 1.2) });
  }
  // and on the grass bank outside, people who came late, lying and sitting and walking up
  for (let i = 0; i < 260; i++) {
    const a = rng() * Math.PI * 2, u = rng.f(0.08, 0.95), r = RR + 0.6 + (RB - RR - 0.6) * u, ca = Math.cos(a), sa = Math.sin(a);
    const y = u < 0.45 ? YR + 0.5 + (YR * 0.42 - YR - 0.5) * (u / 0.45) : YR * 0.42 * (1 - (u - 0.45) / 0.55);
    rim.push({ p: [BX + ca * r, y - 0.05, BZ + sa * r], sit: rng() < 0.6, walk: rng() < 0.3 ? rng.f(1, 3) : 0, yaw: Math.atan2(ca, sa) + rng.f(-0.8, 0.8) });
  }
  const meshes = [];
  for (const [skin, list] of near) meshes.push(...instances(figureGeo(skin, 'stand'), hollow.lit, list, { frame: hollow.frame, cell: 200 }));
  yield 'bowl: near singers';
  for (const [skin, list] of far) lod.push(...instances(farSinger(skin), hollow.lit, list, { frame: hollow.frame, cell: 150 }).map((m) => [hollow.add(m), 5000]));
  yield 'bowl: far singers';
  for (const [skin, list] of sitFar) lod.push(...instances(farSitter(skin), hollow.lit, list, { frame: hollow.frame, cell: 150 }).map((m) => [hollow.add(m), 1600]));
  yield 'bowl: singers';
  meshes.push(...crowd(sitNear, hollow.walk, { frame: hollow.frame, seed: 'carillon-sit', cell: 200 }));
  for (const m of meshes) lod.push([hollow.add(m), 380]);
  for (const m of crowd(rim, hollow.walk, { frame: hollow.frame, seed: 'carillon-rim', bob: 0.12, cell: 300 })) lod.push([hollow.add(m), 700]);
  yield 'bowl: people';
}

// ---------------------------------------------------------------- the reach
// a point on the reach's middle line at s metres from its start
function atS(s) {
  let i = 0; while (i < REACH.length - 2 && REACH[i + 1].s < s) i++;
  const a = REACH[i], b = REACH[i + 1], u = Math.max(0, Math.min(1, (s - a.s) / (b.s - a.s || 1)));
  const tx = a.tx + (b.tx - a.tx) * u, tz = a.tz + (b.tz - a.tz) * u, l = Math.hypot(tx, tz) || 1;
  return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, tx: tx / l, tz: tz / l, s };
}
const TOP = NSTEP * SR, BACK = RW - 1 + NSTEP * SD + PROM;
const terraced = (q, side) => { const [x, z] = bank(q, side, RW); return q.s > 34 && !nearLake(x, z, -8); };

function* buildReach(hollow, lights, lod, statics) {
  const g = new Geo({ maxSeg: 16 }), rng = makeRng('carillon-reach');
  const stoneA = lin('#cfb68e'), stoneB = lin('#c2a780'), riser = lin('#8a6a48'), grass = lin('#8c955a');
  const B = (q, side, off, y) => { const [x, z] = bank(q, side, off); return [x, y, z]; };
  const singers = [], folk = [], posts = [];
  for (const side of [1, -1]) {
    const toWater = (q) => [q.tz * side, 0, -q.tx * side];
    let runStart = null;
    for (let i = 0; i < REACH.length - 1; i++) {
      const q0 = REACH[i], q1 = REACH[i + 1], on = terraced(q0, side) && terraced(q1, side);
      if (on && !runStart) runStart = q0;
      if (on) {
        const w = toWater(q0), j = 0.94 + 0.1 * hash2(i, side, 7);
        for (let k = 0; k < NSTEP; k++) {
          const o0 = RW - 1 + k * SD, o1 = k === NSTEP - 1 ? BACK : o0 + SD, y0 = k * SR, y1 = (k + 1) * SR;
          face(g, B(q0, side, o0, y1), B(q1, side, o0, y1), B(q1, side, o1, y1), B(q0, side, o1, y1), scale3(k % 2 ? stoneA : stoneB, j), UP);
          face(g, B(q0, side, o0, y0), B(q1, side, o0, y0), B(q1, side, o0, y1), B(q0, side, o0, y1), scale3(riser, j), w);
        }
        face(g, B(q0, side, BACK, TOP), B(q1, side, BACK, TOP), B(q1, side, BACK, TOP + 0.55), B(q0, side, BACK, TOP + 0.55), lin('#bfa47c'), w);
        face(g, B(q0, side, BACK, TOP + 0.55), B(q1, side, BACK, TOP + 0.55), B(q1, side, BACK + 0.5, TOP + 0.55), B(q0, side, BACK + 0.5, TOP + 0.55), lin('#e0d0ae'), UP);
        face(g, B(q0, side, BACK + 0.5, TOP + 0.55), B(q1, side, BACK + 0.5, TOP + 0.55), B(q1, side, BACK + 7, 0.03), B(q0, side, BACK + 7, 0.03), scale3(grass, j), [-w[0], 1, -w[2]]);
      }
      // close the ends of a run of terraces with the steps' own profile
      if (runStart && (!on || i === REACH.length - 2)) {
        for (const [q, dir] of [[runStart, -1], [on ? q1 : q0, 1]]) {
          const want = [q.tx * dir, 0, q.tz * dir];
          for (let k = 0; k < NSTEP; k++) face(g, B(q, side, RW - 1 + k * SD, k * SR), B(q, side, BACK, k * SR), B(q, side, BACK, (k + 1) * SR), B(q, side, RW - 1 + k * SD, (k + 1) * SR), riser, want);
          face(g, B(q, side, BACK, 0), B(q, side, BACK + 7, 0), B(q, side, BACK + 0.5, TOP + 0.55), B(q, side, BACK, TOP + 0.55), grass, want);
        }
        runStart = null;
      }
      if (on && (i % 3 === 0)) {
        const [x, z] = bank(q0, side, RW - 1 + (NSTEP - 1) * SD + 0.8);
        posts.push({ p: [x, TOP, z] }); lights.lamps.push({ p: [x, TOP + 3.65, z], color: '#ffcf8a', power: 6, size: 0.9 });
      }
    }
    // the choirs practising rounds, one on each bank at each station, facing each other across the water
    let n = 0;
    for (let sc = 90; sc < REACH[REACH.length - 1].s - 20; sc += 82, n++) {
      if (!terraced(atS(sc - 23), side) || !terraced(atS(sc + 23), side)) continue;
      const cc = CHOIRS[(n * 5 + (side > 0 ? 0 : 3)) % NCH], child = (n + (side > 0 ? 1 : 0)) % 4 === 3;
      for (let k = 1; k <= 3; k++) {
        for (let s = sc - 21; s < sc + 21; s += child ? 0.52 : 0.64) {
          if (rng() < 0.08) continue;
          const q = atS(s + rng.f(-0.1, 0.1)), [x, z] = bank(q, side, RW - 1 + k * SD + SD * 0.45 + rng.f(-0.1, 0.1)), w = toWater(q);
          singers.push({ p: [x, (k + 1) * SR, z], yaw: Math.atan2(w[0], w[2]) + rng.f(-0.15, 0.15), color: scale3(lin(cc[k === 2 ? 1 : 0]), rng.f(0.88, 1.06)), scale: (child ? 0.7 : 1) * rng.f(0.94, 1.05) });
        }
      }
      const q = atS(sc), [lx, lz] = bank(q, side, RW - 1 + SD * 0.4), w = toWater(q);
      conductor(g, lx, SR, lz, Math.atan2(-w[0], -w[2]), cc[1], 0.98);
      // people sitting along the top step to listen
      for (let s = sc - 30; s < sc + 30; s += rng.f(0.8, 2.6)) {
        const qq = atS(s), [x, z] = bank(qq, side, RW - 1 + (NSTEP - 1) * SD + rng.f(1.6, 4)), ww = toWater(qq);
        folk.push({ p: [x, TOP, z], sit: rng() < 0.5, yaw: Math.atan2(ww[0], ww[2]) + rng.f(-0.4, 0.4) });
      }
    }
    // strollers along the walk, and people on the lowest step by the water away from the choirs
    for (let i = 0; i < REACH.length; i++) {
      const q = REACH[i];
      if (!terraced(q, side)) continue;
      if (rng() < 0.7) { const [x, z] = bank(q, side, RW - 1 + (NSTEP - 1) * SD + rng.f(2, PROM + SD - 1)); folk.push({ p: [x, TOP, z], walk: rng.f(2, 9) }); }
      if (rng() < 0.25) { const [x, z] = bank(q, side, RW - 1 + SD * 0.5), w = toWater(q); folk.push({ p: [x, SR, z], sit: true, yaw: Math.atan2(w[0], w[2]) }); }
    }
    yield 'reach: terraces';
  }
  const post = new Geo(); post.cyl(0, 0, 0, 0.08, 0.06, 3.4, 5, '#3e342a'); post.cyl(0, 3.4, 0, 0.22, 0.16, 0.42, 6, '#ffe2b0', { emit: 2.5 });
  statics.push(hollow.add(g.mesh(hollow.lit, hollow.frame)), ...hollow.add(instances(post.build(), hollow.lit, posts, { frame: hollow.frame, cell: 300 })));
  const bySkin = new Map();
  const FS = [SKIN[0], SKIN[2], SKIN[4]];
  for (const it of singers) { const skin = rng.pick(FS); let a = bySkin.get(skin); if (!a) bySkin.set(skin, a = []); a.push(it); }
  for (const [skin, list] of bySkin) for (const m of instances(farSinger(skin), hollow.lit, list, { frame: hollow.frame, cell: 120 })) lod.push([hollow.add(m), 320]);
  yield 'reach: singers';
  for (const m of crowd(folk, hollow.walk, { frame: hollow.frame, seed: 'carillon-reach', bob: 0.14, cell: 150 })) lod.push([hollow.add(m), 350]);
  yield 'reach: choirs';
}

// People where the plan has life near the flight (the kit's scatterPeople, in smaller cells so that distance can hide them)
function* floorPeople(hollow, near, R, density, max, lod) {
  const cell = 4, dens = density * cell * cell / 100, spots = [];
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const p of near) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
  x0 -= R; x1 += R; z0 = Math.max(0, z0 - R); z1 = Math.min(L, z1 + R);
  const thin = near.filter((_, i) => i % 3 === 0);
  let t0 = performance.now();
  for (let gz = Math.floor(z0 / cell); gz * cell < z1 && spots.length < max; gz++) {
    for (let gx = Math.floor(x0 / cell); gx * cell < x1; gx++) {
      const x = (gx + hash2(gx, gz, 5)) * cell, z = (gz + hash2(gx, gz, 9)) * cell, s = hollow.at(x, z);
      if (s.water > 0.25 || s.life < 0.05) continue;
      const d = nearPath(thin, x, z, C);
      if (d > R || hash2(gx, gz, 13) > dens * s.life * (1 - (d / R) * (d / R))) continue;
      const r = hash2(gx, gz, 17);
      spots.push({ p: [((x % C) + C) % C, 0, z], walk: r < 0.45 ? 0 : 1.5 + 9 * hash2(gx, gz, 19), sit: r < 0.22, child: r > 0.86 });
    }
    if (performance.now() - t0 > 4) { yield 'people'; t0 = performance.now(); }
  }
  for (const m of crowd(spots, hollow.walk, { frame: hollow.frame, bob: 0.16, speed: 0.95, seed: 'carillon-floor', cell: 160 })) lod.push([hollow.add(m), 320]);
  yield 'people: made';
}

// ---------------------------------------------------------------- the evening: [t, sun, its power, far side, its power, glow, its power, rod, lamps, windows]
const EVE = [
  [0, '#f6b86e', 0.56, '#9a6440', 0.2, '#6c6478', 0.26, 22, 0.4, 0.16],
  [30, '#f2aa62', 0.5, '#8a5638', 0.16, '#625a72', 0.25, 19, 0.6, 0.3],
  [64, '#e8904e', 0.42, '#6e4430', 0.1, '#4c4866', 0.24, 14, 0.95, 0.5],
];
const EVEC = EVE.map((k) => [new Color(k[1]), new Color(k[3]), new Color(k[5])]);
const WALL = {
  crowd: 0.45, garden: 0.55, houseMix: 0.45, lit: 0.16, winA: '#ffb060', winB: '#ffe2b0', winPower: 2.4,
  stone: '#e2cfae', stone2: '#cdb08a', houses: ['#d8b48a', '#c99a6a', '#e8d2a8', '#b8875a', '#d9c4a0', '#a87a52'], awning: '#a8743a', gardenColor: '#7f8e52', pave: '#d6c4a0',
};

export const carillonChoirs = {
  id: 'carillon-choirs',
  title: 'Singing to Selkie', drum: 'Carillon', row: 'Bell Row', kind: 'a hall drum', light: 32.6,
  line: 'Every evening the choirs send Selkie a piece and then hold up their lamps for the gap. Thirty-three minutes before the answer starts, and nobody in the bowl says a word.',
  tone: '#e0ac6c', source: 'wander-year.md (Day 140), open-drums.md (Culture)',
  sound: { root: 50, scale: 'mixo', pad: 0.25, air: 0.15, hum: 0.05, water: 0.25, crowd: 0.15, choir: 1, bells: 0.35, bright: 0.55 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    yield 'plan made';
    yield* paintCarillon(plan);
    const pav = paintPavilions(plan);
    yield 'pavilions';
    const tiers = {}; for (let i = 0; i < NT; i++) tiers[i] = { crowd: i === 9 ? 0.8 : 0.4, garden: 0.55 };
    const hollow = yield* buildHollow(ctx, {
      seed: 'carillon', plan, pavilions: false,
      light: { sun: EVE[0][1], sunPower: EVE[0][2], sunFar: EVE[0][3], sunFarPower: EVE[0][4], sunAngle: BX / 1500 + 0.2, sunSharp: 3, amb: EVE[0][5], ambPower: EVE[0][6], bounce: '#b08a50', bouncePower: 0.25, ground: '#ffb468', groundPower: 0.12, air: '#d2c4b0', airDensity: 0.00003 },
      sunline: { power: EVE[0][7], halo: 240, haloPower: 0.04 },
      ground: { canopy: '#7f8a50', lamp: EVE[0][8], lampColor: '#ffc078', people: 0.9, sunRod: EVE[0][7], wave: 0.012, stripes: 0.05, grain: 0.2 },
      front: { ...WALL, tiers }, back: { ...WALL, tiers },
    });
    yield 'hollow';
    const scene = new Scene();
    scene.add(hollow.group);
    const lights = { raise: [], static: [], lamps: [] }, lod = [], statics = [];
    // over the backs of the top rank, down across the ranks to the conductor as the lights go up, out over the far rim,
    // down the reach between the choirs practising rounds, and up in a long turn over the lake to look back at the bowl
    const path = makePath([
      { t: 0, p: [BX - 68, 11.9, BZ] },
      { t: 6, p: [BX - 56, 11.8, BZ], look: [BX, 2, BZ] },
      { t: 13, p: [BX - 28, 7.2, BZ + 1], look: [BX + 10, 2.5, BZ] },
      { t: 19, p: [BX - 4, 5.2, BZ - 6], look: [BX + 50, 7, BZ + 4] },
      { t: 25, p: [BX + 36, 17, BZ - 3], look: [BX + 110, 6, BZ + 8] },
      { t: 30, p: [BX + 125, 20, BZ + 1], look: [BX + 300, 3, BZ + 24] },
      { t: 35, p: [BX + 250, 10, BZ - 6], look: [BX + 340, 3, BZ + 40] },
      { t: 40, p: [BX + 390, 8, BZ + 62], look: [BX + 460, 3, BZ + 200] },
      { t: 46, p: [BX + 420, 90, BZ + 290], look: [BX + 250, 0, BZ + 500] },
      { t: 52, p: [BX + 300, 190, BZ + 560], look: [BX + 20, 0, BZ + 40] },
      { t: 58, p: [BX + 98, 218, BZ + 505], look: [BX, 0, BZ] },
      { t: 64, p: [BX + 50, 207, BZ + 392] },
    ], { frame: hollow.frame, entryRadius: 1.5, exitRadius: 30 });
    const pts = path.points(0.5), low = pts.filter((q) => q.y < 90);
    yield* buildBowl(hollow, lights, lod, statics);
    yield* buildReach(hollow, lights, lod, statics);
    hollow.at(0, 0);
    yield 'plan read';
    const trees = yield* scatterTrees(hollow, { near: low, radius: 120, max: 5000 * ctx.density, wood: [{ kind: 'round', weight: 3 }, { kind: 'poplar', weight: 1 }, { kind: 'birch', weight: 1, tint: [1.2, 1.15, 0.9] }] });
    for (const m of trees) lod.push([m, 600]);
    yield* floorPeople(hollow, pts.filter((q) => q.y < 120 && Math.hypot(q.x - BX, q.z - BZ) > RB + 20), 200, 1.3 * ctx.density, 6000, lod);
    yield 'people';
    hollow.lampPosts({ near: low, radius: 200, power: 5 });
    yield 'lamp posts';
    const pitems = []; for (const q of pav) if (nearPath(low, q[0], q[1], C) < 700) pitems.push({ p: [q[0], 0, q[1]], yaw: (q[0] * 0.37) % 6.28 });
    for (const m of hollow.add(instances(pavilionGeo(), hollow.lit, pitems, { frame: hollow.frame, cell: 500 }))) lod.push([m, 1400]);
    yield 'lamps';
    const raise = raisedLights(lights.raise, hollow.frame, { far: 2, fade: 0.3, fadeNear: 120, fadeFar: 450 });
    hollow.add(raise);
    // lamp floats let go on the water after each sending, drifting slowly down the reach and out over the lake
    const frng = makeRng('carillon-floats'), floats = [];
    for (let i = 0; i < 420; i++) {
      let x, z;
      if (i % 3) { x = LAKE.x + frng.f(-1, 1) * LAKE.rx; z = LAKE.z + frng.f(-1, 1) * LAKE.rz; if (!nearLake(x, z, -30)) continue; }
      else { const q = atS(frng.f(20, REACH[REACH.length - 1].s)); [x, z] = bank(q, frng.sign(), frng.f(0, RW - 8)); }
      const a = frng.f(0, 6.28), v = frng.f(0.08, 0.2);
      floats.push({ p: [x, 0.25, z], color: frng.pick(['#ffc878', '#ffd89a', '#ffb860']), power: frng.f(4, 7), size: 0.55, move: [Math.cos(a) * v, 0, Math.sin(a) * v], loop: frng.f(120, 260), twinkle: 0.1 });
    }
    const lampGlow = hollow.glow([...lights.static, ...lights.lamps, ...floats], { minPx: 1.2, maxPx: 50 });
    yield 'lights';

    // the evening going on: the line dimming and reddening, lamps coming up, windows lighting tier by tier
    const rig = hollow.rig, sun = new Color(), farC = new Color(), amb = new Color();
    const winT = [0, 1].map((s) => { const a = []; for (let i = 0; i < NT; i++) a.push([4 + i * 0.9 + 18 * hash2(i, s, 3), 0.12 + 0.2 * hash2(i, s, 7)]); return a; });
    const look = { exposure: 1.55, bloom: 0.26, threshold: 0.72, saturation: 1.08, contrast: 1.12, vignette: 0.48, lift: [0.006, 0.004, 0.006], gain: [1.02, 1.0, 0.96] };
    function evening(t) {
      let i = 0; while (i < EVE.length - 2 && EVE[i + 1][0] <= t) i++;
      const a = EVE[i], b = EVE[i + 1], u = smoothstep(a[0], b[0], t), ca = EVEC[i], cb = EVEC[i + 1], m = (j) => a[j] + (b[j] - a[j]) * u;
      sun.copy(ca[0]).lerp(cb[0], u); farC.copy(ca[1]).lerp(cb[1], u); amb.copy(ca[2]).lerp(cb[2], u);
      rig.set({ sun, sunPower: m(2), sunFar: farC, sunFarPower: m(4), amb, ambPower: m(6), ground: '#ffb468', groundPower: 0.1 + 0.25 * m(8) });
      hollow.setRod(m(7));
      hollow.setNight(m(8), m(9));
      for (let s = 0; s < 2; s++) for (let k = 0; k < NT; k++) { const w = winT[s][k]; hollow.setWindows(s, k, w[1] * smoothstep(w[0], w[0] + 10, t)); }
      lampGlow.material.uniforms.uPower.value = 0.55 + 0.45 * smoothstep(0, 40, t);
      raise.material.uniforms.uT.value = t;
      look.exposure = 1.55 + 0.25 * smoothstep(20, 60, t);
    }
    evening(0);
    return {
      scene, path, hollow, near: 0.3, far: 9000, look,
      portal: { mist: '#e0ac6c' },
      update(t, dt, camera) {
        evening(t);
        const cp = camera.position;
        for (const [m, far] of lod) { const s = m.isInstancedMesh ? m.boundingSphere : m.geometry.boundingSphere; m.visible = cp.distanceTo(s.center) - s.radius < far; }
      },
    };
  },
};
