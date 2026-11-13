// Squall, Weather Row: swell hour. Paddles at one end of the Hollow lake make waves for three hours a day, and at half a g
// a wave comes in slow and tall, five seconds from crest to crest (wander-year.md, Day 103, and Method: Half-g waves;
// 15-canon.js, Squall: the Sea-glass palette, "Stand up slowly", the eleventh try, swell hour open to all).
//
// The flight starts in a set: a dozen riders on every crest, one followed close along the face until she falls off,
// slowly, with time to wave. It lifts to see the crests climb the curve of the lake like the rungs of a ladder, turns
// along the north shore (sand, beach huts, boathouses, the promenade, the lawns stepped down to the water and the people
// watching from them), and runs in low over the swell to the paddle works, where each crest is born, and out through an
// opening hung over the flaps.
//
// The water is done honestly where it can be. Every crest travels at the deep-water speed for a 20 m wave at half a g
// (3.95 m/s, 5.1 s apart); sets of eight run at half that, so crests rise at the back of a set and die at its front.
// Riders keep to the face of their crest. Spray is thrown on true paths in the turning drum: up and down at half a g,
// leaning spinward as it rises (docs/ashgrove.md, "Weight is a map"), so a fan of spray two metres high hangs for
// nearly two seconds.
//
// Not canon (the docs say only "a long lake with paddles at one end"):
// - the lake's shape: 2.6 km long round the drum, 550 m wide along the axis, straight banked sides, a beach at the far end
// - the paddle works: a hall along the paddle line with forty-two hinged flaps worked by rods from a gantry, a watching
//   gallery on its roof, and a paved square behind it
// - the shores: sand, a row of beach huts in strong colours, boathouses with slipways, board racks, a lit promenade with
//   an avenue, lawns stepped down to the water in six terraces where people sit and watch
// - the rest of the floor's plan: ring walks and cross lanes with lamps, and between them allotments, formal gardens,
//   lawns, woods, orchards, pitches and a few outdoor pools
// - the wave's exact shape (a 1.6 m swell, 20 m crest to crest, sets of eight) beyond the numbers in Method; foam along
//   the crests of a set, and riders' wakes
import {
  Scene, BufferGeometry, BufferAttribute, Float32BufferAttribute, InstancedBufferGeometry, InstancedBufferAttribute,
  DynamicDrawUsage, Mesh, ShaderMaterial, Vector2, Vector3, Vector4, Sphere, Matrix4, Quaternion, InstancedMesh, Euler, Color,
} from 'three';
import { Plan, C, L } from '../kit/plan.js';
import { buildHollow } from '../kit/hollow.js';
import { makePath } from '../core/path.js';
import { scatterTrees } from '../kit/flora.js';
import { scatterPeople, crowd, SKIN } from '../kit/folk.js';
import { Geo, instances } from '../kit/geo.js';
import { G, BEND_PARS, CLIP_PARS, CLIP_FRAG, NOISE_GLSL, vec3col, litMaterial } from '../kit/mats.js';
import { DRUM } from '../kit/drum.js';
import { makeRng, hash2 } from '../core/rng.js';

