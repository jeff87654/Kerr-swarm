// Props and small drawing helpers for the Flour Hall (the Keel's vat halls, deck 9, Ring Five). Everything here is drawn
// at the origin with its front toward +z, and cached by the few parameters it takes.
import { defineProp } from '../world/props.js';

export const PI = Math.PI;

export const REGION = 'keel-vats';

// The hall and its lines (frame 'keel-vats'). There is no line 4.
export const LINES = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
export const BLIGHT_LINE = 9;
export const LX0 = -160, LP = 16;                  // line i runs x[LX0 + LP i, LX0 + LP (i + 1)]
export const BLIGHT_X = LX0 + LP * LINES.indexOf(BLIGHT_LINE) + 8;
export const CURD = { x0: -152, x1: -104, z0: -28, z1: -16, h: 3.8, glass: [-150, -110], door: [-108, -106.6] };
export const SEED = { x0: -46, x1: -34, z0: 16, z1: 24, h: 3.4 };
export const HALL = {
  x0: -170, x1: 170, z: 16, h: 11.6, roomH: 3.8,
  clip: [-170.5, -0.5, -16.5, 170.5, 11.8, 16.5],
  southOpenings: [{ at: CURD.glass[0], w: CURD.glass[1] - CURD.glass[0], h: 1.8, sill: 0.9 }, { at: CURD.door[0], w: CURD.door[1] - CURD.door[0], h: 2.3 }],
  northOpenings: [{ at: BLIGHT_X - 0.7, w: 1.4, h: 2.3 }, { at: BLIGHT_X + 1.6, w: 1.0, h: 0.8, sill: 1.2 }],
};

// ---------------------------------------------------------------------------------------------------------------
// small helpers, safe when the UI or audio is missing
// ---------------------------------------------------------------------------------------------------------------
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: 6 }); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }
// Wait a frame between big parts of the build, then take the region's atlas group back (another builder may have had it).
export async function tick(game) {
  await new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });
  if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + REGION);
}
// Run fn(a, b, i) over [a0, a1] in pieces no longer than `step` (long things must be cut so the drum can bend them).
export function runX(a0, a1, step, fn) { const n = Math.max(1, Math.ceil((a1 - a0) / step)); for (let i = 0; i < n; i++) fn(a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n, i); }
export function lineX(a0, a1, y, z, step = 3) { const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / step)), out = []; for (let i = 0; i <= n; i++) out.push([a0 + (a1 - a0) * i / n, y, z]); return out; }
export function lineZ(z0, z1, x, y, step = 3) { const n = Math.max(1, Math.ceil(Math.abs(z1 - z0) / step)), out = []; for (let i = 0; i <= n; i++) out.push([x, y, z0 + (z1 - z0) * i / n]); return out; }

