// Props, plan and small helpers for the strain library (the Keel, deck 11, Ring Three). Everything here is drawn at the
// origin with its front toward +z, and cached by the few parameters it takes.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { defineProp } from '../world/props.js';

export const PI = Math.PI;
export const REGION = 'keel-library';

// ---------------------------------------------------------------------------------------------------------------
// The plan (frame 'keel-library': x spinward, z toward the back cap, y up; deck 11 at y = 0)
// ---------------------------------------------------------------------------------------------------------------
export const GAL = { x0: -30, x1: 30, z0: -8, z1: 0, h: 7.8 };          // the long window: the warm reading gallery
export const READ = { x0: -30, x1: 10, z0: 0, z1: 15, h: 4.2 };         // the reading room and its files
export const COOK = { x0: 10, x1: 30, z0: 0, z1: 15, h: 4.2 };          // the cooks' doors
export const RECV = { x0: 30, x1: 40, z0: -8, z1: 6, h: 4.2 };          // the receiving bench, behind glass
export const COAT = { x0: -42, x1: -30, z0: -7, z1: 7, h: 3.4 };        // the coat room
export const CAB = { x0: -52, x1: -42, z0: -5, z1: 5, h: 3.4 };         // the cab lobby
export const VAULT = { x0: -30, x1: 30, z0: -30, z1: -8, y0: -8, y1: 11.6 };   // the stacks: decks 9 to 13, one cold room
export const WALK = { x: 1.3, z0: -27.5, z1: -8, lock: -11.2, h: 2.6 };  // the cold walk, out into the stacks
export const GALDOOR = { z0: -5.4, z1: -3.6 };                           // coat room into the gallery, in the wall x = -30
export const WIN = { y0: 0.7, y1: 7.0, spans: [[-27, -2], [2, 27]] };   // the long window's two halves
export const ROWS = [-12, -18, -24];                                     // carousel rows (z): A, B, C
export const COLS = [-27, -22.4, -17.8, -13.2, -8.6, -4, 4, 8.6, 13.2, 17.8, 22.4, 27];
export const CAR = { r: 1.3, top: 16.4, shelves: 15, tins: 11, y0: 0.82, dy: 1.04 };
export const TURNING = [[-8.6, 0, 0.055], [-22.4, 0, -0.04], [13.2, 1, 0.045]];   // carousels that turn: [x, row, rad/s]

// the palette
export const C = {
  walnut: '#5a3e2a', oak: '#7a5a3a', brass: '#b08a45', green: '#2f5a44', shade: '#2e6b4a', oxblood: '#6e2a2a',
  cream: '#e8dcc0', plaster: '#d8c3a0', teal: '#2c4a52', felt: '#33505a',
  frost: '#e6f0f5', steel: '#8d989e', panel: '#a9bac6', ice: '#cfe6f2', crane: '#c9962e', red: '#b5432e',
};
// lid colours by row: the stacks are colour-coded by kind
export const LIDS = [
  ['#c9962e', '#b5532e', '#d6a640', '#a8432e', '#e0b85a'],     // A: vat cultures (flour, yeasts, dairy)
  ['#2f7a6a', '#4f8a3a', '#2f6f73', '#6b8a3a', '#3a8a7a'],     // B: fungi, algae, plant cells
  ['#5b4a8a', '#7a3a6a', '#3a4a8a', '#8a4a7a', '#4a5a9a'],     // C: cell lines and registered starters
];

// ---------------------------------------------------------------------------------------------------------------
// small helpers, safe when the UI or audio is missing
// ---------------------------------------------------------------------------------------------------------------
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export async function choose(game, who, prompt, options) { if (!game.ui) return null; game.busy++; try { return await game.ui.choose(who, prompt, options); } finally { game.busy--; } }
export function toast(game, text) { if (game.ui) game.ui.toast(text, { kind: 'info', dur: 6 }); }
export function find(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
// Wait a frame between big parts of the build, then take the region's atlas group back (another builder may have had it).
export async function tick(game) {
  await new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });
  if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + REGION);
}
// Run fn(a, b, i) over [a0, a1] in pieces no longer than `step` (long things must be cut so the drum can bend them).
export function runX(a0, a1, step, fn) { const n = Math.max(1, Math.ceil((a1 - a0) / step)); for (let i = 0; i < n; i++) fn(a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n, i); }
export function lineX(a0, a1, y, z, step = 3) { const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / step)), out = []; for (let i = 0; i <= n; i++) out.push([a0 + (a1 - a0) * i / n, y, z]); return out; }
// A mesh of its own that can be moved (and turned about y) every frame: origin is where its local zero sits in the frame.
export function movable(s, draw, origin, o = {}) {
  const g = new Geo(new MeshBuf(2048, 4096)); draw(g);
  if (!g.buf.ni) return null;
  const mesh = new THREE.Mesh(g.buf.toGeometry(), s.world.mats.opaque);
  s.world.addRenderable(mesh, { frame: s.frame, origin: origin.slice(), center: o.center || [0, 0, 0], radius: o.radius || 3, far: o.far || 120, caster: false, scope: s });
  s.meshes.push(mesh);
  return mesh;
}
export function turn(mesh, a) { const e = mesh.matrixWorld.elements, c = Math.cos(a), sn = Math.sin(a); e[0] = c; e[8] = sn; e[2] = -sn; e[10] = c; }

