// The halls' kit: the lot's own coordinates and the props every hall stamps hundreds of times.
// p runs along the hall's front from its low end, q runs inward from the front line (q = D is the back wall, the kitchen
// lies beyond it). A local angle `a` faces (sin a, cos a) in (p, q): a = 0 faces the back wall, a = PI faces the court,
// a = PI / 2 faces +p. Everything here works the same for a footprint mirrored or turned any way.
import { floor, ceiling, wall, lamp, roomGlow } from '../world/kit.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { orient } from '../city/lots.js';
import { shadeHex } from '../core/util.js';

export function local(s, lot) {
  const o = orient(lot), g = s.g, P = o.P, f = lot.front;
  const dirOf = (dp, dq) => { const a = P(0, 0), b = P(dp, dq); return [b[0] - a[0], b[1] - a[1]]; };
  const yaw = (a) => { const d = dirOf(Math.sin(a), Math.cos(a)); return Math.atan2(d[0], d[1]); };
  const face = (dp, dq) => { const d = dirOf(dp, dq); return Math.abs(d[0]) > Math.abs(d[1]) ? (d[0] > 0 ? 'X' : 'x') : (d[1] > 0 ? 'Z' : 'z'); };
  const B = (p0, q0, p1, q1) => o.box(p0, q0, p1, q1);
  const plusQisA = (() => { const d = dirOf(0, 1); return d[0] + d[1] > 0; })();
  const plusPisA = (() => { const d = dirOf(1, 0); return d[0] + d[1] > 0; })();
  const pt = (p, y, q) => { const a = P(p, q); return [a[0], y, a[1]]; };
  // frame (x, z) back to (p, q)
  const inv = (x, z) => f === 'n' ? [x - lot.x0, z - lot.z0] : f === 's' ? [x - lot.x0, lot.z1 - z] : f === 'w' ? [z - lot.z0, x - lot.x0] : [z - lot.z0, lot.x1 - x];
  // does the (p, q) -> (x, z) map keep handedness? (then a quad wound counter-clockwise in (p, y, q) stays so)
  const keeps = (() => { const a = dirOf(1, 0), b = dirOf(0, 1); return a[0] * b[1] - a[1] * b[0] > 0; })();
  const L = {
    o, W: o.W, D: o.D, g, s, P, B, yaw, face, pt, inv, dirOf,
    pyaw: (a) => Math.PI - yaw(a),                 // the player's yaw to look the way a spot of local angle a faces
    box(p0, y0, q0, p1, y1, q1, opts) { const b = B(p0, q0, p1, q1); g.box(b[0], y0, b[1], b[2], y1, b[3], opts); },
    solid(p0, y0, q0, p1, y1, q1, opts) { const b = B(p0, q0, p1, q1); return s.solid(b[0], y0, b[1], b[2], y1, b[3], opts); },
    block(p0, y0, q0, p1, y1, q1, mat, tint, opts) {
      const b = B(p0, q0, p1, q1); g.mat(mat, tint, opts && opts.mo); g.box(b[0], y0, b[1], b[2], y1, b[3], { bevel: opts && opts.bevel, aoBottom: 0.7, faces: opts && opts.faces });
      s.flush({ tier: (opts && opts.tier) || 's', cast: !opts || opts.cast !== false }); if (!opts || !opts.noCollide) s.solid(b[0], y0, b[1], b[2], y1, b[3], { surf: opts && opts.surf });
    },
    floor(p0, q0, p1, q1, y, mat, tint, opts) { const b = B(p0, q0, p1, q1); floor(s, b[0], b[1], b[2], b[3], y, mat, tint, opts); },
    ceiling(p0, q0, p1, q1, y, mat, tint, opts) { const b = B(p0, q0, p1, q1); ceiling(s, b[0], b[1], b[2], b[3], y, mat, tint, opts); },
    clip(p0, y0, q0, p1, y1, q1, pad) { const b = B(p0, q0, p1, q1), d = pad === undefined ? 0.06 : pad; return [b[0] - d, y0, b[1] - d, b[2] + d, y1, b[3] + d]; },
    glowBox(p0, y0, q0, p1, y1, q1, opt) { const b = B(p0, q0, p1, q1); return roomGlow(s, b[0], y0, b[1], b[2], y1, b[3], opt); },
    ambient(p0, y0, q0, p1, y1, q1, opt) { const b = B(p0, q0, p1, q1); return s.ambient(Object.assign({}, opt, { box: [b[0], y0, b[1], b[2], y1, b[3]] })); },
    // a wall along p at q (openings' `at` measured from p0). opts.inner / opts.outer: { mat, tint } for the +q / -q faces
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
    // lamps and lights: o.face as a local direction [dp, dq]; o.to as a local point [p, y, q]; clip in frame coordinates
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
    // a quad given counter-clockwise as seen from the front in local (p, y, q); fixed up for a mirrored footprint
    quad(a, b, c, d, opt) { const A = pt(a[0], a[1], a[2]), Bq = pt(b[0], b[1], b[2]), C = pt(c[0], c[1], c[2]), Dq = pt(d[0], d[1], d[2]); if (keeps) g.quad(A, Bq, C, Dq, opt); else g.quad(A, Dq, C, Bq, opt); },
    // a convex polygon in (p, q), pulled up from y0 to y1 (subdivide long sides yourself: the drum bends only what has vertices)
    prism(poly, y0, y1, opt) {
      const pts = poly.map((v) => P(v[0], v[1])); let ar = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; ar += a[0] * b[1] - b[0] * a[1]; }
      // prism wants the order (0,0),(1,0),(1,1),(0,1) in (x, z): a positive signed area
      g.prism(ar < 0 ? pts.reverse() : pts, y0, y1, opt);
    },
    loop(name, p, y, q, opt) { const c = P(p, q); return s.loop(name, c[0], y, c[1], opt); },
    sfx(game, name, p, y, q, opt) { if (!game.sfxAt) return; const c = P(p, q); game.sfxAt(name, s.frame, c[0], y, c[1], opt); },
    // the player's local (p, q)
    where(game) { const pl = game.player; if (!pl || pl.frame !== s.frame) return null; return inv(pl.pos.x, pl.pos.z); },
    flush(opt) { s.flush(opt); },
  };
  return L;
}

