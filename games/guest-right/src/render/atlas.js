// The sign atlas: every painted, chalked or lit piece of text in the world is drawn with the 2D canvas into pages of
// one texture array, which the world shader samples for geometry flagged as "atlas".
//
// Pages 0 .. pages-1 are permanent: the places built when the game starts fill them and never give them back.
// The pages after those are a POOL shared by GROUPS: a region that loads later (a landmark you ride a cab to, a block
// of the city streaming in round you) draws its signs between begin(id) and end(), and release(id) hands back the
// slots it used when it unloads. A freed slot is taken again by the next sign of the same size, so the pool holds
// what is loaded now and nothing else. Each sign is drawn on a scratch canvas and copied straight into the texture,
// so no page keeps a canvas of its own.
import * as THREE from 'three';

export class Atlas {
  constructor(renderer, opts = {}) {
    this.renderer = renderer; this.gl = renderer.getContext();
    this.size = opts.size || 2048; this.pages = opts.pages || 4; this.dyn = opts.dynamic || 0;
    this.total = this.pages + this.dyn;
    this.scale = this.size / 2048;                 // drawing scale (1 at full size)
    this.shelves = []; this.owner = [];            // owner: undefined for a permanent page, null for a free lent page, else a group id
    for (let i = 0; i < this.total; i++) { this.shelves.push({ y: 2, x: 2, h: 0 }); this.owner.push(i < this.pages ? undefined : null); }
    // a canvas kept in memory, not on the GPU: every sign is read straight back out of it, and a GPU canvas makes each read a round trip
    this.scratch = document.createElement('canvas'); this.sctx = this.scratch.getContext('2d', { willReadFrequently: true });
    const gl = this.gl;
    this.glTex = gl.createTexture();
    renderer.state.bindTexture(gl.TEXTURE_2D_ARRAY, this.glTex);
    const levels = Math.floor(Math.log2(this.size)) + 1;
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, this.size, this.size, this.total);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const ext = renderer.extensions.get('EXT_texture_filter_anisotropic');
    if (ext) gl.texParameterf(gl.TEXTURE_2D_ARRAY, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, renderer.capabilities.getMaxAnisotropy()));
    renderer.state.unbindTexture();
    // hand the raw texture to three.js
    this.texture = new THREE.Texture();
    const props = renderer.properties.get(this.texture);
    props.__webglTexture = this.glTex; props.__webglInit = true;
    this.cache = new Map();          // permanent signs by key
    this.groups = new Map();         // id -> { slots: [...], cache: Map, px }
    // the pool: a skyline per lent page, and the freed slots by size
    this.pool = { sky: {}, free: new Map(), live: 0, px: 0 };
    for (let i = this.pages; i < this.total; i++) this.pool.sky[i] = [{ x: 2, y: 2, w: this.size - 4 }];
    this.group = null;               // the group now being drawn, or null
    this.mips = false;               // mipmaps need rebuilding
    this.count = 0;
  }
  // Signs added from now until end() belong to a group, on pages lent to it.
  begin(id) { this.group = id; if (!this.groups.has(id)) this.groups.set(id, { slots: [], cache: new Map(), px: 0 }); }
  end() { this.group = null; }
  // Give a group's slots back. Anything still drawn with its rects will show whatever is drawn there next.
  release(id) {
    const g = this.groups.get(id); if (!g) return;
    const P = this.pool;
    for (const sl of g.slots) { const k = sl.w + 'x' + sl.h; let a = P.free.get(k); if (!a) P.free.set(k, a = []); a.push(sl); P.live--; P.px -= sl.w * sl.h; }
    // nothing left in use: start the pool afresh, so odd sizes do not silt it up
    if (P.live <= 0) { P.live = 0; P.px = 0; P.free.clear(); for (let i = this.pages; i < this.total; i++) P.sky[i] = [{ x: 2, y: 2, w: this.size - 4 }]; }
    this.groups.delete(id); if (this.group === id) this.group = null;
  }
  // how full the permanent pages are (0..1), and how many lent pages are out
  usage() {
    let used = 0; for (let i = 0; i < this.pages; i++) used += (this.shelves[i].y + this.shelves[i].h) / this.size;
    const page = this.size * this.size, groups = {};
    for (const [id, g] of this.groups) groups[id] = Math.round(100 * (g.px || 0) / page) + '%';       // of one page
    return { permanent: this.pages ? used / this.pages : 0, pool: this.dyn ? this.pool.px / (page * this.dyn) : 0, of: this.dyn, groups };
  }
  _place(pw, ph) {
    const pad = 4, G = this.group ? this.groups.get(this.group) : null;
    const tryPage = (i) => {
      const sh = this.shelves[i];
      if (sh.x + pw + pad > this.size) { sh.y += sh.h + pad; sh.x = 2; sh.h = 0; }
      if (sh.y + ph + pad > this.size) return null;
      const r = { page: i, x: sh.x, y: sh.y }; sh.x += pw + pad; sh.h = Math.max(sh.h, ph); return r;
    };
    if (G) {
      // from the pool: a freed slot of this size if there is one, else new space on a lent page's skyline (each sign goes
      // where it sits lowest, so mixed sizes waste little). Slot sizes are rounded up so that sizes repeat.
      const P = this.pool, sw = Math.ceil(pw / 16) * 16, shh = Math.ceil(ph / 8) * 8, fl = P.free.get(sw + 'x' + shh);
      let sl = fl && fl.length ? fl.pop() : null;
      if (!sl) for (let i = this.pages; i < this.total && !sl; i++) { const r = this._sky(P.sky, i, sw, shh); if (r) sl = { page: r.page, x: r.x, y: r.y, w: sw, h: shh }; }
      if (!sl) return null;
      G.slots.push(sl); G.px += sw * shh; P.live++; P.px += sw * shh;
      return { page: sl.page, x: sl.x, y: sl.y, sw, sh: shh };
    }
    for (let i = 0; i < this.pages; i++) { const r = tryPage(i); if (r) return r; }
    return null;
  }
  // Place pw x ph on a page's skyline (a list of { x, y, w } steps, left to right): the spot whose top edge ends lowest wins.
  _sky(sky, page, pw, ph) {
    const pad = 4, S = this.size, sk = sky[page], w = pw + pad, h = ph + pad;
    let best = null;
    for (let i = 0; i < sk.length; i++) {
      const x = sk[i].x; if (x + w > S - 2) break;
      let y = 0, left = w;
      for (let k = i; k < sk.length && left > 0; k++) { if (sk[k].y > y) y = sk[k].y; left -= sk[k].w; }
      if (left > 0 || y + h > S - 2) continue;
      if (!best || y + h < best.top || (y + h === best.top && x < best.x)) best = { x, y, top: y + h };
    }
    if (!best) return null;
    const n0 = best.x, n1 = best.x + w, out = []; let put = false;
    for (const q of sk) {
      const s0 = q.x, s1 = q.x + q.w;
      if (s1 <= n0 || s0 >= n1) { out.push(q); continue; }
      if (s0 < n0) out.push({ x: s0, y: q.y, w: n0 - s0 });
      if (!put) { out.push({ x: n0, y: best.top, w }); put = true; }
      if (s1 > n1) out.push({ x: n1, y: q.y, w: s1 - n1 });
    }
    const merged = [];
    for (const q of out) { const l = merged[merged.length - 1]; if (l && l.y === q.y && l.x + l.w === q.x) l.w += q.w; else merged.push(q); }
    sky[page] = merged;
    return { page, x: best.x, y: best.y };
  }
  // cw, ch: the size of the slot when it is bigger than the sign (the rest is cleared, so nothing of an old sign shows)
  _paint(page, x, y, pw, ph, w, h, draw, cw, ch, k) {
    const c = this.scratch, S = this.scale * (k || 1);
    c.width = cw || pw; c.height = ch || ph;        // resizing clears it and resets the context
    const ctx = this.sctx;
    ctx.save(); ctx.scale(S, S);
    try { draw(ctx, w, h); } catch (e) { console.error('[atlas] draw failed', e); }
    ctx.restore();
    const gl = this.gl, st = this.renderer.state;
    st.bindTexture(gl.TEXTURE_2D_ARRAY, this.glTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, x, y, page, c.width, c.height, 1, gl.RGBA, gl.UNSIGNED_BYTE, c);
    st.unbindTexture();
    this.mips = true;
  }
  // Reserve w x h pixels (at full-size scale) and draw into them. draw(ctx, w, h) is called with the origin at the rect's corner.
  // Returns { page, u0, v0, u1, v1, w, h } (v0 is the top edge). key: optional cache key (per group).
  add(w, h, draw, key) {
    const G = this.group ? this.groups.get(this.group) : null, cache = G ? G.cache : this.cache;
    if (key && cache.has(key)) return cache.get(key);
    const S = this.scale; let pw = Math.max(1, Math.ceil(w * S)), ph = Math.max(1, Math.ceil(h * S)), k = 1;
    // a picture too big for a page (with its margins, and a lent slot's rounding) is drawn a little smaller, not left out
    const lim = this.size - 16;
    if (pw > lim || ph > lim) { k = Math.min(lim / pw, lim / ph); pw = Math.max(1, Math.floor(pw * k)); ph = Math.max(1, Math.floor(ph * k)); }
    const at = this._place(pw, ph);
    if (!at) {
      if (!this._warned) { console.warn('[atlas] full' + (this.group ? ' (group ' + this.group + ')' : '') + ': later signs reuse a blank rect'); this._warned = true; }
      const r0 = { page: 0, u0: 0.001, v0: 0.001, u1: 0.002, v1: 0.002, w, h }; if (key) cache.set(key, r0); return r0;
    }
    this._paint(at.page, at.x, at.y, pw, ph, w, h, draw, at.sw, at.sh, k);
    const r = { page: at.page, u0: (at.x + 0.5) / this.size, v0: (at.y + 0.5) / this.size, u1: (at.x + pw - 0.5) / this.size, v1: (at.y + ph - 0.5) / this.size, w, h };
    if (k !== 1) r.k = k;
    if (key) cache.set(key, r);
    this.count++;
    return r;
  }
  // Redraw an existing rect (a changing board).
  redraw(r, draw) {
    const S = this.scale, k = r.k || 1, x = Math.round(r.u0 * this.size - 0.5), y = Math.round(r.v0 * this.size - 0.5);
    let pw = Math.max(1, Math.ceil(r.w * S)), ph = Math.max(1, Math.ceil(r.h * S));
    if (k !== 1) { pw = Math.max(1, Math.floor(pw * k)); ph = Math.max(1, Math.floor(ph * k)); }
    this._paint(r.page, x, y, pw, ph, r.w, r.h, draw, undefined, undefined, k);
  }
  // Rebuild the mipmaps if anything was drawn. Call once a frame (cheap when nothing changed).
  flush() {
    if (!this.mips) return;
    const gl = this.gl, st = this.renderer.state;
    st.bindTexture(gl.TEXTURE_2D_ARRAY, this.glTex);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    st.unbindTexture();
    this.mips = false;
  }
}
