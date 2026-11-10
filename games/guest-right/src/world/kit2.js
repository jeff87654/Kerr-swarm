// More building blocks: whole rooms, shop fronts, railings, planters, awnings, columns.
import { floor, ceiling, wall, lamp, roomGlow } from './kit.js';
import { sign } from './signs.js';
import { door, doorFrame } from './doors.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';

// A plain room: floor, ceiling, four walls with openings, bounce light. Returns the clip box for its lamps.
// o: { x0, z0, x1, z1, y, h (3), floor: [mat, tint], ceil: [mat, tint], wall: { tint, mat, dado, skirt }, t (wall thickness),
//      open: { n: [...], s: [...], e: [...], w: [...] }  openings per side (n = low z, s = high z, w = low x, e = high x), each { at, w, h, sill }
//           (at is measured from the low-x end for n/s walls and from the low-z end for e/w walls); a side set to false gets no wall at all,
//      glow: { sky, ground, power } | false, level, noCeiling, noFloor }
export function room(s, o) {
  const { x0, z0, x1, z1 } = o, y = o.y || 0, h = o.h || 3, t = o.t || 0.16, op = o.open || {}, lv = o.level;
  if (!o.noFloor) floor(s, x0, z0, x1, z1, y, (o.floor && o.floor[0]) || 'planks', (o.floor && o.floor[1]) || '#a8794f', { level: lv });
  if (!o.noCeiling) ceiling(s, x0, z0, x1, z1, y + h, (o.ceil && o.ceil[0]) || 'paint', (o.ceil && o.ceil[1]) || '#efe6d6', { level: lv });
  const w = Object.assign({ tint: '#e7d9bf' }, o.wall, { level: lv, t });
  const hw = t / 2;
  if (op.n !== false) wall(s, x0, z0 + hw, x1, z0 + hw, y, h, Object.assign({}, w, o.wallN, { openings: op.n || [] }));
  if (op.s !== false) wall(s, x0, z1 - hw, x1, z1 - hw, y, h, Object.assign({}, w, o.wallS, { openings: op.s || [] }));
  if (op.w !== false) wall(s, x0 + hw, z0, x0 + hw, z1, y, h, Object.assign({}, w, o.wallW, { openings: op.w || [] }));
  if (op.e !== false) wall(s, x1 - hw, z0, x1 - hw, z1, y, h, Object.assign({}, w, o.wallE, { openings: op.e || [] }));
  if (o.glow !== false) roomGlow(s, x0, y, z0, x1, y + h, z1, o.glow || {});
  return [x0 - 0.05, y - 0.2, z0 - 0.05, x1 + 0.05, y + h + 0.1, z1 + 0.05];
}

