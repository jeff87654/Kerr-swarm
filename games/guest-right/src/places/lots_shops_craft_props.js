// Props for the craft shops of the generated city (lots_shops_craft.js). Every one is drawn at the origin with its front toward +z,
// cached per distinct parameter set, and stamped into thousands of blocks, so parameters are kept few (a trade, a variant, a width).
// A whole shop has 25,000 triangles to spend, so these are drawn lean: no bevels on small things, only the faces anyone can see,
// six- to eight-sided turnings, and the detail put where the eye goes (colour, a tag, a mend) rather than into roundness.
import { defineProp } from '../world/props.js';
import { Rng, hashStr, shadeHex, mixHex, hsl } from '../core/util.js';
import { drawChair, drawTag, drawShears } from './craft_parts.js';

export const craftProps = true;

export const GLAZES = ['#2f6f73', '#a3563a', '#e9e1cf', '#3d6f8a', '#6b7a3a', '#8a5a3c', '#d6a640', '#33407a', '#c9552e', '#5b4060', '#d9c7a6', '#1d4a3a'];
export const CLOTH = ['#26306b', '#c8402e', '#d6a640', '#6c9a4c', '#e9e1cf', '#5b4060', '#2f6f8f', '#b5653a', '#d4878a', '#2a2622', '#8a2f3c', '#2f8a85'];
const LAMPWARM = ['#ff9440', '#ffae5c', '#ffc884', '#ffdcac', '#ffeed6', '#fff8f0'];
const FRONT = 'xXYZ';                 // the faces of a thing on a shelf that anybody sees

// ---------------------------------------------------------------------------------------------------------------
// drawing helpers shared by several props (all in the caller's local space)
// ---------------------------------------------------------------------------------------------------------------
// A lidded crock standing at (x, y, z). lid: a colour, undefined (a lighter glaze) or null (no lid). About seventy triangles.
export function drawCrock(g, x, y, z, h, r, gl, lid, band, segs) {
  const n = segs || 7;
  g.mat('glaze', gl, { rough: -0.15 });
  g.lathe(x, z, [[r * 0.72, y], [r, y + h * 0.28], [r * 0.96, y + h * 0.7], [r * 0.72, y + h * 0.93]], { segs: n, capBottom: false, capTop: lid === null });
  if (band) { g.mat('glaze', band); g.lathe(x, z, [[r * 1.01, y + h * 0.42], [r * 1.0, y + h * 0.54]], { segs: n, capBottom: false, capTop: false }); }
  if (lid !== null) { g.mat('glaze', lid || shadeHex(gl, 1.25), { rough: -0.15 }); g.lathe(x, z, [[r * 0.8, y + h * 0.9], [r * 0.3, y + h * 1.03], [0, y + h * 1.09]], { segs: n, capBottom: false, capTop: false }); }
}
// A hand lamp standing at (x, y, z): a painted body, a glass globe (lit or not) and a wire handle. About eighty triangles.
export function drawHandLamp(g, x, y, z, body, on, glow, k = 1) {
  g.mat('paint', body, { rough: -0.1 }); g.cyl(x, y, z, 0.048 * k, 0.1 * k, { segs: 6, capBottom: false });
  g.mat('cast', '#b08a45', { rough: -0.2 }); g.cyl(x, y + 0.1 * k, z, 0.04 * k, 0.012 * k, { segs: 6, capBottom: false });
  if (on) g.mat('diffuser', glow || '#ffd9a0', { emissive: 3.2 }); else g.mat('glaze', '#e6e0d0', { rough: -0.35 });
  g.ball(x, y + 0.15 * k, z, 0.037 * k, 0.045 * k, 0.037 * k, { segs: 6, rings: 4 });
  g.mat('cast', '#3a3530'); g.tube([[x - 0.026 * k, y + 0.19 * k, z], [x, y + 0.24 * k, z], [x + 0.026 * k, y + 0.19 * k, z]], 0.0035, { segs: 3, caps: false });
}
// A heliox flute standing along +y from the origin, keys on the +z side. About seventy triangles.
export function drawFluteLo(g, len, wood, metal) {
  const r = 0.0165;
  g.mat('wood', wood || '#6b3f22', { rough: -0.15 }); g.cyl(0, 0, 0, r, len * 0.78, { segs: 6, capBottom: false, capTop: false });
  g.mat('cast', '#cfcac0', { rough: -0.25 }); g.cyl(0, len * 0.78, 0, r * 0.98, len * 0.22, { segs: 6, capBottom: false });
  g.mat('cast', metal || '#c9b27a', { rough: -0.2 }); g.cyl(0, len * 0.4 - 0.012, 0, r * 1.3, 0.024, { segs: 6, capBottom: false });
  for (let i = 0; i < 6; i++) { const y = len * (0.12 + 0.55 * i / 5); g.box(-0.011, y - 0.013, r * 0.95, 0.011, y + 0.013, r * 1.4, { faces: 'Z' }); }
  g.box(-0.011, len * 0.9 - 0.02, r * 0.8, 0.011, len * 0.9 + 0.02, r * 1.3, { faces: 'Z' });
  g.mat('plain', '#140e0a'); g.box(-0.005, len * 0.9 - 0.007, r * 1.31, 0.005, len * 0.9 + 0.007, r * 1.33, { faces: 'Z' });
}
// Folded cloth piled on a shelf: (x, y) the front-left of the pile at the front edge zf, w across, d deep. Returns the top.
function drawPileLo(g, x, y, zf, w, d, cols, r) {
  let yy = y;
  for (let i = 0; i < cols.length; i++) {
    const t = r.f(0.026, 0.045), dx = r.f(-0.015, 0.015);
    g.mat(['weave', 'knit', 'stripe', 'motif', 'weave'][r.i(0, 4)], cols[i]);
    g.box(x + dx, yy, zf - d + r.f(0, 0.02), x + w + dx, yy + t, zf + r.f(-0.012, 0.004), { faces: FRONT });
    yy += t;
  }
  return yy;
}
// A row of books on a shelf from x0 to x1, spines toward +z, backs at zb.
function drawBooksLo(g, x0, x1, y, zb, depth, hmax, r) {
  const cols = ['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f', '#5b4060', '#a0522d', '#2b3a4a', '#6e2f3f', '#c9a96a', '#40504a', '#8c3b26', '#1f3b4d'];
  let a = x0 + 0.01;
  while (a < x1 - 0.03) {
    if (r.chance(0.05)) { a += r.f(0.04, 0.1); continue; }
    const t = r.f(0.025, 0.055), h = hmax * r.f(0.62, 1), d = depth * r.f(0.75, 1); if (a + t > x1) break;
    const c = mixHex(r.pick(cols), r.chance(0.5) ? '#2a2018' : '#e8dcc4', r.f(0, 0.22));
    g.mat('paper', c, { rough: r.f(-0.1, 0.15) }); g.box(a, y, zb, a + t, y + h, zb + d, { faces: FRONT });
    if (r.chance(0.5)) { g.mat('paper', r.chance(0.6) ? '#d8b860' : shadeHex(c, 1.6), { rough: -0.2 }); g.box(a + 0.003, y + h * 0.74, zb + d, a + t - 0.003, y + h * 0.8, zb + d + 0.002, { faces: 'Z' }); }
    a += t + 0.002;
  }
}
// A plain shelving carcass, w wide, h tall, d deep, n shelves; returns the top of each shelf board.
function carcass(g, w, h, d, n, wood, mat) {
  const M = mat || 'wood';
  g.mat(M, wood, { rough: -0.05 });
  g.box(-w / 2, 0, -d / 2, -w / 2 + 0.035, h, d / 2, { faces: 'xXYZ' }); g.box(w / 2 - 0.035, 0, -d / 2, w / 2, h, d / 2, { faces: 'xXYZ' });
  g.box(-w / 2, h - 0.035, -d / 2, w / 2, h, d / 2 + 0.02, { faces: 'yYZ' });
  const ys = [];
  for (let i = 0; i < n; i++) { const y = 0.06 + i * (h - 0.1) / n; g.box(-w / 2 + 0.035, y, -d / 2 + 0.01, w / 2 - 0.035, y + 0.025, d / 2, { faces: 'yYZ' }); ys.push(y + 0.025); }
  g.box(-w / 2 + 0.035, 0, d / 2 - 0.03, w / 2 - 0.035, 0.06, d / 2, { faces: 'Z' });
  g.mat(M === 'paint' ? 'paint' : 'wood', M === 'paint' ? '#f4ead2' : shadeHex(wood, 0.72)); g.box(-w / 2 + 0.035, 0.06, -d / 2, w / 2 - 0.035, h - 0.035, -d / 2 + 0.012, { faces: 'Z' });
  return ys;
}
// A paper tag, cheap: a pale card on a thread.
function tagLo(g, x, y, z, eye) {
  g.mat('paper', '#efe4c8'); g.box(x - 0.022, y - 0.07, z, x + 0.022, y - 0.012, z + 0.003, { faces: 'Z' });
  g.mat('cast', eye || '#b08a45'); g.box(x - 0.005, y - 0.022, z + 0.003, x + 0.005, y - 0.012, z + 0.004, { faces: 'Z' });
}

