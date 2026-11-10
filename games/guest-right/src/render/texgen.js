// Procedural surfaces. Every material in the game is a small GLSL function, rendered once at start-up into two
// texture arrays: albedo (rgb, sRGB-encoded, authored at 0.8x so tints can lift it; a = cut-out alpha) and
// normal/roughness/occlusion (xy = tangent normal, z = roughness, w = cavity occlusion).
// Tileable ones repeat every `tile` metres; the kit scales uvs to match.
import * as THREE from 'three';
import { GLSL_COMMON, VERT_FULLSCREEN } from './glsl.js';

const HELPERS = /* glsl */`
float ph12(vec2 i, vec2 per) { return hash12(mod(i, per) + SEED); }
vec2 ph22(vec2 i, vec2 per) { return hash22(mod(i, per) + SEED); }
float pnoise(vec2 p, vec2 per) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(ph12(i, per), ph12(i + vec2(1, 0), per), f.x), mix(ph12(i + vec2(0, 1), per), ph12(i + vec2(1, 1), per), f.x), f.y);
}
float pfbm(vec2 uv, vec2 per, int oct) {
  float s = 0.0, a = 0.5, n = 0.0; vec2 p = uv * per;
  for (int i = 0; i < 7; i++) { if (i >= oct) break; s += a * pnoise(p, per); n += a; p *= 2.0; per *= 2.0; a *= 0.5; }
  return s / n;
}
// periodic Voronoi: (F1, F2 - F1, cell hash)
vec3 pvor(vec2 uv, vec2 per) {
  vec2 p = uv * per; vec2 i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0, id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); vec2 o = ph22(i + g, per); vec2 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = ph12(i + g + 17.0, per); } else if (d < d2) d2 = d;
  }
  return vec3(sqrt(d1), sqrt(d2) - sqrt(d1), id);
}
float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
// a leaf: base point, direction angle, length, width. returns (mask, along 0..1, across -1..1)
vec3 leafShape(vec2 p, vec2 base, float ang, float len, float wid) {
  vec2 d = vec2(sin(ang), cos(ang)); vec2 q = p - base; float t = dot(q, d) / len; float s = dot(q, vec2(d.y, -d.x)) / wid;
  float prof = sqrt(max(0.0, 4.0 * t * (1.0 - t))) * mix(1.0, 0.72, t);
  float m = step(0.0, t) * step(t, 1.0) * step(abs(s), prof);
  return vec3(m, t, s / max(prof, 0.001));
}
`;

