// A small kit for the theatre and the reading rooms: everything in the lot's own coordinates (p along the front from its
// low end, q inward from the front line), so one plan fits a footprint mirrored or turned any way. A local angle `a`
// faces (sin a, cos a) in (p, q): a = 0 faces the back wall, a = PI faces the street, a = PI / 2 faces +p.
// Also the props both lots share: a remade theatre seat, a bay of books, a felt hanging, pigeonholes.
import { floor, ceiling, wall, lamp, roomGlow, stairs } from '../world/kit.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door } from '../world/doors.js';
import { orient } from '../city/lots.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';

export function local(s, lot) {
  const o = orient(lot), g = s.g, P = o.P;
  const dirOf = (dp, dq) => { const a = P(0, 0), b = P(dp, dq); return [b[0] - a[0], b[1] - a[1]]; };
  const yaw = (a) => { const d = dirOf(Math.sin(a), Math.cos(a)); return Math.atan2(d[0], d[1]); };
  const face = (dp, dq) => { const d = dirOf(dp, dq); return Math.abs(d[0]) > Math.abs(d[1]) ? (d[0] > 0 ? 'X' : 'x') : (d[1] > 0 ? 'Z' : 'z'); };
  const B = (p0, q0, p1, q1) => o.box(p0, q0, p1, q1);
  const plusQisA = (() => { const d = dirOf(0, 1); return d[0] + d[1] > 0; })();
  const plusPisA = (() => { const d = dirOf(1, 0); return d[0] + d[1] > 0; })();
  const pt = (p, y, q) => { const a = P(p, q); return [a[0], y, a[1]]; };
  const finish = (opts, plusIsA) => {
    const w = Object.assign({}, opts);
    if (opts && (opts.inner || opts.outer)) { const I = opts.inner || {}, O = opts.outer || {}; const A = plusIsA ? I : O, Bf = plusIsA ? O : I; if (A.tint) w.tintA = A.tint; if (A.mat) w.matA = A.mat; if (Bf.tint) w.tintB = Bf.tint; if (Bf.mat) w.matB = Bf.mat; }
    delete w.inner; delete w.outer; return w;
  };
  const L = {
    o, W: o.W, D: o.D, g, s, P, B, yaw, face, pt, dirOf,
    pyaw: (a) => Math.PI - yaw(a),                     // the player's yaw to look the way a spot of local angle a faces
    box(p0, y0, q0, p1, y1, q1, opts) { const b = B(p0, q0, p1, q1); g.box(b[0], y0, b[1], b[2], y1, b[3], opts); },
    solid(p0, y0, q0, p1, y1, q1, opts) { const b = B(p0, q0, p1, q1); return s.solid(b[0], y0, b[1], b[2], y1, b[3], opts); },
    block(p0, y0, q0, p1, y1, q1, mat, tint, opts) {
      const b = B(p0, q0, p1, q1); g.mat(mat, tint, opts && opts.mo); g.box(b[0], y0, b[1], b[2], y1, b[3], { bevel: opts && opts.bevel, aoBottom: 0.7, faces: opts && opts.faces });
      s.flush({ tier: 's', cast: !opts || opts.cast !== false }); if (!opts || !opts.noCollide) s.solid(b[0], y0, b[1], b[2], y1, b[3], { surf: opts && opts.surf });
    },
    floor(p0, q0, p1, q1, y, mat, tint, opts) { const b = B(p0, q0, p1, q1); floor(s, b[0], b[1], b[2], b[3], y, mat, tint, opts); },
    ceiling(p0, q0, p1, q1, y, mat, tint, opts) { const b = B(p0, q0, p1, q1); ceiling(s, b[0], b[1], b[2], b[3], y, mat, tint, opts); },
    clip(p0, y0, q0, p1, y1, q1, pad) { const b = B(p0, q0, p1, q1), d = pad === undefined ? 0.06 : pad; return [b[0] - d, y0, b[1] - d, b[2] + d, y1, b[3] + d]; },
    glowBox(p0, y0, q0, p1, y1, q1, opt) { const b = B(p0, q0, p1, q1); return roomGlow(s, b[0], y0, b[1], b[2], y1, b[3], opt); },
    // a wall along p at q, from p0 to p1 (openings measured from p0). opts.inner / opts.outer: { mat, tint } of the +q / -q faces
    wallP(q, p0, p1, y0, h, opts) { const a = P(p0, q), b = P(p1, q); wall(s, a[0], a[1], b[0], b[1], y0, h, finish(opts, plusQisA)); },
    // a wall along q at p, from q0 to q1 (openings measured from q0). opts.inner / opts.outer: the +p / -p faces
    wallQ(p, q0, q1, y0, h, opts) { const a = P(p, q0), b = P(p, q1); wall(s, a[0], a[1], b[0], b[1], y0, h, finish(opts, plusPisA)); },
    lamp(kind, p, y, q, opts) {
      const a = P(p, q), oo = Object.assign({}, opts);
      if (opts && opts.face) oo.face = face(opts.face[0], opts.face[1]);
      if (opts && opts.to) oo.to = pt(opts.to[0], opts.to[1], opts.to[2]);
      if (opts && opts.dir) { const d = dirOf(opts.dir[0], opts.dir[2]); oo.dir = [d[0], opts.dir[1], d[1]]; }
      lamp(s, kind, a[0], y, a[1], oo);
    },
    light(o2) { const oo = Object.assign({}, o2); oo.at = pt(o2.at[0], o2.at[1], o2.at[2]); if (o2.to) oo.to = pt(o2.to[0], o2.to[1], o2.to[2]); if (o2.dir) { const d = dirOf(o2.dir[0], o2.dir[2]); oo.dir = [d[0], o2.dir[1], d[1]]; } return s.light(oo); },
    prop(name, p, y, q, a, params, opt) { const c = P(p, q); return prop(s, name, c[0], y, c[1], yaw(a || 0), params, opt); },
    // a prop drawn along its local +x from 0 to len, placed so that its middle is at local (p, q)
    propMid(name, len, p, y, q, a, params, opt) {
      const th = yaw(a || 0), fx = Math.cos(th), fz = -Math.sin(th), dp = dirOf(1, 0), dq = dirOf(0, 1);
      const xp = fx * dp[0] + fz * dp[1], xq = fx * dq[0] + fz * dq[1], c = P(p - xp * len / 2, q - xq * len / 2);
      return prop(s, name, c[0], y, c[1], th, params, opt);
    },
    spot(type, p, y, q, a, opt) { const c = P(p, q); return s.spot(type, c[0], y, c[1], yaw(a || 0), opt); },
    sign(spec, p, y, q, dir, opt) { const c = P(p, q); return sign(s, spec, c[0], y, c[1], Object.assign({ face: face(dir[0], dir[1]) }, opt)); },
    interact(o2) { const c = P(o2.p, o2.q); const oo = Object.assign({}, o2, { x: c[0], z: c[1] }); delete oo.p; delete oo.q; return s.interact(oo); },
    // a walkway through [p, q] or [p, y, q] points
    path(points, opt) { return s.path(points.map((v) => (v.length > 2 ? pt(v[0], v[1], v[2]) : P(v[0], v[1]))), opt); },
    tube(points, r, opt) { g.tube(points.map((v) => pt(v[0], v[1], v[2])), r, opt); },
    lathe(p, q, prof, opt) { const c = P(p, q); g.lathe(c[0], c[1], prof, opt); },
    cyl(p, y, q, r, h, opt) { const c = P(p, q); g.cyl(c[0], y, c[1], r, h, opt); },
    sheet(a, b, c, d, opt) { g.sheet(pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(c[0], c[1], c[2]), pt(d[0], d[1], d[2]), opt); },
    // a quad given counter-clockwise as seen from the side it faces; `double` draws both
    quad(a, b, c, d, opt) { g.quad(pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(c[0], c[1], c[2]), pt(d[0], d[1], d[2]), opt); },
    glass(p0, y0, q0, p1, y1, q1, opt) { const a = P(p0, q0), b = P(p1, q1); return s.glass(a[0], y0, a[1], b[0], y1, b[1], opt); },
    stairs(p, y, q, dir, rise, run, width, opt) { const c = P(p, q); const d = dirOf(dir[0], dir[1]); stairs(s, c[0], y, c[1], Math.abs(d[0]) > Math.abs(d[1]) ? (d[0] > 0 ? 'X' : 'x') : (d[1] > 0 ? 'Z' : 'z'), rise, run, width, opt); },
    ramp(p0, q0, p1, q1, ya, yb, opt) {           // rising from ya at q0 to yb at q1 (along q)
      const b = B(p0, q0, p1, q1), d = dirOf(0, 1), alongX = Math.abs(d[0]) > Math.abs(d[1]), up = (alongX ? d[0] : d[1]) > 0;
      s.ramp(b[0], b[1], b[2], b[3], up ? ya : yb, up ? yb : ya, alongX ? 'x' : 'z', opt);
    },
    // an automatic sliding door in a wall along p at q, between p0 and p0 + w
    doorP(q, p0, w, h, opt) { const a = P(p0, q), d = dirOf(1, 0); door(s, Object.assign({ x: a[0], y: 0, z: a[1], w, h, along: Math.abs(d[0]) > Math.abs(d[1]) ? 'x' : 'z', dir: (Math.abs(d[0]) > Math.abs(d[1]) ? d[0] : d[1]) > 0 ? 1 : -1, kind: 'slide', auto: true, style: 'glazed' }, opt)); },
    loop(name, p, y, q, opt) { const c = P(p, q); return s.loop(name, c[0], y, c[1], opt); },
    sfx(game, name, p, y, q, opt) { if (!game.sfxAt) return; const c = P(p, q); game.sfxAt(name, s.frame, c[0], y, c[1], opt); },
    zone(p0, y0, q0, p1, y1, q1, z) { const b = B(p0, q0, p1, q1); return s.zoneBox(Object.assign({ box: [b[0], y0, b[1], b[2], y1, b[3]] }, z)); },
    // the player's local (p, q), or null when they are not in this lot's frame
    where(game) {
      const pl = game.player; if (!pl || pl.frame !== s.frame) return null; const v = pl.pos, a = P(0, 0), dp = dirOf(1, 0), dq = dirOf(0, 1), rx = v.x - a[0], rz = v.z - a[1];
      return [rx * dp[0] + rz * dp[1], rx * dq[0] + rz * dq[1]];
    },
    place(game, p, y, q, a, pitch) { const c = P(p, q); game.player.place(game.player.frame, c[0], y, c[1], Math.PI - yaw(a), pitch || 0); },
    flush(opt) { s.flush(opt); },
  };
  return L;
}

