// Shared parts for the four food shops on Ladle Row (bakery, greengrocer, larder, herbs): food and shop props (food.*),
// and helpers for a shop unit's shell, glass cases, glass domes and small engraved price plates.
// Props are drawn with their front toward +z and their feet on y = 0 (hanging things hang from y = 0 downward).
import { floor, ceiling, wall, roomGlow } from '../world/kit.js';
import { shopfront } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door, doorFrame } from '../world/doors.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';

export const foodParts = true;

const CRUMB = '#ecd9ad';
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------------------------
// Food, drawn straight into a Geo. Exported so a place can draw a few loose ones by hand inside s.detail(...).
// ---------------------------------------------------------------------------------------------------------------

// A loaf. kind: 'boule' | 'batard' | 'tin' | 'plait' | 'roll'. crust: colour. seg: lathe segments (lower for far things)
export function drawLoaf(g, x, y, z, kind, crust, yaw, seg) {
  const S = seg || 14; crust = crust || '#b8763a';
  g.push(); g.move(x, y, z); if (yaw) g.rotY(yaw);
  if (kind === 'batard') {
    const rx = 0.15, ry = 0.065, rz = 0.075, b = -0.3, cy = -b * ry;
    g.mat('plaster', crust, { rough: 0.1 }); g.ball(0, cy, 0, rx, ry, rz, { segs: S, rings: 7, bottom: b });
    g.mat('plain', CRUMB, { rough: 0.25 });
    const hy = (px, pz) => cy + ry * Math.sqrt(Math.max(0, 1 - (px / rx) * (px / rx) - (pz / rz) * (pz / rz))) + 0.001;
    for (let k = -1; k <= 1; k++) { const xc = k * 0.072; const a = [xc - 0.032, -0.022], m = [xc, 0], c = [xc + 0.032, 0.022]; g.tube([[a[0], hy(a[0], a[1]), a[1]], [m[0], hy(m[0], m[1]) + 0.001, m[1]], [c[0], hy(c[0], c[1]), c[1]]], [0.003, 0.007, 0.003], { segs: 4 }); }
  } else if (kind === 'tin') {
    g.mat('plaster', shadeHex(crust, 1.12), { rough: 0.1 }); g.box(-0.105, 0, -0.06, 0.105, 0.075, 0.06, { bevel: 0.012 });
    g.mat('plaster', crust, { rough: 0.05 }); g.ball(0, 0.07, 0, 0.112, 0.05, 0.066, { segs: S, rings: 5, bottom: 0 });
  } else if (kind === 'plait') {
    g.mat('plain', crust, { rough: -0.3 });
    for (let i = 0; i < 5; i++) { const t = (i - 2) / 2; const sx = 1 - Math.abs(t) * 0.25; g.ball(t * 0.1, 0.035 * sx, (i % 2 ? 1 : -1) * 0.014, 0.05 * sx, 0.04 * sx, 0.045 * sx, { segs: 9, rings: 5, bottom: -0.2 }); }
    g.mat('plain', '#f3ecd8', { rough: 0.3 }); for (let i = 0; i < 6; i++) g.ball(-0.08 + i * 0.032, 0.066, (i % 2) * 0.01 - 0.005, 0.004, 0.002, 0.003, { segs: 4, rings: 2 });
  } else if (kind === 'roll') {
    g.mat('plaster', crust, { rough: 0.1 }); g.ball(0, 0.012, 0, 0.042, 0.036, 0.042, { segs: 10, rings: 5, bottom: -0.3 });
    g.mat('plain', CRUMB, { rough: 0.25 }); g.tube([[-0.026, 0.035, 0], [0, 0.049, 0], [0.026, 0.035, 0]], [0.002, 0.005, 0.002], { segs: 4 });
  } else {   // boule
    const r = 0.1, ry = 0.075, b = -0.3, cy = -b * ry;
    g.mat('plaster', crust, { rough: 0.1 }); g.ball(0, cy, 0, r, ry, r, { segs: S, rings: 7, bottom: b });
    g.mat('plain', CRUMB, { rough: 0.25 });
    for (const a of [0.4, 0.4 + Math.PI / 2]) { const pts = []; for (let i = 0; i <= 6; i++) { const t = -0.72 + 1.44 * i / 6; pts.push([Math.sin(t) * r * Math.cos(a) * 1.01, cy + Math.cos(t) * ry * 1.012, Math.sin(t) * r * Math.sin(a) * 1.01]); } g.tube(pts, [0.002, 0.005, 0.007, 0.007, 0.007, 0.005, 0.002], { segs: 4, caps: false }); }
  }
  g.pop();
}
// A round bun with a glossy top. top: an optional colour for a sugar or seed crust
export function drawBun(g, x, y, z, r, col, top) {
  g.mat('plain', col || '#b86a2c', { rough: -0.25 }); g.ball(x, y + r * 0.24, z, r, r * 0.68, r, { segs: 10, rings: 5, bottom: -0.35 });
  if (top) { g.mat('plain', top, { rough: 0.3 }); g.ball(x, y + r * 0.42, z, r * 0.72, r * 0.52, r * 0.72, { segs: 8, rings: 3, bottom: 0.25 }); }
}
export function drawCroissant(g, x, y, z, yaw, col) {
  g.push(); g.move(x, y, z); if (yaw) g.rotY(yaw);
  g.mat('plain', col || '#c47a32', { rough: -0.2 });
  const R = [0.007, 0.016, 0.024, 0.028, 0.024, 0.016, 0.007]; const pts = [];
  for (let i = 0; i < 7; i++) { const a = -1.2 + 2.4 * i / 6; pts.push([Math.sin(a) * 0.055, R[i] * 0.8, -Math.cos(a) * 0.04 + 0.02]); }
  g.tube(pts, R, { segs: 7 });
  g.pop();
}
export function drawPuff(g, x, y, z, r) { g.mat('plain', '#e2b765', { rough: -0.1 }); g.ball(x, y + (r || 0.022) * 0.7, z, r || 0.022, (r || 0.022) * 0.85, r || 0.022, { segs: 8, rings: 5 }); }
export function drawTomato(g, x, y, z, r, col) {
  r = r || 0.035;
  g.mat('plain', col || '#c8281c', { rough: -0.4 }); g.ball(x, y + r * 0.78, z, r, r * 0.8, r, { segs: 14, rings: 9 });
  g.mat('plain', '#4d7a2a', { rough: 0.1 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; g.tube([[x, y + r * 1.57, z], [x + Math.cos(a) * r * 0.48, y + r * 1.5, z + Math.sin(a) * r * 0.48]], [0.0045, 0.0015], { segs: 3, caps: false }); }
  g.cyl(x, y + r * 1.54, z, 0.0032, 0.014, { segs: 5 });
}
// An apple about r across the shoulder (0.04 is an orchard apple). col: skin
export function drawApple(g, x, y, z, r, col) {
  r = r || 0.04; const H = r * 1.82;
  g.mat('plain', col || '#b8322a', { rough: -0.28 });
  const P = [[0, 0.07], [0.22, 0.03], [0.55, 0], [0.84, 0.1], [0.98, 0.34], [1, 0.52], [0.9, 0.74], [0.66, 0.9], [0.3, 0.93], [0.08, 0.84], [0, 0.82]];
  g.lathe(x, z, P.map((p) => [p[0] * r, y + p[1] * H]), { segs: 16 });
  g.mat('bark', '#5a4030'); g.tube([[x, y + H * 0.8, z], [x + 0.002, y + H * 0.95, z], [x + 0.006, y + H * 1.06, z]], [0.0026, 0.002, 0.0016], { segs: 4 });
  g.push(); g.move(x + 0.012, y + H * 1.0, z); g.rotY(0.6); g.rotZ(-0.5);
  g.mat('plain', '#5f8a32', { rough: 0.1 }); g.ball(0.013, 0, 0, 0.014, 0.0018, 0.0075, { segs: 8, rings: 3 });
  g.pop();
}
export function drawCucumber(g, x, y, z, yaw, len) {
  const L = (len || 0.24) / 2;
  g.push(); g.move(x, y, z); if (yaw) g.rotY(yaw);
  g.mat('plain', '#2f5a24', { rough: 0.05 }); g.ball(0, 0.022, 0, L, 0.021, 0.023, { segs: 10, rings: 7 });
  g.mat('plain', '#8aa848', { rough: 0.2 }); g.ball(L - 0.004, 0.024, 0, 0.006, 0.005, 0.005, { segs: 5, rings: 3 });
  g.pop();
}
export function drawStrawberry(g, x, y, z, tilt, yaw) {
  g.push(); g.move(x, y, z); g.rotY(yaw || 0); g.rotZ(tilt || 0);
  g.mat('plain', '#c41e2a', { rough: -0.35 }); g.lathe(0, 0, [[0, 0], [0.006, 0.004], [0.012, 0.013], [0.0125, 0.02], [0.008, 0.026], [0, 0.027]], { segs: 8 });
  g.mat('plain', '#4f7d2c'); g.ball(0, 0.027, 0, 0.011, 0.003, 0.011, { segs: 6, rings: 3 });
  g.pop();
}
// A butterhead lettuce: leaves round a pale heart. r: overall radius
export function drawLettuce(g, x, y, z, r, col, seed) {
  r = r || 0.1; const rng = new Rng(hashStr('let' + (seed || 0)));
  const outer = col || '#5e9a3a', inner = mixHex(outer, '#e2f0a0', 0.6);
  g.mat('plain', inner, { rough: 0.05 }); g.ball(x, y + r * 0.55, z, r * 0.5, r * 0.5, r * 0.5, { segs: 10, rings: 6 });
  for (let ring = 0; ring < 2; ring++) {
    const n = ring ? 6 : 8, rr = ring ? r * 0.3 : r * 0.55;
    g.mat('plain', ring ? mixHex(outer, inner, 0.5) : outer, { rough: 0.0 });
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + rng.f(-0.2, 0.2) + ring * 0.4;
      g.push(); g.move(x + Math.cos(a) * rr, y + r * (ring ? 0.6 : 0.48), z + Math.sin(a) * rr); g.rotY(-a); g.rotZ(-(ring ? 0.35 : 0.75) - rng.f(0, 0.15));
      g.ball(0, 0, 0, r * 0.07, r * (ring ? 0.42 : 0.5), r * (ring ? 0.38 : 0.48), { segs: 8, rings: 5 });
      g.pop();
    }
  }
}
// A small terracotta pot of herbs. kind: 'fine' | 'broad' | 'fern' | 'flower' | 'shiso'. r: pot radius
export function drawHerbPot(g, x, y, z, o) {
  o = o || {}; const r = o.r || 0.065, ph = r * 1.15, size = o.size || r * 3.2;
  g.mat(o.potMat || 'glaze', o.pot || '#b8613d', { rough: 0.25 });
  g.lathe(x, z, [[0, y], [r * 0.68, y], [r * 0.74, y + ph * 0.06], [r * 0.92, y + ph * 0.78], [r * 1.06, y + ph * 0.8], [r * 1.06, y + ph], [r * 0.93, y + ph], [r * 0.9, y + ph * 0.9]], { segs: 12, capTop: false });
  g.mat('soil', '#ffffff'); g.cyl(x, y + ph * 0.86, z, r * 0.9, 0.004, { segs: 10 });
  const rng = new Rng(hashStr('hp' + (o.kind || 'fine') + (o.seed || 0)));
  const kind = o.kind || 'fine';
  const layer = kind === 'broad' || kind === 'shiso' ? 'leafA' : kind === 'fern' ? 'fern' : kind === 'flower' ? 'blossom' : 'leafB';
  const leaf = o.leaf || (kind === 'shiso' ? '#c48aa8' : '#ffffff');
  const n = o.n || (kind === 'fern' ? 7 : 6);
  g.mat(layer, leaf, { sway: 0.35 });
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI + rng.f(-0.3, 0.3), hh = size * rng.f(0.75, 1.05), ww = hh * (kind === 'fern' ? 0.5 : 0.85);
    g.card(x + rng.f(-r * 0.3, r * 0.3), y + ph * 0.85, z + rng.f(-r * 0.3, r * 0.3), ww, hh, a, { tilt: rng.f(-0.25, 0.25) });
  }
  if (kind === 'flower' || o.flowers) { g.mat('blossom', o.flowerTint || '#8fb0ff', { sway: 0.35 }); for (let i = 0; i < 3; i++) g.card(x + rng.f(-r * 0.4, r * 0.4), y + ph + size * 0.35, z + rng.f(-r * 0.4, r * 0.4), size * 0.45, size * 0.45, rng.f(0, 3), { tilt: 0.2 }); }
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------

