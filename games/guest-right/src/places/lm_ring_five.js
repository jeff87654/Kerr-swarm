// Station Ring 5: the middle of the drum, the busiest station in Chervil. Frame 'ring-five': deck 1, the rim, a full g,
// under Ring Five at z = 1875. x runs spinward round the ring, z toward the back cap, y up.
//
// One sentence: the crossing, where the long-distance cars are made up under a great board of every drum on Herb Row
// and beyond, and the rim trains run underneath.
//
// The hall: 432 m of it, x[-216, 216] z[-22, 22], under an indigo-ribbed vault 18 m high (the station is four decks
// deep), curving up out of sight both ways. Glide bays along both long walls, outbound on the front side (low z),
// inbound on the back side. In its middle, x[-48, 48], the concourse: the departures board hung from the vault over
// the long bay where three through cars stand coupled, a well in the floor down to the tube level, and on the back
// side the lift lobby, the Ledger, left luggage, the tin shelf for travellers' food and the scale.
// Palette: indigo iron, warm sandstone, terracotta, ochre, brass, and the board's amber.
import { floor, wall, lamp, roomGlow, warm } from '../world/kit.js';
import { railing, planter } from '../world/kit2.js';
import { prop, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { Rng, hashStr } from '../core/util.js';
import { signK, drawCar, carSolids } from './station_parts.js';
import { painted, CAPS, SERIF } from './ledger_parts.js';
import { PI, say, toast, found, ticker, runX, lineX, makeVault, vaultSkin, vaultRib, bay, carLoop, liftLobby, seatOnBench, magnets } from './lm_ring_parts.js';
import { R5, PAL5, buildRooms, buildTube, buildBoard } from './lm_ring_five_rooms.js';

const XE = R5.XE, XM = R5.XM, ZN = R5.ZN, ZS = R5.ZS, ZE = R5.ZE;
const CLIP = [-XE - 0.5, -0.6, ZN - 0.3, XE + 0.5, 18.6, ZS + 0.3];
const ENV = { exposure: 1.0, autoKey: 0.2, bloom: 0.06, warmth: 0.05, contrast: 1.06, saturation: 1.08 };

export const place = {
  id: 'lm-ring-five', name: 'Station Ring 5', order: 10,
  region: 'ring-five',
  stops: [{ id: 'ring-five', name: 'Station Ring 5', sub: 'the Keel · deck 1 · Ring Five', group: 'The stations', spawn: 'ring-five', deck: 1, zd: 1875 }],
  async build(game) {
    const t0 = performance.now();
    const W = game.world, tick = ticker(game, 'ring-five');
    const f = W.frame('ring-five', deckRadius(1), 0, 1875);
    const s = W.scope('ring-five', f);
    const T = [], mark = (n) => T.push(n + ' ' + (performance.now() - t0).toFixed(0));
    shell(s); mark('shell');
    await tick();
    vault(s); mark('vault');
    await tick();
    bays(s, game, f); mark('bays');
    await tick();
    island(s, game); mark('island');
    longBay(s, game); mark('longbay');
    concourse(s, game, f); mark('concourse');
    await tick();
    buildBoard(s, game, f); mark('board');
    buildRooms(s, game, f, CLIP); mark('rooms');
    await tick();
    buildTube(s, game, f); mark('tube');
    await tick();
    const sp = liftLobby(s, game, f, { x0: -6, x1: 6, z0: ZS, z1: ZS + 11, open: 'n', H: 4.6, stop: 'ring-five', name: 'The Ring 5 lift lobby', sub: 'Station Ring 5 · cab berths', place: 'ring-five',
      pal: { wall: '#e3d2ae', dado: PAL5.terra, floor: '#cdb995', ceil: '#ead9b8', wood: '#5b4030', accent: PAL5.indigo, brass: PAL5.brass, yellow: PAL5.yellow, pot: PAL5.terra },
      board: { kind: 'board', title: 'CABS FROM RING FIVE', lines: ['One party a cab', 'Anywhere in Chervil in twelve minutes', 'The Hollow: about two and a half', 'Mid-drum: about two', 'Cabs lean. Let them.'] },
      posters: [SIGNS['poster.flight'], SIGNS['poster.booking'], SIGNS['poster.feast'], SIGNS['poster.homecoming']],
      boardTitle: 'Cabs from Ring Five', boardLines: ['One party a cab, door to door, with no changes. Anywhere in Chervil in about twelve minutes, most places in six.', 'From the rim to the Hollow is about two and a half minutes. The cabin leans against the push as you climb. Let it.'] });
    signK(s, { kind: 'fascia', text: 'CAB BERTHS', sub: 'up into the drum · anywhere in twelve minutes', palette: [PAL5.indigoDark, '#f3e6c8', PAL5.ochre] }, 0, 4.1, ZS - 0.32, { face: 'z', w: 6.2, h: 0.62, glow: 1.2, k: 1.8 });
    life(s, game);
    s.zoneBox({ id: 'ring-five-concourse', place: 'ring-five', box: [-XM, -0.5, ZN, XM, 18, ZS], name: 'Station Ring 5', sub: 'the concourse · deck 1 · the rim · 1 g', ambience: 'station', reverb: 'station', headroom: 16, env: ENV });
    for (const sx of [-1, 1]) s.zoneBox({ id: 'ring-five-hall-' + (sx > 0 ? 'e' : 'w'), place: 'ring-five', box: [sx > 0 ? XM : -XE, -0.5, ZN, sx > 0 ? XE : -XM, 18, ZS], name: 'Station Ring 5', sub: (sx > 0 ? 'the spinward platforms' : 'the anti platforms') + ' · deck 1 · 1 g', ambience: 'station', reverb: 'station', headroom: 16, env: ENV });
    for (const x of [-150, -60, 0, 60, 150]) s.loop('platform', x, 6, ZN + 2, { vol: 0.45, radius: 70 });
    s.loop('murmur', 0, 1.6, -4, { vol: 0.55, radius: 60, param: 0.8 });
    s.loop('murmur', -100, 1.6, 0, { vol: 0.3, radius: 50, param: 0.4 }); s.loop('murmur', 100, 1.6, 0, { vol: 0.3, radius: 50, param: 0.4 });
    let left = s.finish(64);
    while (left) { await tick(); left = s.finish(64); }
    game.spawns['ring-five'] = { frame: f, x: sp.x, y: 0, z: sp.z, yaw: sp.yaw };
    console.log('[lm-ring-five] built in ' + (performance.now() - t0).toFixed(0) + ' ms: ' + T.join(', '));
  },
};

// ---------------------------------------------------------------------------------------------------------------
// the shell: floors with their holes, the long walls, the ends
// ---------------------------------------------------------------------------------------------------------------
function shell(s) {
  const g = s.g, P = PAL5;
  // the platform floor outside the concourse, and the bay zones (pits are cut out where cars come and go)
  for (const sx of [-1, 1]) {
    const a = sx > 0 ? XM : -XE, b = sx > 0 ? XE : -XM;
    floor(s, a, -ZE, b, -9.6, 0, 'deckplate', '#77746c'); floor(s, a, 9.6, b, ZE, 0, 'deckplate', '#77746c');
    floor(s, a, -9.6, b, -1.6, 0, 'concrete', P.conc); floor(s, a, -1.6, b, 1.6, 0, 'terrazzo', '#c2ad86'); floor(s, a, 1.6, b, 9.6, 0, 'concrete', P.conc);
    for (const sg of [-1, 1]) {
      const zA = sg < 0 ? ZN : ZE, zB = sg < 0 ? -ZE : ZS;
      let xa = a;
      for (const cx of R5.pits.filter((q) => q.sg === sg && Math.sign(q.cx) === sx).map((q) => q.cx).sort((p, q) => p - q)) {
        floor(s, xa, zA, cx - 5, zB, 0, 'deckplate', '#6c6a64');
        floor(s, cx - 5, sg < 0 ? -ZE - 0.5 : ZE, cx + 5, sg < 0 ? -ZE : ZE + 0.5, 0, 'deckplate', '#5f5d58');
        xa = cx + 5;
      }
      floor(s, xa, zA, b, zB, 0, 'deckplate', '#6c6a64');
    }
  }
  // the concourse: terrazzo, cut round the well and the two stairs down to the tube level
  const T = '#cdb58c', RO = { matOpts: { rough: 0.25 } };
  floor(s, -XM, -ZE, XM, -4, 0, 'terrazzo', T, RO);
  floor(s, -XM, -4, -27.6, ZS, 0, 'terrazzo', T); floor(s, 27.6, -4, XM, ZS, 0, 'terrazzo', T);
  floor(s, -27.6, -4, -12, 0.5, 0, 'terrazzo', T); floor(s, 12, -4, 27.6, 0.5, 0, 'terrazzo', T);
  floor(s, -14, 0.5, -12, 3.5, 0, 'terrazzo', T); floor(s, 12, 0.5, 14, 3.5, 0, 'terrazzo', T);
  floor(s, -27.6, 3.5, -12, 4, 0, 'terrazzo', T); floor(s, 12, 3.5, 27.6, 4, 0, 'terrazzo', T);
  floor(s, -27.6, 4, 27.6, ZS, 0, 'terrazzo', T);
  // the alcoves either side of the long bay, and the long bay's pit
  floor(s, -XM, ZN, -16, -ZE, 0, 'terrazzo', '#bfa77f'); floor(s, 16, ZN, XM, -ZE, 0, 'terrazzo', '#bfa77f');
  floor(s, -16, ZN, 16, -ZE - 0.5, -2.2, 'concrete', '#3a3936'); floor(s, -16, -ZE - 0.5, 16, -ZE, 0, 'deckplate', '#5f5d58');
  // painted lines and inlays: the yellow edge lines along both platform edges, terracotta bands across the concourse
  runX(-XE, XE, 16, (x0, x1) => s.deco(() => {
    for (const sg of [-1, 1]) {
      if (sg > 0 && x1 > -XM + 0.1 && x0 < XM - 0.1) continue;
      const ze = sg * ZE;
      g.mat('paint', P.yellow); g.box(x0, 0, Math.min(ze, ze - sg * 0.12), x1, 0.006, Math.max(ze, ze - sg * 0.12), { faces: 'Y' });
      g.mat('deckplate', '#c99f35'); g.box(x0, 0, Math.min(ze - sg * 0.3, ze - sg * 0.8), x1, 0.009, Math.max(ze - sg * 0.3, ze - sg * 0.8), { faces: 'Y' });
    }
    if (x1 <= -XM + 0.1 || x0 >= XM - 0.1) {
      g.mat('cast', P.brass, { rough: -0.2 }); for (const z of [-1.6, 1.6]) g.box(x0, 0, z - 0.03, x1, 0.005, z + 0.03, { faces: 'Y' });
      g.mat('concrete', '#5e5950'); for (let k = 0; k < 4; k++) { const xj = x0 + k * 4; g.box(xj - 0.015, 0, -9.55, xj + 0.015, 0.003, -1.65, { faces: 'Y' }); g.box(xj - 0.015, 0, 1.65, xj + 0.015, 0.003, 9.55, { faces: 'Y' }); }
    }
  }));
  s.deco(() => {
    // across the concourse: terracotta and indigo bands in the terrazzo, a brass line every 12 m
    for (let x = -48; x <= 48; x += 12) { g.mat('cast', P.brass, { rough: -0.2 }); g.box(x - 0.03, 0, -ZE, x + 0.03, 0.005, x > -28 && x < 28 ? -4.2 : ZS, { faces: 'Y' }); }
    g.mat('terrazzo', P.terra); g.box(-XM, 0, -12.6, XM, 0.004, -11.8, { faces: 'Y' }); g.box(-27.6, 0, 6.2, 27.6, 0.004, 7.0, { faces: 'Y' });
    g.mat('terrazzo', P.indigo); g.box(-XM, 0, -11.8, XM, 0.004, -11.5, { faces: 'Y' }); g.box(-27.6, 0, 7.0, 27.6, 0.004, 7.3, { faces: 'Y' });
    // two round inlays: the drum's nine rings as nine brass dots on a line, front to back
    for (const cx of [-36, 36]) {
      g.mat('terrazzo', P.indigo); g.lathe(cx, 9, [[3.2, 0.004], [2.9, 0.004]], { segs: 40, capBottom: false, capTop: false });
      g.mat('terrazzo', '#e7d6b2'); g.lathe(cx, 9, [[2.9, 0.003], [0, 0.003]], { segs: 40, capBottom: false, capTop: false });
      g.mat('cast', P.brass, { rough: -0.25 }); g.box(cx - 0.02, 0, 6.3, cx + 0.02, 0.006, 11.7, { faces: 'Y' });
      for (let i = 0; i < 9; i++) { const z = 6.5 + i * 0.625; g.cyl(cx, 0, z, i === 4 ? 0.16 : 0.09, 0.007, { segs: 12 }); }
    }
  });
  // the long walls: indigo riveted dado, sandstone panels, a cornice where the vault springs
  const WALL = { t: 0.3, mat: 'panel', tint: P.stone, dado: { h: 3.4, mat: 'panel', tint: P.indigo }, skirt: '#1a1d2a' };
  runX(-XE, XE, 16, (a, b) => wall(s, a, ZN + 0.15, b, ZN + 0.15, 0, R5.SPRING, WALL));
  for (const sx of [-1, 1]) runX(sx > 0 ? XM : -XE, sx > 0 ? XE : -XM, 16, (a, b) => wall(s, a, ZS - 0.15, b, ZS - 0.15, 0, R5.SPRING, WALL));
  // the back wall of the concourse, with its openings: left luggage, the Ledger, the lobby, the tin shelf
  wall(s, -XM, ZS - 0.15, XM, ZS - 0.15, 0, R5.SPRING, Object.assign({}, WALL, { openings: [{ at: 4, w: 12, h: 3.6 }, { at: 23, w: 14, h: 4.4 }, { at: 44.4, w: 7.2, h: 3.4 }, { at: 59, w: 14, h: 3.6 }] }));
  runX(-XE, XE, 16, (x0, x1) => s.structure(() => {
    g.mat('panel', P.indigoDark); g.box(x0, R5.SPRING - 0.25, ZN + 0.3, x1, R5.SPRING + 0.3, ZN + 0.66, { faces: 'yYZ' }); g.box(x0, R5.SPRING - 0.25, ZS - 0.66, x1, R5.SPRING + 0.3, ZS - 0.3, { faces: 'yYz' });
    g.mat('cast', P.brass); g.box(x0, R5.SPRING - 0.3, ZN + 0.64, x1, R5.SPRING - 0.24, ZN + 0.7, { faces: 'yZ' }); g.box(x0, R5.SPRING - 0.3, ZS - 0.7, x1, R5.SPRING - 0.24, ZS - 0.64, { faces: 'yz' });
    // a terracotta band at the dado's top
    g.mat('panel', P.terra); g.box(x0, 3.4, ZN + 0.3, x1, 3.7, ZN + 0.36, { faces: 'yYZ' });
    if (x1 <= -XM + 0.1 || x0 >= XM - 0.1) g.box(x0, 3.4, ZS - 0.36, x1, 3.7, ZS - 0.3, { faces: 'yYz' });
  }));
  // the ends: a wall, the vault's lunette, a shutter, and the way on round by rim train
  const V = R5.V, zs = V.zs(16);
  for (const sx of [-1, 1]) {
    const x = sx * (XE - 0.15);
    wall(s, x, ZN, x, ZS, 0, R5.SPRING, WALL);
    s.structure(() => {
      g.mat('panel', P.vault);
      for (let i = 0; i < zs.length - 1; i++) { const za = zs[i], zb = zs[i + 1], ya = V.y(za), yb = V.y(zb), xx = x - sx * 0.15; if (sx > 0) g.quad([xx, R5.SPRING, za], [xx, R5.SPRING, zb], [xx, yb, zb], [xx, ya, za]); else g.quad([xx, R5.SPRING, zb], [xx, R5.SPRING, za], [xx, ya, za], [xx, yb, zb]); }
      const xs = x - sx * 0.2;
      g.mat('flute', '#6d6c7c'); g.box(Math.min(xs, xs - sx * 0.12), 0, -10, Math.max(xs, xs - sx * 0.12), 6.0, 10);
      g.mat('panel', P.indigoDark); g.box(Math.min(xs, xs - sx * 0.7), 6.0, -10.4, Math.max(xs, xs - sx * 0.7), 6.9, 10.4, { bevel: 0.04 });
      g.mat('paint', P.yellow); for (let k = 0; k < 20; k++) { const z = -10 + k; g.box(Math.min(xs, xs - sx * 0.13), 0.05, z, Math.max(xs, xs - sx * 0.13), 0.3, z + 0.5, { faces: sx > 0 ? 'x' : 'X' }); }
    });
    signK(s, { kind: 'board', title: sx > 0 ? 'PLATFORMS 15 ONWARD' : 'PLATFORMS 1 TO 7', lines: ['On round the ring by rim train,', 'from the tube level.', 'Nineteen kilometres round.', 'Nobody walks it.'] }, x - sx * 0.36, 3.0, 0, { face: sx > 0 ? 'x' : 'X', w: 2.8, h: 1.8, glow: 0.8, k: 3 });
    s.solid(sx > 0 ? XE - 0.6 : -XE - 0.5, 0, ZN, sx > 0 ? XE + 0.5 : -XE + 0.6, 19, ZS);
    s.interact({ x: x - sx * 0.5, y: 1.8, z: 0, radius: 4, prompt: 'Read the shutter', onUse: (gm) => say(gm, 'The shutter', ['The platform runs on behind the shutter, right round the rim: 18.8 kilometres, six faces of platform and about 23,000 cab berths on the three decks above.', 'The rim trains run round it underneath, from the tube level. Take the stairs by the well.']) });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the vault: sandstone panels between indigo purlins, a rib every 12 m, the great ribs at the concourse's ends
// ---------------------------------------------------------------------------------------------------------------
function vault(s) {
  const V = R5.V, P = PAL5, g = s.g;
  vaultSkin(s, V, -XE, XE, { skin: P.vault, purlin: P.indigoDark, purlins: [-15, -5.5, 5.5, 15], nz: 18 });
  for (let x = -XE + 12; x < XE - 1; x += 12) {
    const overBay = Math.abs(x) > XM + 1 && Math.abs((Math.abs(x) - 60) % 24) < 0.1;
    const inMid = Math.abs(x) < XM - 1;
    vaultRib(s, V, x, { main: P.indigo, dark: P.indigoDark, brass: P.brass, big: Math.abs(x) === 48,
      y0N: overBay ? 5.4 : inMid && Math.abs(x) < 17 ? 6.4 : 0, y0S: overBay ? 5.4 : inMid ? 4.8 : 0 });
  }
  // cable trays and a big duct along the vault, a work light every 16 m
  runX(-XE, XE, 16, (x0, x1) => s.structure(() => {
    const yt = V.y(-11) - 1.0; g.mat('grille', '#7d8080'); g.box(x0, yt, -11.5, x1, yt + 0.02, -10.5, { faces: 'yY' });
    g.mat('cast', '#4b4f5a'); g.box(x0, yt, -11.52, x1, yt + 0.16, -11.48, { faces: 'zZ' }); g.box(x0, yt, -10.52, x1, yt + 0.16, -10.48, { faces: 'zZ' });
    g.mat('weave', '#2a2d2e'); for (let k = 0; k < 4; k++) g.tube(lineX(x0, x1, yt + 0.06, -11.3 + k * 0.2, 8), 0.035, { segs: 5, caps: false });
    const yd = V.y(11) - 1.1; g.mat('brushed', '#8f948f'); g.tube(lineX(x0, x1, yd, 11, 4), 0.5, { segs: 12, caps: false });
    g.mat('brushed', '#73787a'); g.tube([[x0 + 0.06, yd, 11], [x0 + 0.22, yd, 11]], 0.54, { segs: 12 });
  }));
  for (let x = -XE + 24; x <= XE - 24; x += 24) {
    if (Math.abs(x) < 20) continue;
    const y = V.y(-3) - 3.4;
    s.deco(() => {
      g.mat('cast', '#2a2d2e'); g.tube([[x, V.y(-3) - 0.3, -3], [x, y + 0.36, -3]], 0.018, { segs: 5 });
      g.mat('cast', P.indigoDark); g.lathe(x, -3, [[0.08, y + 0.4], [0.12, y + 0.34], [0.3, y + 0.16], [0.52, y], [0.5, y - 0.02]], { segs: 18, capBottom: false });
      g.mat('diffuser', '#f3f6ff', { emissive: 6 }); g.cyl(x, y + 0.02, -3, 0.4, 0.01, { segs: 16 });
    });
    s.light({ at: [x, y - 0.1, -3], color: warm(4300), power: Math.abs(x) < 60 ? 40 : 30, range: 20, type: 'spot', dir: [0, -1, 0], cone: [66, 30], clip: CLIP, shadow: Math.abs(x) < 100, radius: 0.4 });
  }
  roomGlow(s, -XE, 0, ZN, XE, 18, ZS, { sky: '#e8d4b4', ground: '#8a7f6c', power: 0.12 });
}

// ---------------------------------------------------------------------------------------------------------------
// the glide bays: outbound along the front wall, inbound along the back wall, outside the concourse
// ---------------------------------------------------------------------------------------------------------------
function bays(s, game, f) {
  const P = { main: PAL5.indigo, dark: PAL5.indigoDark, brass: PAL5.brass, yellow: PAL5.yellow };
  const DEST = { out: ['TO SORREL', 'TO SORREL', 'TO SORREL · FOR RUE', 'FREIGHT', 'TO SORREL', 'FREIGHT', 'CLOSED FOR THE CREW'], in: ['FROM SORREL', 'FROM SORREL', 'FROM SORREL', 'FREIGHT IN', 'FROM SORREL', 'FREIGHT IN', 'FROM SORREL'] };
  const sched = (gm) => { const h = gm.clock ? gm.clock.hours : 12; return h >= 1 && h < 5 ? 'freight' : 'cars'; };
  for (const sg of [-1, 1]) for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) {
    const cx = sx * (60 + i * 24), n = sg < 0 ? (sx < 0 ? 7 - i : 8 + i) : (sx < 0 ? 21 - i : 22 + i);
    const L = R5.loops.find((q) => q.cx === cx && q.sg === sg);
    const standing = sg > 0 && cx === 84;
    const kind = L ? 'loop' : standing ? 'car' : 'shut';
    const o = { cx, zE: sg * ZE, sg, n, dest: (sg < 0 ? DEST.out : DEST.in)[i], kind, pal: P, clip: CLIP, wall: 6.75,
      body: ['#a9572e', '#8f3f2a', '#b4452f', '#7a4a3a'][(i + (sg > 0 ? 2 : 0)) % 4], number: 'CAR ' + (4000 + ((cx * 37 + sg * 1301) % 5000 + 5000) % 5000),
      hang: i === 0 && sg < 0 ? { kind: 'hanging', text: 'SORREL', sub: '140 s', emblem: 'drum' } : null };
    const info = bay(s, game, f, o);
    if (L) { o.gateCol = info.gateCol; o.sched = sched; o.standT = 18; carLoop(s, game, f, o, info); }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the island down the outer platforms: planters with lamp standards, benches, fountains, bins
// ---------------------------------------------------------------------------------------------------------------
function island(s, game) {
  const P = PAL5;
  for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) {
    const xc = sx * (60 + i * 24);
    planter(s, xc, 0, 0, { w: 2.2, d: 1.1, h: 0.46, mat: 'panel', tint: P.indigo, plants: ['broad', 'fern', 'flower', 'broad', 'fine'][(i + (sx > 0 ? 2 : 0)) % 5], seed: xc });
    prop(s, 'platform.standard', xc, 0.46, 0, 0, { h: 5.4, metal: P.indigo });
    s.light({ at: [xc, 5.25, 0], color: warm(2900), power: 8, range: 15, clip: CLIP, shadow: i < 3, lamp: true, radius: 0.3 });
    for (const dx of [-8, 8]) {
      const xb = xc + dx;
      if ((i + (dx > 0 ? 1 : 0)) % 3 === 2) { prop(s, 'platform.bin', xb - 0.8, 0, 0, 0, { c: P.indigo }); prop(s, 'platform.fountain', xb + 0.7, 0, 0, 0, {}); continue; }
      prop(s, 'bench', xb, 0, -0.48, PI, { w: 2.2, back: true, wood: '#7a5233', metal: P.indigoDark }); seatOnBench(s, xb, -0.48, PI, 2.2, 'b5' + xb + 'n');
      prop(s, 'bench', xb, 0, 0.48, 0, { w: 2.2, back: true, wood: '#6b4a2f', metal: P.indigoDark }); seatOnBench(s, xb, 0.48, 0, 2.2, 'b5' + xb + 's');
    }
  }
  // the outer walls' furniture: drop pipes, first aid, posters, a bench under each lamp
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) {
    const x = sx * (72 + i * 24);
    prop(s, 'platform.droppipe', x - 1.2, 0, ZN + 0.3, 0, { c: ['#c9a43a', '#a8432e', '#2f6f8f'][i % 3], h: R5.SPRING - 2.2 });
    if (i % 2 === 0) { prop(s, 'platform.aidbox', x + 1.2, 0, ZN + 0.3, 0, {}); }
    lamp(s, 'sconce', x, 3.9, ZN + 0.32, { face: 'Z', clip: CLIP, K: 2700, power: 1.3 });
    lamp(s, 'sconce', x, 3.9, ZS - 0.32, { face: 'z', clip: CLIP, K: 2700, power: 1.3 });
  }
  const posters = [['poster.flight', -75.5], ['poster.feast', 74.2], ['poster.quiet', 98.6], ['poster.booking', -98.4], ['poster.homecoming', 122.4], ['poster.dawn', -122.6]];
  for (const p of posters) if (SIGNS[p[0]]) sign(s, SIGNS[p[0]], p[1], 1.75, ZS - 0.32, { face: 'z' });
}

// ---------------------------------------------------------------------------------------------------------------
// the long bay in the concourse's front wall: three through cars coupled, made up for drums two glides away and more
// ---------------------------------------------------------------------------------------------------------------
function longBay(s, game) {
  const g = s.g, P = PAL5, zE = -ZE, za = zE - 0.65;
  const CARS = [{ cx: -10.5, n: 'CAR 7012', to: 'THROUGH TO RUE', body: '#7a3a5a' }, { cx: 0, n: 'CAR 7013', to: 'THROUGH TO LOVAGE', body: '#2f5d6b' }, { cx: 10.5, n: 'CAR 7014', to: 'THROUGH TO TANSY', body: '#8a5a24' }];
  // the pit's sides and the cars, standing on their cradles
  s.structure(() => {
    g.mat('concrete', '#4a4946'); g.box(-16.15, -2.2, ZN, -16, 0, zE - 0.5, { faces: 'X' }); g.box(16, -2.2, ZN, 16.15, 0, zE - 0.5, { faces: 'x' });
    g.box(-16, -2.2, zE - 0.65, 16, 0, zE - 0.5, { faces: 'z' });
    g.mat('paint', P.yellow); g.box(-16.2, -0.05, zE - 0.57, 16.2, 0.006, zE - 0.43, { faces: 'Y' });
  });
  for (const c of CARS) {
    s.furniture(() => { g.at(c.cx, 0, za, 0); drawCar(g, { interior: false, fakeWindows: true, game, number: c.n, seed: c.cx, body: c.body }); g.pop(); });
    for (const q of carSolids(c.cx, 0, za)) s.solid(q[0], q[1], q[2], q[3], q[4], q[5]);
    s.solid(c.cx - 0.62, 0, za - 1.0, c.cx + 0.62, 2.4, za);
    signK(s, { kind: 'plate', text: c.to, sub: 'stay in your seat at Sorrel' }, c.cx, 2.9, za + 0.02, { face: 'Z', w: 1.6, h: 0.42, glow: 0.4, k: 3 });
  }
  // couplings between the cars: a heavy drawbar and two hoses
  s.furniture(() => {
    for (const x of [-5.25, 5.25]) {
      g.mat('cast', '#2f3335'); g.box(x - 0.8, 0.5, za - 3.3, x + 0.8, 0.85, za - 2.7, { bevel: 0.04 });
      g.mat('cast', P.brass); g.cyl(x, 0.5, za - 3.0, 0.16, 0.36, { segs: 10 });
      g.mat('speckle', '#1b1b1b'); g.tube([[x - 0.7, 1.4, za - 2.2], [x, 1.05, za - 2.2], [x + 0.7, 1.4, za - 2.2]], 0.06, { segs: 6 });
      g.mat('speckle', '#a8432e'); g.tube([[x - 0.7, 1.9, za - 2.0], [x, 1.62, za - 2.0], [x + 0.7, 1.9, za - 2.0]], 0.045, { segs: 6 });
    }
  });
  // the barrier along the long bay: brass-capped posts, a rail, glass, three gates shut
  s.furniture(() => {
    g.mat('cast', P.indigo); for (let x = -16; x <= 16.01; x += 2) g.box(x - 0.06, 0, zE - 0.06, x + 0.06, 1.3, zE + 0.06, { bevel: 0.012 });
    g.mat('paint', P.yellow); g.box(-16, 1.22, zE - 0.055, 16, 1.3, zE + 0.055, { bevel: 0.012 });
    g.mat('cast', P.brass); for (let x = -16; x <= 16.01; x += 2) g.cyl(x, 1.3, zE, 0.07, 0.05, { segs: 10 });
    g.mat('cast', P.indigoDark); g.box(-16, 0.05, zE - 0.04, 16, 0.12, zE + 0.04);
  });
  runX(-16, 16, 2, (a, b) => s.glass(a + 0.07, 0.12, zE, b - 0.07, 1.22, zE, { tint: '#d5e6e2', opacity: 0.1 }));
  s.solid(-16.2, 0, zE - 0.12, 16.2, 2.8, zE + 0.12);
  // the long portal over it: a riveted girder on four columns, with the bay's name
  s.structure(() => {
    g.mat('panel', P.indigo); for (const x of [-16.3, -5.25, 5.25, 16.3]) g.box(x - 0.24, 0, zE - 0.34, x + 0.24, 4.6, zE + 0.34, { bevel: 0.03 });
    g.mat('cast', P.indigoDark); for (const x of [-16.3, -5.25, 5.25, 16.3]) g.box(x - 0.32, 0, zE - 0.42, x + 0.32, 0.45, zE + 0.42, { bevel: 0.02 });
    g.mat('panel', P.indigo); g.box(-16.6, 4.6, zE - 0.4, 16.6, 5.5, zE + 0.4, { bevel: 0.04 });
    g.mat('cast', P.brass, { rough: -0.15 }); g.box(-16.65, 4.6, zE + 0.38, 16.65, 4.68, zE + 0.44); g.box(-16.65, 5.42, zE + 0.38, 16.65, 5.5, zE + 0.44);
    g.mat('panel', P.terra); for (let x = -15.5; x < 16; x += 1.5) g.box(x - 0.04, 4.72, zE + 0.4, x + 0.04, 5.38, zE + 0.43, { faces: 'ZxX' });
  });
  for (const x of [-16.3, -5.25, 5.25, 16.3]) s.solid(x - 0.32, 0, zE - 0.42, x + 0.32, 4.6, zE + 0.42);
  signK(s, { kind: 'street', text: 'THE LONG BAY', sub: 'through cars · made up here · for two glides and more' }, 0, 5.05, zE + 0.45, { face: 'Z', w: 5.4, h: 0.62, glow: 0.9, k: 3 });
  for (const x of [-10.5, 0, 10.5]) lamp(s, 'panel', x, 4.6, zE, { w: 4.0, d: 0.34, clip: CLIP, K: 4000, power: 1.3 });
  lamp(s, 'bulb', 0, 3.8, za - 3, { clip: [-16, -2.3, ZN, 16, 4.6, zE], K: 3600, power: 2.4, range: 14 });
  // the crew making the cars up: a trolley of hoses, a toolbox, a ladder against the middle car
  prop(s, 'platform.ladder', 3.0, 0, za - 0.3, 0, { h: 3.0 }); prop(s, 'platform.toolbox', -12.4, 0, zE + 1.1, 0.4, { c: '#c08a2e' }); prop(s, 'platform.cone', 15.2, 0, zE + 0.8, 0, {}); prop(s, 'platform.cone', -15.2, 0, zE + 0.8, 0, {});
  s.spot('work', 3.0, 0, za + 0.2, PI, { tags: ['crew'] }); s.spot('work', -12.0, 0, zE + 1.5, PI, { tags: ['crew'] }); s.spot('stand', 13.2, 0, zE + 1.4, PI + 0.3, { tags: ['crew'] });
  s.interact({ x: 0, y: 1.6, z: zE + 1.2, radius: 6, wide: true, prompt: 'Read the plates on the through cars', onUse: async (gm) => {
    await say(gm, 'The long bay', [
      'Three armoured cars coupled nose to tail, each with a brass plate: THROUGH TO RUE, THROUGH TO LOVAGE, THROUGH TO TANSY. Stay in your seat at Sorrel.',
      'A car is let go from the quay outside at 174.4 metres a second and falls for 140 seconds, 24.5 kilometres, to Sorrel\'s rim. A through car is caught there, carried round the quay to the next lane, and let go again. Nobody gets out.',
      'Two glides and the quay between: about five minutes to Rue, with your bag still on your knee.',
    ]);
    found(gm, 'rue-two-glides');
  } });
  // the alcoves either side: benches, plinths, notices, a crew corner on the spinward side
  for (const sx of [-1, 1]) {
    for (const x of [sx * 22, sx * 30, sx * 38]) { prop(s, 'bench', x, 0, -16.2, 0, { w: 2.2, back: true, wood: '#7a5233', metal: P.indigoDark }); seatOnBench(s, x, -16.2, 0, 2.2, 'b5a' + x); }
    for (const x of [sx * 26, sx * 34, sx * 42]) planter(s, x, 0, ZN + 0.75, { w: 2.4, d: 0.7, h: 0.55, mat: 'panel', tint: P.indigoDark, plants: 'broad', seed: x });
    lamp(s, 'globe', sx * 30, 3.6, -18.4, { clip: CLIP, K: 2700, power: 1.6, r: 0.22, drop: R5.SPRING - 3.6, range: 9 });
  }
  prop(s, 'platform.lockers', 44.6, 0, ZN + 0.6, 0, { c: '#4f5a7a' }); prop(s, 'platform.lockers', 46.5, 0, ZN + 0.6, 0, { c: '#6e6a5b' });
  s.spot('chat', 44.4, 0, -18.8, 2.3, { tags: ['crew'] }); s.spot('chat', 43.5, 0, -19.8, 0.6, { tags: ['crew'] }); s.spot('chat', 44.8, 0, -20.0, -0.6, { tags: ['crew'] });
  // the riders plate, on the front wall by the long bay
  signK(s, { kind: 'plate', text: 'STATION RING 5', sub: 'at the peak 1.85 million riders an hour each way' }, -20.2, 2.2, ZN + 0.33, { face: 'Z', w: 1.5, h: 0.5, k: 3 });
  s.interact({ x: -20.2, y: 2.0, z: ZN + 0.8, radius: 1.6, prompt: 'Read the brass plate', onUse: async (gm) => {
    await say(gm, 'The brass plate', ['STATION RING 5. Four decks deep and right round the drum: glide trains on the rim deck, cab berths on island platforms on the three decks above.',
      'At the peak this ring passes about 1.85 million riders an hour each way. A thousand-seat train leaves every two seconds or so. The nine rings stand 417 metres apart, front cap to back.']);
    found(gm, 'ring-riders');
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// the concourse's dressing: the floor's pattern, the banners of Herb Row, two great lamp rings, a herb cart, benches
// ---------------------------------------------------------------------------------------------------------------
function concourse(s, game, f) {
  const g = s.g, P = PAL5, V = R5.V;
  // the floor: big panels of a darker terrazzo between the brass lines, a medallion before the lobby
  s.deco(() => {
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++) {
      if ((i + j) % 2) continue;
      const x0 = -48 + i * 12, z0 = -15 + j * 6.2, x1 = x0 + 12, z1 = Math.min(ZS, z0 + 6.2);
      if (z1 > -4.6 && z0 < 4.6 && x1 > -28 && x0 < 28) continue;
      g.mat('terrazzo', '#b89c74'); g.box(x0 + 0.25, 0, z0 + 0.25, x1 - 0.25, 0.002, z1 - 0.25, { faces: 'Y' });
    }
    g.mat('terrazzo', P.indigo); g.lathe(0, 14.6, [[3.4, 0.004], [3.1, 0.004]], { segs: 48, capBottom: false, capTop: false });
    g.mat('terrazzo', P.terra); g.lathe(0, 14.6, [[3.1, 0.0035], [2.2, 0.0035]], { segs: 48, capBottom: false, capTop: false });
    g.mat('terrazzo', '#e9d9b4'); g.lathe(0, 14.6, [[2.2, 0.003], [0, 0.003]], { segs: 48, capBottom: false, capTop: false });
    g.mat('cast', P.brass, { rough: -0.25 });
    for (let k = 0; k < 9; k++) { const a = k / 9 * PI * 2; g.push(); g.move(Math.sin(a) * 2.65, 0, 14.6 + Math.cos(a) * 2.65); g.cyl(0, 0, 0, 0.22, 0.006, { segs: 14 }); g.pop(); g.push(); g.move(Math.sin(a) * 1.15, 0, 14.6 + Math.cos(a) * 1.15); g.rotY(a); g.box(-0.03, 0, -1.0, 0.03, 0.006, 1.0, { faces: 'Y' }); g.pop(); }
    g.cyl(0, 0, 14.6, 0.32, 0.007, { segs: 18 });
  });
  // the banners of Herb Row, hung from the ribs high over the concourse, a pair at each
  const BAN = [[-36, 'SORREL', 'one glide', ['#2f6f73', '#f3e6c8']], [-24, 'RUE', 'two glides', ['#7a3a5a', '#f3e6c8']], [-12, 'LOVAGE', 'two glides', ['#2f5d6b', '#f0d79a']],
    [12, 'TANSY', 'two glides', ['#8a5a24', '#f6ead0']], [24, 'YARROW', 'along the Row', ['#3b4a7a', '#f2c879']], [36, 'BORAGE', 'along the Row', ['#a8432e', '#f6ead0']]];
  for (const [x, t, sub, pal] of BAN) for (const zb of [-18.6, 18.6]) {
    const yTop = V.y(zb) - 0.4, bx = x + (zb > 0 ? 0.5 : -0.5);
    for (const fc of ['z', 'Z']) painted(s, 'ring5.ban.' + t, 1.5, 5.0, 64, drawBanner(t, sub, pal), bx, yTop - 2.9, zb + (fc === 'Z' ? 0.01 : -0.01), { face: fc, tier: 's' });
    s.deco(() => { g.mat('cast', P.brass); g.tube([[bx - 0.85, yTop - 0.38, zb], [bx + 0.85, yTop - 0.38, zb]], 0.03, { segs: 6 }); g.mat('cast', '#2a2d2e'); g.tube([[bx, yTop - 0.38, zb], [bx, yTop + 0.3, zb]], 0.012, { segs: 4 }); });
  }
  // two great lamp rings over the concourse, either side of the well
  for (const cx of [-24, 24]) {
    const cz = 5.5, y = 7.2, R = 2.4;
    s.deco(() => {
      const ring = (r, yy) => { const pts = []; for (let k = 0; k < 36; k++) { const a = k / 36 * PI * 2; pts.push([cx + Math.cos(a) * r, yy, cz + Math.sin(a) * r]); } return pts; };
      g.mat('cast', P.brass, { rough: -0.25 }); g.tube(ring(R, y), 0.06, { segs: 8, closed: true }); g.tube(ring(R * 0.62, y + 0.55), 0.04, { segs: 8, closed: true });
      g.mat('cast', P.indigoDark); for (let k = 0; k < 4; k++) { const a = k * PI / 2 + PI / 4; g.tube([[cx + Math.cos(a) * R, y, cz + Math.sin(a) * R], [cx, y + 2.4, cz]], 0.016, { segs: 4 }); }
      g.tube([[cx, y + 2.4, cz], [cx, V.y(cz) - 0.2, cz]], 0.035, { segs: 6 });
      g.mat('diffuser', '#ffe2b0', { emissive: 4.5, lamp: true });
      for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; g.ball(cx + Math.cos(a) * R, y - 0.22, cz + Math.sin(a) * R, 0.17, 0.21, 0.17, { segs: 10, rings: 7 }); }
      g.mat('cast', P.brass); for (let k = 0; k < 12; k++) { const a = k / 12 * PI * 2; g.cyl(cx + Math.cos(a) * R, y - 0.06, cz + Math.sin(a) * R, 0.07, 0.08, { segs: 8 }); }
    });
    s.light({ at: [cx, y - 0.5, cz], color: warm(2800), power: 26, range: 20, clip: CLIP, shadow: true, lamp: true, radius: 2.0 });
  }
  // short lamp standards at the well's corners
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * 13.2, z = sz * 5.4;
    prop(s, 'platform.standard', x, 0, z, sx * sz > 0 ? 0 : PI / 2, { h: 4.2, metal: P.indigo });
    s.light({ at: [x, 4.05, z], color: warm(2900), power: 5, range: 10, clip: CLIP, lamp: true, radius: 0.3 });
  }
  // the herb cart: bring herbs, not gin
  const hx = -34, hz = -2.4;
  prop(s, 'station.handcart', hx, 0, hz, 0.3, {});
  const r = new Rng(hashStr('herbcart5'));
  for (let i = 0; i < 9; i++) prop(s, 'plant', hx - 0.75 + (i % 3) * 0.5 + r.f(-0.05, 0.05), 0.5, hz - 0.4 + Math.floor(i / 3) * 0.38, r.f(0, 3), { kind: ['fine', 'fern', 'broad'][i % 3], size: 0.38 + r.f(0, 0.1), pot: ['#a3563a', '#c08a2e', '#2f6f73'][i % 3] });
  sign(s, { kind: 'chalk', title: 'Herbs for your host', lines: ['Bring herbs, not gin', 'A bunch  0.03', 'Lovage, dill, shiso, mint', 'Wrapped in a twist of paper'] }, hx + 0.9, 1.05, hz + 0.95, { face: 'Z', w: 0.7, h: 0.8 });
  s.spot('counter', hx, 0, hz - 1.0, 0.3, { tags: ['stall'] }); s.spot('customer', hx + 0.4, 0, hz + 1.1, PI + 0.3, { tags: ['wait'] });
  s.interact({ x: hx, y: 0.9, z: hz + 0.6, radius: 1.7, kind: 'talk', prompt: 'Buy a bunch of herbs for your host', onUse: async (gm) => {
    if (gm.wallet && gm.wallet.spend(0.03, 'A bunch of herbs')) await say(gm, { name: 'The herb seller', colour: '#6b8f4e' }, ['Three hundredths of a kay, and twisted in paper so it travels. Everybody coming in from Sorrel buys gin for their host, and everybody here pours it down the sink of their manners.', 'Bring herbs, not gin. It is the first thing we tell guests and the last thing they listen to.']);
    found(gm, 'bring-herbs');
  } });
  // benches on the concourse, facing the board, and two at each inlay
  for (const sx of [-1, 1]) for (const x of [sx * 32, sx * 40]) { prop(s, 'bench', x, 0, 13.2, PI, { w: 2.4, back: true, wood: '#7a5233', metal: P.indigoDark }); seatOnBench(s, x, 13.2, PI, 2.4, 'b5c' + x); }
  for (const sx of [-1, 1]) planter(s, sx * 40.5, 0, 16.6, { w: 5.0, d: 0.9, h: 0.5, mat: 'panel', tint: P.terra, plants: ['broad', 'fine'][sx > 0 ? 1 : 0], seed: sx });
  void f;
}

// ---------------------------------------------------------------------------------------------------------------
// people: the walkways and the places to stand, wait and queue; the crowd under the board at the half hour
// ---------------------------------------------------------------------------------------------------------------
function life(s, game) {
  // the long walkways down both sides of the island, crossing at every lamp
  const xs = []; for (let x = -208; x <= 208; x += 8) xs.push(x);
  for (const z of [-6, 6]) {
    s.path(xs.filter((x) => x <= -XM).map((x) => [x, z]).concat([[-XM, z]]), { width: 2.4 });
    s.path([[XM, z]].concat(xs.filter((x) => x >= XM).map((x) => [x, z])), { width: 2.4 });
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) { const x = sx * (60 + i * 24); s.path([[x + 4, -6], [x + 4, 6]], { width: 1.4 }); s.path([[x, -6], [x, -ZE + 1.2]], { width: 1.6, tags: ['queue'] }); s.path([[x, 6], [x, ZE - 1.2]], { width: 1.6, tags: ['queue'] }); }
  // the concourse: round the well, to the rooms, under the board
  const ring = [[-XM, -6], [-28, -6], [-14, -6], [0, -7], [14, -6], [28, -6], [XM, -6]];
  s.path(ring, { width: 3.0 });
  s.path([[-XM, 6], [-30, 6], [-14, 6.5], [0, 7], [14, 6.5], [30, 6], [XM, 6]], { width: 3.0 });
  for (const x of [-30, 30, -40, 40]) s.path([[x, -6], [x, 6]], { width: 2.4 });
  s.path([[0, 7], [0, ZS - 1.2]], { width: 2.4 }); s.path([[-38, 6], [-38, ZS + 1.5]], { width: 2.0 }); s.path([[-17.5, 6.5], [-17.5, ZS + 2.0]], { width: 2.0 });
  s.path([[18, 6.5], [18, ZS + 1.0]], { width: 2.0 }); s.path([[33, 6], [33, 18.5]], { width: 1.4 });
  s.path([[0, -7], [0, -12.5]], { width: 2.0 }); s.path([[-24, -6], [-30, -16.5]], { width: 1.6 }); s.path([[24, -6], [30, -16.5]], { width: 1.6 });
  // the stairs down to the tube level
  for (const sx of [-1, 1]) s.path([[sx * 30, 6], [sx * 29.4, 0, 2], [sx * 27.4, 0, 2], [sx * 14.2, -8, 2], [sx * 12, -8, 2]], { width: 1.6 });
  // standing under the board, reading it; the focus of the half-hour crowd
  s.spot('stand', 0, 0, -9.5, PI, { tags: ['board', 'focus'] });
  const r = new Rng(hashStr('ring5crowd'));
  for (let i = 0; i < 26; i++) { const x = r.f(-22, 22), z = r.f(-13.2, -5.5); if (Math.abs(x) < 13 && z > -5.2) continue; s.spot('stand', x, 0, z, PI + Math.atan2(-x, 18) * 0.6 + r.f(-0.15, 0.15), { tags: ['board', 'wait'] }); }
  const chat = (x, z, n, tags) => { for (let i = 0; i < n; i++) { const a = i / n * PI * 2 + 0.3, px = x + Math.sin(a) * 0.6, pz = z + Math.cos(a) * 0.6; s.spot('chat', px, 0, pz, Math.atan2(x - px, z - pz), { tags }); } };
  chat(-32, -9, 3, ['wait']); chat(34, -8, 4, ['wait']); chat(-20, 9.5, 3, ['wait']); chat(22, 12, 2, ['wait']); chat(-40, 14, 3, ['wait']); chat(8, 15, 3, ['wait']); chat(-70, 3, 3, ['wait']); chat(96, -3, 2, ['wait']);
  for (const q of [[-14.5, 10, 0.3], [14.5, 10.4, -0.4], [-26, 13, 2.6], [26, 15, -2.4], [-6, 17.5, 0], [6, 18, 0.2], [42, 4, -1.6], [-42, -2, 1.5]]) s.spot('stand', q[0], 0, q[1], q[2], { tags: ['wait'] });
  // leaning on the well's rail, looking down at the rim trains
  for (const q of [[-8, -4.25, 0], [-3, -4.25, 0], [4, -4.25, 0], [9, -4.25, 0], [-6, 4.25, PI], [2, 4.25, PI], [7.5, 4.25, PI]]) s.spot('stand', q[0], 0, q[1], q[2], { tags: ['rail', 'lean'] });
  // queues at the bays near the concourse, people waiting for their car
  for (const L of R5.loops) { const cx = L.cx, zq = L.sg * (ZE - 0.9); for (let k = 0; k < 4; k++) s.spot('queue', cx + (k % 2) * 0.2, 0, zq - L.sg * k * 0.7, L.sg < 0 ? PI : 0, { tags: ['wait', 'queue'] }); s.spot('work', cx + 5.2, 0, L.sg * (ZE - 1.1), L.sg < 0 ? PI + 0.4 : 0.4, { tags: ['crew', 'porter'] }); }
  for (const q of [[-80, 3.4, 0.5], [110, -3.0, 2.6], [-130, 3.1, -0.4], [150, -3.2, 2.9], [-170, 2.8, 0.2], [180, 3.0, -0.3]]) s.spot('stand', q[0], 0, q[1], q[2], { tags: ['wait'] });
  // sweepers on the concourse
  s.spot('work', -10, 0, 12, 0.3, { tags: ['sweep'] }); s.spot('work', 24, 0, -10, 2.1, { tags: ['sweep'] }); s.spot('work', -66, 0, -4, 1.0, { tags: ['sweep'] });
  // the half-hour crowd: the people here gather under the board for the cars that leave on the half hour
  const list = [];
  for (let h = 6; h <= 22; h++) list.push({ day: 0, from: h + 0.4, to: h + 0.58, place: 'ring-five', k: 0.5 });      // day 0: every day
  magnets(game, s, list);
}

// A long cloth banner: the drum's name down it, a ring for the drum at the top, a fringe at the foot.
function drawBanner(text, sub, pal) {
  return (ctx, w, h) => {
    ctx.fillStyle = pal[0]; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
    ctx.strokeStyle = pal[1]; ctx.globalAlpha = 0.8; ctx.lineWidth = w * 0.035; ctx.strokeRect(w * 0.08, w * 0.08, w * 0.84, h - w * 0.16 - h * 0.06); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.lineWidth = w * 0.05; ctx.arc(w / 2, w * 0.55, w * 0.24, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(w / 2, w * 0.55, w * 0.08, 0, 7); ctx.fillStyle = pal[1]; ctx.fill();
    ctx.save(); ctx.translate(w * 0.54, h * 0.52); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let fs = Math.round(w * 0.62); ctx.font = 'italic 600 ' + fs + 'px ' + SERIF; while (ctx.measureText(text).width > h * 0.62 && fs > 8) { fs--; ctx.font = 'italic 600 ' + fs + 'px ' + SERIF; }
    ctx.fillText(text, 0, 0); ctx.restore();
    ctx.fillStyle = pal[1]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '600 ' + Math.round(w * 0.13) + 'px ' + CAPS; ctx.fillText(sub.toUpperCase(), w / 2, h * 0.87);
    for (let x = w * 0.04; x < w; x += w * 0.08) { ctx.fillRect(x, h * 0.94, w * 0.03, h * 0.06); }
  };
}
