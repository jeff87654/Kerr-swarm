// Squall, Weather Row: swell hour. Paddles at one end of the Hollow lake make waves for three hours a day, and at half a g
// a wave comes in slow and tall, five seconds from crest to crest (wander-year.md, Day 103, and Method: Half-g waves;
// 15-canon.js, Squall). The flight rides a crest behind a board, climbs to see the trains marching away up the curve of
// the world, turns over the crowded north shore and leaves through an opening hung over the paddle line.
//
// Not canon (the docs say only "a long lake with paddles at one end"):
// - the lake's shape: 2.6 km long round the drum, 550 m wide along the axis, straight banked sides, a beach at the far end
// - the paddle works: a hall along the paddle line with forty-two hinged flaps and a watching gallery on its roof
// - the beaches, the board racks, the promenades, the rest of the floor's plan
// - the wave's exact shape (a 1.6 m swell, 20 m crest to crest, sets of about eight) beyond the numbers in Method
import {
  Scene, BufferGeometry, BufferAttribute, Float32BufferAttribute, Mesh, ShaderMaterial, Vector2, Vector3, Sphere, Matrix4, Quaternion, InstancedMesh,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { scatterTrees } from '../kit/flora.js';
import { scatterPeople, crowd, CLOTH, SKIN } from '../kit/folk.js';
import { Geo, instances } from '../kit/geo.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, vec3col } from '../kit/mats.js';
import { makeRng } from '../core/rng.js';

// ---------------------------------------------------------------- the lake and its swell
const XP = 1000, XE = 3600;          // the paddle line, and the beach at the far end (flat x, spinward)
const Z0 = 1600, Z1 = 2150;          // the two long banks (flat z)
const HW = 1.6;                      // swell height, trough to crest, metres
const LAM = 20;                      // crest to crest
const KW = (2 * Math.PI) / LAM;
const GH = 9.81 * 0.5;               // the Hollow floor: half a g
const OM = Math.sqrt(GH * KW);       // deep water: about 5.1 s between crests
const CW = OM / KW;                  // about 3.95 m/s
const PERIOD = (2 * Math.PI) / OM;
const KG = (2 * Math.PI) / (LAM * 8), CG = CW / 2;   // sets of about eight waves, travelling at the group speed
const BASE = 0.3;                    // the still water stands this far above the painted lake bed

const sstep = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const phiZ = (z) => 0.35 * Math.sin(z * 0.011 + 1.3) + 0.2 * Math.sin(z * 0.027);
function envW(x, z, w) {
  const a = sstep(XP, XP + 18, x) * sstep(Z0, Z0 + 35, z) * sstep(Z1, Z1 - 35, z) * sstep(XE, XE - 70, x);
  return a * (0.62 + 0.38 * Math.exp(-(x - XP) / 1100)) * (0.8 + 0.2 * Math.cos(KG * (x - XP - CG * w)));
}
const thetaW = (x, z, w) => KW * (x - XP) - OM * w + phiZ(z);
/** height of the water at flat (x, z) at wave time w */
function swellY(x, z, w) { const s = 0.5 + 0.5 * Math.cos(thetaW(x, z, w)); return BASE + HW * envW(x, z, w) * Math.pow(s, 1.5); }
/** slope of the water along x */
function swellDX(x, z, w) { const th = thetaW(x, z, w), s = 0.5 + 0.5 * Math.cos(th); return HW * envW(x, z, w) * 1.5 * Math.sqrt(s) * (-0.5 * Math.sin(th)) * KW; }
/** x of crest number n (n = 0 left the paddles at w = 0) at z, time w */
const crestX = (n, z, w) => XP + (OM * w - phiZ(z) + 2 * Math.PI * n) / KW;

const SWELL_GLSL = /* glsl */`
const float XP = ${XP.toFixed(1)}, XE = ${XE.toFixed(1)}, Z0 = ${Z0.toFixed(1)}, Z1 = ${Z1.toFixed(1)};
const float HW = ${HW.toFixed(3)}, KW = ${KW.toFixed(6)}, OM = ${OM.toFixed(6)}, KG = ${KG.toFixed(6)}, CG = ${CG.toFixed(6)}, BASE = ${BASE.toFixed(3)};
float kPhi(float z) { return 0.35 * sin(z * 0.011 + 1.3) + 0.2 * sin(z * 0.027); }
float kPhiD(float z) { return 0.35 * 0.011 * cos(z * 0.011 + 1.3) + 0.2 * 0.027 * cos(z * 0.027); }
float kEnv(float x, float z, float w) {
  float a = smoothstep(XP, XP + 18.0, x) * smoothstep(Z0, Z0 + 35.0, z) * smoothstep(Z1, Z1 - 35.0, z) * smoothstep(XE, XE - 70.0, x);
  return a * (0.62 + 0.38 * exp(-(x - XP) / 1100.0)) * (0.8 + 0.2 * cos(KG * (x - XP - CG * w)));
}
`;

const WATER_VERT = /* glsl */`
${BEND_PARS}
uniform float uW, uDisp;
varying vec3 vW; varying vec3 vF;
${SWELL_GLSL}
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  float th = KW * (p.x - XP) - OM * uW + kPhi(p.z);
  float s = 0.5 + 0.5 * cos(th);
  p.y = BASE + uDisp * HW * kEnv(p.x, p.z, uW) * pow(s, 1.5);
  vF = p;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

const waterFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tAlb;
uniform vec2 uSize;
uniform vec3 uBend, uDeep, uShallow, uFoam, uWallTint;
uniform float uTime, uW, uSunRod, uSunWidth, uWave;
varying vec3 vW; varying vec3 vF;
${rig.glsl}
${NOISE_GLSL}
${SWELL_GLSL}
vec2 kRipple(vec2 p, float t) {
  return vec2(kNoise(p + vec2(t, 0.7 * t)) - kNoise(p + vec2(t + 0.35, 0.7 * t)), kNoise(p.yx * 1.07 + vec2(-0.6 * t, t) + 5.3) - kNoise(p.yx * 1.07 + vec2(-0.6 * t, t + 0.35) + 5.3)) * 2.0;
}
void main() {
  ${CLIP_FRAG}
  vec2 m = vF.xz;
  float px = max(length(dFdx(m)), length(dFdy(m)));
  float dist = length(vW - cameraPosition);
  vec3 up = vec3(-normalize(vW.xy), 0.0);
  vec3 T = vec3(up.y, -up.x, 0.0);
  vec3 V = (cameraPosition - vW) / dist;

  // the swell, worked out again here so that far off, where the mesh is coarse, the crests still show
  float th = KW * (m.x - XP) - OM * uW + kPhi(m.y);
  float s = 0.5 + 0.5 * cos(th);
  float e = kEnv(m.x, m.y, uW);
  float keep = smoothstep(16.0, 5.0, px);                      // crests under a few pixels apart blur into a sheen
  float dh = HW * e * 1.5 * sqrt(s) * (-0.5 * sin(th)) * keep;
  float sx = dh * KW, sz = dh * kPhiD(m.y);
  float t = uTime * 0.45;
  vec2 tl = kRipple(m * 0.55, t * 1.6) * smoothstep(1.4, 0.3, px) + kRipple(m * 0.13, t) * smoothstep(6.0, 1.5, px) * 0.7
          + kRipple(m * 0.03, t * 0.5) * smoothstep(30.0, 6.0, px) * 0.5;
  vec3 Nw = normalize(up - T * (sx + tl.x * uWave) - vec3(0.0, 0.0, 1.0) * (sz + tl.y * uWave));

  vec3 Lgt = kLight(vW, up, vF, vec3(0.0, 1.0, 0.0));
  float ndv = max(dot(Nw, V), 0.0);
  float fres = 0.03 + 0.97 * pow(1.0 - ndv, 5.0);
  vec3 R = reflect(-V, Nw);
  float rr = max(dot(R.xy, R.xy), 1e-5);
  float tt = -2.0 * dot(vW.xy, R.xy) / rr;
  vec3 Hh = vW + R * tt;
  vec3 refl;
  if (tt > 0.0 && Hh.z > 0.0 && Hh.z < uSize.y) {
    vec2 huv = vec2(fract(atan(Hh.y, Hh.x) / 6.2831853 - uBend.x / 6.2831853), Hh.z / uSize.y);
    vec3 ha = textureLod(tAlb, huv, 3.0).rgb;
    refl = ha * (kSunColor(Hh.xy) * kSunE(Hh, vec3(-normalize(Hh.xy), 0.0)) + uAmb);
  } else refl = uWallTint * (uAmb * 2.2 + kSunColor(vW.xy) * 0.25);
  vec3 Mid = vW + R * (tt * 0.5);
  float dm = length(Mid.xy);
  float inLine = smoothstep(uSunZ.x - 40.0, uSunZ.x + 40.0, Mid.z) * smoothstep(uSunZ.y + 40.0, uSunZ.y - 40.0, Mid.z) * step(0.0, tt);
  float wdt = uSunWidth * (1.0 + px * 0.35);
  float streak = exp(-dm * dm / (wdt * wdt));
  float gl = kNoise(m * 1.9 + vec2(t * 2.3, -t * 1.9)) * kNoise(m * 0.83 - vec2(t * 0.9, t * 1.3) + 3.0);
  streak += smoothstep(0.28, 0.6, gl) * exp(-dm * dm / (wdt * wdt * 40.0)) * 0.8 * smoothstep(6.0, 0.5, px);
  vec3 toLine = normalize(vec3(0.0, 0.0, clamp(Mid.z, uSunZ.x, uSunZ.y)) - vW);
  float miss = acos(clamp(dot(R, toLine), -1.0, 1.0));
  float spark = smoothstep(0.5, 0.78, kNoise(m * 2.7 + vec2(t * 3.1, -t * 2.3)) * 0.5 + kNoise(m * 1.1 - vec2(t * 1.3, t * 1.7) + 3.0) * 0.5 + 0.12 * gl);
  vec3 sunRefl = kSunColor(vW.xy) * uSunRod * (streak * inLine + spark * exp(-miss * miss / 0.06) * 0.3 * smoothstep(4.0, 0.4, px) / max(fres, 0.08));

  // the body of the water: deep between crests, sea-glass where a crest is thin enough to pass light
  float crest = pow(s, 6.0) * e * keep;
  vec3 body = mix(uDeep, uShallow, clamp(crest * 1.3 + 0.08, 0.0, 1.0)) * (Lgt * 0.9 + 0.03);
  vec3 wcol = body * (1.0 - fres) + (refl + sunRefl) * fres;
  // foam: where the swell breaks on the far beach, and churned up along the paddles
  float fn = kNoise(m * vec2(0.9, 0.35) + vec2(0.0, t)) * 0.6 + kNoise(m * 2.3 - vec2(t, 0.0)) * 0.4;
  float brk = smoothstep(XE - 150.0, XE - 60.0, m.x) * smoothstep(0.55, 0.95, s) + smoothstep(XE - 45.0, XE - 5.0, m.x) * 0.8;
  float churn = smoothstep(XP + 14.0, XP + 1.0, m.x) * (0.6 + 0.4 * s);
  float foam = clamp((brk + churn) * smoothstep(0.35, 0.7, fn + 0.25 * s), 0.0, 1.0) * smoothstep(Z0, Z0 + 4.0, m.y) * smoothstep(Z1, Z1 - 4.0, m.y);
  foam = max(foam, smoothstep(0.86, 1.0, s) * smoothstep(0.6, 0.85, fn) * e * 0.35 * keep);
  wcol = mix(wcol, uFoam * (Lgt + uAmb), foam);
  gl_FragColor = vec4(kAir(wcol, vW), 1.0);
}`;

function gridGeo(x0, x1, z0, z1, dx, dz) {
  const nx = Math.ceil((x1 - x0) / dx), nz = Math.ceil((z1 - z0) / dz);
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
  let k = 0;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) { pos[k++] = x0 + (x1 - x0) * (i / nx); pos[k++] = 0; pos[k++] = z0 + (z1 - z0) * (j / nz); }
  const idx = new Uint32Array(nx * nz * 6);
  k = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setIndex(new BufferAttribute(idx, 1));
  return g;
}