// A single loaf. p: { kind, crust }
defineProp('food.loaf', (g, p) => { drawLoaf(g, 0, 0, 0, p.kind || 'boule', p.crust); return { cast: false }; });
defineProp('food.bun', (g, p) => { drawBun(g, 0, 0, 0, p.r || 0.042, p.col, p.top); return { cast: false }; });
defineProp('food.tomato', (g, p) => { drawTomato(g, 0, 0, 0, p.r, p.col); return { cast: false }; });
defineProp('food.apple', (g, p) => {
  drawApple(g, 0, p.tissue ? 0.006 : 0, 0, p.r, p.col);
  if (p.tissue) {     // a crumpled paper cup round its lower half
    g.mat('paper', p.tissue === true ? '#f4efe4' : p.tissue, { rough: 0.2 });
    const r = p.r || 0.04; const pts = []; for (let i = 0; i <= 3; i++) pts.push([r * (0.4 + i * 0.27), i * r * 0.36]);
    g.lathe(0, 0, [[0, 0]].concat(pts).concat([[r * 1.12, r * 1.2]]), { segs: 7, capTop: false });
    g.lathe(0, 0, [[r * 1.1, r * 1.2], [r * 0.92, r * 0.5], [r * 0.4, 0.004]], { segs: 7, capTop: false, capBottom: false });
  }
  return { cast: false };
});
defineProp('food.cucumber', (g, p) => { drawCucumber(g, 0, 0, 0, 0, p.len); return { cast: false }; });
defineProp('food.lettuce', (g, p) => { drawLettuce(g, 0, 0, 0, p.r, p.col, p.seed); return { cast: false }; });
defineProp('food.croissant', (g, p) => { drawCroissant(g, 0, 0, 0, 0, p.col); return { cast: false }; });
defineProp('food.herbpot', (g, p) => { drawHerbPot(g, 0, 0, 0, p); return { cast: false }; });

// A small velvet cushion for one precious thing. p: { col, w, d }
defineProp('food.cushion', (g, p) => {
  const w = p.w || 0.12, d = p.d || 0.12;
  g.mat('felt', p.col || '#7c2430'); g.box(-w / 2, 0, -d / 2, w / 2, 0.012, d / 2, { bevel: 0.005 });
  g.ball(0, 0.012, 0, w * 0.46, 0.012, d * 0.46, { segs: 12, rings: 4, bottom: 0 });
  g.mat('weave', p.trim || '#c9a45c'); g.box(-w / 2 - 0.002, 0.004, -d / 2 - 0.002, w / 2 + 0.002, 0.008, d / 2 + 0.002, { faces: 'xXzZ' });
  return { cast: false };
});

// A punnet of strawberries. p: { w, d, n, box (colour) }
defineProp('food.punnet', (g, p) => {
  const w = p.w || 0.13, d = p.d || 0.1, h = 0.045, rng = new Rng(hashStr('pun' + (p.seed || 0)));
  g.mat('cane', p.box || '#d9b98a'); g.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, { faces: 'xXzZy', bevel: 0.003 });
  g.mat('cane', shadeHex(p.box || '#d9b98a', 0.8)); g.box(-w / 2 + 0.004, 0.01, -d / 2 + 0.004, w / 2 - 0.004, 0.012, d / 2 - 0.004, { faces: 'Y' });
  const n = p.n || 12;
  for (let i = 0; i < n; i++) drawStrawberry(g, rng.f(-w / 2 + 0.016, w / 2 - 0.016), 0.012 + (i > n * 0.6 ? 0.012 : 0), rng.f(-d / 2 + 0.016, d / 2 - 0.016), rng.f(1.0, 1.9), rng.f(0, TAU));
  return { cast: false };
});

// A wheel or a cut piece of aged cheese. p: { kind: 'wheel' | 'half' | 'wedge' | 'tall', r, h, rind, paste, wax: '#hex' (a waxed rind) }
defineProp('food.cheese', (g, p) => {
  const kind = p.kind || 'wheel', r = p.r || (kind === 'tall' ? 0.09 : 0.17), h = p.h || (kind === 'tall' ? 0.16 : 0.1);
  const rind = p.wax || p.rind || '#c99a4a', paste = p.paste || '#f0d48a';
  const rm = p.wax ? ['plain', { rough: -0.25 }] : ['plaster', { rough: 0.2 }];
  if (kind === 'wheel' || kind === 'tall') {
    g.mat(rm[0], rind, rm[1]); g.lathe(0, 0, [[0, 0], [r * 0.95, 0], [r * 0.995, h * 0.1], [r * 1.01, h * 0.5], [r * 0.995, h * 0.9], [r * 0.95, h], [0, h]], { segs: 22 });
    if (!p.wax) { g.mat('plaster', shadeHex(rind, 0.82)); g.cyl(0, h, 0, r * 0.5, 0.0015, { segs: 14 }); }
    return { posts: r > 0.12 ? [[0, 0, r, 0, h]] : null };
  }
  const a0 = kind === 'half' ? 0 : -0.38, a1 = kind === 'half' ? Math.PI : 0.38, n = kind === 'half' ? 14 : 5;
  const poly = [[0, 0]]; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; poly.push([Math.cos(a) * r, Math.sin(a) * r]); }
  // turn so the point (or the cut face of a half) faces the viewer (+z)
  g.push(); g.rotY(kind === 'half' ? 0 : Math.PI / 2);
  g.mat(rm[0], rind, rm[1]); g.prism(poly, 0, h);
  g.mat('plaster', paste, { rough: 0.15 });
  const face = (a) => { const cx = Math.cos(a) * r, cz = Math.sin(a) * r; const nx = -Math.sin(a) * 0.0012, nz = Math.cos(a) * 0.0012; const s = a === a0 ? -1 : 1;
    g.quad([nx * s, 0.004, nz * s], [cx + nx * s, 0.004, cz + nz * s], [cx + nx * s, h - 0.004, cz + nz * s], [nx * s, h - 0.004, nz * s], { double: true }); };
  face(a0); face(a1);
  g.pop();
  return { cast: false };
});

