// Props, numbers and small helpers for the Measure (Chervil's mile, deck 52, Ring Seven) and the Tin (its spinball hall).
// Everything here is drawn at the origin with its front toward +z, unless it says otherwise.
//
// Frame 'mile-hall': x spinward, z toward the back cap, y up. The track runs from the home line at x = 0 to the far line
// at x = MILE, in 20 m bays. Across it (z): the front wall at -3.6, four lanes of 1.5 m from -3.2 to 2.8 (lane 1 by the
// rail), the rail at 3.05, the spectators' walk to the outer wall at 5.0. Ceiling at 3.6.
import { defineProp } from '../world/props.js';
import { DRUM } from '../core/drum.js';

export const PI = Math.PI;
export const REGION = 'mile-hall';
export const MILE = 1609.34;
export const BAY = 20, NBAY = 81;                     // bays x[0, 1620]
export const TR = { front: -3.6, l0: -3.2, l1: 2.8, rail: 3.05, wall: 5.0, h: 3.6, mid: -0.2 };
export const LANE_Z = [2.05, 0.55, -0.95, -2.45];     // lane 1 to 4, centres
export const QUARTERS = [MILE / 4, MILE / 2, MILE * 3 / 4];

// the palette: a red sprung floor, cream lines, ochre numbers, pads in four colours, warm plaster, a dark ceiling
export const C = {
  track: '#a4442e', line: '#efe6d2', ochre: '#e3a83a', plaster: '#e2d1b0', ceil: '#2c3638', beam: '#cdbd98',
  walk: '#8a6440', brass: '#b08a45', iron: '#3a3f3d', teal: '#2f6f73', red: '#7a2f3c', indigo: '#33407a', saffron: '#c98a2e',
  leaf: '#4f7f3a', cream: '#f2e8d2', wood: '#7a5233', dark: '#2a211b',
};
export const PADS = [C.teal, C.red, C.saffron, C.indigo];

// ---------------------------------------------------------------------------------------------------------------
// helpers, safe when the UI or audio is missing
// ---------------------------------------------------------------------------------------------------------------
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export function toast(game, text, kind, dur) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: dur || 6 }); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }
export function find(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
export function custom(game, term) { if (game.journal && game.journal.custom) game.journal.custom(term); }
// Wait a frame between big parts of the build, then take the region's atlas group back.
export async function tick(game) {
  await new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 40); });
  if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + REGION);
}
// m:ss.s
export function fmtTime(sec, tenths = true) {
  const m = Math.floor(sec / 60), s = sec - m * 60;
  const ss = tenths ? s.toFixed(1) : String(Math.floor(s));
  return m + ':' + (s < 10 ? '0' : '') + ss;
}
// weight in g at deck 52 for a body moving spinward at v m/s (negative for anti)
export function gAtSpeed(f, v) { return f.weight(0, v); }
export function floorSpeed(f) { return f.rho0 * DRUM.OMEGA; }

// A sitting place: E to sit, E to stand. yaw is the way the sitter faces (prop convention: 0 faces +z).
export function seat(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + 0.55, z, radius: o.radius || 1.0,
    prompt: (game) => (game.player.seat ? 'Stand up' : label),
    onUse(game) {
      const p = game.player; if (p.seat) { p.stand(); return; }
      p.sit({ x, y, z, yaw: PI - yaw, eye: o.eye || 1.12 }); p.yaw = PI - yaw; p.pitch = o.pitch || 0.02;
      if (o.onSit) o.onSit(game);
    } });
}

// Cut [a0, a1] into pieces no longer than step.
export function runX(a0, a1, step, fn) { const n = Math.max(1, Math.ceil((a1 - a0) / step)); for (let i = 0; i < n; i++) fn(a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n, i); }