// ---------------------------------------------------------------- the lake and its swell
const XP = 1000, XE = 3600;          // the paddle line, and the beach at the far end (flat x, spinward)
const Z0 = 1600, Z1 = 2150;          // the two long banks (flat z): Z1 is the north bank
const HW = 1.6;                      // swell height, trough to crest, metres
const LAM = 20;                      // crest to crest
const KW = (2 * Math.PI) / LAM;
const OMEGA = DRUM.OMEGA, GH = OMEGA * OMEGA * DRUM.RH;   // the Hollow floor: half a g
const OM = Math.sqrt(GH * KW);       // deep water: about 5.1 s between crests
const CW = OM / KW;                  // about 3.95 m/s
const KG = (2 * Math.PI) / (LAM * 8), CG = CW / 2;   // sets of eight waves, travelling at the group speed
const SETA = 0.42;                   // how far the swell falls between sets
const BASE = 0.3;                    // the still water stands this far above the painted lake bed
const ZH = 1872;                     // the lane of the rider the flight follows
// the set is placed so that its highest crest is the one she rides, five seconds into the flight
const XH0 = 1255;
const SPH = ((KG * (XH0 + CW * 5 - XP - CG * 5)) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

const sstep = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const phiZ = (z) => 0.35 * Math.sin(z * 0.011 + 1.3) + 0.2 * Math.sin(z * 0.027);
function envW(x, z, w) {
  const a = sstep(XP + 1, XP + 40, x) * sstep(Z0, Z0 + 35, z) * sstep(Z1, Z1 - 35, z) * sstep(XE, XE - 70, x);
  return a * (0.62 + 0.38 * Math.exp(-(x - XP) / 1100)) * (1 - SETA + SETA * Math.cos(KG * (x - XP - CG * w) - SPH));
}
const thetaW = (x, z, w) => KW * (x - XP) - OM * w + phiZ(z);
/** height of the water at flat (x, z) at wave time w */
function swellY(x, z, w) { const s = 0.5 + 0.5 * Math.cos(thetaW(x, z, w)); return BASE + HW * envW(x, z, w) * s * Math.sqrt(s); }
/** slope of the water along x */
function swellDX(x, z, w) { const th = thetaW(x, z, w), s = 0.5 + 0.5 * Math.cos(th); return HW * envW(x, z, w) * 1.5 * Math.sqrt(s) * (-0.5 * Math.sin(th)) * KW; }
/** x of crest number n at z, time w */
const crestX = (n, z, w) => XP + (OM * w - phiZ(z) + 2 * Math.PI * n) / KW;
/** the crest nearest x at z, time w */
const crestN = (x, z, w) => Math.round(((x - XP) * KW - OM * w + phiZ(z)) / (2 * Math.PI));
const lane = (z) => Math.min(Z1 - 30, Math.max(Z0 + 30, z));

const SWELL_GLSL = /* glsl */`
const float XP = ${XP.toFixed(1)}, XE = ${XE.toFixed(1)}, Z0 = ${Z0.toFixed(1)}, Z1 = ${Z1.toFixed(1)};
const float HW = ${HW.toFixed(3)}, KW = ${KW.toFixed(6)}, OM = ${OM.toFixed(6)}, KG = ${KG.toFixed(6)}, CG = ${CG.toFixed(6)}, BASE = ${BASE.toFixed(3)};
const float SETA = ${SETA.toFixed(3)}, SPH = ${SPH.toFixed(5)};
float kPhi(float z) { return 0.35 * sin(z * 0.011 + 1.3) + 0.2 * sin(z * 0.027); }
float kPhiD(float z) { return 0.35 * 0.011 * cos(z * 0.011 + 1.3) + 0.2 * 0.027 * cos(z * 0.027); }
float kEnv(float x, float z, float w) {
  float a = smoothstep(XP + 1.0, XP + 40.0, x) * smoothstep(Z0, Z0 + 35.0, z) * smoothstep(Z1, Z1 - 35.0, z) * smoothstep(XE, XE - 70.0, x);
  return a * (0.62 + 0.38 * exp(-(x - XP) / 1100.0)) * (1.0 - SETA + SETA * cos(KG * (x - XP - CG * w) - SPH));
}
`;

const WATER_VERT = /* glsl */`
${BEND_PARS}
uniform float uW, uDisp; uniform vec2 uFlat;
varying vec3 vW; varying vec3 vF;
${SWELL_GLSL}
void main() {
  vec3 p = position, n = vec3(0.0, 1.0, 0.0);
  float th = KW * (p.x - XP) - OM * uW + kPhi(p.z);
  float s = 0.5 + 0.5 * cos(th);
  p.y = BASE + uDisp * smoothstep(uFlat.y, uFlat.x, p.x) * HW * kEnv(p.x, p.z, uW) * s * sqrt(s);
  vF = p;
  kBend(p, n);
  vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

const NWAKE = 20;
const waterFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform sampler2D tAlb;
uniform vec2 uSize;
uniform vec3 uBend, uDeep, uShallow, uFoam, uWallTint;
uniform float uTime, uW, uSunRod, uSunWidth, uWave;
uniform vec4 uWk[${NWAKE}];      // riders' wakes: flat x, z, heading (radians from +x), strength
uniform vec4 uSp[3];            // splashes: flat x, z, radius, strength
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
  float keep = smoothstep(18.0, 5.0, px);                      // crests under a few pixels apart blur into a sheen
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
  refl = uWallTint * (uAmb * 2.2 + kSunColor(vW.xy) * 0.25);
  float inside = tt > 0.0 ? smoothstep(-60.0, 160.0, min(Hh.z, uSize.y - Hh.z)) : 0.0;
  if (inside > 0.0) {
    vec2 huv = vec2(fract(atan(Hh.y, Hh.x) / 6.2831853 - uBend.x / 6.2831853), clamp(Hh.z / uSize.y, 0.0, 1.0));
    vec3 ha = textureLod(tAlb, huv, 5.6).rgb;
    refl = mix(refl, ha * (kSunColor(Hh.xy) * kSunE(Hh, vec3(-normalize(Hh.xy), 0.0)) + uAmb), inside);
  }
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
  vec3 body = mix(uDeep, uShallow, clamp(crest * 1.5 + 0.08, 0.0, 1.0)) * (Lgt * 0.9 + 0.03);
  body += uShallow * crest * pow(1.0 - ndv, 2.0) * (Lgt + uAmb) * 0.4;
  vec3 wcol = body * (1.0 - fres) + (refl + sunRefl) * fres;

  // foam: where the swell breaks on the far beach, and churned up along the paddles
  float fn = kNoise(m * vec2(0.9, 0.35) + vec2(0.0, t)) * 0.6 + kNoise(m * 2.3 - vec2(t, 0.0)) * 0.4;
  float brk = smoothstep(XE - 150.0, XE - 60.0, m.x) * smoothstep(0.55, 0.95, s) + smoothstep(XE - 45.0, XE - 5.0, m.x) * 0.8;
  float churn = smoothstep(XP + 16.0, XP + 1.0, m.x) * (0.6 + 0.4 * s);
  float foam = clamp((brk + churn) * smoothstep(0.35, 0.7, fn + 0.25 * s), 0.0, 1.0) * smoothstep(Z0, Z0 + 4.0, m.y) * smoothstep(Z1, Z1 - 4.0, m.y);
  // a lip of white along the top of each crest of a set, spilling a little down the front face and broken along it
  float ph = mod(th + 3.14159265, 6.2831853) - 3.14159265;            // 0 at the crest, rising toward the face ahead
  float dw = max(px * KW, 0.02);
  float lip = 1.0 - smoothstep(0.13, 0.2 + dw, abs(ph - 0.06));
  float ci = floor((th + 3.14159265) / 6.2831853);
  float brkup = kNoise(vec2(m.y * 0.035, ci * 3.17)) * 0.7 + kNoise(vec2(m.y * 0.21 + ci, m.x * 0.6)) * 0.3;
  float froth = kNoise(m * vec2(0.9, 0.55) + vec2(ci * 5.1, t)) * 0.6 + kNoise(m * 3.7 - vec2(t, ci)) * 0.4;
  float near = smoothstep(0.6, 0.08, px);
  lip *= mix(smoothstep(0.42, 0.7, froth + 0.08), smoothstep(0.5, 0.68, froth + 0.1), near);
  lip = mix(lip, 0.2, smoothstep(0.7, 2.6, dw));                    // far off the lip is less than a pixel: its share of one
  float high = smoothstep(0.48, 0.86, e);
  foam = max(foam, lip * smoothstep(0.45, 0.85, brkup + high * 0.1) * high * 0.45);
  // far up the lake each crest line catches the light: the rungs of the ladder
  float rung = smoothstep(0.86, 1.0, s) * smoothstep(1.2, 4.0, dw * 6.0) * high;
  wcol += (kSunColor(vW.xy) * 0.35 + uAmb) * rung * 0.6;
  // lacing: the thin wandering lines of old foam a swell carries, stretched along the crests
  vec2 lq = (m - vec2(${CW.toFixed(4)} * uW * 0.92, 0.0)) * vec2(0.07, 0.022);
  float lace = (1.0 - smoothstep(0.0, 0.018 + px * 0.006, abs(kNoise(lq) + 0.5 * kNoise(lq * 2.7 + 9.0) - 0.75))) * smoothstep(0.7, 0.15, px);
  foam = max(foam, lace * e * (0.1 + 0.14 * s));
  // wakes: a churned line under each board and a V of white spreading behind it
  float wk = 0.0;
  for (int i = 0; i < ${NWAKE}; i++) {
    vec4 k = uWk[i];
    if (k.w <= 0.0) continue;
    vec2 d = m - k.xy;
    if (dot(d, d) > 1600.0) continue;
    vec2 f = vec2(cos(k.z), sin(k.z));
    float a = -dot(d, f), c = dot(d, vec2(-f.y, f.x));
    if (a < -1.4 || a > 20.0) continue;
    float spread = 0.28 + max(a, 0.0) * 0.16;
    float arm = 1.0 - smoothstep(0.0, 0.1 + max(a, 0.0) * 0.012 + px * 0.7, abs(abs(c) - spread));
    float core = (1.0 - smoothstep(0.15, 0.45 + max(a, 0.0) * 0.04, abs(c))) * smoothstep(-1.4, -0.3, a) * (1.0 - smoothstep(1.0, 9.0, a));
    float brk2 = smoothstep(0.3, 0.7, kNoise(m * 2.2 + float(i) * 7.3 + vec2(t, 0.0)) * 0.6 + kNoise(m * 6.1) * 0.4);
    wk = max(wk, (arm * 0.6 * smoothstep(0.0, 1.2, a) + core * 0.9) * (1.0 - smoothstep(3.0, 20.0, a)) * brk2 * k.w);
  }
  for (int i = 0; i < 3; i++) {
    vec4 k = uSp[i];
    if (k.w <= 0.0) continue;
    vec2 dd = m - k.xy;
    float r = length(dd) + (kNoise(vec2(atan(dd.y, dd.x) * 2.5, float(i) * 4.0 + k.z)) - 0.5) * k.z * 0.35;
    float ring = (1.0 - smoothstep(0.0, 0.18 + px, abs(r - k.z))) * 0.5;
    float fill = (1.0 - smoothstep(k.z * 0.2, k.z * 0.8, r)) * smoothstep(0.5, 0.9, k.w) * 0.35;
    float brk3 = smoothstep(0.25, 0.7, kNoise(m * 2.6 + float(i) * 3.1) * 0.6 + kNoise(m * 7.0) * 0.4);
    wk = max(wk, (ring * 0.8 + fill * 0.8) * brk3 * k.w);
  }
  foam = max(foam, wk);
  wcol = mix(wcol, uFoam * (Lgt + uAmb), clamp(foam, 0.0, 1.0));
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

function waterMesh(hollow, x0, x1, dx, dz, disp, flat, shared) {
  const g = gridGeo(x0, x1, Z0, Z1, dx, dz);
  const f = hollow.frame, pts = [];
  for (let i = 0; i <= 8; i++) for (const z of [Z0, Z1]) for (const y of [0, 2]) pts.push(f.point(x0 + (x1 - x0) * (i / 8), y, z));
  g.boundingSphere = new Sphere().setFromPoints(pts);
  const m = new ShaderMaterial({
    uniforms: { ...shared, uDisp: { value: disp }, uFlat: { value: new Vector2(flat[0], flat[1]) } },
    vertexShader: WATER_VERT, fragmentShader: waterFrag(hollow.rig),
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8,
  });
  const mesh = new Mesh(g, m);
  mesh.renderOrder = -6;        // before the ground, so the lake bed under it is never shaded
  return mesh;
}

// ---------------------------------------------------------------- riders: figures
const BOARDS = ['#f3fdff', '#9fd0d6', '#e8b44a', '#d9643f', '#2d5f70', '#f0e2c0', '#c94f5a', '#5fa8b0', '#f3fdff', '#e9d36a', '#3a6ea5'];
const VESTS = ['#d9643f', '#f3fdff', '#c94f5a', '#5fa8b0', '#4f9a6a', '#9fd0d6', '#3a6ea5', '#2d5f70', '#e7e1d3', '#a34b86', '#e07a5f'];
const SUIT = '#222d34';

function boardGeo(far) {
  const g = new Geo();
  const sh = [[1.35, 0], [1.05, 0.25], [0.3, 0.3], [-1.1, 0.27], [-1.3, 0.16], [-1.3, -0.16], [-1.1, -0.27], [0.3, -0.3], [1.05, -0.25]];
  if (far) { g.tint(1).box(-1.3, 0, -0.28, 1.35, 0.09, 0.28, '#ffffff').tint(0); return g; }
  g.tint(1).extrude(sh, 0, 0.09, '#ffffff').tint(0);
  g.box(-0.9, 0.09, -0.02, 1.0, 0.095, 0.02, '#38444a');           // the stringer
  g.box(-1.25, 0.09, -0.2, -0.75, 0.1, 0.2, '#2a3338');             // the tail pad
  return g;
}
// standing sideways on the board, knees bent, arms out: feet along x, facing +z. Torso and arms take the vest colour.
function standGeo(g, sides = 4) {
  g.tube([[0.42, 0.0, 0], [0.3, 0.42, 0.1], [0.06, 0.82, 0]], 0.075, sides, SUIT);
  g.tube([[-0.42, 0.0, 0], [-0.28, 0.42, 0.1], [-0.05, 0.82, 0]], 0.075, sides, SUIT);
  g.tint(1);
  g.tube([[0, 0.8, 0], [0.06, 1.08, 0.04], [0.1, 1.34, 0.03]], 0.15, sides + 1, '#ffffff');
  g.tube([[0.14, 1.3, 0], [0.45, 1.24, 0.12], [0.8, 1.16, 0.1]], 0.05, 4, '#ffffff');
  g.tube([[0.04, 1.3, 0], [-0.3, 1.22, -0.08], [-0.66, 1.08, -0.12]], 0.05, 4, '#ffffff');
  g.tint(0);
  return g;
}
// lying on the board, head toward +x, paddling
function proneGeo(g) {
  g.box(-0.95, 0.0, -0.13, -0.15, 0.16, 0.13, SUIT);
  g.tint(1).box(-0.15, 0.0, -0.18, 0.45, 0.24, 0.18, '#ffffff');
  g.box(0.1, 0.04, 0.2, 0.62, 0.1, 0.27, '#ffffff'); g.box(0.1, 0.04, -0.27, 0.62, 0.1, -0.2, '#ffffff').tint(0);
  return g;
}
// sitting astride the board, legs in the water, facing +x
function sitGeo(g) {
  for (const s of [-1, 1]) g.tube([[0.05, 0.12, s * 0.12], [0.3, -0.12, s * 0.34], [0.22, -0.62, s * 0.3]], 0.075, 4, SUIT);
  g.tint(1).tube([[0, 0.08, 0], [-0.02, 0.36, 0], [-0.04, 0.66, 0]], 0.16, 5, '#ffffff');
  for (const s of [-1, 1]) g.tube([[0, 0.6, s * 0.17], [0.12, 0.36, s * 0.24], [0.26, 0.16, s * 0.24]], 0.05, 4, '#ffffff');
  g.tint(0);
  return g;
}
// a swimmer: head and shoulders out of the water
function swimGeo(g) { g.tint(1).cyl(0, -0.5, 0, 0.2, 0.17, 0.55, 6, '#ffffff', { smooth: false }).tint(0); return g; }
const HEAD = { stand: [0.14, 1.5, 0.03], prone: [0.64, 0.22, 0], sit: [-0.04, 0.84, 0], swim: [0, 0.2, 0] };
function headGeo(at) { const g = new Geo(); g.tint(1).blob(at[0], at[1], at[2], 0.12, 0, '#ffffff', { shadeBottom: 0.8 }).tint(0); return g.build(); }
// far off: one mesh each, board and rider together, the vest tinted and the board white
function farGeo(kind) {
  const g = new Geo();
  if (kind !== 'swim') { g.box(-1.3, 0, -0.28, 1.35, 0.09, 0.28, '#eef4f2'); g.push().at(0, 0.09, 0); }
  if (kind === 'stand') {
    g.box(-0.42, 0, -0.08, 0.42, 0.8, 0.08, SUIT);
    g.tint(1).box(-0.1, 0.8, -0.15, 0.22, 1.34, 0.15, '#ffffff').box(-0.66, 1.12, -0.05, 0.8, 1.24, 0.05, '#ffffff').tint(0);
    g.box(0.06, 1.38, -0.1, 0.26, 1.6, 0.1, '#c89870');
  } else if (kind === 'prone') {
    g.box(-0.95, 0, -0.13, -0.15, 0.16, 0.13, SUIT); g.tint(1).box(-0.15, 0, -0.18, 0.5, 0.24, 0.18, '#ffffff').tint(0);
    g.box(0.5, 0.08, -0.1, 0.74, 0.32, 0.1, '#c89870');
  } else if (kind === 'sit') {
    g.tint(1).box(-0.16, 0, -0.17, 0.12, 0.66, 0.17, '#ffffff').tint(0); g.box(-0.14, 0.7, -0.1, 0.08, 0.92, 0.1, '#c89870');
  } else { g.tint(1).box(-0.18, -0.4, -0.18, 0.18, 0.05, 0.18, '#ffffff').tint(0); g.box(-0.1, 0.05, -0.1, 0.1, 0.28, 0.1, '#c89870'); }
  if (kind !== 'swim') g.pop();
  return g.build();
}
// the rider the flight follows: arms on their own, so that she can wave
function heroBodyGeo() {
  const g = new Geo();
  g.tube([[0.42, 0.0, 0], [0.3, 0.42, 0.1], [0.06, 0.82, 0]], 0.08, 6, SUIT);
  g.tube([[-0.42, 0.0, 0], [-0.28, 0.42, 0.1], [-0.05, 0.82, 0]], 0.08, 6, SUIT);
  g.tint(1).tube([[0, 0.8, 0], [0.04, 1.08, 0.03], [0.05, 1.36, 0.02]], 0.16, 8, '#ffffff').tint(0);
  g.cyl(0.05, 1.36, 0.02, 0.06, 0.05, 0.1, 6, '#c8946a');
  g.blob(0.05, 1.56, 0.02, [0.12, 0.135, 0.12], 1, '#c8946a', { shadeBottom: 0.8 });
  g.blob(0.03, 1.6, -0.01, [0.13, 0.11, 0.125], 1, '#3a2a20', { shadeBottom: 0.7 });      // hair, wet and dark
  return g.build();
}
// an arm from the shoulder (origin) along +x, a little bent, with a hand
function armGeo() {
  const g = new Geo();
  g.tint(1).tube([[0, 0, 0], [0.3, -0.02, 0.03], [0.58, 0.0, 0.0]], 0.052, 5, '#ffffff').tint(0);
  g.blob(0.64, 0.0, 0.0, [0.06, 0.045, 0.035], 0, '#c8946a');
  return g.build();
}

const _m = new Matrix4(), _m2 = new Matrix4(), _q = new Quaternion(), _e = new Euler(0, 0, 0, 'YZX'), _p = new Vector3(), _s = new Vector3(1, 1, 1);
const _c = new Color();
/** a flat placing: yaw about up, pitch about the board's cross axis (nose up), roll about its long axis */
function mat(out, x, y, z, yaw, pitch, roll) { _e.set(roll, yaw, pitch, 'YZX'); _q.setFromEuler(_e); return out.compose(_p.set(x, y, z), _q, _s); }
// an instanced mesh filled afresh each frame with what is to be seen
function pack(geo, material, cap) {
  const mesh = new InstancedMesh(geo, material, Math.max(1, cap));
  mesh.frustumCulled = false; mesh.count = 0;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.setColorAt(0, _c.set('#ffffff'));
  mesh.instanceColor.setUsage(DynamicDrawUsage);
  const P = { mesh, n: 0, cap,
    put(m, color) { if (P.n >= cap) return; mesh.setMatrixAt(P.n, m); mesh.setColorAt(P.n, color); P.n++; },
    done() { mesh.count = P.n; mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; P.n = 0; } };
  return P;
}

// ---------------------------------------------------------------- riders: who is where, when
// Every rider keeps one timeline in wave time w (the flight's own clock once it has begun): waiting on the board until
// tc, when a crest reaches them; carried prone on its face; standing up at ts; riding the face, drifting along it; at tf
// falling off, slowly; then swimming beside the board. Riders far from the flight start again at intervals with a new
// place on the lake, in clusters that take the same crest (a set). The numbers below are what the flight needs.
const R_OUT = { vis: 0, pose: 'stand', x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, k: 1, ride: 0, head: 0,
  bvis: 0, bx: 0, by: 0, bz: 0, byaw: 0, bpitch: 0, broll: 0, u: 0 };
function riderAt(r, w, o = R_OUT) {
  let tc = r.tc, ts = r.ts, tf = r.tf, tEnd = r.tEnd, z0 = r.z, n = r.n, tw = r.tw;
  if (r.P) {
    const T = w + r.o, cyc = Math.floor(T / r.P), b = w - (T - cyc * r.P), cl = r.cl;
    const hx = hash2(cl.id, cyc, 7), hz = hash2(cl.id, cyc, 11);
    const xnom = XP + 50 + hx * cl.span, zc = lane(cl.z + (hz - 0.5) * 160);
    const tc0 = b + cl.wait;
    tw = b; tc = tc0 + r.jit; ts = tc + r.sd; tf = b + r.P - 8 - hash2(r.id, cyc, 3) * 6; tEnd = b + r.P;
    // the place where the flight starts is kept for the riders set there
    if (Math.abs(zc - ZH) < 230 && xnom > XH0 - 220 && xnom < XH0 + 320 && tc < 26 && tEnd > -24) { o.vis = 0; return o; }
    z0 = lane(zc + r.dz);
    n = crestN(xnom, zc, tc0);
    if (crestX(n, z0, Math.min(w, tf)) > XE - 90) { o.vis = 0; o.bvis = 0; return o; }
  }
  o.vis = 0; o.bvis = 0; o.ride = 0; o.u = 0;
  if (w < tw || w >= tEnd) return o;
  const off = r.off, yaw0 = -Math.atan2(r.vz, CW);
  o.tc = tc; o.ts = ts; o.tf = tf; o.n = n; o.z0 = z0;
  o.vis = 1; o.bvis = 1; o.roll = 0; o.k = 1;
  if (w < tc) {
    // waiting where the crest will find them: sitting, then lying down to paddle as it comes
    const x = crestX(n, z0, tc) + off - (w > tc - 2.5 ? 0 : 0.6);
    const y = swellY(x, z0, w), sl = Math.atan(swellDX(x, z0, w));
    const sit = r.wp === 'sit' && w < tc - 2.5;
    o.pose = sit ? 'sit' : 'prone'; o.x = x; o.y = y + (sit ? -0.04 : 0.02); o.z = z0;
    o.yaw = sit ? Math.PI + r.sy : yaw0; o.pitch = sit ? -sl : sl;
    o.bx = x; o.by = y - 0.07; o.bz = z0; o.byaw = o.yaw; o.bpitch = o.pitch; o.broll = 0;
    return o;
  }
  if (w < tf) {
    // carried on the face, carving gently along it and leaning into each turn
    const uu = w - tc, z = riderZ(r, z0, tc, w), x = crestX(n, z, w) + off, y = swellY(x, z, w), sl = Math.atan(swellDX(x, z, w));
    const vzE = r.vz + r.ca * r.cw * Math.cos(r.cw * uu), yaw = -Math.atan2(vzE, CW), k = sstep(ts, ts + 1.1, w);
    o.pose = k > 0.02 ? 'stand' : 'prone'; o.k = k; o.x = x; o.y = y + 0.03; o.z = z; o.yaw = yaw;
    o.pitch = k > 0.02 ? sl - (1 - k) * 1.42 : sl;
    o.roll = k * 0.3 * r.ca * r.cw * r.cw * Math.sin(r.cw * uu);
    o.ride = k > 0.6 ? 1 : 0.45; o.bx = x; o.by = y - 0.06; o.bz = z; o.byaw = yaw; o.bpitch = sl; o.broll = o.roll * 0.6;
    return o;
  }
  // falling off: the board runs on a little and stops; the rider goes over sideways, slowly, and comes up beside it
  const zf = riderZ(r, z0, tc, tf), xf = crestX(n, zf, tf) + off, u = w - tf, FD = r.fd;
  const ub = Math.min(u, 1.8), yawF = -Math.atan2(r.vz + r.ca * r.cw * Math.cos(r.cw * (tf - tc)), CW);
  o.bx = xf + CW * (ub - ub * ub / 3.6); o.bz = zf + r.vz * ub * 0.5;
  o.by = swellY(o.bx, o.bz, w) - 0.06; o.byaw = yawF + sstep(0, 2, u) * 0.5 * r.side; o.bpitch = Math.atan(swellDX(o.bx, o.bz, w)) * 0.6;
  o.broll = Math.sin(Math.min(u, 3) * 2.2) * 0.35 * Math.exp(-u * 0.6);
  o.u = u;
  if (u < FD) {
    const uu = Math.min(u, FD), x = xf + CW * (uu - uu * uu / (2 * FD));
    o.pose = 'stand'; o.x = x; o.z = zf; o.yaw = yawF;
    o.y = swellY(x, zf, w) + 0.03 + Math.sin(sstep(0, FD * 0.55, u) * Math.PI) * 0.22 - sstep(FD * 0.6, FD, u) * 0.55;
    o.pitch = Math.atan(swellDX(x, zf, w)) * (1 - u / FD); o.roll = sstep(FD * 0.12, FD, u) * 1.5 * r.side;
    return o;
  }
  const xs = xf + CW * FD * 0.5 + 0.4, zs = zf - r.side * 1.1;
  o.pose = 'swim'; o.x = xs; o.z = zs; o.y = swellY(xs, zs, w) - 0.08 + 0.05 * Math.sin(w * 1.9 + r.id); o.yaw = r.sy * 3; o.pitch = 0;
  o.head = sstep(FD, FD + 0.7, u);
  return o;
}

// ---------------------------------------------------------------- spray
// Small soft discs, lit as the water is. Where they are is worked out afresh each frame from when they were thrown, so a
// still picture at any second shows what the flight would.
const SPRAY_VERT = /* glsl */`
attribute vec4 aP;   // flat x, y, z; size (m)
attribute vec4 aV;   // velocity now (m/s); opacity
${BEND_PARS}
uniform float uPx, uMinPx, uStreak; uniform vec2 uRes;
varying vec3 vW; varying vec3 vF; varying vec2 vQ; varying float vA; varying float vLen; varying float vRad;
void main() {
  gl_Position = vec4(0.0, 0.0, 2.0, 1.0); vA = 0.0; vQ = vec2(0.0); vLen = 0.0; vRad = 1.0;
  vec3 n = vec3(0.0, 1.0, 0.0), h = aP.xyz, tl = aP.xyz - aV.xyz * uStreak;
  vF = h;
  kBend(h, n); kBend(tl, n);
  vec4 hw = modelMatrix * vec4(h, 1.0);
  vW = hw.xyz;
  vec4 ch = projectionMatrix * viewMatrix * hw, ct = projectionMatrix * viewMatrix * modelMatrix * vec4(tl, 1.0);
  if (ch.w < 0.2 || ct.w < 0.2) return;
  vec2 sh = ch.xy / ch.w * uRes * 0.5, st = ct.xy / ct.w * uRes * 0.5, d = sh - st;
  float len = length(d);
  vec2 dir = len > 1e-3 ? d / len : vec2(0.0, 1.0), perp = vec2(dir.y, -dir.x);
  float px = aP.w * uPx / ch.w, shown = max(px, uMinPx), rad = shown * 0.5;
  float along = mix(-rad, len + rad, position.y);
  gl_Position = vec4((st + dir * along + perp * position.x * rad) / (uRes * 0.5), ch.z / ch.w, 1.0);
  vQ = vec2(along, position.x * rad); vLen = len; vRad = rad;
  vA = aV.w * min(px * px / (shown * shown), 1.0) * clamp(4.0 * rad / max(len + 2.0 * rad, 1e-3), 0.25, 1.0);
}`;
const sprayFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform vec3 uFoam;
varying vec3 vW; varying vec3 vF; varying vec2 vQ; varying float vA; varying float vLen; varying float vRad;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  float dx = max(max(-vQ.x, vQ.x - vLen), 0.0);
  float r = length(vec2(dx, vQ.y)) / vRad;
  float a = (1.0 - smoothstep(0.3, 1.0, r)) * vA * mix(0.45, 1.0, vLen > 0.5 ? clamp(vQ.x / vLen, 0.0, 1.0) : 1.0);
  if (a < 0.004) discard;
  vec3 up = vec3(-normalize(vW.xy), 0.0);
  vec3 c = uFoam * (kLight(vW, up, vF, vec3(0.0, 1.0, 0.0)) * 0.95 + uAmb * 0.9);
  gl_FragColor = vec4(kAir(c, vW), a);
}`;
function makeSpray(rig, frame, cap) {
  const g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const P = new Float32Array(cap * 4), A = new Float32Array(cap * 4);
  const aP = new InstancedBufferAttribute(P, 4), aA = new InstancedBufferAttribute(A, 4);
  aP.setUsage(DynamicDrawUsage); aA.setUsage(DynamicDrawUsage);
  g.setAttribute('aP', aP); g.setAttribute('aV', aA);
  g.instanceCount = 0;
  const m = new ShaderMaterial({
    uniforms: { ...rig.uniforms, uClip: G.uClip, uPx: G.uPx, uRes: G.uRes, uMinPx: { value: 1.2 }, uStreak: { value: 0.07 }, uFoam: { value: vec3col('#f3fdff') },
      uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) } },
    vertexShader: SPRAY_VERT, fragmentShader: sprayFrag(rig), transparent: true, depthWrite: false,
  });
  const mesh = new Mesh(g, m);
  mesh.frustumCulled = false; mesh.renderOrder = 9;
  let n = 0;
  const S = {
    mesh, cap,
    begin() { n = 0; },
    /** a drop thrown at (x0, y0, z0) with velocity (vx, vy, vz), a seconds ago: drawn unless it is back in the water */
    throw(x0, y0, z0, vx, vy, vz, a, w, size, alpha) {
      if (n >= cap) return;
      const x = x0 + vx * a + OMEGA * vy * a * a - OMEGA * GH * a * a * a / 3;   // rising, it leans spinward
      const y = y0 + vy * a - 0.5 * (GH + 2 * OMEGA * vx) * a * a;               // thrown spinward it is a little heavier
      const z = z0 + vz * a;
      const wy = swellY(x, z, w);
      if (y < wy - 0.1) return;
      const i = n * 4; P[i] = x; P[i + 1] = y; P[i + 2] = z; P[i + 3] = size;
      A[i] = vx + 2 * OMEGA * vy * a - OMEGA * GH * a * a; A[i + 1] = vy - (GH + 2 * OMEGA * vx) * a; A[i + 2] = vz; A[i + 3] = alpha * sstep(wy - 0.1, wy + 0.25, y); n++;
    },
    end() { g.instanceCount = n; aP.needsUpdate = true; aA.needsUpdate = true; },
  };
  return S;
}