// ---------------------------------------------------------------------------------------------------------------
// painted numbers: one strip of glyphs in the atlas, two colourings (dark on cream, cream on red)
// ---------------------------------------------------------------------------------------------------------------
export const GLYPHS = '0123456789·ABCDEFGH ';
export function glyphAtlas(game) {
  if (!game.atlas) return null;
  return game.atlas.add(1280, 128, (ctx, w, h) => {
    const n = GLYPHS.length, cw = w / n, ch = h / 2;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) {
      ctx.fillStyle = row ? '#7a2a26' : '#efe4c8'; ctx.fillRect(i * cw, row * ch, cw + 1, ch + 1);
      ctx.fillStyle = row ? 'rgba(0,0,0,0.07)' : 'rgba(80,60,30,0.06)'; for (let k = 0; k < 6; k++) ctx.fillRect(i * cw + ((k * 37 + i * 13) % 50), row * ch + ((k * 23 + i * 7) % 56), 6, 2);
      ctx.fillStyle = row ? '#f3e6c8' : '#2a2420'; ctx.font = '600 ' + Math.round(ch * 0.84) + "px 'Barlow Condensed', sans-serif";
      ctx.fillText(GLYPHS[i], i * cw + cw / 2, row * ch + ch * 0.55);
    }
  }, 'keelvats.glyphs');
}
// Draw one glyph as a quad in the local plane z = zf, facing +z, centred at (cx, cy), w by h. Call g.atlas(R.page) first.
export function glyph(g, R, ch, row, cx, cy, zf, w, h) {
  let i = GLYPHS.indexOf(ch); if (i < 0) i = GLYPHS.length - 1;
  const n = GLYPHS.length, du = (R.u1 - R.u0) / n, dv = (R.v1 - R.v0) / 2, ins = 0.03;
  const ua = R.u0 + du * (i + ins), ub = R.u0 + du * (i + 1 - ins), vt = R.v0 + dv * (row + ins), vb = R.v0 + dv * (row + 1 - ins);
  g.quad([cx - w / 2, cy - h / 2, zf], [cx + w / 2, cy - h / 2, zf], [cx + w / 2, cy + h / 2, zf], [cx - w / 2, cy + h / 2, zf], { uv: [ua, vb, ub, vt] });
}
// A word of glyphs on a flat plate, centred at the local origin, facing +z.
export function glyphWord(g, R, text, row, cy, zf, w, h) {
  if (!R) return; g.atlas(R.page, { rough: 0.6 });
  for (let k = 0; k < text.length; k++) glyph(g, R, text[k], row, (k - (text.length - 1) / 2) * w, cy, zf, w, h);
}
// A word of glyphs wrapped round a cylinder of radius r (centred at the local origin), facing +z.
export function glyphRing(g, R, text, row, cy, r, w, h) {
  if (!R) return; g.atlas(R.page, { rough: 0.6 });
  for (let k = 0; k < text.length; k++) { g.push(); g.rotY((k - (text.length - 1) / 2) * w / r); glyph(g, R, text[k], row, 0, cy, r, w, h); g.pop(); }
}

// the loop's colours, as the rest of Chervil paints them
export const C = {
  loop: '#a8432e',        // the 65 degree loop, flow (red)
  ret: '#2f6f73',         // the loop's return (teal)
  meth: '#5b4060',        // methanol feed (purple, with yellow bands)
  warn: '#d6a640',        // the yellow of the bands
  air: '#d9d4c6',         // sterile air (white)
  water: '#2f6f8f',       // clean water (blue)
  clad: '#cdc6b6',        // vat lagging
  strap: '#4a443e',       // lagging straps
  steel: '#8d877c',
  dark: '#2c3133',
  brass: '#b08a45',
  cream: '#efe4c8',
};

// Line colours: each line's band is painted in one, so a crew can tell the lines apart from the far end.
export const LINE_COL = ['#b5532e', '#2f6f73', '#c9962e', '#33407a', '#6b7a3a', '#8a2f3c'];

