// The deferred lighting pass: reads the G-buffer and lights every pixel from the clustered lamps, the ambient volumes,
// the sunline (in the Hollow) and the overhead shadow maps.
import { GLSL_COMMON, GLSL_CYL, GLSL_BRDF } from './glsl.js';
import { CLUSTER } from './lights.js';

// Shared by the lighting pass and the forward (glass, water) shaders: walking this pixel's cluster.
export const GLSL_CLUSTER = /* glsl */`
uniform highp sampler2D tLights;
uniform highp sampler2D tClusters;
uniform highp sampler2D tIndices;
#define CL_X ${CLUSTER.X}
#define CL_Y ${CLUSTER.Y}
#define CL_Z ${CLUSTER.Z}
#define CL_NEAR ${CLUSTER.NEAR.toFixed(4)}
#define CL_LOGK ${(CLUSTER.Z / Math.log(CLUSTER.FAR / CLUSTER.NEAR)).toFixed(6)}
ivec2 clusterOf(vec2 uv, float viewZ) {
  int sl = int(clamp(floor(log(max(viewZ, CL_NEAR) / CL_NEAR) * CL_LOGK), 0.0, float(CL_Z - 1)));
  ivec2 t = ivec2(clamp(floor(uv * vec2(float(CL_X), float(CL_Y))), vec2(0.0), vec2(float(CL_X - 1), float(CL_Y - 1))));
  vec2 oc = texelFetch(tClusters, ivec2(t.x + t.y * CL_X, sl), 0).rg;
  return ivec2(int(oc.x + 0.5), int(oc.y + 0.5));
}
int lightIndex(int k) { return int(texelFetch(tIndices, ivec2(k % 256, k / 256), 0).r + 0.5); }
// soft clip of a drum-aligned box: q = (dTheta, rho, dz); returns 0..1
float boxClip(vec3 q, vec3 bmin, vec3 bmax, float soft) {
  vec3 lo = (q - bmin) * vec3(q.y, 1.0, 1.0), hi = (bmax - q) * vec3(q.y, 1.0, 1.0);
  vec3 m = min(lo, hi);
  return saturate(min(m.x, min(m.y, m.z)) / soft + 1.0);
}
`;

export const GLSL_SHADOW = /* glsl */`
uniform highp sampler2D tShRoom;
uniform highp sampler2D tShSky0;
uniform highp sampler2D tShSky1;
uniform vec4 uShRoom;  uniform vec2 uShRoomRho;     // (centre dTheta, centre dz, half extent, ref rho), (rho near, rho far)
uniform vec4 uShSky0;  uniform vec2 uShSky0Rho;
uniform vec4 uShSky1;  uniform vec2 uShSky1Rho;
uniform float uShSkyOn;
uniform float uFrame;
const vec2 VOGEL[12] = vec2[12](
  vec2(0.1443, 0.0), vec2(-0.1843, 0.1689), vec2(0.0282, -0.3215), vec2(0.2297, 0.3082), vec2(-0.4257, -0.0751), vec2(0.3837, -0.2932),
  vec2(-0.1069, 0.5102), vec2(-0.3197, -0.4734), vec2(0.5918, 0.1463), vec2(-0.5573, 0.3166), vec2(0.1968, -0.6357), vec2(0.2851, 0.6441));
// q = (dTheta, rho, dz). aniso stretches the penumbra along the axis (a line of light casts streaks). Returns visibility 0..1.
float overheadVis(highp sampler2D map, vec4 sh, vec2 shRho, vec3 q, float softK, vec2 aniso, float rot, float biasM) {
  vec2 uv = vec2((q.x - sh.x) * sh.w, q.z - sh.y) / sh.z * 0.5 + 0.5;
  if (uv.x < 0.002 || uv.y < 0.002 || uv.x > 0.998 || uv.y > 0.998) return 1.0;
  float span = shRho.y - shRho.x;
  float dr = (q.y - shRho.x) / span;
  if (dr > 1.0 || dr < 0.0) return 1.0;
  float bias = biasM / span;
  float c = cos(rot), s = sin(rot); mat2 R = mat2(c, -s, s, c);
  float searchUV = 0.9 / (2.0 * sh.z);
  float bs = 0.0, bn = 0.0;
  for (int i = 0; i < 12; i += 2) {
    float dm = texture(map, uv + R * VOGEL[i] * searchUV * 1.5 * aniso).r;
    if (dm < dr - bias) { bs += dm; bn += 1.0; }
  }
  if (bn < 0.5) return 1.0;
  float h = (dr - bs / bn) * span;
  float pen = clamp(h * softK, 0.04, 1.6) / (2.0 * sh.z);
  float vis = 0.0;
  for (int i = 0; i < 12; i++) vis += step(dr - bias, texture(map, uv + R * VOGEL[i] * pen * 1.5 * aniso).r);
  return vis / 12.0;
}
`;