// ---------------------------------------------------------------------------------------------------------------
// The painted sheet: one atlas rect for every painted thing that does not change (floor numbers, the Tin's arrows,
// the records board), and one for the things that do (the two clocks and the day's times).
// ---------------------------------------------------------------------------------------------------------------
const CAPS = "'Barlow Condensed', sans-serif", SERIF = "'Cormorant Garamond', serif", SANS = "'Barlow', sans-serif";
export const GLYPHS = '0123456789¼½¾ ';
export const SHEET = { W: 1024, H: 1024, cellW: 73, cellH: 112, arrowY: 232, arrowW: 512, arrowH: 128, recY: 504 };
export const LIVE = { W: 1024, H: 512, clockW: 512, clockH: 160, farY: 176, timesX: 528 };

// the sub-rect (u0, v0, u1, v1) of an atlas rect R, for a box (x, y, w, h) in its own pixels
export function sub(R, W, H, x, y, w, h) {
  const du = R.u1 - R.u0, dv = R.v1 - R.v0;
  return { u0: R.u0 + du * x / W, u1: R.u0 + du * (x + w) / W, v0: R.v0 + dv * y / H, v1: R.v0 + dv * (y + h) / H };
}

function fitFont(ctx, text, font, size, maxW) { let s = size; ctx.font = font.replace('$', s); while (s > 6 && ctx.measureText(text).width > maxW) { s -= 1; ctx.font = font.replace('$', s); } return s; }
function grain(ctx, w, h, n, a) { let k = 7; for (let i = 0; i < n; i++) { k = (k * 16807) % 2147483647; const x = (k % 1000) / 1000 * w; k = (k * 16807) % 2147483647; const y = (k % 1000) / 1000 * h; ctx.globalAlpha = a; ctx.fillRect(x, y, 3 + (k % 5), 1 + (k % 2)); } ctx.globalAlpha = 1; }

export const RECORDS = {
  heavy: [['Teodor Ansah', 'Ring Seven', '3:46.8', 339], ['Mirela Okonkwo-Vass', 'Ring Six', '3:48.3', 331], ['Hamid Sorensen', 'Ring Seven', '3:49.0', 322], ['Yuki Barra', 'Ring Eight', '3:50.7', 318], ['Lio Castellanos', 'Ring Five', '3:51.2', 296]],
  light: [['Asel Quiroga', 'Ring Seven', '3:31.9', 337], ['Sunniva Achterberg', 'Ring Two', '3:33.4', 340], ['Dara Nwosu', 'Ring Seven', '3:34.0', 329], ['Imke Halvorsen', 'Ring Four', '3:35.8', 312], ['Bao Fennimore', 'Ring Six', '3:36.1', 301]],
};

