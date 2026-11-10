// Five flats round Wick Court, each behind a terrace door: the guest flat lent to you for three nights (deck 19), the
// Hallorans next door (deck 19), Oona's lamp-tested room (deck 17), Marit's great-grandfather's place (deck 18) and the
// Quists', held for seventy years, with a room let (deck 20). Homes in a world where every object is old, light and mended,
// where floor is the dearest thing there is, and where the lamp is the hearth.
import { floor, ceiling, wall, lamp, roomGlow, warm } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { doorFrame } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';
import { SIGNS } from '../content/signs.js';
import { hang, frontWall, ceilingWorks, picRail, books, framed, curtain, shelf, pegs, studies, tableLamp, lightPanel, sitUse, readCard, readLines, find, toast, sfx, onWall } from './flat_parts.js';

export const place = {
  id: 'flats', name: 'The flats round Wick Court', order: 32,
  build(game) {
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const parts = [guestFlat, familyFlat, oonaFlat, maritFlat, eldersFlat];
    for (const fn of parts) { try { fn(game, f); } catch (e) { console.error('[flats] ' + fn.name + ': ' + (e && e.stack ? e.stack : e)); } }
    if (game.params && game.params.debugFlats) {
      const out = {};
      for (const id of ['flat-guest', 'flat-family', 'flat-oona', 'flat-marit', 'flat-elders']) {
        const sc = game.world.scopes && game.world.scopes.get ? game.world.scopes.get(id) : null; if (!sc) continue;
        let t = 0; for (const m of sc.meshes) t += (m.geometry.index ? m.geometry.index.count : 0) / 3;
        out[id] = { tris: Math.round(t), lights: sc.lights.length, ambients: sc.ambients.length };
      }
      console.log('[flats] ' + JSON.stringify(out));
    }
  },
};

// The hand-drawn things every flat has: a lidded cup or bowl or plate on a surface.
function cups(s, pts, lv) { for (const p of pts) prop(s, p[3] || 'cup', p[0], p[1], p[2], p[4] || 0, p[5] || {}, { level: lv }); }
// An open book lying on a surface, pages ruled. (x, y, z) its centre on the surface; along: the spine runs along 'x' or 'z'.
function openBook(g, x, y, z, along, cover, o = {}) {
  const w = o.w || 0.17, d = o.d || 0.24, ax = along === 'z';
  const B = (u0, y0, v0, u1, y1, v1, opt) => ax ? g.box(x + v0, y + y0, z + u0, x + v1, y + y1, z + u1, opt) : g.box(x + u0, y + y0, z + v0, x + u1, y + y1, z + v1, opt);
  g.mat('leather', cover || '#7a2f2a'); B(-w - 0.01, 0, -d / 2 - 0.008, w + 0.01, 0.006, d / 2 + 0.008);
  g.mat('paper', '#f1e9d6'); B(-w, 0.006, -d / 2, -0.004, 0.02, d / 2, { bevel: 0.004 }); B(0.004, 0.006, -d / 2, w, 0.022, d / 2, { bevel: 0.004 });
  g.mat('plain', o.ink || '#5a5048');
  for (let i = 0; i < (o.lines || 7); i++) { const v = -d / 2 + 0.03 + i * (d - 0.06) / ((o.lines || 7) - 1); B(-w + 0.02, 0.0205, v - 0.0015, -0.03, 0.0215, v + 0.0015, { faces: 'Y' }); if (i < (o.lines || 7) - 2) B(0.03, 0.0225, v - 0.0015, w - 0.02 - (i % 3) * 0.03, 0.0235, v + 0.0015, { faces: 'Y' }); }
  if (o.pencil) { g.mat('paint', '#d9a441'); g.tube(ax ? [[x + 0.05, y + 0.03, z + 0.06], [x + 0.1, y + 0.03, z + 0.2]] : [[x + 0.06, y + 0.03, z + 0.05], [x + 0.2, y + 0.03, z + 0.1]], 0.004, { segs: 5 }); }
}
// Pinned paper (children's paintings, notes, cards): framed() with a paper edge and no frame.
function pinned(g, face, c, u, v, w, h, rects, ground) { framed(g, face, c, u, v, w, h, rects, { fw: 0.003, frame: ground || '#f1e9d6', frameMat: 'paper', ground: ground || '#f1e9d6', depth: 0.004, mount: 0.012 }); }

// ===================================================================================================================
// The guest flat: deck 19, x[4, 15] z[23.2, 33]. Small and bare and kind: a made bed in an alcove, a table by the window,
// a kettle, two cups, a tin of the Nine, hooks, a herb shelf, a guest book, and the window onto the court's light.
// ===================================================================================================================
function guestFlat(game, f) {
  const s = game.world.scope('flat-guest', f), g = s.g;
  const Y = 12, LV = 3, H = 3;
  const X0 = 6.2, X1 = 14.9, Z0 = 23.2, Z1 = 28.9, ZI = 23.36, XW = 6.36, XE = 14.74, ZB = 28.74;
  const AX0 = 11.6, AZ1 = 31.2, AH = 2.35, AZI = 31.04;
  const P = { plaster: '#e8d6b4', dado: '#3f6f6a', floor: '#a87a50', wood: '#5a3d28', rust: '#b8432e', ochre: '#d9a441', alcove: '#e6c08e' };
  const CLIP = [X0 - 0.05, Y - 0.2, Z0 - 0.05, X1 + 0.05, Y + H + 0.1, Z1 + 0.05];
  const CLIPA = [AX0 - 0.05, Y - 0.2, Z1 - 0.5, X1 + 0.05, Y + AH + 0.1, AZ1 + 0.05];
  const dado = { h: 0.95, mat: 'paint', tint: P.dado };
  const ME = { who: 'you' };
  const WX = 8.3, WZ = 27.0;          // the wash corner: x[XW, WX] z[WZ, ZB], a stub wall along z = WZ and a curtain along x = WX

  // ---- the shell
  floor(s, X0, Z0, X1, Z1, Y, 'planks', P.floor, { level: LV });
  floor(s, AX0, Z1, X1, AZ1, Y, 'planks', P.floor, { level: LV });
  ceiling(s, X0, Z0, X1, Z1, Y + H, 'paint', '#efe2c8', { level: LV });
  ceiling(s, AX0, Z1, X1, AZ1, Y + AH, 'paint', '#efd8b4', { level: LV });
  frontWall(s, { side: 'S', c: Z0, a0: X0, a1: X1, y: Y, h: H, door: 9, win: 11.3, tint: P.plaster, dado, lv: LV, doorTint: '#3f7f7a', label: 'your door', sill: ['wood', '#9a6a42'] });
  wall(s, X0 + 0.08, Z0, X0 + 0.08, Z1, Y, H, { tint: P.plaster, dado, level: LV });
  wall(s, X1 - 0.08, Z0, X1 - 0.08, AZ1, Y, H, { tint: P.plaster, dado, level: LV });
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, Y, H, { tintA: P.alcove, tintB: P.plaster, dado, level: LV, openings: [{ at: AX0 + 0.16 - X0, w: XE - AX0 - 0.16, h: AH }] });
  wall(s, AX0 + 0.08, Z1, AX0 + 0.08, AZ1, Y, AH, { tintA: P.alcove, tintB: P.plaster, level: LV });
  wall(s, AX0, AZ1 - 0.08, X1, AZ1 - 0.08, Y, AH, { tint: P.alcove, level: LV });
  wall(s, XW, WZ, WX, WZ, Y, H, { t: 0.1, tint: P.plaster, dado, level: LV });
  picRail(s, X0, Z0, X1, Z1, Y + 2.42, { band: P.rust, level: LV });
  ceilingWorks(s, XW, ZI, XE, ZB, Y + H, { along: 'x', step: 1.5, felt: '#6f6a58', pipeAt: 'x0', lv: LV });
  g.mat('wood', P.wood); g.box(AX0 + 0.12, Y + AH - 0.12, Z1 - 0.2, XE + 0.02, Y + AH + 0.02, Z1 - 0.14, { bevel: 0.01 }); g.box(AX0 + 0.12, Y, Z1 - 0.2, AX0 + 0.22, Y + AH, Z1 - 0.14, { bevel: 0.01 }); g.box(XE - 0.08, Y, Z1 - 0.2, XE + 0.02, Y + AH, Z1 - 0.14, { bevel: 0.01 });
  s.flush({ tier: 's', level: LV });

  // ---- by the door: a mat, the pegs, the welcome card, a map of the block pinned up by somebody kind
  g.mat('rush', '#b89a6a'); g.box(8.55, Y, ZI + 0.15, 9.45, Y + 0.012, ZI + 0.75, { faces: 'YxXzZ' });
  pegs(g, 'Z', ZI, 6.6, 8.1, Y + 1.72, 4, { wood: P.wood });
  g.mat('weave', '#efe6d2'); g.sheet([6.67, Y + 1.74, ZI + 0.1], [6.93, Y + 1.74, ZI + 0.1], [6.93, Y + 1.18, ZI + 0.08], [6.67, Y + 1.18, ZI + 0.08], { nu: 3, nv: 3, ripple: 0.015 });
  g.mat('weave', P.rust); g.box(6.67, Y + 1.3, ZI + 0.105, 6.93, Y + 1.33, ZI + 0.11);
  g.mat('cast', '#8a6d3b'); g.tube([[7.16, Y + 1.78, ZI + 0.1], [7.16, Y + 1.62, ZI + 0.1]], 0.004, { segs: 4 }); g.lathe(7.16, ZI + 0.1, [[0.03, Y + 1.47], [0.035, Y + 1.5], [0.035, Y + 1.6], [0.02, Y + 1.63]], { segs: 10 });
  g.mat('diffuser', '#ffe2b0', { emissive: 0.6 }); g.cyl(7.16, Y + 1.5, ZI + 0.1, 0.028, 0.1, { segs: 10 });
  g.mat('motif', '#33406e'); g.sheet([7.42, Y + 1.74, ZI + 0.11], [7.68, Y + 1.74, ZI + 0.11], [7.72, Y + 1.25, ZI + 0.14], [7.38, Y + 1.25, ZI + 0.14], { nu: 3, nv: 3, ripple: 0.02 });
  g.mat('weave', '#e9c46a'); g.box(7.49, Y + 1.42, ZI + 0.15, 7.59, Y + 1.44, ZI + 0.155);
  s.flush({ tier: 'd', level: LV });
  sign(s, SIGNS['flat-guest.welcome'], 10.13, Y + 1.45, ZI + 0.004, { face: 'Z', w: 0.3, h: 0.42, level: LV });
  pinned(g, 'z', ZB, 9.05, Y + 1.6, 0.46, 0.34, [[0.05, 0.45, 0.95, 0.55, '#c9b28a'], [0.45, 0.05, 0.55, 0.95, '#c9b28a'], [0.1, 0.62, 0.4, 0.92, '#9ab86a'], [0.6, 0.1, 0.9, 0.38, '#d9a441'], [0.6, 0.62, 0.9, 0.92, '#c96a5a'], [0.1, 0.1, 0.4, 0.38, '#7aa0b8'], [0.66, 0.7, 0.72, 0.78, P.rust]]);
  s.flush({ tier: 'd', level: LV });

  // ---- the kitchen corner: a cupboard with the hot tap and the kettle, a shelf with two cups, the Nine, a jar left behind
  prop(s, 'flats.cupboard', XW + 0.3, Y, 24.75, Math.PI / 2, { w: 1.3, body: '#4f7f78', top: '#8a6240', sink: 0.3 }, { level: LV });
  g.mat('tile', '#efe2c4'); g.box(XW, Y + 0.9, 24.1, XW + 0.012, Y + 1.42, 25.4, { faces: 'X' }); s.flush({ tier: 's', level: LV });
  prop(s, 'flats.kettle', XW + 0.32, Y + 0.9, 25.12, -0.4, { metal: '#c9c4bb' }, { level: LV });
  shelf(g, 'X', XW, 24.1, 25.55, Y + 1.62, 0.22, { wood: '#7a5233' }); s.flush({ tier: 'd', level: LV });
  cups(s, [[XW + 0.12, Y + 1.62, 24.3, 'cup', 0, { glaze: P.rust, lid: '#e9e2d0' }], [XW + 0.12, Y + 1.62, 24.48, 'cup', 0, { glaze: '#2f6f8f', lid: '#d9c7a6' }]], LV);
  prop(s, 'flats.tin', XW + 0.11, Y + 1.62, 24.78, 0.3, { col: '#3d5a3a', band: '#e9e2d0' }, { level: LV });
  prop(s, 'flats.jar', XW + 0.11, Y + 1.62, 25.08, Math.PI / 2, { fill: '#8a2a1a', lid: '#c8a45a', label: '#efe6d2', r: 0.045, h: 0.12 }, { level: LV });
  prop(s, 'flats.jar', XW + 0.11, Y + 1.62, 25.32, Math.PI / 2, { fill: '#d9c08a', lid: '#7a5233', lidMat: 'wood', r: 0.05, h: 0.16 }, { level: LV });
  lamp(s, 'sconce', XW + 0.02, Y + 2.08, 25.95, { face: 'X', K: 2700, power: 0.45, clip: CLIP, level: LV });

  // ---- the wash corner, behind a curtain; a woven hanging on its wall
  g.mat('cast', '#8a6d3b'); g.tube([[6.75, Y + 2.08, WZ - 0.07], [7.95, Y + 2.08, WZ - 0.07]], 0.009, { segs: 5 });
  { const cols = ['#b8432e', '#e9c46a', '#3f6f6a', '#efe6d2', '#8a2f3c', '#d9a441', '#33406e'];
    for (let i = 0; i < 7; i++) { g.mat(i % 2 ? 'stripe' : 'weave', cols[i]); g.box(6.8, Y + 2.05 - (i + 1) * 0.14, WZ - 0.075, 7.9, Y + 2.05 - i * 0.14, WZ - 0.06, { faces: 'zxXyY' }); }
    g.mat('weave', '#e9c46a'); for (let i = 0; i < 9; i++) g.box(6.82 + i * 0.13, Y + 1.0, WZ - 0.07, 6.84 + i * 0.13, Y + 1.07, WZ - 0.065); }
  s.flush({ tier: 'd', level: LV });
  prop(s, 'flats.washstand', XW + 0.33, Y, 27.9, Math.PI / 2, { wood: '#6f5137', towel: '#2f6f8f' }, { level: LV });
  framed(g, 'X', XW, 27.9, Y + 1.62, 0.42, 0.56, [[0, 0, 1, 1, '#aebcbc', 'plain', -0.6]], { frame: '#8a6d3b', frameMat: 'cast', mount: 0 });
  g.mat('cast', '#8a6d3b'); g.tube([[WX, Y + 2.24, WZ + 0.05], [WX, Y + 2.24, ZB]], 0.011, { segs: 6 });
  curtain(g, WX, 27.6, WX, ZB - 0.02, Y + 2.2, Y + 0.06, { col: P.ochre, mat: 'stripe', folds: 10, nu: 12, rail: false });
  s.flush({ tier: 'd', level: LV });
  lamp(s, 'sconce', XW + 0.02, Y + 2.0, 27.3, { face: 'X', K: 2900, power: 0.3, clip: CLIP, level: LV });

  // ---- the table under the window, two chairs that do not match, the guest book
  prop(s, 'rug', 11.3, Y, 24.9, 0, { w: 2.1, d: 1.5, a: '#3f6f6a', b: P.ochre, mat: 'motif' }, { level: LV });
  prop(s, 'table', 11.3, Y, 24.75, 0, { w: 1.05, d: 0.7, wood: '#5a3d28', top: '#8a6240' }, { level: LV, tier: 's' });
  prop(s, 'chair', 10.5, Y, 24.75, Math.PI / 2, { back: 'hoop', wood: '#4a3020', seat: '#d9c08a' }, { level: LV, spot: Object.assign({ tags: ['flat', 'table'] }, ME) });
  prop(s, 'flats.ladder', 12.1, Y, 24.75, -Math.PI / 2, { wood: '#9a6a42', seat: '#b89a5a', cushion: P.rust }, { level: LV, spot: Object.assign({ tags: ['flat', 'table'] }, ME) });
  openBook(g, 11.15, Y + 0.74, 24.86, 'x', '#7a2f2a', { pencil: true });
  g.mat('glaze', '#e9e2d0'); g.lathe(11.62, 24.95, [[0, Y + 0.74], [0.03, Y + 0.74], [0.035, Y + 0.8], [0.02, Y + 0.86], [0.026, Y + 0.88]], { segs: 10 });
  g.mat('leafB', '#ffffff'); g.card(11.62, Y + 0.86, 24.95, 0.12, 0.14, 0.4); g.card(11.62, Y + 0.86, 24.95, 0.12, 0.14, 1.9);
  s.flush({ tier: 'd', level: LV });
  cups(s, [[11.65, Y + 0.74, 24.6, 'cup', 0, { glaze: '#d9cfb8' }]], LV);
  lamp(s, 'globe', 11.3, Y + 2.15, 24.75, { K: 2600, power: 0.75, clip: CLIP, drop: 0.8, r: 0.15, level: LV });

  // ---- the window: curtains drawn back, a plant and a cup on the deep sill
  g.mat('cast', '#8a6d3b'); g.tube([[10.3, Y + 2.4, ZI + 0.07], [12.3, Y + 2.4, ZI + 0.07]], 0.011, { segs: 6 });
  curtain(g, 10.22, ZI + 0.07, 10.6, ZI + 0.07, Y + 2.37, Y + 0.86, { col: P.ochre, mat: 'weave', folds: 5, nu: 6, rail: false });
  curtain(g, 12.0, ZI + 0.07, 12.38, ZI + 0.07, Y + 2.37, Y + 0.86, { col: P.ochre, mat: 'weave', folds: 5, nu: 6, rail: false });
  s.flush({ tier: 'd', level: LV });
  prop(s, 'plant', 11.72, Y + 0.97, ZI + 0.1, 0.4, { kind: 'fern', size: 0.5, pot: P.rust }, { level: LV });
  cups(s, [[10.95, Y + 0.97, ZI + 0.05, 'cup', 0, { glaze: '#2f6f8f' }]], LV);

  // ---- the herb shelf by the window under its little grow lamp: chives, coriander, thyme, and an empty pot with a note
  shelf(g, 'Z', ZI, 12.5, 14.1, Y + 1.2, 0.24, { lip: true, wood: '#7a5233' });
  shelf(g, 'Z', ZI, 12.5, 14.1, Y + 1.78, 0.2, { wood: '#7a5233' });
  s.flush({ tier: 'd', level: LV });
  lamp(s, 'strip', 12.55, Y + 1.75, ZI + 0.11, { to: [14.05, Y + 1.75, ZI + 0.11], K: 3800, power: 0.25, clip: CLIP, level: LV });
  prop(s, 'plant', 12.75, Y + 1.2, ZI + 0.12, 0, { kind: 'fine', size: 0.36, pot: '#c98a2e', leaf: '#e8ffd8' }, { level: LV });
  prop(s, 'plant', 13.15, Y + 1.2, ZI + 0.12, 1, { kind: 'broad', size: 0.32, pot: '#e8d8bb', seed: 2 }, { level: LV });
  g.mat('glaze', '#a3563a'); g.lathe(13.55, ZI + 0.12, [[0, Y + 1.2], [0.055, Y + 1.2], [0.07, Y + 1.31], [0.075, Y + 1.32], [0.066, Y + 1.32]], { segs: 12, capTop: false });
  g.mat('soil', '#ffffff'); g.cyl(13.55, Y + 1.29, ZI + 0.12, 0.064, 0.01, { segs: 10 });
  g.mat('wood', '#c9b28a'); g.box(13.545, Y + 1.27, ZI + 0.155, 13.555, Y + 1.42, ZI + 0.165);
  s.flush({ tier: 'd', level: LV });
  sign(s, { kind: 'notice', lines: ['leave it greener', 'than you found it'], hand: true, paper: '#f4ecd8' }, 13.55, Y + 1.43, ZI + 0.17, { face: 'Z', w: 0.13, h: 0.085, level: LV, board: false });
  prop(s, 'plant', 13.9, Y + 1.2, ZI + 0.12, 2, { kind: 'fine', size: 0.3, pot: '#2b6b69', seed: 3 }, { level: LV });
  cups(s, [[12.7, Y + 1.78, ZI + 0.1, 'flats.jar', 0, { fill: '#6b5a3a', lid: '#8a6d3b', r: 0.04, h: 0.1 }], [13.0, Y + 1.78, ZI + 0.1, 'flats.jar', 0, { fill: '#c9b28a', lid: '#8a6d3b', r: 0.04, h: 0.12 }]], LV);

  // ---- the wardrobe, a print of the Hollow, a rag rug
  prop(s, 'flats.wardrobe', XE - 0.3, Y, 26.2, -Math.PI / 2, { w: 0.95, d: 0.56, body: '#6f4e33', patch: '#a07a50' }, { level: LV });
  framed(g, 'x', XE, 27.75, Y + 1.62, 0.56, 0.42, [[0, 0, 1, 0.3, '#5f8a4a'], [0, 0.3, 1, 0.42, '#9ab86a'], [0.15, 0.36, 0.3, 0.48, '#4f7a3e'], [0, 0.42, 1, 0.78, '#e8dcb0'], [0, 0.78, 1, 1, '#c9d6a0'], [0.05, 0.5, 0.95, 0.53, '#fff4d0']], { frame: '#2f2a24' });
  s.flush({ tier: 'd', level: LV });
  prop(s, 'rug', 10.4, Y, 27.0, 0.08, { w: 1.9, d: 1.1, a: '#8a2f3c', b: '#e9c46a', mat: 'knit' }, { level: LV });

  // ---- the luggage rack where your pack goes, a low shelf with a lamp beside it
  prop(s, 'bench', 10.15, Y, ZB - 0.3, Math.PI, { w: 1.1, wood: '#7a5233' }, { level: LV, spot: Object.assign({ tags: ['flat'] }, ME) });
  prop(s, 'shelving', 8.95, Y, ZB - 0.17, Math.PI, { w: 0.9, h: 0.95, shelves: 2, wood: '#6f5137' }, { level: LV });
  books(g, 'z', ZB - 0.02, 8.55, 9.2, Y + 0.105, 'guestlow', { tall: 0.26 }); books(g, 'z', ZB - 0.02, 8.6, 9.0, Y + 0.525, 'guestlow2', { tall: 0.22 });
  s.flush({ tier: 'd', level: LV });
  tableLamp(s, 9.2, Y + 0.97, ZB - 0.17, { h: 0.4, base: '#c98a2e', shade: '#efd9b0', K: 2600, power: 0.35, clip: CLIP, level: LV });

  // ---- the alcove: the bed made with a quilt of many mends, a shelf of left books, a lamp and the small light panel
  prop(s, 'flats.bed', 13.66, Y, AZI - 0.58, -Math.PI / 2, { w: 1.05, l: 2.0, frame: '#6f4e33', cover: '#3f6f6a', coverMat: 'knit', board: 'rail', quilt: [P.rust, '#2f6f8f', '#e9c46a', '#6b8f4e', '#efe6d2', '#8a2f3c', P.ochre], mend: '#f2d27a' }, { level: LV, spot: Object.assign({ tags: ['flat', 'sleep'] }, ME) });
  shelf(g, 'z', AZI, 12.85, 14.55, Y + 1.42, 0.2, { wood: '#7a5233' });
  books(g, 'z', AZI, 12.9, 13.75, Y + 1.42, 'guestbooks', { tall: 0.24 });
  s.flush({ tier: 'd', level: LV });
  prop(s, 'plant', 14.25, Y + 1.42, AZI - 0.1, 0.5, { kind: 'fine', size: 0.32, pot: '#e8d8bb', seed: 5 }, { level: LV });
  cups(s, [[13.95, Y + 1.42, AZI - 0.1, 'cup', 0, { glaze: '#e9c46a' }]], LV);
  g.mat('cast', '#8a6d3b'); g.tube([[11.8, Y + 2.24, Z1 + 0.06], [14.72, Y + 2.24, Z1 + 0.06]], 0.011, { segs: 6 });
  curtain(g, 11.8, Z1 + 0.06, 12.25, Z1 + 0.06, Y + 2.22, Y + 0.05, { col: P.rust, mat: 'stripe', folds: 6, nu: 7, rail: false });
  curtain(g, 14.3, Z1 + 0.06, 14.72, Z1 + 0.06, Y + 2.22, Y + 0.05, { col: P.rust, mat: 'stripe', folds: 6, nu: 7, rail: false });
  s.flush({ tier: 'd', level: LV });
  lamp(s, 'sconce', XE - 0.02, Y + 1.38, AZI - 0.62, { face: 'x', K: 2500, power: 0.5, clip: CLIPA, level: LV });
  const panel = lightPanel(s, game, 12.15, Y, AZI - 0.32, Math.PI / 2 + 0.35, { w: 0.4, h: 0.52, y0: 0.62, clip: CLIPA, level: LV, power: 4 });

  // ---- light: the court through the window by day, its lanterns by night, the room's bounce
  roomGlow(s, X0, Y, Z0, X1, Y + H, Z1, { sky: '#ffd8a8', ground: '#b88a5a', power: 0.13 });
  roomGlow(s, AX0, Y, Z1, X1, Y + AH, AZ1, { sky: '#ffcf9a', ground: '#a87a50', power: 0.14 });
  s.light({ at: [10.75, Y + 1.6, ZI + 0.3], to: [11.85, Y + 1.6, ZI + 0.3], type: 'tube', color: warm(5200), power: 1.7, range: 6, clip: CLIP, sun: true, radius: 0.5, shadow: true });
  s.light({ at: [11.3, Y + 1.7, ZI + 0.25], color: warm(2300), power: 0.6, range: 4, clip: CLIP, night: true, radius: 0.4 });

  // ---- people (only you: these spots are reserved), walkways, the zone
  s.spot('work', XW + 0.85, Y, 24.75, -Math.PI / 2, Object.assign({ tags: ['flat', 'cook', 'tea'] }, ME));
  s.spot('stand', 11.3, Y, ZI + 0.7, Math.PI, Object.assign({ tags: ['flat', 'look', 'window'] }, ME));
  s.spot('stand', 13.3, Y, ZI + 0.75, Math.PI, Object.assign({ tags: ['flat', 'garden', 'herbs'] }, ME));
  s.path([[9, Y, 22.75], [9, Y, 24.2], [9.8, Y, 26.4], [12.2, Y, 28.0], [12.6, Y, 29.4]], { width: 1.0 });
  s.path([[9.8, Y, 26.4], [7.4, Y, 25.4]], { width: 0.9 });
  s.zoneBox({ id: 'flat-guest', place: 'flat-guest', box: [X0, Y - 0.3, Z0, X1, Y + H, AZ1], name: 'Your flat', sub: 'Candlewick · deck 19 · terrace flat 4', ambience: 'flat', reverb: 'room', env: { exposure: 1.0, warmth: 0.35 }, headroom: 2.85 });

  // ---- things to do
  s.interact({ x: 10.13, y: Y + 1.45, z: ZI + 0.1, radius: 0.9, prompt: 'Read the card by the door', onUse: async (gm) => {
    await readLines(gm, 'A card by the door', ['Welcome. The hand lamp is by the door. The herb shelf is yours.', 'Lamps ramp at half past six and fade at eleven.', 'Where have you slept? Have you eaten?']);
    find(gm, 'margin-flat');
  } });
  s.interact({ x: 7.16, y: Y + 1.55, z: ZI + 0.12, radius: 0.85, prompt: 'Take the hand lamp', enabled: (gm) => !(gm.inv && gm.inv.has('hand-lamp')), onUse: (gm) => { if (gm.inv) gm.inv.give('hand-lamp'); sfx(gm, 'lamp-click', f, 7.16, Y + 1.55, ZI + 0.1); } });
  s.interact({ x: XW + 0.3, y: Y + 1.0, z: 25.1, radius: 0.85, prompt: 'Make a cup of tea', onUse: (gm) => {
    sfx(gm, 'pour', f, XW + 0.3, Y + 1.0, 25.1);
    toast(gm, 'The hot tap runs at 65 degrees off the food plant\'s loop, so the kettle boils in a minute. You put the lid on the cup out of habit now.', 'info', 7);
  } });
  s.interact({ x: XW + 0.12, y: Y + 1.72, z: 25.08, radius: 0.75, prompt: 'Look at the jar on the shelf', onUse: (gm) => readCard(gm, 'Left by the last guest', 'A jar of chili crisp', 'A paper tag on the lid: Chili crisp from Dulse, for whoever is next. The lid sticks. Put a spoon of it on the Nine and you will forgive it.', 8) });
  sitUse(s, 10.5, Y, 24.75, Math.PI / 2, 'Sit at the table');
  sitUse(s, 12.1, Y, 24.75, -Math.PI / 2, 'Sit at the table');
  s.interact({ x: 11.15, y: Y + 0.8, z: 24.86, radius: 0.8, prompt: 'Read the guest book', onUse: async (gm) => {
    const L = ['Tamas Rensch, Sloe. Three nights. It is very loud here and I slept better than at home.',
      'Ilse and Bo Marrack, Tansy. Two nights, one baby, and the neighbours brought soup both evenings.',
      'Wenna Pike, Squall. Left the basil greener than I found it. Please check.',
      'Juniper Osk, Kittiwake. Flew the Spindle crosswise. Do not fly the Spindle crosswise.',
      'Anzu Brell, Dulse. Sat at that window most of a day and nobody minded. Left you the chili crisp.',
      'Selma Dray, Spelt. Pell says hello to whoever reads this. He says that to every book.'];
    if (gm.flags && gm.flags.guestbook_signed) L.push('A wanderer, Spelt. ' + gm.flags.guestbook_signed);
    await readLines(gm, 'The guest book', L);
    if (gm.flags && !gm.flags.guestbook_signed && gm.ui && gm.ui.choose) {
      const v = await gm.ui.choose('The guest book', 'The next line is empty.', [{ label: 'Sign it', value: 'y' }, { label: 'Leave it for the last night', value: null }]);
      if (v === 'y') { gm.flags.guestbook_signed = 'Night ' + Math.max(1, Math.min(3, gm.clock.day)) + '. Nobody has asked me anything twice.'; sfx(gm, 'paper', f, 11.15, Y + 0.8, 24.86); toast(gm, 'You write your name, and Spelt, and the night.'); }
    }
  } });
  s.interact({ x: 11.3, y: Y + 1.6, z: ZI - 0.1, radius: 1.2, wide: true, prompt: 'Look out of the window', onUse: (gm) => {
    if (find(gm, 'flat-draw')) return;
    readCard(gm, 'Your window', 'Wick Court', 'The walkway, a box of herbs on the rail, and beyond them six decks of court under a ceiling lit like an overcast day. Somebody below is tuning a flute. It is a terrace flat, the kind with a window, and it came out of a draw.', 9);
  } });
  s.interact({ x: 13.3, y: Y + 1.4, z: ZI + 0.15, radius: 0.85, prompt: 'Look at the herb shelf', onUse: (gm) => {
    if (!find(gm, 'herb-shelf')) readCard(gm, 'Your herb shelf', 'Leave it greener', 'Chives, a straggle of coriander, a pot of thyme, and an empty pot with a note in the soil. The grow lamp takes a watt or two.', 7);
  } });
  s.interact({ x: 10.15, y: Y + 0.55, z: ZB - 0.32, radius: 1.0, prompt: (gm) => gm.flags && gm.flags.has_flat ? 'Your pack is on the rack' : 'Leave your pack', onUse: (gm) => {
    if (gm.flags && gm.flags.has_flat) { toast(gm, 'Your pack, a little lighter than it was in Spelt. The crock is wrapped in your other shirt.'); return; }
    gm.flags = gm.flags || {}; gm.flags.has_flat = true;
    if (gm.journal && gm.journal.step) gm.journal.step('three-nights', 2);
    sfx(gm, 'clunk', f, 10.15, Y + 0.5, ZB - 0.3);
    toast(gm, 'You set your pack down on the rack. For three nights, this is where you live.', 'thread', 6);
  } });
  s.interact({ x: 13.4, y: Y + 0.65, z: AZI - 0.58, radius: 1.3, prompt: 'Sleep', onUse: async (gm) => {
    if (gm.story && gm.story.onSleep) return gm.story.onSleep(gm);
    if (gm.ui && gm.ui.choose) { const v = await gm.ui.choose('Your bed', 'Sleep until the lamps come up?', [{ label: 'Sleep', value: 'y' }, { label: 'Not yet', value: null }]); if (v !== 'y') return; }
    gm.busy = (gm.busy || 0) + 1;
    try {
      if (gm.player && gm.player.seat) gm.player.stand();
      if (gm.ui) await gm.ui.fade(true, 1);
      gm.clock.skipTo(6.5);
      if (gm.ui) await gm.ui.fade(false, 1.5);
      toast(gm, 'Half past six, ' + gm.clock.dayName() + '. The lamps are coming up.', 'info', 6);
      gm.flags = gm.flags || {}; gm.flags.slept = gm.clock.day;
    } finally { gm.busy--; }
  } });
  s.interact({ x: 12.15, y: Y + 0.9, z: AZI - 0.32, radius: 0.85, prompt: 'Sit at the light panel', onUse: (gm) => {
    panel.boost(gm, 20); gm.flags = gm.flags || {}; gm.flags.panel_used = true;
    toast(gm, 'Twenty minutes at 2,500 lux, about a hundredth of a kay. Every school in the drum insists on it.', 'info', 7);
  } });
  // be awake in your flat when the lamps come up
  s.world.dynamics.push({ scope: s, done: false, update() {
    if (this.done || !game.clock || !game.player) return; const h = game.clock.hours; if (h < 6.5 || h > 7.5) return;
    const p = game.player; if (p.frame !== f) return; const q = p.pos;
    if (q.x > X0 && q.x < X1 && q.z > Z0 && q.z < AZ1 && Math.abs(q.y - Y) < 1.5) { this.done = true; find(game, 'home-lamps'); }
  } });

  s.finish();
  game.spawns['flat-guest'] = { frame: f, x: 9, y: Y, z: 24.3, yaw: Math.PI, pitch: -0.05 };
}

