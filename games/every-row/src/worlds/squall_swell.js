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
  Scene, BufferGeometry, BufferAttribute, Float32BufferAttribute, Mesh, ShaderMaterial, Vector2, Vector3, Sphere, Matrix4, Quaternion, InstancedMesh, Euler, Color,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { scatterTrees } from '../kit/flora.js';
import { scatterPeople, crowd, CLOTH, SKIN } from '../kit/folk.js';
import { Geo, instances } from '../kit/geo.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, vec3col, litMaterial } from '../kit/mats.js';
import { makeRng, hash2 } from '../core/rng.js';

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
  vec2 tl = kRipple(m * 0.55, t * 1.6) * smoothstep(1.4, 0.3, px) + kRipple(m * 0.13, t) * smoothstep(6.0, 1.5, px) * 0.4
          + kRipple(m * 0.03, t * 0.5) * smoothstep(30.0, 6.0, px) * 0.25;
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
    vec3 ha = textureLod(tAlb, huv, 4.6).rgb;
    refl = ha * (kSunColor(Hh.xy) * kSunE(Hh, vec3(-normalize(Hh.xy), 0.0)) + uAmb);
  } else refl = uWallTint * (uAmb * 2.2 + kSunColor(vW.xy) * 0.25);
  refl = mix(refl, uShallow * (uAmb * 2.0 + kSunColor(vW.xy) * 0.5), 0.4);     // the Hollow's own glow softens what the water holds
  vec3 Mid = vW + R * (tt * 0.5);
  float dm = length(Mid.xy);
  float inLine = smoothstep(uSunZ.x - 40.0, uSunZ.x + 40.0, Mid.z) * smoothstep(uSunZ.y + 40.0, uSunZ.y - 40.0, Mid.z) * step(0.0, tt);
  float wdt = uSunWidth * (1.0 + px * 0.35);
  float streak = exp(-dm * dm / (wdt * wdt));
  float gl = kNoise(m * 1.9 + vec2(t * 2.3, -t * 1.9)) * kNoise(m * 0.83 - vec2(t * 0.9, t * 1.3) + 3.0);
  streak += smoothstep(0.28, 0.6, gl) * exp(-dm * dm / (wdt * wdt * 40.0)) * 0.8 * smoothstep(6.0, 0.5, px);
  vec3 sunRefl = kSunColor(vW.xy) * uSunRod * streak * inLine;

  // the body of the water: deep between crests, sea-glass where a crest is thin enough to pass light
  float crest = pow(s, 6.0) * e * keep;
  vec3 body = mix(uDeep, uShallow, clamp(crest * 1.3 + 0.08, 0.0, 1.0)) * (Lgt * 0.9 + 0.03);
  vec3 wcol = body * (1.0 - fres) + (refl + sunRefl) * fres;
  // foam: where the swell breaks on the far beach, and churned up along the paddles
  float fn = kNoise(m * vec2(0.9, 0.35) + vec2(0.0, t)) * 0.6 + kNoise(m * 2.3 - vec2(t, 0.0)) * 0.4;
  float brk = smoothstep(XE - 150.0, XE - 60.0, m.x) * smoothstep(0.55, 0.95, s) + smoothstep(XE - 45.0, XE - 5.0, m.x) * 0.8;
  float churn = smoothstep(XP + 14.0, XP + 1.0, m.x) * (0.6 + 0.4 * s);
  float foam = clamp((brk + churn) * smoothstep(0.35, 0.7, fn + 0.25 * s), 0.0, 1.0) * smoothstep(Z0, Z0 + 4.0, m.y) * smoothstep(Z1, Z1 - 4.0, m.y);
  foam = max(foam, smoothstep(0.86, 1.0, s) * smoothstep(0.6, 0.85, fn) * e * 0.12 * keep);
  // lacing: the thin wandering lines of old foam a swell carries, stretched along the crests
  vec2 lq = (m - vec2(${CW.toFixed(4)} * uW * 0.92, 0.0)) * vec2(0.07, 0.022);
  float lace = (1.0 - smoothstep(0.0, 0.018 + px * 0.006, abs(kNoise(lq) + 0.5 * kNoise(lq * 2.7 + 9.0) - 0.75))) * smoothstep(0.7, 0.15, px);
  foam = max(foam, lace * e * (0.08 + 0.12 * s));
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
  mesh.renderOrder = -6;        // before the ground, so the lake bed under it is never shaded
  return mesh;
}