// Pick one of a list by the lot's seed and a salt, so two lines in one block do not move together.
export function pickBy(seed, salt, list) { const v = Math.sin(((seed >>> 0) % 100000) * 12.9898 + salt * 78.233) * 43758.5453; return list[Math.floor((v - Math.floor(v)) * list.length) % list.length]; }
// n distinct items of a list, by seed and salt
export function someBy(seed, salt, list, n) { const r = new Rng(((seed >>> 0) ^ (salt * 2654435761)) >>> 0); return r.shuffle(list.slice()).slice(0, Math.min(n, list.length)); }

// Say lines (safe without a UI).
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }

// Sit the player at local (p, y, q) looking the way local angle a faces; sitting there again stands. key names the seat.
export function sitHere(L, game, p, y, q, a, key, eye) {
  const pl = game.player; if (!pl) return false;
  if (pl.seat && pl.seat.lotSeat === key) { pl.stand(); return false; }
  const c = L.P(p, q);
  pl.sit({ x: c[0], y, z: c[1], yaw: L.yaw(a), eye: eye || 1.12, lotSeat: key });
  pl.yaw = L.pyaw(a); pl.pitch = -0.04;
  return true;
}
// A 'Get up' prompt that follows a seated player whose seat key starts with `prefix`.
export function getUp(s, prefix) {
  s.interact({ radius: 1.2, priority: 1, prompt: 'Get up',
    pos: (gm) => { const se = gm.player && gm.player.seat; if (!se || !se.lotSeat || se.lotSeat.indexOf(prefix) !== 0) return null; return [se.x + Math.sin(gm.player.yaw) * 0.6, se.y + 0.9, se.z - Math.cos(gm.player.yaw) * 0.6]; },
    onUse: (gm) => gm.player.stand() });
}

