// Shared furniture and fittings for the five flats round Wick Court (flats.js): beds and bunks, chairs worn to their owners,
// dressers and wardrobes remade many times, kettles, jars, tins, books, framed things, curtains, table lamps, light panels,
// and the front wall each flat builds behind the terrace's doorway and window.
import { wall, lamp, warm } from '../world/kit.js';
import { defineProp, prop } from '../world/props.js';
import { door } from '../world/doors.js';
import { Rng, hashStr, shadeHex, mixHex } from '../core/util.js';

export const flatParts = true;

// ---------------------------------------------------------------------------------------------------------------
// Small helpers for drawing against a wall. face: the way the thing looks out of the wall ('x' | 'X' | 'z' | 'Z');
// c: the wall surface; u runs along the wall (x for z faces, z for x faces); w runs out of the wall into the room.
// ---------------------------------------------------------------------------------------------------------------
export function onWall(face, c) {
  const n = face === 'X' || face === 'Z' ? 1 : -1, alongX = face === 'z' || face === 'Z';
  const P = (u, y, w) => alongX ? [u, y, c + n * w] : [c + n * w, y, u];
  const B = (g, u0, y0, w0, u1, y1, w1, o) => { const a = P(u0, y0, w0), b = P(u1, y1, w1); g.box(a[0], a[1], a[2], b[0], b[1], b[2], o); };
  return { n, alongX, P, B };
}
// The yaw (prop convention) of something whose front looks the way `face` says.
export function faceYaw(face) { return face === 'Z' ? 0 : face === 'z' ? Math.PI : face === 'X' ? Math.PI / 2 : -Math.PI / 2; }

// A seat the player can take: (x, y, z) the floor under it, yaw the way the sitter faces (prop convention).
export function sitUse(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + 0.7, z, radius: o.radius || 1.0,
    prompt: (game) => game.player && game.player.seat ? 'Stand up' : label,
    onUse(game) {
      const p = game.player; if (!p || !p.sit) return;
      if (p.seat) { p.stand(); return; }
      p.sit({ x, y, z, yaw: Math.PI - yaw, eye: o.eye || 1.15 }); p.yaw = Math.PI - yaw; p.pitch = o.pitch || -0.05;
      if (o.onSit) o.onSit(game);
    } });
}
// Words on the screen, safely.
export function readCard(game, kicker, title, text, dur) { if (game.ui) game.ui.card({ kicker, title, text, dur: dur || 8 }); }
export async function readLines(game, who, lines) {
  if (!game.ui) return;
  game.busy = (game.busy || 0) + 1;
  try { await game.ui.say(who, lines); } finally { game.busy--; }
}
export function find(game, id) { return !!(game.journal && game.journal.find && game.journal.find(id)); }
export function toast(game, text, kind, dur) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: dur || 5 }); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------

// A bed, head toward -z. p: { w, l, frame, sheet, cover, coverMat, pillow, board: 'panel' | 'rail', quilt: [colours] folded at the foot, mend }
defineProp('flats.bed', (g, p) => {
  const w = p.w || 1.0, l = p.l || 2.0, fr = p.frame || '#6b4a2f', hw = w / 2, hl = l / 2;
  g.mat('wood', fr, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (hw - 0.035) - 0.03, 0, sz * (hl - 0.035) - 0.03, sx * (hw - 0.035) + 0.03, 0.34, sz * (hl - 0.035) + 0.03, { bevel: 0.006 });
  g.box(-hw, 0.2, -hl, -hw + 0.04, 0.34, hl, { bevel: 0.006 }); g.box(hw - 0.04, 0.2, -hl, hw, 0.34, hl, { bevel: 0.006 });
  if (p.board === 'rail') {
    for (const sx of [-1, 1]) { g.lathe(sx * (hw - 0.02), -hl - 0.02, [[0.03, 0], [0.025, 0.4], [0.022, 1.0], [0.035, 1.04], [0.0, 1.07]], { segs: 8 }); g.lathe(sx * (hw - 0.02), hl + 0.01, [[0.03, 0], [0.025, 0.4], [0.022, 0.68], [0.035, 0.71], [0.0, 0.74]], { segs: 8 }); }
    for (const yy of [0.62, 0.96]) g.tube([[-hw + 0.02, yy, -hl - 0.02], [hw - 0.02, yy, -hl - 0.02]], 0.016, { segs: 6 });
    for (let i = 1; i < 6; i++) { const x = -hw + w * i / 6; g.tube([[x, 0.62, -hl - 0.02], [x, 0.96, -hl - 0.02]], 0.009, { segs: 5 }); }
    g.tube([[-hw + 0.02, 0.66, hl + 0.01], [hw - 0.02, 0.66, hl + 0.01]], 0.016, { segs: 6 });
  } else {
    g.box(-hw - 0.03, 0, -hl - 0.05, hw + 0.03, 0.98, -hl + 0.005, { bevel: 0.012 });
    g.mat('wood', shadeHex(fr, 1.18)); g.box(-hw + 0.08, 0.5, -hl + 0.005, hw - 0.08, 0.88, -hl + 0.02, { bevel: 0.008 });
    g.mat('wood', fr); g.box(-hw - 0.03, 0, hl - 0.01, hw + 0.03, 0.52, hl + 0.04, { bevel: 0.01 });
  }
  // mattress, sheet, pillows
  g.mat('weave', p.sheet || '#ece4d2'); g.box(-hw + 0.03, 0.32, -hl + 0.03, hw - 0.03, 0.5, hl - 0.04, { bevel: 0.04 });
  g.mat('weave', p.pillow || '#f3eee3');
  if (w > 1.25) { g.box(-hw + 0.07, 0.49, -hl + 0.06, -0.03, 0.62, -hl + 0.46, { bevel: 0.05 }); g.box(0.03, 0.49, -hl + 0.06, hw - 0.07, 0.6, -hl + 0.45, { bevel: 0.05 }); }
  else g.box(-hw + 0.08, 0.49, -hl + 0.06, hw - 0.08, 0.61, -hl + 0.44, { bevel: 0.05 });
  // the cover: over the top, down the sides, the sheet turned back over it
  const cv = p.cover || '#8a2f3c', cm = p.coverMat || 'knit';
  g.mat(cm, cv); g.box(-hw + 0.005, 0.5, -hl + 0.55, hw - 0.005, 0.53, hl - 0.03, { bevel: 0.012 });
  g.box(-hw - 0.012, 0.25, -hl + 0.55, -hw + 0.005, 0.52, hl - 0.03); g.box(hw - 0.005, 0.25, -hl + 0.55, hw + 0.012, 0.52, hl - 0.03);
  g.box(-hw - 0.012, 0.25, hl - 0.045, hw + 0.012, 0.52, hl - 0.03);
  g.mat('weave', p.sheet || '#ece4d2'); g.box(-hw + 0.0, 0.505, -hl + 0.5, hw - 0.0, 0.545, -hl + 0.64, { bevel: 0.015 });
  // a folded quilt of many mends at the foot
  if (p.quilt) {
    const q = p.quilt, r = new Rng(hashStr('quilt' + q.join())); const z0 = hl - 0.6, z1 = hl - 0.1, x0 = -hw + 0.07, x1 = hw - 0.07;
    for (let i = 0; i < 4; i++) { g.mat('weave', q[i % q.length]); g.box(x0 + i * 0.004, 0.53 + i * 0.032, z0 + i * 0.006, x1 - i * 0.004, 0.53 + (i + 1) * 0.032, z1 - i * 0.005, { bevel: 0.012 }); }
    const yt = 0.53 + 4 * 0.032, nx = 5, nz = 3;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      g.mat(r.chance(0.3) ? 'motif' : r.chance(0.5) ? 'stripe' : 'weave', q[r.i(0, q.length - 1)]);
      const a0 = x0 + 0.02 + (x1 - x0 - 0.04) * i / nx, a1 = x0 + 0.02 + (x1 - x0 - 0.04) * (i + 1) / nx, b0 = z0 + 0.02 + (z1 - z0 - 0.04) * j / nz, b1 = z0 + 0.02 + (z1 - z0 - 0.04) * (j + 1) / nz;
      g.box(a0 + 0.003, yt, b0 + 0.003, a1 - 0.003, yt + 0.004, b1 - 0.003, { faces: 'Y' });
    }
    g.mat('weave', p.mend || '#e9c46a');
    for (let k = 0; k < 7; k++) { const x = r.f(x0 + 0.05, x1 - 0.05), z = r.f(z0 + 0.05, z1 - 0.05); g.box(x - 0.035, yt + 0.004, z - 0.003, x + 0.035, yt + 0.007, z + 0.003, { faces: 'Y' }); g.box(x - 0.003, yt + 0.004, z - 0.03, x + 0.003, yt + 0.007, z + 0.03, { faces: 'Y' }); }
  }
  return { solid: [[-hw - 0.03, 0, -hl - 0.05, hw + 0.03, 0.55, hl + 0.04]], spots: [{ type: 'bed', x: 0, y: 0.5, z: 0.12, yaw: 0 }], tier: 's' };
});

