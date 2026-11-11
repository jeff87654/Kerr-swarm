// The Bellows: Chervil's organ hall, on the Middle decks under Ring Four (deck 150 to 154, about 0.8 g).
//
// Music in a drum is made in a different air. Sound runs about 1.8 times as fast in heliox, so a pipe plays about ten
// semitones sharp for its length and an organ needs pipes nearly twice as long for the old notes; and every room is a
// hard box inside a machine, so anything meant for listening is hung deep in felt. Here both rules are built big.
//
//   Bellows Court: an atrium five decks tall whose whole front end is the organ, the Bellows, its bottom C a pipe of
//   17.4 m; the console on a bridge half way up; galleries on every deck looking across at it. Stone, so it rings.
//   The Quilt (lm_felt_organ_quilt.js): the concert hall beside it, four hundred and three seats, walls hung three
//   layers deep in felt patched from squares the blocks of Ring Four gave; the stage set for a rehearsal.
//   Over the foyer (lm_felt_organ_rooms.js): the Cutting Room where flutes are cut to length, the Wind Room, and the
//   Sound Larder, a quiet corridor of listening booths ending in the booth of the old air.
//   The foyer with the cloak counter and the tea stall, the long foyer, the Kettle Room behind the stage, a cab lobby.
//
// Frame 'felt-organ': x spinward, z toward the back cap, y up; deck 150 at y = 0. Plan in lm_felt_organ_props.js.
import { floor, ceiling, lamp, stairs } from '../world/kit.js';
import { railing, column } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { Rng } from '../core/util.js';
import { PI, REGION, DY, TOP, ATR, GAL, BR, STW, STE, SDOOR, FOY, QU, C, toast, find, hour, tick, runX, wallRun, organPlayer } from './lm_felt_organ_props.js';
import { buildOrgan } from './lm_felt_organ_organ.js';
import { buildQuilt } from './lm_felt_organ_quilt.js';
import { buildRooms } from './lm_felt_organ_rooms.js';

const ENV_COURT = { exposure: 1.0, autoKey: 0.15, bloom: 0.08, warmth: 0.12, contrast: 1.1, saturation: 1.1 };
const ENV_STAIR = { exposure: 1.0, autoKey: 0.16, bloom: 0.05, warmth: 0.05 };
const SUB = 'the organ hall · deck 150 to 154 · Ring Four';
const COURT_CLIP = [ATR.x0 - 0.2, -0.3, ATR.z0, ATR.x1 + 0.2, TOP + 0.1, ATR.z1 + 0.3];

export const place = {
  id: 'lm-felt-organ', name: 'The Bellows', order: 10,
  region: REGION,
  stops: [
    { id: 'felt-organ', name: 'The Bellows', sub: 'the organ hall · deck 150 · Ring Four', group: 'The Middle decks', spawn: 'felt-organ', deck: 150, zd: 1460 },
  ],
  async build(game) {
    const t0 = performance.now();
    const W = game.world;
    const f = W.frame('felt-organ', deckRadius(150), 1.9, 1460);
    const s = W.scope('felt-organ', f);
    const r = new Rng(150146);
    const organ = organPlayer(game, s, f);

    courtShell(s);
    await tick(game);
    galleries(s);
    await tick(game);
    stairHall(s, -1); stairHall(s, 1);
    await tick(game);
    courtFloor(game, s, f, r, organ);
    await tick(game);
    await buildOrgan(game, s, f, r, organ);
    await tick(game);
    await buildQuilt(game, s, f, r);
    await tick(game);
    await buildRooms(game, s, f, r);
    await tick(game);
    courtLife(s);
    zonesAndSound(game, s, f, r, organ);

    let left = s.finish(48);
    while (left) { await tick(game); left = s.finish(48); }
    game.spawns['felt-organ'] = { frame: f, x: 0, y: 0, z: 17.6, yaw: 0 };
    console.log('[lm-felt-organ] built in ' + (performance.now() - t0).toFixed(0) + ' ms');
  },
};