// With ?citylog: triangles, lights, work time (not the time spent waiting on frames) and the longest stretch between ticks.
function trisOf(s) { let n = 0; for (const ch of s.chunks.values()) if (ch.bufs) for (const k in ch.bufs) n += ch.bufs[k].ni; return n / 3; }
export function measured(name, fn) {
  return async (s, lot, plan, game, tick) => {
    const log = !!(game.params && game.params.citylog);
    const tris0 = log ? trisOf(s) : 0, lights0 = s.lights.length, T0 = performance.now();
    let t0 = T0, work = 0, worst = 0, worstAt = '', last = 'start'; const parts = {};
    const tk = async (label) => { const el = performance.now() - t0; work += el; parts[label || '?'] = (parts[label || '?'] || 0) + el; if (el > worst) { worst = el; worstAt = last + ' to ' + (label || '?'); } last = label || '?'; if (tick) await tick(); t0 = performance.now(); };
    await fn(s, lot, plan, game, tk);
    const el = performance.now() - t0; work += el; if (el > worst) { worst = el; worstAt = last + ' to end'; }
    if (log) { const o = orient(lot); console.log('[lots-theatre] ' + name + ' ' + lot.id + ' front ' + lot.front + ' ' + o.W.toFixed(1) + 'x' + o.D.toFixed(1) + ': ' + Math.round(trisOf(s) - tris0) + ' tris, ' + (s.lights.length - lights0) + ' lights, work ' + work.toFixed(1) + ' ms, longest stretch ' + worst.toFixed(1) + ' ms (' + worstAt + '), wall ' + (performance.now() - T0).toFixed(0) + ' ms; ' + Object.keys(parts).map((k) => k + ' ' + parts[k].toFixed(1)).join(', ')); }
  };
}

