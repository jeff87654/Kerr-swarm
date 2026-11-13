// Borage, Herb Row: the festival Hollow at blue hour, its squares full of fountains that fall slowly at half a g
// (games/three-nights/src/15-canon.js, Borage: "bright squares and fountains that fall slowly at half a g", the dawn
// palette "Received light", a colour sequence that arrived from another raft; docs/eating-out.md, "Yarrow and Borage"
// and Lightfall; docs/open-drums.md, fair drums and light-painting).
//
// The water is done honestly. Every droplet flies a straight line in the frame that does not turn and is drawn as the
// turning drum sees it (the vertex shader below does the sums exactly): a jet thrown straight up comes down spinward of
// where it rose (docs/sorrel.md, the Slow Fountain; docs/ashgrove.md, "Weight is a map": what is thrown up lands
// spinward, a dropped cup antispinward). At half a g an 8 m jet lands about 2 m spinward, a 30 m jet about 15 m, and the
// great jet, 90 m tall, is up for eleven seconds and comes down about 72 m round the floor. Water thrown spinward along
// the floor gains weight and dives; thrown antispinward it loses weight and sails: the jets that cross the canal show it.
//
// Not canon (the docs give Borage's Hollow only its one line):
//   - the plan: six canals the length of the floor, a square every 320 m along each, lit quays, avenues, groves,
//     gardens and lawns between; the Great Fountain near the back wall on one of them;
//   - the fountains' designs: rings of jets round round basins, long basins lined with jets, a square of dancing jets
//     set in the paving that play in waves, jets that arch across the canals, and the Great Fountain (a ring of 48 jets
//     40 m tall round a basin 250 m across, an inner ring, and one great jet set antispinward of the middle so that it
//     comes down in the basin);
//   - the lights under every jet in the palette's blue, rose and a pale gold; the strings of lanterns over the dancing
//     square and the crowd there; the footbridges; the order the dawn's colours come in over the minute.
import {
  Scene, Color, InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, BufferGeometry,
  Uint8BufferAttribute, Mesh, ShaderMaterial, AdditiveBlending, Vector2, Vector3,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow, pavilionGeo } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, litMaterial } from '../kit/mats.js';
import { Geo, instances, rgb } from '../kit/geo.js';
import { scatterTrees } from '../kit/flora.js';
import { scatterPeople, crowd } from '../kit/folk.js';
import { DRUM } from '../kit/drum.js';
import { makeRng, smoothstep } from '../core/rng.js';

const W = DRUM.OMEGA, RH = DRUM.RH;
const GH = W * W * RH;                        // weight on the Hollow floor: 4.9 m/s2, half a g
const X0 = 2400;                              // the canal the flight follows
const NC = 6, CS = C / NC;                    // six canals, one every 1,571 m round the floor
const CANAL_W = 11;                           // half-width of a canal's water
// the squares along each canal: z of the middle, and the kind of fountain in it
const SQZ = [980, 1300, 1620, 1940, 2260, 2640];
const KINDS = ['avenue', 'ring', 'dance'];
function squaresOf(k) {
  const out = [];
  SQZ.forEach((z, j) => {
    let kind = KINDS[(j + k * 2) % 3];
    if (k === 0) kind = ['avenue', 'ring', 'avenue', 'dance', 'ring', 'great'][j];
    else if (j === 5) kind = 'ring';
    out.push({ k, j, x: X0 + k * CS, z, kind });
  });
  return out;
}
const SQUARES = []; for (let k = 0; k < NC; k++) SQUARES.push(...squaresOf(k));
const SIZE = { ring: [100, 90], avenue: [80, 112], dance: [104, 96], great: [210, 190] };   // half-sizes of the paving
const GREAT = SQUARES.find((s) => s.kind === 'great');
const GREAT_R = 125;
const DANCE_X = 40;                           // the dancing jets: two grids this far either side of the canal

// is (x, z) in (or within m metres of) a basin?
function inBasin(x, z, m = 0) {
  for (const s of SQUARES) {
    let dx = ((x - s.x) % C + C * 1.5) % C - C / 2; const dz = z - s.z;
    if (s.kind === 'ring' && Math.hypot(dx, dz) < 44 + m) return true;
    if (s.kind === 'great' && Math.hypot(dx, dz) < GREAT_R + m) return true;
    if (s.kind === 'avenue' && Math.abs(dx) < 16.5 + m && Math.abs(dz) < 97.5 + m) return true;
  }
  return false;
}
// the received palette, and the lights under the jets
const PAL = { night: '#1d2233', blue: '#4f5f99', rose: '#e9a6c2', pale: '#fff4fb' };
const JET_COLS = ['#7b8ff0', '#f2a6c8', '#ffe2b4', '#a9b6ff', '#ffc4dc'];

