// The market's props: a stall with its canopy, what is out on it (by kind, each thing with its card), the racks on the
// side walls, the weigher's balance and the tea counter's urn. Front toward +z, as every prop. Kept lean: a market has
// forty or fifty stalls, and every one is seen down an aisle.
import { defineProp } from '../world/props.js';
import { Rng, hashStr, shadeHex, mixHex } from '../core/util.js';
import { STALL_COLS } from './lots_market_words.js';

export const marketGoods = true;
export const GL = ['#2f6f73', '#a3563a', '#e9e1cf', '#3d6f8a', '#6b7a3a', '#8a5a3c', '#d6a640', '#33407a', '#c9552e', '#d9c7a6', '#5b4060', '#1d4a3a'];
export const CLOTH = ['#26306b', '#c8402e', '#d6a640', '#6c9a4c', '#e9e1cf', '#5b4060', '#2f6f8f', '#b5653a', '#d4878a', '#8a2f3c', '#2f8a85', '#e0b04a'];
const CARD = '#f3ead6';

// small things, drawn at (x, y, z) in prop space, as few triangles as they will stand
function card(g, x, y, z, tilt) { g.mat('paper', CARD); g.push(); g.move(x, y, z); g.rotY(tilt || 0); g.box(-0.028, 0, -0.02, 0.028, 0.003, 0.02, { faces: 'Y' }); g.pop(); }
function hungCard(g, x, y, z) { g.mat('paper', CARD); g.box(x - 0.022, y - 0.065, z, x + 0.022, y - 0.03, z + 0.002, { faces: 'Z' }); }
function crock(g, x, y, z, h, r, gl, lid) {
  g.mat('glaze', gl); g.lathe(x, z, [[r * 0.78, y], [r, y + h * 0.4], [r * 0.9, y + h * 0.88], [r * 0.74, y + h]], { segs: 7, capBottom: false });
  if (lid) { g.mat('glaze', lid); g.lathe(x, z, [[r * 0.8, y + h], [r * 0.5, y + h + 0.03], [0, y + h + 0.05]], { segs: 7 }); }
}
function cup(g, x, y, z, gl, lid) { g.mat('glaze', gl); g.lathe(x, z, [[0.03, y], [0.045, y + 0.08]], { segs: 6, capBottom: false, capTop: !lid }); if (lid) { g.mat('glaze', lid); g.lathe(x, z, [[0.047, y + 0.08], [0.02, y + 0.1], [0, y + 0.11]], { segs: 6 }); } }
function plateStack(g, x, y, z, n, gl) { g.mat('glaze', gl); g.cyl(x, y, z, 0.105, 0.016 * n, { segs: 8, r1: 0.1 }); g.mat('glaze', shadeHex(gl, 0.85)); for (let i = 1; i < n; i++) g.lathe(x, z, [[0.106, y + i * 0.016 - 0.002], [0.106, y + i * 0.016]], { segs: 8, capTop: false, capBottom: false }); }
function bookRun(g, x0, x1, y, z, r, h) {
  let x = x0;
  while (x < x1 - 0.05) {
    const t = r.f(0.05, 0.14), hh = (h || 0.26) * r.f(0.7, 1); if (x + t > x1) break;
    g.mat('paper', mixHex(r.pick(['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f', '#5b4060', '#a0522d', '#2b3a4a', '#c9a96a']), '#e8dcc4', r.f(0, 0.2)));
    g.box(x, y, z - 0.1, x + t - 0.006, y + hh, z + 0.1, { faces: 'xXYZ' });
    x += t;
  }
}
function folded(g, x, y, z, w, d, n, cols) { for (let i = 0; i < n; i++) { g.mat(i % 2 ? 'weave' : 'motif', cols[i % cols.length]); g.box(x - w / 2, y + i * 0.04, z - d / 2, x + w / 2, y + i * 0.04 + 0.038, z + d / 2, { faces: 'xXYzZ' }); } }
function bolt(g, x, y, z, len, col) { g.push(); g.move(x, y + 0.075, z); g.rotZ(Math.PI / 2); g.mat('weave', col); g.lathe(0, 0, [[0.075, -len / 2], [0.075, len / 2]], { segs: 7 }); g.pop(); }
function handLamp(g, x, y, z, body) {
  g.mat('cast', body); g.lathe(x, z, [[0.05, y], [0.035, y + 0.04], [0.035, y + 0.15], [0.05, y + 0.17], [0, y + 0.2]], { segs: 6, capBottom: false });
  g.mat('diffuser', '#f4e2b8', { emissive: 0.6, lamp: true }); g.lathe(x, z, [[0.036, y + 0.05], [0.042, y + 0.1], [0.036, y + 0.14]], { segs: 6, capTop: false, capBottom: false });
}
function lampHead(g, x, y, z, body, lens) {
  g.mat('cast', body); g.lathe(x, z, [[0.03, y], [0.07, y + 0.06], [0.1, y + 0.14]], { segs: 8, capTop: false });
  g.mat('diffuser', lens, { emissive: 0.25 }); g.cyl(x, y + 0.13, z, 0.095, 0.004, { segs: 8, capBottom: false });
}
function ball(g, x, y, z, rr, a) { g.mat('knit', a); g.ball(x, y + rr, z, rr, rr, rr, { segs: 7, rings: 5 }); }
function kite(g, x, y, z, s, a, b) { g.mat('weave', a); g.quad([x, y, z], [x + s * 0.5, y + s * 0.65, z], [x, y + s * 1.4, z], [x - s * 0.5, y + s * 0.65, z], { double: true }); g.mat('weave', b); g.box(x - s * 0.5, y + s * 0.64, z, x + s * 0.5, y + s * 0.66, z + 0.006, { faces: 'Z' }); }
function blocks(g, x, y, z, r) { for (let i = 0; i < 4; i++) { g.mat('paint', r.pick(['#c9552e', '#2f6f73', '#d6a640', '#33407a', '#6b7a3a', '#e9e1cf'])); const bx = x + (i % 2) * 0.075 - 0.04, bz = z + Math.floor(i / 2) * 0.075 - 0.04, by = y + (i === 3 ? 0.06 : 0); g.box(bx - 0.03, by, bz - 0.03, bx + 0.03, by + 0.06, bz + 0.03, { faces: 'xXYzZ' }); } }
function shoes(g, x, y, z, col, sz) { g.mat('weave', col); for (const sx of [-1, 1]) g.box(x + sx * 0.045 - 0.035 * sz, y, z - 0.1 * sz, x + sx * 0.045 + 0.035 * sz, y + 0.06 * sz, z + 0.1 * sz, { faces: 'xXYzZ' }); }
function jar(g, x, y, z, fill, lid) {
  g.mat('plain', fill, { rough: -0.3 }); g.lathe(x, z, [[0.046, y], [0.048, y + 0.11], [0.036, y + 0.13]], { segs: 6, capBottom: false, capTop: false });
  g.mat('paper', lid); g.lathe(x, z, [[0.042, y + 0.125], [0.044, y + 0.145], [0, y + 0.15]], { segs: 6 });
}
function potPlant(g, x, y, z, pot, h) {
  g.mat('glaze', pot); g.lathe(x, z, [[0.05, y], [0.065, y + 0.11], [0.055, y + 0.105]], { segs: 6, capBottom: false });
  g.mat('leafA', '#ffffff', { sway: 0.4 }); g.card(x, y + 0.1, z, h * 0.8, h, 0.3); g.card(x, y + 0.1, z, h * 0.8, h, 1.9);
}
function tool(g, x, y, z, k) {
  if (k === 0) { g.mat('cast', '#b9b6ae', { rough: -0.2 }); g.box(x - 0.16, y, z - 0.05, x + 0.12, y + 0.004, z + 0.05, { faces: 'Y' }); g.mat('wood', '#7a4a2a'); g.box(x + 0.12, y, z - 0.04, x + 0.22, y + 0.03, z + 0.05, { faces: 'xXYzZ' }); }
  else if (k === 1) { g.mat('wood', '#c9a06a'); g.box(x - 0.06, y, z - 0.04, x + 0.06, y + 0.08, z + 0.04, { faces: 'xXYzZ' }); g.mat('wood', '#7a4a2a'); g.box(x - 0.012, y + 0.03, z + 0.04, x + 0.012, y + 0.05, z + 0.26, { faces: 'xXYZ' }); }
  else { for (let i = 0; i < 3; i++) { g.mat('wood', '#9a6a3a'); g.box(x - 0.05 + i * 0.05 - 0.012, y, z - 0.1, x - 0.05 + i * 0.05 + 0.012, y + 0.024, z + 0.1, { faces: 'xXYZ' }); } }
}
// a plain chair, front toward +z, standing at (x, y, z); hung = upside down by its seat from a peg
export function drawChair(g, x, y, z, yaw, wood, seat, hung) {
  g.push(); g.move(x, y, z); g.rotY(yaw || 0); if (hung) g.rotX(Math.PI);
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.17 - 0.017, 0, sz * 0.17 - 0.017, sx * 0.17 + 0.017, 0.44, sz * 0.17 + 0.017, { faces: 'xXzZ' });
  for (const sx of [-1, 1]) g.box(sx * 0.17 - 0.017, 0.44, -0.187, sx * 0.17 + 0.017, 0.9, -0.153, { faces: 'xXzZY' });
  for (const yy of [0.66, 0.8]) g.box(-0.16, yy, -0.18, 0.16, yy + 0.06, -0.16, { faces: 'yYzZ' });
  g.mat(seat === 'rush' ? 'rush' : 'wood', seat === 'rush' ? '#c9a46a' : shadeHex(wood, 1.15)); g.box(-0.2, 0.44, -0.2, 0.2, 0.475, 0.2, { faces: 'xXyYzZ' });
  g.pop();
}