export function drawSheet(ctx, w, h) {
  const S = SHEET; ctx.clearRect(0, 0, w, h);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // two rows of glyphs: cream (distance numbers), ochre (lane numbers)
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < GLYPHS.length; i++) {
      const ch = GLYPHS[i]; if (ch === ' ') continue;
      const cx = i * S.cellW + S.cellW / 2, cy = row * S.cellH + S.cellH / 2;
      ctx.fillStyle = row ? '#e9b23c' : '#f3ecdc';
      ctx.font = '700 ' + Math.round(S.cellH * 0.98) + 'px ' + CAPS;
      ctx.fillText(ch, cx, cy + S.cellH * 0.04);
      // wear: a few bites out of the paint where spikes and shoes have scuffed it
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      let k = 31 + i * 7 + row * 13; for (let n = 0; n < 26; n++) { k = (k * 48271) % 2147483647; const x = i * S.cellW + (k % S.cellW); k = (k * 48271) % 2147483647; const y = row * S.cellH + (k % S.cellH); ctx.globalAlpha = 0.5 + (k % 50) / 100; ctx.fillRect(x, y, 2 + (k % 6), 1 + (k % 3)); }
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }
  // the Tin's three arrows: TRUE (along the axis), SINKS (spinward), FLOATS (anti). Each points right in its cell.
  const ARR = [['TRUE', '#f3ecdc'], ['SINKS', '#e9b23c'], ['FLOATS', '#5fc4c8']];
  ARR.forEach((a, i) => {
    const x0 = (i % 2) * S.arrowW, y0 = S.arrowY + Math.floor(i / 2) * (S.arrowH + 8), aw = S.arrowW, ah = S.arrowH;
    ctx.fillStyle = a[1]; ctx.beginPath();
    ctx.moveTo(x0 + aw * 0.02, y0 + ah * 0.3); ctx.lineTo(x0 + aw * 0.76, y0 + ah * 0.3); ctx.lineTo(x0 + aw * 0.76, y0 + ah * 0.04); ctx.lineTo(x0 + aw * 0.98, y0 + ah * 0.5);
    ctx.lineTo(x0 + aw * 0.76, y0 + ah * 0.96); ctx.lineTo(x0 + aw * 0.76, y0 + ah * 0.7); ctx.lineTo(x0 + aw * 0.02, y0 + ah * 0.7); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    const sz = fitFont(ctx, a[0], '700 $px ' + CAPS, ah * 0.36, aw * 0.6); ctx.font = '700 ' + sz + 'px ' + CAPS; ctx.fillText(a[0], x0 + aw * 0.4, y0 + ah * 0.52);
    let k = 97 + i * 11; for (let n = 0; n < 160; n++) { k = (k * 48271) % 2147483647; const x = x0 + (k % aw); k = (k * 48271) % 2147483647; const y = y0 + (k % ah); ctx.globalAlpha = 0.3 + (k % 60) / 100; ctx.fillRect(x, y, 2 + (k % 7), 1 + (k % 3)); }
    ctx.restore(); ctx.globalAlpha = 1;
  });
  // the fourth arrow cell holds a small painted ring (the Tin's centre spot)
  { const x0 = S.arrowW, y0 = S.arrowY + S.arrowH + 8, cx = x0 + 64, cy = y0 + 64;
    ctx.strokeStyle = '#f3ecdc'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy, 52, 0, PI * 2); ctx.stroke();
    ctx.fillStyle = '#e9b23c'; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, PI * 2); ctx.fill(); }
  // the records board, opaque
  const y0 = S.recY, rh = h - y0;
  ctx.fillStyle = '#1c2a26'; ctx.fillRect(0, y0, w, rh);
  ctx.fillStyle = '#ffffff'; grain(ctx, w, rh, 300, 0.025);
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 4; ctx.strokeRect(14, y0 + 14, w - 28, rh - 28);
  ctx.fillStyle = '#f1e2b8'; ctx.textAlign = 'center';
  ctx.font = 'italic 600 46px ' + SERIF; ctx.fillText('Records of the Measure', w / 2, y0 + 52);
  ctx.fillStyle = '#a99f90'; ctx.font = '500 19px ' + CAPS; ctx.fillText('ONE MILE · 1,609 METRES · DECK 52 · YEAR COUNTED FROM THE COUNT', w / 2, y0 + 86);
  const col = (x, title, sub2, list, accent) => {
    ctx.textAlign = 'left'; ctx.fillStyle = accent; ctx.font = '700 30px ' + CAPS; ctx.fillText(title, x, y0 + 130);
    ctx.fillStyle = '#c8bfae'; ctx.font = 'italic 500 21px ' + SERIF; ctx.fillText(sub2, x, y0 + 160);
    ctx.fillStyle = accent; ctx.fillRect(x, y0 + 178, 440, 2);
    list.forEach((r, i) => {
      const y = y0 + 212 + i * 44;
      ctx.fillStyle = i === 0 ? '#ffe3a8' : '#efe6d2'; ctx.textAlign = 'left'; ctx.font = (i === 0 ? '700 ' : '500 ') + '26px ' + CAPS; ctx.fillText(r[2], x, y);
      ctx.font = '500 22px ' + SANS; ctx.fillText(r[0], x + 92, y - 2);
      ctx.fillStyle = '#a99f90'; ctx.font = '500 16px ' + CAPS; ctx.fillText(r[1].toUpperCase(), x + 92, y + 17);
      ctx.textAlign = 'right'; ctx.fillStyle = '#c8bfae'; ctx.font = '500 20px ' + CAPS; ctx.fillText(String(r[3]), x + 440, y);
    });
  };
  col(48, 'THE HEAVY MILE', 'spinward, from the home line', RECORDS.heavy, '#e9b23c');
  col(536, 'THE LIGHT MILE', 'anti, from the far line', RECORDS.light, '#5fc4c8');
  ctx.textAlign = 'center'; ctx.fillStyle = '#c8bfae'; ctx.font = 'italic 500 22px ' + SERIF;
  ctx.fillText('The two are never added together, and never compared out loud in this hall.', w / 2, y0 + rh - 44);
}