// ---------------------------------------------------------------------------------------------------------------
// shared props
// ---------------------------------------------------------------------------------------------------------------
export const FELTS = ['#8c3b26', '#b7832f', '#1f4f55', '#4f2f45', '#33407a', '#6b2a35', '#2f5d50', '#a8412b'];
export const SPINES = ['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f', '#5b4060', '#a0522d', '#2b3a4a', '#6e2f3f', '#c9a96a', '#40504a', '#8c3b26', '#1f3b4d', '#b5653a', '#d6c49a'];
export const TAPES = ['#e0b04a', '#3fa7a3', '#d95d7a', '#e8743b', '#8fd694', '#f2e6c8'];

// A remade theatre seat: five ways of making one, so a row never matches. Drawn at the origin, front toward +z.
// Lean on purpose (a house has two hundred and fifty of them): no bevels, no faces nobody sees.
const SEAT_WOOD = ['#3a2a20', '#6b4a2f', '#5a3a22', '#7a5233', '#4a3222'];
export function drawSeat(g, k, fab, mend) {
  const wood = SEAT_WOOD[k];
  if (k === 0) {            // a tip-up seat on cast standards
    g.mat('cast', '#3a3530'); for (const sx of [-1, 1]) g.box(sx * 0.25 - 0.02, 0, -0.24, sx * 0.25 + 0.02, 0.62, 0.16, { faces: 'xXzZY' });
    g.mat('weave', fab); g.box(-0.23, 0.38, -0.2, 0.23, 0.46, 0.2, { faces: 'YzZy' }); g.box(-0.23, 0.48, -0.27, 0.23, 0.9, -0.19, { faces: 'zZYxX' });
    g.mat('wood', wood); for (const sx of [-1, 1]) g.box(sx * 0.25 - 0.04, 0.6, -0.22, sx * 0.25 + 0.04, 0.64, 0.14, { faces: 'YxXZ' });
  } else if (k === 1) {     // a kitchen chair, slat back, a cushion tied on
    g.mat('wood', wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.19 - 0.02, 0, sz * 0.18 - 0.02, sx * 0.19 + 0.02, sz < 0 ? 0.92 : 0.44, sz * 0.18 + 0.02, { faces: 'xXzZ' });
    g.box(-0.21, 0.42, -0.2, 0.21, 0.45, 0.2, { faces: 'zZxXy' }); for (const yy of [0.66, 0.82]) g.box(-0.19, yy, -0.2, 0.19, yy + 0.07, -0.17, { faces: 'zZY' });
    g.mat('knit', fab); g.box(-0.18, 0.45, -0.17, 0.18, 0.5, 0.18, { faces: 'YxXZ' });
  } else if (k === 2) {     // a small upholstered chair
    g.mat('wood', wood); for (const sx of [-1, 1]) g.box(sx * 0.2 - 0.02, 0, -0.21, sx * 0.2 + 0.02, 0.2, 0.21, { faces: 'xXzZ' });
    g.mat('weave', fab); g.box(-0.24, 0.2, -0.22, 0.24, 0.46, 0.22, { faces: 'YxXZ' }); g.box(-0.24, 0.46, -0.26, 0.24, 0.94, -0.16, { faces: 'YxXzZ' });
  } else if (k === 3) {     // a bentwood chair with a cane seat
    g.mat('wood', wood); for (const sx of [-1, 1]) { g.tube([[sx * 0.2, 0, 0.2], [sx * 0.18, 0.44, 0.17]], 0.018, { segs: 4, caps: false }); g.tube([[sx * 0.2, 0, -0.2], [sx * 0.18, 0.44, -0.17], [sx * 0.17, 0.9, -0.24]], 0.018, { segs: 4, caps: false }); }
    g.tube([[-0.17, 0.9, -0.24], [0, 0.95, -0.26], [0.17, 0.9, -0.24]], 0.018, { segs: 4, caps: false });
    g.mat('cane', mixHex('#d9c08a', fab, 0.15)); g.lathe(0, 0, [[0.21, 0.44], [0.2, 0.46], [0, 0.465]], { segs: 8, capBottom: false, capTop: false });
  } else {                  // a pew end: a short bench with a back, cut down from a longer one
    g.mat('wood', wood); g.box(-0.27, 0.42, -0.2, 0.27, 0.46, 0.2, { faces: 'YzZ' }); g.box(-0.27, 0.5, -0.24, 0.27, 0.92, -0.2, { faces: 'zZYxX' });
    for (const sx of [-1, 1]) g.box(sx * 0.27 - 0.03, 0, -0.24, sx * 0.27 + 0.01, 0.62, 0.2, { faces: 'xXzZY' });
    g.mat('felt', fab); g.box(-0.24, 0.46, -0.18, 0.24, 0.48, 0.18, { faces: 'Y' });
  }
  if (mend) { g.mat('weave', mend); g.box(-0.08, k === 1 ? 0.502 : 0.47, 0.02, 0.07, k === 1 ? 0.506 : 0.475, 0.12, { faces: 'Y' }); }
}
defineProp('lots-theatre.seat', (g, p) => { drawSeat(g, p.k || 0, p.fab || '#8c3b26', null); return { solid: [[-0.24, 0, -0.22, 0.24, 0.46, 0.2]], tier: 'd' }; });
// Half a row of them, n seats 0.58 apart along +x from x = 0, each a different make and cloth. p: { n, cols (cloths), v }
defineProp('lots-theatre.seatrow', (g, p) => {
  const n = p.n || 12, cols = p.cols || ['#8c3b26'], r = new Rng(6007 + (p.v || 0) * 104729 + n);
  for (let i = 0; i < n; i++) {
    g.push(); g.move(i * 0.58, 0, r.f(-0.02, 0.02)); g.rotY(r.f(-0.06, 0.06));
    drawSeat(g, r.i(0, 4), r.pick(cols), r.chance(0.09) ? r.pick(['#e0b04a', '#3fa7a3', '#d95d7a']) : null);
    g.pop();
  }
  return { solid: [[-0.28, 0, -0.24, (n - 1) * 0.58 + 0.28, 0.46, 0.2]], tier: 'd', cast: false };
});