// ---------------------------------------------------------------------------------------------------------------
// painted numbers and letters: one strip of glyphs in the atlas, two colourings (dark on frost, cream on steel blue)
// ---------------------------------------------------------------------------------------------------------------
export const GLYPHS = '0123456789ABC·DEK ';
export function glyphAtlas(game) {
  if (!game.atlas) return null;
  return game.atlas.add(1152, 128, (ctx, w, h) => {
    const n = GLYPHS.length, cw = w / n, ch = h / 2;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
      ctx.fillStyle = row ? '#2f4a5e' : '#e9eef0'; ctx.fillRect(i * cw, row * ch, cw + 1, ch + 1);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let k = 0; k < 5; k++) ctx.fillRect(i * cw + ((k * 31 + i * 17) % 52), row * ch + ((k * 19 + i * 11) % 54), 7, 2);
      ctx.fillStyle = row ? '#eef2ee' : '#22303a'; ctx.font = '600 ' + Math.round(ch * 0.82) + "px 'Barlow Condensed', sans-serif";
      ctx.fillText(GLYPHS[i], i * cw + cw / 2, row * ch + ch * 0.55);
    }
  }, 'keellib.glyphs');
}
function glyph(g, R, ch, row, cx, cy, zf, w, h) {
  let i = GLYPHS.indexOf(ch); if (i < 0) i = GLYPHS.length - 1;
  const n = GLYPHS.length, du = (R.u1 - R.u0) / n, dv = (R.v1 - R.v0) / 2, ins = 0.03;
  const ua = R.u0 + du * (i + ins), ub = R.u0 + du * (i + 1 - ins), vt = R.v0 + dv * (row + ins), vb = R.v0 + dv * (row + 1 - ins);
  g.quad([cx - w / 2, cy - h / 2, zf], [cx + w / 2, cy - h / 2, zf], [cx + w / 2, cy + h / 2, zf], [cx - w / 2, cy + h / 2, zf], { uv: [ua, vb, ub, vt] });
}
// a word of glyphs on a flat plate, centred at the local origin, facing +z
export function glyphWord(g, R, text, row, cy, zf, w, h) {
  if (!R) return; g.atlas(R.page, { rough: 0.6 });
  for (let k = 0; k < text.length; k++) glyph(g, R, text[k], row, (k - (text.length - 1) / 2) * w, cy, zf, w, h);
}
// a word of glyphs wrapped round a cylinder of radius r about the local y axis, facing +z
export function glyphRing(g, R, text, row, cy, r, w, h) {
  if (!R) return; g.atlas(R.page, { rough: 0.6 });
  for (let k = 0; k < text.length; k++) { g.push(); g.rotY((k - (text.length - 1) / 2) * w / r); glyph(g, R, text[k], row, 0, cy, r, w, h); g.pop(); }
}
export function carouselLabel(row, x) { const i = COLS.indexOf(x); return 'ABC'[row] + '·' + String(i + 1).padStart(2, '0'); }

// ---------------------------------------------------------------------------------------------------------------
// A carousel of the stacks: a turning column of fifteen round shelves, eleven frosted tins to a shelf, each tin
// a few dozen vials at minus eighty. 16.4 m tall from the vault floor to the top of its drive. row: 0 | 1 | 2.
// ---------------------------------------------------------------------------------------------------------------
export function drawCarousel(g, row, R, label) {
  const r = CAR.r, lids = LIDS[row] || LIDS[0];
  // the plinth and the drive at the foot
  g.mat('cast', '#3a4248'); g.lathe(0, 0, [[r + 0.15, 0], [r + 0.15, 0.22], [r + 0.05, 0.3], [0.45, 0.42], [0, 0.42]], { segs: 14 });
  g.mat('brushed', '#9aa6ac'); g.cyl(0, 0.42, 0, 0.17, CAR.top - 0.42, { segs: 8 });
  // three uprights at the rim, and a frost line down each
  g.mat('brushed', '#b7c3c9');
  for (let k = 0; k < 3; k++) { const a = k / 3 * PI * 2 + 0.3, x = Math.sin(a) * (r - 0.04), z = Math.cos(a) * (r - 0.04); g.box(x - 0.03, 0.3, z - 0.03, x + 0.03, CAR.top - 0.2, z + 0.03, { faces: 'xXzZ' }); }
  // shelves and tins
  for (let k = 0; k < CAR.shelves; k++) {
    const y = CAR.y0 + k * CAR.dy;
    g.mat('brushed', '#c4d0d6', { rough: 0.15 }); g.lathe(0, 0, [[r, y - 0.035], [r, y], [0.2, y]], { segs: 14, capBottom: true, capTop: false });
    g.mat('plain', C.frost, { rough: 0.35 }); g.lathe(0, 0, [[r + 0.012, y - 0.004], [r + 0.012, y + 0.012]], { segs: 14, capTop: false, capBottom: false });
    for (let i = 0; i < CAR.tins; i++) {
      const a = (i + (k % 2) * 0.5) / CAR.tins * PI * 2, x = Math.sin(a) * 1.0, z = Math.cos(a) * 1.0;
      const frosty = (i * 7 + k * 5 + row * 3) % 9 === 0;
      g.mat('brushed', frosty ? '#e9f1f5' : '#bcc8ce', { rough: frosty ? 0.3 : 0.05 });
      g.lathe(x, z, [[0.12, y], [0.12, y + 0.32]], { segs: 6, capTop: false, capBottom: false });
      g.mat('cast', frosty ? '#dfe9ee' : lids[(i * 3 + k) % lids.length], { rough: -0.05 });
      g.lathe(x, z, [[0.127, y + 0.3], [0.127, y + 0.37], [0, y + 0.375]], { segs: 6, capBottom: false });
    }
  }
  // the top: a cap, the drive housing, a band painted in the row's colour with the carousel's number
  const yt = CAR.top;
  g.mat('brushed', '#c4d0d6'); g.lathe(0, 0, [[r, yt - 0.2], [r, yt - 0.1], [0.5, yt], [0, yt]], { segs: 14, capBottom: false });
  g.mat('paint', ['#8a6a2a', '#2f6a5e', '#4a3f7a'][row] || '#2f4a5e'); g.lathe(0, 0, [[0.55, yt], [0.55, yt + 0.5]], { segs: 12, capTop: false, capBottom: false });
  g.mat('cast', '#3a4248'); g.cyl(0, yt + 0.5, 0, 0.6, 0.1, { segs: 12 }); g.cyl(0.25, yt + 0.6, 0.1, 0.12, 0.3, { segs: 8 });
  g.mat('diffuser', '#7fe0d0', { emissive: 2.4 }); g.box(-0.05, yt + 0.62, 0.52, 0.05, yt + 0.68, 0.6);
  if (R && label) glyphRing(g, R, label, 1, yt + 0.25, 0.565, 0.17, 0.36);
}
defineProp('keellib.carousel', (g, p) => { drawCarousel(g, p.row || 0, null, null); return { tier: 's', cast: false }; });

