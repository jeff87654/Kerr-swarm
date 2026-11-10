// Forward materials, drawn after the deferred lighting: glass and additive glows. They share the world vertex layout
// (so they bend with the drum) and walk the same light clusters for highlights.
import * as THREE from 'three';
import { GLSL_COMMON, GLSL_BEND, GLSL_BRDF } from './glsl.js';
import { GLSL_CLUSTER } from './lightpass.js';
import { worldUniforms } from './worldmat.js';

const VERT = /* glsl */`
${GLSL_COMMON}
${GLSL_BEND}
in vec4 aColor;
in vec4 aMat;
out vec3 vNormal;
out vec3 vPos;
out vec4 vColor;
out vec2 vUv;
out float vParam;
out float vViewZ;
void main() {
  vec4 fr = frameRow(modelMatrix);
  mat4 M = affineOf(modelMatrix);
#ifdef USE_INSTANCING
  M = M * instanceMatrix;
#endif
  vec4 pf = M * vec4(position, 1.0);
  float th;
  vec3 pr = bendPos(pf.xyz, fr, th);
  vPos = pr; vNormal = bendDir(normalize(mat3(M) * normal), th);
  vColor = vec4(pow(aColor.rgb, vec3(2.2)), aColor.a);
  vUv = uv; vParam = aMat.w / 255.0;
  vec4 pv = viewMatrix * vec4(pr, 1.0);
  vViewZ = -pv.z;
  gl_Position = projectionMatrix * pv;
}
`;

const GLASS_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_BRDF}
${GLSL_CLUSTER}
uniform vec2 uRes;
uniform vec3 uEnvSky;        // what glass reflects from above
uniform vec3 uEnvGround;
in vec3 vNormal;
in vec3 vPos;
in vec4 vColor;
in vec2 vUv;
in float vParam;
in float vViewZ;
layout(location = 0) out vec4 outColor;
void main() {
  vec3 N = normalize(vNormal); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(-vPos);
  float NoV = max(dot(N, V), 1e-3);
  float fres = 0.04 + 0.96 * pow(1.0 - NoV, 5.0);
  vec3 R = reflect(-V, N);
  vec3 env = mix(uEnvGround, uEnvSky, smoothstep(-0.4, 0.6, R.y));
  float rough = clamp(vParam, 0.03, 1.0); float a = rough * rough;
  vec3 spec = vec3(0.0);
  vec2 uv = gl_FragCoord.xy / uRes;
  ivec2 oc = clusterOf(uv, vViewZ);
  for (int k = 0; k < 24; k++) {
    if (k >= oc.y) break;
    int li = lightIndex(oc.x + k);
    vec4 r0 = texelFetch(tLights, ivec2(li, 0), 0);
    vec4 r1 = texelFetch(tLights, ivec2(li, 1), 0);
    vec3 toL = r0.xyz - vPos; float d2 = dot(toL, toL); if (d2 > r0.w * r0.w) continue;
    float d = sqrt(d2); vec3 L = toL / d; float NoL = dot(N, L); if (NoL <= 0.0) continue;
    float w = saturate(1.0 - (d2 * d2) / (r0.w * r0.w * r0.w * r0.w));
    vec3 H = normalize(L + V); float NoH = saturate(dot(N, H));
    float aa = clamp(a + 0.1 / d, 0.004, 1.0);
    spec += r1.rgb * (w * w / max(d2, 0.02)) * NoL * D_GGX(NoH, aa) * 0.05 * PI;
  }
  vec3 tint = vColor.rgb;
  float alpha = clamp(vColor.a + fres * 0.7, 0.0, 1.0);
  // premultiplied: tinted body + reflections on top
  vec3 col = tint * (uEnvSky * 0.1) * vColor.a + env * fres + spec;
  outColor = vec4(col, alpha);
}
`;

const GLOW_FRAG = /* glsl */`
${GLSL_COMMON}
uniform float uLamps;
uniform float uNight;
in vec3 vNormal;
in vec3 vPos;
in vec4 vColor;
in vec2 vUv;
in float vParam;
layout(location = 0) out vec4 outColor;
void main() {
  // uv is 0..1 across a card: a soft round falloff. vParam scales the strength (0..1 -> 0..8); alpha 0.5 = follows the lamps, 0.25 = night only.
  vec2 q = vUv * 2.0 - 1.0; float d = dot(q, q);
  float f = exp(-d * 3.2) * saturate(1.0 - d);
  float k = vParam * 8.0;
  if (vColor.a < 0.6 && vColor.a > 0.4) k *= uLamps; else if (vColor.a <= 0.4) k *= uNight;
  outColor = vec4(vColor.rgb * f * k, 0.0);
}
`;

export function createForwardMaterials(pipeline) {
  const res = new THREE.Vector2(1, 1);
  const glass = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: GLASS_FRAG,
    uniforms: Object.assign({ uAnchorRho: worldUniforms.uAnchorRho, uRes: { value: res }, uEnvSky: { value: new THREE.Color(0.9, 0.75, 0.55) }, uEnvGround: { value: new THREE.Color(0.25, 0.2, 0.15) } }, pipeline.clusterU),
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
  });
  const glow = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: GLOW_FRAG,
    uniforms: { uAnchorRho: worldUniforms.uAnchorRho, uLamps: worldUniforms.uLamps, uNight: worldUniforms.uNight },
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
  });
  return { glass, glow, res };
}
