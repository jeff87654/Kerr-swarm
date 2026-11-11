// The world container: frames, scopes (one per place module), chunked static batches, renderable bookkeeping
// (visibility, the per-mesh drum placement the shaders read), lights, colliders and the registries people and the
// player use (spots, interactions, triggers).
import * as THREE from 'three';
import { MeshBuf, Geo, isCutoutLayer } from './meshbuilder.js';
import { createWorldMaterials, FLAG } from '../render/worldmat.js';
import { Frame, flatToRender, cylToRender } from '../core/drum.js';
import { Colliders } from '../sim/collide.js';
import { wrapPi, hexLin } from '../core/util.js';
import { LIGHT, LF } from '../render/lights.js';

const CHUNK = 28;                 // metres (bigger chunks mean fewer draw calls, which is what costs here)
const FAR_STRUCT = 340, FAR_FURNITURE = 75, FAR_DETAIL = 38;
const _c = { x: 0, y: 0, z: 0 };
let _rem = new Int32Array(8192);

export class World {
  constructor(lights) {
    this.lights = lights;
    this.scene = new THREE.Scene(); this.scene.matrixAutoUpdate = false; this.scene.matrixWorldAutoUpdate = false;
    this.fwdScene = new THREE.Scene(); this.fwdScene.matrixAutoUpdate = false; this.fwdScene.matrixWorldAutoUpdate = false;
    this.mats = createWorldMaterials();
    this.frames = new Map();
    this.scopes = new Map();
    this.renderables = [];
    this.anchor = { theta: 0, rho: 3000, z: 0 };
    this.collide = new Map();          // frame id -> Colliders
    this.spots = [];                   // places for people to be: { type, frame, x, y, z, yaw, tags, scope, taken }
    this.interacts = [];               // things the player can use
    this.triggers = [];                // volumes that fire when the player walks in
    this.zones = [];                   // named regions (see Scope.zoneBox)
    this.navs = new Map();             // frame id -> Nav
    this.dynamics = [];                // things with an update(dt): doors, lifts, vehicles
    this.fwdMats = { glass: null, glow: null };
    this.game = null;
    this.culler = null;                // optional (meshUserData) => bool: a cheap extra visibility test (see game/systems.js)
    this.courts = [];                  // atria open through several decks: { frame, x0, x1, z0, z1, scope } (see Scope.court)
    this.managedSpots = 0;             // spots of scopes that tell the people about themselves (city blocks): see Scope opts.managed
    this.shadowRange = { room: 26, sky0: 48, sky1: 300 };
    this._frustum = new THREE.Frustum(); this._pv = new THREE.Matrix4(); this._sph = new THREE.Sphere();
    this.scopeVisible = (s) => s.active && s.visible;
    this.stats = { meshes: 0, shown: 0 };
  }

  frame(id, rho0, theta0 = 0, z0 = 0) {
    let f = this.frames.get(id);
    if (!f) { f = new Frame(id, rho0, theta0, z0); this.frames.set(id, f); this.collide.set(id, new Colliders()); }
    return f;
  }
  colliders(frame) { return this.collide.get(typeof frame === 'string' ? frame : frame.id); }
  // Forget a frame that a region made, once every scope in it has been disposed.
  removeFrame(id) {
    for (const sc of [...this.scopes.values()]) if (sc.frame && sc.frame.id === id) sc.dispose();
    this.frames.delete(id); this.collide.delete(id); this.navs.delete(id);
  }
  nav(frame) { const id = typeof frame === 'string' ? frame : frame.id; let n = this.navs.get(id); if (!n) this.navs.set(id, n = new Nav(this.frames.get(id))); return n; }
  // The smallest zone containing a point of a frame, or null.
  zoneAt(frame, x, y, z) {
    let best = null;
    for (const zn of this.zones) { if (zn.frame === frame && (zn.allRound || (x >= zn.x0 && x <= zn.x1)) && y >= zn.y0 && y <= zn.y1 && z >= zn.z0 && z <= zn.z1 && (!best || zn.vol < best.vol)) best = zn; }
    return best;
  }
  update(dt) { for (const d of this.dynamics) d.update(dt); }
  scope(id, frame, opts) {
    if (this.scopes.has(id)) this.scopes.get(id).dispose();
    const s = new Scope(this, id, frame, opts); this.scopes.set(id, s); return s;
  }