// ---------------------------------------------------------------------------------------------------------------
// The goods wall: one shelving unit (1.3 m by 2.1 m) with the trade's goods on it. p: { t (trade), v (variant 0..2), w }
// Each about 1,500 triangles.
// ---------------------------------------------------------------------------------------------------------------
defineProp('shops-craft.goods', (g, p) => {
  const t = p.t, v = p.v || 0, w = p.w || 1.3, h = 2.1, d = 0.42, r = new Rng(hashStr('goods' + t + v + w));
  const wood = t === 'toys' ? ['#2f8a85', '#e8705a', '#3b4f8f'][v % 3] : ['#5a3d28', '#6f5137', '#4a3222'][v % 3];
  const ys = carcass(g, w, h, d, 5, wood, t === 'toys' ? 'paint' : 'wood');
  const x0 = -w / 2 + 0.06, x1 = w / 2 - 0.06, zb = -d / 2 + 0.02, zf = d / 2 - 0.02;
  const gap = (i) => (i < ys.length - 1 ? ys[i + 1] - 0.025 : h - 0.035) - ys[i];
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i], room = gap(i);
    if (t === 'mender' || t === 'dyer') {
      // folded cloth by colour: across a row by hue for the dyer, darker up the unit for the mender
      for (let k = 0; k < 3; k++) {
        const n = Math.min(Math.floor(room / 0.05), r.i(4, 7)), cols = [];
        const hue = t === 'dyer' ? ((v * 0.33 + (i * 3 + k) / 15) % 1) : ((v * 0.21 + i / 5 + k * 0.03) % 1);
        for (let j = 0; j < n; j++) cols.push(hsl((hue + r.f(-0.03, 0.03) + 1) % 1, t === 'dyer' ? 0.62 : 0.45 + r.f(-0.1, 0.12), t === 'dyer' ? 0.62 - j * 0.05 : 0.32 + r.f(0, 0.3)));
        drawPileLo(g, x0 + k * (x1 - x0) / 3 + 0.02, y, zf - 0.02, (x1 - x0) / 3 - 0.05, d - 0.08, cols, r);
      }
      if (t === 'mender' && i === 4) for (let k = 0; k < 3; k++) tagLo(g, x0 + 0.2 + k * 0.4, y + 0.2, zf, CLOTH[k * 3]);
    } else if (t === 'tailor') {
      // bolts lying along the shelf, ends to the room
      const n = Math.max(2, Math.floor((x1 - x0) / 0.18));
      for (let k = 0; k < n; k++) {
        if (i === 0 && k % 3 === 2) continue;
        const rr = Math.min(room * 0.42, r.f(0.06, 0.08)), x = x0 + (k + 0.5) * (x1 - x0) / n, c = r.pick(CLOTH);
        g.mat(r.chance(0.3) ? 'stripe' : r.chance(0.3) ? 'motif' : 'weave', c); g.push(); g.move(x, y + rr, 0); g.rotX(Math.PI / 2); g.cyl(0, -d / 2 + 0.03, 0, rr, d - 0.06, { segs: 7, capBottom: false }); g.pop();
        g.mat('paper', '#8a6a4a'); g.box(x - 0.016, y + rr - 0.016, d / 2 - 0.03, x + 0.016, y + rr + 0.016, d / 2 - 0.028, { faces: 'Z' });
      }
    } else if (t === 'chairs') {
      if (i % 2 === 0) {
        // bundles of spindles and legs, tied with red thread
        for (let k = 0; k < 3; k++) { const cx = x0 + 0.18 + k * (x1 - x0 - 0.36) / 2; g.mat('wood', mixHex(wood, '#d9b98a', 0.3 + k * 0.2)); for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2, rr = 0.035; g.tube([[cx - 0.14, y + 0.045 + Math.sin(a) * rr * 0.5, zb + 0.15 + Math.cos(a) * rr], [cx + 0.14, y + 0.045 + Math.sin(a) * rr * 0.5, zb + 0.15 + Math.cos(a) * rr]], 0.012, { segs: 4, caps: false }); } g.mat('weave', '#c8402e'); g.box(cx - 0.01, y + 0.01, zb + 0.1, cx + 0.01, y + 0.08, zb + 0.2, { faces: 'YZ' }); }
      } else {
        let yy = y; for (let k = 0; k < Math.min(4, Math.floor(room / 0.05)); k++) { g.mat(k % 2 ? 'wood' : 'rush', k % 2 ? mixHex(wood, '#c9a06a', 0.5) : '#c9a35e'); g.box(x0 + 0.04 + r.f(-0.02, 0.02), yy, zb + 0.04, x0 + 0.46, yy + 0.04, zf - 0.04, { faces: FRONT }); yy += 0.045; }
        drawCrock(g, x1 - 0.2, y, 0, 0.2, 0.08, '#8a5a3c', null);
        g.mat('wood', '#c9a06a'); for (let j = 0; j < 7; j++) g.tube([[x1 - 0.2 + r.f(-0.04, 0.04), y + 0.12, r.f(-0.04, 0.04)], [x1 - 0.2 + r.f(-0.07, 0.07), y + Math.min(room - 0.02, 0.42), r.f(-0.06, 0.06)]], 0.007, { segs: 3, caps: false });
        g.mat('glaze', '#6b4a2f'); g.cyl(x0 + 0.7, y, 0.02, 0.06, 0.11, { segs: 7, capBottom: false });
      }
    } else if (t === 'lamps') {
      if (i === 0) { for (let k = 0; k < 3; k++) { const cx = x0 + 0.2 + k * 0.4; g.mat('wood', '#6b4a2f'); g.box(cx - 0.17, y, -0.15, cx + 0.17, y + 0.14, 0.15, { faces: FRONT }); g.mat('cast', '#b08a45'); for (let j = 0; j < 3; j++) g.box(cx - 0.12 + j * 0.1, y + 0.14, -0.05, cx - 0.08 + j * 0.1, y + 0.17, 0.05, { faces: 'YZ' }); } }
      else {
        // four lamps a shelf: a painted body, a glass, and every other one lit
        for (let k = 0; k < 4; k++) {
          const x = x0 + (k + 0.5) * (x1 - x0) / 4, z = 0.02 + (k % 2) * 0.06, on = (i + k + v) % 3 === 0;
          g.mat('paint', r.pick(['#2f6f73', '#8a2f3c', '#d6a640', '#33407a', '#3a3530', '#6b7a3a', '#c9552e']), { rough: -0.1 }); g.cyl(x, y, z, 0.05, 0.1, { segs: 5, capBottom: false });
          if (on) g.mat('diffuser', LAMPWARM[(k + i) % 6], { emissive: 3 }); else g.mat('glaze', '#e6e0d0', { rough: -0.35 });
          g.ball(x, y + 0.15, z, 0.04, 0.05, 0.04, { segs: 5, rings: 3 });
          if (k % 2 === 1) tagLo(g, x + 0.06, y + 0.1, z + 0.05, '#b08a45');
        }
      }
    } else if (t === 'crocks') {
      const n = Math.max(3, Math.floor((x1 - x0) / 0.28));
      for (let k = 0; k < n; k++) { const hh = Math.min(room - 0.05, r.f(0.17, 0.3)), rr = Math.min(0.11, hh * 0.45), x = x0 + (k + 0.5) * (x1 - x0) / n; drawCrock(g, x, y, r.f(-0.04, 0.04), hh, rr, r.pick(GLAZES), r.chance(0.25) ? r.pick(GLAZES) : undefined, 0, 6); if (k === 1) tagLo(g, x + rr * 0.6, y + hh * 0.8, rr + 0.03, '#b08a45'); }
    } else if (t === 'books') {
      drawBooksLo(g, x0, x1, y, zb, 0.26, Math.min(0.32, room - 0.03), r);
    } else if (t === 'toys') {
      const B = ['#2f8a85', '#e8705a', '#e9b23c', '#7cab4e', '#3b4f8f', '#8a4a6a'], T = ['#e8705a', '#e9b23c', '#2f8a85', '#3b4f8f', '#f4ead2', '#7cab4e'];
      if (i !== 3) {
        // bright bins, toys heaped over the rim
        for (let k = 0; k < 3; k++) {
          const cx = x0 + 0.2 + k * (x1 - x0 - 0.4) / 2, c = B[(k + i + v) % 6], bh = Math.min(room - 0.1, 0.2);
          g.mat('paint', c, { rough: -0.1 }); g.box(cx - 0.18, y, -0.15, cx + 0.18, y + bh, 0.16, { faces: FRONT });
          g.mat('paper', '#f4ead2'); g.box(cx - 0.06, y + bh * 0.4, 0.16, cx + 0.06, y + bh * 0.75, 0.162, { faces: 'Z' });
          for (let j = 0; j < 3; j++) { g.mat(j === 1 ? 'weave' : 'paint', T[(j + k + i) % 6]); const bx = cx - 0.1 + j * 0.1 + r.f(-0.02, 0.02), bz = r.f(-0.06, 0.08); if (j === 1) g.ball(bx, y + bh + 0.02, bz, 0.055, 0.05, 0.055, { segs: 5, rings: 3 }); else g.box(bx - 0.035, y + bh - 0.01, bz - 0.035, bx + 0.035, y + bh + 0.05, bz + 0.035, { faces: 'xXYZ' }); }
        }
      } else {
        for (let k = 0; k < 5; k++) {
          const x = x0 + 0.13 + k * (x1 - x0 - 0.26) / 4, c = T[(k + v) % 6];
          if (k % 2 === 0) { g.mat('paint', c, { rough: -0.05 }); g.box(x - 0.09, y, -0.05, x + 0.09, y + 0.11, 0.05, { faces: FRONT }); g.mat('plain', '#26323a'); g.box(x - 0.075, y + 0.05, 0.05, x + 0.075, y + 0.085, 0.052, { faces: 'Z' }); g.mat('paint', '#f4ead2'); g.box(x - 0.095, y + 0.105, -0.055, x + 0.095, y + 0.12, 0.055, { faces: 'xXYZ' }); }
          else { g.mat('paint', c); g.lathe(x, 0, [[0.015, y + 0.012], [0.06, y + 0.04], [0.062, y + 0.08], [0, y + 0.09]], { segs: 7, capBottom: false }); g.mat('wood', '#8a6240'); g.box(x - 0.007, y + 0.09, -0.007, x + 0.007, y + 0.14, 0.007, { faces: 'xXYZ' }); }
          if (k === 2) tagLo(g, x + 0.06, y + 0.13, 0.07, c);
        }
      }
    } else if (t === 'second') {
      // a back row of tall things and a front row of small ones, a card on some of them
      let x = x0 + 0.02; const hm = room - 0.04;
      while (x < x1 - 0.16) {
        const k = r.i(0, 4), c = r.pick(GLAZES);
        if (k === 0 && hm > 0.26) { const hh = Math.min(hm, r.f(0.24, 0.34)); drawCrock(g, x + 0.1, y, -0.07, hh, hh * 0.37, c, null, 0, 6); x += 0.22; }
        else if (k === 1 && hm > 0.3) { g.mat('paint', r.pick(['#2f6f73', '#8a2f3c', '#33407a', '#d6a640'])); g.cyl(x + 0.08, y, -0.06, 0.065, 0.13, { segs: 5, capBottom: false }); g.mat('glaze', '#e6e0d0', { rough: -0.35 }); g.ball(x + 0.08, y + 0.2, -0.06, 0.05, 0.06, 0.05, { segs: 5, rings: 3 }); x += 0.18; }
        else if (k === 2) { const n = r.i(4, 6), bh = Math.min(hm, 0.3); for (let j = 0; j < n; j++) { g.mat('paper', r.pick(['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f', '#5b4060', '#c9a96a']), { rough: 0.1 }); g.box(x + j * 0.042, y, -0.17, x + j * 0.042 + 0.038, y + bh * r.f(0.75, 1), 0.03, { faces: 'xXYZ' }); } x += n * 0.042 + 0.04; }
        else if (k === 3 && hm > 0.28) { g.mat('cast', r.pick(['#b08a45', '#7a7670', '#3a3530', '#8a5a3c'])); const hh = Math.min(hm, 0.3); g.lathe(x + 0.07, -0.06, [[0.06, y], [0.05, y + hh * 0.3], [0.025, y + hh * 0.75], [0.035, y + hh]], { segs: 6, capBottom: false }); x += 0.16; }
        else { g.mat('glaze', r.pick(GLAZES)); const hh = r.i(3, 6) * 0.019; g.cyl(x + 0.12, y, -0.04, 0.12, hh, { segs: 7, capBottom: false }); g.mat('glaze', r.pick(GLAZES)); g.box(x + 0.0, y + hh * 0.4, 0.08, x + 0.24, y + hh * 0.6, 0.082, { faces: 'Z' }); x += 0.26; }
        x += r.f(0.02, 0.05);
      }
      for (let xf = x0 + 0.12; xf < x1 - 0.1; xf += r.f(0.24, 0.34)) {
        const k = r.i(0, 2);
        if (k === 0) { g.mat('glaze', r.pick(GLAZES)); g.cyl(xf, y, 0.12, 0.038, 0.08, { segs: 5, capBottom: false }); }
        else if (k === 1) { g.mat('wood', r.pick(['#6b4428', '#8a5a34', '#c9a06a'])); g.box(xf - 0.06, y, 0.06, xf + 0.06, y + 0.07, 0.16, { faces: FRONT }); g.mat('cast', '#b08a45'); g.box(xf - 0.015, y + 0.03, 0.16, xf + 0.015, y + 0.045, 0.163, { faces: 'Z' }); }
        else { g.mat('weave', r.pick(CLOTH)); g.box(xf - 0.07, y, 0.04, xf + 0.07, y + 0.05, 0.17, { faces: FRONT }); }
        if (r.chance(0.5)) tagLo(g, xf + 0.03, y + 0.11, 0.17, r.pick(CLOTH));
      }
    } else if (t === 'sleeves') {
      // folded wing-sleeves, fins tucked, the colour of the hire stripe on the edge
      for (let k = 0; k < 2; k++) { const cx = x0 + 0.03 + k * (x1 - x0) / 2, cols = []; const n = Math.min(Math.floor(room / 0.06), 5); for (let j = 0; j < n; j++) cols.push(r.pick(['#26306b', '#2f6f8f', '#e9e1cf', '#d6a640', '#c8402e', '#3a3a44'])); const top = drawPileLo(g, cx, y, zf - 0.03, (x1 - x0) / 2 - 0.06, d - 0.1, cols, r); g.mat('weave', '#d6a640'); g.box(cx + 0.02, y, zf - 0.03, cx + 0.05, top, zf - 0.026, { faces: 'Z' }); }
      if (i === 4) for (let k = 0; k < 4; k++) drawHandLamp(g, x0 + 0.15 + k * 0.32, y, -0.08, '#33407a', false);
    } else if (t === 'kites') {
      const K = ['#c8402e', '#d6a640', '#2f6f73', '#26306b', '#e9e1cf', '#6c9a4c', '#5b4060'];
      if (i === 0 || i === 4) { for (let k = 0; k < 4; k++) { const x = x0 + 0.14 + k * (x1 - x0 - 0.28) / 3, rr = Math.min(0.09, (room - 0.02) / 2); g.push(); g.move(x, y + rr, 0); g.rotZ(Math.PI / 2); g.mat('wood', '#9a7048'); g.cyl(0, -0.06, 0, rr, 0.016, { segs: 8 }); g.cyl(0, 0.044, 0, rr, 0.016, { segs: 8 }); g.mat('weave', K[(k + i + v) % 7]); g.cyl(0, -0.044, 0, rr * 0.75, 0.088, { segs: 8, capBottom: false, capTop: false }); g.pop(); } }
      else if (i === 1 || i === 3) {
        // kites standing in the shelf, leaning back, spars showing
        for (let k = 0; k < 3; k++) {
          const cx = x0 + 0.2 + k * (x1 - x0 - 0.4) / 2, a = K[(k + i + v) % 7], b = K[(k + i + v + 3) % 7], hh = Math.min(room - 0.04, 0.36);
          g.push(); g.move(cx, y, -0.05); g.rotX(-0.18);
          const T = [0, hh, 0], L = [-0.17, hh * 0.62, 0], R = [0.17, hh * 0.62, 0], B = [0, 0.0, 0], M = [0, hh * 0.62, 0];
          g.mat('weave', a); g.quad(L, M, T, T); g.quad(M, R, B, B);
          g.mat('weave', b); g.quad(M, R, T, T); g.quad(L, B, M, M);
          g.mat('wood', '#8a6240'); g.box(-0.004, 0, 0.002, 0.004, hh, 0.006, { faces: 'Z' }); g.box(-0.17, hh * 0.62 - 0.004, 0.002, 0.17, hh * 0.62 + 0.004, 0.006, { faces: 'Z' });
          g.pop();
        }
      } else {
        // tails rolled up, and a crock of spars
        for (let k = 0; k < 5; k++) { g.mat('weave', K[(k + v) % 7]); g.push(); g.move(x0 + 0.1 + k * 0.12, y + 0.05, 0.05); g.rotZ(Math.PI / 2); g.cyl(0, -0.05, 0, 0.05, 0.1, { segs: 7 }); g.pop(); }
        drawCrock(g, x1 - 0.2, y, -0.02, 0.18, 0.08, '#8a5a3c', null);
        g.mat('wood', '#c9a06a'); for (let j = 0; j < 7; j++) g.tube([[x1 - 0.2 + r.f(-0.04, 0.04), y + 0.1, -0.02 + r.f(-0.04, 0.04)], [x1 - 0.2 + r.f(-0.09, 0.09), y + Math.min(room - 0.02, 0.5), -0.02 + r.f(-0.07, 0.07)]], 0.005, { segs: 3, caps: false });
      }
    } else if (t === 'flutes') {
      // long cases, one open on the middle shelf
      for (let k = 0; k < Math.min(3, Math.floor(room / 0.09)); k++) { const c = r.pick(['#2a2622', '#5a2e22', '#26306b', '#3a4a3a']); g.mat('weave', c); g.box(x0 + 0.02, y + k * 0.085, -0.12 + k * 0.02, x1 - 0.02, y + k * 0.085 + 0.08, 0.02 + k * 0.02, { faces: FRONT }); g.mat('cast', '#b08a45'); g.box(-0.04, y + k * 0.085 + 0.03, 0.02 + k * 0.02, 0.04, y + k * 0.085 + 0.05, 0.024 + k * 0.02, { faces: 'Z' }); }
    } else if (t === 'felt') {
      // rolls lying along the shelf
      const n = Math.max(2, Math.floor((x1 - x0) / 0.32));
      for (let k = 0; k < n; k++) { const rr = Math.min(room * 0.45, 0.14), x = x0 + (k + 0.5) * (x1 - x0) / n, c = r.pick(['#8a2f3c', '#d6a640', '#2f6f73', '#5b3a6e', '#6b7a3a', '#c9552e', '#3a3a44', '#d8c8a8']); g.push(); g.move(x, y + rr, 0); g.rotX(Math.PI / 2); g.mat('felt', c); g.cyl(0, -d / 2 + 0.03, 0, rr, d - 0.06, { segs: 8, capBottom: false, capTop: false }); g.mat('felt', shadeHex(c, 0.7)); g.cyl(0, d / 2 - 0.035, 0, rr, 0.004, { segs: 8, capBottom: false }); g.pop(); }
    }
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A wall of thread: spools on narrow shelves on a board, a rainbow across and light to dark down. Cheap: each spool is a front and a top.
defineProp('shops-craft.spools', (g, p) => {
  const w = p.w || 1.3, h = p.h || 1.15, cols = Math.max(6, Math.round(w / 0.085)), rows = Math.max(4, Math.round(h / 0.15)), r = new Rng(hashStr('sp' + w + h + (p.v || 0)));
  g.mat('wood', '#3a2a1e'); g.box(-w / 2 - 0.04, 0, -0.03, w / 2 + 0.04, h + 0.06, 0, { faces: 'xXYZ' });
  g.mat('wood', '#6b4a2f'); g.box(-w / 2 - 0.06, h + 0.06, -0.035, w / 2 + 0.06, h + 0.1, 0.04, { faces: 'yYZ' });
  const dx = w / cols, dy = h / rows;
  for (let j = 0; j < rows; j++) {
    const y = j * dy + 0.03;
    g.mat('wood', '#6b4a2f'); g.box(-w / 2, y - 0.012, 0, w / 2, y, 0.095, { faces: 'YZ' });
    for (let i = 0; i < cols; i++) {
      if (r.chance(0.04)) continue;
      const x = -w / 2 + (i + 0.5) * dx; let sat = 0.62 + r.f(-0.12, 0.12), li = 0.78 - j / rows * 0.55 + r.f(-0.04, 0.04); if (i >= cols - 2) { sat = 0.04; li = 0.9 - j / rows * 0.8; }
      const sh = Math.min(dy * 0.62, 0.085), sr = Math.min(dx * 0.4, 0.04);
      g.mat('knit', hsl(((i + r.f(-0.3, 0.3)) / cols * 0.92 + 0.98) % 1, sat, Math.max(0.12, Math.min(0.88, li))), { rough: -0.1 }); g.box(x - sr, y, 0.045 - sr, x + sr, y + sh, 0.045 + sr, { faces: 'xXZ' });
      g.mat('wood', '#c9a06a'); g.box(x - sr * 1.15, y + sh - 0.006, 0.045 - sr * 1.15, x + sr * 1.15, y + sh, 0.045 + sr * 1.15, { faces: 'YZ' });
    }
  }
  return { tier: 's', cast: false };
});