// A thermophilic vat: sixty cubic metres of broth at sixty-five degrees, lagged and strapped, on a concrete plinth.
// p: { band (line colour), dark: true for a sealed vat (no glow in its sight glass, a red lamp) }
export const VAT_R = 1.78, VAT_TOP = 7.3;
defineProp('keelvats.vat', (g, p) => {
  const R = VAT_R, band = p.band || LINE_COL[0], S = 16;
  // plinth and legs
  g.mat('concrete', '#9a9184'); g.lathe(0, 0, [[R + 0.25, 0], [R + 0.25, 0.32], [R + 0.18, 0.36], [0, 0.36]], { segs: S });
  g.mat('cast', '#3d4245');
  for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2 + 0.26; const x = Math.sin(a) * (R - 0.25), z = Math.cos(a) * (R - 0.25); g.box(x - 0.09, 0.36, z - 0.09, x + 0.09, 1.25, z + 0.09, { faces: 'xXzZ' }); }
  // the dished bottom, the lagged shell, the dished top
  g.mat('brushed', '#9c968a'); g.lathe(0, 0, [[0.28, 0.95], [0.9, 1.08], [1.45, 1.3], [R, 1.62]], { segs: S, capBottom: true, capTop: false });
  g.mat('brushed', p.clad || C.clad, { rough: 0.05 }); g.lathe(0, 0, [[R, 1.62], [R, 6.62]], { segs: S, capTop: false, capBottom: false });
  g.mat('brushed', '#b9b2a2'); g.lathe(0, 0, [[R, 6.62], [R - 0.12, 6.86], [R - 0.5, 7.08], [R - 1.0, 7.22], [0, VAT_TOP]], { segs: S, capBottom: false });
  // straps and the line's band
  g.mat('cast', C.strap);
  for (const y of [1.66, 3.0, 4.4, 6.58]) g.lathe(0, 0, [[R + 0.035, y - 0.045], [R + 0.035, y + 0.045]], { segs: S, capTop: false, capBottom: false });
  g.mat('paint', band, { rough: -0.1 }); g.lathe(0, 0, [[R + 0.02, 5.0], [R + 0.02, 6.2]], { segs: S, capTop: false, capBottom: false });
  g.mat('paint', p.dark ? C.warn : '#e9dfc6'); for (const y of [4.92, 6.24]) g.lathe(0, 0, [[R + 0.03, y - 0.03], [R + 0.03, y + 0.03]], { segs: S, capTop: false, capBottom: false });
  if (p.dark) { g.mat('paint', '#262220'); for (let i = 0; i < 9; i++) { const a = -0.7 + i * 0.18; g.push(); g.rotY(a); g.box(-0.05, 4.86, R + 0.02, 0.05, 4.98, R + 0.06); g.box(-0.05, 6.18, R + 0.02, 0.05, 6.3, R + 0.06); g.pop(); } }
  // the top: a manway, the agitator's drive, a vent stack with a cap
  g.mat('brushed', '#a8a194'); g.cyl(0.75, 7.08, 0.2, 0.34, 0.24, { segs: 14 }); g.mat('cast', C.strap); g.cyl(0.75, 7.3, 0.2, 0.38, 0.05, { segs: 14 });
  g.mat('paint', '#2f5d5a'); g.cyl(0, VAT_TOP - 0.02, 0, 0.32, 0.24, { segs: 12 }); g.box(-0.24, 7.5, -0.24, 0.24, 8.05, 0.24, { faces: 'xXzZY' });
  g.mat('cast', '#3d4245'); g.cyl(0, 8.05, 0, 0.18, 0.08, { segs: 10 });
  g.mat('brushed', '#9c968a'); g.cyl(-0.8, 7.0, -0.35, 0.11, 1.6, { segs: 10 }); g.mat('cast', C.strap); g.cyl(-0.8, 8.6, -0.35, 0.2, 0.06, { segs: 10, r1: 0.05 });
  // the front: a sight glass with the broth's warm glow behind it, and a status lamp (seen from across the hall)
  g.mat('cast', C.brass, { rough: -0.15 }); g.box(-0.13, 2.2, R - 0.02, 0.13, 3.25, R + 0.07, { faces: 'xXyYZ' });
  if (p.dark) g.mat('plain', '#2a2622'); else g.mat('diffuser', '#f0a648', { emissive: 1.5 });
  g.box(-0.07, 2.3, R + 0.06, 0.07, 3.15, R + 0.075, { faces: 'Z' });
  if (p.dark) g.mat('diffuser', '#ff5040', { emissive: 3 }); else g.mat('diffuser', '#7fe08a', { emissive: 2.4 });
  g.box(0.35, 3.35, R - 0.02, 0.45, 3.45, R + 0.07, { faces: 'xXyYZ' });
  return { posts: [[0, 0, R + 0.1, 0, VAT_TOP]], tier: 's', cast: false };
});
// What only shows close to a vat: the lamp's housing, a sample port and its valve, a gauge, a ladder up the back.
defineProp('keelvats.vatnear', (g) => {
  const R = VAT_R;
  g.mat('cast', C.dark); g.box(0.3, 3.3, R - 0.02, 0.5, 3.5, R + 0.05, { faces: 'xXyY' });
  g.mat('brushed', '#b9b2a2'); g.tube([[-0.5, 1.45, R - 0.1], [-0.5, 1.45, R + 0.25], [-0.5, 1.2, R + 0.32]], 0.035, { segs: 6 });
  g.mat('cast', '#a63c28'); g.cyl(-0.5, 1.48, R + 0.12, 0.09, 0.02, { segs: 10 }); g.tube([[-0.5, 1.45, R + 0.12], [-0.5, 1.5, R + 0.12]], 0.012, { segs: 4 });
  g.mat('cast', C.brass); g.push(); g.move(-0.42, 3.85, R + 0.04); g.rotX(PI / 2); g.cyl(0, -0.06, 0, 0.11, 0.06, { segs: 14 }); g.pop();
  g.mat('paint', C.cream, { emissive: 0.2 }); g.box(-0.51, 3.76, R + 0.1, -0.33, 3.94, R + 0.105, { faces: 'Z' });
  g.mat('paint', '#a63c28'); g.box(-0.425, 3.84, R + 0.106, -0.36, 3.86, R + 0.108, { faces: 'Z' });
  g.mat('cast', '#3d4245');
  for (const sx of [-0.22, 0.22]) g.tube([[sx, 1.3, -R - 0.18], [sx, 7.2, -R - 0.18], [sx * 0.8, 7.5, -R + 0.35]], 0.02, { segs: 5 });
  for (let y = 1.6; y < 7.0; y += 0.45) g.box(-0.22, y - 0.012, -R - 0.2, 0.22, y + 0.012, -R - 0.16, { faces: 'yYzZ' });
  return { tier: 'd', cast: false };
});