// A run of n bays of shelves full of books, h tall, 0.9 wide each, the books facing +z, the back at z = 0, starting at
// x = 0. p: { n, v (variety), h, wood, sparse }
defineProp('lots-theatre.bay', (g, p) => {
  const h = p.h || 2.2, w = 0.9, D = 0.32, wood = p.wood || '#4a3222', nb = p.n || 1, r = new Rng(9137 + (p.v || 0) * 7919 + nb * 31);
  const n = Math.max(3, Math.round((h - 0.12) / 0.38)), sp = (h - 0.12) / n, L = nb * w;
  g.mat('wood', wood, { rough: -0.04 }); g.box(0, 0, 0, L, h, 0.014, { faces: 'Z' });
  for (let b = 0; b <= nb; b++) g.box(b * w - 0.015, 0, 0.014, b * w + 0.015, h, D, { faces: b === 0 ? 'xZ' : b === nb ? 'XZ' : 'xXZ' });
  g.mat('wood', shadeHex(wood, 0.8)); g.box(0, 0, 0.02, L, 0.09, D - 0.02, { faces: 'Z' });
  g.mat('wood', wood); for (let i = 0; i <= n; i++) { const y = 0.09 + i * sp; g.box(0, y - 0.022, 0.014, L, y, D - 0.01, { faces: i === n ? 'yYZ' : 'YZ' }); }
  for (let b = 0; b < nb; b++) for (let i = 0; i < n; i++) {
    const y = 0.09 + i * sp, room = sp - 0.05, faces = y > 1.45 ? 'xXZ' : 'xXYZ';
    let a = b * w + 0.02;
    while (a < (b + 1) * w - 0.06) {
      if (r.chance(p.sparse ? 0.12 : 0.05)) { a += r.f(0.04, 0.12); continue; }
      const t = r.f(0.035, 0.08), bh = Math.min(room, 0.33) * r.f(0.62, 1), d = r.f(0.18, 0.26);
      if (a + t > (b + 1) * w - 0.02) break;
      const col = mixHex(r.pick(SPINES), r.chance(0.5) ? '#1e1610' : '#e8dcc4', r.f(0, 0.22));
      g.mat('paper', col, { rough: r.f(-0.1, 0.15) }); g.box(a, y, 0.03, a + t, y + bh, 0.03 + d, { faces });
      if (r.chance(0.1)) { g.mat('weave', r.pick(TAPES)); g.box(a - 0.001, y + bh * 0.35, 0.03 + d, a + t + 0.001, y + bh * 0.5, 0.034 + d, { faces: 'Z' }); }
      a += t + 0.002;
    }
  }
  g.mat('wood', shadeHex(wood, 1.15)); g.box(-0.01, h, 0, L + 0.01, h + 0.05, D + 0.03, { faces: 'yYZxX' });
  return { solid: [[0, 0, 0, L, h, D]], tier: 's' };
});