// the live sheet: the home clock, the far clock (both double-faced), and the day's times
export function drawClock(ctx, x0, y0, w, h, big, line, hot) {
  ctx.fillStyle = '#101614'; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = '#3a4a44'; ctx.lineWidth = 3; ctx.strokeRect(x0 + 4, y0 + 4, w - 8, h - 8);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = hot ? '#ffd36a' : '#f3e6c8'; ctx.font = '600 ' + Math.round(h * 0.56) + 'px ' + CAPS; ctx.fillText(big, x0 + w / 2, y0 + h * 0.4);
  ctx.fillStyle = '#3fe0d0'; const s = fitFont(ctx, line, '600 $px ' + CAPS, Math.round(h * 0.17), w * 0.9); ctx.font = '600 ' + s + 'px ' + CAPS; ctx.fillText(line, x0 + w / 2, y0 + h * 0.82);
}
export function drawTimes(ctx, x0, y0, w, h, rows, title) {
  ctx.fillStyle = '#1b1f2a'; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3; ctx.strokeRect(x0 + 8, y0 + 8, w - 16, h - 16);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillStyle = '#f1e2b8'; ctx.font = 'italic 600 38px ' + SERIF; ctx.fillText(title, x0 + w / 2, y0 + 40);
  ctx.fillStyle = '#a99f90'; ctx.font = '500 16px ' + CAPS; ctx.fillText('CHALKED BY THE TIMEKEEPER · WIPED AT LAMP-NIGHT', x0 + w / 2, y0 + 70);
  let y = y0 + 102;
  for (const sec of rows) {
    ctx.textAlign = 'left'; ctx.fillStyle = sec.accent; ctx.font = '700 22px ' + CAPS; ctx.fillText(sec.title, x0 + 26, y); y += 10;
    ctx.fillStyle = sec.accent; ctx.fillRect(x0 + 26, y, w - 52, 2); y += 22;
    for (const r of sec.list) {
      ctx.fillStyle = r.you ? '#ffe3a8' : '#e9e1cf'; ctx.textAlign = 'left'; ctx.font = (r.you ? '700 ' : '500 ') + '21px ' + SANS; ctx.fillText(r.name, x0 + 30, y);
      ctx.textAlign = 'right'; ctx.font = (r.you ? '700 ' : '500 ') + '22px ' + CAPS; ctx.fillText(r.time, x0 + w - 30, y);
      if (r.you) { ctx.fillStyle = '#ffe3a8'; ctx.fillRect(x0 + 18, y - 9, 6, 18); }
      y += 28;
    }
    y += 12;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The bay: 20 m of the Measure. p: { c: pad colour index, gap: rail gap at its start, door: a door in the outer wall }
// Drawn from x = 0 to 20, at the frame's own z. Everything here is structure (seen to 340 m, casts no shadow).
// ---------------------------------------------------------------------------------------------------------------
defineProp('mile.bay', (g, p) => {
  const L = BAY, F = TR.front, H = TR.h;
  // the sprung floor, lane lines, run-off strip
  g.mat('speckle', C.track, { rough: 0.1 }); g.box(0, -0.02, F, L, 0, TR.l1 + 0.25, { faces: 'Y' });
  g.mat('speckle', '#7e3524', { rough: 0.15 }); g.box(0, -0.02, F, L, 0.001, TR.l0, { faces: 'Y' });
  g.mat('paint', C.line, { rough: -0.1 });
  for (const z of [-3.2, -1.7, -0.2, 1.3, 2.8]) g.box(0, 0, z - 0.025, L, 0.003, z + 0.025, { faces: 'Y' });
  // the kerb: a low ochre-and-cream lip under the rail
  for (let i = 0; i < 4; i++) { g.mat('paint', i % 2 ? C.cream : C.ochre, { rough: -0.05 }); g.box(i * 5, 0, 2.98, i * 5 + 5, 0.06, 3.12, { faces: 'yYzZ', bevel: 0.01 }); }
  // the spectators' walk: boards, a worn strip, a skirting
  g.mat('planks', C.walk); g.box(0, -0.02, 3.12, L, 0, TR.wall, { faces: 'Y' });
  g.mat('rush', '#9a8662'); g.box(0, 0, 3.7, L, 0.006, 4.3, { faces: 'Y' });
  // front wall: padded mats to 1.6 m in this bay's colour, seams, a brass rail cap, plaster above, a painted band
  const pad = PADS[p.c || 0];
  for (let i = 0; i < 8; i++) { g.mat('weave', i % 3 === 1 ? shade(pad, 0.9) : pad, { rough: 0.2 }); g.box(i * 2.5 + 0.03, 0.12, F, i * 2.5 + 2.47, 1.6, F + 0.1, { faces: 'xXyYZ', bevel: 0.03 }); }
  g.mat('wood', '#3a2d22'); g.box(0, 0, F, L, 0.12, F + 0.06, { faces: 'yYZ' });
  g.mat('cast', C.brass, { rough: -0.15 }); g.box(0, 1.6, F, L, 1.66, F + 0.13, { faces: 'yYZ' });
  g.mat('plaster', C.plaster); g.box(0, 1.66, F - 0.1, L, H, F, { faces: 'Z' });
  g.mat('paint', pad); g.box(0, 2.9, F, L, 3.05, F + 0.005, { faces: 'Z' });
  // outer wall: tiled dado, plaster, a picture rail
  g.mat('tile', '#2f6f73', { rough: -0.2 }); g.box(0, 0, TR.wall, L, 1.05, TR.wall + 0.1, { faces: 'z' });
  g.mat('wood', '#4a3424'); g.box(0, 1.05, TR.wall - 0.03, L, 1.11, TR.wall, { faces: 'yzY' }); g.box(0, 0, TR.wall - 0.02, L, 0.12, TR.wall, { faces: 'zY' });
  g.mat('plaster', '#d9c7a6'); g.box(0, 1.11, TR.wall, L, H, TR.wall + 0.1, { faces: 'z' });
  g.mat('wood', '#4a3424'); g.box(0, 2.62, TR.wall - 0.03, L, 2.66, TR.wall, { faces: 'yzY' });
  // the ceiling: dark panels, cream beams every 5 m, a cable tray over the walk, a duct over the front wall
  g.mat('panel', C.ceil); g.box(0, H, F, L, H + 0.05, TR.wall, { faces: 'y' });
  g.mat('paint', C.beam, { rough: -0.05 }); for (let i = 0; i < 4; i++) g.box(i * 5 - 0.12, H - 0.24, F, i * 5 + 0.12, H, TR.wall, { faces: 'xXy' });
  g.mat('cast', '#5a5f5a'); g.box(0, H - 0.3, 4.1, L, H - 0.26, 4.6, { faces: 'yY' }); g.box(0, H - 0.3, 4.1, L, H - 0.22, 4.13, { faces: 'zZ' }); g.box(0, H - 0.3, 4.57, L, H - 0.22, 4.6, { faces: 'zZ' });
  g.mat('brushed', '#8a8478'); g.box(0, H - 0.7, F + 0.05, L, H - 0.24, F + 0.55, { faces: 'yZ' });
  // the rail: brass top, iron posts and a mid rail, with a gap for crossing
  const r0 = p.gap ? 1.4 : 0;
  g.mat('cast', C.iron); for (let x = r0 + 1.25; x < L; x += 2.5) g.tube([[x, 0.06, TR.rail], [x, 1.05, TR.rail]], 0.025, { segs: 6 });
  if (p.gap) for (const x of [0.02, r0]) g.tube([[x, 0.06, TR.rail], [x, 1.08, TR.rail]], 0.035, { segs: 6 });
  g.tube([[r0, 0.55, TR.rail], [L, 0.55, TR.rail]], 0.012, { segs: 5 });
  g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[r0, 1.06, TR.rail], [L, 1.06, TR.rail]], 0.032, { segs: 8 });
  // a door in the outer wall: a stair to the decks above and below
  if (p.door) {
    const dx = 10;
    g.mat('paint', '#3f5a4e'); g.box(dx - 0.55, 0.0, TR.wall - 0.04, dx + 0.55, 2.1, TR.wall - 0.01, { faces: 'z' });
    g.mat('wood', '#2f2620'); g.box(dx - 0.68, 0, TR.wall - 0.08, dx - 0.55, 2.22, TR.wall); g.box(dx + 0.55, 0, TR.wall - 0.08, dx + 0.68, 2.22, TR.wall); g.box(dx - 0.68, 2.1, TR.wall - 0.08, dx + 0.68, 2.22, TR.wall);
    g.mat('cast', C.brass); g.box(dx + 0.36, 0.98, TR.wall - 0.07, dx + 0.44, 1.06, TR.wall - 0.04);
    g.mat('diffuser', '#ffd9a0', { emissive: 2.2, lamp: true }); g.box(dx - 0.3, 2.3, TR.wall - 0.06, dx + 0.3, 2.42, TR.wall - 0.01);
  }
  return { tier: 's', cast: false };
});

