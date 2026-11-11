// Props, plan and small helpers for the Garden (the Keel's lamp-lit racks, deck 6, under Ring Four). Every prop is drawn
// at the origin with its front toward +z and cached by the few parameters it takes.
import { defineProp } from '../world/props.js';
import { cellInfo } from '../city/city.js';
import { ringOfCell } from '../core/layout.js';

export const PI = Math.PI;
export const REGION = 'keel-garden';

// ---------------------------------------------------------------------------------------------------------------
// the plan (frame 'keel-garden': x spinward, z toward the back cap, y up; deck 6 at y = 0, deck 10's ceiling at 21.6)
// ---------------------------------------------------------------------------------------------------------------
// The Greens: five decks of racks behind glass, x[0, 344] z[0, 28.4], roof at 19.4 (under deck 11). The Glass Walk runs
// beside them at z[-4, 0].
export const HALL = { x0: 0, x1: 344, z0: 0, z1: 28.4, h: 19.4 };
export const GAL = { z0: -4, z1: 0 };
// rack rows: centre z and the crop pattern they carry; depth 1.4. The street (z 11.2 to 17.2) carries the crate belt.
export const RACK_D = 0.7;
export const ROWS = [
  { z: 2.5, name: 'A', crops: ['lettuce', 'redleaf', 'lettuce', 'seed', 'lettuce', 'redleaf'] },
  { z: 6.5, name: 'B', crops: ['basil', 'chervil', 'basil', 'coriander', 'chervil', 'seed'] },
  { z: 10.5, name: 'C', crops: ['chive', 'chive', 'cress', 'chive', 'seed', 'cress'] },
  { z: 17.9, name: 'D', crops: ['cucumber', 'cucumber', 'chard', 'cucumber', 'seed', 'chard'] },
  { z: 21.9, name: 'E', crops: ['chard', 'lettuce', 'redleaf', 'seed', 'chard', 'lettuce'] },
  { z: 25.9, name: 'F', crops: ['chervil', 'coriander', 'basil', 'chervil', 'cress', 'seed'] },
];
// the lanes between and beside the racks (z), where the lifts run and the lamps hang
export const LANES = [0.9, 4.5, 8.5, 14.2, 20.0, 23.9, 27.5];
export const STREET = { z0: 11.2, z1: 17.2, belt: 13.6 };
// bays: 8 m long, a cross gap of 2.4 m after every tenth
export const BAY = 8, RX0 = 8;
export function bays() { const out = []; let x = RX0; for (let i = 0; i < 40; i++) { out.push([x, x + BAY, i]); x += BAY; if (i % 10 === 9 && i < 39) x += 2.4; } return out; }
export const RX1 = RX0 + 40 * BAY + 3 * 2.4;          // 335.2
// shelf heights: twenty a face, about a metre apart; the deck lines at 4, 8, 12 and 16
export const SHELF = []; for (let k = 0; k < 20; k++) SHELF.push(0.42 + k * 0.92);
export const RACK_TOP = 19.0;
// the packing hall at the anti end, the cab lobby beyond it, the far lobby at the spinward end
export const PACK = { x0: -24, x1: 0, z0: -4, z1: 28.4, h: 12 };
export const LOBBY = { x0: -36, x1: -24, z0: 8, z1: 20, h: 3.6 };
export const BELT_X0 = PACK.x0 + 8;
export const FAR = { x0: 344, x1: 354, z0: -7, z1: 1, h: 3.6 };
// the smaller rooms off the Glass Walk's outer side (z < -4)
export const TOMATO = { x0: 16, x1: 42, z0: -19, z1: -4, h: 4.4 };
export const TEA = { x0: 56, x1: 84, z0: -18, z1: -4, h: 3.8 };
export const COOL = { x0: 98, x1: 118, z0: -17, z1: -4, h: 3.2 };
export const TANKS = { x0: 132, x1: 160, z0: -19, z1: -4, h: 6.2 };
export const HALL_CLIP = [-0.5, -0.5, GAL.z0 - 0.2, HALL.x1 + 0.5, HALL.h + 0.2, HALL.z1 + 0.5];

// colours
export const C = {
  pink: '#ff2a9a', pinkLight: [1.0, 0.16, 0.62], white: '#f2f0ff', violet: '#b064ff',
  tray: '#38423e', frame: '#d9d6cc', frameDark: '#5a6360', deck: '#d98a3a', glassTint: '#e4d6ea',
  cream: '#efe4c8', brass: '#b08a45', steel: '#b9b6ae', dark: '#2c3133', loop: '#a8432e', ret: '#2f6f73', water: '#2f6f8f',
  crate: '#b08d5e',
};

