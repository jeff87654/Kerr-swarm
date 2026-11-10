// The frame: overhead shadow maps -> G-buffer -> ambient occlusion -> reflections -> deferred lighting -> background ->
// forward (glass, water, glows) -> temporal anti-aliasing -> bloom -> exposure -> grade.
import * as THREE from 'three';
import { VERT_FULLSCREEN } from './glsl.js';
import { LIGHT_FRAG } from './lightpass.js';
import { SSAO_FRAG, SSAO_BLUR_FRAG, SSR_FRAG, TAA_FRAG, BLOOM_DOWN_FRAG, BLOOM_UP_FRAG, EXPOSURE_FRAG, FINAL_FRAG, COPY_FRAG } from './postfx.js';
import { worldUniforms } from './worldmat.js';
import { DRUM } from '../core/drum.js';

const HALTON = [[0.5, 0.3333], [0.25, 0.6667], [0.75, 0.1111], [0.125, 0.4444], [0.625, 0.7778], [0.375, 0.2222], [0.875, 0.5556], [0.0625, 0.8889]];

function fsMat(frag, uniforms) {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: 'precision highp float;\n' + VERT_FULLSCREEN, fragmentShader: frag, uniforms,
    depthTest: false, depthWrite: false, blending: THREE.NoBlending,
  });
}
function rt(w, h, type, opts = {}) {
  const t = new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), Object.assign({
    type, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
  }, opts));
  t.texture.colorSpace = THREE.NoColorSpace;
  return t;
}

export const QUALITY = {
  low:    { scale: 0.6,  ssao: false, ssr: false, shadowRoom: 512,  shadowSky: 1024, bloomLevels: 4, maxLights: 96,  taa: true },
  medium: { scale: 0.75, ssao: true,  ssr: false, shadowRoom: 1024, shadowSky: 1024, bloomLevels: 5, maxLights: 160, taa: true },
  high:   { scale: 1.0,  ssao: true,  ssr: true,  shadowRoom: 1024, shadowSky: 2048, bloomLevels: 6, maxLights: 192, taa: true },
  ultra:  { scale: 1.0,  ssao: true,  ssr: true,  shadowRoom: 2048, shadowSky: 2048, bloomLevels: 6, maxLights: 320, taa: true },
};