// A cabinet of small drawers with brass pulls and paper labels: the fronts only. p: { w, h, d, cols, rows, wood }
defineProp('shops-craft.drawers', (g, p) => {
  const w = p.w || 1.2, h = p.h || 1.0, d = p.d || 0.42, cols = p.cols || 6, rows = p.rows || 7, wood = p.wood || '#6b4428', r = new Rng(hashStr('dr' + w + h + cols + rows));
  g.mat('wood', wood, { rough: -0.05 }); g.box(-w / 2, 0.06, -d / 2, w / 2, h, d / 2 - 0.02, { faces: 'xXZ', aoBottom: 0.6 });
  g.mat('wood', shadeHex(wood, 0.7)); g.box(-w / 2 + 0.02, 0, -d / 2 + 0.03, w / 2 - 0.02, 0.06, d / 2 - 0.05, { faces: 'xXZ' });
  g.mat('wood', shadeHex(wood, 1.15)); g.box(-w / 2 - 0.02, h, -d / 2, w / 2 + 0.02, h + 0.03, d / 2 + 0.01, { faces: 'xXYZ' });
  const cw = (w - 0.06) / cols, rh = (h - 0.12) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = -w / 2 + 0.03 + i * cw, y0 = 0.09 + j * rh, out = r.chance(0.06) ? r.f(0.04, 0.1) : 0, zf = d / 2 - 0.005 + out;
    g.mat('wood', mixHex(wood, '#c9a06a', r.f(0, 0.25))); g.box(x0 + 0.006, y0 + 0.006, zf - 0.02, x0 + cw - 0.006, y0 + rh - 0.006, zf, { faces: out ? 'xXYZ' : 'Z' });
    g.mat('paper', '#efe4c8'); g.box(x0 + cw * 0.3, y0 + rh * 0.55, zf, x0 + cw * 0.7, y0 + rh * 0.8, zf + 0.002, { faces: 'Z' });
    g.mat('cast', '#b08a45', { rough: -0.2 }); g.box(x0 + cw / 2 - 0.008, y0 + rh * 0.26, zf, x0 + cw / 2 + 0.008, y0 + rh * 0.38, zf + 0.012, { faces: 'YZxX' });
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h + 0.03, d / 2]], tier: 's' };
});