// ---------------------------------------------------------------------------------------------------------------
// The stacker crane: a mast on a floor rail and a top rail, a carriage that climbs it, and forks that reach out for a tin.
// Drawn in three pieces that move: the mast (local zero at the floor, in the aisle's middle), the carriage, the forks.
// ---------------------------------------------------------------------------------------------------------------
export const MAST_H = 18.4;
export function drawMast(g) {
  // the bogie on the floor rail, the top guide, the two mast rails and their lacing
  g.mat('paint', C.crane, { rough: -0.1 }); g.box(-0.75, 0.05, -0.3, 0.75, 0.55, 0.3, { bevel: 0.03 });
  g.mat('cast', '#2a3036'); for (const x of [-0.5, 0.5]) { g.push(); g.move(x, 0.12, 0); g.rotX(PI / 2); g.cyl(0, -0.33, 0, 0.12, 0.66, { segs: 10 }); g.pop(); }
  g.mat('paint', '#262a2e'); g.box(-0.6, 0.2, 0.3, 0.6, 0.45, 0.31, { faces: 'Z' });
  for (let i = 0; i < 5; i++) { g.mat('paint', i % 2 ? '#262a2e' : C.crane); g.box(-0.6 + i * 0.24, 0.2, 0.311, -0.36 + i * 0.24, 0.45, 0.315, { faces: 'Z' }); }
  g.mat('paint', C.crane, { rough: -0.1 });
  for (const x of [-0.24, 0.24]) g.box(x - 0.07, 0.55, -0.12, x + 0.07, MAST_H - 0.4, 0.12, { faces: 'xXzZ' });
  g.mat('cast', '#6a5a2a');
  for (let y = 1.2; y < MAST_H - 1; y += 1.2) { g.tube([[-0.2, y, 0.1], [0.2, y + 0.6, 0.1]], 0.016, { segs: 4, caps: false }); g.tube([[0.2, y + 0.6, 0.1], [-0.2, y + 1.2, 0.1]], 0.016, { segs: 4, caps: false }); }
  g.mat('paint', C.crane, { rough: -0.1 }); g.box(-0.6, MAST_H - 0.4, -0.2, 0.6, MAST_H, 0.2, { bevel: 0.02 });
  g.mat('cast', '#2a3036'); for (const x of [-0.4, 0.4]) g.cyl(x, MAST_H, 0, 0.08, 0.25, { segs: 8 });
  // an amber lamp at the top, the cable drum at the foot
  g.mat('diffuser', '#ffb040', { emissive: 4 }); g.ball(0, MAST_H + 0.08, 0.22, 0.07, 0.07, 0.07, { segs: 8, rings: 5 });
  g.mat('cast', '#3a4248'); g.push(); g.move(0, 0.85, -0.2); g.rotZ(PI / 2); g.cyl(0, -0.3, 0, 0.22, 0.6, { segs: 12 }); g.pop();
}
export function drawCarriage(g) {
  g.mat('paint', C.crane, { rough: -0.1 }); g.box(-0.45, -0.3, -0.42, 0.45, 0.3, 0.42, { bevel: 0.025 });
  g.mat('paint', '#262a2e'); g.box(-0.46, -0.06, -0.43, 0.46, 0.06, 0.43, { faces: 'xXzZ' });
  // the working lamp, blue-white, and a small green ready lamp
  g.mat('diffuser', '#d8eeff', { emissive: 2 }); g.box(-0.18, -0.36, -0.2, 0.18, -0.3, 0.2, { faces: 'y' });
  g.mat('diffuser', '#7fe08a', { emissive: 3 }); g.box(0.3, 0.18, 0.43, 0.38, 0.24, 0.44, { faces: 'Z' });
  g.mat('cast', '#3a4248'); g.box(-0.3, 0.3, -0.3, 0.3, 0.38, 0.3);
}
// the forks: two tines and a cradle that take a tin by its waist, reaching toward -z
export function drawForks(g) {
  g.mat('brushed', '#b7c3c9', { rough: -0.1 });
  for (const x of [-0.15, 0.15]) g.box(x - 0.03, -0.04, -0.75, x + 0.03, 0.02, 0.05);
  g.box(-0.2, -0.06, -0.06, 0.2, 0.06, 0.06, { bevel: 0.01 });
  g.mat('cast', '#3a4248'); g.box(-0.19, -0.03, -0.78, 0.19, 0.03, -0.72);
}
export function drawTin(g, lid) {
  g.mat('brushed', '#e2ecf1', { rough: 0.2 }); g.lathe(0, 0, [[0.12, 0], [0.12, 0.32]], { segs: 8, capBottom: true, capTop: false });
  g.mat('cast', lid, { rough: -0.05 }); g.lathe(0, 0, [[0.127, 0.3], [0.127, 0.37], [0, 0.375]], { segs: 8, capBottom: false });
}