// A cured mycelium ham hanging from a hook at y = 0. p: { col, len (string length), size }
defineProp('food.ham', (g, p) => {
  const L = p.len || 0.25, k = p.size || 1, top = -L;
  g.mat('weave', '#d8cdb0'); g.tube([[0, 0, 0], [0, top - 0.02, 0]], 0.003, { segs: 4 });
  g.mat('leather', p.col || '#8a3e26', { rough: -0.05 });
  const P = [[0.012, 0], [0.03, -0.03], [0.055, -0.1], [0.08, -0.2], [0.088, -0.28], [0.075, -0.35], [0.045, -0.4], [0, -0.415]];
  g.lathe(0, 0, P.map((q) => [q[0] * k, top + q[1] * k]), { segs: 14 });
  g.mat('weave', '#e6dcc0');
  for (const yy of [-0.08, -0.16, -0.24, -0.32]) { const rr = yy > -0.1 ? 0.06 : yy > -0.2 ? 0.083 : yy > -0.3 ? 0.087 : 0.072; const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ring.push([Math.cos(a) * rr * k * 1.02, top + yy * k, Math.sin(a) * rr * k * 1.02]); } g.tube(ring, 0.0022, { segs: 3, closed: true }); }
  g.mat('paper', '#efe4c8'); g.box(0.045 * k, top - 0.07 * k, -0.002, 0.085 * k, top - 0.04 * k, 0.002);
  return { cast: false };
});

// A bundle of herbs hung upside down to dry, from a hook at y = 0. p: { leaf (tint), len, seed, layer }
defineProp('food.bundle', (g, p) => {
  const L = p.len || 0.08, rng = new Rng(hashStr('bun' + (p.seed || 0)));
  g.mat('weave', '#d8cdb0'); g.tube([[0, 0, 0], [0, -L, 0]], 0.0025, { segs: 3 });
  g.mat('bark', '#7a6a4a'); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.tube([[Math.cos(a) * 0.006, -L + 0.01, Math.sin(a) * 0.006], [Math.cos(a) * 0.012, -L - 0.06, Math.sin(a) * 0.012]], 0.0025, { segs: 3, caps: false }); }
  g.mat('weave', p.thread || '#3f7a3a'); g.cyl(0, -L - 0.03, 0, 0.012, 0.012, { segs: 8 });
  g.mat(p.layer || 'leafB', p.leaf || '#c9d89a', { sway: 0.2 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI + rng.f(-0.2, 0.2), hh = rng.f(0.2, 0.27); g.push(); g.move(0, -L - 0.05, 0); g.rotX(Math.PI); g.card(rng.f(-0.01, 0.01), 0, rng.f(-0.01, 0.01), hh * 0.7, hh, a, { tilt: rng.f(-0.25, 0.25) }); g.pop(); }
  return { cast: false };
});

// A hessian sack, tied. p: { tint, h, r, band (colour of a printed band) }
defineProp('food.sack', (g, p) => {
  const h = p.h || 0.62, r = p.r || 0.2;
  g.mat('weave', p.tint || '#b99c6c', { rough: 0.2 });
  g.lathe(0, 0, [[0, 0], [r * 0.85, 0], [r * 1.0, h * 0.08], [r * 1.06, h * 0.4], [r * 0.98, h * 0.7], [r * 0.72, h * 0.86], [r * 0.25, h * 0.93], [r * 0.12, h * 0.95]], { segs: 11, capTop: false });
  g.lathe(0, 0, [[r * 0.12, h * 0.95], [r * 0.1, h], [r * 0.3, h * 1.1], [r * 0.12, h * 1.08], [0, h * 1.02]], { segs: 7, capBottom: false });
  g.mat('weave', '#d6c9a6'); const ring = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ring.push([Math.cos(a) * r * 0.13, h * 0.965, Math.sin(a) * r * 0.13]); } g.tube(ring, 0.006, { segs: 4, closed: true });
  if (p.band) { g.mat('weave', p.band); g.lathe(0, 0, [[r * 1.065, h * 0.36], [r * 1.065, h * 0.48]], { segs: 11, capTop: false, capBottom: false }); }
  return { posts: [[0, 0, r, 0, h]], tier: 's' };
});

// A storage crock with a paper band and a cloth, glazed or wooden lid. p: { glaze, h, r, lid: 'glaze' | 'cloth' | 'wood', cloth, label: bool, band }
defineProp('food.crock', (g, p) => {
  const h = p.h || 0.26, r = p.r || 0.1, c = p.glaze || '#7a5236';
  g.mat('glaze', c, { rough: -0.15 });
  g.lathe(0, 0, [[0, 0], [r * 0.82, 0], [r * 0.98, h * 0.14], [r * 1.02, h * 0.55], [r * 0.9, h * 0.82], [r * 0.76, h * 0.88], [r * 0.8, h * 0.93], [r * 0.74, h * 0.93]], { segs: 16, capTop: false });
  if (p.band) { g.mat('glaze', p.band, { rough: -0.15 }); g.lathe(0, 0, [[r * 1.023, h * 0.3], [r * 1.028, h * 0.36]], { segs: 16, capTop: false, capBottom: false }); }
  const lid = p.lid || 'glaze';
  if (lid === 'cloth') {
    g.mat('weave', p.cloth || '#e6dcc4'); g.ball(0, h * 0.9, 0, r * 0.9, h * 0.1, r * 0.9, { segs: 12, rings: 4, bottom: 0 });
    g.lathe(0, 0, [[r * 0.9, h * 0.75], [r * 0.86, h * 0.9]], { segs: 12, capTop: false, capBottom: false });
    g.mat('weave', p.string || '#8a2f2a'); const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ring.push([Math.cos(a) * r * 0.8, h * 0.85, Math.sin(a) * r * 0.8]); } g.tube(ring, 0.003, { segs: 3, closed: true });
  } else if (lid === 'wood') {
    g.mat('wood', p.wood || '#7a5636'); g.cyl(0, h * 0.92, 0, r * 0.84, 0.018, { segs: 16 }); g.cyl(0, h * 0.92 + 0.018, 0, 0.018, 0.022, { segs: 8 });
  } else {
    g.mat('glaze', p.lidTint || shadeHex(c, 1.22), { rough: -0.15 }); g.lathe(0, 0, [[r * 0.82, h * 0.92], [r * 0.8, h * 0.96], [r * 0.25, h * 1.02], [r * 0.2, h * 1.07], [r * 0.24, h * 1.1], [0, h * 1.11]], { segs: 16, capBottom: false });
  }
  if (p.label !== false) { g.mat('paper', p.paper || '#efe6cf'); g.lathe(0, 0, [[r * 1.032, h * 0.42], [r * 1.034, h * 0.6]], { segs: 16, capTop: false, capBottom: false }); }
  return { posts: h > 0.4 ? [[0, 0, r, 0, h]] : null, cast: h > 0.3 };
});

// A glass jar: what is in it shows (fill), with a cloth or metal lid and a paper label. p: { fill, h, r, lid: 'cloth' | 'metal', cloth, level (0..1) }
defineProp('food.jar', (g, p) => {
  const h = p.h || 0.14, r = p.r || 0.042, lv = p.level === undefined ? 0.86 : p.level;
  g.mat('plain', p.fill || '#6a1e3a', { rough: -0.38 });
  g.lathe(0, 0, [[0, 0], [r * 0.92, 0], [r, h * 0.06], [r, h * lv]], { segs: 14, capTop: false });
  g.mat('plain', mixHex(p.fill || '#6a1e3a', '#dfe8e4', 0.7), { rough: -0.45 });
  g.lathe(0, 0, [[r, h * lv], [r, h * 0.8], [r * 0.86, h * 0.88], [r * 0.84, h * 0.94], [0, h * 0.94]], { segs: 14, capBottom: false });
  if ((p.lid || 'cloth') === 'cloth') {
    g.mat('weave', p.cloth || '#d9c79a'); g.ball(0, h * 0.94, 0, r * 0.98, 0.012, r * 0.98, { segs: 10, rings: 3, bottom: 0 });
    g.lathe(0, 0, [[r * 1.02, h * 0.82], [r * 0.9, h * 0.95]], { segs: 10, capTop: false, capBottom: false });
    g.mat('weave', p.string || '#8a2f2a'); g.cyl(0, h * 0.875, 0, r * 0.88, 0.006, { segs: 10 });
  } else { g.mat('cast', p.cap || '#b08a45', { rough: -0.1 }); g.cyl(0, h * 0.92, 0, r * 0.9, 0.022, { segs: 14 }); }
  g.mat('paper', p.paper || '#efe6cf'); g.lathe(0, 0, [[r * 1.012, h * 0.28], [r * 1.012, h * 0.58]], { segs: 14, capTop: false, capBottom: false });
  return { cast: false };
});

// A bottle. p: { glass, h, r, cork (colour), label }
defineProp('food.bottle', (g, p) => {
  const h = p.h || 0.3, r = p.r || 0.036;
  g.mat('plain', p.glass || '#2e4a2c', { rough: -0.42 });
  g.lathe(0, 0, [[0, 0], [r * 0.95, 0], [r, h * 0.05], [r, h * 0.6], [r * 0.9, h * 0.67], [r * 0.38, h * 0.8], [r * 0.33, h * 0.93], [r * 0.4, h * 0.94], [r * 0.38, h * 0.97]], { segs: 12, capTop: false });
  g.mat(p.cork === 'wax' ? 'plain' : 'wood', p.cork === 'wax' ? '#8a2420' : (p.cork || '#b8956a')); g.cyl(0, h * 0.95, 0, r * 0.34, h * 0.07, { segs: 8 });
  if (p.label !== false) { g.mat('paper', p.paper || '#ede3c8'); g.lathe(0, 0, [[r * 1.01, h * 0.22], [r * 1.01, h * 0.47]], { segs: 12, capTop: false, capBottom: false }); }
  return { cast: false };
});