// A shop front on one side of a unit, drawn along x (side 'n' or 's': the street is toward lower z for 'n', higher z for 's')
// or along z (side 'w' or 'e'). It fills the opening between a0 and a1 on the front line `c`, from y to y + h:
// a low plinth, glazing between slim posts, a doorway, a fascia board with the shop's sign, and an optional awning.
// o: { side, a0, a1, c, y, h (3), fascia: sign spec, palette: { frame, plinth, awning }, door: { at (from a0), w (1.1), kind: 'slide' | 'hinge' | 'open',
//      auto: true, tint, label }, plinth (0.5), awning: true | { depth, stripes: [..] }, glass: false (open stall front), lights: true, level, glow (lit fascia) }
// Returns { doorCenter: [x, z], inward: [dx, dz] }.
export function shopfront(s, o) {
  const g = s.g, side = o.side || 's', y = o.y || 0, h = o.h || 3, a0 = o.a0, a1 = o.a1, c = o.c, lv = o.level;
  const alongX = side === 'n' || side === 's'; const out = (side === 's' || side === 'e') ? 1 : -1;         // outward (toward the street)
  const pal = Object.assign({ frame: '#2d3b36', plinth: '#3a4a45', awning: ['#c9552e', '#f1e6cf'] }, o.palette);
  const P = (a, off) => alongX ? [a, c + off * out] : [c + off * out, a];              // (along, outward offset) -> x, z
  const box = (a_0, a_1, off0, off1, y0, y1, opts) => { const p = P(a_0, off0), q = P(a_1, off1); g.box(Math.min(p[0], q[0]), y0, Math.min(p[1], q[1]), Math.max(p[0], q[0]), y1, Math.max(p[1], q[1]), opts); };
  const solid = (a_0, a_1, y0, y1) => { const p = P(a_0, -0.08), q = P(a_1, 0.08); s.solid(Math.min(p[0], q[0]), y0, Math.min(p[1], q[1]), Math.max(p[0], q[0]), y1, Math.max(p[1], q[1])); };
  const fh = o.fasciaH === undefined ? 0.55 : o.fasciaH, top = y + h, head = top - fh;              // glazing runs up to `head`
  const pl = o.plinth === undefined ? 0.5 : o.plinth;
  const d = o.door || {}; const dw = d.w || 1.1; const dAt = d.at === undefined ? (a1 - a0 - dw) / 2 : d.at; const d0 = a0 + dAt, d1 = d0 + dw; const dh = Math.min(d.h || 2.15, head - y);
  // fascia band and its sign
  g.mat('paint', pal.frame); box(a0, a1, -0.1, 0.1, head, top, { bevel: 0.01 });
  s.flush({ tier: 's', level: lv });
  solid(a0, a1, head, top);
  if (o.fascia) {
    const mid = P((a0 + a1) / 2, 0.105); const sw = Math.min(a1 - a0 - 0.3, o.fasciaW || 3.6);
    sign(s, Object.assign({ kind: 'fascia' }, o.fascia), mid[0], head + fh / 2, mid[1], { face: alongX ? (out > 0 ? 'Z' : 'z') : (out > 0 ? 'X' : 'x'), w: sw, h: fh - 0.1, board: false, glow: o.glow || 0, level: lv });
  }
  // corner posts and mullions
  const posts = [a0, a1];
  const bays = [[a0, d0], [d1, a1]];
  for (const b of bays) { const n = Math.max(1, Math.round((b[1] - b[0]) / 1.6)); for (let i = 1; i < n; i++) posts.push(b[0] + (b[1] - b[0]) * i / n); }
  posts.push(d0, d1);
  g.mat('paint', pal.frame);
  for (const a of posts) box(a - 0.045, a + 0.045, -0.06, 0.06, y, head, { bevel: 0.008 });
  // door head (transom) and plinths
  if (dh < head - y - 0.02) box(d0, d1, -0.05, 0.05, y + dh, y + dh + 0.07, { bevel: 0.008 });
  s.flush({ tier: 's', level: lv });
  for (const a of [a0, a1]) solid(a - 0.06, a + 0.06, y, head);
  for (const b of bays) {
    if (b[1] - b[0] < 0.15) continue;
    if (pl > 0) { g.mat('paint', pal.plinth); box(b[0], b[1], -0.07, 0.07, y, y + pl, { aoBottom: 0.65, bevel: 0.008 }); g.mat('wood', shadeHex(pal.frame, 1.3)); box(b[0], b[1], -0.09, 0.11, y + pl, y + pl + 0.035, { bevel: 0.008 }); s.flush({ tier: 's', level: lv }); }
    if (o.glass !== false) { const p = P(b[0] + 0.045, 0), q = P(b[1] - 0.045, 0); s.glass(p[0], y + pl + 0.035, p[1], q[0], head, q[1], { level: lv }); solid(b[0], b[1], y, head); }
    else if (pl > 0) solid(b[0], b[1], y, y + pl + 0.035);
  }
  if (dh < head - y - 0.1 && o.glass !== false) { const p = P(d0 + 0.045, 0), q = P(d1 - 0.045, 0); s.glass(p[0], y + dh + 0.07, p[1], q[0], head, q[1], { level: lv }); solid(d0, d1, y + dh, head); }
  // the door itself
  const kind = d.kind || 'slide';
  if (kind !== 'open') {
    const hp = P(d0 + 0.045, 0);
    door(s, { x: hp[0], y, z: hp[1], w: dw - 0.09, h: dh, along: alongX ? 'x' : 'z', dir: 1, kind, auto: d.auto !== false, style: d.style || 'glazed', tint: d.tint || pal.frame, label: d.label, locked: d.locked, lockedText: d.lockedText, level: lv });
  }
  // awning
  if (o.awning) {
    const aw = typeof o.awning === 'object' ? o.awning : {}; const dep = aw.depth || 1.1, cols = aw.stripes || pal.awning;
    const n = Math.max(2, Math.round((a1 - a0) / 0.5));
    for (let i = 0; i < n; i++) {
      const b0 = a0 + (a1 - a0) * i / n, b1 = a0 + (a1 - a0) * (i + 1) / n; g.mat('weave', cols[i % cols.length]);
      const p00 = P(b0, 0.1), p10 = P(b1, 0.1), p01 = P(b0, 0.1 + dep), p11 = P(b1, 0.1 + dep);
      const hi = head - 0.02, lo = head - 0.42;
      g.quad([p00[0], hi, p00[1]], [p10[0], hi, p10[1]], [p11[0], lo, p11[1]], [p01[0], lo, p01[1]], { double: true });
      g.mat('weave', cols[i % cols.length], { sway: 0.5 });
      const v0 = g.buf.nv;
      g.quad([p01[0], lo, p01[1]], [p11[0], lo, p11[1]], [p11[0], lo - 0.16, p11[1]], [p01[0], lo - 0.16, p01[1]], { double: true });
      for (const k of [0, 1, 4, 7]) g.param(v0 + k, 0);
    }
    s.flush({ tier: 's', cast: true, level: lv });
  }
  // a wash of light on the fascia and the pavement in front
  if (o.lights !== false) {
    const n = Math.max(1, Math.round((a1 - a0) / 3.2));
    for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * (i + 0.5) / n; const p = P(a, 0.5); lamp(s, 'bulb', p[0], head - 0.1, p[1], { power: 0.5, range: 4.5, K: 2800, level: lv }); }
  }
  const dc = P((d0 + d1) / 2, 0);
  return { doorCenter: dc, inward: alongX ? [0, -out] : [-out, 0], d0, d1 };
}