  // Register a mesh the world should place and cull. info: { frame, origin:[x,y,z] flat, center:[x,y,z] relative to origin, radius,
  //   far, caster, forward, scope, zone }. The mesh's material must be a world material (or share its vertex stage).
  addRenderable(mesh, info) {
    mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.matrixWorldAutoUpdate = false;
    const u = mesh.userData;
    u.frame = info.frame; u.origin = info.origin || [0, 0, 0]; u.center = info.center || [0, 0, 0]; u.radius = info.radius || 10;
    u.far = info.far || FAR_STRUCT; u.caster = !!info.caster; u.scope = info.scope || null; u.zone = info.zone || null; u.forward = !!info.forward;
    u.gm = mesh.material; u.sm = mesh.material.userData && mesh.material.userData.shadow ? mesh.material.userData.shadow : null;
    if (!u.sm) u.caster = false;
    u.always = !!info.always; u.level = info.level || 0;
    (u.forward ? this.fwdScene : this.scene).add(mesh);
    this.renderables.push(mesh);
    return mesh;
  }
  removeRenderable(mesh) {
    const i = this.renderables.indexOf(mesh); if (i >= 0) this.renderables.splice(i, 1);
    if (mesh.parent) mesh.parent.remove(mesh);
  }

  // Called by the pipeline before the G-buffer pass: place every mesh relative to the camera anchor, and decide who is drawn where.
  prepareMain(camera) {
    const A = this.anchor, R = this.renderables, fr = this._frustum, sph = this._sph, sr = this.shadowRange;
    this._pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); fr.setFromProjectionMatrix(this._pv);
    let shown = 0;
    for (let i = 0; i < R.length; i++) {
      const m = R[i], u = m.userData, f = u.frame, o = u.origin;
      const sc = u.scope;
      if ((sc && !(sc.active && sc.visible)) || u.hidden || (this.culler && !this.culler(u))) { m.visible = false; continue; }
      // frame row (see GLSL_BEND): dTheta, dRho, dZ relative to the anchor, and rho0 on the diagonal
      const e = m.matrixWorld.elements;
      e[3] = wrapPi(f.theta0 + o[0] / f.rho0 - A.theta); e[7] = A.rho - (f.rho0 - o[1]); e[11] = f.z0 + o[2] - A.z; e[15] = f.rho0;
      const c = u.center;
      flatToRender(f, o[0] + c[0], o[1] + c[1], o[2] + c[2], A, _c);
      const d = Math.hypot(_c.x, _c.y, _c.z) - u.radius;
      let mask = 0;
      if (u.always) mask = 1;
      else if (d < u.far) { sph.center.set(_c.x, _c.y, _c.z); sph.radius = u.radius; if (fr.intersectsSphere(sph)) mask = 1; }
      if (u.caster) {
        const dh = Math.hypot(_c.x, _c.z) - u.radius;      // roughly horizontal distance (the anchor's up is +Y)
        if (dh < sr.room * 1.42) mask |= 2;
        if (dh < sr.sky0 * 1.42) mask |= 4;
        if (dh < sr.sky1 * 1.42) mask |= 8;
      }
      m.layers.mask = mask; m.visible = mask !== 0;
      if (mask & 1) shown++;
    }
    this.stats.meshes = R.length; this.stats.shown = shown;
  }
  prepareShadow(bit) {
    const R = this.renderables;
    for (let i = 0; i < R.length; i++) { const m = R[i]; if (m.visible && (m.layers.mask & bit)) m.material = m.userData.sm; }
  }
  finishShadow(bit) {
    const R = this.renderables;
    for (let i = 0; i < R.length; i++) { const m = R[i]; if (m.visible && (m.layers.mask & bit)) m.material = m.userData.gm; }
  }
  prepareForward() {}

  // Interactions: { frame, x, y, z, radius, prompt (string | fn), onUse(game), enabled?(game), kind: 'use' | 'talk', scope }
  addInteract(it) { this.interacts.push(it); return it; }
  removeInteract(it) { const i = this.interacts.indexOf(it); if (i >= 0) this.interacts.splice(i, 1); }
  addSpot(s) { s.taken = null; this.spots.push(s); return s; }
  addTrigger(t) { t.inside = false; this.triggers.push(t); return t; }
}