// A painted tin with a lid (rusks, biscuits, the Nine). p: { col, h, r, band }
defineProp('food.tin', (g, p) => {
  const h = p.h || 0.16, r = p.r || 0.07;
  g.mat('paint', p.col || '#2f6f73', { rough: -0.1 }); g.cyl(0, 0, 0, r, h * 0.88, { segs: 16 });
  g.mat('cast', p.lid || '#b9b0a0', { rough: -0.1 }); g.lathe(0, 0, [[r * 1.02, h * 0.84], [r * 1.02, h * 0.98], [r * 0.96, h], [0, h]], { segs: 16 });
  g.mat('paint', p.band || '#e9d9a8'); g.lathe(0, 0, [[r * 1.005, h * 0.3], [r * 1.005, h * 0.6]], { segs: 16, capTop: false, capBottom: false });
  return { cast: false };
});

// A round wooden board for a glass dome to sit on (the glass itself is drawn by dome()). p: { r, wood }
defineProp('food.domebase', (g, p) => {
  const r = p.r || 0.15; g.mat('wood', p.wood || '#6a4a30', { rough: -0.1 });
  g.lathe(0, 0, [[r * 0.92, 0], [r, 0.008], [r, 0.018], [r * 0.97, 0.026], [0, 0.026]], { segs: 22 });
  return { cast: false };
});

// A cane basket with a linen liner, filled. p: { w, d, h, cane, cloth, fill: 'boule' | 'batard' | 'roll' | 'bun' | 'puff' | 'apple' | 'none', crust, covered: bool, n }
defineProp('food.basket', (g, p) => {
  const w = p.w || 0.5, d = p.d || 0.34, h = p.h || 0.12, cane = p.cane || '#b48a52', rng = new Rng(hashStr('bk' + (p.fill || '') + w + d + (p.seed || 0)));
  g.mat('cane', cane); g.box(-w / 2, 0, -d / 2, w / 2, h, d / 2, { bevel: 0.015, faces: 'xXzZy' });
  g.mat('cane', shadeHex(cane, 0.8)); g.tube([[-w / 2, h, -d / 2], [w / 2, h, -d / 2], [w / 2, h, d / 2], [-w / 2, h, d / 2]], 0.012, { segs: 5, closed: true });
  g.mat('weave', p.cloth || '#efe7d6'); g.box(-w / 2 + 0.02, h - 0.03, -d / 2 + 0.02, w / 2 - 0.02, h - 0.02, d / 2 - 0.02, { faces: 'Y' });
  // the liner hangs over the front edge in a few soft folds
  const fl = p.cloth || '#efe7d6'; g.mat('weave', fl, { rough: 0.1 });
  g.quad([-w * 0.32, h + 0.006, d / 2 + 0.01], [w * 0.32, h + 0.006, d / 2 + 0.01], [w * 0.22, h - 0.07, d / 2 + 0.018], [-w * 0.22, h - 0.07, d / 2 + 0.018], { double: true });
  const fill = p.fill || 'boule', top = h - 0.025;
  if (fill !== 'none') {
    const sz = fill === 'batard' ? [0.3, 0.16] : fill === 'boule' ? [0.21, 0.21] : fill === 'apple' ? [0.085, 0.085] : fill === 'puff' ? [0.05, 0.05] : [0.09, 0.09];
    const nx = Math.max(1, Math.floor((w - 0.04) / sz[0])), nz = Math.max(1, Math.floor((d - 0.04) / sz[1]));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = -w / 2 + 0.02 + (i + 0.5) * (w - 0.04) / nx + rng.f(-0.01, 0.01), z = -d / 2 + 0.02 + (j + 0.5) * (d - 0.04) / nz + rng.f(-0.01, 0.01);
      if (fill === 'bun') drawBun(g, x, top, z, 0.04, p.crust || '#b86a2c', p.top);
      else if (fill === 'puff') { drawPuff(g, x, top, z); if (rng.chance(0.6)) drawPuff(g, x + 0.012, top + 0.03, z - 0.01); }
      else if (fill === 'apple') drawApple(g, x, top, z, 0.038, mixHex('#b8322a', '#c9a23a', rng.f(0, 0.5)));
      else drawLoaf(g, x, top, z, fill, p.crust, fill === 'batard' ? rng.f(-0.15, 0.15) : rng.f(0, 3), 10);
    }
    if (p.covered) { g.mat('weave', p.cloth || '#efe7d6', { rough: 0.1 }); g.ball(0, top + 0.02, 0, w * 0.5, fill === 'puff' ? 0.05 : 0.09, d * 0.5, { segs: 16, rings: 5, bottom: 0 }); }
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], cast: false };
});

// A cane proving basket (banneton) with the dough in it. p: { r, cane, dough, cloth: colour of a linen cover (optional) }
defineProp('food.proof', (g, p) => {
  const r = p.r || 0.11, h = 0.08;
  g.mat('cane', p.cane || '#c49a62'); g.lathe(0, 0, [[0, 0], [r * 0.7, 0], [r * 0.92, h * 0.5], [r, h], [r * 0.92, h], [r * 0.86, h * 0.6]], { segs: 18, capTop: false });
  g.mat('cane', shadeHex(p.cane || '#c49a62', 0.75)); for (const t of [0.3, 0.6, 0.9]) { const ring = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; const rr = r * (0.78 + t * 0.22) + 0.002; ring.push([Math.cos(a) * rr, h * t, Math.sin(a) * rr]); } g.tube(ring, 0.003, { segs: 3, closed: true }); }
  if (p.cloth) { g.mat('weave', p.cloth); g.ball(0, h, 0, r * 1.02, 0.03, r * 1.02, { segs: 14, rings: 3, bottom: 0 }); }
  else { g.mat('plaster', p.dough || '#efe2c4', { rough: 0.15 }); g.ball(0, h * 0.82, 0, r * 0.86, 0.035, r * 0.86, { segs: 14, rings: 4, bottom: 0 }); }
  return { cast: false };
});

// A sheet tray of baking. p: { w, d, fill: 'bun' | 'croissant' | 'puff' | 'roll' | 'boule' | 'batard' | 'cake' | 'none', col, top, cover (linen colour) }
defineProp('food.tray', (g, p) => {
  const w = p.w || 0.6, d = p.d || 0.4, rng = new Rng(hashStr('tr' + (p.fill || '') + (p.seed || 0)));
  g.mat('brushed', p.metal || '#9a948a', { rough: 0.1 }); g.box(-w / 2, 0, -d / 2, w / 2, 0.006, d / 2);
  for (const s of [-1, 1]) { g.box(-w / 2, 0, s * d / 2 - 0.006, w / 2, 0.022, s * d / 2 + 0.002 - (s > 0 ? 0.008 : 0)); g.box(s * w / 2 - (s > 0 ? 0.006 : 0), 0, -d / 2, s * w / 2 + (s > 0 ? 0 : 0.006), 0.022, d / 2); }
  g.mat('paper', '#e8dcc0'); g.box(-w / 2 + 0.012, 0.006, -d / 2 + 0.012, w / 2 - 0.012, 0.008, d / 2 - 0.012, { faces: 'Y' });
  const fill = p.fill || 'bun', y = 0.008;
  if (fill === 'cake') {
    g.mat('plaster', p.col || '#f0d880', { rough: 0.2 }); const n = 3, m = 2;
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const x0 = -w / 2 + 0.02 + i * (w - 0.04) / n, z0 = -d / 2 + 0.02 + j * (d - 0.04) / m; g.box(x0 + 0.004, y, z0 + 0.004, x0 + (w - 0.04) / n - 0.004, y + 0.055, z0 + (d - 0.04) / m - 0.004, { bevel: 0.01 }); }
  } else if (fill !== 'none') {
    const step = fill === 'boule' ? 0.22 : fill === 'batard' ? 0.18 : fill === 'puff' ? 0.06 : fill === 'croissant' ? 0.13 : 0.1;
    const nx = Math.max(1, Math.floor((w - 0.02) / (fill === 'batard' ? 0.32 : step))), nz = Math.max(1, Math.floor((d - 0.02) / step));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = -w / 2 + (i + 0.5) * w / nx + rng.f(-0.006, 0.006), z = -d / 2 + (j + 0.5) * d / nz + rng.f(-0.006, 0.006);
      if (fill === 'bun') drawBun(g, x, y, z, 0.04, p.col, p.top);
      else if (fill === 'puff') drawPuff(g, x, y, z);
      else if (fill === 'croissant') drawCroissant(g, x, y, z, rng.f(-0.3, 0.3), p.col);
      else drawLoaf(g, x, y, z, fill, p.col, fill === 'batard' ? rng.f(-0.1, 0.1) : rng.f(0, 3), 10);
    }
  }
  if (p.cover) { g.mat('weave', p.cover, { rough: 0.1 }); g.ball(0, 0.02, 0, w * 0.5, 0.06, d * 0.5, { segs: 14, rings: 4, bottom: 0 }); }
  return { cast: false };
});

