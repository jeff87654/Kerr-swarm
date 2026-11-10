// The letter room: Jory's book room on Wick Court. A hushed brown room of paper books, felt and pigeon-holes, where long
// letters from across the Shade are read aloud once to whoever is in the chairs.
import { floor, lamp } from '../world/kit.js';
import { room, shopfront } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door, doorFrame } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { SIGNS } from '../content/signs.js';
import { PLACES } from '../content/places.js';
import { MENUS } from '../content/menus.js';
import { dynMesh, proxyScope, every, speaker, talk, found, give, bookRow } from './studio_parts.js';

const X0 = -17, X1 = -3.5, Z0 = 20, Z1 = 31, H = 3.2;
const WX0 = X0 + 0.16, WX1 = X1 - 0.16, WZ1 = Z1 - 0.16;          // inner wall faces (west, east, back)
const WOOD = '#4a3222', WOOD2 = '#5e3f29', BRASS = '#b08a45', FELT_RUST = '#8c3b26', FELT_OCHRE = '#b7832f', FELT_TEAL = '#1f4f55', FELT_PLUM = '#4f2f45';
const SPINES = ['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f', '#5b4060', '#a0522d', '#2b3a4a', '#6e2f3f', '#c9a96a', '#40504a', '#8c3b26', '#1f3b4d', '#b5653a', '#d6c49a', '#3a2a22'];
const TAPES = ['#e0b04a', '#3fa7a3', '#d95d7a', '#e8743b', '#8fd694', '#f2e6c8'];

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------

// An old upholstered armchair. p: { fabric, mat, wood, wing, mend (thread colour), patch (patch colour), mendAt: 'arm' | 'seat' | 'back' }
defineProp('books.armchair', (g, p) => {
  const fab = p.fabric || '#7a2f2a', m = p.mat || 'weave', wood = p.wood || '#3b2618';
  const piping = shadeHex(fab, 0.72);
  g.mat('wood', wood, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.lathe(sx * 0.33, sz * 0.3, [[0.03, 0], [0.026, 0.03], [0.034, 0.07], [0.04, 0.12]], { segs: 8 });
  g.mat(m, fab, { rough: 0.05 });
  g.box(-0.41, 0.12, -0.38, 0.41, 0.38, 0.37, { bevel: 0.02, aoBottom: 0.6 });                    // body
  g.box(-0.3, 0.37, -0.25, 0.3, 0.47, 0.39, { bevel: 0.045 });                                     // seat cushion
  for (const sx of [-1, 1]) {
    g.box(sx * 0.41 - (sx > 0 ? 0.13 : 0), 0.12, -0.38, sx * 0.41 + (sx > 0 ? 0 : 0.13), 0.6, 0.37, { bevel: 0.02 });   // arm
    g.tube([[sx * 0.345, 0.6, -0.36], [sx * 0.35, 0.615, 0.33]], 0.07, { segs: 10 });                // rolled arm top
  }
  g.box(-0.41, 0.36, -0.44, 0.41, p.wing ? 1.08 : 0.96, -0.27, { bevel: 0.03 });
  g.tube([[-0.36, p.wing ? 1.06 : 0.94, -0.36], [0.36, p.wing ? 1.06 : 0.94, -0.36]], 0.075, { segs: 10 });                   // back
  g.push(); g.move(0, 0.47, -0.27); g.rotX(-0.14); g.box(-0.29, 0, 0, 0.29, 0.44, 0.11, { bevel: 0.05 }); g.pop();   // back cushion
  if (p.wing) for (const sx of [-1, 1]) g.box(sx * 0.41 - (sx > 0 ? 0.09 : 0), 0.6, -0.44, sx * 0.41 + (sx > 0 ? 0 : 0.09), 1.04, -0.1, { bevel: 0.04 });
  g.mat(m, piping); g.tube([[-0.4, 0.38, 0.375], [0.4, 0.38, 0.375]], 0.012, { segs: 5 });
  // the mend: a patch in another cloth, stitched round in bright thread
  if (p.mend) {
    const pc = p.patch || '#d9b25c', th = p.mend;
    let pts;
    if (p.mendAt === 'seat') { g.mat('knit', pc); g.box(-0.12, 0.47, 0.06, 0.1, 0.476, 0.26, { faces: 'Y' }); pts = [[-0.12, 0.478, 0.06], [0.1, 0.478, 0.06], [0.1, 0.478, 0.26], [-0.12, 0.478, 0.26]]; }
    else if (p.mendAt === 'back') { g.mat('knit', pc); g.box(-0.14, 0.7, -0.27, 0.12, 0.88, -0.264, { faces: 'Z' }); pts = [[-0.14, 0.7, -0.262], [0.12, 0.7, -0.262], [0.12, 0.88, -0.262], [-0.14, 0.88, -0.262]]; }
    else { g.mat('knit', pc); g.box(0.27, 0.62, 0.0, 0.42, 0.685, 0.22, { bevel: 0.01 }); pts = [[0.27, 0.69, 0.0], [0.42, 0.69, 0.0], [0.42, 0.69, 0.22], [0.27, 0.69, 0.22]]; }
    g.mat('weave', th, { rough: -0.1 });
    for (let i = 0; i < 4; i++) {
      const a = pts[i], b = pts[(i + 1) % 4];
      for (let k = 0; k < 5; k++) { const t = (k + 0.5) / 5; const c = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; const dx = (b[2] - a[2]) ? 0.012 : 0, dz = (b[0] - a[0]) ? 0.012 : 0, dy = (p.mendAt === 'back' && (b[0] - a[0])) ? 0.012 : 0;
        g.tube([[c[0] - dx, c[1] - dy, c[2] - dz + (p.mendAt === 'back' ? dz : 0)], [c[0] + dx, c[1] + dy, c[2] + dz - (p.mendAt === 'back' ? dz : 0)]], 0.003, { segs: 3, caps: false }); }
    }
  }
  return { solid: [[-0.42, 0, -0.45, 0.42, 0.55, 0.38]], spots: [{ type: 'sit', x: 0, y: 0.47, z: 0.06, yaw: 0, tags: ['read'] }], tier: 's' };
});

// A reading lectern: cross feet, a turned column, a sloping desk. The reader stands at -z; the room sees the +z side.
defineProp('books.lectern', (g, p) => {
  const wood = p.wood || '#4e3322';
  g.mat('wood', wood, { rough: -0.08 });
  g.box(-0.3, 0, -0.04, 0.3, 0.06, 0.04, { bevel: 0.015 }); g.box(-0.04, 0, -0.26, 0.04, 0.06, 0.26, { bevel: 0.015 });
  g.lathe(0, 0, [[0.08, 0.06], [0.06, 0.1], [0.045, 0.2], [0.055, 0.5], [0.04, 0.8], [0.05, 0.95], [0.09, 0.99]], { segs: 12 });
  g.push(); g.move(0, 1.04, 0); g.rotX(0.32);
  g.box(-0.31, -0.03, -0.22, 0.31, 0.02, 0.22, { bevel: 0.012 });
  g.box(-0.31, 0.02, -0.235, 0.31, 0.06, -0.205, { bevel: 0.006 });                // the ledge the paper rests on
  g.mat('cast', BRASS); g.box(-0.29, 0.02, 0.15, 0.29, 0.026, 0.18, { faces: 'Y' });
  g.pop();
  return { posts: [[0, 0, 0.18, 0, 1.1]], spots: [{ type: 'perform', x: 0, y: 0, z: -0.55, yaw: Math.PI, tags: ['reading', 'read'] }] };
});

// A standard lamp with a pleated cloth shade (the light is added by the caller). p: { shade, h }
defineProp('books.standard', (g, p) => {
  const h = p.h || 1.5;
  g.mat('cast', '#6b5434'); g.lathe(0, 0, [[0.16, 0], [0.15, 0.025], [0.05, 0.05], [0.018, 0.08], [0.014, h - 0.2], [0.02, h - 0.15]], { segs: 12 });
  g.mat('weave', p.shade || '#d9a24e', { emissive: 0.9, lamp: true }); g.lathe(0, 0, [[0.24, h - 0.3], [0.13, h + 0.02]], { segs: 14, capBottom: false, capTop: false });
  g.mat('weave', shadeHex(p.shade || '#d9a24e', 0.6)); g.tube([[0.24, h - 0.3, 0], [0.24, h - 0.3, 0.0001]], 0.001, { segs: 3 });
  return { posts: [[0, 0, 0.16, 0, h]], cast: true };
});

// A banker's lamp with a green glass shade. The light is added by the caller.
defineProp('books.greenlamp', (g) => {
  g.mat('cast', BRASS); g.lathe(0, 0, [[0.08, 0], [0.075, 0.018], [0.03, 0.03], [0.012, 0.04], [0.01, 0.3]], { segs: 12 });
  g.tube([[0, 0.3, 0], [0, 0.33, 0.04]], 0.008, { segs: 5 });
  g.mat('glaze', '#1d6a48', { rough: -0.3 });
  g.push(); g.move(0, 0.34, 0.06); g.rotZ(Math.PI / 2); g.lathe(0, 0, [[0.055, -0.14], [0.06, -0.12], [0.06, 0.12], [0.055, 0.14]], { segs: 12 }); g.pop();
  g.mat('diffuser', '#ffd9a0', { emissive: 4, lamp: true }); g.box(-0.12, 0.3, 0.03, 0.12, 0.305, 0.09, { faces: 'y' });
  g.mat('cast', BRASS); g.tube([[0.02, 0.3, 0.06], [0.02, 0.2, 0.07]], 0.002, { segs: 3 }); g.ball(0.02, 0.2, 0.07, 0.007, 0.007, 0.007, { segs: 6, rings: 4 });
  return { cast: false };
});

// A book press: two boards, an iron frame and a screw with a wheel.
defineProp('books.press', (g) => {
  g.mat('wood', '#6b4a2f'); g.box(-0.2, 0, -0.17, 0.2, 0.05, 0.17, { bevel: 0.01 });
  g.mat('paper', '#7a2f2a'); g.box(-0.15, 0.05, -0.12, 0.14, 0.11, 0.12, { bevel: 0.004 });
  g.mat('paper', '#2f4f6f'); g.box(-0.14, 0.11, -0.12, 0.15, 0.16, 0.11, { bevel: 0.004 });
  g.mat('wood', '#6b4a2f'); g.box(-0.18, 0.16, -0.15, 0.18, 0.2, 0.15, { bevel: 0.008 });
  g.mat('cast', '#2b2b2b');
  for (const sx of [-1, 1]) g.box(sx * 0.22 - 0.02, 0, -0.03, sx * 0.22 + 0.02, 0.42, 0.03, { bevel: 0.006 });
  g.box(-0.24, 0.38, -0.035, 0.24, 0.43, 0.035, { bevel: 0.008 });
  g.cyl(0, 0.2, 0, 0.018, 0.32, { segs: 8 });
  const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ring.push([Math.cos(a) * 0.11, 0.5, Math.sin(a) * 0.11]); }
  g.tube(ring, 0.009, { segs: 5, closed: true });
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.tube([[0, 0.5, 0], [Math.cos(a) * 0.11, 0.5, Math.sin(a) * 0.11]], 0.006, { segs: 4, caps: false }); }
  return { cast: true };
});