// Two bunks, long along x, open toward +z, with curtains drawn half across. p: { frame, a, b (curtains), ca, cb (covers) }
defineProp('flats.bunk', (g, p) => {
  const l = 2.0, w = 0.92, hl = l / 2, hw = w / 2, fr = p.frame || '#3f6f7a';
  g.mat('paint', fr, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * hl - 0.03 - sx * 0.03, 0, sz * hw - 0.03 - sz * 0.03, sx * hl + 0.03 - sx * 0.03, 1.92, sz * hw + 0.03 - sz * 0.03, { bevel: 0.008 });
  for (const yy of [0.22, 1.18]) { g.box(-hl, yy, -hw, hl, yy + 0.12, -hw + 0.04, { bevel: 0.006 }); g.box(-hl, yy, hw - 0.04, hl, yy + 0.12, hw, { bevel: 0.006 }); g.box(-hl, yy, -hw, -hl + 0.04, yy + 0.12, hw); g.box(hl - 0.04, yy, -hw, hl, yy + 0.12, hw); }
  g.box(-hl, 1.62, hw - 0.03, 0.3, 1.68, hw + 0.01, { bevel: 0.008 });                       // guard rail on the top bunk
  g.box(-hl, 0.98, -hw, -hl + 0.04, 1.85, hw); g.box(-hl, 0.98, -hw + 0.0, hl, 1.85, -hw + 0.03);   // head board and back of the top bunk
  // ladder at the foot end
  g.mat('wood', '#b08d5e'); for (let i = 0; i < 5; i++) g.tube([[hl - 0.06, 0.3 + i * 0.3, hw + 0.06], [hl - 0.06, 0.3 + i * 0.3, hw - 0.3]], 0.016, { segs: 6 });
  // mattresses and covers
  for (const [yy, cv] of [[0.32, p.ca || '#e9c46a'], [1.28, p.cb || '#2f6f8f']]) {
    g.mat('weave', '#ece4d2'); g.box(-hl + 0.04, yy, -hw + 0.04, hl - 0.04, yy + 0.15, hw - 0.04, { bevel: 0.035 });
    g.mat('weave', '#f3eee3'); g.box(-hl + 0.07, yy + 0.15, -hw + 0.1, -hl + 0.45, yy + 0.25, hw - 0.1, { bevel: 0.04 });
    g.mat('knit', cv); g.box(-hl + 0.5, yy + 0.15, -hw + 0.03, hl - 0.04, yy + 0.18, hw - 0.03, { bevel: 0.012 }); g.box(-hl + 0.5, yy - 0.04, hw - 0.03, hl - 0.04, yy + 0.17, hw - 0.015);
  }
  // curtains on a rail along the open side
  g.mat('stripe', p.a || '#c9552e'); g.sheet([-hl + 0.05, 1.12, hw + 0.03], [-hl + 0.75, 1.12, hw + 0.03], [-hl + 0.75, 0.36, hw + 0.03], [-hl + 0.05, 0.36, hw + 0.03], { nu: 8, nv: 2, ripple: 0.03, rippleN: 7 });
  g.mat('stripe', p.b || '#6b8f4e'); g.sheet([-hl + 0.05, 1.86, hw + 0.04], [-hl + 0.55, 1.86, hw + 0.04], [-hl + 0.55, 1.3, hw + 0.04], [-hl + 0.05, 1.3, hw + 0.04], { nu: 6, nv: 2, ripple: 0.03, rippleN: 6 });
  g.sheet([hl - 0.65, 1.86, hw + 0.04], [hl - 0.12, 1.86, hw + 0.04], [hl - 0.12, 1.3, hw + 0.04], [hl - 0.65, 1.3, hw + 0.04], { nu: 6, nv: 2, ripple: 0.03, rippleN: 6 });
  g.mat('cast', '#8a6d3b'); g.tube([[-hl, 1.14, hw + 0.03], [hl, 1.14, hw + 0.03]], 0.008, { segs: 5 }); g.tube([[-hl, 1.88, hw + 0.04], [hl, 1.88, hw + 0.04]], 0.008, { segs: 5 });
  return { solid: [[-hl, 0, -hw, hl, 1.92, hw]], spots: [{ type: 'bed', x: 0.15, y: 0.47, z: 0, yaw: Math.PI / 2 }, { type: 'bed', x: 0.15, y: 1.43, z: 0, yaw: Math.PI / 2 }], tier: 's' };
});

