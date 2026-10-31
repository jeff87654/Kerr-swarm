/* ---------- The Window: the River, the Shelf and the rafts ---------- */
"use strict";

const WINDOW_FS = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uF, uU, uR;
uniform float uTanHalf;
uniform float uOpen;      // 0 shutter closed .. 1 open (eyes adjusting)
uniform vec4 uRafts[24];  // direction (xyz), angular radius
uniform vec4 uCreep;      // the raft whose edge creeps over a red star: dir xyz, radius
uniform vec3 uRedStar;

const float PI = 3.14159265;

float hash13(vec3 p3) { p3 = fract(p3 * 0.1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); vec3 u = f * f * (3.0 - 2.0 * f);
  float a = hash13(i), b = hash13(i + vec3(1.0, 0.0, 0.0)), c = hash13(i + vec3(0.0, 1.0, 0.0)), d = hash13(i + vec3(1.0, 1.0, 0.0));
  float e = hash13(i + vec3(0.0, 0.0, 1.0)), g = hash13(i + vec3(1.0, 0.0, 1.0)), h = hash13(i + vec3(0.0, 1.0, 1.0)), k = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, g, u.x), mix(h, k, u.x), u.y), u.z);
}
float fbm(vec3 p) {
  float s = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * vnoise3(p); p = p * 2.13 + vec3(5.1, 1.7, 9.3); a *= 0.5; }
  return s / 0.96875;
}

// The River lies in the plane z = 0 of sky coordinates (latitude b = asin(d.z)).
vec3 starLayer(vec3 d, float n, float density, float pix, float seed, out float bright) {
  bright = 0.0;
  vec3 ad = abs(d);
  vec2 uv; float face;
  if (ad.x >= ad.y && ad.x >= ad.z) { uv = d.yz / ad.x; face = d.x > 0.0 ? 0.0 : 1.0; }
  else if (ad.y >= ad.z) { uv = d.xz / ad.y; face = d.y > 0.0 ? 2.0 : 3.0; }
  else { uv = d.xy / ad.z; face = d.z > 0.0 ? 4.0 : 5.0; }
  vec2 g = (uv * 0.5 + 0.5) * n;
  vec2 gi = floor(g);
  vec3 col = vec3(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 c = gi + vec2(float(i), float(j));
      vec2 key = c + face * 1013.0 + seed;
      float h = hash12(key);
      if (h > density) continue;
      vec2 pos = c + vec2(hash12(key + 1.7), hash12(key + 3.3));
      vec2 dd = (g - pos) / n * 2.0;
      float ang = length(dd) / (1.0 + dot(uv, uv)) * 1.0;
      float m = hash12(key + 9.1);
      float mag = pow(m, 7.0);
      float sz = pix * (0.62 + 0.9 * mag);
      float s = exp(-ang * ang / (sz * sz));
      float temp = hash12(key + 5.5);
      vec3 sc = mix(vec3(1.0, 0.86, 0.62), vec3(1.0, 0.62, 0.34), smoothstep(0.55, 1.0, temp * (0.6 + mag)));
      sc = mix(sc, vec3(0.85, 0.9, 1.0), step(0.97, temp) * 0.6);
      col += sc * s * (0.025 + 1.6 * mag);
      bright = max(bright, s * mag);
    }
  }
  return col;
}