// ---------------------------------------------------------------------------------------------------------------
// Drawing helpers (local space of a shelf: the run is along +x from 0, the back at z = 0, the books face +z)
// ---------------------------------------------------------------------------------------------------------------

// A light row of books (no bevels, only the faces you can see), with bright tape on some mended spines.
function bookLite(g, a0, a1, y, hmax, r, o = {}) {
  let a = a0 + 0.01;
  while (a < a1 - 0.03) {
    if (r.chance(o.gap || 0.05)) { a += r.f(0.03, 0.1); continue; }
    const t = r.f(0.02, 0.055), h = hmax * r.f(0.6, 1), d = r.f(0.17, 0.25);
    if (a + t > a1) break;
    const col = mixHex(r.pick(SPINES), r.chance(0.5) ? '#1e1610' : '#e8dcc4', r.f(0, 0.22));
    g.mat(r.chance(0.3) ? 'leather' : 'paper', col, { rough: r.f(-0.1, 0.15) });
    g.box(a, y, 0.03, a + t, y + h, 0.03 + d, { faces: 'xXYZ' });
    if (r.chance(0.12)) { g.mat('weave', r.pick(TAPES), { rough: -0.1 }); g.box(a - 0.001, y + h * 0.35, 0.03 + d, a + t + 0.001, y + h * 0.5, 0.034 + d, { faces: 'Zxx' }); }
    else if (r.chance(0.4)) { g.mat('paper', '#d8b860', { rough: -0.25 }); g.box(a + 0.003, y + h * 0.78, 0.03 + d, a + t - 0.003, y + h * 0.8, 0.033 + d, { faces: 'Z' }); }
    a += t + 0.002;
  }
}
// A stack of books lying flat, centred at (cx, y) with front edges toward +z.
function bookStack(g, cx, y, n, r) {
  let yy = y;
  for (let i = 0; i < n; i++) {
    const w = r.f(0.16, 0.26), d = r.f(0.13, 0.2), t = r.f(0.025, 0.05);
    g.mat(r.chance(0.3) ? 'leather' : 'paper', mixHex(r.pick(SPINES), '#e8dcc4', r.f(0, 0.2)));
    g.push(); g.move(cx + r.f(-0.02, 0.02), yy, 0.04 + d / 2); g.rotY(r.f(-0.12, 0.12)); g.box(-w / 2, 0, -d / 2, w / 2, t, d / 2, { faces: 'xXYzZ' }); g.pop();
    yy += t;
  }
  return yy;
}

// A floor-to-ceiling run of shelves. (ox, oz) is the local origin on the floor, yaw turns local +z (the books' faces) into the room.
const BOARDS = [0.1, 0.48, 0.86, 1.24, 1.62, 2.0, 2.38, 2.76];
function shelfRun(s, ox, oz, yaw, L, seed, o = {}) {
  const g = s.g, D = 0.34, r = new Rng(seed);
  const bays = Math.max(1, Math.round(L / 0.88)), bw = L / bays;
  s.furniture(() => {
    g.at(ox, 0, oz, yaw);
    g.mat('wood', WOOD, { rough: -0.04 });
    g.box(0, 0, 0, L, H, 0.012, { faces: 'Z' });                                      // back boards
    g.mat('wood', shadeHex(WOOD, 0.8)); g.box(0, 0, 0.02, L, 0.1, D - 0.02, { faces: 'ZxX', aoBottom: 0.6 });   // plinth
    g.mat('wood', WOOD, { rough: -0.04 });
    for (let i = 0; i <= bays; i++) { const x = i * bw; g.box(x - 0.022, 0, 0, x + 0.022, 3.0, D, { bevel: 0.006 }); }
    for (const y of BOARDS) g.box(0, y - 0.025, 0.012, L, y, D - 0.01, { faces: 'yYZ' });
    g.mat('wood', WOOD2, { rough: -0.06 }); g.box(-0.03, 3.0, 0, L + 0.03, 3.08, D + 0.04, { bevel: 0.01 }); g.box(-0.04, 3.08, 0, L + 0.04, 3.18, D + 0.07, { bevel: 0.015 });
    g.pop();
  });
  s.detail(() => {
    g.at(ox, 0, oz, yaw);
    for (let b = 0; b < bays; b++) {
      const a0 = b * bw + 0.025, a1 = (b + 1) * bw - 0.025;
      for (let k = 0; k < BOARDS.length; k++) {
        const y = BOARDS[k], room = (k < BOARDS.length - 1 ? BOARDS[k + 1] - 0.025 : 3.0) - y - 0.03;
        const roll = r.next();
        if (o.sparse && k === 0) continue;
        if (roll < 0.12) {                                     // a stack lying flat, then books
          const top = bookStack(g, a0 + 0.14, y, r.i(3, 6), r);
          if (r.chance(0.3) && top < y + room - 0.1) { g.mat('cast', BRASS); g.lathe(a0 + 0.14, 0.15, [[0.03, top], [0.035, top + 0.01], [0.02, top + 0.05], [0.03, top + 0.07], [0, top + 0.075]], { segs: 8 }); }
          bookLite(g, a0 + 0.3, a1, y, Math.min(room, 0.33), r);
        } else if (roll < 0.17) {                              // a gap with a bookend and a few leaning
          g.mat('cast', '#3a3530'); g.box(a0 + 0.2, y, 0.06, a0 + 0.21, y + 0.16, 0.2); g.box(a0 + 0.2, y, 0.06, a0 + 0.29, y + 0.008, 0.2);
          bookLite(g, a0 + 0.21, a1, y, Math.min(room, 0.3), r, { gap: 0.02 });
        } else if (roll < 0.21 && k > 1 && k < 6) {            // something that is not a book
          const kind = r.i(0, 2), cx = (a0 + a1) / 2 + r.f(-0.15, 0.15);
          if (kind === 0) { g.mat('glaze', r.pick(['#8a5a3c', '#3d6f8a', '#c9b48a'])); g.lathe(cx, 0.17, [[0, y], [0.07, y], [0.09, y + 0.08], [0.085, y + 0.17], [0.06, y + 0.2], [0.065, y + 0.22], [0, y + 0.23]], { segs: 12 }); }
          else if (kind === 1) { g.mat('wood', '#7a5a3a'); g.box(cx - 0.14, y, 0.06, cx + 0.14, y + 0.11, 0.26, { bevel: 0.01 }); g.mat('cast', BRASS); g.box(cx - 0.02, y + 0.06, 0.26, cx + 0.02, y + 0.08, 0.265); }
          else { g.mat('cast', '#6b5434'); g.cyl(cx, y, 0.16, 0.05, 0.02, { segs: 10 }); g.cyl(cx, y + 0.02, 0.16, 0.012, 0.12, { segs: 6 }); g.mat('diffuser', '#ffcf8a', { emissive: 1.2, lamp: true }); g.ball(cx, y + 0.17, 0.16, 0.04, 0.05, 0.04, { segs: 8, rings: 6 }); }
          bookLite(g, a0, cx - 0.16, y, Math.min(room, 0.3), r); bookLite(g, cx + 0.16, a1, y, Math.min(room, 0.3), r);
        } else bookLite(g, a0, a1, y, Math.min(room, k === 0 ? 0.36 : 0.32), r);
      }
    }
    g.pop();
  });
}