// A small polished yeast fermenter for Curd Row: casein and whey, two cubic metres, on three legs. p: { band }
defineProp('keelvats.pot', (g, p) => {
  const R = 0.72, S = 16;
  g.mat('brushed', '#d8d6d0', { rough: -0.25 });
  g.lathe(0, 0, [[0.12, 0.45], [0.5, 0.52], [R, 0.72], [R, 2.35], [R - 0.06, 2.5], [0.4, 2.62], [0, 2.66]], { segs: S });
  g.mat('brushed', '#b8b6b0'); for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + PI / 6; g.tube([[Math.sin(a) * 0.8, 0, Math.cos(a) * 0.8], [Math.sin(a) * 0.66, 0.9, Math.cos(a) * 0.66]], 0.035, { segs: 6 }); }
  g.mat('paint', p.band || LINE_COL[1]); g.lathe(0, 0, [[R + 0.01, 1.75], [R + 0.01, 2.05]], { segs: S, capTop: false, capBottom: false });
  g.mat('brushed', '#c8c6c0'); g.cyl(0, 2.6, 0, 0.12, 0.35, { segs: 10 }); g.cyl(0.32, 2.5, 0.1, 0.05, 0.4, { segs: 8 });
  g.mat('cast', C.dark); g.box(-0.08, 1.2, R - 0.02, 0.08, 1.6, R + 0.04, { bevel: 0.01 });
  g.mat('diffuser', '#f3ead2', { emissive: 1.2 }); g.box(-0.04, 1.24, R + 0.04, 0.04, 1.56, R + 0.05, { faces: 'Z' });
  g.mat('diffuser', '#7fe08a', { emissive: 2.2 }); g.ball(0.22, 1.9, R + 0.02, 0.03, 0.03, 0.02, { segs: 8, rings: 5 });
  g.mat('brushed', '#c8c6c0'); g.tube([[0, 0.5, 0], [0, 0.3, 0.4], [0, 0.3, 0.95]], 0.04, { segs: 6 });
  return { posts: [[0, 0, R + 0.05, 0, 2.7]], tier: 's', cast: true };
});

// A stainless bench with a steel shelf under it. p: { w, d, h }
defineProp('keelvats.bench', (g, p) => {
  const w = p.w || 2.4, d = p.d || 0.7, h = p.h || 0.9;
  g.mat('brushed', '#cfcdc6', { rough: -0.2 }); g.box(-w / 2, h - 0.04, -d / 2, w / 2, h, d / 2, { bevel: 0.01 });
  g.box(-w / 2 + 0.05, 0.18, -d / 2 + 0.05, w / 2 - 0.05, 0.21, d / 2 - 0.05);
  g.mat('brushed', '#a9a7a0'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.06) - 0.025, 0, sz * (d / 2 - 0.06) - 0.025, sx * (w / 2 - 0.06) + 0.025, h - 0.04, sz * (d / 2 - 0.06) + 0.025);
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], surf: 'metal', tier: 'd' };
});