// ---------------------------------------------------------------- the plan
export function* paintBorage(plan) {
  const rng = makeRng('borage-plan');
  const many = (list, fn) => { const p = new Path2D(); for (const it of list) p.addPath(fn(it)); return p; };
  plan.fill(plan.band(0, L), { color: '#9aa39a', life: 0.35 });
  const patchCols = ['#a4ab9e', '#8f998e', '#b0b3a6', '#97a296', '#a9a7a4', '#a4ab9e', '#8f998e', '#b0b3a6', '#97a296', '#a9a7a4'], patches = patchCols.map(() => []);
  for (let i = 0; i < 140; i++) { const r = rng.f(110, 340); patches[i % 10].push(plan.blob(rng.f(0, C), rng.f(500, L - 500), r, r * rng.f(0.5, 1.1), { wobble: 0.3, lobes: 4, seed: i + 7, n: 16 })); }
  patches.forEach((list, k) => plan.fill(many(list, (b) => b), { color: patchCols[k], alpha: 0.35 }));
  // the Dim Ends: groves under the walls
  plan.fill(plan.band(0, 700), { color: '#5d6b66', wood: 0.9, clear: ['life'] });
  plan.fill(plan.band(L - 700, L), { color: '#5a6866', wood: 0.9, clear: ['life'] });
  plan.fill(plan.band(690, 730), { color: '#7c8780', alpha: 0.6 });
  plan.fill(plan.band(L - 730, L - 690), { color: '#7c8780', alpha: 0.6 });
  yield;
  // walks round the floor, lit
  const ring = (z, wob) => { const a = []; for (let i = 0; i <= 120; i++) a.push([(i / 120) * C, z + Math.sin(i * 0.31 + z * 0.01) * wob]); return a; };
  const rings = [ring(720, 0), ring(L - 720, 0), ring(1140, 0), ring(1460, 0), ring(1780, 0), ring(2100, 0), ring(2420, 0), ring(2950, 30)];
  plan.stroke(many(rings, (w) => plan.curve(w)), 7, { color: '#cfc9cc', paved: 0.8, life: 0.8, clear: ['wood'] });
  for (const w of rings) plan.lamps(w, 30, { power: 0.8 });
  // groves, gardens and lawns between the canals
  const clumpCols = ['#6f7d74', '#66756f', '#78857a', '#7d887e', '#6a7a72', '#74827a', '#6c786f', '#7a857c'], clumps = clumpCols.map(() => []);
  for (let i = 0; i < 340; i++) {
    const x = rng.f(0, C), z = rng.f(760, L - 760), r = rng.f(14, 46);
    let dx = ((x - X0) % CS + CS) % CS; dx = Math.min(dx, CS - dx);
    if (dx < 150) continue;
    clumps[i % 8].push(plan.blob(x, z, r, r * rng.f(0.6, 1.1), { wobble: 0.3, lobes: 4, seed: i + 1, n: 20 }));
  }
  clumps.forEach((list, k) => plan.fill(many(list, (p) => p), { color: clumpCols[k], wood: 0.85, clear: ['life'] }));
  for (let i = 0; i < 26; i++) {
    const k = i % NC, x = X0 + k * CS + rng.sign() * rng.f(260, 600), z = rng.f(900, L - 900), w = rng.f(90, 150), h = rng.f(70, 110);
    plan.garden(x - w / 2, z - h / 2, x + w / 2, z + h / 2, ['#c99ab4', '#e2c48e', '#a9b4d8', '#e8b6c8', '#d6d0e6'], { seed: 'bg' + i, hedge: '#4f6258', gravel: '#cfc6c8' });
  }
  yield;
  // the canals: water the length of the floor between paved quays, an avenue down each side, lamps along the quays
  const quays = [], waters = [], lampLines = [], aves = [];
  for (let k = 0; k < NC; k++) {
    const x = X0 + k * CS;
    quays.push([x - CANAL_W - 14, 740, x + CANAL_W + 14, L - 740]);
    waters.push([x - CANAL_W, 760, x + CANAL_W, L - 760]);
    for (const s of [-1, 1]) { lampLines.push([[x + s * (CANAL_W + 5), 760], [x + s * (CANAL_W + 5), L - 760]]); aves.push([[x + s * (CANAL_W + 22), 760], [x + s * (CANAL_W + 22), L - 760]]); }
  }
  for (const a of aves) plan.avenue(a, 0.01, 12, { color: '#5f6f6a', radius: 4.4 });
  plan.fill(many(quays, ([a, b, c, d]) => plan.rect(a, b, c, d, 6)), { color: '#cdc6cc', paved: 0.9, life: 0.7, clear: ['wood'] });
  yield;
  // the squares: paving, its pattern, and the basins
  const pave = [], bands = [], basins = [], deep = [];
  for (const s of SQUARES) {
    const [hx, hz] = SIZE[s.kind];
    pave.push(plan.rect(s.x - hx, s.z - hz, s.x + hx, s.z + hz, s.kind === 'great' ? 60 : 24));
    if (s.kind === 'ring') {
      for (const r of [56, 70, 84]) bands.push(plan.ellipse(s.x, s.z, r, r));
      basins.push(plan.ellipse(s.x, s.z, 44, 44)); deep.push(plan.ellipse(s.x, s.z, 30, 30));
    } else if (s.kind === 'avenue') {
      basins.push(plan.rect(s.x - 15, s.z - 96, s.x + 15, s.z + 96, 4));
      bands.push(plan.rect(s.x - 34, s.z - 104, s.x + 34, s.z + 104, 6));
    } else if (s.kind === 'dance') {
      for (const sx of [-1, 1]) bands.push(plan.rect(s.x + sx * DANCE_X - 26, s.z - 68, s.x + sx * DANCE_X + 26, s.z + 68, 4));
    } else {
      for (const r of [150, 172, 194]) bands.push(plan.ellipse(s.x, s.z, r, r * 0.92));
      basins.push(plan.ellipse(s.x, s.z, GREAT_R, GREAT_R)); deep.push(plan.ellipse(s.x, s.z, GREAT_R - 25, GREAT_R - 25));
    }
  }
  plan.fill(many(pave, (p) => p), { color: '#bdb5bd', paved: 1, life: 0.95, clear: ['wood'] });
  plan.stroke(many(bands, (p) => p), 3, { color: '#a898a8' });
  yield;
  plan.fill(many(waters, ([a, b, c, d]) => plan.rect(a, b, c, d)), { color: '#34436a', water: 1, clear: ['life', 'paved', 'wood'] });
  plan.fill(many(basins, (p) => p), { color: '#38497a', water: 1, clear: ['life', 'paved', 'wood'] });
  plan.fill(many(deep, (p) => p), { color: '#24305a', feather: 14 });
  // quay lamps, broken where a quay runs into a basin
  for (const ln of lampLines) {
    const x = ln[0][0]; let run = [];
    for (let z = 760; z <= L - 760; z += 22) {
      if (inBasin(x, z, 4)) { if (run.length > 1) plan.lamps(run, 22, { power: 0.8 }); run = []; continue; }
      run.push([x, z]);
    }
    if (run.length > 1) plan.lamps(run, 22, { power: 0.8 });
  }
  // lamps round the squares
  const sqLamps = [];
  for (const s of SQUARES) { const [hx, hz] = SIZE[s.kind]; sqLamps.push([[s.x - hx + 6, s.z - hz + 6], [s.x + hx - 6, s.z - hz + 6], [s.x + hx - 6, s.z + hz - 6], [s.x - hx + 6, s.z + hz - 6], [s.x - hx + 6, s.z - hz + 6]]); }
  for (const ln of sqLamps) plan.lamps(ln, 26, { power: 0.8 });
  // lift pavilions at the corners of the squares, where cabs come up (only those near the flight are built)
  const pav = [];
  for (const s of SQUARES) { const [hx, hz] = SIZE[s.kind]; for (const sx of [-1, 1]) for (const sz of [-1, 1]) pav.push([s.x + sx * (hx + 14), s.z + sz * (hz - 10)]); }
  plan.dots(pav, 9, { color: '#b8b0b6', paved: 1, clear: ['wood'] });
  plan.dots(pav, 2.2, { lamp: 0.9 });
  for (const q of pav) plan.features.push({ type: 'pavilion', x: q[0], z: q[1] });
}

