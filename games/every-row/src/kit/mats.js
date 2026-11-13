// Materials and light rigs. Every surface in every world is drawn with a material from this file (or one built from
// its chunks), because the engine relies on three things they all share: the crossing clip plane, the global clock,
// and flat-to-drum bending in the vertex shader.
//
// Geometry is modelled FLAT: x = spinward arc length, y = height above the floor, z = along the axis. A material made
// with `bend: frame` wraps it onto the drum as it is drawn, so a street that is straight in the model curves up ahead
// of you on screen. Light rigs work in whichever space suits them: the Hollow's sunline in drum space, lamps in flat space.
import {
  ShaderMaterial, Vector2, Vector3, Vector4, Color, DoubleSide, FrontSide, BackSide, AdditiveBlending, NormalBlending,
  InstancedBufferGeometry, InstancedBufferAttribute, Float32BufferAttribute, Mesh, Sphere,
} from 'three';
import { DRUM } from './drum.js';

// Uniforms shared by every material in every world. The engine owns their values.
export const G = {
  uClip: { value: new Vector4(0, 0, 0, 1) },     // keep fragments where dot(P, n) + d >= 0
  uTime: { value: 0 },                           // seconds, never reset
  uPx: { value: 1000 },                          // pixels per radian at the centre of the view
  uRes: { value: new Vector2(1280, 720) },       // size of the picture being drawn, pixels
};

export const col = (c) => (c && c.isColor ? c : new Color(c));
export const vec3col = (c, k = 1) => { const q = col(c); return new Vector3(q.r * k, q.g * k, q.b * k); };

// ---------------------------------------------------------------- shared shader text
export const BEND_PARS = /* glsl */`
uniform vec3 uBend;   // a0, z0, floor radius (0 = not bent)
void kBend(inout vec3 p, inout vec3 n) {
  if (uBend.z > 0.0) {
    float a = uBend.x + p.x / uBend.z, r = uBend.z - p.y, c = cos(a), s = sin(a);
    p = vec3(r * c, r * s, uBend.y + p.z);
    n = vec3(-s * n.x - c * n.y, c * n.x - s * n.y, n.z);
  }
}`;

export const CLIP_PARS = /* glsl */`uniform vec4 uClip;`;
export const CLIP_FRAG = /* glsl */`if (dot(vW, uClip.xyz) + uClip.w < 0.0) discard;`;

export const NOISE_GLSL = /* glsl */`
float kHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 kHash2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float kNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(kHash(i), kHash(i + vec2(1.0, 0.0)), f.x), mix(kHash(i + vec2(0.0, 1.0)), kHash(i + vec2(1.0, 1.0)), f.x), f.y); }
float kFbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * kNoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s / 0.9375; }
`;

// Whole-number hash: the same four values as cellRand() in core/rng.js, on any graphics card.
export const CELL_GLSL = /* glsl */`
uvec2 kPcg(uvec2 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * 1664525u; v.y += v.x * 1664525u; v ^= v >> 16u;
  v.x += v.y * 1664525u; v.y += v.x * 1664525u; v ^= v >> 16u;
  return v;
}
vec4 kCell(vec2 cell) { uvec2 h = kPcg(uvec2(ivec2(cell) + 8192)); return vec4(float(h.x & 0xffffu), float(h.x >> 16u), float(h.y & 0xffffu), float(h.y >> 16u)) / 65536.0; }
`;

// ---------------------------------------------------------------- light rigs
// A rig is { uniforms, glsl } where glsl defines: vec3 kLight(vec3 P, vec3 N, vec3 F, vec3 FN)
//   P, N: position and normal on the drum;  F, FN: the same in the flat model.
// It returns the light falling on the surface (1 = full sun on a floor), ambient included.

