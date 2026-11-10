// Station Ring 2: the glide platform (deck 1, the rim, a full g) and its lift lobby of cab berths.
// Chervil's front door: a long riveted engine hall under a ribbed vault, where armoured cars rise out of the floor,
// stand with their doors open, and sink away again toward the quay. It curves up at both ends with the drum.
import { floor, ceiling, wall, lamp, roomGlow, warm } from '../world/kit.js';
import { railing, planter } from '../world/kit2.js';
import { prop, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door, doorFrame } from '../world/doors.js';
import { SIGNS } from '../content/signs.js';
import { Rng, hashStr, shadeHex, smoothstep } from '../core/util.js';
import { PAL, VAULT, vaultY, vaultBand, movable, rotX, signK, drawCar, carSolids, CAR } from './station_parts.js';

const XE = 112;                                   // the hall runs x[-72, 72]; simplified platform carries on to +-112
const ZN = -22, ZS = 12, ZBAR = -12.1, ZP0 = -19.0, ZP1 = -12.6, ZA = -12.75;
const CLIP = [-XE - 0.5, -8, ZN - 0.3, XE + 0.5, 13.6, ZS + 0.25];
const BAYS = [
  { n: 3, cx: -102, kind: 'shut' }, { n: 4, cx: -84, kind: 'shut' },
  { n: 5, cx: -60, kind: 'freight' }, { n: 6, cx: -36, kind: 'car', enter: true },
  { n: 7, cx: -12, kind: 'loop' }, { n: 8, cx: 12, kind: 'loop' },
  { n: 9, cx: 36, kind: 'car' }, { n: 10, cx: 60, kind: 'works' },
  { n: 11, cx: 84, kind: 'shut' }, { n: 12, cx: 102, kind: 'shut' },
];
const OPEN_SOUTH = (x) => (x > -30.2 && x < 44.2) || (x > -44.5 && x < -35.5);