// One place module's content. Draw with scope.g (a Geo), then call flush(); when everything is drawn, finish().
export class Scope {
  constructor(world, id, frame, opts = {}) {
    this.world = world; this.id = id; this.frame = frame; this.zone = opts.zone || null;
    this.active = true; this.visible = true;
    this.g = new Geo(new MeshBuf(4096, 8192));
    this.chunks = new Map(); this.meshes = []; this.lights = []; this.ambients = []; this.ownedColliders = [];
    this.col = world.colliders(frame);
    this.level = 0;
    this.finished = false;
    this.cleanups = [];
    // opts.origin: [x, z], the scope's own zero for its vertex data (see Geo.ox). Everything is still given in frame coordinates.
    this.ox = opts.origin ? opts.origin[0] : 0; this.oz = opts.origin ? opts.origin[1] : 0; this.g.ox = this.ox; this.g.oz = this.oz;
    // opts.managed: this scope comes and goes while the game runs (a city block). The people are told when it is ready
    // (game.people.addScope) and before it goes (removeScope), instead of re-reading the whole world.
    this.managed = !!opts.managed; this.live = !this.managed;
    this.gen = 0;
  }
  // Run fn when this scope is disposed (a region unloading, a block streaming out): stop a sound, drop a listener.
  // Pass the function that game.events.on() returns, or any function.
  onDispose(fn) { if (typeof fn === 'function') this.cleanups.push(fn); return fn; }
  // A per-frame update that lives as long as the scope does. fn(dt, game).
  every(fn) { const W = this.world; const d = { scope: this, update: (dt) => fn(dt, W.game) }; W.dynamics.push(d); return d; }
  // A looping positional sound at a point of this scope's frame, stopped when the scope goes. Starts at once.
  loop(name, x, y, z, o) {
    const game = this.world.game; if (!game || !game.loopAt) return { stop() {}, set() {} };
    const h = game.loopAt(name, this.frame, x, y, z, o);
    this.onDispose(() => { try { h.stop(0.3); } catch (e) { /* already gone */ } });
    return h;
  }
  // An atrium open through several decks: while the camera is in or near this box, every deck inside it is drawn.
  court(x0, z0, x1, z1) { const c = { frame: this.frame, x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), scope: this }; this.world.courts.push(c); return c; }
  // Send what has been drawn since the last flush to the batches. o.tier: 's' structure (seen far) | 'd' detail (fades out by ~40 m).
  // o.cast: casts overhead shadows (furniture, people-sized things, canopies). o.level: an integer to separate decks.
  flush(o) {
    const b = this.g.buf; if (!b.ni) { b.clear(); return this; }
    const tier = (o && o.tier) || 's', cast = o && o.cast ? 1 : 0, level = o && o.level !== undefined ? o.level : this.level;
    const bb = b.bounds();
    const ix = Math.floor((bb[0] + bb[3]) * 0.5 / CHUNK), iz = Math.floor((bb[2] + bb[5]) * 0.5 / CHUNK);
    const key = ix + ',' + iz + ',' + level + (this.gen ? ',' + this.gen : '');
    let ch = this.chunks.get(key);
    if (!ch) { ch = { ox: (ix + 0.5) * CHUNK, oy: Math.round((bb[1] + bb[4]) * 0.5), oz: (iz + 0.5) * CHUNK, bufs: {}, bb: [1e9, 1e9, 1e9, -1e9, -1e9, -1e9] }; this.chunks.set(key, ch); }
    // keep uvs small: shift by whole multiples of 64 tiles (the macro variation in the shader repeats every 64)
    if (b.nv) {
      const su = 64 * Math.round(b.uv[0] / 64), sv = 64 * Math.round(b.uv[1] / 64);
      if (su || sv) for (let i = 0; i < b.nv; i++) { if (!(b.mat[i * 4 + 2] & FLAG.ATLAS)) { b.uv[i * 2] -= su; b.uv[i * 2 + 1] -= sv; } }
    }
    // triangles go to the opaque or the cut-out batch; runs of the same kind are copied in one go
    if (_rem.length < b.nv * 2) _rem = new Int32Array(Math.max(b.nv * 2, _rem.length * 2));
    _rem.fill(-1, 0, b.nv * 2);
    const remO = _rem.subarray(0, b.nv), remC = _rem.subarray(b.nv, b.nv * 2);
    const special = o && (o.glass ? 'glass' : o.glow ? 'glow' : null);
    const nameO = special || (tier + 'o' + cast), nameC = special || (tier + 'c' + cast);
    let k0 = 0, curCut = false;
    const put = (k1) => { if (k1 <= k0) return; const name = curCut ? nameC : nameO; let t = ch.bufs[name]; if (!t) t = ch.bufs[name] = new MeshBuf(1024, 2048); t.appendRange(b, k0, k1, -ch.ox, -ch.oy, -ch.oz, curCut ? remC : remO); };
    for (let k = 0; k < b.ni; k += 3) {
      const v0 = b.idx[k]; const fl = b.mat[v0 * 4 + 2];
      const cut = !special && ((fl & FLAG.ATLAS) ? (fl & 16) !== 0 : isCutoutLayer(b.mat[v0 * 4]));
      if (cut !== curCut) { put(k); k0 = k; curCut = cut; }
    }
    put(b.ni);
    for (let i = 0; i < 3; i++) { if (bb[i] < ch.bb[i]) ch.bb[i] = bb[i]; if (bb[i + 3] > ch.bb[i + 3]) ch.bb[i + 3] = bb[i + 3]; }
    b.clear();
    return this;
  }
  // Convenience: draw(fn, opts) runs fn(g) and flushes.
  draw(fn, o) { fn(this.g, this); return this.flush(o); }
  structure(fn, level) { return this.draw(fn, { tier: 's', cast: false, level }); }
  furniture(fn, level) { return this.draw(fn, { tier: 's', cast: true, level }); }
  detail(fn, level) { return this.draw(fn, { tier: 'd', cast: true, level }); }
  deco(fn, level) { return this.draw(fn, { tier: 'd', cast: false, level }); }

  // Turn the batches into meshes. Safe to call again after more drawing (what was drawn since goes into new batches).
  // finish(max): build at most `max` batches now and return how many are left (call again next frame), to spread the work.
  finish(max) {
    const W = this.world, M = W.mats; let done = 0, left = 0;
    for (const [key, ch] of this.chunks) {
      if (ch.built) continue;
      if (max && done >= max) { left++; continue; }
      done++;
      const level = parseInt(key.split(',')[2], 10) || 0;
      const cx = (ch.bb[0] + ch.bb[3]) / 2 - ch.ox, cy = (ch.bb[1] + ch.bb[4]) / 2 - ch.oy, cz = (ch.bb[2] + ch.bb[5]) / 2 - ch.oz;
      const rad = 0.5 * Math.hypot(ch.bb[3] - ch.bb[0], ch.bb[4] - ch.bb[1], ch.bb[5] - ch.bb[2]) + 0.5;
      for (const name in ch.bufs) {
        const buf = ch.bufs[name]; if (!buf.ni) continue;
        const fwd = name === 'glass' || name === 'glow';
        const detail = name[0] === 'd', cut = name[1] === 'c', cast = name[2] === '1';
        const mat = fwd ? W.fwdMats[name] : cut ? (detail ? M.cutoutDetail : M.cutout) : (detail ? M.opaqueDetail : M.opaque);
        const mesh = new THREE.Mesh(buf.toGeometry(this.managed), mat);
        if (name === 'glow') mesh.renderOrder = 2;
        W.addRenderable(mesh, { frame: this.frame, origin: [ch.ox + this.ox, ch.oy, ch.oz + this.oz], center: [cx, cy, cz], radius: rad, far: fwd ? 90 : detail ? FAR_DETAIL : cast ? FAR_FURNITURE : FAR_STRUCT, caster: !fwd && cast, forward: fwd, scope: this, zone: this.zone, level });
        this.meshes.push(mesh);
      }
      ch.bufs = null; ch.built = true;
    }
    if (left) return left;
    this.gen++;
    this.finished = true;
    return max ? 0 : this;
  }

  // A pane of glass between two opposite corners (it must be flat in x or z). o: { tint: '#hex', opacity (0.12), rough (0.06), level }
  glass(x0, y0, z0, x1, y1, z1, o = {}) {
    const g = this.g; g.mat('plain', o.tint || '#cfe3e0');
    g._col[3] = Math.round(255 * (o.opacity === undefined ? 0.12 : o.opacity)); g._mat[3] = Math.round(255 * (o.rough === undefined ? 0.06 : o.rough));
    if (Math.abs(x1 - x0) < 1e-4) g.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    else if (Math.abs(z1 - z0) < 1e-4) g.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]);
    else g.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z1], [x0, y1, z1]);
    g._col[3] = 255;
    return this.flush({ glass: true, level: o.level });
  }
  // A soft additive glow card facing `face` ('x','X','z','Z', or 'y' for flat): halos round lamps, light pooling on a wall.
  // o: { color: '#hex', size (m), strength (0..1), follow: 'lamps' | 'night' | 'always' }
  glowCard(x, y, z, o = {}) {
    const g = this.g, sz = (o.size || 1) / 2, f = o.face || 'Z';
    g.mat('plain', o.color || '#ffd9a0'); g._mat[3] = Math.round(255 * Math.min(1, o.strength === undefined ? 0.2 : o.strength));
    g._col[3] = o.follow === 'always' ? 255 : o.follow === 'night' ? 64 : 128;
    const uv = [0, 0, 1, 1];
    if (f === 'y' || f === 'Y') g.quad([x - sz, y, z - sz], [x - sz, y, z + sz], [x + sz, y, z + sz], [x + sz, y, z - sz], { uv });
    else if (f === 'x' || f === 'X') g.quad([x, y - sz, z - sz], [x, y - sz, z + sz], [x, y + sz, z + sz], [x, y + sz, z - sz], { uv });
    else g.quad([x - sz, y - sz, z], [x + sz, y - sz, z], [x + sz, y + sz, z], [x - sz, y + sz, z], { uv });
    g._col[3] = 255;
    return this.flush({ glow: true, level: o.level });
  }
  // A named region: what the HUD says, how the camera exposes, what you hear. The smallest zone containing the player wins.
  // zoneBox({ id, box: [x0,y0,z0,x1,y1,z1], name, sub, place (a place id from content/places.js), env: { exposure, autoKey, bloom, warmth,
  //   contrast, saturation, vignette }, ambience, reverb, headroom (ceiling height for the overhead shadows; default 2.75),
  //   sky: true (open to the sunline or an atrium's luminous ceiling: turns on sky shadows) })
  zoneBox(z) {
    const b = z.box; z.frame = this.frame; z.scope = this;
    z.x0 = Math.min(b[0], b[3]); z.x1 = Math.max(b[0], b[3]); z.y0 = Math.min(b[1], b[4]); z.y1 = Math.max(b[1], b[4]); z.z0 = Math.min(b[2], b[5]); z.z1 = Math.max(b[2], b[5]);
    z.vol = (z.x1 - z.x0) * (z.y1 - z.y0) * (z.z1 - z.z0);
    this.world.zones.push(z); return z;
  }
  // A walkway for people: a polyline of [x, z] or [x, y, z] points at height o.y (default 0). Ends that meet other paths (within 0.7 m) join them.
  // o: { y, width (default 1.6), tags: [...], oneWay }
  path(points, o = {}) {
    const nav = this.world.nav(this.frame); const y = o.y || 0; let prev = null;
    for (const p of points) {
      const node = nav.node(p[0], p.length > 2 ? p[1] : y, p.length > 2 ? p[2] : p[1], this);
      if (prev && prev !== node) nav.link(prev, node, o.width || 1.6, o.tags, o.oneWay);
      prev = node;
    }
    return this;
  }

  // ----- lights (flat coordinates of this scope's frame) -----
  // light({ at:[x,y,z], color:'#hex' | [r,g,b] linear, power, range, type:'point'|'spot'|'tube', to:[x,y,z] (tube end), dir:[x,y,z] (spot),
  //         cone:[outerDeg, innerDeg], shadow, nospec, lamp (dims at lamp-night), night, sun, clip:[x0,y0,z0,x1,y1,z1], soft, radius })
  light(o) {
    const f = this.frame, col = typeof o.color === 'string' ? hexLin(o.color) : (o.color || [1, 0.85, 0.65]); const p = o.power === undefined ? 1 : o.power;
    const l = { theta: f.theta(o.at[0]), rho: f.rho(o.at[1]), z: f.zd(o.at[2]), color: [col[0] * p, col[1] * p, col[2] * p], range: o.range || 8,
      type: o.type === 'spot' ? LIGHT.SPOT : o.type === 'tube' ? LIGHT.TUBE : LIGHT.POINT, radius: o.radius || 0.08, scope: this,
      flags: (o.shadow ? LF.SHADOW : 0) | (o.nospec ? LF.NOSPEC : 0) | (o.lamp ? LF.LAMP : 0) | (o.night ? LF.NIGHT : 0) | (o.sun ? LF.SUNLIT : 0) };
    if (o.type === 'tube' && o.to) l.end = { theta: f.theta(o.to[0]), rho: f.rho(o.to[1]), z: f.zd(o.to[2]) };
    if (o.type === 'spot') { l.dir = o.dir || [0, -1, 0]; const c = o.cone || [55, 30]; l.cosOuter = Math.cos(c[0] * Math.PI / 180); l.cosInner = Math.cos(c[1] * Math.PI / 180); }
    if (o.clip) l.box = this._box(o.clip, o.soft);
    this.world.lights.add(l); this.lights.push(l);
    return l;
  }
  _box(c, soft) {
    const f = this.frame;
    return { t0: f.theta(Math.min(c[0], c[3])), t1: f.theta(Math.max(c[0], c[3])), r0: f.rho(Math.max(c[1], c[4])), r1: f.rho(Math.min(c[1], c[4])), z0: f.zd(Math.min(c[2], c[5])), z1: f.zd(Math.max(c[2], c[5])), soft: soft || 0.12 };
  }
  // ambient({ box:[x0,y0,z0,x1,y1,z1], sky:'#hex'|[r,g,b], ground:..., power, soft, skylit, lamp, sun, spec })
  ambient(o) {
    const lin = (c) => typeof c === 'string' ? hexLin(c) : c; const p = o.power === undefined ? 1 : o.power;
    const s = lin(o.sky), g = lin(o.ground || o.sky);
    const bx = this._box(o.box, o.soft || 1.0); if (o.allRound) bx.all = true;
    const a = { box: bx, sky: [s[0] * p, s[1] * p, s[2] * p], ground: [g[0] * p * (o.groundK === undefined ? 0.45 : o.groundK), g[1] * p * (o.groundK === undefined ? 0.45 : o.groundK), g[2] * p * (o.groundK === undefined ? 0.45 : o.groundK)],
      flags: (o.skylit ? 1 : 0) | (o.lamp ? LF.LAMP : 0) | (o.sun ? LF.SUNLIT : 0) | (o.night ? LF.NIGHT : 0), spec: o.spec === undefined ? 0.6 : o.spec, scope: this };
    this.world.lights.addAmbient(a); this.ambients.push(a);
    return a;
  }

  // ----- collision (flat coordinates) -----
  solid(x0, y0, z0, x1, y1, z1, o) { const c = this.col.box(x0, y0, z0, x1, y1, z1, Object.assign({ owner: this }, o)); return c; }
  post(x, z, r, y0, y1, o) { return this.col.cyl(x, z, r, y0, y1, Object.assign({ owner: this }, o)); }
  ramp(x0, z0, x1, z1, ya, yb, axis, o) { return this.col.ramp(x0, z0, x1, z1, ya, yb, axis, Object.assign({ owner: this }, o)); }

  // ----- things for people and the player -----
  spot(type, x, y, z, yaw, o) { if (this.managed) this.world.managedSpots++; return this.world.addSpot(Object.assign({ tags: [] }, o, { type, frame: this.frame, x, y, z, yaw: yaw || 0, scope: this })); }
  interact(o) { return this.world.addInteract(Object.assign({ frame: this.frame, scope: this, radius: 1.6, kind: 'use' }, o)); }
  trigger(o) { return this.world.addTrigger(Object.assign({ frame: this.frame, scope: this }, o)); }

  dispose() {
    const W = this.world;
    for (const fn of this.cleanups) { try { fn(); } catch (e) { console.error('[scope ' + this.id + '] clean-up: ' + e); } }
    this.cleanups.length = 0;
    W.courts = W.courts.filter((c) => c.scope !== this);
    for (const m of this.meshes) { W.removeRenderable(m); m.geometry.dispose(); }
    for (const l of this.lights) W.lights.remove(l);
    for (const a of this.ambients) W.lights.removeAmbient(a);
    this.col.removeOwner(this);
    { const n0 = W.spots.length; W.spots = W.spots.filter((s) => s.scope !== this); if (this.managed) W.managedSpots -= n0 - W.spots.length; }
    W.interacts = W.interacts.filter((s) => s.scope !== this);
    W.triggers = W.triggers.filter((s) => s.scope !== this);
    W.zones = W.zones.filter((s) => s.scope !== this);
    W.dynamics = W.dynamics.filter((s) => s.scope !== this);
    const nav = W.navs.get(this.frame.id); if (nav) nav.removeOwner(this);
    this.meshes.length = 0; this.lights.length = 0; this.ambients.length = 0; this.chunks.clear();
    this.active = false;
    if (W.scopes.get(this.id) === this) W.scopes.delete(this.id);
  }
}