// ---------------------------------------------------------------------------------------------------------------
// The warm side
// ---------------------------------------------------------------------------------------------------------------
// A gallery bench, upholstered, facing +z. p: { w, cloth }
defineProp('keellib.bench', (g, p) => {
  const w = p.w || 2.4, cloth = p.cloth || C.oxblood;
  g.mat('wood', C.walnut, { rough: -0.1 });
  for (const sx of [-1, 1]) { const x = sx * (w / 2 - 0.08); g.box(x - 0.06, 0, -0.24, x + 0.06, 0.4, 0.24, { bevel: 0.015 }); }
  g.box(-w / 2, 0.3, -0.26, w / 2, 0.36, 0.26, { bevel: 0.012 });
  g.mat('weave', cloth, { rough: 0.15 }); g.box(-w / 2 + 0.04, 0.36, -0.24, w / 2 - 0.04, 0.46, 0.24, { bevel: 0.05 });
  g.mat('cast', C.brass); for (let x = -w / 2 + 0.2; x < w / 2 - 0.1; x += 0.28) g.ball(x, 0.42, 0.245, 0.012, 0.012, 0.008, { segs: 6, rings: 3 });
  // a mend: a patch of a brighter cloth, sewn on with gold thread
  g.mat('weave', '#c9962e'); g.box(w * 0.22, 0.461, -0.05, w * 0.22 + 0.22, 0.466, 0.13, { faces: 'Y' });
  const spots = []; for (let x = -w / 2 + 0.4; x <= w / 2 - 0.39; x += 0.62) spots.push({ type: 'sit', x, y: 0.46, z: 0.02, yaw: 0 });
  return { solid: [[-w / 2, 0, -0.26, w / 2, 0.46, 0.26]], spots, tier: 'd', surf: 'wood' };
});

// A reading lamp: brass foot and stem, a green glass shade that glows. p: { h } (on a table: h small)
defineProp('keellib.greenlamp', (g, p) => {
  const h = p.h || 0.42;
  g.mat('cast', C.brass, { rough: -0.2 }); g.lathe(0, 0, [[0.09, 0], [0.09, 0.015], [0.05, 0.03], [0.015, 0.05], [0.012, h - 0.06], [0.02, h - 0.05]], { segs: 10 });
  g.tube([[0, h - 0.06, 0], [0, h - 0.02, 0.02]], 0.008, { segs: 4 });
  g.mat('cast', '#1f6a40', { rough: -0.3 }); g.push(); g.move(0, h, 0.02); g.rotZ(PI / 2); g.lathe(0, 0, [[0, -0.2], [0.08, -0.19], [0.09, 0], [0.08, 0.19], [0, 0.2]], { segs: 10 }); g.pop();
  g.mat('diffuser', '#fff0c8', { emissive: 5, lamp: true }); g.box(-0.16, h - 0.08, -0.04, 0.16, h - 0.07, 0.08, { faces: 'y' });
  g.mat('diffuser', '#4fae74', { emissive: 0.5, lamp: true }); g.push(); g.move(0, h + 0.004, 0.02); g.rotZ(PI / 2); g.lathe(0, 0, [[0, -0.19], [0.06, -0.18], [0.07, 0], [0.06, 0.18], [0, 0.19]], { segs: 8 }); g.pop();
  return { tier: 'd', cast: false };
});

// A standard lamp for the gallery: brass pole, green shade. p: {}
defineProp('keellib.floorlamp', (g) => {
  g.mat('cast', C.brass, { rough: -0.2 }); g.lathe(0, 0, [[0.18, 0], [0.18, 0.025], [0.06, 0.05], [0.02, 0.09], [0.016, 1.5], [0.025, 1.52]], { segs: 10 });
  g.mat('cast', C.shade, { rough: -0.15 }); g.lathe(0, 0, [[0.3, 1.38], [0.25, 1.48], [0.12, 1.6], [0.04, 1.63]], { segs: 14, capBottom: false });
  g.mat('paint', '#f2e6c8', { emissive: 1.2, lamp: true }); g.lathe(0, 0, [[0.29, 1.385], [0.24, 1.47], [0.03, 1.6]], { segs: 14, capBottom: false, capTop: false });
  g.mat('diffuser', '#fff0c8', { emissive: 6, lamp: true }); g.ball(0, 1.46, 0, 0.06, 0.06, 0.06, { segs: 8, rings: 5 });
  return { posts: [[0, 0, 0.18, 0, 1.6]], tier: 'd', cast: false };
});