// ---------------------------------------------------------------- the water's sums
// A droplet leaves a nozzle y0 up with velocity (vx spinward, vy up, vz along the axis) relative to the floor. In the
// frame that does not turn it flies straight; turned back into the drum's frame that is a curve that leans spinward.
// Returns the seconds until it is back at nozzle height and how far spinward (flat metres) it lands.
export function flight(vx, vy, y0 = 0.3) {
  const R0 = RH - y0, Vt = W * R0 + vx, T = 2 * R0 * vy / (vy * vy + Vt * Vt);
  const a = Math.atan2(Vt * T, R0 - vy * T) - W * T;
  return { T, dx: a * RH };
}
const vyFor = (H) => Math.sqrt(2 * GH * H);

// A jet: { x, z, vx, vy, vz, col, n (droplets), size (m), spray (m/s of scatter), pulse: [period, offset] }
function jet(x, z, H, col, n, o = {}) {
  return { x, z, vx: o.vx || 0, vy: vyFor(H), vz: o.vz || 0, col, n, size: o.size || 0.24, spray: o.spray === undefined ? 0.35 : o.spray, pulse: o.pulse || null, power: o.power || 1, splash: o.splash === undefined ? 0.14 : o.splash };
}
// The fountains of one square. near: the flight's own canal, drawn with many droplets.
function fountainJets(s, near) {
  const J = [], m = near ? 1 : 0.24, q = (n) => Math.max(8, Math.round(n * m));
  const sz = near ? 1 : 1.9, sp = { size: 0.24 * sz };
  if (s.kind === 'ring') {
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + Math.PI / 20, c = Math.cos(a), si = Math.sin(a);
      J.push(jet(s.x + c * 34, s.z + si * 34, 15, JET_COLS[i % 2], q(70), { ...sp, vx: -c * 1.6, vz: -si * 1.6 }));
    }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; J.push(jet(s.x + Math.cos(a) * 18, s.z + Math.sin(a) * 18, 7, JET_COLS[2], q(30), sp)); }
    const f = flight(0, vyFor(30));
    J.push(jet(s.x - f.dx / 2, s.z, 30, JET_COLS[2], q(170), { size: 0.3 * sz, spray: 0.45, splash: 0.2, power: 0.75 }));
  } else if (s.kind === 'avenue') {
    for (const sx of [-1, 1]) for (let i = 0; i < 23; i++) J.push(jet(s.x + sx * 10, s.z - 88 + i * 8, 12, JET_COLS[(i + (sx > 0 ? 1 : 0)) % 2 ? 0 : 1], q(50), sp));
    for (const sz2 of [-1, 1]) for (const sx of [-1, 1]) J.push(jet(s.x + sx * 4, s.z + sz2 * 90, 22, JET_COLS[2], q(90), { size: 0.28 * sz }));
  } else if (s.kind === 'dance') {
    for (const sx of [-1, 1]) for (let r = 0; r < 11; r++) for (let c = 0; c < 5; c++) {
      J.push(jet(s.x + sx * DANCE_X + (c - 2) * 10, s.z - 60 + r * 12, 6.5, JET_COLS[(r + c) % 3 === 0 ? 2 : r % 2], q(26), { ...sp, spray: 0.25, pulse: [5.0, r * 0.07 + c * 0.03 + (sx > 0 ? 0.5 : 0)] }));
    }
  } else if (s.kind === 'great') {
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2, c = Math.cos(a), si = Math.sin(a);
      J.push(jet(s.x + c * 112, s.z + si * 112, 40, JET_COLS[i % 3 === 2 ? 2 : i % 2], q(140), { size: 0.42, vx: -c * 2.4, vz: -si * 2.4, spray: 0.45 }));
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2, c = Math.cos(a), si = Math.sin(a);
      J.push(jet(s.x + c * 72, s.z + si * 72, 20, JET_COLS[3 + (i % 2)], q(55), { size: 0.26, pulse: [7.0, i / 24] }));
    }
    // the great jet, set antispinward of the middle so it comes down in the basin, and six round it
    const f = flight(0, vyFor(90)), gx = s.x - f.dx * 0.5;
    J.push(jet(gx, s.z, 90, '#fff0e0', q(1000), { size: 0.5, spray: 0.8, splash: 0.25, power: 1.1 }));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = i % 2 ? 9 : 14; J.push(jet(gx + Math.cos(a) * r, s.z + Math.sin(a) * r, i % 2 ? 62 : 50, JET_COLS[i % 4 < 2 ? 0 : 1], q(240), { size: 0.36, vx: Math.cos(a) * 1.6, vz: Math.sin(a) * 1.6, spray: 0.5 })); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; J.push(jet(gx + Math.cos(a) * 26, s.z + Math.sin(a) * 26, 26, JET_COLS[2], q(80), { size: 0.28, vx: Math.cos(a) * 1.0, vz: Math.sin(a) * 1.0, pulse: [6.0, i / 12] })); }
  }
  return J;
}
// jets from the quays that arch across the canal between squares: thrown spinward they dive, antispinward they sail
function canalJets(x, z0, z1, near) {
  const J = [];
  for (let z = z0; z <= z1; z += 10) {
    J.push(jet(x - CANAL_W - 0.6, z, 5, JET_COLS[0], near ? 30 : 8, { vx: 4.2, size: near ? 0.2 : 0.4, splash: 0.1 }));
    J.push(jet(x + CANAL_W + 0.6, z + 5, 5, JET_COLS[1], near ? 30 : 8, { vx: -4.2, size: near ? 0.2 : 0.4, splash: 0.1 }));
  }
  return J;
}