// A porter's trolley with sacks of flour on it. p: { sacks }
defineProp('keelvats.trolley', (g, p) => {
  g.mat('cast', '#2f5d5a'); g.box(-0.7, 0.22, -0.45, 0.7, 0.27, 0.45, { bevel: 0.01 });
  g.tube([[-0.7, 0.27, -0.45], [-0.8, 1.05, -0.45], [-0.8, 1.05, 0.45], [-0.7, 0.27, 0.45]], 0.02, { segs: 5 });
  g.mat('cast', C.dark); for (const sx of [-0.55, 0.55]) for (const sz of [-0.38, 0.38]) { g.push(); g.move(sx, 0.11, sz); g.rotX(PI / 2); g.cyl(0, -0.03, 0, 0.1, 0.06, { segs: 10 }); g.pop(); }
  const n = p.sacks === undefined ? 4 : p.sacks;
  const tints = ['#e8dcc0', '#ddd0b0', '#efe6d0', '#d9cba8'];
  for (let i = 0; i < n; i++) { const x = -0.35 + (i % 2) * 0.7, y = 0.27 + Math.floor(i / 2) * 0.24, z = 0; g.mat('weave', tints[i % 4]); g.box(x - 0.32, y, z - 0.38, x + 0.32, y + 0.24, z + 0.38, { bevel: 0.07 }); g.mat('paint', '#8a2f3c'); g.box(x - 0.12, y + 0.08, z + 0.381, x + 0.12, y + 0.16, z + 0.39, { faces: 'Z' }); }
  return { solid: [[-0.8, 0, -0.5, 0.75, 0.9, 0.5]], tier: 'd' };
});

// A plate heat exchanger: the loop's heat handed from the vats' water to the city's. p: { plates }
defineProp('keelvats.exchanger', (g, p) => {
  const n = p.plates || 40, L = 3.2;
  g.mat('paint', '#2f5d5a'); g.box(-L / 2 - 0.25, 0, -0.55, -L / 2, 2.5, 0.55, { bevel: 0.02 }); g.box(L / 2, 0, -0.55, L / 2 + 0.25, 2.3, 0.55, { bevel: 0.02 });
  g.mat('cast', '#3d4245'); g.box(-L / 2, 2.2, -0.08, L / 2 + 0.25, 2.32, 0.08); g.box(-L / 2, 0.2, -0.06, L / 2 + 0.25, 0.3, 0.06);
  g.mat('brushed', '#b9b4a8', { rough: -0.1 });
  for (let i = 0; i < n; i++) { const x = -L / 2 + 0.05 + i * (L - 0.6) / n; g.box(x, 0.32, -0.48, x + (L - 0.6) / n * 0.7, 2.18, 0.48); }
  g.mat('cast', '#3d4245'); for (const y of [0.5, 1.2, 1.9]) for (const sz of [-0.62, 0.62]) g.tube([[-L / 2 - 0.3, y, sz], [L / 2 + 0.3, y, sz]], 0.03, { segs: 5 });
  // four ports on the fixed end: flow and return on each side
  const ports = [[0.6, 1.9, C.loop], [-0.3, 1.9, C.loop], [0.6, 0.6, C.ret], [-0.3, 0.6, C.ret]];
  for (const q of ports) { g.mat('cast', q[2]); g.push(); g.move(-L / 2 - 0.25, q[1], q[0] * 0.5); g.rotZ(PI / 2); g.cyl(0, 0, 0, 0.16, 0.6, { segs: 12 }); g.pop(); g.mat('cast', C.strap); g.push(); g.move(-L / 2 - 0.4, q[1], q[0] * 0.5); g.rotZ(PI / 2); g.cyl(0, 0, 0, 0.22, 0.06, { segs: 12 }); g.pop(); }
  return { solid: [[-L / 2 - 0.9, 0, -0.65, L / 2 + 0.3, 2.5, 0.65]], tier: 's', cast: true, surf: 'metal' };
});

// A locker bank with coveralls on hooks beside it. p: { n, paint }
defineProp('keelvats.lockers', (g, p) => {
  const n = p.n || 6, w = 0.45;
  for (let i = 0; i < n; i++) {
    const x = -n * w / 2 + i * w;
    g.mat('panel', i % 4 === 2 ? '#8a6d3b' : (p.paint || '#2f5d5a'), { rough: -0.05 }); g.box(x + 0.01, 0.12, -0.25, x + w - 0.01, 1.9, 0.25, { bevel: 0.008 });
    g.mat('cast', '#2a2622'); for (let k = 0; k < 4; k++) g.box(x + 0.1, 1.55 + k * 0.05, 0.25, x + w - 0.1, 1.57 + k * 0.05, 0.255);
    g.mat('cast', C.brass); g.box(x + w - 0.1, 1.0, 0.25, x + w - 0.07, 1.12, 0.27);
    g.mat('paper', '#efe6d2'); g.box(x + 0.12, 1.75, 0.251, x + w - 0.12, 1.82, 0.256, { faces: 'Z' });
  }
  g.mat('wood', '#5b4636'); g.box(-n * w / 2, 0, -0.25, n * w / 2, 0.12, 0.25);
  return { solid: [[-n * w / 2, 0, -0.26, n * w / 2, 1.9, 0.26]], tier: 'd' };
});

