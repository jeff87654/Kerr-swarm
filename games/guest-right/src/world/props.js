// Props: small things drawn once, cached, and stamped wherever they are wanted.
//
//   defineProp('chair', (g, p) => { ...draw at the origin, feet on y = 0, front toward +z...; return { solid, posts, spots, tier, cast }; });
//   prop(s, 'chair', x, y, z, yaw, { wood: '#7a5233' }, { tint: [1, 0.9, 0.8] });
//
// The function gets a Geo `g` and the parameters `p` (everything that changes the geometry or colours; each distinct set is cached
// separately, so keep them few). It may return:
//   solid: [[x0,y0,z0,x1,y1,z1], ...]   boxes that block the player (local coordinates)
//   posts: [[x, z, r, y0, y1], ...]      upright cylinders that block
//   spots: [{ type: 'sit' | 'stand' | ..., x, y, z, yaw, ... }]   places for people (see ARCHITECTURE.md)
//   glass: [[x0,y0,z0,x1,y1,z1, { tint, opacity }], ...]   panes (only placed at quarter-turn yaws)
//   tier: 'd' (default: fades out by ~40 m) | 's' (seen from afar)      cast: false to cast no overhead shadow
import { Geo, MeshBuf } from './meshbuilder.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';

const DEFS = new Map(), CACHE = new Map();
export function defineProp(name, fn) { DEFS.set(name, fn); }
export function hasProp(name) { return DEFS.has(name); }
export function propNames() { return Array.from(DEFS.keys()); }

function build(name, p) {
  const key = name + '|' + JSON.stringify(p || {});
  let c = CACHE.get(key);
  if (c) { if (CACHE.size > 600) { CACHE.delete(key); CACHE.set(key, c); } }      // keep what is in use at the young end
  else {
    const fn = DEFS.get(name); if (!fn) throw new Error('unknown prop: ' + name);
    const g = new Geo(new MeshBuf(512, 1024));
    const meta = fn(g, p || {}) || {};
    c = { buf: g.buf, meta }; CACHE.set(key, c);
    // the city makes props in sizes nobody will ask for again (a street bay 6.031 m long): let the oldest go
    if (CACHE.size > 900) { let n = 0; for (const k of CACHE.keys()) { CACHE.delete(k); if (++n >= 150) break; } }
  }
  return c;
}

// Place a prop. o: { tint: [r,g,b] multiply (cheap per-copy variety), tier, cast, level, noCollide, noSpots, scale }
export function prop(s, name, x, y, z, yaw = 0, p, o = {}) {
  const c = build(name, p), m = c.meta, g = s.g;
  g.at(x, y, z, yaw); if (o.scale) g.scale(o.scale);
  g.stamp(c.buf, o.tint); g.pop();
  s.flush({ tier: o.tier || m.tier || 'd', cast: o.cast !== undefined ? o.cast : m.cast !== false, level: o.level });
  const cs = Math.cos(yaw), sn = Math.sin(yaw), k = o.scale || 1;
  const tx = (lx, lz) => x + (cs * lx + sn * lz) * k, tz = (lx, lz) => z + (-sn * lx + cs * lz) * k;
  if (!o.noCollide) {
    if (m.solid) for (const b of m.solid) {
      const xs = [tx(b[0], b[2]), tx(b[3], b[2]), tx(b[0], b[5]), tx(b[3], b[5])], zs = [tz(b[0], b[2]), tz(b[3], b[2]), tz(b[0], b[5]), tz(b[3], b[5])];
      s.solid(Math.min(...xs), y + b[1] * k, Math.min(...zs), Math.max(...xs), y + b[4] * k, Math.max(...zs), { surf: m.surf || 'wood' });
    }
    if (m.posts) for (const q of m.posts) s.post(tx(q[0], q[1]), tz(q[0], q[1]), q[2] * k, y + q[3] * k, y + q[4] * k, { surf: m.surf || 'wood' });
  }
  if (m.spots && !o.noSpots) for (const sp of m.spots) {
    const extra = {}; for (const key in sp) if (key !== 'x' && key !== 'y' && key !== 'z' && key !== 'yaw' && key !== 'type') extra[key] = sp[key];
    s.spot(sp.type, tx(sp.x, sp.z), y + sp.y * k, tz(sp.x, sp.z), (sp.yaw || 0) + yaw, Object.assign(extra, o.spot || null));
  }
  if (m.glass) {
    const q = Math.round(yaw / (Math.PI / 2));
    if (Math.abs(yaw - q * Math.PI / 2) < 1e-3) for (const b of m.glass) s.glass(tx(b[0], b[2]), y + b[1] * k, tz(b[0], b[2]), tx(b[3], b[5]), y + b[4] * k, tz(b[3], b[5]), Object.assign({ level: o.level }, b[6]));
  }
  return m;
}