// Pick from a list by a seed and a salt, so two choices in one block do not move together.
export function pickBy(seed, salt, list) { const v = Math.sin(((seed % 100003) + 1) * 12.9898 + salt * 78.233) * 43758.5453; return list[Math.floor((v - Math.floor(v)) * list.length) % list.length]; }
// Fill {braces} in a line.
export function fill(line, vars) { return line.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)); }

// ---------------------------------------------------------------------------------------------------------------
// Props. Cheap where there are hundreds of them; front toward +z.
// ---------------------------------------------------------------------------------------------------------------

// One laid place: a woven mat, a lidded bowl and a spoon. About ninety triangles, so a hall can have four hundred.
// p: { mat (colour), glaze, lid, heavy: true (a cast lid, wider and taller than the bowl, for the High decks) }
defineProp('lots-halls.place', (g, p) => {
  g.mat('weave', p.mat || '#d9c7a6'); g.box(-0.19, 0, -0.13, 0.19, 0.004, 0.13, { faces: 'Y' });
  const c = p.glaze || '#e9e1cf';
  g.mat('glaze', c); g.lathe(0, 0, [[0.042, 0.004], [0.078, 0.042], [0.08, 0.054]], { segs: 8, capBottom: false, capTop: false });
  if (p.heavy) {
    g.mat('cast', p.lid || '#9a7a4a', { rough: -0.2 }); g.lathe(0, 0, [[0.098, 0.05], [0.085, 0.09], [0.035, 0.128], [0, 0.134]], { segs: 8, capBottom: false, capTop: false });
    g.mat('cast', shadeHex(p.lid || '#9a7a4a', 0.7)); g.lathe(0, 0, [[0.024, 0.128], [0.024, 0.155], [0, 0.16]], { segs: 5, capBottom: false, capTop: false });
  } else {
    g.mat('glaze', p.lid || c); g.lathe(0, 0, [[0.083, 0.052], [0.05, 0.084], [0.014, 0.094], [0, 0.106]], { segs: 8, capBottom: false, capTop: false });
  }
  g.mat('cast', '#c9b98a'); g.box(0.12, 0.004, -0.07, 0.135, 0.011, 0.08, { faces: 'Yx' });
  return { cast: false };
});
// A lidded bowl on its own (the pass, the island). p: { glaze, lid }
defineProp('lots-halls.bowl', (g, p) => {
  const c = p.glaze || '#e9e1cf';
  g.mat('glaze', c); g.lathe(0, 0, [[0.042, 0], [0.078, 0.038], [0.08, 0.05]], { segs: 8, capTop: false });
  g.mat('glaze', p.lid || c); g.lathe(0, 0, [[0.083, 0.048], [0.03, 0.086], [0, 0.104]], { segs: 8, capBottom: false, capTop: false });
  return { cast: false };
});
// A stack of lids or nested bowls, ridged every other one. p: { n, glaze, r }
defineProp('lots-halls.stack', (g, p) => {
  const n = p.n || 6, r = p.r || 0.085; const prof = [[r * 0.6, 0]];
  for (let i = 0; i < n; i += 2) { prof.push([r, i * 0.03 + 0.02]); prof.push([r * 0.93, i * 0.03 + 0.05]); }
  prof.push([r * 0.5, n * 0.03 + 0.01]); prof.push([0, n * 0.03 + 0.012]);
  g.mat('glaze', p.glaze || '#e9e1cf'); g.lathe(0, 0, prof, { segs: 8 });
  return { cast: false };
});
// A plain bench, with or without a back. p: { len, wood, back }. People sit facing +z.
defineProp('lots-halls.bench', (g, p) => {
  const L = p.len || 2, wood = p.wood || '#7a5233';
  g.mat('wood', wood, { rough: -0.05 }); g.box(-L / 2, 0.41, -0.17, L / 2, 0.45, 0.17);
  if (p.back) { g.box(-L / 2, 0.62, -0.2, L / 2, 0.72, -0.17); g.box(-L / 2, 0.8, -0.21, L / 2, 0.9, -0.18); }
  g.mat('wood', shadeHex(wood, 0.75));
  for (const x of [-L / 2 + 0.12, L / 2 - 0.12]) { g.box(x - 0.03, 0, -0.15, x + 0.03, 0.41, 0.15); if (p.back) g.box(x - 0.03, 0.41, -0.21, x + 0.03, 0.92, -0.17); }
  const spots = []; const n = Math.max(1, Math.floor(L / 0.75)); for (let i = 0; i < n; i++) spots.push({ type: 'sit', x: -L / 2 + (i + 0.5) * L / n, y: 0.45, z: 0, yaw: 0 });
  return { solid: [[-L / 2, 0, -0.18, L / 2, 0.45, 0.17]], spots, tier: 's' };
});