// id, name, tile size in metres, normal strength, flags, GLSL body of: void surf(vec2 uv, out vec3 col, out float h, out float rough, out float ao, out float alpha)
// (col is linear, around 0.8 for "white"; h in 0..1)
const MATS = [
  ['plaster', 2.0, 1.2, `
    float n = pfbm(uv, vec2(8.0), 6), m = pfbm(uv + 0.31, vec2(3.0), 3);
    float tr = pfbm(uv * vec2(1.0, 3.0), vec2(4.0, 12.0), 3);
    col = vec3(0.78 + 0.07 * (m - 0.5) + 0.04 * (n - 0.5));
    h = n * 0.55 + m * 0.3 + tr * 0.25; rough = 0.9 - 0.08 * m;`],
  ['paint', 2.0, 0.12, `
    float n = pfbm(uv, vec2(96.0), 3), m = pfbm(uv, vec2(3.0), 3);
    col = vec3(0.8 + 0.03 * (m - 0.5)); h = n; rough = 0.52 + 0.1 * m;`],
  ['planks', 2.4, 1.6, `
    float rows = 16.0; float r = floor(uv.y * rows); float off = hash11(r * 7.31 + 1.7);
    float px = uv.x + off; float seg = mod(floor(px * 2.0), 2.0); float id = hash12(vec2(seg, r) + 3.1);
    vec2 f = vec2(fract(px * 2.0), fract(uv.y * rows));
    float ex = min(f.x, 1.0 - f.x) * 96.0, ey = min(f.y, 1.0 - f.y) * 12.0; float e = min(ex, ey);
    float gap = smoothstep(0.0, 0.5, e);
    float g = pfbm(vec2(uv.x + id * 7.0, uv.y) * vec2(1.0, 1.0), vec2(6.0, 160.0), 5);
    float rings = 0.5 + 0.5 * sin((uv.y * rows * 2.2 + g * 5.0 + id * 40.0) * 6.2832);
    float tone = 0.62 + 0.26 * id + 0.1 * (g - 0.5) - 0.07 * rings * rings;
    col = vec3(tone) * vec3(1.0, 0.96 + 0.05 * id, 0.9 + 0.1 * id) * mix(0.35, 1.0, gap);
    h = gap * (0.75 + 0.25 * g) - 0.05 * rings; rough = mix(0.9, 0.48 + 0.14 * g, gap); ao = mix(0.55, 1.0, gap);`],
  ['wood', 1.2, 0.8, `
    float w = pfbm(uv, vec2(2.0, 6.0), 4);
    float g = pfbm(uv, vec2(3.0, 220.0), 4);
    float rings = 0.5 + 0.5 * sin((uv.y * 34.0 + w * 3.2) * 6.2832);
    rings = pow(rings, 4.0);
    col = vec3(0.76 + 0.08 * (w - 0.5) - 0.07 * rings + 0.07 * (g - 0.5)) * vec3(1.0, 0.97, 0.93);
    h = 0.6 + 0.25 * g - 0.2 * rings; rough = 0.42 + 0.15 * g;`],
  ['terrazzo', 1.5, 0.25, `
    vec3 v1 = pvor(uv, vec2(14.0)), v2 = pvor(uv + 0.37, vec2(37.0)), v3 = pvor(uv + 0.11, vec2(80.0));
    float c1 = smoothstep(0.34, 0.3, v1.x), c2 = smoothstep(0.3, 0.26, v2.x), c3 = smoothstep(0.3, 0.24, v3.x);
    vec3 base = vec3(0.74) + 0.03 * (pfbm(uv, vec2(6.0), 3) - 0.5);
    vec3 a1 = mix(vec3(0.42, 0.4, 0.38), vec3(0.95, 0.9, 0.82), v1.z);
    vec3 a2 = mix(vec3(0.55, 0.42, 0.36), vec3(0.9, 0.86, 0.8), v2.z);
    vec3 a3 = mix(vec3(0.3), vec3(0.85), v3.z);
    col = mix(mix(mix(base, a3, c3 * 0.8), a2, c2), a1, c1);
    h = 0.5 + 0.03 * (c1 + c2); rough = 0.24 + 0.08 * (1.0 - max(c1, c2)) + 0.05 * pfbm(uv, vec2(5.0), 2);`],
  ['tile', 1.0, 1.4, `
    vec2 g = uv * 5.0; vec2 id = floor(g); vec2 f = fract(g);
    float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
    float t = smoothstep(0.012, 0.034, e); float var = ph12(id, vec2(5.0));
    float wav = pfbm(uv, vec2(10.0), 3);
    col = mix(vec3(0.5), vec3(0.76 + 0.07 * (var - 0.5) + 0.02 * wav), t);
    h = mix(0.25, 0.75 + 0.15 * smoothstep(0.03, 0.14, e) + 0.03 * wav, t); rough = mix(0.88, 0.1 + 0.05 * wav, t); ao = mix(0.6, 1.0, t);`],
  ['mosaic', 0.5, 1.5, `
    vec2 g = uv * 16.0; vec2 id = floor(g); vec2 f = fract(g) + (ph22(id, vec2(16.0)) - 0.5) * 0.06;
    float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
    float t = smoothstep(0.03, 0.1, e); float var = ph12(id + 5.0, vec2(16.0));
    col = mix(vec3(0.46), vec3(0.62 + 0.3 * var), t);
    h = mix(0.2, 0.7 + 0.2 * var, t); rough = mix(0.9, 0.14 + 0.12 * var, t); ao = mix(0.55, 1.0, t);`],
  ['stone', 2.4, 1.3, `
    float rows = 4.0; float r = floor(uv.y * rows); float px = uv.x + mod(r, 2.0) * 0.1667;
    vec2 f = vec2(fract(px * 3.0), fract(uv.y * rows)); float id = hash12(vec2(mod(floor(px * 3.0), 3.0), r) + 9.0);
    float e = min(min(f.x, 1.0 - f.x) * 0.8, min(f.y, 1.0 - f.y) * 0.6);
    float j = smoothstep(0.004, 0.014, e);
    float n = pfbm(uv, vec2(10.0), 6), v = pfbm(uv + id, vec2(4.0), 3);
    col = mix(vec3(0.4), vec3(0.68 + 0.12 * (id - 0.5) + 0.12 * (n - 0.5) + 0.05 * (v - 0.5)), j);
    h = mix(0.15, 0.6 + 0.3 * n, j); rough = mix(0.95, 0.62 + 0.2 * n, j); ao = mix(0.5, 1.0, j);`],
  ['concrete', 2.0, 0.9, `
    float n = pfbm(uv, vec2(6.0), 6), m = pfbm(uv + 0.5, vec2(24.0), 3);
    vec3 v = pvor(uv, vec2(60.0)); float pore = smoothstep(0.12, 0.05, v.x) * step(0.82, v.z);
    col = vec3(0.7 + 0.1 * (n - 0.5) + 0.04 * (m - 0.5)) * (1.0 - 0.45 * pore);
    h = 0.5 + 0.3 * n + 0.1 * m - 0.6 * pore; rough = 0.82 - 0.1 * n; ao = 1.0 - 0.3 * pore;`],
  ['brushed', 1.0, 0.5, `
    float s = pfbm(uv, vec2(3.0, 400.0), 4), m = pfbm(uv, vec2(4.0), 3);
    col = vec3(0.76 + 0.08 * (s - 0.5) + 0.03 * (m - 0.5)); h = s; rough = 0.3 + 0.16 * s;`],
  ['cast', 0.8, 1.0, `
    vec3 v = pvor(uv, vec2(18.0)); float n = pfbm(uv, vec2(9.0), 5);
    float dent = smoothstep(0.0, 0.5, v.x);
    col = vec3(0.7 + 0.12 * (n - 0.5)) * mix(vec3(0.82, 0.9, 0.88), vec3(1.0), smoothstep(0.35, 0.65, n));
    h = 0.4 + 0.35 * dent + 0.2 * n; rough = 0.34 + 0.3 * (1.0 - smoothstep(0.35, 0.7, n));`],
  ['felt', 0.6, 0.9, `
    float n = pfbm(uv, vec2(90.0), 3), m = pfbm(uv, vec2(7.0), 4), s = pfbm(uv * vec2(1.0, 0.25), vec2(160.0, 40.0), 2);
    col = vec3(0.76 + 0.08 * (m - 0.5) + 0.07 * (n - 0.5) + 0.04 * (s - 0.5)); h = 0.5 * n + 0.3 * s + 0.2 * m; rough = 1.0; ao = 0.82 + 0.18 * n;`],
  ['weave', 0.25, 1.6, `
    vec2 g = uv * 32.0; vec2 id = floor(g); vec2 f = fract(g);
    float par = mod(id.x + id.y, 2.0);
    float warp = sin(f.x * 3.1416), weft = sin(f.y * 3.1416);
    float a1 = mix(warp * (0.55 + 0.45 * weft), weft * (0.55 + 0.45 * warp), par);
    float irr = ph12(vec2(par > 0.5 ? id.y : id.x, par), vec2(32.0));
    col = vec3(0.68 + 0.16 * a1 + 0.06 * (irr - 0.5)); h = a1; rough = 0.96; ao = 0.7 + 0.3 * a1;`],
  ['stripe', 0.4, 1.2, `
    vec2 g = uv * 48.0; vec2 f = fract(g); float par = mod(floor(g.x) + floor(g.y), 2.0);
    float a1 = mix(sin(f.x * 3.1416), sin(f.y * 3.1416), par);
    float band = fract(uv.x * 4.0); float st = smoothstep(0.46, 0.5, band) - smoothstep(0.96, 1.0, band);
    float thin = step(0.2, band) * step(band, 0.24);
    col = vec3(0.66 + 0.14 * a1) * mix(1.0, 0.42, max(st, thin)); h = a1; rough = 0.96; ao = 0.75 + 0.25 * a1;`],
  ['knit', 0.2, 1.8, `
    vec2 g = uv * vec2(16.0, 20.0); vec2 f = fract(g);
    float rib = abs(f.x - 0.5) * 2.0; float v = fract(f.y + (1.0 - rib) * 0.5);
    float st = smoothstep(0.0, 0.25, v) * (1.0 - smoothstep(0.7, 1.0, v)) * (1.0 - rib * rib);
    col = vec3(0.64 + 0.2 * st); h = st; rough = 0.98; ao = 0.65 + 0.35 * st;`],
  ['leather', 0.5, 1.1, `
    vec3 v = pvor(uv, vec2(44.0)); float n = pfbm(uv, vec2(6.0), 4);
    float cr = smoothstep(0.0, 0.12, v.y);
    col = vec3(0.7 + 0.08 * (n - 0.5)) * mix(0.82, 1.0, cr); h = 0.35 + 0.5 * cr * (0.7 + 0.3 * v.z) + 0.1 * n; rough = 0.5 + 0.15 * (1.0 - cr) + 0.08 * n;`],
  ['paper', 0.5, 0.5, `
    float n = pfbm(uv, vec2(70.0), 3), f = pfbm(uv * vec2(1.0, 0.2), vec2(120.0, 24.0), 2), m = pfbm(uv, vec2(4.0), 3);
    col = vec3(0.86 + 0.04 * (m - 0.5) + 0.03 * (f - 0.5)) * vec3(1.0, 0.985, 0.95); h = 0.6 * n + 0.4 * f; rough = 0.9;`],
  ['speckle', 1.0, 0.4, `
    vec3 v1 = pvor(uv, vec2(50.0)), v2 = pvor(uv + 0.5, vec2(90.0)); float n = pfbm(uv, vec2(8.0), 4);
    float d1 = smoothstep(0.22, 0.14, v1.x) * step(0.45, v1.z), d2 = smoothstep(0.2, 0.1, v2.x) * step(0.55, v2.z);
    col = vec3(0.7 + 0.05 * (n - 0.5)) * (1.0 + 0.22 * d1 * (v1.z > 0.72 ? 1.0 : -1.0)) * (1.0 - 0.2 * d2); h = 0.5 + 0.1 * n; rough = 0.66 + 0.1 * n;`],
  ['carpet', 0.5, 1.4, `
    float n = pfbm(uv, vec2(110.0), 2), m = pfbm(uv, vec2(9.0), 4), l = pfbm(uv * vec2(1.0, 0.5), vec2(60.0, 30.0), 2);
    col = vec3(0.7 + 0.14 * (n - 0.5) + 0.08 * (m - 0.5)); h = 0.6 * n + 0.4 * l; rough = 1.0; ao = 0.7 + 0.3 * n;`],
  ['grass', 2.5, 1.3, `
    float a1 = pfbm(uv, vec2(5.0), 4), b = pfbm(uv, vec2(48.0, 150.0), 3), c = pfbm(uv + 0.2, vec2(150.0, 48.0), 3), d = pfbm(uv, vec2(18.0), 3);
    float bl = max(b, c);
    vec3 g1 = vec3(0.05, 0.14, 0.025), g2 = vec3(0.115, 0.23, 0.05), g3 = vec3(0.2, 0.26, 0.085);
    col = mix(mix(g1, g2, smoothstep(0.3, 0.75, bl)), g3, smoothstep(0.55, 0.9, a1) * 0.5) * (0.75 + 0.5 * d);
    h = 0.3 + 0.7 * bl * (0.6 + 0.4 * d); rough = 0.88; ao = 0.6 + 0.4 * bl;`],
  ['soil', 1.5, 1.4, `
    float n = pfbm(uv, vec2(7.0), 6); vec3 v = pvor(uv, vec2(40.0)); float chip = smoothstep(0.3, 0.2, v.x) * step(0.5, v.z);
    col = mix(vec3(0.2, 0.14, 0.1), vec3(0.36, 0.27, 0.19), n) * (1.0 + 0.3 * chip * (v.z - 0.6));
    h = 0.4 * n + 0.5 * chip + 0.2 * pfbm(uv, vec2(60.0), 2); rough = 0.95; ao = 0.7 + 0.3 * n;`],
  ['gravel', 1.5, 1.8, `
    vec3 v = pvor(uv, vec2(46.0)); vec3 w = pvor(uv + 0.3, vec2(110.0)); float n = pfbm(uv, vec2(6.0), 3);
    float dome = 1.0 - smoothstep(0.0, 0.55, v.x); float dome2 = 1.0 - smoothstep(0.0, 0.5, w.x);
    vec3 tone = mix(vec3(0.5, 0.47, 0.43), vec3(0.74, 0.7, 0.63), v.z);
    col = tone * (0.72 + 0.28 * dome) * (0.94 + 0.12 * n); h = 0.7 * dome + 0.3 * dome2; rough = 0.85; ao = 0.5 + 0.5 * dome;`],
  ['sand', 2.0, 0.9, `
    float n = pfbm(uv, vec2(120.0), 3), m = pfbm(uv, vec2(5.0), 4);
    float rip = 0.5 + 0.5 * sin((uv.y * 22.0 + m * 2.2 + 0.4 * sin(uv.x * 6.2832 * 3.0)) * 6.2832);
    col = vec3(0.72, 0.65, 0.5) * (0.88 + 0.12 * n + 0.07 * (m - 0.5) + 0.05 * rip); h = 0.35 * n + 0.45 * rip + 0.2 * m; rough = 0.95;`],
  ['bark', 1.0, 2.2, `
    vec3 v = pvor(uv * vec2(1.0, 0.28), vec2(14.0, 6.0)); float n = pfbm(uv, vec2(10.0, 40.0), 5);
    float ridge = smoothstep(0.0, 0.2, v.y);
    col = mix(vec3(0.13, 0.1, 0.085), vec3(0.42, 0.36, 0.3), ridge * (0.5 + 0.5 * n)); h = 0.65 * ridge + 0.35 * n; rough = 0.93; ao = 0.5 + 0.5 * ridge;`],
  ['leafA', 1.0, 0.8, `
    vec2 p = uv; alpha = 0.0; col = vec3(0.0); h = 0.5; float best = 0.0;
    float tw = sdSeg(p, vec2(0.5, 0.0), vec2(0.5 + 0.03 * sin(p.y * 7.0), 0.78));
    for (int i = 0; i < 9; i++) {
      float fi = float(i); float side = mod(fi, 2.0) * 2.0 - 1.0; float t = 0.08 + fi * 0.085;
      vec2 base = vec2(0.5 + 0.03 * sin(t * 7.0), t);
      float ang = (i == 8) ? 0.05 : side * (1.05 - 0.05 * fi) + 0.12 * sin(fi * 5.1);
      float len = (i == 8) ? 0.24 : 0.3 - 0.012 * fi + 0.03 * sin(fi * 3.7); float wid = len * 0.34;
      vec3 L = leafShape(p, base, ang, len, wid);
      if (L.x > 0.5) {
        float vein = smoothstep(0.1, 0.0, abs(L.z)) * 0.6 + 0.25 * smoothstep(0.92, 1.0, abs(sin((L.y * 9.0 - abs(L.z) * 2.2) * 3.1416)));
        float shade = 0.78 + 0.22 * (1.0 - abs(L.z)) - 0.12 * L.y + 0.1 * sin(fi * 2.3);
        vec3 c = mix(vec3(0.16, 0.4, 0.09), vec3(0.3, 0.52, 0.12), 0.5 + 0.5 * sin(fi * 1.7 + 1.0)) * shade;
        c = mix(c, vec3(0.42, 0.6, 0.22), vein * 0.5);
        col = c; alpha = 1.0; h = 0.5 + 0.3 * (1.0 - abs(L.z)) - 0.2 * vein;
      }
    }
    if (tw < 0.012) { col = vec3(0.26, 0.2, 0.12); alpha = 1.0; h = 0.7; }
    rough = 0.55;`],
  ['leafB', 1.0, 0.7, `
    vec2 p = uv; alpha = 0.0; col = vec3(0.0); h = 0.5;
    float tw = sdSeg(p, vec2(0.5, 0.0), vec2(0.5, 0.6));
    for (int i = 0; i < 13; i++) {
      float fi = float(i); float side = mod(fi, 2.0) * 2.0 - 1.0; float t = 0.06 + fi * 0.045;
      vec2 base = vec2(0.5, t);
      float ang = side * (0.5 + 0.55 * hash11(fi * 3.3)) + 0.1 * sin(fi * 2.1);
      float len = 0.34 + 0.1 * hash11(fi * 9.1); float wid = len * 0.1;
      vec3 L = leafShape(p, base, ang, len, wid);
      if (L.x > 0.5) {
        float shade = 0.75 + 0.25 * (1.0 - abs(L.z)) + 0.12 * sin(fi * 1.9);
        col = mix(vec3(0.2, 0.42, 0.12), vec3(0.42, 0.58, 0.18), hash11(fi * 5.7)) * shade; alpha = 1.0; h = 0.6 - 0.2 * abs(L.z);
      }
    }
    if (tw < 0.008) { col = vec3(0.34, 0.36, 0.14); alpha = 1.0; }
    rough = 0.5;`],
  ['fern', 1.0, 0.8, `
    vec2 p = uv; alpha = 0.0; col = vec3(0.0); h = 0.5;
    float bend = 0.06 * sin(p.y * 2.6);
    float tw = abs(p.x - 0.5 - bend) - 0.006 * (1.0 - p.y);
    for (int i = 0; i < 22; i++) {
      float fi = float(i); float side = mod(fi, 2.0) * 2.0 - 1.0; float t = 0.05 + floor(fi * 0.5) * 0.085 + mod(fi, 2.0) * 0.02;
      if (t > 0.97) continue;
      float prof = sin(clamp((t - 0.02) / 0.96, 0.0, 1.0) * 3.1416); prof = pow(prof, 0.7) * mix(1.0, 0.55, t);
      vec2 base = vec2(0.5 + 0.06 * sin(t * 2.6), t);
      float len = 0.43 * prof + 0.02; float ang = side * (1.25 - 0.35 * t);
      vec3 L = leafShape(p, base, ang, len, 0.034 + 0.01 * prof);
      if (L.x > 0.5) {
        float serr = 0.8 + 0.2 * sin(L.y * 40.0);
        col = mix(vec3(0.14, 0.36, 0.1), vec3(0.3, 0.52, 0.16), L.y) * (0.75 + 0.25 * (1.0 - abs(L.z))) * serr; alpha = 1.0; h = 0.6 - 0.2 * abs(L.z);
      }
    }
    if (tw < 0.0 && p.y < 0.98) { col = vec3(0.3, 0.3, 0.12); alpha = 1.0; }
    rough = 0.6;`],
  ['blossom', 1.0, 0.6, `
    vec2 p = uv; alpha = 0.0; col = vec3(0.0); h = 0.5;
    for (int i = 0; i < 5; i++) {
      float fi = float(i); vec2 base = vec2(0.5 + 0.3 * sin(fi * 2.4), 0.1 + 0.15 * fi);
      vec3 L = leafShape(p, base, (mod(fi, 2.0) * 2.0 - 1.0) * 1.1, 0.24, 0.07);
      if (L.x > 0.5) { col = vec3(0.2, 0.42, 0.12) * (0.8 + 0.2 * (1.0 - abs(L.z))); alpha = 1.0; }
    }
    for (int i = 0; i < 11; i++) {
      float fi = float(i); vec2 c = vec2(0.14 + 0.72 * hash11(fi * 3.17 + 0.5), 0.14 + 0.72 * hash11(fi * 7.31 + 1.5)); float r = 0.07 + 0.03 * hash11(fi * 1.9);
      vec2 q = p - c; float a = atan(q.y, q.x) + fi; float d = length(q);
      float pet = r * (0.62 + 0.38 * abs(cos(a * 2.5)));
      if (d < pet) {
        float s = d / pet; col = mix(vec3(0.82, 0.8, 0.74), vec3(0.8, 0.76, 0.76), s) * (0.82 + 0.18 * s); alpha = 1.0; h = 0.7 - 0.3 * s;
        if (d < r * 0.2) col = vec3(0.8, 0.62, 0.2);
      }
    }
    rough = 0.6;`],
  ['cane', 0.3, 2.0, `
    vec2 g = uv * 8.0; vec2 f = fract(g); vec2 id = floor(g);
    float par = mod(id.x + id.y, 2.0);
    float sx = smoothstep(0.5, 0.36, abs(f.x - 0.5)), sy = smoothstep(0.5, 0.36, abs(f.y - 0.5));
    float bx = sin(f.x * 3.1416), by = sin(f.y * 3.1416);
    float hx = sx * (par > 0.5 ? 0.6 + 0.4 * by : 0.25 + 0.2 * by), hy = sy * (par > 0.5 ? 0.25 + 0.2 * bx : 0.6 + 0.4 * bx);
    float hh = max(hx, hy); float fib = pfbm(uv, vec2(8.0, 200.0), 2);
    col = vec3(0.56 + 0.3 * hh + 0.06 * (fib - 0.5)) * vec3(1.0, 0.95, 0.85); h = hh; rough = 0.6; ao = 0.45 + 0.55 * hh;`],
  ['diffuser', 0.6, 0.4, `
    vec2 g = uv * 24.0; vec2 f = fract(g) - 0.5; float pr = 1.0 - max(abs(f.x), abs(f.y)) * 2.0;
    float n = pfbm(uv, vec2(5.0), 3);
    col = vec3(0.8 + 0.03 * pr + 0.03 * (n - 0.5)); h = pr; rough = 0.55;`],
  ['grille', 0.5, 1.0, `
    vec2 g = uv * 14.0; vec2 f = fract(g + vec2(mod(floor(g.y), 2.0) * 0.5, 0.0)) - 0.5; float d = length(f);
    alpha = smoothstep(0.3, 0.34, d); float n = pfbm(uv, vec2(3.0, 200.0), 3);
    col = vec3(0.72 + 0.06 * (n - 0.5)); h = smoothstep(0.3, 0.42, d); rough = 0.4 + 0.1 * n; ao = 0.6 + 0.4 * h;`],
  ['glaze', 0.5, 0.35, `
    float n = pfbm(uv, vec2(5.0), 5), m = pfbm(uv + 0.4, vec2(11.0), 3); vec3 v = pvor(uv, vec2(70.0));
    float sp = smoothstep(0.16, 0.08, v.x) * step(0.78, v.z);
    col = vec3(0.76 + 0.1 * (n - 0.5) + 0.03 * (m - 0.5)) * (1.0 - 0.35 * sp); h = 0.5 + 0.2 * n; rough = 0.16 + 0.1 * m + 0.2 * sp;`],
  ['panel', 2.0, 1.0, `
    vec2 f = uv; float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
    float seam = smoothstep(0.004, 0.012, e); float n = pfbm(uv, vec2(6.0), 5), sc = pfbm(uv * vec2(1.0, 0.1), vec2(60.0, 6.0), 3);
    vec2 rg = vec2(fract(uv.x * 8.0), fract(uv.y * 8.0)) - 0.5;
    float onEdge = step(e, 0.07) * step(0.03, e);
    float rv = (1.0 - smoothstep(0.1, 0.16, length(rg))) * onEdge;
    float chip = smoothstep(0.7, 0.76, n + 0.25 * (1.0 - smoothstep(0.0, 0.08, e)));
    col = mix(vec3(0.32), vec3(0.74 + 0.05 * (n - 0.5) - 0.04 * (sc - 0.5)), seam); col = mix(col, vec3(0.5, 0.48, 0.46), chip * 0.7);
    h = mix(0.1, 0.6, seam) + 0.3 * rv - 0.1 * chip; rough = mix(0.9, 0.45 + 0.15 * sc + 0.25 * chip, seam); ao = mix(0.5, 1.0, seam) * (1.0 - 0.2 * rv);`],
  ['deckplate', 1.0, 1.6, `
    vec2 g = uv * 10.0; vec2 id = floor(g); vec2 f = fract(g) - 0.5; float par = mod(id.x + id.y, 2.0);
    vec2 q = par > 0.5 ? f.yx : f; float st = 1.0 - smoothstep(0.0, 1.0, length(q * vec2(2.6, 7.0)) );
    st = smoothstep(0.2, 0.6, st); float n = pfbm(uv, vec2(8.0), 4), sc = pfbm(uv, vec2(3.0, 140.0), 3);
    col = vec3(0.6 + 0.12 * st + 0.08 * (n - 0.5)); h = 0.3 + 0.6 * st + 0.1 * sc; rough = 0.5 - 0.15 * st + 0.12 * n; ao = 0.8 + 0.2 * st;`],
  ['pattern', 1.0, 1.0, `
    vec2 g = uv * 4.0; vec2 f = fract(g); vec2 id = floor(g);
    float e = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)); float t = smoothstep(0.012, 0.03, e);
    vec2 q = abs(f - 0.5);
    float star = step(q.x + q.y, 0.3) + step(0.62, length(q)) * step(length(q), 0.72) + step(max(q.x, q.y), 0.08);
    float corner = step(length(q - 0.5), 0.2);
    float m = clamp(star + corner, 0.0, 1.0); float n = pfbm(uv, vec2(12.0), 3);
    col = mix(vec3(0.45), vec3(mix(0.8, 0.36, m)) * (0.96 + 0.08 * n), t); h = mix(0.25, 0.7, t); rough = mix(0.9, 0.2 + 0.08 * n, t); ao = mix(0.6, 1.0, t);`],
  ['block', 1.6, 1.2, `
    vec2 g = uv * vec2(4.0, 8.0); vec2 f = fract(g); vec2 id = floor(g);
    float e = min(min(f.x, 1.0 - f.x) * 2.0, min(f.y, 1.0 - f.y)); float t = smoothstep(0.02, 0.06, e);
    float n = pfbm(uv, vec2(14.0), 5); float var = ph12(id, vec2(4.0, 8.0));
    col = mix(vec3(0.55), vec3(0.74 + 0.05 * (var - 0.5) + 0.07 * (n - 0.5)), t); h = mix(0.2, 0.6 + 0.25 * n, t); rough = 0.86; ao = mix(0.6, 1.0, t);`],
  ['plain', 1.0, 0.0, `
    col = vec3(0.8); h = 0.5; rough = 0.6;`],
  ['flute', 0.6, 1.5, `
    float r = fract(uv.x * 12.0); float hh = sin(r * 3.1416); float n = pfbm(uv, vec2(4.0), 3);
    col = vec3(0.74 + 0.08 * hh + 0.03 * (n - 0.5)); h = hh; rough = 0.45 + 0.1 * n; ao = 0.7 + 0.3 * hh;`],
  ['rush', 0.6, 1.4, `
    vec2 g = uv * vec2(6.0, 60.0); vec2 f = fract(g); float id = ph12(floor(g), vec2(6.0, 60.0));
    float st = sin(f.y * 3.1416); float bind = smoothstep(0.06, 0.02, abs(f.x - 0.5)) ;
    col = vec3(0.6 + 0.2 * st + 0.1 * (id - 0.5)) * vec3(1.0, 0.98, 0.86) * (1.0 - 0.3 * bind); h = st * (1.0 - 0.5 * bind) + 0.3 * bind; rough = 0.8; ao = 0.6 + 0.4 * st;`],
  ['hex', 0.6, 1.4, `
    vec2 p = uv * vec2(6.0, 6.0 * 1.1547 * 0.5 * 2.0 / 1.1547); p.y *= 1.1547;
    vec2 r = vec2(1.0, 1.7320508); vec2 hh = r * 0.5;
    vec2 a1 = mod(p, r) - hh, b = mod(p - hh, r) - hh; vec2 gv = dot(a1, a1) < dot(b, b) ? a1 : b;
    vec2 id = p - gv; float e = 0.5 - max(abs(gv.x), dot(abs(gv), normalize(r)));
    float t = smoothstep(0.02, 0.05, e); float var = hash12(floor(id * 7.0) + 3.0);
    col = mix(vec3(0.5), vec3(0.72 + 0.1 * (var - 0.5)), t); h = mix(0.2, 0.75, t); rough = mix(0.9, 0.16, t); ao = mix(0.6, 1.0, t);`],
  ['slate', 1.5, 0.5, `
    float n = pfbm(uv, vec2(5.0), 5), s = pfbm(uv * vec2(1.0, 0.3), vec2(40.0, 12.0), 3), d = pfbm(uv + 0.6, vec2(3.0), 3);
    col = vec3(0.66 + 0.1 * (n - 0.5) + 0.14 * smoothstep(0.45, 0.8, d) * s); h = 0.5 + 0.3 * n; rough = 0.8;`],
  ['motif', 0.4, 1.0, `
    vec2 g = uv * 36.0; vec2 ff = fract(g); float par = mod(floor(g.x) + floor(g.y), 2.0);
    float a1 = mix(sin(ff.x * 3.1416), sin(ff.y * 3.1416), par);
    vec2 c = uv * 4.0; vec2 id = floor(c); vec2 f = fract(c) - 0.5; if (mod(id.y, 2.0) > 0.5) f.x = fract(c.x + 0.5) - 0.5;
    float d = abs(f.x) + abs(f.y); float m = step(d, 0.26) - step(d, 0.14) + step(length(f), 0.06);
    col = vec3(0.66 + 0.14 * a1) * mix(1.0, 0.4, clamp(m, 0.0, 1.0)); h = a1; rough = 0.96; ao = 0.75 + 0.25 * a1;`],
];