// ---------------------------------------------------------------- the floor's plan
// Painted as a few large shapes per colour (each a Path2D holding hundreds of pieces), never thousands of small calls.
class Bags {
  constructor() { this.m = new Map(); this.q = new Map(); }
  p(k) { let q = this.m.get(k); if (!q) this.m.set(k, q = new Path2D()); return q; }
  has(k) { return this.m.has(k); }
  /** a rectangle, drawn with fillRect: the canvas batches thousands of those into a few draws, where a path the size of
   *  the floor is filled over its whole extent */
  r(k, x0, z0, x1, z1) { let a = this.q.get(k); if (!a) this.q.set(k, a = []); a.push(x0, z0, x1 - x0, z1 - z0); }
  d(k, x, z, r) { this.r(k, x - r, z - r, x + r, z + r); }
  /** paint what is kept under k, rectangles and paths both */
  put(plan, k, o, sw) { if (this.q.has(k)) put(plan, this.q.get(k), o); if (this.m.has(k)) put(plan, this.m.get(k), o, sw); }
}
function rr(p, x0, z0, x1, z1, r = 0) { if (r > 0) p.roundRect(x0, z0, x1 - x0, z1 - z0, r); else p.rect(x0, z0, x1 - x0, z1 - z0); }
function el(p, cx, cz, rx, rz, rot = 0) { p.moveTo(cx + rx * Math.cos(rot), cz + rx * Math.sin(rot)); p.ellipse(cx, cz, rx, rz, rot, 0, Math.PI * 2); p.closePath(); }
function ln(p, pts) { pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); }
function dot(p, x, z, r) { p.moveTo(x + r, z); p.arc(x, z, r, 0, Math.PI * 2); }
// Plan.fill and Plan.stroke draw every shape three times, a turn apart, so that shapes may cross the seam at x = 0.
// Nothing painted with put() comes near the seam, so it is drawn once: the same layers, a third of the work.
const chan = (a, b, c) => (a || b || c ? `rgb(${[a, b, c].map((v) => Math.round(255 * Math.min(1, Math.max(0, v || 0)))).join(',')})` : null);
function put(plan, shape, o, sw = 0) {
  const run = (name, style, op, alpha) => plan.once(name, (cx) => {
    cx.globalCompositeOperation = op || 'source-over';
    if (alpha !== undefined) cx.globalAlpha = alpha;
    if (Array.isArray(shape)) { cx.fillStyle = style; for (let i = 0; i < shape.length; i += 4) cx.fillRect(shape[i], shape[i + 1], shape[i + 2], shape[i + 3]); }
    else if (sw) { cx.lineWidth = sw; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.strokeStyle = style; cx.stroke(shape); }
    else { cx.fillStyle = style; cx.fill(shape); }
  });
  if (o.clear) {
    const c = o.clear, mm = chan(c.includes('water') ? 0 : 1, c.includes('wood') ? 0 : 1, c.includes('lamp') ? 0 : 1), kk = chan(c.includes('paved') ? 0 : 1, c.includes('rows') ? 0 : 1, c.includes('life') ? 0 : 1);
    if (mm !== 'rgb(255,255,255)') run('mask', mm, 'multiply');
    if (kk !== 'rgb(255,255,255)') run('kind', kk, 'multiply');
  }
  if (o.color) run('alb', o.color, 'source-over', o.alpha);
  const m = chan(o.water, o.wood, o.lamp); if (m) run('mask', m, 'lighter');
  const k = chan(o.paved, o.rows, o.life); if (k) run('kind', k, 'lighter');
}