// An enamel pendant on a drop rod: a shallow cone, a glowing underside. No light of its own (the hall's tubes do that).
defineProp('lots-halls.pendant', (g, p) => {
  const drop = p.drop || 0.6;
  g.mat('cast', '#2e2822'); g.tube([[0, 0, 0], [0, -drop, 0]], 0.007, { segs: 4, caps: false });
  g.mat('paint', p.shade || '#2f6c66', { rough: -0.2 }); g.lathe(0, 0, [[0.2, -drop - 0.17], [0.15, -drop - 0.1], [0.05, -drop - 0.02], [0.03, -drop]], { segs: 10, capBottom: false });
  g.mat('diffuser', '#ffe0b0', { emissive: 4, lamp: true }); g.lathe(0, 0, [[0.19, -drop - 0.165], [0, -drop - 0.13]], { segs: 10, capBottom: false, capTop: false });
  return { tier: 's', cast: false };
});

// An opal globe on a long drop, for the whitewashed halls.
defineProp('lots-halls.globe', (g, p) => {
  const drop = p.drop || 0.9, r = p.r || 0.17;
  g.mat('brushed', '#8a8070'); g.tube([[0, 0, 0], [0, -drop + r, 0]], 0.005, { segs: 4, caps: false }); g.cyl(0, -drop + r * 0.85, 0, r * 0.32, 0.05, { segs: 8 });
  g.mat('diffuser', p.glow || '#fff1dc', { emissive: 4.5, lamp: true }); g.ball(0, -drop, 0, r, r, r, { segs: 10, rings: 6 });
  return { tier: 's', cast: false };
});

// A cloth lantern, slung low over a table, for the felt halls.
defineProp('lots-halls.lantern', (g, p) => {
  const drop = p.drop || 0.7, r = p.r || 0.2, h = r * 1.4;
  g.mat('weave', '#3a3028'); g.tube([[0, 0, 0], [0, -drop + h / 2, 0]], 0.005, { segs: 4, caps: false });
  g.mat('paper', p.col || '#f2b56b', { emissive: 2.4, lamp: true });
  g.lathe(0, 0, [[r * 0.35, -drop - h / 2], [r, -drop - h * 0.1], [r * 0.9, -drop + h * 0.25], [r * 0.35, -drop + h / 2]], { segs: 8 });
  g.mat('wood', '#3b2a1e'); g.cyl(0, -drop + h / 2, 0, r * 0.36, 0.025, { segs: 8 });
  return { tier: 's', cast: false };
});

