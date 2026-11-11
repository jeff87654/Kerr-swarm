// A small kit for the market, the workshops and the light studios. Everything is drawn in the lot's own coordinates
// (p along the front from its low end, q inward from the front line), so one plan fits a footprint mirrored or turned
// any way. A local angle `a` faces (sin a, cos a) in (p, q): a = 0 faces the back wall, a = PI the street, a = PI / 2 +p.
import { floor, ceiling, wall, lamp, roomGlow } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { orient, frontSide } from '../city/lots.js';
import { LOT_H } from '../city/plan.js';
import { frontWall, pilaster } from './street_parts.js';
import { GIVEN, FAMILY } from '../content/city.js';
import { shadeHex } from '../core/util.js';

export function local(s, lot) {
  const o = orient(lot), g = s.g, P = o.P;
  const dirOf = (dp, dq) => { const a = P(0, 0), b = P(dp, dq); return [b[0] - a[0], b[1] - a[1]]; };
  const yaw = (a) => { const d = dirOf(Math.sin(a), Math.cos(a)); return Math.atan2(d[0], d[1]); };
  const face = (dp, dq) => { const d = dirOf(dp, dq); return Math.abs(d[0]) > Math.abs(d[1]) ? (d[0] > 0 ? 'X' : 'x') : (d[1] > 0 ? 'Z' : 'z'); };
  const B = (p0, q0, p1, q1) => o.box(p0, q0, p1, q1);
  const plusQisA = (() => { const d = dirOf(0, 1); return d[0] + d[1] > 0; })();
  const plusPisA = (() => { const d = dirOf(1, 0); return d[0] + d[1] > 0; })();
  const pt = (p, y, q) => { const a = P(p, q); return [a[0], y, a[1]]; };
  const L = {
    o, W: o.W, D: o.D, g, s, P, B, yaw, face, pt, dirOf,
    // the player looks the way a prop of local angle a faces
    pyaw: (a) => Math.PI - yaw(a),
    box(p0, y0, q0, p1, y1, q1, opts) { const b = B(p0, q0, p1, q1); g.box(b[0], y0, b[1], b[2], y1, b[3], opts && opts.faces ? Object.assign({}, opts, { faces: L.faces(opts.faces) }) : opts); },
    // faces given locally: p / P (minus / plus p), q / Q, y / Y
    faces(f) {
      let out = '';
      for (const c of f) {
        if (c === 'y' || c === 'Y') { out += c; continue; }
        const d = c === 'p' ? dirOf(-1, 0) : c === 'P' ? dirOf(1, 0) : c === 'q' ? dirOf(0, -1) : dirOf(0, 1);
        out += Math.abs(d[0]) > Math.abs(d[1]) ? (d[0] > 0 ? 'X' : 'x') : (d[1] > 0 ? 'Z' : 'z');
      }
      return out;
    },
    solid(p0, y0, q0, p1, y1, q1, opts) { const b = B(p0, q0, p1, q1); return s.solid(b[0], y0, b[1], b[2], y1, b[3], opts); },
    block(p0, y0, q0, p1, y1, q1, mat, tint, opts) {
      const b = B(p0, q0, p1, q1); g.mat(mat, tint, opts && opts.mo); g.box(b[0], y0, b[1], b[2], y1, b[3], { bevel: opts && opts.bevel, aoBottom: 0.7 });
      s.flush({ tier: 's', cast: !opts || opts.cast !== false }); if (!opts || !opts.noCollide) s.solid(b[0], y0, b[1], b[2], y1, b[3], { surf: opts && opts.surf });
    },
    floor(p0, q0, p1, q1, y, mat, tint, opts) { const b = B(p0, q0, p1, q1); floor(s, b[0], b[1], b[2], b[3], y, mat, tint, opts); },
    ceiling(p0, q0, p1, q1, y, mat, tint, opts) { const b = B(p0, q0, p1, q1); ceiling(s, b[0], b[1], b[2], b[3], y, mat, tint, opts); },
    clip(p0, y0, q0, p1, y1, q1, pad) { const b = B(p0, q0, p1, q1), d = pad === undefined ? 0.06 : pad; return [b[0] - d, y0, b[1] - d, b[2] + d, y1, b[3] + d]; },
    glowBox(p0, y0, q0, p1, y1, q1, opt) { const b = B(p0, q0, p1, q1); return roomGlow(s, b[0], y0, b[1], b[2], y1, b[3], opt); },
    // a wall along p at q, from p0 to p1 (openings measured from p0). opts.inner / opts.outer: { mat, tint } for the +q / -q faces
    wallP(q, p0, p1, y0, h, opts) {
      const a = P(p0, q), b = P(p1, q), w = Object.assign({}, opts);
      if (opts && (opts.inner || opts.outer)) { const I = opts.inner || {}, O = opts.outer || {}; const A = plusQisA ? I : O, Bf = plusQisA ? O : I; if (A.tint) w.tintA = A.tint; if (A.mat) w.matA = A.mat; if (Bf.tint) w.tintB = Bf.tint; if (Bf.mat) w.matB = Bf.mat; }
      wall(s, a[0], a[1], b[0], b[1], y0, h, w);
    },
    // a wall along q at p, from q0 to q1. opts.inner / opts.outer: the +p / -p faces
    wallQ(p, q0, q1, y0, h, opts) {
      const a = P(p, q0), b = P(p, q1), w = Object.assign({}, opts);
      if (opts && (opts.inner || opts.outer)) { const I = opts.inner || {}, O = opts.outer || {}; const A = plusPisA ? I : O, Bf = plusPisA ? O : I; if (A.tint) w.tintA = A.tint; if (A.mat) w.matA = A.mat; if (Bf.tint) w.tintB = Bf.tint; if (Bf.mat) w.matB = Bf.mat; }
      wall(s, a[0], a[1], b[0], b[1], y0, h, w);
    },
    lamp(kind, p, y, q, opts) {
      const a = P(p, q), oo = Object.assign({}, opts);
      if (opts && opts.face) oo.face = face(opts.face[0], opts.face[1]);
      if (opts && opts.to) oo.to = pt(opts.to[0], opts.to[1], opts.to[2]);
      if (opts && opts.dir) { const d = dirOf(opts.dir[0], opts.dir[2]); oo.dir = [d[0], opts.dir[1], d[1]]; }
      lamp(s, kind, a[0], y, a[1], oo);
    },
    light(o2) { const oo = Object.assign({}, o2); oo.at = pt(o2.at[0], o2.at[1], o2.at[2]); if (o2.to) oo.to = pt(o2.to[0], o2.to[1], o2.to[2]); if (o2.dir) { const d = dirOf(o2.dir[0], o2.dir[2]); oo.dir = [d[0], o2.dir[1], d[1]]; } return s.light(oo); },
    prop(name, p, y, q, a, params, opt) { const c = P(p, q); return prop(s, name, c[0], y, c[1], yaw(a || 0), params, opt); },
    spot(type, p, y, q, a, opt) { const c = P(p, q); return s.spot(type, c[0], y, c[1], yaw(a || 0), opt); },
    sign(spec, p, y, q, dir, opt) { const c = P(p, q); return sign(s, spec, c[0], y, c[1], Object.assign({ face: face(dir[0], dir[1]) }, opt)); },
    interact(o2) { const c = P(o2.p, o2.q); const oo = Object.assign({}, o2, { x: c[0], z: c[1] }); delete oo.p; delete oo.q; return s.interact(oo); },
    path(points, opt) { return s.path(points.map((pq) => P(pq[0], pq[1])), opt); },
    tube(points, r, opt) { g.tube(points.map((v) => pt(v[0], v[1], v[2])), r, opt); },
    lathe(p, q, prof, opt) { const c = P(p, q); g.lathe(c[0], c[1], prof, opt); },
    cyl(p, y, q, r, h, opt) { const c = P(p, q); g.cyl(c[0], y, c[1], r, h, opt); },
    ball(p, y, q, rp, ry, rq, opt) { const c = P(p, q); const d = dirOf(1, 0); const sw = Math.abs(d[0]) < 0.5; g.ball(c[0], y, c[1], sw ? rq : rp, ry, sw ? rp : rq, opt); },
    sheet(a, b, c, d, opt) { g.sheet(pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(c[0], c[1], c[2]), pt(d[0], d[1], d[2]), opt); },
    quad(a, b, c, d, opt) { g.quad(pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(c[0], c[1], c[2]), pt(d[0], d[1], d[2]), opt); },
    glass(p0, y0, q0, p1, y1, q1, opt) { const a = P(p0, q0), b = P(p1, q1); return s.glass(a[0], y0, a[1], b[0], y1, b[1], opt); },
    loop(name, p, y, q, opt) { const c = P(p, q); return s.loop(name, c[0], y, c[1], opt); },
    sfx(game, name, p, y, q, opt) { if (!game.sfxAt) return; const c = P(p, q); game.sfxAt(name, s.frame, c[0], y, c[1], opt); },
    // draw something at a local point turned to local angle a: fn(g) draws at the origin, front toward +z
    at(p, y, q, a, fn) { const c = P(p, q); g.at(c[0], y, c[1], yaw(a || 0)); fn(g); g.pop(); },
  };
  return L;
}