// Pigeonholes with letters in some of them. p: { cols, rows, wood }. Front toward +z, back at z = 0.
defineProp('lots-theatre.holes', (g, p) => {
  const c = p.cols || 6, n = p.rows || 5, cw = 0.24, ch = 0.18, d = 0.28, W = c * cw, H = n * ch, r = new Rng(77 + c * 13 + n);
  g.mat('wood', p.wood || '#5e3f29'); g.box(-W / 2 - 0.02, 0, 0, W / 2 + 0.02, H + 0.04, 0.012, { faces: 'Z' });
  for (let i = 0; i <= c; i++) g.box(-W / 2 + i * cw - 0.01, 0, 0.012, -W / 2 + i * cw + 0.01, H + 0.02, d);
  for (let j = 0; j <= n; j++) g.box(-W / 2, j * ch, 0.012, W / 2, j * ch + 0.018, d, { faces: 'yYZ' });
  for (let i = 0; i < c; i++) for (let j = 0; j < n; j++) {
    if (r.chance(0.35)) continue;
    const x = -W / 2 + i * cw + 0.03, y = j * ch + 0.02, k = r.i(1, 3);
    for (let m = 0; m < k; m++) { g.mat('paper', r.pick(['#efe6d2', '#e6d8b8', '#d9c7a6', '#f2ead8', '#cfe0d8'])); g.box(x + m * 0.012, y + m * 0.006, 0.05, x + cw - 0.05 + m * 0.01, y + 0.008 + m * 0.006, d - 0.02, { faces: 'YZ' }); }
    if (r.chance(0.3)) { g.mat('paper', r.pick(['#efe6d2', '#e6d8b8'])); g.box(x + 0.02, y, d - 0.08, x + 0.09, y + ch - 0.04, d - 0.075, { faces: 'Z' }); }
  }
  return { solid: [[-W / 2, 0, 0, W / 2, H + 0.04, d]], tier: 's' };
});

