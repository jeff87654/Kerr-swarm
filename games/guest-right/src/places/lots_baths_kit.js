// A small kit for the big lots (baths, inn, tea dance): everything in the lot's own coordinates, so one plan fits a
// footprint mirrored or turned any way. p runs along the front from its low end, q runs inward from the front line;
// a local angle `a` faces (sin a, cos a) in (p, q): a = 0 faces the back wall, a = PI faces the street, a = PI / 2 faces +p.
import { floor, ceiling, wall, lamp, roomGlow, stairs } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { orient } from '../city/lots.js';

export function local(s, lot) {
  const o = orient(lot), g = s.g, P = o.P;
  const dirOf = (dp, dq) => { const a = P(0, 0), b = P(dp, dq); return [b[0] - a[0], b[1] - a[1]]; };
  const yaw = (a) => { const d = dirOf(Math.sin(a), Math.cos(a)); return Math.atan2(d[0], d[1]); };
  const face = (dp, dq) => { const d = dirOf(dp, dq); return Math.abs(d[0]) > Math.abs(d[1]) ? (d[0] > 0 ? 'X' : 'x') : (d[1] > 0 ? 'Z' : 'z'); };
  const axis = (dp, dq) => { const d = dirOf(dp, dq); return Math.abs(d[0]) > Math.abs(d[1]) ? (d[0] > 0 ? 'X' : 'x') : (d[1] > 0 ? 'Z' : 'z'); };
  const B = (p0, q0, p1, q1) => o.box(p0, q0, p1, q1);
  const plusQisA = (() => { const d = dirOf(0, 1); return d[0] + d[1] > 0; })();
  const plusPisA = (() => { const d = dirOf(1, 0); return d[0] + d[1] > 0; })();
  const pt = (p, y, q) => { const a = P(p, q); return [a[0], y, a[1]]; };
  const L = {
    o, W: o.W, D: o.D, g, s, P, B, yaw, face, axis, pt,
    // the player looks the other way round: player yaw = PI - spot yaw
    pyaw: (a) => Math.PI - yaw(a),
    box(p0, y0, q0, p1, y1, q1, opts) { const b = B(p0, q0, p1, q1); g.box(b[0], y0, b[1], b[2], y1, b[3], opts); },
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
    // lamps: o.face as a local direction [dp, dq]; o.to as a local point [p, y, q]; o.clip already in frame coordinates
    lamp(kind, p, y, q, opts) {
      const a = P(p, q), oo = Object.assign({}, opts);
      if (opts && opts.face) oo.face = face(opts.face[0], opts.face[1]);
      if (opts && opts.to) oo.to = pt(opts.to[0], opts.to[1], opts.to[2]);
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
    glow(p, y, q, dir, opt) { const c = P(p, q); return s.glowCard(c[0], y, c[1], Object.assign({ face: dir === 'y' ? 'y' : face(dir[0], dir[1]) }, opt)); },
    glass(p0, y0, q0, p1, y1, q1, opt) { const a = P(p0, q0), b = P(p1, q1); return s.glass(a[0], y0, a[1], b[0], y1, b[1], opt); },
    stairs(p, y, q, dir, rise, run, width, opt) { const c = P(p, q); stairs(s, c[0], y, c[1], axis(dir[0], dir[1]), rise, run, width, opt); },
    loop(name, p, y, q, opt) { const c = P(p, q); return s.loop(name, c[0], y, c[1], opt); },
    sfx(game, name, p, y, q, opt) { if (!game.sfxAt) return; const c = P(p, q); game.sfxAt(name, s.frame, c[0], y, c[1], opt); },
    // is the player inside the local box (feet between y0 and y1)?
    inside(game, p0, q0, p1, q1, y0, y1) {
      const pl = game.player; if (!pl || pl.frame !== s.frame) return false; const b = B(p0, q0, p1, q1), v = pl.pos;
      return v.x >= b[0] && v.x <= b[2] && v.z >= b[1] && v.z <= b[3] && v.y >= (y0 === undefined ? -2 : y0) && v.y <= (y1 === undefined ? 8 : y1);
    },
    // the player's local (p, q)
    where(game) {
      const pl = game.player; if (!pl) return null; const v = pl.pos, a = P(0, 0), dp = dirOf(1, 0), dq = dirOf(0, 1), rx = v.x - a[0], rz = v.z - a[1];
      return [rx * dp[0] + rz * dp[1], rx * dq[0] + rz * dq[1]];
    },
    flush(opt) { s.flush(opt); },
  };
  return L;
}

// A ring of 'chat' spots round (p, q), facing in.
export function chatRing(L, p, q, n, r, tags) {
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2 + 0.4; const pp = p + Math.cos(t) * r, qq = q + Math.sin(t) * r; L.spot('chat', pp, 0, qq, Math.atan2(p - pp, q - qq), { tags }); }
}

// Pick one of a list by a seed and a salt (so two lines in one block do not move together).
export function pickBy(seed, salt, list) { const v = Math.sin((seed % 100000) * 12.9898 + salt * 78.233) * 43758.5453; return list[Math.floor((v - Math.floor(v)) * list.length) % list.length]; }

// Lines that vary by band: { low: [...], middle: [...], high: [...] } or a plain list.
export function byBand(info, x) { return Array.isArray(x) ? x : (x[info.band] || x.middle || x.low); }

// Sit the player somewhere, facing the way a spot of local angle `a` faces. key names the seat (sitting again stands).
export function sitPlayer(L, game, p, y, q, a, eye, key, pitch) {
  const pl = game.player; if (!pl) return false;
  if (pl.seat) { pl.stand(); return false; }
  const c = L.P(p, q);
  pl.sit({ x: c[0], y, z: c[1], yaw: L.yaw(a), eye, lot: key });
  pl.yaw = L.pyaw(a); pl.pitch = pitch || 0;
  return true;
}
export function seatedAs(game, key) { const pl = game.player; return !!(pl && pl.seat && pl.seat.lot === key); }