// ---------------------------------------------------------------------------------------------------------------
// Signature fittings
// ---------------------------------------------------------------------------------------------------------------
// The test wall: a dark board of sockets, every lamp run for a week, the day count chalked under it. Warm at one end, white at the other.
defineProp('shops-craft.testwall', (g, p) => {
  const w = p.w || 1.8, h = p.h || 1.3, cols = Math.max(4, Math.round(w / 0.26)), rows = 4, r = new Rng(hashStr('tw' + w + (p.v || 0)));
  g.mat('slate', '#1c2120'); g.box(-w / 2, 0, -0.03, w / 2, h, 0, { faces: 'Z' });
  g.mat('wood', '#3a2a1e'); g.box(-w / 2 - 0.04, -0.04, -0.035, w / 2 + 0.04, 0, 0.03, { faces: 'yYZ' }); g.box(-w / 2 - 0.04, h, -0.035, w / 2 + 0.04, h + 0.05, 0.04, { faces: 'yYZ' });
  for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.04, 0, -0.035, sx * w / 2, h, 0.025, { faces: 'xXZ' });
  g.mat('cast', '#7a6a58'); g.tube([[-w / 2, h - 0.06, 0.03], [w / 2, h - 0.06, 0.03]], 0.012, { segs: 5, caps: false });
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = -w / 2 + (i + 0.5) * w / cols, y = h - 0.2 - j * (h - 0.25) / rows;
    g.mat('cast', '#b08a45', { rough: -0.2 }); g.box(x - 0.035, y - 0.035, 0, x + 0.035, y + 0.035, 0.012, { faces: 'xXyYZ' });
    const dead = r.chance(0.06);
    if (dead) g.mat('glaze', '#5a5650', { rough: -0.3 }); else g.mat('diffuser', LAMPWARM[Math.min(5, Math.floor(i / cols * 6))], { emissive: 2.2 + r.f(0, 0.8) });
    g.ball(x, y, 0.045, 0.032, 0.032, 0.032, { segs: 6, rings: 4, bottom: -0.2 });
    // the chalked days: up to seven strokes, the seventh struck through
    g.mat('plain', '#e6e1d4'); const n = dead ? 2 : r.i(1, 7);
    for (let k = 0; k < Math.min(n, 6); k++) g.box(x - 0.05 + k * 0.016, y - 0.085, 0.001, x - 0.046 + k * 0.016, y - 0.055, 0.002, { faces: 'Z' });
    if (n >= 7) g.box(x - 0.055, y - 0.072, 0.001, x + 0.05, y - 0.068, 0.002, { faces: 'Z' });
    if (dead) { g.mat('paper', '#c8402e'); g.box(x + 0.035, y - 0.02, 0.012, x + 0.07, y + 0.02, 0.014, { faces: 'Z' }); }
  }
  return { tier: 's', cast: false };
});

// A wall rack of long flutes standing in a cradle: lengths 1.0 to 1.3 m, every one tuned in this air. p: { w, v }
defineProp('shops-craft.fluterack', (g, p) => {
  const w = p.w || 1.2, r = new Rng(hashStr('fr' + w + (p.v || 0))), n = Math.max(4, Math.round(w / 0.15));
  g.mat('wood', '#4a3222'); g.box(-w / 2, 0, -0.04, w / 2, 1.5, -0.02, { faces: 'xXYZ' });
  g.mat('wood', '#6b4a2f'); g.box(-w / 2 - 0.02, 0.06, -0.04, w / 2 + 0.02, 0.14, 0.09, { faces: 'xXYZ' }); g.box(-w / 2 - 0.02, 1.16, -0.04, w / 2 + 0.02, 1.2, 0.07, { faces: 'xXyYZ' });
  g.mat('felt', '#8a2f3c'); g.box(-w / 2, 0.14, -0.035, w / 2, 0.15, 0.085, { faces: 'Y' });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n, len = r.f(1.0, 1.32);
    g.push(); g.move(x, 0.15, 0.03); g.rotZ(r.f(-0.03, 0.03)); g.rotY(r.f(-0.4, 0.4));
    drawFluteLo(g, len, r.pick(['#6b3f22', '#4a2a18', '#8a5a34', '#2a1c14']), r.pick(['#c9b27a', '#cfcac0']));
    g.pop();
    if (i % 3 === 1) tagLo(g, x + 0.02, 1.15, 0.075, '#b08a45');
  }
  return { tier: 's', cast: false };
});

// A flute standing upright in a turned wooden foot, for the window. p: { len, wood }
defineProp('shops-craft.flutestand', (g, p) => {
  const len = p.len || 1.2;
  g.mat('wood', '#3a2a1e', { rough: -0.1 }); g.lathe(0, 0, [[0.11, 0], [0.11, 0.02], [0.04, 0.06], [0.03, 0.14], [0, 0.14]], { segs: 8 });
  g.push(); g.move(0, 0.1, 0); drawFluteLo(g, len, p.wood || '#6b3f22'); g.pop();
  return { posts: [[0, 0, 0.1, 0, len]], tier: 's' };
});