// The Hollow: a sunline along the axis, lit from SUN0 to L - SUN0, and the glow of the land all round.
//   sun:     colour x strength of the line as seen from the bright side
//   sunFar:  the same seen from the opposite side (a painted dawn can light one bank and leave the other dark)
//   sunAngle: the angle (radians) the bright side faces
//   amb:     the Hollow's own glow
//   ground:  warm light near the floor at night (lamps along paths), fading out by 30 m up
export function hollowRig(o = {}) {
  const uniforms = {
    uSunA: { value: vec3col(o.sun || '#fff4e0', o.sunPower === undefined ? 1 : o.sunPower) },
    uSunB: { value: vec3col(o.sunFar || o.sun || '#fff4e0', o.sunFarPower === undefined ? (o.sunPower === undefined ? 1 : o.sunPower) : o.sunFarPower) },
    uSunDir: { value: new Vector2(Math.cos(o.sunAngle || 0), Math.sin(o.sunAngle || 0)) },
    uSunSharp: { value: o.sunSharp || 1 },
    uSunZ: { value: new Vector2(o.z1 === undefined ? DRUM.SUN0 : o.z1, o.z2 === undefined ? DRUM.L - DRUM.SUN0 : o.z2) },
    uAmb: { value: vec3col(o.amb || '#8fa4a0', o.ambPower === undefined ? 0.2 : o.ambPower) },
    uGroundGlow: { value: vec3col(o.ground || '#ffb060', o.groundPower || 0) },
    uBounce: { value: vec3col(o.bounce || '#9aa66a', o.bouncePower === undefined ? 0.22 : o.bouncePower) },
    uAir: { value: new Vector4(...vec3col(o.air || '#d4e4ee').toArray(), o.airDensity === undefined ? 0.00007 : o.airDensity) },
    uFloorR: { value: o.floorR || DRUM.RH },
  };
  const glsl = /* glsl */`
uniform vec3 uSunA, uSunB, uAmb, uGroundGlow, uBounce; uniform vec4 uAir; uniform vec2 uSunDir, uSunZ; uniform float uSunSharp, uFloorR;
vec3 kUp(vec3 P) { return vec3(-normalize(P.xy + vec2(1e-5)), 0.0); }
float kF(float a, float D) { return a * D / (D * D + a * a) + atan(a / D); }
vec3 kSunColor(vec2 xy) { float c = dot(normalize(xy + vec2(1e-4)), uSunDir); return mix(uSunB, uSunA, pow(clamp(0.5 + 0.5 * c, 0.0, 1.0), uSunSharp)); }
vec3 kSunColorAt(vec3 P) { return kSunColor(P.xy); }
// what little the air does over kilometres: far land takes a breath of the sky's own colour
vec3 kAir(vec3 c, vec3 P) { float d = length(P - cameraPosition); return mix(c, uAir.rgb * (kSunColorAt(P) * 0.5 + uAmb * 1.5), 1.0 - exp(-uAir.w * d)); }
// the line's light on a surface at P facing N, as a fraction of mid-floor
float kSunE(vec3 P, vec3 N) {
  float D = max(length(P.xy), 4.0);
  float nu = dot(N.xy, -P.xy / D), nz = N.z;
  float a1 = uSunZ.x - P.z, a2 = uSunZ.y - P.z;
  if (abs(nz) > 1e-3) { float a0 = -nu * D / nz; if (nz > 0.0) a1 = max(a1, a0); else a2 = min(a2, a0); }
  if (a2 <= a1) return 0.0;
  float e = nu * (kF(a2, D) - kF(a1, D)) / (2.0 * D) + nz * 0.5 * D * (1.0 / (D * D + a1 * a1) - 1.0 / (D * D + a2 * a2));
  return max(e, 0.0) * ${(3000 / 2.518).toFixed(1)};
}
vec3 kLight(vec3 P, vec3 N, vec3 F, vec3 FN) {
  float D = max(length(P.xy), 4.0);
  float nu = dot(N.xy, -P.xy / D);
  vec3 sc = kSunColor(P.xy);
  vec3 L = sc * min(kSunE(P, N), 6.0);
  L += uAmb * (0.8 + 0.2 * nu);
  // light thrown back up off the land onto walls, trunks, people, the undersides of crowns
  L += uBounce * sc * min(kSunE(P, vec3(-P.xy / D, 0.0)), 2.5) * (0.6 - 0.4 * nu);
  L += uGroundGlow * smoothstep(34.0, 0.0, uFloorR - D) * (0.65 - 0.35 * nu);
  return L;
}`;
  return {
    uniforms, glsl, kind: 'hollow',
    set(p) {
      if (p.sun !== undefined) uniforms.uSunA.value.copy(vec3col(p.sun, p.sunPower === undefined ? 1 : p.sunPower));
      if (p.sunFar !== undefined) uniforms.uSunB.value.copy(vec3col(p.sunFar, p.sunFarPower === undefined ? 1 : p.sunFarPower));
      if (p.sunAngle !== undefined) uniforms.uSunDir.value.set(Math.cos(p.sunAngle), Math.sin(p.sunAngle));
      if (p.amb !== undefined) uniforms.uAmb.value.copy(vec3col(p.amb, p.ambPower === undefined ? 0.2 : p.ambPower));
      if (p.ground !== undefined) uniforms.uGroundGlow.value.copy(vec3col(p.ground, p.groundPower || 0));
      if (p.sunSharp !== undefined) uniforms.uSunSharp.value = p.sunSharp;
      if (p.bounce !== undefined) uniforms.uBounce.value.copy(vec3col(p.bounce, p.bouncePower === undefined ? 0.22 : p.bouncePower));
      if (p.air !== undefined) { const c = vec3col(p.air); uniforms.uAir.value.set(c.x, c.y, c.z, p.airDensity === undefined ? uniforms.uAir.value.w : p.airDensity); }
      else if (p.airDensity !== undefined) uniforms.uAir.value.w = p.airDensity;
      if (p.z1 !== undefined) uniforms.uSunZ.value.x = p.z1;
      if (p.z2 !== undefined) uniforms.uSunZ.value.y = p.z2;
    },
  };
}

