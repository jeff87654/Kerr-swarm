// The flight. One world is on screen; the next is built a few milliseconds at a time while you fly, then drawn through
// the opening at the end of this one, so a crossing has no cut: for a moment two worlds are being drawn at once.
import {
  WebGLRenderer, PerspectiveCamera, Vector3, Vector4, Quaternion, Matrix4, Mesh, CircleGeometry, PlaneGeometry, RingGeometry,
  ShaderMaterial, DoubleSide, AdditiveBlending, Color, WebGLRenderTarget, Sphere, Scene, Group,
} from 'three';
import { Post, DEFAULT_LOOK, mixLook } from './post.js';
import { G, CLIP_PARS, CLIP_FRAG, NOISE_GLSL } from '../kit/mats.js';
import { clamp, smootherstep, makeRng } from './rng.js';
import { quatLook } from './path.js';

// Quality tiers. density scales how many trees, people and lamps a world scatters.
export const TIERS = [
  { name: 'Low', density: 0.4, plan: [2048, 1024], msaa: 0, maxDpr: 1, scale: 0.8 },
  { name: 'Medium', density: 0.7, plan: [2048, 1024], msaa: 2, maxDpr: 1.25, scale: 1 },
  { name: 'High', density: 1.0, plan: [4096, 2048], msaa: 4, maxDpr: 1.5, scale: 1 },
  { name: 'Ultra', density: 1.4, plan: [4096, 2048], msaa: 4, maxDpr: 2, scale: 1 },
];