// A cubby wall of felt rolls, ends to the room, each end showing its spiral. p: { v, w }
defineProp('shops-craft.feltcubby', (g, p) => {
  const w = p.w || 1.3, h = 2.1, d = 0.5, cols = 3, rows = 5, r = new Rng(hashStr('fc' + (p.v || 0) + w));
  const C = ['#8a2f3c', '#d6a640', '#2f6f73', '#5b3a6e', '#6b7a3a', '#c9552e', '#3a3a44', '#d8c8a8', '#26306b', '#a8412b'];
  g.mat('wood', '#5a3d28'); for (let i = 0; i <= cols; i++) { const x = -w / 2 + i * w / cols; g.box(x - 0.018, 0, -d / 2, x + 0.018, h, d / 2, { faces: 'xXZ' }); }
  for (let j = 0; j <= rows; j++) { const y = j * (h - 0.03) / rows; g.box(-w / 2, y, -d / 2, w / 2, y + 0.03, d / 2, { faces: 'yYZ' }); }
  g.mat('wood', '#3a2a1e'); g.box(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.012, { faces: 'Z' });
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const cw = w / cols - 0.04, chh = (h - 0.03) / rows - 0.03, cx = -w / 2 + (i + 0.5) * w / cols, y0 = j * (h - 0.03) / rows + 0.03;
    const n = r.chance(0.2) ? 1 : 2, rr = Math.min(cw / (n * 2) - 0.01, chh / 2 - 0.01);
    for (let k = 0; k < n; k++) {
      const c = r.pick(C), x = cx + (n === 1 ? 0 : (k - 0.5) * rr * 2.05), zz = r.f(-0.02, 0.05);
      g.push(); g.move(x, y0 + rr, 0); g.rotX(Math.PI / 2);
      g.mat('felt', c); g.cyl(0, -d / 2 + 0.25, 0, rr, d / 2 - 0.27 + zz, { segs: 6, capBottom: false, capTop: false });
      g.mat('felt', shadeHex(c, 0.68)); g.lathe(0, 0, [[rr, d / 2 - 0.02 + zz], [rr * 0.3, d / 2 - 0.02 + zz]], { segs: 6, capBottom: false, capTop: false });
      g.mat('felt', shadeHex(c, 1.2)); g.lathe(0, 0, [[rr * 0.3, d / 2 - 0.02 + zz], [0, d / 2 - 0.02 + zz]], { segs: 6, capBottom: false, capTop: false });
      g.pop();
    }
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A felt baffle hung from the ceiling on two cords: origin at the ceiling, the panel hanging below. p: { c, c2, w, h, up }
defineProp('shops-craft.baffle', (g, p) => {
  const w = p.w || 1.0, h = p.h || 0.6, up = p.up || 0.3, c = p.c || '#8a2f3c';
  g.mat('weave', '#d8cdb8'); for (const sx of [-1, 1]) g.tube([[sx * (w / 2 - 0.08), 0, 0], [sx * (w / 2 - 0.08), -up, 0]], 0.003, { segs: 3, caps: false });
  g.mat('wood', '#4a3424'); g.box(-w / 2 - 0.02, -up - 0.04, -0.02, w / 2 + 0.02, -up, 0.02, { faces: 'xXyYzZ' });
  g.mat('felt', c); g.box(-w / 2, -up - 0.04 - h, -0.014, w / 2, -up - 0.04, 0.014, { faces: 'xXyzZ' });
  g.mat('weave', p.c2 || '#d6a640'); for (const sz of [-1, 1]) g.box(-w / 2 + 0.03, -up - 0.04 - h + 0.03, sz * 0.0145 - 0.0005, w / 2 - 0.03, -up - 0.04 - h + 0.04, sz * 0.0145 + 0.0005, { faces: sz > 0 ? 'Z' : 'z' });
  return { tier: 'd', cast: false };
});

// A dress form wearing a pair of wing-sleeves with the fins spread from wrist to hip. p: { c, c2, form }
defineProp('shops-craft.wingform', (g, p) => {
  const c = p.c || '#26306b', c2 = p.c2 || '#d6a640', ZS = 0.74;
  g.mat('wood', '#3a2c22'); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.3; g.tube([[Math.cos(a) * 0.26, 0.02, Math.sin(a) * 0.26], [Math.cos(a) * 0.05, 0.12, Math.sin(a) * 0.05]], 0.018, { segs: 4 }); }
  g.mat('cast', '#2a2622'); g.cyl(0, 0.1, 0, 0.012, 0.86, { segs: 5, capBottom: false });
  g.push(); g.scale(1, 1, ZS);
  g.mat('weave', c); g.lathe(0, 0, [[0.17, 1.0], [0.145, 1.18], [0.175, 1.32], [0.186, 1.41], [0.156, 1.49], [0.07, 1.54], [0.045, 1.6], [0, 1.61]], { segs: 9 }); g.pop();
  for (const sx of [-1, 1]) {
    const sh = [sx * 0.17, 1.45, 0], el = [sx * 0.45, 1.36, 0.02], wr = [sx * 0.72, 1.3, 0.03];
    g.mat('weave', c); g.tube([sh, el, wr], [0.055, 0.045, 0.038], { segs: 6 });
    g.mat('weave', c2); g.cyl(wr[0], wr[1] - 0.02, wr[2], 0.042, 0.04, { segs: 6 });
    g.mat('weave', mixHex(c, '#ffffff', 0.12), { sway: 0.2 });
    g.sheet([sx * 0.18, 1.38, -0.01], [sx * 0.7, 1.27, 0.0], [sx * 0.42, 1.06, -0.02], [sx * 0.16, 1.0, -0.02], { nu: 3, nv: 3, sag: 0.03, ripple: 0.01 });
    g.mat('weave', c2); for (let k = 1; k <= 3; k++) { const t = k / 4; g.tube([[sx * (0.18 + 0.52 * t), 1.38 - 0.11 * t, 0.012], [sx * (0.16 + 0.26 * t), 1.0 + 0.06 * t, 0.0]], 0.0045, { segs: 3, caps: false }); }
  }
  return { posts: [[0, 0, 0.24, 0, 1.6]], tier: 's' };
});

// A pair of wing-sleeves for hire on a hanger, fins folded down, a numbered tag. Origin at the hook. p: { c, c2 }
defineProp('shops-craft.sleevehang', (g, p) => {
  const c = p.c || '#26306b', c2 = p.c2 || '#d6a640';
  g.mat('wood', '#7a5a3a'); g.tube([[-0.21, -0.06, 0], [0, -0.005, 0], [0.21, -0.06, 0]], 0.009, { segs: 4, caps: false });
  g.mat('cast', '#9a9488'); g.tube([[0, -0.005, 0], [0, 0.03, 0], [0.02, 0.05, 0], [0.035, 0.03, 0]], 0.003, { segs: 3, caps: false });
  g.mat('weave', c); g.box(-0.19, -0.42, -0.04, 0.19, -0.06, 0.04, { faces: 'xXyYzZ' });
  for (const sx of [-1, 1]) { g.mat('weave', mixHex(c, '#ffffff', 0.1), { sway: 0.3 }); g.sheet([sx * 0.19, -0.08, 0.045], [sx * 0.05, -0.1, 0.05], [sx * 0.06, -0.95, 0.06], [sx * 0.2, -0.88, 0.05], { nu: 2, nv: 3, ripple: 0.02 }); g.mat('weave', c2); g.box(sx * 0.12 - 0.004, -0.9, 0.061, sx * 0.12 + 0.004, -0.1, 0.064, { faces: 'Z' }); }
  g.mat('weave', c2); g.box(-0.2, -0.42, -0.042, 0.2, -0.39, 0.042, { faces: 'xXzZ' });
  tagLo(g, 0.14, -0.38, 0.045, c2);
  return { tier: 'd', cast: true };
});

// A board of shoe pegs: hire is by the turn, and your shoes are the deposit. p: { w, v }
defineProp('shops-craft.shoepegs', (g, p) => {
  const w = p.w || 1.4, r = new Rng(hashStr('shoe' + w + (p.v || 0))), n = Math.max(3, Math.floor(w / 0.24));
  g.mat('wood', '#5a3d28'); g.box(-w / 2, 0, -0.02, w / 2, 0.62, 0, { faces: 'xXyYZ' });
  for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n, y = 0.18 + row * 0.3;
    g.mat('wood', '#c9a06a'); g.tube([[x, y, 0], [x, y + 0.02, 0.09]], 0.009, { segs: 4, caps: false });
    if (r.chance(0.3)) continue;
    const c = r.pick(['#3a3a44', '#6b4a2f', '#26306b', '#8a2f3c', '#e9e1cf', '#2f6f73']);
    for (const dx of [-0.04, 0.04]) { g.push(); g.move(x + dx, y - 0.12, 0.07); g.rotX(-0.25); g.mat('weave', c); g.box(-0.035, 0, -0.025, 0.035, 0.24, 0.035, { faces: 'xXYZ' }); g.mat('speckle', '#2a2622'); g.box(-0.036, -0.005, -0.03, 0.036, 0.24, -0.025, { faces: 'xXyY' }); g.pop(); }
    g.mat('paper', '#efe4c8'); g.box(x - 0.025, y + 0.04, 0.001, x + 0.025, y + 0.08, 0.003, { faces: 'Z' });
  }
  return { tier: 's', cast: false };
});

// A kite laid flat on the wall, spars showing, its tail curling down. Front toward +z. p: { a, b, patch, s }
defineProp('shops-craft.wallkite', (g, p) => {
  const k = p.s || 1, a = p.a || '#c8402e', b = p.b || '#d6a640', z = 0.02;
  const T = [0, 0.32 * k, z], L = [-0.25 * k, 0.06 * k, z], R = [0.25 * k, 0.06 * k, z], B = [0, -0.45 * k, z], C = [0, 0.06 * k, z];
  g.mat('weave', a); g.quad(L, C, T, T); g.quad(C, R, B, B);
  g.mat('weave', b); g.quad(C, R, T, T); g.quad(L, B, C, C);
  g.mat('weave', p.patch || '#2f6f73'); g.quad([0.06 * k, -0.1 * k, z + 0.002], [0.15 * k, -0.1 * k, z + 0.002], [0.15 * k, 0.0, z + 0.002], [0.06 * k, 0.0, z + 0.002]);
  g.mat('wood', '#8a6240'); g.box(-0.004, -0.45 * k, z + 0.004, 0.004, 0.32 * k, z + 0.008, { faces: 'Z' }); g.box(-0.25 * k, 0.06 * k - 0.004, z + 0.004, 0.25 * k, 0.06 * k + 0.004, z + 0.008, { faces: 'Z' });
  const tail = []; for (let i = 0; i <= 8; i++) { const t = i / 8; tail.push([Math.sin(t * 6) * 0.08 * t * k, -0.45 * k - t * 0.7, z + 0.01]); }
  g.mat('weave', '#d8cdb8'); g.tube(tail, 0.0025, { segs: 3, caps: false });
  for (let i = 2; i <= 8; i += 2) { const q = tail[i]; g.mat('weave', i % 4 ? a : (p.patch || '#2f6f73')); g.quad([q[0] - 0.05, q[1] - 0.025, q[2]], [q[0], q[1], q[2]], [q[0] - 0.05, q[1] + 0.025, q[2]], [q[0] - 0.05, q[1] + 0.025, q[2]]); g.quad([q[0], q[1], q[2]], [q[0] + 0.05, q[1] - 0.025, q[2]], [q[0] + 0.05, q[1] + 0.025, q[2]], [q[0] + 0.05, q[1] + 0.025, q[2]]); }
  return { tier: 'd', cast: false };
});

// A small electric kiln: an eight-sided drum on legs, a lid, a controller with an amber lamp, its cable to the wall.
defineProp('shops-craft.kiln', (g, p) => {
  const r = 0.32, h = 0.6, y0 = 0.22;
  g.mat('cast', '#3a3632'); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4; g.box(Math.cos(a) * r * 0.8 - 0.02, 0, Math.sin(a) * r * 0.8 - 0.02, Math.cos(a) * r * 0.8 + 0.02, y0, Math.sin(a) * r * 0.8 + 0.02, { faces: 'xXzZ' }); }
  g.mat('brushed', p.body || '#9a958a', { rough: 0.05 }); g.cyl(0, y0, 0, r, h, { segs: 8 });
  g.mat('cast', '#5a5650'); for (const yy of [y0 + 0.12, y0 + h - 0.12]) g.cyl(0, yy, 0, r + 0.008, 0.025, { segs: 8, capBottom: false, capTop: false });
  g.mat('brushed', '#b4ae9f'); g.cyl(0, y0 + h, 0, r * 1.02, 0.05, { segs: 8 });
  g.mat('cast', '#2a2622'); g.box(-0.08, y0 + h + 0.05, -0.02, 0.08, y0 + h + 0.08, 0.02, { faces: 'xXYzZ' });
  g.mat('paint', '#d9d2c2', { rough: -0.1 }); g.box(-0.1, y0 + 0.25, r - 0.01, 0.1, y0 + 0.45, r + 0.07, { faces: 'xXyYZ' });
  g.mat('plain', '#ffb347', { emissive: 3 }); g.box(0.04, y0 + 0.39, r + 0.07, 0.06, y0 + 0.41, r + 0.075, { faces: 'Z' });
  g.mat('cast', '#2a2622'); g.box(-0.05, y0 + 0.32, r + 0.07, -0.01, y0 + 0.36, r + 0.09, { faces: 'xXyYZ' });
  g.tube([[0, y0 + 0.25, -r], [0, 0.1, -r - 0.1], [0, 0.03, -r - 0.3]], 0.012, { segs: 4, caps: false });
  return { posts: [[0, 0, r + 0.02, 0, y0 + h + 0.08]], tier: 's' };
});

// A board of pegs with lids hanging from them, waiting for their crocks. p: { w, h, v }
defineProp('shops-craft.lidwall', (g, p) => {
  const w = p.w || 1.4, h = p.h || 0.9, r = new Rng(hashStr('lid' + w + (p.v || 0))), cols = Math.max(3, Math.floor(w / 0.22)), rows = Math.max(2, Math.floor(h / 0.28));
  g.mat('paint', p.board || '#2f4a3a', { rough: 0.1 }); g.box(-w / 2, 0, -0.02, w / 2, h, 0, { faces: 'xXZ' });
  g.mat('wood', '#4a3424'); g.box(-w / 2 - 0.03, h, -0.025, w / 2 + 0.03, h + 0.035, 0.02, { faces: 'YZ' }); g.box(-w / 2 - 0.03, -0.035, -0.025, w / 2 + 0.03, 0, 0.02, { faces: 'yZ' });
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x = -w / 2 + (i + 0.5) * w / cols, y = h - 0.08 - j * (h - 0.1) / rows;
    g.mat('wood', '#c9a06a'); g.box(x - 0.006, y - 0.006, 0, x + 0.006, y + 0.006, 0.05, { faces: 'YZ' });
    if (r.chance(0.18)) continue;
    const rr = r.f(0.07, 0.1);
    g.mat('glaze', r.pick(GLAZES), { rough: -0.15 }); g.push(); g.move(x, y - rr + 0.01, 0.025); g.rotX(Math.PI / 2 - 0.12); g.lathe(0, 0, [[rr, 0], [rr * 0.6, 0.03], [rr * 0.2, 0.04], [rr * 0.18, 0.06], [0, 0.062]], { segs: 7, capBottom: false }); g.pop();
    g.mat('paper', '#efe4c8'); g.box(x - 0.02, y - rr * 2 - 0.02, 0.03, x + 0.02, y - rr * 2 + 0.008, 0.032, { faces: 'Z' });
  }
  return { tier: 's', cast: false };
});