// An upholstered armchair worn to its owner. p: { cover, mat, wood, worn (seat colour), throw, w, wing }
defineProp('flats.armchair', (g, p) => {
  const w = p.w || 0.86, hw = w / 2, c = p.cover || '#6e2a22', m = p.mat || 'leather';
  g.mat('wood', p.wood || '#3e2a1c'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.lathe(sx * (hw - 0.08), sz * 0.3, [[0.03, 0], [0.024, 0.05], [0.036, 0.1], [0.0, 0.11]], { segs: 8 });
  g.mat(m, c);
  g.box(-hw, 0.1, -0.38, hw, 0.38, 0.4, { bevel: 0.04 });
  g.box(-hw, 0.36, -0.36, -hw + 0.17, 0.66, 0.4, { bevel: 0.07 }); g.box(hw - 0.17, 0.36, -0.36, hw, 0.66, 0.4, { bevel: 0.07 });
  g.box(-hw + 0.02, 0.36, -0.42, hw - 0.02, 1.02, -0.22, { bevel: 0.08 });
  if (p.wing) { g.box(-hw, 0.62, -0.42, -hw + 0.11, 1.0, -0.06, { bevel: 0.05 }); g.box(hw - 0.11, 0.62, -0.42, hw, 1.0, -0.06, { bevel: 0.05 }); }
  g.mat(m, p.worn || shadeHex(c, 1.2)); g.box(-hw + 0.17, 0.37, -0.23, hw - 0.17, 0.48, 0.39, { bevel: 0.045 });
  g.box(-hw + 0.18, 0.47, -0.25, hw - 0.18, 0.92, -0.13, { bevel: 0.05 });
  if (p.throw) { g.mat('knit', p.throw); g.sheet([-hw + 0.1, 1.04, -0.36], [hw - 0.25, 1.04, -0.36], [hw - 0.25, 0.42, -0.46], [-hw + 0.1, 0.42, -0.46], { nu: 5, nv: 3, ripple: 0.02, rippleN: 4 }); g.sheet([-hw + 0.1, 1.04, -0.36], [hw - 0.25, 1.04, -0.36], [hw - 0.25, 0.84, -0.18], [-hw + 0.1, 0.84, -0.18], { nu: 5, nv: 2 }); }
  return { solid: [[-hw, 0, -0.42, hw, 0.62, 0.4]], spots: [{ type: 'sit', x: 0, y: 0.47, z: 0.1, yaw: 0 }], tier: 's' };
});

// A sofa remade more than once: one cushion in a different cloth from the others. p: { w, cover, mat, odd (the odd cushion), n, throw, wood }
defineProp('flats.sofa', (g, p) => {
  const w = p.w || 1.9, hw = w / 2, c = p.cover || '#7a5a3a', m = p.mat || 'weave', n = p.n || 3, iw = (w - 0.36) / n;
  g.mat('wood', p.wood || '#3e2a1c'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.lathe(sx * (hw - 0.08), sz * 0.32, [[0.03, 0], [0.024, 0.05], [0.036, 0.1], [0, 0.11]], { segs: 8 });
  g.mat(m, c);
  g.box(-hw, 0.1, -0.42, hw, 0.36, 0.42, { bevel: 0.04 });
  g.box(-hw, 0.34, -0.4, -hw + 0.18, 0.64, 0.42, { bevel: 0.07 }); g.box(hw - 0.18, 0.34, -0.4, hw, 0.64, 0.42, { bevel: 0.07 });
  g.box(-hw + 0.02, 0.34, -0.45, hw - 0.02, 0.96, -0.24, { bevel: 0.08 });
  const spots = [];
  for (let i = 0; i < n; i++) {
    const x0 = -hw + 0.18 + i * iw, odd = p.odd && i === n - 1;
    g.mat(odd ? 'motif' : m, odd ? p.odd : shadeHex(c, i % 2 ? 1.08 : 1.16)); g.box(x0 + 0.01, 0.35, -0.24, x0 + iw - 0.01, 0.47, 0.41, { bevel: 0.045 });
    g.box(x0 + 0.02, 0.46, -0.26, x0 + iw - 0.02, 0.88, -0.12, { bevel: 0.05 });
    spots.push({ type: 'sit', x: x0 + iw / 2, y: 0.47, z: 0.1, yaw: 0 });
  }
  if (p.throw) { g.mat('knit', p.throw); g.sheet([hw - 0.2, 0.66, -0.38], [hw - 0.2, 0.66, 0.4], [hw + 0.03, 0.3, 0.4], [hw + 0.03, 0.3, -0.38], { nu: 2, nv: 4, ripple: 0.02 }); }
  return { solid: [[-hw, 0, -0.45, hw, 0.6, 0.42]], spots, tier: 's' };
});

// A ladder-back chair with a rush seat. p: { wood, seat, cushion }
defineProp('flats.ladder', (g, p) => {
  g.mat('wood', p.wood || '#7a5233', { rough: -0.04 });
  for (const sx of [-1, 1]) {
    g.tube([[sx * 0.2, 0, 0.19], [sx * 0.2, 0.45, 0.19]], 0.018, { segs: 6 });
    g.tube([[sx * 0.19, 0, -0.19], [sx * 0.19, 0.45, -0.2], [sx * 0.18, 1.0, -0.24]], 0.02, { segs: 6 });
    g.ball(sx * 0.18, 1.02, -0.24, 0.026, 0.03, 0.026, { segs: 6, rings: 4 });
    g.tube([[sx * 0.2, 0.17, 0.19], [sx * 0.19, 0.17, -0.19]], 0.01, { segs: 4, caps: false });
  }
  g.tube([[-0.2, 0.24, 0.19], [0.2, 0.24, 0.19]], 0.01, { segs: 4, caps: false }); g.tube([[-0.19, 0.2, -0.19], [0.19, 0.2, -0.19]], 0.01, { segs: 4, caps: false });
  for (const yy of [0.62, 0.76, 0.9]) g.box(-0.17, yy - 0.03, -0.236 - (yy - 0.45) * 0.07, 0.17, yy + 0.03, -0.216 - (yy - 0.45) * 0.07, { bevel: 0.006 });
  g.box(-0.215, 0.42, -0.21, 0.215, 0.45, 0.21, { bevel: 0.006 });
  g.mat('rush', p.seat || '#b89a5a'); g.box(-0.195, 0.43, -0.19, 0.195, 0.466, 0.2, { bevel: 0.01 });
  if (p.cushion) { g.mat('motif', p.cushion); g.box(-0.18, 0.462, -0.17, 0.18, 0.5, 0.18, { bevel: 0.02 }); }
  return { posts: [[0, 0, 0.2, 0, 0.47]], spots: [{ type: 'sit', x: 0, y: p.cushion ? 0.5 : 0.47, z: 0.02, yaw: 0 }] };
});

// A dresser: cupboards below, open shelves above with plates leaning on the rails. p: { w, d, h, body, top, plates: [colours], back }
defineProp('flats.dresser', (g, p) => {
  const w = p.w || 1.4, d = p.d || 0.46, H = p.h || 2.0, hw = w / 2, hd = d / 2, body = p.body || '#3d5a4a', top = p.top || '#8a6240';
  g.mat('paint', shadeHex(body, 0.6)); g.box(-hw + 0.02, 0, -hd + 0.02, hw - 0.02, 0.07, hd - 0.04);
  g.mat('paint', body); g.box(-hw, 0.07, -hd, hw, 0.88, hd - 0.01, { aoBottom: 0.6 });
  const n = Math.max(2, Math.round(w / 0.48));
  g.mat('paint', shadeHex(body, 1.15));
  for (let i = 0; i < n; i++) { const a0 = -hw + 0.04 + (w - 0.08) * i / n, a1 = -hw + 0.04 + (w - 0.08) * (i + 1) / n; g.box(a0 + 0.015, 0.12, hd - 0.01, a1 - 0.015, 0.6, hd + 0.008, { bevel: 0.008 }); g.box(a0 + 0.015, 0.66, hd - 0.01, a1 - 0.015, 0.83, hd + 0.008, { bevel: 0.008 }); }
  g.mat('cast', '#c8a45a'); for (let i = 0; i < n; i++) { const a = -hw + 0.04 + (w - 0.08) * (i + 0.5) / n; g.ball(a, 0.745, hd + 0.02, 0.016, 0.016, 0.016, { segs: 6, rings: 4 }); g.ball(a + (i % 2 ? -1 : 1) * 0.08, 0.4, hd + 0.02, 0.016, 0.016, 0.016, { segs: 6, rings: 4 }); }
  g.mat('wood', top, { rough: -0.08 }); g.box(-hw - 0.02, 0.88, -hd, hw + 0.02, 0.92, hd + 0.025, { bevel: 0.01 });
  // the rack
  const bd = 0.26; g.mat('paint', body);
  g.box(-hw, 0.92, -hd, -hw + 0.03, H, -hd + bd); g.box(hw - 0.03, 0.92, -hd, hw, H, -hd + bd);
  g.mat('paint', p.back || shadeHex(body, 0.78)); g.box(-hw + 0.03, 0.92, -hd, hw - 0.03, H, -hd + 0.012, { faces: 'Z' });
  g.mat('paint', body); g.box(-hw - 0.03, H, -hd, hw + 0.03, H + 0.06, -hd + bd + 0.04, { bevel: 0.01 });
  const ys = [1.3, 1.66];
  for (const y of ys) { g.box(-hw + 0.03, y - 0.02, -hd + 0.012, hw - 0.03, y, -hd + bd, { faces: 'yYZ' }); g.mat('cast', '#8a6d3b'); g.tube([[-hw + 0.03, y + 0.07, -hd + bd - 0.02], [hw - 0.03, y + 0.07, -hd + bd - 0.02]], 0.006, { segs: 4, caps: false }); g.mat('paint', body); }
  const pc = p.plates || ['#ece5d6', '#2f6f8f', '#e9c46a'];
  const yp = [0.92].concat(ys); let k = 0;
  for (const y of yp) {
    const np = Math.max(2, Math.floor((w - 0.1) / 0.24));
    for (let i = 0; i < np; i++) {
      const x = -hw + 0.05 + (w - 0.1) * (i + 0.5) / np, r = 0.1 + (k % 3) * 0.01;
      g.push(); g.move(x, y + r + 0.005, -hd + 0.05); g.rotX(Math.PI / 2 - 0.2);
      g.mat('glaze', pc[k % pc.length]); g.lathe(0, 0, [[0, 0], [r * 0.6, 0], [r, 0.014], [r * 0.99, 0.02], [r * 0.6, 0.01], [0, 0.009]], { segs: 14 });
      g.pop(); k++;
    }
  }
  return { solid: [[-hw, 0, -hd, hw, 0.92, hd + 0.02], [-hw, 0.92, -hd, hw, H, -hd + bd]], tier: 's' };
});

// A wardrobe, heavy and remade: one door panel replaced in another wood. p: { w, d, h, body, patch }
defineProp('flats.wardrobe', (g, p) => {
  const w = p.w || 1.1, d = p.d || 0.58, H = p.h || 2.0, hw = w / 2, hd = d / 2, body = p.body || '#5a3d28';
  g.mat('wood', body, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.lathe(sx * (hw - 0.06), sz * (hd - 0.06), [[0.04, 0], [0.03, 0.05], [0.04, 0.1]], { segs: 8 });
  g.box(-hw, 0.1, -hd, hw, H, hd, { bevel: 0.01 });
  g.box(-hw - 0.03, H, -hd - 0.03, hw + 0.03, H + 0.08, hd + 0.03, { bevel: 0.012 });
  g.box(-hw - 0.015, 0.1, -hd - 0.015, hw + 0.015, 0.2, hd + 0.015, { bevel: 0.01 });
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? -hw + 0.04 : 0.01, x1 = sx < 0 ? -0.01 : hw - 0.04;
    g.mat('wood', sx > 0 && p.patch ? p.patch : shadeHex(body, 1.15)); g.box(x0 + 0.05, 0.3, hd, x1 - 0.05, 1.05, hd + 0.012, { bevel: 0.008 }); g.box(x0 + 0.05, 1.15, hd, x1 - 0.05, H - 0.1, hd + 0.012, { bevel: 0.008 });
  }
  g.mat('cast', '#c8a45a'); g.tube([[-0.04, 1.0, hd + 0.01], [-0.04, 1.0, hd + 0.04], [-0.04, 1.16, hd + 0.04], [-0.04, 1.16, hd + 0.01]], 0.007, { segs: 5 }); g.tube([[0.04, 1.0, hd + 0.01], [0.04, 1.0, hd + 0.04], [0.04, 1.16, hd + 0.04], [0.04, 1.16, hd + 0.01]], 0.007, { segs: 5 });
  return { solid: [[-hw, 0, -hd, hw, H + 0.08, hd]], tier: 's' };
});

// A kitchen base cupboard with a worktop; optional sink (with the 65 degree tap) and hotplates. p: { w, d, body, top, topMat, sink, hob }
defineProp('flats.cupboard', (g, p) => {
  const w = p.w || 1.2, d = p.d || 0.6, h = 0.9, hw = w / 2, hd = d / 2, body = p.body || '#2f5d50';
  g.mat('paint', shadeHex(body, 0.5)); g.box(-hw, 0, -hd, hw, 0.1, hd - 0.06);
  g.mat('paint', body); g.box(-hw, 0.1, -hd, hw, h - 0.04, hd - 0.02, { aoBottom: 0.6 });
  const n = Math.max(1, Math.round(w / 0.55)); g.mat('paint', shadeHex(body, 1.16));
  for (let i = 0; i < n; i++) { const a0 = -hw + (w * i) / n, a1 = -hw + (w * (i + 1)) / n; g.box(a0 + 0.02, 0.13, hd - 0.02, a1 - 0.02, h - 0.08, hd - 0.004, { bevel: 0.008 }); }
  g.mat('cast', '#c8a45a'); for (let i = 0; i < n; i++) { const a = -hw + (w * (i + 0.5)) / n + 0.18 * (i % 2 ? -1 : 1) * (n > 1 ? 1 : 0); g.tube([[a, h - 0.22, hd + 0.01], [a, h - 0.16, hd + 0.01]], 0.008, { segs: 5 }); }
  g.mat(p.topMat || 'wood', p.top || '#8a6240', { rough: -0.1 }); g.box(-hw - 0.01, h - 0.04, -hd, hw + 0.01, h, hd + 0.02, { bevel: 0.008 });
  if (p.sink !== undefined) {
    const sx = p.sink; g.mat('brushed', '#c9c4bb');
    g.box(sx - 0.26, h, -hd + 0.06, sx + 0.26, h + 0.012, -hd + 0.1); g.box(sx - 0.26, h, hd - 0.08, sx + 0.26, h + 0.012, hd - 0.04); g.box(sx - 0.26, h, -hd + 0.1, sx - 0.22, h + 0.012, hd - 0.08); g.box(sx + 0.22, h, -hd + 0.1, sx + 0.26, h + 0.012, hd - 0.08);
    g.mat('brushed', '#55524c'); g.box(sx - 0.22, h - 0.002, -hd + 0.1, sx + 0.22, h + 0.003, hd - 0.08, { faces: 'Y' });
    g.mat('cast', '#b08a45'); g.tube([[sx, h, -hd + 0.03], [sx, h + 0.3, -hd + 0.03], [sx, h + 0.34, -hd + 0.1], [sx, h + 0.28, -hd + 0.16]], 0.012, { segs: 6 });
    g.mat('cast', '#a8322e'); g.cyl(sx - 0.1, h, -hd + 0.04, 0.02, 0.05, { segs: 8 }); g.mat('cast', '#2f6f8f'); g.cyl(sx + 0.1, h, -hd + 0.04, 0.02, 0.05, { segs: 8 });
  }
  if (p.hob !== undefined) {
    const hx = p.hob; g.mat('cast', '#2a2826'); g.box(hx - 0.28, h, -hd + 0.06, hx + 0.28, h + 0.02, hd - 0.06, { bevel: 0.006 });
    g.mat('cast', '#4a4642'); g.cyl(hx - 0.13, h + 0.02, 0, 0.09, 0.008, { segs: 14 }); g.cyl(hx + 0.13, h + 0.02, 0, 0.075, 0.008, { segs: 14 });
    g.mat('cast', '#c8a45a'); g.cyl(hx - 0.1, h - 0.1, hd - 0.01, 0.018, 0.03, { segs: 6 });
  }
  return { solid: [[-hw, 0, -hd, hw, h, hd]], tier: 's' };
});

// A kettle. p: { metal, mat }
defineProp('flats.kettle', (g, p) => {
  const c = p.metal || '#b8b4ac', m = p.mat || 'brushed';
  g.mat(m, c); g.lathe(0, 0, [[0, 0], [0.075, 0], [0.09, 0.03], [0.095, 0.1], [0.08, 0.16], [0.05, 0.19], [0.044, 0.2], [0, 0.2]], { segs: 14 });
  g.tube([[0.08, 0.05, 0], [0.13, 0.12, 0], [0.165, 0.17, 0]], [0.02, 0.013, 0.01], { segs: 6 });
  g.mat('wood', '#3a2a20'); g.cyl(0, 0.2, 0, 0.018, 0.025, { segs: 8 });
  g.tube([[-0.055, 0.18, 0], [-0.06, 0.27, 0], [0.03, 0.28, 0], [0.045, 0.19, 0]], 0.011, { segs: 5 });
  return { cast: false };
});

// A jar. p: { r, h, fill (what is in it), lid, lidMat, label (paper colour) }
defineProp('flats.jar', (g, p) => {
  const r = p.r || 0.05, h = p.h || 0.14;
  g.mat('plain', p.fill || '#b8743a', { rough: -0.3 }); g.lathe(0, 0, [[0, 0], [r * 0.9, 0], [r, h * 0.08], [r, h * 0.8], [r * 0.8, h * 0.9], [r * 0.78, h * 0.94]], { segs: 10, capTop: false });
  g.mat(p.lidMat || 'cast', p.lid || '#8a6d3b'); g.lathe(0, 0, [[r * 0.85, h * 0.9], [r * 0.85, h], [0, h + 0.005]], { segs: 10, capBottom: false });
  if (p.label) { g.mat('paper', p.label); g.box(-r * 0.62, h * 0.3, r * 0.82, r * 0.62, h * 0.62, r + 0.004, { faces: 'ZxXyY' }); }
  return { cast: false };
});

// A tin with a band of paper round it. p: { r, h, col, band }
defineProp('flats.tin', (g, p) => {
  const r = p.r || 0.055, h = p.h || 0.11, c = p.col || '#2f6f73';
  g.mat('brushed', c); g.cyl(0, 0, 0, r, h, { segs: 12 }); g.mat('brushed', shadeHex(c, 1.3)); g.cyl(0, h, 0, r * 1.04, 0.012, { segs: 12 });
  if (p.band) { g.mat('paper', p.band); g.cyl(0, h * 0.28, 0, r * 1.012, h * 0.38, { segs: 12, capTop: false, capBottom: false }); }
  return { cast: false };
});

// A bottle with a cork. p: { h, glass, label }
defineProp('flats.bottle', (g, p) => {
  const h = p.h || 0.3; g.mat('plain', p.glass || '#cfe0d4', { rough: -0.4 });
  g.lathe(0, 0, [[0, 0], [0.038, 0], [0.04, 0.01], [0.04, h * 0.62], [0.03, h * 0.72], [0.014, h * 0.82], [0.014, h * 0.95]], { segs: 10 });
  g.mat('wood', '#a8835a'); g.cyl(0, h * 0.95, 0, 0.012, h * 0.06, { segs: 6 });
  if (p.label) { g.mat('paper', p.label); g.cyl(0, h * 0.2, 0, 0.0405, h * 0.22, { segs: 10, capTop: false, capBottom: false }); }
  return { cast: false };
});

// A good glass. p: { tint, tumbler }
defineProp('flats.glass', (g, p) => {
  g.mat('plain', p.tint || '#e6eef0', { rough: -0.45 });
  if (p.tumbler) g.lathe(0, 0, [[0, 0], [0.03, 0], [0.034, 0.08], [0.031, 0.081], [0.027, 0.006], [0, 0.006]], { segs: 10 });
  else g.lathe(0, 0, [[0, 0], [0.03, 0], [0.03, 0.004], [0.004, 0.012], [0.004, 0.07], [0.026, 0.088], [0.033, 0.13], [0.03, 0.131], [0.023, 0.092], [0, 0.086]], { segs: 10 });
  return { cast: false };
});

// A stone mortar with a pestle and a pinch of colour in it. p: { stone, pigment }
defineProp('flats.mortar', (g, p) => {
  g.mat('stone', p.stone || '#b9b0a2'); g.lathe(0, 0, [[0, 0], [0.06, 0], [0.075, 0.03], [0.08, 0.07], [0.07, 0.075], [0.05, 0.03], [0, 0.025]], { segs: 14 });
  g.mat('plain', p.pigment || '#5a3f52', { rough: 0.2 }); g.cyl(0, 0.026, 0, 0.046, 0.005, { segs: 10 });
  g.mat('stone', shadeHex(p.stone || '#b9b0a2', 0.85)); g.tube([[0.015, 0.03, 0], [0.085, 0.15, 0.02]], [0.012, 0.017], { segs: 6 });
  return { cast: false };
});

// A morning light panel on a stand. p: { w, h, y0, body, glow }
defineProp('flats.panel', (g, p) => {
  const w = p.w || 0.5, h = p.h || 0.7, y0 = p.y0 || 0.55, hw = w / 2;
  g.mat('cast', '#3a3a38'); g.cyl(0, 0, -0.03, 0.16, 0.03, { segs: 12 }); g.tube([[0, 0.03, -0.03], [0, y0 + 0.1, -0.03]], 0.014, { segs: 6 });
  g.mat('paint', p.body || '#d9d2c4'); g.box(-hw - 0.03, y0 - 0.03, -0.05, hw + 0.03, y0 + h + 0.03, -0.002, { bevel: 0.012 });
  g.mat('diffuser', '#fff7ea', { emissive: p.glow || 1.1 }); g.box(-hw, y0, -0.004, hw, y0 + h, 0.004, { faces: 'Z' });
  return { posts: [[0, -0.03, 0.16, 0, 0.05]], cast: false };
});

// A cane basket of mending. p: { r, cloth: [colours] }
defineProp('flats.basket', (g, p) => {
  const r = p.r || 0.2; g.mat('cane', p.cane || '#b8955a');
  g.lathe(0, 0, [[0, 0], [r * 0.8, 0], [r, 0.04], [r * 1.05, 0.18], [r * 1.1, 0.2], [r * 1.03, 0.205], [r * 0.98, 0.05], [0, 0.03]], { segs: 14 });
  const c = p.cloth || ['#2f6f8f', '#e9c46a', '#c9552e'];
  c.forEach((col, i) => { const a = i * 2.1; g.mat(i % 2 ? 'knit' : 'weave', col); g.ball(Math.cos(a) * r * 0.4, 0.17 + i * 0.015, Math.sin(a) * r * 0.4, r * 0.55, 0.06, r * 0.45, { segs: 10, rings: 5 }); });
  g.mat('wood', '#c9b28a'); g.cyl(r * 0.5, 0.2, -r * 0.2, 0.022, 0.05, { segs: 8 });
  g.mat('weave', '#d05a3a'); g.cyl(r * 0.5, 0.21, -r * 0.2, 0.026, 0.03, { segs: 8 });
  return { cast: false };
});

// A school satchel. p: { col }
defineProp('flats.satchel', (g, p) => {
  const c = p.col || '#7a2f2a';
  g.mat('leather', c); g.box(-0.17, 0, -0.05, 0.17, 0.25, 0.05, { bevel: 0.025 });
  g.mat('leather', shadeHex(c, 0.8)); g.box(-0.17, 0.11, 0.045, 0.17, 0.26, 0.065, { bevel: 0.01 });
  g.mat('cast', '#c8a45a'); g.box(-0.02, 0.12, 0.062, 0.02, 0.16, 0.07);
  g.mat('leather', shadeHex(c, 0.65)); g.tube([[-0.16, 0.2, 0], [-0.13, 0.42, -0.01], [0, 0.5, -0.01], [0.13, 0.42, -0.01], [0.16, 0.2, 0]], 0.011, { segs: 4 });
  return { cast: false };
});

// A spinball. p: { col, band }
defineProp('flats.ball', (g, p) => {
  g.mat('leather', p.col || '#c9552e'); g.ball(0, 0.09, 0, 0.09, 0.09, 0.09, { segs: 12, rings: 8 });
  g.mat('leather', p.band || '#e9e2d0'); g.cyl(0, 0.08, 0, 0.0915, 0.02, { segs: 12, capTop: false, capBottom: false });
  return { cast: false };
});

// A wash stand: a basin and a jug, a towel on the rail. p: { wood, glaze, towel }
defineProp('flats.washstand', (g, p) => {
  const wd = p.wood || '#6f5137'; g.mat('wood', wd, { rough: -0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * 0.28 - 0.02, 0, sz * 0.18 - 0.02, sx * 0.28 + 0.02, 0.78, sz * 0.18 + 0.02, { bevel: 0.005 });
  g.box(-0.31, 0.76, -0.21, 0.31, 0.8, 0.21, { bevel: 0.01 }); g.box(-0.28, 0.18, -0.18, 0.28, 0.2, 0.18);
  g.box(-0.31, 0.8, -0.21, 0.31, 0.95, -0.19, { bevel: 0.006 });
  g.tube([[0.33, 0.6, -0.15], [0.36, 0.6, -0.15], [0.36, 0.6, 0.15], [0.33, 0.6, 0.15]], 0.01, { segs: 5 });
  g.mat('glaze', p.glaze || '#e8e2d4'); g.lathe(0, 0, [[0, 0.8], [0.1, 0.8], [0.17, 0.86], [0.19, 0.9], [0.185, 0.905], [0.16, 0.87], [0, 0.83]], { segs: 18 });
  g.lathe(0.02, 0.02, [[0, 0.83], [0.06, 0.83], [0.075, 0.9], [0.06, 1.0], [0.045, 1.05], [0.06, 1.08], [0.055, 1.085], [0, 1.0]], { segs: 12 });
  g.mat('weave', p.towel || '#2f6f8f'); g.sheet([0.37, 0.61, -0.13], [0.37, 0.61, 0.13], [0.37, 0.28, 0.13], [0.37, 0.28, -0.13], { nu: 3, nv: 2, ripple: 0.01 });
  g.mat('stripe', '#efe6d2'); g.box(-0.24, 0.2, -0.12, 0.2, 0.26, 0.12, { bevel: 0.02 });
  return { solid: [[-0.31, 0, -0.21, 0.37, 0.95, 0.21]], tier: 's' };
});

// A lemon tree in a pot under its lamp. p: { pot, size }
defineProp('flats.lemon', (g, p) => {
  const k = p.size || 1, r = new Rng(hashStr('lemon' + k));
  g.mat('glaze', p.pot || '#2b6b69'); g.lathe(0, 0, [[0, 0], [0.18, 0], [0.2, 0.04], [0.25, 0.4], [0.27, 0.42], [0.27, 0.46], [0.24, 0.46], [0.23, 0.42]], { segs: 18, capTop: false });
  g.mat('soil', '#ffffff'); g.cyl(0, 0.4, 0, 0.235, 0.01, { segs: 12 });
  g.mat('bark', '#8a7458'); g.tube([[0, 0.4, 0], [0.02, 0.7 * k, 0.01], [-0.01, 0.95 * k, 0]], [0.03, 0.022, 0.016], { segs: 6 });
  for (let i = 0; i < 3; i++) { const a = i * 2.1; g.tube([[0, 0.85 * k, 0], [Math.cos(a) * 0.18, 1.05 * k, Math.sin(a) * 0.18]], [0.014, 0.008], { segs: 5 }); }
  g.mat('leafA', '#dfffd0', { sway: 0.2 });
  for (let i = 0; i < 16; i++) { const a = r.f(0, 6.28), rr = r.f(0.05, 0.3), y = r.f(0.8, 1.3) * k; g.card(Math.cos(a) * rr, y, Math.sin(a) * rr, 0.36, 0.34, a + r.f(-0.6, 0.6), { tilt: r.f(-0.3, 0.3) }); }
  g.mat('plain', '#e8c43a', { rough: -0.15 });
  for (let i = 0; i < 6; i++) { const a = i * 1.07 + 0.3, rr = 0.2 + (i % 2) * 0.06, y = (0.92 + (i % 3) * 0.1) * k; g.ball(Math.cos(a) * rr, y, Math.sin(a) * rr, 0.035, 0.045, 0.035, { segs: 8, rings: 6 }); }
  return { posts: [[0, 0, 0.27, 0, 0.46]], tier: 's' };
});

// A trough of tomato plants up canes, fruit red and green. p: { w, box }
defineProp('flats.tomatoes', (g, p) => {
  const w = p.w || 1.4, hw = w / 2, r = new Rng(hashStr('tom' + w));
  g.mat('paint', p.box || '#a3563a'); g.box(-hw, 0, -0.2, hw, 0.42, 0.2, { bevel: 0.015, aoBottom: 0.6 });
  g.mat('soil', '#ffffff'); g.box(-hw + 0.04, 0.4, -0.16, hw - 0.04, 0.415, 0.16, { faces: 'Y' });
  const n = Math.max(2, Math.round(w / 0.35));
  for (let i = 0; i < n; i++) {
    const x = -hw + w * (i + 0.5) / n;
    g.mat('cane', '#c9b27a'); g.tube([[x, 0.4, -0.05], [x + 0.01, 1.62, -0.07]], 0.008, { segs: 4 });
    g.mat('leafA', '#e8ffd8', { sway: 0.2 });
    for (let j = 0; j < 9; j++) { const y = 0.48 + j * 0.13, a = r.f(0, 6.28); g.card(x + r.f(-0.08, 0.08), y, r.f(-0.1, 0.08), 0.36, 0.3, a, { tilt: r.f(-0.3, 0.3) }); }
    for (let j = 0; j < 5; j++) {
      const ripe = r.next(); g.mat('plain', ripe > 0.55 ? '#c8321e' : ripe > 0.3 ? '#e07a2a' : '#7a9a3a', { rough: -0.25 });
      const y = r.f(0.6, 1.35), xx = x + r.f(-0.08, 0.08), zz = r.f(0.0, 0.12); g.ball(xx, y, zz, 0.032, 0.03, 0.032, { segs: 8, rings: 5 });
    }
  }
  return { solid: [[-hw, 0, -0.2, hw, 0.42, 0.2]], tier: 's' };
});

// A low table. p: { w, d, h, wood, top, round }
defineProp('flats.lowtable', (g, p) => {
  const w = p.w || 0.6, d = p.d || 0.45, h = p.h || 0.5, hw = w / 2, hd = d / 2;
  g.mat('wood', p.top || p.wood || '#5a3d28', { rough: -0.1 });
  if (p.round) g.lathe(0, 0, [[0, h - 0.03], [hw, h - 0.03], [hw + 0.01, h - 0.015], [hw, h], [0, h]], { segs: 22 });
  else g.box(-hw, h - 0.03, -hd, hw, h, hd, { bevel: 0.01 });
  g.mat('wood', p.wood || '#5a3d28');
  const lx = p.round ? hw * 0.62 : hw - 0.05, lz = p.round ? hw * 0.62 : hd - 0.05;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * lx, 0, sz * lz], [sx * lx * 0.95, h - 0.03, sz * lz * 0.95]], [0.018, 0.022], { segs: 6 });
  g.box(-lx, 0.16, -lz, lx, 0.18, lz, { bevel: 0.005 });
  return { solid: [[-hw, 0, -(p.round ? hw : hd), hw, h, p.round ? hw : hd]], tier: 's' };
});