// crops: leaf texture, tint, height of the leaf strip, sprig spacing along the tray
export const CROPS = {
  lettuce: { mat: 'leafA', tint: '#b8f098', h: 0.27, mass: '#2a4a20' },
  redleaf: { mat: 'leafA', tint: '#f090a8', h: 0.25, mass: '#3e1c2a' },
  basil: { mat: 'leafA', tint: '#a0f088', h: 0.33, mass: '#1e3e1a' },
  chervil: { mat: 'fern', tint: '#b8f0a0', h: 0.3, mass: '#24441e' },
  coriander: { mat: 'leafB', tint: '#a8f090', h: 0.3, mass: '#20401a' },
  chive: { mat: 'leafB', tint: '#98e0b8', h: 0.42, mass: '#1a3a28' },
  cress: { mat: 'leafB', tint: '#c8f090', h: 0.18, mass: '#2c461c' },
  chard: { mat: 'leafA', tint: '#d8c0a0', h: 0.4, mass: '#2e1c20' },
  seed: { mat: 'leafB', tint: '#f0ffe0', h: 0.08, mass: null },
  cucumber: { mat: 'leafA', tint: '#a8e890', h: 0.3, mass: '#1e3e18' },
};

// ---------------------------------------------------------------------------------------------------------------
// small helpers, safe when the UI or audio is missing
// ---------------------------------------------------------------------------------------------------------------
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: 6 }); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }
export function find(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
// Wait a frame between big parts of the build, then take the region's atlas group back (another builder may have had it).
export async function tick(game) {
  await new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });
  if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + REGION);
}
// Run fn(a, b, i) over [a0, a1] in pieces no longer than `step` (long things must be cut so the drum can bend them).
export function runX(a0, a1, step, fn) { const n = Math.max(1, Math.ceil((a1 - a0) / step)); for (let i = 0; i < n; i++) fn(a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n, i); }
export function lineX(a0, a1, y, z, step = 3) { const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / step)), out = []; for (let i = 0; i <= n; i++) out.push([a0 + (a1 - a0) * i / n, y, z]); return out; }
// One line of a list chosen by a number, so the same thing reads differently in different places.
export function pickBy(list, k) { return list[((k % list.length) + list.length) % list.length]; }

// ---------------------------------------------------------------------------------------------------------------
// the blocks this Garden sends to: Ring Four's blocks, by name, with their halls
// ---------------------------------------------------------------------------------------------------------------
let SENDS = null;
export function sends() {
  if (SENDS) return SENDS;
  const out = [];
  const js = []; for (let j = 1; j <= 17; j++) if (ringOfCell(j) === 4) js.push(j);
  if (!js.length) js.push(7);
  const Ls = [0, 2, 3, 5, 8, 11, 14, 17, 21, 26, 30, 34];
  for (let k = 0; out.length < 40 && k < 400; k++) {
    const L = Ls[k % Ls.length], i = ((k * 37) % 41) - 20, j = js[k % js.length];
    let c = null; try { c = cellInfo(L, i, j); } catch (e) { c = null; }
    if (!c || out.some((q) => q.name === c.name)) continue;
    out.push({ name: c.name, hall: c.hall, cook: c.cook, decks: c.d0 + ' to ' + c.d1 });
  }
  while (out.length < 40) out.push({ name: 'Block ' + (out.length + 1), hall: 'the hall', cook: 'the cook', decks: '' });
  SENDS = out;
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// one painted page: deck numbers and row letters (two colourings), and forty crate labels
// ---------------------------------------------------------------------------------------------------------------
export const GLYPHS = '0123456789ABCDEF· ';
export function gardenAtlas(game) {
  if (!game.atlas) return null;
  const S = sends();
  return game.atlas.add(1024, 512, (ctx, w, h) => {
    const n = GLYPHS.length, cw = w / n, ch = 48;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
      ctx.fillStyle = row ? '#d98a3a' : '#22302c'; ctx.fillRect(i * cw, row * ch, cw + 1, ch + 1);
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < 5; k++) ctx.fillRect(i * cw + ((k * 37 + i * 13) % 40), row * ch + ((k * 23 + i * 7) % 40), 5, 2);
      ctx.fillStyle = row ? '#22201c' : '#f1e6c9'; ctx.font = '600 ' + Math.round(ch * 0.84) + "px 'Barlow Condensed', sans-serif";
      ctx.fillText(GLYPHS[i], i * cw + cw / 2, row * ch + ch * 0.55);
    }
    // crate labels: 4 columns by 10 rows under the glyphs, each a paper tag with the block's name and its hall
    const y0 = 104, lw = w / 4, lh = (h - y0) / 10;
    const inks = ['#7a2a26', '#2f5d5a', '#33407a', '#5b4060', '#6b5a1a'];
    for (let k = 0; k < 40; k++) {
      const cx = (k % 4) * lw, cy = y0 + Math.floor(k / 4) * lh, s = S[k];
      ctx.fillStyle = k % 3 === 1 ? '#e8dcc0' : '#f1e8d2'; ctx.fillRect(cx + 2, cy + 2, lw - 4, lh - 4);
      ctx.fillStyle = inks[k % inks.length]; ctx.fillRect(cx + 2, cy + 2, 9, lh - 4);
      ctx.fillStyle = '#2a2420'; ctx.textAlign = 'left';
      let fs = 21; ctx.font = '600 ' + fs + "px 'Barlow Condensed', sans-serif";
      while (fs > 12 && ctx.measureText(s.name.toUpperCase()).width > lw - 30) { fs--; ctx.font = '600 ' + fs + "px 'Barlow Condensed', sans-serif"; }
      ctx.fillText(s.name.toUpperCase(), cx + 18, cy + lh * 0.36);
      let fs2 = 14; ctx.font = 'italic 500 ' + fs2 + "px 'Cormorant Garamond', serif";
      while (fs2 > 9 && ctx.measureText(s.hall).width > lw - 30) { fs2--; ctx.font = 'italic 500 ' + fs2 + "px 'Cormorant Garamond', serif"; }
      ctx.fillStyle = '#4a3a2a'; ctx.fillText(s.hall, cx + 18, cy + lh * 0.74);
    }
    ctx.textAlign = 'center';
  }, 'keelgarden.page');
}
// Draw one glyph as a quad in the local plane z = zf facing +z, centred at (cx, cy). Call g.atlas(R.page) first.
function glyph(g, R, chr, row, cx, cy, zf, w, h) {
  let i = GLYPHS.indexOf(chr); if (i < 0) i = GLYPHS.length - 1;
  const n = GLYPHS.length, du = (R.u1 - R.u0) / n, dv = (R.v1 - R.v0) * 48 / 512, ins = 0.04;
  const ua = R.u0 + du * (i + ins), ub = R.u0 + du * (i + 1 - ins), vt = R.v0 + dv * (row + ins), vb = R.v0 + dv * (row + 1 - ins);
  g.quad([cx - w / 2, cy - h / 2, zf], [cx + w / 2, cy - h / 2, zf], [cx + w / 2, cy + h / 2, zf], [cx - w / 2, cy + h / 2, zf], { uv: [ua, vb, ub, vt] });
}
// A word of glyphs centred at the local origin, facing +z.
export function glyphWord(g, R, text, row, cy, zf, w, h, o) {
  if (!R) return; g.atlas(R.page, Object.assign({ rough: 0.6 }, o || {}));
  for (let k = 0; k < text.length; k++) glyph(g, R, text[k], row, (k - (text.length - 1) / 2) * w, cy, zf, w, h);
}
// A crate label (k in 0..39) as a quad in the local plane z = zf facing +z, centred at (cx, cy), w by h.
export function crateLabel(g, R, k, cx, cy, zf, w, h) {
  if (!R) return; g.atlas(R.page, { rough: 0.7 });
  const lw = (R.u1 - R.u0) / 4, lh = (R.v1 - R.v0) * ((512 - 104) / 512) / 10, v0 = R.v0 + (R.v1 - R.v0) * 104 / 512;
  const kk = ((k % 40) + 40) % 40, ua = R.u0 + lw * (kk % 4) + lw * 0.01, ub = ua + lw * 0.98, vt = v0 + lh * Math.floor(kk / 4) + lh * 0.03, vb = vt + lh * 0.94;
  g.quad([cx - w / 2, cy - h / 2, zf], [cx + w / 2, cy - h / 2, zf], [cx + w / 2, cy + h / 2, zf], [cx - w / 2, cy + h / 2, zf], { uv: [ua, vb, ub, vt] });
}