// A felt hanging on a rod, hung flat against a wall. Runs from (ax, az) to (bx, bz) at the top y, down to y1; `out` is the
// small offset from the wall toward the room as [dx, dz].
function feltHanging(s, a, b, y0, y1, tint, out, o = {}) {
  const g = s.g;
  s.deco(() => {
    const ox = out[0], oz = out[1];
    g.mat('felt', tint, { rough: 0.1 });
    g.sheet([a[0] + ox, y0, a[1] + oz], [b[0] + ox, y0, b[1] + oz], [b[0] + ox, y1, b[1] + oz], [a[0] + ox, y1, a[1] + oz], { nu: 14, nv: 4, ripple: 0.025, rippleN: 9 });
    g.mat('cast', BRASS); g.tube([[a[0] + ox * 1.6 - (b[0] - a[0]) * 0.03, y0 + 0.03, a[1] + oz * 1.6 - (b[1] - a[1]) * 0.03], [b[0] + ox * 1.6 + (b[0] - a[0]) * 0.03, y0 + 0.03, b[1] + oz * 1.6 + (b[1] - a[1]) * 0.03]], 0.014, { segs: 8 });
    // a band and a mend
    if (o.band) { g.mat('felt', o.band); const yb = y1 + (y0 - y1) * 0.12; g.quad([a[0] + ox * 1.3, yb, a[1] + oz * 1.3], [b[0] + ox * 1.3, yb, b[1] + oz * 1.3], [b[0] + ox * 1.3, yb + 0.12, b[1] + oz * 1.3], [a[0] + ox * 1.3, yb + 0.12, a[1] + oz * 1.3], { double: true }); }
    if (o.mend) {
      const t = 0.7, mx = a[0] + (b[0] - a[0]) * t + ox * 1.4, mz = a[1] + (b[1] - a[1]) * t + oz * 1.4, my = y1 + (y0 - y1) * 0.55;
      const ux = (b[0] - a[0]) ? 0.13 : 0, uz = (b[1] - a[1]) ? 0.13 : 0;
      g.mat('knit', o.mend[0]); g.quad([mx - ux, my - 0.11, mz - uz], [mx + ux, my - 0.11, mz + uz], [mx + ux, my + 0.11, mz + uz], [mx - ux, my + 0.11, mz - uz], { double: true });
      g.mat('weave', o.mend[1]);
      for (let i = -3; i <= 3; i++) g.tube([[mx - ux * 1.12 + ox * 0.3, my + i * 0.03, mz - uz * 1.12 + oz * 0.3], [mx - ux * 0.85 + ox * 0.3, my + i * 0.03 + 0.012, mz - uz * 0.85 + oz * 0.3]], 0.003, { segs: 3, caps: false });
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// The letters
// ---------------------------------------------------------------------------------------------------------------

const LETTERS = [
  { id: 'dulse', label: 'From Dulse, Kelp Row', sub: '36.9 seconds by light', from: 'A letter from Dulse · 36.9 s', lines: [
    'To the Thursday table at the Ring 2 hall, by way of the letter room.',
    'Your cook slept here last year and taught our noodle pullers to lift the lid before they look. We do it now. Everybody does.',
    'We pull noodles on the third-g terrace. They hang three times as long up there and nobody minds the mess.',
    'Tell her the crock she left is still alive. It has a name now. We are not telling you the name.',
    'Thirty-six point nine seconds, which is the farthest anyone here has sent a thank-you.',
  ] },
  { id: 'ochre', label: 'From Ochre, Pigment Row', sub: '33.1 seconds by light', from: 'A letter from Ochre · 33.1 s', lines: [
    'For Oona the lamp-painter. She says anyone may read it, so here it is.',
    'Marit Vell asked me to match a colour she had seen from a back-crew sled behind our radiators. I did it in about ten minutes and she looked cross.',
    'It is not hard to grind. It is hard to see. I have looked at the River four times and never noticed its edges were that colour until she pointed.',
    'Send me your dawn when it has been played. I know you cannot send light. Send the score and I will try it on our ceiling.',
    'The grinder at Ochre. Thirty-three point one seconds.',
  ] },
  { id: 'sloe', label: 'From Sloe, Hedge Row', sub: '8.7 seconds by light', from: 'A letter from Sloe · 8.7 s', lines: [
    'To the letter room at Candlewick, from the reader at Sloe.',
    'Sloe is a wood drum and our wood is dim, and I have read long letters aloud under it for eleven years.',
    'Last month one came from across the Shade that took six years to reach us. The man who wrote it died four years ago. He was very funny.',
    'Everyone laughed in the right places, six years late, and then sat quite still.',
    'Read yours slowly. Nobody can ask him to say it again. Eight point seven seconds, with love.',
  ] },
];
// Tonight's letter: across the Shade, seven years by light. Read at eight on Thursday and on Booking Day.
const READING = [
  'Dear whoever is in the chairs.',
  'When you hear this it will be seven years old, and so will I, a bit.',
  'We have a long table here too. Ours is round, which settles nothing.',
  'My grandson is learning spinball. He throws anti, like everyone small.',
  'If your dawns are still painted, tell your painter we watch ours the same way: in silence, and then all talking at once.',
  'Write back. I will be very patient.',
];
const QUIET_READING = [
  'No new letters today, so Jory reads an old one, slowly.',
  '"I am writing this in the lamp-night, because the kays are cheap and the children are asleep."',
  '"By the time it reaches you they will be grown. Tell them I said so."',
  'He folds it along its old creases. Nobody coughs.',
];
const BORROW = [
  { id: 'hall-year', label: 'A Hall Cook\'s Year', sub: 'pencil in every margin' },
  { id: 'small-spinball', label: 'Spinball for the Small', sub: 'mended spine, teal tape' },
  { id: 'count-years', label: 'The Count Years', sub: 'a history in three hands' },
];

// ---------------------------------------------------------------------------------------------------------------
// The place
// ---------------------------------------------------------------------------------------------------------------

export const place = {
  id: 'books', name: 'The letter room', order: 51,
  build(game) {
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('books', f);
    const g = s.g;
    const P = PLACES.books;
    const CLIP = [X0 - 0.05, -0.2, Z0 - 0.05, X1 + 0.05, H + 0.1, Z1 + 0.05];

    // ---------- shell ----------
    room(s, { x0: X0, z0: Z0, x1: X1, z1: Z1, y: 0, h: H,
      floor: ['planks', '#6a4630'], ceil: ['plaster', '#5c4232'],
      wall: { tint: '#b48a5e', dado: { h: 1.0, mat: 'flute', tint: '#4e3424' }, skirt: '#2e1e14' },
      open: { n: [{ at: 2, w: 9.5, h: H }], e: [{ at: 1.4, w: 3.4, h: 1.5, sill: 0.9 }, { at: 5.6, w: 1.0, h: 2.1 }] },
      glow: { sky: '#ffcf98', ground: '#7a4e32', power: 0.15 } });
    // threshold onto Thread Street
    floor(s, X1, 25.6, X1 + 0.5, 26.6, 0.0, 'stone', '#8a7a66');

    // the front onto the court
    shopfront(s, { side: 'n', a0: -15, a1: -5.5, c: Z0 + 0.08, y: 0, h: H,
      fascia: Object.assign({}, SIGNS['books.fascia'], { palette: ['#3a1f17', '#f0e2c0', '#c9973f'], emblem: 'book' }),
      palette: { frame: '#3b2418', plinth: '#2a1a12', awning: ['#6e2a22', '#d9b25c'] },
      door: { at: 2.6, w: 1.1, kind: 'hinge', style: 'panel', tint: '#5a2e22', label: 'the letter room' }, awning: { depth: 0.9 }, glow: 0.7 });

    // the side door and window onto Thread Street
    door(s, { x: WX1 + 0.08, y: 0, z: 25.6, w: 1.0, h: 2.08, along: 'z', dir: 1, kind: 'hinge', style: 'panel', tint: '#3b2418', auto: true, label: 'Thread Street' });
    doorFrame(s, WX1 + 0.08, 0, 26.1, 1.0, 2.1, 'z', { tint: '#3b2418', depth: 0.24 });
    s.glass(WX1 + 0.08, 0.9, 21.4, WX1 + 0.08, 2.4, 24.8, { tint: '#d9e0d4' });
    s.structure(() => {
      g.mat('paint', '#3b2418');
      for (const z of [21.4, 22.53, 23.67, 24.8]) g.box(WX1 - 0.02, 0.9, z - 0.035, WX1 + 0.18, 2.4, z + 0.035, { bevel: 0.006 });
      g.box(WX1 - 0.02, 2.36, 21.4, WX1 + 0.18, 2.44, 24.8, { bevel: 0.006 }); g.box(WX1 - 0.02, 1.62, 21.4, WX1 + 0.18, 1.66, 24.8);
      g.mat('wood', '#5e3f29'); g.box(WX1 - 0.12, 0.86, 21.3, WX1 + 0.22, 0.92, 24.9, { bevel: 0.01 });      // sill
    });

    // ---------- the ceiling: beams, felt baffles, pipes ----------
    s.structure(() => {
      g.mat('wood', '#3a2618');
      for (const x of [-14.0, -10.0, -6.2]) g.box(x - 0.09, 2.98, Z0 + 0.1, x + 0.09, H, WZ1, { bevel: 0.01, faces: 'xXyzZ' });
      g.mat('cast', '#a8693a'); g.tube([[WX0 + 0.1, 3.06, 20.6], [WX1 - 0.1, 3.06, 20.6]], 0.035, { segs: 8 });
      g.mat('paint', '#4f5a52'); g.tube([[WX0 + 0.1, 3.05, 20.85], [WX1 - 0.1, 3.05, 20.85]], 0.05, { segs: 8 });
      for (const x of [-15.5, -12, -8, -4.5]) { g.mat('cast', '#3a3530'); g.box(x - 0.02, 2.98, 20.5, x + 0.02, H, 20.95); }
    });
    // felt baffles hung along the room's length, so from the door you see them edge on, receding
    const baffle = ['#6e3424', '#7a5a2e', '#2a4a4a', '#4a3040', '#6e3424', '#2a4a4a', '#7a5a2e', '#4a3040', '#6e3424'];
    s.deco(() => {
      const runs = [];
      for (const x of [-15.5, -12.9, -7.2, -4.7]) { runs.push([x, 21.3, 25.4]); runs.push([x, 26.1, 29.9]); }
      for (const x of [-11.2, -8.8]) runs.push([x, 21.3, 25.0]);
      runs.forEach((r, i) => {
        g.mat('felt', baffle[i % baffle.length], { rough: 0.15 });
        g.sheet([r[0], 2.98, r[1]], [r[0], 2.98, r[2]], [r[0], 2.7, r[2]], [r[0], 2.7, r[1]], { nu: 8, nv: 2, ripple: 0.015, rippleN: 9 });
        g.mat('cast', '#3a3530'); g.tube([[r[0], 2.99, r[1]], [r[0], 2.99, r[2]]], 0.007, { segs: 4 });
        for (const z of [r[1] + 0.1, r[2] - 0.1]) g.tube([[r[0], 2.99, z], [r[0], H, z]], 0.003, { segs: 3, caps: false });
      });
    });
    // a ring of felt over the reading circle
    s.deco(() => {
      const cx = -10, cz = 28.0, n = 28;
      for (let i = 0; i < n; i++) {
        const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2, r = 1.75;
        g.mat('felt', '#5e2620', { rough: 0.15 });
        g.quad([cx + Math.cos(a0) * r, 2.98, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, 2.98, cz + Math.sin(a1) * r], [cx + Math.cos(a1) * r, 2.76, cz + Math.sin(a1) * r], [cx + Math.cos(a0) * r, 2.76, cz + Math.sin(a0) * r], { double: true });
      }
      g.mat('weave', '#c9973f'); const ring = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ring.push([cx + Math.cos(a) * 1.752, 2.79, cz + Math.sin(a) * 1.752]); } g.tube(ring, 0.006, { segs: 4, closed: true });
    });

    // ---------- shelves: back, west, east ----------
    shelfRun(s, -11.7, WZ1, Math.PI, -11.7 - WX0, 11);        // back wall, west of the hanging
    shelfRun(s, WX1, WZ1, Math.PI, WX1 - -8.3, 12);                                    // back wall, east of the hanging
    shelfRun(s, WX0, 30.5, Math.PI / 2, 30.5 - 26.0, 13);                              // west wall, behind the reading circle
    shelfRun(s, WX1, 27.0, -Math.PI / 2, 30.5 - 27.0, 14);                             // east wall, by the side door
    for (const b of [[WX0, 30.5, -11.7, WZ1], [-8.3, 30.5, WX1, WZ1]]) s.solid(b[0], 0, b[1], b[2], H, b[3]);
    s.solid(WX0, 0, 26.0, WX0 + 0.34, H, 30.5); s.solid(WX1 - 0.34, 0, 27.0, WX1, H, 30.5);

    // the brass rail and the ladder
    s.furniture(() => {
      g.mat('cast', BRASS, { rough: -0.2 });
      const rz = WZ1 - 0.44;
      g.tube([[WX0 + 0.1, 2.55, rz], [WX1 - 0.1, 2.55, rz]], 0.018, { segs: 8 });
      for (let x = WX0 + 0.3; x < WX1; x += 1.6) { if (x > -11.8 && x < -8.2) continue; g.tube([[x, 2.55, rz], [x, 2.55, WZ1 - 0.33]], 0.012, { segs: 6 }); }
      // the ladder hooks on at the top and stands on brass wheels
      const lx = -15.9, top = [2.6, rz - 0.02], foot = [0.0, 29.62];
      g.mat('wood', '#7a5233', { rough: -0.05 });
      for (const sx of [-0.22, 0.22]) g.box(lx + sx - 0.025, 0, foot[1] - 0.03, lx + sx + 0.025, 0.04, foot[1] + 0.03);
      for (const sx of [-0.22, 0.22]) g.tube([[lx + sx, 0.06, foot[1]], [lx + sx, top[0], top[1]]], 0.024, { segs: 6 });
      for (let i = 1; i < 10; i++) { const t = i / 10, y = 0.06 + (top[0] - 0.06) * t, z = foot[1] + (top[1] - foot[1]) * t; g.box(lx - 0.22, y - 0.015, z - 0.04, lx + 0.22, y + 0.015, z + 0.04, { bevel: 0.005 }); }
      g.mat('cast', BRASS);
      for (const sx of [-0.22, 0.22]) { g.tube([[lx + sx, top[0], top[1]], [lx + sx, top[0] + 0.06, top[1] + 0.03], [lx + sx, top[0] - 0.02, top[1] + 0.08]], 0.01, { segs: 5 }); g.cyl(lx + sx, 0, foot[1] - 0.05, 0.035, 0.03, { segs: 8 }); }
    });
    s.solid(-16.15, 0, 29.5, -15.65, 1.0, 29.9);

    // ---------- the big hanging behind the lectern ----------
    feltHanging(s, [-11.55, WZ1], [-8.45, WZ1], 2.95, 0.35, '#58201a', [0, -0.06], { band: '#d9b25c', mend: ['#3fa7a3', '#f2e6c8'] });
    s.deco(() => {
      // a row of stitches along the top, one for every letter read here
      g.mat('weave', '#f0d8a0');
      for (let i = 0; i < 26; i++) { const x = -11.3 + i * 0.105, y = 2.55 - (i % 3) * 0.02; g.tube([[x, y, WZ1 - 0.075], [x + 0.05, y - 0.035, WZ1 - 0.075]], 0.004, { segs: 3, caps: false }); }
    });

    // ---------- the reading circle ----------
    const C = [-10, 28.75];
    prop(s, 'rug', -10, 0, 27.9, 0, { w: 6.2, d: 4.4, a: '#6e2a22', b: '#c9973f', mat: 'motif' });
    prop(s, 'rug', -11.85, 0, 22.4, 0, { w: 1.2, d: 2.6, a: '#3d4a3a', b: '#b7832f', mat: 'stripe' });
    prop(s, 'books.lectern', -10, 0, 29.55, Math.PI, {});
    // the sealed letter on the lectern
    s.detail(() => {
      g.push(); g.move(-10, 1.06, 29.55); g.rotX(-0.32);
      g.mat('paper', '#efe3c8'); g.box(-0.13, 0.02, -0.09, 0.13, 0.045, 0.09, { bevel: 0.004 });
      g.mat('paper', '#b0302a'); g.box(-0.02, 0.044, -0.092, 0.02, 0.047, 0.092);
      g.pop();
    });
    // a small clip lamp on the lectern and a standard lamp beside it
    s.deco(() => {
      g.mat('cast', BRASS); g.tube([[-10.25, 1.12, 29.72], [-10.25, 1.38, 29.75], [-10.12, 1.45, 29.68]], 0.007, { segs: 5 });
      g.mat('cast', '#2f4a3a'); g.lathe(-10.1, 29.66, [[0.045, 1.37], [0.03, 1.45], [0.012, 1.47]], { segs: 10, capBottom: false });
      g.mat('diffuser', '#ffd9a0', { emissive: 5, lamp: true }); g.cyl(-10.1, 1.375, 29.66, 0.035, 0.004, { segs: 8 });
    });
    s.light({ at: [-10.1, 1.33, 29.62], color: [1, 0.72, 0.42], power: 1.2, range: 2.6, clip: CLIP, lamp: true, radius: 0.04 });
    prop(s, 'books.standard', -11.2, 0, 29.95, 0, { shade: '#d9a24e', h: 1.55 });
    lamp(s, 'bulb', -11.2, 1.4, 29.95, { K: 2600, power: 0.9, range: 4.5, clip: CLIP });
    // the pendant over the circle, low
    lamp(s, 'lantern', -10, 2.25, 28.0, { tint: '#e0a050', r: 0.32, hh: 0.36, drop: 0.55, power: 0.9, range: 6, clip: CLIP, K: 2700 });
    // a wash on the hanging
    s.light({ at: [-10, 2.9, 29.6], type: 'spot', dir: [0, -0.55, 0.83], cone: [55, 25], color: [1, 0.6, 0.34], power: 1.0, range: 4, clip: CLIP, lamp: true, shadow: true });
    s.deco(() => { g.mat('cast', '#3a3530'); g.cyl(-10, 3.12, 29.6, 0.06, 0.08, { segs: 8 }); g.mat('diffuser', '#ffd090', { emissive: 3, lamp: true }); g.cyl(-10, 3.11, 29.6, 0.04, 0.01, { segs: 8 }); });

    // armchairs: no two alike, every one mended
    const CHAIRS = [
      { th: -80, p: { fabric: '#2f5f5a', mat: 'weave', wing: true, mend: '#e0b04a', patch: '#8c3b26', mendAt: 'arm' }, name: 'the teal wing chair' },
      { th: -50, p: { fabric: '#8a5a2a', mat: 'leather', mend: '#3fa7a3', patch: '#5b3a22', mendAt: 'seat', wood: '#2a1a10' }, name: 'the oilcloth armchair' },
      { th: -20, p: { fabric: '#7a2f3a', mat: 'motif', mend: '#f2e6c8', patch: '#d9b25c', mendAt: 'back' }, name: 'the red armchair' },
      { th: 20, p: { fabric: '#c9973f', mat: 'stripe', mend: '#d95d7a', patch: '#2f4f6f', mendAt: 'arm' }, name: 'the striped armchair' },
      { th: 50, p: { fabric: '#4f3a5a', mat: 'knit', wing: true, mend: '#8fd694', patch: '#c9b48a', mendAt: 'seat' }, name: 'the plum wing chair' },
      { th: 80, p: { fabric: '#5e6a3a', mat: 'carpet', mend: '#e8743b', patch: '#7a2f2a', mendAt: 'back' }, name: 'the green armchair' },
    ];
    const seats = [];
    for (const ch of CHAIRS) {
      const th = ch.th * Math.PI / 180, R = 2.55;
      const x = C[0] + Math.sin(th) * R, z = C[1] - Math.cos(th) * R, yaw = -th;
      prop(s, 'books.armchair', x, 0, z, yaw, ch.p, { noSpots: true });
      s.spot('sit', x + Math.sin(yaw) * 0.06, 0.47, z + Math.cos(yaw) * 0.06, yaw, { tags: ['read'] });
      seats.push({ x, z, yaw, name: ch.name });
    }
    // cushions on the rug for the latecomers ("bring a cushion")
    s.detail(() => {
      const cols = ['#d95d7a', '#3fa7a3', '#e0b04a', '#8c3b26'];
      [[-11.1, 27.4], [-9.1, 27.2], [-10.5, 26.7], [-8.6, 28.0]].forEach((p, i) => { g.mat(i % 2 ? 'motif' : 'knit', cols[i]); g.ball(p[0], 0.07, p[1], 0.26, 0.08, 0.24, { segs: 12, rings: 6 }); g.mat('weave', '#f2e6c8'); g.ball(p[0], 0.145, p[1], 0.03, 0.012, 0.03, { segs: 6, rings: 3 }); });
    });
    for (const p of [[-11.1, 27.4], [-9.1, 27.2], [-10.5, 26.7], [-8.6, 28.0]]) s.spot('sit', p[0], 0.15, p[1], Math.atan2(C[0] - p[0], C[1] + 0.8 - p[1]), { tags: ['read', 'low', 'cushion'] });
    // a low side table by the leather chair with a lidded cup and a book face down
    prop(s, 'table', -12.55, 0, 26.9, 0, { round: true, w: 0.46, h: 0.5, wood: '#3a2618' });
    prop(s, 'cup', -12.6, 0.5, 26.85, 0, { glaze: '#3d6f8a' });
    s.detail(() => { g.mat('paper', '#2f4f6f'); g.push(); g.move(-12.45, 0.5, 26.98); g.rotY(0.4); g.box(-0.08, 0, -0.06, 0.08, 0.03, 0.06); g.pop(); });
    prop(s, 'table', -7.5, 0, 26.9, 0, { round: true, w: 0.46, h: 0.5, wood: '#5e3f29' });
    prop(s, 'bowl', -7.5, 0.5, 26.9, 0, { glaze: '#c9b48a', lid: '#8a5a3c', r: 0.07 });

    // ---------- Jory's counter and the pigeon-holes ----------
    prop(s, 'counter', -15.1, 0, 23.2, Math.PI / 2, { w: 2.2, d: 0.6, body: '#3b2418', top: '#7a5233' }, { noSpots: true });
    s.spot('counter', -15.85, 0, 23.2, Math.PI / 2, { who: 'jory', tags: ['books'] });
    s.spot('customer', -14.25, 0, 23.0, -Math.PI / 2, { tags: ['books'] });
    s.spot('queue', -14.1, 0, 21.9, -Math.PI / 2, { tags: ['books'] });
    // on the counter: the loans ledger, a lamp, a tray of letters, a lidded cup, a rack of cards home
    s.detail(() => {
      g.mat('leather', '#3a2a22'); g.box(-15.25, 0.92, 22.35, -14.95, 0.94, 22.8);
      g.mat('paper', '#efe3c8'); g.box(-15.23, 0.94, 22.37, -14.97, 0.955, 22.57); g.box(-15.23, 0.94, 22.59, -14.97, 0.952, 22.78);
      g.mat('cast', '#2b2b2b'); g.tube([[-15.0, 0.957, 22.5], [-14.99, 0.958, 22.66]], 0.004, { segs: 4 });
      g.mat('wood', '#7a5a3a'); g.box(-15.3, 0.92, 23.3, -14.95, 0.97, 23.75, { bevel: 0.006 });
      const r = new Rng(77);
      for (let i = 0; i < 7; i++) { g.mat('paper', r.pick(['#efe3c8', '#e6d6b0', '#d8e0e8', '#f0d0c0'])); g.box(-15.27, 0.935 + i * 0.006, 23.33 + r.f(0, 0.03), -14.99, 0.94 + i * 0.006, 23.68 + r.f(0, 0.03)); }
      // cards home in a rack
      g.mat('wood', '#5e3f29'); g.box(-15.35, 0.92, 24.0, -15.05, 1.0, 24.25, { bevel: 0.005 });
      for (let i = 0; i < 6; i++) { g.mat('paper', ['#f2ede2', '#d6e2e0', '#f0dcc8'][i % 3]); g.box(-15.32 + i * 0.045, 0.96, 24.03, -15.31 + i * 0.045, 1.08, 24.22); }
    });
    prop(s, 'cup', -14.95, 0.92, 24.15, 0, { glaze: '#8c3b26' });
    s.deco(() => {
      g.mat('cast', BRASS); g.lathe(-15.25, 22.15, [[0.06, 0.92], [0.05, 0.94], [0.012, 0.96], [0.01, 1.3]], { segs: 10 });
      g.mat('weave', '#b8642e', { emissive: 0.6, lamp: true }); g.lathe(-15.25, 22.15, [[0.12, 1.24], [0.06, 1.38]], { segs: 12, capBottom: false, capTop: false });
    });
    lamp(s, 'bulb', -15.25, 1.3, 22.15, { K: 2650, power: 0.75, range: 4, clip: CLIP });

    // the pigeon-holes: sixteen columns, six rows, a label on each with its light delay
    const PH = { z0: 20.62, z1: 25.74, y0: 0.98, rows: 6, rh: 0.27, d: 0.32 };
    const cols = 16, cw = (PH.z1 - PH.z0) / cols, phx = WX0 + PH.d, phTop = PH.y0 + PH.rows * PH.rh;
    s.furniture(() => {
      // the cupboard underneath
      g.mat('wood', '#3b2418'); g.box(WX0, 0, PH.z0 - 0.03, WX0 + 0.42, 0.92, PH.z1 + 0.03, { bevel: 0.01, aoBottom: 0.6 });
      g.mat('wood', '#4e3324'); for (let i = 0; i < 6; i++) { const z0 = PH.z0 + 0.05 + i * (PH.z1 - PH.z0 - 0.1) / 6; g.box(WX0 + 0.42, 0.12, z0 + 0.02, WX0 + 0.435, 0.84, z0 + (PH.z1 - PH.z0 - 0.1) / 6 - 0.02, { bevel: 0.006 }); g.mat('cast', BRASS); g.ball(WX0 + 0.45, 0.68, z0 + 0.2, 0.014, 0.014, 0.014, { segs: 6, rings: 4 }); g.mat('wood', '#4e3324'); }
      g.mat('wood', '#6b4a2f'); g.box(WX0, 0.92, PH.z0 - 0.05, WX0 + 0.46, 0.96, PH.z1 + 0.05, { bevel: 0.008 });
      // the grid
      g.mat('wood', '#5e3f29');
      g.box(WX0, PH.y0 - 0.02, PH.z0, WX0 + 0.012, phTop + 0.02, PH.z1, { faces: 'X' });
      for (let i = 0; i <= cols; i++) { const z = PH.z0 + i * cw; g.box(WX0, PH.y0 - 0.02, z - 0.009, phx, phTop, z + 0.009, { faces: 'zZX' }); }
      for (let j = 0; j <= PH.rows; j++) { const y = PH.y0 + j * PH.rh; g.box(WX0, y - 0.02, PH.z0, phx, y, PH.z1, { faces: 'yYX' }); }
      g.mat('wood', WOOD2); g.box(WX0, phTop, PH.z0 - 0.05, phx + 0.06, phTop + 0.1, PH.z1 + 0.05, { bevel: 0.012 });
    });
    s.solid(WX0, 0, PH.z0 - 0.05, WX0 + 0.46, phTop + 0.1, PH.z1 + 0.05);
    const DELAYS = [
      [['Hedge Row', '8.7 s'], ['Gull Row', '18.9 s'], ['Grain Row', '23.7 s'], ['Weather Row', '28.0 s'], ['Bell Row', '32.6 s'], ['Pigment Row', '33.1 s'], ['Kelp Row', '36.9 s'], ['The Galley', '3.4 s']],
      [['A passing raft', '4 hours'], ['A passing raft', '9 hours'], ['A passing raft', '19 hours'], ['A passing raft', '2 days'], ['A passing raft', '6 days'], ['A passing raft', '11 days']],
      [['Across the Shade', '5 months'], ['Across the Shade', '1 year'], ['Across the Shade', '3 years'], ['Across the Shade', '5 years'], ['Across the Shade', '7 years'], ['Across the Shade', '8 years']],
    ];
    const pr = new Rng(4242);
    for (let i = 0; i < cols; i++) {
      const band = i < 6 ? 0 : i < 11 ? 1 : 2;
      for (let j = 0; j < PH.rows; j++) {
        const z0 = PH.z0 + i * cw + 0.012, z1 = z0 + cw - 0.024, y = PH.y0 + j * PH.rh, zc = (z0 + z1) / 2;
        // label strip on the lip below the cell
        const lab = DELAYS[band][(i * 7 + j * 3) % DELAYS[band].length];
        s.deco(() => { g.mat('paper', band === 2 ? '#f0d8b0' : band === 1 ? '#dfe6dc' : '#efe6d2'); g.box(phx, y - 0.075, zc - 0.13, phx + 0.006, y - 0.022, zc + 0.13, { faces: 'X' }); });
        sign(s, { kind: 'label', text: lab[0], lines: [lab[1]], ink: '#2b2018' }, phx + 0.008, y - 0.048, zc, { face: 'X', w: 0.24, h: 0.05 });
        // the letters in it
        const n = pr.chance(0.22) ? 0 : pr.i(1, 4);
        s.detail(() => {
          let zz = z0 + 0.02;
          for (let k = 0; k < n; k++) {
            const t = pr.f(0.004, 0.012), kind = pr.next();
            const col = band === 2 ? pr.pick(['#e8d6a8', '#f0dcc0', '#d8c090', '#c9b48a']) : pr.pick(['#efe3c8', '#e6dccb', '#d6e2e8', '#f0d0c8', '#e8e0b8']);
            g.mat('paper', col, { rough: 0.1 });
            if (kind < 0.25) {                                   // lying flat
              g.box(WX0 + 0.06, y, z0 + 0.04, WX0 + 0.25, y + t + 0.004, z1 - 0.06, { faces: 'xXYzZ' }); if (pr.chance(0.5)) { g.mat('paper', '#e6dccb'); g.box(WX0 + 0.08, y + t + 0.004, z0 + 0.05, WX0 + 0.24, y + t * 1.6 + 0.006, z1 - 0.08, { faces: 'xXYzZ' }); } break;
            } else if (kind < 0.35 && band === 2) {              // rolled and tied
              g.tube([[WX0 + 0.05, y + 0.03, zc], [WX0 + 0.29, y + 0.03, zc]], 0.028, { segs: 8 });
              g.mat('weave', '#b0302a'); g.tube([[WX0 + 0.17, y + 0.03, zc], [WX0 + 0.175, y + 0.03, zc]], 0.031, { segs: 8 });
              break;
            } else {                                             // standing, leaning a little
              const hh = pr.f(0.12, 0.2);
              g.push(); g.move(WX0 + 0.05, y, zz); g.rotX(pr.f(0, 0.18)); g.box(0, 0, 0, pr.f(0.18, 0.25), hh, t, { faces: 'xXYzZ' }); g.pop();
              if (band === 2 && pr.chance(0.4)) { g.mat('weave', pr.pick(['#b0302a', '#2f4f6f', '#3d5a3a'])); g.box(WX0 + 0.12, y, zz - 0.002, WX0 + 0.135, y + hh, zz + t + 0.002); }
              zz += t + 0.015; if (zz > z1 - 0.03) break;
            }
          }
        });
      }
    }
    // a painted strip over the pigeon-holes
    sign(s, { kind: 'letters', text: 'Letters by light', palette: ['#e8cf96'] }, phx + 0.07, phTop + 0.05, (PH.z0 + PH.z1) / 2, { face: 'X', w: 1.8, h: 0.13 });
    sign(s, { kind: 'label', text: 'Seconds', ink: '#e8cf96' }, phx + 0.075, phTop + 0.05, PH.z0 + 0.5, { face: 'X', w: 0.4, h: 0.08 });
    sign(s, { kind: 'label', text: 'Years', ink: '#e8cf96' }, phx + 0.075, phTop + 0.05, PH.z1 - 0.5, { face: 'X', w: 0.4, h: 0.08 });
    // a strip lamp under the cornice, washing down the holes
    lamp(s, 'strip', phx + 0.05, phTop - 0.01, PH.z0 + 0.2, { to: [phx + 0.05, phTop - 0.01, PH.z1 - 0.2], K: 2800, power: 0.42, range: 2.4, clip: CLIP, glow: 1.6 });

    // ---------- the writing desk under the window ----------
    prop(s, 'table', WX1 - 0.36, 0, 23.1, Math.PI / 2, { w: 2.6, d: 0.62, h: 0.74, wood: '#5e3f29', top: '#6b4a2f' });
    for (const z of [22.45, 23.75]) {
      prop(s, 'chair', WX1 - 1.05, 0, z, Math.PI / 2, { wood: z < 23 ? '#3b2618' : '#6b4a2f', back: z < 23 ? 'slat' : 'hoop', seat: z < 23 ? '#c9b48a' : '#8c3b26' }, { noSpots: true });
      s.spot('work', WX1 - 1.0, 0.46, z, Math.PI / 2, { tags: ['write'] });
    }
    prop(s, 'books.greenlamp', WX1 - 0.18, 0.74, 22.0, -Math.PI / 2, {});
    prop(s, 'books.greenlamp', WX1 - 0.18, 0.74, 24.2, -Math.PI / 2, {});
    lamp(s, 'bulb', WX1 - 0.25, 1.0, 22.0, { K: 2650, power: 0.55, range: 3, clip: CLIP });
    lamp(s, 'bulb', WX1 - 0.25, 1.0, 24.2, { K: 2650, power: 0.55, range: 3, clip: CLIP });
    s.detail(() => {
      const r = new Rng(9);
      // paper, pens, an inkpot, a letter half written
      for (const z of [22.45, 23.75]) {
        g.mat('paper', '#f2ead8'); g.box(WX1 - 0.62, 0.742, z - 0.15, WX1 - 0.4, 0.746, z + 0.13);
        g.mat('paper', '#e8dcc4'); g.push(); g.move(WX1 - 0.5, 0.746, z + 0.02); g.rotY(r.f(-0.3, 0.3)); g.box(-0.1, 0, -0.14, 0.1, 0.003, 0.14); g.pop();
        g.mat('paper', '#5a4a40'); for (let k = 0; k < 6; k++) g.box(WX1 - 0.58, 0.7495, z - 0.08 + k * 0.025, WX1 - 0.44 - r.f(0, 0.05), 0.7505, z - 0.075 + k * 0.025, { faces: 'Y' });
        g.mat('glaze', '#1f2b4a'); g.lathe(WX1 - 0.25, z + 0.3, [[0, 0.74], [0.03, 0.74], [0.034, 0.76], [0.02, 0.79], [0.012, 0.8], [0, 0.8]], { segs: 10 });
        g.mat('cast', '#2b2b2b'); g.tube([[WX1 - 0.42, 0.75, z + 0.14], [WX1 - 0.54, 0.752, z + 0.2]], 0.005, { segs: 5 });
      }
      // a pot of pens and a stack of envelopes
      g.mat('glaze', '#8c3b26'); g.lathe(WX1 - 0.2, 23.1, [[0, 0.74], [0.04, 0.74], [0.042, 0.86], [0.038, 0.86], [0, 0.75]], { segs: 10, capTop: false });
      for (let k = 0; k < 6; k++) { g.mat('cast', r.pick(['#2b2b2b', '#b08a45', '#2f4f6f', '#7a2f2a'])); const a = k / 6 * Math.PI * 2; g.tube([[WX1 - 0.2 + Math.cos(a) * 0.015, 0.76, 23.1 + Math.sin(a) * 0.015], [WX1 - 0.2 + Math.cos(a) * 0.04, 0.93, 23.1 + Math.sin(a) * 0.04]], 0.004, { segs: 4 }); }
      for (let k = 0; k < 9; k++) { g.mat('paper', r.pick(['#efe3c8', '#d6e2e8', '#f0d0c8'])); g.box(WX1 - 0.35, 0.74 + k * 0.004, 23.35 + r.f(-0.01, 0.01), WX1 - 0.17, 0.744 + k * 0.004, 23.5 + r.f(-0.01, 0.01)); }
    });
    bookRowOn(s, WX1 - 0.32, 22.65, 23.0, 0.74);
    // a fern on the sill, kept by the desk lamps
    prop(s, 'plant', WX1 - 0.02, 0.92, 21.55, 0, { kind: 'fern', size: 0.55, pot: '#3d6f8a', seed: 3 });
    prop(s, 'plant', WX1 - 0.02, 0.92, 24.6, 0, { kind: 'broad', size: 0.5, pot: '#a3563a', seed: 4 });

    // ---------- the binder's bench behind the front glass ----------
    prop(s, 'table', -8.0, 0, 20.85, 0, { w: 2.6, d: 0.66, h: 0.86, wood: '#5e3f29', top: '#8a6a48', legs: 'trestle' });
    prop(s, 'books.press', -9.0, 0.86, 20.85, 0, {});
    s.spot('work', -8.0, 0, 21.55, Math.PI, { tags: ['mend', 'bind'] });
    prop(s, 'stool', -7.6, 0, 21.55, 0, { wood: '#6b4a2f', h: 0.62 });
    prop(s, 'crock', -6.9, 0.86, 20.62, 0, { glaze: '#c9b48a', h: 0.14, r: 0.06 });
    s.detail(() => {
      const r = new Rng(31);
      // glue pots with brushes
      for (const [x, c] of [[-8.3, '#c9b48a'], [-8.12, '#8a5a3c']]) { g.mat('glaze', c); g.lathe(x, 20.75, [[0, 0.86], [0.05, 0.86], [0.055, 0.93], [0.05, 0.95], [0, 0.94]], { segs: 12 }); g.mat('wood', '#c9a46a'); g.tube([[x, 0.93, 20.75], [x + 0.03, 1.08, 20.72]], 0.006, { segs: 4 }); }
      // spools of thread on pegs
      ['#d95d7a', '#3fa7a3', '#e0b04a', '#e8743b', '#f2e6c8', '#2f4f6f'].forEach((c, i) => { const x = -7.7 + i * 0.07; g.mat('wood', '#c9a46a'); g.cyl(x, 0.86, 20.62, 0.026, 0.006, { segs: 8 }); g.cyl(x, 0.92, 20.62, 0.026, 0.006, { segs: 8 }); g.mat('weave', c); g.cyl(x, 0.866, 20.62, 0.02, 0.054, { segs: 8 }); });
      // a book opened for mending, its spine stripped, and the new tape
      g.mat('paper', '#efe3c8'); g.box(-7.55, 0.86, 20.85, -7.15, 0.885, 21.08);
      g.mat('leather', '#7a2f2a'); g.box(-7.56, 0.86, 20.84, -7.14, 0.866, 21.09);
      g.mat('weave', '#3fa7a3'); g.box(-7.0, 0.86, 20.8, -6.95, 0.875, 21.05);
      // signatures waiting, folded
      for (let k = 0; k < 7; k++) { g.mat('paper', '#ece2cc'); g.box(-6.9, 0.86 + k * 0.01, 20.62 + r.f(0, 0.02), -6.72, 0.868 + k * 0.01, 20.86 + r.f(0, 0.02)); }
      // a bone folder, an awl, little clamps
      g.mat('glaze', '#efe6d2'); g.box(-7.95, 0.86, 21.0, -7.75, 0.866, 21.03, { bevel: 0.002 });
      g.mat('wood', '#7a5233'); g.tube([[-7.7, 0.865, 21.06], [-7.6, 0.865, 21.08]], 0.008, { segs: 5 }); g.mat('cast', '#9a9a9a'); g.tube([[-7.6, 0.865, 21.08], [-7.54, 0.865, 21.09]], 0.002, { segs: 3 });
      for (let k = 0; k < 3; k++) { g.mat('cast', '#3a3530'); g.box(-8.6 + k * 0.08, 0.86, 21.05, -8.57 + k * 0.08, 0.92, 21.08); }
      // mended books waiting to go back, tied with string, tape on every spine
      g.push(); g.at(-6.75, 0.86, 21.12, Math.PI); bookStack(g, 0, 0, 6, r); g.pop(); g.pop();
      g.mat('weave', '#e8dcc4'); g.box(-6.765, 0.86, 20.95, -6.735, 1.06, 21.16, { faces: 'xXY' });
      // a cutting board and a steel rule
      g.mat('glaze', '#3d5a3a'); g.box(-8.0, 0.86, 20.62, -7.6, 0.866, 20.84);
      g.mat('brushed', '#b8b4aa'); g.box(-8.05, 0.866, 20.66, -7.55, 0.869, 20.69);
      // paste in a lidded crock and a roll of book cloth
      g.mat('weave', '#2f6f73'); g.push(); g.move(-6.45, 0.9, 20.7); g.rotZ(Math.PI / 2); g.cyl(0, -0.2, 0, 0.04, 0.4, { segs: 10 }); g.pop();
    });
    // the binder's lamp on an arm
    s.deco(() => {
      g.mat('cast', '#3a3530'); g.box(-7.42, 0.86, 20.55, -7.32, 0.89, 20.6);
      g.tube([[-7.37, 0.89, 20.58], [-7.37, 1.35, 20.62], [-7.6, 1.5, 20.85]], 0.01, { segs: 5 });
      g.mat('cast', '#7a2f2a'); g.lathe(-7.62, 20.87, [[0.08, 1.38], [0.05, 1.47], [0.015, 1.5]], { segs: 10, capBottom: false });
      g.mat('diffuser', '#fff0d0', { emissive: 5, lamp: true }); g.cyl(-7.62, 1.385, 20.87, 0.06, 0.004, { segs: 8 });
    });
    s.light({ at: [-7.62, 1.36, 20.87], type: 'spot', dir: [0, -1, 0.05], cone: [60, 30], color: [1, 0.86, 0.7], power: 6, range: 3, clip: CLIP, lamp: true, shadow: true });

    // ---------- coats and a felt hanging by the front ----------
    s.furniture(() => {
      g.mat('wood', '#5e3f29'); g.box(-5.35, 1.6, Z0 + 0.16, -3.85, 1.7, Z0 + 0.19, { bevel: 0.006 });
      g.mat('cast', BRASS); for (const x of [-5.1, -4.6, -4.1]) g.tube([[x, 1.66, Z0 + 0.19], [x, 1.67, Z0 + 0.28], [x, 1.72, Z0 + 0.3]], 0.008, { segs: 4 });
      const coat = (x, col, lin, len, patch) => {
        g.mat('weave', col); g.tube([[x - 0.2, 1.6, Z0 + 0.3], [x - 0.1, 1.66, Z0 + 0.3], [x + 0.1, 1.66, Z0 + 0.3], [x + 0.2, 1.6, Z0 + 0.3]], 0.05, { segs: 8 });
        g.sheet([x - 0.22, 1.6, Z0 + 0.34], [x + 0.22, 1.6, Z0 + 0.34], [x + 0.25, 1.6 - len, Z0 + 0.3], [x - 0.25, 1.6 - len, Z0 + 0.3], { nu: 6, nv: 4, ripple: 0.02, rippleN: 5 });
        g.mat('weave', lin); g.tube([[x - 0.06, 1.62, Z0 + 0.345], [x, 1.55, Z0 + 0.35], [x + 0.06, 1.62, Z0 + 0.345]], 0.012, { segs: 5 });
        if (patch) { g.mat('knit', patch); g.quad([x + 0.06, 1.2, Z0 + 0.339], [x + 0.18, 1.2, Z0 + 0.338], [x + 0.18, 1.32, Z0 + 0.342], [x + 0.06, 1.32, Z0 + 0.343], { double: true }); }
      };
      coat(-5.1, '#2f4f6f', '#e0b04a', 0.95, '#e8743b'); coat(-4.1, '#8c3b26', '#3fa7a3', 0.7, null);
      g.mat('felt', '#c9973f'); g.sheet([-4.7, 1.66, Z0 + 0.3], [-4.5, 1.66, Z0 + 0.3], [-4.48, 1.2, Z0 + 0.27], [-4.72, 1.2, Z0 + 0.27], { nu: 2, nv: 3 });
    });
    feltHanging(s, [-5.4, Z0 + 0.16], [-3.8, Z0 + 0.16], 2.9, 1.85, FELT_TEAL, [0, 0.05], { band: '#e0b04a' });
    feltHanging(s, [-16.8, Z0 + 0.16], [-15.2, Z0 + 0.16], 2.9, 1.95, FELT_PLUM, [0, 0.05], { band: '#c9973f', mend: ['#3fa7a3', '#f2e6c8'] });
    sign(s, { kind: 'notice', title: 'Lending', lines: ['Copies are free, any book, any time', 'the worlds are on.', 'Paper goes out for a month.', 'Bring it back mended or not.', 'Pencil in the margins is welcome.'] }, -16.0, 1.45, Z0 + 0.19, { face: 'Z', w: 0.36, h: 0.5 });
    // a book trolley by the circle, half unloaded
    s.furniture(() => {
      g.mat('wood', '#6b4a2f');
      g.box(-6.9, 0.18, 24.6, -6.1, 0.21, 25.05, { bevel: 0.006 }); g.box(-6.9, 0.62, 24.6, -6.1, 0.65, 25.05, { bevel: 0.006 });
      g.mat('cast', '#3a3530'); for (const x of [-6.88, -6.12]) for (const z of [24.62, 25.03]) { g.tube([[x, 0.06, z], [x, 0.9, z]], 0.01, { segs: 5 }); g.ball(x, 0.05, z, 0.04, 0.04, 0.04, { segs: 8, rings: 5 }); }
      g.tube([[-6.92, 0.9, 24.62], [-6.92, 0.9, 25.03]], 0.012, { segs: 5 });
    });
    s.solid(-6.92, 0, 24.58, -6.08, 0.9, 25.07);
    s.detail(() => {
      const r = new Rng(55);
      g.push(); g.at(-6.88, 0, 24.6, 0); bookLite(g, 0, 0.76, 0.65, 0.26, r); g.pop(); g.pop();
      g.push(); g.at(-6.88, 0, 24.6, 0); bookStack(g, 0.2, 0.21, 4, r); bookStack(g, 0.55, 0.21, 3, r); g.pop(); g.pop();
    });

    // a low table of paper books mended this month, face up
    prop(s, 'table', -8.4, 0, 23.7, 0.08, { w: 1.1, d: 0.6, h: 0.62, wood: '#4e3324', top: '#6b4a2f' });
    s.detail(() => {
      const r = new Rng(808);
      for (let i = 0; i < 5; i++) {
        g.mat(r.chance(0.4) ? 'leather' : 'paper', r.pick(SPINES));
        g.push(); g.move(-8.8 + i * 0.2, 0.62, 23.62 + r.f(-0.1, 0.12)); g.rotY(r.f(-0.4, 0.4)); g.box(-0.08, 0, -0.11, 0.08, 0.025, 0.11); g.mat('weave', r.pick(TAPES)); g.box(-0.081, 0, -0.11, -0.06, 0.027, 0.11); g.pop();
      }
      g.push(); g.at(-8.75, 0.62, 23.85, 0.08); bookStack(g, 0, 0, 3, r); g.pop(); g.pop();
    });
    sign(s, { kind: 'label', text: 'Mended this month', lines: ['back on loan tomorrow'], ink: '#2b2018' }, -8.4, 0.75, 23.42, { face: 'z', w: 0.36, h: 0.09 });
    s.detail(() => { g.mat('paper', '#efe3c8'); g.push(); g.move(-8.4, 0.62, 23.44); g.rotX(-0.35); g.box(-0.19, 0, -0.01, 0.19, 0.11, 0.0); g.pop(); });
    lamp(s, 'globe', -8.4, 1.95, 23.7, { r: 0.12, drop: 1.0, K: 2700, power: 0.45, range: 3.2, clip: CLIP });

    // ---------- shelf lights: dark corners between pools ----------
    for (const p of [[-14.3, 29.9, [0, -0.7, 0.71]], [-5.9, 29.9, [0, -0.7, 0.71]], [-16.0, 28.3, [-0.71, -0.7, 0]], [-4.4, 28.8, [0.71, -0.7, 0]]]) {
      s.deco(() => { g.mat('cast', '#3a3530'); g.cyl(p[0], 3.12, p[1], 0.06, 0.08, { segs: 8 }); g.mat('diffuser', '#ffd090', { emissive: 3, lamp: true }); g.cyl(p[0], 3.11, p[1], 0.04, 0.01, { segs: 8 }); });
      s.light({ at: [p[0], 3.05, p[1]], type: 'spot', dir: p[2], cone: [58, 28], color: [1, 0.74, 0.48], power: 4.2, range: 4.2, clip: CLIP, lamp: true, shadow: true });
    }
    // a lantern by the door
    lamp(s, 'lantern', -13.3, 2.35, 21.6, { tint: '#d97a3a', r: 0.17, hh: 0.26, drop: 0.5, power: 0.45, range: 4, clip: CLIP, K: 2700 });

    // ---------- outside: the notice (one per day), the hanging sign ----------
    const chalkDay = dynMesh(s, [-16.0, 1.35, Z0 - 0.02], (gg) => { sign(proxyScope(s, gg), SIGNS['books.chalk'], -16.0, 1.35, Z0 - 0.02, { face: 'z' }); }, { radius: 1.2 });
    const chalkQuiet = dynMesh(s, [-16.0, 1.35, Z0 - 0.02], (gg) => { sign(proxyScope(s, gg), SIGNS['books.chalk.quiet'], -16.0, 1.35, Z0 - 0.02, { face: 'z' }); }, { radius: 1.2, hidden: true });
    s.deco(() => { g.mat('cast', BRASS); g.tube([[-16.35, 1.86, Z0], [-16.0, 1.98, Z0 - 0.01], [-15.65, 1.86, Z0]], 0.005, { segs: 4, caps: false }); });
    every(s, (dt, gm) => { const q = gm.clock && gm.clock.day === 2; if (chalkDay) chalkDay.userData.hidden = q; if (chalkQuiet) chalkQuiet.userData.hidden = !q; });
    s.deco(() => { g.mat('cast', '#2b2b2b'); g.tube([[-4.4, 2.86, Z0], [-4.4, 2.86, Z0 - 0.8]], 0.014, { segs: 6 }); g.tube([[-4.4, 2.6, Z0], [-4.4, 2.86, Z0 - 0.5]], 0.008, { segs: 5 }); });
    sign(s, SIGNS['books.hanging'], -4.4, 2.48, Z0 - 0.48, { face: 'x', double: true, w: 0.56, h: 0.56 });
    lamp(s, 'sconce', -16.0, 2.2, Z0 - 0.02, { face: 'z', K: 2800, power: 0.5, range: 3.5 });

    // ---------- interactions ----------
    const J = speaker('jory');
    const isDayReading = (gm) => gm.clock && (gm.clock.day === 1 || gm.clock.day === 3) && gm.clock.hours >= 20 && gm.clock.hours < 22;
    const isQuietReading = (gm) => gm.clock && gm.clock.day === 2 && gm.clock.hours >= 14 && gm.clock.hours < 17;

    // the pigeon-holes: the open hole of letters left for anyone
    s.interact({ x: WX0 + 0.3, y: 1.5, z: 25.3, radius: 1.7, prompt: 'Read a letter from the open hole', onUse: async (gm) => {
      if (!gm.ui) return;
      gm.busy++;
      try {
        if (gm.audio) gm.sfxAt('paper', f, WX0 + 0.3, 1.5, 25.3);
        const pick = await gm.ui.choose('The open hole', 'Letters left here for anyone to read. Each one has its light delay pencilled on the back.', LETTERS.map((l) => ({ label: l.label, sub: l.sub, value: l.id })));
        const L = LETTERS.find((l) => l.id === pick);
        if (L) { await gm.ui.say(L.from, L.lines); found(gm, 'long-letter'); }
      } finally { gm.busy--; }
    } });

    // the sealed letter on the lectern, or the reading itself
    s.interact({ x: -10, y: 1.15, z: 29.45, radius: 1.6, prompt: (gm) => isDayReading(gm) ? 'Listen to the reading' : isQuietReading(gm) ? 'Listen to the Quiet reading' : "Look at tonight's letter", onUse: async (gm) => {
      if (isDayReading(gm)) {
        if (gm.audio) gm.sfxAt('paper', f, -10, 1.2, 29.5);
        await talk(gm, 'jory', ['Across the Shade, seven years by light. I have not opened it. Nobody has.'].concat(READING).concat(['That is all of it. It has been read.']));
        found(gm, 'long-letter');
      } else if (isQuietReading(gm)) {
        await talk(gm, 'jory', QUIET_READING); found(gm, 'long-letter');
      } else if (gm.clock && gm.clock.day === 2) {
        await talk(gm, 'A sealed letter', ['A strip of red paper across the fold. In Jory\'s hand: "Booking Day. Read at eight."', 'Nothing new comes in on the Quiet, so this one waits a day.']);
      } else {
        await talk(gm, 'A sealed letter', ['A strip of red paper across the fold. In Jory\'s hand: "Across the Shade. Seven years and two months by light. Eight o\'clock."', 'Whoever wrote it has been waiting seven years to be heard. Jory will open it at eight, in front of whoever is in the chairs, and read it once.']);
      }
    } });

    // Jory at the counter
    s.interact({ x: -15.3, y: 1.3, z: 23.2, radius: 1.8, kind: 'talk', prompt: 'Talk to Jory', onUse: async (gm) => {
      if (!gm.ui) return;
      gm.busy++;
      try {
        gm.flags = gm.flags || {};
        if (!gm.flags.metJoryBooks) { gm.flags.metJoryBooks = true; await gm.ui.say(J, ['A wanderer. Where did you sleep last night? And have you eaten?', 'Then sit anywhere you like. The chairs are older than the books, and the books are older than me.']); }
        const v = await gm.ui.choose(J, 'What can I do for you?', [
          { label: 'See what the room lends', value: 'menu' },
          { label: 'Ask what a book costs', value: 'cost' },
          { label: 'Ask about all these books', value: 'shelves' },
        ]);
        if (v === 'cost') {
          await gm.ui.say(J, ['A book? Nothing. Any book written anywhere in the Shade copies to you for almost nothing when the worlds are on.', 'Paper is another thing. Paper is mass, and mass is dear. That shelf is about a tonne. I try not to think about it in kays.']);
          found(gm, 'free-copies');
        } else if (v === 'shelves') {
          await gm.ui.say(J, ['Marit has one long wall in her flat. I have measured it. Twice.', 'She has not said no. I am taking that as a yes about the wall.']);
        } else if (v === 'menu') {
          const M = MENUS.books, day = gm.clock ? gm.clock.day : 1, hr = gm.clock ? gm.clock.hours : 12;
          const items = M.items.map((it) => {
            let off = false;
            if (it.days && it.days.indexOf(day) < 0) off = day === 2 ? 'Not on the Quiet' : 'Only on the Quiet';
            else if (it.hours && (hr < it.hours[0] || hr >= it.hours[1])) off = 'From ' + it.hours[0] + ':00';
            return { id: it.id, name: it.name, desc: it.desc, price: it.price, disabled: off, tag: it.price > 0 ? null : 'free' };
          });
          const id = await gm.ui.menu({ kicker: 'Jory', title: M.title, note: M.note, items, wallet: gm.wallet && gm.wallet.kwh });
          const it = M.items.find((x) => x.id === id);
          if (!it) return;
          if (it.price > 0 && gm.wallet && !gm.wallet.spend(it.price, it.name)) { await gm.ui.say(J, 'Next time. Paper keeps.'); return; }
          if (id === 'card') { give(gm, 'card'); await gm.ui.say(J, 'One card from every row, they say. It goes by light, and the postmark gives the delay.'); }
          else if (id === 'printed-letter') await gm.ui.say(J, 'About ten grams of paper. Write small and you can say a great deal for a quarter of a kay.');
          else if (id === 'copy') { await gm.ui.say(J, 'Done. It will be waiting for you the next time your worlds are on. That one cost nothing at all.'); found(gm, 'free-copies'); }
          else if (id === 'reading' || id === 'quiet-reading') await gm.ui.say(J, 'Take a chair, or a cushion if the chairs have gone. I read it once. Then it has been read.');
        }
      } finally { gm.busy--; }
    } });

    // borrow a paper book from the back shelves
    s.interact({ x: -13.5, y: 1.4, z: WZ1 - 0.3, radius: 1.7, prompt: 'Borrow a book', onUse: async (gm) => {
      if (!gm.ui) return;
      gm.flags = gm.flags || {};
      if (gm.flags.booksBorrowed) { await talk(gm, 'jory', 'You have one out already. One at a time. It keeps people coming back.'); return; }
      gm.busy++;
      try {
        const v = await gm.ui.choose('The shelves', 'Paper books, mended, with pencil in the margins.', BORROW.map((b) => ({ label: b.label, sub: b.sub, value: b.id })));
        const b = BORROW.find((x) => x.id === v); if (!b) return;
        if (gm.audio) gm.sfxAt('book', f, -13.5, 1.4, 30.3);
        gm.flags.booksBorrowed = b.id;
        await gm.ui.say(J, ['"' + b.label + '". I will write it in the ledger.', 'You could have it copied for nothing. This one is paper: about four hundred grams, ten kays new, and older than both of us. Bring it back before you go.']);
        if (gm.ui.toast) gm.ui.toast('Borrowed: ' + b.label, { kind: 'info' });
        found(gm, 'free-copies');
      } finally { gm.busy--; }
    } });

    // the notice outside, whichever day it is
    s.interact({ x: -16.0, y: 1.4, z: Z0 - 0.1, radius: 1.6, prompt: 'Read the notice', onUse: async (gm) => {
      const sp = gm.clock && gm.clock.day === 2 ? SIGNS['books.chalk.quiet'] : SIGNS['books.chalk'];
      if (gm.audio) gm.audio.ui('page');
      await talk(gm, sp.title, sp.lines.join(' '));
    } });

    // the binder's bench
    s.interact({ x: -8.0, y: 1.0, z: 20.95, radius: 1.5, prompt: "Look at the binder's bench", onUse: async (gm) => {
      await talk(gm, "The binder's bench", ['A book in the press, its spine stripped back to the thread. Beside it a strip of teal tape, cut to length.', 'The mends here are meant to show. A book with three colours of tape on its spine has been read a great deal.']);
    } });

    // the writing desk
    s.interact({ x: WX1 - 0.45, y: 0.9, z: 23.1, radius: 1.5, prompt: 'Sit at the writing desk', onUse: async (gm) => {
      const seat = { x: WX1 - 1.0, y: 0, z: 23.1, yaw: Math.PI / 2, eye: 1.15 };
      if (gm.player.seat && gm.player.seat.books === 'desk') { gm.player.stand(); return; }
      seat.books = 'desk'; gm.player.sit(seat); gm.player.yaw = Math.PI - seat.yaw;
      await talk(gm, 'The writing desk', ['Good paper, a pen that has been mended at the nib, and a green lamp.', 'A letter here is written long and slowly, because whoever reads it cannot write back for years. Some people take a week over a page.']);
    } });

    // the armchairs: sit, and get up again
    seats.forEach((st, i) => {
      const key = 'chair' + i;
      s.interact({ radius: 1.4, priority: 0.2,
        pos: (gm) => { const se = gm.player.seat; if (se && se.books === key) return [se.x + Math.sin(gm.player.yaw) * 0.6, 1.0, se.z - Math.cos(gm.player.yaw) * 0.6]; return [st.x, 0.75, st.z]; },
        prompt: (gm) => (gm.player.seat && gm.player.seat.books === key) ? 'Get up' : 'Sit in ' + st.name,
        onUse: (gm) => {
          if (gm.player.seat && gm.player.seat.books === key) { gm.player.stand(); return; }
          gm.player.sit({ x: st.x + Math.sin(st.yaw) * 0.04, y: 0, z: st.z + Math.cos(st.yaw) * 0.04, yaw: st.yaw, eye: 1.12, books: key });
          gm.player.yaw = Math.PI - st.yaw; gm.player.pitch = -0.05;
        } });
    });
    // the desk seat also needs a way up: the same trick
    s.interact({ radius: 1.2, priority: 1,
      pos: (gm) => { const se = gm.player.seat; if (se && se.books === 'desk') return [se.x + Math.sin(gm.player.yaw) * 0.6, 1.0, se.z - Math.cos(gm.player.yaw) * 0.6]; return null; },
      prompt: 'Get up', onUse: (gm) => gm.player.stand() });

    // ---------- people: spots and paths ----------
    for (const b of [[-14.6, 29.95, Math.PI], [-12.6, 29.95, Math.PI], [-7.4, 29.95, Math.PI], [-5.0, 29.95, Math.PI], [-15.95, 27.2, -Math.PI / 2], [-15.95, 29.0, -Math.PI / 2], [-4.55, 28.0, Math.PI / 2], [-4.55, 29.6, Math.PI / 2]]) s.spot('browse', b[0], 0, b[1], b[2], { tags: ['books'] });
    s.spot('stand', -11.0, 0, 25.6, Math.PI, { tags: ['read', 'listen'] });
    s.spot('stand', -8.9, 0, 25.5, Math.PI, { tags: ['read', 'listen'] });
    s.spot('chat', -13.4, 0, 25.2, 1.2, { tags: ['books'] }); s.spot('chat', -12.8, 0, 25.9, -2.4, { tags: ['books'] });
    s.path([[-11.85, 18.0], [-11.85, 21.3], [-11.85, 24.6], [-10.0, 25.6], [-10.0, 27.6]], { width: 1.1 });
    s.path([[-11.85, 24.6], [-14.1, 24.6], [-14.1, 23.0]], { width: 1.0 });
    s.path([[-14.1, 24.6], [-15.0, 25.2], [-15.9, 24.8], [-15.9, 23.2]], { width: 0.8 });
    s.path([[-11.85, 24.6], [-13.4, 26.0], [-14.2, 29.5], [-13.0, 29.95]], { width: 0.9 });
    s.path([[-14.2, 29.5], [-15.5, 28.2]], { width: 0.8 });
    s.path([[-10.0, 25.6], [-7.0, 25.9], [-5.2, 26.1], [-3.0, 26.1], [-2.0, 26.1]], { width: 1.0 });
    s.path([[-5.2, 26.1], [-5.0, 28.8], [-6.3, 29.95]], { width: 0.9 });
    s.path([[-5.5, 26.1], [-5.5, 22.4]], { width: 0.8 });
    s.path([[-11.85, 21.3], [-8.6, 21.5]], { width: 0.9 });

    // ---------- zone ----------
    s.zoneBox({ id: 'books', place: 'books', box: [X0, -0.5, Z0 + 0.05, X1, H + 0.1, Z1], name: P.name.charAt(0).toUpperCase() + P.name.slice(1), sub: 'Wick Court', ambience: 'shop', reverb: 'felt', env: { warmth: 0.4, autoKey: 0.15 } });

    s.finish();
    game.spawns.books = { frame: f, x: -10.25, y: 0, z: 15.5, yaw: Math.PI };
    game.spawns['books-circle'] = { frame: f, x: -10.6, y: 0, z: 22.6, yaw: Math.PI - 0.15 };
  },
};

// A short row of books standing along z on a desk top at height y, spines facing -x (toward the writer), backs against x.
function bookRowOn(s, x, za, zb, y) {
  s.detail((g) => { bookRow(g, za, zb, y, x, 'x', { hmax: 0.24, depth: 0.17, seed: 61 }); });
}