// A walkway net: a list of polylines in (p, q); every polyline is cut at the points where others meet it, so their ends join.
export function walkways(L, lines, width) {
  const pts = []; for (const ln of lines) for (const v of ln) pts.push(v);
  for (const ln of lines) {
    let cur = [ln[0]];
    for (let i = 1; i < ln.length; i++) {
      const a = ln[i - 1], b = ln[i], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 1e-3) continue;
      // points of other lines lying on this segment, in order
      const on = [];
      for (const v of pts) {
        const t = ((v[0] - a[0]) * (b[0] - a[0]) + (v[1] - a[1]) * (b[1] - a[1])) / (len * len);
        if (t <= 0.02 || t >= 0.98) continue;
        const px = a[0] + (b[0] - a[0]) * t, pq = a[1] + (b[1] - a[1]) * t;
        if (Math.hypot(px - v[0], pq - v[1]) < 0.3) on.push([t, [px, pq]]);
      }
      on.sort((m, n) => m[0] - n[0]);
      for (const e of on) { cur.push(e[1]); L.path(cur, { width }); cur = [e[1]]; }
      cur.push(b);
    }
    if (cur.length > 1) L.path(cur, { width });
  }
}

// Pick one of a list by a seed and a salt (so two lines in one block do not move together).
export function pickBy(seed, salt, list) { const v = Math.sin(((seed >>> 0) % 100003) * 12.9898 + salt * 78.233) * 43758.5453; return list[Math.floor((v - Math.floor(v)) * list.length) % list.length]; }
// Lines that vary by band: { low, middle, high } or a plain list.
export function byBand(info, x) { return Array.isArray(x) ? x : (x[info.band] || x.middle || x.low); }
// A person's name, from the city's lists.
export function someone(r) { return r.pick(GIVEN) + ' ' + r.pick(FAMILY); }
export function kays(v) { return (Math.round(v * 100) / 100).toFixed(2); }
// Say a few lines (safe without a UI), and a menu (null without a UI).
export async function tell(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: 6 }); }
export async function menu(game, o) { if (!game.ui) return null; game.busy++; try { return await game.ui.menu(Object.assign({ wallet: game.wallet ? game.wallet.kwh : 0 }, o)); } finally { game.busy--; } }
export async function choose(game, who, prompt, options) { if (!game.ui) return null; game.busy++; try { return await game.ui.choose(who, prompt, options); } finally { game.busy--; } }