// A railing along a polyline of [x, z] at height y. o: { h (1.05), mat, tint, glass: bool (glass infill), posts (spacing 1.5), level }
export function railing(s, pts, y, o = {}) {
  const g = s.g, h = o.h || 1.05, tint = o.tint || '#3d4a45';
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); if (len < 0.05) continue;
    const n = Math.max(1, Math.round(len / (o.posts || 1.5)));
    g.mat('cast', tint);
    for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t; g.tube([[x, y, z], [x, y + h, z]], 0.018, { segs: 6 }); }
    g.mat(o.railMat || 'wood', o.rail || '#7a5233'); g.tube([[a[0], y + h, a[1]], [b[0], y + h, b[1]]], 0.028, { segs: 8 });
    if (!o.glass) { g.mat('cast', tint); for (const hh of [0.3, 0.62]) g.tube([[a[0], y + hh, a[1]], [b[0], y + hh, b[1]]], 0.01, { segs: 5, caps: false }); }
    s.flush({ tier: 's', cast: false, level: o.level });
    if (o.glass) { if (Math.abs(a[0] - b[0]) < 1e-3 || Math.abs(a[1] - b[1]) < 1e-3) s.glass(a[0], y + 0.08, a[1], b[0], y + h - 0.06, b[1], { opacity: 0.08, level: o.level }); }
    const x0 = Math.min(a[0], b[0]) - 0.04, x1 = Math.max(a[0], b[0]) + 0.04, z0 = Math.min(a[1], b[1]) - 0.04, z1 = Math.max(a[1], b[1]) + 0.04;
    s.solid(x0, y, z0, x1, y + h, z1);
  }
}