// ---------------------------------------------------------------- boards, riders, swimmers, paddles
const BOARDS = ['#f3fdff', '#9fd0d6', '#e8b44a', '#d9643f', '#2d5f70', '#f0e2c0', '#c94f5a', '#5fa8b0', '#f3fdff', '#e9d36a'];
const SUIT = '#2c3b44';

function boardGeo() {
  const g = new Geo();
  const sh = [[1.35, 0], [1.05, 0.25], [0.3, 0.3], [-1.1, 0.27], [-1.3, 0.16], [-1.3, -0.16], [-1.1, -0.27], [0.3, -0.3], [1.05, -0.25]];
  g.tint(1).extrude(sh, 0, 0.09, '#ffffff').tint(0);
  g.box(-0.9, 0.09, -0.02, 1.0, 0.095, 0.02, '#38444a');           // the stringer
  return g.build();
}
// standing sideways on the board, knees bent, arms out: feet along x, facing +z
function standGeo(skin, waving) {
  const g = new Geo();
  g.tube([[0.42, 0.0, 0], [0.3, 0.42, 0.1], [0.06, 0.82, 0]], 0.075, 5, SUIT);
  g.tube([[-0.42, 0.0, 0], [-0.28, 0.42, 0.1], [-0.05, 0.82, 0]], 0.075, 5, SUIT);
  g.tint(1).tube([[0, 0.8, 0], [0.06, 1.08, 0.04], [0.1, 1.34, 0.03]], 0.15, 6, '#ffffff').tint(0);
  if (waving) g.tube([[0.12, 1.3, 0], [0.3, 1.62, 0.1], [0.36, 2.0, 0.12]], 0.05, 4, SUIT);      // one arm up: time to wave
  else g.tube([[0.12, 1.3, 0], [0.45, 1.24, 0.12], [0.8, 1.18, 0.1]], 0.05, 4, SUIT);
  g.tube([[0.06, 1.3, 0], [-0.3, 1.22, -0.08], [-0.66, 1.1, -0.12]], 0.05, 4, SUIT);
  g.blob(0.14, 1.5, 0.03, 0.12, 0, skin, { shadeBottom: 0.8 });
  return g.build();
}
// lying on the board, head toward +x, paddling
function proneGeo(skin) {
  const g = new Geo();
  g.box(-0.95, 0.0, -0.13, -0.15, 0.16, 0.13, SUIT);
  g.tint(1).box(-0.15, 0.0, -0.18, 0.45, 0.24, 0.18, '#ffffff').tint(0);
  g.box(0.1, 0.04, 0.2, 0.6, 0.1, 0.27, SUIT); g.box(0.1, 0.04, -0.27, 0.6, 0.1, -0.2, SUIT);
  g.blob(0.62, 0.22, 0, 0.12, 0, skin, { shadeBottom: 0.8 });
  return g.build();
}
// a swimmer: head and shoulders out of the water
function swimGeo(skin) {
  const g = new Geo();
  g.tint(1).cyl(0, -0.5, 0, 0.2, 0.17, 0.55, 6, '#ffffff', { smooth: false }).tint(0);
  g.blob(0, 0.2, 0, 0.12, 0, skin, { shadeBottom: 0.8 });
  return g.build();
}

const _m = new Matrix4(), _q = new Quaternion(), _e = new Euler(0, 0, 0, 'YZX'), _p = new Vector3(), _s = new Vector3(1, 1, 1), _zero = new Matrix4().makeScale(0, 0, 0);
function place(mesh, i, x, y, z, yaw, pitch, roll) {
  _e.set(roll, yaw, pitch, 'YZX'); _q.setFromEuler(_e);
  mesh.setMatrixAt(i, _m.compose(_p.set(x, y, z), _q, _s));
}
function liveMesh(geo, mat, n) { const m = new InstancedMesh(geo, mat, Math.max(1, n)); m.frustumCulled = false; for (let i = 0; i < n; i++) m.setMatrixAt(i, _zero); return m; }

