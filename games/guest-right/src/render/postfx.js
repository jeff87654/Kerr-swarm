// Fullscreen pass shaders: ambient occlusion, screen-space reflections, temporal anti-aliasing, bloom, exposure, the final grade.
import { GLSL_COMMON } from './glsl.js';

const HEAD = /* glsl */`
${GLSL_COMMON}
in vec2 vUv;
layout(location = 0) out vec4 outColor;
`;

export const SSAO_FRAG = HEAD + /* glsl */`
uniform highp sampler2D tDepth;
uniform highp sampler2D tNormal;
uniform mat4 uProjInv;
uniform mat3 uCamRotInv;      // render -> view
uniform vec2 uProjScale;      // (P00, P11)
uniform float uRadius;
uniform float uIntensity;
uniform float uFrame;
vec3 viewPos(vec2 uv) { float d = texture(tDepth, uv).r; vec4 p = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
void main() {
  float d = texture(tDepth, vUv).r;
  if (d >= 1.0) { outColor = vec4(1.0); return; }
  vec3 P = viewPos(vUv);
  vec3 N = normalize(uCamRotInv * texture(tNormal, vUv).xyz);
  float dist = -P.z;
  float rad = uRadius * clamp(dist * 0.35, 0.35, 2.5);          // wider occlusion further away
  vec2 ruv = rad * uProjScale * 0.5 / dist;
  ruv = min(ruv, vec2(0.12));
  float rot = ign(gl_FragCoord.xy + uFrame * 3.7) * 6.2831853;
  float sum = 0.0;
  const int NS = 11;
  for (int i = 0; i < NS; i++) {
    float t = (float(i) + 0.5) / float(NS);
    float ang = rot + float(i) * 2.399963;
    vec2 off = vec2(cos(ang), sin(ang)) * sqrt(t) * ruv;
    vec3 Q = viewPos(vUv + off);
    vec3 v = Q - P;
    float vv = dot(v, v), vn = dot(v, N);
    float fall = saturate(1.0 - vv / (rad * rad * 2.2));
    sum += max(vn - 0.015 - 0.004 * dist, 0.0) / (vv + 0.004) * fall;
  }
  float ao = saturate(1.0 - sum * rad * uIntensity / float(NS));
  outColor = vec4(ao, dist, 0.0, 1.0);
}
`;

export const SSAO_BLUR_FRAG = HEAD + /* glsl */`
uniform highp sampler2D tSrc;       // r = ao, g = view distance
uniform vec2 uTexel;
void main() {
  vec2 c = texture(tSrc, vUv).rg;
  float sum = c.r, w = 1.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    if (x == 0 && y == 0) continue;
    vec2 s = texture(tSrc, vUv + vec2(float(x), float(y)) * uTexel * 1.6).rg;
    float k = 1.0 / (1.0 + abs(s.g - c.g) * 14.0 / max(c.g * 0.2, 0.05));
    sum += s.r * k; w += k;
  }
  float ao = sum / w;
  outColor = vec4(ao * ao * (3.0 - 2.0 * ao) * 0.5 + ao * 0.5, c.g, 0.0, 1.0);
}
`;