// ---------------------------------------------------------------------------------------------------------------
// the rack bay: eight metres of a double-sided rack, twenty trays a face, a lamp bar over each
// p: { crop, lamp: 'pink' | 'white' | 'off', v (0..2, which trays are cut or newly set), cut: true for the bay at a cross gap end }
// ---------------------------------------------------------------------------------------------------------------
const LAMP_EM = { pink: ['#ff2a9a', 2.6], white: ['#f4eeff', 2.4], off: ['#3a2a36', 0] };
defineProp('keelgarden.bay', (g, p) => {
  const L = BAY, hx = L / 2, D = RACK_D, cr = CROPS[p.crop] || CROPS.lettuce, v = p.v || 0;
  const vine = p.crop === 'cucumber';
  const shelves = vine ? SHELF.filter((y, k) => k % 2 === 0) : SHELF;
  // uprights: one at the anti end and one in the middle of each face; a cross tie between them at every deck line
  g.mat('brushed', C.frame, { rough: 0.05 });
  for (const x of [-hx + 0.05, 0]) for (const sz of [-1, 1]) g.box(x - 0.05, 0, sz * D - 0.05 * sz - 0.03, x + 0.05, RACK_TOP, sz * D + 0.02 * sz, { faces: 'xXzZ' });
  // the deck lines: an orange beam along both faces at 4, 8, 12, 16 (the rack is five decks tall)
  g.mat('paint', C.deck, { rough: -0.1 });
  for (const y of [3.95, 7.95, 11.95, 15.95]) for (const sz of [-1, 1]) g.box(-hx, y - 0.07, sz * (D + 0.02) - 0.03, hx, y + 0.07, sz * (D + 0.02) + 0.03, { faces: 'yY' + (sz > 0 ? 'Z' : 'z') });
  // the cap
  g.mat('brushed', C.frameDark); g.box(-hx, RACK_TOP, -D - 0.04, hx, RACK_TOP + 0.14, D + 0.04, { faces: 'yYzZ' });
  g.mat('diffuser', p.lamp === 'off' ? '#5080ff' : '#7fe08a', { emissive: 3 }); for (const sz of [-1, 1]) g.box(-0.08, RACK_TOP + 0.03, sz * (D + 0.04) - 0.01, 0.08, RACK_TOP + 0.11, sz * (D + 0.04) + 0.01, { faces: sz > 0 ? 'Z' : 'z' });
  // trays, crops, lamps
  const lm = LAMP_EM[p.lamp] || LAMP_EM.pink;
  for (let k = 0; k < shelves.length; k++) {
    const y = shelves[k], top = y + 0.07, next = k + 1 < shelves.length ? shelves[k + 1] : RACK_TOP;
    // tray: dark, with a pale lip a picker can chalk on
    g.mat('panel', C.tray, { rough: 0.1 }); g.box(-hx + 0.06, y, -D, hx - 0.06, top, D, { faces: 'yY' });
    g.mat('paint', (k + v) % 5 === 2 ? '#c9c2b0' : '#4a5450', { rough: 0.1 }); g.box(-hx + 0.06, y, -D, hx - 0.06, top, D, { faces: 'zZ' });
    // which trays carry what: some are cut and empty, some newly set
    const state = (k * 7 + v * 5) % 11;
    const cut = state === 3 && !vine, fresh = state === 7 && !vine;
    if (!cut) {
      const c2 = fresh ? CROPS.seed : cr, room = next - top - 0.16;
      const hh = vine ? Math.min(1.5, room) : Math.min(room, c2.h * 1.6 * (0.85 + 0.3 * (((k + v) * 13) % 5) / 5));
      // a dark mass of leaf down the middle of the tray, so a full tray reads full and the far face does not show through
      if (c2.mass) { g.mat('plain', c2.mass, { rough: 0.3 }); const mh = hh * 0.7; g.quad([-hx + 0.1, top, 0], [hx - 0.1, top, 0], [hx - 0.1, top + mh, 0], [-hx + 0.1, top + mh, 0]); g.quad([hx - 0.1, top, 0], [-hx + 0.1, top, 0], [-hx + 0.1, top + mh, 0], [hx - 0.1, top + mh, 0]); }
      g.mat(c2.mat, c2.tint, { sway: 0.15 });
      for (const sz of [-1, 1]) {
        for (const lay of [0, 1, 2]) {
          // each repeat of the texture is one sprig: keep it about as wide as it is tall, and stagger three rows of them
          const h2 = hh * (lay === 1 ? 1.12 : lay === 2 ? 0.8 : 0.95), zf = sz * (D - 0.08 - lay * 0.2), off = lay * 0.37 + k * 0.17 + v * 0.31, reps = L / (h2 * 0.85);
          if (sz > 0) g.quad([-hx + 0.08, top - 0.02, zf], [hx - 0.08, top - 0.02, zf], [hx - 0.08, top + h2, zf], [-hx + 0.08, top + h2, zf], { uv: [off, 0.0, off + reps, 0.98] });
          else g.quad([hx - 0.08, top - 0.02, zf], [-hx + 0.08, top - 0.02, zf], [-hx + 0.08, top + h2, zf], [hx - 0.08, top + h2, zf], { uv: [off, 0.0, off + reps, 0.98] });
        }
      }
      if (vine) {
        // cucumbers hanging in the vines
        g.mat('glaze', '#4f7a30', { rough: 0.1 });
        for (const sz of [-1, 1]) for (let i = 0; i < 4; i++) { const x = -hx + 0.9 + i * 2 + ((k + i) % 3) * 0.2, yy = top + 0.35 + ((i * 3 + k) % 4) * 0.22; g.cyl(x, yy, sz * (D - 0.04), 0.024, 0.26, { segs: 4, r1: 0.02 }); }
      }
    }
    // the lamp bar under the next tray (or the cap), one a face, near the aisle: its underside glows, its edge shows
    if (lm[1]) g.mat('diffuser', lm[0], { emissive: lm[1] }); else g.mat('plain', lm[0], { rough: -0.2 });
    for (const sz of [-1, 1]) g.box(-hx + 0.12, next - 0.06, sz * (D - 0.3) - 0.07, hx - 0.12, next - 0.02, sz * (D - 0.3) + 0.07, { faces: 'y' + (sz > 0 ? 'Z' : 'z') });
  }
  // the irrigation feed up the middle upright: a blue riser and a red-banded drain
  g.mat('cast', C.water); g.tube([[0.12, 0, 0], [0.12, RACK_TOP, 0]], 0.04, { segs: 6, caps: false });
  return { solid: [[-hx, 0, -D, hx, RACK_TOP, D]], tier: 's', cast: false, surf: 'metal' };
});