// ===================================================================================================================
// The Hallorans' flat: deck 19, x[-15, -4] z[23.2, 33]. Two parents, two children, an aunt who is always there: a long
// table with homework on it, a larder shelf, a starter crock with its card, a morning light panel with a bench in front,
// bunks with curtains, a growing chart up a door frame, satchels, a spinball under a chair, paintings stuck up.
// ===================================================================================================================
function familyFlat(game, f) {
  const s = game.world.scope('flat-family', f), g = s.g;
  const Y = 12, LV = 3, H = 3;
  const X0 = -14.9, X1 = -4.1, Z0 = 23.2, Z1 = 29.4, ZI = 23.36, XW = -14.74, XE = -4.26, ZB = 29.24, ZK = 32.9, ZKI = 32.74, XP = -9.4;
  const P = { plaster: '#ecd3a0', dado: '#33406e', floor: '#b0804f', wood: '#5a3d28', red: '#c9552e', green: '#6b8f4e', blue: '#2f6f8f', kids: '#cfe0b8', kdado: '#c9552e' };
  const CLIP = [X0 - 0.05, Y - 0.2, Z0 - 0.05, X1 + 0.05, Y + H + 0.1, Z1 + 0.05];
  const CLIPK = [X0 - 0.05, Y - 0.2, Z1 - 0.2, XP + 0.05, Y + H + 0.1, ZK + 0.05];
  const dado = { h: 1.0, mat: 'paint', tint: P.dado };
  const KD = { h: 0.9, mat: 'paint', tint: P.kdado };
  const fam = (who, tags) => ({ who, tags: ['flat', 'home'].concat(tags || []) });

  // ---- the shell
  floor(s, X0, Z0, X1, Z1, Y, 'planks', P.floor, { level: LV });
  floor(s, X0, Z1, X1, ZK, Y, 'planks', shadeHex(P.floor, 0.92), { level: LV });
  ceiling(s, X0, Z0, X1, ZK, Y + H, 'paint', '#f0e2c4', { level: LV });
  frontWall(s, { side: 'S', c: Z0, a0: X0, a1: X1, y: Y, h: H, door: -9, win: -11.3, tint: P.plaster, dado, lv: LV, doorTint: '#c9552e', label: 'the Hallorans\' door', open: true, sill: ['paint', '#efe6d2'] });
  wall(s, X0 + 0.08, Z0, X0 + 0.08, ZK, Y, H, { tint: P.plaster, tintA: P.plaster, dado, level: LV });
  wall(s, X1 - 0.08, Z0, X1 - 0.08, ZK, Y, H, { tint: P.plaster, dado, level: LV });
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, Y, H, { tintA: P.kids, tintB: P.plaster, dado, level: LV, openings: [{ at: -12.9 - X0, w: 0.9, h: 2.1 }, { at: -6.4 - X0, w: 0.9, h: 2.1 }] });
  wall(s, X0, ZK - 0.08, X1, ZK - 0.08, Y, H, { tint: P.kids, dado: KD, level: LV });
  wall(s, XP, Z1, XP, ZK, Y, H, { tintB: P.kids, tintA: '#d8c8b0', dado: KD, level: LV });
  picRail(s, X0, Z0, X1, Z1, Y + 2.38, { band: P.red, level: LV });
  ceilingWorks(s, XW, ZI, XE, ZB, Y + H, { along: 'x', step: 1.55, felt: '#5a4a3a', pipeAt: 'x1', lv: LV });
  // the kids' door frame, painted, with the growing chart up its jamb; the parents' door, shut
  doorFrame(s, -12.45, Y, Z1 - 0.08, 0.9, 2.1, 'x', { depth: 0.24, tint: '#efe6d2', level: LV });
  hang(s, { x: -6.39, y: Y, z: Z1 - 0.08, w: 0.88, h: 2.06, along: 'x', dir: 1, swing: -1, tint: '#d9c7a6', style: 'panel', locked: true, lockedText: 'The Hallorans\' room', level: LV });
  doorFrame(s, -5.95, Y, Z1 - 0.08, 0.9, 2.1, 'x', { depth: 0.24, tint: '#5a3d28', level: LV });
  { const jx0 = -12.0, jx1 = -11.93, zf = Z1 - 0.08 - 0.12 - 0.002;
    g.mat('plain', '#2f6f8f'); for (const h of [0.82, 0.95, 1.06, 1.16, 1.25, 1.31, 1.38]) { g.box(jx0, Y + h - 0.003, zf - 0.001, jx1 + 0.05, Y + h + 0.003, zf + 0.001); g.box(jx1 + 0.06, Y + h - 0.012, zf - 0.001, jx1 + 0.1, Y + h + 0.012, zf + 0.001); }
    g.mat('plain', '#c9552e'); for (const h of [0.78, 0.86, 0.98, 1.08, 1.15, 1.2]) { g.box(jx0 - 0.04, Y + h - 0.003, zf - 0.001, jx1, Y + h + 0.003, zf + 0.001); g.box(jx0 - 0.1, Y + h - 0.012, zf - 0.001, jx0 - 0.06, Y + h + 0.012, zf + 0.001); }
    g.mat('plain', '#3d5a3a'); g.box(jx0 - 0.02, Y + 1.555, zf - 0.001, jx1 + 0.02, Y + 1.561, zf + 0.001);
    s.flush({ tier: 'd', level: LV }); }

  // ---- by the door: pegs with satchels and coats, shoes everywhere
  pegs(g, 'Z', ZI, -8.1, -5.4, Y + 1.45, 6, { wood: P.wood });
  pegs(g, 'Z', ZI, -8.1, -6.6, Y + 1.85, 3, { wood: P.wood });
  g.mat('knit', P.green); g.sheet([-7.95, Y + 1.88, ZI + 0.1], [-7.55, Y + 1.88, ZI + 0.1], [-7.5, Y + 0.95, ZI + 0.16], [-8.0, Y + 0.95, ZI + 0.16], { nu: 3, nv: 4, ripple: 0.03 });
  g.mat('weave', P.red); g.sheet([-7.3, Y + 1.88, ZI + 0.1], [-6.85, Y + 1.88, ZI + 0.1], [-6.8, Y + 0.9, ZI + 0.17], [-7.35, Y + 0.9, ZI + 0.17], { nu: 3, nv: 4, ripple: 0.03 });
  g.mat('weave', '#e9c46a'); g.box(-7.2, Y + 1.2, ZI + 0.17, -7.05, Y + 1.23, ZI + 0.175);
  s.flush({ tier: 'd', level: LV });
  prop(s, 'flats.satchel', -6.05, Y + 1.0, ZI + 0.1, 0, { col: '#7a2f2a' }, { level: LV });
  prop(s, 'flats.satchel', -5.6, Y + 0.98, ZI + 0.1, 0, { col: '#2f5d50' }, { level: LV });
  { const r = new Rng('famshoes'); g.mat('wood', '#7a5233'); g.box(-8.1, Y, ZI + 0.02, -5.4, Y + 0.3, ZI + 0.3, { bevel: 0.01 }); s.flush({ tier: 's', level: LV });
    s.solid(-8.1, Y, ZI, -5.4, Y + 0.3, ZI + 0.3);
    for (let i = 0; i < 11; i++) { const x = -8.0 + i * 0.24 + r.f(-0.03, 0.03), on = i % 3 !== 2, y0 = on ? Y + 0.3 : Y, z = on ? ZI + 0.16 : ZI + 0.45 + r.f(0, 0.2); const sz = r.chance(0.5) ? 0.8 : 1;
      g.mat('leather', r.pick(['#3a2a20', '#7a2f2a', '#2f4f6f', '#c98a2e', '#5b4060', '#2f5d50', '#c9552e']));
      g.box(x - 0.045 * sz, y0, z - 0.12 * sz, x + 0.045 * sz, y0 + 0.08 * sz, z + 0.12 * sz, { bevel: 0.03 }); }
    s.flush({ tier: 'd', level: LV }); }
  g.mat('rush', '#a8925f'); g.box(-9.5, Y, ZI + 0.12, -8.5, Y + 0.012, ZI + 0.75, { faces: 'YxXzZ' }); s.flush({ tier: 'd', level: LV });

  // ---- the long table with homework on it, a bench one side, three chairs that do not match the other, a stool at the end
  prop(s, 'rug', -7.6, Y, 26.6, 0, { w: 3.6, d: 2.4, a: '#8a2f3c', b: '#e9c46a', mat: 'motif' }, { level: LV });
  prop(s, 'table', -7.6, Y, 26.6, 0, { w: 2.4, d: 0.85, wood: '#5a3d28', top: '#9a6a42' }, { level: LV, tier: 's' });
  prop(s, 'bench', -7.6, Y, 25.6, 0, { w: 1.9, wood: '#6f4e33' }, { level: LV, noSpots: true });
  prop(s, 'chair', -8.4, Y, 27.58, Math.PI, { back: 'slat', wood: '#3a2a20', seat: '#c9552e' }, { level: LV, spot: fam('ines', ['table']) });
  prop(s, 'flats.ladder', -7.6, Y, 27.58, Math.PI, { wood: '#2f6f8f', seat: '#d9c08a' }, { level: LV, spot: fam('kwame', ['table']) });
  prop(s, 'chair', -6.8, Y, 27.58, Math.PI, { back: 'hoop', wood: '#8a6240', seat: '#6b8f4e' }, { level: LV, spot: fam('mina', ['table']) });
  prop(s, 'stool', -9.25, Y, 26.6, 0.3, { wood: '#c98a2e', h: 0.5 }, { level: LV, noSpots: true });
  prop(s, 'flats.ball', -7.55, Y, 27.75, 0.4, { col: '#c9552e', band: '#efe6d2' }, { level: LV });
  s.spot('sit', -8.1, Y + 0.46, 25.6, 0, fam('esi', ['table', 'homework', 'write']));
  s.spot('sit', -7.1, Y + 0.46, 25.6, 0, fam('pip', ['table', 'homework', 'write']));
  // homework: exercise books, a slate, pencils, a ruler, Esi's River in crayon, a lidded bowl and cups
  { const r = new Rng('homework'); const yt = Y + 0.74;
    for (let i = 0; i < 6; i++) { const x = -8.6 + i * 0.32 + r.f(-0.05, 0.05), z = 26.4 + r.f(-0.12, 0.12), a = r.f(-0.3, 0.3); g.push(); g.move(x, yt, z); g.rotY(a); g.mat('paper', r.pick(['#2f6f8f', '#c9552e', '#6b8f4e', '#e9c46a', '#5b4060'])); g.box(-0.1, 0, -0.075, 0.1, 0.006 + (i % 2) * 0.008, 0.075); g.mat('paper', '#f1e9d6'); if (i % 2) g.box(-0.095, 0.014, -0.07, 0.095, 0.016, 0.07); g.pop(); }
    g.mat('slate', '#2a2e2c'); g.box(-7.15, yt, 26.75, -6.85, yt + 0.012, 26.95, { bevel: 0.004 }); g.mat('wood', '#b08d5e'); g.box(-7.17, yt, 26.73, -6.83, yt + 0.014, 26.75); g.box(-7.17, yt, 26.95, -6.83, yt + 0.014, 26.97);
    g.mat('paint', '#d9a441'); g.tube([[-8.2, yt + 0.004, 26.75], [-8.05, yt + 0.004, 26.83]], 0.004, { segs: 5 }); g.mat('paint', '#c9552e'); g.tube([[-6.6, yt + 0.004, 26.3], [-6.5, yt + 0.004, 26.46]], 0.004, { segs: 5 });
    g.mat('wood', '#c9b28a'); g.box(-8.9, yt, 26.82, -8.6, yt + 0.004, 26.85);
    // the River, by Esi, in crayon: black paper, brown-violet bands, white dots
    g.mat('paper', '#141018'); g.box(-6.55, yt, 26.55, -6.25, yt + 0.003, 26.76); g.mat('plain', '#6b4a5a'); g.box(-6.55, yt + 0.003, 26.62, -6.25, yt + 0.004, 26.66); g.mat('plain', '#8a5a62'); g.box(-6.55, yt + 0.003, 26.66, -6.25, yt + 0.004, 26.69);
    g.mat('plain', '#f4ecd8'); for (let i = 0; i < 9; i++) { const x = -6.53 + r.f(0, 0.26), z = 26.56 + r.f(0, 0.18); g.box(x, yt + 0.004, z, x + 0.006, yt + 0.005, z + 0.006); }
    s.flush({ tier: 'd', level: LV }); }
  cups(s, [[-7.6, Y + 0.74, 26.8, 'bowl', 0, { glaze: '#e9e1cf', lid: P.blue, r: 0.11 }], [-8.4, Y + 0.74, 26.95, 'cup', 0, { glaze: P.red }], [-6.85, Y + 0.74, 26.4, 'cup', 0, { glaze: '#e9c46a' }], [-7.95, Y + 0.74, 26.25, 'cup', 0, { glaze: P.green }]], LV);
  lamp(s, 'lantern', -8.3, Y + 2.2, 26.6, { tint: '#e9c46a', power: 0.65, drop: 0.5, clip: CLIP, level: LV });
  lamp(s, 'lantern', -6.9, Y + 2.25, 26.6, { tint: '#e08a6a', power: 0.55, drop: 0.45, clip: CLIP, level: LV });

  // ---- the morning light panel on the east wall, the bench in front of it
  prop(s, 'bench', -5.5, Y, 25.0, Math.PI / 2, { w: 1.4, wood: '#2f6f8f' }, { level: LV, noSpots: true });
  const panel = lightPanel(s, game, -4.62, Y, 25.0, -Math.PI / 2, { w: 0.85, h: 0.62, y0: 0.62, clip: CLIP, level: LV, power: 7, range: 5.5 });
  s.spot('sit', -5.5, Y + 0.46, 24.6, Math.PI / 2, fam('esi', ['panel', 'morning']));
  s.spot('sit', -5.5, Y + 0.46, 25.4, Math.PI / 2, fam('pip', ['panel', 'morning']));
  // children's paintings stuck up round it and along the back wall
  { const r = new Rng('kidart');
    const art = () => { const bg = r.pick(['#f4ecd8', '#f1e9d6', '#e8f0e0', '#f6e0d0']); const out = [[0, 0, 1, 1, bg]]; const k = r.i(3, 6);
      for (let i = 0; i < k; i++) { const u = r.f(0, 0.7), v = r.f(0, 0.7), w = r.f(0.12, 0.4), h = r.f(0.08, 0.35); out.push([u, v, Math.min(1, u + w), Math.min(1, v + h), r.pick(['#c9552e', '#2f6f8f', '#e9c46a', '#6b8f4e', '#5b4060', '#d0687a', '#141018', '#7aa0b8'])]); }
      return out; };
    for (const q of [[24.1, 1.55], [24.5, 1.95], [25.6, 1.62], [25.95, 1.98], [26.4, 1.58]]) pinned(g, 'x', XE, q[0], Y + q[1], r.f(0.28, 0.36), r.f(0.2, 0.28), art());
    for (const q of [[-11.4, 1.5], [-11.0, 1.9], [-10.5, 1.45], [-10.0, 1.85], [-9.5, 1.55], [-8.9, 1.95], [-8.3, 1.5]]) pinned(g, 'z', ZB, q[0], Y + q[1], r.f(0.28, 0.38), r.f(0.2, 0.3), art());
    s.flush({ tier: 'd', level: LV }); }
  // Pip's table, drawn by Pip: seven people in a row with their names
  pinned(g, 'z', ZB, -7.55, Y + 1.62, 0.5, 0.32, [[0.06, 0.2, 0.12, 0.62, '#c9552e'], [0.18, 0.2, 0.25, 0.7, '#2f6f8f'], [0.31, 0.2, 0.36, 0.5, '#6b8f4e'], [0.42, 0.2, 0.47, 0.44, '#e9c46a'], [0.54, 0.2, 0.61, 0.66, '#5b4060'], [0.67, 0.2, 0.73, 0.6, '#d0687a'], [0.8, 0.2, 0.87, 0.72, '#33406e'], [0.03, 0.12, 0.97, 0.16, '#5a3d28']], '#f6efe0');
  s.flush({ tier: 'd', level: LV });

  // ---- the kitchen on the west wall: hob, sink, the herb shelf, the starter crock and its card
  prop(s, 'flats.cupboard', XW + 0.3, Y, 27.4, Math.PI / 2, { w: 2.4, body: '#33406e', top: '#9a6a42', sink: 0.6, hob: -0.65 }, { level: LV });
  g.mat('tile', '#e8dcc0'); g.box(XW, Y + 0.9, 26.2, XW + 0.012, Y + 1.4, 28.6, { faces: 'X' }); s.flush({ tier: 's', level: LV });
  prop(s, 'flats.kettle', XW + 0.32, Y + 0.92, 28.18, 0.6, { metal: '#c9552e', mat: 'cast' }, { level: LV });
  cups(s, [[XW + 0.3, Y + 0.92, 27.85, 'bowl', 0, { glaze: '#e9e1cf', lid: '#e9c46a', r: 0.12 }]], LV);
  prop(s, 'crock', XW + 0.26, Y + 0.9, 26.36, 0, { glaze: '#8a5a3c', h: 0.26, r: 0.1 }, { level: LV });
  sign(s, { kind: 'notice', title: 'Strain library', lines: ['Halloran starter', 'Candlewick 19 · 5', 'Registered, copy held'] }, XW + 0.4, Y + 0.97, 26.36, { face: 'X', w: 0.1, h: 0.13, level: LV, board: false });
  shelf(g, 'X', XW, 26.3, 28.5, Y + 1.55, 0.26, { lip: true, wood: '#7a5233' });
  shelf(g, 'X', XW, 26.3, 28.5, Y + 2.1, 0.22, { wood: '#7a5233' });
  s.flush({ tier: 'd', level: LV });
  lamp(s, 'strip', XW + 0.12, Y + 2.07, 26.4, { to: [XW + 0.12, Y + 2.07, 28.4], K: 3700, power: 0.35, clip: CLIP, level: LV });
  { const herbs = [['fine', '#c98a2e'], ['broad', '#2b6b69'], ['broad', '#e8d8bb'], ['fine', '#a3563a'], ['fern', '#5b4060'], ['broad', '#c98a2e']];
    herbs.forEach((h, i) => prop(s, 'plant', XW + 0.13, Y + 1.55, 26.5 + i * 0.36, i, { kind: h[0], size: 0.38, pot: h[1], seed: i }, { level: LV })); }
  cups(s, [[XW + 0.1, Y + 2.1, 26.5, 'flats.jar', 0, { fill: '#c8321e', lid: '#c8a45a', label: '#efe6d2' }], [XW + 0.1, Y + 2.1, 26.75, 'flats.jar', 0, { fill: '#e8c43a', lid: '#c8a45a' }], [XW + 0.1, Y + 2.1, 27.0, 'flats.jar', 0, { fill: '#6b8f4e', lid: '#c8a45a', h: 0.18 }],
    [XW + 0.1, Y + 2.1, 27.3, 'flats.tin', 0, { col: '#3d5a3a', band: '#e9e2d0' }], [XW + 0.1, Y + 2.1, 27.6, 'cup', 0, { glaze: '#2f6f8f' }], [XW + 0.1, Y + 2.1, 27.75, 'cup', 0, { glaze: '#c9552e' }], [XW + 0.1, Y + 2.1, 27.9, 'cup', 0, { glaze: '#e9c46a' }], [XW + 0.1, Y + 2.1, 28.05, 'cup', 0, { glaze: '#6b8f4e' }], [XW + 0.1, Y + 2.1, 28.25, 'cup', 0, { glaze: '#efe6d2' }]], LV);
  lamp(s, 'sconce', XW + 0.02, Y + 2.4, 25.9, { face: 'X', K: 2800, power: 0.4, clip: CLIP, level: LV });

  // ---- the larder shelf: hard bread, aged cheese, miso, preserves, noodles, a tin of the Nine
  prop(s, 'shelving', XW + 0.16, Y, 24.75, Math.PI / 2, { w: 1.3, h: 2.0, shelves: 4, wood: '#6f5137' }, { level: LV });
  { const r = new Rng('larder'); const xs = XW + 0.16, sy = [0.105, 0.5, 0.9, 1.3, 1.7];
    for (let i = 0; i < 5; i++) {
      const y = Y + sy[i]; let z = 24.2;
      while (z < 25.3) {
        const k = r.i(0, 5);
        if (k === 0) { g.mat('plain', '#b07a3a', { rough: 0.2 }); g.ball(xs, y + 0.05, z + 0.1, 0.07, 0.05, 0.1, { segs: 10, rings: 6 }); z += 0.22; }
        else if (k === 1) { g.mat('plain', '#e8c86a', { rough: 0.1 }); g.cyl(xs, y, z + 0.09, 0.09, 0.07, { segs: 14 }); g.mat('plain', '#b08a3a'); g.cyl(xs, y + 0.07, z + 0.09, 0.091, 0.004, { segs: 14 }); z += 0.2; }
        else if (k === 2) { g.mat('glaze', r.pick(['#8a5a3c', '#5a4a3a', '#b0703a'])); g.lathe(xs, z + 0.08, [[0, y], [0.07, y], [0.08, y + 0.08], [0.06, y + 0.15], [0.065, y + 0.16], [0, y + 0.17]], { segs: 12 }); z += 0.18; }
        else if (k === 3) { g.mat('plain', r.pick(['#c8321e', '#e8a03a', '#6b3a5a', '#7a9a3a']), { rough: -0.3 }); g.cyl(xs, y, z + 0.05, 0.045, 0.12, { segs: 10 }); g.mat('cast', '#c8a45a'); g.cyl(xs, y + 0.12, z + 0.05, 0.047, 0.015, { segs: 10 }); z += 0.12; }
        else if (k === 4) { g.mat('plain', '#e8dcb0', { rough: 0.2 }); for (let j = 0; j < 3; j++) g.box(xs - 0.08, y + j * 0.012, z, xs + 0.08, y + j * 0.012 + 0.01, z + 0.08); z += 0.12; }
        else { g.mat('brushed', '#3d5a3a'); g.cyl(xs, y, z + 0.06, 0.055, 0.12, { segs: 12 }); g.mat('paper', '#e9e2d0'); g.cyl(xs, y + 0.03, z + 0.06, 0.056, 0.05, { segs: 12, capTop: false, capBottom: false }); z += 0.14; }
      }
      s.flush({ tier: 'd', level: LV });
    } }

  // ---- the aunt's armchair by the window, the mending basket, a lamp on a little table
  prop(s, 'flats.armchair', -12.7, Y, 24.35, 0.55, { cover: '#6b8f4e', mat: 'weave', worn: '#8aa86a', throw: '#e9c46a', w: 0.84 }, { level: LV, spot: fam('mina', ['mend', 'sew']) });
  prop(s, 'flats.basket', -12.05, Y, 23.85, 0.3, { cloth: ['#2f6f8f', '#c9552e', '#e9c46a', '#6b8f4e'] }, { level: LV });
  prop(s, 'flats.lowtable', -13.55, Y, 25.2, 0, { w: 0.45, d: 0.45, h: 0.55, round: true, wood: '#5a3d28' }, { level: LV });
  tableLamp(s, -13.55, Y + 0.55, 25.2, { h: 0.42, base: '#c9552e', shade: '#f2d9a8', K: 2600, power: 0.4, clip: CLIP, level: LV });
  cups(s, [[-13.42, Y + 0.55, 25.05, 'cup', 0, { glaze: '#33406e' }]], LV);
  g.mat('cast', '#8a6d3b'); g.tube([[-12.3, Y + 2.4, ZI + 0.07], [-10.3, Y + 2.4, ZI + 0.07]], 0.011, { segs: 6 });
  curtain(g, -12.38, ZI + 0.07, -11.98, ZI + 0.07, Y + 2.37, Y + 0.86, { col: '#d0687a', mat: 'motif', folds: 5, nu: 6, rail: false });
  curtain(g, -10.62, ZI + 0.07, -10.22, ZI + 0.07, Y + 2.37, Y + 0.86, { col: '#d0687a', mat: 'motif', folds: 5, nu: 6, rail: false });
  s.flush({ tier: 'd', level: LV });
  prop(s, 'plant', -11.7, Y + 0.97, ZI + 0.1, 0, { kind: 'flower', size: 0.45, pot: P.blue }, { level: LV });
  prop(s, 'plant', -10.9, Y + 0.97, ZI + 0.1, 1, { kind: 'broad', size: 0.4, pot: '#e9c46a', seed: 4 }, { level: LV });

  // ---- the kids' room: bunks with curtains, a desk, a toy chest, a lantern left low all night
  prop(s, 'rug', -12.2, Y, 30.8, 0, { w: 2.2, d: 1.3, a: P.blue, b: '#e9c46a', mat: 'stripe' }, { level: LV });
  prop(s, 'flats.bunk', -13.4, Y, ZKI - 0.47, Math.PI, { frame: '#3f6f7a', a: '#e9c46a', b: '#6b8f4e', ca: '#c9552e', cb: '#2f6f8f' }, { level: LV, noSpots: true });
  s.spot('bed', -13.55, Y + 0.47, ZKI - 0.47, -Math.PI / 2, fam('pip', ['sleep']));
  s.spot('bed', -13.55, Y + 1.43, ZKI - 0.47, -Math.PI / 2, fam('esi', ['sleep']));
  prop(s, 'table', -10.25, Y, ZKI - 0.32, 0, { w: 1.0, d: 0.55, h: 0.68, wood: '#6b8f4e', top: '#e9c46a' }, { level: LV, tier: 's' });
  prop(s, 'stool', -10.25, Y, ZKI - 0.85, 0, { wood: '#c9552e', h: 0.42 }, { level: LV, noSpots: true });
  s.spot('sit', -10.25, Y + 0.42, ZKI - 0.85, Math.PI, fam('esi', ['write', 'homework']));
  tableLamp(s, -9.92, Y + 0.68, ZKI - 0.2, { h: 0.36, r: 0.1, base: '#2f6f8f', shade: '#f6e0b0', K: 2700, power: 0.3, clip: CLIPK, level: LV });
  cups(s, [[-10.5, Y + 0.68, ZKI - 0.3, 'flats.ball', 0.4, { col: '#2f6f8f', band: '#e9c46a' }]], LV);
  prop(s, 'crate', -11.6, Y, ZKI - 0.3, 0, { w: 0.7, h: 0.45, d: 0.42, wood: '#c98a2e' }, { level: LV });
  { g.mat('wood', '#b08d5e'); g.box(-11.85, Y + 0.45, ZKI - 0.42, -11.55, Y + 0.55, ZKI - 0.24, { bevel: 0.01 }); g.mat('paint', '#c9552e'); g.box(-11.8, Y + 0.55, ZKI - 0.4, -11.6, Y + 0.65, ZKI - 0.26, { bevel: 0.012 });
    g.mat('cast', '#2a2826'); for (const dx of [-0.11, 0.11]) g.cyl(-11.7 + dx, Y + 0.46, ZKI - 0.24, 0.025, 0.012, { segs: 8 });
    s.flush({ tier: 'd', level: LV }); }
  prop(s, 'flats.satchel', -12.4, Y, 30.2, 0.8, { col: '#5b4060' }, { level: LV });
  shelf(g, 'X', XW, 30.0, 31.4, Y + 1.5, 0.22, { wood: '#c98a2e' }); books(g, 'X', XW, 30.05, 30.9, Y + 1.5, 'kidsbooks', { tall: 0.22 }); s.flush({ tier: 'd', level: LV });
  { const r = new Rng('kidart2'); for (const q of [[-12.2, 1.9], [-11.6, 1.6], [-11.0, 2.0], [-10.4, 1.6]]) pinned(g, 'z', ZKI, q[0], Y + q[1], 0.32, 0.24, [[0, 0, 1, 1, '#f4ecd8'], [r.f(0, 0.3), r.f(0, 0.3), r.f(0.5, 1), r.f(0.4, 0.9), r.pick(['#c9552e', '#2f6f8f', '#e9c46a', '#6b8f4e'])], [r.f(0.2, 0.5), r.f(0.4, 0.6), r.f(0.6, 0.9), r.f(0.7, 1), r.pick(['#141018', '#5b4060', '#d0687a'])]]); s.flush({ tier: 'd', level: LV }); }
  lamp(s, 'lantern', -12.0, Y + 2.3, 30.6, { tint: '#7aa0b8', power: 0.45, drop: 0.45, clip: CLIPK, level: LV });
  roomGlow(s, X0, Y, Z1, XP, Y + H, ZK, { sky: '#ffd8a8', ground: '#8aa070', power: 0.14 });
  // the parents' room, behind its shut door: a floor and their bed spots only
  s.spot('bed', -6.6, Y + 0.5, 31.6, -Math.PI / 2, fam('ines', ['sleep']));
  s.spot('bed', -6.6, Y + 0.5, 32.2, -Math.PI / 2, fam('kwame', ['sleep']));

  // ---- light
  roomGlow(s, X0, Y, Z0, X1, Y + H, Z1, { sky: '#ffd8a8', ground: '#b88a5a', power: 0.14 });
  s.light({ at: [-11.85, Y + 1.6, ZI + 0.3], to: [-10.75, Y + 1.6, ZI + 0.3], type: 'tube', color: warm(5200), power: 1.7, range: 6, clip: CLIP, sun: true, radius: 0.5, shadow: true });
  s.light({ at: [-11.3, Y + 1.7, ZI + 0.25], color: warm(2300), power: 0.6, range: 4, clip: CLIP, night: true, radius: 0.4 });

  // ---- people, walkways, the zone
  s.spot('work', XW + 0.85, Y, 27.75, -Math.PI / 2, fam('ines', ['cook']));
  s.spot('work', XW + 0.85, Y, 26.8, -Math.PI / 2, fam('kwame', ['cook', 'wash']));
  s.spot('stand', -6.6, Y, ZI + 0.7, Math.PI, fam('kwame', ['shoes']));
  s.spot('play', -11.8, Y, 30.7, 0.5, fam('pip', ['kids', 'play']));
  s.spot('play', -12.6, Y, 30.9, 2.5, fam('esi', ['kids', 'play']));
  s.spot('stand', -5.4, Y, 27.9, -Math.PI / 2, fam('mina', ['look']));
  s.path([[-9, Y, 22.75], [-9, Y, 24.3], [-10.2, Y, 25.5], [-11.0, Y, 28.1], [-12.45, Y, 28.9], [-12.45, Y, 30.2], [-11.2, Y, 31.2]], { width: 1.0 });
  s.path([[-10.2, Y, 25.5], [-13.4, Y, 27.0]], { width: 0.9 });
  s.path([[-9, Y, 24.3], [-6.4, Y, 24.4], [-5.4, Y, 26.4], [-5.5, Y, 28.3], [-5.95, Y, 28.9], [-5.95, Y, 30.4], [-6.8, Y, 31.4]], { width: 0.9 });
  s.zoneBox({ id: 'flat-family', place: 'flat-family', box: [X0, Y - 0.3, Z0, X1, Y + H, ZK], name: 'The Hallorans\' flat', sub: 'Candlewick · deck 19 · terrace flat 5', ambience: 'flat', reverb: 'room', env: { exposure: 1.0, warmth: 0.35 }, headroom: 2.85 });

  // ---- things to do
  s.interact({ x: -11.96, y: Y + 1.15, z: Z1 - 0.3, radius: 0.85, prompt: 'Read the growing chart', onUse: (gm) => readLines(gm, 'Up the door frame', [
    'Pencil marks in two colours. Esi\'s in blue climb to 1.38 metres, the last one dated the week after Knotnight.',
    'Pip\'s in red stop at 1.20, with a note beside it: on tiptoe, does not count.',
    'At the very top, in green, somebody has marked Aunt Mina at 1.55 and written: finished.'] ) });
  s.interact({ x: -7.55, y: Y + 1.62, z: ZB - 0.1, radius: 0.85, prompt: 'Look at the drawing of Pip\'s table', onUse: (gm) => {
    if (!find(gm, 'tables-aunts')) readCard(gm, 'Pinned up by the door', 'My table', 'Six people in crayon, in a row, each a different colour: Mum, Dad, and four aunts. Two of the aunts are men. One of them is Mina, in green, slightly larger than everyone else.', 8);
  } });
  s.interact({ x: XW + 0.35, y: Y + 1.05, z: 26.5, radius: 0.8, prompt: 'Look at the starter crock', onUse: (gm) => readCard(gm, 'On the worktop', 'The Halloran starter', 'A brown crock with a cloth over it and a card from the strain library propped against it: registered, copy held. If the crock ever died the library could grow it back within a week. Ines says that is not the point.', 8) });
  s.interact({ x: XW + 0.3, y: Y + 1.1, z: 24.75, radius: 0.9, prompt: 'Look at the larder shelf', onUse: (gm) => readCard(gm, 'The larder', 'Hard bread, aged cheese, miso', 'Hard bread, two wheels of aged cheese, a crock of miso, preserves, dried noodles and a tin of the Nine. The drum keeps the air; families keep the food. Somebody has labelled the jam shelf PIP NO.', 8) });
  s.interact({ x: -12.05, y: Y + 0.4, z: 23.85, radius: 0.8, prompt: 'Look in the mending basket', onUse: (gm) => readCard(gm, 'The mending basket', 'Let out three times', 'A pair of Pip\'s trousers with the seam opened. Children\'s clothes are cut with a hand\'s width folded into every seam, and a good pair is let out three times before it is handed down. This pair is on its fourth.', 8) });
  sitUse(s, -5.5, Y, 25.0, Math.PI / 2, 'Sit at the light panel', { onSit: (gm) => { panel.boost(gm, 20); toast(gm, 'The panel comes up white and very bright. Esi and Pip sit here for twenty minutes every morning, which the school insists on.', 'info', 7); } });
  sitUse(s, -8.4, Y, 27.58, Math.PI, 'Sit at the long table');
  // children at home in the day: a quiet loop of them, started when you come near and stopped at bedtime
  s.world.dynamics.push({ scope: s, snd: null, update() {
    if (!game.loopAt || !game.audio || !game.player || !game.clock) return;
    const q = game.player.pos, h = game.clock.hours;
    const want = game.player.frame === f && Math.abs(q.y - Y) < 2 && q.x > X0 - 6 && q.x < X1 + 6 && q.z > Z0 - 4 && q.z < ZK && h > 7 && h < 20.5;
    if (want && !this.snd) this.snd = game.loopAt('kids', f, -11.8, Y + 1.0, 30.8, { vol: 0.12, radius: 6 });
    else if (!want && this.snd && this.snd.stop) { this.snd.stop(1); this.snd = null; }
  } });

  s.finish();
  game.spawns['flat-family'] = { frame: f, x: -9, y: Y, z: 24.3, yaw: Math.PI, pitch: -0.05 };
}