export const LIGHT_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_CYL}
${GLSL_BRDF}
${GLSL_CLUSTER}
${GLSL_SHADOW}
in vec2 vUv;
layout(location = 0) out vec4 outColor;
uniform sampler2D tAlbedo;
uniform highp sampler2D tNormal;
uniform highp sampler2D tEmissive;
uniform highp sampler2D tDepth;
uniform sampler2D tAO;
uniform highp sampler2D tSSR;
uniform highp sampler2D tSunline;        // the sunline's colour: u along its lit length, v round its azimuth
uniform mat4 uProjInv;
uniform mat3 uCamRot;                     // view -> render space
uniform vec3 uBg;
uniform float uSSROn;
uniform float uAOOn;
uniform vec3 uSunSeg;                     // (z0, z1) of the lit line relative to the anchor, intensity
uniform float uAnchorTheta;               // the anchor's absolute drum angle (for the sunline's azimuth lookup)
uniform int uAmbCount;
uniform vec4 uAmbSky[8];
uniform vec4 uAmbGround[8];
uniform vec4 uAmbMin[8];
uniform vec4 uAmbMax[8];
uniform int uDebug;

void main() {
  float depth = texture(tDepth, vUv).r;
  if (depth >= 1.0) { outColor = vec4(uBg, 1.0); return; }
  vec4 g0 = texture(tAlbedo, vUv);
  vec4 g1 = texture(tNormal, vUv);
  vec4 g2 = texture(tEmissive, vUv);
  vec3 alb = g0.rgb * g0.rgb;
  int shade = int(g0.a * 3.0 + 0.5);
  vec3 N = normalize(g1.xyz);
  float rough = clamp(g1.a, 0.04, 1.0);
  float aoBaked = g2.a;

  vec4 pv = uProjInv * vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  pv.xyz /= pv.w;
  vec3 P = uCamRot * pv.xyz;
  vec3 V = normalize(-P);
  float NoV = max(dot(N, V), 1e-3);
  vec3 q = renderToCyl(P);
  vec3 up = upAt(q.x);

  float ssao = uAOOn > 0.5 ? texture(tAO, vUv).r : 1.0;
  float ao = min(aoBaked, ssao);

  float metal = shade == 3 ? 1.0 : 0.0;
  vec3 f0 = mix(vec3(0.04), alb, metal);
  vec3 dif = alb * (1.0 - metal);
  float a = rough * rough;
  float rot = ign(gl_FragCoord.xy + uFrame * 5.588238) * 6.2831853;

  vec3 col = vec3(0.0);

  // ---- overhead shadows
  float visRoom = overheadVis(tShRoom, uShRoom, uShRoomRho, q, 0.38, vec2(1.0), rot, 0.035);
  float visSky = 1.0;
  if (uShSkyOn > 0.5) {
    vec2 uv0 = vec2((q.x - uShSky0.x) * uShSky0.w, q.z - uShSky0.y) / uShSky0.z;
    if (max(abs(uv0.x), abs(uv0.y)) < 0.94) visSky = overheadVis(tShSky0, uShSky0, uShSky0Rho, q, 0.5, vec2(0.35, 1.6), rot, 0.06);
    else visSky = overheadVis(tShSky1, uShSky1, uShSky1Rho, q, 0.5, vec2(0.35, 1.6), rot, 0.35);
  }

  // ---- ambient volumes (bounce light, luminous ceilings, the Hollow's own glow)
  vec3 R = reflect(-V, N);
  float specOcc = saturate(pow(NoV + ao, exp2(-16.0 * rough - 1.0)) - 1.0 + ao);
  vec3 envB = envBRDF(f0, rough, NoV);
  vec3 ambSpec = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    if (i >= uAmbCount) break;
    float w = boxClip(q, uAmbMin[i].xyz, uAmbMax[i].xyz, uAmbMin[i].w);
    if (w <= 0.0) continue;
    vec3 sky = uAmbSky[i].rgb, gnd = uAmbGround[i].rgb;
    float skylit = uAmbGround[i].a;
    float sv = mix(1.0, mix(0.32, 1.0, visSky), skylit);
    float hemi = dot(N, up) * 0.5 + 0.5;
    vec3 irr = mix(gnd, sky * sv, hemi);
    if (shade == 1) irr = mix(irr, sky * sv, 0.35);          // leaves let light through
    col += dif * irr * ao * w;
    float hr = dot(R, up) * 0.5 + 0.5;
    ambSpec += mix(gnd, sky * sv, smoothstep(0.0, 1.0, hr)) * w * uAmbSky[i].a;
  }
  // reflections: screen-space where they hit, the ambient gradient elsewhere
  vec3 refl = ambSpec * mix(1.0, 0.55, rough);
  if (uSSROn > 0.5 && rough < 0.6) {
    vec4 ssr = texture(tSSR, vUv);
    refl = mix(refl, ssr.rgb, ssr.a * (1.0 - smoothstep(0.35, 0.6, rough)));
  }
  col += refl * envB * specOcc;

  // ---- clustered lamps
  ivec2 oc = clusterOf(vUv, -pv.z);
  float dAO = mix(1.0, ao, 0.45);
  for (int k = 0; k < 96; k++) {
    if (k >= oc.y) break;
    int li = lightIndex(oc.x + k);
    vec4 r0 = texelFetch(tLights, ivec2(li, 0), 0);
    vec4 r1 = texelFetch(tLights, ivec2(li, 1), 0);
    vec4 r2 = texelFetch(tLights, ivec2(li, 2), 0);
    float type = mod(r1.w, 8.0); float lf = floor(r1.w / 8.0 + 0.01);
    vec3 toL;
    float srcR = r2.w;
    if (type > 1.5) { vec3 ab = r2.xyz - r0.xyz; float t = clamp(dot(P - r0.xyz, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0); toL = r0.xyz + ab * t - P; }
    else { toL = r0.xyz - P; if (type > 0.5) srcR = 0.06; }
    float d2 = dot(toL, toL);
    float range = r0.w;
    if (d2 > range * range) continue;
    vec4 r3 = texelFetch(tLights, ivec2(li, 3), 0);
    vec4 r4 = texelFetch(tLights, ivec2(li, 4), 0);
    float clip = boxClip(q, r3.xyz, r4.xyz, r3.w);
    if (clip <= 0.0) continue;
    float d = sqrt(d2);
    vec3 L = toL / d;
    float wdw = saturate(1.0 - (d2 * d2) / (range * range * range * range));
    float att = wdw * wdw / max(d2, srcR * srcR) * clip;
    if (type > 0.5 && type < 1.5) att *= smoothstep(r2.w, r4.w, dot(-L, r2.xyz));
    if (mod(lf, 2.0) > 0.5) att *= visRoom;
    float NoL = dot(N, L);
    float nl = shade == 1 ? saturate((NoL + 0.45) / 1.45) + 0.3 * saturate(-NoL) : (shade == 2 ? saturate((NoL + 0.22) / 1.22) : saturate(NoL));
    if (nl <= 0.0 || att <= 1e-5) continue;
    vec3 E = r1.rgb * att * nl * dAO;
    col += dif * E;
    if (lf < 1.5 && NoL > 0.0) {
      vec3 H = normalize(L + V);
      float NoH = saturate(dot(N, H)), VoH = saturate(dot(V, H));
      float aa = clamp(a + srcR / (2.0 * d), 0.002, 1.0);
      vec3 spec = F_Schlick(f0, VoH) * (D_GGX(NoH, aa) * V_SmithGGX(NoV, saturate(NoL), aa) * PI);
      if (shade == 2) spec += vec3(0.25) * pow(1.0 - VoH, 4.0) * (1.0 - NoH) * 0.6;      // cloth sheen
      col += spec * r1.rgb * att * saturate(NoL) * mix(1.0, ao, 0.7);
    }
  }

  // ---- the sunline (a line of light along the axis), in the Hollow
  if (uSunSeg.z > 0.0) {
    float z0 = uSunSeg.x, z1 = uSunSeg.y;
    float rho = q.y;
    float p0 = atan((z0 - P.z) / rho), p1 = atan((z1 - P.z) / rho);
    float dphi = (p1 - p0) / 6.0;
    vec3 axisP = vec3(0.0, uAnchorRho, 0.0);
    float az = fract((q.x + uAnchorTheta) / 6.2831853);
    vec3 acc = vec3(0.0); vec3 accS = vec3(0.0);
    float aS = max(a, 0.09);
    for (int i = 0; i < 6; i++) {
      float phi = p0 + (float(i) + 0.5) * dphi;
      float zs = P.z + rho * tan(phi);
      vec3 S = vec3(0.0, uAnchorRho, zs);
      vec3 L = normalize(S - P);
      float NoL = dot(N, L);
      float nl = shade == 1 ? saturate((NoL + 0.45) / 1.45) + 0.35 * saturate(-NoL) : (shade == 2 ? saturate((NoL + 0.22) / 1.22) : saturate(NoL));
      vec3 c = texture(tSunline, vec2((zs - z0) / (z1 - z0), az)).rgb;
      float wgt = cos(phi) * dphi;
      acc += c * (nl * wgt);
      if (NoL > 0.0) {
        vec3 H = normalize(L + V);
        float NoH = saturate(dot(N, H)), VoH = saturate(dot(V, H));
        accS += c * F_Schlick(f0, VoH) * (D_GGX(NoH, aS) * V_SmithGGX(NoV, NoL, aS) * PI * NoL * wgt);
      }
    }
    float k = uSunSeg.z * (1500.0 / rho) * visSky;
    col += (dif * acc * mix(1.0, ao, 0.3) + accS * mix(1.0, ao, 0.7)) * k;
  }

  col += g2.rgb;

  if (uDebug == 1) col = alb;
  else if (uDebug == 2) col = N * 0.5 + 0.5;
  else if (uDebug == 3) col = vec3(ao);
  else if (uDebug == 4) col = vec3(float(oc.y) / 24.0, float(oc.y) / 96.0, 0.1);
  else if (uDebug == 5) col = vec3(visRoom, visSky, 1.0);
  else if (uDebug == 6) col = vec3(rough);
  outColor = vec4(max(col, 0.0), 1.0);
}
`;