function found(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
async function read(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
function toast(game, text) { if (game.ui) game.ui.toast(text, { kind: 'info' }); }
function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }
// a spot's yaw faces (sin, cos); the player's faces (sin, -cos)
function sitAt(game, x, z, yaw, key, eye) {
  const P = game.player; if (!P || !P.sit) return;
  if (P.seat && P.seat.platform === key) { P.stand(); return; }
  P.sit({ x, y: 0, z, yaw, eye: eye || 1.12, platform: key }); P.yaw = Math.PI - yaw; P.pitch = -0.05;
}

export const place = {
  id: 'platform', name: 'The glide platform', order: 1,
  build(game) {
    const W = game.world;
    const f = W.frame('station', 3000, 0, 625);
    const s = W.scope('platform', f);
    const g = s.g;
    const R = new Rng(hashStr('ring2'));

    // ================= the shell =================
    // floors: the edge zone in deck plate, the walks in concrete, a terrazzo island down the middle
    floor(s, -XE, ZP1, XE, -9.6, 0, 'deckplate', '#77746c');
    floor(s, -XE, -9.6, XE, -1.5, 0, 'concrete', PAL.conc);
    floor(s, -XE, -1.5, XE, 1.5, 0, 'terrazzo', '#b9ab90');
    floor(s, -XE, 1.5, XE, ZS, 0, 'concrete', PAL.conc);
    const pits = BAYS.filter((b) => b.kind === 'car' || b.kind === 'loop');
    let xa = -XE;
    for (const b of pits) { floor(s, xa, ZN, b.cx - 5, ZP1, 0, 'deckplate', '#6c6a64'); floor(s, b.cx - 5, ZN, b.cx + 5, ZP0, 0, 'deckplate', '#5f5d58'); xa = b.cx + 5; }
    floor(s, xa, ZN, XE, ZP1, 0, 'deckplate', '#6c6a64');
    // painted lines: the yellow edge line, a tactile strip, brass strips round the island, a worn pale lane line
    for (let x = -XE; x < XE; x += 16) s.deco(() => {
      const x1 = x + 16;
      g.mat('paint', PAL.yellow); g.box(x, 0, -9.72, x1, 0.006, -9.6, { faces: 'Y' });
      g.mat('deckplate', '#c99f35'); g.box(x, 0, -10.4, x1, 0.009, -9.88, { faces: 'Y' });
      g.mat('cast', PAL.brass, { rough: -0.2 }); for (const z of [-1.5, 1.5]) g.box(x, 0, z - 0.03, x1, 0.005, z + 0.03, { faces: 'Y' });
      g.mat('paint', '#d9d0bc', { rough: 0.2 }); for (const z of [-5.6, 5.6]) for (let k = 0; k < 4; k++) g.box(x + k * 4 + 0.3, 0, z - 0.05, x + k * 4 + 2.3, 0.004, z + 0.05, { faces: 'Y' });
      g.mat('concrete', '#5e5950'); for (let k = 0; k < 4; k++) { const xj = x + k * 4; g.box(xj - 0.015, 0, -9.55, xj + 0.015, 0.003, -1.55, { faces: 'Y' }); g.box(xj - 0.015, 0, 1.55, xj + 0.015, 0.003, ZS - 0.3, { faces: 'Y' }); }
      for (const z of [-3.5, 3.5, 8.5]) g.box(x, 0, z - 0.015, x1, 0.003, z + 0.015, { faces: 'Y' });
      g.mat('grille', '#6d6f6c'); for (let k = 0; k < 2; k++) { const xd = x + 4 + k * 8; g.box(xd - 0.22, 0, -9.28, xd + 0.22, 0.004, -9.06, { faces: 'Y' }); }
    });

    // the vault: riveted cream panels between teal purlins, every 8 m a rib
    const NZ = 16, zs = []; for (let i = 0; i <= NZ; i++) zs.push(ZN + (ZS - ZN) * i / NZ);
    for (let x = -XE; x < XE; x += 8) {
      s.structure(() => {
        g.mat('panel', PAL.vault);
        for (let xx = x; xx < x + 8; xx += 4) for (let i = 0; i < NZ; i++) { const za = zs[i], zb = zs[i + 1], ya = vaultY(za), yb = vaultY(zb); g.quad([xx, ya, za], [xx + 4, ya, za], [xx + 4, yb, zb], [xx, yb, zb]); }
        g.mat('panel', PAL.tealDark);
        for (const zp of [-15.5, -5, 5.5]) { const y = vaultY(zp); g.box(x, y - 0.42, zp - 0.14, x + 8, y + 0.05, zp + 0.14, { faces: 'xXyzZ' }); }
        // a cable tray and a big duct along the vault
        const yt = vaultY(-9) - 1.0; g.mat('grille', '#7d8580'); g.box(x, yt, -9.5, x + 8, yt + 0.02, -8.5, { faces: 'yY' });
        g.mat('cast', '#5b6260'); g.box(x, yt, -9.52, x + 8, yt + 0.16, -9.48, { faces: 'zZ' }); g.box(x, yt, -8.52, x + 8, yt + 0.16, -8.48, { faces: 'zZ' });
        g.mat('weave', '#2a2d2e'); for (let k = 0; k < 4; k++) g.tube([[x, yt + 0.06, -9.3 + k * 0.2], [x + 4, yt + 0.06, -9.3 + k * 0.2], [x + 8, yt + 0.06, -9.3 + k * 0.2]], 0.035, { segs: 5, caps: false });
        g.mat('cast', '#5b6260'); for (const xx of [x + 2, x + 6]) g.tube([[xx, yt, -9.6], [xx, vaultY(-9.6) + 0.1, -9.6]], 0.012, { segs: 4 });
        const yd = vaultY(1.5) - 0.9; g.mat('brushed', '#8f948f'); g.push(); g.rotZ(0); g.tube([[x, yd, 1.5], [x + 4, yd, 1.5], [x + 8, yd, 1.5]], 0.42, { segs: 12, caps: false }); g.pop();
        g.mat('brushed', '#73787a'); g.tube([[x + 0.06, yd, 1.5], [x + 0.2, yd, 1.5]], 0.45, { segs: 12 });
      });
    }
    // the ribs, and a great rib at each end of the hall
    const rib = (xr, big) => {
      const w = big ? 0.55 : 0.09, fl = big ? 0.75 : 0.3, dep = big ? 1.4 : 0.78, pd = big ? 1.1 : 0.55;
      s.structure(() => {
        g.mat('panel', PAL.teal); vaultBand(g, xr - w, xr + w, ZN + 0.2, ZS - 0.2, dep, 0.03, 18);
        g.mat('panel', PAL.tealDark); vaultBand(g, xr - fl, xr + fl, ZN + 0.25, ZS - 0.25, dep, -(dep - 0.09), 18);
        if (big) { g.mat('cast', PAL.brass); vaultBand(g, xr - fl - 0.02, xr + fl + 0.02, ZN + 0.3, ZS - 0.3, dep + 0.01, -(dep - 0.03), 18); }
        for (const side of [0, 1]) {
          const zw = side ? ZS - 0.3 : ZN + 0.3, dz = side ? -pd : pd, y0 = side && OPEN_SOUTH(xr) ? (xr > -30.2 && xr < 44.2 ? 6.9 : 4.62) : 0;
          g.mat('panel', PAL.teal); g.box(xr - fl, y0, Math.min(zw, zw + dz), xr + fl, VAULT.spring + 0.25, Math.max(zw, zw + dz), { bevel: 0.025 });
          g.mat('cast', PAL.tealDark); if (y0 === 0) g.box(xr - fl - 0.07, 0, Math.min(zw, zw + dz * 1.12), xr + fl + 0.07, 0.5, Math.max(zw, zw + dz * 1.12), { bevel: 0.025 });
          g.mat('cast', PAL.brass, { rough: -0.15 }); g.box(xr - fl - 0.04, 7.55, Math.min(zw, zw + dz * 1.08), xr + fl + 0.04, 7.72, Math.max(zw, zw + dz * 1.08), { bevel: 0.015 });
          if (y0 === 0) g.box(xr - fl - 0.03, 2.6, Math.min(zw, zw + dz * 1.05), xr + fl + 0.03, 2.68, Math.max(zw, zw + dz * 1.05));
          if (y0 === 0) s.solid(xr - fl - 0.07, 0, Math.min(zw, zw + dz * 1.12), xr + fl + 0.07, 8, Math.max(zw, zw + dz * 1.12));
        }
      });
    };
    for (let x = -XE + 8; x < XE; x += 8) rib(x, Math.abs(x) === 72);

    // the long walls: teal riveted dado, cream panels, a cornice where the vault springs
    const WALL = { t: 0.3, mat: 'panel', tint: PAL.cream, dado: { h: 3.2, mat: 'panel', tint: PAL.teal }, skirt: '#25292a' };
    for (let x = -XE; x < XE; x += 16) wall(s, x, ZN + 0.15, x + 16, ZN + 0.15, 0, 8, WALL);
    for (const [a, b] of [[-112, -96], [-96, -80], [-80, -64], [-64, -46]]) wall(s, a, ZS - 0.15, b, ZS - 0.15, 0, 8, WALL);
    wall(s, -46, ZS - 0.15, -34, ZS - 0.15, 0, 8, Object.assign({}, WALL, { openings: [{ at: 2, w: 8, h: 4.4 }] }));
    wall(s, -34, ZS - 0.15, -30, ZS - 0.15, 0, 8, WALL);
    for (const [a, b] of [[44, 60], [60, 76], [76, 92], [92, 112]]) wall(s, a, ZS - 0.15, b, ZS - 0.15, 0, 8, WALL);
    // the gallery front over the openings to the Ledger hall, the guest desk, the counter and the lane: a deep beam on posts
    for (const [a, b] of [[-30, -14], [-14, 2], [2, 18], [18, 34], [34, 44]]) {
      wall(s, a, ZS - 0.15, b, ZS - 0.15, 4.0, 4.0, { t: 0.3, mat: 'panel', tint: PAL.cream, skirt: false });
      s.structure(() => {
        g.mat('panel', PAL.teal); g.box(a, 4.0, ZS - 0.95, b, 4.95, ZS - 0.28, { faces: 'yYzxX' });
        g.mat('cast', PAL.brass, { rough: -0.15 }); g.box(a, 4.0, ZS - 0.99, b, 4.07, ZS - 0.95, { faces: 'yzY' }); g.box(a, 4.88, ZS - 0.99, b, 4.95, ZS - 0.95, { faces: 'yzY' });
        g.mat('panel', PAL.tealDark); for (let x = a + 1; x < b; x += 2) g.box(x - 0.05, 4.07, ZS - 1.0, x + 0.05, 4.88, ZS - 0.95, { faces: 'zxX' });
      });
    }
    for (const px of [-30, -19, 19, 31.5, 44]) {
      s.structure(() => {
        g.mat('panel', PAL.teal); g.box(px - 0.32, 0, ZS - 0.9, px + 0.32, 4.0, ZS - 0.15, { bevel: 0.03 });
        g.mat('cast', PAL.tealDark); g.box(px - 0.4, 0, ZS - 0.98, px + 0.4, 0.45, ZS - 0.15, { bevel: 0.025 });
        g.mat('cast', PAL.brass, { rough: -0.15 }); g.box(px - 0.42, 3.65, ZS - 1.0, px + 0.42, 4.0, ZS - 0.15, { bevel: 0.03 }); g.box(px - 0.36, 1.8, ZS - 0.94, px + 0.36, 1.86, ZS - 0.15);
      });
      s.solid(px - 0.4, 0, ZS - 1.0, px + 0.4, 4, ZS - 0.1);
    }
    // infill under the beam between the neighbours' fronts (guest desk, Ledger mouth, ring counter, lane)
    for (const [a, b] of [[-29.65, -29.4], [-20.6, -16.45], [16.45, 20.35], [29.65, 34.25], [43.75, 44.0]]) wall(s, a, ZS - 0.15, b, ZS - 0.15, 0, 4.0, Object.assign({}, WALL, { cap: true }));
    // cornices along both walls
    for (let x = -XE; x < XE; x += 16) s.structure(() => {
      g.mat('panel', PAL.tealDark); g.box(x, 7.75, ZN + 0.3, x + 16, 8.25, ZN + 0.62, { faces: 'yYZ' }); g.box(x, 7.75, ZS - 0.62, x + 16, 8.25, ZS - 0.3, { faces: 'yYz' });
      g.mat('cast', PAL.brass); g.box(x, 7.72, ZN + 0.6, x + 16, 7.78, ZN + 0.66, { faces: 'yZ' }); g.box(x, 7.72, ZS - 0.66, x + 16, 7.78, ZS - 0.6, { faces: 'yz' });
    });
    // the lobby's portal through the south wall
    s.structure(() => {
      g.mat('panel', PAL.teal); g.box(-44.45, 0, ZS - 0.55, -43.95, 4.4, ZS - 0.1, { bevel: 0.02 }); g.box(-36.05, 0, ZS - 0.55, -35.55, 4.4, ZS - 0.1, { bevel: 0.02 });
      g.box(-44.45, 4.4, ZS - 0.6, -35.55, 5.0, ZS - 0.1, { bevel: 0.03 });
      g.mat('cast', PAL.brass, { rough: -0.15 }); g.box(-44.5, 4.38, ZS - 0.64, -35.5, 4.45, ZS - 0.1); g.box(-44.5, 0, ZS - 0.6, -43.9, 0.4, ZS - 0.1, { bevel: 0.02 }); g.box(-36.1, 0, ZS - 0.6, -35.5, 0.4, ZS - 0.1, { bevel: 0.02 });
    });
    signK(s, { kind: 'fascia', text: 'CAB BERTHS', sub: 'up into the drum · Candlewick · the Hollow', palette: ['#1d3b39', '#f3e6c8', '#d8a657'] }, -40, 4.7, ZS - 0.6, { face: 'z', w: 5.6, h: 0.5, glow: 1.3, k: 1.8 });

    // the ends: a wall, the vault's lunette, and a rolling shutter
    for (const sx of [-1, 1]) {
      const x = sx * (XE - 0.15);
      wall(s, x, ZN, x, ZS, 0, 8, WALL);
      s.structure(() => {
        g.mat('panel', PAL.cream);
        for (let i = 0; i < NZ; i++) {
          const za = zs[i], zb = zs[i + 1], ya = vaultY(za), yb = vaultY(zb), xx = x - sx * 0.15;
          if (sx > 0) g.quad([xx, 8, za], [xx, 8, zb], [xx, yb, zb], [xx, ya, za]); else g.quad([xx, 8, zb], [xx, 8, za], [xx, ya, za], [xx, yb, zb]);
        }
        const xs = x - sx * 0.2;
        g.mat('flute', '#6d7c77'); g.box(Math.min(xs, xs - sx * 0.12), 0, -9, Math.max(xs, xs - sx * 0.12), 5.2, 9);
        g.mat('panel', PAL.tealDark); g.box(Math.min(xs, xs - sx * 0.7), 5.2, -9.4, Math.max(xs, xs - sx * 0.7), 6.0, 9.4, { bevel: 0.04 });
        g.mat('cast', PAL.steel); for (const z of [-9.15, 9.15]) g.box(Math.min(xs, xs - sx * 0.25), 0, z - 0.15, Math.max(xs, xs - sx * 0.25), 5.2, z + 0.15);
        g.mat('paint', PAL.yellow); for (let k = 0; k < 18; k++) { const z = -9 + k; g.box(Math.min(xs, xs - sx * 0.13), 0.05, z, Math.max(xs, xs - sx * 0.13), 0.3, z + 0.5, { faces: sx > 0 ? 'x' : 'X' }); }
      });
      const bf = sx > 0 ? 'x' : 'X';
      signK(s, sx > 0 ? { kind: 'board', title: 'PLATFORMS 13 TO 24', lines: ['This way round by cab.', 'Cab berths: back past the clock,', 'by the lobby on the back side.'] }
        : { kind: 'board', title: 'PLATFORMS 1 AND 2', lines: ['This way round by cab.', 'Cab berths: the lobby,', 'along the back side.'] }, x - sx * 0.36, 2.7, 0, { face: bf, w: 2.6, h: 1.7, glow: 0.8, k: 3 });
      s.solid(sx > 0 ? XE - 0.6 : -XE - 0.5, 0, ZN, sx > 0 ? XE + 0.5 : -XE + 0.6, 13, ZS);
      s.interact({ x: x - sx * 0.4, y: 1.8, z: 0, radius: 4, prompt: 'Read the shutter', onUse: (gm) => read(gm, 'The shutter', sx > 0
        ? ['Platforms 13 to 24: this way round by cab.', 'The ring carries on round the whole drum, nineteen kilometres of it. Nobody walks it. The cabs will run you round in a minute or two.']
        : ['Platforms 1 and 2: this way round by cab.', 'Behind the shutter the platform runs on and on round the rim. The cab berths are back in the lobby.']) });
    }

    // the big pipes along the north wall, with their stencils, and a cable trunk
    const PIPES = [{ y: 6.55, r: 0.3, c: '#c9a43a', label: { kind: 'label', text: 'AMMONIA', sub: 'coolant · keep shut' } },
      { y: 7.25, r: 0.24, c: '#a8432e', label: { kind: 'label', text: '65 °C LOOP', sub: 'food plant · to the halls' } },
      { y: 5.95, r: 0.2, c: '#2f6f8f', label: { kind: 'label', text: 'MOAT WATER', sub: 'to the moat · do not tap' } }];
    for (let x = -XE; x < XE; x += 16) s.structure(() => {
      for (const p of PIPES) {
        const zp = ZN + 0.32 + p.r + 0.12, pts = []; for (let k = 0; k <= 4; k++) pts.push([x + k * 4, p.y, zp]);
        g.mat('cast', p.c, { rough: 0.05 }); g.tube(pts, p.r, { segs: 14, caps: false });
        g.mat('cast', shadeHex(p.c, 0.8)); g.tube([[x + 0.02, p.y, zp], [x + 0.14, p.y, zp]], p.r + 0.05, { segs: 14 });
        g.mat('cast', '#3a3f41'); for (let k = 0; k < 4; k++) { const xx = x + 2 + k * 4; g.box(xx - 0.05, p.y - p.r - 0.06, ZN + 0.3, xx + 0.05, p.y - p.r, zp + 0.05); g.tube([[xx, p.y - p.r, zp - p.r * 0.2], [xx, p.y + p.r + 0.02, zp], [xx, p.y - p.r, zp + p.r]], 0.018, { segs: 4 }); }
      }
      g.mat('panel', '#3b4446'); g.box(x, 5.35, ZN + 0.3, x + 16, 5.62, ZN + 0.62, { faces: 'yYZ' });
      g.mat('cast', '#2c3133'); for (let k = 0; k < 8; k++) g.box(x + k * 2 + 0.95, 5.33, ZN + 0.3, x + k * 2 + 1.05, 5.64, ZN + 0.64);
    });
    for (let x = -96; x <= 96; x += 24) for (const p of PIPES) {
      const zp = ZN + 0.32 + p.r + 0.12; signK(s, p.label, x + (p.r * 7) % 3, p.y, zp + p.r + 0.01, { face: 'Z', w: 1.1, h: 0.3, k: 1.6 });
    }

    // ================= the bays =================
    const hatchDraw = (gg, x0, x1, z0, z1, y0, y1, edges) => {
      gg.mat('deckplate', '#4c4a46'); gg.box(x0, y0, z0, x1, y1, z1, { faces: 'YxXzZ' });
      const cw = 0.32, yt = y1 + 0.004;
      const chev = (a0, a1, along, c0, c1) => { let k = 0; for (let a = a0; a < a1 - 0.05; a += 0.5, k++) { gg.mat('paint', k % 2 ? '#1c1c1c' : PAL.yellow); const b = Math.min(a1, a + 0.5); if (along === 'x') gg.box(a, y1, c0, b, yt, c1, { faces: 'Y' }); else gg.box(c0, y1, a, c1, yt, b, { faces: 'Y' }); } };
      if (edges.indexOf('x') >= 0) chev(z0, z1, 'z', x0, x0 + cw);
      if (edges.indexOf('X') >= 0) chev(z0, z1, 'z', x1 - cw, x1);
      if (edges.indexOf('z') >= 0) chev(x0, x1, 'x', z0, z0 + cw);
      if (edges.indexOf('Z') >= 0) chev(x0, x1, 'x', z1 - cw, z1);
      gg.mat('cast', '#3a3d3e'); for (const z of [z0 + 1.6, z1 - 1.6]) for (const x of [x0 + 1.2, x1 - 1.2]) gg.cyl(x, y1, z, 0.16, 0.006, { segs: 10 });
    };
    const gateLeaf = (gg, side) => {
      const a = side < 0 ? -0.86 : 0.02, b = side < 0 ? -0.02 : 0.86, z0 = ZBAR - 0.22, z1 = ZBAR - 0.15;
      gg.mat('cast', PAL.teal); gg.box(a, 0.05, z0, b, 0.13, z1, { bevel: 0.01 }); gg.box(a, 1.07, z0, b, 1.15, z1, { bevel: 0.01 });
      gg.box(a, 0.05, z0, a + 0.06, 1.15, z1, { bevel: 0.01 }); gg.box(b - 0.06, 0.05, z0, b, 1.15, z1, { bevel: 0.01 });
      gg.mat('cast', PAL.tealDark); for (let x = a + 0.15; x < b - 0.08; x += 0.12) gg.tube([[x, 0.13, (z0 + z1) / 2], [x, 1.07, (z0 + z1) / 2]], 0.012, { segs: 5, caps: false });
      gg.mat('paint', PAL.yellow); gg.box(a, 1.15, z0 - 0.01, b, 1.2, z1 + 0.01, { bevel: 0.012 });
    };
    const pit = (cx, depth) => s.structure(() => {
      g.mat('concrete', '#4a4946'); g.box(cx - 5.15, -depth, ZP0, cx - 5, 0, ZP1, { faces: 'X' }); g.box(cx + 5, -depth, ZP0, cx + 5.15, 0, ZP1, { faces: 'x' });
      g.box(cx - 5, -depth, ZP0 - 0.15, cx + 5, 0, ZP0, { faces: 'Z' }); g.box(cx - 5, -depth, ZP1, cx + 5, 0, ZP1 + 0.15, { faces: 'z' });
      g.mat('concrete', '#232322'); g.box(cx - 5, -depth - 0.1, ZP0, cx + 5, -depth, ZP1, { faces: 'Y' });
      if (depth > 3) { g.mat('plain', '#060606'); g.box(cx - 3.6, -depth, ZP0 - 0.01, cx + 3.6, -depth + 4.2, ZP0, { faces: 'Z' }); }
      g.mat('paint', PAL.yellow); for (const sx of [-1, 1]) for (const zz of [-17.0, -14.6]) g.box(cx + sx * 5 - (sx > 0 ? 0.12 : 0), -depth, zz - 0.09, cx + sx * 5 + (sx < 0 ? 0.12 : 0), 0, zz + 0.09, { faces: sx > 0 ? 'xzZ' : 'XzZ' });
      g.mat('diffuser', '#ff4a3a', { emissive: 3 }); for (const sx of [-1, 1]) for (const yy of [-1.2, -3.4]) if (yy > -depth) g.ball(cx + sx * 4.97, yy, -15.8, 0.05, 0.05, 0.05, { segs: 6, rings: 4 });
      g.mat('paint', PAL.yellow); g.box(cx - 5.2, -0.05, ZP1 - 0.02, cx + 5.2, 0.006, ZP1 + 0.14, { faces: 'Yz' });
      g.mat('cast', '#3a3d3e'); g.box(cx - 5.2, -0.05, ZP0 - 0.14, cx + 5.2, 0.006, ZP0 + 0.02, { faces: 'YZ' });
      for (const sx of [-1, 1]) g.box(cx + sx * 5 - 0.1, -0.05, ZP0, cx + sx * 5 + 0.1, 0.006, ZP1, { faces: 'Y' + (sx > 0 ? 'x' : 'X') });
    });
    const barrier = (cx, gate) => {
      s.furniture(() => {
        g.mat('cast', PAL.teal);
        for (const px of [cx - 5.6, cx - 3.3, cx + 3.3, cx + 5.6]) g.box(px - 0.05, 0, ZBAR - 0.06, px + 0.05, 1.28, ZBAR + 0.06, { bevel: 0.012 });
        for (const px of [cx - 0.95, cx + 0.95]) { g.box(px - 0.09, 0, ZBAR - 0.09, px + 0.09, 1.5, ZBAR + 0.09, { bevel: 0.02 }); g.mat('cast', PAL.brass); g.cyl(px, 1.5, ZBAR, 0.08, 0.04, { segs: 10 }); g.mat('cast', PAL.teal); }
        for (const [a, b] of [[cx - 5.6, cx - 0.95], [cx + 0.95, cx + 5.6]]) {
          g.mat('paint', PAL.yellow); g.box(a, 1.2, ZBAR - 0.055, b, 1.28, ZBAR + 0.055, { bevel: 0.012 });
          g.mat('cast', PAL.tealDark); g.box(a, 0.05, ZBAR - 0.04, b, 0.12, ZBAR + 0.04);
        }
        g.mat('diffuser', gate === 'open' ? '#86e08e' : '#ffb347', { emissive: gate === 'open' ? 4 : 1.2 });
        for (const px of [cx - 0.95, cx + 0.95]) g.ball(px, 1.6, ZBAR, 0.07, 0.07, 0.07, { segs: 8, rings: 6 });
        if (gate === 'open' || gate === 'closed') { const k = gate === 'open' ? 0.84 : 0; g.push(); g.move(-k, 0, 0); g.move(cx, 0, 0); gateLeaf(g, -1); g.pop(); g.push(); g.move(cx + k, 0, 0); gateLeaf(g, 1); g.pop(); }
      });
      for (const [a, b] of [[cx - 5.55, cx - 3.35], [cx - 3.25, cx - 1.04], [cx + 1.04, cx + 3.25], [cx + 3.35, cx + 5.55]]) s.glass(a, 0.12, ZBAR, b, 1.2, ZBAR, { tint: '#d5e6e2', opacity: 0.1 });
      s.solid(cx - 5.66, 0, ZBAR - 0.12, cx - 0.86, 2.8, ZBAR + 0.12); s.solid(cx + 0.86, 0, ZBAR - 0.12, cx + 5.66, 2.8, ZBAR + 0.12);
      if (gate === 'closed') s.solid(cx - 0.86, 0, ZBAR - 0.12, cx + 0.86, 2.8, ZBAR + 0.12);
      for (const sx of [-1, 1]) { const x = cx + sx * 5.6; railing(s, [[x, ZBAR - 0.1], [x, ZN + 0.45]], 0, { h: 1.2, tint: PAL.teal, rail: PAL.yellow, railMat: 'paint', posts: 1.7 }); s.solid(x - 0.07, 0, ZN + 0.3, x + 0.07, 2.8, ZBAR); }
    };
    const portal = (b, simple) => {
      const cx = b.cx;
      s.structure(() => {
        g.mat('panel', PAL.teal); for (const sx of [-1, 1]) g.box(cx + sx * 5.9 - 0.2, 0, ZBAR - 0.3, cx + sx * 5.9 + 0.2, 4.0, ZBAR + 0.3, { bevel: 0.025 });
        g.mat('cast', PAL.tealDark); for (const sx of [-1, 1]) g.box(cx + sx * 5.9 - 0.27, 0, ZBAR - 0.37, cx + sx * 5.9 + 0.27, 0.42, ZBAR + 0.37, { bevel: 0.02 });
        g.mat('panel', PAL.teal); g.box(cx - 6.15, 4.0, ZBAR - 0.36, cx + 6.15, 4.78, ZBAR + 0.36, { bevel: 0.035 });
        g.mat('cast', PAL.brass, { rough: -0.15 }); g.box(cx - 6.18, 4.0, ZBAR + 0.34, cx + 6.18, 4.07, ZBAR + 0.4); g.box(cx - 6.18, 4.71, ZBAR + 0.34, cx + 6.18, 4.78, ZBAR + 0.4);
        g.mat('cast', '#2a2d2e'); for (const sx of [-1, 1]) g.cyl(cx + sx * 4.9, 4.78, ZBAR, 0.13, 0.1, { segs: 12 });
        g.mat('diffuser', '#9a5e1c', { rough: -0.2 }); for (const sx of [-1, 1]) g.ball(cx + sx * 4.9, 4.88, ZBAR, 0.1, 0.1, 0.1, { segs: 10, rings: 5, bottom: 0 });
        g.mat('cast', '#2a2d2e'); for (const sx of [-1, 1]) g.tube([[cx + sx * 4.9 - 0.1, 4.9, ZBAR], [cx + sx * 4.9, 5.02, ZBAR], [cx + sx * 4.9 + 0.1, 4.9, ZBAR]], 0.008, { segs: 3 });
      });
      if (!simple) s.deco(() => {
        const px = cx + 5.9; g.mat('paint', '#d9cfb6'); g.box(px - 0.13, 1.25, ZBAR + 0.3, px + 0.13, 1.6, ZBAR + 0.38, { bevel: 0.01 });
        g.mat('cast', '#2a2d2e'); for (let k = 0; k < 4; k++) g.box(px - 0.08, 1.42 + k * 0.035, ZBAR + 0.38, px + 0.08, 1.435 + k * 0.035, ZBAR + 0.385, { faces: 'Z' });
        g.mat('diffuser', '#7be08a', { emissive: 2.5 }); g.box(px - 0.03, 1.3, ZBAR + 0.38, px + 0.03, 1.34, ZBAR + 0.39, { faces: 'Z' });
      });
      for (const sx of [-1, 1]) s.solid(cx + sx * 5.9 - 0.27, 0, ZBAR - 0.37, cx + sx * 5.9 + 0.27, 4, ZBAR + 0.37);
      signK(s, { kind: 'street', text: 'PLATFORM ' + b.n, sub: b.dest || 'GLIDE · SORREL' }, cx, 4.39, ZBAR + 0.4, { face: 'Z', w: 1.9, h: 0.5, glow: 0.7, k: 4 });
      lamp(s, 'panel', cx, 4.0, ZBAR, { w: 3.4, d: 0.32, clip: CLIP, K: 4000, power: simple ? 0.9 : 1.25, lampFlag: false });
      if (!simple && b.hang) for (let i = 0; i < b.hang.length; i++) {
        const hx = cx + (i ? -3.1 : 3.1);
        s.deco(() => { g.mat('cast', '#2a2d2e'); for (const dx of [-0.25, 0.25]) g.tube([[hx + dx, 4.0, ZBAR], [hx + dx, 3.88, ZBAR]], 0.008, { segs: 3 }); });
        signK(s, SIGNS[b.hang[i]], hx, 3.55, ZBAR, { face: 'Z', double: true, w: 0.66, h: 0.66, k: 1.6 });
      }
    };
    for (const b of BAYS) b.dest = { 3: 'freight', 4: 'freight', 5: 'FREIGHT · ROW GOODS', 6: 'FROM SORREL', 7: 'TO SORREL', 8: 'TO SORREL · FOR RUE', 9: 'TO SORREL', 10: 'CLOSED FOR THE CREW', 11: 'freight', 12: 'freight' }[b.n];
    for (const b of BAYS) b.hang = { 6: ['platform.sorrel'], 7: ['platform.sorrel'], 8: ['platform.rue', 'platform.sorrel'], 9: ['platform.sorrel'] }[b.n] || null;

    // the north wall behind each bay: the bay's number, painted large
    for (const b of BAYS) signK(s, { kind: 'letters', text: String(b.n), palette: ['#ead9b4'] }, b.cx, 4.3, ZN + 0.33, { face: 'Z', w: 1.8, h: 2.0, k: 5 });

    // ---- the standing cars (bays 6 and 9): pit, car, open gates, a lit inside you can sit in
    const seatsOf = (cx) => { const out = []; for (const sx of [-1, 1]) for (const ax of [0.97, 1.62, 2.27]) out.push([cx + sx * ax, ZA + CAR.iz1 + 0.47]); return out; };
    for (const b of BAYS.filter((q) => q.kind === 'car')) {
      const cx = b.cx;
      pit(cx, 2.2); barrier(cx, 'open'); portal(b);
      s.furniture(() => { g.at(cx, 0, ZA, 0); drawCar(g, { interior: true, game, number: b.n === 6 ? 'CAR 4471' : 'CAR 2093', seed: b.n, body: b.n === 6 ? PAL.oxide : '#8f3f2a' }); g.pop(); });
      for (const sx of [-1, 1]) { const a = cx + Math.min(sx * CAR.w0, sx * CAR.w1), c = cx + Math.max(sx * CAR.w0, sx * CAR.w1); s.glass(a, CAR.wy0, ZA, c, CAR.wy1, ZA, { tint: '#7fcfd2', opacity: 0.34 }); s.glass(a, CAR.wy0, ZA - 1.0, c, CAR.wy1, ZA - 1.0, { tint: '#6fc3cc', opacity: 0.3 }); }
      for (const q of carSolids(cx, 0, ZA)) s.solid(q[0], q[1], q[2], q[3], q[4], q[5]);
      const inBox = [cx - CAR.ix - 0.05, -0.2, ZA + CAR.iz1 - 0.05, cx + CAR.ix + 0.05, CAR.ih + 0.1, ZA + 0.7];
      lamp(s, 'bulb', cx, 2.12, ZA - 2.4, { clip: inBox, K: 3300, power: 1.1, range: 5 });
      roomGlow(s, cx - CAR.ix, 0, ZA + CAR.iz1, cx + CAR.ix, CAR.ih, ZA + CAR.iz0, { sky: '#ffe6c4', ground: '#8a7a64', power: 0.16 });
      s.zoneBox({ id: 'glidecar-' + b.n, place: 'platform', box: [cx - CAR.ix, -0.3, ZA + CAR.iz1, cx + CAR.ix, CAR.ih, ZA - 0.2], name: 'A glide car', sub: 'Platform ' + b.n + ' · six seats of a thousand-seat train', ambience: 'cab', reverb: 'room' });
      seatsOf(cx).forEach((p, i) => {
        s.spot('sit', p[0], 0.47, p[1] + 0.02, 0, { tags: ['glide', 'wait'] });
        s.interact({ x: p[0], y: 0.8, z: p[1] + 0.1, radius: 0.9, prompt: 'Sit in a glide seat', onUse: (gm) => { sitAt(gm, p[0], p[1] + 0.04, 0, 'car' + b.n + '-' + i, 1.16); if (b.enter && gm.ui && gm.flags && !gm.flags.platformStrap) { gm.flags.platformStrap = true; toast(gm, 'The harness clicks shut over your shoulders. Nobody is going anywhere: this car is standing.'); } } });
      });
      for (const sx of [-1, 1]) s.interact({ x: cx + sx * 1.75, y: 1.28, z: ZA - 0.9, radius: 1.3, prompt: 'Look through the water window', onUse: async (gm) => {
        await read(gm, 'The window', ['The window is a block of clear water as deep as your arm is long, more. The platform on the other side looks blue and very far away, and it wobbles when someone walks past.',
          'Every window on a glide car faces aft, the way the cars are thinnest. Toward the Lantern they carry nearly five times as much water.']);
        found(gm, 'windows-aft');
      } });
    }
    // the card by the door of the car you came in on
    const C6 = -36;
    sign(s, { kind: 'notice', title: '140 seconds', lines: ['At the quay the cradle lets go.', 'For 140 seconds nothing weighs', 'anything: you, your bag, tea.', 'Then the catch: your weight', 'comes back over a second or two.', 'Sit back. Keep the harness on.'] }, C6 - 1.0, 1.5, ZA + CAR.iz0 - 0.042, { face: 'z' });
    s.interact({ x: C6 - 1.0, y: 1.5, z: ZA + CAR.iz0 - 0.2, radius: 1.2, prompt: 'Read the card by the door', onUse: async (gm) => {
      await read(gm, 'The card by the door', ['At the quay, outside the jacket, a cradle carries the car round to the lane and lets go at 174 metres a second.',
        'For 140 seconds the car falls in a straight line across 24.5 kilometres of dark, and nothing in it weighs anything. Then the next drum\'s rim comes round to meet it at exactly its own speed, and its cradle takes the car on a soft arm.',
        'Your weight comes back over a second or two. Sit back. Hold small children on your knee.']);
      found(gm, 'glide');
    } });
    sign(s, SIGNS['platform.windows'], C6 + 2.9, 1.42, ZBAR + 0.07, { face: 'Z' });
    sign(s, SIGNS['platform.soup'], 36 - 1.0, 1.5, ZA + CAR.iz0 - 0.042, { face: 'z' });

    // ---- the closed bays: a hatch on the floor, the gates shut
    for (const b of BAYS.filter((q) => q.kind === 'shut' || q.kind === 'freight' || q.kind === 'works')) {
      const cx = b.cx, simple = b.kind === 'shut';
      s.furniture(() => { hatchDraw(g, cx - 5, cx, ZP0, ZP1, 0, 0.022, 'xzZ'); hatchDraw(g, cx, cx + 5, ZP0, ZP1, 0, 0.022, 'XzZ'); g.mat('speckle', '#1b1b1b'); g.box(cx - 0.03, 0.02, ZP0, cx + 0.03, 0.026, ZP1, { faces: 'Y' }); });
      barrier(cx, b.kind === 'works' ? 'open' : 'closed'); portal(b, simple);
    }
    // the crew's bay: an inspection plate up, cones across the gate, tools out
    s.furniture(() => {
      g.mat('deckplate', '#5b5954'); g.push(); g.move(61.5, 0.02, -16.2); g.rotX(-1.1); g.box(-0.6, 0, -0.6, 0.6, 0.03, 0.6); g.pop();
      g.mat('plain', '#0c0c0c'); g.box(60.9, 0.022, -16.8, 62.1, 0.026, -15.6, { faces: 'Y' });
      g.mat('weave', '#c9302c', { sway: 0.4 }); g.tube([[62.3, 0, -16.9], [62.3, 1.1, -16.9]], 0.012, { segs: 4 }); g.quad([62.3, 1.1, -16.9], [62.75, 1.05, -16.9], [62.75, 0.8, -16.9], [62.3, 0.82, -16.9], { double: true });
    });
    prop(s, 'platform.cone', 59.0, 0, -11.5, 0, {}); prop(s, 'platform.cone', 61.0, 0, -11.5, 0, {}); prop(s, 'platform.cone', 61.9, 0, -10.8, 0, {});
    prop(s, 'platform.toolbox', 59.4, 0, -16.6, 0.3, { c: '#a8432e' }); prop(s, 'platform.toolbox', 62.6, 0, -14.2, -0.5, { c: '#2f6f73' });
    s.spot('work', 60.8, 0, -15.1, Math.PI, { tags: ['crew', 'mend'] }); s.spot('work', 62.8, 0, -16.4, -Math.PI / 2, { tags: ['crew', 'mend'] }); s.spot('stand', 59.2, 0, -13.8, 0.4, { tags: ['crew'] });
    // freight waiting at bay 5
    prop(s, 'platform.trolley', -58.2, 0, -10.6, 0, { n: 1 }); prop(s, 'platform.trolley', -62.6, 0, -10.6, 0.05, { n: 2 });
    s.spot('work', -60.4, 0, -9.4, Math.PI, { tags: ['crew', 'freight'] });

    // ---- the cars that come and go (bays 7 and 8)
    const loops = [];
    for (const b of BAYS.filter((q) => q.kind === 'loop')) {
      pit(b.cx, 7.6); barrier(b.cx, 'dynamic'); portal(b);
      loops.push(makeLoop(s, game, f, b, loops.length));
    }

    // ================= the island: lamp standards in planters, benches, a clock =================
    const benches = [];
    const bench = (x, z, yaw, w, back) => { prop(s, 'bench', x, 0, z, yaw, { w, back, wood: '#7a5233', metal: PAL.tealDark }); benches.push({ x, z, yaw, w }); };
    for (let i = 0; i < 18; i++) {
      const xc = -68 + i * 8;
      planter(s, xc, 0, 0, { w: 2.1, d: 1.1, h: 0.46, mat: 'panel', tint: PAL.teal, plants: ['broad', 'fern', 'flower', 'broad', 'fine'][i % 5], seed: i });
      prop(s, 'platform.standard', xc, 0.46, 0, 0, { h: 4.8 });
      s.light({ at: [xc, 4.65, 0], color: warm(2900), power: 7.5, range: 13, clip: CLIP, shadow: true, lamp: true, radius: 0.3 });
      const xb = xc + 4;
      if (xb > 70) continue;
      if (i === 11) continue;
      if (i % 3 === 2) { prop(s, 'platform.bin', xb - 0.8, 0, 0, 0, { c: PAL.teal }); prop(s, 'platform.fountain', xb + 0.7, 0, 0, 0, {}); }
      else { bench(xb, -0.48, Math.PI, 2.2, true); bench(xb, 0.48, 0, 2.2, true); }
    }
    for (const sx of [-1, 1]) for (const xc of [76, 92, 108]) {
      prop(s, 'platform.standard', sx * xc, 0, 0, 0, { h: 5.2 });
      s.light({ at: [sx * xc, 4.6, 0], color: warm(2900), power: 7, range: 13, clip: CLIP, shadow: true, lamp: true, radius: 0.3 });
    }
    for (const sx of [-1, 1]) for (const xb of [84, 100]) { bench(sx * xb, -0.48, Math.PI, 2.0, true); bench(sx * xb, 0.48, 0, 2.0, true); }
    // the festival bunting, going up from the west: strung as far as 20, then a ladder and a crate of flags
    const BUNT = ['#c9552e', '#e7b547', '#2f6f73', '#e9e2d0', '#8a2f3c', '#6b8f4e', '#3b4a7a'];
    for (let xc = -68; xc < 20; xc += 8) bunting(s, [xc + 0.12, 3.9, 0], [xc + 7.88, 3.9, 0], { colors: BUNT, sag: 0.45 });
    bunting(s, [20.12, 3.9, 0], [24.6, 0.45, 0.5], { colors: BUNT, sag: 0.5, n: 10 });
    prop(s, 'platform.ladder', 23.4, 0, 0.0, Math.PI / 2, { h: 2.6 }); prop(s, 'platform.flagcrate', 25.0, 0, 0.6, 0.2, {});
    s.spot('work', 23.4, 0, 0.95, Math.PI, { tags: ['crew', 'hang'] }); s.spot('stand', 22.2, 0, -0.95, 0.6, { tags: ['crew', 'hang'] });
    for (const x of [-48, -24, 24]) bunting(s, [x, 7.6, ZS - 0.7], [x, 4.8, ZBAR + 0.4], { colors: BUNT, sag: 1.4, n: 70 });

    // the great clock, hung from the rib over the middle of the island, a face each way along the platform
    const CY = 7.0, CZ = -1.0;
    s.furniture(() => {
      g.mat('cast', PAL.tealDark); g.push(); g.move(0, CY, CZ); g.rotZ(Math.PI / 2); g.lathe(0, 0, [[1.12, -0.24], [1.25, -0.2], [1.3, 0], [1.25, 0.2], [1.12, 0.24]], { segs: 32, capBottom: false, capTop: false }); g.pop();
      g.mat('diffuser', '#f6ecd4', { emissive: 1.6, lamp: true }); g.push(); g.move(0, CY, CZ); g.rotZ(Math.PI / 2); g.lathe(0, 0, [[0, -0.235], [1.13, -0.235]], { segs: 32, capBottom: false, capTop: false }); g.lathe(0, 0, [[1.13, 0.235], [0, 0.235]], { segs: 32, capBottom: false, capTop: false }); g.pop();
      g.mat('cast', PAL.brass, { rough: -0.25 });
      for (const sx of [-1, 1]) { const ring = []; for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2; ring.push([sx * 0.245, CY + Math.cos(a) * 1.16, CZ + Math.sin(a) * 1.16]); } g.tube(ring, 0.04, { segs: 6, closed: true }); }
      g.mat('paint', '#1d1f20');
      for (const sx of [-1, 1]) for (let k = 0; k < 60; k++) {
        const a = k / 60 * Math.PI * 2, big = k % 5 === 0, r0 = big ? 0.86 : 0.98, r1 = 1.05, w = big ? 0.045 : 0.012;
        const yy0 = CY + Math.cos(a) * r0, yy1 = CY + Math.cos(a) * r1, zz0 = CZ - sx * Math.sin(a) * r0, zz1 = CZ - sx * Math.sin(a) * r1;
        if (big) { g.push(); g.move(sx * 0.24, (yy0 + yy1) / 2, (zz0 + zz1) / 2); g.rotX(-sx * a); g.box(-0.004, -(r1 - r0) / 2, -w, 0.004, (r1 - r0) / 2, w); g.pop(); }
        else { g.push(); g.move(sx * 0.24, (yy0 + yy1) / 2, (zz0 + zz1) / 2); g.rotX(-sx * a); g.box(-0.003, -0.035, -w, 0.003, 0.035, w); g.pop(); }
      }
      g.mat('cast', '#2a2d2e'); for (const dz of [-0.7, 0.7]) g.tube([[0, CY + 1.2, CZ + dz], [0, vaultY(CZ + dz) - 0.75, CZ + dz]], 0.03, { segs: 6 });
      g.mat('cast', PAL.brass); g.ball(0, CY + 1.36, CZ, 0.12, 0.14, 0.12, { segs: 10, rings: 6 }); g.ball(0, CY - 1.36, CZ, 0.1, 0.12, 0.1, { segs: 10, rings: 6 });
    });
    for (const sx of [-1, 1]) signK(s, { kind: 'plate', text: 'CHERVIL', sub: 'Station Ring 2' }, sx * 0.246, CY - 0.45, CZ, { face: sx > 0 ? 'X' : 'x', w: 0.5, h: 0.2, board: false, k: 2 });
    const hands = [];
    for (const sx of [-1, 1]) for (const kind of ['h', 'm']) {
      const L = kind === 'm' ? 0.92 : 0.6, wd = kind === 'm' ? 0.035 : 0.055, xo = sx * (kind === 'm' ? 0.29 : 0.27);
      const mesh = movable(s, (gg) => { gg.mat('cast', '#151617', { rough: -0.1 }); gg.box(xo - 0.01, -0.2, -wd, xo + 0.01, L, wd); gg.box(xo - 0.012, L - 0.12, -wd * 1.6, xo + 0.012, L - 0.02, wd * 1.6); gg.mat('cast', PAL.brass); gg.push(); gg.move(xo, 0, 0); gg.rotZ(Math.PI / 2); gg.cyl(0, -0.02, 0, 0.06, 0.04, { segs: 10 }); gg.pop(); }, [0, CY, CZ], { radius: 1.3 });
      hands.push({ mesh, sx, kind });
    }
    s.interact({ x: 0, y: CY, z: CZ, radius: 9, prompt: 'Read the great clock', onUse: (gm) => toast(gm, 'The great clock says ' + gm.clock.label() + '. It is a full minute fast, and has been for years.') });

    // ================= the alcoves between the bays =================
    const plinth = (x, z, w) => planter(s, x, 0, z, { w: w || 2.6, d: 0.7, h: 0.55, mat: 'panel', tint: PAL.tealDark, plants: 'broad', seed: x });
    // alcove 5-6: the notices for arrivals
    bench(-51.2, -14.3, 0, 2.2, true); bench(-44.8, -14.3, 0, 2.2, true); plinth(-53.0, -21.2, 1.8); plinth(-43.0, -21.2, 1.8);
    sign(s, SIGNS['platform.catch'], -50.6, 1.65, ZN + 0.33, { face: 'Z' });
    sign(s, SIGNS['platform.guestright'], -49.9, 1.65, ZN + 0.33, { face: 'Z' });
    sign(s, SIGNS['poster.booking'], -46.6, 1.7, ZN + 0.33, { face: 'Z' }); sign(s, SIGNS['poster.homecoming'], -45.8, 1.7, ZN + 0.33, { face: 'Z' });
    lamp(s, 'sconce', -50.15, 2.7, ZN + 0.33, { face: 'Z', clip: CLIP, K: 2800, power: 1.3 });
    s.interact({ x: -50.6, y: 1.65, z: ZN + 0.4, radius: 1.4, prompt: 'Read: The catch', onUse: async (gm) => { await read(gm, 'The catch', ['Your weight comes back over a second or two. Sit back. Hold small children on your knee.', 'At the far end a cradle on the quay takes the car on a soft arm and brings the full g back gently. Old people say the catch is a young people\'s ride.']); found(gm, 'catch'); } });
    s.interact({ x: -49.7, y: 1.65, z: ZN + 0.4, radius: 1.4, prompt: 'Read: Guest-right', onUse: (gm) => read(gm, 'Guest-right', ['Any traveller from a drum that grants the same may stay three nights in a Margin flat and eat at the halls.', 'Sign in at the guest desk. It is the door just along, past the lift lobby.']) });
    for (const q of [[-44.7, '#a8432e'], [4.6, '#2f6f8f'], [50.6, '#c9a43a'], [-70.2, '#2f6f8f'], [70.2, '#a8432e'], [-91.0, '#c9a43a'], [93.0, '#2f6f8f']]) prop(s, 'platform.droppipe', q[0], 0, ZN + 0.3, 0, { c: q[1], h: q[1] === '#c9a43a' ? 6.25 : q[1] === '#a8432e' ? 6.95 : 5.75 });
    for (const x of [-4.6, 52.6, -69.3]) { prop(s, 'platform.aidbox', x, 0, ZN + 0.3, 0, {}); sign(s, { kind: 'plate', text: 'FIRST AID', sub: 'and a blanket' }, x, 2.08, ZN + 0.31, { face: 'Z' }); }
    for (const x of [-48, -24, 0, 24, 48, -69, 69]) {
      lamp(s, 'globe', x + (Math.abs(x) === 24 ? 3.2 : 0), 3.3, -15.5, { clip: CLIP, K: 2700, power: 1.7, r: 0.22, drop: 7.2, range: 8 });
      s.deco(() => { const xx = x + (Math.abs(x) === 24 ? 3.2 : 0); g.mat('cast', PAL.tealDark); g.lathe(xx, -15.5, [[0.05, 3.62], [0.3, 3.5], [0.34, 3.46], [0.33, 3.45]], { segs: 16, capBottom: false }); });
    }
    // alcove 6-7: the departures board
    bench(-27.2, -14.3, 0, 2.2, true); bench(-20.8, -14.3, 0, 2.2, true); plinth(-28.2, -21.2); plinth(-19.8, -21.2);
    prop(s, 'platform.bin', -24, 0, -14.4, 0, {});
    const board = (x, spec) => {
      const zb = ZN + 0.88;
      s.structure(() => {
        g.mat('panel', PAL.tealDark); g.box(x - 2.05, 1.6, zb, x + 2.05, 4.4, zb + 0.2, { bevel: 0.03 });
        g.mat('cast', PAL.brass, { rough: -0.2 }); g.box(x - 2.1, 4.35, zb, x + 2.1, 4.45, zb + 0.28); g.box(x - 2.1, 1.55, zb, x + 2.1, 1.65, zb + 0.28);
        g.mat('panel', PAL.teal); g.box(x - 2.3, 4.45, ZN + 0.3, x + 2.3, 4.6, zb + 0.6, { bevel: 0.02 });
        g.mat('cast', '#2a2d2e'); for (const sx of [-1, 1]) g.box(x + sx * 1.4 - 0.06, 2.4, ZN + 0.3, x + sx * 1.4 + 0.06, 2.55, zb);
      });
      signK(s, spec, x, 3.0, zb + 0.21, { face: 'Z', w: 3.8, h: 2.55, glow: 1.4, board: false, k: 3 });
      lamp(s, 'bulb', x, 4.2, ZN + 1.6, { clip: CLIP, K: 3400, power: 0.8, range: 5 });
    };
    board(-24, SIGNS['platform.departures']);
    s.interact({ x: -24, y: 3.0, z: ZN + 1.2, radius: 7, prompt: 'Read the departures board', onUse: async (gm) => {
      await read(gm, 'Departures', ['SORREL, 140 seconds. A car every few seconds from 05:00 to 01:00. Freight only between.',
        'RUE is two glides: across to Sorrel, change cars at Sorrel\'s Ring 2, and across again. About five minutes in all.',
        'There are no times on the board. Nobody here has ever waited long enough to need one.']);
      found(gm, 'rue-two-glides');
    } });
    // alcove 7-8: the dispatcher's booth
    s.furniture(() => {
      g.mat('panel', PAL.teal); g.box(-1.8, 0, -21.65, 1.8, 1.0, -19.3, { bevel: 0.02 });
      g.mat('cast', PAL.tealDark); for (const x of [-1.8, -0.6, 0.6, 1.8]) g.box(x - 0.04, 1.0, -19.36, x + 0.04, 2.5, -19.26); for (const z of [-21.6, -20.45]) for (const x of [-1.8, 1.8]) g.box(x - 0.04, 1.0, z - 0.04, x + 0.04, 2.5, z + 0.04);
      g.mat('panel', PAL.tealDark); g.box(-1.95, 2.5, -21.7, 1.95, 2.7, -19.15, { bevel: 0.03 });
      g.mat('wood', '#6f4e33'); g.box(-1.7, 0.98, -19.6, 1.7, 1.04, -19.3, { bevel: 0.01 });
      g.mat('paint', '#e8dcbf'); g.box(-0.5, 2.7, -19.18, 0.5, 2.95, -19.14, { faces: 'Z' });
    });
    for (const [a, b] of [[-1.76, -0.64], [-0.56, 0.56], [0.64, 1.76]]) s.glass(a, 1.04, -19.3, b, 2.48, -19.3, { tint: '#d5e6e2', opacity: 0.12 });
    for (const sx of [-1, 1]) s.glass(sx * 1.8, 1.04, -21.6, sx * 1.8, 2.48, -19.36, { tint: '#d5e6e2', opacity: 0.12 });
    signK(s, { kind: 'plate', text: 'PLATFORM CREW', sub: 'ask here' }, 0, 2.82, -19.13, { face: 'Z', w: 0.9, h: 0.26, k: 3 });
    s.solid(-1.95, 0, -21.7, 1.95, 2.7, -19.15);
    prop(s, 'stool', -0.5, 0, -20.4, 0, {}); lamp(s, 'globe', 0.4, 2.15, -20.5, { clip: [-1.8, 0, -21.65, 1.8, 2.5, -19.3], K: 3000, power: 0.6, drop: 0.3 });
    s.spot('work', -0.5, 0, -20.2, 0, { tags: ['crew', 'dispatch'] });
    bench(-3.8, -14.3, 0, 2.0, true); bench(3.8, -14.3, 0, 2.0, true);
    // alcove 8-9: the arrivals board, and the soup notice
    bench(20.8, -14.3, 0, 2.2, true); bench(27.2, -14.3, 0, 2.2, true); plinth(19.8, -21.2); plinth(28.2, -21.2);
    board(24, SIGNS['platform.arrivals']);
    s.interact({ x: 24, y: 3.0, z: ZN + 1.2, radius: 7, prompt: 'Read the arrivals board', onUse: (gm) => read(gm, 'Arrivals', ['From SORREL, every few seconds.', 'Guests: the guest desk, just across the platform. Cabs up into the drum: the lift lobby, on the back side, at the anti end.']) });
    prop(s, 'platform.fountain', 29.6, 0, -13.6, 0, {});
    sign(s, SIGNS['platform.soup'], 22.4, 1.6, ZN + 0.33, { face: 'Z' });
    s.interact({ x: 22.4, y: 1.6, z: ZN + 0.4, radius: 1.4, prompt: 'Read: No hot soup in cars', onUse: (gm) => read(gm, 'No hot soup in cars', ['Drink it on the platform. The counter will wait for you.', 'For a hundred and forty seconds the cup weighs nothing, and neither does the soup in it.']) });
    // alcove 9-10: the crew's corner
    prop(s, 'platform.lockers', 43.6, 0, ZN + 0.6, 0, { c: '#5b7a6e' }); prop(s, 'platform.lockers', 45.5, 0, ZN + 0.6, 0, { c: '#6e6a5b' });
    prop(s, 'platform.trolley', 50.2, 0, -17.0, Math.PI / 2 + 0.1, { n: 3 }); prop(s, 'platform.cone', 52.6, 0, -13.2, 0, {}); prop(s, 'platform.toolbox', 47.6, 0, -20.9, 0, { c: '#c08a2e' });
    signK(s, { kind: 'plate', text: 'CREW ONLY', sub: 'lockers · tools · tea' }, 44.5, 2.2, ZN + 0.33, { face: 'Z', w: 0.8, h: 0.3, k: 3 });
    s.spot('work', 44.4, 0, -20.6, Math.PI, { tags: ['crew', 'locker'] }); s.spot('chat', 48.3, 0, -18.6, 2.3, { tags: ['crew'] }); s.spot('chat', 47.4, 0, -19.6, 0.6, { tags: ['crew'] }); s.spot('chat', 48.6, 0, -19.8, -0.6, { tags: ['crew'] });
    // the alcoves by the great ribs
    for (const sx of [-1, 1]) { bench(sx * 69, -14.3, 0, 2.0, true); plinth(sx * 75.5, -21.2); plinth(sx * 67.6, -21.2); }

    // ================= the south walls: Homecoming lamps, posters, benches =================
    // the hand lamps hung for Homecoming, on a brass rail along the west wall
    s.deco(() => {
      g.mat('cast', PAL.brass, { rough: -0.2 });
      for (const [a, b] of [[-70.9, -64.5], [-63.5, -58.2]]) { g.tube([[a, 1.95, ZS - 0.55], [(a + b) / 2, 1.95, ZS - 0.55], [b, 1.95, ZS - 0.55]], 0.025, { segs: 6 }); for (const x of [a + 0.1, (a + b) / 2, b - 0.1]) g.tube([[x, 1.95, ZS - 0.55], [x, 1.95, ZS - 0.3]], 0.015, { segs: 4 }); }
    });
    const LAMPC = ['#f2c879', '#e8743b', '#86c7c0', '#d95d7a', '#b9d47a', '#f0e2b6', '#c79be0'];
    for (let i = 0; i < 38; i++) {
      const x = -70.6 + i * 0.32 + R.f(-0.04, 0.04); const lit = i % 7 === 3; if (x > -64.6 && x < -63.4) continue;
      prop(s, 'platform.handlamp', x, 1.95 - R.f(0, 0.06), ZS - 0.55, R.f(-0.4, 0.4), { c: LAMPC[i % LAMPC.length], lit, metal: i % 4 ? PAL.brass : '#8a8f8c' }, { cast: false });
    }
    sign(s, { kind: 'notice', title: 'Homecoming lamps', lines: ['Hang a lamp here for your', 'wanderer, tag on. At lamp-dawn', 'we light them all and meet', 'the car. Take yours home', 'when they are.'] }, -57.5, 1.75, ZS - 0.32, { face: 'z' });
    sign(s, SIGNS['poster.homecoming'], -56.3, 1.75, ZS - 0.32, { face: 'z' });
    s.interact({ x: -64.5, y: 1.8, z: ZS - 0.6, radius: 3.2, wide: true, prompt: 'Read the tags on the hand lamps', onUse: (gm) => read(gm, 'Hand lamps', ['Each lamp has a paper tag tied on with bright thread.',
      '"For Ilse, home from the Row. The Pennyfold table."', '"Tomasz. Your aunts are here early, as threatened."', '"Ren: welcome home. Bring your washing."',
      'When a block\'s wanderer comes home, the block meets the car at lamp-dawn with every one of these lit.']) });
    s.spot('stand', -63.0, 0, ZS - 1.3, Math.PI, { tags: ['wait', 'look'] }); s.spot('stand', -67.4, 0, ZS - 1.4, Math.PI + 0.3, { tags: ['wait', 'look'] });
    // posters and benches along both south walls
    const posters = [['poster.flight', -54.6], ['poster.feast', -52.9], ['poster.quiet', -51.2], ['poster.dawn', 46.9], ['poster.booking', 49.0], ['poster.flight', 60.6], ['poster.feast', 62.3], ['poster.homecoming', 69.6]];
    for (const p of posters) sign(s, SIGNS[p[0]], p[1], 1.75, ZS - 0.32, { face: 'z' });
    sign(s, SIGNS['platform.guestright'], 46.0, 1.7, ZS - 0.32, { face: 'z' });
    bench(-50.8, ZS - 0.85, Math.PI, 2.0, true); bench(52.0, ZS - 0.85, Math.PI, 2.2, true); bench(60.0, ZS - 0.85, Math.PI, 2.2, true); bench(66.0, ZS - 0.85, Math.PI, 2.0, true);
    prop(s, 'plant', -47.0, 0, ZS - 0.7, 0, { kind: 'broad', size: 1.7, pot: '#2f6f73' }); prop(s, 'plant', -33.0, 0, ZS - 0.75, 0, { kind: 'fern', size: 1.3, pot: '#a3563a' });
    prop(s, 'plant', 45.2, 0, ZS - 0.75, 0, { kind: 'fine', size: 1.6, pot: '#c08a2e' }); prop(s, 'plant', 57.4, 0, ZS - 0.75, 0, { kind: 'broad', size: 1.5, pot: '#8a2f3c' });
    prop(s, 'platform.fountain', 68.6, 0, ZS - 0.7, 0, {}); prop(s, 'platform.bin', -45.6, 0, ZS - 0.6, 0, {});
    signK(s, SIGNS['platform.plate'], -33.0, 2.4, ZS - 0.32, { face: 'z', w: 1.1, h: 0.48, k: 3.5 });
    signK(s, SIGNS['platform.plate'], 70.0, 2.4, ZS - 0.32, { face: 'z', w: 1.1, h: 0.48, k: 3.5 });
    for (const x of [-64, -56, -48, 48, 56, 64, -96, -80, 80, 96]) lamp(s, 'sconce', x, 3.4, ZS - 0.9, { face: 'z', clip: CLIP, K: 2700, power: Math.abs(x) > 72 ? 1.1 : 1.6 });
    // the beam front: letters, banners and the soffit lights over the openings
    signK(s, { kind: 'letters', text: 'Station Ring 2', palette: ['#f3e6c8'] }, 0, 6.05, ZS - 0.33, { face: 'z', w: 8.4, h: 1.2, glow: 1.6, k: 3 });
    const BAN = [[-20, SIGNS['platform.welcome']], [-12, { kind: 'banner', text: 'CHERVIL KEEPS GUEST-RIGHT', palette: ['#2f6f73', '#f3e6c8'] }],
      [12, { kind: 'banner', text: 'BOOKING DAY', palette: ['#1f2b5c', '#e2b65a'] }], [20, { kind: 'banner', text: 'WELCOME HOME', palette: ['#c08a2e', '#2a1c14'] }], [36, { kind: 'banner', text: 'THE QUIET', palette: ['#3a3f4a', '#e8e2d0'] }]];
    for (const [x, spec] of BAN) {
      signK(s, spec, x, 6.2, ZS - 0.4, { face: 'z', w: 1.2, h: 2.4, board: false, k: 2 });
      s.deco(() => { g.mat('cast', PAL.brass); g.tube([[x - 0.7, 7.44, ZS - 0.42], [x + 0.7, 7.44, ZS - 0.42]], 0.022, { segs: 6 }); g.mat('weave', '#d9a441'); for (let k = 0; k < 7; k++) g.tube([[x - 0.6 + k * 0.2, 5.0, ZS - 0.41], [x - 0.6 + k * 0.2, 4.86, ZS - 0.41]], 0.01, { segs: 3 }); });
    }
    for (const x of [-25, -9, 9, 25, 37.5]) lamp(s, 'spot', x, 4.0, ZS - 0.6, { clip: [x - 6, -0.5, 3, x + 6, 4.1, ZS + 3.5], K: 3000, power: 0.7 });

    // ================= the vault's work lights =================
    for (let x = -64; x <= 64; x += 16) {
      const y = vaultY(-5) - 2.7;
      s.deco(() => {
        g.mat('cast', '#2a2d2e'); g.tube([[x, vaultY(-5) - 0.4, -5], [x, y + 0.36, -5]], 0.018, { segs: 5 });
        g.mat('cast', PAL.tealDark); g.lathe(x, -5, [[0.08, y + 0.4], [0.12, y + 0.34], [0.3, y + 0.16], [0.52, y], [0.5, y - 0.02]], { segs: 18, capBottom: false });
        g.mat('diffuser', '#f3f6ff', { emissive: 6 }); g.cyl(x, y + 0.02, -5, 0.4, 0.01, { segs: 16 });
      });
      s.light({ at: [x, y - 0.1, -5], color: warm(4300), power: 42, range: 18, type: 'spot', dir: [0, -1, 0], cone: [64, 30], clip: CLIP, shadow: true, radius: 0.4 });
    }
    roomGlow(s, -XE, 0, ZN, XE, 12.6, ZS, { sky: '#e9d2b4', ground: '#8a7f6c', power: 0.13 });

    // ================= you, arriving =================
    const bag = movable(s, (gg) => { gg.at(0, 0, 0, 0.5); gg.scale(0.82); gg.mat('weave', '#5d6b3a'); gg.push(); gg.rotZ(Math.PI / 2); gg.lathe(0, 0, [[0, -0.32], [0.13, -0.31], [0.16, -0.24], [0.17, 0], [0.16, 0.24], [0.13, 0.31], [0, 0.32]], { segs: 12 }); gg.pop();
      gg.mat('leather', '#3a2618'); for (const x of [-0.18, 0.18]) gg.tube([[x, 0.0, 0.17], [x, 0.17, 0.1], [x, 0.25, 0], [x, 0.17, -0.1], [x, 0.0, -0.17]], 0.012, { segs: 4, caps: false });
      gg.tube([[-0.32, 0.12, 0], [-0.1, 0.42, 0], [0.1, 0.42, 0], [0.32, 0.12, 0]], 0.01, { segs: 4 });
      gg.mat('weave', '#c9552e'); gg.box(-0.05, 0.08, 0.15, 0.09, 0.15, 0.172); gg.pop(); }, [-36.6, 0.16, -8.3], { radius: 0.6, caster: true });
    if (game.flags && game.flags.platformBag) bag.userData.hidden = true;
    s.interact({ x: -36.6, y: 0.4, z: -8.3, radius: 1.5, prompt: 'Pick up your bag', enabled: (gm) => !(gm.flags && gm.flags.platformBag), onUse: async (gm) => {
      if (gm.flags) gm.flags.platformBag = true; bag.userData.hidden = true; sfx(gm, 'clunk', f, -36.6, 0.3, -8.3);
      await read(gm, 'Your bag', ['Your bag, with the crock of Pell\'s mother wrapped in a jumper at the top. It has never felt so heavy.',
        'Down here at the rim it weighs its whole weight: three kilometres from the axis, a full g. Up in Candlewick it will be two parts in a hundred lighter. That is why nobody lives down here, among other things.']);
      found(gm, 'full-weight');
    } });
    s.interact({ radius: 1.2, priority: 1, pos: (gm) => { const se = gm.player.seat; if (se && se.platform) return [se.x + Math.sin(gm.player.yaw) * 0.6, 1.0, se.z - Math.cos(gm.player.yaw) * 0.6]; return null; }, prompt: 'Get up', onUse: (gm) => gm.player.stand() });
    for (const bb of benches) {
      const fx = Math.sin(bb.yaw), fz = Math.cos(bb.yaw), ax = Math.cos(bb.yaw), az = -Math.sin(bb.yaw);
      s.interact({ x: bb.x + fx * 0.25, y: 0.55, z: bb.z + fz * 0.25, radius: 1.3, wide: true, prompt: 'Sit on the bench', onUse: (gm) => {
        const p = gm.player.pos; let u = (p.x - bb.x) * ax + (p.z - bb.z) * az; u = Math.max(-bb.w / 2 + 0.35, Math.min(bb.w / 2 - 0.35, u));
        sitAt(gm, bb.x + ax * u + fx * 0.04, bb.z + az * u + fz * 0.04, bb.yaw, 'bench' + bb.x + ',' + bb.z);
      } });
    }

    // ================= people: walkways, spots =================
    const laneXs = new Set();
    for (let x = -108; x <= 108; x += 8) laneXs.add(x);
    for (const b of BAYS) laneXs.add(b.cx);
    for (const x of [-40, -25, 0, 25, 39, -58, -42, -18, 6, 30, 54, -48, 48, -24, 24]) laneXs.add(x);
    const xsSorted = Array.from(laneXs).sort((a, b) => a - b).filter((x, i, A) => i === 0 || x - A[i - 1] > 0.8);
    for (const z of [-5.5, 5.5]) s.path(xsSorted.map((x) => [x, z]), { width: 2.4 });
    const cross = [-58, -42, -18, 6, 30, 54]; for (const x of cross) s.path([[x, -5.5], [x, 5.5]], { width: 1.4 });
    for (const x of [-25, 0, 25, 39]) s.path([[x, 5.5], [x, ZS]], { width: 2.2 });
    s.path([[-40, 5.5], [-40, ZS]], { width: 2.4 });
    for (const b of BAYS) {
      if (b.kind === 'shut') continue;
      s.path([[b.cx, -5.5], [b.cx, -9.4], [b.cx, -11.3]], { width: 1.6, tags: ['queue'] });
      if (b.kind === 'car') { s.path([[b.cx, -11.3], [b.cx, -12.9], [b.cx, -14.6]], { width: 0.9, tags: ['board'] }); s.path([[b.cx, -14.6], [b.cx - 1.6, -15.2]], { width: 0.8 }); s.path([[b.cx, -14.6], [b.cx + 1.6, -15.2]], { width: 0.8 }); }
      if (b.kind === 'works') s.path([[b.cx, -11.3], [b.cx, -14.2]], { width: 1.0, tags: ['crew'] });
    }
    for (const x of [-48, -24, 0, 24, 48]) s.path([[x, -5.5], [x, -12.6], [x, -13.4]], { width: 1.6 });
    // waiting passengers, queues, talkers, the crew
    for (const b of BAYS.filter((q) => q.kind === 'car' || q.kind === 'loop')) {
      const cx = b.cx;
      for (const q of [[cx, -11.3], [cx + 0.2, -10.6], [cx - 0.1, -9.9], [cx + 0.15, -9.2]]) s.spot('queue', q[0], 0, q[1], Math.PI, { tags: ['wait', 'queue'] });
      for (const q of [[cx - 2.6, -8.4, 0.2], [cx + 2.9, -8.0, -0.25], [cx - 3.8, -6.9, 0.35], [cx + 1.6, -7.2, 0], [cx + 4.3, -9.0, -0.5]]) s.spot('stand', q[0], 0, q[1], Math.PI + q[2], { tags: ['wait'] });
      s.spot('work', cx + 5.2, 0, -10.9, Math.PI + 0.4, { tags: ['crew', 'dispatch'] });
    }
    const chat = (x, z, n, tags) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.3, px = x + Math.sin(a) * 0.6, pz = z + Math.cos(a) * 0.6; s.spot('chat', px, 0, pz, Math.atan2(x - px, z - pz), { tags }); } };
    chat(-30, -6.8, 3, ['wait']); chat(-5, 6.6, 4, ['wait']); chat(17, -7.4, 2, ['wait']); chat(42, 6.8, 3, ['wait']); chat(-52, 6.2, 3, ['wait']); chat(4, 3.0, 2, ['wait', 'clock']);
    for (const q of [[-2.4, -2.6, Math.PI * 0.5], [2.6, -2.4, -Math.PI * 0.5], [-14, 3.4, Math.PI], [12, 3.0, 0.6], [32, -3.2, 2.6], [-40, 3.0, -2.6], [-44, -3.4, 3.0], [52, 3.2, -0.2], [60, -3.0, 2.8], [-66, 3.1, 0.3]]) s.spot('stand', q[0], 0, q[1], q[2], { tags: ['wait'] });
    for (const q of [[-50, -15.4, 0.1], [-46, -16.2, -0.2], [-26, -16.0, 0], [-22, -15.5, 0.3], [22, -15.7, -0.1], [26, -16.2, 0.2], [-24, -18.6, 0], [24, -18.6, 0]]) s.spot('stand', q[0], 0, q[1], q[2], { tags: ['wait', 'board'] });

    // ================= sound and the zone =================
    s.zoneBox({ id: 'platform', place: 'platform', box: [-XE, -1, ZN, XE, 13, ZS], name: 'The glide platform', sub: 'Station Ring 2 · deck 1 · the rim · 1 g', ambience: 'station', reverb: 'station', headroom: 12 });
    let loopsOn = false; const startLoops = () => {
      if (loopsOn || !game.audio || !game.loopAt) return; loopsOn = true;
      for (const x of [-60, -12, 36]) game.loopAt('platform', f, x, 5, -16, { vol: 0.55, radius: 60 });
      game.loopAt('tide', f, 0, 6.5, ZN + 1, { vol: 0.35, radius: 30 });
      game.loopAt('murmur', f, 0, 1.6, 2, { vol: 0.5, radius: 50, param: 0.6 });
    };
    // the clock's hands, the loops, and the two cars' cycles
    W.dynamics.push({ scope: s, update(dt) {
      startLoops();
      const m = game.clock ? game.clock.minutes + 1 : 600;
      const am = (m % 60) / 60 * Math.PI * 2, ah = ((m / 60) % 12) / 12 * Math.PI * 2;
      for (const h of hands) rotX(h.mesh, (h.kind === 'm' ? am : ah) * (h.sx > 0 ? -1 : 1));
      for (const L of loops) L.update(dt);
    } });

    s.finish();
    game.spawns.platform = { frame: f, x: -38.4, y: 0, z: -10.0, yaw: 2.0, pitch: -0.1 };
    game.spawns.start = game.spawns.platform;

    buildLobby(game, f);
  },
};