// A ledger: open (two pages and a ribbon) or shut. p: { open, cover }
defineProp('keellib.ledger', (g, p) => {
  const cv = p.cover || '#6e2a2a';
  if (p.open) {
    g.mat('weave', cv, { rough: 0.1 }); g.box(-0.3, 0, -0.2, 0.3, 0.012, 0.2);
    g.mat('paper', '#efe6d0'); g.box(-0.285, 0.012, -0.19, -0.005, 0.03, 0.19, { faces: 'xXzZY' }); g.box(0.005, 0.012, -0.19, 0.285, 0.03, 0.19, { faces: 'xXzZY' });
    g.mat('paint', '#3a3430', { rough: 0.3 }); for (let k = 0; k < 9; k++) { const z = -0.15 + k * 0.035; g.box(-0.26, 0.031, z, -0.04, 0.0312, z + 0.004, { faces: 'Y' }); g.box(0.04, 0.031, z, 0.24 - (k % 3) * 0.05, 0.0312, z + 0.004, { faces: 'Y' }); }
    g.mat('weave', '#c9962e'); g.box(-0.005, 0.03, -0.19, 0.005, 0.032, 0.25, { faces: 'Y' });
  } else {
    g.mat('weave', cv, { rough: 0.1 }); g.box(-0.21, 0, -0.29, 0.21, 0.06, 0.29, { bevel: 0.006 });
    g.mat('paper', '#e6dcc4'); g.box(-0.2, 0.005, -0.28, 0.2, 0.055, 0.285, { faces: 'Z' });
  }
  return { tier: 'd', cast: false };
});

// A long reading table with its lamps down the middle and ledgers at some places. p: { w, seed }
defineProp('keellib.readtable', (g, p) => {
  const w = p.w || 11, d = 1.2, h = 0.75;
  g.mat('wood', C.walnut, { rough: -0.12 }); g.box(-w / 2, h - 0.05, -d / 2, w / 2, h, d / 2, { bevel: 0.012 });
  g.mat('weave', C.green, { rough: 0.2 }); g.box(-w / 2 + 0.25, h, -d / 2 + 0.12, w / 2 - 0.25, h + 0.003, d / 2 - 0.12, { faces: 'Y' });
  g.mat('wood', '#4a3424');
  for (let x = -w / 2 + 0.25; x <= w / 2 - 0.24; x += (w - 0.5) / Math.max(1, Math.round((w - 0.5) / 2.6))) {
    g.box(x - 0.05, 0, -d / 2 + 0.12, x + 0.05, h - 0.05, -d / 2 + 0.22); g.box(x - 0.05, 0, d / 2 - 0.22, x + 0.05, h - 0.05, d / 2 - 0.12);
    g.box(x - 0.04, 0.12, -d / 2 + 0.15, x + 0.04, 0.18, d / 2 - 0.15);
  }
  g.box(-w / 2 + 0.25, h - 0.15, -0.03, w / 2 - 0.25, h - 0.05, 0.03);
  // a raised spine down the middle carrying the lamps' wiring, with a brass rail
  g.mat('wood', '#4a3424'); g.box(-w / 2 + 0.3, h, -0.06, w / 2 - 0.3, h + 0.08, 0.06, { bevel: 0.01 });
  g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[-w / 2 + 0.3, h + 0.1, 0], [w / 2 - 0.3, h + 0.1, 0]], 0.008, { segs: 5 });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's', cast: true, surf: 'wood' };
});

// Tall shelving full of ledgers, spines in every colour, the old ones darker. p: { w, h, seed }
const SPINES = ['#6e2a2a', '#2f5a44', '#2f4a6a', '#8a6a2a', '#5b4060', '#3a3430', '#7a3a2a', '#2c4a52', '#a8432e', '#4a5a2a'];
defineProp('keellib.files', (g, p) => {
  const w = p.w || 2.4, h = p.h || 3.6, d = 0.4, n = 6, seed = p.seed || 0;
  g.mat('wood', C.walnut, { rough: -0.05 });
  g.box(-w / 2, 0, -d / 2, -w / 2 + 0.04, h, d / 2, { bevel: 0.008 }); g.box(w / 2 - 0.04, 0, -d / 2, w / 2, h, d / 2, { bevel: 0.008 });
  g.box(-w / 2, h - 0.08, -d / 2, w / 2, h, d / 2 + 0.03, { bevel: 0.01 });
  g.box(-w / 2 + 0.04, 0, -d / 2 + 0.02, w / 2 - 0.04, 0.12, d / 2, { faces: 'yYZ' });
  g.mat('wood', '#3a2a1e'); g.box(-w / 2 + 0.04, 0.12, -d / 2, w / 2 - 0.04, h - 0.08, -d / 2 + 0.012, { faces: 'Z' });
  for (let i = 0; i < n; i++) {
    const y0 = 0.12 + i * (h - 0.2) / n;
    g.mat('wood', C.walnut); g.box(-w / 2 + 0.04, y0, -d / 2 + 0.01, w / 2 - 0.04, y0 + 0.025, d / 2, { faces: 'yYZ' });
    // a brass label rail
    g.mat('cast', C.brass, { rough: -0.1 }); g.box(-w / 2 + 0.04, y0 - 0.002, d / 2, w / 2 - 0.04, y0 + 0.022, d / 2 + 0.006, { faces: 'Z' });
    // ledgers, upright, some leaning, a gap here and there
    let x = -w / 2 + 0.07; let k = (seed * 13 + i * 7) % 97;
    const top = (h - 0.2) / n - 0.06;
    while (x < w / 2 - 0.12) {
      k = (k * 37 + 11) % 101;
      const bw = 0.045 + (k % 5) * 0.012, bh = Math.min(top, 0.26 + (k % 7) * 0.025), bd = 0.26 + (k % 3) * 0.03;
      if (k % 23 === 0) { x += 0.12; continue; }
      g.mat('weave', SPINES[k % SPINES.length], { rough: 0.15 });
      g.box(x, y0 + 0.025, d / 2 - 0.02 - bd, x + bw, y0 + 0.025 + bh, d / 2 - 0.02, { faces: 'xXYZ' });
      if (k % 4 === 0) { g.mat('cast', '#c9a45a'); g.box(x + 0.006, y0 + 0.025 + bh * 0.7, d / 2 - 0.019, x + bw - 0.006, y0 + 0.025 + bh * 0.76, d / 2 - 0.018, { faces: 'Z' }); }
      x += bw + 0.004;
    }
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], tier: 's', cast: false, surf: 'wood' };
});