// ---------------------------------------------------------------------------------------------------------------
// Drawing helpers (draw into s.g; the caller flushes, or these flush themselves where they say so)
// ---------------------------------------------------------------------------------------------------------------
const BOOKCOLS = ['#7a2f2a', '#2f5d50', '#33406e', '#c98a2e', '#5b4060', '#2b6b69', '#8a3b2a', '#3d5a3a', '#a24a5a', '#1f3b4d', '#b8862e', '#6e2f3f', '#d9c7a6', '#4a3a2a'];
// Spines of books from a0 to a1 along the wall, standing at height y with their backs against the wall at c, spines out toward `face`.
export function books(g, face, c, a0, a1, y, seed, o = {}) {
  const W = onWall(face, c), r = new Rng(hashStr('bk' + seed)), cols = o.cols || BOOKCOLS; let a = a0;
  while (a < a1 - 0.02) {
    if (r.chance(o.gaps || 0.05)) { a += r.f(0.04, 0.12); continue; }
    const t = r.f(0.018, 0.048), h = r.f(o.low || 0.15, o.tall || 0.27), d = r.f(0.13, 0.19);
    if (a + t > a1) break;
    g.mat(r.chance(0.3) ? 'leather' : 'weave', r.pick(cols));
    W.B(g, a, y, 0.01, a + t, y + h, d, { bevel: 0.003 });
    a += t + 0.002;
  }
}
// A framed picture on the wall at plane c, centre (u, v), size w x h. rects: [[u0, v0, u1, v1, '#hex', mat], ...] in 0..1 of the inside (v up).
// o: { frame, fw (frame width), ground (the paper), depth, mat }
export function framed(g, face, c, u, v, w, h, rects, o = {}) {
  const W = onWall(face, c), fw = o.fw || 0.03, dep = o.depth || 0.025;
  g.mat(o.frameMat || 'wood', o.frame || '#3a2a20', { rough: -0.1 });
  W.B(g, u - w / 2, v - h / 2, 0, u - w / 2 + fw, v + h / 2, dep); W.B(g, u + w / 2 - fw, v - h / 2, 0, u + w / 2, v + h / 2, dep);
  W.B(g, u - w / 2 + fw, v - h / 2, 0, u + w / 2 - fw, v - h / 2 + fw, dep); W.B(g, u - w / 2 + fw, v + h / 2 - fw, 0, u + w / 2 - fw, v + h / 2, dep);
  g.mat(o.groundMat || 'paper', o.ground || '#efe6d2'); W.B(g, u - w / 2 + fw, v - h / 2 + fw, 0, u + w / 2 - fw, v + h / 2 - fw, dep * 0.4);
  const m = o.mount === undefined ? 0.02 : o.mount, iu0 = u - w / 2 + fw + m, iv0 = v - h / 2 + fw + m, iw = w - 2 * (fw + m), ih = h - 2 * (fw + m);
  // mirrored faces: keep pictures the right way round
  const flip = face === 'z' || face === 'X' ? -1 : 1;
  rects.forEach((q, i) => {
    g.mat(q[5] || 'paint', q[4], { rough: q[6] === undefined ? 0.1 : q[6] });
    const U = (t) => flip > 0 ? iu0 + iw * t : iu0 + iw * (1 - t);
    W.B(g, U(q[0]), iv0 + ih * q[1], dep * 0.4, U(q[2]), iv0 + ih * q[3], dep * 0.4 + 0.002 + i * 0.0003, { faces: W.alongX ? (W.n > 0 ? 'Z' : 'z') : (W.n > 0 ? 'X' : 'x') });
  });
}
// A curtain from a rail between (ax, az) and (bx, bz), from y1 down to y0. o: { col, mat, folds, nu, rail }
export function curtain(g, ax, az, bx, bz, y1, y0, o = {}) {
  g.mat(o.mat || 'weave', o.col || '#c9552e');
  g.sheet([ax, y1, az], [bx, y1, bz], [bx, y0, bz], [ax, y0, az], { nu: o.nu || 12, nv: 3, ripple: o.ripple || 0.04, rippleN: o.folds || 9 });
  if (o.rail !== false) { g.mat('cast', o.rail || '#8a6d3b'); g.tube([[ax, y1 + 0.03, az], [bx, y1 + 0.03, bz]], 0.011, { segs: 6 }); }
}
// A shelf board on brackets against a wall. (a0..a1 along it, height y, depth d.)
export function shelf(g, face, c, a0, a1, y, d = 0.24, o = {}) {
  const W = onWall(face, c);
  g.mat('wood', o.wood || '#6f5137', { rough: -0.05 }); W.B(g, a0, y - 0.025, 0, a1, y, d, { bevel: 0.006 });
  if (o.lip) W.B(g, a0, y, d - 0.015, a1, y + 0.025, d);
  g.mat('cast', o.bracket || '#3a3530');
  const n = Math.max(2, Math.round((a1 - a0) / 0.9) + 1);
  for (let i = 0; i < n; i++) { const b = a0 + 0.1 + (a1 - a0 - 0.2) * i / (n - 1); W.B(g, b - 0.01, y - 0.22, 0, b + 0.01, y - 0.025, 0.02); g.tube([W.P(b, y - 0.2, 0.01), W.P(b, y - 0.03, d * 0.75)], 0.008, { segs: 4 }); }
}
// A rail of pegs. n pegs from a0 to a1 at height y.
export function pegs(g, face, c, a0, a1, y, n, o = {}) {
  const W = onWall(face, c);
  g.mat('wood', o.wood || '#5a3d28'); W.B(g, a0, y - 0.05, 0, a1, y + 0.05, 0.022, { bevel: 0.005 });
  g.mat('wood', o.peg || '#8a6240');
  for (let i = 0; i < n; i++) { const b = a0 + (a1 - a0) * (i + 0.5) / n; g.tube([W.P(b, y, 0.02), W.P(b, y + 0.04, 0.11)], [0.013, 0.011], { segs: 6 }); }
}
// Coloured studies on board, leaning against a wall in a stack. (a along the wall, the foot w0 out from it.)
export function studies(g, face, c, a, y, seed, o = {}) {
  const W = onWall(face, c), r = new Rng(hashStr('st' + seed)), n = o.n || 5;
  const pal = o.pal || [['#4a3048', '#6b4a5a', '#b06a7a', '#e6a98a', '#f2d29a'], ['#2a2238', '#5a3f52', '#8a5a62', '#c98a7a'], ['#f2d29a', '#f0c070', '#e8a050', '#d07a40'], ['#3a4a6a', '#6a7a9a', '#c9b8c8', '#efe0d0']];
  for (let i = 0; i < n; i++) {
    const w = r.f(0.4, 0.75), h = r.f(0.35, 0.6), foot = 0.06 + i * 0.035, lean = 0.12 - i * 0.012, a0 = a + r.f(-0.08, 0.08) - w / 2;
    const p0 = W.P(a0, y, foot), p1 = W.P(a0 + w, y, foot), p2 = W.P(a0 + w, y + h, foot - lean), p3 = W.P(a0, y + h, foot - lean);
    g.mat('wood', '#c9b28a'); g.quad(p0, p1, p2, p3, { double: true });
    const bands = r.pick(pal), nb = bands.length;
    for (let k = 0; k < nb; k++) {
      const t0 = 0.08 + 0.84 * k / nb, t1 = 0.08 + 0.84 * (k + 1) / nb;
      const q0 = W.P(a0 + 0.04, y + h * t0, foot - lean * t0 + 0.006), q1 = W.P(a0 + w - 0.04, y + h * t0, foot - lean * t0 + 0.006), q2 = W.P(a0 + w - 0.04, y + h * t1, foot - lean * t1 + 0.006), q3 = W.P(a0 + 0.04, y + h * t1, foot - lean * t1 + 0.006);
      g.mat('paint', bands[k], { rough: 0.15 }); g.quad(q0, q1, q2, q3, { double: true });
    }
  }
}