export const MAT_INFO = {};      // name -> { layer, tile }
MATS.forEach((m, i) => { MAT_INFO[m[0]] = { layer: i, tile: m[1] }; });
export const MAT_COUNT = MATS.length;

function fragFor(m, seed) {
  return /* glsl */`
${GLSL_COMMON}
#define SEED ${seed.toFixed(1)}
${HELPERS}
in vec2 vUv;
layout(location = 0) out vec4 outColor;
uniform int uMode;        // 0 albedo + alpha, 1 height + roughness + occlusion
void main() {
  vec2 uv = vUv;
  vec3 col = vec3(0.8); float h = 0.5, rough = 0.7, ao = 1.0, alpha = 1.0;
  ${m[3]}
  if (uMode == 0) outColor = vec4(linToSrgb(saturate(col)), alpha);
  else outColor = vec4(h, rough, ao, 1.0);
}`;
}

// height -> tangent normal, shared by every material
const NORMAL_FRAG = /* glsl */`
precision highp float;
in vec2 vUv;
layout(location = 0) out vec4 outColor;
uniform highp sampler2D tH;
uniform float uTexel;
uniform float uStrength;
void main() {
  vec4 c = texture(tH, vUv);
  float hx0 = texture(tH, vUv - vec2(uTexel, 0.0)).r, hx1 = texture(tH, vUv + vec2(uTexel, 0.0)).r;
  float hy0 = texture(tH, vUv - vec2(0.0, uTexel)).r, hy1 = texture(tH, vUv + vec2(0.0, uTexel)).r;
  vec3 n = normalize(vec3((hx0 - hx1) * uStrength, (hy0 - hy1) * uStrength, 1.0));
  outColor = vec4(n.xy * 0.5 + 0.5, c.g, c.b);
}`;