const RINGS = [600, 1000, 1310, 2440, 2800, 3150];
const NXL = 44, DXL = C / NXL;
const LQ = { x0: XP - 150, x1: XE + 190, z0: 1310, z1: 2440 };     // the lake's own quarter
const TER3D = [XP + 20, XP + 780];                                 // where the stepped lawns are built, not only painted
const HUTS = ['#d9643f', '#e8b44a', '#2d5f70', '#f3fdff', '#c94f5a', '#5fa8b0', '#3a6ea5', '#e9d36a'];
const BOATHOUSES = []; for (let x = XP + 95; x < XE - 60; x += 165) BOATHOUSES.push(x);
const bankZ = (side, d) => (side > 0 ? Z1 + d : Z0 - d);           // side +1 north bank, -1 south bank; d metres from the water
/** where the huts stand along a bank: every 4.6 m, with gaps for the boathouses and the stairs down from the lawns */
function hutSpots() {
  const out = [];
  for (const side of [1, -1]) {
    for (let x = XP + 30; x < XE - 30; x += 4.6) {
      if (BOATHOUSES.some((b) => Math.abs(x - b) < 16)) continue;
      if (((x - XP) % 150) < 9) continue;
      out.push({ x, side, c: Math.floor(hash2(Math.round(x * 10), side, 41) * HUTS.length) });
    }
  }
  return out;
}

export function* paintSquall(plan) {
  const rng = makeRng('squall-plan');
  const B = new Bags();
  plan.fill(plan.band(0, L), { color: '#93ac8e', life: 0.2 });
  const soft = ['#9db594', '#86a387', '#a3b79a', '#7f9d84', '#aab99c', '#8aa98f'];
  for (let i = 0; i < 70; i++) { const r = rng.f(160, 420); el(B.p('soft' + (i % 6)), rng.f(0, C), rng.f(500, L - 500), r, r * rng.f(0.4, 0.9), rng.f(0, 3)); }
  soft.forEach((c, k) => plan.fill(B.p('soft' + k), { color: c, alpha: 0.3 }));
  // the Dim Ends: woods under the walls, with clearings
  plan.fill(plan.band(0, 580), { color: '#506f5b', wood: 0.95, clear: ['life'] });
  plan.fill(plan.band(L - 580, L), { color: '#4d6c59', wood: 0.95, clear: ['life'] });
  for (let i = 0; i < 40; i++) el(B.p('glade'), rng.f(0, C), i % 2 ? rng.f(300, 540) : rng.f(L - 540, L - 300), rng.f(30, 80), rng.f(20, 50), rng.f(0, 3));
  plan.fill(B.p('glade'), { color: '#7c9a77', clear: ['wood'], life: 0.3 });
  yield 'squall: plan base';

  // blocks between the ring walks and the cross lanes, each split by a footpath and given a use
  const laneX = (i) => i * DXL + 25 * Math.sin(i * 1.7);
  const block = (x0, z0, x1, z1, kind, seed) => paintBlock(B, x0, z0, x1, z1, kind, seed);
  for (let i = 0; i < NXL; i++) {
    const xa = Math.max(laneX(i) + 7, 4), xb = Math.min(laneX(i + 1) - 7, C - 4);
    for (let j = 0; j < RINGS.length - 1; j++) {
      const za = RINGS[j] + 7, zb = RINGS[j + 1] - 7;
      if (za >= LQ.z0 - 10 && zb <= LQ.z1 + 10 && xb > LQ.x0 && xa < LQ.x1) continue;      // the lake's quarter is laid out below
      const zm = (za + zb) / 2 + (hash2(i, j, 3) - 0.5) * 60;
      ln(B.p('foot'), [[xa, zm], [xb, zm]]);
      for (const [q0, q1, h] of [[za, zm - 3, 1], [zm + 3, zb, 2]]) {
        const r = hash2(i, j * 3 + h, 5), dim = za < 1000 || zb > 2800;
        const kind = dim ? (r < 0.3 ? 'wood' : r < 0.5 ? 'orchard' : r < 0.75 ? 'allot' : r < 0.88 ? 'meadow' : 'garden')
          : (r < 0.2 ? 'garden' : r < 0.38 ? 'lawn' : r < 0.52 ? 'allot' : r < 0.64 ? 'wood' : r < 0.76 ? 'pitch' : r < 0.84 ? 'lido' : r < 0.93 ? 'meadow' : 'orchard');
        block(xa, q0, xb, q1, kind, i * 31 + j * 7 + h);
      }
    }
  }
  yield 'squall: blocks';
  // the lake's quarter behind the shores: smaller blocks, more gardens and greens
  for (const side of [1, -1]) {
    const za = side > 0 ? Z1 + 146 : LQ.z0 + 7, zb = side > 0 ? LQ.z1 - 7 : Z0 - 146;
    for (let x = LQ.x0 + 6, k = 0; x < LQ.x1 - 40; k++) {
      const w = 150 + hash2(k, side, 8) * 60, xb = Math.min(x + w, LQ.x1 - 6);
      const r = hash2(k, side, 9);
      block(x, za, xb, zb, r < 0.35 ? 'garden' : r < 0.6 ? 'lawn' : r < 0.75 ? 'pitch' : r < 0.88 ? 'meadow' : 'allot', 900 + k * 2 + side);
      ln(B.p('foot'), [[xb + 3, za], [xb + 3, zb]]);
      x = xb + 6;
    }
  }
  flushBlocks(plan, B);
  yield 'squall: blocks painted';

  // lanes and ring walks, lit
  const lamps = [];
  const lanes = new Path2D(), rings = new Path2D();
  for (let i = 0; i < NXL; i++) {
    const x = laneX(i), runs = [];
    let run = [];
    for (let z = RINGS[0]; z <= RINGS[RINGS.length - 1]; z += 50) {
      const xx = x + 4 * Math.sin(z * 0.013 + i);
      if (xx > LQ.x0 && xx < LQ.x1 && z > LQ.z0 + 5 && z < LQ.z1 - 5) { if (run.length > 1) runs.push(run); run = []; continue; }
      run.push([xx, z]);
    }
    if (run.length > 1) runs.push(run);
    for (const r of runs) { ln(lanes, r); lampsAlong(r, 32, lamps); }
  }
  for (const z of RINGS) { const r = []; for (let k = 0; k <= 160; k++) r.push([(k / 160) * C, z + 3 * Math.sin(k * 0.9 + z)]); ln(rings, r); lampsAlong(r, 30, lamps); }
  put(plan, B.p('foot'), { color: '#d0cbb9', paved: 0.5, life: 0.4, clear: ['wood', 'rows'] }, 2.6);
  put(plan, lanes, { color: '#d4cfbf', paved: 0.8, life: 0.5, clear: ['wood', 'rows'] }, 5);
  plan.stroke(rings, 7, { color: '#d6d1c1', paved: 0.9, life: 0.6, clear: ['wood', 'rows'] });
  yield 'squall: lanes';
  yield* paintLake(plan, lamps);
  const ld = []; for (const q of lamps) ld.push(q[0] - 2, q[1] - 2, 4, 4);
  put(plan, ld, { lamp: 1 });
  for (const q of lamps) plan.features.push({ type: 'lamp', x: ((q[0] % C) + C) % C, z: q[1], h: 4.5 });
}

function lampsAlong(pts, spacing, out) {
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let d = carry;
    while (d < len) { const t = d / len; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += spacing; }
    carry = d - len;
  }
}

const LAWNS = ['#a2bb97', '#94b08e', '#adc2a0'];
const ALLOT = ['#7f9a5e', '#a3a86c', '#6f8f5a', '#b3aa7c', '#8fae7a', '#c4b98c', '#9c8f6a'];
const BEDS = ['#c9d7e6', '#e2dcc0', '#a9cfd2', '#cdb8cf', '#e9e2c8', '#d6b878', '#c98f78', '#b7a6c6'];
const WOODS = ['#5a7d61', '#53775d', '#62846a'];
const FLOWERS = ['#e9d36a', '#f3fdff', '#d8c2d8', '#c94f5a'];
function wobbly(p, cx, cz, rx, rz, seed) {
  for (let i = 0; i <= 22; i++) {
    const a = (i / 22) * Math.PI * 2, k = 1 + 0.22 * Math.sin(a * 3 + seed) + 0.12 * Math.sin(a * 5 + seed * 2.3);
    const x = cx + Math.cos(a) * rx * k, z = cz + Math.sin(a) * rz * k;
    if (i) p.lineTo(x, z); else p.moveTo(x, z);
  }
  p.closePath();
}
function paintBlock(B, x0, z0, x1, z1, kind, seed) {
  const h = (k) => hash2(seed, k, 77), w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if (w < 24 || d < 24) return;
  if (kind === 'lawn') {
    B.r('lawn' + Math.floor(h(1) * 3), x0, z0, x1, z1, 10);
    for (let x = x0 + 8; x < x1 - 4; x += 14) { B.d('tree', x, z0 + 8, 4); B.d('tree', x, z1 - 8, 4); }
    for (let z = z0 + 22; z < z1 - 12; z += 14) { B.d('tree', x0 + 8, z, 4); B.d('tree', x1 - 8, z, 4); }
    ln(B.p('path'), [[x0 + 14, z0 + 14], [x1 - 14, z1 - 14]]); ln(B.p('path'), [[x1 - 14, z0 + 14], [x0 + 14, z1 - 14]]);
    el(B.p('pave'), cx, cz, 10, 10);
    for (let i = 0; i < 4; i++) wobbly(B.p('clump'), x0 + w * (0.2 + 0.6 * h(10 + i)), z0 + d * (0.25 + 0.5 * h(20 + i)), 6 + 6 * h(30 + i), 5 + 5 * h(40 + i), seed + i);
  } else if (kind === 'garden') {
    B.r('hedge', x0, z0, x1, z1, 5); B.r('gravel', x0 + 3, z0 + 3, x1 - 3, z1 - 3, 4);
    const nx = Math.max(2, Math.round(w / 30)), nz = Math.max(2, Math.round(d / 30)), bw = (w - 6) / nx, bd = (d - 6) / nz;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const bx = x0 + 3 + i * bw, bz = z0 + 3 + j * bd, c = Math.floor(h(100 + i * 7 + j) * BEDS.length);
      if (h(150 + i * 5 + j) < 0.3) { B.d('tree', bx + bw / 2, bz + bd / 2, 4.5); continue; }
      B.r('lawn2', bx + 3.5, bz + 3.5, bx + bw - 3.5, bz + bd - 3.5, 3);
      B.r('bed' + c, bx + 5, bz + 5, bx + bw - 5, bz + bd * 0.42, 2); B.r('bed' + ((c + 3) % BEDS.length), bx + 5, bz + bd * 0.58, bx + bw - 5, bz + bd - 5, 2);
    }
    el(B.p('pool'), cx, cz, 5, 5);
  } else if (kind === 'allot') {
    B.r('allotBase', x0, z0, x1, z1, 3);
    for (let z = z0 + 2, r = 0; z < z1 - 8; z += 9, r++) {
      let x = x0 + 2;
      while (x < x1 - 10) { const pw = 40 + h(r * 13 + x) * 60, xe = Math.min(x + pw, x1 - 2); B.r('allot' + Math.floor(h(r * 7 + x * 0.3) * ALLOT.length), x, z, xe, z + 7); if (h(r + x) < 0.3) B.d('shed', xe - 2.5, z + 3.5, 1.5); x = xe + 1.6; }
    }
  } else if (kind === 'wood') {
    wobbly(B.p('wood' + Math.floor(h(1) * 3)), cx, cz, w * 0.48, d * 0.46, seed);
    el(B.p('glade2'), cx + (h(2) - 0.5) * w * 0.3, cz + (h(3) - 0.5) * d * 0.3, w * 0.12, d * 0.1, h(4) * 3);
  } else if (kind === 'orchard') {
    B.r('orch', x0, z0, x1, z1, 4);
  } else if (kind === 'pitch') {
    B.r('lawn1', x0, z0, x1, z1, 6);
    const n = w > 160 ? 2 : 1, pw = Math.min(70, (w - 20) / n - 10), pd = Math.min(105, d - 24);
    for (let i = 0; i < n; i++) {
      const px = x0 + (w / n) * (i + 0.5);
      B.r('pitch', px - pw / 2, cz - pd / 2, px + pw / 2, cz + pd / 2);
      const l = B.p('line'); rr(l, px - pw / 2 + 2, cz - pd / 2 + 2, px + pw / 2 - 2, cz + pd / 2 - 2); ln(l, [[px - pw / 2 + 2, cz], [px + pw / 2 - 2, cz]]); el(l, px, cz, 8, 8);
    }
  } else if (kind === 'lido') {
    B.r('lawn0', x0, z0, x1, z1, 8);
    B.r('pave', x0 + 14, z0 + 14, x1 - 14, z1 - 14, 6);
    B.r('pool', x0 + 26, z0 + 26, x1 - 26, Math.min(z1 - 26, z0 + 26 + 50), 3);
    if (d > 130) el(B.p('pool'), cx, z1 - 40, 14, 12);
  } else {
    B.r('meadow', x0, z0, x1, z1, 8);
    for (let i = 0; i < 24; i++) B.d('flower' + (i % FLOWERS.length), x0 + 4 + h(200 + i) * (w - 8), z0 + 4 + h(300 + i) * (d - 8), 1 + h(400 + i) * 1.6);
  }
}
function flushBlocks(plan, B) {
  const f = (k, o) => B.put(plan, k, o);
  LAWNS.forEach((c, k) => f('lawn' + k, { color: c, life: 0.6 }));
  f('meadow', { color: '#b8c69e', life: 0.3 });
  f('orch', { color: '#90a983', rows: 1, life: 0.15, clear: ['wood'] });
  f('allotBase', { color: '#cbc4ab', life: 0.35 });
  ALLOT.forEach((c, k) => f('allot' + k, { color: c }));
  f('shed', { color: '#eef0ea' });
  f('pitch', { color: '#a6c78e', life: 0.5 });
  B.put(plan, 'line', { color: '#f1f3ea' }, 1.4);
  f('hedge', { color: '#46694d' });
  f('gravel', { color: '#ddd7c5', paved: 0.4, life: 0.5 });
  BEDS.forEach((c, k) => f('bed' + k, { color: c }));
  WOODS.forEach((c, k) => f('wood' + k, { color: c, wood: 0.95, clear: ['life', 'rows'] }));
  f('glade2', { color: '#9cb592', clear: ['wood'], life: 0.4 });
  f('tree', { color: '#5f8562', wood: 1 });
  f('clump', { color: '#6a8c69', wood: 1, clear: ['life'] });
  f('pave', { color: '#dedbd0', paved: 1, life: 0.9, clear: ['wood'] });
  f('pool', { color: '#5aa3ae', water: 1, clear: ['life', 'paved', 'wood'] });
  B.put(plan, 'path', { color: '#d8d2c0', paved: 0.5, life: 0.4, clear: ['wood'] }, 2);
  FLOWERS.forEach((c, k) => f('flower' + k, { color: c }));
}