// The end of a rack row: a full-height panel with the row's letter and the deck lines numbered. Drawn facing +z;
// placed with yaw so it faces along the row's end. p: {}
defineProp('keelgarden.rackend', (g) => {
  const D = RACK_D + 0.06;
  g.mat('panel', '#2f5d5a', { rough: 0.05 }); g.box(-D, 0, -0.06, D, RACK_TOP + 0.14, 0.06, { faces: 'xXzZY' });
  g.mat('brushed', C.frame); for (const sx of [-1, 1]) g.box(sx * D - 0.06, 0, -0.1, sx * D + 0.06, RACK_TOP + 0.2, 0.1, { bevel: 0.01 });
  g.mat('paint', C.deck); for (const y of [3.95, 7.95, 11.95, 15.95]) g.box(-D, y - 0.07, 0.06, D, y + 0.07, 0.075, { faces: 'ZyY' });
  g.mat('cast', '#3a3430'); g.box(-D, 0, 0.06, D, 0.25, 0.09, { faces: 'ZY' });
  return { solid: [[-D, 0, -0.1, D, RACK_TOP, 0.1]], tier: 's', cast: false, surf: 'metal' };
});

// A mast lift: a yellow chassis on a floor rail, a mast, a platform at height h with its rails, a crate and a work lamp.
// Its long side runs along x. p: { h, lamp: true for a white work lamp }
defineProp('keelgarden.lift', (g, p) => {
  const h = p.h || 4, L = 1.7, W = 0.86;
  g.mat('paint', '#d6a640', { rough: -0.1 }); g.box(-L / 2, 0.08, -W / 2, L / 2, 0.42, W / 2, { bevel: 0.03 });
  g.mat('cast', '#2c3133'); for (const sx of [-0.6, 0.6]) for (const sz of [-0.32, 0.32]) { g.push(); g.move(sx, 0.08, sz); g.rotX(PI / 2); g.cyl(0, -0.03, 0, 0.08, 0.06, { segs: 8 }); g.pop(); }
  // mast: two square tubes and rungs
  g.mat('brushed', '#9c968a'); for (const sz of [-0.14, 0.14]) g.box(-0.62 - 0.05, 0.42, sz - 0.05, -0.62 + 0.05, h + 2.4, sz + 0.05, { faces: 'xXzZ' });
  g.mat('cast', '#5a5046'); for (let y = 1; y < h + 2.2; y += 0.8) g.box(-0.67, y, -0.14, -0.57, y + 0.04, 0.14, { faces: 'xXyY' });
  g.mat('paint', '#d6a640'); g.box(-0.7, h + 2.38, -0.2, -0.54, h + 2.52, 0.2, { bevel: 0.02 });
  // platform
  g.mat('grille', '#7a7a70'); g.box(-L / 2 + 0.05, h - 0.06, -W / 2, L / 2, h, W / 2, { faces: 'yY' });
  g.mat('paint', '#d6a640'); g.box(-L / 2 + 0.05, h - 0.14, -W / 2, L / 2, h - 0.06, W / 2, { faces: 'xXzZy' });
  g.box(-L / 2 + 0.05, h, -W / 2, L / 2, h + 0.12, -W / 2 + 0.02, { faces: 'zZY' }); g.box(-L / 2 + 0.05, h, W / 2 - 0.02, L / 2, h + 0.12, W / 2, { faces: 'zZY' });
  // rails
  g.mat('cast', '#d6a640');
  for (const sz of [-1, 1]) { const z = sz * (W / 2 - 0.02); g.tube([[-L / 2 + 0.08, h, z], [-L / 2 + 0.08, h + 1.05, z], [L / 2 - 0.03, h + 1.05, z], [L / 2 - 0.03, h, z]], 0.022, { segs: 5 }); g.tube([[-L / 2 + 0.08, h + 0.55, z], [L / 2 - 0.03, h + 0.55, z]], 0.016, { segs: 4, caps: false }); }
  g.tube([[L / 2 - 0.03, h + 1.05, -W / 2 + 0.02], [L / 2 - 0.03, h + 1.05, W / 2 - 0.02]], 0.022, { segs: 5, caps: false });
  // a picking crate on the platform and a control box on the rail
  g.mat('wood', C.crate, { rough: 0.1 }); g.box(0.15, h, -0.28, 0.75, h + 0.28, 0.28, { bevel: 0.01 });
  g.mat('leafA', '#9fd06a'); g.quad([0.18, h + 0.24, 0.0], [0.72, h + 0.24, 0.0], [0.72, h + 0.42, 0.0], [0.18, h + 0.42, 0.0], { uv: [0, 0.1, 2.5, 0.9] });
  g.mat('cast', '#2c3133'); g.box(-0.4, h + 0.82, W / 2 - 0.06, -0.15, h + 1.02, W / 2 + 0.04, { bevel: 0.01 });
  g.mat('diffuser', '#7fe08a', { emissive: 2 }); g.box(-0.35, h + 0.96, W / 2 + 0.04, -0.3, h + 1.0, W / 2 + 0.045, { faces: 'Z' });
  if (p.lamp) { g.mat('cast', '#2c3133'); g.box(-0.66, h + 2.1, -0.1, -0.5, h + 2.24, 0.1); g.mat('diffuser', '#f4f0ff', { emissive: 2.2 }); g.box(-0.62, h + 2.08, -0.06, -0.52, h + 2.1, 0.06, { faces: 'y' }); }
  return { solid: [[-L / 2, 0, -W / 2, L / 2, 0.42, W / 2]], posts: [[-0.62, 0, 0.18, 0, h + 2.4]], tier: 's', cast: false };
});