// A planter box with shrubs or herbs. o: { w, d, h (0.5), mat, tint, plants: 'broad' | 'fine' | 'fern' | 'flower' | 'herbs', density, seed, level }
export function planter(s, x, y, z, o = {}) {
  const g = s.g, w = o.w || 1.6, d = o.d || 0.5, h = o.h || 0.5, r = new Rng(hashStr('pl' + x + ',' + z + (o.seed || 0)));
  g.mat(o.mat || 'stone', o.tint || '#b3a892'); g.box(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2, { bevel: 0.015, aoBottom: 0.65 });
  g.mat('soil', '#ffffff'); g.box(x - w / 2 + 0.04, y + h - 0.02, z - d / 2 + 0.04, x + w / 2 - 0.04, y + h + 0.005, z + d / 2 - 0.04, { faces: 'Y' });
  s.flush({ tier: 's', cast: true, level: o.level });
  s.solid(x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2);
  const kind = o.plants || 'broad'; const layer = kind === 'fine' ? 'leafB' : kind === 'fern' ? 'fern' : kind === 'flower' ? 'blossom' : 'leafA';
  const n = Math.round(w * d * (o.density || 14)) + 3; const hh = o.ph || (kind === 'herbs' ? 0.28 : 0.6);
  for (let i = 0; i < n; i++) {
    const px = x + r.f(-w / 2 + 0.08, w / 2 - 0.08), pz = z + r.f(-d / 2 + 0.08, d / 2 - 0.08), a = r.f(0, Math.PI), sc = r.f(0.7, 1.2);
    g.mat(kind === 'herbs' ? (r.chance(0.5) ? 'leafB' : 'leafA') : layer, kind === 'herbs' ? mixHex('#ffffff', '#cfe8a0', r.next()) : (o.leaf || '#ffffff'), { sway: 0.5 });
    g.card(px, y + h - 0.02, pz, hh * sc * 0.9, hh * sc, a, { tilt: r.f(-0.2, 0.2) }); g.card(px, y + h - 0.02, pz, hh * sc * 0.9, hh * sc, a + Math.PI / 2, { tilt: r.f(-0.2, 0.2) });
  }
  s.flush({ tier: 'd', cast: true, level: o.level });
}

// A round column with a base and capital. o: { r (0.18), mat, tint, level }
export function column(s, x, y, z, h, o = {}) {
  const g = s.g, r = o.r || 0.18; g.mat(o.mat || 'stone', o.tint || '#c9bda6');
  g.lathe(x, z, [[r * 1.5, y], [r * 1.5, y + 0.08], [r * 1.15, y + 0.14], [r, y + 0.2], [r * 0.94, y + h - 0.22], [r * 1.1, y + h - 0.14], [r * 1.45, y + h - 0.06], [r * 1.45, y + h]], { segs: 16 });
  s.flush({ tier: 's', cast: true, level: o.level }); s.post(x, z, r * 1.2, y, y + h);
}

// An arched or square opening's surround in a wall running along x or z (purely decorative: the wall() call makes the hole).
// (x, y, z) = centre of the opening at floor level. o: { arch: true, depth, mat, tint, level }
export function archway(s, x, y, z, w, h, along, o = {}) {
  const g = s.g, d = o.depth || 0.3, f = 0.14; g.mat(o.mat || 'stone', o.tint || '#bfb4a2');
  const pts = []; const rise = o.arch === false ? 0 : Math.min(w / 2, 0.6);
  // the profile of the surround, in (along, y): outer rectangle minus inner arch, drawn as jambs and a segmented head
  const seg = 8;
  const inner = []; for (let i = 0; i <= seg; i++) { const t = i / seg; inner.push([-w / 2 + w * t, h - rise + rise * Math.sin(Math.PI * t)]); }
  const ex = (u0, y0, u1, y1) => { if (along === 'x') g.box(x + u0, y + y0, z - d / 2, x + u1, y + y1, z + d / 2, { bevel: 0.01 }); else g.box(x - d / 2, y + y0, z + u0, x + d / 2, y + y1, z + u1, { bevel: 0.01 }); };
  ex(-w / 2 - f, 0, -w / 2, h - rise); ex(w / 2, 0, w / 2 + f, h - rise);
  for (let i = 0; i < seg; i++) { const a = inner[i], b = inner[i + 1]; ex(Math.min(a[0], b[0]) - (i === 0 ? f : 0), Math.min(a[1], b[1]), Math.max(a[0], b[0]) + (i === seg - 1 ? f : 0), Math.max(a[1], b[1]) + f); }
  void pts;
  return s.flush({ tier: 's', level: o.level });
}