function waterMesh(hollow, x0, x1, dx, dz, disp, shared) {
  const g = gridGeo(x0, x1, Z0, Z1, dx, dz);
  const f = hollow.frame, pts = [];
  for (let i = 0; i <= 8; i++) for (const z of [Z0, Z1]) for (const y of [0, 2]) pts.push(f.point(x0 + (x1 - x0) * (i / 8), y, z));
  g.boundingSphere = new Sphere().setFromPoints(pts);
  const m = new ShaderMaterial({
    uniforms: { ...shared, uDisp: { value: disp } },
    vertexShader: WATER_VERT, fragmentShader: waterFrag(hollow.rig),
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8,
  });
  const mesh = new Mesh(g, m);
  mesh.renderOrder = -4;
  return mesh;
}

// ---------------------------------------------------------------- the floor's plan
export function paintSquall(plan) {
  const rng = makeRng('squall-plan');
  plan.fill(plan.band(0, L), { color: '#8ea67e', life: 0.25 });
  plan.mottle(['#97ad86', '#83a078', '#9cb08c', '#7a9874', '#a6b894'], 520, 150, { alpha: 0.4, seed: 'squall-lawn' });
  // the Dim Ends
  plan.fill(plan.band(0, 700), { color: '#4d6e55', wood: 0.95, clear: ['life'], feather: 30 });
  plan.fill(plan.band(L - 700, L), { color: '#4a6b55', wood: 0.95, clear: ['life'], feather: 30 });
  for (let i = 0; i < 24; i++) plan.fill(plan.blob(rng.f(0, C), rng.chance(0.5) ? rng.f(380, 680) : rng.f(L - 680, L - 380), rng.f(40, 110), rng.f(30, 70), { seed: i + 3 }), { color: rng.pick(['#7d9a74', '#6c8d6c', '#89a47e']), clear: ['wood'], life: 0.3 });
  // woods and clumps over the rest of the floor, kept off the lake and its shores
  const offLake = (x, z) => !(x > XP - 140 && x < XE + 160 && z > Z0 - 150 && z < Z1 + 170);
  plan.clumps(700, 10, 40, { seed: 'squall-clumps', z0: 720, z1: L - 720, colors: ['#5e8358', '#557b52', '#6a8f60'], keep: offLake });
  // gardens and greens
  for (let i = 0; i < 26; i++) {
    const x = rng.f(0, C), z = rng.f(820, L - 900), w = rng.f(70, 140), h = rng.f(60, 110);
    if (!offLake(x, z) || !offLake(x + w, z + h)) continue;
    plan.garden(x, z, x + w, z + h, ['#c9d7e6', '#e6e0c4', '#a9cfd2', '#d8c2d8', '#f0ead2']);
  }
  // walks: rings round the floor, lanes along it, lamps on all of them
  const walk = (pts, w) => { plan.stroke(pts, w, { color: '#cbc7b6', paved: 0.8, life: 0.6, clear: ['wood'] }); plan.lamps(pts, 28); };
  const ring = (z, wob) => { const a = []; for (let i = 0; i <= 120; i++) a.push([(i / 120) * C, z + Math.sin(i * 0.37 + z) * wob]); return a; };
  for (const z of [700, 1150, 2600, 3050]) walk(ring(z, 22), 6);
  for (let i = 0; i < 16; i++) { const x = (i / 16) * C + 120; if (x > XP - 200 && x < XE + 200) continue; walk([[x, 720], [x + 50, 1500], [x - 30, 2300], [x, L - 720]], 5); }

  // ---- the lake: long round the drum, with beaches on its banks and a broad beach at the far end
  const sand = '#ddd6bf';
  plan.fill(plan.rect(XP - 70, Z0 - 110, XE + 130, Z1 + 120, 60), { color: '#c9c5b3', paved: 0.6, life: 0.7, clear: ['wood', 'rows'] });
  plan.fill(plan.rect(XP - 10, Z0 - 42, XE + 95, Z1 + 42, 40), { color: sand, life: 0.9, clear: ['paved'] });
  plan.fill(plan.rect(XP - 2, Z0, XE, Z1, 4), { color: '#18343e', water: 0.28, clear: ['life', 'paved', 'wood', 'rows', 'lamp'] });
  // promenades along both banks, lit, and the crowd along the north one
  const north = [], south = [];
  for (let i = 0; i <= 60; i++) { const x = XP - 40 + (i / 60) * (XE - XP + 120); north.push([x, Z1 + 78]); south.push([x, Z0 - 78]); }
  plan.stroke(north, 14, { color: '#c3bfae', paved: 1, life: 1 }); plan.lamps(north, 24);
  plan.stroke(south, 10, { color: '#c3bfae', paved: 1, life: 0.6 }); plan.lamps(south, 24);
  plan.fill(plan.rect(XP - 10, Z1 + 8, XE + 60, Z1 + 42, 6), { life: 1 });
  // the paddle works' hall, and the square behind it
  plan.fill(plan.rect(XP - 120, Z0 - 60, XP - 2, Z1 + 60, 10), { color: '#bdb8a8', paved: 1, life: 0.8, clear: ['wood'] });
  // greens round the lake where people wait their turn
  for (let i = 0; i < 18; i++) {
    const x = XP + rng.f(0, XE - XP), side = rng.chance(0.6) ? 1 : -1, z = side > 0 ? Z1 + rng.f(130, 260) : Z0 - rng.f(130, 260);
    plan.fill(plan.ellipse(x, z, rng.f(40, 90), rng.f(25, 50), rng.f(-0.3, 0.3)), { color: '#a2b690', life: 0.9 });
  }
}