// A section of the cooks' doors: small brass doors, each with a card behind a window and a knob. Facing +z.
// p: { cols, rows, pitch, blank (a count of empty slots at the end, for the new wall) }
defineProp('keellib.doors', (g, p) => {
  const cols = p.cols || 12, rows = p.rows || 10, P = p.pitch || 0.3, w = cols * P, h = rows * P, blank = p.blank || 0;
  g.mat('wood', '#3a2a1e'); g.box(-w / 2 - 0.06, -0.06, -0.06, w / 2 + 0.06, h + 0.06, 0, { faces: 'xXyYZ' });
  let n = 0;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = -w / 2 + (i + 0.5) * P, y = (j + 0.5) * P; n++;
    if (n > cols * rows - blank) { g.mat('cast', '#2a2622'); g.box(x - P / 2 + 0.02, y - P / 2 + 0.02, -0.005, x + P / 2 - 0.02, y + P / 2 - 0.02, 0.002, { faces: 'Z' }); continue; }
    const worn = ((i * 7 + j * 13) % 11) === 0;
    g.mat('cast', worn ? '#d9b46a' : ((i + j) % 3 ? '#a8823e' : '#9a7638'), { rough: worn ? -0.3 : -0.15 });
    g.box(x - P / 2 + 0.018, y - P / 2 + 0.018, 0, x + P / 2 - 0.018, y + P / 2 - 0.018, 0.022, { faces: 'xXyYZ' });
    g.mat('paper', (i * 5 + j * 3) % 17 === 0 ? '#e8c4a0' : '#efe6d0'); g.box(x - 0.08, y + 0.02, 0.022, x + 0.08, y + 0.08, 0.024, { faces: 'Z' });
    g.mat('cast', '#3a2a1e'); g.box(x - 0.012, y - 0.08, 0.022, x + 0.012, y - 0.05, 0.05, { faces: 'xXyYZ' });
  }
  return { solid: [[-w / 2 - 0.06, -0.06, -0.06, w / 2 + 0.06, h + 0.06, 0.05]], tier: 's', cast: false, surf: 'metal' };
});

// A long quilted coat on a peg: body, sleeves, a mended elbow in a brighter colour, a name tape in the lining. p: { cloth, mend }
defineProp('keellib.coat', (g, p) => {
  const c = p.cloth || '#2f5a44';
  g.mat('weave', c, { rough: 0.2 });
  g.box(-0.24, -1.15, -0.07, 0.24, -0.1, 0.07, { bevel: 0.05 });
  for (let y = -1.05; y < -0.15; y += 0.16) { g.mat('weave', c); g.box(-0.245, y, 0.06, 0.245, y + 0.012, 0.075, { faces: 'Z' }); }
  g.mat('weave', c); g.box(-0.34, -0.85, -0.06, -0.24, -0.12, 0.05, { bevel: 0.03 }); g.box(0.24, -0.85, -0.06, 0.34, -0.12, 0.05, { bevel: 0.03 });
  g.box(-0.13, -0.12, -0.06, 0.13, 0.0, 0.06, { bevel: 0.03 });
  g.mat('knit', p.mend || '#c9962e'); g.box(0.25, -0.62, 0.05, 0.34, -0.5, 0.058, { faces: 'Z' });
  g.mat('weave', '#efe6d0'); g.box(-0.05, -0.16, 0.06, 0.05, -0.12, 0.066, { faces: 'Z' });
  return { tier: 'd', cast: false };
});

// A pair of felt overshoes. p: { felt }
defineProp('keellib.overshoes', (g, p) => {
  g.mat('felt', p.felt || '#6b7a8a', { rough: 0.2 });
  for (const x of [-0.07, 0.07]) { g.box(x - 0.055, 0, -0.14, x + 0.055, 0.07, 0.14, { bevel: 0.03 }); g.box(x - 0.05, 0.05, -0.13, x + 0.05, 0.13, -0.02, { bevel: 0.03 }); }
  return { tier: 'd', cast: false };
});