// Pigeon-holes of letters waiting to be read aloud. p: { w, h }
defineProp('shops-craft.pigeonholes', (g, p) => {
  const w = p.w || 1.2, h = p.h || 0.9, d = 0.3, cols = Math.max(3, Math.round(w / 0.22)), rows = Math.max(3, Math.round(h / 0.2)), r = new Rng(hashStr('ph' + w + h));
  g.mat('wood', '#4a3222'); for (let i = 0; i <= cols; i++) { const x = -w / 2 + i * w / cols; g.box(x - 0.012, 0, -d / 2, x + 0.012, h, d / 2, { faces: 'xXZ' }); }
  for (let j = 0; j <= rows; j++) { const y = j * (h - 0.02) / rows; g.box(-w / 2, y, -d / 2, w / 2, y + 0.02, d / 2, { faces: 'yYZ' }); }
  g.mat('wood', '#2e2018'); g.box(-w / 2, 0, -d / 2, w / 2, h, -d / 2 + 0.01, { faces: 'Z' });
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    if (r.chance(0.25)) continue;
    const x = -w / 2 + (i + 0.5) * w / cols, y = j * (h - 0.02) / rows + 0.02, n = r.i(1, 4);
    g.mat('paper', r.pick(['#efe4c8', '#e6d8b8', '#f3ead2', '#d8c8a8']), { rough: 0.1 }); g.box(x - 0.07, y, -0.1, x + 0.07, y + n * 0.008, 0.1 + r.f(0, 0.04), { faces: 'YZ' });
    if (r.chance(0.3)) { g.mat('weave', r.pick(['#c8402e', '#26306b', '#d6a640'])); g.box(x - 0.005, y, 0.09, x + 0.005, y + n * 0.008 + 0.002, 0.12, { faces: 'YZ' }); }
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A three-step display stand, covered in felt. p: { w, c }
defineProp('shops-craft.steps', (g, p) => {
  const w = p.w || 1.2, c = p.c || '#8a2f3c';
  for (let i = 0; i < 3; i++) { g.mat('wood', '#4a3424'); g.box(-w / 2, 0, -0.36, w / 2, 0.18 + i * 0.18, 0.36 - i * 0.22, { faces: 'xXZ' }); g.mat('felt', c); g.box(-w / 2 + 0.01, 0.18 + i * 0.18, -0.35, w / 2 - 0.01, 0.185 + i * 0.18, 0.35 - i * 0.22, { faces: 'YZ' }); }
  return { solid: [[-w / 2, 0, -0.36, w / 2, 0.54, 0.36]], tier: 's' };
});

// A peg rail with chairs hung up on it upside down, out of the way of the broom. p: { w, n, v }
defineProp('shops-craft.chairpeg', (g, p) => {
  const w = p.w || 2.0, n = p.n || 1, r = new Rng(hashStr('cp' + w + n + (p.v || 0)));
  g.mat('wood', '#4a3424'); g.box(-w / 2, -0.06, -0.02, w / 2, 0.04, 0.0, { faces: 'xXyYZ' });
  for (let i = 0; i < Math.round(w / 0.3); i++) { const x = -w / 2 + 0.15 + i * 0.3; g.mat('wood', '#c9a06a'); g.box(x - 0.01, -0.02, 0, x + 0.01, 0.0, 0.09, { faces: 'xXYZ' }); }
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n;
    g.push(); g.move(x, 0.0, 0.3); g.rotX(Math.PI); g.rotY(r.f(-0.05, 0.05));
    drawChair(g, { style: r.pick(['ladder', 'slat']), state: r.pick(['done', 'bare', 'webbed']), wood: r.pick(['#6b4428', '#4a2e1c', '#8a5a34', '#5a3a22']), seat: r.chance(0.5) ? 'cloth' : 'rush', cloth: r.pick(CLOTH) });
    g.pop();
  }
  return { tier: 's', cast: false };
});

// A work table, 0.9 high, with the trade's work spread on it. p: { t, w, d, top }
defineProp('shops-craft.worktable', (g, p) => {
  const t = p.t, w = p.w || 1.6, d = p.d || 0.8, h = 0.9, r = new Rng(hashStr('wt' + t + w));
  g.mat('wood', p.top || '#b08a5a', { rough: -0.08 }); g.box(-w / 2, h - 0.06, -d / 2, w / 2, h, d / 2, { faces: 'xXyYzZ' });
  g.mat('wood', '#4a3424'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.08) - 0.04, 0, sz * (d / 2 - 0.08) - 0.04, sx * (w / 2 - 0.08) + 0.04, h - 0.06, sz * (d / 2 - 0.08) + 0.04, { faces: 'xXzZ' });
  g.box(-w / 2 + 0.08, 0.16, -d / 2 + 0.08, w / 2 - 0.08, 0.19, d / 2 - 0.08, { faces: 'yYzZ' });
  g.mat('cast', '#c9a050', { rough: -0.2 }); g.box(-w / 2 + 0.05, h - 0.012, d / 2, w / 2 - 0.05, h - 0.002, d / 2 + 0.002, { faces: 'YZ' });
  const y = h;
  if (t === 'tailor' || t === 'mender') {
    g.mat('weave', r.pick(CLOTH)); g.box(-w * 0.4, y, -d * 0.35, w * 0.15, y + 0.006, d * 0.38, { faces: 'Y' });
    g.mat('plain', '#f3ede2'); g.box(-w * 0.38, y + 0.006, -d * 0.2, w * 0.1, y + 0.008, -d * 0.2 + 0.006, { faces: 'Y' }); g.box(w * 0.1 - 0.006, y + 0.006, -d * 0.2, w * 0.1, y + 0.008, d * 0.3, { faces: 'Y' });
    g.mat('paper', '#d9c9a8'); g.quad([w * 0.2, y + 0.004, d * 0.2], [w * 0.44, y + 0.004, d * 0.1], [w * 0.42, y + 0.004, -d * 0.3], [w * 0.2, y + 0.004, -d * 0.3]);
    g.push(); g.move(w * 0.05, y + 0.006, d * 0.2); g.rotY(0.7); drawShears(g); g.pop();
    g.mat('knit', '#c8402e'); g.cyl(w * 0.4, y, d * 0.3, 0.022, 0.05, { segs: 6, capBottom: false }); g.mat('knit', '#2f6f8f'); g.cyl(w * 0.36, y, d * 0.36, 0.022, 0.05, { segs: 6, capBottom: false });
  } else if (t === 'kites') {
    g.mat('paper', '#e9e1cf'); g.quad([-w * 0.35, y + 0.003, 0], [-w * 0.1, y + 0.003, d * 0.4], [w * 0.15, y + 0.003, 0], [-w * 0.1, y + 0.003, -d * 0.35]);
    g.mat('weave', '#c8402e'); g.quad([-w * 0.1, y + 0.005, 0], [w * 0.15, y + 0.005, 0], [-w * 0.1, y + 0.005, -d * 0.35], [-w * 0.1, y + 0.005, -d * 0.35]);
    g.mat('wood', '#c9a06a'); for (let i = 0; i < 5; i++) g.box(w * 0.2, y + i * 0.008, -d * 0.35 + i * 0.03, w * 0.45, y + i * 0.008 + 0.008, -d * 0.35 + i * 0.03 + 0.01, { faces: 'YZ' });
    for (let i = 0; i < 5; i++) { g.mat('weave', r.pick(CLOTH)); g.box(w * 0.18 + i * 0.05, y, d * 0.15, w * 0.18 + i * 0.05 + 0.04, y + 0.004, d * 0.35, { faces: 'Y' }); }
    g.push(); g.move(-w * 0.4, y + 0.004, -d * 0.3); g.rotY(1.2); drawShears(g, { handle: '#c8402e' }); g.pop();
  } else if (t === 'felt') {
    g.mat('felt', '#8a2f3c'); g.box(-w * 0.45, y, -d * 0.4, w * 0.25, y + 0.012, d * 0.4, { faces: 'YzZxX' });
    g.mat('plain', '#f3ede2'); g.box(-w * 0.1, y + 0.012, -d * 0.4, -w * 0.1 + 0.006, y + 0.014, d * 0.4, { faces: 'Y' });
    g.mat('felt', '#d6a640'); g.push(); g.move(w * 0.36, y + 0.09, 0); g.rotX(Math.PI / 2); g.cyl(0, -d * 0.42, 0, 0.09, d * 0.84, { segs: 8 }); g.pop();
    g.mat('cast', '#9a9488'); g.box(-w * 0.45, y + 0.012, d * 0.42, w * 0.25, y + 0.02, d * 0.46, { faces: 'YZ' });
  } else if (t === 'sleeves') {
    g.mat('weave', '#2f6f8f'); g.quad([-w * 0.45, y + 0.004, -d * 0.35], [-w * 0.42, y + 0.004, d * 0.3], [w * 0.0, y + 0.004, d * 0.38], [w * 0.2, y + 0.004, -d * 0.4]);
    g.mat('weave', '#d6a640'); for (let k = 0; k < 4; k++) g.box(-w * 0.4 + k * w * 0.13, y + 0.005, -d * 0.35, -w * 0.4 + k * w * 0.13 + 0.008, y + 0.007, d * 0.28, { faces: 'Y' });
    g.mat('paper', '#e9e1cf'); g.box(w * 0.22, y, -d * 0.2, w * 0.45, y + 0.004, d * 0.3, { faces: 'Y' });
    g.push(); g.move(w * 0.3, y + 0.006, d * 0.35); g.rotY(-0.4); drawShears(g); g.pop();
  } else if (t === 'second') {
    for (let i = 0; i < 9; i++) { const bx = -w * 0.45 + (i % 3) * 0.16, bz = -d * 0.3 + Math.floor(i / 3) * 0.1, by = y + Math.floor(i / 3) * 0.002; g.mat('paper', i % 3 ? '#f3ead2' : '#efe4c8'); g.box(bx, by, bz, bx + 0.12, by + 0.003, bz + 0.08, { faces: 'Y' }); g.mat('plain', '#3a3430'); g.box(bx + 0.015, by + 0.0035, bz + 0.02, bx + 0.09, by + 0.004, bz + 0.025, { faces: 'Y' }); }
    drawCrock(g, w * 0.3, y, -d * 0.1, 0.22, 0.09, '#2f6f73', null); drawHandLamp(g, w * 0.1, y, d * 0.2, '#8a2f3c', false);
  } else if (t === 'toys') {
    g.mat('paint', '#e8705a'); g.box(-w * 0.3, y, -0.05, -w * 0.3 + 0.15, y + 0.08, 0.05, { faces: 'xXYzZ' }); g.mat('plain', '#26323a'); g.box(-w * 0.3 + 0.02, y + 0.04, 0.05, -w * 0.3 + 0.13, y + 0.065, 0.052, { faces: 'Z' });
    g.mat('paint', '#e9b23c'); g.lathe(0, -d * 0.2, [[0.012, y + 0.01], [0.045, y + 0.03], [0.047, y + 0.06], [0, y + 0.065]], { segs: 8, capBottom: false });
    g.mat('weave', '#2f8a85'); g.ball(w * 0.25, y + 0.05, d * 0.1, 0.05, 0.05, 0.05, { segs: 6, rings: 4 });
    drawCrock(g, w * 0.38, y, -d * 0.25, 0.1, 0.05, '#6b4a2f', null);
    g.mat('paint', '#7cab4e'); for (let i = 0; i < 4; i++) g.box(w * 0.05 + i * 0.06, y, d * 0.25, w * 0.05 + i * 0.06 + 0.045, y + 0.045, d * 0.25 + 0.045, { faces: 'xXYzZ' });
  } else if (t === 'books') {
    g.mat('paper', '#efe4c8'); g.box(-w * 0.3, y, -d * 0.2, -w * 0.3 + 0.42, y + 0.02, d * 0.1, { faces: 'YzZxX' }); g.mat('paper', '#7a2f2a'); g.box(-w * 0.3 - 0.01, y, -d * 0.2 - 0.01, -w * 0.3 + 0.43, y + 0.006, d * 0.1 + 0.01, { faces: 'YzZxX' });
    for (let i = 0; i < 4; i++) { g.mat('paper', r.pick(['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f'])); g.box(w * 0.15, y + i * 0.045, -d * 0.25, w * 0.15 + 0.24, y + i * 0.045 + 0.042, -d * 0.25 + 0.32, { faces: 'xXYzZ' }); }
    g.mat('paper', '#f3ead2'); for (let i = 0; i < 5; i++) g.box(-w * 0.45 + i * 0.012, y + i * 0.002, d * 0.15, -w * 0.45 + 0.21 + i * 0.012, y + i * 0.002 + 0.002, d * 0.15 + 0.29, { faces: 'Y' });
  } else if (t === 'crocks') {
    for (let i = 0; i < 4; i++) drawCrock(g, -w * 0.35 + i * w * 0.2, y, -d * 0.15 + (i % 2) * 0.15, 0.2, 0.08, ['#e9e1cf', '#d9c7a6', '#a3563a', '#e9e1cf'][i], null);
    for (let i = 0; i < 3; i++) { g.mat('glaze', r.pick(GLAZES)); g.lathe(w * 0.3 + (i - 1) * 0.12, d * 0.25, [[0.08, y], [0.05, y + 0.03], [0.015, y + 0.04], [0, y + 0.05]], { segs: 7, capBottom: false }); }
    g.mat('glaze', '#2f6f73'); g.cyl(w * 0.35, y, -d * 0.25, 0.06, 0.07, { segs: 7, capBottom: false }); g.mat('wood', '#c9a06a'); g.tube([[w * 0.35, y + 0.06, -d * 0.25], [w * 0.42, y + 0.25, -d * 0.2]], 0.006, { segs: 3, caps: false });
  } else if (t === 'lamps') {
    for (let i = 0; i < 3; i++) drawHandLamp(g, -w * 0.35 + i * 0.22, y, -d * 0.1, ['#2f6f73', '#8a2f3c', '#d6a640'][i], i === 1, '#ffc884');
    g.mat('cast', '#7a6a58'); g.lathe(w * 0.2, 0.0, [[0.03, y], [0.09, y + 0.08], [0.11, y + 0.15], [0.085, y + 0.085], [0.045, y + 0.025]], { segs: 8 });
    g.mat('cast', '#b08a45'); for (let i = 0; i < 6; i++) g.box(w * 0.35 + (i % 3) * 0.04 - 0.012, y, d * 0.25 + Math.floor(i / 3) * 0.04 - 0.012, w * 0.35 + (i % 3) * 0.04 + 0.012, y + 0.03, d * 0.25 + Math.floor(i / 3) * 0.04 + 0.012, { faces: 'xXYZ' });
    g.mat('cast', '#c8402e'); g.tube([[-w * 0.2, y + 0.004, d * 0.3], [0, y + 0.004, d * 0.35], [w * 0.1, y + 0.004, d * 0.25]], 0.004, { segs: 3, caps: false });
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's' };
});