// A coverall hanging from a peg: body, sleeves, a bright mend at one knee. p: { cloth, mend }
defineProp('keelvats.coverall', (g, p) => {
  g.mat('weave', p.cloth || '#3a5a7a');
  g.box(-0.22, 0.75, -0.05, 0.22, 1.45, 0.05, { bevel: 0.03 });
  g.box(-0.2, 0.0, -0.045, -0.02, 0.78, 0.045, { bevel: 0.02 }); g.box(0.02, 0.0, -0.045, 0.2, 0.78, 0.045, { bevel: 0.02 });
  g.box(-0.31, 0.85, -0.04, -0.21, 1.42, 0.04, { bevel: 0.02 }); g.box(0.21, 0.85, -0.04, 0.31, 1.42, 0.04, { bevel: 0.02 });
  g.mat('knit', p.mend || '#d6a640'); g.box(0.04, 0.3, 0.04, 0.18, 0.44, 0.052, { faces: 'Z' });
  g.mat('cast', C.brass); g.cyl(0, 1.45, 0, 0.012, 0.08, { segs: 5 });
  return { tier: 'd', cast: false };
});

// The canteen's long table with its benches, and lidded dishes down the middle. p: { w, wood, lids: [colours] }
defineProp('keelvats.longtable', (g, p) => {
  const w = p.w || 4.2, wood = p.wood || '#6b4a2f';
  g.mat('wood', wood, { rough: -0.08 }); g.box(-w / 2, 0.7, -0.45, w / 2, 0.75, 0.45, { bevel: 0.012 });
  g.mat('wood', '#4a3424'); for (const sx of [-1, 1]) { const x = sx * (w / 2 - 0.3); g.box(x - 0.04, 0, -0.38, x + 0.04, 0.7, -0.3); g.box(x - 0.04, 0, 0.3, x + 0.04, 0.7, 0.38); g.box(x - 0.05, 0, -0.42, x + 0.05, 0.06, 0.42); }
  g.box(-w / 2 + 0.3, 0.32, -0.03, w / 2 - 0.3, 0.38, 0.03);
  // benches each side
  for (const sz of [-1, 1]) {
    g.mat('wood', wood); g.box(-w / 2 + 0.1, 0.42, sz * 0.78 - 0.16, w / 2 - 0.1, 0.46, sz * 0.78 + 0.16, { bevel: 0.01 });
    g.mat('wood', '#4a3424'); for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.4) - 0.03, 0, sz * 0.78 - 0.13, sx * (w / 2 - 0.4) + 0.03, 0.42, sz * 0.78 + 0.13);
  }
  // lidded dishes along the middle, and a stack of plates
  const lids = p.lids || ['#b5532e', '#2f6f73', '#c9962e'];
  for (let i = 0; i < 3; i++) {
    const x = -w / 2 + w * (i + 0.5) / 3;
    g.mat('glaze', '#e9e1cf', { rough: -0.3 }); g.lathe(x, 0, [[0, 0.75], [0.16, 0.75], [0.19, 0.8], [0.19, 0.84]], { segs: 14, capTop: false });
    g.mat('cast', lids[i % lids.length], { rough: -0.15 }); g.lathe(x, 0, [[0.2, 0.84], [0.17, 0.9], [0.06, 0.93], [0.03, 0.97], [0, 0.98]], { segs: 14, capBottom: false });
  }
  g.mat('glaze', '#d9cfb8'); g.cyl(-w / 2 + 0.35, 0.75, 0.2, 0.12, 0.08, { segs: 12 });
  const spots = [];
  const n = Math.max(2, Math.floor(w / 0.65));
  for (let i = 0; i < n; i++) { const x = -w / 2 + (i + 0.5) * w / n; spots.push({ type: 'sit', x, y: 0.46, z: 0.78, yaw: PI, tags: ['eat', 'chat'], tableH: 0.75 }); spots.push({ type: 'sit', x, y: 0.46, z: -0.78, yaw: 0, tags: ['eat', 'chat'], tableH: 0.75 }); }
  return { solid: [[-w / 2, 0.3, -0.46, w / 2, 0.75, 0.46]], spots, tier: 'd', surf: 'wood' };
});