// ===================================================================================================================
// Oona's flat: deck 17, x[4, 15] z[23.2, 33]. Eighty-one years of a lamp-painter: every lamp a slightly different white,
// colour studies leaning in stacks, a narrow bed, a big chair by a table of pigments, the drawing she made at eight of
// what she saw through the Window, a shelf of gin and good glasses, and plants she talks to.
// ===================================================================================================================
function oonaFlat(game, f) {
  const s = game.world.scope('flat-oona', f), g = s.g;
  const Y = 4, LV = 1, H = 3;
  const X0 = 5.0, X1 = 14.9, Z0 = 23.2, Z1 = 31.4, XW = 5.16, XE = 14.74, ZI = 23.36, ZB = 31.24;
  const P = { wall: '#c8bfb0', dado: '#5b4060', floor: '#5a3d28', plum: '#5b4060', gold: '#d6a640', rose: '#b06a7a', bruise: '#5a3f52' };
  const CLIP = [X0 - 0.05, Y - 0.2, Z0 - 0.05, X1 + 0.05, Y + H + 0.1, Z1 + 0.05];
  const dado = { h: 0.9, mat: 'paint', tint: P.dado };
  const OO = (tags) => ({ who: 'oona', tags: ['flat', 'home'].concat(tags || []) });

  // ---- the shell: walls a neutral grey, so a white can be judged against them
  floor(s, X0, Z0, X1, Z1, Y, 'planks', P.floor, { level: LV });
  ceiling(s, X0, Z0, X1, Z1, Y + H, 'paint', '#e6e0d6', { level: LV });
  frontWall(s, { side: 'S', c: Z0, a0: X0, a1: X1, y: Y, h: H, door: 9, win: 11.3, tint: P.wall, dado, lv: LV, doorTint: P.plum, label: 'Oona\'s door', open: true, sill: ['wood', '#3a2a20'], casing: '#3a2a20' });
  wall(s, X0 + 0.08, Z0, X0 + 0.08, Z1, Y, H, { tint: P.wall, dado, level: LV });
  wall(s, X1 - 0.08, Z0, X1 - 0.08, Z1, Y, H, { tint: P.wall, dado, level: LV });
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, Y, H, { tint: P.wall, dado, level: LV });
  picRail(s, X0, Z0, X1, Z1, Y + 2.45, { band: P.gold, wood: '#3a2a20', level: LV });
  ceilingWorks(s, XW, ZI, XE, ZB, Y + H, { along: 'z', step: 1.6, felt: '#7a6a7a', pipeAt: 'x1', lv: LV });
  prop(s, 'rug', 8.6, Y, 27.2, 0, { w: 3.6, d: 2.4, a: P.rose, b: P.gold, mat: 'motif' }, { level: LV });

  // ---- the lamp wall: a long low cupboard with seven lamps on it, each a different white; swatches pinned above; three sconces
  prop(s, 'flats.cupboard', 8.7, Y, ZB - 0.3, Math.PI, { w: 1.8, body: '#4a3348', top: '#3a2a20' }, { level: LV });
  prop(s, 'flats.cupboard', 10.5, Y, ZB - 0.3, Math.PI, { w: 1.8, body: '#4a3348', top: '#3a2a20' }, { level: LV });
  const LAMPS = [
    { x: 7.95, h: 0.46, r: 0.13, base: '#2f6f73', shade: '#f6dcb0', K: 2200 },
    { x: 8.5, h: 0.36, r: 0.1, base: '#b08a45', baseMat: 'cast', shade: '#f2e2c4', K: 2700 },
    { x: 9.05, h: 0.52, r: 0.14, base: P.plum, shade: '#f6e4e4', color: '#ffe6e2' },
    { x: 9.6, h: 0.4, r: 0.12, base: '#e8e2d4', shade: '#eef0ea', K: 4000 },
    { x: 10.15, h: 0.48, r: 0.11, base: '#3d5a3a', shade: '#e8f0e0', color: '#eef8e6' },
    { x: 10.7, h: 0.34, r: 0.13, base: '#33406e', shade: '#eaf0f8', K: 5600 },
    { x: 11.25, h: 0.44, r: 0.12, base: '#a3563a', shade: '#f6ecd8', K: 3200 },
  ];
  for (const L of LAMPS) tableLamp(s, L.x, Y + 0.9, ZB - 0.3, { h: L.h, r: L.r, base: L.base, baseMat: L.baseMat, shade: L.shade, K: L.K, color: L.color, power: 0.14, range: 3.2, clip: CLIP, level: LV, glow: 0.95 });
  { const ramp = [['#2a2238', '#3a2638', '#4a3048', '#5a3f52', '#6b4a5a', '#7a5060', '#8a5a62', '#9a6068', '#a8686e'],
      ['#b06a7a', '#c07a80', '#d0887e', '#d99a86', '#e0a98a', '#e6b48e', '#e8bc90', '#eac494', '#eccc98'],
      ['#f2d29a', '#f0c880', '#eebc6a', '#ecb05a', '#e8a050', '#e09448', '#d88a42', '#d07a40', '#c86e3a'],
      ['#f8ecd8', '#f6eee2', '#f4f0ea', '#f0f0ee', '#ecf0f2', '#eaeef4', '#f2ece8', '#f4e8e8', '#eef2e8']];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) {
      const u = 8.0 + c * 0.4, v = Y + 1.95 - r * 0.19, crossed = (r === 1 && c > 2 && c < 6);
      const rects = [[0.12, 0.18, 0.88, 0.82, ramp[r][c]]]; if (crossed) rects.push([0.05, 0.47, 0.95, 0.53, '#3a3530']);
      pinned(g, 'z', ZB, u, v, 0.12, 0.09, rects);
    }
    s.flush({ tier: 'd', level: LV }); }
  for (const q of [[8.1, 2700], [9.6, 3600], [11.1, 4800]]) lamp(s, 'sconce', q[0], Y + 2.25, ZB - 0.02, { face: 'z', K: q[1], power: 0.12, range: 3.0, clip: CLIP, level: LV });
  studies(g, 'z', ZB, 12.35, Y, 'oona-lampwall', { n: 4 }); s.flush({ tier: 'd', level: LV });
  prop(s, 'flats.lowtable', 13.45, Y, ZB - 0.35, 0, { w: 0.42, h: 0.72, round: true, wood: '#3a2a20' }, { level: LV });
  prop(s, 'plant', 13.45, Y + 0.72, ZB - 0.35, 0.3, { kind: 'fine', size: 0.7, pot: P.gold, leaf: '#e0ffd0' }, { level: LV });

  // ---- her chair by the window and the table of pigments: mortar, jars from brown-violet to gold, one labelled bruise
  prop(s, 'table', 12.45, Y, 24.35, 0, { w: 1.0, d: 0.6, wood: '#3a2a20', top: '#6f4e33' }, { level: LV, tier: 's' });
  prop(s, 'flats.armchair', 12.45, Y, 25.28, Math.PI, { cover: P.plum, mat: 'weave', worn: '#7a5a7a', throw: P.gold, wing: true, w: 0.9 }, { level: LV, spot: OO(['read', 'paint']) });
  prop(s, 'flats.ladder', 11.38, Y, 24.75, Math.PI / 2, { wood: '#3a2a20', seat: '#b89a5a', cushion: P.rose }, { level: LV, spot: { who: 'marit', tags: ['flat', 'visit'] } });
  tableLamp(s, 13.5, Y, 25.6, { h: 1.5, r: 0.2, base: '#3a3530', baseMat: 'cast', shade: '#efd9b0', K: 2600, power: 0.5, range: 4.5, clip: CLIP, level: LV });
  prop(s, 'flats.mortar', 12.15, Y + 0.74, 24.42, 0.4, { pigment: P.bruise }, { level: LV });
  const PIG = ['#3a2638', P.bruise, '#6b4a5a', '#8a5a62', P.rose, '#d98a7a', '#e8a050', '#f2d29a'];
  PIG.forEach((c, i) => prop(s, 'flats.jar', 12.03 + i * 0.12, Y + 0.74, 24.14, 0, { fill: c, lid: '#b08a45', r: 0.04, h: 0.1, label: i === 1 ? '#f4ecd8' : undefined }, { level: LV }));
  sign(s, { kind: 'notice', lines: ['bruise'], hand: true, paper: '#f4ecd8' }, 12.15, Y + 0.795, 24.185, { face: 'Z', w: 0.06, h: 0.03, level: LV, board: false });
  g.mat('plain', '#d8e4e0', { rough: -0.4 }); g.box(12.55, Y + 0.74, 24.3, 12.85, Y + 0.752, 24.55);
  { const r = new Rng('smears'); for (let i = 0; i < 5; i++) { g.mat('plain', PIG[r.i(0, 7)], { rough: 0.2 }); const x = 12.58 + r.f(0, 0.2), z = 24.33 + r.f(0, 0.17); g.box(x, Y + 0.752, z, x + r.f(0.02, 0.06), Y + 0.755, z + r.f(0.01, 0.03)); } }
  g.mat('brushed', '#c9c4bb'); g.box(12.9, Y + 0.742, 24.4, 13.06, Y + 0.748, 24.42);
  s.flush({ tier: 'd', level: LV });
  cups(s, [[12.85, Y + 0.74, 24.18, 'cup', 0, { glaze: P.plum, lid: P.gold }]], LV);

  // ---- the drawing she made at eight: the River, through the Window, in crayon, framed in gilt, with its own small light
  framed(g, 'x', XE, 25.3, Y + 1.5, 0.44, 0.34, [[0, 0, 1, 1, '#141018'], [0, 0.3, 1, 0.38, '#4a3048'], [0, 0.38, 1, 0.48, '#6b4a5a'], [0, 0.48, 1, 0.54, '#8a5a62'], [0, 0.54, 1, 0.6, P.bruise],
    [0.08, 0.7, 0.1, 0.73, '#f4ecd8'], [0.3, 0.8, 0.32, 0.83, '#f4ecd8'], [0.55, 0.72, 0.57, 0.75, '#f4ecd8'], [0.8, 0.85, 0.82, 0.88, '#f4ecd8'], [0.9, 0.2, 0.92, 0.23, '#f4ecd8'], [0.15, 0.15, 0.17, 0.18, '#f4ecd8'], [0.42, 0.42, 0.44, 0.45, '#f4ecd8'], [0.7, 0.5, 0.72, 0.53, '#f4ecd8'],
    [0.22, 0.36, 0.32, 0.56, '#000000'], [0.64, 0.33, 0.7, 0.5, '#000000'], [0.04, 0.04, 0.26, 0.09, '#e9c46a']], { frame: '#b08a45', frameMat: 'cast', fw: 0.04, ground: '#efe6d2', mount: 0.035 });
  s.flush({ tier: 'd', level: LV });
  lamp(s, 'sconce', XE - 0.02, Y + 1.92, 25.3, { face: 'x', K: 2700, power: 0.16, range: 2.2, clip: CLIP, level: LV });

  // ---- colour studies leaning in stacks; a bookcase; the gin shelf and the good glasses
  studies(g, 'X', XW, 25.35, Y, 'oona-w1', { n: 5 }); studies(g, 'z', ZB, 7.05, Y, 'oona-w2', { n: 3 }); studies(g, 'x', XE, 28.35, Y, 'oona-e1', { n: 6 });
  s.flush({ tier: 'd', level: LV });
  prop(s, 'shelving', XE - 0.16, Y, 27.0, -Math.PI / 2, { w: 1.2, h: 2.1, shelves: 4, wood: '#3a2a20' }, { level: LV });
  for (const [i, yy] of [0.105, 0.6025, 1.1, 1.5975].entries()) books(g, 'x', XE - 0.01, 26.45, 27.55, Y + yy, 'oona-bk' + i, { tall: 0.3, low: 0.18 });
  s.flush({ tier: 'd', level: LV });
  shelf(g, 'x', XE, 29.15, 30.85, Y + 1.35, 0.24, { wood: '#3a2a20' }); shelf(g, 'x', XE, 29.15, 30.85, Y + 1.78, 0.2, { wood: '#3a2a20' });
  g.mat('wood', '#6f4e33'); g.box(XE - 0.21, Y + 1.35, 29.3, XE - 0.03, Y + 1.365, 30.1, { bevel: 0.004 }); s.flush({ tier: 'd', level: LV });
  cups(s, [[XE - 0.1, Y + 1.365, 29.42, 'flats.bottle', 0, { glass: '#e6eee8', label: '#efe6d2' }], [XE - 0.1, Y + 1.365, 29.62, 'flats.bottle', 0, { glass: '#e6eee8', label: P.gold, h: 0.26 }], [XE - 0.1, Y + 1.365, 29.85, 'flats.bottle', 0, { glass: '#9ab8a0', h: 0.32 }]], LV);
  { const tints = ['#e6eef0', '#f2e6e0', '#e6f0e4', '#eee8f4', '#f4eee0', '#e8eef4']; for (let i = 0; i < 6; i++) prop(s, 'flats.glass', XE - 0.1, Y + 1.78, 29.3 + i * 0.22, 0, { tint: tints[i] }, { level: LV });
    for (let i = 0; i < 3; i++) prop(s, 'flats.glass', XE - 0.12, Y + 1.365, 30.3 + i * 0.18, 0, { tint: tints[i + 2], tumbler: true }, { level: LV }); }

  // ---- the narrow bed behind a dyed cloth, a bedside table with a lamp and a glass of water
  prop(s, 'flats.bed', 5.63, Y, ZB - 1.0, Math.PI, { w: 0.86, l: 1.95, frame: '#3a2a20', cover: P.rose, coverMat: 'knit', board: 'panel', quilt: [P.bruise, P.gold, '#e6a98a', '#4a3048'], mend: '#f2d29a' }, { level: LV, spot: OO(['sleep']) });
  g.mat('cast', '#8a6d3b'); g.tube([[6.5, Y + 2.6, 28.4], [6.5, Y + 2.6, ZB]], 0.011, { segs: 6 }); for (let z = 28.6; z < ZB; z += 0.9) g.tube([[6.5, Y + 2.6, z], [6.5, Y + H, z]], 0.004, { segs: 3 });
  curtain(g, 6.5, 29.3, 6.5, ZB - 0.02, Y + 2.57, Y + 0.08, { col: P.rose, mat: 'motif', folds: 11, nu: 14, rail: false });
  g.mat('weave', P.bruise); g.box(6.49, Y + 0.08, 29.3, 6.51, Y + 0.4, ZB - 0.02, { faces: 'xX' });
  s.flush({ tier: 'd', level: LV });
  prop(s, 'flats.lowtable', 6.27, Y, 30.82, 0, { w: 0.36, d: 0.36, h: 0.55, wood: '#3a2a20' }, { level: LV });
  tableLamp(s, 6.27, Y + 0.55, 30.88, { h: 0.36, r: 0.1, base: P.gold, baseMat: 'cast', shade: '#f2dcc0', K: 2300, power: 0.22, range: 3, clip: CLIP, level: LV });
  cups(s, [[6.3, Y + 0.55, 30.7, 'flats.glass', 0, { tumbler: true }]], LV);

  // ---- a small kitchen corner: she eats at the hall, mostly
  prop(s, 'flats.cupboard', XW + 0.3, Y, 24.25, Math.PI / 2, { w: 1.1, body: '#4a3348', top: '#3a2a20', hob: 0.15 }, { level: LV });
  prop(s, 'flats.kettle', XW + 0.32, Y + 0.92, 24.12, 0.4, { metal: '#b08a45', mat: 'cast' }, { level: LV });
  shelf(g, 'X', XW, 23.75, 24.85, Y + 1.55, 0.2, { wood: '#3a2a20' }); s.flush({ tier: 'd', level: LV });
  cups(s, [[XW + 0.1, Y + 1.55, 23.9, 'flats.tin', 0, { col: P.plum, band: P.gold }], [XW + 0.1, Y + 1.55, 24.12, 'flats.tin', 0, { col: '#2f6f73', band: '#efe6d2' }], [XW + 0.1, Y + 1.55, 24.35, 'flats.tin', 0, { col: '#3d5a3a', band: '#e9e2d0' }], [XW + 0.1, Y + 1.55, 24.58, 'cup', 0, { glaze: P.gold }], [XW + 0.1, Y + 1.55, 24.72, 'cup', 0, { glaze: P.rose }]], LV);

  // ---- a low table on the rug with a ring of swatch cards, and a chair for whoever has come up
  prop(s, 'flats.sofa', XW + 0.47, Y, 26.95, Math.PI / 2, { w: 2.0, cover: '#3f5a5a', mat: 'weave', odd: P.gold, throw: P.rose }, { level: LV, spot: OO(['look', 'lamps']) });
  prop(s, 'flats.lowtable', 6.75, Y, 26.95, 0, { w: 0.6, h: 0.48, round: true, wood: '#3a2a20' }, { level: LV });
  for (let i = 0; i < 12; i++) { const a = i / 12 * 2.4 - 0.4; g.push(); g.move(6.7, Y + 0.48 + i * 0.002, 26.93); g.rotY(a); g.mat('paper', [P.bruise, '#6b4a5a', '#8a5a62', P.rose, '#d99a86', '#e6b48e', '#f2d29a', '#eebc6a', '#e8a050', '#f8ecd8', '#f0f0ee', '#eaeef4'][i]); g.box(-0.02, 0, -0.02, 0.18, 0.002, 0.03); g.pop(); }
  g.mat('cast', '#b08a45'); g.cyl(6.7, Y + 0.48, 26.93, 0.012, 0.03, { segs: 6 }); s.flush({ tier: 'd', level: LV });
  cups(s, [[6.9, Y + 0.48, 27.1, 'cup', 0, { glaze: '#e9e2d0' }]], LV);
  prop(s, 'chair', 7.7, Y, 26.1, -1.2, { back: 'slat', wood: '#5a3d28', seat: P.gold }, { level: LV, spot: { who: 'suvi', tags: ['flat', 'visit'] } });
  // her easel in the middle of the room, turned to the window: this year's dawn in bands, the middle crossed out
  { const ex = 9.9, ez = 27.9; g.push(); g.move(ex, Y, ez); g.rotY(Math.PI + 0.25);
    g.mat('wood', '#8a6240'); g.tube([[-0.32, 0, 0.12], [-0.05, 1.85, 0.0]], 0.018, { segs: 6 }); g.tube([[0.32, 0, 0.12], [0.05, 1.85, 0.0]], 0.018, { segs: 6 }); g.tube([[0, 0, -0.45], [0, 1.7, -0.02]], 0.016, { segs: 6 });
    g.box(-0.42, 0.62, 0.06, 0.42, 0.66, 0.16, { bevel: 0.005 });
    const bands = ['#2a2238', '#4a3048', P.bruise, '#8a5a62', P.rose, '#e0a98a', '#f2d29a', '#f0c070', '#e8a050'];
    g.mat('wood', '#c9b28a'); g.box(-0.4, 0.66, 0.06, 0.4, 1.56, 0.08);
    bands.forEach((c, i) => { g.mat('paint', c, { rough: 0.15 }); g.box(-0.36, 0.7 + i * 0.094, 0.08, 0.36, 0.7 + (i + 1) * 0.094, 0.084, { faces: 'Z' }); });
    g.mat('plain', '#2a2622'); g.tube([[-0.36, 1.03, 0.087], [0.36, 1.21, 0.087]], 0.004, { segs: 3 }); g.tube([[-0.36, 1.21, 0.087], [0.36, 1.03, 0.087]], 0.004, { segs: 3 });
    g.pop(); s.flush({ tier: 'd', level: LV }); s.post(ex, ez, 0.35, Y, Y + 1.8); }
  prop(s, 'stool', 10.3, Y, 27.25, 0, { wood: '#3a2a20', h: 0.6 }, { level: LV, noSpots: true });
  cups(s, [[10.28, Y + 0.6, 27.22, 'flats.jar', 0, { fill: P.rose, lid: '#b08a45', r: 0.04, h: 0.1 }], [10.38, Y + 0.6, 27.32, 'flats.jar', 0, { fill: '#f2d29a', lid: '#b08a45', r: 0.035, h: 0.08 }]], LV);

  // ---- plants she talks to: on the sill, a big fern in the corner, one hanging by the window
  for (const [i, k] of [[0, 'fern'], [1, 'flower'], [2, 'fine']]) prop(s, 'plant', 10.85 + i * 0.45, Y + 0.97, ZI + 0.1, i, { kind: k, size: 0.42, pot: [P.gold, P.rose, '#2f6f73'][i], seed: i }, { level: LV });
  prop(s, 'plant', 13.95, Y, 23.95, 0.6, { kind: 'fern', size: 1.3, pot: P.plum }, { level: LV });
  prop(s, 'plant', 6.0, Y, 23.85, 1.1, { kind: 'broad', size: 1.1, pot: '#2f6f73', seed: 7 }, { level: LV });
  g.mat('cast', '#3a3530'); for (const a of [0, 2.1, 4.2]) g.tube([[10.2, Y + H, 24.1], [10.2 + Math.cos(a) * 0.12, Y + 2.25, 24.1 + Math.sin(a) * 0.12]], 0.003, { segs: 3 });
  g.mat('glaze', P.rose); g.lathe(10.2, 24.1, [[0, Y + 2.1], [0.1, Y + 2.1], [0.14, Y + 2.25], [0.13, Y + 2.25]], { segs: 12 });
  { const r = new Rng('hang'); g.mat('leafB', '#ffffff', { sway: 0.3 }); for (let i = 0; i < 8; i++) { const a = i * 0.8, tl = r.f(0.4, 0.9); g.card(10.2 + Math.cos(a) * 0.12, Y + 2.24 - tl, 24.1 + Math.sin(a) * 0.12, 0.22, tl, a + Math.PI / 2, { tilt: 0.05 }); } }
  s.flush({ tier: 'd', level: LV });
  g.mat('cast', '#8a6d3b'); g.tube([[10.3, Y + 2.4, ZI + 0.07], [12.3, Y + 2.4, ZI + 0.07]], 0.011, { segs: 6 });
  curtain(g, 10.22, ZI + 0.07, 10.6, ZI + 0.07, Y + 2.37, Y + 0.86, { col: P.gold, mat: 'weave', folds: 5, nu: 6, rail: false });
  curtain(g, 12.0, ZI + 0.07, 12.38, ZI + 0.07, Y + 2.37, Y + 0.86, { col: P.gold, mat: 'weave', folds: 5, nu: 6, rail: false });
  s.flush({ tier: 'd', level: LV });
  pegs(g, 'Z', ZI, 6.8, 8.1, Y + 1.7, 3, { wood: '#3a2a20' });
  g.mat('knit', P.gold); g.sheet([6.95, Y + 1.72, ZI + 0.1], [7.3, Y + 1.72, ZI + 0.1], [7.32, Y + 0.95, ZI + 0.15], [6.92, Y + 0.95, ZI + 0.15], { nu: 3, nv: 4, ripple: 0.03 });
  g.mat('motif', P.plum); g.sheet([7.55, Y + 1.72, ZI + 0.1], [7.75, Y + 1.72, ZI + 0.1], [7.78, Y + 1.0, ZI + 0.13], [7.52, Y + 1.0, ZI + 0.13], { nu: 2, nv: 4, ripple: 0.02 });
  s.flush({ tier: 'd', level: LV });

  // ---- light
  roomGlow(s, X0, Y, Z0, X1, Y + H, Z1, { sky: '#f6e2c8', ground: '#8a6a5a', power: 0.11 });
  s.light({ at: [10.75, Y + 1.6, ZI + 0.3], to: [11.85, Y + 1.6, ZI + 0.3], type: 'tube', color: warm(5600), power: 1.6, range: 6, clip: CLIP, sun: true, radius: 0.5, shadow: true });
  s.light({ at: [11.3, Y + 1.7, ZI + 0.25], color: warm(2300), power: 0.5, range: 4, clip: CLIP, night: true, radius: 0.4 });

  // ---- people, walkways, the zone
  s.spot('work', 9.6, Y, ZB - 0.95, 0, OO(['paint', 'lamps']));
  s.spot('stand', 11.3, Y, ZI + 0.75, Math.PI, OO(['garden', 'water']));
  s.spot('stand', XE - 0.75, Y, 25.3, Math.PI / 2, OO(['look']));
  s.path([[9, Y, 22.75], [9, Y, 24.3], [9.2, Y, 26.4], [9.0, Y, 29.0], [9.6, Y, 30.1]], { width: 1.0 });
  s.path([[9.0, Y, 29.0], [7.3, Y, 28.9], [6.9, Y, 29.9]], { width: 0.9 });
  s.path([[9.2, Y, 26.4], [11.2, Y, 26.2]], { width: 0.9 });
  s.zoneBox({ id: 'flat-oona', place: 'flat-oona', box: [X0, Y - 0.3, Z0, X1, Y + H, Z1], name: 'Oona\'s flat', sub: 'Candlewick · deck 17 · on the terraces', ambience: 'flat', reverb: 'felt', env: { exposure: 0.95, warmth: 0.2 }, headroom: 2.85 });
  let hum = null;
  s.trigger({ box: [X0, Y - 0.3, Z0, X1, Y + H, Z1], onEnter(gm) { if (!hum && gm.loopAt && gm.audio) hum = gm.loopAt('hum-lamp', f, 9.6, Y + 1.2, ZB - 0.3, { vol: 0.08, radius: 4 }); } });

  // ---- things to do
  s.interact({ x: 12.15, y: Y + 0.82, z: 24.15, radius: 0.8, prompt: 'Look at the jars of pigment', onUse: (gm) => {
    if (!find(gm, 'bruise')) readCard(gm, 'Oona\'s table', 'Bruise', 'Eight jars from near black through rose to gold. The second has a paper label in Marit\'s writing, one word: bruise. The mortar beside it is the same colour to the rim.', 8);
  } });
  s.interact({ x: XE - 0.1, y: Y + 1.5, z: 25.3, radius: 0.9, prompt: 'Look at the drawing', onUse: (gm) => readCard(gm, 'Framed in gilt', 'The River, aged eight', 'Crayon on school paper: black, with brown-violet bands across it, white dots, and two black shapes where the dots stop. In the corner, in capitals, OONA. Pencilled on the wall under the frame, much later: still not right.', 10) });
  s.interact({ x: 9.6, y: Y + 1.3, z: ZB - 0.4, radius: 1.1, wide: true, prompt: 'Look at the lamps', onUse: (gm) => readCard(gm, 'Oona\'s lamp wall', 'Seven whites', 'Seven lamps, and not one of them the same white: linen, cream, a white with rose in it, a cool one, one a little green, one almost blue, and a plain one she calls ordinary. Above them, rows of swatches. Three in the rose row are crossed out.', 9) });
  s.interact({ x: XE - 0.15, y: Y + 1.5, z: 30.0, radius: 0.9, prompt: 'Look at the gin shelf', onUse: (gm) => readCard(gm, 'A shelf of gin', 'Good glasses', 'Gin is 0.18 at the hall after six, too cheap to be a present, so the glasses are the point: no two alike, and every one was given to her by someone she taught.', 8) });
  s.interact({ x: 11.3, y: Y + 1.15, z: ZI + 0.15, radius: 0.9, prompt: 'Talk to the plants', onUse: (gm) => toast(gm, 'You tell the fern about Spelt. Oona says they do better for it. The fern in the corner is enormous.', 'info', 6) });
  sitUse(s, 11.38, Y, 24.75, Math.PI / 2, 'Sit in the visitor\'s chair');

  s.finish();
  game.spawns['flat-oona'] = { frame: f, x: 9, y: Y, z: 24.3, yaw: Math.PI, pitch: -0.05 };
}