// ---------------------------------------------------------------------------------------------------------------
// Exemplar props. They set the standard: real proportions, rounded edges that catch the light, two or three materials,
// nothing thinner than it would be. Seat heights 0.45, table tops 0.74, counters 0.9.
// ---------------------------------------------------------------------------------------------------------------

// A bentwood chair. p: { wood, seat (colour of a woven seat), back: 'hoop' | 'slat' }
defineProp('chair', (g, p) => {
  const wood = p.wood || '#6b4a2f';
  g.mat('wood', wood, { rough: -0.05 });
  const leg = (x, z, lean) => g.tube([[x + lean[0], 0, z + lean[1]], [x, 0.44, z]], [0.016, 0.02], { segs: 6 });
  leg(-0.19, 0.19, [-0.02, 0.02]); leg(0.19, 0.19, [0.02, 0.02]);
  // back legs run on up into the back
  if (p.back === 'slat') {
    for (const sx of [-1, 1]) g.tube([[sx * 0.2, 0, -0.21], [sx * 0.19, 0.44, -0.19], [sx * 0.18, 0.92, -0.25]], [0.016, 0.02, 0.016], { segs: 6 });
    for (const yy of [0.62, 0.76, 0.9]) g.box(-0.19, yy - 0.025, -0.255, 0.19, yy + 0.025, -0.235, { bevel: 0.006 });
  } else {
    const hoop = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; hoop.push([-Math.cos(a) * 0.19, 0.44 + Math.sin(a) * 0.5, -0.19 - Math.sin(a) * 0.07]); }
    g.tube([[-0.2, 0, -0.21]].concat(hoop).concat([[0.2, 0, -0.21]]), 0.017, { segs: 6 });
    const inner = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; inner.push([-Math.cos(a) * 0.11, 0.46 + Math.sin(a) * 0.34, -0.2 - Math.sin(a) * 0.05]); }
    g.tube(inner, 0.011, { segs: 5 });
  }
  // stretcher ring
  const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ring.push([Math.cos(a) * 0.17, 0.2, Math.sin(a) * 0.17]); }
  g.tube(ring, 0.009, { segs: 5, closed: true });
  // seat: a wooden rim with a woven middle
  g.lathe(0, 0, [[0.0, 0.43], [0.21, 0.43], [0.225, 0.445], [0.21, 0.462], [0.17, 0.465]], { segs: 18, capTop: false });
  g.mat('cane', p.seat || '#d9c08a'); g.lathe(0, 0, [[0.17, 0.465], [0.0, 0.468]], { segs: 18, capBottom: false, capTop: false });
  return { posts: [[0, 0, 0.2, 0, 0.46]], spots: [{ type: 'sit', x: 0, y: 0.46, z: 0.02, yaw: 0 }] };
});

// A three-legged stool. p: { wood, h }
defineProp('stool', (g, p) => {
  const h = p.h || 0.46; g.mat('wood', p.wood || '#7a5a3a', { rough: -0.05 });
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5; g.tube([[Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17], [Math.cos(a) * 0.1, h - 0.02, Math.sin(a) * 0.1]], [0.016, 0.02], { segs: 6 }); }
  g.lathe(0, 0, [[0, h - 0.035], [0.15, h - 0.035], [0.165, h - 0.02], [0.165, h - 0.008], [0.15, h], [0, h]], { segs: 16 });
  return { posts: [[0, 0, 0.16, 0, h]], spots: [{ type: 'sit', x: 0, y: h, z: 0, yaw: 0, low: true }] };
});