// Indoors: rows of ceiling lamps, pools of brighter light, and the light that bounces between floor and ceiling.
//   ambUp / ambDown: light on surfaces facing up / facing down
//   lattices: up to 4 (8 with maxLattices) of { origin:[x,y,z], spacing:[sx,sz], count:[nx,nz], color, power, reach }  (flat coordinates):
//             a regular grid of lamps at one height. Their light falls off with distance, beyond the grid's edge too.
//             Optional: drop (how far below the lamps the light reaches, metres; given a drop, nothing more than `above`,
//             default 0.6 m, over the lamps is lit either, so a deck's lamps do not shine through its ceiling) and
//             storeys with rise (the same grid on several decks, `rise` metres apart, default 4: a surface takes the
//             lamps of its own storey).
//   zones:    up to 4 (8 with maxZones) of { min:[x,y,z], max:[x,y,z], color, power, soft }  light from above inside a box
//             Optional: flare (the box widens by this many metres for each metre above min y: a court whose terraces
//             step back), side (the share upright faces get, default 0.3), under (what faces looking down get, as a
//             share of side, default 1)
//   haze:     colour things fade toward with distance, and how fast (per metre)
//   maxLattices, maxZones: room for more, to be given later with rig.setLattice(i, lattice) and rig.setZone(i, zone)
// rig.set({ ambUp, ambDown, ambPower, haze, hazeDensity }) changes the rest while flying.
export function lampRig(o = {}) {
  const NL = Math.min(8, Math.max(4, o.maxLattices || 0, (o.lattices || []).length));
  const NZ = Math.min(8, Math.max(4, o.maxZones || 0, (o.zones || []).length));
  const latA = [], latB = [], latC = [], latD = [], zA = [], zB = [], zC = [], zD = [];
  for (let i = 0; i < NL; i++) { latA.push(new Vector4()); latB.push(new Vector4(1, 1, 0, 0)); latC.push(new Vector4(0, 0, 0, 0)); latD.push(new Vector4(0, 0, 0, 0)); }
  for (let i = 0; i < NZ; i++) { zA.push(new Vector4()); zB.push(new Vector4(0, 0, 1, 0)); zC.push(new Vector4(0, 0, 0, 0)); zD.push(new Vector4(0.3, 1, 0, 0)); }
  // lattice i (null clears it)
  const setLattice = (i, l) => {
    if (i < 0 || i >= NL) return false;
    if (!l) { latB[i].set(1, 1, 0, 0); latC[i].set(0, 0, 0, 0); latD[i].set(0, 0, 0, 0); return true; }
    const rise = l.rise || DRUM.DECK, storeys = l.storeys || 1;
    latA[i].set(l.origin[0], l.origin[1], l.origin[2], l.reach || 4);
    latB[i].set(l.spacing[0], l.spacing[1], l.count[0], l.count[1]);
    const c = vec3col(l.color || '#ffd9a8', l.power === undefined ? 1 : l.power); latC[i].set(c.x, c.y, c.z, 1);
    latD[i].set(l.drop || (storeys > 1 ? rise - 0.1 : 0), rise, storeys, l.above === undefined ? 0.6 : l.above);
    return true;
  };
  // zone i (null clears it)
  const setZone = (i, z) => {
    if (i < 0 || i >= NZ) return false;
    if (!z) { zB[i].set(0, 0, 1, 0); zC[i].set(0, 0, 0, 0); zD[i].set(0.3, 1, 0, 0); return true; }
    zA[i].set(z.min[0], z.min[2], z.max[0], z.max[2]);
    zB[i].set(z.min[1], z.max[1], z.soft || 4, 1);
    const c = vec3col(z.color || '#ffffff', z.power === undefined ? 1 : z.power); zC[i].set(c.x, c.y, c.z, z.flare || 0);
    zD[i].set(z.side === undefined ? 0.3 : z.side, z.under === undefined ? 1 : z.under, 0, 0);
    return true;
  };
  (o.lattices || []).slice(0, NL).forEach((l, i) => setLattice(i, l));
  (o.zones || []).slice(0, NZ).forEach((z, i) => setZone(i, z));
  const uniforms = {
    uAmbUp: { value: vec3col(o.ambUp || '#57493d', o.ambPower === undefined ? 1 : o.ambPower) },
    uAmbDown: { value: vec3col(o.ambDown || '#3d342c', o.ambPower === undefined ? 1 : o.ambPower) },
    uLatA: { value: latA }, uLatB: { value: latB }, uLatC: { value: latC }, uLatD: { value: latD },
    uZoneA: { value: zA }, uZoneB: { value: zB }, uZoneC: { value: zC }, uZoneD: { value: zD },
    uHaze: { value: new Vector4(...vec3col(o.haze || '#000000').toArray(), o.hazeDensity || 0) },
  };
  const glsl = /* glsl */`
uniform vec3 uAmbUp, uAmbDown; uniform vec4 uHaze; uniform vec4 uLatA[${NL}], uLatB[${NL}], uLatC[${NL}], uLatD[${NL}], uZoneA[${NZ}], uZoneB[${NZ}], uZoneC[${NZ}], uZoneD[${NZ}];
vec3 kUp(vec3 P) { return vec3(-normalize(P.xy + vec2(1e-5)), 0.0); }
vec3 kAir(vec3 c, vec3 P) { return mix(c, uHaze.rgb, 1.0 - exp(-uHaze.w * length(P - cameraPosition))); }
// for a surface at height y under lattice (A, D): x = the height of the lamps that light it, y = how much of their light reaches it
vec2 kLatBand(float y, vec4 A, vec4 D) {
  if (D.x <= 0.0) return vec2(A.y, 1.0);
  float k = D.z > 1.5 ? clamp(ceil((y - A.y - D.w) / D.y), 0.0, D.z - 1.0) : 0.0;
  float ly = A.y + k * D.y;
  return vec2(ly, smoothstep(ly - D.x, ly - D.x * 0.75, y) * step(y, ly + D.w));
}
vec3 kLat(vec3 P, vec3 N, vec4 A, vec4 B, vec4 C, vec4 D) {
  if (C.w < 0.5) return vec3(0.0);
  vec2 lb = kLatBand(P.y, A, D);
  if (lb.y <= 0.0) return vec3(0.0);
  // the four lamps round the point, or the nearest of the grid's edge when the point is outside it
  vec2 g0 = clamp(floor((P.xz - A.xz) / B.xy), vec2(0.0), max(B.zw - 2.0, vec2(0.0)));
  float sum = 0.0;
  for (int i = 0; i <= 1; i++) for (int j = 0; j <= 1; j++) {
    vec2 c = g0 + vec2(float(i), float(j));
    if (c.x > B.z - 0.5 || c.y > B.w - 0.5) continue;
    vec3 d = vec3(A.x + c.x * B.x, lb.x, A.z + c.y * B.y) - P; float d2 = dot(d, d) + 0.02;
    float ndl = dot(N, d) * inversesqrt(d2);
    sum += max(ndl * 0.85 + 0.15, 0.0) / (1.0 + d2 / (A.w * A.w));
  }
  return C.rgb * (sum * lb.y);
}
vec3 kLight(vec3 P, vec3 N, vec3 F, vec3 FN) {
  vec3 L = mix(uAmbDown, uAmbUp, 0.5 + 0.5 * FN.y);
  for (int i = 0; i < ${NL}; i++) L += kLat(F, FN, uLatA[i], uLatB[i], uLatC[i], uLatD[i]);
  for (int i = 0; i < ${NZ}; i++) {
    if (uZoneB[i].w < 0.5) continue;
    vec4 A = uZoneA[i]; float s = uZoneB[i].z, w = uZoneC[i].w * max(F.y - uZoneB[i].x, 0.0);
    float m = smoothstep(A.x - w - s, A.x - w + s, F.x) * smoothstep(A.z + w + s, A.z + w - s, F.x) * smoothstep(A.y - w - s, A.y - w + s, F.z) * smoothstep(A.w + w + s, A.w + w - s, F.z)
            * smoothstep(uZoneB[i].x - s, uZoneB[i].x, F.y) * smoothstep(uZoneB[i].y + s, uZoneB[i].y, F.y);
    L += uZoneC[i].rgb * m * mix(uZoneD[i].x, 1.0, max(FN.y, 0.0)) * mix(1.0, uZoneD[i].y, max(-FN.y, 0.0));
  }
  return L;
}`;
  return {
    uniforms, glsl, kind: 'lamps', lattices: NL, zones: NZ, setLattice, setZone,
    set(p) {
      const k = p.ambPower === undefined ? 1 : p.ambPower;
      if (p.ambUp !== undefined) uniforms.uAmbUp.value.copy(vec3col(p.ambUp, k));
      if (p.ambDown !== undefined) uniforms.uAmbDown.value.copy(vec3col(p.ambDown, k));
      if (p.haze !== undefined) { const h = vec3col(p.haze); uniforms.uHaze.value.set(h.x, h.y, h.z, uniforms.uHaze.value.w); }
      if (p.hazeDensity !== undefined) uniforms.uHaze.value.w = p.hazeDensity;
    },
  };
}