// a coat on a hanger hung from a peg at (x, y, z): a flattened turned body, sleeves, a bright mend
export function drawCoat(g, x, y, z, col, mend) {
  g.push(); g.move(x, y, z); g.scale(1, 1, 0.34);
  g.mat('weave', col); g.lathe(0, 0, [[0.21, -1.0], [0.19, -0.6], [0.18, -0.35], [0.2, -0.12], [0.12, -0.03], [0.05, 0]], { segs: 8, capBottom: false, capTop: false });
  g.pop();
  g.mat('weave', shadeHex(col, 0.85)); for (const sx of [-1, 1]) g.tube([[x + sx * 0.18, y - 0.09, z], [x + sx * 0.21, y - 0.4, z + 0.02], [x + sx * 0.2, y - 0.7, z + 0.04]], 0.045, { segs: 5, caps: false });
  g.mat('weave', mend); g.box(x + 0.04, y - 0.55, z + 0.065, x + 0.12, y - 0.47, z + 0.075, { faces: 'Z' });
}

// A stall: a counter with a panelled front, corner posts, two shelves behind the keeper and a back board, a pelmet and a
// striped canopy. p: { w, ci (colour pair from STALL_COLS) }. Counter top at 0.92, front at z 0.41, back board at z -1.71.
defineProp('lots-market.stall', (g, p) => {
  const w = p.w || 3.2, col = STALL_COLS[(p.ci || 0) % STALL_COLS.length], body = col[0], d = 0.7, h = 0.92, top = ['#9a7048', '#b98a5a', '#8a6240'][(p.ci || 0) % 3];
  g.mat('paint', body); g.box(-w / 2, 0.08, -d / 2, w / 2, h - 0.04, d / 2, { faces: 'xXzZ', aoBottom: 0.6 });
  g.mat('paint', shadeHex(body, 0.6)); g.box(-w / 2 + 0.03, 0, d / 2 - 0.04, w / 2 - 0.03, 0.08, d / 2, { faces: 'Z' });
  g.mat('paint', shadeHex(body, 1.2)); const n = Math.max(2, Math.round(w / 0.6));
  for (let i = 0; i < n; i++) { const x0 = -w / 2 + 0.05 + i * (w - 0.1) / n + 0.03, x1 = -w / 2 + 0.05 + (i + 1) * (w - 0.1) / n - 0.03; g.box(x0, 0.16, d / 2, x1, h - 0.12, d / 2 + 0.012, { faces: 'xXyYZ' }); }
  g.mat('wood', top, { rough: -0.05 }); g.box(-w / 2 - 0.04, h - 0.04, -d / 2 - 0.02, w / 2 + 0.04, h, d / 2 + 0.06, { bevel: 0.012 });
  g.mat('wood', shadeHex(top, 0.7));
  for (const sx of [-1, 1]) { g.box(sx * w / 2 - 0.045, h, d / 2 - 0.02, sx * w / 2 + 0.045, 2.55, d / 2 + 0.07, { faces: 'xXzZ' }); g.box(sx * w / 2 - 0.045, 0, -d / 2 - 1.3, sx * w / 2 + 0.045, 2.75, -d / 2 - 1.21, { faces: 'xXzZ' }); }
  g.mat('wood', top); for (const yy of [0.9, 1.35, 1.8]) g.box(-w / 2 + 0.05, yy, -d / 2 - 1.3, w / 2 - 0.05, yy + 0.03, -d / 2 - 0.95, { faces: 'yYZ' });
  g.mat('paint', shadeHex(body, 0.85)); g.box(-w / 2, 0, -d / 2 - 1.36, w / 2, 2.75, -d / 2 - 1.3, { faces: 'ZY' });
  // the canopy: a pelmet across the front posts and a striped cloth back to the rear posts, price cards on the pelmet
  g.mat('paint', body); g.box(-w / 2 - 0.04, 2.3, 0.33, w / 2 + 0.04, 2.55, 0.42, { faces: 'xXyYzZ' });
  g.mat('paint', col[1]); g.box(-w / 2 - 0.04, 2.36, 0.42, w / 2 + 0.04, 2.39, 0.425, { faces: 'Z' }); g.box(-w / 2 - 0.04, 2.46, 0.42, w / 2 + 0.04, 2.49, 0.425, { faces: 'Z' });
  g.mat('stripe', body); g.sheet([-w / 2, 2.55, 0.38], [w / 2, 2.55, 0.38], [w / 2, 2.76, -1.7], [-w / 2, 2.76, -1.7], { nu: 2, nv: 2, sag: 0.05 });
  for (let i = 0; i < Math.round(w / 0.7); i++) hungCard(g, -w / 2 + 0.3 + i * 0.7, 2.3, 0.425);
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2 + 0.06], [-w / 2, 0, -d / 2 - 1.36, w / 2, 2.75, -d / 2 - 0.95]], tier: 's' };
});