// A tall wheeled cooling rack of trays. p: { w, d, h, n (trays), fills: ['bun', 'boule', ...] (cycled), metal }
defineProp('food.rack', (g, p) => {
  const w = p.w || 0.66, d = p.d || 0.46, h = p.h || 1.75, n = p.n || 9, metal = p.metal || '#a9a39a';
  g.mat('brushed', metal, { rough: 0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * w / 2, 0.08, sz * d / 2], [sx * w / 2, h, sz * d / 2]], 0.012, { segs: 6 });
  for (const yy of [0.1, h]) { g.tube([[-w / 2, yy, -d / 2], [w / 2, yy, -d / 2], [w / 2, yy, d / 2], [-w / 2, yy, d / 2]], 0.011, { segs: 5, closed: true }); }
  g.mat('brushed', '#4a4540');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.cyl(sx * w / 2, 0.055, sz * d / 2, 0.012, 0.03, { segs: 6 }); g.push(); g.move(sx * w / 2, 0.035, sz * d / 2); g.rotX(Math.PI / 2); g.cyl(0, -0.012, 0, 0.033, 0.024, { segs: 10 }); g.pop(); }
  const fills = p.fills || ['boule', 'bun', 'batard', 'roll', 'none', 'croissant'];
  for (let i = 0; i < n; i++) {
    const yy = 0.22 + i * (h - 0.32) / (n - 1);
    g.mat('brushed', metal); for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.02, yy - 0.01, -d / 2, sx * w / 2 + 0.02, yy, d / 2);
    const f = fills[i % fills.length]; if (f === 'empty') continue;
    g.mat('brushed', '#8f897f'); g.box(-w / 2 + 0.02, yy, -d / 2 + 0.01, w / 2 - 0.02, yy + 0.006, d / 2 - 0.01);
    const rng = new Rng(hashStr('rk' + i + f));
    if (f === 'none') continue;
    const step = f === 'boule' ? 0.21 : f === 'batard' ? 0.17 : f === 'croissant' ? 0.13 : 0.1; const nx = Math.max(1, Math.floor((w - 0.04) / (f === 'batard' ? 0.31 : step))), nz = Math.max(1, Math.floor((d - 0.04) / step));
    if (yy + 0.1 > h - 0.02) continue;
    for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
      const x = -w / 2 + 0.02 + (a + 0.5) * (w - 0.04) / nx, z = -d / 2 + 0.01 + (b + 0.5) * (d - 0.02) / nz;
      if (f === 'bun') drawBun(g, x, yy + 0.006, z, 0.038, p.bun || '#b86a2c');
      else if (f === 'croissant') drawCroissant(g, x, yy + 0.006, z, rng.f(-0.3, 0.3));
      else if (f === 'puff') drawPuff(g, x, yy + 0.006, z);
      else drawLoaf(g, x, yy + 0.006, z, f, rng.pick(['#b8763a', '#a8662e', '#c08446']), rng.f(-0.2, 0.2), 9);
    }
  }
  return { solid: [[-w / 2 - 0.02, 0, -d / 2 - 0.02, w / 2 + 0.02, h, d / 2 + 0.02]], tier: 's' };
});

// An electric deck oven, three decks, glowing through its windows. p: { w, d, decks, body, trim }
defineProp('food.oven', (g, p) => {
  const w = p.w || 1.5, d = p.d || 0.9, n = p.decks || 3, body = p.body || '#c9c2b6', trim = p.trim || '#3a3430';
  const y0 = 0.42, dh = 0.42, top = y0 + n * dh;
  // stand
  g.mat('brushed', '#6a645c'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.05) - 0.025, 0, sz * (d / 2 - 0.05) - 0.025, sx * (w / 2 - 0.05) + 0.025, y0, sz * (d / 2 - 0.05) + 0.025);
  g.box(-w / 2 + 0.05, 0.12, -d / 2 + 0.06, w / 2 - 0.05, 0.14, d / 2 - 0.06);
  // body
  g.mat('brushed', body, { rough: -0.05 }); g.box(-w / 2, y0, -d / 2, w / 2, top + 0.08, d / 2, { bevel: 0.012 });
  for (let i = 0; i < n; i++) {
    const yb = y0 + i * dh + 0.05, yt = yb + dh - 0.1;
    g.mat('paint', trim); g.box(-w / 2 + 0.05, yb, d / 2, w / 2 - 0.3, yt, d / 2 + 0.025, { bevel: 0.01 });
    g.mat('diffuser', '#ff9a4a', { emissive: 0.9, lamp: true }); g.box(-w / 2 + 0.16, yb + 0.1, d / 2 + 0.024, w / 2 - 0.42, yt - 0.08, d / 2 + 0.028, { faces: 'Z' });
    g.mat('brushed', '#d8d2c6', { rough: -0.2 }); g.tube([[-w / 2 + 0.14, yt + 0.02, d / 2 + 0.03], [-w / 2 + 0.14, yt + 0.02, d / 2 + 0.07], [w / 2 - 0.4, yt + 0.02, d / 2 + 0.07], [w / 2 - 0.4, yt + 0.02, d / 2 + 0.03]], 0.012, { segs: 6 });
    // control panel: two dials and a lamp
    g.mat('paint', shadeHex(trim, 1.3)); g.box(w / 2 - 0.26, yb, d / 2, w / 2 - 0.04, yt, d / 2 + 0.02, { bevel: 0.006 });
    g.mat('cast', '#2a2622'); for (const k of [0, 1]) { g.push(); g.move(w / 2 - 0.15, yb + 0.08 + k * 0.12, d / 2 + 0.02); g.rotX(Math.PI / 2); g.cyl(0, -0.03, 0, 0.032, 0.03, { segs: 12 }); g.pop(); }
    g.mat('plain', k2(i), { emissive: 3, lamp: true }); g.ball(w / 2 - 0.15, yt - 0.03, d / 2 + 0.024, 0.009, 0.009, 0.006, { segs: 6, rings: 4 });
  }
  g.mat('paint', trim); g.box(-w / 2 - 0.01, top + 0.08, -d / 2 - 0.01, w / 2 + 0.01, top + 0.14, d / 2 + 0.01, { bevel: 0.01 });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, top + 0.14, d / 2 + 0.08]], tier: 's' };
});
function k2(i) { return i === 1 ? '#ff9a3a' : '#7ad06a'; }

// A dough mixer: a steel bowl on a cream-painted stand. p: { paint }
defineProp('food.mixer', (g, p) => {
  const c = p.paint || '#e9dcc0';
  g.mat('paint', c, { rough: -0.1 }); g.box(-0.22, 0, -0.32, 0.22, 0.12, 0.3, { bevel: 0.03 });
  g.box(-0.15, 0.12, -0.32, 0.15, 1.2, -0.12, { bevel: 0.04 });
  g.box(-0.16, 1.05, -0.3, 0.16, 1.28, 0.22, { bevel: 0.05 });
  g.mat('brushed', '#cfcac2', { rough: -0.2 }); g.lathe(0, 0.08, [[0, 0.45], [0.12, 0.45], [0.22, 0.52], [0.25, 0.7], [0.25, 0.86], [0.26, 0.87], [0.24, 0.87]], { segs: 20, capTop: false });
  g.mat('plaster', '#efe2c4', { rough: 0.2 }); g.ball(0, 0.72, 0.08, 0.21, 0.08, 0.21, { segs: 14, rings: 4, bottom: 0 });
  g.mat('brushed', '#9a948a'); g.tube([[0, 1.05, 0.08], [0, 0.9, 0.08], [0.06, 0.8, 0.1], [0.02, 0.74, 0.05]], 0.016, { segs: 6 });
  g.mat('plain', '#c9552e', { rough: -0.2 }); g.cyl(0.17, 1.12, -0.1, 0.03, 0.03, { segs: 10 });
  return { solid: [[-0.27, 0, -0.33, 0.27, 1.28, 0.34]], tier: 's' };
});

// A bamboo steamer stack with its lid. p: { r, n }
defineProp('food.steamer', (g, p) => {
  const r = p.r || 0.13, n = p.n || 2, h = 0.06;
  for (let i = 0; i < n; i++) { g.mat('cane', i % 2 ? '#c9a46a' : '#bf9a5e'); g.lathe(0, 0, [[r, i * h], [r, i * h + h], [r * 0.96, i * h + h], [r * 0.96, i * h + 0.004]], { segs: 18, capTop: false, capBottom: i === 0 }); g.mat('cane', '#9a7a48'); g.lathe(0, 0, [[r * 1.006, i * h + h * 0.4], [r * 1.006, i * h + h * 0.6]], { segs: 18, capTop: false, capBottom: false }); }
  g.mat('cane', '#c9a46a'); g.lathe(0, 0, [[r * 1.01, n * h], [r * 1.01, n * h + 0.03], [r * 0.6, n * h + 0.05], [0, n * h + 0.055]], { segs: 18 });
  return { cast: false };
});