// the lake, its shores, the beach at the far end, and Paddleside behind the works
function* paintLake(plan, lamps) {
  const B = new Bags();
  B.r('q', LQ.x0, Z0 - 146, LQ.x1, Z1 + 146);
  B.put(plan, 'q', { color: '#9cb592', life: 0.4, clear: ['wood', 'rows', 'paved', 'water'] });
  for (const side of [1, -1]) {
    const band = (bag, d0, d1, xa, xb) => { const za = bankZ(side, d0), zb = bankZ(side, d1); B.r(bag, xa, Math.min(za, zb), xb, Math.max(za, zb)); };
    band('sand', -2, 31, XP + 2, XE + 20);
    band('strip', 31, 48, XP - 40, XE + 110);
    band('prom', 48, 62, XP - 150, XE + 132);
    for (let x = XP - 140; x < XE + 128; x += 12) B.d('ave', x, bankZ(side, 66), 4);
    for (let i = 0; i < 6; i++) {
      const d0 = 70 + i * 10;
      band('ter3d' + (i % 2), d0, d0 + 10, TER3D[0], TER3D[1]);
      band('ter' + (i % 2), d0, d0 + 10, XP - 150, TER3D[0]); band('ter' + (i % 2), d0, d0 + 10, TER3D[1], XE + 132);
      band('riser', d0, d0 + 1.2, XP - 150, XE + 132);
    }
    band('uwalk', 130, 140, XP - 150, XE + 132);
    for (let x = XP + 4.5; x < XE; x += 150) { const za = bankZ(side, 41), zb = bankZ(side, 132); B.r('stair', x - 3, Math.min(za, zb), x + 3, Math.max(za, zb)); }
    for (const b of BOATHOUSES) { band('slip', -2, 30, b - 6, b + 6); band('roof', 30, 50, b - 11, b + 11); }
    for (let x = XP + 40; x < XE - 40; x += 32) band('rack', 23, 25, x - 2, x + 2);
    const lines = [[49, 0], [61, 13]];
    for (const [d, o] of lines) lampsAlong([[XP - 140 + o, bankZ(side, d)], [XE + 125, bankZ(side, d)]], 26, lamps);
    lampsAlong([[XP - 140, bankZ(side, 135)], [XE + 125, bankZ(side, 135)]], 30, lamps);
  }
  for (const h of hutSpots()) { const za = bankZ(h.side, 34), zb = bankZ(h.side, 38.2); B.r('hut' + h.c, h.x - 1.5, Math.min(za, zb), h.x + 1.5, Math.max(za, zb)); }
  // the far beach, its huts across the end, and lawns stepped up behind
  B.r('sand', XE - 12, Z0 - 31, XE + 105, Z1 + 31, 40);
  for (let z = Z0 - 20; z < Z1 + 20; z += 4.6) B.r('hut' + Math.floor(hash2(Math.round(z * 10), 7, 41) * HUTS.length), XE + 106, z - 1.4, XE + 114, z + 1.4);
  B.r('prom', XE + 118, Z0 - 62, XE + 132, Z1 + 62);
  for (let i = 0; i < 6; i++) B.r('ter' + (i % 2), XE + 136 + i * 9, Z0 - 62, XE + 145 + i * 9, Z1 + 62);
  lampsAlong([[XE + 120, Z0 - 60], [XE + 120, Z1 + 60]], 26, lamps);
  // Paddleside: the works' roof and the square behind them, with a round basin
  B.r('roof2', XP - 40, Z0 - 14, XP - 3, Z1 + 14);
  B.r('sq', XP - 150, Z0 - 62, XP - 44, Z1 + 62);
  const sl = B.p('sqline');
  for (const r of [30, 44, 58]) el(sl, XP - 97, (Z0 + Z1) / 2, r, r * 1.6);
  for (let z = Z0 - 50; z < Z1 + 60; z += 25) ln(sl, [[XP - 148, z], [XP - 46, z]]);
  el(B.p('pool'), XP - 97, (Z0 + Z1) / 2, 18, 28);
  lampsAlong([[XP - 46, Z0 - 60], [XP - 46, Z1 + 60]], 22, lamps);
  yield 'squall: lake shapes';
  const f = (k, o) => B.put(plan, k, o);
  f('sand', { color: '#cdc4a8', life: 0.85, water: 0.21, clear: ['wood', 'rows', 'paved', 'water'] });
  f('strip', { color: '#c8c1ab', paved: 0.5, life: 0.6, water: 0.21, clear: ['water'] });
  f('prom', { color: '#bfb9a8', paved: 1, life: 1, water: 0.21, clear: ['wood', 'water'] });
  f('ter0', { color: '#a8c09b', life: 0.9, water: 0.21, clear: ['water'] }); f('ter1', { color: '#93b18c', life: 0.9, water: 0.21, clear: ['water'] });
  f('ter3d0', { color: '#a8c09b', water: 0.21, clear: ['life', 'water'] }); f('ter3d1', { color: '#93b18c', water: 0.21, clear: ['life', 'water'] });
  f('riser', { color: '#d7dbcc' });
  f('uwalk', { color: '#cfc9b8', paved: 0.9, life: 0.7, water: 0.21, clear: ['water'] });
  f('stair', { color: '#d2ccbb', paved: 1, life: 0.6 });
  f('slip', { color: '#c9c3b0', paved: 0.8 });
  f('roof', { color: '#4f7f8a', clear: ['life'] });
  HUTS.forEach((c, k) => f('hut' + k, { color: c, clear: ['life'] }));
  f('rack', { color: '#5a6a70' });
  f('ave', { color: '#5d8660', wood: 1, clear: ['water'] });
  f('roof2', { color: '#c4cbc6', clear: ['life'] });
  f('sq', { color: '#d0ccbf', paved: 1, life: 0.9, water: 0.21 });
  put(plan, sl, { color: '#b5b0a0' }, 2);
  f('pool', { color: '#5aa3ae', water: 1, clear: ['life', 'paved'] });
  put(plan, plan.rect(XP - 2, Z0, XE, Z1), { color: '#18343e', water: 0.28, clear: ['life', 'paved', 'wood', 'rows', 'lamp', 'water'] });
  yield 'squall: lake painted';
}

// ---------------------------------------------------------------- the shores, built
// (modelled with the lake toward -z: the north bank's things stand as drawn, the south bank's are turned round)
function hutGeo() {
  const g = new Geo();
  g.box(-1.5, 0, -2.5, 1.5, 0.25, 1.7, '#b9a888', { skip: 'b' });                 // the deck it stands on
  g.tint(1).box(-1.4, 0.25, -1.6, 1.4, 2.45, 1.6, '#ffffff', { skip: 'bt' });
  g.tri([1.4, 2.45, -1.6], [-1.4, 2.45, -1.6], [0, 3.2, -1.6], '#ffffff');
  g.tri([-1.4, 2.45, 1.6], [1.4, 2.45, 1.6], [0, 3.2, 1.6], '#ffffff').tint(0);
  g.quad([-1.62, 2.38, -1.85], [-1.62, 2.38, 1.75], [0, 3.28, 1.75], [0, 3.28, -1.85], '#f2f1ea');
  g.quad([1.62, 2.38, 1.75], [1.62, 2.38, -1.85], [0, 3.28, -1.85], [0, 3.28, 1.75], '#f2f1ea');
  g.box(-0.6, 0.25, -1.67, 0.6, 2.1, -1.6, '#f3fdff', { skip: 'b' });
  g.box(-1.2, 1.1, -1.67, -0.8, 1.6, -1.6, '#2a3a40', { skip: 'b' });              // a small window
  return g.build();
}
function boathouse(g, x, z, yaw, rng) {
  const W = 11, D = 10, H = 5.2, R = 8.8, wall = '#cfe0e2', trim = '#f3fdff', roof = '#4f7f8a';
  g.at(x, 0, z, yaw);
  g.box(-W, 0, -D + 0.4, W, H, D, wall, { skip: 'nb' });
  g.box(-W, 0, -D, -7, H, -D + 0.4, trim, { skip: 'b' }); g.box(7, 0, -D, W, H, -D + 0.4, trim, { skip: 'b' });
  g.box(-7, 4.2, -D, 7, H, -D + 0.4, trim, { skip: 'b' });
  g.floor(-W, -D, W, D, 0.04, '#2c393e');
  g.box(-W + 0.2, 0, D - 0.6, W - 0.2, 4.4, D - 0.3, '#24343a');
  for (let i = 0; i < 26; i++) {                                                   // boards stood up in the racks inside
    const bx = -9 + i * 0.7;
    g.at(bx, 0.2, D - 1.6, 0).rot('x', -0.18);
    g.box(-0.04, 0, -0.28, 0.04, 2.6, 0.28, BOARDS[Math.floor(rng() * BOARDS.length)]);
    g.pop().pop();
  }
  g.tri([W, H, -D], [-W, H, -D], [0, R, -D], wall); g.tri([-W, H, D], [W, H, D], [0, R, D], wall);
  g.quad([-W - 0.6, H - 0.3, -D - 0.8], [-W - 0.6, H - 0.3, D + 0.5], [0, R + 0.1, D + 0.5], [0, R + 0.1, -D - 0.8], roof);
  g.quad([W + 0.6, H - 0.3, D + 0.5], [W + 0.6, H - 0.3, -D - 0.8], [0, R + 0.1, -D - 0.8], [0, R + 0.1, D + 0.5], roof);
  g.pop();
}
// the stepped lawns: six steps of 0.8 m, ten metres deep, rising away from the water
function* buildTerraces(hollow, scene) {
  const g = new Geo({ maxSeg: 32 });
  for (const side of [1, -1]) {
    for (let i = 0; i < 6; i++) {
      const d0 = 70 + i * 10, h = 1.0 * (i + 1), za = bankZ(side, d0), zb = bankZ(side, d0 + 10);
      g.box(TER3D[0], 0, Math.min(za, zb), TER3D[1], h, Math.max(za, zb), '#d7dbcc', { top: i % 2 ? '#93b18c' : '#a8c09b', skip: 'b' });
    }
    yield 'squall: terraces';
  }
  scene.add(g.mesh(hollow.lit, hollow.frame));
}