export const squallSwell = {
  id: 'squall-swell',
  title: 'Swell hour', drum: 'Squall', row: 'Weather Row', kind: 'a steady drum', light: 28.0,
  line: 'I stood up on the eleventh try. Then I fell off, very slowly, which at half a g leaves you time to wave.',
  tone: '#9fd0d6', source: 'wander-year.md (Day 103; Method, Half-g waves)',
  sound: { root: 48, scale: 'lydian', pad: 0.5, air: 0.2, water: 0.85, crowd: 0.35, bells: 0.15, bright: 0.6 },
  *build(ctx) {
    const plan = new Plan(ctx.q.plan);
    paintSquall(plan);
    yield;
    const hollow = yield* buildHollow(ctx, {
      seed: 'squall', plan,
      light: { sun: '#eef8fb', sunPower: 0.85, amb: '#8db6c6', ambPower: 0.34, bounce: '#9fb39a', air: '#cfe4ec', airDensity: 0.00008 },
      sunline: { power: 50 },
      ground: { people: 0.8, lamp: 0.0, sunRod: 50, canopy: '#6f9468', stripes: 0.05 },
      front: { crowd: 0.2, lit: 0.12, houseMix: 0.4, houses: ['#cfe0e2', '#9fc0c8', '#e8ecea', '#b8cdd0', '#dfe6dc', '#a8bcc4'], stone: '#e6e7e0', stone2: '#cfd6d4' },
      back: { crowd: 0.25, lit: 0.12, houseMix: 0.4, houses: ['#cfe0e2', '#9fc0c8', '#e8ecea', '#b8cdd0', '#dfe6dc', '#a8bcc4'], stone: '#e6e7e0', stone2: '#cfd6d4' },
    });
    yield;
    const scene = new Scene();
    scene.add(hollow.group);
    const frame = hollow.frame;

    // ---- the water
    const shared = {
      ...hollow.rig.uniforms, uClip: G.uClip, uTime: G.uTime,
      uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) },
      uW: { value: 0 }, tAlb: { value: hollow.tex.alb }, uSize: { value: new Vector2(C, L) },
      uDeep: { value: vec3col('#1d4654') }, uShallow: { value: vec3col('#5fa8b0') }, uFoam: { value: vec3col('#f3fdff') },
      uWallTint: { value: vec3col('#cfd6d4') }, uSunRod: { value: 50 }, uSunWidth: { value: 22 }, uWave: { value: 0.03 },
    };
    const XD = 2350;
    const near = waterMesh(hollow, XP, XD, 1.6, 4, 1, shared);
    const far = waterMesh(hollow, XD, XE, 10, 25, 0, shared);
    // the near mesh lies flat over its last stretch so it meets the far one without a seam
    near.material.vertexShader = near.material.vertexShader.replace('p.y = BASE + uDisp', 'p.y = BASE + uDisp * smoothstep(' + XD.toFixed(1) + ', ' + (XD - 80).toFixed(1) + ', p.x)');
    scene.add(near, far);
    yield;

    // ---- the flight: ride a crest, climb to see the trains go up the curve, turn over the north shore, out over the paddles
    const ZR = 1880, X0 = 1500;
    const path = makePath([
      { t: 0, p: [X0, 5.2, ZR] },
      { t: 9, p: [X0 + 36, 6.5, ZR - 2], look: [X0 + 80, 1, ZR - 6] },
      { t: 18, p: [X0 + 120, 48, ZR - 30], look: [X0 + 1100, 0, ZR] },
      { t: 26, p: [X0 + 260, 85, 1930], look: [X0 + 1700, 300, 2000] },
      { t: 34, p: [X0 + 300, 60, 2110], look: [X0 - 100, 0, 2200] },
      { t: 42, p: [X0 + 60, 14, 2190], look: [X0 - 200, 3, 2150] },
      { t: 50, p: [X0 - 250, 30, 2060], look: [XP, 20, 1900] },
      { t: 58, p: [XP + 60, 40, 1900] },
    ], { frame, entryRadius: 3.4, exitRadius: 30 });
    const pts = path.points(0.5);
    yield* scatterTrees(hollow, { near: pts, radius: 180, max: 20000 * ctx.density });
    yield* scatterPeople(hollow, { near: pts, radius: 240, density: 1.4 * ctx.density, max: 9000 });

    // ---- wave time: the flight's own clock, so the crest the flight rides is always where the flight expects it.
    // While this world is only seen through the last one's opening the swell runs on its own; when the flight
    // starts it eases onto the flight's clock (to a whole number of periods, so the picture is the same).
    let pre = 0, started = false, from = 0, to = 0;
    const waveTime = (t, dt) => {
      if (t <= 0) { if (!started) pre += dt; return pre; }
      if (!started) { started = true; from = pre; to = Math.round(pre / PERIOD) * PERIOD; }
      const k = sstep(0, 6, t);
      return t + from + (to - from) * k;
    };

    return {
      scene, path, hollow, near: 0.5, far: 9000,
      look: { exposure: 1.3, bloom: 0.18, threshold: 0.8, saturation: 1.02, vignette: 0.4 },
      portal: { mist: '#9fd0d6' },
      update(t, dt) {
        const w = waveTime(t, dt);
        shared.uW.value = w;
      },
    };
  },
};