// A free-standing rail of dyed lengths in a run of colour, for the dyer's window. p: { v, w }
defineProp('shops-craft.draperail', (g, p) => {
  const w = p.w || 1.6, v = p.v || 0, H = 2.2, r = new Rng(hashStr('dr' + v + w));
  g.mat('cast', '#2a2622'); for (const sx of [-1, 1]) { g.tube([[sx * w / 2, 0, 0], [sx * w / 2, H, 0]], 0.016, { segs: 5, caps: false }); g.box(sx * w / 2 - 0.03, 0, -0.22, sx * w / 2 + 0.03, 0.03, 0.22, { faces: 'xXYzZ' }); }
  g.tube([[-w / 2, H, 0], [w / 2, H, 0]], 0.014, { segs: 5 });
  const n = Math.max(3, Math.round(w / 0.3));
  for (let i = 0; i < n; i++) {
    const a = -w / 2 + 0.04 + i * (w - 0.08) / n, b = a + (w - 0.08) / n - 0.03, c = hsl((v * 0.31 + i / n * 0.8) % 1, 0.62, 0.48), drop = r.f(0.9, 1.4);
    g.mat(r.chance(0.3) ? 'motif' : 'weave', c, { sway: 0.3 });
    g.sheet([a, H - 0.01, 0.015], [b, H - 0.01, 0.015], [b, H - drop, 0.03], [a, H - drop, 0.03], { nu: 2, nv: 3, ripple: 0.025, rippleN: 2 });
  }
  return { posts: [[-w / 2, 0, 0.03, 0, H], [w / 2, 0, 0.03, 0, H]], tier: 's' };
});

// A rack of cloth hung up to dry under the ceiling, origin at the ceiling: a rod on cords and lengths over it. p: { v, w }
defineProp('shops-craft.dryrack', (g, p) => {
  const w = p.w || 2.4, v = p.v || 0, drop = 0.3, r = new Rng(hashStr('dry' + v + w));
  g.mat('weave', '#d8cdb8'); for (const sx of [-1, 1]) g.tube([[sx * (w / 2 - 0.1), 0, 0], [sx * (w / 2 - 0.1), -drop, 0]], 0.003, { segs: 3, caps: false });
  g.mat('wood', '#6b4a2f'); g.tube([[-w / 2, -drop, 0], [w / 2, -drop, 0]], 0.016, { segs: 5 });
  const n = Math.max(3, Math.round(w / 0.45));
  for (let i = 0; i < n; i++) {
    const a = -w / 2 + 0.05 + i * (w - 0.1) / n, b = a + (w - 0.1) / n - 0.05, c = hsl((v * 0.27 + i / n * 0.6 + 0.55) % 1, 0.6, r.f(0.35, 0.55)), dd = r.f(0.45, 0.65);
    g.mat(r.chance(0.25) ? 'stripe' : 'weave', c, { sway: 0.4 });
    g.sheet([a, -drop + 0.01, 0.015], [b, -drop + 0.01, 0.015], [b, -drop - dd, 0.04], [a, -drop - dd, 0.04], { nu: 2, nv: 2, ripple: 0.02, rippleN: 2 });
  }
  return { tier: 'd', cast: false };
});

// A rail of finished work on hangers along a wall. Origin at the rail's middle (rail at y = 0). p: { w, v, kind: 'coat' | 'lined' }
defineProp('shops-craft.coatrail', (g, p) => {
  const w = p.w || 1.6, r = new Rng(hashStr('cr' + w + (p.v || 0) + p.kind)), n = Math.max(3, Math.round(w / 0.4));
  g.mat('cast', '#2a2622'); g.tube([[-w / 2, 0, 0.0], [w / 2, 0, 0.0]], 0.013, { segs: 5 });
  for (const sx of [-1, 1]) g.box(sx * w / 2 - 0.015, -0.02, -0.25, sx * w / 2 + 0.015, 0.02, 0.0, { faces: 'xXyY' });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + 0.5) * w / n, c = r.pick(CLOTH), lin = r.pick(CLOTH);
    g.mat('wood', '#7a5a3a'); g.tube([[x - 0.18, -0.06, 0], [x, -0.012, 0], [x + 0.18, -0.06, 0]], 0.008, { segs: 3, caps: false });
    g.push(); g.move(x, 0, 0); g.rotY(r.f(-0.25, 0.25));
    g.push(); g.scale(1, 1, 0.32);
    g.mat('weave', c); g.lathe(0, 0, [[0.19, -0.92], [0.17, -0.4], [0.185, -0.15], [0.12, -0.03], [0.05, -0.012]], { segs: 8, capBottom: false, capTop: false });
    if (p.kind === 'lined') { g.mat('weave', lin); g.lathe(0, 0, [[0.183, -0.07], [0.183, -0.92]], { segs: 8, capBottom: false, capTop: false }); }
    g.pop();
    g.mat('weave', p.kind === 'lined' ? lin : shadeHex(c, 0.75)); g.box(-0.015, -0.9, 0.055, 0.015, -0.06, 0.062, { faces: 'Z' });
    if (r.chance(0.6)) { g.mat('weave', r.pick(CLOTH)); g.box(0.04, -0.5, 0.058, 0.11, -0.42, 0.064, { faces: 'Z' }); g.mat('weave', '#e0b040'); g.box(0.035, -0.425, 0.064, 0.115, -0.418, 0.066, { faces: 'Z' }); }
    g.pop();
    tagLo(g, x + 0.14, -0.6, 0.07, '#b08a45');
  }
  return { tier: 'd', cast: true };
});