// Outside, or anywhere simple: one light from a direction, ambient, and optional distance fade.
export function plainRig(o = {}) {
  const uniforms = {
    uDir: { value: new Vector3(...(o.dir || [0.3, 1, 0.2])).normalize() },
    uDirCol: { value: vec3col(o.color || '#ffffff', o.power === undefined ? 1 : o.power) },
    uAmbUp: { value: vec3col(o.ambUp || o.amb || '#30343c', o.ambPower === undefined ? 1 : o.ambPower) },
    uAmbDown: { value: vec3col(o.ambDown || o.amb || '#20242c', o.ambPower === undefined ? 1 : o.ambPower) },
    uHaze: { value: new Vector4(...vec3col(o.haze || '#000000').toArray(), o.hazeDensity || 0) },
  };
  const glsl = /* glsl */`
uniform vec3 uDir, uDirCol, uAmbUp, uAmbDown; uniform vec4 uHaze;
vec3 kUp(vec3 P) { return uDir; }
vec3 kAir(vec3 c, vec3 P) { return mix(c, uHaze.rgb, 1.0 - exp(-uHaze.w * length(P - cameraPosition))); }
vec3 kLight(vec3 P, vec3 N, vec3 F, vec3 FN) { return uDirCol * max(dot(N, uDir), 0.0) + mix(uAmbDown, uAmbUp, 0.5 + 0.5 * dot(N, uDir)); }`;
  return { uniforms, glsl, kind: 'plain' };
}