// A table lamp of your own: a turned base, a cloth shade that glows, and its light. o: { h, r, base, baseMat, shade, K, power, range, clip, level, glow }
export function tableLamp(s, x, y, z, o = {}) {
  const g = s.g, h = o.h || 0.44, r = o.r || 0.13;
  g.mat(o.baseMat || 'glaze', o.base || '#2f6f73'); g.lathe(x, z, [[0, y], [0.07, y], [0.08, y + 0.03], [0.065, y + 0.12], [0.03, y + 0.2], [0.012, y + 0.24], [0, y + 0.24]], { segs: 12 });
  g.mat('brushed', '#8a7a5a'); g.cyl(x, y + 0.24, z, 0.007, h - 0.3, { segs: 5 });
  g.mat(o.shadeMat || 'weave', o.shade || '#ecd6aa', { emissive: o.glow || 1.4, lamp: true });
  g.lathe(x, z, [[r, y + h - 0.17], [r * 0.6, y + h + 0.01]], { segs: 16, capTop: false, capBottom: false });
  g.lathe(x, z, [[r * 0.6, y + h + 0.01], [r * 0.99, y + h - 0.17]], { segs: 16, capTop: false, capBottom: false });
  s.flush({ tier: 'd', cast: false, level: o.level });
  lamp(s, 'bulb', x, y + h - 0.1, z, { K: o.K || 2700, color: o.color, power: o.power === undefined ? 0.4 : o.power, range: o.range || 4.5, clip: o.clip, level: o.level });
}