// A produce crate. p: { w, d, h, fill (leaf tint) | null, leaf ('leafA' | 'leafB'), lid: true for a closed crate, wood }
defineProp('keelgarden.crate', (g, p) => {
  const w = p.w || 0.6, d = p.d || 0.4, h = p.h || 0.3;
  g.mat('wood', p.wood || C.crate, { rough: 0.12 });
  const n = 3;
  for (let i = 0; i < n; i++) { const y0 = i * h / n + 0.006, y1 = (i + 1) * h / n - 0.006; g.box(-w / 2, y0, -d / 2, w / 2, y1, -d / 2 + 0.014, { faces: 'zZyY' }); g.box(-w / 2, y0, d / 2 - 0.014, w / 2, y1, d / 2, { faces: 'zZyY' }); g.box(-w / 2, y0, -d / 2, -w / 2 + 0.014, y1, d / 2, { faces: 'xXyY' }); g.box(w / 2 - 0.014, y0, -d / 2, w / 2, y1, d / 2, { faces: 'xXyY' }); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.022) - 0.02, 0, sz * (d / 2 - 0.022) - 0.02, sx * (w / 2 - 0.022) + 0.02, h, sz * (d / 2 - 0.022) + 0.02, { faces: 'xXzZY' });
  g.box(-w / 2 + 0.014, 0.01, -d / 2 + 0.014, w / 2 - 0.014, 0.022, d / 2 - 0.014, { faces: 'Y' });
  if (p.lid) {
    // a cloth cover, tied: produce goes up to the halls covered
    g.mat('weave', p.cloth || '#e6dcc4'); g.box(-w / 2 - 0.01, h - 0.02, -d / 2 - 0.01, w / 2 + 0.01, h + 0.03, d / 2 + 0.01, { bevel: 0.015 });
    g.mat('paint', p.tie || '#7a2a26'); g.box(-0.015, h - 0.06, -d / 2 - 0.016, 0.015, h + 0.035, d / 2 + 0.016, { faces: 'zZY' });
  } else if (p.fill) {
    g.mat(p.leaf || 'leafA', p.fill, { sway: 0.1 });
    for (let i = 0; i < 3; i++) { const z = -d / 2 + 0.08 + i * (d - 0.16) / 2; g.quad([-w / 2 + 0.03, h * 0.45, z], [w / 2 - 0.03, h * 0.45, z], [w / 2 - 0.03, h + 0.12, z], [-w / 2 + 0.03, h + 0.12, z], { uv: [i * 0.37, 0.05, i * 0.37 + w / 0.2, 0.85] }); }
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h + 0.03, d / 2]], tier: 'd', surf: 'wood' };
});