// A table. p: { w, d, h, wood, top (colour), round: true (then w is the diameter), legs: 'four' | 'pedestal' | 'trestle' }
defineProp('table', (g, p) => {
  const w = p.w || 1.2, d = p.d || 0.75, h = p.h || 0.74, wood = p.wood || '#6f4e33', top = p.top || wood;
  g.mat('wood', top, { rough: -0.08 });
  if (p.round) {
    g.lathe(0, 0, [[0, h - 0.035], [w / 2 - 0.02, h - 0.035], [w / 2, h - 0.02], [w / 2, h - 0.008], [w / 2 - 0.012, h], [0, h]], { segs: 28 });
    g.mat('wood', wood); g.lathe(0, 0, [[0.24, 0], [0.22, 0.03], [0.06, 0.06], [0.045, 0.3], [0.05, h - 0.1], [0.12, h - 0.035]], { segs: 14 });
    return { posts: [[0, 0, Math.min(w / 2, 0.35), 0, h]], surf: 'wood' };
  }
  g.box(-w / 2, h - 0.04, -d / 2, w / 2, h, d / 2, { bevel: 0.012 });
  g.mat('wood', wood);
  if (p.legs === 'trestle') {
    for (const sx of [-1, 1]) { const x = sx * (w / 2 - 0.25); g.box(x - 0.03, 0.03, -d / 2 + 0.08, x + 0.03, h - 0.04, -d / 2 + 0.14, { bevel: 0.006 }); g.box(x - 0.03, 0.03, d / 2 - 0.14, x + 0.03, h - 0.04, d / 2 - 0.08, { bevel: 0.006 }); g.box(x - 0.035, 0, -d / 2 + 0.03, x + 0.035, 0.05, d / 2 - 0.03, { bevel: 0.008 }); }
    g.box(-w / 2 + 0.25, 0.3, -0.02, w / 2 - 0.25, 0.36, 0.02, { bevel: 0.006 });
  } else {
    g.box(-w / 2 + 0.05, h - 0.12, -d / 2 + 0.05, w / 2 - 0.05, h - 0.04, d / 2 - 0.05, { faces: 'xXzZ' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06)], [sx * (w / 2 - 0.07), h - 0.04, sz * (d / 2 - 0.07)]], [0.02, 0.028], { segs: 6 });
  }
  return { solid: [[-w / 2, 0.3, -d / 2, w / 2, h, d / 2]], surf: 'wood' };
});

// A slatted bench. p: { w, wood, back: bool }
defineProp('bench', (g, p) => {
  const w = p.w || 1.6; g.mat('wood', p.wood || '#7a5233', { rough: -0.03 });
  for (let i = 0; i < 4; i++) { const z = -0.17 + i * 0.113; g.box(-w / 2, 0.43, z, w / 2, 0.46, z + 0.095, { bevel: 0.008 }); }
  if (p.back) { for (let i = 0; i < 3; i++) g.box(-w / 2, 0.6 + i * 0.12, -0.235, w / 2, 0.69 + i * 0.12, -0.21, { bevel: 0.008 }); }
  g.mat('cast', p.metal || '#3d4a45');
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.16);
    g.tube([[x, 0, 0.2], [x, 0.41, 0.2], [x, 0.41, -0.2], [x, 0, -0.2]], 0.016, { segs: 6 });
    if (p.back) g.tube([[x, 0.41, -0.2], [x, 0.95, -0.25]], 0.016, { segs: 6 });
  }
  const spots = []; const n = Math.max(1, Math.floor(w / 0.6));
  for (let i = 0; i < n; i++) spots.push({ type: 'sit', x: -w / 2 + (i + 0.5) * w / n, y: 0.46, z: 0.0, yaw: 0 });
  return { solid: [[-w / 2, 0, -0.2, w / 2, 0.46, 0.2]], spots, tier: 's' };
});