function* buildShores(ctx, hollow, scene, pts, rng) {
  const D = ctx.density, frame = hollow.frame;
  // beach huts, the whole length of both banks
  const huts = hutSpots().map((h) => ({ p: [h.x, 0, bankZ(h.side, 36.5)], yaw: h.side > 0 ? 0 : Math.PI, color: HUTS[h.c] }));
  for (let z = Z0 - 20; z < Z1 + 20; z += 4.6) huts.push({ p: [XE + 110, 0, z], yaw: Math.PI / 2, color: HUTS[Math.floor(hash2(Math.round(z * 10), 7, 41) * HUTS.length)] });
  scene.add(...instances(hutGeo(), hollow.litDouble, huts, { frame, cell: 300 }));
  yield 'squall: huts';
  // boathouses with their doors open on the slipways
  const bh = new Geo({ maxSeg: 16 });
  for (const b of BOATHOUSES) for (const side of [1, -1]) boathouse(bh, b, bankZ(side, 40), side > 0 ? 0 : Math.PI, rng);
  scene.add(bh.mesh(hollow.litDouble, frame));
  yield 'squall: boathouses';
  // board racks on the sand, near the flight
  const racks = new Geo({ maxSeg: 16 });
  for (let x = XP + 40; x < XP + 1100; x += 32) {
    for (const side of [1, -1]) {
      const z = bankZ(side, 24);
      racks.cyl(x - 1.7, 0, z, 0.07, 0.07, 2.4, 4, '#5a6a70'); racks.cyl(x + 1.7, 0, z, 0.07, 0.07, 2.4, 4, '#5a6a70');
      racks.box(x - 1.8, 2.3, z - 0.06, x + 1.8, 2.42, z + 0.06, '#5a6a70');
      const nb = 5 + Math.floor(rng() * 6);
      for (let b = 0; b < nb; b++) {
        const bx = x - 1.45 + (b / Math.max(1, nb - 1)) * 2.9;
        racks.at(bx, 0, z + side * 0.4, 0).rot('x', -side * 0.22).rot('z', Math.PI / 2);
        racks.box(0, -0.05, -0.28, 2.6, 0.05, 0.28, BOARDS[Math.floor(rng() * BOARDS.length)]);
        racks.pop().pop().pop();
      }
    }
  }
  scene.add(racks.mesh(hollow.lit, frame));
  yield* buildTerraces(hollow, scene);
  // towels and boards laid on the sand, people on it, in the shallows, and sitting on the steps to watch
  const towels = [], laid = [], spots = [];
  const tg = new Geo(); tg.tint(1).box(-0.9, 0, -0.45, 0.9, 0.03, 0.45, '#ffffff').tint(0);
  const nearX = (x) => { let best = 1e9; for (let i = 0; i < pts.length; i += 2) best = Math.min(best, Math.abs(pts[i].x - x) + Math.max(0, Math.abs(pts[i].z - Z1) - 300)); return best; };
  for (let i = 0; i < Math.round(1500 * D); i++) {
    const side = rng.chance(0.72) ? 1 : -1, x = rng.f(XP + 30, XP + 900), d = rng.f(1, 30), z = bankZ(side, d), r = rng();
    if (side > 0 && nearX(x) > 400 && rng.chance(0.5)) continue;
    const face = side > 0 ? Math.PI : 0;
    if (r < 0.32) { towels.push({ p: [x, 0.01, z], yaw: rng.f(-0.4, 0.4), color: rng.pick(HUTS.concat(BEDS)) }); spots.push({ p: [x + rng.f(-0.4, 0.4), 0.02, z], sit: true, yaw: face + rng.f(-0.6, 0.6) }); }
    else if (r < 0.4) laid.push({ p: [x, 0.02, z], yaw: rng.f(0, 6.28), color: rng.pick(BOARDS) });
    else spots.push({ p: [x, 0, z], yaw: face + rng.f(-0.7, 0.7), walk: r > 0.85 ? rng.f(2, 7) : 0, child: r > 0.8 && r < 0.85 });
  }
  for (let i = 0; i < Math.round(170 * D); i++) {
    const side = rng.chance(0.7) ? 1 : -1, x = rng.f(XP + 40, XP + 800), z = bankZ(side, -rng.f(0.5, 9));
    spots.push({ p: [x, -0.15, z], yaw: (side > 0 ? Math.PI : 0) + rng.f(-0.5, 0.5), child: rng.chance(0.2) });
  }
  for (let i = 0; i < Math.round(1000 * D); i++) {
    const side = rng.chance(0.75) ? 1 : -1, x = rng.f(TER3D[0] + 10, TER3D[1] - 10), step = Math.floor(rng() * 6);
    if (side > 0 && nearX(x) > 300 && rng.chance(0.6)) continue;
    const h = 1.0 * (step + 1), d = 70 + step * 10 + (rng.chance(0.75) ? rng.f(1.2, 3.2) : rng.f(4, 9)), z = bankZ(side, d);
    const sit = d - (70 + step * 10) < 3.5;
    spots.push({ p: [x, h, z], sit, yaw: (side > 0 ? Math.PI : 0) + rng.f(-0.35, 0.35), child: !sit && rng.chance(0.2), walk: !sit && rng.chance(0.2) ? rng.f(1, 3) : 0 });
  }
  yield 'squall: shore spots';
  scene.add(...crowd(spots, hollow.walk, { frame, seed: 'squall-shore', bob: 0.16, cell: 600 }));
  yield 'squall: shore crowd';
  scene.add(...instances(tg.build(), hollow.lit, towels, { frame, cell: 600 }));
  const bg = boardGeo(false).build();
  scene.add(...instances(bg, litMaterial(hollow.rig, { bend: frame, side: 'double', soft: 0.2 }), laid, { frame, cell: 600 }));
  yield 'squall: shore people';
}

// the paddle works: a hall along the paddle line, piers between the flaps, a gantry over them with a rod to each flap,
// people along the gantry and on the roof
const NP = 42, PW = (Z1 - Z0) / NP, PIVOT = -2.2, FLAP_H = 8.6;
/** how far a flap leans toward the lake (radians): it leads the water at its foot by a little */
function flapAngle(z, w) { return 0.36 * (1 - SETA + SETA * Math.cos(-KG * CG * w - SPH)) * Math.cos(-OM * w + phiZ(z) - 0.7); }
function flapSpeed(z, w) { return 0.36 * (1 - SETA + SETA * Math.cos(-KG * CG * w - SPH)) * OM * Math.sin(-OM * w + phiZ(z) - 0.7); }
function* buildWorks(ctx, hollow, scene, rng) {
  const frame = hollow.frame, D = ctx.density;
  const hall = new Geo({ maxSeg: 16 });
  hall.box(XP - 40, 0, Z0 - 14, XP - 3, 13, Z1 + 14, '#dfe3dc', { top: '#c4cbc6' });
  hall.box(XP - 30, 13, Z0 - 6, XP - 14, 16, Z1 + 6, '#5d8a94', { top: '#cfd8d6', emit: 0.25 });   // a glass roof over the works
  for (let k = 0; k < 3; k++) hall.box(XP - 40.6, 1 + k * 4, Z0 - 14, XP - 40, 3.4 + k * 4, Z1 + 14, '#41565e', { emit: 0.3 });   // windows on the land side
  for (let i = 0; i <= NP; i++) {
    const z = Z0 + i * PW;
    hall.box(XP - 3, -1, z - 0.6, XP + 0.8, 10.2, z + 0.6, '#eef0ea', { top: '#d9ddd6' });
    hall.box(XP - 3, 7.4, z - 1.1 + (i ? 0 : 1), XP - 0.4, 10.2, z + PW - 1.1, '#4f7f8a');     // the drive housings
    if (i % 3 === 0) { hall.cyl(XP + 1.4, 11.2, z, 0.12, 0.09, 4.8, 5, '#55636a'); hall.cyl(XP + 1.4, 15.9, z, 0.42, 0.34, 0.6, 6, '#f6fbf8', { emit: 1.8 }); }
  }
  hall.box(XP - 3.3, -1, Z0, XP - 3.0, 7.4, Z1, '#24343a');                                   // the dark machine wall behind the flaps
  hall.box(XP - 3.5, 10.2, Z0 - 2, XP + 4.2, 10.7, Z1 + 2, '#d6dbd5');                          // the gantry
  hall.box(XP + 4.0, 10.7, Z0 - 2, XP + 4.2, 11.8, Z1 + 2, '#a8b4b6');                         // its rail
  scene.add(hall.mesh(hollow.lit, frame));
  // each flap is hinged below the water and leans toward the lake and back again
  const fg = new Geo();
  fg.box(-0.3, 0, -PW / 2 + 1.05, 0.3, FLAP_H, PW / 2 - 1.05, '#eef6f4', { sides: '#7fb2ba', top: '#f3fdff', emit: 0.25 });
  fg.box(0.3, FLAP_H - 1.4, -PW / 2 + 1.1, 0.4, FLAP_H - 0.4, PW / 2 - 1.1, '#f3fdff', { emit: 0.35 });
  fg.box(0.3, 3.4, -PW / 2 + 1.1, 0.36, 5.2, PW / 2 - 1.1, '#5fa8b0', { emit: 0.2 });
  for (const dz of [-3, 0, 3]) fg.box(-0.62, 0.5, dz - 0.18, -0.3, FLAP_H - 0.6, dz + 0.18, '#5d8a94');
  const flapMat = litMaterial(hollow.rig, { bend: frame });
  const flaps = new InstancedMesh(fg.build(), flapMat, NP); flaps.frustumCulled = false;
  const rg = new Geo(); rg.cyl(0, 0, 0, 0.16, 0.16, 1, 6, '#4a565c', { smooth: false }); rg.cyl(0, 0, 0, 0.3, 0.3, 0.42, 6, '#2f3b40', { smooth: false });
  const rods = new InstancedMesh(rg.build(), flapMat, NP); rods.frustumCulled = false;
  scene.add(flaps, rods);
  const watch = [];
  for (let i = 0; i < Math.round(520 * D); i++) {
    const top = rng.chance(0.6), z = rng.f(Z0 - 4, Z1 + 4);
    watch.push(top ? { p: [XP + rng.f(-2.5, 3.6), 10.7, z], yaw: Math.PI / 2 + rng.f(-0.4, 0.4), walk: rng.chance(0.25) ? 2 : 0, child: rng.chance(0.15) }
      : { p: [XP - rng.f(4, 13), 13, z], yaw: Math.PI / 2 + rng.f(-0.6, 0.6), walk: rng.chance(0.3) ? rng.f(1, 3) : 0, sit: rng.chance(0.2) });
  }
  scene.add(...crowd(watch, hollow.walk, { frame, seed: 'paddle-watch' }));
  yield 'squall: works';
  const _sc = new Vector3();
  return function animate(w) {
    for (let i = 0; i < NP; i++) {
      const z = Z0 + (i + 0.5) * PW, a = flapAngle(z, w);
      flaps.setMatrixAt(i, mat(_m, XP + 0.3, PIVOT, z, 0, -a, 0));
      // the rod from the gantry to a point high on the flap
      const fx = XP + 0.3 + (FLAP_H - 2.2) * Math.sin(a), fy = PIVOT + (FLAP_H - 2.2) * Math.cos(a), ax = XP - 1.2, ay = 9.6;
      const dx = fx - ax, dy = fy - ay, len = Math.hypot(dx, dy);
      _e.set(0, 0, Math.atan2(-dx, dy), 'XYZ'); _q.setFromEuler(_e);
      rods.setMatrixAt(i, _m.compose(_p.set(ax, ay, z), _q, _sc.set(1, len, 1)));
    }
    flaps.instanceMatrix.needsUpdate = true; rods.instanceMatrix.needsUpdate = true;
  };
}