// The glove box at the receiving bench: a steel cabinet with a sloped glass front and two black gloves through it, facing +z.
defineProp('keellib.glovebox', (g) => {
  const w = 1.6, d = 0.8;
  g.mat('brushed', '#c9cfcc', { rough: -0.15 }); g.box(-w / 2, 0, -d / 2, w / 2, 0.88, d / 2, { bevel: 0.01 });
  g.mat('brushed', '#a9b0ad'); g.box(-w / 2 + 0.05, 0.1, d / 2, w / 2 - 0.05, 0.8, d / 2 + 0.005, { faces: 'Z' });
  g.mat('brushed', '#d8dedb', { rough: -0.2 }); g.box(-w / 2, 0.88, -d / 2, w / 2, 1.0, d / 2, { bevel: 0.01 });
  // the cabinet: back, sides, top, a sloped front frame
  g.box(-w / 2, 1.0, -d / 2, w / 2, 1.75, -d / 2 + 0.05); g.box(-w / 2, 1.0, -d / 2, -w / 2 + 0.05, 1.75, d / 2 - 0.25); g.box(w / 2 - 0.05, 1.0, -d / 2, w / 2, 1.75, d / 2 - 0.25);
  g.box(-w / 2, 1.7, -d / 2, w / 2, 1.78, d / 2 - 0.22, { bevel: 0.01 });
  g.mat('cast', '#3a4248');
  g.tube([[-w / 2, 1.0, d / 2 - 0.02], [-w / 2, 1.76, d / 2 - 0.24]], 0.025, { segs: 5 }); g.tube([[w / 2, 1.0, d / 2 - 0.02], [w / 2, 1.76, d / 2 - 0.24]], 0.025, { segs: 5 });
  // glove ports and the gloves, hanging in
  for (const x of [-0.32, 0.32]) {
    g.push(); g.move(x, 1.24, d / 2 - 0.1); g.rotX(PI / 2 - 0.5); g.mat('cast', '#3a4248'); g.cyl(0, -0.03, 0, 0.11, 0.06, { segs: 14 }); g.pop();
    g.mat('weave', '#1e1e22', { rough: -0.2 }); g.tube([[x, 1.24, d / 2 - 0.12], [x * 0.8, 1.16, d / 2 - 0.35], [x * 0.5, 1.08, d / 2 - 0.5]], [0.075, 0.06, 0.05], { segs: 8 });
  }
  // inside: a pot from the Gate, its seal, a rack of four vials, a small lamp
  g.mat('glaze', '#d9cfb8', { rough: -0.2 }); g.lathe(-0.05, -0.1, [[0.07, 1.0], [0.08, 1.06], [0.075, 1.12], [0.06, 1.13]], { segs: 12 });
  g.mat('paint', C.red); g.cyl(-0.05, 1.13, -0.1, 0.062, 0.02, { segs: 12 });
  g.mat('brushed', '#b7c3c9'); g.box(0.2, 1.0, -0.15, 0.42, 1.04, -0.08);
  for (let i = 0; i < 4; i++) { g.mat('diffuser', '#f2f6f8', { emissive: 0.3 }); g.cyl(0.23 + i * 0.055, 1.04, -0.115, 0.012, 0.07, { segs: 6 }); g.mat('paint', LIDS[2][i]); g.cyl(0.23 + i * 0.055, 1.11, -0.115, 0.014, 0.012, { segs: 6 }); }
  g.mat('diffuser', '#eef6ff', { emissive: 1.4 }); g.box(-0.5, 1.68, -0.3, 0.5, 1.69, -0.2, { faces: 'y' });
  return { solid: [[-w / 2, 0, -d / 2, w / 2, 1.78, d / 2]], glass: [[-w / 2 + 0.03, 1.0, d / 2 - 0.02, w / 2 - 0.03, 1.76, d / 2 - 0.02, { tint: '#dfeae6', opacity: 0.1 }]], tier: 's', cast: true, surf: 'metal' };
});

// A steel bench with a shelf. p: { w, d, h }
defineProp('keellib.steelbench', (g, p) => {
  const w = p.w || 2.4, d = p.d || 0.7, h = p.h || 0.9;
  g.mat('brushed', '#cfd3d0', { rough: -0.2 }); g.box(-w / 2, h - 0.04, -d / 2, w / 2, h, d / 2, { bevel: 0.01 });
  g.box(-w / 2 + 0.05, 0.18, -d / 2 + 0.05, w / 2 - 0.05, 0.21, d / 2 - 0.05);
  g.mat('brushed', '#a9ada8'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.06) - 0.025, 0, sz * (d / 2 - 0.06) - 0.025, sx * (w / 2 - 0.06) + 0.025, h - 0.04, sz * (d / 2 - 0.06) + 0.025);
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], surf: 'metal', tier: 'd' };
});