// A lidded bowl: everything in this world is served under a lid. p: { glaze, lid (colour), r }
defineProp('bowl', (g, p) => {
  const r = p.r || 0.085, c = p.glaze || '#e9e1cf';
  g.mat('glaze', c); g.lathe(0, 0, [[0, 0], [r * 0.5, 0], [r * 0.55, 0.008], [r * 0.95, r * 0.5], [r, r * 0.72], [r * 0.96, r * 0.74], [r * 0.9, r * 0.52], [r * 0.45, 0.02], [0, 0.018]], { segs: 18, capTop: false });
  if (p.open) { g.mat('plain', p.food || '#c98f4e', { rough: -0.2 }); g.lathe(0, 0, [[r * 0.86, r * 0.5], [0, r * 0.55]], { segs: 14, capBottom: false, capTop: false }); }
  else {
    g.mat('glaze', p.lid || c); g.lathe(0, 0, [[r * 1.0, r * 0.72], [r * 0.98, r * 0.78], [r * 0.6, r * 1.05], [r * 0.16, r * 1.15], [r * 0.12, r * 1.2], [r * 0.2, r * 1.32], [r * 0.14, r * 1.4], [0, r * 1.41]], { segs: 18, capBottom: false, capTop: false });
  }
  return { cast: false };
});
// A lidded cup. p: { glaze, lid }
defineProp('cup', (g, p) => {
  const c = p.glaze || '#d9cfb8';
  g.mat('glaze', c); g.lathe(0, 0, [[0, 0], [0.026, 0], [0.036, 0.012], [0.04, 0.08], [0.037, 0.082], [0.032, 0.014], [0, 0.012]], { segs: 14, capTop: false });
  if (!p.open) { g.mat('glaze', p.lid || shadeHex(c, 0.8)); g.lathe(0, 0, [[0.043, 0.08], [0.04, 0.088], [0.012, 0.098], [0.012, 0.108], [0, 0.11]], { segs: 14, capBottom: false, capTop: false }); }
  else { g.mat('plain', p.drink || '#5a3a22', { rough: -0.4 }); g.lathe(0, 0, [[0.035, 0.068], [0, 0.068]], { segs: 12, capBottom: false, capTop: false }); }
  return { cast: false };
});
defineProp('plate', (g, p) => {
  const r = p.r || 0.12; g.mat('glaze', p.glaze || '#ece5d6');
  g.lathe(0, 0, [[0, 0], [r * 0.6, 0], [r, 0.014], [r * 0.99, 0.018], [r * 0.62, 0.008], [0, 0.007]], { segs: 20, capTop: false });
  return { cast: false };
});
// A crock or storage jar with a lid. p: { glaze, h, r }
defineProp('crock', (g, p) => {
  const h = p.h || 0.3, r = p.r || 0.11; g.mat('glaze', p.glaze || '#8a5a3c');
  g.lathe(0, 0, [[0, 0], [r * 0.8, 0], [r, h * 0.15], [r * 1.02, h * 0.6], [r * 0.82, h * 0.86], [r * 0.7, h * 0.9], [r * 0.74, h * 0.94]], { segs: 16, capTop: false });
  g.mat('glaze', p.lid || shadeHex(p.glaze || '#8a5a3c', 1.25)); g.lathe(0, 0, [[r * 0.8, h * 0.93], [r * 0.78, h * 0.97], [r * 0.2, h * 1.02], [r * 0.2, h * 1.08], [0, h * 1.09]], { segs: 16, capBottom: false, capTop: false });
  return { posts: h > 0.4 ? [[0, 0, r, 0, h]] : null };
});