// A little reading lamp for the elders' table: a weighted brass foot, a stem, a pleated shade.
defineProp('lots-halls.tablelamp', (g, p) => {
  g.mat('cast', '#a88445', { rough: -0.2 }); g.lathe(0, 0, [[0.07, 0], [0.07, 0.02], [0.02, 0.04], [0.012, 0.05], [0.012, 0.3]], { segs: 8 });
  g.mat('paper', p.shade || '#e8c88a', { emissive: 1.6, lamp: true }); g.lathe(0, 0, [[0.11, 0.26], [0.06, 0.38]], { segs: 8, capBottom: false, capTop: false });
  return { cast: false };
});

// A wall clock: a turned case, a cream face, two hands at ten to two.
defineProp('lots-halls.clock', (g, p) => {
  const R = p.r || 0.24;
  g.push(); g.rotX(Math.PI / 2);
  g.mat('wood', p.wood || '#4b2f1f', { rough: -0.1 }); g.lathe(0, 0, [[R + 0.03, -0.06], [R + 0.04, -0.02], [R + 0.02, 0.0], [R, 0.0]], { segs: 18 });
  g.mat('paint', '#efe6d0'); g.lathe(0, 0, [[R, -0.004], [0, -0.01]], { segs: 18, capBottom: false, capTop: false });
  g.pop();
  g.mat('cast', '#2a2420'); g.box(-0.008, 0, 0.012, 0.008, R * 0.7, 0.018); g.push(); g.move(0, 0, 0.02); g.rotZ(-1.05); g.box(-0.007, 0, -0.003, 0.007, R * 0.5, 0.003); g.pop();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.box(Math.sin(a) * R * 0.85 - 0.006, Math.cos(a) * R * 0.85 - 0.012, 0.011, Math.sin(a) * R * 0.85 + 0.006, Math.cos(a) * R * 0.85 + 0.012, 0.014); }
  return { cast: false };
});

// A guest's crock with a cloth cap tied on and a paper tag. p: { glaze, cap, h }
defineProp('lots-halls.guestcrock', (g, p) => {
  const h = p.h || 0.16, r = p.r || 0.065;
  g.mat('glaze', p.glaze || '#8a5a3c'); g.lathe(0, 0, [[r * 0.8, 0], [r, h * 0.2], [r * 1.02, h * 0.7], [r * 0.75, h * 0.92], [r * 0.78, h]], { segs: 8, capTop: false });
  g.mat('weave', p.cap || '#e8d8b8'); g.lathe(0, 0, [[r * 0.98, h * 0.82], [r * 1.0, h * 0.98], [r * 0.6, h * 1.08], [0, h * 1.1]], { segs: 8, capBottom: false });
  g.mat('paper', '#f1ead8'); g.box(r * 0.5, h * 0.4, r * 0.8, r * 0.5 + 0.045, h * 0.4 + 0.03, r * 0.8 + 0.002);
  return { cast: false };
});

// A sprig in a jar of water: a guest's gift, cut that morning.
defineProp('lots-halls.sprig', (g, p) => {
  g.mat('plain', '#cfe0dc', { rough: -0.4 }); g.lathe(0, 0, [[0.03, 0], [0.034, 0.01], [0.034, 0.08], [0.028, 0.095]], { segs: 8, capTop: false });
  g.mat('bark', '#5a6a3a'); g.tube([[0, 0.02, 0], [0.006, 0.14, 0.004], [0.012, 0.2, 0.0]], 0.003, { segs: 3 });
  g.mat(p.fine ? 'leafB' : 'leafA', p.leaf || '#cfe8a0', { sway: 0.4 });
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + (p.seed || 0); g.card(Math.cos(a) * 0.01, 0.09, Math.sin(a) * 0.01, 0.07, 0.12, a, { tilt: 0.25 }); }
  return { cast: false };
});