// The lamp line: four long fittings down the middle of a bay (the light itself is added by the scope).
defineProp('mile.lamps', (g) => {
  const H = TR.h, z = TR.mid;
  for (let i = 0; i < 4; i++) {
    const x = i * 5 + 2.5;
    g.mat('brushed', '#6f6a60'); g.box(x - 1.3, H - 0.12, z - 0.16, x + 1.3, H - 0.02, z + 0.16, { faces: 'xXzZy', bevel: 0.01 });
    g.mat('diffuser', '#ffd9a8', { emissive: 6, lamp: true }); g.box(x - 1.22, H - 0.13, z - 0.11, x + 1.22, H - 0.12, z + 0.11, { faces: 'y' });
  }
  return { tier: 's', cast: false };
});

// A bench against the outer wall (front toward the track, -z when placed with yaw PI). p: { w, wood, cloth }
defineProp('mile.bench', (g, p) => {
  const w = p.w || 2.2;
  g.mat('wood', p.wood || C.wood, { rough: -0.05 });
  g.box(-w / 2, 0.42, -0.22, w / 2, 0.47, 0.2, { bevel: 0.015 });
  g.box(-w / 2, 0.62, -0.3, w / 2, 0.88, -0.25, { bevel: 0.012 });
  g.mat('cast', C.iron); for (const x of [-w / 2 + 0.12, w / 2 - 0.12]) { g.box(x - 0.03, 0, -0.2, x + 0.03, 0.42, -0.15); g.box(x - 0.03, 0, 0.13, x + 0.03, 0.42, 0.18); g.box(x - 0.03, 0.42, -0.3, x + 0.03, 0.9, -0.25); }
  if (p.cloth) { g.mat('knit', p.cloth); g.box(-w / 2 + 0.25, 0.47, -0.18, -w / 2 + 0.75, 0.52, 0.16, { bevel: 0.02 }); }
  const spots = []; const n = Math.max(1, Math.floor(w / 0.65));
  for (let i = 0; i < n; i++) spots.push({ type: 'sit', x: -w / 2 + (i + 0.5) * w / n, y: 0.47, z: 0.02, yaw: 0, tags: ['watch', 'mile'] });
  return { solid: [[-w / 2, 0, -0.3, w / 2, 0.47, 0.2]], spots, tier: 's', cast: true };
});