// A morning light panel: the stand, and a light that comes on for twenty minutes from half past six, or when asked.
// Returns a controller: c.boost(game, minutes) turns it on now.
export function lightPanel(s, game, x, y, z, yaw, o = {}) {
  prop(s, 'flats.panel', x, y, z, yaw, { w: o.w || 0.5, h: o.h || 0.7, y0: o.y0 || 0.55, glow: 0.3 }, { level: o.level });
  const fx = Math.sin(yaw), fz = Math.cos(yaw), y0 = o.y0 || 0.55, hh = o.h || 0.7;
  const base = warm(5600), P = o.power || 5;
  const l = s.light({ at: [x + fx * 0.25, y + y0 + hh / 2, z + fz * 0.25], color: base, power: 0, range: o.range || 4.5, clip: o.clip, radius: 0.3, shadow: false });
  const st = { scope: s, on: null, until: -1, boost(gm, minutes) { st.until = gm.clock.day * 1440 + gm.clock.minutes + (minutes || 20); },
    update() {
      const ck = game.clock; if (!ck) return;
      const h = ck.hours, now = ck.day * 1440 + ck.minutes;
      const want = (h >= 6.5 && h < 6.8333) || now < st.until;
      if (want === st.on) return; st.on = want;
      const k = want ? P : 0; l.color = [base[0] * k, base[1] * k, base[2] * k];
    } };
  s.world.dynamics.push(st);
  return st;
}