// The things down the middle of a table, lighter than Candlewick's because a block hall has a hundred of them.
// A lidded water jug with a pinched spout. p: { glaze }
defineProp('lots-halls.jug', (g, p) => {
  const c = p.glaze || '#e9e1cf';
  g.mat('glaze', c, { rough: -0.1 }); g.lathe(0, 0, [[0.05, 0], [0.074, 0.07], [0.068, 0.16], [0.05, 0.21], [0.054, 0.232]], { segs: 8, capTop: false });
  g.mat('glaze', shadeHex(c, 0.75)); g.lathe(0, 0, [[0.056, 0.23], [0.03, 0.25], [0, 0.262]], { segs: 8, capBottom: false, capTop: false });
  g.mat('glaze', c); g.tube([[-0.066, 0.19, 0], [-0.11, 0.15, 0], [-0.07, 0.07, 0]], 0.01, { segs: 4, caps: false }); g.box(0.045, 0.2, -0.016, 0.082, 0.226, 0.016);
  return { cast: false };
});
// A big lidded tureen with two lugs. p: { glaze, lid }
defineProp('lots-halls.tureen', (g, p) => {
  const c = p.glaze || '#b5653a', r = 0.15;
  g.mat('glaze', c, { rough: -0.08 }); g.lathe(0, 0, [[r * 0.55, 0], [r * 0.95, r * 0.45], [r, r * 0.72]], { segs: 10, capTop: false });
  g.mat('glaze', p.lid || shadeHex(c, 1.2)); g.lathe(0, 0, [[r * 1.02, r * 0.72], [r * 0.6, r * 1.02], [r * 0.16, r * 1.12], [r * 0.2, r * 1.26], [0, r * 1.3]], { segs: 10, capBottom: false, capTop: false });
  g.mat('glaze', c); for (const s of [-1, 1]) g.box(s * r - 0.025, r * 0.52, -0.03, s * r + 0.025, r * 0.62, 0.03);
  return { cast: false };
});
// A pot of cut-and-come-again herbs on a saucer. p: { pot, leaf, seed }
defineProp('lots-halls.herbs', (g, p) => {
  g.mat('glaze', p.pot || '#b4643e', { rough: 0.15 }); g.lathe(0, 0, [[0.07, 0], [0.085, 0.012], [0.07, 0.016], [0.08, 0.11], [0.088, 0.125]], { segs: 8, capTop: false });
  g.mat('soil', '#ffffff'); g.lathe(0, 0, [[0.08, 0.108], [0, 0.11]], { segs: 8, capBottom: false, capTop: false });
  g.mat('leafB', p.leaf || '#cfe8a0', { sway: 0.4 });
  for (let i = 0; i < 4; i++) { const a = i * 1.6 + (p.seed || 0); g.card(Math.cos(a) * 0.02, 0.1, Math.sin(a) * 0.02, 0.17, 0.2, a, { tilt: 0.3 }); }
  return { cast: false };
});
// A small lidded crock. p: { glaze, h, r }
defineProp('lots-halls.crock', (g, p) => {
  const h = p.h || 0.2, r = p.r || 0.08;
  g.mat('glaze', p.glaze || '#8a5a3c'); g.lathe(0, 0, [[r * 0.8, 0], [r, h * 0.3], [r * 0.95, h * 0.8], [r * 0.75, h * 0.92]], { segs: 8, capTop: false });
  g.mat('glaze', shadeHex(p.glaze || '#8a5a3c', 1.25)); g.lathe(0, 0, [[r * 0.8, h * 0.9], [r * 0.25, h * 1.02], [0, h * 1.08]], { segs: 8, capBottom: false, capTop: false });
  return { cast: false };
});
// The Nine: a small deep-blue pot with a gold lid.
defineProp('lots-halls.nine', (g) => {
  g.mat('glaze', '#24366b', { rough: -0.15 }); g.lathe(0, 0, [[0.035, 0], [0.05, 0.045], [0.045, 0.056]], { segs: 8, capTop: false });
  g.mat('glaze', '#e6c46a'); g.lathe(0, 0, [[0.05, 0.054], [0.012, 0.072], [0, 0.084]], { segs: 8, capBottom: false, capTop: false });
  return { cast: false };
});
// A small stool, square, for the children's table. p: { h, wood }
defineProp('lots-halls.stool', (g, p) => {
  const h = p.h || 0.34; g.mat('wood', p.wood || '#7a5a3a');
  g.box(-0.15, h - 0.03, -0.15, 0.15, h, 0.15, { faces: 'xXyYzZ' });
  for (const sx of [-1, 1]) g.box(sx * 0.12 - 0.02, 0, -0.13, sx * 0.12 + 0.02, h - 0.03, 0.13, { faces: 'xXzZ' });
  return { posts: [[0, 0, 0.15, 0, h]], tier: 's' };
});
// A plain chair for the ends of a table: square legs, a seat, a back of two rails. p: { wood, seat }
defineProp('lots-halls.chair', (g, p) => {
  const wood = p.wood || '#6b4a2f';
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) { g.box(sx * 0.18 - 0.02, 0, 0.14, sx * 0.18 + 0.02, 0.43, 0.18); g.box(sx * 0.18 - 0.02, 0, -0.2, sx * 0.18 + 0.02, 0.92, -0.16); }
  g.box(-0.21, 0.42, -0.21, 0.21, 0.45, 0.2, { bevel: 0.01 });
  g.box(-0.18, 0.78, -0.2, 0.18, 0.9, -0.17); g.box(-0.18, 0.6, -0.195, 0.18, 0.64, -0.175);
  if (p.seat) { g.mat('felt', p.seat); g.box(-0.19, 0.45, -0.18, 0.19, 0.47, 0.17); }
  return { posts: [[0, 0, 0.2, 0, 0.46]], tier: 's' };
});
// A stockpot with a lid and two handles, held on the loop. p: { r, h, metal }
defineProp('lots-halls.pot', (g, p) => {
  const r = p.r || 0.22, h = p.h || 0.4, m = p.metal || '#c3beb4';
  g.mat('brushed', m, { rough: 0.22 }); g.lathe(0, 0, [[r, 0], [r, h], [r + 0.01, h + 0.01]], { segs: 12, capTop: false });
  g.mat('brushed', shadeHex(m, 0.9)); g.lathe(0, 0, [[r + 0.01, h + 0.01], [r * 0.3, h + 0.05], [0.025, h + 0.06], [0, h + 0.1]], { segs: 12, capBottom: false, capTop: false });
  g.mat('cast', '#2a2624'); for (const s of [-1, 1]) g.box(s * r - (s > 0 ? 0 : 0.05), h - 0.07, -0.04, s * r + (s > 0 ? 0.05 : 0), h - 0.05, 0.04);
  return { posts: [[0, 0, r, 0, h]], tier: 's' };
});