// Scales. p: { kind: 'balance' (brass, two pans) | 'dial' (enamel, one pan), col }
defineProp('food.scale', (g, p) => {
  if (p.kind === 'dial') {
    const c = p.col || '#d9cdb4';
    g.mat('paint', c, { rough: -0.15 }); g.box(-0.13, 0, -0.12, 0.13, 0.08, 0.14, { bevel: 0.02 }); g.box(-0.1, 0.08, -0.1, 0.1, 0.3, -0.02, { bevel: 0.03 });
    g.mat('plain', '#f4efe2', { rough: -0.3 }); g.push(); g.move(0, 0.2, -0.02); g.rotX(Math.PI / 2); g.cyl(0, -0.006, 0, 0.075, 0.006, { segs: 20 }); g.pop();
    g.mat('cast', '#b08a45'); g.push(); g.move(0, 0.2, -0.01); g.rotX(Math.PI / 2); g.lathe(0, 0, [[0.082, -0.006], [0.085, 0], [0.078, 0.008]], { segs: 20, capTop: false, capBottom: false }); g.pop();
    g.mat('plain', '#8a2420'); g.box(-0.002, 0.2, -0.0145, 0.002, 0.26, -0.0125);
    g.mat('brushed', '#c9c4bb', { rough: -0.2 }); g.lathe(0, 0.03, [[0, 0.08], [0.12, 0.085], [0.15, 0.11], [0.14, 0.112]], { segs: 20, capTop: false });
    return { solid: [[-0.15, 0, -0.12, 0.15, 0.3, 0.18]], cast: false };
  }
  const b = p.col || '#b08a45';
  g.mat('cast', b, { rough: -0.15 });
  g.lathe(0, 0, [[0.09, 0], [0.09, 0.015], [0.06, 0.03], [0.02, 0.05], [0.014, 0.3], [0.025, 0.31], [0.02, 0.33]], { segs: 16 });
  g.box(-0.2, 0.3, -0.008, 0.2, 0.316, 0.008, { bevel: 0.004 });
  g.mat('cast', '#3a2c14'); g.box(-0.002, 0.316, -0.009, 0.002, 0.36, -0.006);
  for (const sx of [-1, 1]) {
    g.mat('cast', b); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; g.tube([[sx * 0.19, 0.31, 0], [sx * 0.19 + Math.cos(a) * 0.075, 0.14, Math.sin(a) * 0.075]], 0.0015, { segs: 3, caps: false }); }
    g.lathe(sx * 0.19, 0, [[0, 0.115], [0.04, 0.115], [0.075, 0.135], [0.082, 0.142], [0.078, 0.142], [0.07, 0.136], [0.035, 0.12], [0, 0.12]], { segs: 16 });
  }
  return { solid: [[-0.28, 0, -0.09, 0.28, 0.33, 0.09]], cast: false };
});

// A cabinet of small seed drawers with brass label frames and knobs. p: { w, h, d, cols, rows, wood, front, legs }
defineProp('food.drawers', (g, p) => {
  const w = p.w || 1.2, h = p.h || 1.0, d = p.d || 0.4, C = p.cols || 8, R = p.rows || 6, wood = p.wood || '#5a3e28', front = p.front || shadeHex(wood, 1.15), leg = p.legs || 0;
  g.mat('wood', wood, { rough: -0.05 }); g.box(-w / 2, leg, -d / 2, w / 2, leg + h, d / 2, { bevel: 0.01, faces: 'xXyYz' });
  g.box(-w / 2 - 0.02, leg + h, -d / 2 - 0.01, w / 2 + 0.02, leg + h + 0.035, d / 2 + 0.03, { bevel: 0.008 });
  if (leg > 0) for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.04) - 0.025, 0, sz * (d / 2 - 0.04) - 0.025, sx * (w / 2 - 0.04) + 0.025, leg, sz * (d / 2 - 0.04) + 0.025);
  g.mat('wood', shadeHex(wood, 0.55)); g.box(-w / 2 + 0.02, leg + 0.02, d / 2 - 0.01, w / 2 - 0.02, leg + h - 0.02, d / 2 - 0.005, { faces: 'Z' });
  const cw = (w - 0.04) / C, rh = (h - 0.04) / R, rng = new Rng(hashStr('dr' + C + R + w));
  for (let i = 0; i < C; i++) for (let j = 0; j < R; j++) {
    const x0 = -w / 2 + 0.02 + i * cw + 0.006, x1 = x0 + cw - 0.012, y0 = leg + 0.02 + j * rh + 0.006, y1 = y0 + rh - 0.012, out = rng.chance(0.06) ? 0.03 : 0;
    g.mat('wood', mixHex(front, shadeHex(front, 0.85), rng.next()), { rough: -0.05 }); g.box(x0, y0, d / 2 - 0.02 + out, x1, y1, d / 2 + 0.008 + out, { bevel: 0.004 });
    const cx = (x0 + x1) / 2, lw = Math.min(0.06, (x1 - x0) * 0.6);
    g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(cx - lw / 2, y1 - 0.045, d / 2 + 0.008 + out, cx + lw / 2, y1 - 0.015, d / 2 + 0.011 + out, { faces: 'Z' });
    g.mat('paper', rng.chance(0.2) ? '#e6d3a0' : '#f0e8d4'); g.box(cx - lw / 2 + 0.004, y1 - 0.041, d / 2 + 0.011 + out, cx + lw / 2 - 0.004, y1 - 0.019, d / 2 + 0.012 + out, { faces: 'Z' });
    g.mat('cast', '#9a7a3a'); g.ball(cx, (y0 + y1) / 2 - 0.01, d / 2 + 0.016 + out, 0.01, 0.01, 0.01, { segs: 6, rings: 4 });
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, leg + h + 0.035, d / 2 + 0.03]], tier: 's' };
});

// A rolling library ladder that hooks onto a rail at its top. p: { h, w, wood, lean (metres the foot stands out) }
defineProp('food.ladder', (g, p) => {
  const h = p.h || 2.9, w = p.w || 0.45, lean = p.lean || 0.5, wood = p.wood || '#7a5636';
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) g.tube([[sx * w / 2, 0.05, lean], [sx * w / 2, h, 0]], 0.022, { segs: 6 });
  const n = Math.round(h / 0.3);
  for (let i = 1; i < n; i++) { const t = i / n; const zz = lean * (1 - t), yy = 0.05 + (h - 0.05) * t; g.box(-w / 2, yy - 0.015, zz - 0.06, w / 2, yy + 0.015, zz + 0.06, { bevel: 0.006 }); }
  g.mat('cast', '#3a3430'); for (const sx of [-1, 1]) { g.tube([[sx * w / 2, h, 0], [sx * w / 2, h + 0.08, 0], [sx * w / 2, h + 0.08, -0.07], [sx * w / 2, h + 0.02, -0.07]], 0.01, { segs: 5 }); g.push(); g.move(sx * w / 2, 0.035, lean); g.rotZ(Math.PI / 2); g.cyl(0, -0.012, 0, 0.035, 0.024, { segs: 10 }); g.pop(); }
  return { solid: [[-w / 2, 0, 0, w / 2, h, lean + 0.06]], tier: 's' };
});

// A handcart with two big wheels and tiered shelves for setting goods out on the pavement. p: { w, d, paint, wood }
// Returns spots; the tops of its two tiers are at y 0.62 (front) and 0.86 (back), at z +0.12 and -0.14.
defineProp('food.cart', (g, p) => {
  const w = p.w || 1.3, d = p.d || 0.6, paint = p.paint || '#2f6f73', wood = p.wood || '#9a7048';
  g.mat('paint', paint, { rough: -0.05 });
  for (const sx of [-1, 1]) { g.box(sx * w / 2 - 0.03, 0.3, -d / 2, sx * w / 2 + 0.03, 0.66, d / 2, { bevel: 0.008, faces: 'xXyYzZ' }); }
  g.box(-w / 2, 0.3, -d / 2, w / 2, 0.36, d / 2, { bevel: 0.008 });
  g.mat('wood', wood, { rough: -0.05 });
  g.box(-w / 2 + 0.03, 0.58, -0.02, w / 2 - 0.03, 0.62, d / 2 - 0.02, { bevel: 0.006 });            // front tier
  g.box(-w / 2 + 0.03, 0.82, -d / 2 + 0.02, w / 2 - 0.03, 0.86, -0.02, { bevel: 0.006 });           // back tier
  g.box(-w / 2 + 0.03, 0.62, -0.04, w / 2 - 0.03, 0.82, -0.02);
  g.mat('paint', paint); g.box(-w / 2 + 0.03, 0.62, d / 2 - 0.04, w / 2 - 0.03, 0.66, d / 2 - 0.02, { bevel: 0.004 });
  // wheels at the back corners, legs at the front
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 + 0.06); const ring = [], rr = 0.29; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; ring.push([x, 0.3 + Math.sin(a) * rr, -d / 2 + 0.1 + Math.cos(a) * rr]); }
    g.mat('cast', '#2e2a26'); g.tube(ring, 0.022, { segs: 6, closed: true });
    g.mat('paint', paint); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.tube([[x, 0.3, -d / 2 + 0.1], [x, 0.3 + Math.sin(a) * rr, -d / 2 + 0.1 + Math.cos(a) * rr]], 0.009, { segs: 4, caps: false }); }
    g.push(); g.move(x, 0.3, -d / 2 + 0.1); g.rotZ(Math.PI / 2); g.cyl(0, -0.04, 0, 0.04, 0.08, { segs: 10 }); g.pop();
    g.mat('paint', paint); g.tube([[sx * (w / 2 - 0.04), 0, d / 2 - 0.06], [sx * (w / 2 - 0.04), 0.32, d / 2 - 0.06]], 0.02, { segs: 6 });
    g.mat('wood', '#5a4030'); g.tube([[sx * (w / 2 - 0.04), 0.66, -d / 2 + 0.02], [sx * (w / 2 - 0.04), 0.98, -d / 2 - 0.14], [sx * (w / 2 - 0.1), 1.02, -d / 2 - 0.3]], 0.018, { segs: 6 });
  }
  return { solid: [[-w / 2 - 0.1, 0, -d / 2 - 0.2, w / 2 + 0.1, 0.9, d / 2]], tier: 's', spots: [{ type: 'browse', x: 0, y: 0, z: d / 2 + 0.55, yaw: Math.PI }] };
});