// ---------------------------------------------------------------- droplets: a streak each, on its true path
const DROP_VERT = /* glsl */`
attribute vec4 aA;   // launch point (flat x, z); launch velocity spinward and along the axis, m/s
attribute vec4 aB;   // launch velocity up, m/s; nozzle height; phase 0..1; size, m
attribute vec4 aC;   // colour x strength (linear); a seed
attribute vec2 aP;   // pulse: period (s, 0 = steady), offset
${BEND_PARS}
uniform float uTime, uPx, uMinPx, uMaxPx, uOmega, uR, uStreak, uPower, uG, uC;
uniform vec2 uRes; uniform vec3 uSky;
varying vec3 vW; varying vec3 vC; varying vec2 vQ; varying float vLen; varying float vRad;
#ifdef MIRROR
varying vec2 vS;
#endif
vec3 dropAt(float tau, float R0, float Vt) {
  vec2 p = vec2(R0 - aB.x * tau, Vt * tau);
  return vec3(aA.x + (atan(p.y, p.x) - uOmega * tau) * uR, uR - length(p), aA.y + aA.w * tau);
}
vec3 bentW(vec3 f) { vec3 n = vec3(0.0, 1.0, 0.0); kBend(f, n); return (modelMatrix * vec4(f, 1.0)).xyz; }
void main() {
  gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
  vC = vec3(0.0); vQ = vec2(0.0); vLen = 0.0; vRad = 1.0; vW = vec3(0.0);
  float R0 = uR - aB.y, Vt = uOmega * R0 + aA.z;
  float T = 2.0 * R0 * aB.x / (aB.x * aB.x + Vt * Vt);
  float u = fract(uTime / T + aB.z), tau = u * T;
  if (aP.x > 0.0 && fract((uTime - tau) / aP.x + aP.y) > 0.5) return;
  vec3 h = dropAt(tau, R0, Vt), t = dropAt(max(tau - uStreak, 0.0), R0, Vt);
  float hy = h.y;
#ifdef MIRROR
  h.y = -h.y; t.y = -t.y;
  vec3 cw = cameraPosition;
  vec3 cf = vec3((atan(cw.y, cw.x) - uBend.x) * uR, uR - length(cw.xy), cw.z - uBend.y);
  cf.x = h.x + mod(cf.x - h.x + 0.5 * uC, uC) - 0.5 * uC;
  if (cf.y < 0.3) return;
  vec3 S = cf + (h - cf) * (cf.y / (cf.y + hy));
  if (length(S - cf) > 700.0) return;
  vS = S.xz;
  vec4 cs = projectionMatrix * viewMatrix * vec4(bentW(S), 1.0);
  if (cs.w < 0.3) return;
#endif
  vec3 hw = bentW(h), tw = bentW(t);
  vec4 ch = projectionMatrix * viewMatrix * vec4(hw, 1.0), ct = projectionMatrix * viewMatrix * vec4(tw, 1.0);
  if (ch.w < 0.3 || ct.w < 0.3) return;
  vec2 sh = ch.xy / ch.w * uRes * 0.5, st = ct.xy / ct.w * uRes * 0.5;
  vec2 d = sh - st; float len = length(d);
  vec2 dir = len > 1e-3 ? d / len : vec2(0.0, 1.0), perp = vec2(dir.y, -dir.x);
  float px = aB.w * uPx / ch.w;
  float shown = clamp(px, uMinPx, uMaxPx), k = min(px * px / (shown * shown), 1.0), rad = shown * 0.5;
  float along = mix(-rad, len + rad, position.y);
  vec2 sp = st + dir * along + perp * position.x * rad;
  float z = mix(ct.z / ct.w, ch.z / ch.w, position.y);
#ifdef MIRROR
  z = cs.z / cs.w;
  sp.x += sin(uTime * 1.9 + S.z * 0.7 + S.x * 0.23) * (1.0 + 0.03 * abs(sp.y - cs.y / cs.w * uRes.y * 0.5));
#endif
  gl_Position = vec4(sp / (uRes * 0.5), z, 1.0);
  vQ = vec2(along, position.x * rad); vLen = len; vRad = rad; vW = hw;
  // lit from the lamps under the jet, brightest low down; the top of a tall jet catches the dawn
  float H = aB.x * aB.x / (2.0 * uG) + 1.0;
  float below = 1.0 / (1.0 + pow(max(hy, 0.0) / (0.4 * H + 2.0), 2.0));
  float edge = smoothstep(0.0, 0.03, u) * smoothstep(1.0, 0.97, u) * smoothstep(1.5, 8.0, ch.w);
  float spark = 0.65 + 0.7 * fract(sin(aC.w * 91.7 + floor(uTime * 6.0 + aC.w * 17.0) * 12.9898) * 43758.5453);
  // a long streak spreads the same light over more of the picture
  float spread = clamp(70.0 / max(len, 1.0), 0.3, 1.0);
  vC = (aC.rgb * (0.22 + 1.1 * below) * spark + uSky * smoothstep(0.2, 0.9, hy / H)) * k * edge * spread * uPower;
#ifdef MIRROR
  vC *= 0.5;
#endif
}`;
const DROP_FRAG = /* glsl */`
${CLIP_PARS}
uniform float uSoft;
#ifdef MIRROR
uniform sampler2D tMask; uniform vec2 uSize;
varying vec2 vS;
#endif
varying vec3 vW; varying vec3 vC; varying vec2 vQ; varying float vLen; varying float vRad;
void main() {
  ${CLIP_FRAG}
  float dx = max(max(-vQ.x, vQ.x - vLen), 0.0);
  float d = length(vec2(dx, vQ.y)) / vRad;
  float a = pow(max(1.0 - d, 0.0), uSoft);
  if (a <= 0.003) discard;
  a *= mix(0.3, 1.0, vLen > 0.5 ? clamp(vQ.x / vLen, 0.0, 1.0) : 1.0);
#ifdef MIRROR
  a *= smoothstep(0.35, 0.7, texture2D(tMask, vS / uSize).r);
#endif
  gl_FragColor = vec4(vC * a, 1.0);
}`;