export const SSR_FRAG = HEAD + /* glsl */`
uniform highp sampler2D tDepth;
uniform highp sampler2D tNormal;
uniform highp sampler2D tHist;
uniform mat4 uProj;
uniform mat4 uProjInv;
uniform mat3 uCamRotInv;
uniform mat4 uReprojView;     // current view-space position -> previous frame's clip space
uniform vec2 uZAB;            // distance = B / (ndcZ + A)
uniform float uFrame;
float distAt(vec2 uv) { return uZAB.y / (texture(tDepth, uv).r * 2.0 - 1.0 + uZAB.x); }
void main() {
  float d = texture(tDepth, vUv).r;
  vec4 g1 = texture(tNormal, vUv);
  float rough = g1.a;
  if (d >= 1.0 || rough > 0.62) { outColor = vec4(0.0); return; }
  vec4 pv = uProjInv * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  vec3 P = pv.xyz / pv.w;
  vec3 N = normalize(uCamRotInv * g1.xyz);
  vec3 V = normalize(P);
  float n1 = ign(gl_FragCoord.xy + uFrame * 7.31), n2 = ign(gl_FragCoord.yx * 1.37 + uFrame * 3.17);
  // jitter the normal by roughness: the temporal filter turns this into a glossy lobe
  vec3 jit = normalize(vec3(cos(n1 * 6.2832) * sqrt(n2), sin(n1 * 6.2832) * sqrt(n2), sqrt(1.0 - n2)) * 2.0 - vec3(0.0, 0.0, 1.0));
  vec3 Nr = normalize(N + jit * rough * rough * 1.4);
  vec3 R = reflect(V, Nr);
  if (dot(R, N) < 0.02) { outColor = vec4(0.0); return; }
  float dist0 = -P.z;
  float stepLen = max(0.05, dist0 * 0.03);
  float t = stepLen * (0.4 + n2);
  float prevT = 0.0; bool hit = false; vec2 huv = vec2(0.0); float ht = 0.0;
  vec3 P0 = P + N * (0.01 + dist0 * 0.002);
  for (int i = 0; i < 30; i++) {
    vec3 S = P0 + R * t;
    if (S.z > -0.05) break;
    vec4 c = uProj * vec4(S, 1.0);
    vec2 uv = c.xy / c.w * 0.5 + 0.5;
    if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) break;
    float sd = distAt(uv);
    float diff = -S.z - sd;
    if (diff > 0.0) {
      if (diff < stepLen * 2.5 + 0.25) {
        float lo = prevT, hi = t;
        for (int j = 0; j < 5; j++) {
          float m = 0.5 * (lo + hi);
          vec3 Sm = P0 + R * m; vec4 cm = uProj * vec4(Sm, 1.0); vec2 um = cm.xy / cm.w * 0.5 + 0.5;
          if (-Sm.z - distAt(um) > 0.0) hi = m; else lo = m;
        }
        ht = hi; vec3 Sh = P0 + R * hi; vec4 ch = uProj * vec4(Sh, 1.0); huv = ch.xy / ch.w * 0.5 + 0.5; hit = true;
      }
      break;
    }
    prevT = t; t += stepLen; stepLen *= 1.17;
  }
  if (!hit) { outColor = vec4(0.0); return; }
  vec3 Sh = P0 + R * ht;
  vec4 pc = uReprojView * vec4(Sh, 1.0);
  vec2 puv = pc.xy / pc.w * 0.5 + 0.5;
  if (pc.w <= 0.0 || puv.x < 0.0 || puv.y < 0.0 || puv.x > 1.0 || puv.y > 1.0) { outColor = vec4(0.0); return; }
  vec3 c = min(texture(tHist, puv).rgb, vec3(24.0));
  vec2 e = smoothstep(vec2(0.0), vec2(0.08), huv) * (1.0 - smoothstep(vec2(0.92), vec2(1.0), huv));
  float conf = e.x * e.y * (1.0 - smoothstep(0.55, 1.0, ht / 40.0)) * smoothstep(0.02, 0.2, dot(R, N));
  outColor = vec4(c, conf);
}
`;

export const TAA_FRAG = HEAD + /* glsl */`
uniform highp sampler2D tCur;
uniform highp sampler2D tHist;
uniform highp sampler2D tDepth;
uniform mat4 uReproj;         // current clip (jittered) -> previous clip
uniform vec2 uTexel;
uniform float uBlend;
vec3 toYCoCg(vec3 c) { return vec3(dot(c, vec3(0.25, 0.5, 0.25)), dot(c, vec3(0.5, 0.0, -0.5)), dot(c, vec3(-0.25, 0.5, -0.25))); }
vec3 fromYCoCg(vec3 c) { return vec3(c.x + c.y - c.z, c.x + c.z, c.x - c.y - c.z); }
vec3 tm(vec3 c) { return c / (1.0 + luma(c)); }
vec3 itm(vec3 c) { return c / max(1.0 - luma(c), 1e-4); }
void main() {
  // nearest depth in a cross, so thin edges carry their own motion
  float d = texture(tDepth, vUv).r; vec2 duv = vUv;
  for (int i = 0; i < 4; i++) {
    vec2 o = (i == 0 ? vec2(1, 0) : i == 1 ? vec2(-1, 0) : i == 2 ? vec2(0, 1) : vec2(0, -1)) * uTexel;
    float dd = texture(tDepth, vUv + o).r; if (dd < d) { d = dd; duv = vUv + o; }
  }
  vec4 pc = uReproj * vec4(duv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  vec2 puv = pc.xy / pc.w * 0.5 + 0.5 + (vUv - duv);
  vec3 cur = tm(texture(tCur, vUv).rgb);
  vec3 m1 = vec3(0.0), m2 = vec3(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 c = toYCoCg(tm(texture(tCur, vUv + vec2(float(x), float(y)) * uTexel).rgb));
    m1 += c; m2 += c * c;
  }
  m1 /= 9.0; m2 /= 9.0;
  vec3 sg = sqrt(max(m2 - m1 * m1, 0.0));
  float blend = uBlend;
  if (pc.w <= 0.0 || puv.x < 0.0 || puv.y < 0.0 || puv.x > 1.0 || puv.y > 1.0) blend = 1.0;
  vec3 hist = toYCoCg(tm(texture(tHist, puv).rgb));
  hist = clamp(hist, m1 - sg * 1.35, m1 + sg * 1.35);
  vec3 outc = mix(fromYCoCg(hist), cur, blend);
  outColor = vec4(max(itm(outc), 0.0), 1.0);
}
`;

