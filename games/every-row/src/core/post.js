// The picture pipeline: worlds are drawn into floating-point targets, bloomed, then graded and tone-mapped to the page.
import {
  WebGLRenderTarget, HalfFloatType, LinearFilter, RGBAFormat, Scene, OrthographicCamera, Mesh, BufferGeometry,
  Float32BufferAttribute, ShaderMaterial, Vector2, Vector3, NoBlending,
} from 'three';

const VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const PREFILTER = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold; uniform float uKnee;
varying vec2 vUv;
vec3 pre(vec3 c) {
  c = min(c, vec3(64.0));                       // a stray huge texel would otherwise flash for a frame
  float l = max(c.r, max(c.g, c.b));
  float soft = clamp(l - uThreshold + uKnee, 0.0, 2.0 * uKnee);
  soft = soft * soft / (4.0 * uKnee + 1e-4);
  float k = max(soft, l - uThreshold) / max(l, 1e-4);
  return c * k;
}
void main() {
  vec3 a = pre(texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb);
  vec3 b = pre(texture2D(tSrc, vUv + uTexel * vec2( 1.0, -1.0)).rgb);
  vec3 c = pre(texture2D(tSrc, vUv + uTexel * vec2(-1.0,  1.0)).rgb);
  vec3 d = pre(texture2D(tSrc, vUv + uTexel * vec2( 1.0,  1.0)).rgb);
  gl_FragColor = vec4((a + b + c + d) * 0.25, 1.0);
}`;

// 13-tap downsample (Jimenez 2014): wide and stable, so small bright lamps do not shimmer.
const DOWN = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  vec2 t = uTexel;
  vec3 A = texture2D(tSrc, vUv + t * vec2(-2.0, -2.0)).rgb, B = texture2D(tSrc, vUv + t * vec2(0.0, -2.0)).rgb, C = texture2D(tSrc, vUv + t * vec2(2.0, -2.0)).rgb;
  vec3 D = texture2D(tSrc, vUv + t * vec2(-2.0, 0.0)).rgb,  E = texture2D(tSrc, vUv).rgb,                        F = texture2D(tSrc, vUv + t * vec2(2.0, 0.0)).rgb;
  vec3 G = texture2D(tSrc, vUv + t * vec2(-2.0, 2.0)).rgb,  H = texture2D(tSrc, vUv + t * vec2(0.0, 2.0)).rgb,  I = texture2D(tSrc, vUv + t * vec2(2.0, 2.0)).rgb;
  vec3 J = texture2D(tSrc, vUv + t * vec2(-1.0, -1.0)).rgb, K = texture2D(tSrc, vUv + t * vec2(1.0, -1.0)).rgb;
  vec3 L = texture2D(tSrc, vUv + t * vec2(-1.0, 1.0)).rgb,  M = texture2D(tSrc, vUv + t * vec2(1.0, 1.0)).rgb;
  vec3 c = E * 0.125 + (A + C + G + I) * 0.03125 + (B + D + F + H) * 0.0625 + (J + K + L + M) * 0.125;
  gl_FragColor = vec4(c, 1.0);
}`;

const UP = /* glsl */`
uniform sampler2D tSrc; uniform sampler2D tAdd; uniform vec2 uTexel; uniform float uSpread;
varying vec2 vUv;
void main() {
  vec2 t = uTexel;
  vec3 c = texture2D(tSrc, vUv).rgb * 4.0;
  c += (texture2D(tSrc, vUv + t * vec2(-1.0, 0.0)).rgb + texture2D(tSrc, vUv + t * vec2(1.0, 0.0)).rgb + texture2D(tSrc, vUv + t * vec2(0.0, -1.0)).rgb + texture2D(tSrc, vUv + t * vec2(0.0, 1.0)).rgb) * 2.0;
  c += texture2D(tSrc, vUv + t * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + t * vec2(1.0, -1.0)).rgb + texture2D(tSrc, vUv + t * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + t * vec2(1.0, 1.0)).rgb;
  gl_FragColor = vec4(texture2D(tAdd, vUv).rgb + c * (uSpread / 16.0), 1.0);
}`;

const FINAL = /* glsl */`
uniform sampler2D tScene; uniform sampler2D tBloom;
uniform float uExposure, uBloom, uVignette, uGrain, uTime, uFade, uSaturation, uContrast;
uniform vec3 uLift, uGain;
uniform vec2 uRes;
varying vec2 vUv;
// ACES fit by Stephen Hill
vec3 rrtOdt(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 c) {
  const mat3 inM = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
  const mat3 outM = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
  return clamp(outM * rrtOdt(inM * c), 0.0, 1.0);
}
float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main() {
  vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uBloom;
  c *= uExposure;
  c = aces(c * 1.05);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSaturation);
  c = c * uGain + uLift * (1.0 - c);
  vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y * 0.82;
  c *= mix(1.0, smoothstep(0.95, 0.25, length(q)), uVignette);
  c = pow(max(c, 0.0), vec3(1.0 / 2.2));
  c = (c - 0.42) * uContrast + 0.42;
  float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
  c += g * uGrain + g / 255.0;
  gl_FragColor = vec4(c * uFade, 1.0);
}`;