// Five plates stood on edge along a plate shelf, leaning back against the wall (faces toward +z). p: { glazes: [5] }
const PLATE_COLS = ['#e9e1cf', '#a9c6b0', '#d4a24a', '#3a4a7a', '#b5653a', '#8fb3c4'];
defineProp('lots-halls.platerow', (g, p) => {
  for (let i = 0; i < 5; i++) {
    g.push(); g.move(-0.68 + i * 0.34, 0.12, -0.03); g.rotX(Math.PI / 2 - 0.2);
    g.mat('glaze', PLATE_COLS[((p.k || 0) + i * 5) % 6]); g.lathe(0, 0, [[0.12, 0.01], [0.075, -0.004], [0, 0.0]], { segs: 8, capBottom: false, capTop: false });
    g.pop();
  }
  return { cast: false };
});

// A long settle for the High decks: a bench with a panelled back, so nobody has to hold themselves up after supper.
// p: { len, wood, cushion }. Its back is on the -z side; people sit facing +z.
defineProp('lots-halls.settle', (g, p) => {
  const L = p.len || 3, wood = p.wood || '#5a3a26';
  g.mat('wood', wood, { rough: -0.06 }); g.box(-L / 2, 0.41, -0.2, L / 2, 0.45, 0.17, { bevel: 0.012 });
  g.box(-L / 2, 0.45, -0.24, L / 2, 0.98, -0.2, { faces: 'xXyYz' }); g.box(-L / 2, 0.98, -0.25, L / 2, 1.02, -0.18, { faces: 'xXYzZ' });
  g.mat('wood', shadeHex(wood, 1.25)); for (let x = -L / 2 + 0.12; x < L / 2 - 0.4; x += 0.75) g.box(x, 0.54, -0.201, x + 0.6, 0.9, -0.196, { faces: 'Z' });
  g.mat('wood', shadeHex(wood, 0.75)); for (const x of [-L / 2 + 0.06, L / 2 - 0.06]) g.box(x - 0.04, 0, -0.24, x + 0.04, 0.72, 0.17, { faces: 'xXYzZ' });
  if (L > 2.2) g.box(-0.04, 0, -0.2, 0.04, 0.41, 0.12, { faces: 'xXZ' });
  if (p.cushion) { g.mat('felt', p.cushion); g.box(-L / 2 + 0.06, 0.45, -0.19, L / 2 - 0.06, 0.48, 0.15, { faces: 'YxXzZ' }); }
  return { solid: [[-L / 2, 0, -0.24, L / 2, 0.48, 0.17]], tier: 's' };
});
