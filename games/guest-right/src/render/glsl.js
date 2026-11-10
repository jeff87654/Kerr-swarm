// Shared GLSL: bending flat frames into render space, hashes and noise, colour helpers, the BRDF.

export const GLSL_COMMON = /* glsl */`
precision highp float;
precision highp int;
#define PI 3.14159265359
#define saturate(x) clamp(x, 0.0, 1.0)

float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3) { p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
vec3 hash33(vec3 p3) { p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yxx) * p3.zyx); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
}
float vnoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y);
  float b = mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y);
  return mix(a, b, f.z);
}
// interleaved gradient noise (good with temporal accumulation)
float ign(vec2 px) { return fract(52.9829189 * fract(dot(px, vec2(0.06711056, 0.00583715)))); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec3 srgbToLin(vec3 c) { return pow(c, vec3(2.2)); }
vec3 linToSrgb(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }
`;

// Vertex-side: flat frame -> render space. The per-mesh frame row rides in the bottom row of modelMatrix:
//   m[0][3] = dTheta, m[1][3] = dRho (anchor.rho - rho at the mesh origin), m[2][3] = dZ, all relative to the camera anchor,
//   and m[3][3] = rho0 of the frame. (rho0 sits on the diagonal so the matrix's determinant stays positive: three.js flips
//   the winding of meshes whose determinant is negative. For the same reason a mesh's own matrix must not translate; move its origin.)
export const GLSL_BEND = /* glsl */`
uniform float uAnchorRho;
vec4 frameRow(mat4 m) { return vec4(m[0][3], m[3][3], m[1][3], m[2][3]); }      // (dTheta, rho0, dRho, dZ)
mat4 affineOf(mat4 m) { m[0][3] = 0.0; m[1][3] = 0.0; m[2][3] = 0.0; m[3][3] = 1.0; return m; }
vec3 bendPos(vec3 p, vec4 fr, out float th) {
  th = fr.x + p.x / fr.y;
  float rho = uAnchorRho - fr.z - p.y;
  float sh = sin(0.5 * th);
  return vec3(rho * sin(th), fr.z + p.y + rho * 2.0 * sh * sh, fr.w + p.z);
}
vec3 bendDir(vec3 d, float th) { float s = sin(th), c = cos(th); return vec3(d.x * c - d.y * s, d.x * s + d.y * c, d.z); }
`;

// Fragment-side: where is this pixel in the drum (relative to the anchor)?
export const GLSL_CYL = /* glsl */`
uniform float uAnchorRho;
// returns (dTheta [rad], rho [m], dz [m]) relative to the camera anchor
vec3 renderToCyl(vec3 p) { float a = uAnchorRho - p.y; return vec3(atan(p.x, a), length(vec2(p.x, a)), p.z); }
vec3 upAt(float dTheta) { return vec3(-sin(dTheta), cos(dTheta), 0.0); }
`;

export const GLSL_BRDF = /* glsl */`
float D_GGX(float NoH, float a) { float a2 = a * a; float d = (NoH * a2 - NoH) * NoH + 1.0; return a2 / (PI * d * d + 1e-7); }
float V_SmithGGX(float NoV, float NoL, float a) {
  float a2 = a * a;
  float gv = NoL * sqrt(NoV * NoV * (1.0 - a2) + a2);
  float gl = NoV * sqrt(NoL * NoL * (1.0 - a2) + a2);
  return 0.5 / (gv + gl + 1e-5);
}
vec3 F_Schlick(vec3 f0, float VoH) { float f = pow(1.0 - VoH, 5.0); return f0 + (1.0 - f0) * f; }
// Environment BRDF approximation (Karis, mobile)
vec3 envBRDF(vec3 f0, float rough, float NoV) {
  const vec4 c0 = vec4(-1.0, -0.0275, -0.572, 0.022);
  const vec4 c1 = vec4(1.0, 0.0425, 1.04, -0.04);
  vec4 r = rough * c0 + c1;
  float a004 = min(r.x * r.x, exp2(-9.28 * NoV)) * r.x + r.y;
  vec2 ab = vec2(-1.04, 1.04) * a004 + r.zw;
  return f0 * ab.x + ab.y;
}
`;

// One fullscreen triangle.
export const VERT_FULLSCREEN = /* glsl */`
in vec3 position;
out vec2 vUv;
void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