// A plant in a pot. p: { pot (colour), kind: 'broad' | 'fine' | 'fern' | 'flower', size (overall height, default 0.9), leaf (tint), potMat }
defineProp('plant', (g, p) => {
  const size = p.size || 0.9, kind = p.kind || 'broad'; const pr = Math.min(0.3, size * 0.2), ph = Math.min(0.42, size * 0.32);
  g.mat(p.potMat || 'glaze', p.pot || '#a3563a');
  g.lathe(0, 0, [[0, 0], [pr * 0.72, 0], [pr * 0.78, ph * 0.08], [pr, ph * 0.86], [pr * 1.08, ph * 0.9], [pr * 1.08, ph], [pr * 0.94, ph], [pr * 0.9, ph * 0.9]], { segs: 16, capTop: false });
  g.mat('soil', '#ffffff'); g.lathe(0, 0, [[pr * 0.92, ph * 0.9], [0, ph * 0.92]], { segs: 12, capBottom: false, capTop: false });
  const r = new Rng(hashStr(kind + size + (p.seed || 0)));
  const layer = kind === 'fine' ? 'leafB' : kind === 'fern' ? 'fern' : kind === 'flower' ? 'blossom' : 'leafA';
  const n = kind === 'fern' ? 11 : kind === 'flower' ? 7 : 9; const lh = size - ph * 0.85;
  if (kind !== 'fern') { g.mat('bark', '#6b5a48'); for (let i = 0; i < 3; i++) { const a = r.f(0, 6.28), lean = r.f(0.02, 0.1); g.tube([[0, ph * 0.9, 0], [Math.cos(a) * lean, ph + lh * 0.45, Math.sin(a) * lean], [Math.cos(a) * lean * 2.2, ph + lh * 0.8, Math.sin(a) * lean * 2.2]], [0.012, 0.009, 0.005], { segs: 5 }); } }
  g.mat(layer, p.leaf || '#ffffff', { sway: 0.5 });
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + r.f(-0.3, 0.3), out = kind === 'fern' ? 0.02 : r.f(0.0, pr * 0.5), up = kind === 'fern' ? ph * 0.88 : ph + lh * r.f(0.05, 0.45);
    const hgt = kind === 'fern' ? lh * r.f(0.75, 1.05) : lh * r.f(0.55, 0.8), wid = hgt * (kind === 'fern' ? 0.42 : kind === 'fine' ? 0.8 : 0.85);
    g.card(Math.cos(a) * out, up, Math.sin(a) * out, wid, hgt, a + Math.PI / 2, { tilt: kind === 'fern' ? r.f(0.35, 0.75) : r.f(0.1, 0.5) });
  }
  return { posts: [[0, 0, pr, 0, ph]], surf: 'stone' };
});

// A slatted crate. p: { w, h, d, wood, label }
defineProp('crate', (g, p) => {
  const w = p.w || 0.6, h = p.h || 0.4, d = p.d || 0.4; g.mat('wood', p.wood || '#b08d5e', { rough: 0.12 });
  const n = Math.max(2, Math.round(h / 0.12));
  for (let i = 0; i < n; i++) { const y0 = i * h / n + 0.008, y1 = (i + 1) * h / n - 0.008; g.box(-w / 2, y0, -d / 2, w / 2, y1, -d / 2 + 0.014); g.box(-w / 2, y0, d / 2 - 0.014, w / 2, y1, d / 2); g.box(-w / 2, y0, -d / 2, -w / 2 + 0.014, y1, d / 2); g.box(w / 2 - 0.014, y0, -d / 2, w / 2, y1, d / 2); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.025) - 0.02, 0, sz * (d / 2 - 0.025) - 0.02, sx * (w / 2 - 0.025) + 0.02, h, sz * (d / 2 - 0.025) + 0.02);
  g.box(-w / 2 + 0.014, 0.01, -d / 2 + 0.014, w / 2 - 0.014, 0.024, d / 2 - 0.014, { faces: 'Y' });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A shop counter with a panelled front and a worn top. p: { w, d, h, body, top, topMat }
defineProp('counter', (g, p) => {
  const w = p.w || 2, d = p.d || 0.6, h = p.h || 0.92, body = p.body || '#2f4f4a';
  g.mat('paint', body); g.box(-w / 2, 0.08, -d / 2 + 0.03, w / 2, h - 0.04, d / 2 - 0.02, { aoBottom: 0.6 });
  g.mat('paint', shadeHex(body, 0.6)); g.box(-w / 2 + 0.03, 0, -d / 2 + 0.06, w / 2 - 0.03, 0.08, d / 2 - 0.05);
  const n = Math.max(1, Math.round(w / 0.6));
  g.mat('paint', shadeHex(body, 1.18));
  for (let i = 0; i < n; i++) { const x0 = -w / 2 + 0.06 + i * (w - 0.12) / n + 0.03, x1 = -w / 2 + 0.06 + (i + 1) * (w - 0.12) / n - 0.03; g.box(x0, 0.16, d / 2 - 0.02, x1, h - 0.12, d / 2 - 0.006, { bevel: 0.01 }); }
  g.mat(p.topMat || 'wood', p.top || '#8a6240', { rough: -0.1 }); g.box(-w / 2 - 0.03, h - 0.04, -d / 2, w / 2 + 0.03, h, d / 2 + 0.03, { bevel: 0.012 });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's', spots: [{ type: 'counter', x: 0, y: 0, z: -d / 2 - 0.45, yaw: 0 }, { type: 'customer', x: 0, y: 0, z: d / 2 + 0.6, yaw: Math.PI }] };
});

