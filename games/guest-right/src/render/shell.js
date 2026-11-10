// The Hollow as seen from inside it: every pixel the near geometry leaves empty is a ray cast against the drum's own
// inner surface (the far bank, three kilometres overhead and perfectly sharp), its two end walls with their thirty
// terraces, and the sunline along the axis. The same code gives water its reflections.
import * as THREE from 'three';
import { GLSL_COMMON, VERT_FULLSCREEN } from './glsl.js';
import { DRUM } from '../core/drum.js';
import { worldUniforms } from './worldmat.js';

export const GLSL_SHELL = /* glsl */`
uniform highp sampler2D tLand;         // rgb: the land from afar (sRGB), a: night lights
uniform highp sampler2D tSunlineS;     // the sunline's colour (u along the line, v round the azimuth)
uniform vec4 uShellA;                  // (anchor theta, anchor z, sun intensity, night 0..1)
uniform vec3 uShellGlow;               // the Hollow's own bounce light
uniform float uShellRho;               // anchor rho (the axis is at y = this)
const float SH_R = 1500.0, SH_L = 3750.0, SH_Z0 = ${DRUM.SUN_Z0.toFixed(1)}, SH_Z1 = ${DRUM.SUN_Z1.toFixed(1)};
vec3 sunAt(float z, float az) { return texture(tSunlineS, vec2(clamp((z - SH_Z0) / (SH_Z1 - SH_Z0), 0.0, 1.0), az)).rgb; }
// light from the line on a surface facing the axis at drum (theta, z), radius rho: four samples in angle along the line
vec3 lineLight(float th, float z, float rho) {
  float az = fract(th / 6.2831853);
  float p0 = atan((SH_Z0 - z) / rho), p1 = atan((SH_Z1 - z) / rho), dp = (p1 - p0) / 4.0;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 4; i++) { float ph = p0 + (float(i) + 0.5) * dp; float c = cos(ph); acc += sunAt(z + rho * tan(ph), az) * (c * c * dp); }
  return acc * (1500.0 / rho);
}
// ro, rd in render space. Returns the colour seen along the ray; t = distance to what was hit.
vec3 shellTrace(vec3 ro, vec3 rd, out float t) {
  vec2 oc = vec2(ro.x, ro.y - uShellRho);
  float a = dot(rd.xy, rd.xy), b = dot(oc, rd.xy), c = dot(oc, oc) - SH_R * SH_R;
  float tc = 1e9;
  if (a > 1e-9) { float disc = b * b - a * c; if (disc > 0.0) tc = (-b + sqrt(disc)) / a; }
  float zF = -uShellA.y, zB = SH_L - uShellA.y;
  float tw = 1e9; float wall = 0.0;
  if (rd.z > 1e-6) { tw = (zB - ro.z) / rd.z; wall = 1.0; } else if (rd.z < -1e-6) { tw = (zF - ro.z) / rd.z; wall = -1.0; }
  vec3 col;
  float sunK = uShellA.z, night = uShellA.w;
  if (tc < tw) {
    t = tc; vec3 P = ro + rd * tc;
    float th = atan(P.x, uShellRho - P.y) + uShellA.x;
    float z = P.z + uShellA.y;
    vec2 uv = vec2(fract(th / 6.2831853 + 0.5), clamp(z / SH_L, 0.0, 1.0));
    vec4 m = texture(tLand, uv);
    vec3 alb = pow(m.rgb, vec3(2.2));
    // break up the magnified map with a little grain that depends on where the land is, not on the screen
    float g = vnoise(vec2(th * 1500.0, z) * 0.11) * 0.6 + vnoise(vec2(th * 1500.0, z) * 0.43) * 0.4;
    alb *= 0.82 + 0.36 * g;
    vec3 E = lineLight(th, z, SH_R) * sunK + uShellGlow;
    col = alb * E;
    vec2 tf = fract(uv * vec2(1024.0, 512.0)) - 0.5;
    float lg = m.a * (0.6 + 0.4 * vnoise(vec2(th * 1500.0, z) * 0.9)) * smoothstep(0.5, 0.12, length(tf)) * 1.6;
    col += vec3(1.0, 0.74, 0.42) * lg * night * 0.55;
  } else {
    t = tw; vec3 P = ro + rd * tw;
    vec2 q = vec2(P.x, P.y - uShellRho); float r = length(q);
    float th = atan(P.x, uShellRho - P.y) + uShellA.x;
    float zw = wall > 0.0 ? SH_L : 0.0;
    float tier = (SH_R - r) / 50.0; float fr = fract(tier); float ti = floor(tier);
    vec3 stone = vec3(0.6, 0.54, 0.45) * (0.85 + 0.15 * hash11(ti + 3.0));
    vec3 leaf = vec3(0.12, 0.26, 0.07);
    // each tier: a riser with rows of windows (the oldest people's flats), a planted lip
    vec2 wc = vec2(th * r / 5.5, fr * 12.0); vec2 wi = floor(wc), wf = fract(wc);
    float win = step(0.18, wf.x) * step(wf.x, 0.72) * step(0.25, wf.y) * step(wf.y, 0.8) * step(0.06, fr) * step(fr, 0.7);
    float lit = step(0.62, hash12(wi + ti * 17.0));
    vec3 face = mix(stone, stone * 0.45, win);
    float lip = smoothstep(0.74, 0.8, fr);
    float vine = smoothstep(0.5, 0.75, vnoise(vec2(th * r * 0.012, tier * 0.9))) * step(fr, 0.74) * 0.75 * smoothstep(0.1, 0.6, fr);
    vec3 alb = mix(mix(face, leaf, vine), leaf * 1.25, lip);
    // the wall gets the line's light at a slant: strongest low down, little near the axis
    float k = mix(0.36, 0.05, clamp((SH_R - r) / 1350.0, 0.0, 1.0));
    vec3 sc = sunAt(wall > 0.0 ? SH_Z1 : SH_Z0, fract(th / 6.2831853));
    col = alb * (sc * sunK * k + uShellGlow * 0.8);
    col += vec3(1.0, 0.72, 0.4) * win * lit * night * 0.9 * step(r, SH_R - 4.0);
    // the hub: the axle and the netted mouth of the flying hall
    if (r < 75.0) { float net = step(0.9, fract(r / 6.0)) + step(0.94, fract(th * 9.5)); col = mix(col * 0.5, vec3(0.03), clamp(net, 0.0, 1.0) * 0.6); }
    if (r < 9.0) col = vec3(0.012);
  }
  // the sunline itself: how close does the ray pass to the axis, and is that stretch of it lit?
  if (a > 1e-9) {
    float ts = -b / a;                                 // closest approach in the plane across the axis
    if (ts > 0.0 && ts < t) {
      float d = length(oc + rd.xy * ts);
      float z = ro.z + rd.z * ts + uShellA.y;
      float w = 1.1 + ts * 0.0011;                       // never thinner than about a pixel
      float core = smoothstep(w, w * 0.35, d) * step(SH_Z0, z) * step(z, SH_Z1);
      float thv = atan(oc.x, -oc.y) + uShellA.x;        // the side of the line that faces the eye
      vec3 sc = sunAt(z, fract(thv / 6.2831853));
      col = mix(col, sc * sunK * 26.0, core);
      col += sc * sunK * 0.5 * exp(-d / 26.0) * step(SH_Z0, z) * step(z, SH_Z1);
      float spar = smoothstep(w * 0.6, w * 0.2, d) * (1.0 - step(SH_Z0, z) * step(z, SH_Z1)) + smoothstep(w * 0.6, w * 0.2, d) * (1.0 - clamp(sunK * 4.0, 0.0, 1.0));
      col = mix(col, vec3(0.02, 0.022, 0.025), clamp(spar, 0.0, 1.0) * 0.85);
    }
  }
  return col;
}
`;

const FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_SHELL}
in vec2 vUv;
layout(location = 0) out vec4 outColor;
uniform highp sampler2D tDepth;
uniform mat4 uProjInv;
uniform mat3 uCamRot;
void main() {
  if (texture(tDepth, vUv).r < 1.0) discard;
  vec4 pv = uProjInv * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 rd = normalize(uCamRot * (pv.xyz / pv.w));
  float t;
  outColor = vec4(shellTrace(vec3(0.0), rd, t), 1.0);
}
`;

// The uniforms the shell needs, shared by the background pass and the water material.
export function createShell(pipeline, landData, w, h) {
  const tLand = new THREE.DataTexture(landData, w, h, THREE.RGBAFormat, THREE.UnsignedByteType);
  tLand.wrapS = THREE.RepeatWrapping; tLand.wrapT = THREE.ClampToEdgeWrapping; tLand.minFilter = THREE.LinearMipmapLinearFilter; tLand.magFilter = THREE.LinearFilter; tLand.generateMipmaps = true;
  tLand.anisotropy = 8; tLand.colorSpace = THREE.NoColorSpace; tLand.needsUpdate = true;
  const U = {
    tLand: { value: tLand }, tSunlineS: { value: pipeline.sunTex },
    uShellA: { value: new THREE.Vector4(0, 0, 0, 0) }, uShellGlow: { value: new THREE.Color(0.05, 0.06, 0.04) }, uShellRho: worldUniforms.uAnchorRho,
  };
  const mat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: 'precision highp float;\n' + VERT_FULLSCREEN, fragmentShader: FRAG,
    uniforms: Object.assign({ tDepth: { value: null }, uProjInv: { value: new THREE.Matrix4() }, uCamRot: { value: new THREE.Matrix3() } }, U),
    depthTest: false, depthWrite: false, blending: THREE.NoBlending,
  });
  const shell = {
    uniforms: U, material: mat, tLand, on: false,
    // sun: intensity of the line (0 at night); night: 0..1; glow: [r,g,b] bounce light
    set(anchor, sun, night, glow) { U.uShellA.value.set(anchor.theta, anchor.z, sun, night); U.uShellGlow.value.setRGB(glow[0], glow[1], glow[2]); },
    pass(pl, camera) {
      if (!shell.on) return;
      mat.uniforms.tDepth.value = pl.gbuf.depthTexture; mat.uniforms.uProjInv.value.copy(camera.projectionMatrixInverse); mat.uniforms.uCamRot.value.setFromMatrix4(camera.matrixWorld);
      pl._pass(mat, pl.lit);
    },
  };
  return shell;
}