// ---------------------------------------------------------------------------------------------------------------
// the court's walls and ceiling
// ---------------------------------------------------------------------------------------------------------------
function courtShell(s) {
  const g = s.g;
  // the two long walls, deck by deck, each with its door to the stair hall
  for (const sx of [-1, 1]) {
    const x = sx * 15.1;
    for (let k = 0; k < 5; k++) {
      const y0 = DY[k], h = k === 4 ? TOP - 16 : 4;
      const o = { tint: C.plaster, t: 0.2, level: k, skirt: k === 0 ? '#3a2a20' : '#4a3424', dado: { h: k === 0 ? 1.2 : 1.0, mat: k === 0 ? 'stone' : 'panel', tint: k === 0 ? '#8f7f68' : C.teal } };
      wallRun(s, 'z', x, ATR.z0, ATR.z1, y0, h, o, [[SDOOR.z0, SDOOR.w, 0, 2.3]]);
      // a painted band at each deck line, and pilasters between the bays
      s.structure((gg) => {
        gg.mat('paint', C.plasterD); if (k > 0) gg.box(sx > 0 ? x - 0.13 : x + 0.1, y0 - 0.6, ATR.z0, sx > 0 ? x - 0.1 : x + 0.13, y0 - 0.45, ATR.z1, { faces: sx > 0 ? 'x' : 'X' });
        gg.mat('plaster', '#c9a678'); for (const z of [-24.6, -17.6, -10.6]) gg.box(sx > 0 ? x - 0.3 : x + 0.1, y0, z - 0.35, sx > 0 ? x - 0.1 : x + 0.3, y0 + (k === 4 ? TOP - 16 : 3.45), z + 0.35, { faces: (sx > 0 ? 'x' : 'X') + 'zZ' });
      }, k);
    }
    // the deck numbers by the stair doors, painted big
    for (let k = 0; k < 5; k++) sign(s, { kind: 'letters', text: String(150 + k), palette: ['#2a1c14'] }, x - sx * 0.12, DY[k] + 2.75, SDOOR.z0 + SDOOR.w + 0.75, { face: sx > 0 ? 'x' : 'X', w: 0.7, h: 0.32, level: k });
  }
  // the back wall over the foyer opening, deck by deck, with the doors of the rooms behind it; the piers each side
  const backHoles = { 2: [[-8.2, 1.3, 0, 2.3], [6.9, 1.3, 0, 2.3]], 3: [[-0.9, 1.8, 0, 2.4]], 4: [[-0.6, 1.2, 0, 2.2]] };
  for (let k = 2; k < 5; k++) {
    const y0 = DY[k], h = k === 4 ? TOP - 16 : 4;
    wallRun(s, 'x', 0.1, -15, 15, y0, h, { tint: C.plaster, t: 0.2, level: k, dado: { h: 1.0, mat: 'panel', tint: C.teal } }, backHoles[k]);
  }
  wallRun(s, 'x', 0.1, -15, 15, FOY.h, DY[2] - FOY.h, { tint: C.plasterD, t: 0.2, skirt: false });
  for (const sx of [-1, 1]) {
    const xa = sx * 15, xb = sx * GAL.xi;
    wallRun(s, 'x', 0.1, Math.min(xa, xb), Math.max(xa, xb), 0, FOY.h, { tint: C.plaster, t: 0.2, dado: { h: 1.2, mat: 'stone', tint: '#8f7f68' } });
  }
  // the lintel over the opening: a deep beam with a gilt line, carried on four columns (rooms.js draws them)
  s.structure((gg) => {
    gg.mat('paint', C.teal); runX(-GAL.xi, GAL.xi, 8, (a, b) => gg.box(a, FOY.h - 0.55, -0.3, b, FOY.h + 0.6, 0.3, { faces: 'zZy' }));
    gg.mat('cast', C.gilt, { rough: -0.2 }); runX(-GAL.xi, GAL.xi, 8, (a, b) => gg.box(a, FOY.h - 0.3, -0.32, b, FOY.h - 0.25, -0.3, { faces: 'zY' }));
  });
  // the front wall behind the organ (its case covers it)
  runX(-15.1, 15.1, 10, (a, b) => wall(s, a, ATR.z0 - 0.1, b, ATR.z0 - 0.1, 0, TOP, { tint: '#2a1c14', t: 0.2, skirt: false }));
  // the ceiling: deep coffers, dark, with a gilt rim to each
  ceiling(s, ATR.x0, ATR.z0, ATR.x1, ATR.z1, TOP, 'paint', '#3a2622');
  runX(ATR.z0, ATR.z1, 8, (za, zb) => s.structure((gg) => {
    gg.mat('wood', '#4a2e1e'); for (let z = Math.ceil(za / 4) * 4; z <= zb; z += 4) gg.box(ATR.x0, TOP - 0.55, z - 0.16, ATR.x1, TOP, z + 0.16, { faces: 'yzZ' });
    for (const x of [-10, -5, 0, 5, 10]) gg.box(x - 0.14, TOP - 0.45, za, x + 0.14, TOP, zb, { faces: 'yxX' });
    gg.mat('cast', C.gilt, { rough: -0.1 }); for (let z = Math.ceil(za / 4) * 4; z <= zb; z += 4) gg.box(ATR.x0, TOP - 0.58, z - 0.04, ATR.x1, TOP - 0.55, z + 0.04, { faces: 'y' });
  }));
}

