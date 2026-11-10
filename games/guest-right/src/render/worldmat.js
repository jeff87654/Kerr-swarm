// The G-buffer materials: one shader for all solid world geometry (static batches, instanced props, people),
// and its depth-only twin for the overhead shadow maps.
//
// Vertex layout (see world/meshbuilder.js):
//   position (flat metres, relative to the mesh origin), normal, uv (in texture tiles),
//   aColor  u8x4 normalised: rgb = sRGB tint, a = baked occlusion
//   aMat    u8x4 raw: x = texture layer, y = emissive code (0 none, else 2^((y-128)/16)), z = flag bits, w = parameter
//           (roughness offset around 128, or sway weight when the sway flag is set)
//   aInst   (instanced only, optional) rgba per instance: rgb multiplies the tint, a = free parameter
// Flag bits: 1 atlas (uv is into the sign atlas, layer = page) · 2 lamp (emission follows the home lamps) · 4 sway (plants)
//            8 night (emission only at night) · 16 unused · 32+64 shading id (0 standard, 1 foliage, 2 cloth/skin, 3 metal) · 128 flicker
import * as THREE from 'three';
import { GLSL_COMMON, GLSL_BEND } from './glsl.js';

export const FLAG = { ATLAS: 1, LAMP: 2, SWAY: 4, NIGHT: 8, FOLIAGE: 32, CLOTH: 64, METAL: 96, FLICKER: 128 };

const VERT = /* glsl */`
${GLSL_COMMON}
${GLSL_BEND}
in vec4 aColor;
in vec4 aMat;
#ifdef INST_TINT
in vec4 aInst;
#endif
uniform float uTime;
out vec3 vNormal;
out vec3 vPos;
out vec2 vUv;
out vec4 vColor;
flat out vec4 vMat;
#ifdef SHADOW_PASS
uniform vec4 uShadow;      // (centre dTheta, centre dz, half extent m, reference rho)
uniform vec2 uShadowRho;   // (rho at depth 0, rho at depth 1)
#endif

void main() {
  vec4 fr = frameRow(modelMatrix);
  mat4 M = affineOf(modelMatrix);
#ifdef USE_INSTANCING
  M = M * instanceMatrix;
#endif
  vec4 pf = M * vec4(position, 1.0);
  vec3 nf = normalize(mat3(M) * normal);
  float flags = aMat.z;
  if (mod(floor(flags / 4.0), 2.0) > 0.5) {            // sway: plants, cloth, bunting
    float w = aMat.w / 255.0;
    float t = uTime;
    vec2 ph = pf.xz * 0.9 + pf.y * 0.35;
    pf.x += (sin(t * 1.31 + ph.x * 1.7 + ph.y) * 0.6 + sin(t * 2.9 + ph.y * 3.1) * 0.25) * w * 0.07;
    pf.z += (cos(t * 1.07 + ph.y * 1.3) * 0.6 + sin(t * 3.3 + ph.x * 2.3) * 0.25) * w * 0.06;
    pf.y += sin(t * 1.9 + ph.x * 2.1) * w * 0.02;
  }
  float th;
  vec3 pr = bendPos(pf.xyz, fr, th);
  vUv = uv;
  vMat = aMat;
  vec4 col = vec4(pow(aColor.rgb, vec3(2.2)), aColor.a);
#ifdef INST_TINT
  col.rgb *= aInst.rgb;
#endif
  vColor = col;
#ifdef SHADOW_PASS
  float rho = uAnchorRho - fr.z - pf.y;
  vec2 s = vec2((th - uShadow.x) * uShadow.w, (fr.w + pf.z) - uShadow.y) / uShadow.z;
  float d = (rho - uShadowRho.x) / (uShadowRho.y - uShadowRho.x);
  gl_Position = vec4(s, d * 2.0 - 1.0, 1.0);
  vPos = pr; vNormal = nf;
#else
  vPos = pr;
  vNormal = bendDir(nf, th);
  gl_Position = projectionMatrix * viewMatrix * vec4(pr, 1.0);
#endif
}
`;