// What a stall has out. p: { k (kind), w (stall width), v (variant 0..1) }
const CT = 0.92, SH = [0.93, 1.38, 1.83], SZ = -1.48;
defineProp('lots-market.goods', (g, p) => {
  const w = p.w || 3.2, r = new Rng(hashStr('mg' + p.k + w + p.v)), k = p.k, hw = w / 2 - 0.15;
  const xs = (n, a, b) => { const lo = a === undefined ? -hw : a, hi = b === undefined ? hw : b, o = []; for (let i = 0; i < n; i++) o.push(lo + (hi - lo) * (i + 0.5) / n); return o; };
  const nTop = Math.max(3, Math.round(w / 0.55)), nSh = Math.max(4, Math.round(w / 0.48));
  if (k === 'cups') {
    for (const x of xs(nTop)) { if (r.chance(0.55)) cup(g, x, CT, r.f(-0.12, 0.12), r.pick(GL), r.pick(GL)); else plateStack(g, x, CT, r.f(-0.1, 0.08), r.i(3, 6), r.pick(GL)); }
    for (const y of SH.slice(0, 2)) for (const x of xs(nSh)) cup(g, x, y + 0.03, SZ + 0.04, r.pick(GL), y < 1 ? r.pick(GL) : null);
    for (const x of xs(Math.max(3, nSh - 2))) plateStack(g, x, SH[2] + 0.03, SZ, r.i(4, 8), r.pick(GL));
  } else if (k === 'crocks') {
    for (const x of xs(nTop - 1)) crock(g, x, CT, r.f(-0.1, 0.06), r.f(0.16, 0.26), r.f(0.07, 0.11), r.pick(GL), r.chance(0.75) ? r.pick(GL) : null);
    for (const y of SH) for (const x of xs(Math.max(3, nSh - 2))) crock(g, x, y + 0.03, SZ, r.f(0.14, 0.3), r.f(0.07, 0.12), r.pick(GL), r.chance(0.6) ? r.pick(GL) : null);
  } else if (k === 'chairs') {
    drawChair(g, -w / 4, CT, -0.02, r.f(-0.4, 0.4), '#8a6240', 'rush');
    g.mat('wood', '#b98a5a'); for (let i = 0; i < 4; i++) g.box(w / 4 - 0.14 + i * 0.08, CT, -0.1 + (i % 2) * 0.08, w / 4 - 0.11 + i * 0.08, CT + 0.42, -0.07 + (i % 2) * 0.08, { faces: 'xXzZY' });
    for (let i = 0; i < 2; i++) drawChair(g, (i - 0.5) * w * 0.45, 2.7, -1.5, 0, ['#6b4a2f', '#9a6a3a', '#5a3a26'][(p.v + i) % 3], i ? 'rush' : 'wood', true);
    for (const x of xs(3)) { g.mat('wood', mixHex('#8a6240', '#c9a06a', r.next())); g.box(x - 0.15, SH[0] + 0.03, SZ - 0.15, x + 0.15, SH[0] + 0.3, SZ + 0.15, { faces: 'xXYzZ' }); }
  } else if (k === 'cloth') {
    const cols = [r.pick(CLOTH), r.pick(CLOTH), r.pick(CLOTH), r.pick(CLOTH)];
    for (const x of xs(Math.max(2, nTop - 1))) folded(g, x, CT, r.f(-0.08, 0.05), 0.34, 0.28, r.i(3, 5), cols);
    for (const y of SH) for (const x of xs(Math.max(2, Math.round(w / 0.85)))) bolt(g, x, y + 0.03, SZ, 0.72, r.pick(CLOTH));
  } else if (k === 'lamps') {
    for (const x of xs(nTop)) { if (r.chance(0.5)) handLamp(g, x, CT, r.f(-0.12, 0.1), r.pick(['#b08a45', '#3c4148', '#2f6f73', '#8a2f3c'])); else lampHead(g, x, CT, r.f(-0.1, 0.08), r.pick(['#7a6a58', '#2f4a44', '#8a2f3c']), r.pick(['#f4e6c8', '#f0b850', '#e0909a', '#9fd8b0'])); }
    for (const y of SH) for (const x of xs(Math.max(3, nSh - 1))) handLamp(g, x, y + 0.03, SZ, r.pick(['#b08a45', '#3c4148', '#2f6f73', '#c9552e']));
  } else if (k === 'books') {
    bookRun(g, -hw, -0.05, CT, -0.05, r, 0.24); g.mat('paper', '#e9dcc0'); g.box(0.1, CT, -0.18, hw, CT + 0.06, 0.12, { faces: 'xXYzZ' });
    for (const y of SH) bookRun(g, -w / 2 + 0.1, w / 2 - 0.1, y + 0.03, SZ, r, 0.32);
  } else if (k === 'toys') {
    for (const x of xs(nTop)) { const t = r.i(0, 2); if (t === 0) ball(g, x, CT, r.f(-0.1, 0.08), 0.08, r.pick(CLOTH)); else if (t === 1) blocks(g, x, CT, 0, r); else { g.mat('paint', r.pick(CLOTH)); g.box(x - 0.1, CT, -0.1, x + 0.1, CT + 0.12, 0.1, { faces: 'xXYzZ' }); } }
    for (const x of xs(Math.max(2, Math.round(w / 0.75)))) kite(g, x, 1.65, SZ - 0.18, 0.3, r.pick(CLOTH), r.pick(CLOTH));
    for (const x of xs(nSh)) ball(g, x, SH[0] + 0.03, SZ, 0.07, r.pick(CLOTH));
  } else if (k === 'tools') {
    g.mat('wood', '#5a3a26'); g.box(-hw, CT, -0.25, hw, CT + 0.012, 0.25, { faces: 'Y' });
    for (const x of xs(nTop)) tool(g, x, CT + 0.012, r.f(-0.15, 0.05), r.i(0, 2));
    for (const x of xs(Math.max(3, nSh - 2))) tool(g, x, SH[0] + 0.03, SZ, r.i(0, 2));
    g.mat('paint', '#2f4a3a'); g.box(-w / 2 + 0.1, 1.9, -1.69, w / 2 - 0.1, 2.5, -1.67, { faces: 'Z' });
    g.mat('cast', '#b9b6ae'); for (const x of xs(6, -w / 2 + 0.3, w / 2 - 0.3)) g.box(x - 0.015, 2.0, -1.665, x + 0.015, 2.35, -1.655, { faces: 'Z' });
  } else if (k === 'shoes') {
    for (const x of xs(Math.max(3, nTop - 1))) shoes(g, x, CT, r.f(-0.08, 0.05), r.pick(CLOTH), r.f(0.6, 1.1));
    for (const y of SH) for (const x of xs(Math.max(3, nSh - 1))) shoes(g, x, y + 0.03, SZ, r.pick(['#3a2a20', '#8a2f3c', '#26306b', '#6b7a3a', '#c9a46a']), r.f(0.55, 1));
  } else if (k === 'jars') {
    for (const x of xs(nTop + 1)) jar(g, x, CT, r.f(-0.12, 0.1), r.pick(['#c9552e', '#6b7a3a', '#d6a640', '#8a2f3c', '#e8c26a', '#3a5a2a']), r.pick(['#e9dcc0', '#d4878a', '#2f6f73']));
    for (const y of SH) for (const x of xs(nSh)) jar(g, x, y + 0.03, SZ, r.pick(['#c9552e', '#6b7a3a', '#d6a640', '#8a2f3c', '#e8c26a']), r.pick(['#e9dcc0', '#d4878a', '#2f6f73']));
  } else if (k === 'plants') {
    for (const x of xs(nTop)) potPlant(g, x, CT, r.f(-0.1, 0.08), r.pick(['#a3563a', '#c9552e', '#d9c7a6', '#2f6f73']), r.f(0.18, 0.3));
    for (const y of SH.slice(0, 2)) for (const x of xs(Math.max(3, nSh - 1))) potPlant(g, x, y + 0.03, SZ, r.pick(['#a3563a', '#c9552e', '#d9c7a6']), r.f(0.16, 0.26));
    g.mat('cast', '#3c4148'); g.box(-w / 2 + 0.15, 2.2, -1.62, w / 2 - 0.15, 2.24, -1.34, { faces: 'xXYzZ' });
    g.mat('diffuser', '#ffe0f0', { emissive: 2.2, lamp: true }); g.box(-w / 2 + 0.2, 2.19, -1.58, w / 2 - 0.2, 2.2, -1.38, { faces: 'y' });
  }
  // the top of the back board: what the stall hangs up, from a rail at 2.45
  g.mat('cast', '#2a2622'); g.box(-w / 2 + 0.05, 2.43, -1.6, w / 2 - 0.05, 2.45, -1.58, { faces: 'yYZ' });
  const hx = xs(Math.max(3, Math.round(w / 0.6)));
  for (let i = 0; i < hx.length; i++) {
    const x = hx[i], c = r.pick(CLOTH);
    if (k === 'cups') cup(g, x, 2.15, -1.55, r.pick(GL), null);
    else if (k === 'crocks' && i % 2 === 0) { g.mat('cane', '#b08d5e'); g.lathe(x, -1.5, [[0.05, 1.98], [0.16, 2.12], [0.17, 2.15]], { segs: 7, capTop: false }); g.mat('cane', '#8a6a44'); g.box(x - 0.005, 2.15, -1.505, x + 0.005, 2.44, -1.495, { faces: 'xX' }); }
    else if (k === 'cloth' || k === 'shoes' && i % 2) { g.mat(r.chance(0.5) ? 'weave' : 'motif', c); g.sheet([x - 0.2, 2.42, -1.56], [x + 0.2, 2.42, -1.56], [x + 0.2, 1.95, -1.54], [x - 0.2, 1.95, -1.54], { nu: 1, nv: 2, ripple: 0.01, rippleN: 2 }); }
    else if (k === 'lamps') { g.mat('paper', c, { emissive: 0.5, lamp: true }); g.lathe(x, -1.45, [[0.06, 2.1], [0.15, 2.18], [0.15, 2.3], [0.06, 2.36]], { segs: 7, capTop: false, capBottom: false }); }
    else if (k === 'books' && i % 2 === 0) { g.mat('paper', mixHex('#efe4c8', c, 0.15)); g.box(x - 0.22, 1.98, -1.57, x + 0.22, 2.42, -1.56, { faces: 'Z' }); g.mat('paint', c); g.box(x - 0.18, 2.1, -1.555, x + 0.1, 2.3, -1.55, { faces: 'Z' }); }
    else if (k === 'toys' && i % 2 === 0) kite(g, x, 1.98, -1.55, 0.3, c, r.pick(CLOTH));
    else if (k === 'jars' || k === 'plants') { g.mat('leafB', '#d8e8b0', { sway: 0.3 }); g.card(x, 2.05, -1.5, 0.2, 0.38, 0.4); g.mat('weave', '#c8402e'); g.box(x - 0.03, 2.38, -1.53, x + 0.03, 2.44, -1.49, { faces: 'xXzZ' }); }
    else if (k === 'shoes') shoes(g, x, 2.2, -1.55, c, 0.8);
  }
  // the cards: a few flat on the counter, one hanging from each shelf's edge every half metre
  for (let i = 0; i < Math.round(w * 1.0); i++) card(g, r.f(-hw, hw), CT + (k === 'tools' ? 0.012 : 0), r.f(0.18, 0.3), r.f(-0.4, 0.4));
  for (const y of SH) for (const x of xs(Math.round(w / 0.9))) hungCard(g, x + r.f(-0.1, 0.1), y + 0.03, SZ + 0.18);
  return { cast: false };
});