// ===================================================================================================================
// Marit's flat: deck 18, x[-12, 0] z[-27, -17.2], door on the north terrace. Her great-grandfather's place, hers for two
// years and half still his: his chair, his plate kept inside the door under hers, a cook's kitchen wall (her good knife
// on the magnet, crocks of starter with their days, jars), a table that seats eight, the thirteen cards from her wander
// year pinned in a row, and a bare wall with pencil marks where Jory has been measuring for shelves.
// ===================================================================================================================
function maritFlat(game, f) {
  const s = game.world.scope('flat-marit', f), g = s.g;
  const Y = 8, LV = 2, H = 3;
  const X0 = -11.8, X1 = -0.2, ZF = -17.2, ZK = -24.4, ZR = -26.9, XR = -7.2;
  const XW = -11.64, XE = -0.36, ZI = -17.36, ZB = -24.24, ZRI = -26.74;
  const P = { plaster: '#eadcc2', dado: '#2b5d5a', floor: '#6b4a30', teal: '#2b5d5a', tile: '#b5532e', mustard: '#d9a43a', oxblood: '#6e2a22', bed: '#e6cfa8' };
  const CLIP = [X0 - 0.05, Y - 0.2, ZK - 0.05, X1 + 0.05, Y + H + 0.1, ZF + 0.05];
  const CLIPB = [X0 - 0.05, Y - 0.2, ZR - 0.05, XR + 0.05, Y + H + 0.1, ZK + 0.3];
  const dado = { h: 0.95, mat: 'paint', tint: P.dado };
  const who = (id, tags) => ({ who: id, tags: ['flat', 'home'].concat(tags || []) });

  // ---- the shell
  floor(s, X0, ZK, X1, ZF, Y, 'planks', P.floor, { level: LV });
  floor(s, X0, ZR, XR, ZK, Y, 'planks', shadeHex(P.floor, 0.95), { level: LV });
  ceiling(s, X0, ZK, X1, ZF, Y + H, 'paint', '#efe4cc', { level: LV });
  ceiling(s, X0, ZR, XR, ZK, Y + H, 'paint', '#efe4cc', { level: LV });
  frontWall(s, { side: 'N', c: ZF, a0: X0, a1: X1, y: Y, h: H, door: -6, win: -3.7, tint: P.plaster, dado, lv: LV, doorTint: '#2b5d5a', label: 'Marit\'s door', open: true, sill: ['wood', '#7a5233'] });
  wall(s, X0 + 0.08, ZR, X0 + 0.08, ZF, Y, H, { tint: P.plaster, dado, level: LV });
  wall(s, X1 - 0.08, ZK, X1 - 0.08, ZF, Y, H, { tint: P.plaster, dado, level: LV });
  wall(s, X0, ZK + 0.08, X1, ZK + 0.08, Y, H, { tintA: P.plaster, tintB: P.bed, dado, level: LV, openings: [{ at: -10.3 - X0, w: 0.9, h: 2.1 }] });
  wall(s, X0, ZR + 0.08, XR, ZR + 0.08, Y, H, { tint: P.bed, level: LV });
  wall(s, XR - 0.08, ZR, XR - 0.08, ZK, Y, H, { tint: P.bed, level: LV });
  picRail(s, X0, ZK, X1, ZF, Y + 2.42, { band: P.mustard, level: LV });
  ceilingWorks(s, XW, ZB, XE, ZI, Y + H, { along: 'z', step: 1.6, felt: '#7a5a3a', pipeAt: 'z0', lv: LV });
  doorFrame(s, -9.85, Y, ZK + 0.08, 0.9, 2.1, 'x', { depth: 0.24, tint: '#5a3d28', level: LV });
  prop(s, 'rug', -5.6, Y, -20.9, 0, { w: 4.2, d: 2.6, a: '#7a2f2a', b: P.mustard, mat: 'motif' }, { level: LV });

  // ---- by the door: the two plates, his kept inside under hers; pegs with her coat, a kerchief and the hand lamp
  sign(s, { kind: 'plate', text: 'Marit Vell' }, -7.15, Y + 1.58, ZI - 0.004, { face: 'z', w: 0.24, h: 0.075, level: LV });
  sign(s, { kind: 'plate', text: 'Aurel Vell', lines: ['18 · 9'] }, -7.15, Y + 1.45, ZI - 0.004, { face: 'z', w: 0.26, h: 0.11, level: LV, back: '#2a2018' });
  pegs(g, 'z', ZI, -5.22, -4.52, Y + 1.72, 3, { wood: '#5a3d28' });
  g.mat('weave', '#c9552e'); g.sheet([-5.18, Y + 1.74, ZI - 0.1], [-4.86, Y + 1.74, ZI - 0.1], [-4.83, Y + 0.85, ZI - 0.16], [-5.21, Y + 0.85, ZI - 0.16], { nu: 3, nv: 4, ripple: 0.03 });
  g.mat('weave', '#2f6f8f'); g.box(-5.2, Y + 0.85, ZI - 0.17, -4.84, Y + 0.95, ZI - 0.15);
  g.mat('stripe', '#e9c46a'); g.sheet([-4.75, Y + 1.74, ZI - 0.1], [-4.6, Y + 1.74, ZI - 0.1], [-4.6, Y + 1.25, ZI - 0.12], [-4.75, Y + 1.25, ZI - 0.12], { nu: 2, nv: 3 });
  s.flush({ tier: 'd', level: LV });
  g.mat('rush', '#a8925f'); g.box(-6.5, Y, ZI - 0.75, -5.5, Y + 0.012, ZI - 0.12, { faces: 'YxXzZ' }); s.flush({ tier: 'd', level: LV });
  lamp(s, 'sconce', -8.0, Y + 2.05, ZI - 0.02, { face: 'z', K: 2700, power: 0.35, clip: CLIP, level: LV });

  // ---- the kitchen wall: cupboards, terracotta tiles, shelves of jars, the knife magnet, crocks of starter with their days
  const KZ = ZB + 0.3;
  prop(s, 'flats.cupboard', -6.4, Y, KZ, 0, { w: 1.6, body: P.teal, top: '#8a6240', sink: 0.2 }, { level: LV });
  prop(s, 'flats.cupboard', -4.9, Y, KZ, 0, { w: 1.4, body: P.teal, top: '#8a6240' }, { level: LV });
  prop(s, 'flats.cupboard', -3.4, Y, KZ, 0, { w: 1.6, body: P.teal, top: '#8a6240', hob: 0 }, { level: LV });
  prop(s, 'flats.cupboard', -2.1, Y, KZ, 0, { w: 1.0, body: P.teal, top: '#8a6240' }, { level: LV });
  prop(s, 'flats.wardrobe', -1.0, Y, ZB + 0.29, 0, { w: 0.9, d: 0.56, h: 2.1, body: P.teal, patch: '#3f7f7a' }, { level: LV });
  g.mat('tile', P.tile); g.box(-7.2, Y + 0.9, ZB, -1.55, Y + 1.58, ZB + 0.012, { faces: 'Z' }); s.flush({ tier: 's', level: LV });
  shelf(g, 'Z', ZB, -7.15, -1.6, Y + 1.66, 0.27, { lip: true, wood: '#5a3d28' }); shelf(g, 'Z', ZB, -7.15, -1.6, Y + 2.12, 0.23, { lip: true, wood: '#5a3d28' });
  s.flush({ tier: 'd', level: LV });
  lamp(s, 'strip', -7.0, Y + 1.62, ZB + 0.16, { to: [-4.15, Y + 1.62, ZB + 0.16], K: 3000, power: 0.55, clip: CLIP, level: LV });
  { const r = new Rng('maritjars'); const fills = ['#c8321e', '#e8c43a', '#6b8f4e', '#b07a3a', '#e8dcb0', '#5a3a22', '#d98a3a', '#8a2a1a', '#c9b28a', '#7a9a3a', '#f0e0c0', '#3a2a20'];
    for (const [yy, d0] of [[Y + 1.66, 0.13], [Y + 2.12, 0.11]]) {
      let x = -7.05;
      while (x < -1.75) { const rr = r.f(0.035, 0.06), hh = r.f(0.1, 0.2); if (r.chance(0.1)) { x += 0.12; continue; }
        prop(s, 'flats.jar', x + rr, yy, ZB + d0, r.f(-0.3, 0.3), { fill: r.pick(fills), lid: r.pick(['#b08a45', '#8a6d3b', '#5a3d28', '#c9552e']), lidMat: r.chance(0.3) ? 'wood' : 'cast', r: Math.round(rr * 100) / 100, h: Math.round(hh * 50) / 50, label: r.chance(0.4) ? '#efe6d2' : undefined }, { level: LV });
        x += rr * 2 + 0.03; }
    } }
  // the knife magnet and her good knife, the longest, with brass rivets
  g.mat('brushed', '#2a2826'); g.box(-5.35, Y + 1.3, ZB + 0.012, -4.45, Y + 1.34, ZB + 0.03);
  [[-5.25, 0.16, '#5a3d28'], [-5.08, 0.2, '#3a2a20'], [-4.88, 0.27, '#1f1712'], [-4.7, 0.13, '#7a5233'], [-4.56, 0.18, '#3a2a20']].forEach((k, i) => {
    g.mat('brushed', '#d6d6d2', { rough: -0.4 }); g.box(k[0] - 0.012, Y + 1.34 - k[1], ZB + 0.03, k[0] + 0.012 + (i === 2 ? 0.01 : 0), Y + 1.34, ZB + 0.034);
    g.mat('wood', k[2]); g.box(k[0] - 0.014, Y + 1.34, ZB + 0.028, k[0] + 0.014, Y + 1.46, ZB + 0.05, { bevel: 0.005 });
    if (i === 2) { g.mat('cast', '#c8a45a'); for (const yy of [1.37, 1.41, 1.45]) g.cyl(k[0], Y + yy, ZB + 0.05, 0.004, 0.003, { segs: 6 }); }
  });
  // ladles and small pans on hooks under the shelf over the hob
  g.mat('cast', '#3a3530'); g.tube([[-3.95, Y + 1.6, ZB + 0.18], [-2.75, Y + 1.6, ZB + 0.18]], 0.008, { segs: 5 });
  for (let i = 0; i < 5; i++) { const x = -3.85 + i * 0.26; g.mat('cast', '#3a3530'); g.tube([[x, Y + 1.6, ZB + 0.18], [x, Y + 1.54, ZB + 0.18]], 0.004, { segs: 3 });
    if (i % 2) { g.mat('brushed', '#c9c4bb'); g.tube([[x, Y + 1.54, ZB + 0.18], [x, Y + 1.24, ZB + 0.16]], 0.007, { segs: 5 }); g.ball(x, Y + 1.21, ZB + 0.16, 0.045, 0.03, 0.045, { segs: 10, rings: 5, top: 0.1 }); }
    else { g.mat('cast', i === 2 ? '#b0703a' : '#2a2826'); g.tube([[x, Y + 1.54, ZB + 0.18], [x, Y + 1.34, ZB + 0.15]], 0.01, { segs: 5 }); g.push(); g.move(x, Y + 1.22, ZB + 0.12); g.rotX(Math.PI / 2 - 0.1); g.cyl(0, -0.03, 0, 0.1, 0.05, { segs: 12 }); g.pop(); } }
  s.flush({ tier: 'd', level: LV });
  // crocks of starter on the worktop, each with a paper label and a day
  const CROCKS = [[-5.42, '#8a5a3c', ['The mother', 'fed today']], [-5.08, '#e8e2d4', ['Sloe', 'day 22']], [-4.74, '#5a4a3a', ['Dulse', 'day 185']], [-4.4, '#a3563a', ['Pell\'s heel', 'day 290']]];
  for (const c of CROCKS) { prop(s, 'crock', c[0], Y + 0.9, KZ - 0.04, 0, { glaze: c[1], h: 0.24, r: 0.1 }, { level: LV }); sign(s, { kind: 'notice', lines: c[2], hand: true, paper: '#f4ecd8' }, c[0], Y + 1.02, KZ + 0.065, { face: 'Z', w: 0.1, h: 0.07, level: LV, board: false }); }
  prop(s, 'flats.kettle', -3.55, Y + 0.92, KZ + 0.06, 0.3, { metal: '#b0703a', mat: 'cast' }, { level: LV });
  cups(s, [[-3.22, Y + 0.92, KZ, 'bowl', 0, { glaze: '#2a2826', lid: '#3a3530', r: 0.14 }]], LV);
  g.mat('wood', '#c9a46a'); g.box(-2.45, Y + 0.9, KZ - 0.14, -1.85, Y + 0.93, KZ + 0.16, { bevel: 0.006 });
  g.mat('leafB', '#ffffff'); for (let i = 0; i < 4; i++) g.card(-2.3 + i * 0.1, Y + 0.93, KZ, 0.1, 0.06, i * 0.7, { tilt: 1.2 });
  s.flush({ tier: 'd', level: LV });

  // ---- the table that seats eight: her table, the people who stood at her naming, and whoever she has fed lately
  prop(s, 'table', -5.6, Y, -20.9, 0, { w: 3.0, d: 0.95, wood: '#4a3020', top: '#7a5233' }, { level: LV, tier: 's' });
  const CH = [
    [-6.6, -21.65, 0, 'chair', { back: 'hoop', wood: '#3a2a20', seat: P.mustard }, 'oona'],
    [-5.6, -21.65, 0, 'flats.ladder', { wood: '#7a5233', seat: '#b89a5a', cushion: P.mustard }, 'jory'],
    [-4.6, -21.65, 0, 'chair', { back: 'slat', wood: '#6f4e33', seat: '#2f6f8f' }, 'table'],
    [-6.6, -20.15, Math.PI, 'flats.ladder', { wood: P.teal, seat: '#c9b27a' }, 'table'],
    [-5.6, -20.15, Math.PI, 'chair', { back: 'hoop', wood: '#8a6240', seat: '#c9552e' }, 'marit'],
    [-4.6, -20.15, Math.PI, 'flats.ladder', { wood: '#5a3d28', seat: '#b89a5a', cushion: '#c9552e' }, 'table'],
    [-7.5, -20.9, Math.PI / 2, 'chair', { back: 'slat', wood: '#4a3020', seat: '#6b8f4e' }, 'table'],
    [-3.7, -20.9, -Math.PI / 2, 'chair', { back: 'hoop', wood: '#9a6a42', seat: '#d9c08a' }, 'table'],
  ];
  for (const c of CH) prop(s, c[3], c[0], Y, c[1], c[2], c[4], { level: LV, spot: who(c[5], ['table']) });
  g.mat('weave', P.mustard); g.box(-6.95, Y + 0.74, -21.05, -4.25, Y + 0.745, -20.75); g.mat('weave', '#c9552e'); g.box(-6.95, Y + 0.745, -21.05, -6.85, Y + 0.746, -20.75); g.box(-4.35, Y + 0.745, -21.05, -4.25, Y + 0.746, -20.75);
  g.mat('wood', '#c9a46a'); g.box(-6.45, Y + 0.745, -21.0, -6.05, Y + 0.77, -20.75, { bevel: 0.006 }); g.mat('weave', '#efe6d2'); g.sheet([-6.42, Y + 0.86, -20.98], [-6.08, Y + 0.86, -20.98], [-6.08, Y + 0.77, -20.76], [-6.42, Y + 0.77, -20.76], { nu: 3, nv: 2, ripple: 0.01 });
  g.mat('plain', '#b07a3a'); g.ball(-6.25, Y + 0.8, -20.87, 0.14, 0.05, 0.09, { segs: 12, rings: 6, bottom: 0 });
  s.flush({ tier: 'd', level: LV });
  cups(s, [[-5.3, Y + 0.745, -20.9, 'bowl', 0, { glaze: '#e9e1cf', lid: P.teal, r: 0.12 }], [-4.8, Y + 0.745, -21.15, 'cup', 0, { glaze: '#c9552e' }], [-6.6, Y + 0.745, -20.62, 'cup', 0, { glaze: '#2f6f8f' }], [-4.55, Y + 0.745, -20.6, 'cup', 0, { glaze: P.mustard }],
    [-5.8, Y + 0.745, -21.18, 'plate', 0, { glaze: '#ece5d6' }], [-5.8, Y + 0.76, -21.18, 'plate', 0, { glaze: P.teal }], [-5.8, Y + 0.775, -21.18, 'plate', 0, { glaze: '#ece5d6' }]], LV);
  g.mat('glaze', '#e8e2d4'); g.lathe(-4.95, -20.7, [[0, Y + 0.745], [0.04, Y + 0.745], [0.05, Y + 0.82], [0.03, Y + 0.9], [0.035, Y + 0.92]], { segs: 10 }); g.mat('leafA', '#ffffff'); g.card(-4.95, Y + 0.9, -20.7, 0.18, 0.2, 0.3); g.card(-4.95, Y + 0.9, -20.7, 0.18, 0.2, 1.9); s.flush({ tier: 'd', level: LV });
  lamp(s, 'globe', -6.35, Y + 2.15, -20.9, { K: 2700, power: 0.6, drop: 0.8, r: 0.14, clip: CLIP, level: LV });
  lamp(s, 'globe', -4.85, Y + 2.15, -20.9, { K: 2700, power: 0.6, drop: 0.8, r: 0.14, clip: CLIP, level: LV });

  // ---- his chair by the window, with his side table, his lamp and a stool for his feet
  prop(s, 'rug', -1.65, Y, -18.75, 0.3, { w: 1.6, d: 1.3, a: '#33406e', b: '#c9552e', mat: 'motif' }, { level: LV });
  prop(s, 'flats.armchair', -1.55, Y, -18.35, -2.45, { cover: P.oxblood, mat: 'leather', worn: '#8a3a30', wing: true, w: 0.9 }, { level: LV, spot: who('marit', ['read']) });
  prop(s, 'stool', -2.35, Y, -19.05, 0, { wood: '#4a3020', h: 0.36 }, { level: LV, noSpots: true });
  prop(s, 'flats.lowtable', -0.8, Y, -19.2, 0, { w: 0.42, d: 0.42, h: 0.55, wood: '#4a3020' }, { level: LV });
  cups(s, [[-0.85, Y + 0.55, -19.1, 'cup', 0, { glaze: '#e8e2d4', lid: P.oxblood }]], LV);
  g.mat('leather', '#3a4a3a'); g.box(-0.95, Y + 0.55, -19.38, -0.68, Y + 0.585, -19.18, { bevel: 0.006 }); g.mat('cast', '#c8a45a'); g.tube([[-0.86, Y + 0.6, -19.32], [-0.76, Y + 0.6, -19.32]], 0.003, { segs: 4 }); g.lathe(-0.89, -19.32, [[0.025, Y + 0.598], [0.025, Y + 0.602]], { segs: 10 }); g.lathe(-0.73, -19.32, [[0.025, Y + 0.598], [0.025, Y + 0.602]], { segs: 10 });
  s.flush({ tier: 'd', level: LV });
  tableLamp(s, -0.72, Y, -17.85, { h: 1.45, r: 0.19, base: '#3a3530', baseMat: 'cast', shade: '#ecd6aa', K: 2500, power: 0.45, range: 4, clip: CLIP, level: LV });
  g.mat('cast', '#8a6d3b'); g.tube([[-4.65, Y + 2.4, ZI - 0.07], [-2.75, Y + 2.4, ZI - 0.07]], 0.011, { segs: 6 });
  curtain(g, -4.73, ZI - 0.07, -4.35, ZI - 0.07, Y + 2.37, Y + 0.86, { col: P.mustard, mat: 'stripe', folds: 5, nu: 6, rail: false });
  curtain(g, -3.05, ZI - 0.07, -2.67, ZI - 0.07, Y + 2.37, Y + 0.86, { col: P.mustard, mat: 'stripe', folds: 5, nu: 6, rail: false });
  s.flush({ tier: 'd', level: LV });
  prop(s, 'plant', -3.4, Y + 0.97, ZI - 0.1, 0, { kind: 'broad', size: 0.5, pot: P.tile }, { level: LV });
  prop(s, 'plant', -4.0, Y + 0.97, ZI - 0.1, 1, { kind: 'fine', size: 0.4, pot: P.teal, seed: 3 }, { level: LV });

  // ---- the thirteen cards, pinned in a row above a low cupboard, with a small light on them
  prop(s, 'flats.cupboard', XE - 0.3, Y, -21.7, -Math.PI / 2, { w: 2.0, body: '#4a3020', top: '#7a5233' }, { level: LV });
  books(g, 'x', XE, -22.6, -21.9, Y + 0.9, 'maritbooks', { tall: 0.24 }); s.flush({ tier: 'd', level: LV });
  cups(s, [[XE - 0.3, Y + 0.9, -21.2, 'bowl', 0, { glaze: P.mustard, lid: '#e9e2d0', r: 0.1 }], [XE - 0.3, Y + 0.9, -20.95, 'flats.jar', 0, { fill: '#5a3f52', lid: '#c8a45a', label: '#efe6d2' }]], LV);
  const CARDS = [
    ['Chervil', 'Ring 2 · 0 s', 'lamp', ['#1b1f3a', '#f2c879', '#e8743b']], ['The slow line', 'leg 1 · 3.4 s', 'cup', ['#2f3a36', '#f1e6cf', '#c9552e']], ['Sloe', 'Hedge Row · 8.7 s', 'leaf', ['#1f3324', '#e8e0c8', '#6b8f4e']],
    ['Kittiwake', 'Gull Row · 18.9 s', 'wing', ['#2f5d7a', '#f6f0e0', '#e9c46a']], ['Gloaming', 'Weather Row · 28.0 s', 'dawn', ['#123a3a', '#9fe0c8', '#3f8f7a']], ['Squall', 'Weather Row · 28.0 s', 'drop', ['#24405a', '#e8f0f4', '#7ab0d0']],
    ['Carillon', 'Bell Row · 32.6 s', 'star', ['#0e0e16', '#f2e6c8', '#6b4a5a']], ['Dulse', 'Kelp Row · 36.9 s', 'ladle', ['#5a2a1a', '#f6e6c8', '#e8a050']], ['Madder', 'Pigment Row · 33.1 s', 'drum', ['#6e1f2a', '#f6e6d0', '#d6a640']],
    ['Ochre', 'Pigment Row · 33.1 s', 'dawn', ['#141018', '#d99a86', '#5a3f52']], ['Spelt', 'Grain Row · 23.7 s', 'loaf', ['#6a4a2a', '#f6ead0', '#e9c46a']], ['The slow line', 'leg 11 · 7.6 s', 'ladle', ['#2f3a36', '#f1e6cf', '#e9c46a']],
    ['Chervil', 'Ring 2 · home', 'apple', ['#7a1f1f', '#f6ead0', '#e8c43a']]];
  CARDS.forEach((c, i) => {
    const z = -23.45 + i * 0.275 + 0.1, y = Y + 1.62 + (i % 2 ? 0.015 : -0.01);
    sign(s, { kind: 'poster', title: c[0], lines: [c[1]], motif: c[2], palette: c[3] }, XE - 0.004, y, z, { face: 'x', w: 0.2, h: 0.14, level: LV, board: false });
    g.mat('cast', '#c8a45a'); g.ball(XE - 0.012, y + 0.058, z, 0.006, 0.006, 0.006, { segs: 6, rings: 4 });
  });
  s.flush({ tier: 'd', level: LV });
  lamp(s, 'spot', -1.2, Y + 2.95, -21.65, { dir: [0.55, -0.83, 0], cone: [32, 18], K: 2900, power: 0.18, range: 4, clip: CLIP, level: LV });

  // ---- the measured wall: bare, with Jory's pencil marks for shelves, his note, a tape measure and two crates of books waiting
  { const W = onWall('X', XW), u0 = -23.6, u1 = -18.9;
    g.mat('plain', '#4a4850', { rough: 0.3 });
    for (let u = u0; u <= u1 + 0.01; u += 0.94) W.B(g, u - 0.003, Y + 0.12, 0.001, u + 0.003, Y + 2.5, 0.0025);
    for (const yy of [0.42, 0.76, 1.1, 1.44, 1.78, 2.12, 2.46]) { W.B(g, u0 - 0.06, Y + yy - 0.003, 0.001, u1 + 0.06, Y + yy + 0.003, 0.0025); for (let u = u0 + 0.1; u < u1; u += 0.94) W.B(g, u, Y + yy + 0.012, 0.001, u + 0.05, Y + yy + 0.03, 0.0025); }
    g.mat('plain', '#c9552e'); W.B(g, u0 + 0.94 * 2 - 0.25, Y + 1.1, 0.001, u0 + 0.94 * 2 + 0.25, Y + 1.104, 0.003);
    s.flush({ tier: 'd', level: LV }); }
  sign(s, { kind: 'notice', title: 'J.', lines: ['Poetry 2.4 m', 'Letters 1.1 m', 'Novels: ask her', 'Cookbooks: hers', 'Leave room for the', 'cards, she says'], hand: true }, XW + 0.004, Y + 1.5, -18.35, { face: 'X', w: 0.24, h: 0.32, level: LV, board: false });
  prop(s, 'crate', XW + 0.35, Y, -19.9, 0.1, { w: 0.6, h: 0.38, d: 0.42, wood: '#b08d5e' }, { level: LV });
  prop(s, 'crate', XW + 0.36, Y + 0.38, -19.88, -0.08, { w: 0.6, h: 0.38, d: 0.42, wood: '#a07a4a' }, { level: LV });
  s.solid(XW + 0.02, Y, -20.14, XW + 0.68, Y + 1.0, -19.64);
  books(g, 'z', -19.75, XW + 0.1, XW + 0.62, Y + 0.76, 'jorycrate', { tall: 0.24, gaps: 0 }); s.flush({ tier: 'd', level: LV });
  sign(s, { kind: 'label', text: 'J. · poetry · 1 of 6' }, XW + 0.36, Y + 0.57, -19.88 + 0.215, { face: 'Z', w: 0.3, h: 0.05, level: LV });
  g.mat('paint', '#e8c43a'); g.cyl(XW + 0.6, Y, -21.1, 0.045, 0.035, { segs: 12 }); g.mat('paint', '#f2dc6a'); g.box(XW + 0.6, Y + 0.001, -21.12, XW + 1.45, Y + 0.004, -21.1); s.flush({ tier: 'd', level: LV });

  // ---- the bedroom, through a curtained doorway: her bed, the wardrobe, her pack from the year, a lamp
  g.mat('cast', '#8a6d3b'); g.tube([[-10.45, Y + 2.2, ZB + 0.06], [-9.25, Y + 2.2, ZB + 0.06]], 0.01, { segs: 5 });
  curtain(g, -10.4, ZB + 0.06, -10.0, ZB + 0.06, Y + 2.17, Y + 0.05, { col: '#c9552e', mat: 'motif', folds: 5, nu: 6, rail: false });
  s.flush({ tier: 'd', level: LV });
  prop(s, 'flats.bed', -10.58, Y, -26.02, Math.PI / 2, { w: 1.4, l: 2.0, frame: '#4a3020', cover: P.mustard, coverMat: 'knit', board: 'panel', quilt: ['#2f6f8f', '#c9552e', '#efe6d2'], mend: '#2f6f8f' }, { level: LV, spot: who('marit', ['sleep']) });
  prop(s, 'flats.wardrobe', -7.75, Y, -25.55, -Math.PI / 2, { w: 0.9, d: 0.56, body: '#5a3d28', patch: '#7a5233' }, { level: LV });
  g.mat('leather', '#3d5a3a'); g.box(-8.65, Y, -24.95, -8.25, Y + 0.6, -24.65, { bevel: 0.06 }); g.mat('leather', '#2f4a2f'); g.box(-8.62, Y + 0.38, -24.67, -8.28, Y + 0.62, -24.6, { bevel: 0.02 });
  g.mat('weave', '#c9552e'); g.box(-8.66, Y + 0.25, -24.96, -8.24, Y + 0.3, -24.64); g.mat('weave', '#e9c46a'); g.box(-8.5, Y + 0.45, -24.61, -8.4, Y + 0.55, -24.59);
  s.flush({ tier: 'd', level: LV });
  framed(g, 'Z', ZRI, -9.0, Y + 1.5, 0.36, 0.28, [[0, 0, 1, 1, '#f6ead0'], [0.32, 0.3, 0.68, 0.7, '#e8c43a'], [0.45, 0.45, 0.55, 0.55, '#7a1f1f'], [0.47, 0.35, 0.53, 0.42, '#5a3a22'], [0.47, 0.58, 0.53, 0.65, '#5a3a22'], [0.37, 0.47, 0.44, 0.53, '#5a3a22'], [0.56, 0.47, 0.63, 0.53, '#5a3a22']], { frame: '#3a2a20' });
  s.flush({ tier: 'd', level: LV });
  lamp(s, 'sconce', XW + 0.02, Y + 1.35, -25.25, { face: 'X', K: 2500, power: 0.4, clip: CLIPB, level: LV });
  roomGlow(s, X0, Y, ZR, XR, Y + H, ZK, { sky: '#ffcf9a', ground: '#8a6a4a', power: 0.14 });
  prop(s, 'rug', -9.0, Y, -24.95, 0, { w: 2.2, d: 0.7, a: '#2f6f8f', b: P.mustard, mat: 'stripe' }, { level: LV });
  // a bedside table with Jory's letters tied up in string, and the black thread on its nail
  prop(s, 'flats.lowtable', -11.22, Y, -24.92, 0, { w: 0.4, d: 0.34, h: 0.55, wood: '#4a3020' }, { level: LV });
  tableLamp(s, -11.3, Y + 0.55, -24.98, { h: 0.34, r: 0.09, base: P.mustard, shade: '#f2dcb8', K: 2400, power: 0.22, range: 3, clip: CLIPB, level: LV });
  g.mat('paper', '#efe6d2'); g.box(-11.18, Y + 0.55, -24.95, -11.04, Y + 0.6, -24.83); g.mat('weave', '#c9552e'); g.box(-11.12, Y + 0.549, -24.955, -11.105, Y + 0.602, -24.825); g.box(-11.185, Y + 0.574, -24.955, -11.035, Y + 0.578, -24.825);
  g.mat('cast', '#3a3530'); g.cyl(-10.0, Y + 1.62, ZRI, 0.004, 0.02, { segs: 4 }); g.tube([[-10.0, Y + 1.62, ZRI + 0.015], [-10.03, Y + 1.5, ZRI + 0.02], [-9.97, Y + 1.5, ZRI + 0.02], [-10.0, Y + 1.62, ZRI + 0.015]], 0.003, { segs: 3 });
  s.flush({ tier: 'd', level: LV });
  // the wing-sleeves from Kittiwake on two pegs, for the Long Flight
  pegs(g, 'x', XR - 0.16, -25.05, -24.5, Y + 1.95, 2, { wood: '#5a3d28' });
  g.mat('weave', '#e9c46a'); g.sheet([XR - 0.24, Y + 1.95, -25.0], [XR - 0.24, Y + 1.95, -24.78], [XR - 0.26, Y + 0.85, -24.7], [XR - 0.26, Y + 0.85, -25.12], { nu: 3, nv: 5, ripple: 0.03, rippleN: 3 });
  g.mat('weave', '#2f6f8f'); g.sheet([XR - 0.25, Y + 1.95, -24.72], [XR - 0.25, Y + 1.95, -24.52], [XR - 0.28, Y + 0.9, -24.45], [XR - 0.28, Y + 0.9, -24.82], { nu: 3, nv: 5, ripple: 0.03, rippleN: 3 });
  g.mat('weave', '#c9552e'); g.box(XR - 0.27, Y + 1.4, -24.98, XR - 0.25, Y + 1.43, -24.8);
  s.flush({ tier: 'd', level: LV });
  s.interact({ x: XR - 0.3, y: Y + 1.4, z: -24.78, radius: 0.85, prompt: 'Look at the wing-sleeves', onUse: (gm) => readCard(gm, 'On two pegs', 'Sleeves from Kittiwake', 'The yellow pair is hers, remade, not new: three hundred grams of new cloth and three and a half hours of a maker\'s time, eighteen kays, more than every fare of her year put together. The blue pair is from the sleeve hire, for Jory, for the Long Flight.', 9) });

  // ---- light
  roomGlow(s, X0, Y, ZK, X1, Y + H, ZF, { sky: '#ffd8a8', ground: '#a87a50', power: 0.13 });
  s.light({ at: [-4.25, Y + 1.6, ZI - 0.3], to: [-3.15, Y + 1.6, ZI - 0.3], type: 'tube', color: warm(5200), power: 1.6, range: 6, clip: CLIP, sun: true, radius: 0.5, shadow: true });
  s.light({ at: [-3.7, Y + 1.7, ZI - 0.25], color: warm(2300), power: 0.5, range: 4, clip: CLIP, night: true, radius: 0.4 });

  // ---- people, walkways, the zone
  s.spot('work', -3.4, Y, KZ + 0.75, Math.PI, who('marit', ['cook']));
  s.spot('work', -5.0, Y, KZ + 0.75, Math.PI, who('jory', ['cook', 'wash']));
  s.spot('stand', XW + 0.85, Y, -21.3, -Math.PI / 2, who('jory', ['look', 'measure']));
  s.spot('stand', XE - 0.75, Y, -22.2, Math.PI / 2, who('oona', ['look']));
  s.path([[-6, Y, -16.7], [-6, Y, -18.2], [-7.9, Y, -19.5], [-8.3, Y, -22.6], [-9.85, Y, -23.5], [-9.85, Y, -25.0], [-9.2, Y, -25.0]], { width: 1.0 });
  s.path([[-8.3, Y, -22.6], [-4.8, Y, -22.9], [-2.6, Y, -22.9]], { width: 0.9 });
  s.path([[-6, Y, -18.2], [-2.7, Y, -18.6]], { width: 0.9 });
  s.zoneBox({ id: 'flat-marit', place: 'flat-marit', box: [X0, Y - 0.3, ZR, X1, Y + H, ZF], name: 'Marit\'s flat', sub: 'Candlewick · deck 18 · off the front terrace', ambience: 'flat', reverb: 'room', env: { exposure: 1.0, warmth: 0.35 }, headroom: 2.85 });

  // ---- things to do
  s.interact({ x: -7.15, y: Y + 1.5, z: ZI - 0.1, radius: 0.85, prompt: 'Read the plates by the door', onUse: (gm) => {
    if (!find(gm, 'great-grandfather')) readCard(gm, 'Inside the door', 'Two plates', 'A new brass plate, Marit Vell, and under it an old one worn soft at the corners: Aurel Vell, 18 · 9. When hers went on the door his came inside.', 8);
  } });
  s.interact({ x: XE - 0.1, y: Y + 1.62, z: -21.8, radius: 1.2, wide: true, prompt: 'Read the cards from her wander year', onUse: (gm) => readLines(gm, 'Thirteen fronts', [
    'Chervil, Station Ring 2: the Ledger at lamp-dawn. Sloe: the dim wood. Kittiwake: lessons in the flying hall.',
    'Gloaming: a dusk that ended on green. Squall: swell hour on the lake. Carillon: Selkie, black against the River.',
    'Dulse: noodles pulled on a third-g terrace, the farthest of the year. Madder: its first Ledger going up. Ochre: the River from behind the radiators.',
    'Spelt: Pell\'s crock room and the raft loaf. Two from the slow line. And the last, from the platform at home: an apple cut crosswise.',
    'Prints of the fronts, made from the cards she sent. Someone has added a fourteenth pin at the end of the row, with nothing on it yet.'] ) });
  s.interact({ x: XW + 0.1, y: Y + 1.4, z: -21.3, radius: 1.3, wide: true, prompt: 'Look at the pencil marks', onUse: (gm) => readCard(gm, 'The long wall', 'Measured for shelves', 'Pencil uprights every 94 centimetres and shelf lines every 34, all the way up, in Jory\'s hand. One shelf is marked in red at the height of Marit\'s eyes. Two crates of his poetry are already waiting at the bottom.', 9) });
  sitUse(s, -1.55, Y, -18.35, -2.45, 'Sit in his chair', { onSit: (gm) => toast(gm, 'The waxed cloth has gone soft in the shape of somebody else. Marit reads in it, and has never said why.', 'info', 6) });
  s.interact({ x: -4.88, y: Y + 1.3, z: ZB + 0.1, radius: 0.85, prompt: 'Look at the knives', onUse: (gm) => readCard(gm, 'On the magnet', 'Her good knife', 'Five knives, and the long one with the brass rivets is hers. It went round the raft and back in her pack with two shirts, a crock of starter and a black thread in case.', 8) });
  s.interact({ x: -4.9, y: Y + 1.02, z: KZ + 0.05, radius: 0.85, prompt: 'Look at the starter crocks', onUse: (gm) => readCard(gm, 'On the worktop', 'Four crocks', 'The mother, fed today, and three kept from the year by the days they were begun: Sloe, day 22; Dulse, day 185; Pell\'s heel, day 290. All four are registered. Marit says that never stopped anyone talking to them.', 9) });
  sitUse(s, -5.6, Y, -20.15, Math.PI, 'Sit at her table');

  s.finish();
  game.spawns['flat-marit'] = { frame: f, x: -6, y: Y, z: -18.3, yaw: 0, pitch: -0.05 };
}