// A display table with a cloth that hangs to the floor. p: { w, d, h, cloth, wood, trim }
defineProp('food.stall', (g, p) => {
  const w = p.w || 1.4, d = p.d || 0.55, h = p.h || 0.72, cloth = p.cloth || '#c9552e';
  g.mat('wood', p.wood || '#7a5636', { rough: -0.05 }); g.box(-w / 2, h - 0.035, -d / 2, w / 2, h, d / 2, { bevel: 0.01 });
  g.mat('weave', cloth, { rough: 0.1 });
  g.sheet([-w / 2 - 0.012, h - 0.02, d / 2 + 0.012], [w / 2 + 0.012, h - 0.02, d / 2 + 0.012], [w / 2 + 0.012, 0.02, d / 2 + 0.03], [-w / 2 - 0.012, 0.02, d / 2 + 0.03], { nu: 14, nv: 3, ripple: 0.012, rippleN: 9 });
  for (const sx of [-1, 1]) g.sheet([sx * (w / 2 + 0.012), h - 0.02, sx > 0 ? d / 2 : -d / 2], [sx * (w / 2 + 0.012), h - 0.02, sx > 0 ? -d / 2 : d / 2], [sx * (w / 2 + 0.03), 0.02, sx > 0 ? -d / 2 : d / 2], [sx * (w / 2 + 0.03), 0.02, sx > 0 ? d / 2 : -d / 2], { nu: 6, nv: 3, ripple: 0.01, rippleN: 4 });
  g.mat('weave', p.trim || '#f1e6cf'); g.box(-w / 2 - 0.014, h - 0.06, d / 2 + 0.012, w / 2 + 0.014, h - 0.03, d / 2 + 0.018, { faces: 'Z' });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A standing board on two feet (the chalk or poster sign goes on its face at y ~ 1.0, z + 0.03). p: { w, h, wood }
defineProp('food.board', (g, p) => {
  const w = p.w || 0.7, h = p.h || 1.25, wood = p.wood || '#5a4030';
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) { g.box(sx * (w / 2 + 0.02) - 0.025, 0.02, -0.025, sx * (w / 2 + 0.02) + 0.025, h, 0.025, { bevel: 0.006 }); g.box(sx * (w / 2 + 0.02) - 0.035, 0, -0.18, sx * (w / 2 + 0.02) + 0.035, 0.05, 0.18, { bevel: 0.01 }); }
  g.box(-w / 2 - 0.02, 0.36, -0.015, w / 2 + 0.02, 0.4, 0.015, { bevel: 0.004 });
  g.box(-w / 2 + 0.01, 0.42, -0.012, w / 2 - 0.01, h - 0.04, 0.012, { faces: 'xXyYz' });
  return { solid: [[-w / 2 - 0.05, 0, -0.18, w / 2 + 0.05, h, 0.18]], tier: 's' };
});

// A stack of folded linen. p: { col, n, w, d }
defineProp('food.linen', (g, p) => {
  const n = p.n || 4, w = p.w || 0.3, d = p.d || 0.22, rng = new Rng(hashStr('ln' + n + (p.col || '')));
  for (let i = 0; i < n; i++) { g.mat('weave', i % 2 ? (p.col || '#efe7d6') : (p.col2 || '#e3d6bc')); const o = rng.f(-0.01, 0.01); g.box(-w / 2 + o, i * 0.022, -d / 2 + o, w / 2 + o, i * 0.022 + 0.02, d / 2 + o, { bevel: 0.008 }); }
  return { cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------------------------

// The material of a glass surface drawn by hand. Draw with it, then s.flush({ glass: true }).
export function glassMat(g, tint, opacity, rough) {
  g.mat('plain', tint || '#dfeee8'); g._col[3] = Math.round(255 * (opacity === undefined ? 0.13 : opacity)); g._mat[3] = Math.round(255 * (rough === undefined ? 0.05 : rough));
}

// A glass dome on a round board, over whatever the caller puts at (x, y, z). r: radius of the glass, h: its height. o: { wood, tint, opacity, level }
export function dome(s, x, y, z, r, h, o = {}) {
  prop(s, 'food.domebase', x, y, z, 0, { r: r + 0.022, wood: o.wood || '#6a4a30' }, { level: o.level });
  const g = s.g, y0 = y + 0.026;
  glassMat(g, o.tint, o.opacity === undefined ? 0.16 : o.opacity);
  g.lathe(x, z, [[r, y0], [r * 0.995, y0 + h * 0.5], [r * 0.93, y0 + h * 0.78], [r * 0.7, y0 + h * 0.94], [r * 0.35, y0 + h * 0.995], [0, y0 + h]], { segs: 22, capBottom: false });
  g._col[3] = 255; s.flush({ glass: true, level: o.level });
  g.mat('glaze', o.knob || '#e9e1cf', { rough: -0.3 }); g.ball(x, y0 + h + 0.012, z, 0.016, 0.014, 0.016, { segs: 8, rings: 5 });
  s.flush({ tier: 'd', level: o.level });
}

// A small engraved brass price plate. face: 'z' | 'Z' | 'x' | 'X'. Lines after the first are small capitals.
export function plate(s, text, sub, x, y, z, face, w, o = {}) {
  const ww = w || 0.09; return sign(s, { kind: 'plate', text, lines: sub ? [sub] : undefined }, x, y, z, { face: face || 'Z', w: ww, h: o.h || ww * 0.46, board: false, level: o.level });
}

// A glass case: a cabinet base (to y = base) with a glazed box on top (to y = top), brass corner frames, optional glass shelves.
// o: { x0, z0, x1, z1, base (0.85), top (base + 0.42), frame, body, bodyMat, topTint, lining (felt colour on the floor of the case), shelves: [y...],
//      panels: 'xXzZ' (which faces of the base get raised panels), opacity (of the panes: lower in a dark room), level, noTopPane }
export function glassCase(s, o) {
  const { x0, z0, x1, z1 } = o, yb = o.base === undefined ? 0.85 : o.base, yt = o.top === undefined ? yb + 0.42 : o.top, lv = o.level;
  const fr = o.frame || '#b08a45', body = o.body || '#3a2a20';
  s.furniture((g) => {
    if (yb > 0.05) {
      g.mat(o.bodyMat || 'wood', shadeHex(body, 0.55)); g.box(x0 + 0.04, 0, z0 + 0.04, x1 - 0.04, 0.09, z1 - 0.04, { aoBottom: 0.6 });
      g.mat(o.bodyMat || 'wood', body, { rough: -0.05 }); g.box(x0 + 0.015, 0.09, z0 + 0.015, x1 - 0.015, yb - 0.035, z1 - 0.015, { aoBottom: 0.7 });
      g.mat(o.topMat || 'wood', o.topTint || shadeHex(body, 1.35), { rough: -0.12 }); g.box(x0 - 0.01, yb - 0.035, z0 - 0.01, x1 + 0.01, yb, z1 + 0.01, { bevel: 0.01 });
      const pan = o.panels === undefined ? 'zZxX' : o.panels; g.mat(o.bodyMat || 'wood', shadeHex(body, 1.18), { rough: -0.05 });
      for (const f of pan) {
        const alongX = f === 'z' || f === 'Z', len = alongX ? x1 - x0 : z1 - z0, n = Math.max(1, Math.round(len / 0.55)), sg = f === 'Z' || f === 'X' ? 1 : -1;
        for (let i = 0; i < n; i++) {
          const a0 = (alongX ? x0 : z0) + 0.08 + i * (len - 0.16) / n + 0.025, a1 = (alongX ? x0 : z0) + 0.08 + (i + 1) * (len - 0.16) / n - 0.025;
          if (alongX) { const zz = sg > 0 ? z1 - 0.015 : z0 + 0.015; g.box(a0, 0.17, zz - 0.008, a1, yb - 0.12, zz + 0.008, { bevel: 0.006 }); }
          else { const xx = sg > 0 ? x1 - 0.015 : x0 + 0.015; g.box(xx - 0.008, 0.17, a0, xx + 0.008, yb - 0.12, a1, { bevel: 0.006 }); }
        }
      }
    }
    if (o.lining) { g.mat('felt', o.lining); g.box(x0 + 0.02, yb, z0 + 0.02, x1 - 0.02, yb + 0.004, z1 - 0.02, { faces: 'Y' }); }
    g.mat('cast', fr, { rough: -0.12 }); const t = 0.014;
    for (const c of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) g.box(c[0] - t, yb, c[1] - t, c[0] + t, yt + t, c[1] + t);
    for (const zz of [z0, z1]) { g.box(x0, yt - t, zz - t, x1, yt + t, zz + t); g.box(x0, yb, zz - t, x1, yb + 0.025, zz + t); }
    for (const xx of [x0, x1]) { g.box(xx - t, yt - t, z0, xx + t, yt + t, z1); g.box(xx - t, yb, z0, xx + t, yb + 0.025, z1); }
    for (const sy of (o.shelves || [])) { g.box(x0 + 0.01, sy - 0.006, z1 - 0.012, x1 - 0.01, sy + 0.002, z1 - 0.004); }
  }, lv);
  const op = o.opacity, P = { level: lv, opacity: op };
  s.glass(x0, yb + 0.025, z1, x1, yt - 0.012, z1, P); s.glass(x0, yb + 0.025, z0, x1, yt - 0.012, z0, P);
  s.glass(x0, yb + 0.025, z0, x0, yt - 0.012, z1, P); s.glass(x1, yb + 0.025, z0, x1, yt - 0.012, z1, P);
  if (!o.noTopPane) s.glass(x0, yt, z0, x1, yt, z1, { level: lv, opacity: op === undefined ? 0.1 : op });
  for (const sy of (o.shelves || [])) s.glass(x0 + 0.01, sy, z0 + 0.01, x1 - 0.01, sy, z1 - 0.01, { level: lv, opacity: op === undefined ? 0.16 : op * 1.5 });
  s.solid(x0, 0, z0, x1, yt, z1);
}

// The shell of a shop unit on Ladle Row: floor, ceiling with beams, three walls (side and back, just inside the footprint),
// a picture rail, front pilasters and cornice, the shop front, an optional locked back door, and the room's bounce light.
// o: { x0, x1, z0 (back), z1 (front line), h (3.2), floor: [mat, tint], ceil: [mat, tint], wall: { tint, mat, dado, skirt } (wall() options),
//      backWall: wall() options for the back wall only, rail: '#hex' | false, beams: { tint, mat, every, depth } | false,
//      front: shopfront() options (a0, a1, c are filled in), pilaster: '#hex', backDoor: { at, w, label, tint, text }, glow: roomGlow options }
// Returns { clip, spill, front } (clip: the room's box for its lamps; spill: the same box reaching 2 m out over the pavement).
export function unit(s, o) {
  const x0 = o.x0, x1 = o.x1, z0 = o.z0, z1 = o.z1, H = o.h || 3.2, t = 0.16;
  floor(s, x0, z0, x1, z1, 0, (o.floor && o.floor[0]) || 'planks', (o.floor && o.floor[1]) || '#a8794f');
  ceiling(s, x0, z0, x1, z1, H, (o.ceil && o.ceil[0]) || 'paint', (o.ceil && o.ceil[1]) || '#efe6d6');
  const w = Object.assign({ tint: '#e7d9bf' }, o.wall, { t });
  wall(s, x0 + t / 2, z0, x0 + t / 2, z1, 0, H, Object.assign({}, w, o.wallW));
  wall(s, x1 - t / 2, z0, x1 - t / 2, z1, 0, H, Object.assign({}, w, o.wallE));
  const bd = o.backDoor;
  wall(s, x0, z0 + t / 2, x1, z0 + t / 2, 0, H, Object.assign({}, w, o.backWall, { openings: bd ? [{ at: bd.at, w: bd.w || 0.9, h: 2.08 }] : [] }));
  if (bd) {
    doorFrame(s, x0 + bd.at + (bd.w || 0.9) / 2, 0, z0 + t, bd.w || 0.9, 2.08, 'x');
    door(s, { x: x0 + bd.at, y: 0, z: z0 + t / 2, w: bd.w || 0.9, h: 2.06, along: 'x', dir: 1, tint: bd.tint || '#5a3e2a', style: bd.style || 'panel', locked: true, lockedText: bd.text || 'Staff only', label: bd.label });
    s.solid(x0 + bd.at, 0, z0 - 0.3, x0 + bd.at + (bd.w || 0.9), 2.1, z0 + 0.05);
  }
  const rail = o.rail === undefined ? '#5b4636' : o.rail;
  if (rail) s.deco((g) => {
    g.mat('wood', rail, { rough: -0.05 }); const ry = o.railY || 2.32;
    g.box(x0 + t, ry - 0.025, z0 + t, x0 + t + 0.025, ry + 0.025, z1 - 0.15);
    g.box(x1 - t - 0.025, ry - 0.025, z0 + t, x1 - t, ry + 0.025, z1 - 0.15);
    g.box(x0 + t, ry - 0.025, z0 + t, x1 - t, ry + 0.025, z0 + t + 0.025);
  });
  const bm = o.beams === undefined ? {} : o.beams;
  if (bm) s.structure((g) => {
    const every = bm.every || 1.9, dep = bm.depth || 0.16; g.mat(bm.mat || 'wood', bm.tint || '#6a4a30', { rough: -0.05 });
    const n = Math.max(1, Math.round((z1 - z0 - 0.6) / every));
    for (let i = 0; i <= n; i++) { const zz = z0 + 0.4 + i * (z1 - z0 - 0.8) / n; g.box(x0 + t, H - dep, zz - 0.07, x1 - t, H, zz + 0.07, { bevel: 0.008, faces: 'xXyzZ' }); }
    if (bm.along !== false) { g.box(x0 + t, H - dep * 0.6, z0 + t, x0 + t + 0.12, H, z1 - 0.2, { faces: 'XyzZ' }); g.box(x1 - t - 0.12, H - dep * 0.6, z0 + t, x1 - t, H, z1 - 0.2, { faces: 'xyzZ' }); }
  });
  // front: pilasters at both ends, a cornice above the fascia, the glazed front between
  const pc = o.pilaster || (o.front && o.front.palette && o.front.palette.frame) || '#2d3b36';
  s.structure((g) => {
    g.mat('paint', pc, { rough: -0.05 });
    for (const a of [[x0, x0 + 0.22], [x1 - 0.22, x1]]) {
      g.box(a[0], 0, z1 - 0.24, a[1], H, z1 + 0.02, { bevel: 0.01 });
      g.box(a[0] - (a[0] === x0 ? 0 : 0.01), 0, z1 - 0.24, a[1] + (a[0] === x0 ? 0.01 : 0), 0.32, z1 + 0.05, { bevel: 0.01 });
      g.box(a[0] - (a[0] === x0 ? 0 : 0.012), H - 0.62, z1 - 0.24, a[1] + (a[0] === x0 ? 0.012 : 0), H - 0.56, z1 + 0.05, { bevel: 0.008 });
    }
    g.extrude([[z1 - 0.25, H], [z1 + 0.02, H], [z1 + 0.08, H + 0.04], [z1 + 0.08, H + 0.1], [z1 + 0.04, H + 0.14], [z1 + 0.04, H + 0.2], [z1 - 0.25, H + 0.2]].map((q) => [q[0], q[1]]), x0, x1, 'x');
  });
  s.solid(x0, 0, z1 - 0.24, x0 + 0.22, H, z1 + 0.05); s.solid(x1 - 0.22, 0, z1 - 0.24, x1, H, z1 + 0.05);
  const fr = shopfront(s, Object.assign({ side: 's', a0: x0 + 0.22, a1: x1 - 0.22, c: z1 - 0.12, y: 0, h: H }, o.front));
  roomGlow(s, x0, 0, z0, x1, H, z1, o.glow || {});
  return { clip: [x0 - 0.05, -0.2, z0 - 0.05, x1 + 0.05, H + 0.1, z1 + 0.05], spill: [x0 - 0.05, -0.2, z0 - 0.05, x1 + 0.05, H + 0.1, z1 + 2.2], front: fr };
}

// Run fn(x, i) for n evenly spaced positions between a and b (centres of n equal cells).
export function spread(a, b, n, fn) { for (let i = 0; i < n; i++) fn(a + (b - a) * (i + 0.5) / n, i); }

// Is the shop open? Shops keep the block's hours: seven till eight, and the bakery from four.
export function openNow(game, from, to) { const h = game.clock ? game.clock.hours : 12; return h >= (from === undefined ? 7 : from) && h < (to === undefined ? 20 : to); }

// Show a shop's menu and spend from the wallet. Returns the chosen item or null. Safe without a UI.
export async function buyFrom(game, menu, keeperName, onBought) {
  if (!game.ui || !menu) return null;
  game.busy++;
  try {
    const day = game.clock ? game.clock.day : 1, hr = game.clock ? game.clock.hours : 12;
    const items = menu.items.filter((it) => !it.days || it.days.indexOf(day) >= 0).map((it) => Object.assign({}, it, { disabled: (it.hours && (hr < it.hours[0] || hr >= it.hours[1])) || (game.wallet && it.price > game.wallet.kwh + 1e-6) }));
    const id = await game.ui.menu({ kicker: keeperName || '', title: menu.title, note: menu.note, items, wallet: game.wallet ? game.wallet.kwh : 0 });
    if (!id) return null;
    const it = menu.items.find((q) => q.id === id); if (!it) return null;
    if (game.wallet && !game.wallet.spend(it.price, it.name)) return null;
    if (it.price <= 0 && game.ui.toast) game.ui.toast(it.name + (it.tag === 'loan' ? ', on loan' : ', free'), { kind: 'info' });
    if (onBought) onBought(it);
    return it;
  } finally { game.busy--; }
}

// Say something as a cast member (or plain text). Safe without a UI.
export async function sayAs(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(who, lines); } finally { game.busy--; }
}