// The side walls' racks: chairs hung on a peg rail, coats on hooks between them, crates on a low shelf. p: { w, v }
defineProp('lots-market.wallrack', (g, p) => {
  const w = p.w || 3, r = new Rng(hashStr('wr' + w + p.v));
  g.mat('wood', '#5a3a26'); g.box(-w / 2, 2.15, -0.06, w / 2, 2.25, 0.0, { faces: 'yYZ' });
  for (let x = -w / 2 + 0.35, i = 0; x < w / 2 - 0.2; x += 0.7, i++) {
    if ((i + p.v) % 3 === 2) { drawCoat(g, x, 2.16, 0.14, r.pick(CLOTH), r.pick(['#e8c26a', '#c8402e', '#e9e1cf'])); hungCard(g, x + 0.17, 1.6, 0.21); }
    else { drawChair(g, x, 2.66, 0.25, 0, r.pick(['#6b4a2f', '#8a6240', '#5a3a26', '#9a6a3a', '#2f6f73', '#8a2f3c']), r.chance(0.5) ? 'rush' : 'wood', true); hungCard(g, x + 0.1, 2.12, 0.46); }
  }
  g.mat('wood', '#6b4a2f'); g.box(-w / 2 + 0.05, 0.32, -0.02, w / 2 - 0.05, 0.36, 0.4, { faces: 'yYzZ' });
  for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.08) - 0.03, 0, -0.02, sx * (w / 2 - 0.08) + 0.03, 0.32, 0.4, { faces: 'xXzZ' });
  for (let x = -w / 2 + 0.4; x < w / 2 - 0.3; x += 0.62) { g.mat('wood', r.pick(['#a8794f', '#8a6240', '#b98a5a'])); g.box(x - 0.26, 0.36, 0.0, x + 0.26, 0.56, 0.38, { faces: 'xXzZY' }); g.mat('glaze', r.pick(GL)); g.box(x - 0.2, 0.5, 0.06, x + 0.2, 0.58, 0.32, { faces: 'xXYzZ' }); hungCard(g, x, 0.55, 0.381); }
  return { solid: [[-w / 2, 0, -0.06, w / 2, 0.6, 0.42]], tier: 's', cast: false };
});