// Renders every material into the two arrays. Call prepare() (async: compiles the shaders off the main thread where the browser
// allows), then step(i) for each material, then finish().
export function generateMaterials(renderer, size = 512) {
  const n = MATS.length;
  const mk = () => {
    const t = new THREE.WebGLArrayRenderTarget(size, size, n, { type: THREE.UnsignedByteType, format: THREE.RGBAFormat, depthBuffer: false, generateMipmaps: false, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
    t.texture.wrapS = t.texture.wrapT = THREE.RepeatWrapping; t.texture.colorSpace = THREE.NoColorSpace;
    return t;
  };
  const alb = mk(), nrm = mk();
  const tmpH = new THREE.WebGLRenderTarget(size, size, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, depthBuffer: false, generateMipmaps: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping });
  tmpH.texture.colorSpace = THREE.NoColorSpace;
  const geo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const quad = new THREE.Mesh(geo, null);
  quad.frustumCulled = false; const scene = new THREE.Scene(); scene.add(quad); const cam = new THREE.Camera();
  const VS = 'precision highp float;\n' + VERT_FULLSCREEN;
  const mats = MATS.map((m, i) => new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS, fragmentShader: fragFor(m, i * 13.7 + 1.0), uniforms: { uMode: { value: 0 } }, depthTest: false, depthWrite: false, blending: THREE.NoBlending }));
  const nmat = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS, fragmentShader: NORMAL_FRAG, uniforms: { tH: { value: tmpH.texture }, uTexel: { value: 1 / size }, uStrength: { value: 1 } }, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
  const prepare = async () => {
    // one mesh per material in a throwaway scene, so the renderer can compile them all at once
    const sc = new THREE.Scene(); const meshes = [];
    for (const m of mats.concat([nmat])) { const q = new THREE.Mesh(geo, m); q.frustumCulled = false; sc.add(q); meshes.push(q); }
    try { if (renderer.compileAsync) await renderer.compileAsync(sc, cam); else renderer.compile(sc, cam); } catch (e) { /* fall back to compiling on first use */ }
  };
  const step = (i) => {
    const mat = mats[i];
    quad.material = mat;
    mat.uniforms.uMode.value = 0; renderer.setRenderTarget(alb, i); renderer.render(scene, cam);
    mat.uniforms.uMode.value = 1; renderer.setRenderTarget(tmpH); renderer.render(scene, cam);
    quad.material = nmat; nmat.uniforms.uStrength.value = MATS[i][2] * 2.2 * (size / 512);
    renderer.setRenderTarget(nrm, i); renderer.render(scene, cam);
  };
  const finish = () => {
    renderer.setRenderTarget(null);
    const gl = renderer.getContext();
    const aniso = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    for (const t of [alb, nrm]) {
      const tex = renderer.properties.get(t.texture).__webglTexture;
      renderer.state.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      const ext = renderer.extensions.get('EXT_texture_filter_anisotropic');
      if (ext && aniso > 1) gl.texParameterf(gl.TEXTURE_2D_ARRAY, ext.TEXTURE_MAX_ANISOTROPY_EXT, aniso);
      renderer.state.unbindTexture();
    }
    for (const m of mats) m.dispose();
    nmat.dispose(); tmpH.dispose(); geo.dispose();
  };
  return { alb: alb.texture, nrm: nrm.texture, count: n, prepare, step, finish, names: MATS.map((m) => m[0]) };
}