// A water tap on the outer wall: a glazed basin, a brass push tap, cups on hooks. Front toward +z.
defineProp('mile.tap', (g) => {
  g.mat('tile', '#e9e1cf'); g.box(-0.55, 0, -0.06, 0.55, 1.9, 0.0, { faces: 'Z' });
  g.mat('tile', '#2f6f73'); g.box(-0.6, 1.9, -0.06, 0.6, 1.98, 0.02, { bevel: 0.01 });
  g.mat('glaze', '#2f6f73', { rough: -0.3 }); g.lathe(0, 0.22, [[0.05, 0.62], [0.12, 0.64], [0.26, 0.8], [0.3, 0.92], [0.27, 0.94], [0.22, 0.84], [0.0, 0.8]], { segs: 18 });
  g.mat('glaze', '#2f6f73'); g.box(-0.08, 0, 0.0, 0.08, 0.66, 0.16, { bevel: 0.02 });
  g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[0, 1.18, 0.0], [0, 1.18, 0.16], [0, 1.1, 0.22]], 0.022, { segs: 8 }); g.cyl(0, 1.2, 0.08, 0.035, 0.06, { segs: 10 });
  g.mat('cast', '#3a3430'); g.box(0.32, 1.38, -0.02, 0.5, 1.4, 0.05);
  for (let i = 0; i < 3; i++) { g.mat('glaze', ['#c9552e', '#e9e1cf', '#e9b23c'][i]); g.lathe(0.35 + i * 0.065, 0.06, [[0, 1.22], [0.024, 1.22], [0.03, 1.32], [0, 1.32]], { segs: 8 }); }
  return { solid: [[-0.32, 0, -0.06, 0.32, 0.95, 0.5]], tier: 's', cast: true };
});