// A wall shelf of lidded cups for the tea stand. p: { w }
defineProp('lots-market.cupshelf', (g, p) => {
  const w = p.w || 1.2;
  g.mat('wood', '#6b4a2f'); for (const y of [1.2, 1.55]) g.box(-w / 2, y - 0.03, -0.14, w / 2, y, 0.12, { faces: 'yYZxX' });
  const n = Math.round(w / 0.12);
  for (const y of [1.2, 1.55]) for (let i = 0; i < n; i++) cup(g, -w / 2 + 0.06 + i * (w - 0.12) / (n - 1), y, 0, GL[(i * 3 + (y > 1.3 ? 1 : 0)) % GL.length], GL[(i * 5 + 2) % GL.length]);
  return { cast: false };
});

// The weigher's balance: a beam on a brass pillar, two pans, a row of weights. Reads mass in any weight. p: {}
defineProp('lots-market.balance', (g) => {
  g.mat('wood', '#4a3020'); g.box(-0.36, 0, -0.18, 0.36, 0.06, 0.18, { bevel: 0.012 });
  g.mat('cast', '#b08a45', { rough: -0.25 }); g.lathe(0, 0, [[0.07, 0.06], [0.05, 0.1], [0.025, 0.12], [0.022, 0.62], [0.04, 0.64], [0.03, 0.68]], { segs: 10 });
  g.box(-0.34, 0.63, -0.012, 0.34, 0.655, 0.012, { bevel: 0.004 });
  g.mat('cast', '#c9a45c', { rough: -0.3 }); g.box(-0.006, 0.66, -0.004, 0.006, 0.78, 0.004);
  for (const sx of [-1, 1]) {
    g.mat('cast', '#9a7a3a'); for (const a of [0, 2.1, 4.2]) g.tube([[sx * 0.32, 0.64, 0], [sx * 0.32 + Math.cos(a) * 0.12, 0.22, Math.sin(a) * 0.12]], 0.003, { segs: 3, caps: false });
    g.mat('cast', '#c9a45c', { rough: -0.3 }); g.lathe(sx * 0.32, 0, [[0, 0.2], [0.13, 0.215], [0.14, 0.23]], { segs: 14 });
  }
  g.mat('cast', '#b08a45', { rough: -0.25 }); for (let i = 0; i < 4; i++) g.lathe(-0.32 + (i - 1.5) * 0.04, 0, [[0.018, 0.23], [0.018, 0.27 - i * 0.008], [0, 0.285 - i * 0.008]], { segs: 8 });
  g.mat('glaze', '#2f6f73'); g.lathe(0.32, 0, [[0, 0.23], [0.06, 0.23], [0.07, 0.29], [0.055, 0.33]], { segs: 10 });
  g.mat('paper', CARD); g.box(0.26, 0.24, 0.1, 0.32, 0.243, 0.14);
  return { cast: false };
});

// The tea counter's urn: a tall lidded steel urn with a tap and a drip tray. p: {}
defineProp('lots-market.urn', (g) => {
  g.mat('brushed', '#c8ccc8', { rough: -0.3 }); g.lathe(0, 0, [[0, 0], [0.17, 0], [0.19, 0.04], [0.19, 0.5], [0.17, 0.54], [0.05, 0.58], [0.05, 0.62], [0, 0.63]], { segs: 14 });
  g.mat('cast', '#2a2622'); g.cyl(0, 0.62, 0, 0.03, 0.04, { segs: 8 });
  g.mat('brushed', '#9a9e9c'); g.tube([[0, 0.12, 0.19], [0, 0.12, 0.27], [0, 0.08, 0.29]], 0.014, { segs: 6 });
  g.mat('cast', '#2a2622'); g.box(-0.09, 0, 0.18, 0.09, 0.02, 0.34, { bevel: 0.006 });
  g.mat('diffuser', '#ff9a50', { emissive: 2 }); g.ball(0.1, 0.35, 0.18, 0.012, 0.012, 0.012, { segs: 6, rings: 4 });
  return { posts: [[0, 0, 0.2, 0, 0.63]], cast: true };
});