// ---------------------------------------------------------------------------------------------------------------
// Small things
// ---------------------------------------------------------------------------------------------------------------
defineProp('shops-craft.crock', (g, p) => { drawCrock(g, 0, 0, 0, p.h || 0.24, p.r || 0.1, p.g || '#8a5a3c', p.l === undefined ? undefined : p.l, p.b, 7); return { cast: false }; });
defineProp('shops-craft.handlamp', (g, p) => { drawHandLamp(g, 0, 0, 0, p.c || '#2f6f73', !!p.on, p.glow, p.k || 1); return { cast: false }; });

// A room lamp's pendant shade hung on its flex, lit with no light of its own (the shop's real lamps do the lighting). Origin at the ceiling.
defineProp('shops-craft.pendant', (g, p) => {
  const drop = p.drop || 0.7, c = p.c || '#2f6f73', k = p.kind || 0;
  g.mat('brushed', '#3a3530'); g.tube([[0, 0, 0], [0, -drop, 0]], 0.005, { segs: 3, caps: false });
  if (k === 0) { g.mat('paint', c, { rough: -0.15 }); g.lathe(0, 0, [[0.03, -drop + 0.02], [0.07, -drop - 0.04], [0.15, -drop - 0.14], [0.17, -drop - 0.17]], { segs: 8, capBottom: false, capTop: false }); }
  else if (k === 1) { g.mat('glaze', c, { rough: -0.3 }); g.lathe(0, 0, [[0.02, -drop + 0.02], [0.09, -drop - 0.06], [0.11, -drop - 0.16], [0.08, -drop - 0.22]], { segs: 8, capBottom: false, capTop: false }); }
  else { g.mat('weave', c); g.lathe(0, 0, [[0.12, -drop - 0.02], [0.18, -drop - 0.24]], { segs: 8, capBottom: false, capTop: false }); }
  g.mat('diffuser', p.glow || '#ffd9a0', { emissive: p.e || 2.6 }); g.ball(0, -drop - (k === 2 ? 0.14 : 0.1), 0, 0.045, 0.05, 0.045, { segs: 6, rings: 4 });
  return { tier: 'd', cast: false };
});

// A roll of felt standing on end. p: { c, h, r }
defineProp('shops-craft.roll', (g, p) => {
  const h = p.h || 1.3, r = p.r || 0.15, c = p.c || '#8a2f3c';
  g.mat('felt', c); g.cyl(0, 0, 0, r, h, { segs: 8, capBottom: false, capTop: false });
  g.mat('felt', shadeHex(c, 0.68)); g.cyl(0, h, 0, r, 0.003, { segs: 8, capBottom: false });
  g.mat('weave', '#d8cdb8'); for (const yy of [h * 0.25, h * 0.75]) g.cyl(0, yy, 0, r + 0.004, 0.02, { segs: 8, capBottom: false, capTop: false });
  return { posts: [[0, 0, r, 0, h]], tier: 's' };
});

// A reel of kite line, standing on its rim. p: { c }
defineProp('shops-craft.reel', (g, p) => {
  g.push(); g.move(0, 0.09, 0); g.rotZ(Math.PI / 2);
  g.mat('wood', '#9a7048', { rough: -0.05 }); g.cyl(0, -0.057, 0, 0.09, 0.014, { segs: 8 }); g.cyl(0, 0.043, 0, 0.09, 0.014, { segs: 8 });
  g.mat('weave', p.c || '#e9e1cf'); g.cyl(0, -0.043, 0, 0.065, 0.086, { segs: 8, capBottom: false, capTop: false });
  g.pop();
  g.mat('wood', '#6b4a2f'); g.box(0.057, 0.08, -0.01, 0.11, 0.1, 0.01, { faces: 'xXYzZ' });
  return { cast: false };
});

// A tray of hem weights: brass and steel discs by the gram, for hems on the lighter decks. p: { v }
defineProp('shops-craft.hemtray', (g, p) => {
  const r = new Rng(hashStr('hem' + (p.v || 0)));
  g.mat('wood', '#6b4428'); g.box(-0.22, 0, -0.12, 0.22, 0.012, 0.12, { faces: 'Y' }); for (const x of [-0.22, -0.073, 0.073, 0.22]) g.box(x - 0.006, 0, -0.12, x + 0.006, 0.04, 0.12, { faces: 'xXYZ' }); for (const z of [-0.12, 0.12]) g.box(-0.22, 0, z - 0.006, 0.22, 0.04, z + 0.006, { faces: 'YzZ' });
  for (let c = 0; c < 3; c++) { const n = 5 + c * 3; for (let i = 0; i < n; i++) { g.mat('cast', c === 1 ? '#9a9488' : '#c9a050', { rough: -0.2 }); g.cyl(-0.146 + c * 0.146 + r.f(-0.04, 0.04), 0.012 + r.f(0, 0.012), r.f(-0.09, 0.09), 0.012 + c * 0.003, 0.004, { segs: 6, capBottom: false }); } }
  return { cast: false };
});

// Two sample boards on stands, one bare and one felted: clap in front of each. Front toward +z.
defineProp('shops-craft.claptest', (g) => {
  for (const sx of [-1, 1]) {
    const x = sx * 0.42;
    g.mat('cast', '#2a2622'); g.box(x - 0.2, 0, -0.15, x + 0.2, 0.03, 0.15, { faces: 'xXYzZ' }); g.tube([[x, 0.03, 0], [x, 0.4, 0]], 0.015, { segs: 5, caps: false });
    if (sx < 0) { g.mat('paint', '#d9d2c2', { rough: -0.3 }); g.box(x - 0.36, 0.4, -0.02, x + 0.36, 1.9, 0.02, { faces: 'xXyYzZ' }); }
    else { g.mat('wood', '#4a3424'); g.box(x - 0.36, 0.4, -0.03, x + 0.36, 1.9, 0.0, { faces: 'xXyYz' }); g.mat('felt', '#8a2f3c'); g.box(x - 0.34, 0.42, 0.0, x + 0.34, 1.88, 0.05, { faces: 'xXyYZ' }); g.mat('felt', '#d6a640'); g.box(x - 0.34, 1.1, 0.05, x + 0.34, 1.14, 0.055, { faces: 'YZ' }); }
  }
  return { solid: [[-0.8, 0, -0.15, 0.8, 1.9, 0.15]], tier: 's' };
});

// A music stand with a page of music, lean: three feet, a rod, a sloping desk and two pages. p: { metal }
defineProp('shops-craft.stand', (g, p) => {
  g.mat('cast', p.metal || '#2a2622');
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5; g.tube([[Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26], [0, 0.32, 0]], 0.008, { segs: 3, caps: false }); }
  g.tube([[0, 0.32, 0], [0, 1.12, 0]], 0.011, { segs: 4, caps: false });
  g.push(); g.move(0, 1.12, 0.0); g.rotX(-0.35);
  g.box(-0.25, 0, -0.012, 0.25, 0.34, 0.0, { faces: 'zZ' }); g.box(-0.25, -0.01, -0.012, 0.25, 0.02, 0.05, { faces: 'YZ' });
  g.mat('paper', '#efe6d2'); g.box(-0.22, 0.02, 0.0, 0.0, 0.33, 0.004, { faces: 'Z' }); g.box(0.0, 0.02, 0.0, 0.22, 0.33, 0.004, { faces: 'Z' });
  g.mat('plain', '#3a3430'); for (let s = 0; s < 6; s++) { const y = 0.3 - s * 0.045; g.box(-0.2, y - 0.024, 0.004, -0.02, y, 0.005, { faces: 'Z' }); g.box(0.02, y - 0.024, 0.004, 0.2, y, 0.005, { faces: 'Z' }); }
  g.pop();
  return { posts: [[0, 0, 0.12, 0, 1.3]] };
});
// A shallow box of buttons in compartments, lean. p: { wood }
defineProp('shops-craft.buttons', (g, p) => {
  const r = new Rng(hashStr('btn2')), cols = ['#b08a45', '#2a2622', '#e9e1cf', '#7a2d22', '#2f6f8f', '#6c9a4c', '#d6a640', '#5b4060', '#c9c4bb'];
  g.mat('wood', p.wood || '#7a5233'); g.box(-0.2, 0, -0.13, 0.2, 0.012, 0.13, { faces: 'Y' });
  for (const x of [-0.2, -0.067, 0.067, 0.2]) g.box(x - 0.006, 0, -0.13, x + 0.006, 0.05, 0.13, { faces: 'xXYZ' });
  for (const z of [-0.13, 0, 0.13]) g.box(-0.2, 0, z - 0.006, 0.2, 0.05, z + 0.006, { faces: 'YzZ' });
  for (let cx = 0; cx < 3; cx++) for (let cz = 0; cz < 2; cz++) for (let i = 0; i < 7; i++) { g.mat(r.chance(0.3) ? 'cast' : 'glaze', cols[r.i(0, cols.length - 1)], { rough: -0.2 }); const bx = -0.133 + cx * 0.133 + r.f(-0.045, 0.045), bz = -0.065 + cz * 0.13 + r.f(-0.045, 0.045), br = r.f(0.008, 0.013), by = 0.012 + r.f(0, 0.02); g.box(bx - br, by, bz - br, bx + br, by + 0.004, bz + br, { faces: 'Y' }); }
  return { cast: false };
});
// A plain ladder-back chair to wait in, lean. p: { wood, seat }
defineProp('shops-craft.seat', (g, p) => {
  const wood = p.wood || '#4a3020';
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) { g.box(sx * 0.2 - 0.018, 0, 0.16, sx * 0.2 + 0.018, 0.44, 0.196, { faces: 'xXzZ' }); g.box(sx * 0.2 - 0.02, 0, -0.21, sx * 0.2 + 0.02, 0.98, -0.17, { faces: 'xXYzZ' }); }
  for (const yy of [0.62, 0.78, 0.92]) g.box(-0.19, yy - 0.025, -0.205, 0.19, yy + 0.025, -0.18, { faces: 'yYzZ' });
  g.box(-0.2, 0.15, 0.17, 0.2, 0.18, 0.19, { faces: 'yYzZ' });
  g.mat('weave', p.seat || '#8a2f3c'); g.box(-0.21, 0.42, -0.19, 0.21, 0.47, 0.2, { faces: 'xXYzZ' });
  return { posts: [[0, 0, 0.22, 0, 0.47]], spots: [{ type: 'sit', x: 0, y: 0.47, z: 0.02, yaw: 0 }], tier: 's' };
});