// The start and finish gantry: two posts, a beam, a double-faced clock (its face is the live sheet's; drawn by the scope).
// Drawn along z at x = 0, spanning the lanes. Front of the clock faces +z here; the scope turns it.
defineProp('mile.gantry', (g, p) => {
  const z0 = TR.l0 - 0.15, z1 = TR.l1 + 0.12, top = 3.18;
  g.mat('cast', p.col || C.red, { rough: -0.1 });
  for (const z of [z0, z1]) { g.box(-0.09, 0, z - 0.09, 0.09, top, z + 0.09, { bevel: 0.015 }); g.box(-0.16, 0, z - 0.16, 0.16, 0.12, z + 0.16, { bevel: 0.02 }); }
  g.box(-0.1, top - 0.2, z0, 0.1, top, z1, { bevel: 0.015 });
  // a chequer band on the beam, the lane numbers' little brass plates
  for (let i = 0; i < 24; i++) { const a = z0 + (z1 - z0) * i / 24, b = z0 + (z1 - z0) * (i + 1) / 24; g.mat('paint', i % 2 ? '#f2e8d2' : '#1d1d1d'); g.box(-0.105, top - 0.16, a, 0.105, top - 0.04, b, { faces: 'xX' }); }
  // the clock's box, hung from the beam on two rods
  g.mat('cast', C.iron); for (const z of [-0.85, 0.45]) g.tube([[0, top - 0.2, z], [0, 2.92, z]], 0.012, { segs: 5 });
  g.mat('wood', '#2a211b'); g.box(-0.12, 2.34, -1.05, 0.12, 2.92, 0.65, { bevel: 0.02 });
  return { posts: [[0, z0, 0.12, 0, top], [0, z1, 0.12, 0, top]], tier: 's', cast: false };
});

export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), r = Math.min(255, Math.round(((n >> 16) & 255) * k)), gg = Math.min(255, Math.round(((n >> 8) & 255) * k)), b = Math.min(255, Math.round((n & 255) * k));
  return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
}