// A stainless packing bench: a top, a shelf, a hanging roll of wrapping paper at one end, a scale. p: { w }
defineProp('keelgarden.bench', (g, p) => {
  const w = p.w || 3.2, d = 0.9, h = 0.92;
  g.mat('brushed', '#d4d2cc', { rough: -0.25 }); g.box(-w / 2, h - 0.04, -d / 2, w / 2, h, d / 2, { bevel: 0.01 });
  g.box(-w / 2 + 0.05, 0.16, -d / 2 + 0.05, w / 2 - 0.05, 0.19, d / 2 - 0.05);
  g.mat('brushed', '#a9a7a0'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.06) - 0.025, 0, sz * (d / 2 - 0.06) - 0.025, sx * (w / 2 - 0.06) + 0.025, h - 0.04, sz * (d / 2 - 0.06) + 0.025);
  // paper roll on its bracket
  g.mat('cast', '#3d4245'); for (const sz of [-0.36, 0.36]) g.box(w / 2 - 0.02, h - 0.3, sz - 0.015, w / 2 + 0.12, h - 0.02, sz + 0.015);
  g.mat('paper', '#efe6d0'); g.push(); g.move(w / 2 + 0.07, h - 0.2, 0); g.rotX(PI / 2); g.cyl(0, -0.34, 0, 0.09, 0.68, { segs: 12 }); g.pop();
  // a scale with a round dial
  g.mat('paint', '#2f5d5a'); g.box(-w / 2 + 0.25, h, -0.2, -w / 2 + 0.75, h + 0.08, 0.2, { bevel: 0.01 });
  g.mat('brushed', '#d4d2cc'); g.box(-w / 2 + 0.22, h + 0.08, -0.23, -w / 2 + 0.78, h + 0.1, 0.23);
  g.mat('paint', '#2f5d5a'); g.box(-w / 2 + 0.44, h + 0.08, -0.32, -w / 2 + 0.56, h + 0.36, -0.24);
  g.mat('paint', C.cream, { emissive: 0.15 }); g.push(); g.move(-w / 2 + 0.5, h + 0.3, -0.235); g.rotX(PI / 2); g.cyl(0, 0, 0, 0.08, 0.012, { segs: 14 }); g.pop();
  return { solid: [[-w / 2, 0, -d / 2, w / 2 + 0.15, h, d / 2]], tier: 'd', surf: 'metal' };
});