export const BLOOM_DOWN_FRAG = HEAD + /* glsl */`
uniform highp sampler2D tSrc;
uniform vec2 uTexel;
uniform float uFirst;
void main() {
  vec2 t = uTexel;
  vec3 a = texture(tSrc, vUv + t * vec2(-2, 2)).rgb, b = texture(tSrc, vUv + t * vec2(0, 2)).rgb, c = texture(tSrc, vUv + t * vec2(2, 2)).rgb;
  vec3 d = texture(tSrc, vUv + t * vec2(-2, 0)).rgb, e = texture(tSrc, vUv).rgb, f = texture(tSrc, vUv + t * vec2(2, 0)).rgb;
  vec3 g = texture(tSrc, vUv + t * vec2(-2, -2)).rgb, h = texture(tSrc, vUv + t * vec2(0, -2)).rgb, i = texture(tSrc, vUv + t * vec2(2, -2)).rgb;
  vec3 j = texture(tSrc, vUv + t * vec2(-1, 1)).rgb, k = texture(tSrc, vUv + t * vec2(1, 1)).rgb, l = texture(tSrc, vUv + t * vec2(-1, -1)).rgb, m = texture(tSrc, vUv + t * vec2(1, -1)).rgb;
  vec3 col;
  if (uFirst > 0.5) {    // Karis average on the first step: stops single hot pixels from flickering
    vec3 g0 = (a + b + d + e) * 0.25, g1 = (b + c + e + f) * 0.25, g2 = (d + e + g + h) * 0.25, g3 = (e + f + h + i) * 0.25, g4 = (j + k + l + m) * 0.25;
    float w0 = 1.0 / (1.0 + luma(g0)), w1 = 1.0 / (1.0 + luma(g1)), w2 = 1.0 / (1.0 + luma(g2)), w3 = 1.0 / (1.0 + luma(g3)), w4 = 1.0 / (1.0 + luma(g4));
    col = (g0 * w0 * 0.125 + g1 * w1 * 0.125 + g2 * w2 * 0.125 + g3 * w3 * 0.125 + g4 * w4 * 0.5) / (0.125 * (w0 + w1 + w2 + w3) + 0.5 * w4);
  } else {
    col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  }
  outColor = vec4(max(col, 0.0), 1.0);
}
`;

export const BLOOM_UP_FRAG = HEAD + /* glsl */`
uniform highp sampler2D tSrc;      // the smaller mip
uniform highp sampler2D tBase;     // this level's downsample
uniform vec2 uTexel;
uniform float uRadius;
void main() {
  vec2 t = uTexel * uRadius;
  vec3 s = texture(tSrc, vUv).rgb * 4.0;
  s += (texture(tSrc, vUv + vec2(t.x, 0)).rgb + texture(tSrc, vUv - vec2(t.x, 0)).rgb + texture(tSrc, vUv + vec2(0, t.y)).rgb + texture(tSrc, vUv - vec2(0, t.y)).rgb) * 2.0;
  s += texture(tSrc, vUv + t).rgb + texture(tSrc, vUv - t).rgb + texture(tSrc, vUv + vec2(t.x, -t.y)).rgb + texture(tSrc, vUv + vec2(-t.x, t.y)).rgb;
  outColor = vec4(texture(tBase, vUv).rgb + s / 16.0, 1.0);
}
`;