// A benchtop instrument: a pale case with a lid, a small screen of lamps, a sample door. p: { w, lit }
defineProp('keellib.reader', (g, p) => {
  const w = p.w || 0.6;
  g.mat('paint', '#e6e9e4', { rough: -0.1 }); g.box(-w / 2, 0, -0.25, w / 2, 0.42, 0.25, { bevel: 0.02 });
  g.mat('paint', '#2f4a5e'); g.box(-w / 2 + 0.04, 0.3, 0.25, w / 2 - 0.04, 0.38, 0.252, { faces: 'Z' });
  g.mat('diffuser', p.lit || '#7fe0d0', { emissive: 2 }); for (let i = 0; i < 4; i++) g.box(-w / 2 + 0.08 + i * 0.06, 0.32, 0.252, -w / 2 + 0.11 + i * 0.06, 0.35, 0.254, { faces: 'Z' });
  g.mat('brushed', '#b7bdb8'); g.box(0.02, 0.06, 0.25, w / 2 - 0.06, 0.24, 0.255, { faces: 'Z' });
  return { solid: [[-w / 2, 0, -0.25, w / 2, 0.42, 0.25]], tier: 'd' };
});

// The courier's cold box: lagged, strapped, a red seal tag, a little frost at the lid. p: {}
defineProp('keellib.coldbox', (g) => {
  g.mat('paint', '#2f6f73', { rough: -0.05 }); g.box(-0.3, 0.02, -0.22, 0.3, 0.42, 0.22, { bevel: 0.03 });
  g.mat('paint', '#e6ebe8'); g.box(-0.31, 0.42, -0.23, 0.31, 0.5, 0.23, { bevel: 0.02 });
  g.mat('plain', C.frost, { rough: 0.3 }); g.box(-0.3, 0.405, -0.225, 0.3, 0.425, 0.225, { faces: 'xXzZ' });
  g.mat('weave', '#3a3430'); for (const x of [-0.18, 0.18]) g.box(x - 0.025, 0.0, -0.235, x + 0.025, 0.51, 0.235, { faces: 'xXzZY' });
  g.tube([[-0.18, 0.51, 0], [-0.12, 0.66, 0], [0.12, 0.66, 0], [0.18, 0.51, 0]], 0.012, { segs: 5 });
  g.mat('paint', C.red); g.box(0.2, 0.25, 0.225, 0.27, 0.36, 0.232, { faces: 'Z' });
  g.mat('cast', '#3a4248'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.25 - 0.03, 0, sz * 0.17 - 0.03, sx * 0.25 + 0.03, 0.03, sz * 0.17 + 0.03);
  return { solid: [[-0.31, 0, -0.24, 0.31, 0.5, 0.24]], tier: 'd' };
});

// A low trolley with a crate from the Gate on it, the seal still on. p: {}
defineProp('keellib.trolley', (g) => {
  g.mat('brushed', '#a9b0ad'); g.box(-0.6, 0.18, -0.4, 0.6, 0.22, 0.4, { bevel: 0.01 });
  g.tube([[0.6, 0.22, -0.4], [0.68, 0.95, -0.4], [0.68, 0.95, 0.4], [0.6, 0.22, 0.4]], 0.02, { segs: 5 });
  g.mat('cast', '#2a3036'); for (const sx of [-0.48, 0.48]) for (const sz of [-0.32, 0.32]) { g.push(); g.move(sx, 0.08, sz); g.rotX(PI / 2); g.cyl(0, -0.025, 0, 0.08, 0.05, { segs: 10 }); g.pop(); }
  g.mat('paint', '#d9d4c6'); g.box(-0.45, 0.22, -0.3, 0.35, 0.62, 0.3, { bevel: 0.02 });
  g.mat('paint', '#2f4a5e'); g.box(-0.45, 0.4, -0.301, 0.35, 0.46, 0.301, { faces: 'zZ' });
  g.mat('paint', C.red); g.box(-0.1, 0.5, 0.301, 0.0, 0.6, 0.306, { faces: 'Z' }); g.tube([[-0.05, 0.62, 0.3], [-0.05, 0.66, 0.2], [-0.05, 0.62, 0.1]], 0.006, { segs: 4 });
  return { solid: [[-0.62, 0, -0.42, 0.7, 0.95, 0.42]], tier: 'd' };
});

// A cab berth door pair with the call lamp, on a wall, facing +z. p: {}
defineProp('keellib.berths', (g) => {
  for (const bz of [-1.6, 1.6]) {
    const bw = 1.3;
    g.mat('stone', '#9c8f7c'); g.box(bz - bw / 2 - 0.18, 0, 0, bz + bw / 2 + 0.18, 2.62, 0.16, { bevel: 0.01 });
    g.mat('cast', C.brass, { rough: -0.1 }); g.box(bz - bw / 2, 0.02, 0.16, bz - 0.01, 2.36, 0.2); g.box(bz + 0.01, 0.02, 0.16, bz + bw / 2, 2.36, 0.2);
    g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(bz - bw / 2 + 0.06, yy, 0.2, bz + bw / 2 - 0.06, yy + 0.03, 0.215);
    g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(bz - 0.2, 2.44, 0.16, bz + 0.2, 2.52, 0.19);
    g.mat('cast', '#3a3430'); g.box(bz + bw / 2 + 0.25, 1.05, 0.0, bz + bw / 2 + 0.4, 1.3, 0.08, { bevel: 0.01 });
    g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.box(bz + bw / 2 + 0.3, 1.13, 0.08, bz + bw / 2 + 0.35, 1.2, 0.09);
  }
  return { solid: [[-2.6, 0, 0, 2.6, 2.62, 0.2]], tier: 's', cast: false };
});