// A door from the kit, told which deck it is on: door() does not pass `level` to its mesh, and the deck culler hides
// level-0 meshes away from the court, so a door deep in a flat would vanish without this.
export function hang(s, o) { const st = door(s, o); if (st && st.mesh && o.level !== undefined) st.mesh.userData.level = o.level; return st; }

// ---------------------------------------------------------------------------------------------------------------
// The front wall: each flat's own wall just inside its footprint, behind the terrace wall that holds the doorway (1.0 m)
// and the window (1.3 m, sill 0.95). This wall's openings are a little wider so the hinged door hung in the terrace wall's
// plane can swing in. o: { side: 'S' | 'N' | 'E', c (footprint line), a0, a1, y, h, door, win, tint, out (tint of the hidden face),
//   dado: { h, mat, tint }, lv, doorTint, doorStyle, open, label, sill: [mat, tint], casing }
// Returns { inward: [dx, dz], inner (the inside face coordinate) }.
// ---------------------------------------------------------------------------------------------------------------
export function frontWall(s, o) {
  const g = s.g, y = o.y, h = o.h || 3, lv = o.lv, t = 0.16;
  const alongX = o.side !== 'E', inSign = o.side === 'N' ? -1 : 1;           // the room lies toward +z (S), -z (N) or +x (E)
  const wc = o.c + inSign * t / 2, inner = o.c + inSign * t, tw = o.c - inSign * 0.08;    // tw: the terrace wall's centre line
  const D0 = o.door - 0.6, W0 = o.win - 0.65;
  const ops = [{ at: D0 - o.a0, w: 1.2, h: 2.2 }, { at: W0 - o.a0, w: 1.3, h: 1.3, sill: 0.95 }];
  const faceIn = alongX ? (inSign > 0 ? 'Z' : 'z') : 'X';
  // face A of a wall looks toward +z (x-run) or +x (z-run)
  const tints = inSign > 0 ? { tintA: o.tint, tintB: o.out || '#cdbb9c' } : { tintA: o.out || '#cdbb9c', tintB: o.tint };
  if (alongX) wall(s, o.a0, wc, o.a1, wc, y, h, Object.assign({ openings: ops, dado: o.dado, level: lv, mat: o.mat }, tints));
  else wall(s, wc, o.a0, wc, o.a1, y, h, Object.assign({ openings: ops, dado: o.dado, level: lv, mat: o.mat }, tints));
  const W = onWall(faceIn, inner);
  // casings round the door and the window, a threshold, the deep sill
  g.mat('wood', o.casing || '#5a3d28', { rough: -0.05 });
  W.B(g, D0 - 0.07, y, 0, D0, y + 2.27, 0.025, { bevel: 0.005 }); W.B(g, D0 + 1.2, y, 0, D0 + 1.27, y + 2.27, 0.025, { bevel: 0.005 }); W.B(g, D0 - 0.07, y + 2.2, 0, D0 + 1.27, y + 2.27, 0.025, { bevel: 0.005 });
  W.B(g, W0 - 0.07, y + 0.95, 0, W0, y + 2.32, 0.025, { bevel: 0.005 }); W.B(g, W0 + 1.3, y + 0.95, 0, W0 + 1.37, y + 2.32, 0.025, { bevel: 0.005 }); W.B(g, W0 - 0.07, y + 2.25, 0, W0 + 1.37, y + 2.32, 0.025, { bevel: 0.005 });
  // the reveal of the door: a lining on the jambs and head through both walls
  W.B(g, D0, y + 2.1, -t, D0 + 1.2, y + 2.2, 0);
  g.mat('wood', mixHex(o.casing || '#5a3d28', '#8a6240', 0.4)); W.B(g, D0 - 0.02, y, -0.02, D0 + 1.22, y + 0.014, 0.06);
  const sl = o.sill || ['wood', '#8a6240'];
  g.mat(sl[0], sl[1], { rough: -0.1 }); W.B(g, W0 - 0.1, y + 0.92, -t - 0.075, W0 + 1.4, y + 0.97, 0.26, { bevel: 0.008 });
  g.mat(sl[0], shadeHex(sl[1], 0.8)); W.B(g, W0 - 0.05, y + 0.84, 0, W0 + 1.35, y + 0.92, 0.04, { bevel: 0.005 });
  s.flush({ tier: 's', level: lv });
  s.solid(...(() => { const a = W.P(W0 - 0.1, y, 0), b = W.P(W0 + 1.4, y + 0.97, 0.26); return [Math.min(a[0], b[0]), a[1], Math.min(a[2], b[2]), Math.max(a[0], b[0]), b[1], Math.max(a[2], b[2])]; })());
  // the door, hung in the terrace wall's plane, swinging in
  const dz = { tint: o.doorTint || '#2f5d50', style: o.doorStyle || 'panel', label: o.label || 'the door', open: !!o.open, level: lv, h: 2.08, w: 0.98 };
  if (alongX) hang(s, Object.assign(dz, { x: o.door - 0.49, y, z: tw, along: 'x', dir: 1, swing: inSign > 0 ? -1 : 1 }));
  else hang(s, Object.assign(dz, { x: tw, y, z: o.door - 0.49, along: 'z', dir: 1, swing: 1 }));
  return { inward: alongX ? [0, inSign] : [1, 0], inner, W, D0, W0 };
}