export class Pipeline {
  constructor(canvas, lights, opts = {}) {
    this.canvas = canvas;
    this.lights = lights;
    const renderer = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.preserve });
    THREE.ColorManagement.enabled = false;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.autoClear = false;
    renderer.sortObjects = false;
    renderer.info.autoReset = false;
    this.gl = renderer.getContext();
    this.floatOK = !!this.gl.getExtension('EXT_color_buffer_float');
    this.gl.getExtension('EXT_color_buffer_half_float');
    this.quality = Object.assign({}, QUALITY[opts.quality || 'high']);
    this.scaleOverride = null;
    this.frame = 0;
    this.time = 0;
    this.debug = 0;
    this.stats = { calls: 0, tris: 0, lights: 0 };

    this.quad = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3)), null);
    this.quad.frustumCulled = false;
    this.quadScene = new THREE.Scene(); this.quadScene.add(this.quad);
    this.quadCam = new THREE.Camera();
    this.shadowCam = new THREE.Camera();       // only its layer mask matters; the shadow vertex shader projects by itself

    // environment (set by the game each frame)
    this.env = {
      bg: new THREE.Color(0.004, 0.004, 0.006), exposure: 1.0, autoKey: 0.2, autoMin: 0.35, autoMax: 3.0, adaptRate: 1.6,
      bloom: 0.045, contrast: 1.12, saturation: 1.08, warmth: 0.3, vignette: 0.28, sharp: 0.35, fade: 0,
      sun: 0,                                            // sunline intensity (0 = no sunline here)
      shadowRoom: { halfExtent: 26, rhoNear: 0, rhoFar: 1 },   // rhoNear/rhoFar set per frame by the world
      shadowSky: null,                                   // { near: {halfExtent, rhoNear, rhoFar}, far: {...} } in the Hollow and atria
      near: 0.1, far: 900,
    };

    this._m = { projInv: new THREE.Matrix4(), camRot: new THREE.Matrix3(), camRotInv: new THREE.Matrix3(), view: new THREE.Matrix4(), viewInv: new THREE.Matrix4(),
      projUnj: new THREE.Matrix4(), prevVP: new THREE.Matrix4(), A: new THREE.Matrix4(), Aprev: new THREE.Matrix4(), T: new THREE.Matrix4(), tmp: new THREE.Matrix4(), tmp2: new THREE.Matrix4(),
      reproj: new THREE.Matrix4(), reprojView: new THREE.Matrix4(), hasPrev: false };

    // sunline colour texture (painted by the game's lamp-painters): 64 along the line x 32 round the azimuth
    this.sunData = new Float32Array(64 * 32 * 4).fill(1);
    this.sunTex = new THREE.DataTexture(this.sunData, 64, 32, THREE.RGBAFormat, THREE.FloatType);
    this.sunTex.minFilter = this.sunTex.magFilter = THREE.LinearFilter; this.sunTex.wrapT = THREE.RepeatWrapping; this.sunTex.wrapS = THREE.ClampToEdgeWrapping;
    this.sunTex.needsUpdate = true;

    this._buildMaterials();
    this.w = 0; this.h = 0;
    this.backgroundPass = null;       // optional: (pipeline, targets) => void, draws where depth == 1 (the Hollow's far bank)
    this.setQuality(opts.quality || 'high');
  }

  setQuality(name) {
    this.qualityName = name;
    this.quality = Object.assign({}, QUALITY[name] || QUALITY.high);
    this.lights.maxActive = this.quality.maxLights;
    this._buildShadowTargets();
    if (this.cssW) this.setSize(this.cssW, this.cssH, this.pixelRatio);
  }

  _buildShadowTargets() {
    const mk = (size) => {
      const t = new THREE.WebGLRenderTarget(size, size, { depthBuffer: true, stencilBuffer: false, generateMipmaps: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
      t.depthTexture = new THREE.DepthTexture(size, size, THREE.UnsignedIntType);
      t.depthTexture.minFilter = t.depthTexture.magFilter = THREE.NearestFilter;
      return t;
    };
    for (const k of ['shRoom', 'shSky0', 'shSky1']) if (this[k]) { this[k].depthTexture.dispose(); this[k].dispose(); }
    this.shRoom = mk(this.quality.shadowRoom);
    this.shSky0 = mk(this.quality.shadowSky);
    this.shSky1 = mk(Math.min(1024, this.quality.shadowSky));
    this._shadowsCleared = false;
  }

  setSize(cssW, cssH, pixelRatio) {
    this.cssW = cssW; this.cssH = cssH; this.pixelRatio = pixelRatio;
    const renderer = this.renderer;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(cssW, cssH, false);
    const scale = this.scaleOverride || this.quality.scale;
    const W = Math.max(64, Math.round(cssW * pixelRatio * scale)), H = Math.max(64, Math.round(cssH * pixelRatio * scale));
    if (W === this.w && H === this.h && this.gbuf) return;
    this.w = W; this.h = H;
    const HF = THREE.HalfFloatType;
    const dispose = (t) => { if (t) { if (t.depthTexture) t.depthTexture.dispose(); t.dispose(); } };
    if (this.fwd) this.fwd.dispose();
    dispose(this.gbuf); dispose(this.lit); dispose(this.taaA); dispose(this.taaB); dispose(this.aoA); dispose(this.aoB); dispose(this.ssr);
    if (this.bloomD) { this.bloomD.forEach(dispose); this.bloomU.forEach(dispose); }

    const gbuf = this.gbuf = new THREE.WebGLRenderTarget(W, H, { count: 3, type: THREE.UnsignedByteType, format: THREE.RGBAFormat, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, stencilBuffer: false, generateMipmaps: false });
    gbuf.textures[1].type = HF; gbuf.textures[2].type = HF;
    for (const t of gbuf.textures) { t.colorSpace = THREE.NoColorSpace; t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; }
    gbuf.depthTexture = new THREE.DepthTexture(W, H, THREE.UnsignedIntType);
    gbuf.depthTexture.minFilter = gbuf.depthTexture.magFilter = THREE.NearestFilter;

    this.lit = rt(W, H, HF);
    this.fwd = rt(W, H, HF, { depthBuffer: true });
    this.fwd.depthTexture = gbuf.depthTexture;          // forward passes test against the scene's depth (and must not sample it)
    this.taaA = rt(W, H, HF); this.taaB = rt(W, H, HF);
    const hw = Math.ceil(W / 2), hh = Math.ceil(H / 2);
    this.aoA = rt(hw, hh, THREE.HalfFloatType); this.aoB = rt(hw, hh, THREE.HalfFloatType);
    this.ssr = rt(hw, hh, HF);
    this.bloomD = []; this.bloomU = [];
    let bw = hw, bh = hh;
    for (let i = 0; i < this.quality.bloomLevels; i++) { this.bloomD.push(rt(bw, bh, HF)); this.bloomU.push(rt(bw, bh, HF)); bw = Math.max(2, bw >> 1); bh = Math.max(2, bh >> 1); }
    if (!this.expA) { this.expA = rt(1, 1, HF, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }); this.expB = rt(1, 1, HF, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }); this._expInit = false; }
    this._m.hasPrev = false;
  }

  _buildMaterials() {
    const L = this.lights;
    const sh = () => ({
      tShRoom: { value: null }, tShSky0: { value: null }, tShSky1: { value: null },
      uShRoom: { value: new THREE.Vector4() }, uShRoomRho: { value: new THREE.Vector2(0, 1) },
      uShSky0: { value: new THREE.Vector4() }, uShSky0Rho: { value: new THREE.Vector2(0, 1) },
      uShSky1: { value: new THREE.Vector4() }, uShSky1Rho: { value: new THREE.Vector2(0, 1) },
      uShSkyOn: { value: 0 }, uFrame: worldUniforms.uFrame,
    });
    this.shadowU = sh();
    this.clusterU = { tLights: { value: L.lightTex }, tClusters: { value: L.clusterTex }, tIndices: { value: L.indexTex } };
    this.mLight = fsMat(LIGHT_FRAG, Object.assign({
      tAlbedo: { value: null }, tNormal: { value: null }, tEmissive: { value: null }, tDepth: { value: null }, tAO: { value: null }, tSSR: { value: null },
      tSunline: { value: this.sunTex },
      uProjInv: { value: this._m.projInv }, uCamRot: { value: this._m.camRot }, uBg: { value: new THREE.Color() }, uSSROn: { value: 0 }, uAOOn: { value: 0 },
      uSunSeg: { value: new THREE.Vector3() }, uAnchorTheta: { value: 0 }, uAnchorRho: worldUniforms.uAnchorRho, uDebug: { value: 0 },
    }, this.clusterU, this.shadowU, L.ambU));
    this.mSSAO = fsMat(SSAO_FRAG, { tDepth: { value: null }, tNormal: { value: null }, uProjInv: { value: this._m.projInv }, uCamRotInv: { value: this._m.camRotInv }, uProjScale: { value: new THREE.Vector2() }, uRadius: { value: 0.55 }, uIntensity: { value: 1.35 }, uFrame: worldUniforms.uFrame });
    this.mSSAOBlur = fsMat(SSAO_BLUR_FRAG, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.mSSR = fsMat(SSR_FRAG, { tDepth: { value: null }, tNormal: { value: null }, tHist: { value: null }, uProj: { value: new THREE.Matrix4() }, uProjInv: { value: this._m.projInv }, uCamRotInv: { value: this._m.camRotInv }, uReprojView: { value: this._m.reprojView }, uZAB: { value: new THREE.Vector2() }, uFrame: worldUniforms.uFrame });
    this.mTAA = fsMat(TAA_FRAG, { tCur: { value: null }, tHist: { value: null }, tDepth: { value: null }, uReproj: { value: this._m.reproj }, uTexel: { value: new THREE.Vector2() }, uBlend: { value: 0.1 } });
    this.mDown = fsMat(BLOOM_DOWN_FRAG, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uFirst: { value: 0 } });
    this.mUp = fsMat(BLOOM_UP_FRAG, { tSrc: { value: null }, tBase: { value: null }, uTexel: { value: new THREE.Vector2() }, uRadius: { value: 1.0 } });
    this.mExp = fsMat(EXPOSURE_FRAG, { tSrc: { value: null }, tPrev: { value: null }, uRate: { value: 1 } });
    this.mFinal = fsMat(FINAL_FRAG, { tColor: { value: null }, tBloom: { value: null }, tExposure: { value: null }, uTexel: { value: new THREE.Vector2() }, uBloom: { value: 0.05 }, uExposure: { value: 1 }, uAuto: { value: new THREE.Vector3(0.2, 0.3, 3) }, uSharp: { value: 0.3 }, uTime: { value: 0 }, uGrade: { value: new THREE.Vector4(1.1, 1.05, 0.3, 0.3) }, uFadeBlack: { value: 0 } });
    this.mCopy = fsMat(COPY_FRAG, { tSrc: { value: null } });
  }

  _pass(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCam);
  }

  // Render one overhead shadow map. cfg: { halfExtent, rhoNear, rhoFar }; centre is the camera anchor (so dTheta = 0, dz = 0).
  _shadow(target, cfg, anchor, world, bit, uVec, uRho) {
    const su = world.mats.shadowUniforms;
    // snap the centre to texels so the map does not swim as the camera moves
    const texel = (2 * cfg.halfExtent) / target.width;
    const cz = -(((anchor.z % texel) + texel) % texel);
    const arc = anchor.theta * cfg.refRho;
    const cx = -(((arc % texel) + texel) % texel) / cfg.refRho;
    su.uShadow.value.set(cx, cz, cfg.halfExtent, cfg.refRho);
    su.uShadowRho.value.set(cfg.rhoNear, cfg.rhoFar);
    uVec.value.copy(su.uShadow.value); uRho.value.copy(su.uShadowRho.value);
    world.prepareShadow(bit, cfg);
    this.shadowCam.layers.mask = bit;
    this.renderer.setRenderTarget(target);
    this.renderer.clear(true, true, false);
    this.renderer.render(world.scene, this.shadowCam);
    world.finishShadow(bit);
  }

  // world: { scene, fwdScene, mats, prepareMain(camera), prepareShadow(bit, cfg), finishShadow(bit) }
  // camera: a PerspectiveCamera whose matrixWorld is a pure rotation (the camera is the origin of render space)
  render(world, camera, anchor, dt) {
    const renderer = this.renderer, env = this.env, m = this._m, q = this.quality;
    this.frame++; this.time += dt;
    renderer.info.reset();
    const W = this.w, H = this.h;
    worldUniforms.uAnchorRho.value = anchor.rho;
    worldUniforms.uTime.value = this.time;
    worldUniforms.uFrame.value = this.frame % 64;

    // --- camera matrices and jitter
    camera.near = env.near; camera.far = env.far;
    camera.updateProjectionMatrix();
    m.projUnj.copy(camera.projectionMatrix);
    const j = HALTON[this.frame % 8];
    const jx = q.taa ? (j[0] - 0.5) * 2 / W : 0, jy = q.taa ? (j[1] - 0.5) * 2 / H : 0;
    camera.projectionMatrix.elements[8] += jx; camera.projectionMatrix.elements[9] += jy;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    m.projInv.copy(camera.projectionMatrixInverse);
    m.camRot.setFromMatrix4(camera.matrixWorld);
    m.camRotInv.setFromMatrix4(camera.matrixWorldInverse);
    // anchor transform: drum-fixed Cartesian -> this frame's render space
    m.A.makeRotationZ(-anchor.theta); m.tmp.makeTranslation(0, anchor.rho, -anchor.z); m.A.premultiply(m.tmp);
    if (m.hasPrev) {
      // T = Aprev * A^-1 : this frame's render space -> last frame's
      m.T.copy(m.A).invert().premultiply(m.Aprev);
      m.reprojView.copy(m.prevVP).multiply(m.T).multiply(camera.matrixWorld);           // view (this frame) -> prev clip
      m.reproj.copy(m.reprojView).multiply(camera.projectionMatrixInverse);             // clip (this frame) -> prev clip
    } else { m.reproj.identity(); m.reprojView.copy(camera.projectionMatrix); }

    // --- lights
    this.lights.update(anchor, camera, world.scopeVisible);
    this.stats.lights = this.lights.count;

    // --- shadows
    const su = this.shadowU;
    if (!this._shadowsCleared) {
      for (const t of [this.shRoom, this.shSky0, this.shSky1]) { renderer.setRenderTarget(t); renderer.clear(true, true, false); }
      this._shadowsCleared = true;
    }
    const sr = env.shadowRoom;
    // The maps are fixed to the drum, not the camera, so a map drawn last frame is still right this frame: draw each
    // every other frame (the room map on even frames, the near sky map on odd ones). Their uniforms are relative to
    // the anchor, so those are refreshed every frame from where the map was drawn.
    const even = this.frame % 2 === 0, S = this._shSaved || (this._shSaved = { room: null, sky0: null });
    const redo = (key, anchorNow, uVec) => { const k = S[key]; if (!k) return false; uVec.value.x = k.th - anchorNow.theta; uVec.value.y = k.z - anchorNow.z; return true; };
    if (even || !S.room || Math.abs(S.room.rhoNear - sr.rhoNear) > 0.3) {
      this._shadow(this.shRoom, { halfExtent: sr.halfExtent, rhoNear: sr.rhoNear, rhoFar: sr.rhoFar, refRho: anchor.rho }, anchor, world, 2, su.uShRoom, su.uShRoomRho);
      S.room = { th: su.uShRoom.value.x + anchor.theta, z: su.uShRoom.value.y + anchor.z, rhoNear: sr.rhoNear };
    } else redo('room', anchor, su.uShRoom);
    if (env.shadowSky) {
      const ss = env.shadowSky;
      if (!even || !S.sky0 || !this._skyOn) {
        this._shadow(this.shSky0, { halfExtent: ss.near.halfExtent, rhoNear: ss.near.rhoNear, rhoFar: ss.near.rhoFar, refRho: anchor.rho }, anchor, world, 4, su.uShSky0, su.uShSky0Rho);
        S.sky0 = { th: su.uShSky0.value.x + anchor.theta, z: su.uShSky0.value.y + anchor.z };
      } else redo('sky0', anchor, su.uShSky0);
      this._skyOn = true;
      if (!ss.far) { su.uShSky1.value.set(0, 0, 0.0001, anchor.rho); this._skyFarDone = false; }
      else if (this.frame % 4 === 0 || !this._skyFarDone) {
        this._shadow(this.shSky1, { halfExtent: ss.far.halfExtent, rhoNear: ss.far.rhoNear, rhoFar: ss.far.rhoFar, refRho: anchor.rho }, anchor, world, 8, su.uShSky1, su.uShSky1Rho);
        S.sky1 = { th: su.uShSky1.value.x + anchor.theta, z: su.uShSky1.value.y + anchor.z };
        this._skyFarDone = true;
      } else if (S.sky1) { su.uShSky1.value.x = S.sky1.th - anchor.theta; su.uShSky1.value.y = S.sky1.z - anchor.z; }
      su.uShSkyOn.value = 1;
    } else { su.uShSkyOn.value = 0; this._skyFarDone = false; this._skyOn = false; }
    su.tShRoom.value = this.shRoom.depthTexture; su.tShSky0.value = this.shSky0.depthTexture; su.tShSky1.value = this.shSky1.depthTexture;

    // --- G-buffer
    world.prepareMain(camera);
    renderer.setRenderTarget(this.gbuf);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, false);
    renderer.render(world.scene, camera);
    this.stats.calls = renderer.info.render.calls; this.stats.tris = renderer.info.render.triangles;

    const gA = this.gbuf.textures[0], gN = this.gbuf.textures[1], gE = this.gbuf.textures[2], gD = this.gbuf.depthTexture;
    const hist = this.frame % 2 ? this.taaA : this.taaB, out = this.frame % 2 ? this.taaB : this.taaA;

    // --- ambient occlusion
    if (q.ssao) {
      const u = this.mSSAO.uniforms; u.tDepth.value = gD; u.tNormal.value = gN;
      u.uProjScale.value.set(camera.projectionMatrix.elements[0], camera.projectionMatrix.elements[5]);
      this._pass(this.mSSAO, this.aoA);
      const b = this.mSSAOBlur.uniforms; b.tSrc.value = this.aoA.texture; b.uTexel.value.set(1 / this.aoA.width, 1 / this.aoA.height);
      this._pass(this.mSSAOBlur, this.aoB);
    }
    // --- reflections (from last frame's picture)
    const ssrOn = q.ssr && m.hasPrev;
    if (ssrOn) {
      const u = this.mSSR.uniforms; u.tDepth.value = gD; u.tNormal.value = gN; u.tHist.value = hist.texture;
      u.uProj.value.copy(camera.projectionMatrix);
      const e = camera.projectionMatrix.elements; u.uZAB.value.set(e[10], e[14]);
      this._pass(this.mSSR, this.ssr);
    }
    // --- lighting
    {
      const u = this.mLight.uniforms;
      u.tAlbedo.value = gA; u.tNormal.value = gN; u.tEmissive.value = gE; u.tDepth.value = gD;
      u.tAO.value = this.aoB.texture; u.uAOOn.value = q.ssao ? 1 : 0;
      u.tSSR.value = this.ssr.texture; u.uSSROn.value = ssrOn ? 1 : 0;
      u.uBg.value.copy(env.bg);
      u.uSunSeg.value.set(DRUM.SUN_Z0 - anchor.z, DRUM.SUN_Z1 - anchor.z, env.sun);
      u.uAnchorTheta.value = anchor.theta;
      u.uDebug.value = this.debug;
      this.quad.material = this.mLight;
      renderer.setRenderTarget(this.lit);
      renderer.render(this.quadScene, this.quadCam);
    }
    // --- background (the far bank) and forward geometry, both into the lit target against the scene depth
    if (this.backgroundPass) this.backgroundPass(this, camera, anchor);
    let litTex = this.lit.texture;
    if (world.fwdScene && world.fwdScene.children.length) {
      world.prepareForward(camera, this);
      this.mCopy.uniforms.tSrc.value = this.lit.texture;
      this._pass(this.mCopy, this.fwd);
      renderer.render(world.fwdScene, camera);
      litTex = this.fwd.texture;
    }

    // --- temporal anti-aliasing
    let color = litTex;
    if (q.taa) {
      const u = this.mTAA.uniforms; u.tCur.value = litTex; u.tHist.value = hist.texture; u.tDepth.value = gD;
      u.uTexel.value.set(1 / W, 1 / H); u.uBlend.value = m.hasPrev ? 0.1 : 1.0;
      this._pass(this.mTAA, out);
      color = out.texture;
    }
    // --- bloom
    {
      const d = this.mDown.uniforms, up = this.mUp.uniforms, n = this.bloomD.length;
      let src = color, sw = W, sh2 = H;
      for (let i = 0; i < n; i++) {
        d.tSrc.value = src; d.uTexel.value.set(1 / sw, 1 / sh2); d.uFirst.value = i === 0 ? 1 : 0;
        this._pass(this.mDown, this.bloomD[i]);
        src = this.bloomD[i].texture; sw = this.bloomD[i].width; sh2 = this.bloomD[i].height;
      }
      let small = this.bloomD[n - 1].texture, tw = this.bloomD[n - 1].width, th = this.bloomD[n - 1].height;
      for (let i = n - 2; i >= 0; i--) {
        up.tSrc.value = small; up.tBase.value = this.bloomD[i].texture; up.uTexel.value.set(1 / tw, 1 / th);
        this._pass(this.mUp, this.bloomU[i]);
        small = this.bloomU[i].texture; tw = this.bloomU[i].width; th = this.bloomU[i].height;
      }
      this._bloomTex = this.bloomU[0].texture; this._bloomNorm = 1 / n;
    }
    // --- exposure adaptation
    {
      const a = this.frame % 2 ? this.expA : this.expB, b = this.frame % 2 ? this.expB : this.expA;
      const u = this.mExp.uniforms; u.tSrc.value = this.bloomD[Math.min(3, this.bloomD.length - 1)].texture; u.tPrev.value = a.texture;
      u.uRate.value = this._expInit ? 1 - Math.exp(-dt * env.adaptRate) : 1; this._expInit = true;
      this._pass(this.mExp, b);
      this._expTex = b.texture;
    }
    // --- final
    {
      const u = this.mFinal.uniforms;
      u.tColor.value = color; u.tBloom.value = this._bloomTex; u.tExposure.value = this._expTex;
      u.uTexel.value.set(1 / W, 1 / H); u.uBloom.value = env.bloom * this._bloomNorm; u.uExposure.value = env.exposure;
      u.uAuto.value.set(env.autoKey, env.autoMin, env.autoMax); u.uSharp.value = env.sharp; u.uTime.value = this.time;
      u.uGrade.value.set(env.contrast, env.saturation, env.warmth, env.vignette); u.uFadeBlack.value = env.fade;
      this._pass(this.mFinal, null);
    }
    // remember this frame for the next one's reprojection
    m.prevVP.copy(m.projUnj).multiply(camera.matrixWorldInverse);
    m.Aprev.copy(m.A);
    m.hasPrev = true;
    camera.projectionMatrix.copy(m.projUnj);
  }

  resetHistory() { this._m.hasPrev = false; this._expInit = false; }
}