const FRAG = /* glsl */`
${GLSL_COMMON}
uniform highp sampler2DArray tAlb;
uniform highp sampler2DArray tNrm;
uniform highp sampler2DArray tAtlas;
uniform float uTime;
uniform float uLamps;       // 0..1 home and street lamps
uniform float uNight;       // 0..1 night-only signs
uniform vec2 uFade;         // detail fade (start, end) in metres from the camera; end <= 0 disables
uniform float uFrame;
in vec3 vNormal;
in vec3 vPos;
in vec2 vUv;
in vec4 vColor;
flat in vec4 vMat;
#ifdef SHADOW_PASS
layout(location = 0) out vec4 gAlbedo;
#else
layout(location = 0) out vec4 gAlbedo;
layout(location = 1) out vec4 gNormal;
layout(location = 2) out vec4 gEmissive;
#endif

// macro variation, periodic over 64 texture tiles so that chunk uv offsets (multiples of 64) do not show
float macroNoise(vec2 uv) {
  vec2 p = uv * 0.25; vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  vec2 i0 = mod(i, 16.0), i1 = mod(i + 1.0, 16.0);
  float a = hash12(i0), b = hash12(vec2(i1.x, i0.y)), c = hash12(vec2(i0.x, i1.y)), d = hash12(i1);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  float layer = vMat.x;
  float flags = vMat.z;
  bool atlas = mod(flags, 2.0) > 0.5;
  vec4 a; vec4 n;
  if (atlas) { a = texture(tAtlas, vec3(vUv, layer)); n = vec4(0.5, 0.5, 0.5, 1.0); }
  else { a = texture(tAlb, vec3(vUv, layer)); n = texture(tNrm, vec3(vUv, layer)); }
#ifdef CUTOUT
  if (a.a < 0.45) discard;
#endif
#ifdef VERT_ALPHA
  if (vColor.a < 0.5) discard;
#endif
  if (uFade.y > 0.0) {
    float fd = 1.0 - smoothstep(uFade.x, uFade.y, length(vPos));
    if (fd < ign(gl_FragCoord.xy + uFrame * 5.588238)) discard;
  }
#ifdef SHADOW_PASS
  gAlbedo = vec4(0.0);
#else
  vec3 alb = srgbToLin(a.rgb);
  if (!atlas) {
    float mv = macroNoise(vUv);
    alb *= 1.25 * (0.9 + 0.2 * mv);
  }
  alb *= vColor.rgb;
  float rough = n.z;
  bool sway = mod(floor(flags / 4.0), 2.0) > 0.5;
  if (!sway) rough = clamp(rough + (vMat.w - 128.0) / 255.0, 0.03, 1.0);

  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec2 tn = n.xy * 2.0 - 1.0;
  if (dot(tn, tn) > 1e-5) {
    vec3 dp1 = dFdx(vPos), dp2 = dFdy(vPos);
    vec2 du1 = dFdx(vUv), du2 = dFdy(vUv);
    vec3 dp2perp = cross(dp2, N), dp1perp = cross(N, dp1);
    vec3 T = dp2perp * du1.x + dp1perp * du2.x;
    vec3 B = dp2perp * du1.y + dp1perp * du2.y;
    float inv = inversesqrt(max(max(dot(T, T), dot(B, B)), 1e-12));
    N = normalize(T * (tn.x * inv) + B * (tn.y * inv) + N * sqrt(max(0.0, 1.0 - dot(tn, tn))));
  }

  float shade = floor(mod(flags, 128.0) / 32.0);     // 0 standard, 1 foliage, 2 cloth, 3 metal
#ifdef VERT_ALPHA
  float ao = n.w;
#else
  float ao = vColor.a * n.w;
#endif

  vec3 em = vec3(0.0);
  if (vMat.y > 0.5) {
    float s = exp2((vMat.y - 128.0) / 16.0);
    if (mod(floor(flags / 2.0), 2.0) > 0.5) s *= uLamps;
    if (mod(floor(flags / 8.0), 2.0) > 0.5) s *= uNight;
    if (flags > 127.5) s *= 0.9 + 0.1 * sin(uTime * 9.0 + vPos.x * 3.0) * sin(uTime * 23.0 + 1.7);
    em = alb * s;
    alb *= 0.35;
  }
  gAlbedo = vec4(sqrt(saturate(alb)), shade / 3.0);
  gNormal = vec4(N, rough);
  gEmissive = vec4(em, ao);
#endif
}
`;

// Shared uniforms: one object, referenced by every world material, updated once a frame by the pipeline.
export const worldUniforms = {
  uAnchorRho: { value: 3000 },
  uTime: { value: 0 },
  uLamps: { value: 1 },
  uNight: { value: 1 },
  uFrame: { value: 0 },
  tAlb: { value: null },
  tNrm: { value: null },
  tAtlas: { value: null },
};

export function makeWorldMaterial(defines, extra) { return make(defines, extra); }
function make(defines, extra) {
  const m = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: Object.assign({}, worldUniforms, { uFade: { value: new THREE.Vector2(0, 0) } }, extra && extra.uniforms),
    defines: Object.assign({}, defines),
    side: extra && extra.side !== undefined ? extra.side : THREE.FrontSide,
    blending: THREE.NoBlending, transparent: false, depthTest: true, depthWrite: true,
  });
  return m;
}

// A set of materials for one kind of geometry: gbuffer + shadow, with or without the detail fade.
export function createWorldMaterials() {
  const shadowU = { uShadow: { value: new THREE.Vector4() }, uShadowRho: { value: new THREE.Vector2(0, 1) } };
  const mats = {
    shadowUniforms: shadowU,
    opaque: make({}),
    opaqueDetail: make({}),
    cutout: make({ CUTOUT: 1 }, { side: THREE.DoubleSide }),
    cutoutDetail: make({ CUTOUT: 1 }, { side: THREE.DoubleSide }),
    inst: make({ INST_TINT: 1 }),                                  // instanced with per-instance tint
    instCutout: make({ INST_TINT: 1, CUTOUT: 1 }, { side: THREE.DoubleSide }),
    shadow: make({ SHADOW_PASS: 1 }, { uniforms: shadowU, side: THREE.DoubleSide }),
    shadowCutout: make({ SHADOW_PASS: 1, CUTOUT: 1 }, { uniforms: shadowU, side: THREE.DoubleSide }),
    shadowInst: make({ SHADOW_PASS: 1, INST_TINT: 1 }, { uniforms: shadowU, side: THREE.DoubleSide }),
    shadowInstCutout: make({ SHADOW_PASS: 1, INST_TINT: 1, CUTOUT: 1 }, { uniforms: shadowU, side: THREE.DoubleSide }),
  };
  mats.opaqueDetail.uniforms.uFade.value.set(34, 42);
  mats.cutoutDetail.uniforms.uFade.value.set(34, 42);
  // which shadow material goes with which gbuffer material
  mats.opaque.userData.shadow = mats.shadow; mats.opaqueDetail.userData.shadow = mats.shadow;
  mats.cutout.userData.shadow = mats.shadowCutout; mats.cutoutDetail.userData.shadow = mats.shadowCutout;
  mats.inst.userData.shadow = mats.shadowInst; mats.instCutout.userData.shadow = mats.shadowInstCutout;
  return mats;
}