// ---------------------------------------------------------------- the lit material
const LIT_VERT = /* glsl */`
attribute vec4 aCol;      // rgb, and how far an instance colour tints it
attribute float aEmit;    // glow, in multiples of the surface colour
${BEND_PARS}
uniform float uTime;
#ifdef USE_WALK
attribute vec4 aWalk;     // radius of stroll (m), speed (m/s), phase, bob height
#endif
#ifdef USE_DRIFT
attribute vec4 aDrift;    // velocity (m/s) and the seconds before it starts over
attribute float aPhase;   // where in that loop it begins, 0..1
#endif
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vSoft;
void main() {
  vec3 p = position, n = normal;
  vSoft = aCol.a;
  #ifdef USE_INSTANCING
    #ifdef USE_WALK
      // each figure strolls a small circle (or stands, radius 0), facing the way it walks, with a low-g bob
      float ph = aWalk.z + uTime * aWalk.y / max(aWalk.x, 0.5);
      float cs = cos(ph), sn = sin(ph);
      p = (instanceMatrix * vec4(p, 1.0)).xyz - instanceMatrix[3].xyz; n = mat3(instanceMatrix) * n;
      if (aWalk.x > 0.01) {
        p = vec3(p.x * cs - p.z * sn, p.y, p.x * sn + p.z * cs); n = vec3(n.x * cs - n.z * sn, n.y, n.x * sn + n.z * cs);
        p.y += aWalk.w * abs(sin(uTime * aWalk.y * 2.4 + aWalk.z * 7.0));
        p += vec3(cs, 0.0, sn) * aWalk.x;
      }
      p += instanceMatrix[3].xyz;
    #else
      p = (instanceMatrix * vec4(p, 1.0)).xyz; n = mat3(instanceMatrix) * n;
    #endif
    #ifdef USE_DRIFT
      // things that travel: along a line, shrinking to nothing where the loop joins
      float du = fract(uTime / aDrift.w + aPhase);
      float ds = smoothstep(0.0, 0.05, du) * smoothstep(1.0, 0.95, du);
      p = instanceMatrix[3].xyz + (p - instanceMatrix[3].xyz) * ds + aDrift.xyz * (du * aDrift.w);
    #endif
  #endif
  n = normalize(n);
  vF = p; vFN = n;
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vec3 c = aCol.rgb;
  #ifdef USE_INSTANCING_COLOR
    c = mix(c, c * instanceColor, aCol.a);
  #endif
  vCol = c; vEmit = aEmit;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const litFrag = (rig) => /* glsl */`