// Beams across the ceiling, a pair of pipes along one wall and a felt panel or two: the inside of a very large machine, lived in.
// o: { along: 'x' | 'z' (the way the beams run), step, wood, pipeAt: 'x0' | 'x1' | 'z0' | 'z1', felt: '#hex', lv }
export function ceilingWorks(s, x0, z0, x1, z1, yC, o = {}) {
  const g = s.g, lv = o.lv, step = o.step || 1.5;
  g.mat('wood', o.wood || '#5a3d28', { rough: 0.05 });
  if (o.along === 'z') { for (let x = x0 + step * 0.6; x < x1 - 0.3; x += step) g.box(x - 0.06, yC - 0.16, z0, x + 0.06, yC, z1, { faces: 'yxX' }); }
  else { for (let z = z0 + step * 0.6; z < z1 - 0.3; z += step) g.box(x0, yC - 0.16, z - 0.06, x1, yC, z + 0.06, { faces: 'yzZ' }); }
  s.flush({ tier: 's', level: lv });
  if (o.felt) {
    // felt baffles: narrow fins hung edge-down between the beams across the middle of the room (bare rooms ring in heliox)
    const across = o.along === 'z' ? [z0 + (z1 - z0) * 0.2, z0 + (z1 - z0) * 0.8] : [x0 + (x1 - x0) * 0.2, x0 + (x1 - x0) * 0.8];
    const a0 = o.along === 'z' ? x0 : z0, a1 = o.along === 'z' ? x1 : z1;
    const cols = [o.felt, shadeHex(o.felt, 1.25), mixHex(o.felt, '#d9c7a6', 0.35)];
    let k = 0;
    let bay = 0;
    for (let a = a0 + step * 0.6; a + step < a1 - 0.2; a += step) {
      if (bay++ % 2) continue;
      for (const t of [0.5]) {
        const m = a + step * t; g.mat('felt', cols[k++ % cols.length]);
        if (o.along === 'z') g.box(m - 0.02, yC - 0.32, across[0], m + 0.02, yC - 0.1, across[1], { bevel: 0.008 });
        else g.box(across[0], yC - 0.32, m - 0.02, across[1], yC - 0.1, m + 0.02, { bevel: 0.008 });
        g.mat('cast', '#3a3530');
        for (const e of [across[0] + 0.15, across[1] - 0.15]) { if (o.along === 'z') g.box(m - 0.004, yC - 0.1, e - 0.004, m + 0.004, yC, e + 0.004); else g.box(e - 0.004, yC - 0.1, m - 0.004, e + 0.004, yC, m + 0.004); }
      }
    }
    s.flush({ tier: 's', cast: false, level: lv });
  }
  if (o.pipeAt) {
    const pa = o.pipeAt, py = yC - 0.26;
    const run = pa === 'x0' ? [[x0 + 0.14, z0], [x0 + 0.14, z1]] : pa === 'x1' ? [[x1 - 0.14, z0], [x1 - 0.14, z1]] : pa === 'z0' ? [[x0, z0 + 0.14], [x1, z0 + 0.14]] : [[x0, z1 - 0.14], [x1, z1 - 0.14]];
    const off = pa[0] === 'x' ? [0.13, 0] : [0, 0.13], sgn = pa[1] === '0' ? 1 : -1;
    g.mat('paint', '#e6dcc6'); g.tube([[run[0][0], py, run[0][1]], [run[1][0], py, run[1][1]]], 0.05, { segs: 10 });
    g.mat('cast', '#b0703a'); g.tube([[run[0][0] + off[0] * sgn, py + 0.08, run[0][1] + off[1] * sgn], [run[1][0] + off[0] * sgn, py + 0.08, run[1][1] + off[1] * sgn]], 0.022, { segs: 8 });
    g.mat('cast', '#3a3530');
    const len = Math.hypot(run[1][0] - run[0][0], run[1][1] - run[0][1]), nb = Math.max(2, Math.round(len / 1.4));
    for (let i = 0; i <= nb; i++) { const t2 = i / nb, bx = run[0][0] + (run[1][0] - run[0][0]) * t2, bz = run[0][1] + (run[1][1] - run[0][1]) * t2; g.box(bx - 0.03 - Math.abs(off[0]) * 0.8, py - 0.06, bz - 0.03 - Math.abs(off[1]) * 0.8, bx + 0.03 + Math.abs(off[0]) * 0.8, py - 0.05, bz + 0.03 + Math.abs(off[1]) * 0.8); g.box(bx - 0.008, py - 0.06, bz - 0.008, bx + 0.008, yC, bz + 0.008); }
    s.flush({ tier: 's', level: lv });
  }
}

// A picture rail and a narrow painted band round a rectangular room, on the inside faces of its walls (t = wall thickness).
export function picRail(s, x0, z0, x1, z1, y, o = {}) {
  const g = s.g, t = o.t === undefined ? 0.16 : o.t, a = x0 + t, b = x1 - t, c = z0 + t, d = z1 - t;
  g.mat('wood', o.wood || '#5a3d28');
  if (!o.skip || o.skip.indexOf('n') < 0) g.box(a, y, c, b, y + 0.045, c + 0.02);
  if (!o.skip || o.skip.indexOf('s') < 0) g.box(a, y, d - 0.02, b, y + 0.045, d);
  if (!o.skip || o.skip.indexOf('w') < 0) g.box(a, y, c, a + 0.02, y + 0.045, d);
  if (!o.skip || o.skip.indexOf('e') < 0) g.box(b - 0.02, y, c, b, y + 0.045, d);
  if (o.band) {
    g.mat('paint', o.band);
    if (!o.skip || o.skip.indexOf('n') < 0) g.box(a, y + 0.12, c, b, y + 0.2, c + 0.004, { faces: 'Z' });
    if (!o.skip || o.skip.indexOf('s') < 0) g.box(a, y + 0.12, d - 0.004, b, y + 0.2, d, { faces: 'z' });
    if (!o.skip || o.skip.indexOf('w') < 0) g.box(a, y + 0.12, c, a + 0.004, y + 0.2, d, { faces: 'X' });
    if (!o.skip || o.skip.indexOf('e') < 0) g.box(b - 0.004, y + 0.12, c, b, y + 0.2, d, { faces: 'x' });
  }
  s.flush({ tier: 's', level: o.level });
}