// Open shelving with goods on it left to the caller. p: { w, h, d, shelves, wood, back: bool }
defineProp('shelving', (g, p) => {
  const w = p.w || 1.2, h = p.h || 2, d = p.d || 0.32, n = p.shelves || 4; g.mat('wood', p.wood || '#6f5137');
  g.box(-w / 2, 0, -d / 2, -w / 2 + 0.03, h, d / 2, { bevel: 0.006 }); g.box(w / 2 - 0.03, 0, -d / 2, w / 2, h, d / 2, { bevel: 0.006 });
  for (let i = 0; i <= n; i++) { const y = 0.08 + i * (h - 0.11) / n; g.box(-w / 2 + 0.03, y, -d / 2 + 0.01, w / 2 - 0.03, y + 0.025, d / 2, { faces: 'yYZz' }); }
  if (p.back !== false) { g.mat('wood', shadeHex(p.wood || '#6f5137', 0.75)); g.box(-w / 2 + 0.03, 0.08, -d / 2, w / 2 - 0.03, h, -d / 2 + 0.012, { faces: 'Z' }); }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A woven rug. p: { w, d, a, b (two colours), mat }
defineProp('rug', (g, p) => {
  const w = p.w || 2, d = p.d || 1.4;
  g.mat(p.mat || 'motif', p.a || '#8a2f3c'); g.box(-w / 2, 0.004, -d / 2, w / 2, 0.014, d / 2, { faces: 'YxXzZ' });
  g.mat('weave', p.b || '#d9b25c'); for (const sz of [-1, 1]) g.box(-w / 2, 0.004, sz * d / 2 - (sz > 0 ? 0.08 : 0), w / 2, 0.016, sz * d / 2 + (sz > 0 ? 0 : 0.08), { faces: 'Y' });
  return { cast: false };
});

// Bunting or a string of small lanterns between two points is a function, not a prop: it follows a sagging line.
// bunting(s, [x0,y0,z0], [x1,y1,z1], { colors: [...], sag, n, level })
export function bunting(s, a, b, o = {}) {
  const g = s.g, len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = o.n || Math.max(4, Math.round(len / 0.32)), sag = o.sag === undefined ? len * 0.06 : o.sag;
  const cols = o.colors || ['#c9552e', '#e7b547', '#2f6f73', '#e9e2d0', '#8a2f3c', '#6b8f4e'];
  const P = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const line = []; for (let i = 0; i <= 12; i++) line.push(P(i / 12));
  g.mat('weave', '#d8cdb8'); g.tube(line, 0.004, { segs: 4, caps: false });
  const dx = (b[0] - a[0]) / len, dz = (b[2] - a[2]) / len;
  for (let i = 0; i < n; i++) {
    const t0 = (i + 0.12) / n, t1 = (i + 0.88) / n, p0 = P(t0), p1 = P(t1), pm = P((t0 + t1) / 2); const hh = (o.drop || 0.2);
    g.mat('weave', cols[i % cols.length], { sway: 0.8 });
    const v0 = g.buf.nv;
    g.quad(p0, p1, [pm[0], pm[1] - hh, pm[2]], [pm[0] - dx * 0.001, pm[1] - hh, pm[2] - dz * 0.001], { double: true });
    // pinned along the line, free at the point: quad() then its back face, four vertices each
    for (const k of [0, 1, 4, 7]) g.param(v0 + k, 0);
  }
  return s.flush({ tier: 'd', level: o.level });
}