function tri() {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  g.setAttribute('uv', new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  return g;
}

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new Scene();
    this.cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new Mesh(tri(), null);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    const mk = (frag, uniforms) => new ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, blending: NoBlending });
    this.mPre = mk(PREFILTER, { tSrc: { value: null }, uTexel: { value: new Vector2() }, uThreshold: { value: 1.0 }, uKnee: { value: 0.5 } });
    this.mDown = mk(DOWN, { tSrc: { value: null }, uTexel: { value: new Vector2() } });
    this.mUp = mk(UP, { tSrc: { value: null }, tAdd: { value: null }, uTexel: { value: new Vector2() }, uSpread: { value: 1.0 } });
    this.mFinal = mk(FINAL, {
      tScene: { value: null }, tBloom: { value: null }, uExposure: { value: 1 }, uBloom: { value: 0.06 }, uVignette: { value: 0.5 }, uGrain: { value: 0.035 },
      uTime: { value: 0 }, uFade: { value: 1 }, uSaturation: { value: 1.05 }, uContrast: { value: 1.03 }, uLift: { value: new Vector3(0, 0, 0) }, uGain: { value: new Vector3(1, 1, 1) }, uRes: { value: new Vector2(1, 1) },
    });
    this.w = 0; this.h = 0; this.msaa = 0; this.levels = 6;
    this.rtMain = null; this.rtNext = null; this.down = []; this.up = [];
  }

  setSize(w, h, msaa) {
    w = Math.max(8, Math.floor(w)); h = Math.max(8, Math.floor(h));
    if (w === this.w && h === this.h && msaa === this.msaa) return;
    this.w = w; this.h = h; this.msaa = msaa;
    const old = [this.rtMain, this.rtNext, ...this.down, ...this.up];
    for (const t of old) if (t) t.dispose();
    const opt = (samples) => ({ type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: true, stencilBuffer: false, samples });
    this.rtMain = new WebGLRenderTarget(w, h, opt(msaa));
    this.rtNext = new WebGLRenderTarget(w, h, opt(msaa));
    this.down = []; this.up = [];
    let cw = w, ch = h;
    for (let i = 0; i < this.levels; i++) {
      cw = Math.max(2, cw >> 1); ch = Math.max(2, ch >> 1);
      const o = { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false, stencilBuffer: false };
      this.down.push(new WebGLRenderTarget(cw, ch, o));
      if (i < this.levels - 1) this.up.push(new WebGLRenderTarget(cw, ch, o));
    }
    this.mFinal.uniforms.uRes.value.set(w, h);
  }

  pass(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.cam);
  }

  // look: { exposure, bloom, threshold, vignette, grain, saturation, contrast, lift:[r,g,b], gain:[r,g,b], spread }
  finish(look, time, fade) {
    const r = this.renderer, d = this.down, u = this.up;
    const auto = r.autoClear; r.autoClear = true;
    this.mPre.uniforms.tSrc.value = this.rtMain.texture;
    this.mPre.uniforms.uTexel.value.set(0.5 / d[0].width, 0.5 / d[0].height);
    this.mPre.uniforms.uThreshold.value = look.threshold;
    this.mPre.uniforms.uKnee.value = look.threshold * 0.5;
    this.pass(this.mPre, d[0]);
    for (let i = 1; i < d.length; i++) {
      this.mDown.uniforms.tSrc.value = d[i - 1].texture;
      this.mDown.uniforms.uTexel.value.set(1 / d[i - 1].width, 1 / d[i - 1].height);
      this.pass(this.mDown, d[i]);
    }
    let src = d[d.length - 1];
    for (let i = d.length - 2; i >= 0; i--) {
      this.mUp.uniforms.tSrc.value = src.texture;
      this.mUp.uniforms.tAdd.value = d[i].texture;
      this.mUp.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      this.mUp.uniforms.uSpread.value = look.spread;
      this.pass(this.mUp, u[i]);
      src = u[i];
    }
    const f = this.mFinal.uniforms;
    f.tScene.value = this.rtMain.texture; f.tBloom.value = src.texture;
    f.uExposure.value = look.exposure; f.uBloom.value = look.bloom; f.uVignette.value = look.vignette; f.uGrain.value = look.grain;
    f.uSaturation.value = look.saturation; f.uContrast.value = look.contrast;
    f.uLift.value.set(look.lift[0], look.lift[1], look.lift[2]); f.uGain.value.set(look.gain[0], look.gain[1], look.gain[2]);
    f.uTime.value = time; f.uFade.value = fade;
    this.pass(this.mFinal, null);
    r.autoClear = auto;
  }

  dispose() { for (const t of [this.rtMain, this.rtNext, ...this.down, ...this.up]) if (t) t.dispose(); }
}

export const DEFAULT_LOOK = { exposure: 1.0, bloom: 0.15, threshold: 1.0, spread: 1.0, vignette: 0.45, grain: 0.03, saturation: 1.05, contrast: 1.03, lift: [0, 0, 0], gain: [1, 1, 1] };

export function mixLook(out, a, b, t) {
  for (const k of ['exposure', 'bloom', 'threshold', 'spread', 'vignette', 'grain', 'saturation', 'contrast']) out[k] = a[k] + (b[k] - a[k]) * t;
  for (const k of ['lift', 'gain']) { out[k] = out[k] || [0, 0, 0]; for (let i = 0; i < 3; i++) out[k][i] = a[k][i] + (b[k][i] - a[k][i]) * t; }
  return out;
}
