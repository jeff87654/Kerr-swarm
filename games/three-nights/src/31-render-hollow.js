/* ---------- The Hollow: a ray-traced view inside a nation drum's open core ---------- */
"use strict";

const HOLLOW_FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos, uCamF, uCamU, uCamR;
uniform float uTanHalf;
uniform vec4 uSun;     // palette rgb, intensity
uniform vec4 uLake;    // phi, z, half-size along s, half-size along z
uniform vec4 uLand;    // woods, orchard, squares, meadow
uniform vec4 uLand2;   // pavilions, terrace gardens, swell, crowds
uniform vec4 uMisc;    // seed, hue, flowers, dimwood
uniform float uPix;
uniform float uExposure;
uniform float uSpindleOpen;

const float R = 1500.0;
const float L = 3750.0;
const float PI = 3.14159265;
const float CIRC = 9424.778;
const float LINE0 = 450.0;
const float LINE1 = 3300.0;

float hash13(vec3 p3) { p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f);
  float a = hash13(i), b = hash13(i + vec3(1.0, 0.0, 0.0)), c = hash13(i + vec3(0.0, 1.0, 0.0)), d = hash13(i + vec3(1.0, 1.0, 0.0));
  float e = hash13(i + vec3(0.0, 0.0, 1.0)), g = hash13(i + vec3(1.0, 0.0, 1.0)), h = hash13(i + vec3(0.0, 1.0, 1.0)), k = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z);
}
float fbm3(vec3 p) {
  float s = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { s += a * vnoise3(p); p = p * 2.07 + vec3(17.1, 9.3, 4.7); a *= 0.5; }
  return s / 0.9375;
}
float fbm2o(vec3 p) { return (vnoise3(p) * 0.5 + vnoise3(p * 2.07 + 13.0) * 0.25) / 0.75; }
float fbmL(vec3 p, int oct) {
  float s = 0.0; float a = 0.5; float n = 0.0;
  for (int i = 0; i < 4; i++) {
    if (i >= oct) break;
    s += a * vnoise3(p); n += a; p = p * 2.07 + vec3(17.1, 9.3, 4.7); a *= 0.5;
  }
  return s / n;
}