// ===================================================================================================================
// The Quists' place: deck 20, x[31.2, 41] z[-2, 10], door on the east terrace. Held for seventy years, with a room let:
// heavy old furniture remade many times, a wall of small framed things, a tea table and two chairs worn to their owners,
// tomatoes and a lemon under a lamp they are proud of, and the lodgers' door with its own key hook and a card of rules.
// ===================================================================================================================
function eldersFlat(game, f) {
  const s = game.world.scope('flat-elders', f), g = s.g;
  const Y = 16, LV = 4, H = 3;
  const X0 = 31.2, X1 = 37.8, XR = 40.9, ZA = -1.9, ZZ = 9.9, ZP = 4.4;
  const XI = 31.36, XB = 37.64, ZN = -1.74, ZS = 9.74, XRI = 40.74;
  const P = { paper: '#d8bca8', dado: '#3d5a3a', floor: '#5a3d28', back: '#e6d2b0', dark: '#3a2a20', rose: '#a24a5a', green: '#6c9a4c' };
  const CLIP = [X0 - 0.05, Y - 0.2, ZA - 0.05, X1 + 0.05, Y + H + 0.1, ZZ + 0.05];
  const CLIPB = [X1 - 0.05, Y - 0.2, ZP - 0.05, XR + 0.05, Y + H + 0.1, ZZ + 0.05];
  const dado = { h: 1.0, mat: 'flute', tint: P.dado };
  const who = (id, tags) => ({ who: id, tags: ['flat', 'home', 'elders'].concat(tags || []) });

  // ---- the shell: block-printed paper above, ribbed green panelling below
  floor(s, X0, ZA, X1, ZZ, Y, 'planks', P.floor, { level: LV });
  floor(s, X1, ZA, XR, ZZ, Y, 'planks', '#6b4a30', { level: LV });
  ceiling(s, X0, ZA, XR, ZZ, Y + H, 'paint', '#ece0c8', { level: LV });
  frontWall(s, { side: 'E', c: X0, a0: ZA, a1: ZZ, y: Y, h: H, door: 4, win: 6.3, mat: 'motif', tint: P.paper, dado, lv: LV, doorTint: '#4f7a3e', label: 'the Quists\' door', open: true, sill: ['wood', '#5a3d28'], casing: P.dark });
  wall(s, X0, ZA + 0.08, XR, ZA + 0.08, Y, H, { mat: 'motif', tint: P.paper, dado, level: LV });
  wall(s, X0, ZZ - 0.08, XR, ZZ - 0.08, Y, H, { mat: 'motif', tint: P.paper, dado, level: LV });
  wall(s, XR - 0.08, ZA, XR - 0.08, ZZ, Y, H, { tint: P.back, level: LV });
  wall(s, X1 - 0.08, ZA, X1 - 0.08, ZZ, Y, H, { matA: 'plaster', matB: 'motif', tintA: P.back, tintB: P.paper, dado, level: LV, openings: [{ at: 0.6 - ZA, w: 0.9, h: 2.1 }, { at: 7.7 - ZA, w: 0.9, h: 2.1 }] });
  wall(s, X1, ZP, XR, ZP, Y, H, { tint: P.back, level: LV });
  picRail(s, X0, ZA, X1, ZZ, Y + 2.4, { band: P.rose, wood: P.dark, level: LV });
  ceilingWorks(s, XI, ZN, XB, ZS, Y + H, { along: 'x', step: 1.5, felt: '#4a3a2a', pipeAt: 'z1', wood: '#3a2a20', lv: LV });
  prop(s, 'rug', 34.5, Y, 4.6, 0, { w: 3.8, d: 2.8, a: '#7a2f2a', b: '#d9b25c', mat: 'motif' }, { level: LV });

  // ---- the far wall: tomatoes up their canes and a lemon in a pot, under the lamp they are proud of
  prop(s, 'flats.tomatoes', 37.25, Y, 3.8, -Math.PI / 2, { w: 1.6, box: '#a3563a' }, { level: LV });
  s.solid(37.03, Y, 2.98, 37.47, Y + 1.4, 4.62);
  prop(s, 'flats.lemon', 37.1, Y, 5.95, 0.4, { pot: '#2b6b69', size: 1.0 }, { level: LV });
  g.mat('brushed', '#5a5046'); g.box(36.95, Y + 2.32, 2.8, 37.35, Y + 2.36, 6.6, { bevel: 0.01 });
  for (const z of [2.9, 6.5]) g.tube([[37.15, Y + 2.36, z], [37.15, Y + H, z]], 0.005, { segs: 4 });
  s.flush({ tier: 's', level: LV });
  lamp(s, 'strip', 37.15, Y + 2.31, 2.9, { to: [37.15, Y + 2.31, 6.5], K: 4300, power: 1.05, range: 5.5, clip: CLIP, level: LV, glow: 7 });
  g.mat('brushed', '#3f7f5a'); g.lathe(36.55, 5.1, [[0.1, Y], [0.11, Y + 0.05], [0.11, Y + 0.26], [0.06, Y + 0.3]], { segs: 10 }); g.tube([[36.55, Y + 0.1, 5.1], [36.42, Y + 0.32, 5.05]], 0.012, { segs: 5 }); s.flush({ tier: 'd', level: LV });

  // ---- the lodgers' door, its key hook and the card of house rules
  doorFrame(s, X1 - 0.08, Y, 1.05, 0.9, 2.1, 'z', { depth: 0.24, tint: P.dark, level: LV });
  hang(s, { x: X1 - 0.08, y: Y, z: 0.61, w: 0.88, h: 2.06, along: 'z', dir: 1, swing: 1, tint: '#7a2f2a', style: 'panel', locked: true, lockedText: 'The lodgers\' room. Their key is on the hook, so they are out', level: LV });
  { const W = onWall('x', XB); g.mat('wood', '#6f4e33'); W.B(g, 1.68, Y + 1.36, 0, 1.98, Y + 1.54, 0.02, { bevel: 0.005 });
    g.mat('cast', '#c8a45a'); for (const z of [1.76, 1.9]) g.tube([W.P(z, Y + 1.44, 0.02), W.P(z, Y + 1.44, 0.05), W.P(z, Y + 1.47, 0.06)], 0.004, { segs: 4 });
    g.tube([W.P(1.76, Y + 1.44, 0.045), W.P(1.76, Y + 1.36, 0.05)], 0.003, { segs: 4 }); W.B(g, 1.745, Y + 1.27, 0.044, 1.775, Y + 1.36, 0.052); W.B(g, 1.73, Y + 1.2, 0.046, 1.79, Y + 1.27, 0.05);
    s.flush({ tier: 'd', level: LV }); }
  sign(s, { kind: 'label', text: 'Lodgers' }, XB - 0.004, Y + 1.58, 1.83, { face: 'x', w: 0.2, h: 0.04, level: LV });
  sign(s, { kind: 'notice', title: 'House rules', lines: ['Rent floats. This year it is', '0.05 a square metre a day.', 'Your room is 18, so 0.90.', 'The kettle is always warm.', 'Lamps fade at eleven.', 'So do we.', 'Shoes off on the rug.', 'Your key lives on its hook.', 'Knock twice if it is late,', 'once if it is soup.'] }, XB - 0.004, Y + 1.5, 2.38, { face: 'x', w: 0.3, h: 0.42, level: LV });

  // ---- the bedroom doorway, curtained
  doorFrame(s, X1 - 0.08, Y, 8.15, 0.9, 2.1, 'z', { depth: 0.24, tint: P.dark, level: LV });
  g.mat('cast', '#8a6d3b'); g.tube([[XB - 0.06, Y + 2.2, 7.55], [XB - 0.06, Y + 2.2, 8.75]], 0.01, { segs: 5 });
  curtain(g, XB - 0.06, 8.25, XB - 0.06, 8.68, Y + 2.17, Y + 0.05, { col: P.rose, mat: 'motif', folds: 5, nu: 6, rail: false });
  s.flush({ tier: 'd', level: LV });

  // ---- the tea table by the window and two chairs worn to their owners, a third for whoever comes
  prop(s, 'flats.lowtable', 32.4, Y, 6.3, 0, { w: 0.62, h: 0.55, round: true, wood: P.dark }, { level: LV });
  prop(s, 'flats.armchair', 32.4, Y, 7.32, Math.PI, { cover: '#5b4060', mat: 'weave', worn: '#8a7a90', throw: P.green, w: 0.84 }, { level: LV, spot: who('edda', ['tea', 'sew']) });
  prop(s, 'flats.armchair', 33.45, Y, 6.2, -Math.PI / 2, { cover: '#2f4f6f', mat: 'leather', worn: '#5a7a9a', wing: true, w: 0.88 }, { level: LV, spot: who('barnaby', ['tea', 'read']) });
  prop(s, 'flats.ladder', 32.4, Y, 5.3, 0, { wood: '#6f4e33', seat: '#b89a5a', cushion: P.rose }, { level: LV, spot: who('quist-guest', ['tea']) });
  cups(s, [[32.35, Y + 0.55, 6.3, 'bowl', 0, { glaze: '#e8e2d4', lid: P.rose, r: 0.08 }], [32.6, Y + 0.55, 6.15, 'cup', 0, { glaze: '#e8e2d4', lid: P.rose }], [32.2, Y + 0.55, 6.45, 'cup', 0, { glaze: '#2f6f8f' }], [32.55, Y + 0.55, 6.5, 'plate', 0, { glaze: '#ece5d6', r: 0.08 }]], LV);
  g.mat('plain', '#c99a5a'); for (let i = 0; i < 4; i++) g.cyl(32.52 + (i % 2) * 0.05, Y + 0.565, 6.47 + (i > 1 ? 0.05 : 0), 0.022, 0.008, { segs: 8 }); s.flush({ tier: 'd', level: LV });
  tableLamp(s, 33.35, Y, 7.4, { h: 1.42, r: 0.2, base: '#3a3530', baseMat: 'cast', shade: '#efd2b0', K: 2500, power: 0.45, range: 4, clip: CLIP, level: LV });
  g.mat('cast', '#8a6d3b'); g.tube([[XI + 0.07, Y + 2.4, 5.3], [XI + 0.07, Y + 2.4, 7.3]], 0.011, { segs: 6 });
  curtain(g, XI + 0.07, 5.25, XI + 0.07, 5.63, Y + 2.37, Y + 0.86, { col: '#efe6d2', mat: 'weave', folds: 6, nu: 6, rail: false });
  curtain(g, XI + 0.07, 6.97, XI + 0.07, 7.35, Y + 2.37, Y + 0.86, { col: '#efe6d2', mat: 'weave', folds: 6, nu: 6, rail: false });
  s.flush({ tier: 'd', level: LV });
  for (let i = 0; i < 3; i++) prop(s, 'plant', XI + 0.1, Y + 0.97, 5.85 + i * 0.4, i, { kind: ['fine', 'broad', 'fine'][i], size: 0.38, pot: ['#a3563a', '#e8d8bb', '#2b6b69'][i], seed: i + 10 }, { level: LV });

  // ---- the wall of small framed things over the old sideboard
  prop(s, 'flats.cupboard', 34.6, Y, ZN + 0.3, 0, { w: 2.4, body: '#4a3020', top: '#6f4e33' }, { level: LV });
  { const r = new Rng('quistframes'); let u = 32.1;
    const kinds = () => { const k = r.i(0, 4); if (k === 0) return [[0, 0, 1, 1, '#c9b090'], [0.2, 0.15, 0.8, 0.85, '#8a6a4a'], [0.35, 0.5, 0.65, 0.8, '#5a4030']];
      if (k === 1) return [[0, 0, 1, 1, '#efe6d2'], [0.3, 0.15, 0.7, 0.85, '#6c9a4c'], [0.45, 0.1, 0.55, 0.5, '#4a6a3a']];
      if (k === 2) return [[0, 0, 1, 1, r.pick(['#2f6f8f', '#7a2f2a', '#e9c46a', '#33406e'])], [0.1, 0.1, 0.9, 0.3, '#efe6d2'], [0.1, 0.4, 0.5, 0.9, r.pick(['#c9552e', '#e8c43a', '#efe6d2'])]];
      if (k === 3) return [[0, 0, 1, 1, '#f1e9d6'], [0.15, 0.6, 0.85, 0.66, '#5a5048'], [0.15, 0.45, 0.85, 0.5, '#5a5048'], [0.15, 0.3, 0.6, 0.35, '#5a5048']];
      return [[0, 0, 1, 1, '#e8d8c0'], [0.2, 0.2, 0.8, 0.8, r.pick(['#a24a5a', '#3f6f6a', '#d6a640'])], [0.4, 0.4, 0.6, 0.6, '#efe6d2']]; };
    while (u < 37.0) {
      const w = r.f(0.14, 0.32); let v = Y + 1.18 + r.f(0, 0.08);
      while (v < Y + 2.25) { const h = r.f(0.12, 0.3); if (v + h > Y + 2.32) break; framed(g, 'Z', ZN, u + w / 2, v + h / 2, w, h, kinds(), { frame: r.pick(['#b08a45', '#2a2018', '#6f4e33', '#efe6d2', '#8a6d3b']), frameMat: r.chance(0.4) ? 'cast' : 'wood', fw: r.f(0.012, 0.025), mount: r.f(0.005, 0.02) }); v += h + r.f(0.04, 0.09); }
      u += w + r.f(0.05, 0.12); if (r.chance(0.1)) s.flush({ tier: 'd', level: LV });
    }
    s.flush({ tier: 'd', level: LV }); }
  tableLamp(s, 35.6, Y + 0.9, ZN + 0.25, { h: 0.42, base: '#b08a45', baseMat: 'cast', shade: '#f2dcb8', K: 2600, power: 0.35, clip: CLIP, level: LV });
  cups(s, [[33.7, Y + 0.9, ZN + 0.3, 'crock', 0, { glaze: '#5a4a3a', h: 0.2, r: 0.08 }], [34.4, Y + 0.9, ZN + 0.3, 'bowl', 0, { glaze: '#2f6f8f', lid: '#e8e2d4', r: 0.1 }]], LV);
  g.mat('paper', '#efe6d2'); g.box(34.9, Y + 0.9, ZN + 0.2, 35.15, Y + 0.93, ZN + 0.36); g.mat('paper', '#e8d8b8'); g.box(34.92, Y + 0.93, ZN + 0.22, 35.13, Y + 0.95, ZN + 0.35); s.flush({ tier: 'd', level: LV });

  // ---- the heavy old table under its cloth, three chairs remade more than once
  prop(s, 'table', 34.6, Y, 2.0, 0, { w: 1.5, d: 0.9, wood: P.dark, top: '#5a3d28' }, { level: LV, tier: 's' });
  g.mat('motif', '#e2d2b4'); g.box(33.78, Y + 0.74, 1.47, 35.42, Y + 0.746, 2.53); g.mat('weave', '#e2d2b4'); for (const zz of [1.47, 2.53]) g.box(33.78, Y + 0.56, zz - 0.004, 35.42, Y + 0.746, zz + 0.004); for (const xx of [33.78, 35.42]) g.box(xx - 0.004, Y + 0.56, 1.47, xx + 0.004, Y + 0.746, 2.53);
  g.mat('weave', P.rose); g.box(33.78, Y + 0.6, 1.465, 35.42, Y + 0.62, 1.475); s.flush({ tier: 'd', level: LV });
  prop(s, 'flats.ladder', 34.15, Y, 1.25, 0, { wood: P.dark, seat: '#b89a5a' }, { level: LV, spot: who('edda', ['table']) });
  prop(s, 'chair', 35.05, Y, 1.25, 0, { back: 'slat', wood: '#5a3d28', seat: '#7a2f2a' }, { level: LV, spot: who('barnaby', ['table']) });
  prop(s, 'chair', 33.55, Y, 2.0, Math.PI / 2, { back: 'hoop', wood: '#6f4e33', seat: '#d9c08a' }, { level: LV, spot: who('lodger', ['table']) });
  cups(s, [[34.6, Y + 0.746, 2.0, 'bowl', 0, { glaze: '#e9e1cf', lid: '#6c9a4c', r: 0.11 }], [34.2, Y + 0.746, 1.75, 'cup', 0, { glaze: '#a24a5a' }]], LV);
  lamp(s, 'globe', 34.6, Y + 2.12, 2.0, { K: 2700, power: 0.55, drop: 0.82, r: 0.15, clip: CLIP, level: LV });

  // ---- by the door: coats, hats, his cane, the big wardrobe in the corner
  pegs(g, 'X', XI, 1.4, 2.9, Y + 1.72, 4, { wood: P.dark });
  g.mat('weave', '#5b4060'); g.sheet([XI + 0.1, Y + 1.74, 1.5], [XI + 0.1, Y + 1.74, 1.9], [XI + 0.16, Y + 0.8, 1.92], [XI + 0.16, Y + 0.8, 1.48], { nu: 3, nv: 4, ripple: 0.03 });
  g.mat('weave', '#2f4f6f'); g.sheet([XI + 0.1, Y + 1.74, 2.3], [XI + 0.1, Y + 1.74, 2.72], [XI + 0.17, Y + 0.75, 2.74], [XI + 0.17, Y + 0.75, 2.28], { nu: 3, nv: 4, ripple: 0.03 });
  g.mat('weave', '#e9c46a'); g.box(XI + 0.15, Y + 1.1, 2.38, XI + 0.175, Y + 1.25, 2.52);
  g.mat('wood', '#4a3020'); g.tube([[XI + 0.08, Y, 3.05], [XI + 0.12, Y + 0.9, 3.08], [XI + 0.12, Y + 0.95, 3.0]], 0.012, { segs: 6 });
  s.flush({ tier: 'd', level: LV });
  prop(s, 'flats.wardrobe', XI + 0.3, Y, -0.6, Math.PI / 2, { w: 1.1, d: 0.58, h: 2.05, body: '#4a3020', patch: '#7a5233' }, { level: LV });

  // ---- the kitchen on the south wall: hob and sink, the kettle that is always warm, the dresser of plates
  prop(s, 'flats.cupboard', 33.1, Y, ZS - 0.3, Math.PI, { w: 1.8, body: '#3d5a3a', top: '#6f4e33', sink: -0.45, hob: 0.45 }, { level: LV });
  g.mat('tile', '#e6dcc4'); g.box(32.2, Y + 0.9, ZS - 0.012, 34.0, Y + 1.45, ZS, { faces: 'z' }); s.flush({ tier: 's', level: LV });
  prop(s, 'flats.kettle', 32.65, Y + 0.92, ZS - 0.32, 2.6, { metal: '#b08a45', mat: 'cast' }, { level: LV });
  shelf(g, 'z', ZS, 32.2, 34.0, Y + 1.62, 0.22, { wood: P.dark }); s.flush({ tier: 'd', level: LV });
  cups(s, [[32.4, Y + 1.62, ZS - 0.1, 'flats.tin', 0, { col: '#7a2f2a', band: '#efe6d2' }], [32.65, Y + 1.62, ZS - 0.1, 'flats.tin', 0, { col: '#3d5a3a', band: '#e9e2d0' }], [32.95, Y + 1.62, ZS - 0.1, 'cup', 0, { glaze: P.rose }], [33.12, Y + 1.62, ZS - 0.1, 'cup', 0, { glaze: '#e8e2d4' }], [33.29, Y + 1.62, ZS - 0.1, 'cup', 0, { glaze: '#2f6f8f' }], [33.6, Y + 1.62, ZS - 0.1, 'flats.jar', 0, { fill: '#e8c43a', lid: '#c8a45a', label: '#efe6d2' }], [33.82, Y + 1.62, ZS - 0.1, 'flats.jar', 0, { fill: '#c8321e', lid: '#c8a45a' }]], LV);
  prop(s, 'flats.dresser', 35.4, Y, ZS - 0.23, Math.PI, { w: 1.6, body: '#3d5a3a', top: '#6f4e33', plates: ['#ece5d6', P.rose, '#2f6f8f', '#e9c46a'] }, { level: LV });
  lamp(s, 'sconce', 34.2, Y + 2.1, ZS - 0.02, { face: 'z', K: 2700, power: 0.35, clip: CLIP, level: LV });

  // ---- the bedroom: their bed, a chest at its foot, two pairs of slippers, a lamp
  prop(s, 'rug', 39.2, Y, 7.4, 0, { w: 2.0, d: 0.7, a: P.green, b: '#e9c46a' }, { level: LV });
  prop(s, 'flats.bed', 39.68, Y, 6.25, -Math.PI / 2, { w: 1.4, l: 2.0, frame: P.dark, cover: P.green, coverMat: 'knit', board: 'panel', quilt: [P.rose, '#e9c46a', '#2f6f8f', '#efe6d2', '#7a2f2a'], mend: '#efe6d2' }, { level: LV, noSpots: true });
  s.spot('bed', 39.55, Y + 0.5, 5.9, -Math.PI / 2, who('edda', ['sleep'])); s.spot('bed', 39.55, Y + 0.5, 6.6, -Math.PI / 2, who('barnaby', ['sleep']));
  g.mat('wood', '#6f4e33'); g.box(37.95, Y, 5.85, 38.5, Y + 0.45, 6.65, { bevel: 0.015 }); g.mat('cast', '#c8a45a'); g.box(38.2, Y + 0.32, 5.84, 38.26, Y + 0.38, 5.85); s.flush({ tier: 's', level: LV }); s.solid(37.95, Y, 5.85, 38.5, Y + 0.45, 6.65);
  g.mat('felt', '#7a2f2a'); g.box(39.0, Y, 7.02, 39.08, Y + 0.05, 7.2, { bevel: 0.02 }); g.box(39.12, Y, 7.03, 39.2, Y + 0.05, 7.21, { bevel: 0.02 }); g.mat('felt', '#33406e'); g.box(39.6, Y, 7.05, 39.69, Y + 0.05, 7.24, { bevel: 0.02 }); g.box(39.73, Y, 7.02, 39.82, Y + 0.05, 7.21, { bevel: 0.02 }); s.flush({ tier: 'd', level: LV });
  prop(s, 'flats.wardrobe', 38.4, Y, ZS - 0.29, Math.PI, { w: 0.9, d: 0.56, body: P.dark, patch: '#8a6240' }, { level: LV });
  prop(s, 'flats.cupboard', 40.05, Y, ZS - 0.3, Math.PI, { w: 1.0, d: 0.5, body: '#4a3020', top: '#6f4e33' }, { level: LV });
  tableLamp(s, 40.3, Y + 0.9, ZS - 0.28, { h: 0.4, base: P.rose, shade: '#f2dcb8', K: 2400, power: 0.25, range: 3, clip: CLIPB, level: LV });
  cups(s, [[39.85, Y + 0.9, ZS - 0.3, 'flats.jar', 0, { fill: '#e6eef0', lid: '#b08a45', r: 0.05, h: 0.18 }], [39.65, Y + 0.9, ZS - 0.25, 'flats.glass', 0, { tumbler: true }]], LV);
  framed(g, 'z', ZS, 40.05, Y + 1.55, 0.3, 0.38, [[0, 0, 1, 1, '#c9b090'], [0.3, 0.2, 0.7, 0.85, '#6a5040']], { frame: '#2a2018' }); s.flush({ tier: 'd', level: LV });
  framed(g, 'x', XRI, 6.25, Y + 1.72, 0.5, 0.36, [[0, 0, 1, 1, '#c9b090'], [0.25, 0.15, 0.45, 0.85, '#5a4030'], [0.55, 0.15, 0.75, 0.82, '#6a5040'], [0.1, 0.05, 0.9, 0.12, '#e8d8c0']], { frame: '#b08a45', frameMat: 'cast' }); s.flush({ tier: 'd', level: LV });
  lamp(s, 'sconce', XRI - 0.02, Y + 1.3, 5.3, { face: 'x', K: 2500, power: 0.4, clip: CLIPB, level: LV });
  roomGlow(s, X1, Y, ZP, XR, Y + H, ZZ, { sky: '#ffcf9a', ground: '#8a6a4a', power: 0.12 });

  // ---- light
  roomGlow(s, X0, Y, ZA, X1, Y + H, ZZ, { sky: '#ffd8a8', ground: '#a87a50', power: 0.13 });
  s.light({ at: [XI + 0.3, Y + 1.6, 5.75], to: [XI + 0.3, Y + 1.6, 6.85], type: 'tube', color: warm(5200), power: 1.6, range: 6, clip: CLIP, sun: true, radius: 0.5, shadow: true });
  s.light({ at: [XI + 0.25, Y + 1.7, 6.3], color: warm(2300), power: 0.5, range: 4, clip: CLIP, night: true, radius: 0.4 });

  // ---- people, walkways, the zone
  s.spot('work', 32.65, Y, ZS - 0.95, Math.PI, who('edda', ['cook', 'tea']));
  s.spot('work', 36.45, Y, 3.8, Math.PI / 2, who('barnaby', ['garden', 'water']));
  s.spot('stand', 34.6, Y, ZN + 1.05, Math.PI, who('barnaby', ['look']));
  s.path([[30.7, Y, 4], [32.0, Y, 4.0], [34.2, Y, 4.3], [36.3, Y, 4.3]], { width: 1.0 });
  s.path([[34.2, Y, 4.3], [35.6, Y, 7.4], [36.9, Y, 8.15], [38.4, Y, 8.15], [38.9, Y, 7.4]], { width: 0.9 });
  s.path([[34.2, Y, 4.3], [33.3, Y, 8.6]], { width: 0.9 });
  s.path([[36.3, Y, 4.3], [36.7, Y, 1.05], [38.6, Y, 1.05]], { width: 0.9 });
  s.zoneBox({ id: 'flat-elders', place: 'flat-elders', box: [X0, Y - 0.3, ZA, XR, Y + H, ZZ], name: 'The Quists\' place', sub: 'Candlewick · deck 20 · on the spinward terrace', ambience: 'flat', reverb: 'felt', env: { exposure: 1.0, warmth: 0.35 }, headroom: 2.85 });
  let steam = null;
  s.trigger({ box: [X0, Y - 0.3, ZA, X1, Y + H, ZZ], onEnter(gm) { if (!steam && gm.loopAt && gm.audio) steam = gm.loopAt('steam', f, 32.65, Y + 1.1, ZS - 0.32, { vol: 0.08, radius: 3 }); } });

  // ---- things to do
  s.interact({ x: XB - 0.1, y: Y + 1.5, z: 2.38, radius: 0.85, prompt: 'Read the house rules', onUse: async (gm) => {
    await readLines(gm, 'House rules, in Edda\'s hand', [
      'Rent floats. This year it is 0.05 a square metre a day. Your room is eighteen metres, so 0.90.',
      'The kettle is always warm. Use it.', 'Lamps fade at eleven. So do we.', 'Shoes off on the rug. Not the floor, the rug.',
      'Your key lives on its hook. When it is on the hook you are out, and we will not worry.', 'Knock twice if it is late, once if it is soup.']);
    find(gm, 'rooms-let');
  } });
  s.interact({ x: XB - 0.1, y: Y + 1.42, z: 1.83, radius: 0.7, prompt: 'Look at the key hook', onUse: (gm) => toast(gm, 'One key on the hook, on a brass tag stamped LODGERS. They are out. The other hook is for a key that went with the last pair, eleven years ago, and nobody has the heart to take it down.', 'info', 8) });
  s.interact({ x: 34.6, y: Y + 1.75, z: ZN + 0.2, radius: 1.5, wide: true, prompt: 'Look at the small framed things', onUse: (gm) => readCard(gm, 'Seventy years on a wall', 'Small framed things', 'A Ledger slip from the year they took the place, with both their names. A naming card for every grandchild and great-grandchild. A pressed leaf from the Hollow. A scrap of coat lining. A card from Sorrel, sent the week they married, of the two of them laughing in a glide car.', 10) });
  s.interact({ x: 36.9, y: Y + 1.2, z: 4.8, radius: 1.2, wide: true, prompt: 'Look at the tomatoes', onUse: (gm) => readCard(gm, 'Under Barnaby\'s lamp', 'Eleven tomatoes and a lemon', 'A tomato is half a kay, jewellery at the greengrocer\'s, so these each have a name. The lemon has had one fruit in four years and it was cut into nine pieces at a naming.', 9) });
  sitUse(s, 32.4, Y, 5.3, 0, 'Sit down for tea', { onSit: (gm) => toast(gm, 'Edda pours without asking. Where have you slept? Have you eaten? Then have a biscuit anyway.', 'info', 6) });
  s.interact({ x: 32.65, y: Y + 1.05, z: ZS - 0.32, radius: 0.8, prompt: 'Feel the kettle', onUse: (gm) => toast(gm, 'Warm. It sits all day on the warming plate, which runs off the 65 degree loop and costs nothing, and Edda says that is what a kettle is for.', 'info', 6) });

  s.finish();
  game.spawns['flat-elders'] = { frame: f, x: 32.2, y: Y, z: 4, yaw: Math.PI / 2, pitch: -0.05 };
}