// With ?citylog: time the work between ticks, count triangles and lights, and print it. Returns T: `await T()` in place of
// `await tick()`; T.lap(name) marks a part; T.done() prints (and must be called, in a finally).
export function meter(s, game, label, tick) {
  const on = !!(game && game.params && game.params.citylog);
  const t0 = performance.now(), l0 = s.lights.length; let mark = t0, work = 0, worst = 0, worstAt = '', part = 'start', tris = 0, lt = 0, lw = 0; const laps = [];
  const f0 = s.flush;
  if (on) s.flush = function (o) { tris += this.g.buf.ni / 3; return f0.call(this, o); };
  const T = async () => { const n = performance.now(), sl = n - mark; work += sl; if (sl > worst) { worst = sl; worstAt = part; } if (tick) await tick(); mark = performance.now(); };
  T.acc = {};
  T.time = (k, fn) => { if (!on) return fn(); const a = performance.now(); const v = fn(); T.acc[k] = (T.acc[k] || 0) + performance.now() - a; return v; };
  T.lap = (name) => { part = name; if (!on) return; const w = work + performance.now() - mark; laps.push(name + ' ' + ((tris - lt) / 1000).toFixed(1) + 'k/' + (w - lw).toFixed(1) + 'ms'); lt = tris; lw = w; };
  T.done = () => {
    const n = performance.now(); work += n - mark; if (n - mark > worst) worst = n - mark;
    if (!on) return;
    s.flush = f0;
    console.log('[lots-market] ' + label + ': ' + Math.round(tris) + ' triangles, ' + (s.lights.length - l0) + ' lights, work ' + work.toFixed(1) + ' ms, worst slice ' + worst.toFixed(1) + ' ms (after ' + worstAt + '), elapsed ' + (n - t0).toFixed(0) + ' ms · ' + laps.join(' ') + (Object.keys(T.acc).length ? ' · ' + Object.keys(T.acc).map((k) => k + ' ' + T.acc[k].toFixed(1)).join(' ') : ''));
  };
  return T;
}