// Land use at a point on the floor. foot = metres per pixel there (detail fades as it grows).
vec3 landBase(vec3 P, float foot, out float isWood, out float isLake, out float isOrch, out float isMeadow, out float isSquare) {
  vec3 sd = vec3(uMisc.x * 1.7, uMisc.x * 0.9, uMisc.x * 2.3);
  vec3 q = P * 0.0011 + sd;
  int oct = foot > 40.0 ? 2 : foot > 10.0 ? 3 : 4;
  vec3 warp = foot > 40.0 ? vec3(vnoise3(q * 1.7 + 3.0), vnoise3(q * 1.7 + 7.0), vnoise3(q * 1.7 + 11.0)) - 0.5 : vec3(fbm2o(q * 1.7 + 3.0), fbm2o(q * 1.7 + 7.0), fbm2o(q * 1.7 + 11.0)) - 0.5;
  float phi = atan(P.y, P.x);
  float s = phi * R;
  // woods: big regions with ragged, copse-like edges
  float nW = fbmL(q + warp * 0.9, oct);
  float rag = foot > 40.0 ? 0.5 : vnoise3(P * 0.011 + sd) * 0.6 + vnoise3(P * 0.032 + sd) * 0.4;
  float wthr = mix(0.70, 0.30, uLand.x);
  float wv = nW + (rag - 0.5) * 0.13;
  isWood = smoothstep(wthr, wthr + 0.012, wv);
  // single trees and small clumps out on the lawns, thicker near the woods
  float nearWood = smoothstep(wthr - 0.12, wthr, wv) * (1.0 - isWood);
  float treeDens = 0.05 + 0.35 * nearWood;
  if (foot < 7.0) {
    vec2 tc = vec2(s / (CIRC / 420.0), P.z / 22.0);
    vec2 ti = floor(tc); vec2 tf = fract(tc) - 0.5;
    float th = hash12(ti + 7.0 + uMisc.x);
    vec2 tj = vec2(hash12(ti + 1.3), hash12(ti + 2.9)) - 0.5;
    float rad = mix(0.12, 0.24, hash12(ti + 4.4));
    float tree = (1.0 - smoothstep(rad - 0.02, rad + 0.02 + foot / 22.0, length((tf - tj * 0.5) * vec2(CIRC / 420.0 / 22.0, 1.0)))) * step(th, treeDens);
    isWood = max(isWood, tree * (1.0 - smoothstep(3.0, 7.0, foot)));
  }
  isOrch = (1.0 - isWood) * smoothstep(mix(0.72, 0.42, uLand.y), mix(0.72, 0.42, uLand.y) + 0.02, fbmL(q * 1.35 + 31.0 + warp * 0.6, oct));
  isMeadow = (1.0 - isWood) * (1.0 - isOrch) * smoothstep(mix(0.68, 0.36, uLand.w), mix(0.68, 0.36, uLand.w) + 0.03, fbmL(q * 0.8 + 57.0, oct));
  isSquare = (1.0 - isWood) * smoothstep(mix(0.80, 0.62, uLand.z), mix(0.80, 0.62, uLand.z) + 0.01, fbmL(q * 2.4 + 91.0, oct));
  float garden = (1.0 - isWood) * (1.0 - isOrch) * (1.0 - isSquare) * smoothstep(0.63, 0.65, fbmL(q * 1.6 + 133.0, oct));
  // lake: ellipse in (s, z) with a ragged shore
  float ds = mod(s - uLake.x * R + CIRC * 0.5, CIRC) - CIRC * 0.5;
  float dz = P.z - uLake.y;
  float shore = (vnoise3(P * 0.004 + 5.0) - 0.5) * 0.35 + (vnoise3(P * 0.02 + 9.0) - 0.5) * 0.05;
  float e = (ds * ds) / max(uLake.z * uLake.z, 1.0) + (dz * dz) / max(uLake.w * uLake.w, 1.0);
  isLake = uLake.z > 1.0 ? 1.0 - smoothstep(1.0 + shore - 0.015, 1.0 + shore, e) : 0.0;
  // colours
  float tint = vnoise3(P * 0.0021 + 71.0);
  float hue = clamp(uMisc.y, -1.0, 1.0);
  vec3 lawn = mix(vec3(0.34, 0.45, 0.22), vec3(0.42, 0.47, 0.25), tint);
  lawn = mix(lawn, vec3(0.30, 0.43, 0.28), max(hue, 0.0) * 0.5);
  lawn = mix(lawn, vec3(0.44, 0.46, 0.24), max(-hue, 0.0) * 0.4);
  float wt = vnoise3(P * 0.05 + 5.0);
  vec3 wood = mix(vec3(0.12, 0.21, 0.11), vec3(0.20, 0.30, 0.15), wt * (1.0 - smoothstep(4.0, 30.0, foot)) + 0.25 * smoothstep(4.0, 30.0, foot));
  wood = mix(wood, vec3(0.08, 0.14, 0.09), uMisc.w);
  vec3 orch = vec3(0.28, 0.40, 0.25);
  if (foot < 6.0) {
    float row = abs(fract(s / (CIRC / 1200.0)) - 0.5);
    float tr2 = abs(fract(P.z / 6.0) - 0.5);
    float dot2 = 1.0 - smoothstep(0.18, 0.30, length(vec2(row, tr2)));
    orch = mix(vec3(0.42, 0.45, 0.25), vec3(0.22, 0.36, 0.20), mix(dot2, 0.5, smoothstep(1.0, 6.0, foot)));
  }
  vec3 mead = mix(vec3(0.52, 0.52, 0.30), vec3(0.58, 0.52, 0.32), tint);
  if (uMisc.z > 0.5 && foot < 4.0) {
    float fl = hash12(floor(vec2(s, P.z) / 1.3) + 17.0);
    mead = mix(mead, mix(vec3(0.85, 0.55, 0.62), vec3(0.95, 0.85, 0.45), hash12(floor(vec2(s, P.z) / 1.3) + 3.0)), step(0.86, fl) * (1.0 - smoothstep(1.0, 4.0, foot)));
  }
  // allotments: a patchwork of crops in plots, averaging out with distance
  vec3 gardenCol = vec3(0.38, 0.41, 0.22);
  if (foot < 5.0) {
    vec2 gc = vec2(s / (CIRC / 520.0), P.z / 12.0);
    gc.x += step(1.0, mod(floor(gc.y), 2.0)) * 0.5;
    vec2 gi = floor(gc);
    float gh = hash12(gi + 61.0 + uMisc.x);
    vec3 crop = gh < 0.34 ? vec3(0.31, 0.45, 0.21) : gh < 0.56 ? vec3(0.42, 0.47, 0.23) : gh < 0.68 ? vec3(0.42, 0.35, 0.24) : gh < 0.84 ? vec3(0.26, 0.38, 0.22) : gh < 0.92 ? vec3(0.38, 0.34, 0.33) : vec3(0.56, 0.52, 0.30);
    float edge = smoothstep(0.0, 0.08, min(min(fract(gc.x), 1.0 - fract(gc.x)), min(fract(gc.y), 1.0 - fract(gc.y))));
    crop = mix(vec3(0.55, 0.52, 0.44), crop, mix(edge, 1.0, smoothstep(1.0, 4.0, foot)));
    gardenCol = mix(crop, gardenCol, smoothstep(1.2, 5.0, foot));
  }
  vec3 sq = vec3(0.71, 0.68, 0.61);
  if (foot < 2.5) { vec2 pv = fract(vec2(s, P.z) / 3.0); sq *= 0.93 + 0.07 * step(0.06, min(pv.x, pv.y)); }
  vec3 col = lawn;
  // shade at the woods' edge
  col *= 1.0 - 0.18 * nearWood;
  col = mix(col, mead, isMeadow);
  col = mix(col, gardenCol, garden);
  col = mix(col, orch, isOrch);
  col = mix(col, wood, isWood);
  col = mix(col, sq, isSquare * 0.85);
  col = mix(col, vec3(0.08, 0.16, 0.20), isLake);
  return col;
}