// A tomato vine row: a trough on legs, strings up to a wire at 3.4 m, the vine on them, trusses of fruit. p: { len, ripe (0..1) }
defineProp('keelgarden.vine', (g, p) => {
  const L = p.len || 6, hx = L / 2, ripe = p.ripe === undefined ? 0.6 : p.ripe;
  g.mat('panel', '#3a4440'); g.box(-hx, 0.45, -0.22, hx, 0.7, 0.22, { faces: 'xXyYzZ' });
  g.mat('cast', '#3d4245'); for (let x = -hx + 0.2; x <= hx - 0.1; x += 1.5) for (const sz of [-0.18, 0.18]) g.box(x - 0.025, 0, sz - 0.025, x + 0.025, 0.45, sz + 0.025);
  g.mat('soil', '#c0a080'); g.box(-hx + 0.03, 0.7, -0.19, hx - 0.03, 0.71, 0.19, { faces: 'Y' });
  g.mat('cast', '#9c968a'); g.tube(lineX(-hx, hx, 3.4, 0, 2), 0.01, { segs: 4, caps: false });
  g.mat('paper', '#d8d0bc'); for (let x = -hx + 0.25; x < hx; x += 0.5) g.box(x - 0.003, 0.7, -0.003, x + 0.003, 3.4, 0.003, { faces: 'xXzZ' });
  // the vine: two crossed leaf strips climbing the strings
  g.mat('leafA', '#9ac880', { sway: 0.2 });
  for (const sz of [-0.07, 0.07]) {
    g.quad([-hx + 0.05, 0.72, sz], [hx - 0.05, 0.72, sz], [hx - 0.05, 3.3, sz], [-hx + 0.05, 3.3, sz], { uv: [0.3, 0.0, L / 0.42 + 0.3, 3.2] });
    g.quad([hx - 0.05, 0.72, sz], [-hx + 0.05, 0.72, sz], [-hx + 0.05, 3.3, sz], [hx - 0.05, 3.3, sz], { uv: [0, 0.0, L / 0.42, 3.2] });
  }
  // trusses of fruit, from green below to red higher up
  for (let i = 0; i < Math.floor(L / 0.5); i++) {
    const x = -hx + 0.25 + i * 0.5;
    for (let t = 0; t < 2; t++) {
      const y = 1.1 + t * 0.9 + (i % 3) * 0.12, sz = (i + t) % 2 ? 0.16 : -0.16;
      const red = (t + (i % 2) * 0.5) / 2 < ripe;
      for (let k = 0; k < 3; k++) { g.mat('glaze', red ? (k ? '#c8321e' : '#d84a24') : '#7fa040', { rough: -0.35 }); g.ball(x + (k - 1) * 0.06, y - k * 0.05, sz + (k % 2) * 0.03, 0.035, 0.032, 0.035, { segs: 6, rings: 4 }); }
    }
  }
  return { solid: [[-hx, 0, -0.25, hx, 3.4, 0.25]], tier: 's', cast: true };
});

// A tea bush row: a long trough with the bushes clipped flat at the plucking table. p: { len }
defineProp('keelgarden.tea', (g, p) => {
  const L = p.len || 8, hx = L / 2;
  g.mat('wood', '#5b4636'); g.box(-hx, 0, -0.42, hx, 0.34, 0.42, { bevel: 0.02 });
  g.mat('soil', '#b89a78'); g.box(-hx + 0.04, 0.34, -0.38, hx - 0.04, 0.35, 0.38, { faces: 'Y' });
  for (let i = 0; i < Math.round(L / 0.8); i++) {
    const x = -hx + 0.4 + i * 0.8;
    g.mat('bark', '#ffffff'); g.cyl(x, 0.34, 0, 0.04, 0.3, { segs: 6 });
    g.mat('plain', '#24401f', { rough: 0.3 }); g.ball(x, 0.78, 0, 0.42, 0.18, 0.36, { segs: 10, rings: 6 });
    g.mat('leafA', '#4f8a3a', { sway: 0.1 });
    for (let k = 0; k < 4; k++) { const a = k * PI / 4 + i * 0.7; g.card(x + Math.cos(a) * 0.05, 0.62, Math.sin(a) * 0.05, 0.78, 0.36, a + PI / 2, { tilt: 0.2 }); }
    // the flush: pale new leaves on the clipped table
    g.mat('leafB', '#a8d870', { sway: 0.2 }); g.card(x, 0.86, 0, 0.6, 0.16, i * 1.3, { tilt: 0.1 });
  }
  return { solid: [[-hx, 0, -0.45, hx, 0.95, 0.45]], tier: 'd' };
});