// ---------------------------------------------------------------------------------------------------------------
// A bay whose car comes and goes: the hatch opens, the car rises with a chime and the beacons turning, locks,
// opens its doors, stands, closes, sinks, and the hatch shuts over it. It holds its doors while you are aboard.
function makeLoop(s, game, f, b, idx) {
  const W = s.world, g0 = s.g, cx = b.cx, DOWN = -5.6;
  const body = movable(s, (gg) => drawCar(gg, { interior: true, fakeWindows: true, game, number: 'CAR ' + (b.n === 7 ? '3318' : '5114'), seed: b.n, body: b.n === 7 ? '#a9572e' : '#b4452f' }), [cx, DOWN, ZA], { center: [0, 0.8, -3], radius: 6.2, caster: true });
  const leaf = (side) => movable(s, (gg) => {
    const a = side < 0 ? -0.64 : 0, c = side < 0 ? 0 : 0.64;
    gg.mat('panel', '#7c3b22'); gg.box(a, 0, -0.34, c, 2.1, -0.14, { bevel: 0.015 });
    gg.mat('plain', '#173f48', { rough: -0.4, emissive: 0.3 }); gg.push(); gg.move((a + c) / 2, 1.45, -0.135); gg.rotX(Math.PI / 2); gg.cyl(0, 0, 0, 0.11, 0.01, { segs: 12 }); gg.pop();
    gg.mat('cast', PAL.brass); gg.box(side < 0 ? -0.1 : 0.06, 0.95, -0.14, side < 0 ? -0.06 : 0.1, 1.25, -0.11);
    gg.mat('speckle', '#1b1b1b'); gg.box(side < 0 ? -0.02 : 0, 0, -0.33, side < 0 ? 0 : 0.02, 2.1, -0.15);
  }, [cx, DOWN, ZA], { center: [0, 1, -0.2], radius: 1.4 });
  const leafL = leaf(-1), leafR = leaf(1);
  const hatchDrawM = (gg, side) => {
    const x0 = side < 0 ? -5 : 0, x1 = side < 0 ? 0 : 5;
    gg.mat('deckplate', '#4c4a46'); gg.box(x0, -0.14, ZP0, x1, 0.012, ZP1, { faces: 'YxXzZ' });
    let k = 0; for (let z = ZP0; z < ZP1 - 0.05; z += 0.5, k++) { gg.mat('paint', k % 2 ? '#1c1c1c' : PAL.yellow); const ex = side < 0 ? x0 : x1 - 0.32; gg.box(ex, 0.012, z, ex + 0.32, 0.016, Math.min(ZP1, z + 0.5), { faces: 'Y' }); }
    k = 0; for (let x = x0; x < x1 - 0.05; x += 0.5, k++) { gg.mat('paint', k % 2 ? '#1c1c1c' : PAL.yellow); for (const z of [ZP0, ZP1 - 0.32]) gg.box(x, 0.012, z, Math.min(x1, x + 0.5), 0.016, z + 0.32, { faces: 'Y' }); }
    gg.mat('speckle', '#1b1b1b'); gg.box(side < 0 ? -0.04 : 0, -0.12, ZP0, side < 0 ? 0 : 0.04, 0.02, ZP1, { faces: 'YxX' });
    gg.mat('cast', '#3a3d3e'); for (const z of [ZP0 + 1.6, ZP1 - 1.6]) gg.cyl((x0 + x1) / 2, 0.012, z, 0.16, 0.006, { segs: 10 });
  };
  const hatchL = movable(s, (gg) => hatchDrawM(gg, -1), [cx, 0, 0], { center: [-2.5, 0, -15.8], radius: 4.4 });
  const hatchR = movable(s, (gg) => hatchDrawM(gg, 1), [cx, 0, 0], { center: [2.5, 0, -15.8], radius: 4.4 });
  const gate = (side) => movable(s, (gg) => {
    const a = side < 0 ? -0.86 : 0.02, c = side < 0 ? -0.02 : 0.86, z0 = ZBAR - 0.22, z1 = ZBAR - 0.15;
    gg.mat('cast', PAL.teal); gg.box(a, 0.05, z0, c, 0.13, z1, { bevel: 0.01 }); gg.box(a, 1.07, z0, c, 1.15, z1, { bevel: 0.01 }); gg.box(a, 0.05, z0, a + 0.06, 1.15, z1, { bevel: 0.01 }); gg.box(c - 0.06, 0.05, z0, c, 1.15, z1, { bevel: 0.01 });
    gg.mat('cast', PAL.tealDark); for (let x = a + 0.15; x < c - 0.08; x += 0.12) gg.tube([[x, 0.13, (z0 + z1) / 2], [x, 1.07, (z0 + z1) / 2]], 0.012, { segs: 5, caps: false });
    gg.mat('paint', PAL.yellow); gg.box(a, 1.15, z0 - 0.01, c, 1.2, z1 + 0.01, { bevel: 0.012 });
  }, [cx, 0, 0], { center: [0, 0.6, ZBAR], radius: 1.2 });
  const gateL = gate(-1), gateR = gate(1);
  const beacons = [-1, 1].map((sx) => movable(s, (gg) => { gg.mat('diffuser', '#ffb040', { emissive: 9 }); gg.ball(0, 0.1, 0, 0.106, 0.106, 0.106, { segs: 10, rings: 5, bottom: 0 }); }, [cx + sx * 4.9, 4.78, ZBAR], { radius: 0.4 }));
  const amber = s.light({ at: [cx, 4.95, ZBAR + 0.3], color: '#ff9a30', power: 5, range: 11, clip: CLIP, radius: 0.15 }); amber.scale = 0;
  const inBox = [cx - CAR.ix - 0.05, -8, ZA + CAR.iz1 - 0.05, cx + CAR.ix + 0.05, CAR.ih + 0.1, ZA + 0.7];
  const inner = s.light({ at: [cx, DOWN + 2.12, ZA - 2.4], color: warm(3300), power: 5.5, range: 5, clip: inBox, lamp: true, radius: 0.2 });
  s.zoneBox({ id: 'glidecar-' + b.n, place: 'platform', box: [cx - CAR.ix, -0.3, ZA + CAR.iz1, cx + CAR.ix, CAR.ih, ZA - 0.2], name: 'A glide car', sub: 'Platform ' + b.n + ' · for Sorrel', ambience: 'cab', reverb: 'room' });
  let gateCol = s.solid(cx - 0.86, 0, ZBAR - 0.12, cx + 0.86, 2.8, ZBAR + 0.12), carCols = [];
  const rng = new Rng(hashStr('loop' + b.n));
  const DUR = { open: 2.6, rise: 5.5, lock: 0.9, doors: 1.5, stand: 22, close: 1.8, sink: 5.5, shut: 2.6 };
  const NEXT = { down: 'open', open: 'rise', rise: 'lock', lock: 'doors', doors: 'stand', stand: 'close', close: 'sink', sink: 'shut', shut: 'down' };
  const st = { state: idx ? 'stand' : 'down', t: 0, dur: idx ? 14 : 6, freight: false, held: false, time: 0 };
  const solidsOn = (on) => {
    if (on && !carCols.length) { carCols = carSolids(cx, 0, ZA).map((q) => s.solid(q[0], q[1], q[2], q[3], q[4], q[5])); if (gateCol) { s.col.remove(gateCol); gateCol = null; } }
    else if (!on) { if (!gateCol) gateCol = s.solid(cx - 0.86, 0, ZBAR - 0.12, cx + 0.86, 2.8, ZBAR + 0.12); for (const c of carCols) s.col.remove(c); carCols = []; }
  };
  if (idx) solidsOn(true);
  const playerAboard = () => { const P = game.player; if (!P || P.frame !== f) return false; const p = P.pos; return p.x > cx - 2.95 && p.x < cx + 2.95 && p.z > ZA + CAR.iz1 - 0.2 && p.z < ZBAR + 0.55 && p.y < 3; };
  const playerNear = () => { const P = game.player; if (!P || P.frame !== f) return false; const p = P.pos; return Math.abs(p.x - cx) < 30 && p.z > ZN && p.z < ZS; };
  const enter = (name) => {
    st.state = name; st.t = 0; st.held = false;
    const h = game.clock ? game.clock.hours : 10; st.freight = h >= 1 && h < 5;
    st.dur = name === 'down' ? 14 + rng.f(0, 14) : name === 'stand' ? (st.freight ? 6 : DUR.stand + rng.f(-4, 6)) : DUR[name];
    if (name === 'open' || name === 'shut') sfx(game, 'hatch', f, cx, 0, -15.8);
    if (name === 'rise') sfx(game, 'chime', f, cx, 3.5, ZBAR);
    if (name === 'lock') sfx(game, 'clunk', f, cx, 0.5, ZA);
    if (name === 'doors' && !st.freight) { sfx(game, 'door-slide', f, cx, 1, ZA); solidsOn(true); }
    if (name === 'close' && !st.freight) sfx(game, 'chime', f, cx, 3.5, ZBAR);
    if (name === 'sink') {
      sfx(game, 'clunk', f, cx, 0.5, ZA); solidsOn(false);
      if (playerNear() && !(game.flags && game.flags.platformWatched)) { if (game.flags) game.flags.platformWatched = true; toast(game, 'Count to a hundred and forty. By then it is in Sorrel.'); found(game, 'glide'); }
    }
  };
  if (idx) { body.userData.origin[1] = 0; }
  return { update(dt) {
    st.t += dt; st.time += dt;
    if (st.t >= st.dur) {
      if ((st.state === 'stand' || st.state === 'close') && !st.freight && playerAboard()) {
        if (st.state === 'close') { enter('doors'); st.t = DUR.doors * 0.5; }
        else st.t = st.dur - 1.5;
        if (!st.held) { st.held = true; if (!(game.flags && game.flags.platformHeld)) { if (game.flags) game.flags.platformHeld = true; toast(game, 'The car holds its doors while you are aboard. It is going to Sorrel, and you have only just come from there.'); } }
      } else enter(NEXT[st.state]);
    }
    const k = Math.min(1, st.t / st.dur), S = st.state;
    let hatch = 0, y = DOWN, doors = 0, flash = false;
    if (S === 'open') { hatch = k; flash = true; } else if (S === 'shut') { hatch = 1 - k; flash = true; } else if (S !== 'down') hatch = 1;
    if (S === 'rise') { y = DOWN + (0 - DOWN) * smoothstep(0, 1, k); flash = true; }
    else if (S === 'lock' || S === 'doors' || S === 'stand' || S === 'close') y = 0;
    else if (S === 'sink') { y = DOWN * smoothstep(0, 1, k); flash = true; }
    if (!st.freight) { if (S === 'doors') doors = smoothstep(0, 1, k); else if (S === 'stand') doors = 1; else if (S === 'close') { doors = 1 - smoothstep(0, 1, k); flash = true; } }
    body.userData.origin[1] = y;
    leafL.userData.origin[0] = cx - 0.62 * doors; leafL.userData.origin[1] = y; leafR.userData.origin[0] = cx + 0.62 * doors; leafR.userData.origin[1] = y;
    const hd = -0.06 * Math.min(1, hatch / 0.12), hs = 5.3 * Math.max(0, (hatch - 0.12) / 0.88);
    hatchL.userData.origin[0] = cx - hs; hatchL.userData.origin[1] = hd; hatchR.userData.origin[0] = cx + hs; hatchR.userData.origin[1] = hd;
    hatchL.userData.hidden = hatchR.userData.hidden = false;
    gateL.userData.origin[0] = cx - 0.84 * doors; gateR.userData.origin[0] = cx + 0.84 * doors;
    const on = flash && Math.floor(st.time * 2.6) % 2 === 0;
    for (const bm of beacons) bm.userData.hidden = !on;
    amber.scale = on ? 1 : 0;
    inner.rho = f.rho(y + 2.12);
    body.userData.hidden = leafL.userData.hidden = leafR.userData.hidden = (S === 'down');
    void g0; void W;
  } };
}