// Droplets for a list of jets, as typed arrays (a generator: yields by the clock). Each jet gets a stream of droplets
// spread evenly through its flight, a few thrown wider as spray, and a splash where it lands.
function* dropArrays(jets, seed, opts = {}) {
  const rng = makeRng(seed), dens = opts.density || 1;
  let total = 0;
  for (const j of jets) { const n = Math.max(6, Math.round(j.n * dens)); total += n + Math.round(n * j.splash); }
  const list = { A: new Float32Array(total * 4), B: new Float32Array(total * 4), C: new Float32Array(total * 4), P: new Float32Array(total * 2), n: 0 };
  let t0 = performance.now();
  const push = (x, z, vx, vy, vz, y0, ph, size, col, k, pulse) => {
    const i = list.n++, a = i * 4;
    list.A[a] = x; list.A[a + 1] = z; list.A[a + 2] = vx; list.A[a + 3] = vz;
    list.B[a] = vy; list.B[a + 1] = y0; list.B[a + 2] = ph; list.B[a + 3] = size;
    list.C[a] = col[0] * k; list.C[a + 1] = col[1] * k; list.C[a + 2] = col[2] * k; list.C[a + 3] = rng();
    if (pulse) { list.P[i * 2] = pulse[0]; list.P[i * 2 + 1] = pulse[1]; }
  };
  for (const j of jets) {
    const col = rgb(j.col), n = Math.max(6, Math.round(j.n * dens));
    for (let i = 0; i < n; i++) {
      const wide = rng() < 0.2, s = j.spray * (wide ? 3 : 0.5);
      push(j.x, j.z, j.vx + rng.gauss() * s, j.vy * (1 + rng.gauss() * (wide ? 0.06 : 0.015)), j.vz + rng.gauss() * s, 0.3, (i + rng()) / n, j.size * (wide ? 0.55 : 1), col, j.power * (wide ? 0.8 : 1.0), j.pulse);
    }
    // the splash: small drops thrown up where the jet comes down
    const f = flight(j.vx, j.vy), T = f.T, lz = j.z + j.vz * T, ns = Math.round(n * j.splash);
    for (let i = 0; i < ns; i++) {
      const a = rng.f(0, 6.283), hs = rng.f(0.4, 1.6);
      push(j.x + f.dx + rng.gauss() * 0.4, lz + rng.gauss() * 0.4, Math.cos(a) * hs, rng.f(1.2, 3.2), Math.sin(a) * hs, 0.05, rng(), j.size * 0.6, col, j.power * 0.7, j.pulse ? [j.pulse[0], j.pulse[1] - T / j.pulse[0]] : null);
    }
    if (performance.now() - t0 > 4) { yield 'borage: droplets'; t0 = performance.now(); }
  }
  return list;
}
const DROP_U = { uSky: { value: new Vector3(0.1, 0.1, 0.2) } };
function dropMesh(list, opts = {}) {
  const g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aA', new InstancedBufferAttribute(list.A, 4));
  g.setAttribute('aB', new InstancedBufferAttribute(list.B, 4));
  g.setAttribute('aC', new InstancedBufferAttribute(list.C, 4));
  g.setAttribute('aP', new InstancedBufferAttribute(list.P, 2));
  g.instanceCount = list.n;
  const mk = (mirror) => new ShaderMaterial({
    uniforms: {
      uClip: G.uClip, uTime: G.uTime, uPx: G.uPx, uRes: G.uRes, uSky: DROP_U.uSky,
      uBend: { value: new Vector3(0, 0, RH) }, uOmega: { value: W }, uR: { value: RH }, uG: { value: GH }, uC: { value: C },
      uMinPx: { value: opts.minPx || 1.1 }, uMaxPx: { value: opts.maxPx || 14 }, uStreak: { value: opts.streak || 0.09 },
      uPower: { value: opts.power || 1 }, uSoft: { value: 1.3 },
      tMask: { value: opts.mask || null }, uSize: { value: new Vector2(C, L) },
    },
    defines: mirror ? { MIRROR: 1 } : {},
    vertexShader: DROP_VERT, fragmentShader: DROP_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
  });
  const m = new Mesh(g, mk(false));
  m.frustumCulled = false; m.renderOrder = 9;
  const out = [m];
  if (opts.mirror) { const mm = new Mesh(g, mk(true)); mm.frustumCulled = false; mm.renderOrder = 8; out.push(mm); }
  return out;
}