${CLIP_PARS}
uniform float uEmit; uniform float uOpacity; uniform vec3 uTint; uniform float uSoft; uniform vec3 uBend;
varying vec3 vW; varying vec3 vN; varying vec3 vF; varying vec3 vFN; varying vec3 vCol; varying float vEmit; varying float vSoft;
${rig.glsl}
void main() {
  ${CLIP_FRAG}
  vec3 N = normalize(vN), FN = normalize(vFN);
  if (!gl_FrontFacing) { N = -N; FN = -FN; }
  // leaves and cloth pass light on: what an instance tints is lit as if it also faced up a little
  float soft = vSoft * uSoft;
  vec3 up = kUp(vW);
  N = normalize(mix(N, up, soft)); FN = normalize(mix(FN, uBend.z > 0.0 ? vec3(0.0, 1.0, 0.0) : up, soft));
  vec3 c = vCol * uTint * (kLight(vW, N, vF, FN) + vEmit * uEmit);
  gl_FragColor = vec4(kAir(c, vW), uOpacity);
}`;

/**
 * A lit surface. opts:
 *   bend   a frame from makeFrame(): wrap the flat model onto the drum
 *   side   'front' (default) | 'double' | 'back'
 *   emit   multiplies every aEmit in the mesh (default 1)
 *   walk   true for instanced figures carrying aWalk (see folk.js)
 *   drift  true for instances that travel in a line and loop: give each item drift:[vx,vy,vz,seconds] and phase in instances()
 *   soft   how far tinted surfaces (leaves, clothes) are lit as if they faced up: 0 = hard facets, default 0.7
 *   opacity, transparent, additive, depthWrite, tint
 */
export function litMaterial(rig, opts = {}) {
  const uniforms = {
    ...rig.uniforms, uClip: G.uClip, uTime: G.uTime,
    uBend: { value: opts.bend ? new Vector3(opts.bend.a0, opts.bend.z0, opts.bend.floorR) : new Vector3(0, 0, 0) },
    uEmit: { value: opts.emit === undefined ? 1 : opts.emit }, uOpacity: { value: opts.opacity === undefined ? 1 : opts.opacity },
    uTint: { value: vec3col(opts.tint || '#ffffff') }, uSoft: { value: opts.soft === undefined ? 0.7 : opts.soft },
  };
  const defines = {};
  if (opts.walk) defines.USE_WALK = 1;
  if (opts.drift) defines.USE_DRIFT = 1;
  const m = new ShaderMaterial({
    uniforms, defines, vertexShader: LIT_VERT, fragmentShader: litFrag(rig),
    side: opts.side === 'double' ? DoubleSide : opts.side === 'back' ? BackSide : FrontSide,
    transparent: !!opts.transparent || !!opts.additive, depthWrite: opts.depthWrite === undefined ? !(opts.transparent || opts.additive) : opts.depthWrite,
    blending: opts.additive ? AdditiveBlending : NormalBlending,
  });
  return m;
}

// ---------------------------------------------------------------- glows: lamps, windows, lanterns, far lights
const GLOW_VERT = /* glsl */`
attribute vec3 aPos;      // where (flat if the material bends)
attribute vec4 aColSize;  // rgb x strength, size in metres
attribute vec4 aMove;     // velocity xyz (m/s), loop seconds (0 = still)
attribute vec2 aTwinkle;  // phase, depth (0 = steady)
${BEND_PARS}
uniform float uTime, uPx, uMinPx, uMaxPx, uSize, uPower; uniform vec2 uRes;
varying vec3 vW; varying vec3 vC; varying vec2 vQ;
void main() {
  vec3 p = aPos; float fade = 1.0;
  if (aMove.w > 0.0) { float u = fract(uTime / aMove.w + aTwinkle.x); p += aMove.xyz * (u * aMove.w); fade = smoothstep(0.0, 0.06, u) * smoothstep(1.0, 0.94, u); }
  vec3 n = vec3(0.0, 1.0, 0.0);
  kBend(p, n);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz;
  vec4 mv = viewMatrix * wp;
  float dist = max(-mv.z, 0.01);
  float px = aColSize.w * uSize * uPx / dist;            // diameter in pixels
  float shown = clamp(px, uMinPx, uMaxPx);
  float k = (px * px) / (shown * shown);                  // a light too far to fill a pixel dims instead of shrinking
  float tw = 1.0 + aTwinkle.y * sin(uTime * (1.3 + 2.1 * fract(aTwinkle.x * 7.31)) + aTwinkle.x * 40.0);
  vC = aColSize.rgb * min(k, 1.0) * fade * tw * uPower;
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
  float r = length(vQ) * 2.0;
  float a = pow(max(1.0 - r, 0.0), uSoft);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(vC * a, 1.0);
}`;

/**
 * A cloud of small lights drawn as soft discs that always face the camera. One draw call for any number.
 * points: array of { p:[x,y,z], color, power, size (metres), move:[vx,vy,vz], loop (seconds), twinkle (0..1) }
 * opts: bend (frame), minPx (default 1.2), maxPx (default 220), soft (edge falloff power, default 1.6), depthTest (default true),
 *       power (multiplies every light; change it later with mesh.material.uniforms.uPower.value to fade them all)
 */
export function glowPoints(points, opts = {}) {
  const n = points.length;
  const g = new InstancedBufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const aPos = new Float32Array(n * 3), aCS = new Float32Array(n * 4), aMove = new Float32Array(n * 4), aTw = new Float32Array(n * 2);
  const c = new Color();
  for (let i = 0; i < n; i++) {
    const q = points[i];
    aPos[i * 3] = q.p[0]; aPos[i * 3 + 1] = q.p[1]; aPos[i * 3 + 2] = q.p[2];
    c.set(q.color || '#ffd9a0'); const k = q.power === undefined ? 1 : q.power;
    aCS[i * 4] = c.r * k; aCS[i * 4 + 1] = c.g * k; aCS[i * 4 + 2] = c.b * k; aCS[i * 4 + 3] = q.size || 1;
    if (q.move) { aMove[i * 4] = q.move[0]; aMove[i * 4 + 1] = q.move[1]; aMove[i * 4 + 2] = q.move[2]; aMove[i * 4 + 3] = q.loop || 10; }
    aTw[i * 2] = q.phase === undefined ? (i * 0.61803398875) % 1 : q.phase; aTw[i * 2 + 1] = q.twinkle || 0;
  }
  g.setAttribute('aPos', new InstancedBufferAttribute(aPos, 3));
  g.setAttribute('aColSize', new InstancedBufferAttribute(aCS, 4));
  g.setAttribute('aMove', new InstancedBufferAttribute(aMove, 4));
  g.setAttribute('aTwinkle', new InstancedBufferAttribute(aTw, 2));
  g.instanceCount = n;
  const m = new ShaderMaterial({
    uniforms: {
      uClip: G.uClip, uTime: G.uTime, uPx: G.uPx, uRes: G.uRes,
      uBend: { value: opts.bend ? new Vector3(opts.bend.a0, opts.bend.z0, opts.bend.floorR) : new Vector3(0, 0, 0) },
      uMinPx: { value: opts.minPx === undefined ? 1.2 : opts.minPx }, uMaxPx: { value: opts.maxPx || 220 }, uSoft: { value: opts.soft || 1.6 }, uSize: { value: 1 }, uPower: { value: opts.power === undefined ? 1 : opts.power },
    },
    vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, transparent: true, depthWrite: false, depthTest: opts.depthTest !== false, blending: AdditiveBlending,
  });
  const mesh = new Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 10;
  return mesh;
}

// Set a world-space bounding sphere on a mesh whose vertices move in the shader (bent or animated), so culling is right.
export function setBounds(mesh, center, radius) {
  const s = new Sphere(center.clone(), radius);
  if (mesh.isInstancedMesh) mesh.boundingSphere = s; else mesh.geometry.boundingSphere = s;
  return mesh;
}