// The street front of a big room: a painted front with a deep cornice, tall glazed windows between pilasters, a wide
// doorway, the name over it, and the inside face of the same wall. o: { door: [p0, w, h], wins: [[p0, w]...], sill, top,
// fin (a FIN entry), inner: { tint, dado }, fascia: sign spec, fasciaW, frame (window frame colour), hInner }
export async function bigFront(L, lot, o, T) {
  const tk = async () => { if (T) await T(); };
  const s = L.s, g = L.g, W = L.W, sd = frontSide(lot), a0 = L.o.a0, a1 = L.o.a1;
  const sill = o.sill === undefined ? 0.55 : o.sill, top = o.top || 2.5, dw = o.door;
  const ops = [{ at: dw[0], w: dw[1], h: dw[2] }].concat(o.wins.map((w) => ({ at: w[0], w: w[1], h: top - sill, sill })));
  frontWall(s, sd, a0, a1, LOT_H, ops, o.fin);
  await tk();
  L.wallP(0.27, 0, W, 0, o.hInner || 3.4, { t: 0.14, openings: ops, tint: o.inner.tint, mat: o.inner.mat || 'plaster', dado: o.inner.dado, skirt: o.inner.skirt || '#3a2a20' });
  // the windows: glass, a painted frame with mullions and a transom, a sill board inside
  await tk();
  const fr = o.frame || '#2d3b36';
  for (const w of o.wins) {
    const p0 = w[0], p1 = w[0] + w[1];
    L.glass(p0, sill, 0.12, p1, top, 0.12, { opacity: 0.13 });
    s.structure(() => {
      g.mat('paint', fr, { rough: -0.1 });
      L.box(p0, sill, 0.08, p1, sill + 0.06, 0.18); L.box(p0, top - 0.06, 0.08, p1, top, 0.18);
      L.box(p0, sill, 0.08, p0 + 0.06, top, 0.18); L.box(p1 - 0.06, sill, 0.08, p1, top, 0.18);
      const n = Math.max(2, Math.round(w[1] / 0.55));
      for (let k = 1; k < n; k++) { const p = p0 + w[1] * k / n; L.box(p - 0.022, sill, 0.1, p + 0.022, top, 0.15); }
      L.box(p0, top - 0.48, 0.1, p1, top - 0.44, 0.15);
      g.mat('wood', shadeHex(o.inner.dado ? o.inner.dado.tint : '#6b4a2f', 0.9)); L.box(p0 - 0.05, sill - 0.04, 0.3, p1 + 0.05, sill, 0.46, { bevel: 0.008 });
    });
    pilaster(s, sd, a0 + p0 - 0.32, LOT_H + 0.37);
    pilaster(s, sd, a0 + p1 + 0.32, LOT_H + 0.37);
  }
  pilaster(s, sd, a0 + dw[0] - 0.32, LOT_H + 0.37); pilaster(s, sd, a0 + dw[0] + dw[1] + 0.32, LOT_H + 0.37);
  pilaster(s, sd, a0 + 0.16, LOT_H + 0.37); pilaster(s, sd, a1 - 0.16, LOT_H + 0.37);
  // the doorway: a stone threshold, the door's leaves folded back into the reveals
  s.structure(() => {
    g.mat('stone', '#b9ae9a'); L.box(dw[0], 0, -0.12, dw[0] + dw[1], 0.012, 0.36, { faces: 'Y' });
    g.mat('paint', o.fin.door || fr);
    for (const sg of [0, 1]) { const pp = sg ? dw[0] + dw[1] - 0.06 : dw[0] + 0.02; L.box(pp, 0.02, 0.36, pp + 0.04, dw[2] - 0.08, 0.36 + Math.min(0.75, dw[1] / 4)); }
  });
  await tk();
  if (o.fascia) L.sign(o.fascia, dw[0] + dw[1] / 2, 2.95, -0.04, [0, -1], { w: o.fasciaW || Math.min(4, W * 0.18), h: 0.42, glow: o.glow === undefined ? 1.6 : o.glow, board: false });
  await tk();
  return { mid: dw[0] + dw[1] / 2 };
}

// Lines the front windows want: tall windows at even spacing in [p0, p1], each about `w` wide.
export function windowsIn(p0, p1, w, gap) {
  const out = [], span = p1 - p0; if (span < w + 0.6) return out;
  const n = Math.max(1, Math.floor((span + gap) / (w + gap)));
  const step = span / n;
  for (let k = 0; k < n; k++) out.push([p0 + step * (k + 0.5) - w / 2, w]);
  return out;
}