const PORTAL_VERT = /* glsl */`
varying vec3 vW; varying vec2 vQ;
void main() { vQ = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const PORTAL_FRAG = /* glsl */`
${CLIP_PARS}
uniform sampler2D tNext; uniform vec2 uRes; uniform float uLive, uGain, uTime; uniform vec3 uMist;
varying vec3 vW; varying vec2 vQ;
${NOISE_GLSL}
void main() {
  ${CLIP_FRAG}
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 live = texture2D(tNext, uv).rgb * uGain;
  vec2 q = vQ * 6.0;
  float n = kFbm(q + vec2(uTime * 0.13, -uTime * 0.09)) * 0.7 + kFbm(q * 2.3 - vec2(uTime * 0.21, uTime * 0.05)) * 0.3;
  vec3 mist = uMist * (0.35 + 1.1 * n);
  gl_FragColor = vec4(mix(mist, live, uLive), 1.0);
}`;
const RIM_FRAG = /* glsl */`
${CLIP_PARS}
uniform vec3 uColor; uniform float uPower;
varying vec3 vW; varying vec2 vQ;
void main() {
  ${CLIP_FRAG}
  float r = length(vQ - 0.5) * 2.0;                 // 0 at the centre, 1 at the rim of the ring geometry's square
  float a = smoothstep(0.80, 0.90, r) * smoothstep(1.0, 0.92, r);
  gl_FragColor = vec4(uColor * uPower * a, 1.0);
}`;

const _v = new Vector3(), _v2 = new Vector3(), _q = new Quaternion(), _m = new Matrix4(), _m2 = new Matrix4(), _s = new Vector3(1, 1, 1), _sph = new Sphere();
const NOCLIP = new Vector4(0, 0, 0, 1);

export class Engine {
  /**
   * canvas: the page's canvas.  defs: the list of worlds ({ id, build, ...card text }).
   * opts: { tier (0..3 or 'auto'), onWorld(def, inst), onState(state), order(list, seen) -> def }
   */
  constructor(canvas, defs, opts = {}) {
    this.canvas = canvas; this.defs = defs; this.opts = opts;
    const r = this.renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false, depth: false });
    r.autoClear = true; r.setClearColor(0x000000, 1); r.debug.checkShaderErrors = !!opts.debug; r.info.autoReset = false;
    this.post = new Post(r);
    this.cam = new PerspectiveCamera(58, 16 / 9, 0.5, 20000);
    this.vcam = new PerspectiveCamera(58, 16 / 9, 0.5, 20000);
    this.cam.matrixAutoUpdate = false; this.vcam.matrixAutoUpdate = false;
    this.cam.matrixWorldAutoUpdate = false; this.vcam.matrixWorldAutoUpdate = false;
    this.tierIndex = typeof opts.tier === 'number' ? opts.tier : 2;
    this.autoTier = opts.tier === undefined || opts.tier === 'auto';
    this.scale = 1;                 // extra resolution scale chosen by the frame-rate governor
    this.cur = null; this.next = null; this.job = null; this.old = [];
    this.time = 0; this.pace = 1; this.paused = false; this.steady = false;
    this.fade = 0; this.fadeTarget = 1;
    this.look = { ...DEFAULT_LOOK, lift: [0, 0, 0], gain: [1, 1, 1] };
    this.prevLook = null; this.lookBlend = 1;
    this.off = { pos: new Vector3(), quat: new Quaternion(), fov: 0, t: 99 };       // what is left of the crossing's relative pose
    this.pose = { pos: new Vector3(), quat: new Quaternion(), fov: 58, vel: new Vector3() };
    this.frameMs = 16; this.slow = 0; this.fast = 0; this.frames = 0;
    this.seen = []; this.queue = [];
    this.stats = { calls: 0, tris: 0, build: 0, step: 0, waiting: false };
    this.rng = makeRng(Date.now() & 0xffffff);
    this.freeze = false;            // dev: hold the flight where it is
    this.last = 0; this.raf = 0;
    this.resize();
  }

  get tier() { return TIERS[this.tierIndex]; }
  ctx() { return { renderer: this.renderer, q: this.tier, density: this.tier.density, engine: this }; }

  resize() {
    const c = this.canvas, w = c.clientWidth || window.innerWidth, h = c.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.tier.maxDpr) * this.tier.scale * this.scale;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    const bw = this.renderer.domElement.width, bh = this.renderer.domElement.height;
    this.post.setSize(bw, bh, this.tier.msaa);
    G.uRes.value.set(bw, bh);
    this.cam.aspect = this.vcam.aspect = w / h;
    this.cssW = w; this.cssH = h;
  }

  setTier(i) { this.tierIndex = clamp(i, 0, TIERS.length - 1); this.scale = 1; this.resize(); }

  // ---------------------------------------------------------------- building worlds
  begin(def) {
    const gen = def.build(this.ctx());
    this.job = { def, gen, inst: null, t0: performance.now(), spent: 0, stage: 'build', prime: null };
    return this.job;
  }

  // advance the build of the next world for at most `budget` milliseconds
  work(budget) {
    const job = this.job;
    if (!job) return;
    const t0 = performance.now();
    if (job.stage === 'build') {
      try {
        while (performance.now() - t0 < budget) {
          const s0 = performance.now();
          const r = job.gen.next();
          const sd = performance.now() - s0;
          job.steps = (job.steps || 0) + 1;
          if (sd > (job.longest || 0)) { job.longest = sd; job.longestAt = (typeof r.value === 'string' ? r.value : r.done ? 'the end' : 'step ' + job.steps); }
          if (this.opts.debug && sd > 40) (job.slow = job.slow || []).push(`${typeof r.value === 'string' ? r.value : r.done ? 'the end' : 'step ' + job.steps} ${sd.toFixed(0)}`);
          if (r.done) { job.inst = this.finish(job.def, r.value); job.stage = 'compile'; break; }
        }
      } catch (e) {
        console.error('[every-row] world "' + job.def.id + '" failed to build:', e);
        this.failed = (this.failed || new Set()).add(job.def.id);
        this.job = null; return;
      }
      job.spent += performance.now() - t0;
    } else if (job.stage === 'compile') {
      job.stage = 'compiling';
      const inst = job.inst;
      this.placeVcam(inst, inst.entryM);
      const done = () => { if (this.job === job) job.stage = 'prime'; };
      const keep = G.uClip.value.clone();
      G.uClip.value.copy(NOCLIP);
      let p = null;
      try { p = this.renderer.compileAsync(inst.scene, this.vcam); } catch (e) { p = null; }
      G.uClip.value.copy(keep);
      if (p && p.then) p.then(done, done); else done();
    } else if (job.stage === 'prime') {
      // draw each mesh once into a tiny target so its buffers and textures are on the card before it is seen
      const inst = job.inst;
      if (!job.prime) { job.prime = []; inst.scene.traverse((o) => { if (o.isMesh || o.isPoints || o.isLine) job.prime.push(o); }); job.tiny = job.tiny || new WebGLRenderTarget(8, 8); }
      const r = this.renderer;
      this.placeVcam(inst, inst.entryM);
      const prevTarget = r.getRenderTarget();
      r.setRenderTarget(job.tiny);
      while (job.prime.length && performance.now() - t0 < budget) {
        const o = job.prime.pop(), fc = o.frustumCulled;
        o.frustumCulled = false;
        try { r.render(o, this.vcam); } catch (e) { console.error('[every-row] priming ' + job.def.id, e); }
        o.frustumCulled = fc;
      }
      r.setRenderTarget(prevTarget);
      if (!job.prime.length) {
        job.tiny.dispose();
        inst.ready = true; this.stats.build = job.spent; this.stats.step = job.longest || 0;
        if (this.opts.debug) console.log(`[every-row] ${job.def.id} built in ${job.spent.toFixed(0)} ms of work over ${((performance.now() - job.t0) / 1000).toFixed(1)} s; its longest single step took ${(job.longest || 0).toFixed(0)} ms (${job.longestAt || '-'})${job.slow ? '; steps over 40 ms: ' + job.slow.join(', ') : ''}`);
        if (!this.cur) { this.cur = inst; this.enter(inst, null); } else this.next = inst;
        this.job = null;
      }
    }
  }

  // wrap what a world's build returned into a running instance
  finish(def, w) {
    const path = w.path;
    const inst = {
      def, scene: w.scene, path, duration: path.duration, tCross: path.tCross, update: w.update || null, dispose: w.dispose || null,
      look: w.look || {}, near: w.near || 0.5, far: w.far || 20000, t: 0, age: 0, ready: false,
      entry: path.entry, exit: w.portal && w.portal.pos ? { ...path.exit, ...w.portal } : path.exit, portalOpts: w.portal || {},
      sound: w.sound || null, userData: w,
    };
    // the world's own look object, with the defaults filled in: a world may change its numbers in update()
    for (const k in DEFAULT_LOOK) if (inst.look[k] === undefined) inst.look[k] = Array.isArray(DEFAULT_LOOK[k]) ? [...DEFAULT_LOOK[k]] : DEFAULT_LOOK[k];
    inst.entryM = new Matrix4().compose(inst.entry.pos, inst.entry.quat, _s);
    inst.exitM = new Matrix4().compose(inst.exit.pos, inst.exit.quat, _s);
    inst.exitInv = inst.exitM.clone().invert();
    inst.entryFwd = new Vector3(0, 0, -1).applyQuaternion(inst.entry.quat);
    inst.exitFwd = new Vector3(0, 0, -1).applyQuaternion(inst.exit.quat);
    inst.entryClip = new Vector4(inst.entryFwd.x, inst.entryFwd.y, inst.entryFwd.z, -inst.entryFwd.dot(inst.entry.pos) + 0.02 * inst.entry.radius);
    // the opening at the end of this world
    const po = inst.portalOpts, R = inst.exit.radius;
    const mist = new Color(po.mist || def.tone || '#c9b28a');
    const mistK = (po.mistPower === undefined ? 1.2 : po.mistPower) / Math.max(inst.look.exposure || 1, 0.05);
    const pm = new ShaderMaterial({
      uniforms: { uClip: G.uClip, uTime: G.uTime, uRes: G.uRes, tNext: { value: null }, uLive: { value: 0 }, uGain: { value: 1 }, uMist: { value: new Vector3(mist.r, mist.g, mist.b).multiplyScalar(mistK) } },
      vertexShader: PORTAL_VERT, fragmentShader: PORTAL_FRAG, side: DoubleSide,
    });
    const geo = po.shape === 'rect' ? new PlaneGeometry(po.width || R * 2, po.height || R * 2) : new CircleGeometry(R, 72);
    const portal = new Mesh(geo, pm);
    portal.position.copy(inst.exit.pos); portal.quaternion.copy(inst.exit.quat);
    portal.renderOrder = -20;
    inst.scene.add(portal); inst.portal = portal;
    if (po.rim !== false && po.shape !== 'rect') {
      const rim = new Mesh(new PlaneGeometry(R * 2.5, R * 2.5), new ShaderMaterial({
        uniforms: { uClip: G.uClip, uColor: { value: new Vector3(mist.r, mist.g, mist.b) }, uPower: { value: (po.rimPower === undefined ? 3 : po.rimPower) / Math.max(inst.look.exposure || 1, 0.05) } },
        vertexShader: PORTAL_VERT, fragmentShader: RIM_FRAG, side: DoubleSide, transparent: true, depthWrite: false, blending: AdditiveBlending,
      }));
      rim.position.copy(inst.exit.pos); rim.quaternion.copy(inst.exit.quat);
      inst.scene.add(rim); inst.rim = rim;
    }
    inst.scene.updateMatrixWorld(true);
    return inst;
  }

  placeVcam(inst, m) {
    const c = this.vcam;
    c.matrixWorld.copy(m); c.matrixWorldInverse.copy(m).invert();
    c.near = inst.near; c.far = inst.far; c.fov = this.cam.fov; c.aspect = this.cam.aspect; c.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- choosing what comes next
  pick() {
    const failed = this.failed || new Set();
    const ok = this.defs.filter((d) => !failed.has(d.id) && !d.hidden);
    if (!ok.length) return null;
    if (this.opts.only) return ok.find((d) => d.id === this.opts.only) || ok[0];
    while (this.queue.length) { const id = this.queue.shift(), d = ok.find((x) => x.id === id); if (d) return d; }
    if (this.opts.order) { const d = this.opts.order(ok, this.seen, this.cur ? this.cur.def : null); if (d) return d; }
    // the journey in its written order, round and round
    const lastId = this.job ? this.job.def.id : this.next ? this.next.def.id : this.cur ? this.cur.def.id : null;
    const i = ok.findIndex((d) => d.id === lastId);
    return ok[(i + 1) % ok.length];
  }

  /** fly these worlds next, in this order (ids) */
  enqueue(ids) { this.queue.push(...ids); }

  /** drop everything and start at a world */
  jump(id, t = 0) {
    this.dropInst(this.next); this.next = null; this.job = null;
    if (this.cur) { this.dropInst(this.cur); this.cur = null; }
    this.queue.unshift(id); this.startT = t; this.fade = 0;
  }

  dropInst(inst) {
    if (!inst) return;
    try { if (inst.dispose) inst.dispose(); } catch (e) { /* a world's own cleanup must not stop the flight */ }
    inst.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) { for (const k in m.uniforms || {}) { const v = m.uniforms[k].value; if (v && v.isTexture && v !== this.post.rtNext.texture) v.dispose(); } m.dispose(); }
    });
  }

  enter(inst, from) {
    inst.t = this.startT || 0; this.startT = 0;
    this.seen.push(inst.def.id);
    this.prevLook = from ? { ...this.look, lift: [...this.look.lift], gain: [...this.look.gain] } : null;
    this.lookBlend = from ? 0 : 1;
    this.clipT = 0;
    if (this.opts.onWorld) this.opts.onWorld(inst.def, inst, !!from);
  }

  // ---------------------------------------------------------------- one frame
  start() { if (this.raf) return; const tick = (now) => { this.raf = requestAnimationFrame(tick); this.frame(now); }; this.raf = requestAnimationFrame(tick); }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }

  frame(now) {
    const realDt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0.016;
    this.last = now;
    this.frameMs += (realDt * 1000 - this.frameMs) * 0.05;
    this.frames++;
    const r = this.renderer;
    r.info.reset();
    if (!this.paused) this.time += realDt;
    G.uTime.value = this.time;

    // keep a world on the way
    if (!this.job && !this.next) { const d = this.pick(); if (d) this.begin(d); }
    this.work(this.cur ? (this.paused ? 12 : 5) : 14);

    const cur = this.cur;
    if (!cur) { this.fade = 0; this.post.finish(this.look, this.time, 0); this.stats.waiting = true; return; }

    // ---- move along the flight
    let dt = this.paused || this.freeze ? 0 : realDt * this.pace;
    const nextReady = this.next && this.next.ready;
    const hold = cur.tCross - 1.3;
    if (!nextReady) dt *= clamp((hold - cur.t) / 4.0, 0, 1);           // no world to cross into yet: ease to a stop short of the opening
    this.stats.waiting = !nextReady && cur.t > hold - 4;
    cur.t = Math.min(cur.t + dt, cur.duration);
    cur.age += dt;
    cur.path.sample(cur.t, this.pose);
    const cam = this.cam, P = this.pose;
    // what is left of the pose carried across the last opening
    this.off.t += dt;
    const ob = 1 - smootherstep(0, 2.6, this.off.t);
    if (ob > 0) {
      _v.copy(this.off.pos).multiplyScalar(ob).applyQuaternion(P.quat);
      P.pos.add(_v);
      _q.identity().slerp(this.off.quat, ob);
      P.quat.multiply(_q);
      P.fov += this.off.fov * ob;
    }
    if (this.debugCam) {
      // dev: look from anywhere. { p:[x,y,z], look:[x,y,z], flat: true } uses the world's own frame when flat
      const d = this.debugCam, fr = d.flat !== false && cur.path.frame;
      const a = fr ? fr.point(d.p[0], d.p[1], d.p[2]) : new Vector3(d.p[0], d.p[1], d.p[2]);
      const b = fr ? fr.point(d.look[0], d.look[1], d.look[2]) : new Vector3(d.look[0], d.look[1], d.look[2]);
      const up = d.up ? new Vector3(d.up[0], d.up[1], d.up[2]) : new Vector3(-a.x, -a.y, 0);
      if (up.lengthSq() < 1e-4) up.set(0, 1, 0);
      P.pos.copy(a); quatLook(P.quat, b.sub(a), up.normalize()); if (d.fov) P.fov = d.fov;
    }
    if (!this.steady && !this.freeze) {
      // a slow breath in the camera, so nothing is perfectly still
      const s = this.time;
      _q.set(Math.sin(s * 0.31) * 0.004, Math.sin(s * 0.23 + 1.3) * 0.005, Math.sin(s * 0.17 + 0.6) * 0.003, 1).normalize();
      P.quat.multiply(_q);
    }
    cam.near = cur.near; cam.far = cur.far; cam.fov = P.fov; cam.updateProjectionMatrix();
    cam.matrixWorld.compose(P.pos, P.quat, _s); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    cam.position.copy(P.pos); cam.quaternion.copy(P.quat);
    G.uPx.value = (G.uRes.value.y / 2) / Math.tan((cam.fov * Math.PI) / 360);
    if (cur.update) cur.update(cur.t, dt, cam, this);

    // ---- the next world, through the opening
    const post = this.post;
    let live = 0;
    const pm = cur.portal.material.uniforms;
    if (nextReady) {
      const nx = this.next;
      // is the opening on screen, and how big
      const sDist = _v.copy(P.pos).sub(cur.exit.pos).dot(cur.exitFwd);            // negative before the crossing
      _sph.set(cur.exit.pos, cur.exit.radius);
      const dist = P.pos.distanceTo(cur.exit.pos);
      const pxR = cur.exit.radius * G.uPx.value / Math.max(dist, 0.01);
      // only for the last stretch of the flight (portal.openFor seconds, default 16): before that the opening holds mist
      const inView = sDist < 0 && pxR > 1.5 && cur.t > cur.tCross - (cur.portalOpts.openFor || 16)
        && _v2.copy(cur.exit.pos).sub(P.pos).normalize().dot(_v.set(0, 0, -1).applyQuaternion(P.quat)) > 0.2;
      if (inView) {
        live = 1;
        const k = nx.entry.radius / cur.exit.radius;
        _m.multiplyMatrices(cur.exitInv, cam.matrixWorld);
        _m.elements[12] *= k; _m.elements[13] *= k; _m.elements[14] *= k;
        _m2.multiplyMatrices(nx.entryM, _m);
        this.placeVcam(nx, _m2);
        this.vcam.position.setFromMatrixPosition(_m2);
        nx.age += realDt;
        if (nx.update) nx.update(0, this.paused ? 0 : realDt, this.vcam, this);
        G.uClip.value.copy(nx.entryClip);
        const rt = post.rtNext;
        // only the part of the picture the opening covers needs drawing
        const sc = this.scissorOf(cur.exit.pos, cur.exit.radius * 1.05, rt.width, rt.height);
        rt.scissorTest = true; rt.scissor.set(sc[0], sc[1], sc[2], sc[3]);
        r.setRenderTarget(rt);
        r.render(nx.scene, this.vcam);
        pm.tNext.value = rt.texture;
        pm.uGain.value = nx.look.exposure / cur.look.exposure;
        // ---- crossing
        const speed = P.vel ? P.vel.length() : 0;
        if (-sDist <= cur.near * 1.4 + speed * dt * 1.2 && cur.t > cur.tCross - 2) { this.cross(nx); return this.frameAfterCross(); }
      }
    }
    pm.uLive.value += (live - pm.uLive.value) * Math.min(1, realDt * 4);
    if (live && pm.uLive.value < 0.02) pm.uLive.value = 0.02;

    this.draw(cur, realDt);
  }

  frameAfterCross() {
    // the world we were looking into is now the one we are in: draw it straight away from the same eye
    const cur = this.cur, P = this.pose, cam = this.cam;
    cur.path.sample(cur.t, P);
    _v.copy(this.off.pos).applyQuaternion(P.quat); P.pos.add(_v); P.quat.multiply(this.off.quat); P.fov += this.off.fov;
    cam.near = cur.near; cam.far = cur.far; cam.fov = P.fov; cam.updateProjectionMatrix();
    cam.matrixWorld.compose(P.pos, P.quat, _s); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    cam.position.copy(P.pos); cam.quaternion.copy(P.quat);
    this.draw(cur, 0.016);
  }

  cross(nx) {
    const cur = this.cur, cam = this.cam;
    // the eye's pose relative to the opening, carried into the new world and eased away
    const k = nx.entry.radius / cur.exit.radius;
    _m.multiplyMatrices(cur.exitInv, cam.matrixWorld);
    _m.decompose(this.off.pos, this.off.quat, _v);
    this.off.pos.multiplyScalar(k);
    this.off.fov = cam.fov - nx.entry.fov;
    this.off.t = 0;
    this.old.push(cur);
    this.cur = nx; this.next = null;
    this.enter(nx, cur);
    nx.t = 0;
  }

  draw(cur, realDt) {
    const r = this.renderer, post = this.post;
    // for a moment after a crossing nothing behind the entry is drawn
    this.clipT = (this.clipT || 0) + realDt;
    if (this.seen.length > 1 && this.clipT < 1.5) G.uClip.value.copy(cur.entryClip); else G.uClip.value.copy(NOCLIP);
    post.rtMain.scissorTest = false;
    r.setRenderTarget(post.rtMain);
    r.render(cur.scene, this.cam);
    this.stats.calls = r.info.render.calls; this.stats.tris = r.info.render.triangles;
    // look: ease from the last world's grade to this one's, but take its exposure at once
    if (this.lookBlend < 1 && this.prevLook) { this.lookBlend = Math.min(1, this.lookBlend + realDt / 1.6); mixLook(this.look, this.prevLook, cur.look, smootherstep(0, 1, this.lookBlend)); this.look.exposure = cur.look.exposure; }
    else mixLook(this.look, cur.look, cur.look, 1);
    this.fade += (this.fadeTarget - this.fade) * Math.min(1, realDt * 1.6);
    post.finish(this.look, this.time, this.fade);
    // worlds left behind are freed a little later, off the crossing frame
    if (this.old.length && this.clipT > 0.5) this.dropInst(this.old.shift());
    this.govern(realDt);
  }

  // the rectangle of the picture a sphere covers, in target pixels
  scissorOf(center, radius, w, h) {
    const cam = this.cam;
    _v.copy(center).applyMatrix4(cam.matrixWorldInverse);
    const z = -_v.z;
    if (z < radius * 1.2) return [0, 0, w, h];
    const f = (h / 2) / Math.tan((cam.fov * Math.PI) / 360);
    const cx = w / 2 + (_v.x / z) * f, cy = h / 2 + (_v.y / z) * f;
    const rr = (radius / Math.sqrt(Math.max(z * z - radius * radius, 1e-6))) * f * 1.25 + 4;
    const x0 = clamp(Math.floor(cx - rr), 0, w), y0 = clamp(Math.floor(cy - rr), 0, h), x1 = clamp(Math.ceil(cx + rr), 0, w), y1 = clamp(Math.ceil(cy + rr), 0, h);
    return [x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)];
  }

  // keep the frame rate: trade resolution first, slowly
  govern(dt) {
    if (!this.autoTier || this.paused || this.freeze) return;
    if (this.frames < 120) return;
    if (this.frameMs > 24) this.slow += dt; else this.slow = Math.max(0, this.slow - dt * 0.5);
    if (this.frameMs < 13) this.fast += dt; else this.fast = 0;
    if (this.slow > 2.5) { this.slow = 0; if (this.scale > 0.55) { this.scale = Math.max(0.5, this.scale * 0.84); this.resize(); } else if (this.tierIndex > 0) { this.tierIndex--; this.scale = 0.85; this.resize(); } }
    if (this.fast > 12 && this.scale < 1) { this.fast = 0; this.scale = Math.min(1, this.scale * 1.12); this.resize(); }
  }

  /** skip ahead to just before this world's opening */
  skip() { const c = this.cur; if (c) c.t = Math.max(c.t, c.tCross - 5.5); }
}
