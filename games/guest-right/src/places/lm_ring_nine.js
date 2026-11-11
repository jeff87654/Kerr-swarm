// Station Ring 9: the late station, the ring nearest the back cap and the heat end. Frame 'ring-nine': deck 1, the
// rim, a full g, under Ring Nine at z = 3540. x runs spinward round the ring, z toward the back cap, y up.
//
// One sentence: a nearly empty platform after midnight, one bright counter with steam, people in work coats eating
// under lids beneath the clock.
//
// An older, lower hall than Ring Two's or Ring Five's: 312 m of it, x[-156, 156] z[-12.6, 12], under a smoked vault
// 11 m high on bottle-green ribs, glazed oxblood tile to the dado and cream above. Glide bays along the front wall;
// along the back wall, from anti to spinward, the lift lobby, the night porter's desk, the back crews' room, the noodle
// counter, the ring counter, the Ledger and the sleeping benches. By day it is merely quiet. After eleven the lamps
// go down to a fifth and the counter is the only bright thing in it; after one the cars stop and the crews come in.
import { floor, wall, lamp, roomGlow, warm } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { Rng, hashStr } from '../core/util.js';
import { signK } from './station_parts.js';
import { PI, say, found, ticker, runX, lineX, vaultSkin, vaultRib, bay, carLoop, liftLobby, seatOnBench, hangingClock, hour } from './lm_ring_parts.js';
import { R9, PAL9, buildRooms } from './lm_ring_nine_rooms.js';

const XE = R9.XE, ZN = R9.ZN, ZS = R9.ZS, ZE = R9.ZE, SP = R9.SPRING, V = R9.V;
const CLIP = [-XE - 0.5, -0.6, ZN - 0.3, XE + 0.5, R9.CROWN + 0.6, ZS + 0.3];
const ENV = { exposure: 1.0, autoKey: 0.15, bloom: 0.07, warmth: 0.09, contrast: 1.1, saturation: 1.08 };

export const place = {
  id: 'lm-ring-nine', name: 'Station Ring 9', order: 10,
  region: 'ring-nine',
  stops: [{ id: 'ring-nine', name: 'Station Ring 9', sub: 'the Keel · deck 1 · Ring Nine', group: 'The stations', spawn: 'ring-nine', deck: 1, zd: 3540 }],
  async build(game) {
    const t0 = performance.now();
    const W = game.world, tick = ticker(game, 'ring-nine');
    const f = W.frame('ring-nine', deckRadius(1), 0, 3540);
    const s = W.scope('ring-nine', f);
    const T = [], mark = (n) => T.push(n + ' ' + (performance.now() - t0).toFixed(0));
    shell(s); mark('shell');
    await tick();
    vault(s); mark('vault');
    await tick();
    bays(s, game, f); mark('bays');
    await tick();
    platform(s, game, f); mark('platform');
    buildRooms(s, game, f); mark('rooms');
    await tick();
    const sp = liftLobby(s, game, f, { x0: -38, x1: -28, z0: ZS, z1: ZS + 11, open: 'n', H: 4.2, stop: 'ring-nine', name: 'The Ring 9 lift lobby', sub: 'Station Ring 9 · cab berths', place: 'ring-nine', lampFlag: true,
      pal: { wall: '#dccfb2', dado: PAL9.blood, floor: '#b9a888', ceil: '#d6c9ad', wood: '#4a3424', accent: PAL9.green, brass: PAL9.brass, yellow: PAL9.yellow, pot: PAL9.blood, stone: '#bfae8c' },
      board: { kind: 'board', title: 'CABS FROM RING NINE', lines: ['One party a cab', 'The back wall: two minutes', 'Candlewick: about four', 'Cabs run all night', 'The cars do not'] },
      posters: [SIGNS['poster.homecoming'], SIGNS['poster.flight']],
      boardTitle: 'Cabs from Ring Nine', boardLines: ['One party a cab, door to door, all night. The cabs never stop; the glide cars stop at one and start again at five.', 'From here the back wall of the Hollow is a short ride up. Candlewick, at Ring Two, is about four minutes.'] });
    signK(s, { kind: 'fascia', text: 'CAB BERTHS', sub: 'all night', palette: [PAL9.greenDark, '#f2ead6', PAL9.yellow] }, -33, 3.75, ZS - 0.32, { face: 'z', w: 4.6, h: 0.52, glow: 1.0, k: 1.8 });
    life(s, game);
    s.zoneBox({ id: 'ring-nine-platform', box: [-XE, -0.5, ZN, XE, R9.CROWN, ZS], name: 'Station Ring 9', sub: 'the late station · deck 1 · the rim · 1 g', ambience: 'station', reverb: 'station', headroom: 10, env: ENV });
    for (const x of [-100, -30, 40, 110]) s.loop('platform', x, 5, ZN + 2, { vol: 0.32, radius: 60 });
    s.loop('murmur', 0, 1.6, 9, { vol: 0.3, radius: 26, param: 0.35 });
    s.loop('hum-lamp', 0, 2.8, 10, { vol: 0.12, radius: 10 });
    let left = s.finish(64);
    while (left) { await tick(); left = s.finish(64); }
    game.spawns['ring-nine'] = { frame: f, x: sp.x, y: 0, z: sp.z, yaw: sp.yaw };
    console.log('[lm-ring-nine] built in ' + (performance.now() - t0).toFixed(0) + ' ms: ' + T.join(', '));
  },
};