// ---------------------------------------------------------------- who is on the water
function riderZ(r, z0, tc, t) { const u = t - tc; return lane(z0 + r.vz * u + r.ca * Math.sin(r.cw * u)); }
function makeRiders(rng, D) {
  const set = [], cyc = [], still = [];
  const pick = (r) => { r.vc = new Color(rng.pick(VESTS)); r.sc = new Color(rng.pick(SKIN)); r.bc = new Color(rng.pick(BOARDS)); return r; };
  const nH = crestN(XH0, ZH, 0);
  // she stood up on her eleventh try: the flight finds her carried on the face, sees her stand, and stays with her
  const hero = pick({ id: 1, hero: true, z: ZH, vz: -0.45, ca: 0.35, cw: 0.7, n: nH, off: 2.4, tw: -1e9, tc: -3, ts: 3.0, tf: 8.7, tEnd: 1e9, fd: 3.0, wp: 'prone', sy: 0, side: -1 });
  hero.vc = new Color('#e8b44a'); hero.bc = new Color('#d9643f'); hero.sc = new Color('#c8946a');
  set.push(hero);
  // the set round her: ten to thirteen on every crest from three behind to six ahead
  let id = 10;
  for (let k = -3; k <= 9; k++) {
    const m = 16 + Math.floor(rng() * 4);
    for (let j = 0; j < m; j++) {
      const z = ZH - 150 + (j + 0.2 + rng() * 0.6) * ((Z1 - 45 - ZH + 150) / m);
      if (z > ZH - 10 && z < ZH + 17) continue;                       // the flight's own lane
      const tc = k > 0 ? rng.f(-14, -3) : k === 0 ? rng.f(-7, 0) : -k * 3.4 + rng.f(-3.2, 2.6);
      const falls = rng.chance(k === 0 ? 0.35 : 0.22);
      const vz = (z < ZH ? -1 : 1) * rng.f(0.15, 1.1) * (rng.chance(0.75) ? 1 : -1);
      const r = pick({ id: id++, z, vz, ca: rng.f(0.5, 1.7), cw: rng.f(0.55, 1.1), n: nH + k, off: rng.f(1.8, 3.2), tw: -1e9, tc, ts: tc + rng.f(1.6, 3.4),
        tf: falls ? rng.f(Math.max(tc + 6, 6), 34) : 1e9, tEnd: 1e9, fd: rng.f(2.0, 2.8), wp: rng.chance(0.7) ? 'sit' : 'prone', sy: rng.f(-0.5, 0.5), side: rng.sign() });
      // nobody on her crest drifts into the lane the camera keeps beside her
      let clear = true;
      if (k === 0) for (let t = 0; t <= 14 && clear; t += 0.5) { const zz = riderZ(r, r.z, r.tc, Math.max(t, r.tc)); if (zz > ZH - 9 && zz < ZH + 16) clear = false; }
      if (clear) set.push(r);
    }
  }
  // sets all down the lake, taking their crests together and starting again somewhere else when they are done
  for (let c = 0; c < Math.round(34 * Math.max(0.6, D)); c++) {
    const cl = { id: 500 + c, z: rng.f(Z0 + 70, Z1 - 70), span: rng.f(400, 2150), wait: rng.f(4, 11) };
    const P = rng.f(46, 66), o = rng.f(0, P), m = 7 + Math.floor(rng() * 7), gap = rng.f(12, 24);
    for (let j = 0; j < m; j++) {
      cyc.push(pick({ id: id++, cl, P, o, dz: (j - (m - 1) / 2) * gap + rng.f(-3, 3), jit: rng.f(0, 0.8), sd: rng.f(1.4, 3.2), vz: rng.sign() * rng.f(0.1, 1.0),
        ca: rng.f(0.4, 1.6), cw: rng.f(0.5, 1.0), off: rng.f(1.8, 3.2), fd: rng.f(2.0, 2.8), wp: rng.chance(0.7) ? 'sit' : 'prone', sy: rng.f(-0.5, 0.5), side: rng.sign() }));
    }
  }
  // people waiting between sets, sitting on their boards or lying on them, and swimmers near the banks
  const X0 = crestX(nH, ZH, 0) + 2.4 - 12;
  const clearOf = (x, z) => !(z > ZH - 8 && z < ZH + 18 && x > X0 - 30 && x < X0 + 80);
  for (let g = 0; g < Math.round(30 * Math.max(0.6, D)); g++) {
    const gx = g < 8 ? rng.f(XP + 120, XP + 600) : rng.f(XP + 60, XE - 200), gz = rng.f(Z0 + 40, Z1 - 40), m = 5 + Math.floor(rng() * 7);
    for (let j = 0; j < m; j++) {
      const x = gx + rng.f(-14, 14), z = gz + rng.f(-26, 26);
      if (!clearOf(x, z)) continue;
      still.push(pick({ id: id++, x, z, pose: rng.chance(0.72) ? 'sit' : 'prone', yaw: Math.PI + rng.f(-0.5, 0.5), ph: rng.f(0, 6.28), board: true }));
    }
  }
  for (let i = 0; i < Math.round(170 * D); i++) {
    const side = rng.chance(0.65) ? 1 : -1, x = rng.chance(0.6) ? rng.f(XP + 40, XP + 700) : rng.f(XP + 40, XE - 100), z = side > 0 ? Z1 - rng.f(4, 40) : Z0 + rng.f(4, 40);
    if (!clearOf(x, z)) continue;
    still.push(pick({ id: id++, x, z, pose: 'swim', yaw: rng.f(0, 6.28), ph: rng.f(0, 6.28), board: false }));
  }
  return { hero, set, cyc, still, nH, X0 };
}

// the flight. It starts eleven metres behind her on the crest, closes to four, and stays while she rides and falls.
function flight(hero) {
  const at = (t) => { const z = riderZ(hero, hero.z, hero.tc, t); return [crestX(hero.n, z, t) + hero.off, z]; };
  const [x0, z0] = at(0), [x4, z4] = at(4), [x8, z8] = at(8.4);
  const zf = riderZ(hero, hero.z, hero.tc, hero.tf), xf0 = crestX(hero.n, zf, hero.tf) + hero.off, xf = xf0 + CW * hero.fd * 0.5;
  // beside the crest she fell from, front side, running along it to the north bank past everyone still on it
  const beside = (t, z) => [crestX(hero.n, z, t) + 8, 8.5, z];
  const run = [[16, 1884], [19, 1928], [22, 1975], [25, 2022], [28, 2066], [31, 2100]].map(([t, z], i) => {
    const p = beside(t, z);
    return { t, p, look: [p[0] - 7, 0.5, z + 55], fov: 60 + (i === 0 ? -2 : 0) };
  });
  const xs = beside(31, 2100)[0];
  return [
    { t: 0, p: [x0 - 8, 4.6, z0 + 5.5], look: [x0 + 50, 0, z0 - 6] },
    { t: 4, p: [x4 - 5.6, 3.9, z4 + 3.9], look: [x4 + 9, 0.4, z4 - 17], fov: 56 },
    { t: 8.4, p: [x8 - 3.8, 3.4, z8 + 3.4], look: [x8 + 3, 0.7, z8 - 5], fov: 54 },
    { t: 10.3, p: [xf0 + CW * 1.17 - 2.6, 3.2, zf + 4.4], look: [xf0 + CW * 1.17 + 1, 0.9, zf - 1], fov: 54 },
    { t: 13.2, p: [xf - 2.5, 4.8, zf + 7.5], look: [xf + 6, 0.3, zf - 0.5], fov: 56 },
    { t: 14.7, p: [xf + 3, 6.8, zf + 11], look: [xf + 22, 1.5, zf + 45], fov: 58 },
    ...run,
    { t: 35, p: [xs - 30, 11, 2154], look: [xs - 110, 3, 2236], fov: 58 },
    { t: 41, p: [xs - 150, 11, 2157], look: [xs - 230, 3.5, 2236], fov: 58 },
    { t: 47, p: [XP + 140, 9.5, 2160], look: [XP + 20, 4, 2080], fov: 58 },
    { t: 52.5, p: [XP + 36, 8, 2080], look: [XP + 2, 4, 2030], fov: 60 },
    { t: 56.5, p: [XP + 30, 10.5, 2020], look: [XP + 12, 7, 1950], fov: 60 },
    { t: 61, p: [XP + 26, 14.5, 1962] },
  ];
}

// (development) how much work a stage of the build takes, summed over its slices
function* timed(label, gen, out) {
  let w = 0, t = performance.now(), r = gen.next();
  while (!r.done) { w += performance.now() - t; yield r.value; t = performance.now(); r = gen.next(); }
  out.push(label + ' ' + Math.round(w + performance.now() - t));
  return r.value;
}