// A rack of mushroom logs (pressed from rack stalks, spent mycelium and the Ring's coffee grounds) with oyster mushrooms
// fruiting on them. p: { n (shelves), w }
defineProp('keelgarden.logs', (g, p) => {
  const n = p.n || 4, w = p.w || 2.4, hx = w / 2, sh = 0.62;
  g.mat('wood', '#4a3a2a'); for (const sx of [-1, 1]) for (const sz of [-0.32, 0.32]) g.box(sx * hx - 0.03, 0, sz - 0.03, sx * hx + 0.03, n * sh + 0.15, sz + 0.03);
  for (let k = 0; k < n; k++) {
    const y = 0.15 + k * sh;
    g.mat('wood', '#5b4636'); for (const sz of [-0.3, 0.3]) g.box(-hx, y - 0.04, sz - 0.03, hx, y, sz + 0.03);
    for (let i = 0; i < Math.floor(w / 0.28); i++) {
      const x = -hx + 0.16 + i * 0.28, r = 0.115;
      g.mat('bark', '#c9b49a'); g.push(); g.move(x, y + r, 0); g.rotX(PI / 2); g.cyl(0, -0.36, 0, r, 0.72, { segs: 7 }); g.pop();
      // a cluster of oyster caps on the face
      if ((i + k) % 3 !== 1) {
        g.mat('plain', (i + k) % 4 === 0 ? '#d0c8b8' : '#aca89e', { rough: 0.25 });
        for (let c = 0; c < 2; c++) g.ball(x + (c - 0.5) * 0.05, y + r + 0.04 - c * 0.05, 0.375 + c * 0.01, 0.065 - c * 0.012, 0.016, 0.055, { segs: 6, rings: 3 });
      }
    }
  }
  return { solid: [[-hx, 0, -0.38, hx, n * sh + 0.15, 0.42]], tier: 'd' };
});

// An algae tank: a tall glass column lit from inside, its frame and its bubbler. p: { h, col }
defineProp('keelgarden.tank', (g, p) => {
  const h = p.h || 4.6, R = 0.55;
  g.mat('cast', '#2c3133'); g.lathe(0, 0, [[R + 0.12, 0], [R + 0.12, 0.42], [R + 0.05, 0.48], [0, 0.48]], { segs: 16 });
  g.mat('diffuser', p.col || '#3fd0b0', { emissive: 2.4 }); g.lathe(0, 0, [[R - 0.06, 0.48], [R - 0.06, h - 0.3], [0, h - 0.3]], { segs: 16, capBottom: false });
  g.mat('cast', '#2c3133'); g.lathe(0, 0, [[R + 0.08, h - 0.32], [R + 0.08, h], [0.12, h + 0.08], [0, h + 0.1]], { segs: 16 });
  g.mat('brushed', '#9c968a'); for (const y of [1.6, 2.9]) g.lathe(0, 0, [[R + 0.02, y - 0.03], [R + 0.02, y + 0.03]], { segs: 16, capTop: false, capBottom: false });
  // light inside: bands of brighter water where the lamp strings hang
  g.mat('diffuser', '#c8fff0', { emissive: 4 }); for (const a of [0, 2.1, 4.2]) { g.push(); g.rotY(a); g.box(-0.015, 0.6, R - 0.072, 0.015, h - 0.45, R - 0.062, { faces: 'Z' }); g.pop(); }
  // bubbles rising
  g.mat('diffuser', '#e8fff8', { emissive: 3 }); for (let i = 0; i < 9; i++) g.ball(Math.sin(i * 2.3) * 0.2, 0.7 + i * (h - 1.2) / 9, R - 0.05, 0.022, 0.022, 0.012, { segs: 6, rings: 4 });
  g.mat('cast', C.water); g.tube([[0, h + 0.1, 0], [0, h + 0.6, 0]], 0.05, { segs: 6 });
  return { posts: [[0, 0, R + 0.12, 0, h]], tier: 's', cast: false };
});

// The cab berths' doors and call button, drawn facing +z. p: {}
defineProp('keelgarden.berth', (g) => {
  const bw = 1.3;
  g.mat('stone', '#9c8f7c'); g.box(-bw / 2 - 0.18, 0, -0.16, bw / 2 + 0.18, 2.62, 0, { bevel: 0.01 });
  g.mat('cast', C.brass, { rough: -0.1 }); g.box(-bw / 2, 0.02, 0, -0.01, 2.36, 0.04); g.box(0.01, 0.02, 0, bw / 2, 2.36, 0.04);
  g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(-bw / 2 + 0.06, yy, 0.04, bw / 2 - 0.06, yy + 0.03, 0.055);
  g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(-0.2, 2.44, 0, 0.2, 2.52, 0.03);
  g.mat('cast', '#3a3430'); g.box(bw / 2 + 0.25, 1.05, -0.16, bw / 2 + 0.4, 1.3, -0.08, { bevel: 0.01 });
  g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.box(bw / 2 + 0.3, 1.13, -0.08, bw / 2 + 0.35, 1.2, -0.07);
  return { tier: 's' };
});