// ---------------------------------------------------------------------------------------------------------------
// the galleries: side galleries on decks 151 to 154, the back gallery on 152 to 154, columns, rails, their light
// ---------------------------------------------------------------------------------------------------------------
function galleries(s) {
  const g = s.g;
  for (let k = 1; k < 5; k++) {
    const y = DY[k];
    for (const sx of [-1, 1]) {
      const xo = sx * GAL.xo, xi = sx * GAL.xi, za = k === 2 ? BR.z1 : GAL.z0;
      floor(s, Math.min(xo, xi), za, Math.max(xo, xi), 0, y, 'planks', '#8a6040', { level: k });
      // a runner down the middle of the boards
      s.deco((gg) => { gg.mat('felt', C.madder); gg.box(sx * 12.75, y, za + 0.4, sx * 13.85, y + 0.006, -0.4, { faces: 'Y' }); }, k);
      // the slab's edge toward the void and its underside
      s.structure((gg) => {
        gg.mat('paint', C.teal); gg.box(Math.min(xi, xi - sx * 0.12), y - 0.55, za, Math.max(xi, xi - sx * 0.12), y + 0.02, k > 1 ? GAL.back : 0, { faces: sx > 0 ? 'xyY' : 'XyY' });
        gg.mat('cast', C.gilt, { rough: -0.2 }); gg.box(Math.min(xi - sx * 0.12, xi - sx * 0.14), y - 0.32, za, Math.max(xi - sx * 0.12, xi - sx * 0.14), y - 0.26, k > 1 ? GAL.back : 0, { faces: sx > 0 ? 'x' : 'X' });
        gg.mat('paint', '#e6d2b0'); gg.box(Math.min(xo, xi), y - 0.56, za, Math.max(xo, xi), y - 0.55, 0, { faces: 'y' });
        if (k !== 2) { gg.mat('paint', C.teal); gg.box(Math.min(xo, xi), y - 0.55, za - 0.12, Math.max(xo, xi), y + 0.02, za, { faces: 'zyY' }); }
      }, k);
    }
    if (k >= 2) {
      floor(s, -GAL.xi, GAL.back, GAL.xi, 0, y, 'planks', '#8a6040', { level: k });
      s.structure((gg) => {
        runX(-GAL.xi, GAL.xi, 8, (a, b) => {
          gg.mat('paint', C.teal); gg.box(a, y - 0.55, GAL.back - 0.12, b, y + 0.02, GAL.back, { faces: 'zyY' });
          gg.mat('cast', C.gilt, { rough: -0.2 }); gg.box(a, y - 0.32, GAL.back - 0.14, b, y - 0.26, GAL.back - 0.12, { faces: 'z' });
          gg.mat('paint', '#e6d2b0'); gg.box(a, y - 0.56, GAL.back, b, y - 0.55, 0, { faces: 'y' });
        });
      }, k);
      s.deco((gg) => { gg.mat('felt', C.madder); runX(-11, 11, 8, (a, b) => gg.box(a, y, -2.2, b, y + 0.006, -1.2, { faces: 'Y' })); }, k);
    }
    // rails: brass on iron, every deck
    const ro = { h: 1.05, tint: '#2a3434', rail: C.brass, railMat: 'cast', level: k };
    if (k === 1) for (const sx of [-1, 1]) railing(s, [[sx * 15, GAL.z0], [sx * GAL.xi, GAL.z0], [sx * GAL.xi, -14], [sx * GAL.xi, 0]], y, ro);
    else if (k === 2) {
      railing(s, [[-GAL.xi, BR.z1], [-GAL.xi, -14], [-GAL.xi, GAL.back]], y, ro); railing(s, [[GAL.xi, BR.z1], [GAL.xi, -14], [GAL.xi, GAL.back]], y, ro);
      railing(s, [[-GAL.xi, GAL.back], [-4, GAL.back], [4, GAL.back], [GAL.xi, GAL.back]], y, ro);
    } else {
      railing(s, [[-15, GAL.z0], [-GAL.xi, GAL.z0], [-GAL.xi, -14], [-GAL.xi, GAL.back], [-4, GAL.back], [4, GAL.back], [GAL.xi, GAL.back], [GAL.xi, -14], [GAL.xi, GAL.z0], [15, GAL.z0]], y, ro);
    }
  }
  // iron columns at the gallery fronts, deck on deck, teal with gilt capitals
  for (let k = 0; k < 5; k++) {
    const y = DY[k], h = k === 4 ? TOP - 16 - 0.6 : 3.45;
    for (const sx of [-1, 1]) for (const z of [GAL.z0 + 0.5, -21, -14, -7]) {
      if (k === 2 && z < -27) continue;
      column(s, sx * (GAL.xi + 0.25), y, z, h, { r: 0.13, mat: 'cast', tint: C.teal, level: k });
      s.deco((gg) => { gg.mat('cast', C.gilt, { rough: -0.2 }); gg.lathe(sx * (GAL.xi + 0.25), z, [[0.15, y + h - 0.32], [0.24, y + h - 0.08], [0.24, y + h]], { segs: 12 }); }, k);
    }
  }
  // light along every gallery and under it: a warm tube in the soffit, and one along the ground-floor aisles
  for (let k = 0; k < 5; k++) {
    const y = k === 4 ? TOP - 0.7 : DY[k] + 3.4;
    for (const sx of [-1, 1]) {
      s.light({ at: [sx * 13.3, y, GAL.z0 + 1.5], to: [sx * 13.3, y, -1.5], type: 'tube', color: [1.0, 0.78, 0.52], power: 4.2, range: 6.5, radius: 0.2, lamp: true, clip: [Math.min(sx * 11.2, sx * 15.2), DY[k] - 0.2, GAL.z0 - 0.4, Math.max(sx * 11.2, sx * 15.2), DY[k] + 4, 0.2] });
      s.deco((gg) => { gg.mat('diffuser', '#ffd9a0', { emissive: 2.6, lamp: true }); gg.box(sx * 13.3 - 0.05, y - 0.03, GAL.z0 + 1.5, sx * 13.3 + 0.05, y, -1.5, { faces: 'yxX' }); }, k);
    }
    if (k >= 2) {
      s.light({ at: [-10, y, -1.7], to: [10, y, -1.7], type: 'tube', color: [1.0, 0.78, 0.52], power: 3.4, range: 5.5, radius: 0.2, lamp: true, clip: [-11.8, DY[k] - 0.2, -3.6, 11.8, DY[k] + 4, 0.2] });
      s.deco((gg) => { gg.mat('diffuser', '#ffd9a0', { emissive: 2.6, lamp: true }); runX(-10, 10, 8, (a, b) => gg.box(a, y - 0.03, -1.75, b, y, -1.65, { faces: 'yzZ' })); }, k);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// a stair hall each side of the court: switchback flights round a stone spine, a landing and a door on every deck
// ---------------------------------------------------------------------------------------------------------------
function stairHall(s, sx) {
  const S = sx < 0 ? STW : STE, g = s.g;
  const xo = sx < 0 ? S.x0 : S.x1, xi = sx < 0 ? S.x1 : S.x0;            // outer and court-side x
  const xA = sx * 18.45, xB = sx * 16.05, xs = sx * 17.25;               // flight A (up from a deck), flight B (up to the next), the spine
  const lz0 = -3.25, lz1 = S.z1, hz0 = S.z0, hz1 = -7.4;
  const clipAll = [Math.min(xo, xi) - 0.1, -0.2, S.z0 - 0.1, Math.max(xo, xi) + 0.1, TOP, S.z1 + 0.1];
  floor(s, Math.min(xo, xi), S.z0, Math.max(xo, xi), S.z1, 0, 'stone', '#9a8f7e');
  ceiling(s, Math.min(xo, xi), S.z0, Math.max(xo, xi), S.z1, TOP, 'paint', '#d9cbb0');
  // the outer walls (the east hall's outer wall below the Quilt's roof is the Quilt's)
  const wo = { tint: '#e3d5b8', t: 0.2, dado: { h: 1.1, mat: 'paint', tint: '#5b6a62' } };
  if (sx < 0) wallRun(s, 'z', xo - 0.05, S.z0, S.z1, 0, TOP, wo);
  else wallRun(s, 'z', 19.55, S.z0, S.z1, QU.h, TOP - QU.h, wo);
  wallRun(s, 'x', S.z0 - 0.1, Math.min(xo, xi), Math.max(xo, xi), 0, TOP, wo);
  wallRun(s, 'x', S.z1 + 0.1, Math.min(xo, xi), Math.max(xo, xi), 0, TOP, wo);
  // the spine between the flights
  s.structure((gg) => { gg.mat('plaster', '#cdbd9e'); gg.box(xs - 0.42, 0, hz1, xs + 0.42, TOP, lz0, { faces: 'xXzZ' }); gg.mat('paint', '#5b6a62'); gg.box(xs - 0.43, 0, hz1, xs + 0.43, 1.1, lz0, { faces: 'xX' }); });
  s.solid(xs - 0.42, 0, hz1, xs + 0.42, TOP, lz0);
  for (let k = 0; k < 5; k++) {
    const y = DY[k];
    if (k > 0) s.structure((gg) => { gg.mat('stone', '#a89c88'); gg.box(Math.min(xo, xi), y - 0.3, lz0, Math.max(xo, xi), y, lz1, { bevel: 0.01 }); }, k);
    if (k > 0) s.solid(Math.min(xo, xi), y - 0.3, lz0, Math.max(xo, xi), y, lz1, { surf: 'stone' });
    if (k < 4) {
      stairs(s, xA, y, lz0, 'z', 2, lz0 - hz1, 1.5, { mat: 'stone', tint: '#b3a690', level: k });
      s.structure((gg) => { gg.mat('stone', '#a89c88'); gg.box(Math.min(xo, xi), y + 1.7, hz0, Math.max(xo, xi), y + 2, hz1, { bevel: 0.01 }); }, k);
      s.solid(Math.min(xo, xi), y + 1.7, hz0, Math.max(xo, xi), y + 2, hz1, { surf: 'stone' });
      stairs(s, xB, y + 2, hz1, 'Z', 2, lz0 - hz1, 1.5, { mat: 'stone', tint: '#b3a690', level: k });
      // a handrail on the outer wall of each flight
      s.deco((gg) => { gg.mat('cast', C.brass, { rough: -0.2 }); gg.tube([[sx * 19.25, y + 0.95, lz0], [sx * 19.25, y + 2.95, hz1]], 0.025, { segs: 6 }); gg.tube([[sx * 15.32, y + 2.95, hz1], [sx * 15.32, y + 4.95, lz0]], 0.025, { segs: 6 }); }, k);
    } else {
      railing(s, [[sx * 19.3, lz0], [sx * 17.6, lz0]], y, { h: 1.05, tint: '#2a3434', rail: C.brass, railMat: 'cast', level: k });
    }
    // the deck's number on the spine, facing the landing; a lamp on the outer wall
    sign(s, { kind: 'letters', text: String(150 + k), palette: ['#2f3f3a'] }, xs, y + 2.2, lz0 + 0.01, { face: 'Z', w: 0.7, h: 0.32, level: k });
    lamp(s, 'sconce', xo + sx * -0.12, y + 2.5, -2.4, { face: sx < 0 ? 'X' : 'x', K: 3000, power: 1.1, range: 6, clip: clipAll, level: k });
  }
  s.zoneBox({ id: sx < 0 ? 'fo-stair-w' : 'fo-stair-e', place: 'felt-organ', box: [Math.min(xo, xi), -0.5, S.z0, Math.max(xo, xi), TOP, S.z1], name: 'The stair', sub: SUB, ambience: 'quiet', reverb: 'ring', headroom: 3.4, env: ENV_STAIR });
  // the walkway up the stairs, deck by deck
  for (let k = 0; k < 4; k++) {
    const y = DY[k];
    s.path([[xi + sx * 0.9, y, -2.4], [xA, y, -2.6], [xA, y, lz0 - 0.2], [xA, y + 2, hz1 + 0.2], [xA, y + 2, -8.2], [xB, y + 2, -8.2], [xB, y + 2, hz1 + 0.2], [xB, y + 4, lz0 - 0.2], [xB, y + 4, -2.6], [xi + sx * 0.9, y + 4, -2.4]], { width: 1.2 });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the court's floor: terrazzo with an inlaid aisle; benches for listening; the lanterns
// ---------------------------------------------------------------------------------------------------------------
function courtFloor(game, s, f, r, organ) {
  const g = s.g;
  floor(s, ATR.x0, -29.75, ATR.x1, ATR.z1, 0, 'terrazzo', C.floor);
  s.deco((gg) => {
    gg.mat('terrazzo', C.madder); runX(-29, -1, 8, (a, b) => gg.box(-1.2, 0, a, 1.2, 0.004, b, { faces: 'Y' }));
    gg.mat('terrazzo', '#2a3a3a'); runX(-29, -1, 8, (a, b) => { gg.box(-1.5, 0, a, -1.2, 0.005, b, { faces: 'Y' }); gg.box(1.2, 0, a, 1.5, 0.005, b, { faces: 'Y' }); });
    // a band across under the bridge, where the organ's light falls
    gg.mat('terrazzo', '#c9b490'); gg.box(-11.6, 0, -29.4, 11.6, 0.004, -27.2, { faces: 'Y' });
    gg.mat('terrazzo', '#2a3a3a'); for (const z of [-29.45, -27.2]) gg.box(-11.6, 0, z - 0.06, 11.6, 0.005, z + 0.06, { faces: 'Y' });
  });
  // benches in rows facing the organ, a little curved, every one a different age
  const woods = ['#7a5233', '#6b4429', '#8a6040', '#5a3a24', '#7a5a3a'];
  for (let row = 0; row < 6; row++) {
    const z = -22.5 + row * 2.6;
    for (const side of [-1, 1]) for (const b of [0, 1]) {
      const x = side * (2.9 + b * 4.2), yaw = PI + side * (b ? 0.08 : 0.03);
      prop(s, 'bench', x, 0, z, yaw, { w: 3.6, wood: woods[(row + b * 2 + (side > 0 ? 1 : 0)) % woods.length], back: true });
    }
  }
  // a felt cushion here and there, a coat over a back, a lidded cup left under a bench
  s.detail((gg) => {
    const cols = [C.saffron, C.madder, C.tealL, C.plum];
    for (let i = 0; i < 9; i++) { const row = r.i(0, 5), x = (r.chance(0.5) ? -1 : 1) * r.f(1.6, 8.6), z = -22.5 + row * 2.6; gg.mat('felt', r.pick(cols)); gg.box(x - 0.22, 0.46, z - 0.18, x + 0.22, 0.52, z + 0.18, { bevel: 0.025 }); }
    for (let i = 0; i < 4; i++) { const row = r.i(0, 5), x = (r.chance(0.5) ? -1 : 1) * r.f(1.6, 8.6), z = -22.5 + row * 2.6 + 0.24; gg.mat('weave', r.pick(['#3f4a5a', '#7a3a2a', '#4a5a3a', '#6a5a4a'])); gg.box(x - 0.24, 0.55, z - 0.02, x + 0.24, 0.98, z + 0.05, { bevel: 0.03 }); gg.mat('knit', C.saffron); gg.box(x - 0.08, 0.7, z + 0.05, x + 0.02, 0.78, z + 0.056, { faces: 'Z' }); }
  });
  for (let i = 0; i < 3; i++) prop(s, 'cup', (r.chance(0.5) ? -1 : 1) * r.f(2, 8), 0, -22.2 + r.i(0, 5) * 2.6, 0, { glaze: r.pick(['#d9cfb8', '#a3563a', '#2f6f73']) });
  // the lanterns: nine felt lanterns on long cords, the court's own light, at three heights
  const lc = [C.saffron, '#e07a3a', C.saffron, '#c4553a', '#e8b84a', '#c4553a', C.saffron, '#e07a3a', '#e8b84a'];
  let i = 0;
  for (const z of [-22, -14, -6]) for (const x of [-6.5, 0, 6.5]) {
    const y = 11.5 + ((i * 5) % 3) * 1.4;
    lamp(s, 'lantern', x, y, z, { tint: lc[i], r: 0.5, hh: 0.8, drop: TOP - y - 0.4, power: 3.2, range: 15, K: 2600, clip: COURT_CLIP });
    i++;
  }
  // the court's own bounce light: warm off stone and gilt
  s.ambient({ box: COURT_CLIP, sky: '#ffcf96', ground: '#b88a5a', power: 0.16, soft: 1.5, spec: 0.5, lamp: true });
  // sit and listen: the front benches
  for (const x of [-2.9, 2.9]) {
    const z = -22.5;
    s.interact({ x, y: 0.9, z: z + 0.6, radius: 1.5, prompt: 'Sit and listen', onUse: async (gm) => {
      if (gm.player && gm.player.sit) { gm.player.sit({ x, y: 0, z: z + 0.05, yaw: PI }); gm.player.yaw = 0; gm.player.pitch = 0.32; }
      const h = hour(gm);
      if (h >= 23 || h < 7) { toast(gm, 'The console is dark. Somebody has left a cushion on the bench up there.'); return; }
      if (!organ.busy()) {
        toast(gm, 'Up on the bridge the organist sees you sit down, and starts the drum\'s tune again from the top.');
        setTimeout(() => organ.theme({ spb: 0.9 }), 1600);
      } else toast(gm, 'The organist is half way through something. You sit, and let the court ring.');
      find(gm, 'long-pipes');
    } });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// people in the court and on the galleries
// ---------------------------------------------------------------------------------------------------------------
function courtLife(s) {
  // the walkways: down the middle aisle to the organ, along the aisles under the galleries, along every gallery
  s.path([[0, 4], [0, 0.5], [0, -12], [0, -26.8]], { width: 2.2 });
  s.path([[0, -26.8], [-8, -27.6], [-13.3, -27.6], [-13.3, -14], [-13.3, -2.4], [-14.2, -2.4]], { width: 1.6 });
  s.path([[0, -26.8], [8, -27.6], [13.3, -27.6], [13.3, -14], [13.3, -2.4], [14.2, -2.4]], { width: 1.6 });
  s.path([[0, -12], [-9.4, -12], [-13.3, -14]], { width: 1.4 });
  s.path([[0, -12], [9.4, -12], [13.3, -14]], { width: 1.4 });
  s.path([[0, 0.5], [-9.6, -1.5], [-13.3, -2.4]], { width: 1.4 });
  s.path([[0, 0.5], [9.6, -1.5], [13.3, -2.4]], { width: 1.4 });
  for (let k = 1; k < 5; k++) {
    const y = DY[k];
    for (const sx of [-1, 1]) s.path([[sx * 14.2, y, -2.4], [sx * 13.3, y, -2.4], [sx * 13.3, y, -14], [sx * 13.3, y, k === 2 ? -27.6 : -27.2]], { width: 1.4 });
    if (k >= 2) s.path([[-13.3, y, -2.4], [-13.3, y, -1.6], [-4, y, -1.6], [0, y, -1.6], [4, y, -1.6], [13.3, y, -1.6], [13.3, y, -2.4]], { width: 1.4 });
    // people at the rails, looking across at the pipes
    for (const sx of [-1, 1]) for (const z of [-25.5, -18.4, -9.8]) s.spot('stand', sx * (GAL.xi + 0.55), y, z + (k % 2) * 1.3, sx > 0 ? -PI / 2 - 0.5 : PI / 2 + 0.5, { tags: ['rail'] });
    if (k >= 2) for (const x of [-6, 5.2]) s.spot('stand', x, y, GAL.back + 0.55, PI, { tags: ['rail'] });
  }
  // a pair talking on the floor by the aisle, a pair under the west gallery
  s.spot('chat', -1.9, 0, -25.8, -0.6, { tags: ['view'] }); s.spot('chat', -2.7, 0, -25.1, 2.4, { tags: ['view'] });
  s.spot('chat', -13.1, 0, -10.6, 0.4, {}); s.spot('chat', -12.8, 0, -9.6, 2.9, {}); s.spot('chat', -13.7, 0, -9.8, -2.2, {});
  s.spot('stand', 9.8, 0, -28.6, PI, { tags: ['view'] });
}

// ---------------------------------------------------------------------------------------------------------------
// zones, loops, the organist practising, the first-time card
// ---------------------------------------------------------------------------------------------------------------
function zonesAndSound(game, s, f, r, organ) {
  s.zoneBox({ id: 'fo-court', place: 'felt-organ', box: [ATR.x0 - 0.1, -0.5, ATR.z0, ATR.x1 + 0.1, TOP, ATR.z1], name: 'Bellows Court', sub: SUB, ambience: 'quiet', reverb: 'hall', headroom: TOP, env: ENV_COURT });
  s.court(ATR.x0 - 6, ATR.z0, ATR.x1 + 6, ATR.z1 + 14);
  s.loop('murmur', 0, 1.2, -14, { vol: 0.22, radius: 14, param: 0.3 });
  s.loop('air', 0, TOP - 1, -16, { vol: 0.12, radius: 20 });
  // the organist practises while there is anyone in the court to hear, from nine in the morning till half past nine at night
  let wait = 8 + r.f(0, 6), seen = false;
  s.every((dt, gm) => {
    if (!gm || !gm.zone || gm.zone.scope !== s) return;
    const id = gm.zone.id;
    if (!seen && id === 'fo-court') { seen = true; toast(gm, 'A court five decks tall, and its whole front end is pipes.'); }
    if (id !== 'fo-court' && id !== 'fo-foyer') return;
    const h = hour(gm); if (h < 9 || h >= 21.5) return;
    if (organ.busy()) return;
    wait -= dt; if (wait > 0) return;
    wait = 30 + Math.random() * 45;
    organ.practice(Math.random());
  });
  void f;
}