// ---------------------------------------------------------------- stone, light pools, bridges
// Pools of coloured light on the water round each nozzle: a fan, bright in the middle and black at the rim, drawn added.
function poolMesh(items, material, frame) {
  const pos = [], nrm = [], col = [], em = [], n = 14;
  for (const it of items) {
    const c = rgb(it.col).map((v) => Math.round(Math.min(1, v) * 255));
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      pos.push(it.x, it.y, it.z, it.x + Math.cos(a1) * it.r, it.y, it.z + Math.sin(a1) * it.r, it.x + Math.cos(a0) * it.r, it.y, it.z + Math.sin(a0) * it.r);
      nrm.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      col.push(...c, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      em.push(it.emit, 0, 0);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  g.setAttribute('aCol', new Uint8BufferAttribute(col, 4, true));
  g.setAttribute('aEmit', new Float32BufferAttribute(em, 1));
  const m = new Mesh(g, material);
  g.computeBoundingBox();
  const b = g.boundingBox, pts = [frame.point(b.min.x, 0, b.min.z), frame.point(b.max.x, 0, b.max.z), frame.point((b.min.x + b.max.x) / 2, 0, (b.min.z + b.max.z) / 2)];
  g.computeBoundingSphere();
  g.boundingSphere.center.copy(pts[2]); g.boundingSphere.radius = pts[0].distanceTo(pts[1]) / 2 + 50;
  m.renderOrder = 6;
  return m;
}
// the stone rim of a round basin, with a lit band under its coping; gap: half-width of the canal that runs through it
function ringRim(g, cx, cz, r, gap, glowCol) {
  const n = Math.ceil((Math.PI * 2 * r) / 2.5), w = 1.5, h = 0.55, R = r + w;
  const P = (rr, a, y) => [cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    if (Math.abs(Math.cos((a0 + a1) / 2) * r) < gap) continue;
    g.quad(P(r, a0, h), P(r, a1, h), P(R, a1, h), P(R, a0, h), '#ece6ea');
    g.quad(P(r, a0, -0.4), P(r, a1, -0.4), P(r, a1, h - 0.2), P(r, a0, h - 0.2), '#bdb4c0');
    g.quad(P(r - 0.02, a0, h - 0.2), P(r - 0.02, a1, h - 0.2), P(r - 0.02, a1, h), P(r - 0.02, a0, h), glowCol, 2.2);
    g.quad(P(R, a1, -0.1), P(R, a0, -0.1), P(R, a0, h), P(R, a1, h), '#d6cdd4');
  }
}
// an arched footbridge across a canal at z
function bridge(g, x, z, span, lamps) {
  const n = 12, w = 2.4;
  const yAt = (t) => 0.7 + 2.4 * Math.sin(Math.PI * t);
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, x0 = x - span / 2 + span * t0, x1 = x - span / 2 + span * t1, y0 = yAt(t0), y1 = yAt(t1);
    g.quad([x0, y0, z + w], [x1, y1, z + w], [x1, y1, z - w], [x0, y0, z - w], '#e8e1e6');
    g.quad([x0, y0 - 0.5, z - w], [x1, y1 - 0.5, z - w], [x1, y1, z - w], [x0, y0, z - w], '#cfc5cf');
    g.quad([x1, y1 - 0.5, z + w], [x0, y0 - 0.5, z + w], [x0, y0, z + w], [x1, y1, z + w], '#cfc5cf');
    g.quad([x0, y0 - 0.5, z + w], [x1, y1 - 0.5, z + w], [x1, y1 - 0.5, z - w], [x0, y0 - 0.5, z - w], '#9d94a6');
    for (const s of [-1, 1]) g.box(x0, Math.min(y0, y1), z + s * w - 0.12, x1, Math.max(y0, y1) + 1.0, z + s * w + 0.12, '#ddd5dc', { skip: 'b' });
  }
  for (const s of [-1, 1]) { g.box(x + s * span / 2 - 1.2, 0, z - w - 0.2, x + s * span / 2 + 1.2, 1.9, z - w + 0.2, '#e3dbe1'); g.box(x + s * span / 2 - 1.2, 0, z + w - 0.2, x + s * span / 2 + 1.2, 1.9, z + w + 0.2, '#e3dbe1'); lamps.push([x + s * span / 2, 2.3, z - w], [x + s * span / 2, 2.3, z + w]); }
}

// ---------------------------------------------------------------- what the flight passes
// basin rims and canal copings, nozzles, footbridges, lanterns over the dancing square, people on the rims and among
// the jets, lamp posts
const LANTERN_COLS = ['#ffd9a0', '#f2a6c8', '#9fb0ff', '#fff0f6', '#ffc4dc'];
function lanternStrings(s, near) {
  const strings = [];
  for (const dx of [-52, -38, -24, -14, 14, 24, 38, 52]) {
    const x = s.x + dx, line = [];
    for (let z = s.z - 90; z <= s.z + 90.01; z += near ? 2.4 : 4) { const t = (((z - (s.z - 90)) % 60) + 60) % 60 / 60; line.push([x, 8.8 - 1.9 * Math.sin(Math.PI * t), z]); }
    strings.push(line);
  }
  return strings;
}
function* dress(hollow, pts, ctx, S2, S4) {
  const rng = makeRng('borage-dress');
  const g = new Geo({ maxSeg: 16 });
  const glows = [];
  // rims
  for (const s of SQUARES) {
    if (s.k !== 0) continue;
    if (s.kind === 'ring') ringRim(g, s.x, s.z, 44, CANAL_W + 1.5, s.j === 1 ? '#c9b6ff' : '#ffc4dc');
    else if (s.kind === 'great') ringRim(g, s.x, s.z, GREAT_R, CANAL_W + 1.5, '#ffe2c4');
    else if (s.kind === 'avenue') {
      for (const sx of [-1, 1]) {
        const xa = s.x + sx * 15, xb = s.x + sx * 16.5;
        g.box(Math.min(xa, xb), -0.3, s.z - 97.5, Math.max(xa, xb), 0.55, s.z + 97.5, '#e6dfe4', { top: '#ece6ea' });
        g.box(Math.min(xa, xa - sx * 0.02), 0.32, s.z - 96, Math.max(xa, xa - sx * 0.02), 0.45, s.z + 96, '#ffc4dc', { emit: 2.2 });
        for (const sz of [-1, 1]) g.box(Math.min(s.x + sx * CANAL_W, xb), -0.3, s.z + sz * 96 - (sz > 0 ? 0 : 1.5), Math.max(s.x + sx * CANAL_W, xb), 0.55, s.z + sz * 96 + (sz > 0 ? 1.5 : 0), '#e6dfe4');
      }
    }
    yield 'borage: rims';
  }
  yield 'borage: rims';
  // the canal's copings, broken where it runs into a basin
  const cuts = SQUARES.filter((s) => s.k === 0 && s.kind !== 'dance').map((s) => s.kind === 'ring' ? [s.z - 42.6, s.z + 42.6] : s.kind === 'avenue' ? [s.z - 96, s.z + 96] : [s.z - 124.5, s.z + 124.5]);
  let z = 760;
  for (const [c0, c1] of [...cuts, [L - 760, L]]) {
    if (c0 > z) for (const sx of [-1, 1]) g.box(Math.min(X0 + sx * CANAL_W, X0 + sx * (CANAL_W + 1.3)), -0.3, z, Math.max(X0 + sx * CANAL_W, X0 + sx * (CANAL_W + 1.3)), 0.5, c0, '#e2dbe0', { top: '#ebe5e9' });
    z = c1;
  }
  // footbridges where the walks cross
  const bl = [];
  for (const bz of [1140, 1460, 1780, 2100, 2420]) bridge(g, X0, bz, 2 * (CANAL_W + 3), bl);
  for (const p of bl) glows.push({ p, color: '#ffd9a8', power: 6, size: 0.5 });
  hollow.add(g.mesh(hollow.litDouble, hollow.frame));
  yield 'borage: bridges';
  // nozzles: a bronze stub in a lit cup, under every jet of this canal
  const nz = new Geo();
  nz.cyl(0, -0.1, 0, 0.45, 0.4, 0.3, 8, '#7d7480', { emit: 0 });
  nz.cyl(0, 0.2, 0, 0.36, 0.36, 0.06, 8, '#fff2e6', { emit: 3 });
  nz.cyl(0, 0.2, 0, 0.12, 0.09, 0.22, 6, '#9a8468');
  const noz = [];
  for (const s of SQUARES) if (s.k === 0) for (const j of fountainJets(s, true)) noz.push({ p: [j.x, 0, j.z] });
  hollow.add(instances(nz.build(), hollow.lit, noz, { frame: hollow.frame, cell: 300 }));
  // lanterns on strings over the dancing squares: whole on this canal, lights only on the others
  const lg = new Geo({ maxSeg: 16 });
  for (const s of SQUARES) {
    if (s.kind !== 'dance') continue;
    const near = s.k === 0;
    for (const line of lanternStrings(s, near)) {
      line.forEach((p, i) => glows.push({ p: [p[0], p[1] - 0.35, p[2]], color: LANTERN_COLS[(i + Math.round(p[0])) % LANTERN_COLS.length], power: near ? 6 : 9, size: near ? 0.5 : 1.4, twinkle: 0.08 }));
      if (!near) continue;
      lg.tube(line.map((p) => [p[0], p[1], p[2]]), 0.03, 3, '#3c3a44');
      line.forEach((p, i) => { if (i % 1 === 0) lg.cube(p[0], p[1] - 0.35, p[2], 0.34, 0.42, 0.34, LANTERN_COLS[(i + Math.round(p[0])) % LANTERN_COLS.length], { emit: 2.5 }); });
      for (let zz = s.z - 90; zz <= s.z + 90.01; zz += 60) lg.cyl(line[0][0], 0, zz, 0.16, 0.12, 9.2, 6, '#4a4752');
      yield 'borage: lanterns';
    }
  }
  hollow.add(lg.mesh(hollow.lit, hollow.frame));
  hollow.glow(glows, { minPx: 1.2, maxPx: 40, soft: 1.8 });
  yield 'borage: lanterns';
  // people: among the dancing jets, on the canal's edge, on the rims of the ring and of the great basin
  const spots = [], d = ctx.density;
  const nearJet = (x, zz) => { for (const sx of [-1, 1]) { const cx = (x - (S4.x + sx * DANCE_X)) / 10 + 2, cz = (zz - (S4.z - 60)) / 12; if (cx > -0.5 && cx < 4.5 && cz > -0.5 && cz < 10.5 && Math.hypot((cx - Math.round(cx)) * 10, (cz - Math.round(cz)) * 12) < 1.6) return true; } return false; };
  for (let i = 0; i < 1500 * d; i++) {
    const sx = rng.sign(), x = S4.x + sx * rng.f(14, 96), zz = S4.z + rng.f(-88, 88);
    if (nearJet(x, zz)) continue;
    const child = rng.chance(0.3);
    spots.push({ p: [x, 0, zz], walk: rng.chance(0.55) ? rng.f(0.8, child ? 4 : 2.5) : 0, child });
  }
  for (let i = 0; i < 260 * d; i++) { const sx = rng.sign(), zz = S4.z + rng.f(-95, 95); spots.push({ p: [S4.x + sx * (CANAL_W + 0.75), 0.5, zz], sit: true, yaw: sx > 0 ? -Math.PI / 2 : Math.PI / 2 }); }
  const rimSit = (s, r, n) => {
    for (let i = 0; i < n; i++) {
      const a = rng.f(0, Math.PI * 2);
      if (Math.abs(Math.cos(a) * r) < CANAL_W + 3) continue;
      const rr = r + rng.f(0.35, 0.9), yaw = Math.atan2(-Math.cos(a), -Math.sin(a));
      if (rng.chance(0.7)) spots.push({ p: [s.x + Math.cos(a) * rr, 0.55, s.z + Math.sin(a) * rr], sit: true, yaw });
      else { const r2 = r + rng.f(2.5, 9); spots.push({ p: [s.x + Math.cos(a) * r2, 0, s.z + Math.sin(a) * r2], walk: rng.chance(0.4) ? rng.f(1, 4) : 0, yaw, child: rng.chance(0.2) }); }
    }
  };
  rimSit(S2, 44, 220 * d);
  rimSit(GREAT, GREAT_R, 650 * d);
  hollow.add(crowd(spots, hollow.walk, { frame: hollow.frame, bob: 0.2, seed: 'borage-crowd' }));
  yield 'borage: crowds';
  hollow.lampPosts({ near: pts, radius: 200, power: 4, color: '#ffd2a0' });
  const pav = [];
  for (const f of hollow.plan.features) if (f.type === 'pavilion' && Math.abs(f.x - X0) < 300) pav.push({ p: [f.x, 0, f.z], yaw: f.z * 0.37 });
  hollow.add(instances(pavilionGeo(), hollow.lit, pav, { frame: hollow.frame, cell: 600 }));
}

// ---------------------------------------------------------------- the dawn: blue hour going to rose
// [t, sun (this bank), power, far bank, power, glow, power, rod, lamps, windows]
const SEQ = [
  [0, '#4f5f99', 0.3, '#e9a6c2', 0.26, '#2a3360', 0.3, 9, 0.6, 0.04],
  [22, '#5d68ae', 0.34, '#efb2cc', 0.32, '#2e3664', 0.3, 12, 0.6, 0.03],
  [44, '#a487bd', 0.42, '#fbd2e2', 0.4, '#38375f', 0.3, 16, 0.5, 0.02],
  [66, '#e9a6c2', 0.5, '#fff4fb', 0.48, '#45405f', 0.3, 20, 0.45, 0.0],
];
const SEQC = SEQ.map((k) => [new Color(k[1]), new Color(k[3]), new Color(k[5])]);

export const borageFountains = {
  id: 'borage-fountains',
  title: 'Fountains that fall spinward', drum: 'Borage', row: 'Herb Row', kind: 'a fair drum', light: 0.0,
  line: 'In Borage the water goes up slowly, hangs, and comes down a few paces spinward of where it rose, so every jet in the drum leans the same way. The big one is up for eleven seconds.',
  tone: '#e9a6c2', source: '15-canon.js (Borage), eating-out.md (Yarrow and Borage), open-drums.md (Culture), sorrel.md (The end walls)',
  sound: { root: 50, scale: 'lydian', pad: 0.5, air: 0.2, water: 0.95, crowd: 0.4, bells: 0.22, bright: 0.6 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    yield* paintBorage(plan);
    yield 'borage: plan';
    const houses = ['#e9a6c2', '#c9b8d8', '#aab4dc', '#f2e4ec', '#d6c0d0', '#b9c2e0'];
    // windows lit in bands: the low tiers busy, the high gardens nearly dark, so the wall reads as rings of a city
    const tiers = {};
    for (let i = 0; i < 30; i++) tiers[i] = { lit: i < 12 ? 0.14 - i * 0.008 : i % 5 === 4 ? 0.08 : 0.0, crowd: i === 9 ? 0.9 : 0.35 };
    const wall = { lit: SEQ[0][9], crowd: 0.4, garden: 0.5, houseMix: 0.55, stone: '#e6dfe6', stone2: '#d4cad8', houses, winA: '#ffc890', winB: '#ffe4f0', winPower: 2.6, awning: '#c98aa8', gardenColor: '#7f8f86', tiers };
    const s0 = SEQ[0];
    const hollow = yield* buildHollow(ctx, {
      seed: 'borage', plan, pavilions: false,
      light: { sun: s0[1], sunPower: s0[2], sunFar: s0[3], sunFarPower: s0[4], sunAngle: X0 / RH, sunSharp: 1.6, amb: s0[5], ambPower: s0[6], ground: '#ffc890', groundPower: 0.25, bounce: '#8a90a8', air: '#8f98c0', airDensity: 0.00008 },
      sunline: { power: s0[7], keep: true },
      ground: { lamp: s0[8], lampColor: '#ffcf9c', people: 0.9, sunRod: s0[7], wave: 0.008, stripes: 0.03, canopy: '#6f7d74' },
      front: wall, back: { ...wall },
    });
    yield 'borage: hollow';
    const scene = new Scene();
    scene.add(hollow.group);
    plan.features = plan.features.filter((f) => f.type !== 'lamp' || hollow.at(f.x, f.z).water < 0.3);
    const S2 = SQUARES.find((s) => s.k === 0 && s.j === 1), S4 = SQUARES.find((s) => s.k === 0 && s.j === 3);

    // ---- the flight: low over the water into the ring of jets and past the middle one as it hangs; up to see the
    // squares strung along the canal and the canals going up round the world; down over the dancing square at lantern
    // height; and up beside the great jet to an opening above it
    const gx = GREAT.x - flight(0, vyFor(90)).dx * 0.5;
    const path = makePath([
      { t: 0, p: [X0 - 9, 2.6, 1212] },
      { t: 7, p: [X0 - 11, 4.0, 1262], look: [X0 - 4, 12, 1320] },
      { t: 13, p: [X0 - 16, 8, 1310], look: [X0 + 2, 24, 1370] },
      { t: 20, p: [X0 - 25, 50, 1420], look: [X0 + 10, 0, 1720] },
      { t: 27, p: [X0 - 30, 95, 1640], look: [X0 + 30, 0, 2000] },
      { t: 33, p: [X0 - 6, 18, 1850], look: [X0 + 20, 6, 1950] },
      { t: 38, p: [X0 - 4, 9, 1922], look: [X0 + 40, 4, 1972] },
      { t: 43, p: [X0, 11, 1990], look: [X0 - 34, 6, 2050] },
      { t: 49, p: [X0 - 30, 45, 2180], look: [X0 + 20, 40, 2500] },
      { t: 55, p: [X0 - 50, 68, 2400], look: [gx + 20, 62, 2640] },
      { t: 65, p: [X0 - 20, 142, 2690] },
    ], { frame: hollow.frame, entryRadius: 2, exitRadius: 22 });
    const pts = path.points(0.5);
    yield 'borage: path';
    yield* scatterTrees(hollow, { near: pts, radius: 130, max: 3500 * ctx.density, wood: [{ kind: 'round', weight: 3 }, { kind: 'poplar', weight: 1 }] });
    yield* scatterPeople(hollow, { near: pts, radius: 200, density: 1.2 * ctx.density, max: 2500 * ctx.density });
    yield* dress(hollow, pts, ctx, S2, S4);

    // ---- the water
    const nearJets = [], farJets = [];
    for (const s of SQUARES) (s.k === 0 ? nearJets : farJets).push(...fountainJets(s, s.k === 0));
    for (let k = 0; k < NC; k++) {
      const sq = SQUARES.filter((s) => s.k === k);
      for (let j = 0; j < sq.length - 1; j++) (k === 0 ? nearJets : farJets).push(...canalJets(X0 + k * CS, sq[j].z + SIZE[sq[j].kind][1] + 14, sq[j + 1].z - SIZE[sq[j + 1].kind][1] - 14, k === 0));
    }
    const dens = Math.max(0.5, ctx.density);
    const nearList = yield* dropArrays(nearJets, 'borage-near', { density: dens * 1.55 });
    scene.add(...dropMesh(nearList, { mirror: true, mask: hollow.tex.mask, streak: 0.16, power: 2.2 }));
    yield 'borage: droplets';
    const farList = yield* dropArrays(farJets, 'borage-far', { density: dens });
    scene.add(...dropMesh(farList, { minPx: 1.0, streak: 0.2, power: 1.5, maxPx: 20 }));
    yield 'borage: droplets';
    // the lights under the jets
    const lights = [];
    for (const j of nearJets) lights.push({ p: [j.x, 0.35, j.z], color: j.col, power: 5, size: 0.8 });
    for (const j of farJets) lights.push({ p: [j.x, 0.6, j.z], color: j.col, power: 7, size: 2.2 });
    hollow.glow(lights, { minPx: 1.2, maxPx: 36, soft: 1.8 });
    const pools = [];
    for (const j of nearJets) pools.push({ x: j.x, y: 0.12, z: j.z, r: j.vy > 20 ? 9 : j.vy > 12 ? 5 : 3, col: j.col, emit: 1.6 });
    hollow.add(poolMesh(pools, litMaterial(hollow.rig, { bend: hollow.frame, additive: true }), hollow.frame));
    yield 'borage: lights';

    // ---- the light, moving through the minute
    const rig = hollow.rig, sun = new Color(), farC = new Color(), amb = new Color();
    const look = { exposure: 1.9, bloom: 0.26, threshold: 0.7, saturation: 1.06, vignette: 0.45, contrast: 1.04 };
    function light(t) {
      let i = 0; while (i < SEQ.length - 2 && SEQ[i + 1][0] <= t) i++;
      const a = SEQ[i], b = SEQ[i + 1], u = smoothstep(a[0], b[0], t), ca = SEQC[i], cb = SEQC[i + 1];
      const m = (j) => a[j] + (b[j] - a[j]) * u;
      sun.copy(ca[0]).lerp(cb[0], u); farC.copy(ca[1]).lerp(cb[1], u); amb.copy(ca[2]).lerp(cb[2], u);
      rig.set({ sun, sunPower: m(2), sunFar: farC, sunFarPower: m(4), amb, ambPower: m(6) });
      hollow.setRod(m(7));
      hollow.setNight(m(8), m(9));
      DROP_U.uSky.value.set(sun.r, sun.g, sun.b).multiplyScalar(0.5 + 0.5 * m(2));
    }
    light(0);
    return {
      scene, path, hollow, near: 0.3, far: 9000, look,
      portal: { mist: '#3c4578' },
      update(t) { light(t); },
    };
  },
};