// A felt hanging on a brass rod, a little off a wall. a, b: [p, q] ends of the rod; `out` is the small offset toward the room
// as [dp, dq]; y0 the rod, y1 the hem. o: { band, mend: [patch, thread], nu }
export function feltHang(L, a, b, y0, y1, tint, out, o = {}) {
  const g = L.g, ox = out[0], oq = out[1];
  L.s.deco(() => {
    g.mat('felt', tint, { rough: 0.1 });
    L.sheet([a[0] + ox, y0, a[1] + oq], [b[0] + ox, y0, b[1] + oq], [b[0] + ox, y1, b[1] + oq], [a[0] + ox, y1, a[1] + oq], { nu: o.nu || 10, nv: 3, ripple: 0.03, rippleN: 8 });
    g.mat('cast', '#b08a45'); L.tube([[a[0] + ox * 1.6, y0 + 0.03, a[1] + oq * 1.6], [b[0] + ox * 1.6, y0 + 0.03, b[1] + oq * 1.6]], 0.014, { segs: 6 });
    if (o.band) { g.mat('felt', o.band); const yb = y1 + (y0 - y1) * 0.1; L.quad([a[0] + ox * 1.4, yb, a[1] + oq * 1.4], [b[0] + ox * 1.4, yb, b[1] + oq * 1.4], [b[0] + ox * 1.4, yb + 0.14, b[1] + oq * 1.4], [a[0] + ox * 1.4, yb + 0.14, a[1] + oq * 1.4], { double: true }); }
    if (o.mend) {
      const t = 0.68, mp = a[0] + (b[0] - a[0]) * t + ox * 1.5, mq = a[1] + (b[1] - a[1]) * t + oq * 1.5, my = y1 + (y0 - y1) * 0.5;
      const up = (b[0] - a[0]) ? 0.14 : 0, uq = (b[1] - a[1]) ? 0.14 : 0;
      g.mat('knit', o.mend[0]); L.quad([mp - up, my - 0.12, mq - uq], [mp + up, my - 0.12, mq + uq], [mp + up, my + 0.12, mq + uq], [mp - up, my + 0.12, mq - uq], { double: true });
      g.mat('weave', o.mend[1]); for (let i = -3; i <= 3; i++) L.tube([[mp - up * 1.1 + ox * 0.3, my + i * 0.032, mq - uq * 1.1 + oq * 0.3], [mp - up * 0.8 + ox * 0.3, my + i * 0.032 + 0.012, mq - uq * 0.8 + oq * 0.3]], 0.003, { segs: 3, caps: false });
    }
  });
}

// A pair of glazed doors in a front at q (the doorway from p0, w wide), hooked open against the reveals, swung inward.
export function openLeaves(L, q, p0, w, h, tint) {
  const g = L.g, lw = w / 2 - 0.06;
  L.s.furniture(() => {
    g.mat('paint', tint, { rough: -0.05 });
    for (const p of [p0 + 0.05, p0 + w - 0.1]) {
      L.box(p, 0, q + 0.06, p + 0.05, 0.62, q + 0.06 + lw, { bevel: 0.006 }); L.box(p, h - 0.12, q + 0.06, p + 0.05, h, q + 0.06 + lw, { bevel: 0.006 });
      L.box(p, 0.62, q + 0.06, p + 0.05, h - 0.12, q + 0.14, { bevel: 0.006 }); L.box(p, 0.62, q + lw - 0.02, p + 0.05, h - 0.12, q + 0.06 + lw, { bevel: 0.006 });
      g.mat('cast', '#c8a45a'); L.box(p - 0.03, 1.0, q + lw - 0.12, p + 0.08, 1.03, q + lw - 0.05); g.mat('paint', tint, { rough: -0.05 });
    }
  });
  for (const p of [p0 + 0.075, p0 + w - 0.075]) { L.glass(p, 0.62, q + 0.14, p, h - 0.12, q + lw - 0.02, { opacity: 0.1 }); L.solid(p - 0.03, 0, q + 0.06, p + 0.03, h, q + 0.06 + lw); }
}

// A felt baffle hanging under a ceiling: a long soft box between two local points at height y.
export function baffle(L, a, b, y, tint, depth) {
  const g = L.g, d = depth || 0.42;
  L.s.deco(() => {
    g.mat('felt', tint); const bx = L.B(Math.min(a[0], b[0]) - 0.03, Math.min(a[1], b[1]) - 0.03, Math.max(a[0], b[0]) + 0.03, Math.max(a[1], b[1]) + 0.03);
    g.box(bx[0], y - d, bx[1], bx[2], y, bx[3], { bevel: 0.02, faces: 'xXzZy' });
  });
}