// How the sunline lights a point on the floor at height z along the axis
float floorLight(float z) {
  float dEnd = min(z, L - z);
  return mix(0.36, 1.0, smoothstep(0.0, 800.0, dEnd));
}

vec3 sunCol() { return uSun.rgb; }

// Glow of the sunline and night lamps seen along a ray, up to distance tmax
vec3 lineGlow(vec3 o, vec3 d, float tmax, out float core) {
  core = 0.0;
  float dxy2 = d.x * d.x + d.y * d.y;
  if (dxy2 < 1e-6) return vec3(0.0);
  float ts = -(o.x * d.x + o.y * d.y) / dxy2;
  if (ts < 0.0 || ts > tmax) return vec3(0.0);
  float rho = abs(o.x * d.y - o.y * d.x) / sqrt(dxy2);
  float zc = o.z + ts * d.z;
  float onLine = smoothstep(LINE0 - 5.0, LINE0 + 5.0, zc) * (1.0 - smoothstep(LINE1 - 5.0, LINE1 + 5.0, zc));
  float onSpar = step(0.0, zc) * step(zc, L);
  float foot = max(ts * uPix, 0.05);
  float width = max(0.6, foot * 0.7);
  float I = uSun.w;
  float c = exp(-rho * rho / (width * width));
  core = c * onLine * I;
  float halo = I * onLine * (0.9 / (1.0 + rho * rho / (2500.0)) + 3.0 / (1.0 + rho * rho / 60.0));
  vec3 col = sunCol();
  vec3 g = col * (core * 40.0 + halo * 0.35);
  // the dark spar (and the unlit line at night)
  float spar = exp(-rho * rho / (max(0.3, foot * 0.6) * max(0.3, foot * 0.6))) * onSpar * (1.0 - I) * 0.2;
  g -= vec3(spar) * 0.0;
  return g;
}

// End walls: concentric terraces climbing toward the axis.
const int K = 9;
float depthOf(int k) { return 360.0 - float(k) * 38.0; }  // how far terrace k stands out from the wall
float rOf(int k) { return R - float(k) * 150.0; }          // terrace k spans r in [rOf(k+1), rOf(k)]

// Returns t of nearest hit on end wall structure at the wall z=wz facing direction sgn (+1 for z=0 wall)
float hitEndWall(vec3 o, vec3 d, float wz, float sgn, out vec3 nrm, out float kind, out float tk) {
  float best = 1e9; nrm = vec3(0.0); kind = 0.0; tk = 0.0;
  // risers: planes at z' = depth(k), r in [rOf(k+1), rOf(k)]
  for (int k = 0; k < K; k++) {
    float zp = wz + sgn * depthOf(k);
    if (abs(d.z) > 1e-6) {
      float t = (zp - o.z) / d.z;
      if (t > 0.5 && t < best) {
        vec3 p = o + t * d;
        float r = length(p.xy);
        if (r <= rOf(k) && r >= rOf(k + 1)) { best = t; nrm = vec3(0.0, 0.0, sgn); kind = 1.0; tk = float(k); }
      }
    }
    // terrace tops: cylinder r = rOf(k+1), z' in [depth(k+1), depth(k)]
    float rr = rOf(k + 1);
    float a = d.x * d.x + d.y * d.y;
    if (a > 1e-8) {
      float b = o.x * d.x + o.y * d.y;
      float c = o.x * o.x + o.y * o.y - rr * rr;
      float disc = b * b - a * c;
      if (disc > 0.0) {
        float sq = sqrt(disc);
        float t1 = (-b - sq) / a;
        float t2 = (-b + sq) / a;
        for (int j = 0; j < 2; j++) {
          float t = j == 0 ? t1 : t2;
          if (t > 0.5 && t < best) {
            vec3 p = o + t * d;
            float zr = (p.z - wz) * sgn;
            float zlo = k + 1 < K ? depthOf(k + 1) : 0.0;
            if (zr >= zlo && zr <= depthOf(k)) {
              vec3 n = -normalize(vec3(p.xy, 0.0));
              if (dot(n, d) < 0.0) { best = t; nrm = n; kind = 2.0; tk = float(k); }
            }
          }
        }
      }
    }
  }
  // back wall above the top terrace
  if (abs(d.z) > 1e-6) {
    float t = (wz - o.z) / d.z;
    if (t > 0.5 && t < best) {
      vec3 p = o + t * d;
      if (length(p.xy) < rOf(K)) { best = t; nrm = vec3(0.0, 0.0, sgn); kind = 3.0; tk = 9.0; }
    }
  }
  return best;
}