// ---------------------------------------------------------------------------------------------------------------
// the shell
// ---------------------------------------------------------------------------------------------------------------
function shell(s) {
  const g = s.g, P = PAL9;
  // the bay zone along the front wall (cut round the pits), the edge strip, the old hexagon tile of the platform
  let xa = -XE;
  for (const cx of R9.loops) { floor(s, xa, ZN, cx - 5, -ZE, 0, 'deckplate', '#66645e'); floor(s, cx - 5, -ZE - 0.5, cx + 5, -ZE, 0, 'deckplate', '#5a5852'); xa = cx + 5; }
  floor(s, xa, ZN, XE, -ZE, 0, 'deckplate', '#66645e');
  floor(s, -XE, -ZE, XE, -3.0, 0, 'deckplate', '#74716a');
  floor(s, -XE, -3.0, XE, ZS, 0, 'hex', '#b3a283', { matOpts: { rough: 0.5 } });
  runX(-XE, XE, 16, (x0, x1) => s.deco(() => {
    g.mat('paint', P.yellow); g.box(x0, 0, -ZE, x1, 0.006, -ZE + 0.12, { faces: 'Y' });
    g.mat('deckplate', '#b8913a'); g.box(x0, 0, -ZE + 0.3, x1, 0.009, -ZE + 0.8, { faces: 'Y' });
    g.mat('tile', P.blood); g.box(x0, 0, -3.05, x1, 0.004, -2.75, { faces: 'Y' }); g.box(x0, 0, ZS - 0.9, x1, 0.004, ZS - 0.6, { faces: 'Y' });
    // worn paths in the hex: darker where the feet go, toward the counter and the lobby
    g.mat('hex', '#9c8b6d'); g.box(x0, 0, 1.0, x1, 0.002, 4.0, { faces: 'Y' });
  }));
  // the long walls: oxblood glazed tile to the dado, cream tile above, a green band and a cornice
  const WALL = { t: 0.3, mat: 'tile', tint: P.cream, dado: { h: 2.2, mat: 'tile', tint: P.blood }, skirt: '#1c1a17' };
  runX(-XE, XE, 16, (a, b) => wall(s, a, ZN + 0.15, b, ZN + 0.15, 0, SP, WALL));
  runX(-XE, -38, 16, (a, b) => wall(s, a, ZS - 0.15, b, ZS - 0.15, 0, SP, WALL));
  runX(44, XE, 16, (a, b) => wall(s, a, ZS - 0.15, b, ZS - 0.15, 0, SP, WALL));
  wall(s, -38, ZS - 0.15, 44, ZS - 0.15, 0, SP, Object.assign({}, WALL, { openings: [
    { at: 1.4, w: 7.2, h: 3.2 }, { at: 12.4, w: 4.2, h: 2.6 }, { at: 19.6, w: 2.6, h: 1.2, sill: 1.0 }, { at: 23.0, w: 1.2, h: 2.3 },
    { at: 32.6, w: 10.8, h: 2.9 }, { at: 46.7, w: 3.8, h: 1.1, sill: 0.86 }, { at: 54.6, w: 12.8, h: 4.2 }, { at: 70.6, w: 11.0, h: 3.2 }] }));
  runX(-XE, XE, 16, (x0, x1) => s.structure(() => {
    g.mat('tile', P.green); g.box(x0, 2.2, ZN + 0.3, x1, 2.42, ZN + 0.36, { faces: 'yYZ' }); g.box(x0, 2.2, ZS - 0.36, x1, 2.42, ZS - 0.3, { faces: 'yYz' });
    g.mat('panel', P.greenDark); g.box(x0, SP - 0.2, ZN + 0.3, x1, SP + 0.25, ZN + 0.62, { faces: 'yYZ' }); g.box(x0, SP - 0.2, ZS - 0.62, x1, SP + 0.25, ZS - 0.3, { faces: 'yYz' });
    g.mat('cast', P.brass); g.box(x0, SP - 0.25, ZN + 0.6, x1, SP - 0.19, ZN + 0.66, { faces: 'yZ' }); g.box(x0, SP - 0.25, ZS - 0.66, x1, SP - 0.19, ZS - 0.6, { faces: 'yz' });
  }));
  // the heat end's pipes along the front wall, bigger than anywhere else: the loop's return and the coolant mains
  const PIPES = [{ y: 5.5, r: 0.36, c: '#c9a43a', label: { kind: 'label', text: 'AMMONIA', sub: 'to the back axle · keep shut' } }, { y: 4.65, r: 0.26, c: '#a8432e', label: { kind: 'label', text: '65 °C LOOP', sub: 'return · to the Keel' } }, { y: 3.95, r: 0.2, c: '#2f6f8f', label: { kind: 'label', text: 'MOAT WATER', sub: 'do not tap' } }];
  runX(-XE, XE, 16, (x0, x1) => s.structure(() => {
    for (const p of PIPES) {
      const zp = ZN + 0.32 + p.r + 0.14;
      g.mat('cast', p.c, { rough: 0.05 }); g.tube(lineX(x0, x1, p.y, zp, 4), p.r, { segs: 14, caps: false });
      g.mat('cast', '#3a3f41'); g.tube([[x0 + 0.02, p.y, zp], [x0 + 0.16, p.y, zp]], p.r + 0.05, { segs: 14 });
      for (let x = x0 + 2; x < x1; x += 4) g.box(x - 0.05, p.y - p.r - 0.06, ZN + 0.3, x + 0.05, p.y - p.r, zp + 0.05);
    }
  }));
  for (let x = -144; x <= 144; x += 48) for (const p of PIPES) { const zp = ZN + 0.32 + p.r + 0.14; signK(s, p.label, x + 1.5, p.y, zp + p.r + 0.01, { face: 'Z', w: 1.1, h: 0.3, k: 1.6 }); }
  // the ends: a wall and the lunette, a shutter and the way on round
  const zs = V.zs(16);
  for (const sx of [-1, 1]) {
    const x = sx * (XE - 0.15);
    wall(s, x, ZN, x, ZS, 0, SP, WALL);
    s.structure(() => {
      g.mat('tile', P.cream);
      for (let i = 0; i < zs.length - 1; i++) { const za = zs[i], zb = zs[i + 1], ya = V.y(za), yb = V.y(zb), xx = x - sx * 0.15; if (sx > 0) g.quad([xx, SP, za], [xx, SP, zb], [xx, yb, zb], [xx, ya, za]); else g.quad([xx, SP, zb], [xx, SP, za], [xx, ya, za], [xx, yb, zb]); }
      const xs = x - sx * 0.2;
      g.mat('flute', '#5d6a5e'); g.box(Math.min(xs, xs - sx * 0.12), 0, -5, Math.max(xs, xs - sx * 0.12), 4.6, 9);
      g.mat('panel', P.greenDark); g.box(Math.min(xs, xs - sx * 0.6), 4.6, -5.3, Math.max(xs, xs - sx * 0.6), 5.3, 9.3, { bevel: 0.04 });
    });
    signK(s, { kind: 'board', title: 'ON ROUND THE RING', lines: ['On round the ring', 'by rim train or by cab.', 'The cars stop at one.', 'The cabs do not.'] }, x - sx * 0.3, 2.6, 2, { face: sx > 0 ? 'x' : 'X', w: 2.4, h: 1.6, glow: 0.6, k: 3 });
    s.solid(sx > 0 ? XE - 0.6 : -XE - 0.5, 0, ZN, sx > 0 ? XE + 0.5 : -XE + 0.6, 12, ZS);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the vault: smoked cream panels between bottle-green purlins, a rib between every pair of bays and over each
// ---------------------------------------------------------------------------------------------------------------
function vault(s) {
  const P = PAL9, g = s.g;
  vaultSkin(s, V, -XE, XE, { mat: 'panel', skin: P.vault, purlin: P.greenDark, purlins: [-8, -1, 6], nz: 14 });
  const southOpen = (x) => x > -38 && x < 44;
  for (let x = -XE + 12; x < XE - 1; x += 12) {
    const overBay = R9.bays.indexOf(x) >= 0;
    vaultRib(s, V, x, { main: P.green, dark: P.greenDark, brass: P.brass, big: x === 0, y0N: overBay ? 5.0 : 0, y0S: southOpen(x) ? 4.6 : 0 });
  }
  // a cable tray, and the work lights every 24 m (they go down to a fifth at lamp-night like everything else)
  runX(-XE, XE, 16, (x0, x1) => s.structure(() => {
    const yt = V.y(-6) - 0.8; g.mat('grille', '#6d706a'); g.box(x0, yt, -6.5, x1, yt + 0.02, -5.5, { faces: 'yY' });
    g.mat('weave', '#2a2d2e'); for (let k = 0; k < 3; k++) g.tube(lineX(x0, x1, yt + 0.06, -6.3 + k * 0.25, 8), 0.04, { segs: 5, caps: false });
  }));
  for (let x = -144; x <= 144; x += 24) {
    const y = V.y(-1) - 2.6;
    s.deco(() => {
      g.mat('cast', '#2a2d2e'); g.tube([[x, V.y(-1) - 0.2, -1], [x, y + 0.36, -1]], 0.018, { segs: 5 });
      g.mat('cast', P.greenDark); g.lathe(x, -1, [[0.08, y + 0.4], [0.12, y + 0.34], [0.28, y + 0.16], [0.46, y], [0.44, y - 0.02]], { segs: 16, capBottom: false });
      g.mat('diffuser', '#fff1d8', { emissive: 5, lamp: true }); g.cyl(x, y + 0.02, -1, 0.36, 0.01, { segs: 14 });
    });
    s.light({ at: [x, y - 0.1, -1], color: warm(3600), power: 20, range: 14, type: 'spot', dir: [0, -1, 0], cone: [66, 30], clip: CLIP, shadow: Math.abs(x) < 50, lamp: true, radius: 0.35 });
  }
  roomGlow(s, -XE, 0, ZN, XE, R9.CROWN, ZS, { sky: '#d8c4a0', ground: '#6a5e4c', power: 0.1 });
}

// ---------------------------------------------------------------------------------------------------------------
// the glide bays along the front wall: two with cars coming and going (till one), the rest shut
// ---------------------------------------------------------------------------------------------------------------
function bays(s, game, f) {
  const P = { main: PAL9.green, dark: PAL9.greenDark, brass: PAL9.brass, yellow: PAL9.yellow };
  const sched = (gm) => { const h = hour(gm); return h >= 1 && h < 5 ? 'freight' : 'cars'; };
  R9.bays.forEach((cx, i) => {
    const L = R9.loops.indexOf(cx) >= 0, n = i + 1;
    const o = { cx, zE: -ZE, sg: -1, n, dest: L ? 'TO SORREL · LAST CAR 01:00' : ['freight', 'freight', 'TO SORREL', 'freight', 'TO SORREL', 'TO SORREL', 'CLEANERS', 'TO SORREL', 'freight', 'TO SORREL', 'freight', 'freight'][i], kind: L ? 'loop' : 'shut', pal: P, clip: CLIP, wall: 6.75,
      body: ['#8f3f2a', '#6b3a2a', '#a9572e'][i % 3], number: 'CAR ' + (9000 + i * 37) };
    const info = bay(s, game, f, o);
    if (L) { o.gateCol = info.gateCol; o.sched = sched; o.standT = 24; carLoop(s, game, f, o, info); }
  });
  // the cleaners' bay: a trolley, a mop bucket, cones
  prop(s, 'platform.trolley', 13.4, 0, -9.0, PI / 2, { n: 4 }); prop(s, 'platform.cone', 9.0, 0, -6.4, 0, {}); prop(s, 'platform.cone', 16.4, 0, -6.4, 0, {});
}

// ---------------------------------------------------------------------------------------------------------------
// the platform: lamp standards and benches down its middle, the clock, the last-car board, shut kiosks along the walls
// ---------------------------------------------------------------------------------------------------------------
function platform(s, game, f) {
  const g = s.g, P = PAL9, ZI = 2.6;
  for (let x = -144; x <= 144; x += 24) {
    if (Math.abs(x) < 2) continue;
    planter(s, x, 0, ZI, { w: 1.8, d: 0.9, h: 0.46, mat: 'tile', tint: P.blood, plants: ['fern', 'broad', 'fine'][((x / 24) % 3 + 3) % 3], seed: x });
    prop(s, 'platform.standard', x, 0.46, ZI, 0, { h: 4.4, metal: P.green });
    s.light({ at: [x, 4.25, ZI], color: warm(2700), power: 6.5, range: 12, clip: CLIP, shadow: Math.abs(x) < 60, lamp: true, radius: 0.3 });
    for (const dx of [-8, 8]) { const xb = x + dx; if (Math.abs(xb) < 9) continue; prop(s, 'bench', xb, 0, ZI - 0.45, PI, { w: 2.2, back: true, wood: '#6b4a2f', metal: P.greenDark }, { noSpots: true }); seatOnBench(s, xb, ZI - 0.45, PI, 2.2, 'b9' + xb + 'n'); prop(s, 'bench', xb, 0, ZI + 0.45, 0, { w: 2.2, back: true, wood: '#5b3e28', metal: P.greenDark }, { noSpots: dx > 0 }); seatOnBench(s, xb, ZI + 0.45, 0, 2.2, 'b9' + xb + 's'); }
  }
  // the clock, hung over the platform in front of the noodle counter, its faces looking along the ring
  hangingClock(s, game, -1, 5.0, 4.6, { r: 0.95, hangTo: V.y(4.6) - 0.1, case: P.greenDark, brass: P.brass, face: '#f4e8cc', glow: 1.6, lampFace: false, plate: { text: 'RING NINE', sub: 'a minute fast' } });
  s.light({ at: [-1, 3.6, 4.6], color: warm(3000), power: 2.2, range: 5, clip: CLIP, radius: 0.5 });
  s.interact({ x: -1, y: 5.0, z: 4.6, radius: 8, prompt: 'Read the clock', onUse: async (gm) => {
    const h = hour(gm), t = gm.clock ? gm.clock.label() : '00:00';
    await say(gm, 'The clock', [
      'The clock over the platform says ' + t + ', and like every station clock in Chervil it is a minute fast, so that nobody misses a car by one.',
      h >= 1 && h < 5 ? 'The last car went at one. The first is at five; between, only freight. A car let go from the quay outside falls 140 seconds to Sorrel\'s rim, but not tonight.'
        : h >= 23 || h < 1 ? 'The last car to Sorrel is at one. After that the cabs still run, the noodle counter stays open, and the platform belongs to the back crews.'
          : 'Cars to Sorrel every few minutes till one in the morning, from five. Let go from the quay at 174.4 metres a second, 140 seconds across.',
    ]);
    found(gm, 'glide');
  } });
  // the last-car board on the front wall, between the bays either side of the clock
  const BX = 0, BZ = ZN + 0.33;
  s.structure(() => {
    g.mat('panel', P.greenDark); g.box(BX - 2.2, 2.4, ZN + 0.3, BX + 2.2, 4.4, ZN + 0.5, { bevel: 0.03 });
    g.mat('cast', P.brass, { rough: -0.2 }); g.box(BX - 2.25, 4.38, ZN + 0.3, BX + 2.25, 4.46, ZN + 0.58); g.box(BX - 2.25, 2.34, ZN + 0.3, BX + 2.25, 2.42, ZN + 0.58);
  });
  signK(s, { kind: 'board', title: 'RING NINE · TO SORREL', lines: ['Last car  01:00', 'First car  05:00', 'Freight only between', '140 seconds across', 'Door to door, about 8½ minutes'] }, BX, 3.4, ZN + 0.51, { face: 'Z', w: 4.0, h: 1.8, glow: 1.0, lamp: false, board: false, k: 2.2 });
  lamp(s, 'bulb', BX, 4.2, ZN + 1.4, { clip: CLIP, K: 3200, power: 0.7, range: 5, lampFlag: false });
  for (const x of [-4, 4]) { prop(s, 'bench', x, 0, ZN + 1.1, 0, { w: 2.2, back: true, wood: '#5b3e28', metal: P.greenDark }); seatOnBench(s, x, ZN + 1.1, 0, 2.2, 'b9w' + x); }
  s.interact({ x: BX, y: 3.0, z: ZN + 1.6, radius: 4, prompt: 'Read the last-car board', onUse: (gm) => say(gm, 'Ring Nine', ['To Sorrel. Last car at one, first car at five, freight only between.', 'A car is let go from the quay outside at 174.4 metres a second and falls for 140 seconds across 24.5 kilometres to Sorrel\'s rim. Door to door, from a flat in Chervil to one in Sorrel, about eight and a half minutes.', 'Somebody has chalked under it: and from here to Candlewick, four minutes by cab, any hour you like.']) });
  // shut kiosks along the back wall beyond the rooms, shutters down, painted names; posters; benches
  const KIOSKS = [[-60, 'FLOWERS AND HERBS', '#6b8f4e'], [-84, 'MENDING WHILE YOU WAIT', '#3b4a7a'], [60, 'PAPER, PENS, CARDS HOME', '#a8432e'], [84, 'SOCKS AND GLOVES', '#8a5a24'], [-108, 'TEA', '#2f6f73'], [108, 'SPELT LOAVES THURSDAYS', '#c08a2e']];
  for (const [kx, name, c] of KIOSKS) {
    s.furniture(() => {
      g.mat('panel', c); g.box(kx - 2.6, 0, ZS - 1.6, kx + 2.6, 2.9, ZS - 0.3, { bevel: 0.03 });
      g.mat('flute', '#6d7268'); g.box(kx - 2.3, 0.1, ZS - 1.62, kx + 2.3, 2.3, ZS - 1.58, { faces: 'z' });
      g.mat('paint', P.yellow); g.box(kx - 2.3, 0.1, ZS - 1.63, kx + 2.3, 0.22, ZS - 1.62, { faces: 'z' });
    });
    s.solid(kx - 2.6, 0, ZS - 1.6, kx + 2.6, 2.9, ZS - 0.3);
    signK(s, { kind: 'fascia', text: name, sub: 'open at six', palette: [c, '#f6ead0', P.yellow] }, kx, 2.6, ZS - 1.62, { face: 'z', w: 4.6, h: 0.42, k: 2 });
  }
  const posters = [['poster.flight', -48.5], ['poster.feast', -72.4], ['poster.booking', 72.6], ['poster.homecoming', 96.4], ['poster.quiet', -96.2], ['poster.dawn', 48.4]];
  for (const p of posters) if (SIGNS[p[0]]) sign(s, SIGNS[p[0]], p[1], 1.75, ZS - 0.32, { face: 'z' });
  for (const x of [-120, -66, 66, 120]) { prop(s, 'bench', x, 0, ZS - 0.85, PI, { w: 2.2, back: true, wood: '#5b3e28', metal: P.greenDark }); seatOnBench(s, x, ZS - 0.85, PI, 2.2, 'b9s' + x); }
  for (const x of [-72, -48, 48, 72, 96, -96]) lamp(s, 'sconce', x + 6, 3.2, ZS - 0.32, { face: 'z', clip: CLIP, K: 2700, power: 0.9 });
  for (const x of [-132, -84, -36, 36, 84, 132]) { prop(s, 'platform.droppipe', x + 9, 0, ZN + 0.3, 0, { c: '#a8432e', h: 4.4 }); }
  prop(s, 'platform.fountain', -40, 0, ZS - 0.7, 0, {}); prop(s, 'platform.bin', 46, 0, ZS - 0.6, 0, { c: P.green }); prop(s, 'platform.bin', -7.8, 0, 10.7, 0, { c: P.green });
  void f;
}

// ---------------------------------------------------------------------------------------------------------------
// people: few by day, the counter and the crew room full after midnight
// ---------------------------------------------------------------------------------------------------------------
function life(s, game) {
  const xs = []; for (let x = -148; x <= 148; x += 8) xs.push(x);
  // one long walkway, not two, and queue paths only at the two bays where cars come: by day Ring Nine is quiet
  s.path(xs.map((x) => [x, 8.6]), { width: 2.2 });
  for (const cx of R9.loops) s.path([[cx, 8.6], [cx, -ZE + 1.0]], { width: 1.4, tags: ['queue'] });
  s.path([[-33, 8.6], [-33, ZS + 1.0]], { width: 2.0 }); s.path([[-23.5, 8.6], [-23.5, ZS - 1.0]], { width: 1.2 }); s.path([[10.6, 8.6], [10.6, ZS - 2.6]], { width: 1.2 });
  // a few people waiting by day; sweepers at night
  for (const cx of R9.loops) for (let k = 0; k < 3; k++) s.spot('queue', cx + (k % 2) * 0.2, 0, -ZE + 0.9 + k * 0.7, PI, { tags: ['wait', 'queue'] });
  for (const cx of R9.loops) s.spot('work', cx + 5.2, 0, -ZE + 1.1, PI + 0.4, { tags: ['porter', 'crew'] });
  for (const q of [[-50, 0.2, 0.4], [30, -1.2, 2.8], [-90, 1.0, -0.4], [70, 0.4, 2.2], [120, -1.0, 0.2]]) s.spot('stand', q[0], 0, q[1], q[2], { tags: ['wait'] });
  s.spot('work', -20, 0, 4, 0.4, { tags: ['sweep'] }); s.spot('work', 26, 0, 6, 2.0, { tags: ['sweep'] }); s.spot('work', -70, 0, 5, 1.2, { tags: ['sweep'] });
  // after half past ten the back crews come in: to the counter's stools, the crew room's table and the porter's glass
  // (the zones that carry the place 'ring-nine'). They come once a night and stay while the ring is loaded.
  const crowd = { ids: null, t: 1 };
  s.every((dt, gm) => {
    crowd.t -= dt; if (crowd.t > 0 || crowd.ids) return; crowd.t = 1.5;
    const h = hour(gm), P = gm.people; if (!(h >= 22.5 || h < 5) || !P || !P.spawnCrowd) return;
    const ids = P.spawnCrowd(s.frame, 'ring-nine', 13); if (ids && ids.length) crowd.ids = ids;
  });
  s.onDispose(() => { const P = game.people; if (crowd.ids && P && P.byId) for (const id of crowd.ids) { const hd = P.byId(id); if (hd && hd.hide) hd.hide(); } });
  void Rng; void hashStr;
}
