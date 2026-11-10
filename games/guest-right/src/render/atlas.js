// The sign atlas: every painted, chalked or lit piece of text in the world is drawn with the 2D canvas into pages of
// one texture array, which the world shader samples for geometry flagged as "atlas".
import * as THREE from 'three';

export class Atlas {
  constructor(renderer, opts = {}) {
    this.renderer = renderer; this.gl = renderer.getContext();
    this.size = opts.size || 2048; this.pages = opts.pages || 4;
    this.scale = this.size / 2048;                 // drawing scale (1 at full size)
    this.canvases = []; this.ctxs = []; this.shelves = []; this.dirty = [];
    for (let i = 0; i < this.pages; i++) {
      const c = document.createElement('canvas'); c.width = c.height = this.size;
      const ctx = c.getContext('2d', { willReadFrequently: false });
      ctx.clearRect(0, 0, this.size, this.size);
      this.canvases.push(c); this.ctxs.push(ctx); this.shelves.push({ y: 2, x: 2, h: 0 }); this.dirty.push(true);
    }
    const gl = this.gl;
    this.glTex = gl.createTexture();
    renderer.state.bindTexture(gl.TEXTURE_2D_ARRAY, this.glTex);
    const levels = Math.floor(Math.log2(this.size)) + 1;
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, this.size, this.size, this.pages);
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
    this.cache = new Map();
  }
  // Reserve w x h pixels (at full-size scale) and draw into them. draw(ctx, w, h) is called with the origin at the rect's corner
  // and a clip set. Returns { page, u0, v0, u1, v1, w, h } (v0 is the top edge). key: optional cache key.
  add(w, h, draw, key) {
    if (key && this.cache.has(key)) return this.cache.get(key);
    const S = this.scale; const pw = Math.ceil(w * S), ph = Math.ceil(h * S), pad = 4;
    let page = -1, x = 0, y = 0;
    for (let i = 0; i < this.pages; i++) {
      const sh = this.shelves[i];
      if (sh.x + pw + pad > this.size) { sh.y += sh.h + pad; sh.x = 2; sh.h = 0; }
      if (sh.y + ph + pad > this.size) continue;
      page = i; x = sh.x; y = sh.y; sh.x += pw + pad; sh.h = Math.max(sh.h, ph); break;
    }
    if (page < 0) { if (!this._warned) { console.warn('[atlas] full: later signs reuse the first rect'); this._warned = true; } const r0 = { page: 0, u0: 0.001, v0: 0.001, u1: 0.01, v1: 0.01, w, h }; if (key) this.cache.set(key, r0); return r0; }
    const ctx = this.ctxs[page];
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, pw, ph); ctx.clip(); ctx.clearRect(x, y, pw, ph);
    ctx.translate(x, y); ctx.scale(S, S);
    try { draw(ctx, w, h); } catch (e) { console.error('[atlas] draw failed', e); }
    ctx.restore();
    this.dirty[page] = true;
    const r = { page, u0: (x + 0.5) / this.size, v0: (y + 0.5) / this.size, u1: (x + pw - 0.5) / this.size, v1: (y + ph - 0.5) / this.size, w, h };
    if (key) this.cache.set(key, r);
    return r;
  }
  // Redraw an existing rect (a changing board).
  redraw(r, draw) {
    const S = this.scale, x = Math.round(r.u0 * this.size - 0.5), y = Math.round(r.v0 * this.size - 0.5), pw = Math.ceil(r.w * S), ph = Math.ceil(r.h * S);
    const ctx = this.ctxs[r.page];
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, pw, ph); ctx.clip(); ctx.clearRect(x, y, pw, ph); ctx.translate(x, y); ctx.scale(S, S);
    try { draw(ctx, r.w, r.h); } catch (e) { console.error('[atlas] redraw failed', e); }
    ctx.restore(); this.dirty[r.page] = true;
  }
  // Upload any pages that changed. Call once a frame (cheap when nothing changed).
  flush() {
    let any = false; for (let i = 0; i < this.pages; i++) if (this.dirty[i]) any = true;
    if (!any) return;
    const gl = this.gl, st = this.renderer.state;
    st.bindTexture(gl.TEXTURE_2D_ARRAY, this.glTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    for (let i = 0; i < this.pages; i++) {
      if (!this.dirty[i]) continue;
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, this.size, this.size, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.canvases[i]);
      this.dirty[i] = false;
    }
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    st.unbindTexture();
  }
}