float raycastCyl(vec3 o, vec3 d) {
  float a = d.x * d.x + d.y * d.y;
  if (a < 1e-9) return 1e9;
  float b = o.x * d.x + o.y * d.y;
  float c = o.x * o.x + o.y * o.y - R * R;
  float disc = b * b - a * c;
  if (disc < 0.0) return 1e9;
  return (-b + sqrt(disc)) / a;
}

vec3 tonemap(vec3 x) {
  x *= uExposure;
  vec3 a = x * (2.51 * x + 0.03);
  vec3 b = x * (2.43 * x + 0.59) + 0.14;
  return clamp(a / b, 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 d = normalize(uCamF + uv.x * 2.0 * uTanHalf * uCamR + uv.y * 2.0 * uTanHalf * uCamU);
  vec3 o = uCamPos;
  float I = uSun.w;
  float night = 1.0 - smoothstep(0.0, 0.25, I);
  vec3 sun = sunCol();
  vec3 amb = vec3(0.006, 0.008, 0.013) + sun * 0.18 * I;

  float tc = raycastCyl(o, d);
  vec3 nE0, nE1; float kE0, kE1, tk0, tk1;
  float te0 = hitEndWall(o, d, 0.0, 1.0, nE0, kE0, tk0);
  float te1 = hitEndWall(o, d, L, -1.0, nE1, kE1, tk1);
  float t = tc; int what = 0;
  vec3 nrm = vec3(0.0); float kind = 0.0; float tk = 0.0;
  if (te0 < t) { t = te0; what = 1; nrm = nE0; kind = kE0; tk = tk0; }
  if (te1 < t) { t = te1; what = 1; nrm = nE1; kind = kE1; tk = tk1; }

  vec3 P = o + t * d;
  vec3 nFloor = -normalize(vec3(P.xy, 0.0));
  vec3 nHit = what == 0 ? nFloor : nrm;
  float foot = t * uPix / max(abs(dot(d, nHit)), 0.12);
  vec3 col = vec3(0.0);
  vec3 emis = vec3(0.0);

  if (what == 0) {
    // ---- the floor ----
    float isW, isL, isO, isM, isS;
    vec3 base = landBase(P, foot, isW, isL, isO, isM, isS);
    float phi = atan(P.y, P.x);
    float s = phi * R;
    float dsl = mod(s - uLake.x * R + CIRC * 0.5, CIRC) - CIRC * 0.5;
    float dzl = P.z - uLake.y;
    float e_lake = (dsl * dsl) / max(uLake.z * uLake.z, 1.0) + (dzl * dzl) / max(uLake.w * uLake.w, 1.0);
    float detail = 1.0 - smoothstep(2.5, 9.0, foot);
    float mid = 1.0 - smoothstep(12.0, 40.0, foot);
    // canopy texture in the woods, near and middle distance
    if (isW > 0.0 && foot < 30.0) {
      vec2 cc2 = vec2(s / (CIRC / 1400.0), P.z / 6.7);
      vec2 ci2 = floor(cc2); vec2 cf2 = fract(cc2) - 0.5;
      vec2 j2 = vec2(hash12(ci2 + 3.1), hash12(ci2 + 7.7)) - 0.5;
      float crown = 1.0 - smoothstep(0.2, 0.5, length(cf2 - j2 * 0.4));
      float shade = mix(0.72, 1.18, crown * hash12(ci2 + 11.0));
      base = mix(base, base * shade, isW * (1.0 - smoothstep(4.0, 30.0, foot)));
    }
    // a few avenues: along the axis and spinward, gravel
    float wig = (vnoise3(P * 0.004 + 21.0) - 0.5) * 70.0;
    float pA = abs(mod(s + wig + CIRC, CIRC / 12.0) - CIRC / 24.0);
    float pZ = abs(mod(P.z + wig + 156.0, 625.0) - 312.5);
    float pathW = 3.0;
    float cover = clamp(pathW / max(foot, 0.001), 0.0, 1.0);
    float path = (1.0 - smoothstep(pathW * 0.5, pathW * 0.5 + max(foot, 0.5), min(pA, pZ))) * cover;
    path *= (1.0 - isL) * (1.0 - isW * 0.8);
    base = mix(base, vec3(0.60, 0.57, 0.49), path * 0.7);
    // cab pavilions among the trees
    vec2 pc = vec2(s / (CIRC / 32.0), P.z / 300.0);
    vec2 pci = floor(pc); vec2 pcf = fract(pc);
    float ph = hash12(pci + 19.0 + uMisc.x);
    vec2 ppos = vec2(0.2, 0.2) + 0.6 * vec2(hash12(pci + 2.0), hash12(pci + 5.0));
    vec2 pd = abs((pcf - ppos) * vec2(CIRC / 32.0, 300.0));
    float pav = step(ph, uLand2.x * 0.5) * (1.0 - smoothstep(7.0, 7.0 + max(foot, 0.5), pd.x)) * (1.0 - smoothstep(5.0, 5.0 + max(foot, 0.5), pd.y)) * (1.0 - isL);
    base = mix(base, vec3(0.72, 0.68, 0.62), pav * 0.55 * clamp(14.0 / max(foot, 1.0), 0.0, 1.0));
    // people near the shore and on the squares (near field only)
    if (detail > 0.0 && uLand2.w > 0.0) {
      vec2 cc = floor(vec2(s, P.z) / 1.6);
      float hc = hash12(cc + 51.0);
      float nearLake = uLake.z > 1.0 ? (1.0 - smoothstep(0.0, 0.45, abs(sqrt(max(e_lake, 0.0)) - 1.08))) : 0.0;
      float dens = uLand2.w * (isS * 0.05 + nearLake * 0.06);
      vec3 shirt = mix(vec3(0.75, 0.70, 0.62), 0.45 + 0.35 * cos(6.28 * (hc * vec3(1.0, 1.3, 1.7) + vec3(0.0, 0.33, 0.67))), 0.6);
      base = mix(base, shirt, step(1.0 - dens, hc) * detail * (1.0 - isL));
    }
    float lightHere = floorLight(P.z);
    vec3 lit = base * (sun * I * lightHere * 1.0 + amb);
    // the lake: mirror the far bank overhead and the sunline
    if (isL > 0.0) {
      vec3 n = -normalize(vec3(P.xy, 0.0));
      float sw = uLand2.z;
      float wave = sin(P.z * 0.32 - uTime * 1.23) * (0.02 + 0.10 * sw) + sin(s * 0.11 + uTime * 0.7) * 0.02 + (vnoise3(P * 0.08 + vec3(0.0, 0.0, uTime * 0.6)) - 0.5) * 0.06;
      vec3 n0 = n;
      vec3 tz = vec3(0.0, 0.0, 1.0);
      n = normalize(n + tz * wave * 0.5);
      vec3 rd = reflect(d, n);
      if (dot(rd, n0) < 0.02) rd = normalize(rd - 2.0 * (dot(rd, n0) - 0.02) * n0);
      float tr = raycastCyl(P + n * 0.5, rd);
      float twall = rd.z > 1e-4 ? (L - 300.0 - P.z) / rd.z : rd.z < -1e-4 ? (300.0 - P.z) / rd.z : 1e9;
      vec3 rcol;
      if (twall > 0.0 && twall < tr) {
        vec3 WP = P + rd * twall;
        float rr2 = length(WP.xy);
        float bands = 0.85 + 0.15 * step(0.5, fract(rr2 / 150.0));
        vec3 wallc = mix(vec3(0.62, 0.57, 0.49), vec3(0.30, 0.42, 0.22), 0.25) * bands;
        rcol = wallc * (sun * I * 0.3 + amb) + vec3(1.0, 0.74, 0.46) * 0.03 * night * bands;
      } else {
        vec3 RP = P + rd * min(tr, 6000.0);
        float a1, a2, a3, a4, a5;
        vec3 rb = landBase(RP, 60.0, a1, a2, a3, a4, a5);
        rcol = rb * (sun * I * floorLight(clamp(RP.z, 0.0, L)) + amb);
      }
      float rcore;
      vec3 rg = lineGlow(P + n * 0.5, rd, tr, rcore);
      float fres = 0.04 + 0.96 * pow(1.0 - max(dot(-d, n), 0.0), 5.0);
      vec3 water = vec3(0.15, 0.26, 0.29) * (sun * I + amb);
      vec3 lakeCol = mix(water, rcol, 0.55 + 0.4 * fres) + rg * 2.2;
      // swell crests
      float crest = smoothstep(0.88, 0.98, sin(P.z * 0.32 - uTime * 1.23)) * sw;
      lakeCol += vec3(0.6) * crest * I * 0.25;
      lit = mix(lit, lakeCol, isL);
    }
    col = lit;
    // night lamps: pavilions glow, path lamps
    if (night > 0.0) {
      vec2 lc = floor(vec2(s, P.z) / 60.0);
      float lh = hash12(lc + 77.0);
      vec2 lp = (fract(vec2(s, P.z) / 60.0) - 0.5) * 60.0;
      float rad = 0.8 + foot * 0.7;
      float lampDot = (1.0 - smoothstep(rad * 0.5, rad, length(lp))) * step(0.82, lh) * (1.0 - isL) * (1.0 - isW * 0.8);
      float energy = clamp(1.6 / (rad * rad), 0.0, 1.0);
      emis += vec3(1.0, 0.70, 0.40) * (pav * 0.02 + lampDot * energy * 0.6) * night;
    }
  } else {
    // ---- end walls ----
    float r = length(P.xy);
    float phi = atan(P.y, P.x);
    float lightHere = 0.30;
    if (kind == 1.0) {
      // riser: decks of flats every 4 m, windows, planted edge at the top
      float rows = r / 4.0;
      float cols = phi * r / 5.0;
      vec2 wc = vec2(floor(cols), floor(rows));
      vec2 wf = vec2(fract(cols), fract(rows));
      float litw = step(0.62, hash12(wc + tk * 7.0));
      float win = step(0.2, wf.x) * step(wf.x, 0.8) * step(0.35, wf.y) * step(wf.y, 0.85);
      float far = smoothstep(0.8, 3.0, foot);
      float band = hash12(vec2(floor(r / 24.0), tk));
      float sector = hash12(vec2(floor((phi + PI) * 30.0 / PI), tk + 3.0));
      vec3 stone = mix(vec3(0.62, 0.57, 0.49), vec3(0.72, 0.66, 0.56), band);
      stone = mix(stone, vec3(0.44, 0.48, 0.50), step(0.75, sector) * 0.35);
      // hanging gardens spill over the lip of some terraces
      float vines = smoothstep(0.55, 0.9, vnoise3(vec3(phi * 40.0, r * 0.02, tk)));
      float nearTop = 1.0 - smoothstep(0.0, 70.0, rOf(int(tk)) - r);
      stone = mix(stone, vec3(0.20, 0.31, 0.16), vines * nearTop * 0.8);
      // lift cores: pale vertical stripes
      float core = step(0.985, fract((phi + PI) * 48.0 / PI + tk * 0.37));
      stone = mix(stone, vec3(0.70, 0.68, 0.62), core * 0.6);
      stone *= 0.94 + 0.12 * hash12(vec2(floor((phi + PI) * 90.0 / PI), floor(r / 12.0)));
      vec3 nearc = mix(stone, vec3(0.20, 0.22, 0.24), win * 0.75);
      vec3 farc = mix(stone, vec3(0.20, 0.21, 0.22), 0.26);
      vec3 wcol = mix(nearc, farc, far);
      col = wcol * (sun * I * lightHere * 0.9 + amb);
      float fine = hash12(vec2(floor((phi + PI) * 150.0 / PI), floor(r / 16.0) + tk * 31.0));
      float avgWin = 0.38 * 0.3 * (0.55 + 0.5 * fine + 0.25 * sector);
      float glow = mix(win * litw, avgWin, far);
      emis += vec3(1.0, 0.74, 0.46) * glow * (0.01 + 0.10 * night);
      emis += sun * I * 0.25 * step(0.985, hash12(wc * 1.3 + 7.0)) * win * (1.0 - far);
      // terrace edge: planters along the lip
      float edge = 1.0 - smoothstep(0.0, max(6.0, foot * 1.5), rOf(int(tk)) - r);
      col = mix(col, vec3(0.24, 0.36, 0.18) * (sun * I * lightHere + amb), edge * 0.85);
    } else if (kind == 2.0) {
      // terrace top: gardens
      float g = vnoise3(P * 0.02 + 3.0);
      vec3 garden = mix(vec3(0.27, 0.42, 0.20), vec3(0.45, 0.48, 0.25), g);
      garden = mix(vec3(0.62, 0.60, 0.54), garden, uLand2.y * (0.6 + 0.4 * smoothstep(3.0, 9.0, tk)));
      float topLight = mix(0.42, 0.18, tk / 9.0);
      col = garden * (sun * I * topLight + amb * 1.4);
      vec2 lc = floor(vec2(phi * r, P.z) / 25.0);
      float lh = hash12(lc + tk);
      vec2 lp2 = (fract(vec2(phi * r, P.z) / 25.0) - 0.5) * 25.0;
      float rad2 = 0.8 + foot * 0.7;
      emis += vec3(1.0, 0.75, 0.45) * step(0.8, lh) * (1.0 - smoothstep(rad2 * 0.5, rad2, length(lp2))) * clamp(1.6 / (rad2 * rad2), 0.0, 1.0) * night * 0.8;
    } else {
      // hub around the axle
      float rings = smoothstep(0.4, 0.5, abs(fract(r / 18.0) - 0.5));
      col = mix(vec3(0.20, 0.21, 0.23), vec3(0.32, 0.33, 0.35), rings) * (sun * I * 0.2 + amb * 2.0);
      float net = (r < 75.0) ? 1.0 : 0.0;
      col += vec3(0.4) * net * (1.0 - smoothstep(0.0, 0.3, abs(fract(phi * 12.0 / PI) - 0.5))) * 0.05;
    }
  }

  // The sunline itself, and its glow
  float core;
  vec3 g = lineGlow(o, d, t, core);
  col += g * (1.0 - night * 0.0);
  col += emis;

  // Hand lamps on the Spindle are drawn as points in a second pass.
  vec3 outc = tonemap(col);
  float luma = dot(outc, vec3(0.299, 0.587, 0.114));
  outc = clamp(mix(vec3(luma), outc, 1.16), 0.0, 1.0);
  // gentle vignette
  vec2 q = gl_FragCoord.xy / uRes;
  outc *= 0.82 + 0.18 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.25);
  gl_FragColor = vec4(pow(outc, vec3(1.0 / 1.1)), 1.0);
}
`;

const HOLLOW_VS = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const LAMPS_VS = `
attribute vec4 aLamp; // x, y, z (metres), size
uniform vec3 uCamPos, uCamF, uCamU, uCamR;
uniform float uTanHalf, uAspect, uScale;
varying float vB;
void main() {
  vec3 rel = aLamp.xyz - uCamPos;
  float z = dot(rel, uCamF);
  if (z < 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  float x = dot(rel, uCamR) / (z * uTanHalf * 2.0 * uAspect) * 2.0;
  float y = dot(rel, uCamU) / (z * uTanHalf * 2.0) * 2.0;
  gl_Position = vec4(x, y, 0.0, 1.0);
  float px = uScale * 2400.0 / z;
  gl_PointSize = clamp(px, 2.0, 11.0);
  vB = aLamp.w * clamp(0.55 + px / 6.0, 0.55, 1.0);
}
`;
const LAMPS_FS = `
precision mediump float;
varying float vB;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  float a = smoothstep(0.5, 0.0, r);
  gl_FragColor = vec4(vec3(1.0, 0.82, 0.55) * a * vB, a * vB);
}
`;

class HollowView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ok = false;
    const gl = canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: true, alpha: false }) ||
      canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true });
    if (!gl) return;
    this.gl = gl;
    this.prog = this._program(HOLLOW_VS, HOLLOW_FS);
    this.lampProg = this._program(LAMPS_VS, LAMPS_FS);
    if (!this.prog || !this.lampProg) return;
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    this.lampBuf = gl.createBuffer();
    this.lamps = new Float32Array(0);
    this.lampMeta = [];
    this.u = {};
    for (const n of ["uRes", "uTime", "uCamPos", "uCamF", "uCamU", "uCamR", "uTanHalf", "uSun", "uLake", "uLand", "uLand2", "uMisc", "uPix", "uExposure", "uSpindleOpen"]) {
      this.u[n] = gl.getUniformLocation(this.prog, n);
    }
    this.lu = {};
    for (const n of ["uCamPos", "uCamF", "uCamU", "uCamR", "uTanHalf", "uAspect", "uScale"]) this.lu[n] = gl.getUniformLocation(this.lampProg, n);
    this.params = null;
    this.view = "floor";
    this.ok = true;
  }

  _program(vs, fs) {
    const gl = this.gl;
    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const v = mk(gl.VERTEX_SHADER, vs), f = mk(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    return p;
  }

  // drum: dossier; sun: {I, phase, f}; view: floor|terrace|lake|spindle; flyers: count of hand lamps
  set(drum, sun, view, flyers, seed) {
    this.drum = drum; this.sun = sun; this.view = view || "floor";
    const p = drum.hollow;
    const area = 35.3e6 * p.lake;
    const b = Math.sqrt(area / Math.PI / 1.4), a = b * 1.4;
    this.lake = [p.lakePhi, p.lakeZ, p.lake > 0 ? a : 0, p.lake > 0 ? b : 0];
    if (this.view === "lake" && p.lake > 0) {
      // stand on the shore, looking across the lake and up the far bank
      this.camPhi = p.lakePhi;
      this.camZ = Math.max(380, p.lakeZ - b * 1.08);
    } else {
      this.camPhi = -Math.PI / 2;
      this.camZ = 420;
    }
    // colour of the sunline from the drum's painted palette
    const stops = drum.palette.stops;
    let rgb;
    if (sun.phase === "noon") rgb = paletteColor(stops, 1);
    else if (sun.phase === "night") rgb = paletteColor(stops, 0.05);
    else rgb = paletteColor(stops, Math.pow(sun.f, 0.8));
    const mx = Math.max(rgb[0], rgb[1], rgb[2], 0.05);
    this.sunRGB = [rgb[0] / mx, rgb[1] / mx, rgb[2] / mx];
    this._buildLamps(flyers || 0, seed || 1);
  }

  _buildLamps(n, seed) {
    const r = makeRng(seed);
    const arr = new Float32Array(n * 4);
    this.lampMeta = [];
    for (let i = 0; i < n; i++) {
      const rad = Math.sqrt(r()) * 70;
      const ang = r() * Math.PI * 2;
      const z = 320 + r() * 3110;
      arr[i * 4] = Math.cos(ang) * rad; arr[i * 4 + 1] = Math.sin(ang) * rad; arr[i * 4 + 2] = z;
      arr[i * 4 + 3] = 0.45 + r() * 0.55;
      this.lampMeta.push({ v: (r() < 0.75 ? 1 : -1) * (0.6 + r() * 2.4), ang, rad, w: (r() - 0.5) * 0.02 });
    }
    this.lamps = arr;
  }

  camera(time) {
    const R = 1500, eye = 1.7;
    let pos, f, up;
    const sway = prefersReducedMotion ? 0 : Math.sin(time * 0.05) * 0.06;
    if (this.view === "terrace") {
      const rr = 900 - eye;
      pos = [0, -rr, 245.5];
      const pitch = 0.12 + sway * 0.2, yaw = sway * 0.6;
      f = [Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)];
      up = [0, 1, 0];
    } else if (this.view === "spindle") {
      pos = [0, -32, 330 + (prefersReducedMotion ? 0 : (time * 1.4) % 300)];
      f = [Math.sin(sway) * 0.2, 0.06, 1];
      up = [0, 1, 0];
    } else if (this.view === "lake") {
      const ph = this.camPhi, rr = R - eye;
      pos = [Math.cos(ph) * rr, Math.sin(ph) * rr, this.camZ];
      const upv = [-Math.cos(ph), -Math.sin(ph), 0];
      const pitch = 0.42 + sway * 0.3;
      f = [upv[0] * Math.sin(pitch) + Math.cos(pitch) * sway * 0.3 * -Math.sin(ph), upv[1] * Math.sin(pitch) + Math.cos(pitch) * sway * 0.3 * Math.cos(ph), Math.cos(pitch)];
      up = upv;
    } else {
      pos = [0, -(R - eye), this.camZ];
      const pitch = 0.72 + sway * 0.25, yaw = sway;
      f = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
      up = [0, 1, 0];
    }
    const nf = norm3(f);
    let rgt = norm3(cross3(nf, up));
    const u = norm3(cross3(rgt, nf));
    return { pos, f: nf, u, r: rgt };
  }

  render(time) {
    if (!this.ok || !this.drum) return;
    const gl = this.gl, c = this.canvas;
    const W = c.width, H = c.height;
    gl.viewport(0, 0, W, H);
    gl.useProgram(this.prog);
    const cam = this.camera(time);
    const tanHalf = Math.tan((this.view === "terrace" ? 64 : this.view === "spindle" ? 70 : this.view === "lake" ? 60 : 62) * Math.PI / 360);
    const p = this.drum.hollow, sun = this.sun;
    const u = this.u;
    gl.uniform2f(u.uRes, W, H);
    gl.uniform1f(u.uTime, time);
    gl.uniform3fv(u.uCamPos, cam.pos); gl.uniform3fv(u.uCamF, cam.f); gl.uniform3fv(u.uCamU, cam.u); gl.uniform3fv(u.uCamR, cam.r);
    gl.uniform1f(u.uTanHalf, tanHalf);
    gl.uniform4f(u.uSun, this.sunRGB[0], this.sunRGB[1], this.sunRGB[2], sun.I);
    gl.uniform4f(u.uLake, this.lake[0], this.lake[1], this.lake[2], this.lake[3]);
    gl.uniform4f(u.uLand, p.woods, p.orchard, p.squares, p.meadow);
    gl.uniform4f(u.uLand2, p.pavilions, p.terrace, p.swell, p.crowds);
    gl.uniform4f(u.uMisc, p.seed, p.hue, p.flowers, this.drum.sub === "wood" ? 1 : 0);
    gl.uniform1f(u.uPix, (2 * tanHalf) / H);
    const I = sun.I;
    const expo = I > 0.6 ? 0.86 : I > 0.05 ? lerp(5.5, 0.86, smooth(0.05, 0.6, I)) : 7.5;
    gl.uniform1f(u.uExposure, expo);
    gl.uniform1f(u.uSpindleOpen, I < 0.14 ? 1 : 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    const loc = gl.getAttribLocation(this.prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // hand lamps on the Spindle
    const n = this.lampMeta.length;
    if (n && I < 0.2) {
      const arr = this.lamps;
      for (let i = 0; i < n; i++) {
        const m = this.lampMeta[i];
        let z = 320 + ((arr[i * 4 + 2] - 320 + m.v * (prefersReducedMotion ? 0 : 0.016)) % 3110 + 3110) % 3110;
        arr[i * 4 + 2] = z;
        m.ang += m.w * 0.016;
        arr[i * 4] = Math.cos(m.ang) * m.rad; arr[i * 4 + 1] = Math.sin(m.ang) * m.rad;
      }
      gl.useProgram(this.lampProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.lampBuf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
      const la = gl.getAttribLocation(this.lampProg, "aLamp");
      gl.enableVertexAttribArray(la);
      gl.vertexAttribPointer(la, 4, gl.FLOAT, false, 0, 0);
      const lu = this.lu;
      gl.uniform3fv(lu.uCamPos, cam.pos); gl.uniform3fv(lu.uCamF, cam.f); gl.uniform3fv(lu.uCamU, cam.u); gl.uniform3fv(lu.uCamR, cam.r);
      gl.uniform1f(lu.uTanHalf, tanHalf); gl.uniform1f(lu.uAspect, W / H); gl.uniform1f(lu.uScale, H / 900);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.drawArrays(gl.POINTS, 0, n);
      gl.disable(gl.BLEND);
    }
  }
}

function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