// Walkways for people: a graph of nodes joined by links, per frame. People path-find over it (A*) and wander along it.
export class Nav {
  constructor(frame) { this.frame = frame; this.nodes = []; }
  node(x, y, z, owner) {
    for (const n of this.nodes) { if (Math.abs(n.x - x) < 0.7 && Math.abs(n.z - z) < 0.7 && Math.abs(n.y - y) < 0.6) return n; }
    const n = { x, y, z, links: [], owner, id: this.nodes.length }; this.nodes.push(n); return n;
  }
  link(a, b, width, tags, oneWay) {
    const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    if (!a.links.some((l) => l.to === b)) a.links.push({ to: b, d, width, tags: tags || null });
    if (!oneWay && !b.links.some((l) => l.to === a)) b.links.push({ to: a, d, width, tags: tags || null });
  }
  removeOwner(owner) {
    this.nodes = this.nodes.filter((n) => n.owner !== owner);
    for (const n of this.nodes) n.links = n.links.filter((l) => l.to.owner !== owner);
    this.nodes.forEach((n, i) => { n.id = i; });
  }
  nearest(x, y, z, maxD = 30) {
    let best = null, bd = maxD * maxD;
    for (const n of this.nodes) { const dy = (n.y - y) * 3; const d = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z) + dy * dy; if (d < bd) { bd = d; best = n; } }
    return best;
  }
  // A* from node a to node b: returns an array of nodes (including both ends) or null.
  route(a, b) {
    if (!a || !b) return null; if (a === b) return [a];
    const open = [a], came = new Map(), gs = new Map([[a, 0]]), fs = new Map([[a, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)]]);
    const closed = new Set();
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (fs.get(open[i]) < fs.get(open[bi])) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur === b) { const out = [cur]; let c = cur; while (came.has(c)) { c = came.get(c); out.push(c); } return out.reverse(); }
      closed.add(cur);
      for (const l of cur.links) {
        if (closed.has(l.to)) continue;
        const g = gs.get(cur) + l.d;
        if (g < (gs.has(l.to) ? gs.get(l.to) : Infinity)) { came.set(l.to, cur); gs.set(l.to, g); fs.set(l.to, g + Math.hypot(l.to.x - b.x, l.to.y - b.y, l.to.z - b.z)); if (open.indexOf(l.to) < 0) open.push(l.to); }
      }
    }
    return null;
  }
}