export const EXPOSURE_FRAG = HEAD + /* glsl */`
uniform highp sampler2D tSrc;      // a small blurred copy of the frame
uniform highp sampler2D tPrev;     // last frame's adapted luminance (1x1)
uniform float uRate;               // 0..1 this frame
void main() {
  float sum = 0.0, w = 0.0;
  for (int y = 0; y < 6; y++) for (int x = 0; x < 8; x++) {
    vec2 uv = (vec2(float(x), float(y)) + 0.5) / vec2(8.0, 6.0);
    float k = 1.0 - 0.75 * length(uv - vec2(0.5, 0.45));       // centre-weighted
    float l = luma(texture(tSrc, uv).rgb);
    sum += log(max(l, 1e-4)) * k; w += k;
  }
  float cur = exp(sum / w);
  float prev = texture(tPrev, vec2(0.5)).r;
  if (!(prev > 0.0)) prev = cur;
  outColor = vec4(mix(prev, cur, uRate), 0.0, 0.0, 1.0);
}
`;

export const FINAL_FRAG = HEAD + /* glsl */`
uniform highp sampler2D tColor;
uniform highp sampler2D tBloom;
uniform highp sampler2D tExposure;
uniform vec2 uTexel;
uniform float uBloom;
uniform float uExposure;       // manual scale
uniform vec3 uAuto;            // (key, min scale, max scale)
uniform float uSharp;
uniform float uTime;
uniform vec4 uGrade;           // (contrast, saturation, warmth, vignette)
uniform float uFadeBlack;
vec3 agxCurve(vec3 x) { vec3 x2 = x * x; vec3 x4 = x2 * x2; return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232; }
vec3 agx(vec3 v) {
  const mat3 m = mat3(0.842479062253094, 0.0423282422610123, 0.0423756549057051, 0.0784335999999992, 0.878468636469772, 0.0784336, 0.0792237451477643, 0.0791661274605434, 0.879142973793104);
  const float minEv = -12.47393, maxEv = 4.026069;
  v = m * v;
  v = clamp(log2(max(v, 1e-10)), minEv, maxEv);
  v = (v - minEv) / (maxEv - minEv);
  return agxCurve(v);
}
vec3 agxOut(vec3 v) {
  const mat3 mi = mat3(1.19687900512017, -0.0528968517574562, -0.0529716355144438, -0.0980208811401368, 1.15190312990417, -0.0980434501171241, -0.0990297440797205, -0.0989611768448433, 1.15107367264116);
  return mi * v;
}
void main() {
  vec3 c = texture(tColor, vUv).rgb;
  if (uSharp > 0.0) {
    vec3 n = texture(tColor, vUv + vec2(uTexel.x, 0.0)).rgb + texture(tColor, vUv - vec2(uTexel.x, 0.0)).rgb + texture(tColor, vUv + vec2(0.0, uTexel.y)).rgb + texture(tColor, vUv - vec2(0.0, uTexel.y)).rgb;
    c = max(c + (c - n * 0.25) * uSharp, 0.0);
  }
  vec3 bloom = texture(tBloom, vUv).rgb;
  c = mix(c, bloom, uBloom);
  float adapted = texture(tExposure, vec2(0.5)).r;
  float ex = uExposure * clamp(uAuto.x / max(adapted, 1e-4), uAuto.y, uAuto.z);
  c *= ex;
  // warmth: a gentle white-balance push
  c *= mix(vec3(1.0), vec3(1.06, 1.0, 0.93), uGrade.z);
  c = agx(c);
  c = pow(max(c, 0.0), vec3(uGrade.x));
  float l = luma(c);
  c = l + (c - l) * uGrade.y;
  c = agxOut(c);
  vec2 q = vUv - 0.5;
  float vig = 1.0 - uGrade.w * smoothstep(0.25, 0.95, length(q * vec2(1.0, 0.82)) * 1.25);
  c *= vig;
  float gr = hash13(vec3(gl_FragCoord.xy, floor(uTime * 24.0))) - 0.5;
  c += gr * (0.022 * (1.0 - smoothstep(0.0, 0.8, luma(c))) + 0.004);
  c *= 1.0 - uFadeBlack;
  c += (hash12(gl_FragCoord.xy + 0.37) - 0.5) / 255.0;
  outColor = vec4(saturate(c), 1.0);
}
`;

export const COPY_FRAG = HEAD + /* glsl */`
uniform highp sampler2D tSrc;
void main() { outColor = texture(tSrc, vUv); }
`;