// A high-bay pendant: a green enamel dome on a rod, its bulb glowing. p: { drop }
defineProp('keelvats.pendant', (g, p) => {
  const drop = p.drop || 1.2;
  g.mat('cast', '#2f3a36'); g.tube([[0, 0, 0], [0, -drop, 0]], 0.02, { segs: 5 });
  g.mat('cast', '#2f5d4a', { rough: -0.2 }); g.lathe(0, 0, [[0.62, -drop - 0.42], [0.5, -drop - 0.25], [0.2, -drop - 0.06], [0.08, -drop]], { segs: 12, capTop: true, capBottom: false });
  g.mat('paint', '#efe4c8'); g.lathe(0, 0, [[0.6, -drop - 0.41], [0.48, -drop - 0.25], [0, -drop - 0.07]], { segs: 12, capTop: false, capBottom: false });
  g.mat('diffuser', '#ffc070', { emissive: 6 }); g.ball(0, -drop - 0.3, 0, 0.16, 0.16, 0.16, { segs: 8, rings: 5 });
  return { tier: 's', cast: false };
});

// The desk at the Pass: a long sloped console of switches and lamps, a ledger, a lidded cup. p: { w }
defineProp('keelvats.desk', (g, p) => {
  const w = p.w || 6;
  g.mat('wood', '#5b4636', { rough: -0.1 }); g.box(-w / 2, 0.72, -0.4, w / 2, 0.77, 0.45, { bevel: 0.012 });
  g.mat('panel', '#2f5d5a'); g.box(-w / 2 + 0.05, 0, -0.38, w / 2 - 0.05, 0.72, -0.3);
  for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.05) - 0.05, 0, -0.38, sx * (w / 2 - 0.05) + 0.05, 0.72, 0.4);
  // the sloped console along the back edge
  g.extrude([[-0.4, 0.77], [-0.05, 0.77], [-0.25, 1.12], [-0.4, 1.12]], -w / 2 + 0.1, w / 2 - 0.1, 'x');
  const cols = ['#7fe08a', '#7fe08a', '#7fe08a', '#f2b56b', '#7fe08a', '#ff5040'];
  for (let i = 0; i < Math.floor((w - 0.4) / 0.12); i++) for (let k = 0; k < 3; k++) {
    const x = -w / 2 + 0.25 + i * 0.12, y = 0.83 + k * 0.1, z = -0.1 - k * 0.057;
    if ((i * 7 + k * 3) % 5 === 0) { g.mat('cast', '#d9d4c6'); g.box(x - 0.012, y - 0.01, z - 0.01, x + 0.012, y + 0.03, z + 0.02); }
    else { g.mat('diffuser', cols[(i * 5 + k * 11) % cols.length], { emissive: 2 }); g.box(x - 0.02, y, z, x + 0.02, y + 0.02, z + 0.02); }
  }
  return { solid: [[-w / 2, 0, -0.42, w / 2, 1.12, 0.46]], tier: 'd' };
});

// A wall-mounted 65 degree tap on its red riser, a brass spout, a drip tray. p: {}
defineProp('keelvats.tap', (g) => {
  g.mat('cast', C.loop, { rough: -0.05 }); g.tube([[0, 0, 0.1], [0, 1.25, 0.1], [0, 1.25, 0.28]], 0.05, { segs: 8 });
  g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[0, 1.25, 0.28], [0, 1.3, 0.38], [0, 1.18, 0.44]], 0.025, { segs: 6 });
  g.cyl(0, 1.32, 0.3, 0.04, 0.05, { segs: 8 }); g.box(-0.1, 1.36, 0.27, 0.1, 1.38, 0.33);
  g.mat('brushed', '#b9b4a8'); g.box(-0.22, 0.9, 0.25, 0.22, 0.94, 0.6, { bevel: 0.01 });
  return { tier: 'd' };
});