float raftMask(vec3 d) {
  float m = 1.0;
  for (int i = 0; i < 24; i++) {
    vec4 r = uRafts[i];
    float a = acos(clamp(dot(d, r.xyz), -1.0, 1.0));
    m *= smoothstep(r.w * 0.97, r.w * 1.03, a);
  }
  float a2 = acos(clamp(dot(d, uCreep.xyz), -1.0, 1.0));
  m *= smoothstep(uCreep.w * 0.995, uCreep.w * 1.005, a2);
  return m;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 d = normalize(uF + uv.x * 2.0 * uTanHalf * uR + uv.y * 2.0 * uTanHalf * uU);
  float pix = 2.0 * uTanHalf / uRes.y;
  float b = asin(clamp(d.z, -1.0, 1.0));
  float lon = atan(d.y, d.x);
  // the River: broad, thick and bright in the middle, frayed at the edges
  float fray = (fbm(d * 3.0 + 11.0) - 0.5) * 0.10;
  float bb = b + fray;
  float river = exp(-bb * bb / (2.0 * 0.16 * 0.16));
  float clumps = 0.65 + 0.7 * fbm(d * 6.0 + 2.0);
  // the Shelf: the bulge beyond, a fainter glow above and below
  float shelf = exp(-b * b / (2.0 * 0.55 * 0.55)) * 0.14;
  // dust rifts lying across the River
  float dn = fbm(vec3(lon * 3.0, b * 9.0, 4.0) + d * 2.0);
  float rift = smoothstep(0.48, 0.62, dn) * exp(-b * b / (2.0 * 0.075 * 0.075));
  float riftEdge = smoothstep(0.42, 0.52, dn) * (1.0 - smoothstep(0.52, 0.62, dn)) * exp(-b * b / (2.0 * 0.12 * 0.12));
  vec3 gold = vec3(1.0, 0.80, 0.52);
  float ridge = exp(-bb * bb / (2.0 * 0.05 * 0.05));
  vec3 glow = gold * river * clumps * 0.34 + gold * ridge * clumps * 0.12 + vec3(0.72, 0.62, 0.55) * shelf * 0.26;
  glow *= (1.0 - rift * 0.88);
  glow += vec3(0.42, 0.24, 0.34) * riftEdge * river * 0.22;   // bruise
  // stars, denser in the River
  float b1, b2;
  float dens = 0.004 + 0.32 * river * (1.0 - rift * 0.8) + 0.04 * shelf;
  vec3 stars = starLayer(d, 200.0, dens, pix, 1.0, b1);
  stars += starLayer(d, 520.0, dens * 0.7, pix * 0.8, 7.0, b2) * 0.4;
  stars *= (1.0 - rift * 0.75);
  // the red star near the creeping raft
  float ra = acos(clamp(dot(d, uRedStar), -1.0, 1.0));
  stars += vec3(1.0, 0.42, 0.25) * exp(-ra * ra / (pix * pix * 4.0)) * 3.0;
  vec3 col = glow + stars;
  col *= raftMask(d);
  // eyes waking up to the dark
  col *= uOpen;
  // the gallery's red light, before the shutter opens
  col += vec3(0.08, 0.01, 0.0) * (1.0 - uOpen);
  col = 1.0 - exp(-col * 1.6);
  gl_FragColor = vec4(pow(col, vec3(1.0 / 1.15)), 1.0);
}
`;

class WindowView {
  constructor(canvas) {
    this.canvas = canvas;
    this.ok = false;
    const gl = canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: true, alpha: false });
    if (!gl) return;
    this.gl = gl;
    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const v = mk(gl.VERTEX_SHADER, HOLLOW_VS), f = mk(gl.FRAGMENT_SHADER, WINDOW_FS);
    if (!v || !f) return;
    const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return; }
    this.prog = p;
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    this.u = {};
    for (const n of ["uRes", "uTime", "uF", "uU", "uR", "uTanHalf", "uOpen", "uRafts", "uCreep", "uRedStar"]) this.u[n] = gl.getUniformLocation(p, n);
    this.setSeed(1);
    this.open = 0;
    this.ok = true;
  }

  setSeed(seed) {
    const r = makeRng(seed);
    // view: looking out with the River running across the window at a slant
    const yaw = r.range(0, Math.PI * 2), tilt = r.range(0.25, 0.45);
    const f = norm3([Math.cos(yaw), Math.sin(yaw), r.range(-0.12, 0.12)]);
    let up = [-Math.sin(tilt) * Math.sin(yaw), Math.sin(tilt) * Math.cos(yaw), Math.cos(tilt)];
    const rr = norm3(cross3(f, up));
    up = norm3(cross3(rr, f));
    this.cam = { f, u: up, r: rr };
    // rafts: black shapes, from specks to one about a fingernail across
    const rafts = [];
    for (let i = 0; i < 24; i++) {
      const sx = r.range(-1.1, 1.1), sy = r.range(-0.55, 0.55);
      const dir = norm3([f[0] + sx * rr[0] + sy * up[0], f[1] + sx * rr[1] + sy * up[1], f[2] + sx * rr[2] + sy * up[2]]);
      const big = i === 0 ? 0.021 : i < 5 ? r.range(0.006, 0.013) : r.range(0.0012, 0.0045);
      rafts.push(dir[0], dir[1], dir[2], big);
    }
    this.rafts = new Float32Array(rafts);
    // the creeping raft and its red star
    const sdir = norm3([f[0] + 0.32 * rr[0] + 0.08 * up[0], f[1] + 0.32 * rr[1] + 0.08 * up[1], f[2] + 0.32 * rr[2] + 0.08 * up[2]]);
    this.redStar = sdir;
    this.creepRad = 0.03;
    this.creepFrom = norm3([sdir[0] - 0.062 * rr[0], sdir[1] - 0.062 * rr[1], sdir[2] - 0.062 * rr[2]]);
    this.creepDir = rr;
  }

  setPassing(on) {
    // a raft on a close pass: a black shape two fingers wide at arm's length
    if (!this.rafts) return;
    this.rafts[3] = on ? 0.025 : this.rafts[3];
    if (on) {
      const f = this.cam.f, u = this.cam.u, r = this.cam.r;
      const d = norm3([f[0] - 0.35 * r[0] + 0.18 * u[0], f[1] - 0.35 * r[1] + 0.18 * u[1], f[2] - 0.35 * r[2] + 0.18 * u[2]]);
      this.rafts[0] = d[0]; this.rafts[1] = d[1]; this.rafts[2] = d[2];
    }
  }

  render(time, open, creep) {
    if (!this.ok) return;
    const gl = this.gl, c = this.canvas;
    gl.viewport(0, 0, c.width, c.height);
    gl.useProgram(this.prog);
    const u = this.u;
    gl.uniform2f(u.uRes, c.width, c.height);
    gl.uniform1f(u.uTime, time);
    gl.uniform3fv(u.uF, this.cam.f); gl.uniform3fv(u.uU, this.cam.u); gl.uniform3fv(u.uR, this.cam.r);
    gl.uniform1f(u.uTanHalf, Math.tan(50 * Math.PI / 360));
    gl.uniform1f(u.uOpen, open);
    gl.uniform4fv(u.uRafts, this.rafts);
    // creep: 0..1 moves the raft's edge across the red star
    const k = 0.034 * clamp(creep, 0, 1);
    const cd = norm3([this.creepFrom[0] + k * this.creepDir[0], this.creepFrom[1] + k * this.creepDir[1], this.creepFrom[2] + k * this.creepDir[2]]);
    gl.uniform4f(u.uCreep, cd[0], cd[1], cd[2], this.creepRad);
    gl.uniform3fv(u.uRedStar, this.redStar);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    const loc = gl.getAttribLocation(this.prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