export const squallSwell = {
  id: 'squall-swell',
  title: 'Swell hour', drum: 'Squall', row: 'Weather Row', kind: 'a steady drum', light: 28.0,
  line: 'I stood up on the eleventh try. Then I fell off, very slowly, which at half a g leaves you time to wave.',
  tone: '#9fd0d6', source: 'wander-year.md (Day 103; Method, Half-g waves)',
  sound: { root: 48, scale: 'lydian', pad: 0.5, air: 0.2, water: 0.85, crowd: 0.4, bells: 0.15, bright: 0.6 },
  *build(ctx) {
    const TM = [];
    const plan = new Plan(ctx.q.plan);
    yield* timed('paint', paintSquall(plan), TM);
    yield 'squall: plan';
    const walls = { crowd: 0.25, lit: 0.4, houseMix: 0.5, houses: ['#cfe0e2', '#9fc0c8', '#e8ecea', '#5fa8b0', '#dfe6dc', '#2d5f70'], stone: '#e6e7e0', stone2: '#cfd6d4', gardenColor: '#7f9f80', awning: '#d9643f' };
    const hollow = yield* timed('hollow', buildHollow(ctx, {
      seed: 'squall', plan,
      light: { sun: '#dcefee', sunPower: 0.42, amb: '#6a8fa6', ambPower: 0.26, bounce: '#9fb39a', air: '#a9c8d6', airDensity: 0.00005, ground: '#ffcf90', groundPower: 0.2 },
      sunline: { power: 26 },
      ground: { people: 0.9, lamp: 0.8, lampColor: '#ffd49a', sunRod: 26, canopy: '#6f9468', stripes: 0.07 },
      front: walls, back: { ...walls },
    }), TM);
    yield 'squall: hollow';
    const scene = new Scene();
    scene.add(hollow.group);
    const frame = hollow.frame, D = ctx.density;

    // ---- the water: fine near the paddles and the start, coarser up the lake, flat (its crests drawn by the shader) far off
    const shared = {
      ...hollow.rig.uniforms, uClip: G.uClip, uTime: G.uTime,
      uBend: { value: new Vector3(frame.a0, frame.z0, frame.floorR) },
      uW: { value: 0 }, tAlb: { value: hollow.tex.alb }, uSize: { value: new Vector2(C, L) },
      uDeep: { value: vec3col('#1d4654') }, uShallow: { value: vec3col('#5fa8b0') }, uFoam: { value: vec3col('#f3fdff') },
      uWallTint: { value: vec3col('#cfd6d4') }, uSunRod: { value: 26 }, uSunWidth: { value: 22 }, uWave: { value: 0.018 },
      uWk: { value: Array.from({ length: NWAKE }, () => new Vector4()) }, uSp: { value: [new Vector4(), new Vector4(), new Vector4()] },
    };
    scene.add(waterMesh(hollow, XP, 1900, 2, 5, 1, [1e5, 2e5], shared), waterMesh(hollow, 1900, 2700, 4, 10, 1, [2550, 2700], shared),
      waterMesh(hollow, 2700, XE, 10, 25, 0, [0, 1], shared));
    yield 'squall: water';

    // ---- who is on the water, and the flight that follows one of them
    const rng = makeRng('squall-swell');
    const R = makeRiders(rng, D), hero = R.hero;
    const path = makePath(flight(hero), { frame, entryRadius: CW / 1.15, exitRadius: 10 });
    const pts = path.points(0.5);
    yield 'squall: riders';
    yield* timed('trees', scatterTrees(hollow, { near: pts, radius: 170, max: 9000 * D }), TM);
    yield* timed('people', scatterPeople(hollow, { near: pts, radius: 220, density: 0.9 * D, max: 2400 * D }), TM);
    hollow.lampPosts({ near: pts, radius: 220, power: 3.5, color: '#ffd49a' });
    yield 'squall: people';
    yield* timed('shores', buildShores(ctx, hollow, scene, pts, rng), TM);
    const works = yield* timed('works', buildWorks(ctx, hollow, scene, rng), TM);

    const riderMat = litMaterial(hollow.rig, { bend: frame, side: 'double', soft: 0.35 });
    const all = [...R.set, ...R.cyc], capF = all.length + R.still.length, capN = Math.min(capF, 600);
    const Pk = {
      board: pack(boardGeo(false).build(), riderMat, capN),
      stand: pack(standGeo(new Geo()).build(), riderMat, capN), standH: pack(headGeo(HEAD.stand), riderMat, capN),
      prone: pack(proneGeo(new Geo()).build(), riderMat, capN), proneH: pack(headGeo(HEAD.prone), riderMat, capN),
      sit: pack(sitGeo(new Geo()).build(), riderMat, capN), sitH: pack(headGeo(HEAD.sit), riderMat, capN),
      swim: pack(swimGeo(new Geo()).build(), riderMat, capN), swimH: pack(headGeo(HEAD.swim), riderMat, capN),
      fstand: pack(farGeo('stand'), riderMat, capF), fprone: pack(farGeo('prone'), riderMat, capF), fsit: pack(farGeo('sit'), riderMat, capF), fswim: pack(farGeo('swim'), riderMat, capF),
      hero: pack(heroBodyGeo(), riderMat, 1), armR: pack(armGeo(), riderMat, 2), armL: pack(armGeo(), riderMat, 1),
    };
    for (const p of Object.values(Pk)) scene.add(p.mesh);
    const spray = makeSpray(hollow.rig, frame, 9000);
    scene.add(spray.mesh);
    yield 'squall: rider meshes';
    if (typeof location !== 'undefined' && /debug/.test(location.search)) console.log('[squall] ' + TM.join(', '));

    // ---- each frame
    const NEAR2 = 130 * 130, _ma = new Matrix4(), _mb = new Matrix4(), _mc = new Matrix4(), white = new Color('#ffffff');
    const cand = [];
    const hFall = () => { const zf = riderZ(hero, hero.z, hero.tc, hero.tf); return [crestX(hero.n, zf, hero.tf) + hero.off + CW * hero.fd * 0.5 + 0.4, zf - hero.side * 1.1]; };
    const [hsx, hsz] = hFall();
    function arms(body, aR, aL) {
      _mb.makeTranslation(0.2, 1.3, 0.02).multiply(_mc.makeRotationZ(aR)); _ma.copy(body).multiply(_mb); Pk.armR.put(_ma, hero.vc);
      _mb.makeTranslation(-0.12, 1.3, 0.02).multiply(_mc.makeRotationY(Math.PI)).multiply(_ma.makeRotationZ(aL)); _ma.copy(body).multiply(_mb); Pk.armL.put(_ma, hero.vc);
    }
    function drawOne(r, o, near) {
      const sink = o.pose === 'swim' ? (1 - o.head) * 0.6 : 0;
      mat(_m, o.x, o.y - sink, o.z, o.yaw, o.pitch, o.roll);
      if (near) {
        if (r === hero && o.pose === 'stand') {
          Pk.hero.put(_m, hero.vc);
          const u = (shared.uW.value) - hero.tf, k = o.k;
          let aR = -0.12 + 0.08 * Math.sin(shared.uW.value * 2.3), aL = -0.1 + 0.06 * Math.sin(shared.uW.value * 1.9 + 1);
          if (k < 1) { aR = -1.25 + (aR + 1.25) * k; aL = -1.25 + (aL + 1.25) * k; }
          if (u > 0) { const up = sstep(0.15, 0.9, u); aR += (2.05 - aR) * up + 0.42 * Math.sin(u * 7.5) * sstep(0.6, 1.1, u); aL += (-0.45 - aL) * sstep(0, 0.7, u); }
          arms(_m, aR, aL);
        } else {
          const b = Pk[o.pose], h = Pk[o.pose + 'H'];
          b.put(_m, r.vc); h.put(_m, r.sc);
          if (r === hero && o.pose === 'swim') {
            const u = shared.uW.value - hero.tf - hero.fd;
            if (u > 1.0 && u < 7) { _mb.makeTranslation(0.18, 0.02, 0).multiply(_mc.makeRotationZ(1.75 + 0.45 * Math.sin(u * 7.0))); _ma.copy(_m).multiply(_mb); Pk.armR.put(_ma, hero.vc); }
          }
        }
        if (o.bvis) { mat(_m2, o.bx, o.by, o.bz, o.byaw, o.bpitch, o.broll); Pk.board.put(_m2, r.bc); }
      } else {
        if (o.pose === 'swim') Pk.fswim.put(_m, r.vc);
        else Pk['f' + o.pose].put(o.pose === 'stand' || o.pose === 'prone' ? mat(_m2, o.bx, o.by + 0.06, o.bz, o.yaw, o.pitch, o.roll) : _m, r.vc);
      }
    }
    function drawAll(w, cx, cz) {
      cand.length = 0;
      for (const r of all) {
        const o = riderAt(r, w);
        if (!o.vis) { r.d2 = 1e12; continue; }
        let dx = o.x - cx; dx -= Math.round(dx / C) * C;
        const dz = o.z - cz, d2 = dx * dx + dz * dz;
        r.d2 = d2;
        drawOne(r, o, d2 < NEAR2 || r === hero);
        if (o.ride > 0 && d2 < 160 * 160) { r.wx = o.x; r.wz = o.z; r.wa = -o.yaw; r.ws = o.ride; cand.push(r); }
      }
      for (const s of R.still) {
        let dx = s.x - cx; dx -= Math.round(dx / C) * C;
        const dz = s.z - cz, near = dx * dx + dz * dz < NEAR2;
        const y = swellY(s.x, s.z, w), sl = Math.atan(swellDX(s.x, s.z, w)), bob = 0.035 * Math.sin(w * 1.7 + s.ph);
        if (s.pose === 'swim') {
          mat(_m, s.x + Math.sin(w * 0.3 + s.ph) * 0.6, y - 0.06 + bob, s.z, s.yaw, 0, 0);
          if (near) { Pk.swim.put(_m, s.vc); Pk.swimH.put(_m, s.sc); } else Pk.fswim.put(_m, s.vc);
          continue;
        }
        const yaw = s.pose === 'sit' ? s.yaw : s.yaw - Math.PI, pitch = s.pose === 'sit' ? -sl : sl;
        mat(_m, s.x, y + (s.pose === 'sit' ? -0.04 : 0.02) + bob, s.z, yaw, pitch, 0.04 * Math.sin(w * 1.3 + s.ph));
        if (near) { Pk[s.pose].put(_m, s.vc); Pk[s.pose + 'H'].put(_m, s.sc); mat(_m2, s.x, y - 0.07 + bob, s.z, yaw, pitch, 0); Pk.board.put(_m2, s.bc); }
        else Pk['f' + s.pose].put(_m, s.vc);
      }
      for (const p of Object.values(Pk)) p.done();
      // wakes behind the nearest boards, and the rings where people went in
      cand.sort((a, b) => a.d2 - b.d2);
      const W = shared.uWk.value;
      for (let i = 0; i < NWAKE; i++) { const r = cand[i]; if (r) W[i].set(r.wx, r.wz, r.wa, r.ws); else W[i].set(0, 0, 0, 0); }
      const S = shared.uSp.value;
      for (const v of S) v.set(0, 0, 0, 0);
      const ha = w - hero.tf - hero.fd + 0.2;
      let si = 0;
      if (ha > 0 && ha < 6) S[si++].set(hsx, hsz, 0.6 + 1.5 * Math.sqrt(ha), 1 - ha / 6);
      for (const r of R.set) {
        if (si >= 3) break;
        const a = w - r.tf - r.fd + 0.2;
        if (r === hero || a < 0 || a > 6 || r.d2 > 200 * 200) continue;
        const zf = riderZ(r, r.z, r.tc, r.tf);
        S[si++].set(crestX(r.n, zf, r.tf) + r.off + CW * r.fd * 0.5 + 0.4, zf - r.side * 1.1, 0.5 + 1.3 * Math.sqrt(a), 0.8 * (1 - a / 6));
      }
    }

    // spray: off the rail in each turn, in a burst where someone goes in, and off the flaps as they push
    function throwSpray(w, cx, cz) {
      spray.begin();
      for (const r of R.set) {
        if (r.d2 > 170 * 170) continue;
        const K = r === hero ? 150 : 56;
        for (let j = 0; j < K; j++) {
          const h1 = hash2(r.id, j, 21), h2 = hash2(r.id, j, 22), h3 = hash2(r.id, j, 23);
          const T = 1.3 + 1.2 * h1, ph = w / T + h2, a = (ph - Math.floor(ph)) * T, te = w - a;
          if (te < r.ts + 0.9 || te > r.tf + 0.15) continue;
          const uu = te - r.tc, turn = Math.sin(r.cw * uu);
          if (Math.abs(turn) < 0.45 && h3 > 0.3) continue;
          const z = riderZ(r, r.z, r.tc, te), x = crestX(r.n, z, te) + r.off - 0.9, y = swellY(x, z, te) + 0.12;
          const vzE = r.vz + r.ca * r.cw * Math.cos(r.cw * uu), out = turn >= 0 ? -1 : 1;
          spray.throw(x, y, z + out * 0.25, CW * (0.45 + 0.4 * h3), 1.6 + 4.4 * h2 * h2, vzE * 0.5 + out * (0.5 + 2.0 * h1), a, w, 0.025 + 0.055 * h3, 0.7);
        }
        const tl = r.tf + r.fd - 0.25;
        if (w > tl && w < tl + 3.4) {
          const zf = riderZ(r, r.z, r.tc, r.tf), xs = crestX(r.n, zf, r.tf) + r.off + CW * r.fd * 0.5, zs = zf - r.side * 0.7;
          const K2 = r === hero ? 300 : 90;
          for (let j = 0; j < K2; j++) {
            const h1 = hash2(r.id, j, 31), h2 = hash2(r.id, j, 32), h3 = hash2(r.id, j, 33);
            const a = w - tl - h1 * 0.4;
            if (a < 0) continue;
            const ang = h2 * 6.2832, sp = 0.3 + 1.6 * h3;
            spray.throw(xs + Math.cos(ang) * 0.4, swellY(xs, zs, tl) + 0.1, zs + Math.sin(ang) * 0.4, Math.cos(ang) * sp + CW * 0.25, 1.2 + 4.4 * h1 * h1, Math.sin(ang) * sp, a, w, 0.025 + 0.05 * h2, 0.7);
          }
        }
      }
      for (let i = 0; i < NP; i++) {
        const z = Z0 + (i + 0.5) * PW;
        let dx = XP - cx; dx -= Math.round(dx / C) * C;
        if (dx * dx + (z - cz) * (z - cz) > 300 * 300) continue;
        for (let j = 0; j < 50; j++) {
          const h1 = hash2(i, j, 41), h2 = hash2(i, j, 42), h3 = hash2(i, j, 43);
          const T = 1.9 + 0.9 * h1, ph = w / T + h2, a = (ph - Math.floor(ph)) * T, te = w - a;
          const v = flapSpeed(z, te);
          if (v < 0.12 + 0.2 * h3) continue;
          const ang = flapAngle(z, te), fx = XP + 0.6 + (BASE - PIVOT) * Math.tan(ang);
          spray.throw(fx, BASE + 0.2 + h3 * 0.6, z + (h2 - 0.5) * (PW - 3), 0.8 + 2.6 * h3 + v * 3, 2.2 + 4.2 * h1 * h1, (h2 - 0.5) * 1.2, a, w, 0.05 + 0.1 * h2, 0.75 * Math.min(1, v / 0.35));
        }
      }
      spray.end();
    }

    const look = { exposure: 1.95, bloom: 0.22, threshold: 0.85, saturation: 1.1, contrast: 1.07, vignette: 0.42 };
    const _cp = new Vector3();
    const api = {
      scene, path, hollow, near: 0.4, far: 9000, look,
      portal: { mist: '#9fd0d6' },
      update(t, dt, cam, engine) {
        // wave time: the flight's clock, and before the flight begins (seen through the last world's opening) the
        // seconds still to go until it does, so that nothing jumps at the crossing
        const seen = engine && engine.cur && engine.cur.userData !== api;
        const w = seen ? -Math.max(0, engine.cur.tCross - engine.cur.t) : t;
        shared.uW.value = w;
        works(w);
        _cp.copy(cam.position);
        let cx = Math.atan2(_cp.y, _cp.x) * DRUM.RH; cx = ((cx % C) + C) % C;
        drawAll(w, cx, _cp.z);
        throwSpray(w, cx, _cp.z);
      },
    };
    return api;
  },
};