// ---------------------------------------------------------------- the floor's plan
export function* paintSquall(plan) {
  const rng = makeRng('squall-plan');
  plan.fill(plan.band(0, L), { color: '#87a084', life: 0.25 });
  yield;
  plan.mottle(['#90a98a', '#7c9a7c', '#98ae92', '#73927a', '#a2b69c'], 300, 150, { alpha: 0.22, seed: 'squall-lawn' });
  yield;
  // the Dim Ends
  plan.fill(plan.band(0, 700), { color: '#4d6e55', wood: 0.95, clear: ['life'], feather: 30 });
  plan.fill(plan.band(L - 700, L), { color: '#4a6b55', wood: 0.95, clear: ['life'], feather: 30 });
  for (let i = 0; i < 24; i++) plan.fill(plan.blob(rng.f(0, C), rng.chance(0.5) ? rng.f(380, 680) : rng.f(L - 680, L - 380), rng.f(40, 110), rng.f(30, 70), { seed: i + 3 }), { color: rng.pick(['#7d9a74', '#6c8d6c', '#89a47e']), clear: ['wood'], life: 0.3 });
  // woods and clumps over the rest of the floor, kept off the lake and its shores
  const offLake = (x, z) => !(x > XP - 140 && x < XE + 160 && z > Z0 - 150 && z < Z1 + 170);
  yield;
  plan.clumps(300, 12, 46, { seed: 'squall-clumps', z0: 720, z1: L - 720, colors: ['#5e8358', '#557b52', '#6a8f60'], keep: offLake });
  // a few big woods, and long meadows of a paler grass
  for (let i = 0; i < 22; i++) {
    const x = rng.f(0, C), z = rng.f(900, L - 900);
    if (!offLake(x, z)) continue;
    if (i % 2) plan.fill(plan.blob(x, z, rng.f(140, 320), rng.f(80, 180), { wobble: 0.35, lobes: 6, seed: 40 + i }), { color: rng.pick(['#6b8d66', '#73946c', '#678a66']), wood: 0.9, clear: ['life'] });
    else plan.fill(plan.blob(x, z, rng.f(200, 380), rng.f(90, 160), { wobble: 0.25, lobes: 5, seed: 70 + i }), { color: rng.pick(['#9db493', '#a7b998', '#93ab8f']), life: 0.5, feather: 20 });
  }
  yield;
  // gardens and greens
  for (let i = 0; i < 26; i++) {
    const x = rng.f(0, C), z = rng.f(820, L - 900), w = rng.f(70, 140), h = rng.f(60, 110);
    if (!offLake(x, z) || !offLake(x + w, z + h)) continue;
    plan.garden(x, z, x + w, z + h, ['#c9d7e6', '#e6e0c4', '#a9cfd2', '#d8c2d8', '#f0ead2']);
  }
  // pitches, kite fields and allotment strips, so the land overhead has a grain to it
  for (let i = 0; i < 40; i++) {
    const x = rng.f(0, C), z = rng.f(800, L - 900);
    if (!offLake(x, z) || !offLake(x + 260, z + 200)) continue;
    const kind = rng.i(0, 2);
    if (kind === 0) {
      for (let j = 0; j < 4; j++) { const px = x + j * 70; plan.fill(plan.rect(px, z, px + 60, z + 95, 3), { color: '#9cb882', life: 0.8 }); plan.stroke(plan.rect(px, z, px + 60, z + 95, 3), 1.6, { color: '#eef0e6' }); }
    } else if (kind === 1) {
      for (let j = 0; j < 14; j++) plan.fill(plan.rect(x, z + j * 9, x + rng.f(120, 220), z + j * 9 + 7), { color: rng.pick(['#7f9a5e', '#a3a86c', '#6f8f5a', '#b3aa7c', '#8fae7a', '#c4b98c']), life: 0.4 });
    } else {
      plan.fill(plan.ellipse(x + 120, z + 90, rng.f(120, 200), rng.f(70, 110), rng.f(-0.5, 0.5)), { color: '#a9bd8e', life: 0.7, clear: ['wood'] });
    }
  }
  yield;
  // walks: rings round the floor, lanes along it, lamps on all of them
  const walk = (pts, w) => { plan.stroke(pts, w, { color: '#cbc7b6', paved: 0.8, life: 0.6, clear: ['wood'] }); plan.lamps(pts, 28); };
  const ring = (z, wob) => { const a = []; for (let i = 0; i <= 120; i++) a.push([(i / 120) * C, z + Math.sin(i * 0.37 + z) * wob]); return a; };
  for (const z of [700, 1150, 2600, 3050]) walk(ring(z, 22), 6);
  for (let i = 0; i < 16; i++) { const x = (i / 16) * C + 120; if (x > XP - 200 && x < XE + 200) continue; walk([[x, 720], [x + 50, 1500], [x - 30, 2300], [x, L - 720]], 5); }

  yield;
  // ---- the lake: long round the drum, with beaches on its banks and a broad beach at the far end
  const sand = '#cfcab6';
  plan.fill(plan.rect(XP - 70, Z0 - 110, XE + 130, Z1 + 120, 60), { color: '#c9c5b3', paved: 0.6, life: 0.7, clear: ['wood', 'rows'] });
  plan.fill(plan.rect(XP - 10, Z0 - 42, XE + 95, Z1 + 42, 40), { color: sand, life: 0.9, water: 0.22, clear: ['paved'] });   // (water 0.22: no lift pavilions on the sand)
  plan.fill(plan.rect(XP - 2, Z0, XE, Z1, 4), { color: '#18343e', water: 0.28, clear: ['life', 'paved', 'wood', 'rows', 'lamp'] });
  // promenades along both banks, lit, and the crowd along the north one
  const north = [], south = [];
  for (let i = 0; i <= 60; i++) { const x = XP - 40 + (i / 60) * (XE - XP + 120); north.push([x, Z1 + 78]); south.push([x, Z0 - 78]); }
  plan.stroke(north, 14, { color: '#c3bfae', paved: 1, life: 1 }); plan.lamps(north, 24);
  plan.stroke(south, 10, { color: '#c3bfae', paved: 1, life: 0.6 }); plan.lamps(south, 24);
  plan.avenue(north, 13, 12, { color: '#5d8660' }); plan.avenue(south, 11, 13, { color: '#5d8660' });
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
    yield* paintSquall(plan);
    yield;
    const hollow = yield* buildHollow(ctx, {
      seed: 'squall', plan,
      light: { sun: '#dcefee', sunPower: 0.36, amb: '#6a8fa6', ambPower: 0.24, bounce: '#9fb39a', air: '#a9c8d6', airDensity: 0.00005, ground: '#ffcf90', groundPower: 0.2 },
      sunline: { power: 24 },
      ground: { people: 0.8, lamp: 0.85, lampColor: '#ffd49a', sunRod: 24, canopy: '#6f9468', stripes: 0.05 },
      front: { crowd: 0.2, lit: 0.45, houseMix: 0.4, houses: ['#cfe0e2', '#9fc0c8', '#e8ecea', '#b8cdd0', '#dfe6dc', '#a8bcc4'], stone: '#e6e7e0', stone2: '#cfd6d4' },
      back: { crowd: 0.25, lit: 0.45, houseMix: 0.4, houses: ['#cfe0e2', '#9fc0c8', '#e8ecea', '#b8cdd0', '#dfe6dc', '#a8bcc4'], stone: '#e6e7e0', stone2: '#cfd6d4' },
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
      uWallTint: { value: vec3col('#cfd6d4') }, uSunRod: { value: 24 }, uSunWidth: { value: 22 }, uWave: { value: 0.018 },
    };
    const XD = 2350;
    const near = waterMesh(hollow, XP, XD, 1.6, 4, 1, shared);
    const far = waterMesh(hollow, XD, XE, 10, 25, 0, shared);
    // the near mesh lies flat over its last stretch so it meets the far one without a seam
    near.material.vertexShader = near.material.vertexShader.replace('p.y = BASE + uDisp', 'p.y = BASE + uDisp * smoothstep(' + XD.toFixed(1) + ', ' + (XD - 80).toFixed(1) + ', p.x)');
    scene.add(near, far);
    yield;

    // ---- the flight: ride a crest, climb to see the trains go up the curve, turn over the north shore, out over the paddles
    // the flight starts 11 m behind a board riding the crest that is 8.5 m ahead at wave time 0
    const ZR = 1880, nHero = Math.round((1511.5 - XP) * KW / (2 * Math.PI) + phiZ(ZR) / (2 * Math.PI));
    const X0 = crestX(nHero, ZR, 0) + 2.5 - 11;
    const path = makePath([
      { t: 0, p: [X0, 5.2, ZR], look: [X0 + 60, 1.5, ZR] },
      { t: 4.5, p: [X0 + 17.5, 5.6, ZR - 1], look: [X0 + 78, 1.2, ZR - 3] },
      { t: 9, p: [X0 + 35, 6.8, ZR - 2], look: [X0 + 95, 1, ZR - 6] },
      { t: 13.5, p: [X0 + 62, 13, ZR - 14], look: [X0 + 170, 0, ZR - 10] },
      { t: 19, p: [X0 + 120, 48, ZR - 30], look: [X0 + 700, 0, ZR + 10] },
      { t: 26, p: [X0 + 250, 85, 1930], look: [X0 + 1500, 250, 2000] },
      { t: 34, p: [X0 + 300, 60, 2110], look: [X0 - 100, 0, 2200] },
      { t: 42, p: [X0 + 60, 17, 2178], look: [X0 - 200, 3, 2150] },
      { t: 50, p: [X0 - 250, 22, 2080], look: [XP, 12, 1950] },
      { t: 58, p: [XP + 70, 18, 1960] },
    ], { frame, entryRadius: 3.4, exitRadius: 14 });
    const pts = path.points(0.5);
    yield* scatterTrees(hollow, { near: pts, radius: 180, max: 20000 * ctx.density });
    yield* scatterPeople(hollow, { near: pts, radius: 240, density: 1.2 * ctx.density, max: 7000 });
    hollow.lampPosts({ near: pts, radius: 200, power: 3.5, color: '#ffd49a' });
    const rng = makeRng('squall-swell');
    const D = ctx.density;

    // ---- the paddle works: a hall along the paddle line, piers between the flaps, a gantry over them, people on top
    const NP = 42, PW = (Z1 - Z0) / NP;
    const hall = new Geo({ maxSeg: 16 });
    hall.box(XP - 40, 0, Z0 - 14, XP - 3, 13, Z1 + 14, '#dfe3dc', { top: '#c4cbc6' });
    hall.box(XP - 30, 13, Z0 - 6, XP - 14, 16, Z1 + 6, '#5d8a94', { top: '#cfd8d6', emit: 0.25 });   // a glass roof over the works
    for (let k = 0; k < 3; k++) hall.box(XP - 40.6, 1 + k * 4, Z0 - 14, XP - 40, 3.4 + k * 4, Z1 + 14, '#41565e', { emit: 0.3 });   // windows on the land side
    for (let i = 0; i <= NP; i++) {
      const z = Z0 + i * PW;
      hall.box(XP - 3, -1, z - 1.1, XP + 2.2, 9.2, z + 1.1, '#eef0ea', { top: '#d9ddd6' });
      hall.box(XP - 3, 6.4, z - 1.1 + (i ? 0 : 1), XP - 0.4, 9.2, z + PW - 1.1, '#34444b');     // the drive housings
      if (i % 3 === 0) { hall.cyl(XP + 1.2, 9.7, z, 0.12, 0.09, 6.5, 5, '#55636a'); hall.cyl(XP + 1.2, 16.1, z, 0.4, 0.34, 0.6, 6, '#f6fbf8', { emit: 1.6 }); }
    }
    hall.box(XP - 3.5, 9.2, Z0 - 2, XP + 3.8, 9.7, Z1 + 2, '#d6dbd5');                          // the gantry
    hall.box(XP + 3.6, 9.7, Z0 - 2, XP + 3.8, 10.8, Z1 + 2, '#a8b4b6');                         // its rail
    scene.add(hall.mesh(hollow.lit, frame));
    const flapG = new Geo(); flapG.box(-0.35, 0, -PW / 2 + 1.2, 0.35, 7.2, PW / 2 - 1.2, '#9fd0d6', { sides: '#7fb2ba', top: '#f3fdff' });
    flapG.box(0.35, 1.6, -PW / 2 + 1.5, 0.42, 6.4, PW / 2 - 1.5, '#f3fdff');
    const flaps = liveMesh(flapG.build(), litMaterial(hollow.rig, { bend: frame }), NP);
    scene.add(flaps);
    const watch = [];
    for (let i = 0; i < Math.round(700 * D); i++) {
      const top = rng.chance(0.55), z = rng.f(Z0 - 4, Z1 + 4);
      watch.push(top ? { p: [XP + rng.f(-2.5, 3.2), 9.7, z], yaw: Math.PI / 2 + rng.f(-0.4, 0.4), walk: rng.chance(0.25) ? 2 : 0, child: rng.chance(0.15) }
        : { p: [XP - rng.f(4, 13), 13, z], yaw: Math.PI / 2 + rng.f(-0.6, 0.6), walk: rng.chance(0.3) ? rng.f(1, 3) : 0, sit: rng.chance(0.2) });
    }
    for (const m of crowd(watch, hollow.walk, { frame, seed: 'paddle-watch' })) scene.add(m);
    yield;

    // ---- the north shore: the crowd at the water, board racks, boards laid on the sand
    const spots = [], laid = [];
    const shoreX0 = XP + 40, shoreX1 = X0 + 900;
    for (let i = 0; i < Math.round(2600 * D); i++) {
      const x = rng.f(shoreX0, shoreX1), north = rng.chance(0.75);
      const d = Math.pow(rng(), 1.6) * 34;
      const z = north ? Z1 + 4 + d : Z0 - 4 - d;
      const r = rng();
      spots.push({ p: [x, 0, z], yaw: (north ? Math.PI : 0) + rng.f(-0.5, 0.5), walk: r < 0.18 ? rng.f(2, 8) : 0, sit: r > 0.7, child: r > 0.62 && r < 0.7 });
      if (rng.chance(0.12)) laid.push({ p: [x + rng.f(-1.5, 1.5), 0.02, z + rng.f(-1.5, 1.5)], yaw: rng.f(0, 6.28), color: rng.pick(BOARDS) });
    }
    for (const m of crowd(spots, hollow.walk, { frame, seed: 'shore' })) scene.add(m);
    for (const m of instances(boardGeo(), litMaterial(hollow.rig, { bend: frame, side: 'double', soft: 0.2 }), laid, { frame, cell: 300 })) scene.add(m);
    const racks = new Geo({ maxSeg: 16 });
    for (let x = shoreX0 + 20; x < shoreX1; x += rng.f(26, 40)) {
      for (const side of [1, -1]) {
        const z = side > 0 ? Z1 + 56 : Z0 - 56;
        racks.cyl(x - 1.6, 0, z, 0.07, 0.07, 2.4, 4, '#5a6a70'); racks.cyl(x + 1.6, 0, z, 0.07, 0.07, 2.4, 4, '#5a6a70');
        racks.box(x - 1.7, 2.3, z - 0.06, x + 1.7, 2.42, z + 0.06, '#5a6a70');
        const nb = 5 + Math.floor(rng() * 6);
        for (let b = 0; b < nb; b++) {
          const bx = x - 1.4 + (b / Math.max(1, nb - 1)) * 2.8;
          racks.push().at(bx, 0, z - side * 0.4, 0).rot('x', side * 0.22).rot('z', Math.PI / 2);
          racks.box(0, -0.05, -0.28, 2.6, 0.05, 0.28, rng.pick(BOARDS));
          racks.pop().pop().pop();
        }
      }
    }
    scene.add(racks.mesh(hollow.lit, frame));
    yield;

    // ---- riders. Each catches a crest, stands up, rides it, and in the end falls off, slowly, and goes under
    // to come up again somewhere else. The hero riders ride the crests just ahead of the flight's start.
    const riders = [];
    const lane = (z) => Math.min(Z1 - 45, Math.max(Z0 + 45, z));
    for (const [dz, dn, fallAt] of [[0, 0, 6.5], [-11, 0, 70], [9, 0, 38], [-26, 1, 70], [21, 1, 70], [-6, 2, 70], [33, 0, 70], [-40, 2, 70]]) {
      riders.push({ hero: true, z: ZR + dz, dn, fallAt, vz: rng.f(-0.25, 0.25), cloth: rng.pick(CLOTH), skin: rng.pick(SKIN), board: rng.pick(BOARDS) });
    }
    for (let i = 0; i < Math.round(110 * D); i++) {
      riders.push({ hero: false, z: rng.f(Z0 + 50, Z1 - 50), P: rng.f(32, 58), o: rng.f(0, 60), span: rng.chance(0.7) ? 900 : 2100, vz: rng.f(-0.9, 0.9), id: i,
        cloth: rng.pick(CLOTH), skin: rng.pick(SKIN), board: rng.pick(BOARDS), side: rng.sign(), c0: -1 });
    }
    // a line-up waiting on their boards ahead of the climb, each standing up as a crest reaches them
    for (let i = 0; i < 12; i++) {
      const tc = 8.5 + i * 0.75 + rng.f(-0.3, 0.3), wait = tc + 2;
      riders.push({ hero: false, z: ZR - 46 + i * 6.5 + rng.f(-2, 2), P: wait + 30 + rng.f(0, 8), o: 2, wait, c0: 0, xd0: X0 + 85 + rng.f(0, 40), span: 900, vz: rng.f(-0.5, 0.5), id: 500 + i,
        cloth: rng.pick(BOARDS), skin: rng.pick(SKIN), board: rng.pick(BOARDS), side: rng.sign() });
    }
    const riderMat = litMaterial(hollow.rig, { bend: frame, side: 'double', soft: 0.35 });
    const bySkin = new Map();
    for (const r of riders) { let a = bySkin.get(r.skin); if (!a) bySkin.set(r.skin, a = []); r.k = a.length; a.push(r); }
    const boardM = liveMesh(boardGeo(), riderMat, riders.length);
    riders.forEach((r, i) => { r.i = i; boardM.setColorAt(i, new Color(r.board)); });
    scene.add(boardM);
    const figM = new Map();
    for (const [skin, list] of bySkin) {
      const st = liveMesh(standGeo(skin), riderMat, list.length), pr = liveMesh(proneGeo(skin), riderMat, list.length);
      list.forEach((r, k) => { st.setColorAt(k, new Color(r.cloth)); pr.setColorAt(k, new Color(r.cloth)); });
      figM.set(skin, { st, pr }); scene.add(st, pr);
    }
    // the first hero waves as she goes over
    const hero = riders[0];
    boardM.setColorAt(0, new Color('#e8b44a'));
    const waveM = liveMesh(standGeo(hero.skin, true), riderMat, 1);
    waveM.setColorAt(0, new Color(hero.cloth)); scene.add(waveM);
    // swimmers near the banks, rising and falling as the swell runs past
    const swimmers = [];
    for (let i = 0; i < Math.round(160 * D); i++) {
      const north = rng.chance(0.7), x = rng.f(XP + 30, X0 + 800);
      swimmers.push({ x, z: north ? Z1 - rng.f(4, 34) : Z0 + rng.f(4, 34), skin: rng.pick(SKIN), cloth: rng.pick(['#2d5f70', '#c94f5a', '#e8b44a', '#f3fdff', '#1d262c']), ph: rng.f(0, 6.28) });
    }
    const swimBy = new Map();
    for (const s of swimmers) { let a = swimBy.get(s.skin); if (!a) swimBy.set(s.skin, a = []); s.k = a.length; a.push(s); }
    const swimM = [];
    for (const [skin, list] of swimBy) {
      const m = liveMesh(swimGeo(skin), riderMat, list.length);
      list.forEach((s, k) => m.setColorAt(k, new Color(s.cloth)));
      swimM.push({ m, list }); scene.add(m);
    }
    yield;

    // ---- wave time. In the flight it is the flight's clock plus what ran while this world was only seen through the
    // last one's opening, so nothing jumps at the crossing. The hero riders keep to whichever crests are just ahead of
    // the start when the flight begins.
    let pre = 0, started = false, w0 = 0;
    const heroN = (z, w) => Math.ceil((X0 + 1.5 - XP) * KW / (2 * Math.PI) - (OM * w - phiZ(z)) / (2 * Math.PI));
    const nAt = (xd, z, wc) => Math.round((xd - XP) * KW / (2 * Math.PI) - (OM * wc - phiZ(z)) / (2 * Math.PI));

    function riderPose(r, w, t) {
      // returns [x, y, z, yaw, pitch, roll, pose (0 hidden, 1 prone, 2 standing), stand 0..1, board sink]
      let x, z = r.z, pose = 2, stand = 1, roll = 0, sink = 0, bsink = 0, u;
      if (r.hero) {
        const n = (started ? r.n : heroN(r.z, w)) + r.dn;
        const tt = started ? t : 0;
        u = tt - r.fallAt;
        z = lane(r.z + r.vz * tt);
        x = crestX(n, z, w) + 2.5 + r.dn * 0.0;
        if (u > 0) {
          roll = sstep(0, 3.2, u) * 1.5 * (r.vz > 0 ? 1 : -1);
          x -= u * u * 0.18 * (u < 4 ? 1 : 0) + (u >= 4 ? 2.9 + (u - 4) * CW * 0.85 : 0);
          sink = sstep(2.6, 6, u) * 2.2; bsink = sstep(14, 16, u) * 1.4;     // the board floats on
          if (u > 16) return null;
        }
      } else {
        const T = w + r.o, cyc = Math.floor(T / r.P);
        u = T - cyc * r.P;
        const first = cyc === r.c0, wait = first ? r.wait : 6;
        const xd = first ? r.xd0 : XP + 70 + hash2(r.id, cyc, 3) * r.span;
        z = first ? r.z : lane(r.z + (hash2(r.id, cyc, 5) - 0.5) * 120);
        const wc = w - u + wait, n = nAt(xd - 2.5, z, wc);
        const xs = crestX(n, z, wc) + 2.5;
        const ride = Math.min(u, r.P - 7) - wait;
        if (u < wait) { x = xs; pose = 1; stand = 0; sink = (1 - sstep(0, 2, u)) * 1.4; bsink = sink; }
        else {
          z = lane(z + r.vz * ride);
          x = crestX(n, z, w) + 2.5;
          stand = sstep(wait, wait + 1.8, u);
          const f = u - (r.P - 7);
          if (f > 0) {
            roll = sstep(0, 3.2, f) * 1.5 * r.side;
            x -= f < 4 ? f * f * 0.18 : 2.9 + (f - 4) * CW * 0.85;
            sink = sstep(2.6, 6, f) * 2.2; bsink = sstep(5, 6.8, f) * 1.4;
          }
        }
        if (x > XE - 90) return null;
      }
      const y = swellY(x, z, w);
      const pitch = Math.atan(swellDX(x, z, w));
      return [x, y, z, -Math.atan2(r.vz, CW), pitch, roll, pose, stand, sink, bsink];
    }

    function animate(t, w) {
      for (let i = 0; i < NP; i++) {
        const z = Z0 + (i + 0.5) * PW, th = thetaW(XP, z, w);
        place(flaps, i, XP + 0.2, -1.6, z, 0, -0.3 * Math.sin(-th + 0.7), 0);
      }
      flaps.instanceMatrix.needsUpdate = true;
      for (const r of riders) {
        const q = riderPose(r, w, t), fm = figM.get(r.skin);
        if (!q) { if (r === hero) waveM.setMatrixAt(0, _zero); boardM.setMatrixAt(r.i, _zero); fm.st.setMatrixAt(r.k, _zero); fm.pr.setMatrixAt(r.k, _zero); continue; }
        const [x, y, z, yaw, pitch, roll, pose, stand, sink, bsink] = q;
        place(boardM, r.i, x, y - 0.06 - bsink, z, yaw, pitch, 0);
        if (pose === 1) { place(fm.pr, r.k, x, y + 0.03 - sink, z, yaw, pitch, 0); fm.st.setMatrixAt(r.k, _zero); }
        else if (r === hero && roll !== 0) { place(waveM, 0, x, y + 0.03 - sink, z, yaw, pitch, roll); fm.st.setMatrixAt(r.k, _zero); fm.pr.setMatrixAt(r.k, _zero); }
        else { place(fm.st, r.k, x, y + 0.03 - sink, z, yaw, pitch - (1 - stand) * 1.45, roll); fm.pr.setMatrixAt(r.k, _zero); }
        if (r === hero && (pose !== 2 || roll === 0)) waveM.setMatrixAt(0, _zero);
      }
      waveM.instanceMatrix.needsUpdate = true;
      boardM.instanceMatrix.needsUpdate = true;
      for (const f of figM.values()) { f.st.instanceMatrix.needsUpdate = true; f.pr.instanceMatrix.needsUpdate = true; }
      for (const { m, list } of swimM) {
        for (const s of list) { const y = swellY(s.x, s.z, w); place(m, s.k, s.x + Math.sin(w * 0.3 + s.ph) * 0.8, y - 0.05 + 0.08 * Math.sin(w * 1.7 + s.ph), s.z, s.ph, 0, 0); }
        m.instanceMatrix.needsUpdate = true;
      }
    }

    return {
      scene, path, hollow, near: 0.5, far: 9000,
      look: { exposure: 2.0, bloom: 0.26, threshold: 0.8, saturation: 1.08, contrast: 1.06, vignette: 0.45 },
      portal: { mist: '#9fd0d6' },
      update(t, dt) {
        if (t <= 0 && !started) pre += dt;
        if (t > 0 && !started) { started = true; w0 = pre; for (const r of riders) if (r.hero) r.n = heroN(r.z, w0); }
        const w = started ? w0 + t : pre;
        shared.uW.value = w;
        animate(t, w);
      },
    };
  },
};