// ---------------------------------------------------------------------------------------------------------------
// The lift lobby: four cab berths up into the drum, a call post, a map of the drum, benches, the stairs nobody uses.
function buildLobby(game, f) {
  const W = game.world, s = W.scope('station-lobby', f), g = s.g;
  const X0 = -46, X1 = -34, Z0 = 12, Z1 = 26, H = 5.0;
  const LC = [X0 - 0.05, -0.3, Z0 - 0.5, X1 + 0.05, H + 0.1, Z1 + 0.05];
  floor(s, X0, Z0, X1, Z1, 0, 'terrazzo', '#c9b794');
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#eadcc0');
  const WL = { t: 0.24, mat: 'plaster', tint: '#e8d4b0', dado: { h: 1.3, mat: 'tile', tint: '#2f6f73' }, skirt: '#3a2d22' };
  wall(s, X0 + 0.12, Z0, X0 + 0.12, Z1, 0, H, WL);
  wall(s, X1 - 0.12, Z0, X1 - 0.12, Z1, 0, H, Object.assign({}, WL, { openings: [{ at: 2.4, w: 1.0, h: 2.1 }] }));
  wall(s, X0, Z1 - 0.12, X1, Z1 - 0.12, 0, H, Object.assign({}, WL, { dado: { h: 1.3, mat: 'tile', tint: '#2a5f63' } }));
  // floor inlay: a brass ring and a teal disc under the call post, a threshold strip at the portal
  s.deco(() => {
    g.mat('cast', PAL.brass, { rough: -0.2 }); g.lathe(-40, 20.0, [[2.3, 0.004], [2.2, 0.004]], { segs: 48, capBottom: false, capTop: false }); g.lathe(-40, 20.0, [[1.5, 0.004], [1.44, 0.004]], { segs: 40, capBottom: false, capTop: false });
    g.mat('terrazzo', '#2f6f73'); g.lathe(-40, 20.0, [[2.2, 0.003], [1.5, 0.003]], { segs: 48, capBottom: false, capTop: false });
    g.mat('cast', PAL.brass); g.box(-44, 0, 11.7, -36, 0.006, 12.2, { faces: 'Y' });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.push(); g.move(-40 + Math.sin(a) * 1.85, 0, 20 + Math.cos(a) * 1.85); g.rotY(a); g.box(-0.05, 0, -0.28, 0.05, 0.005, 0.28, { faces: 'Y' }); g.pop(); }
  });
  // picture rail, cornice and coffered ceiling
  s.structure(() => {
    g.mat('wood', '#5b4636'); g.box(X0 + 0.24, 3.3, Z0 + 0.3, X0 + 0.29, 3.36, Z1 - 0.24, { faces: 'XyY' }); g.box(X1 - 0.29, 3.3, Z0 + 0.3, X1 - 0.24, 3.36, Z1 - 0.24, { faces: 'xyY' }); g.box(X0 + 0.24, 3.3, Z1 - 0.29, X1 - 0.24, 3.36, Z1 - 0.24, { faces: 'zyY' });
    g.mat('paint', '#d8c39c'); g.box(X0 + 0.24, H - 0.3, Z0 + 0.3, X1 - 0.24, H, Z0 + 0.6, { faces: 'yZ' }); g.box(X0 + 0.24, H - 0.3, Z1 - 0.54, X1 - 0.24, H, Z1 - 0.24, { faces: 'yz' });
    g.box(X0 + 0.24, H - 0.3, Z0 + 0.3, X0 + 0.54, H, Z1 - 0.24, { faces: 'yX' }); g.box(X1 - 0.54, H - 0.3, Z0 + 0.3, X1 - 0.24, H, Z1 - 0.24, { faces: 'yx' });
    g.mat('wood', '#6b4a2f'); for (const z of [15.6, 19.2, 22.8]) g.box(X0 + 0.54, H - 0.42, z - 0.12, X1 - 0.54, H, z + 0.12, { faces: 'yzZ', bevel: 0.01 });
    for (const x of [-42, -38]) g.box(x - 0.12, H - 0.42, Z0 + 0.6, x + 0.12, H, Z1 - 0.54, { faces: 'yxX', bevel: 0.01 });
    g.mat('paint', '#2f6f73'); for (const x of [-44, -40, -36]) for (const z of [13.8, 17.4, 21.0, 24.4]) g.box(x - 1.4, H - 0.03, z - 1.3, x + 1.4, H - 0.02, z + 1.3, { faces: 'y' });
  });
  // the ring lamp over the call post
  s.deco(() => {
    const ring = []; for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; ring.push([-40 + Math.cos(a) * 1.1, 3.9, 20 + Math.sin(a) * 1.1]); }
    g.mat('cast', PAL.brass, { rough: -0.25 }); g.tube(ring, 0.035, { segs: 8, closed: true });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; g.tube([[-40 + Math.cos(a) * 1.1, 3.9, 20 + Math.sin(a) * 1.1], [-40, H, 20]], 0.008, { segs: 3 }); }
    g.mat('diffuser', '#ffe7bf', { emissive: 4.5, lamp: true }); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.ball(-40 + Math.cos(a) * 1.1, 3.72, 20 + Math.sin(a) * 1.1, 0.11, 0.13, 0.11, { segs: 10, rings: 6 }); }
    g.mat('cast', PAL.brass); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.cyl(-40 + Math.cos(a) * 1.1, 3.83, 20 + Math.sin(a) * 1.1, 0.05, 0.07, { segs: 8 }); }
  });
  s.light({ at: [-40, 3.6, 20], color: warm(2800), power: 16, range: 12, clip: LC, shadow: true, lamp: true, radius: 0.9 });
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffdcae', ground: '#b09474', power: 0.3 });
  // the four berths
  const BX = [-43.4, -41.13, -38.87, -36.6], ZW = Z1 - 0.24;
  BX.forEach((c, i) => {
    s.furniture(() => {
      g.mat('panel', PAL.tealDark); g.box(c - 0.92, 0, ZW - 0.14, c - 0.72, 2.55, ZW, { bevel: 0.015 }); g.box(c + 0.72, 0, ZW - 0.14, c + 0.92, 2.55, ZW, { bevel: 0.015 }); g.box(c - 0.92, 2.32, ZW - 0.16, c + 0.92, 2.6, ZW, { bevel: 0.02 });
      g.mat('cast', PAL.brass, { rough: -0.2 }); g.box(c - 0.95, 2.6, ZW - 0.18, c + 0.95, 2.66, ZW); g.box(c - 0.72, 0, ZW - 0.1, c + 0.72, 0.012, ZW + 0.0);
      g.mat('brushed', '#a3a7a3'); g.box(c - 0.71, 0.01, ZW - 0.06, c - 0.01, 2.31, ZW - 0.02, { faces: 'zxX' }); g.box(c + 0.01, 0.01, ZW - 0.06, c + 0.71, 2.31, ZW - 0.02, { faces: 'zxX' });
      g.mat('plain', '#1d2628', { rough: -0.4 }); for (const sx of [-1, 1]) g.box(c + sx * 0.36 - 0.06, 1.2, ZW - 0.065, c + sx * 0.36 + 0.06, 1.9, ZW - 0.06, { faces: 'z' });
      g.mat('speckle', '#141414'); g.box(c - 0.012, 0.01, ZW - 0.07, c + 0.012, 2.31, ZW - 0.06, { faces: 'z' });
      g.mat('cast', '#2a2d2e'); g.cyl(c, 2.66, ZW - 0.1, 0.11, 0.05, { segs: 12 });
      g.mat('diffuser', i % 2 ? '#ffb347' : '#86e08e', { emissive: 5, lamp: false }); g.ball(c, 2.78, ZW - 0.1, 0.085, 0.085, 0.085, { segs: 10, rings: 6, bottom: -0.2 });
      g.mat('paint', PAL.yellow); g.box(c - 0.7, 0, ZW - 1.0, c + 0.7, 0.005, ZW - 0.94, { faces: 'Y' });
    });
    signK(s, { kind: 'plate', text: 'BERTH ' + (4 - i), sub: i % 2 ? 'cab on its way' : 'cab waiting' }, c, 3.05, ZW - 0.01, { face: 'z', w: 0.7, h: 0.28, k: 2.5 });
    s.solid(c - 0.95, 0, ZW - 0.2, c + 0.95, 2.66, ZW);
    s.interact({ x: c, y: 1.2, z: ZW - 0.3, radius: 1.5, prompt: 'Take a cab from berth ' + (4 - i), onUse: (gm) => {
      if (gm.cab && gm.cab.open) gm.cab.open('station');
      else { if (gm.audio) gm.audio.ui('deny'); toast(gm, 'The cabs are not running yet.'); }
    } });
    s.spot('stand', c + 0.2, 0, ZW - 1.3, 0, { tags: ['wait', 'cab'] });
  });
  for (const x of [-42.27, -40, -37.73]) lamp(s, 'sconce', x, 2.55, ZW - 0.02, { face: 'z', clip: LC, K: 2700, power: 1.1 });
  sign(s, SIGNS['lobby.calling'], -40, 1.55, ZW - 0.03, { face: 'z' });
  // the call post
  prop(s, 'platform.callpost', -40, 0, 20.0, 0, {});
  s.interact({ x: -40, y: 1.12, z: 20.0, radius: 1.4, prompt: 'Press the call button', onUse: async (gm) => {
    sfx(gm, 'chime', f, -40, 1.1, 20);
    await read(gm, 'The call post', ['The button glows and a lamp over one of the berths turns green: a cab is already waiting.', 'It will take you and whoever you are with and nobody else, door to door, with no changes. There are six to nine million cabs in Chervil.']);
    found(gm, 'one-party');
  } });
  // the map of the drum on the west wall: a section, rim at the bottom (out is down), and the words beside it
  s.structure(() => {
    g.mat('wood', '#4a3626'); g.box(X0 + 0.24, 1.25, 16.3, X0 + 0.32, 3.15, 20.7, { bevel: 0.01 });
    g.mat('paint', '#1f2b3c'); g.box(X0 + 0.32, 1.32, 16.4, X0 + 0.34, 3.08, 17.95, { faces: 'X' });
    g.push(); g.move(X0 + 0.35, 2.2, 17.18); g.rotZ(-Math.PI / 2);
    g.mat('cast', PAL.brass, { rough: -0.2 }); g.lathe(0, 0, [[0.66, 0], [0.62, 0]], { segs: 40, capBottom: false, capTop: false });
    g.mat('paint', '#2f6f73'); g.lathe(0, 0, [[0.62, -0.002], [0.36, -0.002]], { segs: 40, capBottom: false, capTop: false });
    g.mat('paint', '#e7b547'); g.lathe(0, 0, [[0.36, -0.003], [0.33, -0.003]], { segs: 40, capBottom: false, capTop: false });
    g.mat('paint', '#f2ede0', { emissive: 0.5 }); g.box(-0.012, -0.004, -0.012, 0.012, 0.0, 0.012);
    g.pop();
  });
  s.deco(() => { g.mat('diffuser', '#ff5a3a', { emissive: 6 }); g.ball(X0 + 0.37, 2.2 - 0.64, 17.18, 0.035, 0.035, 0.035, { segs: 8, rings: 5 }); g.mat('diffuser', '#ffd27a', { emissive: 3 }); g.ball(X0 + 0.37, 2.2 - 0.6, 17.38, 0.022, 0.022, 0.022, { segs: 6, rings: 4 }); });
  signK(s, { kind: 'plate', text: 'YOU ARE HERE', sub: 'the rim · out is down' }, X0 + 0.36, 1.48, 17.18, { face: 'X', w: 0.6, h: 0.18, board: false, k: 2 });
  signK(s, { kind: 'board', title: 'THE DRUM FROM HERE', lines: ['Deck 1 · the rim · here · 1 g', 'Decks 1 to 15 · the Keel', 'Decks 16 to 21 · Candlewick', 'The Hollow · half a g · 90 s up', 'Nine station rings, front to back', 'You are on Ring Two'] }, X0 + 0.35, 2.2, 19.35, { face: 'X', w: 2.5, h: 1.72, board: false, k: 2.6 });
  lamp(s, 'spot', X0 + 1.4, H, 18.5, { dir: [-0.6, -0.8, 0], cone: [48, 22], clip: LC, K: 3000, power: 0.5 });
  s.interact({ x: X0 + 0.4, y: 2.2, z: 18.5, radius: 2.4, wide: true, prompt: 'Look at the map of the drum', onUse: (gm) => read(gm, 'The map of the drum', ['A section of the drum, drawn the way people here think of it: the rim at the bottom, because out is down, and the open Hollow in the middle.',
    'A red lamp at the very bottom says you are here, on deck 1, at a full g. Candlewick is a yellow dot a little way up. The Hollow is about ninety seconds up by cab.']) });
  // benches, the berth hand's desk, plants, notices
  prop(s, 'bench', X0 + 0.6, 0, 18.5, Math.PI / 2, { w: 2.2, back: true, wood: '#7a5233', metal: PAL.tealDark });
  prop(s, 'bench', X1 - 0.6, 0, 20.0, -Math.PI / 2, { w: 2.0, back: true, wood: '#6b4a2f', metal: PAL.tealDark });
  const lb = [[X0 + 0.6, 18.5, Math.PI / 2, 2.2], [X1 - 0.6, 20.0, -Math.PI / 2, 2.0]];
  for (const bb of lb) s.interact({ x: bb[0] + Math.sin(bb[2]) * 0.25, y: 0.55, z: bb[1], radius: 1.3, wide: true, prompt: 'Sit on the bench', onUse: (gm) => { const z = Math.max(bb[1] - bb[3] / 2 + 0.35, Math.min(bb[1] + bb[3] / 2 - 0.35, gm.player.pos.z)); sitAt(gm, bb[0] + Math.sin(bb[2]) * 0.04, z, bb[2], 'lobby' + bb[0]); } });
  prop(s, 'counter', X0 + 1.4, 0, 23.4, Math.PI / 2, { w: 1.3, d: 0.55, h: 1.05, body: '#2f5d50' }, { noSpots: true });
  prop(s, 'cup', X0 + 1.5, 1.05, 23.1, 0, { glaze: '#c9552e' }); prop(s, 'crock', X0 + 1.3, 1.05, 23.75, 0, { glaze: '#2f6f73', h: 0.18, r: 0.07 });
  s.spot('counter', X0 + 0.65, 0, 23.4, Math.PI / 2, { who: 'arturo', tags: ['crew', 'berths'] });
  s.spot('customer', X0 + 2.2, 0, 23.4, -Math.PI / 2, { tags: ['wait'] });
  prop(s, 'plant', X0 + 0.55, 0, Z0 + 0.6, 0, { kind: 'broad', size: 1.8, pot: '#2f6f73' }); prop(s, 'plant', X1 - 0.55, 0, Z1 - 0.65, 0, { kind: 'fern', size: 1.4, pot: '#c08a2e' }); prop(s, 'plant', X1 - 0.55, 0, Z0 + 0.6, 0, { kind: 'fine', size: 1.6, pot: '#8a2f3c' });
  signK(s, SIGNS['station-lobby.board'], X1 - 0.27, 2.0, 23.3, { face: 'x', w: 1.6, h: 1.1, k: 2 });
  sign(s, SIGNS['station-lobby.lean'], X1 - 0.27, 1.6, 17.3, { face: 'x' });
  sign(s, SIGNS['poster.flight'], X0 + 0.27, 1.8, 14.0, { face: 'X' });
  s.interact({ x: X1 - 0.3, y: 1.6, z: 17.3, radius: 1.4, prompt: 'Read: Why the cab leans', onUse: async (gm) => {
    await read(gm, 'Why the cab leans', ['Going up, the drum pushes you sideways. The cabin swings three-quarters of the way against it. It is meant to.', 'All the way would be about thirteen degrees down here at the Keel, more near the Hollow. Three-quarters makes fewer people sick.']);
    found(gm, 'cab-lean');
  } });
  s.interact({ x: X1 - 0.3, y: 2.0, z: 23.3, radius: 2, prompt: 'Read the berth board', onUse: (gm) => read(gm, 'Cab berths', ['One party a cab. Candlewick, decks 16 to 21. The Hollow, about ninety seconds.', 'Cabs lean. Let them.']) });
  // the stairs nobody uses
  doorFrame(s, X1 - 0.12, 0, 14.9, 1.0, 2.1, 'z');
  door(s, { x: X1 - 0.12, y: 0, z: 14.4, w: 1.0, h: 2.1, along: 'z', tint: '#5b4636', style: 'panel', locked: true, lockedText: 'Stairs: 60 m up to Candlewick', onLocked: (gm) => toast(gm, 'Sixty metres of stairs, at a full g. Almost nobody uses them. The cab is quicker than your legs by a long way.') });
  signK(s, { kind: 'plate', text: 'STAIRS', sub: '60 m to Candlewick · almost never used' }, X1 - 0.26, 2.48, 14.9, { face: 'x', w: 0.9, h: 0.3, k: 2.5 });
  lamp(s, 'sconce', X1 - 0.13, 2.4, 13.6, { face: 'x', clip: LC, K: 2700, power: 0.9 });
  // people
  s.path([[-40, Z0], [-40, 16.5]], { width: 2.2 });
  for (const c of BX) s.path([[-40, 16.5], [c, ZW - 1.2]], { width: 1.2 });
  s.path([[-40, 16.5], [X0 + 2.2, 22.6]], { width: 1.2 }); s.path([[-40, 16.5], [X1 - 1.0, 14.9]], { width: 1.0 });
  s.spot('stand', -41.6, 0, 18.0, 0.3, { tags: ['wait', 'cab'] }); s.spot('stand', -38.4, 0, 22.2, -0.2, { tags: ['wait', 'cab'] });
  s.spot('chat', -38.0, 0, 15.4, -2.2, { tags: ['wait'] }); s.spot('chat', -38.8, 0, 14.6, 0.9, { tags: ['wait'] });
  s.zoneBox({ id: 'station-lobby', place: 'station-lobby', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The Ring 2 lift lobby', sub: 'Station Ring 2 · cab berths', ambience: 'station', reverb: 'hall' });
  let airOn = false;
  W.dynamics.push({ scope: s, update() { if (!airOn && game.audio && game.loopAt) { airOn = true; game.loopAt('air', f, -40, 4.6, 24, { vol: 0.3, radius: 12 }); } } });
  s.finish();
  game.spawns['station-lobby'] = { frame: f, x: -40, y: 0, z: 14.2, yaw: Math.PI };
}
